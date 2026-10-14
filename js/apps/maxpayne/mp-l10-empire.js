(function (M) {
  'use strict';
  const RED = [1, 0.3, 0.2], CANDLE = [1, 0.62, 0.3];
  const GL = 4;
  const goth = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'goth', group, pos: [x, y, z], yaw, weapon, mode: 'ambush' }, o || {});

  M.defineLevel({
    id: 'empire',
    title: 'Империя зла',
    titleEn: 'An Empire of Evil',
    part: 1,
    chapter: 9,
    next: null,
    world: { ambient: [0.05, 0.03, 0.03], fog: { color: [0.05, 0.02, 0.02], near: 16, far: 70 }, weather: 'none', sky: 'none' },
    start: { pos: [2, 0, 5], yaw: -Math.PI / 2 },
    loadout: { weapons: ['beretta', 'beretta2', 'deagle', 'pump', 'bat', 'ingram', 'ingram2', 'grenade', 'molotov'], ammo: { '9mm': 160, '50ae': 21, '12g': 24, gren: 3, molo: 2 }, painkillers: 5 },
    music: 'tension',
    intro: 'empire_in',
    outro: 'empire_out',
    killY: -20,
    thought: 'Лупино где-то рядом. Слышно, как он поёт.',
    dynLights(g, t) {
      const out = [];
      const f = 0.85 + Math.sin(t * 9) * 0.1 + Math.sin(t * 23) * 0.05;
      out.push({ pos: [45, 1.2, 5], color: [1.6 * f, 0.5 * f, 0.2 * f], r: 12 });
      return out;
    },
    build(B) {
      B.plan({
        y: 0, h: 3.5, outer: 'stone_gothic',
        rooms: [
          { id: 'candle', x0: 0, z0: 0, x1: 12, z1: 10, y: 0, floor: 'wood_floor', wall: 'curtain_red', ceil: 'ceiling_dark' },
          { id: 'corr', x0: 12, z0: 3, x1: 30, z1: 7, y: 0, floor: 'stone_gothic', wall: 'stone_gothic', ceil: 'ceiling_dark' },
          { id: 'arena', x0: 30, z0: -10, x1: 60, z1: 20, y: 0, h: 10, floor: 'wood_floor', wall: 'stone_gothic', ceil: 'ceiling_dark', roof: 'roof_tar' },
          { id: 'alcove', x0: 60, z0: 0, x1: 68, z1: 10, y: 0, h: 6, floor: 'marble_dark', wall: 'curtain_red', ceil: 'ceiling_dark' },
          { id: 'side1', x0: 38, z0: -16, x1: 44, z1: -10, y: 0, floor: 'stone_gothic', wall: 'club_black', ceil: 'ceiling_dark' },
          { id: 'side2', x0: 46, z0: 20, x1: 52, z1: 26, y: 0, floor: 'stone_gothic', wall: 'club_black', ceil: 'ceiling_dark' }
        ],
        doors: [
          { x: 12, z: 5, w: 1.4, y: 0, door: { id: 'candle_door', mat: 'door_red', swing: 1 } },
          { x: 30, z: 5, w: 3, y: 0, h: 3, door: { id: 'gate', mat: 'bars', slide: true, locked: true, noPush: true, lockMsg: 'Решётка. Рычаг должен быть где-то в коридоре.' } },
          { x: 41, z: -10, w: 1.6, y: 0, door: { id: 's1_door', mat: 'door_old', swing: 1, locked: true, noPush: true } },
          { x: 49, z: 20, w: 1.6, y: 0, door: { id: 's2_door', mat: 'door_old', swing: -1, locked: true, noPush: true } },
          { x: 60, z: 5, w: 6, y: 0, h: 5 }
        ]
      });
      B.box(30, GL - 0.25, 16, 60, GL, 20, { top: 'wood_floor', side: 'trim', bottom: 'ceiling_dark' });
      B.box(30, GL - 0.25, -10, 60, GL, -6, { top: 'wood_floor', side: 'trim', bottom: 'ceiling_dark' });
      B.box(30, GL, 15.9, 60, GL + 1, 16, 'metal'); B.box(30, GL, -6, 60, GL + 1, -5.9, 'metal');
      for (const x of [34, 42, 50, 58]) { B.box(x - 0.25, 0, 15.75, x + 0.25, GL - 0.25, 16.25, 'stone_gothic'); B.box(x - 0.25, 0, -6.25, x + 0.25, GL - 0.25, -5.75, 'stone_gothic'); }
      B.box(60, 0, 0, 68, 0.6, 10, { top: 'marble_dark', side: 'stone_gothic' });
      B.stairs(58.4, 0.5, 60, 9.5, 0, 0.6, 'e', 'marble_dark');
      B.group('curtain', () => {
        B.box(59.6, 0, -0.2, 60.2, 5, 10.2, 'curtain_red', { noShot: true });
      });
      B.decor('throne', 66, 0.6, 5, -Math.PI / 2);
      B.decor('altar', 63, 0.6, 5, Math.PI / 2);
      B.decor('candles', 62, 0.6, 1.5, 0, { solid: false, seed: 3 }); B.decor('candles', 62, 0.6, 8.5, 0, { solid: false, seed: 5 });
      B.decor('desk', 66.8, 0.6, 1.2, -Math.PI / 2);
      for (const [x, z] of [[2, 1.5], [10, 1.5], [2, 8.5], [10, 8.5], [6, 5], [4, 3], [8, 7]]) B.decor('candles', x, 0, z, 0, { solid: false, seed: x * 10 + z });
      B.decal(6, 0.012, 5, 'py', 6, 6, 'pentagram', { emissive: true, alpha: 0.85 });
      B.decal(45, 0.012, 5, 'py', 14, 14, 'pentagram', { emissive: true, alpha: 0.9 });
      B.decal(21, 1.6, 3.12, 'pz', 2.6, 0.9, 'runes');
      B.decal(21, 1.6, 6.88, 'nz', 2.6, 0.9, 'runes');
      B.decal(45, 7, 19.88, 'nz', 8, 2.4, 'runes');
      B.decal(45, 7, -9.88, 'pz', 8, 2.4, 'runes');
      B.decal(67.88, 3, 5, 'nx', 3, 3, 'pentagram', { emissive: true });
      for (const [x, z] of [[2, 1.5], [10, 1.5], [2, 8.5], [10, 8.5]]) B.light(x, 0.8, z, CANDLE, 4.5, { i: 0.9 });
      B.light(6, 3, 5, RED, 7, { i: 0.6 });
      for (let x = 15; x < 30; x += 6) B.light(x, 2.8, 5, [1, 0.5, 0.3], 5, { i: 0.8 });
      B.light(36, 8, 5, RED, 16); B.light(54, 8, 5, RED, 16); B.light(45, 9, -6, [0.8, 0.3, 0.6], 14, { i: 0.7 }); B.light(45, 9, 16, [0.8, 0.3, 0.6], 14, { i: 0.7 });
      B.light(64, 4, 5, [1, 0.35, 0.25], 9, { i: 1.1 }); B.light(66, 2, 2, CANDLE, 4);
      B.light(41, 2.8, -13, [0.8, 0.3, 0.2], 6); B.light(49, 2.8, 23, [0.8, 0.3, 0.2], 6);
      B.decor('statue', 32, 0, -8.5, 0.6); B.decor('statue', 32, 0, 18.5, 2.5); B.decor('cage', 57, 0, -3, 0.2); B.decor('cage', 57, 0, 13, -0.3);
      B.decor('cross', 35, 0, 5, Math.PI / 2, { scale: 0.8 });
      for (const [x, z] of [[40, 0], [50, 10], [40, 10], [50, 0]]) { B.decor('candles', x, 0, z, 0, { solid: false, seed: x + z }); B.light(x, 1.2, z, CANDLE, 7, { i: 0.9 }); }
    },
    props: [
      { kind: 'button', id: 'gateLever', pos: [26, 1.2, 6.9], yaw: Math.PI, label: 'Рычаг решётки', once: true },
      { kind: 'note', id: 'punch_torn', pos: [66.8, 1.38, 1.2], title: 'Разорванное письмо на столе Лупино', text: 'Джек,\nты перестал отвечать на звонки. Люди говорят, ты читаешь им проповеди вместо того, чтобы считать деньги.\nВалькирия не для тебя, Джек. Это товар, и он принадлежит людям, которых ты не захочешь встретить. Остановись, пока я прошу по-хорошему.\nДругого раза не будет.\nАнджело\n\nПоверх письма размашисто, красным: «ВОЛК НЕ СЛУШАЕТ ПСОВ»', noModel: false }
    ],
    items: [
      { kind: 'painkillers', amount: 1, pos: [11, 0, 9] },
      { kind: 'ammo', ammo: '12g', amount: 12, pos: [16, 0, 6.5] },
      { kind: 'painkillers', amount: 2, pos: [31, 0, -9] },
      { kind: 'painkillers', amount: 2, pos: [31, 0, 19] },
      { kind: 'painkillers', amount: 2, pos: [58.8, 0, -9] },
      { kind: 'painkillers', amount: 2, pos: [58.8, 0, 19] },
      { kind: 'ammo', ammo: '9mm', amount: 64, pos: [36, 0, -8.5] },
      { kind: 'ammo', ammo: '50ae', amount: 14, pos: [54, 0, 18.5] },
      { kind: 'ammo', ammo: '12g', amount: 16, pos: [54, 0, -8.5] },
      { kind: 'weapon', weapon: 'grenade', amount: 2, pos: [36, 0, 18.5] }
    ],
    chars: [
      goth('a1', 'amb', 41, 0, -13, 0, 'beretta', { hidden: true, hunter: true }),
      goth('a2', 'amb', 49, 0, 23, Math.PI, 'pump', { hidden: true, hunter: true }),
      goth('a3', 'amb', 40, 0, -14.5, 0, 'ingram', { hidden: true, hunter: true }),
      goth('a4', 'amb', 50, 0, 24.5, Math.PI, 'beretta', { hidden: true, hunter: true }),
      goth('m1', 'balc', 38, GL, 18, Math.PI, 'beretta', { hidden: true, stay: true, molo: 3, leash: 3 }),
      goth('m2', 'balc', 52, GL, 18, Math.PI, 'beretta', { hidden: true, stay: true, molo: 3, leash: 3 }),
      goth('m3', 'balc', 45, GL, -8, 0, 'ingram', { hidden: true, stay: true, molo: 3, leash: 3 }),
      goth('m4', 'balc', 57, GL, -8, 0, 'beretta', { hidden: true, stay: true, molo: 2, leash: 3 }),
      { id: 'lupino', type: 'lupino', group: 'boss', pos: [64, 0.6, 5], yaw: Math.PI / 2, weapon: 'pump', mode: 'prop', static: true, hidden: true, molo: 14, hunter: true, leash: 40, speaker: 'lupino', fireproof: false, noDrop: false, drop: { kind: 'painkillers', amount: 2 } }
    ],
    triggers: [
      { id: 'corr', min: [13, 0, 3], max: [18, 2.5, 7] },
      { id: 'arena', min: [33, 0, 0], max: [37, 3, 10] }
    ],
    on: {
      start(g) {
        g.dialog([
          ['max:thought', 'Комната со свечами. На полу краской нарисованы знаки, которые я видел только в учебниках по истории религий.'],
          ['lupino', 'Локи, Хель, Фенрир... придите... придите и смотрите...']
        ]);
        g.setThought('Идти на голос Лупино.');
      },
      'enter:corr'(g) {
        if (g.flags.corr) return;
        g.flags.corr = true;
        g.dialog([
          ['lupino', 'Кровь за кровь! Я принёс вам кровь!'],
          ['max:thought', 'Кто-то кричал в конце коридора. Не от боли. От восторга.']
        ]);
        g.setThought('Решётка в конце коридора. Рычаг на стене.');
      },
      'use:gateLever'(g) {
        g.unlock('gate');
        g.openDoor('gate', 1);
        g.emit({ t: 'sfx', id: 'slide', pos: [30, 1.5, 5] });
      },
      'enter:arena'(g) {
        if (g.flags.arena) return;
        g.flags.arena = true;
        g.closeDoor('gate');
        g.lock('gate', 'Решётка опустилась за спиной.');
        g.unlock('s1_door'); g.openDoor('s1_door', 1);
        g.unlock('s2_door'); g.openDoor('s2_door', -1);
        g.wake('amb', 'alert');
        g.wake('balc', 'alert');
        g.say('Громила Лупино', 'Жертва сама пришла на алтарь!', 2.6);
        g.think('Решётка упала. Сверху полетели бутылки с огнём.');
        g.music('tension');
        g.later(40, 'lupinoCome');
      },
      'kill:amb'(g) { if (g.groupAlive('balc') === 0) g.fireEvent('lupinoCome'); },
      'kill:balc'(g) { if (g.groupAlive('amb') === 0) g.fireEvent('lupinoCome'); },
      lupinoCome(g) {
        if (g.flags.lupino) return;
        g.flags.lupino = true;
        g.flags.ceasefire = true;
        g.show('curtain', false);
        g.checkpoint();
        const l = g.char('lupino');
        l.state = 'alive';
        l.ai.mode = 'prop';
        l.pose = 'chant';
        g.dialog([
          ['lupino', 'Хватит! Хватит. Оставьте его мне.'],
          ['max', 'Джек Лупино. Мне говорили, что ты сошёл с ума. Не соврали.'],
          ['lupino', 'Сошёл? Я поднялся, Пейн. Валькирия открыла мне глаза. Я вижу волка, который глотает солнце.'],
          ['lupino', 'Я и есть волк! Иди ко мне, маленький коп. Я съем тебя вместе с твоим горем.'],
          ['max:thought', 'Драться с ним было всё равно что боксировать с аллигатором на наркотиках.']
        ], 'lupinoFight');
      },
      lupinoFight(g) {
        g.flags.ceasefire = false;
        const l = g.char('lupino');
        l.pose = null; l.static = false; l.ai.mode = 'combat';
        M.AI.alertChar(g, l, g.player.pos, 0.2);
        l.ai.mode = 'combat';
        g.hint('Лупино бросает коктейли Молотова. Держитесь к нему поближе, и бутылки полетят ему под ноги.', 8);
        g.setThought('Убить Лупино.');
      },
      'dead:lupino'(g) {
        g.flags.ceasefire = true;
        for (const c of g.chars) if (c.state === 'alive' && c.group !== 'boss') g.killChar(c, [0, 1, 0], 'body', 'fire', 'world');
        g.dialog([
          ['max:thought', 'Я выпустил в него всю обойму. Потом ещё одну. Волк оказался человеком, который очень долго падал.'],
          ['max:thought', 'На столе за троном лежало разорванное письмо.']
        ]);
        g.setThought('Письмо на столе Лупино.');
      },
      'read:punch_torn'(g) {
        if (!g.char('lupino') || g.char('lupino').state !== 'dead') { g.think('Потом. Сначала Лупино.'); return; }
        g.later(1.5, 'empireEnd');
      },
      empireEnd(g) { g.finish(); }
    }
  });
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
