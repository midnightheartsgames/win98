(function (C) {
  'use strict';
  const A = C.ASSET;

  const FILES = {
    cats32: 'Sprites1.png',
    animals: 'Sprites2.png',
    cats48: 'd2Uw9Pn.png',
    birds: 'Birds.png',
    coin: '24-color.png',
    fish: 'Fish.gif',
    topey: 'cat_sprite_sheet_by_inkybiscuits-da4qnkv.png',
    tiles: 'GrassLand/Terrain/Grassland_Terrain_Tileset.png',
    g_bg1: 'GrassLand/Background/GrassLand_Background_1.png',
    g_bg2: 'GrassLand/Background/GrassLand_Background_2.png',
    g_bg3: 'GrassLand/Background/GrassLand_Background_3.png',
    g_bg4: 'GrassLand/Background/GrassLand_Background_4.png',
    g_cloud1: 'GrassLand/Background/GrassLand_Cloud_1.png',
    g_cloud2: 'GrassLand/Background/GrassLand_Cloud_2.png',
    g_butterfly: 'GrassLand/Details/Animated/GrassLand_Butterfly.png',
    g_bubbles: 'GrassLand/Details/Animated/GrassLand_WaterBubbles.png',
    g_water: 'GrassLand/Details/Animated/GrassLand_WaterSurfaceAnim.png',
    g_bush: 'GrassLand/Details/GrassLand_Bush.png',
    g_entry4: 'GrassLand/Details/GrassLand_Entry_4.png',
    g_flower: 'GrassLand/Details/GrassLand_Flower.png',
    g_grass1: 'GrassLand/Details/GrassLand_Grass_1.png',
    g_grass2: 'GrassLand/Details/GrassLand_Grass_2.png',
    g_grass3: 'GrassLand/Details/GrassLand_Grass_3.png',
    g_grass4: 'GrassLand/Details/GrassLand_Grass_4.png',
    g_stone1: 'GrassLand/Details/GrassLand_Stone_1.png',
    g_stone2: 'GrassLand/Details/GrassLand_Stone_2.png',
    g_stone3: 'GrassLand/Details/GrassLand_Stone_3.png',
    g_tree: 'GrassLand/Details/GrassLand_Tree.png',
    m_bg: 'parallax_mountain_pack/layers/parallax-mountain-bg.png',
    m_far: 'parallax_mountain_pack/layers/parallax-mountain-montain-far.png',
    m_mount: 'parallax_mountain_pack/layers/parallax-mountain-mountains.png',
    m_trees: 'parallax_mountain_pack/layers/parallax-mountain-trees.png',
    m_fg: 'parallax_mountain_pack/layers/parallax-mountain-foreground-trees.png',
    i_bg: 'parallax-industrial-web/layers/skill-desc_0003_bg.png',
    i_far: 'parallax-industrial-web/layers/skill-desc_0002_far-buildings.png',
    i_build: 'parallax-industrial-web/layers/skill-desc_0001_buildings.png',
    i_fg: 'parallax-industrial-web/layers/skill-desc_0000_foreground.png',
    c_far: 'cyberpunk-street-files/PNG/layers/far-buildings.png',
    c_back: 'cyberpunk-street-files/PNG/layers/back-buildings.png',
    c_fg: 'cyberpunk-street-files/PNG/layers/foreground.png'
  };

  const PALETTES = {
    meadow: null,
    mountain: { '7e2553': '3b2a4a', 'ab5236': '5d4466', 'ffa300': '9a7ba0', '008751': 'b9abd0', '00e756': 'f6eefa', '1d2b53': '1a1226', '29adff': '7fb8d8', '5f574f': '4a3d55', 'fff024': 'ffffff', 'fff1e8': 'fff1e8', '83769c': '83769c', 'c2c3c7': 'c2c3c7' },
    site: { '7e2553': '262d31', 'ab5236': '414b4f', 'ffa300': 'c8702c', '008751': '4c6a34', '00e756': '8fb055', '1d2b53': '12181c', '29adff': '6aa0a8', '5f574f': '30383c', 'fff024': 'f2d24a' },
    neon: { '7e2553': '1b1530', 'ab5236': '2d2249', 'ffa300': 'ff3f8e', '008751': '087f92', '00e756': '41f2ff', '1d2b53': '0b0a18', '29adff': 'ff5aa8', '5f574f': '3a3552', 'fff024': 'fff7a0' }
  };

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function loadImage(src) {
    return new Promise(resolve => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => resolve(null);
      im.src = src;
    });
  }

  async function gifFrames(src) {
    if (typeof ImageDecoder === 'undefined') { const im = await loadImage(src); return im ? [toCanvas(im)] : []; }
    try {
      const buf = await (await fetch(src)).arrayBuffer();
      const dec = new ImageDecoder({ data: buf, type: 'image/gif' });
      await dec.tracks.ready;
      const n = dec.tracks.selectedTrack.frameCount;
      const out = [];
      for (let i = 0; i < n; i++) {
        const r = await dec.decode({ frameIndex: i });
        const c = canvas(r.image.displayWidth, r.image.displayHeight);
        c.getContext('2d').drawImage(r.image, 0, 0);
        r.image.close();
        out.push(c);
      }
      return out;
    } catch (e) { const im = await loadImage(src); return im ? [toCanvas(im)] : []; }
  }

  function toCanvas(im) {
    const c = canvas(im.width, im.height);
    c.getContext('2d').drawImage(im, 0, 0);
    return c;
  }

  const hex = h => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];

  function recolor(src, map) {
    const c = toCanvas(src);
    if (!map) return c;
    const g = c.getContext('2d');
    const d = g.getImageData(0, 0, c.width, c.height);
    const lut = new Map();
    for (const k in map) { const a = hex(k), b = hex(map[k]); lut.set((a[0] << 16) | (a[1] << 8) | a[2], b); }
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      if (!px[i + 3]) continue;
      const v = lut.get((px[i] << 16) | (px[i + 1] << 8) | px[i + 2]);
      if (v) { px[i] = v[0]; px[i + 1] = v[1]; px[i + 2] = v[2]; }
    }
    g.putImageData(d, 0, 0);
    return c;
  }

  function mapPixels(src, fn) {
    const c = toCanvas(src);
    const g = c.getContext('2d');
    const d = g.getImageData(0, 0, c.width, c.height);
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      if (!px[i + 3]) continue;
      const r = fn(px[i], px[i + 1], px[i + 2], px[i + 3]);
      if (r) { px[i] = r[0]; px[i + 1] = r[1]; px[i + 2] = r[2]; if (r[3] !== undefined) px[i + 3] = r[3]; }
    }
    g.putImageData(d, 0, 0);
    return c;
  }

  function crop(src, x, y, w, h) {
    const c = canvas(w, h);
    c.getContext('2d').drawImage(src, x, y, w, h, 0, 0, w, h);
    return c;
  }

  function flipH(src) {
    const c = canvas(src.width, src.height);
    const g = c.getContext('2d');
    g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    return c;
  }

  function silhouette(src, rgb) {
    return mapPixels(src, () => rgb);
  }

  function sheetFrames(sheet, cell, bx, by) {
    const rows = [];
    for (let r = 0; r < 4; r++) {
      const row = [];
      for (let k = 0; k < 3; k++) row.push(crop(sheet, (bx * 3 + k) * cell, (by * 4 + r) * cell, cell, cell));
      rows.push(row);
    }
    return { down: rows[0], left: rows[1], right: rows[2], up: rows[3], cell };
  }

  function coinFrames(src) {
    const out = [];
    const g = toCanvas(src).getContext('2d');
    const d = g.getImageData(0, 0, src.width, src.height).data;
    for (let f = 0; f < 6; f++) {
      const c = canvas(16, 16);
      const cg = c.getContext('2d');
      const o = cg.createImageData(16, 16);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const sx = 5 + 120 * f + x * 6 + 3, sy = 52 + y * 6 + 3;
        const i = (sy * src.width + sx) * 4, j = (y * 16 + x) * 4;
        o.data[j] = d[i]; o.data[j + 1] = d[i + 1]; o.data[j + 2] = d[i + 2]; o.data[j + 3] = d[i + 3];
      }
      cg.putImageData(o, 0, 0);
      out.push(c);
    }
    return out;
  }

  function keyWhite(src) {
    const c = toCanvas(src);
    const g = c.getContext('2d');
    const w = c.width, h = c.height;
    const d = g.getImageData(0, 0, w, h);
    const px = d.data;
    const seen = new Uint8Array(w * h);
    const stack = [];
    const isBg = i => px[i * 4] > 225 && px[i * 4 + 1] > 225 && px[i * 4 + 2] > 225;
    for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x); }
    for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1); }
    while (stack.length) {
      const i = stack.pop();
      if (seen[i] || !isBg(i)) continue;
      seen[i] = 1;
      px[i * 4 + 3] = 0;
      const x = i % w, y = (i / w) | 0;
      if (x > 0) stack.push(i - 1);
      if (x < w - 1) stack.push(i + 1);
      if (y > 0) stack.push(i - w);
      if (y < h - 1) stack.push(i + w);
    }
    g.putImageData(d, 0, 0);
    return c;
  }

  function trim(src) {
    const g = src.getContext('2d');
    const d = g.getImageData(0, 0, src.width, src.height).data;
    let x0 = src.width, y0 = src.height, x1 = -1, y1 = -1;
    for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
      if (d[(y * src.width + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return src;
    return crop(src, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  }

  function orangeTopey(src) {
    return mapPixels(src, (r, g, b) => {
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn > 26) return null;
      const l = (r + g + b) / 3;
      if (l < 40) return [l * 0.9 + 18, l * 0.55 + 8, l * 0.35 + 6];
      if (l > 215) return [255, 246, 228];
      const t = (l - 40) / 175;
      return [Math.round(150 + t * 105), Math.round(62 + t * 128), Math.round(22 + t * 84)];
    });
  }

  function px(w, h, rows, pal) {
    const c = canvas(w, h);
    const g = c.getContext('2d');
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const k = row[x];
        if (k === '.' || k === ' ' || !pal[k]) continue;
        g.fillStyle = pal[k];
        g.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  const GLYPHS = {
    'А': '010101111101101', 'Б': '111100110101110', 'В': '110101110101110', 'Г': '111100100100100', 'Д': '011101101111101',
    'Е': '111100110100111', 'Ж': '101111010111101', 'З': '110001010001110', 'И': '101101111111101', 'К': '101110100110101',
    'Л': '011101101101101', 'М': '101111111101101', 'Н': '101101111101101', 'О': '010101101101010', 'П': '111101101101101',
    'Р': '110101110100100', 'С': '011100100100011', 'Т': '111010010010010', 'У': '101101011001110', 'Ф': '010111111010010',
    'Х': '101101010101101', 'Ц': '101101101111001', 'Ч': '101101011001001', 'Ш': '101101111111111', 'Ы': '101101111111111',
    'Ь': '100100110101110', 'Э': '110001011001110', 'Ю': '101111111111101', 'Я': '011101011101101', 'B': '110101110101110',
    'A': '010101111101101', 'R': '110101110101101', 'C': '011100100100011', 'O': '010101101101010', 'F': '111100110100100',
    'E': '111100110100111', 'T': '111010010010010', 'K': '101110100110101', 'I': '111010010010111', 'S': '011100010001110',
    'N': '101111111111101', 'L': '100100100100111', 'P': '110101110100100', 'M': '101111111101101', 'H': '101101111101101',
    '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001',
    '5': '111100110001110', '6': '011100110101010', '7': '111001010010010', '8': '010101010101010', '9': '010101011001110',
    ' ': '000000000000000', '-': '000000111000000', '!': '010010010000010', '.': '000000000000010', '%': '101001010100101'
  };
  GLYPHS['Ы'] = '101101111111111';
  GLYPHS['Ш'] = '101101111111111';

  function microText(g, text, x, y, color) {
    g.fillStyle = color;
    let cx = x;
    for (const ch of text.toUpperCase()) {
      const gl = GLYPHS[ch] || GLYPHS[' '];
      for (let i = 0; i < 15; i++) if (gl[i] === '1') g.fillRect(cx + (i % 3), y + ((i / 3) | 0), 1, 1);
      cx += 4;
    }
    return cx - x - 1;
  }

  function makeBox(open) {
    const rows = open ? [
      '..k..........k..',
      '.kyk........kyk.',
      'kyyyk......kyyyk',
      '.kyyykkkkkkyyyk.',
      '..kooooooooook..',
      '..kOOOOOOOOOOk..',
      '..kooooooooook..',
      '..kooookkooook..',
      '..kooooooooook..',
      '..koooookoooook.',
      '..kOOOOOOOOOOOk.',
      '..kkkkkkkkkkkkk.'
    ] : [
      '................',
      '................',
      '..kkkkkkkkkkkk..',
      '..kyyyyyyyyyyk..',
      '..kOOOOOkOOOOk..',
      '..kooooooooook..',
      '..kooooooooook..',
      '..kooookkooook..',
      '..kooooooooook..',
      '..kooooooooook..',
      '..kOOOOOOOOOOk..',
      '..kkkkkkkkkkkk..'
    ];
    return px(16, 12, rows, { k: '#3b2410', o: '#c8894a', O: '#a86a34', y: '#e2aa64' });
  }

  function makeMilk() {
    return px(12, 10, [
      '............',
      '...wwwwww...',
      '..wWWWWWWw..',
      '.kwwwwwwwwk.',
      '.kbbbbbbbbk.',
      '.kBbbbbbbBk.',
      '..kBBBBBBk..',
      '...kkkkkk...',
      '............',
      '............'
    ], { k: '#1d2b53', w: '#fff1e8', W: '#ffffff', b: '#3a7bd5', B: '#2858a8' });
  }

  function makeSign() {
    return px(16, 16, [
      '................',
      '.kkkkkkkkkkkkkk.',
      '.kyyyyyyyyyyyyk.',
      '.kyoooooooooooyk',
      '.kyoooooooooooyk',
      '.kyoooooooooooyk',
      '.kyyyyyyyyyyyyk.',
      '.kkkkkkkkkkkkkk.',
      '.......kk.......',
      '.......kb.......',
      '.......kb.......',
      '.......kb.......',
      '.......kb.......',
      '.......kb.......',
      '......kkbk......',
      '................'
    ].map(r => r.slice(0, 16)), { k: '#3b2410', y: '#c8894a', o: '#e2aa64', b: '#7a4a24' });
  }

  function makeSpikes(theme) {
    const c = canvas(16, 16);
    const g = c.getContext('2d');
    const col = { meadow: ['#008751', '#00e756', '#1d2b53'], mountain: ['#9a8bb8', '#f6eefa', '#2b1d38'], site: ['#7a8288', '#d8dde0', '#1a1e22'], neon: ['#087f92', '#41f2ff', '#0b0a18'] }[theme] || ['#888', '#eee', '#222'];
    for (let i = 0; i < 4; i++) {
      const x0 = i * 4;
      for (let y = 0; y < 8; y++) {
        const half = Math.floor((y + 1) / 2);
        g.fillStyle = col[2];
        g.fillRect(x0 + 2 - half - (y === 7 ? 0 : 0), 8 + y, half * 2 || 1, 1);
        g.fillStyle = y < 3 ? col[1] : col[0];
        if (half > 0) g.fillRect(x0 + 2 - half + 1, 8 + y, Math.max(1, half * 2 - 2), 1);
        else g.fillRect(x0 + 1, 8 + y, 1, 1);
      }
    }
    return c;
  }

  function makeCage() {
    const c = canvas(24, 24);
    const g = c.getContext('2d');
    g.fillStyle = '#3a3552'; g.fillRect(0, 0, 24, 3); g.fillRect(0, 21, 24, 3);
    g.fillStyle = '#8f8aa8'; g.fillRect(1, 1, 22, 1); g.fillRect(1, 22, 22, 1);
    for (let x = 1; x < 24; x += 4) { g.fillStyle = '#2a263c'; g.fillRect(x, 3, 2, 18); g.fillStyle = '#b8b4cc'; g.fillRect(x, 3, 1, 18); }
    g.fillStyle = '#ffd34a'; g.fillRect(10, 11, 4, 5); g.fillStyle = '#8a5a10'; g.fillRect(11, 13, 2, 2);
    return c;
  }

  function makeVan(snow, left) {
    const c = canvas(72, 58);
    const g = c.getContext('2d');
    const f = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    f('#1a1630', 3, 18, 68, 34);
    f('#e8e4ee', 4, 19, 66, 31);
    f('#c2bfd0', 4, 44, 66, 6);
    f('#1a1630', 52, 22, 17, 13);
    f('#7fd0ff', 54, 24, 13, 9);
    f('#bff0ff', 55, 25, 4, 3);
    f('#2a58c8', 4, 36, 47, 5);
    f('#ffd34a', 68, 40, 3, 4);
    f('#ff4a4a', 3, 38, 2, 4);
    f('#3a3552', 4, 50, 66, 3);
    f('#1a1630', 46, 19, 1, 31);
    f('#1a1630', 26, 6, 26, 13);
    f('#5a5570', 27, 7, 24, 11);
    if (snow) g.drawImage(snow, 22, -7);
    for (let x = 28; x < 52; x += 4) { f('#2a263c', x, 6, 2, 13); f('#c8c4dc', x, 6, 1, 13); }
    f('#3a3552', 26, 5, 26, 2);
    f('#3a3552', 26, 17, 26, 2);
    if (!left) { microText(g, 'ОТЛОВ', 8, 27, '#2a58c8'); return c; }
    const m = flipH(c);
    microText(m.getContext('2d'), 'ОТЛОВ', 45, 27, '#2a58c8');
    return m;
  }

  function makeWheel(k) {
    const c = canvas(12, 12);
    const g = c.getContext('2d');
    g.fillStyle = '#121018'; g.beginPath(); g.arc(6, 6, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#6a6680'; g.fillRect(4, 4, 4, 4);
    g.fillStyle = '#b8b4cc';
    if (k % 2) g.fillRect(5, 2, 2, 8); else g.fillRect(2, 5, 8, 2);
    return c;
  }

  function makeCar(tint) {
    const body = ['#d8463a', '#3a8ad8', '#e8c43a'][tint % 3];
    const dark = ['#8a2018', '#1e4f8a', '#9a7a18'][tint % 3];
    return px(40, 15, [
      '........kkkkkkkkkkkkkkk.................',
      '.......kbbbbbbbbbbbbbbbk................',
      '......kbcccckbbcccccckbbk...............',
      '.....kbbcccckbbccccccckbbk..............',
      'kkkkkbbbbbbbkbbbbbbbbbbkbbkkkkkkkkkkk...',
      'kyybbbbbbbbbkbbbbbbbbbbbbbbbbbbbbbbbbk..',
      'kyybbbbbbbbbkbbbbbbbbbbbbbbbbbbbbbbbrrk.',
      'kbbbbbbbbbbbkbbbbbbbbbbbbbbbbbbbbbbbbbk.',
      'kddddddddddddddddddddddddddddddddddddddk',
      'kddkkkkddddddddddddddddddddkkkkddddddddk',
      '.kkwwwwkkkkkkkkkkkkkkkkkkkkwwwwkkkkkkkk.',
      '..kwggwk...................kwggwk.......',
      '..kwggwk...................kwggwk.......',
      '...kwwk.....................kwwk........',
      '................................................'
    ].map(r => r.slice(0, 40)), { k: '#120e1c', b: body, d: dark, c: '#7fd0ff', y: '#fff7a0', r: '#ff3a3a', w: '#2a2838', g: '#8a86a0' });
  }

  function makeVent() {
    const c = canvas(16, 16);
    const g = c.getContext('2d');
    g.fillStyle = '#12181c'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#414b4f'; g.fillRect(1, 1, 14, 14);
    g.fillStyle = '#8a969c'; g.fillRect(1, 1, 14, 1);
    g.fillStyle = '#12181c';
    for (let x = 2; x < 14; x += 3) g.fillRect(x, 2, 2, 4);
    g.fillStyle = '#30383c'; g.fillRect(1, 8, 14, 7);
    g.fillStyle = '#f2d24a'; for (let x = 1; x < 15; x += 4) g.fillRect(x, 8, 2, 2);
    return c;
  }

  function makeFan(k) {
    const c = canvas(16, 16);
    const g = c.getContext('2d');
    g.fillStyle = '#0b0a18'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#3a3552'; g.fillRect(1, 1, 14, 14);
    g.fillStyle = '#1b1530'; g.fillRect(2, 2, 12, 12);
    g.fillStyle = '#41f2ff';
    if (k % 2) { g.fillRect(3, 7, 10, 2); g.fillRect(7, 3, 2, 10); }
    else { for (let i = 0; i < 8; i++) { g.fillRect(3 + i, 3 + i, 2, 1); g.fillRect(11 - i, 3 + i, 2, 1); } }
    g.fillStyle = '#ff3f8e'; g.fillRect(7, 7, 2, 2);
    return c;
  }

  function makeDropper() {
    return px(16, 16, [
      'kkkkkkkkkkkkkkkk',
      'kooooooooooooook',
      'kokkkkkkkkkkkkok',
      '.ko..........ok.',
      '..k..........k..',
      '..kk........kk..',
      '...kmmmmmmmmk...',
      '...kbbbbbbbbk...',
      '...kbBbbBbbbk...',
      '...kbbbbbbbbk...',
      '...kkkkkkkkkk...',
      '................',
      '................',
      '................',
      '................',
      '................'
    ], { k: '#12181c', o: '#f2d24a', m: '#8a969c', b: '#b5562e', B: '#d8784a' });
  }

  function makeBrick() {
    return px(10, 8, [
      'kkkkkkkkkk',
      'kbbbbkbbbk',
      'kbBbbkbBbk',
      'kkkkkkkkkk',
      'kbbkbbbbbk',
      'kBbkbbBbbk',
      'kbbkbbbbbk',
      'kkkkkkkkkk'
    ], { k: '#4a1e10', b: '#b5562e', B: '#d8784a' });
  }

  function makeConveyor(k, dir) {
    const c = canvas(16, 16);
    const g = c.getContext('2d');
    g.fillStyle = '#12181c'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#30383c'; g.fillRect(0, 1, 16, 5);
    g.fillStyle = '#414b4f'; g.fillRect(0, 7, 16, 9);
    g.fillStyle = '#12181c'; for (let x = 2; x < 16; x += 6) g.fillRect(x, 10, 3, 3);
    g.fillStyle = '#f2d24a';
    for (let i = 0; i < 3; i++) {
      let x = ((i * 6 + k * dir) % 16 + 16) % 16;
      if (dir > 0) { g.fillRect(x, 2, 1, 3); g.fillRect(x + 1, 3, 1, 1); }
      else { g.fillRect(x + 1, 2, 1, 3); g.fillRect(x, 3, 1, 1); }
    }
    return c;
  }

  function makeNeonBar(on, color) {
    const c = canvas(16, 16);
    const g = c.getContext('2d');
    g.fillStyle = '#0b0a18'; g.fillRect(0, 0, 16, 6);
    g.fillStyle = on ? color : '#2d2249'; g.fillRect(1, 1, 14, 3);
    if (on) { g.fillStyle = '#ffffff'; g.fillRect(2, 2, 12, 1); }
    g.fillStyle = '#3a3552'; g.fillRect(3, 6, 2, 2); g.fillRect(11, 6, 2, 2);
    return c;
  }

  function makeSignNeon(text, color) {
    const w = text.length * 4 + 5;
    const c = canvas(w, 11);
    const g = c.getContext('2d');
    g.fillStyle = '#0b0a18'; g.fillRect(0, 0, w, 11);
    g.fillStyle = color; g.fillRect(1, 1, w - 2, 1); g.fillRect(1, 9, w - 2, 1); g.fillRect(1, 1, 1, 9); g.fillRect(w - 2, 1, 1, 9);
    microText(g, text, 3, 3, '#ffffff');
    return c;
  }

  function makeCrack() {
    return px(16, 16, [
      '................',
      '....k...........',
      '.....k......k...',
      '.....kk....k....',
      '......k...kk....',
      '.......k.k......',
      '........k.......',
      '.......kk.......',
      '......k..k......',
      '.....k....kk....',
      '....k.......k...',
      '...k............',
      '................',
      '................',
      '................',
      '................'
    ], { k: '#120a18' });
  }

  function makeCatHead(color, dark) {
    return px(9, 8, [
      'k.......k',
      'kok...kok',
      'koooooook',
      'koeoooeok',
      'koooooook',
      'kooonoook',
      '.koooook.',
      '..kkkkk..'
    ], { k: dark, o: color, e: '#1a1226', n: '#ff8aa0' });
  }

  function makeHeart() {
    return px(7, 6, [
      '.kk.kk.',
      'krrkrrk',
      'krrrrrk',
      '.krrrk.',
      '..krk..',
      '...k...'
    ], { k: '#1a1226', r: '#ff4a6a' });
  }

  async function load(onProgress) {
    const names = Object.keys(FILES).filter(k => k !== 'fish');
    const out = {};
    let done = 0;
    const total = names.length + 2;
    await Promise.all(names.map(async k => {
      out[k] = await loadImage(A + FILES[k]);
      done++;
      if (onProgress) onProgress(done / total);
    }));
    out.fishFrames = await gifFrames(A + FILES.fish);
    done++;
    if (onProgress) onProgress(done / total);
    if (typeof FontFace !== 'undefined' && typeof document !== 'undefined' && document.fonts) {
      try {
        const ff = new FontFace('CatnissVCR', `url(${A}12157.ttf)`);
        await ff.load();
        document.fonts.add(ff);
        out.font = true;
      } catch (e) { out.font = false; }
    }
    done++;
    if (onProgress) onProgress(1);
    return build(out);
  }

  function build(raw) {
    const S = { raw };
    S.ok = !!raw.cats32 && !!raw.tiles;
    S.font = raw.font ? 'CatnissVCR' : 'monospace';
    S.cats = {};
    const catDefs = Object.assign({ catniss: C.PLAYER_CAT }, C.SIBLINGS);
    for (const id in catDefs) {
      const d = catDefs[id];
      const sheet = raw[d.sheet];
      if (sheet) S.cats[id] = sheetFrames(sheet, 32, d.block[0], d.block[1]);
    }
    if (raw.cats48) {
      S.cats48 = {};
      const map48 = { snezhka: [0, 0], ugolek: [3, 0], pyatnashka: [2, 1], catniss: [3, 1], chernika: [1, 0] };
      for (const id in map48) S.cats48[id] = sheetFrames(raw.cats48, 48, map48[id][0], map48[id][1]);
    }
    if (raw.animals) {
      S.dog = sheetFrames(raw.animals, 32, 0, 0);
      S.hen = sheetFrames(raw.animals, 32, 2, 0);
      S.sheep = sheetFrames(raw.animals, 32, 3, 0);
      S.wolf = sheetFrames(raw.animals, 32, 2, 1);
      const recolorSheet = (fr, fn) => ({ down: fr.down.map(c => mapPixels(c, fn)), left: fr.left.map(c => mapPixels(c, fn)), right: fr.right.map(c => mapPixels(c, fn)), up: fr.up.map(c => mapPixels(c, fn)), cell: fr.cell });
      S.dogDark = recolorSheet(S.dog, (r, g, b) => { const l = (r + g + b) / 3; if (r > 150 && g < 80) return null; return l > 120 ? [Math.round(l * 0.32 + 10), Math.round(l * 0.26 + 8), Math.round(l * 0.22 + 10)] : [Math.round(l * 0.5), Math.round(l * 0.4), Math.round(l * 0.35)]; });
      S.dogGrey = recolorSheet(S.dog, (r, g, b) => { const l = (r + g + b) / 3; if (r > 150 && g < 80) return [60, 200, 230]; return [Math.round(l * 0.62), Math.round(l * 0.62), Math.round(l * 0.7)]; });
    }
    if (raw.birds) {
      S.birds = {};
      ['sparrow', 'cardinal', 'jay', 'dove'].forEach((n, i) => { S.birds[n] = sheetFrames(raw.birds, 48, i, 1); });
      const crow = fr => ({ left: fr.left.map(c => mapPixels(c, (r, g, b) => { const l = (r + g + b) / 3; return [Math.round(l * 0.22 + 14), Math.round(l * 0.2 + 12), Math.round(l * 0.3 + 22)]; })), right: fr.right.map(c => mapPixels(c, (r, g, b) => { const l = (r + g + b) / 3; return [Math.round(l * 0.22 + 14), Math.round(l * 0.2 + 12), Math.round(l * 0.3 + 22)]; })), cell: 48 });
      S.birds.crow = crow(S.birds.sparrow);
    }
    S.coin = raw.coin ? coinFrames(raw.coin) : [];
    S.fishFrames = raw.fishFrames || [];
    S.fishBags = [];
    if (S.fishFrames.length) {
      for (let i = 0; i < 12; i++) {
        const fx = (i % 6) * 62, fy = Math.floor(i / 6) * 99;
        S.fishBags.push(S.fishFrames.map(fr => crop(fr, fx, fy, 62, 99)));
      }
      S.fishSil = S.fishBags.map(fr => silhouette(crop(fr[0], 0, 0, 62, 80), [8, 24, 52]));
      S.fishSmall = S.fishBags.map(fr => fr.map(c => {
        const t = crop(c, 4, 0, 54, 78);
        const s = canvas(24, 34);
        const g = s.getContext('2d');
        g.imageSmoothingEnabled = true;
        g.imageSmoothingQuality = 'high';
        g.drawImage(t, 0, 0, 54, 78, 0, 0, 24, 34);
        return s;
      }));
    }
    S.tiles = {};
    if (raw.tiles) for (const th in PALETTES) S.tiles[th] = recolor(raw.tiles, PALETTES[th]);
    S.deco = {};
    const decoNames = ['g_bush', 'g_entry4', 'g_flower', 'g_grass1', 'g_grass2', 'g_grass3', 'g_grass4', 'g_stone1', 'g_stone2', 'g_stone3', 'g_tree', 'g_butterfly', 'g_water', 'g_bubbles'];
    for (const th in PALETTES) {
      S.deco[th] = {};
      for (const n of decoNames) if (raw[n]) S.deco[th][n] = recolor(raw[n], PALETTES[th]);
    }
    if (raw.topey) {
      const keyed = keyWhite(raw.topey);
      const grab = (x, y, w, h) => trim(orangeTopey(crop(keyed, x, y, w, h)));
      S.title = { front: [grab(416, 470, 88, 166), grab(580, 464, 88, 172), grab(741, 466, 89, 170)] };
    }
    S.box = [makeBox(false), makeBox(true)];
    S.milk = makeMilk();
    S.sign = makeSign();
    S.spikes = {};
    for (const th in PALETTES) S.spikes[th] = makeSpikes(th);
    S.cage = makeCage();
    const snowCat = S.cats.snezhka ? S.cats.snezhka.down[1] : null;
    S.vanBody = makeVan(snowCat);
    S.vanBodyL = makeVan(snowCat, true);
    S.vanEmpty = makeVan(null);
    S.vanEmptyL = makeVan(null, true);
    S.wheel = [makeWheel(0), makeWheel(1)];
    S.cars = [makeCar(0), makeCar(1), makeCar(2)];
    S.carsL = S.cars.map(flipH);
    S.vent = makeVent();
    S.fan = [makeFan(0), makeFan(1)];
    S.dropper = makeDropper();
    S.brick = makeBrick();
    S.conveyorR = [0, 1, 2, 3, 4, 5].map(k => makeConveyor(k, 1));
    S.conveyorL = [0, 1, 2, 3, 4, 5].map(k => makeConveyor(k, -1));
    S.neonA = [makeNeonBar(false, '#ff3f8e'), makeNeonBar(true, '#ff3f8e')];
    S.neonB = [makeNeonBar(false, '#41f2ff'), makeNeonBar(true, '#41f2ff')];
    S.neonSigns = [makeSignNeon('КОРМ', '#ff3f8e'), makeSignNeon('КОТ', '#41f2ff'), makeSignNeon('МОЛОКО', '#fff7a0'), makeSignNeon('BAR', '#ff3f8e'), makeSignNeon('24', '#41f2ff'), makeSignNeon('СУШИ', '#ff8a3a')];
    S.crack = makeCrack();
    S.heart = makeHeart();
    S.head = {
      catniss: makeCatHead('#f0a040', '#5a2a08'), ugolek: makeCatHead('#3a3640', '#0a0810'), chernika: makeCatHead('#28306a', '#0a0c20'),
      pyatnashka: makeCatHead('#f4f0ec', '#5a4a40'), snezhka: makeCatHead('#ffffff', '#6a6080')
    };
    S.flipH = flipH;
    S.microText = microText;
    return S;
  }

  C.Assets = { load, FILES, PALETTES, canvas, crop, recolor, flipH, microText };
})(globalThis.Catniss = globalThis.Catniss || {});
