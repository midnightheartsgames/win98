(function (Q) {
  'use strict';
  Q.MAPS = Q.MAPS || {};
  Q.MAPS.q3dm4 = {
    id: 'q3dm4',
    name: 'The Place of Many Deaths',
    sky: { top: [0.3, 0.02, 0.02], horizon: [0.7, 0.15, 0.06], cloud: [0.9, 0.35, 0.15], speed: 0.025 },
    sun: { dir: [0.3, 0.2, -0.93], color: [1, 0.45, 0.3], intensity: 0.4 },
    ambient: [0.09, 0.055, 0.05],
    skyAmbient: [0.3, 0.1, 0.07],
    music: 4,
    levelshot: { pos: [-330, -350, 330], yaw: 45, pitch: 24 },
    build(B) {
      B.box(-832, -768, -32, 832, -384, 0, 'gfloor2');
      B.box(-832, 384, -32, 832, 768, 0, 'gfloor2');
      B.box(-832, -384, -32, -384, 384, 0, 'gfloor2');
      B.box(384, -384, -32, 832, 384, 0, 'gfloor2');
      B.box(-96, -384, -32, 96, 384, 0, 'gfloor');
      B.box(-384, -96, -32, -96, 96, 0, 'gfloor');
      B.box(96, -96, -32, 384, 96, 0, 'gfloor');
      for (const [x0, x1] of [[-384, -320], [320, 384]]) {
        B.box(x0, -384, -32, x1, -96, 0, 'gfloor2');
        B.box(x0, 96, -32, x1, 384, 0, 'gfloor2');
      }
      for (const [y0, y1] of [[-384, -320], [320, 384]]) {
        B.box(-320, y0, -32, -96, y1, 0, 'gfloor2');
        B.box(96, y0, -32, 320, y1, 0, 'gfloor2');
      }
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const x0 = Math.min(96 * sx, 320 * sx), x1 = Math.max(96 * sx, 320 * sx), y0 = Math.min(96 * sy, 320 * sy), y1 = Math.max(96 * sy, 320 * sy);
        B.box(x0, y0, -96, x1, y1, -64, 'gblock');
        B.lava(x0, y0, -64, x1, y1, -14);
      }
      B.carve(-832, -768, 832, 768, [
        [-384, -384, 384, 384],
        [384, -64, 448, 64, 128], [-448, -64, -384, 64, 128], [-64, 384, 64, 448, 128], [-64, -448, 64, -384, 128],
        [-192, 448, 192, 640, 192], [-192, 640, 192, 704],
        [-192, -640, 192, -448, 192], [-192, -704, 192, -640],
        [448, -256, 768, 256], [-768, -256, -448, 256]
      ], 0, 224, 'gwall', { ceil: 'gceil', lintel: 'gskull' });
      B.carve(-832, -768, 832, 768, [
        [-384, -384, 384, 384],
        [384, -48, 448, 48, 352], [-448, -48, -384, 48, 352], [-48, 384, 48, 448, 352], [-48, -448, 48, -384, 352],
        [-192, 448, 192, 704, 400], [-192, -704, 192, -448, 400],
        [448, -256, 768, 256, 416], [-768, -256, -448, 256, 416]
      ], 224, 448, 'gwall', { ceil: 'gceil', lintel: 'gskull' });
      B.box(-384, -384, 448, 384, 384, 464, 'sky');
      B.box(-384, -384, 432, -368, 384, 448, 'gtrim', { noCover: true });
      B.box(368, -384, 432, 384, 384, 448, 'gtrim', { noCover: true });

      B.box(-384, -48, 208, 384, 48, 224, 'gblock', { top: 'gfloor2', bottom: 'gskull' });
      B.box(-48, -384, 208, 48, -48, 224, 'gblock', { top: 'gfloor2', bottom: 'gskull' });
      B.box(-48, 48, 208, 48, 384, 224, 'gblock', { top: 'gfloor2', bottom: 'gskull' });
      for (const [x, y] of [[-200, 0], [200, 0], [0, -200], [0, 200]]) B.box(x - 20, y - 20, 176, x + 20, y + 20, 208, 'gmetal');
      B.cyl(0, 0, 40, 0, 12, 8, 'gblock', { top: 'gtrim' });

      for (const s of [-1, 1]) {
        const xs = s > 0 ? [704, 768] : [-768, -704];
        B.stairs(xs[0], -192, xs[1], 192, 0, 224, 'y+', 14, 'gblock', { top: 'gfloor2' });
        B.box(Math.min(448 * s, 768 * s), 192, 208, Math.max(448 * s, 768 * s), 256, 224, 'gblock', { top: 'gfloor2' });
        B.box(Math.min(448 * s, 528 * s), -48, 208, Math.max(448 * s, 528 * s), 192, 224, 'gblock', { top: 'gfloor2' });
        B.torch(376 * s, 200, 120, s > 0 ? 180 : 0);
        B.torch(376 * s, -200, 120, s > 0 ? 180 : 0);
        B.torch(200, 376 * s, 120, s > 0 ? -90 : 90);
        B.torch(-200, 376 * s, 120, s > 0 ? -90 : 90);
        B.light([608 * s, 0, 150], 280, [1, 0.6, 0.4]);
        B.light([608 * s, 0, 360], 280, [1, 0.55, 0.4]);
        B.torch(760 * s, 0, 330, s > 0 ? 180 : 0);
        B.light([0, 560 * s, 140], 240, [1, 0.55, 0.4]);
        B.light([0, 560 * s, 330], 240, [1, 0.5, 0.35]);
        B.box(-16, 560 * s - 16, 384, 16, 560 * s + 16, 400, 'lightred');
        B.box(-16, 560 * s - 16, 176, 16, 560 * s + 16, 192, 'lightpanel');
      }
      B.light([0, 0, 120], 300, [1, 0.5, 0.3]);
      B.light([0, 0, 300], 260, [1, 0.5, 0.3]);

      B.item('weapon_rocketlauncher', 0, 0, 224);
      B.item('item_quad', 0, 0, 12);
      B.item('item_armor_body', 0, 560, 0);
      B.item('item_armor_combat', 0, -560, 0);
      B.item('weapon_plasmagun', 0, 520, 224);
      B.item('weapon_lightning', 0, -520, 224);
      B.item('ammo_rockets', 120, 540, 224);
      B.item('ammo_cells', -120, 540, 224);
      B.item('ammo_lightning', 120, -540, 224);
      B.item('ammo_rockets', -120, -540, 224);
      B.item('weapon_shotgun', -600, -150, 0);
      B.item('ammo_shells', -600, 150, 0);
      B.item('weapon_grenadelauncher', 600, -150, 0);
      B.item('ammo_grenades', 600, 150, 0);
      for (const [x, y] of [[352, 352], [-352, 352], [352, -352], [-352, -352]]) B.item('item_health', x, y, 0);
      for (const [x, y] of [[-280, 0], [280, 0], [0, -280], [0, 280]]) B.item('item_armor_shard', x, y, 224);
      B.item('item_health_large', 488, 100, 224);
      B.item('item_health_large', -488, -100, 224);
      B.item('item_health', 120, 660, 0);
      B.item('item_health', -120, -660, 0);

      B.spawn(600, -200, 0, 90);
      B.spawn(-600, 200, 0, -90);
      B.spawn(80, 600, 0, -90);
      B.spawn(-80, -600, 0, 90);
      B.spawn(352, 0, 0, 180);
      B.spawn(-352, 0, 0, 0);
      B.spawn(-60, 500, 224, -90);
      B.spawn(60, -500, 224, 90);
      B.intermission(-360, -360, 300, 45, 24);
    }
  };
})(globalThis.Quake3 = globalThis.Quake3 || {});
