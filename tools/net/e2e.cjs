const { spawn, execSync } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const WEB_PORT = 8124, NET_PORT = 39978, CDP_PORT = 9394, LAG_PORT = 39979;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function args() {
  const out = { players: 2, speed: 1, waves: 5, diff: 'easy', shots: null, reload: true, delay: 0, jitter: 0 };
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([a-z-]+)(?:=(.*))?$/);
    if (!m) continue;
    if (m[1] === 'players') out.players = Number(m[2]);
    if (m[1] === 'speed') out.speed = Number(m[2]);
    if (m[1] === 'waves') out.waves = Number(m[2]);
    if (m[1] === 'shots') out.shots = m[2];
    if (m[1] === 'delay') out.delay = Number(m[2]);
    if (m[1] === 'jitter') out.jitter = Number(m[2]);
    if (m[1] === 'no-reload') out.reload = false;
  }
  return out;
}

function laggyPipe(from, to, delay, jitter) {
  const queue = [];
  let waiting = false;
  const pump = () => {
    waiting = false;
    while (queue.length && queue[0].at <= Date.now()) { const q = queue.shift(); if (!to.destroyed) to.write(q.chunk); }
    if (queue.length) { waiting = true; setTimeout(pump, Math.max(1, queue[0].at - Date.now())); }
  };
  from.on('data', chunk => {
    queue.push({ at: Date.now() + delay / 2 + Math.random() * jitter / 2, chunk });
    if (!waiting) pump();
  });
  from.on('close', () => setTimeout(() => to.destroy(), delay));
  from.on('error', () => to.destroy());
}

function startLag(delay, jitter) {
  const server = net.createServer(client => {
    const relay = net.connect(NET_PORT, '127.0.0.1');
    laggyPipe(client, relay, delay, jitter);
    laggyPipe(relay, client, delay, jitter);
  });
  server.listen(LAG_PORT, '127.0.0.1');
  return server;
}

function feelOf(samples, downAt, upAt) {
  const first = samples[0], after = at => samples.filter(q => q.t >= at);
  const startedAt = (key, from) => { const q = after(from).find(v => Math.abs(v[key] - first[key]) > 1); return q ? Math.round(q.t - from) : null; };
  const lastMove = (key, from) => {
    let at = from;
    const list = after(from);
    for (let i = 1; i < list.length; i++) if (Math.abs(list[i][key] - list[i - 1][key]) > 0.3) at = list[i].t;
    return Math.round(at - from);
  };
  const walk = samples.filter(q => q.t > downAt + 100 && q.t < upAt), speeds = [];
  for (let i = 1; i < walk.length; i++) speeds.push(Math.abs(walk[i].lead - walk[i - 1].lead) / Math.max(1, walk[i].t - walk[i - 1].t) * 1000);
  const mean = speeds.reduce((a, b) => a + b, 0) / Math.max(1, speeds.length);
  const spread = Math.sqrt(speeds.reduce((a, b) => a + (b - mean) * (b - mean), 0) / Math.max(1, speeds.length));
  const simSpeeds = [];
  for (let i = 1; i < walk.length; i++) simSpeeds.push(Math.abs(walk[i].sim - walk[i - 1].sim) / Math.max(1, walk[i].t - walk[i - 1].t) * 1000);
  const simMean = simSpeeds.reduce((a, b) => a + b, 0) / Math.max(1, simSpeeds.length);
  const simSpread = Math.sqrt(simSpeeds.reduce((a, b) => a + (b - simMean) * (b - simMean), 0) / Math.max(1, simSpeeds.length));
  return {
    pressToScreenMs: startedAt('lead', downAt), pressToSimMs: startedAt('sim', downAt), releaseToScreenStopMs: lastMove('lead', upAt), releaseToSimStopMs: lastMove('sim', upAt),
    speed: Math.round(mean), speedSpread: Math.round(spread), simSpeedSpread: Math.round(simSpread), leadPx: Math.round(Math.max(...walk.map(q => Math.abs(q.lead - q.sim)), 0)), endGapPx: Math.round(Math.abs(samples[samples.length - 1].lead - samples[samples.length - 1].sim))
  };
}

const PAGE_SETUP = `(() => {
  if (window.__e2e) return;
  const ui = window.hsrui, E = window.__e2e = { hashes: {}, snaps: {}, errors: [], think: 0, stopBot: false };
  ui.running = false;
  const onNet = ui.netMessage;
  E.events = [];
  ui.netMessage = function (m) {
    if (m.op !== 't' && m.op !== 'table') E.events.push(Math.round(performance.now()) + ' ' + JSON.stringify(m).slice(0, 120));
    return onNet.call(this, m);
  };
  const finish = ui.netFinish;
  ui.netFinish = function (quit, why) {
    E.events.push(Math.round(performance.now()) + ' finish ' + quit + ' ' + why);
    return finish.call(this, quit, why);
  };
  const begin = ui.netBegin;
  ui.netBegin = function (T) {
    begin.call(this, T);
    const s = this.netSession, send = s.onHash, message = s.message;
    const flat = o => { const out = {}; for (const k of Object.keys(o)) { const v = o[k]; if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') out[k] = v; } return out; };
    s.onHash = (tick, h) => {
      E.hashes[tick] = h;
      const A = s.A;
      E.snaps[tick] = JSON.stringify({ rng: A.rng.state(), uid: A.uid, breakT: A.breakT, waveT: A.waveT, stats: A.stats, shots: A.shots.map(flat), areas: A.areas.map(flat), units: A.units.map(u => Object.assign(flat(u), { fx: u.fx.map(flat), moveDir: u.moveDir, sel: u.sel, forced: u.forced, standAt: u.standAt, cd: u.cd, abil: u.abil, st: u.st, tal: u.tal ? Object.keys(u.tal).length : 0 })) });
      const old = Object.keys(E.snaps);
      if (old.length > 60) delete E.snaps[old[0]];
      send(tick, h);
    };
    E.turns = [];
    const startArena = s.startArena;
    s.startArena = function () { E.arenaAt = this.n; E.arenaLast = this.last; E.arenaTakes = this.takes.join(); return startArena.call(this); };
    s.message = function (m) {
      if (m.op === 't' && m.c) E.turns.push(JSON.stringify([m.n, m.c]));
      if (m.op === 'log') E.turns.push('log ' + JSON.stringify([m.upto, m.turns.length]));
      return message.call(this, m);
    };
  };
  const nearest = (A, h) => {
    let best = null, bd = 1e12;
    for (const f of A.foes()) { const d = (f.x - h.x) * (f.x - h.x) + (f.y - h.y) * (f.y - h.y); if (d < bd) { bd = d; best = f; } }
    return best;
  };
  const bot = () => {
    const s = ui.netSession;
    if (E.stopBot || !s || !s.A || s.A.over || ui.netPaused() || s.catching) return;
    const A = s.A, h = A.heroes[s.seat];
    const beat = Math.floor(A.tick / 9);
    if (beat === E.think) return;
    E.think = beat;
    for (const slot of ['r', 'q', 'e', 't']) if (A.canUp(h, slot)) { A.cmd({ t: 'up', slot }); break; }
    const pk = A.needPick(h);
    if (pk) A.cmd({ t: 'pick', lvl: pk, i: 0 });
    if (h.dead) { if (h.gold > 500) A.cmd({ t: 'buyback' }); return; }
    if (A.phase === 'break') {
      if (A.nearShop(h) && h.gold >= 400 && Math.random() < 0.5) { const set = Object.keys(Hsr98.RELIC_SETS)[0], slots = Object.keys(Hsr98.RELIC_SETS[set].pieces), slot = slots[Math.floor(Math.random() * slots.length)]; A.cmd({ t: 'buy', id: 'relic', set, slot }); }
      if (!h.vote && A.breakT < Hsr98.HD.DIFFS[A.run.diff].breakT - 3) A.cmd({ t: 'early' });
      return;
    }
    const f = nearest(A, h);
    if (!f) return;
    const slot = ['q', 'e', 'r'][Math.floor(Math.random() * 3)];
    if (h.abil[slot] && Math.random() < 0.5) A.cmd({ t: 'cast', slot, id: f.uid, x: f.x, y: f.y });
    else A.cmd({ t: 'attack', id: f.uid });
  };
  let last = performance.now();
  setInterval(() => {
    const now = performance.now(), dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    ui.t += dt;
    E.frames = (E.frames || 0) + 1;
    ui.update(dt);
    ui.render();
    bot();
    if (E.samples) {
      const scr = ui.screens.find(x => x.arena && x.lead);
      if (scr) E.samples.push({ t: performance.now(), lead: scr.lead.y, sim: scr.arena.heroes[scr.me].y });
    }
  }, 33);
})()`;

async function openBrowserApi() {
  const v = await (await fetch('http://127.0.0.1:' + CDP_PORT + '/json/version')).json();
  const ws = new WebSocket(v.webSocketDebuggerUrl);
  await new Promise(resolve => { ws.onopen = resolve; });
  let id = 0;
  const wait = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m.result || m); wait.delete(m.id); } };
  return { ws, send: (method, params) => new Promise(resolve => { const i = ++id; wait.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); }) };
}

async function openPage(api, url, name) {
  const { browserContextId } = await api.send('Target.createBrowserContext', {});
  const { targetId } = await api.send('Target.createTarget', { url: 'about:blank', browserContextId, width: 800, height: 600 });
  const ws = new WebSocket('ws://127.0.0.1:' + CDP_PORT + '/devtools/page/' + targetId);
  await new Promise(resolve => { ws.onopen = resolve; });
  let id = 0;
  const wait = new Map(), errors = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(String((m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description) || m.params.exceptionDetails.text).slice(0, 400));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value || a.description || '').join(' ').slice(0, 400));
  };
  const send = (method, params) => new Promise(resolve => { const i = ++id; wait.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable');
  await send('Page.enable');
  const page = {
    name, errors, send,
    ev: async code => {
      const r = await send('Runtime.evaluate', { expression: code, returnByValue: true, awaitPromise: true });
      if (r.result.exceptionDetails) throw new Error(name + ': ' + code.slice(0, 90) + ': ' + JSON.stringify(r.result.exceptionDetails).slice(0, 500));
      return r.result.result ? r.result.result.value : undefined;
    },
    key: code => page.ev('hsrui.keydown({code:' + JSON.stringify(code) + ',repeat:false,preventDefault(){}});hsrui.held=hsrui.held.filter(k=>k!==' + JSON.stringify(code) + ');1'),
    until: async (code, what, ms = 60000) => {
      const end = Date.now() + ms;
      while (Date.now() < end) {
        if (await page.ev(code).catch(() => false)) return;
        await sleep(100);
      }
      const state = await page.ev('JSON.stringify({ link: Net98.state, table: Net98.table && Net98.table.state, paused: !!(Net98.table && Net98.table.paused), turn: hsrui.netSession && hsrui.netSession.n, last: hsrui.netSession && hsrui.netSession.last, catching: hsrui.netSession && hsrui.netSession.catching, tick: hsrui.netSession && hsrui.netSession.A && hsrui.netSession.A.tick, wave: hsrui.netSession && hsrui.netSession.A && hsrui.netSession.A.wave, phase: hsrui.netSession && hsrui.netSession.A && hsrui.netSession.A.phase, frames: window.__e2e.frames, foes: hsrui.netSession && hsrui.netSession.A && hsrui.netSession.A.foes().length })').catch(err => String(err));
      throw new Error(name + ': timed out waiting for ' + what + ' ' + state);
    },
    goto: async target => {
      await send('Page.navigate', { url: target });
      await page.until('!!window.hsrui && document.readyState === "complete"', 'the game page', 120000);
      await page.ev(PAGE_SETUP);
    },
    shot: async file => {
      const data = await page.ev('hsrui.render();hsrui.canvas.toDataURL("image/png")');
      fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
    }
  };
  await page.goto(url);
  return page;
}

const arenaOf = field => '(hsrui.netSession && hsrui.netSession.A ? hsrui.netSession.A.' + field + ' : -1)';

async function whereStatesDiffer(pages) {
  const views = await Promise.all(pages.map(p => p.ev(`(() => {
    const s = hsrui.netSession, A = s.A, num = v => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v);
    return JSON.stringify({
      seat: s.seat, n: s.n, last: s.last, left: s.left, tick: A.tick, uid: A.uid, rng: A.rng.state(), wave: A.wave, phase: A.phase, resyncs: s.resyncs, turns: window.__e2e.turns,
      stats: A.stats, units: A.units.map(u => [u.uid, u.key, num(u.x), num(u.y), num(u.hp), num(u.en), u.dead ? 1 : 0, num(u.atkCd), u.fx.length, u.kind === 'hero' ? [u.gold, u.lvl, u.exp, u.pts, u.deaths, u.away ? 1 : 0, u.vote ? 1 : 0, num(u.cmdT), JSON.stringify(u.moveDir), u.hold ? 1 : 0, u.forced, u.sel] : null])
    });
  })()`)));
  const list = views.map(text => JSON.parse(text)), base = list[0], out = { heads: list.map(v => [v.seat, v.n, v.last, v.left, v.tick, v.uid, v.rng, v.wave, v.phase, v.resyncs, v.turns.length]) };
  list.slice(1).forEach((v, i) => {
    const firstTurn = base.turns.findIndex((t, k) => t !== v.turns[k]);
    if (firstTurn >= 0) out['turns' + (i + 1)] = [firstTurn, (base.turns[firstTurn] || '').slice(0, 200), (v.turns[firstTurn] || '').slice(0, 200)];
    const unit = base.units.findIndex((u, k) => JSON.stringify(u) !== JSON.stringify(v.units[k]));
    if (unit >= 0) out['unit' + (i + 1)] = [JSON.stringify(base.units[unit]), JSON.stringify(v.units[unit])];
    if (JSON.stringify(base.stats) !== JSON.stringify(v.stats)) out['stats' + (i + 1)] = [JSON.stringify(base.stats), JSON.stringify(v.stats)];
  });
  return out;
}

async function firstDiff(pages, ticks) {
  for (const n of ticks) {
    const snaps = (await Promise.all(pages.map(p => p.ev('window.__e2e.snaps[' + n + '] || null')))).map(x => (x ? JSON.parse(x) : null));
    const have = snaps.filter(Boolean);
    if (have.length < 2) continue;
    const out = { n, have: have.length, top: [] };
    const base = have[0];
    for (const v of have.slice(1)) {
      for (const k of ['rng', 'uid', 'breakT', 'waveT']) if (base[k] !== v[k]) out.top.push(k + ' ' + base[k] + ' / ' + v[k]);
      if (JSON.stringify(base.stats) !== JSON.stringify(v.stats)) out.top.push('stats ' + JSON.stringify(base.stats) + ' / ' + JSON.stringify(v.stats));
      if (base.units.length !== v.units.length) out.top.push('units ' + base.units.length + ' / ' + v.units.length);
      for (let i = 0; i < Math.min(base.units.length, v.units.length) && out.top.length < 16; i++) {
        const a = base.units[i], b = v.units[i];
        for (const k of new Set(Object.keys(a).concat(Object.keys(b)))) {
          const x = JSON.stringify(a[k]), y = JSON.stringify(b[k]);
          if (x !== y) out.top.push(a.uid + ' ' + a.key + ' ' + k + ': ' + String(x).slice(0, 90) + ' / ' + String(y).slice(0, 90));
        }
      }
      if (out.top.length) return out;
    }
    if (out.top.length) return out;
  }
  return null;
}

async function intoGame(p, i, url) {
  await p.ev('localStorage.setItem("net98.url",' + JSON.stringify(url) + ');hsrui.newGame();hsrui.game.script=null;hsrui.game.state.name=' + JSON.stringify('Игрок ' + (i + 1)) + ';hsrui.screens=[];hsrui.openHdHub();1');
}

async function startStack(o) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'net98-e2e-'));
  const edgeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'net98-e2e-edge-'));
  const web = spawn(process.execPath, ['server.js'], { cwd: ROOT, stdio: 'ignore', env: Object.assign({}, process.env, { PORT: String(WEB_PORT) }) });
  const relay = spawn(process.execPath, ['tools/net/server.cjs'], { cwd: ROOT, stdio: 'ignore', env: Object.assign({}, process.env, { NET_PORT: String(NET_PORT), NET_DATA: dataDir, NET_TURN_MS: String(100 / 3 / o.speed) }) });
  const base = 'http://127.0.0.1:' + WEB_PORT, lag = o.delay || o.jitter ? startLag(o.delay, o.jitter) : null;
  const netUrl = 'ws://127.0.0.1:' + (lag ? LAG_PORT : NET_PORT) + '/api/net';
  const adminStats = route => fetch('http://127.0.0.1:' + NET_PORT + '/api/net/admin/' + route).then(r => r.json());
  for (let i = 0; i < 80; i++) { try { await fetch(base + '/hsr98.html'); break; } catch (e) { await sleep(250); } }
  for (let i = 0; i < 80; i++) { try { await fetch('http://127.0.0.1:' + NET_PORT + '/api/net/ping'); break; } catch (e) { await sleep(250); } }
  const edge = spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + CDP_PORT, '--user-data-dir=' + edgeDir, '--no-first-run', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 80; i++) { try { await fetch('http://127.0.0.1:' + CDP_PORT + '/json/version'); break; } catch (e) { await sleep(250); } }
  const api = await openBrowserApi();
  const stop = async () => {
    try { api.ws.send(JSON.stringify({ id: 99999, method: 'Browser.close' })); await sleep(500); } catch (e) { void e; }
    if (lag) lag.close();
    for (const pid of [edge.pid, web.pid, relay.pid]) { try { execSync('taskkill /PID ' + pid + ' /T /F', { stdio: 'ignore' }); } catch (e) { void e; } }
  };
  return { api, base, netUrl, adminStats, stop, lagged: !!lag };
}

async function play(o) {
  const { api, base, netUrl, adminStats, stop, lagged } = await startStack(o);
  const report = { players: o.players, speed: o.speed, steps: [] };
  const log = text => { report.steps.push(text); console.log(text); };
  const shot = async (p, name) => { if (o.shots) { fs.mkdirSync(o.shots, { recursive: true }); await p.shot(path.join(o.shots, 'e2e-' + o.players + '-' + name + '.png')); } };
  const openPages = [];
  try {
    const pages = openPages;
    report.compared = 0;
    report.differ = 0;
    const checkpoint = async () => {
      const maps = (await Promise.all(pages.map(q => q.ev('JSON.stringify(window.__e2e.hashes)')))).map(text => JSON.parse(text));
      for (const t of Object.keys(maps[0])) {
        const vals = maps.map(m => m[t]).filter(Boolean);
        if (vals.length < 2) continue;
        report.compared++;
        if (new Set(vals).size !== 1) report.differ++;
      }
      await Promise.all(pages.map(q => q.ev('window.__e2e.hashes={};1')));
    };
    for (let i = 0; i < o.players; i++) { pages.push(await openPage(api, base + '/hsr98.html', 'P' + (i + 1))); await intoGame(pages[i], i, netUrl); }
    log('pages ready');
    for (const p of pages) {
      await p.ev('hsrui.top().sel=hsrui.top().items().findIndex(it=>it.id==="coop");1');
      await p.key('Enter');
      await p.until('!!hsrui.top().netConsent', 'consent');
      await p.key('ArrowLeft');
      await p.key('Enter');
      await p.until('Net98.state==="online"', 'link');
    }
    log('consent and link');
    const host = pages[0];
    await host.key('Enter');
    await host.until('!!Net98.table', 'a table');
    const code = await host.ev('Net98.table.code');
    log('table ' + code);
    await host.ev('hsrui.top().sel=1;1');
    await host.until('hsrui.top().hdTable&&Net98.table.host===Net98.seat', 'host rows');
    await host.key('Enter');
    await host.until('Net98.table.diff==="easy"', 'difficulty');
    await shot(host, 'lobby');
    for (let i = 1; i < pages.length; i++) {
      const p = pages[i];
      await p.ev('hsrui.top().sel=1;1');
      await p.key('Enter');
      await p.until('!!hsrui.top().textEntry', 'code entry');
      for (const ch of code) await p.key(/\d/.test(ch) ? 'Digit' + ch : 'Key' + ch);
      await p.key('Enter');
      await p.until('!!Net98.table', 'seat');
      await p.until('hsrui.top().hdTable', 'lobby');
      await p.ev('hsrui.top().sel=0;1');
      await p.key('Enter');
      await p.until('Net98.table.seats[Net98.seat].ready', 'ready');
    }
    await host.until('Net98.table.seats.filter(Boolean).length===' + o.players + '&&Net98.table.seats.filter(s=>s&&s.ready).length===' + (o.players - 1), 'all ready');
    await shot(host, 'lobby-full');
    await host.ev('hsrui.top().sel=0;1');
    await host.key('Enter');
    for (const p of pages) await p.until('!!hsrui.top().draft', 'draft');
    log('draft');
    await sleep(1400);
    await shot(pages[o.players - 1], 'draft');
    for (const p of pages) await p.key('Enter');
    for (const p of pages) await p.until('!!hsrui.top().arena', 'arena', 40000);
    const keys = await Promise.all(pages.map(p => p.ev('hsrui.netSession.A.heroes.map(h=>h.key).join()')));
    if (new Set(keys).size !== 1 || new Set(keys[0].split(',')).size !== o.players) throw new Error('crew differs: ' + keys.join(' / '));
    log('crew ' + keys[0]);
    await shot(pages[0], 'arena-start');
    if (lagged) {
      await host.ev('window.__e2e.stopBot=true;1');
      await sleep(1500);
      await host.ev('window.__e2e.samples=[];1');
      await sleep(400);
      const downAt = await host.ev('hsrui.held=["KeyW"];performance.now()');
      await sleep(500);
      const upAt = await host.ev('hsrui.held=[];performance.now()');
      await sleep(1200);
      report.feel = feelOf(await host.ev('window.__e2e.samples'), downAt, upAt);
      await host.ev('window.__e2e.samples=null;window.__e2e.stopBot=false;1');
      log('feel ' + JSON.stringify(report.feel));
    }

    await host.until(arenaOf('wave') + '>=2&&' + arenaOf('phase') + '==="wave"', 'wave 2', 300000);
    log('wave 2, pause in the middle of a wave');
    await host.key('KeyP');
    for (const p of pages) await p.until('hsrui.netPaused()', 'pause');
    for (const p of pages) await p.until('hsrui.netSession.credit()===0', 'the last turns', 20000);
    const ticks = await Promise.all(pages.map(p => p.ev(arenaOf('tick'))));
    if (new Set(ticks).size !== 1) throw new Error('pause stopped on different ticks: ' + ticks.join());
    const hashesAtPause = await Promise.all(pages.map(p => p.ev('hsrui.netSession.A.stateHash()')));
    if (new Set(hashesAtPause).size !== 1) throw new Error('pause: states differ ' + JSON.stringify(await whereStatesDiffer(pages)));
    await shot(pages[o.players - 1], 'pause');
    await sleep(1500);
    const still = await host.ev(arenaOf('tick'));
    if (still !== ticks[0]) throw new Error('the arena moved on pause');
    log('paused on one tick ' + ticks[0] + ', hash ' + hashesAtPause[0]);
    await host.key('KeyP');
    await host.until('!hsrui.netPaused()', 'pause lifted', 20000);
    await host.until(arenaOf('tick') + '>' + ticks[0], 'game goes on');
    log('pause lifted');

    const lost = pages[o.players - 1];
    await host.until(arenaOf('phase') + '==="wave"', 'a wave', 300000);
    log('drop in the middle of a wave');
    const lostTick = await lost.ev(arenaOf('tick'));
    await lost.ev('Net98.disconnect("offline");1');
    await sleep(1000);
    await shot(lost, 'lost');
    await sleep(11000 / Math.max(1, Math.min(o.speed, 1)));
    await host.until('hsrui.netSession.A.heroes[' + (o.players - 1) + '].away', 'away for the others', 30000);
    const standing = await lost.ev(arenaOf('tick'));
    const moving = await host.ev(arenaOf('tick'));
    if (moving <= standing) throw new Error('the table waited for the lost player');
    log('host at tick ' + moving + ', lost player at ' + standing + ' (dropped at ' + lostTick + ')');
    await lost.ev('Net98.connect();1');
    await lost.until('Net98.state==="online"', 'back online');
    await lost.until('!hsrui.netSession.catching&&hsrui.netSession.credit()<20', 'caught up', 60000);
    await host.until('!hsrui.netSession.A.heroes[' + (o.players - 1) + '].away', 'back for the others', 30000);
    log('returned and caught up');

    await checkpoint();
    log('one window goes wrong on purpose');
    await lost.ev('hsrui.netSession.A.heroes[0].gold += 1;1');
    await lost.until('hsrui.netSession && hsrui.netSession.resyncs === 1', 'the desync is noticed', 240000);
    await lost.until('hsrui.netSession.A && !hsrui.netSession.waitLog && !hsrui.netSession.catching && hsrui.netSession.credit() < 20', 'caught up after the desync', 60000);
    for (const q of pages) await q.until('hsrui.netSession.A && !hsrui.netSession.catching', 'all caught up', 60000);
    report.forced = (await adminStats('desync')).desync.length;
    report.resyncs = await Promise.all(pages.map(q => q.ev('hsrui.netSession.resyncs')));
    await Promise.all(pages.map(q => q.ev('window.__e2e.hashes={};1')));
    log('server noticed ' + report.forced + ', recounted: ' + report.resyncs.join());

    if (o.reload) {
      await host.until(arenaOf('phase') + '==="wave"', 'a wave', 300000);
      log('reload of a window in the middle of a wave');
      await checkpoint();
      await lost.goto(base + '/hsr98.html');
      await lost.until('Net98.state==="online"&&Net98.me&&Net98.me.table', 'the account remembers the table');
      await intoGame(lost, o.players - 1, netUrl);
      await lost.ev('hsrui.top().sel=hsrui.top().items().findIndex(it=>it.id==="rejoin");1');
      await shot(lost, 'hub-rejoin');
      await lost.key('Enter');
      await lost.until('!!hsrui.top().arena', 'arena after the journal', 60000);
      await lost.until('!hsrui.netSession.catching&&hsrui.netSession.credit()<20', 'caught up after reload', 60000);
      log('reloaded window caught up at tick ' + await lost.ev(arenaOf('tick')));
    }

    await shot(host, 'arena-mid');
    await host.until(arenaOf('wave') + '>' + o.waves + '||' + arenaOf('over') + '||!hsrui.netSession', 'wave ' + (o.waves + 1), 600000);
    const wave = await host.ev(arenaOf('wave'));
    log('reached wave ' + wave);
    await shot(pages[0], 'arena-late');
    await Promise.all(pages.map(p => p.ev('window.__e2e.stopBot=true;1')));
    await sleep(1500);
    await checkpoint();
    report.desync = (await adminStats('desync')).desync.length;
    report.errors = pages.flatMap(p => p.errors.map(e => p.name + ': ' + e));
    report.wave = wave;
    report.ok = wave > o.waves && report.compared > (o.speed > 1 ? 3 : 10) && report.differ === 0 && report.forced >= 1 && report.desync === report.forced && !report.errors.length;
    const leave = pages[0];
    await leave.key('Escape');
    await leave.ev('hsrui.top().sel=4;1');
    await leave.key('Enter');
    await leave.key('Enter');
    await leave.until('!!hsrui.top().result', 'result screen', 10000);
    await shot(leave, 'result');
  } catch (err) {
    report.failure = String(err && err.stack || err);
    report.ok = false;
    report.desync = await adminStats('desync').then(d => d.desync.slice(0, 3)).catch(() => null);
    report.events = await Promise.all(openPages.map(p => p.ev('window.__e2e.events.slice(-14)').catch(e => String(e))));
    if (report.desync && report.desync[0]) report.firstDiff = await firstDiff(openPages, report.desync.map(d => d.n)).catch(e => String(e));
    report.starts = await Promise.all(openPages.map(p => p.ev('JSON.stringify({ at: window.__e2e.arenaAt, last: window.__e2e.arenaLast, takes: window.__e2e.arenaTakes, turns: (window.__e2e.turns || []).slice(0, 7).map(t => t.slice(0, 110)) })').catch(e => String(e))));
  }
  console.log(JSON.stringify(report, null, 1));
  await stop();
  return report;
}

if (require.main === module) {
  play(args()).then(r => process.exit(r.ok ? 0 : 1)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = { play, args, startStack, openPage, intoGame, sleep, CDP_PORT };
