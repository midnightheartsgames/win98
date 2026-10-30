const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Win 98 Help Viewer (hh.exe / dialogs.js) ---');

function createMockElement(tag = 'div') {
  const children = [];
  const classes = new Set();
  const dataset = {};
  const listeners = new Map();
  let text = '';
  let html = '';

  const el = {
    tagName: tag.toUpperCase(),
    dataset,
    style: {
      setProperty: (prop, val) => { el.style[prop] = String(val); },
      getPropertyValue: (prop) => el.style[prop] || ''
    },
    classList: {
      add: (...cls) => cls.forEach(c => c && classes.add(c)),
      remove: (...cls) => cls.forEach(c => classes.delete(c)),
      contains: (c) => classes.has(c),
      toggle: (c, force) => {
        if (force !== undefined) {
          if (force) classes.add(c);
          else classes.delete(c);
          return force;
        }
        return classes.has(c) ? (classes.delete(c), false) : (classes.add(c), true);
      }
    },
    addEventListener: (evt, fn) => {
      if (!listeners.has(evt)) listeners.set(evt, []);
      listeners.get(evt).push(fn);
    },
    click: () => {
      const list = listeners.get('click') || [];
      list.forEach(fn => fn({ preventDefault: () => {}, stopPropagation: () => {}, target: el }));
    },
    appendChild: (child) => {
      child.parentNode = el;
      children.push(child);
      return child;
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
            const inner = selector.slice(selector.indexOf('[') + 1, selector.indexOf(']'));
            if (inner.includes('=')) {
              const [k, rawV] = inner.split('=');
              const v = rawV.replace(/['"]/g, '');
              if (k.startsWith('data-')) {
                const dkey = k.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
                if (c.dataset && c.dataset[dkey] === v) match = true;
              }
            } else if (inner.startsWith('data-')) {
              const dkey = inner.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
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
    closest: (sel) => {
      let curr = el;
      while (curr) {
        if (sel.startsWith('.') && curr.classList && curr.classList.contains(sel.slice(1))) return curr;
        if (sel.startsWith('#') && curr.id === sel.slice(1)) return curr;
        curr = curr.parentNode;
      }
      return null;
    }
  };

  Object.defineProperty(el, 'className', {
    get: () => Array.from(classes).join(' '),
    set: (val) => {
      classes.clear();
      String(val || '').split(/\s+/).forEach(c => c && classes.add(c));
    }
  });

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
      children.length = 0;

      const tagMatches = [...html.matchAll(/<([a-zA-Z0-9\-]+)([^>]*)>/g)];
      for (const tm of tagMatches) {
        const tag = tm[1];
        const attrs = tm[2];
        const child = createMockElement(tag);

        const idMatch = attrs.match(/id=["']([^"']+)["']/);
        if (idMatch) child.id = idMatch[1];

        const classMatch = attrs.match(/class=["']([^"']+)["']/);
        if (classMatch) {
          classMatch[1].split(/\s+/).forEach(c => c && child.classList.add(c));
        }

        const dataMatches = [...attrs.matchAll(/data-([a-zA-Z0-9\-]+)=["']([^"']*)["']/g)];
        for (const dm of dataMatches) {
          const dkey = dm[1].replace(/-([a-z])/g, (_, l) => l.toUpperCase());
          child.dataset[dkey] = dm[2];
        }

        el.appendChild(child);
      }
    }
  });

  return el;
}

const storage = new Map();
const mockDoc = {
  createElement: (tag) => createMockElement(tag),
  getElementById: (id) => null,
  documentElement: {
    style: {
      setProperty: () => {},
      getPropertyValue: () => ''
    },
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false
    }
  },
  body: createMockElement('body')
};

const mockWin = {
  document: mockDoc,
  localStorage: {
    getItem: (k) => storage.get(k) || null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k)
  },
  print: () => { mockWin.printed = true; },
  printed: false,
  highestZIndex: 100
};

const createdWindows = new Map();
mockWin.winManager = {
  windows: createdWindows,
  highestZIndex: 100,
  desktopEl: createMockElement('div'),
  createWindow(options) {
    const winEl = createMockElement('div');
    winEl.id = options.id;
    winEl.style.width = options.width + 'px';
    winEl.style.height = options.height + 'px';
    winEl.style.minWidth = options.minWidth + 'px';
    winEl.style.minHeight = options.minHeight + 'px';

    const bodyEl = createMockElement('div');
    bodyEl.className = 'win-window-body';
    if (options.content) {
      bodyEl.appendChild(options.content);
    }
    winEl.appendChild(bodyEl);

    const winObj = {
      id: options.id,
      title: options.title,
      element: winEl,
      bodyElement: bodyEl,
      width: options.width,
      height: options.height,
      minWidth: options.minWidth,
      minHeight: options.minHeight,
      options
    };
    createdWindows.set(options.id, winObj);
    return winObj;
  }
};

const dialogsCode = fs.readFileSync(path.join(__dirname, '../js/apps/dialogs.js'), 'utf8');

const ctx = {
  window: mockWin,
  document: mockDoc,
  Icons: { help: '<svg></svg>', notepad: '<svg></svg>' },
  console
};
vm.createContext(ctx);
vm.runInContext(dialogsCode + '; window.appDialogs = new AppDialogs();', ctx);

const appDialogs = ctx.window.appDialogs;
assert.ok(appDialogs, 'AppDialogs must be initialized');

appDialogs.openHelp();
const helpWin = createdWindows.get('app_help_dialog');
assert.ok(helpWin, 'Help window must be created in winManager');
assert.strictEqual(helpWin.options.resizable, true, 'Help window must be resizable');
assert.strictEqual(helpWin.minWidth, 440, 'Help window minWidth must be 440');
assert.strictEqual(helpWin.minHeight, 300, 'Help window minHeight must be 300');
console.log('PASS 1. Help window initialized with authentic responsive configuration and min bounds');

const contentContainer = helpWin.options.content;
assert.ok(contentContainer.classList.contains('win-help-container'), 'Root content must have win-help-container class');
assert.strictEqual(contentContainer.style.width, undefined, 'content.style.width must NOT be fixed to 560px');
assert.strictEqual(contentContainer.style.height, undefined, 'content.style.height must NOT be fixed to 380px');
console.log('PASS 2. Layout bug fixed: No fixed pixel dimensions forcing overflow or blank gaps');

assert.ok(!contentContainer.querySelector('[data-id="games"]'), 'Topic id "games" must NOT exist in help');
const topicItems = contentContainer.querySelectorAll('.win-help-topic-item');
topicItems.forEach(item => {
  assert.notStrictEqual(item.dataset.id, 'games', 'Topic item must not be games');
});
console.log('PASS 3. Games section completely removed as requested');

const expectedTopics = [
  'welcome', 'whatsnew', 'startup', 'clippy', 'desktop', 'startmenu', 'explorer', 'install', 'apps',
  'multimedia', 'internet', 'system', 'cpanel',
  'run', 'shortcuts', 'troubleshooting', 'about'
];
expectedTopics.forEach(topId => {
  const elFound = contentContainer.querySelector(`[data-id="${topId}"]`);
  assert.ok(elFound, `Help must contain comprehensive topic: ${topId}`);
});
console.log(`PASS 4. All ${expectedTopics.length} comprehensive help topics validated`);

assert.ok(contentContainer.querySelector('[data-tab="contents"]'), 'Contents tab must exist');
assert.ok(contentContainer.querySelector('[data-tab="index"]'), 'Index tab must exist');
assert.ok(contentContainer.querySelector('[data-tab="search"]'), 'Search tab must exist');
console.log('PASS 5. Authentic Win98 HTML Help tabs (Contents, Index, Search) verified');

assert.ok(contentContainer.querySelector('[data-action="toggle-nav"]'), 'Toggle sidebar button must exist');
assert.ok(contentContainer.querySelector('[data-action="back"]'), 'Back button must exist');
assert.ok(contentContainer.querySelector('[data-action="forward"]'), 'Forward button must exist');
assert.ok(contentContainer.querySelector('[data-action="home"]'), 'Home button must exist');
assert.ok(contentContainer.querySelector('[data-action="print"]'), 'Print button must exist');
console.log('PASS 6. Authentic toolbar buttons verified');

appDialogs.openHelp('cpanel');
const cpanelWin = createdWindows.get('app_help_dialog');
const cpanelPane = cpanelWin.options.content.querySelector('.help-content-pane');
const expectedApplets = [
  'desk.cpl', 'main.cpl', 'sysdm.cpl', 'powercfg.cpl', 'appwiz.cpl',
  'mmsys.cpl', 'timedate.cpl', 'intl.cpl', 'inetcpl.cpl', 'taskbar-props'
];
expectedApplets.forEach(appletCmd => {
  assert.ok(cpanelPane.querySelector(`[data-run="${appletCmd}"]`), `Control Panel help must include shortcut for ${appletCmd}`);
});
assert.ok(cpanelPane.innerHTML.includes('Мышь (main.cpl)'), 'Control Panel help must document Mouse applet');
assert.ok(cpanelPane.innerHTML.includes('Система (sysdm.cpl)'), 'Control Panel help must document System applet');
assert.ok(cpanelPane.innerHTML.includes('Электропитание (powercfg.cpl)'), 'Control Panel help must document Power Management applet');
assert.ok(cpanelPane.innerHTML.includes('Установка и удаление программ (appwiz.cpl)'), 'Control Panel help must document Add/Remove Programs applet');
console.log('PASS 7. All 10 Control Panel applets and detailed subsections verified in cpanel topic');

const otherApplets = [
  'sounds.cpl', 'keyboard.cpl', 'fonts', 'printers', 'netcpl.cpl', 'access.cpl',
  'joy.cpl', 'modem.cpl', 'password.cpl', 'users.cpl', 'mstask'
];
otherApplets.forEach(appletCmd => {
  assert.ok(cpanelPane.querySelector(`[data-run="${appletCmd}"]`), `Control Panel help must include shortcut for ${appletCmd}`);
});
assert.ok(cpanelPane.innerHTML.includes('21 значок'), 'Control Panel help must state that it holds 21 items');
console.log('PASS 8. All 21 Control Panel items are documented in the cpanel topic');

const topicPane = (id) => {
  appDialogs.openHelp(id);
  return createdWindows.get('app_help_dialog').options.content.querySelector('.help-content-pane');
};

expectedTopics.forEach(topId => {
  const pane = topicPane(topId);
  assert.ok(pane.innerHTML.includes('<h2>'), `Topic ${topId} must render a heading`);
  pane.querySelectorAll('.win-help-link').forEach(link => {
    assert.ok(expectedTopics.includes(link.dataset.topic), `Topic ${topId} links to unknown topic ${link.dataset.topic}`);
  });
});
console.log('PASS 9. Every topic renders and every related link points to an existing topic');

const startupHtml = topicPane('startup').innerHTML;
['F8', 'CMOS', 'BOOTLOG.TXT', 'Безопасный режим', '22 значка'].forEach(fragment => {
  assert.ok(startupHtml.includes(fragment), `Startup topic must mention ${fragment}`);
});
const installHtml = topicPane('install').innerHTML;
['SteamInstall.exe', 'WIN98SE', 'CYBER1998', 'SoftStore', 'D:\\demo'].forEach(fragment => {
  assert.ok(installHtml.includes(fragment), `Install topic must mention ${fragment}`);
});
console.log('PASS 10. Startup and installation topics describe the boot menu, first-start state, Steam, the CD, and SoftStore');

const runHtml = topicPane('run').innerHTML;
['matrix', 'starwars', 'netstat', 'tracert'].forEach(removed => {
  assert.ok(!runHtml.toLowerCase().includes(removed), `Run topic must not list the nonexistent command ${removed}`);
});
assert.ok(runHtml.includes('emuland') && runHtml.includes('msbackup') && runHtml.includes('reset'), 'Run topic must list current commands');
console.log('PASS 11. Run and MS-DOS topics list only commands that exist');

ctx.window.i18n = { getLanguage: () => 'en', t: (key) => key };
const englishStartup = topicPane('startup');
assert.ok(englishStartup.innerHTML.includes('Starting the System'), 'English help must render the startup topic in English');
assert.ok(englishStartup.innerHTML.includes('Startup Menu'), 'English startup topic must describe the startup menu');
delete ctx.window.i18n;
console.log('PASS 12. Help renders in English when the system language is English');

console.log('\n========================================');
console.log('ALL WIN 98 HELP TESTS PASSED!');
console.log('========================================\n');
