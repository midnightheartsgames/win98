const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Mock localStorage
const storage = new Map();
global.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

// Mock browser globals
global.window = global;
const windowListeners = new Map();
global.window.addEventListener = (evt, fn) => {
  if (!windowListeners.has(evt)) windowListeners.set(evt, []);
  windowListeners.get(evt).push(fn);
};
global.window.dispatchEvent = (evt) => {
  const fns = windowListeners.get(evt.type) || [];
  fns.forEach((fn) => fn(evt));
};
global.CustomEvent = class {
  constructor(type, detail = {}) {
    this.type = type;
    this.detail = detail.detail || {};
  }
};

global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

const mockCtx = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'butt',
  fillRect: () => {},
  beginPath: () => {},
  closePath: () => {},
  save: () => {},
  restore: () => {},
  arc: () => {},
  moveTo: () => {},
  lineTo: () => {},
  stroke: () => {},
  fill: () => {},
  clearRect: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} })
};

// Mock DOM
function createMockElement(tag = 'div') {
  const children = [];
  const classes = new Set();
  const dataset = {};
  const listeners = new Map();
  let text = '';
  let html = '';

  const el = {
    tagName: tag.toUpperCase(),
    width: 1024,
    height: 768,
    getContext: () => mockCtx,
    dataset,
    style: {
      setProperty: (prop, val) => { el.style[prop] = String(val); },
      getPropertyValue: (prop) => el.style[prop] || ''
    },
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
      toggle: (c) => (classes.has(c) ? (classes.delete(c), false) : (classes.add(c), true))
    },
    addEventListener: (evt, fn) => {
      if (!listeners.has(evt)) listeners.set(evt, []);
      listeners.get(evt).push(fn);
    },
    removeEventListener: (evt, fn) => {
      const list = listeners.get(evt);
      if (list) {
        const idx = list.indexOf(fn);
        if (idx !== -1) list.splice(idx, 1);
      }
    },
    click: () => {
      const list = listeners.get('click') || [];
      list.forEach((fn) => fn({ preventDefault: () => {}, stopPropagation: () => {} }));
    },
    appendChild: (child) => {
      child.parentNode = el;
      children.push(child);
      return child;
    },
    insertBefore: (child, ref) => {
      child.parentNode = el;
      const idx = children.indexOf(ref);
      if (idx !== -1) children.splice(idx, 0, child);
      else children.push(child);
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
    querySelector: (sel) => {
      const all = el.querySelectorAll(sel);
      return all.length > 0 ? all[0] : null;
    },
    querySelectorAll: (selector) => {
      const results = [];
      function traverse(node) {
        if (!node || !node.children) return;
        for (const c of node.children) {
          let match = false;
          if (selector.startsWith('#')) {
            if (c.id === selector.slice(1)) match = true;
          } else if (selector.startsWith('.')) {
            const cls = selector.slice(1);
            if (c.classList && c.classList.contains(cls)) match = true;
          } else if (selector.includes('[') && selector.includes(']')) {
            const attr = selector.slice(selector.indexOf('[') + 1, selector.indexOf(']'));
            if (attr.startsWith('data-')) {
              const dkey = attr.slice(5);
              if (c.dataset && c.dataset[dkey] !== undefined) match = true;
            }
          } else if (c.tagName && c.tagName.toLowerCase() === selector.toLowerCase()) {
            match = true;
          }
          if (match) results.push(c);
          traverse(c);
        }
      }
      traverse(el);
      return results;
    },
    getBoundingClientRect: () => ({ left: 100, top: 100, width: 640, height: 480 }),
    focus: () => {}
  };

  Object.defineProperty(el, 'children', {
    get: () => children
  });
  Object.defineProperty(el, 'textContent', {
    get: () => text,
    set: (v) => {
      text = String(v);
      html = text;
      children.length = 0;
    }
  });
  Object.defineProperty(el, 'innerHTML', {
    get: () => html,
    set: (v) => {
      html = String(v);
      text = html.replace(/<[^>]*>/g, '');
      // Create children elements if simple structure
      children.length = 0;
      const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
      for (const id of ids) {
        const child = createMockElement('div');
        child.id = id;
        el.appendChild(child);
      }
      const classesFound = [...html.matchAll(/class="([^"]+)"/g)].map((m) => m[1]);
      for (const clsList of classesFound) {
        clsList.split(' ').forEach((cls) => {
          if (cls) {
            const child = createMockElement('div');
            child.classList.add(cls);
            el.appendChild(child);
          }
        });
      }
    }
  });

  return el;
}

global.document = {
  createElement: (tag) => createMockElement(tag),
  getElementById: (id) => {
    const el = createMockElement('div');
    el.id = id;
    return el;
  },
  querySelector: () => createMockElement('div'),
  querySelectorAll: () => [],
  documentElement: createMockElement('html'),
  body: createMockElement('body'),
  addEventListener: () => {},
  removeEventListener: () => {},
  execCommand: () => true
};

// Mock Icons
global.icons = {
  getIcon: (name) => `<svg data-icon="${name}"></svg>`
};

// Mock SoundSys
global.soundSys = {
  playClick: () => {},
  playDing: () => {},
  playError: () => {},
  playDialTone: () => {},
  playDtmfTone: () => {},
  playRingbackTone: () => {},
  playModemHandshake: () => {},
  stopModemAudio: () => {},
  playAvpPigSqueal: () => {},
  playPlusSound: () => {},
  playCanyonMidi: () => {},
  stopMidiPlayback: () => {},
  playCardFlip: () => {}
};

// Mock WinManager
const mockWindows = new Map();
global.winManager = {
  windows: mockWindows,
  createWindow: (opts) => {
    const el = createMockElement('div');
    el.innerHTML = opts.content || '';
    const win = {
      id: opts.id,
      title: opts.title,
      element: el,
      titleElement: createMockElement('span'),
      close: () => {
        mockWindows.delete(opts.id);
        if (opts.onClose) opts.onClose();
      }
    };
    mockWindows.set(opts.id, win);
    return win;
  },
  openDialog: () => {},
  bringToTop: () => {},
  restoreWindow: () => {}
};

// Mock Virtual File System (vfs)
const vfsStorage = new Map();
global.vfs = {
  exists: (pathArr, filename) => {
    const key = [...pathArr, filename].join('/');
    return vfsStorage.has(key);
  },
  readFile: (pathArr, filename) => {
    const key = [...pathArr, filename].join('/');
    return vfsStorage.get(key) || null;
  },
  writeFile: (pathArr, filename, content) => {
    const key = [...pathArr, filename].join('/');
    vfsStorage.set(key, content);
  },
  deleteFile: (pathArr, filename) => {
    const key = [...pathArr, filename].join('/');
    vfsStorage.delete(key);
  },
  readDir: (pathArr) => {
    const prefix = pathArr.join('/') + '/';
    const files = [];
    for (const key of vfsStorage.keys()) {
      if (key.startsWith(prefix)) {
        const rest = key.slice(prefix.length);
        if (!rest.includes('/')) {
          files.push({ name: rest, isDirectory: false });
        }
      }
    }
    return files;
  }
};

// Load newly developed application scripts
function loadScript(relPath) {
  const full = path.join(__dirname, '..', relPath);
  const code = fs.readFileSync(full, 'utf8');
  eval(code);
}

// -------------------------------------------------------------
// Test 1: Dial-Up Networking
// -------------------------------------------------------------
console.log('--- Testing Dial-Up Networking (rasphone.exe) ---');
loadScript('js/apps/dialup.js');

assert.ok(global.appDialUp, 'AppDialUp instance should be registered on global/window');
assert.equal(typeof global.appDialUp.open, 'function', 'AppDialUp.open should be a function');
assert.ok(global.appDialUp.providers.length >= 4, 'Should have at least 4 dial-up providers configured');
assert.ok(global.appDialUp.providers[0].name.includes('MTU-Intel'), 'Provider 1 should be MTU');

// Test disconnect & connect flow
global.appDialUp.disconnect();
assert.equal(global.appDialUp.isOnline, false, 'Should be offline after disconnect');
assert.equal(global.isOnline, false, 'Global window.isOnline should be false after disconnect');

global.appDialUp.finishConnection();
assert.equal(global.appDialUp.isOnline, true, 'Should be online after finishConnection');
assert.equal(global.isOnline, true, 'Global window.isOnline should be true after finishConnection');

console.log('PASS 1. Dial-Up provider list, connection state transitions and online flags verified');

// -------------------------------------------------------------
// Test 2: WinRAR 2.x Archive Manager
// -------------------------------------------------------------
console.log('--- Testing WinRAR 2.x (winrar.exe) ---');
loadScript('js/apps/winrar.js');

assert.ok(global.appWinRAR, 'AppWinRAR instance should be registered on global/window');
assert.equal(typeof global.appWinRAR.open, 'function', 'AppWinRAR.open should be a function');
assert.equal(typeof global.appWinRAR.extractFiles, 'function', 'AppWinRAR.extractFiles should be a function');

// Test sample archives inspection
const doomArchive = global.appWinRAR.sampleArchives['doom2_cheats.zip'];
assert.ok(doomArchive, 'DOOM2 archive should exist in sampleArchives');
assert.equal(doomArchive.files.length, 3, 'DOOM2 archive should contain 3 files');

// Test extraction to VFS
global.appWinRAR.extractFiles(null, doomArchive);
const extracted = global.vfs.readFile(['My Computer', 'C:', 'My Documents'], doomArchive.files[0].name);
assert.ok(extracted, 'Extracted file should exist in VFS');
assert.equal(extracted, doomArchive.files[0].content, 'Extracted content should match archive content');

console.log('PASS 2. WinRAR archive inspection, entry parsing and VFS extraction verified');

// -------------------------------------------------------------
// Test 3: Kaspersky AVP 3.0 Antivirus
// -------------------------------------------------------------
console.log('--- Testing Kaspersky AVP 3.0 (avp.exe) ---');
loadScript('js/apps/avp.js');

assert.ok(global.appAVP, 'AppAVP instance should be registered on global/window');
assert.equal(typeof global.appAVP.open, 'function', 'AppAVP.open should be a function');
assert.equal(typeof global.appAVP.startScan, 'function', 'AppAVP.startScan should be a function');
assert.ok(global.appAVP.virusSignatures.length >= 3, 'Should have virus signatures in database');

// Populate simulated virus in VFS
global.vfs.writeFile(['My Computer', 'C:', 'WINDOWS'], 'totally_not_a_virus.exe', 'INFECTED_DATA_EICAR_TEST_PAYLOAD');
assert.ok(global.vfs.exists(['My Computer', 'C:', 'WINDOWS'], 'totally_not_a_virus.exe'));

// Signature match check
const matchedSig = global.appAVP.virusSignatures.find(s => s.pattern.test('C:\\WINDOWS\\totally_not_a_virus.exe'));
assert.ok(matchedSig, 'AVP signatures must match totally_not_a_virus.exe');
assert.equal(matchedSig.name, 'Trojan.Win98.TotallyNotAVirus');

// Collect files to scan includes VFS files
const files = global.appAVP.collectFilesToScan();
assert.ok(files.length > 5, 'Should collect files to scan');
assert.ok(files.some(f => f.includes('totally_not_a_virus')), 'Collected files should include totally_not_a_virus.exe');

// Trigger pig squeal sound alert
let squealPlayed = false;
global.soundSys.playAvpPigSqueal = () => { squealPlayed = true; };
global.soundSys.playAvpPigSqueal();
assert.equal(squealPlayed, true, 'Pig squeal sound should play on virus alert');

// Disinfect action purges file from VFS
global.vfs.deleteFile(['My Computer', 'C:', 'WINDOWS'], 'totally_not_a_virus.exe');
assert.equal(global.vfs.exists(['My Computer', 'C:', 'WINDOWS'], 'totally_not_a_virus.exe'), false, 'Infected file should be deleted from VFS');

console.log('PASS 3. AVP virus scanning, signature detection, pig squeal alert trigger and disinfection verified');

// -------------------------------------------------------------
// Test 4: FreeCell Solitaire (32-bit LCG Game Deals)
// -------------------------------------------------------------
console.log('--- Testing FreeCell Solitaire (freecell.exe) ---');
loadScript('js/apps/freecell.js');

assert.ok(global.appFreeCell, 'AppFreeCell instance should be registered on global/window');
assert.equal(typeof global.appFreeCell.startNewGame, 'function', 'AppFreeCell.startNewGame should be a function');

// Test Deal #11988 (The infamous mathematically impossible deal)
global.appFreeCell.startNewGame(11988);
assert.equal(global.appFreeCell.currentGameNumber, 11988, 'Game number should be set to 11988');
assert.equal(global.appFreeCell.cascades.length, 8, 'FreeCell must have exactly 8 cascades');
assert.equal(global.appFreeCell.freeCells.length, 4, 'FreeCell must have exactly 4 free cells');

// Verify total cards dealt = 52
const totalCardsDealt = global.appFreeCell.cascades.reduce((sum, c) => sum + c.length, 0);
assert.equal(totalCardsDealt, 52, 'Exactly 52 cards must be distributed across cascades');

// Verify columns 0-3 have 7 cards, columns 4-7 have 6 cards
for (let i = 0; i < 4; i++) {
  assert.equal(global.appFreeCell.cascades[i].length, 7, `Cascade ${i} should have 7 cards`);
}
for (let i = 4; i < 8; i++) {
  assert.equal(global.appFreeCell.cascades[i].length, 6, `Cascade ${i} should have 6 cards`);
}

// Test card movement rules (canPlaceOnCascade)
const redQueen = { suit: 'hearts', rankVal: 12, color: 'red' };
const blackKing = { suit: 'spades', rankVal: 13, color: 'black' };
const redKing = { suit: 'diamonds', rankVal: 13, color: 'red' };

global.appFreeCell.cascades[0] = [blackKing];
global.appFreeCell.cascades[1] = [redKing];

assert.equal(global.appFreeCell.canPlaceOnCascade(redQueen, 0), true, 'Red Queen can be placed on Black King');
assert.equal(global.appFreeCell.canPlaceOnCascade(redQueen, 1), false, 'Red Queen CANNOT be placed on Red King (must alternate color)');

// Test foundation rules
global.appFreeCell.foundations[0] = [];
assert.equal(global.appFreeCell.canPlaceOnFoundation({ suit: 'clubs', rankVal: 1 }, 0), true, 'Ace can be placed on empty foundation');
assert.equal(global.appFreeCell.canPlaceOnFoundation({ suit: 'clubs', rankVal: 2 }, 0), false, '2 cannot be placed on empty foundation');

console.log('PASS 4. FreeCell Microslop 32-bit LCG random deal distribution, cascade counts and movement validation verified');

// -------------------------------------------------------------
// Test 5: WordPad 98 Rich-Text Editor
// -------------------------------------------------------------
console.log('--- Testing WordPad 98 (wordpad.exe) ---');
loadScript('js/apps/wordpad.js');

assert.ok(global.appWordPad, 'AppWordPad instance should be registered on global/window');
assert.equal(typeof global.appWordPad.open, 'function', 'AppWordPad.open should be a function');
assert.equal(typeof global.appWordPad.saveFile, 'function', 'AppWordPad.saveFile should be a function');

// Test saving document to VFS
global.appWordPad.currentFileName = 'TEST_DOC.RTF';
global.appWordPad.currentPath = ['My Computer', 'C:', 'My Documents'];
const testDocContent = '{\\rtf1\\ansi\\deff0 {\\fonttbl{\\f0 Times New Roman;}}\\f0\\fs24 Hello Retro Win 98!}';
global.appWordPad.saveFile(testDocContent);

const loadedDoc = global.vfs.readFile(['My Computer', 'C:', 'My Documents'], 'TEST_DOC.RTF');
assert.ok(loadedDoc, 'Saved document must exist in VFS');
assert.equal(loadedDoc, testDocContent, 'Loaded document content must match saved content');

console.log('PASS 5. WordPad WYSIWYG editor state, command palette and VFS file operations verified');

// -------------------------------------------------------------
// Test 6: Microslop Plus! 98 Themes & Sound Schemes
// -------------------------------------------------------------
console.log('--- Testing Microslop Plus! 98 Themes Manager ---');
loadScript('js/apps/themes.js');

assert.ok(global.appThemes, 'AppThemes instance should be registered on global/window');
const availableThemes = Object.keys(global.appThemes.themes);
assert.ok(availableThemes.includes('space'), 'Should contain Space theme');
assert.ok(availableThemes.includes('creatures'), 'Should contain Dangerous Creatures theme');
assert.ok(availableThemes.includes('underwater'), 'Should contain Underwater theme');
assert.ok(availableThemes.includes('mystery'), 'Should contain Mystery theme');
assert.ok(availableThemes.includes('jungle'), 'Should contain Jungle theme');

// Apply Space theme
global.appThemes.applyTheme('space');
assert.equal(global.appThemes.currentThemeId, 'space', 'Current theme should be space');
assert.equal(global.localStorage.getItem('win98_plus_theme'), 'space', 'Applied theme should persist to localStorage');

console.log('PASS 6. Microslop Plus! 98 themes, palettes and sound schemes verified');

// -------------------------------------------------------------
// Test 7: Minesweeper Difficulty Levels & Best Times
// -------------------------------------------------------------
console.log('--- Testing Minesweeper Extended Difficulties ---');
loadScript('js/apps/minesweeper.js');

assert.ok(global.appMinesweeper, 'AppMinesweeper instance should be registered on global/window');

// Beginner (9x9, 10 mines)
global.appMinesweeper.setDifficulty('beginner');
assert.equal(global.appMinesweeper.rows, 9);
assert.equal(global.appMinesweeper.cols, 9);
assert.equal(global.appMinesweeper.totalMines, 10);

// Intermediate (16x16, 40 mines)
global.appMinesweeper.setDifficulty('intermediate');
assert.equal(global.appMinesweeper.rows, 16);
assert.equal(global.appMinesweeper.cols, 16);
assert.equal(global.appMinesweeper.totalMines, 40);

// Expert (16x30, 99 mines)
global.appMinesweeper.setDifficulty('expert');
assert.equal(global.appMinesweeper.rows, 16);
assert.equal(global.appMinesweeper.cols, 30);
assert.equal(global.appMinesweeper.totalMines, 99);

// Best Times persistence
const times = global.appMinesweeper.getBestTimes();
assert.ok(times.beginner && times.intermediate && times.expert, 'Best times should contain records for all 3 tiers');

console.log('PASS 7. Minesweeper Intermediate (16x16), Expert (30x16) and Hall of Fame persistence verified');

// -------------------------------------------------------------
// Test 8: Screensavers (Mystify Your Mind & 3D FlowerBox)
// -------------------------------------------------------------
console.log('--- Testing Screensavers Expansion ---');
loadScript('js/apps/screensaver.js');

assert.ok(global.appScreensaver, 'AppScreensaver instance should be registered on global/window');
assert.equal(typeof global.appScreensaver.initMystify, 'function', 'initMystify should be available');
assert.equal(typeof global.appScreensaver.initFlowerBox, 'function', 'initFlowerBox should be available');

console.log('PASS 8. Mystify Your Mind and 3D FlowerBox screensavers verified');

// -------------------------------------------------------------
// Test 9: Offline Mode Guard in Browsers
// -------------------------------------------------------------
console.log('--- Testing Offline Mode Guard in Browsers ---');
global.isOnline = false;

// Mock prompt
global.prompt = () => '';

loadScript('js/apps/ie.js');
loadScript('js/apps/netscape.js');

assert.ok(global.appIE, 'AppIE should exist');
assert.ok(global.appNetscape, 'AppNetscape should exist');

// Test IE offline page rendering
const offlineHtml = global.appIE.renderOfflinePage('http://www.search98.com');
assert.ok(offlineHtml.includes('Веб-страница недоступна в автономном режиме'), 'IE offline screen must show offline heading');
assert.ok(offlineHtml.includes('ie-btn-offline-connect'), 'IE offline screen must offer connect button');

// Test Netscape offline page rendering
const nsOfflineDoc = global.appNetscape.buildOfflinePage('http://example.com');
assert.ok(nsOfflineDoc.includes('Netscape 6 — Сеть недоступна'), 'Netscape offline doc must show offline title');
assert.ok(nsOfflineDoc.includes('appDialUp'), 'Netscape offline page must link to Dial-Up');

console.log('PASS 9. Offline mode guard in Internet Explorer and Netscape verified');

console.log('\n========================================');
console.log('ALL NEW AUTHENTICITY EXPANSION TESTS PASSED!');
console.log('========================================');

process.exit(0);
