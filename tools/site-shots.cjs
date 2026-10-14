const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomPort = (lo, span) => lo + Math.floor(Math.random() * span);

const usage = 'node tools/site-shots.cjs <outDir> <step>...\n  url:<address>   open the address in IE and save a screenshot\n  js:<expression>  run an expression in the page and print the result\n  wait:<ms>        wait\n  shot:<name>      save a screenshot of the IE window as <name>.png\nEnv SITE_SIZE=W,H sets the IE window size (default 1000,900).';

async function main() {
  const out = process.argv[2];
  const steps = process.argv.slice(3);
  if (!out || !steps.length) { console.log(usage); return; }
  fs.mkdirSync(out, { recursive: true });
  const [winW, winH] = (process.env.SITE_SIZE || '1000,900').split(',').map(Number);
  const sport = randomPort(8200, 700), dport = randomPort(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'siteedge-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, `--window-size=${winW + 40},${winH + 80}`, '--mute-audio', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  const cleanup = async () => {
    try {
      const v = await (await fetch(`http://127.0.0.1:${dport}/json/version`)).json();
      const bws = new WebSocket(v.webSocketDebuggerUrl);
      await new Promise(r => bws.addEventListener('open', r, { once: true }));
      bws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      await sleep(300);
    } catch (e) { }
    try { spawnSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (e) { }
    server.kill();
  };
  try {
    let target = null;
    for (let i = 0; i < 60 && !target; i++) {
      await sleep(250);
      try { target = (await (await fetch(`http://127.0.0.1:${dport}/json`)).json()).find(t => t.type === 'page'); } catch (e) { }
    }
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r, { once: true }));
    let id = 0;
    const pending = new Map();
    const errors = [];
    ws.addEventListener('message', m => {
      const d = JSON.parse(m.data);
      if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
      if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text);
      if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map(a => a.value || a.description).join(' '));
    });
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const evalJs = async expr => {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.result && r.result.exceptionDetails) return 'ERROR ' + (r.result.exceptionDetails.exception ? r.result.exceptionDetails.exception.description : r.result.exceptionDetails.text);
      return r.result && r.result.result ? r.result.result.value : r;
    };
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: winW + 40, height: winH + 80, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `http://127.0.0.1:${sport}/` });
    for (let i = 0; i < 80; i++) {
      await sleep(250);
      if (await evalJs('!!(window.appIE && window.winManager && document.querySelector(".taskbar"))')) break;
    }
    await sleep(1500);
    let count = 0;
    const shot = async name => {
      const rect = await evalJs(`(() => { const w = document.querySelector('.ie-content-frame'); if (!w) return null; const r = w.closest('.window, .win-window').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`);
      const clip = rect ? { x: Math.max(0, rect.x), y: Math.max(0, rect.y), width: rect.w, height: rect.h, scale: 1 } : undefined;
      const r = await send('Page.captureScreenshot', clip ? { format: 'png', clip } : { format: 'png' });
      const file = path.join(out, `${name}.png`);
      fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
      console.log('shot', file);
    };
    const open = async url => {
      const opened = await evalJs(`(() => {
        window.appIE.open(${JSON.stringify(url)});
        const el = document.querySelector('.ie-content-frame').closest('.window, .win-window');
        el.style.left = '0px'; el.style.top = '0px'; el.style.width = '${winW}px'; el.style.height = '${winH}px';
        const frame = document.querySelector('.ie-content-frame');
        frame.scrollTop = 0;
        return 'open';
      })()`);
      await sleep(900);
      return opened;
    };
    for (const step of steps) {
      const at = step.indexOf(':');
      const kind = step.slice(0, at);
      const arg = step.slice(at + 1);
      if (kind === 'url') {
        await open(arg);
        count++;
        await shot(String(count).padStart(2, '0') + '-' + arg.replace(/^https?:\/{2}/, '').replace(/[^a-z0-9]+/gi, '_').slice(0, 60));
      } else if (kind === 'js') {
        console.log('js', JSON.stringify(await evalJs(arg)));
      } else if (kind === 'wait') {
        await sleep(Number(arg) || 500);
      } else if (kind === 'shot') {
        await shot(arg);
      }
    }
    console.log('errors:', errors.length ? errors : 'none');
  } finally {
    await cleanup();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
