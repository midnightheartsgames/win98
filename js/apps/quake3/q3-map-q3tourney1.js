(function (Q) {
  'use strict';
  Q.MAPS = Q.MAPS || {};
  Q.MAPS.q3tourney1 = {
    id: 'q3tourney1',
    name: 'Power Station 0218',
    sky: null,
    sun: null,
    ambient: [0.09, 0.1, 0.12],
    music: 3,
    levelshot: { pos: [-280, -300, 150], yaw: 45, pitch: 8 },
    build(B) {
      B.box(-1024, -1472, -32, 1024, 448, 0, 'techfloor');
      B.carve(-1024, -1472, 1024, 448, [
        [-384, -384, 384, 384],
        [-64, -704, 64, -320, 192],
        [-704, -64, -320, 64, 192],
        [-1024, -256, -704, 256, 256],
        [320, -64, 704, 64, 192],
        [704, -384, 960, 256, 320],
        [832, -1344, 960, -320, 288, 128],
        [704, -1088, 832, -960, 288, 128],
        [-640, -1408, 704, -704]
      ], 0, 352, 'metal', { ceil: 'metal', floor: 'grate', step: 'hazard' });
      B.box(-1024, -1472, 352, 1024, 448, 384, 'metal');

      B.ring(0, 0, 320, 560, 0, 352, 32, 'tech', { gaps: [[-Math.PI / 2, 0.16], [Math.PI, 0.16], [0, 0.16]] });
      B.cyl(0, 0, 112, 0, 352, 16, 'tech');
      for (const z of [48, 176, 304]) B.cyl(0, 0, 118, z, z + 14, 16, 'lightblue');
      B.cyl(0, 0, 150, 0, 24, 16, 'hazard', { top: 'metal' });
      B.light([0, 0, 100], 380, [0.5, 0.7, 1.1]);
      B.light([0, 0, 260], 380, [0.5, 0.7, 1.1]);
      B.light([220, 220, 200], 220, [0.8, 0.85, 1]);
      B.light([-220, -220, 200], 220, [0.8, 0.85, 1]);
      B.light([-220, 220, 200], 220, [0.8, 0.85, 1]);
      B.light([220, -220, 200], 220, [0.8, 0.85, 1]);

      B.box(-64, -520, 0, -36, -504, 192, 'hazard');
      B.box(36, -520, 0, 64, -504, 192, 'hazard');
      B.box(-64, -520, 128, 64, -504, 192, 'hazard');
      B.light([0, -440, 160], 200, [1, 0.75, 0.4]);
      B.light([0, -620, 160], 200, [0.6, 0.75, 1]);
      B.box(-16, -640, 184, 16, -600, 192, 'lightblue');
      B.box(-16, -420, 184, 16, -380, 192, 'lightpanel');

      B.cyl(-864, 0, 44, 0, 256, 8, 'rust');
      B.cyl(-864, 0, 60, 0, 20, 8, 'hazard', { top: 'metal' });
      B.light([-864, 150, 200], 260, [0.9, 0.8, 0.65]);
      B.light([-864, -150, 200], 260, [0.9, 0.8, 0.65]);
      B.box(-1024, -24, 180, -1016, 24, 232, 'lightpanel');
      for (const y of [-200, 200]) B.box(-1016, y - 16, 0, -960, y + 16, 256, 'rust');

      B.light([-512, 0, 160], 200, [0.7, 0.8, 1]);
      B.light([512, 0, 160], 200, [0.7, 0.8, 1]);
      B.box(-528, -16, 184, -496, 16, 192, 'lightblue');
      B.box(496, -16, 184, 528, 16, 192, 'lightblue');
      B.stairs(896, -320, 960, 192, 0, 128, 'y-', 8, 'metal', { top: 'grate' });
      B.light([820, 0, 260], 300, [0.8, 0.85, 1]);
      B.light([900, -600, 250], 220, [1, 0.6, 0.3]);
      B.light([900, -1100, 250], 220, [1, 0.6, 0.3]);
      B.box(944, -620, 270, 960, -580, 280, 'lightred');
      B.box(944, -1120, 270, 960, -1080, 280, 'lightred');

      B.box(-640, -1408, 112, -512, -704, 128, 'metal', { top: 'grate' });
      B.box(576, -1408, 112, 704, -704, 128, 'metal', { top: 'grate' });
      B.stairs(-512, -832, -384, -704, 0, 128, 'x-', 8, 'metal', { top: 'grate' });
      B.cyl(32, -1056, 128, 0, 16, 16, 'hazard', { top: 'metal' });
      B.cyl(32, -1056, 96, 16, 32, 16, 'metal', { top: 'techfloor' });
      B.cyl(32, -1056, 24, 190, 352, 8, 'tech');
      B.cyl(32, -1056, 40, 176, 196, 8, 'lightblue');
      for (const x of [-352, 32, 416]) {
        B.cyl(x, -1400, 18, 0, 352, 8, 'rust');
        B.light([x, -1360, 290], 220, [0.8, 0.85, 1]);
      }
      B.box(-640, -1400, 330, 704, -1384, 346, 'rust');
      B.box(-640, -720, 330, 704, -704, 346, 'rust');
      B.light([32, -1056, 150], 330, [0.6, 0.75, 1.1]);
      B.light([-400, -900, 250], 300, [0.85, 0.9, 1]);
      B.light([450, -900, 250], 300, [0.85, 0.9, 1]);
      B.light([-400, -1250, 90], 240, [1, 0.7, 0.4]);
      B.light([450, -1250, 90], 240, [1, 0.7, 0.4]);
      B.box(-24, -1076, 344, 88, -1036, 352, 'lightpanel');

      B.item('weapon_shotgun', 0, 230, 0);
      B.item('ammo_shells', 0, -230, 0);
      B.item('item_health', 230, 60, 0);
      B.item('item_health', -230, 60, 0);
      B.item('weapon_rocketlauncher', -950, 0, 0);
      B.item('item_health_large', -900, 180, 0);
      B.item('ammo_rockets', -960, -120, 0);
      B.item('item_armor_combat', 0, -600, 0);
      B.item('item_quad', 32, -1056, 32, { alt: 'item_regen' });
      B.item('weapon_plasmagun', 800, 120, 0);
      B.item('ammo_cells', 800, -300, 0);
      B.item('weapon_grenadelauncher', 560, -1330, 0);
      B.item('ammo_grenades', -560, -1330, 0);
      B.item('ammo_rockets', 32, -1330, 0);
      B.item('item_health', -560, -760, 0);
      B.item('item_health', 620, -760, 0);
      for (let i = 0; i < 4; i++) B.item('item_armor_shard', -576, -1320 + i * 150, 128);
      for (let i = 0; i < 4; i++) B.item('item_armor_shard', 640, -1320 + i * 150, 128);
      B.item('item_health', 896, -900, 128);
      B.item('ammo_bullets', -520, 20, 0);

      B.spawn(190, -170, 0, 135);
      B.spawn(-190, 170, 0, -45);
      B.spawn(-864, -180, 0, 90);
      B.spawn(830, -200, 0, 90);
      B.spawn(-300, -1300, 0, 45);
      B.spawn(400, -800, 0, -135);
      B.spawn(896, -700, 128, -90);
      B.spawn(-576, -1095, 128, 90);
      B.intermission(-360, -760, 250, -30, 16);
    }
  };
})(globalThis.Quake3 = globalThis.Quake3 || {});
