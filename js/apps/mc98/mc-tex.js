(function (M) {
  'use strict';
  const T = 16, GRID = 32, SIZE = T * GRID;
  const hashN = (x, y, s) => M.hash01(x, y, 0, s);

  class Tile {
    constructor(seed) { this.px = new Uint8Array(T * T * 4); this.seed = seed; }
    set(x, y, c, a = 255) {
      if (x < 0 || y < 0 || x >= T || y >= T) return;
      const i = (y * T + x) * 4; this.px[i] = c[0]; this.px[i + 1] = c[1]; this.px[i + 2] = c[2]; this.px[i + 3] = a;
    }
    get(x, y) { const i = (((y & 15) * T) + (x & 15)) * 4; return [this.px[i], this.px[i + 1], this.px[i + 2]]; }
    alphaAt(x, y) { return this.px[(((y & 15) * T) + (x & 15)) * 4 + 3]; }
    n(x, y, k = 0) { return hashN(x, y, this.seed + k * 977); }
    fill(c, a = 255) { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) this.set(x, y, c, a); }
    noise(base, amp, k = 0) { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const v = (this.n(x, y, k) - 0.5) * amp; this.set(x, y, M.rgb(base[0] + v, base[1] + v, base[2] + v)); } }
    smoothNoise(base, amp, k = 0, scale = 4) {
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
        const gx = x / scale, gy = y / scale, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
        const a = this.n(x0, y0, k), b = this.n(x0 + 1, y0, k), c = this.n(x0, y0 + 1, k), d = this.n(x0 + 1, y0 + 1, k);
        const v = (M.lerp(M.lerp(a, b, fx), M.lerp(c, d, fx), fy) - 0.5) * amp + (this.n(x, y, k + 5) - 0.5) * amp * 0.3;
        this.set(x, y, M.rgb(base[0] + v, base[1] + v, base[2] + v));
      }
    }
    rect(x0, y0, w, h, c, a = 255) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.set(x, y, c, a); }
    border(c) { for (let i = 0; i < T; i++) { this.set(i, 0, c); this.set(i, T - 1, c); this.set(0, i, c); this.set(T - 1, i, c); } }
    specks(c, count, k = 0, sz = 1) {
      for (let i = 0; i < count; i++) {
        const x = Math.floor(this.n(i, 1, k) * (T - sz)), y = Math.floor(this.n(i, 2, k) * (T - sz));
        this.rect(x, y, sz, sz, c);
      }
    }
    shade(fn) { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const i = (y * T + x) * 4; if (!this.px[i + 3]) continue; const s = fn(x, y); this.px[i] = M.clamp(this.px[i] * s, 0, 255); this.px[i + 1] = M.clamp(this.px[i + 1] * s, 0, 255); this.px[i + 2] = M.clamp(this.px[i + 2] * s, 0, 255); } }
    ellipse(cx, cy, rx, ry, c, a = 255) { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) this.set(x, y, c, a); } }
    outline(c) {
      const src = this.px.slice();
      const al = (x, y) => (x < 0 || y < 0 || x >= T || y >= T ? 0 : src[(y * T + x) * 4 + 3]);
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (al(x, y) && (!al(x - 1, y) || !al(x + 1, y) || !al(x, y - 1) || !al(x, y + 1))) this.set(x, y, c);
    }
    sprite(rows, pal) { for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) { const ch = rows[y][x]; if (ch !== '.' && pal[ch]) this.set(x, y, pal[ch]); } }
    line(x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) this.set(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); }
  }

  const C = {
    stone: [125, 125, 125], dirt: [134, 96, 67], grass: [96, 154, 52], sand: [219, 211, 160], gravel: [131, 127, 126], wood: [156, 127, 78], woodDark: [102, 81, 50],
    bark: [98, 76, 46], leaf: [58, 120, 32], water: [46, 88, 200], lava: [230, 110, 20], glass: [190, 220, 240], wool: [225, 225, 225], gold: [250, 220, 70],
    iron: [215, 205, 195], diamond: [110, 230, 225], coal: [40, 40, 40], brick: [160, 80, 65], obsidian: [24, 18, 36], snow: [240, 245, 250], ice: [150, 190, 240],
    cactus: [60, 140, 40], clay: [160, 165, 175], black: [12, 12, 12], white: [245, 245, 245], leather: [140, 90, 50], bone: [225, 225, 210], pink: [235, 160, 160],
    skin: [220, 170, 130], red: [200, 40, 40], green: [70, 170, 60]
  };

  const gens = {};
  const def = (name, fn) => { gens[name] = fn; };

  def('stone', t => t.smoothNoise(C.stone, 40, 1, 3));
  def('dirt', t => t.noise(C.dirt, 44, 2));
  def('grass_top', t => t.smoothNoise(C.grass, 40, 3, 2));
  def('grass_side', t => { t.noise(C.dirt, 44, 2); for (let x = 0; x < T; x++) { const h = 2 + Math.floor(t.n(x, 0, 4) * 3); for (let y = 0; y < h; y++) t.set(x, y, M.rgb(C.grass[0] + (t.n(x, y, 3) - 0.5) * 40, C.grass[1] + (t.n(x, y, 3) - 0.5) * 40, C.grass[2])); } });
  def('snow_side', t => { t.noise(C.dirt, 44, 2); for (let x = 0; x < T; x++) { const h = 3 + Math.floor(t.n(x, 0, 4) * 2); for (let y = 0; y < h; y++) t.set(x, y, M.rgb(C.snow[0] - (t.n(x, y, 3)) * 20, C.snow[1] - t.n(x, y, 3) * 20, C.snow[2])); } });
  def('snow', t => t.noise(C.snow, 14, 6));
  def('cobblestone', t => {
    t.noise([100, 100, 100], 30, 7);
    const cells = [[0, 0, 6, 5], [6, 0, 5, 4], [11, 0, 5, 6], [0, 5, 4, 6], [4, 5, 7, 5], [11, 6, 5, 4], [0, 11, 7, 5], [7, 10, 4, 6], [11, 10, 5, 6]];
    cells.forEach((c, i) => { const v = 118 + (t.n(i, 9, 8) - 0.5) * 50; t.rect(c[0] + 1, c[1] + 1, c[2] - 1, c[3] - 1, [v, v, v]); for (let y = c[1] + 1; y < c[1] + c[3]; y++) for (let x = c[0] + 1; x < c[0] + c[2]; x++) { const q = v + (t.n(x, y, 8) - 0.5) * 24; t.set(x, y, [q, q, q]); } });
    t.rect(0, 0, 16, 16, [80, 80, 80], 255); cells.forEach((c, i) => { const v = 118 + (t.n(i, 9, 8) - 0.5) * 50; for (let y = c[1] + 1; y < c[1] + c[3]; y++) for (let x = c[0] + 1; x < c[0] + c[2]; x++) { const q = v + (t.n(x, y, 8) - 0.5) * 24; t.set(x, y, [q, q, q]); } });
  });
  def('mossy_cobblestone', t => { gens.cobblestone(t); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (t.n(x, y, 12) < 0.35) { const c = t.get(x, y); t.set(x, y, [c[0] * 0.5, c[1] * 0.9 + 30, c[2] * 0.4]); } });
  def('planks', t => { t.noise(C.wood, 26, 13); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const c = t.get(x, y); const s = (y % 4 === 3) ? 0.62 : ((x + (y >> 2) * 5) % 16 === 0 ? 0.7 : (x % 3 === 0 ? 0.92 : 1)); t.set(x, y, [c[0] * s, c[1] * s, c[2] * s]); } });
  def('log', t => { t.noise(C.bark, 30, 14); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const c = t.get(x, y); const s = ((x * 5 + Math.floor(t.n(0, y >> 1, 15) * 3)) % 7 < 2) ? 0.7 : 1; t.set(x, y, [c[0] * s, c[1] * s, c[2] * s]); } });
  def('log_top', t => { t.noise(C.bark, 20, 16); for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) { const r = Math.hypot(x - 7.5, y - 7.5); const s = (Math.floor(r) % 2 === 0) ? 1.15 : 0.85; t.set(x, y, M.rgb(C.wood[0] * s + (t.n(x, y, 16) - 0.5) * 12, C.wood[1] * s, C.wood[2] * s)); } });
  def('leaves', t => { t.fill(C.leaf, 0); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const v = t.n(x, y, 17); if (v > 0.22) { const s = 0.75 + v * 0.5; t.set(x, y, M.rgb(C.leaf[0] * s, C.leaf[1] * s, C.leaf[2] * s)); } } });
  def('sapling', t => { t.fill(C.leaf, 0); t.sprite(['................', '................', '.......L........', '......LLL.......', '.....LLLLL......', '.....LLLLL......', '......LLL.......', '.......T........', '.......T..L.....', '......LLTLL.....', '.....LLLTLLL....', '......LLTLL.....', '.......LT.......', '.......T........', '......TTT.......', '................'], { L: C.leaf, T: C.woodDark }); });
  def('bedrock', t => t.smoothNoise([70, 70, 70], 70, 18, 2));
  def('water', t => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const w = Math.sin((x + y * 0.5) * 0.8 + t.n(0, y, 19) * 2) * 12; t.set(x, y, M.rgb(C.water[0] + w, C.water[1] + w, C.water[2] + w * 0.5), 200); } });
  def('lava', t => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const v = t.n(x >> 1, y >> 1, 20); t.set(x, y, v > 0.6 ? [255, 230, 90] : v > 0.35 ? C.lava : [180, 50, 10]); } });
  def('sand', t => t.noise(C.sand, 26, 21));
  def('sandstone', t => { t.noise(C.sand, 14, 22); for (let y = 0; y < T; y++) if (y % 5 === 4) for (let x = 0; x < T; x++) { const c = t.get(x, y); t.set(x, y, [c[0] * 0.8, c[1] * 0.8, c[2] * 0.75]); } });
  def('sandstone_top', t => { t.noise(C.sand, 14, 23); t.border([190, 180, 130]); });
  def('gravel', t => { t.noise(C.gravel, 40, 24); t.specks([90, 88, 86], 14, 25, 2); t.specks([170, 165, 160], 10, 26, 1); });
  const ore = (name, col) => def(name, t => { gens.stone(t); const rnd = M.makeRandom(t.seed + 55); for (let i = 0; i < 6; i++) { const x = rnd.int(14), y = rnd.int(14); t.rect(x, y, 2, 2, col); t.set(x + 1, y + 1, M.scale(col, 0.7)); if (rnd() < 0.5) t.set(x + 2, y, col); } });
  ore('coal_ore', C.coal); ore('iron_ore', [220, 170, 130]); ore('gold_ore', C.gold); ore('diamond_ore', C.diamond);
  def('glass', t => { t.fill(C.glass, 0); t.border([230, 240, 250]); t.line(2, 2, 6, 2, [255, 255, 255]); t.line(2, 3, 2, 6, [255, 255, 255]); t.line(3, 3, 3, 3, [255, 255, 255]); for (let i = 0; i < 5; i++) t.set(11 + i, 13 - i, [255, 255, 255], 120); });
  def('wool', t => { t.noise(C.wool, 30, 27); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if ((x * 3 + y * 5) % 7 === 0) { const c = t.get(x, y); t.set(x, y, [c[0] * 0.85, c[1] * 0.85, c[2] * 0.85]); } });
  def('flower_yellow', t => { t.fill(C.leaf, 0); t.sprite(['................', '................', '................', '......YYY.......', '.....YYYYY......', '.....YYOYY......', '.....YYYYY......', '......YYY.......', '.......T........', '.......T........', '......LT........', '.....L.T.L......', '.......TL.......', '.......T........', '.......T........', '................'], { Y: [240, 220, 60], O: [200, 150, 30], T: [60, 120, 40], L: [70, 150, 50] }); });
  def('flower_red', t => { t.fill(C.leaf, 0); t.sprite(['................', '................', '......RR........', '.....RRRR.......', '.....RRRR.......', '......RR........', '.......T........', '.......T........', '.......TL.......', '......LT........', '.......T........', '.......TL.......', '......LT........', '.......T........', '.......T........', '................'], { R: [210, 30, 40], T: [60, 120, 40], L: [70, 150, 50] }); });
  def('mushroom_brown', t => { t.fill(C.leaf, 0); t.sprite(['................', '................', '................', '................', '................', '......BBBB......', '.....BBBBBB.....', '....BBBBBBBB....', '....BBBBBBBB....', '.......SS.......', '.......SS.......', '.......SS.......', '.......SS.......', '......SSSS......', '................', '................'], { B: [140, 100, 70], S: [220, 210, 190] }); });
  def('mushroom_red', t => { t.fill(C.leaf, 0); t.sprite(['................', '................', '................', '......RRRR......', '.....RWRRWR.....', '....RRRRRRRR....', '....RWRRRRWR....', '....RRRRRRRR....', '.......SS.......', '.......SS.......', '.......SS.......', '.......SS.......', '......SSSS......', '................', '................', '................'], { R: [210, 40, 40], W: [255, 255, 255], S: [220, 210, 190] }); });
  def('tall_grass', t => { t.fill(C.leaf, 0); const rnd = M.makeRandom(t.seed + 3); for (let i = 0; i < 9; i++) { const x = 1 + rnd.int(14), h = 6 + rnd.int(9); const dir = rnd() < 0.5 ? -1 : 1; for (let y = 15; y > 15 - h; y--) t.set(x + (y < 9 ? dir : 0), y, M.rgb(C.grass[0] + rnd.range(-20, 20), C.grass[1] + rnd.range(-20, 20), C.grass[2])); } });
  const metal = (name, col) => def(name, t => { t.fill(col); t.border(M.scale(col, 0.6)); t.rect(1, 1, 14, 1, M.scale(col, 1.15)); t.rect(1, 1, 1, 14, M.scale(col, 1.15)); t.rect(3, 3, 10, 10, M.scale(col, 0.92)); t.rect(5, 5, 6, 6, col); });
  metal('gold_block', C.gold); metal('iron_block', C.iron); metal('diamond_block', C.diamond);
  def('brick', t => { t.fill([170, 160, 150]); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const row = Math.floor(y / 4), off = (row % 2) * 4; if (y % 4 === 3 || (x + off) % 8 === 7) continue; const v = (t.n(row, Math.floor((x + off) / 8), 28) - 0.5) * 30; t.set(x, y, M.rgb(C.brick[0] + v + (t.n(x, y, 29) - 0.5) * 12, C.brick[1] + v, C.brick[2] + v)); } });
  def('tnt', t => { t.fill([220, 60, 50]); t.rect(0, 5, 16, 6, [235, 235, 220]); t.rect(0, 0, 16, 1, [160, 40, 30]); t.rect(0, 15, 16, 1, [160, 40, 30]); t.sprite(['', '', '', '', '', '', '.XXX.X.X.XXX....', '..X..XX..X.X....', '..X..X.X.X.X....'], { X: [40, 40, 40] }); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (t.n(x, y, 30) < 0.2 && (y < 5 || y > 10)) t.set(x, y, [190, 50, 40]); });
  def('tnt_top', t => { t.fill([220, 60, 50]); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (((x >> 2) + (y >> 2)) % 2 === 0) t.set(x, y, [200, 50, 40]); t.rect(6, 6, 4, 4, [40, 40, 40]); t.rect(7, 7, 2, 2, [230, 200, 60]); });
  def('tnt_bottom', t => { t.fill([200, 50, 40]); t.rect(2, 2, 12, 12, [220, 60, 50]); });
  def('obsidian', t => { t.smoothNoise(C.obsidian, 30, 31, 3); t.specks([70, 50, 100], 8, 32); });
  def('torch', t => { t.fill(C.black, 0); t.rect(7, 6, 2, 10, C.woodDark); t.rect(7, 4, 2, 2, [255, 220, 80]); t.rect(7, 3, 2, 1, [255, 160, 40]); t.rect(6, 5, 4, 1, [255, 190, 60]); });
  def('chest_top', t => { t.noise(C.wood, 20, 33); t.border(C.woodDark); });
  def('chest_side', t => { t.noise(C.wood, 20, 34); t.border(C.woodDark); t.rect(0, 7, 16, 1, C.woodDark); });
  def('chest_front', t => { gens.chest_side(t); t.rect(7, 5, 2, 4, [80, 80, 80]); t.set(7, 6, [120, 120, 120]); });
  def('table_top', t => { gens.planks(t); t.rect(1, 1, 6, 6, [180, 150, 100]); t.rect(9, 9, 6, 6, [180, 150, 100]); t.rect(2, 2, 4, 4, [120, 90, 60]); t.rect(10, 10, 4, 4, [120, 90, 60]); t.rect(9, 1, 6, 6, [90, 70, 50]); t.rect(10, 2, 4, 4, [140, 110, 70]); });
  def('table_side', t => { gens.planks(t); t.rect(0, 0, 16, 5, [120, 90, 60]); t.rect(2, 6, 4, 6, [200, 200, 210]); t.rect(3, 6, 2, 8, [120, 90, 60]); t.rect(10, 7, 4, 5, [90, 70, 50]); });
  def('table_front', t => { gens.planks(t); t.rect(0, 0, 16, 5, [120, 90, 60]); t.rect(3, 7, 4, 6, [200, 200, 210]); t.rect(9, 6, 3, 8, [90, 70, 50]); t.rect(9, 6, 3, 2, [200, 200, 210]); });
  def('furnace_top', t => { gens.stone(t); t.border([90, 90, 90]); });
  def('furnace_side', t => { gens.cobblestone(t); });
  def('furnace_front', t => { gens.cobblestone(t); t.rect(3, 6, 10, 7, [30, 30, 30]); t.rect(3, 6, 10, 1, [60, 60, 60]); });
  def('furnace_lit', t => { gens.cobblestone(t); t.rect(3, 6, 10, 7, [40, 20, 10]); for (let y = 7; y < 13; y++) for (let x = 4; x < 12; x++) if (t.n(x, y, 35) > 0.35) t.set(x, y, [y < 9 ? 250 : 230, y < 9 ? 200 : 110, 30]); });
  def('ladder', t => { t.fill(C.black, 0); t.rect(2, 0, 2, 16, C.wood); t.rect(12, 0, 2, 16, C.wood); for (let y = 1; y < 16; y += 4) t.rect(2, y, 12, 2, [170, 140, 90]); t.rect(2, 0, 1, 16, C.woodDark); t.rect(13, 0, 1, 16, C.woodDark); });
  def('ice', t => { t.fill(C.ice, 220); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (t.n(x, y, 36) > 0.8) t.set(x, y, [220, 235, 255], 240); t.line(3, 2, 8, 7, [220, 240, 255]); t.line(9, 8, 13, 13, [220, 240, 255]); });
  def('cactus', t => { t.fill(C.cactus); t.rect(0, 0, 1, 16, [30, 90, 20]); t.rect(15, 0, 1, 16, [30, 90, 20]); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (t.n(x, y, 37) > 0.85) t.set(x, y, [120, 190, 90]); for (let y = 2; y < 16; y += 4) { t.set(1, y, [200, 220, 180]); t.set(14, y, [200, 220, 180]); t.set(8, y + 2, [40, 110, 30]); } });
  def('cactus_top', t => { t.fill(C.cactus); t.border([30, 90, 20]); t.rect(4, 4, 8, 8, [90, 170, 70]); });
  def('clay', t => t.noise(C.clay, 24, 38));
  def('bed_top', t => { t.fill([200, 40, 40]); t.rect(0, 0, 16, 5, [240, 240, 240]); t.rect(1, 1, 14, 3, [225, 225, 225]); t.rect(0, 5, 16, 1, [150, 30, 30]); t.border([120, 70, 40]); });
  def('bed_side', t => { t.fill(C.woodDark, 0); t.rect(0, 8, 16, 8, [200, 40, 40]); t.rect(0, 8, 16, 1, [150, 30, 30]); t.rect(0, 13, 16, 3, C.woodDark); t.rect(0, 5, 3, 8, C.woodDark); t.rect(13, 5, 3, 8, C.woodDark); });
  def('spawner', t => { t.fill(C.black, 0); t.fill([40, 40, 45], 255); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (y % 4 !== 0 && x % 4 !== 0) t.set(x, y, [20, 20, 25], 60); });
  def('glowstone', t => { t.noise([230, 200, 120], 40, 39); t.specks([255, 240, 190], 12, 40, 2); });

  const blob = (t, col, rx, ry, k) => { t.fill(col, 0); t.ellipse(8, 8, rx, ry, col); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (t.alphaAt(x, y) && t.n(x, y, k) > 0.7) { const c = t.get(x, y); t.set(x, y, M.scale(c, 0.85)); } t.outline(M.scale(col, 0.5)); };
  def('stick', t => { t.fill(C.wood, 0); t.line(3, 13, 12, 4, C.wood); t.line(4, 13, 13, 4, C.woodDark); t.line(3, 12, 11, 4, [190, 160, 100]); });
  def('coal', t => blob(t, C.coal, 5.5, 5, 41));
  def('flint', t => { t.fill(C.black, 0); t.sprite(['................', '................', '................', '.......GGGG.....', '.....GGDDDDG....', '....GDDDDDDDG...', '...GDDDGDDDDG...', '...GDDDDDDDG....', '....GDDDDDG.....', '.....GDDDG......', '......GDG.......', '.......G........', '................'], { G: [80, 80, 85], D: [50, 50, 55] }); });
  def('gunpowder', t => { t.fill(C.black, 0); t.specks([90, 90, 90], 30, 42, 2); t.specks([60, 60, 60], 20, 43, 1); });
  def('clay_ball', t => blob(t, C.clay, 5, 5, 44));
  const ingot = (name, col) => def(name, t => { t.fill(col, 0); t.sprite(['................', '................', '................', '................', '........LLLLLL..', '.......LLLLLLLM.', '......LLLLLLLMM.', '.....LLLLLLLMM..', '....LLLLLLLMM...', '...LLLLLLLMM....', '..LLLLLLLMM.....', '..MMMMMMMM......', '................'], { L: col, M: M.scale(col, 0.6) }); t.line(3, 10, 8, 5, M.scale(col, 1.25)); });
  ingot('iron_ingot', C.iron); ingot('gold_ingot', C.gold);
  def('diamond', t => { t.fill(C.diamond, 0); t.sprite(['................', '................', '................', '.....WWWWWW.....', '....WDDDDDDD....', '...WDDDDDDDDD...', '...DDDDDDDDDB...', '....DDDDDDDB....', '.....DDDDDB.....', '......DDDB......', '.......DB.......', '........B.......', '................'], { W: [235, 255, 255], D: C.diamond, B: [50, 150, 150] }); });
  def('brick_item', t => { t.fill(C.brick, 0); t.rect(3, 5, 10, 6, C.brick); t.rect(3, 5, 10, 1, M.scale(C.brick, 1.2)); t.rect(3, 10, 10, 1, M.scale(C.brick, 0.6)); });
  def('apple', t => { t.fill(C.red, 0); t.ellipse(8, 9, 5, 5, C.red); t.ellipse(6, 8, 1.5, 2, [240, 90, 80]); t.rect(8, 3, 1, 3, C.woodDark); t.set(9, 3, C.leaf); t.set(10, 2, C.leaf); t.outline([110, 20, 20]); });
  const meat = (name, col, dark) => def(name, t => { t.fill(col, 0); t.ellipse(7, 9, 5.5, 4.5, col); t.ellipse(9, 6, 2.5, 2, [240, 230, 220]); t.outline(dark); });
  meat('porkchop', [240, 140, 140], [150, 60, 60]); meat('cooked_porkchop', [200, 120, 70], [110, 60, 30]);
  meat('beef', [200, 60, 60], [110, 30, 30]); meat('cooked_beef', [120, 70, 40], [60, 30, 15]);
  meat('chicken', [240, 200, 190], [170, 110, 100]); meat('cooked_chicken', [210, 140, 70], [120, 70, 30]);
  def('bread', t => { t.fill([200, 140, 70], 0); t.ellipse(8, 8, 6, 3.5, [200, 140, 70]); t.rect(4, 6, 8, 1, [230, 190, 120]); t.outline([120, 70, 30]); });
  def('wheat', t => { t.fill(C.gold, 0); for (let i = 0; i < 3; i++) { const x = 5 + i * 3; t.line(x, 15, x, 5, [190, 160, 70]); for (let y = 3; y < 9; y++) { t.set(x - 1, y, [230, 200, 90]); t.set(x + 1, y + 1, [230, 200, 90]); } } });
  def('egg', t => { t.fill(C.white, 0); t.ellipse(8, 8, 4, 5, [240, 235, 220]); t.outline([180, 170, 150]); });
  def('paper', t => { t.fill(C.white, 0); t.rect(3, 2, 10, 12, [240, 240, 240]); t.outline([160, 160, 160]); for (let y = 4; y < 12; y += 2) t.rect(5, y, 6, 1, [200, 200, 200]); });
  def('book', t => { t.fill(C.leather, 0); t.rect(3, 2, 10, 12, [120, 70, 40]); t.rect(4, 3, 8, 10, [140, 85, 50]); t.rect(11, 3, 2, 10, [230, 220, 200]); t.outline([60, 30, 15]); });
  def('string', t => { t.fill(C.white, 0); t.line(3, 12, 6, 4, [240, 240, 240]); t.line(6, 4, 9, 12, [240, 240, 240]); t.line(9, 12, 12, 4, [240, 240, 240]); });
  def('feather', t => { t.fill(C.white, 0); t.sprite(['................', '............W...', '...........WW...', '..........WWW...', '.........WWWW...', '........WWWWW...', '.......WWWWW....', '......WWWWW.....', '.....WWWWG......', '....WWWWG.......', '...WWWWG........', '..WWWG..........', '..WG............', '.G..............', '................'], { W: [245, 245, 245], G: [150, 150, 150] }); });
  def('leather', t => { t.fill(C.leather, 0); t.ellipse(8, 8, 6, 5, C.leather); t.ellipse(8, 8, 6, 5, C.leather); t.rect(4, 4, 2, 2, [160, 110, 60]); t.outline([80, 50, 25]); });
  def('bone', t => { t.fill(C.bone, 0); t.line(3, 12, 12, 3, C.bone); t.line(4, 13, 13, 4, C.bone); t.rect(2, 11, 3, 3, C.bone); t.rect(11, 2, 3, 3, C.bone); t.outline([150, 150, 130]); });
  def('arrow', t => { t.fill(C.black, 0); t.line(2, 13, 11, 4, C.woodDark); t.line(11, 4, 13, 2, [180, 180, 190]); t.set(13, 3, [180, 180, 190]); t.set(12, 2, [180, 180, 190]); t.rect(2, 11, 2, 3, [230, 230, 230]); t.set(4, 12, [230, 230, 230]); });
  def('bow', t => { t.fill(C.wood, 0); t.line(3, 3, 12, 3, C.wood); t.line(12, 3, 12, 12, C.wood); t.line(3, 3, 3, 4, C.wood); t.line(3, 4, 11, 12, [220, 220, 220]); t.line(11, 12, 12, 12, C.wood); t.line(4, 2, 13, 2, C.woodDark); });
  def('bucket', t => { t.fill(C.iron, 0); t.sprite(['................', '................', '................', '....GGGGGGGG....', '....G......G....', '....GIIIIIIG....', '....GIIIIIIG....', '.....IIIIII.....', '.....IIIIII.....', '.....IIIIII.....', '......IIII......', '......IIII......', '......GGGG......', '................'], { G: [140, 140, 140], I: [200, 200, 205] }); });
  def('water_bucket', t => { gens.bucket(t); t.rect(5, 4, 6, 2, C.water); });
  def('lava_bucket', t => { gens.bucket(t); t.rect(5, 4, 6, 2, C.lava); });
  def('bowl', t => { t.fill(C.wood, 0); t.sprite(['................', '................', '................', '................', '................', '..WWWWWWWWWWWW..', '..WwwwwwwwwwwW..', '...WwwwwwwwwW...', '....WwwwwwwW....', '.....WWWWWW.....', '................'], { W: C.woodDark, w: C.wood }); });
  def('mushroom_stew', t => { gens.bowl(t); t.rect(3, 5, 10, 2, [190, 140, 100]); t.set(5, 5, [220, 60, 60]); t.set(9, 5, [150, 100, 70]); });
  def('flint_and_steel', t => { t.fill(C.iron, 0); t.line(3, 6, 8, 1, [200, 200, 205]); t.line(3, 7, 3, 11, [200, 200, 205]); t.line(4, 12, 7, 12, [200, 200, 205]); t.rect(8, 8, 5, 5, [70, 70, 75]); t.rect(9, 9, 3, 3, [50, 50, 55]); });

  const toolSprites = {
    pickaxe: ['................', '.....MMMMMM.....', '....MmmmmmmM....', '...Mm......mM...', '...M...H....M...', '......HH........', '.....HH.........', '....HH..........', '...HH...........', '..HH............', '.HH.............', 'HH..............', '................'],
    axe: ['................', '........MMM.....', '.......MmmmM....', '......MmmmmM....', '.......MmmH.....', '........MHH.....', '........HH......', '.......HH.......', '......HH........', '.....HH.........', '....HH..........', '...HH...........', '..HH............', '................'],
    shovel: ['................', '............MM..', '...........MmmM.', '...........MmmM.', '............MM..', '...........HH...', '..........HH....', '.........HH.....', '........HH......', '.......HH.......', '......HH........', '.....HH.........', '....HH..........', '................'],
    sword: ['..............MM', '.............MmM', '............MmM.', '...........MmM..', '..........MmM...', '.........MmM....', '........MmM.....', '...GG..MmM......', '....GGMmM.......', '.....GGM........', '....GGGG........', '...HH..GG.......', '..HH............', '.HH.............', '................']
  };
  const matCol = { wood: C.wood, stone: [110, 110, 110], iron: C.iron, gold: C.gold, diamond: C.diamond, leather: C.leather };
  for (const m of M.TOOL_MATS) for (const k of M.TOOL_KINDS) def(m.key + '_' + k.key, t => { t.fill(C.black, 0); t.sprite(toolSprites[k.key], { M: matCol[m.key], m: M.scale(matCol[m.key], 0.75), H: C.woodDark, G: [90, 70, 50] }); });
  const armorSprites = {
    helmet: ['................', '................', '................', '.....MMMMMM.....', '....MMMMMMMM....', '....MMMMMMMM....', '....MMMMMMMM....', '....MM....MM....', '....MM....MM....', '................'],
    chestplate: ['................', '................', '...MMM....MMM...', '...MMM....MMM...', '...MMMMMMMMMM...', '...MMMMMMMMMM...', '....MMMMMMMM....', '....MMMMMMMM....', '....MMMMMMMM....', '....MMMMMMMM....', '....MMMMMMMM....', '................'],
    leggings: ['................', '................', '................', '....MMMMMMMM....', '....MMMMMMMM....', '....MMM..MMM....', '....MMM..MMM....', '....MMM..MMM....', '....MMM..MMM....', '....MMM..MMM....', '....MMM..MMM....', '................'],
    boots: ['................', '................', '................', '................', '................', '....MM....MM....', '....MM....MM....', '....MM....MM....', '...MMM...MMM....', '...MMM...MMM....', '...MMMM..MMMM...', '................']
  };
  for (const m of M.ARMOR_MATS) for (const s of M.ARMOR_SLOTS) def(m.key + '_' + s.key, t => { t.fill(C.black, 0); t.sprite(armorSprites[s.key], { M: matCol[m.key] }); t.outline(M.scale(matCol[m.key], 0.55)); });

  for (let i = 0; i < 10; i++) def('crack' + i, t => { t.fill(C.black, 0); const rnd = M.makeRandom(77); const n = 2 + i * 2; for (let k = 0; k < n; k++) { const x0 = rnd.int(16), y0 = rnd.int(16), x1 = M.clamp(x0 + rnd.int(9) - 4, 0, 15), y1 = M.clamp(y0 + rnd.int(9) - 4, 0, 15); t.line(x0, y0, x1, y1, [20, 20, 20]); } for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (t.alphaAt(x, y)) t.set(x, y, [15, 15, 15], 170); });
  def('sun', t => { t.fill([255, 255, 200]); });
  def('moon', t => { t.fill([230, 230, 240]); t.rect(0, 0, 16, 16, [225, 225, 235]); t.specks([200, 200, 215], 6, 45, 3); });
  def('cloud', t => t.fill([255, 255, 255], 190));
  def('white', t => t.fill([255, 255, 255]));
  def('destroy', t => t.fill([0, 0, 0], 0));

  const skin = (name, body, face, extra) => {
    def(name + '_body', t => { t.noise(body, 20, 46); });
    def(name + '_head', t => { t.noise(body, 14, 47); });
    def(name + '_leg', t => { t.noise(M.scale(body, 0.8), 20, 48); });
    def(name + '_arm', t => { t.noise(body, 16, 52); });
    def(name + '_face', t => { t.noise(body, 14, 47); face(t); });
    if (extra) extra();
  };
  skin('pig', [235, 160, 160], t => { t.rect(3, 4, 2, 2, [40, 40, 60]); t.rect(11, 4, 2, 2, [40, 40, 60]); t.rect(5, 9, 6, 4, [230, 130, 140]); t.rect(6, 10, 1, 2, [120, 60, 70]); t.rect(9, 10, 1, 2, [120, 60, 70]); });
  skin('cow', [80, 55, 40], t => { t.rect(3, 5, 2, 2, [20, 20, 30]); t.rect(11, 5, 2, 2, [20, 20, 30]); t.rect(4, 10, 8, 5, [200, 180, 170]); t.rect(5, 12, 1, 1, [120, 90, 80]); t.rect(10, 12, 1, 1, [120, 90, 80]); t.rect(0, 0, 3, 3, [230, 230, 220]); t.rect(13, 0, 3, 3, [230, 230, 220]); }, () => { def('cow_body', t => { t.noise([80, 55, 40], 20, 46); t.rect(2, 2, 5, 6, [220, 215, 205]); t.rect(10, 8, 5, 5, [220, 215, 205]); }); });
  skin('sheep', [235, 235, 230], t => { t.rect(3, 5, 2, 2, [40, 40, 60]); t.rect(11, 5, 2, 2, [40, 40, 60]); t.rect(5, 8, 6, 6, [230, 200, 190]); }, () => { def('sheep_body', t => { t.noise([240, 240, 235], 24, 46); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if ((x * 7 + y * 3) % 11 === 0) t.set(x, y, [215, 215, 210]); }); def('sheep_leg', t => { t.noise([225, 200, 190], 16, 48); }); });
  skin('chicken', [240, 240, 235], t => { t.rect(4, 4, 2, 2, [20, 20, 30]); t.rect(10, 4, 2, 2, [20, 20, 30]); t.rect(6, 7, 4, 3, [240, 190, 60]); t.rect(7, 10, 2, 3, [220, 60, 60]); }, () => { def('chicken_leg', t => { t.fill([240, 190, 60]); }); });
  skin('zombie', [70, 140, 80], t => { t.rect(3, 5, 3, 2, [20, 20, 20]); t.rect(10, 5, 3, 2, [20, 20, 20]); t.rect(6, 11, 4, 1, [30, 40, 30]); }, () => { def('zombie_body', t => { t.noise([40, 120, 150], 18, 46); }); def('zombie_leg', t => { t.noise([50, 50, 120], 18, 48); }); });
  skin('skeleton', [215, 215, 205], t => { t.rect(3, 5, 3, 3, [20, 20, 20]); t.rect(10, 5, 3, 3, [20, 20, 20]); t.rect(6, 9, 4, 2, [60, 60, 55]); t.rect(4, 12, 8, 1, [120, 120, 110]); }, () => { def('skeleton_body', t => { t.noise([215, 215, 205], 14, 46); t.rect(2, 4, 12, 1, [110, 110, 100]); t.rect(2, 7, 12, 1, [110, 110, 100]); t.rect(2, 10, 12, 1, [110, 110, 100]); }); });
  skin('creeper', [80, 170, 70], t => { t.rect(3, 4, 4, 3, [10, 10, 10]); t.rect(9, 4, 4, 3, [10, 10, 10]); t.rect(6, 7, 4, 5, [10, 10, 10]); t.rect(4, 9, 2, 5, [10, 10, 10]); t.rect(10, 9, 2, 5, [10, 10, 10]); });
  skin('spider', [40, 35, 40], t => { t.rect(3, 6, 2, 2, [220, 40, 40]); t.rect(11, 6, 2, 2, [220, 40, 40]); t.rect(6, 5, 1, 1, [220, 40, 40]); t.rect(9, 5, 1, 1, [220, 40, 40]); t.rect(6, 10, 4, 2, [90, 20, 20]); });
  skin('player', [80, 120, 200], t => { t.fill(C.skin); t.noise(C.skin, 10, 49); t.rect(0, 0, 16, 6, [60, 40, 25]); t.rect(0, 6, 2, 3, [60, 40, 25]); t.rect(14, 6, 2, 3, [60, 40, 25]); t.rect(4, 8, 2, 2, [255, 255, 255]); t.rect(5, 8, 1, 2, [60, 60, 140]); t.rect(10, 8, 2, 2, [255, 255, 255]); t.rect(10, 8, 1, 2, [60, 60, 140]); t.rect(7, 10, 2, 2, [190, 130, 100]); t.rect(6, 13, 4, 1, [120, 60, 60]); }, () => { def('player_head', t => { t.fill([60, 40, 25]); t.noise([60, 40, 25], 12, 50); }); def('player_body', t => { t.noise([70, 150, 160], 16, 46); }); def('player_leg', t => { t.noise([60, 60, 140], 16, 48); }); def('player_arm', t => { t.noise(C.skin, 10, 51); }); });

  class Atlas {
    constructor() {
      this.size = SIZE; this.tile = T; this.grid = GRID;
      this.data = new Uint8Array(SIZE * SIZE * 4);
      this.tiles = {};
      this.list = [];
      let i = 0;
      for (const name of Object.keys(gens)) {
        const t = new Tile(M.hashInt(i, 7, 3, 1999));
        gens[name](t);
        const tx = (i % GRID) * T, ty = Math.floor(i / GRID) * T;
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const s = (y * T + x) * 4, d = ((ty + y) * SIZE + tx + x) * 4; this.data[d] = t.px[s]; this.data[d + 1] = t.px[s + 1]; this.data[d + 2] = t.px[s + 2]; this.data[d + 3] = t.px[s + 3]; }
        this.tiles[name] = i; this.list.push(name); i++;
      }
      this.count = i;
    }
    index(name) { const i = this.tiles[name]; if (i === undefined) throw new Error('no texture ' + name); return i; }
    uv(name) { const i = this.index(name), u = (i % GRID) / GRID, v = Math.floor(i / GRID) / GRID; return [u, v, u + 1 / GRID, v + 1 / GRID]; }
    pixel(name, x, y) { const i = this.index(name), tx = (i % GRID) * T + x, ty = Math.floor(i / GRID) * T + y, d = (ty * SIZE + tx) * 4; return [this.data[d], this.data[d + 1], this.data[d + 2], this.data[d + 3]]; }
    average(name) { let r = 0, g = 0, b = 0, n = 0; for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const p = this.pixel(name, x, y); if (p[3] < 40) continue; r += p[0]; g += p[1]; b += p[2]; n++; } return n ? [r / n, g / n, b / n] : [0, 0, 0]; }
  }

  function faceTexture(block, face) {
    const t = block.tex;
    if (typeof t === 'string') return t;
    if (face === 'top') return t.top || t.side;
    if (face === 'bottom') return t.bottom || t.top || t.side;
    if (face === 'front') return t.front || t.side;
    return t.side;
  }

  Object.assign(M, { Atlas, faceTexture, TILE: T, ATLAS_GRID: GRID, ATLAS_SIZE: SIZE });
})(globalThis.Mc98 = globalThis.Mc98 || {});
