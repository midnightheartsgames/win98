const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const eq = (a, b, m) => { assert.equal(a, b, m); checks++; };
const near = (a, b, d, m) => ok(Math.abs(a - b) <= d, m + ': ' + a + ' vs ' + b);
const t0 = Date.now();

const HSR_FIRST = ['js/apps/hsr98/hsr-core.js', 'js/apps/hsr98/hsr-data.js', 'js/apps/hsr98/hsr-midi.js', 'js/apps/hsr98/hsr-audio.js'];
const SIM = ['ho-core', 'ho-data', 'ho-hero', 'ho-items', 'ho-quests', 'ho-quests-city', 'ho-zones', 'ho-zones-start', 'ho-zones-city', 'ho-zones-seclusion', 'ho-zones-incubator', 'ho-zones-echo', 'ho-quests-seclusion', 'ho-nav', 'ho-sim', 'ho-combat', 'ho-world', 'ho-trials', 'ho-party', 'ho-simver'];
const VIEW = ['ho-settings', 'ho-sound', 'ho-models', 'ho-gl', 'ho-ui', 'ho-ui-front', 'ho-ui-windows'];
const PAGE = [...HSR_FIRST, 'js/apps/hsro/ho-core.js', 'js/apps/hsr98/hsr-hd-math.js', ...['ho-data', 'ho-hero', 'ho-items', 'ho-quests', 'ho-quests-city', 'ho-zones', 'ho-zones-start', 'ho-zones-city', 'ho-zones-seclusion', 'ho-zones-incubator', 'ho-zones-echo', 'ho-quests-seclusion', 'ho-nav', 'ho-sim', 'ho-combat', 'ho-world', 'ho-trials', 'ho-party', 'ho-simver', ...VIEW].map(f => 'js/apps/hsro/' + f + '.js')];
const OWN = [...[...SIM, ...VIEW].map(f => 'js/apps/hsro/' + f + '.js'), 'js/apps/hsro-app.js', 'css/apps/hsro.css', 'hsro.html', 'tests/hsro.test.js', 'tools/hsro-simver.cjs', 'tools/hsro-art.cjs'];
const PY = ['tools/hsro-export.py', 'tools/hsro-models.py', 'tools/hsro-art-lib.py', 'tools/hsro-heroes.py', 'tools/hsro-foes.py', 'tools/hsro-station.py', 'tools/hsro-npcs.py', 'tools/hsro-swarm.py', 'tools/hsro-fx.py'];

for (const f of PAGE.filter(f => !VIEW.some(v => f.endsWith('/' + v + '.js')) || f.endsWith('/ho-models.js') || f.endsWith('/ho-sound.js') || f.endsWith('/ho-settings.js'))) require(path.join(ROOT, f));
const HO = globalThis.HO;
const H = globalThis.Hsr98;
const T = HO.TUN;
const C = HO.CMB;

{
  const html = read('hsro.html');
  let last = -1;
  for (const f of PAGE) {
    const i = html.indexOf('src="' + f + '"');
    ok(i > last, 'hsro.html loads ' + f + ' in order');
    last = i;
  }
  ok(html.includes('css/apps/hsro.css'), 'hsro.html links css');
  for (const f of OWN) {
    const src = read(f);
    ok(!/\/\*/.test(src.replace(/'[^'\n]*'/g, "''")), 'no block comments in ' + f);
    ok(!/^\s*\/\/(?!\s*#)/m.test(src) && !/[;{})]\s+\/\/\s/.test(src), 'no line comments in ' + f);
    ok(!src.includes('<' + '!--'), 'no html comments in ' + f);
  }
  const game = [...SIM, ...VIEW].map(f => read('js/apps/hsro/' + f + '.js')).join('\n') + read('hsro.html');
  ok(!/Microsoft|Windows(?! NT)/.test(game.replace(/Microsoft Sans Serif/g, '')), 'no real brand names in game text');
  ok(!game.includes('—'), 'no long dashes in game strings');
}

{
  const banned = [/Math\.random/, /Date\.now/, /new Date/, /performance/, /Math\.(sin|cos|tan|atan2?|asin|acos|hypot|exp|log|pow)\b/, /\bdocument\b/, /\bwindow\b/, /requestAnimationFrame/, /\.player\b/];
  for (const f of ['ho-core', 'ho-data', 'ho-hero', 'ho-items', 'ho-quests', 'ho-quests-city', 'ho-zones', 'ho-zones-start', 'ho-zones-city', 'ho-zones-seclusion', 'ho-zones-incubator', 'ho-zones-echo', 'ho-quests-seclusion', 'ho-nav', 'ho-sim', 'ho-combat', 'ho-world', 'ho-trials', 'ho-party']) {
    const src = read('js/apps/hsro/' + f + '.js');
    for (const re of banned) ok(!re.test(src), f + ' avoids ' + re);
  }
}

{
  const sim = require(path.join(ROOT, 'tools/hsro-simver.cjs'));
  eq(HO.SIM, sim.simHash(ROOT), 'HO.SIM is fresh (run node tools/hsro-simver.cjs)');
  eq(read(sim.OUT), sim.moduleText(HO.SIM), 'ho-simver.js has the generated form');
}

{
  ok(typeof H.HD.N.sin === 'function' && typeof H.makeRandom === 'function', 'HSR 98 modules load on their own');
  eq(HO.PATHS.destruction.name, H.PATHS.destruction.name, 'Path names come from HSR 98');
  eq(HO.PATHS.destruction.threat, 1.25, 'Destruction threat from H.PATHS aggro');
  eq(HO.PATHS.erudition.threat, 0.75, 'Erudition threat from H.PATHS aggro');
  eq(HO.PATHS.abundance.threat, 1, 'Abundance threat from H.PATHS aggro');
  for (const id of HO.PATH_IDS) for (const e of HO.PATHS[id].elems) ok(H.ELEMENTS[e], id + ' element ' + e + ' exists');
  eq(HO.XP_TO_NEXT.reduce((a, b) => a + b, 0), 27600, 'XP to level 10');
  eq(HO.MAX_LEVEL, 10, 'level cap');
  eq(HO.xpForKill(5), 70, 'kill XP formula');
}

const fresh = (seed, info) => { const w = new HO.World({ seed: seed || 1, foes: false }); const a = w.addHero(0, info || {}); return [w, a]; };
const go = (w, f, s, r) => w.cmd({ seat: 0, t: 'move', f, s, r });

{
  const [w, a] = fresh();
  const z0 = a.z;
  go(w, 1, 0, 0); w.run(T.hz);
  near(z0 - a.z, T.run, 1e-6, 'one second forward covers run speed');
  w.run(T.hz * 4);
  near(a.z, -15 + T.radius, 1e-3, 'wall stops the hero');
  go(w, -1, 0, 0); w.run(T.hz);
  near(a.z - (-15 + T.radius), T.back, 1e-3, 'backwards is slower');
  go(w, 0, 1, 0); const x0 = a.x; w.run(T.hz);
  near(a.x - x0, T.run, 1e-3, 'strafe right moves along +x at yaw 0');
  go(w, 0, 0, 1); w.run(10);
  near(a.yaw, T.turn * 0.5, 1e-9, 'turn rate');
  go(w, 0, 0, 0);
  ok(!w.cmd({ seat: 0, t: 'warp', x: 0 }), 'unknown command rejected');
  ok(!w.cmd({ seat: 9, t: 'jump' }), 'seat out of range rejected');
  ok(!w.cmd({ seat: 0, t: 'face', yaw: NaN }), 'bad number rejected');
  ok(w.cmd({ seat: 0, t: 'move', f: 5, s: -3, r: 'x' }) && w.queue[w.queue.length - 1].f === 1 && w.queue[w.queue.length - 1].r === 0, 'move values clamped');
}

{
  const [w, a] = fresh();
  a.x = 6; a.z = -4; a.yaw = HO.PI / 2;
  go(w, 1, 0, 0); w.run(T.hz * 1.6);
  near(a.y, 1.5, 1e-9, 'stairs lead up to the block');
  ok(a.ground, 'standing on the block');
  a.x = 18; a.yaw = 3 * HO.PI / 2; a.z = -4; w.run(T.hz * 3);
  near(a.y, 0, 1e-9, 'walked down the stairs');
}

{
  const [w, a] = fresh();
  a.x = -12; a.z = -1; a.yaw = 3 * HO.PI / 2;
  go(w, 1, 0, 0); w.run(T.hz);
  near(a.x, -14 + T.radius, 1e-3, 'a 1 m crate blocks walking');
  w.cmd({ seat: 0, t: 'jump' }); w.step();
  ok(!a.ground && w.events.some(e => e.k === 'jump'), 'jump leaves the ground');
  let peak = 0;
  for (let i = 0; i < T.hz && !a.ground; i++) { w.step(); peak = Math.max(peak, a.y); }
  ok(peak > 1.1 && peak < 1.4, 'jump peak about 1.2 m: ' + peak);
  ok(a.x < -14, 'jump carries over the crate');
  const [w2, b] = fresh();
  b.x = -12; b.z = 3; b.yaw = 3 * HO.PI / 2;
  go(w2, 1, 0, 0); w2.cmd({ seat: 0, t: 'jump' }); w2.run(T.hz * 2);
  ok(b.x > -14, 'a 2.2 m crate is too high to jump on');
}

{
  const [w, a] = fresh();
  a.y = 4; a.ground = false;
  w.run(T.hz * 2);
  ok(a.ground && a.y === 0, 'falls to the floor');
  a.x = 200; a.y = 0; a.ground = true;
  w.run(T.hz * 3);
  ok(w.events.some(e => e.k === 'respawn') || (a.z === w.zone.spawn.z && a.x === w.zone.spawn.x), 'falling into the void respawns');
  eq(a.x, w.zone.spawn.x, 'respawned at the spawn point');
}

{
  const [w, a] = fresh();
  w.cmd({ seat: 0, t: 'autorun', on: true }); w.run(10);
  ok(a.auto && a.z < HO.ZONES.greybox.spawn.z, 'autorun runs forward');
  go(w, -1, 0, 0); w.step();
  ok(!a.auto, 'moving cancels autorun');
}


{
  const memory = read('js/apps/hsr98/hsr-memory.js') + '\n' + read('js/apps/hsr98/hsr-seclusion.js');
  for (const id of HO.FOE_IDS) {
    const f = HO.FOES[id];
    const src = H.ENEMIES[f.base || id];
    if (f.fresh) {
      ok(f.name && f.weak.length >= 2 && f.skills.length && f.elite, id + ' is a new elite from the plan with weaknesses and skills');
    } else if (f.base) {
      const bf = HO.FOES[f.base];
      ok(f.name === bf.name && JSON.stringify(f.weak) === JSON.stringify(bf.weak) && JSON.stringify(f.col) === JSON.stringify(bf.col) && f.skills.every(k => bf.skills.some(x => x.n === k.n && x.e === k.e)), id + ' is an elite version of ' + f.base);
    } else if (src) {
      eq(f.name, src.name, id + ' name matches HSR 98');
      eq(JSON.stringify(f.weak), JSON.stringify(src.weak), id + ' weaknesses match HSR 98');
      eq(f.tough, src.tough, id + ' toughness matches HSR 98');
      eq(f.hp, src.hp, id + ' hp matches HSR 98');
      eq(f.atk, src.atk, id + ' atk matches HSR 98');
      eq(JSON.stringify(f.col), JSON.stringify(src.col), id + ' colours match HSR 98');
      eq(!!f.elite, !!(src.elite || src.boss), id + ' elite flag matches HSR 98');
      eq(!!f.boss, !!src.boss, id + ' boss flag matches HSR 98');
      ok(f.skills.every(k => src.skills.some(x => x.n === k.n && x.e === k.e)), id + ' skills come from HSR 98');
    } else {
      const line = memory.split('\n').find(l => l.trim().startsWith(id + ': E({'));
      ok(line, id + ' found in hsr-memory.js');
      ok(line.includes("name: '" + f.name + "'"), id + ' name matches hsr-memory.js');
      ok(line.includes('weak: ' + JSON.stringify(f.weak).replace(/"/g, "'").replace(/,/g, ', ')), id + ' weaknesses match hsr-memory.js');
      ok(f.tough === 20 ? !/tough:/.test(line) : line.includes('tough: ' + f.tough), id + ' toughness matches hsr-memory.js');
      ok(f.hp === 1 ? !/ hp:/.test(line) : line.includes('hp: ' + f.hp), id + ' hp matches the HSR 98 record');
      const colSrc = (line.match(/col: (\[[^\]]*\])/) || [])[1] || '';
      ok(JSON.stringify(f.col) === colSrc.replace(/'/g, '"').replace(/, /g, ','), id + ' colours match the HSR 98 record');
    }
    ok(HO.FOE_RT[id] && HO.FOE_RT[id].range > 0 && HO.FOE_RT[id].swing > 0, id + ' has real-time numbers');
  }
  for (const f of HO.ZONES.greybox.foes) ok(HO.FOES[f.id], 'grey room foe ' + f.id + ' exists');
  const KINDS = new Set(['dmg', 'aoe', 'dot', 'hot', 'heal', 'buff', 'debuff', 'stun', 'root', 'poly', 'taunt', 'nextSwing', 'dash', 'gain', 'threat', 'cleanse', 'revive', 'conjure']);
  const fxOk = list => list.every(f => KINDS.has(f.k) && fxOk(f.then || []));
  for (const id of HO.ABILITY_IDS) {
    const ab = HO.ABILITIES[id];
    ok(HO.PATHS[ab.path] && ab.lvl >= 1 && ab.lvl <= 10 && ab.name && ab.text, id + ' is complete');
    ok(fxOk(ab.fx), id + ' uses known effects');
    ok(!ab.text.includes('—'), id + ' text has no long dash');
  }
  for (const p of HO.PATH_IDS) {
    const mine = HO.ABILITY_IDS.filter(id => HO.ABILITIES[id].path === p).map(id => HO.ABILITIES[id]);
    eq(mine.filter(a => a.ult).length, 1, p + ' has one Ultimate');
    ok(mine.find(a => a.ult).lvl === 10, p + ' Ultimate at level 10');
    eq(mine.filter(a => a.auto).length, 1, p + ' has one basic attack');
    ok(mine.some(a => a.ooc && a.lvl === 2), p + ' has a Technique at level 2');
    ok(HO.BAR[p].every(id => HO.ABILITIES[id] && HO.ABILITIES[id].path === p), p + ' bar holds its own abilities');
    ok(HO.BAR[p].length <= 11, p + ' bar fits with the racial');
    ok(mine.filter(a => a.lvl === 1 && !a.auto).some(a => a.fx.some(f => f.k === 'dmg' || f.k === 'nextSwing')), p + ' can deal damage at level 1');
  }
}

const arena = (path, lvl, foe, at) => {
  const w = new HO.World({ seed: 11, level: lvl, foes: false });
  const a = w.addHero(0, { path, level: lvl });
  a.x = 0; a.z = 8; a.yaw = 0;
  const f = foe ? w.addFoe(foe, at || { x: 0, z: 5 }, lvl) : null;
  return [w, a, f];
};
const cast = (w, ab, uid) => w.cmd({ seat: 0, t: 'cast', ab, uid: uid || 0 });
const denied = (w, why) => w.events.some(e => e.k === 'deny' && e.why === why);

{
  const [w, a, f] = arena('erudition', 4, 'baryon', { x: 0, z: -4 });
  cast(w, 'e_fire', f.uid); w.run(T.hz * 2 + 2);
  eq(f.tough, f.toughMax, 'fire does not touch the toughness of a foe without fire weakness');
  ok(f.hp < w.stat(f, 'maxHp'), 'fire still deals damage');
  w.run(T.hz);
  cast(w, 'e_ice', f.uid); w.run(T.hz * 2 + 2);
  ok(f.tough < f.toughMax, 'ice weakness removes toughness');
  cast(w, 'e_fire', f.uid); w.step();
  ok(denied(w, 'gcd') || a.cast, 'casting again inside the global cooldown waits');
}

{
  const [w, a, f] = arena('erudition', 4, 'baryon', { x: 0, z: -6 });
  const before = a.res;
  cast(w, 'e_fire', f.uid); w.step();
  ok(a.cast && a.res < before, 'cast started and paid');
  w.cmd({ seat: 0, t: 'move', f: 1, s: 0, r: 0 }); w.step();
  ok(!a.cast && Math.abs(a.res - before) < 1e-9, 'moving interrupts the cast and refunds it');
  ok(w.events.some(e => e.k === 'castStop' && e.why === 'move'), 'interrupt is reported');
}

{
  const [w, a, f] = arena('erudition', 10, 'trampler', { x: 0, z: 5 });
  w.aggro(f, a); f.prepAt = 0; w.run(3);
  ok(f.prep, 'elite starts a preparation');
  const name = f.prep.skill;
  ok(HO.FOES.trampler.skills.some(k => k.n === name), 'preparation is a skill of the foe');
  w.events = [];
  f.tough = 4;
  w.damage(a, f, 0.1, { elems: ['ice'], tough: 5, sure: true });
  ok(!f.prep && f.tough === 0, 'break cancels the preparation');
  ok(w.events.some(e => e.k === 'prepCancel') && w.events.some(e => e.k === 'break' && e.prep), 'cancel and break are reported');
  ok(w.hasAura(f, 'freeze'), 'ice break freezes');
  w.run(T.hz * C.brokenFor + 2);
  eq(f.tough, f.toughMax, 'toughness comes back after the break window');
  const [w2, b, g] = arena('destruction', 10, 'trampler', { x: 0, z: 5 });
  w2.aggro(g, b); g.prepAt = 0; g.prepNext = 1; w2.step();
  ok(g.prep && g.prep.kind === 'around', 'trampler also prepares a stomp around itself');
  b.z = 14.5; const hp = b.hp;
  w2.run(T.hz * 4);
  ok(w2.events.some(e => e.k === 'prepHit') || b.hp === hp, 'leaving the circle avoids the stomp');
}

{
  const w = new HO.World({ seed: 3, level: 5, foes: false });
  const tank = w.addHero(0, { path: 'destruction', level: 5 }), mage = w.addHero(1, { path: 'erudition', level: 5 });
  const f = w.addFoe('reaver', { x: 0, z: 0 }, 5);
  tank.x = 0; tank.z = 2; mage.x = 0; mage.z = 20;
  w.addThreat(f, tank, 100);
  eq(f.threat[tank.uid], 100, 'first threat pulls the foe and counts in full');
  eq(f.state, 'fight', 'threat pulls an idle foe');
  w.addThreat(f, mage, 120);
  w.step();
  eq(w.pickAim(f), tank, 'a ranged hero needs more than 130% to pull');
  w.addThreat(f, mage, 20);
  eq(w.pickAim(f), mage, 'over 130% the foe turns to the ranged hero');
  f.aim = mage.uid;
  mage.z = 1.5;
  w.taunt(f, tank, 3);
  eq(w.pickAim(f), tank, 'taunt pulls the foe back');
  ok(f.threat[tank.uid] > f.threat[mage.uid], 'taunt puts the taunter on top');
  const d0 = f.threat[tank.uid];
  w.damage(tank, f, 1, { sure: true, elems: ['phys'] });
  const ev = w.events.filter(e => e.k === 'dmg').pop();
  ok(Math.abs(f.threat[tank.uid] - d0 - ev.v * 1.25) < 1e-9, 'Destruction makes 125% threat from damage');
  const healer = w.addHero(2, { path: 'abundance', level: 5 });
  healer.x = 0; healer.z = 10;
  tank.hp = 10;
  w.events = [];
  w.heal(healer, tank, 40);
  const real = w.events.find(e => e.k === 'heal').v;
  ok(Math.abs(f.threat[healer.uid] - real * C.healThreat) < 1e-9, 'healing makes half threat');
}

{
  const [w, a, f] = arena('destruction', 5, 'reaver', { x: 0, z: -10 });
  cast(w, 'd_charge', f.uid); w.step();
  ok(a.dash && f.state === 'fight', 'Charge dashes and pulls');
  w.run(T.hz);
  ok(Math.hypot(a.x - f.x, a.z - f.z) < 4, 'Charge reaches the foe');
  cast(w, 'd_charge', f.uid); w.step();
  ok(denied(w, 'ooc') || denied(w, 'cd'), 'Technique only works out of combat');
  cast(w, 'd_ult', f.uid); w.step();
  ok(denied(w, 'level'), 'Ultimate needs level 10');
}

{
  const [w, a, f] = arena('erudition', 10, 'trampler', { x: 0, z: 0 });
  cast(w, 'e_stop', f.uid); w.step();
  ok(denied(w, 'elite'), 'Freeze frame does not work on elites');
  a.energy = 10;
  cast(w, 'e_ult'); w.step();
  ok(denied(w, 'energy'), 'Ultimate needs full Energy');
  a.energy = 100;
  w.run(T.hz * 2);
  cast(w, 'e_ult'); w.step();
  ok(a.energy < 100 && f.hp < w.stat(f, 'maxHp'), 'Ultimate spends Energy and hits');
}

function duel(path, lvl, foe) {
  const [w, a, f] = arena(path, lvl, foe, { x: 0, z: -14 });
  const rot = {
    destruction: ['d_charge', 'd_attack', 'd_rend', 'd_clap', 'd_sunder', 'd_mighty', 'd_ult'],
    abundance: ['a_attack', 'a_wither', 'a_smite', 'a_ult'],
    erudition: ['e_prep', 'e_attack', 'e_ring', 'e_ice', 'e_fire', 'e_cascade', 'e_ult']
  }[path];
  w.cmd({ seat: 0, t: 'target', uid: f.uid });
  let t = 0;
  for (; t < T.hz * 120 && !f.dead && !a.dead; t++) {
    const d = Math.hypot(a.x - f.x, a.z - f.z);
    w.face(a, f);
    if (path === 'destruction') w.cmd({ seat: 0, t: 'move', f: d > 3 && !a.dash ? 1 : 0, s: 0, r: 0 });
    if (!a.cast && t % 2 === 0) {
      const low = a.hp / w.stat(a, 'maxHp') < 0.45;
      const list = path === 'abundance' && low ? ['a_ult', 'a_sprout', 'a_heal'] : rot;
      for (const id of list) if (HO.ABILITIES[id].lvl <= lvl) cast(w, id, HO.ABILITIES[id].target === 'ally' ? a.uid : f.uid);
    }
    w.step();
  }
  return { sec: t / T.hz, won: f.dead && !a.dead, hp: a.hp / w.stat(a, 'maxHp') };
}

{
  for (const p of HO.PATH_IDS) for (const lvl of [1, 5, 10]) for (const foe of ['baryon', 'reaver']) {
    const r = duel(p, lvl, foe);
    ok(r.won, p + ' ' + lvl + ' beats ' + foe + ' alone: ' + JSON.stringify(r));
    ok(r.sec >= 5 && r.sec <= 50, p + ' ' + lvl + ' vs ' + foe + ' takes 5 to 50 s: ' + r.sec);
  }
  const r = duel('erudition', 1, 'trampler');
  ok(!r.won, 'a level 1 hero alone does not beat the elite');
}

{
  const [w, a, f] = arena('erudition', 1, 'reaver', { x: 0, z: 4 });
  w.aggro(f, a);
  for (let i = 0; i < T.hz * 60 && !a.dead; i++) w.step();
  ok(a.dead, 'hero can fall');
  ok(f.state === 'evade' || f.state === 'idle', 'foe leaves after the hero falls');
  w.run(T.hz * 6);
  eq(f.hp, w.stat(f, 'maxHp'), 'foe resets to full health at home');
  cast(w, 'e_fire', f.uid); w.step();
  ok(denied(w, 'dead'), 'the fallen cannot cast');
  const corpseAt = { x: a.corpse.x, z: a.corpse.z };
  w.cmd({ seat: 0, t: 'release' }); w.step();
  ok(!a.dead && a.ghost && a.hp === 1, 'release turns the hero into a Projection');
  w.cmd({ seat: 0, t: 'cast', ab: 'e_fire', uid: f.uid }); w.step();
  ok(denied(w, 'ghost'), 'a Projection cannot cast');
  w.cmd({ seat: 0, t: 'revive' }); w.step();
  ok(a.ghost ? denied(w, 'corpse') || Math.hypot(a.x - corpseAt.x, a.z - corpseAt.z) <= C.reviveRange : true, 'reviving needs the body nearby');
  a.x = corpseAt.x + 1; a.z = corpseAt.z;
  w.cmd({ seat: 0, t: 'revive' }); w.step();
  ok(!a.ghost && Math.abs(a.hp / w.stat(a, 'maxHp') - C.releaseHp) < 0.01, 'the Projection returns to the body at half health');
  f.hp = 1; w.damage(a, f, 5, { sure: true, elems: ['fire'] });
  ok(f.dead, 'foe can fall');
  w.run(C.respawn * T.hz + 2);
  ok(!f.dead && f.hp === w.stat(f, 'maxHp'), 'foe respawns at home');
}

{
  const [w, a, f] = arena('destruction', 5, 'baryon', { x: 0, z: -30 });
  a.z = 50; w.aggro(f, a);
  for (let i = 0; i < T.hz * 20 && f.state === 'fight'; i++) w.step();
  eq(f.state === 'fight', false, 'chasing past the leash makes the foe give up');
}

{
  for (const f of PY) {
    const src = read(f);
    ok(!/^\s*#/m.test(src) && !/\s#\s/.test(src.replace(/'[^'\n]*'/g, "''")), 'no comments in ' + f);
    ok(!src.includes('"'.repeat(3)), 'no docstrings in ' + f);
  }
  const art = require(path.join(ROOT, 'tools/hsro-art.cjs'));
  const r = art.check(ROOT);
  eq(r.errors.join('; '), '', 'art check passes');
  const ids = [...Object.values(HO.MODEL_IDS.heroes), ...HO.MODEL_IDS.parts, ...Object.values(HO.MODEL_IDS.foes), ...HO.MODEL_IDS.kit];
  for (const id of ids) ok(r.models[id], 'model ' + id + ' is exported');
  const heroBones = r.models.hero_human_f.bones.join();
  for (const id of [...Object.values(HO.MODEL_IDS.heroes), ...HO.MODEL_IDS.parts, ...HO.MODEL_IDS.extras, 'npc_coat_f', 'npc_coat_m']) eq(r.models[id].bones.join(), heroBones, id + ' shares the hero skeleton, so it moves with the body pose');
  for (const id of Object.values(HO.MODEL_IDS.heroes)) {
    const m = r.models[id];
    ok(m.look && m.look.skin.length >= 2 && m.look.face && m.look.cells.length >= HO.LOOK.faces && fs.existsSync(path.join(ROOT, 'content/hsro', m.look.faces)), id + ' tells the game where skin and face go, with a face for every look');
    ok(m.tris >= 900 && m.tris <= 1800, id + ' body has 900 to 1800 triangles: ' + m.tris);
  }
  for (const [id, d] of Object.entries(HO.FOES)) {
    const mid = HO.MODEL_IDS.foes[d.shape], m = mid && r.models[mid];
    ok(m && ['idle', 'run', 'attack', 'death'].every(c => m.clips[c]) && !m.clips.death.loop, d.name + ' (' + id + ') has a model with idle, run, attack and a death that stays down');
    const prefix = d.boss ? 'boss_' : d.elite ? 'elite_' : 'foe_';
    if (d.base) ok(m && (HO.FOE_SCALE[id] || 1) > 1, d.name + ' (' + id + ') shares the model of ' + d.base + ' and is drawn bigger');
    else ok(m && mid.startsWith(prefix), d.name + ' (' + id + ') model uses the ' + prefix + ' limits');
  }
  ok(r.models.boss_doomsday.clips.idle2 && HO.FOE_RT.doomsday.phase, 'the Doomsday Beast stands up in its second phase');
  const fx = JSON.parse(read('content/hsro/fx.json'));
  ok(fs.existsSync(path.join(ROOT, 'content/hsro', fx.sheet)), 'the effect sprite sheet is exported');
  for (const c of [...HO.FX_ELEMS, 'glow', 'ring', 'disc', 'shards', 'sparkle', 'beam', 'vortex', 'field']) ok(fx.cells[c], 'effect sprite ' + c + ' is on the sheet');
  for (const el of Object.keys(H.ELEMENTS)) eq(HO.fxCell(el), el, 'element ' + el + ' has its own effect sprite');
  eq(HO.fxCell('nothing'), 'glow', 'an unknown effect falls back to a soft glow');
  const surf = JSON.parse(read('content/hsro/surfaces.json'));
  ok(fs.existsSync(path.join(ROOT, 'content/hsro', surf.sheet)), 'the station surface sheet is exported');
  const mats = new Set(Object.values(HO.SURFACES).flatMap(sp => [sp.top[0], sp.side[0], sp.long].filter(Boolean)));
  for (const m of mats) ok(surf.cells[m] && surf.cells[m][2] === surf.cells[m][3] && (surf.cells[m][2] & (surf.cells[m][2] - 1)) === 0, 'surface ' + m + ' has a square power-of-two cell, so it can repeat');
  const looks = new Set(), kinds = new Set();
  let windows = 0, faces = 0;
  for (const z of Object.values(HO.ZONES)) {
    for (const b of z.boxes || []) {
      kinds.add(b[6]);
      if (b[6] === 'hidden' || b[6] === 'gate') continue;
      for (const f of HO.surfaceFaces(b)) {
        faces++;
        if (f.mat === 'window') windows++;
        if (!f.uv.every(q => Number.isFinite(q[0]) && Number.isFinite(q[1]))) { ok(false, 'box ' + b.join(',') + ' has a broken texture mapping'); break; }
      }
    }
    for (const o of [...(z.objects || []), ...(z.npcs || [])]) if (typeof o.look === 'string') looks.add(o.look);
  }
  for (const k of kinds) ok(k === 'hidden' || k === 'gate' || HO.SURFACES[k], 'zone box kind ' + k + ' has a station surface');
  ok(faces > 2000 && windows > 40, 'zones get textured faces and long walls get windows: ' + faces + ' faces, ' + windows + ' windows');
  for (const lk of looks) ok(r.models[HO.MODEL_IDS.props[lk] || HO.MODEL_IDS.npcs[lk]], 'object look ' + lk + ' has a model');
  for (const id of ['npc_peppy', 'npc_robot', 'npc_creature']) ok(r.models[id] && r.models[id].clips.idle && r.models[id].clips.run, id + ' idles and can follow');
  for (const id of ['npc_coat_f', 'npc_coat_m']) ok(r.models[id].look && r.models[id].look.coat.length && r.models[id].clips.run && r.models[id].clips.cast, id + ' takes its coat colour from the look and moves like a companion');
  const people = [];
  for (const z of Object.values(HO.ZONES)) for (const n of z.npcs || []) if (n.look && n.look.type === 'person') people.push([n.id, n.look]);
  for (const [id, c] of Object.entries(HO.COMPANIONS)) people.push([id, c.look]);
  for (const t of Object.values(HO.TRIALS)) if (t.wardLook) people.push(['ward_0', t.wardLook]);
  for (const [id, look] of people) {
    const n = HO.npcParts(id, look);
    ok(r.models[n.model] && n.parts.every(p => r.models[p.model]), 'NPC ' + id + ' is built only from exported models');
  }
  for (const id of Object.keys(HO.NPC_LOOKS)) ok(people.some(p => p[0] === id), 'NPC look ' + id + ' belongs to a real NPC or companion');
  ok(HO.npcParts('herta_puppet', HO.COMPANIONS.herta.look).scale < 1 && HO.npcParts('captain', { race: 'foxian', hair: '#d8b070' }).parts.length === 3, 'the Herta puppet is smaller and the Foxian captain has ears and a tail');
  for (const race of HO.RACE_IDS) for (const sex of ['f', 'm']) for (const p of HO.PATH_IDS) for (let i = 0; i < 8; i++) {
    const look = { face: i % HO.LOOK.faces, hair: i, hairColor: i, skin: i % 4, ears: i % 3, tail: (i + 1) % 3 };
    const parts = HO.heroParts(race, p, look, 2 + (i % 3));
    if (!parts.every(x => r.models[x.model])) { ok(false, race + sex + p + i + ' look uses a missing part'); break; }
    ok(HO.MODEL_IDS.heroes[race + '_' + sex] && parts.length === (race === 'foxian' ? 4 : 2), race + ' ' + sex + ' ' + p + ' look ' + i + ' has a body, hair' + (race === 'foxian' ? ', ears, tail' : '') + ' and a weapon');
  }
  for (const d of HO.ZONES.greybox.decor) ok(HO.MODEL_IDS.kit.includes(d.model), 'decor uses kit model ' + d.model);
  const hero = art.readModel(ROOT, 'hero_human_f');
  ok(read('.gitignore').split('\n').every(l => l.trim() !== 'mesh'), 'mesh folder is not ignored by git');
  const model = { bones: hero.meta.bones.length, fps: hero.meta.fps, clips: {} };
  for (const [name, c] of Object.entries(hero.meta.clips)) model.clips[name] = { frames: c.frames, loop: c.loop, data: hero.arr(c.view) };
  for (const name of HO.CLIP_NAMES) ok(model.clips[name], 'hero has clip ' + name);
  const unit = p => { for (let i = 0; i < p.length; i += 8) if (Math.abs(Math.hypot(p[i], p[i + 1], p[i + 2], p[i + 3]) - 1) > 1e-4) return false; return true; };
  const diff = (p, q) => { let d = 0; for (let i = 0; i < p.length; i++) d += Math.abs(p[i] - q[i]); return d; };
  const idle = HO.samplePose(model, 'idle', 0), run0 = HO.samplePose(model, 'run', 0.1), run1 = HO.samplePose(model, 'run', 0.35);
  ok(unit(idle) && unit(run0) && unit(run1), 'sampled poses keep unit quaternions');
  ok(diff(run0, run1) > 1, 'run animates');
  ok(diff(idle, run0) > 1, 'run differs from idle');
  const root = hero.meta.bones.indexOf('root');
  const dead = HO.samplePose(model, 'death', 5);
  const skinY = (p, b, v) => {
    const q = p.slice(b * 8, b * 8 + 4), t = p.slice(b * 8 + 4, b * 8 + 7);
    const cx = q[1] * v[2] - q[2] * v[1] + q[3] * v[0], cy = q[2] * v[0] - q[0] * v[2] + q[3] * v[1], cz = q[0] * v[1] - q[1] * v[0] + q[3] * v[2];
    return v[1] + 2 * (q[2] * cx - q[0] * cz) + t[1];
  };
  const headBone = hero.meta.bones.indexOf('head');
  ok(skinY(idle, headBone, [0, 1.64, 0]) > 1.5, 'idle head stays at head height');
  ok(skinY(dead, headBone, [0, 1.64, 0]) < 0.5 && skinY(dead, root, [0, 0.95, 0]) < 0.6, 'death lays the body on the floor and holds the last frame');
  near(HO.samplePose(model, 'run', 0)[0], HO.samplePose(model, 'run', model.clips.run.frames / model.fps)[0], 1e-6, 'run loops');
  ok(unit(HO.blendPose(idle, run1, 0.5)), 'blended pose keeps unit quaternions');
  const pos = hero.arr('pos'), j = hero.arr('joints'), feetZ = [];
  for (let i = 0; i < hero.meta.verts; i++) if (hero.meta.bones[j[i * 4]].startsWith('foot')) feetZ.push(pos[i * 3 + 2]);
  ok(feetZ.reduce((x, y) => x + y, 0) / feetZ.length < -0.02, 'model faces -Z like the game');
  const wpost = new HO.World({ seed: 1, foes: false }); const b = wpost.addHero(0, {});
  b.x = -16; b.z = 12; b.yaw = 0;
  wpost.cmd({ seat: 0, t: 'move', f: 0, s: 0, r: 0 });
  b.yaw = HO.PI;
  wpost.cmd({ seat: 0, t: 'move', f: 1, s: 0, r: 0 }); wpost.run(T.hz);
  near(b.z, 14.2 - T.radius, 1e-3, 'a showcase pillar blocks walking');
}

{
  const sh = HO.newSheet({ id: 'h1', name: 'Мира', race: 'foxian', sex: 'f', path: 'destruction', look: { face: 2, ears: 1, tail: 2 } });
  eq(sh.lvl, 1, 'new hero starts at level 1');
  eq(sh.credits, 0, 'new hero has no credits');
  ok(sh.learned.d_mighty === 1 && !sh.learned.d_charge && !sh.learned.d_ult, 'new hero knows only level 1 abilities');
  ok(sh.look.ears === 1 && sh.look.tail === 2, 'foxian look keeps ears and tail');
  ok(HO.newSheet({ race: 'human', look: { ears: 1 } }).look.ears === undefined, 'humans have no ears setting');
  const full = HO.newSheet({ path: 'erudition', level: 10, learnAll: true });
  ok(full.learned.e_ult === 1 && full.learned.e_fire === 2 && full.learned.e_ice === 2, 'a debug hero at 10 knows everything with ranks');
  eq(HO.killXp(1, 1, false), 50, 'equal level kill gives 45 + 5 x level');
  eq(HO.killXp(1, 1, true), 100, 'elite gives double');
  eq(HO.killXp(3, 5, false), Math.round(60 * 1.1), 'higher level foe gives more');
  eq(HO.killXp(6, 1, false), 0, 'grey foe gives nothing');
  ok(HO.killXp(6, 2, false) > 0 && HO.killXp(6, 2, false) < HO.killXp(6, 6, false), 'lower level foe gives less');
  eq(HO.killXp(10, 10, false), 0, 'no experience at the level cap');
  eq(HO.nameError('А'), 'Имя слишком короткое', 'short name rejected');
  ok(HO.nameError('Mixедname'), 'mixed alphabets rejected');
  ok(HO.nameError('мира', ['Мира']), 'taken name rejected regardless of case');
  eq(HO.nameError('Мира', []), null, 'good name accepted');
  eq(HO.niceName('мИРА'), 'Мира', 'name is capitalised');
  const box = new Map(), mem = { getItem: k => (box.has(k) ? box.get(k) : null), setItem: (k, v) => box.set(k, String(v)), removeItem: k => box.delete(k) };
  const st = HO.Store(mem);
  eq(st.list().length, 0, 'empty store');
  const a1 = HO.newSheet({ id: st.nextId(), name: 'Мира' });
  st.save(a1);
  const a2 = HO.newSheet({ id: st.nextId(), name: 'Лань', race: 'foxian' });
  st.save(a2);
  eq(st.list().map(r => r.id).join(','), 'h1,h2', 'store lists heroes in order');
  a1.lvl = 3; st.save(a1);
  eq(st.list().map(r => r.id + r.lvl).join(','), 'h13,h21', 'saving keeps the order and updates the row');
  eq(st.load('h2').name, 'Лань', 'store loads a hero');
  st.setLast('h2');
  eq(st.last(), 'h2', 'store remembers the last hero');
  st.remove('h2');
  ok(!st.load('h2') && st.last() === null && st.list().length === 1, 'remove deletes the hero and the last mark');
  eq(st.nextId(), 'h2', 'next id reuses a free number');
  box.set('hsro.char.h9', '{bad json');
  eq(st.load('h9'), null, 'a broken save is ignored');
  ok(Object.keys(box).every(k => k.startsWith('hsro.')), 'all keys start with hsro.');
  for (const k of box.keys()) ok(k.startsWith('hsro.'), 'key ' + k + ' is under hsro.');
  ok(read('js/apps/backup-catalog.js').includes("game('hsro', ['hsro.*']"), 'save keys are in the backup catalog');
}

{
  const w = new HO.World({ seed: 4, level: 1, foes: false });
  const sh = HO.newSheet({ id: 'h1', name: 'Мира', path: 'destruction' });
  const a = w.addHero(0, { sheet: sh });
  const term = w.state.actors.find(x => x.kind === 'npc');
  ok(term && term.role === 'trainer', 'grey room has the volunteer terminal');
  const f = w.addFoe('baryon', { x: a.x, z: a.z - 2 }, 1);
  w.cmd({ seat: 0, t: 'cast', ab: 'd_rend', uid: f.uid }); w.step();
  ok(denied(w, 'level'), 'level 4 ability is locked at level 1');
  a.sheet.lvl = 4; w.levelUp(a);
  eq(a.lvl, 4, 'level up raises the hero');
  eq(a.hp, w.stat(a, 'maxHp'), 'level up heals');
  w.cmd({ seat: 0, t: 'cast', ab: 'd_rend', uid: f.uid }); w.step();
  ok(denied(w, 'learn'), 'unlearned ability is refused');
  a.x = -10; a.z = 0;
  w.cmd({ seat: 0, t: 'learn', ab: 'd_charge' }); w.step();
  ok(denied(w, 'trainer'), 'learning needs the trainer nearby');
  a.x = term.x; a.z = term.z + 2;
  w.cmd({ seat: 0, t: 'talk', uid: term.uid }); w.step();
  ok(w.events.some(e => e.k === 'talk' && e.role === 'trainer'), 'talking opens the trainer');
  w.cmd({ seat: 0, t: 'learn', ab: 'd_charge' }); w.step();
  ok(denied(w, 'credits'), 'learning costs credits');
  a.sheet.credits = 200;
  w.cmd({ seat: 0, t: 'learn', ab: 'd_charge' }); w.step();
  ok(a.sheet.learned.d_charge === 1 && a.sheet.credits === 200 - HO.trainCost(2), 'Charge learned for 8 x level squared');
  w.cmd({ seat: 0, t: 'learn', ab: 'd_charge' }); w.step();
  ok(denied(w, 'known'), 'a learned ability cannot be bought twice');
  w.cmd({ seat: 0, t: 'learn', ab: 'd_sunder' }); w.step();
  ok(denied(w, 'level'), 'level 8 ability waits');
  a.sheet.lvl = 8; w.levelUp(a); a.sheet.credits = 2000;
  w.cmd({ seat: 0, t: 'learn', ab: 'd_mighty' }); w.step();
  eq(a.sheet.learned.d_mighty, 2, 'rank 2 of Mighty Swing at level 8');
  const tl = HO.trainList(a.sheet);
  ok(tl.every(r => !r.owned || r.cost === 0) && tl.some(r => r.id === 'd_sunder' && r.ready), 'trainer list shows what is ready');
  eq(HO.rankMul(2), 1 + HO.RANK_STEP, 'rank 2 multiplier');
  const text = JSON.stringify(w.state);
  ok(JSON.parse(text).actors.find(x => x.kind === 'hero').sheet.learned.d_mighty === 2, 'the sheet lives in the world state');
}

function levelBot(path, minutes) {
  const w = new HO.World({ seed: 21, level: 1 });
  const a = w.addHero(0, { sheet: HO.newSheet({ id: 'h1', name: 'Бот', path }) });
  const rot = { destruction: ['d_attack', 'd_mighty'], abundance: ['a_attack', 'a_smite'], erudition: ['e_attack', 'e_fire'] }[path];
  let deaths = 0, sitting = false;
  for (let t = 0; t < minutes * 60 * T.hz; t++) {
    if (a.dead) { deaths++; w.cmd({ seat: 0, t: 'release', mode: 'medic' }); w.step(); continue; }
    const hpK = a.hp / w.stat(a, 'maxHp');
    const resK = HO.PATHS[path].resource === 'rage' ? 1 : a.res / a.base.pool;
    let tgt = w.byUid(a.target);
    const fresh = !tgt || tgt.kind !== 'foe' || tgt.dead || tgt.state === 'evade';
    const corpse = !a.inCombat && w.foes().find(f => f.dead && f.loot && f.loot[a.uid]);
    if (corpse) {
      const dc = Math.hypot(corpse.x - a.x, corpse.z - a.z);
      w.face(a, corpse);
      w.cmd({ seat: 0, t: 'move', f: dc > 2.5 ? 1 : 0, s: 0, r: 0 });
      if (dc <= 2.5) w.cmd({ seat: 0, t: 'loot', uid: corpse.uid });
      w.step();
      continue;
    }
    const engaged = w.foes().some(f => f.state === 'fight' && f.threat[a.uid] !== undefined);
    if (!engaged && (sitting ? hpK < 0.98 || resK < 0.98 : hpK < 0.9 || resK < 0.8)) {
      if (!sitting) { w.cmd({ seat: 0, t: 'move', f: 0, s: 0, r: 0 }); w.cmd({ seat: 0, t: 'sit', on: true }); sitting = true; }
      w.step();
      continue;
    }
    sitting = false;
    if (fresh) {
      const lonely = f => w.foes().every(o => o === f || o.dead || Math.hypot(o.x - f.x, o.z - f.z) > 11);
      const list = w.foes().filter(f => !f.dead && !f.elite && !f.pack && f.state !== 'evade' && lonely(f)).sort((p, q) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(q.x - a.x, q.z - a.z));
      const fighting = w.foes().find(f => f.state === 'fight' && f.aim === a.uid && !f.dead);
      tgt = fighting || list[0];
      if (!tgt) { w.step(); continue; }
      w.cmd({ seat: 0, t: 'target', uid: tgt.uid });
    }
    const d = Math.hypot(tgt.x - a.x, tgt.z - a.z);
    w.face(a, tgt);
    const reach = path === 'destruction' ? 2.4 : 22;
    w.cmd({ seat: 0, t: 'move', f: (d > reach || !w.los(a, tgt)) && !a.cast ? 1 : 0, s: 0, r: 0 });
    if (d <= reach + 6 && !a.cast && t % 2 === 0) {
      if (path === 'abundance' && hpK < 0.5) w.cmd({ seat: 0, t: 'cast', ab: 'a_heal', uid: a.uid });
      for (const id of rot) w.cmd({ seat: 0, t: 'cast', ab: id, uid: tgt.uid });
    }
    w.step();
    if (a.sheet.lvl >= 3) return { lvl: a.sheet.lvl, min: +(t / T.hz / 60).toFixed(1), deaths, credits: a.sheet.credits, kills: a.sheet.kills };
  }
  return { lvl: a.sheet.lvl, min: minutes, deaths, credits: a.sheet.credits, kills: a.sheet.kills, xp: a.sheet.xp };
}

{
  for (const p of HO.PATH_IDS) {
    const r = levelBot(p, 40);
    ok(r.lvl >= 3, p + ': a new hero reaches level 3 in the grey room: ' + JSON.stringify(r));
    ok(r.credits >= HO.trainCost(2), p + ': enough credits for the level 2 lesson: ' + r.credits);
  }
}

{
  for (const zid of HO.WORLD_ZONES) {
    const z = HO.ZONES[zid];
    const open = {};
    for (const b of z.boxes) if (b[6] === 'gate') open[b[7]] = true;
    const nav = new HO.Nav(z, open), seen = nav.reachable(z.spawn.x, z.spawn.z);
    const ok2 = (x, y) => { const c = nav.nearestFree(x, y); return c >= 0 && seen[c] === 1; };
    ok(nav.walkable(z.spawn.x, z.spawn.z), zid + ': spawn is walkable');
    const within = (x, y, r) => { for (let dz = -r; dz <= r; dz += 0.5) for (let dx = -r; dx <= r; dx += 0.5) { if (dx * dx + dz * dz > r * r) continue; const c = nav.cellOf(x + dx, y + dz); if (c >= 0 && nav.free[c] && seen[c] && Math.hypot(nav.center(c)[0] - x, nav.center(c)[1] - y) <= r) return true; } return false; };
    for (const n of z.npcs) ok(within(n.x, n.z, C.talkRange - 0.5), zid + ': npc ' + n.id + ' can be reached within talking range');
    for (const o of z.objects) ok(within(o.x, o.z, C.useRange - 0.3), zid + ': object ' + o.id + ' at ' + o.x + ',' + o.z + ' can be reached within use range');
    for (const f of z.foes) ok(ok2(f.x, f.z) && HO.FOES[f.id] && f.lvl >= 1, zid + ': foe ' + f.id + ' at ' + f.x + ',' + f.z + ' stands in the zone');
    for (const a of z.areas) ok(ok2((a.x0 + a.x1) / 2, (a.z0 + a.z1) / 2), zid + ': area ' + a.id + ' is reachable');
    if (HO.LIFT_ZONES.includes(zid)) ok(HO.TRAVEL[zid] && ok2(HO.TRAVEL[zid].x, HO.TRAVEL[zid].z), zid + ': lift arrival is reachable');
    for (const an of z.anchors || []) ok(ok2(an.x, an.z) && HO.ANCHORS[an.id].zone === zid, zid + ': anchor ' + an.id + ' is reachable');
    for (const an of z.anchors || []) { const at = HO.anchorSpot(an.id); ok(nav.walkable(at.x, at.z) && seen[nav.cellOf(at.x, at.z)] && Math.hypot(at.x - an.x, at.z - an.z) <= 2.2, zid + ': arrival at anchor ' + an.id + ' stands on open floor'); }
    for (const m of z.medpoints) ok(nav.walkable(m.x, m.z) && seen[nav.cellOf(m.x, m.z)], zid + ': medpoint ' + m.x + ',' + m.z + ' stands on open floor');
    for (const m of z.medpoints || []) ok(ok2(m.x, m.z), zid + ': medpoint is reachable');
    for (const id of z.rest || []) ok(z.areas.some(a => a.id === id), zid + ': rest area ' + id + ' exists');
    for (const o of z.objects) if (o.act === 'travel') ok(HO.ZONES[o.zone] && new HO.Nav(HO.ZONES[o.zone], {}).walkable(o.to.x, o.to.z), zid + ': ' + o.id + ' leads to a walkable spot');
    for (const n of z.npcs) {
      if (n.role === 'vendor') ok(n.stock.every(id => HO.ITEMS[id] && HO.ITEMS[id].price > 0), zid + ': vendor stock is sold for credits');
      ok(n.greet && !n.greet.includes('—'), zid + ': ' + n.id + ' has a greeting');
    }
    if (z.start) ok(z.npcs.some(n => n.role === 'trainer') && z.npcs.some(n => n.role === 'vendor'), zid + ': has a trainer and a vendor');
  }
  const sup = HO.ZONES.supply, closed = new HO.Nav(sup, {}), from = closed.reachable(sup.spawn.x, sup.spawn.z);
  ok(!from[closed.nearestFree(-4, 0)], 'the warehouse is locked until the hatch opens');
  ok(!from[closed.nearestFree(-4, 42)], 'the dock is cut off until the bridge works');
  ok(from[closed.nearestFree(-50, -50)] && from[closed.nearestFree(30, -70)], 'substation and meeting room are open from the start');
  const zoneOf = id => Object.values(HO.ZONES).find(z => (z.npcs || []).some(n => n.id === id));
  let total = 0;
  for (const qid of HO.QUEST_IDS) {
    const q = HO.QUESTS[qid], z = HO.ZONES[q.zone];
    ok(zoneOf(q.giver), qid + ': giver ' + q.giver + ' exists');
    ok(zoneOf(q.turnIn) || HO.LATER_NPCS.includes(q.turnIn), qid + ': turn-in ' + q.turnIn + ' exists or comes later');
    for (const r of q.req) ok(HO.QUESTS[r], qid + ': requirement ' + r + ' exists');
    for (const g of q.goals) {
      const anyZone = fn => HO.WORLD_ZONES.some(id => fn(HO.ZONES[id]));
      if (g.k === 'kill') ok(anyZone(zz => zz.foes.some(f => f.id === g.foe)), qid + ': ' + g.foe + ' lives somewhere');
      if (g.k === 'use') ok(anyZone(zz => zz.objects.some(o => o.id === g.obj)), qid + ': object ' + g.obj + ' exists');
      if (g.k === 'talk') for (const id of g.byPath ? Object.values(g.byPath) : [g.npc]) ok(zoneOf(id), qid + ': talk to ' + id);
      if (g.k === 'anchor' || g.k === 'bind') ok(HO.ANCHORS[g.anchor], qid + ': anchor ' + g.anchor + ' exists');
      if (g.k === 'collect') ok(HO.ITEMS[g.item] && (z.objects.some(o => o.give === g.item) || Object.entries(HO.LOOT).some(([f, t]) => (t.quest || []).some(([i]) => i === g.item) && anyZone(zz => zz.foes.some(x => x.id === f)))), qid + ': ' + g.item + ' can be found');
      if (g.k === 'escort') ok(z.npcs.some(n => n.id === g.npc && n.escort) && z.areas.some(a => a.id === g.area), qid + ': escort target and place exist');
      if (g.k === 'trial') ok(HO.TRIALS[g.trial] && anyZone(zz => zz.objects.some(o => o.act === 'trial' && o.trial === g.trial)), qid + ': trial ' + g.trial + ' has a start object');
      ok(g.text, qid + ': goal has a text');
    }
    const r = q.reward;
    for (const [id] of r.items || []) ok(HO.ITEMS[id], qid + ': reward ' + id + ' exists');
    for (const id of r.choice || []) ok(HO.ITEMS[id] && HO.ITEMS[id].kind === 'gear', qid + ': choice ' + id + ' is gear');
    for (const [id] of q.give) ok(HO.ITEMS[id], qid + ': given item ' + id + ' exists');
    for (const t of [q.offer, q.wait, q.done, q.title]) ok(t && !t.includes('—'), qid + ': texts are written without long dashes');
    total++;
  }
  eq(total, 47, 'forty seven quests in the eight areas, class quests and the Echo of War included');
  const solo = id => !HO.QUESTS[id].class;
  eq(HO.QUEST_IDS.filter(id => solo(id) && HO.QUESTS[id].zone === 'control').length, 7, 'seven quests in the Main Control Zone');
  eq(HO.QUEST_IDS.filter(id => HO.QUESTS[id].zone === 'seclusion').length, 9, 'nine quests in the Isolated Zone');
  for (const p of HO.PATH_IDS) {
    const q = HO.QUESTS[HO.CLASS_QUEST[p]];
    ok(q.class && q.path === p && q.lvl === 10 && q.reward.ult && q.reward.trace && q.giver === HO.PATH_TRAINER[p], p + ': class quest at the Path mentor gives the Ultimate and a Trace');
    eq(HO.TRACES[p].length, 2, p + ': two Traces to choose from');
  }
  eq(HO.QUEST_IDS.filter(id => ['storage'].includes(HO.QUESTS[id].zone)).length, 8, 'eight quests given on the first floor of the Storage Zone');
  eq(HO.QUEST_IDS.filter(id => ['storage2'].includes(HO.QUESTS[id].zone)).length, 5, 'five quests on the second floor');
  eq(HO.QUEST_IDS.filter(id => solo(id) && HO.QUESTS[id].zone === 'base').length, 7, 'seven quests in the Base Zone');
  for (const zid of HO.WORLD_ZONES) {
    const z = HO.ZONES[zid], foes = z.foes.filter(f => !f.flee);
    const safe = [...z.npcs.filter(n => !n.escort).map(n => ['npc ' + n.id, n]), ...z.anchors.map(n => ['anchor ' + n.id, n]), ...z.medpoints.map((n, i) => ['medpoint ' + i, n]), ['spawn', z.spawn]];
    for (const [what, p] of safe) {
      const near = foes.find(f => Math.hypot(f.x - p.x, f.z - p.z) < 12);
      ok(!near, zid + ' ' + what + ' stands clear of foes' + (near ? ': ' + near.id + ' at ' + near.x + ',' + near.z : ''));
    }
    for (const o of z.objects) ok(!z.foes.some(f => HO.FOES[f.id].elite && Math.hypot(f.x - o.x, f.z - o.z) < 16), zid + ' ' + o.id + ' is not guarded by an elite');
  }
  eq(HO.QUEST_IDS.filter(id => HO.QUESTS[id].zone === 'supply').length, 7, 'seven quests in the Supply Zone');
  for (const id of HO.ITEM_IDS) ok(HO.ITEMS[id].name && !HO.ITEMS[id].name.includes('—'), 'item ' + id + ' has a name');
}

{
  const sh = HO.newSheet({ id: 'h1', name: 'Мира' });
  eq(sh.bag.length, HO.BAG_SIZE, 'bag has 16 slots');
  eq(HO.bagAdd(sh, 'medkit', 7), 7, 'stacks fill slots');
  eq(sh.bag.filter(Boolean).length, 2, 'medkits stack by 5');
  eq(HO.bagRemove(sh, 'medkit', 6), 6, 'items come out of the bag');
  eq(HO.bagCount(sh, 'medkit'), 1, 'one medkit left');
  const old = { v: 1, id: 'h9', name: 'Старый', race: 'human', path: 'abundance', lvl: 2, learned: {}, credits: 5 };
  HO.normSheet(old);
  ok(old.bag.length === 16 && old.gear.head === null && old.quests && old.done, 'a stage 3 save gains bag, gear and quests');
}

{
  const w = new HO.World({ seed: 9, zone: 'supply' });
  const a = w.addHero(0, { sheet: HO.newSheet({ id: 'h1', name: 'Лань', race: 'foxian', path: 'erudition' }) });
  const npc = id => w.npcById(id), at = (n, d) => { a.x = n.x + (d || 1.5); a.z = n.z; a.y = 0; };
  at(npc('captain'));
  w.cmd({ seat: 0, t: 'accept', q: 's_dock' }); w.step();
  ok(a.sheet.quests.s_dock, 'quest accepted next to the giver');
  at(npc('bob')); w.cmd({ seat: 0, t: 'talk', uid: npc('bob').uid }); w.step();
  at(npc('supply_terminal')); w.cmd({ seat: 0, t: 'talk', uid: npc('supply_terminal').uid }); w.step();
  ok(HO.questReady(a.sheet, 's_dock'), 'talk goals complete the quest');
  w.cmd({ seat: 0, t: 'turnIn', q: 's_dock' }); w.step();
  ok(denied(w, 'far'), 'turn-in needs the turn-in npc');
  at(npc('captain'));
  const lvl0 = a.sheet.xp;
  w.cmd({ seat: 0, t: 'turnIn', q: 's_dock' }); w.step();
  ok(a.sheet.done.s_dock && a.sheet.credits === 20 && a.sheet.xp > lvl0, 'turn-in gives credits and experience');
  const hatch = w.state.actors.find(o => o.kind === 'obj' && o.id === 'hatch');
  at(hatch, 1); w.cmd({ seat: 0, t: 'use', uid: hatch.uid }); w.step();
  ok(w.events.some(e => e.k === 'deny' && e.text === 'Посетитель не авторизован Гертой') && !w.state.gates.hatch, 'the hatch refuses a visitor without a pass');
  HO.bagAdd(a.sheet, 'pass', 1);
  w.cmd({ seat: 0, t: 'use', uid: hatch.uid }); w.step();
  ok(w.state.gates.hatch && !w.boxes.some(b => b[7] === 'hatch'), 'the pass opens the hatch and its wall');
  const vendor = npc('supply_vendor');
  at(vendor);
  w.cmd({ seat: 0, t: 'buy', uid: vendor.uid, item: 'lunch' }); w.step();
  eq(HO.bagCount(a.sheet, 'lunch'), 1, 'bought a lunch');
  eq(a.sheet.credits, 20 - HO.buyPrice(a.sheet, 'lunch'), 'lunch cost credits');
  HO.bagAdd(a.sheet, 'scrap', 3);
  const c0 = a.sheet.credits;
  w.cmd({ seat: 0, t: 'sellJunk', uid: vendor.uid }); w.step();
  eq(a.sheet.credits, c0 + 12, 'junk sells');
  const hu = HO.newSheet({ race: 'human' });
  ok(HO.buyPrice(hu, 'medkit') < HO.buyPrice(a.sheet, 'medkit'), 'humans pay less at station vendors');
  HO.bagAdd(a.sheet, 'cone_e2', 1); HO.bagAdd(a.sheet, 'cone_d2', 1);
  const atk0 = w.stat(a, 'atk');
  w.cmd({ seat: 0, t: 'equip', slot: a.sheet.bag.findIndex(s => s && s.id === 'cone_e2') }); w.step();
  ok(a.sheet.gear.cone && w.stat(a, 'atk') === atk0 + 4, 'equipping a cone adds Attack');
  w.cmd({ seat: 0, t: 'equip', slot: a.sheet.bag.findIndex(s => s && s.id === 'cone_d2') }); w.step();
  ok(denied(w, 'cantEquip'), 'a cone of another Path cannot be equipped');
  a.hp = 5; a.combatAt = -9999;
  w.cmd({ seat: 0, t: 'item', slot: a.sheet.bag.findIndex(s => s && s.id === 'lunch') }); w.run(T.hz * 19);
  eq(Math.round(a.hp), Math.round(w.stat(a, 'maxHp')), 'a lunch restores health while sitting');
  const lift = w.state.actors.find(o => o.kind === 'obj' && o.id === 'lift');
  at(lift, 1);
  w.cmd({ seat: 0, t: 'lift', zone: 'storage2' }); w.step();
  ok(denied(w, 'repair'), 'the lift does not stop at the second floor of the Storage Zone');
  w.cmd({ seat: 0, t: 'lift', zone: 'control' }); w.step();
  ok(w.events.some(e => e.k === 'travel' && e.zone === 'control' && e.x === HO.TRAVEL.control.x), 'the lift goes to the Main Control Zone');
  w.cmd({ seat: 0, t: 'lift', zone: 'base' }); w.step();
  ok(w.events.some(e => e.k === 'travel' && e.zone === 'base'), 'the lift goes to the Base Zone');
  const snap = HO.World.fromState(JSON.parse(JSON.stringify(w.state)));
  ok(snap.state.gates.hatch && !snap.boxes.some(b => b[7] === 'hatch'), 'open gates survive a snapshot');
}

function questBot(race, path, plan, minutes) {
  const zone = HO.START_ZONE[race];
  const w = new HO.World({ seed: 31, zone });
  const a = w.addHero(0, { sheet: HO.newSheet({ id: 'h1', name: 'Бот', race, path }) });
  const sh = a.sheet;
  const rot = { destruction: ['d_attack', 'd_charge', 'd_rend', 'd_mighty'], abundance: ['a_attack', 'a_wither', 'a_smite'], erudition: ['e_attack', 'e_prep', 'e_ice', 'e_fire'] }[path];
  const lessons = { destruction: ['d_charge', 'd_rend', 'd_shout'], abundance: ['a_bless', 'a_sprout', 'a_cleanse'], erudition: ['e_prep', 'e_ice'] }[path];
  const trainer = w.state.actors.find(n => n.kind === 'npc' && n.role === 'trainer');
  const st = { deaths: 0, route: null, routeFor: '', sitting: false, stuck: 0, lastPos: null };
  const go = (x, z, near) => {
    const d = Math.hypot(x - a.x, z - a.z);
    if (d <= (near || 2)) { w.cmd({ seat: 0, t: 'move', f: 0, s: 0, r: 0 }); return true; }
    const key = Math.round(x) + ':' + Math.round(z) + ':' + JSON.stringify(w.state.gates);
    if (st.routeFor !== key || !st.route || !st.route.length || w.state.tick % 40 === 0) { st.route = w.nav().path(a.x, a.z, x, z) || []; st.routeFor = key; }
    while (st.route.length > 1 && Math.hypot(st.route[0][0] - a.x, st.route[0][1] - a.z) < 0.8) st.route.shift();
    const p = st.route[0] || [x, z];
    w.face(a, { x: p[0], z: p[1] });
    w.cmd({ seat: 0, t: 'move', f: 1, s: 0, r: 0 });
    return false;
  };
  const fight = f => {
    const d = Math.hypot(f.x - a.x, f.z - a.z), reach = path === 'destruction' ? 2.4 : 20;
    if (a.target !== f.uid) w.cmd({ seat: 0, t: 'target', uid: f.uid });
    if (d > reach || !w.los(a, f)) { go(f.x, f.z, path === 'destruction' ? 2.2 : 6); if (path === 'destruction' && d < 25 && d > 8) w.cmd({ seat: 0, t: 'cast', ab: 'd_charge', uid: f.uid }); return; }
    w.face(a, f);
    w.cmd({ seat: 0, t: 'move', f: 0, s: 0, r: 0 });
    if (a.cast || w.state.tick % 2) return;
    if (path === 'abundance' && a.hp / w.stat(a, 'maxHp') < 0.5) { w.cmd({ seat: 0, t: 'cast', ab: 'a_heal', uid: a.uid }); return; }
    if (a.hp / w.stat(a, 'maxHp') < 0.3) { const s = sh.bag.findIndex(x => x && x.id === 'medkit'); if (s >= 0) w.cmd({ seat: 0, t: 'item', slot: s }); }
    for (const id of rot) w.cmd({ seat: 0, t: 'cast', ab: id, uid: f.uid });
  };
  const objOf = id => w.state.actors.filter(o => o.kind === 'obj' && o.id === id && w.state.tick >= o.hiddenUntil).sort((p, q) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(q.x - a.x, q.z - a.z))[0];
  const foeOf = ids => w.foes().filter(f => ids.includes(f.id) && !f.dead && f.state !== 'evade').sort((p, q) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(q.x - a.x, q.z - a.z))[0];
  const reach = (x, z) => !!w.nav().path(a.x, a.z, x, z);
  const openGateFor = (x, z) => {
    if (reach(x, z)) return false;
    for (const o of w.state.actors.filter(o2 => o2.kind === 'obj')) {
      const d = w.objDef(o);
      if (d.act !== 'gate' || w.state.gates[d.gate] || (d.need && !HO.bagCount(sh, d.need))) continue;
      if (!reach(o.x, o.z)) continue;
      if (go(o.x, o.z, 2)) w.cmd({ seat: 0, t: 'use', uid: o.uid });
      return true;
    }
    return false;
  };
  const doneAll = () => plan.every(q => sh.done[q]);
  for (let t = 0; t < minutes * 60 * T.hz && !(doneAll() && sh.lvl >= 3); t++) {
    if (a.dead) { st.deaths++; w.cmd({ seat: 0, t: 'release' }); w.step(); continue; }
    if (a.ghost) { if (go(a.corpse.x, a.corpse.z, 3)) w.cmd({ seat: 0, t: 'revive' }); w.step(); continue; }
    const engaged = w.foes().filter(f => f.state === 'fight' && f.threat[a.uid] !== undefined && !f.dead && !HO.FOE_RT[f.id].flee);
    if (engaged.length) { st.sitting = false; fight(engaged[0]); w.step(); continue; }
    const corpse = w.foes().find(f => f.dead && f.loot && f.loot[a.uid] && Math.hypot(f.x - a.x, f.z - a.z) < 30);
    if (corpse) { if (go(corpse.x, corpse.z, 2.2)) w.cmd({ seat: 0, t: 'loot', uid: corpse.uid }); w.step(); continue; }
    const hpK = a.hp / w.stat(a, 'maxHp'), resK = a.base.pool ? a.res / a.base.pool : 1;
    if (st.sitting ? hpK < 0.98 || resK < 0.95 : hpK < 0.9 || resK < 0.6) {
      const safe = w.foes().every(f => (f.dead && f.respawnAt - w.state.tick > 30 * T.hz) || HO.FOE_RT[f.id].flee || Math.hypot((f.dead ? f.home.x : f.x) - a.x, (f.dead ? f.home.z : f.z) - a.z) > 16);
      if (!safe) { st.sitting = false; go(w.zone.spawn.x, w.zone.spawn.z, 3); w.step(); continue; }
      if (!st.sitting || (!a.sit && w.state.tick % 20 === 0)) {
        w.cmd({ seat: 0, t: 'move', f: 0, s: 0, r: 0 });
        const food = sh.bag.findIndex(x => x && x.id === (hpK < 0.75 ? 'lunch' : 'coffee'));
        if (food >= 0 && !st.sitting) w.cmd({ seat: 0, t: 'item', slot: food }); else w.cmd({ seat: 0, t: 'sit', on: true });
        st.sitting = true;
      }
      w.step(); continue;
    }
    st.sitting = false;
    for (let s = 0; s < sh.bag.length; s++) {
      const it = sh.bag[s] && HO.ITEMS[sh.bag[s].id];
      if (it && it.kind === 'gear' && HO.canEquip(sh, sh.bag[s].id) && !sh.gear[it.slot]) w.cmd({ seat: 0, t: 'equip', slot: s });
    }
    const want = lessons.find(id => !sh.learned[id] && HO.ABILITIES[id].lvl <= sh.lvl && sh.credits >= HO.trainCost(HO.ABILITIES[id].lvl));
    if (want) { if (go(trainer.x, trainer.z, 3)) w.cmd({ seat: 0, t: 'learn', ab: want }); w.step(); continue; }
    const qid = plan.find(q => !sh.done[q]);
    if (!qid) {
      const f = foeOf(w.zone.foes.map(x => x.id).filter(id => !HO.FOE_RT[id].flee && !HO.FOES[id].elite));
      if (f) fight(f);
      w.step(); continue;
    }
    const q = HO.QUESTS[qid];
    if (!sh.quests[qid]) { const n = w.npcById(q.giver); if (go(n.x, n.z, 3)) w.cmd({ seat: 0, t: 'accept', q: qid }); w.step(); continue; }
    if (HO.questReady(sh, qid)) { const n = w.npcById(q.turnIn); if (!openGateFor(n.x, n.z) && go(n.x, n.z, 3)) w.cmd({ seat: 0, t: 'turnIn', q: qid, pick: 0 }); w.step(); continue; }
    const gi = q.goals.findIndex((g, i) => HO.questGoalCount(sh, qid, i) < HO.goalNeed(g));
    const g = q.goals[gi];
    if (g.k === 'talk') { const n = w.npcById(g.npc); if (go(n.x, n.z, 3)) w.cmd({ seat: 0, t: 'talk', uid: n.uid }); }
    else if (g.k === 'use' || (g.k === 'collect' && w.zone.objects.some(o => o.give === g.item))) {
      const o = objOf(g.k === 'use' ? g.obj : w.zone.objects.find(x => x.give === g.item).id);
      if (o && !openGateFor(o.x, o.z) && go(o.x, o.z, 2.5)) w.cmd({ seat: 0, t: 'use', uid: o.uid });
    } else if (g.k === 'kill' || g.k === 'collect') {
      const ids = g.k === 'kill' ? [g.foe] : Object.keys(HO.LOOT).filter(f => (HO.LOOT[f].quest || []).some(([i]) => i === g.item));
      const f = foeOf(ids);
      if (f && !openGateFor(f.x, f.z)) fight(f);
    } else if (g.k === 'escort') {
      const ar = w.zone.areas.find(x => x.id === g.area), e = w.npcById(g.npc);
      const cx = (ar.x0 + ar.x1) / 2, cz = (ar.z0 + ar.z1) / 2;
      if (!openGateFor(cx, cz)) { if (Math.hypot(e.x - a.x, e.z - a.z) > 8) go(e.x, e.z, 3); else go(cx, cz, 2); }
    }
    w.step();
  }
  return { done: plan.filter(q => sh.done[q]).length, of: plan.length, lvl: sh.lvl, min: +(w.state.tick / T.hz / 60).toFixed(1), deaths: st.deaths, credits: sh.credits, gear: Object.values(sh.gear).filter(Boolean).length };
}

{
  const human = questBot('human', 'destruction', ['b_pass', 'b_checkup', 'b_baryons', 'b_robot', 'b_shards', 'b_blindspot'], 90);
  ok(human.done === human.of && human.lvl >= 3, 'a human volunteer finishes the Base Zone chain and reaches level 3: ' + JSON.stringify(human));
  const fox = questBot('foxian', 'erudition', ['s_dock', 's_pass', 's_power', 's_cargo', 's_trotter', 's_bridge'], 90);
  ok(fox.done === fox.of && fox.lvl >= 3, 'a foxian volunteer finishes the Supply Zone chain and reaches level 3: ' + JSON.stringify(fox));
  const healer = questBot('human', 'abundance', ['b_pass', 'b_checkup', 'b_baryons', 'b_robot', 'b_shards', 'b_blindspot'], 90);
  ok(healer.done === healer.of && healer.lvl >= 3, 'a human healer finishes the Base Zone chain: ' + JSON.stringify(healer));
  const foxTank = questBot('foxian', 'destruction', ['s_dock', 's_pass', 's_power', 's_cargo', 's_trotter', 's_bridge'], 90);
  ok(foxTank.done === foxTank.of && foxTank.lvl >= 3, 'a foxian of Destruction finishes the Supply Zone chain: ' + JSON.stringify(foxTank));
  const foxHeal = questBot('foxian', 'abundance', ['s_dock', 's_pass', 's_power', 's_cargo', 's_trotter', 's_bridge'], 90);
  ok(foxHeal.done === foxHeal.of && foxHeal.lvl >= 3, 'a foxian healer finishes the Supply Zone chain: ' + JSON.stringify(foxHeal));
  for (const r of [human, fox, healer, foxTank, foxHeal]) ok(r.deaths <= 6 && r.min <= 30, 'a start chain takes under 30 game minutes with few falls: ' + JSON.stringify(r));
}

{
  const mk = (zone, o) => { const w = new HO.World({ seed: 5, zone }); const a = w.addHero(0, { sheet: HO.newSheet(Object.assign({ id: 'h1', name: 'Мира' }, o || {})) }); return [w, a]; };
  const [w, a] = mk('control', { level: 5 });
  a.sheet.lvl = 5; w.levelUp(a);
  const central = w.state.actors.find(o => o.anchor === 'control_central');
  a.x = central.x + 1; a.z = central.z; w.run(6);
  ok(a.sheet.anchors.control_central, 'walking up to an Anchor opens it');
  a.sheet.anchors.storage_atrium = 1;
  a.sheet.credits = 100;
  w.cmd({ seat: 0, t: 'anchorGo', to: 'storage_atrium' }); w.step();
  ok(w.events.some(e => e.k === 'travel' && e.zone === 'storage') && a.sheet.credits === 75, 'travel to another zone Anchor costs 5 x level');
  w.cmd({ seat: 0, t: 'anchorGo', to: 'base_reception' }); w.step();
  ok(denied(w, 'anchorUnknown'), 'unknown Anchors are closed');
  a.sheet.anchors.control_watch = 1;
  w.cmd({ seat: 0, t: 'anchorGo', to: 'control_watch' }); w.step();
  near(a.x, HO.anchorSpot('control_watch').x, 0.01, 'an Anchor in the same zone teleports at once');
  a.x = central.x + 1; a.z = central.z;
  w.cmd({ seat: 0, t: 'bind', anchor: 'control_central' }); w.step();
  eq(a.sheet.bind, 'control_central', 'the Pocket Anchor binds to an Anchor');
  HO.bagAdd(a.sheet, 'pocket_anchor', 1);
  a.x = 0; a.z = 30;
  const slot = a.sheet.bag.findIndex(s => s && s.id === 'pocket_anchor');
  w.cmd({ seat: 0, t: 'item', slot }); w.step();
  ok(Math.hypot(a.x - central.x, a.z - central.z) < 3, 'the Pocket Anchor brings the hero back');
  w.cmd({ seat: 0, t: 'item', slot }); w.step();
  ok(denied(w, 'recallCd'), 'the Pocket Anchor has a cooldown');
  w.run(T.hz * 60);
  ok(a.sheet.clock >= 60 && a.sheet.recallAt - a.sheet.clock > 1700, 'the cooldown runs on the hero clock');
  ok(HO.bagCount(a.sheet, 'pocket_anchor') === 1, 'the Pocket Anchor is not used up');
  a.x = 40; a.z = 0; w.step();
  ok(a.resting, 'the city counts as a place of rest');
  const r0 = a.sheet.rested;
  w.run(T.hz * 10);
  ok(a.sheet.rested > r0, 'rest builds up in the city');
}

{
  const w = new HO.World({ seed: 6, zone: 'storage' });
  const a = w.addHero(0, { sheet: HO.newSheet({ id: 'h1', name: 'Мира', path: 'destruction', level: 6, learnAll: true }) });
  a.sheet.lvl = 6; w.levelUp(a);
  HO.bagAdd(a.sheet, 'head3', 1);
  w.cmd({ seat: 0, t: 'equip', slot: a.sheet.bag.findIndex(s => s && s.id === 'head3') }); w.step();
  const hp0 = w.stat(a, 'maxHp');
  eq(a.sheet.gear.head.dur, 100, 'new gear is whole');
  const f = w.foes().find(x => x.id === 'reaver');
  a.x = f.x + 1; a.z = f.z; a.hp = 1; w.aggro(f, a);
  for (let i = 0; i < T.hz * 20 && !a.dead; i++) w.step();
  ok(a.dead && a.sheet.gear.head.dur === 90, 'a fall wears gear by 10%');
  w.cmd({ seat: 0, t: 'release', mode: 'medic' }); w.step();
  ok(!a.dead && !a.ghost && a.sheet.gear.head.dur === 65, 'the medic costs another 25% of wear');
  ok(w.stat(a, 'maxHp') < hp0 && a.auras.some(x => x.key === 'weak'), 'the medic leaves Weakness');
  a.sheet.gear.head.dur = 0;
  w.run(T.hz * 121);
  ok(w.stat(a, 'maxHp') === hp0 - 40, 'broken gear gives no stats');
  eq(HO.repairCost(a.sheet), 24, 'repair cost follows wear and quality');
  const shici = { uid: 999 };
  w.cmd({ seat: 0, t: 'repair', uid: shici.uid }); w.step();
  ok(denied(w, 'far'), 'repairs need a repairer');
  const sh = a.sheet;
  sh.rested = 1000;
  const xpBefore = sh.xp, lvlBefore = sh.lvl;
  const b = w.foes().find(x => x.id === 'baryon');
  a.x = b.x + 2; a.z = b.z; b.hp = 1; w.damage(a, b, 5, { sure: true, elems: ['phys'] });
  const got = w.events.find(e => e.k === 'xp');
  ok(got && got.rested > 0 && got.v === HO.killXp(lvlBefore, b.lvl, false) * 2, 'rest doubles kill experience');
  ok(sh.rested < 1000, 'rest is spent');
  ok(xpBefore >= 0, 'experience was counted');
  const ws = new HO.World({ seed: 6, zone: 'storage', foes: false });
  const s2 = ws.addHero(0, { sheet: HO.newSheet({ id: 'h2', name: 'Лань', level: 6 }) });
  const stairs = ws.state.actors.find(o => o.id === 'stairs_up');
  s2.x = stairs.x - 1.5; s2.z = stairs.z; ws.run(T.hz * 2);
  ws.cmd({ seat: 0, t: 'use', uid: stairs.uid }); ws.step();
  ok(ws.events.some(e => e.k === 'deny' && e.text && e.text.includes('ключ')), 'the second floor lift needs the cipher key quest');
  s2.sheet.done.t_key = 1;
  ws.cmd({ seat: 0, t: 'use', uid: stairs.uid }); ws.step();
  ok(ws.events.some(e => e.k === 'travel' && e.zone === 'storage2'), 'the second floor lift goes up');
}

{
  const w = new HO.World({ seed: 7, zone: 'base' });
  const a = w.addHero(0, { sheet: HO.newSheet({ id: 'h1', name: 'Мира', path: 'abundance' }) });
  a.sheet.lvl = 6; w.levelUp(a); a.sheet.credits = 1000;
  const term = w.npcById('base_terminal'), jo = w.npcById('joanna');
  a.x = term.x + 1.5; a.z = term.z;
  w.cmd({ seat: 0, t: 'learn', ab: 'a_wither' }); w.step();
  ok(denied(w, 'trainerCap'), 'the terminal teaches only up to level 4');
  w.cmd({ seat: 0, t: 'learn', ab: 'a_sprout' }); w.step();
  ok(a.sheet.learned.a_sprout === 1, 'the terminal teaches level 4 lessons');
  a.x = jo.x + 1.5; a.z = jo.z;
  w.cmd({ seat: 0, t: 'learn', ab: 'a_wither' }); w.step();
  ok(a.sheet.learned.a_wither === 1, 'Joanna teaches Abundance');
  const w2 = new HO.World({ seed: 7, zone: 'control' });
  const b = w2.addHero(0, { sheet: HO.newSheet({ id: 'h2', name: 'Лань', path: 'erudition', level: 6 }) });
  b.sheet.lvl = 6; w2.levelUp(b); b.sheet.credits = 1000;
  const arlan = w2.npcById('arlan');
  b.x = arlan.x + 1.5; b.z = arlan.z;
  w2.cmd({ seat: 0, t: 'learn', ab: 'e_cascade' }); w2.step();
  ok(denied(w2, 'trainer'), 'Arlan does not teach Erudition');
  const puppet = w2.npcById('herta_puppet');
  b.x = puppet.x + 1.5; b.z = puppet.z;
  w2.cmd({ seat: 0, t: 'learn', ab: 'e_cascade' }); w2.step();
  ok(b.sheet.learned.e_cascade === 1, 'the Herta puppet teaches Erudition');
  b.sheet.quests.u_scan = { prog: [0] };
  for (const id of ['reaver', 'reaver', 'baryon', 'weaver', 'eliminator']) HO.goalProgress(b.sheet, 'scan', id);
  eq(b.sheet.quests.u_scan.prog[0], 4, 'the pistol counts only different foes');
  b.sheet.quests.c_coffee = { prog: [1, 1, 1, 1] };
  HO.bagAdd(b.sheet, 'shift_coffee', 2);
  const em = w2.npcById('emily');
  b.x = em.x + 1.5; b.z = em.z;
  w2.cmd({ seat: 0, t: 'turnIn', q: 'c_coffee' }); w2.step();
  ok(b.sheet.done.c_coffee && !HO.bagCount(b.sheet, 'shift_coffee'), 'spare quest items are taken back');
}

{
  const hero = (zone, path, lvl, extra) => {
    const w = new HO.World({ seed: 9, zone, foes: !(extra && extra.quiet) });
    const a = w.addHero(0, { sheet: HO.newSheet(Object.assign({ id: 'h1', name: 'Мира', path, level: lvl }, extra || {})) });
    a.sheet.lvl = lvl; w.levelUp(a); a.sheet.credits = 1000;
    return [w, a];
  };
  const at = (w, a, id) => { const o = w.state.actors.find(x => (x.kind === 'npc' || x.kind === 'obj') && x.id === id), nav = w.nav(); const p = [[1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]].map(([dx, dz]) => [o.x + dx, o.z + dz]).find(([x, z]) => nav.walkable(x, z)); a.x = p[0]; a.z = p[1]; return o; };
  const ends = w => w.events.find(e => e.k === 'trialEnd');

  {
    const [w, a] = hero('control', 'destruction', 9);
    eq(HO.npcQuests(a.sheet, 'arlan').offer.includes('k_destruction'), false, 'the class quest waits for level 10');
    a.sheet.xp = HO.xpNeed(9) - 1; w.giveXp(a, 5);
    eq(a.sheet.lvl, 10, 'the hero reaches level 10');
    ok(!a.sheet.learned.d_ult, 'level 10 alone does not teach the Ultimate');
    a.energy = 100; w.cmd({ seat: 0, t: 'cast', ab: 'd_ult', uid: 0 }); w.step();
    ok(denied(w, 'learn'), 'the Ultimate is refused until the class quest');
    const [w2, b] = hero('control', 'erudition', 10);
    ok(!HO.npcQuests(b.sheet, 'arlan').offer.length && HO.npcQuests(b.sheet, 'herta_puppet').offer.includes('k_erudition'), 'each Path gets only its own class quest');
    ok(w2, 'second world built');
  }

  {
    const [w, a] = hero('control', 'destruction', 10);
    at(w, a, 'arlan');
    w.cmd({ seat: 0, t: 'accept', q: 'k_destruction' }); w.step();
    ok(a.sheet.quests.k_destruction, 'Arlan gives the trial');
    const pro = at(w, a, 'trial_arlan');
    w.cmd({ seat: 0, t: 'use', uid: pro.uid }); w.step();
    ok(w.state.trial && w.state.trial.id === 't_arlan' && w.state.actors.filter(n => n.ward).length === 3, 'the projector starts the trial with three researchers');
    let raided = false;
    for (let i = 0; i < T.hz * 62 && w.state.trial; i++) {
      for (const f of w.foes()) if (f.trial && !f.dead) { raided = raided || f.state === 'raid'; if (w.state.tick % T.hz === 0) w.kill(f, a); }
      w.step();
      if (ends(w)) break;
    }
    const e = ends(w);
    ok(raided, 'trial Reavers go for the researchers');
    ok(e && e.won, 'holding the Reavers for a minute wins the trial');
    ok(!w.state.trial && !w.state.actors.some(x => x.ward || x.trial), 'the trial cleans up after itself');
    ok(HO.questReady(a.sheet, 'k_destruction'), 'the trial counts for the class quest');
    at(w, a, 'arlan');
    w.cmd({ seat: 0, t: 'turnIn', q: 'k_destruction' }); w.step();
    ok(denied(w, 'nopick') && !a.sheet.done.k_destruction, 'the class quest asks for a Trace');
    w.cmd({ seat: 0, t: 'turnIn', q: 'k_destruction', trace: 'd_guard' }); w.step();
    ok(a.sheet.done.k_destruction && a.sheet.learned.d_ult === 1 && a.sheet.trace === 'd_guard', 'the class quest teaches the Ultimate and sets the Trace');
    near(w.threatMul(a), 1.25 * 1.3, 1e-9, 'Defender Trace raises threat by 30%');
    const f = w.addFoe('reaver', { x: a.x + 2, z: a.z }, 10);
    const hp0 = a.hp;
    w.damage(f, a, 1, { sure: true, flat: 100, pure: true });
    eq(hp0 - a.hp, 90, 'Defender Trace takes 10% less damage');
  }

  {
    const [w, a] = hero('control', 'destruction', 10);
    at(w, a, 'arlan');
    w.cmd({ seat: 0, t: 'accept', q: 'k_destruction' }); w.step();
    const pro = at(w, a, 'trial_arlan');
    w.cmd({ seat: 0, t: 'use', uid: pro.uid }); w.step();
    a.x = -33; a.z = 0;
    for (let i = 0; i < T.hz * 62 && !ends(w); i++) w.step();
    const e = ends(w);
    ok(e && !e.won && e.why === 'ward', 'a researcher reached by a Reaver fails the trial');
    ok(!HO.questReady(a.sheet, 'k_destruction'), 'a failed trial can be tried again');
  }

  {
    const [w, a] = hero('control', 'erudition', 10);
    at(w, a, 'herta_puppet');
    w.cmd({ seat: 0, t: 'accept', q: 'k_erudition' }); w.step();
    const pult = at(w, a, 'trial_herta');
    w.cmd({ seat: 0, t: 'use', uid: pult.uid }); w.step(); w.step();
    const holos = w.foes().filter(f => f.trial);
    eq(holos.length, 5, 'five holograms appear');
    eq(new Set(holos.map(f => f.id)).size, 5, 'the holograms are all different foes');
    w.run(T.hz * 3);
    ok(holos.every(f => f.state === 'idle'), 'holograms wait to be attacked');
    for (const f of holos.slice(0, 4)) w.breakFoe(f, a, 'fire');
    w.step();
    ok(w.state.trial, 'four breaks are not enough');
    w.breakFoe(holos[4], a, 'ice'); w.step();
    ok(ends(w) && ends(w).won && HO.questReady(a.sheet, 'k_erudition'), 'five breaks pass the exam');
    at(w, a, 'herta_puppet');
    w.cmd({ seat: 0, t: 'turnIn', q: 'k_erudition', trace: 'e_chain' }); w.step();
    a.sheet.learned.e_cascade = 1; a.res = 9999;
    for (let i = 0; i < 5; i++) w.addFoe('baryon', { x: a.x + 6 + (i % 2), z: a.z + i - 2 }, 9);
    const tgt = w.foes().filter(f => f.id === 'baryon' && !f.trial).sort((p, q) => p.uid - q.uid)[0];
    a.yaw = HO.wrapAngle(Math.atan2(tgt.x - a.x, -(tgt.z - a.z)));
    w.cmd({ seat: 0, t: 'cast', ab: 'e_cascade', uid: tgt.uid }); w.run(T.hz * 3);
    const hits = new Set(w.events.concat().filter(e => e.k === 'dmg').map(e => e.uid));
    ok(w.foes().filter(f => f.id === 'baryon' && f.hp < w.stat(f, 'maxHp')).length >= 4, 'Chain Reaction lets Cascade reach four foes');
    ok(hits, 'cascade events seen');
  }

  {
    const [w, a] = hero('control', 'erudition', 10);
    at(w, a, 'herta_puppet');
    w.cmd({ seat: 0, t: 'accept', q: 'k_erudition' }); w.step();
    const pult = at(w, a, 'trial_herta');
    w.cmd({ seat: 0, t: 'use', uid: pult.uid }); w.step();
    for (let i = 0; i < T.hz * 92 && !ends(w); i++) w.step();
    ok(ends(w) && !ends(w).won && ends(w).why === 'time', 'the exam runs out after 90 seconds');
  }

  {
    const [w, a] = hero('base', 'abundance', 10);
    at(w, a, 'joanna');
    w.cmd({ seat: 0, t: 'accept', q: 'k_abundance' }); w.step();
    ok(a.sheet.quests.k_abundance, 'Joanna gives the night shift');
    const btn = at(w, a, 'trial_joanna');
    w.cmd({ seat: 0, t: 'use', uid: btn.uid }); w.step();
    const wards = w.state.actors.filter(n => n.ward);
    ok(wards.length === 3 && wards.every(n => n.hp < w.stat(n, 'maxHp')), 'three wounded lie on the beds');
    for (let i = 0; i < T.hz * 7 && !w.events.some(e => e.k === 'bleed'); i++) w.step();
    ok(w.events.some(e => e.k === 'bleed'), 'wounds open up over time');
    a.x = -36; a.z = 22;
    const low = wards.slice().sort((p, q) => p.hp - q.hp)[0], h0 = low.hp;
    a.yaw = 0;
    w.cmd({ seat: 0, t: 'cast', ab: 'a_heal', uid: low.uid }); w.run(T.hz * 3);
    ok(low.hp > h0, 'Healing works on the wounded');
    for (let i = 0; i < T.hz * 125 && !ends(w); i++) {
      for (const n of w.state.actors) if (n.ward) n.hp = w.stat(n, 'maxHp');
      for (const f of w.foes()) if (f.trial && !f.dead && w.state.tick % T.hz === 0) w.kill(f, a);
      w.step();
    }
    ok(ends(w) && ends(w).won, 'keeping everyone alive for two minutes wins the night shift');
    at(w, a, 'joanna');
    w.cmd({ seat: 0, t: 'turnIn', q: 'k_abundance', trace: 'a_quick' }); w.step();
    ok(a.sheet.learned.a_ult && a.sheet.trace === 'a_quick', 'Mercy of Yaoshi is learned');
    w.cmd({ seat: 0, t: 'cast', ab: 'a_heal', uid: a.uid }); w.step();
    near((a.cast.end - a.cast.start) / T.hz, 2, 0.06, 'Quick Help shortens Healing to 2 s');
    a.cast = null;
    const b = w.addHero(1, { sheet: HO.newSheet({ id: 'h2', name: 'Лань', path: 'abundance', level: 10, learnAll: true }) });
    b.sheet.trace = 'a_bloom'; b.x = a.x; b.z = a.z;
    w.cmd({ seat: 1, t: 'cast', ab: 'a_sprout', uid: b.uid }); w.step();
    const sp = b.auras.find(x => x.key === 'sprout');
    near((sp.until - w.state.tick) / T.hz, 18, 0.1, 'Rich Sprouts makes Sprout last 18 s');
  }

  {
    const [w, a] = hero('seclusion', 'abundance', 9, { learnAll: true });
    const g = w.foes().find(f => f.id === 'gnawsting');
    a.x = g.x + 2; a.z = g.z; a.hp = 9999; a.base.hp = 9999;
    w.aggro(g, a);
    for (let i = 0; i < T.hz * 40 && !a.auras.some(x => x.key === 'poison'); i++) w.step();
    ok(a.auras.some(x => x.key === 'poison'), 'the Corrosive Stinglet poisons');
    w.cmd({ seat: 0, t: 'cast', ab: 'a_cleanse', uid: a.uid }); w.run(T.hz * 2);
    ok(w.events.some(e => e.k === 'cleanse') || !a.auras.some(x => x.key === 'poison'), 'Cleanse removes the poison');
  }

  {
    const [w, a] = hero('seclusion', 'destruction', 9, { quiet: true });
    a.sheet.done.i_letter = 1; a.sheet.done.i_creatures = 1;
    a.sheet.quests.i_nests = { prog: [0] };
    const nest = w.state.actors.find(o => o.id === 'nest');
    a.x = nest.x + 1.5; a.z = nest.z;
    const before = w.foes().length;
    w.cmd({ seat: 0, t: 'use', uid: nest.uid }); w.step();
    const adds = w.foes().slice(before);
    ok(adds.length === 2 && adds.every(f => f.id === 'juvsting' && f.once && f.state === 'fight'), 'a nest releases two Stinglets that attack');
    eq(a.sheet.quests.i_nests.prog[0], 1, 'the nest counts for the quest');
    for (const f of adds) w.kill(f, a);
    w.run(T.hz * (C.respawn + 5));
    ok(adds.every(f => f.dead), 'nest Stinglets do not come back');
    a.sheet.quests.i_creatures = { prog: [0, 0, 0] };
    delete a.sheet.done.i_creatures;
    const cr = w.state.actors.find(o => o.id === 'creature_a');
    a.x = cr.x + 1.5; a.z = cr.z;
    const f = w.addFoe('juvsting', { x: a.x + 2, z: a.z }, 9); w.aggro(f, a); w.step();
    w.cmd({ seat: 0, t: 'use', uid: cr.uid }); w.step();
    ok(w.events.some(e => e.k === 'deny' && e.why === 'combat') && !a.sheet.quests.i_creatures.prog[0], 'creatures cannot be calmed in combat');
    w.kill(f, a); a.combatAt = -9999; w.run(T.hz * 2);
    w.cmd({ seat: 0, t: 'use', uid: cr.uid }); w.step();
    eq(a.sheet.quests.i_creatures.prog[0], 1, 'a calm hero calms the creature');
  }

  {
    const [w, a] = hero('control', 'erudition', 4, { quiet: true });
    a.sheet.learned.e_coffee = 1;
    w.cmd({ seat: 0, t: 'cast', ab: 'e_coffee', uid: 0 }); w.run(T.hz * 4);
    eq(HO.bagCount(a.sheet, 'coffee'), 2, 'Brew Coffee makes two cups');
    eq(HO.rankLevel('a_sprout', 2), 10, 'Sprout gets its second rank at level 10');
    for (const p of HO.PATH_IDS) eq(HO.pathAbilities(p).reduce((m, id) => { let c = 0; for (let r = 1; r <= HO.maxRank(id); r++) if (!HO.ABILITIES[id].ult && !HO.ABILITIES[id].auto && HO.rankLevel(id, r) > 1) c += HO.trainCost(HO.rankLevel(id, r)); return m + c; }, 0), 2688, p + ': lessons up to level 10 cost 2688 credits');
    eq(HO.killCredits(9, false), 8, 'a level 9 foe gives 8 credits');
  }

  {
    const [w, a] = hero('storage2', 'erudition', 8);
    const door = w.state.actors.find(o => o.id === 'seclusion_door');
    a.x = door.x + 1.5; a.z = door.z;
    w.cmd({ seat: 0, t: 'use', uid: door.uid }); w.step();
    ok(w.events.some(e => e.k === 'deny' && e.text && e.text.includes('заперта')), 'the Isolated Zone door is locked at first');
    a.sheet.done.u_door = 1;
    w.cmd({ seat: 0, t: 'use', uid: door.uid }); w.step();
    ok(w.events.some(e => e.k === 'travel' && e.zone === 'seclusion'), 'the letter from Herta opens the door');
    a.sheet.bagSize = HO.BAG_MAX; HO.normSheet(a.sheet);
    a.sheet.bag[20] = { id: 'head3s', n: 1, dur: 100 };
    w.cmd({ seat: 0, t: 'equip', slot: 20 }); w.step();
    eq(a.sheet.gear.head && a.sheet.gear.head.id, 'head3s', 'extended bag cells can be used');
  }
}

{
  const lvl10 = (path, zone, extra) => {
    const sh = HO.newSheet({ id: 'h1', name: 'Мира', race: 'human', path, level: 10, learnAll: true });
    for (const [s, id] of [['cone', HO.PATH_CONE3[path]], ['head', 'head3s'], ['hands', 'hands3s'], ['body', 'body3s'], ['feet', 'feet3s']]) sh.gear[s] = { id, dur: 100 };
    Object.assign(sh, extra || {});
    const w = new HO.World({ seed: 11, zone, foes: false, day: 5 });
    const a = w.addHero(0, { sheet: sh });
    a.sheet.lvl = 10; w.levelUp(a);
    return [w, a];
  };
  const beaconOf = (w, a, id) => { const o = w.state.actors.find(x => x.id === id); const nav = w.nav(); const p = [[1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]].find(([dx, dz]) => nav.walkable(o.x + dx, o.z + dz)); a.x = o.x + p[0]; a.z = o.z + p[1]; return o; };

  {
    const [w, a] = lvl10('destruction', 'storage');
    const b = beaconOf(w, a, 'party_beacon');
    w.cmd({ seat: 0, t: 'use', uid: b.uid }); w.step();
    ok(!w.state.party && w.events.some(e => e.k === 'deny' && e.text && e.text.includes('групповые')), 'companions come only for group quests');
    a.sheet.quests.t_trampler = { prog: [0] };
    w.cmd({ seat: 0, t: 'use', uid: b.uid }); w.step();
    const mates = w.partyOf(a).filter(h => h !== a);
    ok(w.state.party && mates.length === 2, 'the beacon calls two companions');
    eq(mates.map(h => h.companion).sort().join(), 'herta,joanna', 'a Destruction hero gets the Herta puppet and Joanna');
    ok(mates.every(h => h.lvl === 10 && h.sheet.gear.cone && h.sheet.learned[h.path[0] + '_ult']), 'companions match the hero level, wear gear and know their Path');
    ok(w.events.some(e => e.k === 'say'), 'companions speak when they arrive');
    w.cmd({ seat: 0, t: 'order', o: 'hold' }); w.step();
    ok(w.state.party.order === 'hold' && w.state.party.hold, 'orders reach the party');
    const f = w.addFoe('reaver', { x: a.x + 4, z: a.z }, 9);
    w.cmd({ seat: 0, t: 'mark', uid: f.uid, m: 'first' }); w.step();
    eq(w.state.party.first, f.uid, 'the First Target mark is set');
    w.cmd({ seat: 0, t: 'mark', uid: f.uid, m: 'stop' }); w.step();
    ok(w.state.party.stop === f.uid && !w.state.party.first, 'one foe carries one mark');
    w.cmd({ seat: 0, t: 'order', o: 'assist' }); w.step();
    const herta = mates.find(h => h.companion === 'herta');
    w.aggro(f, herta);
    const xp0 = a.sheet.xp, kills0 = a.sheet.kills;
    for (let i = 0; i < T.hz * 60 && !f.dead; i++) w.step();
    ok(f.dead, 'companions defeat a foe on their own');
    ok(a.sheet.kills === kills0 + 1 && f.loot[a.uid] && !mates.some(h => f.loot[h.uid]), 'the kill and the loot go to the hero, not to companions');
    ok(xp0 === a.sheet.xp, 'a level 10 hero gets no experience, companions get none either');
    const ar = w.addHero(3, { sheet: HO.newSheet({ id: 'x', name: 'Тест', path: 'abundance', level: 10 }) });
    ok(ar, 'other seats stay free');
    herta.hp = 0; w.kill(herta, null);
    w.run(T.hz * 10);
    ok(!herta.dead && herta.hp > 0 && Math.hypot(herta.x - a.x, herta.z - a.z) < 4, 'a fallen companion gets up next to the hero after a calm moment');
    w.cmd({ seat: 0, t: 'use', uid: b.uid }); w.step();
    ok(!w.state.party && !w.heroes().some(h => h.companion), 'using the beacon again sends the companions home');
  }

  {
    const [w, a] = lvl10('erudition', 'incubator');
    const b = beaconOf(w, a, 'dungeon_beacon');
    w.cmd({ seat: 0, t: 'use', uid: b.uid }); w.step();
    eq(w.partyOf(a).filter(h => h !== a).map(h => h.companion).sort().join(), 'arlan,joanna', 'an Erudition hero gets Arlan and Joanna');
    const cul = w.addFoe('culture', { x: a.x, z: a.z - 6 }, 10);
    const sk = w.addFoe('skaracabaz', { x: a.x + 20, z: a.z - 20 }, 10);
    eq(Math.round(w.stat(sk, 'maxHp')), Math.round((C.foeHp + C.foeHpLvl * 9) * 15 * 1.7), 'boss health ignores the dungeon multiplier and uses its own');
    w.aggro(cul, a);
    w.run(T.hz * 14);
    const adds = w.foes().filter(x => x.parent === cul.uid);
    ok(adds.length >= 2 && adds.every(x => x.once), 'the Culture summons Stinglets that never respawn');
    ok(w.events.concat().length >= 0, 'events flow');
    w.kill(cul, a);
    ok(adds.every(x => x.dead), 'summoned Stinglets wither with their master');
    w.dismissParty();
    const t0 = w.state.tick;
    sk.state = 'idle'; w.aggro(sk, a);
    eq(sk.lifeEnd, t0 + T.hz * 240, 'the clone lifespan starts with the fight');
    w.kill(sk, a);
    const chest = w.state.actors.find(o => o.chest);
    ok(chest && chest.chest.bonus, 'an early victory leaves the bonus chest');
    a.x = chest.x; a.z = chest.z + 1.5;
    const credits0 = a.sheet.credits;
    w.cmd({ seat: 0, t: 'use', uid: chest.uid }); w.step();
    const got = w.events.find(e => e.k === 'chest');
    ok(got && got.bonus && got.items.includes('cone_e4') && a.sheet.credits === credits0 + 30 && a.sheet.chestDay === 5, 'the bonus chest gives a 4-star cone of the Path once a day');
    w.cmd({ seat: 0, t: 'use', uid: chest.uid }); w.step();
    ok(denied(w, 'nothing'), 'each hero opens the chest once');
    const w2 = new HO.World({ seed: 12, zone: 'incubator', foes: false, day: 5 });
    const b2 = w2.addHero(0, { sheet: a.sheet });
    const sk2 = w2.addFoe('skaracabaz', { x: 0, z: -128 }, 10);
    b2.base.hp = 1e7; b2.hp = 1e7; b2.x = 0; b2.z = -124;
    w2.aggro(sk2, b2); w2.run(T.hz * 241);
    ok(sk2.dead && sk2.crumbled, 'the clone crumbles after four minutes');
    const ch2 = w2.state.actors.find(o => o.chest);
    ok(ch2 && !ch2.chest.bonus, 'a crumbled clone leaves the plain chest');
    b2.x = ch2.x; b2.z = ch2.z + 1.5;
    w2.cmd({ seat: 0, t: 'use', uid: ch2.uid }); w2.step();
    const g2 = w2.events.find(e => e.k === 'chest');
    ok(g2 && !g2.bonus && g2.items.length === 1, 'the plain chest gives one relic');
  }

  {
    const [w, a] = lvl10('destruction', 'incubator');
    const wd = w.addFoe('warden', { x: a.x, z: a.z - 5, yaw: 0 }, 10);
    w.aggro(wd, a);
    w.startPrep(wd, a);
    ok(wd.prep.kind === 'cone' && w.inPrep(wd.prep, a), 'the Purge cone covers the hero in front of the Warden');
    ok(!w.inPrep(wd.prep, { x: wd.x, z: wd.z - 8 }), 'the cone does not reach behind the Warden');
    wd.prep = null; wd.hp = w.stat(wd, 'maxHp') * 0.4; wd.prepNext = 1;
    w.startPrep(wd, a);
    ok(wd.prep.kind === 'circles' && wd.prep.pts.length >= 1, 'below half health the Warden marks circles under the heroes');
    const s = w.addFoe('skaracabaz', { x: a.x + 3, z: a.z }, 10);
    w.aggro(s, a); w.startPrep(s, a);
    ok(s.prep.kind === 'all' && w.inPrep(s.prep, { x: 999, z: 999 }), 'the Wings hit everyone unless broken');
    a.sheet.gear.head = { id: 'rel3_head', dur: 100 };
    const atk1 = w.stat(a, 'atk');
    a.sheet.gear.hands = { id: 'rel4_hands', dur: 100 };
    near(w.stat(a, 'atk'), (atk1 / (1 + w.auraSum(a, 'atkP')) + 15 - 11) * (1 + w.auraSum(a, 'atkP') + 0.12), 0.01, 'two pieces of the Wheat Musketeer give attack +12%');
  }

  {
    const [w, a] = lvl10('erudition', 'seclusion');
    a.sheet.quests.i_swarm = { prog: [0] };
    const b = beaconOf(w, a, 'party_beacon');
    w.cmd({ seat: 0, t: 'use', uid: b.uid }); w.step();
    ok(w.state.party, 'the Nutrient beacon calls companions for the Swarm Invasion');
    const p = w.state.actors.find(x => x.id === 'trial_herta');
    ok(!p, 'trial objects stay in their own zones');
  }
}

{
  const sheet = HO.newSheet({ id: 'h1', name: 'Мира', race: 'human', path: 'abundance', level: 10, learnAll: true });
  const w = new HO.World({ seed: 21, zone: 'control', foes: false, day: 9 });
  const a = w.addHero(0, { sheet }); a.sheet.lvl = 10; w.levelUp(a);
  const vu = w.state.actors.find(o => o.id === 'vu_machine');
  a.x = vu.x; a.z = vu.z + 1.5;
  w.cmd({ seat: 0, t: 'use', uid: vu.uid }); w.step();
  ok(w.events.some(e => e.k === 'deny' && e.text && e.text.includes('допуск')), 'the Virtual Universe machine waits for the Echo of War quest');
  ok(!HO.questAvailable(a.sheet, 'k_echo'), 'the Echo of War comes after the Incubator');
  a.sheet.done.i_incubator = 1;
  ok(HO.questAvailable(a.sheet, 'k_echo'), 'the Herta puppet offers the Echo of War after the Incubator');
  a.sheet.quests.k_echo = { prog: [0] };
  w.cmd({ seat: 0, t: 'use', uid: vu.uid }); w.step();
  ok(w.events.some(e => e.k === 'travel' && e.zone === 'echo'), 'the machine takes the hero into the Echo of War');
  const e = new HO.World({ seed: 22, zone: 'echo', foes: false, day: 9 });
  const b = e.addHero(0, { sheet: a.sheet }); b.base.hp = 1e7; b.hp = 1e7;
  const beast = e.addFoe('doomsday', { x: 0, z: -14 }, 10);
  b.x = 0; b.z = -8;
  e.aggro(beast, b); e.run(T.hz * 30);
  ok(e.foes().filter(f => f.parent === beast.uid).length === 2, 'the Call of the Legion brings two Antibaryons in the first phase');
  beast.hp = e.stat(beast, 'maxHp') * 0.45; e.run(T.hz * 40);
  ok(beast.phase2 && beast.auras.some(x => x.key === 'awake'), 'below half health the Beast awakens');
  ok(e.foes().filter(f => f.parent === beast.uid).length >= 3, 'the awakened Beast calls the Legion by three');
  beast.prep = null; beast.prepNext = 0; e.startPrep(beast, b);
  ok(['all', 'circles'].includes(beast.prep.kind) && (beast.prep.kind !== 'all' || beast.prep.end - beast.prep.start === T.hz * 4), 'in the second phase the antimatter takes 4 s and circles appear');
  e.kill(beast, b);
  const L = beast.loot[b.uid].items.map(x => x.id);
  ok(L.includes('cone_a4') && L.filter(id => id.startsWith('rel4_')).length === 2 && b.sheet.echoWin && b.sheet.echoDay === 9, 'the first victory gives the 4-star cone and the daily reward gives two 4-star relics');
  const e2 = new HO.World({ seed: 23, zone: 'echo', foes: false, day: 9 });
  const b2 = e2.addHero(0, { sheet: b.sheet });
  const beast2 = e2.addFoe('doomsday', { x: 0, z: -14 }, 10);
  b2.x = 0; b2.z = -8; e2.aggro(beast2, b2); e2.kill(beast2, b2);
  ok(!beast2.loot[b2.uid].items.some(x => HO.ITEMS[x.id].q === 4), 'the same day and a known cone give no 4-star loot');
  b2.sheet.quests.k_echo = { prog: [1] };
  const w3 = new HO.World({ seed: 24, zone: 'control', foes: false });
  const c3 = w3.addHero(0, { sheet: b2.sheet });
  const pup = w3.npcById('herta_puppet'); c3.x = pup.x + 1.5; c3.z = pup.z;
  w3.cmd({ seat: 0, t: 'turnIn', q: 'k_echo' }); w3.step();
  eq(c3.sheet.title, 'Свидетель Пробуждения', 'the Echo of War gives the title Witness of the Awakening');
}

const JOURNEY = { deaths: 30, min: 180, solo: [200, 1500], spare: [500, 1500], results: {}, group: {} };
function journeyBot(race, path, plan, targetLvl, minutes) {
  let w = new HO.World({ seed: 41, zone: HO.START_ZONE[race] });
  let a = w.addHero(0, { sheet: HO.newSheet({ id: 'h1', name: 'Бот', race, path }) });
  const rot = { destruction: ['d_attack', 'd_charge', 'd_rend', 'd_clap', 'd_sunder', 'd_mighty'], abundance: ['a_attack', 'a_wither', 'a_smite'], erudition: ['e_attack', 'e_prep', 'e_ice', 'e_fire', 'e_cascade'] }[path];
  const st = { deaths: 0, route: null, routeFor: '', sitting: false, zones: 1, ticks: 0, log: [] };
  const npcZone = id => HO.WORLD_ZONES.find(z => HO.ZONES[z].npcs.some(n => n.id === id));
  const objZone = id => HO.WORLD_ZONES.find(z => HO.ZONES[z].objects.some(o => o.id === id));
  const foeZone = (ids, prefer) => (prefer && HO.ZONES[prefer].foes.some(f => ids.includes(f.id)) ? prefer : HO.WORLD_ZONES.find(z => HO.ZONES[z].foes.some(f => ids.includes(f.id) && f.lvl <= a.sheet.lvl + 2)));
  const step = () => {
    w.step();
    st.ticks++;
    const tr = w.events.find(e => e.k === 'travel' && e.uid === a.uid);
    if (tr) {
      const sh = HO.copy(a.sheet);
      w = new HO.World({ seed: 41 + st.zones++, zone: tr.zone });
      a = w.addHero(0, { sheet: sh });
      a.x = tr.x; a.z = tr.z; a.yaw = tr.yaw;
      st.route = null;
      st.log.push(tr.zone);
    }
  };
  const go = (x, z, near) => {
    const d = Math.hypot(x - a.x, z - a.z);
    if (d <= (near || 2)) { w.cmd({ seat: 0, t: 'move', f: 0, s: 0, r: 0 }); return true; }
    const key = w.zone.id + Math.round(x) + ':' + Math.round(z) + ':' + JSON.stringify(w.state.gates);
    if (st.routeFor !== key || !st.route || !st.route.length || st.ticks % 40 === 0) {
      st.route = w.nav().path(a.x, a.z, x, z);
      st.routeFor = key;
      if (!st.route) {
        const gate = w.state.actors.find(o => { const d = o.kind === 'obj' && w.objDef(o); return d && d.act === 'gate' && !w.state.gates[d.gate] && (!d.need || HO.bagCount(a.sheet, d.need)) && w.nav().path(a.x, a.z, o.x, o.z); });
        if (gate && Math.hypot(gate.x - a.x, gate.z - a.z) < 2.5) { w.cmd({ seat: 0, t: 'use', uid: gate.uid }); st.route = []; return false; }
        st.route = gate ? w.nav().path(a.x, a.z, gate.x, gate.z) : [];
        st.routeFor = '';
      }
    }
    while (st.route.length > 1 && Math.hypot(st.route[0][0] - a.x, st.route[0][1] - a.z) < 0.8) st.route.shift();
    const p = st.route[0] || [x, z];
    w.face(a, { x: p[0], z: p[1] });
    w.cmd({ seat: 0, t: 'move', f: 1, s: 0, r: 0 });
    return false;
  };
  const goZone = zone => {
    const here = w.zone.id, up = zone === 'storage2' || zone === 'seclusion';
    const useObj = id => { const o = w.state.actors.find(x => x.id === id); if (go(o.x, o.z, 2.5)) w.cmd({ seat: 0, t: 'use', uid: o.uid }); };
    if (here === 'seclusion') return useObj('seclusion_exit');
    if (here === 'storage2') return useObj(zone === 'seclusion' ? 'seclusion_door' : 'stairs_down');
    if (up && here === 'storage') return useObj('stairs_up');
    const lift = w.state.actors.find(x => x.kind === 'obj' && x.id === 'lift');
    if (go(lift.x, lift.z + 2.5, 2.5)) w.cmd({ seat: 0, t: 'lift', zone: up ? 'storage' : zone });
  };
  const ULT = { destruction: 'd_ult', abundance: 'a_ult', erudition: 'e_ult' }[path];
  const elemOrder = f => (HO.FOES[f.id].weak.includes('ice') ? ['e_ice', 'e_fire'] : ['e_fire', 'e_ice']);
  const fight = f => {
    if (a.cast && path !== 'destruction') { w.cmd({ seat: 0, t: 'move', f: 0, s: 0, r: 0 }); return; }
    const d = Math.hypot(f.x - a.x, f.z - a.z), reach = path === 'destruction' ? 2.4 : 20;
    if (a.target !== f.uid) w.cmd({ seat: 0, t: 'target', uid: f.uid });
    if (d > reach || !w.los(a, f)) { go(f.x, f.z, path === 'destruction' ? 2.2 : 6); if (path === 'destruction' && d < 25 && d > 8) w.cmd({ seat: 0, t: 'cast', ab: 'd_charge', uid: f.uid }); return; }
    w.face(a, f);
    w.cmd({ seat: 0, t: 'move', f: 0, s: 0, r: 0 });
    if (a.cast || st.ticks % 2) return;
    if (path === 'abundance' && a.hp / w.stat(a, 'maxHp') < 0.5) { w.cmd({ seat: 0, t: 'cast', ab: a.sheet.learned.a_sprout && !a.auras.some(x => x.key === 'sprout') ? 'a_sprout' : 'a_heal', uid: a.uid }); return; }
    if (a.hp / w.stat(a, 'maxHp') < 0.3) { const s = a.sheet.bag.findIndex(x => x && x.id === 'medkit'); if (s >= 0) w.cmd({ seat: 0, t: 'item', slot: s }); }
    if (path === 'abundance' && a.auras.some(x => x.key === 'poison') && a.sheet.learned.a_cleanse) w.cmd({ seat: 0, t: 'cast', ab: 'a_cleanse', uid: a.uid });
    if (a.sheet.learned[ULT] && a.energy >= C.energyMax) w.cmd({ seat: 0, t: 'cast', ab: ULT, uid: ULT === 'd_ult' ? f.uid : a.uid });
    const order = path === 'erudition' ? ['e_attack', 'e_prep', ...elemOrder(f), 'e_cascade'] : rot;
    for (const id of order) w.cmd({ seat: 0, t: 'cast', ab: id, uid: f.uid });
  };
  const trialAct = () => {
    const T = w.state.trial, def = HO.TRIALS[T.id], foes = w.foes().filter(f => f.trial && !f.dead);
    const wards = w.state.actors.filter(n => n.ward && !n.dead);
    const nearWard = f => Math.min(99, ...wards.map(n => Math.hypot(n.x - f.x, n.z - f.z)));
    if (path === 'abundance') {
      const low = wards.slice().sort((p, q) => p.hp / w.stat(p, 'maxHp') - q.hp / w.stat(q, 'maxHp'))[0];
      const meK = a.hp / w.stat(a, 'maxHp');
      if (a.cast) return;
      if (a.sheet.learned[ULT] && a.energy >= C.energyMax && (meK < 0.5 || (low && low.hp / w.stat(low, 'maxHp') < 0.4))) { w.cmd({ seat: 0, t: 'cast', ab: ULT, uid: a.uid }); }
      if (meK < 0.4) { fight(foes[0] || a); return; }
      if (low && low.hp / w.stat(low, 'maxHp') < 0.65) {
        if (Math.hypot(low.x - a.x, low.z - a.z) > 18 || !w.los(a, low)) { go(low.x, low.z, 6); return; }
        w.cmd({ seat: 0, t: 'move', f: 0, s: 0, r: 0 });
        w.cmd({ seat: 0, t: 'cast', ab: low.auras.some(x => x.key === 'sprout') ? 'a_heal' : 'a_sprout', uid: low.uid });
        return;
      }
    }
    let f = null;
    if (path === 'erudition') {
      f = nearest(foes.filter(x => !T.broke.includes(x.uid)));
      if (!f) return;
      if (a.target !== f.uid) w.cmd({ seat: 0, t: 'target', uid: f.uid });
      const d = Math.hypot(f.x - a.x, f.z - a.z);
      if (d > 20 || !w.los(a, f)) { go(f.x, f.z, 6); return; }
      w.face(a, f);
      w.cmd({ seat: 0, t: 'move', f: 0, s: 0, r: 0 });
      if (a.cast || st.ticks % 2) return;
      if (a.sheet.learned[ULT] && a.energy >= C.energyMax && foes.filter(x => !T.broke.includes(x.uid) && Math.hypot(x.x - a.x, x.z - a.z) < 9).length >= 2) w.cmd({ seat: 0, t: 'cast', ab: ULT, uid: 0 });
      for (const id of ['e_attack', ...elemOrder(f)]) w.cmd({ seat: 0, t: 'cast', ab: id, uid: f.uid });
      return;
    }
    else {
      const raid = foes.filter(x => x.state === 'raid').sort((p, q) => nearWard(p) - nearWard(q));
      f = raid[0] || nearest(foes.filter(x => x.state === 'fight'));
      if (f && path === 'destruction' && f.state === 'raid' && Math.hypot(f.x - a.x, f.z - a.z) < 10) w.cmd({ seat: 0, t: 'cast', ab: 'd_taunt', uid: f.uid });
      if (path === 'destruction' && foes.filter(x => Math.hypot(x.x - a.x, x.z - a.z) < 8).length >= 2) w.cmd({ seat: 0, t: 'cast', ab: 'd_clap', uid: 0 });
    }
    if (f) fight(f);
    else if (wards.length) go(wards[0].x, wards[0].z, 4);
    else go(def.center.x, def.center.z, 4);
  };
  const nearest = list => list.sort((p, q) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(q.x - a.x, q.z - a.z))[0];
  const train = () => {
    const sh = a.sheet;
    const want = HO.trainList(sh).find(r => !r.owned && r.ready && sh.credits >= r.cost + 40 && r.lvl <= sh.lvl);
    if (!want) return false;
    const terminal = HO.ABILITIES[want.id].lvl <= 4 && want.rank === 1 && w.state.actors.find(n => n.kind === 'npc' && n.role === 'trainer');
    const teacher = HO.PATH_TRAINER[path];
    const here = terminal || w.state.actors.find(n => n.kind === 'npc' && n.id === teacher);
    if (!here) { goZone(npcZone(teacher)); return true; }
    if (go(here.x, here.z, 3)) w.cmd({ seat: 0, t: 'learn', ab: want.id });
    return true;
  };
  const done = () => plan.every(q => a.sheet.done[q]) && a.sheet.lvl >= targetLvl;
  for (; st.ticks < minutes * 60 * T.hz && !done();) {
    const sh = a.sheet;
    if (a.dead) { st.deaths++; w.cmd({ seat: 0, t: 'release', mode: st.ticks - (st.diedAt || -1e9) < 120 * T.hz ? 'medic' : 'ghost' }); st.diedAt = st.ticks; step(); continue; }
    if (a.ghost) {
      const live = w.foes().filter(f => !f.dead), nav = w.nav();
      let spot = [a.corpse.x, a.corpse.z], best = -1;
      for (let i = 0; i < 16; i++) {
        const x = a.corpse.x + (C.reviveRange - 1) * H.HD.N.cos(i * Math.PI / 8), z = a.corpse.z + (C.reviveRange - 1) * H.HD.N.sin(i * Math.PI / 8);
        if (!nav.walkable(x, z)) continue;
        const room = Math.min(99, ...live.map(f => Math.hypot(f.x - x, f.z - z)));
        if (room > best) { best = room; spot = [x, z]; }
      }
      if (go(spot[0], spot[1], 0.8)) w.cmd({ seat: 0, t: 'revive' });
      step(); continue;
    }
    if (w.state.trial) { st.sitting = false; trialAct(); step(); continue; }
    const engaged = w.foes().filter(f => f.state === 'fight' && f.threat[a.uid] !== undefined && !f.dead && !HO.FOE_RT[f.id].flee);
    if (engaged.length) { st.sitting = false; fight(engaged[0]); step(); continue; }
    const hpK = a.hp / w.stat(a, 'maxHp'), resK = a.base.pool ? a.res / a.base.pool : 1;
    const corpse = !st.sitting && hpK > 0.6 && w.foes().find(f => f.dead && f.loot && f.loot[a.uid] && Math.hypot(f.x - a.x, f.z - a.z) < 30);
    if (corpse) { if (go(corpse.x, corpse.z, 2.2)) w.cmd({ seat: 0, t: 'loot', uid: corpse.uid }); step(); continue; }
    if ((st.sitting ? hpK < 0.98 || resK < 0.95 : hpK < 0.9 || resK < 0.6) || a.auras.some(x => x.key === 'weak')) {
      const safe = w.foes().every(f => (f.dead && f.respawnAt - w.state.tick > 30 * T.hz) || HO.FOE_RT[f.id].flee || Math.hypot((f.dead ? f.home.x : f.x) - a.x, (f.dead ? f.home.z : f.z) - a.z) > 16);
      if (!safe) { st.sitting = false; go(w.zone.spawn.x, w.zone.spawn.z, 3); step(); continue; }
      if (!st.sitting || (!a.sit && st.ticks % 20 === 0)) {
        w.cmd({ seat: 0, t: 'move', f: 0, s: 0, r: 0 });
        const food = sh.bag.findIndex(x => x && x.id === (hpK < 0.5 ? 'lunch' : resK < 0.4 ? 'coffee' : '-'));
        if (food >= 0 && !st.sitting) w.cmd({ seat: 0, t: 'item', slot: food }); else w.cmd({ seat: 0, t: 'sit', on: true });
        st.sitting = true;
      }
      step(); continue;
    }
    st.sitting = false;
    for (let s = 0; s < sh.bag.length; s++) {
      const it = sh.bag[s] && HO.ITEMS[sh.bag[s].id];
      if (it && it.kind === 'gear' && HO.canEquip(sh, sh.bag[s].id) && (!sh.gear[it.slot] || it.q > HO.ITEMS[sh.gear[it.slot].id].q)) w.cmd({ seat: 0, t: 'equip', slot: s });
    }
    const worn = HO.GEAR_SLOTS.some(s => sh.gear[s] && sh.gear[s].dur < 35);
    if ((worn || (HO.repairCost(sh) > 20 && w.zone.id === 'control')) && sh.credits >= HO.repairCost(sh) + 20) {
      const r = w.npcById('wen_shici');
      if (!r) goZone('control'); else if (go(r.x, r.z, 3)) w.cmd({ seat: 0, t: 'repair', uid: r.uid });
      step(); continue;
    }
    if (HO.bagFree(sh) < 3 || (sh.bagSize === HO.BAG_SIZE && sh.credits > HO.buyPrice(sh, 'bagx') + 200)) {
      const v = w.state.actors.find(n => n.kind === 'npc' && n.id === 'wen_shici');
      if (!v) { goZone('control'); step(); continue; }
      if (go(v.x, v.z, 3)) {
        w.cmd({ seat: 0, t: 'sellJunk', uid: v.uid });
        sh.bag.forEach((s, i) => { const it = s && HO.ITEMS[s.id]; if (it && it.kind === 'gear' && (!HO.canEquip(sh, s.id) || (sh.gear[it.slot] && HO.ITEMS[sh.gear[it.slot].id].q >= it.q))) w.cmd({ seat: 0, t: 'sell', uid: v.uid, slot: i }); });
        if (sh.bagSize === HO.BAG_SIZE && sh.credits > HO.buyPrice(sh, 'bagx') + 200) { w.cmd({ seat: 0, t: 'buy', uid: v.uid, item: 'bagx' }); step(); const bx = sh.bag.findIndex(s => s && s.id === 'bagx'); if (bx >= 0) w.cmd({ seat: 0, t: 'item', slot: bx }); }
      }
      step(); continue;
    }
    const shop = w.state.actors.find(n => n.kind === 'npc' && n.role === 'vendor' && (w.npcDef(n).stock || []).includes('lunch'));
    const want = path === 'destruction' ? ['lunch'] : ['lunch', 'coffee'];
    const short = want.find(id => HO.bagCount(sh, id) < 1);
    const saving = HO.trainList(sh).filter(r => !r.owned && r.lvl <= sh.lvl + 2).reduce((m, r) => m + r.cost, 0);
    if (shop && short && sh.credits > saving + 120 && HO.bagFree(sh) > 3) {
      if (go(shop.x, shop.z, 3)) for (let i = 0; i < 3; i++) w.cmd({ seat: 0, t: 'buy', uid: shop.uid, item: short });
      step(); continue;
    }
    if (train()) { step(); continue; }
    const next = plan.find(q => !sh.done[q]);
    const qid = next && (sh.quests[next] || HO.questAvailable(sh, next)) ? next : null;
    if (!qid) {
      const good = zz => HO.ZONES[zz].foes.filter(f => !f.flee && !HO.FOES[f.id].elite && f.lvl <= sh.lvl + 1 && HO.killXp(sh.lvl, f.lvl) >= HO.killXp(sh.lvl, sh.lvl) * 0.6).length;
      const zid = good(w.zone.id) >= 3 ? w.zone.id : HO.WORLD_ZONES.slice().sort((p, q2) => good(q2) - good(p))[0];
      if (zid !== w.zone.id) { goZone(zid); step(); continue; }
      const f = nearest(w.foes().filter(x => !x.dead && !x.elite && x.state !== 'evade' && !HO.FOE_RT[x.id].flee && x.lvl <= sh.lvl + 1 && HO.killXp(sh.lvl, x.lvl) > 0));
      if (f) fight(f);
      step(); continue;
    }
    const q = HO.QUESTS[qid];
    const atNpc = (id, then) => { const zn = npcZone(id); if (zn !== w.zone.id) { goZone(zn); return; } const n = w.npcById(id); if (go(n.x, n.z, 3)) then(n); };
    if (!sh.quests[qid]) { atNpc(q.giver, () => w.cmd({ seat: 0, t: 'accept', q: qid })); step(); continue; }
    if (HO.questReady(sh, qid)) { atNpc(q.turnIn, () => w.cmd({ seat: 0, t: 'turnIn', q: qid, pick: 0, trace: q.reward.trace ? HO.TRACES[path][race === 'human' ? 0 : 1].id : '' })); step(); continue; }
    const gi = q.goals.findIndex((g, i) => HO.questGoalCount(sh, qid, i) < HO.goalNeed(g));
    const g = q.goals[gi];
    if (g.k === 'talk') atNpc(HO.goalNpc(g, sh), n => w.cmd({ seat: 0, t: 'talk', uid: n.uid }));
    else if (g.k === 'travel') goZone(g.zone);
    else if (g.k === 'anchor' || g.k === 'bind') {
      const an = HO.ANCHORS[g.anchor];
      if (an.zone !== w.zone.id) goZone(an.zone);
      else if (go(an.x, an.z + 1.5, 2.5) && g.k === 'bind') w.cmd({ seat: 0, t: 'bind', anchor: g.anchor });
    } else if (g.k === 'scan') {
      const seen = (sh.quests[qid].seen || []);
      const zid = w.zone.id === 'storage2' || w.zone.id === 'storage' ? w.zone.id : 'storage2';
      if (zid !== w.zone.id) goZone(zid);
      else {
        const f = nearest(w.foes().filter(x => !x.dead && !seen.includes(x.id) && x.state !== 'evade' && !x.elite));
        if (f) {
          if (a.target !== f.uid) w.cmd({ seat: 0, t: 'target', uid: f.uid });
          if (go(f.x, f.z, w.los(a, f) ? 20 : 3) && w.los(a, f)) w.cmd({ seat: 0, t: 'item', slot: sh.bag.findIndex(x => x && x.id === 'pistol') });
        } else if (w.zone.id === 'storage2') goZone('storage');
      }
    } else if (g.k === 'use' || (g.k === 'collect' && Object.values(HO.ZONES).some(z => (z.objects || []).some(o => o.give === g.item)))) {
      const oid = g.k === 'use' ? g.obj : HO.WORLD_ZONES.map(z => HO.ZONES[z].objects.find(o => o.give === g.item)).find(Boolean).id;
      const zn = objZone(oid);
      if (zn !== w.zone.id) goZone(zn);
      else {
        const o = nearest(w.state.actors.filter(x => x.kind === 'obj' && x.id === oid && w.state.tick >= x.hiddenUntil));
        if (o && go(o.x, o.z, 2.5)) w.cmd({ seat: 0, t: 'use', uid: o.uid });
      }
    } else if (g.k === 'kill' || g.k === 'collect') {
      const ids = g.k === 'kill' ? [g.foe] : Object.keys(HO.LOOT).filter(f => (HO.LOOT[f].quest || []).some(([i]) => i === g.item));
      const zid = foeZone(ids, q.zone);
      if (zid !== w.zone.id) goZone(zid);
      else { const f = nearest(w.foes().filter(x => ids.includes(x.id) && !x.dead && x.state !== 'evade')); if (f) fight(f); }
    } else if (g.k === 'trial') {
      const def = HO.TRIALS[g.trial];
      if (w.zone.id !== def.zone) goZone(def.zone);
      else {
        const o = w.state.actors.find(x => x.kind === 'obj' && x.id === HO.ZONES[def.zone].objects.find(d => d.act === 'trial' && d.trial === g.trial).id);
        const ready = a.hp / w.stat(a, 'maxHp') > 0.97 && (!a.base.pool || a.res / a.base.pool > 0.95);
        if (!ready) { w.cmd({ seat: 0, t: 'move', f: 0, s: 0, r: 0 }); if (!a.sit) w.cmd({ seat: 0, t: 'sit', on: true }); }
        else if (go(o.x, o.z, 2.5)) {
          if (path === 'erudition') w.cmd({ seat: 0, t: 'cast', ab: 'e_prep', uid: 0 });
          if (path === 'destruction' && a.res < 30) w.cmd({ seat: 0, t: 'cast', ab: 'd_mighty', uid: 0 });
          w.cmd({ seat: 0, t: 'use', uid: o.uid });
        }
      }
    } else if (g.k === 'escort') {
      const ar = w.zone.areas.find(x => x.id === g.area), e = w.npcById(g.npc);
      const cx = (ar.x0 + ar.x1) / 2, cz = (ar.z0 + ar.z1) / 2;
      if (Math.hypot(e.x - a.x, e.z - a.z) > 8) go(e.x, e.z, 3); else go(cx, cz, 2);
    }
    step();
  }
  const sh = a.sheet;
  return { done: plan.filter(q => sh.done[q]).length, of: plan.length, missing: plan.filter(q => !sh.done[q]), lvl: sh.lvl, min: +(st.ticks / T.hz / 60).toFixed(1), deaths: st.deaths, credits: sh.credits, allLessons: HO.trainList(sh).every(x => x.owned), ult: !!sh.learned[ULT], trace: sh.trace, anchors: Object.keys(sh.anchors).length, gear: HO.GEAR_SLOTS.map(s => sh.gear[s] ? HO.ITEMS[sh.gear[s].id].q : 0).join('') };
}

{
  const CITY = ['c_gather', 'c_mentor', 'c_hinkel', 'c_coffee', 'c_peppy', 'c_patrol', 't_atrium', 't_curios', 't_threads', 't_key', 't_distort', 't_gallery', 't_elim', 't_peppy2', 'u_lab', 'u_scan', 'u_bridge', 'u_wings', 'u_door'];
  const SECL = ['i_letter', 'i_center', 'i_creatures', 'i_records', 'i_pharma', 'i_nutrient', 'i_nests'];
  const START = { human: ['b_pass', 'b_checkup', 'b_baryons', 'b_robot', 'b_shards', 'b_blindspot', 'b_lift'], foxian: ['s_dock', 's_pass', 's_power', 's_cargo', 's_trotter', 's_bridge', 's_lift'] };
  for (const race of HO.RACE_IDS) for (const path of HO.PATH_IDS) {
    const r = journeyBot(race, path, [...START[race], ...CITY, ...SECL, HO.CLASS_QUEST[path]], 10, 200);
    ok(r.done === r.of && r.lvl === 10 && r.ult && r.trace && r.deaths <= JOURNEY.deaths && r.min <= JOURNEY.min, race + ' of ' + path + ' goes from level 1 to 10 and passes the class quest: ' + JSON.stringify(r));
    JOURNEY.results[race + ' ' + path] = r.credits;
    ok(r.credits >= JOURNEY.solo[0] && r.credits <= JOURNEY.solo[1], race + ' of ' + path + ' ends level 10 with spare credits after all lessons, before group content: ' + r.credits);
    ok(r.allLessons, race + ' of ' + path + ' could afford every lesson');
  }
}

function groupBot(path, zone, qid, lvl, seed) {
  const q = HO.QUESTS[qid], foeId = q.goals[0].foe, tier = lvl >= 9 ? ['head3s', 'hands3s', 'body3s', 'feet3s'] : ['head3', 'hands3', 'body3', 'feet3'];
  const sheet = HO.newSheet({ id: 'h1', name: 'Бот', race: 'human', path, level: lvl, learnAll: true });
  ['head', 'hands', 'body', 'feet'].forEach((s, i) => { sheet.gear[s] = { id: tier[i], dur: 100 }; });
  sheet.gear.cone = { id: HO.PATH_CONE3[path], dur: 100 };
  sheet.quests[qid] = { prog: [0] };
  const w = new HO.World({ seed, zone });
  const a = w.addHero(0, { sheet });
  a.sheet.lvl = lvl; w.levelUp(a);
  const beacon = w.state.actors.find(o => o.kind === 'obj' && (w.objDef(o) || {}).act === 'party');
  a.x = beacon.x + 1.5; a.z = beacon.z + 1.5;
  let ticks = 0, deaths = 0;
  const c0 = a.sheet.credits;
  const go = (x, z, near) => { a.goal = { x, z, near: near || 1.5 }; w.compMove(a); return Math.hypot(x - a.x, z - a.z) <= (near || 1.5); };
  for (; ticks < T.hz * 60 * 15 && !HO.questReady(a.sheet, qid); ticks++) {
    if (a.dead) { deaths++; w.cmd({ seat: 0, t: 'release' }); w.step(); continue; }
    if (a.ghost) { if (go(a.corpse.x, a.corpse.z, 10)) w.cmd({ seat: 0, t: 'revive' }); w.step(); continue; }
    if (!w.state.party) { if (go(beacon.x, beacon.z + 1.5, 2.5)) w.cmd({ seat: 0, t: 'use', uid: beacon.uid }); w.step(); continue; }
    const party = w.partyOf(a), fighting = w.foes().filter(f => !f.dead && f.state === 'fight' && party.some(h => f.threat[h.uid] !== undefined));
    if (fighting.length) { if (ticks % 4 === 0 || w.dangerAt(a)) w.compThink(a, w.state.party, a, party, fighting); w.compMove(a); w.step(); continue; }
    const frac = h => h.hp / w.stat(h, 'maxHp');
    if (party.some(h => h.dead || frac(h) < 0.9 || (h.base.pool && h.res / h.base.pool < 0.8)) || a.auras.some(x => x.key === 'weak')) { if (!a.sit && !a.cast) w.cmd({ seat: 0, t: 'sit', on: true }); a.goal = null; w.step(); continue; }
    const boss = w.foes().find(x => x.id === foeId && !x.dead);
    if (!boss) { w.step(); continue; }
    const f = w.foes().filter(x => !x.dead && !x.elite && x.state === 'idle' && Math.hypot(x.x - boss.x, x.z - boss.z) < 24).sort((p, r) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(r.x - a.x, r.z - a.z))[0] || boss;
    const reach = path === 'destruction' ? 2.4 : 20;
    if (Math.hypot(f.x - a.x, f.z - a.z) > reach || !w.los(a, f)) { go(f.x, f.z, path === 'destruction' || !w.los(a, f) ? 2 : 18); w.step(); continue; }
    a.goal = null;
    w.cmd({ seat: 0, t: 'move', f: 0, s: 0, r: 0 }); w.face(a, f);
    w.cmd({ seat: 0, t: 'target', uid: f.uid });
    w.cmd({ seat: 0, t: 'cast', ab: path[0] + '_attack', uid: f.uid });
    if (path === 'abundance') w.cmd({ seat: 0, t: 'cast', ab: 'a_wither', uid: f.uid });
    if (path === 'erudition') w.cmd({ seat: 0, t: 'cast', ab: 'e_fire', uid: f.uid });
    w.step();
  }
  for (const f of w.foes()) if (f.dead && f.loot && f.loot[a.uid]) a.sheet.credits += f.loot[a.uid].credits + f.loot[a.uid].items.reduce((m, it) => m + HO.sellPrice(it.id) * (HO.ITEMS[it.id].kind === 'junk' ? 1 : 0), 0);
  return { done: HO.questReady(a.sheet, qid), min: +(ticks / T.hz / 60).toFixed(1), deaths, credits: a.sheet.credits - c0 + (q.reward.credits || 0) };
}

function dungeonBot(race, path, seed, minutes) {
  const sheet = HO.newSheet({ id: 'h1', name: 'Бот', race, path, level: 10, learnAll: true });
  for (const [s, id] of [['cone', HO.PATH_CONE3[path]], ['head', 'head3s'], ['hands', 'hands3s'], ['body', 'body3s'], ['feet', 'feet3s']]) sheet.gear[s] = { id, dur: 100 };
  sheet.trace = HO.TRACES[path][0].id;
  sheet.quests.i_incubator = { prog: [0] };
  sheet.done.i_center = 1;
  HO.bagAdd(sheet, 'medkit', 5);
  const w = new HO.World({ seed, zone: 'incubator', day: 3 });
  const a = w.addHero(0, { sheet });
  const c0 = sheet.credits;
  const st = { ticks: 0, deaths: 0, wipes: 0, boss: {} };
  const all = () => w.partyOf(a);
  const dead = new Set();
  const step = () => {
    w.step(); st.ticks++;
    for (const e of w.events) {
      if (e.k === 'death') {
        const x = w.byUid(e.uid);
        if (x && x.kind === 'foe' && HO.BOSSES.includes(x.id)) { st.boss[x.id] = +(st.ticks / T.hz / 60).toFixed(1); }
        if (x && x.kind === 'hero') { if (x === a) st.deaths++; }
      }
    }
  };
  const beacon = w.state.actors.find(o => o.id === 'dungeon_beacon');
  const go = (x, z, near) => { a.goal = { x, z, near: near || 1.5 }; w.compMove(a); return Math.hypot(x - a.x, z - a.z) <= (near || 1.5); };
  const chestDone = () => w.state.actors.some(o => o.chest && o.opened.includes(a.uid));
  for (; st.ticks < minutes * 60 * T.hz && !chestDone();) {
    if (a.dead) { w.cmd({ seat: 0, t: 'release' }); step(); continue; }
    if (a.ghost) {
      const live = w.foes().filter(f => !f.dead), nav = w.nav();
      let spot = [a.corpse.x, a.corpse.z], best = -1;
      for (let i = 0; i < 16; i++) {
        const x = a.corpse.x + (C.reviveRange - 1) * H.HD.N.sin(i * Math.PI / 8), z = a.corpse.z + (C.reviveRange - 1) * H.HD.N.cos(i * Math.PI / 8);
        if (!nav.walkable(x, z)) continue;
        const room = Math.min(99, ...live.map(f => Math.hypot(f.x - x, f.z - z)));
        if (room > best) { best = room; spot = [x, z]; }
      }
      if (go(spot[0], spot[1], 0.8)) w.cmd({ seat: 0, t: 'revive' });
      step(); continue;
    }
    if (!w.state.party) { if (go(beacon.x, beacon.z + 1.5, 2)) w.cmd({ seat: 0, t: 'use', uid: beacon.uid }); step(); continue; }
    const P = w.state.party, party = all();
    const fighting = w.foes().filter(f => !f.dead && f.state === 'fight' && party.some(h => f.threat[h.uid] !== undefined));
    if (fighting.length || a.dodge) {
      if (st.ticks % 4 === 0 || w.dangerAt(a)) w.compThink(a, P, a, party, fighting);
      w.compMove(a);
      step(); continue;
    }
    const chest = w.state.actors.find(o => o.chest);
    if (chest) { if (go(chest.x, chest.z + 1.5, 2)) w.cmd({ seat: 0, t: 'use', uid: chest.uid }); step(); continue; }
    const corpse = w.foes().find(f => f.dead && f.loot && f.loot[a.uid] && (f.loot[a.uid].items.length || f.loot[a.uid].credits));
    if (corpse) { if (go(corpse.x, corpse.z, 2)) w.cmd({ seat: 0, t: 'loot', uid: corpse.uid }); step(); continue; }
    const frac = h => h.hp / w.stat(h, 'maxHp');
    const tired = party.some(h => h.dead || frac(h) < 0.85 || (h.base.pool && h.res / h.base.pool < 0.7));
    if (tired) {
      if (party.every(h => !h.dead) && !a.sit && !a.cast) { w.cmd({ seat: 0, t: 'move', f: 0, s: 0, r: 0 }); w.cmd({ seat: 0, t: 'sit', on: true }); }
      if (path === 'abundance' && frac(a) < 0.85 && !a.cast) w.cmd({ seat: 0, t: 'cast', ab: 'a_heal', uid: a.uid });
      step(); continue;
    }
    a.goal = null;
    const next = w.foes().filter(f => !f.dead && f.state === 'idle').sort((p, q) => q.z - p.z || p.uid - q.uid)[0];
    if (!next) { step(); continue; }
    const reach = path === 'destruction' ? 2.4 : 22;
    if (Math.hypot(next.x - a.x, next.z - a.z) > reach || !w.los(a, next)) { go(next.x, next.z, path === 'destruction' || !w.los(a, next) ? 2 : 18); step(); continue; }
    w.cmd({ seat: 0, t: 'move', f: 0, s: 0, r: 0 });
    w.face(a, next);
    w.cmd({ seat: 0, t: 'target', uid: next.uid });
    w.cmd({ seat: 0, t: 'cast', ab: path[0] + '_attack', uid: next.uid });
    if (path === 'abundance') w.cmd({ seat: 0, t: 'cast', ab: 'a_wither', uid: next.uid });
    if (path === 'erudition') w.cmd({ seat: 0, t: 'cast', ab: 'e_fire', uid: next.uid });
    step();
  }
  const sk = w.foes().find(f => f.id === 'skaracabaz');
  const junk = a.sheet.bag.reduce((m, it) => m + (it && HO.ITEMS[it.id].kind === 'junk' ? HO.sellPrice(it.id) * it.n : 0), 0);
  return { credits: a.sheet.credits - c0 + junk + HO.QUESTS.i_incubator.reward.credits, done: chestDone(), min: +(st.ticks / T.hz / 60).toFixed(1), deaths: st.deaths, boss: st.boss, early: sk && sk.dead && !sk.crumbled, quest: HO.questReady(a.sheet, 'i_incubator'), loot: a.sheet.bag.filter(Boolean).map(x => x.id).filter(id => HO.ITEMS[id].kind === 'gear') };
}


{
  for (const path of HO.PATH_IDS) for (const [zone, qid, lvl] of [['storage', 't_trampler', 7], ['seclusion', 'i_swarm', 9]]) {
    const r = groupBot(path, zone, qid, lvl, 5);
    ok(r.done && r.deaths <= 2 && r.min <= 10, path + ' with two companions completes the group quest ' + qid + ': ' + JSON.stringify(r));
    JOURNEY.group[path] = (JOURNEY.group[path] || 0) + r.credits;
  }
  for (const path of HO.PATH_IDS) {
    const r = groupBot(path, 'echo', 'k_echo', 10, 5);
    ok(r.done && r.deaths <= 4 && r.min <= 15, path + ' with two companions defeats the Doomsday Beast in the Echo of War: ' + JSON.stringify(r));
    JOURNEY.group[path] = (JOURNEY.group[path] || 0) + r.credits;
  }
  for (const path of HO.PATH_IDS) {
    const r = dungeonBot('human', path, 7, 40);
    ok(r.done && r.quest && r.early && r.deaths <= 3 && r.min <= 30, path + ' clears the Incubator with two companions before the clone crumbles: ' + JSON.stringify(Object.assign({}, r, { loot: r.loot.length })));
    ok(r.loot.includes(HO.PATH_CONE4[path]) && r.loot.some(id => HO.ITEMS[id].q === 4 && HO.ITEMS[id].set), path + ': the bonus chest gives a 4-star cone and a 4-star relic');
    JOURNEY.group[path] = (JOURNEY.group[path] || 0) + r.credits;
  }
  for (const key of Object.keys(JOURNEY.results)) {
    const path = key.split(' ')[1], total = JOURNEY.results[key] + JOURNEY.group[path];
    ok(total >= JOURNEY.spare[0] && total <= JOURNEY.spare[1], key + ' keeps 500 to 1500 spare credits after the group quests and one Incubator run: ' + JOURNEY.results[key] + ' + ' + JOURNEY.group[path] + ' = ' + total);
  }
}

function script(w, i) {
  const k = i % 97;
  if (k === 0) w.cmd({ seat: 0, t: 'move', f: 1, s: 0, r: 1 });
  if (k === 13) w.cmd({ seat: 1, t: 'move', f: 1, s: -1, r: 0 });
  if (k === 31) w.cmd({ seat: 0, t: 'jump' });
  if (k === 40) w.cmd({ seat: 1, t: 'face', yaw: (i % 7) * 0.9 });
  if (k === 55) w.cmd({ seat: 0, t: 'move', f: -1, s: 1, r: -1 });
  if (k === 70) w.cmd({ seat: 1, t: 'autorun', on: true });
  if (k === 88) w.cmd({ seat: 1, t: 'jump' });
  if (k === 20) w.cmd({ seat: 0, t: 'cast', ab: 'e_fire', uid: 3 + (i % 7) });
  if (k === 60) w.cmd({ seat: 1, t: 'cast', ab: 'a_smite', uid: 3 + (i % 5) });
  if (k === 75) w.cmd({ seat: 1, t: 'cast', ab: 'a_heal', uid: 1 });
  if (k === 5) w.cmd({ seat: 0, t: 'target', uid: 3 + (i % 9) });
  if (k === 6) w.cmd({ seat: 0, t: 'attack', on: true });
  if (k === 92) w.cmd({ seat: 1, t: 'release', mode: 'medic' });
}

function play(ticks, from) {
  const w = from || new HO.World({ seed: 77, level: 4 });
  if (!from) { w.addHero(0, { race: 'foxian', path: 'erudition' }); w.addHero(1, { race: 'human', path: 'abundance' }); }
  for (let i = w.state.tick; i < ticks; i++) { script(w, i); w.step(); }
  return w;
}

{
  const a = play(2000), b = play(2000);
  eq(a.hash(), b.hash(), 'two runs of the same commands give one hash');
  const half = play(1000);
  const text = JSON.stringify(half.state);
  eq(JSON.stringify(JSON.parse(text)), text, 'state survives JSON');
  const resumed = play(2000, HO.World.fromState(JSON.parse(text)));
  eq(resumed.hash(), a.hash(), 'snapshot then continue gives the same hash');
  const walk = v => {
    if (typeof v === 'function') return false;
    if (v && typeof v === 'object') return Object.values(v).every(walk);
    return v === null || ['number', 'string', 'boolean'].includes(typeof v) && (typeof v !== 'number' || Number.isFinite(v));
  };
  ok(walk(a.state), 'state holds only finite numbers, strings, booleans, arrays and objects');
  ok(a.state.actors.filter(x => x.kind === 'foe').length === HO.ZONES.greybox.foes.length, 'scripted run has the grey room foes');
  ok(a.state.actors.some(x => x.kind === 'foe' && (x.hp < x.base.hp || x.state !== 'idle' || x.dead)), 'scripted run really fights');
  const c = play(2000);
  c.state.actors[0].x += 1e-9;
  ok(c.hash() !== a.hash(), 'hash notices a tiny change');
  const t = Date.now();
  play(4000);
  ok(Date.now() - t < 2000, 'simulation is fast');
}

{
  const w = new HO.World({ seed: 5 });
  const r1 = w.random(), r2 = w.random();
  const w2 = HO.World.fromState(HO.copy(new HO.World({ seed: 5 }).state));
  eq(w2.random(), r1, 'seeded random repeats');
  eq(w2.random(), r2, 'random state is stored in the world');
}

{
  const audioSrc = read('js/apps/hsr98/hsr-audio.js');
  const sfxIds = new Set([...audioSrc.matchAll(/case '([a-z_0-9]+)'/g)].map(m => m[1]));
  for (const t of ['menu', 'station', 'crises', 'boss', 'doomsday']) ok(H.TRACKS[t], 'music track ' + t + ' exists in H.Audio');
  const kinds = ['dmg', 'swing', 'heal', 'break', 'miss', 'cleanse', 'trialEnd', 'death', 'levelUp', 'credits', 'bought', 'sold', 'repaired', 'got', 'looted', 'chest', 'anchorFound', 'anchorPaid', 'teleport', 'travel', 'revived', 'questAccept', 'questDone', 'learned', 'equip', 'deny', 'gate', 'usedItem', 'castStart', 'trialStart', 'bound', 'scanned', 'prep', 'phase', 'summon', 'vanish', 'crumble', 'chestUp'];
  const used = new Set(['select']);
  ok(HO.STEP_SOUND.vol >= 0.2 && /noise\(t, dur, vol, freq, to/.test(audioSrc), 'steps use their own louder noise burst through H.Audio.noise');
  for (const k of kinds) for (const elem of Object.keys(H.ELEMENTS)) for (const v of HO.eventSfx({ k, uid: 1, src: 1, v: 5, elem, melee: true, won: true, crit: elem === 'fire' }, 1, new Set([2]))) used.add(v);
  for (const id of used) ok(sfxIds.has(id), 'sound ' + id + ' exists in H.Audio');
  ok(used.size >= 25, 'events, elements and the interface use ' + used.size + ' different sounds');
  for (const el of Object.keys(H.ELEMENTS)) ok(HO.ELEM_SFX[el], 'element ' + el + ' has its own hit accent');
  eq(HO.eventSfx({ k: 'dmg', src: 7, uid: 8, v: 5 }, 1, new Set()).length, 0, 'other people fighting far away stay quiet');
  eq(HO.eventSfx({ k: 'dmg', src: 1, uid: 8, v: 5, dot: true }, 1, new Set()).length, 0, 'damage over time ticks stay quiet');
  eq(HO.eventSfx({ k: 'prep', uid: 9 }, 1, new Set(), () => false).length, 0, 'a far foe preparing a strike stays quiet');

  const zoneWorld = zone => { const w = new HO.World({ seed: 5, zone }); w.addHero(0, { sheet: HO.newSheet({ id: 'm1', name: 'Мира' }) }); return w; };
  eq(HO.musicFor(zoneWorld('base')), 'station', 'the station plays its own theme in the open world');
  eq(HO.musicFor(zoneWorld('incubator')), 'crises', 'the Incubator plays Crises');
  eq(HO.musicFor(zoneWorld('echo')), 'doomsday', 'the Echo of War plays the Doomsday theme');
  const fw = zoneWorld('incubator'), me = fw.state.actors.find(a => a.kind === 'hero');
  const boss = fw.state.actors.find(a => a.kind === 'foe' && HO.FOES[a.id].boss);
  ok(boss, 'the Incubator has a boss to test the music with');
  boss.state = 'fight'; boss.threat = { [me.uid]: 10 };
  eq(HO.musicFor(fw), 'boss', 'a boss fight switches to the boss theme');
  const bw = zoneWorld('base'), bme = bw.state.actors.find(a => a.kind === 'hero'), plain = bw.state.actors.find(a => a.kind === 'foe' && !HO.FOES[a.id].elite);
  plain.state = 'fight'; plain.threat = { [bme.uid]: 10 };
  eq(HO.musicFor(bw), 'station', 'an ordinary fight in the open world keeps the zone music');
  const elite = bw.state.actors.find(a => a.kind === 'foe' && HO.FOES[a.id].elite);
  if (elite) { elite.state = 'fight'; elite.threat = { [bme.uid]: 5 }; eq(HO.musicFor(bw), 'crises', 'a fight with an elite plays Crises'); }
  const mem = {}, store = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } };
  const s0 = HO.loadSettings(store);
  const codes = HO.KEY_ACTIONS.map(a => HO.keyOf(s0, a.id));
  eq(new Set(codes).size, codes.length, 'every action starts on its own key');
  ok(codes.every(c => !HO.RESERVED_KEYS.includes(c)), 'no action starts on F9, F10 or Esc');
  ok(['F9', 'F10', 'Escape'].every(c => HO.RESERVED_KEYS.includes(c)), 'F9, F10 and Esc stay reserved');
  ok(!HO.rebind(s0, 'jump', 'F10').ok && !HO.rebind(s0, 'jump', 'F9').ok && !HO.rebind(s0, 'jump', 'Escape').ok, 'F9, F10 and Esc cannot be assigned');
  const r1 = HO.rebind(s0, 'jump', 'KeyW');
  ok(r1.ok && r1.swapped === 'fwd' && HO.keyOf(s0, 'jump') === 'KeyW' && HO.keyOf(s0, 'fwd') === 'Space', 'taking a used key swaps the two actions');
  eq(HO.actionFor(s0, 'KeyW'), 'jump', 'the new key drives the action');
  eq(HO.actionFor(s0, 'ArrowUp'), 'fwd', 'arrows still move the hero');
  HO.saveSettings(store, Object.assign(s0, { res: 1024, ui: 1.25, sfx: 0.3, dither: true }));
  const s1 = HO.loadSettings(store);
  ok(s1.res === 1024 && s1.ui === 1.25 && s1.sfx === 0.3 && s1.dither && HO.keyOf(s1, 'jump') === 'KeyW', 'settings and keys survive a reload');
  HO.rebind(s1, 'jump', 'Space');
  ok(!s1.keys.jump && !s1.keys.fwd, 'keys put back on their default places are not stored');
  const junk = HO.cleanSettings({ res: 999, ui: 3, sfx: 7, view: 'far', fog: 'yes', keys: { fwd: 'F10', back: 'KeyZ', left: 'KeyZ', nonsense: 'KeyY' } });
  ok(junk.res === 800 && junk.ui === 1 && junk.sfx === HO.SETTINGS_DEFAULT.sfx && junk.view === 1 && junk.fog === true, 'bad values fall back to defaults');
  ok(!junk.keys.fwd && junk.keys.back === 'KeyZ' && !junk.keys.left && !junk.keys.nonsense, 'reserved, doubled and unknown keys are dropped');
  eq(HO.keyLabel('KeyQ') + HO.keyLabel('Digit7') + HO.keyLabel('Space') + HO.keyLabel('Minus'), 'Q7Пробел-', 'keys get readable names');
  for (const p of HO.PATH_IDS) for (const r of HO.RACE_IDS) {
    const ui = HO.loadHeroUi(store, 'nobody', p, r);
    ok(ui.bar.length === HO.BAR_SIZE && ui.bar[HO.BAR_SIZE - 1] === HO.RACIALS[r].id && ui.bar.slice(0, HO.BAR_SIZE - 1).filter(Boolean).every(id => HO.ABILITIES[id] && HO.ABILITIES[id].path === p), p + ' ' + r + ' starts with the default bar and the racial in the last slot');
  }
  const ui1 = HO.loadHeroUi(store, 'h9', 'erudition', 'human'), last = HO.pathAbilities('erudition').slice(-1)[0];
  HO.placeOnBar(ui1, 10, last);
  HO.placeOnBar(ui1, 0, last);
  ok(ui1.bar[0] === last && ui1.bar.filter(x => x === last).length === 1, 'an ability dragged onto the bar sits there only once');
  const a0 = ui1.bar[0], a1 = ui1.bar[1];
  HO.placeOnBar(ui1, 1, null, 0);
  ok(ui1.bar[0] === a1 && ui1.bar[1] === a0, 'dragging between slots swaps them');
  ui1.untracked = ['b_pass', 'nonsense'];
  HO.saveHeroUi(store, 'h9', ui1);
  const ui2 = HO.loadHeroUi(store, 'h9', 'erudition', 'human');
  ok(ui2.bar.join() === ui1.bar.join() && ui2.untracked.join() === 'b_pass', 'the bar and hidden quests survive a reload, unknown quests are dropped');
  const dId = HO.pathAbilities('destruction')[1], eId = HO.pathAbilities('erudition')[1];
  const foreign = HO.loadHeroUi({ getItem: () => JSON.stringify({ bar: [dId, eId, eId, null, null, null, null, null, null, null, null, null] }) }, 'x', 'erudition', 'human');
  ok(!foreign.bar.includes(dId) && foreign.bar.filter(x => x === eId).length === 1, 'abilities of another Path or doubles never reach the bar');
  ok(HO.KEY_ACTIONS.some(a => a.id === 'skills' && a.key === 'KeyK'), 'K opens the skills window');
  ok(HO.CREATE_STEPS.map(x => x.name).join() === 'Раса,Путь,Облик,Имя' && HO.CREATE_STEPS.every(x => x.line.length > 20), 'hero creation goes Race, Path, Look, Name with a line for each step');
  ok(HO.LOADING_TIPS.length >= 6 && HO.LOADING_TIPS.every(t => !t.includes('—')), 'the loading screen has tips without long dashes');
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  ok(HO.sphereVisible(I, 0, 0, 0, 0.5) && HO.sphereVisible(I, 1.5, 0, 0, 0.5), 'things in view or touching its edge are drawn');
  ok(!HO.sphereVisible(I, 6, 0, 0, 0.5) && !HO.sphereVisible(I, 0, -9, 0, 0.5), 'things far outside the view are skipped');
  const back = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0];
  ok(!HO.sphereVisible(back, 0, 0, 5, 0.5) && HO.sphereVisible(back, 0, 0, -5, 0.5), 'things behind the camera are skipped');
  ok(!HO.sphereVisible(I, 0, 0, 0, 0.5, 40, [0, 0, 100]) && HO.sphereVisible(I, 0, 0, 0, 0.5, 40, [0, 0, 20]), 'things beyond the fog are skipped');
  ok(HO.EFFECT_CAP >= 24 && HO.EFFECT_CAP <= 64, 'live effects are capped');
  ok(HO.loadSettings({ getItem: () => null }).perf === false && HO.cleanSettings({ perf: 'yes' }).perf === false && HO.cleanSettings({ perf: true }).perf === true, 'the frame counter is off by default and only a real true turns it on');
  const bad = { getItem: () => '{oops' };
  eq(JSON.stringify(HO.loadSettings(bad)), JSON.stringify(HO.cleanSettings(HO.SETTINGS_DEFAULT)), 'broken saved settings fall back to defaults');
  ok(HO.SETTINGS_KEY.startsWith('hsro.') && read('js/apps/backup-catalog.js').includes("'hsro.*'"), 'settings live under hsro.* and go into the backup');
}

{
  const idx = read('index.html'), page = read('hsro.html');
  const order = [...page.matchAll(/src="(js\/apps\/hsro\/[^"]+)"/g)].map(m => m[1]);
  let at = -1;
  for (const f of order) { const i = idx.indexOf('src="' + f + '"'); ok(i > at, 'index.html loads ' + f + ' in the same order as hsro.html'); at = i; }
  ok(idx.indexOf('src="js/apps/hsro-app.js"') > at && idx.includes('css/apps/hsro.css'), 'index.html loads the game window after the game and its styles');
  for (const dep of ['hsr98/hsr-core.js', 'hsr98/hsr-data.js', 'hsr98/hsr-hd-math.js', 'hsr98/hsr-midi.js', 'hsr98/hsr-audio.js']) ok(idx.indexOf('js/apps/' + dep) >= 0 && idx.indexOf('js/apps/' + dep) < idx.indexOf('js/apps/hsro/ho-core.js'), 'index.html loads ' + dep + ' before Star Rail Online');
  const gm = read('js/game-manager.js'), entry = gm.slice(gm.indexOf('      hsro: {'), gm.indexOf('launch: () => window.appHsro'));
  ok(entry.includes("steam: true") && entry.includes("price: 0") && entry.includes("priceDisplay: 'FREE'") && !entry.includes('cdDemo'), 'Star Rail Online is a free Steam game');
  ok(!/hsroGranted/.test(gm) && !/purchased: \[[^\]]*'hsro'/.test(gm) && !/installed: \[[^\]]*'hsro'/.test(gm), 'Star Rail Online is never granted or preinstalled');
  for (const f of ['js/desktop.js', 'js/taskbar.js', 'js/apps/explorer.js', 'js/filesystem.js', 'js/apps/dialogs.js', 'js/apps/hsro-app.js']) ok(/isInstalled\('hsro'\)|gmInstalled\.includes\('hsro'\)/.test(read(f)), f + ' checks that Star Rail Online is installed');
  for (const f of ['js/taskbar.js', 'js/apps/explorer.js', 'js/apps/dialogs.js', 'js/apps/hsro-app.js']) ok(read(f).includes("showInSteam(\\'hsro\\')") || read(f).includes("showInSteam('hsro')"), f + ' sends a player without the game to Steam');
  ok((read('js/i18n.js').match(/'app\.hsro': 'Star Rail Online'/g) || []).length === 4 && read('js/icons.js').includes("'hsro': `<svg") && read('js/apps/task-manager.js').includes("'app_hsro'"), 'name, icon and process for Star Rail Online');
  ok(read('tools/steam-shots-recipes.cjs').includes("  hsro: {"), 'Steam screenshots have a recipe');
  for (const n of [1, 2]) {
    const b = fs.readFileSync(path.join(ROOT, 'content/steam/hsro-' + n + '.jpg'));
    let i = 2, size = null;
    while (i < b.length && !size) { const len = b.readUInt16BE(i + 2); if (b[i + 1] >= 0xc0 && b[i + 1] <= 0xc2) size = [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; i += 2 + len; }
    eq(String(size), '640,480', 'Steam screenshot ' + n + ' is 640x480');
  }
  ok(read('README.md').includes('## Star Rail Online') && read('package.json').includes('"test:hsro"'), 'README has a section and npm has test:hsro');
}
console.log('hsro: ' + checks + ' checks passed in ' + (Date.now() - t0) + ' ms');
