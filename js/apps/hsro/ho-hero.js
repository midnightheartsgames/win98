(function (HO) {
  'use strict';

  HO.SHEET_V = 1;
  HO.MAX_HEROES = 6;
  HO.SEXES = { f: 'Женский', m: 'Мужской' };
  HO.LOOK = {
    faces: 6,
    hairs: 8,
    hairColors: ['#5c3a46', '#2a2026', '#8a5a36', '#d8b070', '#c85a3a', '#e8e4f0', '#6a5ad0', '#3a8a8a'],
    skins: ['#f0d6c0', '#e2bc9c', '#c08c66', '#8a5e44'],
    ears: 3,
    tails: 3
  };
  HO.RANKS = { d_mighty: [8], d_rend: [10], a_heal: [6], a_smite: [8], a_sprout: [10], e_fire: [8], e_ice: [10] };
  HO.RANK_STEP = 0.35;
  HO.rankMul = rank => 1 + (Math.max(1, rank) - 1) * HO.RANK_STEP;
  HO.trainCost = lvl => 8 * lvl * lvl;
  HO.killCredits = (lvl, elite) => Math.round(3 + 0.6 * lvl) * (elite ? 3 : 1);
  HO.xpNeed = lvl => (lvl >= HO.MAX_LEVEL ? 0 : HO.XP_TO_NEXT[lvl - 1]);
  HO.greyLevel = lvl => (lvl <= 5 ? 0 : Math.min(lvl - 5, 4));

  HO.killXp = function (heroLvl, foeLvl, elite) {
    if (heroLvl >= HO.MAX_LEVEL || foeLvl <= HO.greyLevel(heroLvl)) return 0;
    const base = 45 + 5 * heroLvl, diff = foeLvl - heroLvl;
    let xp = base;
    if (diff > 0) xp = base * (1 + 0.05 * Math.min(diff, 4));
    else if (diff < 0) xp = base * Math.max(0, 1 + diff / (heroLvl <= 7 ? 5 : heroLvl <= 9 ? 6 : 7));
    return Math.round(xp * (elite ? 2 : 1));
  };

  HO.pathAbilities = path => HO.ABILITY_IDS.filter(id => HO.ABILITIES[id].path === path);

  HO.maxRank = id => 1 + (HO.RANKS[id] ? HO.RANKS[id].length : 0);

  HO.rankLevel = (id, rank) => (rank <= 1 ? HO.ABILITIES[id].lvl : HO.RANKS[id][rank - 2]);

  HO.startLearned = function (path, upTo) {
    const out = {};
    for (const id of HO.pathAbilities(path)) {
      const ab = HO.ABILITIES[id];
      if (ab.ult) continue;
      if (ab.lvl <= (upTo || 1)) {
        let rank = 1;
        while (rank < HO.maxRank(id) && HO.rankLevel(id, rank + 1) <= (upTo || 1)) rank++;
        out[id] = rank;
      }
    }
    if (upTo >= 10) for (const id of HO.pathAbilities(path)) if (HO.ABILITIES[id].ult) out[id] = 1;
    return out;
  };

  HO.nameError = function (raw, taken) {
    const name = String(raw || '').trim();
    if (name.length < 2) return 'Имя слишком короткое';
    if (name.length > 12) return 'Имя длиннее 12 букв';
    if (!/^[А-ЯЁа-яё]+$/.test(name) && !/^[A-Za-z]+$/.test(name)) return 'Только буквы одного алфавита';
    if ((taken || []).some(n => n.toLowerCase() === name.toLowerCase())) return 'Такое имя уже есть';
    return null;
  };

  HO.niceName = raw => {
    const n = String(raw || '').trim().toLowerCase();
    return n.charAt(0).toUpperCase() + n.slice(1);
  };

  HO.randomLook = function (rng, race) {
    const L = HO.LOOK, pick = n => Math.floor(rng() * n);
    const look = { face: pick(L.faces), hair: pick(L.hairs), hairColor: pick(L.hairColors.length), skin: pick(L.skins.length) };
    if (race === 'foxian') { look.ears = pick(L.ears); look.tail = pick(L.tails); }
    return look;
  };

  HO.newSheet = function (o) {
    const race = HO.RACES[o.race] ? o.race : 'human', path = HO.PATHS[o.path] ? o.path : 'destruction', lvl = HO.clamp(o.level | 0 || 1, 1, HO.MAX_LEVEL);
    const look = Object.assign({ face: 0, hair: 0, hairColor: 0, skin: 0 }, o.look || {});
    if (race === 'foxian') { look.ears = look.ears | 0; look.tail = look.tail | 0; } else { delete look.ears; delete look.tail; }
    const sheet = {
      v: HO.SHEET_V, id: String(o.id || 'h1'), name: String(o.name || 'Доброволец'), race, sex: o.sex === 'm' ? 'm' : 'f', path, look,
      lvl, xp: 0, credits: o.credits | 0, learned: HO.startLearned(path, o.learnAll ? lvl : 1), rested: 0, kills: 0, created: o.created || 0
    };
    return HO.normSheet ? HO.normSheet(sheet) : sheet;
  };

  HO.trainList = function (sheet) {
    const out = [];
    for (const id of HO.pathAbilities(sheet.path)) {
      const ab = HO.ABILITIES[id];
      if (ab.ult || ab.auto) continue;
      const have = sheet.learned[id] || 0;
      if (have >= HO.maxRank(id)) { out.push({ id, rank: have, owned: true, lvl: HO.rankLevel(id, have), cost: 0 }); continue; }
      const next = have + 1, lvl = HO.rankLevel(id, next);
      out.push({ id, rank: next, owned: false, lvl, cost: HO.trainCost(lvl), ready: lvl <= sheet.lvl });
    }
    return out.sort((a, b) => a.lvl - b.lvl || HO.ABILITY_IDS.indexOf(a.id) - HO.ABILITY_IDS.indexOf(b.id));
  };

  HO.Store = function (storage) {
    const LIST = 'hsro.chars', ONE = 'hsro.char.', LAST = 'hsro.last';
    const get = k => { try { return JSON.parse(storage.getItem(k)); } catch (err) { return null; } };
    const put = (k, v) => { try { storage.setItem(k, JSON.stringify(v)); return true; } catch (err) { return false; } };
    const store = {
      list() {
        const l = get(LIST);
        return Array.isArray(l) ? l.filter(x => x && typeof x.id === 'string') : [];
      },
      load(id) {
        const s = get(ONE + id);
        return s && s.v === HO.SHEET_V && HO.PATHS[s.path] && HO.RACES[s.race] ? s : null;
      },
      save(sheet) {
        const row = { id: sheet.id, name: sheet.name, race: sheet.race, sex: sheet.sex, path: sheet.path, lvl: sheet.lvl };
        const l = store.list().filter(x => x.id !== sheet.id);
        const i = store.list().findIndex(x => x.id === sheet.id);
        l.splice(i < 0 ? l.length : i, 0, row);
        return put(ONE + sheet.id, sheet) && put(LIST, l);
      },
      remove(id) {
        try { storage.removeItem(ONE + id); } catch (err) { return false; }
        put(LIST, store.list().filter(x => x.id !== id));
        if (store.last() === id) put(LAST, null);
        return true;
      },
      last() { return get(LAST); },
      setLast(id) { put(LAST, id); },
      nextId() {
        const used = new Set(store.list().map(x => x.id));
        let n = 1;
        while (used.has('h' + n)) n++;
        return 'h' + n;
      }
    };
    return store;
  };

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
