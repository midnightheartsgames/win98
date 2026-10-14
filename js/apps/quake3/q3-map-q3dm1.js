(function (Q) {
  'use strict';
  Q.MAPS = Q.MAPS || {};
  Q.MAPS.q3dm1 = {
    id: 'q3dm1',
    name: 'Arena Gate',
    sky: { top: [0.55, 0.08, 0.04], horizon: [0.95, 0.35, 0.12], cloud: [1, 0.55, 0.3], speed: 0.012 },
    sun: { dir: [0.35, -0.55, -0.76], color: [1, 0.55, 0.38], intensity: 0.5 },
    ambient: [0.13, 0.085, 0.075],
    music: 0,
    levelshot: { pos: [0, -930, 96], yaw: 90, pitch: -10 },
    build(B) {
      B.skyShell(-704, -1024, -32, 704, 1344, 1024);
      B.box(-640, -960, -32, 640, 0, 0, 'gfloor');
      B.box(-704, -1024, -32, -640, 0, 400, 'gwall');
      B.box(640, -1024, -32, 704, 0, 400, 'gwall');
      B.box(-704, -1024, -32, 704, -960, 400, 'gwall');
      B.box(-640, -960, 368, -620, 0, 400, 'gtrim', { noCover: true });
      B.box(620, -960, 368, 640, 0, 400, 'gtrim', { noCover: true });
      B.box(-620, -960, 368, 620, -940, 400, 'gtrim', { noCover: true });
      for (const x of [-384, -128, 128, 384]) B.box(x - 24, -960, 0, x + 24, -936, 368, 'gblock');
      for (const y of [-768, -256]) {
        B.box(-640, y - 24, 0, -616, y + 24, 368, 'gblock');
        B.box(616, y - 24, 0, 640, y + 24, 368, 'gblock');
      }
      B.box(-640, -960, 0, 640, -952, 16, 'gtrim', { noCover: true });

      for (const s of [-1, 1]) {
        const px = 448 * s, py = -512;
        B.box(px - 80, py - 80, 0, px + 80, py + 80, 64, 'gblock', { top: 'gfloor2' });
        if (s > 0) B.stairs(px - 144, py - 48, px - 80, py + 48, 0, 64, 'x+', 4, 'gblock', { top: 'gfloor2' });
        else B.stairs(px + 80, py - 48, px + 144, py + 48, 0, 64, 'x-', 4, 'gblock', { top: 'gfloor2' });
        B.column(px + 40 * s, py, 64, 320, 22, 'gcol', 'gblock');
        B.box(px + 40 * s - 30, py - 30, 320, px + 40 * s + 30, py + 30, 332, 'gmetal');
        B.flame(px + 40 * s, py, 334, 1.4);
        B.deco('statue', 224 * s, -720, 48, { yaw: 90, model: s > 0 ? 'xaero' : 'uriel', scale: 1.15 });
        B.box(224 * s - 36, -756, 0, 224 * s + 36, -684, 48, 'gblock', { top: 'gtrim' });
      }

      B.decal('emblem', 0, -480, 0.5, 220);
      B.box(-384, -192, 0, 384, 0, 48, 'gblock', { top: 'gfloor2' });
      B.stairs(384, -192, 480, 0, 0, 48, 'x-', 3, 'gblock', { top: 'gfloor2' });
      B.stairs(-480, -192, -384, 0, 0, 48, 'x+', 3, 'gblock', { top: 'gfloor2' });
      B.stairs(-128, -256, 128, -192, 0, 48, 'y+', 3, 'gblock', { top: 'gfloor2' });

      B.box(-704, 0, -32, 704, 1344, 48, 'gblock', { top: 'gfloor2' });
      B.carve(-704, 0, 704, 1344, [
        [-96, 0, 96, 64, 208],
        [-256, 64, 256, 448, 304],
        [-576, 192, -256, 320, 224],
        [-576, 320, -448, 832, 224],
        [-448, 704, -384, 832, 224],
        [256, 192, 576, 320, 224],
        [448, 320, 576, 832, 224],
        [384, 704, 448, 832, 224],
        [-64, 448, 64, 640, 224],
        [-384, 640, 384, 1152, 448],
        [-112, 1152, 112, 1280, 240]
      ], 48, 496, 'gwall', { ceil: 'gceil' });

      B.wallX(-16, 0, -448, 448, 48, 448, 'gblock', [{ a: -96, b: 96, top: 208, arch: 'round' }]);
      B.prism('y', [[-192, 448], [192, 448], [0, 600]], -16, 0, 'gblock');
      B.decal('rosewin', 0, -17, 392, 120, { n: [0, -1, 0] });
      for (const s of [-1, 1]) {
        B.box(352 * s - 64, -64, 48, 352 * s + 64, 64, 704, 'gwall');
        B.box(352 * s - 72, -72, 688, 352 * s + 72, 72, 704, 'gtrim');
        B.pyramid(352 * s, 0, 704, 900, 100, 4, 'gmetal', { rot: Math.PI / 4 });
        B.box(352 * s - 68, -68, 440, 352 * s + 68, -64, 456, 'gtrim', { noCover: true });
        B.torch(140 * s, -16, 176, -90);
        B.pyramid(560 * s, -8, 496, 620, 40, 4, 'gmetal', { rot: Math.PI / 4 });
      }
      B.box(-704, 0, 496, 704, 16, 512, 'gtrim');

      for (const s of [-1, 1]) {
        B.torch(248 * s, 256, 200, s > 0 ? 180 : 0);
        B.light([512 * s, 256, 190], 190, [1, 0.8, 0.6]);
        B.light([512 * s, 512, 190], 190, [1, 0.8, 0.6]);
        B.light([512 * s, 768, 190], 190, [1, 0.8, 0.6]);
        B.box(512 * s - 12, 500, 212, 512 * s + 12, 524, 224, 'lightpanel');
        B.box(512 * s - 12, 244, 212, 512 * s + 12, 268, 224, 'lightpanel');
        B.column(224 * s, 768, 48, 448, 20, 'gcol', 'gblock');
        B.column(224 * s, 1024, 48, 448, 20, 'gcol', 'gblock');
        B.torch(376 * s, 896, 230, s > 0 ? 180 : 0);
      }
      B.light([0, 896, 400], 420, [1, 0.78, 0.6]);
      B.light([0, 256, 280], 260, [1, 0.8, 0.62]);
      B.box(-24, 232, 290, 24, 280, 304, 'lightpanel');
      B.cyl(0, 896, 72, 48, 64, 8, 'gblock', { top: 'gtrim' });
      B.decal('demon', 0, 1151.4, 328, 256, { n: [0, -1, 0] });
      for (let i = 0; i < 6; i++) {
        const x = -112 + i * 224 / 6;
        B.prism('y', [[x, 240], [x + 224 / 6, 240], [x + 112 / 6, 212]], 1152, 1164, 'gbone');
      }
      B.light([0, 1216, 140], 260, [1, 0.22, 0.1]);
      B.light([0, 1180, 60], 140, [1, 0.35, 0.1]);
      B.box(-112, 1264, 48, 112, 1280, 240, 'flesh');

      B.item('weapon_rocketlauncher', 0, -480, 0);
      B.item('weapon_shotgun', -176, 128, 48);
      B.item('weapon_plasmagun', 0, 896, 64);
      B.item('item_armor_body', 0, 1224, 48);
      B.item('item_armor_combat', 420, -512, 64);
      B.item('item_health', -420, -540, 64);
      B.item('item_health', -420, -484, 64);
      for (const p of [[-592, -880], [592, -880], [-592, -140], [592, -140], [-40, -900], [40, -900]]) B.item('item_armor_shard', p[0], p[1], 0);
      B.item('item_health', -592, -512, 0);
      B.item('item_health', 592, -512, 0);
      B.item('ammo_rockets', 0, -880, 0);
      B.item('ammo_rockets', 0, 540, 48);
      B.item('ammo_cells', -96, 1000, 48);
      B.item('ammo_cells', 96, 1000, 48);
      B.item('ammo_shells', 176, 128, 48);
      B.item('ammo_bullets', -512, 576, 48);
      B.item('ammo_bullets', 512, 576, 48);
      B.item('item_health', -512, 760, 48);
      B.item('item_health', 512, 760, 48);
      B.item('item_health_small', -300, 1100, 48);
      B.item('item_health_small', 300, 1100, 48);
      B.item('item_health_small', -300, 700, 48);
      B.item('item_health_small', 300, 700, 48);

      B.spawn(-520, -860, 0, 45);
      B.spawn(520, -860, 0, 135);
      B.spawn(-540, -120, 0, -45);
      B.spawn(540, -120, 0, -135);
      B.spawn(0, 300, 48, -90);
      B.spawn(-340, 980, 48, -45);
      B.spawn(320, 800, 48, 135);
      B.spawn(-512, 420, 48, -90);
      B.spawn(512, 420, 48, -90);
      B.intermission(0, -900, 180, 90, 8);
    }
  };
})(globalThis.Quake3 = globalThis.Quake3 || {});
