const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { spawn, execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const { publicKeyText } = require('../tools/release.cjs');
const { blobPath } = require('../electron/updater.js');

let tools;
try {
  tools = require('../tools/android-apk.cjs').findTools();
} catch (err) {
  console.log('parohod98-store: skipped, no JDK (' + err.message + ')');
  process.exit(0);
}

const { privateKey } = crypto.generateKeyPairSync('ed25519');
const PUBLIC = publicKeyText(privateKey.export({ format: 'pem', type: 'pkcs8' }));
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const sign = data => crypto.sign(null, data, privateKey).toString('base64');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'parohod98-store-'));
const classes = path.join(tmp, 'classes');
const ANDROID = path.join(ROOT, 'tools', 'parohod98', 'android');
const PURE = ['Json.java', 'Ed25519.java', 'Fetch.java', 'Store.java'];

execFileSync(tools.javac, ['--release', '11', '-nowarn', '-encoding', 'UTF-8', '-d', classes, ...PURE.map(f => path.join(ANDROID, f)), path.join(__dirname, 'parohod98-store', 'StoreDriver.java')], { stdio: 'inherit' });

function createServer() {
  const files = new Map();
  const faults = new Map();
  const log = [];
  const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    log.push({ url, range: req.headers.range || '', ifRange: req.headers['if-range'] || '' });
    const item = files.get(url);
    if (!item) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      return res.end('<html>404</html>');
    }
    const fault = faults.get(url);
    let body = fault && fault.corrupt ? Buffer.from(item.body).fill(7, 0, 4) : item.body;
    const headers = { 'Content-Type': 'application/octet-stream', ETag: item.etag, 'Accept-Ranges': 'bytes' };
    let status = 200;
    const m = /^bytes=(\d+)-$/.exec(req.headers.range || '');
    if (m && (!req.headers['if-range'] || req.headers['if-range'] === item.etag)) {
      status = 206;
      headers['Content-Range'] = 'bytes ' + m[1] + '-' + (body.length - 1) + '/' + body.length;
      body = body.subarray(Number(m[1]));
    }
    headers['Content-Length'] = body.length;
    res.writeHead(status, headers);
    if (fault && fault.dropAfter && fault.times > 0) {
      fault.times--;
      res.write(body.subarray(0, fault.dropAfter));
      return setTimeout(() => res.socket.destroy(), 30);
    }
    if (fault && fault.stallAfter) {
      res.write(body.subarray(0, fault.stallAfter));
      fault.stalled = true;
      return;
    }
    res.end(body);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, files, faults, log, base: 'http://127.0.0.1:' + server.address().port + '/update/' })));
}

const BIG = crypto.randomBytes(400000);
const RADIO = crypto.randomBytes(250000);
const ICON = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), crypto.randomBytes(300)]);
const SHOT = Buffer.concat([Buffer.from([0xff, 0xd8]), crypto.randomBytes(900)]);

function putSigned(srv, rel, value, badSig) {
  const data = Buffer.from(JSON.stringify(value));
  srv.files.set('/update/parohod98/' + rel, { body: data, etag: '"' + sha(data).slice(0, 8) + '"' });
  srv.files.set('/update/parohod98/' + rel + '.sig', { body: Buffer.from(badSig ? sign(Buffer.from('other')) : sign(data)), etag: '"s"' });
}

function putBlob(srv, data, packed) {
  const body = packed ? zlib.gzipSync(data) : data;
  srv.files.set('/update/blobs/' + blobPath(sha(data)), { body, etag: '"' + sha(body).slice(0, 8) + '"' });
  return packed ? body.length : 0;
}

function game(srv, id, version, contents, opts = {}) {
  const rows = Object.entries(contents).sort(([a], [b]) => (a < b ? -1 : 1)).map(([rel, content]) => {
    const data = Buffer.from(content);
    const packed = putBlob(srv, data, !/\.(mp3|png|jpg)$/.test(rel));
    const row = [rel, data.length, sha(data), packed];
    if (opts.parts && opts.parts[rel]) row.push(opts.parts[rel]);
    return row;
  });
  putSigned(srv, id + '/manifest-' + version + '.json', { format: 'win98-manifest', v: 1, product: 'parohod98', game: id, version, date: '2026-10-29', commit: 'abc1234', files: rows }, opts.badManifest);
  putBlob(srv, ICON, false);
  putBlob(srv, SHOT, false);
  const parts = {};
  for (const r of rows.filter(r => r[4])) parts[r[4]] = { title: 'Радио в машинах', files: 1, bytes: r[1], download: r[3] || r[1] };
  return {
    version, date: '2026-10-29', minApk: opts.minApk || '1.0', manifest: id + '/manifest-' + version + '.json', notes: id + '/notes.json', digest: 'd',
    files: rows.filter(r => !r[4]).length, bytes: 1, download: 1, title: id, subtitle: '', genre: '', tags: [], desc: '', credit: '',
    icon: sha(ICON), shots: [{ sha256: sha(SHOT), caption: 'кадр' }], parts
  };
}

function catalog(srv, channel, games, badSig) {
  putSigned(srv, channel + '.json', { format: 'win98-update', v: 1, product: 'parohod98', channel, date: '2026-10-29', commit: 'abc1234', blobs: '../blobs/', games }, badSig);
}

function driver(dir, base, cmd, args = [], env = {}, onSpawn) {
  return new Promise((resolve, reject) => {
    const child = spawn(tools.java, ['-cp', classes, 'com.win98clone.parohod98.StoreDriver', dir, base, PUBLIC, '1.0', cmd, ...args], { env: Object.assign({}, process.env, { STORE_RETRY: '0,0,0' }, env) });
    let out = '';
    let err = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    child.on('error', reject);
    child.on('close', code => {
      if (child.killedOnPurpose) return resolve({ killed: true });
      const line = out.trim().split(/\r?\n/).pop();
      try {
        resolve(JSON.parse(line));
      } catch (e) {
        reject(new Error(cmd + ' exited ' + code + ': ' + out + err));
      }
    });
    if (onSpawn) onSpawn(child);
  });
}

const blobRequests = (srv, from) => srv.log.slice(from).filter(l => l.url.startsWith('/update/blobs/'));
const storeFiles = dir => fs.existsSync(path.join(dir, 'store')) ? fs.readdirSync(path.join(dir, 'store')) : [];

let passed = 0;
const check = async (name, fn) => {
  try {
    await fn();
  } catch (err) {
    err.message = name + ': ' + err.message;
    throw err;
  }
  passed++;
};

(async () => {
  const srv = await createServer();
  const B = srv.base;
  const SS10 = { 'index.html': '<html>ss 1.0</html>', 'js/a.js': 'var a = 1;'.repeat(400), 'js/b.js': 'var b = 2;'.repeat(300), 'data/big.bin': BIG };
  const SS11 = { 'index.html': '<html>ss 1.1</html>', 'js/a.js': SS10['js/a.js'], 'js/c.js': 'var c = 3;'.repeat(200), 'data/big.bin': BIG };
  const GTA = { 'index.html': '<html>gta</html>', 'js/g.js': 'var g = 1;'.repeat(500), 'content/radio/EMOTION.mp3': RADIO };
  const radioParts = { parts: { 'content/radio/EMOTION.mp3': 'radio' } };
  try {
    await check('signatures made by Node crypto pass Ed25519.java and changed ones fail', async () => {
      const pub = Buffer.from(PUBLIC, 'base64').toString('base64');
      for (const len of [0, 1, 64, 1000]) {
        const msg = crypto.randomBytes(len);
        const sig = crypto.sign(null, msg, privateKey);
        assert.equal((await driver(tmp, B, 'ed', [msg.toString('base64'), sig.toString('base64'), pub])).result, true, 'length ' + len);
        const bad = Buffer.from(sig);
        bad[len % 64] ^= 0x10;
        assert.equal((await driver(tmp, B, 'ed', [msg.toString('base64'), bad.toString('base64'), pub])).result, false);
      }
    });

    await check('no connection gives offline and keeps the phone empty', async () => {
      const dir = path.join(tmp, 'offline');
      const r = await driver(dir, 'http://127.0.0.1:1/update/', 'check', ['test']);
      assert.equal(r.ok, false);
      assert.equal(r.code, 'offline');
      assert.equal((await driver(dir, B, 'state')).result.catalog, null);
    });

    const ss10 = game(srv, 'serioussam', '1.0', SS10);
    const gta = game(srv, 'gtann', '1.0', GTA, radioParts);
    catalog(srv, 'test', { serioussam: ss10, gtann: gta });
    const dir = path.join(tmp, 'phone');

    await check('a wrong catalog signature is refused and the cached catalog stays', async () => {
      catalog(srv, 'stable', { serioussam: ss10 }, true);
      const r = await driver(dir, B, 'check', ['stable']);
      assert.equal(r.code, 'signature');
      assert.equal((await driver(dir, B, 'state')).result.catalog, null);
    });

    await check('first download: the catalog, the pictures and every file of the game', async () => {
      const c = await driver(dir, B, 'check', ['test']);
      assert.deepEqual(c.result, ['serioussam', 'gtann']);
      assert.equal((await driver(dir, B, 'picture', [sha(ICON)])).result, true);
      assert.equal((await driver(dir, B, 'picture', [sha(SHOT)])).result, true);
      const from = srv.log.length;
      const r = await driver(dir, B, 'get', ['serioussam']);
      assert.equal(r.ok, true, JSON.stringify(r));
      assert.equal(r.result.version, '1.0');
      assert.equal(blobRequests(srv, from).length, 4);
      for (const [rel, content] of Object.entries(SS10)) assert.equal((await driver(dir, B, 'file', ['serioussam', rel])).result, sha(Buffer.from(content)), rel);
      const st = (await driver(dir, B, 'state')).result;
      assert.equal(st.games.serioussam.installed.version, '1.0');
      assert.equal(st.games.serioussam.installed.missing, 0);
      assert.equal(st.games.serioussam.job, undefined);
      assert.deepEqual(st.queue, []);
    });

    await check('the update downloads only changed and new files, removed files stop being served', async () => {
      const ss11 = game(srv, 'serioussam', '1.1', SS11);
      catalog(srv, 'test', { serioussam: ss11, gtann: gta });
      await driver(dir, B, 'check', ['test']);
      const from = srv.log.length;
      const r = await driver(dir, B, 'get', ['serioussam']);
      assert.equal(r.result.version, '1.1');
      const got = blobRequests(srv, from).map(l => path.posix.basename(l.url, '.bin')).sort();
      assert.deepEqual(got, [sha(Buffer.from(SS11['index.html'])), sha(Buffer.from(SS11['js/c.js']))].sort());
      assert.equal((await driver(dir, B, 'file', ['serioussam', 'js/b.js'])).result, null);
      assert.equal((await driver(dir, B, 'file', ['serioussam', 'index.html'])).result, sha(Buffer.from(SS11['index.html'])));
      assert.ok(!storeFiles(dir).includes(sha(Buffer.from(SS10['js/b.js']))), 'old files are cleaned after the install');
    });

    await check('the update size counts only files the phone does not have, and goes away after the install', async () => {
      const d = path.join(tmp, 'updatesize');
      catalog(srv, 'test', { serioussam: ss10, gtann: gta });
      await driver(d, B, 'check', ['test']);
      await driver(d, B, 'get', ['serioussam']);
      const ss11 = game(srv, 'serioussam', '1.1', SS11);
      catalog(srv, 'test', { serioussam: ss11, gtann: gta });
      await driver(d, B, 'check', ['test']);
      const changed = ['index.html', 'js/c.js'].map(rel => srv.files.get('/update/blobs/' + blobPath(sha(Buffer.from(SS11[rel])))).body.length).reduce((a, b) => a + b, 0);
      const u = (await driver(d, B, 'updates')).result;
      assert.deepEqual(u, { serioussam: { version: '1.1', bytes: changed } });
      assert.deepEqual((await driver(d, B, 'state')).result.games.serioussam.update, { version: '1.1', bytes: changed });
      assert.equal((await driver(d, B, 'state')).result.games.gtann.update, undefined, 'a game that is not installed has no update');
      await driver(d, B, 'get', ['serioussam']);
      assert.equal((await driver(d, B, 'state')).result.games.serioussam.update, undefined);
    });

    await check('notes of the launcher and the games are cached only with a good signature', async () => {
      const d = path.join(tmp, 'notes');
      const notes = v => ({ format: 'win98-notes', v: 1, product: 'parohod98', versions: [{ version: v, date: '29.10.2026', title: 'T ' + v, summary: 's', sections: [], fixed: [] }] });
      putSigned(srv, 'notes.json', notes('1.1'));
      putSigned(srv, 'serioussam/notes.json', notes('1.0'));
      putSigned(srv, 'gtann/notes.json', notes('1.0'), true);
      catalog(srv, 'test', { serioussam: ss10, gtann: gta });
      await driver(d, B, 'check', ['test']);
      assert.equal((await driver(d, B, 'notes')).result, 2);
      const got = (await driver(d, B, 'readnotes')).result;
      assert.deepEqual(Object.keys(got).sort(), ['launcher', 'serioussam']);
      assert.equal(got.serioussam.versions[0].title, 'T 1.0');
      const from = srv.log.length;
      assert.equal((await driver(d, B, 'notes')).result, 0, 'known versions are not fetched again');
      assert.ok(!srv.log.slice(from).some(l => l.url.includes('serioussam/notes')));
      fs.writeFileSync(path.join(d, 'notes', 'serioussam.json'), JSON.stringify(notes('9.9')));
      assert.deepEqual(Object.keys((await driver(d, B, 'readnotes')).result).sort(), ['launcher'], 'a changed cached file is not shown');
      catalog(srv, 'test', { serioussam: game(srv, 'serioussam', '1.1', SS11), gtann: gta });
    });

    await check('the catalog copy from the APK fills an empty phone, never replaces a newer one', async () => {
      const d = path.join(tmp, 'seed');
      const data = Buffer.from(JSON.stringify({ format: 'win98-update', v: 1, product: 'parohod98', channel: 'stable', blobs: '../blobs/', games: { serioussam: ss10 } }));
      const files = path.join(tmp, 'seedfiles');
      fs.mkdirSync(files, { recursive: true });
      fs.writeFileSync(path.join(files, 'catalog.json'), data);
      fs.writeFileSync(path.join(files, 'catalog.json.sig'), sign(data));
      fs.writeFileSync(path.join(files, 'bad.sig'), sign(Buffer.from('x')));
      fs.writeFileSync(path.join(files, sha(ICON)), ICON);
      fs.writeFileSync(path.join(files, sha(SHOT)), Buffer.from('not the shot'));
      assert.equal((await driver(d, B, 'seed', [path.join(files, 'catalog.json'), path.join(files, 'bad.sig')])).result, false);
      const r = await driver(d, B, 'seed', [path.join(files, 'catalog.json'), path.join(files, 'catalog.json.sig'), path.join(files, sha(ICON)), path.join(files, sha(SHOT))]);
      assert.equal(r.result, true);
      const st = (await driver(d, B, 'state')).result;
      assert.deepEqual(Object.keys(st.catalog.games), ['serioussam']);
      assert.equal((await driver(d, B, 'picture', [sha(ICON)])).result, true);
      assert.ok(!storeFiles(d).includes(sha(SHOT)), 'a picture with a wrong checksum is skipped');
      await driver(d, B, 'check', ['test']);
      assert.equal((await driver(d, B, 'seed', [path.join(files, 'catalog.json'), path.join(files, 'catalog.json.sig')])).result, false);
      assert.equal((await driver(d, B, 'state')).result.catalog.channel, 'test');
    });

    await check('a channel without a catalog drops the list of the other channel, a failed check of the same channel keeps it', async () => {
      const d = path.join(tmp, 'switch');
      await driver(d, B, 'check', ['test']);
      const saved = srv.files.get('/update/parohod98/test.json');
      srv.files.delete('/update/parohod98/test.json');
      assert.equal((await driver(d, B, 'check', ['test'])).code, 'http');
      assert.equal((await driver(d, B, 'state')).result.catalog.channel, 'test');
      srv.files.set('/update/parohod98/test.json', saved);
      const stable = srv.files.get('/update/parohod98/stable.json');
      srv.files.delete('/update/parohod98/stable.json');
      const r = await driver(d, B, 'check', ['stable']);
      srv.files.set('/update/parohod98/stable.json', stable);
      assert.equal(r.code, 'http');
      assert.equal((await driver(d, B, 'state')).result.catalog, null);
    });

    await check('a connection cut in the middle of a file continues with Range and If-Range', async () => {
      const d = path.join(tmp, 'cut');
      await driver(d, B, 'check', ['test']);
      const url = '/update/blobs/' + blobPath(sha(BIG));
      srv.faults.set(url, { dropAfter: 150000, times: 1 });
      const from = srv.log.length;
      const r = await driver(d, B, 'get', ['serioussam']);
      srv.faults.delete(url);
      assert.equal(r.ok, true, JSON.stringify(r));
      const big = srv.log.slice(from).filter(l => l.url === url);
      assert.equal(big.length, 2);
      assert.equal(big[1].range, 'bytes=150000-');
      assert.equal(big[1].ifRange, srv.files.get(url).etag);
      assert.equal((await driver(d, B, 'file', ['serioussam', 'data/big.bin'])).result, sha(BIG));
    });

    await check('a file that arrives damaged is tried four times, then the error names the file', async () => {
      const d = path.join(tmp, 'corrupt');
      await driver(d, B, 'check', ['test']);
      const url = '/update/blobs/' + blobPath(sha(Buffer.from(SS11['js/c.js'])));
      srv.faults.set(url, { corrupt: true });
      const from = srv.log.length;
      const r = await driver(d, B, 'get', ['serioussam']);
      srv.faults.delete(url);
      assert.equal(r.code, 'corrupt');
      assert.equal(r.detail, 'js/c.js');
      assert.equal(srv.log.slice(from).filter(l => l.url === url).length, 4);
      const st = (await driver(d, B, 'state')).result;
      assert.equal(st.games.serioussam.installed, undefined, 'nothing is installed');
      assert.ok(st.games.serioussam.job, 'the started download stays for the next try');
      const again = await driver(d, B, 'download', ['serioussam']);
      assert.equal(again.ok, true, 'the next try finishes the download');
    });

    await check('404 on a file stops at once with http', async () => {
      const d = path.join(tmp, 'missing');
      await driver(d, B, 'check', ['test']);
      const url = '/update/blobs/' + blobPath(sha(Buffer.from(SS11['js/c.js'])));
      const saved = srv.files.get(url);
      srv.files.delete(url);
      const from = srv.log.length;
      const r = await driver(d, B, 'get', ['serioussam']);
      srv.files.set(url, saved);
      assert.equal(r.code, 'http');
      assert.match(r.detail, /^404 js\/c\.js/);
      assert.equal(srv.log.slice(from).filter(l => l.url === url).length, 1);
    });

    await check('a manifest with a wrong signature is refused before any file', async () => {
      const d = path.join(tmp, 'badmanifest');
      const bad = game(srv, 'forza', '1.0', { 'index.html': 'f' }, { badManifest: true });
      catalog(srv, 'test', { serioussam: game(srv, 'serioussam', '1.1', SS11), gtann: gta, forza: bad });
      await driver(d, B, 'check', ['test']);
      const from = srv.log.length;
      const r = await driver(d, B, 'get', ['forza']);
      assert.equal(r.code, 'signature');
      assert.equal(blobRequests(srv, from).length, 0);
    });

    await check('not enough space stops before the download and says how much is missing', async () => {
      const d = path.join(tmp, 'space');
      await driver(d, B, 'check', ['test']);
      const r = await driver(d, B, 'get', ['serioussam'], { STORE_FREE: '1000000' });
      assert.equal(r.code, 'space');
      assert.ok(Number(r.detail) > 50 * 1048576 - 1000000);
      assert.equal((await driver(d, B, 'state')).result.games.serioussam.job, undefined);
    });

    await check('a pause in the middle keeps the started files, resume asks only for the rest', async () => {
      const d = path.join(tmp, 'pause');
      await driver(d, B, 'check', ['test']);
      const url = '/update/blobs/' + blobPath(sha(BIG));
      const r = await driver(d, B, 'get', ['serioussam'], { STORE_STOP_AT: '1' });
      assert.equal(r.code, 'stopped');
      const st = (await driver(d, B, 'state')).result.games.serioussam;
      assert.ok(st.job && !st.installed);
      const from = srv.log.length;
      const again = await driver(d, B, 'download', ['serioussam']);
      assert.equal(again.ok, true, JSON.stringify(again));
      const big = srv.log.slice(from).filter(l => l.url === url);
      assert.ok(big.length <= 1);
      assert.equal((await driver(d, B, 'file', ['serioussam', 'data/big.bin'])).result, sha(BIG));
    });

    await check('the app killed in the middle of a file continues from the same byte', async () => {
      const d = path.join(tmp, 'killed');
      await driver(d, B, 'check', ['test']);
      const url = '/update/blobs/' + blobPath(sha(BIG));
      const fault = { stallAfter: 120000 };
      srv.faults.set(url, fault);
      const killed = await driver(d, B, 'get', ['serioussam'], {}, child => {
        const t = setInterval(() => {
          const part = path.join(d, 'staging', sha(BIG) + '.part');
          if (fault.stalled && fs.existsSync(part) && fs.statSync(part).size >= 120000) {
            clearInterval(t);
            child.killedOnPurpose = true;
            child.kill('SIGKILL');
          }
        }, 20);
      });
      srv.faults.delete(url);
      assert.equal(killed.killed, true);
      const from = srv.log.length;
      const r = await driver(d, B, 'download', ['serioussam']);
      assert.equal(r.ok, true, JSON.stringify(r));
      const big = srv.log.slice(from).filter(l => l.url === url);
      assert.equal(big[0].range, 'bytes=120000-');
      assert.equal((await driver(d, B, 'file', ['serioussam', 'data/big.bin'])).result, sha(BIG));
    });

    await check('an install cut short leaves the whole old version', async () => {
      const d = path.join(tmp, 'halfinstall');
      catalog(srv, 'test', { serioussam: ss10, gtann: gta });
      await driver(d, B, 'check', ['test']);
      await driver(d, B, 'get', ['serioussam']);
      catalog(srv, 'test', { serioussam: game(srv, 'serioussam', '1.1', SS11), gtann: gta });
      await driver(d, B, 'check', ['test']);
      await driver(d, B, 'plan', ['serioussam']);
      fs.writeFileSync(path.join(d, 'games', 'serioussam.json.tmp'), '{"game":"serioussam","vers');
      const st = (await driver(d, B, 'state')).result.games.serioussam;
      assert.equal(st.installed.version, '1.0');
      assert.equal(st.installed.missing, 0);
      for (const [rel, content] of Object.entries(SS10)) assert.equal((await driver(d, B, 'file', ['serioussam', rel])).result, sha(Buffer.from(content)), rel);
      assert.equal(st.job.version, '1.1');
    });

    await check('the cleanup removes only files nobody needs', async () => {
      const d = path.join(tmp, 'halfinstall');
      fs.writeFileSync(path.join(d, 'store', 'f'.repeat(64)), 'stray');
      fs.writeFileSync(path.join(d, 'staging', 'e'.repeat(64) + '.part'), 'stray');
      assert.equal((await driver(d, B, 'cleanup')).result, 1);
      const left = storeFiles(d);
      for (const content of Object.values(SS10)) assert.ok(left.includes(sha(Buffer.from(content))), 'installed files stay');
      assert.ok(left.includes(sha(ICON)) && left.includes(sha(SHOT)), 'pictures stay');
      assert.ok(!fs.existsSync(path.join(d, 'staging', 'e'.repeat(64) + '.part')));
      const r = await driver(d, B, 'download', ['serioussam']);
      assert.equal(r.result.version, '1.1');
    });

    await check('the file check finds a damaged file and the repair downloads only it', async () => {
      const d = path.join(tmp, 'halfinstall');
      const bad = path.join(d, 'store', sha(Buffer.from(SS11['js/c.js'])));
      fs.writeFileSync(bad, 'broken');
      const v = await driver(d, B, 'verify', ['serioussam']);
      assert.deepEqual(v.result, ['js/c.js']);
      assert.equal((await driver(d, B, 'state')).result.games.serioussam.installed.missing, 1);
      const from = srv.log.length;
      const r = await driver(d, B, 'get', ['serioussam']);
      assert.equal(r.ok, true);
      assert.deepEqual(blobRequests(srv, from).map(l => path.posix.basename(l.url, '.bin')), [sha(Buffer.from(SS11['js/c.js']))]);
      assert.deepEqual((await driver(d, B, 'verify', ['serioussam'])).result, []);
    });

    await check('the radio part downloads separately and can be removed', async () => {
      const d = path.join(tmp, 'radio');
      await driver(d, B, 'check', ['test']);
      const radioUrl = '/update/blobs/' + blobPath(sha(RADIO));
      let from = srv.log.length;
      const r = await driver(d, B, 'get', ['gtann']);
      assert.deepEqual(r.result.parts, []);
      assert.equal(srv.log.slice(from).filter(l => l.url === radioUrl).length, 0, 'the game alone has no radio');
      assert.equal((await driver(d, B, 'file', ['gtann', 'content/radio/EMOTION.mp3'])).result, null);
      from = srv.log.length;
      const withRadio = await driver(d, B, 'get', ['gtann', 'radio']);
      assert.deepEqual(withRadio.result.parts, ['radio']);
      assert.deepEqual(blobRequests(srv, from).map(l => l.url), [radioUrl], 'adding the radio downloads only the radio');
      assert.equal((await driver(d, B, 'file', ['gtann', 'content/radio/EMOTION.mp3'])).result, sha(RADIO));
      assert.equal((await driver(d, B, 'droppart', ['gtann', 'radio'])).result, true);
      assert.ok(!storeFiles(d).includes(sha(RADIO)));
      assert.deepEqual((await driver(d, B, 'state')).result.games.gtann.installed.parts, []);
      assert.equal((await driver(d, B, 'file', ['gtann', 'index.html'])).result, sha(Buffer.from(GTA['index.html'])));
    });

    await check('a game that needs a newer launcher is not downloaded', async () => {
      const d = path.join(tmp, 'minapk');
      catalog(srv, 'test', { serioussam: game(srv, 'serioussam', '1.2', SS11, { minApk: '1.4' }), gtann: gta });
      await driver(d, B, 'check', ['test']);
      const r = await driver(d, B, 'get', ['serioussam']);
      assert.equal(r.code, 'apk');
      assert.equal(r.detail, '1.4');
    });

    await check('cancel removes the started download and its files', async () => {
      const d = path.join(tmp, 'cancel');
      catalog(srv, 'test', { serioussam: ss10, gtann: gta });
      await driver(d, B, 'check', ['test']);
      await driver(d, B, 'get', ['serioussam'], { STORE_STOP_AT: '1' });
      assert.ok((await driver(d, B, 'state')).result.games.serioussam.job);
      await driver(d, B, 'cancel', ['serioussam']);
      assert.equal((await driver(d, B, 'state')).result.games.serioussam.job, undefined);
      assert.deepEqual(fs.readdirSync(path.join(d, 'staging')), []);
      await driver(d, B, 'cleanup');
      assert.deepEqual(storeFiles(d).sort(), [sha(ICON), sha(SHOT)].sort());
    });

    await check('remove deletes the game files and keeps other games', async () => {
      const d = path.join(tmp, 'remove');
      await driver(d, B, 'check', ['test']);
      await driver(d, B, 'get', ['serioussam']);
      await driver(d, B, 'get', ['gtann']);
      await driver(d, B, 'remove', ['serioussam']);
      const st = (await driver(d, B, 'state')).result.games;
      assert.equal(st.serioussam.installed, undefined);
      assert.equal(st.gtann.installed.missing, 0);
      assert.ok(!storeFiles(d).includes(sha(BIG)));
    });

    await check('the pure Java part has no comments and uses no Android classes', () => {
      for (const f of PURE.concat('../../../tests/parohod98-store/StoreDriver.java')) {
        const text = fs.readFileSync(path.join(ANDROID, f), 'utf8').replace(/https?:\/\/[^\s'"]+/g, '');
        assert.ok(!/^\s*\/\/|\/\*/m.test(text), f + ' has a comment');
        if (PURE.includes(f)) assert.ok(!/import android\.|import org\.json/.test(text), f + ' uses Android classes');
      }
    });
  } finally {
    srv.server.close();
    srv.server.closeAllConnections && srv.server.closeAllConnections();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log('parohod98-store: ' + passed + ' checks passed');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
