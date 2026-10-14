(function (S) {
  'use strict';
  const T = (ru, en) => ({ ru, en });

  const AMMO = {
    a45: { name: T('.45 ACP', '.45 ACP'), max: 210, pick: 21 },
    a22: { name: T('.22 LR', '.22 LR'), max: 80, pick: 10 },
    a3006: { name: T('.30-06', '.30-06'), max: 160, pick: 16 },
    a9: { name: T('9 мм Парабеллум', '9mm Parabellum'), max: 256, pick: 24 },
    a792: { name: T('7,92 мм', '7.92mm'), max: 100, pick: 10 },
    a792k: { name: T('7,92 мм курц', '7.92mm Kurz'), max: 180, pick: 20 },
    rocket: { name: T('Ракеты M6A1', 'M6A1 rockets'), max: 6, pick: 2 },
    pzrocket: { name: T('Ракеты RPzB', 'RPzB rockets'), max: 4, pick: 1 },
    grenade: { name: T('Гранаты Mk2', 'Mk2 grenades'), max: 8, pick: 2 },
    stick: { name: T('Гранаты M24', 'M24 grenades'), max: 8, pick: 2 }
  };

  const WEAPONS = {
    colt: { name: T('Кольт .45 M1911', 'Colt .45 M1911'), cat: 1, ammo: 'a45', mag: 7, dmg: 34, rpm: 330, spread: 2.2, aim: 0.8, recoil: 2.4, reload: 1.5, sound: 'colt', noise: 55 },
    silenced: { name: T('Пистолет с глушителем', 'Silenced pistol'), cat: 1, ammo: 'a22', mag: 10, dmg: 32, rpm: 300, spread: 1.8, aim: 0.6, recoil: 1.2, reload: 1.6, sound: 'silenced', noise: 5 },
    p38: { name: T('Вальтер P38', 'Walther P38'), cat: 1, ammo: 'a9', mag: 8, dmg: 30, rpm: 330, spread: 2.2, aim: 0.8, recoil: 2.0, reload: 1.5, sound: 'p38', noise: 55 },
    thompson: { name: T('Томпсон M1A1', 'Thompson M1A1'), cat: 2, ammo: 'a45', mag: 30, dmg: 22, rpm: 700, auto: true, spread: 3.2, aim: 1.7, recoil: 1.3, reload: 2.4, sound: 'thompson', noise: 80 },
    mp40: { name: T('МП-40', 'MP40'), cat: 2, ammo: 'a9', mag: 32, dmg: 20, rpm: 550, auto: true, spread: 3.0, aim: 1.6, recoil: 1.1, reload: 2.3, sound: 'mp40', noise: 80 },
    stg44: { name: T('Штурмгевер 44', 'StG 44'), cat: 2, ammo: 'a792k', mag: 30, dmg: 30, rpm: 600, auto: true, spread: 2.8, aim: 1.1, recoil: 1.6, reload: 2.5, sound: 'stg44', noise: 90 },
    garand: { name: T('Гаранд M1', 'M1 Garand'), cat: 3, ammo: 'a3006', mag: 8, dmg: 58, rpm: 240, spread: 1.6, aim: 0.25, recoil: 3.2, reload: 2.2, sound: 'garand', noise: 100, ping: true },
    kar98: { name: T('Маузер Kar98k', 'Mauser Kar98k'), cat: 3, ammo: 'a792', mag: 5, dmg: 80, rpm: 55, spread: 1.8, aim: 0.15, recoil: 4, reload: 2.8, sound: 'kar98', noise: 100, bolt: true },
    bar: { name: T('БАР M1918', 'BAR M1918'), cat: 3, ammo: 'a3006', mag: 20, dmg: 45, rpm: 500, auto: true, spread: 3.0, aim: 1.2, recoil: 2.3, reload: 2.8, sound: 'bar', noise: 110 },
    springfield: { name: T('Спрингфилд M1903A4', 'Springfield M1903A4'), cat: 4, ammo: 'a3006', mag: 5, dmg: 110, rpm: 50, spread: 3.5, aim: 0, recoil: 4.5, reload: 3, sound: 'springfield', noise: 110, bolt: true, scope: 4 },
    kar98s: { name: T('Kar98k со снайперским прицелом', 'Scoped Kar98k'), cat: 4, ammo: 'a792', mag: 5, dmg: 100, rpm: 50, spread: 3.5, aim: 0, recoil: 4.5, reload: 3, sound: 'kar98', noise: 110, bolt: true, scope: 4 },
    bazooka: { name: T('Базука M1A1', 'Bazooka M1A1'), cat: 5, ammo: 'rocket', mag: 1, dmg: 210, rpm: 30, spread: 1, aim: 0.3, recoil: 5, reload: 2.8, sound: 'rocket', noise: 120, proj: 'rocket', radius: 5.5 },
    panzerschreck: { name: T('Панцершрек', 'Panzerschreck'), cat: 5, ammo: 'pzrocket', mag: 1, dmg: 250, rpm: 30, spread: 1, aim: 0.3, recoil: 5, reload: 3.2, sound: 'rocket', noise: 120, proj: 'rocket', radius: 6 },
    grenade: { name: T('Гранаты Mk2', 'Mk2 grenades'), cat: 6, ammo: 'grenade', throw: true, dmg: 200, radius: 7, fuse: 3.5 },
    stick: { name: T('Гранаты M24', 'M24 stick grenades'), cat: 6, ammo: 'stick', throw: true, dmg: 190, radius: 7, fuse: 4.2 },
    papers: { name: T('Документы', 'Papers'), cat: 7, papers: true },
    mg42: { name: T('МГ-42', 'MG42'), cat: 0, ammo: 'a792', mag: 50, dmg: 20, rpm: 1100, auto: true, spread: 3.2, aim: 3.2, recoil: 1, reload: 5, sound: 'mg42', noise: 120, npcOnly: true }
  };
  const CAT_ORDER = [1, 2, 3, 4, 5, 6, 7];

  const PICKUPS = {
    canteen: { name: T('Фляга', 'Canteen'), hp: 10 },
    medkit: { name: T('Аптечка', 'Health pack'), hp: 25 },
    surgeon: { name: T('Набор полевого хирурга', 'Field surgeon pack'), hp: 50 },
    ammo_a45: { name: AMMO.a45.name, ammo: 'a45', n: 28 },
    ammo_a3006: { name: AMMO.a3006.name, ammo: 'a3006', n: 24 },
    ammo_a9: { name: AMMO.a9.name, ammo: 'a9', n: 32 },
    ammo_a792: { name: AMMO.a792.name, ammo: 'a792', n: 15 },
    ammo_a792k: { name: AMMO.a792k.name, ammo: 'a792k', n: 30 },
    ammo_a22: { name: AMMO.a22.name, ammo: 'a22', n: 20 },
    ammo_rocket: { name: AMMO.rocket.name, ammo: 'rocket', n: 2 },
    ammo_pzrocket: { name: AMMO.pzrocket.name, ammo: 'pzrocket', n: 2 },
    ammo_grenade: { name: AMMO.grenade.name, ammo: 'grenade', n: 2 },
    ammo_stick: { name: AMMO.stick.name, ammo: 'stick', n: 2 },
    documents: { name: T('Секретные документы', 'Secret documents'), quest: true },
    codebook: { name: T('Шифровальная книга «Энигмы»', 'Enigma codebook'), quest: true },
    key: { name: T('Ключ', 'Key'), quest: true },
    cellkey: { name: T('Ключ от камер', 'Cell key'), quest: true },
    plans: { name: T('Чертежи «Готы»', 'Gotha plans'), quest: true },
    maps: { name: T('Карты стартовых площадок Фау-2', 'V-2 launch site maps'), quest: true },
    charges: { name: T('Взрывчатка', 'Explosive charges'), charges: 1 }
  };

  const HUMANS = {
    rifleman: { look: 'heer', hp: 100, acc: 0.55, weapons: ['kar98'], drop: 0.8, nade: 0.25 },
    smg: { look: 'heer', hp: 100, acc: 0.5, weapons: ['mp40'], drop: 0.8, nade: 0.3 },
    assault: { look: 'smock', hp: 110, acc: 0.6, weapons: ['stg44'], drop: 0.8, nade: 0.35 },
    grenadier: { look: 'heer', hp: 100, acc: 0.5, weapons: ['kar98'], drop: 0.8, nade: 1 },
    officer: { look: 'officer', hp: 80, acc: 0.55, weapons: ['p38'], drop: 0.9, nade: 0 },
    ss: { look: 'ss', hp: 125, acc: 0.65, weapons: ['mp40', 'stg44'], drop: 0.8, nade: 0.35 },
    sniper: { look: 'sniper', hp: 90, acc: 0.9, weapons: ['kar98s'], drop: 1, nade: 0 },
    mg: { look: 'heer', hp: 120, acc: 0.5, weapons: ['mg42'], drop: 0, nade: 0 },
    rocket: { look: 'smock', hp: 100, acc: 0.6, weapons: ['panzerschreck'], drop: 1, nade: 0 },
    sailor: { look: 'navy', hp: 90, acc: 0.5, weapons: ['mp40', 'kar98'], drop: 0.8, nade: 0.2 },
    worker: { look: 'worker', hp: 60, acc: 0.3, weapons: [], drop: 0, nade: 0 },
    commandant: { look: 'officer', hp: 160, acc: 0.6, weapons: ['p38'], drop: 1, nade: 0 },
    stahl: { look: 'stahl', hp: 420, acc: 0.75, weapons: ['stg44'], drop: 1, nade: 0.6 },
    agent: { look: 'agent', hp: 200, acc: 0.6, weapons: ['colt'], ally: true },
    pow: { look: 'pow', hp: 100, acc: 0, weapons: [], ally: true }
  };
  const DOG = { hp: 60, r: 0.35, h: 0.8, speed: 7.5, dmg: 9, sight: 22 };
  const TANK = { hp: 700, r: 2.2, h: 2.9, shell: 170, radius: 6, reload: 5.5, turn: 0.5, range: 90 };

  const SKILLS = [
    { id: 'easy', name: T('Рядовой', 'Private'), dmgIn: 0.5, acc: 0.75, react: 1.4, hp: 1 },
    { id: 'normal', name: T('Сержант', 'Sergeant'), dmgIn: 0.85, acc: 1, react: 1, hp: 1 },
    { id: 'hard', name: T('Лейтенант', 'Lieutenant'), dmgIn: 1.25, acc: 1.25, react: 0.7, hp: 1.1 }
  ];

  const MEDALS = {
    bronze: { name: T('Бронзовая звезда', 'Bronze Star'), ribbon: ['#c83028', '#fff', '#2a3a8a', '#fff', '#c83028'], metal: '#b07a3a', shape: 'star', desc: T('Задание выполнено.', 'Mission accomplished.') },
    silver: { name: T('Серебряная звезда', 'Silver Star'), ribbon: ['#2a3a8a', '#fff', '#c83028', '#fff', '#2a3a8a'], metal: '#c8c8d0', shape: 'star', desc: T('Задание выполнено с отличием.', 'Mission accomplished with distinction.') },
    dsc: { name: T('Крест «За выдающиеся заслуги»', 'Distinguished Service Cross'), ribbon: ['#2a3a8a', '#c83028', '#fff', '#c83028', '#2a3a8a'], metal: '#a88a3a', shape: 'cross', desc: T('Безупречно — точность, скорость и хладнокровие.', 'Flawless: accuracy, speed and nerve.') },
    purple: { name: T('Пурпурное сердце', 'Purple Heart'), ribbon: ['#fff', '#6a1a6a', '#6a1a6a', '#6a1a6a', '#fff'], metal: '#7a3a8a', shape: 'heart', desc: T('Ранен, но довёл задание до конца.', 'Wounded, but finished the job.') },
    marksman: { name: T('Знак «Отличный стрелок»', 'Expert Marksman Badge'), ribbon: ['#8a8a8a', '#c8c8c8', '#8a8a8a'], metal: '#c0c0c8', shape: 'badge', desc: T('20 попаданий в голову за кампанию.', '20 headshots across the campaign.') },
    shadow: { name: T('Медаль «Тень»', 'Shadow Medal'), ribbon: ['#1a1a1a', '#5a5a5a', '#1a1a1a'], metal: '#6a6a6a', shape: 'star', desc: T('Задание в тылу врага без единой тревоги.', 'A mission behind the lines without a single alarm.') },
    honor: { name: T('Медаль Почёта', 'Medal of Honor'), ribbon: ['#6ab0e8', '#fff', '#6ab0e8'], metal: '#d8b048', shape: 'honor', desc: T('За храбрость, проявленную с риском для жизни сверх долга.', 'For gallantry at the risk of life above and beyond the call of duty.') }
  };

  const CODES = {
    OPENALL: { name: T('Все миссии открыты', 'All missions unlocked') },
    BULLETPROOF: { name: T('Неуязвимость', 'Invulnerability') },
    ARSENAL: { name: T('Всё оружие и патроны', 'All weapons and ammo') },
    HEADHUNTER: { name: T('Только попадания в голову убивают', 'Headshots only') },
    RUBBERBALLS: { name: T('Прыгучие гранаты', 'Bouncy grenades') },
    BIGHEADS: { name: T('Большие головы', 'Big heads') }
  };

  const STR = {
    ru: {
      title: 'MEDAL OF HONOR 98', sub: 'Операции УСС, 1944–1945', newCampaign: 'Новая кампания', continue: 'Продолжить', missions: 'Миссии', medals: 'Медали', options: 'Настройки', controls: 'Управление', passwords: 'Пароли', credits: 'Авторы', quit: 'Выход',
      difficulty: 'Сложность', back: 'Назад', resume: 'Продолжить', restart: 'Начать миссию заново', objectivesBtn: 'Задачи', mainMenu: 'Главное меню', locked: 'закрыто', start: 'Начать задание', briefing: 'Инструктаж', objectives: 'Задачи', optional: 'необязательно',
      done: 'выполнено', failed: 'провалено', missionComplete: 'ЗАДАНИЕ ВЫПОЛНЕНО', missionFailed: 'ЗАДАНИЕ ПРОВАЛЕНО', youDied: 'ВЫ ПОГИБЛИ', pressFire: 'Нажмите ЛКМ или Enter', next: 'Далее', retry: 'Повторить', stats: 'Итоги',
      time: 'Время', kills: 'Убито', headshots: 'Попаданий в голову', shots: 'Выстрелов', accuracy: 'Точность', hpLost: 'Потеряно здоровья', alarms: 'Тревог', rating: 'Оценка', awarded: 'Награда',
      loading: 'Загрузка', ammo: 'Патроны', noAmmo: 'Нет патронов', alarm: 'ТРЕВОГА!', objUpdated: 'Задачи обновлены', objDone: 'Задача выполнена', plant: 'Заложить взрывчатку', planting: 'Закладка взрывчатки…', planted: 'Взрывчатка заложена! Уходите!', noCharges: 'Нет взрывчатки',
      use: 'Использовать', open: 'Открыть', lockedDoor: 'Заперто', needKey: 'Нужен ключ', free: 'Освободить', freed: 'Пленный освобождён', take: 'Взять', showPapers: 'Показать документы [F]', papersOk: 'Danke. Weitermachen.', papersAsk: 'Halt! Papiere, bitte!', papersFail: 'Alarm! Spion!',
      sens: 'Чувствительность мыши', invert: 'Инверсия мыши', fov: 'Поле зрения', sfx: 'Громкость звуков', music: 'Громкость музыки', res: 'Разрешение 3D', lang: 'Язык', bob: 'Покачивание', fps: 'Показывать FPS', on: 'вкл', off: 'выкл',
      enterCode: 'Введите пароль', codeOk: 'Пароль принят', codeBad: 'Неверный пароль', activeCodes: 'Активные пароли', apply: 'Ввести',
      extraction: 'Точка эвакуации', mustFinish: 'Сначала выполните все основные задачи', agentLost: 'Агент G-3 погиб', escort: 'Агент идёт за вами', tankDown: 'Танк уничтожен', targetDown: 'Цель уничтожена',
      webgl: 'Не удалось запустить 3D-графику (WebGL). ', paused: 'Пауза', campaignDone: 'КАМПАНИЯ ЗАВЕРШЕНА', case: 'Футляр с наградами', noMedals: 'Наград пока нет.',
      help: ['W A S D — движение, мышь — обзор', 'ЛКМ — огонь, ПКМ — прицел / оптика', 'Shift — бег, Ctrl или C — присесть, Пробел — прыжок', 'Q / E — выглянуть из-за угла', 'R — перезарядка, F — действие (двери, взрывчатка, документы)', '1–7 и колесо — оружие (7 — документы)', 'G — бросить гранату, Tab — задачи и компас', 'Esc — меню, пауза']
    },
    en: {
      title: 'MEDAL OF HONOR 98', sub: 'OSS operations, 1944–1945', newCampaign: 'New campaign', continue: 'Continue', missions: 'Missions', medals: 'Medals', options: 'Options', controls: 'Controls', passwords: 'Passwords', credits: 'Credits', quit: 'Quit',
      difficulty: 'Difficulty', back: 'Back', resume: 'Resume', restart: 'Restart mission', objectivesBtn: 'Objectives', mainMenu: 'Main menu', locked: 'locked', start: 'Begin mission', briefing: 'Briefing', objectives: 'Objectives', optional: 'optional',
      done: 'complete', failed: 'failed', missionComplete: 'MISSION ACCOMPLISHED', missionFailed: 'MISSION FAILED', youDied: 'YOU ARE DEAD', pressFire: 'Click or press Enter', next: 'Next', retry: 'Retry', stats: 'Debriefing',
      time: 'Time', kills: 'Kills', headshots: 'Headshots', shots: 'Shots fired', accuracy: 'Accuracy', hpLost: 'Health lost', alarms: 'Alarms', rating: 'Rating', awarded: 'Awarded',
      loading: 'Loading', ammo: 'Ammo', noAmmo: 'Out of ammo', alarm: 'ALARM!', objUpdated: 'Objectives updated', objDone: 'Objective complete', plant: 'Plant explosives', planting: 'Planting explosives…', planted: 'Charges set! Get clear!', noCharges: 'No explosives',
      use: 'Use', open: 'Open', lockedDoor: 'Locked', needKey: 'You need a key', free: 'Free', freed: 'Prisoner freed', take: 'Take', showPapers: 'Show papers [F]', papersOk: 'Danke. Weitermachen.', papersAsk: 'Halt! Papiere, bitte!', papersFail: 'Alarm! Spion!',
      sens: 'Mouse sensitivity', invert: 'Invert mouse', fov: 'Field of view', sfx: 'Sound volume', music: 'Music volume', res: '3D resolution', lang: 'Language', bob: 'View bob', fps: 'Show FPS', on: 'on', off: 'off',
      enterCode: 'Enter password', codeOk: 'Password accepted', codeBad: 'Wrong password', activeCodes: 'Active passwords', apply: 'Enter',
      extraction: 'Extraction point', mustFinish: 'Complete all primary objectives first', agentLost: 'Agent G-3 was killed', escort: 'The agent follows you', tankDown: 'Tank destroyed', targetDown: 'Target destroyed',
      webgl: 'Could not start 3D graphics (WebGL). ', paused: 'Paused', campaignDone: 'CAMPAIGN COMPLETE', case: 'Medal case', noMedals: 'No medals yet.',
      help: ['W A S D — move, mouse — look', 'Left click — fire, right click — aim / scope', 'Shift — run, Ctrl or C — crouch, Space — jump', 'Q / E — lean', 'R — reload, F — use (doors, explosives, documents)', '1–7 and wheel — weapons (7 — papers)', 'G — throw grenade, Tab — objectives and compass', 'Esc — menu, pause']
    }
  };

  const BARKS = {
    spot: [T('Da ist er!', 'Da ist er!'), T('Achtung! Amerikaner!', 'Achtung! Amerikaner!'), T('Feuer!', 'Feuer!'), T('Dort drüben!', 'Dort drüben!')],
    grenade: [T('Granate!', 'Granate!'), T('Deckung!', 'Deckung!')],
    throwback: [T('Zurück damit!', 'Zurück damit!'), T('Hier, nimm!', 'Hier, nimm!')],
    reload: [T('Nachladen!', 'Nachladen!'), T('Gib mir Deckung!', 'Gib mir Deckung!')],
    hurt: [T('Aaah!', 'Aaah!'), T('Ich bin getroffen!', 'Ich bin getroffen!'), T('Sanitäter!', 'Sanitäter!')],
    surrender: [T('Nicht schießen! Ich ergebe mich!', 'Nicht schießen! Ich ergebe mich!'), T('Kamerad! Kamerad!', 'Kamerad! Kamerad!')],
    lost: [T('Wo ist er hin?', 'Wo ist er hin?'), T('Sucht ihn!', 'Sucht ihn!')],
    alarm: [T('Alarm! Alarm!', 'Alarm! Alarm!'), T('Eindringling!', 'Eindringling!')],
    body: [T('Ein Toter! Alarm!', 'Ein Toter! Alarm!')],
    dog: [T('Fass!', 'Fass!')],
    helmet: [T('Mein Helm!', 'Mein Helm!')],
    stahl: [T('Für das Reich! Keiner kommt hier lebend raus!', 'Für das Reich! Keiner kommt hier lebend raus!'), T('Sie sind tapfer, Amerikaner. Tapferkeit ist nutzlos.', 'You are brave, American. Bravery is useless.'), T('Befehl ist Befehl!', 'Befehl ist Befehl!')]
  };

  S.DATA = { T, AMMO, WEAPONS, CAT_ORDER, PICKUPS, HUMANS, DOG, TANK, SKILLS, MEDALS, CODES, STR, BARKS };
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Moh98 = globalThis.Moh98 || {});
