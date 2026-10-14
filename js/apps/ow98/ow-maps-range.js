(function (O) {
  'use strict';
  const PAN = 0xeef0f4, TRIM = 0xf08a30;

  O.MAPS.range = {
    id: 'range', name: 'ТРЕНИРОВОЧНЫЙ ПОЛИГОН', mode: 'practice',
    theme: {
      skyTop: 0x4a8ad8, skyHorizon: 0xd8e8f4, skyLow: 0x7a9ab8, fog: 0xd0e0ec, fogNear: 80, fogFar: 260,
      sun: [0.4, 0.8, -0.35], sunCol: 0xfff4e0, amb: 0xa8b4cc, ground: 0x9a9690,
      skyline: 'rocks', skylineTint: 0x8a98a8, time: 'day', sea: -20, seaCol: 0x2a6aa8
    },
    build(B) {
      B.bounds(-30, -40, 30, 64);
      B.floor(-30, -40, 30, 64, 0, 'concrete', { tint: 0xc4c8ce });
      B.box(-32, 0, -42, 32, 8, -40, 'panel', { tint: PAN, band: { h: 0.6, mat: 'metal', tint: TRIM } });
      B.box(-32, 0, 64, 32, 10, 66, 'panel', { tint: PAN, band: { h: 0.6, mat: 'metal', tint: TRIM } });
      B.box(-32, 0, -40, -30, 8, 64, 'panel', { tint: PAN, band: { h: 0.6, mat: 'metal', tint: TRIM } });
      B.box(30, 0, -40, 32, 8, 64, 'panel', { tint: PAN, band: { h: 0.6, mat: 'metal', tint: TRIM } });
      B.sign(0, 7, 63.95, 's', 22, 2.2, 'ТРЕНИРОВОЧНЫЙ ПОЛИГОН OVERWATCH', { bg: '#e8ecf2', fg: '#f08a30' });

      B.spawnRoom({ role: 'att', stage: [0, 9], x: 0, z: -34, w: 14, d: 10, yaw: 0, exits: [{ side: 'n', a: 4, b: 10 }], mat: 'panel', tint: PAN });
      B.healthPack(-5, -24, false);
      B.healthPack(22, 0, true);
      B.box(3, 0, -18, 7, 1, -14, 'crate', { tint: 0xd8b888 });

      for (const [z, t] of [[-19, '10 М'], [-9, '20 М'], [6, '35 М'], [20, '50 М']]) {
        B.sign(-16, 0.03, z + 2.2, 'up', 8, 1.4, t, { bg: '#2a2e36', fg: '#f0f0f0' });
        B.box(-28, 0, z - 0.1, -4, 0.06, z + 0.1, 'metal', { tint: TRIM, col: false });
      }
      B.box(1.6, 0, -12, 2.4, 1.2, 44, 'panel', { tint: PAN, top: 'metal', topTint: TRIM });
      B.sign(16, 5.5, 47.95, 's', 12, 1.6, 'ЗОНА ОГНЯ', { bg: '#1a1a24', fg: '#ff6a3a' });
      B.box(4, 0, 48, 30, 6, 50, 'panel', { tint: PAN });
      B.box(10, 0, 12.6, 18, 1.3, 13.6, 'panel', { tint: PAN, top: 'metal', topTint: TRIM });
      B.box(18, 0, 26.6, 26, 1.3, 27.6, 'panel', { tint: PAN, top: 'metal', topTint: TRIM });
      B.box(8, 0, 34, 12, 2.4, 38, 'crate', { tint: 0xd8b888 });
      B.prop('container', 25, 4, { c: 0x2a6aa8 });
      B.prop('crates', 12, -6);

      B.box(-30, 0, 34, -22, 3, 54, 'panel', { tint: PAN, top: 'grate', topTint: 0xb0b4bc });
      B.stairs(-22, 40, -16, 46, 0, 3, 'x-', 'metal', { tint: 0x9aa0ac });
      B.rail(-30, 34, -22, 34, 3, 'metal', { tint: TRIM });
      B.prop('antenna', -26, 50, { h: 16, col: false, y: 3 });
      B.prop('dish', -26, 40, { col: false, y: 3 });

      for (const [x, z] of [[-20, -19], [-10, -9], [-18, 6], [-8, -19], [-24, 20]]) B.hint('bot', 0, x, z, { yaw: Math.PI, tag: 'static' });
      for (const [x, z] of [[-10, 22], [-16, 34]]) B.hint('bot', 0, x, z, { yaw: Math.PI, tag: 'strafe' });
      for (const [x, z] of [[14, 16], [22, 30]]) B.hint('bot', 0, x, z, { yaw: Math.PI, tag: 'shoot' });
      for (const [x, z] of [[8, -27], [12, -24]]) B.hint('bot', 0, x, z, { yaw: -Math.PI / 2, tag: 'hurt' });
      for (const [x, z] of [[-20, -8], [20, -20], [0, 30]]) B.light(x, 6, z, 0xf0f4ff, 16);

      B.prop('lighthouse', -80, 10, { col: false, y: -20 });
      B.prop('boat', -70, 50, { col: false, y: -20 });
      B.cam('shot', 0, 3, -26, -10, 2, 6);
      B.cam('menu', 8, 2.4, -24, -12, 2.5, 0);
    }
  };

  O.RANGE_TEAMS = function (ui, tutorial) {
    const me = { name: ui.profile.name, human: true, skins: O.Profile.skinsMap(ui.profile), hero: null };
    const bot = (drill, i) => ({ name: (drill === 'hurt' ? 'МЕДБОТ-' : 'МИШЕНЬ-') + String(i + 1).padStart(2, '0'), hero: 'trainbot', drill, skill: 1 });
    if (tutorial) return [[me], ['static', 'static', 'static', 'static', 'static', 'strafe'].map(bot)];
    return [[me, bot('hurt', 0), bot('hurt', 1)], ['static', 'static', 'static', 'strafe', 'shoot', 'shoot'].map(bot)];
  };
})(globalThis.Ow98 = globalThis.Ow98 || {});
