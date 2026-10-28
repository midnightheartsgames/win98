const fs = require('fs');
const path = require('path');
const { createUpdater } = require('./updater');

const SETTINGS_KEYS = ['checkOnStart', 'skipLauncher', 'runAfterUpdate', 'channel'];
const DEFAULT_SETTINGS = { checkOnStart: true, skipLauncher: false, runAfterUpdate: true, channel: 'stable', read: [], cache: null, checkedAt: 0 };

const brief = r => (r ? { version: r.version, build: r.build || '', date: r.date || '', commit: r.commit || '' } : null);

function summary(c) {
  return {
    state: c.state,
    local: brief(c.local),
    remote: c.remote ? brief(c.remote) : null,
    plan: c.plan ? { files: c.plan.put.length, remove: c.plan.remove.length, bytes: c.plan.bytes, unpacked: c.plan.unpacked } : null,
    error: c.error ? { code: c.error.code || 'error', message: c.error.message, status: c.error.status || 0 } : null
  };
}

function createLauncherHost(o) {
  const file = path.join(o.app.getPath('userData'), 'launcher.json');
  let settings = load();
  let updater = make();
  let lastCheck = null;
  let downloadCtl = null;
  let applying = false;

  function load() {
    try {
      return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(fs.readFileSync(file, 'utf8')));
    } catch (err) {
      return Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function save() {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file + '.tmp', JSON.stringify(settings));
    fs.renameSync(file + '.tmp', file);
  }

  function make() {
    return createUpdater({
      product: o.product,
      installDir: o.installDir,
      baseUrl: o.updateUrl,
      channel: settings.channel === 'test' ? 'test' : 'stable',
      dev: o.dev,
      fetch: (url, init) => o.net.fetch(url, init)
    });
  }

  function send(data) {
    const win = o.window();
    if (win && !win.isDestroyed()) win.webContents.send('launcher:progress', data);
  }

  function relaunch(extra) {
    settings.afterUpdate = extra;
    save();
    o.app.relaunch();
    o.app.exit(0);
  }

  function pending() {
    if (!lastCheck || !['update', 'full'].includes(lastCheck.state)) return null;
    const notes = (settings.cache && settings.cache.notes && settings.cache.notes.versions) || [];
    const entry = notes.find(v => lastCheck.remote && v.version === lastCheck.remote.version);
    return Object.assign(summary(lastCheck), entry ? { title: entry.title, summary: entry.summary } : {});
  }

  async function boot() {
    let recovered = null;
    if (!o.dev) {
      try {
        recovered = await updater.recover();
      } catch (err) {
        recovered = { recovered: 'failed', message: err.message };
      }
    }
    const after = settings.afterUpdate || null;
    if (after) {
      delete settings.afterUpdate;
      save();
    }
    return { recovered: recovered && recovered.recovered ? recovered : null, after };
  }

  async function quickCheck() {
    const timeout = new Promise(resolve => setTimeout(() => resolve({ state: 'timeout' }), 3000));
    const c = await Promise.race([updater.check(), timeout]);
    if (['update', 'full'].includes(c.state)) lastCheck = c;
    return c;
  }

  function register() {
    const handle = (channel, fn) => o.ipcMain.handle(channel, (event, ...args) => {
      const win = o.window();
      if (!win || event.sender !== win.webContents) throw new Error('launcher only');
      return fn(...args);
    });

    handle('launcher:init', () => Object.assign({
      dev: o.dev,
      installDir: o.installDir,
      userData: o.app.getPath('userData'),
      updateUrl: o.updateUrl,
      local: brief(updater.local()),
      writable: o.dev ? true : updater.canWrite(),
      backups: o.dev ? [] : updater.backups(),
      settings: Object.assign({}, settings)
    }, o.initInfo()));

    handle('launcher:ready', () => {
      if (o.onReady) o.onReady();
      return true;
    });

    handle('launcher:check', async (opts = {}) => {
      const c = await updater.check(opts.repair ? { repair: true, onProgress: p => send(Object.assign({ phase: 'scan' }, p)) } : {});
      lastCheck = c;
      if (!['offline', 'dev'].includes(c.state)) {
        try {
          const t = await updater.texts();
          settings.cache = { notes: t.notes, news: t.news, pointer: brief(t.pointer) };
        } catch (err) {}
      }
      settings.checkedAt = Date.now();
      save();
      return { result: summary(c), texts: settings.cache, checkedAt: settings.checkedAt, writable: o.dev ? true : updater.canWrite() };
    });

    handle('launcher:download', async () => {
      if (!lastCheck || !lastCheck.plan) return { ok: false, code: 'state', message: 'nothing to download' };
      if (!updater.canWrite()) return { ok: false, code: 'write' };
      const space = await updater.space(lastCheck);
      if (!space.ok) return { ok: false, code: 'space', need: space.need, free: space.free, drive: path.parse(o.installDir).root };
      downloadCtl = new AbortController();
      try {
        await updater.download(lastCheck, { signal: downloadCtl.signal, onProgress: p => send(Object.assign({ phase: 'download' }, p)) });
        return { ok: true };
      } catch (err) {
        return { ok: false, code: err.code || 'error', message: err.message, status: err.status || 0 };
      } finally {
        downloadCtl = null;
      }
    });

    handle('launcher:pause', () => {
      if (downloadCtl) downloadCtl.abort();
      return true;
    });

    handle('launcher:cancel', () => {
      if (downloadCtl) downloadCtl.abort();
      fs.rmSync(path.join(o.installDir, 'updates', 'staging'), { recursive: true, force: true });
      return true;
    });

    handle('launcher:apply', async (opts = {}) => {
      if (!lastCheck || !lastCheck.plan) return { ok: false, code: 'state' };
      applying = true;
      try {
        await updater.apply(lastCheck, { onProgress: p => send(Object.assign({ phase: 'apply' }, p)) });
      } catch (err) {
        applying = false;
        return { ok: false, code: err.code || 'error', message: err.message };
      }
      setTimeout(() => relaunch({ version: lastCheck.manifest.version, build: lastCheck.manifest.build || '', start: !!opts.start, repaired: lastCheck.state === 'repair' }), 400);
      return { ok: true };
    });

    handle('launcher:rollback', async () => {
      applying = true;
      try {
        const back = await updater.rollback();
        setTimeout(() => relaunch({ version: back.version, build: back.build || '', rolledBack: true }), 400);
        return { ok: true };
      } catch (err) {
        applying = false;
        return { ok: false, code: err.code || 'error', message: err.message };
      }
    });

    handle('launcher:settings', patch => {
      for (const k of SETTINGS_KEYS) if (patch && k in patch) settings[k] = patch[k];
      settings.channel = settings.channel === 'test' ? 'test' : 'stable';
      save();
      updater = make();
      return Object.assign({}, settings);
    });

    handle('launcher:read', ids => {
      const read = new Set(settings.read || []);
      for (const id of ids || []) read.add(String(id));
      settings.read = [...read].slice(-500);
      save();
      return settings.read;
    });

    handle('launcher:start', () => {
      o.start();
      return true;
    });

    handle('launcher:minimize', () => {
      o.window().minimize();
      return true;
    });

    handle('launcher:close', () => {
      if (!applying) o.window().close();
      return true;
    });

    handle('launcher:open-folder', () => o.shell.openPath(o.installDir));

    handle('launcher:open-url', url => {
      if (/^https:\/\/pennygachi\.men\//.test(String(url))) o.shell.openExternal(String(url));
      return true;
    });
  }

  return {
    get settings() { return settings; },
    get updater() { return updater; },
    get lastCheck() { return lastCheck; },
    get applying() { return applying; },
    save,
    abort: () => { if (downloadCtl) downloadCtl.abort(); },
    pending,
    relaunch,
    register,
    boot,
    quickCheck
  };
}

module.exports = { createLauncherHost, summary };
