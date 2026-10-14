const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Win 98 Internationalization (i18n.js) ---');

// Mock browser environment
const storage = new Map();
let dispatchedEvents = [];

const mockWindow = {
  localStorage: {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear()
  },
  CustomEvent: class CustomEvent {
    constructor(type, eventInitDict) {
      this.type = type;
      this.detail = eventInitDict ? eventInitDict.detail : null;
    }
  },
  dispatchEvent: (evt) => {
    dispatchedEvents.push(evt);
    return true;
  }
};

const i18nCode = fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8');
const ctx = {
  window: mockWindow,
  localStorage: mockWindow.localStorage,
  CustomEvent: mockWindow.CustomEvent,
  console
};
vm.createContext(ctx);
vm.runInContext(i18nCode + '; window.i18n = new I18nManager();', ctx);

const i18n = ctx.window.i18n;
assert.ok(i18n, 'I18nManager instance must be created');

// Test 1: Dictionary Symmetry & Parity
const ruKeys = Object.keys(i18n.translations.ru);
const enKeys = Object.keys(i18n.translations.en);

assert.ok(ruKeys.length > 1000, `Expected over 1000 keys in RU dictionary, got ${ruKeys.length}`);
assert.ok(enKeys.length > 1000, `Expected over 1000 keys in EN dictionary, got ${enKeys.length}`);

const ruMissingInEn = ruKeys.filter(k => !(k in i18n.translations.en));
const enMissingInRu = enKeys.filter(k => !(k in i18n.translations.ru));

assert.deepStrictEqual(ruMissingInEn, [], `RU keys missing in EN: ${ruMissingInEn.join(', ')}`);
assert.deepStrictEqual(enMissingInRu, [], `EN keys missing in RU: ${enMissingInRu.join(', ')}`);
assert.strictEqual(ruKeys.length, enKeys.length, `RU (${ruKeys.length}) and EN (${enKeys.length}) key counts must match exactly`);
console.log(`PASS 1. Exact 1:1 key parity verified: ${ruKeys.length} keys in both RU and EN dictionaries`);

// Test 2: Zero Cyrillic Characters in English Dictionary
const cyrillicRegex = /[\u0400-\u04FF]/;
const cyrillicInEn = [];

for (const [key, value] of Object.entries(i18n.translations.en)) {
  if (typeof value === 'string' && cyrillicRegex.test(value)) {
    cyrillicInEn.push({ key, value });
  }
}

assert.deepStrictEqual(cyrillicInEn, [], `Found Cyrillic characters in EN translations: ${JSON.stringify(cyrillicInEn)}`);
console.log('PASS 2. Zero Cyrillic characters found across all English translations');

// Test 3: Authentic Win 98 Terminology Validation
const authenticChecks = [
  ['app.myComputer', 'My Computer'],
  ['app.recycleBin', 'Recycle Bin'],
  ['app.myDocs', 'My Documents'],
  ['cpanel.title', 'Control Panel'],
  ['taskbar.start', 'Start'],
  ['start.programs', 'Programs'],
  ['start.documents', 'Documents'],
  ['start.settings', 'Settings'],
  ['start.find', 'Find'],
  ['start.help', 'Help'],
  ['start.run', 'Run...'],
  ['start.shutdown', 'Shut Down...'],
  ['win.minimize', 'Minimize'],
  ['win.maximize', 'Maximize'],
  ['win.close', 'Close'],
  ['taskmgr.title', 'Win Task Manager'],
  ['taskmgr.btnEndTask', 'End Task'],
  ['dosprompt.mark', 'Mark'],
  ['dosprompt.copy', 'Copy'],
  ['dosprompt.paste', 'Paste'],
  ['dosprompt.fullscreen', 'Full Screen'],
  ['sndvol.balance', 'Balance:']
];

for (const [key, expectedEn] of authenticChecks) {
  const actual = i18n.translations.en[key];
  assert.strictEqual(actual, expectedEn, `Authentic terminology mismatch for ${key}: expected "${expectedEn}", got "${actual}"`);
}
console.log(`PASS 3. All ${authenticChecks.length} canonical Win 98 terms match authentic Microslop terminology`);

// Test 4: Dynamic Language Switching and Event Dispatch
dispatchedEvents = [];
i18n.setLanguage('en');
assert.strictEqual(i18n.getLanguage(), 'en');
assert.strictEqual(mockWindow.localStorage.getItem('win98_language'), 'en');
assert.strictEqual(dispatchedEvents.length, 1);
assert.strictEqual(dispatchedEvents[0].type, 'languageChanged');
assert.strictEqual(dispatchedEvents[0].detail.language, 'en');

// Verify translation output under EN
assert.strictEqual(i18n.t('app.myComputer'), 'My Computer');
assert.strictEqual(i18n.t('taskbar.start'), 'Start');

// Switch back to RU
i18n.setLanguage('ru');
assert.strictEqual(i18n.getLanguage(), 'ru');
assert.strictEqual(mockWindow.localStorage.getItem('win98_language'), 'ru');
assert.strictEqual(dispatchedEvents.length, 2);
assert.strictEqual(dispatchedEvents[1].type, 'languageChanged');
assert.strictEqual(dispatchedEvents[1].detail.language, 'ru');

// Verify translation output under RU
assert.strictEqual(i18n.t('app.myComputer'), 'Мой компьютер');
assert.strictEqual(i18n.t('taskbar.start'), 'Пуск');
console.log('PASS 4. Dynamic language switching (setLanguage/getLanguage) and event dispatch verified');

// Test 5: Placeholder String Interpolation
i18n.setLanguage('en');
const enInterp = i18n.t('notepad.savedSuccess', 'document.txt', 'C:\\My Documents');
assert.strictEqual(enInterp, 'File <b>document.txt</b> successfully saved to:<br>\\C:\\My Documents');

i18n.setLanguage('ru');
const ruInterp = i18n.t('notepad.savedSuccess', 'document.txt', 'C:\\Мои документы');
assert.strictEqual(ruInterp, 'Файл <b>document.txt</b> успешно сохранен в:<br>\\C:\\Мои документы');
console.log('PASS 5. Placeholder formatting ({0}, {1}) verified in both RU and EN');

// Test 6: Fallback and Resilient Error Handling
assert.strictEqual(i18n.t('nonexistent.mock.key'), 'nonexistent.mock.key', 'Should return key name when translation is missing');
assert.strictEqual(i18n.t(''), '', 'Should handle empty string key safely');

// Default language validation
const freshStorage = new Map();
const freshWindow = {
  localStorage: {
    getItem: (k) => (freshStorage.has(k) ? freshStorage.get(k) : null),
    setItem: (k, v) => freshStorage.set(k, String(v)),
    removeItem: (k) => freshStorage.delete(k),
    clear: () => freshStorage.clear()
  },
  CustomEvent: mockWindow.CustomEvent,
  dispatchEvent: () => true
};
const freshCtx = { window: freshWindow, localStorage: freshWindow.localStorage, CustomEvent: freshWindow.CustomEvent, console };
vm.createContext(freshCtx);
vm.runInContext(i18nCode + '; window.i18n = new I18nManager();', freshCtx);
assert.strictEqual(freshCtx.window.i18n.getLanguage(), 'ru', 'Default language without localStorage setting must be RU');
console.log('PASS 6. Graceful fallbacks, missing key recovery, and default RU locale verified');

console.log('\n========================================');
console.log('ALL I18N LOCALIZATION TESTS PASSED!');
console.log('========================================');
