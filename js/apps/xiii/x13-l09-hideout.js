(function (X) {
  'use strict';
  const F = X.F;
  const Y0 = 30, Y1 = 33.8, TOP = 37.2, YM = 18, GT = Y0 - 0.06;
  const sm = t => X.smooth(X.clamp(t, 0, 1));
  const DRIVE = [[54, 46], [46, 20], [40, -2], [34, -15], [30, -26]];
  const PATH = [[-18, 46], [-8, 28], [-20, 12], [-8, -2], [0, -15]];
  const IRISH_POINTS = [[-40, YM, -60], [-58, YM, -62], [-58, YM, -84], [-38, YM, -86], [-49, YM, -73]];

  function prof(z) {
    if (z > 30) return 8;
    if (z > -16) return GT - (z + 16) / 46 * (GT - 8);
    if (z > -62) return GT;
    return GT + (-62 - z) * 0.9;
  }
  function ground(x, z) {
    const ax = Math.abs(x);
    let h = prof(z);
    const side = sm((ax - 46) / 30);
    h += side * (ax - 46) * 0.8;
    const terrace = sm((z + 64) / 2) * sm((-14 - z) / 2) * sm((47 - ax) / 3);
    const road = sm((z - 28) / 4);
    const n = Math.sin(x * 0.08 + 1.7) * Math.cos(z * 0.07) * 1.6 + Math.sin(x * 0.21 - z * 0.17) * 0.5;
    h += n * (1 - Math.max(terrace, road)) * (0.4 + side);
    return h;
  }
  function near(pts, x, z, w) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz;
      const t = X.clamp(((x - a[0]) * dx + (z - a[1]) * dz) / l2, 0, 1);
      if (Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t) < w) return true;
    }
    return false;
  }

  function woodFence(B, x0, x1, z, y) {
    const len = x1 - x0;
    B.at((x0 + x1) / 2, y, z, 0, () => {
      for (const ry of [0.45, 1.0]) B.vbox(-len / 2, ry, -0.04, len / 2, ry + 0.1, 0.04, 'wood_dark');
      const n = Math.max(1, Math.round(len / 2.5));
      for (let i = 0; i <= n; i++) { const x = -len / 2 + len * i / n; B.vbox(x - 0.07, 0, -0.07, x + 0.07, 1.25, 0.07, 'wood_dark'); }
      B.clip(-len / 2, 0, -0.08, len / 2, 1.25, 0.08, F.SOLID);
    });
  }

  function lodge(B) {
    const W = 'wood_dark', P = 'wood_panel';
    B.floor(-20, -46, 20, -28, Y0, 'wood_floor', 0.4);
    B.wall(-20, -28, 20, -28, Y0, Y1, W, { t: 0.4, holes: [[3, 1.6, 1.0, 2.3, true], [8, 1.6, 1.0, 2.3, true], [18.9, 2.2, 0, 2.6], [30.4, 1.6, 1.0, 2.3, true], [35.4, 1.6, 1.0, 2.3, true]] });
    B.wall(-20, -46, 20, -46, Y0, Y1, W, { t: 0.4, holes: [[3, 1.6, 1.0, 2.3, true], [32.8, 2.4, 0, 2.6]] });
    B.wall(-20, -46, -20, -28, Y0, Y1, W, { t: 0.4, holes: [[4, 1.6, 1.0, 2.3, true], [11, 1.6, 1.0, 2.3, true]] });
    B.wall(20, -46, 20, -28, Y0, Y1, W, { t: 0.4, holes: [[3, 1.6, 1.0, 2.3, true], [12, 1.6, 1.0, 2.3, true]] });
    B.wall(-20, -28, 20, -28, Y1, TOP, W, { t: 0.4, holes: [[3, 1.6, 0.9, 2.3, true], [8, 1.6, 0.9, 2.3, true], [15, 10, 0.6, 2.8, true], [30.4, 1.6, 0.9, 2.3, true], [35.4, 1.6, 0.9, 2.3, true]] });
    B.wall(-20, -46, 20, -46, Y1, TOP, W, { t: 0.4, holes: [[3, 1.6, 0.9, 2.3, true], [8, 1.6, 0.9, 2.3, true], [30.4, 1.6, 0.9, 2.3, true], [35.4, 1.6, 0.9, 2.3, true]] });
    B.wall(-20, -46, -20, -28, Y1, TOP, W, { t: 0.4, holes: [[4, 1.6, 0.9, 2.3, true], [11, 1.6, 0.9, 2.3, true]] });
    B.wall(20, -46, 20, -28, Y1, TOP, W, { t: 0.4, holes: [[3, 1.6, 0.9, 2.3, true], [12, 1.6, 0.9, 2.3, true]] });
    B.wall(-8, -46, -8, -28, Y0, Y1, P, { t: 0.25, holes: [[8, 1.4, 0, 2.3]] });
    B.wall(-8, -46, -8, -28, Y1, TOP, P, { t: 0.25, holes: [[2, 1.2, 0, 2.3]] });
    B.wall(8, -46, 8, -28, Y0, Y1, P, { t: 0.25, holes: [[3, 1.4, 0, 2.3], [13, 1.4, 0, 2.3]] });
    B.wall(8, -46, 8, -28, Y1, TOP, P, { t: 0.25, holes: [[2, 1.2, 0, 2.3]] });
    B.wall(8, -37, 20, -37, Y0, Y1, P, { t: 0.2 });
    for (const [x0, x1] of [[-20, -8], [8, 20]]) B.box(x0, Y1 - 0.3, -46, x1, Y1, -28, 'wood_floor', { flags: F.WALL, bot: 'ceiling_wood' });
    B.box(-8, Y1 - 0.3, -46, -6, Y1, -38, 'wood_floor', { flags: F.WALL, bot: 'ceiling_wood' });
    B.box(-6, Y1 - 0.3, -46, 6, Y1, -43, 'wood_floor', { flags: F.WALL, bot: 'ceiling_wood' });
    B.box(6, Y1 - 0.3, -46, 8, Y1, -38, 'wood_floor', { flags: F.WALL, bot: 'ceiling_wood' });
    for (const [x, z, len, yaw] of [[-6, -40.5, 5, Math.PI / 2], [0, -43, 12, 0], [6, -40.5, 5, Math.PI / 2], [7, -38, 2, 0]]) B.at(x, Y1, z, yaw, () => X.PROPS.post_rail(B, { len, h: 1.0, mat: 'wood_dark' }));
    B.stairs(-8, -38, -6.4, -29.6, Y0, Y1, 'n', 'wood_floor');
    B.box(-6.45, Y0, -38, -6.3, Y1 + 1.0, -33.5, P, { flags: F.WALL });
    B.ceil(-20, -46, 20, -28, TOP, 'ceiling_wood', 0.25);
    B.roof(-20, -46, 20, -28, TOP + 0.25, 3.2, 'x', 'shingles', { over: 0.8, wall: W });
    B.box(-6, Y0 - 0.3, -28, 6, Y0, -24.6, 'planks', { flags: F.WALL });
    B.shed(-6, -28, 6, -24.6, Y0 + 3.1, Y0 + 3.6, 'n', 'shingles', { over: 0.3 });
    for (const x of [-5.8, -2, 2, 5.8]) B.cyl(x, Y0, -24.8, 0.12, 3.1, 'wood_dark', { sides: 6, flags: F.SOLID | F.SHOT });
    B.interior(-20, Y0 - 0.5, -46, 20, TOP + 0.3, -24.6);
    B.door(0, -28, Y0, 2.2, 2.6, 'x', { id: 'front', mat: 'door' });

    B.prop('fireplace', 0, Y0, -45.4, 0, {});
    B.light(0, Y0 + 0.6, -44.6, [1, 0.55, 0.22], 9, { flicker: 0.6, bulbR: 0.08, id: 'fire' });
    B.vbox(-3, Y0, -42, 3, Y0 + 0.012, -35, 'carpet_red');
    for (const x of [-2.4, 2.4]) B.prop('armchair', x, Y0, -41.2, x < 0 ? 0.5 : -0.5, {});
    B.prop('sofa', 0, Y0, -37.6, Math.PI, {});
    B.cyl(0, TOP - 1.5, -37, 1.1, 0.08, 'brass', { solid: false, sides: 12, cap: false });
    B.light(0, TOP - 1.6, -37, [1, 0.8, 0.52], 15, { bulbR: 0.14, id: 'house' });
    B.at(0, Y1 + 1.6, -45.75, 0, () => X.PROPS.trophy(B, {}));
    B.at(-7.8, Y0 + 2.6, -33, Math.PI / 2, () => X.PROPS.trophy(B, {}));

    B.prop('table', -14, Y0, -37, Math.PI / 2, { w: 11, d: 1.6, mat: 'wood_dark' });
    for (let i = 0; i < 10; i++) { const z = -41.5 + i; B.prop('chair', -15.3, Y0, z, -Math.PI / 2, {}); B.prop('chair', -12.7, Y0, z, Math.PI / 2, {}); }
    B.sign('XX', -14, Y0 + 2.1, -45.78, 2.6, 1.5, 0, { bg: '#7a0c0c', fg: '#f0e0c0', font: 'serif' });
    B.item('doc', -14, Y0 + 0.8, -42.6, { id: 'protocol', title: 'Протокол собрания «XX»', text: 'Присутствовали: I–XX, кроме XIII. Решено: Тринадцатого не искать — сам придёт к Келлоуни. Ирландцу — встретить в арсенале под домом. Ход — через библиотеку: потянуть за «Графа Монте-Кристо» на полке у стены. Номеру Один доложить лично.' });
    B.light(-14, Y1 - 0.9, -37, [1, 0.78, 0.5], 11, { bulbR: 0.1, id: 'house' });
    B.prop('cabinet', -19.4, Y0, -30.4, Math.PI / 2, {});

    for (let i = 0; i < 3; i++) B.prop('bookshelf', 19.6, Y0, -44.6 + i * 2.6, -Math.PI / 2, { w: 2.4 });
    B.prop('bookshelf', 10, Y0, -45.6, 0, { w: 2.8 });
    B.prop('bookshelf', 17.6, Y0, -45.6, 0, { w: 2.8 });
    B.prop('desk', 14, Y0, -40.4, Math.PI, { lamp: true });
    B.prop('chair', 14, Y0, -41.5, 0, {});
    B.door(14, -46, Y0, 2.4, 2.6, 'x', { id: 'secret', slide: true, locked: 'script', mat: 'books', noAI: true, label: 'Книжный шкаф. Слишком тяжёлый.' });
    B.usable('book', 11.6, Y0 + 1.5, -45.3, { label: 'Потянуть за «Графа Монте-Кристо»', r: 1.4 });
    B.light(14, Y0 + 2.9, -41.5, [1, 0.82, 0.55], 8, { bulbR: 0.1, id: 'house' });

    B.prop('desk', 16, Y0, -32.6, 0, { lamp: true, pc: false });
    B.prop('safe', 19.2, Y0, -29.4, -Math.PI / 2, {});
    B.prop('cabinet', 9.2, Y0, -35.8, Math.PI / 2, {});
    B.item('doc', 15.6, Y0 + 0.8, -32.4, { id: 'file', title: 'Личное дело: капитан С. Роуланд', text: 'SPADS. Инструктор по метанию ножа, лучший в выпуске. Погиб при исполнении — по официальной версии. Настоящее лицо изменено хирургически. Номер в организации: XIII. Пометка на полях: «Слишком хорош. Слишком опасен».' });
    B.item('medkit', 19.2, Y0 + 1.1, -29.4, {});
    B.light(14, Y0 + 2.9, -32.5, [1, 0.82, 0.55], 8, { bulbR: 0.1, id: 'house' });

    B.prop('bed', -17.6, Y1, -41, Math.PI / 2, { mat: 'fabric_red' });
    B.prop('cabinet', -19.4, Y1, -34, Math.PI / 2, {});
    B.item('doc', -10.4, Y1 + 0.05, -30.2, { title: 'Письмо без подписи', text: 'Ирландец, не играй с ним. Мангуст уже едет. Если Тринадцатый спустится в арсенал — газ по сигналу. Живым, слышишь? Номер Один хочет задать ему пару вопросов в Плейн-Рок.' });
    B.item('medkit', -18.8, Y1 + 0.1, -44.6, {});
    B.light(-14, TOP - 0.6, -37, [1, 0.8, 0.55], 8, { bulbR: 0.1, id: 'house' });
    B.prop('bed', 17.4, Y1, -41, -Math.PI / 2, { mat: 'fabric' });
    B.prop('table', 12, Y1, -31, 0, { w: 1.4, d: 0.8 });
    B.item('ammo', 12, Y1 + 0.8, -31, { w: 'sniper', n: 10 });
    B.item('grenades', 12.5, Y1 + 0.8, -31.1, { n: 2 });
    B.item('vest', 18.8, Y1 + 0.1, -30, { n: 50 });
    B.light(14, TOP - 0.6, -37, [1, 0.8, 0.55], 8, { bulbR: 0.1, id: 'house' });

    B.wall(12, -52, 12, -46, YM - 0.5, Y0 + 3.2, 'stone', { t: 0.3 });
    B.wall(16, -52, 16, -46, YM - 0.5, Y0 + 3.2, 'stone', { t: 0.3 });
    B.wall(12, -52, 16, -52, YM - 0.5, Y0 + 3.2, 'stone', { t: 0.3, holes: [[0.8, 2.4, 0.5, 3.1]] });
    B.box(11.8, Y0 + 3.2, -52.2, 16.2, Y0 + 3.45, -45.9, 'shingles', { flags: F.WALL });
    B.box(12.15, Y0 - 0.3, -48.05, 15.85, Y0, -46.2, 'planks', { flags: F.WALL });
    B.box(12.15, YM - 0.6, -51.85, 15.85, YM - 0.3, -48.05, 'grate', { flags: F.WALL });
    B.interior(12, YM - 0.5, -52, 16, Y0 + 3.2, -46);
    B.light(15.4, Y0 + 2.8, -47, [1, 0.8, 0.5], 6, { bulbR: 0.08 });
    B.light(15.4, YM + 2.6, -51.4, [1, 0.8, 0.5], 6, { bulbR: 0.08, id: 'mine' });
  }

  function tunnel(B, x0, z0, x1, z1, h, o) {
    B.room(x0, z0, x1, z1, YM, h, Object.assign({ floor: 'dirt', ceil: 'rock', wall: 'rock', t: 0.5 }, o));
  }
  function frames(B, pts, h, w) {
    for (const [x, z, yaw] of pts) B.at(x, YM, z, yaw, () => {
      for (const s of [-1, 1]) B.box(s * w / 2 - 0.12, 0, -0.12, s * w / 2 + 0.12, h - 0.2, 0.12, 'beam', { flags: F.SOLID | F.SHOT });
      B.vbox(-w / 2 - 0.12, h - 0.35, -0.14, w / 2 + 0.12, h - 0.1, 0.14, 'beam');
    });
  }
  function lamp(B, x, z, y) {
    B.at(x, y, z, 0, () => X.PROPS.lantern(B, { r: 8, flicker: 0.15, color: [1, 0.72, 0.4] }));
  }

  function mine(B) {
    tunnel(B, 12, -64, 16, -52, 3.2, { skip: 'ns' });
    tunnel(B, -34, -68, 16, -64, 3.2, { skip: 'w', doors: { n: [[32, 4, 3.2]], s: [[46, 4, 3.2]] } });
    tunnel(B, -6, -80, 6, -68, 3.6, { skip: 's' });
    tunnel(B, -64, -92, -34, -56, 10, { doors: { e: [[24, 4, 3.2]], w: [[20, 4, 3.2]] } });
    tunnel(B, -76, -72, -64, -68, 3.2, { skip: 'e' });
    B.interior(-76, YM - 0.5, -92, 16, YM + 10.5, -52);
    frames(B, [[14, -56, 0], [14, -60, 0], [8, -66, Math.PI / 2], [4, -66, Math.PI / 2], [-8, -66, Math.PI / 2], [-16, -66, Math.PI / 2], [-24, -66, Math.PI / 2], [-31, -66, Math.PI / 2], [-70, -70, Math.PI / 2]], 3.2, 3.8);
    for (const [x, z] of [[14, -58], [4, -66.2], [-12, -66.2], [-28, -66.2], [0, -74]]) lamp(B, x, z, YM + 2.7);
    B.at(-9, YM, -66, Math.PI / 2, () => X.PROPS.rails(B, { len: 50 }));
    B.prop('mine_cart', -20, YM, -66, Math.PI / 2, {});
    B.prop('crates', 6, YM, -65.2, 0.2, { n: 2 });

    for (let i = 0; i < 2; i++) B.prop('shelf', -5.4, YM, -77 + i * 4, Math.PI / 2, { w: 3.2, h: 2.4, fill: 'crate' });
    B.prop('crates', 3.8, YM, -78.4, 0.3, { n: 3 });
    B.prop('table', 0, YM, -73.5, 0, { w: 2, d: 1 });
    B.item('ammo', -0.4, YM + 0.8, -73.5, { w: 'm16', n: 90 });
    B.item('ammo', 0.5, YM + 0.8, -73.4, { w: 'sniper', n: 10 });
    B.item('grenades', 0.1, YM + 0.8, -73.8, { n: 3 });
    B.item('medkit', 4.6, YM + 0.1, -70, {});
    B.item('doc', -0.8, YM + 0.8, -73.8, { title: 'Опись арсенала', text: 'Винтовки М16 — 40. Гранаты — 6 ящиков. Газовые шашки — 12 (не трогать! Только по приказу Мангуста). Динамит — у Ирландца, в его норе в дальней выработке.' });

    for (const [x, z, r] of [[-50, -78, 1.5], [-44, -66, 1.2], [-57, -70, 1.3], [-40, -75.5, 1.1]]) B.cyl(x, YM, z, r, 10, 'rock', { sides: 7, flags: F.WALL });
    B.box(-63.5, YM + 3.8, -91.5, -36, YM + 4.1, -88, 'planks', { flags: F.WALL });
    B.box(-63.5, YM + 3.8, -88, -60, YM + 4.1, -60, 'planks', { flags: F.WALL });
    for (const [x, z] of [[-58, -88.2], [-50, -88.2], [-42, -88.2], [-36.3, -88.2], [-59.8, -80], [-59.8, -70], [-59.8, -60.3]]) B.cyl(x, YM, z, 0.14, 3.8, 'wood_dark', { sides: 6, flags: F.SOLID | F.SHOT });
    B.at(-50.5, YM + 4.1, -88, 0, () => X.PROPS.post_rail(B, { len: 19, h: 1.0 }));
    B.at(-37.3, YM + 4.1, -88, 0, () => X.PROPS.post_rail(B, { len: 2.6, h: 1.0 }));
    B.at(-60, YM + 4.1, -72, Math.PI / 2, () => X.PROPS.post_rail(B, { len: 21, h: 1.0 }));
    B.ladder(-39.5, -87.9, YM, YM + 5.1, 0, 0.7);
    B.ladder(-59.9, -61.2, YM, YM + 5.1, Math.PI / 2, 0.7);
    B.room(-48, -86, -40, -80.5, YM, 2.8, { floor: 'planks', ceil: 'planks', wall: 'planks_v', t: 0.15, doors: { e: [[2, 1.2]] }, windows: { s: [[3, 1.6]] } });
    B.prop('desk', -45.5, YM, -84.8, 0, { lamp: true });
    B.item('doc', -45.2, YM + 0.8, -84.6, { id: 'irishLog', title: 'Тетрадь Ирландца', text: 'Мангуст платит вдвое, если Тринадцатый будет живым. А я бы его пристрелил. Старик у озера упёрся — пришлось. Жаль, хороший был кофе. Динамит сложил у колонн — если что, рванём всю нору.' });
    B.item('medkit', -41, YM + 0.1, -85.4, {});
    B.item('ammo', -47, YM + 0.1, -81.2, { w: 'm16', n: 60 });
    B.light(-44, YM + 2.5, -83, [1, 0.72, 0.4], 6, { bulbR: 0.08, id: 'mine' });
    B.at(-49, YM, -66, Math.PI / 2, () => X.PROPS.rails(B, { len: 28 }));
    B.prop('mine_cart', -54, YM, -66, Math.PI / 2, {});
    B.prop('mine_cart', -42, YM, -66, Math.PI / 2, {});
    for (const [x, z] of [[-48.2, -76.6], [-48.6, -79.4], [-55.4, -71.6], [-42.6, -78.6]]) B.barrel(x, YM, z, { radius: 6, dmg: 260 });
    B.prop('crates', -62, YM, -76, 0.2, { n: 3 });
    B.prop('crates', -37, YM, -72, -0.3, { n: 2 });
    for (const [x, z] of [[-40, -60.5], [-60.2, -84], [-36, -84], [-52, -60]]) lamp(B, x, z, YM + 3.2);
    B.light(-49, YM + 8, -74, [1, 0.8, 0.55], 20, { bulbR: 0.2, id: 'mine' });
    B.vbox(-75.8, YM, -72, -75.6, YM + 3.2, -68, 'planks');
    B.light(-75, YM + 1.6, -70, [0.6, 0.7, 1], 5, { bulb: false });
  }

  function yard(B) {
    woodFence(B, -46, -3, -15, GT);
    woodFence(B, 3, 29, -15, GT);
    woodFence(B, 37, 46, -15, GT);
    for (const x of [-3, 3]) B.box(x - 0.18, GT, -15.18, x + 0.18, GT + 1.8, -14.82, 'wood_dark', { flags: F.WALL });
    B.vbox(3, GT + 0.2, -15.05, 3.12, GT + 1.4, -12.2, 'wood_dark');
    B.box(29.35, GT, -15.55, 29.85, GT + 1.1, -15.05, 'metal_grey', { flags: F.WALL });
    B.beam([29.6, GT + 1, -15], [30.2, GT + 5, -15.2], 0.07, 'hazard', { sides: 4 });
    B.prop('jeep', 34, GT, -30, 0.2, { mat: 'metal_green' });
    B.prop('truck', 38, GT, -40, 0.1, {});
    B.room(-32, -58, -27, -54, GT, 2.5, { floor: 'planks', ceil: null, wall: 'planks_v', t: 0.15, doors: { e: [[1.5, 1.1]] } });
    B.shed(-32, -58, -27, -54, GT + 2.5, GT + 2.9, 'n', 'corrugated', {});
    B.prop('generator', -30.6, GT, -56.6, 0, {});
    B.usable('power', -29.5, GT + 1.2, -56, { label: 'Заглушить генератор', r: 1.6 });
    B.interior(-31.9, GT - 0.2, -57.9, -27.1, GT + 2.8, -54.1);
    for (let i = 0; i < 3; i++) for (let k = 0; k < 4 - i; k++) B.hcyl(-24, GT + 0.3 + i * 0.54, -58 + k * 0.62 + i * 0.31, 0.3, 3.2, Math.PI / 2, 'bark', { sides: 8, solid: true, flags: F.WALL });
    B.vbox(-36, GT, -62.4, -30, GT + 3.2, -62.1, 'planks');
    for (let i = 0; i < 4; i++) B.vbox(-36.2, GT + 0.4 + i * 0.8, -62.05, -29.8, GT + 0.6 + i * 0.8, -61.95, 'wood_dark');
    B.sign('DANGER — OLD MINE', -33, GT + 3.6, -61.9, 3.2, 0.45, 0, { bg: '#e0d0a0', fg: '#8a1a10', font: 'sans' });
    for (const [x, z] of [[-24, -20], [24, -20], [-26, -50], [26, -50], [0, -18]]) B.prop('lamp_post', x, GT, z, 0, { id: 'yard', r: 10 });
    B.strip(DRIVE, 4.5, 'gravel');
    B.strip(PATH, 2, 'dirt');
  }

  function forest(B) {
    const r = X.rng(909);
    for (let i = 0; i < 230; i++) {
      const x = (r() - 0.5) * 220, z = 60 - r() * 200;
      if (z < -12 && z > -66 && Math.abs(x) < 50) continue;
      if (near(DRIVE, x, z, 5) || near(PATH, x, z, 3.5)) continue;
      if (z > 34 && z < 56 && Math.abs(x) < 70) continue;
      const kind = r() < 0.75 ? 'pine' : 'birch';
      B.tree(kind, x, z, { h: 9 + r() * 9, color: kind === 'pine' && r() < 0.6 ? 'dark' : null, solid: Math.abs(x) < 90 });
    }
    for (let i = 0; i < 30; i++) {
      const x = (r() - 0.5) * 180, z = 40 - r() * 150;
      if ((z < -12 && z > -66 && Math.abs(x) < 50) || near(DRIVE, x, z, 4) || near(PATH, x, z, 3)) continue;
      B.rock(x, z, 1 + r() * 2.4, {});
    }
  }

  X.addLevel({
    id: 'hideout', n: 9, name: 'Kellownee Hideout', sub: 'Охотничий дом над озером Келлоуни',
    env: {
      sky: { top: [0.02, 0.03, 0.07], mid: [0.05, 0.07, 0.14], hor: [0.14, 0.16, 0.24], below: [0.04, 0.04, 0.06], sun: [0.3, 0.5, -0.6], sunColor: [0.55, 0.62, 0.8], sunSize: 0.002, clouds: 0.35, cloudColor: [0.18, 0.2, 0.28], stars: 1, moon: [0.3, 0.5, -0.6], mountains: 1.1, mountainColor: [0.07, 0.08, 0.13] },
      light: { dir: [0.3, 0.7, -0.5], color: [0.38, 0.44, 0.62], ambient: [0.16, 0.18, 0.26], shadow: [0.14, 0.16, 0.24], indoor: [0.5, 0.42, 0.34] },
      fog: { color: [0.06, 0.07, 0.12], near: 22, far: 150 },
      grade: { tint: [0.94, 0.98, 1.08], sat: 0.85 }
    },
    light: 0.6,
    powerLight: 0.38,
    music: 'stealth',
    stealth: true,
    ambience: 'wind',
    loadout: { weapons: ['silenced', 'knife', 'm16', 'sniper', 'harpoon'], clip: { silenced: 15, m16: 30, sniper: 5, harpoon: 1 }, res: { silenced: 45, knife: 6, m16: 90, sniper: 10, harpoon: 6 }, medkits: 2, gadgets: { lockpick: true, hook: true }, skills: ['sense', 'marksman', 'silent', 'hands', 'cold', 'tough'], weapon: 'silenced' },
    build(B) {
      B.bounds(-80, -96, 56, 50);
      B.terrain({ x0: -240, z0: -260, x1: 240, z1: 160, cell: 4, fn: ground, mat: 'grass', steep: 'rock', high: 'snow', highY: 48, holes: [[12, -52, 16, -48]] });
      lodge(B);
      mine(B);
      yard(B);
      forest(B);
      B.searchlight(-18.5, TOP + 1.3, -27.6, Math.PI, { id: 'slW', sweep: 0.8, speed: 0.3, pitch: -0.38, range: 60, r: 10 });
      B.searchlight(18.5, TOP + 1.3, -27.6, Math.PI, { id: 'slE', sweep: 0.8, speed: 0.34, pitch: -0.38, range: 60, r: 10, phase: 1.7 });
      B.group('lift', 14, Y0, -50, 0, () => {
        B.box(-1.8, -0.3, -1.8, 1.8, 0, 1.8, 'grate', { flags: F.WALL });
        for (const sx of [-1, 1]) B.box(sx * 1.8 - 0.05, 0, -1.8, sx * 1.8 + 0.05, 1.1, 1.8, 'metal_yellow', { flags: F.SOLID | F.SHOT });
        B.box(1.2, 0, -0.3, 1.7, 1.0, 0.3, 'metal_grey', { flags: F.WALL });
        B.vbox(1.35, 1.0, -0.06, 1.45, 1.35, 0.06, 'red_paint');
        B.usable('lift', 1.3, 1.2, 0, { label: 'Рычаг подъёмника', r: 1.6, once: false });
      });

      B.spawnPlayer(-18, null, 46, -0.3);
      B.char('merc', -2.5, -13.4, { id: 'g1', look: Math.PI });
      B.char('merc', 2.6, -13.6, { id: 'g2', look: Math.PI - 0.3 });
      B.char('merc', 33, -17.4, { id: 'g3', look: Math.PI - 0.6 });
      B.char('merc', -26, -22, { id: 'p1', path: [[-26, -22], [26, -22], [26, -58], [-26, -58]], wait: 1 });
      B.char('killer', -34, -40, { id: 'p2', path: [[-34, -40], [-34, -60], [-12, -60]], wait: 2 });
      B.char('killer', 4.2, -26, { y: Y0, id: 'g4', look: Math.PI });
      B.char('merc', 35.4, -35.6, { id: 'g5', look: -Math.PI / 2 });
      B.char('merc2', 14, -50, { y: Y0 + 3.45, id: 'sn', static: true, sight: 60, look: Math.PI / 2 });
      B.char('killer', -18.4, -30.4, { y: Y0, id: 'k1', look: Math.PI });
      B.char('killer', -14, -43.8, { y: Y0, id: 'k2', look: Math.PI });
      B.char('killer', 14, -41.6, { y: Y0, id: 'k3', pose: 'sit', static: true, look: Math.PI });
      B.char('commando', 10, -34, { y: Y0, id: 'k4', path: [[10, Y0, -34], [18, Y0, -34]], wait: 3 });
      B.char('killer', 3.4, -43, { y: Y0, id: 'h1', look: Math.PI });
      B.char('killer', -18, -32, { y: Y1, id: 'u1', path: [[-18, Y1, -32], [-10, Y1, -32]], wait: 2 });
      B.char('commando', -5, -44.5, { y: Y1, id: 'u2', path: [[-5, Y1, -44.5], [5, Y1, -44.5]], wait: 2 });
      B.char('killer', 16, -34, { y: Y1, id: 'u3', look: Math.PI / 2 });
      B.char('merc', 8, -66, { y: YM, id: 'm1', path: [[8, YM, -66], [-24, YM, -66]], wait: 2 });
      B.char('merc', -3.6, -76, { y: YM, id: 'm2', pose: 'sit', static: true, look: -Math.PI / 2 });
      B.char('merc2', 3, -77.6, { y: YM, id: 'm3', look: Math.PI / 2 });
      B.char('commando', -37.5, -62, { y: YM, id: 'm4', look: -Math.PI / 2 });
      B.char('irish', -50, -73, { y: YM, id: 'irish', hp: 1100, grenadier: true, points: IRISH_POINTS, sight: 45, bossName: 'Ирландец', taunts: ['Иди сюда, красавчик!', 'Старик тоже прятался!', 'Мангуст заплатит за тебя вдвое — живого или нет!', 'Ну же, Тринадцатый!'] });
      B.char('merc2', -50, -90, { y: YM + 4.1, id: 'c1', static: true, sight: 60, look: Math.PI });
      B.char('merc', -38, -82, { y: YM, id: 'c2', look: Math.PI / 2 });
      for (const [i, x, z] of [[0, -72, -70], [1, -70, -69.2], [2, -74, -70.8]]) B.char('commando', x, z, { y: YM, id: 'ad' + i, group: 'adit', hidden: true, aggressive: true, grenadier: i === 1 });

      B.trigger('inside', -7.5, Y0 - 0.5, -45, 7.5, Y0 + 3, -29);
      B.trigger('back', -40, GT - 1, -62, 40, GT + 4, -47);
      B.trigger('cavern', -63, YM - 0.5, -91, -35, YM + 3, -57, { noReach: true });
      B.cam('bookCam', [10.5, Y0 + 2.1, -40.8], [14, Y0 + 1.3, -46], 50);
      B.cam('cavernCam', [-37, YM + 6.5, -59], [-50, YM + 1.4, -73], 52);
      B.cam('yardCam', [20, TOP + 1.8, -26], [0, GT + 1, -14], 50);
    },
    script(S) {
      S.on('start', g => {
        g.objective('enter', 'Проникнуть в охотничий дом');
        g.objective('power', 'Необязательно: заглушить генератор за домом', { optional: true });
        g.caption('Охотничий дом над Келлоуни. Здесь собирается Двадцатка. И где-то здесь — Ирландец.', 5.5);
        g.after(6, () => g.radio('jones', 'Джонс на связи. Я на хребте с винтовкой. Два прожектора на крыше, генератор — в сарае за домом, с запада.'));
      });
      S.zone('back', g => g.msg('Сарай с генератором — у дровяника.', 3));
      S.use('power', g => {
        g.setFlag('powerOff');
        for (const l of g.world.lights) if (l.id === 'yard' || l.id === 'house') l.on = false;
        g.complete('power');
        g.msg('Генератор заглох. Прожекторы и свет в доме погасли.', 4);
        g.radio('jones', 'Темнота — твоя подруга. Внутри теперь только камин.', 4);
        g.checkpoint('power');
      });
      S.zone('inside', g => {
        g.complete('enter');
        g.objective('protocol', 'Найти протокол собрания «XX»');
        g.checkpoint('inside');
      });
      S.pick('protocol', g => {
        g.complete('protocol');
        g.comic('xx');
        g.objective('passage', 'Найти ход, которым ушёл Ирландец');
        g.checkpoint('protocol');
      });
      S.pick('file', g => g.memory('knives', 'Полоса препятствий, мишени-силуэты. Нож ложится в ладонь, как продолжение пальцев. Три броска — три попадания. Инструктор Роуланд. Это был я.'));
      S.use('book', g => {
        const d = g.door('secret');
        if (!d) return;
        d.locked = null;
        g.openDoor(d, g.player.pos);
        g.panel({ kind: 'cam', cam: 'bookCam', dur: 2.6, text: 'ЩЁЛК!' });
        g.msg('Шкаф отъехал в сторону. За ним — клеть подъёмника.', 3.5);
        if (!g.objectives.find(o => o.id === 'protocol' && o.done)) g.complete('protocol');
        g.objective('passage', 'Найти ход, которым ушёл Ирландец');
        g.complete('passage');
        g.objective('irish', 'Спуститься в арсенал и найти Ирландца');
      });
      S.use('lift', g => {
        const lift = g.groups.find(q => q.id === 'lift');
        if (!lift || lift.moving) return;
        const down = lift.pos[1] > (Y0 + YM) / 2;
        g.moveGroup('lift', [[14, down ? YM : Y0, -50]], 2.4, down ? 'liftBottom' : 'liftTop');
        g.msg(down ? 'Клеть пошла вниз.' : 'Клеть пошла вверх.', 2);
      });
      S.on('liftBottom', g => {
        if (g.flags.mineReached) return;
        g.setFlag('mineReached');
        g.caption('Сырость, запах карбида и оружейной смазки. Старый рудник под домом.', 4.5);
        g.radio('jones', 'Тринадцатый, связь... пропадает... осторожней...', 3);
        g.checkpoint('mine');
      });
      S.zone('cavern', g => {
        g.objective('irish', 'Спуститься в арсенал и найти Ирландца');
        g.panel({ kind: 'cam', cam: 'cavernCam', dur: 3, text: 'ИРЛАНДЕЦ', tint: 'red' });
        g.say('irish', 'А вот и ты! Мангуст просил живым. Я скажу, что не получилось!', 4);
        const ir = g.char('irish');
        if (ir && ir.state === 'alive') X.AI.alert(g, ir, g.player.pos);
        for (const id of ['c1', 'c2', 'm4']) { const c = g.char(id); if (c && c.state === 'alive') X.AI.alert(g, c, g.player.pos); }
        g.music('boss');
        g.checkpoint('cavern');
      });
      S.dead('irish', g => {
        g.complete('irish');
        g.music('calm');
        g.say('xiii', 'Ирландец больше никого не убьёт.', 3);
        g.after(2.2, () => {
          g.flags.gasT = g.time;
          g.caption('Шипение за спиной. Сладкий запах... Газ! Ноги становятся ватными...', 4);
          g.after(3.4, () => g.finish());
        });
      });
      S.on('restore', g => {
        if (g.flags.powerOff) for (const l of g.world.lights) if (l.id === 'yard' || l.id === 'house') l.on = false;
        const d = g.door('secret');
        if (d && g.flags['!use:book']) { d.locked = null; d.target = 1; d.open = 1; g.placeDoor(d); }
      });
    },
    tick(g) {
      const ir = g.char('irish');
      if (ir && ir.state === 'alive' && !g.flags.aditCalled && ir.health < ir.maxHealth * 0.55) {
        g.setFlag('aditCalled');
        g.spawn('adit', g.player.pos);
        g.say('irish', 'Парни! Все сюда, в нору!', 3);
      }
    },
    post(g) {
      if (!g.flags.gasT) return null;
      const k = X.clamp((g.time - g.flags.gasT) / 3.2, 0, 1);
      return { flash: k * 0.92, flashCol: [0.62, 0.72, 0.5], sat: 1 - k * 0.6 };
    },
    comics: {
      intro: [
        {
          rows: [{ h: 0.56, w: [1] }, { h: 0.44, w: [0.52, 0.48] }],
          panels: [
            { cam: { pos: [-34, 22, 34], look: [0, 33, -38], fov: 50 }, actors: [], text: [{ k: 'cap', t: 'Охотничий дом над Келлоуни. Окна горят, на крыше — прожекторы. Двадцатка любит комфорт.', x: 0.03, y: 0.05, w: 0.6 }] },
            { shot: { on: 0, dist: 0.85, height: 0.05, angle: -25, fov: 36, target: 'head' }, actors: [{ type: 'jones', pos: [0, 0, 0], yaw: 0, pose: 'phone', float: true }], hideWorld: true, bg: [0.2, 0.26, 0.4], text: [{ k: 'say', t: 'Я на хребте с винтовкой. Ирландец приехал час назад. Больше не выходил.', x: 0.05, y: 0.05, w: 0.9, who: 0 }] },
            { art: 'silhouette', artOpt: { a: '#3a4a7a', b: '#080a14', glint: true }, text: [{ k: 'say', t: 'На этот раз он не уплывёт.', x: 0.06, y: 0.64, w: 0.88, tail: [0.5, 0.35] }] }
          ]
        }
      ],
      xx: [
        {
          rows: [{ h: 1, w: [0.55, 0.45] }],
          panels: [
            { art: 'dossier', artOpt: { names: ['I — «НОМЕР ОДИН»', 'II — ?', 'XIII — РОУЛАНД', 'XX — ?'] }, text: [{ k: 'cap', t: 'Протокол собрания. Двадцать стульев.', x: 0.05, y: 0.05, w: 0.8 }] },
            { cam: { pos: [-11, Y0 + 2.2, -30.5], look: [-14, Y0 + 0.9, -41], fov: 50 }, actors: [], tint: 'red', text: [{ k: 'think', t: 'Один из них — мой. Тринадцатый.', x: 0.06, y: 0.06, w: 0.86 }] }
          ]
        }
      ],
      outro: [
        {
          rows: [{ h: 0.5, w: [0.5, 0.5] }, { h: 0.5, w: [1] }],
          panels: [
            { cam: { pos: [-44, YM + 1.2, -70], look: [-48, YM + 0.3, -74], fov: 46 }, actors: [{ type: 'xiii', pos: [-48, YM, -74], yaw: 0.8, pose: 'ko' }, { type: 'killer', pos: [-45.5, YM, -76.5], yaw: -0.6, pose: 'aim_rifle', gun: 'm16' }], tint: 'grey', text: [{ k: 'cap', t: 'Газ сделал своё дело.', x: 0.04, y: 0.05, w: 0.6 }] },
            { shot: { on: 0, dist: 0.9, height: 0.08, angle: -20, fov: 34, target: 'head' }, actors: [{ type: 'mongoose', pos: [0, 0, 0], yaw: 0, pose: 'talk', float: true }], hideWorld: true, bg: [0.42, 0.44, 0.34], text: [{ k: 'say', t: 'Спокойной ночи, Тринадцатый. Проснёшься в Плейн-Рок.', x: 0.05, y: 0.05, w: 0.9, who: 0 }] },
            { art: 'silhouette', artOpt: { a: '#6a7280', b: '#101216' }, text: [{ k: 'cap', t: 'Федеральная тюрьма Плейн-Рок. Три дня спустя.', x: 0.05, y: 0.06, w: 0.86 }] }
          ]
        }
      ]
    }
  });
})(globalThis.XIII = globalThis.XIII || {});
