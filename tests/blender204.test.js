const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Blender 2.04 core ---');

const eq = (a, b, msg) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), msg);

const FILES = ['b2-assets', 'b2-math', 'b2-gl', 'b2-data', 'b2-ui', 'b2-screen', 'b2-app', 'b2-mesh', 'b2-texture', 'b2-view3d', 'b2-info', 'b2-buts', 'b2-buts-edit', 'b2-buts-display', 'b2-buts-shading', 'b2-buts-anim', 'b2-buts-misc', 'b2-edit', 'b2-transform', 'b2-object', 'b2-toolbox', 'b2-effects', 'b2-subsurf', 'b2-render', 'b2-fileops', 'b2-space-file', 'b2-scene', 'b2-anim', 'b2-space-ipo', 'b2-space-text', 'b2-space-oops', 'b2-space-image', 'b2-space-seq', 'b2-space-sound', 'b2-curve', 'b2-mball', 'b2-lattice', 'b2-paint', 'b2-radio', 'b2-game'];

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const order = FILES.map(f => indexHtml.indexOf('js/apps/blender204/' + f + '.js'));
assert.ok(order.every(i => i > 0), 'index.html must load every Blender 2.04 module');
assert.ok(order.every((v, i) => i === 0 || v > order[i - 1]), 'index.html must load the modules in dependency order');
assert.ok(indexHtml.indexOf('js/apps/blender204-app.js') > order[order.length - 1], 'the window wrapper loads after the modules');

const errors = [];
const fakeEl = () => ({ style: {}, dataset: {}, children: [], className: '', appendChild(c) { this.children.push(c); return c; }, addEventListener() {}, removeEventListener() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 700 }), focus() {}, setPointerCapture() {}, contains: () => false });
const ctx2d = new Proxy({}, { get: (t, k) => (k === 'createImageData' || k === 'getImageData') ? (a, b, w, h) => ({ width: w || a, height: h || b, data: new Uint8ClampedArray((w || a) * (h || b) * 4) }) : () => {} });
const store = new Map();
const sandbox = {
  console: Object.assign({}, console, { error: (...a) => errors.push(a.map(x => (x && x.stack) || String(x)).join(' ')) }),
  document: {
    createElement: tag => { const el = fakeEl(); if (tag === 'canvas') { el.width = 300; el.height = 150; el.getContext = () => ctx2d; el.toDataURL = () => 'data:,'; } return el; },
    addEventListener() {}, removeEventListener() {}, querySelector: () => null
  },
  performance: { now: () => Date.now() },
  setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  addEventListener() {}, removeEventListener() {},
  AbortController, TextDecoder, TextEncoder,
  ResizeObserver: class { observe() {} disconnect() {} },
  ImageData: class { constructor(d, w, h) { this.data = d; this.width = w; this.height = h; } },
  atob: s => Buffer.from(s, 'base64').toString('binary'),
  btoa: s => Buffer.from(s, 'binary').toString('base64'),
  localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
FILES.forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/apps/blender204', f + '.js'), 'utf8'), sandbox, { filename: f + '.js' }));
const B = sandbox.B204;

const sources = FILES.map(f => fs.readFileSync(path.join(__dirname, '../js/apps/blender204', f + '.js'), 'utf8')).join('\n');
assert.ok(!/Blender160|appBlender\b|blender-160/.test(sources), 'Blender 2.04 must not use the 1.60 code');
assert.ok(B.ASSETS && B.ASSETS.splash.startsWith('data:image/jpeg') && B.ASSETS.icons.startsWith('data:image/'), 'splash and icon sheet are embedded');
assert.ok(B.FONT_DATA && B.BFONT, 'bitmap fonts and Bfont are embedded');
console.log('PASS 1. Modules load in order, assets embedded, no 1.60 dependency');

const app = new B.App(fakeEl(), { noSplash: true });
app.draw();
eq([app.raster.w, app.raster.h], [1000, 700]);
eq(app.screen.areas.map(a => a.type).sort(), ['buts', 'info', 'view3d']);
eq(app.scene.bases.map(b => b.object.name).sort(), ['Camera', 'Plane']);
const v3 = app.screen.areas.find(a => a.type === 'view3d');
const cx = (v3.win.x1 + v3.win.x2) >> 1, cy = (v3.win.y1 + v3.win.y2) >> 1;
app.mouse = [cx, cy];
app.dispatch({ type: 'move', x: cx, y: cy, button: 0 });
const key = (k, mods) => app.dispatch(Object.assign({ type: 'key', key: k, char: k.length === 1 ? k.toLowerCase() : '', shift: false, ctrl: false, alt: false, x: cx, y: cy }, mods || {}));
key('TAB');
assert.strictEqual(app.G.obedit && app.G.obedit.name, 'Plane', 'TAB enters edit mode on the active object');
assert.strictEqual(app.G.editMesh.verts.length, 4);
key('TAB');
assert.strictEqual(app.G.obedit, null, 'TAB leaves edit mode');
key('SPACE');
app.draw();
assert.strictEqual(app.overlays.length, 1, 'SPACE opens the toolbox');
key('ESC');
app.draw();
assert.strictEqual(app.overlays.length, 0, 'ESC closes the toolbox');
console.log('PASS 2. Default screen, edit mode and toolbox');

['ipo', 'oops', 'text', 'file', 'image', 'seq', 'sound', 'buts', 'info', 'imasel', 'view3d'].forEach(t => { app.setSpaceType(v3, t); app.draw(); assert.strictEqual(v3.type, t); });
['lamp', 'material', 'texture', 'anim', 'game', 'edit', 'display', 'world', 'radio', 'script', 'view'].forEach(c => { app.setButsContext(c); app.draw(); });
eq(errors, [], 'every window type and button context draws without errors');
console.log('PASS 3. All window types and button contexts draw');

const MO = B.MeshOps;
const cube = MO.prim('cube');
eq([cube.verts.length, cube.faces.length], [8, 6]);
cube.verts.forEach(v => { v.sel = v.co[2] > 0; });
MO.extrude(cube);
eq([cube.verts.length, cube.faces.length], [12, 10], 'extruding the top face adds 4 verts and 4 side faces');
const sub = MO.prim('cube');
MO.subdivide(sub, 'normal');
eq([sub.verts.length, sub.faces.length], [26, 24]);
const ss = B.Subsurf.subdivide(MO.prim('cube'), 2);
eq([ss.verts.length, ss.faces.length], [98, 96], 'Catmull-Clark level 2 of a cube');
const dbl = MO.prim('cube');
dbl.verts.push(...MO.prim('cube').verts.map(v => ({ co: v.co.slice(), sel: true, hide: false })));
assert.strictEqual(MO.removeDoubles(dbl, 0.001), 8);
assert.strictEqual(dbl.verts.length, 8);
const uv = MO.prim('uvsphere', { segments: 16, rings: 16 });
eq([uv.verts.length, uv.faces.length], [242, 256]);
const ico = MO.prim('icosphere', { subdiv: 2 });
eq([ico.verts.length, ico.faces.length], [162, 320]);
console.log('PASS 4. Mesh primitives and editing tools');

const D = B.Data, main = app.main;
const obOf = (type, name, data) => { const ob = D.newObject(main, type, name, D.idUser(data)); D.whereIs(ob); return ob; };
const surf = B.Curve.newCurveData(main, 'Donut', 'surf');
surf.nurbs.push(B.Curve.primSurf('donut'));
assert.ok(B.Curve.dispMesh(obOf('surf', 'Donut', surf), app).faces.length > 500, 'NURBS donut tessellates');
const font = B.Curve.newCurveData(main, 'Text', 'font');
font.str = 'Blender';
font.ext1 = 0.2;
assert.ok(B.Curve.dispMesh(obOf('font', 'Text', font), app).faces.length > 200, 'extruded text fills its letters');
const bez = B.Curve.newCurveData(main, 'Ring', 'curve');
bez.nurbs.push(B.Curve.primCurve('bezcircle'));
bez.ext1 = 0.3;
bez.ext2 = 0.1;
assert.ok(B.Curve.dispMesh(obOf('curve', 'Ring', bez), app).faces.length > 50, 'beveled bezier circle');
const mb = B.ObTypes.mball.newData(main, 'Meta');
mb.elems.push({ type: 'ball', co: [0, 0, 0], rad: 2, s: 2, len: 1, negative: false, sel: false }, { type: 'ball', co: [1.5, 0, 0], rad: 2, s: 2, len: 1, negative: false, sel: false });
const mbOb = obOf('mball', 'Meta', mb);
assert.ok(B.ObTypes.mball.dispMesh(mbOb, app).faces.length > 1000, 'metaballs polygonize');
console.log('PASS 5. Curves, surfaces, text and metaballs');

const ipo = B.Anim.newCurve('LocX');
B.Anim.insertKey(ipo, 1, 0);
B.Anim.insertKey(ipo, 21, 10);
B.Anim.calcHandles(ipo);
assert.strictEqual(B.Anim.evalCurve(ipo, 1), 0);
assert.ok(Math.abs(B.Anim.evalCurve(ipo, 11) - 5) < 1e-3, 'bezier IPO is symmetric between two keys');
assert.strictEqual(B.Anim.evalCurve(ipo, 40), 10, 'constant extend after the last key');
const scope = { a: 3, b: 'x' };
assert.strictEqual(B.GameLogic.evalExpr('a > 2 AND b == "x"', n => scope[n]), true);
assert.strictEqual(B.GameLogic.evalExpr('a < 2 OR NOT (b == "x")', n => scope[n]), false);
console.log('PASS 6. IPO curves and expression controller');

const rsce = D.newScene(main, 'R');
const rcam = D.newObject(main, 'camera', 'RCam', D.idUser(D.newCamera(main, 'RCam')));
rcam.loc = [0, -6, 0];
rcam.rot = [Math.PI / 2, 0, 0];
const rlamp = D.newObject(main, 'lamp', 'RLamp', D.idUser(D.newLamp(main, 'RLamp')));
rlamp.loc = [2, -4, 3];
const rme = D.newMesh(main, 'RCube');
Object.assign(rme, MO.prim('cube'));
const rcube = D.newObject(main, 'mesh', 'RCube', D.idUser(rme));
rsce.bases.push({ object: rcam, sel: false }, { object: rlamp, sel: false }, { object: rcube, sel: false });
rsce.camera = rcam;
rsce.r.xsch = 80;
rsce.r.ysch = 60;
rsce.bases.forEach(b => D.whereIs(b.object));
const res = B.Render.runSync(B.Render.renderJob({ G: { obedit: null, f: {}, editMesh: null }, scene: rsce, main }, rsce, { camera: rcam }));
eq([res.W, res.H], [80, 60]);
const lum = (x, y) => { const o = (y * res.W + x) * 4; return res.img[o] + res.img[o + 1] + res.img[o + 2]; };
assert.ok(lum(40, 30) > 0.3, 'the lit cube covers the image centre');
assert.ok(lum(2, 2) < lum(40, 30), 'the corner shows the darker sky');
console.log('PASS 7. Scanline render of a lit cube');

const text = B.FileOps.serialize(app);
assert.ok(text.startsWith('BLENDER-v204\n'));
assert.ok(text.length < 60000, 'display caches are not written into the .blend file');
const camData = main.cameras[0];
camData.ortho = true;
const back = B.FileOps.deserialize(B.FileOps.serialize(app), 1000, 700);
eq(back.objects.map(o => o.name).sort(), main.objects.map(o => o.name).sort(), 'all objects survive save and load');
assert.strictEqual(back.cameras[0].ortho, true, 'camera Ortho survives save and load');
const backMeta = back.objects.find(o => o.name === 'Meta');
assert.strictEqual(backMeta.data.elems.length, 2);
assert.ok(back.screensUI && back.screensUI.length === 1, 'the screen layout is stored');
camData.ortho = false;
const vsText = B.FileOps.textExport(app, 'videoscape');
assert.ok(vsText.startsWith('3DG1'), 'Videoscape export of the selected mesh');
const vs = B.FileOps.parseVideoscape(vsText);
eq([vs.verts.length, vs.faces.length], [4, 1], 'Videoscape import reads back the plane');
eq(B.FileOps.parseVideoscape('3DG1\n3\n0 0 0\n1 0 0\n0 1 0\n4 0 1 2 9 0xffffff\n3 0 1 2 0xcccccc\n').faces.map(f => f.v), [[0, 1, 2]], 'faces with bad indices are skipped');
assert.strictEqual(B.FileOps.parseVideoscape('hello'), null);
console.log('PASS 8. .blend save and load, Videoscape export and import');

const gsce = app.scene;
const gme = D.newMesh(main, 'Ball');
Object.assign(gme, MO.prim('uvsphere', { segments: 12, rings: 8 }));
const ball = D.newObject(main, 'mesh', 'Ball', D.idUser(gme));
ball.loc = [0, 0, 3];
ball.gameflag.actor = true;
ball.gameflag.dynamic = true;
const sens = B.GameLogic.newSensor(main, 'keyboard');
sens.key = 'UPARROW';
const cont = B.GameLogic.newController(main, 'and');
const act = B.GameLogic.newActuator(main, 'object');
act.force = [0, 2, 0];
sens.links = [cont.id];
cont.links = [act.id];
ball.sensors.push(sens);
ball.controllers.push(cont);
ball.actuators.push(act);
gsce.bases.push({ object: D.idUser(ball), sel: false });
D.whereIs(ball);
const rt = { time: 0, keys: new Set(), mouse: new Set(), sstate: new Map(), active: new Map(), body: new Map(), contacts: new Map(), ipo: new Map(), spawned: [], tris: [] };
B.GameLogic.staticTris(app, rt);
assert.ok(rt.tris.length >= 2, 'the plane is a static collider');
for (let i = 0; i < 150; i++) B.GameLogic.tick(app, rt, 0.02);
assert.ok(Math.abs(ball.loc[2] - 1) < 0.1, 'the ball falls and rests on the plane, z=' + ball.loc[2].toFixed(3));
assert.ok(Math.abs(ball.loc[1]) < 0.05, 'without input the ball stays in place');
rt.keys.add('UPARROW');
for (let i = 0; i < 25; i++) B.GameLogic.tick(app, rt, 0.02);
assert.ok(ball.loc[1] > 0.05, 'the keyboard sensor drives the Object actuator force, y=' + ball.loc[1].toFixed(3));
console.log('PASS 9. Game engine physics and logic bricks');

eq(errors, [], 'no errors were logged');
console.log('\nALL BLENDER 2.04 CORE TESTS PASSED!\n');
