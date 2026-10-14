(function (M) {
  'use strict';
  M.SETS = M.SETS || {};

  M.SETS.roof = {
    world: { ambient: [0.08, 0.09, 0.12], fog: { color: [0.06, 0.07, 0.09], near: 30, far: 120 }, sky: 'night', weather: 'blizzard', moon: { dir: M.norm([0.3, -0.8, 0.4]), color: [0.12, 0.13, 0.17] } },
    build(B) {
      B.box(-30, -40, -30, 30, 0, 30, { top: 'roof_tar', side: 'facade_dark' });
      B.zone(-40, -2, -40, 40, 40, 40, { outdoor: true, amb: [0.1, 0.11, 0.15] });
      for (const [x0, z0, x1, z1] of [[-30, -30, 30, -29.7], [-30, 29.7, 30, 30], [-30, -30, -29.7, 30], [29.7, -30, 30, 30]]) B.box(x0, 0, z0, x1, 1.1, z1, 'concrete');
      B.box(-6, 0, -6, 6, 0.08, 6, { top: 'concrete_dark', side: 'metal' });
      B.decal(0, 0.09, 0, 'py', 8, 8, 'sign:H', { alpha: 0.6 });
      B.box(14, 0, 10, 22, 4, 18, { side: 'metal_plate', top: 'roof_tar' });
      B.box(-24, 0, -22, -18, 3, -12, { side: 'metal', top: 'roof_tar' });
      B.pillar(-22, 20, 0.4, 0, 14, 'metal');
      B.light(-22, 14.2, 20, [1, 0.1, 0.1], 10, { i: 1.4 });
      B.light(0, 6, -26, [0.3, 0.4, 1.2], 26, { i: 1.4 });
      B.light(10, 6, -26, [1.2, 0.2, 0.2], 22, { i: 1.3 });
      B.light(0, 3, 0, [0.8, 0.85, 1], 18, { i: 0.6 });
    }
  };

  M.SETS.apartment = {
    world: { ambient: [0.05, 0.05, 0.06], fog: { color: [0.02, 0.02, 0.025], near: 20, far: 60 }, sky: 'none', weather: 'none' },
    build(B) {
      B.plan({ y: 0, h: 2.8, outer: 'brick', rooms: [{ id: 'apt', x0: 0, z0: 0, x1: 7, z1: 6, floor: 'wood_floor', wall: 'wallpaper_green', ceil: 'plaster' }], windows: [{ x: 3.5, z: 0, w: 2, y0: 0.9, y1: 2.3, glass: false }] });
      B.decal(3.5, 1.6, -0.2, 'pz', 2, 1.4, 'window_night', { emissive: true });
      B.decor('table', 3.5, 0, 2.4, 0.1);
      B.decor('armchair', 1.5, 0, 3.2, 1.2);
      B.decor('sofa', 5.8, 0, 4.4, -Math.PI / 2, { mat: 'fabric_brown' });
      B.decor('shelf', 0.3, 0, 5, Math.PI / 2, { scale: 0.9 });
      B.decor('tvstand', 6.6, 0, 1.2, -Math.PI / 2);
      B.light(3.2, 1.2, 2.2, [1, 0.72, 0.42], 5, { i: 1.1 });
      B.light(3.5, 2.2, -0.5, [0.4, 0.5, 0.8], 5, { i: 0.7 });
      B.decal(0.12, 1.6, 2.5, 'px', 0.6, 0.45, 'photo');
      B.decal(3.5, 0.79, 2.3, 'py', 0.3, 0.4, 'newspaper');
    },
    props: [{ kind: 'phone', pos: [3.9, 0.78, 2.2], yaw: 0 }]
  };

  M.SETS.dea = {
    world: { ambient: [0.07, 0.07, 0.08], fog: { color: [0.03, 0.03, 0.035], near: 20, far: 60 }, sky: 'none', weather: 'none' },
    build(B) {
      B.plan({ y: 0, h: 3, outer: 'concrete', rooms: [{ id: 'off', x0: 0, z0: 0, x1: 10, z1: 8, floor: 'carpet_blue', wall: 'plaster', ceil: 'ceiling_panel' }] });
      B.decor('desk', 5, 0, 5.6, Math.PI);
      B.decor('chair', 5, 0, 6.6, Math.PI);
      B.decor('desk', 2, 0, 2, 0.2);
      B.decor('lockers', 9.6, 0, 4, -Math.PI / 2);
      B.decor('coatrack', 0.6, 0, 7.2, 0);
      B.decal(5, 1.8, 7.88, 'nz', 2.4, 0.5, 'sign:УБН · НЬЮ-ЙОРК');
      B.decal(0.12, 1.6, 4, 'px', 1.4, 1.1, 'poster_subway');
      B.decal(7, 1.6, 7.88, 'nz', 1.2, 1.2, 'clock');
      B.light(5, 2.8, 4, [0.95, 1, 1], 9);
      B.light(5, 1.2, 5.5, [1, 0.85, 0.6], 4, { i: 0.8 });
    }
  };

  M.SETS.street = {
    world: { ambient: [0.08, 0.08, 0.1], fog: { color: [0.05, 0.055, 0.07], near: 16, far: 70 }, sky: 'night', weather: 'blizzard', moon: { dir: M.norm([0.3, -0.85, 0.3]), color: [0.09, 0.1, 0.13] } },
    build(B) {
      B.ground(-40, -40, 40, 40, 0, 'asphalt_snow');
      B.box(-40, 0, -8, 40, 0.15, -6, 'sidewalk');
      B.box(-40, 0, 6, 40, 0.15, 8, 'sidewalk');
      B.zone(-40, -2, -40, 40, 40, 40, { outdoor: true, amb: [0.1, 0.1, 0.13] });
      B.box(-40, 0, -20, 40, 18, -8, { side: 'facade_brick', top: 'roof_tar' });
      B.box(-40, 0, 8, 40, 14, 20, { side: 'facade_brown', top: 'roof_tar' });
      for (const x of [-20, 0, 20]) { B.decor('streetlight', x, 0, -6.5, 0); B.light(x, 4.5, -5.5, [1, 0.72, 0.45], 14, { i: 1.1 }); }
      B.decor('car', -8, 0, -3.5, Math.PI / 2, { color: '#2a2a3a' });
      B.decor('cruiser', 10, 0, 3.4, -Math.PI / 2);
      B.light(10, 1.8, 3.4, [1, 0.2, 0.2], 8, { i: 1.2 });
      B.light(8, 1.8, 3.4, [0.2, 0.3, 1], 8, { i: 1.2 });
      B.decor('hydrant', 4, 0, -6.8, 0);
      B.decor('phonebooth', -14, 0, -7.2, 0);
    }
  };

  M.SETS.stationSet = {
    world: { ambient: [0.07, 0.075, 0.07], fog: { color: [0.02, 0.025, 0.025], near: 16, far: 60 }, sky: 'none', weather: 'none' },
    build(B) {
      B.plan({ y: 0, h: 5, outer: 'concrete', rooms: [{ id: 'hall', x0: 0, z0: 0, x1: 24, z1: 16, floor: 'tile_floor', wall: 'tile_station', ceil: 'ceiling_panel' }] });
      for (let x = 4; x <= 20; x += 8) B.box(x - 0.2, 0, 7.8, x + 0.2, 5, 8.2, 'column_green');
      B.decor('booth', 18, 0, 4, 0);
      B.decor('turnstile', 8, 0, 12, 0); B.decor('turnstile', 9.5, 0, 12, 0);
      B.decal(12, 3, 15.88, 'nz', 4, 0.9, 'roscoe');
      B.box(2, 3, 0, 22, 3.2, 3, 'metal');
      B.light(6, 4.6, 8, [0.8, 0.95, 0.9], 12, { i: 1.1 }); B.light(18, 4.6, 8, [0.8, 0.95, 0.9], 12, { i: 1.1 });
      B.decal(12, 0.01, 9, 'py', 2, 2, 'blood1');
    }
  };
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
