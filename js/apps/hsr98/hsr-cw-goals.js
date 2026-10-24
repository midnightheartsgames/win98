(function (H) {
  'use strict';
  const CW = H.CW;
  const GP = H.Game.prototype;
  const has = (sum, k, n) => (sum.bonds || []).some(b => b.k === k && b.tier >= (n == null ? 0 : CW.BONDS[k].steps.indexOf(n)));
  const teamOf = run => run.board.on.concat(run.board.off).filter(Boolean);
  const itemsOf = u => u.items || [];
  const advN = u => itemsOf(u).filter(it => CW.ITEMS[it.id].kind === 'adv').length;

  const R_TASK = [{ items: { exp3: 4 } }, { items: { exp2: 6 } }];
  const GUIDE = [
    { name: 'Глава 1. Первая сделка', rew: { jade: 100, items: { exp3: 3 }, credits: 7500 }, tasks: [
      ['deploy2', 1, 'Выставить героя 2★'], ['buyExp', 4, 'Купить опыт 4 раза'], ['trackHero', 2, 'Отследить рекомендованное снаряжение двух героев'], ['adv3', 1, 'Надеть на одного героя 3 продвинутых предмета'], ['gold', 1, 'Включить связь золотой ступени']] },
    { name: 'Глава 2. Рост капитала', rew: { jade: 100, items: { exp3: 3 }, credits: 7500 }, tasks: [
      ['winQuick', 1, 'Победить в Быстрой игре'], ['track2bonds', 1, 'Отслеживать 2 связи сразу'], ['trackAdv', 5, 'Собрать по отслеживанию 5 продвинутых предметов'], ['streak5', 1, 'Серия из 5 побед в одной партии'], ['interest', 30, 'Получить 30 монет процентами'], ['star2x8', 1, 'Соединить 8 разных героев 2★ за партию']] },
    { name: 'Глава 3. Своё дело', rew: { jade: 100, items: { tracks: 1 }, credits: 7500 }, tasks: [
      ['winStd', 1, 'Пройти Стандартную игру'], ['applyGuide', 1, 'Применить руководство'], ['keyP', 10, 'Снять снаряжение точным ключом 10 раз'], ['rec3x3', 1, 'Одеть 3 героев полностью в рекомендованное'], ['furnace', 3, 'Использовать плавильную печь 3 раза'], ['lvl9', 1, 'Дойти до 9-го уровня'], ['goldWins', 2, 'Пройти 2 узла со связью золотой ступени']] },
    { name: 'Глава 4. Совет директоров', rew: { jade: 100, items: { exp3: 3 }, credits: 7500 }, tasks: [
      ['links', 10, 'Выполнить 10 заданий «Соединения связи»'], ['encHard', 2, 'Пройти 2 встречи сложности III и выше'], ['emblem2', 1, 'Надеть 2 разные эмблемы'], ['diaCraft', 3, 'Собрать из алмазов 3 эмблемы или самоцвета'], ['privCard', 2, 'Улучшить продвинутый предмет картой привилегии 2 раза'], ['projector', 4, 'Скопировать героев проекторами 4 раза'], ['winQuick', 1, 'Пройти Быструю игру']] }
  ];

  const REW = {
    normal: { jade: 20, items: { exp3: 3 }, credits: 5000 }, bonds: { items: { remains: 20 }, credits: 5000 }, master: { items: { remains: 20 }, credits: 5000 },
    high: { items: { remains: 20, exp2: 3 } }, ph1: { items: { remains: 20, exp2: 3 } }, ph2: { items: { remains: 20, exp2: 3 } }, ph3: { items: { remains: 20, exp2: 3 } }, last: { jade: 20 }
  };
  const val = run => teamOf(run).reduce((a, u) => a + CW.costOf(u) * Math.pow(3, u.star - 1), 0);
  const star3cost = (run, c) => teamOf(run).some(u => u.star >= 3 && CW.costOf(u) === c);
  const MASTER = [['xianzhou', 10], ['express', 6], ['underworld', 6], ['inaba', 6], ['break', 8], ['heal', 6], ['dot', 6], ['follow', 6], ['debuff', 6], ['aoe', 6], ['energy', 5], ['hpburn', 4], ['elation', 4]];
  const PROFIT = [
    { id: 'normal', name: 'Обычное испытание', tasks: [
      ['lvl10', 'Победа на 10-м уровне', (r) => r.lvl >= 10], ['earn400', 'Победа, заработав за партию 400 монет', r => r.earned >= 400], ['value100', 'Победа с командой ценностью 100 монет', r => val(r) >= 100], ['adv12', 'Победа, когда на героях 12 продвинутых предметов', r => teamOf(r).reduce((a, u) => a + advN(u), 0) >= 12],
      ['s3c1', 'Победа с героем 3★ стоимости 1', r => star3cost(r, 1)], ['s3c2', 'Победа с героем 3★ стоимости 2', r => star3cost(r, 2)], ['s3c3', 'Победа с героем 3★ стоимости 3', r => star3cost(r, 3)], ['s3c4', 'Победа с героем 3★ стоимости 4', r => star3cost(r, 4)],
      ['diff50', 'Победа над врагами сложности 50', r => r.diff + (r.diffPlus || 0) >= 50], ['team12', 'Победа с размером команды 12', (r, s, g) => g.cwTeamSize(r) >= 12]] },
    { id: 'bonds', name: 'Переплетение связей', tasks: [
      ['dnaTop', 'Забрать высшую награду «Космических учёных»', r => r.bond.dnaAt >= CW.BONDS.scholars.rewards.length], ['geoTop', 'Забрать высшую награду «Подземья»', r => r.bond.geoAt >= CW.BONDS.underworld.rewards.length], ['forms', 'Пройти партию обеими формами Брони', r => Object.keys((r.prog || {}).forms || {}).length >= 2], ['gm', 'Открыть «Консоль ГМ» Серебряного Волка', (r, s, g) => !!g.cwSpecial(r).gm],
      ['numby3', 'Сделать 3 вклада Счетовода за партию', r => ((r.prog || {}).numby || 0) >= 3], ['wild5', 'Сменить связь «Дикой карты» 5 раз за партию', r => ((r.prog || {}).wild || 0) >= 5], ['peppy3', 'Надеть на Пеппи 3 эмблемы', (r, s, g) => g.cwSpecial(r).peppy.length >= 3], ['echo5', 'Собрать за партию 5 Эхо «Фракцидуса»', r => ((r.prog || {}).echoes || 0) >= 5]] },
    { id: 'master', name: 'Путь мастера', tasks: MASTER.map(([k, n]) => ['m_' + k, 'Победа со связью «' + CW.BOND_NAMES[k] + '» ' + n, (r, s) => has(s, k, n)]) },
    { id: 'high', name: 'Высшая партия', min: 5, tasks: [
      ['streak15', 'Серия 15 побед в одной партии', r => ((r.prog || {}).streakMax || 0) >= 15], ['full8', 'Победа: выставлено 8 героев, у всех по 3 предмета', r => { const t = teamOf(r); return t.length >= 8 && t.every(u => itemsOf(u).length >= 3); }], ['four3', 'Победа с четырьмя героями 3★', r => teamOf(r).filter(u => u.star >= 3).length >= 4], ['s3c5', 'Победа с героем 3★ стоимости 5', r => star3cost(r, 5)],
      ['team7', 'Победа с размером команды не больше 7', (r, s, g) => g.cwTeamSize(r) <= 7], ['team13', 'Победа с размером команды 13', (r, s, g) => g.cwTeamSize(r) >= 13], ['diff80', 'Победа над врагами сложности 80', r => r.diff + (r.diffPlus || 0) >= 80], ['peppyH', 'Победа с Пеппи, у которого 3 эмблемы', (r, s, g) => g.cwSpecial(r).peppy.length >= 3],
      ['gems3', 'Победа с 3 самоцветами богатства', (r, s, g) => g.cwGems(r) >= 3], ['encore3', 'Победа с «Кон-Тоном» на бис 3 раза в финальном бою', r => ((r.prog || {}).finalEnc || 0) >= 3]] },
    { id: 'ph1', name: 'Награды фазы I', tasks: [
      ['xzsp', 'Победа с «Сяньчжоу» и «Очками навыков» сразу', (r, s) => has(s, 'xianzhou') && has(s, 'sp')], ['brin', 'Победа с «Пробитием» и «Командой расследования» сразу', (r, s) => has(s, 'break') && has(s, 'inaba')], ['sp3', 'Победа с «Очками навыков» 3', (r, s) => has(s, 'sp', 3)], ['ores50', '50 кристальных руд за партию', r => ((r.prog || {}).ores || 0) >= 50],
      ['sp3items', 'Победа с 3 особыми предметами на одном герое', r => teamOf(r).some(u => itemsOf(u).filter(it => it.sp).length >= 3)], ['cheap', 'Победа только героями стоимости до 3', r => teamOf(r).every(u => CW.costOf(u) <= 3)], ['dear', 'Победа только героями стоимости от 4', r => teamOf(r).every(u => CW.costOf(u) >= 4)], ['strat7', 'Победа с 7 и больше стратегиями', r => (r.strats || []).length >= 7]] },
    { id: 'ph2', name: 'Награды фазы II', tasks: [
      ['elhu', 'Победа с «Радостью» и «Охотниками» сразу', (r, s) => has(s, 'elation') && has(s, 'hunters')], ['foha', 'Победа с «Бонус-атакой» и «Хитрыми зайцами» сразу', (r, s) => has(s, 'follow') && has(s, 'hares')], ['el4', 'Победа с «Радостью» 4', (r, s) => has(s, 'elation', 4)], ['joy999', '999 Юмора за бой', r => ((r.prog || {}).joyMax || 0) >= 999],
      ['same3', 'Три одинаковых продвинутых предмета на одном герое', r => teamOf(r).some(u => { const c = {}; for (const it of itemsOf(u)) c[it.id] = (c[it.id] || 0) + 1; return Object.values(c).some(n => n >= 3); })], ['sw5', '3★ Серебряный Волк стоимости 5', r => teamOf(r).some(u => u.id === 'silverwolf' && u.lv && u.star >= 3)], ['hacks5', '5 разных компонентов взлома', (r, s, g) => new Set(g.cwSpecial(r).hacks.map(h => h.replace(/[PM]$/, ''))).size >= 5], ['encIV', 'Идеальная победа в финальной встрече IV при 3 призматических стратегиях', r => !!(r.prog || {}).encIV]] },
    { id: 'ph3', name: 'Награды фазы III', tasks: [
      ['s6dot', 'Победа с «Секцией 6» и «Периодическим уроном» сразу', (r, s) => has(s, 'section6') && has(s, 'dot')], ['frqu', 'Победа с «Фракцидусом» и «Квантовым резонансом» сразу', (r, s) => has(s, 'fractsidus') && has(s, 'quantum')], ['kz4', '«Отряд Казумы» 4 и «Удачный день» 5 раз за партию', (r, s) => has(s, 'kazuma', 4) && ((r.prog || {}).days || 0) >= 5], ['trash3', 'Три мусорных мешка в одной партии', r => ((r.prog || {}).trash || 0) >= 3],
      ['goldTrash', 'Золотой мусорный мешок на победе', (r, s, g) => g.cwInv(r).some(i => i.id === 'goldTrash') || teamOf(r).some(u => itemsOf(u).some(i => i.id === 'goldTrash'))], ['noOff', 'Победа без героев вне поля', r => !r.board.off.some(Boolean)], ['a8x10', '10 побед подряд на «Творце благ»', (r, s, g) => (g.cwGoals().cnt.a8streak || 0) >= 10], ['bestOff', 'Победа, где лучший по урону герой стоит вне поля', r => { const b = Object.entries(r.dmg).sort((a, c) => c[1] - a[1])[0]; return !!b && r.board.off.some(u => u && u.id === b[0]); }]] }
  ];

  const LINEUPS = [
    { id: 'lord', name: 'Повелитель молний', stars: 2, bonds: 'Сяньчжоу 7, Энергия 3', on: ['jingyuan', 'qingque', 'xueyi'], off: ['tingyun', 'yukong', 'huohuo', 'hanya', 'fuxuan', 'bailu'], tip: 'Собирайте Сяньчжоу: Повелитель бьёт тем чаще, чем больше членов.' },
    { id: 'express', name: 'Экспресс отправляется', stars: 1, bonds: 'Экипаж экспресса 6, Ослабление 4', on: ['welt', 'danheng', 'trail', 'imbibitor'], off: ['march', 'himeko', 'pela', 'nicole'], tip: 'Колея копится от членов экипажа: держите всех в команде.' },
    { id: 'engine', name: 'Двигатель созидания', stars: 2, bonds: 'Белобог 4, Подземье 4', on: ['bronya', 'gepard', 'seele', 'clara'], off: ['serval', 'pela', 'lynx', 'natasha'], tip: 'Броня выберет сторону, где больше героев: держите Подземье не меньше Белобога.' },
    { id: 'vein', name: 'Жила Подземья', stars: 1, bonds: 'Подземье 6', on: ['seele', 'luka', 'hook', 'clara'], off: ['natasha', 'sampo', 'bronya'], tip: 'Победы без «О гибели» дают вдвое больше геомарроу.' },
    { id: 'again', name: 'Ещё раз!', stars: 2, bonds: 'Команда расследования 6, Пробитие 4', on: ['yu', 'chie', 'kanji', 'sushang'], off: ['yosuke', 'yukiko', 'rise', 'anby'], tip: 'Пробития дают «Ещё раз!», а с ним приходит Общая атака.' },
    { id: 'lucky', name: 'Удачный день', stars: 2, bonds: 'Отряд Казумы 4, Радость 4', on: ['kazuma', 'aqua', 'darkness'], off: ['megumin', 'sampo', 'guinaifen', 'huohuo'], tip: 'Невезение копится само: «Удачный день» придёт к середине боя.' },
    { id: 'overload', name: 'Сверхвозбуждение', stars: 1, bonds: 'Периодический урон 6', on: ['hook', 'luka', 'kafka'], off: ['sampo', 'serval', 'guinaifen', 'yanagi', 'asta'], tip: 'Ходы врагов взрывают все эффекты: чем больше видов, тем лучше.' },
    { id: 'hunters', name: 'Звёздные охотники', stars: 3, bonds: 'Охотники 3, Сжигание НР 4', on: ['arlan', 'scar', 'silverwolf'], off: ['kafka', 'blade', 'jingliu'], tip: 'Звёздный охотник тот, у кого больше предметов.' },
    { id: 'eridu', name: 'Нью-Эриду', stars: 3, bonds: 'Секция 6 2, Хитрые зайцы 3, Пробитие 4', on: ['miyabi', 'billy', 'anby', 'chie'], off: ['yanagi', 'nicole'], tip: 'Заказы зайцев платят монеты: берите их каждый узел.' },
    { id: 'encore', name: 'Кон-Тон на бис', stars: 3, bonds: 'Кон-Тон 3, Квантовый резонанс 4', on: ['makoto', 'amanda', 'seele', 'phrolova'], off: ['talleah', 'fuxuan', 'silverwolf'], tip: 'Жюри оценивает урон Кон-Тона: на бис выходит тот, кто бьёт сильнее.' }
  ];

  Object.assign(GP, {
    cwGoals() {
      const C = this.cwMeta();
      if (!C.goals) C.goals = { cnt: {}, done: [], got: [], chap: [], profit: [], pgot: [], applied: null };
      return C.goals;
    },

    cwEv(name, n) {
      const Gs = this.cwGoals(), run = this.cw().run;
      Gs.cnt[name] = (Gs.cnt[name] || 0) + (n == null ? 1 : n);
      if (run) { run.prog = run.prog || {}; if (typeof run.prog[name] !== 'object') run.prog[name] = (run.prog[name] || 0) + (n == null ? 1 : n); }
      this.cwGuideCheck();
    },

    cwFlag(name) { const Gs = this.cwGoals(); if (!Gs.cnt[name]) this.cwEv(name); },

    cwGuideCheck() {
      const Gs = this.cwGoals(), C = this.cwPerks();
      const cnt = Object.assign({}, Gs.cnt, { links: C.links.done.length });
      GUIDE.forEach((ch, c) => ch.tasks.forEach(([k, need], i) => { const key = c + ':' + i; if (!Gs.done.includes(key) && (cnt[k] || 0) >= need) Gs.done.push(key); }));
    },

    cwGuideClaim(c, i) {
      const Gs = this.cwGoals(), key = c + ':' + i;
      if (!Gs.done.includes(key) || Gs.got.includes(key)) return null;
      Gs.got.push(key);
      this.cwMeta().asc.pts += 200;
      return ['200 очков продвижения'].concat(this.give(R_TASK[i % 2]));
    },

    cwChapterClaim(c) {
      const Gs = this.cwGoals(), ch = GUIDE[c];
      if (!ch || Gs.chap.includes(c) || ch.tasks.some((t, i) => !Gs.got.includes(c + ':' + i))) return null;
      Gs.chap.push(c);
      return this.give(ch.rew);
    },

    cwProfitCheck(run, sum) {
      const Gs = this.cwGoals(), out = [];
      if (!sum.cleared) return out;
      for (const grp of PROFIT) {
        if (grp.min && run.tier < grp.min) continue;
        for (const [id, , fn] of grp.tasks) {
          if (Gs.profit.includes(id)) continue;
          if (fn(run, sum, this)) { Gs.profit.push(id); out.push(id); }
        }
      }
      return out;
    },

    cwProfitClaim(id) {
      const Gs = this.cwGoals();
      if (!Gs.profit.includes(id) || Gs.pgot.includes(id)) return null;
      const grp = PROFIT.find(g => g.tasks.some(t => t[0] === id));
      const lastRow = grp.tasks[grp.tasks.length - 1][0] === id && grp.id !== 'normal';
      Gs.pgot.push(id);
      return this.give(lastRow ? REW.last : REW[grp.id]);
    },

    cwApplyGuide(id) {
      const Gs = this.cwGoals();
      Gs.applied = Gs.applied === id ? null : id;
      if (Gs.applied) this.cwEv('applyGuide');
      return Gs.applied;
    },

    cwGuideHeroes() { const L = LINEUPS.find(x => x.id === this.cwGoals().applied); return L ? L.on.concat(L.off) : []; },

    cwTrack(kind, id) {
      const run = this.cwRun();
      if (!run) return 'phase';
      const T = run.track || (run.track = { heroes: [], bonds: [] }), list = T[kind], cap = kind === 'heroes' ? 3 : 2;
      if (list.includes(id)) { list.splice(list.indexOf(id), 1); return 'off'; }
      if (list.length >= cap) list.shift();
      list.push(id);
      if (kind === 'heroes') { const S = this.cwGoals(); S.trackSeen = S.trackSeen || []; if (!S.trackSeen.includes(id)) { S.trackSeen.push(id); this.cwEv('trackHero'); } }
      if (kind === 'bonds' && list.length >= 2) this.cwFlag('track2bonds');
      return 'on';
    },

    cwTracked(run) { return run && run.track ? run.track : { heroes: [], bonds: [] }; }
  });

  const wrap = (name, fn) => { const f0 = GP[name]; GP[name] = function () { return fn.call(this, f0, arguments); }; };

  wrap('cwBuyExp', function (f0, a) { const r = f0.apply(this, a); if (r) this.cwEv('buyExp'); return r; });
  wrap('cwAddExp', function (f0, a) { const r = f0.apply(this, a); if (a[0] && a[0].lvl >= 9) this.cwFlag('lvl9'); return r; });
  wrap('cwMerge', function (f0, a) {
    const out = f0.apply(this, a), run = a[0];
    for (const m of out) if (m.star === 2) { run.prog = run.prog || {}; const s = run.prog.star2set || (run.prog.star2set = {}); s[m.id] = 1; if (Object.keys(s).length >= 8) this.cwFlag('star2x8'); }
    return out;
  });
  wrap('cwInvAdd', function (f0, a) { const r = f0.apply(this, a); if (a[1] === 'trash' && a[0]) { a[0].prog = a[0].prog || {}; a[0].prog.trash = (a[0].prog.trash || 0) + 1; } return r; });
  wrap('cwInvCombine', function (f0, a) {
    const run = this.cwRun(), inv = run && this.cwInv(run), A = inv && inv[a[0]], B = inv && inv[a[1]];
    const before = new Set((inv || []).map(x => x.uid)), dia = A && B && (['red', 'blue'].includes(A.id) || ['red', 'blue'].includes(B.id));
    const r = f0.apply(this, a);
    if (!r && inv) {
      const made = this.cwInv(run).filter(x => !before.has(x.uid));
      if (dia && made.some(x => ['emblem', 'gem'].includes(CW.ITEMS[x.id].kind))) this.cwEv('diaCraft');
      const recs = new Set(this.cwTracked(run).heroes.flatMap(id => this.cwRec(id)));
      if (made.some(x => CW.ITEMS[x.id].kind === 'adv' && recs.has(x.id))) this.cwEv('trackAdv');
    }
    return r;
  });
  wrap('cwUseOnUnit', function (f0, a) {
    const run = this.cwRun(), it = run && this.cwInv(run)[a[0]], id = it && it.id;
    const r = f0.apply(this, a);
    if (r == null && id) { if (id === 'keyP') this.cwEv('keyP'); if (id === 'furnace') this.cwEv('furnace'); if (id === 'projector' || id === 'pprojector') this.cwEv('projector'); }
    return r;
  });
  wrap('cwUseOnItem', function (f0, a) {
    const run = this.cwRun(), inv = run && this.cwInv(run), it = inv && inv[a[0]], tg = inv && inv[a[1]], id = it && it.id, adv = tg && CW.ITEMS[tg.id].kind === 'adv';
    const r = f0.apply(this, a);
    if (r == null && id === 'privCard' && adv) this.cwEv('privCard');
    return r;
  });
  wrap('cwInvest', function (f0, a) { const r = f0.apply(this, a); if (!r) this.cwEv('numby'); return r; });
  wrap('cwSetWild', function (f0, a) { const r = f0.apply(this, a); if (!r) this.cwEv('wild'); return r; });
  wrap('cwOpenOres', function (f0, a) { const r = f0.apply(this, a); if (a[0] && a[1]) { a[0].prog = a[0].prog || {}; a[0].prog.ores = (a[0].prog.ores || 0) + a[1].length; } return r; });
  wrap('cwCompile', function (f0, a) {
    const cw = f0.apply(this, a), run = a[0], team = teamOf(run);
    if (team.some(u => u.star >= 2)) this.cwFlag('deploy2');
    if (team.some(u => advN(u) >= 3)) this.cwFlag('adv3');
    if (Object.values(cw.tiers).some(t => t >= 2)) this.cwFlag('gold');
    if (team.filter(u => { const rec = this.cwRec(u.id); return itemsOf(u).length >= 3 && itemsOf(u).every(i => rec.includes(i.id)); }).length >= 3) this.cwFlag('rec3x3');
    const em = new Set(team.flatMap(u => itemsOf(u).filter(i => CW.ITEMS[i.id].kind === 'emblem').map(i => i.id)));
    if (em.size >= 2) this.cwFlag('emblem2');
    if (team.some(u => u.id === 'bronya') && cw.bronyaForm) { run.prog = run.prog || {}; (run.prog.forms = run.prog.forms || {})[cw.bronyaForm] = 1; }
    return cw;
  });
  wrap('cwBondRewards', function (f0, a) {
    const r = f0.apply(this, a), run = a[0], rec = a[1], f = run.fight || {};
    run.prog = run.prog || {};
    if (rec.kind === 'reward') return r;
    if (rec.win && f.tiers && Object.values(f.tiers).some(t => t >= 2)) this.cwEv('goldWins');
    if (rec.kind === 'enc' && rec.win && f.branch != null && f.branch >= 2) this.cwEv('encHard');
    if (rec.echoes) run.prog.echoes = (run.prog.echoes || 0) + rec.echoes;
    if (rec.kind === 'enc' && rec.win && !f.near && f.branch === 3 && (run.strats || []).filter(s => s.q === 'p').length >= 3) run.prog.encIV = true;
    if (rec.win) { run.prog.streakMax = Math.max(run.prog.streakMax || 0, run.streak); if (run.streak >= 5) this.cwFlag('streak5'); }
    if (rec.interest) this.cwEv('interest', rec.interest);
    return r;
  });
  wrap('cwEndBattle', function (f0, a) {
    const b = a[0], run = this.cw().run, I = b.cwInfo;
    if (run && I) {
      run.prog = run.prog || {};
      run.prog.days = (run.prog.days || 0) + (I.days || 0);
      run.prog.joyMax = Math.max(run.prog.joyMax || 0, I.joy || 0);
      if (b.cw.kind === 'boss' && run.plane === CW.MODES[run.mode].planes.length - 1) run.prog.finalEnc = I.encores || 0;
    }
    return f0.apply(this, a);
  });
  wrap('cwClose', function (f0, a) {
    const run = a[0], cleared = a[1];
    const sum = f0.apply(this, a), Gs = this.cwGoals();
    if (cleared) this.cwEv(run.mode === 'quick' ? 'winQuick' : 'winStd');
    if (run.tier >= 8) Gs.cnt.a8streak = cleared ? (Gs.cnt.a8streak || 0) + 1 : 0;
    sum.profit = this.cwProfitCheck(run, sum);
    this.cwGuideCheck();
    return sum;
  });

  CW.GUIDE = GUIDE;
  CW.PROFIT = PROFIT;
  CW.LINEUPS = LINEUPS;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
