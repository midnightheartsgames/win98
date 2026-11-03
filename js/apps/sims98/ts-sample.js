(function (S) {
  'use strict';
  const H = S.House;
  const BASE = 1, LIFT = 0.25, MAIN_X = 326, MAIN_Z = 296, NEXT_X = 364, NEXT_Z = 296;
  const WARM = [1, 0.84, 0.6], PORCH = [1, 0.9, 0.7];

  const LAMP = [13.5, 9.5];
  const AQUARIUM = [12.5, 10.5];

  const PAINTS = {
    siding: 1, kitchen: 2, living: 3, hall: 4, bedroom: 5, study: 6, tile: 7, wood: 8, moss: 9, rust: 10,
    brick: 11, cap: 12, band: 13, trim: 14, shingle: 15, gravel: 16, slate: 17, blue: 18, landing: 19
  };

  const SURFACES = [
    { pattern: 'siding', colors: ['#dcd5bb', '#7c7663', '#cec7ab'] },
    { pattern: 'plaster', colors: ['#e6dcb6', '#d8cda6'] },
    { pattern: 'wallpaper', colors: ['#bccaa6', '#90a07d', '#aab893'] },
    { pattern: 'stripes', colors: ['#dac7a4', '#c9b490'] },
    { pattern: 'wallpaper', colors: ['#c9b5c7', '#a18ca1', '#b7a2b5'] },
    { pattern: 'plaster', colors: ['#bac9d2', '#abbbc5'] },
    { pattern: 'tile', colors: ['#dbd8c8', '#b3bdb7', '#7f7f74'] },
    { pattern: 'planks', colors: ['#a0713f', '#5f4024', '#8f6236'] },
    { pattern: 'carpet', colors: ['#71835f', '#637453'] },
    { pattern: 'carpet', colors: ['#905e58', '#804f4b'] },
    { pattern: 'brick', colors: ['#8f5c47', '#bcab93', '#7c4d3c'] },
    { pattern: 'solid', colors: ['#5f554a'] },
    { pattern: 'solid', colors: ['#c8c0a6'] },
    { pattern: 'solid', colors: ['#efead9'] },
    { pattern: 'shingle', colors: ['#7f4c3c', '#4c2d23', '#6e4134'] },
    { pattern: 'gravel', colors: ['#8d8a80', '#74716a', '#a09d92'] },
    { pattern: 'shingle', colors: ['#526773', '#2e3c44', '#475a65'] },
    { pattern: 'siding', colors: ['#cad7db', '#6a787d', '#bac8cc'] },
    { pattern: 'plaster', colors: ['#d9d0bb', '#cbc2ac'] }
  ];

  const FAMILY = [
    { id: 'viktor', name: 'Виктор', surname: 'Вандербек', spouse: 'astrid', age: 'adult', sex: 'm', traits: ['couchPotato', 'grumpy', 'naturalCook', 'neurotic', 'absentMinded'], hair: 'short', x: 16.5, z: 14.5, yaw: 0.6, look: { sex: 'm', skin: '#dcae8c', hair: '#3e2a1c', eyes: '#3c5a7c', shirt: '#55789f', trousers: '#3c4458', shoes: '#2c2622', sleeve: 'long', legs: 'long' } },
    { id: 'astrid', name: 'Астрид', surname: 'Вандербек', age: 'adult', sex: 'f', traits: ['artistic', 'athletic', 'excitable', 'natureLover', 'friendly'], bag: ['guitar'], hair: 'long', x: 15.5, z: 9.5, yaw: -1.2, look: { sex: 'f', skin: '#e8c2a4', hair: '#a8743a', eyes: '#3f6e52', shirt: '#b0504a', trousers: '#4c4a5a', shoes: '#38282a', sleeve: 'short', legs: 'long' } },
    { id: 'hugo', name: 'Хьюго', surname: 'Вандербек', parents: ['viktor', 'astrid'], age: 'child', sex: 'm', traits: ['clumsy', 'goodHumor', 'artistic'], hair: 'short', x: 14.5, z: 15.5, yaw: 2.4, look: { sex: 'm', skin: '#dcae8c', hair: '#6a4426', eyes: '#3c5a7c', shirt: '#d09a3e', trousers: '#4a6a5a', shoes: '#3a3030', sleeve: 'short', legs: 'short' } },
    { id: 'lily', name: 'Лили', surname: 'Вандербек', parents: ['viktor', 'astrid'], age: 'teen', sex: 'f', traits: ['computerWhiz', 'loner', 'bookworm', 'hotHeaded'], hair: 'long', x: 15.5, z: 15.5, yaw: 3.6, look: { sex: 'f', skin: '#efd4bc', hair: '#2a2228', eyes: '#50504a', shirt: '#3e3a48', trousers: '#2e2c36', shoes: '#1e1c20', sleeve: 'long', legs: 'long' } },
    { id: 'pip', name: 'Пип', surname: 'Вандербек', parents: ['viktor', 'astrid'], age: 'toddler', sex: 'm', traits: ['slob', 'easilyImpressed'], hair: 'short', x: 13.5, z: 13.5, yaw: 1, look: { sex: 'm', skin: '#e8c2a4', hair: '#c49a58', eyes: '#3c5a7c', shirt: '#7ea85a', trousers: '#5a6a8a', shoes: '#c8c2b0', sleeve: 'short', legs: 'short' } }
  ];

  const opening = (h, doc, k, kind, x0, z0, x1, z1) => {
    const model = doc.models[kind], seg = H.addOpening(h, k, x0, z0, x1, z1, kind, model.cut, model.glass);
    return H.addSegItem(h, 'm_' + kind, k, seg);
  };

  const windowsAlong = (h, doc, k, list) => {
    for (const [x, z, along] of list) {
      if (along === 'x') opening(h, doc, k, 'window', x, z, x + 1, z);
      else opening(h, doc, k, 'window', x, z, x, z + 1);
    }
  };

  const mainHouse = doc => {
    const h = H.create({
      id: 'main', x: MAIN_X, z: MAIN_Z, w: 34, d: 32, base: BASE, lift: LIFT, styles: SURFACES,
      paints: { outside: PAINTS.siding, cap: PAINTS.cap, band: PAINTS.band, trim: PAINTS.trim, foundation: PAINTS.brick, flat: PAINTS.gravel, stair: PAINTS.wood },
      roof: { form: 'hip', style: PAINTS.shingle }
    });
    H.addRoom(h, 0, 5, 5, 12, 12);
    H.addRoom(h, 0, 12, 5, 21, 12);
    H.addRoom(h, 0, 12, 12, 17, 17);
    H.addRoom(h, 0, 17, 12, 21, 17);
    H.addRoom(h, 1, 5, 5, 12, 12);
    H.addRoom(h, 1, 12, 5, 21, 8);
    H.addRoom(h, 1, 12, 8, 16, 12);
    H.addRoom(h, 1, 16, 8, 21, 12);
    const paint = (k, x, z, wall, floor) => {
      const id = H.roomAt(h, k, x, z);
      H.paintRoom(h, k, id, wall);
      H.floorRoom(h, k, id, floor);
    };
    paint(0, 8, 8, PAINTS.kitchen, PAINTS.tile);
    paint(0, 16, 8, PAINTS.living, PAINTS.wood);
    paint(0, 14, 14, PAINTS.hall, PAINTS.moss);
    paint(0, 19, 14, PAINTS.study, PAINTS.tile);
    paint(1, 8, 8, PAINTS.bedroom, PAINTS.moss);
    paint(1, 16, 6, PAINTS.landing, PAINTS.wood);
    paint(1, 14, 10, PAINTS.study, PAINTS.wood);
    paint(1, 18, 10, PAINTS.bedroom, PAINTS.rust);
    H.addStair(h, 0, 19, 5, 3, 1);
    opening(h, doc, 0, 'door', 16, 17, 17, 17);
    opening(h, doc, 0, 'door', 8, 12, 9, 12);
    opening(h, doc, 0, 'door', 12, 8, 12, 9);
    opening(h, doc, 0, 'door', 15, 12, 16, 12);
    opening(h, doc, 1, 'door', 14, 8, 15, 8);
    opening(h, doc, 1, 'door', 18, 8, 19, 8);
    opening(h, doc, 0, 'door', 17, 14, 17, 15);
    opening(h, doc, 1, 'door', 12, 6, 12, 7);
    windowsAlong(h, doc, 0, [
      [13, 17, 'x'], [14, 17, 'x'], [18, 17, 'x'], [19, 17, 'x'],
      [6, 12, 'x'], [10, 12, 'x'], [5, 7, 'z'], [5, 9, 'z'], [7, 5, 'x'], [9, 5, 'x'],
      [13, 5, 'x'], [21, 7, 'z'], [21, 9, 'z'], [21, 14, 'z'], [12, 14, 'z']
    ]);
    windowsAlong(h, doc, 1, [
      [13, 12, 'x'], [14, 12, 'x'], [18, 12, 'x'], [19, 12, 'x'],
      [21, 9, 'z'], [21, 10, 'z'], [18, 5, 'x'], [14, 5, 'x'], [7, 5, 'x'], [9, 5, 'x'], [5, 7, 'z'], [5, 9, 'z'], [7, 12, 'x'], [10, 12, 'x']
    ]);
    for (const [kind, k, x, z, facing] of [
      ['table', 0, 9, 8.5, 0], ['chair', 0, 8.5, 7.5, 2], ['chair', 0, 9.5, 7.5, 2], ['chair', 0, 8.5, 9.5, 0], ['chair', 0, 9.5, 9.5, 0],
      ['fridge', 0, 6.5, 5.5, 2], ['stove', 0, 7.5, 5.5, 2], ['counter', 0, 8.5, 5.5, 2], ['kitchen_sink', 0, 9.5, 5.5, 2], ['counter', 0, 10.5, 5.5, 2], ['trash', 0, 11.5, 5.5, 2],
      ['sofa', 0, 18.5, 11.5, 0], ['lamp', 0, LAMP[0], LAMP[1], 0], ['tv', 0, 18.5, 6.5, 2], ['coffee_table', 0, 18, 9.5, 0], ['armchair', 0, 14.5, 11.5, 0], ['bookshelf', 0, 12.5, 6, 3], ['stereo', 0, 20.5, 8.5, 1], ['chess', 0, 14.5, 7.5, 0],
      ['chair', 0, 13.5, 15.5, 1], ['lamp', 0, 12.5, 12.5, 0], ['toybox', 0, 12.5, 16.5, 0],
      ['toilet', 0, 20.5, 13.5, 1], ['bath_sink', 0, 20.5, 15.5, 1], ['shower', 0, 18.5, 12.5, 2], ['trash', 0, 17.5, 16.5, 0],
      ['bed', 1, 18, 10.5, 0], ['lamp', 1, 20.5, 11.5, 0], ['dresser', 1, 17, 8.5, 2], ['small_bed', 1, 16.5, 11, 0],
      ['computer', 1, 14.5, 11, 0], ['desk', 1, 13, 8.5, 2], ['chair', 1, 13.5, 9.5, 0], ['lamp', 1, 12.5, 11.5, 0], ['lamp', 1, 20.5, 6.5, 0], ['punchbag', 1, 20.5, 7.5, 1],
      ['small_bed', 1, 6.5, 6, 2], ['small_bed', 1, 10.5, 6, 2], ['nightstand', 1, 8.5, 5.5, 2], ['dresser', 1, 9, 11.5, 0], ['easel', 1, 5.5, 11.5, 3], ['bathtub', 1, 17, 6.5, 2]
    ]) H.addItem(h, 'm_' + kind, k, x, z, facing);
    H.addLamp(h, 0, LAMP[0], LAMP[1], 1, WARM);
    H.addLamp(h, 0, 12.5, 12.5, 0.9, WARM);
    H.addLamp(h, 0, 19, 14.5, 0.9, WARM);
    H.addLamp(h, 1, 8.5, 8.5, 1, WARM);
    H.addLamp(h, 1, 20.5, 11.5, 1, WARM);
    H.addLamp(h, 1, 12.5, 11.5, 0.9, WARM);
    H.addLamp(h, 1, 20.5, 6.5, 0.8, WARM);
    H.addLamp(h, 0, 9, 8.5, 1, [1, 0.86, 0.66]);
    H.addLamp(h, 0, 16, 18.2, 0.9, PORCH);
    for (const [kind, x, z, facing] of [
      ['tree', 3.5, 24.5, 0], ['tree', 10.5, 27.5, 1], ['tree', 27.5, 25.5, 2], ['tree', 29.5, 9.5, 3], ['tree', 2.5, 2.5, 1],
      ['bush', 13.5, 18.5, 0], ['bush', 14.5, 18.5, 1], ['bush', 18.5, 18.5, 2], ['bush', 19.5, 18.5, 3],
      ['bush', 6.5, 13.5, 0], ['bush', 10.5, 13.5, 1], ['bush', 22.5, 7.5, 2], ['bush', 22.5, 9.5, 3],
      ['lamp', 15.5, 18.5, 0], ['mailbox', 16.5, 26.5, 0], ['grill', 24.5, 16.5, 3]
    ]) H.addItem(h, 'm_' + kind, 0, x, z, facing).outdoor = true;
    for (let x = 1; x < 33; x++) H.addItem(h, 'fence', 0, x + 0.5, 30, 0).outdoor = true;
    for (const [kind, x, z, facing] of [
      ['garden', 25.5, 11.5, 0], ['garden', 26.5, 11.5, 0], ['garden', 27.5, 11.5, 0], ['garden', 25.5, 13.5, 0], ['garden', 26.5, 13.5, 0], ['garden', 27.5, 13.5, 0],
      ['pond', 7.5, 22, 0]
    ]) H.addItem(h, 'm_' + kind, 0, x, z, facing).outdoor = true;
    H.addItem(h, 'm_aquarium', 0, AQUARIUM[0], AQUARIUM[1], 1);
    return h;
  };

  const nextHouse = doc => {
    const h = H.create({
      id: 'next', x: NEXT_X, z: NEXT_Z, w: 20, d: 18, base: BASE, lift: LIFT, styles: SURFACES,
      paints: { outside: PAINTS.blue, cap: PAINTS.cap, band: PAINTS.band, trim: PAINTS.trim, foundation: PAINTS.brick, flat: PAINTS.gravel, stair: PAINTS.wood },
      roof: { form: 'gable', style: PAINTS.slate }
    });
    H.addRoom(h, 0, 4, 4, 16, 12);
    const id = H.roomAt(h, 0, 8, 8);
    H.paintRoom(h, 0, id, PAINTS.hall);
    H.floorRoom(h, 0, id, PAINTS.wood);
    opening(h, doc, 0, 'door', 9, 12, 10, 12);
    windowsAlong(h, doc, 0, [[6, 12, 'x'], [12, 12, 'x'], [4, 7, 'z'], [16, 7, 'z'], [7, 4, 'x'], [12, 4, 'x']]);
    H.addItem(h, 'm_sofa', 0, 10.5, 4.5, 2);
    H.addItem(h, 'm_lamp', 0, 6.5, 6.5, 0);
    H.addLamp(h, 0, 6.5, 6.5, 1, WARM);
    H.addItem(h, 'm_tree', 0, 2.5, 15.5, 2).outdoor = true;
    return h;
  };

  S.Sample = {
    MAIN_X, MAIN_Z, NEXT_X, NEXT_Z, BASE, LIFT, LAMP, SURFACES, PAINTS, FAMILY, MONEY: 16500,

    STYLES: [
      [],
      [{ pattern: 'stripes', colors: ['#d8cfae', '#3f6f7a'] }, null, null, null],
      [{ pattern: 'solid', colors: ['#a8352c'] }, { pattern: 'solid', colors: ['#2a2a30'] }, null, null],
      [{ pattern: 'tartan', colors: ['#2f5138', '#c9a93f', '#7a2020'] }, null, null, null],
      [{ pattern: 'dots', colors: ['#e6dcc0', '#c0553a'] }, { pattern: 'checker', colors: ['#f0f0e8', '#30303a'] }, null, null]
    ],

    VIEWS: [
      { id: 'family', name: 'семья дома', x: 16, z: 13, zoom: 1, mode: 'up', floor: 1, hour: 12, auto: true },
      { id: 'outside', name: 'снаружи, день', x: 15, z: 14, zoom: 1, mode: 'up', floor: 1, hour: 12 },
      { id: 'cut0', name: 'срез, первый этаж', x: 14, z: 11, zoom: 1, mode: 'cut', floor: 0, hour: 12 },
      { id: 'cut1', name: 'срез, второй этаж', x: 16, z: 9, zoom: 1, mode: 'cut', floor: 1, hour: 12 },
      { id: 'down', name: 'стены вниз', x: 14, z: 11, zoom: 1, mode: 'down', floor: 0, hour: 12 },
      { id: 'dusk', name: 'закат снаружи', x: 15, z: 14, zoom: 1, mode: 'up', floor: 1, hour: 18.8 },
      { id: 'night', name: 'ночь снаружи', x: 15, z: 14, zoom: 1, mode: 'up', floor: 1, hour: 23 },
      { id: 'nightcut', name: 'ночь в срезе', x: 14, z: 11, zoom: 1, mode: 'cut', floor: 0, hour: 23 },
      { id: 'street', name: 'два дома', x: 28, z: 16, zoom: 2, mode: 'cut', floor: 0, hour: 12 }
    ],

    registerKinds(doc) {
      for (const id of Object.keys(doc.models)) {
        const key = 'm_' + id, model = doc.models[id];
        if (S.KIND_ID[key] !== undefined) continue;
        S.KIND_ID[key] = S.KINDS.length;
        S.KINDS.push({ id: key, model: id, object: model.base || id, name: model.name, w: model.w, d: model.d, beds: model.beds, h: Math.max(...model.parts.map(p => p.at[1] + (p.size ? p.size[1] : p.h || (p.radius ? p.radius[1] * 2 : 0)) / 2)), glass: !!model.glass, opening: !!model.cut, seats: model.seats, open: model.open ? 'm_' + model.open : null });
      }
    },

    houses: doc => [mainHouse(doc), nextHouse(doc)]
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
