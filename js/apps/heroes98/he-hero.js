(function (H) {
  'use strict';
  const HR = H.HERO, MD = H.MapData;

  H.TALENTS = {};
  for (const [faction, f] of Object.entries(H.FACTIONS)) {
    for (const [level, rows] of Object.entries(f.gift.talents)) {
      for (const [id, name, about] of rows) H.TALENTS[id] = { id, name, about, level: +level, faction };
    }
    const hi = f.gift.high;
    H.TALENTS[hi.id] = { id: hi.id, name: hi.name, about: hi.about, level: HR.highLevel, faction, high: true };
  }

  const record = h => (h.hid ? H.HEROES.find(x => x.id === h.hid) || null : null);
  const spec = h => {
    const r = record(h);
    return r ? r.spec : null;
  };
  const rank = (h, id) => h.skills[id] || 0;
  const hasPerk = (h, id) => h.perks.includes(id);
  const hasTalent = (h, id) => h.talents.includes(id);

  const gear = h => {
    const out = {};
    for (const id of Object.values(h.arts)) {
      if (!id) continue;
      for (const [k, v] of Object.entries(H.ARTIFACTS[id].fx)) out[k] = (out[k] || 0) + v;
    }
    return out;
  };
  const stat = (h, k) => h[k] + (gear(h)[k] || 0);
  const maxMana = h => HR.manaPerWis * stat(h, 'wis') + (gear(h).mana || 0);

  const skillVal = (h, id) => {
    const r = rank(h, id);
    if (!r) return 0;
    const v = H.SKILLS[id].vals[r - 1], sp = spec(h);
    return sp && sp.kind === 'skill' && sp.skill === id ? v * (1 + HR.skillGrowth * h.level) : v;
  };
  const morale = h => (gear(h).morale || 0) + skillVal(h, 'leadership');
  const luck = h => (gear(h).luck || 0) + skillVal(h, 'luck');
  const sight = (S, h) => Math.max(1, H.MAP.heroSight + skillVal(h, 'scouting') + (gear(h).sight || 0) + H.Moons.sightPlus(S));
  const ground = (h, cost) => (cost > 1 && hasPerk(h, 'trails') ? 1 + (cost - 1) * HR.trailShare : cost);
  const overGround = (S, h, terrain) => {
    if (terrain === 'water' && (h.walkDay === S.day || h.flyDay === S.day)) return 1;
    return terrain === 'rock' && h.flyDay === S.day ? 1 : 0;
  };

  const steps = (S, h, n) => {
    let out = Math.round(n * (1 + skillVal(h, 'march'))) + (gear(h).steps || 0);
    if (hasPerk(h, 'earlystart') && (S.day - 1) % 7 === 0) out += HR.earlySteps;
    if (hasTalent(h, 'barrows-2') && HR.windTerrain.includes(MD.terrainAt(S.map, h.l, h.c, h.r).id)) out += HR.windSteps;
    return out;
  };

  const init = (h, o) => {
    const cls = H.CLASSES[h.cls], r = record(h);
    Object.assign(h, HR.stats[cls.mage ? 'mage' : 'warrior']);
    h.level = 1;
    h.skills = Object.assign({}, o.skills || (r ? r.skills : {}));
    h.perks = [];
    h.talents = [];
    h.arts = Object.fromEntries(H.ART_SLOTS.map(s => [s[0], null]));
    h.bag = [];
    h.up = null;
    h.mana = maxMana(h);
    h.spells = [...cls.spells];
    if (r && r.spec.kind === 'spell' && !h.spells.includes(r.spec.spell)) h.spells.push(r.spec.spell);
    h.walkDay = 0;
    h.flyDay = 0;
    return h;
  };

  const canLearn = (h, id) => {
    const sp = H.SPELLS[id];
    return sp.school !== 'road' && sp.circle <= 2 + rank(h, sp.school) + (hasPerk(h, 'bookworm') ? 1 : 0);
  };
  const learn = (h, id) => {
    if (h.spells.includes(id) || !canLearn(h, id)) return false;
    h.spells.push(id);
    return true;
  };
  const learnScrolls = h => {
    const out = [];
    for (let i = h.bag.length - 1; i >= 0; i--) {
      const a = H.ARTIFACTS[h.bag[i]];
      if (!a.scroll || h.spells.includes(a.scroll) || !canLearn(h, a.scroll)) continue;
      h.spells.push(a.scroll);
      h.bag.splice(i, 1);
      out.push(a.scroll);
    }
    return out;
  };
  const roadSpells = h => Object.values(H.SPELLS).filter(s => s.school === 'road' && h.level >= s.level).map(s => s.id);
  const gateOf = (S, h, t) => {
    const at = H.Town.spot(S, t);
    if (!at) return false;
    h.c = at[0];
    h.r = at[1];
    h.l = t.l;
    H.Adv.reveal(S, h.owner, h.l, h.c, h.r, sight(S, h));
    return true;
  };
  const castRoad = (S, h, id, arg) => {
    const sp = H.SPELLS[id];
    if (!sp || sp.school !== 'road' || h.level < sp.level) return { ok: false, why: 'Заклинание ещё не открыто' };
    if (h.mana < sp.mana) return { ok: false, why: 'Не хватает маны' };
    const towns = H.Town.list(S, h.owner);
    if (id === 'highview') H.Adv.reveal(S, h.owner, h.l, h.c, h.r, 10);
    else if (id === 'moontrack') S.players[h.owner].track = S.day;
    else if (id === 'tailwind') h.steps += 5;
    else if (id === 'callboat') return { ok: false, why: 'Своих лодок нет' };
    else if (id === 'waterwalk') h.walkDay = S.day;
    else if (id === 'flight') h.flyDay = S.day;
    else if (id === 'return') {
      const near = towns.filter(t => H.Town.visitor(S, t) !== h).sort((a, b) => Math.hypot(a.c - h.c, a.r - h.r) - Math.hypot(b.c - h.c, b.r - h.r))[0];
      if (!near || !gateOf(S, h, near)) return { ok: false, why: 'Нет своего города' };
      h.steps = 0;
    } else if (id === 'moongate') {
      const t = towns.find(x => x.id === arg);
      if (!t) return { ok: false, why: 'Выберите свой город' };
      if (h.steps + 1e-9 < H.Adv.daySteps(S, h)) return { ok: false, why: 'Герой сегодня уже ходил' };
      if (!gateOf(S, h, t)) return { ok: false, why: 'У ворот нет места' };
    }
    h.mana -= sp.mana;
    S.ver++;
    return { ok: true };
  };

  const levelFor = xp => {
    let L = 1;
    while (L < HR.maxLevel && xp >= H.XP_TABLE[L + 1]) L++;
    return L;
  };
  const addXp = (h, n) => {
    const gain = Math.round(n * (1 + skillVal(h, 'learning')));
    h.xp += gain;
    return gain;
  };
  const levelPending = h => !!h.up || levelFor(h.xp) > h.level;

  const rollStat = (S, h) => {
    const w = H.CLASSES[h.cls].stats, keys = Object.keys(w), sum = keys.reduce((t, k) => t + w[k], 0);
    let r = H.roll(S) * sum;
    for (const k of keys) {
      if (r < w[k]) return k;
      r -= w[k];
    }
    return keys[keys.length - 1];
  };

  const candidates = h => {
    const out = [];
    for (const [id, w] of Object.entries(H.CLASSES[h.cls].cards)) {
      const r = rank(h, id);
      if (r >= 3 || (!r && Object.keys(h.skills).length >= HR.maxSkills)) continue;
      out.push({ skill: id, rank: r + 1, w: r ? w * HR.ownSkillWeight : w });
    }
    return out;
  };
  const drawCards = (S, h) => {
    const pool = candidates(h), out = [];
    while (out.length < 2 && pool.length) {
      let r = H.roll(S) * pool.reduce((t, c) => t + c.w, 0), i = 0;
      while (i < pool.length - 1 && r >= pool[i].w) r -= pool[i++].w;
      const [c] = pool.splice(i, 1);
      out.push({ skill: c.skill, rank: c.rank });
    }
    return out;
  };

  const nextUp = (S, h) => {
    if (h.up) return h.up;
    if (levelFor(h.xp) <= h.level) return null;
    h.level++;
    const key = rollStat(S, h), cards = drawCards(S, h), rows = H.FACTIONS[h.faction].gift.talents[h.level];
    h[key]++;
    h.up = { level: h.level, stat: key, step: cards.length ? 'card' : rows ? 'talent' : 'done', cards, perks: null, talents: rows ? rows.map(t => t[0]) : null };
    S.ver++;
    return h.up;
  };
  const afterCard = h => {
    const up = h.up;
    if (up.talents) up.step = 'talent';
    else h.up = null;
  };
  const pickCard = (h, i) => {
    const up = h.up, c = up && up.step === 'card' ? up.cards[i] : null;
    if (!c) return false;
    h.skills[c.skill] = c.rank;
    if (c.rank === 3) {
      up.step = 'perk';
      up.perks = H.SKILLS[c.skill].perks.map(p => p[0]);
    } else afterCard(h);
    return true;
  };
  const pickPerk = (h, i) => {
    const up = h.up, id = up && up.step === 'perk' ? up.perks[i] : null;
    if (!id) return false;
    h.perks.push(id);
    afterCard(h);
    return true;
  };
  const pickTalent = (h, i) => {
    const up = h.up, id = up && up.step === 'talent' ? up.talents[i] : null;
    if (!id) return false;
    h.talents.push(id);
    h.up = null;
    return true;
  };
  const closeUp = h => {
    if (h.up && h.up.step === 'done') h.up = null;
  };
  const autoUp = (S, h) => {
    for (let up = nextUp(S, h); up; up = nextUp(S, h)) {
      if (up.step === 'card') pickCard(h, 0);
      if (h.up && h.up.step === 'perk') pickPerk(h, 0);
      if (h.up && h.up.step === 'talent') pickTalent(h, 0);
      closeUp(h);
    }
  };

  const highState = h => {
    const g = H.FACTIONS[h.faction].gift.high, missing = g.needs.filter(id => rank(h, id) < 3);
    return { id: g.id, name: g.name, about: g.about, order: g.order, open: h.level >= HR.highLevel && !missing.length, missing: missing.map(id => H.SKILLS[id].name) };
  };

  const battleHero = h => {
    const fx = gear(h), sp = spec(h), hi = highState(h), row = sp && sp.kind === 'unit' ? H.FACTIONS[h.faction].units.find(u => u[0] === sp.row) : null;
    return {
      id: h.id,
      name: h.name,
      learning: skillVal(h, 'learning'),
      power: stat(h, 'power'),
      mana: h.mana,
      spells: h.spells.slice(),
      ranks: Object.fromEntries(Object.keys(H.SCHOOLS).map(k => [k, rank(h, k)])),
      sorcery: skillVal(h, 'sorcery'),
      perks: h.perks.slice(),
      specSpell: sp && sp.kind === 'spell' ? { id: sp.spell, scale: 0.02 * h.level } : null,
      atk: stat(h, 'atk'),
      def: stat(h, 'def'),
      melee: skillVal(h, 'offense'),
      guard: skillVal(h, 'defense'),
      ranged: skillVal(h, 'archery'),
      tactics: skillVal(h, 'tactics'),
      enemyReady: (hasPerk(h, 'ambush') ? HR.ambushReady : 0) + (fx.enemyReady || 0),
      firstReady: hasPerk(h, 'firstcharge') ? HR.chargeReady : 0,
      stand: hasPerk(h, 'stand') ? HR.standBonus : 0,
      retal: hasPerk(h, 'answer') ? HR.answerBonus : 0,
      finish: hasPerk(h, 'finish') ? HR.finishBonus : 0,
      aim: hasPerk(h, 'aim'),
      shots: (hasPerk(h, 'quiver') ? HR.quiverShots : 0) + (fx.shots || 0),
      fortune: hasPerk(h, 'fortune'),
      banner: hasPerk(h, 'banner'),
      warcry: hasPerk(h, 'warcry'),
      init: fx.init || 0,
      formation: hasTalent(h, 'league-3') ? HR.closedRanks : 0,
      formationAdd: sp && sp.trait === 'formation' ? 0.01 * h.level : 0,
      lamentMax: sp && sp.trait === 'lament' ? 1 : 0,
      lamentReady: hasTalent(h, 'barrows-3') ? HR.lamentReady : 0,
      lastStrike: hasTalent(h, 'barrows-6') ? HR.lastStrike : 0,
      shieldWall: hasTalent(h, 'league-4') ? HR.wallShare : 0,
      gun: hasTalent(h, 'league-5') ? HR.gun : null,
      unit: row ? { units: row, n: Math.floor(h.level / sp.per) } : null,
      high: hi.open ? hi.order : null
    };
  };
  const battleSide = (h, slots) => ({
    morale: morale(h),
    luck: luck(h),
    hero: battleHero(h),
    stacks: slots.map(i => ({ unit: h.army[i].unit, count: h.army[i].count, stars: h.army[i].stars || 0, vet: h.army[i].vet || 0 }))
  });

  const afterFight = (old, s) => {
    const left = s.count - (s.borrowed || 0);
    if (left <= 0) return { stack: null, star: false };
    let vet = (old.vet || 0) + (s.dealt ? 1 : 0), stars = old.stars || 0, star = false;
    if (vet >= HR.starAfter && stars < HR.maxStars) {
      stars++;
      vet = 0;
      star = true;
    }
    return { stack: { unit: old.unit, count: left, stars, vet }, star };
  };

  const mergeStars = (x, y) => {
    const a = x.stars || 0, b = y.stars || 0, hi = a >= b ? x : y, lo = a >= b ? y : x;
    let stars = hi.stars || 0;
    if (stars > (lo.stars || 0) && lo.count > hi.count) stars--;
    return { stars, vet: hi.vet || 0 };
  };
  const addTo = (army, slot, add) => {
    const cur = army[slot];
    if (!cur) {
      army[slot] = { unit: add.unit, count: add.count, stars: add.stars || 0, vet: add.vet || 0 };
      return;
    }
    const m = mergeStars(cur, add);
    army[slot] = { unit: cur.unit, count: cur.count + add.count, stars: m.stars, vet: m.vet };
  };
  const slotFor = (army, unit) => {
    const same = army.findIndex(s => s && s.unit === unit);
    return same >= 0 ? same : army.findIndex(s => !s);
  };
  const moveStack = (A, i, B, j, o) => {
    const x = A[i], y = B[j], opt = o || {};
    if (!x || (A === B && i === j)) return false;
    const n = opt.n == null || opt.n >= x.count ? x.count : opt.n, whole = n === x.count;
    if (n < 1) return false;
    if (y && y.unit !== x.unit) {
      if (!whole) return false;
      A[i] = y;
      B[j] = x;
      return true;
    }
    if (opt.keep && A !== B && whole && A.filter(Boolean).length === 1) return false;
    addTo(B, j, { unit: x.unit, count: n, stars: x.stars, vet: x.vet });
    A[i] = whole ? null : Object.assign({}, x, { count: x.count - n });
    return true;
  };
  const disband = (h, i) => {
    if (!h.army[i] || h.army.filter(Boolean).length <= 1) return false;
    h.army[i] = null;
    return true;
  };
  const giveArmy = (A, B) => {
    const slots = A.map((s, i) => (s ? i : -1)).filter(i => i >= 0).sort((i, j) => H.UNITS[A[j].unit].tier - H.UNITS[A[i].unit].tier);
    let moved = false;
    for (const i of slots) {
      const x = A[i], last = A.filter(Boolean).length === 1, n = last ? x.count - 1 : x.count, to = slotFor(B, x.unit);
      if (n >= 1 && to >= 0 && moveStack(A, i, B, to, { n })) moved = true;
    }
    return moved;
  };

  const fits = (id, slot) => {
    const a = H.ARTIFACTS[id];
    if (a.slot === 'scroll') return false;
    return a.slot === slot || (a.slot === 'ring' && (slot === 'ring1' || slot === 'ring2'));
  };
  const giveArt = (h, id) => {
    const free = H.ART_SLOTS.map(s => s[0]).find(s => fits(id, s) && !h.arts[s]);
    if (free) {
      h.arts[free] = id;
      return true;
    }
    if (h.bag.length >= HR.maxBag) return false;
    h.bag.push(id);
    return true;
  };
  const artAt = (h, ref) => (ref.slot ? h.arts[ref.slot] : h.bag[ref.bag]) || null;
  const putArt = (h, ref, id) => {
    if (ref.slot) h.arts[ref.slot] = id;
    else h.bag[ref.bag] = id;
  };
  const takeArt = (h, ref) => {
    if (ref.slot) h.arts[ref.slot] = null;
    else h.bag.splice(ref.bag, 1);
  };
  const moveArt = (A, from, B, to) => {
    const item = artAt(A, from);
    if (!item || (to.slot && !fits(item, to.slot)) || (A === B && from.slot === to.slot && from.bag === to.bag)) return false;
    const other = artAt(B, to);
    if (other) {
      if (from.slot && !fits(other, from.slot)) return false;
      putArt(A, from, other);
      putArt(B, to, item);
      return true;
    }
    if (to.slot) {
      takeArt(A, from);
      B.arts[to.slot] = item;
      return true;
    }
    if (B.bag.length >= HR.maxBag) return false;
    takeArt(A, from);
    B.bag.push(item);
    return true;
  };
  const giveArts = (A, B) => {
    let moved = false;
    for (const [slot, id] of Object.entries(A.arts)) {
      if (id && giveArt(B, id)) {
        A.arts[slot] = null;
        moved = true;
      }
    }
    while (A.bag.length && giveArt(B, A.bag[0])) {
      A.bag.shift();
      moved = true;
    }
    return moved;
  };

  const income = (S, pid) => {
    const out = {}, add = (k, v) => { out[k] = (out[k] || 0) + v; };
    const mine = S.heroes.filter(h => h.alive && h.owner === pid);
    for (const h of mine) {
      const sp = spec(h), gold = skillVal(h, 'treasury');
      if (gold) add('gold', gold);
      if (sp && sp.kind === 'gold') add('gold', sp.gold);
      if (sp && sp.kind === 'res') add(sp.res, 1);
    }
    if (mine.some(h => hasTalent(h, 'league-2'))) {
      for (const t of H.Town.list(S, pid)) if (H.Town.has(t, 'market')) add('gold', Math.round(H.Town.goldOf(t) * HR.tollShare));
    }
    return out;
  };
  const growthPct = (S, pid, tier) => (tier <= HR.militiaTiers && S.heroes.some(h => h.alive && h.owner === pid && hasTalent(h, 'league-6')) ? HR.militiaGrowth : 0);
  const marketBonus = (S, pid) => (S.heroes.some(h => h.alive && h.owner === pid && hasPerk(h, 'trader')) ? 1 : 0);

  const RARE = ['salt', 'amber', 'sulfur', 'moonsilver'];
  const collect = (S, h, res) => {
    S.players[h.owner].res[res]++;
    S.ver++;
  };
  const landAshore = (S, h, ev) => {
    const g = H.Adv.grid(S, h.l), M = S.map;
    let best = null, bd = Infinity;
    for (let r = 0; r < M.h; r++) {
      for (let c = 0; c < M.w; c++) {
        const d = Math.hypot(c - h.c, r - h.r), i = MD.idx(M, c, r);
        if (d < bd && MD.groundCost(M, h.l, c, r) && !g.block[i] && !g.guard[i] && !H.Adv.heroAt(S, h.l, c, r)) {
          bd = d;
          best = [c, r];
        }
      }
    }
    if (!best) return;
    [h.c, h.r] = best;
    ev.push({ t: 'landed', hero: h.id });
  };

  const newDay = (S, ev) => {
    const week = (S.day - 1) % 7 === 0;
    for (const h of S.heroes) {
      if (!h.alive) continue;
      const guild = H.Town.list(S, h.owner).some(t => H.Town.visitor(S, t) === h && H.Town.has(t, 'guild1'));
      h.mana = guild ? maxMana(h) : Math.min(maxMana(h), h.mana + HR.manaDay + (hasPerk(h, 'memory') ? HR.memoryMana : 0));
      if (!MD.groundCost(S.map, h.l, h.c, h.r)) landAshore(S, h, ev);
      if (!week || !hasPerk(h, 'collector')) continue;
      if (S.players[h.owner].human) ev.push({ t: 'collect', hero: h.id });
      else collect(S, h, RARE.reduce((a, b) => (S.players[h.owner].res[b] < S.players[h.owner].res[a] ? b : a)));
    }
  };

  const dismiss = (S, h) => {
    if (S.heroes.filter(x => x.alive && x.owner === h.owner).length <= 1 && !H.Town.list(S, h.owner).length) return false;
    h.alive = false;
    S.ver++;
    return true;
  };
  const adjacent = (a, b) => a !== b && a.alive && b.alive && a.owner === b.owner && a.l === b.l && Math.max(Math.abs(a.c - b.c), Math.abs(a.r - b.r)) === 1;

  H.Hero = { RARE, canLearn, learn, learnScrolls, roadSpells, castRoad, overGround, record, spec, rank, hasPerk, hasTalent, gear, stat, maxMana, skillVal, morale, luck, sight, ground, steps, init, levelFor, addXp, levelPending, nextUp, pickCard, pickPerk, pickTalent, closeUp, autoUp, highState, battleHero, battleSide, afterFight, addTo, slotFor, moveStack, disband, giveArmy, fits, giveArt, artAt, moveArt, giveArts, income, growthPct, marketBonus, collect, newDay, dismiss, adjacent };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
