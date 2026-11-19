const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/hsr98');
global.Hsr98 = require(path.join(DIR, 'hsr-core.js'));
const H = global.Hsr98;
const html = fs.readFileSync(path.join(ROOT, 'hsr98.html'), 'utf8');
const mods = [...html.matchAll(/js\/apps\/hsr98\/(hsr-[a-z0-9-]+)\.js/g)].map(m => m[1]);
for (const f of mods.slice(0, mods.indexOf('hsr-gfx'))) if (f !== 'hsr-core') require(path.join(DIR, f + '.js'));
const SU = H.SU;

const TEAMS = {
  1: ['trail', 'march', 'danheng', 'arlan'], 2: ['trail', 'march', 'danheng', 'natasha'], 3: ['trail', 'march', 'danheng', 'natasha'],
  4: ['trail', 'march', 'natasha', 'hook'], 5: ['trail', 'march', 'natasha', 'serval'], 6: ['trail', 'march', 'natasha', 'serval'],
  7: ['trail', 'march', 'natasha', 'serval'], 8: ['trail', 'march', 'natasha', 'serval'], 9: ['trail', 'himeko', 'asta', 'natasha']
};

function drive(g, max = 4000) {
  let n = 0;
  while (n++ < max) {
    if (g.battle) {
      const b = g.battle;
      if (!b.ev.length && b.phase === 'run' && !b.over) b.start();
      b.runAuto(1500);
      const out = g.endBattle();
      if (out && out.lost) return out;
      g.afterBattle();
      continue;
    }
    if (g.pending) { if (g.pending.type === 'choice') g.resume(0); else g.resume(); continue; }
    if (g.script) { g.advanceScript(); continue; }
    return null;
  }
  return { stuck: true };
}

function stand(g, e) {
  for (const [dx, dy, dir] of [[0, 1, 'up'], [0, -1, 'down'], [1, 0, 'left'], [-1, 0, 'right']]) {
    if (!g.blocked(e.x + dx, e.y + dy)) { g.placePlayer(e.x + dx, e.y + dy); g.player.dir = dir; return; }
  }
}

function clearDomain(g) {
  const dom = g.state.su.dom;
  if (['combat', 'elite', 'boss'].includes(dom.type)) {
    for (const ch of ['2', '1']) {
      const e = g.map.ents.find(x => x.kind === 'enemy' && x.ch === ch && g.visible(x));
      if (!e) continue;
      g.encounter(e, 'player');
      const lost = drive(g);
      if (lost) return lost;
      if (!g.state.su) return null;
    }
  } else if (dom.type === 'respite') {
    for (const obj of g.map.ents.filter(x => (x.kind === 'su_heal' || x.kind === 'su_tp') && g.visible(x))) { stand(g, obj); g.interact(); }
    stand(g, g.map.ents.find(x => x.kind === 'npc' && x.def.who === 'herta'));
    g.interact();
    drive(g);
    for (const it of g.suShop()) if (!it.off && it.id !== 'enhance' && g.state.su.frag >= it.cost) { g.suShopBuy(it.id); drive(g); }
  } else {
    stand(g, g.map.ents.find(x => x.kind === 'su_frame'));
    g.interact();
    const lost = drive(g);
    if (lost) return lost;
  }
  if (g.state.su) for (const d of g.map.ents.filter(x => x.kind === 'destr' && g.visible(x))) g.breakDestr(d);
  return null;
}

function play(g) {
  let guard = 0;
  while (g.state.su && guard++ < 20) {
    const lost = clearDomain(g);
    if (lost) return { lost: true, d: g.state.su ? g.state.su.d : -1 };
    if (!g.state.su) break;
    const portal = g.map.ents.find(x => x.kind === 'portal' && g.visible(x));
    if (!portal) return { stuck: true };
    g.placePlayer(portal.x, portal.y);
    g.onStep();
    drive(g);
  }
  return null;
}

function run(o) {
  const w = SU.WORLDS.find(x => x.id === o.world), row = w.diff[o.diff - 1], keep = { atk: row.atk, hp: row.hp };
  if (o.atk) row.atk = o.atk;
  if (o.hp) row.hp = o.hp;
  let wins = 0;
  const deaths = [];
  for (let seed = 1; seed <= o.seeds; seed++) {
    const st = H.newState();
    for (const f of ['intro', 'asta_met', 'hs_power', 'arlan_met', 'doom', 'express_intro', 'events_note', 'su_open', 'su_beta_done', 'returned', 'time_done', 'first_a', 'first_b', 'first_c', 'first_d', 'first_e', 'first_f']) st.flags[f] = true;
    for (let i = 1; i < o.world; i++) st.flags['su_clear_' + i] = true;
    for (let d = 2; d < o.diff; d++) st.flags['su_clear_' + o.world + '_' + d] = true;
    if (o.diff > 1) st.flags['su_clear_' + o.world] = true;
    Object.assign(st.quests, { lf_q5: 'done', lf_q9: 'done', lf_dh4: 'done', lf_q12: 'done' });
    const team = o.team || TEAMS[o.world];
    for (const id of team) st.roster[id] = { lvl: o.lvl, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
    st.party = team.slice();
    st.suPaths = Object.keys(SU.PATHS);
    if (o.tree) st.suTree = { pts: 0, got: SU.TREE.filter(n => o.tree === 'full' || SU.TREE.filter(x => x.br === n.br).indexOf(n) < 2).map(n => n.id) };
    Object.assign(st, { map: 'hs_office', x: null, y: null });
    const g = new H.Game({ state: st, seed: seed * 31 + o.world });
    const p = o.path || Object.keys(SU.PATHS)[seed % Object.keys(SU.PATHS).length];
    if (!g.suStart(o.world, p, team, { diff: o.diff })) throw new Error('the run did not start');
    const r = play(g);
    if (!r) wins++; else deaths.push(r.d);
  }
  Object.assign(row, keep);
  return { wins, seeds: o.seeds, deaths };
}

function main(argv) {
  const [world, diff, lvl, atk, hp, seeds] = argv.filter(a => !a.startsWith('--')).map(Number);
  const flag = k => { const a = argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : null; };
  const o = { world, diff: diff || 1, lvl, atk: atk || 0, hp: hp || 0, seeds: seeds || 8, team: flag('team') ? flag('team').split(',') : null, path: flag('path'), tree: flag('tree') };
  if (argv.includes('--paths')) {
    for (const p of Object.keys(SU.PATHS)) console.log(JSON.stringify(Object.assign({ path: p }, run(Object.assign({}, o, { path: p })))));
    return;
  }
  console.log(JSON.stringify(Object.assign({ world: o.world, diff: o.diff, lvl: o.lvl }, run(o))));
}

if (require.main === module) main(process.argv.slice(2));

module.exports = { run, TEAMS };
