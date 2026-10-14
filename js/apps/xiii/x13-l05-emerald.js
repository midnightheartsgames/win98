(function (X) {
  'use strict';
  const F = X.F;
  const P = 20;

  function ground(x, z) {
    const ax = Math.abs(x);
    const inX = X.smooth(X.clamp((ax - 70) / 22, 0, 1));
    const inN = X.smooth(X.clamp((-z - 70) / 22, 0, 1));
    const inS = X.smooth(X.clamp((z - 50) / 30, 0, 1));
    let h = P;
    h += inX * (ax - 70) * 0.42;
    h += inN * (-z - 70) * 0.55;
    h -= inS * Math.min(12, (z - 50) * 0.16);
    const n = Math.sin(x * 0.07 + 1.3) * Math.cos(z * 0.06) * 2.2 + Math.sin(x * 0.19 + z * 0.13) * 0.8;
    h += n * Math.max(inX, inN, inS);
    return h;
  }

  function hut(B, x0, z0, x1, z1, h, wall, o) {
    o = o || {};
    B.room(x0, z0, x1, z1, P, h, { floor: o.floor || 'wood_floor', ceil: null, wall, t: 0.25, doors: o.doors || {}, windows: o.windows || {} });
    B.roof(x0, z0, x1, z1, P + h, o.rh || 1.6, o.axis || 'x', 'snow_roof', { over: 0.45, wall, gableMat: wall });
    B.interior(x0 + 0.15, P - 0.3, z0 + 0.15, x1 - 0.15, P + h + 1.5, z1 - 0.15);
  }

  X.addLevel({
    id: 'emerald', n: 5, name: 'Emerald Base', sub: 'База «Эмеральд», Монтана',
    env: {
      sky: { top: [0.06, 0.08, 0.16], mid: [0.16, 0.2, 0.32], hor: [0.42, 0.46, 0.56], below: [0.3, 0.33, 0.42], sun: [-0.4, 0.5, 0.75], sunColor: [0.7, 0.75, 0.9], sunSize: 0.001, clouds: 0.5, cloudColor: [0.36, 0.4, 0.52], stars: 0.5, moon: [-0.4, 0.5, 0.75], mountains: 1.1, mountainColor: [0.28, 0.32, 0.44] },
      light: { dir: [-0.4, 0.55, 0.72], color: [0.62, 0.7, 0.9], ambient: [0.34, 0.38, 0.5], shadow: [0.34, 0.38, 0.54], indoor: [0.62, 0.62, 0.66] },
      fog: { color: [0.36, 0.4, 0.52], near: 25, far: 170 },
      grade: { tint: [0.96, 1.0, 1.08], sat: 0.9 },
      snow: 1
    },
    light: 0.7,
    powerLight: 0.45,
    music: 'stealth',
    stealth: true,
    ambience: 'wind',
    loadout: { weapons: ['silenced', 'knife', 'sniper'], clip: { silenced: 15, sniper: 5 }, res: { silenced: 45, knife: 6, sniper: 10 }, medkits: 2, gadgets: { lockpick: true, hook: true }, skills: ['sense', 'marksman', 'silent'], weapon: 'silenced' },
    build(B) {
      B.bounds(-72, -72, 72, 108);
      B.terrain({ x0: -220, z0: -220, x1: 220, z1: 220, cell: 4, fn: ground, mat: 'snow', steep: 'rock_snow' });
      const fenceLine = [[-60, 40, -60, -3.5], [-60, -10.5, -60, -60], [60, -60, 60, 40], [-60, -60, 60, -60]];
      for (const [x0, z0, x1, z1] of fenceLine) B.fence(x0, z0, x1, z1, P, 3.2, { span: 4 });
      B.box(-60, P, 39.8, -2.5, P + 1.1, 40.2, 'concrete', { flags: F.WALL });
      B.box(2.5, P, 39.8, 60, P + 1.1, 40.2, 'concrete', { flags: F.WALL });
      B.box(-2.5, P + 1.2, 39.8, 2.5, P + 1.3, 40.2, 'concrete', { flags: F.WALL });
      B.fence(-60, 40, -2.5, 40, P + 1.1, 2.2, { span: 4 });
      B.fence(2.5, 40, 60, 40, P + 1.1, 2.2, { span: 4 });
      B.fence(-2.5, 40, 2.5, 40, P + 1.3, 2.0, { span: 5 });
      B.box(-2.6, P - 0.2, 38.5, 2.6, P, 41.5, 'concrete', { flags: F.WALL });
      B.box(-2.6, P, 38.6, -2.4, P + 1.3, 41.4, 'concrete', { flags: F.WALL });
      B.box(2.4, P, 38.6, 2.6, P + 1.3, 41.4, 'concrete', { flags: F.WALL });
      B.box(-2.6, P + 1.2, 38.6, 2.6, P + 1.4, 41.4, 'concrete', { flags: F.WALL });
      B.sign('DRAINAGE', 0, P + 1.6, 41.45, 1.6, 0.3, Math.PI, { bg: '#c8c0a8', fg: '#2a2a2a', font: 'sans' });
      B.box(-61, P, -12, -59, P + 0.9, -10.5, 'concrete', { flags: F.WALL });
      B.box(-61, P, -3.5, -59, P + 0.9, -2, 'concrete', { flags: F.WALL });
      B.obox(-60, P + 3.6, -10.2, 0.08, 3.2, 0.08, 0.15, 'hazard', { solid: false });
      B.at(-63, P, -14, 0, () => { B.box(-1.5, 0, -1.5, 1.5, 2.6, 1.5, 'metal_green', { flags: F.WALL }); B.roof(-1.5, -1.5, 1.5, 1.5, 2.6, 0.3, 'x', 'snow_roof', { over: 0.3, gable: false, solid: false }); B.vbox(1.5, 1.2, -1, 1.52, 2.2, 1, 'window_lit', { emit: true }); });
      B.sign('EMERALD — RESTRICTED AREA', -61.5, P + 3.2, -7, 5, 0.7, -Math.PI / 2, { bg: '#e8e0c8', fg: '#8a1a10', font: 'sans', two: true });
      B.box(-120, P - 1, -10.5, -60, P + 0.02, -3.5, 'gravel', { flags: F.WALL });

      B.at(-55, P, 35, 0, () => X.PROPS.watchtower(B, { h: 7, roof: 'snow_roof' }));
      B.at(55, P, -55, 0, () => X.PROPS.watchtower(B, { h: 7, roof: 'snow_roof' }));
      B.searchlight(-53.8, P + 9.4, 33.8, Math.PI * 0.8, { sweep: 0.7, speed: 0.25, pitch: -0.3, range: 60 });
      B.searchlight(53.8, P + 9.4, -53.8, -Math.PI * 0.2, { sweep: 0.8, speed: 0.2, pitch: -0.3, range: 60, phase: 1.5 });

      hut(B, -44, -44, -22, -30, 3.2, 'wood_dark', { doors: { e: [[6, 1.3]] }, windows: { s: [[4, 1.4, 1, 2], [12, 1.4, 1, 2]] } });
      hut(B, -44, -18, -22, -4, 3.2, 'wood_dark', { doors: { e: [[6, 1.3]] }, windows: { n: [[4, 1.4, 1, 2], [12, 1.4, 1, 2]] } });
      for (const bz of [-37, -11]) {
        for (let x = -42; x < -25; x += 3.2) { B.prop('bunk', x, P, bz - 4.8, Math.PI / 2, { mat: 'fabric' }); B.prop('bunk', x, P, bz + 4.8, Math.PI / 2, { mat: 'fabric' }); }
        B.light(-33, P + 2.8, bz, [1, 0.85, 0.6], 11, { bulbR: 0.12, id: 'barracks' });
        B.prop('locker', -43.5, P, bz, Math.PI / 2, { n: 3 });
        B.prop('table', -30, P, bz, 0, { w: 2, d: 1 });
      }
      B.item('doc', -30, P + 0.8, -37, { title: 'Письмо солдата домой', text: 'Мама, нас держат тут без увольнений. На базе странные гости: генерал в наручниках, люди в чёрном без знаков различия. Говорят, это учения. Никто не верит.' });
      B.item('food', -30.3, P + 0.8, -11.2, { name: 'Армейский паёк', n: 20 });
      B.object('shovel', -23, P, -20, 0.2);
      B.alarm(-22.2, P + 1.5, -40, Math.PI / 2);

      const hq = [10, -46, 34, -28];
      B.room(hq[0], hq[1], hq[2], hq[3], P, 3.2, { floor: 'concrete', ceil: 'ceiling', wall: 'plaster_green', t: 0.3, doors: { s: [[5, 1.4]], w: [[9, 1.3]] }, windows: { s: [[12, 2, 1, 2.2], [18, 2, 1, 2.2]], e: [[5, 2, 1, 2.2]] } });
      B.box(hq[0] - 0.2, P + 3.2, hq[1] - 0.2, hq[2] + 0.2, P + 3.5, hq[3] + 0.2, 'snow_roof', { flags: F.WALL, top: 'snow_roof' });
      B.interior(hq[0] + 0.2, P - 0.3, hq[1] + 0.2, hq[2] - 0.2, P + 3.2, hq[3] - 0.2);
      B.wall(22, -46, 22, -28, P, P + 3.2, 'plaster_green', { t: 0.2, holes: [[4, 1.2], [13, 1.2]] });
      B.wall(10, -37, 22, -37, P, P + 3.2, 'plaster_green', { t: 0.2, holes: [[5, 1.2]] });
      B.sign('HQ', 15, P + 2.7, -27.8, 1.6, 0.6, Math.PI, { bg: '#2a3a2a', fg: '#f0e0a0', font: 'sans' });
      B.prop('desk', 28, P, -43, 0, { w: 2, lamp: true });
      B.prop('bookshelf', 33.4, P, -38, -Math.PI / 2, { w: 2.6 });
      B.prop('safe', 24, P, -45, 0, {});
      B.item('key', 28.4, P + 0.8, -43.1, { key: 'keycard', label: 'Карта-пропуск блока «Д»', id: 'keycard' });
      B.item('doc', 27.4, P + 0.8, -42.9, { title: 'Приказ по базе «Эмеральд»', text: 'Заключённого Кэррингтона содержать в блоке «Д» до прибытия Мангуста. Посторонних — расстреливать на месте. Тринадцатого, если объявится, взять живым: у Номера Один к нему вопросы.' });
      B.object('lamp', 27.3, P + 0.77, -43.3, 0);
      B.prop('desk', 15, P, -44.5, 0, { pc: true });
      B.prop('desk', 18, P, -44.5, 0, { pc: true });
      B.prop('tv', 12, P, -40, Math.PI / 2, {});
      B.item('doc', 15.4, P + 0.8, -44.4, { title: 'Радиоперехват', text: '«...Эмеральд, говорит Шеридан-2. Груз из порта получен. Джонс ушла. Удвойте посты — Тринадцатый придёт за генералом. Он всегда приходит за своими».' });
      B.alarm(10.3, P + 1.5, -33, -Math.PI / 2);
      for (let i = 0; i < 3; i++) B.prop('locker', 14 + i * 2.3, P, -29, Math.PI, { n: 2, mat: 'metal_green' });
      B.prop('table', 17, P, -32.5, 0, { w: 2, d: 1, mat: 'metal_grey', leg: 'metal_dark' });
      B.item('weapon', 16.4, P + 0.8, -32.5, { w: 'crossbow', n: 8, id: 'crossbow' });
      B.item('ammo', 17.6, P + 0.8, -32.4, { w: 'crossbow', n: 6 });
      B.item('medkit', 12, P + 0.1, -30, {});
      for (const [x, z] of [[16, -41], [28, -40], [16, -32], [28, -32]]) B.light(x, P + 2.9, z, [0.95, 0.95, 0.85], 7, { bulbR: 0.1, id: 'hq' });

      B.room(30, 10, 40, 20, P, 3, { floor: 'concrete', ceil: null, wall: 'metal_green', t: 0.2, doors: { w: [[4, 1.4]] } });
      B.roof(30, 10, 40, 20, P + 3, 1.2, 'z', 'snow_roof', { over: 0.4, wall: 'metal_green', gableMat: 'metal_green' });
      B.interior(30.2, P - 0.3, 10.2, 39.8, P + 4, 19.8);
      B.prop('generator', 35.5, P, 15, Math.PI / 2, {});
      B.usable('power', 34.2, P + 1.2, 15, { label: 'Отключить генератор', r: 1.8 });
      B.prop('fuel_tank', 44, P, 15, 0, {});
      B.light(35, P + 2.6, 12, [1, 0.8, 0.5], 7, { bulbR: 0.1, id: 'gen' });

      B.prop('truck', -4, P, 16, 0.05, { mat: 'metal_green' });
      B.prop('truck', 6, P, 17, -0.1, { mat: 'metal_green' });
      B.prop('jeep', -12, P, 24, 1.3, { mat: 'metal_green' });
      B.prop('jeep', 14, P, 26, -1.2, { mat: 'metal_green' });
      for (let i = 0; i < 5; i++) B.barrel(18 + i * 0.7, P, 8 + (i % 2) * 0.7, {});
      B.prop('crates', -18, P, 4, 0.3, { n: 4 });
      B.prop('sandbags', 0, P, -52, 0, { len: 6 });
      B.prop('sandbags', -30, P, 25, 0.6, { len: 4 });
      B.at(45, ground(45, -14), -14, 0, () => X.PROPS.radar(B, { yaw: 0.6 }));
      B.prop('antenna', 42, P, -30, 0, { h: 16 });

      B.box(-10, P, -72, 10, P + 8, -64, 'bunker', { flags: F.WALL });
      B.box(-12, P + 8, -72, 12, P + 9, -62, 'concrete', { flags: F.WALL, top: 'snow_roof' });
      B.box(-10, P, -64, -6, P + 8, -62, 'bunker', { flags: F.WALL });
      B.box(6, P, -64, 10, P + 8, -62, 'bunker', { flags: F.WALL });
      B.vbox(-6, P, -64.1, 6, P + 6, -63.95, 'door_metal');
      B.sign('БЛОК «Д»', 0, P + 6.8, -61.95, 3.4, 0.7, Math.PI, { bg: '#e8d020', fg: '#1a1a1a', font: 'sans' });
      B.usable('bunkerDoor', 0, P + 1.5, -63.2, { label: 'Открыть гермодверь пропуском', r: 2.2, need: 'keycard', needMsg: 'Нужна карта-пропуск из штаба.' });
      B.prop('lamp_post', -8, P, -60, 0, { h: 6, color: [1, 0.6, 0.25], r: 14 });
      for (const [x, z] of [[-30, -22], [0, -20], [20, 0], [-40, 20], [40, 30], [-10, 34]]) B.prop('lamp_post', x, P, z, 0, { h: 6, color: [1, 0.62, 0.28], r: 14, id: 'lamps' });

      const r = X.rng(55);
      for (let i = 0; i < 260; i++) {
        const x = (r() - 0.5) * 360, z = (r() - 0.5) * 360;
        if (Math.abs(x) < 66 && z > -66 && z < 46) continue;
        if (Math.abs(x) < 6 && z > 40 && z < 110) continue;
        if (Math.abs(z + 7) < 5 && x < -60) continue;
        B.tree('pine', x, z, { h: 9 + r() * 9, snow: true, solid: Math.abs(x) < 100 && z < 130, color: r() < 0.5 ? 'dark' : null });
      }
      for (let i = 0; i < 26; i++) {
        const x = (r() - 0.5) * 150, z = 44 + r() * 70;
        if (Math.abs(x) < 7) continue;
        B.rock(x, z, 1 + r() * 1.6, { snow: true, mat: 'rock' });
      }

      B.spawnPlayer(0, null, 96, 0);
      B.char('soldier', -50, 30, { y: P, id: 's1', path: [[-50, P, 30], [-50, P, -50], [50, P, -50], [50, P, 30]], wait: 1 });
      B.char('soldier', 20, 32, { y: P, id: 's2', path: [[20, P, 34], [-40, P, 34]], wait: 3 });
      B.char('merc2', -55, 35, { y: P + 7.2, id: 'tw1', ai: 'sniper', static: true, sight: 55, look: Math.PI * 0.8, weapon: 'sniper' });
      B.char('merc2', 55, -55, { y: P + 7.2, id: 'tw2', ai: 'sniper', static: true, sight: 55, look: -0.6, weapon: 'sniper' });
      B.char('soldier', -58, -14, { y: P, id: 'gate1', look: -Math.PI / 2 });
      B.char('soldier', -57, -1, { y: P, id: 'gate2', path: [[-57, P, -1], [-40, P, -1]], wait: 4 });
      B.char('soldier', -34.7, -41.8, { y: P + 0.45, id: 'sl1', pose: 'lie', static: true, sight: 5, yaw: -Math.PI / 2 });
      B.char('soldier', -37.9, -32.2, { y: P + 0.45, id: 'sl2', pose: 'lie', static: true, sight: 5, yaw: -Math.PI / 2 });
      B.char('soldier', -26, -16, { y: P, id: 'b1', look: Math.PI / 2, pose: 'sit' });
      B.char('soldier', -8, 6, { y: P, id: 's3', path: [[-8, P, 6], [26, P, 6], [26, P, -22], [-8, P, -22]], wait: 2 });
      B.char('officer', 28, -43.95, { y: P, id: 'off', look: Math.PI, pose: 'sit', static: true });
      B.char('soldier', 16, -38.6, { y: P, id: 'hq1', look: Math.PI / 2 });
      B.char('soldier', 14, -25, { y: P, id: 'hq2', look: Math.PI, ai: 'guard' });
      B.char('soldier', 29, 15, { y: P, id: 'g1', look: Math.PI / 2 });
      B.char('soldier', 4, -58, { y: P, id: 'bk1', look: Math.PI });
      B.char('soldier', -4, -58, { y: P, id: 'bk2', look: Math.PI });
      B.char('soldier', 40, -5, { y: P, id: 's4', path: [[40, P, -5], [40, P, -26], [55, P, -26]], wait: 2 });
      for (let i = 0; i < 6; i++) B.char('soldier', -3 + (i % 3) * 3, -60.5 + Math.floor(i / 3) * 1.5, { y: P, id: 'rs' + i, group: 'reserve', hidden: true, aggressive: i < 3, grenadier: i === 1 });

      B.trigger('inside', -58, P - 1, -58, 58, P + 5, 38.5);
      B.trigger('hq', 10.3, P - 1, -45.7, 33.7, P + 3, -28.3);
      B.trigger('gen', 30.2, P - 1, 10.2, 39.8, P + 3, 19.8);
      B.trigger('bunker', -8, P - 1, -63, 8, P + 5, -55);
      B.cam('culvertCam', [4, P + 2.2, 44], [0, P + 0.6, 40], 45);
      B.cam('bunkerCam', [0, P + 5, -44], [0, P + 3, -63], 45);
      B.zone('dark', -70, 40, 70, 110, { k: 0.55 });
      B.zone('dark', -44, -44, -22, -4, { k: 0.5 });
    },
    script(S) {
      S.on('start', g => {
        g.objective('enter', 'Проникнуть на базу «Эмеральд»');
        g.objective('noalarm', 'Не поднимать тревогу', { optional: true });
        g.caption('Монтана. Горная база «Эмеральд». Где-то здесь держат генерала Кэррингтона.', 5);
        g.after(5, () => g.radio('jones', 'Тринадцатый, я на связи. Главные ворота охраняются. Южнее есть дренажная труба под забором — пролезешь вприсядку.', 8));
      });
      S.zone('inside', g => {
        g.complete('enter');
        g.objective('card', 'Добыть пропуск в тюремный блок — штаб базы');
        g.objective('power', 'Отключить генератор, чтобы погасли прожекторы', { optional: true });
        g.panel({ kind: 'cam', cam: 'bunkerCam', dur: 2.8, text: 'БЛОК «Д»' });
        g.checkpoint('inside');
      });
      S.use('power', g => {
        g.setFlag('powerOff');
        for (const l of g.world.lights) if (l.id === 'lamps' || l.id === 'barracks') l.on = false;
        g.complete('power');
        g.msg('Генератор заглох. Прожекторы и фонари погасли.', 4);
        g.radio('jones', 'Свет вырубился по всей базе. Теперь ты — тень.', 4);
        g.checkpoint('power');
      });
      S.on('restore', g => {
        if (g.flags.powerOff) for (const l of g.world.lights) if (l.id === 'lamps' || l.id === 'barracks') l.on = false;
      });
      S.zone('hq', g => g.checkpoint('hq'));
      S.pick('keycard', g => {
        g.complete('card');
        g.objective('bunker', 'Открыть гермодверь блока «Д» пропуском');
        g.memory('hands', 'Замок, пропуск, чужие пальцы... Руки помнят то, чего не помнит голова.');
        g.checkpoint('card');
      });
      S.pick('crossbow', g => g.msg('Арбалет стреляет бесшумно. [ПКМ] — оптический прицел.', 4));
      S.on('alarm', g => {
        g.failObjective('noalarm');
        g.spawn('reserve', g.alarmPos || g.player.pos);
        g.radio('jones', 'Тревога! Из блока «Д» выходит подкрепление!', 4);
        g.music('combat');
      });
      S.use('bunkerDoor', g => {
        g.complete('bunker');
        if (!g.alarmOn) g.complete('noalarm');
        g.finish();
      });
    },
    comics: {
      intro: [
        {
          rows: [{ h: 0.55, w: [1] }, { h: 0.45, w: [0.5, 0.5] }],
          panels: [
            { cam: { pos: [-10, 26, 118], look: [0, 22, 30], fov: 55 }, actors: [{ type: 'xiii', pos: [-2, null, 100], yaw: 0.1, pose: 'crouch' }], text: [{ k: 'cap', t: 'Горы Монтаны. База «Эмеральд». 3:15 ночи. Минус двадцать.', x: 0.03, y: 0.06, w: 0.42 }] },
            { art: 'silhouette', artOpt: { a: '#3a4a6a', b: '#0a0e1a' }, text: [{ k: 'radio', t: 'Джонс: Генерал в блоке «Д», под горой. Пропуск — у дежурного офицера в штабе. И, Тринадцатый... не шуми.', x: 0.05, y: 0.06, w: 0.9 }] },
            { cam: { pos: [-44, P + 2.4, 24], look: [-50, P + 1.4, 30], fov: 46 }, actors: [{ type: 'soldier', pos: [-50, P, 30], yaw: 2.6, pose: 'rifle', gun: 'm16' }], tint: 'sepia', text: [{ k: 'say', t: 'Чёртов холод. Кому нужна эта база?', x: 0.05, y: 0.05, w: 0.6, who: 0 }] }
          ]
        }
      ],
      outro: [
        {
          rows: [{ h: 1, w: [0.5, 0.5] }],
          panels: [
            { cam: { pos: [3, P + 1.8, -56], look: [0, P + 2, -63], fov: 50 }, actors: [{ type: 'xiii', pos: [0, P, -61.5], yaw: 0, pose: 'stand' }], text: [{ k: 'sfx', t: 'KLANG!', x: 0.5, y: 0.2 }, { k: 'cap', t: 'Гермодверь поддалась. Внутри пахнет сыростью и страхом.', x: 0.04, y: 0.72, w: 0.9 }] },
            { art: 'dossier', artOpt: { names: ['БЛОК «Д»', 'КАМЕРА 6', 'КЭРРИНГТОН Б.', 'ДОСТУП: ТОЛЬКО М.'] }, text: [{ k: 'think', t: 'Камера шесть. Держитесь, генерал.', x: 0.1, y: 0.75, w: 0.8 }] }
          ]
        }
      ]
    }
  });
})(globalThis.XIII = globalThis.XIII || {});
