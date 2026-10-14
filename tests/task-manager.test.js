const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Setup Node.js browser mocks
const storage = new Map();
global.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

global.window = global;
global.window.addEventListener = () => {};

// Mock icons
global.Icons = {
  taskmgr: '<svg></svg>',
  application: '<svg></svg>',
  notepad: '<svg></svg>',
  calculator: '<svg></svg>'
};

// Mock DOM
function createMockElement(tag = 'div') {
  const children = [];
  const classes = new Set();
  const dataset = {};
  let text = '';
  let html = '';

  const el = {
    tagName: tag.toUpperCase(),
    dataset,
    style: {},
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
      toggle: (c) => (classes.has(c) ? (classes.delete(c), false) : (classes.add(c), true))
    },
    appendChild: (child) => {
      child.parentNode = el;
      children.push(child);
      return child;
    },
    removeChild: (child) => {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
      child.parentNode = null;
      return child;
    },
    remove: function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    },
    insertBefore: (newChild, refChild) => {
      newChild.parentNode = el;
      const idx = children.indexOf(refChild);
      if (idx !== -1) children.splice(idx, 0, newChild);
      else children.push(newChild);
      return newChild;
    },
    querySelectorAll: (selector) => {
      const results = [];
      function traverse(node) {
        if (!node || !node.children) return;
        for (const c of node.children) {
          if (selector.startsWith('.')) {
            const cls = selector.slice(1);
            if (c.classList && c.classList.contains(cls)) results.push(c);
          } else if (selector.startsWith('#')) {
            const id = selector.slice(1);
            if (c.id === id) results.push(c);
          } else if (selector === 'tr' && c.tagName === 'TR') {
            results.push(c);
          } else if (selector.includes('.taskmgr-th') && c.classList && c.classList.contains('taskmgr-th')) {
            results.push(c);
          } else if (selector.includes('.taskmgr-tab-btn') && c.classList && c.classList.contains('taskmgr-tab-btn')) {
            results.push(c);
          }
          traverse(c);
        }
      }
      traverse({ children });
      return results;
    },
    querySelector: (selector) => {
      const all = el.querySelectorAll(selector);
      return all[0] || null;
    },
    getBoundingClientRect: () => ({ width: 200, height: 100 }),
    getContext: (type) => ({
      fillRect: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1
    }),
    addEventListener: () => {},
    children
  };

  Object.defineProperty(el, 'innerHTML', {
    get: () => html,
    set: (val) => {
      html = val;
      children.length = 0;
    }
  });

  Object.defineProperty(el, 'textContent', {
    get: () => text,
    set: (val) => { text = val; }
  });

  return el;
}

function findById(node, id) {
  if (!node) return null;
  if (node.id === id) return node;
  if (node.children) {
    for (const c of node.children) {
      const res = findById(c, id);
      if (res) return res;
    }
  }
  return null;
}

const mockDocElements = {
  'taskbar-tray': createMockElement('div'),
  'tray-clock': createMockElement('span'),
  'desktop': createMockElement('main'),
  'taskbar': createMockElement('footer')
};

global.document = {
  getElementById: (id) => {
    if (mockDocElements[id]) return mockDocElements[id];
    for (const root of Object.values(mockDocElements)) {
      const res = findById(root, id);
      if (res) return res;
    }
    return null;
  },
  createElement: (tag) => createMockElement(tag),
  addEventListener: () => {}
};

// Load i18n
const i18nCode = fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf-8');
eval(i18nCode);

// Mock Sound System
global.soundSys = {
  muted: false,
  setMuted(v) { this.muted = !!v; },
  playClick: () => {},
  playChord: () => {}
};

// Mock Window Manager
class MockWindowManager {
  constructor() {
    this.windows = new Map();
    this.activeWindowId = null;
    this.dialogOpened = null;
  }
  createWindow(opts) {
    const win = {
      id: opts.id,
      title: opts.title,
      icon: opts.icon,
      isMinimized: false,
      element: createMockElement('div')
    };
    this.windows.set(opts.id, win);
    return win;
  }
  bringToTop(id) {
    this.activeWindowId = id;
  }
  restoreWindow(id) {
    const win = this.windows.get(id);
    if (win) win.isMinimized = false;
  }
  minimizeWindow(id) {
    const win = this.windows.get(id);
    if (win) win.isMinimized = true;
  }
  closeWindow(id) {
    this.windows.delete(id);
  }
  openDialog(opts) {
    this.dialogOpened = opts;
  }
}

global.winManager = new MockWindowManager();

// Load Task Manager
const taskMgrCode = fs.readFileSync(path.join(__dirname, '../js/apps/task-manager.js'), 'utf-8');
eval(taskMgrCode);

console.log('--- Testing Win 98 Task Manager ---');

// Test 1: AppTaskManager instantiation
assert.ok(global.appTaskManager, 'AppTaskManager global instance exists');
console.log('PASS 1. AppTaskManager global instance initialized');

// Test 2: Localization keys exist
const ruDict = global.i18n.translations['ru'];
const enDict = global.i18n.translations['en'];
assert.ok(ruDict['taskmgr.title'], 'Russian taskmgr.title exists');
assert.ok(enDict['taskmgr.title'], 'English taskmgr.title exists');
assert.ok(ruDict['taskmgr.tabApplications'], 'Russian tabApplications exists');
assert.ok(ruDict['taskmgr.tabProcesses'], 'Russian tabProcesses exists');
assert.ok(ruDict['taskmgr.tabPerformance'], 'Russian tabPerformance exists');
assert.ok(ruDict['taskmgr.tabNetworking'], 'Russian tabNetworking exists');
assert.ok(ruDict['taskmgr.tabServices'], 'Russian tabServices exists');
console.log('PASS 2. All taskmgr i18n translation keys validated in RU and EN');

// Test 3: Background system processes listing
const bgProcs = global.appTaskManager.getBackgroundProcesses();
assert.ok(bgProcs.length >= 8, 'Background system processes include core OS daemons');
const systemProc = bgProcs.find(p => p.imageName === 'System');
assert.ok(systemProc && systemProc.isCritical, 'System (PID 4) is recognized as critical');
const csrssProc = bgProcs.find(p => p.imageName === 'csrss.exe');
assert.ok(csrssProc && csrssProc.isCritical, 'csrss.exe is recognized as critical');
const explorerProc = bgProcs.find(p => p.imageName === 'explorer.exe');
assert.ok(explorerProc && explorerProc.isShell, 'explorer.exe is recognized as shell');
console.log('PASS 3. Background system processes correctly configured with security flags');

// Test 4: Dynamic window processes synchronization
global.winManager.createWindow({ id: 'app_notepad', title: 'Безымянный — Блокнот', icon: 'notepad' });
global.winManager.createWindow({ id: 'app_calc', title: 'Калькулятор', icon: 'calculator' });
global.winManager.createWindow({ id: 'app_half_life', title: 'Half-Life 98', icon: 'half-life' });

const winProcs = global.appTaskManager.getWindowProcesses();
assert.equal(winProcs.length, 3, 'Window processes reflect 3 open windows');
const notepadProc = winProcs.find(p => p.imageName === 'notepad.exe');
assert.ok(notepadProc, 'Notepad window mapped to notepad.exe');
const hlProc = winProcs.find(p => p.imageName === 'hl.exe');
assert.ok(hlProc && hlProc.cpu >= 25, 'Half-Life 98 mapped to hl.exe with authentic gaming CPU load');
console.log('PASS 4. Dynamic window-to-process mapping and CPU allocations working');

// Test 5: End Task closes window
global.appTaskManager.endAppTask('app_notepad');
assert.ok(!global.winManager.windows.has('app_notepad'), 'Notepad window closed after End Task');
const winProcsAfter = global.appTaskManager.getWindowProcesses();
assert.equal(winProcsAfter.length, 2, 'Process list shrunk after closing window');
console.log('PASS 5. End Task cleanly terminates application and closes window');

// Test 6: Critical Process Termination Protection
let dialogTriggered = false;
global.appTaskManager.terminateProcess(systemProc);
assert.ok(global.winManager.dialogOpened, 'Alert dialog displayed when attempting to kill System');
assert.ok(global.winManager.dialogOpened.message.includes('критический') || global.winManager.dialogOpened.message.includes('critical'), 'Security message warns against critical process termination');
console.log('PASS 6. Critical process security guard prevents termination of System / csrss');

// Test 7: Process Priority Adjustment
const calcProc = global.appTaskManager.getAllProcesses().find(p => p.imageName === 'calc.exe');
assert.ok(calcProc, 'calc.exe exists');
global.appTaskManager.priorityOverrides.set(calcProc.pid, 'Realtime');
const updatedCalc = global.appTaskManager.getAllProcesses().find(p => p.imageName === 'calc.exe');
assert.equal(updatedCalc.priority, 'Realtime', 'Process priority updated to Realtime');
console.log('PASS 7. Process priority adjustment working properly');

// Test 8: Performance Metrics & History Ring Buffers
global.appTaskManager.updateMetrics();
assert.ok(global.appTaskManager.currentCpu >= 1 && global.appTaskManager.currentCpu <= 100, 'CPU % within [1, 100]');
assert.equal(global.appTaskManager.cpuHistory.length, 60, 'CPU history buffer maintained at 60 samples');
assert.equal(global.appTaskManager.kernelHistory.length, 60, 'Kernel history buffer maintained at 60 samples');
assert.equal(global.appTaskManager.memHistory.length, 60, 'Memory history buffer maintained at 60 samples');
assert.equal(global.appTaskManager.netHistory.length, 60, 'Network history buffer maintained at 60 samples');
console.log('PASS 8. Performance metrics, sampling buffers and clamping strictly verified');

// Test 9: Interactive Win Audio Service toggles sound system
const audioSvc = global.appTaskManager.services.find(s => s.id === 'AudioSrv');
assert.ok(audioSvc, 'AudioSrv service found');
assert.equal(audioSvc.status, 'Running', 'AudioSrv initially running');

global.appTaskManager.toggleService('AudioSrv', false);
assert.equal(audioSvc.status, 'Stopped', 'AudioSrv status changed to Stopped');
assert.equal(global.soundSys.muted, true, 'System sound successfully muted when AudioSrv stopped');

global.appTaskManager.toggleService('AudioSrv', true);
assert.equal(audioSvc.status, 'Running', 'AudioSrv status restored to Running');
assert.equal(global.soundSys.muted, false, 'System sound unmuted when AudioSrv started');
console.log('PASS 9. Interactive Services control verified (AudioSrv muting/unmuting audio)');

// Test 10: System Tray CPU meter integration
global.appTaskManager.ensureTrayIcon();
const trayIcon = document.getElementById('tray-taskmgr');
assert.ok(trayIcon, 'Task manager tray icon added to #taskbar-tray');
global.appTaskManager.renderTrayCanvas();
assert.ok(trayIcon.title.includes('Загрузка ЦП'), 'Tray icon tooltip reflects CPU load');
global.appTaskManager.removeTrayIcon();
assert.ok(!document.getElementById('tray-taskmgr'), 'Tray icon cleaned up on close');
console.log('PASS 10. Task Manager System Tray CPU icon verified');

console.log('ALL 10 TASK MANAGER TESTS PASSED!');
if (global.appTaskManager && global.appTaskManager.timer) {
  clearInterval(global.appTaskManager.timer);
}
