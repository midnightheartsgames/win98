/**
 * S.T.A.L.K.E.R. 98 — the two locations: Cordon and Garbage.
 * Axis note: the player facing north (+z) has +x on the LEFT, so on the PDA map +x is drawn to the west.
 */
(function (S) {
  'use strict';
  const { Builder } = S;
  const T = (ru, en) => ({ ru, en: en || ru });

  // helper: village hut with a gable tin roof, door and windows
  function hut(b, x0, z0, x1, z1, door = 's', o = {}) {
    const w = x1 - x0, d = z1 - z0, at = (door === 's' || door === 'n' ? w : d) / 2 - 0.9;
    return b.building(x0, z0, x1, z1, Object.assign({ h: 2.7, tex: o.tex || 'logs', roof: o.roof || 'gable', roofTex: o.roofTex || 'tin', roofH: 2.0, doors: [{ side: door, at, w: 1.8 }], floorTex: 'planks' }, o));
  }

  // ================================================================ CORDON
  function cordon() {
    const b = new Builder({
      id: 'cordon', name: T('Кордон', 'Cordon'), bounds: [-170, -300, 170, 300],
      env: { sky: [0.52, 0.6, 0.66], horizon: [0.74, 0.76, 0.74], fog: [0.66, 0.69, 0.68], fogDensity: 0.0068, sun: [-0.45, 0.62, -0.5], sunColor: [1.05, 0.98, 0.84], ambient: [0.48, 0.52, 0.56], clouds: 0.65, grass: 1, grassCol: [0.46, 0.52, 0.26], dirtCol: [0.46, 0.4, 0.3], rain: 0.15, music: 0 },
      terrain: { seed: 7, amp: 2.6, scale: 90, rough: 0.8, base: 0 },
      labels: [
        { x: -65, z: -190, t: T('Деревня новичков', 'Rookie village') }, { x: -102, z: -250, t: T('Бункер торговца', 'Trader\'s bunker') }, { x: 80, z: -102, t: T('АТП', 'Motor depot') },
        { x: 5, z: -275, t: T('Блокпост', 'Checkpoint') }, { x: 22, z: 55, t: T('Мост', 'Bridge') }, { x: -100, z: 25, t: T('Ж/д мост', 'Rail bridge') }, { x: -65, z: 125, t: T('МТС', 'Tractor station') },
        { x: -75, z: 215, t: T('Хутор', 'Farmstead') }, { x: 110, z: 190, t: T('Вертолёт', 'Helicopter') }, { x: -125, z: -60, t: T('Старая ферма', 'Old farm') }, { x: -5, z: 285, t: T('На Свалку', 'To Garbage') }
      ]
    });
    // ---- terrain
    b.hill(-112, -258, 30, 7);
    b.hill(-150, -120, 40, 6); b.hill(140, -200, 45, 8); b.hill(130, 60, 40, 7, { noise: true }); b.hill(-140, 170, 45, 9); b.hill(150, 250, 40, 10); b.hill(-30, -120, 30, 3);
    b.hill(90, -250, 30, 5); b.hill(-150, 260, 35, 8); b.hill(60, 250, 25, 4);
    b.ravine([[-100, -60], [-102, 0], [-100, 40], [-96, 90], [-90, 120]], 7, -3.5, 7);
    b.ridge([[-190, 40], [190, 40]], 6, 7, 5.5, { gaps: [[-100, 40, 9]] });
    // road beds
    const mainRoad = [[0, -305], [5, -250], [10, -200], [15, -140], [20, -60], [22, 10], [22, 70], [18, 110], [8, 170], [0, 230], [-5, 305]];
    b.road(mainRoad, 7, 'asphalt');
    b.road([[10, -205], [-20, -206], [-45, -200], [-70, -190], [-85, -178]], 4.5, 'dirt');
    b.road([[-45, -200], [-75, -218], [-100, -228]], 3.5, 'dirt');
    b.road([[16, -108], [35, -104], [52, -102]], 5, 'dirt');
    b.road([[20, 90], [-20, 110], [-50, 122]], 4.5, 'dirt');
    b.road([[8, 170], [-30, 195], [-60, 208]], 4, 'dirt');
    b.road([[18, 120], [60, 150], [100, 180]], 3.5, 'dirt');
    b.road([[-20, -206], [-60, -120], [-110, -70]], 3.5, 'dirt');
    // sites
    b.flat(-110, -250, -92, -226, 1.0, 5);                   // bunker
    b.flat(46, -128, 114, -76, 0.6, 8);                      // motor depot (ATP)
    b.flat(-8, -292, 22, -262, null, 5);                     // south checkpoint
    b.flat(12, 24, 32, 58, 0.4, 3);                           // road cut under the rail bridge
    b.flat(-96, 96, -34, 154, null, 6);                       // tractor station
    b.flat(-92, 196, -52, 232, null, 6);                      // farmstead
    b.flat(-135, -72, -112, -50, null, 5);                    // old farm
    const village = [[-80, -205, -70, -198], [-66, -190, -58, -184], [-92, -186, -84, -178], [-54, -212, -46, -205], [-76, -172, -68, -165], [-50, -186, -43, -179], [-96, -205, -89, -197]];
    for (const v of village) b.flat(v[0] - 0.5, v[1] - 0.5, v[2] + 0.5, v[3] + 0.5, null, 4);
    b.ready();
    const H = (x, z) => b.h(x, z);

    // ---- railway embankment: rails, poles, broken bridge, road bridge
    b.rail([[-175, 40], [-110, 40]], { y: 7 }); b.rail([[-90, 40], [175, 40]], { y: 7 });
    for (let x = -160; x <= 160; x += 32) if (Math.abs(x + 100) > 14 && Math.abs(x - 22) > 12) b.prop('pole', x, 43, { y: 7 });
    // collapsed rail bridge over the ravine
    b.box(-111, 36.5, -108, 43.5, -4, 7, 'concrete', { top: 'gravel' });
    b.box(-92, 36.5, -89, 43.5, -4, 7, 'concrete', { top: 'gravel' });
    b.box(-108, 37.4, -103, 42.6, 6.4, 7.0, 'concrete', { top: 'gravel' });
    b.box(-97, 37.4, -92, 42.6, 6.4, 7.0, 'concrete', { top: 'gravel' });
    b.prop('bridge', -100, 40, { y: -1.2, rot: Math.PI / 2, len: 9, s: 1 });
    b.box(-104.5, 37.5, -95.5, 42.5, -3.8, -0.8, 'concrete', { render: false });
    b.water(-106, 10, -94, 70, -3.1);
    // road cut + bridge where the military sit
    b.box(12, 26, 14.5, 56, 0, 7.4, 'concrete', { top: 'gravel' }); b.box(29.5, 26, 32, 56, 0, 7.4, 'concrete', { top: 'gravel' });
    b.box(12, 36.5, 32, 43.5, 6.3, 7.2, 'concrete', { top: 'gravel', noBottom: false });
    b.box(12, 36.3, 32, 36.6, 7.2, 8.0, 'metal', { thin: true }); b.box(12, 43.4, 32, 43.7, 7.2, 8.0, 'metal', { thin: true });
    b.rail([[12, 40], [32, 40]], { y: 7.2 });
    b.prop('barrier', 27, 30, { rot: 0 }); b.prop('barrier', 17, 50, { rot: Math.PI });
    b.prop('sandbags', 26, 27.5, { len: 4 }); b.prop('sandbags', 18, 52.5, { len: 4, rot: Math.PI }); b.box(24, 27, 28, 28, H(26, 27.5), H(26, 27.5) + 0.8, 'concrete', { render: false });
    b.box(16, 52, 20, 53, H(18, 52.5), H(18, 52.5) + 0.8, 'concrete', { render: false });
    b.vehicle('btr', 38, 18, 0.4); b.prop('streetlamp', 30, 33, { rot: Math.PI / 2 }); b.lamp(28.8, 7.0, 33, { r: 12 });
    b.sign(13.5, 3.5, 34, Math.PI / 2, T('СТОЙ! ПРОВЕРКА ДОКУМЕНТОВ', 'STOP! DOCUMENT CHECK'));
    b.zone('bridge_post', 10, 22, 34, 58);

    // ---- power line along z = -20
    for (let x = -150; x <= 150; x += 60) b.prop('pylon', x, -20); for (let x = -150; x <= 150; x += 60) b.solid(x, -20, 2.4, 2.4, H(x, -20), H(x, -20) + 3);

    // ---- south checkpoint (hostile army)
    const cy = H(5, -276);
    b.fence([[-170, -288], [-8, -288]], 'wire'); b.fence([[22, -288], [170, -288]], 'wire');
    for (let x = -6; x <= 20; x += 2.2) b.box(x, -289, x + 2, -288, cy, cy + 0.9, 'concrete');
    b.prop('barrier', 14, -270, { rot: 0 }); b.box(-4, -271, 14, -269.8, cy, cy + 1.05, 'metal', { render: false, thin: true });
    b.building(-6, -284, 2, -276, { h: 2.8, tex: 'silicate', doors: [{ side: 'e', at: 3, w: 1.8 }], roof: 'flat' });
    b.vehicle('btr', 16, -280, 0.2); b.vehicle('uaz', -5, -261, 1.4);
    b.prop('sandbags', 8, -266, { len: 4 }); b.box(6, -266.5, 10, -265.5, cy, cy + 0.8, 'concrete', { render: false });
    b.box(20, -285, 22, -283, cy, cy + 6, 'planks'); b.box(19.5, -285.5, 22.5, -282.5, cy + 6, cy + 6.2, 'planks', { top: 'planks' });
    b.sign(3, 3.2 + cy, -265.4, 0, T('ЗОНА ОТЧУЖДЕНИЯ. ПРОХОД ЗАПРЕЩЁН', 'EXCLUSION ZONE. NO ENTRY'));
    b.lamp(2, cy + 2.9, -280, { r: 10 }); b.lamp(12, cy + 3.5, -271, { r: 10 });
    b.prop('streetlamp', 12, -272, { rot: Math.PI });

    // ---- Sidorovich's bunker (sunken room under a grassy mound)
    b.hole(-108.4, -246.4, -95.6, -229.6);
    b.box(-108.4, -246.4, -95.6, -235.6, -1.8, -1.4, 'concrete', { top: 'tiles' });
    b.box(-108.4, -246.4, -107.9, -235.6, -1.4, 1.2, 'concrete'); b.box(-96.1, -246.4, -95.6, -235.6, -1.4, 1.2, 'concrete');
    b.box(-107.9, -246.4, -96.1, -245.9, -1.4, 1.2, 'concrete');
    b.box(-107.9, -236.1, -103.4, -235.6, -1.4, 1.2, 'concrete'); b.box(-100.6, -236.1, -96.1, -235.6, -1.4, 1.2, 'concrete');
    b.box(-103.4, -236.1, -100.6, -235.6, 0.95, 1.2, 'concrete');
    b.box(-108.6, -246.6, -95.4, -235.4, 1.2, 1.9, 'concrete', { top: 'grass' });
    b.box(-103.8, -235.6, -103.0, -229.6, -1.4, 1.5, 'concrete', { top: 'concrete' }); b.box(-101.0, -235.6, -100.2, -229.6, -1.4, 1.5, 'concrete', { top: 'concrete' });
    b.box(-103.8, -235.6, -100.2, -234.6, 1.5, 1.9, 'concrete', { top: 'grass' });
    b.box(-103.0, -235.6, -101.0, -234.6, -1.8, -1.4, 'concrete');
    b.stairs(-103.0, -234.6, -101.0, -229.6, -1.4, 1.0, 'n', 'concrete', 0.3);
    b.box(-108.4, -229.6, -95.6, -229.3, 0.2, 1.0, 'concrete', { render: false });
    b.box(-108.4, -235.6, -103.8, -229.6, -1.8, 1.0, 'soil', { top: 'grass' }); b.box(-100.2, -235.6, -95.6, -229.6, -1.8, 1.0, 'soil', { top: 'grass' });
    b.prop('bunkerdoor', -102, -235.7, { y: -1.4, rot: 0 });
    b.prop('counter', -102, -242.6, { y: -1.4, w: 2.2 }); b.box(-104.3, -243.0, -99.7, -242.2, -1.4, -0.28, 'planks', { render: false });
    b.prop('shelf', -104.5, -245.6, { y: -1.4 }); b.prop('shelf', -100, -245.6, { y: -1.4 }); b.prop('radio', -99.2, -242.6, { y: -0.28 });
    b.prop('table', -106.5, -238.5, { y: -1.4, w: 0.6, d: 0.6 }); b.prop('crates', -97.5, -238, { y: -1.4 }); b.box(-98.2, -238.6, -95.9, -237.2, -1.4, -0.5, 'planks', { render: false });
    b.prop('poster', -107.85, -240, { y: -1.4, rot: Math.PI / 2 }); b.prop('bed', -106.8, -242.5, { y: -1.4 });
    b.lamp(-102, 1.1, -240.5, { r: 9, c: [1.2, 1.05, 0.7] }); b.lamp(-102, 1.1, -244.5, { r: 6, c: [1.0, 0.9, 0.6] });
    b.spawn('start', -102, -239.2, Math.PI, -1.4);
    b.clearArea(-115, -255, -88, -222);

    // ---- rookie village
    const hs = village.map((v, i) => hut(b, v[0], v[1], v[2], v[3], ['s', 'e', 'w', 'n', 's', 'w', 'e'][i], { tex: i % 3 === 0 ? 'logs' : i % 3 === 1 ? 'planks' : 'plaster', roofTex: i % 2 ? 'tin' : 'slate', noWin: [] }));
    void hs;
    const fire = b.campfire(-64, -198);
    b.prop('log', -62, -196.2, { rot: 0.3, len: 1.8 }); b.prop('log', -66.2, -199, { rot: 1.8, len: 1.8 }); b.prop('bench', -63, -200.5, { rot: 0.1 });
    b.fence([[-100, -212], [-100, -170], [-60, -160], [-40, -168]], 'wood'); b.fence([[-40, -190], [-40, -214]], 'wood');
    b.prop('well', -58, -193); b.box(-58.8, -193.8, -57.2, -192.2, H(-58, -193), H(-58, -193) + 0.9, 'planks', { render: false });
    b.prop('haystack', -94, -168); b.box(-95.5, -169.5, -92.5, -166.5, H(-94, -168), H(-94, -168) + 1.6, 'grass', { render: false });
    b.vehicle('car', -38, -196, 1.2, { col: 0x8a3a2a }); b.vehicle('tractor', -84, -210, 2.6);
    for (let i = 0; i < 5; i++) b.prop('pole', -30 - i * 16, -207 + i * 4);
    b.lamp(-71.7, 2.5, -188, { r: 7, c: [1.1, 0.8, 0.5] });
    b.clearArea(-102, -222, -38, -158);

    // ---- motor depot (ATP) held by bandits
    b.fence([[50, -125], [110, -125], [110, -78], [50, -78], [50, -96]], 'concrete'); b.fence([[50, -106], [50, -125]], 'concrete');
    b.building(76, -123, 106, -107, { h: 5, tex: 'silicate', doors: [{ side: 'n', at: 3, w: 4 }, { side: 'n', at: 13, w: 4 }, { side: 'n', at: 23, w: 4 }], roof: 'flat', floorTex: 'concrete', y: 0.6, windows: true });
    b.building(88, -96, 107, -82, { h: 3, floors: 2, tex: 'brick', doors: [{ side: 'w', at: 5, w: 1.8 }, { side: 's', at: 3, w: 1.8 }], roof: 'flat', y: 0.6, stairs: [104, -93.5, 106.4, -86.5, 'n'] });
    b.building(55, -91, 64, -83, { h: 2.8, tex: 'silicate', doors: [{ side: 's', at: 4, w: 1.8 }], roof: 'flat', y: 0.6 });
    b.prop('watertower', 64, -118); b.solid(64, -118, 1.3, 1.3, 0.6, 16);
    b.vehicle('bus', 70, -96, 0.25, { col: 0xa0702a }); b.vehicle('truck', 82, -100, 1.5, { col: 0x5a6a4a }); b.vehicle('truck', 58, -112, 0.1, { col: 0x3a4a5a });
    b.vehicle('car', 100, -102, 2.6, { col: 0x5a5a5a });
    b.prop('barrels', 72, -85); b.solid(72.3, -84.7, 1.1, 1.1, 0.6, 1.5); b.prop('crates', 107, -120, { y: 0.6 }); b.solid(107.4, -119.9, 1, 0.8, 0.6, 1.6);
    b.prop('tires', 60, -100); b.solid(60, -100, 0.5, 0.5, 0.6, 1.6);
    b.lamp(59.5, 3.2, -87, { r: 7 }); b.lamp(97, 3.4, -89, { r: 9 }); b.lamp(91, 5.4, -115, { r: 12 });
    b.sign(50.2, 3.4, -101, Math.PI / 2, T('АТП', 'MOTOR DEPOT'));
    b.rad(80, -112, 6, 0.012);
    b.zone('atp', 48, -128, 112, -76); b.zone('atp_near', 20, -140, 125, -60);
    b.clearArea(44, -130, 116, -72);

    // ---- old farm with dogs
    b.building(-130, -68, -121, -60, { h: 2.6, tex: 'logs', roof: 'flat', roofTex: 'planks', doors: [{ side: 'e', at: 3, w: 1.8 }] });
    b.prop('junk', -118, -57); b.prop('haystack', -126, -54); b.prop('well', -116, -66); b.box(-116.8, -66.8, -115.2, -65.2, H(-116, -66), H(-116, -66) + 0.9, 'planks', { render: false });
    b.fence([[-138, -75], [-110, -75], [-110, -48]], 'wood');
    b.zone('farm_dogs', -150, -90, -95, -30);
    b.clearArea(-140, -78, -106, -45);

    // ---- north: tractor station (MTS)
    b.building(-90, 128, -72, 150, { h: 4, tex: 'silicate', roof: 'gable', roofTex: 'slate', roofH: 3, doors: [{ side: 'e', at: 8, w: 3.5 }], floorTex: 'concrete' });
    b.building(-62, 136, -48, 150, { h: 9, tex: 'concrete', roof: 'flat', doors: [{ side: 's', at: 5, w: 3 }], floorTex: 'concrete' });
    b.building(-60, 100, -40, 116, { h: 3.5, tex: 'brick', roof: 'flat', doors: [{ side: 'n', at: 8, w: 2.5 }, { side: 'e', at: 5, w: 1.8 }] });
    b.vehicle('tractor', -66, 122, 0.8); b.vehicle('truck', -44, 126, 2.2, { col: 0x6a4a3a }); b.prop('haystack', -84, 108); b.box(-85.5, 106.5, -82.5, 109.5, H(-84, 108), H(-84, 108) + 1.6, 'grass', { render: false });
    b.prop('junk', -36, 140); b.prop('barrels', -76, 118); b.solid(-75.7, 118.3, 1.1, 1.1, H(-76, 118), H(-76, 118) + 1);
    b.zone('mts', -100, 90, -30, 160);
    b.clearArea(-96, 96, -34, 154);

    // ---- bandit farmstead (north)
    hut(b, -88, 200, -79, 208, 'e'); hut(b, -70, 214, -62, 222, 's', { tex: 'planks' }); b.building(-90, 218, -78, 230, { h: 3.2, tex: 'planks', roof: 'gable', roofTex: 'slate', roofH: 2.4, doors: [{ side: 'e', at: 4, w: 3 }] });
    b.fence([[-95, 194], [-50, 194], [-50, 236], [-95, 236], [-95, 194]], 'wood');
    b.campfire(-68, 204);
    b.zone('farmstead', -100, 188, -44, 242);
    b.clearArea(-98, 192, -48, 238);

    // ---- crashed helicopter + burners
    b.vehicle('heli', 112, 192, 0.7, { rot: 0.7 });
    b.field('burner', 4, 100, 205, 14, ['stoneblood']);
    b.crate('heli_crate', 118, 186, [['ak74', 1, 0.55], ['545', 2], ['medkit_army', 1], ['f1', 1]]);

    // ---- anomaly fields
    b.field('electro', 3, -100, 24, 8, ['medusa'], {});
    b.anomaly('springboard', -98, 52); b.anomaly('springboard', -103, 8);
    b.field('springboard', 5, 62, 108, 16, ['nightstar']); b.anomaly('whirligig', 55, 118);
    b.rad(70, 100, 12, 0.02);
    b.rad(-100, 40, 8, 0.008);
    b.zone('ravine', -112, -10, -88, 80);

    // ---- stashes
    b.stash('st_farm', -127, -66, [['medkit', 1], ['9x18', 2], ['bread', 1], ['vodka', 1]], { name: T('Тайник на старой ферме', 'Stash at the old farm') });
    b.stash('st_bridge', -91, 44, [['12x70', 2], ['antirad', 1], ['bandage', 2]], { y: 7.0, name: T('Тайник у ж/д моста', 'Stash by the rail bridge') });
    b.stash('st_mts', -55, 146, [['545', 2], ['medkit', 1], ['energy', 1], ['fort', 1, 0.8]], { name: T('Тайник в элеваторе МТС', 'Stash in the MTS elevator') });
    b.stash('st_atp', 105, -85, [['545', 1], ['9x19', 1], ['medkit', 1], ['rgd5', 1]], { y: 3.8, name: T('Тайник на втором этаже АТП', 'Stash upstairs in the depot') });

    // ---- props along the roads
    b.vehicle('car', 8, -160, 0.2, { col: 0x3a5a7a }); b.vehicle('truck', 26, -30, 3.0, { col: 0x5a4a3a }); b.vehicle('btr', 30, 70, 2.8); b.vehicle('bus', -12, 140, 1.1, { col: 0x8a7a40 });
    b.vehicle('car', 4, 240, 3.3, { col: 0x6a6a5a }); b.vehicle('uaz', 45, -150, 2.0);
    b.prop('junk', 40, -60); b.prop('junk', -30, 60); b.prop('barrels', 30, -240); b.solid(30.3, -239.7, 1.1, 1.1, H(30, -240), H(30, -240) + 1);
    b.prop('cross', -115, -150); b.prop('cross', -113, -151.5);
    b.sign(-3, H(-3, 280) + 2.2, 280, 0, T('СВАЛКА →', 'GARBAGE →'));

    // ---- trees
    b.forest(110, -290, 168, -140, 70, ['pine', 'pine', 'birch', 'bush']);
    b.forest(-168, -290, -120, -150, 60, ['pine', 'birch', 'bush', 'dead']);
    b.forest(-168, -140, -130, 30, 55, ['birch', 'pine', 'bush', 'willow']);
    b.forest(120, -60, 168, 30, 40, ['birch', 'pine', 'bush']);
    b.forest(-125, -40, -80, 30, 25, ['willow', 'willow', 'bush']);
    b.forest(-40, -150, 0, -60, 20, ['birch', 'bush', 'dead']);
    b.forest(40, -60, 110, 25, 30, ['birch', 'bush', 'willow']);
    b.forest(-60, -60, -10, 25, 22, ['birch', 'bush', 'deadbush']);
    b.forest(-168, 60, -100, 190, 55, ['pine', 'birch', 'dead', 'bush']);
    b.forest(120, 60, 168, 170, 45, ['pine', 'pine', 'birch']);
    b.forest(30, 200, 168, 298, 60, ['pine', 'birch', 'dead', 'bush']);
    b.forest(-168, 240, -30, 298, 55, ['pine', 'birch', 'bush']);
    b.forest(-30, 60, 40, 100, 14, ['birch', 'bush', 'deadbush']);
    b.forest(-40, 150, 60, 200, 22, ['birch', 'dead', 'bush']);
    b.forest(-170, -230, -115, -200, 25, ['birch', 'bush']);
    b.forest(-40, -290, -10, -240, 18, ['birch', 'bush', 'dead']);
    b.forest(40, -270, 100, -180, 30, ['birch', 'pine', 'bush']);

    // ---- NPCs
    b.npc('trader', -102, -244.2, { id: 'sidorovich', name: T('Сидорович', 'Sidorovich'), beh: 'trader', yaw: 0, dialog: 'sidorovich', y: -1.4, trade: 'sidorovich', noLoot: true });
    b.npc('veteran', -44, -209, { id: 'wolf', name: T('Волк', 'Wolf'), beh: 'guard', yaw: -1.4, dialog: 'wolf', weapon: 'ak74', essential: true });
    b.npc('loner', -79, -168, { id: 'fanatic', name: T('Фанат', 'Fanatic'), beh: 'guard', yaw: 0.2, dialog: 'fanatic', weapon: 'aks74u', essential: true });
    b.npc('rookie', -24, -224, { id: 'tolik', name: T('Толик', 'Tolik'), beh: 'wounded', yaw: 1.2, dialog: 'tolik', weapon: 'pm', essential: true });
    b.npc('rookie', fire.x + 1.8, fire.z + 1.2, { id: 'petruha', name: T('Петруха', 'Petrukha'), beh: 'camp', yaw: -2.2, group: 'atp_team', dialog: 'rookie', weapon: 'obrez' });
    b.npc('rookie', fire.x - 1.9, fire.z + 0.8, { beh: 'camp', yaw: 2.0, group: 'atp_team', guitar: true, weapon: 'pm' });
    b.npc('rookie', fire.x + 0.4, fire.z - 2.0, { beh: 'camp', yaw: 0.1, group: 'atp_team', weapon: 'obrez' });
    b.npc('rookie', fire.x - 1.2, fire.z - 1.6, { beh: 'camp', yaw: 0.8, weapon: 'pm' });
    b.npc('rookie', -88, -200, { beh: 'wander', weapon: 'fort', leash: 14 });
    b.npc('rookie', -60, -175, { beh: 'guard', yaw: 0.6, weapon: 'obrez' });
    // south checkpoint army
    b.npc('officer', 3, -272, { beh: 'guard', yaw: 0, group: 'south_army', leash: 18 });
    b.npc('soldier', 9, -268, { beh: 'guard', yaw: 0.2, group: 'south_army', leash: 18 });
    b.npc('soldier', -8, -270, { beh: 'patrol', path: 'south_patrol', group: 'south_army', leash: 30 });
    b.npc('soldier', 21, -284, { beh: 'guard', yaw: 0, group: 'south_army', y: cy + 6.2, leash: 0, weapon: 'ak74' });
    b.path('south_patrol', [[-8, -268], [20, -268], [20, -278], [-8, -278]]);
    // bridge post army: neutral until provoked, can be bribed
    b.npc('officer', 20, 29, { id: 'kuznetsov', name: T('Капитан Кузнецов', 'Captain Kuznetsov'), beh: 'guard', yaw: Math.PI, group: 'bridge_army', attitude: 'neutral', dialog: 'kuznetsov', leash: 12, weapon: 'ak74' });
    b.npc('soldier', 26, 32, { beh: 'guard', yaw: Math.PI, group: 'bridge_army', attitude: 'neutral', leash: 10 });
    b.npc('soldier', 16, 52, { beh: 'guard', yaw: 0, group: 'bridge_army', attitude: 'neutral', leash: 10 });
    b.npc('soldier', 22, 38.5, { beh: 'guard', yaw: Math.PI, group: 'bridge_army', attitude: 'neutral', leash: 0, y: 7.2, weapon: 'ak74' });
    // ATP bandits
    b.npc('bandit_boss', 97, -89, { id: 'atp_boss', name: T('Бандит Юрик', 'Bandit Yurik'), beh: 'guard', yaw: 1.5, group: 'atp_bandits', leash: 30 });
    b.npc('bandit', 66, -92, { beh: 'guard', yaw: 1.6, group: 'atp_bandits', leash: 30 });
    b.npc('bandit', 56, -101, { beh: 'guard', yaw: 1.6, group: 'atp_bandits', leash: 30, weapon: 'aks74u' });
    b.npc('bandit', 80, -104, { beh: 'patrol', path: 'atp_patrol', group: 'atp_bandits', leash: 30 });
    b.npc('bandit', 90, -112, { beh: 'guard', yaw: 1.2, group: 'atp_bandits', leash: 30 });
    b.npc('bandit', 99, -90, { beh: 'guard', yaw: 2.5, group: 'atp_bandits', leash: 30, y: 3.6, weapon: 'toz' });
    b.npc('bandit', 72, -120, { beh: 'guard', yaw: 0.8, group: 'atp_bandits', leash: 30, weapon: 'obrez' });
    b.path('atp_patrol', [[58, -104], [92, -104], [92, -116], [58, -116]]);
    b.npc('hostage', 59.5, -88.5, { id: 'nimble', name: T('Шустрый', 'Nimble'), beh: 'hostage', yaw: Math.PI, dialog: 'nimble', essential: true, faction: 'stalker' });
    // farmstead bandits (Fanatic's task)
    b.npc('bandit', -66, 206, { beh: 'camp', yaw: 2, group: 'farm_bandits', leash: 25 });
    b.npc('bandit', -70, 202, { beh: 'camp', yaw: -1, group: 'farm_bandits', leash: 25, weapon: 'aks74u' });
    b.npc('bandit', -82, 212, { beh: 'guard', yaw: -0.5, group: 'farm_bandits', leash: 25, weapon: 'toz' });
    b.npc('bandit_boss', -84, 224, { name: T('Бандит Сивый', 'Bandit Sivy'), beh: 'guard', yaw: -1.4, group: 'farm_bandits', leash: 25, weapon: 'aks74u' });
    // ---- mutants
    b.pack('dog', 5, -125, -58, 6, { group: 'farm_dogs', home: 14 });
    b.pack('dog', 4, 30, 170, 6, { home: 30 });
    b.mutant('flesh', -70, 110, { home: 20 }); b.mutant('flesh', -78, 115, { home: 20 }); b.mutant('flesh', -60, 120, { home: 20 });
    b.mutant('boar', -40, 135, { home: 25 }); b.mutant('boar', -150, 120, { home: 30 });
    b.pack('dog', 3, 120, -40, 5, { home: 25 });
    b.mutant('flesh', 140, -240, { home: 25 });
    // ---- items lying around
    b.item('bread', -63, -203); b.item('vodka', -61.5, -201.5); b.item('bandage', -73, -201); b.item('9x18', -47, -209);
    b.item('medkit', 60, -86, { y: 0.9 }); b.item('12x70', 72, -110); b.item('antirad', -52, 112);
    b.item('f1', 21, 45.6, { y: 7.2 });
    // ---- exits & markers
    b.exit('to_garbage', -30, 292, 25, 300, 'garbage', 'from_cordon', T('На Свалку', 'To Garbage'));
    b.spawn('from_garbage', -2, 285, Math.PI);
    b.zone('village', -104, -224, -36, -156);
    b.zone('embankment_north', -170, 48, 170, 300);
    b.zone('south_perimeter', -30, -300, 40, -250);
    return b.build();
  }

  // ================================================================ GARBAGE
  function garbage() {
    const b = new Builder({
      id: 'garbage', name: T('Свалка', 'Garbage'), bounds: [-200, -200, 200, 200],
      env: { sky: [0.46, 0.5, 0.52], horizon: [0.66, 0.66, 0.62], fog: [0.6, 0.6, 0.57], fogDensity: 0.0078, sun: [0.4, 0.55, -0.55], sunColor: [0.92, 0.88, 0.78], ambient: [0.5, 0.5, 0.5], clouds: 0.85, grass: 0.6, grassCol: [0.5, 0.5, 0.3], dirtCol: [0.44, 0.4, 0.34], rain: 0.45, music: 1 },
      terrain: { seed: 23, amp: 3.2, scale: 70, rough: 1.2, base: 0 },
      labels: [
        { x: 62, z: -85, t: T('Ангар', 'Hangar') }, { x: -100, z: -48, t: T('Депо', 'Depot') }, { x: 105, z: 105, t: T('Кладбище техники', 'Vehicle graveyard') }, { x: -120, z: 125, t: T('Хутор Лиса', 'Fox\'s farm') },
        { x: 0, z: 185, t: T('Блокпост «Долга»', 'Duty checkpoint') }, { x: 185, z: 40, t: T('Агропром', 'Agroprom') }, { x: 0, z: -190, t: T('Кордон', 'Cordon') }, { x: -30, z: 70, t: T('Свалка', 'Garbage heaps') }
      ]
    });
    // ---- terrain: garbage heaps
    b.hill(-40, 60, 32, 12, { noise: true }); b.hill(40, 110, 26, 10, { noise: true }); b.hill(-90, 20, 26, 9, { noise: true }); b.hill(-10, 0, 18, 6, { noise: true });
    b.hill(150, -150, 40, 8); b.hill(-160, -150, 40, 10); b.hill(160, 160, 40, 9); b.hill(-165, 170, 35, 8); b.hill(120, -20, 25, 5);
    b.hill(60, 30, 20, 6, { noise: true }); b.hill(-60, 150, 25, 7, { noise: true });
    const main = [[0, -205], [5, -140], [20, -80], [28, -20], [25, 60], [8, 130], [0, 205]];
    b.road(main, 7, 'asphalt');
    b.road([[28, -20], [90, -8], [150, 22], [205, 40]], 6, 'asphalt');
    b.road([[20, -80], [-30, -70], [-75, -55]], 5, 'dirt');
    b.road([[25, 60], [60, 80], [90, 100]], 4.5, 'dirt');
    b.road([[8, 130], [-50, 118], [-110, 122]], 4, 'dirt');
    b.flat(34, -112, 96, -48, 0.5, 8);          // hangar compound
    b.flat(-126, -64, -76, -34, null, 6);        // depot
    b.flat(68, 68, 142, 142, null, 6);          // vehicle graveyard
    b.flat(-132, 112, -108, 136, null, 5);       // fox's farm
    b.flat(-14, 176, 14, 198, null, 4);          // duty checkpoint
    b.ready();
    const H = (x, z) => b.h(x, z);
    // ---- rails running N-S on the east side
    b.rail([[-100, -205], [-100, 205]]);
    b.vehicle('wagon', -100, -120, 0, { col: 0x6a3a28 }); b.vehicle('wagon', -100, -104.5, 0, { col: 0x3a4a3a }); b.vehicle('cistern', -100, 60, 0); b.vehicle('wagon', -100, 75, 0, { col: 0x5a3a2a });
    // ---- hangar compound (Seriy's loners)
    b.fence([[34, -112], [96, -112], [96, -48], [34, -48], [34, -74]], 'concrete'); b.fence([[34, -86], [34, -112]], 'concrete');
    b.building(55, -100, 85, -74, { h: 7, tex: 'metalwall', doors: [{ side: 'e', at: 8, w: 6, h: 5 }, { side: 'n', at: 12, w: 3 }], roof: 'gable', roofTex: 'tin', roofH: 3.5, floorTex: 'concrete', y: 0.5, windows: false, ridge: 'z' });
    b.building(40, -68, 50, -58, { h: 3, tex: 'silicate', doors: [{ side: 'e', at: 4, w: 1.8 }], roof: 'flat', y: 0.5 });
    b.building(80, -65, 92, -54, { h: 3, tex: 'brick', doors: [{ side: 's', at: 5, w: 1.8 }], roof: 'flat', y: 0.5 });
    b.vehicle('truck', 45, -95, 0.3, { col: 0x5a5a4a }); b.vehicle('uaz', 88, -85, 1.3);
    b.prop('barrels', 66, -70, { y: 0.5 }); b.solid(66.3, -69.7, 1.1, 1.1, 0.5, 1.5); b.prop('crates', 58, -92, { y: 0.5 }); b.solid(58.4, -91.9, 1, 0.8, 0.5, 1.6);
    const hf = b.campfire(70, -86);
    b.lamp(70, 6.5, -87, { r: 16 }); b.lamp(45, 2.9, -63, { r: 7 });
    b.sign(34.2, 3.2, -80, -Math.PI / 2, T('Ангар', 'Hangar'));
    b.zone('hangar', 30, -116, 100, -44); b.zone('hangar_near', -10, -150, 110, -20);
    b.clearArea(28, -118, 102, -42);
    // ---- depot (bandits holding Bes)
    b.building(-122, -60, -106, -38, { h: 6, tex: 'brick', doors: [{ side: 'n', at: 6, w: 4, h: 4.5 }, { side: 's', at: 6, w: 4, h: 4.5 }, { side: 'w', at: 8, w: 1.8 }], roof: 'gable', roofTex: 'slate', roofH: 3, floorTex: 'concrete', ridge: 'z' });
    b.building(-92, -56, -82, -46, { h: 3, tex: 'silicate', doors: [{ side: 'w', at: 4, w: 1.8 }], roof: 'flat' });
    b.vehicle('bus', -80, -30, 1.8, { col: 0x7a6a30 }); b.prop('junk', -76, -62);
    b.campfire(-92, -38);
    b.zone('depot', -130, -70, -70, -28);
    b.clearArea(-128, -66, -72, -30);
    // ---- vehicle graveyard (radioactive)
    const vg = [['truck', 80, 80, 0.4], ['truck', 92, 76, 2.9], ['btr', 104, 82, 1.1], ['btr', 118, 78, 0.2], ['heli', 90, 100, 1.9], ['heli', 124, 102, 0.3], ['truck', 76, 118, 1.6], ['tank', 132, 120, 2.3], ['btr', 96, 128, 0.9], ['truck', 136, 86, 1.2], ['uaz', 84, 132, 2.6], ['truck', 72, 98, 3.0]];
    for (const v of vg) b.vehicle(v[0], v[1], v[2], v[3], { col: 0x4a4a3a });
    b.building(102, 124, 122, 138, { h: 5, tex: 'metalwall', doors: [{ side: 's', at: 7, w: 6, h: 4.5 }], roof: 'flat', roofTex: 'tin', floorTex: 'concrete', windows: false });
    b.rad(100, 100, 30, 0.028); b.rad(110, 130, 10, 0.02); b.rad(88, 100, 6, 0.05);
    b.fence([[66, 66], [146, 66]], 'wire'); b.fence([[146, 66], [146, 146]], 'wire');
    b.zone('graveyard', 64, 64, 148, 148); b.zone('digger_hangar', 102, 124, 122, 138);
    b.sign(66, H(70, 66) + 2.2, 65.8, 0, T('ОПАСНО! РАДИАЦИЯ', 'DANGER! RADIATION'));
    b.item('pda_digger', 112, 133, { y: H(112, 131) + 0.1, quest: true });
    b.prop('skeleton', 112, 132, { y: H(112, 132) + 0.05 });
    // ---- Fox's farm (NE)
    hut(b, -130, 114, -120, 122, 'w'); b.building(-118, 126, -110, 134, { h: 2.6, tex: 'planks', roof: 'gable', roofTex: 'tin', roofH: 1.8, doors: [{ side: 's', at: 3, w: 1.8 }] });
    b.fence([[-136, 108], [-104, 108], [-104, 140]], 'wood');
    b.zone('fox_farm', -150, 95, -95, 150);
    b.clearArea(-134, 110, -106, 138);
    // ---- Duty checkpoint (north)
    const dy = H(0, 188);
    for (let x = -14; x <= 12; x += 2.2) if (Math.abs(x) > 3) b.box(x, 187, x + 2, 188, dy, dy + 0.9, 'concrete');
    b.box(-3, 187, 3, 188, dy, dy + 1.1, 'metal', { render: false, thin: true }); b.prop('barrier', 3, 187.5, { rot: 0 });
    b.fence([[-200, 190], [-15, 190]], 'concrete'); b.fence([[15, 190], [200, 190]], 'concrete');
    b.building(-14, 191, -6, 198, { h: 2.8, tex: 'silicate', doors: [{ side: 'e', at: 2.5, w: 1.8 }], roof: 'flat' });
    b.box(-3, 190, 3, 200, dy - 0.3, dy + 4, 'wire', { thin: true, alpha: true });
    b.sign(0, dy + 3.2, 186.9, 0, T('«ДОЛГ». ПРОХОД В БАР', 'DUTY. WAY TO THE BAR'));
    b.lamp(-8, dy + 2.7, 190, { r: 10 }); b.prop('sandbags', 8, 184, { len: 4 }); b.box(6, 183.5, 10, 184.5, dy, dy + 0.8, 'concrete', { render: false });
    b.zone('duty_post', -20, 170, 20, 200);
    // ---- anomaly fields
    b.field('burner', 5, -55, 15, 14, ['droplets']);
    b.field('electro', 4, 70, 45, 14, ['flash']);
    b.field('acid', 4, -30, 100, 12, ['kolobok']);
    b.anomaly('whirligig', 40, 150); b.anomaly('whirligig', -20, 40); b.field('springboard', 4, 150, -80, 12, ['vyvert']);
    b.rad(-40, 60, 18, 0.015); b.rad(40, 110, 14, 0.012); b.rad(-90, 20, 12, 0.012); b.rad(-30, 100, 10, 0.01);
    // ---- props
    for (let i = 0; i < 14; i++) { const x = -60 + (i * 37) % 120, z = -20 + (i * 53) % 150; if (Math.abs(x - 25) > 8 && b.h(x, z) > 2) b.prop('junk', x, z); }
    b.vehicle('car', 6, -170, 0.3); b.vehicle('truck', 34, 20, 2.9, { col: 0x5a4a3a }); b.vehicle('car', -4, 160, 3.0); b.vehicle('bus', 120, 5, 1.2, { col: 0x8a5a30 });
    for (let x = -180; x <= 180; x += 60) { b.prop('pylon', x, -150); b.solid(x, -150, 2.4, 2.4, H(x, -150), H(x, -150) + 3); }
    b.sign(186, H(186, 34) + 2.2, 34, -Math.PI / 2, T('АГРОПРОМ →', 'AGROPROM →'));
    // ---- stashes
    b.stash('st_hangar_roof', 45, -63, [['545', 2], ['medkit', 2]], { y: 3.9, name: T('Тайник на крыше ангара', 'Stash on the hangar roof') });
    b.stash('st_wagon', -96.5, -112, [['9x19', 2], ['mp5', 1, 0.75], ['vodka', 2]], { name: T('Тайник у вагонов', 'Stash by the wagons') });
    b.stash('st_heaps', -40, 72, [['antirad', 3], ['stalker_suit', 1, 0.6]], { name: T('Тайник на холме свалки', 'Stash on the garbage heap') });
    b.stash('st_fox', -125, 134, [['medkit', 2], ['545bp', 1], ['tourist', 1]], { name: T('Тайник Лиса', 'Fox\'s stash') });
    // ---- trees (sparse and dead)
    b.forest(-195, -195, -140, -80, 45, ['dead', 'birch', 'pine', 'deadbush']);
    b.forest(130, -195, 195, -60, 45, ['pine', 'dead', 'birch', 'deadbush']);
    b.forest(150, 60, 195, 185, 35, ['pine', 'dead', 'birch']);
    b.forest(-195, 140, -140, 185, 30, ['dead', 'pine', 'deadbush']);
    b.forest(-80, -190, -20, -110, 20, ['dead', 'birch', 'deadbush']);
    b.forest(40, -190, 120, -130, 22, ['birch', 'dead', 'bush']);
    b.forest(-160, -20, -120, 80, 18, ['dead', 'deadbush', 'willow']);
    b.forest(40, 150, 140, 185, 20, ['dead', 'pine', 'deadbush']);
    // ---- NPCs
    b.npc('veteran', 72, -80, { id: 'seriy', name: T('Серый', 'Seriy'), beh: 'guard', yaw: -1.5, dialog: 'seriy', weapon: 'ak74', essential: true, trade: 'seriy' });
    b.npc('loner', hf.x + 1.8, hf.z + 0.6, { beh: 'camp', yaw: -2, group: 'hangar_loners', weapon: 'aks74u' });
    b.npc('loner', hf.x - 1.7, hf.z - 1.0, { beh: 'camp', yaw: 1.5, group: 'hangar_loners', weapon: 'toz', guitar: true });
    b.npc('loner', 57, -84, { beh: 'guard', yaw: -1.5, group: 'hangar_loners', weapon: 'mp5' });
    // bandit assault on the hangar (spawned by script)
    const ass = [[-5, -95], [-2, -88], [0, -100], [5, -70], [-8, -76], [10, -110]];
    ass.forEach((p, i) => b.npc(i === 0 ? 'bandit_boss' : 'bandit', p[0], p[1], { beh: 'assault', target: [60, -84], group: 'hangar_attack', hidden: true, yaw: -1.5, leash: 200, name: i === 0 ? T('Бандит Борзый', 'Bandit Borzy') : null }));
    // depot bandits and Bes
    b.npc('bandit', -96, -40, { beh: 'camp', yaw: 1, group: 'depot_bandits', leash: 25 });
    b.npc('bandit', -89, -41, { beh: 'camp', yaw: -1.5, group: 'depot_bandits', leash: 25, weapon: 'aks74u' });
    b.npc('bandit', -114, -44, { beh: 'guard', yaw: 1.4, group: 'depot_bandits', leash: 25, weapon: 'toz' });
    b.npc('hostage', -110, -52, { id: 'bes', name: T('Бес', 'Bes'), beh: 'hostage', yaw: 0.5, dialog: 'bes', faction: 'stalker' });
    // Fox (wounded) — the dogs arrive by script
    b.npc('loner', -123, 118.5, { id: 'fox', name: T('Лис', 'Fox'), beh: 'wounded', yaw: -1, dialog: 'fox', weapon: 'mp5', essential: true });
    // Duty
    b.npc('duty', -2, 184, { id: 'duty_guard', name: T('Долговец Сержант Хмурый', 'Duty Sergeant Gloomy'), beh: 'guard', yaw: Math.PI, dialog: 'duty', group: 'duty_post', leash: 6 });
    b.npc('duty', 7, 185.5, { beh: 'guard', yaw: Math.PI, group: 'duty_post', leash: 6 });
    b.npc('duty', -9, 193, { beh: 'patrol', path: 'duty_patrol', group: 'duty_post', leash: 10 });
    b.path('duty_patrol', [[-12, 192], [12, 192]]);
    // wandering bandits along the Agroprom road
    b.npc('bandit', 120, 12, { beh: 'patrol', path: 'agro_patrol', group: 'road_bandits', leash: 40 });
    b.npc('bandit', 124, 14, { beh: 'patrol', path: 'agro_patrol', group: 'road_bandits', leash: 40, weapon: 'aks74u' });
    b.path('agro_patrol', [[100, -2], [160, 26], [120, 12], [60, -14]]);
    // ---- mutants
    b.mutant('bloodsucker', 112, 130, { group: 'digger_guard', home: 12, lair: true });
    b.pack('pseudodog', 2, 95, 90, 6, { home: 25 });
    b.pack('dog', 4, -140, 118, 6, { group: 'fox_dogs', hidden: true, home: 40 });
    b.mutant('pseudodog', -145, 126, { group: 'fox_dogs', hidden: true, home: 40 });
    b.pack('dog', 5, 40, 60, 7, { home: 30 });
    b.mutant('flesh', -150, -60, { home: 25 }); b.mutant('flesh', -145, -55, { home: 25 }); b.mutant('boar', 150, -110, { home: 30 });
    // ---- items
    b.item('antirad', 72, -88, { y: 0.55 }); b.item('bandage', 62, -95, { y: 0.55 }); b.item('tourist', 46, -64, { y: 0.55 });
    b.item('545', 132, 90); b.item('vodka', -100, -48);
    // ---- exits
    b.spawn('from_cordon', 0, -188, 0);
    b.spawn('from_agroprom', 180, 36, -Math.PI / 2);
    b.exit('to_cordon', -20, -200, 20, -194, 'cordon', 'from_garbage', T('На Кордон', 'To Cordon'));
    b.exit('to_agroprom', 194, 20, 200, 60, 'agroprom', 'end', T('На Агропром', 'To Agroprom'));
    b.zone('bar_gate', -5, 186, 5, 200);
    return b.build();
  }

  S.LEVELS = { cordon, garbage };
  S.LEVEL_ORDER = ['cordon', 'garbage'];
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Stalker98 = globalThis.Stalker98 || {});
