const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const noop = () => {};
function makeCanvas(w = 300, h = 150) {
  const cv = { width: w, height: h, style: {}, className: '', addEventListener: noop, getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 480 }), toDataURL: () => 'data:image/png;base64,AA==' };
  const grad = () => ({ addColorStop: noop });
  const ctx = new Proxy({
    canvas: cv, globalAlpha: 1, font: '10px x', fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, imageSmoothingEnabled: true,
    measureText: s => ({ width: String(s).length * 6 }), createPattern: () => ({}), createLinearGradient: grad, createRadialGradient: grad,
    getImageData: (x, y, gw, gh) => ({ data: new Uint8ClampedArray(Math.max(1, gw * gh) * 4), width: gw, height: gh }),
    createImageData: (gw, gh) => ({ data: new Uint8ClampedArray(gw * gh * 4), width: gw, height: gh })
  }, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => { t[k] = v; return true; } });
  cv.getContext = () => ctx;
  return cv;
}
const store = new Map();
Object.assign(globalThis, {
  document: { createElement: () => makeCanvas() },
  localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
  requestAnimationFrame: () => 1
});

const html = fs.readFileSync(path.join(ROOT, 'hsr98.html'), 'utf8');
const files = [...html.matchAll(/<script src="(js\/apps\/hsr98\/[^"]+)"><\/script>/g)].map(m => m[1]);
assert.ok(files.includes('js/apps/hsr98/hsr-ui-update.js'), 'hsr98.html loads the update screen');
require(path.join(ROOT, 'js', 'bugreport-core.js'));
for (const f of files) require(path.join(ROOT, f));
const H = globalThis.Hsr98;
const root = { classList: { add: noop }, set innerHTML(v) { this.html = v; }, appendChild: noop, addEventListener: noop, removeEventListener: noop, focus: noop };

let passed = 0;
const check = (name, fn) => { fn(); passed++; };
const makeUi = () => {
  const ui = new H.UI(root, {});
  ui.running = false;
  ui.update(0.05);
  ui.render();
  return ui;
};
const updateItem = ui => ui.titleItems().find(i => i.label === 'Обновления');
const calls = [];
const bridge = { code: '100', versionCode() { return this.code; }, checkUpdate: ch => calls.push(['check', ch]), downloadUpdate: (u, s, b) => calls.push(['download', u, s, b]), cancelUpdate: () => calls.push(['cancel']), installUpdate: () => calls.push(['install']), openInstallSettings: () => calls.push(['settings']) };
const pointer = (version, versionCode) => ({ product: 'sr98', channel: 'stable', version, apk: { url: 'StarRail98-' + version + '.apk', versionName: version, versionCode, bytes: 35577174, sha256: 'ab'.repeat(32) } });
const notes = { format: 'win98-notes', v: 1, product: 'sr98', versions: [{ version: '1.6.9', title: 'Валютные войны', summary: 'Новый режим.', sections: [{ title: 'Новое', items: ['Валютные войны в лаборатории'] }], fixed: [{ id: 'BR-261028-AB12', text: 'x' }] }] };

check('without the Android bridge the title menu has no update item', () => {
  delete globalThis.Sr98Android;
  assert.equal(updateItem(makeUi()), undefined);
});

check('the APK title menu gets the item and checks once a day by itself', () => {
  globalThis.Sr98Android = bridge;
  const ui = makeUi();
  const item = updateItem(ui);
  assert.ok(item);
  assert.equal(item.icon, 'update');
  assert.match(item.note, /проверить обновления/);
  assert.deepEqual(calls.splice(0), [['check', 'stable']]);
  ui.titleItems();
  assert.equal(calls.length, 0, 'one automatic check per start');
  ui.updateInfo(JSON.stringify({ pointer: pointer('1.6.9', 200), notes }));
  const fresh = updateItem(ui);
  assert.equal(fresh.badge, 'NEW');
  assert.match(fresh.note, /Новая версия 1\.6\.9 · 33,9 МБ/);
  assert.equal(fresh.noteCol, H.UI_CONST.C.gold);
  assert.equal(makeUi() && calls.length, 0, 'no new automatic check within a day');
});

check('the screen downloads from the update folder, installs and handles permission and cancel', () => {
  const ui = makeUi();
  ui.openUpdate();
  calls.splice(0);
  ui.updateInfo(JSON.stringify({ pointer: pointer('1.6.9', 200), notes }));
  ui.render();
  const screen = ui.top();
  assert.ok(screen.updateScreen && screen.pause);
  screen.key('ok');
  assert.deepEqual(calls.splice(0), [['download', 'https://pennygachi.men/web98/update/sr98/StarRail98-1.6.9.apk', 'ab'.repeat(32), '35577174']]);
  ui.updateProgress(1000000, 35577174);
  ui.render();
  screen.key('back');
  assert.equal(ui.top(), screen, 'Esc does not leave during the download');
  ui.updateReady();
  assert.deepEqual(calls.splice(0), [['install']]);
  ui.updateNeedsPermission();
  ui.render();
  screen.key('ok');
  assert.deepEqual(calls.splice(0), [['settings']]);
  ui.updatePermissionBack(true);
  assert.deepEqual(calls.splice(0), [['install']]);
  ui.updateResult(3);
  ui.render();
  screen.key('ok');
  assert.deepEqual(calls.splice(0), [['install']], 'a cancelled install restarts without a new download');
  ui.updateError('corrupt');
  ui.render();
  screen.key('ok');
  assert.equal(calls.splice(0)[0][0], 'download');
  ui.updateError('space', String(40 * 1048576));
  ui.render();
  screen.key('back');
  assert.notEqual(ui.top(), screen);
});

check('an older or equal build on the server means the latest version', () => {
  const ui = makeUi();
  ui.updateInfo(JSON.stringify({ pointer: pointer('1.6.0', 100), notes: null }));
  const item = updateItem(ui);
  assert.equal(item.badge, '');
  assert.match(item.note, /последняя/);
});

check('five taps on the version switch to the test channel', () => {
  const ui = makeUi();
  ui.openUpdate();
  calls.splice(0);
  for (let i = 0; i < 5; i++) ui.updateTap();
  assert.deepEqual(calls.splice(0), [['check', 'test']]);
  assert.equal(JSON.parse(store.get('sr98.update')).channel, 'test');
  assert.ok(ui.toasts.some(t => /Канал обновлений: test/.test(t.text)));
  for (let i = 0; i < 5; i++) ui.updateTap();
  assert.equal(JSON.parse(store.get('sr98.update')).channel, 'stable');
});

check('the first start of a new version says so', () => {
  store.set('sr98.update', JSON.stringify({ checkedAt: Date.now(), channel: 'stable', ran: '1.5.9', latest: null }));
  const ui = makeUi();
  ui.titleItems();
  assert.ok(ui.toasts.some(t => t.text === 'Обновлено до ' + H.BUILD_VERSION));
  assert.equal(JSON.parse(store.get('sr98.update')).ran, H.BUILD_VERSION);
});

check('the APK asks for the install permission and keeps the bridge methods', () => {
  assert.match(fs.readFileSync(path.join(ROOT, 'tools/hsr98-standalone/android/AndroidManifest.xml'), 'utf8'), /android\.permission\.REQUEST_INSTALL_PACKAGES/);
  const java = fs.readFileSync(path.join(ROOT, 'tools/hsr98-standalone/android/MainActivity.java'), 'utf8');
  for (const m of ['versionCode()', 'clipboardText()', 'copyText(String text)', 'checkUpdate(final String channel)', 'downloadUpdate(final String url', 'cancelUpdate()', 'installUpdate()', 'openInstallSettings()']) assert.ok(java.includes('public ' + (m === 'versionCode()' || m === 'clipboardText()' ? 'String ' : 'void ') + m), m);
  assert.match(java, /url\.startsWith\(UPDATE_BASE\)/);
  assert.match(java, /PackageInstaller\.SessionParams\.MODE_FULL_INSTALL/);
});

console.log(`hsr98-update: ${passed} checks passed`);
