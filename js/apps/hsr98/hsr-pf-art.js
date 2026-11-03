(function (H) {
  'use strict';
  const G = H.Gfx;

  G.FOE_ART.pf_trotter = G.FOE_ART.trotter;
  G.FOE_META.pf_trotter = G.FOE_META.trotter;

  const RAMP = [[14, 42, 106], [63, 127, 216], [168, 220, 255], [255, 255, 255]];
  const RIM_GHOST = [200, 238, 255, 230], RIM_FIRE = [255, 176, 48, 255];
  const cache = new Map();

  function rampColor(v) {
    const p = Math.min(0.999, Math.max(0, v)) * (RAMP.length - 1), i = Math.floor(p), f = p - i, a = RAMP[i], b = RAMP[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }

  function outsideMask(src, n) {
    const hole = new Uint8Array(n * n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (src[(y * n + x) * 4 + 3] > 40) continue;
      const near = (x > 0 && src[(y * n + x - 1) * 4 + 3] > 40) || (x < n - 1 && src[(y * n + x + 1) * 4 + 3] > 40) || (y > 0 && src[((y - 1) * n + x) * 4 + 3] > 40) || (y < n - 1 && src[((y + 1) * n + x) * 4 + 3] > 40);
      if (near) hole[y * n + x] = 1;
    }
    return hole;
  }

  function ghostCanvas(id, n, f) {
    const key = 'g|' + id + '|' + n + '|' + f;
    let out = cache.get(key);
    if (out) return out;
    out = G.mkCanvas(n, n);
    const g = out.getContext('2d');
    g.drawImage(G.foeCanvas(id, n, f), 0, 0);
    const img = g.getImageData(0, 0, n, n), d = img.data, edge = outsideMask(d.slice(), n);
    for (let i = 0; i < n * n; i++) {
      const p = i * 4;
      if (edge[i]) { d[p] = RIM_GHOST[0]; d[p + 1] = RIM_GHOST[1]; d[p + 2] = RIM_GHOST[2]; d[p + 3] = RIM_GHOST[3]; continue; }
      if (!d[p + 3]) continue;
      const c = rampColor(0.18 + (0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]) / 255 * 0.82);
      d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2];
    }
    g.putImageData(img, 0, 0);
    cache.set(key, out);
    return out;
  }

  function rimCanvas(id, n, f) {
    const key = 'r|' + id + '|' + n + '|' + f;
    let out = cache.get(key);
    if (out) return out;
    out = G.mkCanvas(n, n);
    const g = out.getContext('2d');
    g.drawImage(G.foeCanvas(id, n, f), 0, 0);
    const img = g.getImageData(0, 0, n, n), d = img.data, edge = outsideMask(d.slice(), n);
    for (let i = 0; i < n * n; i++) {
      const p = i * 4;
      d[p] = RIM_FIRE[0]; d[p + 1] = RIM_FIRE[1]; d[p + 2] = RIM_FIRE[2]; d[p + 3] = edge[i] ? RIM_FIRE[3] : 0;
    }
    g.putImageData(img, 0, 0);
    cache.set(key, out);
    return out;
  }

  const ICONS = {
    erupt: { pal: { W: '#ffffff', Y: '#ffe08a', O: '#ff9a3c', R: '#e04830', D: '#2a1c3c', K: '#4a3460' }, rows: [
      '.......W........', '..Y....W....Y...', '...O..WYW..O....', '....O.WYW.O.....', '.....WYYYW......', '..Y..WYOYW..Y...', '...WWYOOOYWW....', '....WYORROYW....',
      '.....YORRROY....', '....WOORRROOW...', '...DDDDRRRDDDD..', '..DDKKKRRRKKKDD.', '.DDKKKKKRKKKKKDD', '.DKKKKKKRKKKKKKD', '.DDDDDDDDDDDDDDD', '................'
    ] },
    excite: { pal: { T: '#1a7a70', W: '#f0fff8', G: '#6adcb0', S: '#ffe08a' }, rows: [
      '............TT..', '...........TWT..', '..S.......TWWT..', '.........TWWGT..', '........TWWGT...', '.......TWWGT..S.', '......TWWGGT....', '.....TWWGGT.....',
      '....TWWGGT......', '....TWGGT.....S.', '...TWGGT........', '...TGGT...S.....', '..T.TT..........', '.T..............', 'T...............', '................'
    ] },
    rupture: { pal: { L: '#8a6ac8', W: '#f0ecff', B: '#6a7ab8', V: '#3a2070' }, rows: [
      'LLLLLLLVVLLLLLLL', 'LWWWWWLVVLWWWWWL', 'LWBBBWWLVVLWBBWL', 'LWWWWWWLVVLWWWWL', 'LWBBBBWWLVVLBBWL', 'LWWWWWWWLVVLWWWL', 'LWBBBBWLVVLWBBWL', 'LWWWWWLVVLWWWWWL',
      'LWBBBWLVVLWBBBWL', 'LWWWWWWLVVLWWWWL', 'LWBBBBWWLVVLBBWL', 'LWWWWWWWLVVLWWWL', 'LWBBBBWLVVLWBBWL', 'LWWWWWLVVLWWWWWL', 'LLLLLLLVVLLLLLLL', '................'
    ] },
    slander: { pal: { G: '#4a8a5a', W: '#f0fff0', B: '#7a9a80', P: '#b060e0' }, rows: [
      '..GGGGGGGGGGGG..', '.GWWWWWWWWWWWWG.', 'GWWBBWBBBWBBWWWG', 'GWWWWWWWWWWWWWWG', 'GWBBBWBBWWBBBWWG', 'GWWWWWWWWWWWWWWG', '.GWWWWWWWWWWWWG.', '..GGGGGGGGGGGG..',
      '.....GWWG.......', '.....GWG..P.....', '.....GG..PPP....', '.........PPP....', '....P.....P..P..', '...PPP......PPP.', '...PPP......PPP.', '....P........P..'
    ] },
    rumor: { pal: { C: '#7ad8c8', W: '#ffffff' }, rows: [
      '................', '....CCCCC.......', '...C.....C......', '.........C......', '.......CC.......', 'WCCCCCC.........', '................', 'WCCCCCCCCCCC....',
      '............C...', '..........C.C...', '...........C....', 'WCCCCCC.........', '.......CC.......', '.........C......', '.....C...C......', '......CCC.......'
    ] },
    defame: { pal: { R: '#a02848', P: '#ff7a9a', W: '#fff0d8' }, rows: [
      '...RRR....RRR..W', '..RPPPR..RPPRWW.', '.RPPPPPRRPPPWWR.', '.RPPPPPPPPPWWPR.', '.RPPPPPPPPWWPPR.', '.RPPPPPPPWWPPPR.', '..RPPPPPWWPPPR..', '...RPPPWWPPPR...',
      '....RPWWPPPR....', '.....WWPPPR.....', '....WWRPPR......', '...WW..RR.......', '..WW............', '.W..............', '................', '................'
    ] }
  };

  const EMBLEMS = {
    s1: ['.........WW...', '........WWWW..', '.......WWWLW..', '......WWWWWWLL', '.....WWWWWW.L.', '....LWWWWW....', '...LLLWWWW....', '..LLLLLWW.....', '.LLLLLLW......', 'LLLLLLWW......', '....LWWW......', '....W.W.......', '...WW.WW......', '..............'],
    s2: ['.....WWWW.....', '....W.LL.W....', '...W..LL..W...', '..W...LL...W..', '.WLLLLLLLLLLW.', '.W.L..L..L..W.', '.W.L.WWW.L..W.', '.W.LWWWWWL..W.', '.W.L.WWW.L..W.', '.W.L..W..L..W.', '.W.L..L..L..W.', '.WLLLLLLLLLLW.', '..............', '..............']
  };

  const WING = ['W...............', 'WW..............', 'WLW.............', 'WLLW............', '.WLLWW..........', '.WLLLLWW........', '..WLLLLLWWW.....', '...WLLLLLLLWWW..', '....WWLLLLLLLLWD', '......WWLLLLLLDD', '.......WLLLLLDDD', '........WWLLDDDD', '..........WWDDDD', '............WDDD'];

  function sprite(key, rows, pal) {
    let cv = cache.get(key);
    if (cv) return cv;
    cv = G.mkCanvas(rows[0].length, rows.length);
    const g = cv.getContext('2d');
    rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== '.') { g.fillStyle = pal[row[x]]; g.fillRect(x, y, 1, 1); } });
    cache.set(key, cv);
    return cv;
  }

  function blit(c, cv, x, y, scale) {
    const was = c.imageSmoothingEnabled;
    c.imageSmoothingEnabled = false;
    c.drawImage(cv, Math.round(x), Math.round(y), cv.width * scale, cv.height * scale);
    c.imageSmoothingEnabled = was;
  }

  function shieldCanvas(id) {
    const key = 'shield|' + id;
    let cv = cache.get(key);
    if (cv) return cv;
    const w = 26, h = 30;
    cv = G.mkCanvas(w, h);
    const g = cv.getContext('2d'), halfAt = y => (y < 18 ? 13 : Math.max(1, Math.round(13 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 17) / 13, 2))))));
    for (let y = 0; y < h; y++) {
      const half = halfAt(y);
      g.fillStyle = '#ffe08a'; g.fillRect(13 - half, y, half * 2, 1);
      if (y > 0 && y < h - 1 && half > 1) { g.fillStyle = y < 15 ? '#16245e' : '#0c1440'; g.fillRect(14 - half, y, half * 2 - 2, 1); }
    }
    g.drawImage(sprite('emb|' + id, EMBLEMS[id], { W: '#e8f0ff', L: '#7ac8ff' }), 6, 7);
    cache.set(key, cv);
    return cv;
  }

  G.pfIconList = () => Object.keys(ICONS);
  G.pfIconRows = id => ICONS[id].rows;
  G.pfEmblemRows = id => EMBLEMS[id];
  G.pfIcon = (c, id, x, y, scale) => blit(c, sprite('icon|' + id, ICONS[id].rows, ICONS[id].pal), x, y, scale || 2);
  G.pfShield = (c, id, x, y, scale) => blit(c, shieldCanvas(id), x, y, scale || 2);
  G.pfWings = (c, x, y, scale) => {
    const s = scale || 2, pal = { W: '#e8f0ff', L: '#7ac8ff', D: '#3a7ad8' }, half = sprite('wing', WING, pal), other = sprite('wing2', WING.map(r => r.split('').reverse().join('')), pal);
    blit(c, half, x, y, s);
    blit(c, other, x + half.width * s, y, s);
    c.fillStyle = '#ffe08a'; c.fillRect(Math.round(x + half.width * s - s), Math.round(y + 6 * s), s * 2, s * 6);
    c.fillStyle = '#ffffff'; c.fillRect(Math.round(x + half.width * s - s), Math.round(y + 6 * s), s, s * 3);
  };

  const drawEnemy0 = G.drawEnemy;
  G.drawEnemy = function (ctx, data, x, y, size, opts = {}) {
    if (!data || !(data.pfGhost || data.pfRim)) return drawEnemy0(ctx, data, x, y, size, opts);
    const id = G.foeId(data), m = G.FOE_META[id] || {}, n = Math.max(12, Math.round(size / 2)), dw = n * 2;
    const f = m.anim ? Math.floor((opts.t || 0) * 2.2) % 2 : 0, px = Math.round(x - dw / 2), py = Math.round(y - dw);
    const show = data.pfIn == null ? 1 : data.pfIn, alpha = opts.alpha == null ? 1 : opts.alpha, base = G.foeCanvas(id, n, f);
    ctx.save();
    if (show < 1) { ctx.beginPath(); ctx.rect(px - 2, py + dw * (1 - show) - 2, dw + 4, dw * show + 4); ctx.clip(); }
    const was = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    if (data.pfGhost) {
      ctx.globalAlpha = alpha * 0.92;
      ctx.drawImage(ghostCanvas(id, n, f), px, py, dw, dw);
    } else {
      ctx.globalAlpha = alpha * (0.85 + 0.15 * Math.sin((opts.t || 0) * 5));
      ctx.drawImage(rimCanvas(id, n, f), px, py, dw, dw);
      ctx.globalAlpha = alpha;
      ctx.drawImage(base, px, py, dw, dw);
    }
    if (opts.flash) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = opts.flash; ctx.drawImage(data.pfGhost ? ghostCanvas(id, n, f) : base, px, py, dw, dw); }
    ctx.imageSmoothingEnabled = was;
    ctx.restore();
  };

  function paintGlyph(g, x, y, s, seed) {
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (G.hash(seed, i * 7 + 3, j * 5 + 1) > 0.48) g.fillRect(x + i * s, y + j * s, s, s);
  }

  function paintBattleSky(g, w, hz) {
    const tint = g.createLinearGradient(0, 0, 0, hz);
    tint.addColorStop(0, 'rgba(6,8,44,0.92)'); tint.addColorStop(0.7, 'rgba(26,28,96,0.7)'); tint.addColorStop(1, 'rgba(58,72,150,0.35)');
    g.fillStyle = tint; g.fillRect(0, 0, w, hz);
    for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(214,226,255,' + (0.25 + 0.6 * G.hash(i, 41, 3)).toFixed(2) + ')'; g.fillRect(Math.floor(G.hash(i, 42, 5) * w), Math.floor(G.hash(43, i, 7) * hz * 0.82), 1, 1); }
    g.lineWidth = 1;
    for (let r = 0; r < 5; r++) {
      g.strokeStyle = 'rgba(130,150,255,' + (0.2 - r * 0.03).toFixed(2) + ')';
      g.beginPath();
      for (let a = 0; a < 30; a++) {
        const t = a / 30 * Math.PI * 1.6 + r * 0.9, rad = (14 + r * 12) * (1 + t * 0.12), px = w * 0.66 + Math.cos(t) * rad * 1.5, py = hz * 0.3 + Math.sin(t) * rad * 0.62;
        if (a) g.lineTo(px, py); else g.moveTo(px, py);
      }
      g.stroke();
    }
  }

  function paintRibbons(g, w, hz) {
    const spots = [0.22, 0.31, 0.42, 0.58, 0.78, 0.9];
    spots.forEach((sx, i) => {
      const x = Math.round(w * sx), len = Math.round(hz * (0.34 + G.hash(i, 51, 2) * 0.3));
      g.fillStyle = 'rgba(18,24,70,0.6)'; g.fillRect(x - 5, 0, 10, len);
      g.fillStyle = 'rgba(150,240,220,0.8)';
      for (let y = 4, k = 0; y < len - 6; y += 10, k++) paintGlyph(g, x - 3, y, 2, i * 19 + k);
    });
  }

  function paintTree(g, w, hz) {
    const x = Math.round(w * 0.44), base = hz + 2;
    g.fillStyle = '#080a26';
    g.fillRect(x - 3, base - 58, 7, 58);
    for (const [dx, dy, len, up] of [[-2, -44, 30, 14], [3, -50, 34, 16], [-1, -36, 22, 6], [2, -30, 24, 8]]) {
      const dir = dx < 0 ? -1 : 1;
      for (let i = 0; i < len; i++) g.fillRect(x + dx + dir * i, base + dy - Math.round(i * up / len), 3, 2);
    }
    const blobs = [[-30, -62, 19], [-14, -74, 20], [8, -78, 21], [30, -68, 19], [-40, -50, 12], [42, -54, 13], [0, -60, 15]];
    g.fillStyle = '#123f58';
    for (const [bx, by, r] of blobs) for (let dy = -r; dy <= r; dy++) {
      const half = Math.round(Math.sqrt(r * r - dy * dy) * 1.25), row = Math.round(dy * 0.8);
      g.fillRect(x + bx - half, base + by + row, half * 2, 1);
    }
    blobs.forEach(([bx, by, r], b) => {
      for (let i = 0; i < r * 4; i++) {
        const a = G.hash(b, i, 61) * Math.PI * 2, d = Math.sqrt(G.hash(i, b, 62)) * r, tone = G.hash(i, 63, b);
        g.fillStyle = tone > 0.86 ? '#cfe8a4' : tone > 0.5 ? '#5fb69a' : '#2f8488';
        g.fillRect(Math.round(x + bx + Math.cos(a) * d * 1.25), Math.round(base + by + Math.sin(a) * d * 0.8), 2, 2);
      }
    });
  }

  function paintPavilion(g, w, hz) {
    const left = Math.round(w * 0.68), right = w, top = hz - 40;
    g.fillStyle = '#0a0c2e'; g.fillRect(left, top, right - left, 40);
    g.fillStyle = '#060722';
    for (let i = 0; i < right - left + 16; i++) g.fillRect(left - 8 + i, top - 7 + Math.round(Math.abs(Math.sin(i * 0.05)) * 2), 1, 8);
    for (let i = 0; i < 7; i++) { const x = left + 8 + i * 15; g.fillStyle = i % 3 === 1 ? '#c8703a' : '#ffbe6a'; g.fillRect(x, top + 10, 8, 14); g.fillStyle = '#0a0c2e'; g.fillRect(x + 3, top + 10, 2, 14); }
  }

  function paintRail(g, w, hz) {
    g.fillStyle = '#10143a'; g.fillRect(0, hz - 12, w, 4);
    g.fillStyle = '#4ab4b0'; g.fillRect(0, hz - 12, w, 1);
    g.fillStyle = '#0c0f30'; g.fillRect(0, hz - 2, w, 2);
    for (let x = 6; x < w; x += 22) { g.fillStyle = '#1a2058'; g.fillRect(x, hz - 11, 3, 10); }
  }

  const bgCanvas0 = G.bgCanvas;
  G.bgCanvas = function (id, w, h) {
    if (id !== 'pf') return bgCanvas0(id, w, h);
    const key = 'bg|' + w + '|' + h;
    let out = cache.get(key);
    if (out) return out;
    out = G.mkCanvas(w, h);
    const g = out.getContext('2d'), lw = Math.max(1, Math.round(w / 2)), lh = Math.max(1, Math.round(h / 2)), hz = Math.round(lh * 0.55), over = G.mkCanvas(lw, lh), o = over.getContext('2d');
    g.drawImage(bgCanvas0('lf_night', w, h), 0, 0);
    paintBattleSky(o, lw, hz);
    paintRibbons(o, lw, hz);
    paintPavilion(o, lw, hz);
    paintRail(o, lw, hz);
    paintTree(o, lw, hz);
    g.imageSmoothingEnabled = false;
    g.drawImage(over, 0, 0, w, h);
    const sheen = g.createLinearGradient(0, h * 0.55, 0, h);
    sheen.addColorStop(0, 'rgba(90,130,230,0.2)'); sheen.addColorStop(1, 'rgba(6,10,44,0.45)');
    g.fillStyle = sheen; g.fillRect(0, h * 0.55, w, h * 0.45);
    cache.set(key, out);
    return out;
  };

  const CAGE = ['......BBBB......', '.....B....B.....', '.....B....BB....', '......BB...B....', '.......BB.......', '.......BB.......', '.....DDDDDD.....', '...DDDDDDDDDD...', '.GGTTTTTSSSSSGG.', '.GTTTTTTSSSSSSG.', '.TTTTTTTSSSSSSS.', '.TTTQTTTSSSQSSS.', '.TTTTTTTSSSSSSS.', '.TQTTTTTSQSSSSS.', '.TTTTTTTSSSSSSS.', '.TTTTQTTSSSSQSS.', '.TTTTTTTSSSSSSS.', '.TTQTTTTSSQSSSS.', '.TTTTTTTSSSSSSS.', '.UUUUUUUVVVVVVV.', '.UUUUUUUVVVVVVV.', 'GUUUUUUUVVVVVVVG', 'GUUUUU..VVVVVVVG', '.UUUU.....VVVV..', '...WW......WW...', '...WW......WW...'];
  const CAGE_PAL = { B: '#d8b050', D: '#1c2a40', G: '#ffe08a', T: '#2a4a66', S: '#1e3650', Q: '#3a6a80', U: '#1a3048', V: '#14263c', W: '#5a3a24' };
  const PF_PIN = ['................', '..........CC....', '.........CCCC...', '........CCCWCC..', '.......CCCCCCWW.', '......CCCCCC.W..', '.....LCCCCC.....', '....LLLCCCC.....', '...LLLLLCC......', '..LLLLLLC.......', '.LLLLLLCC.......', '.....LCCC.......', '.....C.C........', '....CC.CC.......', '................', '................'];

  G.pfCageRows = () => CAGE;
  G.pfPinRows = () => PF_PIN;

  function cageBust() {
    let cv = cache.get('cagebust');
    if (cv) return cv;
    cv = G.mkCanvas(64, 64);
    const P = G.tilePainter(cv.getContext('2d'), 0, 0), B = '#d8b050', Bd = '#8a6a28', Au = '#ffe08a';
    P.ell(32, 34, 28, 30, 'rgba(150,120,230,0.16)');
    P(27, 1, 10, 2, B); P(36, 3, 2, 6, B); P(26, 3, 2, 4, B); P(28, 7, 4, 2, B); P(36, 8, 3, 2, Bd); P(30, 9, 4, 3, Bd); P(31, 9, 2, 3, B);
    P.tri([9, 19, 32, 11, 55, 19], '#1c2a40'); P.tri([14, 18, 32, 12, 32, 18], '#2a3c58');
    P(9, 19, 22, 37, '#2a4a66'); P(33, 19, 22, 37, '#1e3650'); P(31, 19, 2, 7, '#10202e');
    for (let y = 22; y < 44; y += 5) for (let x = 11 + (y % 2) * 2; x < 53; x += 7) if (x < 28 || x > 35) { P(x, y, 3, 1, x < 32 ? '#3a6a80' : '#2c5068'); P(x + 2, y + 1, 2, 1, x < 32 ? '#3a6a80' : '#2c5068'); }
    P(9, 46, 22, 10, '#1a3048'); P(33, 46, 22, 10, '#14263c');
    P.tri([9, 19, 14, 19, 9, 24], Au); P.tri([55, 19, 50, 19, 55, 24], Au); P.tri([9, 56, 9, 50, 14, 56], Au); P.tri([55, 56, 55, 50, 50, 56], Au);
    P(30, 26, 4, 24, 'rgba(200,170,255,0.55)'); P(31, 22, 2, 32, '#f4eeff'); P.ell(32, 36, 11, 14, 'rgba(170,140,255,0.28)');
    P(17, 56, 5, 5, '#5a3a24'); P(42, 56, 5, 5, '#5a3a24'); P(17, 56, 5, 1, '#8a6040'); P(42, 56, 5, 1, '#8a6040');
    P(6, 58, 6, 1, '#f0f8ff'); P(8, 59, 5, 1, '#a8d8ff'); P(47, 60, 6, 1, '#f0f8ff'); P(46, 61, 5, 1, '#a8d8ff');
    cache.set('cagebust', cv);
    return cv;
  }

  const drawBust0 = G.drawBust, drawPortrait0 = G.drawPortrait;
  G.drawBust = function (ctx, look, x, y, scale) {
    if (!look || look.style !== 'cage') return drawBust0(ctx, look, x, y, scale);
    blit(ctx, cageBust(), x, y, scale || 2);
  };
  G.drawPortrait = function (ctx, look, x, y, size) {
    if (!look || look.style !== 'cage') return drawPortrait0(ctx, look, x, y, size);
    const was = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cageBust(), Math.round(x), Math.round(y), Math.round(size), Math.round(size));
    ctx.imageSmoothingEnabled = was;
  };

  const mapIcon0 = G.mapIcon;
  G.mapIcon = function (ctx, id, x, y, size) {
    if (id !== 'pf') return mapIcon0(ctx, id, x, y, size);
    blit(ctx, sprite('pfpin', PF_PIN, { C: '#7ac8ff', L: '#3a7ad8', W: '#ffffff' }), x, y, (size || 16) / 16);
  };

  const drawObject0 = G.drawObject;
  G.drawObject = function (ctx, kind, px, py, st, t) {
    if (kind !== 'pfcage') return drawObject0(ctx, kind, px, py, st, t);
    const ph = st.phase || 0, k = 0.5 + 0.5 * Math.sin(t * 2.4 + ph), top = py - 34, cx = px + 16, cy = top + 30;
    const gl = ctx.createRadialGradient(cx, cy, 2, cx, cy, 34);
    gl.addColorStop(0, 'rgba(190,160,255,' + (0.28 + 0.16 * k).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(190,160,255,0)');
    ctx.fillStyle = gl; ctx.fillRect(cx - 34, cy - 34, 68, 68);
    blit(ctx, sprite('pfcage', CAGE, CAGE_PAL), px, top, 2);
    ctx.fillStyle = 'rgba(200,170,255,' + (0.45 + 0.3 * k).toFixed(3) + ')'; ctx.fillRect(px + 13, top + 20, 6, 24);
    ctx.fillStyle = '#f4eeff'; ctx.fillRect(px + 15, top + 18, 2, 28);
    for (let i = 0; i < 2; i++) {
      const life = ((t * 0.5 + i * 0.5 + ph) % 1 + 1) % 1, fx = px + 8 + i * 16 + Math.round(Math.sin(life * 9 + i) * 4), fy = top + 36 + Math.round(life * 24);
      ctx.globalAlpha = 1 - life;
      ctx.fillStyle = '#f0f8ff'; ctx.fillRect(fx, fy, 5, 1);
      ctx.fillStyle = '#a8d8ff'; ctx.fillRect(fx + 1, fy + 1, 4, 1);
      ctx.globalAlpha = 1;
    }
    G.mapIcon(ctx, 'pf', px + 8, top - 18 + Math.round(Math.sin(t * 2.2 + ph) * 2), 16);
  };

  if (H.Luofu) {
    Object.assign(H.Luofu.DECOR, {
      bookshop: {
        w: 10, h: 2, up: 44,
        draw(P) {
          const Wl = '#e4e0d6', Wd = '#b8b4aa', Rd = '#a82818', Rh = '#d84828', Tl = '#1e2230', Th = '#3a4258', K = '#2a1a14', Kh = '#5a3a24', Te = '#2a8a88', Au = '#d8b050';
          P.tri([8, 6, 80, 0, 152, 6], Tl); P(4, 6, 152, 8, Tl); P(0, 12, 160, 3, '#14161f');
          for (let x = 6; x < 156; x += 6) P(x, 6, 2, 8, Th);
          P(4, 6, 152, 1, Th); P(0, 10, 5, 4, Th); P(155, 10, 5, 4, Th);
          P(6, 15, 148, 4, K); P(6, 15, 148, 1, Kh);
          P(6, 19, 148, 28, Wl); P(6, 19, 3, 28, Wd); P(151, 19, 3, 28, Wd);
          P(26, 19, 108, 28, Rd); P(28, 21, 104, 24, '#7a1c12');
          [40, 70, 100].forEach((x, i) => {
            P(x, 21, 20, 22, i === 1 ? '#f0d890' : '#e8a050'); P(x, 21, 20, 2, '#fff0c0'); P(x, 42, 20, 1, '#a86828');
            for (let y = 25; y < 40; y += 4) P(x + 4, y, 12, 1, i === 1 ? '#a88a50' : '#b06a28');
          });
          P(6, 47, 148, 5, Rh); P(6, 47, 148, 1, '#ff8a60'); P(6, 52, 148, 2, K);
          for (let x = 18; x < 146; x += 26) { P(x, 48, 16, 3, Te); P(x, 48, 16, 1, '#5ac8c0'); }
          P(6, 54, 148, 22, '#2a1a10');
          const blue = ['#2a4a8a', '#f0e6d0', '#3a5a9a', '#e8dcc0'];
          for (const y of [56, 66]) for (let x = 40; x < 122; x += 4) { P(x, y, 3, 8, blue[(x + y) % 4 === 0 ? 0 : (x >> 2) % 4]); P(x, y + 8, 3, 1, K); }
          P(6, 54, 7, 22, Wl); P(147, 54, 7, 22, Wl); P(6, 54, 2, 22, Wd); P(152, 54, 2, 22, Wd);
          P(24, 54, 11, 22, '#f0ece0'); P(24, 54, 1, 22, '#c8c0b0');
          for (const y of [57, 63, 69]) { P(27, y, 5, 1, '#2a2a30'); P(29, y, 1, 4, '#2a2a30'); P(27, y + 3, 5, 1, '#2a2a30'); }
          P(125, 54, 11, 22, Te); P(135, 54, 1, 22, '#1a5a58');
          for (const y of [57, 63, 69]) { P(128, y, 5, 1, '#d8fff4'); P(130, y, 1, 4, '#d8fff4'); P(128, y + 3, 5, 1, '#d8fff4'); }
          P(14, 44, 8, 32, '#e8702a'); P(14, 44, 2, 32, '#ff9a50'); P(21, 44, 1, 32, '#a84a18');
          for (const y of [50, 58, 66]) { P(16, y, 4, 1, '#ffe0a0'); P(17, y + 1, 2, 2, '#ffe0a0'); }
          P(40, 74, 82, 2, '#ffd890'); P(38, 54, 2, 22, Au); P(122, 54, 2, 22, Au);
        },
        lights() { return [[80, 66, 76, '#ffb868', 0.32, true]]; }
      },
      redcloth: {
        w: 10, h: 1, up: 6,
        draw(P) {
          P(0, 2, 160, 16, '#b83828'); P(0, 2, 160, 2, '#f07858'); P(0, 16, 160, 2, '#7a1c12');
          for (let x = 4; x < 156; x += 10) P(x, 18, 4, 2, '#7a1c12');
          for (let x = 8; x < 156; x += 24) P(x, 8, 12, 1, '#d85a40');
        }
      },
      bookpile: {
        w: 1, h: 1, up: 6,
        draw(P, v) {
          const n = 2 + (v || 0);
          P.shadow(8, 21, 7, 1.5);
          for (let i = 0; i < n; i++) { const y = 16 - i * 5, x = 2 + ((i + (v || 0)) % 2); P(x, y, 12, 5, '#2a4a8a'); P(x, y, 12, 1, '#5a7ac0'); P(x + 2, y + 1, 9, 3, '#f0e6d0'); P(x, y + 4, 12, 1, '#1a2c5a'); }
        }
      },
      bookvase: {
        w: 1, h: 1, up: 14,
        draw(P) {
          H.Luofu.DECOR.vase.draw(P);
          P(5, -4 + 4, 2, 6, '#e8dcc0'); P(9, 0, 2, 6, '#d8c8a0'); P(5, 0, 2, 1, '#a82818'); P(9, 0, 2, 1, '#a82818');
        }
      }
    });
    Object.assign(H.Luofu.LAYER, {
      bookcarpet(P) {
        P(0, 2, 128, 14, '#1e4a34'); P(2, 4, 124, 10, '#2e6a4a'); P(0, 2, 128, 1, '#d8b050'); P(0, 15, 128, 1, '#d8b050');
        for (let x = 8; x < 124; x += 12) P(x, 8, 6, 2, '#4a9a70');
      }
    });
    H.Luofu.LAYER_SIZE.bookcarpet = [8, 1];
  }

  const R3 = H.R3, M3 = R3.M;
  const MAP = { w: 320, h: 240, eye: [0, 0, 10], fov: 40, depth: 8, planet: { x: 170, y: 115, r: 75 }, cage: { x: 37, y: 176 }, hook: { x: 39, y: 134 }, perch: [[102, 132], [167, 77], [212, 160], [272, 82]] };
  const BREAK_TIME = 1.4, CHAIN_STUB = 0.34, LINK = 3.4;
  const GIFT = ['...YY....YY.....', '..Y..Y..Y..Y....', '...YY.YY.YY.....', 'RRRRRRYYRRRRRRR.', 'RPPPPPYYPPPPPPR.', 'RRRRRRYYRRRRRRR.', '.RPPPPYYPPPPPR..', '.RPPPPYYPPPPPR..', '.RPPPPYYPPPPPR..', '.RPPPPYYPPPPPR..', '.RPPPPYYPPPPPR..', '.RRRRRRRRRRRRR..'];
  G.pfGift = (c, x, y, scale) => blit(c, sprite('gift', GIFT, { Y: '#ffe08a', R: '#a02848', P: '#e05070' }), x, y, scale || 2);

  const lens = 120 / Math.tan(MAP.fov * Math.PI / 360);
  const placeAt = (lx, ly, depth) => [(lx - MAP.w / 2) * depth / lens, (MAP.h / 2 - ly) * depth / lens, MAP.eye[2] - depth];

  function valueNoise(x, y, seed) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = G.hash(ix, iy, seed), b = G.hash(ix + 1, iy, seed), c = G.hash(ix, iy + 1, seed), d = G.hash(ix + 1, iy + 1, seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function paintPlanet(R) {
    const { x: cx, y: cy, r } = MAP.planet, px = R.px, w = R.w, h = R.h, LL = Math.hypot(0.55, 0.5, 0.67), lx = 0.55 / LL, ly = -0.5 / LL, lz = 0.67 / LL, reach = r * 1.14;
    for (let y = Math.max(0, Math.floor(cy - reach)); y < Math.min(h, Math.ceil(cy + reach)); y++) {
      for (let x = Math.max(0, Math.floor(cx - reach)); x < Math.min(w, Math.ceil(cx + reach)); x++) {
        const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r, d2 = dx * dx + dy * dy, o = (y * w + x) * 4;
        if (d2 >= 1) {
          const k = Math.max(0, (1.14 - Math.sqrt(d2)) / 0.14), g = k * k * 90;
          px[o] += g * 0.3; px[o + 1] += g; px[o + 2] += g * 0.95;
          continue;
        }
        const nz = Math.sqrt(1 - d2), lon = Math.atan2(dx, nz), bands = valueNoise(lon * 3.2 + dy * 1.4, dy * 7.5, 91) * 0.65 + valueNoise(lon * 9, dy * 18, 92) * 0.35;
        const lit = Math.max(0, dx * lx + dy * ly + nz * lz) * 0.95 + 0.1, rim = Math.pow(1 - nz, 3);
        px[o] = (12 + bands * 42) * lit + rim * 70;
        px[o + 1] = (24 + bands * 78) * lit + rim * 225;
        px[o + 2] = (70 + bands * 120) * lit + rim * 215;
      }
    }
  }

  function paintOrbit(R, rx, ry, turn, col, a) {
    const { x: cx, y: cy, r } = MAP.planet, c = Math.cos(turn), s = Math.sin(turn), px = R.px, w = R.w, h = R.h, steps = Math.round((rx + ry) * 7);
    for (let i = 0; i < steps; i++) {
      const th = i / steps * Math.PI * 2, ex = Math.cos(th) * rx, ey = Math.sin(th) * ry, x = cx + ex * c - ey * s, y = cy + ex * s + ey * c, xi = Math.floor(x), yi = Math.floor(y);
      if (xi < 0 || yi < 0 || xi >= w || yi >= h) continue;
      if (Math.sin(th) < 0 && Math.hypot(x - cx, y - cy) < r) continue;
      if (i % 9 > 6) continue;
      const o = (yi * w + xi) * 4;
      px[o] += col[0] * a; px[o + 1] += col[1] * a; px[o + 2] += col[2] * a;
    }
  }

  function cageMesh() {
    const m = R3.mesh(), n = 12, r = 0.66, top = 1.36, gold = '#d8b050', dark = '#7a5a24', hi = '#ffe08a', at = (rad, a, y) => [rad * Math.sin(a), y, rad * Math.cos(a)];
    R3.cyl(m, 0, -0.14, 0, r * 1.16, r * 1.1, 0.14, n, dark, { sm: false });
    R3.cyl(m, 0, 0, 0, r * 1.04, r * 1.04, 0.06, n, gold, { sm: false });
    R3.cyl(m, 0, top * 0.55, 0, r * 1.01, r * 1.01, 0.04, n, gold, { sm: false, cap: false, two: true });
    R3.cyl(m, 0, top, 0, r * 1.03, r * 1.03, 0.07, n, gold, { sm: false, cap: false, two: true });
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, w = 0.05, p0 = at(r, a - w, 0.05), p1 = at(r, a + w, 0.05), p2 = at(r, a + w, top), p3 = at(r, a - w, top);
      R3.quad(m, [...p0, ...p1, ...p2, ...p3], i % 3 ? gold : hi, { two: true });
      const q0 = at(r, a - w, top), q1 = at(r, a + w, top), q2 = at(0.05, a + w, top + 0.52), q3 = at(0.05, a - w, top + 0.52);
      R3.quad(m, [...q0, ...q1, ...q2, ...q3], i % 3 ? gold : hi, { two: true });
    }
    R3.cyl(m, 0, top + 0.5, 0, 0.09, 0.03, 0.18, 6, hi, { sm: false });
    return m;
  }

  function parrotBody() {
    const m = R3.mesh(), tri = (a, b, c, col) => R3.face(m, R3.vert(m, a[0], a[1], a[2]), R3.vert(m, b[0], b[1], b[2]), R3.vert(m, c[0], c[1], c[2]), col, { two: true });
    const W = '#f4f8ff', S = '#c4d2ee', B = '#3a7ad8', O = '#ffb050';
    const N = [0.46, 0.02, 0], T = [-0.42, 0.02, 0], U = [0, 0.2, 0], D = [0.02, -0.2, 0], L = [0.02, 0, 0.17], Q = [0.02, 0, -0.17];
    tri(N, U, L, W); tri(U, T, L, S); tri(N, Q, U, S); tri(U, Q, T, W);
    tri(N, L, D, S); tri(L, T, D, W); tri(N, D, Q, W); tri(D, Q, T, S);
    const nl = [0.24, 0.06, 0.1], nr = [0.24, 0.06, -0.1], hd = [0.46, 0.3, 0], top = [0.42, 0.5, 0], hl = [0.38, 0.2, 0.11], hr = [0.38, 0.2, -0.11], beak = [0.68, 0.34, 0], hook = [0.72, 0.1, 0];
    tri(nl, N, hd, W); tri(N, nr, hd, S); tri(nl, hd, nr, S);
    tri(top, hl, beak, W); tri(top, beak, hr, S); tri(hl, hr, beak, S); tri(top, hr, hl, W);
    tri([0.56, 0.42, 0.05], [0.54, 0.22, 0.05], hook, O); tri([0.56, 0.42, 0.05], hook, beak, O);
    tri([0.56, 0.42, -0.05], hook, [0.54, 0.22, -0.05], O); tri([0.56, 0.42, -0.05], beak, hook, O);
    tri(top, [0.22, 0.74, 0], [0.34, 0.4, 0], B); tri(top, [0.4, 0.78, 0], [0.26, 0.5, 0], B);
    const tip = [-1.34, -0.2, 0.13], tip2 = [-1.34, -0.2, -0.13], mid = [-1.14, 0.02, 0];
    tri(T, tip, mid, W); tri(T, mid, tip2, S);
    tri([-1.08, -0.12, 0.08], tip, mid, B); tri([-1.08, -0.12, -0.08], mid, tip2, B);
    return m;
  }

  function parrotWing(side) {
    const m = R3.mesh(), T = R3.paint('pf_wing', 32, 32, (g, w, h) => {
      g.fillStyle = '#f4f8ff'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#8a9ac8';
      for (let y = 3; y < h; y += 4) for (let x = 2; x < w - 2; x += 1 + (G.hash(x, y, 31) > 0.55 ? 2 : 0)) if (G.hash(x, y, 33) > 0.3) g.fillRect(x, y, 1, 1);
    });
    const pt = (x, y, z) => R3.vert(m, x, y, z * side);
    const r0 = pt(0.3, 0, 0), r1 = pt(-0.3, 0, 0), m0 = pt(0.12, 0.09, 0.56), m1 = pt(-0.44, 0.09, 0.56), tip = pt(-0.62, 0.02, 1.1), wing = { tex: T, two: true };
    R3.face(m, r0, r1, m1, '#ffffff', wing, [0, 0, 32, 0, 32, 16]);
    R3.face(m, r0, m1, m0, '#ffffff', wing, [0, 0, 32, 16, 0, 16]);
    R3.face(m, m0, m1, tip, '#dce6fa', wing, [0, 16, 32, 16, 32, 32]);
    const c0 = pt(-0.5, 0.06, 0.8), c1 = pt(-0.32, 0.05, 0.8);
    R3.face(m, c0, tip, c1, '#3a7ad8', { two: true });
    return m;
  }

  let mapState = null;
  function mapScene() {
    if (mapState) return mapState;
    const R = new R3.Raster(MAP.w, MAP.h);
    R.snap = false;
    R.look(MAP.eye, [0, 0, 0], MAP.fov);
    R.clear('#050820', '#060a2a', '#0a1040');
    R.flat(70, 60, 110, '#20307a', { shape: 'puff', a: 0.5 });
    R.flat(280, 190, 120, '#14406a', { shape: 'puff', a: 0.45 });
    R.flat(40, 200, 80, '#3a2470', { shape: 'puff', a: 0.5 });
    R.stars(340, 17, 0.9);
    paintOrbit(R, 118, 44, -0.3, [90, 170, 230], 0.55);
    paintOrbit(R, 150, 58, -0.3, [70, 130, 210], 0.4);
    paintPlanet(R);
    paintOrbit(R, 96, 34, -0.3, [130, 230, 220], 0.65);
    R.light({ amb: [0.5, 0.46, 0.5], dir: [0.5, 0.6, 0.6], sun: [0.75, 0.68, 0.5], pts: [{ p: placeAt(MAP.cage.x, MAP.cage.y - 18, 10), c: [0.5, 0.35, 0.8], r: 2.4 }] });
    const foot = placeAt(MAP.cage.x, MAP.cage.y, 10);
    R.draw(cageMesh(), M3.of(M3.t(foot[0], foot[1], foot[2]), M3.rx(0.18), M3.ry(0.26)));
    mapState = { R, bg: R.px.slice(), body: parrotBody(), wingL: parrotWing(1), wingR: parrotWing(-1) };
    return mapState;
  }

  function drawChain(R, ax, ay, bx, by, sag, cut, drop) {
    const n = Math.max(4, Math.round(Math.hypot(bx - ax, by - ay) / LINK));
    for (let k = 0; k <= n; k++) {
      const s = k / n, loose = s > cut;
      if (loose && drop == null) break;
      let x = ax + (bx - ax) * s, y = ay + (by - ay) * s + sag * 4 * s * (1 - s), a = 1;
      if (loose) { y += 60 * drop * drop * (0.6 + G.hash(k, 3, 7)); x += (G.hash(k, 5, 7) - 0.5) * 30 * drop; a = Math.max(0, 1 - drop / BREAK_TIME); }
      R.flat(x, y, k % 2 ? 1.5 : 1.1, k % 2 ? '#c0c8dc' : '#6a7488', { shape: 'disc', mode: 'alpha', a });
    }
  }

  function perchOf(i, t, free) {
    const [x, y] = MAP.perch[i];
    if (free) return [x + Math.cos(t * 0.55 + i * 2) * 14, y + Math.sin(t * 0.85 + i) * 8 - 6];
    return [x + Math.sin(t * 0.4 + i) * 1.5, y + Math.sin(t * 1.25 + i * 1.3) * 2.5];
  }

  function drawParrot(R, S, lx, ly, o) {
    const p = placeAt(lx, ly, MAP.depth), base = M3.of(M3.t(p[0], p[1], p[2]), M3.ry(o.yaw), M3.rz(o.pitch), M3.rx(o.roll), M3.s(o.scale)), opt = o.tint ? { tint: o.tint } : {};
    R.draw(S.body, base, opt);
    R.draw(S.wingL, M3.of(base, M3.t(0.02, 0.16, 0.05), M3.rx(-o.flap)), opt);
    R.draw(S.wingR, M3.of(base, M3.t(0.02, 0.16, -0.05), M3.rx(o.flap)), opt);
  }

  H.PFMap = {
    MAP,
    placeOf: i => [MAP.perch[i][0] * 2, MAP.perch[i][1] * 2],
    cost: () => { const S = mapScene(); return (S.body.f.length + S.wingL.f.length * 2) * MAP.perch.length; },
    draw(ctx, W, HGT, info, t) {
      const S = mapScene(), R = S.R, { hook, cage } = MAP;
      R.px.set(S.bg);
      R.zb.fill(0);
      R.flat(cage.x + 1, cage.y - 22, 26 + Math.sin(t * 2.2) * 4, '#c8a8ff', { a: 0.55 });
      R.flat(cage.x + 1, cage.y - 22, 8 + Math.sin(t * 3.7) * 2, '#ffffff', { shape: 'star', a: 0.8 });
      R.light({ amb: [0.62, 0.66, 0.8], dir: [0.45, 0.7, 0.55], sun: [0.55, 0.55, 0.5] });
      const spots = info.stages.map((st, i) => ({ st, i, at: perchOf(i, t, st.free && !st.breaking) }));
      for (const { st, i, at } of spots) {
        if (i === info.sel && st.open && !st.free) { const a = 0.14 + 0.06 * Math.sin(t * 3); R.band([hook.x, hook.y], [at[0], at[1]], 2, 5, [200, 168, 255], [90, 70, 150], 1e9, 1e9, a); }
        if (st.free && !st.breaking) { drawChain(R, hook.x, hook.y, at[0], at[1] + 6, 10, CHAIN_STUB); continue; }
        drawChain(R, hook.x, hook.y, at[0], at[1] + 6, 10, st.breaking ? CHAIN_STUB : 2, st.breaking ? st.breakT : null);
      }
      for (const { st, i, at } of spots) {
        const fast = i === info.sel ? 6.5 : 3, flap = st.open ? 0.28 + Math.sin(t * fast + i * 1.7) * 0.5 : -1.1;
        const yaw = -0.5 + (st.free ? Math.sin(t * 0.55 + i * 2) * 0.5 : Math.sin(t * 0.3 + i) * 0.08) + (i % 2 ? 0.1 : -0.1);
        drawParrot(R, S, at[0], at[1], { yaw, pitch: 0.1 + Math.sin(t * 1.1 + i) * 0.04, roll: -0.42, flap, scale: 0.66, tint: st.open ? null : '#5a6478' });
      }
      for (let i = 0; i < 10; i++) {
        const fx = (G.hash(i, 2, 57) * MAP.w + t * (4 + G.hash(i, 3, 57) * 6)) % MAP.w, fy = (G.hash(i, 4, 57) * MAP.h + t * (3 + G.hash(i, 5, 57) * 5)) % MAP.h;
        R.flat(fx, fy, 1.1, '#e8f0ff', { shape: 'disc', mode: 'alpha', a: 0.5 + 0.4 * Math.sin(t * 2 + i) });
      }
      R.finish(ctx, 0, 0, W, HGT);
    }
  };

  const sfx0 = H.Audio.prototype.sfx;
  H.Audio.prototype.sfx = function (id) {
    if (!this.ctx || !['pfpage', 'pfstar', 'pfrun', 'pflast', 'pfchain'].includes(id)) return sfx0.call(this, id);
    const t = this.ctx.currentTime, n = m => 440 * Math.pow(2, (m - 69) / 12);
    if (id === 'pfpage') this.noise(t, 0.09, 0.1, 3200, 1400);
    else if (id === 'pfstar') [76, 83, 88].forEach((m, i) => this.tone(t + i * 0.06, 0.22, n(m), 'triangle', 0.13));
    else if (id === 'pfchain') { this.noise(t, 0.06, 0.16, 5200, 2600); [0, 0.07, 0.15, 0.26].forEach((d, i) => this.tone(t + d, 0.09, 1900 - i * 240, 'square', 0.05)); }
    else if (id === 'pfrun') { this.tone(t, 0.25, 880, 'square', 0.06, null, 900); this.noise(t + 0.1, 0.15, 0.12, 2400); }
    else { this.tone(t, 0.12, n(62), 'square', 0.1); this.tone(t + 0.14, 0.2, n(62), 'square', 0.1); }
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
