const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const API = '/api/net';
const UID_PATTERN = /^7\d{8}$/;
const SECRET_PATTERN = /^[0-9A-HJKMNP-TV-Z]{16}$/;
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
const DIFFS = ['easy', 'normal', 'hard'];
const OP_CONT = 0, OP_TEXT = 1, OP_BINARY = 2, OP_CLOSE = 8, OP_PING = 9, OP_PONG = 10;
const PROTO = 1, SEATS = 4, MAX_STALL = 10000, HOUR = 3600000, PHRASES = 6, FIELD_MAX = 20000;
const VISIT_PHRASES = 8, WISHES = 6, DAY = 86400000, DAY_SHIFT = 4 * HOUR, FACING = ['up', 'down', 'left', 'right'];
const CLOSE_PROTO = 4001, CLOSE_SECRET = 4002, CLOSE_BANNED = 4003, CLOSE_REPLACED = 4004, CLOSE_DELETED = 4005;

function loadConfig(env = process.env) {
  return {
    host: env.NET_HOST || '127.0.0.1',
    port: env.NET_PORT === undefined ? 39900 : Number(env.NET_PORT),
    dataDir: env.STATE_DIRECTORY || env.NET_DATA || path.join(__dirname, 'net-data'),
    maxFrame: 64 * 1024,
    maxLogFile: 20 * 1024 * 1024,
    rate: 60,
    perIp: 8,
    pingEvery: 30000,
    deadAfter: 75000,
    newPerHour: 5,
    tablesMax: 20,
    turnMs: Number(env.NET_TURN_MS) || 100 / 3,
    turnTicks: 1,
    emptyEvery: 2,
    cmdRate: 20,
    cmdSize: 400,
    statusSize: 200,
    awayAfter: 10000,
    tableIdle: 600000,
    pauseCount: 3,
    pauseOpen: 120000,
    pauseClosed: 600000,
    pauseOthers: 15000,
    pauseCountdown: 3000,
    signalGap: 1000,
    expressSize: 4096,
    expressGap: 5000,
    guestMax: 3,
    posRate: 8,
    giftStay: 30000,
    giftCredits: 2000,
    giftDaily: 3,
    giftKeep: 30 * DAY,
    bookMax: 30,
    awayMax: 10,
    friendMax: 100,
    favMax: 3,
    blockMax: 100,
    reqMax: 100,
    recentMax: 10,
    cardSize: 4096,
    cardGap: 20000,
    findGap: 1000,
    inviteGap: 2000,
    timers: true,
    now: Date.now
  };
}

class WsConn {
  constructor(socket, opts) {
    this.socket = socket;
    this.maxFrame = opts.maxFrame;
    this.onMessage = opts.onMessage;
    this.onClose = opts.onClose;
    this.buf = Buffer.alloc(0);
    this.parts = [];
    this.partsSize = 0;
    this.closed = false;
    this.lastSeen = Date.now();
    this.decoder = new TextDecoder('utf-8', { fatal: true });
    socket.setNoDelay(true);
    socket.on('data', chunk => this.feed(chunk));
    socket.on('end', () => socket.destroy());
    socket.on('close', () => this.gone());
    socket.on('error', () => {});
  }

  feed(chunk) {
    this.lastSeen = Date.now();
    this.buf = this.buf.length ? Buffer.concat([this.buf, chunk]) : chunk;
    while (!this.closed && this.readFrame());
  }

  readFrame() {
    const b = this.buf;
    if (b.length < 2) return false;
    const fin = !!(b[0] & 0x80), op = b[0] & 0x0f;
    let len = b[1] & 0x7f, at = 2;
    if (b[0] & 0x70 || !(b[1] & 0x80)) return this.close(1002);
    if (len === 126) {
      if (b.length < 4) return false;
      len = b.readUInt16BE(2);
      at = 4;
    } else if (len === 127) {
      if (b.length < 10) return false;
      if (b.readUInt32BE(2)) return this.close(1009);
      len = b.readUInt32BE(6);
      at = 10;
    }
    if (op >= OP_CLOSE && (!fin || len > 125)) return this.close(1002);
    if (len > this.maxFrame) return this.close(1009);
    if (b.length < at + 4 + len) return false;
    const mask = b.subarray(at, at + 4), payload = Buffer.from(b.subarray(at + 4, at + 4 + len));
    for (let i = 0; i < len; i++) payload[i] ^= mask[i & 3];
    this.buf = b.subarray(at + 4 + len);
    this.handle(op, fin, payload);
    return !this.closed;
  }

  handle(op, fin, payload) {
    if (op === OP_CLOSE) { this.close(payload.length >= 2 ? payload.readUInt16BE(0) : 1000); return; }
    if (op === OP_PING) { this.frame(OP_PONG, payload); return; }
    if (op === OP_PONG) return;
    if (op === OP_BINARY) { this.close(1003); return; }
    if (op !== OP_TEXT && op !== OP_CONT) { this.close(1002); return; }
    if ((op === OP_TEXT) === (this.parts.length > 0)) { this.close(1002); return; }
    this.partsSize += payload.length;
    if (this.partsSize > this.maxFrame) { this.close(1009); return; }
    this.parts.push(payload);
    if (!fin) return;
    const whole = this.parts.length === 1 ? this.parts[0] : Buffer.concat(this.parts);
    this.parts = [];
    this.partsSize = 0;
    let text;
    try { text = this.decoder.decode(whole); } catch (err) { this.close(1007); return; }
    this.onMessage(text);
  }

  frame(op, payload) {
    if (this.closed && op !== OP_CLOSE) return;
    const n = payload.length, head = n < 126 ? Buffer.from([0x80 | op, n]) : n < 65536 ? Buffer.from([0x80 | op, 126, n >> 8, n & 255]) : null;
    if (head) { this.socket.write(Buffer.concat([head, payload])); return; }
    const long = Buffer.alloc(10);
    long[0] = 0x80 | op;
    long[1] = 127;
    long.writeUInt32BE(n, 6);
    this.socket.write(Buffer.concat([long, payload]));
  }

  send(text) { this.frame(OP_TEXT, Buffer.from(text, 'utf8')); }

  ping() { this.frame(OP_PING, Buffer.alloc(0)); }

  close(code) {
    if (this.closed) return false;
    const body = Buffer.alloc(2);
    body.writeUInt16BE(code, 0);
    this.frame(OP_CLOSE, body);
    this.closed = true;
    this.socket.end();
    const kill = setTimeout(() => this.socket.destroy(), 1000);
    kill.unref();
    return false;
  }

  gone() {
    this.closed = true;
    if (this.onClose) { const fn = this.onClose; this.onClose = null; fn(); }
  }
}

const COMPACT_AFTER = 5000;

class Accounts {
  constructor(dir) {
    this.file = path.join(dir, 'accounts.jsonl');
    this.map = new Map();
    this.written = 0;
    fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.file)) return;
    let lines = 0;
    for (const line of fs.readFileSync(this.file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      lines++;
      try {
        const acc = JSON.parse(line);
        if (acc.deleted) this.map.delete(acc.uid); else this.map.set(acc.uid, acc);
      } catch (err) {}
    }
    if (lines > this.map.size) this.compact();
  }

  get(uid) { return this.map.get(uid) || null; }

  put(acc) {
    this.map.set(acc.uid, acc);
    if (++this.written > COMPACT_AFTER + this.map.size * 4) { this.compact(); return; }
    fs.appendFileSync(this.file, JSON.stringify(acc) + '\n');
  }

  remove(uid) {
    this.map.delete(uid);
    fs.appendFileSync(this.file, JSON.stringify({ uid, deleted: true }) + '\n');
  }

  compact() {
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, Array.from(this.map.values()).map(a => JSON.stringify(a) + '\n').join(''));
    fs.renameSync(tmp, this.file);
    this.written = 0;
  }
}

const hashOf = text => crypto.createHash('sha256').update(text).digest('hex');
const randomUid = () => '7' + String(crypto.randomInt(0, 100000000)).padStart(8, '0');
const cleanName = text => String(text == null ? '' : text).replace(/[\u0000-\u001f\u007f|{}=#<>]/g, '').trim().slice(0, 12).trim() || 'Первопроходец';

const cleanText = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f|{}=#<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanKey = v => (typeof v === 'string' && /^[A-Za-z0-9_:-]{1,40}$/.test(v) ? v : null);
const cleanInt = (v, min, max) => (Number.isInteger(v) && v >= min && v <= max ? v : min);
const listOf = (v, n, fn) => (Array.isArray(v) ? v.slice(0, n).map(fn) : []);

function cleanRef(r) {
  const k = r && typeof r === 'object' ? cleanKey(r.k) : null;
  return k ? { k, o: cleanKey(r.o), lvl: cleanInt(r.lvl, 0, 999), eid: cleanInt(r.eid, 0, 6) } : null;
}

function cleanCard(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const bday = raw.bday && typeof raw.bday === 'object' && cleanInt(raw.bday.d, 0, 31) && cleanInt(raw.bday.m, 0, 12) ? { d: raw.bday.d, m: raw.bday.m } : null;
  return {
    name: cleanName(raw.name), gender: raw.gender === 'f' ? 'f' : 'm', tl: cleanInt(raw.tl, 0, 999), avatar: cleanRef(raw.avatar), stage: cleanRef(raw.stage), sign: cleanText(raw.sign, 40), bday,
    show: listOf(raw.show, 3, cleanRef), comp: listOf(raw.comp, 5, cleanRef),
    merits: listOf(raw.merits, 10, m => ({ id: cleanKey(m && m.id), open: !!(m && m.open), value: cleanText(m && m.value, 24) })).filter(m => m.id),
    coll: listOf(raw.coll, 10, m => ({ id: cleanKey(m && m.id), got: cleanInt(m && m.got, 0, 99999), total: cleanInt(m && m.total, 0, 99999) })).filter(m => m.id),
    log: listOf(raw.log, 5, e => ({ at: cleanInt(e && e.at, 0, 9007199254740991), text: cleanText(e && e.text, 70) }))
  };
}

function cleanExpress(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = r => (Array.isArray(r) && cleanKey(r[0]) ? [r[0], cleanInt(r[1], 0, 999), cleanInt(r[2], 0, 6), cleanKey(r[3])] : null);
  return { flags: listOf(raw.flags, 400, cleanKey).filter(Boolean), party: listOf(raw.party, 4, cleanKey).filter(Boolean), roster: listOf(raw.roster, 200, row).filter(Boolean), record: cleanKey(raw.record), lead: cleanRef(raw.lead) };
}

function withSocial(acc) {
  if (!acc.friends) Object.assign(acc, { friends: [], favs: [], reqIn: [], reqOut: [], blocks: [], recent: [], settings: { reqs: 'all', guests: 'friends' }, card: null });
  if (!acc.book) Object.assign(acc, { book: [], gifts: [], giftLog: null, awayGuests: [], express: null });
  return acc;
}

function stubOf(acc) {
  const c = acc.card || {};
  return { uid: acc.uid, name: c.name || 'Первопроходец', gender: c.gender || 'm', tl: c.tl || 0, avatar: c.avatar || null };
}

function shortOf(acc) {
  const c = acc.card || {};
  return Object.assign(stubOf(acc), { sign: c.sign || '', show: c.show || [], merits: c.merits || [], expr: !!acc.express });
}

const without = (list, v) => { const i = list.indexOf(v); if (i >= 0) list.splice(i, 1); };

function clientIp(req) {
  return String(req.headers['cf-connecting-ip'] || req.socket.remoteAddress || '');
}

function isLocal(req) {
  return !req.headers['cf-connecting-ip'] && /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(String(req.headers.host || ''));
}

function createServer(config) {
  const conns = new Set(), perIp = new Map(), clients = new Map(), tables = new Map(), visits = new Map(), newByIp = new Map();
  const accounts = new Accounts(config.dataDir);
  const desyncFile = path.join(config.dataDir, 'desync.jsonl');
  const now = () => config.now();
  const say = (client, o) => client.ws.send(JSON.stringify(o));

  function appendCapped(file, entry) {
    const line = JSON.stringify(entry) + '\n';
    let size = 0;
    try { size = fs.statSync(file).size; } catch (err) { size = 0; }
    if (size + line.length > config.maxLogFile) return false;
    fs.appendFileSync(file, line);
    return true;
  }

  function tableView(t) {
    return {
      op: 'table', code: t.code, open: t.open, diff: t.diff, state: t.state, host: t.host, sim: t.sim, ver: t.ver, seed: t.seed, n: t.n, turnMs: config.turnMs, ticks: config.turnTicks,
      paused: t.paused ? { by: t.paused.by, left: Math.max(0, t.paused.until - now()), resume: t.paused.resume ? Math.max(0, t.paused.resume - now()) : null, count: t.seats.map(s => (s ? s.pauses : 0)), others: Math.max(0, t.paused.at + config.pauseOthers - now()) } : null,
      seats: t.seats.map(s => {
        if (!s) return null;
        const acc = accOf(s.uid), stub = acc ? stubOf(acc) : {};
        return { uid: s.uid, name: s.name, ready: s.ready, online: !!s.client, away: s.away, left: s.left, pauses: s.pauses, avatar: stub.avatar || null, gender: stub.gender || 'm', tl: stub.tl || 0 };
      })
    };
  }

  function tableToAll(t, o) {
    const text = JSON.stringify(o);
    for (const s of t.seats) if (s && s.client) s.client.ws.send(text);
  }

  function tablesChanged(t) { tableToAll(t, tableView(t)); }

  function pickHost(t) {
    const cur = t.seats[t.host];
    if (cur && cur.client) return;
    const live = t.seats.findIndex(s => s && s.client);
    t.host = live >= 0 ? live : t.seats.findIndex(Boolean);
  }

  function dropTable(t) {
    tableToAll(t, { op: 'tableGone', code: t.code });
    for (const s of t.seats) if (s && s.client) { s.client.table = null; s.client.seat = null; }
    tables.delete(t.code);
  }

  function freeSeat(t, p) {
    const s = t.seats[p];
    if (s && s.client) { s.client.table = null; s.client.seat = null; }
    t.seats[p] = null;
    if (!t.seats.some(Boolean)) { dropTable(t); return; }
    pickHost(t);
    tablesChanged(t);
  }

  function seatPlayer(t, p, client, name) {
    const plain = accounts.get(client.uid) && accounts.get(client.uid).plainName;
    t.seats[p] = { uid: client.uid, name: cleanName(plain ? '' : name), ready: false, client, away: false, left: false, pauses: 0, offAt: 0, rateAt: 0, rateN: 0, sayAt: 0, markAt: 0 };
    client.table = t;
    client.seat = p;
  }

  function leaveTable(client, keep) {
    const t = client.table;
    if (!t) return;
    const p = client.seat, s = t.seats[p];
    client.table = null;
    client.seat = null;
    if (!s || s.client !== client) return;
    if (t.state === 'run') {
      s.client = null;
      s.offAt = now();
      s.left = !keep;
      if (!s.away) { s.away = true; t.pending.push({ t: 'away', on: true, p }); }
      pickHost(t);
      tablesChanged(t);
      return;
    }
    s.client = null;
    freeSeat(t, p);
  }

  function seatOffline(client) {
    const t = client.table;
    if (!t) return;
    const s = t.seats[client.seat];
    client.table = null;
    client.seat = null;
    if (!s || s.client !== client) return;
    s.client = null;
    s.offAt = now();
    pickHost(t);
    tablesChanged(t);
  }

  function closeTurn(t) {
    t.n++;
    const cmds = t.pending;
    t.pending = [];
    if (cmds.length) {
      t.log.push([t.n].concat(cmds));
      t.sentN = t.n;
      tableToAll(t, { op: 't', n: t.n, c: cmds });
    } else if (t.n - t.sentN >= config.emptyEvery) flushTurns(t);
  }

  function flushTurns(t) {
    if (t.n === t.sentN) return;
    t.sentN = t.n;
    tableToAll(t, { op: 't', n: t.n });
  }

  function pumpTable(t, at) {
    const dt = at - t.lastAt;
    t.lastAt = at;
    for (let p = 0; p < t.seats.length; p++) {
      const s = t.seats[p];
      if (!s || s.client) continue;
      if (t.state === 'lobby' && at - s.offAt >= config.awayAfter) { freeSeat(t, p); if (!tables.has(t.code)) return; continue; }
      if (t.state === 'run' && !s.away && at - s.offAt >= config.awayAfter) { s.away = true; t.pending.push({ t: 'away', on: true, p }); tablesChanged(t); }
    }
    if (t.seats.every(s => !s || s.left)) { dropTable(t); return; }
    if (t.seats.every(s => !s || !s.client)) {
      if (at - t.seats.reduce((m, s) => (s ? Math.max(m, s.offAt) : m), 0) >= (t.state === 'done' ? config.awayAfter : config.tableIdle)) dropTable(t);
      return;
    }
    if (t.state !== 'run') return;
    if (t.paused) {
      const by = t.seats[t.paused.by];
      if (!t.paused.resume && (at >= t.paused.until || !by || (!by.client && at - by.offAt >= config.awayAfter))) { t.paused.resume = at + config.pauseCountdown; tablesChanged(t); }
      if (!t.paused.resume || at < t.paused.resume) return;
      t.paused = null;
      tablesChanged(t);
      return;
    }
    if (dt < 0 || dt > MAX_STALL) return;
    t.acc += dt;
    while (t.acc >= config.turnMs) { t.acc -= config.turnMs; closeTurn(t); }
  }

  function pump(at = now()) {
    pumpVisits(at);
    for (const t of Array.from(tables.values())) {
      try { pumpTable(t, at); } catch (err) { console.error('net98 table', t.code, err); dropTable(t); }
    }
  }

  function markSeen(uid) {
    const acc = accounts.get(uid);
    if (!acc) return;
    const at = now(), stale = at - acc.seen > HOUR;
    acc.seen = at;
    if (!stale) return;
    try { accounts.put(acc); } catch (err) { console.error('net98 seen', err); }
  }

  function noteHash(t, p, n, h) {
    if (!Number.isInteger(n) || typeof h !== 'string' || h.length > 16) return;
    const seen = t.hashes.get(n) || new Map();
    seen.set(p, h);
    t.hashes.set(n, seen);
    if (t.hashes.size > 64) t.hashes.delete(t.hashes.keys().next().value);
    const online = t.seats.map((s, i) => (s && s.client && !s.away ? i : -1)).filter(i => i >= 0);
    if (online.length < 2 || !online.every(i => seen.has(i))) return;
    t.hashes.delete(n);
    const count = new Map();
    for (const i of online) count.set(seen.get(i), (count.get(seen.get(i)) || 0) + 1);
    if (count.size === 1) return;
    const ranked = Array.from(count.entries()).sort((a, b) => b[1] - a[1]), tied = ranked[0][1] === ranked[1][1];
    appendCapped(desyncFile, { at: new Date().toISOString(), code: t.code, n, sim: t.sim, seats: online.map(i => ({ p: i, h: seen.get(i), ver: t.seats[i].client.ver, src: t.seats[i].client.src })) });
    for (const i of online) if (tied || seen.get(i) !== ranked[0][0]) say(t.seats[i].client, { op: 'desync', n });
  }

  function tableOp(client, msg, op) {
    const t = client.table, p = client.seat, fail = code => say(client, { op: 'tableError', code });
    switch (op) {
      case 'tableNew': {
        if (client.table) leaveTable(client);
        if (tables.size >= config.tablesMax) { fail('busy'); return; }
        let code = '';
        do { code = Array.from({ length: 4 }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join(''); } while (tables.has(code));
        const nt = { code, open: !!msg.open, diff: DIFFS.includes(msg.diff) ? msg.diff : 'normal', state: 'lobby', host: 0, sim: client.sim, ver: client.ver, seed: null, n: 0, sentN: 0, lastAt: now(), acc: 0, log: [], pending: [], paused: null, hashes: new Map(), seats: new Array(SEATS).fill(null) };
        tables.set(code, nt);
        seatPlayer(nt, 0, client, msg.name);
        tablesChanged(nt);
        return;
      }
      case 'tableList':
        say(client, { op: 'tables', list: Array.from(tables.values()).filter(x => x.open && x.state === 'lobby').map(x => ({ code: x.code, host: x.seats[x.host] ? x.seats[x.host].name : '', hostUid: x.seats[x.host] ? x.seats[x.host].uid : '', diff: x.diff, seats: x.seats.filter(Boolean).length, sim: x.sim, ver: x.ver })) });
        return;
      case 'tableJoin': {
        const nt = tables.get(String(msg.code || '').toUpperCase());
        if (!nt) { fail('none'); return; }
        const mine = nt.seats.findIndex(s => s && s.uid === client.uid && !s.left);
        if (mine >= 0) { rejoin(client, nt, mine, 0); return; }
        if (nt.state !== 'lobby') { fail('started'); return; }
        if (nt.sim !== client.sim) { say(client, { op: 'tableError', code: 'sim', ver: nt.ver }); return; }
        const free = nt.seats.indexOf(null);
        if (free < 0) { fail('full'); return; }
        if (client.table) leaveTable(client);
        seatPlayer(nt, free, client, msg.name);
        tablesChanged(nt);
        return;
      }
      case 'tableBack': {
        const nt = tables.get(String(msg.code || '').toUpperCase()), mine = nt ? nt.seats.findIndex(s => s && s.uid === client.uid && !s.left) : -1;
        if (mine < 0) { fail('none'); return; }
        rejoin(client, nt, mine, Number(msg.since) || 0);
        return;
      }
      default:
    }
    if (!t) {
      if (op !== 'cmd' && op !== 'hash' && op !== 'say' && op !== 'mark') fail('none');
      return;
    }
    switch (op) {
      case 'tableLeave':
        leaveTable(client, !!msg.keep);
        say(client, msg.keep ? { op: 'tableGone', code: t.code, keep: true } : { op: 'tableGone', code: t.code });
        return;
      case 'tableSet':
        if (p !== t.host || t.state !== 'lobby') { fail('host'); return; }
        if (DIFFS.includes(msg.diff)) t.diff = msg.diff;
        if (msg.open != null) t.open = !!msg.open;
        tablesChanged(t);
        return;
      case 'tableReady':
        if (t.state !== 'lobby') return;
        t.seats[p].ready = !!msg.on;
        tablesChanged(t);
        return;
      case 'tableKick': {
        if (p !== t.host || t.state !== 'lobby' || !Number.isInteger(msg.seat) || msg.seat === p || !t.seats[msg.seat]) { fail('host'); return; }
        const s = t.seats[msg.seat];
        if (s.client) say(s.client, { op: 'tableGone', code: t.code, kicked: true });
        freeSeat(t, msg.seat);
        return;
      }
      case 'tableStart': {
        if (p !== t.host || t.state !== 'lobby') { fail('host'); return; }
        const seated = t.seats.filter(Boolean);
        if (seated.length < 2 || !t.seats.every((s, i) => !s || (s.client && (i === t.host || s.ready)))) { fail('ready'); return; }
        const host = t.seats[t.host];
        t.seats = seated.concat(new Array(SEATS - seated.length).fill(null));
        t.host = t.seats.indexOf(host);
        seated.forEach((s, i) => { s.client.seat = i; });
        noteRecent(seated.map(s => s.uid));
        t.state = 'run'; t.seed = 1 + crypto.randomInt(1000000000); t.lastAt = now(); t.acc = 0; t.n = 0; t.sentN = 0; t.log = []; t.pending = []; t.paused = null;
        tablesChanged(t);
        return;
      }
      case 'tableOver':
        if (t.state === 'run') { flushTurns(t); t.state = 'done'; tablesChanged(t); }
        return;
      case 'tableAgain':
        if (t.state !== 'done') return;
        t.state = 'lobby'; t.seed = null; t.n = 0; t.sentN = 0; t.log = []; t.pending = []; t.paused = null; t.hashes = new Map();
        t.seats.forEach((s, i) => {
          if (!s) return;
          if (!s.client) t.seats[i] = null;
          else Object.assign(s, { ready: false, away: false, left: false, pauses: 0 });
        });
        pickHost(t);
        tablesChanged(t);
        return;
      case 'cmd': {
        if (t.state !== 'run' || t.paused || !msg.c || typeof msg.c !== 'object' || Array.isArray(msg.c) || msg.c.t === 'away') return;
        const s = t.seats[p], at = now();
        if (at - s.rateAt >= 1000) { s.rateAt = at; s.rateN = 0; }
        if (++s.rateN > config.cmdRate || JSON.stringify(msg.c).length > config.cmdSize) return;
        t.pending.push(Object.assign({}, msg.c, { p }));
        return;
      }
      case 'hash':
        if (t.state === 'run') noteHash(t, p, msg.n, msg.h);
        return;
      case 'pause': {
        if (t.state !== 'run') return;
        const at = now();
        if (msg.on) {
          if (t.paused || (t.open && t.seats[p].pauses >= config.pauseCount)) { fail('pause'); return; }
          t.seats[p].pauses++;
          flushTurns(t);
          t.paused = { by: p, at, until: at + (t.open ? config.pauseOpen : config.pauseClosed), resume: null };
        } else {
          if (!t.paused || t.paused.resume) return;
          if (t.paused.by !== p && at - t.paused.at < config.pauseOthers) { fail('pauseWait'); return; }
          t.paused.resume = at + config.pauseCountdown;
        }
        tablesChanged(t);
        return;
      }
      case 'say': {
        const s = t.seats[p], at = now();
        if (t.state !== 'run' || !Number.isInteger(msg.id) || msg.id < 0 || msg.id >= PHRASES || at - s.sayAt < config.signalGap) return;
        s.sayAt = at;
        tableToAll(t, { op: 'say', p, id: msg.id });
        return;
      }
      case 'mark': {
        const s = t.seats[p], at = now(), inField = v => typeof v === 'number' && v >= 0 && v <= FIELD_MAX;
        if (t.state !== 'run' || !inField(msg.x) || !inField(msg.y) || at - s.markAt < config.signalGap) return;
        s.markAt = at;
        tableToAll(t, Number.isInteger(msg.id) ? { op: 'mark', p, x: msg.x, y: msg.y, id: msg.id } : { op: 'mark', p, x: msg.x, y: msg.y });
        return;
      }
      default:
    }
  }

  function rejoin(client, t, p, since) {
    const s = t.seats[p];
    if (s.client && s.client !== client) { const old = s.client; old.table = null; old.seat = null; }
    if (client.table && client.table !== t) leaveTable(client);
    s.client = client;
    client.table = t;
    client.seat = p;
    if (s.away) { s.away = false; t.pending.push({ t: 'away', on: false, p }); }
    pickHost(t);
    tablesChanged(t);
    if (t.state !== 'lobby') client.ws.send(JSON.stringify({ op: 'log', upto: t.n, turns: t.log.filter(e => e[0] > since) }));
  }

  function accOf(uid) {
    const acc = typeof uid === 'string' ? accounts.get(uid) : null;
    return acc ? withSocial(acc) : null;
  }

  function presenceOf(acc) {
    const on = clients.get(acc.uid);
    return { on: !!on, status: on ? on.status : null, ago: on ? 0 : Math.max(0, now() - (acc.seen || 0)) };
  }

  function rowOf(me, acc) {
    return Object.assign(shortOf(acc), presenceOf(acc), { fav: me.favs.includes(acc.uid) });
  }

  function snapshot(acc) {
    const stubs = list => list.map(accOf).filter(Boolean).map(stubOf);
    return {
      op: 'friends', list: acc.friends.map(accOf).filter(Boolean).map(f => rowOf(acc, f)), in: stubs(acc.reqIn), out: stubs(acc.reqOut), blocks: stubs(acc.blocks),
      recent: acc.recent.map(r => { const other = accOf(r.uid); return other && !other.blocks.includes(acc.uid) ? Object.assign(stubOf(other), { at: r.at }) : null; }).filter(Boolean),
      settings: acc.settings, max: config.friendMax, favMax: config.favMax
    };
  }

  function pushSocial(acc) {
    const c = clients.get(acc.uid);
    if (c && c.social) say(c, snapshot(acc));
  }

  function tellFriends(acc, message) {
    for (const uid of acc.friends) {
      const c = clients.get(uid);
      if (c && c.social) say(c, message);
    }
  }

  function presenceChanged(acc) {
    tellFriends(acc, Object.assign({ op: 'presence', uid: acc.uid }, presenceOf(acc)));
  }

  function noteRecent(uids) {
    for (const uid of uids) {
      const acc = accOf(uid);
      if (!acc) continue;
      for (const other of uids) {
        if (other === uid) continue;
        acc.recent = [{ uid: other, at: now() }].concat(acc.recent.filter(r => r.uid !== other)).slice(0, config.recentMax);
      }
      accounts.put(acc);
      pushSocial(acc);
    }
  }

  function breakTies(a, b) {
    without(a.friends, b.uid); without(b.friends, a.uid);
    without(a.favs, b.uid); without(b.favs, a.uid);
    without(a.reqIn, b.uid); without(b.reqIn, a.uid);
    without(a.reqOut, b.uid); without(b.reqOut, a.uid);
  }

  function makeFriends(a, b) {
    without(a.reqIn, b.uid); without(a.reqOut, b.uid); without(b.reqIn, a.uid); without(b.reqOut, a.uid);
    a.friends.push(b.uid); b.friends.push(a.uid);
  }

  function saveBoth(a, b) {
    accounts.put(a); accounts.put(b);
    pushSocial(a); pushSocial(b);
  }

  function hostHome(uid) {
    const c = clients.get(uid);
    return c && !c.visit ? c : null;
  }

  function roomMembers(hostUid) {
    const host = hostHome(hostUid);
    return Array.from(visits.get(hostUid) || []).concat(host ? [host] : []);
  }

  function greetRoom(client, me) {
    const peer = visits.has(me.uid) ? peerOf(client, true) : null;
    for (const guest of visits.get(me.uid) || []) {
      say(client, { op: 'peerIn', peer: peerOf(guest, false) });
      say(guest, { op: 'peerIn', peer });
    }
  }

  function peerOf(client, isHost) {
    const acc = accOf(client.uid), stub = acc ? stubOf(acc) : {}, pos = client.pos || {};
    return { uid: client.uid, name: stub.name, gender: stub.gender, host: isHost, look: isHost ? (acc && acc.express ? acc.express.lead : null) : client.visit.look, m: pos.m || null, x: pos.x, y: pos.y, d: pos.d, w: pos.w };
  }

  function leaveVisit(client) {
    const v = client.visit;
    if (!v) return;
    client.visit = null;
    client.pos = null;
    const room = visits.get(v.host);
    if (!room) return;
    room.delete(client);
    if (!room.size) visits.delete(v.host);
    for (const other of roomMembers(v.host)) say(other, { op: 'peerOut', uid: v.uid });
  }

  function endVisits(hostUid, why) {
    for (const guest of Array.from(visits.get(hostUid) || [])) {
      say(guest, { op: 'visitEnd', why });
      leaveVisit(guest);
    }
  }

  function pushBook(acc) {
    for (const member of roomMembers(acc.uid)) say(member, { op: 'book', uid: acc.uid, list: acc.book });
  }

  function dayOf(at) { return Math.floor((at - DAY_SHIFT) / DAY); }

  function giftLogOf(acc, day) {
    if (!acc.giftLog || acc.giftLog.day !== day) acc.giftLog = { day, n: 0, pairs: [] };
    return acc.giftLog;
  }

  function sendGift(acc, gift) {
    const c = clients.get(acc.uid);
    if (c && c.social) say(c, { op: 'gift', id: gift.id, credits: gift.credits, from: gift.from });
  }

  function grantGifts(a, b, at) {
    const day = dayOf(at), logA = giftLogOf(a, day), logB = giftLogOf(b, day);
    if (logA.pairs.includes(b.uid) || logB.pairs.includes(a.uid)) return;
    logA.pairs.push(b.uid);
    logB.pairs.push(a.uid);
    for (const [to, from, log] of [[a, b, logA], [b, a, logB]]) {
      if (log.n >= config.giftDaily) continue;
      log.n++;
      const gift = { id: crypto.randomBytes(8).toString('hex'), credits: config.giftCredits, from: stubOf(from).name, at };
      to.gifts.push(gift);
      sendGift(to, gift);
    }
    accounts.put(a);
    accounts.put(b);
  }

  function pumpVisits(at) {
    for (const [hostUid, room] of visits) for (const guest of room) {
      const v = guest.visit;
      if (!v || v.gifted || at - v.at < config.giftStay) continue;
      v.gifted = true;
      const a = accOf(guest.uid), b = accOf(hostUid);
      if (a && b) grantGifts(a, b, at);
    }
  }

  function visitOp(client, msg, op, me, at, fail) {
    const no = code => say(client, { op: 'visitNo', code });
    switch (op) {
      case 'express': {
        if (JSON.stringify(msg.express || null).length > config.expressSize) { fail('big'); return; }
        if (at - client.expressAt < config.expressGap) { fail('soon'); return; }
        const express = cleanExpress(msg.express);
        if (!express) { fail('big'); return; }
        const first = !me.express, record = !first && me.express.record !== express.record;
        client.expressAt = at;
        me.express = express;
        accounts.put(me);
        if (first) tellFriends(me, { op: 'row', row: Object.assign(shortOf(me), presenceOf(me)) });
        if (record) for (const guest of visits.get(me.uid) || []) say(guest, { op: 'visitRecord', record: express.record });
        return;
      }
      case 'visitEnter': {
        const host = accOf(msg.uid);
        if (!host || host.uid === me.uid || host.blocks.includes(me.uid)) { no('none'); return; }
        if (!me.friends.includes(host.uid)) { no('notFriend'); return; }
        if (host.settings.guests !== 'friends') { no('closed'); return; }
        if (!host.express) { no('noExpress'); return; }
        const room = visits.get(host.uid) || new Set();
        if (room.size >= config.guestMax && !room.has(client)) { no('full'); return; }
        leaveVisit(client);
        for (const guest of visits.get(me.uid) || []) say(guest, { op: 'peerOut', uid: me.uid });
        client.visit = { uid: me.uid, host: host.uid, at, gifted: false, look: cleanRef(msg.look) };
        client.pos = null;
        const on = hostHome(host.uid), peers = Array.from(room).map(g => peerOf(g, false)).concat(on ? [peerOf(on, true)] : []);
        room.add(client);
        visits.set(host.uid, room);
        say(client, { op: 'visit', uid: host.uid, name: stubOf(host).name, gender: stubOf(host).gender, sign: (host.card && host.card.sign) || '', on: !!on, express: host.express, book: host.book, peers });
        const peer = peerOf(client, false);
        for (const other of roomMembers(host.uid)) if (other !== client) say(other, { op: 'peerIn', peer });
        if (!on) {
          host.awayGuests = [{ uid: me.uid, name: stubOf(me).name }].concat(host.awayGuests.filter(g => g.uid !== me.uid)).slice(0, config.awayMax);
          accounts.put(host);
        }
        return;
      }
      case 'visitLeave':
        leaveVisit(client);
        greetRoom(client, me);
        return;
      case 'pos': {
        const hostUid = client.visit ? client.visit.host : client.uid;
        if (at - (client.posAt || 0) >= 1000) { client.posAt = at; client.posN = 0; }
        if (++client.posN > config.posRate) return;
        const m = cleanKey(msg.m);
        client.pos = m ? { m, x: cleanInt(msg.x, 0, 500), y: cleanInt(msg.y, 0, 500), d: FACING.includes(msg.d) ? msg.d : 'down', w: !!msg.w } : null;
        const out = Object.assign({ op: 'pos', uid: client.uid, m: null }, client.pos);
        for (const other of roomMembers(hostUid)) if (other !== client) say(other, out);
        return;
      }
      case 'visitSay': {
        const hostUid = client.visit ? client.visit.host : client.uid;
        if (!Number.isInteger(msg.id) || msg.id < 0 || msg.id >= VISIT_PHRASES || at - (client.sayAt || 0) < config.signalGap) return;
        client.sayAt = at;
        for (const other of roomMembers(hostUid)) say(other, { op: 'visitSay', uid: client.uid, id: msg.id });
        return;
      }
      case 'bookSign': {
        const host = client.visit ? accOf(client.visit.host) : null;
        if (!host) { fail('none'); return; }
        if (host.book.some(e => e.uid === me.uid && dayOf(e.at) === dayOf(at))) { fail('bookDay'); return; }
        const text = me.plainName ? '' : cleanText(msg.text, 40), wish = Number.isInteger(msg.id) && msg.id >= 0 && msg.id < WISHES ? msg.id : null;
        if (!text && wish == null) { fail('bookEmpty'); return; }
        const entry = { at, uid: me.uid, name: stubOf(me).name };
        if (text) entry.text = text; else entry.id = wish;
        host.book = [entry].concat(host.book).slice(0, config.bookMax);
        accounts.put(host);
        pushBook(host);
        return;
      }
      case 'bookDel':
        me.book = me.book.filter(e => !(e.at === msg.at && e.uid === msg.uid));
        accounts.put(me);
        pushBook(me);
        return;
      case 'giftAck':
        me.gifts = me.gifts.filter(g => g.id !== msg.id);
        accounts.put(me);
        return;
      default:
    }
  }

  function welcomeBack(client, me, at) {
    me.gifts = me.gifts.filter(g => at - g.at < config.giftKeep);
    for (const gift of me.gifts) sendGift(me, gift);
    if (me.book.length) say(client, { op: 'book', uid: me.uid, list: me.book });
    if (me.awayGuests.length) {
      say(client, { op: 'awayGuests', names: me.awayGuests.map(g => g.name) });
      me.awayGuests = [];
      accounts.put(me);
    }
    greetRoom(client, me);
  }

  function forgetAccount(acc) {
    const touched = new Set();
    for (const list of [acc.friends, acc.reqIn, acc.reqOut]) for (const uid of list) touched.add(uid);
    for (const other of accounts.map.values()) {
      if (!other.friends) continue;
      if (other.blocks.includes(acc.uid) || other.recent.some(r => r.uid === acc.uid) || (other.book || []).some(e => e.uid === acc.uid)) touched.add(other.uid);
    }
    for (const uid of touched) {
      const other = accOf(uid);
      if (!other) continue;
      breakTies(other, acc);
      without(other.blocks, acc.uid);
      other.recent = other.recent.filter(r => r.uid !== acc.uid);
      other.book = other.book.filter(e => e.uid !== acc.uid);
      other.awayGuests = other.awayGuests.filter(g => g.uid !== acc.uid);
      accounts.put(other);
      pushSocial(other);
    }
  }

  function socialOp(client, msg, op) {
    const me = accOf(client.uid), at = now(), fail = code => say(client, { op: 'socialError', code, uid: typeof msg.uid === 'string' ? msg.uid.slice(0, 9) : undefined });
    if (!me) return;
    switch (op) {
      case 'friends':
        client.social = true;
        say(client, snapshot(me));
        welcomeBack(client, me, at);
        return;
      case 'express': case 'visitEnter': case 'visitLeave': case 'pos': case 'visitSay': case 'bookSign': case 'bookDel': case 'giftAck':
        visitOp(client, msg, op, me, at, fail);
        return;
      case 'card': {
        if (JSON.stringify(msg.card || null).length > config.cardSize) { fail('big'); return; }
        if (at - client.cardAt < config.cardGap) { fail('soon'); return; }
        const card = cleanCard(msg.card);
        if (!card) { fail('big'); return; }
        client.cardAt = at;
        me.card = me.plainName ? Object.assign(card, { name: cleanName(''), sign: '' }) : card;
        accounts.put(me);
        tellFriends(me, { op: 'row', row: Object.assign(shortOf(me), presenceOf(me)) });
        return;
      }
      case 'cardOf': {
        const other = accOf(msg.uid);
        if (!other || !me.friends.includes(other.uid)) { fail('notFriend'); return; }
        say(client, { op: 'cardOf', uid: other.uid, card: other.card });
        return;
      }
      case 'find': {
        if (at - client.findAt < config.findGap) { fail('soon'); return; }
        client.findAt = at;
        const other = accOf(msg.uid);
        if (!other || other.blocks.includes(me.uid)) { say(client, { op: 'found', uid: typeof msg.uid === 'string' ? msg.uid.slice(0, 9) : '', ok: false }); return; }
        const rel = other.uid === me.uid ? 'self' : me.friends.includes(other.uid) ? 'friend' : me.reqOut.includes(other.uid) ? 'out' : me.reqIn.includes(other.uid) ? 'in' : me.blocks.includes(other.uid) ? 'blocked' : 'none';
        say(client, { op: 'found', uid: other.uid, ok: true, stub: stubOf(other), rel, open: other.settings.reqs === 'all' });
        return;
      }
      case 'req': {
        const other = accOf(msg.uid);
        if (!other || other.blocks.includes(me.uid)) { fail('none'); return; }
        if (other.uid === me.uid) { fail('self'); return; }
        if (me.blocks.includes(other.uid)) { fail('blocked'); return; }
        if (me.friends.includes(other.uid)) { fail('friend'); return; }
        if (me.friends.length >= config.friendMax) { fail('myFull'); return; }
        if (other.friends.length >= config.friendMax) { fail('theirFull'); return; }
        if (me.reqIn.includes(other.uid)) { makeFriends(me, other); saveBoth(me, other); return; }
        if (me.reqOut.includes(other.uid)) return;
        if (other.settings.reqs !== 'all') { fail('closed'); return; }
        if (other.reqIn.length >= config.reqMax || me.reqOut.length >= config.reqMax) { fail('theirFull'); return; }
        me.reqOut.push(other.uid);
        other.reqIn.push(me.uid);
        saveBoth(me, other);
        return;
      }
      case 'answer': {
        const other = accOf(msg.uid);
        if (!other || !me.reqIn.includes(other.uid)) { fail('none'); return; }
        without(me.reqIn, other.uid);
        without(other.reqOut, me.uid);
        if (msg.yes) {
          if (me.friends.length >= config.friendMax) { me.reqIn.push(other.uid); other.reqOut.push(me.uid); fail('myFull'); return; }
          if (other.friends.length >= config.friendMax) { saveBoth(me, other); fail('theirFull'); return; }
          makeFriends(me, other);
        }
        saveBoth(me, other);
        return;
      }
      case 'cancelReq': {
        const other = accOf(msg.uid);
        if (!other) { fail('none'); return; }
        without(me.reqOut, other.uid);
        without(other.reqIn, me.uid);
        saveBoth(me, other);
        return;
      }
      case 'unfriend': {
        const other = accOf(msg.uid);
        if (!other) { fail('none'); return; }
        breakTies(me, other);
        saveBoth(me, other);
        return;
      }
      case 'block': {
        const other = accOf(msg.uid);
        if (!other || other.uid === me.uid) { fail('none'); return; }
        if (me.blocks.includes(other.uid)) return;
        if (me.blocks.length >= config.blockMax) { fail('blockFull'); return; }
        breakTies(me, other);
        me.blocks.push(other.uid);
        me.recent = me.recent.filter(r => r.uid !== other.uid);
        saveBoth(me, other);
        {
          const guest = clients.get(other.uid);
          if (guest && guest.visit && guest.visit.host === me.uid) {
            say(guest, { op: 'visitEnd', why: 'closed' });
            leaveVisit(guest);
          }
        }
        return;
      }
      case 'unblock':
        if (typeof msg.uid === 'string') without(me.blocks, msg.uid);
        accounts.put(me);
        pushSocial(me);
        return;
      case 'fav': {
        const other = accOf(msg.uid);
        if (!other || !me.friends.includes(other.uid)) { fail('notFriend'); return; }
        if (msg.on && !me.favs.includes(other.uid)) {
          if (me.favs.length >= config.favMax) { fail('favFull'); return; }
          me.favs.push(other.uid);
        } else if (!msg.on) without(me.favs, other.uid);
        accounts.put(me);
        pushSocial(me);
        return;
      }
      case 'settings':
        if (msg.reqs === 'all' || msg.reqs === 'none') me.settings.reqs = msg.reqs;
        if (msg.guests === 'friends' || msg.guests === 'none') me.settings.guests = msg.guests;
        accounts.put(me);
        pushSocial(me);
        return;
      case 'invite': {
        const other = accOf(msg.uid), t = client.table, c = other && clients.get(other.uid), home = msg.kind === 'visit';
        if (!other || !me.friends.includes(other.uid)) { fail('notFriend'); return; }
        if (home && !me.express) { fail('noExpress'); return; }
        if (!home && (!t || t.state !== 'lobby')) { fail('noTable'); return; }
        if (!c || !c.social) { fail('offline'); return; }
        if (at - client.inviteAt < config.inviteGap) { fail('soon'); return; }
        client.inviteAt = at;
        say(c, Object.assign({ op: 'invite', from: me.uid, name: stubOf(me).name, avatar: stubOf(me).avatar, gender: stubOf(me).gender }, home ? { kind: 'visit' } : { kind: 'table', code: t.code, diff: t.diff }));
        say(client, { op: 'invited', uid: other.uid });
        return;
      }
      default:
    }
  }

  function hello(client, msg) {
    if (client.uid) { say(client, { op: 'error', code: 'hello' }); return; }
    if (msg.proto !== PROTO) { say(client, { op: 'error', code: 'proto' }); client.ws.close(CLOSE_PROTO); return; }
    const uidIn = msg.uid, secret = msg.secret;
    if (typeof uidIn !== 'string' || typeof secret !== 'string' || !UID_PATTERN.test(uidIn) || !SECRET_PATTERN.test(secret)) { say(client, { op: 'error', code: 'secret' }); client.ws.close(CLOSE_SECRET); return; }
    const hash = hashOf(secret);
    let uid = uidIn, acc = accounts.get(uid);
    if (msg.code && !acc) { say(client, { op: 'error', code: 'secret' }); client.ws.close(CLOSE_SECRET); return; }
    if (acc && acc.hash !== hash) {
      if (!msg.fresh) { say(client, { op: 'error', code: 'secret' }); client.ws.close(CLOSE_SECRET); return; }
      do { uid = randomUid(); } while (accounts.get(uid));
      acc = null;
    }
    if (acc && acc.banned) { say(client, { op: 'error', code: 'banned' }); client.ws.close(CLOSE_BANNED); return; }
    if (!acc) {
      const at = now(), box = newByIp.get(client.ip);
      if (box && at - box.at < HOUR && box.n >= config.newPerHour) { say(client, { op: 'error', code: 'limit' }); client.ws.close(1008); return; }
      if (!box || at - box.at >= HOUR) newByIp.set(client.ip, { at, n: 1 }); else box.n++;
      acc = withSocial({ uid, hash, created: new Date(at).toISOString(), seen: at, banned: false });
      accounts.put(acc);
    }
    const old = clients.get(uid);
    if (old && old !== client) { say(old, { op: 'replaced' }); old.uid = null; clients.delete(uid); old.ws.close(CLOSE_REPLACED); }
    client.uid = uid;
    client.sim = String(msg.sim || '').slice(0, 16);
    client.ver = String(msg.ver || '').slice(0, 16);
    client.src = String(msg.src || '').slice(0, 16);
    clients.set(uid, client);
    const mine = Array.from(tables.values()).find(t => t.state !== 'done' && t.seats.some(s => s && s.uid === uid && !s.left));
    say(client, { op: 'me', uid, table: mine ? mine.code : null });
    presenceChanged(withSocial(accounts.get(uid)));
  }

  function route(client, text) {
    try { routeMessage(client, text); } catch (err) { console.error('net98 route', err); say(client, { op: 'error', code: 'server' }); }
  }

  function routeMessage(client, text) {
    const at = now();
    if (at - client.rateAt >= 1000) { client.rateAt = at; client.rateN = 0; }
    if (++client.rateN > config.rate) { client.ws.close(1008); return; }
    let msg;
    try { msg = JSON.parse(text); } catch (err) { say(client, { op: 'error', code: 'json' }); return; }
    const op = msg && msg.op;
    switch (op) {
      case 'echo': client.ws.send(text); return;
      case 'hello': hello(client, msg); return;
      default:
    }
    if (typeof op !== 'string' || !op.length) { say(client, { op: 'error', code: 'op' }); return; }
    if (!client.uid) { say(client, { op: 'error', code: op.startsWith('table') || op === 'cmd' || op === 'status' || op === 'deleteMe' ? 'hello' : 'op' }); return; }
    switch (op) {
      case 'status':
        if (JSON.stringify(msg.s || null).length <= config.statusSize) {
          client.status = msg.s || null;
          presenceChanged(withSocial(accounts.get(client.uid)));
        }
        return;
      case 'friends': case 'card': case 'cardOf': case 'find': case 'req': case 'answer': case 'cancelReq': case 'unfriend': case 'block': case 'unblock': case 'fav': case 'settings': case 'invite': case 'express': case 'visitEnter': case 'visitLeave': case 'pos': case 'visitSay': case 'bookSign': case 'bookDel': case 'giftAck':
        socialOp(client, msg, op);
        return;
      case 'deleteMe': {
        leaveTable(client);
        leaveVisit(client);
        endVisits(client.uid, 'gone');
        for (const t of Array.from(tables.values())) { const p = t.seats.findIndex(s => s && s.uid === client.uid); if (p >= 0 && !t.seats[p].client) { t.seats[p].uid = ''; } }
        forgetAccount(withSocial(accounts.get(client.uid)));
        accounts.remove(client.uid);
        clients.delete(client.uid);
        client.uid = null;
        say(client, { op: 'deleted' });
        client.ws.close(CLOSE_DELETED);
        return;
      }
      case 'tableNew': case 'tableList': case 'tableJoin': case 'tableBack': case 'tableLeave': case 'tableSet': case 'tableReady': case 'tableKick': case 'tableStart': case 'tableOver': case 'tableAgain': case 'cmd': case 'hash': case 'pause': case 'say': case 'mark':
        tableOp(client, msg, op);
        return;
      default: say(client, { op: 'error', code: 'op' });
    }
  }

  function admin(req, url, json) {
    if (!isLocal(req)) { json(403, { error: 'local only' }); return; }
    const parts = url.slice((API + '/admin/').length).split('/');
    if (parts[0] === 'stats') {
      json(200, { accounts: accounts.map.size, online: clients.size, connections: conns.size, tables: Array.from(tables.values()).map(t => ({ code: t.code, state: t.state, open: t.open, n: t.n, seats: t.seats.filter(Boolean).length, log: t.log.length })) });
      return;
    }
    if (parts[0] === 'desync') {
      let lines = [];
      try { lines = fs.readFileSync(desyncFile, 'utf8').split('\n').filter(Boolean).slice(-50); } catch (err) { lines = []; }
      json(200, { desync: lines.map(line => JSON.parse(line)) });
      return;
    }
    const acc = accounts.get(parts[1] || '');
    if (!acc) { json(404, { error: 'no account' }); return; }
    if (parts[0] === 'ban' || parts[0] === 'unban') {
      acc.banned = parts[0] === 'ban';
      accounts.put(acc);
      const on = clients.get(acc.uid);
      if (acc.banned && on) { say(on, { op: 'error', code: 'banned' }); on.ws.close(CLOSE_BANNED); }
      json(200, { uid: acc.uid, banned: acc.banned });
      return;
    }
    if (parts[0] === 'rename' || parts[0] === 'unrename') {
      acc.plainName = parts[0] === 'rename';
      if (acc.plainName) {
        if (acc.card) Object.assign(acc.card, { name: cleanName(''), sign: '' });
        for (const other of accounts.map.values()) {
          if (!other.book || !other.book.some(e => e.uid === acc.uid)) continue;
          other.book = other.book.filter(e => e.uid !== acc.uid);
          accounts.put(other);
          pushBook(other);
        }
      }
      accounts.put(acc);
      tellFriends(withSocial(acc), { op: 'row', row: Object.assign(shortOf(acc), presenceOf(acc)) });
      json(200, { uid: acc.uid, plainName: acc.plainName });
      return;
    }
    if (parts[0] === 'book-clear') {
      withSocial(acc).book = [];
      accounts.put(acc);
      pushBook(acc);
      json(200, { uid: acc.uid, book: 0 });
      return;
    }
    json(404, { error: 'not found' });
  }

  const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    const json = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(body)); };
    if (req.method === 'GET' && url === API + '/ping') { json(200, { ok: true, v: 1 }); return; }
    if (url.startsWith(API + '/admin/')) { admin(req, url, json); return; }
    json(url === API ? 426 : 404, { error: url === API ? 'upgrade required' : 'not found' });
  });

  server.on('upgrade', (req, socket, head) => {
    const refuse = status => { socket.end('HTTP/1.1 ' + status + '\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'); };
    socket.on('error', () => {});
    const key = req.headers['sec-websocket-key'];
    if (req.url.split('?')[0] !== API) { refuse('404 Not Found'); return; }
    if (req.method !== 'GET' || String(req.headers.upgrade).toLowerCase() !== 'websocket' || !key || req.headers['sec-websocket-version'] !== '13') { refuse('400 Bad Request'); return; }
    const ip = clientIp(req), count = perIp.get(ip) || 0;
    if (count >= config.perIp) { refuse('429 Too Many Requests'); return; }
    perIp.set(ip, count + 1);
    const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
    const client = { ws: null, ip, uid: null, sim: '', ver: '', src: '', status: null, social: false, table: null, seat: null, rateAt: 0, rateN: 0, cardAt: -Infinity, findAt: -Infinity, inviteAt: -Infinity };
    client.ws = new WsConn(socket, {
      maxFrame: config.maxFrame,
      onMessage: text => route(client, text),
      onClose: () => {
        conns.delete(client);
        seatOffline(client);
        leaveVisit(client);
        if (client.uid) {
          markSeen(client.uid);
          if (clients.get(client.uid) === client) {
            clients.delete(client.uid);
            for (const guest of visits.get(client.uid) || []) say(guest, { op: 'peerOut', uid: client.uid });
            const gone = accounts.get(client.uid);
            if (gone) presenceChanged(withSocial(gone));
          }
        }
        const left = (perIp.get(ip) || 1) - 1;
        if (left) perIp.set(ip, left); else perIp.delete(ip);
      }
    });
    conns.add(client);
    if (head && head.length) client.ws.feed(head);
  });

  const sweep = setInterval(() => {
    const at = Date.now();
    for (const client of conns) {
      if (at - client.ws.lastSeen > config.deadAfter) client.ws.socket.destroy();
      else client.ws.ping();
    }
    for (const [ip, box] of newByIp) if (now() - box.at >= HOUR) newByIp.delete(ip);
  }, config.pingEvery);
  sweep.unref();
  const turns = config.timers ? setInterval(() => pump(), Math.max(5, config.turnMs / 3)) : null;
  if (turns) turns.unref();

  return {
    server,
    conns,
    perIp,
    clients,
    tables,
    accounts,
    pump,
    close() {
      clearInterval(sweep);
      if (turns) clearInterval(turns);
      for (const client of conns) client.ws.socket.destroy();
      return new Promise(resolve => server.close(resolve));
    }
  };
}

if (require.main === module) {
  const config = loadConfig();
  const app = createServer(config);
  app.server.listen(config.port, config.host, () => console.log('net98 on ' + config.host + ':' + app.server.address().port));
  const stop = () => app.close().then(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}

module.exports = { createServer, loadConfig, WsConn };
