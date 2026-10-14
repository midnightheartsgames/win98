(function (X) {
  'use strict';
  const F = X.F;
  const Q = 1.5;

  function warehouse(B, x0, z0, x1, z1, h, o) {
    const doors = o.doors || {};
    B.room(x0, z0, x1, z1, Q, h, { floor: 'concrete', ceil: null, wall: 'corrugated', t: 0.25, doors });
    B.roof(x0, z0, x1, z1, Q + h, 2.5, o.axis || 'x', 'corrugated_roof', { over: 0.5, wall: 'corrugated' });
    B.interior(x0 + 0.2, Q - 0.3, z0 + 0.2, x1 - 0.2, Q + h + 2.5, z1 - 0.2);
    if (o.sign) B.sign(o.sign, (x0 + x1) / 2, Q + h - 1.2, z1 + 0.14, Math.min(x1 - x0 - 2, 12), 1.4, Math.PI, { bg: '#e8e0cc', fg: '#2a2a2a', font: 'sans' });
  }

  X.addLevel({
    id: 'jones', n: 4, name: 'Major Jones', sub: 'Порт, причал 13',
    env: {
      sky: { top: [0.03, 0.04, 0.1], mid: [0.08, 0.1, 0.22], hor: [0.24, 0.22, 0.34], below: [0.04, 0.05, 0.1], sun: [0.3, 0.55, 0.78], sunColor: [0.55, 0.6, 0.8], sunSize: 0.001, clouds: 0.35, cloudColor: [0.22, 0.24, 0.38], stars: 1, moon: [0.3, 0.55, 0.78], city: 0.9, cityColor: [0.1, 0.1, 0.18], cityLights: true },
      light: { dir: [0.3, 0.55, 0.78], color: [0.42, 0.5, 0.72], ambient: [0.2, 0.22, 0.34], shadow: [0.22, 0.24, 0.38], indoor: [0.5, 0.52, 0.6] },
      fog: { color: [0.08, 0.1, 0.18], near: 30, far: 190 },
      grade: { tint: [0.98, 1.0, 1.08], sat: 0.95 },
      water: [0.06, 0.12, 0.2]
    },
    light: 0.65,
    music: 'stealth',
    stealth: true,
    ambience: 'surf',
    loadout: { weapons: ['silenced', 'knife'], clip: { silenced: 15 }, res: { silenced: 30, knife: 5 }, medkits: 1, gadgets: { lockpick: true, hook: true }, skills: ['sense', 'marksman', 'silent'], weapon: 'silenced' },
    build(B) {
      B.bounds(-62, -42, 62, 96);
      B.box(-200, -9, -200, 200, -8, 200, 'sand_wet');
      B.water(-400, -400, 400, 400, 0);
      B.box(-60, -1, -40, 60, Q, 30, 'quay', { top: 'quay' });
      for (let x = -58; x < 60; x += 6) B.prop('bollard', x, Q, 29.2, 0, {});
      for (let z = -38; z < 30; z += 6) B.prop('bollard', 59.2, Q, z, 0, {});
      B.box(-58, 0, 31.8, -54, 0.45, 38, 'planks_z', { flags: F.WALL });
      for (const [x, z] of [[-58, 38], [-54, 38]]) B.cyl(x, -2, z, 0.18, 3, 'wood_dark', { sides: 6 });
      B.stairs(-58, 30, -54, 31.8, 0.45, Q, 'n', 'planks_x');
      B.at(-47, 0, 40, 0.3, () => X.PROPS.rowboat(B, {}));

      const rows = [-30, -21, -12, -3, 6];
      const mats = ['container_red', 'container_blue', 'container_green', 'container_orange'];
      rows.forEach((z, ri) => {
        let x = -46;
        let k = ri;
        while (x < -6) {
          const len = 6.1;
          const gap = (k * 7 + ri * 3) % 5 === 0;
          if (!gap) {
            B.prop('container', x + len / 2, Q, z, Math.PI / 2, { mat: mats[(k + ri) % 4], doors: k % 3 === 0 });
            if ((k + ri) % 3 !== 1) B.prop('container', x + len / 2, Q + 2.6, z, Math.PI / 2, { mat: mats[(k + ri + 2) % 4] });
          }
          x += len + (k % 2 ? 1.2 : 0.3);
          k++;
        }
      });
      B.prop('crates', -20, Q, 1.2, 0.2, { n: 4 });
      B.prop('crates', -38, Q, -8, -0.4, { n: 3 });
      B.prop('forklift', -30, Q, 13, 0.6, {});
      B.prop('pallet', -26, Q, 14.5, 0.1, {});
      B.prop('pallet', -12, Q, -17, 0.8, {});
      B.prop('oil_drum_fire', -14, Q, 13, 0, {});
      B.at(-20, Q, 22, 0, () => X.PROPS.crane(B, { h: 16 }));
      B.item('weapon', -20.5, Q + 16.4, 21.2, { w: 'sniper', n: 10, id: 'sniperRifle' });
      B.item('ammo', -19.2, Q + 16.4, 21.4, { w: 'sniper', n: 5 });
      B.at(-50, Q, -34, 0, () => X.PROPS.watchtower(B, { h: 6 }));
      B.searchlight(-48.6, Q + 8.3, -35.4, -Math.PI * 0.75, { sweep: 0.55, speed: 0.3, pitch: -0.22, range: 60 });
      B.searchlight(-15, Q + 21.5, 22, 2.6, { sweep: 0.7, speed: 0.22, pitch: -0.42, range: 55, phase: 2 });

      warehouse(B, 5, -36, 30, -12, 7, { sign: 'PIER 13 — WAREHOUSE A', doors: { w: [[19, 1.4]], s: [[14, 1.4]], n: [[4, 3.2]] } });
      warehouse(B, 35, -36, 58, -12, 7, { sign: 'WAREHOUSE B', doors: { w: [[20, 1.4]], s: [[5, 1.4], [15, 3.2]] } });
      B.light(17.5, Q + 5.5, -24, [1, 0.8, 0.5], 14, { bulbR: 0.2 });
      B.light(11, Q + 5.5, -16, [1, 0.8, 0.5], 9, { bulbR: 0.15 });
      B.light(46, Q + 5.5, -24, [1, 0.8, 0.5], 14, { bulbR: 0.2 });
      B.prop('chair', 17.5, Q, -24, 0, { mat: 'wood' });
      B.usable('free', 17.5, Q + 1.1, -24, { label: 'Развязать майора Джонс', r: 1.7 });
      for (const [x, z, n] of [[9, -32, 3], [26, -31, 4], [27, -15, 2], [8, -20, 2]]) B.prop('crates', x, Q, z, 0.2, { n });
      B.prop('forklift', 22, Q, -20, 1.2, {});
      B.room(5.2, -36, 11, -30, Q, 3, { floor: null, ceil: 'ceiling', wall: 'plaster', t: 0.15, skip: 'nw', doors: { s: [[2, 1.2]] }, windows: { e: [[1.5, 2, 1, 2.2]] } });
      B.prop('desk', 7.5, Q, -34.8, 0, { lamp: true });
      B.item('doc', 7.2, Q + 0.8, -34.8, { title: 'Накладная, причал 13', text: 'Груз: 14 ящиков «сельхозтехники». Получатель: база «Эмеральд», штат Монтана. Сопровождение: люди полковника. Особые указания: пленную доставить туда же живой. Подпись: «М.».' });
      B.alarm(11.1, Q + 1.5, -33, Math.PI / 2);
      B.item('medkit', 9.5, Q + 0.1, -31, {});
      for (const [x, z, n] of [[40, -32, 4], [53, -30, 3], [50, -17, 2], [39, -18, 3]]) B.prop('crates', x, Q, z, -0.3, { n });
      B.prop('table', 46, Q, -30, 0, { w: 2, d: 1 });
      B.item('grenades', 46, Q + 0.8, -30, { n: 3 });
      B.item('weapon', 45.3, Q + 0.8, -30.2, { w: 'kalash', n: 30 });
      B.item('vest', 47, Q + 0.8, -29.8, { n: 50 });
      B.item('medkit', 55, Q + 0.1, -14, {});
      B.alarm(57.7, Q + 1.5, -24, Math.PI / 2);

      for (const [x, z] of [[-40, 25], [-10, 25], [15, 25], [45, 25], [0, -8], [32, -5]]) {
        B.prop('lamp_post', x, Q, z, Math.PI, { h: 6, color: [1, 0.62, 0.25], r: 15 });
      }
      B.box(30, 0.5, 30, 38, Q - 0.2, 90, 'planks_z', { flags: F.WALL });
      for (let z = 34; z < 90; z += 5) for (const x of [30.3, 37.7]) B.cyl(x, -3, z, 0.22, 3.5, 'wood_dark', { sides: 6 });
      B.box(24, 0.5, 78, 44, Q - 0.2, 92, 'planks', { flags: F.WALL });
      for (const [x, z] of [[24.3, 78.3], [43.7, 78.3], [24.3, 91.7], [43.7, 91.7]]) B.cyl(x, -3, z, 0.25, 3.5, 'wood_dark', { sides: 6 });
      for (const [x, z, n] of [[27, 82, 3], [40, 81, 2], [33, 87, 2]]) B.prop('crates', x, Q - 0.2, z, 0.3, { n });
      B.prop('lamp_post', 34, Q - 0.2, 60, 0, { h: 5, color: [1, 0.62, 0.25], r: 12 });
      B.prop('lamp_post', 34, Q - 0.2, 90, 0, { h: 5, color: [1, 0.62, 0.25], r: 12 });
      B.at(48, 0.2, 86, Math.PI / 2, () => X.PROPS.boat(B, { len: 10, cabin: true, mat: 'boat_white' }));
      B.box(44, 0.8, 84.5, 46, 1.25, 87.5, 'planks', { flags: F.WALL });
      B.sign('CARRINGTON', 48, 1.3, 81.95, 2.6, 0.4, Math.PI, { bg: '#e8e6de', fg: '#1e3a6a', font: 'serif' });
      B.box(-60, Q, -40.4, 60, Q + 3.2, -40, 'brick_dark', { flags: F.WALL });
      B.fence(-60, -39.9, 60, -39.9, Q + 3.2, 1.2, { posts: false });
      B.clip(-60.5, Q, -40, -60, Q + 3, 30);

      B.spawnPlayer(-56, 0.45, 35, 0);
      B.char('commando', -40, -16.5, { y: Q, id: 'c1', path: [[-40, Q, -16.5], [-8, Q, -16.5], [-8, Q, 1.5], [-40, Q, 1.5]], wait: 2 });
      B.char('commando', -25, -25.5, { y: Q, id: 'c2', path: [[-25, Q, -25.5], [-44, Q, -25.5]], wait: 3 });
      B.char('docker', -14.8, 11.4, { y: Q, id: 'd1', look: 2.8, weapon: 'shotgun' });
      B.char('docker', -12.8, 14.4, { y: Q, id: 'd2', look: -2.6, weapon: 'beretta', pose: 'lean' });
      B.char('merc2', -50, -34, { y: Q + 6.2, id: 's1', ai: 'sniper', static: true, sight: 50, look: -Math.PI * 0.75, weapon: 'sniper' });
      B.char('commando', 0, 10, { y: Q, id: 'c3', path: [[0, Q, 10], [0, Q, 20], [28, Q, 20], [28, Q, 10]], wait: 2 });
      B.char('commando', 3.5, -18, { y: Q, id: 'c4', look: Math.PI / 2, ai: 'guard' });
      B.char('commando', 14, -21, { y: Q, id: 'c5', look: -2.2, group: 'captors' });
      B.char('commando', 21, -27, { y: Q, id: 'c6', look: 0.7, group: 'captors' });
      B.char('officer', 18.5, -22.4, { y: Q, id: 'o1', look: 2.6, pose: 'talk', group: 'captors', weapon: 'beretta' });
      B.char('jones', 17.5, -24, { y: Q, id: 'jones', look: Math.PI, pose: 'tied', ai: 'follow', order: { type: 'hold', pos: null }, untargetable: true });
      B.char('docker', 42, -26, { y: Q, id: 'd3', path: [[42, Q, -26], [52, Q, -26]], wait: 3, weapon: 'shotgun' });
      B.char('docker', 54, -20, { y: Q, id: 'd4', look: Math.PI, weapon: 'beretta' });
      B.char('commando', 50, 10, { y: Q, id: 'c7', path: [[50, Q, 10], [50, Q, 26], [40, Q, 26]], wait: 2 });
      for (let i = 0; i < 4; i++) B.char('commando', -2 + i * 2.2, -37.5, { y: Q, id: 'w1_' + i, group: 'wave1', hidden: true, aggressive: true, grenadier: i === 0 });
      for (let i = 0; i < 5; i++) B.char(i === 4 ? 'officer' : 'commando', 20 + i * 3, 27.5, { y: Q, id: 'w2_' + i, group: 'wave2', hidden: true, aggressive: true, grenadier: i === 2, weapon: i === 4 ? 'm60' : 'kalash' });

      B.trigger('quay', -54, Q - 0.5, 24, -50, Q + 3, 30);
      B.trigger('warehouse', 5.3, Q - 0.5, -35.7, 29.7, Q + 4, -12.3);
      B.trigger('pierStart', 30, 0, 28, 38, 4, 36);
      B.trigger('pierEnd', 24, 0, 78, 44, 4, 92);
      B.cam('jonesCam', [15.2, Q + 2.2, -20.5], [17.5, Q + 1, -24], 42);
      B.cam('craneCam', [-24, Q + 12, 16], [-20, Q + 17, 21.5], 45);
      B.cam('pierCam', [34, Q + 4, 70], [30, Q + 1.5, 30], 45);
      B.zone('dark', -48, -32, -4, 10, { k: 0.5 });
      B.zone('dark', 30, 30, 38, 78, { k: 0.6 });
      B.zone('lit', 5, -36, 30, -12, { k: 0.9 });
    },
    script(S) {
      S.on('start', g => {
        g.objective('find', 'Найти и освободить майора Джонс');
        g.objective('quiet', 'Не поднимать тревогу, пока Джонс в плену');
        g.caption('Меня выбросило в воду у причала. Джонс увезли на склад «А». Тихо — или её убьют.', 6);
        g.after(7, () => g.msg('Прожекторы поднимут всех вокруг. Держитесь в тени контейнеров. [C] — присесть.', 6));
        const jo = g.char('jones');
        if (jo) { jo.weapon = null; jo.ai.untargetable = true; }
      });
      S.zone('quay', g => g.checkpoint('quay'));
      S.zone('warehouse', g => {
        if (g.flags.freed) return;
        g.panel({ kind: 'cam', cam: 'jonesCam', dur: 3, text: 'МАЙОР ДЖОНС' });
        g.say('o1', 'Где генерал прячет свои бумаги, майор? Говорите — и умрёте быстро.');
      });
      S.on('alarm', g => {
        if (!g.flags.freed) {
          g.say('o1', 'Тревога! Кончайте её!');
          const jo = g.char('jones');
          if (jo && jo.state === 'alive') { jo.health = 0; g.killChar(jo, { by: null }); }
          g.fail('Поднялась тревога — майора Джонс казнили.');
        }
      });
      S.use('free', g => {
        g.setFlag('freed');
        g.complete('find');
        g.complete('quiet');
        const jo = g.char('jones');
        jo.pose = null; jo.weapon = 'm16'; jo.ai.untargetable = false;
        jo.ai.order = { type: 'follow' };
        g.say('jones', 'Долго же ты. Дай мне ствол — и уходим к катеру генерала!');
        g.comic('freed');
        g.objective('boat', 'Пробиться к катеру в конце пирса');
        g.objective('protect', 'Майор Джонс должна выжить');
        g.after(4, () => { g.spawn('wave1', [17, Q, -18]); g.music('combat'); });
        g.checkpoint('freed');
      });
      S.on('restore', g => {
        const jo = g.char('jones');
        if (g.flags.freed && jo && jo.state === 'alive') { jo.pose = null; jo.weapon = 'm16'; jo.ai.untargetable = false; jo.ai.order = { type: 'follow' }; }
        else if (jo) { jo.weapon = null; jo.ai.untargetable = true; }
      });
      S.dead('jones', g => { if (g.flags.freed) g.fail('Майор Джонс погибла.'); });
      S.zone('pierStart', g => {
        if (!g.flags.freed) return;
        g.panel({ kind: 'cam', cam: 'pierCam', dur: 2.6, text: 'ПОГОНЯ!' });
        g.spawn('wave2', [34, Q, 60]);
        g.checkpoint('pier');
      });
      S.zone('pierEnd', g => {
        if (!g.flags.freed) { g.msg('Без Джонс я не уйду.', 3); return; }
        g.complete('boat');
        const jo = g.char('jones');
        X.AI.goto(g, jo, [45, 1.25, 86], { id: 'jonesBoat', run: true });
        g.say('jones', 'Держи их, я заведу мотор! Сорок секунд!');
        g.objective('hold', 'Прикрывать Джонс, пока она заводит катер');
        g.later('engine', 40);
        g.music('boss');
      });
      S.timer('engine', g => {
        g.complete('hold');
        if (g.char('jones').state === 'alive') g.complete('protect');
        g.say('jones', 'Мотор завёлся! Прыгай!');
        g.finish();
      });
    },
    comics: {
      intro: [
        {
          rows: [{ h: 0.5, w: [0.62, 0.38] }, { h: 0.5, w: [0.5, 0.5] }],
          panels: [
            { cam: { pos: [-40, 4, 40], look: [-28, 2, 24], fov: 55 }, actors: [{ type: 'jones', pos: [-30, Q, 26], yaw: 2.6, pose: 'walk' }, { type: 'xiii', pos: [-32, Q, 27], yaw: 2.4, pose: 'walk' }], text: [{ k: 'cap', t: 'Порт. Причал 13. 2:40 ночи.', x: 0.03, y: 0.06, w: 0.34 }, { k: 'say', t: 'Катер генерала подойдёт через десять минут.', x: 0.45, y: 0.1, w: 0.5, who: 0 }] },
            { art: 'silhouette', artOpt: { a: '#2a3a6a', b: '#05060e', glint: true }, text: [{ k: 'shout', t: 'Руки вверх! Оба!', x: 0.08, y: 0.08, w: 0.84 }] },
            { cam: { pos: [-33, 2.2, 31], look: [-31, 1.6, 26], fov: 48 }, actors: [{ type: 'commando', pos: [-29, Q, 23.5], yaw: 2.8, pose: 'aim_rifle', gun: 'kalash' }, { type: 'jones', pos: [-30.5, Q, 26.4], yaw: -0.4, pose: 'hands_up' }], tint: 'blue', text: [{ k: 'say', t: 'Майора — на склад. Тринадцатого — в расход.', x: 0.05, y: 0.05, w: 0.6, who: 0 }] },
            { art: 'boom', text: [{ k: 'sfx', t: 'SPLASH!', x: 0.1, y: 0.35, size: 1.2 }, { k: 'cap', t: 'Удар прикладом — и я лечу в чёрную воду.', x: 0.04, y: 0.05, w: 0.7 }] }
          ]
        }
      ],
      freed: [
        {
          rows: [{ h: 1, w: [0.5, 0.5] }],
          panels: [
            { cam: { pos: [15.8, Q + 1.3, -25.8], look: [17.5, Q + 1.0, -24], fov: 44 }, actors: [{ type: 'jones', pos: [17.5, Q, -24], yaw: Math.PI, pose: 'tied' }, { type: 'xiii', pos: [16.6, Q, -23.3], yaw: 2.2, pose: 'kneel' }], tint: 'warm', text: [{ k: 'say', t: 'Долго же ты, Тринадцатый.', x: 0.05, y: 0.05, w: 0.6, who: 0 }] },
            { shot: { on: 0, dist: 0.8, height: 0.05, angle: 25, fov: 36, target: 'head' }, actors: [{ type: 'jones', pos: [0, 0, 0], yaw: 0, pose: 'aim_rifle', gun: 'm16', float: true }], hideWorld: true, bg: [0.7, 0.3, 0.16], text: [{ k: 'say', t: 'Катер генерала — в конце пирса. Прикрою!', x: 0.05, y: 0.62, w: 0.9, who: 0 }] }
          ]
        }
      ],
      outro: [
        {
          rows: [{ h: 0.5, w: [1] }, { h: 0.5, w: [0.45, 0.55] }],
          panels: [
            { cam: { pos: [60, 3, 70], look: [47, 1, 86], fov: 50 }, actors: [{ type: 'jones', pos: [46.5, 1.25, 86.5], yaw: 1.4, pose: 'stand' }, { type: 'xiii', pos: [48.5, 1.25, 85.2], yaw: -1.9, pose: 'aim', gun: 'silenced' }], text: [{ k: 'sfx', t: 'VROOOM!', x: 0.6, y: 0.2 }] },
            { shot: { on: 0, dist: 0.9, height: 0.05, angle: 20, fov: 36, target: 'head' }, actors: [{ type: 'jones', pos: [0, 0, 0], yaw: 0, pose: 'talk', float: true }], hideWorld: true, bg: [0.2, 0.26, 0.45], text: [{ k: 'say', t: 'Генерала Кэррингтона похитили. Его держат на базе «Эмеральд» в горах Монтаны.', x: 0.05, y: 0.05, w: 0.88, who: 0 }] },
            { art: 'dossier', artOpt: { names: ['БАЗА «ЭМЕРАЛЬД»', 'МОНТАНА', 'ПЛЕННИК: КЭРРИНГТОН', 'ОХРАНА: 40+'] }, text: [{ k: 'say', t: 'Значит, едем в горы. Мне всё равно больше некуда идти.', x: 0.05, y: 0.72, w: 0.9, tail: [0.2, 0.2] }] }
          ]
        }
      ]
    }
  });
})(globalThis.XIII = globalThis.XIII || {});
