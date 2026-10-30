const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { spawn, execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const games = require('../tools/parohod98-game.cjs');
const apk = require('../tools/parohod98-apk.cjs');
const bugs = require('../tools/bugs.cjs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'parohod98-bug-'));

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

function sandbox(flag) {
  const window = { navigator: { language: 'ru-RU' }, Parohod98: flag, addEventListener() {}, localStorage: { length: 0, key: () => null, getItem: () => null } };
  window.window = window;
  new Function('window', 'globalThis', read('js/parohod98-report.js'))(window, window);
  return window;
}

(async () => {
  try {
    await check('every game package loads the report core first and the report window after the game', () => {
      for (const id of Object.keys(games.GAMES)) {
        const r = games.build(id, path.join(tmp, 'pkg-' + id), { edition: 'apk', version: '1.0', parts: false });
        const html = fs.readFileSync(path.join(r.out, 'index.html'), 'utf8');
        const order = ['js/bugreport-core.js', games.readPage(id).scripts[0], 'js/bugreport-shot.js', 'js/parohod98-report.js'].map(s => html.indexOf('src="' + s + '"'));
        assert.ok(order.every((n, i) => n > 0 && (i === 0 || n > order[i - 1])), id + ': ' + order.join(','));
      }
    });

    await check('the launcher APK carries the report window, Settings opens it', () => {
      const www = path.join(tmp, 'www');
      apk.stageWww(www, { probe: false, version: '1.0' });
      for (const f of ['js/bugreport-core.js', 'js/bugreport-shot.js', 'js/parohod98-report.js']) assert.ok(fs.existsSync(path.join(www, f)), f);
      const html = read('tools/parohod98/launcher/index.html');
      assert.ok(html.indexOf('bugreport-core.js') < html.indexOf('launcher-state.js'), 'the core loads first');
      assert.match(read('tools/parohod98/launcher/launcher.js'), /Parohod98Report\.open\(\{\s*app: 'launcher'/);
    });

    await check('each game has a where adapter and a pause, saves use the backup catalog keys', () => {
      const w = sandbox({ game: 'serioussam', edition: 'apk' });
      const R = w.Parohod98Report;
      const catalog = read('js/apps/backup-catalog.js');
      for (const id of Object.keys(games.GAMES)) {
        assert.equal(typeof R.GAMES[id].where, 'function', id);
        assert.equal(typeof R.GAMES[id].pause, 'function', id);
        assert.match(R.GAMES[id].where().summary, /Главное меню/, id + ' without a running game');
        for (const p of R.PREFIXES[id]) assert.ok(catalog.includes("'" + p + (p.endsWith('_') || p.endsWith('-') ? '*' : '') + "'"), id + ' ' + p);
      }
      w.ssui = { state: 'play', menu: null, L: x => x, game: { levelIndex: 2, skillIndex: 2, def: { name: 'Долина царей' }, waves: { w1: { id: 'w1', started: true, done: false } }, player: { x: 1, y: 0, z: 2, hp: 87 } } };
      assert.equal(R.GAMES.serioussam.where().summary, 'Serious Sam 98 > Уровень 3. Долина царей > волна w1');
      w.fzui = { mode: 'play', menus: { open: false }, game: { mode: 'race', clock: 18.5, veh: { x: 120.4, z: -33 }, race: { ev: { id: 'e1', name: 'Старая Рига' } } } };
      assert.equal(R.GAMES.forza.where().summary, 'Forza Horizon: Рига > Гонка: Старая Рига > x 120, z -33, 18:30');
      w.nnui = { state: 'play', game: { world: { clock: 13 * 60 + 5, player: { x: 10, z: 20 } }, mission: { def: { id: 'm3', title: 'Волга' } } } };
      assert.equal(R.GAMES.gtann.where().summary, 'GTA: Нижний Сити > Миссия Волга > x 10, z 20, 13:05');
    });

    await check('the frame is taken without the Serious Sam pause menu on top', () => {
      const w = sandbox({ game: 'serioussam', edition: 'apk' });
      const calls = [];
      w.ssui = { hud: {}, options: { fpsCap: 2 }, drawHud() { calls.push([this.cleanShot, this.options.fpsCap]); } };
      w.Parohod98Report.GAMES.serioussam.clean(true);
      w.Parohod98Report.GAMES.serioussam.clean(false);
      assert.deepEqual(calls, [[true, 0], [false, 2]], 'the frame cap is off while the shot is taken, so the game draws that frame');
      const fz = { fps: 30 }, nn = { fps: 30 };
      w.fzui = { menuEl: { style: {} }, settings: () => fz };
      w.nnui = { menuEl: { style: {} }, settings: nn };
      w.Parohod98Report.GAMES.forza.clean(true);
      w.Parohod98Report.GAMES.gtann.clean(true);
      assert.deepEqual([fz.fps, nn.fps, w.fzui.menuEl.style.visibility, w.nnui.menuEl.style.visibility], [0, 0, 'hidden', 'hidden']);
      w.Parohod98Report.GAMES.forza.clean(false);
      w.Parohod98Report.GAMES.gtann.clean(false);
      assert.deepEqual([fz.fps, nn.fps, w.fzui.menuEl.style.visibility, w.nnui.menuEl.style.visibility], [30, 30, '', '']);
      assert.match(read('js/apps/serious-sam/ss-ui.js'), /if \(this\.menu && !this\.cleanShot\) this\.drawMenu/);
      const report = read('js/parohod98-report.js');
      assert.ok(report.indexOf('game.clean(true)') < report.indexOf('BugShot.capture()') && report.indexOf('BugShot.capture()') < report.indexOf('game.clean(false)'));
    });

    await check('F10 belongs to the report, Serious Sam pause menu has the item', () => {
      assert.match(read('js/parohod98-report.js'), /e\.key !== 'F10' \|\| e\.ctrlKey/);
      assert.match(read('js/apps/serious-sam/ss-ui.js'), /if \(globalThis\.Parohod98Report\) it\.push\(\{ label: T\('report'\)/);
      assert.match(read('js/apps/serious-sam/ss-data.js'), /report: 'СООБЩИТЬ ОБ ОШИБКЕ'/);
    });

    await check('the receiver labels Пароход 98 reports', () => {
      assert.match(read('tools/bugs/receiver.cjs'), /parohod98: 'Пароход 98'/);
    });

    await check('report sources have no comments', () => {
      for (const f of ['js/parohod98-report.js', 'tests/parohod98-bug.test.js']) assert.ok(!/^\s*\/\/|\/\*/m.test(read(f).replace(/https?:\/\/[^\s'"]+/g, '')), f);
    });

    if (!fs.existsSync(EDGE) || process.env.PAROHOD98_NO_EDGE) {
      console.log('parohod98-bug: ' + passed + ' checks passed, Edge part skipped');
      return;
    }

    await check('a report from the Serious Sam pause menu arrives with frame, marks and save, and repro opens the save', async () => {
      const pkg = path.join(tmp, 'pkg-serioussam');
      const posted = [];
      const srv = await new Promise(resolve => {
        const s = http.createServer((req, res) => {
          const url = req.url.split('?')[0];
          if (url === '/api/bugs/ping') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"ok":true,"local":true}'); }
          if (url === '/api/bugs' && req.method === 'POST') {
            const chunks = [];
            req.on('data', c => chunks.push(c));
            req.on('end', () => {
              const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
              posted.push(data);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, id: data.report.id, local: true }));
            });
            return;
          }
          const file = path.join(pkg, decodeURIComponent(url).replace(/^\/+/, '') || 'index.html');
          if (!file.startsWith(pkg) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
          const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' }[path.extname(file)] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': type });
          fs.createReadStream(file).pipe(res);
        });
        s.listen(0, '127.0.0.1', () => resolve(s));
      });
      const port = 9600 + Math.floor(Math.random() * 300);
      const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'parohod98-bug-edge-'));
      const edge = spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + profile, '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' });
      try {
        let page = null;
        for (let i = 0; i < 100 && !page; i++) {
          await sleep(200);
          try { page = (await (await fetch('http://127.0.0.1:' + port + '/json')).json()).find(t => t.type === 'page'); } catch (err) {}
        }
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
        let seq = 0;
        const pending = new Map();
        const errors = [];
        ws.onmessage = m => {
          const d = JSON.parse(m.data);
          if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
          else if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text);
        };
        const send = (method, params = {}) => new Promise(r => { const n = ++seq; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
        const value = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); return r.result && r.result.result ? r.result.result.value : undefined; };
        await send('Runtime.enable');
        await send('Page.enable');
        await send('Emulation.setDeviceMetricsOverride', { width: 846, height: 387, deviceScaleFactor: 1, mobile: true });
        await send('Page.addScriptToEvaluateOnNewDocument', { source: 'localStorage.setItem("ss98-bugtest", "kept");' });
        await send('Page.navigate', { url: 'http://127.0.0.1:' + srv.address().port + '/index.html' });
        let ready = false;
        for (let i = 0; i < 240 && !ready; i++) { await sleep(500); ready = !!(await value(games.GAMES.serioussam.ready)); }
        assert.ok(ready, 'the main menu opened');
        await value('ssui.startLevel(0, 2, null)');
        await sleep(2500);
        await value('ssui.openMenu("pause")');
        const label = await value('ssui.menuItems.map(m => m.label).find(l => /ОШИБК/.test(l))');
        assert.equal(label, 'СООБЩИТЬ ОБ ОШИБКЕ');
        await value('ssui.menuItems.find(m => m.label === "СООБЩИТЬ ОБ ОШИБКЕ").act()');
        let open = false;
        for (let i = 0; i < 40 && !open; i++) { await sleep(250); open = !!(await value('!!document.querySelector(".p98r canvas")')); }
        assert.ok(open, 'the report window opened');
        const box = await value('(() => { const r = document.querySelector(".p98r canvas").getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()');
        const at = (fx, fy) => ({ x: box[0] + box[2] * fx, y: box[1] + box[3] * fy });
        const a = at(0.3, 0.3), b = at(0.6, 0.7);
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: a.x, y: a.y, button: 'left', clickCount: 1 });
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, button: 'left', buttons: 1 });
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: b.x, y: b.y, button: 'left', buttons: 1 });
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1 });
        assert.match(await value('document.querySelector(".p98r small:last-of-type") ? [...document.querySelectorAll(".p98r small")].map(s => s.textContent).join("|") : ""'), /Где: Serious Sam 98 > Уровень 1/);
        assert.equal(await value('document.querySelector(".p98r button.main").disabled'), true, 'nothing to send yet');
        await value('(() => { const t = document.querySelector(".p98r input[type=text]"); t.value = "Тестовый отчёт"; t.dispatchEvent(new Event("input")); })()');
        await value('document.querySelector(".p98r button.main").click()');
        for (let i = 0; i < 60 && !posted.length; i++) await sleep(250);
        assert.equal(posted.length, 1, 'the report reached the receiver');
        await sleep(300);
        assert.match(await value('document.querySelector(".p98r h2").textContent'), /отправлен/);
        assert.equal(await value('parohod98Back()'), true, 'Back closes the window');
        assert.equal(await value('!!document.querySelector(".p98r")'), false);
        assert.deepEqual(errors, []);
        const { report, files } = posted[0];
        assert.equal(report.source, 'parohod98');
        assert.equal(report.channel, 'parohod98-apk');
        assert.equal(report.where.app, 'serioussam');
        assert.equal(report.user.title, 'Тестовый отчёт');
        assert.equal(report.attach.marks.length, 1);
        assert.ok(files['shot.png'] || files['shot.jpg'], 'frame attached');
        assert.ok(files['shot-marked.png'] || files['shot-marked.jpg'], 'marked frame attached');
        const save = JSON.parse(zlib.gunzipSync(Buffer.from(files['save.json.gz'], 'base64')).toString('utf8'));
        assert.equal(save.format, 'Win98Backup');
        assert.equal(save.data.ls['ss98-bugtest'], 'kept');
        assert.ok(Object.keys(save.data.ls).every(k => k.startsWith('ss98-')), 'only Serious Sam keys');
        const config = { dir: path.join(tmp, 'bugreports'), repo: ROOT };
        fs.mkdirSync(config.dir, { recursive: true });
        bugs.storePackage(config, posted[0], 'test');
        const r = await bugs.reproHeadless(config, report.id, { settle: 2000 });
        assert.equal(r.ready, true);
        assert.ok(r.restored.includes('ss98-bugtest'));
        assert.ok(fs.existsSync(r.png), 'repro.png');
        assert.ok(r.storageKeys >= r.restored.length);
      } finally {
        try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (err) {}
        srv.close();
      }
    });
    console.log('parohod98-bug: ' + passed + ' checks passed');
  } finally {
    await sleep(300);
    try { fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch (err) {}
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
