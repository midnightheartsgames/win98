(function (Q) {
  'use strict';
  Q.MAPS = Q.MAPS || {};
  Q.MAPS.q3tourney2 = {
    id: 'q3tourney2',
    name: 'The Proving Grounds',
    sky: null,
    sun: null,
    ambient: [0.1, 0.08, 0.08],
    music: 2,
    levelshot: { pos: [-440, -300, 240], yaw: 30, pitch: 14 },
    build(B) {
      B.box(-960, -512, -128, 960, 512, -96, 'gfloor2');
      B.carve(-960, -512, 960, 512, [
        [-512, -448, 512, 448, undefined, 0],
        [-896, -320, -576, 320, 160],
        [-576, -96, -512, 96, 128, 0],
        [-576, 224, -512, 320, 128, 0],
        [576, -192, 896, 192, 288, 96],
        [512, -64, 576, 64, 224, 96]
      ], -96, 448, 'gbrick', { ceil: 'gceil', lintel: 'gskull', floor: 'gfloor2', step: 'gblock' });
      B.box(-960, -512, 448, 960, 512, 480, 'gceil');

      B.box(-48, -384, 176, 48, 384, 192, 'metal', { top: 'grate', bottom: 'metal' });
      B.box(-512, 384, 176, 256, 448, 192, 'gblock', { top: 'gfloor2', bottom: 'gskull' });
      B.box(-256, -448, 176, 512, -384, 192, 'gblock', { top: 'gfloor2', bottom: 'gskull' });
      B.box(448, -448, 80, 512, 384, 96, 'metal', { top: 'grate', bottom: 'metal' });
      B.stairs(256, -448, 448, -384, 0, 96, 'x+', 6, 'gblock', { top: 'gfloor2' });
      B.stairs(256, 384, 448, 448, 96, 192, 'x-', 6, 'metal', { top: 'grate' });
      B.stairs(-448, -448, -256, -384, 0, 192, 'x+', 12, 'gblock', { top: 'gfloor2' });
      B.stairs(-832, 224, -576, 320, -96, 0, 'x+', 6, 'gblock', { top: 'gfloor2' });
      for (const y of [-240, 240]) B.column(0, y, 0, 176, 20, 'gcol', 'gblock');
      B.box(-96, -96, 0, 96, 96, 12, 'gblock', { top: 'gtrim' });
      B.decal('emblem', 0, 0, 12.5, 150);

      B.box(440, -448, 192, 452, -384, 280, 'metal');
      B.box(500, -448, 192, 512, -384, 280, 'metal');
      B.box(440, -448, 280, 512, -384, 292, 'lightblue');
      B.decal('telepad', 476, -416, 192.6, 60, { glow: true });
      B.teleporter(456, -440, 192, 496, -392, 260, [-736, 0, -96], 0);
      B.box(-896, -80, -96, -884, 80, 0, 'metal');
      B.box(-896, -80, 0, -840, 80, 12, 'lightblue');
      B.decal('telepad', -860, 0, -95.4, 70, { glow: true });
      B.teleporter(-890, -40, -96, -830, 40, -20, [-300, 416, 192], -90);

      B.light([0, 0, 300], 420, [1, 0.72, 0.55]);
      B.light([0, 0, 90], 300, [1, 0.65, 0.45]);
      B.light([-300, 300, 110], 260, [1, 0.6, 0.4]);
      B.light([300, -300, 110], 260, [1, 0.6, 0.4]);
      B.light([736, 0, 220], 330, [0.9, 0.85, 1]);
      B.box(716, -20, 280, 756, 20, 288, 'lightpanel');
      B.light([-736, 0, 80], 320, [0.8, 0.5, 0.35]);
      B.box(-760, -24, 152, -712, 24, 160, 'lightpanel');
      B.light([476, -416, 250], 200, [0.5, 0.6, 1.2]);
      B.light([-860, 0, -40], 200, [0.5, 0.6, 1.2]);
      for (const [x, y, yaw] of [[-504, -250, 0], [-504, 250, 0], [504, 250, 180], [-250, 440, -90], [250, -440, 90]]) B.torch(x, y, 140, yaw);
      B.torch(-504, 0, 330, 0);
      B.torch(504, 0, 330, 180);

      B.item('item_armor_combat', 0, 0, 12);
      B.item('weapon_lightning', 0, 0, 192);
      B.item('ammo_lightning', -400, 416, 192);
      B.item('weapon_rocketlauncher', 800, 0, 96);
      B.item('ammo_rockets', 700, 150, 96);
      B.item('item_health_large', 800, -150, 96);
      B.item('weapon_shotgun', -736, -200, -96);
      B.item('ammo_shells', -700, 200, -96);
      B.item('weapon_grenadelauncher', -400, -300, 0);
      B.item('ammo_grenades', 400, 300, 0);
      for (let i = 0; i < 4; i++) B.item('item_armor_shard', 480, -250 + i * 150, 96);
      B.item('item_health', 200, -416, 192);
      B.item('item_health', -150, 416, 192);
      B.item('item_health', -440, 300, 0);
      B.item('item_health', 380, -250, 0);
      B.item('ammo_bullets', 0, 300, 0);
      B.item('ammo_rockets', 0, -300, 0);

      B.spawn(-300, 200, 0, -45);
      B.spawn(300, -200, 0, 135);
      B.spawn(800, -60, 96, 180);
      B.spawn(-700, -150, -96, 45);
      B.spawn(-280, 416, 192, 0);
      B.spawn(120, -416, 192, 180);
      B.spawn(-450, 0, 0, 0);
      B.intermission(-440, -300, 240, 30, 14);
    }
  };
})(globalThis.Quake3 = globalThis.Quake3 || {});
