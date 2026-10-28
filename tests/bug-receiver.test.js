const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp, caption } = require('../tools/bugs/receiver.cjs');

console.log('--- Testing bug receiver (mini PC) ---');

const DAY = 24 * 3600 * 1000;

function fakeTelegram() {
  const calls = [];
  let failing = false;
  let messageId = 100;
  const impl = async (url, opts) => {
    const method = url.split('/').pop();
    const body = opts.body instanceof FormData ? Object.fromEntries(opts.body.entries()) : JSON.parse(opts.body);
    calls.push({ method, body, url });
    if (failing) throw new Error('offline');
    const result = method.startsWith('send') ? { message_id: ++messageId } : true;
    return { json: async () => ({ ok: true, result }) };
  };
  return { impl, calls, setFailing: v => { failing = v; } };
}

function config(dir, extra) {
  return Object.assign({ host: '127.0.0.1', port: 0, dataDir: dir, token: 'secret-token', keepDays: 90, maxGb: 5, minFreeGb: 0, rateLimit: 3, maxBody: 10 * 1024 * 1024, botToken: 'BOT', chatId: '42' }, extra || {});
}

function pkg(id, extra) {
  const report = Object.assign({
    format: 'win98-bugreport', v: 1, id, created: '2026-10-27T10:00:00.000Z', source: 'hsr98', channel: 'exe',
    build: { commit: '63d95ed' },
    user: { title: 'Пропал диалог', text: 'после боя чёрный экран', kind: 'bug', repeat: 'always', contact: '@tester' },
    where: { summary: 'Ярило-VI > Белобог', window: 'app_hsr98', app: 'hsr98' },
    apps: { hsr98: { state: { cheats: true } } },
    errors: [{ msg: "TypeError: x is undefined", src: 'js/apps/hsr98/hsr-cine.js:211:17', count: 3 }]
  }, extra || {});
  return { format: 'win98-bugreport-file', v: 1, report, files: { 'shot.png': Buffer.from([137, 80, 78, 71]).toString('base64'), 'save.json.gz': 'H4sI' } };
}

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bug-receiver-'));
  const tg = fakeTelegram();
  let clock = Date.parse('2026-10-27T12:00:00Z');
  const logs = [];
  const app = createApp(config(dir), { fetchImpl: tg.impl, now: () => clock, log: m => logs.push(m) });
  await new Promise(r => app.server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + app.server.address().port + '/api/bugs';
  const req = async (method, url, body, headers) => {
    const res = await fetch(base + url, { method, headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}), body: body == null ? undefined : typeof body === 'string' ? body : JSON.stringify(body) });
    const type = res.headers.get('content-type') || '';
    return { status: res.status, headers: res.headers, body: type.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer()) };
  };
  const ip = n => ({ 'CF-Connecting-IP': '10.0.0.' + n });
  const auth = { Authorization: 'Bearer secret-token' };

  try {
    const ping = await req('GET', '/ping');
    assert.deepEqual(ping.body, { ok: true, v: 1 });
    assert.equal(ping.headers.get('cache-control'), 'no-store');
    assert.equal(ping.headers.get('access-control-allow-origin'), '*');
    assert.equal((await req('OPTIONS', '')).status, 204);
    console.log('✓ ping, CORS, no-store');

    const first = await req('POST', '', pkg('BR-261027-AAAA'), ip(1));
    assert.deepEqual(first.body, { ok: true, id: 'BR-261027-AAAA' });
    const folder = path.join(dir, 'BR-261027-AAAA');
    assert.deepEqual(fs.readdirSync(folder).sort(), ['report.json', 'save.json.gz', 'shot.png']);
    assert.deepEqual([...fs.readFileSync(path.join(folder, 'shot.png'))], [137, 80, 78, 71]);
    const index = fs.readFileSync(path.join(dir, 'index.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
    assert.equal(index.length, 1);
    assert.deepEqual([index[0].id, index[0].status, index[0].app, index[0].cheats, index[0].commit], ['BR-261027-AAAA', 'new', 'hsr98', true, '63d95ed']);
    await new Promise(r => setTimeout(r, 50));
    const photo = tg.calls.find(c => c.method === 'sendPhoto');
    assert.ok(photo, 'a new report is sent to Telegram with its screenshot');
    assert.equal(photo.body.chat_id, '42');
    assert.match(photo.body.caption, /^🐞 BR-261027-AAAA · HSR 98 · exe · Не работает · всегда\nПропал диалог\nпосле боя чёрный экран\nГде: Ярило-VI > Белобог\nОшибки: TypeError: x is undefined \(hsr-cine\.js:211:17\) ×3\nСборка 63d95ed · сохранение приложено · контакт: @tester\n⚠ F7\/F8 использовались$/);
    assert.deepEqual(JSON.parse(photo.body.reply_markup).inline_keyboard[0].map(b => b.callback_data), ['st:accepted:BR-261027-AAAA', 'st:notabug:BR-261027-AAAA', 'st:duplicate:BR-261027-AAAA']);
    assert.equal(app.store.get('BR-261027-AAAA').tg, 101);
    console.log('✓ report stored, indexed and announced in Telegram');

    assert.equal((await req('POST', '', pkg('BR-261027-AAAA'), ip(1))).status, 409);
    assert.equal((await req('POST', '', { ...pkg('BR-261027-BBBB'), files: { 'x.html': 'AA==' } }, ip(1))).status, 400);
    const limitedRes = await req('POST', '', pkg('BR-261027-CCCC'), ip(1));
    assert.deepEqual([limitedRes.status, limitedRes.body.error], [429, 'too many reports']);
    assert.equal((await req('POST', '', pkg('BR-261027-CCCC'), ip(2))).status, 200, 'other players are not limited');
    assert.equal((await req('POST', '', 'x'.repeat(11 * 1024 * 1024), ip(3))).status, 413);
    console.log('✓ duplicates, bad files, rate limit per CF-Connecting-IP, size limit');

    const pub = await req('GET', '/status?ids=BR-261027-AAAA,BR-261027-ZZZZ,../etc');
    assert.deepEqual(pub.body, { ok: true, items: { 'BR-261027-AAAA': { status: 'new', fixedIn: '', note: '' } } });
    assert.equal((await req('GET', '')).status, 401);
    assert.equal((await req('GET', '', null, { Authorization: 'Bearer wrong' })).status, 401);
    const list = await req('GET', '?since=2026-01-01', null, auth);
    assert.deepEqual(list.body.items.map(e => e.id), ['BR-261027-AAAA', 'BR-261027-CCCC']);
    const file = await req('GET', '/BR-261027-AAAA/shot.png', null, auth);
    assert.equal(file.status, 200);
    assert.match(file.headers.get('content-disposition'), /attachment/);
    assert.deepEqual([...file.body], [137, 80, 78, 71]);
    assert.equal((await req('GET', '/BR-261027-AAAA/report.json', null, auth)).status, 200);
    assert.equal((await req('GET', '/BR-261027-AAAA/index.jsonl', null, auth)).status, 404);
    assert.equal((await req('GET', '/BR-261027-AAAA/shot.png')).status, 401, 'files need the token');
    console.log('✓ public status, token-protected list and files');

    const upd = await req('POST', '/BR-261027-AAAA/status', { status: 'fixed', fixedIn: '1.7', note: 'Диалог снова появляется' }, auth);
    assert.equal(upd.body.entry.status, 'fixed');
    const edit = tg.calls.filter(c => c.method === 'editMessageCaption').pop();
    assert.match(edit.body.caption, /Статус: Исправлен$/);
    assert.equal(edit.body.reply_markup.inline_keyboard[0][0].text, 'Принять');
    assert.deepEqual((await req('GET', '/status?ids=BR-261027-AAAA')).body.items['BR-261027-AAAA'], { status: 'fixed', fixedIn: '1.7', note: 'Диалог снова появляется' });
    assert.equal((await req('POST', '/BR-261027-AAAA/status', { status: 'weird' }, auth)).status, 400);
    console.log('✓ status updates reach players and the Telegram message');

    await app.telegram.handleUpdate({ callback_query: { id: 'q1', data: 'st:accepted:BR-261027-CCCC', message: { chat: { id: 42 }, message_id: 7 } } });
    assert.equal(app.store.get('BR-261027-CCCC').status, 'accepted');
    assert.equal(tg.calls.filter(c => c.method === 'answerCallbackQuery').pop().body.text, 'BR-261027-CCCC: Принят');
    await app.telegram.handleUpdate({ callback_query: { id: 'q2', data: 'st:notabug:BR-261027-CCCC', message: { chat: { id: 999 }, message_id: 7 } } });
    assert.equal(app.store.get('BR-261027-CCCC').status, 'accepted', 'buttons from other chats are ignored');
    const markup = tg.calls.filter(c => c.method === 'editMessageCaption').pop().body.reply_markup.inline_keyboard[0];
    assert.equal(markup[0].text, '✓ Принять');
    await app.telegram.handleUpdate({ message: { chat: { id: 42 }, text: '/new' } });
    assert.equal(tg.calls.filter(c => c.method === 'sendMessage').pop().body.text, 'Новых отчётов: 0');
    const before = tg.calls.length;
    await app.telegram.handleUpdate({ message: { chat: { id: 42 }, text: '/get br-261027-aaaa' } });
    assert.equal(tg.calls[before].method, 'sendPhoto');
    await app.telegram.handleUpdate({ message: { chat: { id: 5 }, text: '/new' } });
    assert.equal(tg.calls.length, before + 1, 'commands from other chats are ignored');
    console.log('✓ Telegram buttons and /new, /get');

    tg.setFailing(true);
    await req('POST', '', pkg('BR-261027-DDDD'), ip(4));
    await new Promise(r => setTimeout(r, 50));
    assert.deepEqual(app.telegram.outbox.map(o => [o.id, o.tries]), [['BR-261027-DDDD', 1]]);
    assert.ok(fs.readFileSync(path.join(dir, 'outbox-telegram.jsonl'), 'utf8').includes('BR-261027-DDDD'), 'pending notices survive a restart');
    tg.setFailing(false);
    await app.telegram.flush(clock + 60 * 1000);
    assert.equal(app.telegram.outbox.length, 1, 'retry waits 5 minutes');
    await app.telegram.flush(clock + 6 * 60 * 1000);
    assert.equal(app.telegram.outbox.length, 0);
    console.log('✓ Telegram outbox retries after a failure');

    assert.equal((await req('DELETE', '/BR-261027-DDDD', null, auth)).status, 200);
    assert.ok(!fs.existsSync(path.join(dir, 'BR-261027-DDDD')) && !app.store.get('BR-261027-DDDD'));

    clock += 91 * DAY;
    assert.deepEqual(app.cleanup(), ['BR-261027-AAAA', 'BR-261027-CCCC']);
    assert.ok(!fs.existsSync(folder), 'files are removed after 90 days');
    assert.deepEqual((await req('GET', '/status?ids=BR-261027-AAAA')).body.items['BR-261027-AAAA'].status, 'fixed', 'the status line stays');
    assert.equal(app.store.get('BR-261027-AAAA').title, '', 'player text is dropped with the files');
    assert.deepEqual(app.cleanup(), []);
    console.log('✓ 90-day purge keeps statuses');

    const again = createApp(config(dir), { fetchImpl: tg.impl, now: () => clock, log: () => {} });
    assert.deepEqual([...again.store.entries.keys()], ['BR-261027-AAAA', 'BR-261027-CCCC']);
    assert.equal(again.store.get('BR-261027-CCCC').status, 'accepted');
    console.log('✓ index survives a restart');
  } finally {
    app.server.close();
  }

  const fullDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bug-receiver-full-'));
  const tg2 = fakeTelegram();
  const full = createApp(config(fullDir, { maxGb: 1e-12 }), { fetchImpl: tg2.impl, log: () => {} });
  fs.writeFileSync(path.join(fullDir, 'filler.bin'), Buffer.alloc(64));
  await new Promise(r => full.server.listen(0, '127.0.0.1', r));
  try {
    const res = await fetch('http://127.0.0.1:' + full.server.address().port + '/api/bugs', { method: 'POST', body: JSON.stringify(pkg('BR-261027-EEEE')) });
    assert.equal(res.status, 507);
    assert.match(full.telegram.outbox[0].text, /Новые отчёты не принимаются/);
    console.log('✓ storage limit refuses reports and warns once');
  } finally {
    full.server.close();
  }

  const off = createApp(config(fs.mkdtempSync(path.join(os.tmpdir(), 'bug-receiver-off-')), { botToken: '', chatId: '' }), { fetchImpl: () => { throw new Error('must not call'); }, log: () => {} });
  off.telegram.enqueue('BR-261027-FFFF');
  assert.equal(off.telegram.outbox.length, 0, 'without a bot token nothing is queued');

  const long = caption({ id: 'BR-261027-GGGG', source: 'win98', channel: 'browser', user: { title: 'x'.repeat(5000), text: 'y'.repeat(5000), kind: 'idea' }, where: { summary: 'z'.repeat(5000) }, errors: [] }, { files: [], status: 'new', cheats: false });
  assert.ok(long.length <= 1024, 'captions fit the Telegram limit');
  assert.match(long, /^🐞 BR-261027-GGGG · Win 98 · browser · Идея/);
  console.log('✓ caption limits');

  console.log('Bug receiver tests passed.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
