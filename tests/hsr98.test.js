const assert = require('node:assert/strict');
const path = require('path');
const DIR = path.join(__dirname, '../js/apps/hsr98');
const H = require(path.join(DIR, 'hsr-core.js'));
for (const f of ['hsr-data', 'hsr-battle', 'hsr-inaba', 'hsr-fours', 'hsr-world', 'hsr-story', 'hsr-game', 'hsr-su-data', 'hsr-su-battle', 'hsr-su-story', 'hsr-su', 'hsr-chat', 'hsr-missions', 'hsr-hook', 'hsr-section6', 'hsr-info', 'hsr-fours-info', 'hsr-express', 'hsr-herta', 'hsr-herta-life', 'hsr-seclusion', 'hsr-memory', 'hsr-messenger', 'hsr-velvet']) require(path.join(DIR, f + '.js'));

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const eq = (a, b, m) => { assert.equal(a, b, m); checks++; };
const t0 = Date.now();
const log = [];

const FX = new Set(['dmg', 'heal', 'hot', 'shield', 'taunt', 'buff', 'debuff', 'dot', 'freeze', 'imprison', 'delay', 'advance', 'energy', 'cleanse', 'dispel', 'selfCost', 'extendDots', 'killEnergy', 'magma', 'hookEnhance', 'resurge', 'bloom', 'invig', 'sync', 'yanqingUlt', 'svarogMarked', 'svMark', 'promise', 'frost', 'polarity', 'stance', 'shinra', 'eclipse', 'chaosAll', 'note', 'reinc', 'cue', 'maestro', 'notesAll', 'ember', 'elysium', 'elysiumAll', 'nightmare', 'steal', 'bind', 'drain', 'heist', 'purge', 'wet', 'freezeWet', 'chant', 'collapse', 'swing', 'cover', 'ecstasy', 'ecstasySpend', 'luck', 'onMe', 'tauntTo', 'cleanseAll', 'detonate', 'implant', 'implantAll', 'hpCost', 'hellscape', 'sentence', 'tallyReset', 'shuhuFull', 'freeSkill', 'stitch', 'stitchAll', 'analyze', 'wave', 'execute', 'allOut', ...H.FOURS.FX]);
const G0bg = id => ['station', 'express', 'snow', 'city', 'under', 'rivet', 'hill'].includes(id);
const TARGETS = new Set(['single', 'blast', 'all', 'bounce', 'ally', 'allies', 'self']);

for (const [id, c] of Object.entries(H.CHARS)) {
  ok(H.PATHS[c.path] && H.ELEMENTS[c.elem], 'char path/elem ' + id);
  for (const k of ['basic', 'skill', 'ult']) {
    ok(c[k] && TARGETS.has(c[k].target), 'ability target ' + id + '.' + k);
    for (const f of c[k].fx) ok(FX.has(f.k), 'fx kind ' + id + '.' + k + ' ' + f.k);
  }
  for (const ab of [c.enhanced, ...(c.skills || [])].filter(Boolean)) {
    ok(TARGETS.has(ab.target), 'extra ability target ' + id + ' ' + ab.name);
    for (const f of ab.fx) ok(FX.has(f.k), 'extra fx kind ' + id + ' ' + f.k);
  }
  ok(c.tech && c.tech.fx, 'tech ' + id);
  eq(c.contact.length, 2, 'contact actions ' + id);
  ok(c.contact.every(x => ['joke', 'cute', 'threat', 'science', 'kind', 'sing', 'bribe', 'silent', 'weird'].includes(x.tag)), 'contact tags ' + id);
}
for (const [id, f] of Object.entries(H.FUSIONS)) {
  ok(f.members.length >= 2 && new Set(f.members).size === f.members.length && f.members.every(m => H.CHARS[m]), 'fusion members ' + id);
  for (const x of f.fx) ok(FX.has(x.k), 'fusion fx ' + id);
}
for (const [id, e] of Object.entries(H.ENEMIES)) {
  ok(e.weak.length > 0 && e.weak.every(w => H.ELEMENTS[w]), 'enemy weak ' + id);
  ok(e.skills.length > 0, 'enemy skills ' + id);
  for (const s of e.skills) {
    ok(['single', 'blast', 'all', 'self', 'summon', 'charge', 'lock', 'rally'].includes(s.t), 'enemy skill type ' + id + ' ' + s.n);
    if (s.next != null) ok(e.skills[s.next] && s.next !== e.skills.indexOf(s), 'enemy next ' + id);
    if (s.summon) ok(s.summon.every(x => H.ENEMIES[x]), 'summon ids ' + id);
  }
  if (e.pat) ok(e.pat.every(i => e.skills[i] && e.skills[i].t !== 'charge' || e.skills[i].next != null), 'pattern ' + id);
  ok(e.fam === 'boss' || H.CONTACT[e.fam], 'contact family ' + id);
}
for (const pool of Object.values(H.WARP_POOL)) for (const p of pool) ok(p.startsWith('cone:') ? H.CONES[p.slice(5)] : H.CHARS[p], 'warp pool ' + p);
for (const [id, s] of Object.entries(H.SHOPS)) for (const e of s.items) { const p = e.split(':'); ok(p[0] === 'cone' ? H.CONES[p[1]] : p[0] === 'relic' ? H.CAVERN_SETS.includes(p[1]) && H.CAVERN_SLOTS.some(x => x.key === p[2]) && +p[3] > 0 : H.ITEMS[p[0]], 'shop item ' + id + ' ' + e); }

for (const [id, m] of Object.entries(H.MAPS)) {
  const W = m.rows[0].length;
  ok(m.rows.every(r => r.length === W), 'map row widths ' + id);
  const marks = {};
  m.rows.forEach((r, y) => [...r].forEach((ch, x) => { if (!H.TILES[ch]) (marks[ch] = marks[ch] || []).push([x, y]); }));
  for (const ch of Object.keys(marks)) ok(/[acd0-9]/.test(ch) || m.marks[ch], 'mark defined ' + id + ' ' + ch);
  for (const ch of Object.keys(marks).filter(c => /[0-9]/.test(c))) ok(m.su || (m.enemies[ch] && m.enemies[ch].g.every(e => H.ENEMIES[e])), 'enemy group ' + id + ' ' + ch);
  eq((marks.c || []).length, m.chests.length, 'chest count ' + id);
  eq((marks.a || []).length, m.anchors.length, 'anchor count ' + id);
  for (const [ch, mk] of Object.entries(m.marks)) {
    if (mk.type === 'exit') ok(H.MAPS[mk.to] && H.MAPS[mk.to].rows.some(r => r.includes(mk.at)), 'exit target ' + id + ' ' + ch);
    if (mk.script) ok(H.SCRIPTS[mk.script] || H.SU.SCRIPTS[mk.script], 'mark script ' + id + ' ' + mk.script);
    if (mk.type === 'npc') ok(mk.visitor != null || H.SPEAKERS[mk.who] || H.CHARS[mk.who], 'npc speaker ' + mk.who);
  }
  for (const oe of m.onEnter || []) ok(H.SCRIPTS[oe.script], 'onEnter script ' + oe.script);
  const solid = ch => H.TILES[ch] && H.TILES[ch].solid;
  const npcs = new Set();
  for (const [ch, list] of Object.entries(marks)) if (m.marks[ch] && m.marks[ch].type === 'npc') list.forEach(([x, y]) => npcs.add(x + ',' + y));
  const start = (Object.entries(marks).find(([ch]) => m.marks[ch] && (m.marks[ch].type === 'spawn' || m.marks[ch].type === 'exit')) || [])[1][0];
  const seen = new Set([start.join(',')]), q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, ch = (m.rows[ny] || '')[nx];
      if (ch === undefined || solid(ch)) continue;
      const k = nx + ',' + ny;
      if (seen.has(k)) continue;
      seen.add(k);
      if (!npcs.has(k)) q.push([nx, ny]);
    }
  }
  for (const [ch, list] of Object.entries(marks)) for (const [x, y] of list) ok(seen.has(x + ',' + y), 'reachable ' + id + ' ' + ch + ' @' + x + ',' + y);
}

const UIS = new Set(['book', 'name', 'shop', 'rumor', 'warp', 'calyx', 'nav', 'databank', 'su', 'su_shop', 'fh', 'fh_shop', 'doc']);
for (const [name, steps] of Object.entries(Object.assign({}, H.SCRIPTS, H.SU.SCRIPTS))) {
  const labels = new Set(steps.filter(s => typeof s === 'string' && s[0] === '#').map(s => s.slice(1)));
  for (const st of steps) {
    if (typeof st === 'string') {
      if (st[0] === '#') continue;
      const head = st.slice(0, st.indexOf('|')), spk = head.split('=')[0], text = st.slice(st.indexOf('|') + 1);
      ok(spk === '' || spk === '@' || H.SPEAKERS[spk], 'speaker ' + name + ' ' + spk);
      ok(!head.includes('=') || head.split('=')[1], 'speaker name override ' + name + ' ' + head);
      ok(!/—/.test(st), 'no em dash in ' + name + ': ' + text.slice(0, 40));
      ok(!/\{[^{}]*\{/.test(text) && text.replace(/\{[^{}|]*\|[^{}|]*\}/g, '').replace(/\{name\}/g, '').search(/[{}|]/) < 0, 'gender forms well formed in ' + name + ': ' + text.slice(0, 40));
      continue;
    }
    if (st.jump) ok(labels.has(st.jump), 'label ' + name + ' ' + st.jump);
    if (st.choice) for (const c of st.choice) ok(labels.has(c[1]) && c[0].replace(/\{[^{}|]*\|[^{}|]*\}/g, '').replace(/\{name\}/g, '').search(/[{}|]/) < 0, 'choice label ' + name + ' ' + c[1]);
    if (st.menu) for (const c of st.menu.concat(st.exit ? [st.exit] : [])) ok(labels.has(c[1]), 'menu label ' + name + ' ' + c[1]);
    if (st.menu) ok(st.exit, 'menu has an exit ' + name);
    if (st.battle) ok(H.ENCOUNTERS[st.battle], 'battle ' + name + ' ' + st.battle);
    if (st.goto) ok(H.MAPS[st.goto[0]] && H.MAPS[st.goto[0]].rows.some(r => r.includes(st.goto[1])), 'goto ' + name);
    if (st.ui) ok(UIS.has(st.ui), 'ui ' + name + ' ' + st.ui);
    if (st.join) ok(H.CHARS[st.join], 'join ' + st.join);
    if (st.script) ok(H.SCRIPTS[st.script], 'chain ' + st.script);
    if (st.shop) ok(H.SHOPS[st.id], 'shop ' + st.id);
    if (st.ui === 'shop') ok(H.SHOPS[st.id], 'shop id ' + name);
    if (st.ui === 'rumor') ok(H.RUMORS.some(r => r.who === st.who), 'rumor who ' + st.who);
    if (st.ui === 'doc') ok(H.DOCS[st.doc], 'doc ' + name + ' ' + st.doc);
    if (st.lift) ok(H.MAPS[st.lift[0]] && H.MAPS[st.lift[0]].rows.some(r => r.includes(st.lift[1])), 'lift ' + name);
  }
}

{
  const titles = new Set(), gender = t => t.replace(/\{[^{}|]*\|[^{}|]*\}/g, '').replace(/\{name\}/g, '').search(/[{}|]/) < 0;
  let recaps = 0;
  for (const [name, steps] of Object.entries(H.SCRIPTS)) {
    const isSay = st => typeof st === 'string' && st[0] !== '#';
    for (const st of steps) {
      if (!st || !st.recap) continue;
      recaps++;
      ok(!titles.has(st.recap), 'recap title is unique ' + st.recap);
      titles.add(st.recap);
      ok(st.recap.length <= 28 && st.text && st.text.length >= 80 && st.text.length <= 480, 'recap size ' + name + ' ' + st.recap);
      ok(!/—/.test(st.recap + st.text) && gender(st.text), 'recap text is clean ' + name + ' ' + st.recap);
    }
    const entries = H.scriptEntries(steps), bounds = [0].concat(entries).sort((a, b) => a - b).concat(steps.length);
    for (let b = 0; b + 1 < bounds.length; b++) {
      let cover = false, loose = 0;
      for (let i = bounds[b]; i < bounds[b + 1]; i++) {
        if (steps[i] && steps[i].recap) cover = true;
        else if (isSay(steps[i]) && !cover) loose++;
      }
      ok(loose <= 2, 'every scene longer than two lines has a recap ' + name + ' block ' + b + ' (' + loose + ' loose lines)');
    }
  }
  ok(recaps >= 40, 'story has ' + recaps + ' recaps');
}

{
  const g = new H.Game({ fresh: true, seed: 5 });
  const run = () => { let n = 0; while (g.pending && g.pending.type === 'cine' && n++ < 20) g.resume(); };
  run();
  eq(g.pending && g.pending.type, 'say', 'the prologue starts with dialogue after the first cinematic');
  eq(g.skipInfo().title, 'Сосуд', 'the prologue offers the vessel recap');
  ok(g.state.recaps.includes('Сосуд'), 'a reached recap goes into the story log');
  const ev0 = g.events.length;
  ok(g.skip(), 'skip starts');
  ok(g.pending && g.pending.type === 'tut' && g.skipping, 'skip stops at the battle tutorial and keeps skipping');
  ok(!g.events.slice(ev0).some(e => e.t === 'sfx'), 'skipped steps stay silent');
  eq(g.state.party.join(), 'kafka,silverwolf', 'the prologue is played by Kafka and Silver Wolf');
  ok(g.state.roster.kafka.guest && g.state.guest && g.state.guest.party.join() === 'trail', 'the guests are temporary and the real party waits');
  g.resume();
  ok(g.battle && !g.skipping, 'a battle ends the skip');
  const v = new H.Game({ state: Object.assign(H.newState(), { map: 'hs_base', x: null, y: null, flags: { kafka_go: true, kafka_room: true, kafka_hack: true, kafka_curio: true } }), seed: 8 });
  v.setGuest(['kafka', 'silverwolf'], { solo: true, lvl: 12 });
  v.runScript('base_screen');
  eq(v.skipInfo().title, 'Стелларон', 'the vault scene brings its recap');
  ok(v.skip(), 'the vault scene can be skipped');
  ok(v.pending && v.pending.type === 'ui' && v.pending.ui === 'name' && v.skipping, 'skip stops at the vessel choice and keeps skipping');
  v.resume({ name: 'Стелла', gender: 'f' });
  let guard = 0, choices = 0;
  while (v.pending && (v.pending.type === 'choice' || v.pending.type === 'cine') && guard++ < 30) { if (v.pending.type === 'choice') choices++; v.resume(0); }
  ok(choices >= 3, 'every choice of the skipped scene is still asked (' + choices + ')');
  ok(!v.skipping && v.pending && v.pending.type === 'say', 'the next scene stops the skip');
  eq(v.skipInfo().title, 'Пробуждение', 'the next scene brings its own recap');
  eq(v.state.name, 'Стелла', 'the vessel choice made during the skip is kept');
  ok(!v.state.guest && !v.state.roster.kafka && v.state.party.join() === 'trail' && v.state.flags.chaos, 'the guests leave and the Trailblazer is back');
  eq(v.map.id, 'hs_storage', 'the Trailblazer wakes in the Storage Zone');
  v.skip();
  while (v.pending && v.pending.type !== 'tut' && guard++ < 60) v.resume(0);
  ok(v.state.party.includes('march') && !v.state.party.includes('danheng'), 'effects inside a skipped scene still apply: March joins, Dan Heng goes after Arlan');
  v.resume();
  ok(v.battle && !v.skipping, 'the first battle ends the skip');
  const st = H.newState();
  delete st.recaps;
  delete st.hsv;
  Object.assign(st.flags, { intro: true, asta_met: true, hs_power: true });
  const old = new H.Game({ state: st, seed: 6 }), log = old.recapLog().map(r => r.title);
  ok(log.includes('Сосуд') && log.includes('Первый бой') && log.includes('Лифт наверх'), 'old saves rebuild the story log from flags');
  ok(!log.includes('Расспросы Асты') && !log.includes('Перрон'), 'old saves do not log scenes they never reached');
  ok(old.map.id === 'hs_control' && old.state.flags.storm && !old.state.flags.asta_met && !old.state.flags.hs_power && old.state.roster.arlan, 'an old save in the middle of the prologue moves to the Master Control Zone before Asta');
  const quiet = new H.Game({ state: Object.assign(H.newState(), { map: 'j_belobog', x: null, y: null }), seed: 7 });
  quiet.runScript('fort_guard');
  ok(quiet.pending && quiet.pending.type === 'say' && !quiet.skipInfo() && !quiet.skip(), 'a one-line talk has nothing to skip');
}

{
  eq(H.cond('a&!b|c', { a: 1 }), true, 'cond and-not');
  eq(H.cond('a&!b|c', { a: 1, b: 1 }), false, 'cond blocked');
  eq(H.cond('a&!b|c', { a: 1, b: 1, c: 1 }), true, 'cond or');
  eq(H.cond('', {}), true, 'cond empty');
}

{
  const placed = H.WORLDS.flatMap(w => w.groups.flatMap(gr => gr.areas.map(a => a.map))).concat(H.EXPRESS_AREAS.map(a => a.map));
  for (const id of Object.keys(H.MAPS)) eq(placed.filter(m => m === id).length, H.MAPS[id].su ? 0 : 1, 'map ' + id + ' belongs to exactly one navigation area');
  for (const w of H.WORLDS) for (const gr of w.groups) for (const a of gr.areas) ok(a.name && a.text && !/—/.test(a.text), 'area text ' + a.map);
  for (const id of Object.keys(H.MAPS)) {
    const probe = new H.Game({ state: Object.assign(H.newState(), { map: id, x: null, y: null }), seed: 1 });
    const L = H.mapLayout(id);
    eq(L.anchors.map(a => a.key).join(), probe.map.ents.filter(e => e.kind === 'anchor').map(e => e.key).join(), 'navigation layout anchors match the loaded map ' + id);
    eq(L.chests.map(a => a.key).join(), probe.map.ents.filter(e => e.kind === 'chest').map(e => e.key).join(), 'navigation layout chests match the loaded map ' + id);
  }
  let targets = 0;
  for (const [name, steps] of Object.entries(H.SCRIPTS)) for (const st of steps) {
    if (!st || !st.obj) continue;
    if (!st.at) { ok(/Свободная игра/.test(st.obj), 'objective has a map target ' + name); continue; }
    const [map, ch] = st.at.split(':');
    ok(H.MAPS[map] && (!ch || H.mapLayout(map).marks[ch]), 'objective target resolves ' + st.at);
    targets++;
  }
  ok(targets >= 15, 'story objectives point at the map');
  const st = H.newState();
  for (const f of ['intro', 'asta_met', 'hs_power', 'doom', 'express_intro', 'jarilo_arrive', 'plains_met', 'belobog_intro', 'sampo_met']) st.flags[f] = true;
  Object.assign(st, { map: 'j_belobog', x: null, y: null, obj: 'Прогуляться по Белобогу: заглянуть в мастерскую «Нейвервинтер» (юго-восток)' });
  const g = new H.Game({ state: st, seed: 2 });
  eq(g.destinations()[0].map, 'express', 'the Express stays the first destination');
  eq(g.routeExit('hs_base', 'hs_storage'), 'Ω', 'route from the base to storage uses the Space Elevator');
  eq(g.routeExit('j_belobog', 'u_mine'), 'u', 'route from Belobog to the mine goes down the hatch');
  eq(g.routeExit('u_rivet', 'j_everwinter'), 'w', 'route out of Rivet Town starts at its west exit');
  eq(g.routeExit('hs_base', 'hs_base'), null, 'no route inside the same area');
  const goal = g.objTarget();
  ok(goal && goal.map === 'j_belobog' && goal.mark === 'v', 'objective target follows the current objective text');
  const bel = g.navPoints('j_belobog');
  ok(bel.some(p => p.kind === 'shop' && p.shop === 'belobog') && bel.some(p => p.kind === 'rumor' && p.rumor === 'sampo_belobog'), 'Belobog map shows the shop and the rumor seller');
  ok(bel.some(p => p.kind === 'goal' && p.goal), 'the workshop gets an objective marker');
  ok(bel.some(p => p.kind === 'exit' && p.to === 'j_fissures' && p.locked) && bel.some(p => p.kind === 'exit' && p.to === 'u_boulder' && p.locked), 'closed gates and the cordoned alley are locked exits');
  ok(bel.every((p, i) => !i || bel[i - 1].x <= p.x), 'markers are ordered left to right');
  const exp = g.navPoints('express');
  for (const k of ['shop', 'warp', 'calyx', 'nav', 'anchor']) ok(exp.some(p => p.kind === k), 'Express map shows ' + k);
  ok(!exp.some(p => p.kind === 'landing'), 'the Express landing point merges into its anchor');
  const base = g.navPoints('hs_control');
  ok(base.some(p => (p.kind === 'landing' && p.at === 'v') || p.landing === 'v'), 'the Herta station landing point is in the Master Control Zone');
  ok(!g.navPoints('hs_base').some(p => p.kind === 'landing'), 'the Base Zone has no landing point after the move');
  ok(base.filter(p => p.kind === 'shop').length === 2 && g.navPoints('hs_office').some(p => p.kind === 'su'), 'the control zone shows two shops and the office shows the Simulated Universe');
  g.state.obj = 'Найти Олега в Великой шахте (восточный выход)';
  ok(g.navPoints('j_belobog').some(p => p.kind === 'exit' && p.ch === 'u' && p.route), 'the exit toward an objective in another area is marked');
  ok(g.areaOpen(g.areaOf('j_plains').area) && !g.areaOpen(g.areaOf('u_mine').area), 'areas open with the story');
  eq(g.expressWorld().id, 'jarilo', 'the Express is parked at Jarilo-VI after the introduction');
  ok(!g.worldOpen(H.WORLDS.find(w => w.id === 'luofu')), 'the Luofu route is not open');
  const anc = g.navPoints('hs_storage').find(p => p.kind === 'anchor');
  const off = g.teleportFor(anc);
  ok(!off.ok && /не активирован/.test(off.why), 'an inactive anchor explains why it cannot be used');
  g.state.anchors.push(anc.key);
  const on = g.teleportFor(g.navPoints('hs_storage').find(p => p.kind === 'anchor'));
  ok(on.ok && on.dest.kind === 'anchor' && on.dest.key === anc.key, 'an active anchor gives a teleport destination');
  const belA = bel.find(p => p.kind === 'anchor');
  ok(belA.landing === 'a' && g.teleportFor(belA).ok && g.teleportFor(belA).dest.kind === 'map', 'the Belobog anchor doubles as the landing point before it is touched');
  g.state.flags.fled = true;
  ok(!g.teleportFor(g.navPoints('j_belobog').find(p => p.kind === 'anchor')).ok, 'Belobog is closed for teleports while the team hides underground');
  const cc = g.chestCount('j_belobog');
  ok(cc.total === 1 && cc.got === 0, 'chest counter per area');
  g.state.opened['j_belobog:0'] = true;
  eq(g.chestCount('j_belobog').got, 1, 'opened chests count');
  eq(g.chestCount('u_mine').total, 3, 'rumor chests stay hidden from the counter until the rumor is bought');
}

{
  const st = H.newState();
  for (const f of ['intro', 'doom', 'express_intro']) st.flags[f] = true;
  Object.assign(st, { map: 'express', x: null, y: null, party: ['trail', 'march'] });
  st.roster.march = { lvl: 10, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
  let day = Date.UTC(2026, 9, 13, 12);
  const g = new H.Game({ state: st, seed: 3, clock: () => day });
  eq(H.EXPRESS_AREAS.map(a => a.map).join(), 'express,express_cabin,express_party', 'the Express has three cars');
  ok(H.EXPRESS_AREAS.every(a => g.areaOf(a.map).area === a && g.areaOf(a.map).world === g.expressWorld()), 'every car is an Express area of the parked world');
  eq(g.routeExit('express', 'express_cabin'), 'r', 'the Sleeping car is behind the right door of the Parlor car');
  eq(g.routeExit('express', 'express_party'), 'l', 'the Party car is down the stairs on the left');
  eq(g.routeExit('express_cabin', 'express_party'), 'l', 'the cars form one train');
  ok(['express_cabin', 'express_party'].every(m => H.DESTINATIONS.some(d => d.map === m && d.at === 'v')), 'every car is a teleport destination');
  g.loadMap('express', 'v');
  const him = g.map.ents.find(e => e.def && e.def.who === 'himeko');
  eq(g.map.tiles[him.y][him.x], '"', 'Himeko stands on the carpet, not on the aisle marble');
  eq(g.map.tiles[7][0], '^', 'the stairs run up to the door of the Party car');
  ok(['q', 't', 'n'].every(ch => g.map.ents.some(e => e.ch === ch && e.def.ghost && e.def.label)), 'Express terminals are drawn by the car art and keep their labels');
  g.loadMap('express_cabin', 'v');
  const crew = who => g.map.ents.find(e => e.def && e.def.who === who);
  ok(!g.visible(crew('march')) && g.visible(crew('danheng')), 'crew members wait in their rooms only while they are out of the team');
  for (const [ch, re] of [['k', /кофе/], ['z', /пространству/]]) {
    const d = g.map.ents.find(e => e.ch === ch);
    g.placePlayer(d.x, d.y + 1); g.player.dir = 'up';
    ok(g.interact() && g.pending && re.test(g.pending.text), 'the locked compartment door explains itself ' + ch);
    g.resume(); while (g.script) g.resume();
  }
  ok(g.blocked(27, 8) && g.blocked(34, 8), 'Himeko and Welt keep their doors shut');
  g.loadMap('express_party', 'v');
  eq(g.map.ents.filter(e => e.def && e.def.visit).length, 0, 'nobody visits the Party car before the roster grows');
  for (const k of ['serval', 'natasha', 'asta', 'arlan']) g.debugChar(k, 20, 0);
  g.loadMap('express_party', 'v');
  const vis = g.map.ents.filter(e => e.def && e.def.visit);
  ok(vis.length === 2 && vis[0].def.who !== vis[1].def.who && vis.every(v => !g.state.party.includes(v.def.who)), 'two different roster characters visit the Party car');
  g.placePlayer(vis[0].x, vis[0].y + 1); g.player.dir = 'up';
  ok(g.interact() && g.pending.type === 'say' && g.pending.spk === vis[0].def.who && g.pending.text.length > 10, 'a visitor says one of their own lines');
  g.resume();
  const today = g.visitors().join();
  const seen = new Set([today]);
  for (let i = 1; i < 6; i++) { day += 86400000; seen.add(g.visitors().join()); }
  ok(seen.size > 2, 'visitors change from day to day');
  ok(g.records().length < H.RECORDS.length && g.records().every(r => !r.need || g.cond(r.need)), 'records unlock with the journey');
  g.loadMap('express', 'v');
  g.runScript('exp_phono'); g.resume();
  const pick = g.pending.options.findIndex(o => o[0] === H.RECORDS[1].name);
  ok(g.pending.type === 'choice' && pick >= 0 && !g.pending.options.some(o => o[0] === H.RECORDS[6].name), 'the phonograph lists only owned records');
  g.events.length = 0;
  g.resume(pick);
  ok(g.state.record === 'menu' && g.events.some(e => e.t === 'music' && e.id === 'menu') && g.events.some(e => e.t === 'toast'), 'a record changes the music of the train');
  ok(g.mapMusic(H.MAPS.express_cabin) === 'menu' && g.mapMusic(H.MAPS.j_plains) === H.MAPS.j_plains.music, 'the record plays only aboard the Express');
  eq(g.bookPages('guests').map(p => p.who).join(), 'Герта', 'the guest book starts with Herta');
  g.state.flags.asta_met = true;
  eq(g.bookPages('guests').length, 2, 'new acquaintances sign the guest book');
  const ph = g.bookPages('photos');
  ok(ph.length === H.PHOTOS.length && ph.filter(p => p.ok).length === 2 && ph.every(p => G0bg(p.bg)), 'the photo wall fills up with the story');
  g.runScript('exp_broadcast');
  ok(/помехи|рябь/.test(g.pending.text), 'the IPC broadcast waits for the end of the Jarilo-VI story');
}

const mkSpec = (id, lvl) => { const c = H.CHARS[id]; return { charId: id, lvl, stats: { hp: H.statAt(c.base.hp, lvl), atk: H.statAt(c.base.atk, lvl), def: H.statAt(c.base.def, lvl), spd: c.base.spd } }; };
{
  const b = new H.Battle({ party: [mkSpec('trail', 1), mkSpec('march', 1)], enemies: ['reaver:1'], lvl: 1, seed: 3 });
  const ev = b.start();
  ok(ev.some(e => e.t === 'turn'), 'battle start emits turn');
  eq(b.phase, 'input', 'input phase');
  const sp = b.sp;
  const cur = b.current;
  ok(b.act('basic', b.living[0]), 'basic works');
  eq(b.sp, Math.min(5, sp + 1), 'basic gives SP');
  ok(b.allies.find(a => a === cur).energy >= 20, 'basic gives energy');
  const r = b.runAuto();
  ok(r && r.win, 'tutorial fight won');
}
{
  const b = new H.Battle({ party: [mkSpec('march', 10)], enemies: ['reaver:5'], lvl: 5, seed: 9 });
  b.start();
  const e = b.living[0];
  const t0h = e.tough;
  b.current && b.act('skill', b.current);
  ok(b.allies[0].shield > 0 || b.over, 'march shield applied');
  b.drain();
  const bb = new H.Battle({ party: [mkSpec('trail', 10)], enemies: ['reaver:3'], lvl: 3, seed: 2 });
  bb.start();
  const en = bb.living[0];
  let guard = 0;
  while (!bb.over && !en.broken && guard++ < 20) { if (bb.current) bb.act('basic', en); }
  ok(en.broken || en.dead, 'physical breaks reaver toughness');
  ok(t0h > 0, 'toughness defined');
}
{
  const b = new H.Battle({ party: [mkSpec('march', 20), mkSpec('danheng', 20)], enemies: ['reaver:10', 'reaver:10'], lvl: 10, seed: 5 });
  b.start();
  for (const a of b.allies) a.energy = a.maxEnergy;
  const f = b.availableFusions().find(x => x.id === 'f_express');
  ok(f && f.ready, 'fusion available');
  ok(b.fusion('f_express', b.living[0]), 'fusion executes');
  ok(b.allies.every(a => a.energy <= 10), 'fusion consumes energy');
  ok(b.fusionsUsed.has('f_express'), 'fusion recorded');
}
{
  let eager = 0, done = 0;
  for (let s = 1; s <= 40; s++) {
    const b = new H.Battle({ party: [mkSpec('trail', 30)], enemies: ['reaver:1'], lvl: 1, seed: s });
    b.start();
    let g = 0;
    while (!b.over && g++ < 30) { if (!b.current) break; b.contact(1, b.living[0]); }
    b.drain();
    if (b.over && b.result.win) { done++; if (b.result.reward.gifts.length) eager++; }
  }
  ok(done > 20, 'contact resolves battles (' + done + ')');
  ok(eager > 10, 'threat contact makes voidrangers eager (' + eager + ')');
  const b2 = new H.Battle({ party: [mkSpec('trail', 30)], enemies: ['gepard_b:5'], lvl: 5, seed: 1, boss: true });
  b2.start();
  b2.contact(0, b2.living[0]);
  ok(!b2.living[0].gone, 'boss ignores contact');
  log.push('contact eager gifts ' + eager + '/40');
}
{
  const b = new H.Battle({ party: [mkSpec('seele', 30)], enemies: ['baryon:1', 'baryon:1'], lvl: 1, seed: 4 });
  b.start();
  const s = b.current;
  b.act('skill', b.living[0]);
  const ev = b.drain();
  ok(ev.some(e => e.t === 'turn' && e.extra) || b.over, 'seele resurgence extra turn');
}
{
  const b = new H.Battle({ party: [mkSpec('gepard', 5)], enemies: ['trampler:30'], lvl: 30, seed: 7 });
  b.start();
  b.runAuto();
  ok(b.allies[0].flags.revived, 'gepard revive talent');
}
{
  const fresh = (party, foes, seed) => { const b = new H.Battle({ party: party.map(id => mkSpec(id, 30)), enemies: foes, lvl: 20, seed: seed || 5 }); b.start(); b.drain(); return b; };
  const turnOf = (b, id) => { let g = 0; while (!b.over && b.current && b.current.charId !== id && g++ < 40) b.act('basic', b.living[0]); return b.current && b.current.charId === id ? b.current : null; };
  for (const id of ['miyabi', 'yanagi']) { const c = H.CHARS[id]; ok(c.rarity === 5 && c.faction === 's6', 'section 6 agent ' + id); }
  ok(H.CHARS.miyabi.charged.every((a, i) => a.lv === i + 1 && TARGETS.has(a.target) && a.fx.every(f => FX.has(f.k) && (f.k !== 'dmg' || f.charged))), 'Shimotsuki has three charge levels');
  ok(TARGETS.has(H.CHARS.yanagi.enhanced.target) && H.CHARS.yanagi.enhanced.fx.every(f => FX.has(f.k)), 'Shinrabanshou basic is valid');

  let b = fresh(['miyabi', 'march'], ['reaver:20', 'reaver:20', 'reaver:20']);
  let m = turnOf(b, 'miyabi');
  ok(m, 'Miyabi gets a turn');
  eq(b.chargeLevels(m), 0, 'no Shimotsuki without Fallen Frost');
  b.act('basic', b.living[0]);
  ok((b.allies[0].flags.frost || 0) >= 1, 'Kazahana gives Fallen Frost');
  ok(b.living.some(e => e.flags.icefire === 1) || b.over, 'ice hits stack Icefire');
  m = b.allies[0];
  m.flags.frost = 6;
  m = turnOf(b, 'miyabi');
  if (m) {
    eq(b.chargeLevels(m), 3, 'six Fallen Frost give charge level 3');
    eq(b.setCharge(m, 2), 2, 'charge level can be picked');
    const pv = b.preview('basic', b.living[0]);
    ok(pv.ab.name === 'Симоцуки' && pv.ab.lv === 2 && pv.kind === 'enhanced', 'preview shows the picked Shimotsuki level');
    const sp = b.sp;
    b.act('basic', b.living[0]);
    eq(m.flags.frost >= 2 && m.flags.frost <= 4, true, 'level 2 spends four Fallen Frost');
    eq(b.sp, Math.min(H.TUNING.spMax, sp + 1), 'Shimotsuki is a basic attack and gives SP');
    eq(m.flags.chargeSel, 0, 'charge pick resets after the slash');
  }

  b = fresh(['miyabi'], ['reaver:20']);
  m = b.allies[0];
  const foe = b.living[0];
  foe.hp = foe.maxHp = 1e9;
  b.acting = m; b.actSerial = 1;
  for (let i = 0; i < H.TUNING.icefireMax; i++) b.icefire(m, foe);
  ok(foe.frostbite && foe.buffs.some(x => x.name === 'Ледяной ожог'), '3 Icefire stacks give Frostbite and Frostburn');
  ok(b.drain().some(x => x.t === 'dmg' && x.label === 'Прорыв ледяного ожога'), 'Frostburn break deals damage');
  eq(m.flags.frost, 1, 'Frostburn break gives one Fallen Frost');
  b.icefire(m, foe);
  ok(!foe.flags.icefire, 'no Icefire while Frostburn lasts');
  b.addDot(m, foe, 'burn', 100, 2);
  ok(foe.frostbite && foe.dots.length === 1 && !b.chaosN, 'no Disorder without Yanagi');
  b.acting = null;

  b = fresh(['miyabi', 'yanagi'], ['reaver:20']);
  const [mi, ya] = b.allies;
  const f2 = b.living[0];
  f2.hp = f2.maxHp = 1e9;
  ok(ya.flags.stance === 'jo' && ya.buffs.some(x => x.name === 'Стойка Дзёгэн'), 'Yanagi starts in Jougen');
  ok(mi.buffs.some(x => x.name === 'Мороз и вьюга'), 'Bask in Frost with Yanagi in the team');
  b.addDot(ya, f2, 'shock', 100, 2);
  const before = f2.hp;
  b.polarity(ya, f2, 1);
  ok(f2.hp < before && f2.dots.length === 1, 'Polarity Disorder hurts and keeps the anomaly');
  b.drain();
  b.addDot(mi, f2, 'burn', 50, 2);
  const ev = b.drain();
  ok(ev.some(x => x.t === 'chaos') && ev.some(x => x.t === 'dmg' && x.label === 'Хаос'), 'a second anomaly type triggers Disorder');
  ok(f2.dots.length === 1 && f2.dots[0].type === 'burn', 'Disorder consumes the old anomaly');
  eq(mi.flags.frost, 2, 'Disorder gives Miyabi two Fallen Frost');
  b.addDot(mi, f2, 'burn', 50, 2);
  eq(b.chaosN, 1, 'refreshing the same anomaly is not Disorder');
  f2.frozen = 1; f2.frozenDmg = 10; f2.frozenSrc = mi;
  b.addDot(ya, f2, 'shock', 100, 2);
  ok(f2.frozen === 1, 'Disorder never thaws a frozen enemy');
  b.switchStance(ya);
  ok(ya.flags.stance === 'ka' && ya.buffs.some(x => x.name === 'Стойка Кагэн') && ya.buffs.some(x => x.name === 'Стойка Дзёгэн: эхо'), 'stance switch keeps the old stance for a turn');

  b = fresh(['yanagi', 'march'], ['reaver:20', 'reaver:20', 'reaver:20']);
  const y2 = turnOf(b, 'yanagi');
  if (y2) {
    b.sp = 3;
    b.act('skill', b.living[1] || b.living[0]);
    ok(y2.flags.stance === 'ka' && y2.flags.shinra === 2, 'Gekka Ruten switches stance and starts Shinrabanshou');
    ok(y2.buffs.some(x => x.name === 'Лунное затмение'), 'Lunar Eclipse after the skill');
    const y3 = turnOf(b, 'yanagi');
    if (y3) { eq(b.abilityFor(y3, 'basic').ab.name, H.CHARS.yanagi.enhanced.name, 'Shinrabanshou empowers the basic attack'); b.act('basic', b.living[0]); eq(y3.flags.shinra, 1, 'Shinrabanshou counts basic attacks'); }
  }

  b = fresh(['miyabi', 'yanagi'], ['reaver:20', 'reaver:20']);
  for (const a of b.allies) a.energy = a.maxEnergy;
  for (const e of b.living) { e.hp = e.maxHp = 1e9; b.addDot(b.allies[1], e, 'shock', 80, 2); }
  b.drain();
  ok(b.fusion('f_section6', b.living[0]), 'Section 6 fusion executes');
  ok(b.chaosN >= 2 && b.allies[0].flags.frost === H.TUNING.frostMax, 'Section 6 fusion bursts anomalies and fills Fallen Frost');

  b = new H.Battle({ party: [mkSpec('miyabi', 30), mkSpec('yanagi', 30)], enemies: ['reaver:20', 'reaver:20'], lvl: 20, seed: 3, techs: [{ charId: 'miyabi', fx: 'miyabiTech' }, { charId: 'yanagi', fx: 'yanagiTech' }] });
  b.start();
  ok(b.allies[0].flags.frost >= 3, 'Miyabi technique gives Fallen Frost');
  ok(b.living.every(e => e.dots.some(d => d.type === 'shock')), 'Yanagi technique shocks every enemy');

  let wins = 0;
  for (let s = 1; s <= 6; s++) { const ab = new H.Battle({ party: ['miyabi', 'yanagi', 'march', 'natasha'].map(id => mkSpec(id, 30)), enemies: H.ENCOUNTERS.svarog.enemies, boss: true, seed: s * 31 }); ab.start(); const r = ab.runAuto(800); if (r && r.win) wins++; }
  ok(wins >= 5, 'auto battle plays Section 6 well (' + wins + '/6)');
}
{
  const T = H.TUNING, alive = H.battleStat.alive, HUNT = ['kafka', 'silverwolf', 'blade'];
  const spec = (id, cone) => Object.assign(mkSpec(id, 30), { key: id, cone: cone || null });
  const fresh = (party, foes, seed, techs) => { const b = new H.Battle({ party: party.map(p => (typeof p === 'string' ? spec(p) : p)), enemies: foes, lvl: 20, seed: seed || 5, techs: techs || [] }); b.start(); b.drain(); return b; };
  const turnOf = (b, id) => { let g = 0; while (!b.over && b.current && b.current.charId !== id && g++ < 40) { b.act('basic', b.living[0]); b.drain(); } return b.current && b.current.charId === id ? b.current : null; };
  const follows = (ev, name) => ev.filter(e => e.t === 'act' && e.name === name).length;
  for (const id of HUNT) { const c = H.CHARS[id], cs = H.BANNERS.cone.stars[id]; ok(c.rarity === 5 && c.faction === 'hunters' && H.BANNERS.ev.stars[id] && cs && H.CONES[cs.cone].sig === id && H.CONES[cs.cone].path === c.path, 'Stellaron Hunter on the event banners ' + id); }
  ok(!Object.values(H.WARP_POOL).some(p => p.some(x => HUNT.includes(x))), 'Stellaron Hunters drop only from the event banner');
  ok(HUNT.every(id => H.SPEAKERS[id] && H.SPEAKERS[id].char === id), 'story scenes draw the Hunters from their roster looks');
  ok(TARGETS.has(H.CHARS.blade.enhanced.target) && H.CHARS.blade.enhanced.fx.every(f => FX.has(f.k)), 'Forest of Swords is valid');

  let b = fresh(['march', 'kafka'], ['reaver:20', 'reaver:20', 'reaver:20']);
  const k = b.allies[1];
  let g = 0;
  while (b.current && b.current.charId !== 'march' && g++ < 20) { b.act('basic', b.living[0]); b.drain(); }
  k.flags.trill = true;
  let tgt = b.living[0];
  b.act('basic', tgt);
  let ev = b.drain();
  eq(follows(ev, 'Жестокая нежность'), 1, 'an ally basic attack makes Kafka follow up');
  ok(!alive(tgt) || tgt.dots.some(d => d.type === 'shock'), 'the follow-up shocks the target');
  ok(!k.flags.trill || b.current === k, 'Kafka follows up once until her next turn');
  g = 0;
  while (b.current && b.current.charId !== 'kafka' && g++ < 20) { b.act('basic', b.living[0]); eq(follows(b.drain(), 'Жестокая нежность'), 0, 'no second follow-up before her turn'); }
  if (b.current === k) {
    ok(k.flags.trill, 'her turn readies the talent again');
    b.act('basic', b.living[0]);
    eq(follows(b.drain(), 'Жестокая нежность'), 0, 'Kafka own basic attack does not trigger her talent');
  }

  b = fresh(['kafka'], ['reaver:20', 'reaver:20']);
  const kf = turnOf(b, 'kafka');
  ok(kf, 'Kafka gets a turn');
  if (kf) {
    tgt = b.living[0];
    b.addDot(kf, tgt, 'burn', 50, 2); b.addDot(kf, tgt, 'shock', 40, 2); b.drain();
    b.sp = 3; b.act('skill', tgt);
    ev = b.drain();
    eq(ev.filter(e => e.t === 'dmg' && e.u === tgt && /детонация/.test(e.label || '')).length, 2, 'Caressing Moonlight detonates every DoT on the target');
  }
  b = fresh(['kafka'], ['reaver:20', 'reaver:20', 'reaver:20']);
  const ku = b.allies[0];
  for (const e of b.living) e.base.res = 0;
  ku.energy = ku.maxEnergy;
  if (b.current) {
    b.ult(ku, null);
    ev = b.drain();
    ok(b.living.every(e => e.dots.some(d => d.type === 'shock')), 'Twilight Trill shocks every enemy');
    ok(ev.filter(e => e.t === 'dmg' && /Шок: детонация/.test(e.label || '')).length >= b.living.length, 'Twilight Trill detonates the Shock at once');
  }

  b = fresh(['silverwolf', 'arlan'], ['reaver:20', 'reaver:20']);
  const w = turnOf(b, 'silverwolf');
  ok(w, 'Silver Wolf gets a turn');
  if (w) {
    tgt = b.living[0]; tgt.base.res = 0;
    eq(b.implantChoices().slice().sort().join(), 'elec,quant', 'implant choices are the team elements');
    eq(b.implantElem(w, tgt), 'elec', 'auto implant picks the strongest ally element the foe is not weak to');
    eq(b.setImplant(w, 'quant'), 'quant', 'the player can pick another element');
    b.sp = 3; b.act('skill', tgt); b.drain();
    ok(tgt.weak.includes('quant') && tgt.implant && tgt.implant.e === 'quant' && !H.ENEMIES.reaver.weak.includes('quant'), 'Allow Changes? implants the picked weakness and leaves enemy data alone');
    ok(tgt.buffs.some(x => x.s === 'resDown'), 'Allow Changes? lowers all RES');
    tgt.implant.turns = 1; b.endTurn(tgt);
    ok(!tgt.implant && !tgt.weak.includes('quant'), 'the implanted weakness fades');
    b.implant(w, tgt, 'ice', true);
    ok(!tgt.implant && tgt.weak.join() === H.ENEMIES.reaver.weak.join(), 'a natural weakness is not implanted twice');
  }
  b = fresh(['silverwolf'], ['reaver:20']);
  const w2 = turnOf(b, 'silverwolf');
  if (w2) {
    w2.base.ehr = 10; b.living[0].base.res = 0;
    b.act('basic', b.living[0]);
    ok(!b.living.length || b.living[0].buffs.some(x => x.name.startsWith('Баг')), 'Silver Wolf attacks plant Bugs');
  }

  b = fresh(['blade'], ['reaver:20', 'reaver:20', 'reaver:20']);
  const bl = turnOf(b, 'blade');
  ok(bl, 'Blade gets a turn');
  if (bl) {
    const hp0 = bl.hp, tally0 = bl.flags.tally, ch0 = bl.flags.shuhu;
    b.sp = 3;
    ok(b.act('skill', bl), 'Hellscape is cast');
    ok(b.current === bl && b.phase === 'input', 'Hellscape does not end Blade turn');
    eq(bl.hp, hp0 - Math.round(bl.maxHp * T.hellCost), 'Hellscape costs 30% of max HP');
    ok(bl.flags.shuhu === ch0 + 1 && bl.flags.tally === tally0 + Math.round(bl.maxHp * T.hellCost), 'spending HP charges Shuhu and the HP tally');
    eq(b.abilityFor(bl, 'basic').ab.name, H.CHARS.blade.enhanced.name, 'Hellscape turns the basic attack into Forest of Swords');
    ok(!b.act('skill', bl) && b.skillLocked(bl), 'no Skill inside Hellscape');
    const pv = b.preview('basic', b.living[1], bl);
    ok(pv && pv.rows.size === 3, 'Forest of Swords previews a blast');
    b.act('basic', b.living[1]);
    ev = b.drain();
    ok(ev.some(e => e.t === 'dmg' && e.u === bl && e.label === 'Цена клинка'), 'Forest of Swords costs HP');
    bl.flags.shuhu = T.shuhuMax - 1;
    b.consumeHp(bl, 0.05); b.followUps();
    ev = b.drain();
    ok(b.over || (follows(ev, 'Дар Шуху') === 1 && bl.flags.shuhu === 0), 'five charges fire the Gift of Shuhu and reset');
    bl.hp = 2; b.consumeHp(bl, 0.3);
    eq(bl.hp, 1, 'spending HP never kills Blade');
  }
  b = fresh(['blade'], ['reaver:20', 'reaver:20', 'reaver:20']);
  const bu = b.allies[0];
  if (b.current) {
    bu.energy = bu.maxEnergy; bu.flags.tally = 100;
    const lo = b.preview('ult', b.living[1], bu).rows.get(b.living[1]).lo;
    bu.flags.tally = 400;
    ok(b.preview('ult', b.living[1], bu).rows.get(b.living[1]).lo > lo, 'Death Sentence grows with the HP tally');
    b.ult(bu, b.living[1]);
    ok(bu.hp === Math.round(bu.maxHp * 0.5) && bu.flags.tally === 0, 'Death Sentence sets HP to 50% and resets the tally');
  }

  b = fresh([spec('kafka', { id: 'patience', fx: 'patience', sup: 1 })], ['reaver:20', 'reaver:20']);
  const kp = turnOf(b, 'kafka');
  if (kp) { b.act('basic', b.living[0]); ok(b.drain().some(e => e.t === 'status' && e.text === 'Паутинка') && kp.buffs.some(x => x.name === 'Просто надо подождать'), 'Patience Is All You Need plants Erode and speeds Kafka up'); }
  b = fresh([spec('blade', { id: 'unreachable', fx: 'unreachable', sup: 1 })], ['reaver:20', 'reaver:20']);
  b.consumeHp(b.allies[0], 0.1);
  ok(b.allies[0].buffs.some(x => x.name === 'Недоступная сторона'), 'The Unreachable Side wakes on HP loss');

  b = fresh(['kafka', 'silverwolf'], ['reaver:20', 'reaver:20']);
  for (const a of b.allies) a.energy = a.maxEnergy;
  if (b.current) {
    ok(b.fusion('f_elio', null), 'the Elio fusion executes');
    ok(b.over || b.living.every(e => e.weak.includes('elec') && e.dots.some(d => d.type === 'shock')), 'the Elio fusion implants Lightning and shocks everyone');
  }
  b = fresh(['kafka', 'blade'], ['reaver:20', 'reaver:20', 'reaver:20']);
  for (const a of b.allies) a.energy = a.maxEnergy;
  if (b.current) {
    ok(b.fusion('f_mara', b.living[1]), 'the mara fusion executes');
    ev = b.drain();
    ok(b.over || (follows(ev, 'Дар Шуху') === 1 && b.allies[1].flags.tally === 0), 'the mara fusion ends in the Gift of Shuhu');
  }

  for (const [party, enc] of [[['kafka', 'sampo', 'march', 'natasha'], 'svarog'], [['silverwolf', 'seele', 'march', 'natasha'], 'gepard2'], [['blade', 'pela', 'natasha', 'bailu'], 'cocolia1']]) {
    let wins = 0, stuck = 0;
    for (let s = 1; s <= 6; s++) { const ab = new H.Battle({ party: party.map(id => mkSpec(id, 30)), enemies: H.ENCOUNTERS[enc].enemies, waves: H.ENCOUNTERS[enc].waves, boss: true, seed: s * 31 }); ab.start(); let n = 0; while (!ab.over && n++ < 800) if (!ab.autoStep()) { stuck++; break; } if (ab.result && ab.result.win) wins++; }
    ok(wins >= 5 && !stuck, 'auto battle plays ' + party[0] + ' well vs ' + enc + ' (' + wins + '/6, stuck ' + stuck + ')');
  }
}
{
  const T = H.TUNING, alive = H.battleStat.alive, F = H.FOURS, IDS = F.IDS;
  const spec = id => Object.assign(mkSpec(id, 30), { key: id });
  const fresh = (party, foes, seed, techs) => { const b = new H.Battle({ party: party.map(spec), enemies: foes, lvl: 20, seed: seed || 5, techs: techs || [] }); b.start(); b.drain(); return b; };
  const turnOf = (b, id) => { let g = 0; while (!b.over && b.current && b.current.charId !== id && g++ < 40) { b.act('basic', b.living[0]); b.drain(); } return b.current && b.current.charId === id ? b.current : null; };
  const tank = b => { for (const e of b.living) { e.hp = e.maxHp = 1e9; e.base.res = 0; } };
  const named = (ev, label) => ev.filter(e => e.t === 'dmg' && e.label === label).length;
  eq(IDS.join(), 'lynx,luka,sushang,xueyi,tingyun,hanya,qingque,yukong,guinaifen', 'the nine 4-star heroes from the original');
  for (const id of IDS) {
    const c = H.CHARS[id];
    ok(c === F.KITS[id] && c.rarity === 4 && H.PATHS[c.path] && H.ELEMENTS[c.elem], 'version 1.4 kit ' + id);
    ok(c.talent.length <= 99 && c.tech.name && c.tech.text, 'talent and technique fit the panels ' + id);
    for (const ab of [c.basic, c.skill, c.ult, c.enhanced, c.arrow].filter(Boolean)) { ok(TARGETS.has(ab.target) && ab.fx.every(f => FX.has(f.k)), 'ability ' + id + ' ' + ab.name); if (ab.text) ok(!/[—–]/.test(ab.text), 'no dashes in ability text ' + id); }
  }
  eq([H.CHARS.lynx.path, H.CHARS.luka.path, H.CHARS.sushang.path, H.CHARS.xueyi.path, H.CHARS.tingyun.path, H.CHARS.hanya.path, H.CHARS.qingque.path, H.CHARS.yukong.path, H.CHARS.guinaifen.path].join(), 'abundance,nihility,hunt,destruction,harmony,harmony,erudition,harmony,nihility', 'Paths follow the original');
  eq([H.CHARS.lynx.elem, H.CHARS.luka.elem, H.CHARS.sushang.elem, H.CHARS.xueyi.elem, H.CHARS.tingyun.elem, H.CHARS.hanya.elem, H.CHARS.qingque.elem, H.CHARS.yukong.elem, H.CHARS.guinaifen.elem].join(), 'quant,phys,phys,quant,elec,phys,quant,imag,fire', 'elements follow the original');

  let b = fresh(['lynx', 'gepard'], ['reaver:20', 'reaver:20']);
  let u = turnOf(b, 'lynx');
  ok(u, 'Lynx gets a turn');
  if (u) {
    const gp = b.allies[1], max0 = gp.maxHp;
    b.sp = 3; b.act('skill', gp); b.drain();
    ok(gp.maxHp > max0 && gp.buffs.some(x => x.name === 'Реакция выживания') && gp.buffs.some(x => x.s === 'aggro' && x.v >= T.survivalAggro), 'Survival Response raises max HP and draws fire to a Preservation ally');
    ok(gp.buffs.some(x => x.hot > 0), 'Lynx talent leaves continuous healing');
    const sv0 = gp.buffs.find(x => x.name === 'Реакция выживания');
    sv0.turns = 1; b.endTurn(gp);
    eq(gp.maxHp, max0, 'max HP returns when Survival Response ends');
    b.survival(u, gp); b.drain();
    b.flee();
    eq(gp.maxHp, max0, 'a battle never ends with a borrowed max HP');
  }

  b = fresh(['luka'], ['reaver:20', 'reaver:20']);
  tank(b);
  u = b.allies[0];
  eq(u.flags.will, 1, 'Luka starts with one Fighting Will');
  u = turnOf(b, 'luka');
  if (u) {
    b.act('basic', b.living[0]); b.drain();
    eq(u.flags.will, 2, 'Direct Punch gives Fighting Will');
    u = turnOf(b, 'luka');
    eq(b.abilityFor(u, 'basic').ab.name, 'Раскалывающий небеса кулак', 'two Fighting Will enhance the Basic ATK');
    b.sp = 3; b.act('skill', b.living[0]); b.drain();
    ok(b.living[0].dots.some(d => d.type === 'bleed'), 'Lacerating Fist inflicts Bleed');
    u = turnOf(b, 'luka');
    const w0 = u.flags.will;
    b.act('basic', b.living[0]);
    const ev = b.drain();
    ok(named(ev, 'Прямой удар') >= 3 && named(ev, 'Восходящий апперкот') === 1 && u.flags.will === w0 - 2, 'Sky-Shatter Fist spends two Will on jabs and an uppercut');
    eq(named(ev, 'Кровотечение: апперкот'), 1, 'the uppercut makes the Bleed deal damage at once');
  }

  b = fresh(['sushang'], ['reaver:20', 'reaver:20']);
  tank(b);
  u = turnOf(b, 'sushang');
  if (u) {
    const t = b.living[0];
    t.broken = true; t.tough = 0;
    b.sp = 3; b.act('skill', t);
    const ev = b.drain();
    eq(named(ev, 'Стойка меча'), 1, 'Sword Stance always follows the Skill on a broken enemy');
    b.foursBreak(b.allies[0], t);
    ok(u.buffs.some(x => x.name === 'Плавный клинок'), 'a broken enemy speeds Sushang up');
  }
  b = fresh(['sushang', 'march'], ['reaver:20', 'reaver:20']);
  tank(b);
  u = turnOf(b, 'sushang');
  if (u) {
    u.energy = u.maxEnergy;
    b.ult(u, b.living[0]); b.drain();
    b.act('basic', b.living[0]); b.drain();
    eq(b.current && b.current.charId, 'sushang', 'Dawn Herald lets Sushang act again right away');
  }

  b = fresh(['xueyi', 'march'], ['eliminator:20', 'eliminator:20']);
  tank(b);
  u = b.allies[0];
  ok(u.buffs.some(x => x.name === 'Предзнаменующий замысел'), 'Break Effect turns into Xueyi damage');
  u.flags.karma = T.karmaMax - 1;
  if (b.current) {
    b.act('basic', b.living[0]);
    const ev = b.drain();
    ok(ev.some(e => e.t === 'act' && e.name === 'Кармическое искупление') && u.flags.karma === 0, 'full Karma fires the follow-up and resets');
  }
  b = fresh(['xueyi'], ['flamespawn:20']);
  u = b.allies[0];
  if (b.current) {
    const t = b.living[0], t0 = t.tough;
    t.hp = t.maxHp = 1e9;
    u.energy = u.maxEnergy;
    ok(!t.weak.includes('quant'), 'the test target has no Quantum weakness');
    b.ult(u, t); b.drain();
    ok(t.tough < t0, 'Divine Castigation cuts Toughness of any weakness');
  }

  b = fresh(['tingyun', 'seele'], ['reaver:20', 'reaver:20']);
  tank(b);
  u = turnOf(b, 'tingyun');
  if (u) {
    const se = b.allies[1];
    b.sp = 3; b.act('skill', se); b.drain();
    ok(se.buffs.some(x => x.name === 'Благословение') && u.flags.bene === se, 'Soothing Melody blesses one ally');
    const s2 = turnOf(b, 'seele');
    if (s2) { b.act('basic', b.living[0]); ok(named(b.drain(), 'Благословение') === 1, 'a blessed ally adds Lightning damage to the attack'); }
    const t2 = turnOf(b, 'tingyun');
    if (t2) {
      se.energy = 0; t2.energy = t2.maxEnergy;
      b.ult(t2, se); b.drain();
      ok(se.energy >= T.tingyunUltEnergy && se.buffs.some(x => x.name === 'Счастливое знамение'), 'Amidst the Rejoicing Clouds gives 50 Energy and DMG');
      b.act('basic', b.living[0]);
      ok(named(b.drain(), 'Небесное сияние') === 1, 'Tingyun attack makes the blessed ally strike too');
    }
  }

  b = fresh(['hanya', 'march', 'pela'], ['reaver:20', 'reaver:20']);
  tank(b);
  u = turnOf(b, 'hanya');
  if (u) {
    const t = b.living[0];
    b.sp = 2; b.act('skill', t); b.drain();
    ok(b.burdened(t) && t.flags.burdenN === 1, 'Samsara, Locked lays Burden and counts as the first hit');
    if (b.current) { b.act('basic', t); ok(b.drain().some(e => e.t === 'status' && /^Ноша/.test(e.text)) && t.flags.burdenTrig === 1, 'every second hit on Burden restores a Skill Point'); }
    t.flags.burdenTrig = T.burdenTrig - 1; t.flags.burdenN = T.burdenHits - 1;
    b.burdenCount(b.allies[0], t);
    ok(!b.burdened(t), 'Burden fades after two Skill Points');
  }

  b = fresh(['qingque', 'march'], ['reaver:20', 'reaver:20', 'reaver:20']);
  tank(b);
  u = turnOf(b, 'qingque');
  if (u) {
    ok(u.flags.tiles.length >= 1, 'every ally turn draws a jade tile');
    u.flags.tiles = [0, 1];
    b.sp = 5;
    ok(b.act('skill', u) && b.current === u && b.phase === 'input', 'A Scoop of Moon keeps the turn');
    ok(u.flags.tileStack === 1, 'each Skill stacks Qingque damage');
    u.flags.tiles = [2, 2, 2, 2]; b.enterKong(u); b.drain();
    ok(u.flags.kong && b.skillLocked(u) && b.abilityFor(u, 'basic').ab.name === 'Вишенка на торте!', 'four of a suit opens the Hidden Hand');
    b.act('basic', b.living[1]);
    ok(!u.flags.kong && !u.buffs.some(x => x.name === 'Закрытый конг'), 'Cherry on Top! ends the Hidden Hand');
  }

  b = fresh(['yukong', 'seele', 'march'], ['reaver:20', 'reaver:20']);
  tank(b);
  u = turnOf(b, 'yukong');
  if (u) {
    eq(b.abilityFor(u, 'basic').ab.name, 'Семь слоёв, одна стрела', 'the first Basic ATK is Seven Layers, One Arrow');
    b.sp = 3; b.act('skill', u); b.drain();
    ok(u.flags.bow === 2 && b.livingAllies.every(a => a.buffs.some(x => x.name === 'Ревущая тетива')), 'Emboldening Salvo strings the bow for the team');
    let g = 0;
    while (u.flags.bow > 0 && g++ < 10 && b.current) { b.act('basic', b.living[0]); b.drain(); }
    ok(u.flags.bow === 0 && !b.livingAllies.some(a => a.buffs.some(x => x.name === 'Ревущая тетива')), 'Roaring Bowstrings run down with ally turns');
  }
  b = fresh(['yukong', 'seele'], ['reaver:20', 'reaver:20'], 5, [{ charId: 'yukong', fx: 'yukongTech' }]);
  u = b.allies[0];
  ok(u.flags.bow === 2, 'Windchaser starts the fight with the bow strung');
  if (b.current) { u.energy = u.maxEnergy; b.ult(u, b.living[0]); ok(b.allies[1].buffs.some(x => x.name === 'Ныряющий ястреб'), 'Diving Kestrel gives CRIT while the bow is strung'); }

  b = fresh(['guinaifen'], ['reaver:20', 'reaver:20']);
  tank(b);
  u = b.allies[0];
  if (b.current) {
    const t = b.living[0];
    b.addDot(u, t, 'burn', 50, 2); b.drain();
    b.startTurn(t); b.drain();
    ok(t.buffs.some(x => x.name === 'Огненный поцелуй'), 'a Burn tick plants Firekiss');
    b.addDot(u, t, 'burn', 50, 2);
    u.energy = u.maxEnergy; b.ult(u, null);
    ok(named(b.drain(), 'Горение: представление') >= 1, 'Watch This Showstopper makes Burn deal damage at once');
  }

  for (const [id, f] of Object.entries(F.FUSIONS)) {
    b = fresh(f.members, ['reaver:20', 'reaver:20', 'reaver:20']);
    tank(b);
    for (const a of b.allies) a.energy = a.maxEnergy;
    if (b.current) ok(b.fusion(id, b.living[1]), 'version 1.4 fusion executes ' + id);
  }

  const runs = [[['lynx', 'blade', 'pela', 'march'], 'cocolia1'], [['luka', 'kafka', 'guinaifen', 'lynx'], 'svarog'], [['sushang', 'xueyi', 'ruanmei', 'natasha'], 'gepard2'], [['qingque', 'hanya', 'march', 'natasha'], 'svarog'], [['seele', 'tingyun', 'yukong', 'natasha'], 'cocolia1']];
  for (const [party, enc] of runs) {
    let wins = 0, stuck = 0;
    for (let s = 1; s <= 6; s++) { const ab = new H.Battle({ party: party.map(id => mkSpec(id, 30)), enemies: H.ENCOUNTERS[enc].enemies, waves: H.ENCOUNTERS[enc].waves, boss: true, seed: s * 31 }); ab.start(); let n = 0; while (!ab.over && n++ < 800) if (!ab.autoStep()) { stuck++; break; } if (ab.result && ab.result.win) wins++; }
    ok(wins >= 5 && !stuck, 'auto battle plays ' + party.join('+') + ' well vs ' + enc + ' (' + wins + '/6, stuck ' + stuck + ')');
  }
}
{
  const T = H.TUNING, alive = H.battleStat.alive, KITS = H.INABA.KITS, P4 = Object.keys(KITS);
  const FX4 = FX;
  {
    for (const id of P4) {
      const c = KITS[id];
      ok(c.faction === 'inaba' && c.arcana && H.PATHS[c.path] && H.ELEMENTS[c.elem] && [4, 5].includes(c.rarity), 'Investigation Team kit ' + id);
      for (const ab of [c.basic, c.skill, c.ult, ...(c.skills || [])]) { ok(ab && TARGETS.has(ab.target), 'Investigation Team ability target ' + id); for (const f of ab.fx) ok(FX4.has(f.k), 'Investigation Team fx ' + id + ' ' + f.k); }
      ok(c.tech && c.tech.fx && c.contact.length === 2 && c.contact.every(x => ['joke', 'cute', 'threat', 'science', 'kind', 'sing', 'bribe', 'silent', 'weird'].includes(x.tag)), 'Investigation Team tech and contact ' + id);
      ok(c.talent.length <= 99, 'talent fits the Abilities panel ' + id);
    }
    eq(KITS.yu.skills.map(s => H.INABA.PERSONAS[s.persona].elem).join(), 'elec,ice,phys', 'Yu has one skill per Persona');
    eq([KITS.yu.rarity, KITS.kanji.rarity, KITS.rise.rarity, KITS.yosuke.rarity, KITS.chie.rarity, KITS.yukiko.rarity].join(), '5,5,5,4,4,4', 'rarities follow the banner plan');

    const spec = id => Object.assign(mkSpec(id, 30), { key: id });
    const fresh = (party, foes, seed, techs) => { const b = new H.Battle({ party: party.map(spec), enemies: foes, lvl: 20, seed: seed || 5, techs: techs || [] }); b.start(); b.drain(); return b; };
    const turnOf = (b, id) => { let g = 0; while (!b.over && b.current && b.current.charId !== id && g++ < 40) { b.act('basic', b.living[0]); b.drain(); } return b.current && b.current.charId === id ? b.current : null; };
    const has = (ev, t) => ev.some(e => e.t === t);

    let b = fresh(['chie'], ['reaver:20', 'reaver:20', 'reaver:20']);
    let c = turnOf(b, 'chie');
    ok(c, 'Chie gets a turn');
    if (c) {
      let tgt = b.living[0];
      tgt.tough = 1;
      b.act('basic', tgt);
      let ev = b.drain();
      ok(has(ev, 'oneMore') && b.current === c && b.phase === 'input' && c.flags.oneMore, 'a break by an Investigation Team member gives «Ещё раз!»');
      const t2 = b.living.find(e => !e.broken);
      t2.tough = 1;
      b.act('basic', t2);
      ev = b.drain();
      ok(!has(ev, 'oneMore') && !c.flags.oneMore, 'the extra action cannot chain into another «Ещё раз!»');
    }
    b = fresh(['chie'], ['reaver:20', 'reaver:20']);
    c = b.allies[0];
    if (b.current) {
      b.living[0].tough = 1; c.energy = c.maxEnergy;
      b.ult(c, b.living[0]);
      ok(!has(b.drain(), 'oneMore'), 'an Ultimate break gives no «Ещё раз!»');
    }

    b = fresh(['march', 'natasha'], ['reaver:20', 'reaver:20']);
    let m = turnOf(b, 'march');
    if (m) { b.living[0].tough = 1; b.act('basic', b.living[0]); ok(!has(b.drain(), 'oneMore'), 'other characters get no «Ещё раз!» without Yu'); }
    b = fresh(['march', 'yu'], ['reaver:20', 'reaver:20', 'reaver:20']);
    m = turnOf(b, 'march');
    const yu0 = b.allies[1];
    if (m) {
      yu0.av = 1e9;
      b.living[0].tough = 1;
      b.act('basic', b.living[0]);
      ok(has(b.drain(), 'oneMore') && !yu0.flags.bond, 'with Yu in the team another ally gets «Ещё раз!» once');
      b.act('basic', b.living[0]); b.drain();
      const m2 = turnOf(b, 'march');
      if (m2 && !yu0.flags.bond) { const t = b.living.find(e => !e.broken); if (t) { t.tough = 1; b.act('basic', t); ok(!has(b.drain(), 'oneMore'), 'the shared «Ещё раз!» waits for Yu turn'); } }
    }

    b = fresh(['yu', 'march'], ['reaver:20', 'reaver:20']);
    const yu = turnOf(b, 'yu');
    ok(yu, 'Yu gets a turn');
    if (yu) {
      eq(yu.elem, 'elec', 'Yu starts with Izanagi');
      eq(b.setSkill(yu, 1), 1, 'Yu switches to Jack Frost');
      ok(yu.elem === 'ice' && has(b.drain(), 'persona'), 'the Persona sets the element');
      b.living[1].broken = true; b.living[1].tough = 0;
      b.living[0].tough = 1;
      const sp0 = b.sp;
      b.act('basic', b.living[0]);
      let ev = b.drain();
      ok(ev.some(e => e.t === 'oneMore' && e.aoa), '«Ещё раз!» with every foe broken offers the All-Out Attack');
      eq(b.sp, Math.min(T.spMax, sp0 + 1 + T.wildSp), 'the first break with a Persona gives a Skill Point');
      eq(b.setSkill(yu, 2), 1, 'the Persona is locked after Yu acts');
      ok(b.aoaReady(), 'the All-Out Attack is ready');
      const hp = b.living.map(e => e.hp);
      ok(b.allOut(), 'the All-Out Attack runs');
      ev = b.drain();
      const by = new Set(ev.filter(e => e.t === 'dmg' && e.label === 'Атака всем отрядом').map(e => e.src.charId));
      ok(has(ev, 'aoa') && by.has('yu') && by.has('march'), 'every ally joins the All-Out Attack');
      ok(b.enemies.every((e, i) => !alive(e) || e.hp < hp[i]), 'the All-Out Attack hits every foe');
      ok(!yu.flags.oneMore && (b.current !== yu || b.over), 'the All-Out Attack ends the turn');
    }
    b = fresh(['yu'], ['reaver:20', 'reaver:20']);
    const yu2 = b.allies[0];
    if (b.current) {
      yu2.energy = yu2.maxEnergy;
      b.ult(yu2, null);
      ok(yu2.flags.freeSkill && b.skillCost(yu2) === 0, 'Myriad Truths makes the next Skill free');
      ok(b.living.every(e => e.tough < e.maxTough), 'Myriad Truths hits Toughness without a weakness');
    }

    b = fresh(['kanji'], ['reaver:20', 'reaver:20', 'reaver:20']);
    const kj = turnOf(b, 'kanji');
    ok(kj, 'Kanji gets a turn');
    if (kj) {
      const main = b.living[1];
      const pvPlain = b.preview('basic', main, kj).rows.get(main).lo;
      b.sp = 3;
      b.act('skill', main);
      const ev = b.drain();
      const s = kj.flags.stitch;
      ok(s && s.a === main && [b.enemies[0], b.enemies[2]].includes(s.b), 'Stitch sews the target to a neighbour');
      const hitMain = ev.find(e => e.t === 'dmg' && e.u === main && !e.label);
      const echo = ev.find(e => e.t === 'dmg' && e.u === s.b && e.label === 'Стежок');
      ok(hitMain && echo && Math.abs(echo.v - Math.round(hitMain.v * T.stitchDmg)) <= 1, 'the thread carries 40% of the damage');
      ok(s.b.tough < s.b.maxTough || s.b.broken, 'the thread carries Toughness damage');
      if (alive(main)) ok(b.preview('basic', main, kj).rows.get(main).lo > pvPlain, 'Kanji hits stitched foes harder');
      for (let i = 0; i <= T.stitchTurns + 1; i++) b.inabaTurn(kj);
      ok(!kj.flags.stitch, 'the stitch comes undone');
    }
    b = fresh(['kanji'], ['reaver:20']);
    if (b.current) { b.stitch(b.allies[0], b.living[0]); ok(!b.allies[0].flags.stitch && b.drain().some(e => e.text === 'Не с кем сшить'), 'a lone foe cannot be stitched'); }

    b = fresh(['chie'], ['eliminator:20', 'eliminator:20']);
    c = turnOf(b, 'chie');
    if (c) {
      const t = b.living[0];
      c.base.critR = 1;
      b.act('basic', t);
      ok(t.tough < t.maxTough || t.broken, 'a Chie crit hits Toughness without a weakness');
    }
    b = fresh(['chie', 'march'], ['eliminator:20', 'gepard_b:20']);
    if (b.current) {
      const [e1, boss] = b.living, ch = b.allies[0];
      e1.hp = Math.round(e1.maxHp * 0.2); boss.hp = Math.round(boss.maxHp * 0.2);
      b.inabaFx({ k: 'execute', v: T.chieExecute }, ch, ch, { main: e1 }, new Set());
      b.inabaFx({ k: 'execute', v: T.chieExecute }, ch, ch, { main: boss }, new Set());
      ok(!alive(e1) && alive(boss), 'Galactic Punt knocks out a weak common foe but not a boss');
    }

    b = fresh(['rise', 'march'], ['reaver:20', 'eliminator:20']);
    const rs = turnOf(b, 'rise');
    ok(rs, 'Rise gets a turn');
    if (rs) {
      const t = b.living[1];
      b.sp = 3;
      b.act('skill', t);
      b.drain();
      ok(b.analyzed(t) && t.buffs.some(x => x.s === 'toughIn') && t.buffs.some(x => x.s === 'critTaken') && t.buffs.some(x => x.s === 'vuln'), 'Full Analysis marks the foe');
      const plan = b.intentOf(t);
      ok(plan && plan.n, 'the next enemy action is known');
      let seen = null, g = 0;
      while (!b.over && !seen && g++ < 30) {
        if (b.current) b.act('basic', b.living.find(e => e !== t) || t);
        for (const e of b.drain()) if (e.t === 'act' && e.u === t && !seen) seen = e.name;
      }
      ok(!seen || seen === plan.n, 'the analysed foe uses the shown action (' + seen + ')');
      const t2 = b.living[0];
      if (t2) {
        b.analyze(rs, t2, 2); b.drain();
        for (const a of b.livingAllies) { a.shield = 0; a.shieldT = 0; }
        b.riseWarn(t2, { t: 'all' }, false);
        ok(b.livingAllies.every(a => a.shield > 0) && has(b.drain(), 'warn'), 'Rise shields everyone before a hit on all');
      }
    }

    b = fresh(['march', 'yosuke'], ['reaver:20', 'reaver:20', 'reaver:20']);
    m = turnOf(b, 'march');
    if (m) {
      const y = b.allies[1];
      y.av = 1e9;
      b.living[0].tough = 1;
      b.act('basic', b.living[0]);
      ok(b.drain().filter(e => e.t === 'act' && e.name === 'Атака Ёсуке').length === 1 && !y.flags.strike, 'Yosuke follows up an ally break');
      const t = b.living.find(e => !e.broken);
      if (t && b.current) { t.tough = 1; b.act('basic', t); ok(!b.drain().some(e => e.t === 'act' && e.name === 'Атака Ёсуке'), 'Yosuke strikes once until his turn'); }
    }

    b = fresh(['yukiko', 'march'], ['reaver:20']);
    if (b.living.length) {
      const mm = b.allies[1], foe = b.living[0];
      mm.hp = Math.round(mm.maxHp * 0.5);
      const hp0 = mm.hp;
      b.addDot(b.allies[0], foe, 'burn', 10, 2);
      b.startTurn(foe);
      ok(mm.hp > hp0, 'a Burn tick heals the most wounded ally');
    }

    b = fresh(['rise', 'kanji', 'yu'], ['reaver:20', 'flamespawn:20'], 5, [{ charId: 'rise', fx: 'riseTech' }, { charId: 'kanji', fx: 'kanjiTech' }, { charId: 'yu', fx: 'yuTech' }]);
    ok(b.scan && b.scan.some(s => s.fam === 'voidranger' && s.tags.includes('threat')), 'Rise scan shows what the foes like in Contact');
    ok(b.allies.some(a => a.shield > 0), 'Knitted Bunny gives a shield');
    ok(b.allies[2].flags.freeSkill, 'Yu Technique makes the first Skill free');


    ok(P4.every(id => H.CHARS[id] === KITS[id]), 'the Investigation Team is in the roster data');
    for (const [id, f] of Object.entries(H.INABA.FUSIONS)) ok(H.FUSIONS[id] === f && f.fx.every(x => FX.has(x.k)), 'Investigation Team Fusion ' + id);
    for (const [id, c2] of Object.entries(H.INABA.CONES)) ok(H.CONES[id] === c2 && H.CHARS[c2.sig] && H.CHARS[c2.sig].path === c2.path, 'Investigation Team signature cone ' + id);
    ok(!Object.values(H.WARP_POOL).some(p => p.some(x => P4.includes(x) || ['cone:truth', 'cone:thread', 'cone:affection'].includes(x))), 'the Investigation Team is not in the standard pool');

    b = fresh(['yu', 'yosuke'], ['reaver:20', 'eliminator:20']);
    if (b.current) {
      for (const a of b.allies) a.energy = a.maxEnergy;
      for (const e of b.living) e.tough = 5;
      ok(b.fusion('f_partners', null), 'Partners runs');
      ok(has(b.drain(), 'aoa') || b.over, 'Partners ends in the All-Out Attack when every foe breaks');
    }
    b = fresh(['kanji', 'rise'], ['reaver:20', 'reaver:20', 'reaver:20']);
    if (b.current) {
      for (const a of b.allies) a.energy = a.maxEnergy;
      ok(b.fusion('f_emperor', b.living[1]), 'Emperor on the line runs');
      ok(b.over || (b.living.every(e => b.analyzed(e)) && b.allies[0].flags.stitch), 'Emperor on the line analyses everyone and stitches the target');
    }
    b = fresh(['trail', 'yu'], ['reaver:20', 'reaver:20']);
    if (b.current) {
      for (const a of b.allies) a.energy = a.maxEnergy;
      ok(b.availableFusions().some(x => x.id === 'f_fools' && x.ready) && b.fusion('f_fools', null), 'I am thou runs with the Trailblazer');
    }

    const coned = (id, cone) => Object.assign(spec(id), { cone: { id: cone, fx: cone, sup: 1 } });
    b = new H.Battle({ party: [coned('yu', 'truth')], enemies: ['reaver:20'], lvl: 20, seed: 5 }); b.start(); b.drain();
    const yt = b.allies[0], foe = b.living[0];
    const plain = b.inabaDmg(yt, foe, { kind: 'basic' });
    yt.flags.oneMore = true;
    ok(plain === 0 && b.inabaDmg(yt, foe, { kind: 'basic' }) > 0 && b.inabaDmg(yt, foe, { kind: 'aoa' }) > b.inabaDmg(yt, foe, { kind: 'basic' }), 'Reach Out to the Truth powers «Ещё раз!» and the All-Out Attack');
    b = new H.Battle({ party: [coned('kanji', 'thread')], enemies: ['reaver:20', 'reaver:20'], lvl: 20, seed: 5 }); b.start(); b.drain();
    const kt = b.allies[0];
    b.stitch(kt, b.living[0], b.living[1]);
    kt.hp = Math.round(kt.maxHp * 0.5);
    const kh = kt.hp;
    b.acting = null; b.doBreak(kt, b.living[0], 'phys');
    ok(b.inabaDmg(kt, b.living[1], { kind: 'basic' }) > T.kanjiVsStitch && kt.hp > kh, 'Stitch by Stitch hits stitched foes harder and heals on their break');
    b = new H.Battle({ party: [coned('rise', 'affection'), spec('march')], enemies: ['reaver:20'], lvl: 20, seed: 5 }); b.start(); b.drain();
    b.analyze(b.allies[0], b.living[0], 2);
    ok(b.allies.every(a => a.buffs.some(x => x.name === 'Твоя привязанность')), 'Your Affection lifts the team on every analysis');
    {
      const FOUR4 = { yosuke: 'junesday', chie: 'dragontrial', yukiko: 'amagiinn' };
      ok(Object.values(H.BANNERS.comp.stars).every(st => st.four.join() === Object.values(FOUR4).map(c => 'cone:' + c).join()), 'the Compendium features the three Investigation Team 4★ cones');
      ok(Object.entries(FOUR4).every(([id, c]) => H.CONES[c].rarity === 4 && H.CONES[c].sig === id && H.CONES[c].path === H.CHARS[id].path && H.CONES[c].fx === c), 'each 4★ cone belongs to its 4★ hero');
      ok(!Object.values(H.WARP_POOL).some(p => p.some(x => Object.values(FOUR4).includes(x.slice(5)))), 'the 4★ collab cones stay out of the standard pool');
      const cb = new H.Battle({ party: [coned('yosuke', 'junesday'), coned('chie', 'dragontrial'), coned('yukiko', 'amagiinn')], enemies: ['reaver:20'], lvl: 20, seed: 5 }); cb.start(); cb.drain();
      const [cy, cc, ck] = cb.allies, foe = cb.living[0];
      const near = (x, y) => Math.abs(x - y) < 1e-9;
      ok(near(cb.inabaDmg(cy, foe, { kind: 'follow' }) - cb.inabaDmg(cy, foe, { kind: 'basic' }), 0.24), 'Every Day at Junes lifts follow-up damage');
      const was = foe.broken;
      foe.broken = false; const whole = cb.inabaDmg(cc, foe, { kind: 'basic' });
      foe.broken = true; const hurt = cb.inabaDmg(cc, foe, { kind: 'basic' });
      foe.broken = was;
      ok(near(hurt - whole, 0.24), 'Trial of the Dragon hits broken foes harder');
      ok(near(cb.inabaDmg(ck, foe, { dot: true }) - cb.inabaDmg(ck, foe, {}), 0.24), 'Amagi Inn lifts damage over time');
      const vg4 = new H.Game({ seed: 3 });
      vg4.state.inv.items.vkey = 300; vg4.state.flags.velvet_contract = true;
      const got = vg4.warp(100, 'comp') || [];
      const fours = (Array.isArray(got) ? got : got.results || []).filter(r => r.rar === 4 && r.kind === 'cone');
      ok(fours.length > 0 && fours.filter(r => Object.values(FOUR4).includes(r.id)).length >= fours.length * 0.5, 'Compendium 4★ cones are mostly the collab ones');
    }

    {
      const MB = H.BANNERS.mid, CB = H.BANNERS.comp, FIVE = ['yu', 'kanji', 'rise'];
      ok(MB && CB && MB.pass === 'vkey' && CB.pass === 'vkey' && H.ITEMS.vkey, 'the Midnight Channel and the Compendium sell for Velvet Keys');
      eq(Object.keys(MB.stars).join(), FIVE.join(), 'the Midnight Channel offers Yu, Kanji and Rise');
      ok(FIVE.every(id => MB.stars[id].four.join() === 'yosuke,chie,yukiko' && H.CONES[CB.stars[id].cone].sig === id), 'each banner features the three 4★ and its signature cone');
      ok(new Set(FIVE.map(id => MB.stars[id].name)).size === 3 && FIVE.every(id => MB.stars[id].name !== H.CONES[CB.stars[id].cone].name), 'banner names differ from each other and from the cones');
      const vg = new H.Game({ seed: 11 });
      vg.state.jade = 0;
      vg.state.inv.items.vkey = 400;
      eq(vg.defaultBanner(), 'mid', 'Velvet Keys open the Midnight Channel by default');
      vg.setStarOf('mid', 'kanji');
      const B = vg.bannerOf('mid');
      ok(B.five === 'kanji' && B.featRate === T.midFeatured, 'the chosen hero is the featured 5★');
      const std5 = H.WARP_POOL.five.filter(x => !x.startsWith('cone:'));
      let fives = [], fours = [], guarOk = true;
      for (let i = 0; i < 30; i++) {
        const before = vg.pityOf('mid').guar5;
        for (const r of vg.warp(10, 'mid')) {
          if (r.rar === 5) { fives.push(r.pick); if (before && r.pick !== 'kanji') guarOk = false; }
          if (r.rar === 4) fours.push(r.pick);
        }
      }
      ok(fives.length && fives.every(p => p === 'kanji' || std5.includes(p)), 'a Midnight Channel 5★ is the chosen hero or a standard 5★ (' + fives.join(',') + ')');
      ok(!fives.some(p => p === 'yu' || p === 'rise'), 'the other Persona heroes never come as a 50/50 loss');
      ok(guarOk, 'a lost 50/50 makes the next 5★ the chosen hero');
      ok(fours.every(p => ['yosuke', 'chie', 'yukiko', 'kazuma'].includes(p) || H.WARP_POOL.four.includes(p)) && fours.some(p => ['yosuke', 'chie', 'yukiko'].includes(p)), 'the 4★ are the featured three or the usual pool');
      eq(vg.state.inv.items.vkey, 100, 'every pull spends one Velvet Key');
      ok(vg.state.warpLog[0].ban === 'mid' && vg.state.warpNMid === 300, 'the history counts Midnight Channel pulls');
      vg.setStarOf('comp', 'rise');
      const cr = [];
      for (let i = 0; i < 8; i++) for (const r of vg.warp(10, 'comp')) if (r.rar === 5) cr.push(r.pick);
      ok(vg.bannerOf('comp').five === 'cone:affection' && cr.length && cr.every(p => p === 'cone:affection' || H.WARP_POOL.five.includes(p)), 'the Compendium gives the chosen signature cone or a standard 5★ cone');
      ok(vg.state.warpLog[0].ban === 'comp' && vg.pityOf('comp') !== vg.pityOf('mid'), 'the Compendium keeps its own pity');

      let now = Date.UTC(2026, 9, 13, 12);
      const dg = new H.Game({ seed: 3, clock: () => now });
      ok(!dg.cond('%midnight'), 'the Midnight Channel waits for the rumor');
      dg.state.credits = 99999;
      ok(dg.buyRumor('rumor_midnight') && dg.cond('%midnight'), 'Sampo sells the Midnight Channel rumor');
      dg.give({ midnight: 1 });
      ok(dg.state.inv.items.vkey === 1 && !dg.cond('%midnight'), 'the screen gives one key per day');
      for (let d = 1; d <= 12; d++) { now += 86400000; if (dg.cond('%midnight')) dg.give({ midnight: 1 }); }
      eq(dg.state.inv.items.vkey, T.midnightKeys, 'the Midnight Channel gives ' + T.midnightKeys + ' keys in all');
      ok(H.SCRIPTS.exp_broadcast[0].if === '%midnight' && H.SCRIPTS.mid_channel.some(s => s && s.give && s.give.midnight), 'the broadcast screen shows the Midnight Channel first');
      ok(dg.signContract() && dg.state.inv.items.vkey === T.midnightKeys + T.contractKeys && !dg.signContract(), 'the contract gives its key once');
      ok(H.MAIL.find(m => m.id === 'v13_signal').give.items.vkey === 10, 'the 1.3 letter brings ten Velvet Keys');
    }
    for (const [party, enc] of [[['yu', 'kanji', 'rise', 'yukiko'], 'svarog'], [['yu', 'yosuke', 'chie', 'yukiko'], 'gepard2'], [['kanji', 'pela', 'march', 'natasha'], 'svarog'], [['seele', 'rise', 'march', 'yukiko'], 'cocolia1']]) {
      let wins = 0, stuck = 0;
      for (let s = 1; s <= 6; s++) { const ab = new H.Battle({ party: party.map(id => mkSpec(id, 30)), enemies: H.ENCOUNTERS[enc].enemies, waves: H.ENCOUNTERS[enc].waves, boss: true, seed: s * 31 }); ab.start(); let n = 0; while (!ab.over && n++ < 800) if (!ab.autoStep()) { stuck++; break; } if (ab.result && ab.result.win) wins++; }
      ok(wins >= 5 && !stuck, 'auto battle plays ' + party.join('+') + ' well vs ' + enc + ' (' + wins + '/6, stuck ' + stuck + ')');
    }
  }
}
{
  const T = H.TUNING;
  const spec = id => Object.assign(mkSpec(id, 30), { key: id });
  const fresh = (party, foes, seed, techs) => { const b = new H.Battle({ party: party.map(spec), enemies: foes, lvl: 20, seed: seed || 5, techs: techs || [] }); b.start(); b.drain(); return b; };
  const turnOf = (b, id) => { let g = 0; while (!b.over && b.current && b.current.charId !== id && g++ < 40) b.act('basic', b.living[0]); return b.current && b.current.charId === id ? b.current : null; };
  for (const id of ['phrolova', 'scar']) { const c = H.CHARS[id]; ok(c.rarity === 5 && c.faction === 'wuwa', 'Wuthering Waves resonator ' + id); }
  ok(H.CHARS.phrolova.path === 'remembrance' && H.PATHS.remembrance.name === 'Память', 'Phrolova walks the Path of Remembrance');
  for (const k of ['enhanced', 'cue']) ok(TARGETS.has(H.CHARS.phrolova[k].target) && H.CHARS.phrolova[k].fx.every(f => FX.has(f.k)), 'Phrolova ' + k + ' ability is valid');
  for (const k of ['nbasic', 'nskill']) ok(TARGETS.has(H.CHARS.scar[k].target) && H.CHARS.scar[k].fx.every(f => FX.has(f.k)), 'Scar ' + k + ' ability is valid');

  let b = fresh(['phrolova', 'march'], ['reaver:20', 'reaver:20', 'reaver:20']);
  let p = b.allies[0];
  eq(p.flags.after, T.afterStart, 'Phrolova starts with Aftersound');
  ok(p.buffs.some(x => x.name === 'Послезвучие' && Math.abs(x.v - T.afterCritD * T.afterStart) < 1e-9), 'Aftersound raises CRIT DMG');
  eq(p.maxEnergy, 0, 'Phrolova has no energy bar');
  ok(!b.ultReady(p), 'no Waltz without notes');
  for (const e of b.living) e.hp = e.maxHp = 1e9;
  p = turnOf(b, 'phrolova');
  ok(p, 'Phrolova gets a turn');
  b.act('basic', b.living[0]);
  eq(p.flags.notes.join(), 'str', 'the basic attack writes a Strings note');
  p = turnOf(b, 'phrolova');
  b.sp = 3;
  b.act('skill', b.living[1]);
  ok(p.flags.notes.join() === 'str,wind' && p.flags.reinc, 'the skill writes a Winds note and starts Reincarnate');
  p = turnOf(b, 'phrolova');
  eq(b.abilityFor(p, 'basic').ab.name, H.CHARS.phrolova.enhanced.name, 'Reincarnate empowers the next basic attack');
  const tgt = b.living[0], av0 = tgt.av;
  b.act('basic', tgt);
  ok(p.flags.notes.join() === 'str,wind,str' && !p.flags.reinc && tgt.av > av0, 'the empowered basic writes Strings, ends Reincarnate and delays the target');
  p.flags.notes = ['cad', 'str', 'wind', 'str', 'wind', 'str'];
  b.writeNote(p, 'wind');
  eq(p.flags.notes.join(), 'cad,wind,str,wind,str,wind', 'a seventh note pushes out the oldest Strings or Winds note');
  p.flags.notes = ['cad', 'cad', 'cad', 'cad', 'cad', 'cad'];
  b.writeNote(p, 'str');
  eq(p.flags.notes.join(), 'cad,cad,cad,cad,cad,cad', 'Cadenza notes never drop out');
  p.flags.notes = ['str'];
  const ma = b.allies[1];
  ma.energy = ma.maxEnergy;
  ok(b.ult(ma, ma), 'March 7th casts her Ultimate');
  ok(p.flags.cad, 'an ally Ultimate makes the next note a Cadenza');
  b.writeNote(p, 'str');
  ok(p.flags.notes[1] === 'cad' && !p.flags.cad, 'the next written note becomes a Cadenza');
  p.flags.notes = ['str', 'wind', 'cad', 'str', 'wind', 'cad'];
  ok(b.ultReady(p), 'six notes ready the Waltz');
  b.drain();
  ok(b.ult(p, b.living[0]), 'the Waltz is cast without energy');
  let ev = b.drain();
  const hec = b.summons[0];
  ok(hec && hec.summon && hec.owner === p && ev.some(x => x.t === 'hecate' && x.on), 'Hecate enters the battle');
  ok(b.orderSnap(null).av.has(hec) && !b.livingAllies.includes(hec), 'Hecate stands on the action order but is not a target');
  ok(p.flags.maestro && p.flags.notes.length === 0 && p.buffs.some(x => x.name === 'Маэстро'), 'Maestro takes the written notes');
  ok(!b.ultReady(p), 'no second Waltz while Hecate plays');
  for (let i = 0; i < 40; i++) ok(b.pickTarget(b.living[0]) !== hec, 'enemies never aim at Hecate');
  const after0 = p.flags.after;
  b.summonTurn(hec);
  ev = b.drain();
  eq(ev.filter(x => x.t === 'act' && x.kind === 'summon').length, T.notesPerTurn, 'Hecate plays two notes per turn');
  eq(p.flags.after, after0 + T.notesPerTurn, 'every note played adds Aftersound');
  ok(ev.some(x => x.t === 'dmg' && x.src === p && x.label === 'струнные'), 'Hecate damage counts as Phrolova damage');
  p = b.current && b.current.charId === 'phrolova' ? b.current : turnOf(b, 'phrolova');
  if (p && p.flags.maestro) {
    eq(b.abilityFor(p, 'basic').ab.name, H.CHARS.phrolova.cue.name, 'during Maestro the basic attack cues Hecate');
    b.act('basic', b.living[0]);
    ok(hec.av === 0 || !p.flags.maestro, 'the cue sends Hecate on stage at once');
  }
  for (let g = 0; g < 6 && hec.owner.flags.maestro; g++) b.summonTurn(hec);
  ev = b.drain();
  ok(ev.some(x => x.t === 'act' && x.name === 'Финальный поклон') && hec.gone && !b.summons.includes(hec), 'the Curtain Call ends the performance');
  ok(!p.flags.maestro && !p.buffs.some(x => x.name === 'Маэстро'), 'Maestro ends with the Curtain Call');
  ok(b.allies.some(a => a !== p && a.buffs.some(x => x.name === 'Неоконченная пьеса')), 'Unfinished Piece empowers the next ally');

  b = fresh(['phrolova', 'march'], ['reaver:20']);
  p = b.allies[0];
  p.flags.notes = ['str', 'str', 'str', 'str', 'str', 'str'];
  b.maestro(p);
  ok(b.summons.length === 1, 'Maestro summons Hecate');
  b.onZero(p, b.living[0]);
  ok(!b.summons.length && !p.flags.maestro, 'Hecate leaves when Phrolova falls');

  b = fresh(['phrolova'], ['reaver:20'], 5, [{ charId: 'phrolova', fx: 'phrolovaTech' }]);
  eq(b.allies[0].flags.notes.join(), 'cad,cad', 'the technique writes two Cadenza notes');

  b = fresh(['scar', 'march', 'danheng'], ['reaver:20', 'reaver:20', 'reaver:20']);
  let sc = b.allies[0];
  for (const e of b.living) e.hp = e.maxHp = 1e9;
  sc = turnOf(b, 'scar');
  ok(sc, 'Scar gets a turn');
  const foe = b.living[1];
  b.sp = 3;
  b.act('skill', foe);
  ok(foe.elys && foe.elys.by === sc && foe.elys.need === 2 && foe.elys.broke.length === 0, 'Elysium seals the target');
  ok(sc.buffs.some(x => x.name === 'Хозяин Элизиума'), 'Scar takes less damage while an Elysium stands');
  for (let i = 0; i < 20; i++) eq(b.pickTarget(foe), sc, 'the sealed enemy only attacks Scar');
  b.hit(sc, foe, 1, {});
  eq(foe.elys.broke.length, 0, 'Scar never breaks his own seals');
  const ma2 = b.allies[1], dh = b.allies[2];
  b.hit(ma2, foe, 1, {});
  b.hit(ma2, foe, 1, {});
  eq(foe.elys.broke.length, 1, 'one ally breaks only one seal');
  b.addDot(dh, foe, 'shear', 10, 2);
  b.hit(dh, foe, 0, { fixed: 5, isDot: true });
  eq(foe.elys.broke.length, 1, 'damage over time does not break seals');
  foe.elys.embers = 4;
  b.drain();
  const scAv = sc.av = 9000;
  b.hit(dh, foe, 1, {});
  b.cleanup();
  ev = b.drain();
  ok(ev.some(x => x.t === 'elysBurst' && x.u === foe) && ev.some(x => x.t === 'dmg' && x.label === 'Разрыв Элизиума' && x.u === foe), 'the second seal bursts the Elysium');
  ok(!foe.elys && sc.av < scAv && !sc.buffs.some(x => x.name === 'Хозяин Элизиума'), 'the burst moves Scar forward and ends his guard');

  b = fresh(['scar', 'phrolova'], ['reaver:20']);
  const f3 = b.living[0];
  f3.hp = f3.maxHp = 1e9;
  b.sealElysium(b.allies[0], f3, 2);
  p = b.allies[1];
  b.hit(p, f3, 1, {});
  b.playNote(p, 'str', null, true);
  b.cleanup();
  ok(!f3.elys && b.drain().some(x => x.t === 'elysBurst'), 'Phrolova and Hecate count as two sides of the Elysium');
  b.sealElysium(b.allies[0], f3, 2);
  for (let i = 0; i < T.elysRounds; i++) b.startTurn(f3);
  ok(!f3.elys, 'an untouched Elysium fades after three enemy turns');

  b = fresh(['scar', 'march'], ['reaver:20', 'reaver:20']);
  sc = b.allies[0];
  for (const e of b.living) e.hp = e.maxHp = 1e9;
  sc.energy = sc.maxEnergy;
  ok(b.ult(sc, b.living[0]), 'Scar casts Aberrant Nightmare');
  ok(sc.elem === 'quant' && sc.flags.nightmare === T.nightmareTurns, 'the nightmare form turns Scar Quantum');
  sc = turnOf(b, 'scar');
  if (sc) {
    eq(b.abilityFor(sc, 'basic').ab.name, H.CHARS.scar.nbasic.name, 'the reaper scythe replaces the knives');
    eq(b.abilityFor(sc, 'skill').ab.name, H.CHARS.scar.nskill.name, 'the nightmare Elysium replaces the skill');
    b.sp = 3;
    b.act('skill', b.living[0]);
    ok(b.living.every(e => e.elys && e.elys.need === 1), 'the nightmare Elysium seals every enemy with one seal');
    sc = turnOf(b, 'scar');
    if (sc) {
      const hp0 = sc.hp;
      b.act('basic', b.living[0]);
      ok(sc.elem === 'fire' && !sc.flags.nightmare && sc.hp < hp0, 'the form ends after two turns at a price in HP');
    }
  }
  b = fresh(['scar'], ['reaver:20']);
  sc = b.allies[0];
  sc.hp = 1;
  b.endNightmare(sc);
  eq(sc.hp, 1, 'the price of evolution never kills');

  b = fresh(['scar'], ['reaver:20', 'reaver:20'], 5, [{ charId: 'scar', fx: 'scarTech' }]);
  ok(b.living[0].elys && b.living[0].elys.embers === 2, 'the technique seals the first enemy with two embers');

  b = fresh(['phrolova', 'scar'], ['reaver:20', 'reaver:20']);
  for (const e of b.living) e.hp = e.maxHp = 1e9;
  b.allies[0].flags.notes = ['str', 'wind', 'cad', 'str', 'wind', 'cad'];
  b.allies[1].energy = b.allies[1].maxEnergy;
  ok(b.availableFusions().some(f => f.id === 'f_dissonance' && f.ready), 'Dissonance needs six notes and a full Ultimate');
  b.drain();
  ok(b.fusion('f_dissonance', b.living[0]), 'Dissonance executes');
  ev = b.drain();
  ok(!b.allies[0].flags.notes.length && ev.filter(x => x.t === 'elysBurst').length === 2, 'Dissonance plays every note and bursts every Elysium');

  b = fresh(['scar', 'march', 'danheng'], ['reaver:20', 'reaver:20']);
  sc = b.current && b.current.charId === 'scar' ? b.current : turnOf(b, 'scar');
  if (sc) {
    b.sealElysium(sc, b.living[0], 2);
    b.living[0].elys.broke = ['march'];
    const ma3 = b.allies[1];
    const pv = b.preview('basic', b.living[0], b.allies[2]);
    const r = pv.rows.get(b.living[0]);
    ok(r && r.seal && r.burst > 0, 'the damage preview shows the seal and the Elysium burst');
    ok(!b.preview('basic', b.living[0], ma3).rows.get(b.living[0]).seal, 'no seal mark for an ally who already broke one');
  }

  let wins = 0;
  for (let s = 1; s <= 6; s++) { const ab = new H.Battle({ party: ['phrolova', 'scar', 'march', 'natasha'].map(spec), enemies: H.ENCOUNTERS.svarog.enemies, boss: true, seed: s * 31 }); ab.start(); const r = ab.runAuto(800); if (r && r.win) wins++; }
  ok(wins >= 5, 'auto battle plays Phrolova and Scar well (' + wins + '/6)');
}

{
  const T = H.TUNING;
  const spec = id => Object.assign(mkSpec(id, 30), { key: id });
  const fresh = (party, foes, seed, techs) => { const b = new H.Battle({ party: party.map(spec), enemies: foes, lvl: 20, seed: seed || 5, techs: techs || [] }); b.start(); b.drain(); return b; };
  const tough = b => { for (const e of b.living) e.hp = e.maxHp = 1e9; };
  const K = H.CHARS;
  for (const id of ['kazuma', 'aqua', 'megumin', 'darkness']) ok(K[id].faction === 'axel' && H.ELEMENTS[K[id].elem], 'KonoSuba hero ' + id);
  ok(K.kazuma.rarity === 4 && ['aqua', 'megumin', 'darkness'].every(id => K[id].rarity === 5), 'Kazuma is 4★, Aqua, Megumin and Darkness are 5★');
  ok(K.kazuma.skills.length === 3 && K.kazuma.skill === K.kazuma.skills[0] && K.kazuma.skills[2].target === 'ally', 'Kazuma knows Steal, Bind and Drain Touch');
  ok(H.UNHOLY.every(id => H.ENEMIES[id]) && H.UNHOLY.includes('reaver') && !H.UNHOLY.includes('soldier'), 'the unholy list names real enemies');
  ok(Object.values(H.CONTACT).every(p => p.react.weird), 'every enemy family reacts to strange requests');
  ok(['silvermane', 'voidranger', 'spawn'].every(f => H.CONTACT[f].react.weird === 'scared'), 'Darkness\'s strange request scares most enemies');

  let b = fresh(['darkness', 'kazuma'], ['reaver:20', 'reaver:20', 'reaver:20']);
  let dk = b.allies[0];
  const kz = b.allies[1];
  tough(b);
  ok(dk.buffs.some(x => x.name === 'Крепкое тело' && x.s === 'res'), 'Darkness resists effects');
  ok(kz.buffs.some(x => x.name === 'Невероятная удача' && x.s === 'critR'), 'Kazuma starts with extra CRIT Rate');
  const foe = b.living[1];
  ok(b.preview('basic', foe, dk).rows.get(foe).miss, 'the preview warns that Darkness misses a moving enemy');
  b.useAbility(dk, K.darkness.basic, foe, 'basic');
  let ev = b.drain();
  ok(ev.some(x => x.t === 'miss' && x.u === foe) && !ev.some(x => x.t === 'dmg' && x.u === foe), 'Darkness misses a moving enemy');
  ok(foe.flags.provoke === dk && dk.flags.ecstasy === 1 && kz.flags.luck === 1, 'a miss provokes the enemy, gives Ecstasy and gives Kazuma Luck');
  for (let i = 0; i < 10; i++) eq(b.pickTarget(foe), dk, 'the provoked enemy aims at Darkness');
  b.endTurn(foe);
  ok(!foe.flags.provoke, 'the provocation lasts one enemy turn');
  for (const [k, set] of [['broken', x => { x.broken = true; }], ['frozen', x => { x.broken = false; x.frozen = 1; }], ['bound', x => { x.frozen = 0; x.flags.bound = 1; }]]) {
    set(foe);
    ok(b.immobile(foe) && !b.preview('basic', foe, dk).rows.get(foe).miss, 'a ' + k + ' enemy stands still for Darkness');
    b.useAbility(dk, K.darkness.basic, foe, 'basic');
    ok(b.drain().some(x => x.t === 'dmg' && x.u === foe && x.src === dk && x.v > 0), 'Darkness hits a ' + k + ' enemy');
  }
  foe.flags.bound = 0;
  const e0 = dk.flags.ecstasy;
  b.hit(b.living[0], dk, 1, { e: 'phys' });
  ok(dk.flags.ecstasy === e0 + 1 && dk.buffs.some(x => x.name === 'Восторг' && x.s === 'defP'), 'every enemy hit gives Darkness Ecstasy and DEF');
  b.gainEcstasy(dk, 99);
  eq(dk.flags.ecstasy, T.ecstasyMax, 'Ecstasy stops at ' + T.ecstasyMax);
  eq(b.abilityFor(dk, 'basic').ab.name, K.darkness.enhanced.name, 'full Ecstasy turns the next swing into an accidental hit');
  b.drain();
  b.useAbility(dk, K.darkness.enhanced, foe, 'enhanced');
  ev = b.drain();
  ok(ev.filter(x => x.t === 'dmg' && x.src === dk).length >= 2 && !dk.flags.ecstasy, 'the accidental hit lands on a moving enemy and its neighbours and spends Ecstasy');
  b.useAbility(dk, K.darkness.skill, dk, 'skill');
  ok(dk.taunt > 0 && dk.shield > 0 && dk.buffs.some(x => x.name === 'Приманка' && x.s === 'dr'), 'Decoy taunts, shields and hardens Darkness');
  dk.taunt = 0;
  b.useAbility(dk, K.darkness.ult, dk, 'ult');
  ok(dk.flags.cover > 0 && dk.taunt > 0 && dk.flags.ecstasy === 3, 'the Ultimate covers the team, taunts and adds Ecstasy');
  b.drain();
  const kh = kz.hp;
  b.hit(b.living[0], kz, 1, { e: 'phys' });
  ev = b.drain();
  const cov = ev.find(x => x.t === 'dmg' && x.u === dk && x.label === 'Прикрытие'), mine = ev.find(x => x.t === 'dmg' && x.u === kz);
  ok(cov && cov.v > 0 && mine && kz.hp > kh - mine.v - 1, 'Darkness takes part of a hit aimed at an ally');
  const share = new H.Battle({ party: ['darkness', 'kazuma'].map(spec), enemies: ['reaver:20'], lvl: 20, seed: 5 });
  share.start(); share.drain();
  const free = share.dmgCalc(share.living[0], share.allies[1], 1, { e: 'phys' }, false);
  ok(mine.v < free, 'covered damage is lower than an open hit (' + mine.v + ' < ' + free + ')');
  b.endTurn(dk); b.endTurn(dk); b.endTurn(dk);
  ok(!(dk.flags.cover > 0), 'the cover ends after its turns');
  b = fresh(['darkness'], ['reaver:20'], 5, [{ charId: 'darkness', fx: 'darknessTech' }]);
  ok(b.allies[0].taunt > 0 && b.allies[0].flags.ecstasy >= 3, 'the technique taunts and starts with 3 Ecstasy');

  b = fresh(['kazuma', 'megumin'], ['reaver:20', 'reaver:20']);
  tough(b);
  const k2 = b.allies[0], mg = b.allies[1];
  const rich = b.living[0];
  b.addBuff(rich, { s: 'atkP', v: 0.2, turns: 3, name: 'Приказ' });
  rich.shield = 400;
  b.useAbility(k2, K.kazuma.skills[0], rich, 'skill');
  ok(!rich.buffs.some(x => x.name === 'Приказ') && !rich.shield, 'Steal takes a buff and the shield from the enemy');
  ok(k2.buffs.some(x => x.name === 'Краденое: Приказ' && x.v === 0.2) && k2.shield > 0, 'Kazuma keeps what he stole');
  const drops0 = b.reward.drops.length;
  for (let i = 0; i < 20; i++) b.useAbility(k2, K.kazuma.skills[0], rich, 'skill');
  const loot = b.drain().filter(x => x.t === 'loot');
  ok(loot.length > 2 && loot.length < 20 && b.reward.drops.length === drops0 + loot.length, 'Steal sometimes brings loot (' + loot.length + '/20)');
  ok(b.reward.drops.every(d => d === 'relic' || d === 'credits' || H.ITEMS[d]), 'stolen loot turns into battle rewards');
  eq(b.setSkill(k2, 1), 1, 'the skill picker selects Bind');
  eq(b.abilityFor(k2, 'skill').ab.name, 'Связывание', 'Bind replaces the skill while picked');
  eq(b.setSkill(k2, 5), 2, 'the picker wraps around');
  b.setSkill(k2, 0);
  b.addBuff(k2, { s: 'ehr', v: 10, turns: 99, name: 'Тест' });
  const tied = b.living[1];
  ok(b.preview('skill', tied, k2) && true, 'the Steal preview works');
  b.useAbility(k2, K.kazuma.skills[1], tied, 'skill');
  ok(tied.flags.bound === 1, 'Bind ties a normal enemy');
  eq(b.startTurn(tied), 'skip', 'a bound enemy loses its turn');
  ok(!tied.flags.bound && tied.flags.bindImm === 1, 'the enemy gets free and cannot be tied again at once');
  b.useAbility(k2, K.kazuma.skills[1], tied, 'skill');
  ok(!tied.flags.bound, 'the rope slips off a freshly freed enemy');
  eq(b.startTurn(tied), 'act', 'the freed enemy acts on its next turn');
  ok(!tied.flags.bindImm, 'the protection ends with that turn');
  mg.energy = 0;
  b.collapse(mg, 2);
  k2.hp = Math.round(k2.maxHp * 0.5);
  const kh2 = k2.hp;
  b.drain();
  b.useAbility(k2, K.kazuma.skills[2], mg, 'skill');
  ev = b.drain();
  ok(!mg.flags.collapse && mg.energy >= T.drainEnergy && !mg.buffs.some(x => x.name === 'Без сил'), 'Drain Touch gives energy and puts Megumin back on her feet');
  ok(ev.some(x => x.t === 'dmg' && x.label === 'Касание' && x.u.side === 'enemy') && k2.hp > kh2, 'Drain Touch hurts the strongest enemy and heals Kazuma');
  const boss = b.living[0];
  boss.charging = 1; boss.lockTarget = mg;
  b.addBuff(boss, { s: 'atkP', v: 0.2, turns: 3, name: 'Приказ' });
  boss.shield = 100;
  b.setLuck(k2, 3);
  const pvU = b.preview('ult', boss, k2).rows.get(boss).lo;
  b.setLuck(k2, 0);
  const pvU0 = b.preview('ult', boss, k2).rows.get(boss).lo;
  ok(pvU > pvU0, 'Luck raises the Great Heist damage');
  b.setLuck(k2, 3);
  const d1 = b.reward.drops.length;
  b.useAbility(k2, K.kazuma.ult, boss, 'ult');
  ok(boss.charging == null && !boss.lockTarget && !boss.shield && boss.buffs.every(x => x.debuff || x.perm), 'the Great Heist strips the enemy and stops its charge');
  ok(boss.buffs.some(x => x.name === 'Без оружия') && !k2.flags.luck && b.reward.drops.length === d1 + 1, 'the Great Heist disarms, spends Luck and always loots');
  b.setLuck(k2, 4); b.resisted(k2); b.resisted(k2);
  eq(k2.flags.luck, T.luckMax, 'Luck stops at ' + T.luckMax);
  ok(k2.buffs.some(x => x.name === 'Удача' && Math.abs(x.v - T.luckCrit * T.luckMax) < 1e-9), 'Luck raises CRIT Rate');
  b = fresh(['kazuma', 'march'], ['doomsday:20']);
  const bk = b.allies[0], bb = b.living[0];
  b.addBuff(bk, { s: 'ehr', v: 10, turns: 99, name: 'Тест' });
  const av0 = bb.av;
  b.useAbility(bk, K.kazuma.skills[1], bb, 'skill');
  ok(!bb.flags.bound && bb.av > av0 && bb.flags.bindImm === 1, 'Bind only pushes a boss back');
  b = fresh(['kazuma', 'march'], ['reaver:20'], 5, [{ charId: 'kazuma', fx: 'kazumaTech' }]);
  eq(b.allies[0].flags.luck, 2, 'the technique starts Kazuma with 2 Luck');

  b = fresh(['aqua', 'kazuma'], ['reaver:20', 'soldier:20']);
  let aq = b.allies[0];
  const k3 = b.allies[1];
  const [rv, so] = b.living;
  eq(b.axelMult(aq, K.aqua.basic.fx[0], rv, 1, true), 2.5, 'the God Blow hits the unholy two and a half times harder');
  eq(b.axelMult(aq, K.aqua.basic.fx[0], so, 1, true), 1, 'the God Blow is plain against the living');
  const dA = b.dmgCalc(rv, aq, 1, {}, false);
  aq.charId = 'x';
  const dX = b.dmgCalc(rv, aq, 1, {}, false);
  aq.charId = 'aqua';
  ok(Math.abs(dA / dX - (1 - T.unholyDr)) < 0.02, 'the unholy hit Aqua softer');
  let picks = 0;
  for (let i = 0; i < 400; i++) if (b.pickTarget(rv) === aq) picks++;
  ok(picks > 0.55 * 400, 'the unholy crowd around Aqua (' + picks + '/400)');
  b.onZero(k3, so);
  ok(k3.dead, 'Kazuma falls');
  eq(b.skillCost(aq, k3), T.reviveSp, 'reviving costs ' + T.reviveSp + ' Skill Points');
  eq(b.skillCost(aq, aq), 1, 'a normal heal costs one Skill Point');
  const pvR = b.preview('skill', k3, aq);
  ok(pvR.revive && pvR.rows.get(k3).heal > 0, 'the preview shows the revive');
  b.drain();
  b.useAbility(aq, K.aqua.skill, k3, 'skill');
  ev = b.drain();
  ok(!k3.dead && k3.hp === Math.round(k3.maxHp * T.reviveHp) && k3.energy === 0 && ev.some(x => x.t === 'revive' && x.u === k3), 'Aqua brings Kazuma back');
  ok(ev.some(x => x.t === 'act' && x.name === 'Воскрешение') && b.livingAllies.includes(k3), 'the revive shows its own name and puts Kazuma back in the fight');
  let failSeen = false;
  for (let s = 1; s <= 60 && !failSeen; s++) {
    const fb = fresh(['aqua', 'kazuma'], ['soldier:20'], s);
    const a = fb.allies[0];
    fb.useAbility(a, K.aqua.basic, fb.living[0], 'basic');
    const fe = fb.drain();
    if (!fe.some(x => x.t === 'fail')) continue;
    failSeen = true;
    ok(a.flags.tears === 1 && fb.allies[1].flags.luck === 1, 'a failed action makes Aqua cry and gives Kazuma Luck');
    let n = 0;
    while (a.flags.tears && n++ < 20) { fb.useAbility(a, K.aqua.basic, fb.living[0], 'basic'); fb.drain(); }
    ok(n < 20 && !a.flags.tears, 'a good action spends the tears');
  }
  ok(failSeen, 'Aqua sometimes fails');
  b = fresh(['aqua', 'kazuma'], ['reaver:20', 'soldier:20', 'reaver:20']);
  tough(b);
  aq = b.allies[0];
  for (const a of b.allies) a.hp = Math.round(a.maxHp * 0.5);
  const hp1 = b.allies.map(a => a.hp);
  b.useAbility(aq, K.aqua.ult, null, 'ult');
  ok(b.allies.every((a, i) => a.hp > hp1[i]) && b.living.every(e => e.buffs.some(x => x.s === 'wet')), 'the Sacred Create Water heals everyone and soaks every enemy');
  const wet = b.living[1];
  b.hit(aq, wet, 1, { e: 'ice' });
  ok(wet.frozen && !wet.buffs.some(x => x.s === 'wet'), 'an ice hit freezes a soaked enemy');
  b = fresh(['aqua'], ['reaver:20', 'soldier:20'], 5, [{ charId: 'aqua', fx: 'aquaTech' }]);
  ok(b.living.every(e => e.mood.happy === 1), 'the party trick cheers every enemy up');

  b = fresh(['megumin', 'darkness'], ['reaver:20', 'reaver:20', 'reaver:20']);
  tough(b);
  const m2 = b.allies[0];
  m2.energy = 0;
  for (let i = 0; i < 4; i++) b.useAbility(m2, K.megumin.skill, m2, 'skill');
  ev = b.drain();
  ok(m2.flags.chant === T.chantMax && ev.filter(x => x.t === 'chant').length === 4 && ev.find(x => x.t === 'chant').line, 'the chant stacks up to ' + T.chantMax + ' with a spoken line');
  eq(Math.round(m2.energy), 4 * T.chantEnergy, 'each chant line adds energy');
  const t0 = b.living[0];
  ok(!t0.weak.includes('fire'), 'the test enemy is not weak to Fire');
  const p3 = b.preview('ult', null, m2).rows.get(t0);
  m2.flags.chant = 0;
  const p0 = b.preview('ult', null, m2).rows.get(t0);
  m2.flags.chant = T.chantMax;
  ok(p3.tough > 0 && p3.tough > p0.tough, 'Explosion breaks any toughness, more with a full chant');
  ok(Math.abs(b.axelMult(m2, K.megumin.ult.fx[0], t0, 1, true) - (1 + T.chantMax * T.chantDmg)) < 1e-9 && p3.lo > p0.lo * 1.5, 'a full chant multiplies the Explosion');
  b.useAbility(m2, K.megumin.ult, null, 'ult');
  ok(b.living.every(e => e.tough < e.maxTough), 'the Explosion takes toughness from enemies without a Fire weakness');
  ok(!m2.flags.chant && m2.flags.collapse === T.collapseTurns && m2.buffs.some(x => x.name === 'Без сил'), 'after the Explosion Megumin collapses');
  m2.energy = m2.maxEnergy;
  ok(!b.ultReady(m2), 'no Explosion while she lies there');
  eq(b.startTurn(m2), 'skip', 'a collapsed Megumin skips her turn');
  eq(b.startTurn(m2), 'skip', 'she skips the second turn too');
  ok(!m2.flags.collapse && !m2.buffs.some(x => x.name === 'Без сил'), 'then she gets up');
  eq(b.startTurn(m2), 'act', 'and acts again');
  b = fresh(['megumin', 'darkness'], ['reaver:20', 'reaver:20']);
  const m3 = b.allies[0];
  for (const e of b.living) e.hp = 1;
  m3.energy = 0;
  b.useAbility(m3, K.megumin.ult, null, 'ult');
  ok(Math.round(m3.energy) >= 2 * T.boomKillEnergy && Math.abs(b.boomExp - 2 * T.boomExp) < 1e-9, 'every kill by the Explosion gives energy and battle EXP');
  b = fresh(['megumin', 'kazuma'], ['reaver:20', 'reaver:20'], 5, [{ charId: 'megumin', fx: 'meguminTech' }]);
  ok(b.living.every(e => e.hp < e.maxHp) && b.allies[0].flags.collapse === 1, 'the daily Explosion opens the battle and floors Megumin for a turn');
  {
    const wear = (u, id) => { u.cone = { id, fx: H.CONES[id].fx, sup: 1 }; };
    let cb = fresh(['megumin', 'darkness'], ['reaver:20', 'reaver:20']);
    const mc = cb.allies[0];
    wear(mc, 'manastaff');
    mc.flags.chant = T.chantMax;
    ok(Math.abs(cb.axelMult(mc, K.megumin.ult.fx[0], cb.living[0], 1, true) - (1 + T.chantMax * (T.chantDmg + 0.1))) < 1e-9, 'Manatite Staff adds 10% to the Explosion per chant');
    mc.energy = mc.maxEnergy;
    cb.useAbility(mc, K.megumin.ult, null, 'ult');
    eq(mc.flags.collapse, T.collapseTurns - 1, 'Manatite Staff shortens the collapse by a turn');
    cb = fresh(['darkness', 'megumin'], ['reaver:20']);
    const dk = cb.allies[0], mg = cb.allies[1];
    wear(dk, 'adamantite');
    dk.flags.ecstasy = T.ecstasyMax;
    ok(Math.abs(cb.axelConeDmg(mg) - 0.12) < 1e-9 && Math.abs(cb.axelConeDmg(dk) - 0.12) < 1e-9, 'Adamantite Armour lifts the team damage by 2% per Ecstasy, up to 12%');
    for (const a of cb.allies) { a.shield = 0; a.shieldT = 0; }
    dk.flags.cover = 1;
    cb.endTurn(dk);
    ok(cb.allies.every(a => a.shield > 0), 'Adamantite Armour shields the team when the Cover ends');
    cb = fresh(['aqua', 'kazuma'], ['reaver:20']);
    const aq = cb.allies[0], hurt = cb.allies[1];
    wear(aq, 'hagoromo');
    hurt.hp = 1;
    cb.heal(aq, hurt, 10);
    ok(hurt.buffs.some(x => x.name === 'Перьевая мантия' && x.s === 'res' && x.v === 0.2), 'Feather Mantle gives the healed ally effect RES');
    cb = fresh(['kazuma', 'megumin'], ['reaver:20']);
    const kz = cb.allies[0], foe = cb.living[0];
    foe.hp = foe.maxHp = 1e7;
    wear(kz, 'chunchunmaru');
    kz.flags.luck = 5;
    ok(Math.abs(cb.axelConeDmg(kz) - 0.15) < 1e-9, 'Chunchunmaru adds 3% damage per Luck');
    cb.addBuff(foe, { s: 'atkP', v: 0.2, turns: 3, name: 'Приказ' });
    cb.useAbility(kz, K.kazuma.skills[0], foe, 'skill');
    ok(kz.flags.chun && Math.abs(cb.axelConeDmg(kz) - 0.35) < 1e-9, 'a successful Steal makes the next attack 20% stronger');
    cb.useAbility(kz, K.kazuma.basic, foe, 'basic');
    ok(!kz.flags.chun, 'the next attack spends the bonus');
  }

  b = fresh(['kazuma', 'aqua'], ['reaver:20', 'reaver:20']);
  tough(b);
  for (const a of b.allies) a.energy = a.maxEnergy;
  ok(b.availableFusions().some(f => f.id === 'f_trap' && f.ready), 'Kazuma and Aqua can fuse');
  ok(b.fusion('f_trap', b.living[0]), 'Ice Trap executes');
  ok(b.living.every(e => e.frozen) && b.allies[0].flags.luck === 2, 'Ice Trap freezes every normal enemy and gives Luck');
  b = fresh(['megumin', 'darkness'], ['reaver:20', 'reaver:20']);
  tough(b);
  for (const a of b.allies) a.energy = a.maxEnergy;
  ok(b.fusion('f_onme', b.living[0]), 'Explosion on Me executes');
  const [fm, fd] = b.allies;
  ok(fd.flags.ecstasy === T.ecstasyMax && fd.taunt > 0 && fd.hp < fd.maxHp && !fm.flags.collapse, 'Darkness takes the blast with joy, Megumin stays up');
  b = fresh(['kazuma', 'aqua', 'megumin', 'darkness'], ['reaver:20', 'reaver:20', 'reaver:20']);
  tough(b);
  for (const a of b.allies) { a.energy = a.maxEnergy; a.hp = Math.round(a.maxHp * 0.5); }
  b.addBuff(b.allies[2], { s: 'atkP', v: -0.1, turns: 3, name: 'Порча', debuff: true });
  const fus = b.availableFusions().find(f => f.id === 'f_blessing');
  ok(fus && fus.ready && fus.members.length === 4, 'the whole party can fuse');
  b.drain();
  ok(b.fusion('f_blessing', b.living[0]), 'the party Fusion executes');
  ev = b.drain();
  ok(ev.find(x => x.t === 'fusion').members.length === 4, 'the Fusion event names all four');
  const [ka, , me, da] = b.allies;
  ok(b.allies.every(a => a.hp > Math.round(a.maxHp * 0.5)) && !me.buffs.some(x => x.name === 'Порча'), 'the party Fusion heals and cleanses');
  ok(da.taunt > 0 && ka.flags.luck === T.luckMax && !me.flags.collapse && b.living.every(e => e.tough < e.maxTough), 'Darkness holds them, Kazuma is lucky, Megumin stays up, every toughness drops');
}

function winRate(party, enc, n) {
  let w = 0;
  const e = H.ENCOUNTERS[enc];
  for (let s = 1; s <= n; s++) {
    const specs = party.map(([id, l]) => mkSpec(id, l));
    for (const t of e.trials || []) if (!specs.some(p => p.charId === t)) { if (specs.length >= 4) specs.pop(); specs.push(mkSpec(t, party[0][1])); }
    const b = new H.Battle({ party: specs, enemies: e.enemies, waves: e.waves, boss: e.boss, seed: s * 31 });
    b.start();
    const r = b.runAuto(600);
    if (r && r.win) w++;
  }
  return w / n;
}
const bossParties = {
  tut: [['trail', 1], ['march', 1], ['danheng', 1]],
  doomsday: [['trail', 8], ['march', 8], ['danheng', 8]],
  gepard: [['trail', 16], ['march', 16], ['danheng', 16], ['himeko', 14]],
  alley: [['trail', 16], ['march', 16], ['danheng', 16]],
  seele: [['trail', 16], ['march', 16], ['danheng', 16], ['hook', 16]],
  mine: [['trail', 19], ['march', 19], ['danheng', 19], ['natasha', 19]],
  svarog: [['trail', 24], ['march', 24], ['natasha', 24], ['hook', 24]],
  gepard2: [['trail', 26], ['march', 26], ['natasha', 26], ['serval', 26]],
  cocolia1: [['trail', 30], ['march', 30], ['natasha', 30], ['serval', 30]],
  cocolia2: [['trail_p', 30], ['march', 30], ['natasha', 30], ['serval', 30]]
};
for (const [enc, party] of Object.entries(bossParties)) {
  const r = winRate(party, enc, 12);
  log.push('winrate ' + enc + ' ' + r.toFixed(2));
  ok(r >= 0.5, 'encounter ' + enc + ' winnable with expected party (' + r + ')');
}

function drive(g, maxSteps = 4000) {
  let n = 0;
  while (n++ < maxSteps) {
    if (g.battle) {
      const b = g.battle;
      if (!b.ev.length && b.phase === 'run' && !b.over) b.start();
      b.runAuto(800);
      let out = g.endBattle();
      let tries = 0;
      while (out && out.lost && tries++ < 6) {
        for (const k of g.state.party) g.addExp(k, 3000);
        g.retryBattle();
        g.battle.start();
        g.battle.runAuto(800);
        out = g.endBattle();
      }
      ok(out && out.win, 'script battle won');
      g.afterBattle();
      continue;
    }
    const p = g.pending;
    if (p) {
      if (p.type === 'choice') g.resume(0);
      else if (p.type === 'ui' && p.ui === 'name') g.resume({ name: 'Стелла', gender: 'f' });
      else g.resume();
      continue;
    }
    if (g.script) { g.advanceScript(); if (!g.pending && !g.battle && g.script) continue; continue; }
    return;
  }
}

function adj(g, e) {
  for (const [dx, dy, dir] of [[0, 1, 'up'], [0, -1, 'down'], [1, 0, 'left'], [-1, 0, 'right']]) {
    const x = e.x + dx, y = e.y + dy;
    if (!g.blocked(x, y)) { g.placePlayer(x, y); g.player.dir = dir; return true; }
  }
  return false;
}
function talk(g, ch) {
  const e = g.map.ents.find(x => x.ch === ch && g.visible(x));
  ok(e, 'entity ' + ch + ' on ' + g.map.id);
  ok(adj(g, e), 'adjacent to ' + ch);
  ok(g.interact(), 'interact ' + ch);
  drive(g);
}
function stepOn(g, ch) {
  const e = g.map.ents.find(x => x.ch === ch);
  ok(e, 'step target ' + ch);
  g.placePlayer(e.x, e.y);
  g.lastExitTile = null;
  g.onStep();
  drive(g);
}
function exitVia(g, ch) {
  const e = g.map.ents.find(x => x.ch === ch && x.kind === 'exit');
  ok(e, 'exit ' + ch + ' on ' + g.map.id);
  const before = g.map.id;
  g.useExit(e);
  ok(g.map.id !== before, 'exit moved from ' + before + ' via ' + ch);
  drive(g);
}
function ride(g, to) {
  const e = g.map.ents.find(x => x.kind === 'exit' && x.def.lift);
  ok(e, 'space elevator on ' + g.map.id);
  g.useExit(e);
  const p = g.pending, name = H.MAPS[to].name.split(': ').pop();
  ok(p && p.type === 'choice' && p.title === 'Космический лифт', 'the elevator offers a list of zones on ' + g.map.id);
  const i = p.options.findIndex(o => o[0].startsWith(name));
  ok(i >= 0, 'the elevator lists ' + name);
  g.resume(i);
  drive(g);
}
function fightAll(g) {
  let wins = 0;
  for (const e of g.map.ents.filter(x => x.kind === 'enemy' && g.visible(x))) {
    g.encounter(e, 'player');
    g.battle.start();
    g.battle.runAuto(800);
    const out = g.endBattle();
    if (out && out.lost) { g.retryBattle(); g.battle.start(); g.battle.runAuto(800); g.endBattle(); }
    else if (out && out.win) wins++;
  }
  g.rest();
  return wins;
}
function lv(g) { return g.state.party.map(k => g.kitOf(k) + ':' + g.state.roster[k].lvl).join(' '); }

{
  const g = new H.Game({ fresh: true, seed: 42 });
  drive(g);
  ok(g.state.flags.kafka_go && g.map.id === 'hs_base', 'the Kafka prologue starts in the Base Zone');
  eq(g.state.party.join(), 'kafka,silverwolf', 'Kafka and Silver Wolf are the party');
  stepOn(g, 'u');
  ok(g.state.flags.kafka_lone, 'the lone Voidranger is beaten');
  stepOn(g, 'w');
  ok(g.state.flags.kafka_hall, 'the Reception Center scene plays');
  stepOn(g, 'b');
  ok(g.state.flags.kafka_route, 'the route fight is won');
  stepOn(g, 'y');
  ok(g.state.flags.kafka_room, 'the ambush at the Monitoring Room is beaten');
  talk(g, 'p');
  ok(!g.state.flags.kafka_curio, 'the curio waits for the terminals');
  talk(g, 'm');
  talk(g, 'n');
  ok(g.state.flags.kafka_hack, 'both terminals lead to the hack');
  talk(g, 'p');
  ok(g.state.flags.kafka_curio, 'the Blind Spot curio is found');
  talk(g, 'o');
  ok(g.state.flags.chaos && g.state.flags.intro, 'Chaos in the Deep and the first battle are done');
  eq(g.state.name, 'Стелла', 'name chosen');
  eq(g.map.id, 'hs_storage', 'the Trailblazer wakes in the Storage Zone');
  ok(!g.state.roster.kafka && !g.state.guest, 'the guests leave the roster');
  eq(g.state.party.join(), 'trail,march', 'March joins and Dan Heng goes after Arlan');
  fightAll(g);
  talk(g, 'y');
  ok(!g.state.flags.arlan_met, 'Arlan sends the team to the lift first');
  stepOn(g, 'l');
  ok(g.state.flags.lift && g.state.party.includes('danheng'), 'Dan Heng returns at the broken lift');
  const stairs = g.map.ents.find(e => e.ch === 'u' && e.kind === 'exit');
  g.useExit(stairs);
  eq(g.map.id, 'hs_storage', 'the stairs stay shut before Arlan');
  talk(g, 'y');
  ok(g.state.flags.arlan_met, 'arlan found');
  ok(g.state.roster.arlan && g.state.roster.arlan.eid === 0 && g.state.party.includes('arlan'), 'arlan joins the roster and the team');
  ok(g.state.inv.cones.some(c => c.id === 'collapsing'), 'Arlan gives a Light Cone');
  ok(!g.visible(g.map.ents.find(e => e.ch === 'y')), 'arlan leaves the control center');
  const chest = g.map.ents.find(e => e.kind === 'chest');
  adj(g, chest); g.interact();
  ok(g.state.opened[chest.key], 'chest opened');
  const anc = g.map.ents.find(e => e.kind === 'anchor');
  adj(g, anc); g.interact();
  eq(g.pending && g.pending.ui, 'anchor', 'anchor menu');
  g.resume();
  ok(g.state.anchors.includes(anc.key), 'anchor unlocked');
  exitVia(g, 'u');
  eq(g.map.id, 'hs_storage2', 'the second floor of the Storage Zone');
  fightAll(g);
  stepOn(g, 'z');
  ok(g.state.flags.storm, 'Eye of the Storm is done');
  eq(g.map.id, 'hs_control', 'the lift brings the team to the Master Control Zone');
  ok(g.state.party.includes('himeko') && g.state.roster.himeko.guest && g.state.party.length === 4, 'Himeko joins as a guest');
  ride(g, 'hs_supply');
  eq(g.map.id, 'hs_control', 'the Supply Zone lift waits for Asta');
  talk(g, 'r');
  ok(g.state.flags.asta_met && ['arrows', 'amber', 'chorus'].every(id => g.state.inv.cones.some(c => c.id === id)), 'Asta gives three Light Cones');
  talk(g, 'i');
  ok(g.state.flags.hinkel, 'Hinkel is helped');
  talk(g, 'b');
  ok(g.state.flags.abraham, 'Abraham is helped');
  ok(g.visible(g.map.ents.find(e => e.ch === 'y')), 'arlan rests in the Master Control Zone while Himeko takes his place');
  talk(g, 'r');
  ok(g.state.flags.moment, 'A Moment of Peace is done');
  ride(g, 'hs_supply');
  eq(g.map.id, 'hs_supply', 'the Supply Zone');
  ok(g.state.flags.supply_in, 'Asta calls on arrival');
  const hatch = g.map.ents.find(e => e.kind === 'gate' && e.ch === 'g');
  ok(g.visible(hatch), 'the warehouse hatch is shut');
  talk(g, 'g');
  ok(/Электроподстанции/.test(g.state.obj), 'the hatch points at the Electrical Room');
  fightAll(g);
  talk(g, 'l');
  ok(g.state.flags.hs_power && !g.visible(hatch), 'power opens the hatch');
  talk(g, 'b');
  ok(g.state.flags.hs_bridge, 'the repulsion bridge is on');
  log.push('before doomsday ' + lv(g));
  stepOn(g, 't');
  ok(g.state.flags.doom, 'doomsday defeated');
  ok(!g.state.guest && !g.state.roster.himeko && g.state.party.includes('arlan'), 'Himeko the guest leaves and Arlan is back');
  eq(g.map.id, 'hs_supply', 'the team wakes on the platform');
  ride(g, 'hs_control');
  exitVia(g, 'o');
  eq(g.map.id, 'hs_office', 'the office of Herta');
  talk(g, 'k');
  ok(g.state.flags.herta_met, 'Herta is met');
  g.loadMap('hs_supply', 'Ω');
  talk(g, 'h');
  eq(g.map.id, 'express', 'on the express');
  ok(g.state.flags.express_intro, 'express intro');
  ok((g.state.inv.items.pass || 0) >= 10, 'got passes');
  const res = g.warp(10);
  ok(res && res.length === 10, 'warp x10');
  ok(res.some(r => r.rar >= 4), 'warp x10 has 4-star');
  {
    const L = g.state.warpLog;
    ok(L.length === 10 && L.every(e => typeof e === 'object'), 'warp history keeps structured entries');
    ok(L.map(e => e.n).join() === '10,9,8,7,6,5,4,3,2,1', 'warp history numbers pulls, newest first');
    ok(new Set(L.map(e => e.batch)).size === 1 && L.every(e => e.at > 0 && e.at === L[0].at), 'a ten-warp shares one batch and one timestamp');
    ok(L.every((e, i) => e.id === res[9 - i].id && e.rar === res[9 - i].rar && e.kind === res[9 - i].kind), 'history entries match the reveal order');
    ok(L.every(e => (e.rar >= 4 ? e.pity >= 1 : e.pity === 0)), '4★ and 5★ entries record the pity count');
    ok(L.every(e => (e.kind === 'char' ? ['new', 'eid', 'credits'].includes(e.res) : e.sup >= 1)), 'history stores the character result or the cone superimposition');
  }
  const dests = g.destinations();
  const jar = dests.find(d => d.map === 'j_plains');
  ok(jar, 'jarilo destination');
  g.travel(jar);
  drive(g);
  ok(g.state.flags.jarilo_arrive, 'jarilo arrival');
  ok(!g.map.ents.some(e => e.def && e.def.unique === 'trotter_plains' && g.visible(e)), 'trotter hidden without rumor');
  fightAll(g);
  for (const k of g.state.party) g.autoEquip(k);
  log.push('before gepard ' + lv(g));
  stepOn(g, 't');
  ok(g.state.flags.plains_met && g.state.flags.sampo_met && g.state.flags.belobog_intro, 'plains encounter and belobog reached');
  eq(g.map.id, 'j_belobog', 'in belobog');
  g.state.credits += 5000;
  talk(g, 's');
  ok(g.state.flags.sampo_city, 'sampo met again in the city');
  ok(g.buyRumor('rumor_sword'), 'buy rumor');
  ok(g.shopList('belobog').some(e => e.id === 'sword_rumor'), 'rumor adds shop item');
  ok(g.buyRumor('rumor_trotter'), 'buy trotter rumor');
  const lockExit = g.map.ents.find(e => e.ch === 'u');
  g.useExit(lockExit);
  eq(g.map.id, 'j_belobog', 'alley closed before the escape');
  talk(g, 'v');
  ok(g.state.flags.serval_met, 'serval met on the first evening');
  talk(g, 'l');
  for (const k of g.state.party) g.autoEquip(k);
  log.push('before alley ' + lv(g));
  talk(g, 'h');
  ok(g.state.flags.fled && g.state.flags.hatch_open && g.state.flags.underworld, 'arrest, escape and underworld');
  eq(g.map.id, 'u_boulder', 'in boulder town');
  const up = g.map.ents.find(e => e.ch === 'u');
  g.useExit(up);
  eq(g.map.id, 'u_boulder', 'hatch locked while hunted');
  const east = g.map.ents.find(e => e.ch === 'e');
  g.useExit(east);
  eq(g.map.id, 'u_boulder', 'mine closed until wildfire vouches');
  const south = g.map.ents.find(e => e.ch === 'z');
  g.useExit(south);
  eq(g.map.id, 'u_boulder', 'rivet path locked');
  log.push('before seele ' + lv(g));
  talk(g, 'h');
  ok(g.state.flags.moles && g.state.flags.seele_trial && g.state.roster.hook && g.state.roster.natasha, 'moles, seele fight, hook and natasha joined');
  ok(g.setParty(['trail', 'march', 'danheng', 'natasha']), 'set party');
  exitVia(g, 'e');
  eq(g.map.id, 'u_mine', 'in mine');
  fightAll(g);
  for (const k of g.state.party) g.autoEquip(k);
  log.push('before grizzly ' + lv(g));
  stepOn(g, 't');
  ok(g.state.flags.mine_done, 'grizzly down, oleg met');
  exitVia(g, 'w');
  ok(g.state.flags.night_talk, 'night at the grand hotel');
  ok(g.setParty(['trail', 'march', 'natasha', 'hook']), 'set party with hook');
  exitVia(g, 'z');
  eq(g.map.id, 'u_rivet', 'rivet town');
  ok(g.state.flags.rivet_intro, 'orphanage scene');
  fightAll(g);
  for (const k of g.state.party) g.autoEquip(k);
  log.push('before svarog ' + lv(g));
  stepOn(g, 't');
  ok(g.state.flags.rivet_done, 'svarog stands down');
  exitVia(g, 'w');
  ok(g.state.flags.returned, 'bronya letter');
  exitVia(g, 'u');
  eq(g.map.id, 'j_belobog', 'back on surface');
  talk(g, 'v');
  ok(g.state.flags.finale_open && g.state.roster.serval, 'serval joined, gates open');
  for (const k of g.state.party) g.autoEquip(k);
  log.push('before gepard2 ' + lv(g));
  exitVia(g, 'e');
  eq(g.map.id, 'j_fissures', 'fissures');
  ok(g.state.flags.fissures_intro, 'gepard stands aside');
  fightAll(g);
  exitVia(g, 'e');
  eq(g.map.id, 'j_everwinter', 'everwinter');
  fightAll(g);
  for (const k of g.state.party) g.autoEquip(k);
  log.push('before cocolia ' + lv(g));
  stepOn(g, 't');
  ok(g.state.flags.ending, 'story complete');
  eq(g.state.mcPath, 'trail_p', 'preservation path');
  eq(g.map.id, 'express', 'ending returns to express');
  ok(g.state.bank.enemies.cocolia2 && g.state.bank.enemies.cocolia2.kills >= 1, 'bank records cocolia');
  const list = g.calyxList();
  ok(list.find(x => x.c.id === 'cx_echo_coco').open, 'echo unlocked post game');
  const p0 = g.state.power;
  ok(g.startCalyx('cx_relic', 0), 'calyx start');
  const rel0 = g.state.inv.relics.length;
  g.battle.start(); g.battle.runAuto(800);
  const out = g.endBattle();
  ok(out.win, 'calyx won');
  ok(g.state.inv.relics.length > rel0, 'calyx relics');
  ok(g.state.power < p0, 'calyx costs power');
  const saved = g.serialize();
  const g2 = new H.Game({ state: saved, seed: 1 });
  eq(g2.map.id, g.map.id, 'save restores map');
  eq(g2.state.flags.ending, true, 'save restores flags');
  eq(JSON.stringify(g2.charStats('trail')), JSON.stringify(g.charStats('trail')), 'save restores stats');
  log.push('final ' + lv(g) + ' jade ' + g.state.jade + ' credits ' + g.state.credits + ' roster ' + Object.keys(g.state.roster).length + ' relics ' + g.state.inv.relics.length);
  ok(g.useItem('medkit', 'trail') || true, 'item use callable');
  g.state.inv.items.exp2 = 1;
  const lv0 = g.state.roster.hook.lvl, e0 = g.state.roster.hook.exp;
  ok(g.useItem('exp2', 'hook'), 'exp book');
  ok(g.state.roster.hook.lvl > lv0 || g.state.roster.hook.exp > e0, 'exp book grants exp');
}

{
  const st = H.newState();
  st.flags.arlan_met = true;
  st.roster.trail.lvl = 20;
  const g = new H.Game({ state: st, seed: 2 });
  ok(g.state.roster.arlan && g.state.roster.arlan.lvl === 20 && !g.state.party.includes('arlan'), 'old saves past the storage zone get Arlan in the roster');
  st.roster.arlan = { lvl: 30, exp: 0, eid: 2, cone: null, relics: {}, hp: null, energy: 0 };
  eq(new H.Game({ state: st, seed: 2 }).state.roster.arlan.eid, 2, 'an owned Arlan gets no free Eidolon on load');
}

{
  const st = H.newState();
  for (const id of ['march', 'danheng', 'arlan', 'himeko']) st.roster[id] = { lvl: 20, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
  st.party = ['trail', 'march', 'danheng', 'arlan', 'himeko'];
  st.inv.items = { thermos: 2, spark: 1, sbiten: 2 };
  const g = new H.Game({ state: st, seed: 4 });
  const en = k => g.state.roster[k].energy;
  eq(H.ITEMS.thermos.use.energy, 0.25, 'thermos gives 25% energy to one character');
  eq(H.ITEMS.spark.use.energy, 0.6, 'geomarrow spark gives 60% energy to one character');
  eq(H.ITEMS.sbiten.use.energyAll, 0.15, 'sbiten gives 15% energy to the whole team');
  ok(H.SHOPS.belobog.items.includes('thermos') && H.SHOPS.boulder.items.includes('sbiten') && H.SHOPS.boulder.items.includes('spark'), 'energy items are sold in Belobog shops');
  ok(g.useItem('thermos', 'march') && en('march') === 30, 'thermos adds 25% of the 120 energy of March 7th');
  ok(g.useItem('spark', 'danheng') && en('danheng') === 60, 'spark adds 60% of the 100 energy of Dan Heng');
  g.state.roster.arlan.hp = 0;
  ok(g.useItem('sbiten'), 'sbiten is used on the team');
  ok(en('trail') === 18 && en('march') === 48 && en('danheng') === 75 && en('arlan') === 0, 'sbiten charges living members of the active four only');
  eq(en('himeko'), 0, 'sbiten skips the reserve');
  ok(!g.useItem('thermos', 'arlan') && g.state.inv.items.thermos === 1, 'a fallen ally cannot drink the thermos');
  g.state.roster.march.energy = 120;
  ok(!g.useItem('thermos', 'march') && g.state.inv.items.thermos === 1, 'a full bar refuses the thermos');
  g.state.roster.danheng.energy = 95;
  ok(g.useItem('thermos', 'danheng') && en('danheng') === 100, 'energy is capped at the maximum');
  for (const k of ['trail', 'march', 'danheng']) g.state.roster[k].energy = H.CHARS[g.kitOf(k)].energy;
  ok(!g.useItem('sbiten') && g.state.inv.items.sbiten === 1, 'sbiten is refused when every living member is full');
  g.state.roster.trail.energy = 50;
  const spec = g.partySpecs().find(p => p.key === 'trail');
  eq(spec.energy, 50, 'charged energy goes into the next battle');
  eq(JSON.stringify(g.energyOf('march')), JSON.stringify({ cur: 120, max: 120 }), 'energyOf reports current and maximum energy');
  const chestItems = Object.values(H.MAPS).flatMap(m => (m.chests || []).map(c => Object.keys(c.items || {}))).flat();
  ok(['thermos', 'spark', 'sbiten'].every(id => chestItems.includes(id)), 'every energy item can be found in a chest');
}

{
  const g = new H.Game({ seed: 3 });
  const j0 = g.state.jade;
  eq(g.grantDebugJade(), j0 + H.TUNING.debugJade, 'debug jade returns the new total');
  eq(H.TUNING.debugJade, 1600, 'debug grant is 1600 jade');
  ok(g.events.some(e => e.t === 'toast' && /1 600/.test(e.text)), 'debug jade toast');
  const warps = Math.floor(g.state.jade / H.TUNING.warpCost);
  ok(warps >= 10 && g.warp(10), 'debug jade pays for a ten-warp');
}

{
  const g = new H.Game({ seed: 3 });
  eq(g.debugChar('seele', 42, 3), 'new', 'debug grant adds a missing character');
  const r = g.state.roster.seele;
  ok(r.lvl === 42 && r.eid === 3 && r.exp === 0 && r.hp == null, 'debug character gets the chosen level and Eidolon');
  eq(g.debugChar('seele', 99, 9), 'set', 'debug grant on an owned character changes it');
  ok(g.state.roster.seele.lvl === H.MAX_LVL && g.state.roster.seele.eid === 6, 'debug level and Eidolon are clamped');
  eq(g.debugChar('trail_p', 10, 0), 'set', 'the Preservation Trailblazer maps to the Trailblazer entry');
  ok(!g.state.roster.trail_p && g.state.roster.trail.lvl === 10, 'no separate trail_p roster entry');
  eq(g.debugChar('nobody', 1, 0), null, 'unknown characters are refused');
  const cones = g.debugCone('milkyway', 5, 2);
  ok(cones.length === 2 && cones.every(c => c.sup === 5 && c.id === 'milkyway') && cones[0].uid !== cones[1].uid, 'debug cones get the chosen superimposition as separate copies');
  eq(g.debugCone('nothing', 1, 1).length, 0, 'unknown cones are refused');
  const rel = g.debugRelic({ set: 'genius', slot: 'body', main: 'critD', subs: ['critR', 'critD', 'spd', 'atkP', 'hpP', 'spd'], lvl: 15, roll: 1.2 });
  ok(rel && rel.set === 'genius' && rel.slot === 'body' && rel.main === 'critD' && rel.lvl === 15, 'debug relic keeps set, slot, main stat and level');
  eq(rel.subs.map(x => x[0]).join(), 'critR,spd,atkP,hpP', 'debug relic drops the main stat and duplicates from its substats, max four');
  eq(rel.mv, g.relicMain('critD', 15), 'debug relic main value follows the level');
  ok(rel.subs.every(([k, v]) => v === g.relicSub(k, 15, 45, 1.2)), 'debug relic substats use the chosen roll');
  ok(g.relicSub('critR', 15, 45, 1.2) > g.relicSub('critR', 15, 45, 0.8), 'higher rolls give higher substats');
  ok(!g.debugRelic({ set: 'genius', slot: 'head', main: 'critD', subs: [] }), 'a main stat the slot cannot have is refused');
  g.state.roster.seele.relics.body = rel.uid;
  ok(g.charStats('seele').critD > g.baseStats('seele', H.MAX_LVL, 6).critD + 0.5, 'an equipped debug relic adds its stats');
  ok(!g.debugRelic({ set: 'station', slot: 'body', main: 'atkP', subs: [] }) && !g.debugRelic({ set: 'genius', slot: 'sphere', main: 'atkP', subs: [] }), 'planar sets only fit planar slots and cavern sets only cavern slots');
  ok(g.debugRelic({ set: 'vonwacq', slot: 'rope', main: 'err', subs: ['spd'], lvl: 15 }), 'a planar ornament can be granted in the debug menu');
}

{
  const st = H.newState();
  for (const f of ['chaos', 'intro', 'lift', 'arlan_met', 'storm', 'asta_met']) st.flags[f] = true;
  Object.assign(st, { map: 'hs_control', x: null, y: null, hsv: 2 });
  const g = new H.Game({ state: st, seed: 31 });
  const npc = (map, who) => { g.loadMap(map, null, { silent: true }); return g.map.ents.find(e => e.kind === 'npc' && e.def.who === who && g.visible(e)); };
  ok(npc('hs_control', 'asta') && !npc('hs_storage', 'arlan'), 'during the prologue Asta holds the main console and Arlan has left the control center');
  ok(npc('hs_control', 'arlan'), 'Arlan rests in the Master Control Zone when he is not in the team');
  g.loadMap('hs_control', null, { silent: true });
  ride(g, 'hs_base');
  eq(g.map.id, 'hs_control', 'the Base Zone lift stays locked during the attack');
  g.state.flags.doom = true;
  ok(npc('hs_control', 'asta') && !npc('hs_control', 'arlan') && npc('hs_supply', 'arlan'), 'after the attack Asta holds the main console and Arlan guards the Security Department of the Supply Zone');
  g.state.party.push('arlan'); g.state.roster.arlan = g.state.roster.arlan || { lvl: 5, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
  ok(!npc('hs_supply', 'arlan'), 'Arlan leaves his post while he is in the team');
  g.state.party = ['trail'];
  g.loadMap('hs_control', null, { silent: true });
  ride(g, 'hs_base');
  eq(g.map.id, 'hs_base', 'after the attack the lift opens onto the Base Zone');
  eq(g.map.ents.filter(e => e.kind === 'prop' && e.def.obj === 'portrait').length, 6, 'the Genius Society portraits hang in the Base Zone corridor');
  g.loadMap('hs_control', null, { silent: true });
  g.useExit(g.map.ents.find(e => e.kind === 'exit' && e.def.to === 'hs_office'));
  eq(g.map.id, 'hs_office', 'the control zone leads to the office of Herta');
  ok(g.map.ents.some(e => e.kind === 'prop' && e.def.obj === 'su_machine'), 'the office holds the Simulated Universe');
  eq(g.map.ents.filter(e => e.kind === 'prop' && e.def.obj === 'portrait' && /^office_/.test(e.def.script)).length, 6, 'Herta comments on the six Genius Society portraits in her office');
  ok(npc('hs_office', 'herta'), 'Herta\'s puppet waits in her office');
  eq(g.destinations().find(d => d.name === 'Космическая станция «Герта»').map, 'hs_control', 'the Express lands in the Master Control Zone');
  const run = name => { g.runScript(name); let n = 0; while ((g.pending || g.script) && n++ < 200) { if (g.pending) { if (g.pending.type === 'ui') { const p = g.pending; g.resume(); if (p.ui === 'shop') return p.id; } else g.resume(0); } else g.advanceScript(); } return null; };
  g.loadMap('hs_control', null, { silent: true });
  eq(run('shop_robot'), 'robot', 'the cooking robot opens its shop');
  eq(g.state.inv.items.lunch, 2, 'the cooking robot hands out two free business lunches once');
  run('shop_robot');
  eq(g.state.inv.items.lunch, 2, 'there is no second free lunch');
  eq(run('shop_procure'), 'procure', 'Wen Shiqi opens the internal procurement shop');
  ok(g.state.flags.wen_met, 'Wen Shiqi remembers the first talk');
  const list = g.shopList('procure'), ri = list.findIndex(e => e.kind === 'relic');
  ok(ri >= 0 && list[ri].set === 'musketeer' && list[ri].name.includes('Мушкетёр'), 'the procurement shop sells Musketeer relics');
  g.state.credits = 99999;
  const n0 = g.state.inv.relics.length;
  ok(g.buy('procure', ri), 'a relic can be bought');
  const bought = g.state.inv.relics[n0];
  ok(bought && bought.set === 'musketeer' && bought.slot === list[ri].slot && H.CAVERN_SLOTS.find(x => x.key === bought.slot).mains.includes(bought.main), 'the bought relic has the shop set, slot and a fitting main stat');
  g.state.inv.items.friedrice = 1;
  ok(g.useItem('friedrice') && g.state.nextCrit === 0.12, 'cosmic fried rice prepares a crit buff');
  const b = g.startBattle({ enemies: ['reaver:3'], lvl: 3 });
  b.start();
  ok(b.allies[0].buffs.some(x => x.s === 'critR' && x.v === 0.12), 'the next battle starts with the fried rice crit buff');
  eq(g.state.nextCrit, 0, 'the fried rice buff is used up');
  g.battle = null;
  g.loadMap('hs_office', null, { silent: true });
  eq(run('su_terminal'), null, 'the Simulated Universe stays closed without Herta\'s permission');
}

{
  const g = new H.Game({ seed: 21 });
  ok(H.PLANAR_SETS.join() === 'station,vonwacq,salsotto' && H.PLANAR_SLOTS.map(s => s.key).join() === 'sphere,rope', 'three planar sets and two planar slots');
  ok(H.PLANAR_SETS.every(k => { const d = H.RELIC_SETS[k]; return d.pieces.sphere && d.pieces.rope && d.text && d.short && d.cond; }), 'every planar set names both pieces and its condition');
  for (const sl of H.RELIC_SLOTS) for (const m of sl.mains) ok(H.MAIN_VALUE[m] && H.STAT_NAMES[m], 'main stat has a value and a name ' + sl.key + ' ' + m);
  for (let i = 0; i < 300; i++) g.rollRelic(30);
  ok(g.state.inv.relics.every(r => H.CAVERN_SETS.includes(r.set) && H.CAVERN_SLOTS.some(s => s.key === r.slot)), 'cavern drops never roll planar sets or slots');
  g.state.inv.relics = [];
  const got = g.give({ ornament: { set: 'station', n: 2, rl: 6 } });
  ok(got.length === 1 && /Запечатывающая космос станция/.test(got[0]) && /×2/.test(got[0]), 'an ornament gift names the set and the count');
  eq(g.state.inv.relics.filter(r => r.slot === 'sphere').length, 2, 'two sets give two spheres');
  eq(g.state.inv.relics.filter(r => r.slot === 'rope').length, 2, 'two sets give two ropes');
  ok(g.state.inv.relics.every(r => r.set === 'station' && r.lvl === 6 && H.PLANAR_SLOTS.find(s => s.key === r.slot).mains.includes(r.main)), 'ornaments keep the set, the level and a main stat of their slot');
  eq(g.relicName(g.state.inv.relics[0]), H.RELIC_SETS.station.pieces[g.state.inv.relics[0].slot], 'an ornament is named after its piece');
  g.state.roster.seele = { lvl: 40, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
  const base = g.charStats('seele');
  const sph = g.state.inv.relics.find(r => r.slot === 'sphere'), rope = g.state.inv.relics.find(r => r.slot === 'rope');
  g.equipRelic('seele', sph.uid);
  eq(JSON.stringify(g.planarSets('seele')), '{}', 'one planar piece does not make a set');
  g.equipRelic('seele', rope.uid);
  eq(JSON.stringify(g.planarSets('seele')), '{"station":true}', 'sphere and rope of one set activate it');
  const withSet = g.charStats('seele'), pctOf = (rel, k) => (rel.main === k ? rel.mv : 0) + rel.subs.filter(s => s[0] === k).reduce((a, s) => a + s[1], 0);
  const atkP = 0.12 + pctOf(sph, 'atkP') + pctOf(rope, 'atkP'), flat = pctOf(sph, 'atkF') + pctOf(rope, 'atkF');
  eq(withSet.atk, Math.round(g.baseStats('seele', 40, 0).atk * (1 + atkP) + flat), 'the station set adds 12% ATK outside battle');
  ok(withSet.atk > base.atk, 'the set raises ATK on the character screen');
  eq(g.partySpecs().length >= 1 && JSON.stringify(g.partySpecs().find(p => p.key === 'trail').sets), '{}', 'battle specs carry the planar sets of each character');
  g.state.party = ['seele'];
  ok(g.partySpecs()[0].sets.station, 'the wearer brings the station set into battle');
  g.autoEquip('seele');
  ok(g.state.roster.seele.relics.sphere && g.state.roster.seele.relics.rope, 'auto equip fills the planar slots');
  const spec = (spd, sets) => ({ charId: 'seele', key: 'seele', lvl: 40, stats: Object.assign(g.baseStats('seele', 40, 0), { spd, critR: 0.55 }), hp: null, energy: 0, sets });
  const fight = (spd, sets) => new H.Battle({ party: [spec(spd, sets)], enemies: ['reaver:30'], seed: 9, lvl: 30 });
  const fast = fight(125, { station: true }), slow = fight(115, { station: true }), none = fight(125, {});
  const atkOf = H.battleStat.atkOf;
  ok(Math.abs(atkOf(fast.allies[0]) / atkOf(none.allies[0]) - 1.12) < 1e-9, 'the station set gives +12% ATK in battle at SPD 120 or more');
  eq(atkOf(slow.allies[0]), atkOf(fight(115, {}).allies[0]), 'below SPD 120 the station set adds nothing in battle');
  slow.allies[0].buffs.push({ s: 'spd', v: 10, turns: 2, name: 'test' });
  ok(atkOf(slow.allies[0]) > atkOf(fight(115, {}).allies[0]), 'a SPD buff in battle switches the station bonus on');
  const v2 = fight(125, { vonwacq: true }), avBase = H.TUNING.avBase / 125;
  v2.allies[0].av = avBase;
  v2.advance(v2.allies[0], 0.4);
  ok(Math.abs(v2.allies[0].av - avBase * 0.6) < 1e-9, 'a 40% advance leaves 60% of the action value');
  const vs = fight(115, { vonwacq: true });
  const evS = vs.start();
  ok(!evS.some(e => e.t === 'status' && /Вонвак/.test(e.text)), 'below SPD 120 the Vonwacq set does not advance');
  ok(fight(125, { vonwacq: true }).start().some(e => e.t === 'status' && /Вонвак/.test(e.text)), 'at SPD 120 or more the Vonwacq set advances the first turn and says so');
  const sa = fight(125, { salsotto: true }), sn = fight(125, {});
  const foe = sa.enemies[0];
  const dmgS = sa.dmgCalc(sa.allies[0], foe, 2, { kind: 'ult' }, false), dmgN = sn.dmgCalc(sn.allies[0], sn.enemies[0], 2, { kind: 'ult' }, false);
  ok(dmgS > dmgN, 'the Salsotto set raises Ultimate DMG at CRIT Rate 50% or more');
  ok(sa.dmgCalc(sa.allies[0], foe, 1, { kind: 'follow' }, false) > sn.dmgCalc(sn.allies[0], sn.enemies[0], 1, { kind: 'follow' }, false), 'the Salsotto set raises follow-up DMG');
  eq(sa.dmgCalc(sa.allies[0], foe, 1, { kind: 'basic' }, false), sn.dmgCalc(sn.allies[0], sn.enemies[0], 1, { kind: 'basic' }, false), 'the Salsotto set leaves basic attacks alone');
  sa.allies[0].base.critR = 0.3;
  eq(sa.dmgCalc(sa.allies[0], foe, 2, { kind: 'ult' }, false), sn.dmgCalc(Object.assign(sn.allies[0], { base: Object.assign(sn.allies[0].base, { critR: 0.3 }) }), sn.enemies[0], 2, { kind: 'ult' }, false), 'below CRIT Rate 50% the Salsotto bonus is off');
}

{
  const g = new H.Game({ seed: 3 });
  g.state.jade = 1e7;
  g.state.pity.five = H.TUNING.pity5 - 1;
  let r = g.warp(1)[0], e = g.state.warpLog[0];
  ok(r.rar === 5 && e.rar === 5 && e.pity === H.TUNING.pity5, '5★ at hard pity is logged at ' + H.TUNING.pity5 + '/' + H.TUNING.pity5);
  g.state.pity.four = H.TUNING.pity4 - 1; g.state.pity.five = 0;
  r = g.warp(1)[0]; e = g.state.warpLog[0];
  ok(e.rar >= 4 && e.pity === (e.rar === 5 ? 1 : H.TUNING.pity4), '4★ at pity is logged with its counter');
  const b0 = g.state.warpBatch;
  g.warp(1); g.warp(10);
  ok(g.state.warpBatch === b0 + 2 && g.state.warpLog[0].batch === b0 + 2 && g.state.warpLog[10].batch === b0 + 1, 'each warp gets its own batch');
  const st = g.warpStats();
  ok(st.total === 13 && st.five === g.state.warpLog.filter(x => x.rar === 5).length && st.last5 && st.last5.rar === 5, 'warp stats count pulls and the last 5★');
  for (let i = 0; i < 105; i++) g.warp(10);
  ok(g.state.warpLog.length === 1000 && g.state.warpN === 1063 && g.state.warpLog[0].n === 1063, 'history keeps the newest 1000 pulls and the full count');
  const old = H.newState();
  old.warpLog = ['Броня ★★★★★', 'Стрелы ★★★', 'Неизвестно ★★★', 'Отдых гениев ★★★★'];
  const m = new H.Game({ state: old }), ml = m.state.warpLog;
  ok(ml.length === 3 && ml[0].id === 'bronya' && ml[0].kind === 'char' && ml[0].rar === 5 && ml[1].id === 'arrows' && ml[2].id === 'geniuses', 'old text history is converted to entries');
  ok(ml.map(x => x.n).join() === '3,2,1' && m.state.warpN === 3 && ml.every(x => x.at === 0), 'converted entries are numbered from the oldest');
  const again = new H.Game({ state: m.serialize() });
  ok(again.state.warpLog.length === 3 && again.state.warpN === 3, 'converted history survives a save and load');
}

{
  const CH = H.CHAT, flags = new Set(['su_beta_done']);
  for (const steps of Object.values(H.SCRIPTS)) for (const st of steps) if (st && st.flag) flags.add(st.flag);
  const ids = new Set();
  const paths = steps => {
    let out = [[]];
    for (const st of steps) {
      if (st && st.pick) {
        ok(st.pick.length >= 1 && st.pick.length <= 3, 'a reply menu has one to three answers');
        const next = [];
        st.pick.forEach((o, i) => { for (const tail of paths(o.slice(1))) for (const head of out) next.push(head.concat([i], tail)); });
        out = next;
      }
    }
    return out;
  };
  for (const def of CH.THREADS) {
    ok(!ids.has(def.id), 'thread id is unique ' + def.id); ids.add(def.id);
    ok(CH.CONTACTS[def.who] && H.SPEAKERS[def.who], 'thread contact has a signature and a speaker ' + def.id);
    ok(String(def.need).split(/[|&]/).every(f => flags.has(f.replace('!', ''))), 'thread condition uses real story flags ' + def.id);
    for (const picks of paths(def.steps)) {
      const tg = new H.Game({ seed: 1 });
      tg.state.chats = { th: { [def.id]: { at: 0, k: 1, n: 999, picks } }, seq: 1, day: null };
      const v = tg.chatView(def.id);
      ok(!v.wait && v.lines.length >= 3, 'every answer path reaches the end ' + def.id + ' ' + picks.join(''));
      for (const l of v.lines) {
        if (l.text) {
          ok(!/[—–]/.test(l.text) && !/[{}]/.test(l.text) && l.text.length <= 170, 'message text is clean ' + def.id + ': ' + l.text.slice(0, 30));
          ok(l.who === '@' || CH.CONTACTS[l.who], 'message speaker is in the chat ' + def.id);
        }
        if (l.sticker) ok(CH.STICKERS[l.sticker], 'sticker exists ' + l.sticker);
        if (l.photo) ok(CH.PHOTOS[l.photo], 'photo exists ' + l.photo);
        if (l.quest) ok(H.QUESTS[l.quest], 'message quest exists ' + l.quest);
      }
      ok(!def.daily || v.lines[v.lines.length - 1].give === CH.DAILY_GIVE, 'a daily thread ends with its reward ' + def.id);
    }
  }
  for (const [id, st] of Object.entries(CH.STICKERS)) ok(H.SPEAKERS[st.who] && st.cap, 'sticker has a face and a caption ' + id);
  for (const [id, p] of Object.entries(CH.PHOTOS)) ok(H.Cine === undefined || H.Cine.STILLS[p.bg], 'photo backdrop exists ' + id);

  let now = new Date(2026, 9, 8, 12, 0).getTime();
  const g = new H.Game({ seed: 5, clock: () => now });
  ok(!g.chatSync().length && !g.chatContacts().length && !g.alerts().chat, 'nobody writes before the Express');
  g.state.flags.express_intro = true;
  g.events.length = 0;
  const first = g.chatSync();
  ok(first.includes('march_hello') && first.includes('herta_test') && first.includes('d_arlan_wounds'), 'March, Herta and the first daily message arrive with the Express');
  ok(g.events.some(e => e.t === 'chat' && e.ids.length === first.length), 'new threads raise one notice event');
  ok(!g.chatThread('d_march_pompom'), 'a daily message skips a contact who still has an open thread');
  ok(g.alerts().chat && g.chatContacts().every(c => c.open), 'open threads light the Messages alert');
  eq(g.chatSync().length, 0, 'the same threads do not arrive twice');
  const v0 = g.chatView('herta_test');
  ok(v0.n === 0 && v0.next.who === 'herta' && !v0.wait, 'a new thread starts unread');
  g.chatNext('herta_test'); g.chatNext('herta_test');
  const v1 = g.chatView('herta_test');
  ok(v1.wait && v1.wait.length === 2 && !v1.next, 'the thread stops at the first reply menu');
  ok(!g.chatNext('herta_test') && !g.chatPick('herta_test', 5), 'nothing moves without a valid answer');
  ok(g.chatPick('herta_test', 1), 'an answer is taken');
  const v2 = g.chatView('herta_test');
  ok(v2.next.who === '@' && v2.next.text === 'А что мне за это будет?', 'the answer is posted as the Trailblazer\'s message');
  g.chatNext('herta_test');
  eq(g.chatView('herta_test').next.text, 'Награда. Какая, решу по результатам.', 'Herta answers the chosen question');
  let guard = 0;
  while (!g.chatThread('herta_test').done && guard++ < 50) { const v = g.chatView('herta_test'); if (v.wait) g.chatPick('herta_test', v.wait.length - 1); else g.chatNext('herta_test'); }
  ok(g.chatThread('herta_test').done && g.state.quests.su_beta === 'talk', 'the finished thread gives the Simulated Universe quest');
  ok(g.chatView('herta_test').lines.some(l => l.text === 'Прошу. Приходи тестировать.'), 'the teasing answer makes Herta ask nicely');
  const jade = g.state.jade;
  g.chatAuto('d_arlan_wounds');
  eq(g.state.jade, jade + CH.DAILY_GIVE.jade, 'a daily thread pays its jade once it ends');
  eq(g.chatSync().length, 0, 'one daily message a day');
  now = new Date(2026, 9, 9, 3, 30).getTime();
  eq(g.chatSync().length, 0, 'before 04:00 it is still the old day');
  now = new Date(2026, 9, 9, 4, 10).getTime();
  ok(g.chatSync().includes('d_pompom_rules'), 'the next day brings the next daily message');
  g.state.flags.ending = true; g.state.flags.jarilo_arrive = true;
  ok(!g.chatSync().includes('march_album'), 'a later thread waits until the contact\'s earlier one is read');
  g.chatAuto('march_hello');
  ok(g.chatSync().includes('march_album'), 'then the next thread from the same contact arrives');
  eq(g.chatContacts()[0].who, 'march', 'the contact with the newest open thread is on top');
  ok(g.chatView('march_album').def.steps.some(st => st.photo === 'monument'), 'March sends the monument photo');
  const fem = new H.Game({ seed: 5, clock: () => now });
  Object.assign(fem.state, { gender: 'f', name: 'Стелла' });
  fem.state.flags.express_intro = true; fem.state.flags.moles = true; fem.state.flags.underworld = true;
  fem.chatSync();
  ok(fem.chatView('natasha_check').next.text.includes('проспала сутки, а потом сразу ушла'), 'messages pick gender forms');
  const back = new H.Game({ state: g.serialize(), clock: () => now });
  ok(back.chatThread('herta_test').done && back.chatThread('march_album') && !back.chatThread('march_album').done, 'threads survive a save');

  const old = H.newState();
  old.flags.express_intro = true;
  old.mail.herta_test = { at: 1, read: true };
  old.quests.su_beta = 'enter';
  const og = new H.Game({ state: old, clock: () => now });
  og.events.length = 0;
  const arrived = og.chatSync();
  ok(og.chatThread('herta_test').done && !arrived.includes('herta_test'), 'an old save that read Herta\'s letter gets the thread as already read');
  eq(og.state.quests.su_beta, 'enter', 'the old quest step stays');
  const old2 = H.newState();
  old2.flags.express_intro = true;
  old2.mail.herta_test = { at: 1 };
  const og2 = new H.Game({ state: old2, clock: () => now });
  ok(og2.chatSync().includes('herta_test') && !og2.state.quests.su_beta, 'an unread old letter arrives as a new message');
}

{
  const DAY = 86400000;
  let now = new Date(2026, 8, 29, 12, 0).getTime();
  const g = new H.Game({ seed: 4, clock: () => now });
  const ver = H.MAIL.filter(m => !m.need);
  eq(g.mailbox().length, ver.length, 'a new game gets the version letters');
  ok(ver.length === 5 && ver.every(m => m.give.jade === 300), 'five version letters with 300 jade each');
  ok(H.MAIL.find(m => m.id === 'v14_fours').give.items.pass === 10, 'the 1.4 letter brings ten Star Rail Passes');
  ok(H.MAIL.find(m => m.id === 'v13_signal').give.items.tape === 10, 'the 1.3 letter brings ten Encrypted Master Tapes');
  ok(H.MAIL.find(m => m.id === 'v13_signal').give.items.mana === 10, 'the 1.3 letter brings ten manatites for the Guild');
  ok(!H.MAIL.some(m => ['herta_test', 'v13_su', 'v14_chat'].includes(m.id)), 'Herta\'s invitation and the 1.3 and 1.4 letters are gone from the mail');
  ok(!g.chatThread('herta_test') && !g.alerts().chat, 'Herta\'s message waits for the Express');
  ok(g.alerts().mail && !g.alerts().events, 'unread letters light the mail alert, events stay dark');
  ok(!g.eventsOpen() && g.cometTick().days === 0 && !g.willReady(0), 'events are closed before the Express');
  g.state.flags.express_intro = true;
  ok(g.alerts().chat && g.chatThread('herta_test') && g.chatThread('march_hello'), 'Herta and March write after the Express introduction');
  eq(g.cometTick().days, 1, 'the first login day counts when the events open');
  ok(g.cometReady(0) && !g.cometReady(1) && g.alerts().events, 'only day 1 is ready on the first day');
  const sp0 = g.state.inv.items.spass || 0;
  ok(g.claimComet(0) && g.state.inv.items.spass === sp0 + 1, 'day 1 gives one Special Pass');
  ok(!g.claimComet(0) && !g.claimComet(1), 'a claimed or closed day gives nothing');
  now += 3 * 3600000;
  eq(g.cometTick().days, 1, 'a later login on the same day does not count');
  now = new Date(2026, 8, 30, 3, 30).getTime();
  eq(g.cometTick().days, 1, 'before 04:00 it is still the old day');
  ok(g.nextDay() === new Date(2026, 8, 30, 4, 0).getTime(), 'the next day starts at 04:00');
  now = new Date(2026, 8, 30, 4, 10).getTime();
  eq(g.cometTick().days, 2, 'after 04:00 a new login day opens the next gift');
  now += 5 * DAY;
  eq(g.cometTick().days, 3, 'missed days do not burn: one login counts one day');
  for (let d = 0; d < 6; d++) { now += DAY; g.cometTick(); }
  eq(g.state.comet.days, 7, 'the gift stops at seven days');
  const got = g.claimEvent('comet');
  eq(H.COMET_GIFT.reduce((a, b) => a + b, 0), 10, 'Comet Gift totals ten Special Passes');
  ok(got.length === 6 && g.state.inv.items.spass === sp0 + 10 && !g.eventReady('comet'), 'claiming the rest gives ten passes in total');
  g.state.roster.trail.lvl = 4;
  ok(!g.eventReady('will') && !g.claimWill(0), "Trailblazer's Will gives nothing below level 5");
  g.state.roster.trail.lvl = 16;
  const p0 = g.state.inv.items.pass || 0;
  eq(g.claimEvent('will').length, 2, 'levels 5 and 15 are claimed together');
  ok(g.state.inv.items.pass === p0 + 20 && !g.willReady(2), 'each station gives ten passes, level 25 waits');
  g.state.roster.trail.lvl = 35;
  const j0 = g.state.jade;
  g.claimWill(2); g.claimWill(3);
  ok(g.state.inv.items.pass === p0 + 40 && g.state.jade === j0 + 1600, 'levels 25 and 35 add ten passes and 800 jade each');
  ok(!g.alerts().events, 'nothing left to claim clears the events alert');
  const jm = g.state.jade, first = g.mailbox().find(x => x.m.give).m.id;
  g.readMail(first);
  eq(g.deleteReadMail(), 0, 'a read letter with an unclaimed gift is kept');
  ok(g.claimMail(first) && g.state.jade === jm + 300 && !g.claimMail(first), 'a version letter gives 300 jade once');
  ok(!g.state.quests.su_beta, 'the Simulated Universe quest waits for Herta\'s message');
  g.chatAuto('herta_test');
  eq(g.state.quests.su_beta, 'talk', 'Herta\'s message starts «Виртуальная вселенная: Первичный тест»');
  ok(g.claimAllMail().length === 10 && g.state.jade === jm + 1500 && !g.alerts().mail, 'claim all takes the other letters and clears the alert');
  eq(g.deleteReadMail(), 5, 'read and claimed letters can be deleted');
  eq(g.mailbox().length, 0, 'the mailbox is empty after deleting');
  const back = new H.Game({ state: g.serialize(), clock: () => now });
  ok(!back.mailbox().length && back.state.comet.days === 7 && back.state.will.length === 4, 'events and mail survive a save');
  const legacy = H.newState();
  for (const k of ['mail', 'comet', 'will', 'pityEv', 'warpNEv']) delete legacy[k];
  const lg = new H.Game({ state: legacy });
  ok(lg.mailbox().length === H.MAIL.filter(m => !m.need).length && lg.state.comet.days === 0 && lg.state.pityEv.five === 0, 'old saves get the letters and empty event state');
}

{
  const g = new H.Game({ seed: 8 }), B = g.bannerOf('ev');
  eq(g.evStar(), 'ruanmei', 'the event banner starts on Ruan Mei');
  ok(B.five === 'ruanmei' && B.four.join() === 'xueyi,sushang,asta', 'Ruan Mei brings Xueyi, Sushang and Asta');
  g.state.jade = 1e6;
  g.state.inv.items.spass = 3;
  eq(g.defaultBanner(), 'ev', 'Special Passes open the event banner first');
  ok(g.warp(10, 'ev') && !g.state.inv.items.spass && g.state.jade === 1e6 - 7 * H.TUNING.warpCost, 'the event warp spends Special Passes, then jade');
  ok(g.state.pity.five === 0 && g.state.pity.four === 0 && g.state.pityEv.four >= 0, 'event pulls leave the standard pity alone');
  ok(g.state.warpLog.slice(0, 10).every(e => e.ban === 'ev') && g.state.warpNEv === 10, 'event pulls are marked in the history');
  const picks = [];
  for (let i = 0; i < 30; i++) picks.push(...g.warp(10, 'ev'));
  const f5 = picks.filter(x => x.rar === 5), f4 = picks.filter(x => x.rar === 4);
  ok(f5.length >= 3 && f5.every(x => x.id === B.five), 'every event 5★ is Ruan Mei, no 50/50 (' + f5.length + ')');
  ok(g.state.warpLog.filter(e => e.ban === 'ev').every(e => e.star === 'ruanmei'), 'event log entries remember the chosen hero');
  ok(f4.length > 20 && f4.every(x => x.kind === 'char' && (B.four.includes(x.id) || x.cameo)), 'every event 4★ is one of the featured characters');
  ok(g.state.roster.ruanmei && g.state.roster.ruanmei.eid === Math.min(6, f5.length - 1), 'duplicates of Ruan Mei raise her Eidolons');
  g.state.pityEv.five = H.TUNING.pity5 - 1;
  eq(g.warp(1, 'ev')[0].id, 'ruanmei', 'event hard pity gives Ruan Mei');
  ok(g.warpStats('ev').total === g.state.warpNEv && g.warpStats('std').total === g.state.warpN - g.state.warpNEv && g.warpStats().total === g.state.warpN, 'banner totals split the pull count');
  g.state.inv.items.pass = 1;
  eq(g.defaultBanner(), 'std', 'standard passes alone open the standard banner');
  ok(g.warp(1, 'std') && !g.state.inv.items.pass && !g.state.warpLog[0].ban, 'the standard warp spends a standard pass');
  ok(!Object.values(H.WARP_POOL).some(p => p.includes('ruanmei')), 'Ruan Mei drops only from the event banner');
  ok(!Object.values(H.WARP_POOL).some(p => p.includes('seele')) && !H.BANNERS.std.featured.includes('seele'), 'Seele left the standard banner');
  ok(['bailu', 'yanqing', 'clara'].every(id => H.WARP_POOL.five.includes(id) && H.BANNERS.std.featured.includes(id)), 'Bailu, Yanqing and Clara joined the standard banner');
  ok(!g.setEvStar('himeko') && g.evStar() === 'ruanmei', 'only event heroes can be chosen');
  const before = g.state.pityEv.five;
  ok(g.setEvStar('seele') && g.evStar() === 'seele', 'the player picks Seele for the event banner');
  eq(g.state.pityEv.five, before, 'switching heroes keeps the shared event pity');
  const sp = [];
  for (let i = 0; i < 30; i++) sp.push(...g.warp(10, 'ev'));
  const s5 = sp.filter(x => x.rar === 5), s4 = sp.filter(x => x.rar === 4);
  ok(s5.length >= 3 && s5.every(x => x.id === 'seele'), 'every 5★ on the Seele banner is Seele (' + s5.length + ')');
  ok(s4.length > 20 && s4.every(x => ['hanya', 'yukong', 'pela'].includes(x.id) || x.cameo), 'Seele brings Hanya, Yukong and Pela as 4★');
  ok(g.state.warpLog[0].ban === 'ev' && g.state.warpLog[0].star === 'seele', 'the log marks Seele pulls');
  const back = new H.Game({ state: g.serialize() });
  eq(back.evStar(), 'seele', 'the chosen event hero survives a save');
  const old = H.newState(); delete old.evStar;
  eq(new H.Game({ state: old }).evStar(), 'ruanmei', 'old saves default to Ruan Mei');
}

{
  const g = new H.Game({ seed: 12 }), T = H.TUNING, BC = H.BANNERS.cone;
  ok(Object.keys(BC.stars).every(id => H.BANNERS.ev.stars[id]), 'every event hero has a Light Cone banner');
  for (const [id, st] of Object.entries(BC.stars)) {
    const cd = H.CONES[st.cone];
    ok(cd && cd.rarity === 5 && cd.sig === id && cd.path === H.CHARS[id].path && cd.fx, 'signature cone of ' + id + ' matches the Path');
    ok(st.four.length === 3 && st.four.every(x => x.startsWith('cone:') && H.CONES[x.slice(5)].rarity === 4), 'three featured 4★ cones for ' + id);
    ok(!Object.values(H.WARP_POOL).some(pl => pl.includes('cone:' + st.cone)), 'the signature cone ' + st.cone + ' is not in the standard pool');
  }
  g.state.jade = 1e7;
  eq(g.coneStar(), 'ruanmei', 'the cone banner starts on Ruan Mei\'s cone');
  ok(g.setConeStar('seele') && g.coneStar() === 'seele' && g.evStar() === 'ruanmei', 'the cone choice is separate from the hero choice');
  ok(!g.setConeStar('himeko'), 'only event heroes have cone banners');
  g.state.inv.items.spass = 2;
  g.state.warpBan = 'cone';
  eq(g.defaultBanner(), 'cone', 'Special Passes reopen the cone banner when it was the last one');
  const ev0 = { ...g.state.pityEv }, std0 = { ...g.state.pity };
  const all = [];
  for (let i = 0; i < 80; i++) all.push(...g.warp(10, 'cone'));
  ok(!g.state.inv.items.spass, 'the cone banner spends Special Passes first');
  ok(g.state.pityEv.five === ev0.five && g.state.pity.five === std0.five, 'cone pulls leave the hero and standard pity alone');
  const f5 = all.filter(x => x.rar === 5), hit5 = f5.filter(x => x.id === 'night');
  ok(f5.length >= 12 && f5.every(x => x.kind === 'cone'), 'every 5★ from the cone banner is a Light Cone (' + f5.length + ')');
  ok(hit5.length > f5.length * 0.6 && hit5.length < f5.length, 'most 5★ are the signature cone, some miss (' + hit5.length + '/' + f5.length + ')');
  let guarOk = true;
  for (let i = 0; i < f5.length - 1; i++) if (f5[i].off && f5[i + 1].id !== 'night') guarOk = false;
  ok(guarOk, 'after a missed 5★ the next 5★ is the signature cone');
  const f4 = all.filter(x => x.rar === 4), feat4 = f4.filter(x => BC.stars.seele.four.includes(x.pick));
  ok(feat4.length > f4.length * 0.7 && feat4.length < f4.length, 'most 4★ are the featured cones (' + feat4.length + '/' + f4.length + ')');
  const logC = g.state.warpLog.filter(e => e.ban === 'cone');
  ok(logC.length === Math.min(800, g.state.warpLog.length) && logC.every(e => e.star === 'seele'), 'cone pulls are marked in the history');
  ok(logC.filter(e => e.rar === 5).every(e => e.pity <= T.conePity5), 'the cone 5★ pity is ' + T.conePity5);
  ok(logC.some(e => e.off) && logC.filter(e => e.off).every(e => e.rar >= 4), 'misses are marked in the log');
  eq(g.warpStats('cone').total, g.state.warpNCone, 'cone banner total');
  ok(g.warpStats('std').total === g.state.warpN - g.state.warpNEv - g.state.warpNCone, 'standard total excludes cone pulls');
  g.state.pityCone.five = T.conePity5 - 1; g.state.pityCone.guar5 = true;
  const r = g.warp(1, 'cone')[0];
  ok(r.rar === 5 && r.id === 'night' && !g.state.pityCone.guar5, 'hard pity with the guarantee gives the signature cone');
  const back = new H.Game({ state: g.serialize() });
  ok(back.coneStar() === 'seele' && back.state.warpNCone === g.state.warpNCone, 'cone banner state survives a save');
  const old = H.newState(); delete old.pityCone; delete old.coneStar; delete old.warpNCone;
  const og = new H.Game({ state: old });
  ok(og.coneStar() === 'ruanmei' && og.state.pityCone.five === 0 && og.state.warpNCone === 0, 'old saves get an empty cone banner state');
}

{
  const g = new H.Game({ seed: 21 }), T = H.TUNING, BV = H.BANNERS.conv, BF = H.BANNERS.forge;
  ok(BV.pass === 'rtide' && BF.pass === 'ftide' && H.ITEMS.rtide && H.ITEMS.ftide, 'the Convene banners take Radiant and Forging Tides');
  ok(Object.keys(BV.stars).join() === 'phrolova,scar' && Object.keys(BF.stars).join() === 'phrolova,scar', 'Phrolova and Scar lead both Convene channels');
  ok(['phrolova', 'scar'].every(id => !Object.values(H.WARP_POOL).some(p => p.includes(id))), 'the resonators drop only from their own banner');
  for (const [id, st] of Object.entries(BF.stars)) {
    const cd = H.CONES[st.cone];
    ok(cd && cd.rarity === 5 && cd.sig === id && cd.path === H.CHARS[id].path, 'the forge cone of ' + id + ' matches the Path');
    ok(!Object.values(H.WARP_POOL).some(p => p.includes('cone:' + st.cone)), 'the forge cone ' + st.cone + ' is not in the standard pool');
  }
  g.state.jade = 1e7;
  g.state.inv.items.rtide = 3;
  eq(g.defaultBanner(), 'conv', 'Radiant Tides open the resonator Convene');
  const std0 = { ...g.state.pity }, sig0 = { ...g.state.pitySig }, pv = [];
  for (let i = 0; i < 60; i++) pv.push(...g.warp(10, 'conv'));
  ok(!g.state.inv.items.rtide, 'the Convene spends Radiant Tides first');
  ok(g.state.pity.five === std0.five && g.state.pitySig.five === sig0.five, 'Convene pulls leave the other pity counters alone');
  const v5 = pv.filter(x => x.rar === 5), hit = v5.filter(x => x.id === 'phrolova');
  ok(v5.length >= 8 && v5.every(x => x.kind === 'char'), 'every 5★ from the resonator Convene is a character (' + v5.length + ')');
  ok(hit.length >= v5.length * 0.5 && hit.length < v5.length, 'half or more of the 5★ are Phrolova, some miss (' + hit.length + '/' + v5.length + ')');
  let guar = true;
  for (let i = 0; i < v5.length - 1; i++) if (v5[i].off && v5[i + 1].id !== 'phrolova') guar = false;
  ok(guar, 'after a missed 5★ the next 5★ is Phrolova');
  const logV = g.state.warpLog.filter(e => e.ban === 'conv');
  ok(logV.filter(e => e.rar === 5).every(e => e.pity <= T.pity5), 'the Convene hard pity is ' + T.pity5);
  ok(logV.every(e => e.star === 'phrolova') && g.warpStats('conv').total === g.state.warpNConv, 'Convene pulls are marked in the history');
  const v4 = pv.filter(x => x.rar === 4), feat4 = v4.filter(x => BV.stars.phrolova.four.includes(x.pick));
  ok(feat4.length > v4.length * 0.35 && feat4.length < v4.length, 'about half of the 4★ are Serval, Natasha and Herta (' + feat4.length + '/' + v4.length + ')');
  ok(g.setStarOf('conv', 'scar') && g.starOf('conv') === 'scar' && g.starOf('forge') === 'phrolova', 'the resonator and forge choices are separate');
  g.state.pityConv.five = T.pity5 - 1; g.state.pityConv.guar5 = true;
  const r = g.warp(1, 'conv')[0];
  ok(r.rar === 5 && r.id === 'scar' && !g.state.pityConv.guar5, 'hard pity with the guarantee gives Scar');
  g.state.inv.items.ftide = 2;
  g.state.warpBan = 'forge';
  eq(g.defaultBanner(), 'forge', 'Forging Tides reopen the forge when it was the last banner');
  const pf = [];
  for (let i = 0; i < 40; i++) pf.push(...g.warp(10, 'forge'));
  ok(!g.state.inv.items.ftide, 'the forge spends Forging Tides first');
  const f5 = pf.filter(x => x.rar === 5);
  ok(f5.length >= 6 && f5.every(x => x.kind === 'cone' && x.id === 'lethe'), 'every 5★ from the forge is Lethean Elegy (' + f5.length + ')');
  ok(g.state.warpLog.filter(e => e.ban === 'forge' && e.rar === 5).every(e => e.pity <= T.conePity5 && !e.off), 'the forge 5★ pity is ' + T.conePity5 + ' and never misses');
  const back = new H.Game({ state: g.serialize() });
  ok(back.starOf('conv') === 'scar' && back.state.warpNConv === g.state.warpNConv && back.state.warpNForge === g.state.warpNForge, 'Convene state survives a save');
  const old = H.newState(); delete old.pityConv; delete old.pityForge; delete old.convStar; delete old.forgeStar; delete old.warpNConv; delete old.warpNForge;
  const og = new H.Game({ state: old });
  ok(og.starOf('conv') === 'phrolova' && og.state.pityConv.five === 0 && og.state.warpNForge === 0, 'old saves get an empty Convene state');
}

{
  const g = new H.Game({ seed: 33 }), T = H.TUNING, BG = H.BANNERS.guild;
  ok(BG.pass === 'mana' && H.ITEMS.mana && H.ITEMS.mana.kind === 'key', 'the Guild takes manatites of the highest quality');
  eq(Object.keys(BG.stars).join(), 'aqua,megumin,darkness', 'Aqua, Megumin and Darkness lead the recruitment');
  ok(Object.values(BG.stars).every(st => st.four.length === 1 && st.four[0] === 'kazuma' && st.poster && st.title.length === 2), 'Kazuma is the only featured 4★ and every heroine has a poster');
  ok(['kazuma', 'aqua', 'megumin', 'darkness'].every(id => !Object.values(H.WARP_POOL).some(p => p.includes(id))), 'the KonoSuba party drops only from the Guild');
  g.state.jade = 1e7;
  g.state.inv.items.mana = 3;
  eq(g.defaultBanner(), 'guild', 'manatites open the Guild');
  eq(g.starOf('guild'), 'aqua', 'the Guild starts on Aqua');
  const std0 = { ...g.state.pity }, conv0 = { ...g.state.pityConv }, pulls = [];
  for (let i = 0; i < 60; i++) pulls.push(...g.warp(10, 'guild'));
  ok(!g.state.inv.items.mana, 'the Guild spends manatites first');
  ok(g.state.pity.five === std0.five && g.state.pityConv.five === conv0.five, 'Guild pulls leave the other pity counters alone');
  const g5 = pulls.filter(x => x.rar === 5), hit = g5.filter(x => x.id === 'aqua');
  const std5 = H.WARP_POOL.five.filter(p => !p.startsWith('cone:')), partyMiss = g5.filter(x => x.off && BG.stars[x.id]), stdMiss = g5.filter(x => x.off && std5.includes(x.id));
  ok(g5.length >= 8 && g5.every(x => x.kind === 'char' && (BG.stars[x.id] || std5.includes(x.id))), 'every Guild 5★ is a heroine or a standard 5★ character (' + g5.length + ')');
  ok(hit.length >= g5.length * 0.5 && hit.length < g5.length, 'half or more are Aqua (' + hit.length + '/' + g5.length + ')');
  ok(partyMiss.length && stdMiss.length && partyMiss.length + stdMiss.length === g5.filter(x => x.off).length, 'a miss gives another heroine or a standard 5★ (' + partyMiss.length + ' / ' + stdMiss.length + ')');
  {
    const gm = new H.Game({ seed: 77 }), tally = { feat: 0, party: 0, std: 0 };
    for (let i = 0; i < 4000; i++) { gm.state.pityGuild.guar5 = false; const { pick } = gm.partyPick(gm.state.pityGuild, gm.bannerOf('guild')); if (pick === gm.starOf('guild')) tally.feat++; else if (BG.stars[pick]) tally.party++; else tally.std++; }
    ok([['feat', 0.5], ['party', 0.25], ['std', 0.25]].every(([k, v]) => Math.abs(tally[k] / 4000 - v) < 0.03), 'the Guild 5★ split is 50 / 25 / 25 (' + tally.feat + ' / ' + tally.party + ' / ' + tally.std + ')');
  }
  let guar = true;
  for (let i = 0; i < g5.length - 1; i++) if (g5[i].off && g5[i + 1].id !== 'aqua') guar = false;
  ok(guar && g5.filter(x => x.off).every(x => x.id !== 'aqua'), 'any miss makes the next 5★ Aqua');
  const g4 = pulls.filter(x => x.rar === 4), kz = g4.filter(x => x.id === 'kazuma');
  ok(kz.length > g4.length * 0.4 && kz.length < g4.length, 'about half of the 4★ are Kazuma (' + kz.length + '/' + g4.length + ')');
  let guar4 = true;
  for (let i = 0; i < g4.length - 1; i++) if (g4[i].off && g4[i + 1].id !== 'kazuma') guar4 = false;
  ok(guar4, 'a missed 4★ makes the next 4★ Kazuma');
  ok(!pulls.some(x => x.cameo), 'the Guild has no Kazuma cameo roll');
  {
    const gk = new H.Game({ seed: 91 }), tally = {};
    gk.state.jade = 1e9;
    for (const ban of ['std', 'ev', 'cone', 'sig', 'amp', 'conv', 'forge']) {
      const all = [];
      for (let i = 0; i < 300; i++) all.push(...gk.warp(10, ban));
      const f4 = all.filter(x => x.rar === 4), cam = f4.filter(x => x.cameo);
      tally[ban] = [cam.length, f4.length];
      ok(cam.every(x => x.id === 'kazuma' && x.kind === 'char') && all.filter(x => x.cameo).every(x => x.rar === 4), ban + ': a cameo is always a 4★ Kazuma');
    }
    const cams = Object.values(tally).reduce((a, x) => a + x[0], 0), fours = Object.values(tally).reduce((a, x) => a + x[1], 0);
    ok(cams > fours * 0.005 && cams < fours * 0.02, 'about 1% of 4★ on the other banners are Kazuma (' + cams + '/' + fours + ')');
    ok(gk.state.warpLog.some(e => e.cameo && e.id === 'kazuma'), 'the history marks Kazuma cameos');
    const gp = new H.Game({ seed: 3 }), pity = { five: 0, four: 0, guar4: true }, Bv = gp.bannerOf('ev');
    gp.rng = () => 0;
    const r4 = gp.warpPick(4, Bv, pity);
    ok(r4.pick === 'kazuma' && r4.cameo && pity.guar4, 'a cameo keeps the 4★ guarantee for the next pull');
  }
  const logG = g.state.warpLog.filter(e => e.ban === 'guild');
  ok(logG.length && logG.every(e => e.star === 'aqua') && logG.some(e => e.off) && g.warpStats('guild').total === g.state.warpNGuild, 'Guild pulls are marked in the history');
  ok(logG.filter(e => e.rar === 5).every(e => e.pity <= T.pity5), 'the Guild hard pity is ' + T.pity5);
  ok(g.setStarOf('guild', 'darkness') && g.starOf('guild') === 'darkness' && !g.setStarOf('guild', 'kazuma'), 'the player picks a heroine, Kazuma is not a 5★ choice');
  g.state.pityGuild.five = T.pity5 - 1; g.state.pityGuild.guar5 = true;
  const r = g.warp(1, 'guild')[0];
  ok(r.rar === 5 && r.id === 'darkness' && !g.state.pityGuild.guar5, 'hard pity with the guarantee gives Darkness');
  ok(g.state.roster.kazuma && g.state.roster.aqua, 'pulled heroes join the roster');
  const back = new H.Game({ state: g.serialize() });
  ok(back.starOf('guild') === 'darkness' && back.state.warpNGuild === g.state.warpNGuild, 'Guild state survives a save');
  const old = H.newState(); delete old.pityGuild; delete old.guildStar; delete old.warpNGuild;
  const og = new H.Game({ state: old });
  ok(og.starOf('guild') === 'aqua' && og.state.pityGuild.five === 0 && og.state.warpNGuild === 0, 'old saves get an empty Guild state');
}

{
  const g = new H.Game({ seed: 35 }), T = H.TUNING, BW = H.BANNERS.wiz;
  ok(BW.pass === 'mana' && BW.party, 'the Wiz shop takes manatites and keeps misses in the party');
  eq(Object.keys(BW.stars).join(), 'aqua,megumin,darkness', 'the shop sells the cones of Aqua, Megumin and Darkness');
  for (const [id, st] of Object.entries(BW.stars)) {
    const cd = H.CONES[st.cone];
    ok(cd && cd.rarity === 5 && cd.sig === id && cd.path === H.CHARS[id].path && cd.fx, 'the shop cone of ' + id + ' is a 5★ of the Path');
    ok(st.four.length === 1 && st.four[0] === 'cone:chunchunmaru' && st.tag && st.title.length === 2, 'Chunchunmaru is the only featured 4★ next to ' + id);
  }
  const ch4 = H.CONES.chunchunmaru;
  ok(ch4.rarity === 4 && ch4.sig === 'kazuma' && ch4.path === H.CHARS.kazuma.path, 'Chunchunmaru is a 4★ Nihility cone for Kazuma');
  ok(['hagoromo', 'manastaff', 'adamantite', 'chunchunmaru'].every(id => !Object.values(H.WARP_POOL).some(p => p.includes('cone:' + id))), 'the Guild cones come only from the shop');
  g.state.jade = 1e7;
  g.state.inv.items.mana = 4;
  g.state.warpBan = 'wiz';
  eq(g.defaultBanner(), 'wiz', 'manatites reopen the shop when it was the last banner');
  ok(g.setStarOf('wiz', 'megumin') && g.starOf('wiz') === 'megumin' && g.starOf('guild') === 'aqua', 'the shop and the recruitment keep their own choice');
  const guild0 = { ...g.state.pityGuild }, pulls = [];
  for (let i = 0; i < 60; i++) pulls.push(...g.warp(10, 'wiz'));
  ok(!g.state.inv.items.mana && g.state.pityGuild.five === guild0.five, 'the shop spends manatites first and keeps its own pity');
  const p5 = pulls.filter(x => x.rar === 5), party = Object.values(BW.stars).map(x => x.cone);
  ok(p5.length >= 10 && p5.every(x => x.kind === 'cone'), 'every shop 5★ is a Light Cone (' + p5.length + ')');
  const hit = p5.filter(x => x.id === 'manastaff');
  ok(hit.length >= p5.length * 0.6 && hit.length < p5.length, 'most are Manatite Staff (' + hit.length + '/' + p5.length + ')');
  ok(p5.filter(x => x.off).every(x => x.id !== 'manastaff') && p5.some(x => x.off && party.includes(x.id)), 'a miss gives another heroine cone or a standard cone');
  ok(g.state.warpLog.filter(e => e.ban === 'wiz' && e.rar === 5).every(e => e.pity <= T.conePity5), 'the shop 5★ pity is ' + T.conePity5);
  const p4 = pulls.filter(x => x.rar === 4), ch = p4.filter(x => x.id === 'chunchunmaru');
  ok(ch.length > p4.length * 0.4 && ch.length < p4.length, 'about half of the 4★ are Chunchunmaru (' + ch.length + '/' + p4.length + ')');
  ok(!pulls.some(x => x.cameo), 'the shop has no Kazuma cameo roll');
  {
    const gm = new H.Game({ seed: 78 }), tally = { feat: 0, party: 0, std: 0 }, B = gm.bannerOf('wiz');
    for (let i = 0; i < 4000; i++) { gm.state.pityWiz.guar5 = false; const { pick } = gm.partyPick(gm.state.pityWiz, B); if (pick === B.five) tally.feat++; else if (party.includes(pick.slice(5))) tally.party++; else tally.std++; }
    const fr = T.coneFeatured;
    ok([['feat', fr], ['party', (1 - fr) * T.guildParty], ['std', (1 - fr) * (1 - T.guildParty)]].every(([k, v]) => Math.abs(tally[k] / 4000 - v) < 0.03), 'the shop 5★ split follows the cone rate (' + tally.feat + ' / ' + tally.party + ' / ' + tally.std + ')');
  }
  const old = H.newState(); delete old.pityWiz; delete old.wizStar; delete old.warpNWiz;
  const og = new H.Game({ state: old });
  ok(og.starOf('wiz') === 'aqua' && og.state.pityWiz.five === 0 && og.state.warpNWiz === 0, 'old saves get an empty shop state');
}

{
  const gg = new H.Game({ seed: 3 });
  const { sv } = H.battleStat;
  const mk = (id, lvl, cone) => ({ key: id, charId: id, lvl, stats: gg.baseStats(id, lvl, 0), energy: 0, cone });
  gg.state.roster.seele = { lvl: 30, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
  gg.state.roster.march = { lvl: 30, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
  const night = gg.addCone('night');
  gg.equipCone('seele', night.uid);
  const sp = gg.coneEffect('seele');
  ok(sp && sp.fx === 'night' && sp.sup === 1, 'the battle spec carries the signature cone effect');
  ok(gg.charStats('seele').critR >= 0.05 + 0.18 - 1e-9, 'In the Night raises CRIT Rate');
  gg.equipCone('march', night.uid);
  ok(!gg.coneEffect('march'), 'a cone of another Path gives no special effect');
  const dmgOf = (cone, kind, spd) => {
    const b = new H.Battle({ party: [mk('seele', 30, cone)], enemies: ['reaver:30'], lvl: 30, seed: 5 });
    b.start();
    const u = b.allies[0];
    if (spd) u.buffs.push({ s: 'spd', v: spd, turns: 9, name: 'test' });
    return b.dmgCalc(u, b.enemies[0], 1, { kind }, kind === 'ult');
  };
  const base = dmgOf(null, 'skill', 45), boosted = dmgOf({ id: 'night', fx: 'night', sup: 1 }, 'skill', 45);
  ok(boosted > base * 1.3 && boosted < base * 1.42, 'In the Night: +6% skill DMG per 10 SPD above 100 (' + (boosted / base).toFixed(2) + ')');
  ok(dmgOf({ id: 'night', fx: 'night', sup: 1 }, 'skill', 400) / dmgOf(null, 'skill', 400) < 1.37 + 1e-9, 'In the Night stops at 6 stacks');
  ok(dmgOf({ id: 'night', fx: 'night', sup: 1 }, 'ult', 45) > dmgOf(null, 'ult', 45), 'In the Night raises Ultimate CRIT DMG');
  const b = new H.Battle({ party: [mk('ruanmei', 30, { id: 'mirror', fx: 'mirror', sup: 1 }), mk('march', 30)], enemies: ['reaver:30'], lvl: 30, seed: 6 });
  b.start();
  ok(b.allies.every(a => a.energy >= 10), 'Past Self in Mirror gives the team 10 energy at the start');
  const rm = b.allies[0];
  rm.energy = rm.maxEnergy; b.current = rm; b.phase = 'input';
  ok(b.ult(rm, rm), 'Ruan Mei Ultimate with her cone');
  ok(b.livingAllies.every(a => a.buffs.some(x => x.name === 'Прошлое в зеркале' && x.s === 'dmgP' && Math.abs(x.v - 0.24) < 1e-9)), 'Past Self in Mirror gives the team +24% DMG after the Ultimate');
  const b5 = new H.Battle({ party: [mk('ruanmei', 30, { id: 'mirror', fx: 'mirror', sup: 5 })], enemies: ['reaver:30'], lvl: 30, seed: 6 });
  b5.start();
  const r5 = b5.allies[0]; r5.energy = r5.maxEnergy; b5.current = r5; b5.phase = 'input'; b5.ult(r5, r5);
  ok(r5.buffs.some(x => x.name === 'Прошлое в зеркале' && Math.abs(x.v - 0.48) < 1e-9), 'Superimposition 5 doubles the cone effect');
}

{
  const gg = new H.Game({ seed: 2 });
  const mk = (id, lvl) => ({ key: id, charId: id, lvl, stats: gg.baseStats(id, lvl, 0), energy: 0 });
  const b = new H.Battle({ party: [mk('ruanmei', 30), mk('march', 30), mk('himeko', 30)], enemies: ['reaver:30', 'eliminator:30'], lvl: 30, seed: 3 });
  b.start();
  const rm = b.allies[0], march = b.allies[1];
  ok(march.buffs.some(x => x.s === 'spdP' && x.name === 'Соматотипическая спираль') && !rm.buffs.some(x => x.s === 'spdP'), 'Ruan Mei talent speeds up the other allies');
  b.current = rm; b.phase = 'input'; b.sp = 3;
  ok(b.act('skill', rm), 'Ruan Mei uses her Skill');
  ok(b.allies.every(a => a.buffs.some(x => x.name === 'Обертон' && x.s === 'dmgP') && a.buffs.some(x => x.s === 'breakEff')), 'her Skill gives Overtone to the whole team');
  const e = b.enemies[0];
  e.tough = e.maxTough; e.broken = false;
  b.hit(march, e, 0.1, { tough: 10, e: 'phys' });
  eq(e.maxTough - e.tough, 15, 'Overtone breaks toughness 50% faster');
  const ev0 = b.ev.length;
  b.hit(march, e, 0.1, { tough: 10, e: 'phys' });
  ok(e.broken && b.ev.slice(ev0).some(x => x.t === 'dmg' && x.label === 'Спираль' && x.src === rm && x.e === 'ice'), 'an ally break adds Ruan Mei ice break damage');
  rm.energy = rm.maxEnergy; b.current = rm; b.phase = 'input';
  ok(b.ult(rm, rm), 'Ruan Mei Ultimate fires');
  ok(b.living.every(x => x.buffs.some(y => y.s === 'bloom')) && b.allies.every(a => a.buffs.some(x => x.s === 'resPen' && x.name === 'Магический круг')), 'the Ultimate marks the enemies and raises the team RES PEN');
  const hp0 = e.hp;
  eq(b.startTurn(e), 'bloom', 'a marked broken enemy blooms instead of acting');
  ok(e.broken && e.hp < hp0 && !e.buffs.some(y => y.s === 'bloom') && e.av > 0, 'Rebloom keeps the enemy broken, deals damage and uses up the mark');
  b.startTurn(e);
  ok(!e.broken, 'without the mark the enemy recovers');
  const b2 = new H.Battle({ party: [mk('ruanmei', 20), mk('march', 20)], enemies: ['reaver:20'], lvl: 20, seed: 5, techs: [{ charId: 'ruanmei', fx: 'ruanSkill' }] });
  b2.start();
  ok(b2.allies.every(a => a.buffs.some(x => x.name === 'Обертон')), 'Silken Serenade starts the battle with Overtone');
  const b3 = new H.Battle({ party: [mk('ruanmei', 30), mk('march', 30), mk('himeko', 30), mk('seele', 30)], enemies: ['reaver:28', 'eliminator:28', 'flamespawn:28'], lvl: 28, seed: 7 });
  b3.start();
  const res = b3.runAuto(800);
  ok(res && res.win, 'a team with Ruan Mei wins on auto battle');
}

{
  const gg = new H.Game({ seed: 2 });
  const { sv, alive } = H.battleStat;
  const mk = (id, lvl) => ({ key: id, charId: id, lvl, stats: gg.baseStats(id, lvl, 0), energy: 0 });
  const turnOf = (b, u) => { b.current = u; b.phase = 'input'; b.sp = 3; };

  const b = new H.Battle({ party: [mk('bailu', 30), mk('march', 30), mk('himeko', 30)], enemies: ['reaver:30'], lvl: 30, seed: 3 });
  b.start();
  const bl = b.allies[0], mr = b.allies[1], hm = b.allies[2], foe = b.enemies[0];
  mr.hp = Math.round(mr.maxHp * 0.3); hm.hp = Math.round(hm.maxHp * 0.5);
  turnOf(b, bl);
  const ev0 = b.ev.length, hpM = mr.hp, hpH = hm.hp;
  ok(b.act('skill', mr), 'Bailu uses her Skill');
  const heals = b.ev.slice(ev0).filter(e => e.t === 'heal' && e.v > 0);
  ok(heals.length >= 3 && mr.hp > hpM && hm.hp > hpH, 'her Skill heals the target and bounces to the most wounded allies (' + heals.length + ')');
  bl.energy = bl.maxEnergy; turnOf(b, bl);
  ok(b.ult(bl, bl), 'Bailu Ultimate fires');
  ok(b.livingAllies.every(a => a.buffs.some(x => x.s === 'invig')), 'the Ultimate gives Invigoration to the whole team');
  const inv = mr.buffs.find(x => x.s === 'invig'), t0i = inv.turns;
  b.invigorate(2);
  eq(inv.turns, t0i + 1, 'Invigoration on an ally is extended by one turn');
  mr.hp = Math.round(mr.maxHp * 0.6); mr.shield = 0; b.hitThisAction = new Set();
  const ev1 = b.ev.length;
  b.hit(foe, mr, 0.05, { e: 'phys' });
  ok(b.ev.slice(ev1).some(e => e.t === 'heal' && e.u === mr), 'an Invigorated ally heals when hit');
  mr.hp = 1; b.hitThisAction = new Set();
  b.hit(foe, mr, 80, { e: 'phys' });
  ok(!mr.dead && mr.hp > 1 && bl.flags.elixir, 'Bailu saves an ally from a killing blow');
  mr.hp = 1; mr.shield = 0; b.hitThisAction = new Set();
  b.hit(foe, mr, 80, { e: 'phys' });
  ok(mr.dead, 'the elixir works once per battle');
  const bt = new H.Battle({ party: [mk('bailu', 20), mk('march', 20)], enemies: ['reaver:20'], lvl: 20, seed: 4, techs: [{ charId: 'bailu', fx: 'invigAll' }] });
  bt.start();
  ok(bt.allies.every(a => a.buffs.some(x => x.s === 'invig')), 'Saunter in the Rain starts the battle with Invigoration');
  {
    const bp = new H.Battle({ party: [mk('bailu', 20), mk('march', 20), mk('natasha', 20)], enemies: ['reaver:20'], lvl: 20, seed: 4 });
    bp.start();
    const [ba, ma, na] = bp.allies;
    ma.hp = Math.round(ma.maxHp * 0.3); na.hp = Math.round(na.maxHp * 0.5);
    const pv = bp.preview('skill', ba, ba);
    ok(pv.rows.get(ba).heal > 0 && pv.rows.get(ma).heal > 0 && pv.rows.get(na).heal > 0, 'the Skill preview spreads Bailu\'s bounces over the wounded allies');
    const evh = bp.ev.length;
    bp.current = ba; bp.phase = 'input';
    bp.act('skill', ba);
    const healed = new Map();
    for (const e of bp.ev.slice(evh)) if (e.t === 'heal') healed.set(e.u, (healed.get(e.u) || 0) + 1);
    ok([ma, na].every(a => healed.has(a)), 'the bounces land where the preview put them');
  }

  const y = new H.Battle({ party: [mk('yanqing', 30), mk('march', 30)], enemies: ['reaver:30', 'reaver:30'], lvl: 30, seed: 4 });
  y.start();
  const yq = y.allies[0], cr0 = sv(yq, 'critR');
  turnOf(y, yq);
  y.act('skill', y.enemies[0]);
  ok(yq.flags.sync && sv(yq, 'critR') >= cr0 + 0.2 && sv(yq, 'critD') >= 0.8, 'Yanqing Skill gives Soulsteel Sync');
  ok(sv(yq, 'aggro') < 0, 'Soulsteel Sync makes enemies pick Yanqing less often');
  let picks = 0;
  for (let i = 0; i < 400; i++) if (y.pickTarget(y.enemies[0]) === yq) picks++;
  ok(picks < 120, 'enemies rarely target Yanqing under Sync (' + picks + '/400)');
  yq.shield = 1e6; y.hitThisAction = new Set();
  y.hit(y.enemies[0], yq, 0.05, { e: 'phys' });
  ok(yq.flags.sync, 'a shield that absorbs the hit keeps Sync');
  yq.shield = 0; y.hitThisAction = new Set();
  y.hit(y.enemies[0], yq, 0.05, { e: 'phys' });
  ok(!yq.flags.sync && !yq.buffs.some(x => x.name.startsWith('Единение')), 'HP damage removes Sync');
  let follow = 0, frozen = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const yb = new H.Battle({ party: [mk('yanqing', 30)], enemies: ['reaver:40'], lvl: 40, seed });
    yb.start();
    const u = yb.allies[0], e = yb.enemies[0];
    yb.gainSync(u); turnOf(yb, u);
    const e0 = yb.ev.length;
    yb.act('basic', e);
    if (yb.ev.slice(e0).some(x => x.t === 'act' && x.u === u && x.name === 'Ледяной клинок')) follow++;
    if (yb.ev.slice(e0).some(x => x.t === 'status' && x.u === e && x.text === 'Заморозка')) frozen++;
  }
  ok(follow >= 8 && follow <= 22, 'Sync gives a 50% follow-up after attacks (' + follow + '/30)');
  ok(frozen > 0 && frozen <= follow, 'the follow-up can freeze (' + frozen + ')');
  y.gainSync(yq); yq.energy = yq.maxEnergy; turnOf(y, yq);
  ok(y.ult(yq, y.living[0]), 'Yanqing Ultimate fires');
  ok(yq.buffs.some(x => x.s === 'critR' && x.v === 0.6) && yq.buffs.some(x => x.s === 'critD' && x.v === 0.5), 'the Ultimate raises CRIT, and CRIT DMG under Sync');
  const yt = new H.Battle({ party: [mk('yanqing', 20)], enemies: ['reaver:20'], lvl: 20, seed: 6, techs: [{ charId: 'yanqing', fx: 'yanqingTech' }] });
  yt.start();
  ok(yt.allies[0].buffs.some(x => x.s === 'vsHigh'), 'The One True Sword gives bonus damage against healthy enemies');

  const cb = new H.Battle({ party: [mk('clara', 30), mk('march', 30)], enemies: ['reaver:30', 'reaver:30', 'reaver:30'], lvl: 30, seed: 5 });
  cb.start();
  const cl = cb.allies[0], m2 = cb.allies[1];
  ok(cl.buffs.some(x => x.s === 'dr' && x.v === 0.1), 'Clara takes 10% less damage');
  cl.taunt = 5;
  const c0 = cb.ev.length, f0 = cb.enemies[0];
  cb.enemyTurn(f0);
  ok(cb.ev.slice(c0).some(e => e.t === 'act' && e.u === cl && e.name === 'Ответный удар Сварога'), 'Svarog strikes back at the enemy that hit Clara');
  ok(!alive(f0) || f0.buffs.some(x => x.s === 'svMark'), 'the counter marks the attacker');
  cl.taunt = 0; m2.taunt = 5;
  const c1 = cb.ev.length;
  cb.enemyTurn(cb.living[cb.living.length - 1]);
  ok(!cb.ev.slice(c1).some(e => e.t === 'act' && e.u === cl), 'without the Ultimate Svarog only answers hits on Clara');
  for (const e of cb.living) cb.svMark(e);
  const marked = cb.living.length;
  turnOf(cb, cl);
  const c2 = cb.ev.length;
  cb.act('skill', cb.living[0]);
  const svHits = cb.ev.slice(c2).filter(e => e.t === 'dmg' && e.label === 'Сварог').length;
  ok(svHits >= marked && !cb.enemies.some(e => alive(e) && e.buffs.some(x => x.s === 'svMark') && !cb.ev.slice(c2).some(v => v.t === 'act' && v.kind === 'enemy' && v.u === e)), 'her Skill hits marked enemies again and spends the marks (' + svHits + ')');
  const cu = new H.Battle({ party: [mk('clara', 30), mk('march', 30)], enemies: ['reaver:40', 'reaver:40', 'reaver:40'], lvl: 40, seed: 7 });
  cu.start();
  const cl2 = cu.allies[0], m3 = cu.allies[1];
  cl2.energy = cl2.maxEnergy; turnOf(cu, cl2);
  ok(cu.ult(cl2, cl2), 'Clara Ultimate fires');
  ok(cl2.flags.promise === 2 && cl2.buffs.some(x => x.name === 'Обещание' && x.s === 'dr'), 'the Ultimate readies two strong counters and more DMG reduction');
  m3.taunt = 5;
  const c3 = cu.ev.length, mid = cu.enemies[1];
  cu.enemyTurn(mid);
  ok(cu.ev.slice(c3).some(e => e.t === 'act' && e.u === cl2 && e.name === 'Сварог: Обещание') && cl2.flags.promise === 1, 'under the Promise Svarog answers a hit on any ally');
  ok(cu.ev.slice(c3).filter(e => e.t === 'dmg' && e.label === 'Сварог').length >= 2, 'the strong counter also hits the neighbours');
  m3.taunt = 0;
  let aimed = 0;
  for (let i = 0; i < 400; i++) if (cu.pickTarget(cu.enemies[0]) === cl2) aimed++;
  ok(aimed > 280, 'the Promise draws enemy attacks to Clara (' + aimed + '/400)');

  const fk = new H.Battle({ party: [mk('clara', 30), mk('hook', 30)], enemies: ['reaver:30', 'reaver:30'], lvl: 30, seed: 8 });
  fk.start();
  for (const a of fk.allies) a.energy = a.maxEnergy;
  turnOf(fk, fk.allies[0]);
  ok(fk.fusion('f_kids', fk.living[0]), 'Clara and Hook fuse');
  ok(fk.living.every(e => e.buffs.some(x => x.s === 'svMark')), 'Children of the Underworld marks every enemy');
  const fl = new H.Battle({ party: [mk('yanqing', 30), mk('bailu', 30)], enemies: ['reaver:30'], lvl: 30, seed: 9 });
  fl.start();
  for (const a of fl.allies) a.energy = a.maxEnergy;
  turnOf(fl, fl.allies[0]);
  ok(fl.fusion('f_luofu', fl.living[0]), 'Yanqing and Bailu fuse');
  ok(fl.livingAllies.every(a => a.buffs.some(x => x.s === 'invig')), 'Guests from the Luofu give Invigoration');

  let wins = 0;
  for (let seed = 1; seed <= 6; seed++) {
    const ab = new H.Battle({ party: [mk('clara', 30), mk('yanqing', 30), mk('bailu', 30), mk('march', 30)], enemies: ['reaver:28', 'eliminator:28', 'flamespawn:28'], lvl: 28, seed });
    ab.start();
    const r = ab.runAuto(800);
    if (r && r.win) wins++;
  }
  ok(wins >= 5, 'a team of the new heroes wins on auto battle (' + wins + '/6)');
}

{
  const bad = [];
  const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d., e+-]+\)|hsl\([\d., %]+\)|[a-z]+)$/i;
  const check = (what, v) => { if (typeof v === 'string' && !COLOR.test(v)) bad.push(what + ' ' + v); };
  const noop = () => {};
  function makeCanvas(w = 300, h = 150) {
    const cv = { width: w, height: h, style: {}, className: '', addEventListener: noop, getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 480 }) };
    let fill = '#000', stroke = '#000';
    const grad = () => ({ addColorStop: (o, c) => check('gradient', c) });
    const ctx = {
      canvas: cv, lineWidth: 1, lineCap: 'butt', lineJoin: 'miter', globalAlpha: 1, globalCompositeOperation: 'source-over', font: '10px x', textAlign: 'left', textBaseline: 'alphabetic', imageSmoothingEnabled: true,
      get fillStyle() { return fill; }, set fillStyle(v) { check('fill', v); fill = v; },
      get strokeStyle() { return stroke; }, set strokeStyle(v) { check('stroke', v); stroke = v; },
      save: noop, restore: noop, beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, quadraticCurveTo: noop, bezierCurveTo: noop, arc: noop, rect: noop, fill: noop, stroke: noop, clip: noop,
      ellipse: (x, y, rx, ry) => { if (rx < 0 || ry < 0) bad.push('negative ellipse ' + rx + ',' + ry); },
      fillRect: noop, strokeRect: noop, clearRect: noop, fillText: noop, strokeText: noop, translate: noop, rotate: noop, scale: noop, setLineDash: noop, drawImage: noop, putImageData: noop, setTransform: noop,
      measureText: s => ({ width: String(s).length * 6 }), createPattern: () => ({}),
      createLinearGradient: grad, createRadialGradient: grad,
      getImageData: (x, y, gw, gh) => ({ data: new Uint8ClampedArray(Math.max(1, gw * gh) * 4), width: gw, height: gh }),
      createImageData: (gw, gh) => ({ data: new Uint8ClampedArray(gw * gh * 4), width: gw, height: gh })
    };
    cv.getContext = () => ctx;
    return cv;
  }
  const store = new Map();
  Object.assign(globalThis, {
    document: { createElement: () => makeCanvas() },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    requestAnimationFrame: () => 1
  });
  for (const f of ['hsr-gfx', 'hsr-art', 'hsr-icons', 'hsr-cones', 'hsr-tiles', 'hsr-foes', 'hsr-midi', 'hsr-audio', 'hsr-ui', 'hsr-train', 'hsr-station', 'hsr-3d', 'hsr-pompom', 'hsr-warp', 'hsr-title', 'hsr-cine', 'hsr-cines', 'hsr-ults', 'hsr-fusions', 'hsr-warp-intro', 'hsr-signal', 'hsr-signal-tv', 'hsr-convene', 'hsr-explosion', 'hsr-personas', 'hsr-midnight', 'hsr-ui-menu', 'hsr-ui-velvet', 'hsr-eidolons', 'hsr-eidolon-scenes', 'hsr-inaba-scenes', 'hsr-fours-scenes', 'hsr-ui-nav', 'hsr-ui-events', 'hsr-ui-chat', 'hsr-ui-missions', 'hsr-ui-debug', 'hsr-ui-battle', 'hsr-ui-inaba', 'hsr-ui-fours', 'hsr-ui-su', 'hsr-ui-memory']) require(path.join(DIR, f + '.js'));
  const G = H.Gfx;
  const lum = hex => { const n = parseInt(hex.slice(1), 16); return 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255); };
  for (const id of Object.keys(H.CHARS)) {
    const L = G.lookOf(id, null);
    ok(L.skin && L.hair && L.eye && L.body && L.top && L.bangs, 'full look ' + id);
    G.bustCanvas(L, 64); G.bustCanvas(L, 34); G.figureCanvas(L);
    for (const d of ['down', 'up', 'left', 'right']) G.spriteCanvas(L, d, 1);
  }
  for (const [id, sp] of Object.entries(H.SPEAKERS)) if (sp.look || sp.char) { const L = G.lookOf(id, null); G.bustCanvas(L, 64); G.spriteCanvas(L, 'down', 0); G.figureCanvas(L); }
  ok(lum(G.lookOf('arlan', null).skin) < 120 && lum(G.lookOf('arlan', null).hair) > 200, 'Arlan: dark skin, white hair');
  const pom = G.lookOf('pompom', null);
  ok(parseInt(pom.top.slice(1, 3), 16) > 150 && parseInt(pom.top.slice(3, 5), 16) < 80 && lum(pom.ear) < 80 && lum(pom.hair) > 200, 'Pom-Pom: red conductor hat and coat, dark ears, white fur');
  ok(H.PomPom && typeof H.PomPom.draw === 'function' && typeof H.PomPom.bust === 'function', 'Pom-Pom 3D model is shared by the Warp and the 2D art');
  ok(G.bustCanvas(pom, 64).width === 64 && G.bustCanvas(pom, 34).height === 34 && G.figureCanvas(pom).height === 96 && G.figureCanvas(pom, 2).width === 96, 'Pom-Pom bust and figure are rendered from the 3D model');
  for (const d of ['down', 'up', 'left', 'right']) for (const f of [0, 1, 3]) { const cv = G.spriteCanvas(pom, d, f); ok(cv.width === 36 && cv.height === 52, 'Pom-Pom field sprite ' + d + ' ' + f); }
  for (const id of Object.keys(H.CHARS)) { const cv = G.figureCanvas(G.lookOf(id, null), 2); ok(cv.width === 96 && cv.height === 192, 'double-size warp figure ' + id); }
  {
    const R3 = H.R3, M = R3.M, R = new R3.Raster(64, 48);
    const px = (x, y) => Array.from(R.px.slice((y * 64 + x) * 4, (y * 64 + x) * 4 + 3));
    const quadOf = (z, col) => { const m = R3.mesh(); R3.quad(m, [-1, -1, z, 1, -1, z, 1, 1, z, -1, 1, z], col); return m; };
    R.look([0, 0, 3], [0, 0, 0], 60);
    R.light({ amb: [1, 1, 1], sun: null });
    const red = quadOf(0, '#ff0000'), green = quadOf(-0.5, '#00ff00');
    R.clear('#000000'); R.draw(red, M.id());
    ok(px(32, 24)[0] > 200 && px(1, 1)[0] === 0, '3D: a front-facing quad fills the centre only');
    R.clear('#000000'); R.draw(red, M.ry(Math.PI));
    ok(px(32, 24)[0] === 0, '3D: back faces are culled');
    R.clear('#000000'); R.draw(red, M.id()); R.draw(green, M.id());
    ok(px(32, 24)[0] > 200 && px(32, 24)[1] === 0, '3D: the z-buffer keeps the nearer face');
    R.clear('#000000'); R.draw(red, M.of(M.t(0, 0, 2.5), M.rx(1.2), M.s(10)));
    ok(px(32, 24)[0] > 200, '3D: a face crossing the near plane is clipped and still drawn');
    const c = R.project([0, 0, 0]);
    ok(c && Math.abs(c[0] - 32) < 1e-6 && Math.abs(c[1] - 24) < 1e-6 && !R.project([0, 0, 5]), '3D: projection centre and behind-camera points');
    R.clear('#000000'); R.glow([0, 0, 0], 0.3, '#ffffff'); R.streak([-1, 0, 0], [1, 0, 0], 2, '#ffffff', '#ffffff');
    ok(px(32, 24)[0] > 100, '3D: glow sprites and streaks add light');
  }
  {
    const T = H.TitleScene, R = new H.R3.Raster(320, 240), Sc = T.scene();
    const px = (x, y) => { const o = (Math.round(y) * 320 + Math.round(x)) * 4; return [R.px[o], R.px[o + 1], R.px[o + 2]]; };
    let inFrame = true, clear = true, lamp = true, planet = true;
    T.render(R, -0.02);
    for (const t of [0, 3.5, 13.6, 27, 61.2, 118]) {
      T.render(R, t);
      const nose = R.project(Sc.at(0)), tail = R.project(Sc.at(-25)), pc = R.project(Sc.planet.p), rad = Sc.planet.r * R.fl / pc[2];
      inFrame = inFrame && [nose, tail].every(p => p && p[0] > 8 && p[0] < 312 && p[1] > 8 && p[1] < 232);
      clear = clear && nose[0] < 236 && pc[0] < 110 && pc[1] - rad > 60;
      const L = R.project(T.lamp(t)), c = px(L[0], L[1]);
      lamp = lamp && c[0] + c[1] + c[2] > 600;
      const s = px(pc[0], pc[1] - rad * 0.85);
      planet = planet && s[2] > 60 && s[2] >= s[0];
    }
    ok(inFrame, 'title 3D: the Express stays in frame while the camera sways');
    ok(clear, 'title 3D: the train and Jarilo-VI keep clear of the logo and the menu column');
    ok(lamp, 'title 3D: the locomotive headlamp shines');
    ok(planet, 'title 3D: Jarilo-VI is lit ice-blue on its upper limb');
    ok(T.CARS.length === 4 && T.CARS[0].loco, 'title 3D: locomotive plus three cars from the Warp models');
  }
  ok(G.trailLook('f').back === 'layer' && G.trailLook('m').back === 'wolf', 'Stelle and Caelus differ');
  ok(G.isMale(G.trailLook('m')) && !G.isMale(G.trailLook('f')), 'Caelus uses the male body, Stelle the female one');
  for (const id of ['danheng', 'welt', 'arlan', 'gepard', 'sampo']) ok(G.isMale(G.lookOf(id, null)), 'male body type ' + id);
  for (const id of ['march', 'himeko', 'bronya', 'seele', 'herta']) ok(!G.isMale(G.lookOf(id, null)), 'female body type ' + id);
  ok(G.isMale({ body: 'small', sex: 'm' }) && !G.isMale({ body: 'tall', sex: 'f' }), 'sex overrides the body type');
  for (const id of Object.keys(H.ITEMS)) { ok(G.ITEM_ART[id], 'item icon ' + id); G.itemCanvas(id); ok(H.ITEMS[id].rar >= 1 && H.ITEMS[id].rar <= 5, 'item rarity ' + id); }
  for (const id of ['jade', 'credits', 'power', 'tp']) ok(G.ITEM_ART[id], 'currency icon ' + id);
  for (const s of H.RELIC_SLOTS) G.itemCanvas('relic:' + s.key, 'thief');
  for (const id of Object.keys(H.CONES)) { ok(G.CONE_SCENES[id], 'cone art ' + id); G.coneArt(id, 54, 76); }
  for (const p of Object.keys(H.PATHS)) ok(G.PATH_ART[p], 'path icon ' + p);
  const stubCtx = makeCanvas(640, 480).getContext('2d');
  for (const [id, d] of Object.entries(H.ENEMIES)) {
    const m = G.FOE_META[id];
    ok(m && (G.FOE_ART[id] || m.figure), 'enemy art ' + id);
    ok(d.id === id && G.foeId(d) === id, 'enemy id ' + id);
    ok(m.figure || (m.icon && m.icon.length === 3), 'enemy icon crop ' + id);
    for (const n of [22, 52, 70, 100]) for (const f of [0, 1]) { const cv = G.foeCanvas(id, n, f); ok(cv.width === n && cv.height === n, 'enemy canvas ' + id + ' ' + n); }
    G.drawEnemy(stubCtx, d, 100, 300, 104, { t: 1.3, flash: 0.5, alpha: 0.5 });
    G.fieldEnemy(stubCtx, d, 40, 40, 0.7, !!d.elite);
    G.foeIcon(stubCtx, d, 10, 10, 34, { round: true });
  }
  ok(G.foeId({ shape: 'cocolia' }) === 'cocolia1', 'CG shape falls back to Cocolia');
  const lum2 = hex => { const n = parseInt(hex.slice(1), 16); return 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255); };
  ok(lum2(G.lookOf('cocolia', null).hair) > 150 && G.accOf(G.lookOf('cocolia', null), 'mantle'), 'Cocolia: blonde hair and green mantle');
  const mapGame = new H.Game({ seed: 9 });
  for (const id of Object.keys(H.MAPS)) {
    mapGame.loadMap(id, null, { silent: true });
    const L = G.mapLayer(mapGame.map);
    ok(L.cv.width === mapGame.map.w * G.TILE_U && L.cv.height === mapGame.map.h * G.TILE_U, 'map layer size ' + id);
    ok(G.THEMES[H.MAPS[id].theme], 'map theme ' + id);
    G.drawMap(stubCtx, mapGame.map, 40, 20, 1.5, 640, 480);
    G.drawMap(stubCtx, mapGame.map, -100, -50, 2.5, 640, 480);
  }
  for (const th of Object.keys(G.THEMES)) { const tx = G.floorTexture(th); ok(tx.width === 64 && tx.height === 64, 'floor texture ' + th); G.bgCanvas(th, 640, 480); }
  G.bgCanvas('sim', 640, 480); G.bgCanvas('stellaron', 640, 480);
  for (const [kind, st] of [['chest', { open: false }], ['chest', { open: true }], ['anchor', { on: true }], ['anchor', { on: false }], ['destr', {}], ['lever', { on: true }], ['lever', { on: false }], ['gate', {}], ['exit', { dir: 'left' }], ['exit', { dir: 'down', locked: true }]]) G.drawObject(stubCtx, kind, 64, 64, st, 1.2);
  G.drawCG(stubCtx, 'cocolia', 640, 480, 1);

  const root = { classList: { add: noop }, set innerHTML(v) { this.html = v; }, appendChild: noop, addEventListener: noop, removeEventListener: noop, focus: noop };
  const ui = new H.UI(root, { onExit: noop });
  eq(ui.audio.wanted, 'menu', 'the title screen plays the menu theme');
  ui.running = false;
  const frame = (n = 1, dt = 0.05) => { for (let i = 0; i < n; i++) { ui.update(dt); ui.render(); } };
  const key = code => ui.keydown({ code, repeat: false, preventDefault: noop });
  frame();
  eq(ui.mode, 'title', 'title screen draws');
  ui.newGame(); frame(10);
  eq(ui.mode, 'field', 'new game enters the field');
  {
    const g = ui.game, [home, alt] = ui.minimapDocks(), at0 = [g.player.x, g.player.y, g.player.dir], m0 = g.map.id;
    g.loadMap('u_boulder', null, { silent: true });
    const spots = [];
    for (let y = 0; y < g.map.h; y++) for (let x = 0; x < g.map.w; x++) if (!g.blocked(x, y)) spots.push([x, y]);
    const crowded = (dock, pad) => spots.find(([x, y]) => { g.placePlayer(x, y); return ui.minimapCrowded(dock, pad); });
    const free = () => spots.find(([x, y]) => { g.placePlayer(x, y); return !ui.minimapCrowded(home, 120) && !ui.minimapCrowded(alt, 40); });
    const go = s => { g.placePlayer(s[0], s[1]); frame(8); };
    go(free());
    eq(ui.minimap.side, 0, 'the minimap starts in the bottom left corner');
    const corner = crowded(home, 0);
    ok(corner, 'the start map has a spot under the minimap');
    if (corner) {
      go(corner);
      eq(ui.minimap.side, 1, 'the minimap moves right when the player walks under it');
      ok(ui.minimap.a === 1, 'the minimap fades back in at the right dock');
      ok(!ui.minimapCrowded(alt, 0), 'the right dock does not cover the player');
      go(free());
      eq(ui.minimap.side, 0, 'the minimap returns to the left when the player leaves the corner');
    }
    g.loadMap(m0, null, { silent: true }); g.placePlayer(at0[0], at0[1]); g.player.dir = at0[2]; frame();
  }
  const j0 = ui.game.state.jade;
  key('F7'); frame();
  eq(ui.game.state.jade, j0 + 1600, 'F7 grants 1600 Stellar Jade');
  ok(ui.toasts.some(t => /нефрит/.test(t.text)), 'F7 shows a toast');
  {
    const gs = ui.game.state, release = () => { ui.held = []; };
    const snap = JSON.parse(JSON.stringify({ roster: gs.roster, inv: gs.inv, jade: gs.jade, credits: gs.credits }));
    key('F8'); frame();
    ok(ui.top() && ui.top().debug, 'F8 opens the debug menu');
    for (const code of ['Digit2', 'Digit3', 'Digit4', 'KeyE', 'KeyQ', 'Digit1']) { key(code); frame(); }
    eq(ui.debugState.tab, 0, 'debug tabs switch with digits and Q/E');
    const seele = Object.keys(H.CHARS).filter(k => k !== 'trail_p').indexOf('seele');
    for (let i = 0; i < seele; i++) key('ArrowRight');
    key('ArrowDown'); key('ShiftLeft'); key('ArrowLeft'); release(); key('ArrowDown'); key('ArrowRight'); key('ArrowRight');
    key('Enter'); frame(); release();
    ok(gs.roster.seele && gs.roster.seele.lvl === H.MAX_LVL - 10 && gs.roster.seele.eid === 2, 'the characters tab grants the chosen character, level and Eidolon');
    ok(/Зеле/.test(ui.debugState.log.text), 'the debug menu logs the grant');
    key('ArrowUp'); key('ArrowUp'); key('ArrowUp'); key('Enter'); frame(); release();
    ok(Object.keys(H.CHARS).filter(k => k !== 'trail_p').every(k => gs.roster[k]), '«Выдать всех» grants every character');
    key('Digit2'); frame();
    const cone0 = H.CONES[Object.keys(H.CONES).sort((a, b) => H.CONES[b].rarity - H.CONES[a].rarity)[0]];
    const n0 = gs.inv.cones.length;
    key('ArrowDown'); for (let i = 0; i < 6; i++) key('ArrowRight');
    key('Enter'); frame(); release();
    ok(gs.inv.cones.length === n0 + 1 && gs.inv.cones[n0].sup === 5 && H.CONES[gs.inv.cones[n0].id] === cone0, 'the cones tab grants the chosen cone at S5');
    key('Digit3'); frame();
    const r0 = gs.inv.relics.length;
    key('ArrowDown'); key('ArrowRight'); key('ArrowRight'); key('ArrowDown'); key('ArrowRight');
    key('Enter'); frame(); release();
    const rel = gs.inv.relics[r0];
    ok(rel && rel.slot === 'body' && rel.main === 'atkP' && rel.lvl === 15, 'the relics tab grants the configured relic');
    eq(rel.subs.map(x => x[0]).join(), 'critR,critD,spd', 'choosing the main stat clears the same substat');
    key('Digit4'); frame();
    const j1 = gs.jade;
    key('ArrowDown'); key('ArrowRight'); key('Enter'); frame(); release();
    eq(gs.jade, j1 + 1600, 'the items tab grants currencies');
    key('ArrowUp'); key('ArrowRight'); key('ArrowRight'); key('ArrowRight'); key('Enter'); frame(); release();
    const it = Object.keys(H.ITEMS).sort((a, b) => ['food', 'exp', 'key'].indexOf(H.ITEMS[a].kind) - ['food', 'exp', 'key'].indexOf(H.ITEMS[b].kind))[1];
    ok(gs.inv.items[it] >= 1, 'the items tab grants items');
    {
      key('Digit4'); frame();
      const st = ui.debugState, sc = st.views.items, n = Object.keys(H.ITEMS).length + 2, range = n - 19, it0 = st.it.i;
      ok(n > 19 && sc, 'the item list keeps its own scroll state');
      st.it.i = 0; frame();
      eq(sc.top, 0, 'the list starts at the top');
      ok(ui.hits.some(h => h.x === 288 && h.y === 56 && h.w === 10), 'the list draws a scroll bar with an up arrow');
      ui.wheel({ clientX: 100, clientY: 200, deltaY: 120, preventDefault: noop }); frame();
      eq(sc.top, 3, 'the mouse wheel scrolls the list by three rows');
      eq(st.it.i, 0, 'scrolling keeps the selected item');
      ui.click({ clientX: 293, clientY: 410, button: 0 }); frame();
      eq(sc.top, 4, 'the down arrow scrolls one row');
      ui.click({ clientX: 293, clientY: 60, button: 0 }); frame();
      eq(sc.top, 3, 'the up arrow scrolls one row back');
      ui.wheel({ clientX: 100, clientY: 200, deltaY: -120, preventDefault: noop }); ui.wheel({ clientX: 100, clientY: 200, deltaY: -120, preventDefault: noop }); frame();
      eq(sc.top, 0, 'the wheel stops at the top');
      ui.click({ clientX: 293, clientY: 400, button: 0 }); frame();
      eq(sc.top, Math.min(19, range), 'a click on the track below the thumb pages down');
      sc.top = 0; frame();
      ui.click({ clientX: 293, clientY: 70, button: 0 });
      ok(ui.drag && ui.drag.sc === sc, 'the thumb can be grabbed');
      ui.drag.move({ x: 293, y: 1000 }); frame();
      eq(sc.top, range, 'dragging the thumb to the bottom shows the last rows');
      ui.drag = null;
      st.it.i = 1; frame();
      eq(sc.top, 1, 'moving the selection above the view scrolls back to it');
      st.it.i = n - 1; frame();
      eq(sc.top, range, 'moving the selection below the view scrolls down to it');
      st.it.i = it0;
      key('Digit4'); frame();
    }
    {
      const before = JSON.stringify({ roster: gs.roster, jade: gs.jade, warpN: gs.warpN, log: gs.warpLog.length, inv: gs.inv });
      const st = ui.debugState, sc = st.sc, menu = ui.top();
      const idsOf = has => Object.keys(H.CHARS).filter(k => has[k]);
      const sceneKindOf = x => ['ult', 'fus', 'warp', 'eid', 'sig', 'conv'][x.sc.kind], EID_STAGE_LIST = [0, 1, 3, 6];
      const ultIds = idsOf(H.Ults.SHOWS), warpIds = idsOf(H.WarpIntro.SHOWS), eidIds = idsOf(H.Eidolons.SCENES), fusIds = Object.keys(H.FUSIONS), bank0 = gs.bank.fusions.join();
      ok(ultIds.length === Object.keys(H.CHARS).length && warpIds.length >= 18 && eidIds.length === Object.keys(H.CHARS).length - 1, 'the scenes tab lists every ultimate, Warp intro and Eidolon picture');
      key('Digit5'); frame();
      eq(st.tab, 4, 'Digit5 opens the scenes tab');
      let thrown = null;
      try {
        for (let kind = 0; kind < 6; kind++) {
          sc.kind = kind;
          const ids = [ultIds, fusIds, warpIds, eidIds, Object.keys(H.CHARS).filter(k => k !== 'trail_p'), Object.keys(H.CHARS).filter(k => k !== 'trail_p')][kind];
          for (const id of ids) for (const stage of kind === 3 ? [0, 1, 2, 3] : [0]) for (const aim of kind === 1 ? [0, 1, 2, 3] : [0]) { sc.id = id; sc.stage = stage; sc.aim = aim; ui.t += 0.37; frame(); }
        }
      } catch (e) { thrown = e; }
      ok(!thrown, 'the scenes tab previews every character in every mode' + (thrown ? ': ' + thrown.message : ''));
      Object.assign(sc, { kind: 4, id: 'miyabi', cut: 0, res: 0 });
      st.row = 0;
      key('Enter'); frame();
      const sv = ui.top();
      ok(sv.debug && sv.show instanceof H.SignalShow && sv.show.phase === 'cine', 'the Signal Search mode plays the TV cinematic');
      eq(ui.audio.wantedSong, 'signal', 'the debug Signal Search scene plays the Golden Sign song');
      key('Escape'); frame();
      ok(sv.show.phase === 'reveal' && sv.show.item().id === 'miyabi', 'Esc jumps to the agent on stage');
      key('Enter'); frame(); key('Enter'); frame(4);
      ok(!sv.show, 'Enter finishes the agent reveal');
      eq(ui.audio.wantedSong, null, 'the debug song stops when the scene ends');
      key('Escape'); frame();
      Object.assign(sc, { kind: 5, id: 'phrolova', cut: 0, res: 0 });
      st.row = 0;
      eq(sceneKindOf(st), 'conv', 'the sixth mode shows the Convene reveals');
      const cnotes = ui.debugSceneNotes(st);
      ok(cnotes.length === 3 && /приливом/.test(cnotes[0]) && /Своя сцена: 7 планов/.test(cnotes[1]), 'the Convene notes name the own scene of Phrolova');
      key('Enter'); frame();
      const cv = ui.top();
      ok(cv.debug && cv.show instanceof H.ConveneShow && cv.show.phase === 'cine', 'the Convene mode plays the tide cinematic');
      key('Escape'); frame();
      ok(cv.show.phase === 'reveal' && cv.show.item().id === 'phrolova', 'Esc jumps to the resonator reveal');
      key('Enter'); frame(); key('Enter'); frame(4);
      ok(!cv.show, 'Enter finishes the resonator reveal');
      key('Escape'); frame();
      Object.assign(sc, { kind: 0, id: null, aim: 0, cut: 0, ban: 0, res: 0, stage: 1 });
      st.row = 0;
      key('Enter'); frame();
      const v = ui.top();
      ok(v !== menu && v.debug && v.show instanceof H.Ults.Show && sc.id === ultIds[0], 'Enter in the scenes tab plays the first ultimate cutscene');
      frame(Math.ceil(v.show.length / 0.05) + 4);
      ok(!v.show && ui.top() === v, 'a finished ultimate cutscene stays on the replay card');
      key('ArrowRight'); frame();
      ok(v.show && sc.id === ultIds[1], '→ on the replay card plays the next character');
      key('Escape'); frame(10);
      ok(!v.show, 'Esc skips the cutscene to the replay card');
      key('Escape'); frame();
      ok(ui.top() === menu, 'Esc on the replay card returns to the debug menu');
      st.row = 4;
      key('Enter'); frame();
      const all = ui.top(), seen = new Set();
      ok(all.all && sc.id === ultIds[0], '«Все подряд» starts with the first character');
      for (let i = 0; i < ultIds.length + 2 && all.show; i++) { seen.add(sc.id); key('Enter'); frame(10); }
      ok(!all.show && seen.size === ultIds.length, '«Все подряд» plays every ultimate cutscene in turn');
      key('Escape'); frame();
      st.row = 0; key('ArrowRight'); frame();
      eq(sceneKindOf(st), 'fus', '→ on the first row switches to Fusions');
      ok(fusIds.includes(sc.id), 'the Fusion mode picks a Fusion');
      eq(ui.debugForm(st).rows[1].value, H.FUSIONS[sc.id].name, 'the second row names the Fusion');
      key('Enter'); frame();
      const fv = ui.top();
      ok(fv.show instanceof H.Fusions.Show && fv.show.id === fusIds[0] && fv.show.P.foes.length === 3, 'Enter plays the first Fusion cutscene against all enemies');
      key('ArrowRight'); frame();
      ok(fv.show && fv.show.id === fusIds[1] && fv.show.P.foes.length === 3, '→ plays the next Fusion');
      frame(Math.ceil(fv.show.length / 0.05) + 4);
      ok(!fv.show && ui.top() === fv, 'a finished Fusion cutscene stays on the replay card');
      key('Escape'); frame();
      st.row = 4; key('Enter'); frame();
      const fall = ui.top(), fseen = new Set();
      ok(fall.all && fall.show instanceof H.Fusions.Show, '«Все подряд» starts the Fusion cutscenes');
      for (let i = 0; i < fusIds.length + 2 && fall.show; i++) { fseen.add(fall.show.id); key('Enter'); frame(10); }
      eq(fseen.size, fusIds.length, '«Все подряд» plays every Fusion cutscene in turn');
      key('Escape'); frame();
      eq(gs.bank.fusions.join(), bank0, 'watching Fusions does not add them to the Archive');
      st.row = 0; key('ArrowRight'); frame();
      eq(sceneKindOf(st), 'warp', '→ again switches to Warp intros');
      ok(warpIds.includes(sc.id), 'switching the mode keeps a valid character');
      const w0 = sc.id;
      key('Enter'); frame();
      const w = ui.top();
      ok(w.show instanceof H.WarpShow && w.show.phase === 'cine', 'the full Warp plays the train cinematic first');
      key('Escape'); frame();
      ok(w.show.phase === 'reveal' && w.show.item().id === w0, 'Esc jumps to the character intro');
      key('Enter'); frame(); key('Enter'); frame(4);
      ok(!w.show, 'Enter finishes the intro');
      key('Escape'); frame();
      st.row = 2; key('ArrowRight'); frame();
      key('Enter'); frame();
      ok(ui.top().show.phase === 'reveal', '«Только появление» starts at the character intro');
      key('Escape'); frame(4); key('Escape'); frame();
      st.row = 0; key('ArrowRight'); frame();
      eq(sceneKindOf(st), 'eid', 'the fourth mode shows Eidolon pictures');
      key('Enter'); frame();
      const e = ui.top();
      ok(e.debug && !e.asm && st.sc.stage === 1, 'Смотреть opens the picture at the chosen stage');
      key('ArrowRight'); frame();
      eq(EID_STAGE_LIST[sc.stage], 3, '→ in the picture view steps to E3');
      key('Enter'); frame();
      ok(e.asm && e.asm.from === 1 && e.asm.to === 3, 'Enter plays the assembly from the previous stage');
      frame(Math.ceil((e.asm.total + 0.7) / 0.05));
      ok(!e.asm, 'the assembly ends on its own');
      key('ArrowRight'); key('ArrowRight'); frame();
      eq(sc.stage, 0, 'the stages wrap around to E0');
      key('Enter'); frame();
      ok(e.asm && e.asm.from === 0 && e.asm.to === 6 && EID_STAGE_LIST[sc.stage] === 6, 'the assembly from E0 builds the whole picture up to E6');
      key('Space'); frame();
      ok(!e.asm, 'any key skips the assembly');
      const e0 = eidIds.indexOf(sc.id);
      key('KeyE'); frame();
      eq(sc.id, eidIds[(e0 + 1) % eidIds.length], 'Q/E in the picture view switch the character');
      key('Escape'); frame();
      ok(ui.top() === menu, 'Esc leaves the picture view');
      eq(JSON.stringify({ roster: gs.roster, jade: gs.jade, warpN: gs.warpN, log: gs.warpLog.length, inv: gs.inv }), before, 'watching scenes does not change the save');
      key('Enter'); frame(); key('F8'); frame();
      ok(ui.top() === menu, 'F8 in a scene view returns to the debug menu');
    }
    for (let i = 0; i < 5; i++) { key('Digit' + (i + 1)); for (let r = 0; r < 12; r++) { key('ArrowDown'); frame(); } }
    key('F8'); frame();
    ok(!ui.screens.some(x => x.debug), 'F8 closes the debug menu');
    key('F8'); frame();
    ok(ui.top().debug, 'F8 opens the debug menu over a cinematic');
    {
      const below = ui.screens[ui.screens.length - 2], t0 = below.show && below.show.t;
      frame(20);
      ok(below.show && below.show.t === t0, 'a cinematic under the debug menu waits');
    }
    key('Escape'); frame();
    ok(!ui.screens.some(x => x.debug), 'Esc closes the debug menu');
    Object.assign(gs, snap);
  }
  {
    const used = new Set(), cgs = new Set();
    for (const steps of Object.values(H.SCRIPTS)) for (const st of steps) { if (st && st.cine) used.add(st.cine); if (st && st.cg) cgs.add(st.cg); }
    for (const id of used) ok(H.Cine.CINES[id], 'cinematic exists ' + id);
    for (const id of Object.keys(H.Cine.CINES)) ok(used.has(id), 'cinematic is used by the script ' + id);
    for (const id of cgs) ok(H.Cine.STILLS[id], 'cg still exists ' + id);
    ok(ui.top() && ui.top().show && ui.top().show.id === 'c_attack', 'a new game opens with the station attack cinematic');
    let shots = 0, subs = 0;
    for (const [id, def] of Object.entries(H.Cine.CINES)) {
      const p = new H.Cine.Player(ui, id);
      def.shots.forEach((s, i) => {
        ok(s.d >= 1 && typeof s.draw === 'function', 'shot timing ' + id + ' #' + i);
        for (const [t0, line] of s.sub || []) {
          const head = line.slice(0, line.indexOf('|')), spk = head.split('=')[0], text = line.slice(line.indexOf('|') + 1);
          ok(t0 < s.d - 0.8 && text && !/—/.test(text) && (spk === '' || spk === '@' || H.SPEAKERS[spk]), 'subtitle ' + id + ' #' + i + ' ' + text.slice(0, 30));
          subs++;
        }
        p.i = i;
        for (const tt of [0, s.d * 0.5, s.d]) { p.t = tt; p.T = tt + i; p.draw(ui.ctx); }
        shots++;
      });
      p.i = 0; p.t = 0;
      let guard = 0;
      while (!p.done && guard++ < 200) { p.key('ok'); p.tick(0.1); }
      ok(p.done, 'Enter walks through every shot of ' + id);
      const q = new H.Cine.Player(ui, id);
      q.key('back'); for (let k = 0; k < 10; k++) q.tick(0.1);
      ok(q.done, 'Esc skips ' + id);
    }
    ok(shots >= 100 && subs >= 150, 'cinematics have ' + shots + ' shots and ' + subs + ' subtitles');
    for (const id of Object.keys(H.Cine.STILLS)) ok(H.Cine.still(ui.ctx, id, 640, 480, 1.5, ui.game), 'still draws ' + id);
    const seen = [];
    let guard = 0;
    while (guard++ < 600 && ui.mode !== 'battle') {
      const top = ui.top();
      if (top && top.show && !seen.includes(top.show.id)) seen.push(top.show.id);
      key('Enter'); frame(1);
    }
    eq(seen.join(), 'c_attack,c_elevator', 'the prologue plays its cinematics in order before the first fight');
    eq(ui.mode, 'battle', 'Kafka reaches the first battle');
    eq(ui.game.state.party.join(), 'kafka,silverwolf', 'the first battle is fought by Kafka and Silver Wolf');
    const vs = H.newState();
    Object.assign(vs, { map: 'hs_base', x: null, y: null, hsv: 2 });
    for (const f of ['kafka_go', 'kafka_hall', 'kafka_route', 'kafka_room', 'kafka_hack', 'kafka_curio']) vs.flags[f] = true;
    ui.game = new H.Game({ state: vs, seed: 9 });
    ui.game.setGuest(['kafka', 'silverwolf'], { solo: true, lvl: 12 });
    ui.screens = []; ui.enterField();
    ui.game.runScript('base_screen'); frame(2);
    seen.length = 0; guard = 0;
    while (guard++ < 600) {
      const top = ui.top();
      if (top && top.show && !seen.includes(top.show.id)) seen.push(top.show.id);
      const p = ui.game.pending;
      if (p && p.type === 'ui' && p.ui === 'name') break;
      key('Enter'); frame(1);
    }
    eq(seen.join(), 'c_vessel', 'the vault scene plays the vessel cinematic');
    ok(ui.top() && !ui.top().show && ui.game.pending && ui.game.pending.ui === 'name', 'the vessel screen is open');
    key('ArrowRight'); key('Enter'); frame(2);
    eq(ui.game.state.name, 'Стелла', 'the second vessel is Stelle');
    guard = 0;
    while (guard++ < 900 && ui.mode !== 'battle') {
      const top = ui.top();
      if (top && top.show && !seen.includes(top.show.id)) seen.push(top.show.id);
      key('Enter'); frame(1);
    }
    eq(ui.mode, 'battle', 'the prologue reaches the first battle of the Trailblazer');
    eq(seen.slice(1).join(), 'c_awaken,c_wake', 'the awakening cinematics play after the choice');
    eq(ui.game.state.party.join(), 'trail,march', 'March joins before the first battle');
  }

  const st = H.newState();
  Object.assign(st, { name: 'Стелла', gender: 'f', map: 'express', x: null, y: null, jade: 3200, credits: 30000, obj: 'Проверка' });
  for (const f of ['intro', 'doom', 'express_intro', 'jarilo_arrive']) st.flags[f] = true;
  for (const id of Object.keys(H.CHARS)) if (id !== 'trail_p') st.roster[id] = { lvl: 30, exp: 10, eid: 1, cone: null, relics: {}, hp: null, energy: 0 };
  st.party = ['trail', 'march', 'arlan', 'himeko'];
  st.inv.items = { medkit: 2, soup: 1, exp1: 3, pass: 2, fuse: 1 };
  const game = new H.Game({ state: st, seed: 5 });
  for (const id of Object.keys(H.CONES)) game.addCone(id);
  for (let i = 0; i < 12; i++) game.rollRelic(30);
  for (const k of st.party) game.autoEquip(k);
  game.equipCone('march', game.state.inv.cones[0].uid);
  ui.game = game; ui.screens = []; ui.enterField();
  game.pending = { type: 'say', spk: 'pompom', text: 'Пассажир!' }; frame(3);
  ok(!ui.screens.length && ui.dlg && !game.state.flags.events_note, 'the events notice waits until the dialogue ends');
  game.pending = null; ui.toasts = [{ text: 'Новое задание: проверка', t: 0.2 }]; frame(2);
  ok(!ui.screens.length, 'the events notice waits for the toasts to fade');
  frame(6);
  {
    const note = ui.top();
    ok(note && !note.full && game.state.flags.events_note, 'the events notice opens once the events are unlocked');
    key('Enter'); frame();
    ok(ui.top() && ui.top().ev && ui.top().ev().id === 'comet', 'the notice button opens the Comet Gift');
    key('Escape'); frame(3);
    ok(!ui.screens.length, 'closing the events returns to the field without a second notice');
  }
  key('Escape'); frame();
  ok(ui.top() && ui.top().draw, 'phone menu opens with Esc');
  for (let i = 0; i < 12; i++) { ui.top().sel = i; frame(); }
  {
    const ph = ui.top();
    ph.sel = 2; key('ArrowRight'); frame();
    ok(ph.rail === 0, 'right from the last tile column moves to the side panel');
    key('Enter'); frame();
    ok(ui.top() !== ph && ui.top().full && ui.top().list, 'the envelope opens the mail');
    key('Escape'); frame();
    key('ArrowDown'); frame(); eq(ph.rail, 1, 'down moves to the settings gear');
    key('Enter'); frame(); ok(ui.top() !== ph && !ui.top().full, 'the gear opens the settings');
    key('Escape'); frame();
    key('ArrowLeft'); frame(); ok(ph.rail === -1 && ph.sel === 2, 'left returns to the tile grid');
    ph.sel = 0; key('ArrowLeft'); frame(); ok(ph.rail === 1 && ph.from === 2, 'left from the first column wraps to the side panel');
    key('ArrowRight'); frame(); ok(ph.rail === -1 && ph.sel === 0, 'right from the panel wraps to the first column');
    ph.sel = 9; key('Enter'); frame();
    ok(ui.top() !== ph && ui.top().ev, 'the Events tile opens the events');
    ui.screens = [ph]; ph.sel = 11; key('Enter'); frame();
    ok(ui.top() !== ph && ui.top().full && ui.top().focus, 'the last tile opens Messages');
    ui.screens = [ph]; ph.sel = 2; key('ArrowRight'); ph.rail = ph.railSel = 1; key('ArrowDown'); frame();
    eq(ph.rail, 2, 'the exit to the title sits under the settings gear');
    key('Enter'); frame();
    ok(ui.top() !== ph && !ui.top().full, 'the exit asks before leaving to the title');
    key('Escape'); frame();
    ui.screens = [ph]; frame();
  }
  {
    const keepScr = ui.screens.slice(), keepRoster = JSON.parse(JSON.stringify(game.state.roster)), keepParty = game.state.party.slice();
    for (const k of Object.keys(H.CHARS)) if (k !== 'trail_p' && !game.state.roster[k]) game.debugChar(k, 10, 0);
    ui.screens = []; ui.openChars('march'); frame();
    const cs = ui.top(), list = ui.rosterKeys(), slotHits = () => ui.hits.filter(h => h.y === 4 && h.h === 46 && h.w === 36);
    ok(list.length > 9 && slotHits().length === 9, 'a full roster shows nine portraits in the strip (' + list.length + ' characters)');
    let kept = true;
    for (let i = 0; i < list.length + 2; i++) { key('KeyE'); frame(10); const at = list.indexOf(cs.k); if (at < cs.rTop || at >= cs.rTop + 9 || cs.rPos !== cs.rTop) kept = false; }
    ok(kept, 'Q/E keep the chosen character inside the strip and the scroll settles');
    ok(slotHits().every(h => h.x >= 230 && h.x + h.w <= 232 + 9 * 36 + 2), 'only portraits inside the strip take clicks');
    cs.k = list[0]; frame(10);
    const k0 = cs.k, wz = ui.wheels.find(w => w.y === 0 && w.h === 54);
    ok(wz, 'the strip takes the mouse wheel');
    ui.wheel({ clientX: wz.x + wz.w / 2, clientY: 20, deltaY: 120, preventDefault: noop }); frame(10);
    ok(cs.rTop === 1 && cs.k === k0, 'the wheel scrolls the strip without changing the character');
    const right = ui.hits.find(h => h.x === 232 + 9 * 36 + 2 && h.h === 46);
    ui.click({ clientX: right.x + 4, clientY: right.y + 20, button: 0 }); frame(10);
    ok(cs.rTop === Math.min(1 + 8, list.length - 9) && cs.k === k0, 'the right arrow pages the strip');
    game.state.roster = keepRoster; game.state.party = keepParty;
    ui.screens = []; ui.openChars(game.state.party[0]); frame();
    ok(ui.rosterKeys().length > 9 || !ui.wheels.some(w => w.y === 0 && w.h === 54), 'a short roster has no strip scrolling');
    const closeOf = open => { ui.screens = []; open(); frame(); const s0 = ui.top(), b = ui.hits.find(h => h.w === 22 && h.h === 22); if (!b) return false; ui.click({ clientX: b.x + 11, clientY: b.y + 11, button: 0 }); frame(); return ui.top() !== s0; };
    for (const [name, open] of [['Archive', () => ui.openBank(null)], ['Save', () => ui.openSaves('save')], ['Load', () => ui.openSaves('load')], ['Controls', () => ui.openGuide()], ['Settings', () => ui.openSettings()]]) ok(closeOf(open), name + ' closes with its cross button');
    ui.screens = keepScr; frame();
  }
  ui.openChars('march');
  for (let s = 0; s < 5; s++) { ui.top().sec = s; frame(); key('KeyE'); frame(); }
  {
    const texts = [];
    for (const [k, inf] of Object.entries(H.INFO)) {
      ok(H.CHARS[k] && inf.full && inf.faction && inf.about, 'info ' + k + ' has full name, faction and about');
      ok(inf.story.length >= 1 && inf.story.length <= H.STORY_NUM.length && inf.story.every(st => st.text && (!st.need || !st.need.lvl || st.need.lvl <= H.MAX_LVL)), 'info ' + k + ' story parts unlock within the level cap');
      ok(inf.voice.length && inf.battle.length && inf.voice.concat(inf.battle).every(v => v.h || (v.t && v.text)), 'info ' + k + ' voice lines have titles and text');
      ok((inf.intro || []).every(q => q.q && q.a && q.by && q.note), 'info ' + k + ' introduction notes are complete');
      ok((inf.extra || []).every(e => e.h && e.text), 'info ' + k + ' extra dossier blocks have a heading and text');
      const needs = [].concat(inf.intro || [], inf.extra || [], inf.story, inf.voice, inf.battle).map(x => x.need).filter(Boolean);
      ok(needs.every(n => (!n.char || H.CHARS[n.char]) && (!n.eid || n.eid <= 6)), 'info ' + k + ' unlock conditions name real characters');
      texts.push(inf.full, inf.aka || '', inf.faction, inf.home || '', inf.about, ...(inf.intro || []).flatMap(q => [q.q, q.a, q.note]), ...(inf.extra || []).flatMap(e => [e.h, e.text]), ...inf.story.map(st => st.text), ...inf.voice.concat(inf.battle).flatMap(v => [v.h || v.t, v.text || '']));
    }
    ok(Object.keys(H.CHARS).filter(k => k !== 'trail_p').every(k => H.INFO[k]), 'every roster character has an information page');
    ok(texts.every(t => !/[—–]/.test(t) && !/Microsoft|Windows/.test(t)), 'info texts have no em dashes or real brand names');
    const cs = ui.top(), infoSec = 5, keepLvl = game.state.roster.march.lvl;
    cs.k = 'march'; cs.sec = infoSec; frame();
    key('Enter'); frame();
    ok(cs.infoFocus, 'Enter focuses the info text');
    const pages = new Set([cs.infoPage]);
    for (let i = 0; i < 3; i++) { key('ArrowRight'); frame(); pages.add(cs.infoPage); }
    eq(pages.size, 3, 'arrows cycle the three info pages');
    cs.infoPage = 2; frame(); key('ArrowDown'); key('ArrowDown'); frame();
    ok(cs.infoSc.top > 0, 'arrows scroll the voice lines');
    key('ArrowRight'); frame();
    eq(cs.infoSc.top, 0, 'a new page starts at the top');
    game.state.roster.march.lvl = 1;
    cs.infoPage = 1; frame();
    const lockedRows = cs.infoRows('march', H.CHARS.march, 200).filter(r => r.lock).length;
    game.state.roster.march.lvl = H.MAX_LVL; frame();
    const openRows = cs.infoRows('march', H.CHARS.march, 200).filter(r => r.lock).length;
    ok(lockedRows === H.INFO.march.story.length - 1 && openRows === 0, 'story parts unlock with the character level (' + lockedRows + ' locked at level 1)');
    game.state.roster.march.lvl = keepLvl;
    const bare = ui.rosterKeys().find(k => !H.INFO[k]);
    if (bare) { cs.k = bare; for (let p = 0; p < 3; p++) { cs.infoPage = p; frame(); } ok(cs.infoRows(bare, H.CHARS[game.kitOf(bare)], 200).length > 0, 'a character without info still shows the basic file'); }
    key('Escape'); frame();
    ok(!cs.infoFocus && ui.top() === cs, 'Esc leaves the info text first');
    cs.k = 'march';
  }
  ui.top().sec = 2; key('Enter'); frame(); ok(ui.top().slotFocus, 'relic slots take focus');
  key('Enter'); frame(); key('Enter'); frame();
  ok(Object.keys(game.state.roster[ui.top().k].relics).length >= 1, 'relic equipped from the character screen');
  {
    const cs = ui.top(), seen = new Set([cs.slot]);
    game.give({ ornament: [{ set: 'salsotto', n: 1, rl: 9 }, { set: 'vonwacq', n: 1, rl: 3 }] });
    for (const k of ['ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowDown', 'ArrowLeft']) { key(k); frame(); seen.add(cs.slot); }
    eq(seen.size, 6, 'arrows reach all six relic slots (' + [...seen].join() + ')');
    cs.slot = 4; frame();
    const rects = cs.relicSlotRects(), fl = 306 - H.Gfx.FIG_W * 1.5, fr = 306 + H.Gfx.FIG_W * 1.5;
    ok(rects.length === H.RELIC_SLOTS.length && rects.every(([x]) => x + 46 <= fl + 2 || x >= fr - 2), 'relic slots stay beside the figure');
    key('Enter'); frame();
    ok(ui.top() !== cs, 'Enter on the sphere slot opens the ornament list');
    key('Enter'); frame();
    const k = cs.k, rr = game.state.roster[k];
    ok(rr.relics.sphere && game.state.inv.relics.find(x => x.uid === rr.relics.sphere).slot === 'sphere', 'a sphere goes into the sphere slot');
    cs.slot = 5; key('Enter'); frame(); key('Enter'); frame();
    ok(rr.relics.rope, 'a rope goes into the rope slot');
    const rows = ui.setRows(k), sph = game.state.inv.relics.find(x => x.uid === rr.relics.sphere), rp = game.state.inv.relics.find(x => x.uid === rr.relics.rope);
    if (sph.set === rp.set) ok(rows.some(r => r.head.startsWith(H.RELIC_SETS[sph.set].name) && r.lines.length === 2), 'an active planar set shows its bonus and its condition');
    else ok(rows.some(r => r.head === 'Без пары'), 'two different ornaments are listed without a pair');
    const texts = [], realText = ui.text;
    ui.text = function (str, ...rest) { texts.push(String(str)); return realText.call(this, str, ...rest); };
    frame();
    delete ui.text;
    ok(texts.some(t => t === 'Сфера') && texts.some(t => t === 'Вязь'), 'the planar slots are labelled Сфера and Вязь');
    ok(texts.some(t => /Соединительная вязь/.test(t)), 'the panel names the full Link Rope slot');
    ui.openInventory(4); frame();
    for (let i = 0; i < 8; i++) { key('ArrowRight'); frame(); }
    key('Escape'); frame();
    cs.slotFocus = false;
  }
  ui.top().sec = 1; key('Enter'); frame(); key('ArrowRight'); key('Enter'); frame();
  {
    const cs = ui.top(), pts = cs.eidolonPoints(), look = H.Gfx.lookOf(game.kitOf(cs.k), game);
    const figL = 306 - H.Gfx.FIG_W * 1.5, figR = 306 + H.Gfx.FIG_W * 1.5, figTop = 444 - H.Gfx.FIG_FOOT * 3;
    ok(look && pts.length === 6 && pts.every(([x, y]) => x + 8 < figL || x - 8 > figR || y + 8 < figTop), 'no Eidolon node sits behind the figure');
    ok(pts.every(([x, y]) => x - 18 > 182 && x + 18 < 440 && y - 18 > 48 && y + 28 < 462), 'Eidolon nodes stay between the section list, the panel, the roster strip and the hints');
    cs.sec = 4; frame();
    ok(!cs.starFocus && cs.star === 0, 'the first Eidolon is selected without focus');
    const nodeHit = i => ui.hits.filter(h => h.x === pts[i][0] - 18 && h.y === pts[i][1] - 18).pop();
    ok([0, 1, 2, 3, 4, 5].every(i => nodeHit(i)), 'every Eidolon node takes clicks');
    nodeHit(3).fn(); frame();
    ok(cs.star === 3 && cs.starFocus, 'a click on Eidolon IV selects it');
    const texts = [], realText = ui.text;
    ui.text = function (str, ...rest) { texts.push(String(str)); return realText.call(this, str, ...rest); };
    frame();
    const r = game.state.roster[cs.k], kitId = game.kitOf(cs.k), gain = game.baseStats(kitId, r.lvl, 4).hp - game.baseStats(kitId, r.lvl, 3).hp;
    ok(texts.includes('Эйдолон IV') && texts.includes('закрыт') && texts.includes('+' + gain), 'the panel describes the selected Eidolon with its real stat gain');
    ok(texts.some(t => t.includes('Дубликатов до открытия: ' + (4 - r.eid))), 'a locked Eidolon shows how many duplicates it needs');
    key('ArrowUp'); frame(); eq(cs.star, 3, 'up stays on the top node of the right side');
    key('ArrowDown'); frame(); eq(cs.star, 4, 'down moves along the right side');
    key('ArrowLeft'); key('ArrowLeft'); frame(); eq(cs.star, 2, 'left crosses the arch to the left side');
    key('ArrowDown'); key('ArrowDown'); key('ArrowDown'); frame(); eq(cs.star, 0, 'down stops at Eidolon I');
    texts.length = 0; frame();
    ok(texts.includes('Эйдолон I') && texts.includes('открыт'), 'an open Eidolon is marked as open');
    delete ui.text;
    eq(cs.sec, 4, 'arrows stay inside the constellation while it has focus');
    key('Escape'); frame(); ok(ui.top() === cs && !cs.starFocus, 'Esc leaves the constellation before it closes the screen');
    key('Enter'); frame(); ok(cs.starFocus, 'Enter returns the focus to the constellation');
    key('Escape'); frame();
  }
  {
    const E = H.Eidolons, keys = Object.keys(H.CHARS).filter(k => k !== 'trail_p'), R = game.state.roster, DASH = String.fromCharCode(8212);
    ok(E && keys.every(k => E.has(k)), 'every character has an Eidolon picture');
    for (const k of keys) {
      const sc = E.SCENES[k];
      ok(sc.title && sc.frags.length === 6 && typeof sc.paint === 'function' && typeof sc.decor === 'function' && typeof sc.life === 'function' && E.AURA[sc.aura], 'Eidolon picture data ' + k);
      ok(new Set(sc.frags.map(f => f[0])).size === 6 && ui.measure(sc.title, 11) <= 168, 'fragment names are unique and the title fits the panel: ' + k);
      for (const [name, text] of sc.frags) {
        const t = game.fill(text);
        ok(name && t && !name.includes(DASH) && !t.includes(DASH) && !/(^|[ ,])не [^,.]+, а /i.test(t) && !/{|}/.test(t), 'fragment text ' + k + ': ' + name);
        ok(ui.wrap(t, 168, 10).length <= 3 && ui.measure('«' + name + '»', 12, true) <= 168, 'fragment fits the panel ' + k + ': ' + name);
      }
    }
    const pts = E.nodes();
    ok(E.SLOTS.every(([c, r], i) => pts[i][0] === (c * E.CW + E.CW / 2) * E.SC && pts[i][1] === (r * E.CH + E.CH / 2) * E.SC), 'Eidolon stars sit on the centres of their puzzle pieces');
    ok(E.SLOTS.every((_, i) => { const p = E.slotPts(i), a = p[0], b = p[p.length - 1]; return p.length > 40 && Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6; }), 'every puzzle piece outline is closed');
    eq([0, 1, 2, 3, 4, 5, 6].map(n => { const v = E.view('march', n); return '' + v.colorK + v.decorK + v.lifeK; }).join(), '000,100,100,110,110,110,111', 'picture stages: colour at Eidolon I, decor at III, life at VI');
    ui.screens = []; ui.openChars('march');
    const cs = ui.top(); cs.sec = 4;
    for (const k of keys) for (const n of [0, 1, 3, 6]) { const was = R[k].eid; R[k].eid = n; delete R[k].eidSeen; cs.k = k; frame(); R[k].eid = was; }
    ok(!cs.asm, 'pictures of every character render at every stage without an assembly');
    const rm = R.march; rm.eid = 3; rm.eidSeen = 0;
    ok(game.eidNew('march') === 3 && game.alerts().chars, 'new Eidolon pieces raise the characters alert');
    let badges = 0;
    ui.badge = function (...a) { badges++; return H.UI.prototype.badge.apply(this, a); };
    ui.screens = []; ui.openMenu(); frame();
    ok(badges >= 1, 'the phone marks the characters tile');
    ui.openChars('march'); const s2 = ui.top(); badges = 0; frame();
    ok(badges >= 2 && !s2.asm, 'the roster strip and the Eidolons section carry the badge');
    delete ui.badge;
    s2.sec = 4; frame();
    ok(s2.asm && s2.asm.from === 0 && s2.asm.to === 3 && s2.asm.shown() === 0, 'opening the Eidolons starts the assembly of the new pieces');
    frame(20);
    const mid = s2.asm ? s2.asm.shown() : 3;
    ok(mid >= 1 && mid < 3, 'pieces are placed one by one (' + mid + ' after a second)');
    frame(200);
    ok(!s2.asm && game.eidNew('march') === 0 && rm.eidSeen === undefined && !game.alerts().chars, 'the assembly ends and the pieces count as seen');
    rm.eidSeen = 2; frame();
    ok(s2.asm && s2.asm.from === 2, 'a new piece starts another assembly');
    key('Enter'); frame();
    ok(!s2.asm && !game.eidNew('march') && s2.sec === 4, 'any key skips the assembly');
    key('KeyV'); frame();
    const vw = ui.top();
    ok(vw !== s2 && vw.full && vw.k === 'march', 'V opens the picture view');
    key('KeyE'); frame(); ok(vw.k !== 'march', 'E shows the picture of the next character');
    key('Escape'); frame(); ok(ui.top() === s2, 'Esc closes the picture view');
    const texts = [];
    ui.text = function (str, ...rest) { texts.push(String(str)); return H.UI.prototype.text.call(this, str, ...rest); };
    s2.star = 5; s2.starFocus = true; frame();
    delete ui.text;
    ok(texts.includes('«' + E.SCENES.march.frags[5][0] + '»') && texts.some(t => t.includes('оживит героя')) && texts.includes(E.SCENES.march.title), 'the panel names the fragment, the picture and what Eidolon VI brings');
    const ctx = ui.ctx, look = H.Gfx.lookOf('march', game);
    let draws = 0;
    ctx.drawImage = () => { draws++; };
    E.figure(ctx, look, 306, 444, 3, 1.0, 1, 'march'); const live = draws; draws = 0;
    E.figure(ctx, look, 306, 444, 3, 1.0, 0, 'march'); const still = draws;
    ctx.drawImage = noop;
    ok(live === 2 && still === 1, 'at Eidolon VI the figure is drawn in two parts so it breathes');
    const sv = R.seele; sv.eid = 2; delete sv.eidSeen;
    eq(game.addChar('seele'), 'eid', 'a duplicate still raises the Eidolon');
    ok(sv.eid === 3 && game.eidNew('seele') === 1, 'a duplicate leaves its piece to be placed');
    const pl = R.pela; pl.eid = 1; delete pl.eidSeen;
    game.debugChar('pela', 30, 4); ok(game.eidNew('pela') === 3, 'the debug grant leaves its pieces to be placed');
    game.debugChar('pela', 30, 0); ok(game.eidNew('pela') === 0 && pl.eidSeen === undefined, 'lowering the Eidolons clears the pending pieces');
    for (const k of keys) delete R[k].eidSeen;
  }
  ui.screens = [];
  ui.openTeam(); frame(); key('ArrowRight'); key('ArrowRight'); key('ArrowRight'); key('Enter'); frame();
  ui.top().sel = ui.rosterKeys().indexOf('seele'); key('Enter'); frame();
  ok(game.state.party.includes('seele') && game.state.party.length === 4, 'team slot filled from the picker');
  key('KeyL'); frame(); eq(game.state.party[0], 'seele', 'L makes the slot leader');
  ui.screens = [];
  for (let t = 0; t < 5; t++) { ui.openInventory(t); frame(); key('ArrowRight'); frame(); ui.screens = []; }
  ui.openInventory(0); key('Enter'); frame(); ui.screens = [];
  ui.openWarp(null); frame();
  const pass0 = game.state.inv.items.pass || 0;
  key('ArrowRight'); key('Enter'); for (let i = 0; i < 60; i++) frame();
  ok((game.state.inv.items.pass || 0) === 0 && game.state.jade < 3200 + 1600, 'ten-warp spends passes then jade (' + pass0 + ' passes)');
  ok(ui.top().show && ui.top().show.phase === 'cine', 'a real ten-warp starts the 3D cinematic');
  key('Enter'); frame(); key('Enter'); frame(); ui.screens = [];
  {
    const SH = H.WARP_SHOTS, total = H.WARP_CINE;
    ok(total > 10 && total < 15 && SH.map(x => x[0]).join() === 'ticket,tunnel,flyby,brake,walk,door', 'warp cinematic: six shots, ' + total.toFixed(1) + ' s');
    const fake = (rar, kind, id) => ({ rar, kind, id, name: kind === 'char' ? H.CHARS[id].name : H.CONES[id].name, res: kind === 'char' ? 'new' : undefined });
    for (const best of [3, 4, 5]) {
      ui.screens = []; ui.openWarp(null);
      const scr = ui.top(), top = best === 5 ? fake(5, 'char', 'bronya') : best === 4 ? fake(4, 'char', 'arlan') : fake(3, 'cone', 'void');
      scr.start([fake(3, 'cone', 'arrows'), top, fake(best, 'cone', best === 5 ? 'moment' : best === 4 ? 'swordplay' : 'amber')]);
      const show = scr.show, shots = new Set();
      eq(show.best, best, 'door light follows the best rarity (' + best + '★)');
      for (let t = 0; t < total + 0.2; t += 0.1) { shots.add(show.shot()[0]); frame(1, 0.1); }
      ok(SH.every(([n]) => shots.has(n)), 'every warp shot renders for ' + best + '★');
      eq(show.phase, 'reveal', 'the cinematic ends on the first reveal (' + best + '★)');
      eq(show.cur, 0, 'reveals keep the pull order');
      for (let i = 0; i < 12 && show.phase === 'reveal'; i++) { frame(8, 0.1); key('Enter'); frame(1, 0.1); key('Enter'); frame(1, 0.1); }
      eq(show.phase, 'rack', 'reveals end on the results rack (' + best + '★)');
      ok(show.seen.size === 3, 'every item was revealed once');
      frame(20, 0.1); key('Enter'); frame();
      ok(!scr.show, 'Enter on the rack returns to the banner (' + best + '★)');
    }
    ui.screens = []; ui.openWarp(null);
    let scr = ui.top();
    scr.start([fake(3, 'cone', 'amber'), fake(5, 'char', 'seele')]); frame(5, 0.1);
    const stray = () => { const st = scr.show && [scr.show.phase, scr.show.cur, scr.show.t.toFixed(2), scr.show.rt.toFixed(2)].join(); key('Space'); key('KeyE'); ui.click({ clientX: 320, clientY: 240, button: 0 }); ui.click({ clientX: 100, clientY: 400, button: 0 }); return st === [scr.show.phase, scr.show.cur, scr.show.t.toFixed(2), scr.show.rt.toFixed(2)].join(); };
    ok(stray(), 'Space, other keys and stray clicks do not skip the warp cinematic');
    key('Enter'); frame();
    ok(scr.show.phase === 'reveal' && scr.show.cur === 0, 'Enter skips the cinematic to the first reveal');
    key('Enter'); frame(); key('Enter'); frame();
    ok(scr.show.cur === 1 && scr.show.rt < H.WARP_PRE, 'the 5★ reveal starts with the star prelude');
    ok(stray(), 'Space, other keys and stray clicks do not skip a character intro');
    key('NumpadEnter'); frame(); ok(scr.show.rt >= scr.show.intro(), 'Enter completes a reveal intro first');
    key('Enter'); frame();
    eq(scr.show.phase, 'rack', 'Enter after the last reveal goes to the results');
    ok(stray(), 'stray clicks do not close the results rack');
    frame(20, 0.1); key('Enter'); frame();
    ok(!scr.show, 'Enter closes the results rack');
    ui.screens = []; ui.openWarp(null); scr = ui.top();
    const ten = [];
    for (let i = 0; i < 10; i++) ten.push(i === 4 ? fake(5, 'char', 'seele') : i === 7 ? fake(4, 'cone', 'memories') : fake(3, 'cone', 'amber'));
    scr.start(ten); frame(5, 0.1);
    key('Escape'); frame();
    ok(scr.show.phase === 'reveal' && scr.show.cur === 4, 'Esc in the cinematic still shows the 5★ reveal');
    const btn = ui.hits.find(h => h.x > 480 && h.y === 10);
    ok(btn, 'the reveal has the «К итогам» button');
    ui.click({ clientX: btn.x + 5, clientY: btn.y + 5, button: 0 }); frame();
    eq(scr.show.phase, 'rack', 'the «К итогам» button goes to the results');
    key('Escape'); frame(); ok(!scr.show, 'Esc on the rack closes the warp results');
    ui.screens = []; ui.openWarp(null); scr = ui.top();
    scr.start([fake(3, 'cone', 'chorus')]); frame(3, 0.1);
    key('Escape'); frame();
    ok(scr.show && scr.show.phase === 'reveal', 'a single warp skip shows its only item');
    key('Escape'); frame();
    ok(!scr.show, 'a single warp closes after its reveal');
    ui.screens = [];
  }
  {
    const WI = H.WarpIntro, pulled = new Set();
    for (const p of [...H.WARP_POOL.five, ...H.WARP_POOL.four]) if (!p.startsWith('cone:')) pulled.add(p);
    for (const [id, st] of Object.entries(H.BANNERS.ev.stars)) { pulled.add(id); for (const f of st.four) pulled.add(f); }
    pulled.add('kazuma');
    const audio = require('fs').readFileSync(path.join(DIR, 'hsr-audio.js'), 'utf8'), SFX = new Set([...audio.matchAll(/case '([a-z0-9_]+)':/g)].map(m => m[1]));
    ok(pulled.size >= 18, 'the Warp can give ' + pulled.size + ' characters');
    for (const id of Object.keys(WI.SHOWS)) ok(pulled.has(id), 'a Warp intro belongs to a character from the Warp: ' + id);
    const gender0 = game.state.gender;
    for (const id of pulled) {
      const sh = WI.SHOWS[id], rar = H.CHARS[id].rarity;
      ok(sh && typeof sh.act === 'function', 'Warp intro exists for ' + id);
      if (!sh) continue;
      ok(rar === 5 ? sh.d >= 3.8 && sh.d <= 4.6 : id === 'kazuma' ? sh.d >= 4.2 && sh.d <= 5 : sh.d >= 2.8 && sh.d <= 3.6, 'the Warp intro of ' + id + ' fits its rarity (' + sh.d + ' s)');
      eq(WI.length(id), WI.SIGN + sh.d, 'the Path sign comes before the intro of ' + id);
      for (const gd of ['m', 'f']) {
        game.state.gender = gd;
        const said = WI.line(id, game);
        ok(said && !/[—–{}]/.test(said) && said.length <= 58, 'the Warp line of ' + id + ' fits the card (' + gd + '): ' + said);
      }
      ok(sh.sfx.every(([x, s], i) => x >= 0 && x <= sh.d && SFX.has(s) && (!i || sh.sfx[i - 1][0] <= x)), 'the Warp intro sounds of ' + id + ' are known and in order');
      const cues = WI.cues({ id, rar });
      ok(cues.every(([x], i) => x <= WI.length(id) && (!i || cues[i - 1][0] <= x)) && cues.some(([, s]) => s === (rar === 5 ? 'star5' : 'star4')), 'the cues of ' + id + ' start with the Path sign and stay in order');
      for (const std of [false, true]) for (let t = 0; t < WI.length(id) + 1.5; t += 0.1) WI.render(game, { id, rar, kind: 'char' }, t, std);
    }
    game.state.gender = gender0;
    for (const p of Object.keys(H.PATHS)) {
      const fx = WI.PATH_FX[p];
      ok(fx && fx.hue && fx.flash && SFX.has(fx.sfx) && typeof fx.bg === 'function' && typeof fx.out === 'function', 'every Path has its sign: ' + p);
      ok(WI.shapes(p).length > 0 && WI.shapes(p).every(s => s.len > 0), 'the Path emblem of ' + p + ' can be traced');
      const id = Object.keys(H.CHARS).find(k => H.CHARS[k].path === p);
      for (const rar of [4, 5]) for (let t = 0; t < WI.SIGN; t += 0.05) WI.render(game, { id, rar, kind: 'char' }, t, false);
    }
    const fake = (rar, kind, id, res) => ({ rar, kind, id, name: kind === 'char' ? H.CHARS[id].name : H.CONES[id].name, res });
    const sounds = [], said = [], sfx0 = ui.sfx, text0 = ui.text;
    ui.sfx = function (s) { sounds.push(s); return sfx0.call(this, s); };
    ui.screens = []; ui.openWarp(null);
    const scr = ui.top();
    scr.start([fake(4, 'char', 'serval', 'eid'), fake(5, 'char', 'clara', 'new')]);
    const show = scr.show;
    show.begin([0, 1]);
    eq(show.intro(), WI.length('serval'), 'a 4★ intro has no star prelude');
    sounds.length = 0;
    for (let i = 0; i < 200 && show.rt < show.intro() + 0.5; i++) frame(1, 0.05);
    const want = WI.cues({ id: 'serval', rar: 4 }).map(c => c[1]).join();
    eq(sounds.join(), want, 'the Path sign and the intro play their sounds once, in order');
    ui.text = function (s) { said.push(s); return text0.apply(this, arguments); };
    frame(10, 0.05);
    ui.text = text0;
    ok(said.some(s => s.includes(WI.line('serval', game))), 'the card shows what the character says');
    ok(said.includes('Эйдолон +1'), 'the card keeps the duplicate result');
    key('Enter'); frame();
    eq(show.cur, 1, 'Enter on the card moves to the next character');
    ok(show.rt < H.WARP_PRE, 'a 5★ character still starts with the star prelude');
    eq(show.intro(), H.WARP_PRE + WI.length('clara'), 'a 5★ intro waits for the prelude, the sign and the scene');
    frame(30, 0.05);
    sounds.length = 0;
    key('Enter'); frame(1, 0.05);
    ok(show.rt >= show.intro() && sounds.length === 0, 'Enter jumps to the card without a burst of skipped sounds');
    ui.sfx = sfx0;
    ui.screens = [];
  }
  {
    game.state.jade += 99999;
    for (let i = 0; i < 4; i++) game.warp(i % 2 ? 1 : 10);
    ui.screens = []; ui.openWarp(null); frame();
    key('KeyH'); frame();
    const hist = ui.top();
    ok(hist && hist.rows && hist.full, 'H on the Warp banner opens the warp history');
    eq(hist.rows().length, game.state.warpLog.length, 'history shows every logged pull');
    key('ArrowRight'); frame(); eq(hist.page, 1, 'Right turns the history page');
    for (let i = 0; i < 20; i++) key('ArrowRight');
    frame(); eq(hist.page, hist.pages() - 1, 'paging stops on the last page');
    key('KeyE'); frame();
    ok(hist.filter === 1 && hist.page === 0 && hist.rows().every(e => e.rar >= 4), 'E filters to 4★ and above and resets the page');
    key('KeyE'); frame(); ok(hist.rows().every(e => e.rar === 5), 'second E shows only 5★');
    key('KeyQ'); key('KeyQ'); frame(); eq(hist.filter, 0, 'Q steps the filter back');
    key('Escape'); frame(); ok(ui.top() && !ui.top().rows, 'Esc returns from the history to the banner');
    ui.screens = [];
    ui.openBank(null); ui.top().tab = 3; frame();
    ok(ui.top().rows().length === game.state.warpLog.length, 'Archive lists the warp history');
    key('Enter'); frame(); ok(ui.top().rows && ui.top().full, 'Enter in the Archive opens the full warp history');
    ui.screens = [];
    game.state.inv.items.spass = 1; delete game.state.inv.items.pass;
    ui.openWarp(null); frame();
    const wp = ui.top();
    eq(wp.ban, 'ev', 'a Special Pass opens the Warp on the event banner');
    key('KeyQ'); frame(); eq(wp.ban, 'std', 'Q switches to the standard banner');
    key('KeyE'); frame(); eq(wp.ban, 'ev', 'E switches back to the event banner');
    game.state.evStar = 'ruanmei';
    key('ArrowDown'); frame(); eq(game.evStar(), 'seele', 'Down picks the next event hero');
    for (const id of ['kafka', 'silverwolf', 'blade']) { key('ArrowDown'); frame(); eq(game.evStar(), id, 'Down walks the Stellaron Hunters: ' + id); }
    key('ArrowDown'); frame(); eq(game.evStar(), 'ruanmei', 'the hero list wraps around');
    const card = ui.hits.find(h => h.x > 540 && h.y > 100 && h.y < 112);
    ok(card, 'the hero picker has a card for Seele');
    ui.click({ clientX: card.x + card.w / 2, clientY: card.y + card.h / 2, button: 0 }); frame();
    eq(game.evStar(), 'seele', 'a click on the card picks Seele');
    key('Tab'); frame(); eq(wp.ban, 'cone', 'Tab switches the event tab to the Light Cone channel');
    game.state.coneStar = 'ruanmei';
    key('ArrowDown'); frame(); ok(game.coneStar() === 'seele' && game.evStar() === 'seele', 'Down picks the next signature cone');
    key('KeyE'); frame(); eq(wp.ban, 'sig', 'E leaves the event tab for Signal Search');
    key('KeyQ'); frame(); eq(wp.ban, 'cone', 'Q returns to the event channel used last');
    key('Tab'); frame(); eq(wp.ban, 'ev', 'Tab goes back to the hero channel');
    wp.pull(1); frame();
    ok(wp.show && game.state.warpLog[0].ban === 'ev' && !game.state.inv.items.spass, 'an event warp spends the Special Pass and plays the cinematic');
    for (let i = 0; i < 6 && wp.show; i++) { key('Enter'); frame(); }
    ok(!wp.show, 'the event warp closes after its reveal');
    key('KeyH'); frame();
    const eh = ui.top();
    ok(eh.ban === 'ev' && eh.rows().length === game.state.warpLog.filter(e => e.ban === 'ev' || e.ban === 'cone').length, 'H opens the history of the event tab with both channels');
    key('Tab'); frame(); ok(eh.ban === 'sig' && eh.rows().every(e => e.ban === 'sig' || e.ban === 'amp'), 'Tab shows the Signal Search history');
    key('Tab'); frame(); ok(eh.ban === 'conv' && eh.rows().every(e => e.ban === 'conv' || e.ban === 'forge'), 'Tab shows the Convene history');
    key('Tab'); frame(); ok(eh.ban === 'guild' && eh.rows().every(e => e.ban === 'guild'), 'Tab shows the Guild history');
    key('Tab'); frame(); ok(eh.ban === 'mid' && eh.rows().every(e => e.ban === 'mid' || e.ban === 'comp'), 'Tab shows the Midnight Channel history');
    key('Tab'); frame(); ok(eh.ban === 'std' && eh.rows().every(e => !e.ban), 'Tab shows the standard banner history');
    ui.screens = [];
  }
    {
      const T = H.TUNING;
      game.state.inv.items.vkey = 3;
      delete game.state.flags.velvet_contract;
      ui.screens = []; ui.openWarp(null); frame();
      const vw = ui.top();
      while (vw.ban !== 'mid') { key('KeyE'); frame(); }
      eq(vw.ban, 'mid', 'the Midnight Channel has its own Warp tab');
      vw.pull(1); frame();
      ok(!vw.show && game.contractSigned() && game.state.inv.items.vkey === 3 + T.contractKeys, 'the first pull asks for the contract and pays its key');
      key('ArrowDown'); frame(); eq(game.starOf('mid'), 'kanji', 'Down picks the next tarot card');
      key('Tab'); frame(); eq(vw.ban, 'comp', 'Tab opens the Compendium');
      key('Tab'); frame();
      vw.pull(1); frame();
      ok(vw.show && game.state.warpLog[0].ban === 'mid' && game.state.inv.items.vkey === 2 + T.contractKeys, 'a Midnight Channel pull spends a Velvet Key and plays a show');
      for (let i = 0; i < 8 && vw.show; i++) { key('Enter'); frame(); }
      ok(!vw.show, 'the show closes');
      game.pityOf('mid').guar5 = true; game.pityOf('mid').five = 58; frame();
      game.setStarOf('comp', 'rise'); vw.setChan('comp'); frame();
      ui.screens = [];
      delete game.state.inv.items.vkey; game.state.warpBan = 'ev';
      const mres = [{ kind: 'char', id: 'yu', rar: 5, name: 'Ю', res: 'new' }, { kind: 'cone', id: 'truth', rar: 5, name: H.CONES.truth.name, sup: 1 }, { kind: 'char', id: 'march', rar: 4, name: 'Март', res: 'eid' }, { kind: 'cone', id: 'arrows', rar: 3, name: H.CONES.arrows.name, sup: 2 }];
      const ms = new H.MidnightShow(ui, mres, { ban: 'mid' }), heardM = [], sfxM = ui.sfx;
      ui.sfx = function (x) { heardM.push(x); return sfxM.call(this, x); };
      for (let tt = 0; tt < H.MIDNIGHT_CINE + 0.2; tt += 0.1) { ms.tick(0.1); ms.draw(ui.ctx); }
      ok(ms.phase === 'reveal' && ['step', 'glint', 'whoosh', 'break', 'star5'].every(x => heardM.includes(x)), 'the Midnight Channel film plays its shots and sounds');
      for (let i = 0; i < mres.length; i++) { const L = ms.length(ms.item()); for (let tt = 0; tt < L + 0.6; tt += 0.15) { ms.tick(0.15); ms.draw(ui.ctx); } ms.enter(); }
      ui.sfx = sfxM;
      ok(ms.phase === 'rack', 'every card is revealed, then the spread');
      for (let tt = 0; tt < 1; tt += 0.2) { ms.tick(0.2); ms.draw(ui.ctx); }
      ms.enter(); ok(ms.done, 'Enter closes the spread');
      const m1 = new H.MidnightShow(ui, [mres[0]], { ban: 'mid' });
      m1.skip(); ok(m1.phase === 'reveal', 'Esc on a single pull jumps to its card');
      ok(m1.length(m1.item()) > H.MidnightKit.cutLen('yu') && H.Personas.has('izanagi') && H.MidnightKit.QUOTES.yu.length <= 58, 'Yu has his own scene with Izanagi');
      const P4C = ['yu', 'yosuke', 'chie', 'yukiko', 'kanji', 'rise'];
      ok(P4C.every(id => H.MIDNIGHT_CUTS[id] && H.MidnightKit.QUOTES[id] && H.MidnightKit.QUOTES[id].length <= 58 && !/[—–]/.test(H.MidnightKit.QUOTES[id])) && P4C.every(id => Object.values(H.Personas.ART).some(p => p.owner === id)), 'every Investigation Team member has an own scene, a line and a Persona');
      for (const id of P4C) { const sh = new H.MidnightShow(ui, [{ kind: 'char', id, rar: H.CHARS[id].rarity, name: H.CHARS[id].name, res: 'new' }], { ban: 'mid' }); sh.begin([0]); for (let tt = 0; tt < sh.length(sh.item()); tt += 0.2) { sh.tick(0.2); sh.draw(ui.ctx); } ok(sh.rt >= H.MidnightKit.cutLen(id), 'the scene of ' + id + ' plays to the end'); }
      const heardY = [], sfxY = ui.sfx; ui.sfx = function (x) { heardY.push(x); return sfxY.call(this, x); };
      const my = new H.MidnightShow(ui, [mres[0]], { ban: 'mid' }); my.begin([0]);
      for (let tt = 0; tt < my.length(my.item()) + 0.2; tt += 0.1) { my.tick(0.1); my.draw(ui.ctx); }
      ui.sfx = sfxY;
      ok(['tech', 'ult', 'crit', 'star5'].every(x => heardY.includes(x)), 'Yu scene plays its sounds');
      m1.enter(); m1.enter(); ok(m1.done, 'Enter twice closes a single pull');
      const V = H.VELVET;
      ok(V.arcanaOf('yu') === 0 && V.arcanaOf('kanji') === 4 && V.arcanaOf('rise') === 6 && V.arcanaOf('yosuke') === 1 && V.arcanaOf('chie') === 7 && V.arcanaOf('yukiko') === 2, 'the Investigation Team keeps its own arcana');
      ok(Object.keys(H.CHARS).every(id => V.arcanaOf(id) >= 0 && V.arcanaOf(id) < 22) && Object.keys(H.CONES).every(id => V.arcanaOf(null, id) >= 0 && V.arcanaOf(null, id) < 22), 'every character and cone has an arcana card');
      ok(H.SONGS.aria && H.SONGS.aria.loop[1] - H.SONGS.aria.loop[0] > 160, 'the Aria of the Soul loops over one full pass');
      const party0 = game.state.party.slice();
      game.state.party = ['yu', 'kanji', 'rise', 'yukiko'];
      game.startBattle({ enemies: ['reaver:20', 'eliminator:20', 'flamespawn:20'], lvl: 20, bg: 'snow', music: 'battle' });
      ui.drainGameEvents(); ui.bt.auto = false;
      const pb = game.battle, idle = () => pb.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur, pump = () => { for (let i = 0; i < 900 && !idle() && !pb.over; i++) ui.update(0.1); };
      for (const e of pb.enemies) e.hp = e.maxHp = e.dHp = e.hp * 8;
      for (let i = 0; i < 30; i++) { pump(); if (pb.current && pb.current.charId === 'yu') break; ui.doAct('basic'); }
      ok(pb.current && pb.current.charId === 'yu', 'the battle reaches Yu');
      ui.battleKey('down', 'ArrowDown'); frame();
      ok((pb.current.flags.skillSel | 0) === 1 && pb.current.elem === 'ice', 'Down switches Yu to Jack Frost without picking the Skill');
      pb.living.forEach((e, i) => { if (i) { e.broken = true; e.tough = 0; } else e.tough = 1; });
      ui.bt.target = pb.living[0]; ui.doAct('basic');
      for (let i = 0; i < 6; i++) { ui.update(0.05); frame(); }
      pump(); frame();
      ok(ui.bt.sub && ui.bt.sub.type === 'aoa' && ui.subOptions().length === 2, '«Ещё раз!» with every foe broken asks for the All-Out Attack');
      ui.subKey('ok', 'Enter'); frame();
      for (let i = 0; i < 20; i++) { ui.update(0.1); frame(); }
      ok(pb.aoaN === 1, 'the prompt runs the All-Out Attack');
      game.battle = null; ui.mode = 'field'; ui.bt = null; game.state.party = party0;
    }
  {
    game.state.inv.items.tape = 12;
    game.state.jade = 0;
    ui.openWarp(noop); frame();
    const sp = ui.top();
    eq(sp.ban, 'sig', 'with Encrypted Master Tapes the Warp screen opens on Signal Search');
    ok(ui.hits.some(h => h.x > 40 && h.x < 70 && h.y > 60 && h.y < 130), 'the channel list is clickable');
    game.state.sigStar = 'miyabi';
    key('ArrowDown'); frame(); eq(game.starOf('sig'), 'yanagi', 'Down picks the next exclusive agent');
    key('Tab'); frame(); eq(sp.ban, 'amp', 'Tab switches to the W-Engine channel');
    key('Tab'); frame(); eq(sp.ban, 'sig', 'Tab switches back to the exclusive channel');
    key('KeyE'); frame(); eq(sp.ban, 'conv', 'E leaves Signal Search for the Convene');
    key('KeyQ'); frame(); eq(sp.ban, 'sig', 'Q returns to the channel used last');
    sp.pull(10); frame();
    ok(sp.show && game.state.inv.items.tape === 2 && game.state.warpLog[0].ban === 'sig' && game.state.warpLog[0].star === 'yanagi', 'a Signal Search spends tapes and logs the channel');
    ok(sp.show instanceof H.SignalShow, 'Signal Search plays its own TV scene');
    eq(ui.audio.wantedSong, 'signal', 'Signal Search plays the Golden Sign instrumental and mutes the game music');
    eq(H.SONGS.signal.parts.inst, 'content/music/golden-sign-instrum.mp3', 'the instrumental comes from golden-sign-instrum.mp3');
    ok(H.SONGS.signal.parts.m.endsWith('golden-sign-m.vocals.mp3') && H.SONGS.signal.parts.f.endsWith('golden-sign-f.vocals.mp3'), 'male and female vocal stems are layered on top');
    const [la, lb] = H.SONGS.signal.loop, bar = 4 * 60 / 144;
    ok(la > 7 && la < 8.2 && lb > 60 && lb < 61.3 && Math.abs((lb - la) / bar - 32) < 0.01, 'the song loops 32 bars from the bar before the first vocal line to the vocal tail');
    ok(Math.abs(H.SIGNAL_CINE - (0.035 + 21 * 60 / 144)) < 0.01, 'the TV cinematic lasts 21 beats and ends on the first bar of the vocals');
    {
      const sung = [], real = ui.audio.songVoice;
      ui.audio.songVoice = part => sung.push(part);
      const res = Array.from({ length: 10 }, (x, i) => i === 3 ? { kind: 'char', id: 'welt', rar: 5, name: 'Вельт', res: 'new' } : { kind: 'cone', id: 'swordplay', rar: 3, name: 'x', res: 'new' });
      const vs = new H.SignalShow(ui, res, { ban: 'sig' }), glitch = H.SIGNAL_SHOTS[0][1] + H.SIGNAL_SHOTS[1][1];
      while (vs.t + 0.05 < glitch - 0.05) vs.tick(0.05);
      eq(sung.length, 0, 'the vocal waits until the cinematic shows the S rank');
      vs.tick(0.2);
      eq(sung[sung.length - 1], 'm', 'the vocal starts as soon as the glitch shows a 5-star agent, before the reveals');
      ui.audio.songVoice = real;
    }
    eq(sp.show.voiceOf({ id: 'miyabi' }), 'f', 'a female 5-star agent adds the female vocal');
    eq(sp.show.voiceOf({ id: 'welt' }), 'm', 'a male 5-star character adds the male vocal');
    eq(sp.show.voiceOf({ id: 'trail', gender: 'f' }), 'f', 'the Trailblazer vocal follows the chosen gender');
    {
      const TV = H.SignalTV, list = TV.SHOWS.miyabi;
      ok(TV.has('miyabi') && list.length >= 3 && list.length <= 5, 'Miyabi has 3 to 5 programmes of her own on the Signal Search TV');
      ok(['news', 'fanclub', 'rental', 'letter'].every(k => list.some(p => p.key === k)), 'her programmes follow her lore: Hollow news, the fan club tape, the video rental ad, the letter to her mother');
      ok(['interview', 'film', 'cctv', 'desk'].every(k => TV.SHOWS.yanagi.some(p => p.key === k)), 'Yanagi programmes: the interview joke, her calming film, overtime on the office camera, the desk on Mother Day');
      ok(['arahato', 'homevideo', 'linetest', 'album'].every(k => TV.SHOWS.welt.some(p => p.key === k)), 'Welt programmes: Arahato, the black hole home video, his line test, the album with home');
      ok(['coffee', 'lecture', 'xray', 'shore'].every(k => TV.SHOWS.himeko.some(p => p.key === k)), 'Himeko programmes: the black coffee ad, the navigation lecture, the suitcase x-ray, the night shore with the wrecked train');
      ok(['speech', 'bulletin', 'underworld', 'bench'].every(k => TV.SHOWS.bronya.some(p => p.key === k)), 'Bronya programmes: the Sun festival speech, the Silvermane bulletin, the Underworld tape, the bench under the disc');
      ok(['parade', 'concert', 'kids', 'flowers'].every(k => TV.SHOWS.gepard.some(p => p.key === k)), 'Gepard programmes: the victory parade, the Serval concert, the kids show, his flowers');
      ok(['moles', 'family', 'log', 'coat'].every(k => TV.SHOWS.clara.some(p => p.key === k)), 'Clara programmes: the Moles news, the robot family photo, the Svarog log, Svarog in the red coat');
      ok(['review', 'shop', 'dossier', 'room'].every(k => TV.SHOWS.yanqing.some(p => p.key === k)), 'Yanqing programmes: the fleet review, the sword teleshop, the archive dossier, his room with sword pairs');
      ok(['clinic', 'teletext', 'gourmet', 'water'].every(k => TV.SHOWS.bailu.some(p => p.key === k)), 'Bailu programmes: her clinic show, the teletext case of Jing Yuan, the Gourmet Garden ad with her escape, the dragon under water');
      ok(['miyabi', 'yanagi', 'welt', 'himeko', 'bronya', 'gepard', 'clara', 'yanqing', 'bailu'].every(TV.has), 'every 5-star agent that Signal Search can give has a TV channel');
      ok(['fashion', 'versions', 'polaroid'].every(k => TV.SHOWS.march.some(p => p.key === k)), 'March 7 programmes: the Pom-Pom fashion show, her 67 versions tape, the polaroid of the crew');
      ok(['cabbage', 'rps', 'room'].every(k => TV.SHOWS.kazuma.some(p => p.key === k)), 'Kazuma programmes: the flying cabbage news, the rock-paper-scissors show, his old room in Japan');
      ok(['interview', 'wanted', 'bread'].every(k => TV.SHOWS.sampo.some(p => p.key === k)), 'Sampo programmes: the Crystal Gazette live report, the wanted notice with wigs, the bread split for a week');
      ok(['findpeppy', 'cameras', 'puppy'].every(k => TV.SHOWS.arlan.some(p => p.key === k)), 'Arlan programmes: the Find Peppy show, the security quad with the frisbee, the puppy licking his fingers');
      ok(['database', 'spaceport', 'dawn'].every(k => TV.SHOWS.danheng.some(p => p.key === k)), 'Dan Heng programmes: the Express database links, the spaceport board «КУДА УГОДНО», dawn in the archive with Pom-Pom at the door');
      ok(['society', 'observatory', 'balcony'].every(k => TV.SHOWS.asta.some(p => p.key === k)), 'Asta programmes: the society chronicle with arguing relatives, the Nyul Iman telescope feed, the child on the mansion balcony');
      ok(['interview', 'puppets', 'manuscript'].every(k => TV.SHOWS.herta.some(p => p.key === k)), 'Herta programmes: the fawning interview, six puppets in six meetings, the manuscript at night');
      ok(['workshop', 'rehearsal', 'toolbox'].every(k => TV.SHOWS.serval.some(p => p.key === k)), 'Serval programmes: the Neverwinter repair ad, the night rehearsal with Pela, the toolbox shield for Gepard');
      ok(['graduation', 'teddy', 'ward'].every(k => TV.SHOWS.natasha.some(p => p.key === k)), 'Natasha programmes: the graduation where she picks the Underworld, the teddy stitches for the clinic kids, the night ward letter');
      ok(['drill', 'diary', 'salamander'].every(k => TV.SHOWS.hook.some(p => p.key === k)), 'Hook programmes: the Great Darkness show with the drill, her misspelled diary, the salamander on the stones');
      ok(['recruit', 'fanmeet', 'library'].every(k => TV.SHOWS.pela.some(p => p.key === k)), 'Pela programmes: the recruit interview citing paragraph 7, the secret Snow Country fan meeting, the night library');
      ok(H.FOURS.IDS.every(id => TV.SHOWS[id] && TV.SHOWS[id].length === 3 && TV.SHOWS[id][0].ch && !TV.SHOWS[id][2].ch), 'every version 1.4 hero has a channel that goes from a broadcast to a private moment without OSD');
      {
        const sig4 = new Set([...Object.values(H.BANNERS.sig.stars).flatMap(x => x.four), ...H.WARP_POOL.four, ...H.BANNERS.sig.extra4, 'kazuma'].filter(k => !k.startsWith('cone:')));
        ok([...sig4].every(TV.has), 'every 4-star agent that Signal Search can give has a TV channel');
      }
      ok(Object.entries(TV.SHOWS).every(([id, l]) => l.length === (H.CHARS[id].rarity === 4 ? 3 : 4)), '4-star agents get 3 programmes, 5-star agents get 4');
      ok(H.BANNERS.sig.extra4.includes('march') && !H.WARP_POOL.four.includes('march'), 'March 7 joins the Signal Search 4-star pool without changing the Star Rail Warp pool');
      {
        const four = new H.SignalShow(ui, [{ kind: 'char', id: 'march', rar: 4, name: H.CHARS.march.name, res: 'new' }], { ban: 'sig' }), bare = Object.keys(H.CHARS).find(k => H.CHARS[k].rarity === 4 && !TV.has(k)) || 'march', plain = new H.SignalShow(ui, [{ kind: 'char', id: bare, rar: 4, name: H.CHARS[bare].name, res: 'new' }], { ban: 'sig' });
        ok(four.closeAt(four.res[0]) === 1.6 && four.length(four.res[0]) === 3.6 && (bare === 'march' || (plain.closeAt(plain.res[0]) === null && plain.length(plain.res[0]) === 2.2)), 'a 4-star agent with a channel gets the TV close-up, others keep the short reveal');
        four.skip();
        for (let i = 0; i < 20; i++) { four.tick(0.25); four.draw(ui.ctx); }
        ok(four.phase === 'reveal' && !four.done, 'the March close-up plays without errors');
      }
      ok(Object.values(TV.SHOWS).every(l => l.length >= 3 && l.length <= 5 && l.every(p => p.len > TV.SWITCH && typeof p.paint === 'function' && p.light)), 'every TV channel has 3 to 5 programmes with a length, a painter and a room tint');
      ok(Object.values(TV.SHOWS).every(l => !l[l.length - 1].ch), 'every channel ends on its private programme without the OSD');
      ok(TV.at('miyabi', 0.1).power < 1, 'the TV powers on first');
      const total = list.reduce((s, p) => s + p.len, 0), sw = TV.at('miyabi', TV.POWER + list[0].len + 0.05);
      ok(sw.i === 1 && sw.snow > 0.5 && sw.roll > 0, 'the next programme rolls in through static');
      eq(TV.at('miyabi', TV.POWER + total + list[0].len * 0.5).i, 0, 'the programmes loop');
      const tex = TV.screen('miyabi', 1, game);
      ok(tex.w === TV.TW && tex.h === TV.TH && tex.d.length === TV.TW * TV.TH * 4 && TV.screen('miyabi', 5, game) === tex, 'the TV screen is one live texture updated in place');
      ok(!TV.has('seele'), 'characters without their own programmes keep the Eidolon picture');
      const ms = new H.SignalShow(ui, [{ kind: 'char', id: 'miyabi', rar: 5, name: H.CHARS.miyabi.name, res: 'new' }], { ban: 'sig' });
      ms.skip();
      for (let i = 0; i < 40; i++) { ms.tick(0.25); ms.draw(ui.ctx); }
      ok(ms.phase === 'reveal' && !ms.done && TV.at('miyabi', ms.rt - 2.4).power === 1, 'the Miyabi close-up keeps her TV channel running');
    }
    const shw = sp.show;
    for (let i = 0; i < Math.ceil(H.SIGNAL_CINE / 0.2) + 1; i++) { shw.tick(0.2); frame(); }
    ok(shw.phase === 'reveal' && shw.cur === 0, 'the TV cinematic leads into the first reveal');
    const kinds = new Set();
    for (let g2 = 0; g2 < 60 && shw.phase === 'reveal'; g2++) { kinds.add(shw.item().kind); for (let i = 0; i < 4; i++) { shw.tick(0.6); frame(); } key('Enter'); frame(); }
    ok(shw.phase === 'rack' && kinds.size >= 1, 'every signal is revealed before the results');
    frame();
    sp.show = shw;
    key('Escape'); frame();
    for (let i = 0; i < 4 && sp.show; i++) { key('Enter'); frame(); }
    ok(!sp.show, 'the Signal Search results close');
    eq(ui.audio.wantedSong, null, 'the Golden Sign song stops when the results close');
    sp.pull(10); frame();
    ok(!sp.show, 'no search without tapes or jade');
    ui.screens = [];
    delete game.state.inv.items.tape;
  }
  {
    game.state.inv.items.rtide = 12;
    game.state.jade = 0;
    ui.openWarp(noop); frame();
    const cp = ui.top();
    eq(cp.ban, 'conv', 'with Radiant Tides the Warp screen opens on the Convene');
    key('Tab'); frame(); eq(cp.ban, 'forge', 'Tab switches to the weapon Convene');
    key('Tab'); frame(); eq(cp.ban, 'conv', 'Tab switches back to the resonator Convene');
    cp.pull(10); frame();
    ok(cp.show instanceof H.ConveneShow && game.state.inv.items.rtide === 2 && game.state.warpLog[0].ban === 'conv', 'a Convene spends Radiant Tides and plays its own scene');
    const cs = cp.show;
    for (let i = 0; i < Math.ceil(H.CONVENE_CINE / 0.2) + 1; i++) { cs.tick(0.2); frame(); }
    ok(cs.phase === 'reveal' && cs.cur === 0, 'the tide cinematic leads into the first reveal');
    for (let g2 = 0; g2 < 60 && cs.phase === 'reveal'; g2++) { for (let i = 0; i < 4; i++) { cs.tick(0.6); frame(); } key('Enter'); frame(); }
    ok(cs.phase === 'rack', 'every Convene result is revealed before the results');
    key('Enter'); frame(); key('Enter'); frame();
    ok(!cp.show, 'the Convene results close');
    {
      const kz = new H.ConveneShow(ui, [{ kind: 'char', id: 'kazuma', rar: 4, name: H.CHARS.kazuma.name, res: 'new', cameo: true }], { ban: 'conv' });
      kz.skip();
      ok(kz.phase === 'reveal' && H.CONVENE_CUTS.kazuma && kz.length(kz.item()) > H.ConveneKit.cutLen('kazuma') && H.ConveneKit.QUOTES.kazuma, 'a Kazuma cameo in the Convene plays his own scene');
      const heard = [], sfx0 = ui.sfx;
      ui.sfx = function (x) { heard.push(x); return sfx0.call(this, x); };
      for (let t = 0; t < kz.length(kz.item()) + 1; t += 0.1) { kz.tick(0.1); kz.draw(ui.ctx); }
      ui.sfx = sfx0;
      ok(['tech', 'whoosh', 'star4'].every(x => heard.includes(x)), 'the Kazuma Convene scene plays its sounds');
      const kzLines = [H.WarpIntro.line('kazuma', game), H.SignalKit.QUOTES.kazuma, H.ConveneKit.QUOTES.kazuma, H.ExplosionKit.QUOTES.kazuma];
      ok(kzLines.every(Boolean) && new Set(kzLines).size === 4, 'Kazuma says a different line in the Warp, Signal Search, Convene and Guild');
    }
    const one = new H.ConveneShow(ui, [{ kind: 'char', id: 'scar', rar: 5, name: H.CHARS.scar.name, res: 'new' }], { ban: 'conv' });
    one.skip();
    ok(one.phase === 'reveal' && one.length(one.item()) > H.ConveneKit.cutLen('scar'), 'Esc on a single pull jumps to the reveal with the full Scar scene');
    for (let t = 0; t < one.length(one.item()) + 1; t += 0.25) { one.tick(0.25); one.draw(ui.ctx); }
    one.enter();
    ok(one.done, 'Enter after the Scar scene closes a single pull');
    ui.screens = [];
    delete game.state.inv.items.rtide;
  }
  {
    game.state.inv.items.mana = 12;
    game.state.jade = 0;
    ui.openWarp(noop); frame();
    const gp = ui.top();
    eq(gp.ban, 'guild', 'with manatites the Warp screen opens on the Guild');
    const seen = [];
    for (let i = 0; i < 3; i++) { key('ArrowDown'); frame(); seen.push(game.starOf('guild')); }
    eq(seen.join(), 'megumin,darkness,aqua', 'Down walks through the three heroines');
    const card = ui.hits.find(h => h.x > 540 && h.y > 120 && h.y < 140);
    ok(card, 'the heroine picker has a card for Megumin');
    ui.click({ clientX: card.x + card.w / 2, clientY: card.y + card.h / 2, button: 0 }); frame();
    eq(game.starOf('guild'), 'megumin', 'a click on the card picks Megumin');
    const shopBtn = ui.hits.find(h => h.x >= 330 && h.x <= 345 && h.y >= 295 && h.y <= 305);
    ok(shopBtn, 'the Guild shows a button for the Wiz shop');
    ui.click({ clientX: shopBtn.x + shopBtn.w / 2, clientY: shopBtn.y + shopBtn.h / 2, button: 0 }); frame();
    eq(gp.ban, 'wiz', 'the button opens the Wiz shop');
    key('ArrowDown'); frame(); eq(game.starOf('wiz'), 'megumin', 'Down picks the Manatite Staff in the shop');
    ok(game.starOf('guild') === 'megumin' && ui.hits.some(h => h.x > 540 && h.y > 120 && h.y < 140), 'the shop has its own cone picker');
    key('Tab'); frame(); eq(gp.ban, 'guild', 'Tab goes back to the recruitment');
    gp.pull(10); frame();
    ok(gp.show instanceof H.ExplosionShow && game.state.inv.items.mana === 2 && game.state.warpLog[0].ban === 'guild', 'a Guild pull spends manatites and plays the daily Explosion');
    const xs = gp.show;
    ok(xs.score >= 40 && xs.score <= 100, 'Kazuma scores the Explosion (' + xs.score + ')');
    for (let i = 0; i < Math.ceil(H.EXPLOSION_CINE / 0.2) + 1; i++) { xs.tick(0.2); frame(); }
    ok(xs.phase === 'reveal' && xs.cur === 0, 'the Explosion cinematic leads into the first reveal');
    for (let g2 = 0; g2 < 60 && xs.phase === 'reveal'; g2++) { for (let i = 0; i < 4; i++) { xs.tick(0.6); frame(); } key('Enter'); frame(); }
    ok(xs.phase === 'rack', 'every Guild result is revealed before the quest board');
    key('Enter'); frame(); key('Enter'); frame();
    ok(!gp.show, 'the quest board closes');
    key('KeyH'); frame();
    const gh = ui.top();
    ok(gh.ban === 'guild' && gh.rows().length === game.state.warpLog.filter(e => e.ban === 'guild').length, 'H opens the Guild history');
    ui.screens = [];
    delete game.state.inv.items.mana;
    const E = H.EXPLOSION_CUTS, KX = H.ExplosionKit;
    ok(['kazuma', 'aqua', 'megumin', 'darkness'].every(id => E[id]) && Object.keys(E).every(id => KX.QUOTES[id] && KX.QUOTES[id].length <= 58 && !/[—–]/.test(KX.QUOTES[id])), 'every KonoSuba hero has an own cut and a short line');
    eq(KX.score([{ rar: 5, id: 'aqua' }]), 100, 'a 5★ Explosion scores a hundred');
    ok([3, 4].every(r => { const v = KX.score([{ rar: r, id: 'x' }]); return v >= (r === 4 ? 70 : 40) && v < (r === 4 ? 95 : 70); }), 'weaker Explosions score less');
    const t0 = Date.now();
    for (const best of [3, 4, 5]) {
      const res = [{ kind: 'char', id: 'natasha', rar: 4, name: 'Наташа', res: 'new' }, { kind: 'cone', id: best === 5 ? 'milkyway' : 'arrows', rar: best === 5 ? 5 : 3, name: 'x', sup: 1 }];
      if (best === 3) res[0] = { kind: 'cone', id: 'void', rar: 3, name: 'x', sup: 1 };
      const sh = new H.ExplosionShow(ui, res, { ban: 'guild' });
      eq(sh.best, best, 'the best rarity of the test pull is ' + best);
      for (let t = 0; t < H.EXPLOSION_CINE; t += 0.1) { sh.t = t; sh.draw(ui.ctx); }
      sh.begin([0, 1]);
      for (let k = 0; k < 2; k++) { for (let t = 0; t < sh.intro() + 0.2; t += 0.15) { sh.rt = t; sh.draw(ui.ctx); } sh.next(); }
      ok(sh.phase === 'rack', 'a two-item Guild pull ends on the quest board (' + best + '★)');
      for (let t = 0; t < 1.5; t += 0.3) { sh.rt = t; sh.draw(ui.ctx); }
    }
    const pullOf = (k, res) => { const tg = { stelle: 'f', caelus: 'm' }[k], id = tg ? 'trail' : k; return { kind: 'char', id, rar: H.CHARS[id].rarity, name: H.CHARS[id].name, res, gender: tg }; };
    const rarOf = k => H.CHARS[pullOf(k).id].rarity;
    for (const g0 of ['f', 'm']) { const sh = new H.ExplosionShow(ui, [pullOf(g0 === 'f' ? 'stelle' : 'caelus', 'new')], { ban: 'guild' }); ok(sh.key(sh.res[0]) === (g0 === 'f' ? 'stelle' : 'caelus'), 'the Trailblazer gets the ' + (g0 === 'f' ? 'Stelle' : 'Caelus') + ' scene'); }
    { const sh = new H.ExplosionShow(ui, [{ kind: 'char', id: 'trail', rar: 5, name: 'x', res: 'new' }], { ban: 'guild' }); ok(sh.key(sh.res[0]) === (ui.game.state.gender === 'f' ? 'stelle' : 'caelus'), 'without an override the Trailblazer scene follows the save gender'); }
    for (const id of Object.keys(E)) {
      const one = new H.ExplosionShow(ui, [pullOf(id, 'new')], { ban: 'guild' });
      one.skip();
      ok(one.phase === 'reveal' && one.length(one.item()) > KX.cutLen(id), 'Esc on a single pull jumps to the own scene of ' + id);
      let sounds = 0;
      const sfx0 = ui.sfx;
      ui.sfx = () => { sounds++; };
      for (let t = 0; t < one.length(one.item()) + 0.5; t += 0.1) { one.tick(0.1); one.draw(ui.ctx); }
      ui.sfx = sfx0;
      ok(sounds >= 4, 'the scene of ' + id + ' plays its sounds (' + sounds + ')');
      one.enter();
      ok(one.done, 'Enter after the scene of ' + id + ' closes a single pull');
    }
    for (const id of Object.keys(E)) {
      const beats = E[id].map(b => b[0]), said = Object.keys(KX.LINES[id]);
      ok(beats[beats.length - 1] === 'pose' && beats.length >= (rarOf(id) === 5 ? 5 : 4) && said.every(n => beats.includes(n) && n !== 'pose'), 'the scene of ' + id + ' tells a short story before the pose');
      ok(said.every(n => KX.LINES[id][n][1].length <= 52 && !/[—–]/.test(KX.LINES[id][n][1])), 'the lines in the scene of ' + id + ' are short and without dashes');
      const full = new H.ExplosionShow(ui, [pullOf(id, 'new')], { ban: 'guild' });
      const dup = new H.ExplosionShow(ui, [pullOf(id, 'eid')], { ban: 'guild' });
      full.begin([0]); dup.begin([0]);
      ok(dup.length(dup.item()) < full.length(full.item()) - 1 && dup.cutsOf(dup.item())[0][0] === KX.BRIEF[id], 'a duplicate of ' + id + ' plays the short scene from «' + KX.BRIEF[id] + '»');
      ok(dup.rc.length >= 3 && dup.rc.every(([x]) => x < dup.length(dup.item())), 'the short scene of ' + id + ' keeps its sounds inside the scene');
      let lines = 0;
      for (let t = 0; t < full.length(full.item()); t += 0.1) { full.rt = t; if (full.beatLine(full.item(), t)) lines++; full.draw(ui.ctx); }
      ok(lines > 10, 'the scene of ' + id + ' shows its lines while it plays');
    }
    ok(Date.now() - t0 < 30000, 'the Explosion scenes render in reasonable time');
  }
  ui.openShop('boulder', noop); frame(); key('ArrowDown'); key('Enter'); frame(); ui.screens = [];
  ui.openRumors('sampo_belobog', noop); frame(); ui.screens = [];
  ui.openCalyx(noop); frame(); ui.screens = [];
  ui.openBank(null); for (let t = 0; t < 4; t++) { key('ArrowRight'); frame(); } ui.screens = [];
  ui.openSaves('save'); frame(); key('Enter'); frame();
  ok(store.has('hsr98.save.1'), 'save written to a memory card block');
  ui.openSettings(); key('ArrowRight'); frame(); ui.screens = [];
  {
    ui.openSettings(); frame();
    const st = ui.top();
    eq(ui.options.res, '640', 'the render starts at the original 640×480');
    ok(ui.canvas.width === 640 && ui.canvas.height === 480, 'the default render buffer is 640×480');
    for (let i = 0; i < 6; i++) key('ArrowDown');
    key('ArrowRight'); frame();
    ok(ui.options.res === '800' && ui.canvas.width === 800 && ui.canvas.height === 600, 'the 800 preset renders into an 800×600 buffer');
    key('ArrowRight'); key('ArrowRight'); frame();
    ok(ui.canvas.width === 1280 && ui.canvas.height === 960, 'the 1280 preset renders into a 1280×960 buffer');
    const rect = ui.canvas.getBoundingClientRect;
    ui.canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 750 });
    key('ArrowRight'); frame();
    ok(ui.options.res === 'window' && ui.canvas.width === 1000 && ui.canvas.height === 750, 'the window preset matches the displayed canvas size');
    key('ArrowRight'); frame();
    eq(ui.options.res, 'window', 'the resolution list stops at its last preset');
    eq(JSON.parse(store.get('hsr98.options')).res, 'window', 'the resolution preset is saved with the options');
    ui.canvas.getBoundingClientRect = rect;
    key('ArrowLeft'); key('ArrowLeft'); key('ArrowLeft'); key('ArrowLeft'); frame();
    ok(ui.options.res === '640' && ui.canvas.width === 640 && st === ui.top(), 'Left walks back to the original resolution');
    ui.screens = [];
  }
  {
    const clickAll = rects => rects.forEach(h => ui.click({ clientX: h.x + h.w / 2, clientY: h.y + h.h / 2, button: 0 }));
    const mode = ui.mode;
    ui.mode = 'title'; ui.screens = []; frame();
    const titleHits = ui.hits.slice();
    ui.openSettings(); frame();
    const st = ui.top();
    clickAll(titleHits); frame();
    ok(ui.mode === 'title' && ui.screens.length === 1 && ui.top() === st, 'clicks on the title menu under Settings do not open a second Settings window');
    ui.mode = mode; ui.screens = [];
    ui.openMenu(); frame();
    const phoneHits = ui.hits.slice();
    ui.openSettings(); frame();
    const st2 = ui.top();
    clickAll(phoneHits); frame();
    ok(ui.screens.length === 2 && ui.top() === st2, 'clicks on the phone under Settings do not stack more windows');
    ui.options.res = '640'; ui.applyRes(); ui.screens = [];
  }
  ui.openGuide(); frame(); ui.screens = [];
  {
    const keep = ui.game, sg = new H.Game({ state: Object.assign(H.newState(), { map: 'u_rivet', x: null, y: null }), seed: 8 });
    ui.game = sg; ui.screens = []; ui.dlg = null;
    sg.runScript('rivet_intro'); frame(2);
    ok(ui.dlg && ui.hits.some(h => h.y < 380 && h.w > 60 && h.h === 19), 'the dialogue box shows the skip button');
    key('Tab'); frame();
    const pop = ui.top();
    ok(pop && sg.pending && sg.pending.type === 'say', 'Tab opens the recap window over the dialogue');
    key('Escape'); frame();
    ok(!ui.screens.length && sg.pending && sg.pending.type === 'say', 'Esc returns to the dialogue');
    const btn = ui.hits.find(h => h.h === 19 && h.w > 60);
    ui.click({ clientX: btn.x + 4, clientY: btn.y + 4, button: 0 }); frame();
    ok(ui.top() && ui.top() !== pop, 'a click on the skip button opens the recap window');
    key('Tab'); frame(2);
    ok(!sg.script && !sg.pending && sg.state.flags.rivet_intro && !ui.dlg, 'Tab in the recap window skips the scene');
    ui.openBank(null); ui.top().tab = 4; frame();
    eq(ui.top().rows().map(r => r.label).join(), 'Старый приют', 'the Archive keeps the recap of the skipped scene');
    ui.screens = []; ui.game = keep;
  }
  ui.openMission(); frame(); ui.screens = [];
  {
    game.state.comet = { days: 0, last: null, got: [] }; game.state.will = [];
    ui.openEvents('comet'); frame();
    const evs = ui.top(), sp = game.state.inv.items.spass || 0;
    key('Enter'); frame();
    eq(game.state.inv.items.spass, sp + 1, 'Enter claims the selected day');
    key('ArrowRight'); frame(); key('Enter'); frame();
    eq(game.state.inv.items.spass, sp + 1, 'a closed day cannot be claimed');
    key('KeyE'); frame(); eq(evs.ev().id, 'will', "E switches to Trailblazer's Will");
    const p0 = game.state.inv.items.pass || 0;
    key('KeyF'); frame();
    ok(game.state.inv.items.pass === p0 + 30 && game.state.will.length === 3, 'F claims every reached level (30)');
    for (let i = 0; i < 5; i++) { key('ArrowRight'); frame(); }
    eq(evs.pick, 3, 'the cursor stops at the last station');
    key('Enter'); frame(); ok(!game.state.will.includes(35), 'level 35 stays closed at level 30');
    key('KeyQ'); frame(); eq(evs.ev().id, 'comet', 'Q switches back');
    game.state.comet.got = [true, true, true, true, true, true, true]; frame();
    ui.screens = [];
  }
  {
    game.state.mail = {}; game.mailSync();
    ui.openMail(); frame();
    const ml = ui.top(), j = game.state.jade;
    ok(game.state.mail[ml.cur().m.id].read, 'opening the mail reads the newest letter');
    key('Enter'); frame(); eq(game.state.jade, j + 300, 'Enter claims the letter gift');
    key('ArrowDown'); frame(); ok(game.state.mail[ml.cur().m.id].read, 'moving to a letter reads it');
    key('KeyF'); frame(); eq(game.state.jade, j + 300 * H.MAIL.filter(m => m.give).length, 'F claims every letter');
    for (const x of game.mailbox()) game.readMail(x.m.id);
    key('Delete'); frame(); ok(ui.top() !== ml, 'Del asks before deleting');
    key('ArrowLeft'); key('Enter'); frame();
    ok(ui.top() === ml && !game.mailbox().length && !game.alerts().mail, 'the confirmed delete empties the mailbox');
    frame(); ui.screens = [];
  }
  {
    const keepQuest = game.state.quests.su_beta, jade = game.state.jade;
    game.state.chats = null; game.state.flags.express_intro = true; delete game.state.quests.su_beta; game.chatSync();
    ui.openChats('herta'); frame();
    const ch = ui.top();
    ok(ch.cur().who === 'herta' && ch.focus === 'chat', 'Messages open on the chosen contact with its new thread');
    frame(5);
    ok(game.chatView('herta_test').n === 0, 'the first message waits while Herta is typing');
    frame(30);
    ok(game.chatView('herta_test').n >= 1, 'the message arrives after the typing pause');
    for (let i = 0; i < 400 && !game.chatThread('herta_test').done; i++) { key(game.chatView('herta_test').wait ? 'Enter' : 'Space'); frame(); }
    ok(game.chatThread('herta_test').done && game.state.quests.su_beta === 'talk', 'Enter answers, and the finished thread gives the quest');
    key('ArrowLeft'); frame(); eq(ch.focus, 'list', 'left returns to the contacts');
    const n = game.chatContacts().length, other = game.chatContacts().findIndex(c => c.who === 'march');
    ch.pickContact(other); key('Enter'); frame(40);
    ok(ch.cur().who === 'march' && game.chatView('march_hello').n > 0, 'Enter opens another contact and starts reading');
    ok(n >= 3, 'the list shows every contact who wrote');
    for (let i = 0; i < 400 && !game.chatThread('march_hello').done; i++) { key(game.chatView('march_hello').wait ? 'ArrowDown' : 'Space'); key('Enter'); frame(); }
    ok(game.chatThread('march_hello').done, 'the arrows pick another answer and the thread still ends');
    ch.focus = 'list'; ch.pickContact(game.chatContacts().findIndex(c => c.who === 'arlan')); key('Enter'); frame();
    for (let i = 0; i < 400 && !game.chatThread('d_arlan_wounds').done; i++) { key('Enter'); frame(); }
    eq(game.state.jade, jade + H.CHAT.DAILY_GIVE.jade, 'the daily thread pays its jade in the chat');
    key('PageUp'); frame(); key('PageDown'); frame();
    key('Escape'); key('Escape'); frame();
    ok(ui.top() !== ch, 'Esc closes Messages');
    ui.screens = [];
    game.state.flags.ending = true; game.chatSync();
    ui.openChats('march'); frame(); ui.top().focus = 'chat';
    for (let i = 0; i < 400 && !game.chatThread('march_album').done; i++) { key('Enter'); frame(); }
    ok(game.chatThread('march_album').done, 'the photo and sticker thread plays to the end');
    ui.screens = [];
    delete game.state.flags.ending;
    game.state.quests.su_beta = keepQuest; if (!keepQuest) delete game.state.quests.su_beta;
    ui.chatNote = null; ui.mode = 'field';
    game.events.push({ t: 'chat', ids: ['march_album'], who: 'march' }); frame();
    ok(ui.chatNote && ui.chatNote.who === 'march', 'a new thread shows a notice in the field');
    frame(3);
    const noteHit = ui.hits.find(h => h.y < 50 && h.w === 264);
    ok(noteHit, 'the notice can be clicked');
    noteHit.fn(0); frame();
    ok(ui.top() && ui.top().cur().who === 'march', 'clicking the notice opens Messages on that contact');
    ui.screens = []; ui.chatNote = null;
  }
  {
    key('KeyM'); frame();
    const nav = ui.top();
    ok(nav && nav.full && nav.area === 'express' && nav.sel === -1, 'M opens the map on the current area, centred on the player');
    key('ArrowRight'); frame(); ok(nav.sel >= 0, 'the right arrow picks a marker');
    key('Enter'); frame(); ok(nav.detail, 'Enter opens the marker card');
    for (let i = 0; i < 8; i++) { key('ArrowRight'); frame(); }
    const z = nav.zoom;
    key('KeyE'); frame(); eq(nav.zoom, Math.min(5, z + 1), 'E zooms in');
    key('KeyQ'); frame(); eq(nav.zoom, z, 'Q zooms out');
    {
      frame(30);
      const [fx, fy] = nav.focus(), at = () => [nav.px + fx * nav.scale, nav.py + fy * nav.scale];
      let jump = 0, ratio = 1, prev = at(), was = nav.scale;
      for (const code of ['KeyE', 'KeyE', 'KeyQ', 'KeyQ']) {
        key(code);
        for (let i = 0; i < 12; i++) {
          frame(1, 1 / 30);
          const cur = at();
          jump = Math.max(jump, Math.abs(cur[0] - prev[0]), Math.abs(cur[1] - prev[1]));
          ratio = Math.max(ratio, nav.scale / was, was / nav.scale);
          prev = cur; was = nav.scale;
        }
      }
      ok(ratio < 1.25, 'the chart scale changes gradually when zooming (max step ×' + ratio.toFixed(2) + ')');
      ok(jump < 20, 'zooming the navigation chart moves the focus point smoothly (max ' + jump.toFixed(1) + ' px per frame)');
      ok(Math.abs(nav.scale - [4, 6, 8, 10, 12, 16][nav.zoom]) < 0.05, 'the chart scale settles on the zoom step');
    }
    key('Escape'); frame(); ok(!nav.detail && ui.top() === nav, 'Esc returns from the card to the area list');
    key('ArrowDown'); frame(); ok(nav.area !== 'express', 'the down arrow steps to the next area');
    key('Tab'); frame();
    const star = ui.top();
    ok(star !== nav && star.full && star.choose, 'Tab opens the Star Rail map');
    star.sel = 2; key('Enter'); frame(); ok(ui.top() === star, 'a world without a route stays closed');
    star.sel = 0; key('Enter'); frame();
    ok(ui.top() === nav && nav.world.id === 'herta' && nav.area === 'hs_control', 'picking a world shows the area where the Express lands');
    const li = nav.points().findIndex(p => p.kind === 'landing' || p.landing);
    ok(li >= 0, 'the Master Control Zone has a landing marker');
    nav.sel = li; nav.detail = true; frame();
    ok(nav.action && nav.action.ok, 'teleport is available from the Express');
    key('Enter'); frame();
    eq(game.map.id, 'hs_control', 'teleport from the map card moves the team');
    eq(ui.screens.length, 0, 'teleport closes the map');
    ok(ui.canSaveHere(), 'the Master Control Zone is a safe hub');
    game.loadMap('hs_base', 'n'); frame();
    key('KeyM'); frame();
    const nav2 = ui.top();
    nav2.setArea('express'); nav2.sel = nav2.points().findIndex(p => p.kind === 'anchor'); nav2.detail = true; frame();
    ok(nav2.action && !nav2.action.ok && /якоря пространства/.test(nav2.action.why), 'away from anchors the card explains the teleport rule');
    key('Enter'); frame();
    eq(game.map.id, 'hs_base', 'teleport is refused away from anchors and safe areas');
    key('Escape'); frame(); key('KeyM'); frame();
    eq(ui.screens.length, 0, 'M closes the map');
    key('Escape'); frame(); ui.top().sel = 6; key('Enter'); frame();
    ok(ui.top().full && ui.top().points, 'the Navigation tile opens the map away from anchors');
    ui.screens = [];
    game.state.obj = 'Расспросить Асту о положении на станции (главный пульт)';
    ui.openMission(); frame(); key('KeyM'); frame();
    const nav3 = ui.top();
    ok(nav3.points && nav3.area === 'hs_control' && nav3.points()[nav3.sel].goal, 'the mission screen shows the objective on the map');
    ui.screens = [];
    game.loadMap('express', 'v'); ui.enterField();
    game.runScript('nav_console'); frame(2);
    ok(ui.top() && ui.top().choose && !ui.top().points, 'the Express navigation console opens the Star Rail map');
    key('Escape'); frame();
    ok(!game.pending && !game.script && !ui.screens.length, 'closing the console map ends the console script');
    for (const car of ['express', 'express_cabin', 'express_party']) {
      game.loadMap(car, 'v'); ui.enterField(); frame(3);
      const L = G.mapLayer(game.map);
      ok(L.deco && L.sprites.length > 10 && L.glass.length > 8 && L.lights.length > 3, 'the ' + car + ' car has furniture, windows and lights');
      ok(game.map.outside === game.expressWorld().id, 'the windows of ' + car + ' show the parked world');
    }
    for (const [script, book] of [['exp_guestbook', 'guests'], ['exp_photowall', 'photos']]) {
      game.runScript(script); ui.drainGameEvents(); frame();
      for (let i = 0; i < 6 && !ui.top(); i++) { key('Enter'); frame(2); }
      ok(ui.top() && ui.top().key && game.pending && game.pending.book === book, 'the ' + book + ' screen opens');
      key('ArrowRight'); frame(); key('Escape'); frame(2);
      while (game.script || game.pending) { key('Enter'); frame(); }
      ok(!ui.screens.length, 'the ' + book + ' screen closes');
    }
  }
  game.startBattle({ enemies: ['reaver:10', 'eliminator:10'], lvl: 10, bg: 'station', music: 'battle' });
  ui.drainGameEvents(); frame(20);
  eq(ui.mode, 'battle', 'battle screen');
  key('KeyT'); frame(); key('Escape'); frame();
  key('F7'); frame();
  ok(ui.bt.msg && /нефрит/.test(ui.bt.msg), 'F7 in battle reports the grant');
  key('F8'); frame(); key('Digit4'); frame(); key('Enter'); frame();
  ok(/Отладка/.test(ui.bt.msg), 'F8 grants in battle report to the battle log');
  key('F8'); frame();
  ok(!ui.screens.length, 'F8 closes the debug menu in battle');
  ui.bt.auto = true;
  for (let i = 0; i < 2000 && !ui.bt.result; i++) frame(1, 0.1);
  ok(ui.bt.result && ui.bt.result.win, 'auto battle reaches the victory screen');
  key('Enter'); frame(5);
  eq(ui.mode, 'field', 'back to the field after victory');
  {
    const SH = H.Ults.SHOWS, ids = Object.keys(H.CHARS);
    for (const id of ids) ok(SH[id] && SH[id].line && typeof SH[id].act === 'function' && SH[id].d >= 1, 'Ultimate cutscene exists for ' + id);
    for (const id of Object.keys(SH)) ok(H.CHARS[id], 'Ultimate cutscene belongs to a character: ' + id);
    for (const id of ids) ok(!/[—–]/.test(SH[id].line) && SH[id].line.length <= 40, 'the Ultimate line of ' + id + ' is short and has no dashes');
    for (const id of ids) if (['allies', 'self'].includes(H.CHARS[id].ult.target)) ok(H.Ults.TEAM_FX[SH[id].team], 'a support Ultimate names its team effect: ' + id);
    eq(ui.options.ultCine, 'on', 'Ultimate cutscenes are on by default');
    game.startBattle({ enemies: ['reaver:10', 'eliminator:10', 'reaver:10'], lvl: 10, bg: 'station', music: 'battle' });
    ui.drainGameEvents(); frame(20);
    const lay = [...ui.enemyLayout()].map(([u, p]) => ({ u, x: p.x / 2, y: p.y / 2, s: p.s / 2 }));
    for (const id of ids) {
      const fake = { charId: id, elem: H.CHARS[id].elem, name: H.CHARS[id].name, side: 'ally', kit: H.CHARS[id] };
      for (const foes of [lay, lay.slice(0, 1), []]) {
        const sh = new H.Ults.Show(ui, fake, { foes, allies: [fake, fake], bg: 'station' });
        const kinds = sh.beats.map(x => x.id).join();
        eq(kinds, foes.length ? 'in,act,hit' : 'in,act,team', 'Ultimate cutscene beats of ' + id + ' with ' + foes.length + ' targets');
        let n = 0;
        while (!sh.done && n++ < 200) { sh.tick(0.07); sh.draw(ui.ctx); }
        ok(sh.done && sh.length > 2 && sh.length < 3.6, 'the Ultimate cutscene of ' + id + ' plays to the end in ' + sh.length.toFixed(2) + ' s');
      }
    }
    const FS = H.Fusions.SHOWS, allyFx = f => f.fx.some(x => ['heal', 'shield', 'invig'].includes(x.k) || (['advance', 'buff'].includes(x.k) && x.who === 'allies'));
    for (const id of Object.keys(H.FUSIONS)) {
      const f = H.FUSIONS[id], def = FS[id];
      const nm = f.members.length;
      ok(def && typeof def.act === 'function' && def.d >= 1.4 && def.d <= (nm > 2 ? 3.2 : 2), 'Fusion cutscene exists for ' + id);
      if (!def) continue;
      ok(def.lines.length === nm && def.lines.every(([who, text]) => who >= 0 && who < nm && text.length <= 44 && !/[—–]/.test(text)), 'the Fusion ' + id + ' has one short line per member without dashes');
      ok(new Set(def.lines.map(l => l[0])).size === nm, 'every partner of ' + id + ' speaks');
      const sw = def.swaps || [def.swap];
      ok(sw.length === nm - 1 && sw.every((x, i) => x > 0.3 + (i ? sw[i - 1] : 0) && x < def.d - 0.5), 'every line of ' + id + ' gets time on screen');
      eq(!!def.team, allyFx(f), 'the Fusion ' + id + ' shows a team beat exactly when it helps the team');
      if (def.team) ok(H.Ults.TEAM_FX[def.team], 'the team effect of ' + id + ' exists');
      const mem = f.members.map(k => ({ charId: k, elem: H.CHARS[k].elem, name: H.CHARS[k].name, side: 'ally', kit: H.CHARS[k] }));
      for (const foes of [lay, lay.slice(0, 1), []]) {
        const sh = new H.Fusions.Show(ui, mem, { id, foes, allies: mem.concat(mem), bg: 'station' });
        eq(sh.beats.map(x => x.id).join(), ['in', 'act'].concat(foes.length ? ['hit'] : [], def.team ? ['team'] : []).join(), 'Fusion cutscene beats of ' + id + ' with ' + foes.length + ' targets');
        let n = 0;
        const said = new Set();
        while (!sh.done && n++ < 300) { sh.tick(0.05); sh.draw(ui.ctx); const sp = sh.speech(); if (sp) said.add(sp.text); }
        ok(sh.done && sh.length > 2.5 && sh.length < (nm > 2 ? 6 : 5), 'the Fusion cutscene of ' + id + ' plays to the end in ' + sh.length.toFixed(2) + ' s');
        eq(said.size, nm, 'every line of ' + id + ' is shown');
      }
    }
    for (const id of Object.keys(FS)) ok(H.FUSIONS[id], 'Fusion cutscene belongs to a Fusion: ' + id);
    ui.screens = [];
    const b = game.battle, idle = () => b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur && !ui.bt.ult;
    const waitInput = () => { for (let i = 0; i < 900 && !idle() && !b.over; i++) frame(1, 0.05); frame(); };
    const castUlt = i => { const a = b.allies[i]; a.energy = a.maxEnergy; for (const x of b.living) x.hp = x.maxHp = 99999; waitInput(); key('Digit' + (i + 1)); frame(1, 0.01); return a; };
    const playTime = () => { let t = 0; while (ui.bt.ult && t < 20) { frame(1, 0.05); t += 0.05; } return t; };
    {
      const sp0 = ui.options.battleSpeed;
      ui.options.battleSpeed = 1; frame();
      const btn = ui.hits.find(h => h.x === 640 - 150 && h.y === 8);
      ok(btn, 'the battle speed button takes clicks');
      const seen = [];
      for (let i = 0; i < 3; i++) { ui.click({ clientX: btn.x + 5, clientY: btn.y + 5, button: 0 }); frame(); seen.push(ui.options.battleSpeed); }
      eq(seen.join(), '2,3,1', 'the battle speed button cycles ×1 → ×2 → ×3');
      key('KeyX'); frame();
      eq(ui.options.battleSpeed, 2, 'X switches the battle speed');
      ui.options.battleSpeed = sp0;
    }
    ui.bt.auto = false;
    const first = castUlt(0);
    ok(ui.bt.ult && ui.bt.ult.u === first, 'an Ultimate starts its cutscene');
    const hp0 = b.living.map(x => x.dHp).join();
    frame(10, 0.05);
    eq(b.living.map(x => x.dHp).join(), hp0, 'the battle waits for the cutscene before it shows damage');
    ok(ui.bt.ult.P.foes.length > 0, 'the cutscene knows the enemies the Ultimate hits');
    const t1 = playTime() + 0.5;
    ok(!ui.bt.ult && t1 > 2, 'the cutscene ends and the battle goes on (' + t1.toFixed(2) + ' s at x1)');
    frame(20, 0.05);
    ok(ui.bt.dmgBy.get(first) > 0, 'the Ultimate damage shows after the cutscene');
    ui.options.battleSpeed = 3;
    castUlt(0);
    const t3 = playTime() + 0.5 / 3;
    ok(t3 < t1 / 2.5, 'battle speed x3 speeds up the cutscene (' + t3.toFixed(2) + ' s)');
    ui.options.battleSpeed = 1;
    castUlt(1);
    ok(ui.bt.ult, 'a second character plays a cutscene');
    frame(4, 0.05); key('Escape'); frame(1, 0.05);
    ok(ui.bt.ult && ui.bt.ult.fading, 'Esc skips the cutscene to its fade');
    frame(10, 0.05);
    ok(!ui.bt.ult, 'the skipped cutscene closes');
    ui.options.ultCine = 'off';
    castUlt(1);
    ok(!ui.bt.ult && ui.bt.queue.length + (ui.bt.cur ? 1 : 0) > 0, 'with cutscenes off the Ultimate plays in the battle view');
    ui.options.ultCine = 'first';
    castUlt(0);
    ok(!ui.bt.ult, 'in first-time mode a character who already played the cutscene skips it');
    if (b.allies[2]) { castUlt(2); ok(ui.bt.ult, 'in first-time mode a new character still plays the cutscene'); playTime(); }
    ui.options.ultCine = 'on';
    ui.openSettings(); frame();
    const st = ui.top();
    for (let i = 0; i < 3; i++) key('ArrowDown');
    key('ArrowRight'); frame();
    eq(ui.options.ultCine, 'first', 'Settings switch the Ultimate cutscenes to the first cast in a battle');
    key('ArrowRight'); frame();
    eq(ui.options.ultCine, 'off', 'Settings turn the Ultimate cutscenes off');
    key('ArrowLeft'); key('ArrowLeft'); frame();
    eq(ui.options.ultCine, 'on', 'Settings turn the Ultimate cutscenes back on');
    ok(st === ui.top(), 'the settings window stays open while changing the mode');
    key('ArrowDown'); key('ArrowRight'); frame();
    eq(ui.options.fusionCine, 'first', 'Settings switch the Fusion cutscenes to the first use in a battle');
    key('ArrowRight'); frame();
    eq(ui.options.fusionCine, 'off', 'Settings turn the Fusion cutscenes off');
    key('ArrowLeft'); key('ArrowLeft'); frame();
    eq(ui.options.fusionCine, 'on', 'Settings turn the Fusion cutscenes back on');
    eq(ui.options.ultCine, 'on', 'the Fusion row leaves the Ultimate mode alone');
    ui.screens = [];
    for (const x of b.living) x.hp = 1;
    ui.bt.auto = true;
    for (let i = 0; i < 2000 && !ui.bt.result; i++) frame(1, 0.1);
    ok(ui.bt.result && ui.bt.result.win, 'the cutscene battle is won');
    key('Enter'); frame(5);
    eq(ui.mode, 'field', 'back to the field after the cutscene battle');
  }
  {
    const keep = game.state.party.slice();
    for (const k of ['march', 'danheng']) if (!game.state.roster[k]) game.addChar(k, 10);
    game.state.party = ['march', 'danheng', 'trail', ...keep.filter(k => !['march', 'danheng', 'trail'].includes(k))].slice(0, 4);
    eq(ui.options.fusionCine, 'on', 'Fusion cutscenes are on by default');
    game.startBattle({ enemies: ['reaver:10', 'eliminator:10', 'reaver:10'], lvl: 10, bg: 'station', music: 'battle' });
    ui.drainGameEvents(); frame(20);
    ui.bt.auto = false;
    const b = game.battle, idle = () => b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur && !ui.bt.ult;
    const waitInput = () => { for (let i = 0; i < 900 && !idle() && !b.over; i++) frame(1, 0.05); frame(); };
    const castFus = sel => { for (const a of b.allies) a.energy = a.maxEnergy; for (const x of b.living) x.hp = x.maxHp = 99999; waitInput(); key('KeyR'); frame(); for (let i = 0; i < sel; i++) key('ArrowDown'); key('Enter'); frame(1, 0.01); };
    const playTime = () => { let t = 0; while (ui.bt.ult && t < 20) { frame(1, 0.05); t += 0.05; } return t; };
    eq(b.availableFusions().map(f => f.id).slice(0, 2).join(), 'f_express,f_photo', 'the test party knows two Fusions');
    castFus(0);
    ok(ui.bt.ult instanceof H.Fusions.Show && ui.bt.ult.id === 'f_express', 'a Fusion starts its cutscene');
    ok(!ui.bt.queue.some(x => x.t === 'act' && x.kind === 'fusion'), 'the cutscene takes the place of the Fusion banner');
    ok(ui.bt.ult.P.foes.length >= 2 && ui.bt.ult.P.foes.length === b.living.length, 'the Fusion cutscene knows every enemy it hits');
    eq(ui.bt.ult.P.elems.join(), 'ice,wind', 'the Fusion cutscene bursts in both elements');
    const hp0 = b.living.map(x => x.dHp).join();
    frame(10, 0.05);
    eq(b.living.map(x => x.dHp).join(), hp0, 'the battle waits for the Fusion cutscene before it shows damage');
    const t1 = playTime() + 0.5;
    ok(!ui.bt.ult && t1 > 3, 'the Fusion cutscene ends and the battle goes on (' + t1.toFixed(2) + ' s at x1)');
    frame(20, 0.05);
    ok(ui.bt.dmgBy.get(b.allies[0]) > 0, 'the Fusion damage shows after the cutscene');
    ui.options.battleSpeed = 3;
    castFus(0);
    const t3 = playTime() + 0.5 / 3;
    ok(t3 < t1 / 2.5, 'battle speed x3 speeds up the Fusion cutscene (' + t3.toFixed(2) + ' s)');
    ui.options.battleSpeed = 1;
    castFus(0);
    frame(4, 0.05); key('Escape'); frame(1, 0.05);
    ok(ui.bt.ult && ui.bt.ult.fading, 'Esc skips the Fusion cutscene to its fade');
    frame(10, 0.05);
    ok(!ui.bt.ult, 'the skipped Fusion cutscene closes');
    ui.options.fusionCine = 'off';
    castFus(0);
    ok(!ui.bt.ult, 'with Fusion cutscenes off the Fusion plays in the battle view');
    frame(2, 0.05);
    ok(ui.bt.big && ui.bt.big.text === 'СЛИЯНИЕ', 'the battle view shows the old Fusion banner');
    ui.options.fusionCine = 'first';
    castFus(0);
    ok(!ui.bt.ult, 'in first-time mode a Fusion that already played skips its cutscene');
    castFus(1);
    ok(ui.bt.ult instanceof H.Fusions.Show && ui.bt.ult.id === 'f_photo', 'in first-time mode a new Fusion still plays its cutscene');
    playTime();
    ui.options.fusionCine = 'on';
    for (const x of b.living) x.hp = 1;
    ui.bt.auto = true;
    for (let i = 0; i < 2000 && !ui.bt.result; i++) frame(1, 0.1);
    ok(ui.bt.result && ui.bt.result.win, 'the Fusion cutscene battle is won');
    key('Enter'); frame(5);
    eq(ui.mode, 'field', 'back to the field after the Fusion battle');
    game.state.party = keep;
  }
  {
    const keep = game.state.party.slice();
    if (!game.state.roster.march) game.addChar('march', 10);
    game.state.party = ['trail', 'march', ...keep.filter(k => k !== 'trail' && k !== 'march')].slice(0, 4);
    game.startBattle({ enemies: ['reaver:10', 'eliminator:10', 'reaver:10'], lvl: 10, bg: 'station', music: 'battle' });
    ui.drainGameEvents();
    ui.bt.auto = false;
    const b = game.battle, idle = () => b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur;
    const waitInput = () => { for (let i = 0; i < 600 && !idle() && !b.over; i++) frame(1, 0.1); frame(); };
    waitInput();
    ok(idle(), 'the player gets a turn');
    eq(ui.bt.pick, 'basic', 'a turn starts with Basic ATK picked');
    const u = b.current, t0 = ui.bt.target;
    ok(ui.bt.pv && ui.bt.pv.rows.get(t0) && ui.bt.pv.rows.get(t0).lo > 0, 'the target shows a damage preview');
    b.sp = 3;
    const acts = b.actions;
    key('KeyE'); frame();
    eq(ui.bt.pick, 'skill', 'E picks the Skill');
    eq(b.actions, acts, 'picking the Skill does not act');
    key('KeyQ'); frame();
    eq(ui.bt.pick, 'basic', 'Q picks Basic ATK back');
    key('KeyE'); frame(); key('Escape'); frame();
    ok(ui.bt.pick === 'basic' && !ui.bt.sub, 'Esc drops a picked Skill back to Basic ATK without pausing');
    u.buffs = u.buffs.filter(x => x.s !== 'critR');
    u.base.critR = 0;
    const r = b.preview('basic', t0).rows.get(t0);
    ok(r.hi > r.lo, 'the preview gives a crit ceiling above the normal hit');
    const before = [...ui.bt.dmgBy.values()].reduce((a, v) => a + v, 0);
    key('Space'); frame();
    eq(b.actions, acts + 1, 'Space casts the picked action');
    const evs = ui.bt.queue.slice();
    const end = evs.findIndex(e => e.t === 'turn');
    const mine = evs.slice(0, end < 0 ? evs.length : end).filter(e => e.t === 'dmg' && e.u === t0 && e.src === u && (!e.label || e.label === 'Пробитие'));
    eq(mine.reduce((a, e) => a + e.v, 0), r.lo, 'the preview matches the damage of a non-crit hit');
    const dealt = evs.filter(e => e.t === 'dmg' && e.src && e.src.side === 'ally' && e.u.side === 'enemy').reduce((a, e) => a + e.v, 0);
    waitInput();
    if (!b.over) {
      eq([...ui.bt.dmgBy.values()].reduce((a, v) => a + v, 0) - before, dealt, 'the damage board adds every ally hit on an enemy');
      const march = b.allies.find(a => a.charId === 'march');
      b.current = march; ui.bt.pick = 'basic'; ui.bt.allyMode = null; b.sp = 3;
      key('KeyE'); frame();
      ok(ui.bt.allyMode && ui.bt.pv && [...ui.bt.pv.rows].some(([a, x]) => a.side === 'ally' && x.shield > 0), "March 7th's Skill previews her shield on the chosen ally");
      key('Escape'); frame();
      ok(!ui.bt.allyMode && ui.bt.pick === 'basic', 'Esc leaves the ally choice');
    }
    ui.bt.auto = true;
    for (let i = 0; i < 3000 && !ui.bt.result; i++) frame(1, 0.1);
    key('Enter'); frame(5);
    game.state.party = keep;
  }
  {
    game.startBattle({ waves: [['reaver:3', 'eliminator:3'], ['reaver:4', 'eliminator:4', 'reaver:4']], lvl: 3, ambush: 'enemy', bg: 'station', music: 'battle' });
    ui.drainGameEvents();
    ui.bt.auto = true;
    const seen = new Set(), early = [], barMiss = [], barLate = [];
    for (let i = 0; i < 2000 && !ui.bt.result; i++) {
      frame(1, 0.05);
      const lay = ui.enemyLayout(), bar = ui.turnOrder(40).map(o => o.u), cur = ui.bt.cur;
      for (const u of seen) if (!lay.has(u) && !(ui.bt.fade.get(u) <= 0)) { early.push(u.name); seen.delete(u); }
      for (const u of lay.keys()) { seen.add(u); if (!ui.bt.fade.has(u) && !bar.includes(u)) barMiss.push(u.name); }
      if (cur && cur.t === 'act' && cur.kind === 'enemy' && bar[0] !== cur.u) barLate.push(cur.u.name);
    }
    ok(ui.bt.result && ui.bt.result.win, 'two-wave battle is won');
    eq(early.length, 0, 'enemy sprites stay until their defeat has played and faded (' + early.join(', ') + ')');
    eq(barMiss.length, 0, 'turn order keeps every enemy still standing on the field (' + barMiss.length + ' frames)');
    eq(barLate.length, 0, 'turn order shows the acting enemy first while its move plays (' + barLate.length + ' frames)');
    key('Enter'); frame(5);
  }
  {
    const keep = game.state.party.slice();
    for (const id of ['clara', 'yanqing', 'bailu']) if (!game.state.roster[id]) game.addChar(id, 30);
    game.state.party = ['clara', 'yanqing', 'bailu', 'march'];
    game.startBattle({ waves: [['reaver:30', 'eliminator:30', 'reaver:30'], ['eliminator:30', 'reaver:30', 'eliminator:30']], lvl: 30, bg: 'under', music: 'battle' });
    ui.drainGameEvents();
    game.battle.allies.find(a => a.charId === 'clara').taunt = 99;
    ui.bt.auto = true;
    const follow = new Set();
    for (let i = 0; i < 3000 && !ui.bt.result; i++) { frame(1, 0.05); const cur = ui.bt.cur; if (cur && cur.t === 'act' && cur.kind === 'follow') follow.add(cur.name); }
    ok(ui.bt.result && ui.bt.result.win, 'the battle screen plays a fight of Clara, Yanqing and Bailu to victory');
    ok(follow.has('Ответный удар Сварога') || follow.has('Сварог: Обещание'), 'Svarog counters play on the battle screen (' + [...follow].join(', ') + ')');
    key('Enter'); frame(5);
    game.state.party = keep;
  }
  {
    const keep = game.state.party.slice();
    for (const id of ['kazuma', 'aqua', 'megumin', 'darkness']) if (!game.state.roster[id]) game.addChar(id, 30);
    game.state.party = ['kazuma', 'aqua', 'megumin', 'darkness'];
    game.startBattle({ enemies: ['reaver:30', 'soldier:30', 'shadewalker:30'], lvl: 30, bg: 'snow', music: 'battle' });
    ui.drainGameEvents();
    ui.bt.auto = false; ui.bt.autoSticky = false;
    const b = game.battle, idle = () => b.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur && !ui.bt.ult;
    const waitInput = () => { for (let i = 0; i < 900 && !idle() && !b.over; i++) frame(1, 0.05); frame(); };
    waitInput();
    for (const e of b.living) e.hp = e.maxHp = 1e7;
    const [kz, aq, mg, dk] = b.allies;
    b.current = kz; ui.bt.pick = 'basic'; ui.bt.allyMode = null; b.sp = 5; kz.flags.skillSel = 0;
    key('KeyE'); frame();
    eq(b.abilityFor(kz, 'skill').ab.name, 'Кража', 'E picks Kazuma\'s Steal first');
    key('ArrowDown'); frame();
    eq(b.abilityFor(kz, 'skill').ab.name, 'Связывание', 'Down switches Kazuma to Bind');
    ok(ui.bt.pv && [...ui.bt.pv.rows.values()].some(r => r.bind != null), 'the preview shows the chance to bind');
    key('ArrowDown'); frame();
    ok(b.abilityFor(kz, 'skill').ab.name === 'Иссушающее касание' && ui.bt.allyMode && ui.bt.allyMode.target !== kz, 'Drain Touch asks for another ally');
    key('ArrowUp'); key('ArrowUp'); frame();
    eq(b.abilityFor(kz, 'skill').ab.name, 'Кража', 'Up walks back to Steal');
    ok(!ui.bt.allyMode, 'Steal aims at enemies again');
    const modeHit = ui.hits.find(h => h.x >= 640 - 120 && h.y > 248 && h.y < 300);
    ok(modeHit, 'the skill modes take clicks');
    key('Escape'); frame();
    b.onZero(mg, b.living[0]);
    b.current = aq; ui.bt.pick = 'basic'; ui.bt.allyMode = null; b.sp = 1;
    key('KeyE'); frame();
    ok(ui.allyChoices().includes(mg), 'Aqua can aim her Skill at a fallen ally');
    while (ui.bt.allyMode.target !== mg) { key('ArrowRight'); frame(); }
    ok(ui.bt.pv && ui.bt.pv.revive, 'the preview of a fallen target is a revive');
    const acts = b.actions;
    key('Space'); frame();
    ok(b.actions === acts && mg.dead && ui.bt.msg && ui.bt.msg.includes('Воскрешению'), 'reviving with one Skill Point is refused with a message');
    b.sp = 2; ui.bt.allyMode = { kind: 'skill', target: mg }; ui.bt.pick = 'skill';
    key('Space'); frame();
    ok(b.actions === acts + 1 && !mg.dead && b.sp === 0, 'two Skill Points bring Megumin back');
    for (let i = 0; i < 40; i++) frame(1, 0.05);
    ok(!ui.bt.fade.has(mg) && ui.turnOrder(16).some(o => o.u === mg), 'the revived Megumin returns to the turn order');
    for (const e of b.living) e.hp = Math.min(e.hp, 2000), e.maxHp = 2000;
    ui.bt.auto = true;
    const acts2 = new Set();
    for (let i = 0; i < 4000 && !ui.bt.result; i++) { frame(1, 0.05); const cur = ui.bt.cur; if (cur && cur.t === 'act') acts2.add(cur.name); }
    ok(ui.bt.result && ui.bt.result.win, 'the battle screen plays the KonoSuba party to victory');
    key('Enter'); frame(5);
    game.state.party = keep;
  }
  game.startBattle({ enemies: ['cocolia1:29', 'iceedge:27'], lvl: 29, bg: 'hill', music: 'boss', boss: true });
  ui.drainGameEvents(); frame(20);
  ui.bt.auto = true; for (let i = 0; i < 400 && !ui.bt.result; i++) frame(1, 0.1);
  {
    const qs = H.newState();
    Object.assign(qs, { name: 'Стелла', gender: 'f', map: 'hs_control', x: null, y: null });
    for (const f of ['intro', 'doom', 'express_intro', 'events_note']) qs.flags[f] = true;
    const qg = new H.Game({ state: qs, seed: 3 }), keepQ = ui.game;
    ui.game = qg; ui.screens = []; ui.toasts = []; ui.dlg = null; ui.mode = 'field'; ui.enterField();
    qg.chatSync(); qg.chatAuto('herta_test'); frame();
    ok(ui.toasts.some(t => t.text.includes('Миссия Освоения «Виртуальная вселенная: Первичный тест»')), 'a new mission shows a toast with its type');
    ok(qg.navPoints('hs_office').some(p => p.quest === 'su_beta'), 'Herta is marked on the office map');
    ok(qg.navPoints('hs_control').some(p => p.questRoute === 'su_beta'), 'the door to the office is marked as the way to the quest');
    const mw = ui.openMission(); frame();
    ok(mw.rows().some(r => r.kind === 'chap' && r.ch === 'prologue') && mw.ms().some(r => r.m.id === 'su_beta' && r.type === 'trail'), 'the Simulated Universe test is listed under the prologue Trailblaze chapter');
    mw.selId = 'su_beta'; frame();
    key('KeyM'); frame();
    const nav = ui.top();
    ok(nav && nav.area === 'hs_office' && nav.detail && nav.points()[nav.sel].quest === 'su_beta', 'M in the mission window shows the selected mission on the map');
    ui.screens = []; ui.game = keepQ; ui.enterField();
  }
  {
    const ms = H.newState();
    Object.assign(ms, { name: 'Стелла', gender: 'f', map: 'u_boulder', x: 8, y: 6 });
    for (const m of H.TRAIL_MISSIONS.slice(0, 16)) for (const f of m.done.split('|')) ms.flags[f] = true;
    ms.flags.events_note = true;
    const mg = new H.Game({ state: ms, seed: 5 }), keepM = ui.game;
    mg.setQuest('hook_treasure', 'talk');
    ui.game = mg; ui.screens = []; ui.toasts = []; ui.dlg = null; ui.mode = 'field'; ui.enterField(); frame();
    ok(mg.alerts().missions, 'a new mission lights the phone tile');
    eq(mg.missionTracked().key, 'tb_purge', 'the HUD tracks the current Trailblaze mission');
    const s = ui.openMission(); frame();
    ok(s.rows().some(r => r.kind === 'head' && r.type === 'trail') && s.rows().some(r => r.kind === 'head' && r.type === 'comp'), 'the mission window groups Trailblaze and Companion missions');
    ok(s.rows().some(r => r.kind === 'chap' && r.ch === 'dawn') && s.rows().some(r => r.kind === 'chap' && r.ch === 'furnace'), 'each group shows its chapter card');
    key('KeyE'); frame();
    ok(s.tab === 1 && s.ms().every(r => r.type === 'trail'), 'E switches to the Trailblaze tab');
    key('KeyE'); frame();
    ok(s.tab === 2 && s.selId === 'hook_treasure', 'the Companion tab selects Hook\'s mission');
    ok(!mg.alerts().missions, 'seeing the mission card clears the new mark');
    key('Enter'); frame();
    eq(mg.missionTracked().id, 'hook_treasure', 'Enter tracks the selected mission');
    key('KeyE'); frame();
    ok(s.tab === 3 && !s.rows().length, 'the Adventure tab can be empty');
    key('KeyQ'); frame(); key('Enter'); frame();
    ok(mg.missionTracked() === null, 'Enter on the tracked mission stops tracking');
    key('Escape'); frame();
    eq(ui.screens.length, 0, 'Esc closes the mission window');
    mg.trackMission('hook_treasure'); frame();
    ui.openMenu(); frame();
    ok(ui.top().draw && true, 'the phone draws with the Missions tile');
    ui.screens = []; ui.game = keepM; ui.enterField();
  }
  {
    const SU = H.SU;
    for (const p of Object.keys(SU.PATHS)) ok(G.PATH_ART[p], 'Simulated Universe path glyph ' + p);
    for (const cu of SU.CURIOS) { G.curioIcon(stubCtx, cu.id, 4, 4, 32); ok(G.CURIO_ART[cu.id] || cu.id.startsWith('c_wax_'), 'curio icon ' + cu.id); }
    for (const ev of Object.values(SU.EVENTS)) { ok(G.SU_EVENT_ART[ev.art], 'event frame art ' + ev.art); G.suEventIcon(stubCtx, ev.art, 0, 0, 96); }
    for (const kind of ['su_portal', 'su_frame', 'su_heal', 'su_tp']) G.drawObject(stubCtx, kind, 64, 64, { col: '#ff6a5a', done: kind === 'su_frame' }, 1.1);
    ok(G.ITEM_ART.frag, 'Cosmic Fragments have an icon');
    ok(H.TRACKS.sim && H.TRACKS.sim.mel.length === 32 && H.TRACKS.sim.bass.length === 16, 'the simulation plays its own music');
    const st = H.newState();
    Object.assign(st, { name: 'Стелла', gender: 'f', map: 'hs_office', x: null, y: null, power: 200 });
    for (const f of ['intro', 'doom', 'express_intro', 'events_note', 'su_open', 'su_beta_done', 'su_clear_1', 'first_gepard']) st.flags[f] = true;
    for (const id of ['march', 'danheng', 'arlan', 'herta']) st.roster[id] = { lvl: 40, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
    st.roster.trail.lvl = 40;
    st.party = ['trail', 'march', 'danheng', 'arlan'];
    st.suPaths = ['preservation', 'remembrance'];
    st.suClaims = [{ world: 1, sets: [{ set: 'station', rl: 3 }] }];
    const sg = new H.Game({ state: st, seed: 13 }), keep = ui.game;
    ui.game = sg; ui.screens = []; ui.dlg = null; ui.mode = 'field'; ui.enterField();
    const talkOut = (max = 200) => { for (let i = 0; i < max && sg.pending && ['say', 'choice', 'tut'].includes(sg.pending.type); i++) { key('Enter'); frame(); } };
    sg.runScript('su_terminal'); frame(2);
    const term = ui.top();
    ok(term && term.full && term.step === 0, 'the machine opens the Simulated Universe terminal');
    eq(term.wsel, 1, 'the terminal starts on the first world that still pays the first-clear bonus');
    const j0 = sg.state.jade;
    key('KeyC'); frame();
    ok(!sg.suClaims().length && sg.state.jade === j0 + SU.TUN.jade && sg.state.power === 200 - SU.TUN.power, 'C at the terminal claims the waiting reward for 40 power');
    key('ArrowDown'); key('ArrowDown'); frame(); key('Enter'); frame();
    eq(term.step, 0, 'a closed world cannot be entered');
    key('ArrowUp'); key('ArrowUp'); frame();
    key('Enter'); frame();
    eq(term.step, 1, 'Enter on World 2 opens the choice of Path');
    key('ArrowRight'); frame(); eq(term.psel, 1, 'the Path ring moves to Remembrance');
    key('ArrowRight'); frame(); key('Enter'); frame();
    eq(term.step, 1, 'a Path without its Aeon cannot be chosen');
    key('ArrowLeft'); key('Enter'); frame();
    eq(term.step, 2, 'the open Path leads to the team');
    key('ArrowLeft'); key('Enter'); frame();
    ok(ui.top() && ui.top() !== term, 'the team button opens the team screen');
    key('Escape'); frame();
    key('ArrowRight'); key('Enter'); frame(3);
    ok(sg.state.su && sg.state.su.world === 2 && sg.state.su.path === 'remembrance' && !ui.screens.length, 'the terminal starts World 2 on the Path of Remembrance');
    eq(ui.audio.wanted, 'sim', 'the simulation music plays in the domain');
    ok(/зона 1\/11/.test(ui.suPlaceLabel().world) && ui.suHint() === 'Победите стража зоны, и порталы откроются', 'the field shows the world, the zone number and what to do');
    key('KeyM'); frame();
    const run = ui.top();
    ok(run && run.items, 'M opens the run status');
    key('ArrowRight'); frame(); eq(run.tab, 1, 'the run status switches to curios');
    key('Escape'); frame();
    ok(!ui.screens.length, 'Esc closes the run status');
    for (const id of ['r_alienation', 'r_hardship', 'r_hatred']) sg.suAddBless(id);
    sg.suAddCurio('c_cheese');
    const foe = sg.map.ents.find(e => e.kind === 'enemy' && e.ch === '1');
    sg.encounter(foe, 'player'); ui.drainGameEvents();
    ui.bt.auto = false; ui.bt.autoSticky = false;
    eq(ui.mode, 'battle', 'touching the guard starts a battle');
    ok(sg.battle.su && sg.battle.su.res.on, 'three blessings of the Path bring the Resonance into battle');
    for (let i = 0; i < 300 && !(sg.battle.phase === 'input' && !ui.bt.queue.length && !ui.bt.cur); i++) frame(1, 0.1);
    sg.battle.su.res.energy = sg.battle.su.res.max;
    frame();
    key('KeyF');
    ok(ui.bt.queue.some(e => e.t === 'act' && e.kind === 'res'), 'F releases the Path Resonance');
    ui.bt.auto = true;
    let big = false;
    for (let i = 0; i < 3000 && !ui.bt.result; i++) { frame(1, 0.05); if (ui.bt.big && ui.bt.big.text === 'РЕЗОНАНС ПУТИ') big = true; }
    ok(big, 'the Resonance plays its banner');
    ok(ui.bt.result && ui.bt.result.win && ui.bt.result.su && ui.bt.result.frag > 0, 'the battle is won and pays Cosmic Fragments');
    key('Enter'); frame(3);
    talkOut();
    ok(sg.suPaths().includes('hunt'), 'the first win in World 2 brings Lan and opens the Hunt');
    ok(ui.top() && sg.pending && sg.pending.ui === 'su_bless', 'a blessing choice follows the battle');
    const nb = sg.state.su.bless.length;
    key('ArrowRight'); frame(); key('Enter'); frame(3);
    eq(sg.state.su.bless.length, nb + 1, 'Enter takes the chosen blessing');
    for (let i = 0; i < 6 && sg.pending; i++) { if (sg.pending.ui === 'su_bless' || sg.pending.ui === 'su_curio') { key('Enter'); frame(2); } else talkOut(); }
    if (sg.map.ents.some(e => e.kind === 'enemy' && e.ch === '2' && sg.visible(e))) sg.state.su.dom.done[2] = true;
    frame(2);
    ok(sg.state.su.dom.cleared && sg.map.ents.some(e => e.kind === 'portal' && sg.visible(e)), 'the cleared domain shows its portals');
    ok(ui.suHint() === 'Порталы открыты: выберите следующую зону', 'the field says the portals are open');
    sg.state.su.frag = 900;
    sg.suEnter('respite');
    frame(2);
    const herta = sg.map.ents.find(e => e.kind === 'npc' && e.def.who === 'herta');
    adj(sg, herta); sg.interact(); frame(); talkOut();
    const shop = ui.top();
    ok(shop && sg.pending && sg.pending.ui === 'su_shop', 'Herta\'s puppet opens the shop');
    shop.sel = 0; key('Enter'); frame();
    ok(ui.top() !== shop && sg.pending.ui === 'su_bless', 'buying a blessing opens the choice over the shop');
    key('Enter'); frame();
    ok(ui.top() === shop && sg.pending.ui === 'su_shop', 'after the choice the shop is still open');
    key('Escape'); frame(2);
    ok(!sg.pending && !ui.screens.length, 'Esc leaves the shop');
    sg.state.su.dom.final = true;
    adj(sg, herta); sg.interact(); frame(); talkOut();
    const shop2 = ui.top();
    shop2.sel = sg.suShop().findIndex(e => e.id === 'enhance'); key('Enter'); frame();
    const enh = ui.top();
    ok(enh !== shop2 && sg.pending.ui === 'su_enhance', 'the last respite offers the enhancement screen');
    const first = sg.state.su.bless[0];
    key('Enter'); frame();
    ok(first.lvl === 2, 'Enter enhances the chosen blessing for fragments');
    key('Escape'); frame();
    ok(ui.top() === shop2, 'the enhancement screen returns to the shop');
    key('Escape'); frame(2);
    sg.pending = { type: 'ui', ui: 'su_curio', opts: sg.suCurioOffer(), why: 'Проверка' }; frame();
    const nc = sg.state.su.curios.length;
    key('ArrowRight'); key('Enter'); frame(2);
    eq(sg.state.su.curios.length, nc + 1, 'the curio choice adds the curio');
    Object.assign(sg.state.su.dom, { type: 'event', layout: 'su_event', cleared: false, event: 'lottery' });
    sg.loadMap('su_event', 's', { silent: true }); frame();
    adj(sg, sg.map.ents.find(e => e.kind === 'su_frame')); sg.interact(); frame(2);
    ok(sg.script && sg.script.name === 'su_ev_lottery', 'the frame starts its event with the event art');
    talkOut(200);
    for (let i = 0; i < 10 && sg.pending; i++) { key('Enter'); frame(2); talkOut(); }
    ok(sg.state.su.dom.cleared, 'the event ends and opens the portals');
    sg.suAbort(); frame(2);
    const end = ui.top();
    ok(end && end.full && sg.pending.ui === 'su_end', 'abandoning the run shows its summary');
    key('Enter'); frame(3);
    ok(!sg.state.su && sg.map.id === 'hs_office' && !ui.screens.length, 'the summary returns the team to Herta\'s office');
    ok(sg.suStart(1, 'preservation', sg.state.party), 'a second run starts');
    for (const k of sg.state.su.team) sg.state.su.hp[k] = 1;
    sg.state.su.dom.groups[1].lvl = 90;
    sg.encounter(sg.map.ents.find(e => e.kind === 'enemy' && e.ch === '1'), 'enemy'); ui.drainGameEvents();
    ui.bt.auto = true;
    for (let i = 0; i < 3000 && !ui.bt.result; i++) frame(1, 0.05);
    ok(ui.bt.result && ui.bt.result.lost && ui.loseOptions(ui.bt.result).length === 1, 'a lost free run offers only to end the immersion');
    key('Enter'); frame(3);
    ok(sg.pending && sg.pending.ui === 'su_end' && ui.mode === 'field', 'the loss leads to the run summary');
    key('Enter'); frame(3);
    ok(!sg.state.su && sg.map.id === 'hs_office', 'after the loss the team is back in the office');
    ui.screens = []; ui.game = keep; ui.mode = 'field'; ui.enterField();
  }
  {
    const st = H.newState();
    Object.assign(st, { name: 'Стелла', gender: 'f', map: 'hs_office', x: null, y: null, quests: { su_beta: 'enter' } });
    for (const f of ['intro', 'asta_met', 'hs_power', 'arlan_met', 'doom', 'express_intro', 'events_note', 'su_open']) st.flags[f] = true;
    for (const id of ['march', 'danheng', 'arlan']) st.roster[id] = { lvl: 12, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
    st.roster.trail.lvl = 12;
    st.party = ['trail', 'march', 'danheng', 'arlan'];
    const tg = new H.Game({ state: st, seed: 77 }), keepT = ui.game;
    ui.game = tg; ui.screens = []; ui.toasts = []; ui.dlg = null; ui.mode = 'field'; ui.enterField();
    adj(tg, tg.map.ents.find(e => e.kind === 'prop' && e.def.obj === 'su_machine'));
    key('Enter'); frame();
    const seen = new Set();
    let guard = 0;
    while (guard++ < 6000) {
      if (ui.mode === 'battle') { ui.bt.auto = true; frame(1, 0.1); if (ui.bt.result) { key('Enter'); frame(); } continue; }
      if (ui.screens.length || tg.pending || tg.script || ui.dlg) { if (tg.pending && tg.pending.type === 'ui') seen.add(tg.pending.ui); if (tg.pending && tg.pending.type === 'tut') seen.add('tut'); key('Enter'); frame(); continue; }
      const su = tg.state.su;
      if (!su) break;
      const dom = su.dom;
      if (['combat', 'elite', 'boss'].includes(dom.type) && !dom.cleared) { tg.encounter(tg.map.ents.find(x => x.kind === 'enemy' && x.ch === '1' && tg.visible(x)), 'player'); ui.drainGameEvents(); continue; }
      if (!dom.cleared) { adj(tg, tg.map.ents.find(x => x.kind === 'su_frame')); key('Enter'); frame(); continue; }
      const portal = tg.map.ents.find(x => x.kind === 'portal' && tg.visible(x));
      tg.placePlayer(portal.x, portal.y); tg.onStep(); frame();
    }
    ok(guard < 6000, 'the tutorial run plays to the end through the interface');
    ok(['su_bless', 'su_end', 'tut'].every(x => seen.has(x)), 'the run showed the tutorial hints, the blessing choice and the summary (' + [...seen].join(', ') + ')');
    ok(!tg.state.su && tg.map.id === 'hs_office' && tg.state.quests.su_beta === 'done' && tg.state.roster.herta, 'after the summary Herta takes the report and joins the team');
    eq(tg.state.inv.relics.filter(r => H.PLANAR_SETS.includes(r.set)).length, 4, 'the tutorial pays two ornament sets');
    ui.screens = []; ui.game = keepT; ui.mode = 'field'; ui.enterField();
  }
  {
    const st = H.newState();
    Object.assign(st, { name: 'Стелла', gender: 'f', map: 'express', x: 4, y: 5, jade: 0, credits: 1000 });
    for (const f of ['intro', 'doom', 'express_intro', 'jarilo_arrive', 'events_note', 'fh_met', 'fh_done', 'fh_lie', 'fh_post']) st.flags[f] = true;
    for (const id of ['march', 'danheng', 'himeko', 'welt', 'natasha', 'serval', 'asta', 'arlan']) st.roster[id] = { lvl: 40, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
    st.roster.trail.lvl = 40;
    st.party = ['trail', 'march', 'danheng', 'himeko'];
    st.quests.fh_lights = 'done';
    st.inv.items = { lucent: 600, feather: 1500 };
    const fg = new H.Game({ state: st, seed: 33 }), keepF = ui.game;
    fg.chats().day = H.dayKey ? H.dayKey(fg.now()) : null;
    for (const t of H.CHAT.THREADS) if (!t.daily) fg.chats().th[t.id] = { at: 0, k: 0, n: 999, picks: [], done: true };
    ui.game = fg; ui.screens = []; ui.toasts = []; ui.dlg = null; ui.mode = 'field'; ui.enterField();
    const toMirror = () => { ui.screens = ui.screens.filter(s => s.keep); adj(fg, fg.map.ents.find(e => e.ch === 'm' && fg.visible(e))); key('Enter'); frame(); };
    const until = (fn, pick) => { let guard = 0; while (guard++ < 40 && !fn()) { if (fg.pending && fg.pending.type === 'choice' && pick) for (let i = 0; i < pick; i++) key('ArrowDown'); key('Enter'); frame(); } return fn(); };
    frame(2);
    G.drawObject(stubCtx, 'fhmirror', 64, 96, {}, 0.5);
    toMirror();
    ok(until(() => ui.top() && ui.top().fh), 'the mirror menu opens the Forgotten Hall screen');
    frame(3);
    ok(ui.top().sel === 1, 'the hall selects the first open stage');
    key('ArrowRight'); frame();
    key('Enter'); frame();
    ok(ui.top().sel === 2 && ui.toasts.some(t => /этапа 1/.test(t.text)), 'a locked stage explains what opens it');
    key('ArrowLeft'); key('Enter'); frame(2);
    const team = ui.top();
    ok(team.fh && team.toggle, 'Enter opens the team screen of the stage');
    key('KeyF'); frame(2);
    ok(ui.top().fh && ui.top().open && fg.fhRun() && fg.fhRun().n === 1, 'F starts the stage and shows the node');
    key('Enter'); frame(2);
    ok(ui.mode === 'battle' && fg.battle && fg.battle.fh, 'the node opens a Forgotten Hall battle');
    let guard = 0;
    while (ui.mode === 'battle' && guard++ < 4000) { ui.bt.auto = true; frame(1, 0.1); if (ui.bt.result) { key('Enter'); frame(); } }
    ok(fg.fhRec(1) && fg.fhRec(1).clear && ui.top() && ui.top().fh && ui.top().go, 'after the battle the stage summary shows its stars');
    frame(30);
    key('Enter'); frame(2);
    ok(ui.top().toggle && ui.screens.filter(s => s.fh).length === 2, 'the summary leads to the next stage team');
    key('Escape'); frame(); key('Escape'); frame();
    ok(!ui.screens.some(s => s.fh), 'Esc leaves the Forgotten Hall');
    until(() => !fg.script && !fg.pending);
    toMirror();
    ok(until(() => ui.top() && ui.top().fh && ui.top().drawJokes, 1), 'the second option opens «Бесценные ценности»');
    const shop = ui.top(), lu0 = fg.state.inv.items.lucent;
    key('Enter'); frame();
    ok(lu0 - fg.state.inv.items.lucent === 200 && fg.fhConeOwned('fermata') === 1, 'Enter buys the selected Light Cone');
    key('KeyE'); frame();
    ok(shop.tab === 1, 'E switches to «Шутки сбываются»');
    key('Enter'); frame();
    ok(ui.top() !== shop && ui.top().make && fg.state.inv.items.resin === 1, 'buying the resin opens the relic maker');
    key('ArrowRight'); key('ArrowRight'); key('ArrowDown'); frame();
    const r0 = fg.state.inv.relics.length;
    key('Enter'); frame();
    ok(fg.state.inv.relics.length === r0 + 1 && ui.top() === shop, 'the resin becomes a relic and the maker closes');
    key('ArrowDown'); key('ArrowRight'); key('ArrowRight'); frame();
    const c0 = fg.state.credits;
    key('Enter'); frame();
    ok(fg.state.inv.items.exp3 === 3, 'the quantity buttons buy several Traveler\'s Guides');
    key('Escape'); frame();
    ok(!ui.screens.some(s => s.fh) && c0 === fg.state.credits, 'Esc leaves the shop');
    until(() => !fg.script && !fg.pending);
    fg.fhBegin(2);
    ui.screens = []; ui.openFhRun(); frame();
    key('Enter'); frame(2);
    ok(ui.mode === 'battle', 'the node screen starts the fight');
    ui.drawFhHud(stubCtx, fg.battle);
    fg.battle.finish(false); fg.battle.fh.out = true;
    ui.finishBattle(); frame(2);
    ok(ui.bt.result.lost && ui.bt.result.fh && ui.fhLoseOptions(ui.bt.result).length === 2, 'a lost Forgotten Hall battle offers a retry');
    key('ArrowDown'); key('Enter'); frame(2);
    ok(ui.mode === 'field' && !fg.fhRun() && ui.top() && ui.top().fh, 'leaving after a defeat returns to the hall');
    ui.screens = []; ui.game = keepF; ui.mode = 'field'; ui.enterField();
  }
  ok(bad.length === 0, 'every colour used by the new art and UI is valid (' + bad.slice(0, 4).join('; ') + ')');
}

{
  const fs = require('fs');
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  const node = extra => Object.assign({ connect() {}, disconnect() {} }, extra);
  let voices = 0;
  const ctx = {
    sampleRate: 4000, currentTime: 0, destination: node(),
    createGain: () => node({ gain: param() }),
    createBiquadFilter: () => node({ type: '', frequency: param(), Q: param(), gain: param() }),
    createStereoPanner: () => node({ pan: param() }),
    createDynamicsCompressor: () => node({ threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }),
    createConvolver: () => node({ buffer: null }),
    createBuffer: (ch, n) => ({ getChannelData: () => new Float32Array(n) }),
    createBufferSource: () => node({ buffer: null, loop: false, start() {}, stop() {} }),
    createPeriodicWave: () => ({}),
    createWaveShaper: () => node({ curve: null }),
    createOscillator: () => node({ type: 'sine', frequency: param(), detune: param(), setPeriodicWave() {}, start() { voices++; }, stop() {} })
  };
  const midiTracks = Object.entries(H.TRACKS).filter(([, tr]) => tr.midi);
  ok(midiTracks.some(([id]) => id === 'menu'), 'the title screen has a MIDI track');
  for (const [id, tr] of midiTracks) {
    const file = path.join(__dirname, '..', tr.midi);
    ok(fs.existsSync(file), 'MIDI file of track ' + id + ' exists');
    ok(H.TRACKS[tr.fallback] ? !!H.TRACKS[tr.fallback].mel : !!tr.mel, 'track ' + id + ' has a chiptune fallback');
    const song = H.Midi.parse(fs.readFileSync(file));
    const span = song.loopEnd - song.loopStart;
    ok(span > 30 && song.loopStart >= 0, 'track ' + id + ' loops over ' + span.toFixed(1) + ' s');
    ok(song.notes.length > 150, 'track ' + id + ' has ' + song.notes.length + ' notes');
    ok(song.notes.every(n => n.end > n.t && n.end <= song.loopEnd + 1e-6), 'every note of ' + id + ' ends inside the loop');
    ok(song.ctrl.some(c => c.kind === 'prog'), 'track ' + id + ' sets programs');
    const pl = new H.Midi.Player(ctx, ctx.destination, song);
    const seen = [];
    pl.note = (e, at, end) => seen.push([e, at, end]);
    pl.base = 0; pl.i = 0;
    pl.pump(song.loopEnd + span * 2 - 0.001);
    const inLoop = song.notes.filter(n => n.t >= song.loopStart).length;
    eq(seen.length, song.notes.length + inLoop * 2, 'track ' + id + ' plays the intro once and then repeats the loop');
    const second = seen[song.notes.length];
    ok(second && Math.abs(second[1] - (second[0].t + span)) < 1e-9 && second[0].t >= song.loopStart, 'the second pass of ' + id + ' starts at the loop point');
    ok(seen.every(([e, at, end]) => end > at && end <= at - e.t + song.loopEnd + 1e-9), 'notes of ' + id + ' are cut at the loop end');
    const real = new H.Midi.Player(ctx, ctx.destination, song);
    voices = 0;
    real.base = 0; real.i = 0;
    real.pump(song.loopEnd);
    ok(voices > song.notes.length, 'track ' + id + ' builds voices for every channel (' + voices + ' oscillators)');
  }
  eq(H.Midi.parse(Uint8Array.from([77, 84, 104, 100, 0, 0, 0, 6, 0, 0, 0, 0, 0, 96])).notes.length, 0, 'an empty MIDI file parses');
  let bad = false;
  try { H.Midi.parse(Uint8Array.from([1, 2, 3, 4])); } catch (e) { bad = true; }
  ok(bad, 'a file without the MThd header is rejected');
  const a = new H.Audio();
  a.music('menu');
  eq(a.wanted, 'menu', 'the audio keeps the wanted track until the context starts');
  eq(H.TRACKS.battle.midi, 'content/music/Battle Theme.mid', 'regular battles outside Jarilo-VI play the Battle Theme MIDI');
  eq(H.TRACKS.boss.midi, H.TRACKS.battle.midi, 'bosses without their own theme play the Battle Theme MIDI');
  const THEMES = { order: 'Order.mid', svarog: 'Godfather.mid', doomsday: 'Dawn of Disaster.mid', gepard: 'Braving the Cold.mid' };
  for (const [id, file] of Object.entries(THEMES)) eq(H.TRACKS[id] && H.TRACKS[id].midi, 'content/music/' + file, 'track ' + id + ' plays ' + file);
  const BOSS_THEMES = { doomsday: 'doomsday', gepard: 'gepard', gepard2: 'gepard', svarog: 'svarog', mine: 'boss', alley: 'order', seele: 'order' };
  for (const [enc, music] of Object.entries(BOSS_THEMES)) eq(H.ENCOUNTERS[enc].music, music, 'encounter ' + enc + ' plays ' + music);
  eq(H.CALYX.find(c => c.boss === 'doomsday').music, 'doomsday', 'the Echo of War with the Doomsday Beast plays Dawn of Disaster');
  for (const id of Object.keys(H.MAPS)) {
    const probe = new H.Game({ state: Object.assign(H.newState(), { map: id, x: null, y: null }), seed: 1 });
    const area = probe.areaOf(id);
    eq(probe.battleTheme(), area && area.world.id === 'jarilo' ? 'order' : 'battle', 'regular battles on map ' + id + ' play ' + probe.battleTheme());
  }
  for (const [mapId, music] of [['j_plains', 'order'], ['hs_base', 'battle']]) {
    const fg = new H.Game({ state: Object.assign(H.newState(), { map: mapId, x: null, y: null }), seed: 3 });
    const foe = fg.map.ents.find(x => x.kind === 'enemy');
    ok(foe, 'map ' + mapId + ' has a field enemy');
    fg.encounter(foe, 'player');
    eq(fg.battleCtx && fg.battleCtx.music, music, 'a field battle on ' + mapId + ' plays ' + music);
  }
  const encMusic = name => (H.ENCOUNTERS[name] || {}).music || 'battle';
  let held = 0;
  for (const [name, steps] of Object.entries(H.SCRIPTS)) {
    steps.forEach((st, i) => {
      const theme = st && typeof st === 'object' ? (st.music || (st.cine && H.Cine.CINES[st.cine] && H.Cine.CINES[st.cine].keepMusic && H.Cine.CINES[st.cine].music)) : null;
      if (!theme || !THEMES[theme]) return;
      const rest = steps.slice(i + 1);
      const fight = rest.findIndex(x => x && typeof x === 'object' && x.battle);
      const breaks = rest.slice(0, fight).some(x => x && typeof x === 'object' && (x.music || x.cine || x.goto || x.jump || x.ui));
      ok(fight >= 0 && !breaks && encMusic(rest[fight].battle) === theme, name + ': ' + theme + ' keeps playing into the battle ' + (fight >= 0 ? rest[fight].battle : '?'));
      held++;
    });
  }
  ok(held >= 6, 'story scenes start the battle themes early (' + held + ')');
  const cocoliaFights = Object.entries(H.ENCOUNTERS).filter(([, e]) => (e.enemies || []).concat(...(e.waves || [])).some(x => /^cocolia/.test(x)));
  ok(cocoliaFights.length === 2 && cocoliaFights.every(([, e]) => e.music === 'cocolia'), 'both Cocolia fights play Wildfire');
  ok(Object.entries(H.ENCOUNTERS).every(([, e]) => !e.music || e.music === 'cocolia' || !(e.enemies || []).some(x => /^cocolia/.test(x))), 'no other fight uses the Cocolia theme');
  ok(H.CALYX.filter(c => /^cocolia/.test(c.boss || '')).every(c => c.music === 'cocolia'), 'the Echo of War with Cocolia plays Wildfire');
  eq(H.TRACKS.cocolia.midi, 'content/music/Cocolia Boss Theme.mid', 'the Cocolia track points to the Wildfire MIDI');
}

{
  const SU = H.SU, sb = H.battleStat;
  const ONS = new Set(['stat', 'foe', 'spec', 'lethal', 'start', 'turn', 'turnEnd', 'act', 'hurt', 'heal', 'healGive', 'low', 'break', 'kill', 'freeze', 'follow', 'dot', 'foeTurn']);
  const DOS = new Set(['shield', 'heal', 'energy', 'energyP', 'freezeAll', 'grit', 'critBoost', 'quake', 'quakeBack', 'lowHeal', 'hpDmg', 'dewCharge', 'dew', 'hitFreeze', 'dissocFrozen', 'dotPop', 'spread', 'delay', 'advance', 'healAllBuff', 'buff', 'buffPair', 'splash', 'hpToShield', 'foeHpCut', 'resFull', 'spCost', 'foeDebuff', 'aftertaste', 'vine', 'vineRelease', 'dotEcho', 'survive']);
  eq(Object.keys(SU.PATHS).join(), 'preservation,remembrance,nihility,abundance,hunt,destruction,elation', 'the seven Paths of the 1.0 Simulated Universe');
  eq(SU.BLESSINGS.length, 56, 'fifty-six blessings');
  eq(new Set(SU.BLESSINGS.map(b => b.id)).size, 56, 'blessing ids are unique');
  eq(new Set(SU.BLESSINGS.map(b => b.name)).size, 56, 'blessing names are unique');
  for (const p of Object.keys(SU.PATHS)) {
    eq(SU.BLESSINGS.filter(b => b.path === p).map(b => b.rar).sort().join(''), '11122233', 'path ' + p + ' has three 1★, three 2★ and two 3★ blessings');
    ok(SU.PATHS[p].res && SU.PATHS[p].buffText && SU.PATHS[p].gen && SU.PATHS[p].aeon, 'path ' + p + ' names its Aeon, buff and Resonance');
  }
  for (const b of SU.BLESSINGS) {
    ok(Array.isArray(b.text) && b.text.length === 2 && b.text.every(t => t && t.length < 220), 'blessing text base and enhanced ' + b.id);
    for (const f of b.fx) ok(ONS.has(f.on) && (f.on === 'stat' || f.on === 'foe' || f.on === 'spec' || DOS.has(f.do)), 'blessing effect kind ' + b.id + ' ' + f.on + ' ' + f.do);
  }
  eq(new Set(SU.CURIOS.map(c => c.id)).size, SU.CURIOS.length, 'curio ids are unique');
  ok(SU.CURIOS.filter(c => c.run && c.run.wax).length === 7 && SU.CURIOS.filter(c => c.bad).length === 2, 'curios include the seven sealing waxes and two bad clocks');
  for (const c of SU.CURIOS) ok(c.name && c.text && (c.fx || c.run || c.instant), 'curio has an effect ' + c.id);
  eq(SU.WORLDS.map(w => w.set).join(), ',station,vonwacq,salsotto', 'worlds 2, 3 and 4 drop Space Sealing Station, Sprightly Vonwacq and Inert Salsotto');
  for (const w of SU.WORLDS) {
    ok(w.plan[0][0] === 'combat' && w.plan[w.plan.length - 1].join() === 'boss', 'world ' + w.id + ' starts with a battle and ends with the boss');
    for (const step of w.plan) for (const t of step) ok(SU.DOMAINS[t] && SU.LAYOUTS[t].every(id => H.MAPS[id] && H.MAPS[id].su), 'domain type has layouts ' + t);
    for (const list of [w.pools.normal, w.pools.elite]) for (const g of list) ok(g.every(id => H.ENEMIES[id]), 'world ' + w.id + ' enemies exist ' + g.join());
    for (const b of w.pools.boss) for (const wave of b.waves) ok(wave.every(id => H.ENEMIES[id]), 'world ' + w.id + ' boss waves exist');
    ok(w.aeons.every(a => SU.PATHS[a.path] && SU.SCRIPTS['su_aeon_' + a.path]), 'world ' + w.id + ' Aeon meetings');
  }
  for (const id of ['su_combat_a', 'su_combat_b', 'su_elite', 'su_event', 'su_respite']) for (const ch of ['x', 'y', 'z', 's']) ok(H.mapLayout(id).marks[ch], 'domain ' + id + ' has mark ' + ch);
  for (const p of Object.keys(SU.PATHS)) ok(SU.SCRIPTS['su_aeon_' + p] && SU.SCRIPTS['su_aeon_' + p].some(st => st && st.su === 'unlock' && st.path === p), 'Aeon meeting unlocks ' + p);
  for (const [id, e] of Object.entries(SU.EVENTS)) ok(['event', 'trade', 'encounter'].includes(e.kind) && SU.SCRIPTS[e.script] && SU.SCRIPTS[e.script].some(st => st && st.su === 'done'), 'event script ends the domain ' + id);
  for (const k of ['event', 'trade', 'encounter']) ok(Object.values(SU.EVENTS).filter(e => e.kind === k).length >= 3, 'at least three events of kind ' + k);

  const G0 = new H.Game({ seed: 1 });
  const spec = id => ({ charId: id, key: id, lvl: 30, stats: G0.baseStats(id, 30, 0), hp: null, energy: 0 });
  const fight = (bless, opt = {}) => new H.Battle({ party: (opt.party || ['march', 'himeko', 'natasha', 'danheng']).map(spec), enemies: opt.enemies || ['reaver:28', 'eliminator:28', 'flamespawn:28'], seed: opt.seed || 5, lvl: 28, su: { path: opt.path || 'preservation', bless: bless.map(id => ({ id, lvl: opt.lvl || 1 })), curios: (opt.curios || []).map(id => ({ id })) } });
  const ready = (bless, opt) => { const b = fight(bless, opt); b.suStart(); return b; };
  const pair = (id, opt) => [ready([], opt), ready([id], opt)];
  const dmg = (b, o, from) => (from === 'foe' ? b.dmgCalc(b.enemies[0], b.allies[0], 1, o, false) : b.dmgCalc(b.allies[0], b.enemies[0], o.fixed != null ? 0 : 1, o, false));
  {
    const plain = new H.Battle({ party: ['march'].map(spec), enemies: ['reaver:20'], seed: 2, lvl: 20 });
    ok(!plain.su && !plain.resReady(), 'a battle outside the simulation has no blessings and no Resonance');
    ok(ready(['p_sentinel']).allies.every(a => a.shield > 0), 'Конструкция: Часовой shields the team at the start of battle');
    const [c, d] = pair('p_firm');
    c.allies[0].shield = d.allies[0].shield = 50;
    ok(dmg(d, {}, 'foe') < dmg(c, {}, 'foe'), 'Конструкция: Прочность cuts the damage a shielded ally takes');
    c.allies[0].shield = d.allies[0].shield = 0;
    eq(dmg(d, {}, 'foe'), dmg(c, {}, 'foe'), 'without a shield Прочность does nothing');
    const [n, s] = pair('p_safeload');
    n.allies[0].shield = s.allies[0].shield = 400;
    ok(sb.atkOf(s.allies[0]) > sb.atkOf(n.allies[0]), 'Безопасная нагрузка turns a shield into ATK');
  }
  {
    ok(ready(['r_independence'], { lvl: 2 }).enemies.every(e => e.frozen), 'Высший опыт: Самостоятельность freezes every enemy at the start');
    ok(ready(['d_reserve']).allies.every(a => a.hp === a.maxHp - Math.round(a.maxHp * 0.5) && a.shield >= Math.round(a.maxHp * 0.5)), 'Метрическое резервирование trades half the HP for a shield');
    const [g0, g] = pair('d_regrowth');
    ok(g.allies.every(a => a.flags.grit === 12) && sb.atkOf(g.allies[0]) > sb.atkOf(g0.allies[0]), 'Внезапный обратный рост gives 12 stacks of Grit that raise ATK');
    ok(ready([], { curios: ['c_parchment'] }).enemies.every(e => e.hp === e.maxHp - Math.round(e.maxHp * 0.2)), 'Вечно голодный пергамент cuts 20% HP of common enemies');
    eq(ready([], { curios: ['c_clock'] }).sp, H.TUNING.spStart - 2, 'Механические часы с кукушкой take two Skill Points');
  }
  {
    const [c1, s1] = pair('e_suspiria');
    ok(dmg(s1, { kind: 'follow' }) > dmg(c1, { kind: 'follow' }), 'Суспирия raises follow-up damage');
    eq(dmg(s1, { kind: 'basic' }), dmg(c1, { kind: 'basic' }), 'Суспирия leaves basic attacks alone');
    const [c2, n2] = pair('n_ignosticism');
    ok(dmg(n2, { fixed: 100, isDot: true, dot: true }) > dmg(c2, { fixed: 100, isDot: true, dot: true }), 'Игностицизм raises damage over time');
    eq(dmg(n2, { fixed: 100, isDot: true }), dmg(c2, { fixed: 100, isDot: true }), 'break and thaw damage is not damage over time');
    const [c3, h3] = pair('r_hatred');
    c3.enemies[0].frozen = h3.enemies[0].frozen = 1;
    ok(dmg(h3, { kind: 'skill' }) > dmg(c3, { kind: 'skill' }), 'Холодная ненависть raises Skill damage against frozen enemies');
    eq(dmg(h3, { kind: 'basic' }), dmg(c3, { kind: 'basic' }), 'Холодная ненависть leaves basic attacks alone');
    const [c4, v4] = pair('r_hardship');
    eq(dmg(v4, {}), dmg(c4, {}), 'Первородные трудности need a frozen enemy');
    c4.enemies[0].frozen = v4.enemies[0].frozen = 1;
    ok(dmg(v4, {}) > dmg(c4, {}), 'Первородные трудности make frozen enemies take more damage');
    const [c5, f5] = pair('e_fish');
    ok(dmg(f5, { kind: 'follow' }) > dmg(c5, { kind: 'follow' }) && dmg(f5, { kind: 'skill' }) === dmg(c5, { kind: 'skill' }), 'Рыба открывает огонь pierces defence with follow-ups only');
  }
  {
    const b = fight(['h_imperium'], { path: 'hunt' });
    b.start();
    const u = b.current;
    ok(u && u.flags.cb === 1 && u.buffs.some(x => x.name === 'Крит. усиление'), 'Императорское правление gives a stack of Critical Boost at the start of a turn');
    b.hitThisAction = new Set();
    b.hit(b.living[0], u, 0.05, {});
    ok(!u.flags.cb && !u.buffs.some(x => x.name === 'Крит. усиление'), 'Critical Boost burns when an enemy hits the team');
    const r = ready(['d_reflect'], { lvl: 2 }), a = r.allies[0], a2 = r.allies[1];
    a.hp = 0; r.onZero(a, r.enemies[0]);
    ok(!a.dead && a.hp === Math.round(a.maxHp * 0.2), 'Отражение keeps a character standing with 20% HP');
    a2.hp = 0; r.onZero(a2, r.enemies[0]);
    ok(a2.dead, 'Отражение works once per battle for the whole team');
    const w = ready(['n_why'], { path: 'nihility' }), e = w.enemies[0];
    w.addDot(w.allies[0], e, 'burn', 100, 2);
    w.drain(); w.startTurn(e);
    ok(w.drain().some(x => x.t === 'dmg' && x.label === 'Отзвук'), 'Почему всё ещё не исчезло? repeats the damage over time at the start of the enemy turn');
    const f = ready(['r_fuli'], { path: 'remembrance' }), fe = f.enemies[0];
    fe.base.res = 0; fe.frozen = 1;
    f.bless('act', { u: f.allies[0], kind: 'basic', hits: [fe] });
    ok(fe.flags.dissoc, 'Идеальный опыт: Фули brings Dissociation to a frozen enemy');
    f.drain();
    eq(f.startTurn(fe), 'skip', 'an enemy under Dissociation loses its turn');
    ok(!fe.flags.dissoc && f.drain().some(x => x.t === 'dmg' && x.label === 'Распад'), 'Dissociation ends with ice damage when the enemy thaws');
  }
  {
    for (const p of Object.keys(SU.PATHS)) {
      const b = fight(SU.BLESSINGS.filter(x => x.path === p).slice(0, 3).map(x => x.id), { path: p, seed: 11 });
      ok(b.su.res.on, 'three blessings of ' + p + ' unlock its Path Resonance');
      b.start();
      if (b.over) continue;
      ok(!b.resReady(), 'Path Resonance of ' + p + ' starts empty');
      b.su.res.energy = b.su.res.max;
      ok(b.resonate(), 'Path Resonance of ' + p + ' fires');
      ok(b.drain().some(e => e.t === 'act' && e.kind === 'res'), 'Path Resonance of ' + p + ' is announced');
      eq(b.su.res.energy, 0, 'Path Resonance of ' + p + ' spends its energy');
    }
    ok(!fight(SU.BLESSINGS.filter(b => b.path === 'hunt').slice(0, 2).map(b => b.id), { path: 'hunt' }).su.res.on, 'two blessings are not enough for the Resonance');
    const own = SU.BLESSINGS.filter(b => b.path === 'hunt').slice(0, 3).map(b => b.id);
    const gown = ready(own, { path: 'hunt', curios: ['c_gown'] });
    ok(gown.su.res.energy === gown.su.res.max && gown.su.res.dmg > 1, 'Мантия доктора fills the Resonance and raises its damage');
    const tick = fight(own, { path: 'hunt', seed: 4 });
    tick.start();
    tick.runAuto(3);
    ok(tick.su.res.energy > 0, 'the Resonance gauge fills as units act');
    const all = fight(SU.BLESSINGS.map(b => b.id), { path: 'elation', lvl: 2, seed: 17, curios: ['c_automaton', 'c_parchment'] });
    all.start();
    all.runAuto(600);
    ok(all.over && all.result.win, 'a battle with every blessing enhanced runs to a win');
  }

  const suDrive = (g, max = 4000) => {
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
      const p = g.pending;
      if (p) { if (p.type === 'choice') g.resume(0); else g.resume(); continue; }
      if (g.script) { g.advanceScript(); continue; }
      return null;
    }
    return { stuck: true };
  };
  const clearDomain = g => {
    const dom = g.state.su.dom;
    if (['combat', 'elite', 'boss'].includes(dom.type)) {
      for (const ch of ['2', '1']) {
        const e = g.map.ents.find(x => x.kind === 'enemy' && x.ch === ch && g.visible(x));
        if (!e) continue;
        g.encounter(e, 'player');
        const lost = suDrive(g);
        if (lost) return lost;
        if (!g.state.su) return null;
      }
    } else if (dom.type === 'respite') {
      for (const obj of g.map.ents.filter(x => (x.kind === 'su_heal' || x.kind === 'su_tp') && g.visible(x))) { adj(g, obj); g.interact(); }
      ok(g.map.ents.every(x => !(x.kind === 'su_heal' || x.kind === 'su_tp') || !g.visible(x)), 'respite capsules are used once');
      adj(g, g.map.ents.find(x => x.kind === 'npc' && x.def.who === 'herta'));
      ok(g.interact(), 'Herta\'s puppet in the respite zone talks');
      suDrive(g);
      for (const it of g.suShop()) if (!it.off && it.id !== 'enhance' && g.state.su.frag >= it.cost) { g.suShopBuy(it.id); suDrive(g); }
    } else {
      adj(g, g.map.ents.find(x => x.kind === 'su_frame'));
      ok(g.interact(), 'the event frame starts its event');
      const lost = suDrive(g);
      if (lost) return lost;
    }
    if (g.state.su) for (const d of g.map.ents.filter(x => x.kind === 'destr' && g.visible(x))) g.breakDestr(d);
    return null;
  };
  const playRun = g => {
    let guard = 0;
    while (g.state.su && guard++ < 20) {
      const type = g.state.su.dom.type, lost = clearDomain(g);
      if (lost) return lost;
      if (!g.state.su) break;
      ok(g.state.su.dom.cleared, 'a ' + type + ' domain opens its portals');
      const portal = g.map.ents.find(x => x.kind === 'portal' && g.visible(x));
      if (!portal) return { stuck: type };
      g.placePlayer(portal.x, portal.y);
      g.onStep();
      suDrive(g);
    }
    return null;
  };
  const mkState = lvl => {
    const st = H.newState();
    for (const f of ['intro', 'asta_met', 'hs_power', 'arlan_met', 'doom', 'express_intro', 'events_note']) st.flags[f] = true;
    for (const id of ['march', 'danheng', 'arlan']) st.roster[id] = { lvl, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
    st.roster.trail.lvl = lvl;
    st.party = ['trail', 'march', 'danheng', 'arlan'];
    return Object.assign(st, { map: 'hs_office', x: null, y: null });
  };
  const planar = g => g.state.inv.relics.filter(r => H.PLANAR_SETS.includes(r.set));
  {
    const g = new H.Game({ state: mkState(12), seed: 77 });
    ok(!g.suStart(1, 'preservation', g.state.party), 'the simulation stays closed before Herta allows the test');
    g.chatSync(); g.chatAuto('herta_test');
    eq(g.state.quests.su_beta, 'talk', 'Herta\'s message gives the quest');
    eq(g.questList()[0].name, 'Виртуальная вселенная: Первичный тест', 'the quest is listed with its official name');
    eq(g.questTarget().map, 'hs_office', 'the quest points at Herta\'s office');
    const herta = g.map.ents.find(e => e.kind === 'npc' && e.def.who === 'herta');
    ok(adj(g, herta) && g.interact(), 'Herta talks in her office');
    suDrive(g);
    ok(g.state.flags.su_open && g.state.quests.su_beta === 'enter', 'Herta opens the test and sends you to the machine');
    const j0 = g.state.jade, c0 = g.state.credits;
    ok(adj(g, g.map.ents.find(e => e.kind === 'prop' && e.def.obj === 'su_machine')) && g.interact(), 'the machine answers');
    suDrive(g);
    const su = g.state.su;
    ok(su && su.tut && su.world === 1 && su.path === 'preservation', 'the machine starts the tutorial run of World 1');
    eq(g.state.quests.su_beta, 'run', 'the quest moves on to the run');
    ok(g.map.def.su && g.state.su.dom.type === 'combat', 'the team stands in the first combat domain');
    eq(g.destinations().length, 0, 'no teleport out of the simulation');
    const g2 = new H.Game({ state: g.serialize(), seed: 1 });
    ok(g2.state.su && g2.map.id === g.map.id && g2.map.ents.filter(e => e.kind === 'enemy').length === g.map.ents.filter(e => e.kind === 'enemy').length, 'a save inside the simulation restores the domain and its enemies');
    const lost = playRun(g);
    ok(!lost, 'the tutorial run of World 1 is won by the auto battle ' + JSON.stringify(lost && (lost.stuck || lost.lines)));
    ok(!g.state.su && g.map.id === 'hs_office', 'after the run the team is back in Herta\'s office');
    ok(g.suPaths().includes('preservation') && g.suPaths().includes('remembrance'), 'Qlipoth and Fuli open Preservation and Remembrance');
    eq(g.state.quests.su_beta, 'done', 'Herta\'s report finishes the quest');
    ok(g.state.flags.su_beta_done && g.state.flags.su_clear_1, 'the test is done and World 1 is cleared');
    ok(g.state.roster.herta, 'Herta joins after the test');
    eq(g.state.jade - j0, 3 * 60 + 50, 'the first clear pays 3 × 60 jade and the report 50 more');
    eq(g.state.credits - c0, 3 * 2000 + 3000, 'the first clear pays 3 × 2000 credits and the report 3000 more');
    eq(planar(g).length, 4, 'the first clear gives two ornament sets: two spheres and two ropes');
    eq(planar(g).filter(r => r.slot === 'sphere').length, 2, 'two Planar Spheres');
    ok(g.state.inv.cones.some(c => c.id === 'databank'), 'the report gives the light cone «Банк данных»');
    log.push('su tutorial ' + planar(g).map(r => r.set + '/' + r.slot).join(' '));

    const p0 = g.state.power, j1 = g.state.jade, c1 = g.state.credits, r1 = planar(g).length;
    ok(!g.suStart(1, 'nihility', g.state.party), 'a closed Path cannot be chosen');
    ok(g.suStart(1, 'preservation', g.state.party), 'World 1 can be replayed after the quest');
    eq(playRun(g), null, 'the repeat run of World 1 is won');
    ok(g.suPaths().includes('elation'), 'Aha appears in the first free run of World 1 and opens Elation');
    eq(g.state.power, p0 - 40, 'a repeat clear costs 40 Trailblaze Power');
    eq(g.state.jade - j1, 60, 'a repeat clear pays 60 jade');
    eq(g.state.credits - c1, 2000, 'a repeat clear pays 2000 credits');
    eq(planar(g).length - r1, 2, 'a repeat clear gives one ornament set');

    g.state.power = 10;
    const j2 = g.state.jade;
    ok(g.suStart(1, 'remembrance', g.state.party), 'a run on the Path of Remembrance starts');
    eq(playRun(g), null, 'a third run of World 1 is won');
    eq(g.state.jade, j2, 'without 40 power the reward waits');
    eq(g.suClaims().length, 1, 'the reward waits at the terminal');
    ok(!g.suClaim(0), 'the reward cannot be taken without power');
    g.state.power = 60;
    ok(g.suClaim(0) && g.state.jade === j2 + 60 && g.state.power === 20 && !g.suClaims().length, 'the waiting reward is claimed for 40 power');

    ok(!g.suWorldOpen(SU.WORLDS[1]), 'World 2 needs the Gepard fight in the story');
    g.state.flags.first_gepard = true;
    ok(g.suWorldOpen(SU.WORLDS[1]) && !g.suWorldOpen(SU.WORLDS[2]), 'World 2 opens after World 1 and Gepard, World 3 stays closed');

    ok(g.suStart(1, 'preservation', g.state.party), 'a run to lose starts');
    for (const k of g.state.su.team) g.state.su.hp[k] = 1;
    g.state.su.dom.groups[1].lvl = 60;
    g.encounter(g.map.ents.find(x => x.kind === 'enemy' && x.ch === '1'), null);
    const out = suDrive(g);
    ok(out && out.lost && out.suFail, 'a lost battle in a free run fails the run');
    ok(!g.retryBattle(), 'a free run has no retry after a loss');
    g.giveUpBattle();
    suDrive(g);
    ok(!g.state.su && g.map.id === 'hs_office', 'a failed run returns the team to the office');
  }
  {
    const g = new H.Game({ state: mkState(30), seed: 91 });
    g.state.suPaths = Object.keys(SU.PATHS);
    g.state.flags.su_open = true;
    for (const [id, ev] of Object.entries(SU.EVENTS)) {
      for (let opt = 0; opt < 3; opt++) {
        ok(g.suStart(1, 'hunt', g.state.party), 'a run for event ' + id + ' starts');
        Object.assign(g.state.su, { frag: 400, d: 4 });
        g.state.su.dom = { type: ev.kind, layout: 'su_event', lvl: 12, groups: {}, done: {}, used: {}, cleared: false, next: ['combat'], event: id, final: false };
        g.loadMap('su_event', 's', { silent: true });
        adj(g, g.map.ents.find(x => x.kind === 'su_frame'));
        ok(g.interact(), 'the frame opens event ' + id);
        let n = 0, lost = false;
        while ((g.pending || g.script || g.battle) && n++ < 400) {
          if (g.battle) { g.battle.start(); g.battle.runAuto(1500); const out = g.endBattle(); if (out && out.lost) { lost = true; break; } g.afterBattle(); continue; }
          if (g.pending) { if (g.pending.type === 'choice') g.resume(Math.min(opt, g.pending.options.length - 1)); else g.resume(); continue; }
          g.advanceScript();
        }
        ok(!lost && g.state.su && g.state.su.dom.cleared, 'event ' + id + ' option ' + opt + ' finishes and opens the portals');
        g.suAbort();
        suDrive(g);
        ok(!g.state.su, 'abandoning the run after event ' + id + ' ends it');
      }
    }
  }
  {
    const TEAMS = { 2: [['trail', 'march', 'danheng', 'natasha'], 17], 3: [['trail', 'march', 'natasha', 'hook'], 27], 4: [['trail', 'march', 'natasha', 'serval'], 37] };
    for (const [wid, [team, lvl]] of Object.entries(TEAMS)) {
      let wins = 0;
      for (let seed = 1; seed <= 4; seed++) {
        const st = mkState(lvl);
        for (const f of ['su_open', 'su_beta_done', 'su_clear_1', 'su_clear_2', 'su_clear_3', 'first_gepard', 'first_svarog', 'ending']) st.flags[f] = true;
        for (const id of team) st.roster[id] = { lvl, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
        st.party = team.slice();
        st.suPaths = Object.keys(SU.PATHS);
        const g = new H.Game({ state: st, seed: seed * 31 + +wid });
        ok(g.suStart(+wid, Object.keys(SU.PATHS)[seed % 7], team), 'World ' + wid + ' starts for the balance run');
        if (!playRun(g)) wins++;
      }
      log.push('su world ' + wid + ' lvl ' + lvl + ' wins ' + wins + '/4');
      ok(wins >= 3, 'World ' + wid + ' is won by the auto battle with a team of level ' + lvl);
    }
  }
}

{
  const T = H.TRAIL_MISSIONS, Q = H.QUESTS;
  const storyFlags = new Set(['club']);
  for (const steps of Object.values(H.SCRIPTS)) for (const st of steps) if (st && st.flag) storyFlags.add(st.flag);
  eq(new Set(T.map(m => m.id)).size, T.length, 'Trailblaze mission ids are unique');
  for (const m of T) {
    ok(H.MISSION_CHAPTERS[m.ch] && H.MISSION_CHAPTERS[m.ch].type === 'trail', 'Trailblaze mission chapter ' + m.id);
    ok(m.done.split('|').every(f => storyFlags.has(f)), 'Trailblaze mission ' + m.id + ' ends on a story flag');
    ok(H.MAPS[m.area] && (H.SPEAKERS[m.face] || H.CHARS[m.face]), 'Trailblaze mission place and face ' + m.id);
    ok(m.desc.length >= 60 && m.desc.length <= 240 && !/[{}|]/.test(m.desc.replace(/\{[^{}|]*\|[^{}|]*\}/g, '')), 'Trailblaze mission description ' + m.id);
    ok(Object.keys(m.reward.items || {}).every(id => H.ITEMS[id]), 'Trailblaze mission reward items ' + m.id);
  }
  for (const [id, q] of Object.entries(Q)) {
    ok(H.MISSION_TYPES[q.type] && (!q.ch || H.MISSION_CHAPTERS[q.ch]), 'quest type and chapter ' + id);
    ok(q.reward && Object.keys(q.reward.items || {}).every(i => H.ITEMS[i]), 'quest reward ' + id);
    for (const [sid, st] of Object.entries(q.steps)) {
      const ats = st.ats ? st.ats.map(a => a[1]) : st.at ? [st.at] : [];
      for (const at of ats) {
        const [map, ch] = at.split(':');
        ok(H.MAPS[map] && (!ch || H.MAPS[map].rows.some(r => r.includes(ch))), 'quest step target ' + id + '.' + sid + ' ' + at);
      }
      ok(!st.count || st.count.every(f => storyFlags.has(f)), 'quest step counter flags ' + id + '.' + sid);
    }
    let given = null;
    for (const steps of Object.values(H.SCRIPTS)) steps.forEach((st, i) => { if (st && st.quest === id && st.step === 'done') { const g = steps.slice(Math.max(0, i - 3), i).find(x => x && x.give); if (g) given = g.give; } });
    if (id !== 'su_beta') ok(given && JSON.stringify(given) === JSON.stringify(q.reward), 'the reward shown for ' + id + ' is the reward given');
  }
  ok(JSON.stringify(Q.su_beta.reward) === JSON.stringify(H.SCRIPTS.su_beta_report.find(x => x && x.give).give), 'the reward shown for the Simulated Universe test is the reward given');

  const cg = new H.Game({ state: Object.assign(H.newState(), { quests: { q1: 'run', q2: 'done' } }), seed: 1 });
  ok(cg.cond('?q1') && cg.cond('?q1=run') && !cg.cond('?q1=talk') && !cg.cond('?q2') && cg.cond('?q2=done') && cg.cond('!?q3') && cg.cond('?q3|?q1&!?q2'), 'conditions read quest steps');

  const old = H.newState();
  delete old.missions;
  for (const f of ['intro', 'asta_met', 'arlan_met', 'doom', 'express_intro']) old.flags[f] = true;
  old.quests.su_beta = 'talk';
  const og = new H.Game({ state: old, seed: 2 });
  ok(og.state.missions.done.tb_chaos && og.state.missions.done.tb_shadows && !og.state.missions.done.tb_icy, 'an old save marks finished Trailblaze missions without paying for them');
  eq(og.trailCurrent().id, 'tb_icy', 'the next Trailblaze mission of an old save is the current one');
  ok(!og.missionAlert(), 'an old save does not flag its missions as new');
  const j0 = og.state.jade, c0 = og.state.credits;
  og.events.length = 0;
  og.runScript('jarilo_arrive'); drive(og);
  ok(og.state.missions.done.tb_icy && og.events.some(e => e.t === 'mission' && e.id === 'tb_icy'), 'a story flag finishes the Trailblaze mission and reports it');
  ok(og.state.credits - c0 >= T.find(m => m.id === 'tb_icy').reward.credits, 'a finished Trailblaze mission pays its reward');
  ok(og.state.missions.seen.main === 0 && og.missionAlert(), 'the next Trailblaze mission is new until it is seen');
  const ml = og.missionList();
  ok(ml[0].id === 'main' && ml[0].key === 'tb_travelers' && ml[0].text === og.state.obj && ml[0].place === 'Ярило-VI - Заснеженные окраины', 'the main mission shows the story objective and its place');
  ok(ml.some(m => m.id === 'su_beta' && m.type === 'trail' && m.place === 'Космическая станция «Герта» - Офис Герты'), 'the Simulated Universe test is a Trailblaze mission in Herta\'s office');
  eq(og.missionTracked().id, 'main', 'the main mission is tracked by default');
  og.trackMission('su_beta');
  eq(og.missionTracked().id, 'su_beta', 'another mission can be tracked');
  eq(og.questTarget().quest, 'su_beta', 'the map marks the tracked mission');
  og.trackMission(null);
  ok(og.missionTracked() === null, 'tracking can be switched off');
  og.trackMission('main');

  const hkDrive = (g, prefs = [], max = 4000) => {
    let n = 0;
    while (n++ < max) {
      if (g.battle) {
        const b = g.battle;
        if (!b.ev.length && b.phase === 'run' && !b.over) b.start();
        b.runAuto(800);
        const out = g.endBattle();
        ok(out && out.win, 'Hook chain battle won');
        g.afterBattle();
        continue;
      }
      const p = g.pending;
      if (p) {
        if (p.type === 'choice') {
          const i = p.options.findIndex(o => prefs.some(s => o[0].includes(s)));
          g.resume(i >= 0 ? i : 0);
        } else g.resume();
        continue;
      }
      if (g.script) { g.advanceScript(); continue; }
      return;
    }
  };
  const at = (g, map, ch, prefs) => {
    if (g.map.id !== map) g.loadMap(map, null, { x: 1, y: 1, silent: true });
    const e = g.map.ents.find(x => x.ch === ch && g.visible(x));
    ok(e, 'Hook chain: ' + ch + ' is shown on ' + map + ' at step ' + JSON.stringify(g.state.quests));
    if (!e) return false;
    if (e.kind === 'trigger') { g.placePlayer(e.x, e.y); g.lastExitTile = null; g.onStep(); }
    else { ok(adj(g, e), 'Hook chain: stand by ' + ch); ok(g.interact(), 'Hook chain: ' + ch + ' answers'); }
    hkDrive(g, prefs);
    return true;
  };
  const step = (g, id) => g.state.quests[id];
  const chats = g => { for (let i = 0; i < 5; i++) { g.chatSync(); for (const id of Object.keys(g.chats().th)) g.chatAuto(id); } };

  const st = H.newState();
  for (const m of T) for (const f of m.done.split('|')) st.flags[f] = true;
  for (const f of ['events_note', 'hatch_open', 'seele_trial', 'serval_joined']) st.flags[f] = true;
  for (const id of ['march', 'danheng', 'natasha', 'hook']) st.roster[id] = { lvl: 45, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
  st.roster.trail.lvl = 45;
  st.party = ['trail', 'natasha', 'hook', 'march'];
  Object.assign(st, { map: 'u_boulder', x: 8, y: 6, name: 'Стелла', gender: 'f' });
  st.quests.su_beta = 'done'; st.flags.su_beta_done = true; st.flags.su_open = true;
  const g = new H.Game({ state: st, seed: 41 });
  ok(!g.trailCurrent() && !g.missionList().length, 'after the Jarilo-VI story no Trailblaze mission is left');
  chats(g);
  eq(step(g, 'hook_foreman'), 'talk', 'Julian\'s group message starts «Сокровище старого бригадира»');
  ok(g.missionList().some(m => m.id === 'hook_foreman' && m.type === 'comp' && m.ch === 'furnace' && m.place === 'Ярило-VI - Городок Булыжник'), 'the Hook mission is a Companion mission in Boulder Town');
  eq(g.missionTracked().id, 'hook_foreman', 'with no Trailblaze mission the companion mission is tracked');
  ok(g.cond(H.MAPS.u_mine.marks.k.need), 'the way to the vagrant camp opens with the mission');
  at(g, 'u_boulder', 'j');
  eq(step(g, 'hook_foreman'), 'mine', 'Julian sends you to the Great Mine');
  at(g, 'u_camp', 'z');
  ok(step(g, 'hook_foreman') === 'clinic' && g.map.id === 'u_boulder', 'after the fight Fersman goes to the clinic');
  at(g, 'u_boulder', 'n');
  eq(step(g, 'hook_foreman'), 'hook', 'Natasha shows up for the mission even with Natasha in the team');
  at(g, 'u_boulder', 'y');
  eq(step(g, 'hook_foreman'), 'shelter', 'Hook asks for help at the clinic');
  at(g, 'u_camp', 'h');
  eq(step(g, 'hook_foreman'), 'ask', 'Swetta names four suspects');
  for (const ch of ['k', 'l', 'n']) at(g, 'u_camp', ch);
  eq(g.questStep('hook_foreman').text, 'Расспросить подозреваемых в лагере (3/4)', 'the step counts the questioned suspects');
  const before = g.serialize();
  at(g, 'u_camp', 'o', ['Подсобник']);
  eq(step(g, 'hook_foreman'), 'clues', 'a wrong guess sends you to look for clues');
  at(g, 'u_camp', 't');
  eq(step(g, 'hook_foreman'), 'crates', 'the tent gives a label');
  at(g, 'u_camp', 'g');
  eq(step(g, 'hook_foreman'), 'crates', 'a wrong crate keeps the search going');
  at(g, 'u_camp', 'j');
  eq(step(g, 'hook_foreman'), 'chase', 'the right crate points at the cook');
  const g2 = new H.Game({ state: before, seed: 41 });
  at(g2, 'u_camp', 'o', ['Повар.']);
  ok(step(g2, 'hook_foreman') === 'chase' && g2.state.flags.hf_right, 'naming the cook goes straight to the chase');
  at(g, 'u_camp', 's');
  ok(step(g, 'hook_foreman') === 'balaway' && g.state.inv.items.findie && g.state.inv.items.detector, 'Sampo gives Findie and the broken detector');
  at(g, 'u_boulder', 'b');
  eq(step(g, 'hook_foreman'), 'fersman', 'Balaway cannot fix the detector');
  const jf = g.state.jade;
  at(g, 'u_boulder', 'g');
  ok(step(g, 'hook_foreman') === 'done' && g.state.flags.hf_done && !g.state.inv.items.detector, 'Fersman takes the detector back and the mission ends');
  eq(g.state.jade - jf, Q.hook_foreman.reward.jade, 'the first mission pays its jade');
  at(g, 'u_boulder', 'j');
  ok(g.state.flags.hf_julian, 'Julian thanks you afterwards');

  chats(g);
  eq(step(g, 'hook_treasure'), 'talk', 'Hook\'s message starts «Сокровище малышки Хук»');
  at(g, 'u_boulder', 'h');
  eq(step(g, 'hook_treasure'), 'meet', 'Hook in the team still meets you at the Fight Club');
  at(g, 'u_rivet', 'h');
  at(g, 'u_rivet', 'm');
  ok(step(g, 'hook_treasure') === 'drill' && g.state.inv.items.marbles && g.state.inv.items.rusty_key, 'Julian\'s marbles and the key are found');
  at(g, 'u_rivet', 'j');
  eq(step(g, 'hook_treasure'), 'orphan', 'the drill is broken, so Hook remembers the orphanage');
  at(g, 'u_rivet', 'o');
  eq(step(g, 'hook_treasure'), 'findie', 'after the monsters Findie finds two stashes');
  g.trackMission('hook_treasure');
  eq(g.questTarget().mark, 'p', 'the first stash is marked');
  at(g, 'u_rivet', 'p');
  ok(g.questStep('hook_treasure').text.endsWith('(1/2)') && g.questTarget().mark === 'q', 'the time capsule counts and the next stash is marked');
  at(g, 'u_rivet', 'q');
  ok(step(g, 'hook_treasure') === 'clinic' && g.state.inv.items.junjun && g.state.inv.items.capsule, 'Junjun and the capsule are dug up');
  at(g, 'u_boulder', 'n');
  ok(step(g, 'hook_treasure') === 'find' && !g.state.inv.items.junjun, 'Natasha keeps Junjun for repair');
  at(g, 'u_boulder', 'y');
  ok(step(g, 'hook_treasure') === 'done' && g.state.flags.ht_done, 'Hook decides to sell Junjun');
  at(g, 'u_boulder', 'j');
  ok(g.state.flags.ht_julian && !g.state.inv.items.marbles && !g.state.inv.items.capsule && !g.state.inv.items.rusty_key, 'Julian gets his things back');

  chats(g);
  eq(step(g, 'hook_gift'), 'talk', 'the Wildfire advert starts «Подарок Хук»');
  at(g, 'u_boulder', 'r');
  ok(step(g, 'hook_gift') === 'tell' && g.state.inv.items.pamphlet, 'the auction staff gives a pamphlet');
  at(g, 'u_boulder', 'h');
  eq(step(g, 'hook_gift'), 'bear', 'Hook wants Junjun back from Natasha');
  at(g, 'u_boulder', 'n');
  ok(step(g, 'hook_gift') === 'auction' && g.state.inv.items.junjun && g.state.flags.hg_camp, 'Natasha returns Junjun');
  at(g, 'u_camp', 'p');
  ok(step(g, 'hook_gift') === 'buyers' && !g.state.inv.items.junjun, 'Junjun is registered for the auction');
  for (const ch of ['k', 'l', 'n']) at(g, 'u_camp', ch);
  eq(step(g, 'hook_gift'), 'bid', 'three buyers are enough to start bidding');
  const bid = g.serialize();
  const play = (gg, label) => {
    at(gg, 'u_camp', 'p');
    eq(step(gg, 'hook_gift'), 'staff2', label + ': the probe goes missing');
    at(gg, 'u_camp', 'r');
    at(gg, 'u_camp', 'q');
    eq(step(gg, 'hook_gift'), 'thief', label + ': the miner points at Boulder Town');
    at(gg, 'u_boulder', 'x');
    ok(step(gg, 'hook_gift') === 'return' && gg.state.inv.items.probe, label + ': Hook keeps the probe from the thief');
    at(gg, 'u_camp', 'r');
  };
  play(g, 'no extra buyers');
  ok(step(g, 'hook_gift') === 'advice' && !g.state.flags.hg_won, 'with three buyers the probe goes to another bidder');
  at(g, 'u_boulder', 'n');
  eq(step(g, 'hook_gift'), 'party', 'Natasha turns out to be the other bidder');
  const jg = g.state.jade;
  at(g, 'u_boulder', 'h');
  ok(step(g, 'hook_gift') === 'done' && g.state.flags.hg_done, 'the birthday party ends the chain');
  eq(g.state.jade - jg, Q.hook_gift.reward.jade, 'the last mission pays its jade');
  ok(!g.missionList().some(m => m.type === 'comp' && m.ch === 'furnace'), 'no Hook mission is left in the list');

  const gw = new H.Game({ state: bid, seed: 43 });
  at(gw, 'u_boulder', 'i');
  ok(gw.state.flags.hg_x_gertie, 'Gertie comes to the auction');
  at(gw, 'u_camp', 'u');
  ok(gw.state.flags.hg_lady1 && gw.map.ents.some(e => e.ch === 'b' && gw.visible(e)), 'the old lady lost her grandson, who is now in trouble');
  at(gw, 'u_camp', 'b');
  at(gw, 'u_camp', 'u');
  ok(gw.state.flags.hg_x_lady, 'the grandmother bids for Junjun');
  at(gw, 'u_camp', 'o');
  ok(gw.state.flags.hg_wallet_ask, 'the careless vagrant lost his contract');
  const bot = gw.map.ents.find(e => e.kind === 'enemy' && gw.visible(e));
  ok(bot, 'the robot with the contract roams the camp');
  gw.encounter(bot, null); hkDrive(gw);
  ok(gw.state.flags.k_hg_beetle, 'the robot is beaten');
  at(gw, 'u_camp', 'o');
  ok(gw.state.flags.hg_x_wallet, 'the contract goes back to its owner');
  play(gw, 'all extra buyers');
  ok(step(gw, 'hook_gift') === 'wrap' && gw.state.flags.hg_won && gw.state.flags.hg_p600, 'with every buyer Hook wins the probe');
  at(gw, 'u_boulder', 'n');
  at(gw, 'u_boulder', 'h');
  eq(step(gw, 'hook_gift'), 'done', 'the winning branch ends at the party too');
  log.push('hook chain ok, mission jade ' + T.reduce((a, m) => a + (m.reward.jade || 0), 0));

  const s6 = H.newState();
  for (const m of T) for (const f of m.done.split('|')) s6.flags[f] = true;
  s6.flags.events_note = true;
  for (const id of ['march', 'danheng', 'natasha', 'himeko']) s6.roster[id] = { lvl: 40, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
  s6.roster.trail.lvl = 40;
  s6.party = ['trail', 'march', 'natasha', 'himeko'];
  Object.assign(s6, { map: 'hs_office', x: 4, y: 12, name: 'Стелла', gender: 'f' });
  s6.quests.su_beta = 'done'; s6.flags.su_beta_done = true;
  const gs = new H.Game({ state: s6, seed: 61 });
  ok(!gs.map.ents.some(e => e.ch === 'r' && gs.visible(e)), 'no rift before the signal');
  chats(gs);
  eq(step(gs, 's6_signal'), 'talk', 'Herta message starts «Помехи на частоте»');
  ok(gs.missionList().some(m => m.id === 's6_signal' && m.type === 'comp' && m.ch === 's6'), 'the Section 6 mission is a Companion mission');
  at(gs, 'hs_office', 'v');
  eq(step(gs, 's6_signal'), 'rift', 'the TV leads to the Storage Zone');
  const tape0 = gs.state.inv.items.tape || 0;
  at(gs, 'hs_storage', 'r');
  ok(step(gs, 's6_signal') === 'report' && gs.state.flags.s6_met, 'Miyabi and Yanagi fight beside you and leave through the rift');
  at(gs, 'hs_office', 'v');
  ok(step(gs, 's6_signal') === 'done' && gs.state.inv.items.tape - tape0 === 5, 'Herta gives five Encrypted Master Tapes');
  ok(!gs.state.roster.miyabi && !gs.state.roster.yanagi, 'the mission does not grant the agents');
  chats(gs);
  eq(step(gs, 's6_hunter'), 'talk', 'Yanagi message starts «Охотница каверн»');
  at(gs, 'j_everwinter', 'r');
  eq(step(gs, 's6_hunter'), 'monument', 'the mimic went to Belobog');
  at(gs, 'j_belobog', 'q');
  eq(step(gs, 's6_hunter'), 'report', 'the mimic falls at the monument');
  at(gs, 'j_belobog', 'y');
  ok(step(gs, 's6_hunter') === 'done' && gs.state.flags.s6_done && gs.state.inv.items.tape - tape0 === 10, 'the report ends the Section 6 chain');
  chats(gs);
  ok(['s6_miyabi_train', 's6_yanagi_report'].every(id => gs.chatThread(id) && gs.chatThread(id).done), 'Miyabi and Yanagi keep writing after the chain');
  ok(!gs.missionList().some(m => m.ch === 's6'), 'no Section 6 mission is left in the list');
  eq(step(gs, 'rm_star'), 'talk', 'Herta message starts «Гори, гори, моя звезда гениальности»');
  ok(gs.missionList().some(m => m.id === 'rm_star' && m.type === 'trail' && m.ch === 'crown'), 'the Ruan Mei mission continues the Trailblaze');
  ok(!gs.map.ents.some(e => e.ch === 'j' && gs.visible(e)) || gs.map.id !== 'hs_supply', 'Ruan Mei is not on the platform before Herta sends you');
  at(gs, 'hs_office', 'h');
  eq(step(gs, 'rm_star'), 'find', 'Herta sends you to find Ruan Mei');
  at(gs, 'hs_supply', 'j');
  eq(step(gs, 'rm_star'), 'gather', 'Ruan Mei asks to catch her creations');
  at(gs, 'hs_storage', 'ъ');
  ok(gs.state.flags.rm_tart && step(gs, 'rm_star') === 'gather', 'the Molten Cheese Tart goes back to Ruan Mei');
  at(gs, 'hs_control', 'ъ');
  eq(step(gs, 'rm_star'), 'report', 'both creations are caught');
  at(gs, 'hs_supply', 'j');
  ok(step(gs, 'rm_star') === 'seclusion' && gs.state.flags.sec_open, 'Ruan Mei opens the Seclusion Zone');
  gs.loadMap('hs_storage2', null, { x: 1, y: 1, silent: true });
  gs.useExit(gs.map.ents.find(e => e.ch === 'g' && e.kind === 'exit'));
  hkDrive(gs, []);
  ok(gs.map.id === 'hs_seclusion3' && step(gs, 'rm_star') === 'bean', 'the Seclusion Zone opens from the second floor of the Storage Zone onto the Distribution Center');
  at(gs, 'hs_seclusion', 'б');
  eq(step(gs, 'rm_star'), 'notes', 'the crying creation calms down');
  gs.loadMap('hs_seclusion3', null, { x: 1, y: 12, silent: true });
  const lift = gs.map.ents.find(e => e.ch === 'i' && e.kind === 'exit');
  gs.useExit(lift);
  eq(gs.map.id, 'hs_seclusion3', 'the Incubator lift stays locked before the stranger');
  at(gs, 'hs_seclusion', 'н');
  eq(step(gs, 'rm_star'), 'stranger', 'the notes of Ruan Mei point at the Distribution Center');
  at(gs, 'hs_seclusion3', 'с');
  eq(step(gs, 'rm_star'), 'incubator', 'the stranger sends you down');
  gs.useExit(gs.map.ents.find(e => e.ch === 'i' && e.kind === 'exit'));
  eq(gs.map.id, 'hs_incubator', 'the lift goes down to the Incubator');
  at(gs, 'hs_incubator', 't');
  ok(gs.state.flags.rm_boss && step(gs, 'rm_star') === 'final', 'the synthetic Skaracabaz is gone');
  const jade0 = gs.state.jade;
  at(gs, 'hs_supply', 'j');
  ok(step(gs, 'rm_star') === 'done' && gs.state.flags.rm_done && gs.state.jade - jade0 === 60, 'Ruan Mei ends the mission and pays the reward');
  gs.loadMap('hs_seclusion', null, { x: 1, y: 1, silent: true });
  ok(['ц', 'ч'].every(ch => gs.map.ents.some(e => e.ch === ch && gs.visible(e))), 'the creations settle in the Seclusion Zone');
  {
    const b = new H.Battle({ party: [{ charId: 'march', lvl: 80, stats: { hp: 9999999, atk: 1, def: 999999, spd: 60 } }], enemies: ['skaracabaz:38'], lvl: 38, seed: 3 });
    b.start(); b.runAuto(400);
    ok(b.over && b.result.win, 'the synthetic Skaracabaz falls apart on its own when its lifespan ends');
  }
  const FH = H.FH;
  eq(FH.STAGES.length, 15, 'Forgotten Hall: fifteen stages of the Last Vestiges');
  for (const st of FH.STAGES) {
    ok(st.turb && st.turb.text && st.turb.fx.length && !/—/.test(st.turb.text), 'Forgotten Hall: turbulence of stage ' + st.n);
    ok(st.nodes.length === (st.kind === 'nodes' ? 2 : 1) && st.nodes.every(nd => nd.length === (st.kind === 'pair' ? 2 : 1)), 'Forgotten Hall: shape of stage ' + st.n);
    for (const nd of st.nodes) for (const b of nd) for (const w of b.waves) ok(w.length >= 1 && w.length <= 5 && w.every(id => H.ENEMIES[id]), 'Forgotten Hall: enemies of stage ' + st.n);
    ok(st.budget === (st.kind === 'nodes' ? 30 : 20) && st.goals[0] < st.goals[1] && st.goals[1] < st.budget, 'Forgotten Hall: cycles of stage ' + st.n);
    if (st.n > 1) ok(st.lvl >= FH.STAGES[st.n - 2].lvl && st.lvl <= 60, 'Forgotten Hall: enemy levels climb at stage ' + st.n);
    ok(FH.TUN.hp[st.n - 1] > 0, 'Forgotten Hall: HP factor of stage ' + st.n);
    ok(st.rec.length === st.nodes.length && st.rec.every(r => r.length && r.every(e => H.ELEMENTS[e])), 'Forgotten Hall: recommended damage types of stage ' + st.n);
  }
  ok(FH.SHOP.cones.rows.every(r => H.CONES[r.cone] && H.CONES[r.cone].rarity === 4 && H.CONES[r.cone].fx && H.CONES[r.cone].shop), 'Forgotten Hall: the cone shop sells the seven 4★ cones');
  ok(['lucent', 'feather', 'resin'].every(id => H.ITEMS[id] && H.ITEMS[id].kind === 'key'), 'Forgotten Hall: currencies and resin are valuables');

  const sf = H.newState();
  Object.assign(sf, { map: 'express', x: 18, y: 7, name: 'Келус', gender: 'm' });
  for (const f of ['intro', 'doom', 'express_intro', 'jarilo_arrive', 'events_note']) sf.flags[f] = true;
  for (const id of ['march', 'danheng', 'himeko', 'welt', 'natasha', 'serval', 'asta']) sf.roster[id] = { lvl: 30, exp: 0, eid: 0, cone: null, relics: {}, hp: null, energy: 0 };
  sf.roster.trail.lvl = 20;
  sf.party = ['trail', 'march', 'danheng', 'himeko'];
  const gf = new H.Game({ state: sf, seed: 71 });
  const mirror = () => gf.map.ents.find(e => e.ch === 'm' && gf.visible(e));
  chats(gf);
  ok(!gf.chatThread('fh_call') && !mirror(), 'the Messenger stays silent below Trailblaze Level 21');
  gf.state.roster.trail.lvl = 21;
  gf.chatSync();
  ok(gf.chatThread('fh_call') && H.CHAT.CONTACTS.messenger.mask === 'fh_met' && !gf.cond('fh_met'), 'at Trailblaze Level 21 an unknown contact writes');
  chats(gf);
  eq(step(gf, 'fh_lights'), 'talk', 'the message starts «Мимолётные огни»');
  ok(gf.missionList().some(m => m.id === 'fh_lights' && m.type === 'adv' && m.ch === 'adv_express'), 'Fleeting Lights is an Adventure mission on the Express');
  ok(mirror(), 'the mirror stands in the Parlor Car');
  ok(!gf.map.ents.some(e => e.ch === 'o' && gf.visible(e)), 'the Messenger is not by the mirror before the meeting');
  at(gf, 'express', 'm');
  eq(step(gf, 'fh_lights'), 'talk', 'the mirror sends you to Pom-Pom first');
  at(gf, 'express', 'p');
  eq(step(gf, 'fh_lights'), 'search', 'Pom-Pom asks to find the strange thing');
  at(gf, 'express', 'h'); at(gf, 'express', 'w');
  at(gf, 'express', 'm');
  eq(step(gf, 'fh_lights'), 'mirror', 'the first look notices the mirror');
  at(gf, 'express', 'h'); at(gf, 'express', 'w'); at(gf, 'express', 'p');
  eq(step(gf, 'fh_lights'), 'mirror', 'the crew does not see the mirror');
  at(gf, 'express', 'm');
  ok(step(gf, 'fh_lights') === 'hall' && gf.state.flags.fh_met && gf.fhOpen(), 'the Messenger steps out of the mirror and opens the Forgotten Hall');
  ok(gf.map.ents.some(e => e.ch === 'o' && e.def.who === 'messenger' && e.def.near && gf.visible(e)), 'after the meeting the Messenger stands left of the mirror');
  ok(!gf.fhBegin(2), 'stage 2 waits for stage 1');
  ok(gf.fhBegin(1) && gf.fhRun().n === 1, 'stage 1 starts');
  {
    const b = gf.fhFight();
    ok(b && b.opts.fh && b.opts.noContact && b.opts.party.every(p => p.energy === Math.round(H.CHARS[p.charId].energy * 0.5)), 'Forgotten Hall battles start at half energy without Contact');
    const ev0 = b.start();
    ok(ev0.some(e => e.t === 'cycle' && e.n === 1) && b.allies.every(a => a.buffs.some(x => x.s === 'windP' && x.v === 0.5)), 'stage 1 turbulence gives Wind DMG +50% from the first cycle');
    b.runAuto(3000);
    const out = gf.endBattle();
    ok(out.win && out.fh.next === 'clear' && out.fh.clear.first && out.fh.clear.left === 20 - out.fh.cyc, 'the stage counts the cycles it took');
    ok(gf.state.inv.items.lucent === 20 && gf.fhRec(1).clear && gf.fhUnlocked(2) && !gf.fhRun(), 'the first clear pays Lucent Afterglow and opens stage 2');
    eq(step(gf, 'fh_lights'), 'back', 'any cleared stage moves the mission on');
  }
  at(gf, 'express', 'm');
  eq(step(gf, 'fh_lights'), 'tell', 'the Messenger asks to keep the secret');
  const cr0 = gf.state.credits;
  at(gf, 'express', 'w', ['Не говорить']);
  ok(step(gf, 'fh_lights') === 'done' && gf.state.flags.fh_lie && !gf.state.flags.fh_truth && gf.state.credits - cr0 === 2000, 'covering for the Messenger ends the mission');
  ok(!gf.missionList().some(m => m.id === 'fh_lights'), 'the finished mission leaves the list');
  at(gf, 'express', 'm');
  ok(gf.state.flags.fh_post, 'the Messenger thanks you at the mirror after the mission');
  {
    const lose = new H.Battle({ party: gf.fhSpecs(['trail']), waves: [['reaver:1']], lvl: 1, foeHp: 400, seed: 3, noFlee: true, fh: { budget: 2, used: 0, turb: FH.TURB[0] } });
    lose.start(); lose.runAuto(3000);
    ok(lose.over && !lose.result.win && lose.fh.out && lose.fh.cyc === 3, 'a battle ends in defeat when the cycles run out');
    for (const tb of FH.TURB) {
      const b = new H.Battle({ party: gf.fhSpecs(['trail', 'march', 'danheng', 'himeko']), waves: [['reaver:20', 'reaver:20'], ['trampler:20']], lvl: 20, seed: 9, noFlee: true, fh: { budget: 30, used: 0, turb: tb } });
      b.start(); b.runAuto(3000);
      ok(b.over && b.fh.cyc >= 1, 'turbulence runs: ' + tb.text.slice(0, 40));
    }
    const crit = new H.Battle({ party: gf.fhSpecs(['trail']), waves: [['grizzly:40']], lvl: 40, seed: 4, noFlee: true, fh: { budget: 30, used: 0, turb: FH.TURB[9] } });
    crit.start();
    for (let i = 0; i < 40 && !crit.over; i++) crit.autoStep();
    const cb = crit.allies[0].buffs.filter(x => x.name === 'Турбулентность: крит');
    ok(cb.length === 1 && cb[0].v <= 0.4 && Math.abs(cb[0].v - Math.min(0.4, 0.08 * crit.fh.cyc)) < 1e-9, 'stage 10 turbulence stacks CRIT Rate up to 40%');
  }
  {
    for (const k of Object.keys(gf.state.roster)) gf.state.roster[k].lvl = 50;
    gf.fhSetTeam(11, 0, ['trail', 'march', 'danheng']);
    gf.fhSetTeam(11, 1, ['march', 'welt', 'natasha']);
    ok(!gf.fhTeam(11, 0).includes('march') && gf.fhTeam(11, 1).includes('march'), 'a character can only stand in one node team');
    gf.fhSetTeam(11, 0, ['trail', 'danheng', 'himeko', 'serval']);
    gf.fhSetTeam(11, 1, ['march', 'welt', 'natasha', 'asta']);
    for (let n = 1; n <= 10; n++) gf.fh().st[n] = { clear: true, stars: [true, true, n % 2 === 0], best: 12 };
    ok(gf.fhReady(11) && gf.fhBegin(11), 'stage 11 starts with two teams');
    let guard = 0, last = null, b = gf.fhFight();
    while (b && guard++ < 8) {
      ok(b.opts.party.every(p => gf.fhTeam(11, b.opts.fh.node).includes(p.key)), 'node ' + (b.opts.fh.node + 1) + ' fights with its own team');
      b.start(); b.runAuto(4000);
      last = gf.endBattle();
      if (!last.win) { gf.retryBattle(); b = gf.battle; continue; }
      b = gf.fhRun() ? gf.fhFight() : null;
    }
    ok(last && last.fh.next === 'clear' && gf.fhRec(11).clear, 'both nodes clear stage 11');
  }
  {
    const tiers = gf.fhTiers();
    ok(tiers.length === 15 && tiers.filter(t => t.ready).length === Math.floor(gf.fhTotal() / 3), 'one star reward per three stars');
    const j0 = gf.state.jade, f0 = gf.state.inv.items.feather || 0;
    ok(gf.fhAlert() && gf.fhClaim(1) && gf.state.jade - j0 === 200 && gf.state.inv.items.feather - f0 === 80, 'a star reward pays 200 Jade and 80 Jade Feathers');
    ok(gf.fhClaim(1) === null && gf.fhTiers()[0].got, 'a star reward is paid once');
    gf.fhClaimAll();
    ok(!gf.fhAlert(), 'Claim all takes every ready star reward');
  }
  {
    const s = gf.state;
    s.inv.items.lucent = 450;
    const sup0 = gf.fhConeOwned('fermata');
    ok(gf.fhBuy('cones', 0) && gf.fhConeOwned('fermata') === sup0 + 1 && s.inv.items.lucent === 250, 'a cone costs 200 Lucent Afterglow');
    ok(gf.fhBuy('cones', 0) && gf.fhConeOwned('fermata') === sup0 + 2, 'a second copy superimposes the cone');
    ok(!gf.fhBuy('cones', 1), 'no cone without enough Lucent Afterglow');
    s.inv.items.feather = 1400;
    ok(gf.fhBuy('jokes', 0) && s.inv.items.resin === 1 && !gf.fhBuy('jokes', 0), 'the resin is limited to one per refresh');
    ok(!gf.fhShop('jokes').some(r => r.row.credits === 1250), 'the cheap credit row hides until the limited credits are sold');
    ok(gf.fhBuy('jokes', 2, 20).length === 12 && gf.fhShop('jokes').some(r => r.row.credits === 1250 && r.left === Infinity), 'twelve credit packs, then unlimited small packs');
    const sh = gf.fh().shop;
    sh.per = -1;
    ok(gf.fhShop('jokes')[0].left === 1, 'the shop refreshes its stock');
    const rel = gf.fhCraft('musketeer', 'body', 'critD');
    ok(rel && rel.set === 'musketeer' && rel.slot === 'body' && rel.main === 'critD' && !rel.subs.some(([k]) => k === 'critD') && !s.inv.items.resin, 'the resin makes a relic with the chosen main stat');
    ok(gf.fhCraft('musketeer', 'body', 'critD') === null, 'no relic without resin');
    const l0 = s.inv.items.lucent;
    for (let i = 0; i < 4; i++) gf.fhEchoLucent();
    eq(s.inv.items.lucent - l0, 30, 'Echo of War pays Lucent Afterglow three times a week');
  }
  {
    const spec = (k, cone, hp) => Object.assign(gf.fhSpecs([k])[0], { cone: { id: cone, fx: cone, sup: 1 } }, hp ? { hp } : {});
    const wf = spec('march', 'wildfire'), half = Math.round(wf.stats.hp * 0.5);
    wf.hp = half;
    const bw = new H.Battle({ party: [wf, gf.fhSpecs(['trail'])[0]], waves: [['reaver:20']], lvl: 20, seed: 5 });
    bw.start();
    ok(bw.allies[0].hp > half && bw.allies.every(a => a.buffs.some(x => x.s === 'dr' && x.name === 'Мы — Дикий Огонь')), 'We Are Wildfire heals and shields the team at the start');
    const bk = new H.Battle({ party: [spec('himeko', 'breakfast')], waves: [['baryon:5', 'baryon:5', 'baryon:5', 'baryon:5']], lvl: 5, seed: 6 });
    bk.start(); bk.runAuto(2000);
    const st = bk.allies[0].buffs.find(x => x.name === 'Важность завтрака');
    ok(st && Math.abs(st.v - 0.04 * Math.min(3, bk.allies[0].flags.breakfast)) < 1e-9 && bk.allies[0].flags.breakfast <= 3, 'The Seriousness of Breakfast stacks ATK per kill up to three times');
    const rv = new H.Battle({ party: [spec('danheng', 'river')], waves: [['reaver:30', 'reaver:30']], lvl: 30, seed: 7 });
    rv.start();
    ok(rv.allies[0].buffs.some(x => x.name === 'Весенние потоки рек'), 'River Flows in Spring starts active');
    rv.memo('hurt', { u: rv.allies[0], dmg: 10 });
    ok(!rv.allies[0].buffs.some(x => x.name === 'Весенние потоки рек') && rv.allies[0].flags.river === 'off', 'a hit switches it off');
    rv.memo('endTurn', { u: rv.allies[0] });
    ok(rv.allies[0].buffs.some(x => x.name === 'Весенние потоки рек'), 'it returns after the wearer\'s turn');
    const fe = new H.Battle({ party: [spec('serval', 'fermata')], waves: [['reaver:30']], lvl: 30, seed: 8 });
    fe.start();
    const foe = fe.enemies[0], base = fe.memoDmg(fe.allies[0], foe, {});
    foe.dots.push({ type: 'shock', dmg: 10, turns: 2, src: fe.allies[0], stacks: 1 });
    ok(base === 0 && Math.abs(fe.memoDmg(fe.allies[0], foe, {}) - 0.16) < 1e-9, 'Fermata adds DMG against Shocked enemies');
  }
  log.push('forgotten hall ok, stars ' + gf.fhTotal() + ', jade ' + gf.state.jade);
}
{
  const mst = H.newState();
  for (const f of ['chaos', 'intro', 'lift', 'arlan_met', 'storm', 'asta_met', 'moment', 'hs_power', 'hs_bridge', 'doom', 'herta_met', 'express_intro']) mst.flags[f] = true;
  Object.assign(mst, { map: 'hs_control', x: null, y: null, hsv: 2 });
  const g = new H.Game({ state: mst, seed: 5 });
  const play = (picks = []) => { let n = 0; while (g.pending && n++ < 400) { if (g.pending.type === 'choice') g.resume(picks.length ? picks.shift() : 0); else g.resume(); } };
  const use = (ch, picks) => { const e = g.map.ents.find(x => x.ch === ch && g.visible(x)); ok(e, 'station object ' + ch + ' on ' + g.map.id); ok(adj(g, e) && g.interact(), 'use ' + ch); play(picks); return e; };
  const def = H.MAPS.hs_control;
  for (const mk of Object.values(def.marks)) if (mk.doc) ok(H.DOCS[mk.doc] && H.DOCS[mk.doc].title && H.DOCS[mk.doc].text.length > 40, 'document ' + mk.doc + ' has text');
  ok(Object.values(def.marks).filter(m => m.doc).length >= 15, 'the Master Control Zone holds the readables of the original');
  for (const map of ['hs_control', 'hs_office']) for (const mk of Object.values(H.MAPS[map].marks)) if (mk.script) ok(H.SCRIPTS[mk.script], 'station script ' + mk.script);
  const memo = g.map.ents.find(e => e.def && e.def.doc === 'memo1');
  adj(g, memo); g.interact();
  ok(g.pending && g.pending.ui === 'doc' && g.pending.doc === 'memo1' && g.state.flags.doc_memo1, 'reading a note opens the document window');
  g.resume();
  const lift = g.map.ents.find(e => e.kind === 'exit' && e.def.lift);
  ok(lift && lift.y === g.map.h - 3, 'one Space Elevator stands at the south tip');
  g.useExit(lift);
  eq(g.pending.options.map(o => o[0]).join(), 'Базовая зона,Зона хранения, второй этаж,Зона поддержки,Остаться здесь', 'the elevator lists every zone it serves');
  g.resume(3);
  eq(g.map.id, 'hs_control', 'staying keeps the team in place');
  const st2 = Object.assign(H.newState(), { map: 'hs_control', x: null, y: null, hsv: 2 });
  for (const f of ['chaos', 'intro', 'lift', 'arlan_met', 'storm']) st2.flags[f] = true;
  const g2 = new H.Game({ state: st2, seed: 6 });
  g2.useExit(g2.map.ents.find(e => e.kind === 'exit' && e.def.lift));
  ok(/закрыто/.test(g2.pending.options[2][0]), 'the Supply Zone is marked closed during the prologue');
  g2.resume(2);
  ok(g2.pending && g2.pending.type === 'say' && /Аста/.test(g2.pending.text), 'the closed route explains why');
  while (g2.pending) g2.resume();
  eq(g2.map.id, 'hs_control', 'a closed route does not move the team');
  eq(g.routeExit('hs_control', 'hs_supply'), 'Ω', 'quest routing follows the elevator');
  const dog = g.map.ents.find(e => e.def && e.def.who === 'peppy');
  const home = [dog.x, dog.y];
  for (let i = 0; i < 400; i++) g.updateWanderers(0.2);
  ok(Math.abs(dog.x - home[0]) <= 3 && Math.abs(dog.y - home[1]) <= 3, 'Peppy wanders near Asta');
  g.placePlayer(1, 1);
  Object.assign(dog, { x: home[0], y: home[1], fx: home[0], fy: home[1], prog: 1, t: 99 });
  use('п'); use('п', [0, 2, 0, 1, 0, 0, 3]);
  ok(g.state.flags.peppy_met, 'Peppy greets the team');
  use('ч', [0]);
  ok(g.state.flags.books_note && g.visible(g.map.ents.find(e => e.ch === 'Ь')), 'a note falls out of the book about the Aeons');
  use('Ь');
  ok(g.state.flags.note_got, 'the note is picked up');
  const cr = g.state.credits;
  use('n', [0]);
  ok(g.state.flags.mare_note && g.state.credits > cr, 'Mare thanks the team for her note');
  use('ц', [0, 0, 0]);
  ok(g.state.flags.crises_vote && g.records().some(r => r.id === 'crises'), 'a hundred votes bring the record Crises to the Express');
  use('Л'); use('Л'); use('Л'); use('Л');
  ok(g.state.flags.curls_gone && !g.visible(g.map.ents.find(e => e.ch === 'Л')), 'the Man With Luscious Hair leaves after four talks');
  use('g');
  ok(g.state.flags.puppet_mcz, 'the Herta puppet in the Master Control Zone counts');
  Object.assign(g.state.flags, { puppet_office: true, puppet_base: true, puppet_storage: true, puppet_storage2: true, puppet_supply: true });
  const jade = g.state.jade;
  g.runScript('puppets_check'); play();
  ok(g.state.flags.disposable && g.state.jade === jade + 60, 'all six puppets bring the reward from Herta');
  for (const id of Object.keys(H.CHARS)) ok(H.RATE[id], 'the Rating Pistol knows ' + id);
  g.state.party = ['trail', 'march', 'silverwolf', 'clara'];
  let lines = [];
  g.runScript('st_pistol');
  while (g.pending) { if (g.pending.type === 'choice') { ok(g.pending.options.length === 4 && g.pending.options[1][0] === 'Март 7', 'the pistol aims at a party member'); g.resume(3); } else { lines.push(g.pending.text); g.resume(); } }
  ok(lines.some(t => /«70 очков!»/.test(t)) && lines.some(t => /«26 очков!»/.test(t)), 'Clara and Svarog get 70 and 26 points');
  ok(g.state.flags.rp_used && g.state.flags.rated_clara, 'the pistol remembers its targets');
  lines = [];
  g.runScript('st_pistol');
  while (g.pending) { if (g.pending.type === 'choice') g.resume(1); else { lines.push(g.pending.text); g.resume(); } }
  ok(lines.some(t => /Оценка невозможна/.test(t)), 'March 7th cannot be rated');
  lines = [];
  g.runScript('st_pistol');
  while (g.pending) { if (g.pending.type === 'choice') g.resume(2); else { lines.push(g.pending.text); g.resume(); } }
  ok(lines.some(t => /110 очков/.test(t)), 'Silver Wolf hacks her score to 110');
  log.push('master control zone ok');
}
{
  const bst = H.newState();
  for (const f of ['chaos', 'intro', 'lift', 'arlan_met', 'storm', 'asta_met', 'moment', 'hs_power', 'hs_bridge', 'doom', 'herta_met', 'express_intro']) bst.flags[f] = true;
  Object.assign(bst, { map: 'hs_base', x: null, y: null, hsv: 2 });
  const g = new H.Game({ state: bst, seed: 9 });
  const play = (picks = []) => { let n = 0; while (g.pending && n++ < 400) { if (g.pending.type === 'choice') g.resume(picks.length ? picks.shift() : 0); else if (g.pending.type === 'ui') g.resume(); else g.resume(); } };
  const use = (ch, picks) => { const e = g.map.ents.find(x => x.ch === ch && g.visible(x)); ok(e, 'base object ' + ch); ok(adj(g, e) && g.interact(), 'use ' + ch); play(picks); return e; };
  const def = H.MAPS.hs_base;
  for (const mk of Object.values(def.marks)) { if (mk.doc) ok(H.DOCS[mk.doc] && H.DOCS[mk.doc].text.length > 100, 'base document ' + mk.doc); if (mk.script) ok(H.SCRIPTS[mk.script], 'base script ' + mk.script); }
  const lift = g.map.ents.find(e => e.kind === 'exit' && e.def.lift);
  ok(lift && lift.y === g.map.h - 2, 'the Base Zone elevator stands at the south end');
  ok(g.map.ents.filter(e => e.kind === 'exit').length === 1, 'the Base Zone has one way out, the Space Elevator');
  g.useExit(lift);
  eq(g.pending.options.length, 4, 'the elevator serves three zones');
  g.resume(3);
  ok(['ff_base1', 'ff_base2'].every(u => g.map.ents.some(e => e.kind === 'enemy' && e.def.unique === u && g.visible(e))), 'two Formidable Foes guard the Monitoring Room and the office of Asta');
  eq(g.map.ents.filter(e => e.kind === 'prop' && e.def.script === 'base_pod').length, 4, 'four exam pods stand in the Medical Cabin');
  use('п', [0]);
  ok(g.state.flags.med_exam, 'the pod runs the exam');
  const kits = g.state.inv.items.medkit || 0;
  use('д', [0, 0]);
  ok(g.state.flags.joanna && (g.state.inv.items.medkit || 0) === kits + 2, 'Joanne reads the report and hands out first aid');
  use('ё', [0, 0, 0]);
  ok(g.state.flags.plant_water && !g.state.flags.plant_thumb, 'the Strange Plant asks to come back tomorrow');
  use('ё');
  ok(!g.state.flags.plant_thumb, 'the same day brings no reward');
  g.state.days.plant = 'yesterday';
  use('ё');
  ok(g.state.flags.plant_thumb, 'the next day the plant thanks the team');
  use('ю', [0]);
  ok(g.state.flags.watson, 'Watson hands over her award');
  use('т', [0, 1, 2, 3]);
  use('э');
  use('г');
  ok(g.state.flags.puppet_base, 'the Herta puppet in the north-west room counts');
  use('р', [0]);
  ok(g.state.flags.robot_base1, 'a little robot can be switched off');
  Object.assign(g.state.flags, { robot_base2: true, robot_base3: true, robot_st1: true, robot_st2: true });
  g.state.flags.robot_sup = true;
  g.runScript('robots_check'); play();
  ok(g.state.flags.robots_all && H.CHAT.THREADS.some(t => t.id === 'eng_robots' && t.need === 'robots_all'), 'six sleeping robots bring a message from the engineer');
  log.push('base zone ok');
}
{
  const sst = H.newState();
  for (const f of ['chaos', 'intro', 'lift', 'arlan_met', 'storm', 'asta_met', 'moment', 'hs_power', 'hs_bridge', 'doom', 'herta_met', 'express_intro']) sst.flags[f] = true;
  Object.assign(sst, { map: 'hs_storage', x: null, y: null, hsv: 2 });
  const g = new H.Game({ state: sst, seed: 11 });
  const play = (picks = []) => { let n = 0; while (g.pending && n++ < 400) { if (g.pending.type === 'choice') g.resume(picks.length ? picks.shift() : 0); else g.resume(); } };
  const ent = ch => g.map.ents.find(x => x.ch === ch && g.visible(x));
  const use = (ch, picks) => { const e = ent(ch); ok(e, 'storage object ' + ch + ' on ' + g.map.id); ok(adj(g, e) && g.interact(), 'use ' + ch); play(picks); return e; };
  for (const map of ['hs_storage', 'hs_storage2']) for (const mk of Object.values(H.MAPS[map].marks)) { if (mk.doc) ok(H.DOCS[mk.doc] && H.DOCS[mk.doc].text.length > 300, 'storage document ' + mk.doc); if (mk.script) ok(H.SCRIPTS[mk.script], 'storage script ' + mk.script); }
  const row = (y, x0, x1) => g.map.ents.filter(e => e.kind === 'prop' && e.y === y && e.x >= x0 && e.x <= x1).sort((a, b) => a.x - b.x).map(e => e.def.script).join();
  eq(row(1, 50, 65), 'st_cards,st_crown,st_joy,st_hole', 'the left side of the north-east curio wing keeps the order of the original');
  eq(row(8, 50, 65), 'st_blade,st_wings,st_rod', 'the right side of the north-east curio wing keeps the order of the original');
  eq(row(21, 50, 64), 'st_pistol,st_joy,st_empty,st_conch', 'the Rating Pistol is the first exhibit on the left of the south-east wing');
  eq(row(29, 50, 64), 'st_eclipse,st_joy,st_unknown', 'the right side of the south-east curio wing keeps the order of the original');
  const art = H.MAPS.hs_storage.decor.filter(d => d[0] === 'curio');
  ok(art.length === 15 && art.every(d => H.Station ? true : d[3]), 'every exhibit stands in its own lit case');
  const gal = g.map.ents.find(e => e.kind === 'anchor' && /Галерея/.test(e.name)), ctl = g.map.ents.find(e => e.kind === 'anchor' && /центра управления/.test(e.name));
  ok(gal.x > 60 && ctl.x < 20, 'the Gallery of Shadow ends the south-east wing and the control center is in the west');
  const v = g.map.marks.v[0], y = g.map.marks.y[0];
  ok(v[0] > 60 && y[0] < 12, 'the Trailblazer wakes in the Gallery of Shadow and Arlan waits in the west');
  ok(g.map.ents.filter(e => e.kind === 'exit').length === 1, 'the first floor has only the stairs up');
  use('ч');
  ok(g.state.flags.began, 'the Stellaron room brings back the first memory');
  use('ф', [0, 0, 0]);
  ok(g.state.flags.shard_fixed, 'three knocks fix the Shattered Curio');
  g.state.party = ['trail', 'himeko', 'march', 'danheng'];
  const lines = [];
  g.placePlayer(1, 1);
  const bl = ent('ж'); adj(g, bl); g.interact();
  while (g.pending) { if (g.pending.type === 'say') lines.push(g.pending.text); g.resume(); }
  ok(lines.some(t => /В огне она переродилась/.test(t)), 'Himeko hears a voice in the Broken Blade');
  use('о', [1]);
  ok(g.state.flags.rp_used && g.state.flags.rated_himeko, 'the Rating Pistol rates the chosen team member');
  use('р', [0]);
  ok(g.state.flags.robot_st1, 'a little robot in the north-west wing sleeps');
  g.loadMap('hs_storage2', 'd', { silent: true });
  ok(g.map.ents.filter(e => e.kind === 'exit' && e.def.lift).length === 1, 'the Space Elevator of the Storage Zone stands on the second floor');
  use('Ж');
  ok(g.state.flags.king_voice, 'the strange voice says only «king»');
  g.loadMap('hs_storage', 'u', { silent: true });
  use('г', [0]);
  ok(g.state.flags.king_lang, 'the crown teaches the language of the Tottonids');
  g.loadMap('hs_storage2', 'd', { silent: true });
  const span = g.map.ents.find(e => e.kind === 'span' && e.def.group === 'ne');
  ok(g.blocked(span.x, span.y), 'the bridge to the transparent chamber is not there yet');
  for (const e of g.map.ents.filter(x => x.kind === 'marvel' && x.def.group === 'ne')) { g.placePlayer(e.x, e.y); g.onStep(); }
  ok(g.state.flags.mv_hs_storage2_ne && !g.blocked(span.x, span.y), 'lighting every Unearthly Marvel tile builds the bridge');
  const jade = g.state.jade;
  use('Ж');
  ok(g.state.flags.king_done && g.state.jade === jade + 20, 'the voice crowns the team emperor of the Tottonids');
  use('л', [0, 0, 1, 0]);
  ok(g.state.flags.honest, 'the honest answer pleases the old researcher');
  use('п');
  ok(g.state.flags.puppet_storage2, 'the Herta puppet on the second floor counts');
  log.push('storage zone ok');
}
{
  const ust = H.newState();
  for (const f of ['chaos', 'intro', 'lift', 'arlan_met', 'storm', 'asta_met', 'moment', 'hs_power', 'hs_bridge', 'doom', 'herta_met', 'express_intro']) ust.flags[f] = true;
  Object.assign(ust, { map: 'hs_supply', x: null, y: null, hsv: 2 });
  const g = new H.Game({ state: ust, seed: 13 });
  const play = (picks = []) => { let n = 0; while (g.pending && n++ < 400) { if (g.pending.type === 'choice') g.resume(picks.length ? picks.shift() : 0); else g.resume(); } };
  const ent = ch => g.map.ents.find(x => x.ch === ch && g.visible(x));
  const use = (ch, picks) => { const e = ent(ch); ok(e, 'supply object ' + ch); ok(adj(g, e) && g.interact(), 'use ' + ch); play(picks); return e; };
  for (const mk of Object.values(H.MAPS.hs_supply.marks)) { if (mk.doc) ok(H.DOCS[mk.doc] && H.DOCS[mk.doc].text.length > 300, 'supply document ' + mk.doc); if (mk.script) ok(H.SCRIPTS[mk.script], 'supply script ' + mk.script); }
  ok(g.map.ents.filter(e => e.kind === 'exit' && e.def.lift).length === 1, 'the Supply Zone has one Space Elevator');
  const orange = g.map.ents.find(e => e.kind === 'rbridge' && e.def.color === 'orange'), blue = g.map.ents.find(e => e.kind === 'rbridge' && e.def.color === 'blue');
  ok(!g.blocked(orange.x, orange.y) && g.blocked(blue.x, blue.y), 'the orange bridge to the platform is on after the prologue');
  use('В', [0]);
  ok(g.blocked(orange.x, orange.y) && !g.blocked(blue.x, blue.y), 'the console switches to the blue bridge, only one colour burns at a time');
  use('Г', [0]);
  ok(!g.blocked(orange.x, orange.y), 'the island console switches back');
  use('У', [1, 0, 0, 0, 0, 0, 0]);
  ok(g.state.flags.device_q && !g.state.flags.device_done, 'the security questions are answered, the password is still missing');
  use('ж');
  ok(!g.state.flags.crane_found, 'the cranes inside the room hold love letters');
  use('й');
  ok(g.state.flags.crane_found, 'the crane outside the room holds the password');
  use('У', [1, 1, 0]);
  ok(g.state.flags.device_done, 'the password 1233211234567 unlocks the device');
  use('Т', [0]);
  ok(g.state.flags.toilet_met && g.map.id === 'hs_supply', 'the Door to A New World flushes the team to the platform');
  ok(g.map.marks['γ'] && g.player.x === g.map.marks['γ'][0][0], 'the team lands in the rest corner of the scared researcher');
  use('w');
  ok(g.state.flags.tianweng && ent('Д'), 'Wen Tianweng shows his Kapo-Kali recipe');
  ok(ent('y'), 'Arlan guards the Security Department');
  for (const e of g.map.ents.filter(x => x.kind === 'marvel')) { g.placePlayer(e.x, e.y); g.onStep(); }
  ok(g.state.flags.mv_hs_supply_mt, 'the Unearthly Marvel in the maintenance room lights up');
  use('m'); g.loadMap('hs_supply', 'Ω', { silent: true }); use('m');
  ok(g.state.flags.meeting_v1, 'the meeting room settles on Plan No. 1');
  use('п');
  ok(g.state.flags.puppet_supply, 'the Herta puppet on the platform counts');
  log.push('supply zone ok');
}
{
  const cst = H.newState();
  for (const f of ['chaos', 'intro', 'lift', 'arlan_met', 'storm', 'asta_met', 'moment', 'hs_power', 'hs_bridge', 'doom', 'herta_met', 'express_intro', 'sec_open', 'rm_stranger', 'rm_done', 'sec_in']) cst.flags[f] = true;
  Object.assign(cst, { map: 'hs_seclusion3', x: null, y: null, hsv: 2 });
  const g = new H.Game({ state: cst, seed: 17 });
  const play = (picks = []) => { let n = 0; while (g.pending && n++ < 400) { if (g.pending.type === 'choice') g.resume(picks.length ? picks.shift() : 0); else g.resume(); } };
  const ent = ch => g.map.ents.find(x => x.ch === ch && g.visible(x));
  const use = (ch, picks) => { const e = ent(ch); ok(e, 'seclusion object ' + ch + ' on ' + g.map.id); ok(adj(g, e) && g.interact(), 'use ' + ch); play(picks); return e; };
  for (const map of ['hs_seclusion3', 'hs_seclusion', 'hs_incubator']) for (const mk of Object.values(H.MAPS[map].marks)) { if (mk.doc) ok(H.DOCS[mk.doc] && H.DOCS[mk.doc].text.length > 300, 'seclusion document ' + mk.doc); if (mk.script) ok(H.SCRIPTS[mk.script], 'seclusion script ' + mk.script); }
  eq(['hs_seclusion3', 'hs_seclusion', 'hs_incubator'].map(m => H.MAPS[m].anchors.join('/')).join(' | '), 'Распределительный центр | Питательная среда/Фармацевтический кабинет | Инкубатор', 'the four anchors of the Seclusion Zone sit on its three floors');
  eq(g.map.ents.find(e => e.ch === 'x' && e.kind === 'exit').def.to, 'hs_storage2', 'the bridge of the Distribution Center leads back to the Storage Zone');
  use('п', [0]);
  ok(g.state.recaps.includes('Вне зоны обслуживания'), 'the terminal calls Ruan Mei');
  g.useExit(g.map.ents.find(e => e.ch === 'd' && e.kind === 'exit'));
  eq(g.map.id, 'hs_seclusion', 'the stairs lead down to the ring floor');
  use('Э', [0, 0]);
  ok(g.state.flags.pod_done, 'the experimental pod traps the team until Herta pulls it out');
  use('Ж', [0, 0]);
  ok(g.state.flags.field1 && !g.state.flags.field2, 'the field has to wait until tomorrow');
  g.state.days.field = 'yesterday'; use('Ж');
  g.state.days.field = 'yesterday'; use('Ж');
  ok(g.state.flags.field_done, 'three days of weeding bring a gift of nature');
  g.state.party = ['herta', 'march', 'danheng', 'himeko'];
  use('t');
  g.state.party = ['welt', 'march', 'danheng', 'himeko'];
  use('t');
  ok(g.state.flags.peaks, 'the large display is seen by a short and a tall team leader');
  use('щ');
  ok(g.state.flags.sec_ad, 'the manuscript ad makes the team write to Herta');
  g.loadMap('hs_incubator', 'x', { silent: true });
  use('Ш', [0, 1]);
  ok(g.state.flags.throne && !ent('ц'), 'the Insighter climbs his throne of boxes');
  log.push('seclusion zone ok');
}
console.log(log.join('\n'));
console.log('hsr98: ' + checks + ' checks passed in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
