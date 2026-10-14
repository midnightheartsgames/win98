(function (Q) {
  'use strict';
  Q.MAPS = Q.MAPS || {};
  Q.MAPS.q3dm3 = {
    id: 'q3dm3',
    name: 'Arena of Death',
    sky: { top: [0.45, 0.05, 0.03], horizon: [0.95, 0.4, 0.15], cloud: [1, 0.6, 0.35], speed: 0.015 },
    sun: { dir: [-0.4, 0.45, -0.8], color: [1, 0.6, 0.42], intensity: 0.55 },
    ambient: [0.12, 0.08, 0.07],
    music: 2,
    levelshot: { pos: [-760, -560, 330], yaw: 36, pitch: 22 },
    build(B) {
      const C = Q.CONTENTS;
      B.skyShell(-1216, -1216, -128, 1216, 1216, 960);
      B.cyl(0, 0, 176, -80, 0, 24, 'gfloor', { rot: 0 });
      B.ring(0, 0, 224, 384, -80, 0, 24, 'gfloor');
      B.ring(0, 0, 176, 224, -112, -48, 24, 'gfloor');
      B.ring(0, 0, 176, 224, -48, -10, 24, 'lava', { contents: C.LAVA, side: 'nodraw', bottom: 'nodraw' });
      for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        const c = Math.cos(a), s = Math.sin(a);
        if (Math.abs(c) > 0.5) B.box(Math.min(c * 168, c * 232), -32, -16, Math.max(c * 168, c * 232), 32, 0, 'gblock', { top: 'gfloor2' });
        else B.box(-32, Math.min(s * 168, s * 232), -16, 32, Math.max(s * 168, s * 232), 0, 'gblock', { top: 'gfloor2' });
      }
      for (let k = 0; k < 4; k++) {
        const a = Math.PI / 4 + k * Math.PI / 2;
        B.light([Math.cos(a) * 200, Math.sin(a) * 200, 6], 150, [1, 0.45, 0.15], { bright: 1.1 });
      }
      B.cyl(0, 0, 72, 0, 16, 8, 'gblock', { top: 'gtrim' });
      B.decal('emblem', 0, 0, 16.5, 120);

      B.ring(0, 0, 384, 896, -80, 96, 48, 'gblock', { top: 'gfloor', a0: -Q.TAU / 96 });
      B.stairs(-48, 288, 48, 388, 0, 96, 'y+', 6, 'gblock', { top: 'gfloor2' });
      B.stairs(-48, -388, 48, -288, 0, 96, 'y-', 6, 'gblock', { top: 'gfloor2' });
      B.stairs(288, -48, 388, 48, 0, 96, 'x+', 6, 'gblock', { top: 'gfloor2' });
      B.stairs(-388, -48, -288, 48, 0, 96, 'x-', 6, 'gblock', { top: 'gfloor2' });
      B.ring(0, 0, 380, 390, 96, 104, 48, 'gskull', { a0: -Q.TAU / 96, gaps: [[0, 0.1], [Math.PI / 2, 0.1], [Math.PI, 0.1], [-Math.PI / 2, 0.1]] });

      B.ring(0, 0, 896, 960, 96, 448, 48, 'gwall', { a0: -Q.TAU / 96, gaps: [[0, 0.05], [Math.PI / 2, 0.05], [Math.PI, 0.05], [-Math.PI / 2, 0.05]] });
      B.ring(0, 0, 880, 896, 400, 416, 48, 'gtrim', { a0: -Q.TAU / 96 });
      B.ring(0, 0, 896, 960, 448, 960, 48, 'clip', { a0: -Q.TAU / 96, clip: true });
      B.hurt(-1216, -1216, -128, 1216, 1216, -100, 1000);
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2, c = Math.round(Math.cos(a)), s = Math.round(Math.sin(a));
        const alc = (x0, y0, x1, y1) => {
          B.box(Math.min(x0, x1), Math.min(y0, y1), -80, Math.max(x0, x1), Math.max(y0, y1), 96, 'gblock', { top: 'gfloor2' });
          B.box(Math.min(x0, x1), Math.min(y0, y1), 256, Math.max(x0, x1), Math.max(y0, y1), 288, 'gceil');
        };
        if (c) {
          alc(c * 880, -80, c * 1104, 80);
          B.box(Math.min(c * 1104, c * 1168), -144, 96, Math.max(c * 1104, c * 1168), 144, 288, 'gwall');
          B.box(Math.min(c * 900, c * 1104), -144, 96, Math.max(c * 900, c * 1104), -80, 288, 'gwall');
          B.box(Math.min(c * 900, c * 1104), 80, 96, Math.max(c * 900, c * 1104), 144, 288, 'gwall');
          B.light([c * 1040, 0, 220], 220, [1, 0.7, 0.5]);
          B.box(c * 1096 - 8, -24, 200, c * 1096 + 8, 24, 216, 'lightpanel');
        } else {
          alc(-80, s * 880, 80, s * 1104);
          B.box(-144, Math.min(s * 1104, s * 1168), 96, 144, Math.max(s * 1104, s * 1168), 288, 'gwall');
          B.box(-144, Math.min(s * 900, s * 1104), 96, -80, Math.max(s * 900, s * 1104), 288, 'gwall');
          B.box(80, Math.min(s * 900, s * 1104), 96, 144, Math.max(s * 900, s * 1104), 288, 'gwall');
          B.light([0, s * 1040, 220], 220, [1, 0.7, 0.5]);
          B.box(-24, s * 1096 - 8, 200, 24, s * 1096 + 8, 216, 'lightpanel');
        }
        for (const d of [-1, 1]) {
          const aa = a + d * 0.16;
          B.column(Math.cos(aa) * 850, Math.sin(aa) * 850, 96, 400, 18, 'gcol', 'gblock');
        }
      }

      const towers = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
      for (const [sx, sy] of towers) {
        const cx = 512 * sx, cy = 512 * sy;
        B.box(cx - 96, cy - 96, 96, cx + 96, cy + 96, 224, 'gwall', { top: 'gfloor2' });
        B.box(cx - 100, cy - 100, 216, cx + 100, cy + 100, 224, 'gtrim', { top: 'gfloor2' });
        if (sx > 0) B.stairs(cx - 224, cy - 32 * sy - 32, cx - 96, cy - 32 * sy + 32, 96, 224, 'x+', 8, 'gblock', { top: 'gfloor2' });
        else B.stairs(cx + 96, cy - 32 * sy - 32, cx + 224, cy - 32 * sy + 32, 96, 224, 'x-', 8, 'gblock', { top: 'gfloor2' });
        B.box(cx + 60 * sx - 12, cy + 60 * sy - 12, 224, cx + 60 * sx + 12, cy + 60 * sy + 12, 300, 'gmetal');
        B.flame(cx + 60 * sx, cy + 60 * sy, 302, 1.1);
      }
      B.jumppad(190, 190, 0, 24, 500, 500, 264);
      B.jumppad(-190, -190, 0, 24, -500, -500, 264);
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Q.TAU + Q.TAU / 16;
        B.torch(Math.cos(a) * 890, Math.sin(a) * 890, 250, i / 8 * 360 + 22.5 + 180);
      }

      B.item('weapon_rocketlauncher', 0, 0, 16, { alt: 'weapon_plasmagun' });
      B.item('weapon_shotgun', -1020, 0, 96);
      B.item('weapon_grenadelauncher', -500, -500, 224);
      B.item('item_armor_body', 500, 500, 224);
      B.item('item_health_large', -500, 500, 224);
      B.item('item_health_large', 500, -500, 224);
      B.item('item_health', 0, 250, 0);
      B.item('item_health', 0, -250, 0);
      B.item('item_health', 250, 0, 0);
      B.item('item_health', -250, 0, 0);
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Q.TAU + Q.TAU / 16;
        B.item('item_armor_shard', Math.cos(a) * 640, Math.sin(a) * 640, 96);
      }
      B.item('ammo_rockets', 40, 1060, 96);
      B.item('ammo_cells', 1020, 0, 96);
      B.item('ammo_grenades', 0, -1020, 96);
      B.item('ammo_shells', -960, -30, 96);
      B.item('ammo_bullets', 330, -330, 96);
      B.item('ammo_bullets', -330, 330, 96);

      B.spawn(0, 560, 96, -90);
      B.spawn(0, -560, 96, 90);
      B.spawn(560, 0, 96, 180);
      B.spawn(-560, 0, 96, 0);
      B.spawn(-40, 980, 96, -90);
      B.spawn(1040, 60, 96, 180);
      B.spawn(250, -120, 0, 150);
      B.spawn(-250, 120, 0, -30);
      B.intermission(-700, -700, 360, 45, 22);
    }
  };
})(globalThis.Quake3 = globalThis.Quake3 || {});
