const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = globalThis.WebSocket;
const ROOT = path.join(__dirname, '..', '..');
const midiFile = process.argv[2], out = process.argv[3], sec = +process.argv[4] || 92, SR = +process.argv[5] || 22050;
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const page = `<!doctype html><script>window.Hsr98={};</script><script src="/js/apps/hsr98/hsr-core.js"></script><script src="/js/apps/hsr98/hsr-midi.js"></script>`;
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/') { res.setHeader('Content-Type', 'text/html'); res.end(page); return; }
  const f = u === '/song.mid' ? midiFile : path.join(ROOT, u);
  fs.readFile(f, (e, d) => { if (e) { res.statusCode = 404; res.end(); } else { res.setHeader('Content-Type', f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream'); res.end(d); } });
});
srv.listen(0, async () => {
  const port = srv.address().port;
  const dir = fs.mkdtempSync(path.join(process.env.TEMP, 'edge-'));
  const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir=' + dir, 'http://127.0.0.1:' + port + '/'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let dbg = '';
  const portFile = path.join(dir, 'DevToolsActivePort');
  const portD = await new Promise((ok, no) => {
    edge.stderr.on('data', d => { dbg += d; const m = dbg.match(/ws:\/\/[^\s]+:(\d+)\//); if (m) ok(m[1]); });
    const poll = setInterval(() => { try { const p = fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0]; if (p) { clearInterval(poll); ok(p); } } catch (e) {} }, 200);
    setTimeout(() => { clearInterval(poll); no(new Error('no devtools')); }, 20000);
  });
  await new Promise(r => setTimeout(r, 1500));
  const list = await (await fetch('http://127.0.0.1:' + portD + '/json')).json();
  const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  let id = 0; const wait = new Map();
  ws.onmessage = m => { const j = JSON.parse(m.data); if (wait.has(j.id)) { wait.get(j.id)(j); wait.delete(j.id); } };
  const send = (method, params) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const code = `(async () => {
    const H = window.Hsr98;
    const buf = await (await fetch('/song.mid')).arrayBuffer();
    const song = H.Midi.parse(buf);
    const c = new OfflineAudioContext(1, Math.round(${SR} * ${sec}), ${SR});
    const master = c.createGain(); master.gain.value = 0.9; master.connect(c.destination);
    const p = new H.Midi.Player(c, master, song);
    p.start(0.05);
    for (let t = 0.25; t < ${sec}; t += 0.25) { c.suspend(t).then(() => { p.pump(t + 1); c.resume(); }); }
    p.pump(1);
    const r = await c.startRendering();
    const d = r.getChannelData(0), pcm = new Int16Array(d.length);
    for (let i = 0; i < d.length; i++) pcm[i] = Math.max(-1, Math.min(1, d[i])) * 32767;
    let s = ''; const u = new Uint8Array(pcm.buffer), step = 0x8000;
    for (let i = 0; i < u.length; i += step) s += String.fromCharCode.apply(null, u.subarray(i, i + step));
    return JSON.stringify({ b64: btoa(s), len: song.length, ls: song.loopStart, le: song.loopEnd });
  })()`;
  const r = await send('Runtime.evaluate', { expression: code, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) { console.log(JSON.stringify(r.result.exceptionDetails).slice(0, 800)); }
  else {
    const j = JSON.parse(r.result.result.value), buf = Buffer.from(j.b64, 'base64');
    fs.writeFileSync(out, buf);
    console.log('rendered', out, 'len', j.len, 'loop', j.ls, j.le);
    const pcm = new Int16Array(buf.buffer, buf.byteOffset, buf.length >> 1), at = t => Math.round((t + 0.11) * SR);
    const db = (a, b) => { let s = 0, n = 0; for (let i = Math.max(0, a); i < Math.min(pcm.length, b); i++) { s += (pcm[i] / 32768) ** 2; n++; } return n ? 10 * Math.log10(s / n + 1e-12) : -120; };
    let peak = 1;
    for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
    console.log('level', db(at(j.ls), at(j.le)).toFixed(1), 'dB rms, peak', (20 * Math.log10(peak / 32768)).toFixed(1), 'dBFS, seam', (db(at(j.le), at(j.le + 2)) - db(at(j.le - 2), at(j.le))).toFixed(1), 'dB');
  }
  ws.close();
  try {
    const bws = new WebSocket((await (await fetch('http://127.0.0.1:' + portD + '/json/version')).json()).webSocketDebuggerUrl);
    await new Promise(r => { bws.onopen = r; });
    bws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
    await new Promise(r => setTimeout(r, 500));
  } catch (e) {}
  edge.kill(); srv.close();
  setTimeout(() => process.exit(0), 300);
});
