const fs = require('fs');
const vm = require('vm');
const win = { addEventListener() {}, youvidClips: [] };
win.window = win;
const doc = { createElement: () => ({ getContext: () => null, style: {} }), body: {}, addEventListener() {} };
const ctx = vm.createContext(Object.assign(win, { document: doc, navigator: {}, console, Math, Float32Array, Uint8Array, Array, Object, Number, String, JSON, Promise, Set, Map, performance: { now: () => 0 }, requestAnimationFrame() {}, setTimeout, localStorage: { getItem() { return null; }, setItem() {} } }));
['js/apps/poligon/p3d.js', 'js/apps/poligon/figure.js', 'js/apps/youvid/kit.js', 'js/apps/youvid/rig.js', 'js/apps/youvid/roman-cast.js', 'js/apps/youvid/roman-script.js'].forEach(f => {
  try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { console.log('ERR', f, e.message.split('\n')[0]); }
});
const S = win.RomanScript, C = win.RomanCast;
if (!S || !C) { console.log('missing', !!S, !!C); process.exit(); }
process.argv.slice(2).map(Number).forEach(t => {
  const st = S.stage(t);
  const cam = st.camera;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const nrm = a => { const l = Math.hypot(...a); return a.map(x => x / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const f = nrm(sub(cam.at, cam.eye)), r = nrm(cross(f, cam.up)), u = cross(r, f);
  const th = Math.tan(cam.fov * Math.PI / 360);
  const proj = p => { const d = sub(p, cam.eye); const z = d[0] * f[0] + d[1] * f[1] + d[2] * f[2]; const x = (d[0] * r[0] + d[1] * r[1] + d[2] * r[2]) / z / th / (16 / 9); const y = (d[0] * u[0] + d[1] * u[1] + d[2] * u[2]) / z / th; return [(0.5 + x / 2).toFixed(2), (0.5 - y / 2).toFixed(2), z.toFixed(2)]; };
  console.log('t', t);
  st.cast.forEach(c => {
    const m = C.solve(c.who, c.pose);
    ['head', 'chest', 'pelvis', 'wristL', 'wristR', 'shoulderL', 'shoulderR'].forEach(k => console.log(' ', c.who, k, proj(m.pts[k]), m.pts[k].map(x => +x.toFixed(2))));
  });
});
