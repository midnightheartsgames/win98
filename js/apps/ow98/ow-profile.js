(function (O) {
  'use strict';
  const KEY = 'ow98_profile';
  const RAR = {
    common: { ru: 'Обычный', col: '#e8e8e8', price: 25, dup: 5, g: { m: 'ОБЫЧНЫЙ', f: 'ОБЫЧНАЯ', n: 'ОБЫЧНОЕ' } },
    rare: { ru: 'Редкий', col: '#4aa8ff', price: 75, dup: 15, g: { m: 'РЕДКИЙ', f: 'РЕДКАЯ', n: 'РЕДКОЕ' } },
    epic: { ru: 'Эпический', col: '#c060ff', price: 250, dup: 50, g: { m: 'ЭПИЧЕСКИЙ', f: 'ЭПИЧЕСКАЯ', n: 'ЭПИЧЕСКОЕ' } },
    legendary: { ru: 'Легендарный', col: '#ffa820', price: 1000, dup: 200, g: { m: 'ЛЕГЕНДАРНЫЙ', f: 'ЛЕГЕНДАРНАЯ', n: 'ЛЕГЕНДАРНОЕ' } }
  };
  O.RARITY = RAR;
  const TYPES = [
    { id: 'skin', ru: 'ОБЛИКИ', one: 'ОБЛИК', g: 'm', icon: 'cSkin' }, { id: 'emote', ru: 'ЭМОЦИИ', one: 'ЭМОЦИЯ', g: 'f', icon: 'cEmote' },
    { id: 'pose', ru: 'ПОБЕДНЫЕ ПОЗЫ', one: 'ПОБЕДНАЯ ПОЗА', g: 'f', icon: 'cPose' }, { id: 'voice', ru: 'РЕПЛИКИ', one: 'РЕПЛИКА', g: 'f', icon: 'cVoice' },
    { id: 'spray', ru: 'ГРАФФИТИ', one: 'ГРАФФИТИ', g: 'n', icon: 'cSpray' }, { id: 'intro', ru: 'ЛУЧШИЕ МОМЕНТЫ', one: 'ЛУЧШИЙ МОМЕНТ', g: 'm', icon: 'cIntro' },
    { id: 'icon', ru: 'ИКОНКИ ИГРОКА', one: 'ИКОНКА ИГРОКА', g: 'f', icon: 'cIcon' }
  ];
  O.COSMETIC_TYPES = TYPES;

  const VOICES = {
    tracer: ['Кавалерия прибыла!', 'Спокойно, дружище.', 'Ещё увидимся!', 'Ура-а-а!', 'Стоп, время!', 'Проще простого.'],
    soldier: ['Я здесь не для того, чтобы начинать войны.', 'Время старое, приёмы старые.', 'Дисциплина прежде всего.', 'Вижу цель.', 'Держать строй!', 'Не стареть — значит сражаться.'],
    mccree: ['Где-то сейчас полдень.', 'Удача любит смелых.', 'Спокойно, партнёр.', 'Я не жалуюсь.', 'Шериф в городе.', 'Револьвер не подводит.'],
    junkrat: ['Бабах!', 'Кто-нибудь видел мою ногу?', 'Сокровища мои!', 'Ха-ха-ха!', 'Взрываю, значит существую.', 'Гранаты для всех!'],
    torbjorn: ['Турели — лучшие друзья.', 'Броню никто не отменял.', 'Молот в деле!', 'Сделано на совесть.', 'Шведская сталь!', 'Всё чиню, всё строю.'],
    widowmaker: ['Один выстрел. Одна жертва.', 'Как прекрасно.', 'Ты мне скучен.', 'Паук ждёт.', 'Никто не спрячется.', 'Смерть — это искусство.'],
    reinhardt: ['Не бойтесь, я вас защищу!', 'Честь и слава!', 'Ха-ха! Отличный бой!', 'За мной!', 'Крестоносцы, вперёд!', 'Я — ваш щит!'],
    roadhog: ['Хрю.', 'Свиньи вперёд.', 'Тихо.', 'Добыча моя.', 'Хорошая охота.', 'Не мешай.'],
    winston: ['Вообще-то я учёный.', 'Арахисовое масло?', 'Мир стоит спасать.', 'Гипотеза подтверждена.', 'Не называйте меня обезьяной.', 'Исследуем!'],
    lucio: ['Давай, давай!', 'Громче!', 'Ловите ритм!', 'Вместе мы сила.', 'Не останавливаемся!', 'Музыка лечит.'],
    mercy: ['Герои не умирают!', 'Я прикрою.', 'Помощь близко.', 'Всё будет хорошо.', 'Держитесь!', 'Медицина — моё оружие.'],
    zenyatta: ['Обрети гармонию.', 'Путь неблизкий.', 'Будь как вода.', 'Всё преходяще.', 'Я вижу в тебе свет.', 'Спокойствие.']
  };
  const SPRAYS = [['logo', 'Эмблема'], ['face', 'Портрет'], ['heart', 'Сердце'], ['star', 'Звезда'], ['gg', 'GG'], ['skull', 'Череп'], ['role', 'Роль'], ['pixel', 'Пиксели'], ['name', 'Имя']];
  const INTROS = [['intro1', 'Первый выход'], ['intro2', 'Эффектный'], ['intro3', 'Коронный']];
  const ICONS = ['OW', 'Ромб', 'Звезда', 'Щит', 'Череп', 'Крест', 'Молния', 'Корона', 'Сакура', 'Снежинка', 'Пальма', 'Маяк', 'Шестерня', 'Сердце', 'Пламя', 'Волна', 'Луна', 'Солнце', 'Ноты', 'Сфера'];
  O.PLAYER_ICONS = ICONS;

  function catalog(hero) {
    const out = [];
    for (const s of O.SKINS[hero] || []) out.push({ id: 'skin:' + s.id, hero, type: 'skin', key: s.id, name: s.name, rar: s.rar, def: s.id === 'classic' });
    for (const [k, c] of O.Clips.list(hero, 'emote')) out.push({ id: 'emote:' + k, hero, type: 'emote', key: k, name: c.n, rar: k === 'heroic' ? 'common' : 'epic', def: k === 'heroic' });
    for (const [k, c] of O.Clips.list(hero, 'pose')) out.push({ id: 'pose:' + k, hero, type: 'pose', key: k, name: c.n, rar: k === 'heroic' ? 'common' : 'rare', def: k === 'heroic' });
    VOICES[hero].forEach((txt, i) => out.push({ id: 'voice:' + i, hero, type: 'voice', key: String(i), name: txt, rar: 'common', def: i === 0 }));
    SPRAYS.forEach(([k, n], i) => out.push({ id: 'spray:' + k, hero, type: 'spray', key: k, name: n, rar: 'common', def: i === 0 }));
    out.push({ id: 'intro:default', hero, type: 'intro', key: 'default', name: 'Классика', rar: 'common', def: true });
    for (const [k, n] of INTROS) out.push({ id: 'intro:' + k, hero, type: 'intro', key: k, name: n, rar: 'epic' });
    for (const it of out) it.uid = hero + ':' + it.id;
    return out;
  }
  const CAT = {};
  O.catalog = function (hero) { if (!CAT[hero]) CAT[hero] = catalog(hero); return CAT[hero]; };
  O.iconCatalog = () => ICONS.map((n, i) => ({ uid: 'icon:' + i, id: 'icon:' + i, type: 'icon', key: String(i), name: n, rar: i === 0 ? 'common' : i < 12 ? 'common' : 'rare', def: i === 0 }));
  O.VOICE_LINES = VOICES;

  function defaults() {
    return {
      v: 1, name: 'Игрок', tag: 1000 + (Math.random() * 8999 | 0), level: 1, xp: 0, boxes: 1, credits: 0,
      owned: {}, seen: {}, fresh: {}, equip: {}, icon: 0, lastHero: 'tracer', firstWin: '',
      stats: { games: 0, wins: 0, losses: 0, draws: 0, time: 0, elims: 0, finals: 0, deaths: 0, dmg: 0, heal: 0, objTime: 0, objKills: 0, medals: { gold: 0, silver: 0, bronze: 0 }, potg: 0, hero: {} },
      comp: { games: 0, placed: false, sr: 0, wins: 0, losses: 0, season: 1, best: 0 },
      party: [], friends: null,
      opts: { sens: 5, invert: false, fov: 90, res: '480', filter: 'linear', shadows: true, post: true, vol: 0.8, music: 0.5, voice: true, subs: true, xhair: 'default', names: true, fps: false, diff: 1 },
      news: 0
    };
  }

  const Profile = {
    defaults,
    load() {
      let p = defaults();
      try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
        if (raw) {
          const d = JSON.parse(raw);
          p = Object.assign(defaults(), d);
          p.stats = Object.assign(defaults().stats, d.stats || {});
          p.stats.medals = Object.assign({ gold: 0, silver: 0, bronze: 0 }, (d.stats && d.stats.medals) || {});
          p.opts = Object.assign(defaults().opts, d.opts || {});
          p.comp = Object.assign(defaults().comp, d.comp || {});
        }
      } catch (e) { }
      if (!p.friends) p.friends = Profile.makeFriends(p);
      Profile.migrate(p);
      return p;
    },
    migrate(p) {
      for (const hero of O.HERO_ORDER) {
        const cat = O.catalog(hero);
        for (const type of ['emote', 'pose']) {
          const items = cat.filter(i => i.type === type);
          const valid = new Set(items.map(i => i.uid));
          for (const u of Object.keys(p.owned).filter(u => u.startsWith(hero + ':' + type + ':') && !valid.has(u))) {
            delete p.owned[u];
            const repl = items.find(i => !i.def && !p.owned[i.uid]);
            if (repl) p.owned[repl.uid] = true;
          }
          const e = p.equip[hero];
          if (e && e[type] && !items.some(i => i.key === e[type])) delete e[type];
        }
      }
      return p;
    },
    save(p) { try { if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(p)); return true; } catch (e) { return false; } },
    makeFriends(p) {
      const r = O.rng(p.tag);
      const names = O.shuffle(r, O.BOT_NAMES.slice()).slice(0, 9);
      const st = ['online', 'online', 'game', 'game', 'away', 'offline', 'offline', 'offline', 'online'];
      return names.map((n, i) => ({ name: n, tag: 1000 + (r() * 8999 | 0), level: 5 + (r() * 90 | 0), status: st[i], hero: O.HERO_ORDER[(r() * 12) | 0] }));
    },
    xpNeed(level) { return Math.min(22000, 1500 + level * 350); },
    owns(p, item) { return !!(item.def || p.owned[item.uid]); },
    equipped(p, hero, type) {
      const e = p.equip[hero] || {};
      if (e[type]) return e[type];
      const it = O.catalog(hero).find(x => x.type === type && x.def);
      return it ? it.key : null;
    },
    equip(p, hero, type, key) { p.equip[hero] = p.equip[hero] || {}; p.equip[hero][type] = key; },
    skinsMap(p) { const m = {}; for (const h of O.HERO_ORDER) m[h] = Profile.equipped(p, h, 'skin'); return m; },
    unlockCount(p, hero) { const c = O.catalog(hero); return [c.filter(i => Profile.owns(p, i)).length, c.length]; },
    buy(p, item) {
      if (Profile.owns(p, item)) return false;
      const price = RAR[item.rar].price;
      if (p.credits < price) return false;
      p.credits -= price;
      p.owned[item.uid] = true;
      return true;
    },
    openBox(p, rand) {
      if (p.boxes <= 0) return null;
      p.boxes--;
      rand = rand || Math.random;
      const all = [];
      for (const h of O.HERO_ORDER) for (const it of O.catalog(h)) if (!it.def) all.push(it);
      for (const it of O.iconCatalog()) if (!it.def) all.push(it);
      const roll = () => { const x = rand(); return x < 0.025 ? 'legendary' : x < 0.11 ? 'epic' : x < 0.42 ? 'rare' : 'common'; };
      const items = [];
      for (let i = 0; i < 4; i++) {
        let rar = roll();
        if (i === 3 && items.every(x => x.rar === 'common')) rar = rand() < 0.15 ? 'epic' : 'rare';
        if (rand() < 0.07) { const amt = rar === 'legendary' ? 500 : rar === 'epic' ? 150 : 50; items.push({ credits: amt, rar: rar === 'common' ? 'rare' : rar, name: amt + ' кредитов' }); p.credits += amt; continue; }
        const pool = all.filter(it => it.rar === rar);
        const fresh = pool.filter(it => !p.owned[it.uid]);
        const it = O.pick(rand, fresh.length && rand() < 0.8 ? fresh : pool);
        const dup = !!p.owned[it.uid];
        if (dup) p.credits += RAR[it.rar].dup; else { p.owned[it.uid] = true; if (it.hero) p.fresh[it.hero] = true; }
        items.push({ item: it, rar: it.rar, dup, credits: dup ? RAR[it.rar].dup : 0, name: it.name });
      }
      return items;
    },
    medals(g, team) {
      const mine = g.heroes.filter(h => h.team === team);
      const cats = [['elims', 'Убийства'], ['objKills', 'Убийства у цели'], ['objTime', 'Время у цели'], ['dmg', 'Урон'], ['heal', 'Лечение']];
      const res = {};
      for (const h of mine) res[h.id] = [];
      for (const [k, n] of cats) {
        const sorted = mine.slice().sort((a, b) => b.stats[k] - a.stats[k]);
        sorted.forEach((h, i) => { if (h.stats[k] > 0 && i < 3) res[h.id].push({ cat: k, name: n, medal: ['gold', 'silver', 'bronze'][i], val: h.stats[k] }); });
      }
      return res;
    },
    addMatch(p, g, player, o = {}) {
      const win = g.winner === player.team, draw = g.winner === -1 || g.winner === null;
      const secs = g.t;
      const today = new Date().toISOString().slice(0, 10);
      const firstWin = win && p.firstWin !== today;
      const lines = [['Матч завершён', 250], ['Время в матче', Math.round(secs * 3)]];
      if (win) lines.push(['Победа', 500]);
      if (draw) lines.push(['Ничья', 250]);
      if (firstWin) { lines.push(['Первая победа за день', 1500]); p.firstWin = today; }
      if (o.party) lines.push(['Игра в группе', 100]);
      const xp = lines.reduce((a, l) => a + l[1], 0);
      const lvl0 = p.level;
      p.xp += xp;
      let ups = 0;
      while (p.xp >= Profile.xpNeed(p.level)) { p.xp -= Profile.xpNeed(p.level); p.level++; p.boxes++; ups++; }
      const s = p.stats, hs = player.stats;
      s.games++; if (win) s.wins++; else if (draw) s.draws++; else s.losses++;
      s.time += secs; s.elims += hs.elims; s.finals += hs.finals; s.deaths += hs.deaths; s.dmg += hs.dmg; s.heal += hs.heal; s.objTime += hs.objTime; s.objKills += hs.objKills;
      const med = Profile.medals(g, player.team)[player.id] || [];
      for (const m of med) s.medals[m.medal]++;
      for (const hid in hs.time) {
        const hh = s.hero[hid] = Object.assign({ games: 0, wins: 0, time: 0, elims: 0, deaths: 0, dmg: 0, heal: 0, best: 0, bestDmg: 0 }, s.hero[hid] || {});
        hh.time += hs.time[hid];
        if (hid === player.heroId) {
          hh.games++; if (win) hh.wins++;
          hh.elims += hs.elims; hh.deaths += hs.deaths; hh.dmg += hs.dmg; hh.heal += hs.heal;
          hh.best = Math.max(hh.best, hs.elims); hh.bestDmg = Math.max(hh.bestDmg, hs.dmg);
        }
      }
      if (player.heroId) p.lastHero = player.heroId;
      if (o.comp) {
        const c = p.comp;
        c.games++;
        if (win) c.wins++; else if (!draw) c.losses++;
        if (!c.placed) { if (c.games >= 5) { c.placed = true; c.sr = Math.max(1, Math.min(5000, Math.round(1500 + (c.wins - c.losses) * 180 + (Math.random() - 0.5) * 200))); } }
        else c.sr = Math.max(1, Math.min(5000, c.sr + (win ? 24 : draw ? 0 : -22) + Math.round((Math.random() - 0.5) * 8)));
        c.best = Math.max(c.best, c.sr);
      }
      Profile.save(p);
      return { xp, lines, levelFrom: lvl0, levelTo: p.level, ups, medals: med, win, draw, firstWin };
    },
    tier(sr) {
      const T = [[1500, 'Бронза', '#b0703a'], [2000, 'Серебро', '#c0c8d0'], [2500, 'Золото', '#e8c040'], [3000, 'Платина', '#a0e0e8'], [3500, 'Алмаз', '#80a8ff'], [4000, 'Мастер', '#f0b060'], [9999, 'Грандмастер', '#ffe890']];
      for (const t of T) if (sr < t[0]) return { name: t[1], col: t[2] };
      return { name: 'Грандмастер', col: '#ffe890' };
    }
  };
  O.Profile = Profile;

  function splat(x, col, seed) {
    const r = O.rng(seed);
    x.fillStyle = col;
    x.beginPath();
    for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, rr = 25 + r() * 6; x.lineTo(32 + Math.cos(a) * rr, 32 + Math.sin(a) * rr); }
    x.fill();
    for (let i = 0; i < 4; i++) { const dx = 16 + r() * 32; x.fillRect(dx, 50, 2.5, 6 + r() * 8); x.beginPath(); x.arc(dx + 1.2, 58 + r() * 5, 2, 0, Math.PI * 2); x.fill(); }
  }

  function stencil(x, por, main, seed) {
    const t = O.Tex.canvas(64, 64);
    if (!t) return;
    const tx = t.getContext('2d');
    tx.drawImage(por, 0, 0, 64, 64);
    const d = tx.getImageData(0, 0, 64, 64);
    const [mr, mg, mb] = O.rgb(parseInt(main.slice(1), 16)).map(v => v * 255);
    for (let i = 0; i < d.data.length; i += 4) {
      if (d.data[i + 3] < 90) { d.data[i + 3] = 0; continue; }
      const l = (d.data[i] * 0.3 + d.data[i + 1] * 0.59 + d.data[i + 2] * 0.11) / 255;
      const tone = l < 0.3 ? [26, 22, 34] : l < 0.62 ? [mr, mg, mb] : [255, 246, 226];
      d.data[i] = tone[0]; d.data[i + 1] = tone[1]; d.data[i + 2] = tone[2]; d.data[i + 3] = 255;
    }
    tx.putImageData(d, 0, 0);
    splat(x, 'rgba(20,18,28,0.85)', seed);
    x.drawImage(t, 4, 2, 56, 56);
  }

  function pixels(x, por, acc) {
    const t = O.Tex.canvas(16, 16);
    if (!t) return;
    const tx = t.getContext('2d');
    tx.drawImage(por, 0, 0, 16, 16);
    const d = tx.getImageData(0, 0, 16, 16).data;
    const on = (i, j) => i >= 0 && j >= 0 && i < 16 && j < 16 && d[(j * 16 + i) * 4 + 3] > 110;
    x.fillStyle = acc; x.fillRect(4, 4, 56, 56);
    x.fillStyle = '#1a1622';
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) if (!on(i, j) && (on(i - 1, j) || on(i + 1, j) || on(i, j - 1) || on(i, j + 1))) x.fillRect(4 + i * 3.5, 4 + j * 3.5, 3.5, 3.5);
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
      if (!on(i, j)) continue;
      const k = (j * 16 + i) * 4, q = v => Math.min(255, Math.round(v / 64) * 64 + 20);
      x.fillStyle = `rgb(${q(d[k])},${q(d[k + 1])},${q(d[k + 2])})`;
      x.fillRect(4 + i * 3.5, 4 + j * 3.5, 3.5, 3.5);
    }
  }

  O.sprayArt = function (hero, key, size, por) {
    const s = size || 64;
    const c = O.Tex.canvas(s, s);
    if (!c) return null;
    const x = c.getContext('2d');
    const def = O.HEROES[hero];
    const tint = O.HERO_TINT[hero] || [0xe07030, 0xf0c040];
    const col = n => '#' + n.toString(16).padStart(6, '0');
    const main = col(tint[0]), acc = col(tint[1]);
    const role = O.ROLES[def.role].color;
    x.clearRect(0, 0, s, s);
    const k = s / 64;
    x.save(); x.scale(k, k);
    if (key === 'face' && por) stencil(x, por, main, O.hash(hero + 'face'));
    else if (key === 'pixel' && por) pixels(x, por, acc);
    else if (key === 'logo') {
      x.fillStyle = '#f08a20'; x.beginPath(); x.arc(32, 32, 26, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(32, 32, 19, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#f08a20'; x.fillRect(28, 12, 8, 22); x.beginPath(); x.arc(32, 32, 12, 0.4, Math.PI - 0.4); x.lineWidth = 7; x.strokeStyle = '#f08a20'; x.stroke();
    } else if (key === 'face') {
      x.fillStyle = main; x.beginPath(); x.arc(32, 34, 24, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fff'; x.fillRect(20, 28, 8, 6); x.fillRect(36, 28, 8, 6);
      x.fillStyle = '#222'; x.fillRect(23, 29, 4, 4); x.fillRect(39, 29, 4, 4);
      x.strokeStyle = '#222'; x.lineWidth = 3; x.beginPath(); x.arc(32, 40, 8, 0.2, Math.PI - 0.2); x.stroke();
      x.fillStyle = acc; x.fillRect(12, 8, 40, 10);
    } else if (key === 'heart') {
      x.fillStyle = '#e83a5a'; x.beginPath(); x.moveTo(32, 54); x.bezierCurveTo(4, 34, 12, 8, 32, 22); x.bezierCurveTo(52, 8, 60, 34, 32, 54); x.fill();
      x.fillStyle = main; x.font = 'bold 14px Impact'; x.textAlign = 'center'; x.fillText(def.name.slice(0, 1), 32, 38);
    } else if (key === 'star') {
      x.fillStyle = acc; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 11 : 26; x.lineTo(32 + Math.cos(a) * r, 34 + Math.sin(a) * r); } x.fill();
      x.strokeStyle = main; x.lineWidth = 3; x.stroke();
    } else if (key === 'gg') {
      x.fillStyle = main; x.fillRect(4, 14, 56, 36);
      x.fillStyle = '#fff'; x.font = 'bold 30px Impact'; x.textAlign = 'center'; x.fillText('GG', 32, 44);
    } else if (key === 'skull') {
      x.fillStyle = '#f0f0e8'; x.beginPath(); x.arc(32, 28, 18, 0, Math.PI * 2); x.fill(); x.fillRect(22, 38, 20, 14);
      x.fillStyle = main; x.beginPath(); x.arc(25, 28, 5, 0, Math.PI * 2); x.arc(39, 28, 5, 0, Math.PI * 2); x.fill();
    } else if (key === 'role') {
      x.fillStyle = role; x.beginPath(); x.moveTo(32, 4); x.lineTo(58, 32); x.lineTo(32, 60); x.lineTo(6, 32); x.fill();
      x.fillStyle = '#fff'; x.font = 'bold 22px Impact'; x.textAlign = 'center'; x.fillText(def.name.slice(0, 2), 32, 40);
    } else if (key === 'pixel') {
      const r = O.rng(O.hash(hero + 'px'));
      for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 4; xx++) if (r() < 0.55) { x.fillStyle = r() < 0.6 ? main : acc; x.fillRect(8 + xx * 6, 8 + yy * 6, 6, 6); x.fillRect(50 - xx * 6, 8 + yy * 6, 6, 6); }
    } else {
      x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(0, 18, 64, 28);
      x.fillStyle = main; x.font = 'italic bold 15px Impact'; x.textAlign = 'center'; x.fillText(def.name, 32, 38);
    }
    x.restore();
    return c;
  };
})(globalThis.Ow98 = globalThis.Ow98 || {});
