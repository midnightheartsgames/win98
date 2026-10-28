const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { createUpdater, compareVersions, blobPath, releaseFrom, RELEASE_FILE } = require('../electron/updater.js');
const { publicKeyText } = require('../tools/release.cjs');

const { privateKey } = crypto.generateKeyPairSync('ed25519');
const PUBLIC = publicKeyText(privateKey.export({ format: 'pem', type: 'pkcs8' }));
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const sign = data => crypto.sign(null, data, privateKey).toString('base64');
const RUNTIME = 'electron-44.4.5-win32-x64';
const BIG = crypto.randomBytes(300000);

function createServer() {
  const store = new Map();
  const faults = new Map();
  const log = [];
  const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    log.push({ url, range: req.headers.range || '', ifRange: req.headers['if-range'] || '' });
    const item = store.get(url);
    if (!item) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      return res.end('<html>404 Not Found</html>');
    }
    const fault = faults.get(url);
    if (fault && fault.status) {
      res.writeHead(fault.status, { 'Content-Type': 'text/html' });
      return res.end('<html>error</html>');
    }
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
    res.end(body);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, store, faults, log, base: 'http://127.0.0.1:' + server.address().port + '/update/' })));
}

function publish(srv, rel) {
  const files = Object.entries(rel.files).sort(([a], [b]) => (a < b ? -1 : 1)).map(([p, content]) => {
    const data = Buffer.from(content);
    const hash = sha(data);
    const packed = rel.pack && rel.pack.includes(p) ? zlib.gzipSync(data) : null;
    const body = packed || data;
    srv.store.set('/update/blobs/' + blobPath(hash), { body, etag: '"' + hash.slice(0, 8) + '-' + body.length + '"' });
    return [p, data.length, hash, packed ? packed.length : 0];
  });
  const manifest = { format: 'win98-manifest', v: 1, product: 'win98', version: rel.version, build: rel.build || '28102026', date: '2026-10-28', commit: 'abc1234', runtime: rel.runtime || RUNTIME, files };
  const put = (name, value, sigOverride) => {
    const data = Buffer.from(JSON.stringify(value));
    srv.store.set('/update/win98/' + name, { body: data, etag: '"' + sha(data).slice(0, 8) + '"' });
    srv.store.set('/update/win98/' + name + '.sig', { body: Buffer.from(sigOverride || sign(data)), etag: '"s"' });
  };
  put('manifest-' + rel.version + '.json', manifest, rel.badManifestSig ? sign(Buffer.from('other')) : null);
  put((rel.channel || 'stable') + '.json', { format: 'win98-update', v: 1, product: 'win98', channel: rel.channel || 'stable', version: rel.version, build: manifest.build, manifest: 'manifest-' + rel.version + '.json', blobs: '../blobs/', runtime: manifest.runtime });
  return manifest;
}

function install(manifest, contents) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'win98-updater-'));
  for (const [p, content] of Object.entries(contents)) {
    fs.mkdirSync(path.dirname(path.join(dir, p)), { recursive: true });
    fs.writeFileSync(path.join(dir, p), content);
  }
  fs.mkdirSync(path.dirname(path.join(dir, RELEASE_FILE)), { recursive: true });
  fs.writeFileSync(path.join(dir, RELEASE_FILE), JSON.stringify(releaseFrom(manifest)));
  return dir;
}

const V10 = {
  version: '1.0',
  files: {
    'Win98.exe': 'exe',
    'resources/app/index.html': 'index one',
    'resources/app/js/old.js': 'old file',
    'resources/app/js/same.js': 'same file',
    'resources/app/content/big.bin': BIG
  }
};
const V11 = {
  version: '1.1',
  pack: ['resources/app/js/new.js', 'resources/app/index.html'],
  files: {
    'Win98.exe': 'exe',
    'resources/app/index.html': 'index two '.repeat(200),
    'resources/app/js/new.js': 'new file '.repeat(300),
    'resources/app/js/same.js': 'same file',
    'resources/app/content/big.bin': Buffer.concat([BIG, Buffer.from('v11')])
  }
};

const read = (dir, p) => fs.readFileSync(path.join(dir, p));
const tests = [];
const check = (name, fn) => tests.push([name, fn]);

async function fresh(srv, opts = {}) {
  srv.store.clear();
  srv.faults.clear();
  srv.log.length = 0;
  const m10 = publish(srv, V10);
  const dir = install(m10, V10.files);
  publish(srv, opts.next || V11);
  const updater = createUpdater(Object.assign({ product: 'win98', installDir: dir, baseUrl: srv.base, publicKey: PUBLIC, retryDelays: [0, 0, 0] }, opts.updater));
  return { dir, updater };
}

check('versions compare by numbers, dev is older than any release', () => {
  assert.ok(compareVersions('1.15', '1.9') > 0);
  assert.ok(compareVersions('1.6.3', '1.6') > 0);
  assert.equal(compareVersions('1.0', '1.0'), 0);
  assert.ok(compareVersions('1.0', 'dev') > 0);
});

check('1.0 → 1.1: plan, download with gzip blobs, apply, backup, latest afterwards', async srv => {
  const { dir, updater } = await fresh(srv);
  const c = await updater.check();
  assert.equal(c.state, 'update');
  assert.deepEqual(c.plan.put.map(f => f.path).sort(), ['resources/app/content/big.bin', 'resources/app/index.html', 'resources/app/js/new.js']);
  assert.deepEqual(c.plan.remove, ['resources/app/js/old.js']);
  assert.ok(c.plan.bytes < c.plan.unpacked, 'packed blobs are smaller');
  const progress = [];
  await updater.download(c, { onProgress: p => progress.push(p.done) });
  assert.equal(progress[progress.length - 1], c.plan.bytes);
  const after = await updater.apply(c);
  assert.equal(after.version, '1.1');
  for (const [p, content] of Object.entries(V11.files)) assert.ok(read(dir, p).equals(Buffer.from(content)), p);
  assert.ok(!fs.existsSync(path.join(dir, 'resources/app/js/old.js')));
  assert.equal(read(dir, 'updates/backup/1.0/resources/app/index.html').toString(), 'index one');
  assert.equal(read(dir, 'updates/backup/1.0/resources/app/js/old.js').toString(), 'old file');
  assert.ok(!fs.existsSync(path.join(dir, 'updates/journal.json')));
  assert.ok(!fs.existsSync(path.join(dir, 'updates/staging')));
  assert.equal((await updater.check()).state, 'latest');
  assert.deepEqual(await updater.scanLocal(), []);
});

check('a dropped connection resumes with Range and If-Range', async srv => {
  const { dir, updater } = await fresh(srv);
  const c = await updater.check();
  const big = c.plan.put.find(f => f.path.endsWith('big.bin'));
  srv.faults.set('/update/blobs/' + blobPath(big.sha), { dropAfter: 120000, times: 1 });
  await updater.download(c);
  const asks = srv.log.filter(l => l.url.endsWith(big.sha + '.bin'));
  assert.equal(asks.length, 2);
  assert.match(asks[1].range, /^bytes=\d+-$/);
  assert.ok(asks[1].ifRange.startsWith('"'));
  await updater.apply(c);
  assert.ok(read(dir, 'resources/app/content/big.bin').equals(Buffer.from(V11.files['resources/app/content/big.bin'])));
});

check('paused download keeps the part file and continues later', async srv => {
  const { updater } = await fresh(srv);
  const c = await updater.check();
  const big = c.plan.put.find(f => f.path.endsWith('big.bin'));
  srv.faults.set('/update/blobs/' + blobPath(big.sha), { dropAfter: 120000, times: 1 });
  const ctl = new AbortController();
  const run = updater.download(c, { signal: ctl.signal, concurrency: 1, onProgress: p => { if (p.file.endsWith('big.bin') && p.done > 0) ctl.abort(); } });
  await assert.rejects(run, err => err.code === 'aborted');
  srv.faults.clear();
  await updater.download(c);
  await updater.apply(c);
  assert.equal(updater.local().version, '1.1');
});

check('a damaged blob is retried and then reported by file name', async srv => {
  const { updater } = await fresh(srv);
  const c = await updater.check();
  const f = c.plan.put.find(p => p.path.endsWith('new.js'));
  srv.faults.set('/update/blobs/' + blobPath(f.sha), { corrupt: true });
  await assert.rejects(updater.download(c), err => err.code === 'corrupt' && err.message.includes('resources/app/js/new.js'));
  assert.equal(srv.log.filter(l => l.url.endsWith(f.sha + '.bin')).length, 4);
  srv.faults.set('/update/blobs/' + blobPath(f.sha), { status: 404 });
  await assert.rejects(updater.download(c), err => err.code === 'http' && err.status === 404);
});

check('bad signatures, foreign products and missing files are errors, a closed port is offline', async srv => {
  const { dir, updater } = await fresh(srv, { next: Object.assign({}, V11, { badManifestSig: true }) });
  const c = await updater.check();
  assert.equal(c.state, 'error');
  assert.equal(c.error.code, 'signature');
  srv.store.delete('/update/win98/stable.json.sig');
  assert.equal((await updater.check()).error.code, 'http');
  srv.store.delete('/update/win98/stable.json');
  const empty = await updater.check();
  assert.deepEqual([empty.state, empty.remote], ['latest', null], 'a channel without releases is not an error');
  const offline = createUpdater({ product: 'win98', installDir: dir, baseUrl: 'http://127.0.0.1:9/update/', publicKey: PUBLIC });
  assert.equal((await offline.check()).state, 'offline');
  const dev = createUpdater({ product: 'win98', installDir: dir, baseUrl: srv.base, publicKey: PUBLIC, dev: true });
  assert.equal((await dev.check()).state, 'dev');
});

check('a new Electron asks for the full archive, an older server version is never installed', async srv => {
  let { updater } = await fresh(srv, { next: Object.assign({}, V11, { runtime: 'electron-45.0.0-win32-x64' }) });
  assert.equal((await updater.check()).state, 'full');
  ({ updater } = await fresh(srv, { next: Object.assign({}, V11, { version: '0.9' }) }));
  assert.equal((await updater.check()).state, 'latest');
});

check('a crash in the middle of installing is finished on the next start', async srv => {
  const { dir, updater } = await fresh(srv);
  const c = await updater.check();
  await updater.download(c);
  await assert.rejects(updater.apply(c, { beforeOp: i => { if (i === 2) throw new Error('power cut'); } }), /power cut/);
  assert.ok(fs.existsSync(path.join(dir, 'updates/journal.json')));
  assert.equal(updater.local().version, '1.0');
  const again = createUpdater({ product: 'win98', installDir: dir, baseUrl: srv.base, publicKey: PUBLIC });
  assert.deepEqual(await again.recover(), { recovered: 'apply', version: '1.1' });
  for (const [p, content] of Object.entries(V11.files)) assert.ok(read(dir, p).equals(Buffer.from(content)), p);
  assert.equal(read(dir, 'updates/backup/1.0/resources/app/index.html').toString(), 'index one');
  assert.deepEqual(await again.recover(), { recovered: null });
});

check('a crash with lost staging files rolls back to the old version', async srv => {
  const { dir, updater } = await fresh(srv);
  const c = await updater.check();
  await updater.download(c);
  await assert.rejects(updater.apply(c, { beforeOp: i => { if (i === 2) throw new Error('power cut'); } }));
  fs.rmSync(path.join(dir, 'updates/staging'), { recursive: true, force: true });
  assert.deepEqual(await updater.recover(), { recovered: 'rollback', version: '1.0' });
  for (const [p, content] of Object.entries(V10.files)) assert.ok(read(dir, p).equals(Buffer.from(content)), p);
  assert.ok(!fs.existsSync(path.join(dir, 'resources/app/js/new.js')));
  assert.equal(updater.local().version, '1.0');
});

check('rollback returns the previous version and removes added files', async srv => {
  const { dir, updater } = await fresh(srv);
  const c = await updater.check();
  await updater.download(c);
  await updater.apply(c);
  assert.deepEqual(updater.backups(), ['1.0']);
  const back = await updater.rollback();
  assert.equal(back.version, '1.0');
  for (const [p, content] of Object.entries(V10.files)) assert.ok(read(dir, p).equals(Buffer.from(content)), p);
  assert.ok(!fs.existsSync(path.join(dir, 'resources/app/js/new.js')));
  assert.deepEqual(updater.backups(), []);
  assert.equal((await updater.check()).state, 'update');
});

check('repair finds deleted and changed files and brings them back', async srv => {
  const { dir, updater } = await fresh(srv);
  const c = await updater.check();
  await updater.download(c);
  await updater.apply(c);
  fs.rmSync(path.join(dir, 'resources/app/js/new.js'));
  fs.writeFileSync(path.join(dir, 'resources/app/index.html'), 'broken');
  assert.deepEqual((await updater.scanLocal()).sort(), ['resources/app/index.html', 'resources/app/js/new.js']);
  const r = await updater.check({ repair: true });
  assert.equal(r.state, 'repair');
  assert.deepEqual(r.plan.put.map(f => f.path).sort(), ['resources/app/index.html', 'resources/app/js/new.js']);
  await updater.download(r);
  await updater.apply(r);
  assert.deepEqual(await updater.scanLocal(), []);
  assert.equal(updater.local().version, '1.1');
  assert.deepEqual(updater.backups(), ['1.0']);
  assert.equal((await updater.check({ repair: true })).state, 'latest');
});

check('free space and write access are checked before downloading', async srv => {
  const { dir } = await fresh(srv);
  const tight = createUpdater({ product: 'win98', installDir: dir, baseUrl: srv.base, publicKey: PUBLIC, statfs: async () => ({ bavail: 10, bsize: 4096 }) });
  const s = await tight.space(await tight.check());
  assert.equal(s.ok, false);
  assert.ok(s.need > 200 * 1048576);
  assert.equal(tight.canWrite(), true);
  const blocked = install(releaseFrom({ format: 'win98-manifest', v: 1, product: 'win98', version: '1.0', runtime: RUNTIME, files: [] }), {});
  fs.writeFileSync(path.join(blocked, 'updates'), 'not a folder');
  assert.equal(createUpdater({ product: 'win98', installDir: blocked, baseUrl: srv.base, publicKey: PUBLIC }).canWrite(), false);
});

check('notes and news come signed with the pointer', async srv => {
  const { updater } = await fresh(srv);
  const notes = Buffer.from(JSON.stringify({ format: 'win98-notes', v: 1, versions: [{ version: '1.1' }] }));
  srv.store.set('/update/win98/notes.json', { body: notes, etag: '"n"' });
  srv.store.set('/update/win98/notes.json.sig', { body: Buffer.from(sign(notes)), etag: '"n"' });
  const t = await updater.texts();
  assert.equal(t.pointer.version, '1.1');
  assert.equal(t.notes.versions[0].version, '1.1');
  assert.equal(t.news, null);
  srv.store.set('/update/win98/notes.json.sig', { body: Buffer.from(sign(Buffer.from('x'))), etag: '"n"' });
  await assert.rejects(updater.texts(), err => err.code === 'signature');
});

(async () => {
  const srv = await createServer();
  let passed = 0;
  try {
    for (const [name, fn] of tests) {
      try {
        await fn(srv);
        passed++;
      } catch (err) {
        console.error('FAIL: ' + name);
        throw err;
      }
    }
  } finally {
    srv.server.close();
  }
  console.log(`updater: ${passed} checks passed`);
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
