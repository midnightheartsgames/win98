(function (X) {
  'use strict';
  const F = X.F;
  const U = 0, L = -5;

  function lights(B, y, pts, o) { for (const [x, z] of pts) B.at(x, y, z, 0, () => X.PROPS.ceiling_light(B, Object.assign({ r: 8, color: [0.9, 1.0, 0.8] }, o || {}))); }

  X.addLevel({
    id: 'cell', n: 6, name: "Carrington's Cell", sub: 'Подземный блок «Д»',
    env: {
      sky: { top: [0.05, 0.06, 0.08], mid: [0.08, 0.09, 0.1], hor: [0.1, 0.1, 0.12], below: [0.05, 0.05, 0.06], sun: [0.2, 0.9, 0.3], sunColor: [0.5, 0.5, 0.5], sunSize: 0.001, clouds: 0 },
      light: { dir: [0.3, 0.8, 0.4], color: [0.4, 0.42, 0.4], ambient: [0.3, 0.32, 0.3], shadow: [0.3, 0.32, 0.3], indoor: [0.52, 0.56, 0.5] },
      fog: { color: [0.08, 0.09, 0.08], near: 25, far: 90 },
      grade: { tint: [1.0, 1.04, 0.96], sat: 0.85 }
    },
    light: 0.75,
    music: 'stealth',
    stealth: true,
    ambience: 'hum',
    loadout: { weapons: ['silenced', 'knife', 'crossbow', 'm16'], clip: { silenced: 15, crossbow: 1, m16: 30 }, res: { silenced: 45, knife: 6, crossbow: 8, m16: 60 }, medkits: 2, gadgets: { lockpick: true, hook: true }, skills: ['sense', 'marksman', 'silent', 'hands'], weapon: 'crossbow' },
    build(B) {
      B.bounds(-68, -62, 22, 4);
      B.interior(-70, L - 0.5, -62, 22, U + 4, 4);
      B.floor(-6, -12, 6, 2, U, 'bunker_floor', 0.4, { bot: 'concrete' });
      B.room(-6, -12, 6, 2, U, 3.6, { floor: null, ceil: 'concrete', wall: 'bunker', t: 0.4, doors: { n: [[4, 4]] } });
      B.vbox(-3, U, 1.78, 3, U + 3.2, 1.82, 'door_metal');
      B.prop('desk', 3.5, U, -7, -Math.PI / 2, { pc: true });
      B.prop('locker', -5.4, U, -6, Math.PI / 2, { n: 3 });
      B.prop('sandbags', -2, U, -3, 0, { len: 3 });
      B.alarm(5.6, U + 1.5, -3, -Math.PI / 2);
      lights(B, U + 3.6, [[0, -4], [0, -9]]);

      B.floor(-2, -41, 2, -12, U, 'bunker_floor', 0.4, { bot: 'concrete' });
      B.ceil(-2, -41, 2, -12, U + 3.4, 'concrete', 0.3);
      B.wall(-2, -41, -2, -12, U, U + 3.4, 'bunker', { t: 0.3, holes: [[21, 1.3], [9, 1.3]] });
      B.wall(2, -41, 2, -12, U, U + 3.4, 'bunker', { t: 0.3, holes: [[22.5, 1.3], [12, 2.8]] });
      B.wall(-2, -41, 2, -41, U, U + 3.4, 'bunker', { t: 0.3 });
      B.vbox(-1.6, U, -40.8, 1.6, U + 2.6, -40.7, 'elevator');
      lights(B, U + 3.4, [[0, -16], [0, -24], [0, -32], [0, -38]]);

      B.room(2, -22, 12, -14, U, 3.2, { floor: 'carpet_red', ceil: 'ceiling', wall: 'wood_panel', t: 0.3, skip: 'w' });
      B.prop('desk', 8, U, -19.5, 0, { w: 2, lamp: true });
      B.prop('bookshelf', 11.4, U, -18, -Math.PI / 2, { w: 2.4 });
      B.prop('armchair', 5, U, -15, Math.PI, {});
      B.item('key', 8.5, U + 0.8, -19.6, { key: 'cells', label: 'Ключи от камер', id: 'cellkey' });
      B.item('doc', 7.4, U + 0.8, -19.4, { title: 'Журнал начальника блока', text: 'Кэррингтон молчит четвёртые сутки. Мангуст велел не трогать лицо — «Номер Один хочет видеть его целым». Смена караула в 4:00. Ключи от камер — только у меня.' });
      B.light(8, U + 2.7, -18, [1, 0.85, 0.6], 7, { bulbR: 0.1 });
      B.room(-12, -22, -2, -14, U, 3.2, { floor: 'concrete', ceil: 'concrete', wall: 'bunker', t: 0.3, skip: 'e' });
      for (let i = 0; i < 3; i++) B.prop('shelf', -11 + i * 3.2, U, -21.4, 0, { w: 2.8, h: 2.2, fill: 'crate' });
      B.prop('table', -7, U, -17, 0, { w: 3, d: 1.1, mat: 'metal_grey', leg: 'metal_dark' });
      B.item('ammo', -8, U + 0.8, -17, { w: 'crossbow', n: 8 });
      B.item('grenades', -7, U + 0.8, -17.2, { n: 3 });
      B.item('ammo', -6, U + 0.8, -16.9, { w: 'm16', n: 60 });
      B.item('vest', -10.6, U + 0.1, -15.2, { n: 50 });
      B.light(-7, U + 2.8, -18, [0.9, 1, 0.8], 7, { bulbR: 0.1 });
      B.room(-14, -34, -2, -24, U, 3.2, { floor: 'concrete', ceil: 'concrete', wall: 'bunker', t: 0.3, skip: 'e' });
      for (let x = -12.5; x < -3; x += 2.8) { B.prop('bunk', x, U, -32.6, Math.PI / 2, { mat: 'fabric' }); }
      B.prop('table', -8, U, -27, 0, { w: 2, d: 1 });
      B.item('doc', -8, U + 0.8, -27, { title: 'Карточка солдата', text: 'Рядовой Дж. Гловер. Перевод на «Эмеральд» по приказу генерала Стэнтона. Особая отметка: «Лоялен Двадцатке». Кто такие Двадцать, в карточке не сказано.' });
      B.light(-8, U + 2.8, -29, [1, 0.85, 0.6], 8, { bulbR: 0.1 });

      B.room(2, -44, 10, -26, L, 5 + 3.4, { floor: 'bunker_floor', ceil: 'concrete', wall: 'bunker', t: 0.3, skip: 'wn', doors: {} });
      B.stairs(3, -37, 6, -27, L, U, 's', 'concrete');
      B.wall(6.1, -37, 6.1, -27, L, U - 0.4, 'bunker', { t: 0.2 });
      B.wall(3, -37, 6.1, -37, U, U + 1.1, 'metal_dark', { t: 0.1 });
      B.box(2.9, U, -37, 3.0, U + 1.1, -27.6, 'metal_dark', { flags: F.SOLID | F.SHOT });
      B.box(2, U - 0.4, -44, 10, U, -37.2, 'bunker_floor', { flags: F.WALL, bot: 'concrete' });
      B.box(6.2, U - 0.4, -37.2, 10, U, -26, 'bunker_floor', { flags: F.WALL, bot: 'concrete' });
      B.box(2, U - 0.4, -37.2, 2.9, U, -26, 'bunker_floor', { flags: F.WALL, bot: 'concrete' });
      B.box(2.9, U - 0.4, -27, 6.2, U, -26, 'bunker_floor', { flags: F.WALL, bot: 'concrete' });

      B.floor(-28, -58, 18, -42, L, 'bunker_floor', 0.4);
      B.ceil(-28, -58, 18, -42, L + 3.6, 'concrete', 0.3);
      B.wall(-28, -58, 18, -58, L, L + 3.6, 'bunker', { t: 0.4 });
      B.wall(-28, -42, 2, -42, L, L + 3.6, 'bunker', { t: 0.4 });
      B.wall(10, -42, 18, -42, L, L + 3.6, 'bunker', { t: 0.4 });
      B.wall(2, -44, 2, -42, L, L + 3.6, 'bunker', { t: 0.3 });
      B.wall(10, -44, 10, -42, L, L + 3.6, 'bunker', { t: 0.3 });
      B.wall(2, -44, 10, -44, L, L + 3.6, 'bunker', { t: 0.3, holes: [[1, 4]] });
      B.wall(18, -58, 18, -42, L, L + 3.6, 'bunker', { t: 0.4 });
      for (let i = 0; i < 7; i++) {
        const x0 = -20 + i * 4;
        B.wall(x0, -58, x0, -52, L, L + 3.4, 'bunker', { t: 0.25 });
        if (i <= 5) B.wall(x0, -48, x0, -42, L, L + 3.4, 'bunker', { t: 0.25 });
        for (const [zb, dir] of (i >= 5 ? [[-52, 1]] : [[-52, 1], [-48, -1]])) {
          B.at(x0 + 0.7, L, zb, 0, () => X.PROPS.cell_bars(B, { len: 1.4, h: 3.4 }));
          B.at(x0 + 3.3, L, zb, 0, () => X.PROPS.cell_bars(B, { len: 1.4, h: 3.4 }));
          const cz = zb + dir * 3;
          B.prop('bunk', x0 + 1, L, cz, 0, { mat: 'fabric', frame: 'metal_dark' });
          B.prop('toilet', x0 + 3.3, L, zb + dir * 5.3, dir > 0 ? Math.PI : 0, {});
        }
        B.door(x0 + 2, -52, L, 1.2, 2.6, 'x', { id: 'cn' + i, slide: true, bars: true, locked: i === 5 ? 'cells' : 'script', label: 'Камера заперта.', noAI: true });
        if (i < 5) B.door(x0 + 2, -48, L, 1.2, 2.6, 'x', { id: 'cs' + i, slide: true, bars: true, locked: 'script', label: 'Камера заперта.', noAI: true });
      }
      B.wall(8, -58, 8, -52, L, L + 3.4, 'bunker', { t: 0.25 });
      B.sign('БЛОК «Д»', -6, L + 3.0, -52.25, 3, 0.5, Math.PI, { bg: '#e8d020', fg: '#1a1a1a', font: 'sans' });
      lights(B, L + 3.6, [[-18, -50], [-10, -50], [-2, -50], [6, -50], [14, -50], [2, -55], [-14, -55]], { color: [0.95, 1, 0.75] });
      B.wall(8, -52, 18, -52, L, L + 3.6, 'bunker', { t: 0.3, holes: [[2, 1.3]] });
      B.prop('table', 13, L, -55, 0, { w: 1.6, d: 0.9, mat: 'metal_grey', leg: 'metal_dark' });
      B.prop('chair', 13, L, -56.2, 0, { mat: 'metal_dark' });
      B.item('doc', 12.6, L + 0.8, -55, { title: 'Протокол: объект XIII', text: 'Капитан Стив Роуланд, SPADS. По легенде — погиб. На деле — сменил лицо, внедрён в заговор под номером XIII. Предал Двадцатку? Или Двадцатка — его? Мангуст считает, что память вернётся. Этого нельзя допустить.' });
      B.object('lamp', 13.4, L + 0.77, -55.3, 0);
      B.light(13, L + 2.8, -55, [1, 0.8, 0.5], 6, { bulbR: 0.12 });
      B.wall(-28, -58, -28, -42, L, L + 3.6, 'bunker', { t: 0.4, holes: [[6, 4]] });
      B.floor(-34, -56, -28, -44, L, 'tiles', 0.4);
      B.ceil(-34, -56, -28, -44, L + 3.2, 'ceiling', 0.3);
      B.wall(-34, -56, -28, -56, L, L + 3.2, 'tiles', { t: 0.3 });
      B.wall(-34, -44, -28, -44, L, L + 3.2, 'tiles', { t: 0.3 });
      B.wall(-34, -56, -34, -44, L, L + 3.2, 'tiles', { t: 0.3, holes: [[4, 4]] });
      B.prop('bed', -31, L, -54.5, Math.PI / 2, { mat: 'white' });
      B.prop('cabinet', -33.4, L, -46, Math.PI / 2, { mat: 'white' });
      B.item('medkit', -30, L + 0.1, -46, {});
      B.item('medkit', -31.2, L + 0.1, -46.2, {});
      B.light(-31, L + 2.9, -50, [0.95, 1, 1], 7, { bulbR: 0.1 });

      B.floor(-64, -52, -34, -48, L, 'bunker_floor', 0.4);
      B.ceil(-64, -52, -34, -48, L + 3.4, 'concrete', 0.3);
      B.wall(-64, -52, -34, -52, L, L + 3.4, 'bunker', { t: 0.4 });
      B.wall(-64, -48, -34, -48, L, L + 3.4, 'bunker', { t: 0.4 });
      B.at(-49, L, -50, Math.PI / 2, () => X.PROPS.rails(B, { len: 28 }));
      B.prop('mine_cart', -44, L, -50.8, Math.PI / 2, {});
      B.prop('crates', -55, L, -49.2, 0.2, { n: 2 });
      B.prop('crates', -39, L, -51, -0.3, { n: 3 });
      B.at(-48, L, -50, 0, () => { B.box(-0.3, 0, -1.8, 0.3, 1.1, 0.5, 'sandbag', { flags: F.WALL }); });
      lights(B, L + 3.4, [[-38, -50], [-46, -50], [-54, -50], [-61, -50]], { color: [1, 0.9, 0.6] });
      B.box(-70, L - 0.7, -54, -64, L - 0.3, -46, 'grate', { flags: F.WALL });
      B.wall(-70, -54, -64, -54, L, L + 20, 'bunker', { t: 0.3 });
      B.wall(-70, -46, -64, -46, L, L + 20, 'bunker', { t: 0.3 });
      B.wall(-70, -54, -70, -46, L, L + 20, 'bunker', { t: 0.3 });
      B.group('lift', -67, L, -50, 0, () => {
        B.box(-2.6, -0.3, -3.6, 2.6, 0, 3.6, 'grate', { flags: F.WALL });
        B.box(-2.6, 0, -3.6, -2.5, 1.1, 3.6, 'metal_yellow', { flags: F.SOLID | F.SHOT });
        B.box(-2.6, 0, -3.6, 2.6, 1.1, -3.5, 'metal_yellow', { flags: F.SOLID | F.SHOT });
        B.box(-2.6, 0, 3.5, 2.6, 1.1, 3.6, 'metal_yellow', { flags: F.SOLID | F.SHOT });
        B.usable('liftBtn', -2.2, 1.2, 0, { label: 'Поднять платформу', enabled: false, r: 2.6, once: false });
        B.vbox(-2.55, 0.9, -0.3, -2.4, 1.3, 0.3, 'alarm_red', { emit: true });
      });

      B.spawnPlayer(0, U, 0, 0);
      B.char('soldier', 3, -9.2, { y: U, id: 'e1', look: -Math.PI / 2, pose: 'sit', static: true });
      B.char('soldier', -3.5, -10.5, { y: U, id: 'e2', look: 0.6 });
      B.char('soldier', 0, -14, { y: U, id: 'p1', path: [[0, U, -14], [0, U, -39]], wait: 3 });
      B.char('officer', 8, -20.6, { y: U, id: 'warden', look: 0, pose: 'sit', static: true, weapon: 'beretta' });
      B.char('soldier', 4, -15.4, { y: U, id: 'w2', look: Math.PI / 2 + 0.5 });
      B.char('soldier', -9, -20.5, { y: U, id: 'ar1', look: Math.PI });
      B.char('soldier', -12.5, -32.4, { y: U + 0.45, id: 'sl1', pose: 'lie', static: true, sight: 5, yaw: -Math.PI / 2 + Math.PI });
      B.char('soldier', -6.9, -32.4, { y: U + 0.45, id: 'sl2', pose: 'lie', static: true, sight: 5, yaw: Math.PI / 2 });
      B.char('soldier', -9, -26, { y: U, id: 'bk', look: Math.PI, pose: 'sit', static: true });
      B.char('soldier', -18, -50, { y: L, id: 'cg1', path: [[-18, L, -50], [14, L, -50]], wait: 2 });
      B.char('soldier', 6, -45.5, { y: L, id: 'cg2', look: Math.PI });
      B.char('officer', 14.2, -54, { y: L, id: 'intr', look: Math.PI, weapon: 'beretta' });
      B.char('carrington', 2, -55.5, { y: L, id: 'carrington', look: Math.PI, pose: 'sit', ai: 'follow', order: { type: 'hold', pos: null } });
      for (const [i, x, z] of [[0, -18, -55.5], [1, -10, -45], [2, -14, -55.5]]) B.char('prisoner', x, z, { y: L, id: 'pr' + i, team: 'neutral', pose: 'sit', static: true, weapon: null, noKill: false, look: i === 1 ? 0 : Math.PI });
      for (let i = 0; i < 4; i++) B.char('soldier', 4 + (i % 2) * 2, -39 + Math.floor(i / 2) * 1.5, { y: U, id: 'rb' + i, group: 'response', hidden: true, aggressive: true, grenadier: i === 0 });
      for (let i = 0; i < 3; i++) B.char('commando', -59 + i * 5, -50.8, { y: L, id: 'tn' + i, group: 'tunnel', hidden: true, aggressive: true });
      B.char('officer', -60, -51, { y: L, id: 'chief', group: 'tunnel', hidden: true, weapon: 'm60', hp: 520, boss: true, aggressive: true, grenadier: true, taunts: ['Далеко не уйдёте!', 'Генерал останется здесь — мёртвым!', 'Сдавайся, Тринадцатый!'] });

      B.trigger('downstairs', 2.2, L - 0.5, -43.8, 9.8, L + 3, -37.5);
      B.trigger('cellblock', -28, L - 0.5, -52, 18, L + 3, -48);
      B.trigger('tunnel', -60, L - 0.5, -52, -34, L + 3, -48);
      B.trigger('lift', -69.5, L - 0.5, -53.5, -64.5, L + 3, -46.5);
      B.cam('cellCam', [2, L + 1.8, -49], [2, L + 1.1, -55.5], 45);
      B.cam('tunnelCam', [-40, L + 2.4, -50.5], [-58, L + 1.4, -50], 45);
      B.zone('dark', -64, -52, -34, -48, { k: 0.55 });
    },
    script(S) {
      S.on('start', g => {
        g.objective('key', 'Найти ключи от камер — кабинет начальника блока');
        g.objective('general', 'Освободить генерала Кэррингтона');
        const c = g.char('carrington');
        if (c) c.ai.untargetable = true;
        g.caption('Блок «Д». Сырой бетон, гул вентиляции. Где-то внизу — генерал.', 5);
      });
      S.pick('cellkey', g => { g.complete('key'); g.msg('Камеры — на нижнем уровне. Лестница в конце коридора.', 4); g.checkpoint('key'); });
      S.zone('downstairs', g => { g.panel({ kind: 'cam', cam: 'cellCam', dur: 2.8, text: 'КАМЕРА 6' }); g.checkpoint('down'); });
      S.on('open:cn5', g => {
        const c = g.char('carrington');
        g.comic('freed');
        g.memory('cold', 'Голос генерала. Плац, ветер, мишени на восьмистах метрах. «Дыши, Роуланд. Дыши и жди».');
        c.pose = null; c.ai.untargetable = false; c.ai.order = { type: 'follow' };
        g.complete('general');
        g.objective('out', 'Вывести генерала к подъёмнику в конце тоннеля');
        g.objective('alive', 'Генерал должен выжить');
        g.after(3, () => {
          g.say('radio', 'Тревога! Заключённый из шестой камеры бежал! Всем постам — блок «Д»!');
          g.raiseAlarm([2, -5, -50], 'script');
          g.spawn('response', [2, -5, -50]);
          g.music('combat');
        });
        g.checkpoint('freed');
      });
      S.on('restore', g => {
        const c = g.char('carrington');
        if (!c) return;
        if (g.flags['!open:cn5'] && c.state === 'alive') { c.pose = null; c.ai.untargetable = false; c.ai.order = { type: 'follow' }; }
        else c.ai.untargetable = true;
      });
      S.dead('carrington', g => { if (g.flags['!open:cn5']) g.fail('Генерал Кэррингтон погиб.'); });
      S.zone('tunnel', g => {
        if (!g.flags['!open:cn5']) return;
        g.spawn('tunnel', g.player.pos);
        g.panel({ kind: 'cam', cam: 'tunnelCam', dur: 2.8, text: 'НАЧАЛЬНИК БЛОКА', tint: 'red' });
        g.music('boss');
        g.checkpoint('tunnel');
      });
      S.cleared('tunnel', g => {
        g.enable('liftBtn', true);
        g.music('calm');
        const c = g.char('carrington');
        if (!c || c.state !== 'alive') return;
        c.ai.order = { type: 'goto', pos: [-67.8, L, -51], run: true };
        g.say('xiii', 'Генерал, на платформу!');
        g.msg('Подъёмник свободен. Встаньте на платформу и жмите кнопку.', 4);
      });
      S.zone('lift', g => { if (g.flags['!cleared:tunnel']) g.enable('liftBtn', true); });
      S.use('liftBtn', g => {
        const c = g.char('carrington');
        if (g.flags.liftGo) return;
        if (X.hdist(c.pos, [-67, 0, -50]) > 3.2) { g.msg('Подождите генерала.', 2); return; }
        g.setFlag('liftGo');
        g.moveGroup('lift', [[-67, 15, -50]], 2.4);
        g.say('carrington', 'Наверху станция канатной дороги. Другого пути вниз нет.');
      });
      S.on('arrive:lift', g => { g.complete('out'); if (g.char('carrington').state === 'alive') g.complete('alive'); g.finish(); });
    },
    comics: {
      intro: [
        {
          rows: [{ h: 1, w: [0.45, 0.55] }],
          panels: [
            { art: 'silhouette', artOpt: { glint: true }, text: [{ k: 'say', t: 'Утром Кэррингтона — к Номеру Один. Тринадцатый придёт за ним. Пусть приходит.', x: 0.05, y: 0.06, w: 0.9, tail: [0.5, 0.35] }] },
            { cam: { pos: [3.6, L + 1.4, -51.5], look: [2, L + 1.0, -55.5], fov: 46 }, actors: [{ type: 'carrington', pos: [2, L, -55.5], yaw: Math.PI, pose: 'sit', face: 'pain' }], tint: 'grey', text: [{ k: 'think', t: 'Джонс... Надеюсь, ты его нашла. Надеюсь, он помнит, кто он.', x: 0.05, y: 0.05, w: 0.7 }] }
          ]
        }
      ],
      freed: [
        {
          rows: [{ h: 0.55, w: [0.55, 0.45] }, { h: 0.45, w: [1] }],
          panels: [
            { cam: { pos: [3.4, L + 1.6, -50.8], look: [2, L + 1.2, -55], fov: 46 }, actors: [{ type: 'carrington', pos: [2, L, -55], yaw: Math.PI - 0.3, pose: 'talk' }, { type: 'xiii', pos: [2.2, L, -52.8], yaw: 0.1, pose: 'stand' }], text: [{ k: 'say', t: 'Тринадцатый?! Значит, Джонс вас нашла.', x: 0.05, y: 0.05, w: 0.6, who: 0 }] },
            { shot: { on: 0, dist: 0.8, height: 0.05, angle: 20, fov: 36, target: 'head' }, actors: [{ type: 'carrington', pos: [0, 0, 0], yaw: 0, pose: 'talk', float: true }], hideWorld: true, bg: [0.35, 0.4, 0.3], text: [{ k: 'say', t: 'Двадцать заговорщиков. «XX». Вы были тринадцатым из них, Роуланд.', x: 0.05, y: 0.05, w: 0.88, who: 0 }] },
            { art: 'dossier', artOpt: { names: ['I — ?', 'XIII — РОУЛАНД', 'XX — ?', 'ЦЕЛЬ: ШЕРИДАН'] }, text: [{ k: 'say', t: 'Потом, генерал. Сначала — выбраться отсюда.', x: 0.5, y: 0.72, w: 0.46, tail: [0.2, 0.3] }] }
          ]
        }
      ],
      outro: [
        {
          rows: [{ h: 1, w: [0.5, 0.5] }],
          panels: [
            { cam: { pos: [-65, 16.5, -44], look: [-67, 15.5, -50], fov: 50 }, actors: [{ type: 'carrington', pos: [-66.4, 15, -50.4], yaw: 0.5, pose: 'stand', float: true }, { type: 'xiii', pos: [-68, 15, -49], yaw: -0.3, pose: 'aim_rifle', gun: 'm16', float: true }], hideWorld: true, bg: [0.72, 0.8, 0.9], text: [{ k: 'cap', t: 'Платформа вынесла нас к утреннему свету.', x: 0.04, y: 0.06, w: 0.6 }] },
            { art: 'silhouette', artOpt: { a: '#dfe8f2', b: '#7a90b0' }, text: [{ k: 'say', t: 'Канатная дорога — единственный путь вниз. Если они её не перерезали...', x: 0.05, y: 0.62, w: 0.9, tail: [0.5, 0.35] }] }
          ]
        }
      ]
    }
  });
})(globalThis.XIII = globalThis.XIII || {});
