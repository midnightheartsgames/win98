const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = 'content/hsro';
const CLIPS = ['idle', 'run', 'attack', 'cast', 'death'];
const BUDGETS = [
  { prefix: 'hero_', tris: [400, 1800], tex: 256, bones: 27, clips: CLIPS, height: [1.55, 1.95] },
  { prefix: 'npc_', tris: [300, 1500], tex: 256, bones: 27, clips: ['idle'] },
  { prefix: 'foe_', tris: [150, 1200], tex: 256, bones: 24, clips: ['idle', 'run', 'attack', 'death'] },
  { prefix: 'elite_', tris: [300, 3500], tex: 512, bones: 24, clips: ['idle', 'run', 'attack', 'death'] },
  { prefix: 'boss_', tris: [500, 5000], tex: 512, bones: 24, clips: ['idle', 'run', 'attack', 'death'] },
  { prefix: 'part_', tris: [8, 700], tex: 256, bones: 27, clips: [] },
  { prefix: 'kit_', tris: [2, 800], tex: 256, bones: 0, clips: [] },
  { prefix: 'prop_', tris: [2, 600], tex: 256, bones: 0, clips: [] }
];
const SIZES = { f: 4, B: 1, H: 2 };
const COMPS = { pos: 3, nor: 3, uv: 2, uv2: 2, joints: 4, weights: 2 };

function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.length < 24 || b.toString('ascii', 1, 4) !== 'PNG') return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const pow2 = n => n > 0 && (n & (n - 1)) === 0;

function readModel(root, id) {
  const dir = path.join(root, OUT);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'mesh', id + '.json'), 'utf8'));
  const raw = fs.readFileSync(path.join(dir, meta.bin));
  const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
  const arr = name => {
    const v = meta.views[name];
    if (!v) return null;
    const n = name === 'idx' || name.startsWith('clip:') ? v.count : v.count * COMPS[name];
    return { f: Float32Array, B: Uint8Array, H: Uint16Array }[v.type] && new ({ f: Float32Array, B: Uint8Array, H: Uint16Array }[v.type])(buf, v.offset, n);
  };
  return { meta, raw, arr };
}

function check(root) {
  const base = root || ROOT;
  const dir = path.join(base, OUT, 'mesh');
  const errors = [], models = {};
  if (!fs.existsSync(dir)) return { errors: ['нет папки ' + OUT + '/mesh'], models };
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.json')).sort()) {
    const id = f.slice(0, -5);
    const bad = m => errors.push(id + ': ' + m);
    let m;
    try { m = readModel(base, id); } catch (err) { bad('не читается: ' + err.message); continue; }
    const { meta, raw, arr } = m;
    models[id] = meta;
    const rule = BUDGETS.find(r => id.startsWith(r.prefix));
    if (!rule) { bad('неизвестная приставка имени'); continue; }
    if (meta.id !== id) bad('id в файле не совпадает с именем');
    if (meta.tris < rule.tris[0] || meta.tris > rule.tris[1]) bad('треугольников ' + meta.tris + ', предел ' + rule.tris.join('–'));
    if (meta.bones.length > rule.bones) bad('костей ' + meta.bones.length + ', предел ' + rule.bones);
    for (const [name, v] of Object.entries(meta.views)) {
      const end = v.offset + (name === 'idx' || name.startsWith('clip:') ? v.count : v.count * COMPS[name]) * SIZES[v.type];
      if (end > raw.length) bad('вид ' + name + ' выходит за файл');
      if (v.offset % 4) bad('вид ' + name + ' не выровнен');
    }
    const pos = arr('pos'), idx = arr('idx');
    if (pos.length / 3 !== meta.verts) bad('число вершин не совпадает');
    for (const i of idx) if (i >= meta.verts) { bad('индекс за пределами вершин'); break; }
    for (const v of pos) if (!Number.isFinite(v)) { bad('вершина не число'); break; }
    if (rule.height) {
      const h = meta.bounds[4] - meta.bounds[1];
      if (h < rule.height[0] || h > rule.height[1]) bad('рост ' + h.toFixed(2) + ' м, предел ' + rule.height.join('–'));
      if (Math.abs(meta.bounds[1]) > 0.03) bad('ноги не на нуле');
    }
    if (meta.bones.length) {
      const j = arr('joints'), w = arr('weights');
      for (let i = 0; i < meta.verts; i++) {
        if (j[i * 4] >= meta.bones.length || j[i * 4 + 1] >= meta.bones.length) { bad('кость вершины за пределами скелета'); break; }
        if (Math.abs(w[i * 2] + w[i * 2 + 1] - 1) > 1e-3) { bad('веса вершины не дают 1'); break; }
      }
      if (meta.fps !== 15) bad('частота анимации ' + meta.fps + ', нужна 15');
      for (const c of rule.clips) if (!meta.clips[c]) bad('нет анимации ' + c);
      for (const [name, c] of Object.entries(meta.clips)) {
        const d = arr(c.view);
        if (!d || d.length !== c.frames * meta.bones.length * 7) bad('анимация ' + name + ' неверной длины');
      }
      meta.parents.forEach((p, i) => { if (p >= i) bad('родитель кости ' + meta.bones[i] + ' идёт после неё'); });
    }
    for (const key of ['tex', 'lightmap']) {
      if (!meta[key]) continue;
      const file = path.join(base, OUT, meta[key]);
      if (!fs.existsSync(file)) { bad('нет файла ' + meta[key]); continue; }
      const s = pngSize(file);
      if (!s) bad(meta[key] + ' не PNG');
      else {
        if (!pow2(s.w) || !pow2(s.h)) bad(meta[key] + ' не степень двойки: ' + s.w + '×' + s.h);
        const lim = key === 'lightmap' ? 1024 : rule.tex;
        if (s.w > lim || s.h > lim) bad(meta[key] + ' больше ' + lim);
      }
    }
    if (!meta.tex) bad('нет текстуры');
  }
  return { errors, models };
}

if (require.main === module) {
  const cmd = process.argv[2] || 'check';
  if (cmd !== 'check') { console.log('node tools/hsro-art.cjs check'); process.exit(1); }
  const r = check(ROOT);
  for (const [id, m] of Object.entries(r.models)) console.log(id.padEnd(16), m.kind.padEnd(8), String(m.tris).padStart(5), 'тр.', String(m.bones.length).padStart(3), 'кост.', Object.keys(m.clips).join(','));
  if (r.errors.length) { console.log(r.errors.join('\n')); process.exit(1); }
  console.log('графика в порядке: ' + Object.keys(r.models).length + ' моделей');
}

module.exports = { check, readModel, BUDGETS, CLIPS };
