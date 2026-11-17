const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const BROWSER = process.env.SHOTS_BROWSER || (process.platform === 'win32' ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : '/usr/bin/chromium');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function args(argv) {
  const o = { steps: null, out: null, page: 'hsro.html', w: 1024, h: 700 };
  for (const a of argv) {
    if (a.startsWith('--page=')) o.page = a.slice(7);
    else if (a.startsWith('--size=')) [o.w, o.h] = a.slice(7).split('x').map(Number);
    else if (!o.steps) o.steps = path.resolve(a);
    else o.out = path.resolve(a);
  }
  if (!o.steps || !o.out) throw new Error('node tools/hsro-shot.cjs <steps.cjs> <out dir> [--page=hsro.html] [--size=1024x700]');
  return o;
}

async function main() {
  const o = args(process.argv.slice(2));
  const steps = require(o.steps);
  fs.mkdirSync(o.out, { recursive: true });
  const sport = 8200 + Math.floor(Math.random() * 700), dport = 9600 + Math.floor(Math.random() * 300);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hsroshot-'));
  const browser = spawn(BROWSER, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, `--window-size=${o.w},${o.h}`, '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  const stop = () => { try { browser.kill('SIGKILL'); } catch (e) { } server.kill(); };
  try {
    let target = null;
    for (let i = 0; i < 80 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${dport}/json/list`)).json()).find(t => t.type === 'page'); } catch (e) { } }
    if (!target) throw new Error('browser did not start');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r, { once: true }));
    let seq = 0;
    const pending = new Map();
    ws.addEventListener('message', m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
    const send = (method, params) => new Promise(r => { const i = ++seq; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async expr => {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      return r.result.exceptionDetails ? 'ERR ' + JSON.stringify(r.result.exceptionDetails).slice(0, 400) : r.result.result.value;
    };
    await send('Page.enable', {});
    await send('Runtime.enable', {});
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: "window.__errs=[];addEventListener('error',e=>window.__errs.push(String(e.message)));" });
    await send('Emulation.setDeviceMetricsOverride', { width: o.w, height: o.h, deviceScaleFactor: 1, mobile: false });
    for (let i = 0; i < 40; i++) { try { await fetch(`http://127.0.0.1:${sport}/`); break; } catch (e) { await sleep(200); } }
    await send('Page.navigate', { url: `http://127.0.0.1:${sport}/${o.page}` });
    await sleep(3000);
    for (const s of steps) {
      if (s.js) console.log(s.name || '', JSON.stringify(await ev(s.js)).slice(0, 400));
      if (s.wait) await sleep(s.wait);
      if (s.shot) {
        const r = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(o.out, s.shot + '.png'), Buffer.from(r.result.data, 'base64'));
        console.log('shot', s.shot);
      }
    }
    ws.close();
  } finally {
    stop();
  }
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
