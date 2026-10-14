import { readFileSync } from 'node:fs';
import { Game } from '../src/avatar98/game/state.ts';
import { Battle } from '../src/avatar98/game/battle/core.ts';
import { Rng } from '../src/avatar98/core/rng.ts';

const D = (f) => JSON.parse(readFileSync(new URL(`../content/avatar98/data/${f}.json`, import.meta.url), 'utf8'));

export function combatData() {
  const data = {
    statuses: D('statuses'), techniques: D('techniques'), stances: D('stances'), characters: D('characters'), items: D('items'),
    enemies: D('enemies'), troops: D('troops'), elements: D('elements'), progression: D('progression'),
    avatarForms: [{ id: 'cycle_flash', name: 'Вспышка цикла', desc: '', tech: 'cycle_flash', unlocked: '' }],
    paisho: { tiles: [], starter: [], opponents: [], rules: {} }, chapters: [{ id: 'ch1', name: '' }],
    manifest: { startMap: 'm', startSpawn: 's' }, maps: { m: { spawns: { s: { x: 0, y: 0 } } } }, lang: {}
  };
  return data;
}

export function makeGame(data, party, level, extras = {}) {
  const g = new Game(data);
  for (const id of party) if (id !== 'isa') g.join(id, level);
  for (const id of party) g.setLevel(id, level);
  if (extras.earth) g.setFlag('isa_earth');
  for (const [it, n] of Object.entries(extras.items ?? {})) g.give(it, n);
  for (const [who, eq] of Object.entries(extras.equip ?? {})) for (const it of eq) { g.give(it, 1); g.equip(who, g.item(it).type, it); }
  for (const [who, signs] of Object.entries(extras.signs ?? {})) signs.forEach((s, i) => { g.give(s, 1); g.s.signExp[s] = extras.signExp ?? 40; g.equipSign(who, i, s); });
  g.healAll();
  return g;
}

function expected(b, a, t, tech) {
  const eff = tech.effects.find((e) => e.type === 'damage');
  if (!eff) return 0;
  const mult = b.elemMult(t, eff.element ?? 'phys');
  const stat = b.stat(a, eff.stat ?? 'mag');
  return Math.max(0, mult) * stat * (eff.power ?? 1) * (eff.hits ?? 1);
}

export function partyAi(b, a) {
  const g = b.game;
  const foes = b.alive('enemy');
  const allies = b.alive('party');
  if (!foes.length) return { kind: 'defend', actor: a.uid, targets: [] };
  if (b.limitReady(a) && (foes.length > 1 || foes.some((f) => f.boss) || allies.some((p) => p.hp / p.maxHp < 0.4))) return { kind: 'limit', actor: a.uid, targets: [] };
  const low = allies.filter((p) => p.hp / p.maxHp < 0.4).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
  const dead = b.party.find((p) => !p.alive);
  if (dead && g.count('sun_ash') > 0) return { kind: 'item', actor: a.uid, item: 'sun_ash', targets: [dead.uid] };
  const techs = g.techniques(a.id).map((t) => t).filter((t) => b.canUseTech(a, t) === 'ok');
  if (low) {
    const heal = techs.find((t) => t.effects.some((e) => e.type === 'heal') && t.target !== 'enemies');
    if (heal) {
      if (heal.group && a.stance !== heal.group && g.data.stances[heal.group]) b.changeStance(a, heal.group);
      if (!heal.group || !g.data.stances[heal.group] || a.stance === heal.group) return { kind: 'tech', actor: a.uid, tech: heal.id, targets: [low.uid] };
    }
    for (const it of ['healer_balm', 'salve']) if (g.count(it) > 0 && low.hp / low.maxHp < 0.3) return { kind: 'item', actor: a.uid, item: it, targets: [low.uid] };
  }
  if (a.mp < a.maxMp * 0.2 && g.count('jasmine_tea') > 0) return { kind: 'item', actor: a.uid, item: 'jasmine_tea', targets: [a.uid] };
  let best = null;
  let bestScore = 0;
  const atkScore = Math.max(...foes.map((f) => b.stat(a, 'atk') * Math.max(0, b.elemMult(f, 'phys'))));
  for (const t of techs) {
    if (t.group && g.data.stances[t.group] && a.stance !== t.group && a.stanceChanged) continue;
    let score = 0;
    let target = null;
    if (t.target === 'enemies') score = foes.reduce((s, f) => s + expected(b, a, f, t), 0);
    else if (t.target === 'enemy') {
      for (const f of foes) {
        const sc = expected(b, a, f, t) + (t.effects.some((e) => e.type === 'status' && e.id === 'drain') && f.enemy?.families.includes('spirittech') && !b.has(f, 'drain') ? 30 : 0);
        if (sc > score) {
          score = sc;
          target = f;
        }
      }
    }
    if (t.effects.some((e) => e.type === 'status' && e.id === 'burn') && foes.some((f) => f.boss && !b.has(f, 'burn'))) {
      score = Math.max(score, atkScore * 1.4);
      target = foes.find((f) => f.boss);
    }
    if (t.id === 'blazing_blood' && !allies.some((p) => b.has(p, 'atk_up')) && foes.some((f) => f.boss)) score = atkScore * 2;
    if (t.id === 'earth_wall' && !allies.some((p) => b.has(p, 'def_up')) && foes.some((f) => f.boss)) score = atkScore * 1.3;
    if (score > bestScore) {
      bestScore = score;
      best = { t, target };
    }
  }
  if (best && bestScore > atkScore * 1.15) {
    const t = best.t;
    if (t.group && g.data.stances[t.group] && a.stance !== t.group) b.changeStance(a, t.group);
    return { kind: 'tech', actor: a.uid, tech: t.id, targets: best.target ? [best.target.uid] : [] };
  }
  const tgt = foes.reduce((m, f) => (f.hp < m.hp ? f : m), foes[0]);
  return { kind: 'attack', actor: a.uid, targets: [tgt.uid] };
}

export function simulate(g, troop, seed) {
  const b = new Battle(g, troop, new Rng(seed));
  let frames = 0;
  let actions = 0;
  while (!b.result && frames < 60 * 60 * 15) {
    b.update(1, false);
    frames++;
    for (const ev of b.events.splice(0)) if (ev.type === 'ready' && ev.actor.side === 'party') b.submit(partyAi(b, ev.actor));
    let r;
    while ((r = b.nextAction())) {
      actions++;
      frames += 50;
      for (const ev of b.events.splice(0)) if (ev.type === 'ready' && ev.actor.side === 'party') b.submit(partyAi(b, ev.actor));
    }
  }
  return { result: b.result ?? 'timeout', frames, actions, hpLeft: b.party.map((p) => `${p.id}:${p.hp}/${p.maxHp}`).join(' '), b };
}

if (process.argv[1] && process.argv[1].endsWith('avatar98-sim.mjs')) {
  const data = combatData();
  const cases = [
    ['t_tutorial', ['isa'], 1, {}],
    ['t_hill_patrol', ['isa'], 1, {}],
    ['t_hill_patrol2', ['isa'], 2, { items: { salve: 3 } }],
    ['t_mine_rats', ['isa'], 2, { items: { salve: 3 } }],
    ['t_mine_coal', ['isa'], 3, { items: { salve: 3 } }],
    ['t_mine_rat3', ['isa'], 3, { items: { salve: 3 } }],
    ['t_mine_coal2', ['isa'], 3, { items: { salve: 3 } }],
    ['t_boss_rou', ['isa', 'tao'], 4, { items: { salve: 5, healer_balm: 1, jasmine_tea: 2 } }],
    ['t_boss_rou', ['isa', 'tao'], 5, { items: { salve: 5, healer_balm: 1, jasmine_tea: 2 } }],
    ['t_boss_rou', ['isa', 'tao'], 3, { items: { salve: 5, healer_balm: 1 } }],
    ['t_docks_pigs', ['isa', 'tao'], 6, { items: { salve: 4 } }],
    ['t_docks_thugs', ['isa', 'tao'], 6, { items: { salve: 4 } }],
    ['t_vine_crawlers', ['isa', 'tao'], 6, { items: { salve: 4 } }],
    ['t_red_lanterns', ['isa', 'tao'], 7, { items: { salve: 4 } }],
    ['t_station_troopers', ['isa', 'tao', 'miri'], 8, { items: { salve: 4, healer_balm: 2 } }],
    ['t_station_drones3', ['isa', 'tao', 'miri'], 8, { items: { salve: 4, healer_balm: 2 } }],
    ['t_station_vines2', ['isa', 'tao', 'miri'], 9, { items: { salve: 4, healer_balm: 2 } }],
    ['t_boss_hound', ['isa', 'tao', 'miri'], 9, { earth: true, items: { salve: 6, healer_balm: 3, jasmine_tea: 3, sun_ash: 1 } }],
    ['t_boss_hound', ['isa', 'tao', 'miri'], 10, { earth: true, items: { salve: 6, healer_balm: 3, jasmine_tea: 3, sun_ash: 1 } }],
    ['t_boss_hound', ['isa', 'tao', 'miri'], 8, { earth: true, items: { salve: 6, healer_balm: 3, jasmine_tea: 3, sun_ash: 1 } }],
    ['t_guardian', ['isa', 'tao', 'miri'], 10, { items: { salve: 6, healer_balm: 3, jasmine_tea: 3, sun_ash: 1 } }],
    ['t_guardian', ['isa', 'tao', 'miri'], 12, { items: { salve: 6, healer_balm: 3, jasmine_tea: 3, sun_ash: 1 } }]
  ];
  for (const [troop, party, lvl, ex] of cases) {
    let wins = 0;
    let secs = 0;
    const N = 40;
    for (let i = 0; i < N; i++) {
      const g = makeGame(data, party, lvl, ex);
      const r = simulate(g, troop, 1000 + i * 7919);
      if (r.result === 'win') wins++;
      secs += r.frames / 60;
    }
    console.log(`${troop.padEnd(20)} L${String(lvl).padEnd(3)} ${party.join('+').padEnd(14)} win ${String(Math.round((wins / N) * 100)).padStart(3)}%  ~${Math.round(secs / N)}s`);
  }
}
