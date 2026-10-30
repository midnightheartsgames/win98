'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const games = require('./parohod98-game.cjs');
const { stageWww } = require('./parohod98-apk.cjs');
const { scenarios } = require('../tests/parohod98-launcher/scenarios.cjs');

const ROOT = path.resolve(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SIZES = [[640, 360], [800, 360], [915, 412], [1280, 800]];
const FAKE = fs.readFileSync(path.join(ROOT, 'tests', 'parohod98-launcher', 'fake-bridge.js'), 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function stage(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  stageWww(dir, { probe: false, version: '1.2' });
  const pic = path.join(dir, 'pic');
  fs.mkdirSync(pic, { recursive: true });
  for (const id of Object.keys(games.GAMES)) {
    const info = games.storeInfo(id);
    fs.writeFileSync(path.join(pic, id + '-icon.png'), info.icon);
    info.shots.forEach((s, i) => fs.copyFileSync(s.file, path.join(pic, id + '-' + (i + 1) + '.jpg')));
  }
}

async function cdp(port) {
  let page = null;
  for (let i = 0; i < 100 && !page; i++) {
    await sleep(200);
    try { page = (await (await fetch('http://127.0.0.1:' + port + '/json')).json()).find(t => t.type === 'page'); } catch (err) {}
  }
  if (!page) throw new Error('Edge did not start');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let seq = 0;
  const pending = new Map();
  const errors = [];
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); return; }
    if (d.method === 'Runtime.exceptionThrown') errors.push((d.params.exceptionDetails.exception || {}).description || d.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise(r => { const n = ++seq; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const value = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result && r.result.exceptionDetails) throw new Error(expr + ': ' + ((r.result.exceptionDetails.exception || {}).description || r.result.exceptionDetails.text));
    return r.result && r.result.result ? r.result.result.value : undefined;
  };
  return { ws, send, value, errors };
}

async function run(opts = {}) {
  const out = opts.out || path.join(ROOT, 'dist', 'parohod98-shots');
  const www = path.join(out, 'www');
  stage(www);
  const srv = await games.serveDir(path.resolve(www));
  const port = 9400 + Math.floor(Math.random() * 500);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'parohod98-shots-'));
  const edge = spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + profile, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  const list = scenarios().filter(s => !opts.only || opts.only.some(o => s.name.includes(o)));
  const sizes = opts.sizes || SIZES;
  const report = [];
  let c = null;
  try {
    c = await cdp(port);
    await c.send('Runtime.enable');
    await c.send('Page.enable');
    let script = null;
    for (const [w, h] of sizes) {
      const dir = path.join(out, w + 'x' + h);
      fs.mkdirSync(dir, { recursive: true });
      await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true });
      await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      for (const s of list) {
        if (script) await c.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: script });
        const r = await c.send('Page.addScriptToEvaluateOnNewDocument', { source: 'try{localStorage.clear()}catch(e){};window.P98_SCENARIO=' + JSON.stringify(s.sc) + ';\n' + FAKE });
        script = r.result.identifier;
        c.errors.length = 0;
        await c.send('Page.navigate', { url: 'http://127.0.0.1:' + srv.address().port + '/launcher/index.html' });
        await sleep(400);
        await c.value('document.fonts.ready.then(() => true)');
        for (const step of s.steps) {
          await c.value(step);
          await sleep(150);
        }
        await c.value('Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })))');
        await sleep(150);
        const overflow = await c.value('(() => { const v = document.getElementById("view"); const bad = []; for (const el of v.querySelectorAll("*")) { if (el.closest(".strip, .shelf")) continue; const r = el.getBoundingClientRect(); if (r.width && (r.right > innerWidth + 1 || r.left < -1)) bad.push(el.className || el.tagName); } return { page: document.documentElement.scrollWidth > innerWidth, bad: bad.slice(0, 5) }; })()');
        const shot = await c.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(dir, s.name + '.png'), Buffer.from(shot.result.data, 'base64'));
        report.push({ size: w + 'x' + h, name: s.name, errors: c.errors.slice(), overflow });
      }
    }
  } finally {
    try { if (c) c.ws.close(); } catch (err) {}
    try { execFileSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (err) {}
    srv.close();
    await sleep(300);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch (err) {}
  }
  return { out, report };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const only = args.filter(a => !a.startsWith('--'));
  const sizeArg = args.find(a => a.startsWith('--size='));
  const sizes = sizeArg ? sizeArg.slice(7).split(',').map(s => s.split('x').map(Number)) : undefined;
  run({ only: only.length ? only : null, sizes }).then(({ out, report }) => {
    let bad = 0;
    for (const r of report) {
      const problems = r.errors.concat(r.overflow && (r.overflow.page || r.overflow.bad.length) ? ['wider than the screen: ' + r.overflow.bad.join(', ')] : []);
      if (problems.length) bad++;
      console.log((problems.length ? 'FAIL ' : 'ok   ') + r.size + ' ' + r.name + (problems.length ? '\n     ' + problems.join('\n     ') : ''));
    }
    console.log(report.length + ' shots in ' + path.relative(ROOT, out) + (bad ? ', ' + bad + ' with problems' : ''));
    if (bad) process.exitCode = 1;
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { run, stage, cdp, SIZES };
