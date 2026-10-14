(function (Z) {
  'use strict';

  const P = Math.PI, H = Math.PI / 2;
  const R = Z.INTERIORS;

  const plan = (W, Hh, o) => {
    const g = [];
    for (let r = 0; r < Hh; r++) g.push(new Array(W).fill('#'));
    for (const [c0, r0, c1, r1, ch] of o.rooms) for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g[r][c] = ch || '.';
    for (const [c, r, ch] of o.gaps || []) g[r][c] = ch || '.';
    for (const [c, r] of o.win || []) g[r][c] = 'W';
    for (const k in o.marks || {}) { const [c, r] = o.marks[k]; g[r][c] = k; }
    return g.map(row => row.join(''));
  };
  const exitW = (r, to, name) => ({ type: 'door', at: [1, r], dx: 0.05, yaw: H, to: 'ext', mark: 'door_' + to, name: name || 'Выход', dest: 'Наружу' });
  const room = (id, o) => { R[id] = Object.assign({ h: 2.8 }, o, { map: plan(o.W, o.H, o.plan) }); delete R[id].plan; return R[id]; };

  room('medpunkt', {
    name: 'Медпункт', W: 16, H: 10, amb: [0.3, 0.3, 0.29],
    plan: { rooms: [[1, 1, 7, 4, ','], [9, 1, 14, 8, ','], [1, 6, 7, 8]], gaps: [[4, 5], [8, 7]], win: [[3, 0], [5, 0], [11, 0], [13, 0], [15, 3], [15, 6]], marks: { A: [2, 7], B: [3, 3] } },
    mat: { wall: 'plasterWhite', floor: 'linoleum', floor2: 'tiles', ceil: 'plasterWhite' }, dado: 'paintGreen', tint: { dado: [90, 130, 110] },
    marks: { A: { yaw: H }, B: { yaw: H } },
    props: [
      { kind: 'cot', at: [2, 2], yaw: 0 }, { kind: 'table', at: [5, 1], dz: 0.6, yaw: 0 }, { kind: 'chair', at: [5, 2], yaw: P }, { kind: 'shelf', at: [7, 4], dx: 0.75, yaw: -H },
      { kind: 'bunk', at: [10, 2], yaw: 0 }, { kind: 'bunk', at: [12, 2], yaw: 0 }, { kind: 'cot', at: [14, 5], dx: 0.4, yaw: 0 }, { kind: 'sink', at: [14, 8], dz: 0.7, yaw: P },
      { kind: 'poster', at: [3, 8], dz: 0.94, yaw: 0, tint: [200, 200, 190] }, { kind: 'radiator', at: [5, 8], dz: 0.9, yaw: 0 }, { kind: 'lamp', at: [4, 3], y: 2.78 }, { kind: 'lamp', at: [11, 4], y: 2.78 }, { kind: 'lamp', at: [4, 7], y: 2.78 }
    ],
    objects: [
      exitW(7, 'medpunkt'),
      { type: 'medbox', at: [1, 3], dx: 0.12, yaw: H, loot: 'med', owner: 'vozn', id: 'med_box1' },
      { type: 'cabinet', at: [13, 1], dz: 0.3, yaw: P, loot: 'med', owner: 'vozn', id: 'med_cab' },
      { type: 'desk', at: [6, 7], yaw: -H, loot: 'office', owner: 'vozn', id: 'med_desk' },
      { type: 'note', at: [6, 7], dz: 0.3, y: 0.79, note: 'n_bullet', id: 'med_note' }
    ],
    lights: [{ at: [4, 3], r: 7 }, { at: [11, 4], r: 8 }, { at: [4, 7], r: 6 }],
    npcs: [{ id: 'doctor', at: [5, 3], yaw: -H }]
  });

  room('bar_grusha', {
    name: 'Бар «Груша»', W: 18, H: 12, amb: [0.26, 0.21, 0.16],
    plan: { rooms: [[1, 1, 16, 7], [1, 9, 7, 10, ','], [9, 9, 16, 10]], gaps: [[4, 8], [12, 8]], win: [[3, 0], [7, 0], [11, 0], [15, 0], [17, 4]], marks: { A: [2, 4] } },
    mat: { wall: 'wood', floor: 'parquet', floor2: 'tiles', ceil: 'wood' }, tint: { wall: [150, 120, 96] },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'bar', at: [8, 5], dx: 0.5, yaw: 0 }, { kind: 'shelf', at: [8, 7], dz: 0.75, yaw: 0 }, { kind: 'shelf', at: [10, 7], dz: 0.75, yaw: 0 },
      { kind: 'table', at: [3, 2], yaw: 0 }, { kind: 'stool', at: [2, 2] }, { kind: 'stool', at: [4, 2] },
      { kind: 'table', at: [6, 2], yaw: 0 }, { kind: 'stool', at: [6, 3] },
      { kind: 'table', at: [13, 2], yaw: 0 }, { kind: 'stool', at: [12, 2] }, { kind: 'stool', at: [14, 2] },
      { kind: 'table', at: [14, 5], yaw: 0 }, { kind: 'stool', at: [13, 5] }, { kind: 'stool', at: [15, 5] },
      { kind: 'piano', at: [16, 1], dx: 0.3, dz: 0.6, yaw: -H }, { kind: 'slot', at: [1, 6], dx: 0.4, yaw: H },
      { kind: 'stove', at: [2, 10], yaw: 0 }, { kind: 'sink', at: [4, 10], yaw: 0 }, { kind: 'sacks', at: [10, 10] }, { kind: 'boxes', at: [14, 10] },
      { kind: 'banner', at: [9, 1], dz: 0.06, yaw: P }, { kind: 'lamp', at: [4, 3], y: 2.78 }, { kind: 'lamp', at: [12, 4], y: 2.78 }
    ],
    objects: [
      exitW(4, 'bar_grusha'),
      { type: 'radio', at: [11, 5], dz: 0.3, y: 1.1, yaw: 0, name: 'Радиола «Ригонда»' },
      { type: 'crate', at: [15, 10], yaw: 0, loot: 'food', owner: 'vozn', id: 'bar_crate' },
      { type: 'fridge', at: [6, 10], yaw: 0, loot: 'food', owner: 'vozn', id: 'bar_fridge' },
      { type: 'bed', at: [11, 9], dz: 0.9, yaw: H, name: 'Койка на втором этаже' }
    ],
    lights: [{ at: [4, 3], r: 8, c: [1.4, 1.0, 0.6] }, { at: [12, 4], r: 9, c: [1.4, 1.0, 0.6], flicker: true }, { at: [4, 9], r: 5 }],
    npcs: [{ id: 'samovar', at: [8, 6], yaw: 0 }, { id: 'yarina', at: [14, 4], yaw: P }],
    spawns: [{ tpl: 'villager', pts: [[3, 3], [13, 3]], n: 2, wander: 0, faction: 'vozn' }]
  });

  room('selmag', {
    name: 'Сельмаг', W: 12, H: 9, amb: [0.28, 0.27, 0.25],
    plan: { rooms: [[1, 1, 10, 4], [1, 6, 10, 7, ',']], gaps: [[8, 5]], win: [[3, 0], [7, 0]], marks: { A: [2, 2] } },
    mat: { wall: 'plasterCream', floor: 'linoleum', floor2: 'concrete' },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'counter', at: [6, 3], yaw: 0 }, { kind: 'shelf', at: [10, 1], dx: 0.75, yaw: -H }, { kind: 'shelf', at: [10, 3], dx: 0.75, yaw: -H },
      { kind: 'shelf', at: [4, 4], dz: 0.75, yaw: 0 }, { kind: 'sacks', at: [2, 7] }, { kind: 'boxes', at: [5, 7] }, { kind: 'lamp', at: [5, 2], y: 2.78 }
    ],
    objects: [exitW(2, 'selmag'), { type: 'crate', at: [7, 7], yaw: 0, loot: 'food', owner: 'vozn', id: 'selmag_c1' }, { type: 'ammobox', at: [9, 7], yaw: 0, loot: 'ammo', owner: 'vozn', lock: 25, id: 'selmag_ammo' }],
    lights: [{ at: [5, 2], r: 7 }],
    npcs: [{ id: 'lyuba', at: [6, 4], yaw: 0 }]
  });

  room('selsovet', {
    name: 'Сельсовет', W: 14, H: 10, amb: [0.26, 0.26, 0.24],
    plan: { rooms: [[1, 1, 12, 4], [1, 6, 6, 8], [8, 6, 12, 8, ',']], gaps: [[3, 5], [10, 5]], win: [[4, 0], [9, 0], [13, 2]], marks: { A: [2, 2] } },
    mat: { wall: 'wallpaper', floor: 'parquet', floor2: 'linoleum' }, tint: { wall: [140, 150, 120] },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'bigtable', at: [7, 2], yaw: 0 }, { kind: 'chair', at: [6, 1], yaw: P }, { kind: 'chair', at: [8, 1], yaw: P }, { kind: 'chair', at: [6, 3], yaw: 0 }, { kind: 'chair', at: [8, 3], yaw: 0 },
      { kind: 'banner', at: [12, 2], dx: 0.94, yaw: -H }, { kind: 'poster', at: [3, 4], dz: 0.94, yaw: 0 }, { kind: 'tv', at: [11, 4], dz: 0.5, yaw: 0 },
      { kind: 'chair', at: [4, 7], yaw: -H }, { kind: 'shelf', at: [1, 8], dx: 0.25, dz: 0.5, yaw: H }, { kind: 'lamp', at: [7, 2], y: 2.78 }, { kind: 'lamp', at: [4, 7], y: 2.78 }
    ],
    objects: [
      exitW(2, 'selsovet'),
      { type: 'desk', at: [3, 7], yaw: H, loot: 'office', owner: 'vozn', id: 'sel_desk' },
      { type: 'cabinet', at: [9, 8], dz: 0.7, yaw: 0, loot: 'office', owner: 'vozn', id: 'sel_cab' },
      { type: 'safe', at: [12, 8], dz: 0.5, yaw: -H, lock: 50, owner: 'vozn', loot: [['talon', 1, 80, 140], ['bkSpeech', 0.3, 1, 1]], id: 'sel_safe' },
      { type: 'note', at: [11, 6], dz: 0.5, note: 'n_tribute', id: 'sel_note' },
      { type: 'terminal', at: [12, 7], dx: 0.6, yaw: -H, lock: 25, term: 'selsovet', id: 'sel_term' }
    ],
    lights: [{ at: [7, 2], r: 8 }, { at: [4, 7], r: 6 }, { at: [10, 7], r: 5 }],
    npcs: [{ id: 'karpenko', at: [4, 7], yaw: -H }]
  });

  room('kuren', {
    name: 'Курень Кущевский', W: 16, H: 9, amb: [0.24, 0.2, 0.16],
    plan: { rooms: [[1, 1, 14, 6]], win: [[4, 0], [10, 0], [15, 3]], marks: { A: [2, 3] } },
    mat: { wall: 'logs', floor: 'wood', ceil: 'wood' },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'bunk', at: [3, 1], dz: 1, yaw: H }, { kind: 'bunk', at: [6, 1], dz: 1, yaw: H }, { kind: 'bunk', at: [3, 6], yaw: H }, { kind: 'bunk', at: [6, 6], yaw: H },
      { kind: 'bigtable', at: [9, 3], yaw: 0 }, { kind: 'stool', at: [8, 2] }, { kind: 'stool', at: [10, 2] }, { kind: 'stool', at: [9, 4] },
      { kind: 'banner', at: [14, 3], dx: 0.94, yaw: -H, tint: [150, 30, 50] }, { kind: 'lamp', at: [9, 3], y: 2.78 }
    ],
    objects: [
      exitW(3, 'kuren'),
      { type: 'bed', at: [13, 1], dz: 0.9, yaw: H, name: 'Гостевая лежанка' },
      { type: 'safe', at: [14, 6], dx: 0.5, dz: 0.5, yaw: -H, name: 'Сундук гостя', lock: 50, owner: 'coop', loot: [['talon', 1, 150, 220], ['vodka', 1, 1, 2]], id: 'firma_chest' },
      { type: 'crate', at: [1, 6], dx: 0.5, yaw: H, loot: 'military', owner: 'sich', id: 'kuren_crate' }
    ],
    lights: [{ at: [9, 3], r: 9, c: [1.5, 1.0, 0.55], flicker: true }],
    npcs: [{ id: 'firma', at: [12, 3], yaw: -H }],
    spawns: [{ tpl: 'sichGuard', pts: [[8, 4], [5, 3]], n: 2, wander: 2, faction: 'sich', key: 'kurenguard' }]
  });

  room('sich_kosh', {
    name: 'Войсковая канцелярия', W: 20, H: 12, amb: [0.24, 0.21, 0.17],
    plan: { rooms: [[1, 1, 18, 6], [1, 8, 9, 10], [11, 8, 18, 10, ',']], gaps: [[5, 7], [15, 7]], win: [[4, 0], [9, 0], [14, 0], [19, 3]], marks: { A: [2, 3] } },
    mat: { wall: 'logs', floor: 'wood', floor2: 'parquet', ceil: 'wood' },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'seats', at: [8, 2], yaw: 0 }, { kind: 'seats', at: [8, 4], yaw: 0 }, { kind: 'seats', at: [13, 2], yaw: 0 }, { kind: 'seats', at: [13, 4], yaw: 0 },
      { kind: 'stage', at: [16, 3], dx: 0.5, yaw: -H }, { kind: 'banner', at: [18, 2], dx: 0.94, yaw: -H, tint: [150, 30, 50] }, { kind: 'banner', at: [18, 5], dx: 0.94, yaw: -H, tint: [40, 60, 140] },
      { kind: 'bigtable', at: [5, 9], yaw: 0 }, { kind: 'chair', at: [5, 10], yaw: 0 }, { kind: 'shelf', at: [1, 9], dx: 0.25, yaw: H }, { kind: 'rack', at: [9, 9], dx: 0.6, yaw: -H },
      { kind: 'table', at: [15, 9], yaw: 0 }, { kind: 'chair', at: [15, 10], yaw: 0 }, { kind: 'shelf', at: [18, 9], dx: 0.75, yaw: -H },
      { kind: 'lamp', at: [6, 3], y: 2.78 }, { kind: 'lamp', at: [14, 3], y: 2.78 }
    ],
    objects: [
      exitW(3, 'sich_kosh'),
      { type: 'safe', at: [2, 10], dz: 0.5, yaw: H, name: 'Войсковая скарбница', lock: 75, owner: 'sich', loot: [['talon', 1, 250, 400], ['sabreAtaman', 0.3, 1, 1], ['bkMelee', 0.5, 1, 1]], id: 'kosh_safe' },
      { type: 'cabinet', at: [17, 8], dz: 0.3, yaw: P, loot: 'office', owner: 'sich', id: 'pisar_cab' },
      { type: 'note', at: [15, 9], dz: 0.3, y: 0.79, note: 'n_rada', id: 'rada_note' }
    ],
    lights: [{ at: [6, 3], r: 9, c: [1.4, 1.0, 0.6] }, { at: [14, 3], r: 9, c: [1.4, 1.0, 0.6] }, { at: [5, 9], r: 6 }, { at: [15, 9], r: 6 }],
    npcs: [{ id: 'sirko', at: [5, 8], yaw: P }, { id: 'pisar', at: [15, 8], yaw: P }],
    spawns: [{ tpl: 'sichGuard', pts: [[3, 5], [10, 1]], n: 2, wander: 3, faction: 'sich' }]
  });

  room('korchma', {
    name: 'Корчма', W: 14, H: 9, amb: [0.26, 0.2, 0.14],
    plan: { rooms: [[1, 1, 12, 5], [1, 7, 12, 7, ',']], gaps: [[10, 6]], win: [[4, 0], [9, 0]], marks: { A: [2, 3] } },
    mat: { wall: 'logs', floor: 'wood', floor2: 'tiles', ceil: 'wood' },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'bar', at: [7, 4], dx: 0.3, yaw: 0 }, { kind: 'bigtable', at: [4, 2], yaw: 0 }, { kind: 'stool', at: [3, 1] }, { kind: 'stool', at: [5, 1] }, { kind: 'stool', at: [4, 3] },
      { kind: 'table', at: [11, 2], yaw: 0 }, { kind: 'stool', at: [10, 2] }, { kind: 'stove', at: [2, 7], yaw: 0 }, { kind: 'sacks', at: [5, 7] }, { kind: 'lamp', at: [6, 2], y: 2.78 }
    ],
    objects: [exitW(3, 'korchma'), { type: 'crate', at: [8, 7], yaw: 0, loot: 'food', owner: 'sich', id: 'korchma_crate' }, { type: 'bed', at: [11, 7], dx: 0.3, yaw: 0, name: 'Лавка у печи' }],
    lights: [{ at: [6, 2], r: 9, c: [1.6, 1.0, 0.5], flicker: true }],
    npcs: [{ id: 'shinkar', at: [7, 5], yaw: 0 }],
    spawns: [{ tpl: 'sichGuard', pts: [[3, 2], [10, 3]], n: 2, wander: 0, faction: 'sich' }]
  });

  room('museum', {
    name: 'Музей истории казачества', W: 24, H: 12, h: 3.6, amb: [0.24, 0.23, 0.22],
    plan: { rooms: [[1, 1, 22, 6], [1, 8, 10, 10, ','], [12, 8, 22, 10]], gaps: [[5, 7], [17, 7]], win: [[6, 0], [12, 0], [18, 0]], marks: { A: [2, 3] } },
    mat: { wall: 'marble', floor: 'parquet', floor2: 'concrete', ceil: 'plasterWhite' },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'column', at: [6, 3] }, { kind: 'column', at: [12, 3] }, { kind: 'column', at: [18, 3] },
      { kind: 'shelf', at: [8, 1], dz: 0.25, yaw: P }, { kind: 'shelf', at: [10, 1], dz: 0.25, yaw: P }, { kind: 'shelf', at: [14, 1], dz: 0.25, yaw: P }, { kind: 'shelf', at: [16, 1], dz: 0.25, yaw: P },
      { kind: 'machine', at: [9, 5], yaw: 0, tint: [120, 100, 80] }, { kind: 'banner', at: [22, 3], dx: 0.94, yaw: -H, tint: [150, 30, 50] },
      { kind: 'rack', at: [3, 9], yaw: 0 }, { kind: 'boxes', at: [8, 10] }, { kind: 'table', at: [17, 9], yaw: 0 }, { kind: 'chair', at: [17, 10], yaw: 0 }, { kind: 'shelf', at: [22, 9], dx: 0.75, yaw: -H },
      { kind: 'lamp', at: [6, 3], y: 3.58 }, { kind: 'lamp', at: [15, 3], y: 3.58 }
    ],
    objects: [
      exitW(3, 'museum'),
      { type: 'safe', at: [10, 10], dx: 0.5, yaw: -H, name: 'Хранилище экспонатов', lock: 60, owner: 'sich', loot: [['talon', 1, 60, 120], ['bkMelee', 0.4, 1, 1], ['badgeGTO', 1, 1, 2]], id: 'museum_safe' },
      { type: 'note', at: [17, 9], dz: 0.3, y: 0.79, note: 'n_pectoral', id: 'museum_note' }
    ],
    lights: [{ at: [6, 3], r: 10 }, { at: [15, 3], r: 10 }, { at: [17, 9], r: 6 }],
    npcs: [{ id: 'keeper', at: [17, 8], yaw: P }]
  });

  room('komendatura', {
    name: 'Комендатура', W: 24, H: 14, h: 3.4, amb: [0.25, 0.25, 0.23],
    plan: { rooms: [[1, 1, 10, 5], [12, 1, 22, 5], [1, 7, 10, 12], [12, 7, 14, 9, ','], [16, 7, 18, 9, ','], [20, 7, 22, 9, ','], [12, 11, 22, 12]], gaps: [[11, 3], [5, 6], [11, 11], [13, 10], [17, 10], [21, 10]], win: [[4, 0], [8, 0], [15, 0], [19, 0], [23, 3]], marks: { A: [2, 3] } },
    mat: { wall: 'plasterCream', floor: 'parquet', floor2: 'concrete', ceil: 'plasterWhite' }, dado: 'paintGreen', tint: { dado: [90, 110, 80] },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'banner', at: [6, 1], dz: 0.06, yaw: P }, { kind: 'poster', at: [9, 5], dz: 0.94, yaw: 0 }, { kind: 'column', at: [3, 1], dz: 0.4 }, { kind: 'column', at: [8, 1], dz: 0.4 },
      { kind: 'bigtable', at: [17, 3], yaw: 0 }, { kind: 'chair', at: [16, 2], yaw: P }, { kind: 'chair', at: [18, 2], yaw: P }, { kind: 'chair', at: [17, 4], yaw: 0 },
      { kind: 'banner', at: [22, 3], dx: 0.94, yaw: -H }, { kind: 'shelf', at: [12, 1], dx: 0.3, dz: 0.3, yaw: P },
      { kind: 'bunk', at: [2, 8], dz: 0.8, yaw: H }, { kind: 'bunk', at: [2, 11], yaw: H }, { kind: 'bunk', at: [5, 8], dz: 0.8, yaw: H }, { kind: 'rack', at: [9, 12], dz: 0.7, yaw: 0 },
      { kind: 'cot', at: [13, 8] }, { kind: 'cot', at: [17, 8] }, { kind: 'cot', at: [21, 8] },
      { kind: 'lamp', at: [5, 3], y: 3.38 }, { kind: 'lamp', at: [17, 3], y: 3.38 }, { kind: 'lamp', at: [5, 9], y: 3.38 }, { kind: 'lamp', at: [17, 11], y: 3.38 }
    ],
    objects: [
      exitW(3, 'komendatura'),
      { type: 'desk', at: [5, 4], yaw: 0, loot: 'office', owner: 'komendatura', id: 'kom_desk' },
      { type: 'safe', at: [21, 1], dz: 0.4, yaw: P, lock: 75, owner: 'komendatura', loot: [['talon', 1, 200, 350], ['bkGuns', 0.4, 1, 1]], id: 'kom_safe' },
      { type: 'locker', at: [8, 8], dz: 0.3, yaw: P, loot: 'military', owner: 'komendatura', id: 'kom_l1' }, { type: 'locker', at: [9, 8], dz: 0.3, yaw: P, loot: 'military', owner: 'komendatura', id: 'kom_l2' },
      { type: 'door', at: [13, 10], dz: 0.5, yaw: 0, lock: 50, key: 'kpzKey', name: 'Камера №1', blocks: true, id: 'kpz1' },
      { type: 'door', at: [17, 10], dz: 0.5, yaw: 0, lock: 50, key: 'kpzKey', name: 'Камера №2', blocks: true, id: 'kpz2' },
      { type: 'door', at: [21, 10], dz: 0.5, yaw: 0, lock: 50, key: 'kpzKey', name: 'Камера №3', blocks: true, id: 'kpz3' },
      { type: 'terminal', at: [22, 4], dx: 0.6, yaw: -H, lock: 50, term: 'komendatura', id: 'kom_term' }
    ],
    lights: [{ at: [5, 3], r: 9 }, { at: [17, 3], r: 9 }, { at: [5, 9], r: 9 }, { at: [17, 11], r: 9, flicker: true }],
    npcs: [{ id: 'savchenko', at: [17, 2], yaw: P }, { id: 'kvarter', at: [7, 10], yaw: 0 }],
    spawns: [{ tpl: 'komendach', pts: [[3, 3], [8, 4], [3, 10]], n: 3, wander: 2, faction: 'komendatura', key: 'komguard' }, { tpl: 'sichGuard', pts: [[13, 8], [17, 8]], n: 2, wander: 0, faction: 'sich', weapon: 'fists', key: 'prisoner', name: 'Пленный казак' }]
  });

  room('intourist', {
    name: 'Гостиница «Интурист»', W: 28, H: 16, h: 3.4, amb: [0.28, 0.24, 0.2],
    plan: { rooms: [[1, 1, 12, 7], [14, 1, 26, 7, ','], [1, 9, 12, 14], [14, 9, 20, 14, ','], [22, 9, 26, 14]], gaps: [[13, 4], [6, 8], [13, 11], [21, 11]], win: [[4, 0], [9, 0], [17, 0], [23, 0], [27, 4]], marks: { A: [2, 4] } },
    mat: { wall: 'wallpaper', floor: 'parquet', floor2: 'fabric', ceil: 'plasterWhite' }, tint: { wall: [160, 120, 110], floor2: [120, 40, 40] },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'counter', at: [6, 2], yaw: 0 }, { kind: 'shelf', at: [6, 1], dz: 0.25, yaw: P }, { kind: 'column', at: [3, 6] }, { kind: 'column', at: [10, 6] }, { kind: 'banner', at: [12, 4], dx: 0.94, yaw: -H, tint: [40, 40, 60] },
      { kind: 'cardtable', at: [17, 3], yaw: 0 }, { kind: 'chair', at: [16, 4], yaw: 0 }, { kind: 'chair', at: [18, 4], yaw: 0 }, { kind: 'cardtable', at: [22, 3], yaw: 0 }, { kind: 'chair', at: [22, 4], yaw: 0 },
      { kind: 'slot', at: [15, 7], dz: 0.6, yaw: 0 }, { kind: 'slot', at: [17, 7], dz: 0.6, yaw: 0 }, { kind: 'slot', at: [19, 7], dz: 0.6, yaw: 0 }, { kind: 'bar', at: [25, 5], dx: 0.4, yaw: -H },
      { kind: 'table', at: [3, 11], yaw: 0 }, { kind: 'chair', at: [3, 10], yaw: P }, { kind: 'chair', at: [3, 12], yaw: 0 }, { kind: 'table', at: [8, 11], yaw: 0 }, { kind: 'chair', at: [8, 12], yaw: 0 }, { kind: 'piano', at: [11, 14], dz: 0.5, yaw: 0 },
      { kind: 'bigtable', at: [17, 11], yaw: 0 }, { kind: 'chair', at: [17, 12], yaw: 0 }, { kind: 'shelf', at: [20, 9], dx: 0.75, yaw: -H }, { kind: 'tv', at: [15, 14], dz: 0.5, yaw: 0 },
      { kind: 'wardrobe', at: [26, 9], dx: 0.5, yaw: -H },
      { kind: 'lamp', at: [6, 4], y: 3.38 }, { kind: 'lamp', at: [20, 4], y: 3.38 }, { kind: 'lamp', at: [6, 11], y: 3.38 }, { kind: 'lamp', at: [17, 11], y: 3.38 }
    ],
    objects: [
      exitW(4, 'intourist'),
      { type: 'sofa', at: [2, 1], dz: 0.5, yaw: P }, { type: 'bed', at: [24, 13], yaw: H, name: 'Номер «люкс»' },
      { type: 'door', at: [13, 11], dz: 0.5, yaw: H, lock: 70, key: 'firmaKey', name: 'Кабинет председателя', blocks: true, id: 'firma_door' },
      { type: 'safe', at: [14, 13], dx: 0.4, yaw: H, lock: 80, key: 'firmaKey', owner: 'coop', loot: [['talon', 1, 300, 500], ['mgBarter', 1, 1, 1]], id: 'firma_safe' },
      { type: 'note', at: [17, 11], dz: 0.3, y: 0.79, note: 'n_firma_ledger', id: 'firma_ledger' },
      { type: 'terminal', at: [20, 13], dx: 0.6, yaw: -H, lock: 60, term: 'intourist', id: 'int_term' },
      { type: 'crate', at: [26, 14], dx: 0.4, yaw: -H, loot: 'home', owner: 'coop', id: 'montana_crate' }
    ],
    lights: [{ at: [6, 4], r: 10, c: [1.4, 1.1, 0.8] }, { at: [20, 4], r: 11, c: [1.5, 1.0, 0.7] }, { at: [6, 11], r: 9 }, { at: [17, 11], r: 7 }, { at: [24, 11], r: 6 }],
    npcs: [{ id: 'bella', at: [6, 3], yaw: 0 }, { id: 'croupier', at: [17, 2], yaw: P }, { id: 'montana', at: [24, 10], yaw: P }],
    spawns: [{ tpl: 'coop', pts: [[3, 5], [10, 2], [20, 6]], n: 3, wander: 2, faction: 'coop', key: 'coopguard' }]
  });

  room('pochtamt', {
    name: 'Почтамт', W: 22, H: 12, h: 3.6, amb: [0.26, 0.25, 0.23],
    plan: { rooms: [[1, 1, 20, 6], [1, 8, 10, 10, ','], [12, 8, 20, 10]], gaps: [[5, 7], [16, 7]], win: [[4, 0], [10, 0], [16, 0]], marks: { A: [2, 3] } },
    mat: { wall: 'plasterCream', floor: 'tiles', floor2: 'linoleum', ceil: 'plasterWhite' },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'counter', at: [8, 4], yaw: 0 }, { kind: 'counter', at: [11, 4], yaw: 0 }, { kind: 'counter', at: [14, 4], yaw: 0 },
      { kind: 'column', at: [5, 2] }, { kind: 'column', at: [17, 2] }, { kind: 'banner', at: [20, 3], dx: 0.94, yaw: -H },
      { kind: 'rack', at: [3, 9], yaw: 0 }, { kind: 'rack', at: [7, 9], yaw: 0 }, { kind: 'sacks', at: [9, 10] }, { kind: 'shelf', at: [20, 9], dx: 0.75, yaw: -H },
      { kind: 'lamp', at: [6, 3], y: 3.58 }, { kind: 'lamp', at: [15, 3], y: 3.58 }, { kind: 'lamp', at: [16, 9], y: 3.58 }
    ],
    objects: [
      exitW(3, 'pochtamt'),
      { type: 'mailbox', at: [1, 5], dx: 0.15, yaw: H, loot: 'office', id: 'po_box1' },
      { type: 'cabinet', at: [13, 8], dz: 0.3, yaw: P, loot: 'office', owner: 'vozn', id: 'po_cab1' }, { type: 'cabinet', at: [15, 8], dz: 0.3, yaw: P, loot: 'office', owner: 'vozn', id: 'po_cab2' },
      { type: 'terminal', at: [18, 10], dz: 0.6, yaw: 0, lock: 30, term: 'pochtamt', id: 'po_term' }
    ],
    lights: [{ at: [6, 3], r: 10 }, { at: [15, 3], r: 10 }, { at: [16, 9], r: 7 }, { at: [5, 9], r: 6 }],
    npcs: [{ id: 'aristarkh', at: [11, 5], yaw: 0 }]
  });

  room('oblispolkom', {
    name: 'Облисполком', W: 20, H: 12, h: 3.6, amb: [0.18, 0.18, 0.17],
    plan: { rooms: [[1, 1, 18, 6], [1, 8, 8, 10, ','], [10, 8, 18, 10]], gaps: [[4, 7], [14, 7]], win: [[5, 0], [10, 0], [15, 0]], marks: { A: [2, 3], B: [4, 9] } },
    mat: { wall: 'marble', floor: 'parquet', floor2: 'concrete', ceil: 'plasterWhite' },
    marks: { A: { yaw: H }, B: { yaw: H } },
    props: [
      { kind: 'column', at: [5, 2] }, { kind: 'column', at: [5, 5] }, { kind: 'column', at: [13, 2] }, { kind: 'column', at: [13, 5] },
      { kind: 'banner', at: [9, 1], dz: 0.06, yaw: P }, { kind: 'rubble', at: [16, 4] }, { kind: 'rubble', at: [11, 9] },
      { kind: 'bigtable', at: [14, 9], yaw: 0 }, { kind: 'lamp', at: [9, 3], y: 3.58 }
    ],
    objects: [
      exitW(3, 'oblispolkom'),
      { type: 'hatch', at: [6, 9], yaw: 0, to: 'bunker', mark: 'A', name: 'Люк в бункер', dest: 'Бункер ГО', lock: 0, id: 'obl_hatch' },
      { type: 'cabinet', at: [17, 8], dz: 0.3, yaw: P, loot: 'office', id: 'obl_cab' },
      { type: 'note', at: [14, 9], dz: 0.3, y: 0.79, note: 'n_obl', id: 'obl_note' }
    ],
    lights: [{ at: [9, 3], r: 8, flicker: true }, { at: [5, 9], r: 5, c: [1.2, 0.4, 0.3] }],
    spawns: [{ creature: 'druzhinnik', pts: [[8, 3], [15, 4]], n: 2, wander: 4, key: 'oblrobot' }]
  });

  room('bunker', {
    name: 'Бункер ГО Облисполкома', W: 26, H: 14, h: 3, amb: [0.16, 0.18, 0.2],
    plan: { rooms: [[1, 6, 24, 7, ','], [1, 1, 24, 4], [1, 9, 11, 12], [13, 9, 24, 12, ',']], gaps: [[6, 5], [18, 5], [6, 8], [18, 8]], marks: { A: [2, 7] } },
    mat: { wall: 'concrete', floor: 'concrete', floor2: 'linoleum', ceil: 'concrete' }, tint: { wall: [120, 126, 130] },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'computer', at: [3, 1], dz: 0.35, yaw: P }, { kind: 'computer', at: [5, 1], dz: 0.35, yaw: P }, { kind: 'reel', at: [8, 1], dz: 0.4, yaw: P }, { kind: 'reel', at: [10, 1], dz: 0.4, yaw: P },
      { kind: 'computer', at: [14, 1], dz: 0.35, yaw: P }, { kind: 'reel', at: [16, 1], dz: 0.4, yaw: P }, { kind: 'computer', at: [18, 1], dz: 0.35, yaw: P }, { kind: 'reel', at: [20, 1], dz: 0.4, yaw: P }, { kind: 'computer', at: [22, 1], dz: 0.35, yaw: P },
      { kind: 'panel', at: [12, 3], yaw: 0 },
      { kind: 'shelf', at: [2, 9], dz: 0.25, yaw: P }, { kind: 'shelf', at: [4, 9], dz: 0.25, yaw: P }, { kind: 'shelf', at: [8, 9], dz: 0.25, yaw: P },
      { kind: 'machine', at: [16, 11], yaw: 0 }, { kind: 'generator', at: [22, 11], yaw: 0 }, { kind: 'pipe', at: [12, 6], y: 2.6, yaw: H },
      { kind: 'lamp', at: [6, 2], y: 2.98 }, { kind: 'lamp', at: [18, 2], y: 2.98 }, { kind: 'lamp', at: [12, 7], y: 2.98 }, { kind: 'lamp', at: [6, 11], y: 2.98 }, { kind: 'lamp', at: [18, 11], y: 2.98 }
    ],
    objects: [
      { type: 'hatch', at: [1, 6], yaw: 0, to: 'oblispolkom', mark: 'B', name: 'Люк наверх', dest: 'Облисполком', id: 'bunker_hatch' },
      { type: 'cabinet', at: [10, 9], dz: 0.3, yaw: P, loot: 'office', id: 'bunker_cab1' },
      { type: 'safe', at: [11, 12], dx: 0.5, yaw: -H, lock: 50, name: 'Архив техпаспортов', loot: [['techpasport', 1, 1, 1], ['bkSci', 0.5, 1, 1]], id: 'bunker_archive' },
      { type: 'terminal', at: [12, 4], dz: 0.2, yaw: 0, term: 'planner', id: 'planner_term', name: 'Пульт АСУ «Плановик-77»' },
      { type: 'lever', at: [24, 10], dx: 0.5, yaw: -H, name: 'Рубильник ремонтного отсека', id: 'bunker_lever' }
    ],
    lights: [{ at: [6, 2], r: 9, c: [0.8, 1.2, 1.0] }, { at: [18, 2], r: 9, c: [0.8, 1.2, 1.0] }, { at: [12, 7], r: 7 }, { at: [6, 11], r: 6 }, { at: [18, 11], r: 7, c: [1.3, 0.5, 0.3] }],
    npcs: [{ id: 'planner', at: [12, 2], yaw: 0 }],
    spawns: [{ creature: 'druzhinnik', pts: [[4, 7], [20, 6]], n: 2, wander: 3, key: 'bunkerrobot' }, { creature: 'agregat', pts: [[15, 10], [19, 10]], n: 2, wander: 0, friendly: true, faction: 'robots', key: 'bunkeragregat' }]
  });

  room('orbita', {
    name: 'ДК «Орбита»', W: 22, H: 14, h: 4, amb: [0.2, 0.19, 0.2],
    plan: { rooms: [[1, 1, 20, 7], [1, 9, 9, 12, ','], [11, 9, 20, 12]], gaps: [[5, 8], [15, 8]], win: [[5, 0], [11, 0], [17, 0]], marks: { A: [2, 4] } },
    mat: { wall: 'plasterBlue', floor: 'parquet', floor2: 'linoleum', ceil: 'plasterWhite' },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'stage', at: [17, 4], yaw: -H }, { kind: 'seats', at: [6, 2], yaw: H }, { kind: 'seats', at: [6, 5], yaw: H }, { kind: 'seats', at: [10, 2], yaw: H }, { kind: 'seats', at: [10, 5], yaw: H },
      { kind: 'banner', at: [20, 2], dx: 0.94, yaw: -H }, { kind: 'banner', at: [20, 6], dx: 0.94, yaw: -H }, { kind: 'piano', at: [15, 1], dz: 0.5, yaw: P },
      { kind: 'table', at: [5, 10], yaw: 0 }, { kind: 'chair', at: [5, 11], yaw: 0 }, { kind: 'reel', at: [8, 9], dz: 0.4, yaw: P }, { kind: 'shelf', at: [1, 11], dx: 0.25, yaw: H },
      { kind: 'panel', at: [15, 9], dz: 0.4, yaw: P }, { kind: 'generator', at: [19, 11], yaw: 0 }, { kind: 'machine', at: [13, 11], yaw: 0 },
      { kind: 'lamp', at: [10, 4], y: 3.98 }, { kind: 'lamp', at: [5, 10], y: 3.98 }, { kind: 'lamp', at: [15, 10], y: 3.98 }
    ],
    objects: [
      exitW(4, 'orbita'),
      { type: 'switch', at: [20, 9], dx: 0.85, yaw: -H, name: 'Рубильник передатчика', id: 'orbita_switch' },
      { type: 'toolbox', at: [12, 9], yaw: P, loot: 'tools', id: 'orbita_tools' },
      { type: 'radio', at: [5, 10], dz: 0.3, y: 0.8, yaw: 0, name: 'Студийный приёмник' }
    ],
    lights: [{ at: [10, 4], r: 11, flicker: true }, { at: [5, 10], r: 6 }, { at: [15, 10], r: 6, c: [1.3, 0.9, 0.5] }],
    npcs: [{ id: 'levitan', at: [5, 11], yaw: 0 }]
  });

  room('tyuz', {
    name: 'Театр юного зрителя', W: 24, H: 16, h: 4, amb: [0.1, 0.1, 0.11],
    plan: { rooms: [[1, 1, 10, 5], [12, 1, 22, 12], [1, 7, 10, 14, ',']], gaps: [[11, 3], [5, 6], [11, 10]], win: [[4, 0], [8, 0]], marks: { A: [2, 3] } },
    mat: { wall: 'wallpaper', floor: 'parquet', floor2: 'wood', ceil: 'plasterWhite' }, tint: { wall: [90, 40, 50] },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'seats', at: [15, 3], yaw: 0 }, { kind: 'seats', at: [19, 3], yaw: 0 }, { kind: 'seats', at: [15, 5], yaw: 0 }, { kind: 'seats', at: [19, 5], yaw: 0 }, { kind: 'seats', at: [15, 7], yaw: 0 }, { kind: 'seats', at: [19, 7], yaw: 0 },
      { kind: 'stage', at: [17, 11], yaw: 0 }, { kind: 'rubble', at: [13, 9] }, { kind: 'rubble', at: [21, 9] }, { kind: 'rubble', at: [6, 2] },
      { kind: 'wardrobe', at: [3, 8], dz: 0.3, yaw: P }, { kind: 'wardrobe', at: [6, 8], dz: 0.3, yaw: P }, { kind: 'boxes', at: [8, 13] }, { kind: 'lamp', at: [17, 6], y: 3.98 }
    ],
    objects: [
      exitW(3, 'tyuz'),
      { type: 'crate', at: [2, 13], yaw: H, loot: 'med', id: 'tyuz_c1' }, { type: 'crate', at: [9, 9], yaw: 0, loot: 'ammo', id: 'tyuz_c2' },
      { type: 'corpse', at: [18, 9], yaw: 0.6, loot: [['filter', 1, 2, 3], ['b190', 0.6, 1, 1], ['talon', 1, 10, 30]], id: 'tyuz_corpse', name: 'Останки ликвидатора' },
      { type: 'note', at: [18, 9], dx: 0.8, note: 'n_tyuz', id: 'tyuz_note' }
    ],
    lights: [{ at: [17, 6], r: 8, c: [0.8, 0.9, 1.1], flicker: true }, { at: [5, 10], r: 5, c: [1.0, 0.5, 0.3], flicker: true }],
    spawns: [{ creature: 'hobot', pts: [[14, 4], [20, 4], [17, 8], [4, 10], [7, 12]], n: 5, wander: 4, key: 'tyuzhobot' }, { creature: 'hobotOzk', at: [17, 11], n: 1, wander: 2, key: 'tyuzhobot' }]
  });

  room('circus', {
    name: 'Цирк', W: 26, H: 20, h: 6, amb: [0.24, 0.2, 0.18],
    plan: { rooms: [[1, 1, 24, 4], [7, 6, 18, 16, ','], [1, 6, 5, 16], [20, 6, 24, 16]], gaps: [[12, 5], [6, 10], [19, 10]], marks: { A: [2, 2], B: [12, 11] } },
    mat: { wall: 'plasterCream', floor: 'parquet', floor2: 'soil', ceil: 'fabric' }, tint: { wall: [150, 60, 60], ceil: [120, 40, 40] },
    marks: { A: { yaw: H }, B: { yaw: 0 } },
    props: [
      { kind: 'seats', at: [3, 8], yaw: H }, { kind: 'seats', at: [3, 12], yaw: H }, { kind: 'seats', at: [22, 8], yaw: -H }, { kind: 'seats', at: [22, 12], yaw: -H },
      { kind: 'counter', at: [8, 2], yaw: 0 }, { kind: 'banner', at: [12, 1], dz: 0.06, yaw: P }, { kind: 'banner', at: [18, 1], dz: 0.06, yaw: P, tint: [200, 160, 40] },
      { kind: 'rack', at: [22, 15], yaw: 0 }, { kind: 'boxes', at: [21, 6] },
      { kind: 'lamp', at: [12, 11], y: 5.98 }, { kind: 'lamp', at: [6, 2], y: 5.98 }
    ],
    objects: [exitW(2, 'circus'), { type: 'crate', at: [24, 16], dx: 0.3, yaw: -H, loot: 'ammo', owner: 'coop', id: 'circus_crate' }],
    lights: [{ at: [12, 11], r: 14, c: [1.6, 1.4, 1.1] }, { at: [6, 2], r: 9 }],
    npcs: [{ id: 'gosha', at: [12, 3], yaw: 0 }]
  });

  room('hospital', {
    name: 'Инфекционная больница', W: 24, H: 14, h: 3.2, amb: [0.12, 0.13, 0.12],
    plan: { rooms: [[1, 6, 22, 7, ','], [1, 1, 6, 4], [8, 1, 13, 4], [15, 1, 22, 4], [1, 9, 10, 12, ','], [12, 9, 22, 12, ',']], gaps: [[3, 5], [10, 5], [18, 5], [5, 8], [16, 8]], win: [[3, 0], [10, 0], [18, 0]], marks: { A: [2, 6] } },
    mat: { wall: 'tiles', floor: 'linoleum', floor2: 'tiles', ceil: 'plasterWhite' }, tint: { wall: [150, 170, 160] },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'cot', at: [2, 2] }, { kind: 'cot', at: [4, 2] }, { kind: 'cot', at: [9, 2] }, { kind: 'cot', at: [11, 2] }, { kind: 'cot', at: [16, 2] }, { kind: 'cot', at: [19, 2] },
      { kind: 'bigtable', at: [5, 10], yaw: 0 }, { kind: 'sink', at: [9, 12], dz: 0.6, yaw: 0 }, { kind: 'machine', at: [2, 11], yaw: 0 },
      { kind: 'bunk', at: [14, 10] }, { kind: 'bunk', at: [17, 10] }, { kind: 'bunk', at: [20, 10] }, { kind: 'rubble', at: [12, 6] }, { kind: 'lamp', at: [11, 6], y: 3.18 }
    ],
    objects: [
      exitW(6, 'hospital'),
      { type: 'medbox', at: [6, 1], dz: 0.1, yaw: P, loot: 'med', id: 'hosp_m1' }, { type: 'medbox', at: [13, 1], dz: 0.1, yaw: P, loot: 'med', id: 'hosp_m2' },
      { type: 'cabinet', at: [22, 1], dx: 0.5, dz: 0.3, yaw: P, loot: [['filter', 1, 3, 4], ['b190', 0.8, 1, 2], ['kiodine', 0.6, 1, 2]], id: 'hosp_filters', name: 'Шкаф противогазов' },
      { type: 'safe', at: [10, 12], dx: 0.4, yaw: -H, lock: 40, loot: [['stimBig', 1, 1, 1], ['promedol', 1, 1, 2], ['talon', 1, 30, 60]], id: 'hosp_safe' },
      { type: 'corpse', at: [19, 11], yaw: 1.2, loot: 'med', id: 'hosp_corpse' }
    ],
    lights: [{ at: [11, 6], r: 8, c: [0.7, 1.0, 0.8], flicker: true }, { at: [5, 10], r: 6, c: [0.9, 1.0, 0.9], flicker: true }],
    spawns: [{ creature: 'hobot', pts: [[4, 3], [17, 3], [8, 10], [18, 11]], n: 4, wander: 4, key: 'hosphobot' }, { creature: 'hobotOzk', at: [11, 3], n: 1, wander: 3 }]
  });

  room('zalk3', {
    name: 'ЗАлК, электролизный цех №3', W: 30, H: 18, h: 6, amb: [0.2, 0.17, 0.15],
    plan: { rooms: [[1, 1, 28, 10, ','], [1, 12, 9, 16], [11, 12, 19, 16], [21, 12, 28, 16, ',']], gaps: [[5, 11], [15, 11], [24, 11]], win: [[6, 0], [12, 0], [18, 0], [24, 0]], marks: { A: [2, 5] } },
    mat: { wall: 'brickRed', floor: 'concrete', floor2: 'slag', ceil: 'metalGrey' },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'tank', at: [6, 3] }, { kind: 'tank', at: [9, 3] }, { kind: 'tank', at: [12, 3] }, { kind: 'tank', at: [15, 3] }, { kind: 'tank', at: [18, 3] }, { kind: 'tank', at: [21, 3] },
      { kind: 'tank', at: [6, 8] }, { kind: 'tank', at: [9, 8] }, { kind: 'tank', at: [12, 8] }, { kind: 'tank', at: [15, 8] }, { kind: 'tank', at: [18, 8] }, { kind: 'tank', at: [21, 8] },
      { kind: 'machine', at: [25, 3], yaw: 0 }, { kind: 'turbine', at: [25, 8] }, { kind: 'pipe', at: [14, 5], y: 4.5, yaw: H }, { kind: 'banner', at: [14, 1], dz: 0.06, yaw: P },
      { kind: 'table', at: [4, 14], yaw: 0 }, { kind: 'chair', at: [4, 15], yaw: 0 }, { kind: 'shelf', at: [9, 13], dx: 0.75, yaw: -H },
      { kind: 'bunk', at: [13, 13] }, { kind: 'bunk', at: [17, 13] }, { kind: 'rack', at: [24, 15] }, { kind: 'boxes', at: [27, 13] },
      { kind: 'lamp', at: [8, 5], y: 5.98 }, { kind: 'lamp', at: [20, 5], y: 5.98 }, { kind: 'lamp', at: [5, 14], y: 5.98 }, { kind: 'lamp', at: [25, 14], y: 5.98 }
    ],
    objects: [
      exitW(5, 'zalk3'),
      { type: 'locker', at: [11, 16], dz: 0.6, yaw: 0, loot: 'tools', owner: 'brigade', id: 'zalk_l1' }, { type: 'locker', at: [19, 16], dz: 0.6, yaw: 0, loot: 'tools', owner: 'brigade', id: 'zalk_l2' },
      { type: 'safe', at: [28, 16], dx: 0.4, dz: 0.4, yaw: -H, lock: 50, name: 'Сейф нарядов', loot: [['naryad', 1, 1, 1], ['talon', 1, 40, 90], ['stakhanovit', 1, 1, 2]], id: 'zalk_safe' },
      { type: 'bench', at: [1, 13], dx: 0.5, yaw: H }, { type: 'terminal', at: [9, 15], dx: 0.6, yaw: -H, term: 'zalk', id: 'zalk_term' }
    ],
    lights: [{ at: [8, 5], r: 12, c: [1.4, 0.8, 0.4] }, { at: [20, 5], r: 12, c: [1.4, 0.8, 0.4], flicker: true }, { at: [5, 14], r: 7 }, { at: [25, 14], r: 7, c: [1.3, 0.5, 0.3] }],
    npcs: [{ id: 'kuzmich', at: [5, 13], yaw: 0 }],
    spawns: [{ tpl: 'brigadir', pts: [[14, 14], [8, 6]], n: 2, wander: 3, faction: 'brigade', key: 'brigade' }, { creature: 'udarnik', pts: [[24, 13], [26, 15]], n: 2, wander: 2, key: 'zalkferal' }, { creature: 'udarnikRivet', at: [22, 14], n: 1, wander: 1, key: 'zalkferal' }]
  });

  room('vault12', {
    name: 'Убежище ГО №12 «Очередь»', W: 26, H: 16, h: 3, amb: [0.2, 0.22, 0.24],
    plan: { rooms: [[1, 1, 5, 4], [7, 1, 12, 4, ','], [1, 6, 24, 9], [1, 11, 11, 14], [13, 11, 24, 14, ',']], gaps: [[6, 2], [9, 5], [6, 10], [18, 10]], marks: { A: [2, 2] } },
    mat: { wall: 'concrete', floor: 'linoleum', floor2: 'concrete', ceil: 'concrete' }, tint: { wall: [140, 150, 160] }, dado: 'paintGreen', tint2: null,
    marks: { A: { yaw: H } },
    props: [
      { kind: 'turbine', at: [11, 2], yaw: 0 }, { kind: 'banner', at: [24, 7], dx: 0.94, yaw: -H }, { kind: 'poster', at: [12, 9], dz: 0.94, yaw: 0 },
      { kind: 'bunk', at: [2, 12] }, { kind: 'bunk', at: [5, 12] }, { kind: 'bunk', at: [8, 12] }, { kind: 'table', at: [9, 14], dz: 0.4, yaw: 0 },
      { kind: 'computer', at: [20, 11], dz: 0.35, yaw: P }, { kind: 'panel', at: [16, 14], dz: 0.6, yaw: 0 },
      { kind: 'lamp', at: [6, 7], y: 2.98 }, { kind: 'lamp', at: [18, 7], y: 2.98 }, { kind: 'lamp', at: [6, 12], y: 2.98 }, { kind: 'lamp', at: [18, 12], y: 2.98 }
    ],
    objects: [
      { type: 'door', at: [1, 2], dx: 0.05, yaw: H, to: 'ext', mark: 'door_vault12', name: 'Выход', dest: 'Наружу' },
      { type: 'terminal', at: [22, 11], dz: 0.2, yaw: P, term: 'vault12', id: 'v12_term', name: 'Табло очереди' },
      { type: 'locker', at: [11, 11], dx: 0.6, yaw: -H, loot: 'home', id: 'v12_l1' },
      { type: 'note', at: [9, 14], dz: 0.1, y: 0.79, note: 'n_queue', id: 'v12_note' }
    ],
    lights: [{ at: [6, 7], r: 9, c: [1.0, 1.1, 1.2] }, { at: [18, 7], r: 9, c: [1.0, 1.1, 1.2] }, { at: [6, 12], r: 6 }, { at: [18, 12], r: 7, c: [0.8, 1.2, 0.9] }],
    npcs: [{ id: 'nomerok', at: [19, 12], yaw: P }],
    spawns: [{ tpl: 'villager', pts: [[3, 7], [5, 7], [7, 7], [9, 7], [11, 7], [13, 7], [15, 7]], n: 7, wander: 0, faction: 'vozn', yaw: -H, key: 'queue', name: 'Житель убежища' }]
  });

  room('vault3', {
    name: 'Убежище ГО №3 «Красная вода»', W: 24, H: 16, h: 3, amb: [0.24, 0.16, 0.14],
    plan: { rooms: [[1, 1, 6, 4, ','], [8, 1, 22, 6], [1, 8, 10, 14, ','], [12, 8, 22, 14]], gaps: [[7, 2], [5, 7], [17, 7]], marks: { A: [2, 2] } },
    mat: { wall: 'concrete', floor: 'concrete', floor2: 'tiles', ceil: 'concrete' }, tint: { wall: [150, 120, 110] },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'machine', at: [3, 10], yaw: 0, tint: [150, 70, 60] }, { kind: 'tank', at: [6, 10] }, { kind: 'tank', at: [8, 12] }, { kind: 'pipe', at: [5, 13], y: 2.4, yaw: H },
      { kind: 'bigtable', at: [15, 3], yaw: 0 }, { kind: 'chair', at: [14, 4], yaw: 0 }, { kind: 'chair', at: [16, 4], yaw: 0 }, { kind: 'banner', at: [22, 3], dx: 0.94, yaw: -H, tint: [150, 40, 40] },
      { kind: 'bunk', at: [13, 10] }, { kind: 'bunk', at: [16, 10] }, { kind: 'bunk', at: [19, 10] }, { kind: 'bunk', at: [13, 13] },
      { kind: 'lamp', at: [4, 2], y: 2.98 }, { kind: 'lamp', at: [15, 3], y: 2.98 }, { kind: 'lamp', at: [5, 11], y: 2.98 }, { kind: 'lamp', at: [17, 11], y: 2.98 }
    ],
    objects: [
      { type: 'door', at: [1, 2], dx: 0.05, yaw: H, to: 'ext', mark: 'door_vault3', name: 'Выход', dest: 'Наружу' },
      { type: 'locker', at: [22, 8], dx: 0.6, dz: 0.3, yaw: -H, loot: [['b190', 1, 1, 2], ['filter', 0.5, 1, 1]], owner: 'hobots', id: 'v3_l1' },
      { type: 'terminal', at: [10, 8], dx: 0.6, dz: 0.3, yaw: -H, term: 'vault3', id: 'v3_term' },
      { type: 'note', at: [15, 3], dz: 0.3, y: 0.79, note: 'n_redwater', id: 'v3_note' }
    ],
    lights: [{ at: [4, 2], r: 6, c: [1.4, 0.6, 0.5] }, { at: [15, 3], r: 9, c: [1.3, 0.8, 0.6] }, { at: [5, 11], r: 7, c: [1.4, 0.5, 0.4], flicker: true }, { at: [17, 11], r: 8 }],
    npcs: [{ id: 'protasov', at: [15, 2], yaw: P }],
    spawns: [{ tpl: 'hobotFriend', pts: [[10, 4], [19, 5], [4, 12], [14, 12], [20, 13]], n: 5, wander: 3, faction: 'hobots', key: 'redwater' }]
  });

  room('shpana_base', {
    name: 'Тир в Парке Победы', W: 16, H: 10, amb: [0.2, 0.18, 0.16],
    plan: { rooms: [[1, 1, 14, 4], [1, 6, 9, 8, ','], [11, 6, 14, 8]], gaps: [[5, 5], [12, 5]], marks: { A: [2, 2] } },
    mat: { wall: 'corrugated', floor: 'concrete', floor2: 'linoleum', ceil: 'metalGrey' },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'counter', at: [4, 3], yaw: P }, { kind: 'poster', at: [13, 1], dz: 0.06, yaw: P, tint: [200, 60, 50] }, { kind: 'poster', at: [11, 1], dz: 0.06, yaw: P, tint: [60, 60, 200] },
      { kind: 'cot', at: [2, 7] }, { kind: 'cot', at: [5, 7] }, { kind: 'cardtable', at: [8, 7], yaw: 0 }, { kind: 'sofa', at: [13, 8], dz: 0.3, yaw: 0 },
      { kind: 'lamp', at: [7, 2], y: 2.78 }, { kind: 'lamp', at: [12, 7], y: 2.78 }
    ],
    objects: [
      exitW(2, 'shpana_base'),
      { type: 'safe', at: [14, 6], dx: 0.4, dz: 0.4, yaw: -H, lock: 45, owner: 'shpana', loot: [['talon', 1, 120, 200], ['vodka', 1, 1, 2], ['tt', 0.5, 1, 1]], id: 'girya_safe', name: 'Общак' },
      { type: 'crate', at: [9, 6], yaw: 0, loot: 'junk', owner: 'shpana', id: 'shpana_crate' },
      { type: 'note', at: [13, 6], dz: 0.6, note: 'n_receipt', id: 'girya_receipt' }
    ],
    lights: [{ at: [7, 2], r: 8 }, { at: [12, 7], r: 6, c: [1.4, 0.9, 0.5] }],
    npcs: [{ id: 'girya', at: [12, 7], yaw: 0 }],
    spawns: [{ tpl: 'shpana', pts: [[6, 2], [9, 3], [4, 7]], n: 3, wander: 1, faction: 'shpana', hostile: false, key: 'shpanabase' }]
  });

  room('kolkhoz', {
    name: 'Правление колхоза', W: 16, H: 10, amb: [0.26, 0.24, 0.2],
    plan: { rooms: [[1, 1, 9, 5], [11, 1, 14, 8, ','], [1, 7, 9, 8, ',']], gaps: [[10, 3], [5, 6]], win: [[4, 0], [7, 0]], marks: { A: [2, 3] } },
    mat: { wall: 'plasterCream', floor: 'wood', floor2: 'concrete' },
    marks: { A: { yaw: H } },
    props: [{ kind: 'banner', at: [9, 3], dx: 0.94, yaw: -H }, { kind: 'poster', at: [3, 5], dz: 0.94, yaw: 0 }, { kind: 'chair', at: [6, 2], yaw: P }, { kind: 'sacks', at: [12, 6] }, { kind: 'sacks', at: [13, 2] }, { kind: 'boxes', at: [3, 8] }, { kind: 'lamp', at: [5, 3], y: 2.78 }],
    objects: [exitW(3, 'kolkhoz'), { type: 'desk', at: [6, 3], yaw: 0, loot: 'office', owner: 'vozn', id: 'kol_desk' }, { type: 'crate', at: [7, 8], yaw: 0, loot: [['potato', 1, 3, 6], ['seeds', 1, 2, 4], ['apricot', 0.6, 2, 3]], owner: 'vozn', id: 'kol_crate' }, { type: 'radio', at: [8, 1], dz: 0.3, y: 0.8, yaw: P }],
    lights: [{ at: [5, 3], r: 8 }, { at: [12, 4], r: 5 }],
    npcs: [{ id: 'bulbenko', at: [6, 2], yaw: P }]
  });

  room('ptichnik', {
    name: 'Птичник №2', W: 30, H: 10, amb: [0.18, 0.16, 0.12],
    plan: { rooms: [[1, 1, 28, 8, ',']], marks: { A: [2, 4] } },
    mat: { wall: 'brickWhite', floor: 'concrete', floor2: 'soil', ceil: 'wood' },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'rack', at: [6, 1], dz: 0.3, yaw: P }, { kind: 'rack', at: [10, 1], dz: 0.3, yaw: P }, { kind: 'rack', at: [14, 1], dz: 0.3, yaw: P }, { kind: 'rack', at: [18, 1], dz: 0.3, yaw: P },
      { kind: 'rack', at: [6, 8], dz: 0.7, yaw: 0 }, { kind: 'rack', at: [10, 8], dz: 0.7, yaw: 0 }, { kind: 'rack', at: [14, 8], dz: 0.7, yaw: 0 }, { kind: 'rack', at: [18, 8], dz: 0.7, yaw: 0 },
      { kind: 'sacks', at: [24, 2] }, { kind: 'sacks', at: [26, 6] }, { kind: 'lamp', at: [12, 4], y: 2.78 }
    ],
    objects: [exitW(4, 'ptichnik'), { type: 'crate', at: [27, 7], yaw: 0, loot: [['egg', 1, 4, 8], ['broilerRaw', 0.6, 1, 3]], id: 'pt_crate' }, { type: 'note', at: [25, 4], note: 'n_broiler', id: 'pt_note' }],
    lights: [{ at: [12, 4], r: 10, c: [1.2, 1.0, 0.6], flicker: true }],
    spawns: [{ creature: 'broiler', pts: [[8, 4], [12, 5], [16, 3], [20, 5], [22, 4]], n: 5, wander: 6, key: 'ptichnik' }, { creature: 'rooster', at: [25, 4], n: 1, wander: 4, key: 'ptichnik' }]
  });

  room('lager', {
    name: 'Корпус пионерлагеря', W: 20, H: 12, amb: [0.26, 0.26, 0.24],
    plan: { rooms: [[1, 1, 18, 5], [1, 7, 8, 10], [10, 7, 18, 10, ',']], gaps: [[4, 6], [14, 6]], win: [[4, 0], [9, 0], [14, 0], [19, 3]], marks: { A: [2, 3] } },
    mat: { wall: 'plasterBlue', floor: 'wood', floor2: 'linoleum' },
    marks: { A: { yaw: H } },
    props: [
      { kind: 'bigtable', at: [7, 2], yaw: 0 }, { kind: 'bigtable', at: [12, 2], yaw: 0 }, { kind: 'stool', at: [6, 3] }, { kind: 'stool', at: [8, 3] }, { kind: 'stool', at: [12, 3] },
      { kind: 'banner', at: [18, 3], dx: 0.94, yaw: -H }, { kind: 'poster', at: [3, 5], dz: 0.94, yaw: 0, tint: [200, 50, 40] },
      { kind: 'bunk', at: [2, 8] }, { kind: 'bunk', at: [5, 8] }, { kind: 'bunk', at: [2, 10], dz: 0.2 }, { kind: 'piano', at: [17, 10], dz: 0.5, yaw: 0 }, { kind: 'shelf', at: [11, 7], dz: 0.25, yaw: P },
      { kind: 'lamp', at: [9, 3], y: 2.78 }, { kind: 'lamp', at: [14, 8], y: 2.78 }
    ],
    objects: [
      exitW(3, 'lager'),
      { type: 'item', item: 'tie', n: 1, at: [7, 9], id: 'tie_1' }, { type: 'crate', at: [13, 10], dz: 0.6, yaw: 0, loot: 'food', id: 'lager_c' },
      { type: 'radio', at: [12, 8], dz: 0.3, y: 0.8, yaw: P, name: 'Горн-радиоточка' }, { type: 'note', at: [15, 9], note: 'n_zarnitsa', id: 'lager_note' }
    ],
    lights: [{ at: [9, 3], r: 9 }, { at: [14, 8], r: 6 }],
    spawns: [{ tpl: 'pioneer', pts: [[6, 2], [13, 2]], n: 2, wander: 3, faction: 'vozn' }]
  });

  room('rybartel', {
    name: 'Хата рыбаков', W: 10, H: 8, amb: [0.24, 0.22, 0.18],
    plan: { rooms: [[1, 1, 8, 6]], win: [[4, 0], [9, 3]], marks: { A: [2, 3] } },
    mat: { wall: 'wood', floor: 'wood' }, tint: { wall: [120, 104, 86] },
    marks: { A: { yaw: H } },
    props: [{ kind: 'table', at: [5, 3], yaw: 0 }, { kind: 'stool', at: [4, 3] }, { kind: 'stool', at: [6, 3] }, { kind: 'cot', at: [2, 6], dz: 0.1 }, { kind: 'sacks', at: [8, 6] }, { kind: 'stove', at: [8, 1], dz: 0.5, yaw: P }, { kind: 'lamp', at: [5, 3], y: 2.78 }],
    objects: [exitW(3, 'rybartel'), { type: 'crate', at: [7, 6], yaw: 0, loot: 'food', owner: 'vozn', id: 'ryb_crate' }, { type: 'bed', at: [5, 6], yaw: 0, name: 'Топчан' }],
    lights: [{ at: [5, 3], r: 7, c: [1.5, 1.0, 0.55], flicker: true }],
    npcs: [{ id: 'panas', at: [5, 2], yaw: P }]
  });

  room('nii_cave', {
    name: 'Змиева пещера · НИИ «Хортица»', W: 30, H: 20, h: 3.2, amb: [0.12, 0.13, 0.15],
    plan: { rooms: [[1, 8, 10, 11, ','], [12, 8, 28, 11], [12, 1, 19, 6], [21, 1, 28, 6, ','], [12, 13, 19, 18, ','], [21, 13, 28, 18]], gaps: [[11, 9], [15, 7], [25, 7], [15, 12], [25, 12]], marks: { A: [2, 9] } },
    mat: { wall: 'granite', floor: 'soil', floor2: 'gravel', ceil: 'granite' },
    zones: [{ c0: 12, c1: 28, r0: 0, r1: 19, wall: 'tiles', floor: 'linoleum', ceil: 'concrete' }],
    marks: { A: { yaw: H } },
    props: [
      { kind: 'rubble', at: [4, 10] }, { kind: 'rubble', at: [8, 8] },
      { kind: 'computer', at: [13, 1], dz: 0.35, yaw: P }, { kind: 'reel', at: [15, 1], dz: 0.4, yaw: P }, { kind: 'bigtable', at: [16, 4], yaw: 0 },
      { kind: 'machine', at: [24, 3], yaw: 0, tint: [100, 140, 120] }, { kind: 'tank', at: [27, 2] }, { kind: 'tank', at: [27, 5] },
      { kind: 'cot', at: [14, 15] }, { kind: 'cot', at: [17, 15] }, { kind: 'sink', at: [19, 18], dz: 0.6, yaw: 0 },
      { kind: 'generator', at: [24, 16], yaw: 0 }, { kind: 'panel', at: [27, 14], dz: 0.4, yaw: P }, { kind: 'pipe', at: [20, 9], y: 2.6, yaw: H },
      { kind: 'lamp', at: [16, 3], y: 3.18 }, { kind: 'lamp', at: [24, 3], y: 3.18 }, { kind: 'lamp', at: [20, 10], y: 3.18 }, { kind: 'lamp', at: [16, 15], y: 3.18 }, { kind: 'lamp', at: [24, 15], y: 3.18 }
    ],
    objects: [
      { type: 'door', at: [1, 9], dx: 0.05, yaw: H, to: 'ext', mark: 'door_nii_cave', name: 'Выход из пещеры', dest: 'Наружу' },
      { type: 'terminal', at: [19, 1], dz: 0.3, yaw: P, lock: 55, term: 'nii', id: 'nii_term' },
      { type: 'medbox', at: [12, 16], dx: 0.1, yaw: H, loot: 'med', id: 'nii_med' },
      { type: 'safe', at: [28, 1], dx: 0.4, dz: 0.4, yaw: -H, lock: 70, loot: [['stimBig', 1, 1, 2], ['nootrop', 1, 1, 2], ['giper', 0.4, 1, 1], ['accu', 1, 4, 10]], id: 'nii_safe', name: 'Сейф лаборатории' },
      { type: 'note', at: [16, 4], dz: 0.3, y: 0.79, note: 'n_stakhanovit', id: 'nii_note' }
    ],
    lights: [{ at: [5, 9], r: 5, c: [0.6, 0.7, 0.9] }, { at: [16, 3], r: 8, c: [0.8, 1.2, 1.0] }, { at: [24, 3], r: 8, c: [0.8, 1.2, 1.0], flicker: true }, { at: [20, 10], r: 7 }, { at: [16, 15], r: 7 }, { at: [24, 15], r: 7 }],
    npcs: [{ id: 'zarubin', at: [16, 16], yaw: 0 }],
    spawns: [{ creature: 'hobotOzk', pts: [[6, 9], [22, 9]], n: 2, wander: 4, key: 'niihobot' }, { creature: 'agregat', at: [24, 13], n: 1, wander: 3, faction: 'beasts', key: 'niirobot' }, { creature: 'martyn', at: [3, 10], n: 1, wander: 3 }]
  });
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
