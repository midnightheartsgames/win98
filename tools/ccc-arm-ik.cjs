const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
global.window = {};
const load = (rel) => eval(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
load('js/apps/poligon/p3d.js');
load('js/apps/poligon/figure.js');
load('js/apps/poligon/ccc-cast.js');
const { M4 } = window.P3D;
const Cast = window.P3DCccCast;
const { restPose } = window.P3DFigure;

function evalPose(form, side, prm, other) {
  const p = restPose();
  p['sh' + side] = [prm[0], prm[1], prm[2]];
  p['el' + side] = [prm[3], 0, 0];
  if (other) Object.assign(p, other);
  const m = Cast.solve(form, p);
  const d = Cast.solver(form).d;
  return { m, hand: M4.point(m['fore' + side], [0, -d.fore - 0.04, 0.01]), elbow: M4.point(m['fore' + side], [0, 0, 0]) };
}

function solveArm(form, side, handLocal, handSpace, elbowLocal, wElbow, other) {
  const base = evalPose(form, side, [0, 0, 0, 0], other);
  const target = M4.point(base.m[handSpace], handLocal);
  const etarget = elbowLocal ? M4.point(base.m.torso, elbowLocal) : null;
  const cost = (prm) => {
    const r = evalPose(form, side, prm, other);
    let c = (r.hand[0] - target[0]) ** 2 + (r.hand[1] - target[1]) ** 2 + (r.hand[2] - target[2]) ** 2;
    if (etarget) c += wElbow * ((r.elbow[0] - etarget[0]) ** 2 + (r.elbow[1] - etarget[1]) ** 2 + (r.elbow[2] - etarget[2]) ** 2);
    if (prm[3] < 0 || prm[3] > 2.6) c += 1;
    return c;
  };
  let best = null;
  let seed = 7;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let k = 0; k < 400; k++) {
    let x = [rnd() * 3.4 - 1.2, rnd() * 3 - 1.5, rnd() * 2.4 - 0.8, rnd() * 2.5];
    let c = cost(x);
    let step = 0.3;
    for (let it = 0; it < 200 && step > 0.002; it++) {
      let improved = false;
      for (let i = 0; i < 4; i++) for (const dlt of [step, -step]) {
        const y = x.slice(); y[i] += dlt;
        const cy = cost(y);
        if (cy < c) { x = y; c = cy; improved = true; }
      }
      if (!improved) step *= 0.5;
    }
    if (!best || c < best.c) best = { x, c };
  }
  return { prm: best.x.map(v => +v.toFixed(3)), err: Math.sqrt(best.c).toFixed(4) };
}

const jobs = {
  crossR: ['amandaCasual', 'R', [0.11, 0.2, 0.15], 'torso', [-0.16, 0.17, 0.1], 0.5],
  crossL: ['amandaCasual', 'L', [-0.12, 0.17, 0.125], 'torso', [0.17, 0.2, 0.08], 0.5],
  hipR: ['talleahSuit', 'R', [-0.13, 0.03, 0.02], 'torso', [-0.27, 0.16, -0.02], 0.4],
  glassesR: ['makotoSchool', 'R', [-0.045, -0.02, 0.135], 'head', [-0.12, 0.12, 0.13], 0.3],
  saluteR: ['talleahSuit', 'R', [-0.08, 0.05, 0.11], 'head', [-0.27, 0.36, 0.05], 0.4],
  cheekR: ['amandaPink', 'R', [-0.085, -0.06, 0.08], 'head', [-0.13, 0.2, 0.15], 0.3],
  fingerCheekR: ['makotoSchool', 'R', [-0.05, -0.07, 0.11], 'head', [-0.1, 0.16, 0.14], 0.3],
  chestR: ['talleahSuit', 'R', [-0.03, 0.27, 0.12], 'torso', [-0.18, 0.15, 0.08], 0.3],
  phoneR: ['amandaLantern', 'R', [-0.1, -0.02, 0.0], 'head', [-0.16, 0.14, 0.1], 0.3],
  reachR: ['amandaPink', 'R', [-0.05, 0.35, 0.55], 'torso', null, 0],
  wandUpR: ['amandaPink', 'R', [-0.1, 0.95, 0.12], 'torso', null, 0],
  beckonR: ['makotoCat', 'R', [-0.12, 0.33, 0.33], 'torso', [-0.2, 0.14, 0.14], 0.3],
  mouthR: ['amandaLantern', 'R', [-0.01, -0.075, 0.125], 'head', [-0.14, 0.18, 0.16], 0.3],
  thumbR: ['amandaPink', 'R', [-0.1, 0.3, 0.32], 'torso', [-0.2, 0.15, 0.12], 0.3],
  cameraR: ['crowd2', 'R', [-0.05, -0.02, 0.2], 'head', [-0.2, 0.18, 0.18], 0.3],
  cameraL: ['crowd2', 'L', [0.05, -0.02, 0.2], 'head', [0.2, 0.18, 0.18], 0.3],
  clapR: ['crowd2', 'R', [-0.012, 0.3, 0.3], 'torso', [-0.2, 0.18, 0.12], 0.3],
  clapL: ['crowd2', 'L', [0.012, 0.3, 0.3], 'torso', [0.2, 0.18, 0.12], 0.3],
  snapR: ['makotoSchool', 'R', [-0.2, 0.6, 0.15], 'torso', [-0.28, 0.32, 0.1], 0.3],
  handleR: ['talleahSuit', 'R', [-0.06, 0.08, 0.45], 'torso', null, 0],
  patR: ['talleahRanger', 'R', [-0.05, 0.55, 0.5], 'torso', null, 0],
  saluteG: ['gynoid', 'R', [-0.09, 0.05, 0.12], 'head', [-0.3, 0.42, 0.06], 0.4],
  deviceR: ['makotoCat', 'R', [-0.04, 0.2, 0.3], 'torso', [-0.17, 0.12, 0.1], 0.3],
  deviceL: ['makotoCat', 'L', [0.04, 0.2, 0.3], 'torso', [0.17, 0.12, 0.1], 0.3]
};
const only = process.argv.slice(2);
for (const [k, j] of Object.entries(jobs)) {
  if (only.length && !only.includes(k)) continue;
  const r = solveArm(...j);
  const v = r.prm.slice();
  for (let i = 0; i < 3; i++) v[i] = +(((v[i] + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI).toFixed(3);
  console.log(`    ${k}: [${v.join(', ')}],`, 'err', r.err);
}
