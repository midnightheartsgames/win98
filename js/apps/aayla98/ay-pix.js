(function (A) {
  'use strict';
  const Pix = A.Pix = {};

  const HEADS = {
    twilek: {
      down: ['......oooo......', '.....osssso.....', '....osssssso....', '....otttttto....', '....osssssso....', '....osesseso....', '....osssssso....', '.....osSSso.....', '......osso......', '......oSSo......'],
      up: ['......oooo......', '.....osssso.....', '....osssssso....', '....otttttto....', '....osssssso....', '....osssssso....', '....osssssso....', '.....osssso.....', '......osso......', '......oSSo......'],
      right: ['......oooo......', '.....osssso.....', '.....ossssso....', '.....otttttto...', '.....osssssso...', '.....osssseso...', '.....ossssssso..', '.....osssSso....', '......osso......', '......oSSo......']
    },
    kiffar: {
      down: ['.....oooooo.....', '....ohhhhhho....', '...ohhsssshho...', '...ohssssssho...', '...ohsessesho...', '...ohmmmmmmho...', '...ohssssssho...', '....hosSSsoh....', '....h.osso.h....', '......oSSo......'],
      up: ['.....oooooo.....', '....ohhhhhho....', '...ohhhhhhhho...', '...ohhhhhhhho...', '...ohhhhhhhho...', '...ohhhhhhhho...', '...ohhhhhhhho...', '....ohhhhhho....', '....h.osso.h....', '......oSSo......'],
      right: ['.....oooooo.....', '....ohhhhhho....', '...ohhhhhhsso...', '...ohhhhhssso...', '...ohhhhssseso..', '...ohhhhmmmmmo..', '...ohhhhsssssso.', '...ohhh.osSso...', '....hh..osso....', '......oSSo......']
    }
  };

  const TORSO_FRONT = ['....oCccccCo....', '...oCccccccCo...', '...oCccccccCo...', '...oCcttttcCo...', '...osccccccso...', '....oCccccCo....', '....oCccccCo....'];
  const TORSO_SIDE = ['.....oCcccCo....', '.....oCcccco....', '.....oCcCCco....', '.....otttCto....', '.....occcsco....', '.....oCcccCo....', '.....oCcccCo....'];
  const LEGS = {
    front: ['.....oCooCo.....', '.....oCo.oCo....', '.....oCo.oCo....', '.....oCo.oCo....', '.....obo.obo....', '....obbo.obbo...', '....oooo.oooo...'],
    frontStep: ['.....oCooCo.....', '.....oCo.oCo....', '.....oCo.obo....', '.....oCo.obbo...', '.....obo.oooo...', '....obbo........', '....oooo........'],
    side: ['......oCCo......', '......oCCo......', '......oCCo......', '......oCCo......', '......obbo......', '......obbbo.....', '......ooooo.....'],
    sideStep: ['.....oCooCo.....', '....oCo..oCo....', '....oCo..oCo....', '...oCo....oCo...', '...obo....obo...', '..obbo....obbo..', '..oooo....oooo..']
  };
  const LEKKU = {
    down: { front: [[2, 5, 10]], back: [[10, 5, 8]] },
    up: { front: [[3, 7, 8], [9, 7, 8]], back: [] },
    right: { front: [], back: [[3, 4, 11]] }
  };

  Pix.LOOKS = {
    aayla_padawan: { who: 'aayla', kind: 'twilek', pal: { o: '#1a1018', s: '#6fa8dc', S: '#4f86c0', c: '#8c7a62', C: '#6a5a44', t: '#c9b48a', b: '#3a2a1e', e: '#2a1a10' }, blade: '#e83a2a' },
    twilek_trader: { kind: 'twilek', pal: { o: '#1a1018', s: '#d8885a', S: '#b0663e', c: '#6a3a2a', C: '#4a281c', t: '#d8b060', b: '#2a1a12', e: '#2a1a10' } },
    twilek_woman: { kind: 'twilek', pal: { o: '#1a1018', s: '#c87a9a', S: '#a05a7a', c: '#5a6a4a', C: '#3e4a32', t: '#c8a060', b: '#2a1a12', e: '#2a1a10' } },
    twilek_green: { kind: 'twilek', pal: { o: '#1a1018', s: '#6aa060', S: '#4a7a44', c: '#3a3430', C: '#26221e', t: '#8a6a40', b: '#1a1410', e: '#1a1010' } },
    twilek_child: { kind: 'twilek', pal: { o: '#1a1018', s: '#8ab8e8', S: '#6a98c8', c: '#8a7a5a', C: '#6a5a40', t: '#c8b080', b: '#3a2a1e', e: '#2a1a10' } },
    twilek_guard: { kind: 'twilek', pal: { o: '#1a1018', s: '#5a8ab8', S: '#3e6a98', c: '#3a4a6a', C: '#26324a', t: '#c8a050', b: '#1a1410', e: '#1a1010' } },
    vos_early: { who: 'vos', kind: 'kiffar', pal: { o: '#1a1018', s: '#b0825a', S: '#8a6040', c: '#3a3434', C: '#2a2424', t: '#6a5a4a', b: '#1a1410', e: '#1a1010', h: '#1c1410', m: '#e0c040' }, blade: '#3ad04a' },
    asante_guard: { who: 'asante', kind: 'kiffar', pal: { o: '#1a1018', s: '#b8906a', S: '#94704e', c: '#4a4a5a', C: '#34343e', t: '#a08a4a', b: '#1a1410', e: '#1a1010', h: '#1c1410', m: '#e0c040' } },
    twilek_worker: { kind: 'twilek', pal: { o: '#1a1018', s: '#8a9a80', S: '#6a7a60', c: '#5a4a3a', C: '#3e3428', t: '#7a6a50', b: '#2a1e14', e: '#2a2020' } }
  };

  Pix.DIRS = ['down', 'up', 'right', 'left'];
  Pix.FIELD_FRAMES = ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3'];
  Pix.FIELD = { w: 16, h: 24 };
  Pix.GRIDS = { HEADS, TORSO_FRONT, TORSO_SIDE, LEGS };

  const paint = (R, rows, pal, dx, dy) => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.') continue;
        const col = pal[ch];
        if (!col) throw new Error('no colour for ' + ch);
        R.set(x + dx, y + dy, col);
      }
    });
  };

  const lekRun = (R, pal, x, y0, len, dx) => {
    for (let i = 0; i < len; i++) {
      const y = y0 + i, sx = x + (i > 5 ? dx : 0);
      R.set(sx, y, pal.o);
      R.set(sx + 1, y, pal.S);
      R.set(sx + 2, y, i < 2 ? pal.s : pal.S);
      R.set(sx + 3, y, pal.o);
    }
    const tip = y0 + len, sx = x + (len > 5 ? dx : 0);
    R.set(sx + 1, tip, pal.o);
    R.set(sx + 2, tip, pal.o);
  };

  Pix.field = (lookId, dir, frame) => {
    if (Pix.FIELD_BEASTS[lookId]) return Pix.fieldBeast(lookId, dir, frame);
    const look = Pix.LOOKS[lookId];
    const flip = dir === 'left', d = flip ? 'right' : dir, side = d === 'right';
    const R = new A.Art.Raster(16, 24), pal = look.pal;
    const step = frame === 'walk1' ? 1 : frame === 'walk3' ? 2 : 0;
    const bob = frame === 'idle1' ? 1 : 0;
    const sway = step === 1 ? 1 : step === 2 ? -1 : frame === 'idle1' ? 1 : 0;
    const lek = look.kind === 'twilek' ? LEKKU[d] : null;
    if (lek) lek.back.forEach(r => lekRun(R, pal, r[0], r[1] + bob, r[2], sway));
    let legs = side ? (step ? LEGS.sideStep : LEGS.side) : step ? LEGS.frontStep : LEGS.front;
    if (!side && step === 2) legs = legs.map(row => row.split('').reverse().join(''));
    paint(R, legs, pal, 0, 17);
    paint(R, side ? TORSO_SIDE : TORSO_FRONT, pal, 0, 10 + bob);
    paint(R, HEADS[look.kind][d], pal, 0, bob);
    if (lek) lek.front.forEach(r => lekRun(R, pal, r[0], r[1] + bob, r[2], sway));
    if (!flip) return R;
    const M = new A.Art.Raster(16, 24);
    for (let y = 0; y < 24; y++) for (let x = 0; x < 16; x++) {
      const i = (y * 16 + x) * 4, j = (y * 16 + 15 - x) * 4;
      M.data[j] = R.data[i];
      M.data[j + 1] = R.data[i + 1];
      M.data[j + 2] = R.data[i + 2];
      M.data[j + 3] = R.data[i + 3];
    }
    return M;
  };

  const base = { hip: [26, 40], neck: [25, 22], head: [24, 14], fknee: [22, 50], ffoot: [20, 61], bknee: [30, 50], bfoot: [32, 61], fel: [19, 30], fhand: [15, 35], bel: [30, 30], bhand: [29, 37], saber: -120, hand: 'f', lek: 0 };
  const pose = o => Object.assign({}, base, o);
  Pix.POSES = {
    idle0: pose({}),
    idle1: pose({ hip: [26, 41], neck: [25, 23], head: [24, 15], fel: [19, 31], fhand: [15, 36], bel: [30, 31], bhand: [29, 38], lek: 1 }),
    attack0: pose({ neck: [28, 23], head: [28, 15], fel: [27, 22], fhand: [32, 16], saber: -35, lek: 2 }),
    attack1: pose({ hip: [25, 41], neck: [20, 24], head: [17, 17], fknee: [17, 50], ffoot: [11, 61], bknee: [32, 52], bfoot: [39, 61], fel: [14, 27], fhand: [8, 31], bel: [27, 31], bhand: [25, 37], saber: 165, lek: -2 }),
    attack2: pose({ hip: [23, 41], neck: [19, 24], head: [17, 16], fknee: [15, 50], ffoot: [10, 61], bknee: [29, 52], bfoot: [35, 61], fel: [14, 33], fhand: [11, 42], saber: 120, lek: -1 }),
    attack3: pose({}),
    force0: pose({ fel: [15, 26], fhand: [8, 27], bel: [31, 30], bhand: [32, 36], saber: -80, hand: 'b', lek: 1 }),
    force1: pose({ hip: [25, 41], neck: [22, 23], head: [20, 15], fel: [13, 25], fhand: [5, 25], bel: [30, 30], bhand: [31, 36], saber: -80, hand: 'b', lek: 2 }),
    force2: pose({ fel: [15, 26], fhand: [8, 27], bel: [31, 30], bhand: [32, 36], saber: -80, hand: 'b', lek: 1 }),
    hurt: pose({ hip: [28, 40], neck: [30, 23], head: [32, 16], fel: [26, 30], fhand: [22, 37], bel: [34, 30], bhand: [37, 35], saber: -20, lek: 3 }),
    ko: pose({ hip: [28, 58], neck: [15, 57], head: [9, 56], fknee: [35, 58], ffoot: [41, 60], bknee: [36, 60], bfoot: [42, 61], fel: [15, 60], fhand: [21, 61], bel: [19, 61], bhand: [25, 61], saber: 0, lek: 4, down: true })
  };
  Pix.BATTLE_FRAMES = Object.keys(Pix.POSES);
  Pix.BATTLE = { w: 48, h: 64 };

  Pix.saberLine = (p, len) => {
    const hand = p.hand === 'b' ? p.bhand : p.fhand, a = p.saber * Math.PI / 180;
    return [hand, [hand[0] + Math.cos(a) * len, hand[1] + Math.sin(a) * len]];
  };

  const WEAPONS = {
    saber: { len: 5, width: 2, col: '#b0b0b8' },
    vibro: { len: 11, width: 1.5, col: '#c8ccd4', hilt: '#5a4a3a' },
    blaster: { len: 7, width: 2.6, col: '#34343c', tip: '#9a9aa4', grip: '#22222a' }
  };
  Pix.WEAPONS = WEAPONS;

  Pix.weapon = (R, p, kind, frame) => {
    const w = WEAPONS[kind], hand = p.hand === 'b' ? p.bhand : p.fhand;
    const deg = kind === 'blaster' ? (frame.startsWith('attack') ? 180 : 125) : p.saber, a = deg * Math.PI / 180;
    const end = [hand[0] + Math.cos(a) * w.len, hand[1] + Math.sin(a) * w.len];
    if (w.hilt) R.curve(hand, hand, [hand[0] - Math.cos(a) * 3, hand[1] - Math.sin(a) * 3], 2, w.hilt);
    if (w.grip) R.rect(hand[0] - 1, hand[1], 2, 3, w.grip);
    R.curve(hand, [(hand[0] + end[0]) / 2, (hand[1] + end[1]) / 2], end, w.width, w.col);
    if (w.tip) R.set(end[0], end[1], w.tip);
  };

  Pix.battle = (lookId, frame, weapon) => {
    const look = Pix.LOOKS[lookId], pal = look.pal, p = Pix.POSES[frame];
    const R = new A.Art.Raster(48, 64);
    const limb = (a, b2, col) => R.curve(a, [(a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2], b2, 4, col);
    const sh = [p.neck[0] + (p.down ? 2 : 0), p.neck[1] + 2];
    limb(sh, p.bel, pal.C);
    limb(p.bel, p.bhand, pal.C);
    R.ellipse(p.bhand[0], p.bhand[1], 2, 2, pal.s);
    limb(p.hip, p.bknee, pal.C);
    limb(p.bknee, p.bfoot, pal.C);
    R.rect(p.bfoot[0] - 3, p.bfoot[1] - 2, 5, 3, pal.b);
    if (look.kind === 'twilek') {
      const back = p.down ? [p.head[0] + 2, p.head[1] - 6] : [p.head[0] + 5, p.head[1] + 1];
      const tip = p.down ? [p.head[0] + 14, p.head[1] - 4] : [p.head[0] + 9 + p.lek, p.head[1] + 22];
      R.curve(back, [back[0] + 5, back[1] + 8], tip, t => 2.6 * (1 - t * 0.5), pal.S);
    }
    if (look.kind === 'kiffar' && !p.down) for (let i = 0; i < 4; i++) R.curve([p.head[0] + 2 + i, p.head[1] - 5 + i * 2], [p.head[0] + 6 + i, p.head[1] + 2 + i], [p.head[0] + 6 + i + p.lek * 0.5, p.head[1] + 12 + i], 1, pal.h);
    const dx = p.neck[0] - p.hip[0], dy = p.neck[1] - p.hip[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    R.poly([[p.hip[0] + nx * 5, p.hip[1] + ny * 5], [p.hip[0] - nx * 5, p.hip[1] - ny * 5], [p.neck[0] - nx * 6, p.neck[1] - ny * 6], [p.neck[0] + nx * 6, p.neck[1] + ny * 6]], pal.c);
    const belt = [p.hip[0] + dx * 0.15, p.hip[1] + dy * 0.15];
    R.curve([belt[0] + nx * 5, belt[1] + ny * 5], belt, [belt[0] - nx * 5, belt[1] - ny * 5], 2, pal.t);
    limb(p.hip, p.fknee, pal.c);
    limb(p.fknee, p.ffoot, pal.c);
    R.rect(p.ffoot[0] - 4, p.ffoot[1] - 2, 6, 3, pal.b);
    R.ellipse(p.neck[0] - 1, p.neck[1] - 3, 2, 3, pal.s);
    R.ellipse(p.head[0], p.head[1], 6, 7, pal.s);
    if (look.kind === 'twilek') R.rect(p.head[0] - 6, p.head[1] - 4, 12, 2, pal.t);
    if (look.kind === 'kiffar') {
      R.ellipse(p.head[0] + 1, p.head[1] - 4, 6, 4, pal.h);
      if (!p.down) R.rect(p.head[0] - 6, p.head[1] + 1, 7, 1, pal.m);
    }
    if (!p.down) R.set(p.head[0] - 3, p.head[1] - 1, pal.e);
    limb(sh, p.fel, pal.C);
    limb(p.fel, p.fhand, pal.C);
    R.ellipse(p.fhand[0], p.fhand[1], 2, 2, pal.s);
    Pix.weapon(R, p, weapon || 'saber', frame);
    R.outline(pal.o);
    return R;
  };

  Pix.BEASTS = {
    spider: { w: 32, h: 24, s: 1, pal: { shell: '#2a1e34', hi: '#4c3c60', leg: '#1c1424', far: '#140e1a', glow: '#5ad8ff', eye: '#c8f6ff', fang: '#d8d0c0' } },
    giant: { w: 80, h: 60, s: 2.5, pal: { shell: '#241a30', hi: '#48385c', leg: '#1a1222', far: '#100a16', glow: '#7ae0ff', eye: '#e8fcff', fang: '#e4d8c0' } }
  };
  const BEAST_POSES = { idle0: [0, 0, 0], idle1: [0, -0.6, 1], attack0: [-2, -2.5, 0], attack1: [5, -1, 1], attack2: [3, 0, 0], hurt: [-3, 0.5, 1], ko: [0, 0, 0] };
  Pix.BEAST_FRAMES = Object.keys(BEAST_POSES);

  Pix.beast = (kind, frame) => {
    const B = Pix.BEASTS[kind], s = B.s, pal = B.pal, R = new A.Art.Raster(B.w, B.h);
    const ground = B.h - 2, [dx, dy, step] = BEAST_POSES[frame] || BEAST_POSES.idle0;
    const seg = (a, b2, w, col) => R.curve(a, [(a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2], b2, w, col);
    const lw = Math.max(1, 1.1 * s), dot = Math.max(1, s * 0.8);
    if (frame === 'ko') {
      const cx = B.w * 0.5, cy = ground - 3 * s;
      for (let i = 0; i < 4; i++) {
        const jx = cx + (i - 1.5) * 3 * s, side = i < 2 ? -1 : 1;
        seg([jx, cy - 2 * s], [jx + side * 2 * s, cy - 6 * s], lw, pal.leg);
        seg([jx + side * 2 * s, cy - 6 * s], [jx + side * s, cy - 8 * s], lw, pal.leg);
      }
      R.ellipse(cx - 3 * s, cy, 7 * s, 3.5 * s, pal.shell);
      R.ellipse(cx + 5 * s, cy + 0.5 * s, 4 * s, 2.5 * s, pal.shell);
      R.rect(cx - 6 * s, cy - s, 6 * s, Math.max(1, s * 0.6), pal.hi);
      R.outline('#0a0610');
      return R;
    }
    const cx = B.w * 0.45 + dx * s, cy = ground - 9 * s + dy * s;
    const leg = (i, near) => {
      const jx = cx + (i - 1.5) * 3.2 * s + (near ? 0 : s), jy = cy + 1.5 * s;
      const dir = i < 2 ? -1 : 1, lift = (i + step) % 2 ? 1.2 : 0;
      const knee = [jx + dir * 4 * s, cy - 4 * s - lift * s], foot = [jx + dir * (near ? 7.5 : 6.5) * s, ground - lift * s];
      const col = near ? pal.leg : pal.far;
      seg([jx, jy], knee, lw, col);
      seg(knee, foot, lw, col);
    };
    for (let i = 0; i < 4; i++) leg(i, false);
    R.ellipse(cx - 5 * s, cy - s, 7 * s, 5.5 * s, pal.shell);
    R.ellipse(cx - 6 * s, cy - 3.5 * s, 4 * s, 2 * s, pal.hi);
    R.ellipse(cx + 4 * s, cy + 0.5 * s, 4.5 * s, 3.5 * s, pal.shell);
    for (let i = 0; i < 3; i++) R.rect(cx - 9 * s + i * 3 * s, cy - (1 + (i % 2)) * s, dot, dot, pal.glow);
    R.rect(cx - 8 * s, cy + 2 * s, 6 * s, Math.max(1, s * 0.5), pal.glow);
    R.rect(cx + 6.5 * s, cy - 1.2 * s, dot, dot, pal.eye);
    R.rect(cx + 5 * s, cy - 1.8 * s, Math.max(1, s * 0.6), Math.max(1, s * 0.6), pal.eye);
    seg([cx + 7.5 * s, cy + 1.5 * s], [cx + 9 * s, cy + 3.8 * s], dot, pal.fang);
    seg([cx + 6.5 * s, cy + 2 * s], [cx + 7.4 * s, cy + 4.2 * s], dot, pal.fang);
    for (let i = 0; i < 4; i++) leg(i, true);
    R.outline('#0a0610');
    return R;
  };

  Pix.FIELD_BEASTS = { spider: true };

  Pix.turn = (R, dir) => {
    if (dir === 'right') return R;
    const side = dir === 'left', W = side ? R.w : R.h, H = side ? R.h : R.w, O = new A.Art.Raster(W, H);
    for (let y = 0; y < R.h; y++) for (let x = 0; x < R.w; x++) {
      const i = (y * R.w + x) * 4;
      if (!R.data[i + 3]) continue;
      const [nx, ny] = dir === 'left' ? [R.w - 1 - x, y] : dir === 'down' ? [R.h - 1 - y, x] : [y, R.w - 1 - x];
      const j = (ny * W + nx) * 4;
      for (let k = 0; k < 4; k++) O.data[j + k] = R.data[i + k];
    }
    return O;
  };

  Pix.fieldBeast = (kind, dir, frame) => {
    const pal = Pix.BEASTS[kind].pal, R = new A.Art.Raster(22, 18);
    const step = frame.startsWith('walk') ? (+frame.slice(4)) % 2 : frame === 'idle1' ? 1 : 0;
    for (let i = 0; i < 4; i++) {
      const jx = Math.round(7 + i * 2.5), back = i < 2 ? -1 : 1, k = (i + step) % 2 ? 1 : -1;
      for (const side of [-1, 1]) {
        const knee = [jx + back * 2, 9 + side * 5], foot = [jx + back * 4 + k, 9 + side * 8];
        R.line(jx, 9 + side * 2, knee[0], knee[1], pal.leg);
        R.line(knee[0], knee[1], foot[0], foot[1], pal.leg);
      }
    }
    R.ellipse(8, 9, 5, 4, pal.shell);
    R.ellipse(7, 8, 2.5, 1.5, pal.hi);
    R.ellipse(14.5, 9, 3, 2.6, pal.shell);
    for (const [x, y] of [[5, 9], [8, 11], [10, 7]]) R.set(x, y, pal.glow);
    R.set(16, 8, pal.eye);
    R.set(16, 10, pal.eye);
    R.outline('#0a0610');
    return Pix.turn(R, dir);
  };

  const ICON = (col, rows) => ({ col, rows });
  Pix.ICONS = {
    blade: ICON('#ff7a6a', ['......#', '.....#.', '....#..', '...#...', '..#....', '.o.....', 'o......']),
    strike: ICON('#f0c870', ['...#...', '.#.#.#.', '..###..', '#######', '..###..', '.#.#.#.', '...#...']),
    blaster: ICON('#ff5a48', ['.......', '.......', '..####.', '#######', '..####.', '.......', '.......']),
    ion: ICON('#7ab8ff', ['..###..', '.#...#.', '#..#..#', '#.###.#', '#..#..#', '.#...#.', '..###..']),
    shock: ICON('#c8a8ff', ['....##.', '...##..', '..##...', '.#####.', '...##..', '..##...', '.##....']),
    mind: ICON('#f4a8e4', ['.......', '..###..', '.#...#.', '#..#..#', '.#...#.', '..###..', '.......']),
    poison: ICON('#7ad86a', ['...#...', '..###..', '..###..', '.#####.', '.#####.', '..###..', '.......']),
    stun: ICON('#f8e070', ['...#...', '#..#..#', '.#####.', '..###..', '.#####.', '#..#..#', '...#...']),
    fear: ICON('#b898e8', ['..###..', '.#...#.', '....#..', '...#...', '...#...', '.......', '...#...']),
    blind: ICON('#d0d0d0', ['#.....#', '.####..', '#.#.#.#', '#..#..#', '#.#.#.#', '..###..', '#.....#']),
    rage: ICON('#ff4a3a', ['.#...#.', '.#...#.', '.#...#.', '.#...#.', '.#...#.', '.......', '.#...#.']),
    calm: ICON('#8ad0ff', ['.......', '.##....', '#..#..#', '....##.', '.##....', '#..#..#', '....##.']),
    disarmed: ICON('#e0a070', ['#.....#', '.#...#.', '..###..', '.#####.', '..###..', '.#...#.', '#.....#']),
    breach: ICON('#ffa040', ['.#####.', '#..#..#', '#.#...#', '#..#..#', '#...#.#', '.#.#.#.', '..###..']),
    deflect: ICON('#ff8070', ['..###..', '.#...#.', '#.....#', '#.....#', '.......', '.......', '.......']),
    evade: ICON('#a8e8c8', ['..###..', '.#...#.', '#..##.#', '#.#..##', '#..#...', '.#.....', '..##...']),
    guard: ICON('#c8c8d8', ['#######', '#.....#', '#.....#', '.#...#.', '.#...#.', '..#.#..', '...#...']),
    saberOff: ICON('#a0a0a8', ['......#', '.....#.', '.......', '...#...', '..#....', '.o.....', 'o......'])
  };

  Pix.icon = id => {
    const ic = Pix.ICONS[id], R = new A.Art.Raster(7, 7);
    ic.rows.forEach((row, y) => {
      for (let x = 0; x < 7; x++) if (row[x] !== '.') R.set(x, y, row[x] === 'o' ? '#8a8a94' : ic.col);
    });
    return R;
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
