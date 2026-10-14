const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/ow98');
const MAP_FILES = fs.readdirSync(DIR).filter(f => f.startsWith('ow-maps-')).map(f => f.slice(0, -3)).sort();
const SIM = ['ow-core', 'ow-data', 'ow-world', 'ow-nav', ...MAP_FILES, 'ow-game', 'ow-modes', 'ow-kits', 'ow-kits2', 'ow-ai'];
for (const f of SIM) require(path.join(DIR, f + '.js'));
require(path.join(DIR, 'ow-fx.js'));
const O = globalThis.Ow98;
O.Profile = O.Profile || { skinsMap: () => ({}) };

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();
const VERBOSE = process.argv.includes('-v');
const QUICK = process.argv.includes('--quick');
const log = (...a) => { if (VERBOSE) console.log(...a); };
const I = o => Object.assign(O.blankInput(), o || {});
const run = (g, sec, inp) => { for (let i = 0; i < Math.round(sec * 60); i++) g.step(typeof inp === 'function' ? inp(i) : inp || I()); };

function stagesOf(def) {
  if (def.stages) return def.stages.map((_, i) => ({ sub: i, stage: 0 }));
  if (def.mode === 'assault') return [0, 1].map(s => ({ sub: 0, stage: s }));
  if (def.mode === 'escort' || def.mode === 'hybrid') return [0, 1, 2].map(s => ({ sub: 0, stage: s }));
  return [{ sub: 0, stage: 0 }];
}

{
  const ids = O.MAP_LIST.map(m => m.id);
  ok(ids.length === 8, 'eight maps in the list');
  for (const mode of ['assault', 'escort', 'hybrid', 'control']) ok(O.MAP_LIST.filter(m => m.mode === mode).length === 2, 'two maps for ' + mode);
  for (const id of ids) ok(!!O.MAPS[id], 'map is built: ' + id);
  ok(O.MAPS.range && O.MAPS.range.mode === 'practice', 'training range exists');
  ok(O.HERO_ORDER.length === 12 && O.HERO_ORDER.every(id => O.HEROES[id] && !O.HEROES[id].training), 'twelve playable heroes');
  ok(O.HEROES.trainbot.training && !O.HERO_ORDER.includes('trainbot'), 'training robot is not selectable');
  const roles = { offense: 0, defense: 0, tank: 0, support: 0 };
  for (const id of O.HERO_ORDER) roles[O.HEROES[id].role]++;
  ok(Object.values(roles).every(n => n === 3), 'three heroes per role');
}

for (const id of O.MAP_LIST.map(m => m.id).concat(['range'])) {
  const def = O.MAPS[id];
  for (const { sub, stage } of stagesOf(def)) {
    const m = O.buildMap(id, sub, { visual: false });
    const nav = new O.Nav(m);
    nav.setTeams(0, stage);
    const tag = id + (def.stages ? ':' + sub : '') + ' stage ' + stage;
    const active = m.spawns.filter(s => stage >= s.stage[0] && stage <= s.stage[1]);
    ok(active.some(s => s.role === 'att'), tag + ': attackers have a spawn');
    if (def.mode !== 'practice') ok(active.some(s => s.role === 'def'), tag + ': defenders have a spawn');
    const targets = [];
    for (const k in m.points) targets.push(['point ' + k, m.points[k]]);
    for (const hp of m.health) targets.push(['health pack', hp]);
    for (const h of m.hints) if (h.stage === stage && h.kind !== 'bot') targets.push(['hint ' + h.kind, h]);
    if (m.payload) {
      for (const p of m.payload.pts) {
        const k = nav.nearest(p.x, p.y, p.z, 3);
        ok(k >= 0 && Math.abs(nav.y[k] - p.y) < 1.2, tag + ': payload path runs over walkable ground at ' + p.x + ',' + p.z);
      }
    }
    for (const sp of active) {
      const team = sp.role === 'att' ? 0 : 1;
      const a = nav.nearest(sp.pts[0].x, sp.y, sp.pts[0].z, 4);
      ok(a >= 0, tag + ': spawn ' + sp.role + ' stands on the nav grid');
      let bad = [];
      for (const [name, t] of targets) {
        const b = nav.nearest(t.x, t.y, t.z, 4);
        if (b < 0 || !nav.path(a, b, team)) bad.push(name + ' ' + t.x + ',' + t.z);
      }
      ok(!bad.length, tag + ': ' + sp.role + ' spawn reaches every objective, pack and hint ' + bad.join('; '));
    }
    log(tag, 'nodes', nav.n);
  }
}

function duel(heroId, o = {}) {
  const teams = [[{ name: 'P', human: true, hero: heroId }].concat(o.allies || []), [{ name: 'T', hero: 'trainbot', drill: 'static' }]];
  const g = new O.Game({ map: 'range', mode: 'practice', seed: 7, teams, attack: 0, assemble: 0, setup: 0, rules: Object.assign({ practice: true, respawn: 3 }, o.rules || {}) });
  const p = g.player;
  g.requestHero(p, heroId);
  run(g, 0.5);
  const t = g.heroes.find(h => h.team === 1);
  const dist = o.dist || 8;
  p.pos = { x: t.pos.x, y: 0, z: t.pos.z - dist }; p.vel = { x: 0, y: 0, z: 0 };
  const pitch = Math.atan2(1.15 - p.def.eye, dist);
  return { g, p, t, aim: extra => I(Object.assign({ yaw: 0, pitch }, extra || {})) };
}

{
  const RANGE = { reinhardt: 2.6, winston: 5, roadhog: 5, lucio: 6, torbjorn: 7, junkrat: 7, mercy: 7, zenyatta: 8 };
  for (const id of O.HERO_ORDER) {
    const { g, p, t, aim } = duel(id, { dist: RANGE[id] || 9 });
    ok(p.heroId === id && p.alive && p.hp === p.def.hp * g.rules.hpMul, id + ': spawns with full health');
    ok(p.maxHp + p.maxArmor + p.maxShield === p.def.hp + p.def.armor + p.def.shield, id + ': health pools match the hero card');
    const slot = id === 'mercy' ? 2 : 0;
    if (slot) run(g, 0.1, aim({ slot }));
    run(g, 2.5, aim({ fire: true }));
    ok(p.stats.dmg > 0, id + ': primary fire damages a target in front (' + Math.round(p.stats.dmg) + ')');
    const silent = [...new Set(g.fx.filter(f => { const P = new O.Particles(); P.event(f, g, null); return !(P.list.length || P.shots.length || P.lines.length || P.decals.length); }).map(f => f.type))];
    ok(!silent.length, id + ': every shot and impact effect draws something ' + silent.join(','));
    const start = g.events.length;
    p.ult = p.def.ultCost;
    if (id === 'mercy') {
      run(g, 0.1);
      continue;
    }
    run(g, 0.05, aim({ q: true }));
    run(g, 0.05, aim());
    const fired = g.events.slice(start).some(e => e.type === 'ult' && e.h === p.id) || p.ult < p.def.ultCost;
    ok(fired, id + ': ultimate activates when charged');
    log(id, 'dmg', Math.round(p.stats.dmg), 'ult', p.ultOn);
  }
}

{
  const { g, p } = duel('mercy', { allies: [{ name: 'A', hero: 'soldier' }] });
  const a = g.heroes.find(h => h.team === 0 && h !== p);
  run(g, 0.5);
  a.pos = { x: p.pos.x + 2, y: 0, z: p.pos.z }; a.vel = { x: 0, y: 0, z: 0 };
  g.damage(g.heroes.find(h => h.team === 1), a, 999, { ability: 'rifle' });
  ok(!a.alive, 'mercy test: ally is down');
  run(g, 0.5);
  p.ult = p.def.ultCost;
  run(g, 0.05, I({ q: true }));
  run(g, 0.1);
  ok(a.alive && a.hp === a.maxHp, 'mercy: resurrect brings a fallen ally back with full health');

  const { g: g2, p: m2 } = duel('mercy', { allies: [{ name: 'A', hero: 'reinhardt' }] });
  const ally = g2.heroes.find(h => h.team === 0 && h !== m2);
  run(g2, 0.3);
  ally.pos = { x: m2.pos.x, y: 0, z: m2.pos.z + 6 }; ally.vel = { x: 0, y: 0, z: 0 };
  ally.hp = 100;
  run(g2, 2, I({ fire: true, pitch: -0.05 }));
  ok(ally.hp > 100, 'mercy: caduceus staff heals the ally in front (' + Math.round(ally.hp) + ')');
}

{
  const { g, t } = duel('soldier');
  const armored = new O.Game({ map: 'range', mode: 'practice', seed: 3, teams: [[{ name: 'P', human: true, hero: 'reinhardt' }], [{ name: 'T', hero: 'soldier' }]], attack: 0, assemble: 0, setup: 0, rules: { practice: true } });
  armored.requestHero(armored.player, 'reinhardt');
  run(armored, 0.3);
  const rh = armored.player, sol = armored.heroes[1];
  run(armored, 0.3);
  const before = rh.hp + rh.armor;
  armored.damage(sol, rh, 10, { ability: 'rifle' });
  ok(before - (rh.hp + rh.armor) === 5, 'armor halves small hits (10 -> 5)');
  const b2 = rh.hp + rh.armor;
  armored.damage(sol, rh, 40, { ability: 'rifle' });
  ok(b2 - (rh.hp + rh.armor) === 35, 'armor removes up to 5 from big hits (40 -> 35)');
  ok(t.heroId === 'trainbot' && g.phase === 'play', 'duel helper leaves the range in play');
}

{
  const teams = O.RANGE_TEAMS({ profile: { name: 'T' } }, true);
  const g = new O.Game({ map: 'range', mode: 'practice', seed: 5, teams, attack: 0, assemble: 0, setup: 0, rules: { practice: true, tutorial: true, respawn: 3 } });
  const p = g.player;
  g.requestHero(p, 'soldier');
  const st = () => (O.MODES.practice.hud(g).tut || {}).step;
  run(g, 1);
  ok(st() === 0, 'tutorial starts with movement');
  run(g, 4, I({ fwd: 1 }));
  ok(st() === 1, 'tutorial: walking forward completes the movement step');
  p.pos = { x: 5, y: 1.2, z: -16 }; p.vel = { x: 0, y: 0, z: 0 };
  run(g, 2);
  ok(st() === 2, 'tutorial: standing on the crates completes the jump step');
  for (const b of g.heroes.filter(h => h.team === 1).slice(0, 3)) g.damage(p, b, 999, { ability: 'rifle' });
  run(g, 1.5);
  ok(st() === 3, 'tutorial: three destroyed robots complete the shooting step');
  p.ammo = 5; run(g, 0.2, I({ reload: true })); run(g, 1);
  ok(st() === 4, 'tutorial: reload step');
  run(g, 0.2, I({ fire2: true })); run(g, 1);
  ok(st() === 5, 'tutorial: helix rockets step');
  run(g, 2.5, I({ fwd: 1, shift: true }));
  ok(st() === 6, 'tutorial: sprint step');
  run(g, 0.1, i => I({ e: i % 2 === 0 })); run(g, 1);
  ok(st() === 7 && p.ult >= p.def.ultCost, 'tutorial: biotic field step, ultimate is charged for the last lesson');
  run(g, 0.1, i => I({ q: i % 2 === 0 })); run(g, 1);
  ok(st() === 8 && p.ultOn === 'visor', 'tutorial: tactical visor step');
  run(g, 7);
  ok(g.phase === 'end' && g.winner === p.team, 'tutorial ends with a victory');

  const g2 = new O.Game({ map: 'range', mode: 'practice', seed: 9, teams: O.RANGE_TEAMS({ profile: { name: 'T' } }, false), attack: 0, assemble: 60, setup: 0, rules: { practice: true, respawn: 3 } });
  g2.requestHero(g2.player, 'mercy');
  run(g2, 3);
  ok(g2.phase === 'play', 'range starts as soon as the player has a hero');
  const bots = g2.heroes.filter(h => h.drill);
  ok(bots.length === 8 && bots.every(h => h.heroId === 'trainbot' && h.alive && h.home), 'range: training robots stand at their posts');
  const strafer = bots.find(h => h.drill === 'strafe');
  const x0 = strafer.pos.x;
  run(g2, 3);
  ok(Math.abs(strafer.pos.x - x0) > 0.5 && Math.abs(strafer.pos.x - strafer.home.x) < 4.6, 'range: strafing robot moves along its lane');
  const medbot = bots.find(h => h.drill === 'hurt');
  run(g2, 5);
  ok(medbot.hp < medbot.maxHp, 'range: friendly robots lose health so supports can practise healing');
  const victim = bots.find(h => h.drill === 'static');
  g2.damage(g2.player, victim, 999, { ability: 'rifle' });
  ok(!victim.alive, 'range: robot can be destroyed');
  run(g2, 4);
  ok(victim.alive && Math.hypot(victim.pos.x - victim.home.x, victim.pos.z - victim.home.z) < 0.5, 'range: destroyed robot returns to its post');
}

{
  const g = new O.Game({ map: 'lijiang', seed: 4, teams: [0, 1].map(t => Array.from({ length: 6 }, (_, k) => ({ name: 'B' + t + k, skill: 1, hero: ['mccree', 'soldier', 'reinhardt', 'roadhog', 'mercy', 'lucio'][k] }))), assemble: 1, lock: 0 });
  run(g, 3);
  const mc = g.heroes.find(h => h.heroId === 'mccree');
  mc.ult = mc.def.ultCost;
  g.useUlt(mc, 'deadeye');
  mc.k.marks = mc.k.marks || {};
  O.MODES.control.winRound(g, 0);
  run(g, 8);
  ok(g.subStage === 1 && g.phase !== 'end', 'control: next round loads the next sub-map');
  run(g, 15);
  ok(mc.alive && mc.ultOn === null, 'control: ultimates in progress do not survive the round change');
}

{
  for (const f of ['ow-tex', 'ow-mesh', 'ow-models', 'ow-skins', 'ow-mocap', 'ow-clips', 'ow-clips2', 'ow-profile', 'ow-anim', 'ow-props', 'ow-icons', 'ow-ui']) require(path.join(DIR, f + '.js'));
  const colors = (h, skin) => O.buildHeroModel(h, skin).data.col;
  for (const h of O.HERO_ORDER) {
    const base = colors(h, 'classic');
    const m = O.buildHeroModel(h, 'classic');
    ok(m.data.n > 900 && m.data.pos.every(Number.isFinite), h + ': model builds with finite geometry (' + m.data.n / 3 + ' tris)');
    const inert = O.SKINS[h].filter(k => k.id !== 'classic' && colors(h, k.id).every((v, i) => v === base[i])).map(k => k.id);
    ok(!inert.length, h + ': every skin recolours the model ' + inert.join(','));
    const unknown = O.SKINS[h].flatMap(k => Object.keys(k.pal).filter(key => !(key in O.PAL[h])));
    ok(!unknown.length, h + ': skin palettes only use known colour slots ' + unknown.join(','));
    ok(O.HERO_TINT[h] && O.HERO_TINT[h].length === 2, h + ': has spray colours');
  }
  ok(O.COSMETIC_TYPES.every(t => t.one && t.g && O.hasIcon(t.icon)), 'every cosmetic type has a singular name, gender and icon');
  ok(Object.values(O.RARITY).every(r => r.g.m && r.g.f && r.g.n), 'rarity names agree with every gender');
  ok(O.PLAYER_ICON_ART.length === O.PLAYER_ICONS.length && O.PLAYER_ICON_ART.every(a => O.hasIcon(a[0])), 'every player icon has art');
  ok(O.buildDeployModel('pedestal').n > 0, 'gallery pedestal model builds');
  const kitSrc = ['ow-kits', 'ow-kits2', 'ow-game'].map(f => fs.readFileSync(path.join(DIR, f + '.js'), 'utf8')).join('\n');
  const shotKinds = new Set([...kitSrc.matchAll(/tracer: '(\w+)'/g)].map(m => m[1]).concat(['tracer']));
  ok([...shotKinds].every(k => O.FX_SHOT[k]), 'every hitscan tracer kind has a shot style: ' + [...shotKinds].join(','));
  for (const h of O.HERO_ORDER) {
    const base = O.buildHeroModel(h, 'classic').data;
    ok(base.mat.length === base.n && base.mat.some(v => v >= 0.5), h + ': metal, lens and gun parts carry gloss');
    const kits = O.SKIN_KITS[h] || {};
    ok(Object.keys(kits).every(id => O.SKINS[h].some(k => k.id === id && k.rar === 'legendary')), h + ': skin kits belong to legendary skins');
    for (const k of O.SKINS[h].filter(k => k.rar === 'legendary')) {
      const d = O.buildHeroModel(h, k.id).data;
      ok(kits[k.id] && d.n !== base.n && d.pos.every(Number.isFinite), h + ': legendary skin ' + k.id + ' has its own model parts');
      const S = O.skel(O.HEROES[h].h), P = Object.assign({}, O.PAL[h], k.pal);
      const build = hide => { const M = new O.MB(); O.HERO_MODEL[h](M, S, P, { hide: new Set(hide) }); return M.data(); };
      const full = build([]);
      const dead = (kits[k.id] && kits[k.id].hide || []).filter(x => { const d2 = build([x]); return d2.n === full.n && d2.col.every((v, i) => v === full.col[i]); });
      ok(!dead.length, h + ': ' + k.id + ' hides real parts ' + dead.join(','));
    }
  }
  const notes = [];
  const fake = { profile: O.Profile.defaults(), audio: { init() { }, play() { } }, mode: 'match', game: {}, notice: t => notes.push(t) };
  fake.profile.boxes = 1;
  O.UI.prototype.debugBoxes.call(fake);
  ok(fake.profile.boxes === 6 && notes.length === 1, 'F7 debug key adds five loot boxes');  const CS = new Float64Array(48);
  const vecAt = (c, t) => Array.from(O.Clips.sample(c, t, CS));
  const gap = (a, b) => a.reduce((m, x, i) => Math.max(m, Math.abs(x - b[i])), 0);
  const finals = [];
  const bones = new Float32Array(15 * 16);
  for (const h of O.HERO_ORDER) {
    const S = O.skel(O.HEROES[h].h);
    const emotes = O.Clips.list(h, 'emote'), poses = O.Clips.list(h, 'pose');
    ok(emotes.length >= 6 && poses.length === 7 && emotes[0][0] === 'heroic' && poses[0][0] === 'heroic', h + ': six emotes and seven victory poses, heroic first');
    ok(emotes.concat(poses).every(([, c]) => typeof c.n === 'string' && c.n.length > 1 && c.ks.length >= 2), h + ': every clip has a name and keyframes');
    ok(emotes.some(([k, c]) => k === 'dance' && c.loop), h + ': has a looping dance');
    const still = emotes.filter(([, c]) => { const v0 = vecAt(c, 0), len = c.loop ? c.loop[1] : c.len; let m = 0; for (let i = 1; i <= 24; i++) m = Math.max(m, gap(vecAt(c, len * i / 24), v0)); return m < 0.6; }).map(([k]) => k);
    ok(!still.length, h + ': every emote moves ' + still.join(','));
    const [, dance] = emotes.find(([k]) => k === 'dance');
    let range = 0;
    for (let ch = 0; ch < 48; ch++) { let lo = 1e9, hi = -1e9; for (let i = 0; i < 24; i++) { const v = vecAt(dance, dance.loop[0] + (dance.loop[1] - dance.loop[0]) * i / 24)[ch]; lo = Math.min(lo, v); hi = Math.max(hi, v); } range += hi - lo; }
    ok(range > 3.5, h + ': the dance loop uses the whole body (' + range.toFixed(1) + ' rad of motion)');
    const props = emotes.concat(poses).flatMap(([, c]) => (c.props || []).map(p => p.m));
    ok(props.every(m => O.ITEM_MODEL[m]), h + ': clip props have models ' + props.filter(m => !O.ITEM_MODEL[m]).join(','));
    let finite = true;
    for (const [k, c] of emotes.concat(poses)) {
      for (let t = 0; t < 7; t += 0.31) {
        const st = { t, x: 0, y: 0, z: 0, yaw: 0, pose: c.kind + ':' + k };
        const world = O.Anim.heroBones(h, S, st, bones);
        const pl = O.Anim.props(h, S, st, world) || [];
        if (!bones.every(Number.isFinite) || !pl.every(p => p.mat.every(Number.isFinite))) finite = false;
      }
    }
    ok(finite, h + ': emotes, poses and their props evaluate to finite bones');
    ok(['default', 'intro1', 'intro2', 'intro3'].every(k => O.Clips.get(h, O.Clips.intro(h, k))), h + ': highlight intros resolve to clips');
    const near = [];
    for (let i = 0; i < poses.length; i++) for (let j = i + 1; j < poses.length; j++) if (gap(vecAt(poses[i][1], O.Clips.iconT(poses[i][1])), vecAt(poses[j][1], O.Clips.iconT(poses[j][1]))) < 0.45) near.push(poses[i][0] + '/' + poses[j][0]);
    ok(!near.length, h + ': victory poses differ from each other ' + near.join(','));
    for (const [k, c] of poses) finals.push([h + ':' + k, vecAt(c, O.Clips.iconT(c))]);
    const cat = O.catalog(h);
    ok(['emote', 'pose'].every(type => cat.filter(i => i.type === type).map(i => i.key).join() === O.Clips.list(h, type).map(([k]) => k).join()), h + ': gallery lists every emote and pose clip');
    ok(cat.some(i => i.id === 'emote:heroic' && i.def) && cat.some(i => i.id === 'pose:heroic' && i.def), h + ': heroic emote and pose are free');
  }
  const twins = [];
  for (let i = 0; i < finals.length; i++) for (let j = i + 1; j < finals.length; j++) if (gap(finals[i][1], finals[j][1]) < 0.35) twins.push(finals[i][0] + '=' + finals[j][0]);
  ok(!twins.length, 'no two heroes share the same victory pose ' + twins.join(','));
  for (const k in O.ITEM_MODEL) { const d = O.buildDeployModel('item', k); ok(d.n > 0 && d.pos.every(Number.isFinite), 'prop model builds: ' + k); }

  const old = O.Profile.defaults();
  old.owned['tracer:emote:wave'] = true; old.owned['tracer:pose:kneel'] = true; old.owned['tracer:emote:dance'] = true;
  old.equip.tracer = { emote: 'wave', pose: 'kneel', skin: 'classic' };
  O.Profile.migrate(old);
  const mine = Object.keys(old.owned).filter(u => u.startsWith('tracer:'));
  ok(!old.owned['tracer:emote:wave'] && !old.owned['tracer:pose:kneel'] && old.owned['tracer:emote:dance'] && mine.length === 3, 'profile migration swaps removed emotes and poses for new ones');
  ok(!old.equip.tracer.emote && !old.equip.tracer.pose && old.equip.tracer.skin === 'classic', 'profile migration drops equipped items that no longer exist');

  const ACTS = ['melee', 'reload', 'roll', 'deadeye', 'blink', 'recall', 'swing', 'charge', 'shatter', 'strike', 'hook', 'breather', 'hog', 'leap', 'punch', 'rage', 'rez', 'ga', 'trans', 'cast', 'soundbarrier', 'amp', 'wave', 'hammer', 'tire', 'fire'];
  const ITEMS = ['flash', 'field', 'bomb', 'mine', 'trap', 'turret', 'pack', 'venom', 'bubble'];
  const vm = new Float32Array(O.Anim.VB * 16);
  for (const h of O.HERO_ORDER) {
    const S = O.skel(O.HEROES[h].h);
    let bad = [];
    const states = [];
    for (const act of ACTS) states.push({ act });
    for (const item of ITEMS) states.push({ act: 'throw', item });
    states.push({ dead: true, deathKind: 0 }, { dead: true, deathKind: 1 }, { dead: true, deathKind: 2, deathSide: -1 });
    states.push({ move: 5.5, lf: 5.5, ll: 0, phase: 3 }, { move: 5.5, lf: -4, ll: 3, phase: 2, hipYaw: 0.4 }, { airW: 1, air: true, vy: -6 }, { crouchW: 1, crouch: true, move: 3, phase: 1 }, { landT: 0.1, landV: 12 }, { sprintW: 1, sprint: true, move: 8.5, phase: 4 }, { hurtT: 0.05, hurtSide: 1 }, { shieldW: 1, shield: true }, { scopeW: 1, scope: 0.5 }, { beam: true }, { volley: 4 }, { turn: 3, tphase: 1 }, { idle: true }, { wallride: true, wallSide: -1, air: true, airW: 1 });
    for (const extra of states) {
      for (let t = 0; t < 2.2; t += 0.37) {
        const st = Object.assign({ t: 10 + t, actT: 10, x: 0, y: 0, z: 0, yaw: 0, pitch: 0.2, shotT: 10.05, shot2T: 9.95, deadT: t }, extra);
        O.Anim.heroBones(h, S, st, bones);
        if (!bones.every(Number.isFinite)) bad.push('3p:' + (extra.act || Object.keys(extra)[0]));
        O.Anim.view(h, Object.assign({ onGround: !extra.air, fp: { equip: t / 2.2, land: -0.02, sx: 0.01, sy: -0.01, srx: 0.02, sry: -0.02, crouch: extra.crouchW || 0, sprint: extra.sprintW || 0 } }, st), vm);
        if (!vm.every(Number.isFinite)) bad.push('fp:' + (extra.act || Object.keys(extra)[0]));
      }
    }
    bad = [...new Set(bad)];
    ok(!bad.length, h + ': third- and first-person animation is finite for every action ' + bad.join(','));
    const vmData = O.buildViewModel(h, 'classic').data;
    ok(vmData.bone.every(b => b < O.Anim.VB), h + ': view model parts use the animated view bones');
    const parts = new Set(vmData.bone);
    ok(parts.size >= (h === 'reinhardt' ? 2 : 3), h + ': view model has separate moving parts (' + [...parts].sort().join(',') + ')');
  }
  const ffp = O.Anim.view('tracer', { t: 5, actT: 4.6, act: 'reload', onGround: true, move: 0, fp: { equip: 1 } }, vm);
  const tp0 = O.Anim.view('tracer', { t: 5, onGround: true, move: 0, fp: { equip: 1 } }, new Float32Array(O.Anim.VB * 16));
  ok(gap(Array.from(ffp.subarray(0, 16)), Array.from(tp0.subarray(0, 16))) > 0.05, 'first-person reload moves the weapon');

}

if (!QUICK) {
  const results = [];
  for (const [i, m] of O.MAP_LIST.entries()) {
    const att = i % 2;
    const teams = [0, 1].map(t => Array.from({ length: 6 }, (_, k) => ({ name: O.BOT_NAMES[(t * 6 + k + i * 3) % O.BOT_NAMES.length], skill: 1 })));
    const g = new O.Game({ map: m.id, seed: 200 + i, teams, attack: att, assemble: 3, setup: 5 });
    const s0 = Date.now();
    let stages = 0;
    while (g.phase !== 'end' && g.t < 25 * 60) {
      g.step(null);
      for (const e of g.events) if (e.type === 'stage' || e.type === 'round') stages++;
      g.events.length = 0; g.fx.length = 0;
    }
    ok(g.phase === 'end' && (g.winner === 0 || g.winner === 1), m.id + ': bot match ends with a winner');
    ok(g.stats.kills[0] + g.stats.kills[1] > 10, m.id + ': teams actually fight');
    ok(g.heroes.every(h => h.heroId && O.HERO_ORDER.includes(h.heroId)), m.id + ': every bot picked a hero');
    const counts = {};
    for (const h of g.heroes) counts[h.team + h.heroId] = (counts[h.team + h.heroId] || 0) + 1;
    ok(Object.values(counts).every(n => n === 1), m.id + ': no duplicate heroes on a team');
    results.push(m.id + ' ' + (g.winner === att ? 'att' : 'def') + ' ' + (g.t | 0) + 's ' + g.stats.kills.join(':') + ' ' + (Date.now() - s0) + 'ms');
  }
  log(results.join('\n'));
}

{
  const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/ow98/' + f).concat(['js/apps/ow98-app.js', 'tests/ow98.test.js']);
  const SL = String.fromCharCode(47);
  const LINE = SL + SL, BLOCK = SL + '*';
  const noUrls = src => src.split('http:' + LINE).join('').split('https:' + LINE).join('');
  for (const f of files) {
    const src = noUrls(read(f));
    ok(!src.includes(LINE) && !src.includes(BLOCK), f + ' has no comments');
  }
  ok(!read('css/apps/ow98.css').includes(BLOCK), 'css has no comments');
  ok(!/<!--/.test(read('ow98.html')), 'page has no comments');
  const html = read('index.html'), page = read('ow98.html');
  const order = [...page.matchAll(/js\/apps\/ow98\/([\w-]+)\.js/g)].map(m => m[1]);
  ok(order.length === fs.readdirSync(DIR).filter(f => f.endsWith('.js')).length, 'ow98.html loads every module');
  let last = -1;
  for (const f of order) {
    const at = html.indexOf(`js/apps/ow98/${f}.js`);
    ok(at > last, 'index.html loads ' + f + ' in page order');
    last = at;
  }
  ok(html.indexOf('js/apps/ow98-app.js') > last && html.includes('css/apps/ow98.css'), 'desktop loads the app wrapper and styles');
  const gm = read('js/game-manager.js');
  const at = gm.indexOf('      ow98: {');
  const entry = gm.slice(at, gm.indexOf('launch:', at));
  ok(at > 0 && entry.includes('steam: true') && entry.includes("targetExe: 'OVERWATCH.EXE'"), 'catalog sells Overwatch 98 through Steam');
  ok(!/ow98Granted/.test(gm), 'no grant flags for the game');
  for (const f of ['js/desktop.js', 'js/taskbar.js']) ok(read(f).includes("isInstalled('ow98')"), f + ' shows the game only when installed');
  ok(read('js/filesystem.js').includes("gmInstalled.includes('ow98')"), 'C:\\Games\\Overwatch appears only after install');
  ok(read('js/apps/dialogs.js').includes("showInSteam(\\'ow98\\')"), 'Run dialog sends the player to Steam');
}

console.log(`OW98: ${checks} checks passed in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
