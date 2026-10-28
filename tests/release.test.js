const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { EXE_EXCLUDED, RELEASE_FILE, buildDate, displayVersion, hashTree, writeRelease } = require('../tools/release.cjs');
const { build, gameVersion, checkVersion } = require('../tools/hsr98-standalone.cjs');
const { reportMarkdown } = require('../tools/bugs.cjs');
const { createBugHandler } = require('../js/bugreport-local.js');

const root = path.join(__dirname, '..');
let passed = 0;
const tests = [];
const check = (name, fn) => tests.push([name, fn]);
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
const excluded = p => EXE_EXCLUDED.some(re => re.test(p));

check('the exe build leaves out tmp, root test files, plans, release texts and dev folders', () => {
  for (const p of ['/tmp', '/tmp/rom', '/soft.test.js', '/LAUNCHER.md', '/releases/win98/next.md', '/tools/release.cjs', '/tests/release.test.js', '/bugreports/x/report.json', '/content/Legion Arena/a.png']) assert.ok(excluded(p), p);
  for (const p of ['/index.html', '/js/main.js', '/js/apps/hsr98/hsr-core.js', '/content/steam/hsr98-1.jpg', '/electron/main.js', '/server.js', '/content/Fallout/MASTER.DAT']) assert.ok(!excluded(p), p);
});

check('build numbers are DDMMYYYY and versions show the build in brackets', () => {
  assert.equal(buildDate(new Date(2026, 9, 28, 23, 59)), '28102026');
  assert.equal(buildDate(new Date(2026, 0, 5)), '05012026');
  assert.equal(displayVersion({ version: '1.0', build: '28102026' }), '1.0 (28102026)');
  assert.equal(displayVersion({ version: '1.6.3' }), '1.6.3');
  assert.equal(displayVersion({}), '');
});

check('release.json lists every installed file with size and sha256, sorted, without itself', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'win98-release-'));
  fs.mkdirSync(path.join(dir, 'resources', 'app', 'js'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'Win98.exe'), 'exe');
  fs.writeFileSync(path.join(dir, 'resources', 'app', 'index.html'), '<html>');
  fs.writeFileSync(path.join(dir, 'resources', 'app', 'js', 'b.js'), 'b');
  fs.writeFileSync(path.join(dir, 'resources', 'app', 'js', 'a.js'), 'a');
  fs.writeFileSync(path.join(dir, RELEASE_FILE), 'old');
  const release = await writeRelease(dir, { product: 'win98', version: '1.0', build: '28102026', runtime: 'electron-0-win32-x64' });
  const saved = JSON.parse(fs.readFileSync(path.join(dir, RELEASE_FILE), 'utf8'));
  assert.deepEqual(saved, JSON.parse(JSON.stringify(release)));
  assert.equal(saved.format, 'win98-release');
  assert.equal(saved.version, '1.0');
  assert.deepEqual(saved.files, [
    ['Win98.exe', 3, sha('exe')],
    ['resources/app/index.html', 6, sha('<html>')],
    ['resources/app/js/a.js', 1, sha('a')],
    ['resources/app/js/b.js', 1, sha('b')]
  ]);
  assert.deepEqual(await hashTree(dir, [RELEASE_FILE]), saved.files);
  fs.rmSync(dir, { recursive: true, force: true });
});

check('report.md and the dev build stamp carry the version', async () => {
  const md = reportMarkdown({ id: 'BR-261028-AB12', user: { title: 't', kind: 'bug', repeat: 'once' }, build: { version: '1.15', build: '02112026', commit: '9ab12cd' }, source: 'win98', channel: 'exe' }, { status: 'new' }, {});
  assert.match(md, /версия 1\.15 \(02112026\) · сборка 9ab12cd/);
  const dev = reportMarkdown({ id: 'BR-261028-AB13', user: { title: 't', kind: 'bug', repeat: 'once' }, build: { version: 'dev', commit: '9ab12cd' } }, { status: 'new' }, {});
  assert.doesNotMatch(dev, /версия/);
  const handle = createBugHandler(fs.mkdtempSync(path.join(os.tmpdir(), 'win98-devbuild-')));
  let body = '';
  handle({ url: '/build.json', method: 'GET', headers: {} }, { writeHead() {}, setHeader() {}, end(b) { body = String(b); } });
  assert.equal(JSON.parse(body).version, 'dev');
});

check('SR98 builds are numbered from Hsr98.VERSION and the title corner shows the full number', () => {
  const base = gameVersion();
  assert.doesNotThrow(() => checkVersion(base + '.3'));
  assert.doesNotThrow(() => checkVersion('dev'));
  assert.throws(() => checkVersion(base));
  assert.throws(() => checkVersion('9.9.1'));
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'sr98-version-'));
  build(out, 'apk', base + '.3');
  const page = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
  assert.ok(page.includes('"version":"' + base + '.3"'));
  fs.rmSync(out, { recursive: true, force: true });
  const brandWith = stamp => {
    const ctx = { Hsr98Standalone: 'apk', Win98Build: stamp };
    ctx.globalThis = ctx;
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(root, 'js/apps/hsr98/hsr-core.js'), 'utf8'), ctx);
    return ctx.Hsr98;
  };
  assert.equal(brandWith({ version: base + '.3' }).BRAND.disc.split(' ')[0], 'v' + base + '.3');
  assert.equal(brandWith({ version: 'dev' }).BRAND.disc.split(' ')[0], 'v' + base);
  assert.equal(brandWith({ version: base + '.3' }).BUILD_VERSION, base + '.3');
});

check('release notes parse into sections, keep fixed reports and round-trip through the version file', () => {
  const { parseNotes, versionMd, checkNames } = require('../tools/release.cjs');
  const md = '# Kirill The Game в Steam\n\nКратко: новая игра в Steam.\n\n## Новое\n- В Steam вышла Kirill The Game:\n  восемь глав.\n- Второй пункт.\n\n## Исправлено\n- Проводник больше не теряет выделение.\n';
  const n = parseNotes(md, 'next.md');
  assert.equal(n.title, 'Kirill The Game в Steam');
  assert.equal(n.summary, 'новая игра в Steam.');
  assert.deepEqual(n.sections.map(s => s.title), ['Новое', 'Исправлено']);
  assert.equal(n.sections[0].items[0], 'В Steam вышла Kirill The Game: восемь глав.');
  const saved = versionMd(n, '1.15', '02112026', '02.11.2026', [{ id: 'BR-261027-7K3Q', text: 'Диалог с Броней снова появляется.' }]);
  const back = parseNotes(saved, '1.15.md');
  assert.equal(back.build, '02112026');
  assert.equal(back.date, '02.11.2026');
  assert.deepEqual(back.sections, n.sections);
  assert.deepEqual(back.fixed, [{ id: 'BR-261027-7K3Q', text: 'Диалог с Броней снова появляется.' }]);
  assert.throws(() => parseNotes('# T\n\n## Новое\n- x\n', 'a.md'), /Кратко/);
  assert.throws(() => parseNotes('# T\nКратко: s\nстрока без раздела\n', 'a.md'), /before the first/);
  assert.throws(() => checkNames('Обновление для Windows 98', 'x'), /Microslop or Win/);
  assert.doesNotThrow(() => checkNames('Microslop Win 98, окна и windows-подобные рамки', 'x'));
});

check('the next version follows both channels', () => {
  const { nextVersion } = require('../tools/release.cjs');
  assert.equal(nextVersion({}), '1.0');
  assert.equal(nextVersion({ stable: { version: '1.9' }, test: { version: '1.10' } }), '1.11');
  assert.equal(nextVersion({ stable: { version: '1.3' }, test: null }), '1.4');
});

check('news files become items with dates, leads, lists and pictures for their products', () => {
  const { newsJson } = require('../tools/release.cjs');
  const news = newsJson('win98');
  assert.equal(news.json.format, 'win98-news');
  for (const item of news.json.items) {
    assert.match(item.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(item.title && item.lead, item.id);
  }
});

check('SR98 news come from the site news.js that the site itself loads', () => {
  const { newsJson } = require('../tools/release.cjs');
  const html = fs.readFileSync(path.join(root, 'web98-site/sr98/index.html'), 'utf8');
  assert.ok(html.indexOf('src="news.js') > 0 && html.indexOf('src="news.js') < html.indexOf('src="site.js'), 'news.js loads before site.js');
  assert.match(fs.readFileSync(path.join(root, 'web98-site/sr98/site.js'), 'utf8'), /const NEWS = window\.SR98_NEWS \|\| \[\];/);
  const items = newsJson('sr98').json.items.filter(i => i.id.startsWith('site-'));
  assert.ok(items.length >= 10);
  for (const i of items) {
    assert.match(i.date, /^\d{4}-\d{2}-\d{2}$/, i.id);
    assert.match(i.dateText, /^\d{2}\.\d{2}\.\d{4}$/, i.id);
    assert.ok(i.title && i.lead && i.body.length, i.id);
  }
});

check('players see fixed-in-next reports as coming in the next update', () => {
  assert.match(fs.readFileSync(path.join(root, 'js/apps/bugreport.js'), 'utf8'), /fixedIn === 'next' \? this\.L\('Исправлен, будет в следующем обновлении'/);
  assert.match(fs.readFileSync(path.join(root, 'js/apps/hsr98/hsr-ui-bug.js'), 'utf8'), /fixedIn === 'next' \? 'Исправлен, будет в обновлении'/);
});

check('a postponed update shows a tray icon and leads back to the launcher', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(index, /<script src="js\/apps\/update-notice\.js"><\/script>/);
  const preload = fs.readFileSync(path.join(root, 'electron/preload.js'), 'utf8');
  assert.match(preload, /pendingUpdate: \(\) => ipcRenderer\.invoke\('win98:pending-update'\)/);
  assert.match(preload, /openLauncher: \(\) => ipcRenderer\.invoke\('win98:open-launcher'\)/);
  const main = fs.readFileSync(path.join(root, 'electron/main.js'), 'utf8');
  assert.match(main, /ipcMain\.handle\('win98:open-launcher'/);
  assert.match(fs.readFileSync(path.join(root, 'electron/launcher-host.js'), 'utf8'), /event\.sender !== win\.webContents/);
  const notice = fs.readFileSync(path.join(root, 'js/apps/update-notice.js'), 'utf8');
  assert.match(notice, /executeAction\('shutdown'\)/);
  assert.match(fs.readFileSync(path.join(root, 'js/apps/dialogs.js'), 'utf8'), /glyph\('win-update'\)\}<\/td><td><b>\$\{L\('Лаунчер Win 98'/);
});

check('About Win shows the project build from BugReport.buildInfo', () => {
  const src = fs.readFileSync(path.join(root, 'js/apps/dialogs.js'), 'utf8');
  assert.match(src, /about-project-build/);
  assert.match(src, /BugReport\.buildInfo\(\)/);
  const i18n = fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8');
  assert.match(i18n, /'about\.projectBuild': 'Сборка проекта: \{0\}'/);
  assert.match(i18n, /'about\.projectBuild': 'Project build: \{0\}'/);
});

(async () => {
  for (const [name, fn] of tests) {
    try {
      await fn();
      passed++;
    } catch (err) {
      console.error('FAIL: ' + name);
      throw err;
    }
  }
  console.log(`release: ${passed} checks passed`);
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
