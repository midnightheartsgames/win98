const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const games = require(path.join(ROOT, 'tools', 'parohod98-game.cjs'));
const apk = require(path.join(ROOT, 'tools', 'parohod98-apk.cjs'));

let passed = 0;
const check = (name, fn) => { fn(); passed++; };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'parohod98-test-'));
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

try {
  check('three games are packed for the launcher', () => {
    assert.deepEqual(Object.keys(games.GAMES).sort(), ['forza', 'gtann', 'serioussam']);
  });

  for (const id of Object.keys(games.GAMES)) {
    check(id + ': the package has every script and style of its standalone page and the Parohod98 flag', () => {
      const r = games.build(id, path.join(tmp, id), { edition: 'apk', version: '1.0' });
      const page = games.readPage(id);
      for (const rel of page.scripts.concat(page.styles)) assert.ok(fs.existsSync(path.join(r.out, rel)), id + ' misses ' + rel);
      const html = fs.readFileSync(path.join(r.out, 'index.html'), 'utf8');
      assert.match(html, /window\.Parohod98=\{"game":"[a-z0-9]+","edition":"apk","version":"1\.0"\}/);
      assert.match(html, /viewport-fit=cover/);
      assert.ok(html.includes(page.boot), id + ' keeps its own boot code');
      assert.ok(!html.includes('parohod98/scene.js'), id + ' player package has no probe scene');
      const order = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
      assert.deepEqual(order, ['js/bugreport-core.js'].concat(page.scripts, 'js/bugreport-shot.js', 'js/parohod98-report.js'), id + ' keeps the script order, the report core first, the report window last');
    });

    check(id + ': the probe package adds the probe scene after the boot code', () => {
      const r = games.build(id, path.join(tmp, id + '-probe'), { edition: 'probe' });
      const html = fs.readFileSync(path.join(r.out, 'index.html'), 'utf8');
      assert.ok(html.lastIndexOf('parohod98/scene.js') > html.lastIndexOf('<script>'), id + ' scene runs after the game boots');
      assert.ok(fs.existsSync(path.join(r.out, 'parohod98', 'scene.js')));
    });
  }

  check('GTA: the player package carries all eight radio stations, the probe only one', () => {
    const full = games.build('gtann', path.join(tmp, 'gtann-radio'), { edition: 'apk' });
    const radio = full.files.filter(f => f.startsWith('content/radio/'));
    assert.equal(radio.length, 8);
    const probe = games.build('gtann', path.join(tmp, 'gtann-radio-probe'), { edition: 'probe' });
    assert.deepEqual(probe.files.filter(f => f.startsWith('content/radio/')), ['content/radio/EMOTION.mp3']);
  });

  check('the package tool refuses to wipe a folder it did not make', () => {
    const foreign = path.join(tmp, 'foreign');
    fs.mkdirSync(foreign);
    fs.writeFileSync(path.join(foreign, 'keep.txt'), 'x');
    assert.throws(() => games.build('serioussam', foreign), /not made by parohod98-game/);
  });

  check('the probe APK stages the probe page, the report core and the three probe packages', () => {
    const www = path.join(tmp, 'www');
    const staged = apk.stageWww(www, { probe: true, version: '0.1' });
    for (const f of ['launcher/index.html', 'launcher/probe.js', 'launcher/probe.css', 'launcher/icon.png', 'js/bugreport-core.js']) assert.ok(fs.existsSync(path.join(www, f)), f);
    assert.deepEqual(staged.map(g => g.id).sort(), ['forza', 'gtann', 'serioussam']);
    const html = fs.readFileSync(path.join(www, 'launcher', 'index.html'), 'utf8');
    assert.match(html, /\.\.\/js\/bugreport-core\.js/);
  });

  check('the player APK stages the launcher page without games, the key comes from electron/updater.js', () => {
    const www = path.join(tmp, 'www-player');
    const staged = apk.stageWww(www, { probe: false, version: '1.0' });
    assert.deepEqual(staged, []);
    for (const f of ['launcher/index.html', 'launcher/launcher.js', 'launcher/launcher-state.js', 'launcher/launcher.css', 'launcher/fonts/dejavu-condensed-400.woff2', 'launcher/fonts/dejavu-condensed-700.woff2', 'launcher/fonts/dejavu-LICENSE.txt', 'js/bugreport-core.js']) assert.ok(fs.existsSync(path.join(www, f)), f);
    for (const m of read('tools/parohod98/launcher/launcher.css').matchAll(/url\(([^)]+)\)/g)) assert.ok(fs.existsSync(path.join(www, 'launcher', m[1])), 'the launcher font ' + m[1] + ' is in the APK');
    assert.ok(!fs.existsSync(path.join(www, 'games')), 'games are downloaded, not shipped in the APK');
    assert.match(fs.readFileSync(path.join(www, 'launcher', 'index.html'), 'utf8'), /window\.Win98Build=/);
    assert.equal(apk.publicKey(), require('../electron/updater.js').PUBLIC_KEY);
    for (const f of fs.readdirSync(path.join(ROOT, 'tools', 'parohod98', 'android'))) assert.ok(!read('tools/parohod98/android/' + f).includes(apk.publicKey()), f + ' keeps a second copy of the key');
    assert.equal(apk.UPDATE_BASE, 'https://pennygachi.men/web98/update/');
    assert.ok(apk.JAVA.includes('Store.java') && apk.JAVA.includes('DownloadService.java') && apk.JAVA.includes('ApkUpdate.java'));
  });

  check('the launcher page shows no store words, prices or purchases', () => {
    const text = apk.LAUNCHER_FILES.map(f => read('tools/parohod98/launcher/' + f)).join('\n');
    assert.ok(!/\bSteam\b|Valve|Купить|Купите|\bBuy\b|Цена|\bPrice\b|\$\d|\d ?₽|руб\.|Microsoft|Windows/.test(text));
    assert.match(text, /Подождать Wi-Fi/);
    assert.match(text, /Android покажет уведомление/);
  });

  check('the downloader: service with a notification, network, install permission, games served from the store', () => {
    const manifest = read('tools/parohod98/android/AndroidManifest.xml');
    for (const p of ['INTERNET', 'ACCESS_NETWORK_STATE', 'REQUEST_INSTALL_PACKAGES', 'FOREGROUND_SERVICE', 'FOREGROUND_SERVICE_DATA_SYNC', 'POST_NOTIFICATIONS']) assert.match(manifest, new RegExp('android\.permission\.' + p + '"'), p);
    assert.match(manifest, /android:name="\.App"/);
    assert.match(manifest, /android:name="\.DownloadService"[\s\S]*?android:foregroundServiceType="dataSync"/);
    const service = read('tools/parohod98/android/DownloadService.java');
    assert.match(service, /FOREGROUND_SERVICE_TYPE_DATA_SYNC/);
    assert.match(service, /Пауза/);
    assert.match(service, /Отмена/);
    const game = read('tools/parohod98/android/GameActivity.java');
    assert.match(game, /app\.served\(game/);
    assert.match(game, /gameClosed\(game\)/);
    const app = read('tools/parohod98/android/App.java');
    assert.match(app, /MOBILE_ASK = 25L \* 1048576/);
    assert.match(app, /registerDefaultNetworkCallback/);
    assert.ok(read('tools/parohod98/android/ApkUpdate.java').includes('name.matches("Parohod98-[0-9.]+'), 'the launcher installs only its own APK names');
    assert.ok(!/getLongVersionCode/.test(read('tools/parohod98/android/Device.java')), 'getLongVersionCode needs Android 9, the app starts on Android 8');
  });

  check('the scene runner restores the saves it touched and reports through the bridge', () => {
    const scene = read('tools/parohod98/probe/scene.js');
    for (const p of ['ss98-', 'fh_riga_', 'gtann_']) assert.ok(scene.includes("'" + p + "'"), 'save prefix ' + p);
    assert.match(scene, /bridge\.exit\(\)/);
    assert.match(scene, /window\.parohod98Back = /);
    const probe = read('tools/parohod98/probe/probe.js');
    assert.match(probe, /source: 'parohod98'/);
    assert.match(probe, /kind: 'idea'/);
  });

  check('reports from the launcher and the games get parohod98 channels', () => {
    const core = read('js/bugreport-core.js');
    assert.match(core, /'parohod98-' \+ root\.Parohod98\.edition/);
    assert.match(core, /return 'parohod98-apk'/);
  });

  check('the Android app: landscape, minSdk 26, the bridges split between the two activities', () => {
    const manifest = read('tools/parohod98/android/AndroidManifest.xml');
    assert.match(manifest, /package="com\.win98clone\.parohod98"/);
    assert.match(manifest, /minSdkVersion="26"/);
    assert.equal((manifest.match(/sensorLandscape/g) || []).length, 2);
    assert.match(manifest, /android:label="Пароход 98"/);
    const launcher = read('tools/parohod98/android/LauncherActivity.java');
    const game = read('tools/parohod98/android/GameActivity.java');
    assert.match(launcher, /addJavascriptInterface\(new Bridge\(\), "Parohod98"\)/);
    assert.match(game, /addJavascriptInterface\(new Bridge\(\), "Parohod98Game"\)/);
    assert.ok(!/public void play\(/.test(game), 'the game page cannot start other games');
    assert.match(game, /onRenderProcessGone/);
    assert.match(game, /Device\.preferFastest\(this\)/, 'the game window asks Android for the fastest screen mode');
    assert.match(game, /public String display\(\)/);
    assert.match(read('tools/parohod98/android/Device.java'), /preferredDisplayModeId = best\.getModeId\(\)/);
    assert.match(read('tools/parohod98/android/Device.java'), /"lowRam", am\.isLowRamDevice\(\)/);
    assert.match(read('tools/parohod98/android/Web.java'), /"Content-Range"/);
  });

  check('both APKs share one build pipeline and Star Rail 98 keeps its key', () => {
    const hsr = read('tools/hsr98-apk.cjs');
    assert.match(hsr, /require\('\.\/android-apk\.cjs'\)/);
    assert.match(hsr, /homeKey\('hsr98\.keystore'\)/);
    assert.match(read('tools/parohod98-apk.cjs'), /homeKey\('parohod98\.keystore'\)/);
  });

  check('new launcher sources have no comments', () => {
    const files = ['tools/android-apk.cjs', 'tools/hsr98-apk.cjs', 'tools/parohod98-apk.cjs', 'tools/parohod98-game.cjs', 'tools/parohod98-icon.py',
      ...fs.readdirSync(path.join(ROOT, 'tools', 'parohod98', 'android')).filter(f => f.endsWith('.java')).map(f => 'tools/parohod98/android/' + f),
      ...fs.readdirSync(path.join(ROOT, 'tools', 'parohod98', 'probe')).map(f => 'tools/parohod98/probe/' + f),
      ...fs.readdirSync(path.join(ROOT, 'tools', 'parohod98', 'launcher')).map(f => 'tools/parohod98/launcher/' + f),
      'tools/parohod98-shots.cjs', 'tests/parohod98-launcher.test.js',
      ...fs.readdirSync(path.join(ROOT, 'tests', 'parohod98-launcher')).map(f => 'tests/parohod98-launcher/' + f)];
    for (const f of files) {
      const text = read(f).replace(/https?:\/\/[^\s'"]+/g, '');
      const hash = f.endsWith('.py') && /^\s*#/m.test(text);
      assert.ok(!/^\s*\/\/|\/\*|<!--/m.test(text) && !hash, f + ' has a comment');
    }
  });
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('parohod98: ' + passed + ' checks passed');
