const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const zlib = require('zlib');
const { execFileSync, spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ID_PATTERN = /^BR-\d{6}-[0-9A-HJKMNP-TV-Z]{4}$/;
const FILE_NAMES = new Set(['shot.png', 'shot.jpg', 'shot-marked.png', 'shot-marked.jpg', 'shot-window.png', 'shot-window.jpg', 'save.json.gz']);
const STATUSES = ['new', 'accepted', 'fixed', 'duplicate', 'notabug', 'wontfix'];
const STATUS_TEXT = { new: 'новый', accepted: 'принят', fixed: 'исправлен', duplicate: 'дубликат', notabug: 'не ошибка', wontfix: 'не будет исправлен' };
const KIND_TEXT = { bug: 'не работает', crash: 'зависло или закрылось', visual: 'графика', text: 'текст или перевод', sound: 'звук', balance: 'баланс', idea: 'идея' };
const REPEAT_TEXT = { always: 'всегда', sometimes: 'иногда', once: 'один раз', unknown: 'не проверял' };

function loadConfig(env) {
  const e = env || process.env;
  let file = {};
  const fileName = e.WIN98_BUGS_CONFIG || path.join(os.homedir(), '.win98-bugs.json');
  try { file = JSON.parse(fs.readFileSync(fileName, 'utf8').replace(/^﻿/, '')); } catch (err) {}
  return {
    url: (e.WIN98_BUGS_URL || file.url || 'https://pennygachi.men/api/bugs').replace(/\/+$/, ''),
    token: e.WIN98_BUGS_TOKEN || file.token || '',
    dir: e.WIN98_BUGS_DIR || file.dir || path.join(ROOT, 'bugreports'),
    repo: e.WIN98_BUGS_REPO || ROOT
  };
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (err) { return fallback; }
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function folders(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n => ID_PATTERN.test(n) && fs.existsSync(path.join(dir, n, 'report.json')));
}

function statusOf(dir, id) {
  return Object.assign({ status: 'new', fixedIn: '', note: '', dup: '', origin: 'local' }, readJson(path.join(dir, id, 'status.json'), {}));
}

function loadAll(dir) {
  return folders(dir).map(id => ({ id, report: readJson(path.join(dir, id, 'report.json'), {}), status: statusOf(dir, id) }))
    .sort((a, b) => String(b.report.created || '').localeCompare(String(a.report.created || '')));
}

function headChanges(repo, commit) {
  if (!commit) return null;
  const git = args => execFileSync('git', args, { cwd: repo, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  try {
    const head = git(['rev-parse', '--short', 'HEAD']);
    if (head.startsWith(commit) || commit.startsWith(head)) return { head, files: [] };
    const files = Array.from(new Set(git(['log', '--format=', '--name-only', commit + '..HEAD']).split('\n').filter(Boolean)));
    return { head, files };
  } catch (err) {
    return { head: '', files: [], unknown: true };
  }
}

function cheatsUsed(report) {
  return Object.values(report.apps || {}).some(a => a && (a.cheats || (a.state && a.state.cheats)));
}

function filesIn(dir, id) {
  return fs.readdirSync(path.join(dir, id)).filter(n => FILE_NAMES.has(n));
}

function trailLine(e) {
  const rest = Object.entries(e).filter(([k, v]) => k !== 't' && k !== 'type' && v !== '' && v != null).map(([k, v]) => k + '=' + (typeof v === 'string' ? v : JSON.stringify(v))).join(' ');
  return String(e.t).padStart(7) + '  ' + String(e.type).padEnd(8) + ' ' + rest;
}

function fence(text) {
  return '```\n' + text + '\n```';
}

function reportMarkdown(report, status, ctx) {
  const c = ctx || {};
  const user = report.user || {};
  const build = report.build || {};
  const where = report.where || {};
  const lines = [];
  lines.push('# ' + report.id + ' — ' + (user.title || '(без заголовка)'), '');
  lines.push('- Статус: ' + (STATUS_TEXT[status.status] || status.status) + (status.fixedIn ? ' в ' + status.fixedIn : '') + (status.dup ? ', дубликат ' + status.dup : '') + ' · Тип: ' + (KIND_TEXT[user.kind] || user.kind) + ' · Повторяется: ' + (REPEAT_TEXT[user.repeat] || user.repeat));
  let buildLine = '- Источник: ' + (report.source || '?') + ' через ' + (report.channel || '?') + ' · создан ' + (report.created || '?');
  if (build.version && build.version !== 'dev') buildLine += ' · версия ' + build.version + (build.build ? ' (' + build.build + ')' : '');
  if (build.commit) buildLine += ' · сборка ' + build.commit + (build.dirty ? ' + незакоммиченные изменения' : '') + (build.dev ? ' (dev)' : '') + (build.hsr ? ', HSR ' + build.hsr : '');
  lines.push(buildLine);
  if (c.changes) {
    if (c.changes.unknown) lines.push('- Коммит сборки не найден в репозитории');
    else if (!c.changes.files.length) lines.push('- HEAD ' + c.changes.head + (build.dirty ? ': коммит тот же, но сборка шла с незакоммиченными изменениями, сверяйте по дате сборки' + (build.built ? ' ' + build.built : '') : ': после сборки код не менялся'));
    else lines.push('- HEAD ' + c.changes.head + ', после сборки изменены: ' + c.changes.files.slice(0, 20).join(', ') + (c.changes.files.length > 20 ? ' и ещё ' + (c.changes.files.length - 20) : ''));
  }
  lines.push('- Где: ' + (where.summary || '?') + (where.window ? ' (окно ' + where.window + ', приложение ' + where.app + ')' : ''));
  const attach = report.attach || {};
  lines.push('- Читы: ' + (cheatsUsed(report) ? 'да, F7/F8 использовались' : 'нет') + ' · Сохранение: ' + (attach.save ? attach.save + (attach.saveComponent ? ' (' + attach.saveComponent + ')' : '') : 'нет'));
  if (status.note) lines.push('- Заметка: ' + status.note);
  lines.push('');
  lines.push('## Текст игрока', '', user.text || '(нет)', '');
  if (user.contact) lines.push('Контакт: ' + user.contact, '');
  const files = c.files || [];
  lines.push('## Файлы', '');
  lines.push(files.length ? files.map(f => '- ' + f + (f === attach.marked ? ' — рамки игрока: ' + JSON.stringify(attach.marks || []) : '') + (f === attach.window ? ' — активное окно без уменьшения' : '')).join('\n') : '(нет)');
  if (attach.shotError) lines.push('', 'Кадр не снят: ' + attach.shotError);
  if (attach.saveSkipped) lines.push('', 'Сохранение не приложено: ' + attach.saveSkipped);
  lines.push('');
  const errors = report.errors || [];
  lines.push('## Ошибки (' + errors.length + ')', '');
  if (errors.length) {
    lines.push(fence(errors.map(e => e.msg + (e.src ? ' @ ' + e.src : '') + (e.count > 1 ? ' ×' + e.count : '') + ' (t=' + e.t + ')' + (e.stack ? '\n' + e.stack.split('\n').slice(0, 8).map(s => '    ' + s.trim()).join('\n') : '')).join('\n\n')));
  } else lines.push('(нет)');
  lines.push('');
  const missing = report.missing || [];
  if (missing.length) lines.push('## Не загрузились файлы', '', fence(missing.map(m => m.tag + ' ' + m.url + (m.count > 1 ? ' ×' + m.count : '')).join('\n')), '');
  const trail = report.trail || [];
  lines.push('## Последние действия (' + trail.length + ')', '');
  lines.push(trail.length ? fence(trail.slice(-40).map(trailLine).join('\n')) : '(нет)', '');
  const apps = report.apps || {};
  if (Object.keys(apps).length) {
    const text = JSON.stringify(apps, null, 2);
    lines.push('## Состояние приложения', '', '```json\n' + (text.length > 6000 ? text.slice(0, 6000) + '\n…' : text) + '\n```', '');
  }
  const windows = report.windows || [];
  lines.push('## Окна', '');
  lines.push(windows.length ? windows.map(w => '- ' + (w.active ? '**' + w.id + '**' : w.id) + ' «' + w.title + '»' + (w.min ? ' свёрнуто' : '') + (w.max ? ' развёрнуто' : '') + (w.rect ? ' ' + w.rect.join(',') : '')).join('\n') : '(нет открытых окон)');
  lines.push('');
  const sys = report.system || {};
  lines.push('## Система', '', '- ' + [sys.ua, sys.viewport && 'окно ' + sys.viewport.join('x'), sys.screen && 'экран ' + sys.screen.join('x'), sys.dpr && 'dpr ' + sys.dpr, sys.fps != null && 'fps ' + sys.fps, sys.heapMB != null && 'память ' + sys.heapMB + ' МБ', sys.storageKB != null && 'localStorage ' + sys.storageKB + ' КБ', sys.gl, sys.lang && 'язык ' + sys.lang, sys.uptime != null && 'работает ' + sys.uptime + ' с'].filter(Boolean).join(' · '), '');
  const log = report.log || [];
  if (log.length) {
    const important = log.filter(l => l.level === 'error' || l.level === 'warn');
    const tail = (important.length ? important : log).slice(-30);
    lines.push('## Консоль (' + (important.length ? 'warn и error' : 'последние записи') + ')', '', fence(tail.map(l => String(l.t).padStart(7) + ' ' + l.level.padEnd(5) + ' ' + l.msg).join('\n')), '');
  }
  return lines.join('\n');
}

function writeMarkdown(config, id) {
  const report = readJson(path.join(config.dir, id, 'report.json'), {});
  const status = statusOf(config.dir, id);
  const md = reportMarkdown(report, status, { files: filesIn(config.dir, id), changes: headChanges(config.repo, report.build && report.build.commit) });
  fs.writeFileSync(path.join(config.dir, id, 'report.md'), md);
}

function refreshMarkdown(config, force) {
  for (const id of folders(config.dir)) {
    const md = path.join(config.dir, id, 'report.md');
    const st = path.join(config.dir, id, 'status.json');
    const stale = !fs.existsSync(md) || (fs.existsSync(st) && fs.statSync(st).mtimeMs > fs.statSync(md).mtimeMs);
    if (force || stale) writeMarkdown(config, id);
  }
}

function cell(text) {
  return String(text == null ? '' : text).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function indexMarkdown(items) {
  const rows = items.map(({ id, report, status }) => {
    const user = report.user || {};
    return '| [' + id + '](' + id + '/report.md) | ' + cell(String(report.created || '').slice(0, 16).replace('T', ' ')) + ' | ' + cell(report.source + '/' + report.channel) + ' | ' + cell((report.where && report.where.app) || '') + ' | ' + cell(user.kind) + ' | ' + cell(status.status + (status.fixedIn ? ' ' + status.fixedIn : '')) + ' | ' + (cheatsUsed(report) ? 'да' : '') + ' | ' + cell(user.title) + ' |';
  });
  return ['# Отчёты об ошибках', '', 'Всего: ' + items.length + ', новых: ' + items.filter(i => i.status.status === 'new').length, '', '| Номер | Создан | Источник | Приложение | Тип | Статус | Читы | Заголовок |', '| --- | --- | --- | --- | --- | --- | --- | --- |', ...rows, ''].join('\n');
}

function writeIndex(config) {
  fs.mkdirSync(config.dir, { recursive: true });
  fs.writeFileSync(path.join(config.dir, 'INDEX.md'), indexMarkdown(loadAll(config.dir)));
}

function storePackage(config, data, origin) {
  if (!data || data.format !== 'win98-bugreport-file' || !data.report || !ID_PATTERN.test(String(data.report.id))) throw new Error('not a bug report file');
  const id = data.report.id;
  const dir = path.join(config.dir, id);
  if (fs.existsSync(path.join(dir, 'report.json'))) return { id, created: false };
  fs.mkdirSync(dir, { recursive: true });
  writeJson(path.join(dir, 'report.json'), data.report);
  for (const [name, value] of Object.entries(data.files || {})) {
    if (!FILE_NAMES.has(name)) throw new Error('unexpected file ' + name);
    fs.writeFileSync(path.join(dir, name), Buffer.from(value, 'base64'));
  }
  writeJson(path.join(dir, 'status.json'), { status: 'new', fixedIn: '', note: '', dup: '', origin });
  return { id, created: true };
}

function importFile(config, file) {
  const res = storePackage(config, JSON.parse(fs.readFileSync(file, 'utf8')), 'file');
  writeMarkdown(config, res.id);
  writeIndex(config);
  return res;
}

async function api(config, fetchImpl, method, url, body) {
  if (!config.token) throw new Error('No token. Set WIN98_BUGS_TOKEN or put {"token": "..."} into ' + path.join(os.homedir(), '.win98-bugs.json'));
  const res = await fetchImpl(config.url + url, {
    method,
    headers: Object.assign({ Authorization: 'Bearer ' + config.token }, body ? { 'Content-Type': 'application/json' } : {}),
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    let text = '';
    try { text = (await res.json()).error; } catch (err) {}
    throw Object.assign(new Error(method + ' ' + url + ': HTTP ' + res.status + (text ? ' ' + text : '')), { status: res.status });
  }
  return res;
}

async function pull(config, fetchImpl) {
  const f = fetchImpl || fetch;
  fs.mkdirSync(config.dir, { recursive: true });
  const items = (await (await api(config, f, 'GET', '')).json()).items || [];
  const added = [];
  const changed = [];
  for (const e of items) {
    if (!ID_PATTERN.test(e.id)) continue;
    const dir = path.join(config.dir, e.id);
    const remote = { status: e.status, fixedIn: e.fixedIn || '', note: e.note || '', dup: e.dup || '', origin: 'remote' };
    if (!fs.existsSync(path.join(dir, 'report.json'))) {
      if (e.purged) continue;
      fs.mkdirSync(dir, { recursive: true });
      for (const name of ['report.json', ...(e.files || []).filter(n => FILE_NAMES.has(n))]) {
        const res = await api(config, f, 'GET', '/' + e.id + '/' + name);
        fs.writeFileSync(path.join(dir, name), Buffer.from(await res.arrayBuffer()));
      }
      writeJson(path.join(dir, 'status.json'), remote);
      added.push(e.id);
      continue;
    }
    const local = statusOf(config.dir, e.id);
    if (['status', 'fixedIn', 'note', 'dup'].some(k => (local[k] || '') !== (remote[k] || '')) || local.origin !== 'remote') {
      writeJson(path.join(dir, 'status.json'), remote);
      changed.push(e.id);
    }
  }
  refreshMarkdown(config);
  writeIndex(config);
  return { added, changed, total: items.length };
}

async function setStatus(config, id, status, opts, fetchImpl) {
  if (!ID_PATTERN.test(id) || !fs.existsSync(path.join(config.dir, id, 'report.json'))) throw new Error('No report ' + id + ' in ' + config.dir);
  if (!STATUSES.includes(status)) throw new Error('Status must be one of: ' + STATUSES.join(', '));
  const o = opts || {};
  const current = statusOf(config.dir, id);
  const next = Object.assign({}, current, { status, fixedIn: o.in != null ? o.in : current.fixedIn, note: o.note != null ? o.note : current.note, dup: o.dup != null ? o.dup : current.dup });
  if (current.origin === 'remote') {
    await api(config, fetchImpl || fetch, 'POST', '/' + id + '/status', { status: next.status, fixedIn: next.fixedIn, note: next.note, dup: next.dup });
  }
  writeJson(path.join(config.dir, id, 'status.json'), next);
  writeMarkdown(config, id);
  writeIndex(config);
  return next;
}

const EDGE = process.env.WIN98_EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const REPRO_PORT = 8091;
const SERVE_PORT = 8099;
const MEDIA = { '.png': 'image/png', '.jpg': 'image/jpeg', '.md': 'text/markdown; charset=utf-8', '.json': 'application/json; charset=utf-8', '.gz': 'application/gzip', '.log': 'text/plain; charset=utf-8' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function summary(config, item) {
  const { id, report, status } = item;
  const files = filesIn(config.dir, id);
  const user = report.user || {};
  return {
    id,
    created: report.created || '',
    source: report.source || '',
    channel: report.channel || '',
    app: (report.where && report.where.app) || '',
    where: (report.where && report.where.summary) || '',
    kind: user.kind || '',
    title: user.title || '',
    status: status.status,
    fixedIn: status.fixedIn,
    origin: status.origin,
    cheats: cheatsUsed(report),
    thumb: ['shot-marked.png', 'shot-marked.jpg', 'shot.png', 'shot.jpg'].find(f => files.includes(f)) || ''
  };
}

async function ensureReproServer(config) {
  const base = 'http://127.0.0.1:' + REPRO_PORT;
  const alive = async () => {
    try {
      const j = await (await fetch(base + '/api/bugs/ping')).json();
      return !!j.local;
    } catch (err) {
      return false;
    }
  };
  if (await alive()) return { url: base, proc: null };
  const proc = spawn(process.execPath, ['server.js'], { cwd: config.repo, env: Object.assign({}, process.env, { PORT: String(REPRO_PORT), WIN98_BUGS_DIR: config.dir }), stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    await sleep(200);
    if (await alive()) return { url: base, proc };
  }
  proc.kill();
  throw new Error('Repro server did not start on port ' + REPRO_PORT);
}

function openRepro(url, id) {
  const link = url + '/?bug=' + id;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'win98-repro-'));
  if (fs.existsSync(EDGE)) spawn(EDGE, ['--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check', '--new-window', link], { detached: true, stdio: 'ignore' }).unref();
  else spawn('cmd', ['/c', 'start', '', link], { detached: true, stdio: 'ignore' }).unref();
  return link;
}

async function cdpPage(port) {
  for (let i = 0; i < 60; i++) {
    try {
      const page = (await (await fetch('http://127.0.0.1:' + port + '/json')).json()).find(t => t.type === 'page');
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
        let seq = 0;
        const pending = new Map();
        const events = [];
        ws.onmessage = m => {
          const d = JSON.parse(m.data);
          if (d.id && pending.has(d.id)) {
            pending.get(d.id)(d);
            pending.delete(d.id);
          } else if (d.method) events.push(d);
        };
        const send = (method, params) => new Promise(r => {
          const id = ++seq;
          pending.set(id, r);
          ws.send(JSON.stringify({ id, method, params: params || {} }));
        });
        return { send, events, ws };
      }
    } catch (err) {}
    await sleep(500);
  }
  throw new Error('Edge did not open a debugging page');
}

function savedStorage(dir) {
  const file = path.join(dir, 'save.json.gz');
  if (!fs.existsSync(file)) return null;
  const archive = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8'));
  return (archive.data && archive.data.ls) || {};
}

async function reproParohod(config, id, report, opts) {
  const o = opts || {};
  const games = require('./parohod98-game.cjs');
  const app = report.where && report.where.app;
  const result = { id, opened: '', ready: false, restored: [], missing: [], exceptions: [], consoleErrors: [], storageKeys: 0, png: '', parohod98: app };
  if (!games.GAMES[app]) throw new Error(id + ' comes from the Пароход 98 ' + (app || 'launcher') + ', only game reports open in repro; look at its shots');
  const pkg = path.join(config.repo, 'dist', 'parohod98-repro', app);
  games.build(app, pkg, { edition: 'apk', version: (report.build && report.build.version) || 'repro' });
  const ls = savedStorage(path.join(config.dir, id)) || {};
  result.restored = Object.keys(ls);
  const srv = await games.serveDir(path.resolve(pkg));
  const port = 9370 + Math.floor(Math.random() * 60);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'parohod98-repro-'));
  const edge = spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + profile, '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
  try {
    const page = await cdpPage(port);
    const value = async expr => {
      const r = await page.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      return r.result && r.result.result ? r.result.result.value : undefined;
    };
    await page.send('Runtime.enable');
    await page.send('Page.enable');
    const view = (report.system && report.system.viewport) || [846, 387];
    await page.send('Emulation.setDeviceMetricsOverride', { width: view[0] || 846, height: view[1] || 387, deviceScaleFactor: 2, mobile: true });
    await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: 'if(!sessionStorage.getItem("p98repro")){localStorage.clear();const d=' + JSON.stringify(Object.assign({ ['parohod98.hint.' + app]: '1' }, ls)) + ';for(const k in d)localStorage.setItem(k,d[k]);sessionStorage.setItem("p98repro","1");}' });
    result.opened = 'http://127.0.0.1:' + srv.address().port + '/index.html';
    await page.send('Page.navigate', { url: result.opened });
    const deadline = Date.now() + (o.timeout || 240000);
    while (Date.now() < deadline && !result.ready) {
      await sleep(1000);
      result.ready = !!(await value(games.GAMES[app].ready));
    }
    if (result.ready && result.restored.length) result.resumed = !!(await value(games.GAMES[app].resume));
    await sleep(o.settle || 8000);
    result.storageKeys = await value('Object.keys(localStorage).length');
    result.where = await value('JSON.stringify(Parohod98Report.GAMES[' + JSON.stringify(app) + '].where())');
    const shot = await page.send('Page.captureScreenshot', { format: 'png' });
    result.png = path.join(config.dir, id, 'repro.png');
    fs.writeFileSync(result.png, Buffer.from(shot.result.data, 'base64'));
    for (const e of page.events) {
      if (e.method === 'Runtime.exceptionThrown') {
        const d = e.params.exceptionDetails;
        result.exceptions.push({ text: d.exception && d.exception.description ? d.exception.description.split('\n').slice(0, 4).join('\n') : d.text, count: 1 });
      } else if (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') {
        result.consoleErrors.push({ text: e.params.args.map(a => a.value != null ? a.value : a.description || '').join(' ').split('\n').slice(0, 4).join('\n'), count: 1 });
      }
    }
    fs.writeFileSync(path.join(config.dir, id, 'repro.log'), JSON.stringify(Object.assign({}, result, { at: new Date().toISOString() }), null, 2));
    return result;
  } finally {
    try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (err) {}
    srv.close();
  }
}

async function reproHeadless(config, id, opts) {
  const o = opts || {};
  if (!fs.existsSync(path.join(config.dir, id, 'report.json'))) throw new Error('No report ' + id);
  const report = JSON.parse(fs.readFileSync(path.join(config.dir, id, 'report.json'), 'utf8'));
  if (report.source === 'parohod98') return reproParohod(config, id, report, o);
  const server = await ensureReproServer(config);
  const port = 9370 + Math.floor(Math.random() * 60);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'win98-repro-'));
  const edge = spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + profile, '--window-size=1280,960', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' });
  const result = { id, opened: '', ready: false, restored: [], missing: [], exceptions: [], consoleErrors: [], storageKeys: 0, png: '' };
  try {
    const page = await cdpPage(port);
    await page.send('Runtime.enable');
    await page.send('Page.navigate', { url: server.url + '/?bug=' + id });
    const deadline = Date.now() + (o.timeout || 120000);
    while (Date.now() < deadline) {
      await sleep(1000);
      const r = await page.send('Runtime.evaluate', { expression: 'JSON.stringify(window.bugRepro || null)', returnByValue: true });
      const state = r.result && r.result.result ? JSON.parse(r.result.result.value || 'null') : null;
      if (state && state.ready) {
        result.ready = true;
        result.opened = state.opened;
        result.restored = state.restored || [];
        result.missing = state.missing || [];
        result.live = !!state.live;
        break;
      }
    }
    await sleep(o.settle || 4000);
    const keys = await page.send('Runtime.evaluate', { expression: 'Object.keys(localStorage).length', returnByValue: true });
    result.storageKeys = keys.result.result.value;
    const shot = await page.send('Page.captureScreenshot', { format: 'png' });
    result.png = path.join(config.dir, id, 'repro.png');
    fs.writeFileSync(result.png, Buffer.from(shot.result.data, 'base64'));
    const counted = (list, text) => {
      const known = list.find(x => x.text === text);
      if (known) known.count++;
      else if (list.length < 30) list.push({ text, count: 1 });
    };
    for (const e of page.events) {
      if (e.method === 'Runtime.exceptionThrown') {
        const d = e.params.exceptionDetails;
        counted(result.exceptions, d.exception && d.exception.description ? d.exception.description.split('\n').slice(0, 4).join('\n') : d.text);
      } else if (e.method === 'Runtime.consoleAPICalled' && (e.params.type === 'error' || e.params.type === 'warning')) {
        counted(result.consoleErrors, e.params.type + ': ' + e.params.args.map(a => a.value != null ? a.value : a.description || '').join(' ').split('\n').slice(0, 4).join('\n'));
      }
    }
    fs.writeFileSync(path.join(config.dir, id, 'repro.log'), JSON.stringify(Object.assign({}, result, { at: new Date().toISOString() }), null, 2));
    return result;
  } finally {
    try {
      const v = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json();
      const b = new WebSocket(v.webSocketDebuggerUrl);
      await new Promise(r => { b.onopen = r; b.onerror = r; });
      b.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      await sleep(800);
    } catch (err) {}
    try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (err) {}
    if (server.proc) server.proc.kill();
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function createInboxServer(config, port) {
  const html = fs.readFileSync(path.join(__dirname, 'bugs', 'inbox.html'));
  const hosts = new Set(['127.0.0.1:' + port, 'localhost:' + port]);
  let repro = null;
  const send = (res, status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
  };
  const server = http.createServer(async (req, res) => {
    try {
      if (!hosts.has(req.headers.host)) return send(res, 403, { ok: false, error: 'local only' });
      if (req.method === 'POST' && req.headers['x-inbox'] !== '1') return send(res, 403, { ok: false, error: 'missing header' });
      const url = new URL(req.url, 'http://inbox');
      const parts = url.pathname.split('/').filter(Boolean);
      if (req.method === 'GET' && url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(html);
      }
      if (req.method === 'GET' && url.pathname === '/api/reports') {
        refreshMarkdown(config);
        return send(res, 200, { ok: true, items: loadAll(config.dir).map(i => summary(config, i)) });
      }
      if (req.method === 'POST' && url.pathname === '/api/pull') return send(res, 200, Object.assign({ ok: true }, await pull(config)));
      const id = parts[2];
      if (parts[0] === 'api' && parts[1] === 'reports' && ID_PATTERN.test(id || '') && fs.existsSync(path.join(config.dir, id, 'report.json'))) {
        if (req.method === 'GET' && parts.length === 3) {
          const report = readJson(path.join(config.dir, id, 'report.json'), {});
          return send(res, 200, { ok: true, report, status: statusOf(config.dir, id), files: filesIn(config.dir, id).concat(fs.existsSync(path.join(config.dir, id, 'repro.png')) ? ['repro.png'] : []), changes: headChanges(config.repo, report.build && report.build.commit), cheats: cheatsUsed(report) });
        }
        if (req.method === 'POST' && parts[3] === 'status') {
          const body = JSON.parse((await readBody(req)) || '{}');
          const current = statusOf(config.dir, id);
          return send(res, 200, { ok: true, status: await setStatus(config, id, body.status || current.status, { in: body.fixedIn, note: body.note, dup: body.dup }) });
        }
        if (req.method === 'POST' && parts[3] === 'repro') {
          if (!repro) repro = await ensureReproServer(config);
          return send(res, 200, { ok: true, url: openRepro(repro.url, id) });
        }
      }
      if (req.method === 'GET' && parts[0] === 'files' && ID_PATTERN.test(parts[1] || '')) {
        const name = parts[2] || '';
        const allowed = FILE_NAMES.has(name) || ['report.md', 'report.json', 'repro.png', 'repro.log'].includes(name);
        const file = path.join(config.dir, parts[1], name);
        if (!allowed || !fs.existsSync(file)) return send(res, 404, { ok: false, error: 'not found' });
        res.writeHead(200, { 'Content-Type': MEDIA[path.extname(name)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
        return fs.createReadStream(file).pipe(res);
      }
      return send(res, 404, { ok: false, error: 'not found' });
    } catch (err) {
      if (!res.headersSent) send(res, 500, { ok: false, error: err.message });
    }
  });
  server.on('close', () => { if (repro && repro.proc) repro.proc.kill(); });
  return server;
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next != null && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else out[key] = true;
    } else out._.push(a);
  }
  return out;
}

function printTable(items) {
  if (!items.length) {
    console.log('No reports.');
    return;
  }
  for (const { id, report, status } of items) {
    const user = report.user || {};
    console.log([id, String(report.created || '').slice(0, 16).replace('T', ' '), (status.status + (status.fixedIn ? ' ' + status.fixedIn : '')).padEnd(12), String((report.where && report.where.app) || '').padEnd(14), (cheatsUsed(report) ? 'cheats ' : '') + (user.title || '')].join('  '));
  }
}

const HELP = `Usage: node tools/bugs.cjs <command>
  pull                         download new reports and statuses from the mini PC
  import <file>                add a BR-....bugreport.json file
  list [--status s] [--app a] [--kind k]
  last                         path of the newest report.md
  show <id>                    print report.md (regenerated)
  status <id> <status> [--in 1.7] [--note "..."] [--dup BR-...]
                               statuses: ${STATUSES.join(', ')}
  index                        rebuild report.md files and INDEX.md
  serve [--port 8099]          inbox page on http://127.0.0.1:8099
  repro <id> [--headless]      run the system with the report's save on port 8091
                               (--headless: Edge via CDP, writes repro.png and repro.log)`;

async function main(argv) {
  const args = parseArgs(argv);
  const config = loadConfig();
  const command = args._[0];
  if (command === 'pull') {
    const res = await pull(config);
    console.log('Server has ' + res.total + ' reports. New: ' + res.added.length + (res.added.length ? ' (' + res.added.join(', ') + ')' : '') + '. Status changes: ' + res.changed.length + '.');
    return;
  }
  if (command === 'import') {
    if (!args._[1]) throw new Error('import needs a file');
    const res = importFile(config, args._[1]);
    console.log(res.created ? 'Imported ' + res.id : res.id + ' is already there');
    return;
  }
  if (command === 'list') {
    refreshMarkdown(config);
    printTable(loadAll(config.dir).filter(i => (!args.status || i.status.status === args.status) && (!args.app || String((i.report.where && i.report.where.app) || '').includes(args.app)) && (!args.kind || (i.report.user || {}).kind === args.kind)));
    return;
  }
  if (command === 'last') {
    const [first] = loadAll(config.dir);
    if (!first) throw new Error('No reports in ' + config.dir);
    refreshMarkdown(config);
    console.log(path.join(config.dir, first.id, 'report.md'));
    return;
  }
  if (command === 'show') {
    const id = String(args._[1] || '').toUpperCase();
    if (!fs.existsSync(path.join(config.dir, id, 'report.json'))) throw new Error('No report ' + id);
    writeMarkdown(config, id);
    console.log(fs.readFileSync(path.join(config.dir, id, 'report.md'), 'utf8'));
    return;
  }
  if (command === 'status') {
    const next = await setStatus(config, String(args._[1] || '').toUpperCase(), args._[2], { in: args.in, note: args.note, dup: args.dup });
    console.log(String(args._[1]).toUpperCase() + ': ' + next.status + (next.fixedIn ? ' in ' + next.fixedIn : '') + (next.origin === 'remote' ? ' (sent to the server)' : ' (local report)'));
    return;
  }
  if (command === 'serve') {
    const port = Number(args.port) || SERVE_PORT;
    const server = createInboxServer(config, port);
    server.listen(port, '127.0.0.1', () => console.log('Inbox: http://127.0.0.1:' + port + '/  (Ctrl+C to stop)'));
    process.on('SIGINT', () => { server.close(); process.exit(0); });
    return;
  }
  if (command === 'repro') {
    const id = String(args._[1] || '').toUpperCase();
    if (!fs.existsSync(path.join(config.dir, id, 'report.json'))) throw new Error('No report ' + id);
    const parohod = JSON.parse(fs.readFileSync(path.join(config.dir, id, 'report.json'), 'utf8')).source === 'parohod98';
    if (args.headless || parohod) {
      const r = await reproHeadless(config, id);
      if (r.parohod98) console.log('Пароход 98 ' + r.parohod98 + (r.resumed ? ', save continued' : '') + (r.where ? ', where now: ' + JSON.parse(r.where).summary : ''));
      console.log((r.ready ? 'Ready' : 'Timed out') + (r.opened ? ', opened ' + r.opened : '') + (r.live ? ', live state loaded' : '') + ', restored keys: ' + r.restored.length + (r.missing.length ? ' (missing ' + r.missing.join(', ') + ')' : '') + ', localStorage keys: ' + r.storageKeys + ', exceptions: ' + r.exceptions.length + ', console errors: ' + r.consoleErrors.length);
      r.exceptions.concat(r.consoleErrors).forEach(e => console.log('  ' + e.text.split('\n')[0] + (e.count > 1 ? ' x' + e.count : '')));
      console.log('Screenshot: ' + r.png);
      return;
    }
    const server = await ensureReproServer(config);
    console.log('Opened ' + openRepro(server.url, id) + (server.proc ? '  (server runs until Ctrl+C)' : ''));
    if (server.proc) process.on('SIGINT', () => { server.proc.kill(); process.exit(0); });
    else process.exit(0);
    return;
  }
  if (command === 'index') {
    refreshMarkdown(config, true);
    writeIndex(config);
    console.log('Rebuilt ' + folders(config.dir).length + ' reports and INDEX.md');
    return;
  }
  console.log(HELP);
}

if (require.main === module) {
  main(process.argv.slice(2)).catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { createInboxServer, reproHeadless, summary, loadConfig, reportMarkdown, indexMarkdown, storePackage, importFile, pull, setStatus, refreshMarkdown, writeIndex, loadAll, headChanges, parseArgs };
