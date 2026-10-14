(function (S) {
  'use strict';
  const { T } = S.DATA;
  const PI = Math.PI;

  const ENV = {
    dusk: { sky: [0.42, 0.44, 0.58], horizon: [0.92, 0.62, 0.42], fog: [0.62, 0.5, 0.44], fogDensity: 0.0085, sun: [-0.7, 0.28, -0.3], sunColor: [1.25, 0.82, 0.55], ambient: [0.42, 0.4, 0.46], clouds: 0.55, night: 0.15, grass: 0.9, grassCol: [0.42, 0.48, 0.24], dirtCol: [0.46, 0.4, 0.3] },
    night: { sky: [0.03, 0.04, 0.09], horizon: [0.1, 0.12, 0.2], fog: [0.07, 0.08, 0.13], fogDensity: 0.012, sun: [0.3, 0.6, -0.4], sunColor: [0.22, 0.26, 0.4], ambient: [0.25, 0.27, 0.36], clouds: 0.5, night: 1, grass: 0.5, grassCol: [0.36, 0.42, 0.26], dirtCol: [0.4, 0.36, 0.3] },
    snow: { sky: [0.58, 0.62, 0.68], horizon: [0.8, 0.82, 0.85], fog: [0.76, 0.78, 0.82], fogDensity: 0.0105, sun: [0.4, 0.5, -0.6], sunColor: [0.85, 0.87, 0.92], ambient: [0.58, 0.6, 0.66], clouds: 0.95, night: 0, grass: 0, grassCol: [0.9, 0.92, 0.95], dirtCol: [0.72, 0.72, 0.74], snow: 1 },
    winter: { sky: [0.5, 0.55, 0.62], horizon: [0.74, 0.76, 0.78], fog: [0.68, 0.7, 0.74], fogDensity: 0.0095, sun: [-0.4, 0.55, 0.5], sunColor: [0.9, 0.9, 0.88], ambient: [0.52, 0.54, 0.6], clouds: 0.9, night: 0, grass: 0.15, grassCol: [0.82, 0.84, 0.86], dirtCol: [0.52, 0.48, 0.42], snow: 0.35 },
    evening: { sky: [0.3, 0.3, 0.42], horizon: [0.72, 0.48, 0.36], fog: [0.46, 0.38, 0.36], fogDensity: 0.009, sun: [0.6, 0.22, 0.5], sunColor: [1.15, 0.7, 0.45], ambient: [0.36, 0.34, 0.4], clouds: 0.7, night: 0.35, grass: 0.3, grassCol: [0.4, 0.44, 0.26], dirtCol: [0.42, 0.38, 0.32] }
  };

  function house(b, x0, z0, x1, z1, side, o = {}) {
    const w = side === 's' || side === 'n' ? x1 - x0 : z1 - z0, t = 0.3;
    const at = o.at != null ? o.at : (side === 's' || side === 'n' ? w / 2 - 0.9 : w / 2 - 0.9 - t);
    const r = b.building(x0, z0, x1, z1, Object.assign({ h: 3, tex: 'plaster', roof: 'gable', roofTex: 'rooftile', doors: [{ side, at, w: 1.8 }] }, o));
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    if (o.furnish !== false) {
      b.prop('table', cx + 0.6, cz + 0.4, { y: r.y, w: 0.7, d: 0.45 }); b.prop('chair', cx - 0.3, cz + 0.4, { y: r.y, rot: 1.4 });
      b.prop(o.shelf === false ? 'stove' : 'shelf', x0 + 0.9, z1 - 0.9, { y: r.y, rot: PI });
    }
    if (o.lamp !== false) b.lamp(cx, r.y + r.h - 0.1, cz, { r: 7 });
    return r;
  }
  const sq = (b, pts, kind) => b.fence(pts, kind);
  function mgNest(b, x, z, yaw, o = {}) { b.prop('mgnest', x, z, { rot: yaw }); b.npc('mg', x + Math.sin(yaw) * 0.4, z + Math.cos(yaw) * 0.4, Object.assign({ yaw, beh: 'mg' }, o)); b.solid(x + Math.sin(yaw) * 1.4, z + Math.cos(yaw) * 1.4, 1.2, 1.2, b.h(x, z) - 0.2, b.h(x, z) + 0.9, yaw, 0.7); }
  function ring(b, cx, cz, r, n, gapA, kind = 'sandbag') {
    const pts = [];
    for (let i = 0; i <= n; i++) { const a = gapA + 0.5 + (i / n) * (PI * 2 - 1); pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); }
    b.fence(pts, kind);
  }

  const LEVELS = {};

  LEVELS.retriever = () => {
    const b = new S.Builder({ id: 'retriever', bounds: [-110, -130, 110, 130], env: ENV.dusk, terrain: { seed: 11, amp: 2.5, scale: 60 } });
    b.flat(-60, -75, 60, 100, 1, 10); b.clearArea(-92, -126, -76, -110);
    b.road([[0, -130], [0, -40], [1, 0], [1, 60], [-2, 130]], 7, 'cobble', { y: 1 });
    b.road([[-110, -58], [-40, -52], [-4, -45]], 4, 'dirt');
    b.hill(-80, 60, 35, 6); b.hill(85, -20, 40, 5); b.hill(80, 90, 30, 7);
    const hall = b.building(-38, 6, -14, 30, { h: 3.2, floors: 2, tex: 'stone', roofTex: 'slate', roof: 'gable', doors: [{ side: 'e', at: 9, w: 1.8 }], stairs: [-17.3, 19, -14.6, 29.4, 'n'], floorTex: 'tiles' });
    const y = hall.y;
    b.wall('z', 6.3, 29.7, -31, 0.25, y, 3.2, 'plaster', [{ a: 2.5, b: 4.3, door: { tex: 'bars' } }, { a: 8.5, b: 10.3, door: { tex: 'bars', locked: 'key', id: 'cellB' } }, { a: 16, b: 17.8, door: { tex: 'bars', locked: 'key' } }]);
    b.wall('x', -37.7, -31.1, 14, 0.25, y, 3.2, 'plaster'); b.wall('x', -37.7, -31.1, 21, 0.25, y, 3.2, 'plaster');
    b.prop('bed', -36.5, 10, { y }); b.prop('bed', -36.5, 17.5, { y }); b.prop('bed', -36.5, 25, { y });
    b.prop('desk', -22, 12, { y, rot: PI }); b.prop('chair', -22, 13, { y }); b.prop('locker', -29.5, 28.8, { y, rot: PI }); b.prop('mapboard', -24, 29.6, { y, rot: PI });
    b.lamp(-24, y + 3, 16, { r: 9 }); b.lamp(-34, y + 3, 17.5, { r: 5 });
    b.prop('desk', -30, 24, { y: y + 3.2 }); b.prop('chair', -30, 23, { y: y + 3.2, rot: PI }); b.prop('shelf', -36.9, 18, { y: y + 3.2, rot: PI / 2 }); b.prop('banner', -26, 29.6, { y: y + 3.4, rot: PI, h: 2.2 });
    b.lamp(-26, y + 6.2, 18, { r: 10 });
    b.npc('smg', -20, 15, { yaw: -PI / 2 }); b.npc('rifleman', -26, 9, { yaw: 0 });
    b.npc('ss', -24, 24, { y: y + 3.2, yaw: PI / 2 });
    b.npc('commandant', -30, 22.5, { y: y + 3.2, yaw: PI / 2, id: 'kommandant', drops: ['key'] });
    b.npc('agent', -34.5, 17.5, { id: 'agent', beh: 'prisoner', yaw: PI / 2 });
    b.pickup('canteen', -35, 9); b.pickup('ammo_a45', -35, 26); b.pickup('medkit', -34, 23);
    b.alarm(-14.2, y + 2.6, 22);
    const ch = b.building(16, 8, 34, 40, { h: 7, tex: 'stone', roofTex: 'slate', roofH: 5, ridge: 'z', doors: [{ side: 'w', at: 14.5, w: 2.4 }], floorTex: 'tiles', noWin: ['n'] });
    b.prop('bell', 25, 44, { h: 16 }); b.box(22.6, 41.6, 27.4, 46.4, ch.y, ch.y + 16.4, 'stone', { render: false });
    for (let i = 0; i < 5; i++) { b.prop('bench', 22, 14 + i * 3.4, { y: ch.y, rot: PI / 2 }); b.prop('bench', 28, 14 + i * 3.4, { y: ch.y, rot: PI / 2 }); }
    b.lamp(25, ch.y + 6.5, 20, { r: 10 }); b.lamp(25, ch.y + 6.5, 32, { r: 10 });
    b.npc('rifleman', 20, 28, { yaw: -PI / 2 }); b.npc('grenadier', 30, 36, { yaw: PI });
    b.pickup('surgeon', 25, 38.5);
    house(b, -12, 50, 0, 60, 's', { tex: 'plaster', at: 5 });
    b.target('radio1', 'radio', -6, 57.5, { hp: 60 });
    b.prop('antenna', -3, 55, { y: b.h(-6, 55) + 5.3 });
    b.npc('rifleman', -8, 53, { yaw: 0 });
    const houses = [[-30, -40, -16, -28, 'e'], [10, -45, 22, -33, 'w'], [-30, -20, -18, -8, 'e'], [10, -22, 24, -10, 'w'], [-28, 40, -16, 52, 'e'], [14, 52, 28, 64, 'w'], [-24, 68, -10, 80, 'e'], [10, 72, 24, 84, 'w'], [-44, -12, -34, 0, 'e'], [36, 44, 48, 56, 'w']];
    houses.forEach((h, i) => house(b, h[0], h[1], h[2], h[3], h[4], { tex: i % 3 === 0 ? 'stone' : 'plaster', roofTex: i % 2 ? 'slate' : 'rooftile', floors: i === 2 || i === 5 ? 2 : 1, stairs: i === 2 || i === 5 ? null : null, windows: true }));
    b.npc('rifleman', -24, -14, { yaw: PI / 2 }); b.npc('smg', 17, -16, { yaw: -PI / 2 }); b.npc('rifleman', 16, -39, { yaw: -PI / 2 });
    b.npc('smg', -22, 46, { yaw: PI / 2 }); b.npc('rifleman', 21, 58, { yaw: -PI / 2 }); b.npc('grenadier', -17, 74, { yaw: PI / 2 });
    b.pickup('ammo_a45', -22, -34); b.pickup('canteen', 16, -28); b.pickup('medkit', 17, 78); b.pickup('ammo_grenade', -39, -6);
    b.prop('well', -6, 26); b.box(-6.9, 25.1, -5.1, 26.9, 1, 1.9, 'stone', { render: false });
    b.prop('cart', 8, 30, { rot: 0.4 }); b.solid(8, 30, 0.9, 1.4, 1, 2, 0.4);
    b.prop('streetlamp', -8, 4); b.prop('streetlamp', 10, 4); b.prop('streetlamp', -8, 44); b.prop('streetlamp', 8, 44);
    b.light(-8, 5, 4, 10, [1.2, 1.0, 0.7], { lamp: true }); b.light(10, 5, 4, 10, [1.2, 1.0, 0.7], { lamp: true }); b.light(-8, 5, 44, 10, [1.2, 1.0, 0.7], { lamp: true }); b.light(8, 5, 44, 10, [1.2, 1.0, 0.7], { lamp: true });
    b.prop('banner', -13.8, 18, { rot: PI / 2, y: 1 + 3.4, h: 2.4 });
    b.npc('rifleman', -4, 14, { yaw: PI }); b.npc('smg', 6, 20, { yaw: -2.4 }); b.npc('officer', 0, 30, { yaw: PI });
    b.npc('smg', 0, -30, { beh: 'patrol', path: 'street' }); b.path('street', [[1, -30], [1, 40], [-2, 64], [1, 40]]);
    sq(b, [[-8, -70], [-3.5, -70]], 'sandbag'); sq(b, [[3.5, -70], [9, -70]], 'sandbag');
    mgNest(b, 7, -73, PI);
    b.npc('rifleman', -5, -67, { yaw: PI }); b.npc('smg', 2, -66, { yaw: PI }); b.vehicle('kubel', -9, -76, 0.2);
    b.npc('rifleman', -40, -90, { beh: 'patrol', path: 'fields' }); b.path('fields', [[-40, -90], [-10, -95], [-10, -80], [-40, -78]]);
    b.dog(30, -80, { beh: 'patrol', path: 'dogrun' }); b.path('dogrun', [[30, -80], [30, -50], [45, -50], [45, -80]]);
    b.npc('rifleman', 32, -78, { beh: 'patrol', path: 'dogrun' });
    b.pickup('medkit', -12, -104); b.pickup('ammo_a45', 18, -100);
    b.fence([[-60, -60], [-34, -60], [-34, -46]], 'stone'); b.fence([[34, -60], [60, -60]], 'stone'); b.fence([[-60, 90], [-30, 90]], 'stone'); b.fence([[30, 20], [30, 5], [50, 5]], 'stone');
    for (let i = 0; i < 9; i++) b.tree(-60 + i * 9, -97, 'bush', 1.2);
    for (let i = 0; i < 7; i++) b.tree(12 + i * 10, -97, 'bush', 1.1);
    b.forest(-105, -128, -30, -100, 28, ['oak', 'oak', 'bush']); b.forest(20, -128, 105, -100, 24, ['oak', 'bush']);
    b.forest(-108, -60, -65, 125, 40, ['oak', 'pine', 'bush']); b.forest(65, -90, 108, 125, 40, ['oak', 'pine', 'bush']);
    b.forest(-60, 95, 60, 128, 20, ['oak', 'bush'], { gap: 3 });
    sq(b, [[-9, 97], [-4.5, 97]], 'sandbag'); sq(b, [[4.5, 97], [9, 97]], 'sandbag');
    b.npc('rifleman', -6, 100, { yaw: PI }); b.npc('smg', 6, 101, { yaw: PI }); b.npc('grenadier', 0, 106, { yaw: PI }); b.dog(-8, 104, { yaw: PI });
    b.vehicle('truck', -9, 116, 0.05, { col: 0x3a4a3a }); b.zone('truck', -14, 108, 14, 126);
    b.npc('ss', -4, 12, { hidden: true, group: 'reinf', yaw: PI }); b.npc('ss', 4, 12, { hidden: true, group: 'reinf', yaw: PI }); b.npc('smg', -20, 40, { hidden: true, group: 'reinf', yaw: PI }); b.npc('assault', 14, 44, { hidden: true, group: 'reinf', yaw: PI });
    b.spawn('start', -85, -118, 0.35);
    b.sign(3.8, 2.2, -64, 0, 'KONTROLLPUNKT');
    return b.build();
  };

  LEVELS.uboat = () => {
    const b = new S.Builder({ id: 'uboat', bounds: [-90, -110, 90, 90], env: ENV.night, terrain: { seed: 21, amp: 0.3, scale: 40 } });
    b.flat(-90, -62, 90, 90, 0, 1); b.flat(-90, -110, 90, -63, -4, 0.8); b.flat(-12, -63, 12, 38, -4, 0.6);
    b.water(-90, -110, 90, -62, -2.2); b.water(-12, -62, 12, 38, -2.2);
    b.box(-90, -63, -12, -62, -4.5, 0.05, 'quay'); b.box(12, -63, 90, -62, -4.5, 0.05, 'quay');
    b.box(-12.6, -63, -12, 38.5, -4.5, 0.05, 'quay'); b.box(12, -63, 12.6, 38.5, -4.5, 0.05, 'quay'); b.box(-12.6, 38, 12.6, 38.6, -4.5, 0.05, 'quay');
    b.box(-90, -62.2, -12.6, -62.05, 0.05, 1.05, 'metal', { thin: true }); b.box(12.6, -62.2, 90, -62.05, 0.05, 1.05, 'metal', { thin: true });
    b.box(-12.8, -62, -12.65, 38, 0.05, 1.05, 'metal', { thin: true }); b.box(12.65, -62, 12.8, 38, 0.05, 1.05, 'metal', { thin: true }); b.box(-12.8, 38.4, 12.8, 38.55, 0.05, 1.05, 'metal', { thin: true });
    for (let x = -80; x <= 80; x += 16) if (Math.abs(x) > 14) b.prop('bollard', x, -63.4);
    b.wall('z', -60, 40, -40.75, 1.5, 0, 14, 'concrete', [{ a: 18, b: 19.8, door: { tex: 'metaldoor' } }]);
    b.wall('z', -60, 40, 40.75, 1.5, 0, 14, 'concrete', [{ a: 9, b: 10.8, door: { tex: 'metaldoor' } }]);
    b.wall('x', -41.5, 41.5, 40.75, 1.5, 0, 14, 'concrete');
    b.box(-41.5, -60.75, -12.6, -59.25, 0, 14, 'concrete'); b.box(12.6, -60.75, 41.5, -59.25, 0, 14, 'concrete'); b.box(-12.6, -60.75, 12.6, -59.25, 8, 14, 'concrete');
    b.box(-41.5, -60.75, 41.5, 41.5, 14, 16.5, 'concrete', { top: 'concrete' });
    b.box(-40, -59.25, -12.6, 40, -0.3, 0.02, 'concrete'); b.box(12.6, -59.25, 40, 40, -0.3, 0.02, 'concrete'); b.box(-12.6, 38.6, 12.6, 40, -0.3, 0.02, 'concrete');
    for (let z = -50; z <= 30; z += 20) for (const x of [-26, 26]) b.lamp(x, 12, z, { r: 18, c: [1.1, 1.05, 0.85] });
    for (let z = -45; z <= 30; z += 25) b.lamp(0, 13, z, { r: 16, c: [1.0, 1.0, 0.9] });
    b.target('uboat', 'uboat', 0, -6, { y: -2.6, hp: 1, charges: 2 });
    b.plant('p1', -13.6, -14, { target: 'uboat', y: 0 }); b.plant('p2', 13.6, 6, { target: 'uboat', y: 0 });
    b.prop('crane', -20, -30, { h: 12, rot: PI / 2 }); b.solid(-20, -30, 0.6, 0.6, 0, 12);
    b.prop('crane', 20, 20, { h: 12, rot: -PI / 2 }); b.solid(20, 20, 0.6, 0.6, 0, 12);
    for (let i = 0; i < 4; i++) { b.prop('torpedo', -32, -40 + i * 3, { rot: 0 }); b.solid(-32, -40 + i * 3, 0.3, 3.5, 0, 0.8); }
    b.prop('crates', 30, -8); b.solid(30.4, -7.9, 1, 0.8, 0, 1.7); b.prop('crates', 24, 0, { rot: 1 }); b.solid(24.4, 0.3, 1, 1, 0, 1.7);
    b.prop('barrels', -28, 10); b.solid(-27.7, 10.3, 1.1, 1.1, 0, 1); b.prop('barrels', 33, 30); b.solid(33.3, 30.3, 1.1, 1.1, 0, 1);
    b.prop('crate', -18, -50); b.solid(-18, -50, 0.5, 0.5, 0, 0.9); b.prop('crate', 18, -48); b.solid(18, -48, 0.5, 0.5, 0, 0.9);
    b.prop('pipes', 38.5, -10, { len: 40, py: 6 });
    b.wall('x', -40, -28, 20, 0.3, 0, 3.2, 'plaster', [{ a: 4.75, b: 6.55, door: { tex: 'door' } }, { a: 8.25, b: 9.75, y0: 1, y1: 2.1, win: true }]);
    b.wall('z', 20.15, 40, -28, 0.3, 0, 3.2, 'plaster', [{ a: 6, b: 8, y0: 1, y1: 2.1, win: true }]);
    b.box(-40, 20, -27.85, 40, 3.2, 3.5, 'concrete');
    b.prop('desk', -35, 32, { rot: PI }); b.prop('chair', -35, 33, {}); b.prop('shelf', -38.9, 26, { rot: PI / 2 }); b.prop('mapboard', -33, 39.2, { rot: PI }); b.prop('bed', -31, 36, { rot: PI / 2 });
    b.pickup('codebook', -35.2, 31.8, { y: 0.82 });
    b.lamp(-33, 3.1, 30, { r: 7 });
    b.npc('officer', -32, 27, { yaw: PI, id: 'kapitan' });
    b.wall('x', 28, 40, -16, 0.3, 0, 3.2, 'plaster', [{ a: 2, b: 3.8, door: { tex: 'door' } }]);
    b.wall('z', -33.85, -16.15, 28, 0.3, 0, 3.2, 'plaster', [{ a: 6, b: 8, y0: 1, y1: 2.1, win: true }]);
    b.box(27.85, -34.15, 40, -15.85, 3.2, 3.5, 'concrete'); b.wall('x', 28, 40, -34, 0.3, 0, 3.2, 'plaster');
    b.prop('lockerrow', 30, -32.5, { n: 5 }); b.prop('table', 34, -25, { papers: true }); b.lamp(33, 3.1, -25, { r: 7 });
    b.pickup('surgeon', 36, -30); b.pickup('ammo_a9', 30, -20); b.pickup('charges', 32, -28);
    b.npc('sailor', -24, -44, { yaw: 1 }); b.npc('sailor', -18, -10, { beh: 'patrol', path: 'wdock' }); b.path('wdock', [[-18, -50], [-18, 34], [-34, 34], [-34, -50]]);
    b.npc('sailor', 18, -30, { beh: 'patrol', path: 'edock' }); b.path('edock', [[18, -52], [18, 34], [34, 34], [34, -24]]);
    b.npc('ss', -30, 0, { yaw: -PI / 2 }); b.npc('ss', 30, 12, { yaw: PI / 2 }); b.npc('sailor', 16, -2, { yaw: -PI / 2 }); b.npc('sailor', -16, 20, { yaw: PI / 2 });
    b.npc('rifleman', 34, -38, { yaw: PI }); b.npc('smg', -20, 36, { yaw: PI });
    b.npc('sniper', 0, 39.3, { yaw: PI, y: 0, beh: 'sniper' });
    b.alarm(-40, 3, -10); b.alarm(40, 3, 10);
    b.building(-85, -45, -55, -20, { h: 6, tex: 'brick', roof: 'gable', roofTex: 'slate', doors: [{ side: 'e', at: 10, w: 2.4 }], floorTex: 'concrete' });
    b.prop('crates', -80, -40); b.solid(-79.6, -39.9, 1, 0.8, 0, 1.7); b.prop('crates', -60, -24, { rot: 0.5 }); b.solid(-59.6, -23.7, 1, 1, 0, 1.7); b.lamp(-70, 5.8, -32, { r: 12 });
    b.pickup('medkit', -76, -28); b.npc('rifleman', -70, -36, { yaw: 0.5 });
    b.building(-85, 0, -55, 30, { h: 7, tex: 'brick', roof: 'gable', roofTex: 'slate', doors: [{ side: 'e', at: 13, w: 3 }], floorTex: 'concrete' });
    b.prop('truck', -70, 15, { rot: 0 }); b.solid(-70, 15, 1.2, 3.4, 0, 2.6); b.lamp(-70, 6.8, 5, { r: 12 }); b.npc('smg', -62, 8, { yaw: PI / 2 });
    b.rail([[-50, -90], [-50, 90]]);
    b.vehicle('wagon', -50, 50, 0, { col: 0x4a3a2a }); b.vehicle('wagon', -50, 64, 0, { col: 0x5a3020});
    b.prop('crane', -35, -64, { h: 14, rot: PI }); b.solid(-35, -64, 0.6, 0.6, 0, 14);
    b.prop('crane', 55, -64, { h: 14, rot: PI }); b.solid(55, -64, 0.6, 0.6, 0, 14);
    for (const [x, z] of [[-60, -58], [-20, -66], [20, -66], [60, -58], [-60, 36], [60, 36]]) b.prop('lamppost', x, z);
    for (const [x, z] of [[-60, -58], [60, -58], [-60, 36], [60, 36]]) b.light(x, 3.4, z, 12, [1.1, 1.0, 0.75], { lamp: true });
    b.light(-20, 3.4, -66, 10, [1.1, 1.0, 0.75], { lamp: true }); b.light(20, 3.4, -66, 10, [1.1, 1.0, 0.75], { lamp: true });
    mgNest(b, -47, -40, -PI / 2);
    b.npc('rifleman', -46, -47, { yaw: -PI / 2 }); b.dog(-60, -50, { beh: 'patrol', path: 'quay' }); b.path('quay', [[-80, -55], [-30, -55], [-30, -45], [-80, -48]]);
    b.npc('sailor', -40, -55, { beh: 'patrol', path: 'quay' });
    b.building(55, -45, 85, -15, { h: 6, tex: 'brick', roof: 'gable', roofTex: 'slate', doors: [{ side: 'w', at: 12, w: 2.4 }], floorTex: 'concrete' });
    b.npc('sailor', 66, -30, { yaw: -PI / 2 }); b.npc('smg', 50, -50, { yaw: PI / 2 }); b.npc('rifleman', 70, -56, { yaw: 0 }); b.dog(62, -52, { yaw: PI });
    b.pickup('ammo_a45', 70, -40); b.pickup('canteen', 60, -20);
    b.prop('searchlight', 45, 45); b.prop('searchlight', -45, 45); b.light(45, 1.5, 45, 10, [1.3, 1.25, 1.1], { lamp: true });
    b.zone('boat', 64, -62, 88, -52);
    b.sign(76, 1.8, -52.5, PI, 'BOOTSSTEG');
    b.npc('ss', 0, -30, { hidden: true, group: 'reinf', yaw: 0 }); b.npc('ss', -24, 30, { hidden: true, group: 'reinf', yaw: PI }); b.npc('ss', 24, -50, { hidden: true, group: 'reinf', yaw: 0 }); b.npc('sailor', 48, -40, { hidden: true, group: 'reinf', yaw: -PI / 2 });
    b.spawn('start', -75, -10, PI / 2);
    return b.build();
  };

  LEVELS.rjukan = () => {
    const b = new S.Builder({ id: 'rjukan', bounds: [-120, -130, 120, 130], env: ENV.snow, terrain: { seed: 31, amp: 3.5, scale: 60, rough: 0.6 } });
    b.hill(-130, -40, 70, 26, { rx: 60, rz: 110 }); b.hill(130, 20, 70, 30, { rx: 60, rz: 120 }); b.hill(0, 150, 80, 22);
    b.ravine([[-130, 10], [0, 12], [130, 16]], 10, -9, 7);
    b.flat(-10, -16, 10, -3, 1, 4); b.flat(-10, 26, 10, 36, 1, 4); b.flat(-42, 48, 42, 112, 2, 8); b.flat(-40, -60, 30, -20, 1, 8);
    b.flat(-118, 22, -80, 42, 0.5, 6); b.flat(-80, 22, -40, 40, 1, 6);
    b.road([[0, -130], [0, -4]], 6, 'snow'); b.road([[0, 26], [0, 58]], 6, 'snow');
    b.box(-3.2, -4, 3.2, 27, 0.7, 1.05, 'planks', { top: 'planks', walk: true });
    b.box(-3.4, -4, -3.2, 27, 1.05, 2.1, 'metal', { thin: true }); b.box(3.2, -4, 3.4, 27, 1.05, 2.1, 'metal', { thin: true });
    for (const z of [2, 11, 20]) { b.box(-3, z - 0.4, -2.2, z + 0.4, -9, 0.7, 'stone'); b.box(2.2, z - 0.4, 3, z + 0.4, -9, 0.7, 'stone'); }
    b.prop('hedgehog', -6, -10); b.prop('hedgehog', 6, -10);
    b.building(-12, -18, -5, -12, { h: 2.6, tex: 'planks', roofTex: 'snowroof', doors: [{ side: 'e', at: 2, w: 1.8 }] });
    b.lamp(-8.5, 1 + 2.5, -15, { r: 6 });
    b.npc('officer', 3, -12, { beh: 'inspector', yaw: PI }); b.npc('rifleman', -4, -8, { yaw: PI }); b.npc('rifleman', 5, -6, { yaw: PI });
    b.alarm(-5.2, 3, -15);
    const bar = [[-38, -56, -18, -44], [-38, -38, -18, -26], [-8, -56, 12, -44]];
    bar.forEach((r, i) => { b.building(r[0], r[1], r[2], r[3], { h: 3, tex: 'planks', roofTex: 'snowroof', doors: [{ side: i === 2 ? 'w' : 'e', at: 4.7, w: 1.8 }] }); for (let k = 0; k < 3; k++) b.prop('bed', r[0] + 2 + k * 3, r[3] - 1.4, { y: 1, bunk: true, rot: PI / 2 }); b.lamp((r[0] + r[2]) / 2, 3.8, (r[1] + r[3]) / 2, { r: 8 }); });
    b.npc('rifleman', -28, -32, { yaw: PI / 2, beh: 'guard' }); b.npc('smg', -28, -50, { beh: 'guard', yaw: 0 }); b.npc('rifleman', 2, -48, { yaw: -1 });
    b.npc('smg', -14, -40, { beh: 'patrol', path: 'camp' }); b.path('camp', [[-14, -60], [-14, -22], [16, -22], [16, -60]]);
    b.pickup('medkit', -34, -54); b.pickup('ammo_a22', -34, -30); b.pickup('canteen', 8, -54);
    b.fire(-24, -22);
    b.dog(20, -35, { beh: 'patrol', path: 'dogs' }); b.path('dogs', [[20, -40], [40, -40], [40, -10], [20, -10]]);
    const pl = b.building(-30, 60, 30, 100, { h: 4.5, floors: 2, tex: 'brick', roof: 'flat', roofTex: 'snowroof', doors: [{ side: 's', at: 28.2, w: 3.6 }, { side: 'w', at: 26, w: 1.8 }, { side: 'e', at: 8, w: 1.8 }], stairs: [26, 88, 29.4, 99.4, 'n'], floorTex: 'tiles' });
    const py = pl.y;
    b.wall('x', -29.7, 25.7, 76, 0.3, py, 4.5, 'plaster', [{ a: 8, b: 9.8, door: { tex: 'door' } }, { a: 28, b: 31.6, door: { tex: 'door', id: 'hall' } }, { a: 46, b: 47.8, door: { tex: 'door' } }]);
    b.wall('z', 76.15, 99.7, -12, 0.3, py, 4.5, 'plaster', [{ a: 3, b: 4.8, door: { tex: 'door' } }]);
    b.target('cells', 'cells', 4, 88, { y: py, hp: 1, charges: 3 });
    b.solid(4, 88, 4.7, 0.7, py, py + 2.8);
    b.plant('c1', 0, 86.3, { target: 'cells', y: py }); b.plant('c2', 8, 86.3, { target: 'cells', y: py }); b.plant('c3', 4, 89.8, { target: 'cells', y: py });
    for (const x of [-4, 12]) b.lamp(x, py + 4.4, 88, { r: 11, c: [0.95, 1.05, 1.1] });
    b.prop('pipes', 4, 98.5, { len: 30, py: 3.4, rot: PI / 2 });
    b.npc('worker', 0, 82, { beh: 'wander', leash: 7 }); b.npc('worker', 10, 93, { beh: 'wander', leash: 7 }); b.npc('rifleman', -8, 94, { yaw: PI / 2 }); b.npc('officer', 18, 82, { beh: 'inspector', yaw: -PI / 2 });
    b.prop('desk', -22, 90, { y: py, rot: PI / 2 }); b.prop('shelf', -29.4, 84, { y: py, rot: PI / 2 }); b.prop('locker', -20, 99.3, { y: py, rot: PI }); b.lamp(-21, py + 4.4, 88, { r: 9 });
    b.npc('worker', -20, 86, { beh: 'wander', leash: 5 }); b.pickup('surgeon', -26, 97, { y: py }); b.pickup('ammo_a22', -24, 80, { y: py });
    b.lamp(-10, py + 4.4, 68, { r: 10 }); b.lamp(12, py + 4.4, 68, { r: 10 });
    b.npc('rifleman', -18, 70, { beh: 'patrol', path: 'corr' }); b.path('corr', [[-26, 68], [26, 68]]);
    b.npc('smg', 22, 64, { yaw: 0 });
    b.prop('desk', 0, 92, { y: py + 4.5 }); b.prop('mapboard', -6, 99.5, { y: py + 4.5, rot: PI }); b.lamp(0, py + 8.9, 88, { r: 12 });
    b.npc('ss', 4, 90, { y: py + 4.5, yaw: PI }); b.npc('officer', -10, 80, { y: py + 4.5, beh: 'inspector' }); b.npc('rifleman', 16, 72, { y: py + 4.5, yaw: PI / 2 });
    b.pickup('medkit', -20, 70, { y: py + 4.5 }); b.pickup('ammo_grenade', 20, 94, { y: py + 4.5 });
    b.alarm(-30.2, py + 3, 80); b.alarm(0, py + 3, 59.8);
    b.npc('rifleman', -8, 56, { yaw: PI }); b.npc('rifleman', 8, 56, { yaw: PI }); b.npc('smg', 0, 40, { beh: 'patrol', path: 'bridgeN' }); b.path('bridgeN', [[0, 30], [0, 54], [-30, 54], [30, 54]]);
    b.prop('tower', 36, 50, { h: 5 }); b.box(34.3, 48.3, 37.7, 51.7, 2, 7.08, 'planks', { render: false }); b.npc('sniper', 36, 50, { y: 7.1, beh: 'sniper', yaw: PI });
    b.prop('searchlight', -36, 52); b.light(-36, 3.2, 52, 8, [1.2, 1.2, 1.1], { lamp: true });
    b.vehicle('truck', 20, 46, 1.5, { col: 0x5a5a4a }); b.vehicle('kubel', -24, 44, -1.2);
    b.building(-78, 24, -64, 36, { h: 3, tex: 'planks', roofTex: 'snowroof', doors: [{ side: 's', at: 6, w: 1.8 }] });
    b.npc('rifleman', -70, 20, { yaw: PI / 2 }); b.dog(-60, 30, { yaw: -PI / 2 });
    b.zone('escape', -118, 20, -98, 44);
    b.forest(-118, -128, -45, -70, 50, ['snowpine', 'snowpine', 'dead']); b.forest(30, -128, 118, -70, 50, ['snowpine', 'snowpine']);
    b.forest(50, -60, 118, 5, 40, ['snowpine']); b.forest(-118, -60, -50, 0, 35, ['snowpine']); b.forest(-100, 50, -46, 125, 40, ['snowpine']); b.forest(46, 26, 118, 125, 45, ['snowpine']);
    b.npc('ss', -6, 60, { hidden: true, group: 'reinf', yaw: 0 }); b.npc('ss', 6, 60, { hidden: true, group: 'reinf', yaw: 0 }); b.npc('assault', -20, -30, { hidden: true, group: 'reinf' }); b.npc('assault', -30, -20, { hidden: true, group: 'reinf' }); b.npc('ss', -60, 34, { hidden: true, group: 'reinf' });
    b.spawn('start', 0, -118, 0);
    b.sign(6, 2.4, -14, PI, 'VEMORK 2 KM');
    return b.build();
  };

  LEVELS.forest = () => {
    const b = new S.Builder({ id: 'forest', bounds: [-150, -150, 150, 150], env: ENV.winter, terrain: { seed: 41, amp: 5, scale: 80, rough: 0.8 } });
    const road = [[-10, -150], [-20, -60], [10, 0], [0, 70], [20, 150]];
    b.road(road, 6, 'snow'); b.road([[-20, -60], [-80, -48]], 5, 'snow'); b.road([[10, 0], [70, -20]], 5, 'snow'); b.road([[0, 70], [-50, 80]], 5, 'snow'); b.road([[0, 70], [40, 90]], 5, 'snow');
    b.flat(-92, -52, -68, -28, null, 6); b.flat(58, -32, 82, -8, null, 6); b.flat(-62, 68, -38, 92, null, 6); b.flat(24, 82, 56, 110, null, 6);
    const f = [['flak1', -80, -40], ['flak2', 70, -20], ['flak3', -50, 80]];
    f.forEach(([id, x, z], i) => {
      ring(b, x, z, 8, 10, i === 0 ? 0.3 : i === 1 ? PI : -0.4);
      b.target(id, 'flak88', x, z, { rot: i * 1.3, hp: 380, explosive: true });
      b.solid(x, z, 1.2, 1.2, b.h(x, z), b.h(x, z) + 2);
      b.plant(id + 'c', x + 2.2, z - 2.2, { target: id });
      b.prop('crates', x - 5, z + 3); b.solid(x - 4.6, z + 3.1, 1, 0.8, b.h(x - 5, z + 3), b.h(x - 5, z + 3) + 1.7);
      b.npc('rifleman', x + 3, z + 3, { yaw: i }); b.npc(i === 1 ? 'assault' : 'smg', x - 3, z - 2, { yaw: i + 2 }); b.npc('grenadier', x + 5, z - 4, { yaw: i + 4 });
    });
    b.tank(12, 34, PI, { id: 'tiger', path: 'tankroad' }); b.path('tankroad', [[12, 34], [0, 70], [-4, 100], [0, 70]]);
    const bk = b.building(28, 88, 50, 104, { h: 3.2, tex: 'concrete', roof: 'flat', roofTex: 'snowroof', doors: [{ side: 's', at: 10, w: 1.8, door: { tex: 'metaldoor' } }], windows: false, floorTex: 'concrete' });
    b.prop('desk', 44, 99, { y: bk.y, rot: PI }); b.prop('mapboard', 36, 103.6, { y: bk.y, rot: PI }); b.prop('radio', 46, 100, { y: bk.y + 0.8 }); b.lamp(39, bk.y + 3.1, 96, { r: 10 });
    b.pickup('maps', 44.2, 98.8, { y: bk.y + 0.8 }); b.alarm(39, bk.y + 2.6, 88.1); b.npc('officer', 40, 98, { yaw: PI }); b.npc('ss', 32, 92, { yaw: PI / 2 });
    b.pickup('surgeon', 30, 102, { y: bk.y });
    b.fence([[18, 80], [26, 76], [34, 80], [42, 76], [52, 80]], 'sandbag');
    b.npc('smg', 26, 78, { yaw: PI }); b.npc('rifleman', 42, 78, { yaw: PI }); mgNest(b, 34, 82, PI);
    b.fence([[-30, -10], [-22, -14], [-14, -10], [-6, -14]], 'sandbag'); b.npc('rifleman', -20, -8, { yaw: PI }); b.npc('smg', -10, -8, { yaw: PI });
    b.fence([[20, 40], [28, 44], [36, 40]], 'sandbag'); b.npc('rifleman', 28, 46, { yaw: PI }); b.npc('grenadier', 22, 46, { yaw: PI });
    b.prop('tower', -30, 30, { h: 6 }); b.box(-31.7, 28.3, -28.3, 31.7, b.h(-30, 30) - 0.3, b.h(-30, 30) + 6.08, 'planks', { render: false }); b.npc('sniper', -30, 30, { y: b.h(-30, 30) + 6.1, beh: 'sniper', yaw: PI });
    b.prop('tower', 60, 50, { h: 6 }); b.box(58.3, 48.3, 61.7, 51.7, b.h(60, 50) - 0.3, b.h(60, 50) + 6.08, 'planks', { render: false }); b.npc('sniper', 60, 50, { y: b.h(60, 50) + 6.1, beh: 'sniper', yaw: -2.5 });
    b.npc('rocket', -6, 50, { yaw: PI }); b.npc('rocket', 30, -8, { yaw: -2 });
    b.npc('smg', -18, -80, { beh: 'patrol', path: 'p1' }); b.path('p1', [[-18, -100], [-22, -60], [-50, -50]]); b.npc('rifleman', -16, -84, { beh: 'patrol', path: 'p1' });
    b.dog(40, -60, { beh: 'patrol', path: 'd1' }); b.path('d1', [[40, -60], [60, -40], [20, -30]]); b.npc('rifleman', 42, -62, { beh: 'patrol', path: 'd1' });
    b.vehicle('halftrack', -14, 60, 0.3); b.vehicle('truck', 36, 70, 1.9, { col: 0x5a5a48 }); b.vehicle('wreck', -26, -30, 0.8);
    b.building(-110, 100, -96, 112, { h: 2.8, tex: 'logs', roofTex: 'snowroof', doors: [{ side: 'e', at: 5, w: 1.8 }] }); b.pickup('medkit', -104, 106); b.pickup('ammo_rocket', -100, 108);
    b.pickup('ammo_rocket', -60, -60); b.pickup('ammo_a45', 20, -60); b.pickup('medkit', 60, 10); b.pickup('ammo_grenade', -40, 40); b.pickup('canteen', 10, 110); b.pickup('ammo_rocket', 50, 60);
    b.fire(-6, -120); b.prop('tent', -2, -128, { rot: 0.3 }); b.solid(-2, -128, 2, 3, b.h(-2, -128), b.h(-2, -128) + 2, 0.3);
    b.zone('exit', 0, 134, 40, 150);
    b.forest(-148, -148, 148, 148, 620, ['snowpine', 'snowpine', 'pine', 'dead', 'bush'], { gap: 2.2 });
    b.npc('ss', 0, 80, { hidden: true, group: 'reinf', yaw: PI }); b.npc('ss', 10, 84, { hidden: true, group: 'reinf', yaw: PI }); b.npc('assault', -40, 60, { hidden: true, group: 'reinf' });
    b.spawn('start', -10, -140, 0);
    return b.build();
  };

  LEVELS.colditz = () => {
    const b = new S.Builder({ id: 'colditz', bounds: [-100, -100, 100, 100], env: ENV.night, terrain: { seed: 51, amp: 2.5, scale: 50 } });
    b.hill(0, 10, 120, 8); b.flat(-50, -40, 50, 55, 8, 22);
    b.road([[-70, -30], [-60, -60], [-30, -80], [-3, -60], [0, -42]], 5, 'dirt');
    const Y = 8, H = 8;
    b.wall('x', -46, 46, -35, 1.4, Y, H, 'castle', [{ a: 43, b: 49, door: { tex: 'gate', locked: 'never', id: 'gate' }, y1: 5 }]);
    b.wall('x', -46, 46, 51, 1.4, Y, H, 'castle');
    b.wall('z', -34.3, 50.3, -45.3, 1.4, Y, H, 'castle', [{ a: 10, b: 11.8, door: { tex: 'door', id: 'postern' } }]);
    b.wall('z', -34.3, 50.3, 45.3, 1.4, Y, H, 'castle');
    for (const [x, z] of [[-45, -35], [45, -35], [-45, 51], [45, 51]]) b.box(x - 3, z - 3, x + 3, z + 3, Y - 1, Y + H + 4, 'castle');
    const nw = b.building(-44.6, 36, 44.6, 50.3, { h: 4.2, tex: 'castle', roof: 'gable', roofTex: 'slate', doors: [{ side: 's', at: 20, w: 1.8 }, { side: 's', at: 67, w: 1.8 }], floorTex: 'stone', noWin: ['n'] });
    b.wall('x', -44.3, 44.3, 42, 0.3, Y, 4.2, 'stone', [{ a: 14, b: 15.8, door: { tex: 'bars', locked: 'cellkey' } }, { a: 34, b: 35.8, door: { tex: 'bars', locked: 'cellkey' } }, { a: 53, b: 54.8, door: { tex: 'bars', locked: 'cellkey' } }, { a: 73, b: 74.8, door: { tex: 'bars', locked: 'cellkey' } }]);
    for (const x of [-22, 0, 22]) b.wall('z', 42.15, 50, x, 0.3, Y, 4.2, 'stone');
    [-35, -13, 9, 31].forEach((x, i) => { b.npc('pow', x + 3, 46.5, { id: 'pow' + (i + 1), beh: 'prisoner', yaw: PI }); b.prop('bed', x - 4, 48, { y: Y, rot: PI / 2 }); b.lamp(x + 3, Y + 4, 46, { r: 5 }); });
    b.lamp(-20, Y + 4, 39, { r: 9 }); b.lamp(20, Y + 4, 39, { r: 9 });
    b.npc('rifleman', -10, 39, { beh: 'patrol', path: 'cellblock' }); b.path('cellblock', [[-40, 39], [40, 39]]); b.npc('smg', 30, 39, { yaw: -PI / 2 });
    const ww = b.building(-44.6, -10, -30, 30, { h: 3.5, floors: 2, tex: 'castle', roof: 'flat', roofTex: 'slate', doors: [{ side: 'e', at: 18, w: 1.8 }], stairs: [-33.4, 16, -30.4, 29.4, 'n'], floorTex: 'planks', noWin: ['w'] });
    b.prop('table', -39, 6, { y: Y, w: 1.2, papers: true }); b.prop('chair', -39, 5, { y: Y }); b.prop('chair', -39, 7, { y: Y, rot: PI }); b.prop('lockerrow', -43.8, -8, { y: Y, rot: PI / 2, n: 4 }); b.prop('stove', -43.8, 20, { y: Y, rot: PI / 2 });
    b.pickup('cellkey', -38.6, 6.1, { y: Y + 0.82 }); b.lamp(-38, Y + 3.4, 6, { r: 8 });
    b.npc('rifleman', -40, 0, { yaw: PI / 2 }); b.npc('smg', -36, 12, { yaw: PI }); b.npc('officer', -40, 16, { y: Y + 3.5, yaw: PI });
    for (let i = 0; i < 4; i++) b.prop('bed', -42.8, -6 + i * 6, { y: Y + 3.5, bunk: true, rot: PI / 2 });
    b.pickup('medkit', -34, -6, { y: Y + 3.5 }); b.lamp(-37, Y + 6.9, 6, { r: 9 });
    void ww;
    const ew = b.building(30, -30, 44.6, 30, { h: 3.5, floors: 2, tex: 'castle', roof: 'flat', roofTex: 'slate', doors: [{ side: 'w', at: 28, w: 1.8 }], stairs: [30.4, -28, 33.4, -15, 'n'], floorTex: 'planks', noWin: ['e'] });
    void ew;
    b.wall('x', 30.3, 44.3, 8, 0.3, Y + 3.5, 3.5, 'plaster', [{ a: 2, b: 3.8, door: { tex: 'door' } }]);
    b.prop('desk', 38, 20, { y: Y + 3.5, rot: PI }); b.prop('chair', 38, 21, { y: Y + 3.5 }); b.prop('shelf', 44, 14, { y: Y + 3.5, rot: -PI / 2 }); b.prop('banner', 37, 29.6, { y: Y + 4, rot: PI, h: 2.4 }); b.prop('mapboard', 44.2, 22, { y: Y + 3.5, rot: -PI / 2 });
    b.pickup('plans', 38.2, 19.8, { y: Y + 4.3 }); b.lamp(37, Y + 6.9, 18, { r: 9 });
    b.npc('commandant', 36, 16, { y: Y + 3.5, yaw: PI, id: 'kommandant' }); b.npc('ss', 34, 24, { y: Y + 3.5, yaw: -PI / 2 });
    b.npc('ss', 40, -8, { y: Y + 3.5, yaw: PI }); b.pickup('ammo_a45', 42, -20, { y: Y + 3.5 });
    b.npc('rifleman', 38, 0, { yaw: -PI / 2 }); b.npc('smg', 36, -22, { yaw: 0 }); b.prop('desk', 40, -4, { y: Y, rot: PI }); b.lamp(38, Y + 3.4, -4, { r: 8 }); b.pickup('canteen', 42, -26, { y: Y });
    b.alarm(-29.8, Y + 2.6, 0); b.alarm(29.8, Y + 2.6, 0);
    b.prop('well', 0, 0, { y: Y }); b.box(-0.9, -0.9, 0.9, 0.9, Y, Y + 0.9, 'stone', { render: false });
    b.vehicle('car', 10, -20, 0.4, { y: Y }); b.vehicle('truck', -12, -24, -0.3, { y: Y, col: 0x4a4a3a });
    for (const [x, z] of [[-20, -30], [20, -30], [-20, 30], [20, 30]]) { b.prop('lamppost', x, z, { y: Y }); b.light(x, Y + 3.5, z, 11, [1.15, 1.0, 0.75], { lamp: true }); }
    b.npc('smg', 0, -20, { beh: 'patrol', path: 'yard' }); b.path('yard', [[-20, -25], [20, -25], [20, 25], [-20, 25]]);
    b.dog(10, 10, { beh: 'patrol', path: 'yard2' }); b.path('yard2', [[20, 20], [-20, 20], [-20, -20], [20, -20]]); b.dog(-10, -10, { beh: 'patrol', path: 'yard2' });
    b.npc('rifleman', -6, -31, { yaw: PI }); b.npc('rifleman', 6, -31, { yaw: PI });
    b.npc('sniper', -45, -35, { y: Y + H + 4.05, beh: 'sniper', yaw: -2.4 }); b.npc('sniper', 45, 51, { y: Y + H + 4.05, beh: 'sniper', yaw: 2.4 });
    b.npc('rifleman', -60, -40, { beh: 'patrol', path: 'outer' }); b.path('outer', [[-60, -50], [-60, 10], [-55, 50], [-60, 10]]); b.dog(-58, -20, { beh: 'patrol', path: 'outer' });
    b.prop('searchlight', -50, -40); b.light(-50, 9.5, -40, 9, [1.3, 1.25, 1.1], { lamp: true }); b.prop('searchlight', 50, -40); b.light(50, 9.5, -40, 9, [1.3, 1.25, 1.1], { lamp: true });
    b.npc('smg', -54, 2, { yaw: -PI / 2 });
    b.vehicle('truck', -72, -34, 2.6, { col: 0x3a4a3a }); b.zone('truck', -84, -46, -60, -22);
    b.forest(-98, -98, -58, 98, 90, ['pine', 'oak', 'bush']); b.forest(56, -98, 98, 98, 90, ['pine', 'oak']); b.forest(-56, -98, 56, -50, 40, ['pine', 'oak', 'bush']); b.forest(-56, 60, 56, 98, 40, ['pine', 'oak']);
    b.npc('ss', -10, 0, { hidden: true, group: 'reinf' }); b.npc('ss', 10, 0, { hidden: true, group: 'reinf' }); b.npc('ss', 0, 30, { hidden: true, group: 'reinf' }); b.npc('assault', -50, -30, { hidden: true, group: 'reinf' });
    b.spawn('start', -80, -86, 0.3);
    return b.build();
  };

  LEVELS.nordhausen = () => {
    const b = new S.Builder({ id: 'nordhausen', bounds: [-120, -120, 120, 130], env: ENV.evening, terrain: { seed: 61, amp: 2, scale: 60 } });
    b.hill(-95, 45, 50, 34); b.hill(95, 45, 50, 34); b.hill(0, 50, 70, 24, { rx: 70, rz: 50 });
    b.flat(-52, -118, 52, -10, 0, 8); b.flat(-52, -12, 52, 102, 0, 5); b.flat(-60, 100, 118, 128, 0, 6);
    b.wall('x', -51, 51, -10, 2, 0, 11, 'concrete', [{ a: 44, b: 58, y1: 7 }]);
    b.wall('x', -51, 51, 101, 2, 0, 11, 'concrete', [{ a: 44, b: 58, y1: 7 }]);
    b.wall('z', -9, 100, -50, 2, 0, 11, 'concrete'); b.wall('z', -9, 100, 50, 2, 0, 11, 'concrete');
    b.box(-51, -11, 51, 102, 11, 13, 'concrete');
    b.wall('z', -9, 100, -20, 1, 0, 11, 'rock', [{ a: 30, b: 34, y1: 4, door: { tex: 'metaldoor', id: 'fueldoor' } }, { a: 70, b: 74, y1: 4 }]);
    b.wall('z', -9, 100, 20, 1, 0, 11, 'rock', [{ a: 10, b: 14, y1: 4 }, { a: 60, b: 64, y1: 4, door: { tex: 'metaldoor' } }]);
    b.wall('x', -49, -20.5, 45, 1, 0, 11, 'rock'); b.wall('x', 20.5, 49, 40, 1, 0, 11, 'rock');
    for (let z = 0; z <= 90; z += 18) { b.lamp(0, 10.5, z, { r: 18, c: [1.1, 1.0, 0.8] }); }
    for (let z = 5; z <= 85; z += 20) { b.prop('rocketcart', -12, z, { rot: 0 }); b.solid(-12, z, 1.2, 6, 0, 2.3); b.prop('rocketcart', 12, z + 6, { rot: 0 }); b.solid(12, z + 6, 1.2, 6, 0, 2.3); }
    b.rail([[-12, -8], [-12, 99]], { y: 0 }); b.rail([[12, -8], [12, 99]], { y: 0 });
    b.box(-49, -9, 49, 100, -0.3, 0.02, 'concrete');
    b.target('fuel', 'fuel', -35, 25, { hp: 1, charges: 1 }); b.solid(-35, 25, 4, 3.2, 0, 2.6);
    b.plant('fd', -35, 19.5, { target: 'fuel' });
    b.lamp(-35, 10.5, 25, { r: 16, c: [1.0, 0.95, 0.75] }); b.lamp(-35, 10.5, 70, { r: 16 }); b.lamp(35, 10.5, 70, { r: 16 }); b.lamp(35, 10.5, 15, { r: 16 });
    b.npc('ss', -30, 32, { yaw: PI }); b.npc('worker', -40, 14, { beh: 'wander', leash: 5 }); b.npc('smg', -26, 12, { yaw: PI / 2 });
    b.prop('barrels', -44, 40); b.solid(-43.7, 40.3, 1.1, 1.1, 0, 1); b.prop('barrels', -26, 40); b.solid(-25.7, 40.3, 1.1, 1.1, 0, 1);
    b.prop('desk', 40, 80, { rot: PI }); b.prop('mapboard', 36, 99, { rot: PI }); b.prop('shelf', 49, 70, { rot: -PI / 2 }); b.prop('radio', 42, 80.3, { y: 0.8 }); b.prop('banner', 30, 99, { rot: PI, y: 2, h: 3 });
    b.npc('officer', 40, 78, { yaw: PI }); b.npc('ss', 30, 70, { yaw: -PI / 2 }); b.npc('ss', 44, 60, { yaw: PI });
    b.pickup('surgeon', 46, 94); b.pickup('ammo_a792k', 30, 90); b.pickup('ammo_grenade', 26, 50);
    b.prop('lockerrow', 26, 1, { n: 6 }); b.prop('bed', 40, 10, { bunk: true, rot: PI / 2 }); b.prop('bed', 40, 20, { bunk: true, rot: PI / 2 }); b.npc('assault', 34, 26, { yaw: -PI / 2 });
    b.pickup('medkit', 44, 30); b.pickup('ammo_a45', 30, 4);
    b.npc('worker', -4, 30, { beh: 'wander', leash: 8 }); b.npc('worker', 4, 64, { beh: 'wander', leash: 8 });
    b.npc('ss', -6, 20, { beh: 'patrol', path: 'hall' }); b.path('hall', [[-5, -5], [-5, 95], [5, 95], [5, -5]]); b.npc('assault', 6, 50, { yaw: PI });
    b.npc('rifleman', -40, 60, { yaw: PI / 2 }); b.npc('smg', -30, 80, { yaw: 0 }); b.pickup('ammo_a9', -40, 85); b.prop('crates', -44, 90); b.solid(-43.6, 90.1, 1, 0.8, 0, 1.7);
    b.alarm(-19.4, 3, 50); b.alarm(19.4, 3, 30);
    b.rail([[-40, -118], [-40, -30], [-10, -12]]); b.vehicle('wagon', -40, -80, 0, { col: 0x4a3020 }); b.vehicle('wagon', -40, -64, 0, { col: 0x3a3a2a });
    b.prop('tower', 40, -60, { h: 6 }); b.box(38.3, -61.7, 41.7, -58.3, -0.3, 6.08, 'planks', { render: false }); b.npc('sniper', 40, -60, { y: 6.1, beh: 'sniper', yaw: PI });
    b.target('flakY', 'flak88', 20, -70, { rot: 0.5, hp: 380, explosive: true }); b.solid(20, -70, 1.2, 1.2, 0, 2);
    ring(b, 20, -70, 8, 10, PI / 2);
    b.npc('rifleman', 16, -64, { yaw: PI }); b.npc('smg', 24, -74, { yaw: 2 });
    b.fence([[-30, -40], [-20, -36], [-10, -40]], 'sandbag'); b.fence([[10, -40], [20, -36], [30, -40]], 'sandbag');
    b.npc('rifleman', -20, -33, { yaw: PI }); b.npc('grenadier', 20, -33, { yaw: PI }); mgNest(b, 0, -24, PI);
    b.npc('smg', 30, -100, { beh: 'patrol', path: 'yardS' }); b.path('yardS', [[30, -100], [30, -60], [5, -60], [5, -100]]); b.dog(-10, -90, { beh: 'patrol', path: 'yardS' });
    b.vehicle('truck', 10, -95, 0.4, { col: 0x4e4a3a }); b.vehicle('kubel', -8, -60, 2.2);
    b.pickup('medkit', 36, -104); b.pickup('ammo_a45', -30, -100); b.pickup('ammo_a3006', 2, -110);
    b.prop('searchlight', -46, -20); b.light(-46, 1.5, -20, 10, [1.3, 1.2, 1.0], { lamp: true }); b.prop('searchlight', 46, -20); b.light(46, 1.5, -20, 10, [1.3, 1.2, 1.0], { lamp: true });
    b.target('v2', 'v2', -20, 116, { hp: 1, charges: 1 }); b.solid(-20, 116, 2.2, 2.2, 0, 13);
    b.plant('vp', -17, 113.3, { target: 'v2' });
    b.npc('stahl', -6, 112, { id: 'stahl', yaw: PI, beh: 'guard', leash: 18 }); b.npc('ss', -26, 108, { yaw: PI }); b.npc('ss', -12, 122, { yaw: PI }); b.npc('assault', 6, 118, { yaw: PI }); b.npc('rocket', -34, 120, { yaw: 2.6 });
    b.vehicle('halftrack', 10, 108, -1.2); b.prop('searchlight', -30, 126); b.light(-30, 1.5, 126, 10, [1.3, 1.2, 1.0], { lamp: true });
    b.rail([[30, 118], [118, 118]]); b.vehicle('wagon', 80, 118, PI / 2, { col: 0x4a3020 }); b.vehicle('wagon', 96, 118, PI / 2, { col: 0x3a3a2a });
    b.zone('train', 60, 108, 118, 128);
    b.pickup('ammo_a792k', 20, 124); b.pickup('medkit', 40, 110);
    b.npc('ss', -4, 100, { hidden: true, group: 'reinf', yaw: 0 }); b.npc('ss', 4, 0, { hidden: true, group: 'reinf', yaw: PI }); b.npc('assault', -30, 70, { hidden: true, group: 'reinf' }); b.npc('assault', 30, -80, { hidden: true, group: 'reinf' }); b.npc('ss', 50, 115, { hidden: true, group: 'reinf', yaw: -PI / 2 });
    b.forest(-118, -118, -60, -10, 35, ['pine', 'dead']); b.forest(60, -118, 118, -10, 35, ['pine', 'dead']);
    b.spawn('start', -30, -110, 0.2);
    return b.build();
  };

  const MISSIONS = [
    {
      id: 'retriever', level: 'retriever', name: T('Операция «Ретривер»', 'Operation Retriever'), place: T('Сен-Мартен, Нормандия', 'Saint-Martin, Normandy'), date: T('Август 1944', 'August 1944'),
      kit: { weapons: ['colt', 'thompson', 'grenade'], ammo: { a45: 120, grenade: 3 } },
      brief: [
        T('Лейтенант Паттерсон, говорит Манон. Агент G-3 — наш человек в штабе вермахта — схвачен в Сен-Мартене. Его держат в камере ратуши, завтра утром им займётся гестапо.', 'Lieutenant Patterson, Manon speaking. Agent G-3, our man inside the Wehrmacht staff, has been taken in Saint-Martin. He is held in a cell in the town hall. The Gestapo gets him tomorrow morning.'),
        T('Ключ от камер у коменданта — на втором этаже ратуши. Сопротивление оставило грузовик на северной дороге. Доведите агента туда живым.', 'The commandant on the second floor of the town hall keeps the cell keys. The Resistance has left a truck on the north road. Bring the agent to it alive.'),
        T('Радиостанция на площади может вызвать подкрепление. Если будет возможность — заставьте её замолчать.', 'The radio post by the square can call for reinforcements. Silence it if you get the chance.'),
        T('Об этой операции не узнает никто. Ни газеты, ни ваши родные. Таковы правила.', 'Nobody will ever hear about this operation. Not the papers, not your family. Those are the rules.')
      ],
      objectives: [
        { id: 'key', type: 'take', item: 'key', text: T('Забрать ключ от камер у коменданта', 'Take the cell key from the commandant') },
        { id: 'agent', type: 'free', actors: ['agent'], text: T('Освободить агента G-3', 'Free agent G-3') },
        { id: 'radio', type: 'destroy', targets: ['radio1'], optional: true, text: T('Уничтожить радиостанцию', 'Destroy the radio post') },
        { id: 'truck', type: 'reach', zone: 'truck', escort: ['agent'], text: T('Довести агента до грузовика Сопротивления', 'Get the agent to the Resistance truck') }
      ]
    },
    {
      id: 'uboat', level: 'uboat', name: T('Субмарина U-4902', 'Submarine U-4902'), place: T('Базы подлодок, Лорьян', 'U-boat pens, Lorient'), date: T('Сентябрь 1944', 'September 1944'),
      kit: { weapons: ['colt', 'thompson', 'grenade'], ammo: { a45: 120, grenade: 2, charges: 2 } },
      brief: [
        T('Агент G-3 заговорил. В Лорьяне готовится к выходу U-4902 — лодка нового типа, быстрее всего, что есть у союзников.', 'Agent G-3 has talked. In Lorient, U-4902 is being readied, a new type of boat, faster than anything the Allies have.'),
        T('Капитан держит шифровальную книгу «Энигмы» в своей конторе у западной стены бункера. Книга нужна Лондону. Лодка не должна выйти в море.', 'Her captain keeps the Enigma codebook in his office by the west wall of the pen. London needs that book. The boat must never reach the sea.'),
        T('У вас два заряда — по одному на каждый борт. Уходите к катеру на восточном причале.', 'You have two charges, one for each side of the hull. Get out to the launch at the east pier.'),
        T('Лодку строили три тысячи человек, выполняя приказ. Остановит её один.', 'Three thousand men built that boat because they were ordered to. One man will stop it.')
      ],
      objectives: [
        { id: 'codebook', type: 'take', item: 'codebook', text: T('Похитить шифровальную книгу', 'Steal the Enigma codebook') },
        { id: 'sub', type: 'destroy', targets: ['uboat'], text: T('Заложить заряды у обоих бортов U-4902', 'Plant charges on both sides of U-4902') },
        { id: 'boat', type: 'reach', zone: 'boat', text: T('Добраться до катера на восточном причале', 'Reach the launch at the east pier') }
      ]
    },
    {
      id: 'rjukan', level: 'rjukan', name: T('Тяжёлая вода', 'Heavy Water'), place: T('Рьюкан, Норвегия', 'Rjukan, Norway'), date: T('Октябрь 1944', 'October 1944'), disguise: true,
      kit: { weapons: ['silenced', 'papers', 'grenade'], ammo: { a22: 40, grenade: 1, charges: 3 } },
      brief: [
        T('На заводе в Рьюкане производят тяжёлую воду для немецкого атомного проекта. Вы пойдёте туда инженером-норвежцем. Документы безупречны — пока вы ведёте себя как инженер.', 'The Rjukan plant makes heavy water for the German atomic project. You go in as a Norwegian engineer. Your papers are perfect, as long as you act like an engineer.'),
        T('Когда офицер потребует документы — уберите оружие и покажите их (клавиша 7, затем F). Не стреляйте без крайней нужды. Любой выстрел — это сирена.', 'When an officer asks for papers, holster your weapon and show them (key 7, then F). Do not shoot unless you must. Any gunshot means the siren.'),
        T('Три заряда — на электролизные ячейки в цеху на первом этаже. Затем уходите на запад по северному берегу ущелья.', 'Three charges go on the electrolysis cells on the plant floor. Then head west along the north side of the gorge.'),
        T('Вас никто не наградит за операцию, о которой нельзя рассказать. Но мы оба знаем, что это значит.', 'Nobody gives medals for an operation that cannot be told. But you and I both know what it means.')
      ],
      objectives: [
        { id: 'cells', type: 'destroy', targets: ['cells'], text: T('Заложить три заряда у электролизных ячеек', 'Plant three charges on the electrolysis cells') },
        { id: 'stealth', type: 'stealth', optional: true, text: T('Не поднять тревогу', 'Do not raise the alarm') },
        { id: 'escape', type: 'reach', zone: 'escape', text: T('Уйти на запад по северному берегу', 'Escape west along the north bank') }
      ]
    },
    {
      id: 'forest', level: 'forest', name: T('Зигфридов лес', 'Siegfried Forest'), place: T('Линия Зигфрида, Германия', 'Siegfried Line, Germany'), date: T('Декабрь 1944', 'December 1944'),
      kit: { weapons: ['colt', 'thompson', 'bazooka', 'grenade'], ammo: { a45: 150, rocket: 4, grenade: 3, charges: 3 } },
      brief: [
        T('Батареи «восемь-восемь» в лесу держат под огнём наши бомбардировщики. Пока они стреляют, колонна Паттона стоит.', 'The eighty-eight batteries in the forest keep our bombers under fire. While they shoot, Patton’s column waits.'),
        T('Три орудия, один «Тигр» на лесной дороге. Базука, заряды — чем угодно. В командном бункере на севере карты стартовых площадок Фау-2: заберите их.', 'Three guns and one Tiger on the forest road. Bazooka, charges, whatever it takes. The command bunker in the north holds maps of the V-2 launch sites: take them.'),
        T('Штандартенфюрер Шталь подписал приказ держать лес «до последнего солдата». Его солдаты этот приказ исполнят. Вопрос в том, что исполните вы.', 'Standartenführer Stahl signed the order to hold the forest "to the last man". His men will carry it out. The question is what you will do.')
      ],
      objectives: [
        { id: 'flak', type: 'destroy', targets: ['flak1', 'flak2', 'flak3'], text: T('Уничтожить три зенитных орудия', 'Destroy the three flak guns') },
        { id: 'tiger', type: 'destroy', tanks: ['tiger'], text: T('Уничтожить танк «Тигр»', 'Destroy the Tiger tank') },
        { id: 'maps', type: 'take', item: 'maps', text: T('Забрать карты из командного бункера', 'Take the maps from the command bunker') },
        { id: 'exit', type: 'reach', zone: 'exit', text: T('Выйти к северной дороге', 'Reach the north road') }
      ]
    },
    {
      id: 'colditz', level: 'colditz', name: T('Замок Кольдиц', 'Colditz Castle'), place: T('Кольдиц, Саксония', 'Colditz, Saxony'), date: T('Февраль 1945', 'February 1945'),
      kit: { weapons: ['silenced', 'thompson', 'grenade'], ammo: { a22: 50, a45: 90, grenade: 2 } },
      brief: [
        T('В Кольдице держат четырёх пилотов, сбитых над Рейном. Один из них видел, куда Шталь увозит ракетное производство.', 'Four pilots shot down over the Rhine are held in Colditz. One of them saw where Stahl is moving the rocket works.'),
        T('Калитка в западной стене не заперта — её держит наш человек. Ключ от камер — в караульной. Чертежи планёра «Гота» — в кабинете коменданта в восточном крыле.', 'The postern in the west wall is unlocked; our man keeps it that way. The cell key is in the guard room. The Gotha glider plans are in the commandant’s office in the east wing.'),
        T('Пленные сами найдут дорогу к грузовику у подножия холма. Ваше дело — открыть двери и выйти последним.', 'The prisoners will find their own way to the truck at the foot of the hill. Your job is to open the doors and be the last one out.')
      ],
      objectives: [
        { id: 'key', type: 'take', item: 'cellkey', text: T('Найти ключ от камер в караульной', 'Find the cell key in the guard room') },
        { id: 'pows', type: 'free', actors: ['pow1', 'pow2', 'pow3', 'pow4'], text: T('Освободить четырёх пленных пилотов', 'Free the four captured pilots') },
        { id: 'plans', type: 'take', item: 'plans', text: T('Похитить чертежи «Готы»', 'Steal the Gotha plans') },
        { id: 'stealth', type: 'stealth', optional: true, text: T('Не поднять тревогу', 'Do not raise the alarm') },
        { id: 'truck', type: 'reach', zone: 'truck', text: T('Уйти к грузовику у подножия холма', 'Get to the truck at the foot of the hill') }
      ]
    },
    {
      id: 'nordhausen', level: 'nordhausen', name: T('Нордхаузен', 'Nordhausen'), place: T('Горы Гарц, Германия', 'Harz Mountains, Germany'), date: T('Апрель 1945', 'April 1945'),
      kit: { weapons: ['colt', 'thompson', 'garand', 'grenade'], ammo: { a45: 150, a3006: 64, grenade: 3, charges: 2 } },
      brief: [
        T('Вот оно — место, которое видел пилот. Под горой Шталь собирает последние Фау-2. Одна уже стоит на стартовом столе у северного выхода.', 'This is the place the pilot saw. Under the mountain, Stahl is assembling the last V-2s. One is already standing on the launch table at the north exit.'),
        T('Топливный склад — в западной галерее. Без топлива ни одна ракета не взлетит. Ракету на столе взорвите зарядом.', 'The fuel depot is in the west gallery. Without fuel no rocket will fly. Blow the one on the table with a charge.'),
        T('Шталь будет у ракеты. Он не сдастся — он из тех, кто считает приказ важнее всего на свете. Уходите поездом на северо-востоке.', 'Stahl will be at the rocket. He will not surrender; he is the kind of man who thinks an order matters more than anything in the world. Leave by the train in the north-east.'),
        T('Джимми, это последнее задание. Потом — домой. Никто не узнает, где вы были этот год. И это правильно.', 'Jimmy, this is the last one. Then home. No one will ever know where you spent this year. And that is how it should be.')
      ],
      objectives: [
        { id: 'fuel', type: 'destroy', targets: ['fuel'], text: T('Взорвать топливный склад', 'Blow up the fuel depot') },
        { id: 'v2', type: 'destroy', targets: ['v2'], text: T('Уничтожить ракету Фау-2 на стартовом столе', 'Destroy the V-2 on the launch table') },
        { id: 'stahl', type: 'kill', actors: ['stahl'], text: T('Остановить штандартенфюрера Шталя', 'Stop Standartenführer Stahl') },
        { id: 'train', type: 'reach', zone: 'train', text: T('Уйти на поезде', 'Escape on the train') }
      ]
    }
  ];

  const ENDING = [
    T('Вашингтон, июнь 1945. Закрытый зал, шесть человек, никаких фотографов.', 'Washington, June 1945. A closed room, six men, no photographers.'),
    T('Лейтенанту Джеймсу Паттерсону вручают Медаль Почёта. Текст представления засекречен на пятьдесят лет.', 'Lieutenant James Patterson is awarded the Medal of Honor. The citation is classified for fifty years.'),
    T('Вечером он кладёт её в армейский сундук — к остальным медалям, которые нельзя носить.', 'That evening he puts it in his footlocker, next to the other medals he can never wear.'),
    T('Сверху лежит записка от Манон: «Никто не узнает. Именно поэтому это честь».', 'On top lies a note from Manon: "No one will ever know. That is exactly why it is honor."')
  ];
  const INTRO = [
    T('1944 год. Управление стратегических служб — УСС — ведёт войну, о которой не пишут в газетах.', '1944. The Office of Strategic Services, the OSS, fights a war the newspapers never mention.'),
    T('Лейтенант Джимми Паттерсон, штурман сбитого B-17, выжил благодаря французскому Сопротивлению. Теперь он работает на УСС.', 'Lieutenant Jimmy Patterson, navigator of a downed B-17, survived thanks to the French Resistance. Now he works for the OSS.'),
    T('Его связная — Манон Батист. Его противник — штандартенфюрер СС Генрих Шталь, для которого приказ важнее совести.', 'His contact is Manon Batiste. His enemy is SS Standartenführer Heinrich Stahl, for whom an order outweighs any conscience.')
  ];

  S.LEVELS = LEVELS; S.MISSIONS = MISSIONS; S.ENDING = ENDING; S.INTRO = INTRO; S.ENV = ENV;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Moh98 = globalThis.Moh98 || {});
