(function (K) {
  'use strict';

  const PARTS = Object.freeze(['head', 'neck', 'chest', 'croup', 'tail', 'lfUp', 'lfLo', 'rfUp', 'rfLo', 'lhUp', 'lhLo', 'rhUp', 'rhLo']);
  const NP = 13;
  const LEGS = Object.freeze({ lf: [5, 6], rf: [7, 8], lh: [9, 10], rh: [11, 12] });
  const LEG_OF = Object.freeze({ 5: 'lf', 6: 'lf', 7: 'rf', 8: 'rf', 9: 'lh', 10: 'lh', 11: 'rh', 12: 'rh' });
  const PART_HIT = Object.freeze([1.6, 1.3, 1, 0.9, 0.2, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
  const ACTIVE = 250, IDLE = 320, FAR_TICK = 1, NIGHT = [20, 6], TORCH = 5, CORPSE_CROWS = 30;

  const body = (L, rx, ry, neck, neckTilt, head, tail, tailTilt, fu, fl, hu, hl, leg) => Object.freeze({ L, rx, ry, neck, neckTilt, head, tail, tailTilt, fu, fl, hu, hl, leg });
  const look = (fur, dark, light, accent, horn, tex) => Object.freeze({ fur, dark, light, accent, horn: horn || [0.6, 0.55, 0.45], tex: tex || 'fur' });

  const SPECIES = Object.freeze({
    wolf: { name: 'Волк', female: 'Волчица', body: body(0.6, 0.13, 0.17, 0.24, 0.85, 0.27, 0.42, 2.3, 0.33, 0.35, 0.36, 0.38, 0.045), look: look([0.5, 0.47, 0.42], [0.27, 0.25, 0.22], [0.74, 0.7, 0.62], [0.1, 0.09, 0.09]), life: 45, cut: 35, hide: 1, speed: [1.5, 3.6, 10], stride: [1.3, 2.2, 3.4], attack: { weapon: 'wolfBite', kind: 'bite', reach: 1.3, wind: 0.25, rest: 2.2, power: 0.85, parts: [9, 10, 5, 6, 7, 8] }, mind: 'pack', sense: [30, 18, 55], yield: [['wolfHide', 1]], ears: 'pointy', paws: true },
    dog: { name: 'Собака', female: 'Собака', body: body(0.5, 0.12, 0.15, 0.2, 0.8, 0.22, 0.3, 1.9, 0.28, 0.3, 0.3, 0.32, 0.04), look: look([0.6, 0.48, 0.32], [0.3, 0.22, 0.15], [0.85, 0.78, 0.65], [0.1, 0.08, 0.08]), life: 35, cut: 35, hide: 1, speed: [1.4, 3.4, 9], stride: [1.1, 1.9, 3], attack: { weapon: 'dogBite', kind: 'bite', reach: 1.2, wind: 0.2, rest: 1.2, power: 0.9, parts: [9, 10, 5, 6, 7, 8] }, mind: 'dog', sense: [25, 22, 30], yield: [], ears: 'drop', paws: true },
    fox: { name: 'Лиса', female: 'Лиса', body: body(0.36, 0.08, 0.1, 0.12, 0.85, 0.17, 0.4, 2.0, 0.17, 0.18, 0.19, 0.2, 0.025), look: look([0.8, 0.43, 0.16], [0.18, 0.12, 0.09], [0.95, 0.92, 0.88], [0.1, 0.08, 0.07]), life: 15, cut: 25, headCut: true, hide: 1, speed: [1.2, 3, 8], stride: [0.8, 1.3, 2.2], attack: { weapon: 'foxBite', kind: 'bite', reach: 0.9, wind: 0.2, rest: 1.5, power: 0.8, parts: [9, 10] }, mind: 'shy', sense: [25, 20, 25], yield: [['foxFur', 1]], ears: 'pointy', paws: true, brush: true },
    hare: { name: 'Заяц', female: 'Зайчиха', body: body(0.28, 0.08, 0.1, 0.06, 0.7, 0.13, 0.06, 1.2, 0.1, 0.12, 0.17, 0.2, 0.022), look: look([0.55, 0.47, 0.36], [0.3, 0.25, 0.2], [0.88, 0.85, 0.8], [0.1, 0.08, 0.08]), life: 8, cut: 25, headCut: true, hide: 1, speed: [1, 3, 11], stride: [0.5, 1, 2.6], attack: null, mind: 'shy', sense: [22, 25, 0], yield: [['hareFur', 1], ['meat', 1]], ears: 'long', paws: true },
    bear: { name: 'Медведь', female: 'Медведица', body: body(0.85, 0.32, 0.36, 0.24, 0.55, 0.34, 0.08, 2.4, 0.4, 0.38, 0.42, 0.4, 0.1), look: look([0.33, 0.22, 0.14], [0.2, 0.13, 0.08], [0.42, 0.3, 0.2], [0.1, 0.08, 0.07]), life: 220, cut: 60, hide: 0.75, speed: [1.3, 3.5, 9], stride: [1.4, 2.4, 3.4], attack: { weapon: 'bearPaw', kind: 'crush', tear: 0.25, reach: 1.7, wind: 0.5, rest: 1.3, power: 1, parts: [1, 2, 3, 4, 5, 6, 0] }, bite: { weapon: 'bearBite', kind: 'bite', reach: 1.5, wind: 0.35, rest: 1.4, power: 1, parts: [5, 6, 3, 4, 1] }, mind: 'bear', sense: [22, 20, 25], yield: [['bearHide', 1], ['bearFat', 1], ['meat', 4]], ears: 'round', paws: true },
    boar: { name: 'Кабан', female: 'Свинья', body: body(0.7, 0.22, 0.3, 0.16, 0.25, 0.38, 0.2, 2.5, 0.25, 0.27, 0.26, 0.28, 0.06), look: look([0.3, 0.25, 0.2], [0.18, 0.15, 0.12], [0.38, 0.32, 0.26], [0.5, 0.4, 0.35], [0.92, 0.9, 0.82]), life: 110, cut: 45, hide: 0.8, speed: [1.2, 3, 8.5], stride: [0.9, 1.6, 2.6], attack: { weapon: 'boarTusk', kind: 'stab', reach: 1.3, wind: 0.15, rest: 1.6, power: 1, knock: true, parts: [7, 8, 9, 10] }, mind: 'boar', sense: [18, 18, 20], yield: [['boarHide', 1], ['meat', 3]], ears: 'pointy', tusks: true, hooves: true },
    deer: { name: 'Олень', female: 'Олениха', body: body(0.7, 0.18, 0.24, 0.45, 0.6, 0.32, 0.1, 2.3, 0.45, 0.5, 0.48, 0.52, 0.045), look: look([0.56, 0.38, 0.22], [0.35, 0.24, 0.14], [0.86, 0.8, 0.7], [0.12, 0.1, 0.08], [0.6, 0.5, 0.38], 'spots'), life: 80, cut: 40, hide: 1, speed: [1.4, 4, 12], stride: [1.4, 2.4, 4], attack: { weapon: 'antler', kind: 'stab', reach: 1.5, wind: 0.3, rest: 2, power: 0.9, parts: [1, 2, 7, 8] }, mind: 'herd', sense: [32, 22, 25], yield: [['deerHide', 1], ['meat', 3]], ears: 'pointy', antlers: true, hooves: true },
    goat: { name: 'Горный козёл', female: 'Коза', body: body(0.52, 0.15, 0.2, 0.25, 0.6, 0.25, 0.1, 1.2, 0.3, 0.33, 0.32, 0.35, 0.04), look: look([0.82, 0.8, 0.74], [0.42, 0.38, 0.32], [0.9, 0.88, 0.84], [0.25, 0.22, 0.2], [0.45, 0.4, 0.32]), life: 40, cut: 40, hide: 1, speed: [1.1, 3, 7], stride: [0.9, 1.6, 2.5], attack: { weapon: 'butt', kind: 'crush', reach: 1.2, wind: 0.3, rest: 2, power: 0.8, parts: [2, 7, 8] }, mind: 'goat', sense: [35, 25, 20], yield: [['goatHide', 1], ['meat', 2]], ears: 'pointy', horns: 'goat', hooves: true, climb: true },
    cow: { name: 'Корова', female: 'Корова', body: body(1.0, 0.32, 0.38, 0.3, 0.5, 0.45, 0.7, 2.85, 0.45, 0.45, 0.48, 0.47, 0.07), look: look([0.55, 0.36, 0.22], [0.3, 0.2, 0.12], [0.92, 0.88, 0.82], [0.78, 0.58, 0.52], [0.86, 0.82, 0.7], 'patches'), life: 150, cut: 60, hide: 0.9, speed: [1, 2, 5], stride: [1.2, 1.8, 2.6], attack: null, mind: 'stock', sense: [15, 15, 0], yield: [['meat', 4]], ears: 'side', horns: 'cow', hooves: true, owned: true },
    pig: { name: 'Свинья', female: 'Свинья', body: body(0.68, 0.24, 0.27, 0.12, 0.25, 0.3, 0.12, 1.6, 0.18, 0.2, 0.19, 0.21, 0.05), look: look([0.92, 0.72, 0.66], [0.85, 0.62, 0.56], [0.95, 0.8, 0.75], [0.8, 0.55, 0.5], null, 'skin'), life: 90, cut: 45, hide: 0.9, speed: [0.9, 2.2, 5], stride: [0.7, 1.2, 1.9], attack: null, mind: 'stock', sense: [12, 12, 0], yield: [['meat', 3]], ears: 'drop', hooves: true, owned: true },
    chicken: { name: 'Курица', female: 'Курица', bird: true, body: body(0.16, 0.09, 0.11, 0.1, 0.25, 0.08, 0.13, -0.5, 0.11, 0.1, 0.09, 0.1, 0.012), look: look([0.86, 0.79, 0.62], [0.82, 0.12, 0.08], [0.92, 0.86, 0.72], [0.92, 0.7, 0.2], null, 'feather'), life: 4, cut: 25, headCut: true, hide: 1, speed: [0.5, 1.3, 3], stride: [0.25, 0.45, 0.7], attack: null, mind: 'stock', sense: [10, 10, 0], yield: [['meat', 1]], beak: true, comb: true, owned: true },
    horse: { name: 'Лошадь', female: 'Кобыла', body: body(0.95, 0.27, 0.35, 0.62, 0.7, 0.55, 0.7, 2.7, 0.62, 0.64, 0.66, 0.66, 0.06), look: look([0.42, 0.27, 0.15], [0.15, 0.1, 0.07], [0.5, 0.34, 0.2], [0.12, 0.1, 0.08]), life: 200, cut: 60, hide: 0.9, speed: [1.6, 4, 12], stride: [1.7, 2.8, 4.2], attack: { weapon: 'hoof', kind: 'crush', reach: 1.6, wind: 0.25, rest: 2, power: 1, kick: true, parts: [1, 2, 7, 8] }, mind: 'draft', sense: [20, 18, 0], yield: [], ears: 'pointy', mane: true, hooves: true, owned: true },
    ox: { name: 'Вол', female: 'Вол', body: body(1.1, 0.36, 0.42, 0.3, 0.35, 0.5, 0.75, 2.85, 0.5, 0.5, 0.53, 0.52, 0.08), look: look([0.7, 0.62, 0.5], [0.4, 0.33, 0.25], [0.82, 0.76, 0.66], [0.2, 0.17, 0.15], [0.86, 0.82, 0.7]), life: 230, cut: 60, hide: 0.85, speed: [1.1, 2.2, 4.5], stride: [1.3, 1.8, 2.6], attack: { weapon: 'horn', kind: 'stab', reach: 1.6, wind: 0.35, rest: 2.2, power: 1, parts: [2, 1, 7, 8] }, mind: 'draft', sense: [15, 15, 0], yield: [], ears: 'side', horns: 'ox', hooves: true, owned: true },
    eagle: { name: 'Орёл', female: 'Орлица', bird: true, fly: true, body: body(0.3, 0.12, 0.13, 0.1, 0.4, 0.1, 0.25, 2.6, 0.5, 0.45, 0.1, 0.1, 0.02), look: look([0.38, 0.26, 0.15], [0.22, 0.15, 0.1], [0.62, 0.47, 0.27], [0.86, 0.7, 0.2], null, 'feather'), life: 20, cut: 25, headCut: true, hide: 1, speed: [14, 14, 18], stride: [1, 1, 1], attack: null, mind: 'bird', sense: [0, 0, 0], yield: [], beak: true },
    crow: { name: 'Ворона', female: 'Ворона', bird: true, fly: true, body: body(0.15, 0.06, 0.07, 0.05, 0.4, 0.06, 0.14, 2.6, 0.22, 0.2, 0.06, 0.06, 0.01), look: look([0.08, 0.08, 0.09], [0.05, 0.05, 0.06], [0.15, 0.15, 0.17], [0.1, 0.1, 0.1], null, 'feather'), life: 4, cut: 25, headCut: true, hide: 1, speed: [9, 9, 12], stride: [1, 1, 1], attack: null, mind: 'bird', sense: [0, 0, 0], yield: [], beak: true }
  });

  const g = (id, kind, at, n, o) => Object.freeze(Object.assign({ id, kind, at, n }, o || {}));
  const GROUPS = Object.freeze([
    g('wolf-south', 'wolf', [535, 931], [3, 5], { den: true, r: 8 }), g('wolf-north', 'wolf', [490, 526], [3, 4], { den: true, r: 8 }), g('wolf-bridge', 'wolf', [580, 1156], [3, 4], { den: true, r: 8 }), g('wolf-hills', 'wolf', [391, 328], [3, 4], { den: true, r: 8 }),
    g('bear-gully', 'bear', [49, 922], [1, 1], { r: 30, place: 'малинник в овраге' }), g('bear-cave', 'bear', [1174, 166], [1, 1], { r: 30, place: 'пещера над рудниками' }),
    g('boar-swamp', 'boar', [103, 985], [4, 8], { r: 25 }), g('boar-oaks', 'boar', [256, 607], [4, 7], { r: 25 }),
    g('deer-south', 'deer', [445, 1183], [3, 6], { r: 30 }), g('deer-river', 'deer', [751, 967], [3, 5], { r: 30 }), g('deer-ford', 'deer', [742, 688], [2, 4], { r: 30 }),
    g('hare-a', 'hare', [787, 967], [2, 3], { r: 30 }), g('hare-b', 'hare', [1417, 967], [2, 3], { r: 30 }), g('hare-c', 'hare', [157, 1453], [2, 3], { r: 30 }), g('hare-d', 'hare', [1417, 1453], [2, 3], { r: 30 }),
    g('fox-a', 'fox', [517, 1210], [1, 1], { r: 40 }), g('fox-b', 'fox', [175, 1210], [1, 1], { r: 40 }), g('fox-c', 'fox', [1408, 895], [1, 1], { r: 40 }),
    g('goat-a', 'goat', [920, 40], [3, 5], { r: 25 }), g('goat-b', 'goat', [661, 40], [3, 5], { r: 25 }),
    g('eagle-pass', 'eagle', [650, 200], [1, 2], { r: 45, alt: 50 }), g('eagle-cliff', 'eagle', [1150, 230], [1, 2], { r: 45, alt: 50 }),
    ...[['rakitny', [514, 1399], [522, 1369]], ['klyuchi', [622, 1401], [616, 1439]], ['mezha', [1160, 1384], [1184, 1414]], ['vyselki', [1338, 1305], [1328, 1272]], ['tsarevo', [1317, 1014], [1294, 1010]]].flatMap(([id, a, b]) => [
      g('cow-' + id, 'cow', a, [2, 3], { r: 8, owner: id === 'tsarevo' ? 'guard' : 'town' }),
      g('pig-' + id, 'pig', b, [2, 3], { r: 6, owner: id === 'tsarevo' ? 'guard' : 'town' }),
      g('hen-' + id, 'chicken', [b[0] + 5, b[1] + 3], [3, 5], { r: 6, owner: id === 'tsarevo' ? 'guard' : 'town' }),
      g('dog-' + id, 'dog', [a[0] - 4, a[1] - 4], [1, 1], { r: 10, owner: id === 'tsarevo' ? 'guard' : 'town' }),
      g('ox-' + id, 'ox', [a[0] + 6, a[1] - 6], [1, 1], { r: 5, owner: id === 'tsarevo' ? 'guard' : 'town' })
    ]),
    g('horse-palace', 'horse', [1240, 585], [3, 4], { r: 6, owner: 'guard' }), g('dog-kennel', 'dog', [1195, 610], [3, 3], { r: 6, owner: 'guard' }),
    g('horse-yard', 'horse', [950, 1316], [2, 2], { r: 5, owner: 'town' }), g('ox-yard', 'ox', [962, 1316], [2, 2], { r: 5, owner: 'town' })
  ]);

  const yawM = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
  const rx = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, s, 0, -s, c]; };
  const rz = a => { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, -s, c, 0, 0, 0, 1]; };
  const mul = (a, b) => {
    const o = new Array(9);
    for (let c = 0; c < 3; c++) {
      const x = b[c * 3], y = b[c * 3 + 1], z = b[c * 3 + 2];
      o[c * 3] = a[0] * x + a[3] * y + a[6] * z;
      o[c * 3 + 1] = a[1] * x + a[4] * y + a[7] * z;
      o[c * 3 + 2] = a[2] * x + a[5] * y + a[8] * z;
    }
    return o;
  };
  const app = (m, v) => [m[0] * v[0] + m[3] * v[1] + m[6] * v[2], m[1] * v[0] + m[4] * v[1] + m[7] * v[2], m[2] * v[0] + m[5] * v[1] + m[8] * v[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const put = (fr, i, R, o) => { const b = i * 12; for (let k = 0; k < 9; k++) fr[b + k] = R[k]; fr[b + 9] = o[0]; fr[b + 10] = o[1]; fr[b + 11] = o[2]; };
  const pointOf = (fr, i, l) => { const b = i * 12; return [fr[b + 9] + fr[b] * l[0] + fr[b + 3] * l[1] + fr[b + 6] * l[2], fr[b + 10] + fr[b + 1] * l[0] + fr[b + 4] * l[1] + fr[b + 7] * l[2], fr[b + 11] + fr[b + 2] * l[0] + fr[b + 5] * l[1] + fr[b + 8] * l[2]]; };
  const flat = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  const turn = (from, to, max) => { let d = to - from; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return from + K.clamp(d, -max, max); };
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const night = hour => hour >= NIGHT[0] || hour < NIGHT[1];
  const legH = (u, l, a, k) => u * Math.cos(a) + l * Math.cos(a + k);

  function fk(b, pose, W, out) {
    const s = SPECIES[b.beast], D = s.body, fr = out || b.frames || (b.frames = new Float32Array(NP * 12)), mv = b.mv, T = W.terrain;
    const Y = yawM(mv.yaw), fwd = [Math.sin(mv.yaw), 0, -Math.cos(mv.yaw)], L = pose.legs;
    const ground = (x, z) => W.groundAt ? W.groundAt(x, z, mv.pos[1] + 1) : T.heightAt(x, z);
    const front = s.bird ? 0 : Math.max(legH(D.fu, D.fl, L[0][0], L[0][1]), legH(D.fu, D.fl, L[1][0], L[1][1]));
    const hind = Math.max(legH(D.hu, D.hl, L[2][0], L[2][1]), legH(D.hu, D.hl, L[3][0], L[3][1]));
    const gF = s.fly ? mv.pos[1] : ground(mv.pos[0], mv.pos[2]), gB = s.fly ? mv.pos[1] : ground(mv.pos[0] - fwd[0] * D.L, mv.pos[2] - fwd[2] * D.L);
    const rest = pose.rest || 0, lying = pose.lying || 0;
    const hF = s.bird ? hind : front, low = D.rx * lying + D.ry * 0.55 * rest;
    const stand = (1 - lying) * (1 - rest), yF = gF + (hF + D.ry * (s.bird ? 0.3 : 0.25)) * stand + low + (pose.lift || 0), yB = gB + (hind + D.ry * 0.3) * stand + low + (pose.lift || 0);
    const pitch = Math.asin(K.clamp((yF - yB) / D.L, -0.45, 0.45)) + (pose.pitch || 0);
    const R = mul(Y, mul(rx(pitch), rz(pose.roll || 0))), C = [mv.pos[0], yF, mv.pos[2]];
    put(fr, 2, R, C);
    const RB = mul(R, rx(pose.back || 0)), CB = add(C, app(R, [0, 0, D.L]));
    put(fr, 3, RB, CB);
    const N0 = add(C, app(R, [0, D.ry * 0.4, -D.ry * 0.55])), RN = mul(R, rx(-(D.neckTilt + (pose.neck || 0))));
    put(fr, 1, RN, N0);
    const H0 = add(N0, app(RN, [0, D.neck, 0])), RH = mul(RN, rx(D.neckTilt + (pose.neck || 0) + (pose.head || 0)));
    put(fr, 0, RH, H0);
    const T0 = add(CB, app(RB, [0, D.ry * 0.55, D.ry * 0.65])), RT = mul(RB, mul(rx(D.tailTilt + (pose.tail || 0)), rz(pose.wag || 0)));
    put(fr, 4, RT, T0);
    const base = mul(Y, rz(pose.roll || 0));
    const leg = (i, legIdx, origin, u, ang) => {
      const RU = mul(base, mul(rz(ang[2] || 0), rx(ang[0])));
      put(fr, i, RU, origin);
      const lo = add(origin, app(RU, [0, -u, 0]));
      put(fr, i + 1, mul(RU, rx(ang[1])), lo);
    };
    if (s.bird) {
      for (const [i, side] of [[5, -1], [7, 1]]) {
        const sh = add(C, app(R, [side * D.rx * 0.8, D.ry * 0.25, -D.ry * 0.2])), w = pose.wings || [0, 0];
        const RU = mul(R, mul(rz(side * (w[0] * 1.45 + w[1])), rx(-1.45 * (1 - w[0]))));
        put(fr, i, RU, sh);
        put(fr, i + 1, mul(RU, rz(side * w[1] * 0.6)), add(sh, app(RU, [0, -D.fu, 0])));
      }
    } else {
      leg(5, 0, add(C, app(R, [-D.rx * 0.55, -D.ry * 0.25, -D.ry * 0.1])), D.fu, L[0]);
      leg(7, 1, add(C, app(R, [D.rx * 0.55, -D.ry * 0.25, -D.ry * 0.1])), D.fu, L[1]);
    }
    const hip = s.bird ? C : CB, RHp = s.bird ? R : RB, hz = s.bird ? D.L * 0.35 : D.ry * 0.1;
    leg(9, 2, add(hip, app(RHp, [-D.rx * 0.5, -D.ry * 0.3, hz])), D.hu, L[2]);
    leg(11, 3, add(hip, app(RHp, [D.rx * 0.5, -D.ry * 0.3, hz])), D.hu, L[3]);
    return fr;
  }

  function capsules(kit, fr) {
    const s = SPECIES[kit.beast], D = s.body, cut = kit.cut || {}, out = [], r = Math.max(D.rx, D.ry);
    const seg = (part, a, e, rad, tag) => out.push([part, pointOf(fr, part, a), pointOf(fr, part, e), rad, tag]);
    if (!cut.head) seg(0, [0, D.head * 0.15, 0], [0, -D.head * 0.05, -D.head], D.head * 0.3, 'head');
    seg(1, [0, 0, 0], [0, D.neck, 0], Math.max(0.03, D.rx * 0.55), 'neck');
    seg(2, [0, 0, -D.ry * 0.3], [0, 0, D.L * 0.5], r * 0.85, 'body');
    seg(3, [0, 0, -D.L * 0.5], [0, 0, D.ry * 0.3], r * 0.8, 'body');
    if (D.tail > 0.1) seg(4, [0, 0, 0], [0, D.tail, 0], Math.max(0.02, D.leg * 0.6), 'tail');
    for (const [leg, [up, lo]] of Object.entries(LEGS)) {
      const front = leg[1] === 'f', u = front ? D.fu : D.hu, l = front ? D.fl : D.hl;
      if (s.bird && front) { seg(up, [0, 0, 0], [0, -u, 0], Math.max(0.02, D.ry * 0.25), 'wing'); continue; }
      if (cut[leg] === 'up') continue;
      seg(up, [0, 0, 0], [0, -u, 0], D.leg * 1.2, 'leg');
      if (cut[leg] !== 'lo') seg(lo, [0, 0, 0], [0, -l, 0], D.leg, 'leg');
    }
    return out;
  }

  const legsLeft = kit => Object.keys(LEGS).filter(l => !(kit.cut || {})[l]).length;

  function kitOf(kind, sex, rnd) {
    const L = SPECIES[kind].look, j = c => c.map(v => K.clamp(v * (0.88 + rnd() * 0.24), 0, 1));
    return { beast: kind, fig: sex, face: 0, skin: j(L.fur), hairColor: j(L.dark), main: j(L.light), accent: L.accent.slice(), metal: L.horn.slice(), cut: {}, eyes: {} };
  }

  function make(id, kind, x, z, yaw, W, o) {
    const s = SPECIES[kind], opt = o || {}, rnd = K.rng(id * 7919 + 3), sex = opt.sex || (rnd() < 0.5 ? 'm' : 'f'), D = s.body;
    const mv = K.Move.body(W, x, z, yaw || 0);
    const tall = (s.bird ? D.hu + D.hl : D.fu + D.fl) + D.ry;
    Object.assign(mv, { radius: K.clamp(Math.max(D.rx, D.ry) * 0.9, 0.15, 0.5), height: tall, eye: tall * 0.85, chest: tall * 0.6, speeds: { walk: s.speed[0], run: s.speed[1], sprint: s.speed[2], swim: 1 }, climb: !!s.climb });
    if (s.fly) mv.pos[1] += opt.alt || 30;
    const max = s.life * (sex === 'm' ? 1.1 : 0.95);
    const b = {
      id, beast: kind, sex, group: opt.group || null, owner: opt.owner || null, home: opt.home || [x, z], leader: !!opt.leader,
      mv, kit: kitOf(kind, sex, rnd),
      fight: { life: max, max, down: null, act: null, guard: null, shield: false, weapon: null, hostile: null, stun: 0, aim: { eye: [x, mv.pos[1] + mv.eye, z], yaw: yaw || 0, pitch: 0 }, hitBy: null, hitTime: -99, bleed: 0 },
      brain: { tick: 0, state: 'idle', t: 0, next: 0, goal: null, alarm: null, seed: rnd() * 1000 },
      anim: K.Anim ? K.Anim.beastState() : null, frames: new Float32Array(NP * 12)
    };
    if (kind === 'deer' && sex === 'f') b.kit.fig = 'f';
    return b;
  }

  const lit = (p, S) => !!(p && p.fight && !p.fight.down && (p.fight.torch || S && S.fires && S.fires.some(f => Math.hypot(f.at[0] - p.mv.pos[0], f.at[2] - p.mv.pos[2]) < f.r)));
  const others = S => { const out = S.player && S.player.fight && !S.player.fight.down ? [S.player] : []; for (const p of S.people) if (p.fight && !p.fight.down && p.kit.side !== 'straw') out.push(p); return out; };

  function senses(b, q, W, S) {
    const s = SPECIES[b.beast], d = flat(b.mv.pos, q.mv.pos), [see, hear, smell] = s.sense;
    if (d < 3) return true;
    if (smell && d < smell * (night(S.hour) ? 1 : 0.6)) return true;
    if (hear && K.Senses && d < Math.min(hear, K.Senses.loudness(q) * 1.6)) return true;
    if (!see || d > see * (night(S.hour) ? 0.6 : 1)) return false;
    const a = [b.mv.pos[0], b.mv.pos[1] + b.mv.eye, b.mv.pos[2]], c = K.Senses ? K.Senses.chest(q) : [q.mv.pos[0], q.mv.pos[1] + 1.2, q.mv.pos[2]];
    return !K.Senses || K.Senses.clear(W, a, c);
  }

  function threat(b, S, W, r) {
    let best = null, bd = r;
    for (const q of others(S)) {
      if (b.beast === 'dog' && !stranger(b, q, S)) continue;
      const d = flat(b.mv.pos, q.mv.pos);
      if (d < bd && senses(b, q, W, S)) { bd = d; best = q; }
    }
    return best;
  }

  const teamOf = (S, q) => q === S.player ? S.player.team : q.team;
  const stranger = (b, q, S) => { const t = teamOf(S, q); return !b.owner || (t !== b.owner && !(b.owner === 'town' && t === 'town')); };

  const towards = (mv, x, z, dt, rate) => turn(mv.yaw, Math.atan2(x - mv.pos[0], -(z - mv.pos[2])), (rate || 5) * dt);
  const away = (mv, from, dt, rate) => turn(mv.yaw, Math.atan2(mv.pos[0] - from[0], -(mv.pos[2] - from[2])), (rate || 6) * dt);

  function wanderGoal(b, W, rnd, r) {
    const N = K.Nav ? K.Nav.of(W) : null;
    for (let k = 0; k < 6; k++) {
      const a = rnd() * Math.PI * 2, d = r * Math.sqrt(rnd()), x = b.home[0] + Math.cos(a) * d, z = b.home[1] + Math.sin(a) * d;
      if (!N || !K.Nav.blocked(N, x, z)) return [x, z];
    }
    return b.home.slice();
  }

  function go(b, goal, dt, S, W, o) {
    const mv = b.mv, opt = o || {};
    if (SPECIES[b.beast].climb || !K.AI || !K.AI.steer) {
      const d = Math.hypot(goal[0] - mv.pos[0], goal[1] - mv.pos[2]);
      mv.walk = !!opt.walk;
      if (d < (opt.reach || 1)) return null;
      return { fwd: 1, side: 0, yaw: towards(mv, goal[0], goal[1], dt), sprint: !!opt.sprint };
    }
    const r = K.AI.steer(b, goal, dt, S, W, opt);
    if (r && !opt.sprint) r.sprint = false;
    return r;
  }

  function pack(S, b) {
    return b.group ? S.beasts.filter(q => q.group === b.group && !q.fight.down) : [b];
  }

  function attackFrom(b, spec) {
    const s = SPECIES[b.beast];
    return spec === 'bite' && s.bite ? s.bite : s.attack;
  }

  function strikeAt(S, b, tgt, A, events, rnd) {
    const F = tgt.fight, mv = b.mv;
    const head = b.frames ? pointOf(b.frames, 0, [0, 0, -SPECIES[b.beast].body.head]) : [mv.pos[0], mv.pos[1] + mv.chest, mv.pos[2]];
    const dir = K.v3 ? K.v3.norm(K.v3.sub(tgt.mv.pos, mv.pos)) : [0, 0, 1];
    const fb = K.Combat.view(F).fwd, toward = -(dir[0] * fb[0] + dir[2] * fb[2]);
    if (F.guard && F.shield && !(tgt.kit.cut || {}).lFore && toward > Math.cos(70 * Math.PI / 180) && F.guard.t >= 0.15) {
      events.push({ kind: 'block', who: b, to: tgt, at: [tgt.mv.pos[0], tgt.mv.pos[1] + 1, tgt.mv.pos[2]], material: 'wood', beast: true });
      if (tgt.mv) tgt.mv.stamina = Math.max(0, tgt.mv.stamina - 8);
      b.fight.stun = 0.6;
      return false;
    }
    const caps = K.Body.capsules(tgt.kit, tgt.frames), can = A.parts.filter(p => caps.some(c => c[0] === p)), part = can.length ? can[Math.floor(rnd() * Math.min(3, can.length))] : caps[0] && caps[0][0];
    const c = caps.find(q => q[0] === part) || caps[0];
    if (!c) return false;
    const at = [(c[1][0] + c[2][0]) / 2, (c[1][1] + c[2][1]) / 2, (c[1][2] + c[2][2]) / 2];
    const kind = A.tear && rnd() < A.tear ? 'chop' : A.kind;
    const att = { fight: { weapon: A.weapon, act: { kind: 'bite', power: A.power * (0.85 + rnd() * 0.3) }, exp: 'soldier', aim: { eye: head }, shield: false }, mv: { tired: mv.tired } };
    const r = K.Combat.strike(att, tgt, { part: c[0], tag: c[4], at, onBlade: true }, kind, rnd);
    F.life -= r.damage;
    if (K.Wounds) K.Wounds.hurt(tgt, r);
    F.hitBy = b;
    F.hitTime = S.time;
    if (F.hostile === null && tgt !== S.player && !tgt.state) { F.hostile = b; if (tgt.brain) { tgt.brain.lostT = 0; tgt.brain.last = mv.pos.slice(); tgt.brain.seenNow = true; } }
    events.push({ kind: 'hit', who: b, to: tgt, at, dir, part: r.part, type: r.type, damage: r.damage, material: r.material, heavy: r.damage >= 14 || r.cut !== null, beast: b.beast });
    if (r.cut !== null) {
      const parts = K.Combat.severs(tgt.kit, r.cut).filter(p => !(tgt.kit.cut || {})[K.Body.PARTS[p]]);
      if (parts.length) events.push({ kind: 'cut', who: b, to: tgt, at, dir, parts, iron: parts.every(p => (tgt.kit.pros || {})[K.Body.PARTS[p]]) });
    }
    if (A.knock && tgt.mv) { K.Move.shove(tgt.mv, dir, 1.4); F.stun = Math.max(F.stun || 0, 0.9); F.act = null; F.guard = null; }
    return true;
  }

  function lunge(S, b, tgt, dt, events, rnd, which) {
    const B = b.brain, F = b.fight, mv = b.mv, A = attackFrom(b, which);
    if (!A || F.stun > 0) return null;
    const d = flat(mv.pos, tgt.mv.pos), yaw = towards(mv, tgt.mv.pos[0], tgt.mv.pos[2], dt, 9);
    if (F.act) {
      F.act.t += dt;
      if (F.act.t >= A.wind) {
        const ang = Math.atan2(tgt.mv.pos[0] - mv.pos[0], -(tgt.mv.pos[2] - mv.pos[2])), facing = Math.abs(wrap(mv.yaw - ang)) < 1.0, behind = Math.abs(wrap(mv.yaw + Math.PI - ang)) < 1.3;
        if (d <= A.reach + 0.25 && (A.kick ? behind : facing)) strikeAt(S, b, tgt, A, events, rnd);
        F.act = null;
        B.next = S.time + A.rest * (0.8 + rnd() * 0.4);
        B.backUntil = S.time + 0.7;
      }
      return { fwd: d > A.reach * 0.7 ? 1 : 0, side: 0, yaw: A.kick ? mv.yaw : yaw, sprint: true };
    }
    if (S.time >= (B.next || 0) && d <= A.reach + 0.4) { F.act = { kind: 'lunge', t: 0, which }; events.push({ kind: 'growl', who: b, at: mv.pos.slice() }); }
    return null;
  }

  function flee(b, from, dt, sprint) {
    const mv = b.mv;
    mv.walk = false;
    return { fwd: 1, side: 0, yaw: away(mv, from, dt), sprint: sprint !== false };
  }

  function mindPack(b, S, W, dt, rnd, events) {
    const B = b.brain, mv = b.mv, F = b.fight, mates = pack(S, b), grp = groupOf(S, b), leader = mates.find(q => q.leader) || mates[0];
    if (legsLeft(b.kit) < 4 || F.life < F.max * 0.35 || (grp && grp.scared && S.time < grp.scared)) {
      B.state = 'flee';
      const foe = F.hitBy && F.hitBy.mv ? F.hitBy : threat(b, S, W, 25);
      if (foe && flat(mv.pos, foe.mv.pos) < 40) return flee(b, foe.mv.pos, dt);
      return go(b, b.home, dt, S, W, { walk: legsLeft(b.kit) < 4, reach: 3 }) || still(b);
    }
    const prey = S.prey || (S.prey = {}), gid = b.group || b.id;
    let tgt = prey[gid] && prey[gid].fight && !prey[gid].fight.down ? prey[gid] : null;
    if (!tgt) {
      const t = threat(b, S, W, night(S.hour) ? 40 : 10);
      if (t && (night(S.hour) || mates.length >= 3 || F.hitBy === t)) { tgt = t; prey[gid] = t; }
      else if (F.hitBy && F.hitBy.fight && !F.hitBy.fight.down && S.time - F.hitTime < 10) { tgt = F.hitBy; prey[gid] = tgt; }
    }
    if (tgt && flat(mv.pos, tgt.mv.pos) > 70) { tgt = null; prey[gid] = null; }
    if (tgt) {
      B.state = 'hunt';
      const d = flat(mv.pos, tgt.mv.pos), fire = lit(tgt, S), slotA = (mates.indexOf(b) / Math.max(1, mates.length)) * Math.PI * 2 + B.seed, ring = fire ? TORCH + 1.2 : 5.5;
      const busy = mates.filter(q => q.fight.act || q.brain.charge).length;
      if (!fire && !B.charge && S.time >= (B.next || 0) && S.time > (B.backUntil || 0) && busy < 2 && d < 9 && rnd() < dt * 1.5) B.charge = true;
      if (B.charge) {
        const hit = lunge(S, b, tgt, dt, events, rnd);
        if (hit) return hit;
        if (S.time < (B.backUntil || 0) || fire) { B.charge = false; }
        else { mv.walk = false; return { fwd: 1, side: 0, yaw: towards(mv, tgt.mv.pos[0], tgt.mv.pos[2], dt, 8), sprint: true }; }
      }
      if (S.time < (B.backUntil || 0)) return flee(b, tgt.mv.pos, dt, false);
      const sx = tgt.mv.pos[0] + Math.cos(slotA + S.time * 0.25) * ring, sz = tgt.mv.pos[2] + Math.sin(slotA + S.time * 0.25) * ring;
      mv.walk = d < ring + 3;
      if (fire && d < TORCH + 0.5) return flee(b, tgt.mv.pos, dt, false);
      return { fwd: Math.hypot(sx - mv.pos[0], sz - mv.pos[2]) > 0.8 ? 1 : 0, side: 0, yaw: towards(mv, sx, sz, dt, 6), sprint: d > 14 };
    }
    B.charge = false;
    if (!night(S.hour)) {
      B.state = 'sleep';
      if (Math.hypot(mv.pos[0] - b.home[0], mv.pos[2] - b.home[1]) > 6) return go(b, b.home, dt, S, W, { walk: false, reach: 4 }) || still(b);
      return still(b, 'sleep');
    }
    B.state = 'roam';
    if (b === leader) {
      if (!B.goal || Math.hypot(B.goal[0] - mv.pos[0], B.goal[1] - mv.pos[2]) < 3 || S.time > (B.goalUntil || 0)) { B.goal = roamGoal(b, W, rnd); B.goalUntil = S.time + 90; }
      return go(b, B.goal, dt, S, W, { walk: false, reach: 2 }) || still(b);
    }
    const lp = leader.mv.pos, k = mates.indexOf(b), off = [Math.cos(k * 2.1) * 3, Math.sin(k * 2.1) * 3];
    const fd = Math.hypot(lp[0] + off[0] - mv.pos[0], lp[2] + off[1] - mv.pos[2]);
    if (fd < 1.5) return { fwd: 0, side: 0, yaw: towards(mv, lp[0], lp[2], dt, 2) };
    return go(b, [lp[0] + off[0], lp[2] + off[1]], dt, S, W, { walk: fd < 6, reach: 1.2 }) || still(b);
  }

  function roamGoal(b, W, rnd) {
    const road = K.Places.ROADS.find(r => r.id === 'forest'), pts = road.pts.filter(p => Math.hypot(p[0] - b.home[0], p[1] - b.home[1]) < 260);
    if (pts.length && rnd() < 0.7) { const p = pts[Math.floor(rnd() * pts.length)]; return [p[0] + (rnd() - 0.5) * 30, p[1] + (rnd() - 0.5) * 30]; }
    return wanderGoal(b, W, rnd, 120);
  }

  const still = (b, how) => { b.brain.pose = how || null; return { fwd: 0, side: 0, yaw: b.mv.yaw }; };

  function graze(b, S, W, dt, rnd, r, walk) {
    const B = b.brain, mv = b.mv;
    if (!B.goal || S.time > (B.goalUntil || 0)) {
      if (rnd() < 0.45) { B.goal = null; B.goalUntil = S.time + 4 + rnd() * 8; B.pose = 'eat'; }
      else { B.goal = wanderGoal(b, W, rnd, r); B.goalUntil = S.time + 20; B.pose = null; }
    }
    if (!B.goal) return still(b, 'eat');
    const step = go(b, B.goal, dt, S, W, { walk: walk !== false, reach: 1 });
    if (!step) { B.goal = null; B.goalUntil = S.time + 3 + rnd() * 6; return still(b, 'eat'); }
    return step;
  }

  function mindShy(b, S, W, dt, rnd, events, r) {
    const B = b.brain, s = SPECIES[b.beast], foe = threat(b, S, W, r) || (b.fight.hitBy && S.time - b.fight.hitTime < 6 ? b.fight.hitBy : null);
    if (foe && foe.mv) { B.fleeFrom = foe.mv.pos.slice(); B.fleeUntil = S.time + 5; }
    if (S.time < (B.fleeUntil || 0)) {
      B.state = 'flee';
      if (b.beast === 'hare' && Math.floor(S.time * 1.6 + B.seed) % 2) b.mv.yaw += (Math.sin(S.time * 7 + B.seed) * 0.8) * dt * 4;
      if (s.attack && b.fight.hitBy && flat(b.mv.pos, b.fight.hitBy.mv.pos) < 2.5 && b.beast !== 'hare') { const hit = lunge(S, b, b.fight.hitBy, dt, events, rnd); if (hit) return hit; }
      return flee(b, B.fleeFrom, dt);
    }
    B.state = 'graze';
    return graze(b, S, W, dt, rnd, b.groupR || 30);
  }

  function mindBear(b, S, W, dt, rnd, events) {
    const B = b.brain, mv = b.mv, F = b.fight;
    if (F.life < F.max * 0.5 || legsLeft(b.kit) < 4) {
      B.state = 'flee';
      const foe = F.hitBy && F.hitBy.mv ? F.hitBy : null;
      if (foe && flat(mv.pos, foe.mv.pos) < 60) return flee(b, foe.mv.pos, dt);
      return still(b);
    }
    const homeD = Math.hypot(mv.pos[0] - b.home[0], mv.pos[2] - b.home[1]);
    let tgt = B.target && B.target.fight && !B.target.fight.down ? B.target : null;
    if (!tgt) tgt = threat(b, S, W, 22) || (F.hitBy && F.hitBy.fight && !F.hitBy.fight.down && S.time - F.hitTime < 15 ? F.hitBy : null);
    if (tgt && Math.hypot(tgt.mv.pos[0] - b.home[0], tgt.mv.pos[2] - b.home[1]) > 45 && F.hitBy !== tgt) tgt = null;
    B.target = tgt;
    if (tgt) {
      B.state = 'charge';
      const d = flat(mv.pos, tgt.mv.pos), which = tgt.fight.down || d < 1.2 || (B.swipes || 0) % 3 === 2 ? 'bite' : 'paw';
      const hit = lunge(S, b, tgt, dt, events, rnd, which);
      if (F.act === null && B.next > S.time - dt && B.lastNext !== B.next) { B.swipes = (B.swipes || 0) + 1; B.lastNext = B.next; }
      if (hit) return hit;
      if (S.time < (B.backUntil || 0)) return { fwd: 0, side: 0, yaw: towards(mv, tgt.mv.pos[0], tgt.mv.pos[2], dt, 3) };
      mv.walk = false;
      return { fwd: d > 1.2 ? 1 : 0, side: 0, yaw: towards(mv, tgt.mv.pos[0], tgt.mv.pos[2], dt, 4), sprint: d > 4 };
    }
    if (homeD > 25) return go(b, b.home, dt, S, W, { walk: true, reach: 5 }) || still(b);
    B.state = 'graze';
    return graze(b, S, W, dt, rnd, 20);
  }

  function mindBoar(b, S, W, dt, rnd, events) {
    const B = b.brain, mv = b.mv, F = b.fight;
    if (!b.leader) return mindShy(b, S, W, dt, rnd, events, 18);
    let tgt = B.target && B.target.fight && !B.target.fight.down && flat(mv.pos, B.target.mv.pos) < 40 ? B.target : null;
    if (!tgt) tgt = threat(b, S, W, 15) || (F.hitBy && F.hitBy.fight && !F.hitBy.fight.down ? F.hitBy : null);
    B.target = tgt;
    if (!tgt) { B.state = 'graze'; B.pass = null; return graze(b, S, W, dt, rnd, 20); }
    B.state = 'charge';
    const d = flat(mv.pos, tgt.mv.pos);
    if (B.pass && S.time < B.pass) return { fwd: 1, side: 0, yaw: mv.yaw, sprint: true };
    const hit = lunge(S, b, tgt, dt, events, rnd);
    if (hit) { B.pass = S.time + 0.9; return hit; }
    mv.walk = false;
    return { fwd: 1, side: 0, yaw: towards(mv, tgt.mv.pos[0], tgt.mv.pos[2], dt, d < 4 ? 2 : 5), sprint: true };
  }

  function mindHerd(b, S, W, dt, rnd, events) {
    const B = b.brain, mates = pack(S, b);
    const foe = mates.map(q => threat(q, S, W, q === b ? 30 : 18)).find(Boolean) || (b.fight.hitBy && S.time - b.fight.hitTime < 8 ? b.fight.hitBy : null);
    if (foe && foe.mv) { for (const q of mates) { q.brain.fleeFrom = foe.mv.pos.slice(); q.brain.fleeUntil = S.time + 7; } }
    if (b.sex === 'm' && b.fight.hitBy && b.fight.hitBy.mv && flat(b.mv.pos, b.fight.hitBy.mv.pos) < 3 && S.time - b.fight.hitTime < 4) { const hit = lunge(S, b, b.fight.hitBy, dt, events, rnd); if (hit) return hit; }
    if (S.time < (B.fleeUntil || 0)) { B.state = 'flee'; return flee(b, B.fleeFrom, dt); }
    B.state = 'graze';
    return graze(b, S, W, dt, rnd, 30);
  }

  function mindGoat(b, S, W, dt, rnd, events) {
    const B = b.brain, mv = b.mv, T = W.terrain, foe = threat(b, S, W, 25);
    if (foe) { B.fleeFrom = foe.mv.pos.slice(); B.fleeUntil = S.time + 6; }
    if (S.time < (B.fleeUntil || 0)) {
      B.state = 'flee';
      let best = mv.yaw, bh = -Infinity;
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2, x = mv.pos[0] + Math.sin(a) * 6, z = mv.pos[2] - Math.cos(a) * 6, h = T.heightAt(x, z) + Math.hypot(x - B.fleeFrom[0], z - B.fleeFrom[2]) * 0.3;
        if (h > bh) { bh = h; best = a; }
      }
      mv.walk = false;
      return { fwd: 1, side: 0, yaw: turn(mv.yaw, best, 5 * dt), sprint: true };
    }
    B.state = 'graze';
    return graze(b, S, W, dt, rnd, 25);
  }

  function track(b, S, W, dt) {
    const B = b.brain, T = B.track, mv = b.mv;
    if (!T || !T.target || !T.target.fight || T.target.fight.down) { B.track = null; return null; }
    const tg = T.target, d = flat(mv.pos, tg.mv.pos);
    if (d < 14 && senses(b, tg, W, S)) { T.lost = 0; return 'seen'; }
    let best = null, bt = Infinity;
    for (const p of S.blood || []) {
      if (p.born <= T.last) continue;
      const pd = Math.hypot(p.x - mv.pos[0], p.z - mv.pos[2]);
      if (pd < 12 && p.born < bt) { bt = p.born; best = p; }
    }
    if (best) {
      if (Math.hypot(best.x - mv.pos[0], best.z - mv.pos[2]) < 1.2) T.last = best.born;
      T.at = [best.x, best.z];
      T.lost = 0;
    } else T.lost = (T.lost || 0) + dt;
    if (T.lost > 20) { B.track = null; return null; }
    return T.at || null;
  }

  function mindDog(b, S, W, dt, rnd, events) {
    const B = b.brain, mv = b.mv, F = b.fight;
    if (F.life < F.max * 0.3 || legsLeft(b.kit) < 4) { B.state = 'flee'; return F.hitBy && F.hitBy.mv ? flee(b, F.hitBy.mv.pos, dt) : still(b); }
    if (B.track) {
      const t = track(b, S, W, dt);
      if (t === 'seen') { B.target = B.track.target; B.track = null; }
      else if (t) { B.state = 'track'; mv.walk = false; if (S.time > (B.barkAt || 0) + 2) { B.barkAt = S.time; events.push({ kind: 'bark', who: b, at: mv.pos.slice() }); } return go(b, t, dt, S, W, { reach: 0.6, sprint: false }) || still(b); }
    }
    let tgt = B.target && B.target.fight && !B.target.fight.down && flat(mv.pos, B.target.mv.pos) < 50 ? B.target : null;
    if (!tgt && F.hitBy && F.hitBy.fight && !F.hitBy.fight.down && S.time - F.hitTime < 20) tgt = F.hitBy;
    if (!tgt) {
      for (const q of others(S)) {
        const h = q.fight.hostile;
        if (h && h.team === b.owner && stranger(b, q, S) && flat(mv.pos, q.mv.pos) < 25) { tgt = q; break; }
      }
    }
    const near = threat(b, S, W, 20);
    if (!tgt && near && night(S.hour) && flat(mv.pos, near.mv.pos) < 4) tgt = near;
    B.target = tgt;
    if (tgt) {
      B.state = 'attack';
      const hit = lunge(S, b, tgt, dt, events, rnd);
      if (hit) return hit;
      if (S.time < (B.backUntil || 0)) return flee(b, tgt.mv.pos, dt, false);
      mv.walk = false;
      return { fwd: 1, side: 0, yaw: towards(mv, tgt.mv.pos[0], tgt.mv.pos[2], dt, 8), sprint: true };
    }
    if (near) {
      B.state = 'bark';
      if (S.time > (B.barkAt || 0) + 1.5) { B.barkAt = S.time; events.push({ kind: 'bark', who: b, at: mv.pos.slice() }); }
      const d = flat(mv.pos, near.mv.pos);
      return { fwd: d > 7 ? 1 : d < 4 ? -1 : 0, side: 0, yaw: towards(mv, near.mv.pos[0], near.mv.pos[2], dt, 6) };
    }
    B.state = 'graze';
    return graze(b, S, W, dt, rnd, b.groupR || 10);
  }

  function mindStock(b, S, W, dt, rnd, events) {
    const B = b.brain, F = b.fight;
    if (F.hitBy && F.hitBy.mv && S.time - F.hitTime < 5) {
      const s = SPECIES[b.beast];
      if (s.attack && s.attack.kick && flat(b.mv.pos, F.hitBy.mv.pos) < 2.2) { const hit = lunge(S, b, F.hitBy, dt, events, rnd); if (hit) return hit; }
      B.state = 'flee';
      return flee(b, F.hitBy.mv.pos, dt);
    }
    if (B.lead) {
      B.state = 'led';
      const step = go(b, B.lead.to, dt, S, W, { walk: true, reach: B.lead.reach || 1.5 });
      if (step) return step;
      B.lead.done = true;
      return still(b);
    }
    B.state = 'graze';
    return graze(b, S, W, dt, rnd, b.groupR || 6);
  }

  function birdStep(b, S, dt, W) {
    const B = b.brain, mv = b.mv, s = SPECIES[b.beast], T = W.terrain;
    let c = b.home, alt = b.alt || 40, r = b.groupR || 40;
    if (b.beast === 'crow') {
      const spot = B.over;
      if (!spot) return;
      c = spot;
      alt = 14 + (B.seed % 6);
      r = 7 + (B.seed % 5);
    }
    B.ang = (B.ang === undefined ? B.seed : B.ang) + dt * s.speed[0] / r * (b.id % 2 ? 1 : -1);
    const x = c[0] + Math.cos(B.ang) * r, z = c[1] + Math.sin(B.ang) * r, y = T.heightAt(c[0], c[1]) + alt + Math.sin(B.ang * 0.7) * 2;
    const vx = x - mv.pos[0], vz = z - mv.pos[2];
    mv.yaw = Math.atan2(vx, -vz);
    mv.vel = [vx / Math.max(dt, 1e-3), (y - mv.pos[1]) / Math.max(dt, 1e-3), vz / Math.max(dt, 1e-3)];
    mv.pos = [x, y, z];
    mv.speed = s.speed[0];
    mv.onGround = false;
  }

  const MINDS = { pack: mindPack, shy: (b, S, W, dt, rnd, ev) => mindShy(b, S, W, dt, rnd, ev, SPECIES[b.beast].sense[0] * 0.6), bear: mindBear, boar: mindBoar, herd: mindHerd, goat: mindGoat, dog: mindDog, stock: mindStock, draft: mindStock };

  const groupOf = (S, b) => b.group && S.fauna ? S.fauna[b.group] || null : null;

  function struck(S, att, b, hit, kind, events, rnd, by) {
    const s = SPECIES[b.beast], F = b.fight, wp = K.Data.WEAPONS[att.fight.weapon] || K.Data.SHOTS[att.fight.weapon] || K.Data.BITES[att.fight.weapon], a = att.fight.act || {};
    const fx = K.Data.EXP[att.fight.exp] || K.Data.EXP.soldier, power = (a.power || 0.6) * (att.mv && att.mv.tired ? 0.7 : 1) * fx.strength;
    let type = kind, base = wp[kind] || 0;
    if (!hit.onBlade) { type = 'blunt'; base = Math.max(wp.chop, wp.crush, wp.stab) * 0.3; }
    else if (!base) { type = 'crush'; base = Math.max(wp.crush, wp.chop, wp.stab) * 0.45; }
    const part = hit.part, damage = base * power * PART_HIT[part] * s.hide;
    F.life -= damage;
    const who = by || (att.mv && att.mv.pos ? att : null);
    if (who) F.hitBy = who;
    F.hitTime = S.time;
    if (type !== 'blunt' && type !== 'crush') F.bleed = Math.min(3, F.bleed + damage * 0.015);
    const dir = K.v3.norm(K.v3.sub(hit.at, att.fight.aim.eye));
    events.push({ kind: 'hit', who, to: b, at: hit.at, dir, part, type, damage, material: 'flesh', heavy: damage >= 14, beast: b.beast, prey: true });
    const leg = LEG_OF[part];
    if (type === 'chop' && wp.cut) {
      const force = wp.cut * power * (0.9 + 0.2 * rnd());
      if (leg && !b.kit.cut[leg] && force > s.cut) {
        const upper = LEGS[leg][0] === part;
        b.kit.cut = Object.assign({}, b.kit.cut, { [leg]: upper ? 'up' : 'lo' });
        F.bleed = Math.max(F.bleed, 1.5);
        events.push({ kind: 'maim', who, to: b, at: hit.at, dir, leg, part, beast: b.beast });
        piece(S, b, upper ? LEGS[leg] : [LEGS[leg][1]], hit.at);
        if (legsLeft(b.kit) <= 2) F.life = Math.min(F.life, 0);
      } else if (s.headCut && (part === 0 || part === 1) && !b.kit.cut.head && force > s.cut * 0.8) {
        b.kit.cut = Object.assign({}, b.kit.cut, { head: true });
        events.push({ kind: 'maim', who, to: b, at: hit.at, dir, head: true, part, beast: b.beast });
        piece(S, b, [0], hit.at);
        F.life = -1;
      }
    }
    if (s.mind === 'stock' || s.mind === 'draft' || b.beast === 'dog') anger(S, b, who);
    const grp = groupOf(S, b);
    if (grp && s.mind === 'pack') {
      grp.hurt = (grp.hurt || 0) + damage;
      const mates = pack(S, b), whole = mates.reduce((sum, q) => sum + q.fight.max, 0);
      if (grp.hurt > whole * 0.2 && !(grp.scared > S.time)) { grp.scared = S.time + 900; if (S.prey) S.prey[b.group] = null; events.push({ kind: 'packFlees', group: b.group }); }
    }
    if (damage > 15 && s.mind === 'pack') { b.brain.backUntil = S.time + 2.5; b.brain.charge = false; }
    return { part, type, damage, material: 'flesh', cut: null, eye: null };
  }

  function anger(S, b, who) {
    if (b.owner && who && who === S.player) b.angered = true;
  }

  function piece(S, b, parts, at) {
    const fr = new Float32Array(NP * 12);
    fr.set(b.frames);
    const g = at[1] - 0.05;
    for (const p of parts) {
      const o = p * 12, R = mul(yawM(b.mv.yaw + 0.7 * p), rz(Math.PI / 2)), oy = fr[o + 10];
      put(fr, p, R, [fr[o + 9], Math.min(oy, g + 0.06), fr[o + 11]]);
    }
    (S.carcasses || (S.carcasses = [])).push({ id: S.nextId++, beast: b.beast, kit: JSON.parse(JSON.stringify(b.kit)), frames: fr, parts: parts.slice(), piece: true, born: S.time, at: [at[0], at[2]] });
    S.version = (S.version || 0) + 1;
  }

  function lay(c, W) {
    const s = SPECIES[c.beast], ghost = { beast: c.beast, kit: c.kit, mv: { pos: [c.at[0], W.terrain.heightAt(c.at[0], c.at[1]), c.at[1]], yaw: c.yaw || 0 } };
    c.frames = fk(ghost, K.Anim.beastDead(s, c.id), W, c.frames || new Float32Array(NP * 12));
    if (s.fly) { const lift = W.terrain.heightAt(c.at[0], c.at[1]) + s.body.rx - c.frames[2 * 12 + 10]; for (let i = 0; i < NP; i++) c.frames[i * 12 + 10] += lift; }
    return c;
  }

  function carcassOf(S, b, W) {
    const mv = b.mv;
    return lay({ id: b.id, beast: b.beast, kit: b.kit, born: S.time, at: [mv.pos[0], mv.pos[2]], skinned: false, group: b.group, owner: b.owner || null, yaw: mv.yaw }, W);
  }

  function follow(b, target) {
    b.brain.track = { target, last: -Infinity, lost: 0, at: null };
    return b.brain.track;
  }

  function kill(S, b, W, events) {
    const c = carcassOf(S, b, W);
    (S.carcasses || (S.carcasses = [])).push(c);
    S.beasts.splice(S.beasts.indexOf(b), 1);
    b.fight.down = 'dead';
    const grp = groupOf(S, b);
    if (grp) {
      grp.count = Math.max(0, grp.count - 1);
      grp.lost = (grp.lost || 0) + 1;
      if (SPECIES[b.beast].mind === 'pack' && (grp.lost >= 2 || b.leader)) { grp.scared = S.time + 900; if (S.prey) S.prey[b.group] = null; events.push({ kind: 'packFlees', group: b.group }); }
    }
    if (b.owner && b.angered) {
      const R = S.relations || (S.relations = {});
      R[b.owner] = (R[b.owner] || 0) - 5;
      events.push({ kind: 'owner', beast: b, owner: b.owner, change: -5 });
    }
    events.push({ kind: 'kill', who: b.fight.hitBy, beast: b, carcass: c });
    S.version = (S.version || 0) + 1;
    return c;
  }

  function skin(S, c, bag) {
    if (c.skinned || c.piece) return null;
    const got = SPECIES[c.beast].yield.map(([id, n]) => ({ id, n }));
    for (const g2 of got) { const have = bag.find(s => s.id === g2.id); if (have) have.n += g2.n; else bag.push({ id: g2.id, n: g2.n }); }
    c.skinned = true;
    c.kit = Object.assign({}, c.kit, { skin: [0.5, 0.12, 0.1], hairColor: [0.42, 0.1, 0.08], main: [0.6, 0.18, 0.14] });
    S.version = (S.version || 0) + 1;
    return got;
  }

  const SKIN_TIME = 4;
  const canSkin = (who, bag) => (bag || who.sack || []).some(s => s.id === 'knife' && s.n > 0) || (who.fight && who.fight.weapon === 'knife');

  function fauna(S) {
    if (!S.fauna) {
      S.fauna = {};
      for (const G of GROUPS) {
        const r = K.rng(G.at[0] * 31 + G.at[1] * 17), n = G.n[0] + Math.floor(r() * (G.n[1] - G.n[0] + 1));
        S.fauna[G.id] = { count: n, max: G.n[1], lost: 0, day: S.day || 1, active: false };
      }
    }
    return S.fauna;
  }

  function spawnGroup(S, G, W) {
    const f = fauna(S)[G.id], s = SPECIES[G.kind], rnd = K.rng((S.nextId || 1) * 13 + G.at[0]);
    if (f.active || !f.count) return [];
    const out = [];
    for (let i = 0; i < f.count; i++) {
      const a = rnd() * Math.PI * 2, d = (G.r || 6) * 0.5 * Math.sqrt(rnd()), x = G.at[0] + Math.cos(a) * d, z = G.at[1] + Math.sin(a) * d;
      const b = make(S.nextId++, G.kind, x, z, rnd() * Math.PI * 2, W, { group: G.id, owner: G.owner, home: G.at.slice(), leader: i === 0 && (s.mind === 'pack' || s.mind === 'boar'), sex: i === 0 && (s.mind === 'pack' || s.mind === 'boar' || s.mind === 'herd') ? 'm' : null, alt: G.alt });
      b.groupR = G.r;
      b.alt = G.alt;
      out.push(b);
    }
    (S.beasts || (S.beasts = [])).push(...out);
    f.active = true;
    f.lost = 0;
    return out;
  }

  function despawn(S, gid) {
    const f = S.fauna[gid], left = S.beasts.filter(b => b.group === gid);
    f.count = left.length;
    f.active = false;
    if (S.prey) S.prey[gid] = null;
    S.beasts = S.beasts.filter(b => b.group !== gid);
  }

  function regrow(S) {
    const day = S.day || 1;
    for (const G of GROUPS) {
      const f = fauna(S)[G.id];
      if (f.active) { f.day = day; continue; }
      while (f.day < day) { f.day++; if (f.count < f.max) f.count = Math.min(f.max, f.count + Math.max(1, Math.ceil(f.max / 6))); }
    }
  }

  function census(S, W) {
    const focus = S.player ? S.player.mv.pos : S.focus || null;
    fauna(S);
    regrow(S);
    if (!focus) return;
    for (const G of GROUPS) {
      const f = S.fauna[G.id], d = Math.hypot(focus[0] - G.at[0], focus[2] - G.at[1]);
      if (!f.active && d < ACTIVE) spawnGroup(S, G, W);
      else if (f.active && d > IDLE && !S.beasts.some(b => b.group === G.id && (b.brain.state === 'hunt' || b.brain.state === 'charge' || b.brain.state === 'attack'))) despawn(S, G.id);
    }
    crows(S, W);
  }

  function crows(S, W) {
    const spots = [];
    const old = t => S.time - t > CORPSE_CROWS;
    for (const b of S.bodies || []) { if (!old(b.born)) continue; const a = K.Body.anchorOf(b); spots.push([a[0], a[2]]); }
    for (const c of S.carcasses || []) if (!c.piece && old(c.born)) spots.push(c.at);
    const clusters = [];
    for (const p of spots) if (!clusters.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 30)) clusters.push(p);
    const have = S.beasts.filter(b => b.beast === 'crow');
    for (const b of have) if (!clusters.some(q => b.brain.over && Math.hypot(q[0] - b.brain.over[0], q[1] - b.brain.over[1]) < 1)) S.beasts.splice(S.beasts.indexOf(b), 1);
    for (const q of clusters.slice(0, 4)) {
      const n = S.beasts.filter(b => b.beast === 'crow' && b.brain.over && b.brain.over[0] === q[0] && b.brain.over[1] === q[1]).length;
      for (let i = n; i < 3; i++) {
        const b = make(S.nextId++, 'crow', q[0], q[1], 0, W, { alt: 16 });
        b.brain.over = q.slice();
        b.home = q.slice();
        S.beasts.push(b);
      }
    }
  }

  function step(S, dt, W, rnd) {
    const events = [];
    if (!S.beasts) S.beasts = [];
    S.censusAt = (S.censusAt || 0) - dt;
    if (S.censusAt <= 0) { S.censusAt = 1; census(S, W); }
    const focus = S.player ? S.player.mv.pos : S.focus || null;
    for (const b of S.beasts.slice()) {
      const s = SPECIES[b.beast], B = b.brain, F = b.fight, mv = b.mv;
      if (F.life <= 0) { kill(S, b, W, events); continue; }
      if (F.stun > 0) F.stun = Math.max(0, F.stun - dt);
      if (F.bleed > 0) {
        F.life -= F.bleed * dt;
        F.bleed = Math.max(0, F.bleed - dt * 0.02);
        B.drip = (B.drip || 0) - dt * (0.5 + F.bleed);
        if (B.drip <= 0) { B.drip = 1; K.Wounds.pool(S, mv.pos[0], mv.pos[2], 0.04 + F.bleed * 0.02, S.time, W.terrain.heightAt(mv.pos[0], mv.pos[2])); }
        if (F.life <= 0) { kill(S, b, W, events); continue; }
      }
      if (s.fly) { birdStep(b, S, dt, W); K.Anim.beastUpdate(b.anim, b, dt); fk(b, K.Anim.beastPose(b.anim, s, b), W); continue; }
      if (b.hitch) { B.state = 'harness'; F.aim = { eye: [mv.pos[0], mv.pos[1] + mv.eye, mv.pos[2]], yaw: mv.yaw, pitch: 0 }; K.Anim.beastUpdate(b.anim, b, dt); fk(b, K.Anim.beastPose(b.anim, s, b), W); continue; }
      B.tick -= dt;
      const far = focus && flat(focus, mv.pos) > ACTIVE * 0.6;
      let inp = B.inp;
      if (!far || B.tick <= 0 || F.act || B.charge) {
        const ddt = far && !F.act && !B.charge ? FAR_TICK : dt;
        B.tick = FAR_TICK;
        B.pose = null;
        inp = (MINDS[s.mind] || mindStock)(b, S, W, ddt, rnd, events) || still(b);
        B.inp = inp;
      }
      const legs = legsLeft(b.kit);
      mv.speeds = legs >= 4 ? { walk: s.speed[0], run: s.speed[1], sprint: s.speed[2], swim: 1 } : { walk: s.speed[0] * 0.5, run: s.speed[0] * 0.8, sprint: s.speed[0] * 0.8, swim: 0.6 };
      mv.lame = legs < 4;
      if (legs <= 2 || F.stun > 0.3) inp = { fwd: 0, side: 0, yaw: mv.yaw };
      mv.limit = null;
      mv.brush = false;
      K.Move.step(mv, Object.assign({ fwd: 0, side: 0 }, inp, { yaw: inp.yaw === undefined ? mv.yaw : inp.yaw }), dt, W);
      F.aim = { eye: [mv.pos[0], mv.pos[1] + mv.eye, mv.pos[2]], yaw: mv.yaw, pitch: 0 };
      K.Anim.beastUpdate(b.anim, b, dt);
      fk(b, K.Anim.beastPose(b.anim, s, b), W);
    }
    return events;
  }

  function duel(who, tgt, dt, rnd, S) {
    const F = who.fight, mv = who.mv, B = who.brain || (who.brain = K.AI.brain());
    const jumper = S ? (S.beasts || []).filter(q => q.fight.act && !q.fight.down && flat(q.mv.pos, mv.pos) < 3).sort((p, q) => flat(p.mv.pos, mv.pos) - flat(q.mv.pos, mv.pos))[0] : null;
    if (jumper && F.shield && !F.act) { K.Combat.guard(F, true, 'down'); const y = turn(mv.yaw, Math.atan2(jumper.mv.pos[0] - mv.pos[0], -(jumper.mv.pos[2] - mv.pos[2])), 12 * dt); F.aim = { eye: [mv.pos[0], mv.pos[1] + (mv.eye || K.METRICS.eyeStand), mv.pos[2]], yaw: y, pitch: -0.4 }; return { fwd: 0, side: 0, yaw: y, sprint: false }; }
    const dx = tgt.mv.pos[0] - mv.pos[0], dz = tgt.mv.pos[2] - mv.pos[2], d = Math.hypot(dx, dz), wp = F.weapon ? K.Data.WEAPONS[F.weapon] : null;
    const yaw = turn(mv.yaw, Math.atan2(dx, -dz), 7 * dt), low = tgt.mv.chest;
    const eye = [mv.pos[0], mv.pos[1] + (mv.eye || K.METRICS.eyeStand), mv.pos[2]];
    F.aim = { eye, yaw, pitch: Math.atan2(tgt.mv.pos[1] + low - eye[1], Math.max(0.3, d)) };
    const inp = { fwd: 0, side: 0, yaw, sprint: false };
    mv.walk = false;
    if (!wp) { inp.fwd = d < 6 ? -1 : 0; return inp; }
    const reach = wp.reach - 0.1;
    inp.fwd = d > reach ? 1 : d < reach - 0.6 ? -0.5 : 0;
    B.t = (B.t || 0) + dt;
    const a = F.act;
    if (a && a.kind === 'wind' && !a.released && a.t >= (B.windFor || 0.2)) K.Combat.release(F, mv);
    if (!a && !F.guard && F.stun <= 0 && d <= reach + 0.15 && B.t >= (B.next || 0)) {
      K.Combat.press(F);
      const down = low < 0.9;
      if (wp.stab > 0 && (rnd() < 0.4 || F.weapon === 'spear')) B.windFor = 0.08;
      else { F.steer = down ? [rnd() < 0.5 ? -40 : 40, -100] : [rnd() < 0.5 ? -100 : 100, 0]; B.windFor = wp.wind[0] + (wp.wind[1] - wp.wind[0]) * (0.3 + rnd() * 0.5); }
      B.next = B.t + 0.4 + rnd() * 0.5;
    }
    if (F.guard && !jumper) K.Combat.guard(F, false);
    return inp;
  }

  function lead(b, to, reach) {
    b.brain.lead = { to: to.slice(), reach: reach || 1.5, done: false };
    return b.brain.lead;
  }

  const byId = (S, id) => (S.beasts || []).find(b => b.id === id) || (S.carcasses || []).find(c => c.id === id) || null;

  K.Beasts = { PARTS, NP, LEGS, SPECIES, GROUPS, PART_HIT, TORCH, SKIN_TIME, make, fk, lay, follow, capsules, legsLeft, struck, strikeAt, kill, skin, canSkin, fauna, spawnGroup, despawn, census, regrow, step, duel, lead, byId, night, lit, senses, track };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
