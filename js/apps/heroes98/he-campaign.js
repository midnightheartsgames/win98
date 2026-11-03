(function (H) {
  'use strict';
  const KEY = 'heroes98_campaigns';
  const MAX_ARTS = 3;
  const RING = [
    { id: 'nabat', name: 'Набат', faction: 'league', hero: 'adelina', land: 'Дельта Семи Рек', x: 400, y: 498 },
    { id: 'sol', name: 'Соль', faction: 'barrows', hero: 'aisulu', land: 'Степь Ак-Туз', x: 652, y: 318, after: 'nabat' },
    { id: 'zapoved', name: 'Заповедь', faction: 'thicket', hero: 'vedana', land: 'Заповедная Чаща', x: 196, y: 430, after: 'sol' },
    { id: 'chasha', name: 'Чаша', faction: 'tide', hero: 'naera', land: 'Море Чаша', x: 300, y: 330, after: 'zapoved' },
    { id: 'zhar', name: 'Жар', faction: 'forge', hero: 'irga', land: 'Пепельные Горнила', x: 590, y: 170, after: 'chasha' },
    { id: 'schozhdenie', name: 'Схождение', faction: 'stars', hero: 'feona', land: 'Высокогорье Меры', x: 400, y: 112, addon: true },
    { id: 'podlunye', name: 'Подлунье', faction: 'spore', hero: 'tikhon', land: 'Подлунье', x: 500, y: 330, addon: true },
    { id: 'tysyacha', name: 'Тысячелетие', faction: 'throne', hero: 'valeria', land: 'Белые руины', x: 400, y: 300, after: 'zhar' }
  ];
  const BY = {};

  let store = null;
  const read = () => {
    if (store) return store;
    try {
      store = JSON.parse(localStorage.getItem(KEY)) || {};
    } catch (e) {
      store = {};
    }
    return store;
  };
  const write = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch (e) {
      return false;
    }
    return true;
  };

  const add = camp => {
    BY[camp.id] = camp;
  };
  const get = id => BY[id] || null;
  const runOf = id => read()[id] || null;
  const finished = id => !!(runOf(id) && runOf(id).finished);
  const isOpen = id => {
    const r = RING.find(x => x.id === id);
    if (r.addon) return false;
    return !r.after || finished(r.after);
  };
  const stateOf = r => ({ ready: !!BY[r.id], open: isOpen(r.id), finished: finished(r.id), done: runOf(r.id) ? runOf(r.id).done.length : 0, total: BY[r.id] ? BY[r.id].missions.length : 5 });

  const begin = (id, difficulty) => {
    const earlier = Object.entries(read()).filter(([k, r]) => k !== id && r.finished).reduce((all, [, r]) => Object.assign(all, r.flags), {});
    read()[id] = { difficulty, done: [], hero: null, flags: earlier, finished: false };
    write();
    return store[id];
  };
  const currentMission = id => {
    const run = runOf(id), camp = BY[id];
    if (!run || !camp) return 0;
    const i = camp.missions.findIndex((m, k) => !run.done.includes(k));
    return i < 0 ? camp.missions.length - 1 : i;
  };

  const load = mission => {
    if (mission.doc) return Promise.resolve(mission.doc);
    return fetch('content/heroes98/maps/' + mission.id + '.h98m').then(r => (r.ok ? r.text() : Promise.reject(new Error('no map ' + mission.id)))).then(text => attach(mission, text));
  };
  const attach = (mission, text) => {
    const doc = H.MapFile.read(text);
    doc.scenes = mission.scenes;
    doc.events = [];
    mission.doc = doc;
    return doc;
  };

  const alliesOf = id => {
    const out = {};
    for (const r of RING) {
      const run = runOf(r.id);
      if (r.id !== id && !r.addon && run && run.finished && run.hero) out[r.hero] = run.hero;
    }
    return out;
  };

  const setup = (id, index, o) => {
    const camp = BY[id], m = camp.missions[index], run = runOf(id), doc = m.doc;
    const slots = doc.players.map((p, i) => ({ faction: p.factions[0], human: i === 0 }));
    const def = H.Maps.play(doc, { seed: o.seed, slots, difficulty: run.difficulty });
    def.setup.campaign = { id, mission: index, hero: camp.hero, flags: Object.assign({}, run.flags), carry: run.hero, bonus: o.bonus == null ? null : m.bonuses[o.bonus], cap: m.levelCap, allies: alliesOf(id) };
    return def;
  };

  const carryInto = (h, c) => {
    for (const k of ['level', 'atk', 'def', 'power', 'wis']) h[k] = c[k];
    h.xp = c.xp;
    h.skills = Object.assign({}, c.skills);
    h.perks = c.perks.slice();
    h.talents = c.talents.slice();
    for (const id of c.spells) if (!h.spells.includes(id)) h.spells.push(id);
    for (const id of c.arts) H.Hero.giveArt(h, id);
    h.mana = H.Hero.maxMana(h);
  };
  const giveBonus = (S, h, b) => {
    if (b.kind === 'art') H.Hero.giveArt(h, b.id);
    else if (b.kind === 'unit') {
      const slot = H.Hero.slotFor(h.army, b.unit);
      if (slot >= 0) H.Hero.addTo(h.army, slot, { unit: b.unit, count: b.count, stars: 0, vet: 0 });
    } else for (const [k, v] of Object.entries(b.res)) S.players[h.owner].res[k] += v;
  };
  const enter = (S, c) => {
    S.campaign = { id: c.id, mission: c.mission, hero: c.hero, flags: c.flags, allies: c.allies || {} };
    const h = S.heroes.find(x => x.hid === c.hero);
    if (!h) return;
    if (c.carry) carryInto(h, c.carry);
    h.levelCap = c.cap || 0;
    if (c.bonus) giveBonus(S, h, c.bonus);
    h.steps = H.Adv.daySteps(S, h);
    H.Adv.reveal(S, h.owner, h.l, h.c, h.r, H.Hero.sight(S, h));
  };

  const heroOf = S => S.heroes.find(x => x.hid === S.campaign.hero) || null;
  const artsOf = S => {
    const h = heroOf(S);
    if (!h) return [];
    return [...Object.values(h.arts).filter(Boolean), ...h.bag].filter(id => !H.ARTIFACTS[id].scroll);
  };
  const carryOf = (h, picks) => ({ level: h.level, xp: h.xp, atk: h.atk, def: h.def, power: h.power, wis: h.wis, skills: Object.assign({}, h.skills), perks: h.perks.slice(), talents: h.talents.slice(), spells: h.spells.slice(), arts: picks.slice(0, MAX_ARTS) });

  const finish = (S, picks) => {
    const c = S.campaign, run = runOf(c.id) || begin(c.id, S.difficulty), camp = BY[c.id], h = heroOf(S);
    if (!run.done.includes(c.mission)) run.done.push(c.mission);
    run.hero = h ? carryOf(h, picks) : run.hero;
    run.flags = Object.assign({}, c.flags);
    run.finished = camp.missions.every((m, i) => run.done.includes(i));
    write();
    return run.finished ? null : currentMission(c.id);
  };

  const bonusText = b => {
    if (b.kind === 'art') return H.ARTIFACTS[b.id].name;
    if (b.kind === 'unit') return H.UNITS[b.unit].name + ' ×' + b.count;
    const names = Object.fromEntries(H.RESOURCES);
    return Object.entries(b.res).map(([k, v]) => names[k] + ' +' + v).join(', ');
  };
  const reset = () => {
    store = {};
    write();
  };

  H.Campaign = { RING, MAX_ARTS, add, get, runOf, finished, isOpen, stateOf, begin, currentMission, load, attach, alliesOf, setup, carryInto, enter, heroOf, artsOf, carryOf, finish, bonusText, reset };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
