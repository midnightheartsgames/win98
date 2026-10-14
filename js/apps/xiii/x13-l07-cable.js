(function (X) {
  'use strict';
  const F = X.F;
  const UP = 56, LO = 4, GU = UP - 0.06, GL = LO - 0.06;
  const ZDU = -10, ZXU = -19, ZP = -150, ZS = -146, ZXL = -284, ZDL = -296;
  const YP = 35.6, CAB = 4.4, PT = 39.65;
  const YS = UP + (ZS - ZXU) * (UP - YP) / (ZXU - ZP);
  const SPEED = 5;
  const LEG = {
    car1: [[4, UP, ZXU], [4, YS, ZS]],
    car2: [[4, YP, ZP], [4, LO, ZXL], [4, LO, ZDL]],
    en1: [[-4, LO, ZXL], [-4, YP, ZP], [-4, YS, ZS]],
    en2: [[-4, UP, ZXU], [-4, UP, ZDU]]
  };
  const sm = t => X.smooth(X.clamp(t, 0, 1));

  function prof(z) {
    if (z > 46) return GU + (z - 46) * 0.75;
    if (z > -18) return GU;
    if (z > -50) return GU - 38 * sm((-18 - z) / 32);
    if (z > -95) return 18 - 9 * sm((-50 - z) / 45);
    if (z > -150) return 9 + 13 * sm((-95 - z) / 55);
    if (z > -250) return 22 - (22 - GL) * sm((-150 - z) / 100);
    if (z > -372) return GL;
    return GL + (-372 - z) * 0.6;
  }

  function ground(x, z) {
    const ax = Math.abs(x);
    let h = prof(z);
    const side = sm((ax - 34) / 46);
    h += side * (ax - 34) * 1.05;
    const plateau = sm((z + 18) / 3) * sm((40 - ax) / 5);
    const lower = sm((-246 - z) / 8) * sm((z + 380) / 8) * sm((40 - ax) / 5);
    const knoll = sm((10 - Math.hypot(x, z - ZP)) / 5);
    const flat = Math.max(plateau, lower, knoll);
    const n = Math.sin(x * 0.061 + 1.1) * Math.cos(z * 0.053 + 0.4) * 2.6 + Math.sin(x * 0.17 + z * 0.12) * 0.9 + Math.cos(x * 0.031 - z * 0.027) * 1.8;
    h += n * (1 - flat) * (0.35 + side * 0.65);
    h -= 1.8 * Math.exp(-(((z + 95) / 3.4) ** 2)) * (1 - side) * (1 - flat);
    return h * (1 - knoll) + 22 * knoll;
  }

  function plen(a, pts) { let l = 0, p = a; for (const q of pts) { l += X.vdist(p, q); p = q; } return l; }
  function inCar(car, o) { return Math.abs(o.pos[0] - car.pos[0]) < 1.25 && Math.abs(o.pos[2] - car.pos[2]) < 2.1 && Math.abs(o.pos[1] - car.pos[1]) < 1; }

  function lamp(B, x, y, z, h) {
    B.vbox(x - 0.03, y - h, z - 0.03, x + 0.03, y, z + 0.03, 'metal_dark');
    B.cyl(x, y - h - 0.3, z, 0.45, 0.3, 'metal_green', { solid: false, sides: 10, r2: 0.12 });
    B.light(x, y - h - 0.4, z, [1, 0.88, 0.62], 12, { bulbR: 0.12 });
  }

  function gondola(B, s, mat, ours) {
    B.box(-1.3, -0.25, -2.2, 1.3, 0, 2.2, 'metal_plate', { flags: F.WALL, side: mat, bot: mat });
    B.box(-1.3, 0, -2.2, 1.3, 1.0, -2.08, mat, { flags: F.WALL });
    B.box(-1.3, 0, 2.08, 1.3, 1.0, 2.2, mat, { flags: F.WALL });
    B.box(-s * 1.3, 0, -2.08, -s * 1.18, 1.0, 2.08, mat, { flags: F.WALL });
    B.box(s * 1.18, 0, -2.08, s * 1.3, 1.0, -0.75, mat, { flags: F.WALL });
    B.box(s * 1.18, 0, 0.75, s * 1.3, 1.0, 2.08, mat, { flags: F.WALL });
    for (const [x, z] of [[-1.24, -2.14], [1.24, -2.14], [-1.24, 2.14], [1.24, 2.14], [-s * 1.24, 0]]) B.box(x - 0.06, 1.0, z - 0.06, x + 0.06, 2.3, z + 0.06, 'metal_dark', { flags: F.SOLID | F.SHOT });
    for (const z of [-0.81, 0.81]) B.box(s * 1.24 - 0.06, 0, z - 0.06, s * 1.24 + 0.06, 2.3, z + 0.06, 'metal_dark', { flags: F.SOLID | F.SHOT });
    B.box(-1.4, 2.3, -2.3, 1.4, 2.45, 2.3, mat, { flags: F.WALL, top: 'metal_grey' });
    B.vbox(-1.31, 0.62, -2.215, 1.31, 0.74, -2.2, 'white');
    B.vbox(-1.31, 0.62, 2.2, 1.31, 0.74, 2.215, 'white');
    B.vbox(-s * 1.315, 0.62, -2.2, -s * 1.3, 0.74, 2.2, 'white');
    B.box(-s * 1.18, 0, -1.7, -s * 0.8, 0.45, 1.7, 'wood', { flags: F.SOLID | F.SHOT | F.WALK });
    B.vbox(-0.5, 2.26, -0.4, 0.5, 2.3, 0.4, 'light_panel', { emit: true });
    B.vbox(-0.07, 2.45, -0.07, 0.07, 4.1, 0.07, 'metal_dark');
    B.vbox(-0.3, 3.4, -0.06, 0.3, 3.5, 0.06, 'metal_dark');
    B.vbox(-0.14, 4.05, -0.5, 0.14, 4.3, 0.5, 'metal_grey');
    for (const z of [-0.32, 0.32]) B.hcyl(0, CAB + 0.02, z, 0.13, 0.12, Math.PI / 2, 'metal_dark', { sides: 10 });
    B.sign(ours ? 'EMERALD · 1' : 'EMERALD · 2', -s * 1.32, 1.65, 0, 1.8, 0.34, s * Math.PI / 2, { bg: '#f2ece0', fg: '#1a1a1a', font: 'sans' });
    if (ours) {
      B.box(-0.55, 0, -2.08, 0.55, 1.05, -1.82, 'metal_grey', { flags: F.WALL });
      B.vbox(-0.14, 1.05, -2.02, 0.14, 1.12, -1.88, 'alarm_red', { emit: true });
      B.usable('go', 0, 1.1, -1.8, { label: 'Спуск', enabled: false, once: false, r: 1.3 });
    }
  }

  function station(B, Y, zN, zS, dockZ, north) {
    const W0 = Y - 0.4, zBay = north ? dockZ + 2.4 : dockZ - 2.4;
    const bay0 = Math.min(zN, zBay), bay1 = Math.max(zN, zBay);
    const rest0 = north ? zBay : zS, rest1 = north ? zS : zBay;
    B.floor(-2.6, Math.min(zN, zS), 2.6, Math.max(zN, zS), Y, 'concrete', 0.5);
    B.floor(5.4, Math.min(zN, zS), 13, Math.max(zN, zS), Y, 'concrete', 0.5);
    B.floor(-13, Math.min(zN, zS), -5.4, Math.max(zN, zS), Y, 'concrete', 0.5);
    for (const x of [2.6, -5.4]) {
      B.floor(x, rest0, x + 2.8, rest1, Y, 'concrete', 0.5);
      B.floor(x, bay0, x + 2.8, bay1, Y - 0.6, 'metal_plate', 0.3);
    }
    for (const x of [-5.45, -2.55, 2.55, 5.45]) B.vbox(x - 0.06, Y - 0.05, bay0, x + 0.06, Y + 0.012, bay1, 'hazard');
    const lo = Math.min(zN, zS), hi = Math.max(zN, zS);
    B.wall(-13, zN, 13, zN, W0, Y + 8, 'concrete', { t: 0.4, holes: [[6, 14, 0, 6.9]] });
    B.wall(-13, zS, 13, zS, W0, Y + 8, 'concrete', { t: 0.4, holes: [[11.8, 2.4, 0, 3.0]] });
    B.wall(-13, lo, -13, hi, W0, Y + 8, 'concrete', { t: 0.4, holes: [[3, 3, 2.0, 3.8, true], [9, 3, 2.0, 3.8, true], [20, 3, 2.0, 3.8, true]] });
    B.roof(-13, lo, 13, hi, Y + 8, 2.4, 'z', 'snow_roof', { over: 0.6, wall: 'concrete' });
    B.ceil(-13, lo, 13, hi, Y + 8, 'concrete', 0.2);
    const wz = north ? zS - 6 : zS + 6;
    B.box(-2.4, Y, wz - 2.8, 2.4, Y + 3.2, wz + 2.8, 'metal_green', { flags: F.WALL });
    B.vbox(-2.42, Y + 1.0, wz - 2.82, 2.42, Y + 1.3, wz + 2.82, 'hazard');
    B.cyl(0, Y + 3.2, wz, 0.3, 1.1, 'metal_dark', { solid: false, sides: 8 });
    B.cyl(0, Y + CAB - 0.15, wz, 4.15, 0.3, 'metal_dark', { solid: false, sides: 28, cap: false });
    B.cyl(0, Y + CAB - 0.25, wz, 0.6, 0.5, 'metal_grey', { solid: false, sides: 10 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; B.beam([Math.cos(a) * 0.55, Y + CAB, wz + Math.sin(a) * 0.55], [Math.cos(a) * 4.1, Y + CAB, wz + Math.sin(a) * 4.1], 0.07, 'metal_dark', { sides: 4 }); }
    for (const [x, z] of [[0, (zN + wz) / 2], [-9, (zN + zS) / 2], [9, zN + (north ? 6 : -6)]]) lamp(B, x, Y + 8, z, 1.6);
    return wz;
  }

  function upperStation(B) {
    const Y = UP, BY = Y + 3.2;
    const wz = station(B, Y, -18, 14, ZDU, true);
    B.prop('generator', 3.8, Y, wz + 1.6, 0, {});
    B.wall(13, -18, 13, 14, Y - 0.4, Y + 8, 'concrete', { t: 0.4, holes: [[2, 3, 2.0, 3.8, true], [7, 3, 2.0, 3.8, true], [13.5, 3.5, 4.8, 6.6, true], [18.5, 3.5, 4.8, 6.6, true]] });
    B.sign('EMERALD CABLEWAY — UPPER STATION', 0, Y + 4.4, 14.23, 8.4, 0.8, Math.PI, { bg: '#e8e0c8', fg: '#8a1a10', font: 'sans' });
    B.sign('MAX 8 PERS. · 640 KG', 0, Y + 6.9, -18.23, 4, 0.5, 0, { bg: '#f2c830', fg: '#1a1a1a', font: 'sans' });

    B.box(7, BY - 0.3, -6, 13, BY, 5, 'wood_floor', { flags: F.WALL, bot: 'concrete' });
    B.box(10.8, BY - 0.3, 5, 13, BY, 6.2, 'concrete', { flags: F.WALL });
    B.stairs(10.8, 6.2, 12.8, 13.6, Y, BY, 'n', 'concrete');
    B.box(10.6, Y, 6.2, 10.8, BY + 1.0, 12.2, 'concrete', { flags: F.WALL });
    B.wall(7, -6, 7, 5, BY, BY + 2.8, 'wood_panel', { t: 0.2, holes: [[1, 9, 1.0, 2.4, true]] });
    B.wall(7, 5, 10.7, 5, BY, BY + 2.8, 'wood_panel', { t: 0.2 });
    B.wall(7, -6, 13, -6, BY, BY + 2.8, 'wood_panel', { t: 0.2, holes: [[1.5, 3, 1.0, 2.4, true]] });
    B.ceil(7, -6, 13, 6.2, BY + 2.8, 'ceiling', 0.2);
    B.interior(7.1, BY - 0.2, -5.9, 12.9, BY + 2.8, 6.1);
    B.prop('desk', 8.2, BY, -1.2, Math.PI / 2, { pc: true });
    B.prop('chair', 9.2, BY, -1.2, -Math.PI / 2, {});
    B.prop('cabinet', 12.4, BY, -4.8, -Math.PI / 2, {});
    B.box(7.3, BY, 1.6, 8.1, BY + 1.05, 3.2, 'metal_grey', { flags: F.WALL });
    B.vbox(7.6, BY + 1.05, 2.3, 7.72, BY + 1.62, 2.42, 'red_paint');
    B.sphere(7.66, BY + 1.66, 2.36, 0.07, 'black');
    B.usable('power', 7.9, BY + 1.2, 2.4, { label: 'Запустить канатную дорогу', r: 1.5 });
    B.item('doc', 8.2, BY + 0.8, -1.8, { title: 'Журнал оператора', text: '06:10 — привод прогрет. 06:40 — кабина № 2 ушла вниз за сменой. Приказ полковника: канатку не останавливать ни при каких обстоятельствах, кроме сигнала «XX». Что за сигнал такой — не сказали.' });
    B.light(10, BY + 2.6, -0.5, [1, 0.9, 0.7], 8, { bulbR: 0.1 });

    B.wall(7, -6, 7, 5, Y, BY - 0.3, 'concrete', { t: 0.2, holes: [[4.5, 1.4]] });
    B.wall(7, 5, 13, 5, Y, BY - 0.3, 'concrete', { t: 0.2 });
    B.wall(7, -6, 13, -6, Y, BY - 0.3, 'concrete', { t: 0.2 });
    B.prop('shelf', 12.3, Y, -2.5, -Math.PI / 2, { w: 3.2, h: 2.2, fill: 'crate' });
    B.prop('crates', 9, Y, -4.6, 0.2, { n: 2 });
    B.item('ammo', 11.8, Y + 0.1, 2.8, { w: 'm16', n: 60 });
    B.item('grenades', 11.2, Y + 0.1, 3.4, { n: 2 });
    B.item('vest', 9.4, Y + 0.1, 3.6, { n: 50 });
    B.light(10, BY - 0.6, -0.5, [0.9, 1, 0.8], 6, { bulbR: 0.08 });

    B.room(-13, -8, -8, 4, Y, 3.4, { floor: null, ceil: 'concrete', wall: 'concrete', t: 0.3, skip: 'w', doors: { e: [[5, 1.4]] } });
    for (let i = 0; i < 2; i++) B.prop('shelf', -12.4, Y, -5 + i * 4.8, Math.PI / 2, { w: 3.4, h: 2.2, fill: 'crate' });
    B.prop('table', -10, Y, 1.2, 0, { w: 2, d: 1 });
    B.item('medkit', -10.4, Y + 0.8, 1.2, {});
    B.item('ammo', -9.6, Y + 0.8, 1.1, { w: 'silenced', n: 30 });
    B.item('doc', -9.4, Y + 0.8, 1.4, { title: 'Накладная', text: 'Верхняя станция: 12 ящиков «М-оборудования», два ящика ракет для «Белла». Получатель — генерал Стэнтон, в/ч «Эмеральд». Подпись: «XX».' });
    B.light(-10.5, Y + 3.1, -2, [1, 0.9, 0.7], 7, { bulbR: 0.1 });

    B.room(-13, 6, -8, 14, Y, 3.4, { floor: null, ceil: 'concrete', wall: 'concrete', t: 0.3, skip: 'ws', doors: { e: [[2.5, 1.6]] } });
    B.vbox(-12.8, Y, 6.4, -8.6, Y + 0.02, 13.6, 'grate');
    for (const [x0, z0, x1, z1] of [[-12.85, 6.4, -12.75, 13.6], [-12.85, 6.35, -8.6, 6.45], [-12.85, 13.55, -8.6, 13.65]]) B.box(x0, Y, z0, x1, Y + 1.1, z1, 'metal_yellow', { flags: F.SOLID | F.SHOT });
    B.vbox(-12.9, Y + 2.9, 6.3, -8.6, Y + 3.0, 13.7, 'metal_yellow');
    B.light(-10.5, Y + 3.1, 10, [1, 0.85, 0.6], 6, { bulbR: 0.1 });

    B.prop('helipad', 0, GU, 30, 0, {});
    B.barrel(4.6, GU, 33.8, { radius: 5.5, dmg: 220 });
    B.barrel(5.3, GU, 33.1, { radius: 5.5, dmg: 220 });
    B.prop('fuel_tank', 13, GU, 34, Math.PI / 2, {});
    B.prop('crates', -9, GU, 20, 0.3, { n: 3 });
    B.prop('crates', 9.5, GU, 19.5, -0.4, { n: 2 });
    B.prop('jeep', 17, GU, 22, 0.4, { mat: 'metal_green' });
    B.at(-6, GU, 40, 0, () => X.PROPS.antenna(B, { h: 14 }));
    for (const [x, z] of [[-14, 18], [14, 18], [-14, 38], [14, 40]]) B.prop('lamp_post', x, GU, z, 0, {});
    B.room(-26, 22, -18, 30, GU, 2.8, { floor: 'wood_floor', ceil: null, wall: 'wood_dark', t: 0.2, doors: { e: [[3, 1.2]] }, windows: { n: [[3, 1.4]] } });
    B.roof(-26, 22, -18, 30, GU + 2.8, 1.2, 'x', 'snow_roof', { over: 0.4, wall: 'wood_dark' });
    B.interior(-25.9, GU - 0.2, 22.1, -18.1, GU + 3.2, 29.9);
    B.prop('bunk', -24.8, GU, 26, Math.PI / 2, { mat: 'fabric' });
    B.prop('table', -21, GU, 27.5, 0, { w: 1.6, d: 0.9 });
    B.item('doc', -21.2, GU + 0.8, 27.5, { title: 'Письмо пилота', text: 'Марта, здесь снег по пояс, а платят как за Вьетнам. Возим ящики вниз, людей наверх. Вчера на борту был человек со шрамом — все звали его Мангустом. Я даже пожалел, что взялся за эту работу.' });
    B.item('medkit', -24.6, GU + 0.1, 23.2, {});
    B.light(-22, GU + 2.5, 26, [1, 0.85, 0.6], 6, { bulbR: 0.1 });
    for (const [x0, x1] of [[-40, -13.2], [13.2, 40]]) B.fence(x0, -17.6, x1, -17.6, GU, 1.6, { span: 4 });
    for (const [x, z, r] of [[-30, 10, 2.6], [28, 8, 3.2], [-33, 40, 3.4], [31, 42, 2.8], [22, -8, 2.2]]) B.rock(x, z, r, { snow: true, y: GU });
  }

  function lowerStation(B) {
    const Y = LO;
    const wz = station(B, Y, -280, -306, ZDL, false);
    B.prop('generator', -3.8, Y, wz - 1.6, Math.PI, {});
    B.wall(13, -306, 13, -280, Y - 0.4, Y + 8, 'concrete', { t: 0.4, holes: [[16, 3, 2.0, 3.8, true], [21, 3, 2.0, 3.8, true]] });
    B.sign('EMERALD CABLEWAY — VALLEY STATION', 0, Y + 4.4, -306.23, 8.4, 0.8, 0, { bg: '#e8e0c8', fg: '#8a1a10', font: 'sans' });
    B.room(7, -306, 13, -297, Y, 3.2, { floor: null, ceil: 'concrete', wall: 'plaster', t: 0.25, skip: 'en', doors: { w: [[3, 1.3]], s: [[2, 1.3]] } });
    B.prop('desk', 10.5, Y, -302.5, Math.PI, { lamp: true });
    B.prop('cabinet', 12.4, Y, -299, -Math.PI / 2, {});
    B.item('doc', 10.2, Y + 0.8, -302.4, { title: 'Телеграмма', text: 'СТАНЦИЯ ДОЛИНА ТЧК ЗАДЕРЖИВАТЬ ВСЕХ КТО СПУСКАЕТСЯ СВЕРХУ ТЧК ОСОБЕННО БЛОНДИНА С ТАТУИРОВКОЙ XIII НА ШЕЕ ТЧК ЖИВЫМ НЕ ОБЯЗАТЕЛЬНО ТЧК ПОЛКОВНИК' });
    B.item('medkit', 11.8, Y + 0.1, -304.6, {});
    B.light(10, Y + 2.9, -301.5, [1, 0.9, 0.7], 7, { bulbR: 0.1 });
    B.prop('crates', -9.5, Y, -300, 0.2, { n: 3 });
    B.prop('crates', -10.5, Y, -287, -0.3, { n: 2 });
    B.prop('forklift', -8.4, Y, -293, Math.PI / 2, {});
    B.item('ammo', -9, Y + 0.1, -297.6, { w: 'm16', n: 60 });

    B.vbox(-3, GL - 0.1, -420, 3, LO - 0.04, -306.2, 'gravel');
    B.fence(-40, -340, -3.6, -340, GL, 2.4, { span: 4 });
    B.fence(3.6, -340, 40, -340, GL, 2.4, { span: 4 });
    for (const x of [-3.4, 3.4]) B.cyl(x, GL, -340, 0.12, 1.2, 'hazard', { sides: 6, flags: F.SOLID | F.SHOT });
    B.beam([-3.3, LO + 1.1, -340], [-1.1, LO + 5.6, -340], 0.07, 'hazard', { sides: 4 });
    B.room(5, -338, 9, -334, GL, 2.6, { floor: 'wood_floor', ceil: null, wall: 'siding_white', t: 0.15, doors: { w: [[1.4, 1.1]] }, windows: { s: [[1, 1.8]], n: [[1, 1.8]] } });
    B.roof(5, -338, 9, -334, GL + 2.6, 0.8, 'x', 'snow_roof', { over: 0.35, wall: 'siding_white' });
    B.interior(5.1, GL - 0.2, -337.9, 8.9, GL + 3, -334.1);
    B.item('ammo', 7.5, GL + 0.1, -337.2, { w: 'shotgun', n: 12 });
    B.prop('jeep', -7, GL, -326, 0.3, { mat: 'metal_green' });
    B.prop('truck', 10, GL, -320, Math.PI + 0.1, {});
    for (let i = 0; i < 3; i++) B.barrel(-12 + i * 0.7, GL, -331 + (i % 2) * 0.6, { radius: 5, dmg: 200 });
    for (const [x, z] of [[-12, -312], [12, -312], [-5, -338], [12, -344]]) B.prop('lamp_post', x, GL, z, 0, {});
  }

  function cables(B) {
    for (const x of [-4, 4]) {
      for (const [dy, r] of [[0, 0.05], [-0.4, 0.035]]) {
        const pts = [[x, UP + CAB + dy, 8], [x, UP + CAB + dy, ZXU], [x, YP + CAB + dy, ZP], [x, LO + CAB + dy, ZXL], [x, LO + CAB + dy, -300]];
        for (let i = 0; i < pts.length - 1; i++) B.beam(pts[i], pts[i + 1], r, 'metal_dark', { sides: 5 });
      }
    }
  }

  function pylon(B) {
    const z = ZP, base = 22, top = 39.45;
    B.cyl(0, base - 1.4, z, 3.0, 1.8, 'concrete', { sides: 8, flags: F.WALL });
    const hw = y => 1.9 + (0.95 - 1.9) * (y - base) / (top - base);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.beam([sx * 1.9, base + 0.35, z + sz * 1.9], [sx * 0.95, top, z + sz * 0.95], 0.13, 'metal_grey', { sides: 5 });
    const levels = [];
    for (let y = base + 0.4; y < top; y += 3.4) levels.push(y);
    levels.push(top - 0.05);
    for (let i = 0; i < levels.length; i++) {
      const y = levels[i], h = hw(y);
      const c = [[-h, -h], [h, -h], [h, h], [-h, h]];
      for (let k = 0; k < 4; k++) B.beam([c[k][0], y, z + c[k][1]], [c[(k + 1) % 4][0], y, z + c[(k + 1) % 4][1]], 0.06, 'metal_grey', { sides: 4 });
      if (i === 0) continue;
      const y0 = levels[i - 1], h0 = hw(y0);
      const c0 = [[-h0, -h0], [h0, -h0], [h0, h0], [-h0, h0]];
      for (let k = 0; k < 4; k++) B.beam([c0[k][0], y0, z + c0[k][1]], [c[(k + 1) % 4][0], y, z + c[(k + 1) % 4][1]], 0.05, 'metal_grey', { sides: 4 });
    }
    B.clip(-1.25, base, z - 1.25, 1.25, top, z + 1.25, F.WALL);
    B.box(-3.4, top - 0.45, z - 0.5, 3.4, top, z + 0.5, 'metal_grey', { flags: F.WALL });
    for (const sx of [-1, 1]) {
      B.box(sx * 3.4, top - 0.35, z - 0.25, sx * 3.85, top + 0.05, z + 0.25, 'metal_grey', { flags: F.SOLID | F.SHOT });
      B.vbox(sx * 4 - 0.3, top - 0.05, z - 1.4, sx * 4 + 0.3, top + 0.12, z + 1.4, 'metal_dark');
      for (const dz of [-1.05, -0.35, 0.35, 1.05]) B.hcyl(sx * 4, top + 0.33, z + dz, 0.22, 0.16, Math.PI / 2, 'metal_yellow', { sides: 10 });
    }
    B.box(-3.2, top, z - 1.45, 3.2, PT, z + 1.2, 'grate', { flags: F.WALL });
    for (const [x, zz, len, yaw] of [[-1.85, z + 1.2, 2.7, 0], [1.85, z + 1.2, 2.7, 0], [0, z - 1.45, 6.4, 0], [-3.2, z - 0.12, 2.65, Math.PI / 2], [3.2, z - 0.12, 2.65, Math.PI / 2]]) B.at(x, PT, zz, yaw, () => X.PROPS.post_rail(B, { len, h: 1.0 }));
    B.box(-0.6, PT, z - 1.4, 0.6, PT + 1.0, z - 1.0, 'metal_yellow', { flags: F.WALL });
    B.vbox(-0.05, PT + 1.0, z - 1.25, 0.05, PT + 1.55, z - 1.15, 'red_paint');
    B.sphere(0, PT + 1.58, z - 1.2, 0.07, 'black');
    B.usable('brake', 0, PT + 1.1, z - 0.85, { label: 'Отпустить тормоз шкива', r: 1.5 });
    B.box(1.3, PT, z - 1.35, 2.8, PT + 1.1, z - 0.35, 'metal_grey', { flags: F.WALL });
    B.box(-2.8, PT, z - 1.35, -1.6, PT + 0.9, z - 0.55, 'metal_grey', { flags: F.WALL });
    B.item('doc', -2.2, PT + 0.95, z - 0.95, { title: 'Бирка техника', text: 'Опора № 3. Тормоз шкива — только по команде с нижней станции. Если зажмёт — рычаг вниз до щелчка. И не смотри вниз, Билли. Никогда не смотри вниз.' });

    B.box(-2.55, YS - 0.3, z + 1.25, 2.55, YS, z + 6.4, 'grate', { flags: F.WALL });
    for (const sx of [-1, 1]) B.beam([sx * 1.1, YS - 3.2, z + 1.2], [sx * 2.4, YS - 0.3, z + 6.2], 0.07, 'metal_grey', { sides: 4 });
    B.at(0, YS, z + 6.4, 0, () => X.PROPS.post_rail(B, { len: 5.1, h: 1.0 }));
    for (const sx of [-1, 1]) B.at(sx * 2.5, YS, z + 1.5, Math.PI / 2, () => X.PROPS.post_rail(B, { len: 0.5, h: 1.0 }));
    B.ladder(0, z + 1.3, YS, PT + 1.0, 0, 0.7);
    B.item('weapon', 1.5, YS + 0.1, z + 1.75, { w: 'bazooka', n: 3, id: 'bazooka' });
    B.item('ammo', -1.5, YS + 0.1, z + 1.75, { w: 'bazooka', n: 4 });
    B.item('medkit', 1.8, YS + 0.1, z + 5.8, {});
    B.light(0, PT - 1.2, z + 1.6, [1, 0.85, 0.6], 7, { bulbR: 0.1 });
  }

  function scenery(B) {
    const r = X.rng(707);
    for (let i = 0; i < 170; i++) {
      const x = (r() - 0.5) * 320, z = -30 - r() * 380;
      if (Math.abs(x) < 14 && z > -306) continue;
      if (Math.abs(x) < 42 && z < -268 && z > -356) continue;
      if (Math.hypot(x, z - ZP) < 16) continue;
      const y = ground(x, z);
      if (y > 70) continue;
      B.tree('pine', x, z, { h: 7 + r() * 8, snow: true, y, solid: Math.abs(x) < 60, color: r() < 0.5 ? 'dark' : null });
    }
    for (let i = 0; i < 40; i++) {
      const x = (r() - 0.5) * 260, z = -24 - r() * 390;
      if (Math.abs(x) < 10 && z > -306) continue;
      if (Math.abs(x) < 40 && z < -270 && z > -356) continue;
      B.rock(x, z, 1.4 + r() * 3.2, { snow: true, y: ground(x, z), solid: Math.abs(x) < 60 });
    }
    B.vbox(-140, 7.2, -98.5, 140, 7.35, -91.5, 'ice');
    for (const [x, z] of [[36, -76], [-38, -118]]) {
      const gy = ground(x, z);
      B.at(x, gy, z, 0, () => X.PROPS.watchtower(B, { h: 7, roof: 'snow_roof' }));
    }
  }

  function setHeli(v) {
    v.active = true;
    v.center = [0, 38, ZS];
    v.radius = 27; v.height = 50; v.orbit = 0.2; v.range = 120; v.maxSpeed = 30;
  }

  function ride(c, on) {
    c.grp = on ? 'car' : null;
    c.invuln = on;
    c.crouch = on ? 1 : 0;
    c.ai.order = on ? { type: 'hold', pos: null } : { type: 'follow' };
    c.ai.route = null;
    c.vel = [0, 0, 0];
  }

  function depart(g, leg) {
    const car = g.groups.find(q => q.id === 'car'), car2 = g.groups.find(q => q.id === 'car2');
    const c = g.char('carrington');
    if (c && c.state === 'alive') ride(c, true);
    const a = LEG[leg === 1 ? 'car1' : 'car2'], e = LEG[leg === 1 ? 'en1' : 'en2'];
    const la = plen(car.pos, a), le = plen(car2.pos, e);
    g.moveGroup('car', a, SPEED, leg === 1 ? 'stop:pylon' : 'stop:lower');
    g.moveGroup('car2', e, SPEED * le / la);
    g.flags.leg = leg === 1 ? 'down1' : 'down2';
    g.enable('go', false);
  }

  function pylonCheck(g) {
    if (!g.flags.brakeOff || !g.flags.heliDown || g.flags.leg !== 'pylon') return;
    g.enable('go', true);
    g.objective('down', 'Вернуться в кабину и нажать «Спуск»');
    g.say('carrington', 'Тормоз отпущен, небо чистое. Живо в кабину!');
    g.music('calm');
  }

  X.addLevel({
    id: 'cable', n: 7, name: 'Cable Car', sub: 'Канатная дорога «Эмеральд» — долина',
    env: {
      sky: { top: [0.2, 0.34, 0.6], mid: [0.44, 0.56, 0.74], hor: [0.8, 0.84, 0.88], below: [0.62, 0.66, 0.72], sun: [0.7, 0.45, 0.35], sunColor: [1, 0.94, 0.8], sunSize: 0.004, clouds: 0.55, cloudColor: [0.92, 0.94, 0.98], mountains: 1.4, mountainColor: [0.56, 0.62, 0.74] },
      light: { dir: [0.7, 0.55, 0.35], color: [1.0, 0.95, 0.86], ambient: [0.5, 0.54, 0.62], shadow: [0.46, 0.5, 0.62], indoor: [0.64, 0.64, 0.66] },
      fog: { color: [0.8, 0.84, 0.9], near: 70, far: 460 },
      grade: { tint: [1.0, 1.0, 1.04], sat: 0.92 },
      snow: 0.35
    },
    light: 1,
    music: 'calm',
    ambience: 'wind',
    loadout: { weapons: ['silenced', 'knife', 'crossbow', 'm16'], clip: { silenced: 15, crossbow: 1, m16: 30 }, res: { silenced: 45, knife: 6, crossbow: 8, m16: 90 }, medkits: 2, gadgets: { lockpick: true, hook: true }, skills: ['sense', 'marksman', 'silent', 'hands', 'cold'], weapon: 'm16' },
    build(B) {
      B.bounds(-46, -354, 46, 46);
      B.terrain({ x0: -220, z0: -424, x1: 220, z1: 160, cell: 4, fn: ground, mat: 'snow', steep: 'rock_snow' });
      B.interior(-13, UP - 0.5, -18, 13, UP + 8.2, 14);
      B.interior(-13, LO - 0.5, -306, 13, LO + 8.2, -280);
      upperStation(B);
      lowerStation(B);
      cables(B);
      pylon(B);
      scenery(B);
      const box = [-1.3, -0.4, -2.2, 1.3, 2.4, 2.2];
      B.group('car', 4, UP, ZDU, 0, () => gondola(B, -1, 'metal_red', true), { carry: box });
      B.group('car2', -4, LO, ZDL, 0, () => {
        gondola(B, 1, 'metal_blue', false);
        const crew = [[0.55, -1.4, 'm16', false], [0.55, 1.35, 'm16', true], [-0.35, -0.3, 'shotgun', false], [0.6, 0.15, 'kalash', false]];
        crew.forEach(([x, z, w, gr], i) => B.char('soldier', x, z, { id: 'k' + (i + 1), group: 'crew', weapon: w, grenadier: gr, sight: 75, aggressive: true, look: -Math.PI / 2 }));
        B.item('ammo', -0.8, 0.1, 1.6, { w: 'kalash', n: 30 });
      }, { carry: box });
      B.vehicle('heli', 0, UP + 1.35, 30, { id: 'heli', yaw: Math.PI / 2, hp: 1100, r: 2.6, boss: true, name: 'Вертолёт «Белл»' });

      B.spawnPlayer(-10.5, UP, 10, -Math.PI / 2);
      B.char('carrington', -11.6, 11.3, { y: UP, id: 'carrington', weapon: 'beretta', look: -Math.PI / 2, ai: 'follow', hp: 520, armor: 60 });
      B.char('soldier', 0, -13, { y: UP, id: 'u1', look: 0 });
      B.char('soldier', -8.5, -15, { y: UP, id: 'u2', path: [[-8.5, UP, -15], [-8.5, UP, 4.5]], wait: 2 });
      B.char('officer', 9.2, -1.2, { y: UP + 3.2, id: 'op', look: Math.PI / 2, pose: 'sit', static: true, weapon: 'beretta' });
      B.char('soldier', 3.4, 10.8, { y: UP, id: 'u3', look: Math.PI / 2 });
      B.char('soldier', 10, 7.5, { y: UP, id: 'u5', look: Math.PI });
      B.char('soldier', -12, 22, { id: 'u4', path: [[-12, 22], [12, 22], [12, 38], [-12, 38]], wait: 2 });
      B.char('officer', 3.6, 31.8, { id: 'pilot', look: Math.PI / 2 + 0.4, weapon: 'beretta' });
      for (let i = 0; i < 3; i++) B.char('soldier', -1.5 + i * 1.5, 19 + (i % 2), { id: 'rs' + i, group: 'resp', hidden: true, aggressive: true, grenadier: i === 1 });
      B.char('soldier', 34.6, -77.2, { y: ground(36, -76) + 7.2, id: 'sn1', weapon: 'sniper', ai: 'sniper', sight: 95, group: 'ledge', hidden: true, static: true, look: Math.PI / 2 });
      B.char('soldier', -36.6, -118.6, { y: ground(-38, -118) + 7.2, id: 'sn2', weapon: 'sniper', ai: 'sniper', sight: 95, group: 'ledge', hidden: true, static: true, look: -Math.PI / 2 });
      B.char('commando', -1.8, ZP + 2.6, { y: YS, id: 'bd1', group: 'boarders', hidden: true, aggressive: true });
      B.char('commando', -1.8, ZP + 5.2, { y: YS, id: 'bd2', group: 'boarders', hidden: true, aggressive: true, grenadier: true });
      B.char('soldier', 0, -291, { y: LO, id: 'l1', group: 'lower', look: Math.PI });
      B.char('soldier', 9, -288, { y: LO, id: 'l2', group: 'lower', look: Math.PI });
      B.char('soldier', -7, -289, { y: LO, id: 'l3', group: 'lower', look: Math.PI, grenadier: true });
      B.char('soldier', 1.6, -304.4, { y: LO, id: 'l4', group: 'lower', look: Math.PI });
      B.char('soldier', -10, -316, { id: 'l5', group: 'lower', path: [[-10, -316], [10, -316]], wait: 2 });
      B.char('officer', 7, -336, { id: 'l6', group: 'lower', look: 0, weapon: 'shotgun' });
      B.char('soldier', -4.2, -329.4, { id: 'l7', group: 'lower', look: Math.PI });
      for (let i = 0; i < 3; i++) B.char('commando', -2 + i * 2, -347 - (i % 2), { id: 'gr' + i, group: 'gateResp', hidden: true, aggressive: true });

      B.trigger('booth', 7.5, UP + 2.7, -5.5, 12.5, UP + 5, 4.5);
      B.trigger('yard', -12, UP - 0.5, 16, 12, UP + 3, 26);
      B.trigger('approach', -2, 4, -262, 10, 40, -248, { noReach: true });
      B.trigger('lowerYard', -12, LO - 1, -318, 12, LO + 3, -307, { noReach: true });
      B.trigger('gate', -6, LO - 1, -354, 6, LO + 4, -344, { noReach: true });
      B.cam('boothCam', [10.4, UP + 5.6, 3.8], [8.4, UP + 4.2, -1.2], 50);
      B.cam('pylonCam', [6.4, PT + 2.2, ZP + 5.5], [0, PT + 0.8, ZP - 1.1], 46);
      B.cam('lowerCam', [-9, LO + 3.2, -284], [0, LO + 1.4, -293], 50);
      B.cam('heliCam', [8, UP + 3, 24], [0, UP + 1.4, 30], 46);
    },
    script(S) {
      S.on('start', g => {
        g.objective('power', 'Запустить канатную дорогу — пульт в будке оператора');
        g.objective('alive', 'Генерал должен выжить');
        g.caption('Подъёмник вынес нас на верхнюю станцию. Пахнет машинным маслом и снегом.', 5);
        g.after(2.4, () => g.say('carrington', 'Кабина у платформы. Пульт — наверху, в будке оператора.'));
      });
      S.zone('booth', g => { if (!g.flags['!use:power']) g.msg('Рубильник — на пульте у окна.', 3); });
      S.zone('yard', g => { if (!g.flags.heliDown) g.panel({ kind: 'cam', cam: 'heliCam', dur: 2.6, text: 'ВЕРТОЛЁТ НА ПЛОЩАДКЕ' }); });
      S.use('power', g => {
        g.complete('power');
        g.enable('go', true);
        g.objective('board', 'Сесть в кабину вместе с генералом и нажать «Спуск»');
        g.radio('radio', 'Верхняя станция, кто запустил привод? Отвечайте!');
        g.spawn('resp', [0, UP, 12]);
        const c = g.char('carrington');
        if (c && c.state === 'alive') { c.ai.order = { type: 'goto', pos: [3.6, UP, ZDU + 0.6], run: true }; g.say('carrington', 'Я в кабину. Прикрой!'); }
        g.checkpoint('power');
      });
      S.use('go', g => {
        const car = g.groups.find(q => q.id === 'car');
        if (car.moving) return;
        const c = g.char('carrington');
        if (!inCar(car, g.player)) return;
        if (!c || c.state !== 'alive' || !inCar(car, c)) { g.msg('Генерал ещё не в кабине.', 2.5); return; }
        if (!g.flags.leg) {
          g.complete('board');
          depart(g, 1);
          g.spawn('ledge');
          g.caption('Кабина качнулась и поползла над обрывом.', 3.5);
          g.after(8, () => g.say('carrington', 'Снайперы на вышках! Слева и справа!'));
          g.after(13, () => g.panel({ kind: 'char', id: 'k2', text: 'ВСТРЕЧНАЯ КАБИНА', tint: 'red', dur: 3 }));
          g.checkpoint('ride');
        } else if (g.flags.leg === 'pylon') {
          if (!g.flags.brakeOff || !g.flags.heliDown) { g.msg('Сначала тормоз и вертолёт.', 2.5); return; }
          g.complete('down');
          depart(g, 2);
          g.caption('Шкив провернулся. Вниз, к долине.', 3);
          g.checkpoint('ride2');
        }
      });
      S.on('stop:pylon', g => {
        g.flags.leg = 'pylon';
        g.caption('Кабину тряхнуло. Скрежет — и тишина. Мы висим над ущельем.', 4.5);
        g.say('carrington', 'Аварийный тормоз на опоре! Они зажали шкив.');
        g.objective('brake', 'Подняться на опору и отпустить тормоз шкива');
        g.panel({ kind: 'cam', cam: 'pylonCam', dur: 2.8, text: 'ТОРМОЗ ШКИВА' });
        g.spawn('boarders', g.player.pos);
        g.alertGroup('crew', g.player.pos);
        const v = g.vehicle('heli');
        if (v && !v.dead) {
          setHeli(v);
          g.setFlag('heliUp');
          g.objective('heli', 'Сбить вертолёт');
          g.after(3.5, () => { g.panel({ kind: 'vehicle', id: 'heli', text: 'ВЕРТОЛЁТ!', tint: 'red', dur: 3.2 }); g.radio('pilot', 'Птичка в воздухе. Цель — кабина у третьей опоры.'); });
          g.music('boss');
        } else g.setFlag('heliDown');
        g.checkpoint('pylon');
      });
      S.use('brake', g => {
        g.setFlag('brakeOff');
        g.complete('brake');
        g.msg('Тормоз отпущен.', 2.5);
        if (!g.flags.heliDown) g.say('carrington', 'Пока вертолёт в воздухе, нас собьют на спуске! Бей по нему!');
        pylonCheck(g);
      });
      S.dead('heli', g => {
        g.setFlag('heliDown');
        if (g.flags.leg === 'pylon') { g.complete('heli'); g.music('combat'); pylonCheck(g); }
        else g.say('carrington', 'Их вертолёт — всё. Одной заботой меньше.');
      });
      S.pick('bazooka', g => g.msg('Базука. Ракета любит ведущий прицел — стреляй с упреждением.', 4));
      S.zone('approach', g => {
        g.alertGroup('lower', [4, LO, -290]);
        g.panel({ kind: 'cam', cam: 'lowerCam', dur: 2.6, text: 'НИЖНЯЯ СТАНЦИЯ', tint: 'red' });
        g.radio('radio', 'Кабина идёт вниз! Встречаем!');
      });
      S.on('stop:lower', g => {
        g.flags.leg = 'lower';
        const c = g.char('carrington');
        if (c && c.state === 'alive') ride(c, false);
        g.objective('gate', 'Пробиться к воротам нижней станции');
        g.say('carrington', 'Приехали. Ворота — за станцией, на юг.');
        g.checkpoint('lower');
      });
      S.zone('lowerYard', g => { g.spawn('gateResp', g.player.pos); g.music('combat'); });
      S.zone('gate', g => {
        const c = g.char('carrington');
        if (g.flags.leg !== 'lower' || !c || c.state !== 'alive') return;
        g.complete('gate');
        g.complete('alive');
        g.finish();
      });
      S.dead('carrington', g => g.fail('Генерал Кэррингтон погиб.'));
      S.on('restore', g => {
        const c = g.char('carrington');
        const leg = g.flags.leg;
        if (c && c.state === 'alive' && (leg === 'down1' || leg === 'pylon' || leg === 'down2')) ride(c, true);
        const v = g.vehicle('heli');
        if (v && g.flags.heliUp && !g.flags.heliDown) setHeli(v);
      });
    },
    tick(g) {
      const car = g.groups.find(q => q.id === 'car');
      if (!car || !car.moving || g.state !== 'play' || !g.player.alive) return;
      const p = g.player;
      if (Math.abs(p.pos[0] - car.pos[0]) < 1.7 && Math.abs(p.pos[2] - car.pos[2]) < 2.6 && p.pos[1] - car.pos[1] > -1.5 && p.pos[1] - car.pos[1] < 3) return;
      g.fail('Кабина ушла без вас.');
    },
    comics: {
      intro: [
        {
          rows: [{ h: 0.58, w: [1] }, { h: 0.42, w: [0.5, 0.5] }],
          panels: [
            { cam: { pos: [30, UP + 12, -62], look: [0, UP + 3, -6], fov: 48 }, actors: [], text: [{ k: 'cap', t: 'Верхняя станция канатной дороги «Эмеральд». Под ней — триста метров пустоты.', x: 0.03, y: 0.05, w: 0.56 }] },
            { shot: { on: 0, dist: 0.85, height: 0.05, angle: -25, fov: 36, target: 'head' }, actors: [{ type: 'carrington', pos: [0, 0, 0], yaw: 0, pose: 'talk', float: true }], hideWorld: true, bg: [0.62, 0.7, 0.82], text: [{ k: 'say', t: 'Вниз — только по тросу. Джонс ждёт нас у озера Келлоуни.', x: 0.05, y: 0.05, w: 0.9, who: 0 }] },
            { art: 'silhouette', artOpt: { a: '#d8e2ee', b: '#5a6a88' }, text: [{ k: 'say', t: 'Если трос не перережут раньше.', x: 0.06, y: 0.64, w: 0.88, tail: [0.5, 0.35] }] }
          ]
        }
      ],
      outro: [
        {
          rows: [{ h: 0.5, w: [0.6, 0.4] }, { h: 0.5, w: [1] }],
          panels: [
            { cam: { pos: [6, LO + 1.8, -357], look: [0, LO + 1.3, -342], fov: 48 }, actors: [{ type: 'xiii', pos: [-0.8, LO, -346], yaw: Math.PI, pose: 'walk', gun: 'm16' }, { type: 'carrington', pos: [0.9, LO, -344.5], yaw: Math.PI - 0.2, pose: 'walk' }], text: [{ k: 'cap', t: 'Нижняя станция позади. Дорога уходит в ельник.', x: 0.03, y: 0.05, w: 0.6 }] },
            { art: 'map', artOpt: { label: 'ОЗ. КЕЛЛОУНИ', from: '«Эмеральд»' }, text: [{ k: 'cap', t: 'Сорок миль лесовозной дороги.', x: 0.05, y: 0.05, w: 0.8 }] },
            { shot: { on: 0, dist: 1.0, height: 0.1, angle: 28, fov: 36, target: 'head' }, actors: [{ type: 'carrington', pos: [0, 0, 0], yaw: 0, pose: 'talk', float: true }], hideWorld: true, bg: [0.3, 0.4, 0.3], text: [{ k: 'say', t: 'На Келлоуни был твой дом, Стив. Может, стены вспомнят за тебя.', x: 0.05, y: 0.06, w: 0.9, who: 0 }] }
          ]
        }
      ]
    }
  });
})(globalThis.XIII = globalThis.XIII || {});
