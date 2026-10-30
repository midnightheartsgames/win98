const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const games = require(path.join(ROOT, 'tools', 'parohod98-game.cjs'));
const release = require(path.join(ROOT, 'tools', 'release.cjs'));

let passed = 0;
const check = async (name, fn) => { await fn(); passed++; };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'parohod98-release-'));
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');

(async () => {
  try {
    for (const id of Object.keys(games.GAMES)) {
      await check(id + ': every font of the game has a stand-in with Cyrillic in the package', () => {
        const r = games.build(id, path.join(tmp, id), { edition: 'apk', version: '1.0', parts: false });
        const css = fs.readFileSync(path.join(r.out, 'fonts', 'fonts.css'), 'utf8');
        const page = games.readPage(id);
        const used = games.fontsUsed(page.scripts.concat(page.styles).map(f => path.join(ROOT, f)));
        assert.ok(used.includes('Arial'), id + ' uses Arial');
        for (const name of used) {
          assert.ok(css.includes('font-family:"' + name + '"'), id + ': fonts.css declares ' + name);
          assert.ok(r.fonts.some(f => f.endsWith('-cyrillic.woff2') && css.includes('font-family:"' + name + '"')), id + ': ' + name + ' has Cyrillic');
        }
        for (const m of css.matchAll(/url\(([^)]+)\)/g)) assert.ok(fs.existsSync(path.join(r.out, 'fonts', m[1])), id + ': ' + m[1] + ' is in the package');
        assert.ok(r.files.some(f => /^fonts\/[a-z]+-OFL\.txt$/.test(f)), id + ': font licences ship with the fonts');
        const html = fs.readFileSync(path.join(r.out, 'index.html'), 'utf8');
        assert.ok(html.indexOf('fonts/fonts.css') < html.indexOf(page.styles[0]), id + ': the stand-ins load before the game styles');
        assert.ok(html.indexOf('document.fonts.load') < html.indexOf(page.boot), id + ': the game boots after the fonts load');
        assert.match(html, /<link rel="icon" href="data:,">/);
      });
    }

    await check('a font without a stand-in stops the build', () => {
      const file = path.join(tmp, 'font.js');
      fs.writeFileSync(file, "c.font = 'bold 12px Calibri, sans-serif';");
      assert.throws(() => games.fontsUsed([file]), /Calibri/);
      fs.writeFileSync(file, "c.font = 'bold 12px \"Arial Black\", Impact';");
      assert.deepEqual(games.fontsUsed([file]), ['Arial Black', 'Impact']);
    });

    await check('the package digest ignores the version stamp and sees real changes', () => {
      const a = games.build('serioussam', path.join(tmp, 'ss-a'), { edition: 'apk', version: '1.0' });
      const b = games.build('serioussam', path.join(tmp, 'ss-b'), { edition: 'apk', version: '1.7' });
      assert.notEqual(fs.readFileSync(path.join(a.out, 'index.html'), 'utf8'), fs.readFileSync(path.join(b.out, 'index.html'), 'utf8'));
      assert.equal(release.packageDigest(a.out, a.files), release.packageDigest(b.out, b.files));
      fs.appendFileSync(path.join(b.out, 'js/apps/serious-sam/ss-touch.js'), ';');
      assert.notEqual(release.packageDigest(a.out, a.files), release.packageDigest(b.out, b.files));
    });

    await check('the manifest lists every file by sha256 and marks the radio part', async () => {
      const r = games.build('gtann', path.join(tmp, 'nn-probe'), { edition: 'probe', version: '1.0' });
      const m = await release.gameManifest(r, { game: 'gtann', version: '1.0', date: '2026-10-29', commit: 'abc1234' });
      assert.equal(m.format, 'win98-manifest');
      assert.equal(m.product, 'parohod98');
      assert.equal(m.files.length, r.files.length);
      assert.deepEqual(m.files.map(f => f[0]), r.files.slice().sort());
      for (const [rel, size, hash] of m.files.slice(0, 5)) {
        const data = fs.readFileSync(path.join(r.out, rel));
        assert.equal(size, data.length);
        assert.equal(hash, sha(data));
      }
      const radio = m.files.filter(f => f[4] === 'radio');
      assert.deepEqual(radio.map(f => f[0]), ['content/radio/EMOTION.mp3']);
      assert.ok(m.files.filter(f => !f[4]).every(f => f.length === 4), 'game files have no part');
    });

    await check('the catalog entry comes from the Win 98 catalog without prices or a made-up developer', async () => {
      const r = games.build('serioussam', path.join(tmp, 'ss-entry'), { edition: 'apk', version: '1.0' });
      const m = await release.gameManifest(r, { game: 'serioussam', version: '1.0', date: '2026-10-29', commit: 'abc1234' });
      const e = await release.gameEntry('serioussam', m, release.packageDigest(r.out, r.files));
      assert.equal(e.title, 'Serious Sam 98');
      assert.equal(e.manifest, 'serioussam/manifest-1.0.json');
      assert.equal(e.notes, 'serioussam/notes.json');
      assert.equal(e.minApk, '1.0');
      assert.ok(e.tags.length >= 3 && e.tags.length <= 5);
      assert.equal(e.shots.length, 2);
      assert.ok(e.shots.every(s => /^[0-9a-f]{64}$/.test(s.sha256) && s.caption));
      assert.match(e.icon, /^[0-9a-f]{64}$/);
      assert.equal(e.files, m.files.length);
      assert.ok(e.download > 0 && e.download < e.bytes, 'the code downloads compressed');
      assert.deepEqual(e.parts, {});
      for (const k of ['price', 'priceDisplay', 'developer', 'setupExe', 'fileSize']) assert.ok(!(k in e), k + ' stays in Win 98');
      assert.match(e.credit, /Midnight Hearts/);
      assert.deepEqual([...games.iconPng('serioussam').subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
    });

    await check('a new catalog starts empty and game versions count from 1.0', () => {
      const c = release.emptyCatalog('test');
      assert.deepEqual(c.games, {});
      assert.equal(c.product, 'parohod98');
      assert.equal(c.blobs, '../blobs/');
      assert.equal(release.nextVersion({ stable: null, test: null }), '1.0');
      assert.equal(release.nextVersion({ stable: { version: '1.0' }, test: { version: '1.2' } }), '1.3');
    });

    await check('player notes of the three games parse and keep the naming rule', () => {
      for (const id of Object.keys(games.GAMES)) {
        const dir = path.join(ROOT, 'releases', 'parohod98', id);
        const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^(next|\d+\.\d+)\.md$/.test(f)) : [];
        assert.ok(files.length, id + ' has notes');
        for (const f of files) {
          const n = release.parseNotes(fs.readFileSync(path.join(dir, f), 'utf8'), id + '/' + f);
          assert.ok(n.title && n.summary && n.sections.length, id + '/' + f);
        }
      }
      assert.throws(() => release.parseNotes('# T\n\nКратко: Windows\n\n## Новое\n- x\n', 'x'), /Win instead/);
    });

    await check('AGENTS.md allows the Android launcher to download the three games', () => {
      const agents = read('AGENTS.md');
      assert.match(agents, /Exception: the Android launcher Пароход 98/);
      assert.match(agents, /release -- parohod98 games/);
    });

    await check('the package builder has no comments', () => {
      for (const f of ['tools/parohod98-game.cjs']) {
        const text = read(f).replace(/https?:\/\/[^\s'"]+/g, '');
        assert.ok(!/^\s*\/\/|\/\*|<!--/m.test(text), f + ' has a comment');
      }
    });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log('parohod98-release: ' + passed + ' checks passed');
})().catch(err => { console.error(err); process.exit(1); });
