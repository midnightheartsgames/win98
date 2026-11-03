(function (H) {
  'use strict';
  const P = H.Game.prototype, BP = H.Battle.prototype, T = H.TUNING;
  const TUN = { minLvl: 1, maxLvl: 150, maxRows: 5, maxWaves: 5, maxCycles: 300, logMax: 10, marks: 8, batchSteps: 4000, trialLvl: 80, stageW: 572, foe: 'reaver', sizes: { boss: 200, elite: 140, normal: 104 }, step: 0.8, inf: 1e6 };
  const TIERS = [['all', 'Все'], ['normal', 'Обычные'], ['elite', 'Элита'], ['boss', 'Боссы']];
  const KINDS = { win: 'Победа', left: 'Враг ушёл сам', lose: 'Поражение', limit: 'Предел циклов', abort: 'Прервано' };
  const LISTS = {
    hp: [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5, 10, 25, 50, 100],
    atk: [0, 0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 5, 10, 20],
    def: [0, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5]
  };
  const NUMS = { lvl: [TUN.minLvl, TUN.maxLvl, 1, 10], spd: [10, 300, 5, 25], tough: [10, 990, 10, 50], hpStart: [1, 100, 5, 1], res: [0, 100, 5, 5] };
  const FLAGS = ['immortal', 'noSummon', 'noFlee', 'noLife', 'barrier'];
  const BG = [['station', 'Станция'], ['station2', 'Станция, ангар'], ['snow', 'Снежные поля'], ['city', 'Белобог'], ['under', 'Подземье'], ['mine', 'Шахта'], ['rivet', 'Заклёпкоград'], ['ice', 'Коридор эха'], ['hill', 'Холм вечнозимья'], ['sim', 'Симулятор'], ['stellaron', 'Стелларон'], ['express', 'Экспресс'], ['memory', 'Зал забвения'], ['meadow', 'Луг Акселя']];
  const MUSIC = [['battle', 'Бой'], ['boss', 'Босс'], ['order', 'Порядок'], ['gepard', 'Гепард'], ['svarog', 'Сварог'], ['cocolia', 'Коколия'], ['doomsday', 'Судный день'], ['sim', 'Симулятор']];
  const COND = [
    { key: 'hp', label: 'HP команды', opts: [['full', '100%'], ['half', '50%'], ['quarter', '25%'], ['save', 'Как в сохранении']] },
    { key: 'energy', label: 'Энергия', opts: [[0, '0%'], [0.25, '25%'], [0.5, '50%'], [0.75, '75%'], [1, '100%'], ['save', 'Как в сохранении']], def: 0.5 },
    { key: 'sp', label: 'Очки навыка', opts: [0, 1, 2, 3, 4, 5].map(n => [n, String(n)]), def: T.spStart },
    { key: 'techs', label: 'Техники', opts: [[false, 'Нет'], [true, 'Все']] },
    { key: 'ambush', label: 'Первый ход', opts: [['', 'Обычный'], ['player', 'Удар первым'], ['enemy', 'Засада врага']] },
    { key: 'contact', label: 'Контакт', opts: [[true, 'Вкл'], [false, 'Выкл']] },
    { key: 'auto', label: 'Автобой', opts: [[false, 'Выкл'], [true, 'Вкл']] },
    { key: 'cine', label: 'Сцены', opts: [['game', 'Как в настройках'], ['off', 'Выкл']] },
    { key: 'cycles', label: 'Предел циклов', opts: [[0, 'Нет']].concat([1, 2, 3, 5, 8, 10, 15, 20, 30].map(n => [n, String(n)])) },
    { key: 'bg', label: 'Фон', opts: [['auto', 'Авто']].concat(BG) },
    { key: 'music', label: 'Музыка', opts: [['auto', 'Авто']].concat(MUSIC) }
  ];
  const DMG_KIND = { basic: 'basic', enhanced: 'basic', skill: 'skill', ult: 'ult', fusion: 'fusion', follow: 'extra', chain: 'extra', first: 'extra', summon: 'extra' };
  const DMG_KINDS = [['basic', 'Базовая', '#8ab4ff'], ['skill', 'Навык', '#5ad8ff'], ['ult', 'Абсолютная', '#ff7ad8'], ['fusion', 'Слияние', '#c88aff'], ['extra', 'Доп. атаки', '#6aff9a'], ['dot', 'Периодический', '#ffb04a'], ['break', 'Пробитие', '#ffd471'], ['other', 'Прочее', '#8a7aaa']];
  const BREAK_LABELS = ['Пробитие', 'Спираль'];
  const EDIT_LABEL = 'Правка';
  const hashOf = str => { let h = 5381; for (let i = 0; i < str.length; i++) h = (h * 33 + str.charCodeAt(i)) >>> 0; return h.toString(36); };
  const HACKS = [
    { key: 'immortal', label: 'Бессмертная команда', text: 'Герой не падает ниже 1 HP. Таланты воскрешения при этом не срабатывают.' },
    { key: 'sp', label: 'Бесконечные очки навыка', text: 'В начале каждого хода очки навыка на максимуме.' },
    { key: 'energy', label: 'Всегда полная энергия', text: 'В начале каждого хода абсолютная техника готова.' },
    { key: 'intent', label: 'Намерения врагов', text: 'Над врагом виден следующий навык. У врагов с весами случайности идут в другом порядке.' }
  ];
  const QUIPS = {
    zero: ['0 урона. Ты точно нажимал{|а} кнопки?'],
    hack: ['С такими галочками и я бы справилась. В таблицу не пишу.'],
    win: ['Легко. Подними ему уровень, пока никто не смотрит.', 'Цель зачищена. Можно было и быстрее.', 'Запиши сид, вдруг больше так не повезёт.'],
    left: ['Он ушёл сам. Это не победа, это расписание.', 'Убежал. Попробуй выключить ему выход.'],
    lose: ['Game over. Continue? Enter.', 'Это был честный бой. Ну, почти.', 'Хочешь, поправлю ему одну цифру? Можешь и сам{|а}.'],
    limit: ['Время вышло. Смотри на урон за цикл, остальное декорации.', 'Манекен жалоб не подавал.'],
    abort: ['Вышел{|ла} посреди матча. Я видела.']
  };
  const TIPS = [
    [o => o.lvl >= 120, 'Сто двадцатый уровень и выше? Смело.'],
    [o => o.act === 'idle', 'Манекен терпит. Он для этого и стоит.'],
    [o => o.hp >= 50, 'Столько HP? Я бы взяла предел циклов.'],
    [o => o.atk === 0, 'Атака ноль, но по единичке он всё равно бьёт.']
  ];
  const isTrial = k => String(k).startsWith('trial:');
  const clamp = H.clamp;

  const tierOf = d => (d.boss ? 'boss' : d.elite ? 'elite' : 'normal');
  const nameOf = d => d.name + (d.phase2 ? ' · 2-я форма' : d.lifespan ? ' · клон' : '');
  const widthOf = ids => ids.reduce((a, id) => a + TUN.sizes[tierOf(H.ENEMIES[id])] * TUN.step, 0);
  const layout = (ids, W) => {
    const total = widthOf(ids);
    let x = W / 2 + 34 - total / 2;
    return ids.map(id => { const s = TUN.sizes[tierOf(H.ENEMIES[id])], at = { x: x + s * 0.4, s }; x += s * TUN.step; return at; });
  };
  const cycleOf = clock => (clock < H.FH.TUN.firstCycle ? 1 : 2 + Math.floor((clock - H.FH.TUN.firstCycle) / H.FH.TUN.cycle));
  const lvlOf = v => clamp(Math.round(+v) || TUN.minLvl, TUN.minLvl, TUN.maxLvl);

  const defaultOf = (o, key) => {
    const d = H.ENEMIES[o.id];
    if (key === 'spd') return d.spd;
    if (key === 'tough') return d.tough;
    if (key === 'hpStart') return 100;
    if (key === 'res') return Math.round(100 * (d.boss ? 0.3 : T.enemyEffectRes));
    return 1;
  };
  const valueOf = (o, key) => (o[key] == null ? defaultOf(o, key) : o[key]);
  const setValue = (o, key, v) => {
    if (key === 'lvl') { o.lvl = lvlOf(v); return; }
    if (v === defaultOf(o, key)) delete o[key]; else o[key] = v;
  };
  const stepList = (list, v, d) => {
    let i = list.indexOf(v);
    if (i < 0) i = list.findIndex(x => x >= v);
    if (i < 0) i = list.length - 1;
    return list[clamp(i + d, 0, list.length - 1)];
  };

  const actsOf = d => {
    const out = ['game', 'idle'];
    (d.skills || []).forEach((s, i) => out.push('skill:' + i));
    if (d.pat) for (let k = 1; k < d.pat.length; k++) out.push('step:' + k);
    return out;
  };
  const actName = (d, act) => {
    const [kind, n] = String(act || 'game').split(':');
    if (kind === 'idle') return 'Манекен';
    if (kind === 'skill') return 'Только: ' + d.skills[+n].n;
    if (kind === 'step') return 'С шага ' + (+n + 1) + ': ' + d.skills[d.pat[+n]].n;
    return 'Как в игре';
  };
  const mechsOf = d => {
    const out = [];
    if ((d.skills || []).some(s => s.t === 'summon')) out.push({ key: 'noSummon', label: 'Призывы', on: 'Выкл', off: 'Вкл' });
    if (d.flee) out.push({ key: 'noFlee', label: 'Побег', on: 'Выкл', off: 'Вкл' });
    if (d.lifespan) out.push({ key: 'noLife', label: 'Срок жизни', on: 'Выкл', off: 'Вкл' });
    if (d.proto) out.push({ key: 'barrier', label: 'Барьер', on: 'Как в сюжете', off: 'Снят' });
    return out;
  };
  const cleanElems = list => (Array.isArray(list) ? [...new Set(list.filter(e => H.ELEMENTS[e]))] : null);
  const shortOf = d => (d.name.includes(':') ? d.name.split(':').pop().trim() : d.name.split(',')[0]);
  const idOf = s => String(s).split(':')[0];
  const mulText = v => '×' + String(v).replace('.', ',');
  const pct = v => Math.round(v * 100) + '%';

  const TARGET = { single: 'одна цель', blast: 'цель и соседи', all: 'все', self: 'на себя', lock: 'захват цели', rally: 'приказ: атака +20%', charge: 'заряд', summon: 'призыв', havoc: 'опустошение' };
  const fxText = f => {
    if (f.k === 'freeze') return 'заморозка ' + pct(f.chance);
    if (f.k === 'dot') return H.DOT_NAME[f.type].toLowerCase() + ' ' + pct(f.chance);
    if (f.k === 'debuff') return f.name.toLowerCase() + ' ' + pct(f.chance);
    if (f.k === 'shieldSelf') return 'щит ' + pct(f.m) + ' HP';
    if (f.k === 'delay') return 'задержка';
    if (f.k === 'spDrain') return 'минус очко навыка';
    if (f.k === 'healSelf') return 'лечение ' + pct(f.m);
    if (f.k === 'multiply') return 'размножение';
    if (f.k === 'swallow') return 'проглатывает';
    return '';
  };
  const skillText = (s, d) => {
    const bits = [TARGET[s.t] || s.t];
    if (s.m) bits.push(mulText(s.m));
    if (s.e) bits.push(H.ELEMENTS[s.e].short);
    if (s.splash) bits.push('соседи ' + mulText(s.splash));
    if (s.lockBonus) bits.push('по цели захвата ' + mulText(s.lockBonus));
    if (s.summon) bits.push([...new Set(s.summon)].map(id => shortOf(H.ENEMIES[id])).join(', '));
    if (s.next != null) bits.push('затем ' + d.skills[s.next].n);
    for (const f of s.fx || []) { const t = fxText(f); if (t) bits.push(t); }
    if (s.self === 'die') bits.push('погибает сам');
    return s.n + ': ' + bits.join(', ');
  };
  const orderText = d => {
    if (d.pat) return 'Порядок: ' + d.pat.map(i => d.skills[i].n).join(' → ') + ' → ...';
    const top = (d.skills || []).filter(s => s.w > 0).sort((a, b) => b.w - a.w)[0];
    return top && d.skills.filter(s => s.w > 0).length > 1 ? 'Случайно, чаще: ' + top.n : '';
  };

  const SET_GROUPS = [['boss', 'Боссы'], ['plain', 'Обычные бои'], ['echo', 'Эхо войны'], ['shadow', 'Застойные тени']];
  let setsCache = null;
  function buildSets() {
    const out = [], leadOf = ids => ids.find(id => H.ENEMIES[id].boss) || ids.find(id => H.ENEMIES[id].elite) || ids[0];
    const add = o => {
      const ids = o.waves.flat().map(idOf), lead = leadOf(ids), other = [...new Set(ids)].filter(id => H.ENEMIES[id].name !== H.ENEMIES[lead].name);
      const at = o.waves.flat().find(s => idOf(s) === lead);
      out.push(Object.assign(o, { lead, lvl: +String(at).split(':')[1] || 1, label: o.label || H.ENEMIES[lead].name + (other.length ? ' + ' + shortOf(H.ENEMIES[other[0]]) : '') }));
    };
    for (const [id, e] of Object.entries(H.ENCOUNTERS)) {
      const dropped = [];
      if (e.endAt) dropped.push('Сюжетный конец на ' + pct(e.endAt) + ' HP убран');
      if (e.trials) dropped.push('Сюжетные герои убраны, отряд ваш');
      if (e.ward) dropped.push('Клетка Аквы убрана');
      add({ id, group: e.boss ? 'boss' : 'plain', waves: (e.waves || [e.enemies]).map(w => w.map(String)), bg: e.bg, music: e.music, field: e.field || null, allyBuff: e.allyBuff || null, hpStart: e.hpStart || 0, dropped });
    }
    const top = H.CALYX_TIERS[H.CALYX_TIERS.length - 1].lvl, lv = id => id + ':' + (top + (H.ENEMIES[id].boss ? 2 : 0));
    for (const c of H.CALYX) {
      if (!c.boss) continue;
      add({ id: c.id, group: c.reward === 'echo' ? 'echo' : 'shadow', label: c.name, waves: c.waves ? c.waves.map(w => w.map(lv)) : [[c.boss].concat(c.adds || []).map(lv)], bg: 'sim', music: c.music, field: null, allyBuff: null, hpStart: 0, dropped: [] });
    }
    return out.sort((a, b) => a.lvl - b.lvl);
  }
  const setsAll = () => setsCache || (setsCache = buildSets());
  const labelOf = waves => {
    const rows = waves.flat(), lead = rows.find(o => H.ENEMIES[o.id] && H.ENEMIES[o.id].boss) || rows[0];
    if (!lead || !H.ENEMIES[lead.id]) return 'Пусто';
    const n = waves.filter(w => w.length).length;
    return shortOf(H.ENEMIES[lead.id]) + ' ' + lead.lvl + ' ур.' + (rows.length > 1 ? ' +' + (rows.length - 1) : '') + (n > 1 ? ', волн ' + n : '');
  };

  function cleanRow(src) {
    const d = H.ENEMIES[src.id], o = { id: src.id, lvl: lvlOf(src.lvl) };
    for (const key of Object.keys(LISTS)) if (LISTS[key].includes(src[key]) && src[key] !== 1) o[key] = src[key];
    for (const key of ['spd', 'hpStart', 'res']) {
      const [lo, hi] = NUMS[key];
      if (Number.isFinite(src[key])) setValue(o, key, clamp(Math.round(src[key]), lo, hi));
    }
    if (src.tough === TUN.inf) o.tough = TUN.inf;
    else if (Number.isFinite(src.tough)) setValue(o, 'tough', clamp(Math.round(src.tough), NUMS.tough[0], NUMS.tough[1]));
    const weak = cleanElems(src.weak), resist = cleanElems(src.resist);
    if (weak && resist) { o.weak = weak; o.resist = resist.filter(e => !weak.includes(e)); }
    if (actsOf(d).includes(src.act) && src.act !== 'game') o.act = src.act;
    for (const f of FLAGS) if (src[f] === true) o[f] = true;
    return o;
  }

  Object.assign(P, {
    range() {
      const s = this.state;
      if (!s.range || typeof s.range !== 'object') s.range = {};
      if (this.rangeSeen !== s.range) { this.rangeSeen = s.range; this.rangeFix(); }
      return s.range;
    },

    rangeFix() {
      const s = this.state, R = s.range;
      R.v = 1;
      R.own = (Array.isArray(R.own) ? R.own : []).filter(k => this.rangeValid(k)).slice(0, 4);
      R.trialLvl = clamp(Math.round(+R.trialLvl) || TUN.trialLvl, 1, H.MAX_LVL);
      R.marks = Array.from({ length: TUN.marks }, (_, i) => { const m = (Array.isArray(R.marks) ? R.marks : [])[i]; return m && m.setup && m.label ? m : null; });
      const team = R.team && typeof R.team === 'object' ? R.team : {};
      R.team = team.own ? { own: true } : { squad: Number.isInteger(team.squad) && team.squad >= 0 && team.squad < H.SQUADS ? team.squad : this.rangeFullest() };
      const waves = Array.isArray(R.waves) ? R.waves : [];
      R.waves = waves.filter(Array.isArray).slice(0, TUN.maxWaves).map(w => w.filter(o => o && H.ENEMIES[o.id]).slice(0, TUN.maxRows).map(cleanRow));
      if (!R.waves.some(w => w.length)) R.waves = [[{ id: TUN.foe, lvl: this.rangeTeamLvl() }]];
      R.wave = Number.isInteger(R.wave) ? clamp(R.wave, 0, R.waves.length - 1) : 0;
      const C = R.cond && typeof R.cond === 'object' ? R.cond : {}, out = {};
      for (const f of COND) out[f.key] = f.opts.some(([v]) => v === C[f.key]) ? C[f.key] : f.def !== undefined ? f.def : f.opts[0][0];
      out.seed = Number.isInteger(C.seed) && C.seed > 0 ? C.seed : 0;
      R.cond = out;
      const hk = R.hack && typeof R.hack === 'object' ? R.hack : {};
      R.hack = {};
      for (const f of HACKS) R.hack[f.key] = hk[f.key] === true;
      R.log = (Array.isArray(R.log) ? R.log : []).filter(o => o && o.key && o.setup).slice(0, TUN.logMax);
      R.extra = R.extra && setsAll().some(x => x.id === R.extra.set && (x.field || x.allyBuff)) ? { set: R.extra.set } : {};
      this.rangeClear();
    },

    rangeFullest() {
      let best = this.state.squad || 0;
      for (let i = H.SQUADS - 1; i >= 0; i--) if (this.squadOf(i).length >= this.squadOf(best).length) best = i;
      return best;
    },

    rangeValid(k) {
      return isTrial(k) ? !!H.CHARS[k.slice(6)] : !!this.state.roster[k];
    },

    rangeMembers() {
      const R = this.state.range;
      return (R.team.own ? R.own : this.squadOf(R.team.squad)).filter(k => this.rangeValid(k)).slice(0, 4);
    },

    rangeKeys() {
      this.range();
      const keys = this.rangeMembers();
      return keys.length ? keys : ['trail'];
    },

    rangeKit(k) {
      return isTrial(k) ? k.slice(6) : this.kitOf(k);
    },

    rangeHeroLvl(k) {
      return isTrial(k) ? this.state.range.trialLvl || TUN.trialLvl : this.state.roster[k].lvl;
    },

    rangeTeamLvl() {
      const keys = this.rangeMembers(), list = keys.length ? keys : ['trail'];
      return lvlOf(list.reduce((a, k) => a + this.rangeHeroLvl(k), 0) / list.length);
    },

    rangeTrialIds() {
      const s = this.state;
      return Object.keys(H.CHARS).filter(id => !id.startsWith('trail') && !s.roster[id] && !(H.labOnly && H.labOnly(id)));
    },

    rangeTrialLvl(d, big) {
      const R = this.range();
      R.trialLvl = clamp(R.trialLvl + d * (big ? 10 : 1), 1, H.MAX_LVL);
      return R.trialLvl;
    },

    rangeFoes(tier) {
      const order = { boss: 0, elite: 1, normal: 2 };
      return Object.keys(H.ENEMIES).filter(id => !tier || tier === 'all' || tierOf(H.ENEMIES[id]) === tier).sort((a, b) => order[tierOf(H.ENEMIES[a])] - order[tierOf(H.ENEMIES[b])]);
    },

    rangeRows() {
      const R = this.range();
      return R.waves[R.wave];
    },

    rangeCanPut(id, row) {
      const rows = this.rangeRows(), ids = rows.map(o => o.id);
      if (row >= rows.length && rows.length >= TUN.maxRows) return false;
      if (row < rows.length) ids[row] = id; else ids.push(id);
      return widthOf(ids) <= TUN.stageW;
    },

    rangePut(id, row) {
      if (!H.ENEMIES[id] || !this.rangeCanPut(id, row)) return false;
      const rows = this.rangeRows();
      if (row < rows.length) { rows[row] = { id, lvl: rows[row].lvl }; return true; }
      rows.push({ id, lvl: rows.length ? rows[rows.length - 1].lvl : this.rangeTeamLvl() });
      return true;
    },

    rangeMark() {
      const R = this.range();
      this.rangePrev = JSON.stringify({ waves: R.waves, wave: R.wave, extra: R.extra, bg: R.cond.bg, music: R.cond.music });
    },

    rangeUndo() {
      if (!this.rangePrev) return false;
      const was = JSON.parse(this.rangePrev), R = this.range();
      this.rangeMark();
      R.waves = was.waves;
      R.wave = was.wave;
      R.extra = was.extra;
      R.cond.bg = was.bg;
      R.cond.music = was.music;
      return true;
    },

    rangeSets(group) {
      return setsAll().filter(x => !group || x.group === group);
    },

    rangeLoadSet(id) {
      const x = setsAll().find(o => o.id === id);
      if (!x) return false;
      this.rangeMark();
      const R = this.range();
      R.waves = x.waves.map(w => w.map(s => ({ id: idOf(s), lvl: lvlOf(String(s).split(':')[1]) })));
      if (x.hpStart) R.waves[0][0].hpStart = Math.round(x.hpStart * 100);
      R.wave = 0;
      R.extra = x.field || x.allyBuff ? { set: x.id } : {};
      R.cond.bg = BG.some(([b]) => b === x.bg) ? x.bg : 'auto';
      R.cond.music = MUSIC.some(([m]) => m === x.music) ? x.music : 'auto';
      return true;
    },

    rangeExtra() {
      const id = this.range().extra.set;
      return id ? setsAll().find(o => o.id === id) || null : null;
    },

    rangeOrigin(id) {
      const out = [], put = t => { if (!out.includes(t)) out.push(t); };
      for (const m of Object.values(H.MAPS)) if (Object.values(m.enemies || {}).some(g => (g.g || []).includes(id))) put(String(m.name).split(': ').pop());
      const maps = out.splice(0, 2);
      out.push(...maps);
      if (Object.values(H.ENCOUNTERS).some(e => (e.waves || [e.enemies || []]).flat().some(s => idOf(s) === id))) put('Сюжетный бой');
      for (const c of H.CALYX) {
        if ((c.pool || []).concat(c.elite || [], c.boss || [], c.adds || [], (c.waves || []).flat()).includes(id)) put(c.reward === 'echo' ? 'Эхо войны' : c.boss ? 'Застойная тень' : c.elite ? 'Пещера коррозии' : 'Чашелист');
      }
      if (!out.length && H.PF && H.PF.poolIds().has(id)) put('Чистый вымысел');
      const called = !out.length && (Object.values(H.ENEMIES).some(d => (d.skills || []).some(s => s.summon && s.summon.includes(id))) || Object.values(H.ENCOUNTERS).some(e => e.lf && e.lf.deerPhase && e.lf.deerPhase.adds.includes(id)));
      return { text: out.length ? out.join(', ') : called ? 'Только как призыв' : 'Только в Валютных войнах', cwOnly: !out.length && !called };
    },

    rangeDossier(id, lvl) {
      const key = id + '|' + lvl + '|' + JSON.stringify(this.range().team);
      if (!this.rangeDos || this.rangeDos.team !== JSON.stringify(this.range().team)) this.rangeDos = { team: JSON.stringify(this.range().team), map: new Map() };
      if (this.rangeDos.map.has(key)) return this.rangeDos.map.get(key);
      const d = H.ENEMIES[id], row = { id, lvl };
      const u = new H.Battle({ party: this.rangeSpecs(this.rangeKeys()), seed: 1, waves: [[id + ':' + lvl]], lvl, range: { waves: [[row]], cycles: 1, hack: {} } }).enemies[0];
      const origin = this.rangeOrigin(id), notes = [];
      if (d.proto) notes.push('В сюжете урон без Аквы не проходит. Здесь барьер снят, настройка в строке.');
      if (d.lifespan) notes.push('Через ' + d.lifespan + ' ходов рассыпается: бой кончится итогом «Враг ушёл сам».');
      if (d.flee) notes.push('Через ' + d.flee + ' хода убегает: бой кончится итогом «Враг ушёл сам».');
      if ((d.skills || []).some(s => s.self === 'die')) notes.push('Может взорваться сам.');
      if (d.phase2) notes.push('Вторая форма: в игре выходит второй волной Эха войны. Смотрите вкладку «Встречи».');
      if (d.havoc) notes.push('«Опустошение» работает только рядом с врагом, который держит цель.');
      if (origin.cwOnly) notes.push('Особые фазы работают только в Валютных войнах, здесь обычные навыки.');
      const info = { hp: u.maxHp, atk: Math.round(u.base.atk), def: Math.round(u.base.def), spd: u.base.spd, tough: u.maxTough, res: Math.round(u.base.res * 100), origin: origin.text, skills: (d.skills || []).map(s => skillText(s, d)), order: orderText(d), notes, contact: !d.noContact, known: !!this.state.bank.enemies[id] };
      this.rangeDos.map.set(key, info);
      return info;
    },

    rangeRemove(row) {
      const rows = this.rangeRows();
      if (row < 0 || row >= rows.length) return false;
      this.rangeMark();
      rows.splice(row, 1);
      return true;
    },

    rangeCopy(row) {
      const rows = this.rangeRows(), o = rows[row];
      if (!o || !this.rangeCanPut(o.id, rows.length)) return false;
      rows.splice(row + 1, 0, JSON.parse(JSON.stringify(o)));
      return true;
    },

    rangeReset(row) {
      const rows = this.rangeRows(), o = rows[row];
      if (!o) return false;
      this.rangeMark();
      rows[row] = { id: o.id, lvl: o.lvl };
      return true;
    },

    rangeDummy(row) {
      const o = this.rangeRows()[row];
      if (!o) return false;
      o.act = 'idle';
      o.immortal = true;
      return true;
    },

    rangeLevel(row, v) {
      const o = this.rangeRows()[row];
      if (!o) return false;
      o.lvl = lvlOf(v);
      return true;
    },

    rangeStep(row, key, d, big) {
      const o = this.rangeRows()[row];
      if (!o) return false;
      if (LISTS[key]) { setValue(o, key, stepList(LISTS[key], valueOf(o, key), d)); return true; }
      const [lo, hi, step, wide] = NUMS[key], by = big ? wide : step, cur = valueOf(o, key);
      if (key === 'tough' && cur === TUN.inf) { if (d < 0) o.tough = hi; return true; }
      if (key === 'tough' && d > 0 && cur >= hi) { o.tough = TUN.inf; return true; }
      setValue(o, key, clamp(cur + d * by, lo, hi));
      return true;
    },

    rangeType(row, key, v) {
      const o = this.rangeRows()[row];
      if (!o || !NUMS[key]) return false;
      setValue(o, key, clamp(Math.round(v), NUMS[key][0], NUMS[key][1]));
      return true;
    },

    rangeClearField(row, key) {
      const o = this.rangeRows()[row];
      if (!o) return false;
      if (key === 'lvl') o.lvl = this.rangeTeamLvl(); else delete o[key];
      return true;
    },

    rangeToggle(row, key) {
      const o = this.rangeRows()[row];
      if (!o || !FLAGS.includes(key)) return false;
      if (o[key]) delete o[key]; else o[key] = true;
      return true;
    },

    rangeActStep(row, d) {
      const o = this.rangeRows()[row];
      if (!o) return false;
      const list = actsOf(H.ENEMIES[o.id]), i = Math.max(0, list.indexOf(o.act || 'game')), next = list[(i + d + list.length) % list.length];
      if (next === 'game') delete o.act; else o.act = next;
      return true;
    },

    rangeElem(o, e) {
      const d = H.ENEMIES[o.id], weak = o.weak || d.weak, resist = o.resist || d.resist || [];
      return weak.includes(e) ? 'weak' : resist.includes(e) ? 'resist' : 'normal';
    },

    rangeElemStep(row, e, by) {
      const o = this.rangeRows()[row];
      if (!o || !H.ELEMENTS[e]) return false;
      const d = H.ENEMIES[o.id], order = ['normal', 'weak', 'resist'], cur = this.rangeElem(o, e), next = order[(order.indexOf(cur) + by + 3) % 3];
      const weak = (o.weak || d.weak).filter(x => x !== e), resist = (o.resist || d.resist || []).filter(x => x !== e);
      if (next === 'weak') weak.push(e);
      if (next === 'resist') resist.push(e);
      const same = (a, b) => a.length === b.length && a.every(x => b.includes(x));
      if (same(weak, d.weak) && same(resist, d.resist || [])) { delete o.weak; delete o.resist; } else { o.weak = weak; o.resist = resist; }
      return true;
    },

    rangeWave(i) {
      const R = this.range();
      if (i < 0 || i >= R.waves.length) return false;
      R.wave = i;
      return true;
    },

    rangeAddWave() {
      const R = this.range();
      if (R.waves.length >= TUN.maxWaves) return false;
      R.waves.push([]);
      R.wave = R.waves.length - 1;
      return true;
    },

    rangeDropWave(i) {
      const R = this.range();
      if (R.waves.length < 2 || i < 0 || i >= R.waves.length) return false;
      this.rangeMark();
      R.waves.splice(i, 1);
      R.wave = clamp(R.wave, 0, R.waves.length - 1);
      return true;
    },

    rangeSquadStep(d) {
      const R = this.range(), from = R.team.own ? this.rangeFullest() : R.team.squad;
      for (let n = 1; n <= H.SQUADS; n++) {
        const i = (from + d * n + H.SQUADS * n) % H.SQUADS;
        if (this.squadOf(i).length) { R.team = { squad: i }; return i; }
      }
      return from;
    },

    rangeUseSquad(i) {
      if (!this.squadOf(i).length) return false;
      this.range().team = { squad: i };
      return true;
    },

    rangeUseOwn() {
      const R = this.range();
      if (!R.own.length) return false;
      R.team = { own: true };
      return true;
    },

    rangeOwnToggle(key) {
      const R = this.range(), i = R.own.indexOf(key);
      if (i >= 0) { R.own.splice(i, 1); return true; }
      if (R.own.length >= 4 || !this.rangeValid(key)) return false;
      R.own.push(key);
      return true;
    },

    rangeCondStep(key, d) {
      const C = this.range().cond, f = COND.find(x => x.key === key);
      if (!f) return false;
      const i = Math.max(0, f.opts.findIndex(([v]) => v === C[key]));
      C[key] = f.opts[(i + d + f.opts.length) % f.opts.length][0];
      return true;
    },

    rangeCondText(key) {
      const f = COND.find(x => x.key === key), v = this.range().cond[key], at = f.opts.find(([x]) => x === v);
      return at ? at[1] : '';
    },

    rangeSeedStep(d) {
      const C = this.range().cond;
      C.seed = C.seed ? Math.max(0, C.seed + d) : this.rangeLastSeed || 1;
      return C.seed;
    },

    rangeReady() {
      return this.range().waves.some(w => w.length);
    },

    rangeSpecs(keys) {
      const s = this.state, R = this.range(), C = R.cond, own = new Map(this.fhSpecs(keys.filter(k => !isTrial(k))).map(p => [p.key, p]));
      const specs = keys.map(k => {
        if (!isTrial(k)) return own.get(k);
        const t = k.slice(6), st = this.baseStats(t, R.trialLvl, 0);
        return { key: k, charId: t, lvl: R.trialLvl, stats: st, hp: st.hp, energy: 0, trial: true, tr: this.traceTrialSpec ? this.traceTrialSpec(t, R.trialLvl) : null, eid: 0 };
      });
      for (const p of specs) {
        const r = s.roster[p.key], maxEn = H.CHARS[p.charId].energy;
        p.hp = C.hp === 'half' ? Math.round(p.stats.hp * 0.5) : C.hp === 'quarter' ? Math.round(p.stats.hp * 0.25) : C.hp === 'save' && r && r.hp != null ? Math.min(r.hp, p.stats.hp) : p.stats.hp;
        p.energy = C.energy === 'save' ? (r ? r.energy || 0 : Math.round(maxEn / 2)) : Math.round(maxEn * C.energy);
      }
      if (specs.every(p => p.hp <= 0)) for (const p of specs) p.hp = p.stats.hp;
      return specs;
    },

    rangeOpts(seed) {
      const R = this.range(), party = this.rangeSpecs(this.rangeKeys()), C = R.cond, extra = this.rangeExtra();
      const waves = R.waves.filter(w => w.length);
      return {
        party, seed,
        waves: waves.map(w => w.map(o => o.id + ':' + o.lvl)), lvl: waves[0][0].lvl,
        boss: waves.some(w => w.some(o => H.ENEMIES[o.id].boss)), noFlee: false,
        ambush: C.ambush || null, leader: 0, sp: C.sp,
        techs: C.techs ? party.map(p => ({ charId: p.charId, fx: H.CHARS[p.charId].tech.fx })) : [],
        nextAtk: 0, nextCrit: 0, rumorKind: !!this.state.flags.rumor_kind, noContact: !C.contact,
        su: null, foeHp: 1, foeAtk: 1, fh: null, endAt: 0, hpStart: 0, allyBuff: extra ? extra.allyBuff : null, field: extra ? extra.field : null,
        range: { waves, cycles: C.cycles || TUN.maxCycles, hack: Object.assign({}, R.hack) }
      };
    },

    rangeLook(ids, boss) {
      const C = this.range().cond;
      const lead = ids.find(id => H.ENEMIES[id].boss) || ids.find(id => H.ENEMIES[id].elite) || ids[0];
      const has = e => (e.waves || [e.enemies || []]).flat().some(s => String(s).split(':')[0] === lead);
      const enc = lead ? Object.values(H.ENCOUNTERS).find(has) : null;
      return { bg: C.bg !== 'auto' ? C.bg : (enc && enc.bg) || 'sim', music: C.music !== 'auto' ? C.music : (enc && enc.music) || (boss ? 'boss' : 'battle') };
    },

    rangeClear() {
      this.rangeCache = null;
    },

    rangePreview() {
      const R = this.range(), key = JSON.stringify([R.waves, R.team, R.own, R.cond.hp]);
      if (this.rangeCache && this.rangeCache.key === key) return this.rangeCache.rows;
      const rows = R.waves.map(() => []);
      if (this.rangeReady()) {
        const b = new H.Battle(this.rangeOpts(1));
        let k = 0;
        R.waves.forEach((w, i) => {
          if (!w.length) return;
          if (k > 0) { b.wave = k; b.spawnWave(true); }
          rows[i] = b.enemies.map(u => ({ hp: u.maxHp, start: u.hp, atk: Math.round(u.base.atk), def: Math.round(u.base.def), spd: u.base.spd, tough: u.maxTough, res: u.base.res }));
          k++;
        });
      }
      this.rangeCache = { key, rows };
      return rows;
    },

    rangeFight(seed) {
      if (!this.rangeReady()) return null;
      const C = this.range().cond, used = seed || C.seed || Math.floor(Math.random() * 1e9) + 1, opts = this.rangeOpts(used);
      const look = this.rangeLook(opts.waves.flat().map(s => s.split(':')[0]), opts.boss);
      this.rangeLastSeed = used;
      this.battle = new H.Battle(opts);
      this.rangeAttach(this.battle, used);
      this.battleCtx = { o: { range: true }, enc: null, encId: null, ent: null, bg: look.bg, music: look.music, fromScript: false, calyx: null, opts };
      this.emit({ t: 'battle', bg: look.bg, music: look.music, boss: opts.boss });
      return this.battle;
    },

    rangeSetupKey() {
      const R = this.range(), C = R.cond;
      return hashOf(JSON.stringify([R.waves.filter(w => w.length), R.extra.set || '', this.rangeKeys(), R.trialLvl, C.hp, C.energy, C.sp, C.techs, C.ambush, C.contact, C.cycles]));
    },

    rangeSnapshot() {
      const R = this.range();
      return JSON.parse(JSON.stringify({ waves: R.waves, team: R.team, own: R.own, trialLvl: R.trialLvl, extra: R.extra, cond: R.cond, hack: R.hack }));
    },

    rangeApply(setup) {
      const R = this.range();
      this.rangeMark();
      Object.assign(R, JSON.parse(JSON.stringify(setup)));
      R.wave = 0;
      this.rangeFix();
    },

    rangeAttach(b, seed, light) {
      const R = this.range();
      const st = b.rangeStat = { seed, key: light ? '' : this.rangeSetupKey(), setup: light ? null : this.rangeSnapshot(), hacked: HACKS.some(f => R.hack[f.key]), total: 0, taken: 0, breaks: 0, turns: 0, downs: 0, firstBreak: 0, selfKills: 0, edited: false, heroes: new Map(), foes: new Map(), act: null };
      const hero = u => {
        const o = u.owner || u;
        if (!st.heroes.has(o)) st.heroes.set(o, { id: o.charId || o.id, name: o.name, dmg: 0, kinds: {}, max: 0, crits: 0, hits: 0, heal: 0, taken: 0, turns: 0, ults: 0, down: 0 });
        return st.heroes.get(o);
      };
      const foe = u => {
        if (!st.foes.has(u.id)) st.foes.set(u.id, { id: u.id, name: u.name, taken: 0, breaks: 0, kills: 0, acts: [] });
        return st.foes.get(u.id);
      };
      for (const a of b.allies) hero(a);
      const push = b.push.bind(b);
      b.push = e => {
        if (e.t === 'act') {
          st.act = { u: e.u, kind: e.kind };
          if (e.u.side === 'enemy') foe(e.u).acts.push(e.name);
          else if (e.kind === 'ult') hero(e.u).ults++;
        } else if (e.t === 'turn' && e.u && e.u.side === 'ally') {
          st.turns++;
          hero(e.u).turns++;
        } else if (e.t === 'dmg' && e.label !== EDIT_LABEL) {
          if (e.src && e.src.side === 'ally' && e.u.side === 'enemy') {
            const h = hero(e.src), acting = st.act && (st.act.u === e.src || st.act.u === e.src.owner);
            const kind = BREAK_LABELS.includes(e.label) ? 'break' : e.dot ? 'dot' : acting ? DMG_KIND[st.act.kind] || 'other' : st.act ? 'extra' : 'other';
            st.total += e.v;
            h.dmg += e.v;
            h.kinds[kind] = (h.kinds[kind] || 0) + e.v;
            if (!e.dot) { h.hits++; if (e.crit) h.crits++; h.max = Math.max(h.max, e.v); }
            foe(e.u).taken += e.v;
          } else if (e.u.side === 'ally') {
            st.taken += e.v;
            hero(e.u).taken += e.v;
          }
        } else if (e.t === 'heal' && e.v > 0 && st.act && st.act.u.side === 'ally' && e.u.side === 'ally') hero(st.act.u).heal += e.v;
        else if (e.t === 'break') {
          st.breaks++;
          foe(e.u).breaks++;
          if (!st.firstBreak) st.firstBreak = cycleOf(b.clock || 0);
        } else if (e.t === 'kill') {
          if (e.u.side === 'ally') { st.downs++; hero(e.u).down++; }
          else {
            foe(e.u).kills++;
            if (st.act && st.act.u === e.u) st.selfKills++;
          }
        }
        return push(e);
      };
    },

    rangeKind(b) {
      const r = b.result;
      if (r.fled) return 'abort';
      if (b.rangeStop) return 'limit';
      if (!r.win) return 'lose';
      return b.enemies.some(u => u.gone && !u.dead) ? 'left' : 'win';
    },

    rangeReportOf(b) {
      const st = b.rangeStat, kind = this.rangeKind(b);
      const cycles = Math.min(cycleOf(b.clock || 0), b.opts.range.cycles), total = Math.round(st.total), perCycle = Math.round(total / cycles);
      return { kind, name: KINDS[kind], cycles, total, perCycle, breaks: st.breaks, taken: Math.round(st.taken), downs: st.downs, turns: st.turns, firstBreak: st.firstBreak, selfKills: st.selfKills, edited: st.edited, hacked: st.hacked, seed: st.seed, wave: b.wave + 1, waves: b.waves.length, heroes: [...st.heroes.values()].sort((x, y) => y.dmg - x.dmg), foes: [...st.foes.values()], delta: null, left: kind === 'left' ? b.enemies.filter(u => u.gone && !u.dead).map(u => ({ name: u.name, hp: Math.round(100 * u.hp / u.maxHp) })) : [] };
    },

    rangeEnd(b) {
      const R = this.range(), st = b.rangeStat, report = this.rangeReportOf(b), { kind, cycles, total, perCycle } = report;
      const comparable = kind !== 'abort' && !st.edited && !st.hacked;
      const prev = comparable ? R.log.find(o => o.key === st.key && o.kind !== 'abort' && !o.edited && !o.hacked) : null;
      report.delta = prev ? { perCycle: prev.perCycle ? Math.round(100 * (perCycle - prev.perCycle) / prev.perCycle) : null, cycles: cycles - prev.cycles } : null;
      R.log.unshift({ at: this.now(), key: st.key, label: labelOf(st.setup.waves), kind, cycles, total, perCycle, seed: st.seed, edited: st.edited, hacked: st.hacked, setup: st.setup });
      R.log.length = Math.min(R.log.length, TUN.logMax);
      const out = { win: b.result.win, fled: b.result.fled, lines: [], levelUps: [], items: [], range: report };
      this.battle = null;
      this.battleCtx = null;
      return out;
    },

    rangeLogLoad(i) {
      const row = this.range().log[i];
      if (!row || !row.setup) return false;
      this.rangeApply(row.setup);
      return true;
    },

    rangeMarkSave(i) {
      const R = this.range();
      if (i < 0 || i >= TUN.marks || !this.rangeReady()) return false;
      R.marks[i] = { label: labelOf(R.waves), setup: this.rangeSnapshot() };
      return true;
    },

    rangeMarkLoad(i) {
      const m = this.range().marks[i];
      if (!m) return false;
      this.rangeApply(m.setup);
      return true;
    },

    rangeMarkDrop(i) {
      const R = this.range();
      if (!R.marks[i]) return false;
      R.marks[i] = null;
      return true;
    },

    rangeBatchStart(n, seed) {
      const R = this.range();
      if (!this.rangeReady()) return null;
      const seed0 = seed || R.cond.seed || Math.floor(Math.random() * 1e9) + 1;
      return { n, seed0, done: 0, ms: 0, base: this.rangeOpts(seed0), key: this.rangeSetupKey(), hacked: HACKS.some(f => R.hack[f.key]), kinds: { win: 0, left: 0, lose: 0, limit: 0, abort: 0 }, cycles: { sum: 0, min: Infinity, max: 0 }, perCycle: 0, total: 0, heroes: new Map() };
    },

    rangeBatchOne(job) {
      const seed = job.seed0 + job.done, b = new H.Battle(Object.assign({}, job.base, { seed }));
      this.rangeAttach(b, seed, true);
      b.start();
      b.drain();
      let stall = 0;
      for (let i = 0; i < TUN.batchSteps && !b.over && stall < 4; i++) {
        stall = b.autoStep() === false ? stall + 1 : 0;
        b.drain();
      }
      if (!b.over) { b.rangeStop = true; b.finish(false); b.drain(); }
      const r = this.rangeReportOf(b);
      job.kinds[r.kind]++;
      job.cycles.sum += r.cycles;
      job.cycles.min = Math.min(job.cycles.min, r.cycles);
      job.cycles.max = Math.max(job.cycles.max, r.cycles);
      job.perCycle += r.perCycle;
      job.total += r.total;
      for (const h of r.heroes) {
        const o = job.heroes.get(h.id) || { id: h.id, name: h.name, dmg: 0, down: 0 };
        o.dmg += h.dmg;
        o.down += h.down ? 1 : 0;
        job.heroes.set(h.id, o);
      }
      job.done++;
    },

    rangeBatchStep(job, budget) {
      const t0 = Date.now();
      while (job.done < job.n) {
        this.rangeBatchOne(job);
        if (budget && Date.now() - t0 >= budget) break;
      }
      job.ms += Date.now() - t0;
      return job.done >= job.n;
    },

    rangeBatchResult(job) {
      const n = Math.max(1, job.done), result = { n: job.done, seed0: job.seed0, ms: job.ms, hacked: job.hacked, kinds: job.kinds, winPct: Math.round(100 * (job.kinds.win + job.kinds.left) / n), cycles: { min: job.done ? job.cycles.min : 0, avg: Math.round(10 * job.cycles.sum / n) / 10, max: job.cycles.max }, perCycle: Math.round(job.perCycle / n), total: job.total, heroes: [...job.heroes.values()].sort((a, b) => b.dmg - a.dmg).map(o => ({ id: o.id, name: o.name, dmg: Math.round(o.dmg / n), share: job.total ? Math.round(100 * o.dmg / job.total) : 0, downPct: Math.round(100 * o.down / n) })), delta: null };
      this.rangeBatches = this.rangeBatches || new Map();
      const prev = this.rangeBatches.get(job.key);
      if (prev && !job.hacked && !prev.hacked) result.delta = { winPct: result.winPct - prev.winPct, perCycle: prev.perCycle ? Math.round(100 * (result.perCycle - prev.perCycle) / prev.perCycle) : null };
      this.rangeBatches.set(job.key, { winPct: result.winPct, perCycle: result.perCycle, hacked: job.hacked });
      return result;
    },

    rangeQuip(r) {
      const list = r.total === 0 && r.kind !== 'abort' ? QUIPS.zero : r.hacked ? QUIPS.hack : QUIPS[r.kind];
      return this.fill ? this.fill(list[r.seed % list.length]) : list[r.seed % list.length];
    },

    rangeTip() {
      const rows = this.rangeRows();
      const tip = TIPS.find(([test]) => rows.some(test));
      return tip ? tip[1] : '';
    },

    rangeSeedLock(seed) {
      const C = this.range().cond;
      C.seed = C.seed === seed ? 0 : seed;
      return C.seed;
    },

    rangeDrop() {
      this.battle = null;
      this.battleCtx = null;
    }
  });

  const endBattle0 = P.endBattle;
  P.endBattle = function () {
    const b = this.battle, ctx = this.battleCtx;
    if (b && b.over && ctx && ctx.o && ctx.o.range) return this.rangeEnd(b);
    return endBattle0.call(this);
  };

  Object.assign(BP, {
    rangeTune(list, rows) {
      list.forEach((u, i) => {
        const o = rows[i];
        if (!o) return;
        u.rt = o;
        if (o.hp) { const v = Math.max(1, Math.round(u.maxHp * o.hp)); u.maxHp = v; u.hp = v; u.base.hp = v; }
        if (o.atk != null) u.base.atk *= o.atk;
        if (o.def != null) u.base.def *= o.def;
        if (o.spd) u.base.spd = o.spd;
        if (o.res != null) u.base.res = o.res / 100;
        if (o.tough) { u.tough = o.tough; u.maxTough = o.tough; }
        const patch = {};
        if (o.weak) { patch.weak = o.weak; patch.resist = o.resist || []; }
        if (o.noSummon) patch.skills = u.data.skills.map(s => (s.t === 'summon' ? Object.assign({}, s, { max: -1 }) : s));
        if (o.noFlee) patch.flee = 0;
        if (o.noLife) patch.lifespan = 0;
        const [kind, n] = String(o.act || '').split(':');
        if (kind === 'skill') patch.pat = [+n];
        if (kind === 'step') u.patIdx = +n;
        if (Object.keys(patch).length) {
          u.data = Object.assign({}, u.data, patch);
          u.weak = u.data.weak;
          u.resist = u.data.resist || [];
        }
        if (u.data.proto && !o.barrier) { u.flags.protoInit = true; u.flags.barrier = false; u.flags.legs = false; u.flags.coreT = T.protoCore; }
        if (o.hpStart) u.hp = Math.max(1, Math.round(u.maxHp * o.hpStart / 100));
      });
    }
  });

  Object.assign(BP, {
    rangeSrc() {
      this.rangeStat.edited = true;
      return this.allies.find(a => !a.dead && !a.gone) || this.allies[0];
    },

    rangeEditHp(t, f) {
      const src = this.rangeSrc(), want = Math.max(1, Math.round(t.maxHp * f));
      if (t.hp > want) this.hit(src, t, 0, { raw: t.hp - want, isDot: true, e: src.elem, label: EDIT_LABEL });
      else if (t.hp < want) { const v = want - t.hp; t.hp = want; this.push({ t: 'heal', u: t, v, hp: t.hp }); }
      this.cleanup();
    },

    rangeEditBreak(t) {
      const src = this.rangeSrc();
      if (t.broken) return false;
      t.tough = 0;
      this.push({ t: 'tough', u: t, v: 0 });
      this.doBreak(src, t, src.elem);
      this.cleanup();
      return true;
    },

    rangeEditSkill(t, i) {
      this.rangeSrc();
      t.charging = null;
      t.lockTarget = null;
      t.planned = t.data.skills[i];
      this.push({ t: 'text', text: t.name + ': следующий навык ' + t.planned.n });
    },

    rangeEditNow(t) {
      this.rangeSrc();
      t.av = 0;
    },

    rangeEditEnergy() {
      this.rangeSrc();
      for (const a of this.allies) if (!a.dead && !a.gone) a.energy = a.maxEnergy;
    },

    rangeEditSp() {
      this.rangeSrc();
      this.sp = T.spMax;
    },

    rangeEditHeal() {
      const src = this.rangeSrc();
      for (const a of this.allies) {
        if (a.gone) continue;
        if (a.dead) { a.dead = false; a.hp = a.maxHp; this.push({ t: 'revive', u: a, hp: a.hp, text: 'Правка: снова в строю' }); continue; }
        a.buffs = a.buffs.filter(x => !x.debuff);
        a.dots = [];
        a.frozen = 0;
        a.stun = 0;
        this.heal(src, a, a.maxHp);
      }
      this.cleanup();
    },

    rangeEditWave() {
      this.rangeSrc();
      for (const e of this.living.slice()) { e.dead = true; e.rewarded = true; this.push({ t: 'kill', u: e }); }
      this.cleanup();
    }
  });

  const trace0 = BP.traceFoe;
  BP.traceFoe = function (list) {
    trace0.call(this, list);
    const R = this.opts.range;
    if (!R || list !== this.enemies) return;
    this.rangeTune(list, R.waves[this.wave] || []);
    if (R.hack && R.hack.intent) for (const u of list) if (!(u.rt && u.rt.act === 'idle')) this.planNext(u);
  };

  const spawn0 = BP.spawnFoe;
  BP.spawnFoe = function (id, lvl, by) {
    const e = spawn0.call(this, id, lvl, by), t = this.opts.range && by && by.rt;
    if (!t) return e;
    e.rt = { hp: t.hp, atk: t.atk };
    if (t.hp) { const v = Math.max(1, Math.round(e.maxHp * t.hp)); e.maxHp = v; e.hp = v; e.base.hp = v; }
    if (t.atk != null) e.base.atk *= t.atk;
    if (this.opts.range.hack && this.opts.range.hack.intent) this.planNext(e);
    return e;
  };

  const zero0 = BP.onZero;
  BP.onZero = function (tgt, src) {
    const R = this.opts.range;
    if (R && (tgt.side === 'enemy' ? tgt.rt && tgt.rt.immortal : tgt.side === 'ally' && R.hack && R.hack.immortal)) { tgt.hp = 1; return; }
    return zero0.call(this, tgt, src);
  };

  const turn0 = BP.enemyTurn;
  BP.enemyTurn = function (u) {
    const R = this.opts.range;
    if (!R) return turn0.call(this, u);
    if (u.rt && u.rt.act === 'idle') {
      const r = this.startTurn(u);
      if (r !== 'dead' && r !== 'bloom') this.endTurn(u);
      return;
    }
    turn0.call(this, u);
    if (R.hack && R.hack.intent && !this.over && !u.dead && !u.gone) this.planNext(u);
  };

  const startTurn0 = BP.startTurn;
  BP.startTurn = function (u) {
    const R = this.opts.range;
    if (R && R.hack) {
      if (R.hack.sp) this.sp = T.spMax;
      if (R.hack.energy) for (const a of this.allies) if (!a.dead && !a.gone) a.energy = a.maxEnergy;
    }
    return startTurn0.call(this, u);
  };

  const intent0 = BP.intentOf;
  BP.intentOf = function (u) {
    const R = this.opts.range;
    if (!(R && R.hack && R.hack.intent)) return intent0.call(this, u);
    return u.charging != null ? u.data.skills[u.charging] : u.planned || null;
  };

  const memo0 = BP.memo;
  BP.memo = function (on, ctx) {
    memo0.call(this, on, ctx);
    const R = this.opts.range;
    if (R && on === 'tick' && !this.over && cycleOf(this.clock || 0) > R.cycles) { this.rangeStop = true; this.finish(false); }
  };

  H.RANGE = { TUN, TIERS, KINDS, LISTS, NUMS, COND, BG, MUSIC, SET_GROUPS, DMG_KINDS, EDIT_LABEL, HACKS, QUIPS, TIPS, tierOf, nameOf, shortOf, widthOf, layout, cycleOf, valueOf, defaultOf, actName, mechsOf };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
