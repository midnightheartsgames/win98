const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { SAME_UPPER, SAME_LOWER, E_DIAERESIS, F101_UPPER, F101_LOWER } = require('./fallout-ru-glyphs.cjs');

const ROOT = path.join(__dirname, '..');
const GAME = path.join(ROOT, 'content', 'Fallout');
const RU = path.join(ROOT, 'content', 'fallout-ru');
const EDGE = process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const UPPER = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const LOWER = 'абвгдежзийклмнопрстуфхцчшщъыьэюя';
const PUNCT = '«»—…';
const LEVELS = 7;
const GAMMA = 0.8;
const BASE_Y = 200;
const RASTER = {
  100: { family: 'Bahnschrift', weight: '700', cap: 6, capTop: 1, hWidth: 8, lower: true, fit: 'ЁЙ' },
  102: { family: 'Bahnschrift', stretch: 'condensed', weight: '600', cap: 21, capTop: 0, hWidth: 8, lower: true, fit: 'ЁЙ' },
  103: { family: 'Impact', cap: 16, capTop: 0, hWidth: 6, noise: true, fit: 'ДЦЩЙ' },
  104: { family: 'Impact', cap: 22, capTop: 0, hWidth: 8, noise: true, fit: 'ДЦЩЙ' }
};
const CODE = ch => {
  const c = ch.charCodeAt(0);
  if (c >= 0x410 && c <= 0x44F) return c - 0x410 + 0xC0;
  return { 'Ё': 0xA8, 'ё': 0xB8, '«': 0xAB, '»': 0xBB, '—': 0x97, '…': 0x85 }[ch] || c;
};
const DEVTOOLS = ['http:', '', '127.0.0.1:'].join('/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

let FO = null;
function engine() {
  if (!FO) {
    for (const m of ['fo-core', 'fo-dat', 'fo-formats', 'fo-files', 'fo-text']) require(path.join(ROOT, 'js', 'apps', 'fallout', m + '.js'));
    FO = globalThis.FO;
  }
  return FO;
}

class Glyph {
  constructor(w, h, px) {
    this.w = w;
    this.h = h;
    this.px = px || new Uint8Array(w * h);
  }

  static art(rows, top, height) {
    const w = Math.max(...rows.map(r => r.length));
    const g = new Glyph(w, height);
    rows.forEach((r, j) => {
      for (let k = 0; k < r.length; k++) if (r[k] !== '.') g.px[(top + j) * w + k] = +r[k];
    });
    return g;
  }
}

function readGlyph(font, code) {
  const s = font.src;
  const gl = s.glyphs[code];
  if (!gl || !gl.w) return null;
  const g = new Glyph(gl.w, s.height);
  const top = s.height - gl.h;
  for (let y = 0; y < gl.h; y++) for (let x = 0; x < gl.w; x++) g.px[(top + y) * gl.w + x] = s.data[gl.off + y * gl.w + x];
  return g;
}

function writeAaf(src, glyphs) {
  const parts = [];
  let off = 0;
  const table = [];
  for (let c = 0; c < 256; c++) {
    const g = glyphs.get(c);
    if (!g || !g.w) {
      table.push([0, 0, off]);
      continue;
    }
    let top = 0;
    while (top < g.h - 1 && !g.px.subarray(top * g.w, (top + 1) * g.w).some(v => v)) top++;
    const data = g.px.slice(top * g.w);
    table.push([g.w, g.h - top, off]);
    parts.push(data);
    off += data.length;
  }
  const head = Buffer.alloc(12 + 256 * 8);
  head.write('AAFF', 0, 'latin1');
  head.writeUInt16BE(src.height, 4);
  head.writeUInt16BE(src.gapH, 6);
  head.writeUInt16BE(src.space, 8);
  head.writeUInt16BE(src.gapV, 10);
  table.forEach(([w, h, o], c) => {
    head.writeUInt16BE(w, 12 + c * 8);
    head.writeUInt16BE(h, 14 + c * 8);
    head.writeUInt32BE(o, 16 + c * 8);
  });
  return Buffer.concat([head, ...parts.map(p => Buffer.from(p))]);
}

const PAGE = `async spec => {
  await document.fonts.load((spec.weight || '') + ' 100px "' + spec.family + '"');
  const c = document.createElement('canvas');
  c.width = 400;
  c.height = 300;
  const x = c.getContext('2d', { willReadFrequently: true });
  const ink = (ch, size, sx, sy) => {
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, c.width, c.height);
    x.font = (spec.weight || '') + ' ' + size + 'px "' + spec.family + '"';
    if (spec.stretch) x.fontStretch = spec.stretch;
    x.fillStyle = '#000';
    x.textBaseline = 'alphabetic';
    x.setTransform(sx, 0, 0, sy, 20, ${BASE_Y});
    x.fillText(ch, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let x0 = 1e9;
    let x1 = -1;
    let y0 = 1e9;
    let y1 = -1;
    for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) if (d[(y * c.width + xx) * 4 + 3] > 20) {
      x0 = Math.min(x0, xx);
      x1 = Math.max(x1, xx);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    return { d, x0, x1, y0, y1 };
  };
  const ref = ink('H', 100, 1, 1);
  const size = spec.cap * 100 / (ref.y1 - ref.y0 + 1);
  const h = ink('H', size, 1, 1);
  const sx = spec.hWidth / (h.x1 - h.x0 + 1);
  const out = {};
  for (const ch of spec.chars) {
    const fit = (spec.fit || '').includes(ch);
    let sy = 1;
    if (fit) {
      const g0 = ink(ch, size, sx, 1);
      sy = spec.cap / (g0.y1 - g0.y0 + 1);
    }
    const g = ink(ch, size, sx, sy);
    const top = (fit ? g.y0 : ${BASE_Y} - spec.cap) - spec.capTop;
    const rows = [];
    for (let y = 0; y < spec.height; y++) {
      const row = [];
      for (let xx = g.x0; xx <= g.x1; xx++) row.push(g.d[((top + y) * c.width + xx) * 4 + 3]);
      rows.push(row);
    }
    out[ch] = rows;
  }
  return out;
}`;

async function rasterize(specs, page = PAGE) {
  const port = 9500 + Math.floor(Math.random() * 400);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fo-ru-'));
  const edge = spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + dir, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  try {
    let target = null;
    for (let i = 0; i < 80 && !target; i++) {
      await sleep(250);
      try {
        target = (await (await fetch(DEVTOOLS + port + '/json')).json()).find(t => t.type === 'page');
      } catch (e) {
        void e;
      }
    }
    if (!target) throw new Error('Edge did not start');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r, { once: true }));
    let id = 0;
    const pending = new Map();
    ws.addEventListener('message', m => {
      const d = JSON.parse(m.data);
      if (d.id && pending.has(d.id)) {
        pending.get(d.id)(d);
        pending.delete(d.id);
      }
    });
    const run = expr => new Promise(r => {
      const i = ++id;
      pending.set(i, r);
      ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression: expr, awaitPromise: true, returnByValue: true } }));
    });
    const out = {};
    for (const [key, spec] of Object.entries(specs)) {
      const r = await run('(' + page + ')(' + JSON.stringify(spec) + ')');
      if (!r.result || r.result.exceptionDetails) throw new Error('rasterizing ' + key + ': ' + JSON.stringify(r.result && r.result.exceptionDetails));
      out[key] = r.result.result.value;
    }
    ws.close();
    return out;
  } finally {
    spawnSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' });
  }
}

function hash(x, y, c) {
  let h = (x * 374761393 + y * 668265263 + c * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

function fromAlpha(rows, height, noise, ch) {
  const w = rows[0].length;
  const g = new Glyph(w, height);
  rows.forEach((row, y) => row.forEach((a, x) => {
    let v = Math.round(Math.pow(a / 255, GAMMA) * LEVELS);
    if (noise && v >= 5) v -= hash(x, y, ch.charCodeAt(0)) % 3;
    g.px[y * w + x] = v;
  }));
  return g;
}

function uniqueChars(spec, font) {
  const up = [...UPPER].filter(c => !SAME_UPPER[c]);
  const low = spec.lower ? [...LOWER].filter(c => !SAME_LOWER[c]) : [];
  const extra = [];
  if (!readGlyph(font, E_DIAERESIS.UPPER)) extra.push('Ё');
  if (spec.lower && !readGlyph(font, E_DIAERESIS.LOWER)) extra.push('ё');
  for (const p of PUNCT) if (!readGlyph(font, CODE(p))) extra.push(p);
  return up.join('') + low.join('') + extra.join('');
}

async function build() {
  engine();
  const D = await FO.Data.open(FO.nodeSource(GAME), FO.LOOSE);
  const fonts = {};
  for (const n of [0, 1, 2, 3, 4]) fonts[100 + n] = new FO.Font(FO.readAaf(await D.get('FONT' + n + '.AAF')));
  const specs = {};
  for (const [id, spec] of Object.entries(RASTER)) specs[id] = { ...spec, height: fonts[id].src.height, chars: uniqueChars(spec, fonts[id]) };
  const raster = await rasterize(specs);
  const out = {};
  for (const n of [0, 1, 2, 3, 4]) {
    const id = 100 + n;
    const font = fonts[id];
    const height = font.src.height;
    const latin = ch => readGlyph(font, typeof ch === 'number' ? ch : ch.charCodeAt(0));
    const glyphs = new Map();
    for (let c = 0; c < 256; c++) {
      const g = readGlyph(font, c);
      if (g) glyphs.set(c, g);
    }
    for (let c = 0xC0; c <= 0xFF; c++) glyphs.delete(c);
    const made = {};
    for (const [c, l] of Object.entries(SAME_UPPER)) made[c] = latin(l);
    made['Ё'] = latin(E_DIAERESIS.UPPER);
    if (id === 101) {
      for (const [c, l] of Object.entries(SAME_LOWER)) made[c] = latin(l);
      for (const [c, rows] of Object.entries(F101_UPPER)) made[c] = Glyph.art(rows, 0, height);
      for (const [c, [top, rows]] of Object.entries(F101_LOWER)) made[c] = Glyph.art(rows, top, height);
      made['ё'] = latin(E_DIAERESIS.LOWER);
    } else {
      const spec = RASTER[id];
      for (const [c, rows] of Object.entries(raster[id])) made[c] = fromAlpha(rows, height, spec.noise, c);
      if (spec.lower) {
        for (const [c, l] of Object.entries(SAME_LOWER)) made[c] = latin(l);
        if (!made['ё']) made['ё'] = latin(E_DIAERESIS.LOWER);
      } else {
        for (const c of LOWER) made[c] = made[UPPER[LOWER.indexOf(c)]];
        made['ё'] = made['Ё'];
      }
    }
    for (const [ch, g] of Object.entries(made)) {
      if (!g) throw new Error('font ' + id + ': no glyph for ' + ch);
      glyphs.set(CODE(ch), g);
    }
    const missing = [...UPPER + LOWER + 'Ёё' + PUNCT].filter(ch => !glyphs.has(CODE(ch)));
    if (missing.length) throw new Error('font ' + id + ' misses ' + missing.join(''));
    out['FONT' + n + '.AAF'] = writeAaf(font.src, glyphs);
  }
  return out;
}

module.exports = { build, rasterize, UPPER, LOWER, PUNCT, CODE };

if (require.main === module) {
  build().then(files => {
    fs.mkdirSync(RU, { recursive: true });
    for (const [name, buf] of Object.entries(files)) {
      fs.writeFileSync(path.join(RU, name), buf);
      console.log(name, buf.length);
    }
  }).catch(e => {
    console.error(e.message);
    process.exitCode = 1;
  });
}
