(function (Q) {
  'use strict';
  Q.MAPS = Q.MAPS || {};
  Q.MAPS.q3dm2 = {
    id: 'q3dm2',
    name: 'House of Pain',
    sky: { top: [0.35, 0.03, 0.03], horizon: [0.75, 0.2, 0.1], cloud: [0.95, 0.4, 0.25], speed: 0.02 },
    sun: null,
    ambient: [0.1, 0.06, 0.055],
    skyAmbient: [0.25, 0.1, 0.08],
    music: 1,
    levelshot: { pos: [-470, -340, 250], yaw: 38, pitch: 18 },
    build(B) {
      B.box(-576, -448, -32, 976, 768, 0, 'gfloor2');
      B.carve(-576, -448, 976, 768, [
        [-512, -384, 128, 192],
        [128, -320, 560, -192, 128],
        [544, -384, 832, 512],
        [64, 448, 560, 576, 128],
        [-512, 256, 64, 640],
        [-256, 192, -128, 256, 128],
        [832, -384, 912, 0]
      ], 0, 144, 'gbrick', { ceil: 'gceil', lintel: 'gskull' });
      B.carve(-576, -448, 976, 768, [
        [-512, -384, 192, 192, 320],
        [464, -384, 912, 704],
        [192, 0, 480, 128, 272],
        [-512, 256, 64, 704, 336],
        [64, 576, 480, 704, 272]
      ], 144, 352, 'gbrick', { ceil: 'gceil', lintel: 'gskull' });
      B.box(464, -384, 352, 912, 704, 368, 'sky');

      B.box(124, -320, 128, 192, 192, 144, 'gskull', { top: 'gfloor2' });
      B.box(-384, 636, 128, 64, 656, 144, 'gskull', { top: 'gfloor2' });
      B.box(464, -384, 128, 548, 512, 144, 'gskull', { top: 'gfloor2' });
      B.box(828, 0, 128, 912, 512, 144, 'gskull', { top: 'gfloor2' });
      B.box(544, 508, 128, 832, 528, 144, 'gskull', { top: 'gfloor2' });

      B.stairs(-64, -384, 128, -320, 0, 144, 'x+', 9, 'gblock', { top: 'gfloor2' });
      B.stairs(-512, 320, -384, 640, 0, 144, 'y+', 9, 'gblock', { top: 'gfloor2' });
      B.stairs(832, -320, 912, 0, 0, 144, 'y+', 9, 'gblock', { top: 'gfloor2' });

      B.cyl(-192, -96, 64, 0, 16, 8, 'gblock', { top: 'gtrim' });
      B.jumppad(-8, 120, 0, 24, 160, 150, 176);
      B.column(-384, -256, 0, 320, 20, 'gcol', 'gblock');
      B.column(-384, 64, 0, 320, 20, 'gcol', 'gblock');
      B.column(0, -256, 0, 320, 20, 'gcol', 'gblock');

      for (const y of [-224, 32, 288]) {
        B.column(608, y, 0, 336, 22, 'gcol', 'gblock');
        B.column(768, y, 0, 336, 22, 'gcol', 'gblock');
      }
      B.stairs(608, 400, 704, 432, 0, 12, 'y+', 1, 'gblock', { top: 'gfloor2' });
      B.box(592, 432, 0, 720, 512, 24, 'gblock', { top: 'gtrim' });
      B.box(544, 508, 24, 832, 512, 128, 'flesh', { noCover: true });
      B.decal('demon', 688, 507.5, 76, 100, { n: [0, -1, 0] });
      B.flame(600, 492, 24, 0.9);
      B.flame(776, 492, 24, 0.9);
      B.light([688, 300, 300], 360, [1, 0.35, 0.25]);
      B.light([688, -200, 300], 320, [1, 0.45, 0.3]);
      B.light([688, 620, 250], 260, [1, 0.3, 0.2]);
      B.box(672, 688, 144, 704, 704, 260, 'flesh', { noCover: true });

      B.torch(-504, -96, 200, 0);
      B.torch(120, -96, 200, 180);
      B.torch(-200, -376, 200, 90);
      B.light([-192, -96, 250], 320, [1, 0.62, 0.42]);
      B.light([-192, 120, 120], 220, [1, 0.5, 0.35]);
      B.light([320, -256, 110], 200, [1, 0.55, 0.4]);
      B.light([320, 64, 250], 200, [1, 0.55, 0.4]);
      B.light([300, 512, 110], 200, [1, 0.55, 0.4]);
      B.light([280, 640, 250], 200, [1, 0.55, 0.4]);
      B.box(300, 56, 256, 340, 72, 272, 'lightpanel');
      B.box(260, 632, 256, 300, 648, 272, 'lightpanel');
      B.light([-224, 480, 280], 330, [0.9, 0.45, 0.35]);
      B.torch(56, 450, 90, 180);
      B.torch(-504, 672, 230, 0);
      B.light([-400, 300, 90], 180, [1, 0.55, 0.4]);

      B.item('weapon_plasmagun', -192, -96, 16);
      B.item('ammo_cells', -480, -352, 0);
      B.item('ammo_cells', 96, 160, 0);
      B.item('item_health', -480, 160, 0);
      B.item('item_health', 96, -280, 0);
      B.item('weapon_rocketlauncher', 656, 470, 24);
      B.item('ammo_rockets', 640, -300, 0);
      B.item('ammo_bullets', 578, -150, 0);
      B.item('ammo_bullets', 800, 200, 0);
      B.item('item_armor_combat', 160, 150, 144);
      B.item('item_armor_body', -200, 672, 144);
      B.item('item_haste', 700, 640, 144);
      B.item('weapon_shotgun', -224, 460, 0);
      B.item('ammo_shells', 20, 300, 0);
      B.item('item_health_large', -440, 614, 144);
      B.item('item_health_large', 16, 290, 0);
      for (let i = 0; i < 4; i++) B.item('item_armor_shard', 240 + i * 64, 64, 144);
      for (let i = 0; i < 3; i++) B.item('item_armor_shard', 180 + i * 80, 640, 144);
      B.item('item_health', 320, -256, 0);
      B.item('item_health', 300, 512, 0);
      B.item('item_health', 872, 400, 144);
      B.item('item_health', 504, 300, 144);

      B.spawn(-440, -320, 0, 45);
      B.spawn(40, 100, 0, -135);
      B.spawn(700, -330, 0, 90);
      B.spawn(656, 200, 0, -90);
      B.spawn(-100, 600, 0, -90);
      B.spawn(-300, 672, 144, -45);
      B.spawn(872, 200, 144, -90);
      B.spawn(336, 110, 144, 180);
      B.spawn(440, 600, 144, 180);
      B.intermission(-420, -300, 230, 40, 20);
    }
  };
})(globalThis.Quake3 = globalThis.Quake3 || {});
