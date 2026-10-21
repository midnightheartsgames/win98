(function (H) {
  'use strict';

  Object.assign(H.SPEAKERS, {
    kazuma: { name: 'Казума', char: 'kazuma' },
    aqua: { name: 'Аква', char: 'aqua' },
    megumin: { name: 'Мегумин', char: 'megumin' },
    darkness: { name: 'Даркнесс', char: 'darkness' },
    luna: { name: 'Луна', look: { skin: '#f8dcc8', hair: '#f2c45a', hairHi: '#ffe08a', tips: '#e8843a', tipsFade: true, tipsAt: 38, eye: '#7a4a28', bangs: 'parted', sides: 'jaw', back: 'short', crown: 'smooth', gloss: true, body: 'tallf', coat: 'offcoat', coatLen: 2, top: '#f4efe2', trim: '#262a52', lining: '#f4efe2', inner: '#f4efe2', sleeve: '#f4efe2', collar: 'bare', lower: '#5a7ab8', low: 'shorts', shoes: '#5a3422', acc: ['bun:#8a2a3a', 'bow:#c8303a', 'clasps:#f09a4a', 'redcuff:#262a52', 'bootcuff:#d8c49a'] } },
    wiz: { name: 'Виз', look: { skin: '#f8e0d4', hair: '#8a4a2a', hairHi: '#b06a3e', eye: '#c89a3a', bangs: 'swoop', sides: 'long', back: 'long', crown: 'smooth', gloss: true, ahoge: true, body: 'tallf', coat: 'robe', top: '#4e3c80', trim: '#e8b848', inner: '#d4c8f0', sleeve: '#4e3c80', collar: 'high', lower: '#d4c8f0', low: 'long', legs: '#3a3a5a', lining: '#4e3c80', shoes: '#3a3a5a', acc: ['waistbelt:#7a5ab8', 'frogknot:#e8b848'] } },
    vanir: { name: 'Ванир', look: { skin: '#f0d6c2', hair: '#262a48', eye: '#c83a3a', bangs: 'sweep', sides: 'none', back: 'short', crown: 'swept', body: 'tall', sex: 'm', coat: 'jacket', top: '#1e2040', trim: '#e8e8f0', inner: '#f2f2f6', collar: 'high', lower: '#1e2040', low: 'pants', shoes: '#141418', gloves: '#f2f2f6', acc: ['vanirmask:#f4f2ee', 'cravat:#e0d890', 'buttons:#c8a050'] } },
    chris: { name: 'Крис', look: { skin: '#f6dccb', hair: '#d4dcec', hairHi: '#f4f8ff', eye: '#7a5ab8', bangs: 'wisp', sides: 'jaw', back: 'short', crown: 'messy', body: 'f', coat: 'crop', top: '#2a2e3a', lining: '#4a8a3a', trim: '#4a8a3a', inner: '#2a2e3a', collar: 'bare', lower: '#3a6a7a', low: 'shorts', shoes: '#6a4428', acc: ['scarf:#9ae0d8', 'facescar', 'longglove1:#2a2e30', 'stockings:#f0f0f4', 'boots:#6a4428', 'hipbelt:#5a3a24'] } },
    dust: { name: 'Даст', look: { skin: '#f4d6c0', hair: '#f0d070', hairHi: '#fff0a0', eye: '#c84a3a', bangs: 'messy', sides: 'none', back: 'short', crown: 'spiky', body: 'm', sex: 'm', coat: 'jacket', top: '#b8323a', trim: '#f0e8e8', inner: '#2a2a34', collar: 'high', lower: '#6a4a30', low: 'pants', shoes: '#2a2a34', acc: ['bandage', 'choker:#2a2a30'] } },
    keith: { name: 'Кит', look: { skin: '#f4d6c0', hair: '#1e2030', eye: '#3a5ab8', bangs: 'sidepart', sides: 'jaw', back: 'nape', crown: 'neat', body: 'm', sex: 'm', coat: 'jacket', top: '#3a4a9a', trim: '#e8e8f0', inner: '#1e1e28', collar: 'fur', lower: '#1e1e28', low: 'pants', shoes: '#7a4a2a', tuck: true, acc: ['boots:#7a4a2a'] } },
    axman: { name: 'Горожанин', look: { skin: '#f0d0b8', hair: '#6a4a2a', eye: '#402a1a', bangs: 'neat', sides: 'none', back: 'short', crown: 'neat', body: 'm', sex: 'm', coat: 'closed', top: '#7a5a3a', trim: '#5a3a24', inner: '#e8dcc0', collar: 'v', lower: '#4a4a3a', low: 'pants', shoes: '#5a3a24', acc: ['tunicbelt:#5a3a24'] } },
    axwoman: { name: 'Горожанка', look: { skin: '#f6dccb', hair: '#b07a4a', eye: '#402a1a', bangs: 'parted', sides: 'long', back: 'shoulder', crown: 'smooth', body: 'f', coat: 'dress', top: '#5a7a4a', trim: '#f0e8d8', inner: '#f0e8d8', collar: 'scoop', lower: '#5a7a4a', low: 'long', legs: '#5a3a24', shoes: '#5a3a24', acc: ['kerchief:#c84a3a'] } },
    adventurer: { name: 'Искатель приключений', look: { skin: '#eccab0', hair: '#4a3a2a', eye: '#3a2a1a', bangs: 'messy', sides: 'none', back: 'short', crown: 'messy', body: 'm', sex: 'm', coat: 'tabard', top: '#8a8a96', trim: '#5a3a24', inner: '#6a4a30', collar: 'high', lower: '#4a3a2a', low: 'pants', shoes: '#3a2a1a', tuck: true, acc: ['pauldron:#9a9aa8', 'sword:#c8ccd4', 'boots:#3a2a1a'] } },
    axisnun: { name: 'Послушница Аксис', look: { skin: '#f6dccb', hair: '#3a6ac8', eye: '#3a6ac8', bangs: 'blunt', sides: 'long', back: 'long', crown: 'smooth', body: 'f', coat: 'robe', top: '#3a6ac8', trim: '#f4f4f8', inner: '#f4f4f8', collar: 'high', lower: '#f4f4f8', low: 'long', legs: '#2a3a6a', lining: '#3a6ac8', shoes: '#2a3a6a', acc: ['frogknot:#f4f4f8'] } },
    axguard: { name: 'Стражник', look: { skin: '#eccab0', hair: '#5a4a3a', eye: '#3a2a1a', bangs: 'neat', sides: 'none', back: 'short', crown: 'neat', body: 'm', sex: 'm', coat: 'tabard', top: '#3a5a8a', trim: '#e8c050', inner: '#9a9aa8', collar: 'high', lower: '#3a3a44', low: 'pants', shoes: '#2a2a30', tuck: true, acc: ['helmet:#9a9aa8', 'boots:#2a2a30'] } }
  });

  const E = o => Object.assign({ hp: 1, atk: 1, spd: 95, tough: 20, weak: [], resist: [], exp: 1, credits: 1, drops: [] }, o);

  Object.assign(H.CONTACT, {
    axel: { name: 'Монстры Акселя', react: { cute: 'eager', kind: 'happy', sing: 'happy', weird: 'happy', threat: 'scared', joke: 'angry', science: 'angry', bribe: 'angry', silent: 'none' },
      lines: { eager: 'Монстр довольно урчит и бросает к ногам что-то блестящее.', happy: 'Монстр моргает и уползает в камыши.', angry: 'Монстр раздувается от злости!', scared: 'Монстр пятится и плюхается в воду.', none: 'Монстр смотрит сквозь тебя и жуёт.' } }
  });

  Object.assign(H.ENEMIES, {
    ks_toad: E({ id: 'ks_toad', name: 'Гигантская жаба', fam: 'axel', shape: 'toad', col: ['#4a8a3a', '#8ac85a'], hp: 1.6, spd: 82, tough: 30, weak: ['fire', 'wind'], resist: ['phys'], exp: 1.2, credits: 1.2,
      skills: [{ n: 'Удар языком', w: 3, t: 'single', m: 1.1, e: 'phys' }, { n: 'Прыжок', w: 1, t: 'blast', m: 0.8, e: 'phys' }, { n: 'Проглотить', w: 2, t: 'single', m: 0.5, e: 'phys', fx: [{ k: 'swallow' }] }], gift: 'medkit' }),
    ks_toad_blue: E({ id: 'ks_toad_blue', name: 'Синяя жаба', fam: 'axel', shape: 'toad', col: ['#3a6aa8', '#6a9ad8'], hp: 1.5, spd: 88, tough: 30, weak: ['fire', 'elec'], resist: ['ice'], exp: 1.2, credits: 1.2,
      skills: [{ n: 'Удар языком', w: 3, t: 'single', m: 1.0, e: 'phys' }, { n: 'Ледяной плевок', w: 2, t: 'single', m: 1.1, e: 'ice', fx: [{ k: 'freeze', chance: 0.12 }] }, { n: 'Проглотить', w: 1, t: 'single', m: 0.5, e: 'phys', fx: [{ k: 'swallow' }] }], gift: 'medkit' }),
    ks_goblin: E({ id: 'ks_goblin', name: 'Гоблин', fam: 'axel', shape: 'goblin', col: ['#6a9a3a', '#7a5a3a'], hp: 0.8, atk: 0.9, spd: 105, tough: 20, weak: ['fire', 'wind', 'phys'], exp: 0.9, credits: 1,
      skills: [{ n: 'Удар дубиной', w: 3, t: 'single', m: 1.0, e: 'phys' }, { n: 'Толпой', w: 1, t: 'blast', m: 0.6, e: 'phys' }], gift: 'medkit' }),
    ks_goblin_shaman: E({ id: 'ks_goblin_shaman', name: 'Гоблин-шаман', fam: 'axel', shape: 'goblin', col: ['#5a8a4a', '#5a4a6a'], hp: 0.9, spd: 98, tough: 20, weak: ['phys', 'quant'], exp: 1.1, credits: 1.2,
      skills: [{ n: 'Огонёк', w: 3, t: 'single', m: 1.0, e: 'fire', fx: [{ k: 'dot', type: 'burn', m: 0.3, turns: 2, chance: 0.4 }] }, { n: 'Бубен', w: 1, t: 'rally' }], gift: 'jadeSmall' }),
    ks_doll: E({ id: 'ks_doll', name: 'Кукла Ванира', fam: 'axel', shape: 'doll', col: ['#1e2040', '#f4f2ee'], hp: 0.9, spd: 92, tough: 20, weak: ['phys', 'imag', 'fire'], exp: 1.1, credits: 1.4, pat: [0, 0, 1],
      skills: [{ n: 'Смешок', w: 1, t: 'single', m: 0.9, e: 'quant' }, { n: 'Самоподрыв', w: 1, t: 'all', m: 0.9, e: 'fire', self: 'die' }], gift: 'jadeSmall' }),
    ks_turret: E({ id: 'ks_turret', name: 'Турель-голем', fam: 'axel', shape: 'turret', col: ['#7a7468', '#ff6a3a'], hp: 1.3, atk: 1.1, spd: 85, tough: 40, weak: ['elec', 'wind', 'imag'], resist: ['phys'], exp: 1.3, credits: 1.4,
      skills: [{ n: 'Каменный залп', w: 2, t: 'blast', m: 1.0, e: 'phys' }, { n: 'Прицельный выстрел', w: 2, t: 'single', m: 1.4, e: 'phys' }], gift: 'medkit' }),
    ks_spider: E({ id: 'ks_spider', name: 'Паучий страж', fam: 'axel', shape: 'spider', col: ['#5a5a66', '#ff3a2a'], hp: 0.9, spd: 112, tough: 20, weak: ['fire', 'ice', 'phys'], exp: 1, credits: 1,
      skills: [{ n: 'Укус', w: 3, t: 'single', m: 1.0, e: 'phys' }, { n: 'Каменная сеть', w: 1, t: 'single', m: 0.6, e: 'phys', fx: [{ k: 'debuff', s: 'spdP', v: -0.15, turns: 2, name: 'Сеть', chance: 0.6 }] }], gift: 'jadeSmall' }),
    ks_proto: E({ id: 'ks_proto', name: 'Прототип Разрушителя', fam: 'boss', shape: 'proto', col: ['#6e6e7a', '#c85aff'], boss: true, proto: true, hp: 16, atk: 1.6, spd: 88, tough: 160, weak: ['imag', 'elec', 'fire'], resist: ['phys'], exp: 14, credits: 12, noContact: true,
      skills: [{ n: 'Топот', w: 2, t: 'all', m: 0.8, e: 'phys' }, { n: 'Луч ядра', w: 2, t: 'single', m: 1.7, e: 'fire' }, { n: 'Залп турелей', w: 2, t: 'blast', m: 1.1, e: 'phys' }, { n: 'Перегрев ядра', w: 0, t: 'all', m: 1.5, e: 'fire', core: true }],
      pat: [0, 1, 2, 1] }),
    ks_gator: E({ id: 'ks_gator', name: 'Свирепый аллигатор', fam: 'axel', shape: 'gator', col: ['#4a6a32', '#6a8a48'], hp: 1.3, atk: 1.1, spd: 100, tough: 30, weak: ['ice', 'elec'], resist: ['phys'], exp: 1.2, credits: 1.3,
      skills: [{ n: 'Укус', w: 3, t: 'single', m: 1.2, e: 'phys' }, { n: 'Удар хвостом', w: 1, t: 'blast', m: 0.8, e: 'phys' }], gift: 'medkit' }),
    ks_gator_big: E({ id: 'ks_gator_big', name: 'Вожак аллигаторов', fam: 'axel', shape: 'gator', col: ['#3a4a2a', '#5a6a40'], elite: true, hp: 3.6, atk: 1.25, spd: 96, tough: 60, weak: ['ice', 'elec'], resist: ['phys'], exp: 3, credits: 4,
      skills: [{ n: 'Смертельный крен', w: 2, t: 'single', m: 1.5, e: 'phys' }, { n: 'Удар хвостом', w: 2, t: 'all', m: 0.6, e: 'phys' }], gift: 'relic' }),
    ks_toad_gold: E({ id: 'ks_toad_gold', name: 'Золотая жаба', fam: 'axel', shape: 'toad', col: ['#c8a030', '#f0d060'], elite: true, hp: 4.2, atk: 1.2, spd: 86, tough: 60, weak: ['wind', 'imag'], resist: ['phys'], exp: 3, credits: 4,
      skills: [{ n: 'Удар языком', w: 2, t: 'single', m: 1.3, e: 'phys' }, { n: 'Тяжёлый прыжок', w: 2, t: 'all', m: 0.7, e: 'phys' }, { n: 'Проглотить', w: 2, t: 'single', m: 0.6, e: 'phys', fx: [{ k: 'swallow' }] }], gift: 'relic' })
  });

  if (!H.UNHOLY.includes('ks_doll')) H.UNHOLY.push('ks_doll');
  H.BOSS_JADE.ks_proto = H.BOSS_JADE.ks_proto || 60;
  const LAKE_WAVES = [['ks_gator:42', 'ks_gator:42'], ['ks_gator:42', 'ks_gator:43', 'ks_gator:42'], ['ks_gator_big:44', 'ks_gator:42', 'ks_gator:42'], ['ks_gator:43', 'ks_gator:43', 'ks_gator:43']];
  Object.assign(H.ENCOUNTERS, {
    ks_land: { enemies: ['ks_toad:40', 'ks_toad:40'], noFlee: true, bg: 'meadow' },
    ks_gate: { waves: [['ks_turret:45', 'ks_spider:44', 'ks_spider:44'], ['ks_turret:46', 'ks_turret:46']], noFlee: true, bg: 'meadow' },
    ks_proto: { enemies: ['ks_proto:50'], boss: true, noFlee: true, bg: 'meadow', music: 'boss' },
    ks_goblin_camp: { waves: [['ks_goblin:40', 'ks_goblin:40', 'ks_goblin_shaman:41'], ['ks_goblin:41', 'ks_goblin:41']], noFlee: true, bg: 'meadow' },
    ks_lake: { waves: LAKE_WAVES, noFlee: true, bg: 'meadow', ward: { name: 'Клетка Аквы', hp: 2.5, turns: 6, keeper: 'aqua' } },
    ks_lake_short: { waves: LAKE_WAVES.slice(0, 3), noFlee: true, bg: 'meadow', ward: { name: 'Клетка Аквы', hp: 2.5, turns: 4, keeper: 'aqua' } }
  });

  const QUESTS = {
    ks_q1: {
      name: 'Этому сигналу ответ!', giver: 'Пом-Пом', type: 'comp', ch: 'ks', face: 'kazuma', area: 'express',
      desc: 'Навигация Экспресса поймала сигнал, похожий на Стелларон. Он идёт из мира, которого нет на картах Пом-Пом.',
      reward: { credits: 2000, items: { exp1: 2 } },
      steps: { talk: { text: 'Поговорить с Пом-Пом в Общем вагоне', at: 'express:p', desc: 'Навигация Экспресса поймала сигнал, похожий на Стелларон. Пом-Пом ждёт команду в Общем вагоне.' } }
    },
    ks_q2: {
      name: 'Этому экспрессу мягкую посадку!', giver: 'Пом-Пом', type: 'comp', ch: 'ks', face: 'kazuma', area: 'ax_meadow',
      desc: 'Экспресс сел на лугу у стен незнакомого города. Здесь водятся жабы размером с вагон.',
      reward: { credits: 3000, items: { exp1: 2 } },
      steps: {
        meadow: { text: 'Осмотреться на лугу', at: 'ax_meadow:v', desc: 'Экспресс сел на лугу у стен незнакомого города.' },
        town: { text: 'Войти в Аксель с отрядом Казумы', at: 'ax_meadow:x', desc: 'Казума обещал отвести команду в гильдию искателей приключений. Ворота города на севере луга.' }
      }
    },
    ks_q3: {
      name: 'Этим чужакам карточки искателей!', giver: 'Казума', type: 'comp', ch: 'ks', face: 'kazuma', area: 'ax_guild',
      desc: 'В Акселе всё начинается с гильдии: там выдают карточки искателей приключений и задания.',
      reward: { credits: 4000, items: { exp2: 1 } },
      steps: {
        guild: { text: 'Пройти в Гильдию искателей приключений', at: 'ax_town:r', desc: 'Гильдия стоит на площади с фонтаном. Казума ждёт у входа.' },
        luna: { text: 'Зарегистрироваться у Луны', at: 'ax_guild:л', desc: 'Луна принимает новичков у стойки гильдии.' },
        dinner: { text: 'Поужинать с отрядом Казумы', at: 'ax_guild:к', desc: 'Карточки готовы. Отряд Казумы занял стол в таверне при гильдии.' }
      }
    }
  };

  const BOARD = [
    { id: 'ks_qa', title: 'Гигантские жабы', text: 'Пять гигантских жаб на лугах у западной стены. Платим за каждую.', rank: 1, eris: 25000, kpd: 34, map: 'ax_meadow', step: 'go' },
    { id: 'ks_qb', title: 'Обход холма у старого замка', text: 'Жители жалуются на ежедневный грохот с холма. Проверить и доложить.', rank: 1, eris: 10000, kpd: 41, map: 'ax_fort', step: 'hill' },
    { id: 'ks_qc', title: 'Очистить озеро', text: 'Вода в озере испортилась. Нужен жрец, который её очистит. Аллигаторы прилагаются.', rank: 2, eris: 30000, kpd: 12, map: 'ax_lake', step: 'go' }
  ];

  Object.assign(QUESTS, {
    ks_q4: {
      name: 'Этому отряду ночлег!', giver: 'Аква', type: 'comp', ch: 'ks', face: 'kazuma', area: 'ax_mansion',
      desc: 'Казума ушёл с командой Экспресса, а его отряд остался с тобой. Аква зовёт ночевать в особняк.',
      reward: { credits: 3000 },
      steps: {
        home: { text: 'Дойти с новым отрядом до особняка', at: 'ax_town:н', desc: 'Особняк Казумы стоит за северными воротами Акселя.' },
        house: { text: 'Войти в особняк', at: 'ax_estate:d', desc: 'Особняк на холме. Аква говорит, что призраков там больше нет.' }
      }
    },
    ks_q5: {
      name: 'Этому отряду задание с доски!', giver: 'Луна', type: 'comp', ch: 'ks', face: 'kazuma', area: 'ax_guild',
      desc: 'Обмен идёт сутки. За это время новый отряд должен выполнить задания с доски гильдии, а кукла Герты считает результат.',
      reward: { credits: 10000, items: { exp2: 2 } },
      steps: { board: { text: 'Взять задание на доске гильдии', at: 'ax_guild:б', desc: 'На доске гильдии висят задания для отряда. За раз берётся одно.' } }
    },
    ks_qa: {
      name: 'Этим жабам свежее мясо!', giver: 'Луна', type: 'comp', ch: 'ks', face: 'kazuma', area: 'ax_meadow',
      desc: 'Пять гигантских жаб на лугах у западной стены. Даркнесс выбрала это задание сама.',
      reward: { credits: 8000, items: { exp2: 2 } },
      steps: {
        go: { text: 'Выйти на луга за стенами', at: 'ax_town:x', desc: 'Жабы пасутся на лугах за южными воротами.' },
        hunt: { text: 'Победить гигантских жаб', count: ['k_ks_toad_a1', 'k_ks_toad_a2', 'k_ks_toad_a3', 'k_ks_toad_a4', 'k_ks_toad_a5'], at: 'ax_meadow:1', desc: 'Пять жаб разбрелись по лугу. Они глотают людей целиком, но не любят железо.' },
        gold: { text: 'Победить Золотую жабу у пруда', at: 'ax_meadow:6', desc: 'На шум вылезла жаба покрупнее, золотая.' },
        tadpole: { text: 'Проверить камыши у пруда', at: 'ax_meadow:т', desc: 'В камышах у пруда что-то плещется.' },
        report: { text: 'Доложить Луне', at: 'ax_guild:л', desc: 'Жабы побеждены. Награду выдаёт Луна.' }
      }
    },
    ks_i2: {
      name: 'Этим гоблинам идеальный отряд!', giver: 'Химико', type: 'comp', ch: 'ks', face: 'kazuma', area: 'ax_forest',
      desc: 'Команда Экспресса взяла в гильдии задание на гоблинов. Казума идёт с ними носильщиком.',
      reward: { credits: 5000, items: { exp2: 1 } },
      steps: { hunt: { text: 'Найти лагерь гоблинов в лесу', at: 'ax_forest:л', desc: 'Лагерь гоблинов стоит в северо-восточной части леса.' } }
    },
    ks_i3: {
      name: 'Этому подземелью тихий шаг!', giver: 'Герта', type: 'comp', ch: 'ks', face: 'kazuma', area: 'ax_keele2',
      desc: 'Сигнал, похожий на Стелларон, идёт из-под земли. Кукла Герты ведёт команду в Подземелье Киила.',
      reward: { credits: 6000, items: { exp2: 2 } },
      steps: {
        down: { text: 'Спуститься на нижний ярус подземелья', at: 'ax_keele1:d', desc: 'Лестница вниз в дальнем зале первого яруса. В коридорах ловушки.' },
        hall: { text: 'Найти источник сигнала', at: 'ax_keele2:п', desc: 'В нижнем зале что-то огромное.' }
      }
    },
    ks_q6: {
      name: 'Этой крепости экстренный сбор!', giver: 'Луна', type: 'comp', ch: 'ks', face: 'kazuma', area: 'ax_gate',
      desc: 'К Акселю идёт ранняя модель Разрушителя. Гильдия объявила экстренный сбор у южных ворот.',
      reward: { jade: 100, credits: 15000, items: { exp3: 2 } },
      steps: {
        gate: { text: 'Отбить турели у ворот', at: 'ax_gate:v', desc: 'Команда Экспресса держит турели, пока голем не подошёл к стене.' },
        boss: { text: 'Остановить Прототип Разрушителя', at: 'ax_gate:п', desc: 'Аква снимает барьер, Мегумин ломает ноги, Даркнесс держит удары, Казума крадёт ядро.' }
      }
    },
    ks_q7: {
      name: 'Этим отрядам обратно по домам!', giver: 'Казума', type: 'comp', ch: 'ks', face: 'kazuma', area: 'ax_meadow',
      desc: 'Голем остановлен, сигнал объяснён. Осталось проводить отряд Казумы домой и попрощаться у Экспресса.',
      reward: { credits: 20000, items: { mana: 1 }, outfit: 'kazuma_jersey' },
      steps: {
        home: { text: 'Проводить отряд Казумы до особняка', at: 'ax_estate:d', desc: 'Мегумин после взрыва не может идти, её несут домой.' },
        farewell: { text: 'Вернуться к Экспрессу на лугу', at: 'ax_meadow:e', desc: 'Экспресс ждёт на лугу. Отряд Казумы придёт проводить.' }
      }
    },
    ks_qc: {
      name: 'Этому озеру чистую воду!', giver: 'Луна', type: 'comp', ch: 'ks', face: 'kazuma', area: 'ax_lake',
      desc: 'Вода в озере к югу от лугов испортилась. Нужен жрец, который её очистит, а аллигаторы в камышах против.',
      reward: { credits: 9000, items: { exp2: 2 } },
      steps: {
        go: { text: 'Пройти через луга к озеру', at: 'ax_meadow:о', desc: 'Тропа к озеру уходит с лугов на юг.' },
        cage: { text: 'Опустить клетку с Аквой в озеро', at: 'ax_lake:к', desc: 'В конце мостков стоит железная клетка. Аква будет чистить воду изнутри.' },
        report: { text: 'Доложить Луне', at: 'ax_guild:л', desc: 'Озеро очищено. Награду выдаёт Луна.' }
      }
    },
    ks_qb: {
      name: 'Этому замку ежедневный взрыв!', giver: 'Луна', type: 'comp', ch: 'ks', face: 'kazuma', area: 'ax_fort',
      desc: 'Жители жалуются на грохот с холма у старого замка. Мегумин знает, откуда он берётся.',
      reward: { credits: 6000, items: { exp2: 1 } },
      steps: {
        hill: { text: 'Пройти через луга к холму у старого замка', at: 'ax_meadow:f', desc: 'Тропа к холму уходит с лугов на восток.' },
        top: { text: 'Подняться на вершину холма', at: 'ax_fort:в', desc: 'С вершины виден заброшенный замок.' },
        carry: { text: 'Донести Мегумин до гильдии', at: 'ax_guild:л', desc: 'После взрыва Мегумин не может идти. Её надо донести до гильдии на спине.' }
      }
    }
  });

  const SCRIPTS = {
    ax_gate_shut: [
      '|Высокие ворота Акселя заперты изнутри. За стеной шумит город.'
    ],
    ks_signal_talk: [
      { recap: 'Странный сигнал', text: 'Навигация Экспресса поймала сигнал, похожий на Стелларон. Он идёт из мира, которого нет ни на одной карте Пом-Пом. Герта отправила с командой свою куклу, чтобы собрать данные, и Экспресс взял курс на сигнал.' },
      'pompom|Пассажиры, смотрите сюда! Сигнал всё ещё идёт.',
      'himeko|Слабый, но ровный. Будто кто-то держит Стелларон в банке и не открывает крышку.',
      'march|Мир без названия? Отлично, значит, назовём его сами!',
      'danheng|Сначала посмотрим, кто там живёт. Может, название уже есть.',
      '|На диване сидит кукла Герты. Она не моргает.',
      'herta|Летите. Мне нужны замеры, а не ваши догадки.',
      { choice: [['Летим.', 'go'], ['Кукла полетит с нами?', 'doll']] },
      '#doll',
      'herta|Кукла и есть я. Только без необходимости вставать.',
      '#go',
      'pompom|Все по местам! Экспресс отправляется!',
      { flag: 'ks_signal' },
      { give: { credits: 2000, items: { exp1: 2 } } },
      { quest: 'ks_q1', step: 'done' },
      { cine: 'c_ks_land' },
      { flag: 'ks_land' },
      { quest: 'ks_q2', step: 'meadow' },
      { goto: ['ax_meadow', 'v'] },
      { script: 'ks_landing' }
    ],
    ks_landing: [
      { recap: 'Жаба на лугу', text: 'Экспресс сел на зелёном лугу у городских стен. Из камышей выбралась жаба ростом с вагон и проглотила Март 7. Первопроходец и Дань Хэн вытащили её, а вторую жабу накрыл взрыв с холма. Так команда встретила отряд Казумы.' },
      'march|Трава! Облака! Наконец-то не снег!',
      'danheng|Март, отойди от пруда. В камышах что-то шевелится.',
      'march|Да это просто лягушка. Ой... а большая какая.',
      '|Из камышей поднимается жаба ростом с вагон. Мелькает язык, и Март 7 исчезает у неё во рту.',
      'danheng|Проглотила. Быстрее, пока она не ушла под воду!',
      { guest: ['trail', 'danheng'], solo: true },
      { battle: 'ks_land' },
      { guest: null },
      '|Жаба выплёвывает Март 7 и валится в траву. Март с головы до ног в слизи.',
      'march|Фу-у-у! Она тёплая! Почему внутри жабы тепло?!',
      'danheng|Там ещё одна.',
      '|С холма за лугом доносится звонкий голос.',
      'megumin=Голос с холма|Отойдите от жабы! Сейчас будет взрыв!',
      '|Небо вспыхивает. Взрыв накрывает жабу целиком, а ударная волна сбивает команду с ног.',
      '|Когда пыль оседает, на месте жабы дымится воронка. По лугу идёт парень в зелёном плаще и несёт на спине девочку в шляпе ведьмы.',
      'kazuma|Девяносто баллов. Отдача хорошая, облако ровное. Минус десять за то, что рядом стояли люди.',
      'megumin|Люди? Я не видела людей. Я видела жабу.',
      'kazuma|Ты всегда видишь только жабу.',
      'aqua|Казума-а-а! Меня опять проглотили! Почему всегда меня?!',
      '|Из камышей выходит девушка в голубом, вся в слизи. За ней рыцарь в латах, совершенно сухой.',
      'darkness|Меня она выплюнула. Даже не распробовала. Неужели мои доспехи так плохи?',
      'kazuma|Жабы не любят железо. Радуйся.',
      'march|Э-э... Привет! Мы с поезда.',
      'kazuma|С какого ещё поезда?',
      '|Казума смотрит на Экспресс у пруда. Потом на Март. Потом опять на Экспресс.',
      'kazuma|Аква. Это твоих рук дело?',
      'aqua|Почему сразу я?! Я богиня воды, а не поездов!',
      'danheng|Меня зовут Дань Хэн. Мы ищем источник сигнала, похожего на Стелларон.',
      'kazuma|Сато Казума. Не знаю, что такое Стелларон, но если это опасно, то сначала в гильдию. Там всё равно надо сдать жаб.',
      'megumin|Казума, ты меня не представил.',
      'kazuma|Это Мегумин, она взрывает. Это Аква, она плачет. Это Даркнесс, она...',
      'darkness|Крестоносец. Я принимаю удары на себя.',
      'kazuma|...И это тоже.',
      { flag: 'ks_met' },
      { quest: 'ks_q2', step: 'town' }
    ],
    ks_town_enter: [
      { recap: 'Город Аксель', text: 'Отряд Казумы привёл команду Экспресса в Аксель, город начинающих искателей приключений. Гильдия стоит на площади у фонтана, туда и нужно идти первым делом.' },
      'kazuma|Добро пожаловать в Аксель. Сюда приходят все, кто только начал.',
      'march|А почему тогда стена такая высокая?',
      'kazuma|Потому что новички иногда приводят за собой то, от чего не могут убежать.',
      'megumin|Я ничего не привожу. Я всё взрываю на месте.',
      'kazuma|Гильдия на площади, у фонтана. Пошли, пока жабы не протухли.',
      { flag: 'ks_town' },
      { give: { credits: 3000, items: { exp1: 2 } } },
      { quest: 'ks_q2', step: 'done' },
      { quest: 'ks_q3', step: 'guild' }
    ],
    ks_guild_enter: [
      'kazuma|Стойка вон там. Луна оформит вам карточки.',
      { quest: 'ks_q3', step: 'luna' }
    ],
    ax_kazuma_square: [
      'kazuma|Гильдия вон там, большое здание с флагами. Пошли, сдадим жаб.'
    ],
    ax_vanir: [
      { if: 'ks_swap', jump: 'after' },
      { if: 'ks_town&!ks_vanir', jump: 'met' },
      'vanir|Лавка Виз открыта. Покупать не обязательно, но очень желательно.',
      { end: true },
      '#met',
      { recap: 'Предсказание Ванира', text: 'У лавки Виз метёт улицу Ванир в белой маске. Он предсказал Казуме, что тот вечером что-то обменяет, а к обеду следующего дня пожалеет об этом. Казума не поверил.' },
      'vanir|Фу-ха-ха-ха! Мальчишка Казума привёл гостей с неба.',
      'kazuma|Ванир. Ты знал, что они прилетят?',
      'vanir|Я знаю многое. Например, что сегодня вечером ты кое-что обменяешь, а завтра к обеду горько об этом пожалеешь.',
      'kazuma|Ничего я не собираюсь менять.',
      'vanir|Конечно, конечно. Ступай. Метла сама себя не подметёт.',
      '|Ванир возвращается к метле и довольно хмыкает.',
      { flag: 'ks_vanir' },
      { end: true },
      '#after',
      'vanir|Обменялись? Ах, какой чудесный запах досады. Мальчишка ещё не знает, как будет скучать.'
    ],
    ax_guard: [
      'axguard|Аксель, город начинающих искателей. Если у ворот увидите жабу, не кормите её.'
    ],
    ax_axis: [
      { party: 'aqua', jump: 'aqua' },
      'axisnun|Вступайте в орден Аксис! Богиня Аква прощает всё. Кроме последователей Эрис.',
      { end: true },
      '#aqua',
      { script: 'ax_axis_aqua' }
    ],
    ax_axis_aqua: [
      'axisnun|Госпожа Аква?! Ой... то есть какая похожая девушка. Простите, обозналась.',
      'aqua|Да это же я! Я и есть Аква!'
    ],
    ax_cabbage: [
      'axwoman=Торговка|Капуста свежая! Осенью держите кошелёк покрепче: она улетает вместе с ним.'
    ],
    ax_pots: [
      'axwoman=Гончарша|Горшки, кружки, банки. Банки для святой воды берите у Аксис, мои только для соленья.'
    ],
    ax_townsman: [
      'axman|Опять кто-то взорвал что-то за стеной. Каждый день в одно и то же время. Хоть часы сверяй.'
    ],
    ax_board_town: [
      '|Среди объявлений висит листок с портретом Казумы и подписью: «Осторожно: Кража. Держите вещи при себе».'
    ],
    ks_estate_arrive: [
      'aqua|Вот он, наш особняк! Большой, правда? Его подарили мне за изгнание призраков.',
      'darkness|Нам. Его подарили нам.',
      { quest: 'ks_q4', step: 'house' }
    ],
    ks_night: [
      { recap: 'Ночь в особняке', text: 'Первую ночь новый отряд провёл в особняке Казумы. Аква хвасталась изгнанием призраков, Мегумин познакомила с Чомусуке, а утром на столе нашлась записка куклы Герты: сутки, задания с доски гильдии, счёт идёт.' },
      '|В холле особняка пахнет свечами и чем-то подгоревшим.',
      'aqua|Добро пожаловать! Это я изгнала отсюда призраков. Сама. Почти без помощи.',
      'darkness|Твоя комната рядом с моей. Если ночью кто-то нападёт, кричи. Я встану у двери.',
      'aqua|Ужин! Кто готовит? Обычно готовит Казума.',
      'megumin|Обычно готовит Казума. Обычно будит Казума. Обычно...',
      '|Мегумин замолкает и гладит чёрную кошку с крылышками. Кошка смотрит на тебя без интереса.',
      'megumin|Это Чомусуке. Мой фамильяр. Не трогай её хвост.',
      { choice: [['Я приготовлю ужин.', 'cook'], ['А что есть в доме?', 'look']] },
      '#look',
      'darkness|Капуста. Казума купил много капусты.',
      'aqua|Опять капуста...',
      { jump: 'sleep' },
      '#cook',
      'aqua|Новый командир умеет готовить! Слышишь, Казума? Нас кормят!',
      '#sleep',
      '|Ночь проходит тихо. Почти. Под утро из комнаты Аквы доносится плач: ей снится жаба.',
      '|Утром на столе лежит записка куклы Герты: «Обмен на сутки. Задания с доски гильдии. Считаю всё».',
      'megumin|Сначала в гильдию, за заданием. А потом взрыв. Это не обсуждается.',
      { flag: 'ks_night' },
      { give: { credits: 3000 } },
      { quest: 'ks_q4', step: 'done' },
      { quest: 'ks_q5', step: 'board' }
    ],
    ax_mansion_bath: [
      '|Дверь в баню. Изнутри пахнет горячей водой и мылом.'
    ],
    ax_mansion_stairs: [
      '|Лестница наверх, к спальням отряда.'
    ],
    ax_mansion_bucket: [
      'aqua|Не трогай! Это мой головастик. Я назову его... потом назову.'
    ],
    ax_mansion_cat: [
      '|Чёрная кошка с крылышками отворачивается. К себе она подпускает только Мегумин и Казуму.'
    ],
    ax_mansion_table: [
      '|На кухонном столе стоит кастрюля с капустой. Под ней записка почерком Казумы: «Не есть. Это на завтра».'
    ],
    ax_board_first: [
      { flag: 'ks_board_seen' },
      'darkness|Вот это! «Гигантские жабы»! Самое слизкое задание на доске!',
      'aqua|Только не жабы...',
      { script: 'ax_board_open' }
    ],
    ax_board_open: [
      { ui: 'ksboard' },
      { if: '?ks_qa=go', jump: 'a' },
      { if: '?ks_qb=hill', jump: 'b' },
      { if: '?ks_qc=go', jump: 'c' },
      { end: true },
      '#a',
      'aqua|Жабы... Ладно. Но если меня проглотят, вытаскивай сразу.',
      { end: true },
      '#b',
      { script: 'ks_qb_take' },
      '#c',
      { script: 'ks_qc_take' }
    ],
    ks_qc_take: [
      'aqua|Очистить озеро? Это работа для богини воды! Наконец-то задание, где я главная!',
      'darkness|Там свирепые аллигаторы...'
    ],
    ks_qc_arrive: [
      'darkness|Аллигаторы! Свирепые! Я пойду первой.',
      'aqua|Мне нужна клетка. Очень крепкая клетка.',
      { quest: 'ks_qc', step: 'cage' }
    ],
    ax_lake_cage: [
      { if: '?ks_qc=cage', jump: 'quest' },
      '|Железная клетка для ловли монстров. Прутья в следах зубов.',
      { end: true },
      '#quest',
      { script: 'ks_qc_cage' }
    ],
    ks_qc_cage: [
      { recap: 'Клетка в озере', text: 'Аква села в железную клетку, клетку опустили в озеро, и пока богиня касалась воды, вода очищалась. Аллигаторы всё это время грызли прутья, а отряд их отгонял.' },
      '|В конце мостков стоит железная клетка гильдии для ловли монстров.',
      'aqua|Я сяду в клетку, а вы опустите её в воду. Пока я касаюсь воды, она очищается. Это не быстро.',
      'darkness|А аллигаторы?',
      'aqua|Аллигаторы будут грызть клетку. Не меня. Клетку!',
      { choice: [['Сиди до конца.', 'full'], ['Выйдешь, когда станет страшно.', 'early']] },
      '#early',
      { flag: 'ks_cage_early' },
      'aqua|Правда можно? Тогда я выйду пораньше. Совсем чуть-чуть.',
      { battle: 'ks_lake_short' },
      { script: 'ks_qc_after' },
      '#full',
      'aqua|До конца... Хорошо. Я же богиня.',
      { battle: 'ks_lake' },
      { script: 'ks_qc_after' }
    ],
    ks_qc_after: [
      { if: 'ks_cage_broken', jump: 'broken' },
      'aqua|Мир... за клеткой... такой страшный...',
      'megumin|Озеро чистое. А вот Аква нет.',
      { quest: 'ks_qc', step: 'report' },
      { end: true },
      '#broken',
      'aqua|Клетка сломалась! Они меня чуть не съели! Я хочу домой!',
      'darkness|А меня так никто и не укусил. Обидно.',
      { quest: 'ks_qc', step: 'report' }
    ],
    ks_qc_report: [
      { recap: 'Чистое озеро', text: 'Луна приняла отчёт об озере и выдала награду. Если клетка сломалась или Аква вышла раньше, гильдия вычла часть денег за клетку или за грязную воду у дальнего берега.' },
      'luna|Озеро снова чистое! Тридцать тысяч эрис.',
      { if: 'ks_cage_broken', jump: 'cage' },
      { if: 'ks_cage_early', jump: 'early' },
      { jump: 'pay' },
      '#cage',
      'luna|Только клетку гильдии вы вернули по частям. За неё вычтем.',
      { jump: 'pay' },
      '#early',
      'luna|У дальнего берега вода ещё мутная, но задание засчитано.',
      '#pay',
      'aqua|Опять вычитают...',
      '|На карточке искателя загорается новое очко навыка.',
      { flag: 'ks_lake' },
      { give: { credits: 9000, items: { exp2: 2 } } },
      { quest: 'ks_qc', step: 'done' },
      { script: 'ks_board_next' }
    ],
    ks_qb_take: [
      { recap: 'Обход холма', text: 'Новый отряд взял обход холма у старого замка. Аква предложила оставить Мегумин дома, чтобы обойтись без взрыва.' },
      'aqua|Обход холма? Значит, Мегумин опять устроит взрыв. Может, оставим её дома?',
      'megumin|Только попробуйте.',
      { choice: [['Мегумин идёт с нами.', 'take'], ['Пусть Мегумин останется.', 'leave']] },
      '#leave',
      { flag: 'ks_mg_left' },
      { guest: ['trail', 'aqua', 'darkness'], solo: true },
      'megumin|...Хорошо. Я посижу дома. Совсем одна.',
      { end: true },
      '#take',
      'megumin|Правильный выбор. Взрыв ждать не будет.'
    ],
    ks_qa_start: [
      { recap: 'Охота на жаб', text: 'На лугу пять гигантских жаб. Даркнесс попросилась пойти первой, а Аква предупредила, что к пруду лучше не подходить.' },
      'darkness|Жабы! Целых пять! Позволь мне пойти первой.',
      'aqua|Только держитесь подальше от пруда. В прошлый раз меня там...',
      { choice: [['Иди первой.', 'first'], ['Держись рядом.', 'near']] },
      '#first',
      { flag: 'ks_dk_first' },
      'darkness|Ах! Она меня... выплюнула. Даже не попробовала.',
      'aqua|Зато теперь все жабы знают, что мы здесь!',
      { jump: 'go' },
      '#near',
      'darkness|...Как скажешь. Но если жаба захочет меня проглотить, не мешай ей.',
      '#go',
      { quest: 'ks_qa', step: 'hunt' }
    ],
    ks_tadpole: [
      { recap: 'Головастик', text: 'В камышах у пруда нашёлся фиолетовый головастик гигантской жабы. Аква решила забрать его в особняк, хотя Даркнесс напомнила, что Казума будет против.' },
      '|В камышах что-то плещется. Из воды смотрит фиолетовый головастик размером с котёнка.',
      'aqua|Ой! Маленький! Это же детёныш гигантской жабы!',
      'darkness|Если он вырастет, станет такой же жабой.',
      'aqua|Значит, вырастет хорошей жабой. Я заберу его домой.',
      'darkness|Казума будет против.',
      'aqua|Казумы здесь нет!',
      { flag: 'ks_tadpole' },
      { quest: 'ks_qa', step: 'report' }
    ],
    ks_qa_report: [
      { recap: 'Награда за жаб', text: 'Луна приняла отчёт о жабах и выдала награду. Из неё сразу вычли часть долга Аквы за городские стены.' },
      'luna|Пять гигантских жаб и золотая? Двадцать пять тысяч эрис и премия за золотую.',
      'aqua|Богатые! Мы богатые!',
      'luna|Из этих денег вычитается долг за городские стены.',
      'aqua|...',
      '|На карточке искателя загорается новое очко навыка.',
      { flag: 'ks_toads' },
      { give: { credits: 8000, items: { exp2: 2 } } },
      { quest: 'ks_qa', step: 'done' },
      { script: 'ks_board_next' }
    ],
    ks_board_next: [
      { if: 'ks_toads&ks_blast&ks_lake', jump: 'all' },
      { if: '!ks_i1', jump: 'i1' },
      { if: '!ks_i2', jump: 'i2' },
      { end: true },
      '#i1',
      { script: 'ks_i1' },
      '#i2',
      { script: 'ks_i2_start' },
      '#all',
      { give: { credits: 10000, items: { exp2: 2 } } },
      { quest: 'ks_q5', step: 'done' },
      { script: 'ks_i3_start' }
    ],
    ks_i1: [
      { recap: 'Носильщик в вагоне', text: 'Пока новый отряд выполнял задание, Казума сидел в Общем вагоне Экспресса. Пом-Пом сделал его помощником проводника, Март сфотографировала его с тряпкой, а кукла Герты показала первый отчёт.' },
      { guest: ['kazuma', 'march', 'danheng', 'himeko'], solo: true },
      { goto: ['express', 'v'] },
      '|Тем временем в Общем вагоне Звёздного экспресса.',
      'kazuma|Мягкий диван. Горячий кофе. Никто не плачет, никто не взрывается.',
      'himeko|Нравится? Пом-Пом сказал, что раз ты едешь с нами, ты пассажир. А у пассажиров есть обязанности.',
      'pompom|Проверка билетов! Пассажир Казума, ваш билет!',
      'kazuma|У меня карточка искателя.',
      'pompom|Это не билет! Пом-Пом назначает тебя помощником проводника. Протри окна.',
      '|Казума протирает окна. Март 7 фотографирует его с тряпкой.',
      'march|Для альбома! «Первый день в нормальном отряде».',
      'herta|Отчёт готов. Посмотрим, кто как провёл утро.',
      { ui: 'ksreport' },
      'kazuma|Девяносто с лишним процентов... А я что делал?',
      'herta|Протирал окна. Хорошо протирал, кстати.',
      { flag: 'ks_i1' },
      { guest: ['trail', 'aqua', 'megumin', 'darkness'], solo: true },
      { goto: ['ax_guild', 'v'] },
      '|А в гильдии новый отряд Казумы ждёт следующего задания.'
    ],
    ks_i2_start: [
      { recap: 'Гоблины и носильщик', text: 'Команда Экспресса взяла в гильдии задание на гоблинов, а Казума пошёл с ними носильщиком, как когда-то с отрядом Даста.' },
      { guest: ['kazuma', 'march', 'danheng', 'himeko'], solo: true },
      { goto: ['ax_forest', 'v'] },
      '|Тем временем команда Экспресса взяла в гильдии задание на гоблинов. Казума идёт с ними.',
      'danheng|Лагерь гоблинов к северо-востоку. Пройдём лесом.',
      'kazuma|Я понесу сумки. Как всегда.',
      'march|Мы не просили! Ты сам взял.',
      'kazuma|Привычка.',
      { quest: 'ks_i2', step: 'hunt' }
    ],
    ax_goblin_camp: [
      { if: '?ks_i2=hunt', jump: 'camp' },
      '|Брошенный лагерь гоблинов. Костёр давно погас.',
      { end: true },
      '#camp',
      { script: 'ks_i2_camp' }
    ],
    ks_i2_camp: [
      { recap: 'Лагерь гоблинов', text: 'Команда Экспресса разбила лагерь гоблинов почти без участия Казумы. Его Кража принесла мешок камней, а сам Казума признался, что в отряде, где никто не ошибается, ему скучно.' },
      'himeko|Вот и лагерь. Март, слева. Дань Хэн, справа. Казума... держи сумки.',
      { battle: 'ks_goblin_camp' },
      '|Казума ловко крадёт у последнего гоблина мешок. В мешке камни.',
      'kazuma|Кража сработала. Просто красть было нечего.',
      'himeko|Отличная работа. Все целы, задание за час.',
      'danheng|Казума, ты почти не сражался.',
      'kazuma|Вас не надо прикрывать. Никто не промахивается, никто не плачет. Мне скучно.',
      'herta|Скука не входит в отчёт. Цифры входят.',
      { ui: 'ksreport' },
      { flag: 'ks_i2' },
      { give: { credits: 5000, items: { exp2: 1 } } },
      { quest: 'ks_i2', step: 'done' },
      { guest: ['trail', 'aqua', 'megumin', 'darkness'], solo: true },
      { goto: ['ax_guild', 'v'] },
      '|Новый отряд Казумы возвращается в гильдию за последним заданием.'
    ],
    ks_i3_start: [
      { recap: 'Сигнал под землёй', text: 'Кукла Герты нашла, откуда идёт сигнал: из Подземелья Киила под лесом. Казума повёл команду Экспресса вниз, потому что уже бывал там со своим отрядом.' },
      { guest: ['kazuma', 'march', 'danheng', 'himeko'], solo: true },
      { flag: 'ks_i3_go' },
      { goto: ['ax_keele1', 'v'] },
      '|Тем временем кукла Герты привела команду Экспресса к источнику сигнала. Он идёт из-под земли.',
      'herta|Сигнал внизу. Сильный. Это не Стелларон, но очень похоже.',
      'kazuma|Подземелье Киила давно пустое. Мы тут уже были.',
      'danheng|Тогда ты знаешь дорогу.',
      { quest: 'ks_i3', step: 'down' }
    ],
    ks_i3_hall: [
      'herta|Источник прямо здесь. Не трогайте ничего без меня.',
      { quest: 'ks_i3', step: 'hall' }
    ],
    ks_trap1: [
      'kazuma|Стоп. Под ногой плита. Обходим по краю.',
      'march|Как ты её заметил?!',
      { flag: 'ks_trap1' }
    ],
    ks_trap2: [
      'kazuma|Здесь растяжка. Перешагиваем.',
      'danheng|Внимательно.',
      { flag: 'ks_trap2' }
    ],
    ks_trap3: [
      'kazuma|Обнаружение ловушек. Хоть где-то пригодилось.',
      'himeko|Пригодилось, и ещё как.',
      { flag: 'ks_trap3' }
    ],
    ax_proto: [
      { if: '?ks_i3=hall', jump: 'wake' },
      '|Пустое место, где спал каменный паук. В потолке дыра.',
      { end: true },
      '#wake',
      { script: 'ks_i3_wake' }
    ],
    ks_i3_wake: [
      { recap: 'Ранний Разрушитель', text: 'В нижнем зале спал каменный паук с вечным кристаллом в груди, ранняя модель Разрушителя. Кукла Герты его коснулась, голем проснулся и ушёл к Акселю. Химико предложила Казуме переждать в вагоне, но он побежал к своему отряду.' },
      '|В нижнем зале спит каменный паук размером с дом. В его груди светится кристалл.',
      'herta|Вот источник. Вечный кристалл внутри голема. Его излучение похоже на Стелларон.',
      'kazuma|Это же Разрушитель! Мобильная крепость. Только меньше. Ранняя модель?',
      'herta|Интересно. Проверю, как он реагирует.',
      '|Кукла Герты касается кристалла. Глаз паука медленно загорается красным.',
      'kazuma|Кто тебя просил его трогать?!',
      { flag: 'ks_wake' },
      '|Голем встаёт, проламывает потолок и уходит наверх. Земля дрожит. Он идёт к Акселю.',
      'march|Он идёт к городу! Там же Аква, Мегумин, Даркнесс и {name}!',
      'himeko|Казума, мы справимся сами. Ты можешь подождать в вагоне. Там безопасно.',
      { choice: [['Остаться в вагоне.', 'stay'], ['Бежать в Аксель.', 'run']] },
      '#stay',
      'kazuma|...Ладно. Посижу. На мягком диване.',
      '|Казума садится на камень. Через секунду встаёт.',
      'kazuma|Нет. Не могу. Там мои идиоты.',
      { jump: 'go' },
      '#run',
      'kazuma|Аква утопит город, Мегумин взорвёт стену, а Даркнесс побежит голему навстречу. Я бегу.',
      '#go',
      { flag: 'ks_i3' },
      { give: { credits: 6000, items: { exp2: 2 } } },
      { quest: 'ks_i3', step: 'done' },
      { guest: ['trail', 'aqua', 'megumin', 'darkness'], solo: true },
      { goto: ['ax_guild', 'v'] },
      '|В Акселе бьёт колокол тревоги.',
      { obj: 'Узнать у Луны, почему бьёт колокол', at: 'ax_guild:л' }
    ],
    ks_qb_hill: [
      'aqua|Замок на холме. Говорят, его каждый день кто-то взрывает.',
      'darkness|Кто-то. Да.',
      { quest: 'ks_qb', step: 'top' }
    ],
    ks_qb_top: [
      { recap: 'Ежедневный взрыв', text: 'На вершине холма Мегумин прочитала заклинание и ударила Взрывом по старому замку, а потом упала без сил. Оценивать взрыв пришлось новому командиру.' },
      { if: 'ks_mg_left', jump: 'left' },
      'megumin|Отойдите. И смотрите внимательно: оценивать будете вы.',
      'megumin|Чернее черноты, темнее тьмы, сольюсь с моим алым светом!',
      'megumin|Пробудись, сойди к этим пределам и явись искажением!',
      'megumin|Взрыв!',
      { cine: 'c_ks_blast' },
      { ui: 'ksrate' },
      { if: 'ks_rate_hi', jump: 'hi' },
      { if: 'ks_rate_mid', jump: 'mid' },
      'megumin|Сколько?! Ты вообще смотрел на облако?!',
      { script: 'ks_qb_fall' },
      '#mid',
      'megumin|Неплохо. Но в следующий раз смотри на отдачу внимательнее.',
      { script: 'ks_qb_fall' },
      '#hi',
      'megumin|Сто баллов! Вот это я понимаю, командир!',
      { script: 'ks_qb_fall' },
      '#left',
      { script: 'ks_qb_left' }
    ],
    ks_qb_left: [
      { recap: 'Взрыв под ногами', text: 'Мегумин осталась дома, но догнала отряд на холме и, не дожидаясь команды, ударила Взрывом прямо в холм под ногами. Оценивать было нечего.' },
      '|С тропы доносится топот. Мегумин догнала отряд и тяжело дышит.',
      'megumin|Я шла за вами от самого особняка! Без меня взрывов не бывает!',
      '|Не дожидаясь команды, она поднимает посох и бьёт Взрывом прямо в холм под ногами.',
      { cine: 'c_ks_blast' },
      { flag: 'ks_rate_zero' },
      { guest: ['trail', 'aqua', 'megumin', 'darkness'], solo: true },
      { script: 'ks_qb_fall' }
    ],
    ks_qb_fall: [
      '|Мегумин падает лицом в траву. Посох катится вниз по склону.',
      'megumin|После взрыва я не могу шевелиться. Неси меня. Казума всегда носит.',
      { flag: 'ks_carry' },
      { quest: 'ks_qb', step: 'carry' }
    ],
    ks_qb_report: [
      { recap: 'Отчёт о холме', text: 'Отряд донёс Мегумин до гильдии и доложил Луне об обходе холма. Если Мегумин взорвала холм под ногами, стражники обещали вычесть за воронку на тропе.' },
      'luna|Обход холма у замка? Жители опять жаловались на грохот.',
      { if: 'ks_rate_zero', jump: 'zero' },
      'luna|Холм на месте, замок почти на месте. Задание выполнено, десять тысяч эрис.',
      { jump: 'pay' },
      '#zero',
      'luna|Холм... взорван изнутри? Задание засчитано, но стражники просили вычесть половину за воронку на тропе.',
      '#pay',
      'megumin|Я уже могу стоять. Почти.',
      '|На карточке искателя загорается новое очко навыка.',
      { unflag: 'ks_carry' },
      { flag: 'ks_blast' },
      { give: { credits: 6000, items: { exp2: 1 } } },
      { quest: 'ks_qb', step: 'done' },
      { script: 'ks_board_next' }
    ],
    ax_luna: [
      { if: 'ks_proto&!ks_epi', jump: 'epi' },
      { if: 'ks_wake&!ks_alarm', jump: 'alarm' },
      { if: '?ks_qa=report', jump: 'qa' },
      { if: '?ks_qb=carry', jump: 'qb' },
      { if: '?ks_qc=report', jump: 'qc' },
      { if: '?ks_q3=luna', jump: 'card' },
      { if: 'ks_swap&!ks_done', jump: 'swap' },
      'luna|Добро пожаловать в Гильдию искателей приключений! Задания на доске, ужин в таверне.',
      { end: true },
      '#epi',
      { script: 'ks_epilogue' },
      '#alarm',
      { script: 'ks_alarm' },
      '#qa',
      { script: 'ks_qa_report' },
      '#qb',
      { script: 'ks_qb_report' },
      '#qc',
      { script: 'ks_qc_report' },
      '#swap',
      { script: 'ax_luna_swap' },
      '#card',
      { recap: 'Карточки искателей', text: 'Луна оформила команде Экспресса карточки искателей приключений. Март 7 стала лучницей, Дань Хэн копейщиком, а у Первопроходца вместо удачи карточка показала знаки вопроса. Класс достался тот же, что у Казумы.' },
      'luna|Хотите зарегистрироваться? Тогда с вас регистрационный взнос.',
      'kazuma|Я заплачу. Из денег за жаб.',
      'aqua|Из моих денег за жаб!',
      'kazuma|Из денег за жаб, которых взорвала Мегумин.',
      'luna|Положите руку на кристалл, пожалуйста. Карточка покажет ваши характеристики.',
      'march|Тут написано «лучница»! Я правда стреляю из лука!',
      'luna|Хорошая ловкость, хорошая удача. Отличный стрелок поддержки.',
      'danheng|«Копейщик». Верно.',
      'luna|Сила и скорость намного выше средних! Вам сразу можно брать задания посложнее.',
      '|Подходит {name}. Кристалл мигает, гаснет и загорается снова.',
      'luna|Ой. Удача... тут знаки вопроса. Карточка такого раньше не показывала.',
      'kazuma|Даже у меня удача цифрами написана.',
      'luna|Остальное в порядке! Класс «искатель приключений», как у господина Казумы. Учить навыки можно у кого угодно.',
      'kazuma|Это значит «ничего особенного».',
      { flag: 'ks_cards' },
      { quest: 'ks_q3', step: 'dinner' }
    ],
    ks_alarm: [
      { recap: 'Экстренный сбор', text: 'Гильдия объявила экстренный сбор. Казума ворвался в гильдию вместе с командой Экспресса, забрал свой отряд обратно и прямо на обороте объявления нарисовал план против голема.' },
      '|В гильдии звонит колокол. Луна стоит на стойке и кричит в рупор.',
      'luna|Экстренный сбор! Всем искателям к южным воротам! К Акселю идёт огромный голем!',
      '|Дверь распахивается. На пороге Казума, весь в пыли. За ним команда Экспресса и кукла Герты.',
      'kazuma|Аква! Мегумин! Даркнесс! Целы?',
      'aqua|Казума-а-а! Нас тут без тебя чуть не съели! Жабы, аллигаторы, а Мегумин взорвала холм!',
      'megumin|Не холм, а замок. И мне поставили баллы.',
      'darkness|Новый командир хорошо справлялся. Но ругаешь нас ты лучше.',
      'herta|Сутки ещё не прошли. По отчёту нормальный отряд работал лучше.',
      'kazuma|Нормальный отряд не останавливал Разрушитель. Мой останавливал.',
      'kazuma|Обмен окончен. {name}, бери своих. Вы держите турели у ворот.',
      { choice: [['Договорились.', 'ok'], ['Мне понравилось с ними.', 'liked']] },
      '#liked',
      'aqua|Правда?! Казума, ты слышал?',
      'kazuma|Слышал. Всё равно отдавай.',
      '#ok',
      '|У доски заданий Казума рисует план прямо на обороте объявления.',
      'kazuma|Аква снимает барьер. Мегумин взрывом ломает ноги. Даркнесс держит удары. Я краду ядро.',
      'danheng|А мы?',
      'kazuma|Вы бьёте турели, пока голем не подошёл к стене. У вас никто не промахивается.',
      { flag: 'ks_alarm' },
      { quest: 'ks_q6', step: 'gate' },
      { guest: ['trail', 'march', 'danheng', 'himeko'], solo: true },
      { goto: ['ax_gate', 'v'] },
      { script: 'ks_gate_fight' }
    ],
    ks_gate_fight: [
      { recap: 'Турели у ворот', text: 'Голем подошёл к южным воротам и выпустил каменные турели и пауков. Команда Экспресса разбила их, а потом вперёд вышел отряд Казумы.' },
      '|Голем стоит в поле перед воротами. С его спины поднимаются каменные турели и мелкие пауки.',
      'himeko|Экспресс, вперёд. Нам досталась самая простая часть плана.',
      { battle: 'ks_gate' },
      'march|Турели всё! Дальше их очередь!',
      { guest: ['kazuma', 'aqua', 'megumin', 'darkness'], solo: true },
      '|Отряд Казумы выходит к голему. Команда Экспресса остаётся у ворот и смотрит.',
      'kazuma|По плану. Аква, барьер.',
      { quest: 'ks_q6', step: 'boss' }
    ],
    ax_gate_proto: [
      { if: '?ks_q6=boss', jump: 'boss' },
      '|Груда камней. Всё, что осталось от раннего Разрушителя.',
      { end: true },
      '#boss',
      { script: 'ks_proto_fight' }
    ],
    ks_proto_fight: [
      { recap: 'Прототип Разрушителя', text: 'Отряд Казумы остановил ранний Разрушитель по плану: Аква сняла барьер, Мегумин сломала ноги, Даркнесс держала удары, а Казума украл раскалённое ядро. Виз телепортировала кристалл, и он упал на платформу Экспресса.' },
      'aqua|Барьеры я снимаю лучше всех! Смотрите!',
      'darkness|Я встану перед ним. Пусть бьёт меня.',
      'megumin|А потом мой взрыв.',
      { battle: 'ks_proto' },
      '|Казума вытаскивает из груди голема раскалённый кристалл. Перчатки шипят.',
      'kazuma|Горячо! Горячо! Куда его?!',
      'wiz|Давайте мне! Телепорт!',
      '|Кристалл исчезает во вспышке. Голем замирает и рассыпается на камни.',
      'wiz|Я выбрала место, где никого нет. Наверное, никого.',
      '|В тот же миг на платформе Звёздного экспресса что-то с грохотом падает и прожигает доски.',
      'pompom|...Так вот он, ваш Стелларон!',
      'herta|Записала. Коронатит, а не Стелларон. Сигнал объяснён.',
      { flag: 'ks_proto' },
      { give: { jade: 100, credits: 15000, items: { exp3: 2 } } },
      { quest: 'ks_q6', step: 'done' },
      { obj: 'Вернуться в гильдию к Луне', at: 'ax_guild:л' }
    ],
    ks_epilogue: [
      { recap: 'После боя', text: 'Гильдия праздновала победу над големом. Луна поставила на карточку отметку о прикрытии отряда, а кукла Герты пересчитала отчёт с новым столбцом «Прикрытие». Мегумин после взрыва не могла встать, и её понесли домой.' },
      '|В гильдии шумно. Искатели пьют за победу, Луна раздаёт награды.',
      'luna|Экстренное задание выполнено! Награда за голема делится на всех, кто был у ворот.',
      'luna|{name}, давайте карточку. Поставлю отметку: «Прикрытие отряда при защите Акселя».',
      'herta|Итоговый отчёт. Я добавила столбец.',
      { ui: 'ksreport', final: true },
      'herta|«Прикрытие». Сколько раз один закрыл ошибку другого. С ним цифры другие. Данных пока мало.',
      'kazuma|То есть ты признаёшь, что мой отряд нормальный?',
      'herta|Я признаю, что столбцов было мало. Не больше.',
      '|Мегумин сидит на полу у стойки. После взрыва она не может встать.',
      'megumin|Кто-нибудь. Донесите меня до дома.',
      { choice: [['Отдать Мегумин Казуме.', 'give'], ['Донесу сам{|а}.', 'self']] },
      '#self',
      'megumin|Хорошо. Но я буду ставить баллы за носку.',
      { flag: 'ks_carry_self' },
      { flag: 'ks_carry' },
      { jump: 'go' },
      '#give',
      'kazuma|Давай сюда. Это моя работа.',
      '#go',
      { flag: 'ks_epi' },
      { guest: null },
      { quest: 'ks_q7', step: 'home' }
    ],
    ks_dinner: [
      { recap: 'Ужин в особняке', text: 'Отряд Казумы и команда Экспресса ужинали в особняке. Казума поставил Взрыву по голему сто баллов, Аква не отдала головастика, а Казума тихо поблагодарил Первопроходца за то, что тот присмотрел за его отрядом.' },
      '|В особняке Казумы пахнет капустой и свечами. Команда Экспресса остаётся на ужин.',
      { if: 'ks_carry_self', jump: 'self' },
      '|Казума опускает Мегумин на диван.',
      { jump: 'score' },
      '#self',
      '|Ты опускаешь Мегумин на диван.',
      'megumin|За носку семьдесят баллов. Казума трясёт меньше.',
      '#score',
      'kazuma|А Взрыву по голему сто баллов. Звук, отдача, облако. Лучший в этом году.',
      'megumin|Наконец-то честная оценка.',
      { if: 'ks_tadpole', jump: 'tad' },
      { jump: 'talk' },
      '#tad',
      'kazuma|...А почему в ведре головастик?',
      'aqua|Это мой! Я его выращу!',
      'kazuma|Он вырастет в жабу размером с дом.',
      'darkness|Когда вырастет, он сможет меня проглотить?',
      'kazuma|Нет.',
      '#talk',
      '|Ужин кончается поздно. Казума выходит на крыльцо следом за тобой.',
      'kazuma|Слушай. Спасибо, что присмотрел{|а} за ними.',
      'kazuma|И ещё. В нормальном отряде было скучно. Им не говори.',
      { unflag: 'ks_carry' },
      { quest: 'ks_q7', step: 'farewell' }
    ],
    ks_farewell: [
      { recap: 'Отлёт', text: 'У Экспресса на лугу собрались отряд Казумы, Луна, Виз и Ванир. Пом-Пом обменял эрис на кредиты, Март сфотографировала всех на память, и Экспресс улетел из Белзерга.' },
      '|У Экспресса на лугу собрались все: отряд Казумы, Луна, Виз и даже Ванир.',
      'pompom|Пассажиры, по вагонам! Пом-Пом обменял ваши эрис на кредиты. Курс плохой, но честный.',
      'vanir|Фу-ха-ха! Какая вкусная была вчера досада. Мальчишка тосковал к обеду, как я и говорил.',
      'kazuma|Ничего я не тосковал.',
      'aqua|Тосковал! Он сам сказал, что ему скучно!',
      'march|Можно я вас всех сфотографирую? На память!',
      '|Щелчок. На снимке все щурятся от солнца, а Мегумин спит у Казумы на спине.',
      'darkness|Приезжайте ещё. И привозите тех, кто бьёт больнее.',
      'kazuma|Если опять поймаете сигнал, сначала спросите, что это такое. Потом летите.',
      { flag: 'ks_done' },
      { give: { credits: 20000, items: { mana: 1 }, outfit: 'kazuma_jersey' } },
      { quest: 'ks_q7', step: 'done' },
      { goto: ['express', 'v'] },
      '|Экспресс отрывается от луга. Внизу машут четыре фигурки и одна чёрная кошка с крыльями.',
      { credits: 'konosuba' }
    ],
    ax_after_kazuma: [
      'kazuma|Долги, жабы, взрывы. Всё как обычно. И это, кажется, хорошо.'
    ],
    ax_after_aqua: [
      'aqua|Головастик ест больше Мегумин! Скоро понадобится ведро побольше.'
    ],
    ax_after_megumin: [
      'megumin|Завтра снова на холм. Приходи оценивать, если будешь рядом.'
    ],
    ax_after_darkness: [
      'darkness|Жабы меня так ни разу и не проглотили. Может, в следующий раз.'
    ],
    ax_gate_wiz: [
      { if: 'ks_proto', jump: 'after' },
      'wiz|Если понадобится что-то телепортировать, зовите. Я рядом.',
      { end: true },
      '#after',
      'wiz|Надеюсь, на платформе никого не было.'
    ],
    ax_gate_adv: [
      'adventurer=Копейщик|Говорят, у этих двоих отрядов всё наоборот. У одного никто не промахивается, у другого никто не попадает.'
    ],
    ax_luna_swap: [
      'luna|Карточка искателя всегда при вас. Очки навыков тратятся у тех, кто учит навыкам.',
      { ui: 'kscard' }
    ],
    ax_dinner: [
      { if: '?ks_q3=dinner', jump: 'dinner' },
      'kazuma|Сначала карточки. Луна у стойки.',
      { end: true },
      '#dinner',
      { recap: 'Ужин в таверне', text: 'За ужином Март 7 похвалила отряд Казумы, а Казума пожаловался, что с нормальным отрядом жил бы спокойно. Кукла Герты предложила эксперимент: сутки отряды живут наоборот, а она считает результат. Первопроходец остался с Аквой, Мегумин и Даркнесс.' },
      '|В таверне при гильдии шумно. Отряд Казумы и команда Экспресса сидят за одним столом.',
      'march|Мне так нравится ваш отряд! Богиня, волшебница и рыцарь. Прямо как в сказке!',
      'kazuma|Сказка. Да.',
      '|Аква заказывает ещё кружку в долг. Мегумин рассказывает Дань Хэну про взрывы. Даркнесс спрашивает, больно ли бьёт его копьё.',
      'kazuma|Богиня, которая всё топит и плачет. Волшебница, которая колдует раз в день и потом падает. Рыцарь, который ни разу ни в кого не попал.',
      'kazuma|С нормальным отрядом я бы пожил спокойно. Брал бы задания, получал деньги и спал до обеда.',
      'darkness|Казума, ты так красиво нас ругаешь...',
      'march|Так поменяйтесь! Ты с нами, а {name} с ними. Всего на денёк!',
      '|Кукла Герты, до сих пор сидевшая молча, поворачивает голову.',
      'herta|Хорошая идея. Сутки, два отряда, одни и те же задания. Я посчитаю, у кого выйдет лучше.',
      'kazuma|Я не...',
      'herta|Ты сам сказал, что с нормальным отрядом пожил бы спокойно. Вот и проверим.',
      'aqua|Подождите, а нас кто-нибудь спросил?!',
      'megumin|Я согласна. Если новый командир не запретит взрывы.',
      'darkness|Меня поведёт незнакомый человек... в незнакомые места... Я согласна.',
      'kazuma|...Ладно. Один день. Завтра вечером меняемся обратно.',
      { choice: [['Поменяться.', 'yes'], ['Поменяться, но я против.', 'no']] },
      '#no',
      'herta|Протест записан. Меняться всё равно придётся.',
      '#yes',
      'kazuma|Тогда слушай. Аква ничего не трогает. Мегумин не колдует рядом с людьми. Даркнесс не пускать вперёд.',
      'aqua|А что тогда можно?',
      'kazuma|Можно молиться.',
      '|Казума уходит с Март 7 и Дань Хэном. Кукла Герты идёт следом и что-то записывает.',
      'aqua|Ну что, новый командир! Пойдём домой, в особняк. Сегодня ты угощаешь.',
      { guest: ['trail', 'aqua', 'megumin', 'darkness'], solo: true },
      { flag: 'ks_swap' },
      { give: { credits: 4000, items: { exp2: 1 } } },
      { quest: 'ks_q3', step: 'done' },
      { quest: 'ks_q4', step: 'home' }
    ],
    ax_march: [
      { if: '?ks_q3=dinner', jump: 'dinner' },
      'march|Карточка искателя! Сфотографирую её на память.',
      { end: true },
      '#dinner',
      { script: 'ax_dinner' }
    ],
    ax_questboard: [
      { if: 'ks_night&!ks_board_seen', jump: 'first' },
      { if: 'ks_night', jump: 'board' },
      '|На доске висят задания: «Гигантские жабы, пять штук», «Обход холма у старого замка», «Очистить озеро». Срочных пока нет.',
      { end: true },
      '#first',
      { script: 'ax_board_first' },
      '#board',
      { script: 'ax_board_open' }
    ],
    ax_chris: [
      { if: 'ks_swap', jump: 'swap' },
      'chris|Новенькие? Если среди вас есть воры, подходите. Научу паре навыков, недорого.',
      { end: true },
      '#swap',
      { script: 'ax_chris_teach' }
    ],
    ax_chris_teach: [
      { if: 'ks_chris_met', jump: 'menu' },
      { recap: 'Крис и Кража', text: 'Крис, воровка из гильдии, когда-то научила Казуму Краже. Новому командиру его отряда она тоже готова показать пару воровских навыков за очки навыка с карточки искателя.' },
      'chris|Ты новый командир отряда Казумы? Он у меня тоже учился. Красть, например.',
      'chris|Покажу тебе пару навыков. Платить будешь очками с карточки, кошелёк оставь себе.',
      { flag: 'ks_chris_met' },
      '#menu',
      { script: 'ax_chris_menu' }
    ],
    ax_chris_menu: [
      { recap: 'Уроки Крис', text: 'Крис учит Краже и Связыванию. Каждый навык стоит одно очко навыка с карточки искателя, а очки даются за регистрацию и за задания с доски гильдии.' },
      { menu: [['Научи Краже (1 очко навыка)', 'steal', 'ks_sp&!ks_sk_steal'], ['Научи Связыванию (1 очко навыка)', 'bind', 'ks_sp&!ks_sk_bind']], exit: ['Потом.', 'bye'] },
      '#steal',
      { ui: 'kslearn', skill: 'steal' },
      'chris|Протяни руку и думай о том, что хочешь взять. Остальное решит удача.',
      { end: true },
      '#bind',
      { ui: 'kslearn', skill: 'bind' },
      'chris|Верёвка, бросок, узел. Большие монстры вырываются, зато мелкие лежат смирно.',
      { end: true },
      '#bye',
      'chris|Заходи, когда накопишь очки.'
    ],
    ax_dust: [
      { if: 'ks_swap', jump: 'swap' },
      { script: 'ax_dust_train' },
      { end: true },
      '#swap',
      'dust|Ты взял себе отряд Казумы? Я тоже однажды так менялся. Не советую.'
    ],
    ax_dust_train: [
      'dust|Это вы прилетели на поезде? Говорят, у вас там чистые кровати. Возьмите меня с собой.',
      'keith|Даст, нас из гильдии выгонят.'
    ],
    ax_keith: [
      'keith|Не слушайте Даста. Он со всеми так знакомится.'
    ],
    ax_adv1: [
      'adventurer=Копейщик|Говорят, у пруда за стеной сел целый дом на колёсах. Жабы от него в восторге.'
    ],
    ax_adv2: [
      'adventurer=Воин|Я в Акселе уже третий год. Уровень восьмой. Не смейтесь, тут все такие.'
    ],
    ax_wiz: [
      { if: 'ks_swap', jump: 'swap' },
      'wiz|Добро пожаловать в лавку магических товаров! Посмотрите зелья, они... почти все работают.',
      { end: true },
      '#swap',
      { script: 'ax_wiz_swap' }
    ],
    ax_wiz_swap: [
      { recap: 'Покупка у Виз', text: 'В лавке Виз продаются дорогие и почти бесполезные товары. Тому, кто что-нибудь купит, Виз по секрету показывает навык нежити: Иссушающее касание.' },
      'wiz|Ванир сегодня в прекрасном настроении. Это всегда немного страшно.',
      { menu: [['Купить что-нибудь (1 000 кредитов)', 'buy', '!ks_wiz_bought'], ['Научи Иссушающему касанию (1 очко навыка)', 'drain', 'ks_wiz_bought&ks_sp&!ks_sk_drain']], exit: ['До свидания.', 'bye'] },
      '#buy',
      { take: { credits: 1000 } },
      { flag: 'ks_wiz_bought' },
      'wiz|Спасибо! Это зелье взрывается от тряски. Пожалуйста, не трясите его.',
      'wiz|Знаете, я могу показать вам один навык нежити. Иссушающее касание. Только не говорите никому, где научились.',
      { end: true },
      '#drain',
      { ui: 'kslearn', skill: 'drain' },
      'wiz|Положите руку на противника и возьмите немного его сил. Немного! Иначе мне будет стыдно.',
      { end: true },
      '#bye',
      'wiz|Приходите ещё!'
    ],
    ax_wiz_shelf: [
      '|Ряды разноцветных зелий. На ценнике надпись: «Взрывается от тряски. Не трясти».'
    ],
    ax_wiz_pot: [
      '|В котле булькает зелёная жидкость. Пахнет мятой и почему-то жабой.'
    ],
    ax_stable_hay: [
      '|Мягкое сено в углу конюшни. Здесь Казума и Аква ночевали первые недели в Акселе, пока не заработали на жильё.'
    ]
  };

  const HOOKS = [['pompom_talk', '?ks_q1=talk', 'ks_signal_talk']];

  const THREADS = [
    { id: 'ks_pompom_signal', who: 'pompom', need: 'jarilo_done|ks_early', alone: true, steps: [
      'pompom|Пассажиры! Навигация поймала странный сигнал.',
      { pick: [
        ['Стелларон?', 'pompom|Похоже на то! Но мир, откуда он идёт, не значится ни на одной карте.'],
        ['Опять работа?', 'pompom|Опять. Пом-Пом тоже хотел отдохнуть.']
      ] },
      'pompom|Приходите в Общий вагон. Химико уже варит кофе на дорогу.',
      { quest: 'ks_q1' }
    ] },
    { id: 'ks_herta_doll', who: 'herta', need: 'ks_signal', alone: true, steps: [
      'herta|Ваш сигнал интересный. Кукла полетит с вами.',
      { pick: [
        ['Зачем?', 'herta|Мне нужны данные. Сама я никуда не полечу.'],
        ['Она умеет разговаривать?', 'herta|Лучше, чем большинство людей.']
      ] },
      'herta|Не роняйте её.'
    ] },
    { id: 'ks_kazuma_after', who: 'kazuma', need: 'ks_done', alone: true, steps: [
      'kazuma|Это Казума. Виз продала мне шар связи. Сказала, что ловит даже поезда в небе. И что почти не взрывается.',
      'kazuma|У нас всё как обычно. Мегумин каждый день взрывает по холму, Даркнесс ходит к жабам, Аква опять в долгах.',
      { pick: [
        ['А ты?', 'kazuma|А я сплю до обеда. Никаких Разрушителей, никаких сигналов. Скучно, если честно.'],
        ['Передай им привет.', 'kazuma|Передал. Аква заплакала, Мегумин потребовала баллы за прощание, Даркнесс спросила, больно ли бьёт кукла Герты.']
      ] },
      'kazuma|Всё, шар греется. Если будете пролетать мимо, в особняке есть лишняя комната. Без жаб.'
    ] }
  ];

  const MILESTONES = [
    { id: 'swap', name: 'Обмен', text: 'поменяться отрядами с Казумой', need: 'ks_swap', give: { jade: 100, items: { mana: 2 } } },
    { id: 'board', name: 'Три задания с доски', text: 'выполнить три задания гильдии', need: 'ks_toads&ks_blast&ks_lake', give: { jade: 200, credits: 30000, items: { mana: 3 } } },
    { id: 'keele', name: 'Подземелье Киила', text: 'пройти Подземелье Киила', need: 'ks_i3', give: { jade: 100, items: { exp2: 4 } } },
    { id: 'done', name: 'Финал', text: 'завершить историю', need: 'ks_done', give: { jade: 300, items: { mana: 5 } }, char: 'kazuma' }
  ];
  const FLOOR = 40;

  const G0 = H.Game.prototype;
  const base = { cond: G0.cond, claimEvent: G0.claimEvent, eventReady: G0.eventReady, alerts: G0.alerts, partySpecs: G0.partySpecs, teleportFor: G0.teleportFor, resume: G0.resume, afterBattle: G0.afterBattle, startBattle: G0.startBattle };
  const SKILLS = {
    steal: { name: 'Кража', short: 'Кража', teacher: 'Крис', text: 'Урон и кража усиления или щита. Иногда приносит добычу.', ab: { name: 'Кража', target: 'single', fx: [{ k: 'dmg', m: 1.0 }, { k: 'steal' }] } },
    bind: { name: 'Связывание', short: 'Связывание', teacher: 'Крис', text: 'Слабый урон. Обычный враг пропускает ход, по нему попадает Даркнесс.', ab: { name: 'Связывание', target: 'single', fx: [{ k: 'dmg', m: 0.5 }, { k: 'bind' }] } },
    drain: { name: 'Иссушающее касание', short: 'Касание', teacher: 'Виз', text: 'Тянет силы из самого здорового врага, даёт союзнику энергию и поднимает Мегумин.', ab: { name: 'Иссушающее касание', target: 'ally', noSelf: true, fx: [{ k: 'drain', m: 0.7 }] } }
  };
  const SP_FLAGS = ['ks_cards', 'ks_toads', 'ks_blast', 'ks_lake'];
  const COVER = new Set(['Связан', 'На свободе!', 'Барьер разрушен!', 'Ноги сломаны!', 'Кража ядра!']);
  const HUNT = ['k_ks_toad_a1', 'k_ks_toad_a2', 'k_ks_toad_a3', 'k_ks_toad_a4', 'k_ks_toad_a5'];

  Object.assign(H.Game.prototype, {
    ks() { return this.state.ks || (this.state.ks = { got: [] }); },
    ksOpen() { return this.cond('jarilo_done|ks_early'); },
    ksEarlyReady() { return this.eventsOpen() && !this.ksOpen(); },
    ksStartEarly() {
      if (!this.ksEarlyReady()) return false;
      this.state.flags.ks_early = true;
      if (this.chatSync) this.chatSync();
      return true;
    },
    ksReady(i) { const m = MILESTONES[i]; return !!m && this.ksOpen() && this.cond(m.need) && !this.ks().got.includes(m.id); },
    ksClaim(i) {
      if (!this.ksReady(i)) return null;
      const m = MILESTONES[i], out = this.give(m.give);
      this.ks().got.push(m.id);
      if (m.char) {
        const s = this.state, r = s.roster[m.char];
        if (r && r.guest) { delete s.roster[m.char]; if (s.guest) s.guest.added = s.guest.added.filter(k => k !== m.char); }
        const res = this.addChar(m.char, this.avgLevel());
        out.push(res === 'new' ? H.CHARS[m.char].name : res === 'eid' ? 'Эйдолон: ' + H.CHARS[m.char].name : 'звёздный свет +' + H.charGlow(res, H.CHARS[m.char].rarity));
      }
      return out;
    },
    ksFloor() { return !!this.map && this.currentWorld().id === 'belzerg'; },
    ksSwapped() { return !!this.state.flags.ks_swap && !this.state.flags.ks_done; },
    ksBoard() { return BOARD.filter(q => H.MAPS[q.map] && H.QUESTS[q.id]); },
    ksBoardBusy() { return BOARD.some(q => this.state.quests[q.id] && this.state.quests[q.id] !== 'done'); },
    ksTake(id) {
      const q = BOARD.find(x => x.id === id);
      if (!q || !H.MAPS[q.map] || !H.QUESTS[id] || this.ksBoardBusy() || this.state.quests[id] === 'done') return false;
      this.setQuest(id, q.step);
      return true;
    },
    speedMul() { return this.state.flags.ks_carry ? 0.6 : 1; },
    ksCard() { const k = this.ks(); if (!k.skills) k.skills = []; if (!k.equip) k.equip = []; return k; },
    ksSP() { const f = this.state.flags; return Math.max(0, SP_FLAGS.filter(x => f[x]).length - this.ksCard().skills.length); },
    ksLearn(id) {
      const k = this.ksCard();
      if (!SKILLS[id] || k.skills.includes(id) || this.ksSP() <= 0) return false;
      k.skills.push(id);
      if (k.equip.length < 2) k.equip.push(id);
      return true;
    },
    ksEquip(id) {
      const k = this.ksCard();
      if (!k.skills.includes(id)) return false;
      if (k.equip.includes(id)) k.equip = k.equip.filter(x => x !== id);
      else if (k.equip.length < 2) k.equip.push(id);
      else return false;
      return true;
    },
    cond(c) {
      if (c && /ks_s[pk]/.test(c)) {
        const f = this.state.flags, k = this.ksCard();
        if (this.ksSP() > 0) f.ks_sp = true; else delete f.ks_sp;
        for (const id of Object.keys(SKILLS)) { if (k.skills.includes(id)) f['ks_sk_' + id] = true; else delete f['ks_sk_' + id]; }
      }
      return base.cond.call(this, c);
    },
    teleportFor(p) {
      const r = base.teleportFor.call(this, p);
      if (!r.ok || !this.ksSwapped()) return r;
      const a = this.areaOf(r.dest.map);
      return a && a.world.id === 'belzerg' ? r : { ok: false, dest: null, why: 'Сначала верните отряды. Аква не отпустит.' };
    },
    resume(val) {
      const p = this.pending;
      if (p && p.type === 'ui' && p.ui === 'kslearn') this.ksLearn(p.skill);
      if (p && p.type === 'ui' && p.ui === 'ksrate') {
        const score = Math.max(0, Math.min(100, val == null ? 70 : Math.round(val)));
        this.ks().score = score;
        const f = this.state.flags;
        delete f.ks_rate_hi; delete f.ks_rate_mid; delete f.ks_rate_low;
        f[score >= 90 ? 'ks_rate_hi' : score >= 50 ? 'ks_rate_mid' : 'ks_rate_low'] = true;
      }
      return base.resume.call(this, val);
    },
    afterBattle() {
      const wb = this.ksWard;
      this.ksWard = null;
      if (wb && wb.ward && wb.ward.broken) this.state.flags.ks_cage_broken = true;
      base.afterBattle.call(this);
      const f = this.state.flags, q = this.state.quests;
      if (q.ks_qa === 'hunt' && HUNT.every(k => f[k])) { this.setQuest('ks_qa', 'gold'); this.toast('У пруда вылезла Золотая жаба!'); }
      else if (q.ks_qa === 'gold' && f.k_ks_goldtoad) { this.setQuest('ks_qa', 'tadpole'); this.toast('В камышах у пруда что-то плещется.'); }
    },
    ksStats(key) { const k = this.ks(); k.stats = k.stats || {}; const st = k.stats[key] || (k.stats[key] = { fights: 0, turns: 0, miss: 0, fail: 0, collapse: 0, swallow: 0, cover: 0 }); if (st.cover == null) st.cover = 0; return st; },
    ksKpd(st, cover) { const bad = st.miss + st.fail + st.collapse * 2 + st.swallow * 2 - (cover ? st.cover : 0); return Math.max(5, Math.min(100, Math.round(100 - 100 * bad / Math.max(1, st.turns)))); },
    startBattle(o) {
      const r = base.startBattle.call(this, o), enc = o.encId && H.ENCOUNTERS[o.encId];
      if (this.ksSwapped() && this.battle) {
        const st = this.ksStats(this.state.party.includes('aqua') ? 'ax' : 'kz'), b = this.battle, push = b.push.bind(b);
        st.fights++;
        b.push = e => {
          if (e.t === 'turn' && e.u && e.u.side === 'ally') st.turns++;
          else if (e.t === 'miss') st.miss++;
          else if (e.t === 'fail') st.fail++;
          else if (e.t === 'collapse' && e.on) st.collapse++;
          else if (e.t === 'status' && e.text === 'Проглот!') st.swallow++;
          if ((e.t === 'dmg' && e.label === 'Прикрытие') || (e.t === 'collapse' && e.on === false) || (e.t === 'status' && (COVER.has(e.text) || /^Энергия \+/.test(e.text || '')))) st.cover++;
          return push(e);
        };
      }
      if (enc && enc.ward && this.battle) { this.battle.setWard(enc.ward); this.ksWard = this.battle; }
      if (this.state.flags.ks_carry && this.battle) {
        const m = this.battle.allies.find(a => a.charId === 'megumin');
        if (m) this.battle.collapse(m, 99);
      }
      return r;
    },
    claimEvent(id) {
      if (id !== 'konosuba') return base.claimEvent.call(this, id);
      const out = [];
      MILESTONES.forEach((m, i) => out.push(...(this.ksClaim(i) || [])));
      return out;
    },
    eventReady(id) { return id === 'konosuba' ? MILESTONES.some((m, i) => this.ksReady(i)) : base.eventReady.call(this, id); },
    alerts() {
      const a = base.alerts.call(this);
      if (this.eventsOpen() && this.eventReady('konosuba')) a.events = true;
      return a;
    },
    partySpecs(trials) {
      const specs = base.partySpecs.call(this, trials);
      if (!this.ksFloor()) return specs;
      for (const p of specs) {
        const r = this.state.roster[p.key];
        if (p.trial || !r || p.lvl >= FLOOR) continue;
        const old = r.lvl, frac = p.stats.hp ? p.hp / p.stats.hp : 1;
        r.lvl = FLOOR;
        const st = this.charStats(p.key);
        r.lvl = old;
        Object.assign(p, { lvl: FLOOR, stats: st, hp: p.hp > 0 ? Math.max(1, Math.round(st.hp * frac)) : 0, tr: this.traceSpec(p.key, FLOOR) });
      }
      const eq = this.ksSwapped() ? this.ksCard().equip : [];
      const tr = eq.length && specs.find(p => p.key === 'trail');
      if (tr) Object.assign(tr, { skills: eq.map(id => SKILLS[id]), skillsTitle: 'Навыки карточки' });
      return specs;
    }
  });

  Object.assign(H.QUESTS, QUESTS);
  Object.assign(H.SCRIPTS, SCRIPTS);
  for (const [name, cond, target] of HOOKS) {
    const steps = H.SCRIPTS[name];
    if (!steps || steps.some(st => st && st.jump === 'ks_' + target)) continue;
    steps.unshift({ if: cond, jump: 'ks_' + target });
    steps.push({ end: true }, '#ks_' + target, { script: target }, { end: true });
  }
  Object.assign(H.MISSION_CHAPTERS, { ks: { type: 'comp', label: 'Компаньон: Казума', name: 'Обмен отрядами' } });
  Object.assign(H.CHAT.CONTACTS, { kazuma: { sign: 'Не беспокоить. Заслуженный отдых.' } });
  H.CHAT.THREADS.push(...THREADS.filter(t => !H.CHAT.THREADS.some(x => x.id === t.id)));
  H.KONOSUBA = { MILESTONES, FLOOR, BOARD, SKILLS, SP_FLAGS };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
