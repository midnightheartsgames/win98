(function (Q) {
  'use strict';
  Q.MAPS = Q.MAPS || {};
  Q.MAPS.q3dm5 = {
    id: 'q3dm5',
    name: 'The Forgotten Place',
    sky: { top: [0.16, 0.05, 0.14], horizon: [0.62, 0.22, 0.24], cloud: [0.85, 0.5, 0.45], speed: 0.01 },
    sun: { dir: [0.5, -0.3, -0.81], color: [0.95, 0.55, 0.6], intensity: 0.5 },
    ambient: [0.09, 0.075, 0.085],
    music: 0,
    levelshot: { pos: [-360, -360, 110], yaw: 45, pitch: -6 },
    build(B) {
      B.box(-960, -896, -80, 1152, -384, 0, 'gfloor2');
      B.box(-960, 384, -80, 1152, 896, 0, 'gfloor2');
      B.box(-960, -384, -80, -384, 384, 0, 'gfloor2');
      B.box(384, -384, -80, 640, 384, 0, 'gfloor2');
      B.box(1088, -384, -160, 1152, 384, 0, 'stone');
      B.box(-384, -384, -112, 384, 384, -48, 'gfloor');
      B.box(640, -384, -192, 1088, 384, -128, 'gfloor2');
      B.carve(640, -448, 1152, 448, [[640, -128, 768, 128], [768, -384, 1088, 384]], -128, 0, 'stone');
      B.carve(-960, -896, 1152, 896, [
        [-384, -384, 384, 384],
        [-512, 384, 512, 512, 160], [-512, -512, 512, -384, 160], [384, -384, 512, 384, 160], [-512, -384, -384, 384, 160],
        [-64, 512, 64, 528, 128], [-256, 528, 256, 832],
        [-64, -528, 64, -512, 128], [-256, -832, 256, -528],
        [-528, -224, -512, -160, 128], [-528, 160, -512, 224, 128], [-896, -320, -528, 320],
        [512, -64, 640, 64, 128], [640, -128, 768, 128, 128], [768, -384, 1088, 384, 128]
      ], 0, 176, 'gwall', { ceil: 'gceil', lintel: 'gtrim' });
      B.carve(-960, -896, 1152, 896, [
        [-384, -384, 384, 384],
        [-512, 384, 512, 512],
        [-64, 512, 64, 528, 304], [-256, 528, 256, 832, 352],
        [-256, -832, 256, -528, 256],
        [-896, -320, -528, 320, 240]
      ], 176, 384, 'gwall', { ceil: 'gceil', lintel: 'gtrim' });
      B.box(-384, -384, 384, 384, 384, 400, 'sky');
      B.box(-512, 384, 384, 512, 512, 400, 'sky');
      B.box(-384, -384, 368, -372, 384, 384, 'gtrim', { noCover: true });
      B.box(372, -384, 368, 384, 384, 384, 'gtrim', { noCover: true });

      const bays = [];
      for (let i = 0; i < 6; i++) bays.push({ a: -384 + i * 128 + 14, b: -384 + (i + 1) * 128 - 14, top: 104, arch: 'round' });
      B.wallX(384, 400, -384, 384, 0, 160, 'gblock', bays);
      B.wallX(-400, -384, -384, 384, 0, 160, 'gblock', bays);
      B.wallY(384, 400, -384, 384, 0, 160, 'gblock', bays);
      B.wallY(-400, -384, -384, 384, 0, 160, 'gblock', bays);
      B.stairs(-116, 336, 116, 384, -48, 0, 'y+', 3, 'gblock', { top: 'gfloor2' });
      B.stairs(-116, -384, 116, -336, -48, 0, 'y-', 3, 'gblock', { top: 'gfloor2' });
      B.stairs(336, -116, 384, 116, -48, 0, 'x+', 3, 'gblock', { top: 'gfloor2' });
      B.stairs(-384, -116, -336, 116, -48, 0, 'x-', 3, 'gblock', { top: 'gfloor2' });
      B.box(-384, 380, 160, 384, 400, 176, 'gskull', { top: 'gfloor2' });
      B.jumppad(0, 0, -48, 28, 0, 448, 212);
      for (const [x, y, h] of [[-300, -300, 96], [300, 300, 64], [-300, 300, 128], [300, -300, 40]]) B.cyl(x, y, 26, -48, -48 + h, 8, 'stone');
      B.box(-280, 200, -48, -216, 264, -24, 'stone');
      B.box(220, -250, -48, 262, -200, -30, 'stone');

      B.wallX(512, 528, -256, 256, 176, 352, 'gwall', [{ a: -64, b: 64, top: 304, arch: 'gothic' }]);
      B.box(-256, 528, 160, 256, 592, 176, 'gblock', { top: 'gfloor2' });
      B.stairs(192, 592, 256, 768, 0, 176, 'y-', 11, 'gblock', { top: 'gfloor2' });
      B.box(-96, 760, 0, 96, 832, 24, 'marble');
      B.flame(-80, 800, 24, 0.8);
      B.flame(80, 800, 24, 0.8);
      B.decal('rosewin', 0, 831, 250, 110, { n: [0, -1, 0] });
      B.light([0, 700, 250], 320, [1, 0.75, 0.55]);
      B.light([0, 620, 100], 240, [1, 0.7, 0.5]);

      B.stairs(640, -64, 768, 64, -128, 0, 'x-', 8, 'stone', { top: 'gfloor2' });
      for (const y of [-256, 0, 256]) B.column(928, y, -128, 128, 20, 'stone', 'gblock');
      B.light([928, -150, 60], 300, [1, 0.3, 0.2]);
      B.light([928, 150, 60], 300, [1, 0.3, 0.2]);
      B.light([700, 0, 60], 180, [1, 0.6, 0.4]);
      B.box(1080, -40, 0, 1088, 40, 60, 'lightred');

      B.light([-712, 0, 180], 380, [1, 0.8, 0.6]);
      B.box(-736, -24, 232, -688, 24, 240, 'lightpanel');
      for (const y of [-240, 240]) B.box(-896, y - 40, 0, -872, y + 40, 200, 'wood');
      B.light([0, -680, 200], 300, [0.9, 0.75, 0.6]);
      B.box(-24, -704, 248, 24, -656, 256, 'lightpanel');
      for (const [x, y, yaw] of [[-256, 504, -90], [256, 504, -90], [-256, -504, 90], [256, -504, 90], [504, -200, 180], [504, 200, 180], [-504, -200, 0], [-504, 200, 0]]) B.torch(x, y, 110, yaw);

      B.item('item_armor_body', -200, 448, 176);
      B.item('weapon_lightning', 200, 448, 176);
      B.item('ammo_lightning', 400, 448, 176);
      B.item('weapon_rocketlauncher', 1010, 0, -128);
      B.item('ammo_rockets', 880, 300, -128);
      B.item('item_health_large', 880, -300, -128);
      B.item('weapon_shotgun', -720, 0, 0);
      B.item('ammo_shells', -800, -250, 0);
      B.item('item_armor_combat', 0, -720, 0);
      B.item('item_health', 180, -780, 0);
      B.item('weapon_plasmagun', 0, 720, 0);
      B.item('ammo_cells', -180, 780, 0);
      B.item('item_health_large', 150, 560, 176);
      B.item('weapon_grenadelauncher', 250, -330, -48);
      B.item('ammo_grenades', -330, 250, -48);
      for (const [x, y] of [[448, 448], [-448, 448], [448, -448], [-448, -448]]) B.item('item_health', x, y, 0);
      for (const [x, y] of [[-300, 0], [300, 0], [0, -300], [0, 300]]) B.item('item_armor_shard', x, y, -48);
      B.item('item_armor_shard', -420, 448, 176);
      B.item('item_armor_shard', 0, 470, 176);

      B.spawn(-800, 250, 0, -90);
      B.spawn(-620, -250, 0, 90);
      B.spawn(0, -640, 0, 90);
      B.spawn(-150, 690, 0, -90);
      B.spawn(900, 180, -128, 180);
      B.spawn(448, -300, 0, 135);
      B.spawn(-448, 300, 0, -45);
      B.spawn(-200, -250, -48, 45);
      B.intermission(-300, -330, 200, 50, 16);
    }
  };
})(globalThis.Quake3 = globalThis.Quake3 || {});
