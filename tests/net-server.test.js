const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const net = require('node:net');
const http = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');
const { createServer, loadConfig } = require('../tools/net/server.cjs');

console.log('--- Testing ether link server ---');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'net98-test-'));

async function boot(extra) {
  const config = Object.assign(loadConfig({ NET_DATA: dir, NET_PORT: '0' }), extra || {});
  const app = createServer(config);
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  const port = app.server.address().port;
  return { app, port, config, url: 'ws://127.0.0.1:' + port + '/api/net', http: 'http://127.0.0.1:' + port + '/api/net' };
}

function client(url) {
  const ws = new WebSocket(url), queue = [], waiters = [];
  const closed = new Promise(resolve => { ws.onclose = e => resolve(e.code); });
  ws.onmessage = e => { const m = JSON.parse(e.data); const w = waiters.shift(); if (w) w(m); else queue.push(m); };
  return {
    ws, closed,
    opened: new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; }),
    send: o => ws.send(typeof o === 'string' ? o : JSON.stringify(o)),
    next: () => (queue.length ? Promise.resolve(queue.shift()) : new Promise(resolve => waiters.push(resolve)))
  };
}

function rawClient(port, headers) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1');
    let buf = Buffer.alloc(0), upgraded = false, ready = null;
    const frames = [], waiters = [];
    socket.on('error', reject);
    socket.on('connect', () => socket.write('GET /api/net HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ' + crypto.randomBytes(16).toString('base64') + '\r\nSec-WebSocket-Version: 13\r\n' + (headers || '') + '\r\n'));
    socket.on('data', chunk => {
      buf = Buffer.concat([buf, chunk]);
      if (!upgraded) {
        const end = buf.indexOf('\r\n\r\n');
        if (end < 0) return;
        ready = buf.subarray(0, end).toString();
        buf = buf.subarray(end + 4);
        upgraded = true;
        resolve(api);
      }
      while (buf.length >= 2) {
        const n = buf[1] & 0x7f, at = n === 126 ? 4 : 2, len = n === 126 ? buf.readUInt16BE(2) : n;
        if (buf.length < at + len) break;
        const f = { op: buf[0] & 15, body: buf.subarray(at, at + len) };
        buf = buf.subarray(at + len);
        const w = waiters.shift();
        if (w) w(f); else frames.push(f);
      }
    });
    const frame = (first, payload, masked = true) => {
      const len = payload.length, head = len < 126 ? Buffer.from([first, (masked ? 0x80 : 0) | len]) : Buffer.from([first, (masked ? 0x80 : 0) | 126, len >> 8, len & 255]);
      if (!masked) return Buffer.concat([head, payload]);
      const mask = crypto.randomBytes(4), body = Buffer.from(payload);
      for (let i = 0; i < body.length; i++) body[i] ^= mask[i & 3];
      return Buffer.concat([head, mask, body]);
    };
    const api = {
      socket, frame,
      status: () => ready,
      write: b => socket.write(b),
      next: () => (frames.length ? Promise.resolve(frames.shift()) : new Promise(res => waiters.push(res)))
    };
  });
}

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('ping, and no measuring page any more', async () => {
  const s = await boot();
  const ping = await fetch(s.http + '/ping');
  assert.equal(ping.status, 200);
  assert.deepEqual(await ping.json(), { ok: true, v: 1 });
  assert.equal(ping.headers.get('cache-control'), 'no-store');
  assert.equal((await fetch(s.http + '/probe')).status, 404);
  assert.equal((await fetch(s.http)).status, 426);
  assert.equal((await fetch(s.http + '/other')).status, 404);
  await s.app.close();
});

test('echo keeps the text and handles a frame with a long length', async () => {
  const s = await boot();
  const c = client(s.url);
  await c.opened;
  c.send({ op: 'echo', i: 1, t: 2.5 });
  assert.deepEqual(await c.next(), { op: 'echo', i: 1, t: 2.5 });
  const pad = 'я'.repeat(20000);
  c.send({ op: 'echo', pad });
  assert.equal((await c.next()).pad, pad);
  c.ws.close();
  await c.closed;
  await s.app.close();
});

test('a frame over the limit closes with 1009', async () => {
  const s = await boot();
  const c = client(s.url);
  await c.opened;
  c.send({ op: 'echo', pad: 'x'.repeat(70000) });
  assert.equal(await c.closed, 1009);
  await s.app.close();
});

test('raw frames: bytes split, fragments, ping, unmasked, bad text', async () => {
  const s = await boot();
  const a = await rawClient(s.port);
  assert.match(a.status(), /101 Switching/);
  const whole = a.frame(0x81, Buffer.from('{"op":"echo","i":7}'));
  for (const byte of whole) { a.write(Buffer.from([byte])); await new Promise(r => setImmediate(r)); }
  assert.equal((await a.next()).body.toString(), '{"op":"echo","i":7}');
  a.write(Buffer.concat([a.frame(0x01, Buffer.from('{"op":"echo",')), a.frame(0x89, Buffer.from('hi')), a.frame(0x80, Buffer.from('"i":8}'))]));
  const pong = await a.next();
  assert.equal(pong.op, 10);
  assert.equal(pong.body.toString(), 'hi');
  assert.equal((await a.next()).body.toString(), '{"op":"echo","i":8}');
  a.write(a.frame(0x81, Buffer.from('{}'), false));
  const close = await a.next();
  assert.equal(close.op, 8);
  assert.equal(close.body.readUInt16BE(0), 1002);
  const b = await rawClient(s.port);
  b.write(b.frame(0x81, Buffer.from([0xff, 0xfe])));
  assert.equal((await b.next()).body.readUInt16BE(0), 1007);
  const c = await rawClient(s.port);
  c.write(c.frame(0x82, Buffer.from([1])));
  assert.equal((await c.next()).body.readUInt16BE(0), 1003);
  const d = await rawClient(s.port);
  d.write(d.frame(0x80, Buffer.from('x')));
  assert.equal((await d.next()).body.readUInt16BE(0), 1002);
  await s.app.close();
});

test('server pings and drops a silent client', async () => {
  const s = await boot({ pingEvery: 20, deadAfter: 120 });
  const a = await rawClient(s.port);
  assert.equal((await a.next()).op, 9);
  await new Promise(resolve => a.socket.on('close', resolve));
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(s.app.conns.size, 0);
  await s.app.close();
});

test('browser client keeps a session alive through pings', async () => {
  const s = await boot({ pingEvery: 20, deadAfter: 100 });
  const c = client(s.url);
  await c.opened;
  await new Promise(resolve => setTimeout(resolve, 300));
  assert.equal(c.ws.readyState, 1);
  c.ws.close();
  await c.closed;
  await s.app.close();
});

test('too many messages close the connection', async () => {
  const s = await boot({ rate: 5 });
  const c = client(s.url);
  await c.opened;
  for (let i = 0; i < 20; i++) c.send({ op: 'echo', i });
  assert.equal(await c.closed, 1008);
  await s.app.close();
});

test('connections are limited per address and freed on close', async () => {
  const s = await boot({ perIp: 2 });
  const head = 'CF-Connecting-IP: 203.0.113.5\r\n';
  const a = await rawClient(s.port, head), b = await rawClient(s.port, head), c = await rawClient(s.port, head);
  assert.match(a.status(), /101/);
  assert.match(b.status(), /101/);
  assert.match(c.status(), /429/);
  const other = await rawClient(s.port, 'CF-Connecting-IP: 203.0.113.6\r\n');
  assert.match(other.status(), /101/);
  a.socket.destroy();
  await new Promise(resolve => setTimeout(resolve, 50));
  const again = await rawClient(s.port, head);
  assert.match(again.status(), /101/);
  await s.app.close();
});

test('wrong path and bad handshake are refused', async () => {
  const s = await boot();
  const refused = await new Promise(resolve => {
    const socket = net.connect(s.port, '127.0.0.1', () => socket.write('GET /other HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: a\r\nSec-WebSocket-Version: 13\r\n\r\n'));
    socket.once('data', d => { resolve(d.toString()); socket.destroy(); });
  });
  assert.match(refused, /404/);
  const old = await new Promise(resolve => {
    const socket = net.connect(s.port, '127.0.0.1', () => socket.write('GET /api/net HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: a\r\nSec-WebSocket-Version: 8\r\n\r\n'));
    socket.once('data', d => { resolve(d.toString()); socket.destroy(); });
  });
  assert.match(old, /400/);
  await s.app.close();
});

test('the operations of the first measurements are gone', async () => {
  const s = await boot();
  const c = client(s.url);
  await c.opened;
  for (const op of ['join', 'signal', 'report']) {
    c.send({ op, room: 'KXQ7', data: { n: 1 } });
    assert.equal((await c.next()).code, 'op', op);
  }
  assert.equal(fs.existsSync(path.join(dir, 'probe.jsonl')), false);
  c.ws.close();
  await c.closed;
  await s.app.close();
});

test('bad messages get an answer and do not break the connection', async () => {
  const s = await boot();
  const c = client(s.url);
  await c.opened;
  c.send('not json');
  assert.equal((await c.next()).code, 'json');
  c.send('null');
  assert.equal((await c.next()).code, 'op');
  c.send({ op: 'nothing' });
  assert.equal((await c.next()).code, 'op');
  c.send({ op: 'echo', i: 9 });
  assert.equal((await c.next()).i, 9);
  c.ws.close();
  await c.closed;
  await s.app.close();
});

const SECRET = 'ABCDEFGHJKMNPQRS', OTHER = 'SRQPNMKJHGFEDCBA';

async function bootClock(extra) {
  const clock = { t: 1700000000000 };
  const s = await boot(Object.assign({ dataDir: fs.mkdtempSync(path.join(dir, 'data-')), timers: false, rate: 100000, newPerHour: 100, turnMs: 200 / 3, turnTicks: 2, emptyEvery: 1, now: () => clock.t }, extra));
  s.clock = clock;
  s.advance = ms => { for (let left = ms; left > 0; left -= 500) { clock.t += Math.min(left, 500); s.app.pump(); } };
  return s;
}

const helloMsg = (uid, secret = SECRET, extra) => Object.assign({ op: 'hello', uid, secret, proto: 1, sim: 'aa', ver: '1.7', src: 'test' }, extra);

async function player(s, uid, extra) {
  const c = client(s.url);
  await c.opened;
  c.send(helloMsg(uid, (extra && extra.secret) || SECRET, extra));
  const me = await c.next();
  assert.equal(me.op, 'me');
  c.uid = me.uid;
  c.me = me;
  return c;
}

async function drain(c) {
  const marker = Math.random();
  c.send({ op: 'echo', marker });
  const got = [];
  for (;;) {
    const m = await c.next();
    if (m.op === 'echo' && m.marker === marker) return got;
    got.push(m);
  }
}

const lastTable = list => list.filter(m => m.op === 'table').pop();

async function seated(s, n, o = {}) {
  const ps = [];
  for (let i = 0; i < n; i++) ps.push(await player(s, '70000000' + i));
  ps[0].send({ op: 'tableNew', name: 'P0', open: !!o.open, diff: o.diff });
  const first = await ps[0].next();
  assert.equal(first.op, 'table');
  for (let i = 1; i < n; i++) {
    ps[i].send({ op: 'tableJoin', code: first.code, name: 'P' + i });
    await drain(ps[i]);
  }
  for (const p of ps) await drain(p);
  return { ps, code: first.code };
}

async function started(s, n, o) {
  const t = await seated(s, n, o);
  for (let i = 1; i < n; i++) { t.ps[i].send({ op: 'tableReady', on: true }); await drain(t.ps[i]); }
  t.ps[0].send({ op: 'tableStart' });
  t.view = lastTable(await drain(t.ps[0]));
  for (let i = 1; i < n; i++) await drain(t.ps[i]);
  assert.equal(t.view.state, 'run');
  return t;
}

const turnsOf = list => list.filter(m => m.op === 't');

async function shut(s, ...clients) {
  for (const c of clients) { c.ws.close(); await c.closed; }
  await s.app.close();
}

function adminGet(port, route, headers) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: '/api/net/admin/' + route, headers }, res => {
      let body = '';
      res.on('data', d => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('the admin tool takes only known commands and real UIDs', () => {
  const { adminRoute } = require('../tools/net.cjs');
  assert.equal(adminRoute(['stats']), 'stats');
  assert.equal(adminRoute(['desync']), 'desync');
  assert.equal(adminRoute(['ban', '712345678']), 'ban/712345678');
  assert.equal(adminRoute(['unban', '712345678']), 'unban/712345678');
  assert.equal(adminRoute(['rename', '712345678']), 'rename/712345678');
  assert.equal(adminRoute(['unrename', '712345678']), 'unrename/712345678');
  assert.equal(adminRoute(['book-clear', '712345678']), 'book-clear/712345678');
  assert.equal(adminRoute(['rename']), null);
  assert.equal(adminRoute(['ban']), null);
  assert.equal(adminRoute(['ban', '712345678; rm -rf /']), null);
  assert.equal(adminRoute(['drop']), null);
  assert.equal(adminRoute([]), null);
});

test('a failing table goes away alone', async () => {
  const s = await bootClock();
  const { ps, code } = await started(s, 2);
  const t = s.app.tables.get(code);
  const log = console.error;
  console.error = () => {};
  t.seats.every = () => { throw new Error('boom'); };
  s.advance(100);
  console.error = log;
  assert.equal(s.app.tables.has(code), false);
  for (const p of ps) assert.ok((await drain(p)).some(m => m.op === 'tableGone'));
  await shut(s, ...ps);
});

test('the last-seen time is written at most once an hour', async () => {
  const s = await bootClock();
  const file = path.join(s.config.dataDir, 'accounts.jsonl');
  const lines = () => fs.readFileSync(file, 'utf8').trim().split('\n').length;
  for (let i = 0; i < 3; i++) {
    const a = await player(s, '700000091');
    a.ws.close();
    await a.closed;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.equal(lines(), 1);
  s.clock.t += 3600001;
  const a = await player(s, '700000091');
  a.ws.close();
  await a.closed;
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(lines(), 2);
  assert.equal(s.app.accounts.get('700000091').seen, s.clock.t);
  await s.app.close();
});

test('an account is kept by its secret and the file never holds the secret', async () => {
  const s = await bootClock();
  const a = await player(s, '700000001');
  assert.equal(a.me.uid, '700000001');
  assert.equal(a.me.table, null);
  a.ws.close();
  await a.closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  const file = fs.readFileSync(path.join(s.config.dataDir, 'accounts.jsonl'), 'utf8');
  assert.ok(!file.includes(SECRET));
  assert.ok(file.includes(crypto.createHash('sha256').update(SECRET).digest('hex')));
  const same = await player(s, '700000001');
  assert.equal(same.me.uid, '700000001');
  same.ws.close();
  await same.closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  const wrong = client(s.url);
  await wrong.opened;
  wrong.send(helloMsg('700000001', OTHER));
  assert.deepEqual(await wrong.next(), { op: 'error', code: 'secret' });
  assert.equal(await wrong.closed, 4002);
  await s.app.close();
});

test('a fresh UID that is taken gets another one, a code for an unknown UID is refused', async () => {
  const s = await bootClock();
  const a = await player(s, '700000002');
  const b = await player(s, '700000002', { secret: OTHER, fresh: true });
  assert.notEqual(b.me.uid, '700000002');
  assert.match(b.me.uid, /^7\d{8}$/);
  assert.equal(a.ws.readyState, 1);
  const c = client(s.url);
  await c.opened;
  c.send(helloMsg('799999999', SECRET, { code: true }));
  assert.deepEqual(await c.next(), { op: 'error', code: 'secret' });
  assert.equal(await c.closed, 4002);
  assert.equal(s.app.accounts.get('799999999'), null);
  await shut(s, a, b);
});

test('hello checks the protocol, the fields and repeats', async () => {
  const s = await bootClock();
  const old = client(s.url);
  await old.opened;
  old.send(helloMsg('700000003', SECRET, { proto: 0 }));
  assert.deepEqual(await old.next(), { op: 'error', code: 'proto' });
  assert.equal(await old.closed, 4001);
  for (const bad of [helloMsg('123', SECRET), helloMsg('700000003', 'short'), helloMsg('700000003', 'abcdefghjkmnpqrs'), helloMsg(['700000003'], SECRET)]) {
    const c = client(s.url);
    await c.opened;
    c.send(bad);
    assert.deepEqual(await c.next(), { op: 'error', code: 'secret' });
    assert.equal(await c.closed, 4002);
  }
  const early = client(s.url);
  await early.opened;
  early.send({ op: 'tableNew' });
  assert.deepEqual(await early.next(), { op: 'error', code: 'hello' });
  early.send({ op: 'deleteMe' });
  assert.deepEqual(await early.next(), { op: 'error', code: 'hello' });
  early.send({ op: 'status', s: 1 });
  assert.deepEqual(await early.next(), { op: 'error', code: 'hello' });
  early.send(helloMsg('700000003'));
  assert.equal((await early.next()).op, 'me');
  early.send(helloMsg('700000004'));
  assert.deepEqual(await early.next(), { op: 'error', code: 'hello' });
  assert.equal(s.app.accounts.get('700000004'), null);
  await shut(s, early);
});

test('a new connection of the account pushes out the old one', async () => {
  const s = await bootClock();
  const a = await player(s, '700000005');
  const b = await player(s, '700000005');
  assert.deepEqual(await a.next(), { op: 'replaced' });
  assert.equal(await a.closed, 4004);
  assert.equal(b.ws.readyState, 1);
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(s.app.clients.size, 1);
  await shut(s, b);
});

test('new accounts are limited per address per hour', async () => {
  const s = await bootClock({ newPerHour: 2 });
  const hi = async (uid, ip) => {
    const c = await rawClient(s.port, 'CF-Connecting-IP: ' + ip + '\r\n');
    c.write(c.frame(0x81, Buffer.from(JSON.stringify(helloMsg(uid)))));
    return JSON.parse((await c.next()).body.toString());
  };
  assert.equal((await hi('700000010', '203.0.113.1')).op, 'me');
  assert.equal((await hi('700000011', '203.0.113.1')).op, 'me');
  assert.deepEqual(await hi('700000012', '203.0.113.1'), { op: 'error', code: 'limit' });
  assert.equal(s.app.accounts.get('700000012'), null);
  assert.equal((await hi('700000010', '203.0.113.1')).op, 'me');
  assert.equal((await hi('700000013', '203.0.113.2')).op, 'me');
  s.clock.t += 3600000;
  assert.equal((await hi('700000012', '203.0.113.1')).op, 'me');
  await s.app.close();
});

test('accounts survive a restart and old lines are compacted away', async () => {
  const dataDir = fs.mkdtempSync(path.join(dir, 'keep-'));
  const s = await bootClock({ dataDir });
  const a = await player(s, '700000020');
  const b = await player(s, '700000021');
  b.send({ op: 'deleteMe' });
  await b.closed;
  a.ws.close();
  await a.closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  await s.app.close();
  const before = fs.readFileSync(path.join(dataDir, 'accounts.jsonl'), 'utf8').trim().split('\n').length;
  assert.ok(before >= 3);
  const again = await bootClock({ dataDir });
  assert.equal(fs.readFileSync(path.join(dataDir, 'accounts.jsonl'), 'utf8').trim().split('\n').length, 1);
  assert.ok(again.app.accounts.get('700000020'));
  assert.equal(again.app.accounts.get('700000021'), null);
  const wrong = client(again.url);
  await wrong.opened;
  wrong.send(helloMsg('700000020', OTHER));
  assert.equal(await wrong.closed, 4002);
  const back = await player(again, '700000020');
  assert.equal(back.me.uid, '700000020');
  await shut(again, back);
});

test('deleting the account removes it and frees the UID', async () => {
  const s = await bootClock();
  const a = await player(s, '700000030');
  a.send({ op: 'deleteMe' });
  assert.deepEqual(await a.next(), { op: 'deleted' });
  assert.equal(await a.closed, 4005);
  assert.equal(s.app.accounts.get('700000030'), null);
  const b = await player(s, '700000030', { secret: OTHER });
  assert.equal(b.me.uid, '700000030');
  await shut(s, b);
});

test('admin works only from the mini-PC itself, not through the tunnel', async () => {
  const s = await bootClock();
  const a = await player(s, '700000040');
  const stats = await adminGet(s.port, 'stats');
  assert.equal(stats.status, 200);
  assert.equal(stats.body.accounts, 1);
  assert.equal(stats.body.online, 1);
  assert.equal((await adminGet(s.port, 'stats', { 'CF-Connecting-IP': '203.0.113.7' })).status, 403);
  assert.equal((await adminGet(s.port, 'stats', { Host: 'pennygachi.men' })).status, 403);
  assert.equal((await adminGet(s.port, 'ban/700000040', { 'CF-Connecting-IP': '203.0.113.7', Host: '127.0.0.1' })).status, 403);
  assert.equal(s.app.accounts.get('700000040').banned, false);
  assert.equal((await adminGet(s.port, 'ban/799999999')).status, 404);
  assert.equal((await adminGet(s.port, 'nothing/700000040')).status, 404);
  assert.deepEqual((await adminGet(s.port, 'desync')).body, { desync: [] });
  assert.deepEqual((await adminGet(s.port, 'ban/700000040')).body, { uid: '700000040', banned: true });
  assert.deepEqual(await a.next(), { op: 'error', code: 'banned' });
  assert.equal(await a.closed, 4003);
  const refused = client(s.url);
  await refused.opened;
  refused.send(helloMsg('700000040'));
  assert.deepEqual(await refused.next(), { op: 'error', code: 'banned' });
  assert.equal(await refused.closed, 4003);
  assert.equal((await adminGet(s.port, 'unban/700000040')).body.banned, false);
  const back = await player(s, '700000040');
  await shut(s, back);
});

test('a table: seats, code, list, version and limits', async () => {
  const s = await bootClock({ tablesMax: 2 });
  const { ps, code } = await seated(s, 4, { open: true, diff: 'hard' });
  assert.match(code, /^[A-HJKMNP-TV-Z2-9]{4}$/);
  ps[3].send({ op: 'tableList' });
  const list = (await drain(ps[3])).find(m => m.op === 'tables').list;
  assert.deepEqual(list, [{ code, host: 'P0', hostUid: '700000000', diff: 'hard', seats: 4, sim: 'aa', ver: '1.7' }]);
  const view = await (async () => { ps[1].send({ op: 'tableReady', on: true }); return lastTable(await drain(ps[1])); })();
  assert.equal(view.host, 0);
  assert.equal(view.seats[1].ready, true);
  assert.equal(view.seats[1].name, 'P1');
  assert.deepEqual(view.seats.map(x => x.uid), ['700000000', '700000001', '700000002', '700000003']);
  const fifth = await player(s, '700000050');
  fifth.send({ op: 'tableJoin', code });
  assert.equal((await fifth.next()).code, 'full');
  fifth.send({ op: 'tableJoin', code: 'ZZZZ' });
  assert.equal((await fifth.next()).code, 'none');
  const stale = await player(s, '700000051', { sim: 'bb', ver: '1.6' });
  ps[3].send({ op: 'tableLeave' });
  assert.deepEqual((await drain(ps[3])).filter(m => m.op === 'tableGone'), [{ op: 'tableGone', code }]);
  stale.send({ op: 'tableJoin', code });
  assert.deepEqual(await stale.next(), { op: 'tableError', code: 'sim', ver: '1.7' });
  stale.send({ op: 'tableNew', open: false });
  const closed = await stale.next();
  assert.equal(closed.op, 'table');
  assert.equal(closed.diff, 'normal');
  fifth.send({ op: 'tableList' });
  assert.equal((await drain(fifth)).find(m => m.op === 'tables').list.length, 1);
  fifth.send({ op: 'tableNew' });
  assert.equal((await fifth.next()).code, 'busy');
  fifth.send({ op: 'tableReady', on: true });
  assert.equal((await fifth.next()).code, 'none');
  await shut(s, ...ps, fifth, stale);
});

test('names are cleaned before anyone sees them', async () => {
  const s = await bootClock();
  const a = await player(s, '700000060');
  a.send({ op: 'tableNew', name: 'a|b{c}=d#e<f>\u0001 very very long name' });
  assert.equal((await a.next()).seats[0].name, 'abcdef very');
  a.send({ op: 'tableNew', name: '|||' });
  const t = lastTable(await drain(a));
  assert.equal(t.seats[0].name, 'Первопроходец');
  await shut(s, a);
});

test('only the host starts, with everyone ready, and a bad seat does not break the server', async () => {
  const s = await bootClock();
  const { ps } = await seated(s, 3);
  const [host, b, c] = ps;
  b.send({ op: 'tableStart' });
  assert.equal((await b.next()).code, 'host');
  b.send({ op: 'tableSet', diff: 'hard' });
  assert.equal((await b.next()).code, 'host');
  b.send({ op: 'tableKick', seat: 2 });
  assert.equal((await b.next()).code, 'host');
  host.send({ op: 'tableStart' });
  assert.equal((await host.next()).code, 'ready');
  for (const seat of ['__proto__', 'length', -1, 9, 0, null, { a: 1 }]) {
    host.send({ op: 'tableKick', seat });
    assert.equal((await host.next()).code, 'host');
  }
  host.send({ op: 'tableSet', diff: 'hard', open: true });
  const set = lastTable(await drain(host));
  assert.equal(set.diff, 'hard');
  assert.equal(set.open, true);
  await drain(b);
  await drain(c);
  host.send({ op: 'tableKick', seat: 2 });
  await drain(host);
  assert.deepEqual((await drain(c)).filter(m => m.op === 'tableGone').map(m => m.kicked), [true]);
  b.send({ op: 'tableReady', on: true });
  await drain(b);
  host.send({ op: 'tableStart' });
  const run = lastTable(await drain(host));
  assert.equal(run.state, 'run');
  assert.ok(run.seed > 0);
  assert.equal(run.n, 0);
  assert.equal(run.ticks, 2);
  c.send({ op: 'tableJoin', code: run.code });
  assert.equal((await c.next()).code, 'started');
  await shut(s, ...ps);
});

test('the host role moves on when the host leaves, and a table with one player needs a second', async () => {
  const s = await bootClock();
  const { ps } = await seated(s, 2);
  const [a, b] = ps;
  a.send({ op: 'tableStart' });
  assert.equal((await a.next()).code, 'ready');
  a.send({ op: 'tableLeave' });
  await drain(a);
  const after = lastTable(await drain(b));
  assert.equal(after.host, 1);
  assert.equal(after.seats[0], null);
  b.send({ op: 'tableStart' });
  assert.equal((await b.next()).code, 'ready');
  b.send({ op: 'tableLeave' });
  await drain(b);
  assert.equal(s.app.tables.size, 0);
  await shut(s, a, b);
});

test('turns come at a steady rate, carry commands with the seat set by the server and the journal skips empty turns', async () => {
  const s = await bootClock();
  const { ps, code, view } = await started(s, 2);
  const [a, b] = ps;
  assert.equal(view.turnMs, 200 / 3);
  s.advance(1010);
  assert.equal(turnsOf(await drain(a)).length, 15);
  assert.deepEqual(turnsOf(await drain(b)).map(m => m.n), Array.from({ length: 15 }, (_, i) => i + 1));
  a.send({ op: 'cmd', c: { t: 'move', dx: 1, dy: 0, p: 3 } });
  b.send({ op: 'cmd', c: { t: 'stop' } });
  await drain(a);
  await drain(b);
  s.advance(100);
  const withCmds = turnsOf(await drain(b));
  assert.equal(withCmds[0].n, 16);
  assert.deepEqual(withCmds[0].c.map(c => c.p).sort(), [0, 1]);
  assert.deepEqual(withCmds[0].c.find(c => c.t === 'move'), { t: 'move', dx: 1, dy: 0, p: 0 });
  await drain(a);
  const t = s.app.tables.get(code);
  assert.equal(t.log.length, 1);
  assert.equal(t.log[0][0], 16);
  await shut(s, ...ps);
});

test('bad commands are dropped: wrong shape, too long, too many, not started', async () => {
  const s = await bootClock({ cmdRate: 5, cmdSize: 60 });
  const lobby = await seated(s, 2);
  lobby.ps[0].send({ op: 'cmd', c: { t: 'stop' } });
  await drain(lobby.ps[0]);
  const t = s.app.tables.get(lobby.code);
  assert.equal(t.pending.length, 0);
  await shut(s, ...lobby.ps);
  const r = await bootClock({ cmdRate: 5, cmdSize: 60 });
  const { ps, code } = await started(r, 2);
  const a = ps[0], run = r.app.tables.get(code);
  for (const c of [null, 5, 'x', [1, 2], { pad: 'x'.repeat(80) }]) a.send({ op: 'cmd', c });
  await drain(a);
  assert.equal(run.pending.length, 0);
  r.clock.t += 1000;
  for (let i = 0; i < 9; i++) a.send({ op: 'cmd', c: { t: 'stop', i } });
  await drain(a);
  assert.equal(run.pending.length, 5);
  r.clock.t += 1000;
  a.send({ op: 'cmd', c: { t: 'stop', i: 99 } });
  await drain(a);
  assert.equal(run.pending.length, 6);
  await shut(r, ...ps);
});

test('a player who returns gets the journal since a given turn, and only that', async () => {
  const s = await bootClock();
  const { ps, code } = await started(s, 2);
  const [a, b] = ps;
  a.send({ op: 'cmd', c: { t: 'stop', i: 1 } });
  await drain(a);
  s.advance(100);
  a.send({ op: 'cmd', c: { t: 'stop', i: 2 } });
  await drain(a);
  s.advance(100);
  await drain(a);
  b.ws.close();
  await b.closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  const again = await player(s, '700000001');
  assert.equal(again.me.table, code);
  again.send({ op: 'tableBack', code, since: 1 });
  const got = await drain(again);
  const log = got.find(m => m.op === 'log');
  assert.equal(log.upto, s.app.tables.get(code).n);
  assert.deepEqual(log.turns.map(e => e[1].i), [2]);
  assert.equal(lastTable(got).seats[1].online, true);
  const whole = await player(s, '700000000');
  whole.send({ op: 'tableBack', code, since: 0 });
  assert.deepEqual((await drain(whole)).find(m => m.op === 'log').turns.map(e => e[1].i), [1, 2]);
  const outsider = await player(s, '700000090');
  outsider.send({ op: 'tableBack', code, since: 0 });
  assert.equal((await outsider.next()).code, 'none');
  await shut(s, again, whole, outsider);
});

test('away is written after 10 s of silence once, and back on return', async () => {
  const s = await bootClock();
  const { ps, code } = await started(s, 2);
  const [a, b] = ps;
  b.ws.close();
  await b.closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  const quick = lastTable(await drain(a));
  assert.equal(quick.seats[1].online, false);
  assert.equal(quick.seats[1].away, false);
  s.advance(9000);
  assert.equal(s.app.tables.get(code).log.length, 0);
  s.advance(1500);
  const log = s.app.tables.get(code).log;
  assert.deepEqual(log.map(e => e[1]), [{ t: 'away', on: true, p: 1 }]);
  s.advance(20000);
  assert.equal(log.length, 1);
  const again = await player(s, '700000001');
  again.send({ op: 'tableBack', code, since: 0 });
  await drain(again);
  s.advance(100);
  assert.deepEqual(log.map(e => e[1]), [{ t: 'away', on: true, p: 1 }, { t: 'away', on: false, p: 1 }]);
  await shut(s, a, again);
});

test('in the lobby a lost player keeps the seat for 10 s, and rejoining does not duplicate them', async () => {
  const s = await bootClock();
  const { ps, code } = await seated(s, 2);
  const [a, b] = ps;
  b.ws.close();
  await b.closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  s.advance(5000);
  await drain(a);
  a.send({ op: 'tableStart' });
  assert.equal((await a.next()).code, 'ready');
  const again = await player(s, '700000001');
  assert.equal(again.me.table, code);
  again.send({ op: 'tableJoin', code, name: 'P1' });
  const back = lastTable(await drain(again));
  assert.equal(back.seats.filter(Boolean).length, 2);
  assert.equal(back.seats[1].online, true);
  again.ws.close();
  await again.closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  await drain(a);
  s.advance(10500);
  assert.equal(lastTable(await drain(a)).seats[1], null);
  await shut(s, a);
});

test('pause on a closed table: turns stop, commands drop, others wait 15 s, countdown, no burst', async () => {
  const s = await bootClock();
  const { ps, code } = await started(s, 2);
  const [a, b] = ps;
  s.advance(1000);
  await drain(a);
  await drain(b);
  const turnsBefore = s.app.tables.get(code).n;
  a.send({ op: 'pause', on: true });
  const on = lastTable(await drain(a));
  assert.equal(on.paused.by, 0);
  assert.equal(on.paused.left, 600000);
  assert.equal(on.paused.resume, null);
  assert.equal(on.paused.others, 15000);
  assert.equal(lastTable(await drain(b)).paused.by, 0);
  a.send({ op: 'pause', on: true });
  assert.equal((await a.next()).code, 'pause');
  s.advance(5000);
  assert.equal(turnsOf(await drain(a)).length, 0);
  b.send({ op: 'cmd', c: { t: 'stop' } });
  await drain(b);
  assert.equal(s.app.tables.get(code).pending.length, 0);
  b.send({ op: 'say', id: 3 });
  assert.deepEqual((await drain(b)).filter(m => m.op === 'say'), [{ op: 'say', p: 1, id: 3 }]);
  assert.equal(s.app.tables.get(code).log.length, 0);
  await drain(a);
  b.send({ op: 'pause', on: false });
  assert.equal((await b.next()).code, 'pauseWait');
  s.advance(10000);
  b.send({ op: 'pause', on: false });
  const off = lastTable(await drain(b));
  assert.equal(off.paused.resume, 3000);
  await drain(a);
  s.advance(2500);
  assert.equal(turnsOf(await drain(a)).length, 0);
  s.advance(500);
  const after = await drain(a);
  assert.equal(lastTable(after).paused, null);
  assert.equal(turnsOf(after).length, 0);
  s.advance(1010);
  const turns = turnsOf(await drain(a));
  assert.ok(turns.length >= 15 && turns.length <= 16, 'no burst: ' + turns.length);
  assert.equal(turns[0].n, turnsBefore + 1);
  await shut(s, ...ps);
});

test('the player who paused lifts it at once; a closed table has no count; the pause ends by itself', async () => {
  const s = await bootClock();
  const { ps } = await started(s, 2);
  const [a, b] = ps;
  for (let i = 0; i < 5; i++) {
    a.send({ op: 'pause', on: true });
    await drain(a);
    a.send({ op: 'pause', on: false });
    assert.equal(lastTable(await drain(a)).paused.resume, 3000);
    s.advance(3000);
    assert.equal(lastTable(await drain(a)).paused, null);
  }
  b.send({ op: 'pause', on: true });
  await drain(b);
  s.advance(600000);
  const lifted = lastTable(await drain(b));
  assert.equal(lifted.paused.resume, 3000);
  s.advance(3000);
  assert.equal(lastTable(await drain(b)).paused, null);
  await shut(s, ...ps);
});

test('pause on an open table: three per player, 120 s each', async () => {
  const s = await bootClock();
  const { ps } = await started(s, 2, { open: true });
  const [a, b] = ps;
  for (let i = 0; i < 3; i++) {
    a.send({ op: 'pause', on: true });
    const on = lastTable(await drain(a));
    assert.equal(on.paused.left, 120000);
    assert.equal(on.paused.count[0], i + 1);
    s.advance(123000);
    assert.equal(lastTable(await drain(a)).paused, null);
  }
  a.send({ op: 'pause', on: true });
  assert.equal((await a.next()).code, 'pause');
  b.send({ op: 'pause', on: true });
  assert.equal(lastTable(await drain(b)).paused.by, 1);
  await shut(s, ...ps);
});

test('a pause ends 10 s after the player who set it is gone', async () => {
  const s = await bootClock();
  const { ps } = await started(s, 3);
  const [a, b, c] = ps;
  a.send({ op: 'pause', on: true });
  await drain(a);
  await drain(b);
  a.ws.close();
  await a.closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  s.advance(9000);
  assert.equal(lastTable(await drain(b)).paused.resume, null);
  s.advance(1500);
  assert.equal(lastTable(await drain(b)).paused.resume, 3000);
  s.advance(2500);
  assert.equal(lastTable(await drain(b)).paused, null);
  await drain(c);
  s.advance(1010);
  assert.equal(turnsOf(await drain(c)).length, 15);
  await shut(s, b, c);
});

test('nobody online: turns stop, a return goes on without a burst, the table goes after 10 min', async () => {
  const s = await bootClock();
  const { ps, code } = await started(s, 2);
  s.advance(1000);
  for (const p of ps) { p.ws.close(); await p.closed; }
  await new Promise(resolve => setTimeout(resolve, 30));
  const t = s.app.tables.get(code), n = t.n;
  s.advance(60000);
  assert.equal(t.n, n);
  const again = await player(s, '700000000');
  again.send({ op: 'tableBack', code, since: 0 });
  await drain(again);
  s.advance(1010);
  assert.ok(t.n - n >= 15 && t.n - n <= 16, 'no burst: ' + (t.n - n));
  again.ws.close();
  await again.closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  s.advance(599000);
  assert.ok(s.app.tables.has(code));
  s.advance(2000);
  assert.ok(!s.app.tables.has(code));
  const late = await player(s, '700000001');
  assert.equal(late.me.table, null);
  await shut(s, late);
});

test('a jump of the clock does not flood the table with turns', async () => {
  const s = await bootClock();
  const { ps, code } = await started(s, 2);
  s.clock.t += 3600000;
  s.app.pump();
  assert.equal(s.app.tables.get(code).n, 0);
  s.clock.t -= 7200000;
  s.app.pump();
  assert.equal(s.app.tables.get(code).n, 0);
  s.advance(1010);
  assert.equal(s.app.tables.get(code).n, 15);
  await shut(s, ...ps);
});

test('the end of the game stops the turns and the journal stays for those who return', async () => {
  const s = await bootClock();
  const { ps, code } = await started(s, 2);
  const [a, b] = ps;
  a.send({ op: 'cmd', c: { t: 'stop' } });
  await drain(a);
  s.advance(100);
  a.send({ op: 'tableOver' });
  assert.equal(lastTable(await drain(a)).state, 'done');
  const n = s.app.tables.get(code).n;
  s.advance(1000);
  assert.equal(s.app.tables.get(code).n, n);
  a.send({ op: 'cmd', c: { t: 'stop' } });
  await drain(a);
  assert.equal(s.app.tables.get(code).pending.length, 0);
  a.send({ op: 'tableLeave' });
  await drain(a);
  b.send({ op: 'tableLeave' });
  await drain(b);
  assert.equal(s.app.tables.size, 0);
  await shut(s, a, b);
});

test('the desync record stops at its size limit', async () => {
  const s = await bootClock({ maxLogFile: 10 });
  const file = path.join(s.config.dataDir, 'desync.jsonl');
  fs.rmSync(file, { force: true });
  const { ps } = await started(s, 3);
  ps.forEach((p, i) => p.send({ op: 'hash', n: 10, h: i === 2 ? 'y' : 'x' }));
  const heard = [];
  for (let round = 0; round < 2; round++) for (const p of ps) heard.push(...await drain(p));
  assert.ok(heard.some(m => m.op === 'desync'), 'the server saw the wrong hash');
  assert.ok(!fs.existsSync(file), 'and wrote nothing over the limit');
  await shut(s, ...ps);
});

test('hash reports: agreement is silent, a lone wrong hash hears desync, a tie tells both, the record has no UID', async () => {
  const s = await bootClock();
  const file = path.join(s.config.dataDir, 'desync.jsonl');
  const { ps, code } = await started(s, 3);
  const [a, b, c] = ps;
  const report = async (n, ...hashes) => {
    for (let i = 0; i < hashes.length; i++) ps[i].send({ op: 'hash', n, h: hashes[i] });
    const out = [];
    for (let i = 0; i < ps.length; i++) out.push(await drain(ps[i]));
    for (let i = 0; i < ps.length; i++) out[i] = out[i].concat(await drain(ps[i])).filter(m => m.op === 'desync');
    return out;
  };
  assert.deepEqual(await report(10, 'x', 'x', 'x'), [[], [], []]);
  assert.ok(!fs.existsSync(file));
  assert.deepEqual(await report(20, 'x', 'y', 'x'), [[], [{ op: 'desync', n: 20 }], []]);
  const line = fs.readFileSync(file, 'utf8').trim();
  const entry = JSON.parse(line);
  assert.equal(entry.code, code);
  assert.equal(entry.n, 20);
  assert.deepEqual(entry.seats.map(x => x.h), ['x', 'y', 'x']);
  assert.equal(entry.seats[0].ver, '1.7');
  assert.ok(!line.includes('70000000'));
  assert.equal((await adminGet(s.port, 'desync')).body.desync[0].n, 20);
  c.ws.close();
  await c.closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  a.send({ op: 'hash', n: 30, h: 'x' });
  b.send({ op: 'hash', n: 30, h: 'y' });
  const heardB = await drain(b), heardA = await drain(a);
  assert.deepEqual(heardB.filter(m => m.op === 'desync'), [{ op: 'desync', n: 30 }]);
  assert.deepEqual(heardA.filter(m => m.op === 'desync'), [{ op: 'desync', n: 30 }]);
  for (const bad of [{ n: 'x', h: 'y' }, { n: 40, h: 5 }, { n: 40, h: 'y'.repeat(99) }]) a.send(Object.assign({ op: 'hash' }, bad));
  await drain(a);
  await shut(s, a, b);
});

test('deleting an account seated at a table leaves no way back to the seat', async () => {
  const s = await bootClock();
  const { ps, code } = await started(s, 2);
  const [a, b] = ps;
  b.send({ op: 'deleteMe' });
  await b.closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  const t = s.app.tables.get(code);
  assert.equal(t.seats[1].uid, '');
  const again = await player(s, '700000001');
  assert.equal(again.me.table, null);
  again.send({ op: 'tableBack', code, since: 0 });
  assert.equal((await again.next()).code, 'none');
  await shut(s, a, again);
});

test('an unexpected failure in a handler answers with an error and keeps the server alive', async () => {
  const s = await bootClock();
  const a = await player(s, '700000070');
  const get = s.app.tables.get;
  s.app.tables.get = () => { throw new Error('boom'); };
  const log = console.error;
  console.error = () => {};
  a.send({ op: 'tableJoin', code: 'AAAA' });
  assert.deepEqual(await a.next(), { op: 'error', code: 'server' });
  console.error = log;
  s.app.tables.get = get;
  a.send({ op: 'tableJoin', code: 'AAAA' });
  assert.equal((await a.next()).code, 'none');
  await shut(s, a);
});

test('seats close up at the start, so a seat is a hero number, and the host stays the host', async () => {
  const s = await bootClock();
  const { ps } = await seated(s, 3);
  const [a, b, c] = ps;
  b.send({ op: 'tableLeave' });
  await drain(b);
  c.send({ op: 'tableReady', on: true });
  await drain(c);
  a.send({ op: 'tableStart' });
  const run = lastTable(await drain(a));
  assert.equal(run.state, 'run');
  assert.deepEqual(run.seats.map(x => x && x.name), ['P0', 'P2', null, null]);
  assert.equal(run.host, 0);
  await drain(c);
  c.send({ op: 'cmd', c: { t: 'stop' } });
  await drain(c);
  s.advance(100);
  assert.deepEqual(turnsOf(await drain(a))[0].c, [{ t: 'stop', p: 1 }], 'the second player has seat 1 now');
  await shut(s, a, b, c);
});

test('a player cannot write away for themselves', async () => {
  const s = await bootClock();
  const { ps, code } = await started(s, 2);
  ps[0].send({ op: 'cmd', c: { t: 'away', on: true } });
  await drain(ps[0]);
  assert.equal(s.app.tables.get(code).pending.length, 0);
  await shut(s, ...ps);
});

test('leaving a running table is final, closing the game is not', async () => {
  const s = await bootClock();
  const { ps, code } = await started(s, 3);
  const [a, b, c] = ps;
  b.send({ op: 'tableLeave' });
  assert.deepEqual((await drain(b)).filter(m => m.op === 'tableGone'), [{ op: 'tableGone', code }]);
  assert.equal(lastTable(await drain(a)).seats[1].left, true);
  s.advance(100);
  assert.deepEqual(s.app.tables.get(code).log.map(e => e[1]), [{ t: 'away', on: true, p: 1 }], 'the hero stands and fights alone');
  b.send({ op: 'tableBack', code, since: 0 });
  assert.equal((await b.next()).code, 'none', 'no way back after leaving');
  b.ws.close();
  await b.closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  const again = await player(s, '700000001');
  assert.equal(again.me.table, null, 'the hub does not offer the table');
  c.send({ op: 'tableLeave', keep: true });
  assert.deepEqual((await drain(c)).filter(m => m.op === 'tableGone'), [{ op: 'tableGone', code, keep: true }]);
  c.send({ op: 'tableBack', code, since: 0 });
  const back = await drain(c);
  assert.equal(lastTable(back).seats[2].online, true, 'a closed game window comes back');
  assert.ok(back.some(m => m.op === 'log'));
  await shut(s, a, again, c);
});

test('a table where everyone left for good goes away at once', async () => {
  const s = await bootClock();
  const { ps, code } = await started(s, 2);
  for (const p of ps) { p.send({ op: 'tableLeave' }); await drain(p); }
  assert.ok(s.app.tables.has(code));
  s.advance(100);
  assert.equal(s.app.tables.has(code), false);
  await shut(s, ...ps);
});

test('turns are one tick long, empty ones go out in pairs and commands at once', async () => {
  const cfg = loadConfig({});
  assert.equal(cfg.turnMs, 100 / 3);
  assert.equal(cfg.turnTicks, 1);
  assert.equal(cfg.emptyEvery, 2);
  const s = await bootClock({ turnMs: cfg.turnMs, turnTicks: cfg.turnTicks, emptyEvery: cfg.emptyEvery });
  const { ps, code, view } = await started(s, 2);
  const [a, b] = ps;
  assert.equal(view.ticks, 1);
  assert.equal(view.turnMs, 100 / 3);
  s.advance(40);
  assert.equal(s.app.tables.get(code).n, 1);
  assert.deepEqual(turnsOf(await drain(a)), [], 'one empty turn waits for a pair');
  s.advance(40);
  assert.deepEqual(turnsOf(await drain(a)), [{ op: 't', n: 2 }], 'the message means all turns up to this one');
  s.advance(35);
  b.send({ op: 'cmd', c: { t: 'stop' } });
  await drain(b);
  await drain(a);
  s.advance(35);
  const now = turnsOf(await drain(a));
  assert.equal(now.length, 1, 'a command does not wait for the pair');
  assert.deepEqual(now[0].c, [{ t: 'stop', p: 1 }]);
  assert.equal(now[0].n, s.app.tables.get(code).n);
  s.advance(35);
  a.send({ op: 'pause', on: true });
  const paused = await drain(a);
  assert.equal(turnsOf(paused).pop().n, s.app.tables.get(code).n, 'a pause sends the turn it stops on');
  assert.ok(lastTable(paused).paused);
  await shut(s, ...ps);
});

test('phrases and marks go to the whole table, never into the journal, once a second', async () => {
  const s = await bootClock();
  const { ps, code } = await started(s, 2);
  const [a, b] = ps;
  s.advance(1000);
  await drain(a);
  await drain(b);
  a.send({ op: 'say', id: 2 });
  a.send({ op: 'say', id: 3 });
  a.send({ op: 'mark', x: 100, y: 200, id: 7 });
  a.send({ op: 'mark', x: 110, y: 200 });
  a.send({ op: 'mark', x: -5, y: 200 });
  a.send({ op: 'say', id: 99 });
  await drain(a);
  const heard = (await drain(b)).filter(m => m.op === 'say' || m.op === 'mark');
  assert.deepEqual(heard, [{ op: 'say', p: 0, id: 2 }, { op: 'mark', p: 0, x: 100, y: 200, id: 7 }]);
  assert.equal(s.app.tables.get(code).log.length, 0);
  assert.equal(s.app.tables.get(code).pending.length, 0);
  s.advance(1000);
  await drain(a);
  await drain(b);
  a.send({ op: 'mark', x: 120, y: 200 });
  assert.deepEqual((await drain(b)).filter(m => m.op === 'mark'), [{ op: 'mark', p: 0, x: 120, y: 200 }], 'after a second it works again');
  await shut(s, ...ps);
});

test('tableAgain returns a finished table to the lobby with the same people', async () => {
  const s = await bootClock();
  const { ps, code } = await started(s, 3);
  const [a, b, c] = ps;
  s.advance(1000);
  a.send({ op: 'pause', on: true });
  await drain(a);
  a.send({ op: 'pause', on: false });
  await drain(a);
  s.advance(4000);
  a.send({ op: 'cmd', c: { t: 'stop' } });
  s.advance(100);
  await drain(a);
  a.send({ op: 'tableAgain' });
  await drain(a);
  assert.equal(s.app.tables.get(code).state, 'run', 'a running game cannot be restarted');
  c.ws.close();
  await c.closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  a.send({ op: 'tableOver' });
  assert.equal(lastTable(await drain(a)).state, 'done');
  b.send({ op: 'tableAgain' });
  const back = lastTable(await drain(b));
  assert.equal(back.state, 'lobby');
  assert.equal(back.seed, null);
  assert.equal(back.n, 0);
  assert.equal(back.seats[0].uid, a.uid);
  assert.equal(back.seats[1].uid, b.uid);
  assert.equal(back.seats[2], null, 'one who is gone loses the seat');
  assert.equal(back.seats[0].ready, false);
  assert.equal(back.seats[0].pauses, 0);
  assert.equal(lastTable(await drain(a)).state, 'lobby');
  assert.equal(s.app.tables.get(code).log.length, 0);
  b.send({ op: 'tableAgain' });
  assert.equal((await drain(b)).filter(m => m.op === 'table').length, 0, 'a second call changes nothing');
  b.send({ op: 'tableReady', on: true });
  await drain(b);
  await drain(a);
  a.send({ op: 'tableStart' });
  const run = lastTable(await drain(a));
  assert.equal(run.state, 'run', 'the same table starts again');
  assert.ok(run.seed > 0);
  await shut(s, a, b);
});

test('a seat shows the avatar, gender and level of its card', async () => {
  const s = await bootClock();
  const a = await player(s, '700000000');
  a.send({ op: 'card', card: { name: 'Kaia', gender: 'f', tl: 44, avatar: { k: 'kafka', lvl: 80, eid: 0 } } });
  await drain(a);
  a.send({ op: 'tableNew', name: 'Kaia', diff: 'normal' });
  const seat = lastTable(await drain(a)).seats[0];
  assert.deepEqual([seat.gender, seat.tl, seat.avatar.k], ['f', 44, 'kafka']);
  await shut(s, a);
});

test('a command that comes before the player is back at the table costs nothing', async () => {
  const s = await bootClock();
  const { ps, code } = await started(s, 2);
  ps[1].ws.close();
  await ps[1].closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  const again = await player(s, '700000001');
  again.send({ op: 'cmd', c: { t: 'stop' } });
  again.send({ op: 'hash', n: 60, h: 'x' });
  again.send({ op: 'say', id: 1 });
  assert.deepEqual((await drain(again)).filter(m => m.op === 'tableError'), [], 'no refusal that would end the game');
  again.send({ op: 'pause', on: true });
  assert.equal((await again.next()).code, 'none', 'a request that needs an answer still gets one');
  again.send({ op: 'tableBack', code, since: 0 });
  assert.ok((await drain(again)).some(m => m.op === 'log'));
  await shut(s, ps[0], again);
});

async function pals(s, a, b) {
  a.send({ op: 'friends' });
  b.send({ op: 'friends' });
  await drain(a);
  await drain(b);
  a.send({ op: 'req', uid: b.uid });
  await drain(a);
  await drain(b);
  b.send({ op: 'answer', uid: a.uid, yes: true });
  await drain(b);
  await drain(a);
}

const lastOf = (list, op) => list.filter(m => m.op === op).pop();

function sampleCard(name) {
  return { name, gender: 'f', tl: 41, avatar: { k: 'kafka', o: null, lvl: 60, eid: 1 }, stage: { k: 'blade', o: null, lvl: 50, eid: 0 }, sign: 'Привет', bday: { d: 5, m: 7 }, show: [{ k: 'kafka', lvl: 60, eid: 1 }, null, { k: 'blade', lvl: 50, eid: 0 }], comp: [{ k: 'seele', lvl: 30, eid: 0 }], merits: [{ id: 'hd', open: true, value: 'Волна 14' }, { id: 'fh', open: false, value: 'Не открыто' }], coll: [{ id: 'five', got: 4, total: 30 }], log: [{ at: 1700000000000, text: 'получен персонаж 5★ Кафка' }] };
}

test('friends: a request, its answer, the rows on both sides, and nothing before asking', async () => {
  const s = await bootClock(), a = await player(s, '700000101'), b = await player(s, '700000102');
  a.send({ op: 'req', uid: b.uid });
  await drain(a);
  assert.deepEqual(await drain(b), [], 'a client that has not asked for its list hears nothing');
  b.send({ op: 'friends' });
  let snap = lastOf(await drain(b), 'friends');
  assert.deepEqual(snap.in.map(x => x.uid), [a.uid], 'the request waits');
  assert.equal(snap.max, 100);
  a.send({ op: 'friends' });
  snap = lastOf(await drain(a), 'friends');
  assert.deepEqual(snap.out.map(x => x.uid), [b.uid]);
  assert.deepEqual(snap.settings, { reqs: 'all', guests: 'friends' });
  b.send({ op: 'answer', uid: a.uid, yes: true });
  snap = lastOf(await drain(b), 'friends');
  assert.deepEqual(snap.in, []);
  assert.deepEqual(snap.list.map(x => x.uid), [a.uid]);
  assert.equal(snap.list[0].on, true);
  assert.equal(snap.list[0].fav, false);
  const other = lastOf(await drain(a), 'friends');
  assert.deepEqual(other.out, []);
  assert.deepEqual(other.list.map(x => x.uid), [b.uid]);
  await shut(s, a, b);
});

test('friends: refusal, cancel, two requests meet, bad targets and limits', async () => {
  const s = await bootClock({ friendMax: 2, reqMax: 2 }), a = await player(s, '700000111'), b = await player(s, '700000112'), c = await player(s, '700000113'), d = await player(s, '700000114');
  for (const p of [a, b, c, d]) { p.send({ op: 'friends' }); await drain(p); }
  a.send({ op: 'req', uid: b.uid });
  await drain(a);
  b.send({ op: 'answer', uid: a.uid, yes: false });
  assert.deepEqual(lastOf(await drain(b), 'friends').list, [], 'a refusal makes no friends');
  assert.deepEqual(lastOf(await drain(a), 'friends').out, [], 'and clears the outgoing line');
  a.send({ op: 'req', uid: b.uid });
  await drain(a);
  a.send({ op: 'cancelReq', uid: b.uid });
  assert.deepEqual(lastOf(await drain(a), 'friends').out, []);
  assert.deepEqual(lastOf(await drain(b), 'friends').in, [], 'a cancel takes the request away');
  a.send({ op: 'req', uid: b.uid });
  await drain(a);
  await drain(b);
  b.send({ op: 'req', uid: a.uid });
  assert.deepEqual(lastOf(await drain(b), 'friends').list.map(x => x.uid), [a.uid], 'two requests meet as a friendship');
  await drain(a);
  for (const [uid, code] of [['799999999', 'none'], [a.uid, 'self'], [b.uid, 'friend'], [undefined, 'none'], [{ a: 1 }, 'none'], ['__proto__', 'none']]) {
    a.send({ op: 'req', uid });
    assert.equal((await a.next()).code, code, String(uid));
  }
  a.send({ op: 'answer', uid: c.uid, yes: true });
  assert.equal((await a.next()).code, 'none', 'an answer needs a request');
  a.send({ op: 'req', uid: c.uid });
  await drain(a);
  await drain(c);
  c.send({ op: 'answer', uid: a.uid, yes: true });
  await drain(c);
  await drain(a);
  a.send({ op: 'req', uid: d.uid });
  assert.equal((await a.next()).code, 'myFull', 'the friend limit');
  d.send({ op: 'req', uid: a.uid });
  assert.equal((await d.next()).code, 'theirFull');
  await shut(s, a, b, c, d);
});

test('friends: settings close requests, finding shows only a stub', async () => {
  const s = await bootClock({ findGap: 1000 }), a = await player(s, '700000121'), b = await player(s, '700000122');
  for (const p of [a, b]) { p.send({ op: 'friends' }); await drain(p); }
  await new Promise(resolve => setTimeout(resolve, 5));
  b.card = sampleCard('Bee');
  b.send({ op: 'card', card: b.card });
  await drain(b);
  a.send({ op: 'find', uid: b.uid });
  const found = lastOf(await drain(a), 'found');
  assert.deepEqual(found, { op: 'found', uid: b.uid, ok: true, stub: { uid: b.uid, name: 'Bee', gender: 'f', tl: 41, avatar: { k: 'kafka', o: null, lvl: 60, eid: 1 } }, rel: 'none', open: true });
  a.send({ op: 'find', uid: b.uid });
  assert.equal(lastOf(await drain(a), 'socialError').code, 'soon', 'finding is not a way to scan');
  s.clock.t += 1000;
  a.send({ op: 'find', uid: '799999998' });
  assert.deepEqual(lastOf(await drain(a), 'found'), { op: 'found', uid: '799999998', ok: false });
  b.send({ op: 'settings', reqs: 'none', guests: 'none', junk: 1 });
  assert.deepEqual(lastOf(await drain(b), 'friends').settings, { reqs: 'none', guests: 'none' });
  b.send({ op: 'settings', reqs: 'everyone', guests: 5 });
  assert.deepEqual(lastOf(await drain(b), 'friends').settings, { reqs: 'none', guests: 'none' }, 'bad values change nothing');
  s.clock.t += 1000;
  a.send({ op: 'find', uid: b.uid });
  assert.equal(lastOf(await drain(a), 'found').open, false);
  a.send({ op: 'req', uid: b.uid });
  assert.equal((await a.next()).code, 'closed');
  await shut(s, a, b);
});

test('friends: favourites, removal and the block', async () => {
  const s = await bootClock({ favMax: 1 }), a = await player(s, '700000131'), b = await player(s, '700000132'), c = await player(s, '700000133');
  await pals(s, a, b);
  c.send({ op: 'friends' });
  await drain(c);
  a.send({ op: 'req', uid: c.uid });
  await drain(a);
  c.send({ op: 'answer', uid: a.uid, yes: true });
  await drain(c);
  await drain(a);
  a.send({ op: 'fav', uid: b.uid, on: true });
  assert.equal(lastOf(await drain(a), 'friends').list.find(x => x.uid === b.uid).fav, true);
  a.send({ op: 'fav', uid: c.uid, on: true });
  assert.equal((await a.next()).code, 'favFull');
  a.send({ op: 'fav', uid: '799999997', on: true });
  assert.equal((await a.next()).code, 'notFriend');
  a.send({ op: 'fav', uid: b.uid, on: false });
  assert.equal(lastOf(await drain(a), 'friends').list.find(x => x.uid === b.uid).fav, false);
  a.send({ op: 'fav', uid: b.uid, on: true });
  await drain(a);
  a.send({ op: 'unfriend', uid: b.uid });
  assert.deepEqual(lastOf(await drain(a), 'friends').list.map(x => x.uid), [c.uid], 'removal takes the line away');
  assert.deepEqual(lastOf(await drain(b), 'friends').list, [], 'on both sides');
  a.send({ op: 'fav', uid: c.uid, on: true });
  assert.equal(lastOf(await drain(a), 'friends').list[0].fav, true, 'a removed friend frees the favourite place');
  await drain(c);
  c.send({ op: 'block', uid: a.uid });
  const blocked = lastOf(await drain(c), 'friends');
  assert.deepEqual(blocked.list, []);
  assert.deepEqual(blocked.blocks.map(x => x.uid), [a.uid]);
  assert.deepEqual(lastOf(await drain(a), 'friends').list, [], 'a block ends the friendship');
  a.send({ op: 'req', uid: c.uid });
  assert.equal((await a.next()).code, 'none', 'and hides me from them');
  s.clock.t += 2000;
  a.send({ op: 'find', uid: c.uid });
  assert.equal(lastOf(await drain(a), 'found').ok, false);
  c.send({ op: 'req', uid: a.uid });
  assert.equal((await c.next()).code, 'blocked', 'the one who blocked unblocks first');
  c.send({ op: 'unblock', uid: a.uid });
  assert.deepEqual(lastOf(await drain(c), 'friends').blocks, []);
  a.send({ op: 'req', uid: c.uid });
  assert.deepEqual(lastOf(await drain(a), 'friends').out.map(x => x.uid), [c.uid]);
  await shut(s, a, b, c);
});

test('friends: presence and status reach friends only', async () => {
  const s = await bootClock(), a = await player(s, '700000141'), b = await player(s, '700000142'), stranger = await player(s, '700000143');
  stranger.send({ op: 'friends' });
  await drain(stranger);
  await pals(s, a, b);
  a.send({ op: 'status', s: { c: 'hd', w: 7 } });
  await drain(a);
  assert.deepEqual((await drain(b)).filter(m => m.op === 'presence'), [{ op: 'presence', uid: a.uid, on: true, status: { c: 'hd', w: 7 }, ago: 0 }]);
  assert.deepEqual((await drain(stranger)).filter(m => m.op === 'presence'), [], 'strangers hear nothing');
  a.send({ op: 'status', s: 'x'.repeat(300) });
  await drain(a);
  assert.deepEqual((await drain(b)).filter(m => m.op === 'presence'), [], 'an oversized status is dropped');
  a.ws.close();
  await a.closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  s.clock.t += 5000;
  const off = lastOf(await drain(b), 'presence');
  assert.equal(off.on, false);
  assert.equal(off.status, null);
  b.send({ op: 'friends' });
  const row = lastOf(await drain(b), 'friends').list[0];
  assert.equal(row.on, false);
  assert.equal(row.ago, 5000, 'how long ago they left');
  const again = await player(s, '700000141');
  assert.equal(lastOf(await drain(b), 'presence').on, true, 'the return is heard');
  await shut(s, b, stranger, again);
});

test('cards: cleaned, limited in size and rate, seen by friends only', async () => {
  const s = await bootClock(), a = await player(s, '700000151'), b = await player(s, '700000152'), stranger = await player(s, '700000153');
  await pals(s, a, b);
  const dirty = sampleCard('A|b{c}=d#<e>\u0001 long long long name');
  dirty.sign = 'x|y{z}=#<>\u0002 ok ' + 'z'.repeat(80);
  dirty.avatar = { k: '../../etc', o: 'x y', lvl: 'high', eid: 99 };
  dirty.show = [{ k: 'kafka', o: '__proto__', lvl: 1e9, eid: -1 }, 5, { k: 7 }, { k: 'extra' }];
  dirty.merits = [{ id: 'hd', open: 1, value: '=|'.repeat(40) + 'Волна' }, { id: '<b>', value: 'x' }];
  dirty.log = [{ at: 'now', text: '|a' }, 5];
  dirty.bday = { d: 99, m: 7 };
  dirty.evil = 'should vanish';
  a.send({ op: 'card', card: dirty });
  await drain(a);
  const row = lastOf(await drain(b), 'row').row;
  assert.equal(row.name, 'Abcde long l'.trim());
  assert.equal(row.sign, ('xyz ok ' + 'z'.repeat(80)).slice(0, 40));
  assert.equal(row.avatar, null, 'a bad key is no avatar');
  assert.deepEqual(row.show, [{ k: 'kafka', o: '__proto__', lvl: 0, eid: 0 }, null, null], 'three places, numbers in range');
  assert.equal(row.on, true);
  assert.equal(row.fav, undefined);
  b.send({ op: 'cardOf', uid: a.uid });
  const card = lastOf(await drain(b), 'cardOf').card;
  assert.equal(card.evil, undefined, 'unknown fields do not pass');
  assert.equal(card.bday, null, 'a wrong birthday does not pass');
  assert.deepEqual(card.merits, [{ id: 'hd', open: true, value: 'Волна' }]);
  assert.deepEqual(card.log, [{ at: 0, text: 'a' }, { at: 0, text: '' }]);
  a.send({ op: 'card', card: sampleCard('Soon') });
  assert.equal((await a.next()).code, 'soon', 'not more often than the gap');
  s.clock.t += 20000;
  a.send({ op: 'card', card: { name: 'Big', sign: 'x'.repeat(5000) } });
  assert.equal((await a.next()).code, 'big');
  for (const bad of [null, 5, 'text', [1, 2]]) { a.send({ op: 'card', card: bad }); assert.equal((await a.next()).code, 'big'); }
  a.send({ op: 'card', card: sampleCard('Fine') });
  await drain(a);
  assert.equal(lastOf(await drain(b), 'row').row.name, 'Fine');
  stranger.send({ op: 'cardOf', uid: a.uid });
  assert.equal((await stranger.next()).code, 'notFriend', 'a card is for friends');
  await shut(s, a, b, stranger);
});

test('recent: people from a started table, stubs only, and gone when blocked', async () => {
  const s = await bootClock({ recentMax: 2 });
  const { ps } = await started(s, 3);
  const [a, b, c] = ps;
  a.send({ op: 'friends' });
  const snap = lastOf(await drain(a), 'friends');
  assert.deepEqual(snap.recent.map(x => x.uid).sort(), [b.uid, c.uid].sort());
  assert.deepEqual(Object.keys(snap.recent[0]).sort(), ['at', 'avatar', 'gender', 'name', 'tl', 'uid']);
  assert.deepEqual(snap.list, [], 'playing together is not friendship');
  b.send({ op: 'block', uid: a.uid });
  await drain(b);
  a.send({ op: 'friends' });
  assert.deepEqual(lastOf(await drain(a), 'friends').recent.map(x => x.uid), [c.uid], 'whoever blocked me leaves my list');
  b.send({ op: 'friends' });
  assert.deepEqual(lastOf(await drain(b), 'friends').recent.map(x => x.uid), [c.uid], 'and I leave theirs');
  await shut(s, ...ps);
});

test('invites: a friend online, from a lobby, not too often', async () => {
  const s = await bootClock(), a = await player(s, '700000161'), b = await player(s, '700000162'), c = await player(s, '700000163');
  await pals(s, a, b);
  a.send({ op: 'invite', uid: b.uid });
  assert.equal((await a.next()).code, 'noTable');
  a.send({ op: 'tableNew', name: 'A', diff: 'hard' });
  const t = await a.next();
  a.send({ op: 'invite', uid: c.uid });
  assert.equal((await a.next()).code, 'notFriend');
  a.send({ op: 'invite', uid: b.uid });
  assert.deepEqual(lastOf(await drain(a), 'invited'), { op: 'invited', uid: b.uid });
  const got = lastOf(await drain(b), 'invite');
  assert.equal(got.from, a.uid);
  assert.equal(got.code, t.code);
  assert.equal(got.kind, 'table');
  assert.equal(got.diff, 'hard');
  a.send({ op: 'invite', uid: b.uid });
  assert.equal((await a.next()).code, 'soon');
  b.ws.close();
  await b.closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  await drain(a);
  s.clock.t += 3000;
  a.send({ op: 'invite', uid: b.uid });
  assert.equal(lastOf(await drain(a), 'socialError').code, 'offline');
  await shut(s, a, c);
});

test('deleting an account takes it from every list', async () => {
  const s = await bootClock(), a = await player(s, '700000171'), b = await player(s, '700000172'), c = await player(s, '700000173'), d = await player(s, '700000174');
  await pals(s, a, b);
  for (const p of [c, d]) { p.send({ op: 'friends' }); await drain(p); }
  c.send({ op: 'req', uid: a.uid });
  await drain(c);
  d.send({ op: 'block', uid: a.uid });
  await drain(d);
  await drain(a);
  a.send({ op: 'deleteMe' });
  await a.closed;
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.deepEqual(lastOf(await drain(b), 'friends').list, [], 'friends lose the line');
  assert.deepEqual(lastOf(await drain(c), 'friends').out, [], 'a request to them is gone');
  assert.deepEqual(lastOf(await drain(d), 'friends').blocks, [], 'and so is the block');
  assert.equal(s.app.accounts.get(a.uid), null);
  await shut(s, b, c, d);
});

test('the social data survives a restart', async () => {
  const dataDir = fs.mkdtempSync(path.join(dir, 'social-'));
  const s = await bootClock({ dataDir }), a = await player(s, '700000181'), b = await player(s, '700000182');
  await pals(s, a, b);
  a.send({ op: 'card', card: sampleCard('Kept') });
  await drain(a);
  a.send({ op: 'fav', uid: b.uid, on: true });
  await drain(a);
  await shut(s, a, b);
  const again = await bootClock({ dataDir }), x = await player(again, '700000181'), y = await player(again, '700000182');
  y.send({ op: 'friends' });
  assert.equal(lastOf(await drain(y), 'friends').list[0].name, 'Kept');
  x.send({ op: 'friends' });
  assert.equal(lastOf(await drain(x), 'friends').list[0].fav, true);
  const text = fs.readFileSync(path.join(dataDir, 'accounts.jsonl'), 'utf8');
  assert.ok(!text.includes(SECRET));
  await shut(again, x, y);
});

test('a long life of the data file is compacted while running', async () => {
  const s = await bootClock(), a = await player(s, '700000191');
  const file = path.join(s.config.dataDir, 'accounts.jsonl');
  s.app.accounts.written = 1000000;
  a.send({ op: 'friends' });
  await drain(a);
  a.send({ op: 'settings', reqs: 'none' });
  await drain(a);
  assert.equal(fs.readFileSync(file, 'utf8').trim().split('\n').length, 1);
  assert.equal(s.app.accounts.written, 0);
  await shut(s, a);
});

test('a real clock turns about 30 turns a second', async () => {
  const s = await boot({ dataDir: fs.mkdtempSync(path.join(dir, 'data-')), rate: 100000 });
  const { ps, code } = await started(s, 2);
  await new Promise(resolve => setTimeout(resolve, 600));
  const n = s.app.tables.get(code).n;
  assert.ok(n >= 12 && n <= 22, 'turns in 600 ms: ' + n);
  await shut(s, ...ps);
});

require('../js/net98.js');

function storageOf(seed) {
  const box = new Map(Object.entries(seed || {}));
  return { box, getItem: k => (box.has(k) ? box.get(k) : null), setItem: (k, v) => box.set(k, String(v)), removeItem: k => box.delete(k) };
}

const until = async (cond, what) => {
  for (let i = 0; i < 300; i++) {
    if (cond()) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.fail('timed out: ' + what);
};

const install = (s, seed) => globalThis.createNet98(storageOf(Object.assign({ 'net98.url': s.url }, seed)));
const installOf = (s, acc) => install(s, { 'net98.account': JSON.stringify(acc) });
const finish = async (s, ...nets) => { for (const n of nets) n.disconnect('off'); await new Promise(resolve => setTimeout(resolve, 20)); await s.app.close(); };

test('client: every install has its own UID and no network before consent', async () => {
  const s = await bootClock();
  const real = globalThis.WebSocket;
  let sockets = 0;
  globalThis.WebSocket = class extends real { constructor(url) { super(url); sockets++; } };
  const a = install(s), b = install(s);
  assert.match(a.uid(), /^7\d{8}$/);
  assert.notEqual(a.uid(), b.uid());
  assert.equal(a.uid(), a.uid());
  assert.match(a.account().secret, /^[0-9A-HJKMNP-TV-Z]{16}$/);
  assert.equal(a.hasConsent(), false);
  a.boot();
  a.connect();
  a.modemChanged();
  assert.equal(sockets, 0);
  assert.equal(a.state, 'off');
  assert.equal(a.bars(), 0);
  a.setConsent(false);
  a.boot();
  assert.equal(sockets, 0);
  a.setConsent(true);
  assert.equal(sockets, 1);
  await until(() => a.state === 'online', 'first connect');
  assert.equal(s.app.accounts.get(a.uid()).hash, crypto.createHash('sha256').update(a.account().secret).digest('hex'));
  assert.equal(a.account().confirmed, true);
  await until(() => a.rtt != null, 'first echo');
  assert.equal(a.bars(), 4);
  globalThis.WebSocket = real;
  await finish(s, a, b);
});

test('client: the UID stays after a restart of the game, and a second run connects by itself', async () => {
  const s = await bootClock();
  const store = storageOf({ 'net98.url': s.url });
  const a = globalThis.createNet98(store);
  a.setConsent(true);
  await until(() => a.state === 'online', 'first run');
  const uid = a.uid();
  a.disconnect('off');
  const again = globalThis.createNet98(store);
  assert.equal(again.uid(), uid);
  assert.equal(again.hasConsent(), true);
  again.boot();
  await until(() => again.state === 'online', 'second run');
  again.disconnect('off');
  again.setAuto(false);
  const third = globalThis.createNet98(store);
  third.boot();
  assert.equal(third.state, 'off');
  third.connect();
  await until(() => third.state === 'online', 'by hand');
  await finish(s, third);
});

test('client: a taken UID on the first connect is replaced and saved', async () => {
  const s = await bootClock();
  const owner = await player(s, '700000080');
  const store = storageOf({ 'net98.url': s.url, 'net98.account': JSON.stringify({ uid: '700000080', secret: OTHER, consent: true, auto: true, confirmed: false }) });
  const a = globalThis.createNet98(store);
  a.connect();
  await until(() => a.state === 'online', 'connect');
  assert.notEqual(a.uid(), '700000080');
  assert.equal(JSON.parse(store.getItem('net98.account')).uid, a.uid());
  assert.equal(JSON.parse(store.getItem('net98.account')).confirmed, true);
  owner.ws.close();
  await owner.closed;
  await finish(s, a);
});

test('client: a wrong secret stops the client and does not retry', async () => {
  const s = await bootClock();
  const owner = await player(s, '700000081');
  const a = installOf(s, { uid: '700000081', secret: OTHER, consent: true, auto: true, confirmed: true });
  a.connect();
  await until(() => a.state === 'denied', 'denied');
  await new Promise(resolve => setTimeout(resolve, 60));
  assert.equal(a.state, 'denied');
  assert.equal(s.app.accounts.get('700000081').hash, crypto.createHash('sha256').update(SECRET).digest('hex'));
  owner.ws.close();
  await owner.closed;
  await finish(s, a);
});

test('client: the account code brings the UID back on another install', async () => {
  const s = await bootClock();
  const a = install(s);
  a.setConsent(true);
  await until(() => a.state === 'online', 'first device');
  const uid = a.uid(), code = a.code();
  assert.match(code, /^7\d{8}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
  const store = storageOf({ 'net98.url': s.url });
  const b = globalThis.createNet98(store);
  const own = b.uid();
  assert.notEqual(own, uid);
  const answer = await new Promise(resolve => b.useCode(code.toLowerCase().replace(/-/g, ' '), resolve));
  assert.deepEqual(answer, { ok: true, text: 'Аккаунт перенесён' });
  assert.equal(b.uid(), uid);
  assert.equal(b.state, 'online');
  assert.equal(JSON.parse(store.getItem('net98.account')).uid, uid);
  await until(() => a.state === 'replaced', 'the first device is pushed out');
  await new Promise(resolve => setTimeout(resolve, 40));
  assert.equal(a.state, 'replaced');
  assert.equal(b.state, 'online');
  await finish(s, a, b);
});

test('client: a bad code changes nothing', async () => {
  const s = await bootClock();
  const a = install(s);
  a.setConsent(true);
  await until(() => a.state === 'online', 'owner');
  const store = storageOf({ 'net98.url': s.url });
  const b = globalThis.createNet98(store);
  b.setConsent(true);
  await until(() => b.state === 'online', 'second');
  const own = b.uid(), before = store.getItem('net98.account');
  assert.equal((await new Promise(resolve => b.useCode('nonsense', resolve))).text, 'Код набран неверно');
  const twice = [];
  b.useCode(a.uid() + '-ZZZZ-ZZZZ-ZZZZ-ZZZZ', r => twice.push(r.text));
  b.useCode(a.uid() + '-YYYY-YYYY-YYYY-YYYY', r => twice.push(r.text));
  assert.deepEqual(twice, ['Проверяем код…'], 'a second code waits for the first answer');
  await until(() => twice.length === 2, 'first answer');
  assert.equal(b.uid(), own);
  await until(() => b.state === 'online', 'back after the double press');
  assert.equal(b.state, 'online');
  const wrongSecret = a.uid() + '-ZZZZ-ZZZZ-ZZZZ-ZZZZ';
  assert.equal((await new Promise(resolve => b.useCode(wrongSecret, resolve))).text, 'Сервер не принял этот код');
  assert.equal(b.uid(), own);
  assert.equal(store.getItem('net98.account'), before);
  await until(() => b.state === 'online', 'back on the old account');
  const unknown = '799999998-' + a.account().secret.match(/.{4}/g).join('-');
  assert.equal((await new Promise(resolve => b.useCode(unknown, resolve))).text, 'Сервер не принял этот код');
  assert.equal(s.app.accounts.get('799999998'), null);
  assert.equal(b.uid(), own);
  await until(() => b.state === 'online', 'back again');
  assert.equal(a.state, 'online');
  assert.equal((await new Promise(resolve => b.useCode(b.code(), resolve))).text, 'Этот код уже здесь');
  await finish(s, a, b);
});

test('client: deleting the account clears the server and starts over without consent', async () => {
  const s = await bootClock();
  const a = install(s);
  assert.deepEqual(await new Promise(resolve => { const u = a.uid(); a.deleteAccount(r => { assert.notEqual(a.uid(), u); resolve(r); }); }), { ok: true });
  a.setConsent(true);
  await until(() => a.state === 'online', 'connect');
  const uid = a.uid();
  assert.deepEqual(await new Promise(resolve => a.deleteAccount(resolve)), { ok: true });
  assert.equal(s.app.accounts.get(uid), null);
  assert.notEqual(a.uid(), uid);
  assert.equal(a.hasConsent(), false);
  assert.equal(a.state, 'off');
  const offline = install(s);
  offline.account().confirmed = true;
  assert.equal((await new Promise(resolve => offline.deleteAccount(resolve))).text, 'Нет связи с сервером');
  await finish(s, a, offline);
});

const sampleExpress = o => Object.assign({ flags: ['doom', 'ending'], party: ['trail', 'march'], roster: [['trail', 50, 0, null], ['kafka', 70, 2, 'x_outfit']], record: 'menu', lead: { k: 'kafka', o: null, lvl: 70, eid: 2 } }, o);

async function hosted(s, n) {
  const host = await player(s, '710000000'), guests = [];
  host.send({ op: 'friends' });
  await drain(host);
  host.send({ op: 'express', express: sampleExpress() });
  await drain(host);
  for (let i = 0; i < n; i++) {
    const g = await player(s, '71000000' + (i + 1));
    await pals(s, host, g);
    guests.push(g);
  }
  return { host, guests };
}

const enter = async (c, uid) => {
  c.send({ op: 'visitEnter', uid, look: { k: 'clara', o: null, lvl: 10, eid: 0 } });
  return drain(c);
};

test('the Express copy is cleaned and limited, and friends learn that it exists', async () => {
  const s = await bootClock();
  const a = await player(s, '710000000'), b = await player(s, '710000001');
  await pals(s, a, b);
  assert.equal(lastOf(await (async () => { a.send({ op: 'friends' }); return drain(a); })(), 'friends').list[0].expr, false);
  b.send({ op: 'express', express: { flags: ['ok', 'bad flag!', { x: 1 }], party: ['trail', '<script>', 'a', 'b', 'c', 'd'], roster: [['kafka', 5000, 99, 'o k'], 'junk', ['clara', 1, 1, null]], record: 'a|b', lead: { k: 'kafka', lvl: 1, eid: 0, extra: 'x' }, junk: 'x'.repeat(100) } });
  await drain(b);
  const seen = lastOf(await drain(a), 'row');
  assert.equal(seen.row.expr, true, 'the row says the Express has come');
  const saved = s.app.accounts.get(b.uid).express;
  assert.deepEqual(saved.flags, ['ok']);
  assert.deepEqual(saved.party, ['trail', 'a', 'b'], 'four places at most, bad names out');
  assert.deepEqual(saved.roster, [['kafka', 0, 0, null], ['clara', 1, 1, null]]);
  assert.equal(saved.record, null);
  assert.equal(saved.junk, undefined);
  b.send({ op: 'express', express: sampleExpress() });
  assert.equal((await b.next()).code, 'soon', 'not too often');
  s.advance(5000);
  b.send({ op: 'express', express: sampleExpress({ flags: new Array(1000).fill('long_flag_name_here') }) });
  assert.equal((await b.next()).code, 'big', 'not too big');
  b.send({ op: 'express', express: 'nope' });
  assert.equal((await b.next()).code, 'big');
  await shut(s, a, b);
});

test('who may come in: friends, no block, open doors, an Express, three guests', async () => {
  const s = await bootClock();
  const { host, guests } = await hosted(s, 4);
  const [g1, g2, g3, g4] = guests;
  const stranger = await player(s, '720000000');
  const no = async (c, uid, code) => assert.equal(lastOf(await enter(c, uid), 'visitNo').code, code);
  await no(stranger, host.uid, 'notFriend');
  await no(g1, '799999999', 'none');
  await no(host, host.uid, 'none');
  host.send({ op: 'settings', guests: 'none' });
  await drain(host);
  await no(g1, host.uid, 'closed');
  host.send({ op: 'settings', guests: 'friends' });
  await drain(host);
  const noExpress = await player(s, '730000000');
  await pals(s, noExpress, g1);
  await no(g1, noExpress.uid, 'noExpress');
  const seen = lastOf(await enter(g1, host.uid), 'visit');
  assert.deepEqual(seen.express.flags, ['doom', 'ending']);
  assert.equal(seen.on, true);
  assert.deepEqual(seen.peers.map(p => [p.uid, p.host]), [[host.uid, true]]);
  const toHost = lastOf(await drain(host), 'peerIn');
  assert.equal(toHost.peer.uid, g1.uid);
  assert.equal(toHost.peer.look.k, 'clara');
  await enter(g2, host.uid);
  assert.deepEqual(lastOf(await drain(g1), 'peerIn').peer.uid, g2.uid, 'guests see each other');
  await enter(g3, host.uid);
  await no(g4, host.uid, 'full');
  g1.send({ op: 'visitLeave' });
  await drain(g1);
  assert.equal(lastOf(await drain(g2), 'peerOut').uid, g1.uid);
  const second = lastOf(await enter(g4, host.uid), 'visit');
  assert.equal(second.peers.length, 3, 'a place came free');
  await shut(s, host, g1, g2, g3, g4, stranger, noExpress);
});

test('places and phrases go only to the people of the room, within limits', async () => {
  const s = await bootClock();
  const { host, guests } = await hosted(s, 2);
  const [a, b] = guests;
  const outsider = await player(s, '720000000');
  await enter(a, host.uid);
  await enter(b, host.uid);
  await drain(host);
  await drain(a);
  a.send({ op: 'pos', m: 'express', x: 12, y: 7, d: 'left', w: true });
  a.send({ op: 'pos', m: 'bad map!', x: 9999, y: -3, d: 'sideways' });
  await drain(a);
  const heard = (await drain(b)).filter(m => m.op === 'pos');
  assert.deepEqual(heard[0], { op: 'pos', uid: a.uid, m: 'express', x: 12, y: 7, d: 'left', w: true });
  assert.deepEqual(heard[1], { op: 'pos', uid: a.uid, m: null }, 'a bad map means nowhere');
  assert.equal((await drain(outsider)).filter(m => m.op === 'pos').length, 0);
  assert.equal((await drain(host)).filter(m => m.op === 'pos').length, 2);
  for (let i = 0; i < 12; i++) a.send({ op: 'pos', m: 'express', x: i, y: 7, d: 'left', w: false });
  await drain(a);
  assert.ok((await drain(b)).filter(m => m.op === 'pos').length <= 8, 'not more than 8 a second');
  s.advance(1000);
  host.send({ op: 'pos', m: 'express', x: 20, y: 7, d: 'down', w: false });
  await drain(host);
  assert.equal(lastOf(await drain(a), 'pos').uid, host.uid, 'the host is seen too');
  a.send({ op: 'visitSay', id: 2 });
  a.send({ op: 'visitSay', id: 3 });
  a.send({ op: 'visitSay', id: 99 });
  assert.deepEqual((await drain(a)).filter(m => m.op === 'visitSay'), [{ op: 'visitSay', uid: a.uid, id: 2 }], 'once a second, known phrases only');
  assert.deepEqual((await drain(b)).filter(m => m.op === 'visitSay'), [{ op: 'visitSay', uid: a.uid, id: 2 }]);
  assert.equal((await drain(host)).filter(m => m.op === 'visitSay').length, 1);
  await shut(s, host, a, b, outsider);
});

test('moderation: a plain name stays plain, its entries go, a book can be cleared', async () => {
  const s = await bootClock();
  const { host, guests } = await hosted(s, 2);
  const [a, b] = guests;
  await enter(a, host.uid);
  await enter(b, host.uid);
  a.send({ op: 'card', card: { name: 'Плохое имя', sign: 'плохая подпись', gender: 'm', tl: 5 } });
  await drain(a);
  assert.equal(lastOf(await drain(host), 'row').row.name, 'Плохое имя');
  a.send({ op: 'bookSign', text: 'плохая запись' });
  b.send({ op: 'bookSign', id: 0 });
  await drain(a);
  await drain(b);
  assert.equal(lastOf(await drain(host), 'book').list.length, 2);

  assert.deepEqual((await adminGet(s.port, 'rename/' + a.uid)).body, { uid: a.uid, plainName: true });
  const heard = await drain(host);
  assert.equal(lastOf(heard, 'row').row.name, 'Первопроходец', 'friends see it at once');
  assert.equal(lastOf(heard, 'row').row.sign, '');
  assert.deepEqual(lastOf(heard, 'book').list.map(e => e.uid), [b.uid], 'the entries of that player leave other books');

  s.advance(s.config.cardGap);
  a.send({ op: 'card', card: { name: 'Снова плохое', sign: 'снова', gender: 'm', tl: 6 } });
  await drain(a);
  const again = lastOf(await drain(host), 'row').row;
  assert.deepEqual([again.name, again.sign, again.tl], ['Первопроходец', '', 6], 'a new card keeps the plain name and the rest of the card');
  a.send({ op: 'bookSign', text: 'снова плохая запись' });
  assert.equal((await a.next()).code, 'bookEmpty', 'no free text');
  a.send({ op: 'bookSign', id: 1 });
  await drain(a);
  assert.equal(lastOf(await drain(host), 'book').list.find(e => e.uid === a.uid).id, 1, 'a ready wish is still allowed');

  assert.equal((await adminGet(s.port, 'unrename/' + a.uid)).body.plainName, false);
  await drain(host);
  s.advance(s.config.cardGap);
  a.send({ op: 'card', card: { name: 'Хорошее имя', sign: '', gender: 'm', tl: 6 } });
  await drain(a);
  assert.equal(lastOf(await drain(host), 'row').row.name, 'Хорошее имя');

  assert.deepEqual((await adminGet(s.port, 'book-clear/' + host.uid)).body, { uid: host.uid, book: 0 });
  assert.deepEqual(lastOf(await drain(host), 'book').list, []);
  assert.equal((await adminGet(s.port, 'rename/799999999')).status, 404);
  assert.equal((await adminGet(s.port, 'book-clear/' + host.uid, { 'CF-Connecting-IP': '203.0.113.7' })).status, 403);
  await shut(s, host, a, b);
});

test('the guest book: one entry a day from a guest, cleaned, only the host removes', async () => {
  const s = await bootClock();
  const { host, guests } = await hosted(s, 2);
  const [a, b] = guests;
  a.send({ op: 'bookSign', id: 1 });
  assert.equal((await a.next()).code, 'none', 'only during a visit');
  await enter(a, host.uid);
  a.send({ op: 'bookSign' });
  assert.equal((await a.next()).code, 'bookEmpty');
  a.send({ op: 'bookSign', id: 99 });
  assert.equal((await a.next()).code, 'bookEmpty');
  await drain(host);
  a.send({ op: 'bookSign', text: '  <b>Привет</b> | {всем} ' + 'x'.repeat(100) });
  const book = lastOf(await drain(a), 'book');
  assert.equal(book.uid, host.uid);
  assert.equal(book.list.length, 1);
  assert.equal(book.list[0].uid, a.uid);
  assert.ok(book.list[0].text.length <= 40 && !/[<>|{}]/.test(book.list[0].text), book.list[0].text);
  assert.equal(lastOf(await drain(host), 'book').list.length, 1, 'the host sees it at once');
  a.send({ op: 'bookSign', id: 0 });
  assert.equal((await a.next()).code, 'bookDay', 'once a day');
  s.advance(24 * 3600000);
  await drain(a);
  a.send({ op: 'bookSign', id: 0 });
  assert.equal(lastOf(await drain(a), 'book').list[0].id, 0, 'tomorrow again, with a ready wish');
  await drain(host);
  await enter(b, host.uid);
  b.send({ op: 'bookDel', at: 1, uid: a.uid });
  await drain(b);
  assert.equal(s.app.accounts.get(host.uid).book.length, 2, 'a guest removes nothing of the host');
  const first = s.app.accounts.get(host.uid).book[1];
  host.send({ op: 'bookDel', at: first.at, uid: first.uid });
  assert.equal(lastOf(await drain(host), 'book').list.length, 1);
  assert.equal(lastOf(await drain(b), 'book').list.length, 1, 'a guest sees that too');
  const late = await (async () => { host.ws.close(); await host.closed; return player(s, host.uid); })();
  late.send({ op: 'friends' });
  assert.equal(lastOf(await drain(late), 'book').list.length, 1, 'the book comes with the login');
  for (let i = 0; i < 40; i++) s.app.accounts.get(late.uid).book.push({ at: i, uid: '799', name: 'x', id: 0 });
  s.advance(24 * 3600000);
  b.send({ op: 'bookSign', id: 2 });
  assert.equal(lastOf(await drain(b), 'book').list.length, 30, 'thirty entries at most');
  await shut(s, late, a, b);
});

test('the gift: 30 s of a visit, both sides, once a day for a pair, three a day, kept until answered', async () => {
  const s = await bootClock();
  const { host, guests } = await hosted(s, 4);
  const [a, b, c, d] = guests;
  const gifts = list => list.filter(m => m.op === 'gift');
  await enter(a, host.uid);
  s.advance(29000);
  assert.equal(gifts(await drain(a)).length, 0, 'not before 30 s');
  s.advance(1000);
  const toGuest = gifts(await drain(a)), toHost = gifts(await drain(host));
  assert.equal(toGuest.length, 1);
  assert.equal(toGuest[0].credits, 2000);
  assert.equal(toHost.length, 1, 'the host gets one too');
  assert.notEqual(toGuest[0].id, toHost[0].id);
  a.send({ op: 'visitLeave' });
  await drain(a);
  await enter(a, host.uid);
  s.advance(60000);
  assert.equal(gifts(await drain(a)).length, 0, 'a pair gets it once a day');
  a.send({ op: 'visitLeave' });
  await drain(a);
  host.send({ op: 'visitEnter', uid: a.uid });
  await drain(host);
  a.send({ op: 'express', express: sampleExpress() });
  await drain(a);
  host.send({ op: 'visitEnter', uid: a.uid });
  await drain(host);
  s.advance(40000);
  assert.equal(gifts(await drain(host)).length, 0, 'in any direction');
  host.send({ op: 'visitLeave' });
  await drain(host);
  await drain(a);
  await enter(b, host.uid);
  s.advance(31000);
  assert.equal(gifts(await drain(host)).length, 1);
  b.send({ op: 'visitLeave' });
  await drain(b);
  await enter(c, host.uid);
  s.advance(31000);
  assert.equal(gifts(await drain(host)).length, 1, 'the third of the day');
  assert.equal(gifts(await drain(c)).length, 1);
  c.send({ op: 'visitLeave' });
  await drain(c);
  await enter(d, host.uid);
  s.advance(31000);
  assert.equal(gifts(await drain(host)).length, 0, 'a limit reached: the host gets no more');
  assert.equal(gifts(await drain(d)).length, 1, 'but the guest still does');
  const again = await (async () => { d.ws.close(); await d.closed; return player(s, d.uid); })();
  again.send({ op: 'friends' });
  const repeat = gifts(await drain(again));
  assert.equal(repeat.length, 1, 'an unanswered gift comes again');
  again.send({ op: 'giftAck', id: repeat[0].id });
  await drain(again);
  const third = await (async () => { again.ws.close(); await again.closed; return player(s, d.uid); })();
  third.send({ op: 'friends' });
  assert.equal(gifts(await drain(third)).length, 0, 'an answered one does not');
  await shut(s, host, a, b, c, third);
});

test('the day of a gift changes at 04:00 UTC', async () => {
  const s = await bootClock();
  s.clock.t = Date.UTC(2026, 10, 2, 3, 59, 0);
  const { host, guests } = await hosted(s, 1);
  const [a] = guests;
  const gifts = list => list.filter(m => m.op === 'gift');
  await enter(a, host.uid);
  s.advance(30000);
  assert.equal(gifts(await drain(a)).length, 1);
  a.send({ op: 'visitLeave' });
  await drain(a);
  s.clock.t = Date.UTC(2026, 10, 2, 4, 0, 1);
  await enter(a, host.uid);
  s.advance(30000);
  assert.equal(gifts(await drain(a)).length, 1, 'a new day after 04:00');
  await shut(s, host, a);
});

test('a host away: the echo, a gift that waits, and a note about visitors', async () => {
  const s = await bootClock();
  const { host, guests } = await hosted(s, 2);
  const [a, b] = guests;
  host.ws.close();
  await host.closed;
  await new Promise(resolve => setTimeout(resolve, 20));
  const seen = lastOf(await enter(a, host.uid), 'visit');
  assert.equal(seen.on, false, 'the Express is open without the host');
  assert.deepEqual(seen.peers, []);
  await enter(b, host.uid);
  s.advance(31000);
  await drain(a);
  const back = await player(s, host.uid);
  back.send({ op: 'friends' });
  const list = await drain(back);
  assert.equal(list.filter(m => m.op === 'gift').length, 2, 'the gifts waited');
  assert.deepEqual(lastOf(list, 'awayGuests').names.sort(), ['Первопроходец', 'Первопроходец'].sort(), 'visitors are named');
  assert.equal(list.filter(m => m.op === 'peerIn').length, 2, 'those still inside are shown');
  assert.equal(lastOf(await drain(a), 'peerIn').peer.host, true, 'and they see the host come');
  const later = await (async () => { back.ws.close(); await back.closed; return player(s, host.uid); })();
  later.send({ op: 'friends' });
  assert.equal(lastOf(await drain(later), 'awayGuests'), undefined, 'the note shows once');
  s.clock.t += 31 * 24 * 3600000;
  const old = await (async () => { later.ws.close(); await later.closed; return player(s, host.uid); })();
  old.send({ op: 'friends' });
  assert.equal((await drain(old)).filter(m => m.op === 'gift').length, 0, 'a gift waits 30 days');
  await shut(s, old, a, b);
});

test('a block sends the guest home, a host who deletes the account too, and the book forgets deleted guests', async () => {
  const s = await bootClock();
  const { host, guests } = await hosted(s, 3);
  const [a, b, c] = guests;
  await enter(a, host.uid);
  host.send({ op: 'block', uid: a.uid });
  await drain(host);
  assert.equal(lastOf(await drain(a), 'visitEnd').why, 'closed');
  assert.equal(lastOf(await enter(a, host.uid), 'visitNo').code, 'none', 'and the door stays shut');
  await enter(b, host.uid);
  host.send({ op: 'unfriend', uid: b.uid });
  await drain(host);
  assert.equal(lastOf(await drain(b), 'visitEnd'), undefined, 'one who is no longer a friend finishes the visit');
  await enter(c, host.uid);
  c.send({ op: 'bookSign', id: 0 });
  await drain(c);
  assert.equal(s.app.accounts.get(host.uid).book.length, 1);
  await drain(host);
  c.send({ op: 'deleteMe' });
  await c.closed;
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(s.app.accounts.get(host.uid).book.length, 0, 'a deleted account leaves the book');
  await drain(b);
  host.send({ op: 'deleteMe' });
  await host.closed;
  assert.equal(lastOf(await drain(b), 'visitEnd').why, 'gone');
  await shut(s, a, b);
});

test('a host visiting someone is not in the own room, and comes back to it', async () => {
  const s = await bootClock();
  const { host, guests } = await hosted(s, 2);
  const [a, b] = guests;
  a.send({ op: 'express', express: sampleExpress() });
  await drain(a);
  await enter(b, host.uid);
  await drain(host);
  const visited = lastOf(await enter(host, a.uid), 'visit');
  assert.equal(visited.uid, a.uid);
  assert.equal(lastOf(await drain(b), 'peerOut').uid, host.uid, 'guests see the host leave');
  const seenByGuest = lastOf(await enter(b, host.uid), 'visit');
  assert.ok(!seenByGuest.peers.some(p => p.host), 'and no host in the room');
  host.send({ op: 'visitLeave' });
  const home = await drain(host);
  assert.equal(lastOf(home, 'peerIn').peer.uid, b.uid, 'at home the guests are there');
  assert.equal(lastOf(await drain(b), 'peerIn').peer.host, true);
  await shut(s, host, a, b);
});

test('an invitation to the Express needs an Express, no table', async () => {
  const s = await bootClock();
  const a = await player(s, '710000000'), b = await player(s, '710000001');
  await pals(s, a, b);
  a.send({ op: 'invite', uid: b.uid, kind: 'visit' });
  assert.equal((await a.next()).code, 'noExpress');
  a.send({ op: 'express', express: sampleExpress() });
  await drain(a);
  await drain(b);
  a.send({ op: 'invite', uid: b.uid, kind: 'visit' });
  await drain(a);
  const got = lastOf(await drain(b), 'invite');
  assert.equal(got.kind, 'visit');
  assert.equal(got.from, a.uid);
  assert.equal(got.code, undefined);
  await shut(s, a, b);
});

test('client: table messages land in plain fields and in the one callback', async () => {
  const s = await bootClock();
  const a = install(s);
  a.setConsent(true);
  await until(() => a.state === 'online', 'connect');
  const seen = [];
  a.onNet = m => seen.push(m.op);
  assert.equal(a.send('tableNew', { name: 'A', open: true }), true);
  await until(() => a.table, 'table');
  assert.equal(a.seat, 0);
  a.send('tableList');
  await until(() => a.tables.length === 1, 'list');
  a.send('tableStart');
  await until(() => a.tableError, 'not enough players');
  assert.equal(a.tableError.code, 'ready');
  assert.ok(a.table.at > 0, 'the table message keeps the time it came');
  assert.equal(a.me.table, a.table.code, 'the account knows its table');
  a.send('tableLeave', { keep: true });
  await until(() => !a.table, 'stepped away');
  assert.ok(a.me.table, 'a closed game can come back');
  a.send('tableBack', { code: a.me.table, since: 0 });
  await until(() => a.me.table === null, 'an empty lobby does not wait');
  a.send('tableNew', { name: 'A' });
  await until(() => a.table, 'a new table');
  a.send('tableLeave');
  await until(() => !a.table, 'left');
  assert.equal(a.seat, -1);
  assert.equal(a.me.table, null);
  assert.deepEqual(seen, ['table', 'tables', 'tableError', 'tableGone', 'tableError', 'table', 'tableGone']);
  a.disconnect('off');
  assert.equal(a.send('tableList'), false);
  await finish(s, a);
});

function fakeSockets() {
  const made = [];
  const Fake = class {
    constructor(url) { this.url = url; this.readyState = 0; this.sent = []; this.closed = false; made.push(this); }
    send(text) { this.sent.push(JSON.parse(text)); }
    close() { this.closed = true; this.readyState = 3; }
    open() { this.readyState = 1; this.onopen(); }
    hear(m) { this.onmessage({ data: JSON.stringify(m) }); }
    drop() { this.readyState = 3; this.onclose({ code: 1006 }); }
  };
  const real = globalThis.WebSocket;
  globalThis.WebSocket = Fake;
  return { made, restore() { globalThis.WebSocket = real; } };
}

const consented = () => globalThis.createNet98(storageOf({ 'net98.account': JSON.stringify({ uid: '700000099', secret: SECRET, consent: true, auto: true, confirmed: true }) }));

test('client: hello tells the game build, and a stale protocol stops the retries', async () => {
  const f = fakeSockets();
  globalThis.Hsr98 = { HD: { SIM: 'sim00001' }, BUILD_VERSION: '1.7.0' };
  globalThis.Hsr98Standalone = 'apk';
  const a = consented();
  a.connect();
  assert.equal(a.url(), 'wss://pennygachi.men/api/net');
  assert.equal(f.made[0].url, 'wss://pennygachi.men/api/net');
  assert.equal(a.state, 'connecting');
  f.made[0].open();
  assert.deepEqual(f.made[0].sent[0], { op: 'hello', uid: '700000099', secret: SECRET, proto: 1, fresh: false, code: false, sim: 'sim00001', ver: '1.7.0', src: 'apk' });
  delete globalThis.Hsr98;
  delete globalThis.Hsr98Standalone;
  f.made[0].hear({ op: 'error', code: 'proto' });
  f.made[0].drop();
  assert.equal(a.state, 'outdated');
  await new Promise(resolve => setTimeout(resolve, 2100));
  assert.equal(f.made.length, 1);
  f.restore();
});

test('client: a lost link retries after 2 s, and the backoff resets once online', async () => {
  const f = fakeSockets();
  const a = consented();
  a.connect();
  f.made[0].open();
  f.made[0].hear({ op: 'me', uid: '700000099' });
  assert.equal(a.state, 'online');
  f.made[0].drop();
  assert.equal(a.state, 'offline');
  assert.equal(a.me, null);
  assert.equal(a.bars(), 0);
  await new Promise(resolve => setTimeout(resolve, 2100));
  assert.equal(f.made.length, 2);
  assert.equal(a.state, 'connecting');
  a.disconnect('off');
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(a.state, 'off');
  f.restore();
});

test('client: a link that went silent is dropped even if the socket looks open', () => {
  const f = fakeSockets();
  const realInterval = globalThis.setInterval, realNow = performance.now;
  let tick = null, at = 1000;
  globalThis.setInterval = fn => { tick = fn; return 1; };
  performance.now = () => at;
  const a = consented();
  a.connect();
  f.made[0].open();
  f.made[0].hear({ op: 'me', uid: '700000099' });
  assert.equal(f.made[0].sent.filter(m => m.op === 'echo').length, 1);
  at += 40;
  f.made[0].hear({ op: 'echo', t: 1000 });
  assert.equal(a.rtt, 40);
  assert.equal(a.bars(), 4);
  at += 300;
  f.made[0].hear({ op: 'echo', t: at - 300 });
  assert.equal(a.rtt, 40 * 0.8 + 300 * 0.2);
  assert.equal(a.bars(), 4);
  a.rtt = 200;
  assert.equal(a.bars(), 3);
  a.rtt = 400;
  assert.equal(a.bars(), 2);
  a.rtt = 900;
  assert.equal(a.bars(), 1);
  for (let i = 0; i < 3; i++) { at += 5000; tick(); }
  assert.equal(a.state, 'online');
  at += 60000;
  f.made[0].hear({ op: 'echo', t: at - 1 });
  tick();
  assert.equal(a.state, 'online');
  at += 5000;
  tick();
  at += 11000;
  tick();
  assert.equal(a.state, 'offline');
  assert.equal(f.made[0].closed, true);
  a.disconnect('off');
  globalThis.setInterval = realInterval;
  performance.now = realNow;
  f.restore();
});

test('client: nothing but hello leaves before the server has answered it', () => {
  const f = fakeSockets();
  const a = consented();
  a.connect();
  f.made[0].open();
  assert.equal(a.send('cmd', { c: { t: 'stop' } }), false, 'a command waits for the answer');
  assert.deepEqual(f.made[0].sent.map(m => m.op), ['hello']);
  f.made[0].hear({ op: 'me', uid: '700000099' });
  assert.equal(a.send('cmd', { c: { t: 'stop' } }), true);
  a.disconnect('off');
  f.restore();
});

test('client: the modem of the system switches the link', () => {
  const f = fakeSockets();
  globalThis.isOnline = false;
  const a = consented();
  a.boot();
  assert.equal(a.state, 'modem');
  assert.equal(f.made.length, 0);
  globalThis.isOnline = true;
  a.modemChanged();
  assert.equal(a.state, 'connecting');
  assert.equal(f.made.length, 1);
  f.made[0].open();
  f.made[0].hear({ op: 'me', uid: '700000099' });
  globalThis.isOnline = false;
  a.modemChanged();
  assert.equal(a.state, 'modem');
  assert.equal(f.made[0].closed, true);
  a.setAuto(false);
  globalThis.isOnline = true;
  a.modemChanged();
  assert.equal(a.state, 'off');
  assert.equal(f.made.length, 1);
  globalThis.isOnline = false;
  a.connect();
  assert.equal(a.state, 'modem');
  a.disconnect('off');
  delete globalThis.isOnline;
  f.restore();
});

test('client: old or broken stored data gives a new account, and a missing storage still works', () => {
  for (const seed of ['{bad json', 'null', '5', JSON.stringify({ uid: '123', secret: 'x' }), JSON.stringify({ uid: '700000000' })]) {
    const store = storageOf({ 'net98.account': seed });
    const a = globalThis.createNet98(store);
    assert.match(a.uid(), /^7\d{8}$/);
    assert.equal(a.hasConsent(), false);
    assert.equal(JSON.parse(store.getItem('net98.account')).uid, a.uid());
  }
  const broken = globalThis.createNet98({ getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } });
  assert.match(broken.uid(), /^7\d{8}$/);
  assert.equal(broken.url(), 'wss://pennygachi.men/api/net');
  assert.ok(globalThis.Net98 && globalThis.Net98.state === 'off');
});

test('server source runs on Node 20 and has no comments', () => {
  const text = fs.readFileSync(path.join(__dirname, '../tools/net/server.cjs'), 'utf8');
  assert.ok(!/node:sqlite|require\('ws'\)/.test(text));
  for (const file of ['../tools/net/server.cjs', '../js/net98.js', '../tools/net.cjs', '../js/apps/hsr98/hsr-ui-net.js', '../js/apps/hsr98/hsr-hd-lead.js', '../js/apps/hsr98/hsr-net.js', '../js/apps/hsr98/hsr-ui-visit.js', '../js/apps/hsr98/hsr-ui-hd-table.js', '../tools/net/e2e-visit.cjs', '../tools/net/e2e-table.cjs']) {
    const code = fs.readFileSync(path.join(__dirname, file), 'utf8');
    assert.ok(!/^\s*\/\//m.test(code) && !/\/\*/.test(code), file + ' has no comments');
  }
});

(async () => {
  let failed = 0;
  for (const t of tests) {
    try { await t.fn(); console.log('ok   ' + t.name); }
    catch (err) { failed++; console.error('FAIL ' + t.name + '\n' + (err && err.stack || err)); }
  }
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(failed ? failed + ' failed' : 'All ether link server tests passed');
  process.exit(failed ? 1 : 0);
})();
