const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const MODULES = ['bl-core', 'bl-world', 'bl-shaders', 'bl-render', 'bl-flight', 'bl-audio', 'bl-game'];
for (const m of MODULES) require(path.join(ROOT, 'js/apps/bliss', m + '.js'));
const B = globalThis.Bliss;

B.buildHeightmap();
const sky = B.buildSky();
const frames = B.buildFrames(sky);
const T = B.TUNING;

{
  assert.deepEqual(frames.map((f) => f.id), ['bliss', 'oak', 'vine', 'above', 'window'], 'five frames in the design order');
  for (const f of frames) {
    assert.ok(f.pos[1] > B.groundHeight(f.pos[0], f.pos[2]), `frame ${f.id} is above the ground`);
    assert.ok(Math.hypot(f.pos[0], f.pos[2]) < T.boundary, `frame ${f.id} is inside the soft boundary`);
    assert.ok(f.pos[1] < T.ceiling, `frame ${f.id} is below the ceiling`);
  }
  assert.ok(B.groundHeight(-120, -400) > B.groundHeight(0, 140) + 40, 'main hill rises over the start meadow');
  assert.equal(sky.thermals.length, 3);
  assert.ok(B.buildTrees(B.roadPolyline()).length > 30, 'oaks are placed');
}

const fakeInput = (keys = [], mouse = () => [0, 0]) => ({
  consume: mouse,
  lastDevice: 'mouse',
  down: (...codes) => codes.some((c) => keys.includes(c)),
});
const pose = () => ({ pos: [0, B.groundHeight(0, 140) + 6, 140], yaw: 0, pitch: 0.2 });
const fly = (flyer, input, seconds, each) => {
  for (let i = 0; i < seconds * 60; i++) { flyer.update(1 / 60, input, sky.thermals); if (each) each(flyer); }
};

{
  const flyer = new B.Flyer(pose());
  fly(flyer, fakeInput(['KeyW'], () => [0, 60]), 40, (f) => {
    assert.ok(f.agl >= T.minClear - 1e-3, 'ground never gets closer than the minimum clearance');
    assert.ok(f.speed >= T.vMin, 'speed never drops below the stall-free minimum');
  });
  assert.ok(flyer.touching || flyer.agl < 30, 'steering down brings the bird to the ground');
}
{
  const flyer = new B.Flyer(pose());
  flyer.pos = [3200, 300, 0];
  flyer.yaw = flyer.aimYaw = -Math.PI / 2;
  fly(flyer, fakeInput(), 120);
  assert.ok(Math.hypot(flyer.pos[0], flyer.pos[2]) < 3200, 'the wind turns the bird back to the valley');
}
{
  const th = sky.thermals[0];
  const flyer = new B.Flyer(pose());
  flyer.pos = [th.x, 200, th.z];
  flyer.pitch = flyer.aimPitch = 0;
  flyer.update(1 / 60, fakeInput(), sky.thermals);
  fly(flyer, fakeInput(['KeyA']), 8);
  assert.ok(flyer.lift > 0 || flyer.pos[1] > 200, 'a thermal lifts the bird');
}

{
  const source = (f) => read(f);
  const html = source('index.html');
  for (const m of MODULES) assert.ok(html.includes(`js/apps/bliss/${m}.js`), `${m} is loaded`);
  assert.ok(html.includes('js/apps/bliss-app.js') && html.includes('css/apps/bliss.css'));
  assert.ok(html.indexOf('bl-core.js') < html.indexOf('bl-game.js') && html.indexOf('bl-game.js') < html.indexOf('bliss-app.js'), 'modules load in order');

  assert.match(source('js/desktop.js'), /id: 'bliss'.*appBliss/, 'base icon for the shortcut in the desktop folder');
  assert.match(source('js/desktop.js'), /icons: \[[^\]]*'bliss'/, 'shortcut in the desktop folder');
  assert.match(source('js/taskbar.js'), /data-action="bliss"/, 'Start menu item');
  assert.match(source('js/taskbar.js'), /case 'bliss':/, 'Start menu action');
  assert.match(source('js/apps/dialogs.js'), /cmd === 'bliss'/, 'Run command');
  assert.match(source('js/apps/explorer.js'), /item\.app === 'bliss'/, 'BLISS.EXE runs from Explorer');
  assert.match(source('js/filesystem.js'), /'BLISS\.EXE'/, 'exe in the file system');
  assert.match(source('js/icons.js'), /'bliss': px\(/, 'icon');
  assert.match(source('js/apps/file-properties.js'), /bliss: 'C:\\\\WINDOWS\\\\BLISS\.EXE'/, 'properties path');

  const manager = source('js/game-manager.js');
  assert.ok(!/(id:\s*|['"]?)bliss['"]?\s*[:,]/.test(manager), 'a standard game has no Steam catalog entry');
  assert.ok(!/isInstalled\('bliss'\)/.test(source('js/taskbar.js') + source('js/desktop.js')), 'a standard game is never gated by install state');
}

{
  const ctx = { console, window: {}, localStorage: { getItem: () => null, setItem() {} } };
  ctx.window.localStorage = ctx.localStorage;
  vm.createContext(ctx);
  vm.runInContext(read('js/i18n.js') + '; window.i18n = new I18nManager();', ctx);
  const i18n = ctx.window.i18n;
  const used = new Set();
  for (const f of ['js/apps/bliss/bl-game.js', 'js/apps/bliss-app.js']) {
    for (const m of read(f).matchAll(/t\('((?:bliss|app)\.[\w.]*\w)'/g)) used.add(m[1]);
  }
  for (const f of frames) { used.add('bliss.frame.' + f.id); used.add('bliss.clue.' + f.id); }
  assert.ok(used.size > 50, 'strings are collected');
  for (const lang of ['ru', 'en']) {
    i18n.setLanguage(lang);
    for (const key of used) assert.notEqual(i18n.t(key), key, `${lang}: ${key} is translated`);
  }
  i18n.setLanguage('en');
  assert.equal(i18n.t('bliss.toastFrame', 'Lone Oak', 2, 5), '"Lone Oak" · 2 of 5');
}

{
  const ctx = { console, window: { gameManager: { catalog: {} } } };
  ctx.globalThis = ctx;
  ctx.gameManager = ctx.window.gameManager;
  vm.createContext(ctx);
  vm.runInContext(read('js/apps/backup-catalog.js'), ctx);
  ctx.BackupCatalog = ctx.window.BackupCatalog;
  assert.equal(ctx.BackupCatalog.componentOfKey('win98_bliss_album'), 'builtin');
  assert.equal(ctx.BackupCatalog.componentOfKey('win98_bliss_settings'), 'builtin');
  assert.equal(B.ALBUM_KEY, 'win98_bliss_album');
  assert.equal(B.SETTINGS_KEY, 'win98_bliss_settings');
}

{
  const sources = [...MODULES.map((m) => `js/apps/bliss/${m}.js`), 'js/apps/bliss-app.js', 'css/apps/bliss.css'];
  for (const f of sources) assert.ok(!/(^|\s)\/\/\s|\/\*/.test(read(f)), `${f} has no comments`);
  const game = read('js/apps/bliss/bl-game.js');
  assert.ok(!/requestFullscreen|a\.download|confirm\(/.test(game), 'the game stays inside its window and the system dialogs');
}

console.log('Bliss tests passed');
