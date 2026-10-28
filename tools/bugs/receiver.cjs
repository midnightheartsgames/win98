const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ID_PATTERN = /^BR-\d{6}-[0-9A-HJKMNP-TV-Z]{4}$/;
const FILE_NAMES = new Set(['shot.png', 'shot.jpg', 'shot-marked.png', 'shot-marked.jpg', 'shot-window.png', 'shot-window.jpg', 'save.json.gz']);
const STATUSES = ['new', 'accepted', 'fixed', 'duplicate', 'notabug', 'wontfix'];
const STATUS_TEXT = { new: 'Получен', accepted: 'Принят', fixed: 'Исправлен', duplicate: 'Уже известен', notabug: 'Не ошибка', wontfix: 'Не будет исправлен' };
const KIND_TEXT = { bug: 'Не работает', crash: 'Зависло или закрылось', visual: 'Графика', text: 'Текст или перевод', sound: 'Звук', balance: 'Баланс', idea: 'Идея' };
const REPEAT_TEXT = { always: 'всегда', sometimes: 'иногда', once: 'один раз', unknown: 'не проверял' };
const BUTTONS = [['accepted', 'Принять'], ['notabug', 'Не ошибка'], ['duplicate', 'Уже известен']];
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const GB = 1024 * 1024 * 1024;

function readEnvFile(file) {
  const values = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) values[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return values;
}

function loadConfig(argv) {
  const envAt = argv.indexOf('--env');
  const env = envAt >= 0 ? { ...process.env, ...readEnvFile(argv[envAt + 1]) } : process.env;
  return {
    host: env.BUGS_HOST || '127.0.0.1',
    port: Number(env.BUGS_PORT) || 39899,
    dataDir: env.STATE_DIRECTORY || env.BUGS_DATA || path.join(__dirname, 'bugs-data'),
    token: env.BUGS_TOKEN || '',
    keepDays: Number(env.BUGS_KEEP_DAYS) || 90,
    maxGb: Number(env.BUGS_MAX_GB) || 5,
    minFreeGb: Number(env.BUGS_MIN_FREE_GB) || 2,
    rateLimit: Number(env.BUGS_RATE) || 10,
    maxBody: 10 * 1024 * 1024,
    botToken: env.TELEGRAM_BOT_TOKEN || '',
    chatId: env.TELEGRAM_CHAT_ID || ''
  };
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

function sendJson(res, status, body) {
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on('data', chunk => {
      size += chunk.length;
      if (tooLarge) return;
      if (size > limit) {
        tooLarge = true;
        chunks.length = 0;
        reject(Object.assign(new Error('report too large'), { status: 413 }));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function validate(data) {
  if (!data || data.format !== 'win98-bugreport-file' || data.v !== 1) return 'bad file format';
  const report = data.report;
  if (!report || report.format !== 'win98-bugreport' || report.v !== 1) return 'bad report format';
  if (!ID_PATTERN.test(String(report.id))) return 'bad report id';
  const files = data.files || {};
  if (typeof files !== 'object' || Array.isArray(files)) return 'bad files';
  for (const [name, value] of Object.entries(files)) {
    if (!FILE_NAMES.has(name)) return 'unexpected file ' + name;
    if (typeof value !== 'string' || !BASE64.test(value)) return 'bad file data ' + name;
  }
  return '';
}

function clip(text, max) {
  const s = String(text == null ? '' : text);
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function cheatsUsed(report) {
  return Object.values(report.apps || {}).some(a => a && (a.cheats || (a.state && a.state.cheats)));
}

function entryOf(report, files, now) {
  const user = report.user || {};
  return {
    id: report.id,
    at: new Date(now).toISOString(),
    created: report.created || '',
    source: report.source || '',
    channel: report.channel || '',
    app: (report.where && report.where.app) || '',
    where: clip(report.where && report.where.summary, 300),
    kind: user.kind || 'bug',
    title: clip(user.title, 200),
    commit: (report.build && report.build.commit) || '',
    cheats: cheatsUsed(report),
    files: Object.keys(files),
    status: 'new',
    fixedIn: '',
    note: '',
    dup: ''
  };
}

function caption(report, entry) {
  const user = report.user || {};
  const head = ['🐞 ' + report.id, report.source === 'hsr98' ? 'HSR 98' : 'Win 98', report.channel, KIND_TEXT[user.kind] || user.kind, REPEAT_TEXT[user.repeat] || ''].filter(Boolean).join(' · ');
  const lines = [head, clip(user.title, 200)];
  if (user.text) lines.push(clip(user.text, 300));
  if (report.where && report.where.summary) lines.push('Где: ' + clip(report.where.summary, 200));
  const errors = report.errors || [];
  if (errors.length) {
    const e = errors[0];
    lines.push('Ошибки: ' + clip(e.msg, 120) + (e.src ? ' (' + e.src.split('/').pop() + ')' : '') + (e.count > 1 ? ' ×' + e.count : '') + (errors.length > 1 ? ' и ещё ' + (errors.length - 1) : ''));
  }
  const tail = [];
  if (report.build && report.build.commit) tail.push('Сборка ' + report.build.commit);
  if (entry.files.includes('save.json.gz')) tail.push('сохранение приложено');
  if (user.contact) tail.push('контакт: ' + clip(user.contact, 60));
  if (tail.length) lines.push(tail.join(' · '));
  if (entry.cheats) lines.push('⚠ F7/F8 использовались');
  if (entry.status !== 'new') lines.push('Статус: ' + (STATUS_TEXT[entry.status] || entry.status));
  return clip(lines.join('\n'), 1024);
}

function keyboard(entry) {
  return { inline_keyboard: [BUTTONS.map(([status, text]) => ({ text: (entry.status === status ? '✓ ' : '') + text, callback_data: 'st:' + status + ':' + entry.id }))] };
}

class Store {
  constructor(dir) {
    this.dir = dir;
    this.indexFile = path.join(dir, 'index.jsonl');
    this.entries = new Map();
    this.sizeCache = null;
    fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(this.indexFile)) {
      for (const line of fs.readFileSync(this.indexFile, 'utf8').split('\n')) {
        if (!line.trim()) continue;
        try {
          const e = JSON.parse(line);
          if (e && ID_PATTERN.test(e.id)) this.entries.set(e.id, e);
        } catch (err) {}
      }
    }
  }

  folder(id) {
    return path.join(this.dir, id);
  }

  get(id) {
    return this.entries.get(id) || null;
  }

  add(entry) {
    this.entries.set(entry.id, entry);
    fs.appendFileSync(this.indexFile, JSON.stringify(entry) + '\n');
    this.sizeCache = null;
  }

  update(id, patch) {
    const entry = this.entries.get(id);
    if (!entry) return null;
    Object.assign(entry, patch);
    this.rewrite();
    return entry;
  }

  remove(id) {
    fs.rmSync(this.folder(id), { recursive: true, force: true });
    this.entries.delete(id);
    this.rewrite();
    this.sizeCache = null;
  }

  rewrite() {
    const tmp = this.indexFile + '.tmp';
    fs.writeFileSync(tmp, Array.from(this.entries.values()).map(e => JSON.stringify(e) + '\n').join(''));
    fs.renameSync(tmp, this.indexFile);
  }

  usedBytes() {
    if (this.sizeCache && Date.now() - this.sizeCache.at < 60000) return this.sizeCache.bytes;
    let bytes = 0;
    const walk = dir => {
      for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, item.name);
        if (item.isDirectory()) walk(p);
        else bytes += fs.statSync(p).size;
      }
    };
    walk(this.dir);
    this.sizeCache = { at: Date.now(), bytes };
    return bytes;
  }

  freeBytes() {
    try {
      const s = fs.statfsSync(this.dir);
      return s.bavail * s.bsize;
    } catch (err) {
      return Infinity;
    }
  }

  purgeOld(keepDays, now) {
    const purged = [];
    for (const e of this.entries.values()) {
      if (e.purged || now - Date.parse(e.at) < keepDays * DAY) continue;
      fs.rmSync(this.folder(e.id), { recursive: true, force: true });
      e.purged = true;
      e.title = '';
      e.where = '';
      purged.push(e.id);
    }
    if (purged.length) {
      this.rewrite();
      this.sizeCache = null;
    }
    return purged;
  }
}

class Telegram {
  constructor(config, store, fetchImpl, log) {
    this.config = config;
    this.store = store;
    this.fetch = fetchImpl;
    this.log = log;
    this.enabled = !!(config.botToken && config.chatId);
    this.outboxFile = path.join(store.dir, 'outbox-telegram.jsonl');
    this.offsetFile = path.join(store.dir, 'telegram-offset');
    this.outbox = [];
    this.lastWarning = 0;
    if (fs.existsSync(this.outboxFile)) {
      this.outbox = fs.readFileSync(this.outboxFile, 'utf8').split('\n').filter(Boolean).map(l => {
        try { return JSON.parse(l); } catch (err) { return null; }
      }).filter(Boolean);
    }
  }

  saveOutbox() {
    fs.writeFileSync(this.outboxFile, this.outbox.map(o => JSON.stringify(o) + '\n').join(''));
  }

  async call(method, body) {
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    const res = await this.fetch('https://api.telegram.org/bot' + this.config.botToken + '/' + method, {
      method: 'POST',
      headers: isForm ? undefined : { 'Content-Type': 'application/json' },
      body: isForm ? body : JSON.stringify(body || {}),
      signal: AbortSignal.timeout(method === 'getUpdates' ? 65000 : 30000)
    });
    const data = await res.json();
    if (!data.ok) throw new Error(method + ': ' + data.description);
    return data.result;
  }

  enqueue(id) {
    if (!this.enabled) return;
    this.outbox.push({ id, tries: 0, next: 0 });
    this.saveOutbox();
  }

  async flush(now) {
    if (!this.enabled) return;
    const t = now || Date.now();
    let changed = false;
    for (const item of this.outbox.slice()) {
      if (item.next > t) continue;
      try {
        if (item.text) await this.call('sendMessage', { chat_id: this.config.chatId, text: item.text });
        else await this.notify(item.id);
        this.outbox.splice(this.outbox.indexOf(item), 1);
      } catch (err) {
        item.tries++;
        item.next = t + 5 * 60 * 1000;
        this.log('telegram: ' + err.message);
      }
      changed = true;
    }
    if (changed) this.saveOutbox();
  }

  photoOf(entry) {
    const dir = this.store.folder(entry.id);
    for (const name of ['shot-marked.png', 'shot-marked.jpg', 'shot.png', 'shot.jpg']) {
      if (fs.existsSync(path.join(dir, name))) return path.join(dir, name);
    }
    return null;
  }

  async notify(id) {
    const entry = this.store.get(id);
    if (!entry || entry.purged) return;
    const report = JSON.parse(fs.readFileSync(path.join(this.store.folder(id), 'report.json'), 'utf8'));
    const text = caption(report, entry);
    const markup = keyboard(entry);
    const photo = this.photoOf(entry);
    let message;
    if (photo) {
      const form = new FormData();
      form.append('chat_id', String(this.config.chatId));
      form.append('caption', text);
      form.append('reply_markup', JSON.stringify(markup));
      form.append('photo', new Blob([fs.readFileSync(photo)]), path.basename(photo));
      message = await this.call('sendPhoto', form);
    } else {
      message = await this.call('sendMessage', { chat_id: this.config.chatId, text, reply_markup: markup });
    }
    this.store.update(id, { tg: message.message_id, tgPhoto: !!photo });
  }

  warn(text, now) {
    const t = now || Date.now();
    if (!this.enabled || t - this.lastWarning < DAY) return;
    this.lastWarning = t;
    this.outbox.push({ text, tries: 0, next: 0 });
    this.saveOutbox();
  }

  ownChat(chat) {
    return chat && String(chat.id) === String(this.config.chatId);
  }

  async setStatus(id, status) {
    const entry = this.store.update(id, { status });
    if (!entry) return null;
    if (entry.tg) {
      try {
        const report = JSON.parse(fs.readFileSync(path.join(this.store.folder(id), 'report.json'), 'utf8'));
        const body = { chat_id: this.config.chatId, message_id: entry.tg, reply_markup: keyboard(entry) };
        if (entry.tgPhoto) await this.call('editMessageCaption', Object.assign({ caption: caption(report, entry) }, body));
        else await this.call('editMessageText', Object.assign({ text: caption(report, entry) }, body));
      } catch (err) {
        this.log('telegram edit: ' + err.message);
      }
    }
    return entry;
  }

  async handleUpdate(update) {
    const cb = update.callback_query;
    if (cb) {
      const m = /^st:([a-z]+):(BR-\d{6}-[0-9A-HJKMNP-TV-Z]{4})$/.exec(cb.data || '');
      if (!m || !cb.message || !this.ownChat(cb.message.chat) || !STATUSES.includes(m[1])) {
        await this.call('answerCallbackQuery', { callback_query_id: cb.id });
        return;
      }
      const entry = await this.setStatus(m[2], m[1]);
      await this.call('answerCallbackQuery', { callback_query_id: cb.id, text: entry ? m[2] + ': ' + STATUS_TEXT[m[1]] : 'Отчёт не найден' });
      return;
    }
    const msg = update.message;
    if (!msg || !this.ownChat(msg.chat) || typeof msg.text !== 'string') return;
    const text = msg.text.trim();
    if (/^\/new(@\w+)?$/.test(text)) {
      const fresh = Array.from(this.store.entries.values()).filter(e => e.status === 'new' && !e.purged);
      const last = fresh.slice(-5).reverse().map(e => e.id + ' — ' + e.title).join('\n');
      await this.call('sendMessage', { chat_id: this.config.chatId, text: 'Новых отчётов: ' + fresh.length + (last ? '\n' + last : '') });
      return;
    }
    const get = /^\/get(@\w+)?\s+(BR-\d{6}-[0-9A-HJKMNP-TV-Z]{4})$/i.exec(text);
    if (get) {
      const id = get[2].toUpperCase();
      if (this.store.get(id) && !this.store.get(id).purged) await this.notify(id);
      else await this.call('sendMessage', { chat_id: this.config.chatId, text: id + ': нет такого отчёта или его файлы уже удалены' });
    }
  }

  async pollOnce() {
    let offset = 0;
    try { offset = Number(fs.readFileSync(this.offsetFile, 'utf8')) || 0; } catch (err) {}
    const updates = await this.call('getUpdates', { offset, timeout: 50, allowed_updates: ['message', 'callback_query'] });
    for (const u of updates) {
      try { await this.handleUpdate(u); } catch (err) { this.log('telegram update: ' + err.message); }
      fs.writeFileSync(this.offsetFile, String(u.update_id + 1));
    }
  }
}

function sameToken(given, expected) {
  if (!expected) return false;
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function clientIp(req) {
  const remote = req.socket.remoteAddress || '';
  const loopback = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
  const cf = req.headers['cf-connecting-ip'];
  return loopback && cf ? String(cf) : remote;
}

function createApp(config, deps) {
  const options = deps || {};
  const log = options.log || (msg => console.log(msg));
  const now = options.now || (() => Date.now());
  const store = new Store(config.dataDir);
  const telegram = new Telegram(config, store, options.fetchImpl || fetch, log);
  const hits = new Map();

  function limited(ip) {
    const t = now();
    const list = (hits.get(ip) || []).filter(x => t - x < HOUR);
    if (list.length >= config.rateLimit) {
      hits.set(ip, list);
      return true;
    }
    list.push(t);
    hits.set(ip, list);
    if (hits.size > 5000) hits.delete(hits.keys().next().value);
    return false;
  }

  function diskProblem() {
    if (store.usedBytes() > config.maxGb * GB) return 'report storage is full';
    if (store.freeBytes() < config.minFreeGb * GB) return 'disk is almost full';
    return '';
  }

  async function receive(req, res) {
    if (limited(clientIp(req))) {
      sendJson(res, 429, { ok: false, error: 'too many reports' });
      return;
    }
    const disk = diskProblem();
    if (disk) {
      telegram.warn('Приёмник отчётов: ' + disk + '. Новые отчёты не принимаются.', now());
      sendJson(res, 507, { ok: false, error: disk });
      return;
    }
    let data;
    try {
      data = JSON.parse((await readBody(req, config.maxBody)).toString('utf8'));
    } catch (err) {
      sendJson(res, err.status || 400, { ok: false, error: err.status ? err.message : 'bad json' });
      return;
    }
    const problem = validate(data);
    if (problem) {
      sendJson(res, 400, { ok: false, error: problem });
      return;
    }
    const report = data.report;
    const dir = store.folder(report.id);
    if (store.get(report.id)) {
      sendJson(res, 409, { ok: false, error: 'duplicate id' });
      return;
    }
    try {
      fs.mkdirSync(dir);
    } catch (err) {
      sendJson(res, err.code === 'EEXIST' ? 409 : 500, { ok: false, error: err.code === 'EEXIST' ? 'duplicate id' : 'cannot store report' });
      return;
    }
    const files = data.files || {};
    fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report, null, 2));
    for (const [name, value] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), Buffer.from(value, 'base64'));
    store.add(entryOf(report, files, now()));
    telegram.enqueue(report.id);
    log('report ' + report.id + ' from ' + (report.channel || '?'));
    sendJson(res, 200, { ok: true, id: report.id });
    telegram.flush(now()).catch(err => log('telegram: ' + err.message));
  }

  function publicStatus(url, res) {
    const ids = String(url.searchParams.get('ids') || '').split(',').filter(id => ID_PATTERN.test(id)).slice(0, 50);
    const items = {};
    for (const id of ids) {
      const e = store.get(id);
      if (e) items[id] = { status: e.status, fixedIn: e.fixedIn || '', note: e.note || '' };
    }
    sendJson(res, 200, { ok: true, items });
  }

  async function setStatus(id, req, res) {
    let body;
    try {
      body = JSON.parse((await readBody(req, 8192)).toString('utf8'));
    } catch (err) {
      sendJson(res, 400, { ok: false, error: 'bad json' });
      return;
    }
    if (!STATUSES.includes(body.status)) {
      sendJson(res, 400, { ok: false, error: 'bad status' });
      return;
    }
    store.update(id, { fixedIn: clip(body.fixedIn, 20), note: clip(body.note, 300), dup: ID_PATTERN.test(body.dup || '') ? body.dup : '' });
    const entry = await telegram.setStatus(id, body.status);
    sendJson(res, 200, { ok: true, entry });
  }

  function sendFile(id, name, res) {
    const file = path.join(store.folder(id), name);
    if (!fs.existsSync(file)) {
      sendJson(res, 404, { ok: false, error: 'not found' });
      return;
    }
    res.writeHead(200, { ...CORS, 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename="' + name + '"', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    fs.createReadStream(file).pipe(res);
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://receiver');
    const parts = url.pathname.split('/').filter(Boolean);
    const route = () => {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, { ...CORS, 'Cache-Control': 'no-store' });
        res.end();
        return;
      }
      if (parts[0] !== 'api' || parts[1] !== 'bugs') return sendJson(res, 404, { ok: false, error: 'not found' });
      if (parts.length === 3 && parts[2] === 'ping' && req.method === 'GET') return sendJson(res, 200, { ok: true, v: 1 });
      if (parts.length === 2 && req.method === 'POST') return receive(req, res);
      if (parts.length === 3 && parts[2] === 'status' && req.method === 'GET') return publicStatus(url, res);
      const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (!sameToken(auth, config.token)) return sendJson(res, 401, { ok: false, error: 'token required' });
      if (parts.length === 2 && req.method === 'GET') {
        const since = Date.parse(url.searchParams.get('since') || '') || 0;
        const items = Array.from(store.entries.values()).filter(e => Date.parse(e.at) >= since).sort((a, b) => a.at.localeCompare(b.at));
        return sendJson(res, 200, { ok: true, items });
      }
      const id = parts[2];
      if (!ID_PATTERN.test(id || '') || !store.get(id)) return sendJson(res, 404, { ok: false, error: 'not found' });
      if (parts.length === 4 && parts[3] === 'status' && req.method === 'POST') return setStatus(id, req, res);
      if (parts.length === 4 && req.method === 'GET' && (parts[3] === 'report.json' || FILE_NAMES.has(parts[3]))) return sendFile(id, parts[3], res);
      if (parts.length === 3 && req.method === 'DELETE') {
        store.remove(id);
        return sendJson(res, 200, { ok: true });
      }
      return sendJson(res, 404, { ok: false, error: 'not found' });
    };
    Promise.resolve().then(route).catch(err => {
      log('error: ' + err.message);
      if (!res.headersSent) sendJson(res, 500, { ok: false, error: 'server error' });
    });
  });

  return {
    server,
    store,
    telegram,
    cleanup: () => store.purgeOld(config.keepDays, now())
  };
}

async function telegramCall(config, method, body) {
  if (!config.botToken) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  const res = await fetch('https://api.telegram.org/bot' + config.botToken + '/' + method, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const data = await res.json();
  if (!data.ok) throw new Error(method + ': ' + data.description);
  return data.result;
}

function chatName(chat) {
  return chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || '';
}

async function findChats(config) {
  const updates = await telegramCall(config, 'getUpdates', { allowed_updates: ['message', 'channel_post', 'my_chat_member'] });
  const chats = new Map();
  for (const u of updates) {
    const chat = (u.message || u.channel_post || u.my_chat_member || {}).chat;
    if (chat) chats.set(chat.id, chat);
  }
  if (!chats.size) {
    console.log('No chats yet. Send /start to the bot (or add it to a group), then run find-chat again. Stop the bug-receiver service first: it reads the same updates.');
    return;
  }
  for (const chat of chats.values()) console.log(chat.id + '\t' + chat.type + '\t' + chatName(chat));
}

async function testTelegram(config) {
  if (!config.chatId) throw new Error('TELEGRAM_CHAT_ID is not set');
  await telegramCall(config, 'sendMessage', { chat_id: config.chatId, text: 'Приёмник отчётов об ошибках на связи.' });
  console.log('Test message sent to ' + config.chatId);
}

async function sendTest(config, argv) {
  const urlAt = argv.indexOf('--url');
  const url = urlAt >= 0 ? argv[urlAt + 1] : 'http://' + config.host + ':' + config.port + '/api/bugs';
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const id = 'BR-' + p(d.getFullYear() % 100) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + Array.from(crypto.randomBytes(4), b => chars[b % 32]).join('');
  const report = {
    format: 'win98-bugreport',
    v: 1,
    id,
    created: d.toISOString(),
    source: 'win98',
    channel: 'test',
    build: {},
    user: { title: 'Проверка приёмника', text: 'Тестовый отчёт из receiver.cjs send-test', kind: 'bug', repeat: 'once', contact: '' },
    where: { summary: 'receiver.cjs send-test', window: '', app: 'test' },
    system: {},
    windows: [],
    apps: {},
    errors: [],
    missing: [],
    log: [],
    trail: [],
    attach: { shot: null, marked: null, save: null, marks: [] }
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ format: 'win98-bugreport-file', v: 1, report, files: {} }) });
  console.log(res.status + ' ' + (await res.text()));
}

function serve(config) {
  const app = createApp(config);
  const log = msg => console.log(msg);
  app.server.listen(config.port, config.host, () => {
    log('Bug receiver listening on http://' + config.host + ':' + config.port + ', data in ' + config.dataDir + (app.telegram.enabled ? ', Telegram on' : ', Telegram off'));
  });
  const purge = () => {
    try {
      const gone = app.cleanup();
      if (gone.length) log('purged ' + gone.length + ' old reports');
    } catch (err) {
      log('purge: ' + err.message);
    }
  };
  purge();
  setInterval(purge, 6 * HOUR);
  setInterval(() => app.telegram.flush().catch(err => log('telegram: ' + err.message)), 60 * 1000);
  if (app.telegram.enabled) {
    const loop = async () => {
      for (;;) {
        try {
          await app.telegram.pollOnce();
        } catch (err) {
          log('telegram poll: ' + err.message);
          await new Promise(r => setTimeout(r, 15000));
        }
      }
    };
    loop();
  }
}

async function main(argv) {
  const config = loadConfig(argv);
  const envAt = argv.indexOf('--env');
  const rest = envAt >= 0 ? argv.filter((a, i) => i !== envAt && i !== envAt + 1) : argv;
  const command = rest[0] || 'serve';
  if (command === 'serve') return serve(config);
  if (command === 'find-chat') return findChats(config);
  if (command === 'test-telegram') return testTelegram(config);
  if (command === 'send-test') return sendTest(config, rest);
  throw new Error('Unknown command: ' + command);
}

if (require.main === module) {
  main(process.argv.slice(2)).catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { createApp, loadConfig, readEnvFile, validate, caption, keyboard, entryOf, ID_PATTERN, FILE_NAMES, STATUSES };
