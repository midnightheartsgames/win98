const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createApp } = require('../tools/bugs/receiver.cjs');
const inbox = require('../tools/bugs.cjs');

console.log('--- Testing bug inbox (tools/bugs.cjs) ---');

const ROOT = path.join(__dirname, '..');
const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT }).toString().trim();

function pkg(id, extra) {
  const report = Object.assign({
    format: 'win98-bugreport', v: 1, id, created: '2026-10-27T10:00:00.000Z', source: 'hsr98', channel: 'exe',
    build: { commit: head, hsr: '1.6' },
    user: { title: 'Пропал диалог | после боя', text: 'Экран чёрный, музыка играет', kind: 'bug', repeat: 'always', contact: '' },
    where: { summary: 'Ярило-VI > Белобог (x 312, y 140)', window: 'app_hsr98', app: 'hsr98' },
    system: { ua: 'Electron', viewport: [1280, 960], fps: 58, heapMB: 400, gl: 'ANGLE' },
    windows: [{ id: 'app_hsr98', title: 'Honkai: Star Rail 98', active: true, max: true, rect: [0, 0, 1024, 740] }],
    apps: { hsr98: { map: 'belobog', state: { cheats: false } } },
    errors: [{ t: 12.5, msg: 'TypeError: x is undefined', src: 'js/apps/hsr98/hsr-cine.js:211:17', count: 3, stack: 'TypeError: x is undefined\n    at Cine.step (hsr-cine.js:211:17)' }],
    missing: [{ tag: 'img', url: 'content/hsr/missing.png', count: 1 }],
    log: [{ t: 1, level: 'log', msg: 'boot' }, { t: 12.4, level: 'warn', msg: 'scene skipped' }],
    trail: [{ t: 11, type: 'key', code: 'Enter', win: 'app_hsr98' }, { t: 12, type: 'app', msg: 'battle end: win' }],
    attach: { shot: 'shot.png', marked: 'shot-marked.png', marks: [{ x: 1, y: 2, w: 30, h: 40 }], save: 'save.json.gz', saveComponent: 'game_hsr98' }
  }, extra || {});
  return { format: 'win98-bugreport-file', v: 1, report, files: { 'shot.png': Buffer.from('PNG1').toString('base64'), 'shot-marked.png': Buffer.from('PNG2').toString('base64'), 'save.json.gz': Buffer.from('GZ').toString('base64') } };
}

(async () => {
  const serverDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inbox-server-'));
  const localDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inbox-local-'));
  let clock = Date.parse('2026-10-27T12:00:00Z');
  const app = createApp({ host: '127.0.0.1', port: 0, dataDir: serverDir, token: 'tkn', keepDays: 90, maxGb: 5, minFreeGb: 0, rateLimit: 100, maxBody: 10 * 1024 * 1024, botToken: '', chatId: '' }, { now: () => clock, log: () => {} });
  await new Promise(r => app.server.listen(0, '127.0.0.1', r));
  const url = 'http://127.0.0.1:' + app.server.address().port + '/api/bugs';
  const config = { url, token: 'tkn', dir: localDir, repo: ROOT };
  const post = body => fetch(url, { method: 'POST', body: JSON.stringify(body) }).then(r => r.status);

  try {
    assert.equal(await post(pkg('BR-261027-AAAA')), 200);
    assert.equal(await post(pkg('BR-261027-BBBB', { created: '2026-10-27T11:00:00.000Z', source: 'win98', channel: 'browser', where: { summary: 'Internet Explorer: http://www.search98.com', window: 'app_ie', app: 'app_ie' }, apps: {}, user: { title: 'Кнопка Найти', kind: 'visual', repeat: 'once' } })), 200);

    await assert.rejects(inbox.pull(Object.assign({}, config, { token: '' })), /No token/);
    await assert.rejects(inbox.pull(Object.assign({}, config, { token: 'bad' })), /HTTP 401/);

    const first = await inbox.pull(config);
    assert.deepEqual([first.added, first.changed, first.total], [['BR-261027-AAAA', 'BR-261027-BBBB'], [], 2]);
    const a = path.join(localDir, 'BR-261027-AAAA');
    assert.deepEqual(fs.readdirSync(a).sort(), ['report.json', 'report.md', 'save.json.gz', 'shot-marked.png', 'shot.png', 'status.json']);
    assert.equal(fs.readFileSync(path.join(a, 'shot.png'), 'utf8'), 'PNG1');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(a, 'status.json'), 'utf8')), { status: 'new', fixedIn: '', note: '', dup: '', origin: 'remote' });
    const md = fs.readFileSync(path.join(a, 'report.md'), 'utf8');
    for (const part of [
      '# BR-261027-AAAA — Пропал диалог | после боя',
      '- Статус: новый · Тип: не работает · Повторяется: всегда',
      'сборка ' + head + ', HSR 1.6',
      '- HEAD ' + head + ': после сборки код не менялся',
      '- Где: Ярило-VI > Белобог (x 312, y 140) (окно app_hsr98, приложение hsr98)',
      '- Читы: нет · Сохранение: save.json.gz (game_hsr98)',
      'Экран чёрный, музыка играет',
      '- shot-marked.png — рамки игрока: [{"x":1,"y":2,"w":30,"h":40}]',
      'TypeError: x is undefined @ js/apps/hsr98/hsr-cine.js:211:17 ×3 (t=12.5)',
      'at Cine.step (hsr-cine.js:211:17)',
      'img content/hsr/missing.png',
      'key      code=Enter win=app_hsr98',
      '"map": "belobog"',
      '- **app_hsr98** «Honkai: Star Rail 98» развёрнуто 0,0,1024,740',
      'fps 58',
      'warn  scene skipped'
    ]) assert.ok(md.includes(part), 'report.md has: ' + part);
    assert.ok(!md.includes(' log   boot'), 'console shows warn and error when there are any');
    const index = fs.readFileSync(path.join(localDir, 'INDEX.md'), 'utf8');
    assert.match(index, /Всего: 2, новых: 2/);
    assert.ok(index.indexOf('BR-261027-BBBB') < index.indexOf('BR-261027-AAAA'), 'newest first');
    assert.match(index, /\| \[BR-261027-AAAA\]\(BR-261027-AAAA\/report\.md\) \| 2026-10-27 10:00 \| hsr98\/exe \| hsr98 \| bug \| new \|  \| Пропал диалог \\\| после боя \|/);
    console.log('✓ pull downloads reports, writes report.md and INDEX.md');

    assert.deepEqual((await inbox.pull(config)).added, [], 'second pull adds nothing');
    await app.telegram.setStatus('BR-261027-BBBB', 'accepted');
    const second = await inbox.pull(config);
    assert.deepEqual(second.changed, ['BR-261027-BBBB']);
    assert.equal(JSON.parse(fs.readFileSync(path.join(localDir, 'BR-261027-BBBB', 'status.json'), 'utf8')).status, 'accepted');
    assert.match(fs.readFileSync(path.join(localDir, 'BR-261027-BBBB', 'report.md'), 'utf8'), /- Статус: принят/);
    console.log('✓ status changes made in Telegram come down with pull');

    const fixed = await inbox.setStatus(config, 'BR-261027-AAAA', 'fixed', { in: '1.7', note: 'Сценка снова идёт' });
    assert.deepEqual([fixed.status, fixed.fixedIn, fixed.origin], ['fixed', '1.7', 'remote']);
    assert.deepEqual([app.store.get('BR-261027-AAAA').status, app.store.get('BR-261027-AAAA').fixedIn, app.store.get('BR-261027-AAAA').note], ['fixed', '1.7', 'Сценка снова идёт']);
    assert.match(fs.readFileSync(path.join(a, 'report.md'), 'utf8'), /- Статус: исправлен в 1\.7/);
    await assert.rejects(inbox.setStatus(config, 'BR-261027-AAAA', 'weird'), /Status must be one of/);
    await assert.rejects(inbox.setStatus(config, 'BR-261027-ZZZZ', 'fixed'), /No report/);
    console.log('✓ status command updates the server');

    const localId = 'BR-261027-MMMM';
    fs.mkdirSync(path.join(localDir, localId));
    fs.writeFileSync(path.join(localDir, localId, 'report.json'), JSON.stringify(pkg(localId, { created: '2026-10-27T13:00:00.000Z', build: { commit: '0000000' } }).report));
    inbox.refreshMarkdown(config);
    assert.match(fs.readFileSync(path.join(localDir, localId, 'report.md'), 'utf8'), /Коммит сборки не найден в репозитории/);
    const noNet = () => { throw new Error('local reports must not call the server'); };
    assert.equal((await inbox.setStatus(config, localId, 'notabug', {}, noNet)).origin, 'local');
    inbox.writeIndex(config);
    assert.equal(inbox.loadAll(localDir)[0].id, localId, 'newest report first');
    console.log('✓ reports from server.js get report.md and local statuses');

    const file = path.join(os.tmpdir(), 'BR-261027-FFFF.bugreport.json');
    fs.writeFileSync(file, JSON.stringify(pkg('BR-261027-FFFF')));
    assert.deepEqual(inbox.importFile(config, file), { id: 'BR-261027-FFFF', created: true });
    assert.deepEqual(inbox.importFile(config, file), { id: 'BR-261027-FFFF', created: false });
    assert.equal(JSON.parse(fs.readFileSync(path.join(localDir, 'BR-261027-FFFF', 'status.json'), 'utf8')).origin, 'file');
    fs.writeFileSync(file, JSON.stringify({ format: 'x' }));
    assert.throws(() => inbox.importFile(config, file), /not a bug report file/);
    console.log('✓ import of saved files');

    clock += 91 * 24 * 3600 * 1000;
    app.cleanup();
    const otherDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inbox-fresh-'));
    const fresh = await inbox.pull(Object.assign({}, config, { dir: otherDir }));
    assert.deepEqual(fresh.added, [], 'purged reports are not downloaded');
    console.log('✓ purged reports are skipped');

    assert.deepEqual(JSON.parse(JSON.stringify(inbox.parseArgs(['status', 'BR-1', 'fixed', '--in', '1.7', '--note', 'ok', '--x']))), { _: ['status', 'BR-1', 'fixed'], in: '1.7', note: 'ok', x: true });
    assert.equal(inbox.headChanges(ROOT, ''), null);

    const port = 18000 + Math.floor(Math.random() * 1000);
    const serveConfig = Object.assign({}, config, { dir: otherDir });
    fs.rmSync(otherDir, { recursive: true, force: true });
    const keep = fs.mkdtempSync(path.join(os.tmpdir(), 'inbox-serve-'));
    serveConfig.dir = keep;
    assert.equal(await post(pkg('BR-261027-SSSS', { created: '2026-10-28T09:00:00.000Z' })), 200);
    const web = inbox.createInboxServer(serveConfig, port);
    await new Promise(r => web.listen(port, '127.0.0.1', r));
    const rawGet = (p, host) => new Promise((resolve, reject) => {
      require('node:http').get({ host: '127.0.0.1', port, path: p, headers: { Host: host } }, res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'], body: Buffer.concat(chunks).toString('utf8') }));
      }).on('error', reject);
    });
    const local = '127.0.0.1:' + port;
    try {
      assert.equal((await rawGet('/', 'evil.example:' + port)).status, 403, 'other hosts are refused');
      const page = await rawGet('/', local);
      assert.equal(page.status, 200);
      assert.match(page.body, /<title>Приёмка отчётов<\/title>/);
      const webBase = 'http://' + local;
      const noHeader = await fetch(webBase + '/api/pull', { method: 'POST' });
      assert.equal(noHeader.status, 403, 'POST needs the X-Inbox header');
      const pulled = await (await fetch(webBase + '/api/pull', { method: 'POST', headers: { 'X-Inbox': '1' } })).json();
      assert.deepEqual(pulled.added, ['BR-261027-SSSS']);
      const list = await (await fetch(webBase + '/api/reports')).json();
      assert.deepEqual(list.items.map(i => [i.id, i.status, i.thumb, i.origin, i.app]), [['BR-261027-SSSS', 'new', 'shot-marked.png', 'remote', 'hsr98']]);
      const detail = await (await fetch(webBase + '/api/reports/BR-261027-SSSS')).json();
      assert.equal(detail.report.user.title, 'Пропал диалог | после боя');
      assert.deepEqual(detail.changes.files, []);
      const set = await (await fetch(webBase + '/api/reports/BR-261027-SSSS/status', { method: 'POST', headers: { 'X-Inbox': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'duplicate', dup: 'BR-261027-AAAA' }) })).json();
      assert.deepEqual([set.status.status, set.status.dup, app.store.get('BR-261027-SSSS').status, app.store.get('BR-261027-SSSS').dup], ['duplicate', 'BR-261027-AAAA', 'duplicate', 'BR-261027-AAAA']);
      const img = await rawGet('/files/BR-261027-SSSS/shot.png', local);
      assert.deepEqual([img.status, img.type, img.body], [200, 'image/png', 'PNG1']);
      assert.equal((await rawGet('/files/BR-261027-SSSS/status.json', local)).status, 404);
      assert.equal((await rawGet('/files/BR-261027-SSSS/..%2F..%2Fpackage.json', local)).status, 404);
      console.log('✓ serve: local-only page, pull, list, details, status, files');
    } finally {
      web.close();
    }
  } finally {
    app.server.close();
  }
  console.log('Bug inbox tests passed.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
