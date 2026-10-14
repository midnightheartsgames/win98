(function (S, B) {
  'use strict';
  const { Buf, Pen } = S;
  const C = B.C;
  const ICONS = S.ICONS;
  const CUR = new Map();

  function mk(w, h, fn) { const b = new Buf(w, h); fn(new Pen(b), b); return b; }

  ICONS['bt:photo'] = () => mk(48, 40, P => {
    P.part(P.poly([6, 8, 40, 4, 43, 33, 9, 37]), C.cream, { b: 4, sh: 1 });
    P.part(P.poly([11, 11, 37, 8, 39, 28, 13, 31]), C.sky, { b: 2, sh: 0, hi: 0 });
    P.part(P.ell(25, 18, 5, 6), C.skin, { b: 3, sh: 0 });
    P.part(P.ell(25, 14, 5.5, 3), C.snow, { b: 2, sh: 0, hi: 0 });
    P.part(P.poly([17, 31, 33, 29, 32, 23, 18, 25]), C.tan, { b: 3, sh: 0 });
  });
  ICONS['bt:guitar'] = () => mk(48, 40, P => {
    P.part(P.poly([22, 22, 42, 4, 45, 7, 26, 26]), C.wood, { b: 2, sh: 0 });
    P.part(P.rect(40, 2, 6, 6), C.wood, { b: 1, sh: 0 });
    P.part(P.ell(15, 27, 11, 10), C.gold, { b: 3 });
    P.part(P.ell(22, 21, 8, 7), C.gold, { b: 3 });
    P.part(P.ell(17, 25, 3, 3), C.grey, { b: 0, sh: 0, hi: 0 });
    P.line(12, 32, 21, 23, C.grey[1]);
  });
  ICONS['bt:notebook'] = () => mk(48, 40, P => {
    P.part(P.poly([9, 6, 39, 5, 41, 35, 10, 36]), C.wood, { b: 2 });
    P.part(P.poly([14, 9, 36, 8, 37, 31, 15, 32]), C.cream, { b: 3, sh: 0, hi: 0 });
    for (let y = 8; y <= 33; y += 4) P.part(P.ell(10, y, 2.2, 1.6), C.steel, { b: 3, sh: 0, hi: 0 });
    for (let y = 13; y <= 29; y += 4) P.line(18, y, 33, y - 1, C.grey[2]);
  });

  ICONS['bt:can'] = () => mk(48, 40, P => { P.part(P.rect(16, 6, 16, 28), C.red, { b: 3 }); P.part(P.rect(16, 14, 16, 6), C.snow, { b: 4, sh: 0 }); P.part(P.ell(24, 6, 8, 2.5), C.steel, { b: 3, sh: 0 }); });
  ICONS['bt:recorder'] = () => mk(48, 40, P => { P.part(P.rect(8, 8, 32, 24), C.grey, { b: 1 }); P.part(P.rect(12, 12, 24, 12), C.steel, { b: 2, sh: 0 }); for (const x of [18, 30]) P.part(P.ell(x, 18, 3.5, 3.5), C.snow, { b: 3, sh: 0 }); for (let i = 0; i < 4; i++) P.part(P.rect(11 + i * 7, 26, 5, 4), C.steel, { b: 4, sh: 0 }); });
  ICONS['bt:shoe'] = () => mk(48, 40, P => { P.part(P.path('M 6 28 Q 8 20 18 20 Q 26 12 34 16 L 42 26 L 42 30 L 6 30 Z'), C.navy, { b: 3 }); P.part(P.rect(36, 30, 4, 6), C.navy, { b: 2 }); P.part(P.ell(22, 22, 5, 2), C.navy, { b: 1, sh: 0 }); });
  ICONS['bt:paper'] = () => mk(48, 40, P => { P.part(P.poly([6, 6, 40, 4, 42, 34, 8, 36]), C.cream, { b: 4 }); for (let y = 12; y < 32; y += 4) P.line(12, y, 36, y - 1, C.grey[2]); P.part(P.rect(12, 8, 24, 3), C.grey, { b: 1, sh: 0, hi: 0 }); });
  ICONS['bt:note'] = () => mk(48, 40, P => { P.part(P.poly([10, 8, 38, 10, 36, 32, 12, 30]), C.snow, { b: 4 }); for (let y = 15; y < 28; y += 5) P.line(15, y, 33, y + 1, C.navy[2]); });
  ICONS['bt:hat'] = () => mk(48, 40, P => { P.part(P.ell(24, 28, 20, 6), C.cream, { b: 3 }); P.part(P.path('M 12 28 L 14 10 Q 24 4 34 10 L 36 28 Z'), C.cream, { b: 4 }); P.part(P.rect(13, 20, 22, 5), C.red, { b: 2, sh: 0 }); });
  ICONS['bt:drill'] = () => mk(48, 40, P => { P.part(P.rect(4, 14, 24, 12), C.grey, { b: 2 }); P.part(P.poly([28, 12, 44, 20, 28, 28]), C.steel, { b: 3 }); for (let x = 30; x < 42; x += 4) P.line(x, 14, x + 2, 26, C.steel[1]); P.part(P.poly([4, 14, 0, 10, 0, 30, 4, 26]), C.red, { b: 3 }); });
  ICONS['bt:iron'] = () => mk(48, 40, P => { P.part(P.cap(8, 32, 38, 8, 2.5, 2.5), C.steel, { b: 2 }); P.part(P.cap(38, 8, 44, 12, 2.5, 2), C.steel, { b: 2 }); });
  ICONS['bt:antenna'] = () => mk(48, 40, P => { P.line(6, 34, 44, 4, C.steel[3]); P.line(7, 34, 45, 4, C.steel[1]); P.part(P.ell(6, 34, 3, 3), C.grey, { b: 2 }); P.part(P.ell(44, 4, 2, 2), C.steel, { b: 4 }); });
  ICONS['bt:hubcap'] = () => mk(48, 40, P => { P.part(P.ell(24, 20, 17, 15), C.steel, { b: 3 }); P.part(P.ell(24, 20, 8, 7), C.steel, { b: 4, sh: 0 }); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; P.line(24 + Math.cos(a) * 9, 20 + Math.sin(a) * 8, 24 + Math.cos(a) * 15, 20 + Math.sin(a) * 13, C.steel[1]); } });
  ICONS['bt:keys'] = () => mk(48, 40, P => { P.part(P.ell(16, 16, 8, 8), C.gold, { b: 3 }); P.part(P.ell(16, 16, 3, 3), C.gold, { b: 0, sh: 0 }); P.part(P.rect(22, 14, 20, 4), C.gold, { b: 3, sh: 0 }); P.part(P.rect(34, 18, 3, 5), C.gold, { b: 3, sh: 0 }); P.part(P.rect(39, 18, 3, 7), C.gold, { b: 3, sh: 0 }); });
  ICONS['bt:gun'] = () => mk(48, 40, P => { P.part(P.rect(8, 10, 32, 8), C.grey, { b: 2 }); P.part(P.ell(18, 18, 6, 5), C.grey, { b: 1 }); P.part(P.poly([8, 18, 16, 18, 14, 34, 4, 34]), C.wood, { b: 2 }); });

  const GRIDS = {
    arrow: ['#', '##', '#=#', '#==#', '#===#', '#====#', '#=====#', '#======#', '#=======#', '#====#####', '#==#=#', '#=#.#=#', '##..#=#', '#....#=#', '.....#=#', '......##'],
    use: ['.....##', '....#==#', '....#==#', '....#==###', '....#==#==##', '..###==#==#=#', '.#==#==#==#=#', '.#==#=======#', '..#=========#', '..#=========#', '...#=======#', '....#======#', '....#======#', '....########'],
    talk: ['...########', '..#========#', '.#==========#', '#============#', '#==########==#', '#=#oooooooo#=#', '#==########==#', '.#==========#', '..##======##', '....######'],
    look: ['....######', '..##======##', '.#===####===#', '#===#oo..#===#', '#===#oo..#===#', '#===#oooo#===#', '.#===####===#', '..##======##', '....######'],
    e: ['.......#', '.......##', '.......#=#', '########==#', '#===========#', '#============#', '#===========#', '########==#', '.......#=#', '.......##', '.......#'],
    wait: ['#########', '#=======#', '.#=====#', '..#===#', '...#=#', '..#.=.#', '.#..=..#', '#===o===#', '#########']
  };
  const FILL = { arrow: C.snow, use: C.gold, talk: C.pink, look: C.sky, e: C.mustard, w: C.mustard, n: C.mustard, s: C.mustard, wait: C.grey };

  function rows(kind) {
    if (GRIDS[kind]) return GRIDS[kind];
    const e = GRIDS.e;
    const w = Math.max(...e.map(r => r.length));
    const pad = e.map(r => r.padEnd(w, '.'));
    if (kind === 'w') return pad.map(r => r.split('').reverse().join(''));
    const t = [];
    for (let x = 0; x < w; x++) t.push(pad.map(r => r[x]).join(''));
    return kind === 's' ? t : t.reverse();
  }

  function cursor(kind, hot) {
    const key = kind + (hot ? 1 : 0);
    if (CUR.has(key)) return CUR.get(key);
    const g = rows(kind);
    const w = Math.max(...g.map(r => r.length)), h = g.length;
    const b = new Buf(w, h);
    const ramp = FILL[kind] || C.snow;
    for (let y = 0; y < h; y++) for (let x = 0; x < g[y].length; x++) {
      const ch = g[y][x];
      if (ch === '#') b.set(x, y, C.black);
      else if (ch === '=') b.set(x, y, hot ? ramp[4] : ramp[3]);
      else if (ch === 'o') b.set(x, y, C.pupil);
    }
    const hx = kind === 'arrow' ? 0 : Math.floor(w / 2), hy = kind === 'arrow' ? 0 : Math.floor(h / 2);
    const r = { buf: b, hx, hy };
    CUR.set(key, r);
    return r;
  }

  B.cursor = cursor;
  B.cursorCache = CUR;
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
