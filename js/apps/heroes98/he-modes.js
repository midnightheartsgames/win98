(function (H) {
  'use strict';
  const LEVEL = 20;
  const OPEN_WEEK = [1, 1, 1, 2, 2, 3, 5];
  const WEEKS = 8;
  const SCALED_TIERS = 5;
  const WAR_KIT = ['rageband', 'bellcuirass', 'khanaxe', 'pavise', 'strikering'];
  const MAGE_KIT = ['thoughtband', 'sagerobe', 'emberwand', 'saltstaff', 'manaring'];
  const DUEL_HEROES = [
    { hid: 'adelina', branch: 1, scale: 0.685 },
    { hid: 'kaspar', branch: 2, scale: 1.59 },
    { hid: 'timar', branch: 1, scale: 0.993 },
    { hid: 'saryg', branch: 2, scale: 1.411 },
    { hid: 'yarina', branch: 1, scale: 0.765 },
    { hid: 'vedana', branch: 2, scale: 1.404 },
    { hid: 'luar', branch: 1, scale: 0.814 },
    { hid: 'naera', branch: 2, scale: 1.53 },
    { hid: 'irga', branch: 1, scale: 0.5 },
    { hid: 'ilm', branch: 2, scale: 0.905 },
    { hid: 'valeria', branch: 1, scale: 0.733 },
    { hid: 'cassian', branch: 2, scale: 1.502 }
  ];

  const seedOf = id => [...id].reduce((t, ch) => (t * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const recordOf = d => H.HEROES.find(x => x.id === d.hid);
  const factionOf = d => H.CLASSES[recordOf(d).cls].faction;

  const armyOf = d => H.FACTIONS[factionOf(d)].units.map((row, i) => {
    const unit = row[d.branch] || row[0], weeks = WEEKS - OPEN_WEEK[i] + 1;
    return { unit, count: Math.max(1, Math.round(H.UNITS[unit].growth * weeks * (i < SCALED_TIERS ? d.scale : 1))), stars: 0, vet: 0 };
  });

  const heroOf = d => {
    const rec = recordOf(d), cls = H.CLASSES[rec.cls], S = { rs: seedOf(rec.id), ver: 0 };
    const h = H.Hero.init({ id: 0, owner: 0, hid: rec.id, name: rec.name, cls: rec.cls, faction: cls.faction, c: 0, r: 0, l: 0, army: [], xp: H.XP_TABLE[LEVEL], steps: 0, dir: 1, alive: true }, {});
    H.Hero.autoUp(S, h);
    const pool = Object.values(H.SPELLS).filter(sp => sp.school !== 'road' && H.Hero.canLearn(h, sp.id)), own = H.FACTIONS[cls.faction].schools, want = cls.mage ? 2 + LEVEL : Math.ceil(LEVEL / 3);
    for (let i = 0; i < 400 && h.spells.length < want && pool.length; i++) {
      const sp = pool[Math.floor(H.roll(S) * pool.length)];
      if (own.includes(sp.school) || H.roll(S) < 0.3) H.Hero.learn(h, sp.id);
    }
    for (const id of cls.mage ? MAGE_KIT : WAR_KIT) H.Hero.giveArt(h, id);
    h.mana = H.Hero.maxMana(h);
    h.army = armyOf(d);
    return h;
  };

  const sideOf = h => H.Hero.battleSide(h, h.army.map((s, i) => (s ? i : -1)).filter(i => i >= 0));

  const battle = (a, b, o) => {
    const left = heroOf(a), right = heroOf(b), moon = o.moon ? { id: o.moon, people: H.Moons.MOONS.find(m => m.id === o.moon).people } : null;
    left.owner = 0;
    right.owner = 1;
    right.id = 1;
    return {
      heroes: [left, right],
      name: 'Поединок: ' + left.name + ' и ' + right.name,
      seed: o.seed >>> 0,
      B: H.Battle.create({ seed: o.seed >>> 0, sides: [sideOf(left), sideOf(right)], moon, field: o.field || null })
    };
  };

  const RANKS = [
    [0, 'Ополченец'], [150, 'Дозорный'], [250, 'Десятник'], [350, 'Сотник'], [450, 'Знаменосец'], [560, 'Воевода'],
    [680, 'Полководец'], [820, 'Хранитель края'], [980, 'Владетель'], [1160, 'Правитель Венца'], [1380, 'Голос Семи лун'], [1650, 'Лунный царь']
  ];
  const KEY = 'heroes98_fame';
  const MAX = 10;
  let memory = [];

  const rankOf = score => RANKS.filter(r => score >= r[0]).pop()[1];
  const list = () => {
    try {
      const rows = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      return memory.slice();
    }
  };
  const save = rows => {
    memory = rows.slice();
    try {
      localStorage.setItem(KEY, JSON.stringify(rows));
    } catch (e) {
      return false;
    }
    return true;
  };
  const entryOf = (S, pid, when) => {
    const score = H.Adv.score(S);
    return { score, rank: rankOf(score), map: S.mapName, faction: S.players[pid].faction, color: S.players[pid].color, days: S.day, difficulty: S.difficulty, w: S.map.w, when: when || '' };
  };
  const add = row => {
    const rows = list().concat([row]).sort((a, b) => b.score - a.score || a.days - b.days).slice(0, MAX);
    save(rows);
    return rows.indexOf(row) + 1;
  };
  const clear = () => save([]);

  H.Duel = { LEVEL, HEROES: DUEL_HEROES, armyOf, heroOf, sideOf, battle, factionOf, recordOf };
  H.Fame = { RANKS, KEY, MAX, rankOf, list, add, clear, entryOf };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
