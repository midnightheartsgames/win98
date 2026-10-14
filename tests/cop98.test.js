const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '../js/apps/cop98');
const FILES = ['cp-core', 'cp-map', 'cp-zaton', 'cp-terrain', 'cp-tex', 'cp-build', 'cp-places', 'cp-render', 'cp-shaders', 'cp-sprites', 'cp-viewmodel', 'cp-portraits', 'cp-icons', 'cp-data', 'cp-world', 'cp-game', 'cp-weather', 'cp-ai', 'cp-story', 'cp-spawner', 'cp-audio'];
const C = require(path.join(DIR, 'cp-core.js'));
for (const f of FILES.slice(1)) require(path.join(DIR, f + '.js'));
const D = C.DATA;
const UI_FILES = ['cp-ui', 'cp-skin', 'cp-screens', 'cp-hud', 'cp-pda'];
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();

const world = new C.World({ seed: 1999 });
const bank = new C.SpriteBank();
const newGame = (o = {}) => { const g = new C.Game(Object.assign({ world, rngSeed: 7, difficulty: 1 }, o)); g.events.length = 0; return g; };
const tick = (g, n, inp = {}) => { for (let i = 0; i < n; i++) { g.tick(typeof inp === 'function' ? inp(i) : inp); g.events.length = 0; } };
const place = (g, x, y, z) => { const p = g.player; p.x = x; p.y = y; p.z = z != null ? z : world.groundAt(x, y, 999, 0).h; p.vx = p.vy = p.vz = 0; p.ground = true; p.zone = world.zoneAt(p.x, p.y, p.z + 0.5); };
const actor = (g, id) => { const a = g.actorById(id); ok(a, 'actor ' + id); return a; };
function talk(g, id, ...choices) {
  const a = actor(g, id);
  let v = g.dialogOpen(a);
  ok(v && v.text, `${id}: dialog opens`);
  for (const ch of choices) {
    const o = v.options.find(x => x.text.includes(ch));
    ok(o, `${id}: option "${ch}" available (have: ${v.options.map(x => x.text).join(' | ')})`);
    v = g.dialogChoose(o.index);
    if (v.end) return v;
  }
  g.dialogClose();
  return v;
}
function use(g, id) {
  const u = g.usables.find(x => x.id === id);
  ok(u, 'usable ' + id);
  place(g, u.x - 1, u.y, u.z - 1);
  g.player.yaw = 0; g.player.pitch = Math.atan2(u.z - g.eyeZ(), 1);
  g.tickN = 4; g.updateFocus();
  ok(g.focus && g.focus.kind === 'use' && g.focus.obj === u, 'focus on ' + id + ' got ' + (g.focus && g.focus.label));
  g.player.useCd = 0; g.interact();
}
function pick(g, itemId) {
  const it = g.items.find(i => i.item.id === itemId);
  ok(it, 'ground item ' + itemId);
  g.items.splice(g.items.indexOf(it), 1); g.addInstance(it.item);
  ok(g.hasItem(itemId), 'picked ' + itemId);
}
const kill = (g, a) => { a.immortal = false; g.damageActor(a, 1e6, 'bullet', 'player', {}); ok(a.dead, 'killed ' + a.name); };

{
  const T = world.terrain;
  ok(world.triCount > 15000, 'structures have geometry');
  ok(world.trees.length > 2500 && world.reeds.length > 500, 'flora placed');
  for (const [k, p] of Object.entries(C.MAP.POI)) ok(p.x > 30 && p.x < 994 && p.y > 30 && p.y < 994, 'poi inside map ' + k);
  const need = ['player_start', 'beard', 'owl', 'nimble', 'cardan', 'sultan', 'zveroboy', 'sleep', 'skat2_log', 'skat2_body', 'skat3_note', 'skat3_body', 'skat5_cabin', 'blackbox', 'tesak', 'tools_rough', 'tools_fine', 'battery', 'transmitter', 'tunnel_end', 'tunnel_mouth', 'chimera_lair', 'chimera_arena', 'lotsman_trap', 'lotsman_home', 'noah', 'lair1', 'lair2', 'lair3', 'shev_zharka', 'tp_farm', 'tp_plateau', 'stoyanka_case', 'tutorial_bus', 'outside_door'];
  for (const n of need) ok(world.markers[n], 'marker ' + n);
  for (const s of D.STASHES) ok(world.markers[s.marker], 'stash marker ' + s.marker);
  ok(world.zones.filter(z => z.shelter).length >= 30, 'enough shelters');
  for (const [k, p] of Object.entries(C.MAP.POI)) if (p.shelter) ok(world.zones.some(z => z.shelter && Math.hypot(z.x - p.x, z.y - p.y) < 70), 'shelter near ' + k);
  const beard = world.markers.beard, bz = world.zoneAt(beard.x, beard.y, beard.z + 0.5);
  ok(bz && bz.safe && bz.base === 'skadovsk', 'bar is safe zone');
  const start = world.markers.player_start, door = world.markers.outside_door;
  ok(T.heightAt(start.x, start.y) > 5, 'start overlooks basin');
  const path1 = world.findPath(start.x, start.y, door.x, door.y, 60000);
  ok(path1 && path1.length > 10, 'path start->skadovsk');
  const last = path1[path1.length - 1];
  ok(Math.hypot(last[0] - door.x, last[1] - door.y) < 3, 'path reaches skadovsk');
  for (const k of ['sawmill', 'station', 'substation', 'krug', 'farmstead', 'izumrud', 'fuel', 'beton', 'forestry', 'skat2', 'cranes', 'ironforest', 'gallery', 'claw', 'circus', 'oakpine', 'stoyanka', 'swamp', 'kotel']) {
    const q = world.findPath(door.x, door.y, C.MAP.POI[k].x, C.MAP.POI[k].y, 400000);
    const e = q && q[q.length - 1];
    ok(e && Math.hypot(e[0] - C.MAP.POI[k].x, e[1] - C.MAP.POI[k].y) < 25, 'reachable on foot: ' + k);
  }
  {
    const s3 = C.MAP.POI.skat3, q = world.findPath(door.x, door.y, s3.x, s3.y, 400000), e = q && q[q.length - 1];
    ok(!e || Math.hypot(e[0] - s3.x, e[1] - s3.y) > 20, 'southern plateau has no way up on foot');
    const tp = world.markers.tp_plateau, q2 = world.findPath(tp.x + Math.cos(tp.yaw) * 4, tp.y + Math.sin(tp.yaw) * 4, s3.x, s3.y, 400000), e2 = q2 && q2[q2.length - 1];
    ok(e2 && Math.hypot(e2[0] - s3.x, e2[1] - s3.y) < 12, 'skat3 reachable from the plateau teleport');
    ok(T.heightAt(s3.x, s3.y) > T.heightAt(s3.x - 40, s3.y + 80) + 6, 'plateau rises above the plain');
  }
  {
    const B = C.MAP.BRIDGE, dz = y => world.groundAt(B.x + 2.5, y, B.z + 1).h;
    ok(Math.abs(dz(300) - B.z) < 0.2 && Math.abs(dz(400) - B.z) < 0.2, 'bridge deck walkable');
    ok(world.groundAt(B.x - 3, (B.gap[0] + B.gap[1]) / 2, B.z + 1).h < B.z - 3, 'bridge west half collapsed');
    ok(Math.abs(world.groundAt(B.x + 1.5, (B.gap[0] + B.gap[1]) / 2, B.z + 1).h - B.z) < 0.2, 'bridge east half still passable');
    ok(T.heightAt(B.x, 360) < 0, 'river under the bridge');
  }
  {
    let water = 0, deep = 0;
    for (let y = 0; y < 1024; y += 4) for (let x = 0; x < 1024; x += 4) { const h = T.heightAt(x, y); if (h < 0) water++; if (h < -1.3) deep++; }
    ok(water > 2500 && water < 9000, 'riverbed and lakes cover a share of the map: ' + water);
    ok(deep > 150 && deep < water * 0.5, 'deep water only in lakes and the river: ' + deep);
    ok(T.heightAt(C.MAP.POI.dredge.x, C.MAP.POI.dredge.y + 30) < -1.3, 'dredge stands in a deep lake');
    ok(T.heightAt(855, 908) > 0.5 && T.heightAt(844, 890) < 0 && T.heightAt(844, 890) > -0.3, 'kotel island cut by ankle-deep water cracks');
  }
  const hit = world.raycast(C.MAP.POI.skadovsk.x, C.MAP.POI.skadovsk.y - 30, 3, 0, 1, 0, 60);
  ok(hit && hit.kind === 'struct', 'ray hits skadovsk hull');
  const g0 = world.groundAt(world.markers.beard.x, world.markers.beard.y, world.markers.beard.z + 0.2).h;
  ok(Math.abs(g0 - world.markers.beard.z) < 0.2, 'bar floor walkable');
  const deck = world.groundAt(C.MAP.POI.skadovsk.x + 10, C.MAP.POI.skadovsk.y + 2, 8).h;
  ok(Math.abs(deck - (0.7 + 6.5)) < 0.3, 'deck walkable');
}

{
  for (const look of Object.keys(C.LOOKS)) for (const w of ['rifle', 'pistol', 'none', 'shotgun', 'sniper']) for (const anim of ['idle', 'walk', 'aim', 'die', 'sit', 'talk']) {
    const img = bank.actor('human', look, w, anim, 1, 3);
    ok(img.data.some(v => v >>> 24 > 100), `sprite ${look}/${w}/${anim}`);
  }
  for (const k of ['dog', 'flesh', 'boar', 'bloodsucker', 'chimera']) for (const anim of ['idle', 'walk', 'run', 'attack', 'die']) ok(bank.actor(k, '', '', anim, 1, 2).data.some(v => v >>> 24 > 100), `mutant ${k}/${anim}`);
  for (const id of Object.keys(D.ITEMS)) {
    ok(C.Icons.has(id), 'icon rig for ' + id);
    const [fw, fh] = C.Icons.footprint(id);
    ok(fw >= 1 && fw <= 7 && fh >= 1 && fh <= 3, 'icon footprint fits the 7-column backpack: ' + id);
    const img = C.Icons.render(id, 24);
    ok(img.w === fw * 24 && img.h === fh * 24 && img.data.filter(v => (v >>> 24) > 200).length > 30, 'icon renders: ' + id);
    const gs = bank.ground(id);
    ok(gs && gs.ppm > 0 && gs.data.filter(v => (v >>> 24) > 200).length > 12, 'ground sprite from the icon rig: ' + id);
  }
  {
    const inv = Object.keys(D.ITEMS).map(id => C.makeItem(id, 1));
    const { cells, rows } = C.Icons.pack(inv, 7), occ = new Set();
    ok(cells.length === inv.length && rows > 0, 'backpack packs every item');
    let clash = 0;
    for (const c of cells) for (let y = c.y; y < c.y + c.h; y++) for (let x = c.x; x < c.x + c.w; x++) { if (x >= 7 || occ.has(x + ',' + y)) clash++; occ.add(x + ',' + y); }
    ok(clash === 0, 'backpack cells do not overlap or leave the grid');
  }
  for (const look of Object.keys(C.LOOKS)) ok(C.Portraits.build(look).scene.bodies.length >= 6, 'portrait scene for ' + look);
  for (const look of ['degtyarev', 'beard', 'tesak', 'nimble']) {
    const img = C.Portraits.render(look, 24, 21), cols = new Set(img.data);
    ok(img.w === 24 && cols.size > 40, 'portrait renders: ' + look);
  }
  const mutantKinds = [...new Set(Object.values(D.NPC_TYPES).filter(T => T.kind !== 'human').map(T => T.kind))];
  ok(mutantKinds.every(k => C.Portraits.has(k) && C.Portraits.MUTANTS.includes(k)), 'every mutant kind has a portrait');
  for (const k of C.Portraits.MUTANTS) {
    ok(C.Portraits.build(k).scene.bodies.length >= 4, 'mutant portrait scene for ' + k);
    const img = C.Portraits.render(k, 24, 21), cols = new Set(img.data);
    ok(img.w === 24 && cols.size > 30, 'mutant portrait renders: ' + k);
    const hi = bank.actor(k, '', '', 'idle', 0, 1, true), lo = bank.actor(k, '', '', 'idle', 0, 1);
    ok(hi.w === lo.w * 2 && hi.data.filter(v => v >>> 24 > 100).length > lo.data.filter(v => v >>> 24 > 100).length * 3, 'mutant close-up sprite: ' + k);
  }
  {
    const job = C.Portraits.job('owl', 16, 14);
    let img = null, n = 0;
    while (!(img = job.step(0.2)) && n < 100000) n++;
    ok(img && img.w === 16 && n > 2, 'portrait job renders in slices');
    const lo = bank.actor('human', 'beard', 'none', 'idle', 0, 0), hi = bank.actor('human', 'beard', 'none', 'idle', 0, 0, true);
    ok(hi.w === lo.w * 2 && hi.ppm === lo.ppm * 2, 'close-up sprite doubles resolution');
    ok(bank.actor('human', 'tesak', 'rifle', 'walk', 1, 3, true).data.some(v => v >>> 24 > 100), 'close-up sprite draws');
  }
  {
    const VR = new C.Renderer(240, 150);
    for (const k of Object.keys(C.GUN_MODELS)) for (const one of [false, true]) {
      const det = k.startsWith('detector');
      const vm = det ? C.ViewModels.buildDetector(k, 0x5c6444) : C.ViewModels.buildWeapon(k, 0x5c6444, one);
      VR.fb.fill(0); VR.beginViewLayer();
      if (det) VR.drawViewMesh(vm.mesh, C.ViewModels.detectorPose({}), [1, 1, 1]);
      else {
        const pose = C.ViewModels.weaponPose(vm, { reload: 0.5, recoil: 0.05 });
        for (const [piece, m] of [['gun', pose.gun], ['mag', pose.mag], ['rhand', pose.gun], ['lhand', pose.lhand]]) VR.drawViewMesh(vm.pieces[piece], m, [1, 1, 1]);
        VR.drawViewMesh(pose.arms, C.ViewModels.IDENTITY, [1, 1, 1]);
        ok(pose.arms.count > 50, 'viewmodel arms ' + k);
        ok(pose.tip.every(Number.isFinite), 'viewmodel tip ' + k);
        ok(vm.pieces.rhand.count > 100 && (one || vm.kind === 'knife' || vm.kind === 'throw' ? true : vm.pieces.lhand.count > 100), 'viewmodel hands ' + k);
        if (one && vm.kind === 'pistol') ok(vm.pieces.lhand.count === 0, 'one-handed pistol with detector ' + k);
      }
      ok(VR.fb.filter(c => c !== 0).length > 400, 'viewmodel 3d draws ' + k);
    }
  }
  for (const w of Object.values(D.WEAPONS)) ok(C.GUN_MODELS[w.model], 'gun model ' + w.model);
  for (const d of Object.values(D.DETECTORS)) ok(C.GUN_MODELS[d.model], 'detector model ' + d.model);
  for (const id of ['aksu', 'ak', 'trs', 'svd', 'vintorez', 'toz', 'chaser', 'pm', 'fort', 'pb']) {
    const spec = C.GUN_MODELS[id], vm = C.ViewModels.buildWeapon(id, 0x5c6444, false), grip = spec.find(q => q[5] && q[5].role === 'grip');
    ok(C.Icons.RIGS[id]() === spec, 'icon and first-person model share geometry: ' + id);
    ok(grip && Math.hypot(vm.pivot[0] - grip[2][0], vm.pivot[2] - grip[2][2]) < 0.04, 'right hand holds the grip: ' + id);
    if (spec.some(q => q[5] && q[5].role === 'mag')) ok(vm.pieces.mag.count > 0 && vm.magAt[2] < -0.04, 'magazine is a separate piece for reloads: ' + id);
  }
  const R = new C.Renderer(320, 200); R.textures = world.textures;
  const g = newGame();
  const env = g.computeEnv();
  const cam = { x: 486, y: 440, z: 3, yaw: 1.2, pitch: 0, fov: 1.3 };
  R.setupCamera(cam); R.setupEnv(env); R.clear(); R.renderTerrain(world.terrain); R.renderMeshes(world.bins, C.RENDER_CELL, C.RGN); R.renderSky();
  const sp = []; world.collectFlora(R, cam, bank, sp); for (const s of sp) R.drawSprite(s);
  R.postProcess({ flashlight: { range: 20, power: 1 } });
  ok(R.stats.tris > 200, 'renderer draws skadovsk');
  ok(R.fb.every(v => (v >>> 24) === 255), 'framebuffer opaque');
  for (const pitch of [-1.35, -0.7, 0.9]) {
    R.setupCamera(Object.assign({}, cam, { pitch })); R.setupEnv(env); R.clear(); R.renderTerrain(world.terrain);
    let holes = 0;
    for (let y = 1; y < R.H - 1; y++) for (let x = 1; x < R.W - 1; x++) {
      const i = y * R.W + x;
      if (R.zb[i] >= C.FAR_Z && R.zb[i - 1] < C.FAR_Z && R.zb[i + 1] < C.FAR_Z && R.zb[i - R.W] < C.FAR_Z && R.zb[i + R.W] < C.FAR_Z) holes++;
    }
    ok(holes === 0, 'pitched terrain has no holes at pitch ' + pitch);
  }
  R.setupCamera(Object.assign({}, cam, { pitch: 1 }));
  const wallX = cam.x + Math.cos(cam.yaw) * 4 + Math.sin(cam.yaw) * 2, wallY = cam.y + Math.sin(cam.yaw) * 4 - Math.cos(cam.yaw) * 2;
  const wallFoot = R.project(wallX, wallY, cam.z - 1), wallTop = R.project(wallX, wallY, cam.z + 3);
  ok(wallFoot && wallTop && Math.abs(wallTop.sx - R.W / 2) < Math.abs(wallFoot.sx - R.W / 2) * 0.5, 'vertical edges converge when looking up');
  const lib = C.buildSoundLibrary();
  const src = FILES.concat(UI_FILES).map(f => fs.readFileSync(path.join(DIR, f + '.js'), 'utf8')).join('\n');
  const names = new Set();
  for (const m of src.matchAll(/sound2?d?\('(\w+)'/g)) names.add(m[1]);
  for (const m of src.matchAll(/A\.play\('(\w+)'/g)) names.add(m[1]);
  for (const m of src.matchAll(/'((?:anom|shot|reload|step)_\w*[a-z])'/g)) names.add(m[1]);
  for (const s of Object.values(D.ANOMALY_TYPES)) names.add('anom_' + s.sound);
  for (const w of Object.values(D.WEAPONS)) if (w.sound) names.add('shot_' + w.sound);
  for (const k of ['dog', 'flesh', 'boar', 'bloodsucker', 'chimera']) for (const s of ['idle', 'attack', 'hurt', 'die']) names.add(k + '_' + s);
  for (const n of names) if (!n.endsWith('_')) ok(lib[n], 'sound exists: ' + n);
}

{
  const g = newGame();
  const p = g.player;
  ok(g.quests.main === 'active', 'main quest active');
  ok(p.hp === 100 && g.slotItem('rifle').id === 'aksu', 'start loadout');
  const fr = g.anomalies.find(a => a.field === 'tutorial');
  ok(fr && fr.type === 'zharka', 'tutorial zharka');
  place(g, fr.x - 6, fr.y); p.yaw = 0; p.pitch = -0.05;
  tick(g, 2, { bolt: true }); tick(g, 60);
  ok(fr.state !== 'idle' || fr.cool > 0 || g.anomalies.some(a => a === fr), 'bolt thrown near zharka');
  fr.state = 'idle';
  place(g, fr.x, fr.y); const hp0 = p.hp; tick(g, 40);
  ok(p.hp < hp0, 'zharka burns player');
  p.hp = 100; p.bleed = 0;
  const art = g.artifacts.find(a => a.field === 'tutorial');
  ok(art && !art.visible, 'tutorial artifact hidden');
  place(g, art.x + 1, art.y); p.detectorOut = true; tick(g, 5);
  ok(art.visible, 'detector reveals artifact');
  {
    p.detectorOut = false; p.active = 'rifle'; p.switchT = 0;
    tick(g, 1, { detector: true }); tick(g, 30);
    ok(p.detectorOut && p.active === 'none' && !g.activeWeapon(), 'detector holsters two-handed rifle');
    tick(g, 1, { slot: 'pistol' }); tick(g, 30);
    ok(p.detectorOut && p.active === 'pistol', 'detector stays with pistol');
    tick(g, 1, { slot: 'knife' }); tick(g, 30);
    ok(p.detectorOut && p.active === 'knife', 'detector stays with knife');
    tick(g, 1, { bolt: true }); tick(g, 30);
    ok(p.detectorOut, 'detector stays while throwing bolt');
    tick(g, 1, { slot: 'rifle' }); tick(g, 30);
    ok(!p.detectorOut && p.active === 'rifle', 'rifle hides detector');
    tick(g, 1, { detector: true }); tick(g, 30); tick(g, 1, { detector: true }); tick(g, 30);
    ok(!p.detectorOut && p.active === 'rifle', 'rifle returns when detector put away');
    tick(g, 1, { holster: true }); tick(g, 30);
    ok(p.active === 'none' && !g.activeWeapon(), 'H holsters weapon');
    const magBefore = g.slotItem('rifle').mag;
    tick(g, 20, { fire: true }); tick(g, 30);
    ok(g.slotItem('rifle').mag === magBefore, 'no fire while holstered');
    tick(g, 1, { holster: true }); tick(g, 30);
    ok(p.active === 'rifle', 'H draws last weapon');
    tick(g, 1, { slot: 'rifle' }); tick(g, 30);
    ok(p.active === 'none', 'pressing active slot again holsters');
    tick(g, 1, { slot: 'pistol' }); tick(g, 30);
    ok(p.active === 'pistol', 'slot key draws weapon from holster');
    tick(g, 1, { slot: 'rifle' }); tick(g, 30);
    p.detectorOut = true;
  }
  g.pickArtifact(art); ok(g.hasItem('firefly'), 'artifact taken');
  ok(g.equip(g.player.inv.find(i => i.id === 'firefly')), 'artifact on belt');
  ok(g.beltArtifacts().length === 1, 'belt holds artifact');
  place(g, world.markers.outside_door.x, world.markers.outside_door.y); tick(g, 20);
  const beardZone = world.markers.beard; place(g, beardZone.x - 2, beardZone.y, beardZone.z); tick(g, 20);
  ok(g.flag('arrived'), 'arrived at skadovsk');
  ok(g.inSafeZone(), 'safe zone detected');
  const mag = g.slotItem('rifle').mag; tick(g, 30, { fire: true }); ok(g.slotItem('rifle').mag === mag, 'cannot fire in safe zone');
  talk(g, 'beard', 'вертолётах', 'Спасибо');
  ok(g.flag('met_beard'), 'met beard');
  talk(g, 'owl', 'Борода сказал', 'Медузу');
  ok(g.quests.medusa === 'active', 'medusa quest');
  g.addItem('medusa');
  talk(g, 'owl', 'Вот твоя', 'Слушаю', 'Спасибо, Сыч');
  ok(g.flag('owl_info') && g.quests.skat2 === 'active' && g.quests.skat3 === 'active', 'owl gave crash sites');
  ok(g.rep === 1, 'rep after medusa');
  const obj = g.activeObjectives().map(o => o.text).join('|');
  ok(obj.includes('Скат-2') && obj.includes('Скат-3'), 'objectives for both crashes');
  ok(g.activeObjectives().some(o => o.at === world.markers.tp_farm), 'skat3 objective leads to the farmstead teleport first');
  {
    const tf = world.markers.tp_farm;
    place(g, tf.x + 3, tf.y, tf.z); p.yaw = Math.PI;
    for (let i = 0; i < 120 && !g.flag('plateau_reached'); i++) { p.yaw = Math.atan2(tf.y - p.y, tf.x - p.x); g.tick({ fwd: true }); g.events.length = 0; }
    ok(g.flag('plateau_reached') && p.z > 13 && Math.hypot(p.x - C.MAP.POI.skat3.x, p.y - C.MAP.POI.skat3.y) < 70, 'farmstead teleport throws the player onto the plateau ' + [p.x.toFixed(1), p.y.toFixed(1), p.z.toFixed(1)]);
    ok(g.activeObjectives().some(o => o.at === C.MAP.POI.skat3), 'objective switches to the skat3 crash');
    const tq = world.markers.tp_plateau;
    g.realTime += 5; tick(g, 1);
    for (let i = 0; i < 160 && Math.hypot(p.x - tf.x, p.y - tf.y) > 8; i++) { p.yaw = Math.atan2(tq.y - p.y, tq.x - p.x); g.tick({ fwd: true }); g.events.length = 0; }
    ok(Math.hypot(p.x - tf.x, p.y - tf.y) < 8 && p.z < 16, 'plateau teleport brings the player back');
  }
  use(g, 'skat2_log');
  ok(g.flag('skat2_done') && g.hasItem('skat2_log'), 'skat2 inspected');
  ok(g.emission.next - g.realTime < 60, 'first emission scheduled soon');
  use(g, 'skat3_note');
  ok(g.flag('skat3_note'), 'skat3 note read');
  const looter = g.actors.find(a => a.looterCorpse);
  ok(looter && looter.dead && looter.inv.some(i => i.id === 'looter_pda'), 'looter corpse with pda');
  const pda = looter.inv.find(i => i.id === 'looter_pda'); looter.inv.splice(looter.inv.indexOf(pda), 1); g.addInstance(pda);
  ok(g.flag('knows_tesak') && g.flag('skat3_done'), 'looter pda points to tesak');
  const em = g.emission;
  g.startEmission(); ok(em.phase === 'warning', 'emission warning');
  const skz = world.markers.bar1; place(g, skz.x, skz.y + 1, skz.z);
  tick(g, 60 * 120);
  ok(!g.dead && em.phase !== 'warning', 'survived emission in skadovsk');
  tick(g, 60 * 30);
  ok(em.phase === 'none' && em.count === 1, 'emission ended');
  p.money = 20000;
  const tz = actor(g, 'tesak'); place(g, tz.x + 1.5, tz.y, tz.z);
  talk(g, 'tesak', 'самописец', 'Плачу', 'забыл');
  ok(g.hasItem('blackbox') && g.flag('box_bought'), 'bought blackbox');
  place(g, world.markers.cardan.x + 1, world.markers.cardan.y, world.markers.cardan.z);
  if (!g.hasItem('vodka')) g.addItem('vodka');
  talk(g, 'cardan', 'самописец', 'бутылку', 'Экипаж жив');
  ok(g.flag('box_decoded'), 'blackbox decoded');
  talk(g, 'beard', 'Юпитер');
  ok(!g.flag('route_known'), 'beard refuses with low rep');
  talk(g, 'beard', 'работа', 'кровосос');
  ok(g.quests.bloodsuckers === 'active', 'bloodsucker quest');
  for (const a of g.actors.filter(a => a.lairBloodsucker)) kill(g, a);
  ok(g.flag('lair_cleared'), 'lair cleared');
  const m0 = p.money;
  talk(g, 'beard', 'Логово', 'Рад');
  ok(g.quests.bloodsuckers === 'done' && p.money === m0 + 5000 && g.rep === 3, 'bloodsucker reward');
  talk(g, 'beard', 'Юпитер', 'Спасибо');
  ok(g.flag('route_known'), 'route known');
  pick(g, 'accum');
  use(g, 'transmitter');
  ok(g.flag('transmitted') && g.emission.phase === 'warning', 'transmitted, final emission');
  const ch = g.actors.find(a => a.finalChimera);
  ok(ch && !ch.dead, 'final chimera spawned');
  ok(g.activeObjectives().some(o => o.text.includes('тоннел')), 'objective to tunnel');
  const te = world.markers.tunnel_end; place(g, te.x, te.y, te.z); tick(g, 20);
  ok(g.won, 'game won ' + JSON.stringify({ dead: g.dead, cause: g.deathCause, p: [g.player.x, g.player.y, g.player.z], te }));
  const slides = g.epilogue();
  ok(slides.length >= 4 && slides.some(s => s.text.includes('Восемь тысяч')), 'epilogue reflects bought box');
}

{
  const g = newGame();
  Object.assign(g.flags, { arrived: true, met_beard: true, owl_info: true, skat2_done: true, knows_tesak: true, skat3_done: true });
  place(g, world.markers.sultan.x + 1, world.markers.sultan.y, world.markers.sultan.z);
  talk(g, 'sultan', 'самописец', 'По рукам');
  ok(g.quests.sultan_case === 'active' && g.items.some(i => i.item.id === 'nimble_case'), 'case spawned');
  pick(g, 'nimble_case');
  talk(g, 'sultan', 'кейс', 'Забираю');
  ok(g.hasItem('blackbox') && g.flag('nimble_betrayed'), 'sultan deal gives box');
  const v = g.dialogOpen(actor(g, 'nimble'));
  ok(v.text.includes('Султану'), 'nimble reacts to betrayal');
  g.dialogClose();
  ok(g.epilogue().some(s => s.title === 'Шустрый'), 'epilogue: nimble betrayed');
}

{
  const g = newGame();
  Object.assign(g.flags, { arrived: true, met_beard: true, owl_info: true, knows_tesak: true, skat3_done: true });
  g.startQuest('sultan_case'); g.spawnNimbleCase(); pick(g, 'nimble_case');
  talk(g, 'nimble', 'кейс', 'Спасибо');
  ok(g.flag('nimble_helped') && g.flag('box_location_known') && g.hasItem('pb'), 'nimble helped, gives pb and location');
  ok(g.quests.sultan_case === 'failed', 'sultan quest failed');
  ok(g.playerRel.bandit <= -50, 'bandits hostile');
  g.time = 2 * 60;
  for (const a of g.actors) if (a.stationGuard) { a.x += 200; a.online = false; }
  use(g, 'crate_box');
  ok(g.hasItem('blackbox') && g.flag('box_stolen'), 'stolen unseen');
  ok(g.playerRel.merc > -50, 'mercs not alerted');
}

{
  const g = newGame();
  Object.assign(g.flags, { arrived: true, met_beard: true, owl_info: true, knows_tesak: true, skat3_done: true });
  for (const a of g.actors) if (a.stationGuard) { a.x += 200; a.online = false; }
  const t = actor(g, 'tesak'); t.x -= 200; t.online = true; t.x += 200;
  const mk = world.markers.blackbox;
  const guard = g.actors.find(a => a.stationGuard && a.id !== 'tesak');
  guard.x = mk.x + 3; guard.y = mk.y; guard.z = mk.z - 0.8; guard.online = true; guard.dead = false;
  use(g, 'crate_box');
  ok(g.hasItem('blackbox') && g.playerRel.merc <= -50, 'seen stealing: mercs hostile');
  ok(guard.angry && g.hostileToPlayer(guard), 'guard attacks');
}

{
  const g = newGame();
  Object.assign(g.flags, { arrived: true, met_beard: true, owl_info: true, knows_tesak: true, skat3_done: true });
  const tz = actor(g, 'tesak'); place(g, tz.x + 1.5, tz.y, tz.z);
  talk(g, 'tesak', 'самописец', 'Земснаряд');
  ok(g.quests.dredge_job === 'active', 'dredge job');
  for (const a of g.actors.filter(a => a.dredgeZombie)) kill(g, a);
  ok(g.flag('dredge_clear'), 'dredge clear');
  talk(g, 'tesak', 'чист', 'Бывай');
  ok(g.hasItem('blackbox') && g.flag('box_job') && g.quests.dredge_job === 'done', 'box for job');
}

{
  const g = newGame();
  Object.assign(g.flags, { arrived: true, met_beard: true });
  talk(g, 'cardan', 'инструменты', 'оба');
  ok(g.quests.tools_rough === 'active' && g.quests.tools_fine === 'active', 'tools quests');
  pick(g, 'tools_rough'); talk(g, 'cardan', 'грубой', 'Пользуйся');
  ok(g.upgradeTier === 2, 'tier 2');
  pick(g, 'tools_fine'); talk(g, 'cardan', 'тонкой', 'рад');
  ok(g.upgradeTier === 3 && g.quests.tools_fine === 'done', 'tier 3');
  g.player.money = 50000;
  const rifle = g.slotItem('rifle');
  for (const up of D.UPGRADES.weapon) ok(g.upgrade(rifle, up), 'upgrade ' + up.id);
  const s = g.weaponStats(rifle);
  ok(s.mag === 45 && s.dmg > D.WEAPONS.aksu.dmg, 'upgrades apply');
  const out = g.outfit();
  for (const up of D.UPGRADES.outfit) ok(g.upgrade(out, up), 'outfit upgrade ' + up.id);
  ok(g.beltSlots() === 4 && g.maxWeight() === 60, 'outfit upgrades apply');
  rifle.cond = 0.4; ok(g.repairCost(rifle) > 0 && g.repair(rifle) && rifle.cond === 1, 'repair');
}

{
  const g = newGame();
  g.player.money = 100000;
  const stock = g.traderStock.beard;
  const med = stock.find(i => i.id === 'medkit');
  const n0 = g.countItem('medkit');
  ok(g.buy('beard', med, 1) && g.countItem('medkit') === n0 + 1, 'buy medkit');
  const ammo = stock.find(i => i.id === 'ammo_5.45');
  const a0 = g.countItem('ammo_5.45');
  ok(g.buy('beard', ammo, 30) && g.countItem('ammo_5.45') === a0 + 30, 'buy ammo box');
  g.addItem('nightstar');
  const m0 = g.player.money;
  ok(g.sell('beard', g.player.inv.find(i => i.id === 'nightstar')) && g.player.money > m0 + 5000, 'sell artifact');
  ok(!g.traderBuys('noah', g.player.inv.find(i => i.id === 'aksu')), 'noah does not buy weapons');
  const it = g.player.inv.find(i => i.id === 'bread');
  g.dropItem(it); ok(g.items.some(i => i.item.id === 'bread'), 'drop item');
  {
    const d = newGame(), st = d.traderStock.beard, p = d.player;
    const ammo = st.find(i => i.id === 'ammo_5.45'), med = st.find(i => i.id === 'medkit');
    const art = d.addItem('nightstar'), bread = d.addItem('bread', 3), gun = d.addItem('svd', 1, { cond: 1 });
    const a0 = ammo.count, m0 = med.count, b0 = bread.count, money0 = p.money = 500;
    const mine = [[art, 1], [bread, 1], [gun, 1]], theirs = [[ammo, 60], [med, 2]];
    const v = d.dealValue('beard', mine, theirs);
    ok(v.ok && v.sell > 0 && v.buy > 0 && v.balance === v.sell - v.buy, 'deal value sums both sides');
    ok(v.buy === d.price(C.makeItem('ammo_5.45', 60), 'buy', 'beard') + d.price(C.makeItem('medkit', 2), 'buy', 'beard'), 'deal prices partial stacks');
    ok(!d.dealValue('noah', [[gun, 1]], []).ok && d.dealValue('noah', [[gun, 1]], []).refused, 'deal refuses what the trader does not buy');
    ok(!d.dealValue('beard', [], theirs).ok && !d.executeDeal('beard', [], theirs) && ammo.count === a0 && p.money === money0, 'deal needs enough money');
    ok(d.executeDeal('beard', mine, theirs) && p.money === money0 + v.balance, 'deal settles the balance');
    ok(ammo.count === a0 - 60 && med.count === m0 - 2 && d.countItem('ammo_5.45') >= 60, 'deal moves the trader goods');
    ok(!p.inv.includes(art) && !p.inv.includes(gun) && bread.count === b0 - 1 && st.includes(art) && st.includes(gun), 'deal moves the player goods');
  }
  {
    const d = newGame(), p = d.player, box = Object.values(d.stashes)[0].items;
    const gun = d.addItem('svd', 1, { cond: 1 }), bread = d.addItem('bread', 2);
    d.equip(gun);
    ok(d.storeItem(box, gun) && box.includes(gun) && !p.inv.includes(gun) && d.slotItem('rifle') !== gun, 'store equipped item into a stash');
    const n = box.filter(i => i.id === 'bread').reduce((t, i) => t + i.count, 0) + bread.count;
    ok(d.storeItem(box, bread) && box.filter(i => i.id === 'bread').reduce((t, i) => t + i.count, 0) === n && box.filter(i => i.id === 'bread').length === 1, 'stash merges stacks');
    const q = d.addItem(Object.keys(D.ITEMS).find(id => D.ITEMS[id].type === 'quest'));
    ok(!d.storeItem(box, q) && p.inv.includes(q), 'quest items stay with the player');
    ok(d.takeItem(box, gun) && p.inv.includes(gun) && !box.includes(gun) && !d.takeItem(box, gun), 'take item back from a stash');
  }
  const h0 = g.player.hp = 50;
  g.useConsumable('medkit'); tick(g, 200);
  ok(g.player.hp > h0 + 30, 'medkit heals over time');
  g.player.rad = 300; g.useConsumable('antirad'); tick(g, 300);
  ok(g.player.rad < 120, 'antirad works');
  g.player.bleed = 2; g.useConsumable('bandage'); ok(g.player.bleed < 0.5, 'bandage stops bleeding');
}

{
  const g = newGame();
  Object.assign(g.flags, { arrived: true, met_beard: true, owl_info: true });
  talk(g, 'noah', 'Помощь', 'Найду');
  ok(g.quests.noah_dog === 'active', 'noah quest');
  g.addItem('stoneblood');
  talk(g, 'noah', 'Кровь камня', 'Спасибо');
  ok(g.flag('noah_gift') && g.flag('plateau_safe') && g.hasItem('noah_letter'), 'noah reward');
  talk(g, 'owl', 'работа', 'Попробую');
  ok(g.quests.compass === 'active', 'compass quest');
  g.startEmission(); place(g, world.markers.bar1.x, world.markers.bar1.y, world.markers.bar1.z);
  tick(g, 60 * 150);
  ok(g.flag('compass_spawned'), 'compass spawns after emission');
  const comp = g.artifacts.find(a => a.id === 'compass');
  ok(comp && !comp.taken, 'compass artifact exists');
  g.pickArtifact(comp);
  talk(g, 'owl', 'Компас', 'Оставлю');
  ok(g.flag('compass_kept') && g.hasItem('compass'), 'compass kept');
  talk(g, 'zveroboy', 'работа', 'Берусь');
  ok(g.quests.chimera === 'active', 'chimera hunt');
  g.time = g.day() * 1440 + 23 * 60;
  place(g, C.MAP.POI.sawmill.x, C.MAP.POI.sawmill.y - 60);
  tick(g, 30);
  const chim = g.actors.find(a => a.chimeraHunt);
  ok(chim, 'chimera appears at night');
  kill(g, chim);
  ok(chim.inv.some(i => i.id === 'chimera_claw'), 'claw dropped');
  const claw = chim.inv.find(i => i.id === 'chimera_claw'); chim.inv.splice(chim.inv.indexOf(claw), 1); g.addInstance(claw);
  talk(g, 'zveroboy', 'коготь', 'Спасибо');
  ok(g.hasItem('chaser') && g.quests.chimera === 'done', 'chaser reward');
}

{
  const g = newGame();
  g.setFlag('skat2_done');
  tick(g, 20);
  ok(g.quests.lotsman === 'active', 'lotsman sos');
  const l = actor(g, 'lotsman');
  const dogs = g.actors.filter(a => a.type === 'dog' && Math.hypot(a.x - C.MAP.POI.shevchenko.x, a.y - C.MAP.POI.shevchenko.y) < 70);
  ok(dogs.length >= 5, 'dogs around shevchenko');
  talk(g, 'lotsman', 'прикрою');
  ok(g.flag('lotsman_saved') && g.quests.lotsman === 'done', 'lotsman saved');
  place(g, 900, 300); tick(g, 30);
  ok(g.flag('lotsman_home') && Math.hypot(l.x - world.markers.lotsman_home.x, l.y - world.markers.lotsman_home.y) < 1, 'lotsman went home');
  g.setFlag('route_known');
  talk(g, 'lotsman', 'Проведёшь', 'Идём');
  ok(l.follow && !l.static, 'lotsman follows');
  place(g, world.markers.outside_door.x, world.markers.outside_door.y - 4); tick(g, 60 * 10);
  ok(Math.hypot(l.x - g.player.x, l.y - g.player.y) < 60, 'follower keeps up');
  const json = g.serialize();
  ok(json.length < 1500000, 'save size reasonable: ' + json.length);
  const g2 = C.Game.deserialize(json, { world });
  ok(g2.flag('lotsman_saved') && g2.quests.lotsman === 'done', 'save roundtrip flags');
  ok(g2.actors.length === g.actors.length, 'save roundtrip actors');
  const l2 = g2.actorById('lotsman'); ok(l2 && l2.follow, 'follower restored');
  ok(Math.abs(g2.player.x - g.player.x) < 1e-6 && g2.player.money === g.player.money, 'player restored');
  ok(g2.anomalies.length === g.anomalies.length, 'anomalies restored');
  tick(g2, 120);
  ok(!g2.dead, 'loaded game ticks');
  ok(JSON.parse(json).v === C.SAVE_VERSION && C.SAVE_VERSION >= 2, 'saves carry the map version');
  const old = JSON.parse(json);
  old.v = 1; old.player.x = 452; old.player.y = 64; old.items = [{ item: C.makeItem('bread'), x: 1, y: 1, z: 0 }];
  g.stashes.st_tower.opened = true; old.stashes = JSON.parse(JSON.stringify(g.stashes));
  for (const a of old.actors) { a.x = 10; a.y = 10; }
  const g3 = C.Game.deserialize(old, { world });
  const bar = world.markers.bar1;
  ok(Math.hypot(g3.player.x - bar.x, g3.player.y - bar.y) < 2 && g3.player.zone && g3.player.zone.base === 'skadovsk', 'old-map save puts the player into the Skadovsk bar');
  ok(g3.flag('lotsman_saved') && g3.quests.lotsman === 'done' && g3.player.money === g.player.money && g3.player.inv.length === g.player.inv.length, 'old-map save keeps progress and inventory');
  ok(g3.actorById('beard') && Math.hypot(g3.actorById('beard').x - world.markers.beard.x, g3.actorById('beard').y - world.markers.beard.y) < 1, 'old-map save repopulates the new map');
  const l3 = g3.actorById('lotsman'); ok(l3 && l3.follow, 'old-map save restores the following Lotsman');
  ok(g3.stashes.st_tower.opened && !g3.items.some(e => e.item.id === 'bread' && e.x === 1), 'old-map save keeps stash state and drops stale ground items');
  tick(g3, 60);
  ok(!g3.dead, 'migrated game ticks');
}

{
  const g = newGame({ difficulty: 2 });
  place(g, 470, 300); g.startEmission();
  tick(g, 60 * 125);
  ok(g.dead && g.deathCause.includes('выброс'), 'emission kills unsheltered on veteran');
  const g2 = newGame({ difficulty: 0 });
  place(g2, 470, 300); g2.startEmission(); tick(g2, 60 * 125);
  ok(!g2.dead && g2.player.hp <= 12.5, 'novice survives emission barely');
}

{
  const g = newGame();
  g.actors.length = 0; g.squads = [];
  place(g, 395, 255);
  const dog = g.spawnActor('dog', 401, 255, {});
  dog.target = 'player';
  const hp0 = g.player.hp;
  tick(g, 200);
  ok(g.player.hp < hp0, 'dog bites player');
  g.player.hp = 100;
  g.player.yaw = Math.atan2(dog.y - g.player.y, dog.x - g.player.x); g.player.pitch = Math.atan2(dog.z + 0.5 - g.eyeZ(), Math.hypot(dog.x - g.player.x, dog.y - g.player.y));
  g.player.active = 'rifle';
  for (let i = 0; i < 400 && !dog.dead; i++) { g.player.yaw = Math.atan2(dog.y - g.player.y, dog.x - g.player.x); g.player.pitch = Math.atan2(dog.z + 0.45 - g.eyeZ(), Math.max(0.5, Math.hypot(dog.x - g.player.x, dog.y - g.player.y))); g.tick({ fire: true }); g.events.length = 0; }
  ok(dog.dead, 'player shoots dog');
  const b = g.spawnActor('bandit', 417, 255, { extra: { angry: true } });
  b.target = 'player';
  g.player.hp = 100;
  tick(g, 60 * 12);
  ok(g.player.hp < 100 || b.dead, 'bandit shoots player ' + JSON.stringify({ dead: g.dead, hp: g.player.hp, b: [b.x, b.y, b.target, b.seesTarget, b.mag, b.anim], p: [g.player.x, g.player.y] }));
  const s = g.spawnActor('stalker', 400, 260, {});
  g.damageActor(s, 5, 'bullet', 'player', {});
  ok(s.angry, 'hurt stalker turns hostile');
}

{
  for (const [id, fn] of Object.entries(C.DIALOGS)) {
    const g = newGame();
    const a = g.actors.find(x => x.dialog === id) || g.spawnActor('stalker', 500, 430, { dialog: id, talk: true, name: 'Тест' });
    const tree = fn(g, a);
    for (const [nid, n] of Object.entries(tree.nodes)) {
      const text = typeof n.text === 'function' ? n.text(a) : n.text;
      ok(typeof text === 'string' && text.length > 5, `${id}.${nid} text`);
      for (const o of n.opts) { ok(['end', 'trade', 'upgrade', 'repair'].includes(o.next) || tree.nodes[o.next], `${id}.${nid} -> ${o.next}`); if (o.cond) o.cond(g, a); }
    }
  }
  const g = newGame();
  for (const q of Object.keys(C.QUESTS)) { g.quests[q] = 'active'; }
  for (const q of g.questList()) ok(Array.isArray(q.objectives), 'objectives ' + q.id);
}

{
  const g = newGame();
  g.actors.length = 0; g.squads = [];
  const p = g.player;
  const route = (frame, start, pts, label, zoneName) => {
    const W = (lx, ly) => [frame[0] + lx * Math.cos(frame[2]) - ly * Math.sin(frame[2]), frame[1] + lx * Math.sin(frame[2]) + ly * Math.cos(frame[2])];
    const s0 = W(...start);
    place(g, s0[0], s0[1], world.groundAt(s0[0], s0[1], world.terrain.heightAt(s0[0], s0[1]) + 0.4).h);
    for (const q of pts) {
      const [tx, ty] = W(...q);
      for (let i = 0; i < 3000 && Math.hypot(tx - p.x, ty - p.y) > 0.35; i++) { p.yaw = Math.atan2(ty - p.y, tx - p.x); g.tick({ fwd: true }); g.events.length = 0; }
      ok(Math.hypot(tx - p.x, ty - p.y) < 0.6, `${label}: reached (${q}) at ${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}`);
    }
    if (zoneName) ok(p.zone && p.zone.name === zoneName, `${label}: in ${zoneName}, got ${p.zone && p.zone.name}`);
    p.hp = 100; p.bleed = 0; p.rad = 0;
  };
  const P = C.MAP.POI, sk = [P.skadovsk.x, P.skadovsk.y, P.skadovsk.yaw], sh = [P.shevchenko.x, P.shevchenko.y, P.shevchenko.yaw];
  route(sk, [-11, -16], [[-11, -9], [-11, -4], [-8, 1]], 'gangway', 'Бар «Скадовск»');
  route(sk, [-11, -16], [[-11, -9], [-11, -4], [-4, 2.6], [2.4, 2.6], [5, 0], [9, -1.5]], 'bar to owl cabin', 'Каюта Сыча');
  route(sk, [-11, -16], [[-11, -9], [-11, -4], [-12.5, 3.2], [-12.4, 5.6], [0.4, 5.6], [3, 3]], 'inner stairs to deck');
  ok(p.z > 7, 'on deck after inner stairs');
  route(sk, [-3, 10], [[-4.5, 8.35], [-23.4, 8.35], [-24.5, 7.4], [-24.5, 4]], 'outer stairs to deck');
  ok(p.z > 7, 'on deck after outer stairs');
  route(sk, [-3, 10], [[-4.5, 8.35], [-23.4, 8.35], [-24.5, 7.4], [-24.5, 4], [-29, 0], [-35, 0]], 'bridge door', 'Мостик');
  route(sh, [-7, -14], [[-7, -8], [-7, 0], [-16.5, 0], [-24, -3]], 'shevchenko engine room', 'Машинное отделение');
  route(sh, [9, -14], [[9, -2], [13, 0.6], [17, 0.8]], 'shevchenko bow', 'Носовой отсек');
  route([0, 0, 0], [814, 775], [[820, 768], [852, 728], [856, 721], [858.5, 718], [860.4, 718], [860.4, 713.5], [863, 713.5]], 'dredge pier', 'Земснаряд, машинный зал');
  route([P.noah.x, P.noah.y, 0], [5, -24], [[5, -12], [5, -3], [3, 0], [1.5, 0], [-1, 0]], 'noah barge', 'Хижина Ноя');
  route([P.krug.x, P.krug.y, 0], [20, 0], [[14, 0], [10, 0], [7, 2]], 'krug lair', 'ВНЗ «Круг»');
  route([P.substation.x, P.substation.y, 0], [-8, -8], [[-8, 0], [-8, 7]], 'substation office', 'Контора подстанции, 1 этаж');
  route([P.gallery.x, P.gallery.y, Math.PI + 0.593], [-30, 0], [[-10, 0], [38, 0]], 'tunnel', 'Тоннель на Юпитер');
  route([P.sawmill.x, P.sawmill.y, 0], [-14, -12], [[-11, -18], [-11, -26]], 'sawmill hall', 'Цех лесопилки');
  route([P.sawmill.x, P.sawmill.y, 0], [10, -26], [[13, -26], [17, -26], [20, -30.6], [24.6, -30.6], [28.2, -30.6], [29.2, -30.6], [29.2, -27], [23, -25]], 'sawmill attic', 'Чердак конторы');
  ok(p.z > world.terrain.heightAt(p.x, p.y) + 2.8, 'on the sawmill office attic');
  route([P.fuel.x, P.fuel.y, 0], [9.6, -18], [[9.6, -14.4], [9.6, -11], [9.6, -8]], 'fuel tank');
  p.yaw = Math.PI; p.stamina = 100; p.vx = p.vy = 0;
  tick(g, 80, i => ({ fwd: true, run: true, jump: i === 20 }));
  ok(p.z > world.terrain.heightAt(p.x, p.y) + 3.3, 'jump from the fuel tank onto the station roof ' + [p.x.toFixed(1), p.y.toFixed(1), p.z.toFixed(2)]);
  route([P.forestry.x, P.forestry.y, 0], [-70, 26], [[-62, 26], [-50, 26], [-30, 26]], 'forestry gate');
  route([P.izumrud.x, P.izumrud.y, 0], [-2, 4], [[-0.5, 8], [-0.5, 12]], 'izumrud cabin', 'Корпус лагеря');
}

{
  const g = newGame();
  const p = g.player;
  const ids = kind => C.SPAWN_CATALOG.filter(c => c.kind === kind).flatMap(c => c.entries.map(e => e.id));
  const same = (a, b) => a.slice().sort().join() === b.slice().sort().join();
  ok(same(ids('item'), Object.keys(D.ITEMS)), 'spawner lists every item');
  ok(same(ids('creature'), Object.keys(D.NPC_TYPES)), 'spawner lists every creature');
  ok(same(ids('anomaly'), Object.keys(D.ANOMALY_TYPES)), 'spawner lists every anomaly');
  for (const c of C.SPAWN_CATALOG) for (const e of c.entries) ok(typeof e.name === 'string' && e.name.length > 1, 'spawner name ' + e.id);
  for (const page of ['index.html', 'cop98.html']) ok(fs.readFileSync(path.join(__dirname, '..', page), 'utf8').includes('js/apps/cop98/cp-spawner.js'), page + ' loads cp-spawner');
  for (const id of ids('item')) {
    const def = D.ITEMS[id], n0 = g.countItem(id);
    g.spawnItems(id, 3, 'bag');
    ok(g.countItem(id) - n0 === 3 * (def.type === 'ammo' ? def.box : 1), 'bag spawn ' + id);
  }
  ok(p.inv.filter(i => i.id === 'svd').every(i => i.cond === 1 && i.mag === D.WEAPONS.svd.mag), 'spawned rifles are new and loaded');
  g.events.length = 0;
  place(g, 395, 255); p.yaw = 0.4;
  const items0 = g.items.length;
  g.spawnItems('medkit', 5, 'ground'); g.spawnItems('ak', 7, 'ground');
  const ground = g.items.slice(items0);
  ok(ground.length === 8 && ground[0].item.count === 5 && ground.every(e => e.spawned && Math.hypot(e.x - p.x, e.y - p.y) < 3 && Math.abs(e.z - p.z) < 1), 'ground spawn lands in front of the player');
  const arts = g.spawnItems('nightstar', 2, 'ground');
  ok(arts.every(a => g.artifacts.includes(a) && a.visible && a.field === 'spawned' && Math.hypot(a.x - p.x, a.y - p.y) < 3), 'artifact spawned into the world');
  for (const type of ids('creature')) {
    const [a] = g.spawnCreatures(type, 1);
    const d = Math.hypot(a.x - p.x, a.y - p.y);
    ok(a.spawned && a.type === type && d > 3 && d < 9 && Math.abs(a.z - p.z) < 2.6, `creature ${type} spawned ${d.toFixed(1)} m ahead`);
  }
  const foes = g.spawnCreatures('stalker', 3, { attitude: 'hostile' });
  ok(foes.length === 3 && foes.every(a => g.hostileToPlayer(a) && a.target === 'player'), 'hostile stalkers attack');
  ok(foes.every((a, i) => foes.every((b, j) => i === j || Math.hypot(a.x - b.x, a.y - b.y) > 0.8)), 'group spawn spreads out');
  const guards = g.spawnCreatures('bandit', 2, { attitude: 'follow', weapon: 'svd' });
  ok(guards.every(a => !g.hostileToPlayer(a) && a.follow && a.weapon === 'svd' && a.npcClass === 'sniper'), 'bandit followers carry chosen rifle');
  const pet = g.spawnCreatures('boar', 1, { attitude: 'friendly' })[0];
  ok(!g.hostileToPlayer(pet) && pet.faction === 'player', 'friendly boar');
  const vet = g.spawnCreatures('veteran', 1)[0];
  ok(vet.talk && vet.dialog === 'stalker' && !g.hostileToPlayer(vet), 'neutral veteran can talk');
  ok(g.hostileToPlayer(g.spawnCreatures('zombie', 1)[0]), 'zombie stays hostile');
  const vortex = g.spawnAnomalies('vortex', 2);
  ok(vortex.length === 2 && vortex.every(a => a.field === 'spawned' && Math.hypot(a.x - p.x, a.y - p.y) > a.trigger), 'vortex spawns beyond its pull');
  const bar = world.markers.bar1;
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    place(g, bar.x, bar.y + 1, bar.z); p.yaw = yaw;
    const [a] = g.spawnCreatures('stalker', 1);
    ok(Math.abs(a.z - p.z) < 0.6 && Math.hypot(a.x - p.x, a.y - p.y) > 1, 'bar spawn stays on the floor, yaw ' + yaw.toFixed(2));
  }
  const sk = C.MAP.POI.skadovsk, deckZ = world.groundAt(sk.x + 10, sk.y + 2, 8).h;
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    place(g, sk.x + 10, sk.y + 2, deckZ); p.yaw = yaw;
    const [a] = g.spawnCreatures('chimera', 1);
    ok(Math.abs(a.z - p.z) < 0.6 && Math.hypot(a.x - p.x, a.y - p.y) > 1, 'deck spawn stays on deck, yaw ' + yaw.toFixed(2));
  }
  const count = g.spawnedCount();
  const g2 = C.Game.deserialize(g.serialize(), { world });
  ok(g2.spawnedCount() === count && g2.anomalies.filter(a => a.field === 'spawned').length === 2, 'spawned objects survive save/load');
  g2.afterEmission();
  ok(g2.anomalies.filter(a => a.field === 'spawned').length === 2, 'emission keeps spawned anomalies');
  ok(g2.clearSpawned() === count && g2.spawnedCount() === 0 && !g2.actors.some(a => a.spawned) && !g2.items.some(e => e.spawned), 'clear removes spawned objects');
  ok(g2.actors.some(a => a.id === 'beard') && g2.anomalies.length > 20, 'clear keeps the world');
}

{
  const g = newGame();
  g.actors.length = 0; g.squads = [];
  g.cheats.god = true;
  const p = g.player;
  place(g, 395, 255); p.yaw = 0;
  const [dog] = g.spawnCreatures('dog', 1, { attitude: 'follow' });
  const [mate] = g.spawnCreatures('stalker', 1, { attitude: 'follow' });
  place(g, 435, 265);
  tick(g, 60 * 12);
  ok(Math.hypot(dog.x - p.x, dog.y - p.y) < 8 && Math.hypot(mate.x - p.x, mate.y - p.y) < 8, 'followers keep up');
  p.yaw = Math.PI / 2;
  const [flesh] = g.spawnCreatures('flesh', 1);
  const [foe] = g.spawnCreatures('bandit', 1, { attitude: 'hostile' });
  tick(g, 60 * 15);
  ok(flesh.dead && foe.dead, 'followers kill a mutant and a hostile bandit');
  g.cheats.god = false;
  place(g, 395, 255); p.yaw = 0; p.hp = 100;
  const zh = g.spawnAnomalies('zharka', 1)[0];
  place(g, zh.x, zh.y); tick(g, 40);
  ok(p.hp < 100, 'spawned zharka burns');
}

{
  const g = newGame();
  const p = g.player;
  const pump = (n, fn) => { for (let i = 0; i < n; i++) { g.tickN++; g.updateWeather(); if (fn) fn(i); } };
  ok(C.WEATHER_KINDS.join() === 'clear,cloudy,rain,fog', 'four weather kinds');
  const shelf = C.SPAWN_CATALOG.find(c => c.id === 'weather');
  ok(shelf && shelf.kind === 'weather' && shelf.group === 'world' && shelf.entries.map(e => e.id).join() === C.WEATHER_KINDS.join(), 'spawner lists every weather');
  for (const e of shelf.entries) ok(e.name === C.WEATHER[e.id].name && C.WEATHER[e.id].desc.length > 40, 'weather card text ' + e.id);
  for (const page of ['index.html', 'cop98.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', page), 'utf8'), at = f => html.indexOf('js/apps/cop98/' + f + '.js');
    ok(at('cp-shaders') > at('cp-render') && at('cp-shaders') < at('cp-game') && at('cp-weather') > at('cp-game') && at('cp-weather') < at('cp-spawner'), page + ' loads shaders and weather in order');
  }
  ok(!g.setWeather('snow') && g.weather.kind === 'clear', 'unknown weather refused');
  g.time = 13 * 60;
  const envs = {};
  for (const k of C.WEATHER_KINDS) { ok(g.setWeather(k, { instant: true }), 'set weather ' + k); envs[k] = g.computeEnv(); }
  ok(envs.rain.rain === 1 && envs.clear.rain === 0 && envs.cloudy.rain === 0 && envs.fog.rain === 0, 'only rain rains');
  ok(envs.fog.fogEnd < envs.rain.fogEnd && envs.rain.fogEnd < envs.cloudy.fogEnd && envs.cloudy.fogEnd < envs.clear.fogEnd, 'visibility drops from clear to fog');
  ok(envs.fog.hfog > envs.rain.hfog && envs.rain.hfog > envs.cloudy.hfog && envs.clear.hfog === 0, 'ground fog density per weather');
  ok(envs.clear.cover < 0.3 && envs.cloudy.cover > 0.8 && envs.rain.cover === 1, 'cloud cover per weather');
  ok(envs.clear.light[1] > envs.cloudy.light[1] && envs.cloudy.light[1] > envs.rain.light[1], 'overcast and rain darken the day');
  ok(envs.clear.sunLit > 0.5 && envs.rain.sunLit < 0.05, 'sun shines only through a clear sky');
  ok(envs.clear.grade.sat > envs.cloudy.grade.sat && envs.cloudy.grade.sat > envs.rain.grade.sat && envs.fog.grade.con < envs.clear.grade.con, 'weather colour grade');
  ok(g.weatherSight(g.weatherPreview('fog')) < 0.6 && g.weatherSight(g.weatherPreview('clear')) === 1 && g.weatherNoise(g.weatherPreview('rain')) < 0.7, 'fog blinds and rain muffles');

  g.setWeather('clear', { instant: true }); g.weather.wet = 0;
  g.setWeather('rain');
  ok(g.weather.kind === 'rain' && g.weather.rain === 0 && g.weather.cloud < 0.3, 'smooth change starts from the old sky');
  pump(60 * 25);
  const r25 = g.weather.rain, c25 = g.weather.cloud;
  ok(c25 > 0.4 && r25 < 0.2, 'clouds gather before the rain');
  pump(60 * 100);
  ok(g.weather.cloud > 0.95 && g.weather.rain > 0.8 && g.weather.wet > 0.5, 'rain arrives and the ground gets wet');
  const wet = g.weather.wet;
  g.setWeather('clear'); pump(60 * 60);
  ok(g.weather.rain < 0.2 && g.weather.wet < wet && g.weather.wet > 0, 'ground dries slowly after rain');
  g.setWeather('fog', { instant: true, hold: true });
  pump(60 * 60 * 25);
  ok(g.weather.kind === 'fog' && g.weather.fogK > 0.99, 'held weather stays');
  g.weather.hold = false;
  let changed = false;
  pump(60 * 60 * 40, () => { if (g.weather.kind !== 'fog') changed = true; });
  ok(changed, 'weather changes by itself when not held');

  g.setWeather('rain', { instant: true, hold: true }); g.events.length = 0;
  pump(60 * 300);
  const bolts = g.events.filter(e => e.type === 'lightning');
  ok(bolts.length > 1 && bolts.every(e => e.dist >= 420 && e.dist <= 1120 && Number.isFinite(e.az)), 'thunderstorm lightning in heavy rain: ' + bolts.length);
  g.events.length = 0;

  place(g, 395, 255); p.yaw = 0; p.crouch = false; p.flashlight = false; p.noise = 0;
  const [watcher] = g.spawnCreatures('bandit', 1);
  watcher.x = p.x + 50; watcher.y = p.y; watcher.z = world.groundAt(watcher.x, watcher.y, 999, 0).h; watcher.alert = 1;
  g.time = 13 * 60;
  g.setWeather('clear', { instant: true });
  const seesClear = g.actorSees(watcher, 'player');
  g.setWeather('fog', { instant: true });
  ok(seesClear && !g.actorSees(watcher, 'player'), 'a bandit 50 m away sees the player in clear weather but not in fog');
  g.clearSpawned();

  g.setWeather('rain', { instant: true, hold: true });
  const g2 = C.Game.deserialize(g.serialize(), { world });
  ok(g2.weather.kind === 'rain' && g2.weather.hold && g2.weather.rain === 1 && g2.weather.wet > 0.5, 'weather survives save and load');
  const old = JSON.parse(g.serialize());
  old.weather = { kind: 'fog', t: 3, next: 60, rain: 0, fogK: 0.7 };
  const g3 = C.Game.deserialize(old, { world });
  const env3 = g3.computeEnv();
  ok(g3.weather.kind === 'fog' && g3.weather.fogK === 0.7 && typeof g3.weather.cloud === 'number' && g3.weather.hold === false && Number.isFinite(env3.hfog) && Number.isFinite(env3.windX), 'old saves get a full weather state');
  old.weather = { kind: 'hail' };
  ok(C.Game.deserialize(old, { world }).weather.kind === 'clear', 'unknown saved weather falls back to clear');

  ok(C.Sky.densityAt(g.weather, [1, 0, -0.2]) === g.weather.cloud, 'cloud density below the horizon is the cover');
  for (const k of C.WEATHER_KINDS) { const d = C.Sky.densityAt(g.weatherPreview(k), [0.2, 0.3, 0.9]); ok(d >= 0 && d <= 1, 'cloud density in range ' + k); }

  const R = new C.Renderer(160, 100); R.textures = world.textures;
  const camFlat = { x: 486, y: 440, z: 6, yaw: 1.2, pitch: 0.05, fov: 1.3 }, camUp = Object.assign({}, camFlat, { pitch: 0.75 });
  const frame = (kind, hour, cam, patch) => {
    g.time = hour * 60; g.setWeather(kind, { instant: true }); g.weather.wet = kind === 'rain' ? 1 : 0; Object.assign(g.weather, { cloudX: 0, cloudY: 0, windDir: 0.6 });
    const env = g.computeEnv(); Object.assign(env, patch || {});
    R.setupCamera(cam); R.setupEnv(env); R.clear(); R.renderTerrain(world.terrain); R.renderMeshes(world.bins, C.RENDER_CELL, C.RGN);
    R.renderSky(); R.applyAtmosphere(env, false); R.renderRain(env, world.terrain, false); R.sunShafts(env);
    return { fb: R.fb.slice(), zb: R.zb.slice(), env };
  };
  const lum = c => (c & 255) * 0.3 + ((c >>> 8) & 255) * 0.5 + ((c >>> 16) & 255) * 0.2;
  const stat = (f, pick) => { let n = 0, s = 0, s2 = 0; for (let i = 0; i < f.fb.length; i++) if (pick(f.zb[i])) { const l = lum(f.fb[i]); n++; s += l; s2 += l * l; } return { n, mean: s / Math.max(1, n), sd: Math.sqrt(Math.max(0, s2 / Math.max(1, n) - (s / Math.max(1, n)) ** 2)) }; };
  const isSky = z => z >= C.FAR_Z, isGround = z => z < C.FAR_Z;
  const shots = {};
  for (const k of C.WEATHER_KINDS) { shots[k] = frame(k, 13, camUp); ok(shots[k].fb.every(v => (v >>> 24) === 255), 'opaque frame in ' + k); }
  ok(stat(shots.clear, isSky).mean > stat(shots.rain, isSky).mean + 20, 'rain sky is darker than a clear sky: ' + stat(shots.clear, isSky).mean.toFixed(1) + ' ' + stat(shots.rain, isSky).mean.toFixed(1) + ' n ' + stat(shots.clear, isSky).n);
  ok(stat(shots.clear, isSky).sd > 6 && stat(shots.cloudy, isSky).sd > 6, 'clouds give the sky structure: ' + stat(shots.clear, isSky).sd.toFixed(1) + ' ' + stat(shots.cloudy, isSky).sd.toFixed(1));
  const night = frame('clear', 23.5, camUp), nightRain = frame('rain', 23.5, camUp);
  const starCount = f => { const s = stat(f, isSky); let n = 0; for (let i = 0; i < f.fb.length; i++) if (isSky(f.zb[i]) && lum(f.fb[i]) > s.mean + 40) n++; return n; };
  ok(starCount(night) > 15 && starCount(nightRain) === 0, 'stars on a clear night, none under rain clouds: ' + starCount(night));
  const dry = frame('rain', 13, camFlat, { rain: 0 }), wetF = frame('rain', 13, camFlat);
  let streaks = 0;
  for (let i = 0; i < dry.fb.length; i++) if (dry.fb[i] !== wetF.fb[i]) streaks++;
  ok(streaks > 200, 'rain draws drops and sheets: ' + streaks);
  const dryGround = frame('cloudy', 13, camFlat), wetGround = frame('cloudy', 13, camFlat, { wet: 1 });
  ok(stat(wetGround, isGround).mean < stat(dryGround, isGround).mean - 3, 'wet ground is darker');
  const camOpen = { x: 395, y: 255, z: world.groundAt(395, 255, 999, 0).h + 1.7, yaw: 0.4, pitch: -0.05, fov: 1.3 };
  const fogShot = frame('fog', 13, camOpen), clearShot = frame('clear', 13, camOpen);
  const fogDist = f => { const fc = f.env.fogColor, fr = C.red(fc), fg = C.green(fc), fbb = C.blue(fc); let n = 0, s = 0; for (let i = 0; i < f.fb.length; i++) if (f.zb[i] > 40 && f.zb[i] < C.FAR_Z) { const c = f.fb[i]; s += Math.abs((c & 255) - fr) + Math.abs(((c >>> 8) & 255) - fg) + Math.abs(((c >>> 16) & 255) - fbb); n++; } return s / Math.max(1, n); };
  ok(fogDist(fogShot) < fogDist(clearShot) * 0.5, 'fog swallows distant ground: ' + fogDist(fogShot).toFixed(1) + ' vs ' + fogDist(clearShot).toFixed(1));
  const noBolt = frame('rain', 15, camFlat), bolt = frame('rain', 15, camFlat, { bolt: { az: camFlat.yaw, dist: 600, seed: 3, k: 1 } });
  ok(stat(bolt, isSky).mean > stat(noBolt, isSky).mean + 2, 'lightning lights up the clouds');
  const base = frame('clear', 23.5, camOpen), base0 = R.fb.slice();
  const fx = Math.cos(camOpen.yaw), fy = Math.sin(camOpen.yaw);
  R.drawTracer({ ax: camOpen.x + fx, ay: camOpen.y + fy, az: camOpen.z - 0.2, bx: camOpen.x + fx * 30, by: camOpen.y + fy * 30, bz: camOpen.z - 0.2, t: 0.03, life: 0.06 });
  let lit = 0; for (let i = 0; i < base0.length; i++) if (R.fb[i] !== base0[i]) lit++;
  ok(lit > 5, 'tracer is drawn');
  R.fb.set(base0); R.drawFlash(80, 60, 12, 5, { dirX: 0, dirY: -1, stretch: 1.4 });
  ok(lum(R.fb[60 * 160 + 80]) > lum(base0[60 * 160 + 80]) + 100, 'muzzle flash burns bright in the centre');
  R.fb.set(base0); R.zb.set(base.zb);
  let gi = -1; for (let i = 90 * 160; i < base.zb.length; i++) if (base.zb[i] < 12) { gi = i; break; }
  ok(gi >= 0, 'ground near the camera for the light test');
  const gx = gi % 160, gy = (gi / 160) | 0, a = (gx + 0.5 - R.halfW) / R.focal, b = (R.halfH - gy - 0.5) / R.focal, zc = base.zb[gi];
  const h = zc * (R.cosP - b * R.sinP);
  const wx = camOpen.x + h * fx + a * zc * R.rx, wy = camOpen.y + h * fy + a * zc * R.ry, wz = camOpen.z + zc * (R.sinP + b * R.cosP);
  R.pointLight(wx, wy, wz + 0.5, 6, C.rgb(255, 180, 100), 1.2);
  ok(lum(R.fb[gi]) > lum(base0[gi]) + 4, 'point light brightens the ground under it');
  R.fb.set(base0);
  R.drawArc({ ax: camOpen.x + fx * 6, ay: camOpen.y + fy * 6, az: camOpen.z - 1, bx: camOpen.x + fx * 6, by: camOpen.y + fy * 6, bz: camOpen.z + 1, color: 0xb0d8ff, seed: 4 }, 1);
  let arc = 0; for (let i = 0; i < base0.length; i++) if (R.fb[i] !== base0[i]) arc++;
  ok(arc > 10, 'electra arc is drawn');
  R.postProcess({ grade: envs.rain.grade });
  ok(R.fb.every(v => (v >>> 24) === 255), 'graded frame stays opaque');
}

{
  const re = /(^|[^:'"\\])\/\/|\/\*/m;
  for (const f of FILES.concat(UI_FILES)) {
    const src = fs.readFileSync(path.join(DIR, f + '.js'), 'utf8').replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, '""');
    ok(!re.test(src), 'no comments in ' + f);
  }
}

console.log(`cop98: ${checks} checks passed in ${Date.now() - t0} ms`);
