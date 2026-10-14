(function (Q) {
  'use strict';
  Q.MAPS = Q.MAPS || {};
  Q.MAPS.q3dm6 = {
    id: 'q3dm6',
    name: 'The Camping Grounds',
    sky: { top: [0.5, 0.06, 0.03], horizon: [0.95, 0.38, 0.14], cloud: [1, 0.58, 0.32], speed: 0.014 },
    sun: { dir: [-0.35, 0.5, -0.79], color: [1, 0.58, 0.4], intensity: 0.55 },
    ambient: [0.11, 0.075, 0.065],
    music: 1,
    levelshot: { pos: [-520, -520, 170], yaw: 45, pitch: -8 },
    build(B) {
      B.box(-1216, -1216, -32, 1216, 1152, 0, 'gfloor');
      B.carve(-1216, -1216, 1216, 1152, [
        [-576, -576, 576, 576],
        [-64, 576, 64, 640, 160], [-448, 640, 448, 1088],
        [-96, -640, 96, -576, 200], [-128, -768, 128, -640],
        [-448, -1152, 448, -768, undefined, 128],
        [576, -320, 640, -192, 160], [576, 192, 640, 320, 160], [640, -448, 1152, 448],
        [-640, -320, -576, -192, 160], [-640, 192, -576, 320, 160], [-1152, -448, -640, 448]
      ], 0, 256, 'gwall', { ceil: 'gceil', lintel: 'gtrim', floor: 'gfloor2', step: 'gblock' });
      B.carve(-1216, -1216, 1216, 1152, [
        [-576, -576, 576, 576],
        [576, -64, 640, 64, 384], [-640, -64, -576, 64, 384],
        [-64, 576, 64, 640, 448, 320],
        [-448, 640, 448, 1088, 480],
        [640, -448, 1152, 448, 448], [-1152, -448, -640, 448, 448],
        [-448, -1152, 448, -768, 448]
      ], 256, 640, 'gwall', { ceil: 'gceil', lintel: 'gtrim', floor: 'gfloor2', step: 'gskull' });
      B.box(-576, -576, 640, 576, 576, 656, 'sky');
      B.box(-576, -576, 600, 576, -560, 616, 'gtrim', { noCover: true });
      B.box(-576, 560, 600, 576, 576, 616, 'gtrim', { noCover: true });
      B.box(-576, -560, 600, -560, 560, 616, 'gtrim', { noCover: true });
      B.box(560, -560, 600, 576, 560, 616, 'gtrim', { noCover: true });

      B.box(-576, -64, 240, 576, 64, 256, 'gblock', { top: 'gfloor2', bottom: 'gskull' });
      for (const x of [-288, 288]) B.column(x, 0, 0, 240, 22, 'gcol', 'gblock');
      B.jumppad(0, -440, 0, 26, 0, -110, 292);

      B.box(-128, -64, 0, 128, 64, 96, 'gblock', { top: 'gfloor2' });
      B.stairs(-96, 64, 96, 160, 0, 96, 'y-', 6, 'gblock', { top: 'gfloor2' });
      B.stairs(128, -32, 224, 32, 0, 96, 'x-', 6, 'gblock', { top: 'gfloor2' });
      B.stairs(-224, -32, -128, 32, 0, 96, 'x+', 6, 'gblock', { top: 'gfloor2' });

      const cat = [];
      for (let k = 0; k <= 12; k++) { const a = Math.PI + k * Math.PI / 12; cat.push([Math.cos(a) * 176, 576 + Math.sin(a) * 176]); }
      B.prism('z', cat, 304, 320, 'gblock', { top: 'gfloor2', bottom: 'gskull' });
      for (const x of [-128, 128]) B.column(x, 480, 0, 304, 16, 'gcol', 'gblock');
      B.jumppad(0, 200, 0, 24, 0, 430, 410);

      B.box(-448, 640, 304, 176, 704, 320, 'gblock', { top: 'gfloor2', bottom: 'gskull' });
      B.stairs(-448, 704, -384, 1024, 0, 320, 'y-', 20, 'gblock', { top: 'gfloor2' });
      for (const x of [-240, -80, 80, 240]) for (const y of [800, 928]) B.column(x, y, 0, 480, 18, 'gcol', 'gblock');

      B.stairs(-128, -768, 128, -640, 0, 128, 'y-', 8, 'gblock', { top: 'gfloor2' });
      B.wallX(-592, -576, -176, 176, 0, 256, 'gblock', [{ a: -96, b: 96, top: 176, arch: 'gothic' }]);
      B.box(-448, -1152, 128, 448, -1088, 240, 'gblock', { top: 'gfloor2' });
      B.stairs(-448, -1088, -384, -960, 128, 240, 'y-', 7, 'gblock', { top: 'gfloor2' });
      B.cyl(0, -1040, 32, 128, 256, 8, 'gcol', { top: 'gtrim' });
      for (const x of [-220, 220]) B.column(x, -940, 128, 448, 22, 'gcol', 'gblock');

      for (const s of [-1, 1]) {
        B.box(Math.min(640 * s, 1088 * s), -192, 240, Math.max(640 * s, 1088 * s), 192, 256, 'gblock', { top: 'gfloor2', bottom: 'gskull' });
        if (s > 0) B.stairs(1088, -384, 1152, -64, 0, 256, 'y+', 16, 'gblock', { top: 'gfloor2' });
        else B.stairs(-1152, 64, -1088, 384, 0, 256, 'y-', 16, 'gblock', { top: 'gfloor2' });
        B.light([896 * s, 0, 180], 360, [1, 0.72, 0.5]);
        B.light([896 * s, 0, 400], 300, [1, 0.7, 0.5]);
        B.light([896 * s, 330, 120], 260, [1, 0.6, 0.4]);
        B.light([896 * s, -330, 120], 260, [1, 0.6, 0.4]);
        B.box(896 * s - 20, -20, 432, 896 * s + 20, 20, 448, 'lightpanel');
        B.torch(568 * s, -400, 150, s > 0 ? 180 : 0);
        B.torch(568 * s, 400, 150, s > 0 ? 180 : 0);
        B.torch(568 * s, -150, 380, s > 0 ? 180 : 0);
        B.torch(568 * s, 150, 380, s > 0 ? 180 : 0);
      }
      B.light([0, 860, 240], 420, [1, 0.72, 0.52]);
      B.light([0, 1000, 420], 320, [1, 0.7, 0.5]);
      B.light([0, 470, 250], 260, [1, 0.6, 0.4]);
      B.light([0, -960, 300], 380, [1, 0.62, 0.45]);
      B.light([0, -700, 150], 260, [1, 0.6, 0.4]);
      B.flame(-400, -1120, 240, 1);
      B.flame(400, -1120, 240, 1);
      B.torch(-150, -568, 190, 90);
      B.torch(150, -568, 190, 90);
      B.torch(-440, 900, 200, 0);
      B.torch(440, 900, 200, 180);

      B.item('weapon_rocketlauncher', 0, 0, 256);
      B.item('ammo_rockets', -460, 0, 256);
      B.item('ammo_rockets', 460, 0, 256);
      B.item('weapon_railgun', 0, 470, 320);
      B.item('ammo_slugs', -110, 500, 320);
      B.item('ammo_slugs', 110, 500, 320);
      B.item('weapon_shotgun', 0, 864, 0);
      B.item('ammo_shells', 300, 1000, 0);
      B.item('weapon_plasmagun', 900, 300, 0);
      B.item('ammo_cells', 900, -300, 0);
      B.item('weapon_grenadelauncher', -900, 300, 0);
      B.item('ammo_grenades', -900, -300, 0);
      B.item('item_quad', -1000, 0, 0);
      B.item('item_armor_combat', 0, 0, 96);
      B.item('item_armor_body', -300, -880, 128);
      B.item('item_health_mega', 300, -880, 128);
      B.item('holdable_teleporter', 0, -1040, 256);
      for (const [x, y] of [[-150, -500], [150, -500], [0, -608], [-160, 1000], [160, 1000], [-90, 200], [90, 200]]) B.item('item_health', x, y, 0);
      for (let i = 0; i < 5; i++) B.item('item_health_small', -160 + i * 80, 540, 0);
      B.item('item_health_large', 800, 0, 256);
      B.item('item_health_large', -800, 0, 256);
      for (const x of [-300, -180, 180, 300]) B.item('item_armor_shard', x, 0, 256);
      B.item('item_armor_shard', -300, 672, 320);
      B.item('item_armor_shard', 100, 672, 320);
      B.item('ammo_bullets', -380, 520, 0);
      B.item('ammo_bullets', 380, -520, 0);

      B.spawn(-480, -480, 0, 45);
      B.spawn(480, -480, 0, 135);
      B.spawn(-480, 480, 0, -45);
      B.spawn(480, 480, 0, -135);
      B.spawn(0, 1000, 0, -90);
      B.spawn(1000, 0, 0, 180);
      B.spawn(-1000, 160, 0, 0);
      B.spawn(0, -900, 128, 90);
      B.spawn(800, 100, 256, 180);
      B.spawn(-800, -100, 256, 0);
      B.intermission(-500, -500, 220, 45, 12);
    }
  };
})(globalThis.Quake3 = globalThis.Quake3 || {});
