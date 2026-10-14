const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');

const ROOT = path.join(__dirname, '..');
const QUANT = 2048;
const AXES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const AXIS_NAMES = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'];

function runModules(ns, files) {
  const ctx = { console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  return ctx[ns];
}

function maxPayneRig() {
  const A = runModules('MaxPayne', ['js/apps/maxpayne/mp-anim.js']).Anim;
  const bones = A.BONES.map((b, i) => ({ i, name: b[0], parent: b[1], off: b[2].slice() }));
  const at = n => bones.find(b => b.name === n);
  return { bones, legLen: v3.len(at('shinL').off) + v3.len(at('footL').off), hip: bones[0].off[1], ankles: [[at('footL').i, [0, 0, 0]], [at('footR').i, [0, 0, 0]]] };
}

function overwatchRig() {
  const O = runModules('Ow98', ['js/apps/ow98/ow-core.js', 'js/apps/ow98/ow-models.js']);
  const S = O.skel(1.8);
  const names = Object.keys(O.BONES).sort((a, b) => O.BONES[a] - O.BONES[b]);
  const bones = names.map((name, i) => {
    const p = O.BONE_PARENT[i];
    return { i, name, parent: p, off: p < 0 ? S.J[i].slice() : v3.sub(S.J[i], S.J[p]) };
  });
  const tip = [0, S.ankle - S.knee, 0];
  return { bones, legLen: S.hip - S.ankle, hip: S.hip, ankles: [[O.BONES.LLL, tip], [O.BONES.LLR, tip]] };
}

const GAMES = {
  maxpayne: {
    rig: maxPayneRig,
    ns: 'MaxPayne',
    param: 'M',
    src: 'src/mixamo/maxpayne',
    out: 'js/apps/maxpayne/mp-mocap.js',
    forward: [0, 0, -1],
    hipJoints: ['thighL', 'thighR'],
    bones: {
      pelvis: { from: 'Hips', to: 'Spine' },
      spine: { from: 'Spine', to: 'Spine2', twist: 'Spine1' },
      chest: { from: 'Spine2', to: 'Neck' },
      neck: { from: 'Neck', to: 'Head' },
      head: { from: 'Head', to: 'HeadTop_End', dir: [0, 1, 0] },
      uarmL: { from: 'LeftArm', to: 'LeftForeArm', hinge: 1 },
      farmL: { from: 'LeftForeArm', to: 'LeftHand' },
      handL: { from: 'LeftHand', to: ['LeftHandMiddle1', 'LeftHandIndex1', 'LeftHandRing1'], dir: [0, -1, 0] },
      uarmR: { from: 'RightArm', to: 'RightForeArm', hinge: 1 },
      farmR: { from: 'RightForeArm', to: 'RightHand' },
      handR: { from: 'RightHand', to: ['RightHandMiddle1', 'RightHandIndex1', 'RightHandRing1'], dir: [0, -1, 0] },
      thighL: { from: 'LeftUpLeg', to: 'LeftLeg', hinge: -1 },
      shinL: { from: 'LeftLeg', to: 'LeftFoot' },
      footL: { from: 'LeftFoot', to: 'LeftToeBase', dir: [0, -0.42, -0.91], hint: 'right' },
      thighR: { from: 'RightUpLeg', to: 'RightLeg', hinge: -1 },
      shinR: { from: 'RightLeg', to: 'RightFoot' },
      footR: { from: 'RightFoot', to: 'RightToeBase', dir: [0, -0.42, -0.91], hint: 'right' }
    },
    clips: {
      idle: { file: 'Breathing Idle', loop: true },
      idle_stance: { file: 'idle (2)', loop: true, root: false, step: 2 },
      idle_look: { file: 'idle', loop: true, root: false },
      idle_shift: { file: 'idle (3)', loop: true, root: false },
      walk: { file: 'Walking', loop: true, gait: true },
      run: { file: 'Slow Run', loop: true, gait: true },
      sprint: { file: 'running', loop: true, gait: true },
      run_stop: { file: 'run to stop', root: false },
      turn_l: { file: 'left turn', loop: true, root: false },
      turn_r: { file: 'right turn', loop: true, root: false },
      jump_up: { file: 'jumping up', root: false },
      fall: { file: 'falling idle', loop: true, root: false },
      land_hard: { file: 'hard landing', root: false, ground: 'min' },
      land_roll: { file: 'falling to roll', root: false, ground: 'min' },
      cover_in_tall: { file: 'stand to cover', root: false },
      cover_in_low: { file: 'stand to cover (2)', root: false },
      cover_out_tall: { file: 'cover to stand (2)', root: false },
      cover_out_low: { file: 'cover to stand', root: false },
      cover_idle_tall: { file: 'idle (5)', loop: true, root: false },
      cover_idle_low: { file: 'idle (4)', loop: true, root: false },
      cover_left_tall: { file: 'left cover sneak', loop: true, root: false },
      cover_right_tall: { file: 'right cover sneak', loop: true, root: false },
      cover_left_low: { file: 'crouched sneaking left', loop: true, root: false },
      cover_right_low: { file: 'crouched sneaking right', loop: true, root: false },
      death_back: { file: 'Falling Back Death', align: 'start' },
      death_front: { file: 'Death From The Back', align: 'start' }
    }
  },
  overwatch: {
    rig: overwatchRig,
    ns: 'Ow98',
    param: 'O',
    src: 'src/mixamo/overwatch',
    out: 'js/apps/ow98/ow-mocap.js',
    forward: [0, 0, 1],
    hipJoints: ['ULL', 'ULR'],
    bones: {
      ROOT: { from: 'Hips', to: 'Spine' },
      SPINE: { from: 'Spine', to: 'Neck', twist: 'Spine2' },
      HEAD: { from: 'Neck', to: 'HeadTop_End', twist: 'Head', dir: [0, 1, 0] },
      UAL: { from: 'LeftArm', to: 'LeftForeArm', hinge: 1 },
      LAL: { from: 'LeftForeArm', to: 'LeftHand', dir: [0, -1, 0] },
      UAR: { from: 'RightArm', to: 'RightForeArm', hinge: 1 },
      LAR: { from: 'RightForeArm', to: 'RightHand', dir: [0, -1, 0] },
      ULL: { from: 'LeftUpLeg', to: 'LeftLeg', hinge: -1 },
      LLL: { from: 'LeftLeg', to: 'LeftFoot', dir: [0, -1, 0] },
      ULR: { from: 'RightUpLeg', to: 'RightLeg', hinge: -1 },
      LLR: { from: 'RightLeg', to: 'RightFoot', dir: [0, -1, 0] }
    },
    clips: {
      tracer_dance: { file: 'Swing Dancing', loop: true, stay: 1.2 }
    }
  }
};

const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  scale: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: a => Math.hypot(a[0], a[1], a[2]),
  norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  perp: (v, p) => { const d = v[0] * p[0] + v[1] * p[1] + v[2] * p[2]; return [v[0] - p[0] * d, v[1] - p[1] * d, v[2] - p[2] * d]; }
};

const m3 = {
  ident: () => [1, 0, 0, 0, 1, 0, 0, 0, 1],
  mul: (a, b) => {
    const r = new Array(9);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
    return r;
  },
  tr: a => [a[0], a[3], a[6], a[1], a[4], a[7], a[2], a[5], a[8]],
  apply: (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]],
  cols: (a, b, c) => [a[0], b[0], c[0], a[1], b[1], c[1], a[2], b[2], c[2]],
  rotY: t => { const c = Math.cos(t), s = Math.sin(t); return [c, 0, s, 0, 1, 0, -s, 0, c]; },
  rotX: t => { const c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, c, -s, 0, s, c]; },
  rotZ: t => { const c = Math.cos(t), s = Math.sin(t); return [c, -s, 0, s, c, 0, 0, 0, 1]; },
  euler: (x, y, z) => m3.mul(m3.mul(m3.rotY(y), m3.rotX(x)), m3.rotZ(z))
};

const m4 = {
  ident: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  mul: (a, b) => {
    const r = new Array(16);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) r[i * 4 + j] = a[i * 4] * b[j] + a[i * 4 + 1] * b[4 + j] + a[i * 4 + 2] * b[8 + j] + a[i * 4 + 3] * b[12 + j];
    return r;
  },
  translate: v => [1, 0, 0, v[0], 0, 1, 0, v[1], 0, 0, 1, v[2], 0, 0, 0, 1],
  scale: v => [v[0], 0, 0, 0, 0, v[1], 0, 0, 0, 0, v[2], 0, 0, 0, 0, 1],
  rotate: (axis, deg) => {
    const [x, y, z] = v3.norm(axis), a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), t = 1 - c;
    return [t * x * x + c, t * x * y - s * z, t * x * z + s * y, 0, t * x * y + s * z, t * y * y + c, t * y * z - s * x, 0, t * x * z - s * y, t * y * z + s * x, t * z * z + c, 0, 0, 0, 0, 1];
  },
  from3: m => [m[0], m[1], m[2], 0, m[3], m[4], m[5], 0, m[6], m[7], m[8], 0, 0, 0, 0, 1],
  pos: m => [m[3], m[7], m[11]],
  rot: m => {
    const a = v3.norm([m[0], m[4], m[8]]), b = v3.norm([m[1], m[5], m[9]]), c = v3.norm([m[2], m[6], m[10]]);
    return m3.cols(a, b, c);
  }
};

function parseXml(src) {
  const root = { tag: '', attrs: {}, kids: [], text: '' };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|<![^>]*>|<\/([^\s>]+)\s*>|<([^\s/>!?]+)([^>]*?)(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(src))) {
    const top = stack[stack.length - 1];
    if (m[1] !== undefined) top.text += m[1];
    else if (m[2]) { if (stack.length > 1) stack.pop(); }
    else if (m[3]) {
      const attrs = {};
      for (const a of m[4].matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)) attrs[a[1]] = a[2];
      const el = { tag: m[3], attrs, kids: [], text: '' };
      top.kids.push(el);
      if (!m[5]) stack.push(el);
    } else if (m[6]) top.text += m[6];
  }
  return root;
}

const kid = (el, tag) => el && el.kids.find(k => k.tag === tag);
const kidsOf = (el, tag) => el ? el.kids.filter(k => k.tag === tag) : [];
const nums = text => text.trim() ? text.trim().split(/\s+/).map(Number) : [];
function walk(el, fn) { if (!el) return; fn(el); for (const k of el.kids) walk(k, fn); }

function readZip(buf, want) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 70000); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('not a zip file');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20);
    const nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nl);
    p += 46 + nl + el + cl;
    if (!want.test(name)) continue;
    const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28);
    const data = buf.subarray(start, start + size);
    return method === 0 ? data : zlib.inflateRawSync(data);
  }
  throw new Error('no .dae inside zip');
}

function loadCollada(text) {
  const doc = parseXml(text);
  const col = kid(doc, 'COLLADA');
  if (!col) throw new Error('not a COLLADA file');
  const up = (kid(kid(col, 'asset'), 'up_axis') || { text: 'Y_UP' }).text.trim();
  const scenes = kidsOf(kid(col, 'library_visual_scenes'), 'visual_scene');
  const inst = kid(kid(col, 'scene'), 'instance_visual_scene');
  const scene = (inst && scenes.find(s => '#' + s.attrs.id === inst.attrs.url)) || scenes[0];
  if (!scene) throw new Error('no visual_scene');
  const byId = {};
  const nodes = [];
  function readNode(el, parent) {
    const n = { id: el.attrs.id, name: el.attrs.name || el.attrs.id || '', joint: el.attrs.type === 'JOINT', parent, xf: [], kids: [] };
    for (const k of el.kids) {
      if (k.tag === 'matrix' || k.tag === 'translate' || k.tag === 'rotate' || k.tag === 'scale') n.xf.push({ kind: k.tag, sid: k.attrs.sid, v: nums(k.text), anim: [] });
      else if (k.tag === 'lookat' || k.tag === 'skew') throw new Error('unsupported transform ' + k.tag);
    }
    nodes.push(n);
    if (n.id) byId[n.id] = n;
    for (const k of el.kids) if (k.tag === 'node') n.kids.push(readNode(k, n));
    return n;
  }
  const roots = kidsOf(scene, 'node').map(e => readNode(e, null));
  const sources = {}, samplers = {}, channels = [];
  for (const lib of kidsOf(col, 'library_animations')) walk(lib, el => {
    if (el.tag === 'source') {
      const fa = kid(el, 'float_array');
      const acc = kid(kid(el, 'technique_common'), 'accessor');
      sources[el.attrs.id] = { v: fa ? nums(fa.text) : [], stride: acc ? +(acc.attrs.stride || 1) : 1 };
    } else if (el.tag === 'sampler') {
      const s = {};
      for (const i of kidsOf(el, 'input')) s[i.attrs.semantic] = i.attrs.source.replace(/^#/, '');
      samplers[el.attrs.id] = s;
    } else if (el.tag === 'channel') channels.push({ sampler: el.attrs.source.replace(/^#/, ''), target: el.attrs.target });
  });
  let t0 = Infinity, t1 = -Infinity, dt = Infinity;
  for (const ch of channels) {
    const smp = samplers[ch.sampler];
    const tm = /^([^/]+)\/([^.(]+)(.*)$/.exec(ch.target);
    if (!smp || !tm) continue;
    const node = byId[tm[1]];
    const xf = node && node.xf.find(x => x.sid === tm[2]);
    if (!xf) continue;
    const input = sources[smp.INPUT], output = sources[smp.OUTPUT];
    const mem = tm[3];
    let idx = null;
    if (mem === '.ANGLE') idx = [3];
    else if (mem === '.X') idx = [0];
    else if (mem === '.Y') idx = [1];
    else if (mem === '.Z') idx = [2];
    else if (mem) {
      const ps = [...mem.matchAll(/\((\d+)\)/g)].map(q => +q[1]);
      idx = ps.length === 2 ? [ps[0] * 4 + ps[1]] : [ps[0]];
    } else if (output.stride !== xf.v.length) idx = xf.kind === 'rotate' && output.stride === 1 ? [3] : null;
    xf.anim.push({ times: input.v, vals: output.v, stride: output.stride, idx });
    const tv = input.v;
    if (tv.length) { t0 = Math.min(t0, tv[0]); t1 = Math.max(t1, tv[tv.length - 1]); }
    for (let i = 1; i < tv.length; i++) if (tv[i] - tv[i - 1] > 1e-5) dt = Math.min(dt, tv[i] - tv[i - 1]);
  }
  if (!isFinite(t0)) throw new Error('file has no animation channels');
  const fps = Math.round(1 / dt);
  return { up, roots, nodes, t0, t1, fps };
}

function sampleTrack(a, t) {
  const T = a.times, n = T.length, k = a.stride;
  if (t <= T[0]) return a.vals.slice(0, k);
  if (t >= T[n - 1]) return a.vals.slice((n - 1) * k, n * k);
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (T[mid] <= t) lo = mid; else hi = mid; }
  const f = (t - T[lo]) / (T[hi] - T[lo]);
  const r = new Array(k);
  for (let i = 0; i < k; i++) r[i] = a.vals[lo * k + i] * (1 - f) + a.vals[hi * k + i] * f;
  return r;
}

function localAt(n, t) {
  let m = m4.ident();
  for (const x of n.xf) {
    let v = x.v;
    if (x.anim.length) {
      v = v.slice();
      for (const a of x.anim) {
        const s = sampleTrack(a, t);
        if (a.idx) a.idx.forEach((k, i) => { v[k] = s[i]; });
        else for (let i = 0; i < v.length; i++) v[i] = s[i];
      }
    }
    if (x.kind === 'matrix') m = m4.mul(m, v);
    else if (x.kind === 'translate') m = m4.mul(m, m4.translate(v));
    else if (x.kind === 'scale') m = m4.mul(m, m4.scale(v));
    else m = m4.mul(m, m4.rotate([v[0], v[1], v[2]], v[3]));
  }
  return m;
}

function shortName(n) { return n.name.replace(/^.*mixamorig\d*[:_]/, ''); }

function worldFrames(dae, top) {
  const out = [];
  const n = Math.round((dae.t1 - dae.t0) * dae.fps) + 1;
  for (let f = 0; f < n; f++) {
    const t = dae.t0 + f / dae.fps;
    const w = {};
    const visit = (node, parent) => {
      const m = m4.mul(parent, localAt(node, t));
      const key = shortName(node);
      if (!w[key] || node.joint) w[key] = m;
      for (const k of node.kids) visit(k, m);
    };
    for (const r of dae.roots) visit(r, top);
    out.push(w);
  }
  return out;
}

function upFix(up) {
  if (up === 'Z_UP') return m4.from3([1, 0, 0, 0, 0, 1, 0, -1, 0]);
  if (up === 'X_UP') return m4.from3([0, -1, 0, 1, 0, 0, 0, 0, 1]);
  return m4.ident();
}

function anklePoints(rig, pose) {
  return rig.ankles.map(([i, tip]) => v3.add(pose.P[i], m3.apply(pose.W[i], tip)));
}

function restAnkleY(rig) {
  const zero = { rot: rig.bones.map(() => [0, 0, 0]), root: [0, 0, 0] };
  return Math.min(...anklePoints(rig, fk(rig, zero)).map(p => p[1]));
}

function bodyFrame(w) {
  const right = v3.norm([w.RightUpLeg[3] - w.LeftUpLeg[3], 0, w.RightUpLeg[11] - w.LeftUpLeg[11]]);
  return { right, fwd: v3.cross([0, 1, 0], right) };
}

function pickJoint(w, names) {
  for (const n of [].concat(names)) if (w[n]) return n;
  throw new Error('missing joint ' + [].concat(names).join('/'));
}

function eulerYXZ(m) {
  const x = Math.asin(Math.max(-1, Math.min(1, -m[5])));
  if (Math.abs(Math.cos(x)) < 1e-6) return [x, Math.atan2(-m[6], m[0]), 0];
  return [x, Math.atan2(m[2], m[8]), Math.atan2(m[3], m[4])];
}

function nearAngle(a, ref) { return a + 2 * Math.PI * Math.round((ref - a) / (2 * Math.PI)); }

function rotGap(a, b) {
  const R = m3.mul(m3.tr(m3.euler(a[0], a[1], a[2])), m3.euler(b[0], b[1], b[2]));
  return Math.acos(Math.max(-1, Math.min(1, (R[0] + R[4] + R[8] - 1) / 2)));
}

function continuous(e, prev) {
  if (!prev) return e;
  const opts = [e, [Math.PI - e[0], e[1] + Math.PI, e[2] + Math.PI]].map(s => s.map((v, k) => nearAngle(v, prev[k])));
  const d = s => (s[0] - prev[0]) ** 2 + (s[1] - prev[1]) ** 2 + (s[2] - prev[2]) ** 2;
  return d(opts[0]) <= d(opts[1]) ? opts[0] : opts[1];
}

function fk(rig, frame) {
  const W = [], P = [];
  for (const b of rig.bones) {
    const r = frame.rot[b.i];
    const L = m3.euler(r[0], r[1], r[2]);
    if (b.parent < 0) {
      W.push(L);
      P.push(v3.add(b.off, frame.root));
    } else {
      W.push(m3.mul(W[b.parent], L));
      P.push(v3.add(P[b.parent], m3.apply(W[b.parent], b.off)));
    }
  }
  return { W, P };
}

function retarget(game, rig, dae, opts) {
  const cfg = game.bones;
  const FORWARD = game.forward, RIGHT = v3.cross(game.forward, [0, 1, 0]);
  const C = upFix(dae.up);
  const probe = worldFrames(Object.assign({}, dae, { t1: dae.t0 }), C)[0];
  const f0 = bodyFrame(probe);
  const native = dae.up === 'Y_UP' && dae.roots.some(r => r.joint && shortName(r) === 'Hips');
  const facing = Math.atan2(FORWARD[0], FORWARD[2]);
  let yaw = 0, best = -2;
  if (opts.align === 'start') yaw = facing - Math.atan2(f0.fwd[0], f0.fwd[2]);
  else if (native) yaw = facing;
  else for (let k = 0; k < 4; k++) {
    const R = m3.rotY(k * Math.PI / 2);
    const d = v3.dot(m3.apply(R, f0.fwd), FORWARD);
    if (d > best) { best = d; yaw = k * Math.PI / 2; }
  }
  const frames = worldFrames(dae, m4.mul(m4.from3(m3.rotY(yaw)), C));
  const n = frames.length;
  const pos = (f, j) => m4.pos(frames[f][j]);
  const rot = (f, j) => m4.rot(frames[f][j]);
  const body = frames.map(bodyFrame);
  const legLen = side => v3.len(v3.sub(pos(0, side + 'Leg'), pos(0, side + 'UpLeg'))) + v3.len(v3.sub(pos(0, side + 'Foot'), pos(0, side + 'Leg')));
  const k = rig.legLen / ((legLen('Left') + legLen('Right')) / 2);
  const W = rig.bones.map(() => new Array(n));
  const report = [];
  for (const b of rig.bones) {
    const c = cfg[b.name];
    if (!c) {
      if (b.parent < 0) throw new Error('root bone ' + b.name + ' needs a mapping');
      for (let f = 0; f < n; f++) W[b.i][f] = W[b.parent][f];
      continue;
    }
    const to = pickJoint(frames[0], c.to);
    const tw = c.twist || c.from;
    let p0 = c.dir;
    if (!p0) {
      const child = rig.bones.find(q => q.parent === b.i && cfg[q.name] && cfg[q.name].from === to);
      if (!child) throw new Error('bone ' + b.name + ' needs dir');
      p0 = child.off;
    }
    p0 = v3.norm(p0);
    const s0 = c.hint === 'right' ? RIGHT : v3.norm(v3.cross(p0, FORWARD));
    const B0t = m3.tr(m3.cols(s0, p0, v3.cross(s0, p0)));
    const bend = c.hinge ? cfg[rig.bones.find(q => q.parent === b.i && cfg[q.name] && cfg[q.name].from === to).name] : null;
    const prim = [], refs = [];
    for (let f = 0; f < n; f++) {
      prim.push(v3.norm(v3.sub(pos(f, to), pos(f, c.from))));
      let ref = b.parent < 0 ? (c.hint === 'right' ? body[f].right : v3.cross(prim[f], body[f].fwd)) : m3.apply(W[b.parent][f], s0);
      if (bend) {
        const child = v3.norm(v3.sub(pos(f, pickJoint(frames[0], bend.to)), pos(f, bend.from)));
        ref = v3.add(v3.scale(ref, 0.3), v3.scale(v3.cross(prim[f], child), 3 * c.hinge));
      }
      refs.push(ref);
    }
    const scores = AXES.map(a => {
      let sc = 0, nm = 0;
      for (let f = 0; f < n; f++) {
        const u = v3.perp(m3.apply(rot(f, tw), a), prim[f]), r = v3.perp(refs[f], prim[f]);
        sc += v3.dot(u, r);
        nm += v3.len(u) * v3.len(r);
      }
      return [sc, nm];
    });
    let pick = 0;
    for (let i = 1; i < AXES.length; i++) if (scores[i][0] > scores[pick][0]) pick = i;
    if (opts.axes) pick = opts.axes[b.name];
    const axis = AXES[pick];
    report.push([b.name, (scores[pick][0] / (scores[pick][1] || 1)).toFixed(2), AXIS_NAMES[pick], scores.map(s => s[0])]);
    for (let f = 0; f < n; f++) {
      const s = v3.norm(v3.perp(m3.apply(rot(f, tw), axis), prim[f]));
      W[b.i][f] = m3.mul(m3.cols(s, prim[f], v3.cross(s, prim[f])), B0t);
    }
  }
  const pelvis = rig.bones.find(b => b.parent < 0);
  const hipMid = v3.scale(v3.add(rig.bones.find(b => b.name === game.hipJoints[0]).off, rig.bones.find(b => b.name === game.hipJoints[1]).off), 0.5);
  const out = [];
  for (let f = 0; f < n; f++) {
    const rotF = [];
    for (const b of rig.bones) {
      const L = b.parent < 0 ? W[b.i][f] : m3.mul(m3.tr(W[b.parent][f]), W[b.i][f]);
      rotF.push(continuous(eulerYXZ(L), f ? out[f - 1].rot[b.i] : null));
    }
    const mid = v3.scale(v3.scale(v3.add(pos(f, 'LeftUpLeg'), pos(f, 'RightUpLeg')), 0.5), k);
    const pel = v3.sub(mid, m3.apply(W[pelvis.i][f], hipMid));
    out.push({ rot: rotF, root: v3.sub(pel, pelvis.off) });
  }
  const x0 = out[0].root[0], z0 = out[0].root[2];
  for (const o of out) { o.root[0] -= x0; o.root[2] -= z0; }
  const groundFrames = opts.ground === 'min' ? out : [out[0]];
  const lift = restAnkleY(rig) - Math.min(...groundFrames.flatMap(o => anklePoints(rig, fk(rig, o)).map(p => p[1])));
  for (const o of out) o.root[1] += lift;
  let frameCount = n, dist = 0, seam = 0;
  if (opts.loop) {
    const d = v3.sub(out[n - 1].root, out[0].root);
    for (let f = 0; f < n; f++) { out[f].root[0] -= d[0] * f / (n - 1); out[f].root[2] -= d[2] * f / (n - 1); }
    for (let i = 0; i < rig.bones.length; i++) seam = Math.max(seam, rotGap(out[n - 1].rot[i], out[0].rot[i]));
    const dup = seam < 0.03;
    if (dup) { out.pop(); frameCount = n - 1; }
    else {
      const span = Math.min(Math.round(dae.fps * 0.5), n >> 2);
      for (let j = 0; j < span; j++) {
        const o = out[n - span + j], w = (j + 1) / (span + 1), e = w * w * (3 - 2 * w);
        for (let i = 0; i < rig.bones.length; i++) {
          const goal = continuous(out[0].rot[i], o.rot[i]);
          for (let a = 0; a < 3; a++) o.rot[i][a] += (goal[a] - o.rot[i][a]) * e;
        }
        for (let a = 0; a < 3; a++) o.root[a] += (out[0].root[a] - o.root[a]) * e;
      }
    }
    dist = Math.hypot(d[0], d[2]) * (dup ? 1 : n / (n - 1));
  }
  if (opts.gait && dist < 0.1) {
    const vs = [];
    for (let f = 1; f < frameCount - 1; f++) {
      const a = anklePoints(rig, fk(rig, out[f - 1])), b = anklePoints(rig, fk(rig, out[f + 1])), m = anklePoints(rig, fk(rig, out[f]));
      const low = m[0][1] < m[1][1] ? 0 : 1;
      const v = -v3.dot(v3.sub(b[low], a[low]), FORWARD) * dae.fps / 2;
      if (v > 0) vs.push(v);
    }
    vs.sort((a, b) => a - b);
    dist = (vs[vs.length >> 1] || 0) * frameCount / dae.fps;
  }
  if (!opts.root) for (const o of out) { o.root[0] = 0; o.root[2] = 0; }
  const roam = () => Math.max(...out.map(o => Math.hypot(o.root[0], o.root[2])));
  const roamBefore = roam();
  if (opts.stay) {
    const m = out.length, half = Math.round(dae.fps * opts.stay / 2);
    const avg = out.map((o, f) => {
      let x = 0, z = 0, c = 0;
      for (let j = -half; j <= half; j++) {
        const g = opts.loop ? ((f + j) % m + m) % m : Math.max(0, Math.min(m - 1, f + j));
        x += out[g].root[0]; z += out[g].root[2]; c++;
      }
      return [x / c, z / c];
    });
    out.forEach((o, f) => { o.root[0] -= avg[f][0]; o.root[2] -= avg[f][1]; });
  }
  let maxErr = 0, minY = Infinity, maxY = -Infinity;
  const checkTo = out.length - (opts.loop && seam >= 0.03 ? Math.min(Math.round(dae.fps * 0.5), n >> 2) : 0);
  for (let f = 0; f < out.length; f++) {
    const r = fk(rig, out[f]);
    for (const b of rig.bones) {
      const c = cfg[b.name];
      if (!c || f >= checkTo) continue;
      const p0 = v3.norm(c.dir || rig.bones.find(q => q.parent === b.i && cfg[q.name] && cfg[q.name].from === pickJoint(frames[0], c.to)).off);
      const want = v3.norm(v3.sub(pos(f, pickJoint(frames[0], c.to)), pos(f, c.from)));
      maxErr = Math.max(maxErr, Math.acos(Math.max(-1, Math.min(1, v3.dot(m3.apply(r.W[b.i], p0), want)))));
    }
    for (const p of anklePoints(rig, r)) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  }
  return { frames: out, fps: dae.fps, dist, report, maxErr, ankle: [minY, maxY], scale: k, yaw, seam, roam: [roamBefore, roam()] };
}

function encode(clip, nBones) {
  const stride = 3 + nBones * 3;
  const buf = Buffer.alloc(clip.frames.length * stride * 2);
  const vals = clip.frames.flatMap(f => [...f.root, ...f.rot.flat()]);
  const q = Math.min(QUANT, Math.floor(32767 / Math.max(...vals.map(Math.abs))));
  vals.forEach((v, i) => buf.writeInt16LE(Math.round(v * q), i * 2));
  return { q, data: buf.toString('base64url') };
}

function findSource(dir, base) {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  const want = base.toLowerCase();
  for (const ext of ['.dae', '.zip']) {
    const hit = files.find(f => f.toLowerCase() === want + ext);
    if (hit) return path.join(dir, hit);
  }
  return null;
}

function readDae(file) {
  const buf = fs.readFileSync(file);
  const zipped = buf.length > 4 && buf.readUInt32LE(0) === 0x04034b50;
  return zipped ? readZip(buf, /\.dae$/i).toString('utf8') : buf.toString('utf8');
}

function main() {
  const args = process.argv.slice(2);
  const srcAt = args.indexOf('--src');
  const srcDir = srcAt >= 0 ? args.splice(srcAt, 2)[1] : null;
  const [gameId, single] = args;
  const game = GAMES[gameId];
  if (!game) { console.error('usage: node tools/mixamo-import.cjs <' + Object.keys(GAMES).join('|') + '> [--src dir] [file.dae]'); process.exit(1); }
  const rig = game.rig();
  if (single) {
    const r = retarget(game, rig, loadCollada(readDae(single)), { loop: true, gait: true, root: true });
    console.log(JSON.stringify({ frames: r.frames.length, fps: r.fps, dist: +r.dist.toFixed(3), scale: +r.scale.toFixed(4), yaw: r.yaw, maxErrDeg: +(r.maxErr * 180 / Math.PI).toFixed(3), ankle: r.ankle.map(v => +v.toFixed(3)), axes: r.report.map(x => x.slice(0, 3).join(' ')).join(', ') }, null, 1));
    return;
  }
  const dir = srcDir ? path.resolve(srcDir) : path.join(ROOT, game.src);
  const jobs = [];
  for (const [name, c] of Object.entries(game.clips)) {
    const file = findSource(dir, c.file);
    if (!file) { console.log(`skip ${name}: ${c.file}.dae or .zip not found in ${game.src}`); continue; }
    const opts = { loop: !!c.loop, gait: !!c.gait, root: c.root !== false, align: c.align, stay: c.stay, ground: c.ground };
    jobs.push({ name, c, opts, dae: loadCollada(readDae(file)) });
  }
  const votes = {};
  for (const j of jobs) for (const x of retarget(game, rig, j.dae, j.opts).report) {
    votes[x[0]] = votes[x[0]] || AXES.map(() => 0);
    x[3].forEach((s, i) => { votes[x[0]][i] += s; });
  }
  const axes = {};
  for (const [bone, v] of Object.entries(votes)) axes[bone] = v.indexOf(Math.max(...v));
  const lines = [];
  for (const { name, c, opts, dae } of jobs) {
    const r = retarget(game, rig, dae, Object.assign({ axes }, opts));
    if (c.step > 1) { r.frames = r.frames.filter((f, i) => i % c.step === 0); r.fps /= c.step; }
    const weak = r.report.filter(x => +x[1] < 0.5).map(x => x.slice(0, 3).join(' '));
    console.log(`${name}: ${r.frames.length} frames @ ${r.fps} fps, yaw ${Math.round(r.yaw * 180 / Math.PI)}, seam ${r.seam.toFixed(2)}, roam ${r.roam.map(v => v.toFixed(2)).join('>')} m, dist ${r.dist.toFixed(2)} m, fk error ${(r.maxErr * 180 / Math.PI).toFixed(2)} deg, ankle y ${r.ankle.map(v => v.toFixed(3)).join('..')}${weak.length ? ', weak twist: ' + weak.join(', ') : ''}`);
    if (process.env.MIXAMO_AXES) console.log('  ' + r.report.map(x => x[0] + ' ' + x[2] + ' ' + x[1]).join(', '));
    const enc = encode(r, rig.bones.length);
    lines.push(`    ${name}: { fps: ${r.fps}, frames: ${r.frames.length}, loop: ${!!c.loop}, dist: ${+r.dist.toFixed(3)}, hip: ${+rig.hip.toFixed(4)}, q: ${enc.q}, data: '${enc.data}' }`);
  }
  const list = lines.length ? `\n${lines.join(',\n')}\n  ` : '';
  const body = `(function (${game.param}) {\n  'use strict';\n  ${game.param}.MOCAP = {${list}};\n})(globalThis.${game.ns} = globalThis.${game.ns} || {});\n`;
  fs.writeFileSync(path.join(ROOT, game.out), body);
  console.log(`wrote ${game.out} (${lines.length} clips, ${(body.length / 1024).toFixed(1)} KB)`);
}

main();
