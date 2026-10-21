const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Mock a lightweight browser environment for testing Display Settings persistence
const storage = new Map();
global.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

const desktopStyle = {};
const rootStyle = {
  properties: {},
  setProperty(prop, val) { this.properties[prop] = val; },
  getProperty(prop) { return this.properties[prop]; }
};

const crtOverlayClasses = new Set();
const bodyClasses = new Set();

const mockElements = {
  'desktop': {
    style: desktopStyle
  },
  'crt-overlay': {
    classList: {
      add: (c) => crtOverlayClasses.add(c),
      remove: (c) => crtOverlayClasses.delete(c),
      contains: (c) => crtOverlayClasses.has(c),
      toggle: (c) => {
        if (crtOverlayClasses.has(c)) { crtOverlayClasses.delete(c); return false; }
        crtOverlayClasses.add(c); return true;
      }
    }
  }
};

global.document = {
  readyState: 'complete',
  getElementById: (id) => mockElements[id] || null,
  body: {
    classList: {
      add: (c) => bodyClasses.add(c),
      remove: (c) => bodyClasses.delete(c),
      contains: (c) => bodyClasses.has(c),
      toggle: (c) => {
        if (bodyClasses.has(c)) { bodyClasses.delete(c); return false; }
        bodyClasses.add(c); return true;
      }
    },
    appendChild: () => {}
  },
  documentElement: {
    style: rootStyle
  },
  createElement: (tag) => ({
    tagName: tag,
    style: {},
    classList: { add: () => {}, remove: () => {} },
    querySelector: () => ({ getContext: () => ({ fillRect: () => {} }) }),
    querySelectorAll: () => []
  }),
  addEventListener: () => {}
};

global.window = {
  addEventListener: () => {}
};

// Evaluate screensaver.js and dialogs.js
const screensaverCode = fs.readFileSync(path.join(__dirname, '../js/apps/screensaver.js'), 'utf-8');
const dialogsCode = fs.readFileSync(path.join(__dirname, '../js/apps/dialogs.js'), 'utf-8');

eval(screensaverCode);
eval(dialogsCode);

const appDialogs = window.appDialogs;
const appScreensaver = window.appScreensaver;

console.log('--- Testing Display Settings Persistence ---');

// Test 1: Default settings
{
  storage.clear();
  const defaults = appDialogs.getDefaultDisplaySettings();
  assert.equal(defaults.bgColor, '#008080');
  assert.equal(defaults.themeId, 'classic');
  assert.equal(defaults.crtEnabled, true);
  assert.equal(defaults.screensaverMode, 'pipes');
  assert.equal(defaults.screensaverTimeout, 3);
  console.log('PASS 1. Default display settings match authentic Win98 defaults');
}

// Test 2: Save and retrieve settings
{
  storage.clear();
  const custom = {
    bgColor: '#408080',
    wallpaper: 'clouds',
    wallpaperMode: 'stretch',
    themeId: 'space',
    themeGrad: 'linear-gradient(90deg, #1a0826, #6b117b)',
    crtEnabled: true,
    screensaverMode: 'starfield',
    screensaverTimeout: 5
  };

  appDialogs.saveDisplaySettings(custom);
  const retrieved = appDialogs.getDisplaySettings();

  assert.equal(retrieved.bgColor, '#408080');
  assert.equal(retrieved.wallpaper, 'clouds');
  assert.equal(retrieved.wallpaperMode, 'stretch');
  assert.equal(retrieved.themeId, 'space');
  assert.equal(retrieved.themeGrad, 'linear-gradient(90deg, #1a0826, #6b117b)');
  assert.equal(retrieved.crtEnabled, true);
  assert.equal(retrieved.screensaverMode, 'starfield');
  assert.equal(retrieved.screensaverTimeout, 5);
  console.log('PASS 2. Display settings successfully serialize and deserialize from localStorage');
}

// Test 3: Apply settings to DOM and CSS variables
{
  const custom = {
    bgColor: '#4b0082',
    wallpaper: 'matrix',
    wallpaperMode: 'tile',
    themeGrad: 'linear-gradient(90deg, #3d1b4f, #79288a)',
    crtEnabled: true,
    screensaverMode: 'none',
    screensaverTimeout: 10
  };

  appDialogs.applyDisplaySettings(custom);

  assert.equal(desktopStyle.backgroundColor, '#4b0082');
  assert.equal(desktopStyle.backgroundRepeat, 'repeat');
  assert.equal(desktopStyle.backgroundPosition, 'top left');
  assert.equal(rootStyle.getProperty('--win-desktop-bg'), '#4b0082');
  assert.equal(rootStyle.getProperty('--win-active-title'), 'linear-gradient(90deg, #3d1b4f, #79288a)');
  assert.equal(crtOverlayClasses.has('active'), true);
  assert.equal(bodyClasses.has('crt-enabled'), true);
  assert.equal(appScreensaver.currentMode, 'none');
  assert.equal(appScreensaver.timeoutSeconds, 600);
  console.log('PASS 3. Display settings correctly propagate to DOM styles, CSS properties, and screensaver');
}

// Test 4: CRT toggle persistence
{
  const initial = appDialogs.getDisplaySettings().crtEnabled;
  const toggled = appDialogs.toggleCrt();
  assert.equal(toggled, !initial);
  assert.equal(appDialogs.getDisplaySettings().crtEnabled, toggled);
  assert.equal(crtOverlayClasses.has('active'), toggled);
  assert.equal(bodyClasses.has('crt-enabled'), toggled);

  // Toggle back
  const toggledBack = appDialogs.toggleCrt();
  assert.equal(toggledBack, initial);
  assert.equal(appDialogs.getDisplaySettings().crtEnabled, initial);
  console.log('PASS 4. CRT toggle synchronizes with localStorage and active DOM classes');
}

// Test 5: Corrupted or missing localStorage fallback
{
  storage.set('win98_display_settings', '{ bad json ...');
  const fallback = appDialogs.getDisplaySettings();
  assert.equal(fallback.bgColor, '#008080');
  assert.equal(fallback.screensaverMode, 'pipes');
  assert.equal(fallback.screensaverTimeout, 3);
  console.log('PASS 5. Resilient fallback against corrupted or invalid JSON in localStorage');
}

// Test 6: Screensaver re-initialization from saved settings
{
  storage.clear();
  appDialogs.saveDisplaySettings({
    screensaverMode: 'starfield',
    screensaverTimeout: 15
  });

  const freshSaver = new window.AppScreensaver();
  assert.equal(freshSaver.currentMode, 'starfield');
  assert.equal(freshSaver.timeoutSeconds, 900);
  console.log('PASS 6. AppScreensaver initializes directly from stored user preferences');
}

// Test 7: CSS definitions for Win98 Blue and Selection
{
  const baseCss = fs.readFileSync(path.join(__dirname, '../css/win98-base.css'), 'utf-8');
  assert.ok(baseCss.includes('--win-blue: #000080;'), '--win-blue variable must be defined in :root');
  assert.ok(baseCss.includes('::selection') && baseCss.includes('--win-highlight'), 'Global ::selection must be configured');
  console.log('PASS 7. Base CSS defines --win-blue and global ::selection');
}

// Test 8: Control Panel applets selection rules and contrast
{
  const cpanelCss = fs.readFileSync(path.join(__dirname, '../css/apps/cpanel-applets.css'), 'utf-8');
  assert.ok(!cpanelCss.includes('var(--win-blue);'), 'cpanel-applets.css must use fallback or --win-highlight');
  assert.ok(cpanelCss.includes('.mmsys-event-item.selected'), 'mmsys-event-item.selected rule exists');
  assert.ok(cpanelCss.includes('.mmsys-event-item.selected svg polygon'), 'mmsys selected icon polygon color is inverted');
  assert.ok(cpanelCss.includes('.appwiz-app-row.selected'), 'appwiz-app-row.selected rule exists');
  console.log('PASS 8. Control Panel applets provide high-contrast selection highlights');
}

// Test 9: Display Properties dialog geometry and overflow containment
{
  const windowCss = fs.readFileSync(path.join(__dirname, '../css/window.css'), 'utf-8').replace(/\r\n/g, '\n');
  assert.ok(windowCss.includes('.win-window.is-dialog .win-window-body {\n  overflow: hidden;\n}'), 'Dialog window body must contain overflow');

  const cpanelCss = fs.readFileSync(path.join(__dirname, '../css/apps/cpanel-applets.css'), 'utf-8');
  assert.ok(/\.disp-props \{[^}]*flex: 1;/.test(cpanelCss), 'Display properties fill the window body');
  assert.ok(/\.disp-props > \.win-tab-panel \{[^}]*flex: 1;/.test(cpanelCss), 'Tab panel stretches down to the buttons');
  assert.ok(!/\.disp-tab-content \{[^}]*min-height: 300px/.test(cpanelCss), 'Tabs no longer force a fixed height');
  assert.ok(/\.disp-group \{[^}]*min-width: 0;/.test(cpanelCss), 'Fieldsets do not grow past the panel');

  const dialogsJs = fs.readFileSync(path.join(__dirname, '../js/apps/dialogs.js'), 'utf-8');
  assert.ok(dialogsJs.includes("id: 'app_display_props'") && dialogsJs.includes('height: 430'), 'Display properties window fits the Effects tab');
  console.log('PASS 9. Display Properties dialog geometry prevents button protrusion');
}

// Test 10: Visual effects settings, body classes and Clippy notification
{
  storage.clear();
  const defaults = appDialogs.getDefaultDisplaySettings();
  assert.equal(defaults.largeIcons, false);
  assert.equal(defaults.iconColors, true);
  assert.equal(defaults.animateUi, true);
  assert.equal(defaults.fontSmoothing, true);
  assert.equal(defaults.fullDrag, true);
  assert.deepEqual(defaults.desktopIcons, {});

  appDialogs.applyDisplaySettings({ ...defaults, iconColors: false, animateUi: false, fontSmoothing: false, fullDrag: false, largeIcons: true });
  assert.ok(bodyClasses.has('fx-low-color'));
  assert.ok(!bodyClasses.has('fx-animate'));
  assert.ok(bodyClasses.has('fx-aliased-text'));
  assert.ok(bodyClasses.has('fx-outline-drag'));
  assert.ok(bodyClasses.has('fx-large-icons'));
  appDialogs.applyDisplaySettings(defaults);
  assert.ok(!bodyClasses.has('fx-low-color'));
  assert.ok(bodyClasses.has('fx-animate'));
  assert.ok(!bodyClasses.has('fx-aliased-text'));
  assert.ok(!bodyClasses.has('fx-outline-drag'));
  assert.ok(!bodyClasses.has('fx-large-icons'));

  const diff = appDialogs.changedDisplayEffects(
    { ...defaults, desktopIcons: { 'recycle-bin': 'folder' } },
    { ...defaults, fullDrag: false, desktopIcons: { 'my-computer': 'clippy' } }
  );
  assert.deepEqual(diff.flags, { fullDrag: false });
  assert.deepEqual(diff.icons.map(i => [i.slot, i.icon, i.previous]).sort(), [['my-computer', 'clippy', null], ['recycle-bin', null, 'folder']]);

  const calls = [];
  window.appClippy = { onDisplayEffectsChanged: (changes, source) => calls.push({ changes, source }) };
  appDialogs.toggleCrt();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].source, 'tray');
  assert.deepEqual(calls[0].changes.flags, { crtEnabled: false });
  appDialogs.setDisplayEffects({ crtEnabled: true }, 'clippy');
  assert.equal(calls.length, 1, 'Clippy undo does not trigger another reaction');
  delete window.appClippy;
  console.log('PASS 10. Visual effects map to body classes and notify Clippy once per change');
}

console.log('ALL DISPLAY SETTINGS TESTS PASSED!');
