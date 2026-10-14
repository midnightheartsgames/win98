const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const port = (lo, span) => lo + Math.floor(Math.random() * span);

const RENDER = (id, sec, sr) => `(async () => {
  const S = window.SamMax;
  const th = S.THEMES[${JSON.stringify(id)}];
  if (!th) return 'no theme';
  const c = new OfflineAudioContext(1, Math.round(${sr} * ${sec}), ${sr});
  const A = new S.Audio();
  A.ctx = c;
  A.master = c.createGain(); A.master.gain.value = 0.85; A.master.connect(c.destination);
  A.comp = c.createDynamicsCompressor(); A.comp.connect(A.master);
  A.mbus = c.createGain(); A.mbus.gain.value = 0.5 * 0.55; A.mbus.connect(A.comp);
  A.sbus = c.createGain(); A.sbus.connect(A.comp);
  A.mfade = c.createGain(); A.mfade.connect(A.mbus);
  A.noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const nd = A.noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const spb = 60 / th.bpm, e = spb / 2;
  const sw = S.STYLES[th.style] && S.STYLES[th.style].swing;
  let t = 0.05, step = 0;
  while (t < ${sec}) { A.playStep(th, step, t, e); t += e * (sw ? (step % 2 === 0 ? 1.18 : 0.82) : 1); step++; }
  const buf = await c.startRendering();
  const d = buf.getChannelData(0);
  const pcm = new Int16Array(d.length);
  for (let i = 0; i < d.length; i++) pcm[i] = Math.max(-1, Math.min(1, d[i])) * 32767;
  const bytes = new Uint8Array(pcm.buffer);
  let s = '';
  for (let i = 0; i < bytes.length; i += 32768) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
  return btoa(s);
})()`;

function wav(pcm, sr) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

(async () => {
  const out = path.resolve(process.argv[2] || os.tmpdir());
  const ids = (process.argv[3] || 'bt_title').split(',');
  const sec = Number(process.argv[4] || 30), sr = 22050;
  fs.mkdirSync(out, { recursive: true });
  const sport = port(8200, 700), dport = port(9500, 400);
  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(sport) }, stdio: 'ignore' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bttf-music-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, '--mute-audio', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  const done = () => { try { edge.kill(); } catch (e) { return; } server.kill(); };
  try {
    let target = null;
    for (let i = 0; i < 60 && !target; i++) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${dport}/json`)).json()).find(t => t.type === 'page'); } catch (e) { target = null; } }
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r));
    let seq = 0;
    const wait = new Map();
    ws.addEventListener('message', ev => { const d = JSON.parse(ev.data); if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); } });
    const send = (method, params) => new Promise(r => { const id = ++seq; wait.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
    const evalJs = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result && r.result.result ? r.result.result.value : JSON.stringify(r.result); };
    for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://127.0.0.1:${sport}/bttf.html`)).status === 200) break; } catch (e) { await sleep(250); } }
    await send('Page.navigate', { url: `http://127.0.0.1:${sport}/bttf.html` });
    for (let i = 0; i < 120; i++) { await sleep(250); if (await evalJs('!!(window.SamMax && window.SamMax.THEMES && window.btui)')) break; }
    for (const id of ids) {
      const b64 = await evalJs(RENDER(id, sec, sr));
      if (!b64 || b64.length < 100) { console.log(id, 'failed', b64); continue; }
      const file = path.join(out, id + '.wav');
      fs.writeFileSync(file, wav(Buffer.from(b64, 'base64'), sr));
      console.log(id, file);
    }
    ws.close();
  } finally { done(); }
})();
