(function (X) {
  'use strict';
  const F = X.F;
  const sm = t => X.smooth(X.clamp(t, 0, 1));
  const RX = 80, RZ = 55, CZ = -55;
  const ISL = [-8, -62];
  const CIRCLES = [[90, -45, 13, 1.6], [12, -121, 11, 1.8], [-64, -106, 14, 1.3], [60, -113, 8, 2.7], [-7, -61, 3.5, 2.2], [-40, 30, 7, 6.2], [-78, -124, 9, 4.6], [-79, -103, 5, 3.2]];
  const RECTS = [[5, 2, 25, 15, 0.45]];
  const BOAT_R = 22;
  const LOOP = [];
  for (let i = 0; i < 14; i++) { const a = -i / 14 * Math.PI * 2; LOOP.push([ISL[0] + Math.cos(a) * BOAT_R, 0, ISL[1] + Math.sin(a) * BOAT_R]); }
  const IRISH_PATH = [[40, 0, -62], [10, 0, -88], [-30, 0, -92], [-52, 0, -76], [-57.8, 0, -76], [-57.8, 0, -86]];
  const IRISH_AWAY = [[-50, 0, -68], [-10, 0, -40], [40, 0, -30], [70, 0, -40]];
  const ROAD = [[-44, 46], [-40, 30], [-20, 16], [0, 14], [30, 15], [60, 6], [84, -12], [92, -45], [86, -80], [66, -108], [40, -126], [18, -134], [-10, -136], [-40, -129], [-62, -118], [-80, -124], [-94, -144]];

  function lakeD(x, z) { return Math.hypot(x / RX, (z - CZ) / RZ); }
  function ground(x, z) {
    const d = lakeD(x, z);
    let h = d < 1 ? -Math.min(7.5, (1 - d) * 34) : Math.min(d - 1, 0.6) * 10 + Math.max(0, d - 1.6) * 34;
    const di = Math.hypot(x - ISL[0], z - ISL[1]) / 10;
    h = Math.max(h, 2.4 - 2.2 * di * di);
    const land = sm((d - 1.1) / 0.25);
    h += (Math.sin(x * 0.07 + 0.3) * Math.cos(z * 0.06 - 0.8) * 2.2 + Math.sin(x * 0.19 - z * 0.13) * 0.7) * land;
    for (const [fx, fz, r, fh] of CIRCLES) { const k = sm((r - Math.hypot(x - fx, z - fz)) / 5); if (k > 0) h = h * (1 - k) + fh * k; }
    for (const [x0, z0, x1, z1, fh] of RECTS) { const k = sm(1 + Math.min(x - x0, x1 - x, z - z0, z1 - z) / 4); if (k > 0) h = h * (1 - k) + fh * k; }
    return h;
  }

  function nearRoad(x, z, w) {
    for (let i = 0; i < ROAD.length - 1; i++) {
      const a = ROAD[i], b = ROAD[i + 1];
      const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz;
      const t = X.clamp(((x - a[0]) * dx + (z - a[1]) * dz) / l2, 0, 1);
      if (Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t) < w) return true;
    }
    return false;
  }

  function pier(B, x0, z0, x1, z1, y) {
    B.box(x0, y - 0.2, z0, x1, y, z1, 'planks', { flags: F.WALL });
    const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
    const len = alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
    for (let t = 0.4; t < len; t += 2.6) for (const sd of [0, 1]) {
      const px = alongX ? Math.min(x0, x1) + t : (sd ? Math.max(x0, x1) - 0.12 : Math.min(x0, x1) + 0.12);
      const pz = alongX ? (sd ? Math.max(z0, z1) - 0.12 : Math.min(z0, z1) + 0.12) : Math.min(z0, z1) + t;
      B.cyl(px, -4, pz, 0.12, y + 3.95, 'wood_dark', { solid: false, sides: 6 });
    }
  }

  function boathouse(B) {
    const Y = 0.6;
    B.box(4.8, Y - 0.25, -8, 12, Y, 8, 'planks', { flags: F.WALL });
    B.box(18, Y - 0.25, -8, 25.2, Y, 8, 'planks', { flags: F.WALL });
    B.box(12, Y - 0.25, 3, 18, Y, 8, 'planks', { flags: F.WALL });
    for (const x of [5, 11.8, 18.2, 25]) for (const z of [-7.8, -3, 2]) B.cyl(x, -4, z, 0.14, Y + 3.8, 'wood_dark', { solid: false, sides: 6 });
    B.wall(4.8, 8, 25.2, 8, Y, Y + 3.6, 'planks_v', { t: 0.2, holes: [[9.2, 1.4], [2, 2, 1.2, 2.4, true], [16, 2, 1.2, 2.4, true]] });
    B.wall(4.8, -8, 4.8, 8, Y, Y + 3.6, 'planks_v', { t: 0.2, holes: [[6, 2, 1.2, 2.4, true]] });
    B.wall(25.2, -8, 25.2, 8, Y, Y + 3.6, 'planks_v', { t: 0.2, holes: [[2, 1.4], [9, 2, 1.2, 2.4, true]] });
    B.wall(4.8, -8, 25.2, -8, Y, Y + 3.6, 'planks_v', { t: 0.2, holes: [[7.2, 6, 0, 2.8]] });
    B.roof(4.8, -8, 25.2, 8, Y + 3.6, 2.2, 'x', 'shingles', { over: 0.5, wall: 'planks_v' });
    B.interior(4.9, Y - 0.3, -7.9, 25.1, Y + 5.6, 7.9);
    B.at(15, 0.05, -2.5, 0, () => X.PROPS.rowboat(B, {}));
    B.prop('table', 7, Y, 0, Math.PI / 2, { w: 2.4, d: 1 });
    B.prop('chair', 8.4, Y, 1.8, -Math.PI / 2, {});
    B.item('weapon', 7, Y + 0.8, 0.4, { w: 'harpoon', n: 6, id: 'harpoon' });
    B.item('ammo', 7.1, Y + 0.8, -0.7, { w: 'harpoon', n: 4 });
    B.item('doc', 6.8, Y + 0.8, 1.1, { title: 'Приказ по отряду', text: 'Всем постам у озера. Блондин с татуировкой XIII на ключице может появиться у хижины старика. Живым не брать. Старика — не трогать до приезда Ирландца. Премия — пять тысяч за голову.' });
    B.prop('crates', 22.8, Y, 5, 0.2, { n: 3 });
    B.prop('shelf', 24.6, Y, -1.5, -Math.PI / 2, { w: 2.6, h: 2, fill: 'crate' });
    B.item('medkit', 23.6, Y + 0.1, 3.4, {});
    for (const [x, z] of [[6, -6.5], [22, -6.2]]) B.barrel(x, Y, z, {});
    B.light(9, Y + 3.2, 0, [1, 0.8, 0.5], 8, { bulbR: 0.1 });
    B.light(21, Y + 3.2, 0, [1, 0.8, 0.5], 8, { bulbR: 0.1 });
    pier(B, 25.2, -30, 27.4, -4.6, Y);
    B.at(26.3, Y, -29.6, 0, () => X.PROPS.lantern(B, {}));
  }

  function cabin(B, x0, z0, x1, z1, y, o) {
    B.room(x0, z0, x1, z1, y, 3, { floor: 'wood_floor', ceil: 'ceiling_wood', wall: 'wood_dark', t: 0.25, doors: o.doors || {}, windows: o.windows || {} });
    B.roof(x0, z0, x1, z1, y + 3, o.rh || 1.8, o.axis || 'x', 'shingles', { over: 0.5, wall: 'wood_dark' });
    B.interior(x0 + 0.15, y - 0.3, z0 + 0.15, x1 - 0.15, y + 3.2, z1 - 0.15);
  }

  function bensCabin(B) {
    const Y = 1.9;
    cabin(B, 6, -126, 18, -116, Y, { doors: { s: [[5.4, 1.2]] }, windows: { e: [[3, 1.4]], w: [[3, 1.4]], s: [[1.5, 1.6], [9, 1.6]] } });
    B.box(6, Y - 0.3, -116, 18, Y, -113.4, 'planks', { flags: F.WALL });
    for (const x of [6.2, 17.8]) B.cyl(x, Y, -113.6, 0.1, 2.9, 'wood_dark', { solid: false, sides: 6 });
    B.vbox(5.6, Y + 2.9, -116.2, 18.4, Y + 3.05, -113.2, 'planks');
    B.prop('fireplace', 12, Y, -125.3, 0, {});
    B.light(12, Y + 0.5, -124.8, [1, 0.55, 0.25], 7, { flicker: 0.6, bulbR: 0.08 });
    B.prop('bed', 16.4, Y, -123.5, Math.PI / 2, { mat: 'fabric_red' });
    B.prop('bookshelf', 6.6, Y, -122, Math.PI / 2, { w: 2.2 });
    B.prop('table', 10, Y, -121, 0, { w: 1.8, d: 1 });
    B.prop('chair', 8.4, Y, -119.9, 2.6, {});
    B.prop('armchair', 14.6, Y, -119, Math.PI + 0.4, {});
    B.item('doc', 9.6, Y + 0.8, -121, { id: 'diary', title: 'Дневник Бена', text: 'Стиви заходил в последний раз осенью восемьдесят шестого. С ним была Ким — светлая, как озеро в июне. Он сказал: «Если со мной что-то случится, Бен, не верь газетам». Вчера у причала крутились люди Ирландца. Я старый, но не слепой.' });
    B.item('doc', 13.1, Y + 1.5, -125.0, { id: 'photo', title: 'Фотография', text: 'Выцветший снимок: двое на причале у красной лодки. На обороте карандашом: «Стив и Ким, Келлоуни, 1986».' });
    B.item('medkit', 16.8, Y + 0.1, -119, {});
    B.item('food', 10.4, Y + 0.8, -120.8, { n: 20, name: 'Кофе из термоса' });
    B.light(12, Y + 2.6, -120, [1, 0.8, 0.5], 7, { bulbR: 0.1 });
    pier(B, 11, -112, 13, -97, 0.6);
    B.at(14.3, 0.05, -101, 0.2, () => { X.PROPS.rowboat(B, {}); B.vbox(-0.67, 0.3, -1.72, 0.67, 0.56, 1.72, 'red_paint'); });
  }

  function checkpoint(B) {
    const Y = 1.6;
    for (const x of [86.5, 93.5]) B.at(x, Y, -40, 0, () => X.PROPS.jersey(B, {}));
    B.at(90, Y, -48, 0, () => X.PROPS.sandbags(B, { len: 3.2 }));
    B.prop('jeep', 95.5, Y, -44, 0.2, { mat: 'metal_green' });
    B.prop('tent', 97, Y, -36, 0, {});
    B.prop('crates', 84.5, Y, -50, 0.3, { n: 2 });
    B.item('ammo', 94.2, Y + 0.1, -35.2, { w: 'm16', n: 60 });
    B.item('grenades', 94.4, Y + 0.1, -37.2, { n: 2 });
    B.item('doc', 84.6, Y + 1.25, -50, { title: 'Список постов', text: 'Пост 1 — дорога. Пост 2 — лодочный сарай. Катер — вокруг острова до темноты, прожектор не выключать. На острове — Галлахер с винтовкой. Ирландец прибудет к хижине, когда старик заговорит.' });
    B.at(99, Y, -52, 0, () => X.PROPS.watchtower(B, { h: 6, roof: 'shingles' }));
    B.at(91, Y + 2.2, -36, 0, () => X.PROPS.lantern(B, {}));
    pier(B, 70, -57, 82, -54.6, 0.6);
  }

  function lodge(B) {
    cabin(B, 55, -117, 65, -109, 2.8, { doors: { w: [[3, 1.2]] }, windows: { s: [[2, 1.4], [6.5, 1.4]] } });
    B.prop('bunk', 63.8, 2.8, -113, -Math.PI / 2, { mat: 'fabric' });
    B.prop('table', 58.5, 2.8, -112.5, 0, { w: 1.6, d: 0.9 });
    B.item('doc', 58.4, 3.6, -112.4, { title: 'Карта с пометками', text: 'Круг на северном склоне: «охотничий дом». Подпись рукой Ирландца: «Сбор Двадцатки — после Келлоуни. Гостей встречать у рудника».' });
    B.item('ammo', 64, 2.9, -116, { w: 'sniper', n: 10 });
    B.light(60, 5.4, -113, [1, 0.8, 0.5], 7, { bulbR: 0.1 });
  }

  function island(B) {
    B.at(-7, 2.2, -61, 0.3, () => X.PROPS.watchtower(B, { h: 4.5, roof: 'shingles' }));
    B.room(-13, -57, -9.5, -54, 1.2, 2.2, { floor: 'planks', ceil: null, wall: 'planks_v', t: 0.12, doors: { e: [[1, 1]] } });
    B.shed(-13, -57, -9.5, -54, 3.4, 3.8, 'n', 'corrugated', {});
    B.item('ammo', -11.2, 1.3, -55.5, { w: 'sniper', n: 10 });
    B.item('doc', -12.2, 1.3, -56.2, { title: 'Записка Галлахера', text: 'Катер ходит против часовой, круг — минуты три. Когда прожектор уходит на север, у южного берега — темно. Если кто и поплывёт, то там.' });
    B.at(-3, 0.05, -52, -0.6, () => X.PROPS.rowboat(B, {}));
  }

  function sawmill(B) {
    const Y = 1.4;
    B.box(-73, Y - 0.4, -114, -53, Y, -98, 'concrete', { flags: F.WALL });
    for (const x of [-72.6, -63, -53.4]) for (const z of [-113.6, -106, -98.4]) B.box(x - 0.18, Y, z - 0.18, x + 0.18, Y + 5.6, z + 0.18, 'wood_dark', { flags: F.SOLID | F.SHOT });
    B.shed(-73, -114, -53, -98, Y + 5.4, Y + 6.8, 'n', 'corrugated', { over: 0.6 });
    B.box(-69, Y, -108, -61, Y + 0.9, -106.6, 'metal_grey', { flags: F.WALL });
    B.cyl(-65, Y + 0.3, -107.3, 0.75, 0.04, 'metal', { solid: false, sides: 16 });
    for (let i = 0; i < 3; i++) for (let k = 0; k < 3 - i; k++) B.hcyl(-58, Y + 0.3 + i * 0.54, -110.5 + k * 0.62 + i * 0.31, 0.3, 5, Math.PI / 2, 'bark', { sides: 8, solid: true, flags: F.WALL });
    for (let i = 0; i < 2; i++) for (let k = 0; k < 4 - i; k++) B.hcyl(-70, Y + 0.3 + i * 0.54, -103.2 + k * 0.62 + i * 0.31, 0.3, 5.5, Math.PI / 2, 'bark', { sides: 8, solid: true, flags: F.WALL });
    B.box(-61, Y - 0.4, -98, -59, 1.0, -97, 'planks', { flags: F.WALL });
    pier(B, -61, -97, -59, -82, 1.0);
    B.room(-82, -106, -76, -100, 3.2, 2.6, { floor: 'planks', ceil: 'ceiling_wood', wall: 'planks_v', t: 0.15, doors: { e: [[2, 1.1]] }, windows: { s: [[2, 1.4]] } });
    B.roof(-82, -106, -76, -100, 5.8, 1.1, 'x', 'shingles', { over: 0.35, wall: 'planks_v' });
    B.interior(-81.9, 3.0, -105.9, -76.1, 6, -100.1);
    B.item('ammo', -79, 3.3, -104.5, { w: 'm16', n: 60 });
    B.item('medkit', -80.8, 3.3, -101, {});
    for (const [x, z] of [[-66, -110], [-57, -101]]) B.at(x, Y + 2.6, z, 0, () => X.PROPS.lantern(B, {}));
    B.prop('truck', -80, 4.6, -126.5, 0.35, { mat: 'metal_blue' });
  }

  function patrolBoat(B) {
    B.box(-1.2, -0.6, -3.2, 1.2, 0.5, 3.0, 'boat_white', { flags: F.WALL, top: 'planks' });
    B.quad([[-1.2, 0.5, -3.2], [1.2, 0.5, -3.2], [0, 0.5, -4.6]], 'planks', { two: true });
    B.quad([[-1.2, -0.6, -3.2], [0, -0.3, -4.6], [0, 0.5, -4.6], [-1.2, 0.5, -3.2]], 'boat_white', { two: true });
    B.quad([[1.2, -0.6, -3.2], [1.2, 0.5, -3.2], [0, 0.5, -4.6], [0, -0.3, -4.6]], 'boat_white', { two: true });
    for (const sx of [-1, 1]) B.box(sx * 1.2 - 0.06, 0.5, -3.2, sx * 1.2 + 0.06, 0.9, 3.0, 'boat_white', { flags: F.SOLID | F.SHOT });
    B.box(-0.8, 0.5, 0.2, 0.8, 1.9, 1.6, 'boat_white', { flags: F.WALL });
    B.vbox(-0.81, 1.35, 0.18, 0.81, 1.75, 1.2, 'car_glass');
    B.box(-0.3, -0.3, 3.0, 0.3, 0.9, 3.5, 'metal_dark', { flags: F.SOLID | F.SHOT });
    B.at(0, 1.9, 0.9, 0, () => X.PROPS.searchlight(B, {}));
    B.vbox(-1.25, 0.15, -3.2, 1.25, 0.3, 3.0, 'red_paint');
  }

  function scenery(B) {
    const r = X.rng(808);
    for (let i = 0; i < 260; i++) {
      const a = r() * Math.PI * 2, d = 1.12 + r() * 1.1;
      const x = Math.cos(a) * RX * d, z = CZ + Math.sin(a) * RZ * d;
      if (nearRoad(x, z, 5.5)) continue;
      if (CIRCLES.some(c => Math.hypot(x - c[0], z - c[1]) < c[2] + 2) || RECTS.some(q => x > q[0] - 3 && x < q[2] + 3 && z > q[1] - 3 && z < q[3] + 3)) continue;
      const kind = r() < 0.45 ? 'pine' : (r() < 0.5 ? 'birch' : 'oak');
      B.tree(kind, x, z, { h: 8 + r() * 8, color: kind === 'pine' ? (r() < 0.5 ? 'dark' : null) : null, solid: Math.abs(x) < 100 && z > -150 && z < 50 });
    }
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2, d = 1.05 + r() * 0.4;
      const x = Math.cos(a) * RX * d, z = CZ + Math.sin(a) * RZ * d;
      if (nearRoad(x, z, 4) || CIRCLES.some(c => Math.hypot(x - c[0], z - c[1]) < c[2] + 2) || RECTS.some(q => x > q[0] - 3 && x < q[2] + 3 && z > q[1] - 3 && z < q[3] + 3)) continue;
      B.rock(x, z, 0.8 + r() * 1.8, {});
    }
    for (let i = 0; i < 5; i++) B.tree('pine', ISL[0] - 4 + r() * 8, ISL[1] + 3 + r() * 4, { h: 6 + r() * 4 });
  }

  X.addLevel({
    id: 'lake', n: 8, name: 'Kellownee Lake', sub: 'Озеро Келлоуни, Монтана',
    env: {
      sky: { top: [0.16, 0.18, 0.36], mid: [0.52, 0.38, 0.48], hor: [0.98, 0.64, 0.4], below: [0.3, 0.26, 0.32], sun: [-0.82, 0.12, -0.3], sunColor: [1, 0.62, 0.3], sunSize: 0.006, clouds: 0.5, cloudColor: [0.92, 0.56, 0.46], mountains: 1.2, mountainColor: [0.3, 0.26, 0.38] },
      light: { dir: [-0.8, 0.36, -0.3], color: [1.0, 0.68, 0.44], ambient: [0.36, 0.32, 0.44], shadow: [0.3, 0.27, 0.4], indoor: [0.6, 0.5, 0.44] },
      fog: { color: [0.62, 0.48, 0.5], near: 40, far: 270 },
      grade: { tint: [1.04, 0.98, 0.96], sat: 0.95 }
    },
    light: 0.72,
    music: 'stealth',
    stealth: true,
    ambience: 'forest',
    loadout: { weapons: ['silenced', 'knife', 'm16', 'sniper'], clip: { silenced: 15, m16: 30, sniper: 5 }, res: { silenced: 45, knife: 6, m16: 90, sniper: 10 }, medkits: 2, gadgets: { lockpick: true, hook: true }, skills: ['sense', 'marksman', 'silent', 'hands', 'cold'], weapon: 'silenced' },
    build(B) {
      B.bounds(-100, -150, 104, 50);
      B.terrain({ x0: -240, z0: -260, x1: 240, z1: 160, cell: 4, fn: ground, mat: 'grass', steep: 'rock', low: 'sand_wet', lowY: 0.35 });
      B.water(-104, -128, 104, 8, 0, { color: [0.2, 0.3, 0.38] });
      B.strip(ROAD, 4.2, 'dirt');
      B.strip([[0, 14], [8, 12], [14.6, 9.5]], 3, 'dirt');
      boathouse(B);
      bensCabin(B);
      checkpoint(B);
      lodge(B);
      island(B);
      sawmill(B);
      scenery(B);

      const hd = Math.atan2(-(LOOP[1][0] - LOOP[0][0]), -(LOOP[1][2] - LOOP[0][2]));
      B.group('boat', LOOP[0][0], 0, LOOP[0][2], hd, () => {
        patrolBoat(B);
        B.char('merc', 0.4, -2.3, { y: 0.5, id: 'pb1', group: 'boat', weapon: 'kalash', sight: 40 });
        B.char('merc', -0.4, 2.3, { y: 0.5, id: 'pb2', group: 'boat', weapon: 'shotgun', sight: 40, look: Math.PI });
      }, { carry: [-1.2, -0.2, -4.6, 1.2, 2.2, 3.5] });
      B.searchlight(LOOP[0][0], 3.1, LOOP[0][2], hd, { id: 'boatLight', noProp: true, sweep: 1.1, speed: 0.45, pitch: -0.2, range: 44, r: 11 });
      B.group('irish', 72, 0, -53.5, Math.PI / 2, () => {
        patrolBoat(B);
        B.char('merc', 0.5, -2.2, { y: 0.5, id: 'ic1', group: 'irishCrew', weapon: 'kalash', sight: 45 });
        B.char('merc', -0.5, -1.2, { y: 0.5, id: 'ic2', group: 'irishCrew', weapon: 'shotgun', sight: 45 });
        B.char('merc2', 0.4, 2.3, { y: 0.5, id: 'ic3', group: 'irishCrew', sight: 45 });
        B.char('irish', -0.2, 2.2, { y: 0.5, id: 'irish', hidden: true, invuln: true, look: Math.PI / 2 });
      }, { carry: [-1.2, -0.2, -4.6, 1.2, 2.2, 3.5] });

      B.spawnPlayer(-40, null, 30, -0.44);
      B.char('carrington', -77.4, -122.4, { id: 'carrington', static: true, weapon: 'beretta', look: 2.4, invuln: true, untargetable: true });
      B.char('merc', -20, 16, { id: 'r1', path: [[-20, 16], [12, 14]], wait: 2 });
      B.char('merc', -5, 19.5, { id: 'r2', look: -0.4 });
      B.char('merc', 8.4, 1.8, { y: 0.6, id: 'b1', pose: 'sit', static: true, look: Math.PI / 2 });
      B.char('merc', 20.5, -6, { y: 0.6, id: 'b2', path: [[20.5, 0.6, -6], [20.5, 0.6, 5.5]], wait: 3 });
      B.char('merc2', 26.3, -28.6, { y: 0.6, id: 'b3', look: 0 });
      B.char('merc2', -7.4, -61.4, { y: 6.9, id: 'isl', ai: 'sniper', static: true, sight: 80, look: 1.2 });
      B.char('merc', 88, -38, { id: 'c1', look: Math.PI });
      B.char('merc', 92, -38.5, { id: 'c2', look: Math.PI + 0.3 });
      B.char('merc', 96, -41, { id: 'c3', path: [[96, -41], [96, -56]], wait: 2 });
      B.char('merc2', 99.2, -52.4, { y: 7.8, id: 'c4', ai: 'sniper', static: true, sight: 75, look: Math.PI });
      B.char('merc', 88, -50, { id: 'c5', look: 0.5 });
      B.char('merc', 57, -107.5, { id: 'h1', look: Math.PI / 2 });
      B.char('merc', 61, -113, { y: 2.8, id: 'h2', pose: 'sit', static: true, look: 0 });
      B.char('merc', 5, -112, { id: 'n1', path: [[5, -112], [22, -112]], wait: 3 });
      B.char('merc', 24, -126, { id: 'n2', look: -Math.PI / 2 });
      B.char('oldman', 9.6, -123.4, { y: 1.9, id: 'ben', dead: 'back', yaw: 0.6 });
      B.char('merc', -64, -104, { id: 's1', group: 'mill', look: Math.PI });
      B.char('merc2', -58, -109.88, { y: 3.08, id: 's2', group: 'mill', static: true, look: Math.PI });
      B.char('merc', -70, -112, { id: 's3', group: 'mill', path: [[-70, -112], [-56, -112]], wait: 2 });
      for (const [i, x, z] of [[0, -8, -141], [1, 32, -139], [2, 36, -118], [3, -16, -116], [4, 6, -142]]) B.char(i % 2 ? 'merc2' : 'merc', x, z, { id: 'am' + i, group: 'ambush', hidden: true, aggressive: true, grenadier: i === 2 });

      B.trigger('boathouse', 5.2, 0, -7.6, 24.8, 3, 7.6);
      B.trigger('north', -30, -1, -114, 50, 9, -106);
      B.trigger('cabinIn', 6.6, 1.5, -125.5, 17.4, 4.5, -116.6);
      B.trigger('checkpoint', 82, 0, -60, 100, 8, -30);
      B.trigger('millArea', -86, -1, -128, -48, 9, -84);
      B.trigger('truck', -86, 2, -132, -72, 12, -118);
      B.cam('boatCam', [16, 3.5, 4], [ISL[0] + BOAT_R, 1, ISL[1]], 42);
      B.cam('cabinCam', [15.5, 4.2, -114], [11, 2.6, -121], 50);
      B.cam('irishCam', [-62, 3.6, -94], [-57.8, 1.6, -84], 46);
    },
    script(S) {
      S.on('start', g => {
        g.objective('cabin', 'Добраться до хижины старика Бена на северном берегу');
        g.objective('boat', 'Необязательно: заглушить сторожевой катер', { optional: true });
        g.moveGroup('boat', LOOP, 3.2, { loop: true, face: true, turn: 1.1 });
        g.caption('Озеро Келлоуни. Закат. Где-то здесь жил человек, которого я не помню. Мной.', 5.5);
        g.after(6, () => g.radio('carrington', 'Дорога вокруг озера перекрыта. Или напрямик — вплавь. Под водой тебя почти не видно.'));
      });
      S.zone('boathouse', g => { g.checkpoint('boathouse'); });
      S.pick('harpoon', g => g.msg('Гарпун бьёт и под водой. [Пробел] — всплыть, [Ctrl] — нырнуть.', 4));
      S.zone('checkpoint', g => { g.panel({ kind: 'cam', cam: 'boatCam', dur: 2.4, text: 'КАТЕР ОБХОДИТ ОСТРОВ' }); });
      S.zone('north', g => {
        g.checkpoint('north');
        g.radio('carrington', 'Хижина Бена — у причала с красной лодкой.');
      });
      S.zone('cabinIn', g => {
        g.complete('cabin');
        g.comic('ben');
        g.objective('search', 'Осмотреть хижину');
      });
      S.pick('photo', g => g.comic('photo'));
      S.pick('diary', g => {
        g.memory('tough', 'Марш-бросок, сорок миль под дождём. «Упал — встань. Встал — иди». Тело помнит: второе дыхание приходит, когда первое кончилось.');
        g.complete('search');
        g.after(2.5, () => {
          g.radio('radio', 'Он в хижине старика! Окружай! Ирландец уже идёт на катере!');
          g.spawn('ambush', g.player.pos);
          g.objective('mill', 'Пробиться к лесопилке — там ждёт Кэррингтон');
          g.music('combat');
          const ir = g.char('irish');
          if (ir && ir.state === 'hidden') ir.state = 'alive';
          g.moveGroup('irish', IRISH_PATH, 6.5, { ev: 'irishDock', face: true, turn: 1.4 });
          g.setFlag('irishComing');
          g.checkpoint('diary');
        });
      });
      S.on('irishDock', g => {
        const ir = g.char('irish');
        g.panel({ kind: 'cam', cam: 'irishCam', dur: 3, text: 'ИРЛАНДЕЦ', tint: 'red' });
        if (ir && ir.state === 'alive') g.say('irish', 'Тринадцатый! Мангуст шлёт привет. Старик ничего тебе не сказал — я проверял!', 4.5);
        for (const c of g.chars) {
          if (c.group !== 'irishCrew' || c.state !== 'alive') continue;
          c.grp = null; c.ai.static = false;
          X.AI.alert(g, c, g.player.pos);
        }
        g.after(9, () => {
          g.say('irish', 'Встретимся в горах, красавчик. Если доживёшь.', 3.5);
          g.moveGroup('irish', IRISH_AWAY, 8, { ev: 'irishAway', face: true, turn: 1.2 });
          g.setFlag('irishLeft');
          g.objective('truck', 'Сесть в грузовик Кэррингтона за лесопилкой');
        });
      });
      S.on('irishAway', g => g.hide('irish'));
      S.zone('millArea', g => {
        if (!g.flags.irishComing) g.msg('Кэррингтон ждёт у грузовика за лесопилкой. Но сначала — хижина Бена.', 3.5);
      });
      S.zone('truck', g => {
        if (!g.flags.irishLeft) { g.flags['!zone:truck'] = 0; return; }
        g.complete('mill');
        g.complete('truck');
        g.finish();
      });
      S.on('restore', g => {
        if (g.flags.irishLeft) { const ir = g.char('irish'); if (ir) ir.state = 'hidden'; }
        if (g.flags.irishComing && !g.flags.irishLeft) {
          for (const c of g.chars) if (c.group === 'irishCrew' && c.state === 'alive' && !g.groups.find(q => q.id === 'irish').moving) { c.grp = null; c.ai.static = false; }
        }
      });
    },
    tick(g) {
      const boat = g.groups.find(q => q.id === 'boat'), s = g.searchlights.find(q => q.id === 'boatLight');
      if (!boat || !s) return;
      s.pos = X.groupPoint(boat, [0, 3.1, 0.9]);
      s.yaw = boat.yaw;
      const a = g.char('pb1'), b = g.char('pb2');
      if ((!a || a.state !== 'alive') && (!b || b.state !== 'alive')) { s.off = true; if (boat.moving) { boat.moving = false; g.complete('boat'); } }
    },
    comics: {
      intro: [
        {
          rows: [{ h: 0.56, w: [1] }, { h: 0.44, w: [0.55, 0.45] }],
          panels: [
            { cam: { pos: [-44, 12, 38], look: [0, 0, -60], fov: 52 }, actors: [], text: [{ k: 'cap', t: 'Озеро Келлоуни. Где-то на северном берегу — хижина старика, знавшего Стива Роуланда мальчишкой.', x: 0.03, y: 0.05, w: 0.58 }] },
            { shot: { on: 0, dist: 0.9, height: 0.05, angle: -25, fov: 36, target: 'head' }, actors: [{ type: 'carrington', pos: [0, 0, 0], yaw: 0, pose: 'talk', float: true }], hideWorld: true, bg: [0.86, 0.52, 0.34], text: [{ k: 'say', t: 'Объеду озеро и буду ждать у лесопилки. Бен знает, кем ты был. Если он ещё жив.', x: 0.05, y: 0.05, w: 0.9, who: 0 }] },
            { art: 'silhouette', artOpt: { a: '#f0a060', b: '#4a1a2a' }, text: [{ k: 'say', t: 'Наёмников тут больше, чем комаров.', x: 0.06, y: 0.64, w: 0.88, tail: [0.5, 0.35] }] }
          ]
        }
      ],
      ben: [
        {
          rows: [{ h: 1, w: [0.58, 0.42] }],
          panels: [
            { cam: { pos: [14.6, 3.9, -118.2], look: [9.8, 2.1, -123.2], fov: 48 }, actors: [{ type: 'oldman', pos: [9.6, 1.9, -123.4], yaw: 0.6, pose: 'dead' }, { type: 'xiii', pos: [11.2, 1.9, -122.2], yaw: 2.2, pose: 'kneel' }], tint: 'grey', text: [{ k: 'cap', t: 'Старик Бен. Кровь ещё не остыла.', x: 0.04, y: 0.05, w: 0.6 }] },
            { shot: { on: 0, dist: 0.8, height: 0.02, angle: 22, fov: 34, target: 'head' }, actors: [{ type: 'xiii', pos: [0, 0, 0], yaw: 0, pose: 'think', float: true }], hideWorld: true, bg: [0.5, 0.2, 0.16], text: [{ k: 'think', t: 'Опоздал. Они знали, что я приду.', x: 0.06, y: 0.06, w: 0.86 }] }
          ]
        }
      ],
      photo: [
        {
          rows: [{ h: 1, w: [1] }],
          panels: [
            { art: 'photo', artOpt: { caption: 'Стив и Ким, Келлоуни, 1986' }, text: [{ k: 'think', t: 'Ким... Я должен помнить это лицо. Почему я не помню?', x: 0.05, y: 0.05, w: 0.5 }] }
          ]
        }
      ],
      outro: [
        {
          rows: [{ h: 0.5, w: [0.55, 0.45] }, { h: 0.5, w: [1] }],
          panels: [
            { cam: { pos: [-72, 6.4, -117], look: [-78.5, 5.4, -124], fov: 50 }, actors: [{ type: 'carrington', pos: [-77.4, 4.6, -122.4], yaw: 2.4, pose: 'talk' }, { type: 'xiii', pos: [-75.6, 4.6, -121], yaw: -1.2, pose: 'stand' }], text: [{ k: 'say', t: 'Ирландец. Наёмник Мангуста, работает на Двадцатку.', x: 0.04, y: 0.05, w: 0.6, who: 0 }] },
            { art: 'dossier', artOpt: { names: ['ИРЛАНДЕЦ — наёмник', 'МАНГУСТ — ?', 'ОХОТНИЧИЙ ДОМ', 'СБОР «XX»'] }, text: [{ k: 'cap', t: 'Карта в кармане наёмника: охотничий дом над озером.', x: 0.05, y: 0.05, w: 0.86 }] },
            { art: 'silhouette', artOpt: { a: '#c05030', b: '#200808', glint: true }, text: [{ k: 'say', t: 'Там собирается Двадцатка. Значит, туда мы и едем.', x: 0.05, y: 0.62, w: 0.9, tail: [0.5, 0.35] }] }
          ]
        }
      ]
    }
  });
})(globalThis.XIII = globalThis.XIII || {});
