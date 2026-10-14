import { Game } from '../src/avatar98/game/state.ts';
import { Battle } from '../src/avatar98/game/battle/core.ts';
import { Rng } from '../src/avatar98/core/rng.ts';
import { evalExpr, exprIdentifiers } from '../src/avatar98/core/expr.ts';
import { compileChannel } from '../src/avatar98/core/audio.ts';
import { exportTmj, importTmj } from '../src/avatar98/data/tmj.ts';
import { liftObjects, OBJECT_GENS } from '../src/avatar98/game/world.ts';
import { exportSav, importSav } from '../src/avatar98/game/save.ts';
import { PaiShoMatch, playerDeck } from '../src/avatar98/game/paisho/core.ts';
import { commandName } from '../src/avatar98/data/validate.ts';
import { makeGame, simulate } from './avatar98-sim.mjs';

function walkCommands(cmds, visit) {
  for (const c of cmds ?? []) {
    const n = commandName(c);
    visit(n, c);
    for (const k of ['then', 'else', 'win', 'lose']) if (Array.isArray(c[k])) walkCommands(c[k], visit);
    if (Array.isArray(c.branches)) for (const b of c.branches) walkCommands(b, visit);
  }
}

function allCommands(data) {
  const out = [];
  for (const [id, cmds] of Object.entries(data.events)) walkCommands(cmds, (n, c) => out.push({ event: id, name: n, cmd: c }));
  for (const m of Object.values(data.maps)) for (const e of m.entities) if (e.script) walkCommands(e.script, (n, c) => out.push({ event: `${m.id}.${e.id}`, name: n, cmd: c }));
  return out;
}

function mapGrid(data, map) {
  const legend = { ...data.tiles.legend, ...(map.legend ?? {}) };
  const parse = (rows) => Array.from({ length: map.h }, (_, y) => Array.from({ length: map.w }, (_, x) => {
    const c = rows?.[y]?.[x] ?? ' ';
    return c === ' ' ? null : legend[c] ?? null;
  }));
  const ground = parse(map.layers.ground);
  const deco = parse(map.layers.deco);
  const over = parse(map.layers.over);
  liftObjects(ground, deco, over, data.tiles.tiles);
  const solid = (x, y) => {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) return true;
    const g = data.tiles.tiles[ground[y][x]];
    if (!g || g.solid) return true;
    const d = deco[y][x] && data.tiles.tiles[deco[y][x]];
    return !!(d && d.solid);
  };
  return { ground, deco, solid };
}

function solidEntityAt(map, x, y, flags) {
  return map.entities.some((e) => {
    if (e.x !== x || e.y !== y) return false;
    if (['warp', 'trigger', 'inspect', 'hidden', 'hazard', 'enemy'].includes(e.kind)) return false;
    if (e.solid === false) return false;
    if (e.kind === 'prop' && !e.look) return false;
    if (e.solidIf || e.if) {
      const cond = e.solidIf ?? e.if;
      return evalExpr(cond, (n) => flags.has(n));
    }
    return true;
  });
}

function reach(map, grid, sx, sy, flags) {
  const seen = new Set([`${sx},${sy}`]);
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const k = `${nx},${ny}`;
      if (seen.has(k) || grid.solid(nx, ny) || solidEntityAt(map, nx, ny, flags)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return seen;
}

export async function run(data, t) {
  const { ok, dialogueKeys, stringKeys, readFileSync, readdirSync } = t;

  const regular = ['kupol_patrol', 'molerat', 'coal_spirit', 'thug', 'pigeonpig', 'vine_crawler', 'kupol_trooper', 'wasp_drone', 'corrupt_vine'];
  ok(regular.every((e) => data.enemies[e] && !data.enemies[e].boss), 'nine regular enemies exist');
  ok(data.enemies.guardian?.boss && data.enemies.captain_rou?.boss && data.enemies.hound?.boss, 'rare guardian + two bosses exist');
  ok(!!data.enemies.stray_spirit && !!data.troops.t_tutorial?.tutorial, 'scripted tutorial enemy exists');
  ok(Object.keys(data.enemies).length === 13, `13 enemy types (got ${Object.keys(data.enemies).length})`);
  const techsOf = (u) => Object.values(data.techniques).filter((x) => x.user === u && !x.limit);
  ok(techsOf('isa').length === 9, `Isa has 9 techniques (got ${techsOf('isa').length})`);
  ok(techsOf('tao').length === 7, `Tao has 7 techniques (got ${techsOf('tao').length})`);
  ok(techsOf('miri').length === 6, `Miri has 6 techniques (got ${techsOf('miri').length})`);
  ok(Object.values(data.techniques).filter((x) => x.limit).length === 1, 'one Avatar State form in demo');
  const items = Object.values(data.items);
  const cnt = (types) => items.filter((i) => types.includes(i.type)).length;
  ok(cnt(['consumable']) === 14, `14 consumables (got ${cnt(['consumable'])})`);
  ok(cnt(['weapon', 'armor', 'accessory']) === 12, `12 equipment (got ${cnt(['weapon', 'armor', 'accessory'])})`);
  ok(cnt(['sign']) === 8, `8 signs (got ${cnt(['sign'])})`);
  ok(cnt(['key']) >= 6, `6+ key items (got ${cnt(['key'])})`);
  ok(Object.keys(data.music).length === 12, `12 music tracks (got ${Object.keys(data.music).length})`);
  ok(Object.keys(data.sfx).length >= 40, `40+ sfx (got ${Object.keys(data.sfx).length})`);
  ok(Object.keys(data.quests).length >= 4, 'at least 4 side quests');
  ok(data.paisho.opponents.length === 3, '3 Pai Sho opponents');
  ok(data.radio.length === 4, '4 radio stations');
  ok(data.avatarForms.length >= 1 && data.characters.isa.limitForms.length >= 1, 'avatar form slot data');
  const byPrefix = (p) => Object.keys(data.maps).filter((m) => m.startsWith(p)).length;
  ok(byPrefix('shinryu_') === 6, 'Shinryu has 6 screens');
  ok(byPrefix('mines_') === 3, 'mines have 3 screens');
  ok(byPrefix('ferry_') === 2, 'ferry has 2 screens');
  ok(byPrefix('docks_') === 4, 'docks have 4 screens');
  ok(byPrefix('roofs_') === 2, 'rooftops have 2 screens');
  ok(byPrefix('station_') === 5, 'station has 5 screens');
  ok(data.maps.ferry_deck.source === 'tmj', 'ferry deck is imported from a Tiled .tmj file');
  const hidden = Object.values(data.maps).flatMap((m) => m.entities.filter((e) => e.kind === 'hidden'));
  ok(hidden.length === 8, `8 hidden items (got ${hidden.length})`);
  ok(new Set(hidden.map((h) => h.secret)).size === 8, 'hidden items have unique secret ids');
  const cmds = allCommands(data);
  const cutscenes = new Set(cmds.filter((c) => c.name === 'letterbox' && c.cmd.letterbox === true).map((c) => c.event));
  ok(cutscenes.size >= 12, `at least 12 cutscenes (got ${cutscenes.size})`);

  let lines = 0;
  const dkeys = new Set();
  const langDir = new URL('lang/ru/', t.ROOT);
  for (const f of readdirSync(langDir)) {
    const j = JSON.parse(readFileSync(new URL(f, langDir), 'utf8'));
    for (const [k, v] of Object.entries(j.dialogue ?? {})) {
      dkeys.add(k);
      lines += Array.isArray(v) ? v.length : 1;
    }
  }
  ok(lines >= 590, `about 600 dialogue lines (got ${lines})`);

  const speakers = new Set(Object.keys(data.speakers));
  const badSpeakers = new Set();
  for (const f of data.lang.ru) for (const v of Object.values(f.dialogue)) for (const l of Array.isArray(v) ? v : [v]) {
    const bar = l.indexOf('|');
    if (bar <= 0) continue;
    const sid = l.slice(0, bar).split(':')[0].trim();
    if (!speakers.has(sid)) badSpeakers.add(sid);
  }
  ok(badSpeakers.size === 0, `all dialogue speakers are defined (${[...badSpeakers].join(',')})`);

  const referenced = new Set();
  for (const c of cmds) {
    if (c.name === 'talk') referenced.add(c.cmd.talk);
    if (c.name === 'choice') for (const k of c.cmd.choice) referenced.add(k);
  }
  for (const m of Object.values(data.maps)) for (const e of m.entities) if (e.text) referenced.add(e.text);
  for (const e of Object.values(data.enemies)) {
    referenced.add(e.scan);
    for (const p of e.phases ?? []) if (p.say) referenced.add(p.say);
  }
  for (const tr of Object.values(data.troops)) {
    if (tr.intro) referenced.add(tr.intro);
    if (tr.tutorial) referenced.add(`tutorial.${tr.tutorial}`);
  }
  for (const r of data.radio) referenced.add(r.lines);
  const orphans = [...dkeys].filter((k) => !referenced.has(k));
  ok(orphans.length === 0, `no unreferenced dialogue (${orphans.slice(0, 8).join(', ')})`);

  const font = data.font.glyphs;
  const missing = new Set();
  const scan = (s) => {
    for (const ch of s) if (ch !== '\n' && !(ch in font) && !(ch.toUpperCase() in font)) missing.add(ch);
  };
  for (const l of Object.keys(data.lang)) for (const f of data.lang[l]) {
    for (const v of Object.values(f.strings)) scan(v);
    for (const v of Object.values(f.dialogue)) for (const x of Array.isArray(v) ? v : [v]) scan(x);
  }
  for (const it of items) {
    scan(it.name);
    scan(it.desc);
  }
  for (const x of Object.values(data.techniques)) {
    scan(x.name);
    scan(x.desc);
  }
  for (const x of Object.values(data.enemies)) scan(x.name);
  ok(missing.size === 0, `font covers all text (${[...missing].join(' ')})`);

  const srcKeys = new Set();
  const walkSrc = (dir) => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const p = new URL(f.name + (f.isDirectory() ? '/' : ''), dir);
      if (f.isDirectory()) walkSrc(p);
      else if (f.name.endsWith('.ts')) {
        const src = readFileSync(p, 'utf8');
        for (const m of src.matchAll(/(?:str|this\.app|app)\.t\(\s*'([a-z_]+\.[a-z_0-9.]+)'/g)) srcKeys.add(m[1]);
        for (const m of src.matchAll(/'((?:battle|menu|ui|save|shop|settings|title|msg|paisho|radio|ending|name|journal|items|equip|signs|status|techs|gameover)\.[a-z_0-9]+)'/g)) srcKeys.add(m[1]);
      }
    }
  };
  walkSrc(new URL('../src/avatar98/', import.meta.url));
  const ru = stringKeys(data, 'ru');
  const en = stringKeys(data, 'en');
  const missingRu = [...srcKeys].filter((k) => !ru.has(k) && !dialogueKeys(data).has(k));
  ok(missingRu.length === 0, `all UI keys used in code exist in ru (${missingRu.join(', ')})`);
  const uiKeysRu = Object.keys(data.lang.ru[0].strings);
  const missingEn = uiKeysRu.filter((k) => !en.has(k));
  ok(missingEn.length === 0, `English UI table covers every Russian UI key (${missingEn.slice(0, 6).join(', ')})`);

  const takes = cmds.filter((c) => c.name === 'take').map((c) => c.cmd.take);
  const keyTakes = takes.filter((id) => data.items[id].type === 'key');
  ok(keyTakes.every((id) => ['hana_order', 'radio_parts', 'dried_fish'].includes(id)), `only delivery key items are ever taken (${keyTakes.join(',')})`);

  for (const q of Object.values(data.quests)) {
    const steps = new Set(cmds.filter((c) => c.name === 'quest' && c.cmd.quest === q.id).map((c) => c.cmd.step));
    const radioAuto = q.id === 'radio_voices';
    for (let s = 1; s <= q.steps.length + 1; s++) ok(steps.has(s) || (radioAuto && s > 1), `quest ${q.id} can reach step ${s}`);
  }

  const allFlags = new Set();
  for (const c of cmds) if (c.name === 'flag') allFlags.add(c.cmd.flag);
  for (const m of Object.values(data.maps)) for (const e of m.entities) if (e.once) allFlags.add(e.once);
  for (const o of data.paisho.opponents) allFlags.add(o.flag);
  for (const r of data.radio) allFlags.add(r.flag);
  const engineFlags = new Set(['game_started', 'attract', 'demo_complete']);
  const readFlags = new Set();
  const addRead = (src) => {
    if (!src) return;
    for (const id of exprIdentifiers(src)) if (!id.includes('.') && id !== 'gold' && id !== 'rand' && id !== 'pipo' && id !== 'secrets' && id !== 'partysize') readFlags.add(id);
  };
  for (const c of cmds) if (c.name === 'if' || c.name === 'opt') addRead(c.cmd[c.name]);
  for (const m of Object.values(data.maps)) for (const e of m.entities) {
    addRead(e.if);
    addRead(e.solidIf);
    if (e.frame && !['anim', 'on'].includes(e.frame)) addRead(e.frame);
  }
  for (const s of Object.values(data.shops)) for (const it of s.stock) addRead(it.if);
  for (const n of data.world.nodes) addRead(n.if);
  for (const e of data.world.edges) addRead(e.if);
  for (const x of Object.values(data.techniques)) if (x.learn?.flag) allFlags.add(x.learn.flag);
  const neverSet = [...readFlags].filter((f) => !allFlags.has(f) && !engineFlags.has(f) && !f.startsWith('sw_') && !['chapter3_unlocked', 'false', 'furnace_init'].includes(f));
  ok(neverSet.length === 0, `every flag that is read is set somewhere (${neverSet.join(', ')})`);

  const docs = readFileSync(new URL('../content/avatar98/FLAGS.md', import.meta.url), 'utf8');
  const undocumented = [...allFlags].filter((f) => !docs.includes(`\`${f}\``) && !f.startsWith('sw_') && !/^(tog_|b\d|furn_)/.test(f));
  ok(undocumented.length === 0, `all story flags documented in FLAGS.md (${undocumented.slice(0, 10).join(', ')})`);

  for (const m of Object.values(data.maps)) {
    const grid = mapGrid(data, m);
    const flags = new Set(allFlags);
    for (const [sid, sp] of Object.entries(m.spawns)) ok(!grid.solid(sp.x, sp.y), `${m.id}: spawn ${sid} is on a walkable tile`);
    for (const e of m.entities) {
      if (e.kind === 'warp') ok(!grid.solid(e.x, e.y), `${m.id}: warp ${e.id} is walkable`);
    }
    const firstSpawn = Object.values(m.spawns)[0];
    const seen = reach(m, grid, firstSpawn.x, firstSpawn.y, flags);
    for (const [sid, sp] of Object.entries(m.spawns)) ok(seen.has(`${sp.x},${sp.y}`) || m.id === 'vision_vault', `${m.id}: spawn ${sid} reachable when doors are open`);
    for (const e of m.entities) {
      if (e.kind === 'warp') ok(seen.has(`${e.x},${e.y}`), `${m.id}: warp ${e.id} reachable`);
      if (['npc', 'chest', 'switch', 'shrine', 'vines', 'door', 'hidden', 'inspect'].includes(e.kind) || (e.kind === 'prop' && (e.event || e.text))) {
        const adj = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]].some(([dx, dy]) => seen.has(`${e.x + dx},${e.y + dy}`));
        ok(adj, `${m.id}: ${e.kind} ${e.id} is reachable for interaction`);
      }
      if (e.kind === 'enemy') ok(!grid.solid(e.x, e.y), `${m.id}: enemy ${e.id} stands on a walkable tile`);
    }
  }

  const lightsOut = (n, toggles, start) => {
    const seen = new Set([start]);
    const q = [start];
    const goal = (1 << n) - 1;
    while (q.length) {
      const s = q.shift();
      if (s === goal) return true;
      for (const tg of toggles) {
        const ns = s ^ tg;
        if (!seen.has(ns)) {
          seen.add(ns);
          q.push(ns);
        }
      }
    }
    return false;
  };
  ok(lightsOut(4, [0b0011, 0b0111, 0b1110, 0b1100], 0b0010), 'furnace puzzle is solvable from its initial state');
  ok(lightsOut(4, [0b0011, 0b0111, 0b1110, 0b1100], 0b0110), 'switchyard puzzle is solvable from its initial state');
  const game0 = new Game(data);
  const stateOf = (flags) => flags.reduce((s, f, i) => s | (game0.flag(f) ? 1 << i : 0), 0);
  ok(stateOf(['furn_a']) === 0, 'furnaces start cold except B');

  ok(evalExpr('a && !b || c > 2', (n) => ({ a: true, b: false, c: 1 })[n]), 'expression parser: logic');
  ok(!evalExpr('quest.dog >= 3', () => 2) && evalExpr('quest.dog >= 3', () => 3), 'expression parser: comparisons');

  const g = new Game(data);
  ok(g.s.party.length === 1 && g.s.party[0] === 'isa', 'new game starts with Isa');
  ok(g.cs('isa').equip.weapon === 'smith_gloves', 'Isa starts with the smith gloves');
  g.give('dragonhide_gloves');
  ok(g.equip('isa', 'weapon', 'dragonhide_gloves') && g.count('smith_gloves') === 1, 'equipping swaps items through the inventory');
  const atk = g.stats('isa').atk;
  g.give('sign_forge');
  g.equipSign('isa', 0, 'sign_forge');
  ok(g.stats('isa').atk === atk + 2, 'signs add stats');
  g.s.signExp.sign_forge = 200;
  ok(g.signLevel('sign_forge') === 2 && g.stats('isa').atk === atk + 6, 'signs grow with experience');
  ok(g.expFor(99) > g.expFor(15) && g.expFor(2) === 30, 'experience curve reaches level 99');
  const before = g.cs('isa').level;
  g.addExp('isa', g.expFor(10));
  ok(g.cs('isa').level >= 10 && g.cs('isa').signs.length === 3, 'level 10 unlocks a third sign slot');
  ok(before === 1, 'starting level is 1');

  const rec = { meta: { slot: 1, name: 'Иса', level: 3, place: 'Шинрю', playtime: 1234, savedAt: 1, chapter: 'ch1', clean: false, party: ['isa'] }, data: g.toSave() };
  const text = exportSav(rec);
  const back = importSav(text);
  ok(JSON.stringify(back) === JSON.stringify(rec), '.SAV export/import round-trips');
  let tampered = false;
  try {
    importSav(text.replace(/A/, 'B'));
  } catch (e) {
    tampered = true;
  }
  ok(tampered, '.SAV import rejects a damaged file');

  for (const id of ['shinryu_lane', 'docks_market', 'station_tunnels']) {
    const tmj = exportTmj(data.maps[id], data.tiles, data.tiles.legend);
    const imported = importTmj(id, JSON.parse(JSON.stringify(tmj)), data.tiles);
    const legendA = { ...data.tiles.legend, ...(data.maps[id].legend ?? {}) };
    const tileAt = (m, lg, x, y) => lg[m.layers.ground[y][x]];
    let same = true;
    for (let y = 0; y < data.maps[id].h && same; y++) for (let x = 0; x < data.maps[id].w; x++) if (tileAt(data.maps[id], legendA, x, y) !== tileAt(imported, imported.legend, x, y)) same = false;
    ok(same, `${id}: Tiled export/import keeps every tile`);
    ok(imported.entities.length === data.maps[id].entities.length, `${id}: Tiled export/import keeps entities`);
  }

  for (const tr of Object.values(data.music)) for (const ch of tr.channels) ok(compileChannel(ch, tr.steps).length > 0, `music ${tr.id}: channel compiles to notes`);

  const pm = new PaiShoMatch(data.paisho, playerDeck(g.s.paisho.tiles, data.paisho), data.paisho.opponents[2].deck, 2, new Rng(5));
  let guard = 0;
  while (!pm.over && guard++ < 10) pm.play(0, pm.playerLeads ? undefined : pm.aiLead());
  ok(pm.over && pm.history.length >= 3, 'a Pai Sho match finishes');

  const winRate = (troop, party, level, extras, n = 30) => {
    let w = 0;
    for (let i = 0; i < n; i++) if (simulate(makeGame(data, party, level, extras), troop, 7 + i * 131).result === 'win') w++;
    return w / n;
  };
  const kit = { items: { salve: 5, healer_balm: 1, jasmine_tea: 2 } };
  const r4 = winRate('t_boss_rou', ['isa', 'tao'], 4, kit);
  const r5 = winRate('t_boss_rou', ['isa', 'tao'], 5, kit);
  ok(r4 >= 0.4 && r5 >= 0.75, `Captain Rou is beatable at level 4-5 (L4 ${r4.toFixed(2)}, L5 ${r5.toFixed(2)})`);
  const lateKit = { earth: true, items: { salve: 6, healer_balm: 3, jasmine_tea: 3, sun_ash: 1 } };
  const h9 = winRate('t_boss_hound', ['isa', 'tao', 'miri'], 9, lateKit);
  const h10 = winRate('t_boss_hound', ['isa', 'tao', 'miri'], 10, lateKit);
  const h7 = winRate('t_boss_hound', ['isa', 'tao', 'miri'], 7, lateKit);
  ok(h9 >= 0.3 && h10 >= 0.8, `the Hound is beatable at level 9-10 (L9 ${h9.toFixed(2)}, L10 ${h10.toFixed(2)})`);
  ok(h7 <= 0.35, `the Hound is a real wall well below level 9 (L7 ${h7.toFixed(2)})`);
  for (const [troop, party, lvl] of [['t_tutorial', ['isa'], 1], ['t_mine_rats', ['isa'], 2], ['t_mine_coal', ['isa'], 3], ['t_docks_thugs', ['isa', 'tao'], 6], ['t_station_mix', ['isa', 'tao', 'miri'], 8]]) {
    ok(winRate(troop, party, lvl, { items: { salve: 3 } }, 15) >= 0.8, `${troop} is winnable at level ${lvl}`);
  }

  const expOnMap = (ids) => ids.reduce((s, id) => s + data.maps[id].entities.filter((e) => e.kind === 'enemy').reduce((a, e) => a + data.troops[e.troop].enemies.reduce((b, en) => b + data.enemies[en.enemy].exp, 0), 0), 0);
  const prog = new Game(data);
  prog.addExp('isa', data.enemies.stray_spirit.exp + expOnMap(['shinryu_hill', 'mines_entrance', 'mines_furnace']));
  const lvlBoss1 = prog.cs('isa').level;
  ok(lvlBoss1 >= 3 && lvlBoss1 <= 5, `no-grind level before Captain Rou is 3-5 (got ${lvlBoss1})`);
  prog.addExp('isa', data.troops.t_boss_rou.enemies.reduce((b, en) => b + data.enemies[en.enemy].exp, 0) + expOnMap(['docks_market', 'docks_alley', 'station_platform', 'station_switchyard', 'station_tunnels', 'station_labs']) + data.troops.t_red_lanterns.enemies.reduce((b, en) => b + data.enemies[en.enemy].exp, 0));
  const lvlBoss2 = prog.cs('isa').level;
  ok(lvlBoss2 >= 8 && lvlBoss2 <= 10, `no-grind level before the Hound is 8-10 (got ${lvlBoss2})`);

  const b = new Battle(makeGame(data, ['isa'], 5, {}), 't_tutorial', new Rng(3));
  const isa = b.party[0];
  ok(isa.stance === 'flame' && b.changeStance(isa, 'coal') && !b.changeStance(isa, 'heat'), 'stance change is free but once per turn');
  const bt = new Battle(makeGame(data, ['isa', 'tao'], 5, {}), 't_mine_rats', new Rng(4));
  const tao = bt.party.find((p) => p.id === 'tao');
  const op0 = tao.opora;
  bt.applyEffect(bt.enemies[0], tao, { type: 'damage', element: 'phys', power: 1, stat: 'atk' }, { hits: [] }, null);
  ok(tao.opora === op0 + 1 || tao.hp === tao.maxHp, 'Tao gains Opora when hit');
  const coal = new Battle(makeGame(data, ['isa'], 5, {}), 't_mine_coal1', new Rng(4));
  ok(coal.elemMult(coal.enemies[0], 'fire') < 0, 'coal spirits absorb fire');
  const hb = new Battle(makeGame(data, ['isa', 'tao', 'miri'], 9, {}), 't_boss_hound', new Rng(4));
  const hound = hb.enemies[0];
  ok(hb.elemMult(hound, 'metal') > 1.5 && hb.elemMult(hound, 'fire') < 0.5, 'armored Hound: metal strong, fire weak');
  hound.hp = Math.floor(hound.maxHp * 0.5);
  hb.checkEnd();
  hb['afterAction']();
  ok(hound.phase === 1 && hb.elemMult(hound, 'fire') >= 2, 'open-core Hound: fire strong');
  const drone = new Battle(makeGame(data, ['isa', 'tao', 'miri'], 8, {}), 't_station_drones', new Rng(4));
  ok(drone.elemMult(drone.enemies[0], 'chi') >= 2 && drone.elemMult(drone.enemies[0], 'earth') > 1, 'spirit-tech drones: chi and earth strong');
  ok(OBJECT_GENS.has('crate'), 'object tiles lift onto the deco layer');
}
