// Doom 98 — logic, map and renderer tests (Node, no browser).
const assert = require('node:assert/strict');
const D = require('../js/apps/doom/doom-data.js');
for (const f of ['doom-gfx', 'doom-level', 'doom-maps', 'doom-core', 'doom-render', 'doom-audio']) require(`../js/apps/doom/${f}.js`);
const { THINGS, WEAPONS, MF } = D.DATA;
const G = D.GFX.build();
const tick = (g, n, cmd = {}) => { for (let i = 0; i < n; i++) { g.tick(typeof cmd === 'function' ? cmd(i) : cmd); for (const e of g.events) if (e.t === 'reborn') g.reborn(); g.events.length = 0; } };
const place = (g, x, y, deg) => { const mo = g.player.mo; mo.x = mo.px = x; mo.y = mo.py = y; mo.sector = D.pointSector(g.L, x, y); g.checkPosition(mo, x, y); mo.floorz = g.tmFloor; mo.ceilingz = g.tmCeil; mo.z = mo.floorz; mo.momx = mo.momy = 0; if (deg != null) mo.angle = deg * Math.PI / 180; };
const use = g => { tick(g, 1); tick(g, 1, { use: true }); };
const spawnAt = (g, type, x, y, deg = 0) => { const m = g.spawn(type, x, y, null); m.angle = deg * Math.PI / 180; g.rebuildThingGrid(); return m; };

// ---- every state frame of every thing and weapon has graphics
{
  for (const id in THINGS) {
    const t = THINGS[id]; if (!t.sprite) continue;
    for (const label in t.st) for (const st of t.st[label]) {
      const k = t.sprite + st.frame;
      assert.ok(G.sprites[k + 'F'] || G.sprites[k], `sprite ${k} for ${id}.${label}`);
    }
  }
  for (const id in WEAPONS) {
    const w = WEAPONS[id];
    for (const label in w.st) for (const st of w.st[label]) {
      const isFlash = label.startsWith('flash');
      const k = (isFlash ? w.flash : w.sprite) + st.frame;
      assert.ok(G.hud[k], `hud ${k} for ${id}.${label}`);
    }
  }
  for (const n of ['STBAR', 'STFST00', 'STFDEAD0', 'STFGOD0', 'STTNUM0', 'STTNUM%', 'STYSNUM9', 'STKEYS2']) assert.ok(G.hud[n], n);
  assert.ok(G.textures.SKY1.w === 512 && G.flats.NUKAGE3, 'sky & animated flats');
}

// ---- sounds referenced anywhere exist
{
  const names = new Set();
  for (const id in THINGS) { const s = THINGS[id].sounds; if (s) for (const k in s) names.add(s[k]); }
  const src = require('fs').readFileSync(require.resolve('../js/apps/doom/doom-core.js'), 'utf8') + require('fs').readFileSync(require.resolve('../js/apps/doom/doom-ui.js'), 'utf8');
  for (const m of src.matchAll(/(?:sound|play)\('(\w+)'/g)) names.add(m[1]);
  for (const n of names) assert.ok(D.SFX[n], `sound ${n} has a recipe`);
  for (const k of ['pistol', 'barexp', 'bgsit']) { const a = D.SFX[k](); assert.ok(a.length > 1000 && a.every(Number.isFinite), k); }
  for (const m of D.MAPS) assert.ok(D.TRACKS[m.music], `music ${m.music}`);
}

// ---- maps: structure, things inside sectors, key-gated reachability of every exit
function explore(mapId) {
  const g = new D.Game({ map: mapId, skill: 2 }), L = g.L;
  const keys = new Set(), reached = new Set(), usedLines = new Set(), usedTrig = new Set();
  const range = s => { if (s.lift) { let lo = s.floor; for (const n of s.neighbors) lo = Math.min(lo, L.sectors[n].floor); return [lo, s.lift.high != null ? s.lift.high : s.origFloor]; } return [s.floor, s.floor]; };
  const ceilOf = s => s.door ? g.doorTop(s) : s.ceil;
  const shared = new Map();
  for (const l of L.lines) if (l.back >= 0) { const k = l.front < l.back ? `${l.front}_${l.back}` : `${l.back}_${l.front}`; shared.set(k, (shared.get(k) || 0) + l.len); }
  const passable = (A, B) => {
    if (B.door && B.door.key && !keys.has(B.door.key)) return false;
    const k = A.index < B.index ? `${A.index}_${B.index}` : `${B.index}_${A.index}`; if ((shared.get(k) || 0) < 32) return false;
    const [a0, a1] = range(A), [b0] = range(B);
    if (b0 - a1 > 24) return false;
    return Math.min(ceilOf(A), ceilOf(B)) - Math.max(a0, b0) >= 56 || Math.min(ceilOf(A), ceilOf(B)) - Math.max(a1, b0) >= 56;
  };
  let exit = false, secretExit = false, changed = true;
  const start = L.sectors[g.player.mo.sector];
  while (changed) {
    changed = false;
    reached.add(start.index); const q = [...reached];
    while (q.length) {
      const s = L.sectors[q.shift()];
      const nb = [...s.neighbors]; if (s.teleport) { const d = g.mobjs.find(m => m.type === 'teledest' && m.tid === s.teleport); assert.ok(d, `${mapId}: teledest ${s.teleport}`); nb.push(d.sector); }
      for (const n of nb) { if (reached.has(n)) continue; const B = L.sectors[n]; if (n === (s.teleport && g.mobjs.find(m => m.tid === s.teleport).sector) || passable(s, B)) { reached.add(n); q.push(n); changed = true; } }
    }
    for (const m of g.mobjs) if (m.info.pickup === 'key' && reached.has(m.sector) && !keys.has(m.info.key)) { keys.add(m.info.key); changed = true; }
    for (const l of L.lines) {
      if (!l.special || l.special === 'door' || l.special === 'liftUse' || usedLines.has(l.index)) continue;
      if (!reached.has(l.front) && !(l.back >= 0 && reached.has(l.back))) continue;
      if (l.key && !keys.has(l.key)) continue;
      usedLines.add(l.index);
      if (l.special === 'exit') { exit = true; continue; }
      if (l.special === 'secretexit') { secretExit = true; continue; }
      g.doAction(l.special, l.tag, g.player.mo, l); for (let i = 0; i < 2000 && g.thinkers.some(t => t.kind !== 'light'); i++) { for (const t of g.thinkers) if (t.kind !== 'light' && !t.done) g.runThinker(t); g.thinkers = g.thinkers.filter(t => !t.done); }
      changed = true;
    }
    for (const t of L.triggers) {
      if (usedTrig.has(t.index)) continue;
      const si = D.pointSector(L, (t.x1 + t.x2) / 2, (t.y1 + t.y2) / 2); if (!reached.has(si)) continue;
      usedTrig.add(t.index); if (t.action === 'exit') exit = true; else { g.doAction(t.action, t.tag, g.player.mo, null); changed = true; }
    }
  }
  return { g, exit, secretExit, keys, reached };
}
{
  const ids = D.MAPS.map(m => m.id);
  assert.deepEqual(ids.slice().sort(), ['E1M1', 'E1M2', 'E1M3', 'E1M4', 'E1M5', 'E1M9']);
  for (const m of D.MAPS) {
    const L = D.buildLevel(m);
    assert.equal(m.things.filter(t => t.type === 'player').length, 1, `${m.id} one player start`);
    for (const t of m.things) {
      assert.ok(THINGS[t.type] || t.type === 'player', `${m.id} thing type ${t.type}`);
      const si = D.pointSector(L, t.x, t.y);
      assert.ok(D.pointInSectorExact(L, si, t.x, t.y), `${m.id}: ${t.type} at ${t.x},${t.y} is inside a sector`);
    }
    // BSP leaves are convex and single-sector
    for (const ss of L.subsectors) for (const a of ss.segs) { assert.equal(a.sector, ss.sector); for (const b of ss.segs) if (a !== b) { const c1 = D.sideOf(b.x1, b.y1, a.x1, a.y1, a.x2 - a.x1, a.y2 - a.y1), c2 = D.sideOf(b.x2, b.y2, a.x1, a.y1, a.x2 - a.x1, a.y2 - a.y1); assert.ok(c1 > -1e-3 * Math.hypot(a.x2 - a.x1, a.y2 - a.y1) && c2 > -1e-3 * Math.hypot(a.x2 - a.x1, a.y2 - a.y1), `${m.id} convex leaf`); } }
    for (const l of L.lines) { assert.ok(L.sides[l.sides[0]].sector === l.front); if (l.back < 0) assert.ok(L.sides[l.sides[0]].mid, `${m.id} one-sided line has a texture`); }
    for (const s of L.sides) for (const t of [s.upper, s.mid, s.lower]) if (t) assert.ok(G.textures[t] || G.anims.tex[t], `${m.id} texture ${t}`);
    for (const s of L.sectors) for (const f of [s.ftex, s.ctex]) assert.ok(G.flats[f], `${m.id} flat ${f}`);
    const r = explore(m.id);
    if (m.bossType) { const boss = r.g.mobjs.find(mo => mo.type === m.bossType); assert.ok(boss && r.reached.has(boss.sector), `${m.id}: boss reachable`); }
    else assert.ok(r.exit, `${m.id}: exit reachable (keys ${[...r.keys]})`);
    if (m.secretNext) assert.ok(r.secretExit, `${m.id}: secret exit reachable`);
    if (m.next) assert.ok(D.MAPS.find(x => x.id === m.next), `${m.id} next map exists`);
    const unreached = r.g.mobjs.filter(mo => (mo.flags & MF.COUNTKILL) && !r.reached.has(mo.sector) && !r.g.L.sectors[mo.sector].neighbors.some(n => r.reached.has(n)));
    assert.equal(unreached.length, 0, `${m.id}: monsters in unreachable sectors ${unreached.map(u => u.type + '@' + u.x + ',' + u.y)}`);
  }
  assert.equal(D.MAPS.find(m => m.id === 'E1M3').secretNext, 'E1M9');
  assert.equal(D.MAPS.find(m => m.id === 'E1M9').next, 'E1M4');
}

// ---- renderer: no unpainted pixels from inside every sector, 8 directions, both resolutions
{
  for (const [w, h] of [[320, 200], [640, 400]]) {
    const r = new D.Renderer(w, h);
    for (const m of D.MAPS) {
      const g = new D.Game({ map: m.id, skill: 2 }), L = g.L;
      for (const ss of L.subsectors) {
        const s = L.sectors[ss.sector]; if (s.ceil - s.floor < 60) continue;
        let cx = 0, cy = 0; for (const sg of ss.segs) { cx += sg.x1 + sg.x2; cy += sg.y1 + sg.y2; } cx /= ss.segs.length * 2; cy /= ss.segs.length * 2;
        if (D.pointSector(L, cx, cy) !== ss.sector || !D.pointInSectorExact(L, ss.sector, cx, cy) || L.lines.some(l => D.distToLine(cx, cy, l) < 4)) continue;
        const p = g.player, mo = p.mo; mo.x = mo.px = cx; mo.y = mo.py = cy; mo.sector = ss.sector; mo.z = s.floor; p.viewz = p.pviewz = s.floor + 41;
        for (let a = 0; a < 8; a++) {
          mo.angle = a * Math.PI / 4 + 0.13;
          r.fb.fill(0xffff00ff);
          const fb = r.render(g, 1, { noWeapon: true });
          let holes = 0; for (let i = 0; i < w * r.viewH; i++) if (fb[i] === 0xffff00ff) holes++;
          assert.equal(holes, 0, `${m.id} ${w}x${h} holes at ${cx.toFixed(0)},${cy.toFixed(0)} a${a}`);
        }
      }
    }
  }
  // performance sanity: a 640x400 frame should take well under a frame budget in Node
  const r = new D.Renderer(640, 400), g = new D.Game({ map: 'E1M1' }); const t0 = Date.now(); for (let i = 0; i < 30; i++) r.render(g, 1); assert.ok((Date.now() - t0) / 30 < 40, 'render speed');
}

// ---- movement: walking, running speed, walls block, steps up, no stepping 32 units
{
  const g = new D.Game({ map: 'E1M1', skill: 2 }), mo = g.player.mo;
  g.mobjs.filter(m => m !== mo).forEach(m => g.remove(m)); tick(g, 1);
  place(g, 420, 20, 90); tick(g, 22, { forward: 50 });
  assert.ok(mo.momy > 13 && mo.momy < 16, `running speed ~15 units/tic (${mo.momy})`);
  place(g, 420, 20, 90); tick(g, 22, { forward: 25 });
  assert.ok(mo.momy > 6.5 && mo.momy < 8, `walking speed ~7.5 units/tic (${mo.momy})`);
  place(g, 256, 300, 90); tick(g, 70, { forward: 50 }); assert.ok(mo.y < 384 - 15, 'closed door blocks');
  place(g, 450, 190, 0); tick(g, 60, { forward: 50 }); assert.ok(mo.x > 620 && mo.z === 48, 'climbs the steps into storage');
  place(g, 700, 250, 90); const y0 = mo.y; tick(g, 40, { forward: 50 }); assert.ok(mo.y < 288 - 15, 'crate (64 high) blocks');
  // sliding along a wall at an angle keeps moving
  place(g, 30, 60, 100); const x0 = mo.x, yy = mo.y; tick(g, 30, { forward: 50 }); assert.ok(mo.y - yy > 100, 'slides along the west wall');
}

// ---- doors, keys, lifts, switches, teleport, secrets
{
  const g = new D.Game({ map: 'E1M1', skill: 2 }), mo = g.player.mo, door = g.L.sectors.find(s => s.door && !s.door.key && s.bbox[1] === 384 && s.bbox[0] === 224);
  g.cheat('iddqd'); g.player.notarget = true;
  place(g, 256, 340, 90); tick(g, 1, { use: true }); tick(g, 1);
  assert.ok(g.thinkers.some(t => t.kind === 'door' && t.sector === door), 'use opens door');
  tick(g, 70); assert.equal(door.ceil, g.doorTop(door), 'door fully open'); tick(g, 260); assert.equal(door.ceil, door.floor, "door closes after wait");
  // blue locked door
  const blue = g.L.sectors.find(s => s.door && s.door.key === 'blue');
  place(g, 288, 930, 90); g.events.length = 0; tick(g, 1, { use: true });
  assert.ok(!g.thinkers.some(t => t.sector === blue), 'locked without key');
  g.player.keys.blue = true; tick(g, 2); tick(g, 1, { use: true }); assert.ok(g.thinkers.some(t => t.sector === blue), 'opens with blue key');
  // lift
  const lift = g.L.sectors.find(s => s.lift); place(g, 460, 672, 0); use(g); tick(g, 30);
  assert.equal(lift.floor, 0, 'lift lowered'); tick(g, 140); assert.equal(lift.floor, 48, 'lift returns');
  // ambush trigger opens the monster closet
  const closet = g.L.sectors.find(s => s.tag === 'amb1'); place(g, 736, 500, 90); tick(g, 25, { forward: 25 });
  assert.ok(g.thinkers.some(t => t.sector === closet) || closet.ceil > closet.floor, 'walk trigger opened the closet');
  // secret sector counts once
  const g2 = new D.Game({ map: 'E1M1' }); const sec = g2.L.sectors.find(s => s.secret);
  place(g2, -80, 192, 0); tick(g2, 2); assert.equal(g2.player.secrets, 1); tick(g2, 2); assert.equal(g2.player.secrets, 1);
  // switch-raised bridge and teleporter on E1M3
  const g3 = new D.Game({ map: 'E1M3' }), bridge = g3.L.sectors.find(s => s.tag === 'bridge');
  place(g3, 496, 560, 90); use(g3); tick(g3, 30);
  assert.equal(bridge.floor, 0, 'switch raised the bridge');
  const swLine = g3.L.lines.find(l => l.special === 'raiseFloorTo'); assert.equal(g3.L.sides[swLine.sides[0]].mid, 'SW1ON', 'switch texture flipped');
  place(g3, 200, 512, 180); tick(g3, 40, { forward: 25 });
  assert.ok(g3.player.mo.x < -256, `teleported to the yellow key room (${g3.player.mo.x.toFixed(0)})`);
  // exit switch and secret exit
  const g4 = new D.Game({ map: 'E1M1' }); place(g4, 288, 1040, 90); let exits = [];
  for (let i = 0; i < 20; i++) { g4.tick({ use: i === 0 }); exits.push(...g4.events.filter(e => e.t === 'exit')); g4.events.length = 0; }
  assert.equal(exits.length, 1); assert.equal(exits[0].secret, false); assert.equal(g4.nextMapId(false), 'E1M2');
  const g5 = new D.Game({ map: 'E1M3' }); place(g5, 640, 832, 0); exits = [];
  for (let i = 0; i < 20; i++) { g5.tick({ use: i === 0 }); exits.push(...g5.events.filter(e => e.t === 'exit')); g5.events.length = 0; }
  assert.equal(exits.length, 1); assert.equal(exits[0].secret, true); assert.equal(g5.nextMapId(true), 'E1M9');
}

// ---- weapons and combat
{
  const g = new D.Game({ map: 'E1M1', skill: 2 }), p = g.player, mo = p.mo;
  g.mobjs.filter(m => m.flags & MF.COUNTKILL).forEach(m => g.remove(m)); tick(g, 1);
  place(g, 100, 60, 0); tick(g, 12);
  const z = spawnAt(g, 'zombie', 260, 60, 180);
  const ammo0 = p.ammo.bullets;
  tick(g, 105, { fire: true });
  assert.ok(z.health <= 0, 'pistol kills a zombieman');
  assert.ok(p.ammo.bullets < ammo0, 'pistol uses bullets');
  assert.equal(p.kills, 1);
  assert.ok(g.mobjs.some(m => m.type === 'clip' && (m.flags & MF.DROPPED)), 'zombie drops a clip');
  // shotgun pickup auto-switches and uses shells
  const sg = spawnAt(g, 'shotgun', 120, 60); tick(g, 3); assert.ok(p.weapons.shotgun); tick(g, 30); assert.equal(p.ready, 'shotgun');
  assert.equal(p.ammo.shells, 8, 'shotgun comes with 8 shells');
  const imp = spawnAt(g, 'imp', 230, 60, 180); tick(g, 150, { fire: true }); assert.ok(imp.health <= 0, 'shotgun kills an imp');
  // rocket splash hurts the shooter at point blank and barrels chain
  const g2 = new D.Game({ map: 'E1M1' }); g2.mobjs.filter(m => m.flags & MF.COUNTKILL).forEach(m => g2.remove(m)); tick(g2, 1);
  g2.cheat('idkfa'); g2.player.health = 100; place(g2, 400, 200, 0); tick(g2, 2, { weapon: 5 }); tick(g2, 40);
  assert.equal(g2.player.ready, 'rocket');
  const barrels = g2.mobjs.filter(m => m.type === 'barrel' && m.x > 430 && m.x < 470).length;
  tick(g2, 3, { fire: true }); tick(g2, 60);
  assert.ok(g2.mobjs.filter(m => m.type === 'barrel' && m.x > 430 && m.x < 470).length < barrels, 'rocket exploded the barrels');
  assert.ok(g2.player.health < 100, 'splash damage hurts the player');
  // armor absorbs damage
  const g3 = new D.Game({ map: 'E1M1' }); g3.player.armor = 100; g3.player.armortype = 1; g3.damage(g3.player.mo, null, null, 30);
  assert.equal(g3.player.health, 80); assert.equal(g3.player.armor, 90);
  g3.player.armortype = 2; g3.damage(g3.player.mo, null, null, 30); assert.equal(g3.player.health, 65); assert.equal(g3.player.armor, 75);
  // god mode and cheats
  assert.equal(g3.cheat('iddqd'), 'dqdon'); g3.damage(g3.player.mo, null, null, 500); assert.equal(g3.player.health, 100); g3.cheat('iddqd');
  assert.equal(g3.cheat('idkfa'), 'kfaadded'); assert.ok(g3.player.weapons.bfg && g3.player.keys.red && g3.player.ammo.cells === 600);
  assert.equal(g3.cheat('idclip'), 'ncon'); assert.equal(g3.cheat('idbeholdv'), 'beholdx'); assert.ok(g3.player.powers.invuln > 0);
  g3.cheat('idclev13'); assert.ok(g3.events.some(e => e.t === 'warp' && e.id === 'E1M3'));
  // player death and reborn with a pistol
  const g4 = new D.Game({ map: 'E1M1' }); g4.cheat('idkfa'); g4.damage(g4.player.mo, null, null, 1000);
  assert.ok(g4.player.dead); tick(g4, 30); g4.tick({ use: true }); assert.ok(g4.events.some(e => e.t === 'reborn')); g4.reborn();
  assert.ok(!g4.player.dead && g4.player.health === 100 && !g4.player.weapons.bfg && g4.player.ammo.bullets === 50);
}

// ---- monsters: see the player, chase, shoot; projectiles; infighting; nightmare respawn
{
  const g = new D.Game({ map: 'E1M1', skill: 3 }), p = g.player;
  g.mobjs.filter(m => m.flags & MF.COUNTKILL).forEach(m => g.remove(m)); tick(g, 1);
  place(g, 100, 60, 0);
  const imp = spawnAt(g, 'imp', 420, 60, 180);
  tick(g, 35 * 8);
  assert.ok(imp.state.label !== 'spawn', 'imp woke up');
  assert.ok(p.health < 100, 'imp attacked the player');
  // monsters open plain doors
  const g2 = new D.Game({ map: 'E1M1', skill: 2 }); g2.mobjs.filter(m => m.flags & MF.COUNTKILL).forEach(m => g2.remove(m)); tick(g2, 1);
  place(g2, 256, 560, 270); const z = spawnAt(g2, 'zombie', 256, 300, 90); z.target = g2.player.mo; g2.setState(z, 'see');
  const door = g2.L.sectors.find(s => s.door && s.bbox[1] === 384 && s.bbox[0] === 224);
  let opened = false; for (let i = 0; i < 35 * 10 && !opened; i++) { g2.tick({}); g2.events.length = 0; if (door.ceil > door.floor) opened = true; }
  assert.ok(opened, 'monster opened a door');
  // infighting: an imp fireball hitting a zombie makes it retarget the imp
  const g3 = new D.Game({ map: 'E1M1' }); g3.mobjs.filter(m => m.flags & MF.COUNTKILL).forEach(m => g3.remove(m)); tick(g3, 1);
  place(g3, 60, 350, 0); g3.player.notarget = true;
  const shooter = spawnAt(g3, 'imp', 250, 330, 0), victim = spawnAt(g3, 'zombie', 350, 330, 180); victim.health = 1000;
  g3.spawnMissile(shooter, victim, 'impball'); tick(g3, 20);
  assert.equal(victim.target, shooter, 'victim retaliates');
  // same species projectiles do no damage
  const g4 = new D.Game({ map: 'E1M1' }); const a = spawnAt(g4, 'baron', 300, 100), b = spawnAt(g4, 'baron', 400, 100); const hp = b.health;
  g4.spawnMissile(a, b, 'baronball'); tick(g4, 20); assert.equal(b.health, hp, 'no friendly fire between barons');
  // nightmare: fast monsters respawn
  const g5 = new D.Game({ map: 'E1M1', skill: 4 }); const zz = g5.mobjs.find(m => m.type === 'zombie'); g5.damage(zz, null, null, 100);
  tick(g5, 35 * 30); assert.ok(g5.mobjs.some(m => m.type === 'zombie' && m.health > 0 && m.spawnPoint && m.spawnPoint.x === zz.spawnPoint.x), 'nightmare respawn');
}

// ---- boss death ends the episode
{
  const g = new D.Game({ map: 'E1M5', skill: 2 }), cyber = g.mobjs.find(m => m.type === 'cyber');
  g.damage(cyber, null, g.player.mo, 5000); let exit = null;
  for (let i = 0; i < 35 * 6 && !exit; i++) { g.tick({}); exit = g.events.find(e => e.t === 'exit'); g.events.length = 0; }
  assert.ok(exit, 'killing the Cyberdemon exits'); assert.equal(g.nextMapId(false), null, 'final map');
}

// ---- save / load roundtrip keeps the world
{
  const g = new D.Game({ map: 'E1M2', skill: 3, seed: 5 });
  tick(g, 200, i => ({ forward: i % 50 < 30 ? 50 : 0, turn: 0.02, fire: i % 7 === 0 }));
  g.player.keys.red = true; g.player.ammo.shells = 17;
  const data = JSON.parse(JSON.stringify(g.serialize()));
  const h = D.Game.deserialize(data);
  assert.equal(h.mapId, 'E1M2'); assert.equal(h.skill, 3); assert.equal(h.leveltime, g.leveltime);
  assert.equal(h.player.health, g.player.health); assert.equal(h.player.ammo.shells, 17); assert.ok(h.player.keys.red);
  assert.equal(h.mobjs.length, g.mobjs.length);
  assert.ok(Math.abs(h.player.mo.x - g.player.mo.x) < 1e-6);
  const livingA = g.mobjs.filter(m => m.health > 0 && (m.flags & MF.COUNTKILL)).length, livingB = h.mobjs.filter(m => m.health > 0 && (m.flags & MF.COUNTKILL)).length;
  assert.equal(livingA, livingB);
  // both continue identically
  tick(g, 100, { forward: 25, fire: true }); tick(h, 100, { forward: 25, fire: true });
  assert.ok(Math.abs(h.player.mo.x - g.player.mo.x) < 1e-6 && h.player.health === g.player.health, 'deterministic after load');
  // inventory carries to the next level, keys do not
  g.player.health = g.player.mo.health = 100; g.player.dead = false; g.player.weapons.shotgun = true; g.startMap('E1M3');
  assert.ok(g.player.weapons.shotgun && !g.player.keys.red && g.mapId === 'E1M3');
}

// ---- soak: every map on every skill runs 40 simulated seconds of chaotic play without errors
for (const m of D.MAPS) for (const skill of [0, 2, 4]) {
  const g = new D.Game({ map: m.id, skill, seed: 42 + skill });
  g.cheat('idkfa');
  tick(g, 35 * 40, i => ({ forward: (i % 200) < 150 ? 50 : -25, side: (i % 70) < 35 ? 24 : -24, turn: ((i % 300) < 150 ? 0.03 : -0.02), fire: (i % 20) < 12, use: (i % 40) === 0, weapon: i % 350 === 0 ? 1 + ((i / 350) % 7) : 0 }));
  for (const mo of g.mobjs) { assert.ok(Number.isFinite(mo.x) && Number.isFinite(mo.y) && Number.isFinite(mo.z), `${m.id} finite positions`); }
  const pm = g.player.mo; assert.ok(D.pointInSectorExact(g.L, D.pointSector(g.L, pm.x, pm.y), pm.x, pm.y), `${m.id} player stays inside the map`);
}

console.log('doom tests passed');
