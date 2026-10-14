/**
 * Serious Sam 98 — the Egyptian campaign: five levels built with the Builder DSL.
 * Axes: +z = north (forward at start), +x = east, y = up. Units: metres.
 */
(function (S) {
  'use strict';
  const { Builder, RNG } = S;
  const PI = Math.PI;

  const ENV = {
    day: { skyTop: [0.22, 0.45, 0.85], skyHorizon: [0.86, 0.8, 0.68], fog: [0.86, 0.8, 0.68], fogDensity: 0.0042, sun: [0.45, 0.72, -0.53], sunColor: [1.25, 1.1, 0.88], ambient: [0.42, 0.42, 0.5], clouds: 0.35 },
    noon: { skyTop: [0.18, 0.4, 0.82], skyHorizon: [0.9, 0.84, 0.7], fog: [0.9, 0.84, 0.7], fogDensity: 0.0034, sun: [-0.3, 0.85, 0.42], sunColor: [1.18, 1.08, 0.88], ambient: [0.42, 0.42, 0.5], clouds: 0.25 },
    dusk: { skyTop: [0.2, 0.22, 0.45], skyHorizon: [1.0, 0.62, 0.38], fog: [0.85, 0.58, 0.42], fogDensity: 0.0048, sun: [-0.65, 0.3, 0.7], sunColor: [1.35, 0.92, 0.58], ambient: [0.44, 0.38, 0.46], clouds: 0.55 },
    evening: { skyTop: [0.12, 0.14, 0.34], skyHorizon: [0.92, 0.5, 0.35], fog: [0.62, 0.42, 0.36], fogDensity: 0.005, sun: [0.7, 0.25, 0.6], sunColor: [1.3, 0.8, 0.5], ambient: [0.46, 0.4, 0.5], clouds: 0.5 }
  };
  const T = (ru, en) => ({ ru, en });

  // jagged canyon cliff made of rock chunks
  function cliff(b, x0, z0, x1, z1, h, seed, o = {}) {
    const r = RNG(seed), alongZ = (z1 - z0) >= (x1 - x0), L = alongZ ? z1 - z0 : x1 - x0;
    let a = 0;
    while (a < L - 0.01) {
      const len = Math.min(L - a, 5 + r() * 5), hh = h + (r() - 0.5) * 7, j0 = r() * 1.6, j1 = r() * 1.6;
      if (alongZ) b.box(x0 + j0 * (o.keepW ? 0 : 1), z0 + a, x1 - j1 * (o.keepE ? 0 : 1), z0 + a + len, 0, hh, 'rock', { uvs: 6 });
      else b.box(x0 + a, z0 + j0 * (o.keepS ? 0 : 1), x0 + a + len, z1 - j1 * (o.keepN ? 0 : 1), 0, hh, 'rock', { uvs: 6 });
      if (r() < 0.35) {
        const px = alongZ ? (r() < 0.5 ? x0 : x1) : x0 + a + len / 2, pz = alongZ ? z0 + a + len / 2 : (r() < 0.5 ? z0 : z1);
        b.rock(px, pz, 1.6 + r() * 1.4, 2 + r() * 3, { collide: false });
      }
      a += len;
    }
  }
  const slab = (b, x0, z0, x1, z1, tex = 'tile', y = 0.05) => b.box(x0, z0, x1, z1, -0.6, y, tex, { top: tex });
  const exit = (b, x, z, y, after) => { b.prop('portal', x, z, { y, after }); b.trigger(x - 2.5, z - 2.5, x + 2.5, z + 2.5, [{ exit: true }], { after, y0: y - 1, y1: y + 4 }); };
  const far = (b, list) => { for (const [x, z, half, h] of list) b.prop('pyramid', x, z, { half, h, far: true }); };

  // ================================================================ 1. Hatshepsut
  function hatshepsut() {
    const b = new Builder({
      id: 'hatshepsut', name: T('Храм Хатшепсут', 'Hatshepsut'), bounds: [-60, -10, 70, 245], terrain: { seed: 11, amp: 1.2, scale: 30, edge: 24 },
      start: { x: 0, z: 6, yaw: 0 }, env: ENV.day, music: 0, weapons: ['knife', 'colt'],
      intro: T('Египет, 3000 год до н. э. Сэм прибыл через Путешественника во времени. Нетрикса: «Обнаружен храм царицы Хатшепсут. Уровень враждебности — высокий».', 'Egypt, 3000 B.C. Sam has arrived through the Time-Lock. NETRICSA: "Temple of Queen Hatshepsut detected. Hostility level: high."')
    });
    far(b, [[-220, 330, 70, 80], [180, 420, 90, 105], [260, 120, 45, 50]]);
    // --- A: entry courtyard
    b.flat(-25, 0, 25, 40); slab(b, -25, 0, 25, 40);
    b.walls(-25, 0, 25, 40, 8, 1.5, 'hiero', { n: [[-4, 4]], e: [[3, 7]] }, { lintel: 7, cap: true });
    b.gate('g1', -4, 38.5, 4, 40, 0, 7);
    b.box(23.5, 3, 25, 7, 0, 7, 'hiero', { collide: false }); // illusionary wall → secret room
    b.box(25, 1.5, 31, 3, 0, 8, 'hiero'); b.box(25, 7, 31, 8.5, 0, 8, 'hiero'); b.box(29.5, 3, 31, 7, 0, 8, 'hiero'); b.box(25, 1.5, 31, 8.5, 8, 8.6, 'block');
    b.item('armor_m', 27.5, 5); b.item('health_m', 28.5, 4); b.item('a_shells', 26.5, 4);
    b.secret(25.2, 3, 29.5, 7);
    for (const z of [12, 20, 28]) { b.column(-12, z, 7, 0.8); b.column(12, z, 7, 0.8); }
    b.statue(-21, 20, PI / 2); b.statue(21, 20, -PI / 2);
    b.brazier(-6, 30); b.brazier(6, 30);
    b.item('health_s', -8, 8); b.item('health_s', 8, 8);
    b.trigger(-25, 14, 25, 40, [{ msg: T('Нетрикса: зафиксированы сигнатуры гнааров и безголовых. Приготовьтесь к бою!', 'NETRICSA: Gnaar and Beheaded signatures detected. Prepare for combat!') }, { wave: 'a1' }]);
    b.wave('a1', [{ t: 'gnaar', n: 3, x: 0, z: 33, r: 4 }, { t: 'rocketeer', n: 2, x: -16, z: 34, r: 2, delay: 2 }, { t: 'rocketeer', n: 2, x: 16, z: 34, r: 2, delay: 2 }],
      [{ open: 'g1' }, { item: 'w_shotgun', x: 0, z: 22 }, { item: 'a_shells', x: 2.5, z: 22 }, { msg: T('Ворота открыты. Подберите помповое ружьё!', 'The gate is open. Grab the pump-action shotgun!') }]);
    // --- B: colonnade
    slab(b, -8, 40, 8, 100);
    b.box(-9.5, 40, -8, 100, 0, 9, 'hiero'); b.box(8, 40, 9.5, 100, 0, 9, 'hiero');
    for (let z = 46; z <= 94; z += 8) { b.column(-5.5, z, 8, 0.7); b.column(5.5, z, 8, 0.7); b.box(-6.5, z - 0.6, 6.5, z + 0.6, 8, 8.7, 'block', { collide: false }); }
    b.box(-6.3, 42, -4.7, 98, 8, 8.7, 'block', { collide: false }); b.box(4.7, 42, 6.3, 98, 8, 8.7, 'block', { collide: false });
    for (const z of [50, 70, 90]) { b.torch(-7.7, 3, z); b.torch(7.7, 3, z); }
    b.item('a_shells', 0, 60); b.item('health_s', -3, 75); b.item('health_s', 3, 75); b.row('shard', 0, 82, 0, 92, 6);
    b.trigger(-8, 52, 8, 56, [{ wave: 'b1' }]);
    b.wave('b1', [{ t: 'kamikaze', n: 5, x: 0, z: 97, r: 3, every: 0.7 }, { t: 'gnaar', n: 3, x: 0, z: 95, r: 3, delay: 3 }]);
    b.trigger(-8, 78, 8, 82, [{ wave: 'b2' }]);
    b.wave('b2', [{ t: 'rocketeer', n: 4, x: 0, z: 96, r: 4 }, { t: 'firecracker', n: 2, x: 0, z: 97, r: 3, delay: 2 }, { t: 'kamikaze', n: 4, x: 0, z: 97, r: 2, delay: 5, every: 0.8 }], [{ open: 'g2' }]);
    // --- C: the great terrace
    b.flat(-45, 101.5, 45, 170);
    b.walls(-46.5, 100, 46.5, 171.5, 10, 1.5, 'hiero', { s: [[-6, 6]], n: [[-5, 5]], e: [[150, 155]] }, { cap: true });
    b.box(-6, 100, 6, 101.5, 8, 10, 'hiero'); b.box(-5, 170, 5, 171.5, 8, 10, 'hiero');
    b.gate('g2', -6, 100, 6, 101.5, 0, 8); b.gate('g3', -5, 170, 5, 171.5, 0, 8);
    b.box(45, 150, 46.5, 155, 0, 4, 'hiero'); b.box(45, 150, 46.5, 155, 4, 10, 'hiero', { collide: false }); // secret passage
    b.box(46.5, 148, 53, 157, 0, 4, 'block', { top: 'tile' }); b.box(46.5, 146.5, 54.5, 148, 0, 10, 'hiero'); b.box(46.5, 157, 54.5, 158.5, 0, 10, 'hiero'); b.box(53, 148, 54.5, 157, 0, 10, 'hiero'); b.box(46.5, 146.5, 54.5, 158.5, 10, 10.5, 'block');
    b.item('health_x', 50, 152.5); b.item('a_shells', 51, 150); b.secret(46.8, 148, 53, 157, { y0: 3.5 });
    slab(b, -8, 101.5, 8, 132);
    b.box(-45, 140, 45, 170, 0, 4, 'block', { top: 'tile' });
    b.stairs(-8, 132, 8, 140, 0, 4, 'n'); b.stairs(-40, 132, -32, 140, 0, 4, 'n'); b.stairs(32, 132, 40, 140, 0, 4, 'n');
    for (const x of [-40, -32, -24, -16, 16, 24, 32, 40]) b.column(x, 143, 7, 0.9, { y: 4 });
    b.box(-41.5, 141.5, -14.5, 144.5, 11, 11.9, 'block', { collide: false }); b.box(14.5, 141.5, 41.5, 144.5, 11, 11.9, 'block', { collide: false });
    b.sphinx(-15, 117, PI); b.sphinx(15, 117, PI);
    b.obelisk(-30, 110, 14); b.obelisk(30, 110, 14);
    for (const [x, z] of [[-38, 125], [38, 125], [-25, 131], [25, 131], [-40, 106], [40, 106]]) b.palm(x, z, 7);
    b.brazier(-10, 147, 4); b.brazier(10, 147, 4);
    b.statue(-12, 166, PI, 1.1, 4); b.statue(12, 166, PI, 1.1, 4);
    b.item('w_dshotgun', 0, 152); b.item('health_m', -20, 115); b.item('health_m', 20, 115); b.item('armor_m', 0, 122);
    b.row('a_shells', -12, 136, 12, 136, 4); b.item('health_l', -38, 160); b.item('armor_l', 38, 160);
    b.trigger(-45, 104, 45, 112, [{ close: 'g2' }, { msg: T('Нетрикса: это ловушка! Выход откроется, когда все враги будут уничтожены.', 'NETRICSA: It is a trap! The exit will open when every enemy is destroyed.') }, { wave: 'c1' }]);
    b.wave('c1', [{ t: 'gnaar', n: 6, x: 0, z: 160, r: 6 }, { t: 'rocketeer', n: 3, x: -30, z: 155, r: 3 }, { t: 'rocketeer', n: 3, x: 30, z: 155, r: 3, delay: 1.5 }], [{ wave: 'c2' }]);
    b.wave('c2', [{ t: 'kamikaze', n: 8, x: 0, z: 165, r: 5, every: 0.5 }, { t: 'kleer', n: 2, x: -35, z: 120, r: 3, delay: 3 }, { t: 'kleer', n: 2, x: 35, z: 120, r: 3, delay: 3 }], [{ wave: 'c3' }]);
    b.wave('c3', [{ t: 'firecracker', n: 3, x: -38, z: 160, r: 3 }, { t: 'firecracker', n: 3, x: 38, z: 160, r: 3 }, { t: 'gnaar', n: 6, x: 0, z: 108, r: 8, delay: 2 }, { t: 'kamikaze', n: 6, x: 0, z: 168, r: 3, delay: 6, every: 0.5 }],
      [{ open: 'g3' }, { open: 'g2' }, { msg: T('Путь в святилище открыт.', 'The way to the sanctuary is open.') }]);
    // --- D: sanctuary (roofed)
    slab(b, -20, 171.5, 20, 215, 'tile');
    b.box(-21.5, 171.5, -20, 216.5, 0, 12, 'hiero'); b.box(20, 171.5, 21.5, 216.5, 0, 12, 'hiero');
    b.box(-21.5, 215, -4, 216.5, 0, 12, 'hiero'); b.box(4, 215, 21.5, 216.5, 0, 12, 'hiero'); b.box(-4, 215, 4, 216.5, 7, 12, 'hiero');
    b.gate('g4', -4, 215, 4, 216.5, 0, 7);
    b.box(-21.5, 170, 21.5, 216.5, 12, 13, 'block');
    for (const z of [180, 190, 200, 208]) for (const x of [-14, -7, 7, 14]) b.column(x, z, 12, 1.0);
    for (const z of [180, 195, 210]) { b.torch(-19.8, 4, z); b.torch(19.8, 4, z); }
    b.brazier(-3.5, 204); b.brazier(3.5, 204);
    b.statue(-9, 212, PI); b.statue(9, 212, PI);
    b.item('health_l', 0, 185); b.item('a_shells', -3, 190); b.item('a_shells', 3, 190); b.item('armor_l', 0, 200);
    b.trigger(-20, 174, 20, 178, [{ close: 'g3' }, { wave: 'd1' }]);
    b.wave('d1', [{ t: 'rocketeer', n: 4, x: 0, z: 210, r: 5 }, { t: 'gnaar', n: 3, x: -16, z: 205, r: 2 }, { t: 'gnaar', n: 3, x: 16, z: 205, r: 2 }, { t: 'kleer', n: 2, x: 0, z: 210, r: 3, delay: 4 }], [{ wave: 'd2' }]);
    b.wave('d2', [{ t: 'kamikaze', n: 6, x: 0, z: 212, r: 3, every: 0.6 }, { t: 'firecracker', n: 2, x: -16, z: 212, r: 2, delay: 2 }, { t: 'firecracker', n: 2, x: 16, z: 212, r: 2, delay: 2 }, { t: 'gnaar', n: 4, x: 0, z: 180, r: 4, delay: 3 }],
      [{ open: 'g4' }, { msg: T('Нетрикса: впереди — портал к Песчаному каньону.', 'NETRICSA: Ahead lies the portal to Sand Canyon.') }]);
    // --- E: exit court
    b.flat(-15, 216.5, 15, 240); slab(b, -15, 216.5, 15, 240);
    b.box(-16.5, 216.5, -15, 241.5, 0, 8, 'hiero'); b.box(15, 216.5, 16.5, 241.5, 0, 8, 'hiero'); b.box(-16.5, 240, 16.5, 241.5, 0, 8, 'hiero');
    b.obelisk(-10, 232, 10); b.obelisk(10, 232, 10);
    exit(b, 0, 232, 0);
    return b.build();
  }

  // ================================================================ 2. Sand Canyon
  function sandCanyon() {
    const b = new Builder({
      id: 'canyon', name: T('Песчаный каньон', 'Sand Canyon'), bounds: [-30, -10, 235, 340], terrain: { seed: 23, amp: 2.2, scale: 36, edge: 30 },
      start: { x: 0, z: 5, yaw: 0 }, env: ENV.noon, music: 1,
      intro: T('Нетрикса: каньон ведёт к оазису и открытой пустыне. По данным сканирования — стада сирианских быков.', 'NETRICSA: The canyon leads to an oasis and the open desert. Scans show herds of Sirian Werebulls.')
    });
    far(b, [[-150, 420, 80, 95], [330, 260, 60, 70]]);
    // A: start canyon
    cliff(b, -26, -8, 26, 0, 16, 1);
    cliff(b, -26, 0, -12, 30, 16, 2, { keepW: true }); cliff(b, -26, 36, -12, 92, 16, 3, { keepW: true });
    b.box(-13.5, 30, -12, 36, 0, 12, 'rock', { collide: false, uvs: 6 }); // illusion
    b.box(-26, 28, -14, 30, 0, 14, 'rock', { uvs: 6 }); b.box(-26, 36, -14, 38, 0, 14, 'rock', { uvs: 6 }); b.box(-28, 30, -24, 36, 0, 14, 'rock', { uvs: 6 }); b.box(-26, 28, -12, 38, 8, 9, 'rock', { uvs: 6 });
    b.item('health_x', -19, 33); b.secret(-24, 30, -14, 36);
    cliff(b, 12, -8, 26, 50, 16, 4, { keepE: true });
    cliff(b, -26, 80, 112, 92, 17, 5, { keepN: true });
    b.item('a_shells', 0, 15); b.item('health_m', 4, 40); b.row('shard', -4, 55, 4, 55, 5);
    b.trigger(-12, 20, 12, 24, [{ wave: 'a1' }]);
    b.wave('a1', [{ t: 'kleer', n: 2, x: 0, z: 70, r: 4 }, { t: 'gnaar', n: 4, x: 0, z: 66, r: 5, delay: 1 }]);
    // B: east canyon
    cliff(b, 12, 38, 100, 50, 17, 6, { keepS: true });
    b.item('a_shells', 40, 65); b.item('health_s', 60, 60); b.item('health_s', 60, 70);
    b.trigger(30, 50, 34, 80, [{ wave: 'b1' }]);
    b.wave('b1', [{ t: 'kamikaze', n: 6, x: 98, z: 65, r: 4, every: 0.6 }, { t: 'rocketeer', n: 2, x: 82, z: 58, r: 2, delay: 2 }, { t: 'rocketeer', n: 2, x: 82, z: 72, r: 2, delay: 2 }], [{ wave: 'b2' }]);
    b.wave('b2', [{ t: 'werebull', n: 1, x: 98, z: 65, r: 1 }, { t: 'gnaar', n: 4, x: 95, z: 65, r: 4, delay: 1 }]);
    // C: oasis
    cliff(b, 88, 8, 192, 20, 17, 7, { keepS: true });
    cliff(b, 88, 20, 100, 50, 17, 8, { keepW: true }); cliff(b, 100, 80, 112, 130, 17, 9);
    cliff(b, 180, 20, 192, 142, 18, 10, { keepE: true });
    cliff(b, 100, 130, 150, 142, 18, 11, { keepN: true }); cliff(b, 170, 130, 192, 142, 18, 12, { keepN: true });
    b.water(122, 60, 158, 92, 0.12);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; b.palm(140 + Math.cos(a) * 24, 76 + Math.sin(a) * 21, 6 + (i % 3)); }
    for (const [x, z, h] of [[118, 110, 4], [124, 110, 6], [130, 110, 3], [150, 112, 5], [158, 112, 2.5], [164, 40, 5], [170, 40, 3.5]]) b.column(x, z, h, 0.9);
    b.box(112, 116, 136, 117.5, 0, 4, 'block'); b.box(150, 30, 152, 48, 0, 3, 'block'); b.box(115, 30, 117, 44, 0, 5, 'block');
    b.item('w_tommy', 140, 50); b.item('a_bullets', 142, 50); b.item('health_l', 120, 75); b.item('health_l', 160, 75); b.item('armor_m', 140, 100);
    b.row('a_shells', 110, 30, 110, 45, 3); b.row('a_bullets', 170, 60, 170, 90, 3);
    // secret ledge reached by stone blocks
    b.box(166, 116, 170, 120, 0, 1.0, 'block'); b.box(170, 116, 174, 120, 0, 2.0, 'block'); b.box(174, 112, 178, 120, 0, 3.0, 'block');
    b.box(172, 96, 180, 112, 0, 4.0, 'block', { top: 'tile' });
    b.item('serious', 176, 102); b.item('armor_l', 176, 106); b.secret(172.5, 96.5, 180, 111.5, { y0: 3.5 });
    b.trigger(104, 50, 110, 80, [{ msg: T('Нетрикса: оазис. Здесь водятся быки — уходите с линии атаки!', 'NETRICSA: An oasis. Werebulls roam here — sidestep their charge!') }, { wave: 'c1' }]);
    b.wave('c1', [{ t: 'gnaar', n: 6, x: 140, z: 118, r: 8 }, { t: 'kleer', n: 3, x: 170, z: 35, r: 4, delay: 3 }], [{ wave: 'c2' }]);
    b.wave('c2', [{ t: 'werebull', n: 3, x: 160, z: 124, r: 6, every: 1.5 }, { t: 'kamikaze', n: 8, x: 172, z: 110, r: 4, every: 0.5, delay: 2 }, { t: 'rocketeer', n: 4, x: 112, z: 28, r: 4, delay: 4 }], [{ wave: 'c3' }]);
    b.wave('c3', [{ t: 'harpy', n: 4, x: 140, z: 95, r: 8, y: 12 }, { t: 'kleer', n: 4, x: 112, z: 122, r: 4, delay: 2 }, { t: 'firecracker', n: 3, x: 175, z: 70, r: 3, delay: 3 }],
      [{ open: 'gC' }, { msg: T('Проход на север открыт.', 'The northern pass is open.') }]);
    b.gate('gC', 150, 130, 170, 132, 0, 9, { uvs: 5 });
    // D: north canyon
    cliff(b, 138, 142, 150, 200, 18, 13, { keepW: true }); cliff(b, 170, 142, 182, 200, 18, 14, { keepE: true });
    b.item('health_m', 160, 160); b.item('a_bullets', 156, 175); b.item('a_shells', 164, 175);
    b.trigger(150, 148, 170, 152, [{ wave: 'd1' }]);
    b.wave('d1', [{ t: 'arachnoid', n: 1, x: 160, z: 196, r: 1 }, { t: 'rocketeer', n: 4, x: 160, z: 192, r: 5, delay: 1 }, { t: 'kamikaze', n: 5, x: 160, z: 197, r: 3, delay: 4, every: 0.6 }]);
    // E: dune field
    cliff(b, 28, 188, 150, 200, 17, 15, { keepS: true }); cliff(b, 170, 188, 232, 200, 17, 16, { keepS: true });
    cliff(b, 28, 200, 40, 330, 18, 17, { keepW: true }); cliff(b, 220, 200, 232, 330, 18, 18, { keepE: true });
    cliff(b, 28, 318, 120, 330, 20, 19, { keepN: true }); cliff(b, 136, 318, 232, 330, 20, 20, { keepN: true });
    b.gate('gE', 120, 318, 136, 320, 0, 10, { uvs: 5 });
    b.box(118, 318, 120, 330, 0, 14, 'block'); b.box(136, 318, 138, 330, 0, 14, 'block'); b.box(118, 318, 138, 320, 10, 14, 'block');
    b.obelisk(114, 312, 12); b.obelisk(142, 312, 12);
    b.flat(116, 300, 140, 338); slab(b, 120, 320, 136, 331, 'tile');
    b.box(118, 331, 138, 340, 0, 10, 'block'); // back wall of exit room
    for (const [x, z] of [[70, 240], [190, 250], [95, 290], [175, 300], [60, 300]]) b.rock(x, z, 3, 5);
    for (const [x, z, h] of [[100, 220, 3], [165, 230, 4], [120, 270, 2.5]]) b.column(x, z, h, 1.0);
    b.item('w_rocket', 130, 250); b.item('a_rockets', 133, 250); b.item('a_rockets', 70, 225); b.item('a_rockets', 200, 280);
    b.item('health_l', 80, 260); b.item('health_l', 180, 260); b.item('armor_l', 130, 215); b.item('health_m', 60, 215); b.item('health_m', 200, 215);
    b.row('a_bullets', 100, 300, 160, 300, 3); b.row('a_shells', 60, 280, 60, 310, 2); b.row('a_shells', 200, 225, 200, 245, 2);
    b.trigger(150, 204, 170, 212, [{ msg: T('Нетрикса: открытая пустыня. Стадо быков приближается с севера!', 'NETRICSA: Open desert. A werebull herd approaches from the north!') }, { wave: 'e1' }]);
    b.wave('e1', [{ t: 'kamikaze', n: 10, x: 130, z: 312, r: 6, every: 0.4 }, { t: 'gnaar', n: 6, x: 60, z: 300, r: 5, delay: 2 }, { t: 'kleer', n: 4, x: 200, z: 300, r: 5, delay: 5 }], [{ wave: 'e2' }]);
    b.wave('e2', [{ t: 'werebull', n: 6, x: 128, z: 312, r: 12, every: 0.6 }, { t: 'harpy', n: 4, x: 130, z: 280, r: 8, y: 15, delay: 4 }], [{ wave: 'e3' }]);
    b.wave('e3', [{ t: 'kleer', n: 4, x: 60, z: 222, r: 4 }, { t: 'kleer', n: 4, x: 200, z: 222, r: 4 }, { t: 'arachnoid', n: 1, x: 100, z: 312, r: 1, delay: 2 }, { t: 'arachnoid', n: 1, x: 160, z: 312, r: 1, delay: 2 }, { t: 'kamikaze', n: 12, x: 130, z: 312, r: 6, delay: 6, every: 0.35 }],
      [{ open: 'gE' }, { msg: T('Каменные врата открыты. Вперёд, к Долине Царей!', 'The stone gate is open. Onward to the Valley of the Kings!') }]);
    exit(b, 128, 325.5, 0);
    return b.build();
  }

  // ================================================================ 3. Valley of the Kings
  function valley() {
    const b = new Builder({
      id: 'valley', name: T('Долина Царей', 'Valley of the Kings'), bounds: [-60, -10, 60, 270], terrain: { seed: 37, amp: 1.6, scale: 28, edge: 30 },
      start: { x: 0, z: 5, yaw: 0 }, env: ENV.dusk, music: 2,
      intro: T('Нетрикса: гробницы фараонов. Внутри темно и тесно — берегитесь болотных прыгунов.', 'NETRICSA: The tombs of the pharaohs. Dark and cramped inside — beware of Marsh Hoppers.')
    });
    far(b, [[-160, 360, 70, 80], [170, 300, 55, 65]]);
    cliff(b, -44, -8, 44, 0, 18, 31);
    cliff(b, -44, 0, -30, 118, 20, 32, { keepW: true }); cliff(b, 30, 0, 44, 118, 20, 33, { keepE: true });
    for (let z = 20; z <= 90; z += 14) { b.obelisk(-14, z, 9); b.obelisk(14, z, 9); }
    for (const [x, z, h] of [[-22, 30, 5], [-24, 38, 2.5], [22, 52, 4], [24, 70, 6], [-22, 84, 3]]) b.column(x, z, h, 0.9);
    b.item('w_grenade', 0, 40); b.item('a_grenades', 2, 40); b.item('health_m', -8, 60); b.item('health_m', 8, 60); b.row('a_bullets', -6, 75, 6, 75, 3);
    // secret ledge via fallen blocks
    b.box(-26, 72, -23, 75, 0, 1.0, 'block'); b.box(-29.5, 72, -26, 75, 0, 2.0, 'block'); b.box(-30, 68, -26.5, 72, 0, 3.0, 'block'); b.box(-30, 58, -25.5, 68, 0, 4.0, 'block', { top: 'tile' });
    b.item('serious', -28, 62); b.item('a_rockets', -28, 65); b.secret(-30, 58, -25.5, 67.5, { y0: 3.5 });
    b.trigger(-30, 20, 30, 26, [{ wave: 'a1' }]);
    b.wave('a1', [{ t: 'harpy', n: 5, x: 0, z: 80, r: 10, y: 14 }, { t: 'rocketeer', n: 2, x: -20, z: 95, r: 3 }, { t: 'rocketeer', n: 2, x: 20, z: 95, r: 3 }, { t: 'gnaar', n: 5, x: 0, z: 100, r: 5, delay: 3 }], [{ wave: 'a2' }]);
    b.wave('a2', [{ t: 'kleer', n: 4, x: 0, z: 104, r: 5 }, { t: 'reptiloid', n: 1, x: -22, z: 100, r: 1, delay: 1 }, { t: 'reptiloid', n: 1, x: 22, z: 100, r: 1, delay: 1 }, { t: 'kamikaze', n: 8, x: 0, z: 106, r: 4, delay: 4, every: 0.5 }],
      [{ open: 'gA' }, { msg: T('Вход в гробницу открыт.', 'The tomb entrance is open.') }]);
    // tomb facade
    b.box(-30, 110, -5, 118, 0, 22, 'block'); b.box(5, 110, 30, 118, 0, 22, 'block'); b.box(-5, 110, 5, 118, 8, 22, 'block');
    b.box(-31, 109, 31, 110, 20, 22.5, 'hiero', { collide: false });
    b.gate('gA', -5, 110, 5, 111.5, 0, 8);
    for (const x of [-20, -11, 11, 20]) b.statue(x, 104, PI, 1.7);
    // B: corridor
    slab(b, -5, 111.5, 5, 160, 'dark');
    b.box(-7, 118, -5, 160, 0, 7, 'hiero'); b.box(5, 118, 7, 160, 0, 7, 'hiero'); b.box(-7, 111.5, 7, 160, 7, 8, 'dark');
    for (const z of [124, 136, 148]) { b.torch(-4.8, 3, z); b.torch(4.8, 3, z); }
    b.item('health_s', 0, 130); b.item('a_grenades', 0, 142);
    b.trigger(-5, 125, 5, 128, [{ wave: 'b1' }]);
    b.wave('b1', [{ t: 'hopper', n: 10, x: 0, z: 157, r: 2, every: 0.3 }, { t: 'hopper', n: 8, x: 0, z: 157, r: 2, delay: 5, every: 0.3 }]);
    // C: pillared hall (roofed)
    slab(b, -30, 160, 30, 230, 'dark');
    b.walls(-31.5, 158.5, 31.5, 231.5, 10, 1.5, 'hiero', { s: [[-5, 5]], n: [[-5, 5]], e: [[190, 200]] });
    b.box(-5, 158.5, 5, 160, 7, 10, 'hiero'); b.box(-5, 230, 5, 231.5, 7, 10, 'hiero');
    b.box(30, 190, 31.5, 200, 0, 10, 'hiero', { collide: false }); // illusion
    b.box(-31.5, 158.5, 31.5, 231.5, 10, 11, 'dark');
    b.gate('gB', -5, 158.5, 5, 160, 0, 7, { open: true }); b.gate('gC', -5, 230, 5, 231.5, 0, 7);
    for (const z of [170, 182, 194, 206, 218]) for (const x of [-18, -8, 8, 18]) b.column(x, z, 10, 1.1);
    for (const z of [172, 196, 220]) { b.torch(-29.8, 4, z); b.torch(29.8, 4, z); }
    b.brazier(-4, 188); b.brazier(4, 188); b.brazier(-4, 202); b.brazier(4, 202);
    b.box(-1.2, 193, 1.2, 197, 0, 1.2, 'gold'); b.box(-1.8, 207, 1.8, 211, 0, 1.0, 'block', { top: 'tile' });
    b.item('w_minigun', 0, 209, { y: 1.0 }); b.item('a_bullets', -3, 212); b.item('a_bullets', 3, 212);
    b.item('health_l', -24, 165); b.item('health_l', 24, 165); b.item('armor_m', 0, 175); b.row('a_grenades', -24, 225, 24, 225, 3); b.row('a_rockets', -12, 225, 12, 225, 2);
    // secret burial chamber
    b.box(31.5, 186.5, 42, 188, 0, 10, 'hiero'); b.box(31.5, 202, 42, 203.5, 0, 10, 'hiero'); b.box(40.5, 188, 42, 202, 0, 10, 'hiero'); b.box(31.5, 186.5, 42, 203.5, 10, 11, 'dark');
    slab(b, 31.5, 188, 40.5, 202, 'dark'); b.box(34, 193, 38, 197, 0, 1.2, 'gold'); b.torch(40.3, 3, 195);
    b.item('armor_x', 36, 190); b.item('a_rockets', 36, 200); b.secret(31.8, 188, 40.5, 202);
    b.trigger(-30, 166, 30, 170, [{ close: 'gB' }, { msg: T('Нетрикса: зал колонн. Используйте колонны как укрытие от огненных шаров.', 'NETRICSA: The pillared hall. Use the pillars as cover from fireballs.') }, { wave: 'c1' }]);
    b.wave('c1', [{ t: 'reptiloid', n: 1, x: 0, z: 225, r: 1 }, { t: 'reptiloid', n: 1, x: -25, z: 225, r: 1 }, { t: 'reptiloid', n: 1, x: 25, z: 225, r: 1 }, { t: 'hopper', n: 6, x: -25, z: 170, r: 3, delay: 2, every: 0.2 }, { t: 'hopper', n: 6, x: 25, z: 170, r: 3, delay: 2, every: 0.2 }], [{ wave: 'c2' }]);
    b.wave('c2', [{ t: 'biomech', n: 1, x: 0, z: 222, r: 1 }, { t: 'rocketeer', n: 3, x: -22, z: 222, r: 3 }, { t: 'rocketeer', n: 3, x: 22, z: 222, r: 3 }, { t: 'gnaar', n: 6, x: 0, z: 172, r: 5, delay: 3 }], [{ wave: 'c3' }]);
    b.wave('c3', [{ t: 'kleer', n: 3, x: -25, z: 195, r: 3 }, { t: 'kleer', n: 3, x: 25, z: 195, r: 3 }, { t: 'kamikaze', n: 10, x: 0, z: 226, r: 3, delay: 3, every: 0.45 }, { t: 'harpy', n: 3, x: 0, z: 200, r: 6, y: 6, delay: 5 }],
      [{ open: 'gC' }, { open: 'gB' }, { msg: T('Путь наверх открыт.', 'The way up is open.') }]);
    // D: stairs to the exit
    b.box(-7, 231.5, -5, 250, 0, 12, 'hiero'); b.box(5, 231.5, 7, 250, 0, 12, 'hiero'); b.box(-7, 231.5, 7, 246, 12, 13, 'dark');
    b.stairs(-5, 234, 5, 250, 0, 6, 'n', 'block', 0.5); slab(b, -5, 231.5, 5, 234, 'dark');
    b.box(-14, 250, 14, 264, 0, 6, 'block', { top: 'tile' });
    b.box(-15.5, 248.5, -14, 265.5, 0, 10, 'hiero'); b.box(14, 248.5, 15.5, 265.5, 0, 10, 'hiero'); b.box(-15.5, 264, 15.5, 265.5, 0, 10, 'hiero');
    b.box(-14, 248.5, -7, 250, 0, 10, 'hiero'); b.box(7, 248.5, 14, 250, 0, 10, 'hiero');
    b.torch(-7.5, 8, 252); b.torch(7.5, 8, 252);
    b.item('health_m', -10, 256); b.item('health_m', 10, 256);
    exit(b, 0, 258, 6);
    return b.build();
  }

  // ================================================================ 4. Alley of Sphinxes & Karnak
  function karnak() {
    const b = new Builder({
      id: 'karnak', name: T('Аллея сфинксов', 'Alley of Sphinxes'), bounds: [-60, -10, 60, 410], terrain: { seed: 41, amp: 1.8, scale: 32, edge: 26 },
      start: { x: 0, z: 5, yaw: 0 }, env: ENV.day, music: 3,
      intro: T('Нетрикса: аллея сфинксов ведёт к храму Карнака. Ожидается массированная атака.', 'NETRICSA: The alley of sphinxes leads to the temple of Karnak. A massive assault is expected.')
    });
    far(b, [[-200, 300, 70, 85], [210, 500, 90, 110]]);
    slab(b, -8, 0, 8, 240, 'tile'); b.flat(-20, 0, 20, 240);
    for (let z = 0; z < 240; z += 40) { b.box(-22, z + 6, -20, z + 34, 0, 3, 'block'); b.box(20, z + 6, 22, z + 34, 0, 3, 'block'); }
    for (let z = 20; z <= 220; z += 20) { b.sphinx(-14, z, PI / 2, 0.8); b.sphinx(14, z, -PI / 2, 0.8); }
    for (let z = 30; z <= 210; z += 60) { b.palm(-45, z, 8); b.palm(45, z + 20, 7); b.obelisk(-38, z + 30, 12); b.obelisk(38, z, 12); }
    b.item('w_laser', 0, 120); b.item('a_cells', 3, 120); b.item('a_cells', -3, 120);
    for (let z = 40; z <= 200; z += 40) { b.item('health_m', -4, z); b.item('a_shells', 4, z); }
    b.row('a_bullets', -30, 60, -30, 180, 4); b.row('a_rockets', 30, 60, 30, 180, 4); b.item('armor_l', 0, 150); b.item('health_l', 0, 90);
    b.trigger(-60, 20, 60, 24, [{ wave: 'a1' }]);
    b.wave('a1', [{ t: 'kamikaze', n: 12, x: 0, z: 232, r: 8, every: 0.35 }, { t: 'gnaar', n: 4, x: -45, z: 80, r: 4, delay: 2 }, { t: 'gnaar', n: 4, x: 45, z: 80, r: 4, delay: 2 }]);
    b.trigger(-60, 70, 60, 74, [{ wave: 'a2' }]);
    b.wave('a2', [{ t: 'werebull', n: 5, x: 0, z: 232, r: 10, every: 0.8 }, { t: 'kleer', n: 3, x: -45, z: 140, r: 4, delay: 2 }, { t: 'kleer', n: 3, x: 45, z: 140, r: 4, delay: 2 }]);
    b.trigger(-60, 120, 60, 124, [{ msg: T('Нетрикса: большой биомеханоид! Держитесь подальше от его ракет.', 'NETRICSA: A Biomechanoid Major! Keep clear of its rockets.') }, { wave: 'a3' }]);
    b.wave('a3', [{ t: 'biomajor', n: 1, x: -45, z: 205, r: 1 }, { t: 'biomech', n: 1, x: 45, z: 180, r: 1 }, { t: 'biomech', n: 1, x: 45, z: 210, r: 1 }, { t: 'rocketeer', n: 4, x: -30, z: 200, r: 3 }, { t: 'rocketeer', n: 4, x: 30, z: 200, r: 3 }, { t: 'kamikaze', n: 12, x: 0, z: 232, r: 6, delay: 5, every: 0.35 }]);
    b.trigger(-60, 170, 60, 174, [{ wave: 'a4' }]);
    b.wave('a4', [{ t: 'golem', n: 1, x: -30, z: 225, r: 1 }, { t: 'golem', n: 1, x: 30, z: 225, r: 1 }, { t: 'harpy', n: 6, x: 0, z: 200, r: 10, y: 15, delay: 2 }, { t: 'kleer', n: 8, x: 0, z: 232, r: 6, delay: 3 }],
      [{ open: 'gA' }, { msg: T('Врата пилона открыты.', 'The pylon gate is open.') }]);
    // pylon
    b.box(-58, 240, -6, 250, 0, 22, 'hiero', { uvs: 5 }); b.box(6, 240, 58, 250, 0, 22, 'hiero', { uvs: 5 }); b.box(-6, 240, 6, 250, 10, 22, 'hiero', { uvs: 5 });
    b.box(-59, 239, 59, 251, 22, 23, 'block', { collide: false });
    b.gate('gA', -6, 240, 6, 242, 0, 10, { uvs: 5 });
    b.statue(-12, 236, PI, 1.4); b.statue(12, 236, PI, 1.4);
    // secret: sand pocket behind the far-west alley
    b.item('health_x', -54, 232); b.item('armor_l', -52, 228); b.secret(-58, 225, -48, 238);
    // B: hypostyle hall
    slab(b, -40, 250, 40, 330, 'tile');
    b.box(-42, 250, -40, 332, 0, 16, 'hiero'); b.box(40, 250, 42, 332, 0, 16, 'hiero');
    for (let z = 262; z <= 322; z += 12) {
      b.column(-6, z, 18, 2.0); b.column(6, z, 18, 2.0);
      for (const x of [-32, -22, -14, 14, 22, 32]) b.column(x, z, 14, 1.4);
      b.box(-8.5, z - 1, 8.5, z + 1, 18, 19, 'block', { collide: false });
    }
    b.box(-8.5, 256, -3.5, 328, 18, 19, 'block', { collide: false }); b.box(3.5, 256, 8.5, 328, 18, 19, 'block', { collide: false });
    for (const z of [268, 292, 316]) { b.torch(-39.8, 5, z); b.torch(39.8, 5, z); }
    b.box(-40, 316, -30, 324, 0, 1.0, 'block'); b.box(-40, 324, -34, 330, 0, 2.0, 'block');
    b.item('serious', -38, 327, { y: 2 }); b.secret(-40, 324.5, -34, 330, { y0: 1.5 });
    b.row('a_cells', -18, 280, 18, 280, 3); b.row('a_rockets', -18, 305, 18, 305, 3); b.item('health_l', -28, 300); b.item('health_l', 28, 300); b.item('armor_m', 0, 270);
    b.trigger(-40, 254, 40, 258, [{ close: 'gA' }, { wave: 'b1' }]);
    b.wave('b1', [{ t: 'reptiloid', n: 2, x: -20, z: 320, r: 3 }, { t: 'reptiloid', n: 2, x: 20, z: 320, r: 3 }, { t: 'golem', n: 1, x: 0, z: 322, r: 1, delay: 2 }, { t: 'hopper', n: 20, x: 0, z: 325, r: 8, delay: 3, every: 0.15 }], [{ wave: 'b2' }]);
    b.wave('b2', [{ t: 'kleer', n: 5, x: -30, z: 320, r: 4 }, { t: 'kleer', n: 5, x: 30, z: 320, r: 4 }, { t: 'firecracker', n: 6, x: 0, z: 325, r: 8, delay: 2 }, { t: 'biomech', n: 1, x: -25, z: 262, r: 1, delay: 5 }, { t: 'biomech', n: 1, x: 25, z: 262, r: 1, delay: 5 }],
      [{ open: 'gB' }, { msg: T('Впереди — священное озеро.', 'The sacred lake lies ahead.') }]);
    b.box(-42, 330, -6, 332, 0, 16, 'hiero'); b.box(6, 330, 42, 332, 0, 16, 'hiero'); b.box(-6, 330, 6, 332, 9, 16, 'hiero');
    b.gate('gB', -6, 330, 6, 332, 0, 9);
    // C: sacred lake court
    b.flat(-50, 332, 50, 400);
    b.walls(-51.5, 330, 51.5, 401.5, 8, 1.5, 'hiero', { s: [[-42, 42]] }, { cap: true });
    b.water(-20, 350, 20, 378, 0.12); b.box(-21, 349, 21, 350, 0, 0.5, 'block'); b.box(-21, 378, 21, 379, 0, 0.5, 'block'); b.box(-21, 349, -20, 379, 0, 0.5, 'block'); b.box(20, 349, 21, 379, 0, 0.5, 'block');
    for (const [x, z] of [[-30, 345], [30, 345], [-30, 388], [30, 388]]) b.obelisk(x, z, 13);
    for (const [x, z] of [[-45, 360], [45, 360], [-45, 375], [45, 375]]) b.palm(x, z, 8);
    b.item('health_l', -40, 340); b.item('health_l', 40, 340); b.item('armor_l', 0, 342); b.row('a_rockets', -12, 385, 12, 385, 3); b.row('a_cells', -40, 390, 40, 390, 3);
    b.trigger(-40, 336, 40, 340, [{ close: 'gB' }, { msg: T('Нетрикса: огромная концентрация врагов. Это последний рубеж перед Великой пирамидой!', 'NETRICSA: Massive enemy concentration. This is the last stand before the Great Pyramid!') }, { wave: 'c1' }]);
    b.wave('c1', [{ t: 'biomajor', n: 1, x: -38, z: 392, r: 1 }, { t: 'biomajor', n: 1, x: 38, z: 392, r: 1, delay: 4 }, { t: 'kamikaze', n: 16, x: 0, z: 396, r: 10, every: 0.3, delay: 1 }, { t: 'werebull', n: 4, x: 0, z: 395, r: 10, delay: 8, every: 1 }], [{ wave: 'c2' }]);
    b.wave('c2', [{ t: 'harpy', n: 8, x: 0, z: 365, r: 15, y: 14 }, { t: 'golem', n: 1, x: -40, z: 395, r: 1, delay: 2 }, { t: 'golem', n: 1, x: 40, z: 395, r: 1, delay: 2 }, { t: 'kleer', n: 8, x: 0, z: 396, r: 8, delay: 4 }],
      [{ msg: T('Портал активирован. Великая пирамида ждёт!', 'Portal activated. The Great Pyramid awaits!') }]);
    exit(b, 0, 394, 0, 'c2');
    return b.build();
  }

  // ================================================================ 5. The Great Pyramid
  function pyramid() {
    const b = new Builder({
      id: 'pyramid', name: T('Великая пирамида', 'The Great Pyramid'), bounds: [-130, -10, 130, 340], terrain: { seed: 53, amp: 2.4, scale: 40, edge: 30 },
      start: { x: 0, z: 5, yaw: 0 }, env: ENV.evening, music: 4,
      intro: T('Нетрикса: Великая пирамида. Внутри — Путешественник во времени. Её охраняет Уг-Зан III.', 'NETRICSA: The Great Pyramid. The Time-Lock is inside. It is guarded by Ugh-Zan III.')
    });
    far(b, [[-260, 250, 60, 70], [260, 380, 70, 80]]);
    // A: approach with ruins
    b.pyramid(-34, 60, 10, 12, { collide: true, layers: 10 }); b.pyramid(34, 92, 8, 10, { collide: true, layers: 8 });
    for (const [x, z, h] of [[-15, 30, 4], [15, 30, 6], [-15, 50, 2.5], [15, 50, 5], [-15, 70, 6], [15, 70, 3]]) b.column(x, z, h, 1.0);
    b.box(-60, 40, -44, 42, 0, 5, 'block'); b.box(44, 70, 60, 72, 0, 4, 'block'); b.box(-70, 90, -68, 110, 0, 3, 'block');
    for (const [x, z] of [[-80, 30], [70, 20], [90, 100], [-95, 80]]) b.palm(x, z, 7);
    b.item('w_cannon', 0, 60); b.item('a_balls', 3, 60); b.item('a_balls', -3, 60);
    b.row('a_rockets', -20, 20, 20, 20, 3); b.row('a_bullets', -30, 90, 30, 90, 3); b.row('a_cells', -40, 40, 40, 40, 3); b.row('a_shells', -50, 100, 50, 100, 3);
    b.item('health_l', -25, 80); b.item('health_l', 25, 80); b.item('armor_x', 0, 105); b.item('a_grenades', -60, 60); b.item('a_grenades', 60, 60);
    b.item('health_x', -34, 60, { y: 12 }); b.secret(-36, 58, -32, 62, { y0: 10 });
    b.trigger(-130, 14, 130, 18, [{ msg: T('Нетрикса: пушка SBC — самое мощное оружие Сэма. Удерживайте огонь для дальнего выстрела.', 'NETRICSA: The SBC Cannon is Sam\'s most powerful weapon. Hold fire for a longer shot.') }, { wave: 'a1' }]);
    b.wave('a1', [{ t: 'kamikaze', n: 15, x: 0, z: 116, r: 12, every: 0.3 }, { t: 'kleer', n: 3, x: -60, z: 110, r: 5, delay: 2 }, { t: 'kleer', n: 3, x: 60, z: 110, r: 5, delay: 2 }, { t: 'harpy', n: 6, x: 0, z: 90, r: 20, y: 15, delay: 4 }], [{ wave: 'a2' }]);
    b.wave('a2', [{ t: 'werebull', n: 6, x: 0, z: 116, r: 20, every: 0.7 }, { t: 'biomech', n: 1, x: -80, z: 110, r: 1, delay: 2 }, { t: 'biomech', n: 1, x: 80, z: 110, r: 1, delay: 2 }, { t: 'gnaar', n: 10, x: 0, z: 10, r: 15, delay: 5 }],
      [{ open: 'gA' }, { msg: T('Ворота к пирамиде открыты. Приготовьтесь к битве с Уг-Заном!', 'The gate to the pyramid is open. Prepare to face Ugh-Zan!') }]);
    b.box(-130, 120, -8, 122, 0, 8, 'block'); b.box(8, 120, 130, 122, 0, 8, 'block'); b.box(-8, 120, 8, 122, 7, 8, 'block');
    b.gate('gA', -8, 120, 8, 122, 0, 7);
    b.obelisk(-14, 116, 12); b.obelisk(14, 116, 12);
    // B: pyramid plaza & boss arena
    b.flat(-60, 122, 60, 250);
    for (let z = 140; z <= 230; z += 30) { b.obelisk(-18, z, 12); b.obelisk(18, z, 12); }
    b.sphinx(-34, 234, PI, 1.2); b.sphinx(34, 234, PI, 1.2);
    b.pyramid(0, 330, 80, 100, { collide: true, layers: 16 });
    for (const [x, z] of [[-90, 160], [90, 160], [-100, 220], [100, 220]]) b.rock(x, z, 4, 6);
    b.row('a_balls', -40, 150, 40, 150, 3); b.row('a_rockets', -60, 190, 60, 190, 4); b.row('a_cells', -40, 225, 40, 225, 3);
    b.item('health_l', -80, 140); b.item('health_l', 80, 140); b.item('health_l', -80, 230); b.item('health_l', 80, 230); b.item('armor_l', -50, 200); b.item('armor_l', 50, 200);
    b.item('health_x', 0, 180); b.row('a_bullets', -100, 180, -100, 240, 2); b.row('a_bullets', 100, 180, 100, 240, 2);
    b.trigger(-130, 130, 130, 136, [{ close: 'gA' }, { msg: T('Нетрикса: ВНИМАНИЕ! Уг-Зан III приближается. Не стойте на месте!', 'NETRICSA: WARNING! Ugh-Zan III is approaching. Keep moving!') }, { wave: 'boss' }]);
    b.wave('boss', [
      { t: 'ughzan', n: 1, x: 0, z: 238, r: 0, fixed: true },
      { t: 'kamikaze', n: 10, x: -90, z: 240, r: 8, delay: 15, every: 0.4 }, { t: 'harpy', n: 5, x: 0, z: 200, r: 30, y: 16, delay: 25 },
      { t: 'kamikaze', n: 10, x: 90, z: 240, r: 8, delay: 40, every: 0.4 }, { t: 'kleer', n: 6, x: 0, z: 140, r: 20, delay: 55 },
      { t: 'gnaar', n: 8, x: -100, z: 150, r: 6, delay: 70 }, { t: 'kamikaze', n: 12, x: 0, z: 245, r: 20, delay: 85, every: 0.3 }
    ], [{ msg: T('Уг-Зан III повержен! Путешественник во времени пробуждается у подножия пирамиды.', 'Ugh-Zan III is defeated! The Time-Lock awakens at the foot of the pyramid.') }]);
    exit(b, 0, 244, 0, 'boss');
    return b.build();
  }

  S.LEVELS = [hatshepsut, sandCanyon, valley, karnak, pyramid];
  S.ENV = ENV;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.SeriousSam98 = globalThis.SeriousSam98 || {});
