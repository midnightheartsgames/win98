const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { build, MUSIC_PREFIX } = require('../tools/hsr98-standalone.cjs');

const root = path.join(__dirname, '..');
let passed = 0;
const check = (name, fn) => { fn(); passed++; };

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'hsr98-standalone-'));
const result = build(out);
const pageSrc = fs.readFileSync(path.join(root, 'hsr98.html'), 'utf8');
const sources = [...pageSrc.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const page = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
const local = [...page.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);

check('every hsr98.html script is copied in the same order between the fetch shim and the touch layer', () => {
  assert.equal(local[0], 'game/files.js');
  assert.equal(local[local.length - 1], 'game/touch.js');
  assert.deepEqual(local.slice(1, -1), sources.map(s => 'game/' + path.basename(s)));
  assert.equal(result.scripts, sources.length);
});

check('copied game files are byte-identical to the originals', () => {
  for (const s of sources) assert.ok(fs.readFileSync(path.join(root, s)).equals(fs.readFileSync(path.join(out, 'game', path.basename(s)))), s);
  assert.ok(fs.readFileSync(path.join(root, 'css/apps/hsr98.css')).equals(fs.readFileSync(path.join(out, 'game/hsr98.css'))));
});

check('every referenced file exists in the output', () => {
  for (const ref of [...page.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1])) assert.ok(fs.existsSync(path.join(out, ref)), ref);
});

check('the page loads the touch controls with F7 and F8 buttons and blocks pinch zoom', () => {
  assert.match(page, /href="game\/touch\.css"/);
  assert.match(page, /user-scalable=no/);
  const touch = fs.readFileSync(path.join(out, 'game/touch.js'), 'utf8');
  for (const code of ['F7', 'F8', 'Enter', 'Escape', 'KeyQ', 'KeyE', 'KeyF', 'KeyM', 'KeyH', 'Tab', 'ShiftLeft']) assert.ok(touch.includes("'" + code + "'"), code);
});

check('the standalone copies are branded Star Rail 98 and the APK names its own edition', () => {
  assert.match(page, /<title>Star Rail 98<\/title>/);
  assert.ok(page.indexOf('window.Hsr98Standalone="web";') < page.indexOf('game/files.js'));
  const apkOut = fs.mkdtempSync(path.join(os.tmpdir(), 'hsr98-standalone-apk-'));
  build(apkOut, 'apk');
  assert.ok(fs.readFileSync(path.join(apkOut, 'index.html'), 'utf8').includes('window.Hsr98Standalone="apk";'));
  fs.rmSync(apkOut, { recursive: true, force: true });
  const brandFor = edition => {
    const ctx = { Hsr98Standalone: edition };
    ctx.globalThis = ctx;
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(root, 'js/apps/hsr98/hsr-core.js'), 'utf8'), ctx);
    return ctx.Hsr98.BRAND;
  };
  const web = brandFor('web'), apk = brandFor('apk'), system = brandFor(undefined);
  for (const b of [web, apk]) {
    assert.ok(b.standalone);
    assert.doesNotMatch(JSON.stringify(b), /Honkai|HONKAI|HSR|miHoYo/);
  }
  assert.equal(web.edition, 'Издание «Ярило-VI»');
  assert.equal(apk.edition, 'Издание «Портативное» · Android APK');
  assert.ok(apk.credits.includes(apk.edition));
  assert.equal(system.standalone, false);
  assert.equal(system.event, 'KonoSuba x HSR 98');
});

check('the page boots the game and has no Win dependencies', () => {
  assert.match(page, /new Hsr98\.UI\(/);
  assert.doesNotMatch(page, /winManager|js\/apps\/|css\/apps\//);
});

check('every content/ file fetched by the game scripts is packed', () => {
  const urls = new Set();
  for (const s of sources) for (const m of fs.readFileSync(path.join(root, s), 'utf8').matchAll(/'(content\/[^']+)'/g)) urls.add(m[1]);
  assert.ok(urls.size >= 15);
  assert.ok(urls.has('content/YouVid/KONOSUBA 3 - Ending.mp3'));
  assert.deepEqual(result.music, [...urls].sort());
});

async function shimRun() {
  const added = [];
  const ctx = {
    atob: s => Buffer.from(s, 'base64').toString('latin1'),
    Response: class { constructor(body, init) { this.body = body; this.status = init.status; this.ok = init.status === 200; } arrayBuffer() { return Promise.resolve(this.body.buffer); } },
    fetch: url => Promise.resolve({ native: url }),
    document: {
      createElement: () => ({ remove() {} }),
      head: { appendChild: el => { added.push(el.src); setTimeout(() => { const f = path.join(out, el.src); if (!fs.existsSync(f)) { el.onerror(); return; } vm.runInContext(fs.readFileSync(f, 'utf8'), ctx); el.onload(); }); } }
    }
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(out, 'game/files.js'), 'utf8'), ctx);
  for (const url of result.music) {
    const r = await ctx.fetch(url);
    assert.equal(r.ok, true, url);
    assert.ok(Buffer.from(await r.arrayBuffer()).equals(fs.readFileSync(path.join(root, url))), url);
  }
  assert.equal(added.length, result.music.length);
  const again = await ctx.fetch(result.music[0]);
  assert.equal(again.ok, true);
  assert.equal(added.length, result.music.length);
  assert.deepEqual(await ctx.fetch('other/file.bin'), { native: 'other/file.bin' });
  await assert.rejects(ctx.fetch(MUSIC_PREFIX + 'Missing.mid'));
  passed++;
}

shimRun().then(() => {
  check('rebuilding into its own folder replaces the old copy', () => {
    fs.writeFileSync(path.join(out, 'game', 'stale.js'), '');
    build(out);
    assert.equal(fs.existsSync(path.join(out, 'game', 'stale.js')), false);
  });
  check('a foreign non-empty folder is never wiped', () => {
    const foreign = fs.mkdtempSync(path.join(os.tmpdir(), 'hsr98-foreign-'));
    fs.writeFileSync(path.join(foreign, 'keep.txt'), 'x');
    assert.throws(() => build(foreign), /not made by this tool/);
    assert.equal(fs.readFileSync(path.join(foreign, 'keep.txt'), 'utf8'), 'x');
    fs.rmSync(foreign, { recursive: true, force: true });
  });
  fs.rmSync(out, { recursive: true, force: true });
  console.log('hsr98-standalone: ' + passed + ' checks passed');
}).catch(e => { fs.rmSync(out, { recursive: true, force: true }); console.error(e); process.exit(1); });
