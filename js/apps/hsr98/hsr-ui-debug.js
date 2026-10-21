(function (H) {
  'use strict';
  const G = H.Gfx, T = H.TUNING;
  const { W, HGT, C } = H.UI_CONST;
  const TABS = [
    { id: 'chars', label: 'Персонажи', icon: 'chars' },
    { id: 'cones', label: 'Конусы', icon: 'cones' },
    { id: 'relics', label: 'Реликвии', icon: 'relic' },
    { id: 'items', label: 'Предметы', icon: 'bag' },
    { id: 'scenes', label: 'Сцены', icon: 'archive' }
  ];
  const SCENE_KINDS = [
    { id: 'ult', label: 'Абсолютная техника', icon: 'chars' },
    { id: 'fus', label: 'Слияние', icon: 'team' },
    { id: 'warp', label: 'Прыжок: появление', icon: 'warp' },
    { id: 'eid', label: 'Фон эйдолонов', icon: 'archive' },
    { id: 'sig', label: 'Поиск сигнала: появление', icon: 'warp' },
    { id: 'conv', label: 'Призыв: появление', icon: 'warp' },
    { id: 'guild', label: 'Набор в отряд: появление', icon: 'warp' },
    { id: 'mid', label: 'Полуночный канал: появление', icon: 'warp' },
    { id: 'con', label: 'Кон-Тон: появление', icon: 'warp' }
  ];
  const AIMS = [['auto', 'Как в бою'], ['all', 'Все враги'], ['one', 'Один враг'], ['none', 'Без врагов']];
  const AIM_TEXT = { single: 'один враг', blast: 'враг и соседи', all: 'все враги', allies: 'вся команда', self: 'сам герой' };
  const WARP_CUTS = [['full', 'Весь прыжок'], ['intro', 'Только появление']];
  const WARP_BANS = [['ev', 'Событийный'], ['std', 'Стандартный']];
  const WARP_RES = [['new', 'Новый персонаж'], ['eid', 'Эйдолон +1'], ['max', 'Все эйдолоны открыты']];
  const EID_STAGES = [0, 1, 3, 6];
  const SHOW_FOES = ['reaver', 'eliminator', 'flamespawn'];
  const PARTNERS = ['march', 'danheng', 'himeko', 'welt'];
  const PV = { w: 224, h: 168 };
  const RAR_TXT = { 2: '#9ee0b0', 3: '#b8c4e8', 4: '#cfa2ff', 5: '#ffd45a' };
  const EIDOLON_NUM = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const TRACE_MODES = [['cap', 'до потолка уровня'], ['all', 'все узлы'], ['reset', 'сбросить']];
  const ROLLS = [['Минимальные', 0.8], ['Средние', 1], ['Максимальные', 1.2]];
  const KIND_NAME = { food: 'Расходник', exp: 'Опыт', key: 'Ключевой предмет', money: 'Валюта' };
  const KIND_ORDER = ['food', 'exp', 'mat', 'key'];
  const MONEY = {
    jade: { name: 'Звёздный нефрит', kind: 'money', rar: 5, text: 'Валюта Звёздного прыжка: ' + T.warpCost + ' нефрита за прыжок.' },
    credits: { name: 'Кредиты', kind: 'money', rar: 3, text: 'Деньги для магазинов и покупки слухов.' }
  };
  const QTY = { jade: [160, 1600, 16000, 160000], credits: [1000, 10000, 100000, 1000000], pass: [1, 10, 100], spass: [1, 10, 100] };
  const QTY_ITEM = [1, 5, 10, 50, 99];
  const ROW_H = 24;
  const wrapIdx = (i, n) => ((i % n) + n) % n;
  const pct = v => (Math.round(v * 1000) / 10) + '%';
  const charIds = () => Object.keys(H.CHARS).filter(k => k !== 'trail_p');
  const coneIds = () => Object.keys(H.CONES).sort((a, b) => H.CONES[b].rarity - H.CONES[a].rarity);
  const itemIds = () => Object.keys(MONEY).concat(Object.keys(H.ITEMS).sort((a, b) => KIND_ORDER.indexOf(H.ITEMS[a].kind) - KIND_ORDER.indexOf(H.ITEMS[b].kind)));
  const itemDef = id => MONEY[id] || H.ITEMS[id];
  const qtyOf = id => QTY[id] || QTY_ITEM;
  const freshState = () => ({
    tab: 0, row: 0, log: null,
    ch: { i: 0, lvl: H.MAX_LVL, eid: 0, tr: 0 },
    cn: { i: 0, sup: 1, n: 1 },
    rl: { set: 0, slot: 0, main: 'hpF', subs: ['critR', 'critD', 'atkP', 'spd'], lvl: 15, roll: 1 },
    it: { i: 0, q: 0 },
    sc: { kind: 0, id: null, aim: 0, cut: 0, ban: 0, res: 0, stage: 1, gen: null }
  });
  const preview = { key: null, show: null, eid: null };

  const sceneKind = st => SCENE_KINDS[st.sc.kind].id;
  function sceneIds(kind) {
    if (kind === 'fus') return Object.keys(H.FUSIONS).filter(k => H.Fusions.SHOWS[k]);
    if (kind === 'sig' || kind === 'conv' || kind === 'guild' || kind === 'mid' || kind === 'con') return charIds();
    const has = kind === 'ult' ? H.Ults.SHOWS : kind === 'warp' ? H.WarpIntro.SHOWS : H.Eidolons.SCENES;
    return Object.keys(H.CHARS).filter(k => has[k]);
  }
  function sceneAt(st) { const ids = sceneIds(sceneKind(st)), i = Math.max(0, ids.indexOf(st.sc.id)); return { ids, i, id: ids[i] }; }
  const fusionKit = id => { const f = H.FUSIONS[id]; return { name: f.name, rarity: Math.max(...f.members.map(m => H.CHARS[m].rarity)), ult: { name: f.name, target: f.target } }; };
  const sceneKit = (g, kind, id) => kind === 'fus' ? fusionKit(id) : H.CHARS[kind === 'eid' ? g.kitOf(id) : id];
  const cineKind = kind => kind === 'ult' || kind === 'fus';
  function sceneName(g, kind, id) {
    const kit = sceneKit(g, kind, id);
    return id.startsWith('trail') ? kit.name + ' · ' + H.PATHS[kit.path].name : kit.name;
  }

  function showUnit(g, id) {
    const kit = H.CHARS[id];
    return { side: 'ally', id, charId: id, kit, name: id.startsWith('trail') ? g.state.name : kit.name, elem: kit.elem, path: kit.path };
  }

  function showFoes(aim, target) {
    const mode = aim !== 'auto' ? aim : target === 'allies' || target === 'self' ? 'none' : target === 'single' ? 'one' : 'all';
    if (mode === 'none') return [];
    const s = 104, x0 = W / 2 + 34 - SHOW_FOES.length * s * 0.4;
    const list = SHOW_FOES.map((e, i) => ({ u: { data: H.ENEMIES[e] }, x: (x0 + s * 0.4 + i * s * 0.8) / 2, y: 145, s: s / 2 }));
    return mode === 'one' ? list.slice(1, 2) : list;
  }

  function makeUlt(ui, id, aim) {
    const g = ui.game, u = showUnit(g, id);
    const allies = H.CHARS[id].ult.target === 'self' ? [u] : [u].concat(PARTNERS.filter(k => k !== id).slice(0, 3).map(k => showUnit(g, k)));
    return new H.Ults.Show(ui, u, { foes: showFoes(aim, H.CHARS[id].ult.target), allies, bg: 'station' });
  }

  function makeFus(ui, id, aim) {
    const g = ui.game, f = H.FUSIONS[id], members = f.members.map(k => showUnit(g, k));
    const allies = members.concat(PARTNERS.filter(k => !f.members.includes(k)).slice(0, 4 - members.length).map(k => showUnit(g, k)));
    return new H.Fusions.Show(ui, members, { id, foes: showFoes(aim, f.target), allies, bg: 'station' });
  }

  const makeCine = (ui, kind, id, aim) => (kind === 'fus' ? makeFus : makeUlt)(ui, id, aim);

  function makeWarp(ui, id, S) {
    const d = H.CHARS[id];
    const show = new H.WarpShow(ui, [{ kind: 'char', id, pick: id, rar: d.rarity, name: d.name, res: WARP_RES[S.res][0] }], { ban: WARP_BANS[S.ban][0] });
    if (WARP_CUTS[S.cut][0] === 'intro') show.begin([0]);
    return show;
  }

  function makeSignal(ui, id, S) {
    const d = H.CHARS[id];
    const show = new H.SignalShow(ui, [{ kind: 'char', id, pick: id, rar: d.rarity, name: d.name, res: WARP_RES[S.res][0] }], { ban: 'sig' });
    if (WARP_CUTS[S.cut][0] === 'intro') show.begin([0]);
    return show;
  }

  function makeConvene(ui, id, S) {
    const d = H.CHARS[id];
    const show = new H.ConveneShow(ui, [{ kind: 'char', id, pick: id, rar: d.rarity, name: d.name, res: WARP_RES[S.res][0] }], { ban: 'conv' });
    if (WARP_CUTS[S.cut][0] === 'intro') show.begin([0]);
    return show;
  }

  function makeMidnight(ui, id, S) {
    const d = H.CHARS[id];
    const show = new H.MidnightShow(ui, [{ kind: 'char', id, pick: id, rar: d.rarity, name: d.name, res: WARP_RES[S.res][0] }], { ban: 'mid' });
    if (WARP_CUTS[S.cut][0] === 'intro') show.begin([0]);
    return show;
  }

  function makeSpotlight(ui, id, S) {
    const d = H.CHARS[id];
    const show = new H.SpotlightShow(ui, [{ kind: 'char', id, pick: id, rar: d.rarity, name: d.name, res: WARP_RES[S.res][0] }], { ban: 'con' });
    if (WARP_CUTS[S.cut][0] === 'intro') show.begin([0]);
    return show;
  }

  function makeGuild(ui, id, S) {
    const d = H.CHARS[id];
    const show = new H.ExplosionShow(ui, [{ kind: 'char', id, pick: id, rar: d.rarity, name: d.name, res: WARP_RES[S.res][0], gender: id === 'trail' ? S.gen || ui.game.state.gender : undefined }], { ban: 'guild' });
    if (WARP_CUTS[S.cut][0] === 'intro') show.begin([0]);
    return show;
  }

  function loopShow(show, t) {
    const total = show.beats.reduce((a, b) => a + b.d, 0);
    let x = t % total, i = 0;
    while (i < show.beats.length - 1 && x >= show.beats[i].d) { x -= show.beats[i].d; i++; }
    show.i = i; show.t = x; show.T = t % total;
  }

  function assemblyOf(S) {
    if (!S.stage) return { from: 0, to: EID_STAGES[EID_STAGES.length - 1], stage: EID_STAGES.length - 1 };
    return { from: EID_STAGES[S.stage - 1], to: EID_STAGES[S.stage], stage: S.stage };
  }

  function fitLine(ui, text, w, size) {
    let s = text;
    while (s.length > 8 && ui.measure(s, size) > w) s = s.slice(0, -2) + '…';
    return s;
  }

  function clearSubs(R) { R.subs = R.subs.map(k => (k === R.main ? '' : k)); }

  function nextSub(R, i, d) {
    const opts = [''].concat(Object.keys(H.STAT_ROLL));
    let j = opts.indexOf(R.subs[i] || '');
    for (let n = 0; n < opts.length; n++) {
      j = wrapIdx(j + d, opts.length);
      const k = opts[j];
      if (!k || (k !== R.main && !R.subs.some((x, m) => m !== i && x === k))) return k;
    }
    return R.subs[i];
  }

  Object.assign(H.UI.prototype, {
    toggleDebug() {
      const top = this.top();
      if (top && top.debug) { this.pop(); return true; }
      if (!this.game || this.mode === 'title' || this.mode === 'credits') { this.sfx('deny'); return false; }
      this.openDebug();
      return true;
    },

    debugForm(st) {
      const ui = this, g = this.game;
      const shift = () => ui.held.includes('ShiftLeft') || ui.held.includes('ShiftRight');
      const note = (text, sfx) => { st.log = { text, t: ui.t }; ui.sfx(sfx || 'chest'); };
      const tab = TABS[st.tab].id;
      if (tab === 'chars') {
        const ids = charIds(), id = ids[st.ch.i], name = H.CHARS[id].name, owned = !!g.state.roster[id];
        const trMode = TRACE_MODES[st.ch.tr || 0], tag = () => 'ур. ' + st.ch.lvl + ' · E' + st.ch.eid + ' · Следы ' + trMode[1];
        const grant = k => { const res = g.debugChar(k, st.ch.lvl, st.ch.eid); g.fillTraces(k === 'trail_p' ? 'trail' : k, trMode[0]); return res; };
        const outs = ui.debugOutfits(id), oi = H.clamp(st.ch.o || 0, 0, Math.max(0, outs.length - 1)), oid = outs[oi];
        const outLabel = !oid ? 'нет нарядов' : oid === '*' ? 'Все наряды игры (' + Object.keys(H.OUTFITS).length + ')' : H.OUTFITS[oid].name + (g.ownsOutfit(oid) ? ' · есть' : '');
        return {
          rows: [
            { label: 'Персонаж', value: name, col: RAR_TXT[H.CHARS[id].rarity], step: d => { st.ch.i = wrapIdx(st.ch.i + d, ids.length); } },
            { label: 'Уровень', value: String(st.ch.lvl), step: d => { st.ch.lvl = H.clamp(st.ch.lvl + d * (shift() ? 10 : 1), 1, H.MAX_LVL); } },
            { label: 'Эйдолоны', value: st.ch.eid ? 'E' + st.ch.eid + ' · до ' + EIDOLON_NUM[st.ch.eid - 1] : 'E0 · нет', step: d => { st.ch.eid = H.clamp(st.ch.eid + d, 0, 6); } },
            { label: 'Наряд', value: outLabel, col: oid && oid !== '*' ? RAR_TXT[H.OUTFITS[oid].rarity] : null, fixed: outs.length < 2, step: d => { st.ch.o = wrapIdx(oi + d, outs.length); } },
            { label: 'Следы', value: trMode[1], step: d => { st.ch.tr = wrapIdx((st.ch.tr || 0) + d, TRACE_MODES.length); } }
          ],
          acts: [
            { label: owned ? 'Применить' : 'Выдать', icon: 'chars', fn: () => { const res = grant(id); note((res === 'new' ? 'новый персонаж ' : 'изменён ') + name + ', ' + tag(), 'levelup'); } },
            { label: 'Наряд', icon: 'outfit', fn: () => {
              if (!oid) { st.log = { text: 'у персонажа нет нарядов', t: ui.t }; ui.sfx('deny'); return; }
              const list = oid === '*' ? Object.keys(H.OUTFITS) : [oid], worn = list.filter(x => g.debugOutfit(x, oid !== '*'));
              note(oid === '*' ? 'все наряды (' + list.length + ')' : '«' + H.OUTFITS[oid].name + '»' + (worn.length ? ', надет' : ', персонажа нет в составе'), 'chest');
            } },
            { label: 'Выдать всех', icon: 'team', fn: () => {
              const miss = ids.filter(k => !g.state.roster[k]);
              if (!miss.length) { st.log = { text: 'все персонажи уже в составе', t: ui.t }; ui.sfx('deny'); return; }
              for (const k of miss) grant(k);
              note('новых персонажей ' + miss.length + ', ' + tag(), 'levelup');
            } }
          ]
        };
      }
      if (tab === 'cones') {
        const ids = coneIds(), id = ids[st.cn.i], d = H.CONES[id];
        return {
          rows: [
            { label: 'Конус', value: d.name, col: RAR_TXT[d.rarity], step: k => { st.cn.i = wrapIdx(st.cn.i + k, ids.length); } },
            { label: 'Наложение', value: 'S' + st.cn.sup, step: k => { st.cn.sup = H.clamp(st.cn.sup + k, 1, 5); } },
            { label: 'Копий', value: '×' + st.cn.n, step: k => { st.cn.n = H.clamp(st.cn.n + k, 1, 5); } }
          ],
          acts: [
            { label: 'Выдать', icon: 'cones', fn: () => { g.debugCone(id, st.cn.sup, st.cn.n); note('конус «' + d.name + '» S' + st.cn.sup + (st.cn.n > 1 ? ' ×' + st.cn.n : '')); } },
            { label: 'Все конусы', icon: 'cones', fn: () => { for (const k of ids) g.debugCone(k, st.cn.sup, 1); note('все конусы (' + ids.length + ' шт.) S' + st.cn.sup); } }
          ]
        };
      }
      if (tab === 'relics') {
        const R = st.rl, sets = Object.keys(H.RELIC_SETS), slot = H.RELIC_SLOTS[R.slot], roll = ROLLS[R.roll][1];
        const subRow = i => {
          const k = R.subs[i];
          return { label: 'Доп. ' + (i + 1), value: k ? H.STAT_NAMES[k] + ' ' + ui.fmtStat(k, g.relicSub(k, R.lvl, Math.max(1, R.lvl * 3), roll)) : '—', col: k ? C.cream : C.dim, step: d => { R.subs[i] = nextSub(R, i, d); } };
        };
        const slotsOf = set => H.RELIC_SLOTS.map((x, i) => i).filter(i => (H.RELIC_SLOTS[i].kind === 'planar') === !!H.RELIC_SETS[set].planar);
        const pickSlot = i => { R.slot = i; const m = H.RELIC_SLOTS[i].mains; if (!m.includes(R.main)) R.main = m[0]; clearSubs(R); };
        return {
          rows: [
            { label: 'Комплект', value: H.RELIC_SETS[sets[R.set]].name, col: H.RELIC_SETS[sets[R.set]].planar ? '#d8c0ff' : C.gold, step: d => {
              R.set = wrapIdx(R.set + d, sets.length);
              const own = slotsOf(sets[R.set]);
              if (!own.includes(R.slot)) pickSlot(own[0]);
            } },
            { label: 'Слот', value: slot.full || slot.name, step: d => { const own = slotsOf(sets[R.set]); pickSlot(own[wrapIdx(own.indexOf(R.slot) + d, own.length)]); } },
            { label: 'Основная', value: H.STAT_NAMES[R.main] + ' ' + ui.fmtStat(R.main, g.relicMain(R.main, R.lvl)), fixed: slot.mains.length < 2, step: d => { const m = slot.mains; R.main = m[wrapIdx(m.indexOf(R.main) + d, m.length)]; clearSubs(R); } },
            subRow(0), subRow(1), subRow(2), subRow(3),
            { label: 'Уровень', value: '+' + R.lvl, step: d => { R.lvl = H.clamp(R.lvl + d * (shift() ? 5 : 1), 0, 15); } },
            { label: 'Броски', value: ROLLS[R.roll][0], step: d => { R.roll = H.clamp(R.roll + d, 0, ROLLS.length - 1); } }
          ],
          acts: [
            { label: 'Выдать реликвию', icon: 'relic', fn: () => {
              const rel = g.debugRelic({ set: sets[R.set], slot: slot.key, main: R.main, subs: R.subs.filter(Boolean), lvl: R.lvl, roll });
              if (!rel) { ui.sfx('deny'); return; }
              note('реликвия «' + H.RELIC_SETS[rel.set].name + '», ' + slot.name.toLowerCase() + ' +' + rel.lvl);
            } }
          ]
        };
      }
      if (tab === 'scenes') {
        const S = st.sc, kind = sceneKind(st), { ids, i, id } = sceneAt(st), kit = sceneKit(g, kind, id);
        const cycle = (list, key) => k => { S[key] = wrapIdx(S[key] + k, list.length); };
        const rows = [
          { label: 'Сцена', value: SCENE_KINDS[S.kind].label, step: k => { S.kind = wrapIdx(S.kind + k, SCENE_KINDS.length); S.id = sceneAt(st).id; } },
          { label: kind === 'fus' ? 'Слияние' : 'Персонаж', value: sceneName(g, kind, id), col: RAR_TXT[kit.rarity], step: k => { S.id = ids[wrapIdx(i + k, ids.length)]; } }
        ];
        if (cineKind(kind)) rows.push({ label: 'Цели', value: AIMS[S.aim][1], step: cycle(AIMS, 'aim') });
        if (kind === 'warp') rows.push(
          { label: 'Ролик', value: WARP_CUTS[S.cut][1], step: cycle(WARP_CUTS, 'cut') },
          { label: 'Баннер', value: WARP_BANS[S.ban][1], step: cycle(WARP_BANS, 'ban') },
          { label: 'Итог', value: WARP_RES[S.res][1], step: cycle(WARP_RES, 'res') }
        );
        if (kind === 'sig' || kind === 'conv' || kind === 'guild' || kind === 'mid' || kind === 'con') rows.push(
          { label: 'Ролик', value: WARP_CUTS[S.cut][1], step: cycle(WARP_CUTS, 'cut') },
          { label: 'Итог', value: WARP_RES[S.res][1], step: cycle(WARP_RES, 'res') }
        );
        if (kind === 'guild' && id === 'trail') rows.push({ label: 'Первопроходец', value: (S.gen || g.state.gender) === 'f' ? 'Стелла' : 'Келус', step: () => { S.gen = (S.gen || g.state.gender) === 'f' ? 'm' : 'f'; } });
        if (kind === 'eid') rows.push({ label: 'Стадия', value: 'E' + EID_STAGES[S.stage] + ' · ' + H.Eidolons.stageName(EID_STAGES[S.stage]), step: cycle(EID_STAGES, 'stage') });
        const icon = SCENE_KINDS[S.kind].icon;
        if (kind === 'eid') {
          const A = assemblyOf(S);
          return { rows, acts: [
            { label: 'Смотреть', icon, view: true, fn: () => ui.openDebugEidolon(st, false) },
            { label: 'Сборка E' + A.from + '→E' + A.to, icon, view: true, fn: () => ui.openDebugEidolon(st, true) }
          ] };
        }
        return { rows, acts: [
          { label: 'Смотреть', icon, view: true, fn: () => ui.openDebugShow(st, false) },
          { label: 'Все подряд', icon: 'team', view: true, fn: () => ui.openDebugShow(st, true) }
        ] };
      }
      const ids = itemIds(), id = ids[st.it.i], d = itemDef(id), q = qtyOf(id), n = q[Math.min(st.it.q, q.length - 1)];
      const tl = st.it.tl || g.trailLevel();
      return {
        rows: [
          { label: 'Предмет', value: d.name, col: RAR_TXT[d.rar] || C.cream, step: k => { st.it.i = wrapIdx(st.it.i + k, ids.length); } },
          { label: 'Количество', value: H.fmt(n), step: k => { st.it.q = H.clamp(Math.min(st.it.q, q.length - 1) + k, 0, q.length - 1); } },
          { label: 'Ур. Освоения', value: String(tl), step: k => { st.it.tl = H.clamp(tl + k * (shift() ? 10 : 1), 1, H.TL_MAX); } }
        ],
        acts: [
          { label: 'Выдать', icon: 'bag', fn: () => { g.give(MONEY[id] ? { [id]: n } : { items: { [id]: n } }); note(d.name + ' +' + H.fmt(n)); } },
          { label: 'Уровень Освоения', icon: 'guide', fn: () => { note('уровень Освоения ' + g.setTrailLevel(tl), 'levelup'); } }
        ]
      };
    },

    debugArrow(x, y, dir, col) {
      const c = this.ctx;
      c.fillStyle = '#000';
      c.beginPath(); c.moveTo(x + dir * 5 + 1, y + 1); c.lineTo(x - dir * 3 + 1, y - 5); c.lineTo(x - dir * 3 + 1, y + 7); c.fill();
      c.fillStyle = col;
      c.beginPath(); c.moveTo(x + dir * 5, y); c.lineTo(x - dir * 3, y - 6); c.lineTo(x - dir * 3, y + 6); c.fill();
    },

    debugRow(c, st, r, i, x, y, w) {
      const ui = this, on = st.row === i, h = ROW_H - 2;
      if (on) {
        const gr = c.createLinearGradient(x, 0, x + w, 0);
        gr.addColorStop(0, 'rgba(242,220,154,0.3)'); gr.addColorStop(1, 'rgba(242,220,154,0.04)');
        c.fillStyle = gr; c.fillRect(x, y, w, h);
        c.fillStyle = C.brassHi; c.fillRect(x, y, 2, h);
        ui.cursor(x + 4, y + h / 2);
      }
      ui.text(r.label, x + 16, y + 5, { size: 11, bold: on, col: on ? C.gold : C.sub });
      const vx = x + 96, vw = w - 100;
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(vx, y + 2, vw, h - 4);
      const live = !r.fixed;
      if (live) { ui.debugArrow(vx + 8, y + h / 2, -1, on ? C.brassHi : C.dim); ui.debugArrow(vx + vw - 8, y + h / 2, 1, on ? C.brassHi : C.dim); }
      let size = 11;
      while (size > 8 && ui.measure(r.value, size, on) > vw - 36) size--;
      ui.text(r.value, vx + vw / 2, y + (h - size) / 2 - 1, { align: 'center', size, bold: on, col: r.col || C.cream });
      const pick = () => { if (st.row !== i) { st.row = i; ui.sfx('select'); } };
      ui.hit(x, y, vx - x, h, pick);
      ui.hit(vx + 16, y, vw - 32, h, pick);
      if (live) {
        ui.hit(vx, y, 16, h, () => { st.row = i; r.step(-1); ui.sfx('select'); });
        ui.hit(vx + vw - 16, y, 16, h, () => { st.row = i; r.step(1); ui.sfx('select'); });
      }
    },

    debugOutfits(id) {
      const own = this.game.outfitsOf ? this.game.outfitsOf(id) : [];
      return own.length ? own.concat('*') : [];
    },

    debugCharPreview(c, st, x, y) {
      const ui = this, g = this.game, id = charIds()[st.ch.i], kitId = id === 'trail' ? g.kitOf('trail') : id, kit = H.CHARS[kitId], r = g.state.roster[id];
      G.rarityCell(c, x + 14, y + 14, 80, 80, kit.rarity);
      const outs = ui.debugOutfits(id), oid = st.row === 3 ? outs[H.clamp(st.ch.o || 0, 0, Math.max(0, outs.length - 1))] : null;
      G.drawPortrait(c, oid && oid !== '*' ? H.outfitLook(oid, g.state.gender) : G.lookOf(kitId, g), x + 18, y + 18, 72);
      ui.text(id === 'trail' ? g.state.name : kit.name, x + 106, y + 14, { size: 15, bold: true, serif: true, col: RAR_TXT[kit.rarity] });
      ui.text('★'.repeat(kit.rarity), x + 106, y + 34, { size: 12, col: RAR_TXT[kit.rarity] });
      G.pathIcon(c, kit.path, x + 106, y + 52, 14);
      ui.text(H.PATHS[kit.path].name, x + 124, y + 52, { size: 11 });
      G.elemIcon(c, kit.elem, x + 113, y + 78, 6);
      ui.text(H.ELEMENTS[kit.elem].name, x + 124, y + 72, { size: 11 });
      ui.text(r ? 'В составе: ур. ' + r.lvl + ' · E' + r.eid : 'Нет в составе', x + 14, y + 104, { size: 11, bold: true, col: r ? C.ok : C.dim });
      const b = g.baseStats(kitId, st.ch.lvl, st.ch.eid);
      ui.text('Базовые параметры: ур. ' + st.ch.lvl + ', E' + st.ch.eid, x + 14, y + 124, { size: 10, col: C.sub });
      [['HP', b.hp], ['Атака', b.atk], ['Защита', b.def], ['Скорость', b.spd]].forEach(([l, v], i) => {
        const cx = x + 14 + (i % 2) * 146, cy = y + 142 + Math.floor(i / 2) * 18;
        ui.text(l, cx, cy, { size: 11, col: C.sub });
        ui.text(H.fmt(v), cx + 132, cy, { size: 11, bold: true, align: 'right' });
      });
      ui.text(r && g.state.party.includes(id) ? 'В отряде.' : 'Отряд собирается в меню «Команда».', x + 14, y + 184, { size: 10, col: C.dim });
    },

    debugConePreview(c, st, x, y) {
      const ui = this, g = this.game, id = coneIds()[st.cn.i], d = H.CONES[id];
      G.drawConeCard(c, id, x + 14, y + 14, 84, 118, { scale: 2, sup: st.cn.sup });
      const tx = x + 110, tw = 190;
      const lines = ui.wrap(d.name, tw, 13);
      lines.forEach((l, i) => ui.text(l, tx, y + 14 + i * 16, { size: 13, bold: true, serif: true, col: RAR_TXT[d.rarity] }));
      let ty = y + 18 + lines.length * 16;
      G.pathIcon(c, d.path, tx, ty, 14);
      ui.text(H.PATHS[d.path].name + ' · ' + '★'.repeat(d.rarity), tx + 18, ty, { size: 11, col: RAR_TXT[d.rarity] });
      ty += 20;
      ui.text('HP +' + d.stats.hp + ' · Ат. +' + d.stats.atk + ' · Защ. +' + d.stats.def, tx, ty, { size: 10 });
      ty += 18;
      const k = 1 + 0.25 * (st.cn.sup - 1);
      ui.text('Бонус Пути при S' + st.cn.sup + ':', tx, ty, { size: 10, col: C.sub });
      Object.entries(d.bonus).forEach(([s, v], i) => ui.text(H.STAT_NAMES[s] + ' +' + pct(v * k), tx + 6, ty + 15 + i * 14, { size: 11, bold: true, col: C.ok }));
      const have = g.state.inv.cones.filter(cn => cn.id === id);
      ui.text(have.length ? 'В инвентаре: ' + have.map(cn => 'S' + (cn.sup || 1)).join(', ') : 'В инвентаре нет', x + 14, y + 150, { size: 11, col: have.length ? C.cream : C.dim });
      ui.text('Наложение S2–S5 усиливает бонус на 25% за шаг.', x + 14, y + 184, { size: 10, col: C.dim });
    },

    debugItemPreview(c, st, x, y) {
      const ui = this, g = this.game, id = itemIds()[st.it.i], d = itemDef(id);
      G.rarityCell(c, x + 14, y + 14, 80, 80, d.rar || 2);
      G.itemIcon(c, id, x + 22, y + 22, 64);
      const tx = x + 106, tw = 196;
      const lines = ui.wrap(d.name, tw, 13);
      lines.forEach((l, i) => ui.text(l, tx, y + 14 + i * 16, { size: 13, bold: true, serif: true, col: RAR_TXT[d.rar] || C.cream }));
      const ty = y + 18 + lines.length * 16;
      ui.text(KIND_NAME[d.kind] + ' · ' + '★'.repeat(d.rar || 2), tx, ty, { size: 11, col: C.sub });
      const have = MONEY[id] ? g.state[id] : g.state.inv.items[id] || 0;
      ui.text('В наличии: ' + H.fmt(have), tx, ty + 18, { size: 11, bold: true, col: have ? C.cream : C.dim });
      ui.wrap(d.text, 286, 11).slice(0, 4).forEach((l, i) => ui.text(l, x + 14, y + 108 + i * 15, { size: 11 }));
    },

    debugRelicPreview(c, st, x, y, w) {
      const ui = this, g = this.game, R = st.rl, setKey = Object.keys(H.RELIC_SETS)[R.set], set = H.RELIC_SETS[setKey], slot = H.RELIC_SLOTS[R.slot], roll = ROLLS[R.roll][1];
      G.rarityCell(c, x + 14, y + 14, 80, 80, 5);
      G.itemIcon(c, 'relic:' + slot.key, x + 18, y + 18, 72, setKey);
      const lines = ui.wrap(set.name, w - 120, 13);
      lines.forEach((l, i) => ui.text(l, x + 106, y + 16 + i * 16, { size: 13, bold: true, serif: true, col: C.gold }));
      ui.text(slot.name + ' · +' + R.lvl, x + 106, y + 22 + lines.length * 16, { size: 11, col: C.sub });
      ui.text(H.STAT_NAMES[R.main] + ' ' + ui.fmtStat(R.main, g.relicMain(R.main, R.lvl)), x + 14, y + 106, { size: 14, bold: true });
      const subs = R.subs.filter(Boolean);
      subs.forEach((k, i) => ui.text('· ' + H.STAT_NAMES[k] + ' ' + ui.fmtStat(k, g.relicSub(k, R.lvl, Math.max(1, R.lvl * 3), roll)), x + 16, y + 130 + i * 16, { size: 11, col: C.sub }));
      if (!subs.length) ui.text('Без дополнительных характеристик', x + 16, y + 130, { size: 11, col: C.dim });
      if (set.planar) ui.wrap('Сфера + вязь: ' + set.short, w - 28, 10).slice(0, 2).forEach((l, i) => ui.text(l, x + 14, y + 202 + i * 14, { size: 10, col: C.ok }));
      else {
        ui.text('2 шт.: ' + ui.setBonusText(setKey, 2), x + 14, y + 202, { size: 10, col: C.ok });
        ui.text('4 шт.: бонус ×2', x + 14, y + 216, { size: 10, col: C.ok });
      }
      c.fillStyle = 'rgba(242,220,154,0.25)'; c.fillRect(x + 14, y + 238, w - 28, 1);
      ui.text('Этот комплект в инвентаре', x + 14, y + 246, { size: 10, col: C.sub });
      H.RELIC_SLOTS.filter(sl => (sl.kind === 'planar') === !!set.planar).forEach((sl, i) => {
        const n = g.state.inv.relics.filter(r => r.set === setKey && r.slot === sl.key).length, cx = x + 14 + i * 68, cy = y + 264;
        c.save(); if (!n) c.globalAlpha = 0.35;
        G.rarityCell(c, cx, cy, 40, 40, 4);
        G.itemIcon(c, 'relic:' + sl.key, cx + 4, cy + 4, 32, setKey);
        c.restore();
        if (sl.key === slot.key) { c.strokeStyle = C.brassHi; c.lineWidth = 2; c.strokeRect(cx - 1, cy - 1, 42, 42); c.lineWidth = 1; }
        ui.text(sl.name, cx + 20, cy + 46, { size: 10, align: 'center', col: n ? C.cream : C.dim });
        ui.text(n + ' шт.', cx + 20, cy + 59, { size: 10, align: 'center', bold: !!n, col: n ? C.ok : C.dim });
      });
      ui.text('Всего реликвий: ' + g.state.inv.relics.length, x + 14, y + 350, { size: 10, col: C.dim });
    },

    debugSceneFrame(kind, id, S) {
      const ui = this, g = this.game;
      if (cineKind(kind)) {
        const key = kind + '|' + id + '|' + S.aim;
        if (preview.key !== key) { preview.key = key; preview.show = makeCine(ui, kind, id, AIMS[S.aim][0]); }
        loopShow(preview.show, ui.t);
        return preview.show.render();
      }
      if (kind === 'warp') return H.WarpIntro.render(g, { id, rar: H.CHARS[id].rarity }, ui.t % H.WarpIntro.length(id), WARP_BANS[S.ban][0] === 'std');
      if (kind === 'conv') {
        const key = 'conv|' + id;
        if (preview.key !== key) { preview.key = key; preview.show = new H.ConveneShow(ui, [{ kind: 'char', id, rar: H.CHARS[id].rarity, name: H.CHARS[id].name, res: 'new' }], { ban: 'conv' }); preview.show.begin([0]); }
        preview.show.rt = ui.t % preview.show.length(preview.show.item());
        return preview.show.render();
      }
      if (kind === 'guild') {
        const gen = id === 'trail' ? S.gen || g.state.gender : undefined, key = 'guild|' + id + '|' + (gen || '');
        if (preview.key !== key) { preview.key = key; preview.show = new H.ExplosionShow(ui, [{ kind: 'char', id, rar: H.CHARS[id].rarity, name: H.CHARS[id].name, res: 'new', gender: gen }], { ban: 'guild' }); preview.show.begin([0]); }
        preview.show.rt = ui.t % preview.show.length(preview.show.item());
        return preview.show.render();
      }
      if (kind === 'con') {
        const key = 'con|' + id;
        if (preview.key !== key) { preview.key = key; preview.show = new H.SpotlightShow(ui, [{ kind: 'char', id, rar: H.CHARS[id].rarity, name: H.CHARS[id].name, res: 'new' }], { ban: 'con' }); preview.show.begin([0]); }
        preview.show.rt = ui.t % preview.show.length(preview.show.item());
        return preview.show.render();
      }
      if (kind === 'mid') {
        const key = 'mid|' + id;
        if (preview.key !== key) { preview.key = key; preview.show = new H.MidnightShow(ui, [{ kind: 'char', id, rar: H.CHARS[id].rarity, name: H.CHARS[id].name, res: 'new' }], { ban: 'mid' }); preview.show.begin([0]); }
        preview.show.rt = ui.t % preview.show.length(preview.show.item());
        return preview.show.render();
      }
      if (kind === 'sig') {
        const key = 'sig|' + id;
        if (preview.key !== key) { preview.key = key; preview.show = new H.SignalShow(ui, [{ kind: 'char', id, rar: H.CHARS[id].rarity, name: H.CHARS[id].name, res: 'new' }], { ban: 'sig' }); preview.show.begin([0]); }
        preview.show.rt = ui.t % preview.show.length(preview.show.item());
        return preview.show.render();
      }
      const cv = preview.eid || (preview.eid = G.mkCanvas(W, HGT)), pc = cv.getContext('2d');
      H.Eidolons.scene(ui, pc, id, EID_STAGES[S.stage], null);
      return cv;
    },

    debugScenePreview(c, st, x, y) {
      const ui = this, S = st.sc, kind = sceneKind(st), { id } = sceneAt(st);
      const px = x + Math.round((316 - PV.w) / 2), py = y + 12;
      c.fillStyle = '#000000'; c.fillRect(px - 1, py - 1, PV.w + 2, PV.h + 2);
      const frame = ui.debugSceneFrame(kind, id, S), was = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = kind === 'eid';
      c.drawImage(frame, px, py, PV.w, PV.h);
      c.imageSmoothingEnabled = was;
      c.strokeStyle = C.brass; c.strokeRect(px - 0.5, py - 0.5, PV.w + 1, PV.h + 1);
    },

    debugSceneNotes(st) {
      const g = this.game, S = st.sc, kind = sceneKind(st), { id } = sceneAt(st), kit = sceneKit(g, kind, id), sec = v => v.toFixed(1).replace('.', ',') + ' с';
      if (cineKind(kind)) {
        if (preview.key !== kind + '|' + id + '|' + S.aim) this.debugSceneFrame(kind, id, S);
        if (kind === 'fus') {
          const f = H.FUSIONS[id], known = g.state.bank.fusions.includes(id);
          return ['«' + f.name + '» · ' + sec(preview.show.length), 'Пара: ' + f.members.map(k => showUnit(g, k).name).join(' + ') + '. Цель: ' + (AIM_TEXT[f.target] || f.target) + '.', known ? 'Слияние уже есть в Архиве.' : 'В Архиве его ещё нет. Просмотр не открывает.'];
        }
        return ['«' + kit.ult.name + '» · ' + sec(preview.show.length), 'Цель в бою: ' + (AIM_TEXT[kit.ult.target] || kit.ult.target) + '.', 'Ролик идёт с игровыми звуками.'];
      }
      if (kind === 'sig') {
        const L = this.debugSceneFrame(kind, id, S) && preview.show.length(preview.show.item());
        return ['Появление агента: ' + sec(L) + ' после ролика с телевизорами', 'Ранг ' + ({ 5: 'S', 4: 'A', 3: 'B' })[kit.rarity] + '. Сцена с прожекторами' + (kit.rarity === 5 ? ' и крупным планом.' : '.'), 'Поиск не тратит шифрокопии и не пишет историю.'];
      }
      if (kind === 'conv') {
        const L = this.debugSceneFrame(kind, id, S) && preview.show.length(preview.show.item()), own = H.CONVENE_CUTS[id];
        return ['Появление: ' + sec(L) + ' после ролика с приливом', own ? 'Своя сцена: ' + own.length + ' планов, затем поза и реплика.' : 'Волна со звёздами, затем берег' + (kit.rarity === 5 ? ' и звуковое кольцо.' : '.'), 'Призыв не тратит приливы и не пишет историю.'];
      }
      if (kind === 'con') {
        const L = this.debugSceneFrame(kind, id, S) && preview.show.length(preview.show.item()), her = H.SpotKit.heroine(id);
        return ['Появление: ' + sec(L) + ' после ролика с автобусом и прожектором', her ? 'Героиня Кон-Тона: под её тему, затем табличка и реплика.' : 'Прожектор, знак Пути на полу, вспышка и полароид, карточка жюри.', 'Прыжок не тратит нефрит и не пишется в историю.'];
      }
      if (kind === 'mid') {
        const L = this.debugSceneFrame(kind, id, S) && preview.show.length(preview.show.item()), ar = H.VELVET.arcanaOf(id);
        return ['Появление: ' + sec(L) + ' после ролика с Полуночным каналом', 'Карта ' + H.VELVET.arcanaName(ar) + ', затем ' + (kit.rarity === 5 ? 'синее пламя и золотое кольцо.' : 'синее пламя и поза.'), 'Прыжок не тратит бархатные ключи и не пишет историю.'];
      }
      if (kind === 'guild') {
        const L = this.debugSceneFrame(kind, id, S) && preview.show.length(preview.show.item()), own = H.EXPLOSION_CUTS[id];
        return ['Появление: ' + sec(L) + ' после ролика со взрывом', own ? (preview.show.cutsOf(preview.show.item()).length < own.length ? 'Дубликат: короткая сцена, ' + preview.show.cutsOf(preview.show.item()).length + ' плана из ' + own.length + '.' : 'Своя сцена: ' + own.length + ' планов с репликами, затем поза.') : 'Карта искателя приключений, затем холм на закате.', 'Набор не тратит манатит и не пишет историю.'];
      }
      if (kind === 'warp') {
        const said = H.WarpIntro.line(id, g);
        return ['Появление: ' + sec(H.WarpIntro.length(id)) + (kit.rarity === 5 ? ' и вступление 5★' : ''), said ? 'Реплика: «' + said + '»' : 'Без реплики.', 'Прыжок не тратит нефрит и не пишет историю.'];
      }
      const sc = H.Eidolons.SCENES[id], n = EID_STAGES[S.stage], r = g.state.roster[id];
      return ['Картина «' + sc.title + '»', n ? 'E' + n + ': «' + sc.frags[n - 1][0] + '»' : 'Нет ни одного фрагмента.', 'У вас: ' + (r ? 'E' + r.eid : 'нет персонажа') + '. Просмотр не меняет его.'];
    },

    debugCatalog(c, st, x, y, w) {
      const ui = this, g = this.game, tab = TABS[st.tab].id, row = tab === 'scenes' ? 1 : 0, focus = st.row === row;
      const views = st.views || (st.views = {}), view = tab === 'scenes' ? tab + ':' + sceneKind(st) : tab;
      const opt = (sel, set) => ({ rowH: 19, max: 19, size: 11, focus, scroll: views[view] || (views[view] = { top: 0, sel: null }), onClick: i => { if (sel === i && st.row === row) return; set(i); st.row = row; ui.sfx('select'); } });
      if (tab === 'chars') {
        const ids = charIds();
        ui.list(x, y, w, ids.map(id => {
          const r = g.state.roster[id], kitId = id === 'trail' ? g.kitOf('trail') : id;
          return { label: H.CHARS[kitId].name, col: r ? C.cream : C.sub, right: r ? 'ур. ' + r.lvl + ' · E' + r.eid : 'нет', rcol: r ? C.ok : C.dim, icon: (cc, ix, iy) => G.drawPortrait(cc, G.lookOf(kitId, g), ix, iy - 9, 18), iconW: 22 };
        }), st.ch.i, opt(st.ch.i, i => { st.ch.i = i; }));
      } else if (tab === 'cones') {
        const ids = coneIds();
        ui.list(x, y, w, ids.map(id => {
          const d = H.CONES[id], n = g.state.inv.cones.filter(cn => cn.id === id).length;
          return { label: d.name, col: RAR_TXT[d.rarity], right: n ? 'есть ' + n : '★'.repeat(d.rarity), rcol: n ? C.ok : C.dim, icon: (cc, ix, iy) => G.pathIcon(cc, d.path, ix, iy - 7, 14), iconW: 20 };
        }), st.cn.i, opt(st.cn.i, i => { st.cn.i = i; }));
      } else if (tab === 'scenes') {
        const kind = sceneKind(st), { ids, i } = sceneAt(st);
        ui.list(x, y, w, ids.map(id => {
          if (kind === 'fus') {
            const f = H.FUSIONS[id], known = g.state.bank.fusions.includes(id);
            return { label: f.name, col: RAR_TXT[fusionKit(id).rarity], right: known ? 'в Архиве' : 'нет', rcol: known ? C.ok : C.dim, icon: (cc, ix, iy) => { G.drawPortrait(cc, G.lookOf(f.members[0], g), ix, iy - 9, 18); G.drawPortrait(cc, G.lookOf(f.members[1], g), ix + 12, iy - 9, 18); }, iconW: 34 };
          }
          const kitId = kind === 'eid' ? g.kitOf(id) : id, d = H.CHARS[kitId], r = kind === 'eid' && g.state.roster[id];
          const right = kind === 'eid' ? (r ? 'E' + r.eid : 'нет') : '★'.repeat(d.rarity);
          return { label: sceneName(g, kind, id), col: RAR_TXT[d.rarity], right, rcol: kind === 'eid' ? (r ? C.ok : C.dim) : RAR_TXT[d.rarity], icon: (cc, ix, iy) => G.drawPortrait(cc, G.lookOf(kitId, g), ix, iy - 9, 18), iconW: 22 };
        }), i, opt(i, k => { st.sc.id = ids[k]; }));
      } else {
        const ids = itemIds();
        ui.list(x, y, w, ids.map(id => {
          const d = itemDef(id), n = MONEY[id] ? g.state[id] : g.state.inv.items[id] || 0;
          return { label: d.name, col: RAR_TXT[d.rar] || C.cream, right: n ? H.fmt(n) : '—', rcol: n ? C.sub : C.dim, icon: (cc, ix, iy) => G.itemIcon(cc, id, ix, iy - 9, 18), iconW: 22 };
        }), st.it.i, opt(st.it.i, i => { st.it.i = i; }));
      }
    },

    openDebugShow(st, all) {
      const ui = this, g = this.game, S = st.sc, kind = sceneKind(st), ids = sceneIds(kind);
      S.id = all ? ids[0] : sceneAt(st).id;
      const scr = {
        full: true, debug: true, show: null, all: !!all,
        begin(d) {
          if (d) { S.id = ids[wrapIdx(sceneAt(st).i + d, ids.length)]; ui.sfx('select'); }
          this.show = cineKind(kind) ? makeCine(ui, kind, S.id, AIMS[S.aim][0]) : kind === 'sig' ? makeSignal(ui, S.id, S) : kind === 'conv' ? makeConvene(ui, S.id, S) : kind === 'guild' ? makeGuild(ui, S.id, S) : kind === 'mid' ? makeMidnight(ui, S.id, S) : kind === 'con' ? makeSpotlight(ui, S.id, S) : makeWarp(ui, S.id, S);
          if (kind === 'sig') { ui.audio.stopSong(0); ui.audio.song('signal', this.show.phase === 'cine' ? 0 : H.SIGNAL_CINE); }
          if (kind === 'mid') { ui.audio.stopSong(0); ui.audio.song('aria', this.show.phase === 'cine' ? 0 : H.MIDNIGHT_CINE); }
          if (kind === 'con') { ui.audio.stopSong(0); ui.audio.song('ccc', this.show.phase === 'cine' ? H.SPOT_FILM_AT : H.SPOT_FILM_AT + H.SPOT_CINE); this.show.retheme(); }
        },
        stop() { this.show = null; this.all = false; ui.audio.stopSong(); },
        onClose() { ui.audio.stopSong(); },
        next() { if (this.all && sceneAt(st).i < ids.length - 1) this.begin(1); else this.stop(); },
        tick(dt) { if (this.show) { this.show.tick(dt); if (this.show.done) this.next(); } },
        draw(c) {
          if (this.show) {
            this.show.draw(c);
            if (this.all) ui.text('Подряд ' + (sceneAt(st).i + 1) + ' / ' + ids.length + ' · Backspace: стоп', W / 2, HGT - 14, { align: 'center', size: 10, col: C.sub });
            return;
          }
          ui.fullBg(c, false);
          const x = W / 2 - 170, y = 168, name = sceneName(g, kind, S.id), kit = sceneKit(g, kind, S.id);
          ui.win(x, y, 340, 118, { alpha: 0.92 });
          ui.text(SCENE_KINDS[S.kind].label, W / 2, y + 14, { align: 'center', size: 11, col: C.sub });
          ui.text(name, W / 2, y + 32, { align: 'center', size: 16, bold: true, serif: true, col: RAR_TXT[kit.rarity] });
          ui.text('Ролик закончился.', W / 2, y + 56, { align: 'center', size: 11, col: C.dim });
          ui.button(x + 24, y + 80, 140, 24, 'Ещё раз', () => this.key('ok', 'Enter'), { size: 11, bold: true, icon: SCENE_KINDS[S.kind].icon });
          ui.button(x + 176, y + 80, 140, 24, 'В меню', () => this.key('back', 'Escape'), { size: 11 });
          ui.hints([['Enter', 'Ещё раз'], ['←→', kind === 'fus' ? 'Слияние' : 'Персонаж'], ['Esc', 'В меню']], 12, HGT - 18);
        },
        key(k, code) {
          if (this.show) {
            if (code === 'Backspace') { this.stop(); return; }
            if (k === 'left' || k === 'right') { this.begin(k === 'left' ? -1 : 1); return; }
            if (code === 'Enter' || code === 'NumpadEnter') { if (kind === 'warp' || kind === 'sig' || kind === 'conv' || kind === 'guild' || kind === 'mid' || kind === 'con') this.show.enter(); else this.show.skip(); }
            else if (code === 'Escape') this.show.skip();
            if (this.show.done) this.next();
            return;
          }
          if (k === 'ok') this.begin(0);
          else if (k === 'left' || k === 'right') this.begin(k === 'left' ? -1 : 1);
          else if (k === 'back') { ui.pop(); ui.sfx('cancel'); }
        }
      };
      this.push(scr);
      scr.begin(0);
      return scr;
    },

    openDebugEidolon(st, play) {
      const ui = this, g = this.game, E = H.Eidolons, S = st.sc, ids = sceneIds('eid');
      S.id = sceneAt(st).id;
      const scr = {
        full: true, debug: true, asm: null,
        replay() { const A = assemblyOf(S); S.stage = A.stage; this.asm = new E.Assembly(A.from, A.to); },
        tick(dt) { if (this.asm) { this.asm.tick(dt, ui); if (this.asm.done) this.asm = null; } },
        draw(c) {
          const k = sceneAt(st).id, sc = E.SCENES[k], V = E.scene(ui, c, k, EID_STAGES[S.stage], this.asm);
          const cap = sceneName(g, 'eid', k) + ' · ' + sc.title, frag = V.shown ? ' · «' + sc.frags[V.shown - 1][0] + '»' : '';
          const sub = 'E' + V.shown + ' · ' + E.stageName(V.shown) + frag;
          const w = Math.max(280, Math.round(Math.max(ui.measure(cap, 13, true, true), ui.measure(sub, 10)) + 40)), x = Math.round(W / 2 - w / 2), y = HGT - 54;
          ui.win(x, y, w, 40, { alpha: 0.82 });
          ui.text(cap, W / 2, y + 7, { align: 'center', size: 13, bold: true, serif: true, col: C.gold });
          ui.text(sub, W / 2, y + 24, { align: 'center', size: 10, col: C.sub });
          if (this.asm) { ui.hints([['Любая клавиша', 'Пропустить']], W - 12, 12, { align: 'right' }); ui.hit(0, 0, W, HGT, () => { this.asm = null; }); }
          else ui.hints([['←→', 'Стадия'], ['Q/E', 'Персонаж'], ['Enter', 'Сборка'], ['Esc', 'В меню']], W - 12, 12, { align: 'right' });
        },
        key(k, code) {
          if (this.asm) { this.asm = null; return; }
          if (code === 'KeyQ' || code === 'KeyE') { S.id = ids[wrapIdx(sceneAt(st).i + (code === 'KeyQ' ? -1 : 1), ids.length)]; ui.sfx('select'); return; }
          if (k === 'left' || k === 'right') { S.stage = wrapIdx(S.stage + (k === 'left' ? -1 : 1), EID_STAGES.length); ui.sfx('select'); return; }
          if (k === 'ok') { this.replay(); return; }
          if (k === 'back') { ui.pop(); ui.sfx('cancel'); }
        }
      };
      this.push(scr);
      if (play) scr.replay();
      return scr;
    },

    openDebug() {
      const ui = this, g = this.game;
      const st = this.debugState = this.debugState || freshState();
      return this.push({
        full: true, debug: true,
        setTab(i) { if (i === st.tab) return; st.tab = i; st.row = 0; ui.sfx('select'); },
        act(f, a) { a.fn(); if (!a.view && ui.mode === 'battle' && ui.bt && st.log) { ui.bt.msg = 'Отладка: ' + st.log.text; ui.bt.msgT = 1.8; ui.bt.msgWarn = false; } },
        draw(c) {
          const f = ui.debugForm(st), n = f.rows.length + f.acts.length, tab = TABS[st.tab].id;
          st.row = Math.min(st.row, n - 1);
          ui.fullBg(c, false);
          c.fillStyle = 'rgba(4,6,20,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.plate(12, 10, 'Отладка');
          const tw = Math.floor((W - 148) / TABS.length);
          TABS.forEach((t, i) => ui.button(108 + i * tw, 8, tw - 4, 24, t.label, () => this.setTab(i), { active: i === st.tab, size: 11, icon: t.icon }));
          ui.closeBtn(W - 32, 10, () => ui.pop());
          const lx = 10, ly = 42, lw = 296, lh = 392, rx = 314, rw = 316;
          ui.win(lx, ly, lw, lh, { alpha: 0.9 });
          ui.win(rx, ly, rw, lh, { alpha: 0.9 });
          if (tab === 'relics') ui.debugRelicPreview(c, st, lx, ly, lw);
          else ui.debugCatalog(c, st, lx + 8, ly + 14, lw - 16);
          if (tab === 'chars') ui.debugCharPreview(c, st, rx, ly);
          if (tab === 'cones') ui.debugConePreview(c, st, rx, ly);
          if (tab === 'items') ui.debugItemPreview(c, st, rx, ly);
          if (tab === 'scenes') ui.debugScenePreview(c, st, rx, ly);
          const fy = tab === 'relics' ? ly + 16 : tab === 'scenes' ? ly + 190 : ly + 212;
          if (tab !== 'relics') { c.fillStyle = 'rgba(242,220,154,0.25)'; c.fillRect(rx + 14, fy - 8, rw - 28, 1); }
          f.rows.forEach((r, i) => ui.debugRow(c, st, r, i, rx + 8, fy + i * ROW_H, rw - 16));
          const ay = fy + f.rows.length * ROW_H + 8, aw = Math.floor((rw - 28 - (f.acts.length - 1) * 8) / f.acts.length);
          f.acts.forEach((a, i) => {
            const idx = f.rows.length + i;
            ui.button(rx + 14 + i * (aw + 8), ay, aw, 26, a.label, () => { st.row = idx; this.act(f, a); }, { active: st.row === idx, size: 11, bold: true, icon: a.icon });
          });
          if (tab === 'relics') {
            ['Основная характеристика зависит от слота.', 'Доп. характеристики: до четырёх, без повторов.', 'Уровень и броски задают их значения.'].forEach((l, i) => ui.text(l, rx + 14, ay + 40 + i * 14, { size: 10, col: C.dim }));
          }
          if (tab === 'scenes') ui.debugSceneNotes(st).forEach((l, i) => ui.text(fitLine(ui, l, rw - 28, 10), rx + 14, ay + 32 + i * 13, { size: 10, col: i ? C.dim : C.sub }));
          const by = HGT - 40;
          if (tab === 'scenes') ui.text('Ролики и картины не меняют сохранение.', 14, by, { size: 11, col: C.dim });
          else if (st.log) {
            const fresh = ui.t - st.log.t < 1.2;
            let text = 'Выдано: ' + st.log.text;
            while (text.length > 8 && ui.measure(text, 11, true) > 400) text = text.slice(0, -2) + '…';
            ui.text(text, 14, by, { size: 11, bold: true, col: fresh ? C.ok : C.sub });
          } else ui.text('Выдача сразу попадает в сохранение при следующей записи.', 14, by, { size: 11, col: C.dim });
          let mx = 450;
          mx += ui.money(mx, by, 'jade', g.state.jade) + 14;
          ui.money(mx, by, 'credits', g.state.credits);
          ui.hints(tab === 'scenes' ? [['Q/E', 'Раздел'], ['↑↓', 'Поле'], ['←→', 'Значение'], ['Enter', 'Смотреть'], ['F8', 'Закрыть']] : [['Q/E', 'Раздел'], ['↑↓', 'Поле'], ['←→', 'Значение'], ['Shift', 'Шаг больше'], ['Enter', 'Выдать'], ['F8', 'Закрыть']], 12, HGT - 18);
        },
        key(k, code) {
          if (k === 'back') { ui.pop(); return; }
          if (code === 'KeyQ' || code === 'KeyE') { this.setTab(wrapIdx(st.tab + (code === 'KeyQ' ? -1 : 1), TABS.length)); return; }
          if (/^Digit[1-9]$/.test(code) && +code.slice(5) <= TABS.length) { this.setTab(+code.slice(5) - 1); return; }
          const f = ui.debugForm(st), nr = f.rows.length, n = nr + f.acts.length;
          if (k === 'up' || k === 'down') { st.row = wrapIdx(Math.min(st.row, n - 1) + (k === 'up' ? -1 : 1), n); ui.sfx('select'); return; }
          if (k === 'left' || k === 'right') {
            const d = k === 'left' ? -1 : 1, r = f.rows[st.row];
            if (r && !r.fixed) { r.step(d); ui.sfx('select'); }
            else if (!r && f.acts.length > 1) { st.row = nr + wrapIdx(st.row - nr + d, f.acts.length); ui.sfx('select'); }
            return;
          }
          if (k === 'ok') this.act(f, st.row >= nr ? f.acts[st.row - nr] : f.acts[0]);
        }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
