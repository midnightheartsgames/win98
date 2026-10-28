const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { Readable, Transform } = require('stream');
const { pipeline } = require('stream/promises');

const RELEASE_FILE = 'resources/app/release.json';
const PUBLIC_KEY = 'ovsFgDZK9drsoVj/YAu4Pje/Dj6f8pu71X144VuFF54=';
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const SPACE_MARGIN = 200 * 1048576;
const BUSY_CODES = new Set(['EBUSY', 'EPERM', 'EACCES']);

function updaterError(code, message, extra) {
  return Object.assign(new Error(message), { code }, extra);
}

function versionParts(v) {
  return String(v || '').split('.').map(n => (/^\d+$/.test(n) ? Number(n) : -1));
}

function compareVersions(a, b) {
  const pa = versionParts(a), pb = versionParts(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] === undefined ? 0 : pa[i]) - (pb[i] === undefined ? 0 : pb[i]);
    if (d) return d;
  }
  return 0;
}

function publicKeyFrom(base64) {
  return crypto.createPublicKey({ key: Buffer.concat([SPKI_PREFIX, Buffer.from(base64, 'base64')]), format: 'der', type: 'spki' });
}

function blobPath(sha) {
  return sha.slice(0, 2) + '/' + sha + '.bin';
}

function makePlan(put, remove) {
  const blobs = new Map();
  for (const f of put) if (!blobs.has(f.sha)) blobs.set(f.sha, f);
  const list = [...blobs.values()];
  return {
    put,
    remove,
    blobs: list,
    bytes: list.reduce((s, b) => s + (b.packed || b.size), 0),
    unpacked: list.reduce((s, b) => s + b.size, 0)
  };
}

function diffFiles(localFiles, remoteFiles) {
  const local = new Map(localFiles.map(f => [f[0], f[2]]));
  const remote = new Set(remoteFiles.map(f => f[0]));
  const put = remoteFiles.filter(f => local.get(f[0]) !== f[2]).map(([p, size, sha, packed]) => ({ path: p, size, sha, packed: packed || 0 }));
  const remove = localFiles.filter(f => !remote.has(f[0]) && f[0] !== RELEASE_FILE).map(f => f[0]);
  return makePlan(put, remove);
}

function releaseFrom(manifest) {
  const { format, v, files, ...meta } = manifest;
  return Object.assign({ format: 'win98-release', v: 1 }, meta, { files: files.map(([p, size, sha]) => [p, size, sha]) });
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (err) { return fallback; }
}

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.tmp', JSON.stringify(value));
  fs.renameSync(file + '.tmp', file);
}

function listFiles(dir, prefix = '') {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? prefix + '/' + e.name : e.name;
    if (e.isDirectory()) out.push(...listFiles(path.join(dir, e.name), rel));
    else out.push(rel);
  }
  return out;
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) return reject(abortError());
    const t = setTimeout(resolve, ms);
    if (signal) signal.addEventListener('abort', () => { clearTimeout(t); reject(abortError()); }, { once: true });
  });
}

function abortError() {
  return updaterError('aborted', 'download paused');
}

async function moveFile(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  for (let i = 0; ; i++) {
    try {
      fs.renameSync(src, dst);
      return;
    } catch (err) {
      if (!BUSY_CODES.has(err.code) || i >= 6) throw updaterError('write', 'cannot replace ' + dst + ': ' + err.code, { cause: err });
      await sleep(150 * (i + 1));
    }
  }
}

function hashFile(file) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    fs.createReadStream(file).on('error', reject).on('data', c => hash.update(c)).on('end', () => resolve(hash.digest('hex')));
  });
}

function createUpdater(opts) {
  const installDir = opts.installDir;
  const updatesDir = opts.updatesDir || path.join(installDir, 'updates');
  const stagingDir = path.join(updatesDir, 'staging');
  const backupRoot = path.join(updatesDir, 'backup');
  const journalFile = path.join(updatesDir, 'journal.json');
  const rollbackFile = path.join(updatesDir, 'rollback.json');
  const fetchFn = opts.fetch || globalThis.fetch;
  const key = publicKeyFrom(opts.publicKey || PUBLIC_KEY);
  const retryDelays = opts.retryDelays || [2000, 5000, 15000];
  const statfs = opts.statfs || (p => fs.promises.statfs(p));
  const channel = opts.channel || 'stable';
  const pointerUrl = new URL(opts.product + '/' + channel + '.json', opts.baseUrl.replace(/\/?$/, '/')).href;

  const local = () => readJson(path.join(installDir, RELEASE_FILE), null);
  const target = rel => path.join(installDir, rel);

  async function getBytes(url, signal, retried) {
    let res;
    try {
      res = await fetchFn(url, { cache: 'no-store', signal });
    } catch (err) {
      if (signal && signal.aborted) throw abortError();
      if (!retried) {
        await sleep(retryDelays[0] === 0 ? 0 : 1000, signal);
        return getBytes(url, signal, true);
      }
      throw updaterError('offline', url + ': ' + err.message);
    }
    if (!res.ok) throw updaterError('http', url + ': HTTP ' + res.status, { status: res.status });
    return Buffer.from(await res.arrayBuffer());
  }

  async function getSigned(url, query = '') {
    const [data, sig] = await Promise.all([getBytes(url + query), getBytes(url + '.sig' + query)]);
    let ok = false;
    try { ok = crypto.verify(null, data, key, Buffer.from(sig.toString('utf8').trim(), 'base64')); } catch (err) {}
    if (!ok) throw updaterError('signature', 'bad signature: ' + url);
    return JSON.parse(data.toString('utf8'));
  }

  async function scan(files, onProgress) {
    const bad = [];
    const total = files.reduce((s, f) => s + f[1], 0);
    let done = 0;
    for (const [rel, size, sha] of files) {
      const full = target(rel);
      let ok = false;
      try { ok = fs.statSync(full).size === size && (await hashFile(full)) === sha; } catch (err) {}
      if (!ok) bad.push(rel);
      done += size;
      if (onProgress) onProgress({ done, total, file: rel });
    }
    return bad;
  }

  async function check(o = {}) {
    const loc = local();
    if (opts.dev) return { state: 'dev', local: loc };
    if (!loc) return { state: 'error', local: null, error: updaterError('local', RELEASE_FILE + ' is missing') };
    try {
      const query = '?t=' + Math.floor(Date.now() / 60000);
      let pointer;
      try {
        pointer = await getSigned(pointerUrl, query);
      } catch (err) {
        if (err.code === 'http' && err.status === 404) {
          const probe = await fetchFn(pointerUrl + query, { cache: 'no-store' }).catch(() => null);
          if (probe && probe.status === 404) return { state: 'latest', local: loc, remote: null };
        }
        throw err;
      }
      if (pointer.product !== opts.product) throw updaterError('signature', 'pointer is for ' + pointer.product);
      const newer = compareVersions(pointer.version, loc.version) > 0;
      if (!newer && !o.repair) return { state: 'latest', local: loc, remote: pointer };
      if (!newer && compareVersions(pointer.version, loc.version) < 0) return { state: 'latest', local: loc, remote: pointer };
      const manifest = await getSigned(new URL(pointer.manifest, pointerUrl).href);
      if (manifest.product !== opts.product || manifest.version !== pointer.version) throw updaterError('signature', 'manifest does not match the pointer');
      if (manifest.runtime !== loc.runtime) return { state: 'full', local: loc, remote: pointer, manifest };
      const base = { local: loc, remote: pointer, manifest, blobsUrl: new URL(pointer.blobs, pointerUrl).href };
      if (!o.repair) return Object.assign(base, { state: 'update', plan: diffFiles(loc.files, manifest.files) });
      const bad = new Set(await scan(manifest.files, o.onProgress));
      const put = manifest.files.filter(f => bad.has(f[0])).map(([p, size, sha, packed]) => ({ path: p, size, sha, packed: packed || 0 }));
      const remote = new Set(manifest.files.map(f => f[0]));
      const remove = loc.files.filter(f => !remote.has(f[0]) && fs.existsSync(target(f[0]))).map(f => f[0]);
      const plan = makePlan(put, remove);
      return Object.assign(base, { state: newer ? 'update' : plan.put.length || plan.remove.length ? 'repair' : 'latest', plan });
    } catch (err) {
      return { state: err.code === 'offline' ? 'offline' : 'error', local: loc, error: err };
    }
  }

  async function texts() {
    const pointer = await getSigned(pointerUrl, '?t=' + Math.floor(Date.now() / 60000));
    const [notes, news] = await Promise.all(['notes.json', 'news.json'].map(n => getSigned(new URL(n, pointerUrl).href).catch(err => (err.status === 404 ? null : Promise.reject(err)))));
    return { pointer, notes, news };
  }

  function canWrite() {
    try {
      fs.mkdirSync(updatesDir, { recursive: true });
      const probe = path.join(updatesDir, '.write-test');
      fs.writeFileSync(probe, 'ok');
      fs.rmSync(probe);
      return true;
    } catch (err) {
      return false;
    }
  }

  async function space(update) {
    const left = update.plan.blobs.filter(b => !fs.existsSync(path.join(stagingDir, b.sha)));
    const need = left.reduce((s, b) => s + (b.packed || b.size) + b.size, 0) + SPACE_MARGIN;
    const st = await statfs(installDir);
    const free = Number(st.bavail) * Number(st.bsize);
    return { ok: free >= need, need, free };
  }

  async function unpackBlob(part, blob) {
    const out = path.join(stagingDir, blob.sha);
    const tmp = out + '.tmp';
    const hash = crypto.createHash('sha256');
    const hasher = new Transform({ transform(chunk, enc, cb) { hash.update(chunk); cb(null, chunk); } });
    const steps = [fs.createReadStream(part)];
    if (blob.packed) steps.push(zlib.createGunzip());
    try {
      await pipeline(...steps, hasher, fs.createWriteStream(tmp));
    } catch (err) {
      fs.rmSync(tmp, { force: true });
      fs.rmSync(part, { force: true });
      throw updaterError('corrupt', blob.path + ' arrived damaged');
    }
    if (hash.digest('hex') !== blob.sha) {
      fs.rmSync(tmp, { force: true });
      fs.rmSync(part, { force: true });
      throw updaterError('corrupt', blob.path + ' arrived damaged');
    }
    fs.renameSync(tmp, out);
    fs.rmSync(part, { force: true });
    fs.rmSync(part + '.etag', { force: true });
  }

  async function fetchBlob(blobsUrl, blob, add, signal) {
    const url = new URL(blobPath(blob.sha), blobsUrl).href;
    const part = path.join(stagingDir, blob.sha + '.part');
    const tagFile = part + '.etag';
    const expected = blob.packed || blob.size;
    let counted = 0;
    const recount = n => { add(n - counted); counted = n; };
    for (let attempt = 0; ; attempt++) {
      try {
        let have = fs.existsSync(part) ? fs.statSync(part).size : 0;
        if (have > expected) { fs.rmSync(part); have = 0; }
        recount(have);
        if (have < expected) {
          const headers = {};
          if (have) {
            headers.Range = 'bytes=' + have + '-';
            const tag = fs.existsSync(tagFile) ? fs.readFileSync(tagFile, 'utf8') : '';
            if (tag) headers['If-Range'] = tag;
          }
          let res;
          try {
            res = await fetchFn(url, { headers, signal });
          } catch (err) {
            if (signal && signal.aborted) throw abortError();
            throw updaterError('offline', blob.path + ': ' + err.message);
          }
          if (res.status === 200 && have) { have = 0; recount(0); }
          else if (res.status !== 200 && res.status !== 206) throw updaterError('http', blob.path + ': HTTP ' + res.status, { status: res.status });
          const etag = res.headers.get('etag');
          if (etag) fs.writeFileSync(tagFile, etag);
          let written = have;
          const counter = new Transform({ transform(chunk, enc, cb) { written += chunk.length; recount(written); cb(null, chunk); } });
          try {
            await pipeline(Readable.fromWeb(res.body), counter, fs.createWriteStream(part, { flags: have ? 'a' : 'w' }));
          } catch (err) {
            if (signal && signal.aborted) throw abortError();
            throw updaterError('offline', blob.path + ': ' + err.message);
          }
          if (fs.statSync(part).size < expected) throw updaterError('offline', blob.path + ': connection closed early');
        }
        await unpackBlob(part, blob);
        recount(expected);
        return;
      } catch (err) {
        if (err.code === 'aborted' || (signal && signal.aborted)) throw abortError();
        if (err.code === 'corrupt') recount(0);
        if (attempt >= retryDelays.length) throw err;
        await sleep(retryDelays[attempt], signal);
      }
    }
  }

  async function download(update, o = {}) {
    fs.mkdirSync(stagingDir, { recursive: true });
    const todo = update.plan.blobs.filter(b => !fs.existsSync(path.join(stagingDir, b.sha)));
    const total = update.plan.bytes;
    let done = total - todo.reduce((s, b) => s + (b.packed || b.size), 0);
    let filesDone = update.plan.blobs.length - todo.length;
    const queue = [...todo];
    const worker = async () => {
      while (queue.length) {
        const blob = queue.shift();
        await fetchBlob(update.blobsUrl, blob, n => {
          done += n;
          if (o.onProgress) o.onProgress({ done, total, file: blob.path, filesDone, files: update.plan.blobs.length });
        }, o.signal);
        filesDone++;
      }
    };
    await Promise.all(Array.from({ length: Math.min(o.concurrency || 6, queue.length) }, worker));
    return { done, total };
  }

  const metaFile = version => path.join(backupRoot, version + '.json');

  async function runApply(journal, o = {}) {
    const backup = path.join(backupRoot, journal.from);
    const meta = readJson(metaFile(journal.from), { added: [] });
    const savedRelease = path.join(backup, RELEASE_FILE);
    if (!fs.existsSync(savedRelease) && fs.existsSync(target(RELEASE_FILE))) {
      fs.mkdirSync(path.dirname(savedRelease), { recursive: true });
      fs.copyFileSync(target(RELEASE_FILE), savedRelease);
    }
    for (let i = 0; i < journal.ops.length; i++) {
      const op = journal.ops[i];
      if (o.beforeOp) o.beforeOp(i, op);
      const dst = target(op.path);
      const saved = path.join(backup, op.path);
      if (op.action === 'remove') {
        if (fs.existsSync(dst)) {
          if (!fs.existsSync(saved)) await moveFile(dst, saved);
          else fs.rmSync(dst, { force: true });
        }
      } else {
        if (!fs.existsSync(saved) && !meta.added.includes(op.path)) {
          if (fs.existsSync(dst)) await moveFile(dst, saved);
          else { meta.added.push(op.path); writeJsonAtomic(metaFile(journal.from), meta); }
        }
        const tmp = dst + '.update-new';
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.copyFileSync(path.join(stagingDir, op.sha), tmp);
        await moveFile(tmp, dst);
      }
      if (o.onProgress) o.onProgress({ done: i + 1, total: journal.ops.length, file: op.path });
    }
    writeJsonAtomic(metaFile(journal.from), meta);
    writeJsonAtomic(target(RELEASE_FILE), journal.release);
    fs.rmSync(journalFile, { force: true });
    fs.rmSync(stagingDir, { recursive: true, force: true });
    if (journal.from.endsWith('-repair')) return;
    for (const name of fs.existsSync(backupRoot) ? fs.readdirSync(backupRoot) : []) {
      if (name !== journal.from && name !== journal.from + '.json') fs.rmSync(path.join(backupRoot, name), { recursive: true, force: true });
    }
  }

  async function apply(update, o = {}) {
    const loc = local();
    for (const f of update.plan.put) {
      if (!fs.existsSync(path.join(stagingDir, f.sha))) throw updaterError('staging', 'not downloaded: ' + f.path);
    }
    const ops = update.plan.put.map(f => ({ action: 'put', path: f.path, sha: f.sha })).concat(update.plan.remove.map(p => ({ action: 'remove', path: p })));
    const from = compareVersions(update.manifest.version, loc.version) === 0 ? loc.version + '-repair' : loc.version;
    const journal = { type: 'apply', from, to: update.manifest.version, ops, release: releaseFrom(update.manifest) };
    writeJsonAtomic(journalFile, journal);
    await runApply(journal, o);
    return local();
  }

  function backups() {
    if (!fs.existsSync(backupRoot)) return [];
    return fs.readdirSync(backupRoot).filter(n => fs.statSync(path.join(backupRoot, n)).isDirectory() && !n.endsWith('-repair'));
  }

  async function runRollback(version) {
    const backup = path.join(backupRoot, version);
    const meta = readJson(metaFile(version), { added: [] });
    for (const rel of meta.added) {
      fs.rmSync(target(rel), { force: true });
      fs.rmSync(target(rel) + '.update-new', { force: true });
    }
    for (const rel of listFiles(backup)) await moveFile(path.join(backup, rel), target(rel));
    fs.rmSync(backup, { recursive: true, force: true });
    fs.rmSync(metaFile(version), { force: true });
    fs.rmSync(journalFile, { force: true });
    fs.rmSync(stagingDir, { recursive: true, force: true });
    fs.rmSync(rollbackFile, { force: true });
  }

  async function rollback() {
    const [version] = backups();
    if (!version) throw updaterError('no-backup', 'no previous version to return to');
    writeJsonAtomic(rollbackFile, { to: version });
    await runRollback(version);
    return local();
  }

  async function recover(o = {}) {
    const rb = readJson(rollbackFile, null);
    if (rb) {
      await runRollback(rb.to);
      return { recovered: 'rollback', version: rb.to };
    }
    const journal = readJson(journalFile, null);
    if (!journal) return { recovered: null };
    const ready = journal.ops.every(op => op.action !== 'put' || fs.existsSync(path.join(stagingDir, op.sha)));
    if (!ready) {
      writeJsonAtomic(rollbackFile, { to: journal.from });
      await runRollback(journal.from);
      return { recovered: 'rollback', version: journal.from };
    }
    await runApply(journal, o);
    return { recovered: 'apply', version: journal.to };
  }

  return { pointerUrl, local, check, texts, canWrite, space, download, apply, rollback, recover, backups, scanLocal: o => scan((local() || { files: [] }).files, o && o.onProgress) };
}

module.exports = { createUpdater, compareVersions, diffFiles, blobPath, releaseFrom, RELEASE_FILE, PUBLIC_KEY };
