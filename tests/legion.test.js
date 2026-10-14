const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js', 'apps', 'legion');
const ASSETS = path.join(ROOT, 'content', 'legion');
const SIM = ['lg-core', 'lg-data', 'lg-lore', 'lg-terrain', 'lg-army', 'lg-sim', 'lg-ai', 'lg-scenarios', 'lg-levels', 'lg-game', 'lg-assets', 'lg-atlas', 'lg-icons'];
const stageArmy = require('./legion-stage-army.js');
for (const f of SIM) require(path.join(DIR, f + '.js'));
const L = globalThis.Legion;
L.ASSET_ROOT = ASSETS + path.sep;
L.nodeRead = p => fs.readFileSync(p);

let passed = 0;
const only = process.argv[2] || null;
const queue = [];
function test(name, fn) {
  if (only && !name.includes(only)) return;
  queue.push([name, fn]);
}

const terrains = new Map();
async function terrain(lv) {
  const key = lv.map + ':' + JSON.stringify(lv.terrain || {});
  if (!terrains.has(key)) terrains.set(key, await L.loadTerrain(lv.map, L.terrainOpts(lv)));
  return terrains.get(key);
}

function spec(key, x, z, face, extra) {
  return Object.assign({ key, name: key, men: L.UNITS[key].men, level: 1, skills: {}, equip: {}, color: 0, x, z, face, doctrine: 'advance', form: 'balanced' }, extra || {});
}

function duel(t, a, b, seed, o) {
  o = o || {};
  const cfg = { terrain: t, seed, playerZone: [0, 0, t.size, t.size], enemyZone: [0, 0, t.size, t.size], objectives: [] };
  cfg.player = [spec(a, o.ax || 512, o.az || 640, Math.PI, o.pa)];
  cfg.enemy = [spec(b, o.bx || 512, o.bz || 560, 0, o.pb)];
  const bt = new L.Battle(cfg);
  bt.start();
  let n = 0;
  while (bt.state === 'battle' && n++ < 8000) { bt.tick(); bt.events.length = 0; }
  return bt;
}

function profileWith(list, seed) {
  const p = L.Army.newProfile('Тест', 1);
  p.squads = [];
  for (const k of list) {
    const [key, lvl] = k.split(':');
    const sq = L.Army.addSquad(p, key);
    L.Army.autoSkills(sq, +(lvl || 1), L.rng(seed * 31 + p.squads.length));
  }
  return p;
}

function runBattle(b, maxSec) {
  b.start();
  let n = 0;
  const limit = Math.round((maxSec || 1500) / L.TICK);
  while (b.state === 'battle' && n++ < limit) { b.tick(); b.events.length = 0; }
  return b.result;
}

function findComment(src, css) {
  const BS = String.fromCharCode(92);
  let i = 0, q = null;
  const prevSig = k => { let j = k - 1; while (j >= 0 && ' \t\r\n'.includes(src[j])) j--; return j >= 0 ? src[j] : ''; };
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (q) {
      if (c === BS) { i += 2; continue; }
      if (c === q) q = null;
      i++;
      continue;
    }
    if (!css && (c === '"' || c === "'" || c === '`')) { q = c; i++; continue; }
    if (c === '/' && n === '*') return i;
    if (!css && c === '/' && n === '/') return i;
    if (!css && c === '/' && ('(,=:[!&|?{};+-*%<>~^'.includes(prevSig(i)) || src.slice(Math.max(0, i - 8), i).trimEnd().endsWith('return'))) {
      i++;
      let cls = false;
      while (i < src.length && src[i] !== '\n') {
        const d = src[i];
        if (d === BS) { i += 2; continue; }
        if (d === '[') cls = true;
        else if (d === ']') cls = false;
        else if (d === '/' && !cls) break;
        i++;
      }
      i++;
      continue;
    }
    i++;
  }
  return -1;
}

test('every unit type has stats, class, texts, model, eight colour textures and portraits', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ASSETS, 'manifest.json'), 'utf8'));
  assert.equal(Object.keys(L.UNITS).length, 25);
  for (const [k, u] of Object.entries(L.UNITS)) {
    assert.ok(L.CLASSES[u.type], k + ' class');
    assert.ok(u.name && u.desc, k + ' texts');
    assert.ok(u.men > 0 && u.hp > 0 && u.mo > 0, k + ' stats');
    assert.ok(manifest.units[k], k + ' in manifest');
    assert.ok(fs.existsSync(path.join(ASSETS, 'models', k + '.lgm')), k + ' model');
    for (let c = 0; c < 8; c++) assert.ok(fs.existsSync(path.join(ASSETS, 'tex', 'units', k + '-' + c + '.jpg')), k + ' colour ' + c);
    assert.ok(fs.existsSync(path.join(ASSETS, 'ui', 'portraits', k + '.png')), k + ' portrait');
    assert.ok(fs.existsSync(path.join(ASSETS, 'ui', 'cards', k + '.png')), k + ' card');
  }
});

test('models parse with the animation slots the renderer needs', () => {
  for (const k of Object.keys(L.UNITS)) {
    const buf = fs.readFileSync(path.join(ASSETS, 'models', k + '.lgm'));
    const m = L.parseModel(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), k);
    assert.ok(m.V > 20 && m.T >= 480, k + ' full detail mesh, triangles ' + m.T);
    for (const i of m.idx) assert.ok(i < m.V, k + ' index range');
    for (const slot of [0, 3, 10, 14, 15, 16]) assert.ok(m.anims[slot].count > 0, k + ' slot ' + slot);
    assert.ok(m.anims.some((a, i) => [4, 5].includes(i) && a.count > 0), k + ' fight slot');
    assert.ok(m.anims[3].count > m.anims[15].count, k + ' walk cycle is longer than the charge cycle');
    for (const slot of [3, 14, 15, 18]) {
      const a = m.anims[slot];
      let gap = 0;
      for (let v = 0; v < m.V * 3; v++) gap = Math.max(gap, Math.abs(m.pos[a.start * m.V * 3 + v] - m.pos[(a.start + a.count - 1) * m.V * 3 + v]));
      assert.ok(gap < 100, k + ' slot ' + slot + ' ends on its first frame, gap ' + gap);
    }
    const last = m.anims.filter(a => a.count).reduce((a, b) => Math.max(a, b.start + b.count), 0);
    assert.equal(last, m.F, k + ' frame table');
    assert.ok(m.top > 1200 && m.top < (k === 'elephant' ? 7600 : 4200), k + ' height ' + m.top);
    if (L.UNITS[k].fire && !L.UNITS[k].leader) assert.ok(m.anims[8].count > 0 || m.anims[5].count > 0, k + ' shoot slot');
  }
});

test('renderer animation names follow the original slot order', () => {
  require(path.join(DIR, 'lg-gl.js'));
  require(path.join(DIR, 'lg-render.js'));
  const original = ['WAIT', 'WAIT1', 'WAIT2', 'WALK', 'FIGHT1', 'FIGHT2', 'FIGHT3', 'FIGHT4', 'SHOOT1', 'SHOOT2', 'DYING1', 'DYING2', 'DYING3', 'DYING4', 'ROUTING', 'CHARGING', 'H2HWAIT1', 'H2HWAIT2', 'ROUTING2'];
  const want = { stand: /^WAIT$/, idle: /^WAIT[12]$/, ready: /^H2HWAIT[12]$/, fight: /^FIGHT[1-4]$/, shoot: /^SHOOT1$/, die: /^DYING[1-4]$/, walk: /^WALK$/, run: /^CHARGING$/, flee: /^ROUTING2?$/ };
  assert.deepEqual(Object.keys(L.ANIM_SLOTS).sort(), Object.keys(want).sort());
  for (const name in want) {
    assert.ok(L.ANIM_SLOTS[name].length > 0, name + ' has slots');
    for (const i of L.ANIM_SLOTS[name]) assert.match(original[i], want[name], name + ' slot ' + i);
  }
});

test('ui images for orders, formations, battle buttons and medals exist', () => {
  for (let i = 0; i < 8; i++) {
    assert.ok(fs.existsSync(path.join(ASSETS, 'ui', 'orders', 'order' + i + '.png')));
    assert.ok(fs.existsSync(path.join(ASSETS, 'ui', 'orders', 'order' + i + '-on.png')));
  }
  for (const f of Object.values(L.FORMS)) for (const idx of Object.values(f.icon)) assert.ok(fs.existsSync(path.join(ASSETS, 'ui', 'forms', 'form' + idx + '.png')), 'form icon ' + idx);
  for (const b of ['charge', 'rally', 'retreat', 'halt', 'disengage']) assert.ok(fs.existsSync(path.join(ASSETS, 'ui', 'battle', b + '.png')), b);
  for (let i = 0; i < 7; i++) assert.ok(fs.existsSync(path.join(ASSETS, 'ui', 'misc', 'miniskillicon' + i + '.png')));
  for (const f of ['purse-button', 'health-button', 'promote-squad-button', 'buy-squad-button', 'rename-squad-button', 'disband-squad-button']) assert.ok(fs.existsSync(path.join(ASSETS, 'ui', 'misc', f + '.png')), f);
  for (const t of ['frontend', 'deployment', 'inbattle', 'battlewon', 'battlelost']) assert.ok(fs.existsSync(path.join(ASSETS, 'audio', 'music', t + '.mp3')), t);
  for (const s of ['hit1a', 'die1a', 'cavdie1a', 'missilehit1', 'arrowfire1', 'rally', 'rout', 'retreat', 'attack', 'gallop', 'selected1c', 'received1c', 'click', 'fight1', 'wind1', 'cricketloop']) assert.ok(fs.existsSync(path.join(ASSETS, 'audio', 'sfx', s + '.mp3')), s);
  assert.ok(fs.existsSync(path.join(ASSETS, 'video', 'intro.mp4')));
  assert.ok(fs.existsSync(path.join(ASSETS, 'video', 'campaign-map.jpg')));
});

test('maps have heightmaps, masks and textures of the right size', async () => {
  const maps = new Set(L.LEVELS.map(l => l.map).concat(L.QUICK_MAPS));
  for (const k of maps) {
    const dir = path.join(ASSETS, 'maps', k);
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'map.json'), 'utf8'));
    assert.ok(meta.W === 257 || meta.W === 385, k + ' W');
    assert.equal(fs.statSync(path.join(dir, 'height.bin')).size, meta.W * meta.W * 4, k + ' heights');
    assert.equal(fs.statSync(path.join(dir, 'forest.bin')).size, 256 * 256, k + ' forest');
    for (const f of ['macro.jpg', 'detail.jpg', 'rock.jpg', 'sky.jpg', 'trees.webp']) assert.ok(fs.existsSync(path.join(dir, f)), k + ' ' + f);
    assert.ok(meta.trees.length >= 2, k + ' tree sprites');
    assert.ok(fs.existsSync(path.join(ASSETS, 'ui', 'maps', k + '.jpg')), k + ' thumbnail');
    const t = await L.loadTerrain(k, {});
    assert.equal(t.size, (meta.W - 1) * L.CELL);
    assert.ok(Number.isFinite(t.heightAt(t.size / 2, t.size / 2)));
  }
});

test('the roman campaign has 68 original battles in 14 eras, all valid and deployable', async () => {
  assert.equal(L.LEVELS.length, 68);
  assert.equal(L.ERAS.length, 14);
  const ids = new Set();
  let era = 0;
  for (const lv of L.LEVELS) {
    assert.ok(!ids.has(lv.id), 'unique ' + lv.id);
    ids.add(lv.id);
    assert.equal(lv.n, L.LEVELS.indexOf(lv) + 1);
    assert.ok(lv.era === era || lv.era === era + 1, lv.id + ' eras go in order');
    era = lv.era;
    assert.ok(lv.briefing.length >= 1 && lv.title && lv.short, lv.id + ' texts');
    assert.ok(lv.objectives.length >= 1, lv.id + ' objectives');
    assert.ok(lv.cap >= 5 && lv.cap <= 16, lv.id + ' cap');
    assert.ok(lv.enemy.length >= 3, lv.id + ' enemy army');
    assert.ok(lv.reward.glory > 0, lv.id + ' reward');
    assert.ok(Array.isArray(lv.medals) && lv.medals[0] > 0 && lv.medals[1] > lv.medals[0], lv.id + ' medal thresholds');
    const t = await terrain(lv);
    const z = lv.playerZone;
    assert.ok(z[0] > 0 && z[1] > 0 && z[2] < t.size && z[3] < t.size && z[2] - z[0] > 150 && z[3] - z[1] > 90, lv.id + ' zone');
    let ok = 0, all = 0;
    for (let x = z[0]; x <= z[2]; x += 16) for (let zz = z[1]; zz <= z[3]; zz += 16) { all++; if (t.passable(x, zz, 'HeavyInf')) ok++; }
    assert.ok(ok / all > 0.8, lv.id + ' zone passable ' + ok + '/' + all);
    for (const e of lv.enemy.concat(...(lv.reinforcements || []).map(r => r.squads))) {
      assert.ok(L.UNITS[e.key], lv.id + ' enemy ' + e.key);
      assert.ok(e.x > 10 && e.z > 10 && e.x < t.size - 10 && e.z < t.size - 10, lv.id + ' enemy inside');
      assert.ok(t.passable(e.x, e.z, L.UNITS[e.key].type), lv.id + ' enemy passable ' + e.key + ' ' + e.x + ',' + e.z);
      assert.ok(!(e.x > z[0] && e.x < z[2] && e.z > z[1] && e.z < z[3]), lv.id + ' enemy outside zone');
    }
    assert.ok(lv.enemy.filter(e => e.general).length <= 1, lv.id + ' one general');
    if (lv.objectives.some(o => o.type === 'killGeneral')) assert.ok(lv.enemy.some(e => e.general), lv.id + ' has a general');
    if (lv.objectives.some(o => o.type === 'destroy')) assert.ok(lv.enemy.some(e => e.elite === lv.objectives.find(o => o.type === 'destroy').tag), lv.id + ' elite');
    for (const o of lv.objectives) {
      if (o.type === 'survive' || o.type === 'time') assert.ok(o.sec >= 240 && o.sec <= 720, lv.id + ' time ' + o.sec);
      if (o.type === 'kill') assert.ok(o.n < lv.enemy.reduce((a, e) => a + L.UNITS[e.key].men, 0), lv.id + ' kill count is reachable');
    }
    const p = L.Army.newProfile('Тест', 1);
    const b = L.setupBattle(lv, p, t, { seed: 3 });
    for (const s of b.squads.filter(q => q.side === 0 && q.onField)) assert.ok(b.validDeploy(s, s.ax, s.az), lv.id + ' auto deploy ' + s.name);
    assert.equal(b.deployClashes(0).size, 0, lv.id + ' auto deploy without overlaps');
    const [cx, cz] = [(z[0] + z[2]) / 2, (z[1] + z[3]) / 2];
    const ex = lv.enemy.reduce((a, e) => a + e.x, 0) / lv.enemy.length, ez = lv.enemy.reduce((a, e) => a + e.z, 0) / lv.enemy.length;
    assert.ok(t.path(cx, cz, ex, ez, 'HeavyInf').length >= 1, lv.id + ' armies can reach each other');
  }
  const big = L.Army.newProfile('Тест', 1);
  for (const k of ['hastati', 'velites', 'westnobles', 'auxilia', 'princeps', 'legionary', 'triarii', 'auxcav', 'velites', 'levyspear', 'legionary', 'auxarchers', 'togamilitia', 'javelinmen', 'elephant']) L.Army.addSquad(big, k);
  for (const lv of L.LEVELS) {
    const b = L.setupBattle(lv, big, await terrain(lv), { seed: 5 });
    assert.equal(b.deployClashes(0).size, 0, lv.id + ' remembered deploy of a full army without overlaps');
    L.rememberDeploy(b, big);
  }
});

test('every recruitable unit is unlocked by the campaign', () => {
  const unlocked = new Set(L.START_UNLOCKED);
  for (const lv of L.LEVELS) for (const k of lv.unlocks || []) unlocked.add(k);
  for (const k of L.ROMAN_ROSTER) assert.ok(unlocked.has(k), 'unlock ' + k);
});

test('army: recruit, replenish, promote, equip, disband and save', () => {
  const p = L.Army.newProfile('Легион I', 1);
  assert.deepEqual(p.squads.map(s => s.key), ['legate', 'togamilitia', 'javelinmen', 'westlc']);
  assert.equal(p.glory, 0);
  assert.equal(p.denarii, 50);
  assert.equal(L.Army.recruit(p, 'hastati'), null, 'no glory');
  p.glory = 1000;
  assert.equal(L.Army.recruit(p, 'legionary'), null, 'locked');
  const h = L.Army.recruit(p, 'levyspear');
  assert.ok(h && p.glory === 700);
  assert.equal(h.name, 'Копейщики I');
  h.men = 30;
  const cost = L.Army.replenishCost(h);
  assert.equal(cost, 18 * L.Army.replenishCostPerMan('levyspear'));
  assert.equal(L.Army.replenish(p, h), 18);
  assert.equal(h.men, 48);
  assert.equal(L.Army.canPromote(h), false);
  h.xp = 60;
  assert.ok(L.Army.canPromote(h));
  const opts = L.Army.promoteOptions(h);
  assert.ok(opts.find(o => o.id === 'standfirm'), 'foot skill');
  assert.ok(!opts.find(o => o.id === 'ridedown'), 'no cavalry skill');
  const before = L.Army.stats(h);
  assert.ok(L.Army.promote(h, 'block'));
  const after = L.Army.stats(h);
  assert.equal(h.level, 2);
  assert.equal(after.ar - before.ar, 2);
  assert.equal(after.mo - before.mo, L.LEVEL_BONUS.mo);
  assert.equal(L.Army.canPromote(h), false);
  p.denarii = 500;
  const eq = L.Army.equipOptions(h).find(o => o.slot === 'weapon');
  assert.ok(L.Army.buyEquip(p, h, 'weapon', eq.index));
  assert.equal(p.denarii, 450);
  assert.equal(L.Army.stats(h).dm - after.dm, 5);
  assert.equal(L.Army.buyEquip(p, h, 'ammo', 0), false, 'no ammo for spearmen');
  const legate = L.Army.general(p);
  assert.equal(L.Army.disband(p, legate), false);
  assert.ok(L.Army.disband(p, h));
  const round = L.Army.normalize(JSON.parse(JSON.stringify(p)));
  assert.equal(round.squads.length, p.squads.length);
  assert.equal(round.glory, p.glory);
  const broken = L.Army.normalize({ army: 'X', squads: [{ key: 'nope' }, { key: 'hastati', men: 99 }] });
  assert.ok(broken.squads.some(s => s.key === 'legate'));
  assert.equal(broken.squads.find(s => s.key === 'hastati').men, 48);
});

test('skill trees respect class limits and prerequisites', () => {
  const lc = { key: 'westlc', level: 1, xp: 99999, skills: {}, equip: {} };
  const ids = L.Army.promoteOptions(lc).map(o => o.id);
  assert.ok(ids.includes('ridedown'));
  assert.ok(!ids.includes('standfirm'));
  assert.ok(!ids.includes('marksman'));
  assert.ok(!ids.includes('parry'), 'parry needs master dodge');
  const leg = { key: 'legate', level: 1, xp: 99999, skills: {}, equip: {} };
  const lids = L.Army.promoteOptions(leg).map(o => o.id);
  for (const k of ['quick', 'strategist', 'leadership']) assert.ok(lids.includes(k), k);
  assert.ok(!lids.includes('drill'));
  const arch = { key: 'westarchers', level: 1, xp: 99999, skills: { marksman: 4 }, equip: {} };
  const aids = L.Army.promoteOptions(arch).map(o => o.id);
  assert.ok(aids.includes('gmmarks'));
  assert.ok(!aids.includes('marksman'));
  const sq = { key: 'hastati', level: 1, xp: 0, skills: {}, equip: {} };
  L.Army.autoSkills(sq, 6, L.rng(4));
  assert.equal(sq.level, 6);
  assert.equal(Object.values(sq.skills).reduce((a, b) => a + b, 0), 5);
});

test('battle results: defeat keeps the army, victory pays and unlocks', () => {
  const lv = L.LEVELS[0];
  const p = L.Army.newProfile('Тест', 1);
  const mil = p.squads[1];
  const lost = { won: false, medal: 0, score: 0, kills: 10, lost: 20, squads: [{ id: mil.id, men: 20, kills: 10, lost: 28, xp: 40 }] };
  const r1 = L.Army.applyBattle(p, lv, lost);
  assert.equal(mil.men, 48, 'defeat does not cost men');
  assert.equal(mil.xp, 0);
  assert.equal(r1.glory, 0);
  assert.equal(p.stats.lost, 1);
  const won = { won: true, medal: 2, score: 900, kills: 50, lost: 3, squads: [{ id: mil.id, men: 45, kills: 30, lost: 3, xp: 80 }] };
  const r2 = L.Army.applyBattle(p, lv, won);
  assert.equal(mil.men, 45);
  assert.equal(mil.xp, 80);
  assert.equal(r2.glory, Math.round(lv.reward.glory * 1.5));
  assert.ok(r2.favour && p.favours.includes(r2.favour));
  assert.deepEqual(r2.unlocked.sort(), lv.unlocks.slice().sort());
  assert.ok(r2.promotions.includes(mil.id));
  assert.ok(L.levelUnlocked(p, L.LEVELS[1]));
  assert.ok(!L.levelUnlocked(p, L.LEVELS[2]));
  const again = L.Army.applyBattle(p, lv, won);
  assert.ok(again.glory < r2.glory, 'replay pays less');
  assert.equal(again.favour, null);
});

const PLANS = { attack: {}, defend: { signalAt: 99999, signalRange: 0 }, hold: { signalAt: 120, signalRange: 0 } };

test('battles across the campaign can be won by an army of their stage', async () => {
  const checks = [1, 10, 20, 31, 41, 51, 61, 68].map(n => [L.LEVELS[n - 1], 'attack']).concat([['avignon', 'hold'], ['aginnum', 'defend'], ['sambre_river', 'defend']].map(([id, plan]) => [L.levelById(id), plan]));
  for (const [lv, plan] of checks) {
    const t = await terrain(lv);
    const outcomes = [];
    for (const seed of [1, 2]) {
      const army = stageArmy(L, lv, seed);
      if (plan !== 'attack') for (const sq of army.squads) sq.deploy = { doctrine: 'longhold' };
      const b = L.setupBattle(lv, army, t, { seed: seed * 1013, autopilot: PLANS[plan] });
      const r = runBattle(b, 1500);
      outcomes.push(r ? r.reason : 'timeout');
      if (r && r.won) break;
    }
    assert.ok(outcomes.length < 2 || outcomes[1] === 'objective' || outcomes[1] === 'enemyRouted', lv.id + ' (' + plan + ') lost twice: ' + outcomes.join(', '));
  }
});

test('the campaign atlas places every battle and frames every era', () => {
  const A = L.ATLAS;
  assert.equal(A.views.length, 14);
  for (const lv of L.LEVELS) {
    const view = A.views[lv.era];
    if (view.sheet === 'latium') {
      const p = A.latium[lv.id];
      assert.ok(p && p[0] > 0 && p[0] < 1000 && p[1] > 0 && p[1] < 720, lv.id + ' latium position');
    } else {
      const p = A.battles[lv.id];
      assert.ok(p, lv.id + ' has coordinates');
      const [lon0, lat0, lon1, lat1] = view.box;
      assert.ok(p[0] > lon0 && p[0] < lon1 && p[1] > lat0 && p[1] < lat1, lv.id + ' inside its era view');
    }
  }
  for (const poly of A.lands) assert.ok(poly.length >= 4 && poly.every(q => q.length === 2 && q.every(Number.isFinite)));
  for (const e of L.ERA_INFO) assert.ok(e.name && e.years && e.intro.length && e.outro.length, e.name + ' chronicle');
});

test('simulation is deterministic for a seed', async () => {
  const lv = L.LEVELS[0];
  const t = await terrain(lv);
  const res = [];
  for (let i = 0; i < 2; i++) {
    const b = L.setupBattle(lv, L.Army.newProfile('Тест', 1), t, { seed: 77, autopilot: {} });
    const r = runBattle(b, 400);
    res.push([r.won, r.kills, r.lost, Math.round(r.time * 20), r.score].join('|'));
  }
  assert.equal(res[0], res[1]);
});

test('combat rules: spear wall, cavalry in the open, terrain and morale', async () => {
  const plain = await L.loadTerrain('plains2', {});
  let nobleWins = 0, lcWins = 0, triWins = 0, legWins = 0;
  for (let s = 1; s <= 3; s++) {
    if (duel(plain, 'westnobles', 'levyspear', s * 11).result.won) nobleWins++;
    if (duel(plain, 'westlc', 'javelinmen', s * 13).result.won) lcWins++;
    if (duel(plain, 'triarii', 'celtnobles', s * 17).result.won) triWins++;
    if (duel(plain, 'legionary', 'celticwarriors', s * 19).result.won) legWins++;
  }
  assert.ok(nobleWins <= 1, 'nobles should not beat spearmen head on');
  assert.ok(lcWins >= 2, 'light cavalry rides down skirmishers in the open');
  assert.ok(triWins >= 2, 'triarii beat cavalry');
  assert.ok(legWins >= 2, 'legionaries beat warriors');
  const b = duel(plain, 'hastati', 'peasant', 5);
  assert.ok(b.result.won);
  const peasants = b.squads[1];
  assert.ok(peasants.state === 'routing' || peasants.state === 'fled' || peasants.state === 'destroyed', 'peasants broke');
  assert.ok(peasants.lost < peasants.men0, 'they ran before dying to the last man');
  const forest = await L.loadTerrain('plains2', { overrides: [{ type: 'densewood', rect: [380, 380, 650, 700] }] });
  assert.equal(forest.typeAt(512, 600), L.T.densewood);
  assert.ok(forest.effAt(512, 600, 'HeavyInf') < 0.3);
  assert.equal(forest.effAt(512, 600, 'Skirmisher'), 1);
  assert.ok(forest.speedFactor(512, 600, 'HeavyCav') < forest.speedFactor(512, 600, 'Skirmisher'));
  let open = 0, wood = 0;
  for (let s = 1; s <= 3; s++) {
    open += duel(plain, 'celticwarriors', 'legionary', s * 23).squads[1].lost;
    wood += duel(forest, 'celticwarriors', 'legionary', s * 23).squads[1].lost;
  }
  assert.ok(wood > open, 'warriors kill more legionaries in the woods (' + wood + ' vs ' + open + ')');
});

test('command points, signal, orders and the general', async () => {
  const lv = L.LEVELS[0];
  const t = await terrain(lv);
  const b = L.setupBattle(lv, L.Army.newProfile('Тест', 1), t, { seed: 5 });
  b.start();
  const side = b.sides[0];
  assert.ok(side.cp > 0 && side.cp < side.cpMax);
  const mil = b.squads.find(s => s.key === 'togamilitia');
  assert.equal(mil.state, 'waiting');
  const cp0 = side.cp;
  assert.ok(b.command(mil, { type: 'form', form: 'attack' }));
  assert.equal(Math.round(cp0 - side.cp), Math.round(8000 - 0));
  assert.equal(b.orderCost(mil), 6500, 'attack formation makes orders cheaper');
  side.cp = 100;
  assert.equal(b.command(mil, { type: 'halt' }), false, 'no points');
  side.cp = side.cpMax;
  assert.ok(b.signal(0));
  for (let i = 0; i < 20; i++) b.tick();
  assert.ok(['advancing', 'charging', 'shooting', 'engaged'].includes(mil.state), 'signal releases the hold: ' + mil.state);
  const g = side.general;
  const costAlive = b.orderCost(mil);
  for (const s of g.soldiers) b.kill(s, null, 'melee');
  assert.ok(side.generalDead);
  assert.equal(b.orderCost(mil), Math.round(costAlive * 1.5));
  assert.equal(b.rally(0), false, 'no rally without a general');
});

test('favours of the gods change a squad for a while', async () => {
  const plain = await L.loadTerrain('plains2', {});
  const cfg = { terrain: plain, seed: 9, playerZone: [0, 0, 1024, 1024], enemyZone: [0, 0, 1024, 1024], objectives: [], player: [spec('westlc', 512, 900, Math.PI, { doctrine: 'longhold' })], enemy: [spec('peasant', 512, 120, 0, { doctrine: 'longhold' })] };
  const b = new L.Battle(cfg);
  b.start();
  const s = b.squads[0];
  assert.ok(b.useFavour(s, 'mercury'));
  const fast = b.squadSpeed(s, false);
  for (let i = 0; i < Math.round(21 / L.TICK); i++) b.tick();
  assert.equal(s.favour, null);
  assert.ok(fast > b.squadSpeed(s, false) * 1.3);
});

test('quick battle armies fit the budget', () => {
  for (const f of Object.keys(L.QUICK_FACTIONS)) {
    const list = L.quickEnemy(f, 5000, 1024, 42, 2);
    const spent = list.filter(e => !L.UNITS[e.key].leader).reduce((a, e) => a + L.UNITS[e.key].cost, 0);
    assert.ok(spent <= 5000 && spent > 3000, f + ' ' + spent);
    assert.equal(list.filter(e => L.UNITS[e.key].leader).length, 1);
    for (const e of list) assert.ok(e.x > 0 && e.x < 1024 && e.z > 0 && e.z < 1024);
  }
});

function svgOk(url, what) {
  const head = 'data:image/svg+xml;charset=utf-8,';
  assert.ok(url.startsWith(head), what + ' is an svg data url');
  const svg = decodeURIComponent(url.slice(head.length));
  assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'), what + ' svg root');
  const stack = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g)) {
    if (m[1]) assert.equal(stack.pop(), m[2], what + ' closes ' + m[2]);
    else if (!m[4]) stack.push(m[2]);
  }
  assert.equal(stack.length, 0, what + ' has balanced tags');
  const ids = new Set(Array.from(svg.matchAll(/ id="([^"]+)"/g), m => m[1]));
  for (const m of svg.matchAll(/(?:href="#|url\(#)([^")]+)/g)) assert.ok(ids.has(m[1]), what + ' refers to #' + m[1]);
  assert.ok(!/NaN|undefined|Infinity/.test(svg), what + ' has only finite numbers');
  return svg;
}

test('upgrade icons cover every skill tier, item, favour, stat, class and objective', () => {
  const I = L.Icons;
  for (const name of Object.keys(I.GLYPHS)) svgOk(I.url('disc', name, { metal: 'bronze', field: 'att' }), 'glyph ' + name);
  const used = new Set();
  for (const id of L.SKILL_ORDER) {
    assert.ok(I.SKILL_GLYPH[id], 'skill glyph ' + id);
    I.SKILL_GLYPH[id].forEach(g => used.add(g));
    const seen = new Set();
    for (let t = 0; t <= L.SKILLS[id].tiers.length; t++) seen.add(svgOk(I.skill(id, t), id + ' tier ' + t));
    assert.equal(seen.size, L.SKILLS[id].tiers.length + 1, id + ' tiers look different');
  }
  for (const slot of L.EQUIP_ORDER) {
    const e = L.EQUIP[slot];
    e.tiers.forEach((t, i) => {
      svgOk(I.equip(slot, i, e.flat ? 1 : i + 1), slot + ' ' + i);
      I.EQUIP_GLYPH[slot](i).forEach(g => used.add(g));
    });
    svgOk(I.equip(slot, 0, 0), slot + ' empty');
  }
  const relics = new Set(L.EQUIP.relic.tiers.map((t, i) => I.EQUIP_GLYPH.relic(i).join('+')));
  assert.equal(relics.size, L.EQUIP.relic.tiers.length, 'every relic has its own picture');
  for (const k of L.FAVOUR_ORDER) { svgOk(I.favour(k), 'favour ' + k); used.add(I.FAVOUR_GLYPH[k]); }
  assert.equal(new Set(L.FAVOUR_ORDER.map(k => I.FAVOUR_GLYPH[k])).size, L.FAVOUR_ORDER.length, 'every god has its own symbol');
  for (const k of ['hp', 'mo', 'speed', 'hit', 'dm', 'ar', 'ag', 'cc', 'sa', 'crit', 'tr', 'ta', 'oc', 'sh', 'sd', 'shots', 'range', 'op', 'og', 'lr']) svgOk(I.stat(k), 'stat ' + k);
  for (const k of Object.keys(L.CLASSES)) { assert.ok(I.CLASS_GLYPH[k], 'class glyph ' + k); svgOk(I.cls(k), 'class ' + k); }
  for (const lv of L.LEVELS) for (const o of lv.objectives) { assert.ok(I.OBJECTIVE_GLYPH[o.type], 'objective ' + o.type); svgOk(I.objective(o.type), 'objective ' + o.type); }
  [0, 1, 2].forEach(i => svgOk(I.medal(i), 'medal ' + i));
  svgOk(I.glory(), 'glory');
  svgOk(I.denarii(), 'denarii');
  svgOk(I.defeat(), 'defeat');
  for (const g of used) assert.ok(I.GLYPHS[g], 'glyph exists: ' + g);
  assert.equal(I.skill('swordsman', 1), I.skill('swordsman', 1), 'icons are cached');
});

test('every unit has lore: a quote with its source, a period and a history excerpt', () => {
  const units = Object.keys(L.UNITS);
  assert.deepEqual(Object.keys(L.LORE).sort(), units.slice().sort(), 'lore exists exactly for the units');
  for (const k of units) {
    const l = L.LORE[k];
    assert.ok(l.quote.length > 10 && !/^[«"„]/.test(l.quote), k + ' quote without outer quote marks');
    assert.ok(l.by.length > 5, k + ' quote source');
    assert.ok(/н\. э\.|все эпохи/.test(l.when), k + ' period');
    assert.ok(l.history.length >= 2 && l.history.every(p => p.length > 60 && /[.!?)]$/.test(p)), k + ' history paragraphs');
  }
  assert.equal(new Set(units.map(k => L.LORE[k].quote)).size, units.length, 'every unit has its own quote');
  const codex = fs.readFileSync(path.join(DIR, 'lg-ui-codex.js'), 'utf8');
  assert.ok(codex.includes('L.LORE[key]') && codex.includes('lga-epi') && codex.includes('lga-clip'), 'the codex shows the quote and the history');
});

test('F7 debug grant adds 500 glory and 500 denarii and the key is wired', () => {
  const p = L.Army.newProfile('Тест', 1);
  const g0 = p.glory, d0 = p.denarii;
  L.Army.grant(p, 500, 500);
  assert.equal(p.glory, g0 + 500);
  assert.equal(p.denarii, d0 + 500);
  L.Army.grant(p, -99999, 0);
  assert.equal(p.glory, 0, 'never negative');
  const ui = fs.readFileSync(path.join(DIR, 'lg-ui.js'), 'utf8');
  assert.ok(/e\.code === 'F7'/.test(ui) && /L\.Army\.grant\(p, 500, 500\)/.test(ui), 'F7 grants 500 and 500');
  assert.ok(ui.indexOf("e.code === 'F7'") < ui.indexOf('this.modals && this.modals.length'), 'F7 works with a dialog open');
});

test('game text has no em dashes and source files contain no comments', () => {
  const textFiles = ['lg-data', 'lg-lore', 'lg-levels', 'lg-scenarios', 'lg-atlas', 'lg-ui', 'lg-ui-menu', 'lg-ui-camp', 'lg-ui-campaign', 'lg-ui-field', 'lg-ui-arena', 'lg-ui-codex', 'lg-army', 'lg-sim', 'lg-icons'];
  for (const f of textFiles) {
    const src = fs.readFileSync(path.join(DIR, f + '.js'), 'utf8');
    assert.equal((src.match(/—/g) || []).length, 0, 'em dash in ' + f);
  }
  const files = fs.readdirSync(DIR).map(f => path.join(DIR, f)).concat([path.join(ROOT, 'js', 'apps', 'legion-app.js'), path.join(ROOT, 'tools', 'legion-shots.cjs'), path.join(ROOT, 'css', 'apps', 'legion.css'), __filename]);
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const at = findComment(src, f.endsWith('.css'));
    assert.equal(at, -1, `comment in ${path.basename(f)} at line ${src.slice(0, Math.max(0, at)).split('\n').length}`);
  }
  for (const tool of ['legion-assets.py', 'legion-scenarios.py']) {
    const py = fs.readFileSync(path.join(ROOT, 'tools', tool), 'utf8').split('\n');
    py.forEach((line, i) => assert.ok(!/^\s*#/.test(line), tool + ' comment at line ' + (i + 1)));
  }
});

test('the game is wired into the system and sold on Steam', () => {
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const page = fs.readFileSync(path.join(ROOT, 'legion.html'), 'utf8');
  const mods = fs.readdirSync(DIR).filter(f => f.endsWith('.js'));
  for (const m of mods) {
    assert.ok(index.includes('js/apps/legion/' + m), 'index includes ' + m);
    assert.ok(page.includes('js/apps/legion/' + m), 'page includes ' + m);
  }
  assert.ok(index.includes('js/apps/legion-app.js') && index.includes('css/apps/legion.css'));
  const gm = fs.readFileSync(path.join(ROOT, 'js', 'game-manager.js'), 'utf8');
  const entry = gm.slice(gm.indexOf('      legion: {'), gm.indexOf('      legion: {') + 400);
  assert.ok(/steam: true/.test(entry));
  assert.ok(/window\.appLegion/.test(gm));
  for (const f of ['js/desktop.js', 'js/taskbar.js', 'js/filesystem.js', 'js/apps/explorer.js', 'js/apps/dialogs.js', 'js/apps/task-manager.js', 'js/icons.js']) {
    assert.ok(fs.readFileSync(path.join(ROOT, f), 'utf8').includes('legion'), f);
  }
  const build = fs.readFileSync(path.join(ROOT, 'tools', 'build-exe.mjs'), 'utf8');
  assert.ok(build.includes('Legion Arena'), 'raw install excluded from exe');
});

(async () => {
  for (const [name, fn] of queue) {
    const t0 = Date.now();
    await fn();
    passed++;
    console.log(`  ok - ${name} (${Date.now() - t0} ms)`);
  }
  console.log(`${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
