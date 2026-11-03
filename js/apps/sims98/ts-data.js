(function (S) {
  'use strict';
  S.METRICS = {
    town: 640, chunk: 32, wall: 2.75, floorStep: 3, foundationStep: 0.25,
    adult: 1.75, teen: 1.65, child: 1.15, toddler: 0.8, door: 2.1, stairRun: 5,
    lotMin: 10, lotMax: 64, lotMargin: 2, walk: 1.5, jog: 2.4, run: 3, bike: 6, car: 12,
    spriteTop: 8, spriteSide: 4,
    wallThick: 0.2, wallLow: 0.6, floors: 5, roofPitch: 0.5, roofOver: 1, activeZoom: 2
  };

  S.WALL_MODES = ['up', 'cut', 'down'];
  S.WALL_NAMES = { up: 'стены вверх', cut: 'срез', down: 'стены вниз' };
  S.ROOF_FORMS = ['hip', 'gable', 'gableCross', 'halfHip', 'pyramid', 'mansard', 'shed', 'flat'];
  S.ROOF_NAMES = { hip: 'вальмовая', gable: 'двускатная', gableCross: 'двускатная поперёк', halfHip: 'полувальмовая', pyramid: 'шатровая', mansard: 'мансардная', shed: 'односкатная', flat: 'плоская' };

  S.SKY = [
    [0, 0.2, 0.24, 0.42, 0], [5, 0.22, 0.26, 0.44, 0], [6, 0.56, 0.48, 0.56, 0.3], [7.5, 0.92, 0.84, 0.76, 0.8],
    [10, 1, 1, 0.97, 1], [13, 1, 1, 1, 1], [16, 1.02, 0.96, 0.88, 1], [17.5, 1.05, 0.84, 0.66, 0.9],
    [19, 1.04, 0.72, 0.52, 0.7], [20, 0.56, 0.44, 0.54, 0.35], [21, 0.28, 0.29, 0.47, 0.05], [24, 0.2, 0.24, 0.42, 0]
  ];

  S.skyAt = hour => {
    const t = ((hour % 24) + 24) % 24, sky = S.SKY;
    let i = 0;
    while (i < sky.length - 2 && t >= sky[i + 1][0]) i++;
    const a = sky[i], b = sky[i + 1], k = (t - a[0]) / (b[0] - a[0]);
    return { color: [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k], sun: a[4] + (b[4] - a[4]) * k };
  };

  S.lampsOn = hour => hour < 7 || hour >= 18.5;

  S.SPEEDS = [0, 1, 3, 8, 32];
  S.DAY_MINUTES = 1440;
  S.DAY_NAMES = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  S.DAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  S.dayName = day => S.DAY_NAMES[(day - 1) % 7];
  S.weekOf = day => Math.floor((day - 1) / 7) + 1;
  S.timeText = clock => Math.floor(clock / 60) + ':' + String(Math.floor(clock % 60)).padStart(2, '0');
  S.dateText = (day, clock) => S.DAY_SHORT[(day - 1) % 7] + ', день ' + day + ', ' + S.timeText(clock);

  const MB = 1048576, PAGE_PIXELS = 2048 * 2048, PAGE_PAIR = PAGE_PIXELS * 8, RESERVE = 64 * MB, SHELF_WASTE = 1.4;
  S.QUALITIES = ['high', 'ultra'];
  S.QUALITY_NAMES = { high: 'Высокое', ultra: 'Ультра' };
  S.QUALITY_BUDGET = { high: 512 * MB, ultra: 1024 * MB };

  S.spriteMemory = (index, quality) => {
    const fixed = index.pages * PAGE_PAIR + index.shadowPages * PAGE_PIXELS;
    const want = Math.ceil(index.liveArea * SHELF_WASTE / PAGE_PIXELS) + 1;
    const room = Math.floor((S.QUALITY_BUDGET[quality] - RESERVE - fixed) / PAGE_PAIR);
    const live = Math.max(2, Math.min(want, room));
    return { live, want, bytes: fixed + live * PAGE_PAIR + RESERVE };
  };

  S.CAMERA = { elevation: Math.PI / 6, depthRange: 1000 };

  S.ZOOMS = [
    { id: 'near', name: 'ближний', tile: 128, step: 1 },
    { id: 'middle', name: 'средний', tile: 64, step: 1 },
    { id: 'far', name: 'дальний', tile: 32, step: 2 },
    { id: 'town', name: 'город', tile: 16, step: 4 },
    { id: 'district', name: 'район', tile: 8, step: 8 }
  ];

  S.SCREENS = ['800', '1024', 'window'];
  S.SCREEN_NAMES = { 800: '800×600', 1024: '1024×768', window: 'по окну' };

  S.PAINT = { grass: 0, meadow: 1, forest: 2, sand: 3, rock: 4, road: 5, walk: 6, seabed: 7, floor: 8 };
  S.PAINT_COLORS = [
    [0.36, 0.56, 0.27], [0.43, 0.61, 0.3], [0.25, 0.42, 0.22], [0.82, 0.74, 0.52],
    [0.5, 0.47, 0.42], [0.27, 0.27, 0.3], [0.62, 0.61, 0.58], [0.55, 0.52, 0.38], [0.72, 0.62, 0.48]
  ];

  S.heightPx = (zoom, units) => S.ZOOMS[zoom].tile / Math.SQRT2 * Math.cos(S.CAMERA.elevation) * units;
})(globalThis.Sims98 = globalThis.Sims98 || {});
