(function (X) {
  'use strict';
  const F = X.F;
  const A = 4, BF = 0, GR = -4;

  function lights(B, y, pts) { for (const [x, z] of pts) B.at(x, y, z, 0, () => X.PROPS.ceiling_light(B, { r: 8.5, color: [0.86, 0.94, 1.0] })); }

  X.addLevel({
    id: 'fbi', n: 3, name: 'FBI Headquarters', sub: 'Штаб-квартира ФБР, Вашингтон',
    env: {
      sky: { top: [0.04, 0.05, 0.12], mid: [0.1, 0.12, 0.24], hor: [0.3, 0.26, 0.34], below: [0.06, 0.06, 0.1], sun: [-0.3, 0.6, -0.7], sunColor: [0.6, 0.65, 0.8], sunSize: 0.001, clouds: 0.2, cloudColor: [0.3, 0.32, 0.45], stars: 0.8, moon: [-0.4, 0.5, -0.75], city: 1.3, cityColor: [0.12, 0.13, 0.2], cityLights: true },
      light: { dir: [-0.3, 0.6, -0.7], color: [0.5, 0.56, 0.75], ambient: [0.25, 0.27, 0.36], shadow: [0.3, 0.32, 0.45], indoor: [0.86, 0.88, 0.9] },
      fog: { color: [0.1, 0.11, 0.18], near: 60, far: 260 },
      grade: { tint: [0.98, 1.0, 1.04], sat: 0.95 }
    },
    light: 0.85,
    music: 'stealth',
    stealth: true,
    ambience: 'hum',
    start: { strip: true },
    loadout: { weapons: [], medkits: 0, skills: ['sense', 'marksman'] },
    build(B) {
      B.bounds(-30, -13, 30, 25);
      B.interior(-29.9, GR - 0.2, -11.9, 29.9, A + 3.2, 11.9);
      B.floor(-30, -12, 23, 12, A, 'carpet', 0.4, { bot: 'ceiling_tiles' });
      B.floor(23, -2.5, 30, 12, A, 'carpet', 0.4, { bot: 'ceiling_tiles' });
      B.floor(27, -12, 30, -2.5, A, 'carpet', 0.4, { bot: 'ceiling_tiles' });
      B.floor(23, -12, 27, -11.5, A, 'carpet', 0.4, { bot: 'ceiling_tiles' });
      B.ceil(-30, -12, 30, 12, A + 3, 'ceiling_tiles', 0.3);
      B.wall(-30.2, -12, 30.2, -12, GR, A + 3.3, 'fbi_wall', { t: 0.4, holes: [[6, 2.2, A + 1 - GR, A + 2.4 - GR, 'window_dark'], [16, 2.2, A + 1 - GR, A + 2.4 - GR, 'window_dark'], [40, 2.2, A + 1 - GR, A + 2.4 - GR, 'window_dark'], [50, 2.2, A + 1 - GR, A + 2.4 - GR, 'window_dark']] });
      B.wall(-30.2, 12, 30.2, 12, GR, A + 3.3, 'fbi_wall', { t: 0.4, holes: [[42.5, 1.6, 0 - GR, 2.4 - GR], [50.2, 8, 0, 3.6], [10, 2.2, A + 1 - GR, A + 2.4 - GR, 'window_dark'], [26, 2.2, A + 1 - GR, A + 2.4 - GR, 'window_dark']] });
      B.wall(-30, -12, -30, 12, GR, A + 3.3, 'fbi_wall', { t: 0.4 });
      B.wall(30, -12, 30, 12, GR, A + 3.3, 'fbi_wall', { t: 0.4 });
      B.door(13.1, 12, BF, 1.5, 2.3, 'x', { id: 'front', locked: 'script', label: 'Главный вход охраняется. Нужно уходить через гараж.', mat: 'door_metal' });

      B.wall(-28, -2, 28, -2, A, A + 3, 'fbi_wall', { t: 0.2, holes: [[3.4, 1.2], [10.4, 1.2], [17.4, 1.2], [26.4, 1.2], [35.4, 1.2], [44.4, 1.2], [51, 4]] });
      B.wall(-28, 2, 28, 2, A, A + 3, 'fbi_wall', { t: 0.2, holes: [[6.4, 1.2], [15.4, 1.2], [26, 1.4], [44, 3], [52, 1.2]] });
      for (const x of [-20, -14, -6, 4, 12, 22]) B.wall(x, -12, x, -2, A, A + 3, 'fbi_wall', { t: 0.2, holes: x === -20 ? [[3, 4, 1.0, 2.2, 'mirror']] : [] });
      for (const x of [-14, -8, 10, 22]) B.wall(x, 2, x, 12, A, A + 3, 'fbi_wall', { t: 0.2 });
      B.wall(-30, -2, -28, -2, A, A + 3, 'fbi_wall', { t: 0.2 });
      B.wall(-30, 2, -28, 2, A, A + 3, 'fbi_wall', { t: 0.2 });
      B.wall(28, -2, 30, -2, A, A + 3, 'fbi_wall', { t: 0.2 });
      B.wall(28, 2, 30, 2, A, A + 3, 'fbi_wall', { t: 0.2 });
      B.wall(27.1, -12, 27.1, -2, A, A + 3, 'fbi_wall', { t: 0.2 });
      B.stairs(23, -11.5, 27, -2.5, BF, A, 's', 'concrete');
      B.wall(22.9, -9.3, 22.9, -2, BF, A - 0.4, 'fbi_wall', { t: 0.2 });
      B.wall(27.1, -11.5, 27.1, -2, BF, A - 0.4, 'fbi_wall', { t: 0.2 });
      B.wall(23, -2, 27, -2, BF, A - 0.4, 'fbi_wall', { t: 0.2 });
      lights(B, A + 3, [[-24, -7], [-17, -7], [-10, -7], [-1, -7], [8, -7], [17, -7], [-20, 0], [-6, 0], [8, 0], [22, 0], [-21, 7], [0, 8], [16, 5], [25, 7]]);

      B.prop('table', -24, A, -7.5, 0, { w: 1.6, d: 0.9, mat: 'metal_grey', leg: 'metal_dark' });
      B.object('chair', -24, A, -6.3, Math.PI);
      B.prop('chair', -24, A, -8.7, 0, {});
      B.object('ashtray', -23.6, A + 0.76, -7.4, 0);
      B.light(-24, A + 2.4, -7.5, [1, 0.92, 0.7], 6, { bulbR: 0.12 });
      B.prop('chair', -17, A, -7, 0, { mat: 'leather' });
      B.prop('desk', -17, A, -9.5, Math.PI, { pc: true });
      B.item('doc', -16.8, A + 0.8, -9.3, { title: 'Протокол допроса', text: 'Задержанный называет себя «Тринадцатым». Отпечатки совпадают с капитаном Стивеном Роуландом, погибшим — по документам — год назад. Утром перевести в Плейн-Рок. Приказ подписан: полковник Амос.' });
      B.prop('table', -10, A, -7.5, 0, { w: 1.6, d: 0.9, mat: 'metal_grey', leg: 'metal_dark' });
      B.object('chair', -10, A, -6.3, Math.PI);
      for (const x of [-4, -1, 2]) B.prop('desk', x, A, -10.8, Math.PI, { pc: true });
      B.prop('tv', -4.8, A, -3, Math.PI, {});
      B.prop('tv', 2.8, A, -3, Math.PI, {});
      B.usable('console', -1, A + 1.2, -10.4, { label: 'Отключить камеры наблюдения', r: 1.8 });
      B.item('key', 2.2, A + 0.8, -10.9, { key: 'evidence', label: 'Ключ от хранилища улик', id: 'evkey' });
      B.prop('counter', 8, A, -11.3, 0, { len: 5, mat: 'plastic', top: 'formica' });
      B.prop('cooler', 5, A, -11.3, 0, {});
      B.prop('table', 8, A, -6.5, 0, { w: 1.4, d: 0.9 });
      B.item('food', 8, A + 0.8, -6.5, { name: 'Кофе с пончиком', n: 20 });
      B.item('medkit', 11, A + 0.1, -3.2, {});
      for (let i = 0; i < 4; i++) B.prop('shelf', 14 + i * 2.2, A, -11.4, 0, { w: 2, h: 2.4, fill: 'books' });
      B.prop('crates', 20, A, -5, 0.3, { n: 2 });
      B.object('extinguisher', -27.5, A, 1.4, 0);
      B.object('extinguisher', 21.5, A, -1.4, 0);
      for (let i = 0; i < 4; i++) B.prop('bookshelf', -27 + i * 3.2, A, 11.4, Math.PI, { w: 2.8, h: 2.4 });
      B.prop('table', -21, A, 7, 0, { w: 2.4, d: 1.2 });
      B.item('doc', -21, A + 0.8, 7, { title: 'Досье: генерал Кэррингтон', text: 'Бенджамин Кэррингтон, генерал, куратор программы SPADS. Уверен, что убийство Шеридана — заговор. Его адъютант — майор Джонс — трижды запрашивала встречу с задержанным. Отказать.' });
      B.prop('sink', -11, A, 11.6, Math.PI, {});
      B.prop('toilet', -9, A, 11.4, Math.PI, {});
      B.item('medkit', -12.5, A + 0.1, 10.8, {});
      B.prop('table', 1, A, 8, 0, { w: 7, d: 2 });
      for (const x of [-2, 0, 2, 4]) { B.object('chair', x, A, 6.6, Math.PI); B.prop('chair', x, A, 9.4, 0, { mat: 'leather' }); }
      B.vbox(-7.9, A + 0.8, 11.7, 9.9, A + 2.6, 11.8, 'window_dark');
      B.vbox(11, A, 7.85, 21, A + 2.6, 7.95, 'elevator');
      B.wall(10, 8, 22, 8, A, A + 3, 'fbi_wall', { t: 0.2 });
      B.prop('plant', 11, A, 3, 0, {});

      B.floor(-30, -12, 30, 4.5, BF, 'carpet', 0.4, { bot: 'concrete' });
      B.floor(-30, 4.5, -5.5, 12, BF, 'carpet', 0.4, { bot: 'concrete' });
      B.floor(-0.5, 4.5, 30, 12, BF, 'marble_floor', 0.4, { bot: 'concrete' });
      B.floor(-5.5, 11.5, -0.5, 12, BF, 'carpet', 0.4, { bot: 'concrete' });
      B.stairs(-5.5, 4.5, -0.5, 11.5, GR, BF, 'n', 'concrete');
      B.wall(-5.6, 4.5, -5.6, 9.2, GR, BF - 0.4, 'concrete', { t: 0.2 });
      B.wall(-0.4, 4.5, -0.4, 9.2, GR, BF - 0.4, 'concrete', { t: 0.2 });
      B.box(-5.6, BF, 11.5, -0.4, BF + 1.1, 11.7, 'metal_dark', { flags: F.SOLID | F.SHOT });
      B.wall(-30, 4, 28, 4, BF, A - 0.4, 'fbi_wall', { t: 0.2, holes: [[8.4, 1.2], [18.4, 1.2], [24.2, 5.4], [36, 3], [48, 3]] });
      for (const x of [-16, -6]) B.wall(x, 4, x, 12, BF, A - 0.4, 'fbi_wall', { t: 0.2 });
      B.wall(0, 4, 0, 12, BF, A - 0.4, 'fbi_wall', { t: 0.2, holes: [[1, 1.4]] });
      B.door(-11, 4, BF, 1.2, 2.2, 'x', { id: 'evidence', locked: 'evidence', keyName: 'хранилище улик', mat: 'door_metal' });
      lights(B, A - 0.4, [[-24, -8], [-14, -8], [-4, -8], [6, -8], [16, -8], [-24, -1], [-12, -1], [0, -1], [12, -1], [-22, 8], [-11, 8], [8, 8], [20, 8]]);
      for (let cx = -24; cx <= 14; cx += 7.5) for (const cz of [-8, -2]) {
        B.at(cx, BF, cz, 0, () => {
          for (const [a, b, c2, d] of [[-2, -1.6, 2, -1.5], [-2, 1.5, 2, 1.6], [-2.05, -1.6, -1.95, 1.6]]) B.box(a, 0, b, c2, 1.5, d, 'cubicle', { flags: F.SOLID | F.SHOT });
          X.PROPS.desk(B, { pc: true, w: 1.6 });
          B.at(0, 0, -0.95, Math.PI, () => X.PROPS.chair(B, { mat: 'plastic' }));
        });
      }
      B.item('medkit', 21, BF + 0.1, -11, {});
      B.object('extinguisher', -29.4, BF, -6, 0);
      B.prop('desk', -22, BF, 8.5, Math.PI, { w: 2.2, lamp: true });
      B.prop('bookshelf', -27, BF, 11.4, Math.PI, { w: 2.4 });
      B.prop('sofa', -26, BF, 5.4, Math.PI, { len: 2.2 });
      B.object('bottle', -21.3, BF + 0.77, 8.4, 0);
      B.item('doc', -22.6, BF + 0.8, 8.3, { title: 'Директору ФБР: лично', text: '«Операция "Тринадцать" провалилась: объект выжил после падения в море и потерял память. Если он вспомнит хоть что-то — Двадцатка под угрозой. Мангуст получил новые указания.» Без подписи. На конверте — римские цифры XX.' });
      for (let i = 0; i < 3; i++) B.prop('shelf', -14.8 + i * 3, BF, 11.4, Math.PI, { w: 2.6, h: 2.4, fill: 'crate' });
      B.prop('table', -11, BF, 8.2, 0, { w: 3.2, d: 1, mat: 'metal_grey', leg: 'metal_dark' });
      B.item('weapon', -12, BF + 0.8, 8.2, { w: 'silenced', n: 30, id: 'gear_pistol' });
      B.item('weapon', -10.8, BF + 0.8, 8.4, { w: 'knife', n: 5 });
      B.item('lockpick', -10, BF + 0.8, 8, {});
      B.item('gadget', -12.2, BF + 0.8, 8.5, { name: 'hook', label: 'Кошка с тросом' });
      B.item('ammo', -9, BF + 0.1, 6, { w: 'silenced', n: 15 });
      B.prop('counter', 14, BF, 8.5, 0, { len: 6, mat: 'wood_dark', top: 'marble' });
      B.prop('computer', 14, BF + 0.25, 8.5, Math.PI, {});
      B.at(24, BF, 10.2, 0, () => { B.box(-1.1, 0, -0.2, -0.9, 2.3, 0.2, 'metal_grey', { flags: F.WALL }); B.box(0.9, 0, -0.2, 1.1, 2.3, 0.2, 'metal_grey', { flags: F.WALL }); B.vbox(-1.1, 2.3, -0.2, 1.1, 2.5, 0.2, 'metal_grey'); });
      B.sign('FEDERAL BUREAU OF INVESTIGATION', 14, BF + 3.0, 4.2, 9, 0.6, Math.PI, { bg: '#1a2a4a', fg: '#e8d080', font: 'serif' });
      B.prop('plant', 1.5, BF, 11, 0, {});
      B.prop('sofa', 6, BF, 11.3, Math.PI, { len: 2.4 });

      B.floor(-30, -12, 30, 12, GR, 'concrete_dark', 0.4);
      for (let x = -24; x <= 24; x += 8) for (const z of [-6, 2]) B.cyl(x, GR, z, 0.35, 3.6, 'concrete', { sides: 8 });
      const cars = [[-26, -8, 0, 'car_black'], [-18, -8, 0, 'car_grey'], [-10, -8, 0, 'car_blue'], [6, -8, 0, 'car_black'], [14, -8, 0, 'car_white'], [-22, 8, Math.PI, 'car_grey'], [-14, 8, Math.PI, 'car_black'], [10, 8, Math.PI, 'car_red']];
      for (const [x, z, yaw, m] of cars) B.prop('car', x, GR, z, yaw, { mat: m });
      B.prop('car', 24, GR, 6, 0.3, { mat: 'car_red' });
      for (let x = -28; x < 28; x += 4) B.vbox(x, GR + 0.01, -1.1, x + 2, GR + 0.02, -0.9, 'road_line');
      lights(B, BF - 0.4, [[-20, -6], [-8, -6], [4, -6], [16, -6], [-20, 4], [-8, 4], [4, 4], [16, 4]]);
      B.box(20, GR - 0.4, 12, 28, GR, 26, 'concrete_dark', { flags: F.WALL });
      B.ramp(20, 12.2, 28, 24, GR, BF, 's', 'asphalt');
      B.wall(20, 12, 20, 24, GR, BF + 1.2, 'concrete', { t: 0.3 });
      B.wall(28, 12, 28, 24, GR, BF + 1.2, 'concrete', { t: 0.3 });
      B.box(19.8, BF, 23.8, 28.2, BF + 3, 24.2, null, { vis: false, flags: F.SOLID });
      B.sign('EXIT', 24, BF + 0.8, 11.7, 1.4, 0.4, Math.PI, { bg: '#1a6a2a', fg: '#ffffff', font: 'sans', emit: true });
      B.wall(20, 12, 28, 12, BF, A, 'fbi_wall', { t: 0.3 });

      B.secCam(-29.5, A + 2.6, 1.2, -Math.PI / 2, 0.45, { range: 16 });
      B.secCam(29.5, A + 2.6, -1.2, Math.PI / 2, 0.45, { range: 16 });
      B.secCam(-29.5, BF + 3.2, -11.5, -Math.PI * 0.75, 0.5, { range: 18 });
      B.secCam(22, BF + 3.2, 3.6, Math.PI / 2 + 0.3, 0.55, { range: 18 });
      B.secCam(29.4, GR + 3.2, -11.4, Math.PI * 0.75, 0.5, { range: 18 });
      B.alarm(-0.5, A + 1.5, -1.9, Math.PI);
      B.alarm(-29.8, BF + 1.5, 0, -Math.PI / 2);
      B.alarm(27.5, BF + 1.5, 4.1, Math.PI);

      B.spawnPlayer(-24, A, -9.45, Math.PI);
      B.char('agent', -24, -3.5, { y: A, id: 'g1', look: Math.PI, ai: 'guard', weapon: 'beretta' });
      B.char('agent2', -22.5, -6, { y: A, id: 'interrogator', look: -2.2, ai: 'static', static: true, weapon: null });
      B.char('agent', -26, 0, { y: A, id: 'a1', path: [[-26, A, 0], [26, A, 0]], wait: 3 });
      B.char('agent2', -1, -9.6, { y: A, id: 'a2', look: 0, pose: 'sit', static: true });
      B.char('agent', 8, -9.7, { y: A, id: 'a3', look: 0, pose: 'lean' });
      B.char('agent2', -1, 5.6, { y: A, id: 'a4', look: Math.PI, pose: 'talk' });
      B.char('agent', 1.2, 5.4, { y: A, id: 'a5', look: Math.PI + 0.4 });
      B.char('agent', 20, -11, { y: BF, id: 'b1', path: [[20, BF, -11], [20, BF, 2.5], [-27, BF, 2.5], [-27, BF, -11]], wait: 2 });
      B.char('agent2', -16.5, -8.95, { y: BF, id: 'b2', look: Math.PI, pose: 'sit', static: true });
      B.char('agent', 2.25, -11, { y: BF, id: 'b3', path: [[2.25, BF, -11], [2.25, BF, 2.5], [-12.75, BF, 2.5], [-12.75, BF, -11]] });
      B.char('agent2', -1.5, -2.95, { y: BF, id: 'b4', look: Math.PI, pose: 'sit', static: true });
      B.char('civilian2', 14, 9.4, { y: BF, id: 'clerk2', look: Math.PI, noKill: true });
      B.char('fbiguard', 21, 10.5, { y: BF, id: 'l1', look: Math.PI });
      B.char('fbiguard', 27, 10.5, { y: BF, id: 'l2', look: Math.PI });
      B.char('fbiguard', 4, -1, { y: GR, id: 'gg1', path: [[4, GR, -1], [-26, GR, -1], [-26, GR, 3.2], [4, GR, 3.2]], wait: 2 });
      B.char('fbiguard', 18, 0, { y: GR, id: 'gg2', look: -Math.PI / 2, ai: 'guard' });
      B.char('jones', 22.5, 9, { y: GR, id: 'jones', look: -2.6, order: { type: 'hold', pos: null } });
      for (let i = 0; i < 4; i++) B.char('fbiguard', 24 + (i % 2) * 1.5, -1 + Math.floor(i / 2) * 1.2, { y: A, id: 'swat' + i, group: 'swat', hidden: true, weapon: 'm16' });

      B.trigger('corridorA', -28, A - 0.5, -2, 28, A + 3, 2);
      B.trigger('evroom', -16, BF - 0.5, 4, -6, BF + 3, 12);
      B.trigger('floorB', -28, BF - 0.5, -12, 22, BF + 3, 4);
      B.trigger('garage', -30, GR - 0.5, -12, 30, GR + 3, 12);
      B.trigger('exit', 19, GR - 0.5, 4, 28, GR + 3.5, 13);
      B.cam('guardCam', [-22.4, A + 1.9, -8.2], [-24, A + 1.4, -3.5], 45);
      B.cam('garageCam', [16, GR + 2.2, 4], [22.5, GR + 1.4, 9], 45);
    },
    script(S) {
      S.on('start', g => {
        g.objective('escape', 'Сбежать из штаб-квартиры ФБР');
        g.objective('nokill', 'Не убивать агентов ФБР — они не знают правды');
        g.hide('interrogator');
        g.caption('Меня обвиняют в убийстве президента. Оружие отобрали. Охранник у двери стоит ко мне спиной...', 6);
        g.after(3, () => g.msg('Подкрадитесь сзади: [E] — взять в заложники, [ЛКМ] — ударить. Стул — [E], затем [ЛКМ].', 7));
        g.after(12, () => g.radio('jones', 'Тринадцатый, это майор Джонс. Не убивай агентов — они не враги. Жду тебя в подземном гараже.', 7));
      });
      S.dead('g1', g => {
        g.msg('Отлично. Держитесь в тени, следите за камерами. Пульт охраны — в середине коридора.', 5);
        g.checkpoint('cell');
      });
      S.use('console', g => {
        g.setFlag('camsOff');
        for (const c of g.secCams) c.off = true;
        g.msg('Камеры отключены.', 3);
        g.objective('gear', 'Забрать свои вещи из хранилища улик (ключ — на столе охраны)', { optional: true });
      });
      S.pick('evkey', g => { g.objective('gear', 'Забрать свои вещи из хранилища улик (ключ — на столе охраны)', { optional: true }); g.msg('Хранилище улик — этажом ниже, у кабинета директора.', 4); });
      S.pick('gear_pistol', g => {
        g.complete('gear');
        g.memory('silent', 'Мягкий шаг, пятка — носок. Меня этому учили. Где? Когда?..');
        g.checkpoint('gear');
      });
      S.zone('floorB', g => g.checkpoint('floorB'));
      S.zone('garage', g => {
        g.objective('jones', 'Найти майора Джонс в подземном гараже');
        g.panel({ kind: 'cam', cam: 'garageCam', dur: 2.6, text: 'МАЙОР ДЖОНС' });
        g.checkpoint('garage');
      });
      S.on('alarm', g => {
        g.spawn('swat', g.alarmPos || g.player.pos);
        g.radio('jones', 'Тревога! Они перекроют выходы. Быстрее в гараж!', 4);
        g.music('combat');
      });
      S.zone('exit', g => {
        g.complete('jones');
        g.complete('escape');
        if (g.state === 'play') g.complete('nokill');
        g.finish();
      });
    },
    comics: {
      intro: [
        {
          rows: [{ h: 0.5, w: [0.6, 0.4] }, { h: 0.5, w: [0.45, 0.55] }],
          panels: [
            { cam: { pos: [-26.3, A + 1.7, -9.8], look: [-22.8, A + 1.3, -6.4], fov: 46 }, actors: [{ type: 'agent2', pos: [-23, A, -6.4], yaw: -2.4, pose: 'talk' }, { type: 'xiii', pos: [-24, A, -8.7], yaw: 0, pose: 'sit' }], text: [{ k: 'say', t: 'Ваше имя — Стив Роуланд. Три месяца назад вы застрелили президента Шеридана.', x: 0.04, y: 0.05, w: 0.62, who: 0 }] },
            { shot: { on: 0, dist: 0.75, height: 0.02, angle: 10, fov: 34, target: 'head' }, actors: [{ type: 'xiii', pos: [-24, A, -8.7], yaw: 0, pose: 'sit' }], tint: 'blue', text: [{ k: 'say', t: 'Я ничего не помню.', x: 0.06, y: 0.06, w: 0.7, who: 0 }] },
            { art: 'newspaper', artOpt: { head: 'УБИЙЦА ПРЕЗИДЕНТА ПОЙМАН?' }, text: [{ k: 'say', t: 'Утром вас переведут в тюрьму Плейн-Рок. Там память быстро возвращается.', x: 0.05, y: 0.62, w: 0.9, tail: [0.9, 0.1] }] },
            { cam: { pos: [-18.5, A + 1.6, -4], look: [-19.6, A + 1.5, -7], fov: 48 }, actors: [{ type: 'jones', pos: [-18.5, A, -7.2], yaw: -Math.PI / 2 + 0.3, pose: 'stand' }], tint: 'blue', text: [{ k: 'cap', t: 'За зеркальным стеклом...', x: 0.04, y: 0.05, w: 0.45 }, { k: 'think', t: 'Он не убийца. Генерал прав: это подстава. Надо вытащить его сегодня же.', x: 0.35, y: 0.58, w: 0.6 }] }
          ]
        }
      ],
      outro: [
        {
          rows: [{ h: 0.55, w: [1] }, { h: 0.45, w: [0.5, 0.5] }],
          panels: [
            { cam: { pos: [17, GR + 1.4, 3.5], look: [23, GR + 1.2, 8], fov: 50 }, actors: [{ type: 'jones', pos: [23, GR, 8.4], yaw: -2.4, pose: 'talk' }, { type: 'xiii', pos: [21.4, GR, 7.2], yaw: 0.9, pose: 'stand' }], text: [{ k: 'say', t: 'Майор Джонс, армия США. Генерал Кэррингтон уверен, что вас подставили. Садитесь, живо!', x: 0.03, y: 0.05, w: 0.55, who: 0 }] },
            { shot: { on: 0, dist: 0.9, height: 0.05, angle: -20, fov: 36, target: 'head' }, actors: [{ type: 'xiii', pos: [0, 0, 0], yaw: 0, pose: 'stand', float: true }], hideWorld: true, bg: [0.24, 0.3, 0.46], text: [{ k: 'say', t: 'Куда мы едем?', x: 0.06, y: 0.06, w: 0.5, who: 0 }] },
            { shot: { on: 0, dist: 0.9, height: 0.05, angle: 20, fov: 36, target: 'head' }, actors: [{ type: 'jones', pos: [0, 0, 0], yaw: 0, pose: 'talk', float: true }], hideWorld: true, bg: [0.46, 0.3, 0.24], text: [{ k: 'say', t: 'В порт. Там нас ждёт катер генерала. Если повезёт — к утру будем у своих.', x: 0.05, y: 0.05, w: 0.85, who: 0 }] }
          ]
        }
      ]
    }
  });
})(globalThis.XIII = globalThis.XIII || {});
