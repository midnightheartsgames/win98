(function (Z) {
  'use strict';

  const G = Z.Game.prototype;
  const P = Math.PI, H = Math.PI / 2;

  Object.assign(Z.HUMANS, {
    hobotFriend: { name: 'Хобот «Красной воды»', faction: 'hobots', hp: 90, lvl: [3, 6], skill: 45, weapons: [['knife', 0.5], ['pm', 0.3], ['crowbar', 0.2]], looks: [{ top: 'rags', topCol: [90, 70, 60], gasmask: 'hose', grime: true }, { top: 'ozk', topCol: [70, 80, 60], gasmask: 'hose' }], loot: [['filter', 0.3, 1, 1], ['b190', 0.3, 1, 1]], xp: 20 },
    brigadir: { name: 'Ударник бригады', faction: 'brigade', hp: 220, lvl: [6, 9], skill: 55, weapons: [['sledge', 0.6], ['rivet', 0.4]], looks: [{ top: 'workwear', topCol: [70, 70, 60], bulk: 0.5, scale: 1.3, slag: true, hat: 'kaska', hatCol: [160, 150, 60], sex: 'm' }], loot: [['rivets', 0.6, 6, 14], ['stakhanovit', 0.2, 1, 1]], xp: 60 },
    skif: { name: 'Скиф', faction: 'raiders', hp: 95, lvl: [4, 7], skill: 50, hostile: true, weapons: [['axe', 0.3], ['sabre', 0.2], ['toz', 0.3], ['mosin', 0.2]], looks: [{ top: 'robe', topCol: [120, 90, 50], hat: 'papakha', hatCol: [60, 50, 40], beard: 'full', sex: 'm' }, { top: 'robe', topCol: [100, 70, 60], sex: 'f', hat: 'kerchief', hatCol: [150, 120, 50] }], loot: [['talon', 0.6, 4, 16], ['seeds', 0.4, 1, 2], ['samogon', 0.2, 1, 1]], xp: 25 },
    pioneer: { name: 'Пионер', faction: 'vozn', hp: 50, lvl: [1, 2], skill: 30, weapons: [['fists', 1]], looks: [{ top: 'shirt', topCol: [230, 230, 220], legsCol: [40, 50, 90], scale: 0.86 }], loot: [['tie', 0.5, 1, 1]], xp: 5 },
    sichGuard: { name: 'Сечевик', faction: 'sich', hp: 115, lvl: [5, 8], skill: 60, weapons: [['mosin', 0.5], ['sabre', 0.5]], looks: [{ top: 'zhupan', topCol: [40, 60, 140], hat: 'papakha', hair: 'chub', beard: 'cossack', sex: 'm' }, { top: 'zhupan', topCol: [140, 40, 40], hat: 'papakha', hair: 'chub', beard: 'cossack', sex: 'm' }], apparel: ['zhupan'], loot: [['talon', 0.7, 5, 20], ['samogon', 0.3, 1, 1], ['a762r', 0.4, 4, 10]], xp: 30 }
  });

  const N = Z.NPCS = {};
  const npc = (id, o) => { N[id] = Object.assign({ id, tpl: 'villager', wander: 0 }, o); return N[id]; };

  const AID = [['stim', 0.9, 2, 5], ['b190', 0.8, 1, 3], ['kiodine', 0.7, 1, 3], ['promedol', 0.4, 1, 2], ['medbag', 0.2, 1, 1], ['water', 0.7, 2, 4], ['bkMed', 0.15, 1, 1], ['mgMed', 0.4, 1, 1]];
  const FOOD = [['kvass', 1, 3, 6], ['samogon', 1, 2, 5], ['vodka', 0.7, 1, 3], ['sitro', 0.8, 2, 4], ['ukha', 0.6, 1, 2], ['bread', 1, 2, 4], ['salo', 0.8, 1, 3], ['tushenka', 0.7, 1, 3], ['water', 0.8, 2, 4]];
  const SHOP = [['tushenka', 1, 2, 5], ['sgushenka', 0.8, 1, 3], ['kilka', 0.9, 2, 4], ['bread', 1, 2, 4], ['water', 1, 2, 5], ['matches', 1, 2, 4], ['belomor', 0.8, 1, 3], ['tape', 0.8, 1, 3], ['glue', 0.7, 1, 2], ['lockpick', 0.9, 3, 8], ['a918', 0.8, 12, 30], ['a12', 0.7, 6, 14], ['molotov', 0.4, 1, 2], ['vatnik', 0.5, 1, 1], ['kepka', 0.5, 1, 1], ['ushanka', 0.4, 1, 1], ['mgSurv', 0.3, 1, 1], ['bottle', 0.6, 1, 3]];
  const JUNK = [['tube', 0.9, 2, 5], ['capacitor', 0.9, 2, 5], ['wire', 0.9, 2, 4], ['relay', 0.6, 1, 3], ['repairkit', 0.5, 1, 1], ['glasses', 0.4, 1, 1], ['samovar', 0.3, 1, 1], ['clock', 0.5, 1, 2], ['spring', 0.8, 2, 5], ['krona', 0.6, 4, 12], ['mgSci', 0.4, 1, 1], ['mgRep', 0.4, 1, 1], ['bkRep', 0.15, 1, 1], ['bkSci', 0.12, 1, 1], ['lockpick', 0.6, 2, 6]];
  const GUNS = [['pm', 0.9, 1, 1], ['tt', 0.6, 1, 1], ['nagan', 0.5, 1, 1], ['obrez', 0.7, 1, 1], ['toz', 0.6, 1, 1], ['mosin', 0.5, 1, 1], ['sks', 0.3, 1, 1], ['knife', 0.8, 1, 1], ['axe', 0.5, 1, 1], ['a918', 1, 20, 50], ['a762t', 0.9, 14, 36], ['a12', 1, 10, 24], ['a762r', 0.8, 8, 20], ['a762k', 0.4, 10, 30], ['f1', 0.3, 1, 2], ['rgd', 0.5, 1, 3], ['repairkit', 0.4, 1, 1], ['mgGuns', 0.4, 1, 1]];
  const CHUMAK = [['salo', 1, 2, 4], ['potato', 1, 3, 6], ['apricot', 1, 3, 6], ['seeds', 1, 3, 6], ['samogon', 0.8, 1, 3], ['kerosene', 0.7, 1, 3], ['dust', 0.6, 1, 2], ['filter', 0.4, 1, 2], ['rag', 0.8, 2, 4], ['mgBarter', 0.3, 1, 1], ['bkSurv', 0.1, 1, 1]];
  const SICHSMITH = [['sabre', 0.9, 1, 2], ['axe', 0.7, 1, 1], ['mosin', 0.7, 1, 1], ['mosinScope', 0.2, 1, 1], ['nagan', 0.5, 1, 1], ['a762r', 1, 14, 30], ['a762n', 0.7, 10, 24], ['zhupan', 0.6, 1, 1], ['papakha', 0.6, 1, 1], ['bkMelee', 0.15, 1, 1], ['repairkit', 0.4, 1, 1]];
  const KORCHMA = [['samogon', 1, 3, 6], ['salo', 1, 2, 4], ['bread', 1, 2, 4], ['ukha', 0.7, 1, 2], ['kvass', 0.8, 2, 4], ['baibakCooked', 0.5, 1, 2], ['water', 0.7, 1, 3]];
  const KOMEND = [['akm', 0.4, 1, 1], ['sks', 0.6, 1, 1], ['pm', 0.8, 1, 1], ['a762k', 1, 20, 60], ['a918', 1, 20, 40], ['shinel', 0.5, 1, 1], ['kaska', 0.7, 1, 1], ['bronik', 0.3, 1, 1], ['gimnastyorka', 0.6, 1, 1], ['stim', 0.8, 2, 4], ['f1', 0.6, 1, 3], ['rgd', 0.7, 1, 3], ['bkGuns', 0.15, 1, 1], ['mgGuns', 0.4, 1, 1]];
  const COOP = [['montana', 0.3, 1, 1], ['kozhanka', 0.6, 1, 1], ['glasses', 0.6, 1, 1], ['vodka', 1, 2, 5], ['stakhanovit', 0.6, 1, 2], ['sidnocarb', 0.6, 1, 2], ['metan', 0.5, 1, 2], ['nootrop', 0.5, 1, 2], ['ppsh', 0.3, 1, 1], ['a762t', 0.8, 20, 40], ['bkBarter', 0.2, 1, 1], ['bkSpeech', 0.15, 1, 1], ['mgBarter', 0.5, 1, 1], ['mgSpeech', 0.5, 1, 1], ['filter', 0.5, 2, 4]];
  const ROBO = [['krona', 1, 20, 50], ['accu', 0.6, 6, 16], ['luch', 0.6, 1, 1], ['molniya', 0.4, 1, 1], ['giper', 0.1, 1, 1], ['tube', 1, 3, 6], ['relay', 1, 2, 5], ['capacitor', 1, 3, 6], ['bkEnergy', 0.15, 1, 1], ['mgEnergy', 0.5, 1, 1], ['bkSci', 0.15, 1, 1]];
  const BRIGADE = [['rivet', 0.5, 1, 1], ['rivets', 1, 20, 50], ['workwear', 0.7, 1, 1], ['sledge', 0.5, 1, 1], ['rebar', 0.8, 1, 2], ['stakhanovit', 0.5, 1, 2], ['tntRaw', 0.6, 1, 2], ['fuse', 0.8, 2, 4], ['bkExp', 0.12, 1, 1], ['mgRep', 0.4, 1, 1]];
  const FISH = [['somRaw', 1, 2, 4], ['ukha', 0.8, 1, 3], ['kilka', 0.6, 1, 2], ['dneprWater', 1, 3, 6], ['samogon', 0.6, 1, 2], ['telnyashka', 0.5, 1, 1], ['obrez', 0.3, 1, 1], ['a12', 0.6, 6, 12]];

  npc('doctor', { name: 'Доктор Ласточкина', faction: 'vozn', essential: true, dlg: 'doctor', look: { sex: 'f', age: 0.7, top: 'labcoat', topCol: [220, 220, 214], hair: 'bun', hairCol: [200, 196, 190], glasses: true }, vendor: { stock: AID, cash: 400 }, weapon: 'fists' });
  npc('timofey', { name: 'Тимофей', creature: 'agregat', faction: 'vozn', essential: true, dlg: 'timofey', site: 'vozn', u: 3, v: -14, yaw: P, wander: 3, cid: 'timofey' });
  npc('karpenko', { name: 'Олесь Карпенко', faction: 'vozn', essential: true, dlg: 'karpenko', look: { sex: 'm', age: 0.6, top: 'vatnik', topCol: [70, 70, 64], hat: 'kepka', beard: 'mustache' }, weapon: 'toz' });
  npc('samovar', { name: 'Семён «Самовар»', faction: 'vozn', dlg: 'samovar', look: { sex: 'm', age: 0.5, top: 'telnyashka', build: 0.9, hair: 'bald', beard: 'mustache' }, vendor: { stock: FOOD, cash: 350 }, weapon: 'obrez' });
  npc('yarina', { name: 'Ярина', tpl: 'sichGuard', faction: 'vozn', essential: true, dlg: 'yarina', look: { sex: 'f', age: 0.25, top: 'zhupan', topCol: [60, 80, 60], hair: 'long', hairCol: [40, 30, 22], hat: 'none' }, weapon: 'mosinScope', level: 4, cid: 'yarina' });
  npc('lyuba', { name: 'Продавщица Люба', faction: 'vozn', dlg: 'lyuba', look: { sex: 'f', age: 0.4, top: 'dress', topCol: [170, 60, 70], hat: 'kerchief', hatCol: [220, 210, 190] }, vendor: { stock: SHOP, cash: 500 } });
  npc('mykola', { name: 'Микола-коваль', faction: 'vozn', dlg: 'mykola', site: 'vozn', u: 33, v: -21, yaw: P, look: { sex: 'm', age: 0.45, top: 'workwear', topCol: [80, 60, 50], build: 0.9, beard: 'full' }, weapon: 'sledge' });
  npc('panas', { name: 'Дед Панас', faction: 'vozn', dlg: 'panas', look: { sex: 'm', age: 0.9, top: 'telnyashka', hat: 'kepka', beard: 'full', hairCol: [210, 206, 200] }, vendor: { stock: FISH, cash: 250 }, weapon: 'obrez' });
  npc('zhora', { name: 'Жора Барыга', faction: 'coop', dlg: 'zhora', site: 'market', u: 0, v: -7.6, yaw: P, look: { sex: 'm', age: 0.35, top: 'kozhanka', topCol: [50, 40, 34], hat: 'kepka' }, vendor: { stock: JUNK, cash: 700 }, weapon: 'tt' });
  npc('valya', { name: 'Тётя Валя', faction: 'vozn', dlg: 'valya', site: 'market', u: -12, v: 7.6, yaw: 0, look: { sex: 'f', age: 0.6, top: 'vatnik', topCol: [70, 80, 70], hat: 'kerchief', hatCol: [140, 40, 40] }, vendor: { stock: GUNS, cash: 900 }, weapon: 'obrez' });
  npc('ostap', { name: 'Чумак Остап', tpl: 'chumak', faction: 'vozn', dlg: 'ostap', site: 'market', u: 12, v: 7.6, yaw: 0, vendor: { stock: CHUMAK, cash: 400 } });
  npc('mytar', { name: 'Сержант Мытарь', tpl: 'komendach', faction: 'komendatura', dlg: 'mytar', site: 'market', u: 0, v: -11.2, yaw: P });
  npc('dub', { name: 'Сержант Дуб', tpl: 'komendach', faction: 'komendatura', dlg: 'dub', site: 'kpp', u: -5, v: -7.2, yaw: H, essential: true });
  npc('savchenko', { name: 'Полковник Савченко', tpl: 'komendach', faction: 'komendatura', essential: true, dlg: 'savchenko', look: { sex: 'm', age: 0.65, top: 'shinel', topCol: [92, 96, 76], hat: 'furazhka', beard: 'mustache' }, weapon: 'tt' });
  npc('kvarter', { name: 'Старшина Запасной', tpl: 'komendach', faction: 'komendatura', dlg: 'kvarter', vendor: { stock: KOMEND, cash: 800, rep: 1 } });
  npc('montana', { name: 'Жорж «Монтана»', tpl: 'coop', faction: 'coop', dlg: 'montana', look: { sex: 'm', age: 0.35, top: 'jeans', topCol: [60, 90, 150], legsCol: [50, 70, 120], hair: 'long', hairCol: [26, 24, 24] }, weapon: 'ppsh', level: 6 });
  npc('bella', { name: 'Администратор Белла', tpl: 'coop', faction: 'coop', dlg: 'bella', look: { sex: 'f', age: 0.4, top: 'dress', topCol: [40, 40, 60], hair: 'long', hairCol: [150, 40, 30] }, vendor: { stock: COOP, cash: 1500 }, weapon: 'pm' });
  npc('croupier', { name: 'Крупье Лёня', tpl: 'coop', faction: 'coop', dlg: 'croupier', look: { sex: 'm', age: 0.3, top: 'shirt', topCol: [220, 220, 220], glasses: true } });
  npc('aristarkh', { name: 'Аристарх Львович', faction: 'vozn', essential: true, dlg: 'aristarkh', look: { sex: 'm', age: 0.8, top: 'gimn', topCol: [60, 70, 90], hat: 'furazhka', hatCol: [40, 50, 80], beard: 'mustache', glasses: true } });
  npc('levitan', { name: 'Лёва Эфир', faction: 'vozn', dlg: 'levitan', look: { sex: 'm', age: 0.55, top: 'shirt', topCol: [200, 196, 180], glasses: true, hair: 'short' } });
  npc('gosha', { name: 'Шпрехшталмейстер Гоша', faction: 'coop', dlg: 'gosha', stat: true, look: { sex: 'm', age: 0.45, top: 'kozhanka', topCol: [120, 20, 30], beard: 'mustache' }, weapon: 'fists' });
  npc('girya', { name: 'Гиря', tpl: 'shpana', faction: 'shpana', dlg: 'girya', hostile: false, look: { sex: 'm', age: 0.3, top: 'tracksuit', topCol: [30, 30, 30], hair: 'bald', build: 1, scar: true }, weapon: 'tt', level: 4, hp: 120 });
  npc('sirko', { name: 'Кошевой Остап Сирко', tpl: 'sichGuard', faction: 'sich', essential: true, dlg: 'sirko', look: { sex: 'm', age: 0.7, top: 'zhupan', topCol: [150, 30, 40], hat: 'papakha', hair: 'chub', beard: 'cossack', hairCol: [180, 176, 170] }, weapon: 'sabreAtaman' });
  npc('pisar', { name: 'Войсковой писарь Голота', tpl: 'sichGuard', faction: 'sich', dlg: 'pisar', look: { sex: 'm', age: 0.5, top: 'zhupan', topCol: [50, 50, 90], hair: 'chub', beard: 'cossack', glasses: true }, weapon: 'nagan' });
  npc('firma', { name: 'Аркадий «Фирма» Лисовой', tpl: 'coop', faction: 'coop', essential: false, dlg: 'firma', look: { sex: 'm', age: 0.5, top: 'kozhanka', topCol: [30, 26, 24], hair: 'short', hairCol: [26, 24, 24], beard: 'stubble', glasses: true }, weapon: 'ttFirma', level: 8, hp: 160 });
  npc('shinkar', { name: 'Шинкарь Хома', tpl: 'sichGuard', faction: 'sich', dlg: 'shinkar', look: { sex: 'm', age: 0.6, top: 'robe', topCol: [120, 90, 60], hair: 'bald', beard: 'cossack', build: 1 }, vendor: { stock: KORCHMA, cash: 400 } });
  npc('kozak_smith', { name: 'Коваль Мусий', tpl: 'sichGuard', faction: 'sich', dlg: 'musiy', site: 'sich', u: -14, v: 16.4, yaw: 0, look: { sex: 'm', age: 0.5, top: 'workwear', topCol: [70, 50, 40], hair: 'chub', beard: 'cossack' }, vendor: { stock: SICHSMITH, cash: 800 } });
  npc('keeper', { name: 'Хранитель Глибов', faction: 'sich', essential: true, dlg: 'keeper', look: { sex: 'm', age: 0.85, top: 'robe', topCol: [60, 50, 70], beard: 'full', hairCol: [220, 216, 210], glasses: true } });
  npc('bulbenko', { name: 'Председатель Бульбенко', faction: 'vozn', dlg: 'bulbenko', look: { sex: 'm', age: 0.6, top: 'vatnik', topCol: [60, 70, 60], hat: 'ushanka', build: 1, beard: 'mustache' }, weapon: 'toz' });
  npc('vozhatyi', { name: 'Вожатый-7', creature: 'agregat', faction: 'vozn', dlg: 'vozhatyi', site: 'lager', u: 2, v: 8, yaw: 0, wander: 8, look: { tie: true } });
  npc('kuzmich', { name: 'Бригадир Кузьмич', tpl: 'brigadir', faction: 'brigade', essential: true, dlg: 'kuzmich', look: { sex: 'm', top: 'workwear', topCol: [70, 70, 60], bulk: 0.55, scale: 1.34, slag: true, hat: 'kaska', hatCol: [200, 60, 40], beard: 'full' }, vendor: { stock: BRIGADE, cash: 600 }, weapon: 'sledge' });
  npc('protasov', { name: 'Наставник Протасов', tpl: 'hobotFriend', faction: 'hobots', essential: true, dlg: 'protasov', look: { top: 'ozk', topCol: [60, 70, 50], gasmask: 'hose', sex: 'm' } });
  npc('nomerok', { name: 'Дежурный Номерок', faction: 'vozn', dlg: 'nomerok', look: { sex: 'm', age: 0.4, top: 'gimn', topCol: [110, 120, 140], hair: 'short', glasses: true } });
  npc('zarubin', { name: 'Доктор Зарубин', faction: 'vozn', essential: true, dlg: 'zarubin', look: { sex: 'm', age: 0.7, top: 'labcoat', topCol: [200, 200, 190], beard: 'full', hairCol: [160, 156, 150] }, weapon: 'luch' });
  npc('planner', { name: 'АСУ «Плановик-77»', creature: 'druzhinnik', faction: 'robots', essential: true, dlg: 'planner', friendly: true, stat: true, look: { planner: true } });

  const spawnNPC = (g, cell, id, x, z, yaw, extra) => {
    const d = N[id];
    if (!d) throw new Error('npc ' + id);
    const prev = g.cell;
    g.cell = cell;
    let a;
    try {
      if (d.creature) a = g.spawnCreature(d.creature, x, z, { name: d.name, faction: d.faction, friendly: true, look: d.look, wander: d.wander, hpMult: d.hpMult || 1.5 });
      else a = g.spawnHuman(d.tpl, x, z, { name: d.name, faction: d.faction, look: d.look ? Object.assign(Z.randomLook(Z.rng(Z.hashStr(id)), { sex: d.look.sex || 'm' }), d.look) : undefined, weapon: d.weapon, hostile: d.hostile === undefined ? false : d.hostile, wander: d.wander || 0, level: d.level, hp: d.hp, yaw });
    } finally { g.cell = prev; }
    a.id = 'npc_' + id;
    a.npcId = id;
    a.yaw = yaw || 0;
    a.ai.homeYaw = yaw || 0;
    a.ai.wander = d.wander || 0;
    a.canTalk = !!d.dlg;
    a.dlg = d.dlg;
    a.essential = !!d.essential;
    a.friendly = d.creature ? true : !!d.friendly;
    a.persistent = true;
    if (d.cid) a.cid = d.cid;
    if (d.stat) { a.ai.script = (b, dt) => { b.vx = b.vz = 0; }; }
    if (d.vendor) a.vendor = Object.assign({ inv: [], talons: d.vendor.cash || 300, stockDay: -1 }, d.vendor);
    if (extra) Object.assign(a, extra);
    return a;
  };
  Z.spawnNPC = spawnNPC;

  G.hostileToPlayerBase = G.hostileToPlayer;
  G.hostileToPlayer = function (a) {
    if (a.friendly && !a.provoked && !a.hostile) return false;
    return this.hostileToPlayerBase(a);
  };

  Z.SPAWN_GROUPS = [
    { site: 'vozn', at: [-12, -8], tpl: 'villager', n: 2, r: 10, wander: 10, faction: 'vozn' },
    { site: 'vozn', at: [10, 8], tpl: 'villager', n: 2, r: 10, wander: 12, faction: 'vozn' },
    { site: 'vozn', at: [-30, 8], tpl: 'villager', n: 1, r: 4, wander: 8, faction: 'vozn' },
    { site: 'vozn', at: [-14, 32], tpl: 'rechnik', n: 2, r: 3, wander: 4, faction: 'vozn' },
    { site: 'vozn', at: [-57, -2], tpl: 'villager', n: 1, r: 1, wander: 0, faction: 'vozn', weapon: 'toz', yaw: -H },
    { site: 'vozn', at: [60, 2], tpl: 'villager', n: 1, r: 1, wander: 0, faction: 'vozn', weapon: 'toz', yaw: H },
    { site: 'market', at: [0, 0], tpl: 'villager', n: 4, r: 10, wander: 9, faction: 'vozn' },
    { site: 'market', at: [-3, -16], tpl: 'komendach', n: 1, r: 2, wander: 2, faction: 'komendatura' },
    { site: 'kpp', at: [-8, -4], tpl: 'komendach', n: 2, r: 3, wander: 3, faction: 'komendatura', key: 'kppguard' },
    { site: 'kpp', at: [4, -13], tpl: 'komendach', n: 1, r: 2, wander: 2, faction: 'komendatura', key: 'kppguard' },
    { site: 'square', at: [0, 3], tpl: 'komendach', n: 2, r: 3, wander: 2, faction: 'komendatura' },
    { site: 'sich', at: [34, -3], tpl: 'sichGuard', n: 1, r: 0.5, wander: 0, faction: 'sich', yaw: H, key: 'sichgate' },
    { site: 'sich', at: [34, 3], tpl: 'sichGuard', n: 1, r: 0.5, wander: 0, faction: 'sich', yaw: H, key: 'sichgate' },
    { site: 'sich', at: [4, 4], tpl: 'sichGuard', n: 4, r: 12, wander: 12, faction: 'sich' },
    { site: 'sichpost', at: [0, -12], tpl: 'sichGuard', n: 3, r: 3, wander: 3, faction: 'sich', key: 'sichpost' },
    { site: 'kolkhoz', at: [-16, 14], tpl: 'villager', n: 2, r: 8, wander: 8, faction: 'vozn' },
    { site: 'plavni', at: [2, 2], tpl: 'rechnik', n: 2, r: 4, wander: 5, faction: 'vozn' },
    { site: 'lager', at: [14, 6], tpl: 'pioneer', n: 3, r: 6, wander: 8, faction: 'vozn' },
    { site: 'pobeda', at: [0, 2], tpl: 'shpana', n: 5, r: 8, wander: 6, faction: 'shpana', hostile: false, key: 'pobeda' },
    { site: 'scythia', at: [0, -6], tpl: 'skif', n: 5, r: 10, wander: 8, faction: 'raiders' },
    { site: 'redmud', at: [-10, 0], tpl: 'marauder', n: 4, r: 12, wander: 8, faction: 'raiders' },
    { at: [-400, 600], tpl: 'marauder', n: 3, r: 10, wander: 10, faction: 'raiders' },
    { at: [450, -200], tpl: 'shpana', n: 3, r: 8, wander: 10, faction: 'shpana' },
    { at: [300, -90], tpl: 'shpana', n: 3, r: 8, wander: 10, faction: 'shpana' },
    { at: [-40, 470], creature: 'kolorad', n: 6, r: 14, wander: 14 },
    { at: [-52, 486], creature: 'koloradQueen', n: 1, r: 1, wander: 3, key: 'queen' },
    { at: [-150, 350], creature: 'medvedka', n: 2, r: 12, wander: 16 },
    { at: [10, 300], creature: 'medvedka', n: 1, r: 6, wander: 14 },
    { at: [-540, -665], creature: 'martyn', n: 3, r: 10, wander: 20 },
    { at: [-640, -730], creature: 'martyn', n: 2, r: 10, wander: 20 },
    { at: [360, 228], creature: 'som', n: 1, r: 4, wander: 10 },
    { at: [10, 255], creature: 'som', n: 1, r: 4, wander: 10 },
    { at: [210, 330], creature: 'som', n: 1, r: 4, wander: 10 },
    { at: [-700, 380], creature: 'som', n: 2, r: 8, wander: 10 },
    { at: [782, 1236], creature: 'somKing', n: 1, r: 1, wander: 12, key: 'somking' },
    { at: [760, 1210], creature: 'som', n: 2, r: 8, wander: 12 },
    { site: 'ptica', at: [0, 0], creature: 'broiler', n: 6, r: 14, wander: 14 },
    { site: 'ptica', at: [-10, -2], creature: 'rooster', n: 1, r: 2, wander: 8 },
    { at: [-250, 450], creature: 'baibak', n: 3, r: 14, wander: 16 },
    { at: [60, 540], creature: 'baibak', n: 2, r: 12, wander: 16 },
    { at: [-300, 60], creature: 'baibak', n: 2, r: 12, wander: 16 },
    { at: [700, -20], creature: 'dog', n: 3, r: 6, wander: 16 },
    { at: [330, -160], creature: 'dog', n: 3, r: 6, wander: 16 },
    { at: [-420, 260], creature: 'dog', n: 3, r: 6, wander: 18 },
    { site: 'sunflowers', at: [0, 0], creature: 'sunflower', n: 5, r: 18, wander: 0 },
    { at: [430, -840], creature: 'udarnik', n: 2, r: 10, wander: 10 },
    { at: [400, -760], creature: 'udarnikRivet', n: 1, r: 4, wander: 8 },
    { at: [470, -740], creature: 'agregat', n: 2, r: 6, wander: 6, hostile: true },
    { at: [360, -930], creature: 'lunokhod', n: 1, r: 2, wander: 14 },
    { at: [640, -150], creature: 'druzhinnik', n: 2, r: 8, wander: 10 },
    { at: [230, -620], creature: 'hobot', n: 2, r: 8, wander: 10 }
  ];

  const spawnGroup = (g, cell, grp, gi) => {
    let base = grp.at;
    if (grp.site) { const s = Z.SITES.find(x => x.id === grp.site); base = Z.siteToWorld(s, grp.at[0], grp.at[1]); }
    const R = Z.rng(1000 + gi * 77);
    const out = [];
    for (let i = 0; i < grp.n; i++) {
      const ang = R() * Math.PI * 2, rr = grp.r * Math.sqrt(R());
      let x = base[0] + Math.cos(ang) * rr, z = base[1] + Math.sin(ang) * rr;
      if (grp.n === 1 && grp.r <= 1) { x = base[0]; z = base[1]; }
      const prev = g.cell;
      g.cell = cell;
      let a;
      try {
        if (grp.creature) a = g.spawnCreature(grp.creature, x, z, { wander: grp.wander, faction: grp.faction, friendly: grp.friendly });
        else a = g.spawnHuman(grp.tpl, x, z, { faction: grp.faction, wander: grp.wander, hostile: grp.hostile, weapon: grp.weapon, yaw: grp.yaw });
      } finally { g.cell = prev; }
      a.id = 'sp' + gi + '_' + i;
      a.spawnKey = grp.key || null;
      if (grp.yaw !== undefined) { a.yaw = grp.yaw + (grp.site ? Z.siteYaw(Z.SITES.find(s => s.id === grp.site), 0) : 0); a.ai.homeYaw = a.yaw; }
      if (grp.creature && grp.hostile && a.cdef.neutral) a.hostile = true;
      out.push(a);
    }
    return out;
  };

  Z.EXTERIOR_BUILDERS.push((g, cell) => {
    for (const id in N) {
      const d = N[id];
      if (!d.site) continue;
      const s = Z.SITES.find(x => x.id === d.site);
      const w = Z.siteToWorld(s, d.u, d.v);
      spawnNPC(g, cell, id, w[0], w[1], Z.siteYaw(s, d.yaw));
    }
    Z.SPAWN_GROUPS.forEach((grp, i) => spawnGroup(g, cell, grp, i));
  });

  Z.INTERIOR_HOOKS.push((g, cell, def) => {
    for (const n of def.npcs || []) {
      const x = n.at[0] + 0.5, z = n.at[1] + 0.5;
      const a = spawnNPC(g, cell, n.id, x, z, n.yaw || 0);
      if (n.wander) a.ai.wander = n.wander;
    }
    (def.spawns || []).forEach((grp, i) => {
      const prev = g.cell;
      g.cell = cell;
      try {
        for (let k = 0; k < (grp.n || 1); k++) {
          const at = grp.pts ? grp.pts[k % grp.pts.length] : grp.at;
          const x = at[0] + 0.5 + (grp.pts ? 0 : (k % 3 - 1) * 0.9), z = at[1] + 0.5 + (grp.pts ? 0 : Math.floor(k / 3) * 0.9);
          const a = grp.creature ? g.spawnCreature(grp.creature, x, z, { wander: grp.wander === undefined ? 3 : grp.wander, faction: grp.faction, friendly: grp.friendly }) : g.spawnHuman(grp.tpl, x, z, { faction: grp.faction, wander: grp.wander === undefined ? 2 : grp.wander, hostile: grp.hostile, weapon: grp.weapon, yaw: grp.yaw });
          a.id = cell.id + '_s' + i + '_' + k;
          a.spawnKey = grp.key || null;
          if (grp.name) a.name = grp.name;
        }
      } finally { g.cell = prev; }
    });
  });

  G.recruit = function (a) {
    const max = this.player.sheet.has('partyBoy') ? 3 : 2;
    const have = [...this.cells.values()].reduce((n, c) => n + c.actors.filter(x => x.companion && !x.dead).length, 0);
    if (have >= max) { this.msg('С вами уже идут ' + have + ' спутника. Больше не прокормить.', 'warn'); return false; }
    a.companion = true;
    a.ai.wait = false;
    a.ai.state = 'idle';
    a.ai.mode = a.ai.mode || 'active';
    a.hostile = false;
    a.ai.always = true;
    this.flags['comp_' + (a.cid || a.npcId)] = true;
    this.msg(a.name + ' присоединяется к вам.', 'level');
    this.ev.emit('recruit', { a });
    return true;
  };

  G.dismiss = function (a) {
    a.companion = false;
    a.ai.always = false;
    a.ai.wait = false;
    const home = a.homeAt || a.ai.home;
    if (home) { a.ai.home = home.slice(0, 2); }
    this.flags['comp_' + (a.cid || a.npcId)] = false;
    this.msg(a.name + ' уходит домой.', 'info');
    this.ev.emit('dismiss', { a });
  };

  G.companions = function () { return this.cell.actors.filter(a => a.companion && !a.dead); };

  const baseFind = G.findActor;
  G.findActor = function (id) {
    const a = baseFind.call(this, id);
    if (a || !id) return a;
    for (const rid in Z.INTERIORS) {
      if (this.cells.has(rid)) continue;
      if (!(Z.INTERIORS[rid].npcs || []).some(n => n.id === id)) continue;
      this.loadCell(rid);
      return baseFind.call(this, id);
    }
    return null;
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
