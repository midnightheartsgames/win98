(function (H) {
  'use strict';
  const EN = H.ENEMIES;
  const TUN = {
    days: 42, quickMax: 3, histMax: 6,
    lvl: [40, 49, 58, 68], hp: [2.5, 2.7, 5, 5], atk: [2, 3, 5, 8], cycles: [5, 5, 4, 4],
    firstCycle: 150, cycle: 100, energyKill: 0.5,
    clear: 30000, stars: [40000, 50000, 60000], waveValue: [10000, 10000, 20000],
    normal: { d: 300, k: 200 }, boss: { d: 5000, k: 3000 },
    elite: { 2000: { d: 1500, k: 500 }, 3000: { d: 2000, k: 1000 }, 4000: { d: 2500, k: 1500 } },
    trotter: { 2000: { d: 500, k: 1500 }, 2500: { d: 1000, k: 1500 } },
    trotterFlee: 2, maxSpecial: 2, spawnHold: 0.12, pitch: { 4: 110, 5: 92 }, bossPitch: 160, bossSide: 83,
    shatter: [0, 0.06, 0.16, 0.3, 0.46, 0.66, 0.9], shatterHold: 0.1, exciteChance: 0.8, ruptureStep: 0.15, ruptureMax: 20,
    eloq: 12, eloqVuln: 5, eloqHold: 0.7,
    sharpFoes: { hp: [2.4, 4.2, 6, 6.5], atk: [4, 6, 7.5, 12] }, dotUp: 0.5, dotHp: 1.6, dotFoeCut: 0.35, dotAdv: 0.35, slander: 0.6, rumor: 0.08, rumorTurns: 2, defameHeal: 0.1, defameAdv: 0.08
  };

  EN.pf_trotter = Object.assign({}, EN.trotter, { id: 'pf_trotter', name: 'Свинка-копилка последовательности', flee: TUN.trotterFlee });

  const W = (max, list) => ({ max, pool: list.split(',').map(s => { const [id, n] = s.trim().split(' '); return [id, +n]; }) });
  const stage = (n, nodes, power = TUN) => ({ n, lvl: TUN.lvl[n - 1], hp: power.hp[n - 1], atk: power.atk[n - 1], cycles: TUN.cycles[n - 1], nodes: nodes.map(waves => ({ waves })) });
  const stage2 = (n, nodes) => stage(n, nodes, TUN.sharpFoes);

  const SEASONS = [{
    id: 's1', name: 'Крылатые слова Юцы', hero: 'himeko',
    whim: { id: 'shatter', name: 'Словарный раскол', text: 'Когда союзник использует абсолютную технику для атаки противника, на цель накладывается статус Раскол, который может складываться до 6 раз. В начале хода цели или когда цель побеждена, статус Раскол наносит ей и соседним целям фиксированный урон, который зависит от количества уровней статуса Раскол.' },
    caco: [
      { id: 'erupt', name: 'Извержение', text: 'Когда союзник использует абсолютную технику для атаки противника, цель дополнительно получает 1 ур. статуса Раскол.' },
      { id: 'excite', name: 'Воодушевление', text: 'Когда противник вступает в бой, появляется шанс 80% немедленно наложить на него 1 ур. статуса Раскол.' },
      { id: 'rupture', name: 'Раскалывание', text: 'Победа над противником со статусом Раскол повышает наносимый абсолютными техниками всех союзников в этом бою урон на 15%. Этот эффект может складываться до 20 раз.' }
    ],
    stages: [
      stage(1, [
        [W(5, 'beetle 4, spider 4, searing 1, windspawn 4'), W(5, 'reaver 6, distorter 6, pf_trotter 2'), W(5, 'beetle 8, spider 8, searing 2, windspawn 8')],
        [W(4, 'mara 4, ballista 4, ape 1, ghound 4'), W(4, 'alchemist 4, patroller 4, pf_trotter 2, dracolion 4'), W(4, 'mara 8, ballista 8, ape 2, ghound 8')]
      ]),
      stage(2, [
        [W(5, 'weaver 4, shadewalker 4, blazeout 1, thunderspawn 4'), W(5, 'mara 4, alchemist 4, pf_trotter 2, dragonfish 4'), W(5, 'weaver 8, shadewalker 8, blazeout 2, thunderspawn 8')],
        [W(4, 'vagrant 4, ipc_security 4, stormbringer 1, frostspawn 4'), W(4, 'ipc_field 6, ipc_security 6, pf_trotter 2'), W(4, 'vagrant 8, ipc_security 8, stormbringer 2, frostspawn 8')]
      ]),
      stage(3, [
        [W(4, 'ballista 4, dragonfish 4, ascended 1, windspawn 4'), W(4, 'weaver 4, beetle 4, pf_trotter 2, flamespawn 4'), W(4, 'ballista 8, dragonfish 8, ascended 2, windspawn 8')],
        [W(5, 'ipc_security 6, ipc_field 6, ipc_leader 1'), W(5, 'eliminator 4, vagrant 4, pf_trotter 2, baryon 4'), W(5, 'ipc_security 12, ipc_field 12, ipc_leader 2')]
      ]),
      stage(4, [
        [W(5, 'gunner 4, soldier 4, lieutenant 1, hound 4'), W(5, 'incinerator 6, weaver 6, pf_trotter 2'), W(5, 'gunner 12, soldier 12, gepard_b 1')],
        [W(4, 'spider 4, weaver 4, direwolf 1, vagrant 4'), W(4, 'vagrant 4, spider 4, pf_trotter 2, windspawn 4'), W(4, 'vagrant 8, spider 8, svarog_b 1, windspawn 8')]
      ])
    ]
  }, {
    id: 's2', name: 'Сказания о пойманной птице', hero: 'kafka',
    whim: { id: 'sharp', name: 'Слова острее ножа', text: 'Получаемый противниками периодический урон повышается на 50%. Урон, наносимый противниками с наложенным эффектом периодического урона, понижается на 35%, а будучи атакованными, их действие продвигается вперёд на 35%.', note: 'Периодический урон растёт вместе со здоровьем противников этапа, поэтому не теряет силы на поздних этапах.' },
    caco: [
      { id: 'slander', name: 'Клевета', text: 'Когда противник получает периодический урон, соседние цели так же получают периодический урон того же типа, равный 60% от изначального урона.' },
      { id: 'rumor', name: 'Слухи', text: 'После того как союзник атакует противника, он накладывает на цель статус Порыв ветра, который наносит цели фиксированный периодический ветряной урон в начале каждого её хода.' },
      { id: 'defame', name: 'Диффамация', text: 'Когда противник получает периодический урон, союзник с самым низким процентом НР восстанавливает 10% своего НР, и его действие продвигается вперёд на 8%.' }
    ],
    stages: [
      stage2(1, [
        [W(5, 'ghound 4, ballista 4, ape 1, frostspawn 4'), W(5, 'patroller 4, shadewalker 4, pf_trotter 2, incinerator 4'), W(5, 'ghound 8, patroller 8, blazeout 2, frostspawn 8')],
        [W(4, 'dragonfish 4, weaver 4, ascended 1, cloudtoad 4'), W(4, 'hound 6, gunner 6, pf_trotter 2'), W(4, 'dragonfish 8, weaver 8, ascended 2, cloudtoad 8')]
      ]),
      stage2(2, [
        [W(5, 'beetle 4, spider 4, decaying 1, incinerator 4'), W(5, 'reaver 6, distorter 6, pf_trotter 2'), W(5, 'beetle 8, spider 8, decaying 2, incinerator 8')],
        [W(4, 'shadewalker 4, weaver 4, iceout 1, frostspawn 4'), W(4, 'eliminator 4, mara 4, pf_trotter 2, antibaryon 4'), W(4, 'shadewalker 8, weaver 8, iceout 2, frostspawn 8')]
      ]),
      stage2(3, [
        [W(4, 'alchemist 4, gunner 4, guardian 1, thunderspawn 4'), W(4, 'ballista 4, ghound 4, pf_trotter 2, thunderspawn 4'), W(4, 'alchemist 8, gunner 8, guardian 2, thunderspawn 8')],
        [W(5, 'beetle 6, dragonfish 6, spectral 1'), W(5, 'soldier 4, hound 4, pf_trotter 2, cloudtoad 4'), W(5, 'beetle 12, dragonfish 12, spectral 2')]
      ]),
      stage2(4, [
        [W(4, 'beetle 4, spider 4, decaying 1, frostspawn 4'), W(4, 'soldier 4, hound 4, pf_trotter 2, cloudtoad 4'), W(4, 'patroller 12, dragonfish 12, yanqing_b 1')],
        [W(5, 'ipc_field 6, ipc_security 6, ipc_leader 1'), W(5, 'vagrant 6, eliminator 6, pf_trotter 2'), W(5, 'ipc_field 12, ipc_security 12, kafka_b 1')]
      ])
    ]
  }];

  const QUOTE = '«Люди верят, что документ, созданный с помощью копировального аппарата, точно повторяет оригинал, а также они верят, что история, рассказанная попугаем, является правдой», - Хелледон, историк ██.';

  const TUTORIAL = [
    'Все сражения в Чистом вымысле имеют ограничения по циклам. Сражение заканчивается, когда заканчиваются циклы или все противники побеждены. До окончания сражения противники будут непрестанно появляться. Чем больше противников вы победите, тем больше очков получите и, соответственно, наград.',
    'Оставшиеся до окончания битвы циклы будут отображаться в виде обратного отсчёта в порядке действий слева. Нанесение урона любому противнику до окончания циклов или победы над всеми противниками принесёт вам очки.',
    'Во время боя отображается текущая волна противников и прогресс победы над противниками в текущей волне.',
    'Финальные очки будут подсчитаны на основе общего количества очков, набранных в Узле 1 и Узле 2.'
  ];

  function rulesPages(season) {
    const f = H.fmt, keys = o => Object.keys(o).map(Number).sort((a, b) => a - b), span = o => { const k = keys(o); return f(k[0]) + (k.length > 1 ? '–' + f(k[k.length - 1]) : ''); };
    return [
      { tab: 'Обзор', blocks: [
        { h: 'Чистый вымысел' },
        { p: 'Чистый вымысел - это серии испытаний высокого уровня сложности. В этом режиме вам нужно пройти этапы испытания и набрать необходимое количество очков, чтобы получить награды. При достижении особых целей вы получите дополнительные награды.' },
        { p: 'Этапы и награды Чистого вымысла периодически обновляются.' },
        { p: 'После входа в Чистый вымысел вы временно отключитесь от внешнего мира. Вы не сможете выполнять следующие действия:' },
        { p: '● Изменять членов отряда.' },
        { p: '● Возвышать Световые конусы и Реликвии или повышать их уровни.' },
        { p: '● Возвышать персонажей или повышать их уровни.' },
        { p: '● Использовать любые расходные предметы в инвентаре.' },
        { p: 'В режиме Чистый вымысел при победе над противником персонажи восстанавливают лишь ' + Math.round(TUN.energyKill * 100) + '% от энергии, восстанавливаемой в обычном бою.' }
      ] },
      { tab: 'Нелепость и Какофония', blocks: [
        { h: 'Нелепость' },
        { p: 'У каждого сезона Чистого вымысла свои правила и особые эффекты этапов. Эффекты действуют только в битвах соответствующего сезона.' },
        { p: season.whim.name + '. ' + season.whim.text + (season.whim.note ? ' ' + season.whim.note : ''), col: 'gold' },
        { h: 'Какофония' },
        { p: 'В каждом сезоне Чистого вымысла даются различные усиления. Вы можете выбрать одно усиление для каждой команды на каждом этапе Чистого вымысла.' }
      ].concat(season.caco.map(it => ({ p: it.name + '. ' + it.text, col: 'gold' }))) },
      { tab: 'Очки и разблокировка', blocks: [
        { h: 'Очки' },
        { p: 'Во время боя противники будут постоянно появляться в течение ограниченного количества циклов. Очки будут начисляться за нанесение урона и победу над противниками.' },
        { p: 'Каждый этап состоит из двух сражений: Узел 1 и Узел 2. Ваши итоговые очки - очки, заработанные в обоих сражениях. В конце этапа будет обновляться рекорд ваших очков.' },
        { p: 'Обычный враг стоит ' + f(TUN.normal.d + TUN.normal.k) + ', элита ' + span(TUN.elite) + ', свинка-копилка ' + span(TUN.trotter) + ', босс ' + f(TUN.boss.d + TUN.boss.k) + '. Часть цены платит снятое здоровье, остальное победа.' },
        { p: 'Для прохождения этапа нужно ' + f(TUN.clear) + ' очков. Звёзды: ' + TUN.stars.map(f).join(', ') + '. Прохождение открывает следующий этап. Три звезды на этапе засчитывают три звезды всех этапов ниже.' },
        { h: 'Этапы' }
      ].concat(season.stages.map(s => ({ p: 'Этап ' + s.n + ': враги уровня ' + s.lvl + ', циклов на узел ' + s.cycles + '.' }))).concat([
        { h: 'Быстрая разблокировка' },
        { p: 'Будет записан максимальный этап, пройденный с 3 звёздами. В начале каждого сезона откроется соответствующий этап и все предыдущие.' },
        { p: 'После открытия вы можете сразу начать испытание на последнем максимальном этапе, пройденном с 3 звёздами. Когда вы завершите его с 3 звёздами, все предыдущие этапы засчитаются как пройденные с 3 звёздами, и вы получите соответствующие награды.' },
        { p: 'В настоящее время такое быстрое прохождение доступно для первых 3 этапов.' }
      ]) }
    ];
  }

  const STAR_TIERS = Array.from({ length: 12 }, (_, i) => ({ need: i + 1, jade: i < 8 ? 60 : 80, credits: 5000, feather: i >= 6 ? 100 : 0 }));
  const FICTION = { credits: 7500, lucent: 24, exp3: 3, exp2: 3, aether3: 3 };

  const kindOf = id => (id === 'pf_trotter' ? 'trotter' : EN[id].boss ? 'boss' : EN[id].elite ? 'elite' : 'normal');
  const special = id => EN[id].boss || EN[id].elite;
  const poolSize = wave => wave.pool.reduce((a, [, n]) => a + n, 0);

  function valuesOf(wave, wi) {
    if (wave.vals) return wave.vals;
    const count = { normal: 0, elite: 0, trotter: 0, boss: 0 };
    for (const [id, n] of wave.pool) count[kindOf(id)] += n;
    const each = TUN.normal.d + TUN.normal.k, big = TUN.boss.d + TUN.boss.k;
    const rest = TUN.waveValue[wi] - count.normal * each - count.boss * big;
    const share = kind => (count[kind] ? rest / count[kind] : 0);
    const vals = {};
    for (const [id] of wave.pool) {
      const kind = kindOf(id);
      vals[id] = kind === 'normal' ? TUN.normal : kind === 'boss' ? TUN.boss : TUN[kind][share(kind)];
    }
    wave.vals = vals;
    return vals;
  }

  function waveSum(wave, wi) {
    const vals = valuesOf(wave, wi);
    return wave.pool.reduce((a, [id, n]) => a + n * ((vals[id] || { d: NaN }).d + (vals[id] || { k: NaN }).k), 0);
  }

  function recOf(node) {
    const weight = {};
    node.waves.forEach((wave, wi) => {
      const vals = valuesOf(wave, wi);
      for (const [id, n] of wave.pool) {
        if (id === 'pf_trotter') continue;
        for (const e of EN[id].weak) weight[e] = (weight[e] || 0) + n * (vals[id].d + vals[id].k);
      }
    });
    return Object.keys(weight).sort((a, b) => weight[b] - weight[a] || a.localeCompare(b)).slice(0, 2);
  }

  const poolIds = () => {
    const out = new Set();
    for (const s of SEASONS) for (const st of s.stages) for (const node of st.nodes) for (const w of node.waves) for (const [id] of w.pool) out.add(id);
    return out;
  };

  const seasonOf = id => SEASONS.find(s => s.id === id);

  H.PF = { TUN, SEASONS, QUOTE, TUTORIAL, STAR_TIERS, FICTION, rulesPages, seasonOf, kindOf, special, poolSize, valuesOf, waveSum, recOf, poolIds };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
