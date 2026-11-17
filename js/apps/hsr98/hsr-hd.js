(function (H) {
  'use strict';
  const HD = H.HD, TUN = HD.TUN;

  const pathOf = id => H.CHARS[id].path;
  const heroesOf = path => Object.keys(HD.HEROES).filter(id => pathOf(id) === path);
  const draftPaths = () => HD.PATHS.filter(p => heroesOf(p).length >= 3);
  const draftRng = run => H.makeRandom((run.seed * 31 + run.draft.n++ * 977 + 5) >>> 0);
  const THREAT_IDS = () => Object.keys(HD.THREATS);
  const recOrder = (a, b) => b.wave - a.wave || b.stars - a.stars || a.time - b.time;

  const KIND_OF = { q: 'act', e: 'act', t: 'pas', r: 'ult' };
  const SPARE = {
    'spare.forge': { name: 'Закалка оболочки', text: 'Броня +3, получаемый урон −6%.', fx: [['armor', 3], ['dr', 0.06]] },
    'spare.temper': { name: 'Вторая закалка', text: 'Урон атаки +10%, скорость атаки +10%.', fx: [['atk', 0.1], ['aspd', 0.1]] },
    'spare.seam': { name: 'Шов', text: 'Урон героя +8%.', fx: [['dmg', 0.08]] }
  };
  const SPARE_MODS = {};
  for (const [id, S] of Object.entries(SPARE)) SPARE_MODS[id] = { hd: 'spare', tick(A, u) { for (const [k, v] of S.fx) A.addFx(u, { n: S.name + ': ' + k, k, v, t: 0.5 }); } };

  const rollRng = (seed, p, holder) => H.makeRandom((seed * 2741 + p * 977 + (holder.rollN++) * 131 + 7) >>> 0);
  const ownedPieces = holder => Object.values(holder.kit || {}).filter(Boolean);
  const giftPath = (id, holder) => (SPARE[id] ? H.CHARS[holder.hero || holder.key].path : H.CHARS[HD.GIFTS[id].kit].path);

  function piecePool(kind, path, holder, taken) {
    const own = ownedPieces(holder);
    return Object.values(HD.PIECES).filter(P => P.kind === kind && P.path === path && !own.includes(P.id) && !taken.includes(P.id)).map(P => P.id);
  }

  function giftPool(holder, taken) {
    const parts = {};
    for (const id of ownedPieces(holder)) { const P = HD.PIECES[id]; (parts[P.kit] = parts[P.kit] || []).push(P.part); }
    const gifts = holder.gifts || [];
    return Object.values(HD.GIFTS).filter(G => parts[G.kit] && HD.needsMet(G.needs, parts[G.kit]) && !gifts.includes(G.id) && !taken.includes(G.id)).map(G => G.id);
  }

  const LINKS = {
    'blade.q': 'blade.t', 'luocha.e': 'luocha.t',
    'jingyuan.q': 'jingyuan.t', 'jingyuan.e': 'jingyuan.t', 'jingyuan.r': 'jingyuan.t',
    'topaz.q': 'topaz.t', 'topaz.e': 'topaz.t', 'topaz.r': 'topaz.t',
    'clara.q': 'clara.t', 'clara.r': 'clara.t', 'seele.t': 'seele.q', 'seele.e': 'seele.t',
    'bronya.q': 'bronya.e', 'march.t': 'march.q'
  };
  const SCALE_HP = ['blade.q', 'blade.e', 'blade.r', 'blade.t', 'fuxuan.r', 'march.q', 'gepard.e', 'gepard.r', 'natasha.q', 'natasha.r', 'bailu.q', 'bailu.r', 'bailu.t'];
  const SCALE_NONE = ['bronya.q', 'bronya.e', 'bronya.r', 'asta.r', 'asta.t', 'ruanmei.q', 'ruanmei.e', 'ruanmei.r', 'ruanmei.t', 'seele.e', 'herta.e', 'danheng.e', 'danheng.t', 'topaz.e', 'bailu.e', 'luocha.e', 'fuxuan.q', 'fuxuan.e', 'fuxuan.t', 'natasha.e', 'natasha.t', 'welt.e', 'gepard.t', 'trail.e', 'silverwolf.t'];
  const NAMES = {
    herta: [['вокруг Герты', 'вокруг героя'], ['на Герту', 'на героя']],
    clara: [['Клара получает', 'Герой получает'], ['Ударивший её', 'Ударивший героя'], ['бьют только Клару', 'бьют только героя'], ['Клару нельзя', 'героя нельзя'], ['урон атаки Клары', 'урон атаки героя']],
    welt: [['вокруг Вельта', 'вокруг героя']],
    march: [['макс. НР Март', 'макс. НР героя'], ['Март даёт щит на 8% её макс. НР', 'герой даёт щит на 8% своего макс. НР'], ['под щитом Март', 'под щитом героя']],
    gepard: [['макс. НР Гепарда', 'макс. НР героя'], ['Гепард встаёт', 'герой встаёт'], ['бьют Гепарда', 'бьют героя'], ['Агрессия Гепарда', 'Агрессия героя'], ['Урон атаки Гепарда растёт на 35% его брони', 'Урон атаки героя растёт на 35% его брони'], ['Гепард сразу', 'герой сразу']],
    fuxuan: [['уходит на Фу Сюань', 'уходит на героя'], ['её макс. НР', 'макс. НР героя'], ['макс. НР Фу Сюань', 'макс. НР героя'], ['по Фу Сюань', 'по герою']],
    natasha: [['макс. НР Наташи', 'макс. НР героя']],
    bailu: [['Байлу не даёт', 'герой не даёт']],
    luocha: [['урона атаки Лочи', 'урона атаки героя']],
    bronya: [['сама Броня', 'сам герой'], ['Пока Броня жива', 'Пока герой жив'], ['Атака Брони', 'Атака героя'], ['Броня добивает', 'герой добивает'], ['слабостью к ветру', 'слабостью к стихии героя']],
    seele: [['теряют Зеле из целей', 'теряют героя из целей'], ['Зеле игнорирует', 'герой игнорирует'], ['удары Зеле', 'удары героя']],
    silverwolf: [['Урон Волка', 'Урон героя']],
    topaz: [['Атака Топаз', 'Атака героя']],
    asta: [['Огненный урон союзников', 'Урон стихии героя у союзников'], ['пока Аста попадает', 'пока герой попадает']]
  };
  const RETEXT = {
    'silverwolf.q': [[/слабость к квантовому урону и \+(\S+) квантового урона по ней на 6 с; в кооперативе и к стихиям союзников\./, 'слабость к стихии героя и +$1 урона этой стихии по ней на 6 с.']],
    'himeko.e': [['огненного урона', 'урона героя']],
    'welt.t': [['бьют ещё мнимым уроном на', 'бьют ещё раз на']],
    'danheng.t': [['После Навыка или Техники', 'После любого навыка']],
    'bronya.t': [['перезарядки Навыка и Техники', 'перезарядки навыков']],
    'bronya.q': [['сбрасывает Технику', 'сбрасывает Технику Брони или второй навык']],
    'seele.t': [['сбрасывает перезарядку Навыка', 'сбрасывает перезарядку Навыка Зеле или последнего навыка с перезарядкой до ' + TUN.custom.seeleCd + ' с']],
    'march.t': [['ударивший союзника под щитом Март', 'ударивший союзника под любым щитом или самого героя']]
  };
  const ALONE = {
    'jingyuan.q': 'Без Таланта Цзин Юаня Повелитель приходит на одну серию из ' + TUN.custom.jySalvo.q + ' ударов.',
    'jingyuan.e': 'Без Таланта Цзин Юаня Повелитель приходит на одну серию из ' + TUN.custom.jySalvo.e + ' ударов.',
    'jingyuan.r': 'Без Таланта Цзин Юаня Повелитель приходит на одну серию из ' + TUN.custom.jySalvo.r + ' ударов.',
    'topaz.q': 'Без Таланта Топаз Счетовод бьёт один раз и уходит.',
    'topaz.e': 'Без Таланта Топаз Счетовод выбегает на 6 с и бьёт раз в 1,5 с.',
    'topaz.r': 'Без Таланта Топаз Счетовод выбегает на время «Поразительного роста».',
    'clara.q': 'Без Таланта Клары Меток нет.',
    'clara.r': 'Без Таланта Клары Сварог всё равно отвечает каждому, кто бьёт героя, пока действует техника.',
    'blade.q': 'Без Таланта Блэйда тратит ' + Math.round(TUN.custom.bladeAlone * 100) + '% НР, Частокол НР не тратит.',
    'luocha.e': 'Без Таланта Лочи Зона держится ' + TUN.custom.luochaZone + ' с.',
    'welt.e': 'В Сборке волна ещё бьёт на ' + Math.round(TUN.custom.weltPrison * 100) + '% урона атаки.',
    'luocha.q': 'Два Цветка открывают Зону.',
    'luocha.r': 'Два Цветка открывают Зону.'
  };

  function retext(id, kit, text) {
    if (H.isEn && H.isEn()) return text;
    let out = text;
    for (const [a, b] of RETEXT[id] || []) out = out.replace(a, b);
    for (const [a, b] of NAMES[kit] || []) out = out.split(a).join(b);
    return out;
  }

  function pieceText(id, k) {
    if (SPARE[id]) return SPARE[id].text;
    if (HD.GIFTS[id]) return retext(id, HD.GIFTS[id].kit, HD.GIFTS[id].text);
    const P = HD.PIECES[id];
    return retext(id, P.kit, HD.KITS[P.kit].text[P.part](k));
  }

  const pieceAlone = id => ALONE[id] || '';
  const pieceCd = id => (TUN.custom.cd[id] != null ? TUN.custom.cd[id] : HD.PIECES[id].spec.cd);
  const pieceScale = id => (SCALE_HP.includes(id) ? 'hp' : SCALE_NONE.includes(id) ? null : 'atk');
  const pieceLinks = id => (LINKS[id] ? [LINKS[id]] : []).concat(Object.keys(LINKS).filter(x => LINKS[x] === id));

  function pieceName(id) {
    if (SPARE[id]) return SPARE[id].name;
    if (HD.GIFTS[id]) return HD.GIFTS[id].name;
    const P = HD.PIECES[id], k = H.CHARS[P.kit];
    return P.part === 'q' ? k.skill.name : P.part === 'e' ? k.tech.name : P.part === 'r' ? k.ult.name : 'Талант';
  }

  function makeRoll(seed, p, holder, slot, taken) {
    const rng = rollRng(seed, p, holder), cards = [];
    if (slot === 'g') {
      const pool = giftPool(holder, taken), paths = [...new Set(pool.map(id => giftPath(id, holder)))];
      for (let i = paths.length - 1; i > 0; i--) { const j = rng.int(i + 1); [paths[i], paths[j]] = [paths[j], paths[i]]; }
      for (let n = 0; cards.length < 3 && n < 12 && paths.length; n++) {
        const path = paths[n % paths.length], list = pool.filter(id => giftPath(id, holder) === path && !cards.some(c => c.id === id));
        if (list.length) { const id = list[rng.int(list.length)]; cards.push({ path, id, seen: [id], left: 2 }); }
      }
      for (const id of Object.keys(SPARE)) if (cards.length < 3 && !(holder.gifts || []).includes(id)) cards.push({ path: giftPath(id, holder), id, seen: [id], left: 0 });
    } else {
      const kind = KIND_OF[slot], paths = HD.PATHS.filter(path => piecePool(kind, path, holder, taken).length);
      while (cards.length < 3 && paths.length) {
        const path = paths.splice(rng.int(paths.length), 1)[0], list = piecePool(kind, path, holder, taken);
        const id = list[rng.int(list.length)];
        cards.push({ path, id, seen: [id], left: 2 });
      }
    }
    return { slot, cards, sel: 0 };
  }

  function rollFresh(holder, i, taken) {
    const R = holder.roll, c = R && R.cards[i];
    if (!c || c.left <= 0) return [];
    if (R.slot === 'g') {
      const shown = R.cards.flatMap(x => x.seen), pool = giftPool(holder, taken).filter(id => !shown.includes(id)), same = pool.filter(id => giftPath(id, holder) === c.path);
      return same.length ? same : pool;
    }
    return piecePool(KIND_OF[R.slot], c.path, holder, taken).filter(id => !c.seen.includes(id) && !R.cards.some(x => x.id === id));
  }

  function rollRefresh(seed, p, holder, i, taken) {
    const fresh = rollFresh(holder, i, taken);
    if (!fresh.length) return false;
    const c = holder.roll.cards[i], rng = rollRng(seed, p, holder);
    c.id = fresh[rng.int(fresh.length)];
    c.path = holder.roll.slot === 'g' ? giftPath(c.id, holder) : c.path;
    c.seen.push(c.id); c.left--;
    return true;
  }

  function rollTake(holder, i) {
    const R = holder.roll, c = R && R.cards[i];
    if (!c) return null;
    if (R.slot === 'g') (holder.gifts = holder.gifts || []).push(c.id);
    else { holder.kit[R.slot] = c.id; holder.abil[R.slot] = Math.max(1, holder.abil[R.slot] || 0); }
    holder.roll = null;
    return { slot: R.slot, id: c.id };
  }

  function rollNext(seed, p, holder, taken) {
    if (holder.roll || !holder.rollQ || !holder.rollQ.length) return;
    holder.roll = makeRoll(seed, p, holder, holder.rollQ.shift(), taken);
  }

  function rollSwap(seed, p, holder, taken) {
    const R = holder.roll;
    if (!R) return false;
    let changed = false;
    R.cards.forEach(c => {
      if (!taken.includes(c.id)) return;
      const free = id => !R.cards.some(x => x.id === id);
      let list = (R.slot === 'g' ? giftPool(holder, taken) : piecePool(KIND_OF[R.slot], c.path, holder, taken)).filter(free);
      if (!list.length && R.slot !== 'g') list = HD.PATHS.flatMap(path => piecePool(KIND_OF[R.slot], path, holder, taken)).filter(free);
      if (!list.length) return;
      const rng = rollRng(seed, p, holder);
      c.id = list[rng.int(list.length)];
      c.path = R.slot === 'g' ? giftPath(c.id, holder) : HD.PIECES[c.id].path;
      c.seen.push(c.id);
      changed = true;
    });
    return changed;
  }

  function takenOf(players, p) {
    const out = [];
    players.forEach((q, i) => { if (i !== p) out.push(...ownedPieces(q), ...(q.gifts || [])); });
    return out;
  }

  function starsOf(s) {
    if (!s.win || s.base <= 0) return 0;
    const k = s.base / s.baseMax;
    return k >= 0.9 && !s.tfell ? 3 : k >= 0.5 ? 2 : 1;
  }

  function trialDone(T, s) {
    if (T.kind === 'hero') return s.win && s.mode !== 'custom' && s.hero === T.hero;
    if (T.kind === 'diff') return s.win && s.diff === T.diff;
    if (T.id === 'towers') return s.win && !s.tfell;
    if (T.id === 'nodeath') return s.win && !s.deaths;
    if (T.id === 'fastboss') return s.bossMin != null && s.bossMin < HD.META.fastBoss;
    if (T.id === 'raid') return s.raid >= HD.META.raidGold;
    if (T.id === 'hard3') return s.diff === 'hard' && s.stars === 3;
    if (T.id === 'crew2') return s.win && !!s.crew && s.crew.length === 2;
    if (T.id === 'crew4') return s.win && !!s.crew && s.crew.length === 4;
    if (T.id === 'crewstay') return s.win && !!s.crew && !!s.crewStay;
    if (T.kind === 'custom') {
      if (!s.win || s.mode !== 'custom' || !s.build || !s.build.kit) return false;
      const ids = Object.values(s.build.kit).filter(Boolean), kits = ids.map(id => id.split('.')[0]);
      if (T.id === 'cust_win') return true;
      if (T.id === 'cust_paths') return new Set([H.CHARS[s.hero].path].concat(ids.map(id => HD.PIECES[id].path))).size === 5;
      if (T.id === 'cust_full') return kits.length === 4 && new Set(kits).size === 1;
      if (T.id === 'cust_foreign') return !kits.includes(s.hero);
    }
    return false;
  }

  function rollThreats(seed) {
    const rng = H.makeRandom((seed * 131 + 71) >>> 0), pool = THREAT_IDS(), a = pool.splice(rng.int(pool.length), 1)[0];
    return [a, pool[rng.int(pool.length)]];
  }

  function newRun(o) {
    const diff = HD.DIFFS[o.diff] ? o.diff : 'normal', crew = (o.heroes || []).filter(id => HD.HEROES[id]).slice(0, 4), hero = crew[0] || (HD.HEROES[o.hero] ? o.hero : null), seed = o.seed;
    const threats = o.threats && o.threats.length === 2 && o.threats.every(t => HD.THREATS[t]) && o.threats[0] !== o.threats[1] ? o.threats.slice() : rollThreats(seed);
    const custom = o.mode === 'custom';
    const player = id => Object.assign({ hero: id, lvl: 1, exp: 0, pts: 1, abil: { q: 0, e: 0, t: 0, r: 0 }, picks: {}, gold: TUN.startGold, items: [null, null, null, null, null, null], cone: null, deaths: 0, buyback: false }, custom ? { kit: { q: null, e: null, t: null, r: null }, gifts: [], roll: null, rollQ: [], rollN: 0 } : {});
    const run = {
      seed, diff, threats, wave: 1, phase: hero && !custom ? 'break' : 'draft', draft: null,
      players: (crew.length ? crew : [custom ? null : hero]).map(player),
      base: { hp: HD.DIFFS[diff].base }, towers: [null, null, null],
      stats: { kills: 0, dmg: 0, heal: 0, gold: 0, spent: 0, raid: 0, time: 0 }, log: []
    };
    if (custom) run.mode = 'custom';
    if (!hero || custom) {
      run.draft = { n: 0, paths: [], cards: [], pick: null };
      const rng = draftRng(run), pool = draftPaths();
      while (run.draft.paths.length < 3 && pool.length) run.draft.paths.push(pool.splice(rng.int(pool.length), 1)[0]);
      run.draft.cards = run.draft.paths.map(path => { const list = heroesOf(path), h = list[rng.int(list.length)]; return { path, hero: h, seen: [h], left: 2 }; });
    }
    return run;
  }

  function draftRefresh(run, i, taken) {
    const c = run && run.draft && run.draft.cards[i];
    if (!c || run.phase !== 'draft' || c.left <= 0) return false;
    const fresh = heroesOf(c.path).filter(id => !c.seen.includes(id) && !(taken && taken.includes(id)));
    if (!fresh.length) return false;
    const rng = draftRng(run);
    c.hero = fresh[rng.int(fresh.length)];
    c.seen.push(c.hero); c.left--;
    return true;
  }

  function draftSwap(run, c, taken) {
    const free = id => !taken.includes(id), own = heroesOf(c.path).filter(free), fresh = own.filter(id => !c.seen.includes(id));
    const pool = fresh.length ? fresh : own.length ? own : draftPaths().flatMap(heroesOf).filter(free);
    const rng = draftRng(run);
    c.hero = pool[rng.int(pool.length)];
    c.path = pathOf(c.hero);
    c.seen.push(c.hero);
  }

  function runSummary(run, p, st, win, date) {
    const sum = {
      win, wave: win ? HD.WAVES.length : run.wave, waves: HD.WAVES.length, hero: p.hero, lvl: p.lvl, diff: run.diff, threats: run.threats.slice(),
      base: run.base.hp, baseMax: HD.DIFFS[run.diff].base, towers: run.towers.filter(h => h == null || h > 0).length, tfell: st.tfell || 0,
      time: Math.round(st.time), kills: st.kills, dmg: Math.round(st.dmg), heal: Math.round(st.heal), bossMin: st.bossMin == null ? null : st.bossMin,
      gold: st.gold, spent: st.spent, raid: st.raid, deaths: p.deaths, date,
      build: { items: p.items.map(it => (it ? { id: it.id, set: it.set, slot: it.slot, up: it.up || 0, n: it.n || 0 } : null)), cone: p.cone ? { id: p.cone.id, sup: p.cone.sup } : null, tr: p.picks[10], ei: p.picks[20] }
    };
    if (run.mode === 'custom') { sum.mode = 'custom'; sum.build.kit = Object.assign({}, p.kit); sum.build.gifts = (p.gifts || []).slice(); }
    sum.cleared = win ? HD.WAVES.length : Math.max(0, run.wave - 1);
    sum.stars = starsOf(sum);
    return sum;
  }

  Object.assign(H.Game.prototype, {
    hd() {
      const s = this.state;
      if (!s.hd) s.hd = { run: null, hist: [], opts: { aim: 'auto' }, last: null, hero: 'trail' };
      const D = s.hd;
      if (!D.recs) D.recs = [];
      if (!D.open) D.open = {};
      if (!D.asc) D.asc = { pts: 0, got: [] };
      if (!D.trials) D.trials = { done: [], got: [] };
      const key = Math.floor(this.now() / HD.META.weekMs);
      if (!D.week || D.week.key !== key) D.week = { key, pts: 0, got: [] };
      return D;
    },

    hdRun() {
      const run = this.hd().run;
      if (run && run.phase === 'wave') run.phase = 'break';
      return run;
    },

    hdCanDiff(diff, mode) { return diff !== 'hard' || !!(mode === 'custom' ? this.hd().open.customHard : this.hd().open.hard); },

    hdRecords(diff, hero) {
      return this.hd().recs.concat(HD.SOLO).filter(r => !r.crew && !r.mode && r.diff === diff && (!hero || r.hero === hero)).sort(recOrder);
    },

    hdCustomRecords(diff) {
      return this.hd().recs.concat(HD.SOLO_CUSTOM).filter(r => r.mode === 'custom' && r.diff === diff).sort(recOrder);
    },

    hdCrewRecords(diff, hero) {
      return this.hd().recs.filter(r => r.crew && !r.mode && r.diff === diff && (!hero || r.hero === hero)).sort(recOrder);
    },

    hdAscLvl() { return Math.min(HD.META.ascMax, Math.floor(this.hd().asc.pts / HD.META.ascPer)); },

    hdWeekLeft() { return HD.META.weekMs - (this.now() % HD.META.weekMs); },

    hdClaimAsc(lvl) {
      const D = this.hd(), R = HD.META.asc[lvl];
      if (!R || lvl > this.hdAscLvl() || D.asc.got.includes(lvl)) return null;
      D.asc.got.push(lvl);
      if (R.plate) { D.plate = R.plate; return ['плашка «' + R.plate + '»']; }
      return this.give(R);
    },

    hdClaimWeek(i) {
      const D = this.hd(), R = HD.META.week[i];
      if (!R || D.week.pts < R[0] || D.week.got.includes(i)) return null;
      D.week.got.push(i);
      return this.give(R[1]);
    },

    hdClaimTrial(id) {
      const D = this.hd(), T = HD.META.trial;
      if (!D.trials.done.includes(id) || D.trials.got.includes(id)) return null;
      D.trials.got.push(id);
      D.asc.pts += T.asc;
      return [T.asc + ' очков продвижения'].concat(this.give({ jade: T.jade }));
    },

    hdClaimable() {
      const D = this.hd(), lv = this.hdAscLvl();
      return {
        asc: Object.keys(HD.META.asc).map(Number).filter(l => l <= lv && !D.asc.got.includes(l)).length,
        week: HD.META.week.filter((w, i) => D.week.pts >= w[0] && !D.week.got.includes(i)).length,
        trials: D.trials.done.filter(id => !D.trials.got.includes(id)).length
      };
    },

    hdNew(o = {}) {
      const run = newRun(Object.assign({}, o, { seed: o.seed || this.rng.int(1e9) + 1 })), hero = run.players[0].hero;
      const D = this.hd();
      D.run = run; if (hero) D.hero = hero;
      return run;
    },

    hdRefresh(i) { return draftRefresh(this.hdRun(), i); },

    hdTake(i) {
      const run = this.hdRun(), c = run && run.draft && run.draft.cards[i];
      if (!c || run.phase !== 'draft') return false;
      const P0 = run.players[0];
      if (run.mode === 'custom') {
        if (P0.hero) return false;
        P0.hero = c.hero;
        run.draft.pick = i;
        P0.rollQ = TUN.custom.rollStart.slice();
        rollNext(run.seed, 0, P0, []);
        return true;
      }
      P0.hero = c.hero;
      run.draft.pick = i;
      run.phase = 'break';
      this.hd().hero = c.hero;
      return true;
    },

    hdRollRefresh(i) {
      const run = this.hdRun(), P0 = run && run.players[0];
      return !!(P0 && P0.roll && run.phase === 'draft' && rollRefresh(run.seed, 0, P0, i, []));
    },

    hdRollTake(i) {
      const run = this.hdRun(), P0 = run && run.players[0];
      if (!P0 || !P0.roll || run.phase !== 'draft') return null;
      const got = rollTake(P0, i);
      rollNext(run.seed, 0, P0, []);
      if (!P0.roll) run.phase = 'break';
      return got;
    },

    hdArena(run) {
      const A = new HD.Arena({ run: run || this.hdRun() });
      return A;
    },

    hdSync(A) { const run = this.hd().run; if (run) A.toRun(run); return run; },

    hdBreak(A) {
      this.hdSync(A);
      this.events.push({ t: 'autosave' });
    },

    hdFinish(A, quit) {
      const D = this.hd(), run = D.run;
      if (!run) return D.last;
      if (!run.players[0].hero) { D.run = null; return null; }
      if (A) A.toRun(run);
      const sum = runSummary(run, run.players[0], run.stats, !quit && !!A && A.over === 'win', this.now());
      if (A && run.mode === 'custom') sum.byFrom = Object.assign({}, A.dmgFrom);
      this.hdKeepResult(sum);
      D.run = null;
      return sum;
    },

    hdFinishNet(net, quit) {
      if (!net.A) return null;
      const run = net.A.toRun(net.run), p = run.players[net.seat];
      const sum = runSummary(run, p, Object.assign({}, run.stats, p.st), !quit && net.A.over === 'win', this.now());
      sum.crew = net.names.slice();
      sum.crewStay = !quit && !net.anyAway;
      sum.crewRows = run.players.map((q, i) => ({ seat: i, me: i === net.seat, name: net.names[i], hero: q.hero, lvl: q.lvl, dmg: Math.round(q.st.dmg), heal: Math.round(q.st.heal), kills: q.st.kills, gold: Math.round(q.st.gold), deaths: q.deaths }));
      this.hdKeepResult(sum);
      this.events.push({ t: 'autosave' });
      return sum;
    },

    hdKeepResult(sum) {
      const D = this.hd();
      sum.meta = this.hdMetaClose(sum);
      D.last = sum;
      D.hist.unshift({ hero: sum.hero, diff: sum.diff, wave: sum.wave, win: sum.win, base: sum.base, stars: sum.stars, date: sum.date, crew: sum.crew, sum: Object.assign({}, sum, { meta: null }) });
      if (D.hist.length > HD.META.hist) D.hist.length = HD.META.hist;
    },

    hdMetaClose(sum) {
      const D = this.hd(), M = HD.META, out = {};
      const rec = { name: this.state.name || 'Первопроходец', hero: sum.hero, diff: sum.diff, wave: sum.cleared, time: sum.time, stars: sum.stars, date: sum.date };
      if (sum.mode === 'custom') {
        rec.mode = 'custom'; rec.build = { kit: sum.build.kit, gifts: sum.build.gifts };
        if (sum.win) { D.won = D.won || []; for (const id of Object.values(sum.build.kit).concat(sum.build.gifts)) if (id && !D.won.includes(id)) D.won.push(id); }
      }
      if (sum.crew) rec.crew = sum.crew;
      D.recs.push(rec);
      const mine = D.recs.filter(r => r.diff === sum.diff).sort(recOrder);
      D.recs = D.recs.filter(r => r.diff !== sum.diff).concat(mine.slice(0, 40));
      out.place = (sum.mode === 'custom' ? this.hdCustomRecords(sum.diff) : this.hdRecords(sum.diff)).indexOf(rec) + 1;
      out.rec = rec;
      const asc = Math.round(sum.win ? M.ascWin[sum.diff] : M.ascWin[sum.diff] * M.ascLoss * sum.cleared / sum.waves);
      const lv0 = this.hdAscLvl();
      D.asc.pts += asc;
      out.asc = asc; out.ascLvl = [lv0, this.hdAscLvl()];
      const wk = sum.win ? M.weekWin : sum.cleared * M.weekWave;
      out.week = Math.max(0, Math.min(M.weekMax - D.week.pts, wk));
      D.week.pts += out.week;
      if (sum.win && (sum.diff === 'normal' || sum.diff === 'hard')) { if (sum.mode === 'custom') D.open.customHard = true; else D.open.hard = true; }
      out.trials = [];
      for (const T of HD.TRIALS) if (!D.trials.done.includes(T.id) && trialDone(T, sum)) { D.trials.done.push(T.id); out.trials.push(T.id); }
      return out;
    }
  });

  HD.CUSTOM = { KIND_OF, SPARE, SPARE_MODS };
  Object.assign(HD, { rollSwap, pieceCd, pieceText, pieceAlone, pieceScale, pieceLinks, pieceName, giftPool, makeRoll, rollFresh, rollRefresh, rollTake, rollNext, takenOf, draftPaths, heroesOf, rollThreats, starsOf, trialDone, recOrder, newRun, draftRefresh, draftSwap });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
