(function (K) {
  'use strict';

  const SIZE = 512, CELLS = 4, PX = SIZE / CELLS;
  const REGIONS = Object.freeze({ barkPine: 0, barkSpruce: 1, barkBirch: 2, barkOak: 3, leafOak: 4, leafLinden: 5, leafBirch: 6, leafAlder: 7, needles: 8, spruce: 9, fern: 10, bush: 11, barkElder: 12 });

  const rgb = (c, k) => `rgb(${Math.round(c[0] * 255 * k)},${Math.round(c[1] * 255 * k)},${Math.round(c[2] * 255 * k)})`;

  const bark = (g, rnd, base, dark, light, kind) => {
    g.fillStyle = rgb(base, 1);
    g.fillRect(0, 0, PX, PX);
    for (let i = 0; i < 900; i++) {
      const x = rnd() * PX, y = rnd() * PX, k = 0.82 + rnd() * 0.36;
      g.fillStyle = rgb(base, k);
      g.fillRect(x, y, 1 + rnd() * 2, 2 + rnd() * 6);
    }
    if (kind === 'birch') {
      for (let i = 0; i < 26; i++) {
        g.fillStyle = rgb(dark, 1);
        g.fillRect(rnd() * PX, rnd() * PX, 4 + rnd() * 14, 1 + rnd() * 2);
      }
      return;
    }
    for (let i = 0; i < (kind === 'plates' ? 30 : 46); i++) {
      const x = rnd() * PX, w = kind === 'plates' ? 6 + rnd() * 10 : 1 + rnd() * 2;
      g.fillStyle = rgb(dark, 1);
      g.fillRect(x, 0, w * 0.3 + 1, PX);
      if (kind === 'plates') {
        g.fillStyle = rgb(light, 1);
        for (let y = 0; y < PX; y += 8 + rnd() * 12) g.fillRect(x + 2, y, w, 1);
      }
    }
    if (kind === 'moss') {
      for (let i = 0; i < 40; i++) {
        g.fillStyle = `rgba(70,96,40,${0.35 + rnd() * 0.3})`;
        g.beginPath();
        g.ellipse(rnd() * PX, rnd() * PX, 4 + rnd() * 9, 3 + rnd() * 6, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
  };

  const leaves = (g, rnd, shades, n, len, shape) => {
    const c = PX / 2;
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * (c - 6);
      let x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
      if (shape === 'bush') y = PX - 4 - Math.abs(Math.sin(a)) * r * 1.2;
      const k = 0.8 + rnd() * 0.4 - (shape === 'bush' ? 0 : (y / PX) * 0.25);
      g.fillStyle = rgb(shades[Math.floor(rnd() * shades.length)], k);
      g.beginPath();
      g.ellipse(x, y, len * (0.6 + rnd() * 0.6), len * 0.45, rnd() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
  };

  const needles = (g, rnd) => {
    const c = PX / 2;
    g.lineWidth = 1.4;
    for (let i = 0; i < 420; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * (c - 10), x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
      const b = rnd() * Math.PI * 2, l = 5 + rnd() * 7;
      g.strokeStyle = rgb([0.16, 0.3, 0.14], 0.75 + rnd() * 0.5);
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(b) * l, y + Math.sin(b) * l);
      g.stroke();
    }
  };

  const spruce = (g, rnd) => {
    g.lineWidth = 1.5;
    for (let y = 2; y < PX - 6; y += 2) {
      for (let k = 0; k < 9; k++) {
        const x = rnd() * PX, l = 6 + rnd() * 9;
        g.strokeStyle = rgb([0.13, 0.27, 0.15], 0.7 + rnd() * 0.5);
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + (rnd() - 0.5) * 6, y + l);
        g.stroke();
      }
    }
    g.globalCompositeOperation = 'destination-out';
    for (let x = 0; x < PX; x += 3) {
      const cut = PX - 4 - rnd() * 16;
      g.fillRect(x, cut, 3, PX - cut);
    }
    g.globalCompositeOperation = 'source-over';
  };

  const fern = (g, rnd) => {
    const bx = PX / 2, by = PX - 2;
    for (let f = 0; f < 9; f++) {
      const a = -Math.PI / 2 + (f - 4) * 0.28 + (rnd() - 0.5) * 0.15, len = PX * (0.55 + rnd() * 0.35);
      for (let s = 0; s < 1; s += 0.04) {
        const x = bx + Math.cos(a) * len * s + Math.sin(s * 3) * 4, y = by + Math.sin(a) * len * s + s * s * len * 0.35;
        const w = (1 - s) * 9 + 2;
        g.strokeStyle = rgb([0.24, 0.44, 0.16], 0.75 + rnd() * 0.45);
        g.lineWidth = 1.3;
        g.beginPath();
        g.moveTo(x - Math.sin(a) * w, y + Math.cos(a) * w * 0.4);
        g.lineTo(x + Math.sin(a) * w, y - Math.cos(a) * w * 0.4);
        g.stroke();
      }
    }
  };

  const draw = () => {
    const cv = document.createElement('canvas');
    cv.width = SIZE;
    cv.height = SIZE;
    const g = cv.getContext('2d'), rnd = K.rng(4242);
    const cell = (id, fn) => {
      g.save();
      g.translate((id % CELLS) * PX, Math.floor(id / CELLS) * PX);
      g.beginPath();
      g.rect(0, 0, PX, PX);
      g.clip();
      fn();
      g.restore();
    };
    cell(REGIONS.barkPine, () => bark(g, rnd, [0.55, 0.33, 0.2], [0.3, 0.17, 0.1], [0.7, 0.45, 0.3], 'plates'));
    cell(REGIONS.barkSpruce, () => bark(g, rnd, [0.36, 0.3, 0.25], [0.22, 0.18, 0.15], [0.45, 0.38, 0.3], 'fine'));
    cell(REGIONS.barkBirch, () => bark(g, rnd, [0.88, 0.87, 0.82], [0.12, 0.12, 0.12], [0.95, 0.95, 0.92], 'birch'));
    cell(REGIONS.barkOak, () => bark(g, rnd, [0.3, 0.25, 0.2], [0.16, 0.13, 0.1], [0.38, 0.32, 0.26], 'fine'));
    cell(REGIONS.leafOak, () => leaves(g, rnd, [[0.24, 0.38, 0.14], [0.3, 0.44, 0.17], [0.2, 0.32, 0.12]], 520, 7, 'round'));
    cell(REGIONS.leafLinden, () => leaves(g, rnd, [[0.3, 0.47, 0.17], [0.36, 0.52, 0.2], [0.26, 0.42, 0.15]], 560, 6, 'round'));
    cell(REGIONS.leafBirch, () => leaves(g, rnd, [[0.42, 0.56, 0.2], [0.5, 0.62, 0.24], [0.36, 0.5, 0.18]], 640, 4.5, 'round'));
    cell(REGIONS.leafAlder, () => leaves(g, rnd, [[0.22, 0.37, 0.16], [0.27, 0.42, 0.18], [0.19, 0.32, 0.14]], 540, 6, 'round'));
    cell(REGIONS.needles, () => needles(g, rnd));
    cell(REGIONS.spruce, () => spruce(g, rnd));
    cell(REGIONS.fern, () => fern(g, rnd));
    cell(REGIONS.bush, () => leaves(g, rnd, [[0.22, 0.36, 0.14], [0.28, 0.42, 0.16], [0.18, 0.3, 0.12]], 700, 6, 'bush'));
    cell(REGIONS.barkElder, () => bark(g, rnd, [0.32, 0.27, 0.21], [0.15, 0.12, 0.09], [0.4, 0.34, 0.27], 'moss'));
    return cv;
  };

  const region = (id, u, v) => [((id % CELLS) + 0.01 + 0.98 * u) / CELLS, (Math.floor(id / CELLS) + 0.01 + 0.98 * v) / CELLS];

  const PSIZE = 512, PCELLS = 8, PPX = PSIZE / PCELLS;
  const PREG = Object.freeze({ skin: 0, linen: 1, wool: 2, leather: 3, mail: 4, iron: 5, steel: 6, wood: 7, hair: 8, trim: 9, felt: 10, quilt: 11, boot: 12, slit: 13, smooth: 14, straw: 15, face: 16, flesh: 24, fur: 25, spots: 26, patches: 27, feather: 28 });
  const pcell = (id, u, v) => [((id % PCELLS) + 0.03 + 0.94 * u) / PCELLS, (Math.floor(id / PCELLS) + 0.03 + 0.94 * v) / PCELLS];

  const grey = (k, a) => `rgba(${Math.round(255 * Math.min(1, k))},${Math.round(255 * Math.min(1, k))},${Math.round(255 * Math.min(1, k))},${a === undefined ? 1 : a})`;
  const raw = c => `rgba(${c[0]},${c[1]},${c[2]},0.5)`;

  const speckle = (g, rnd, n, lo, hi, w, h) => {
    for (let i = 0; i < n; i++) {
      g.fillStyle = grey(lo + rnd() * (hi - lo));
      g.fillRect(Math.floor(rnd() * PPX), Math.floor(rnd() * PPX), w || 1, h || 1);
    }
  };

  const FX = u => 1.92 + 60.2 * u, FY = v => 1.92 + 60.2 * v;
  const IRIS = [[92, 64, 40], [70, 96, 120], [80, 104, 70], [90, 92, 96]];

  const face = (g, rnd, f) => {
    const female = f >= 4, kind = f % 4;
    g.fillStyle = grey(1);
    g.fillRect(0, 0, PPX, PPX);
    for (let x = 0; x < PPX; x++) {
      const d = Math.abs(x - 32) / 32;
      if (d > 0.6) { g.fillStyle = grey(1 - (d - 0.6) * 0.35); g.fillRect(x, 0, 1, PPX); }
    }
    g.fillStyle = 'rgba(255,214,206,1)';
    for (const s of [-1, 1]) g.fillRect(FX(0.5 + s * 0.24) - 4, FY(0.58) - 2, 8, 5);
    g.fillStyle = grey(0.86);
    g.fillRect(FX(0.5) - 2, FY(0.44), 4, 13);
    g.fillStyle = grey(0.6);
    for (const s of [-1, 1]) g.fillRect(FX(0.5 + s * 0.05) - 1, FY(0.66), 2, 1);
    const eyeW = female ? 7 : 6, eyeH = kind === 3 && female ? 2 : 3;
    for (const s of [-1, 1]) {
      const ex = Math.round(FX(0.5 + s * 0.213)), ey = Math.round(FY(0.425));
      g.fillStyle = raw([236, 232, 224]);
      g.fillRect(ex - eyeW / 2, ey - 1, eyeW, eyeH);
      g.fillStyle = raw(IRIS[f % 4]);
      g.fillRect(ex - 1, ey - 1, 3, eyeH);
      g.fillStyle = raw([20, 16, 14]);
      g.fillRect(ex, ey - 1 + Math.floor(eyeH / 2), 1, 1);
      g.fillStyle = grey(female ? 0.32 : 0.45);
      g.fillRect(ex - eyeW / 2, ey - 2, eyeW, 1);
      const browY = Math.round(FY(0.34)) - (kind === 2 ? 0 : 1);
      g.fillStyle = grey(kind === 3 ? 0.22 : kind === 2 ? 0.3 : 0.38);
      g.fillRect(ex - eyeW / 2 - (s > 0 ? 0 : 1), browY, eyeW + 1, kind === 2 && !female ? 3 : 2);
    }
    const my = Math.round(FY(0.765));
    g.fillStyle = 'rgba(206,128,118,1)';
    g.fillRect(FX(0.5) - 5, my - (female ? 1 : 0), 10, female ? 3 : 2);
    g.fillStyle = grey(0.5);
    g.fillRect(FX(0.5) - 5, my, 10, 1);
    if (!female && (kind === 1 || kind === 3)) {
      g.fillStyle = 'rgba(150,150,160,1)';
      for (let i = 0; i < 260; i++) g.fillRect(Math.floor(FX(0.2 + rnd() * 0.6)), Math.floor(FY(0.62 + rnd() * 0.36)), 1, 1);
    }
    if (kind === 2) {
      g.fillStyle = grey(0.72);
      for (const y of [0.12, 0.2]) g.fillRect(FX(0.3), FY(y), FX(0.7) - FX(0.3), 1);
      for (const s of [-1, 1]) for (let i = 0; i < 6; i++) g.fillRect(FX(0.5 + s * (0.13 + i * 0.012)), FY(0.6 + i * 0.03), 1, 2);
    }
    if (kind === 3 && !female) {
      g.fillStyle = raw([236, 186, 178]);
      for (let i = 0; i < 12; i++) g.fillRect(FX(0.66 + i * 0.012), FY(0.36 + i * 0.026), 1, 2);
    }
    if (kind === 1 && female) {
      g.fillStyle = grey(0.7);
      for (let i = 0; i < 40; i++) g.fillRect(Math.floor(FX(0.25 + rnd() * 0.5)), Math.floor(FY(0.5 + rnd() * 0.16)), 1, 1);
    }
    if (kind === 3 && female) {
      g.fillStyle = grey(0.4);
      g.fillRect(FX(0.66), FY(0.7), 2, 2);
    }
  };

  const people = () => {
    const cv = document.createElement('canvas');
    cv.width = PSIZE;
    cv.height = PSIZE;
    const g = cv.getContext('2d'), rnd = K.rng(9898);
    const cell = (id, fn) => {
      g.save();
      g.translate((id % PCELLS) * PPX, Math.floor(id / PCELLS) * PPX);
      g.beginPath();
      g.rect(0, 0, PPX, PPX);
      g.clip();
      fn();
      g.restore();
    };
    const base = k => { g.fillStyle = grey(k); g.fillRect(0, 0, PPX, PPX); };
    cell(PREG.skin, () => { base(1); speckle(g, rnd, 300, 0.95, 1, 1, 1); });
    cell(PREG.linen, () => {
      base(0.93);
      for (let i = 0; i < PPX; i += 2) { g.fillStyle = grey(0.86); g.fillRect(0, i, PPX, 1); }
      for (let i = 0; i < PPX; i += 3) { g.fillStyle = grey(0.89); g.fillRect(i, 0, 1, PPX); }
      speckle(g, rnd, 200, 0.8, 1, 1, 1);
    });
    cell(PREG.wool, () => { base(0.88); speckle(g, rnd, 1400, 0.7, 1, 1, 1); speckle(g, rnd, 120, 0.65, 0.8, 2, 1); });
    cell(PREG.leather, () => {
      base(0.86);
      for (let i = 0; i < 40; i++) { g.fillStyle = grey(0.74 + rnd() * 0.18); g.beginPath(); g.ellipse(rnd() * PPX, rnd() * PPX, 3 + rnd() * 7, 2 + rnd() * 4, rnd() * 3, 0, Math.PI * 2); g.fill(); }
      speckle(g, rnd, 300, 0.7, 0.95, 1, 1);
      g.fillStyle = grey(0.6);
      for (let i = 2; i < PPX; i += 6) { g.fillRect(i, 2, 3, 1); g.fillRect(i, PPX - 3, 3, 1); }
    });
    cell(PREG.mail, () => {
      base(0.42);
      for (let y = 0; y < PPX; y += 4) {
        for (let x = (y / 4) % 2 ? 2 : 0; x < PPX; x += 4) {
          g.fillStyle = grey(0.95); g.fillRect(x, y, 3, 1);
          g.fillStyle = grey(0.75); g.fillRect(x, y + 1, 1, 2); g.fillRect(x + 2, y + 1, 1, 2);
          g.fillStyle = grey(0.55); g.fillRect(x + 1, y + 2, 1, 1);
        }
      }
    });
    cell(PREG.iron, () => {
      base(0.78);
      for (let i = 0; i < 60; i++) { g.fillStyle = grey(0.6 + rnd() * 0.4); g.fillRect(rnd() * PPX, rnd() * PPX, 2 + rnd() * 9, 1); }
      for (let i = 0; i < 14; i++) { g.fillStyle = raw([96, 54, 34]); g.fillRect(rnd() * PPX, rnd() * PPX, 1 + rnd() * 3, 1 + rnd() * 3); }
      for (const [x, y] of [[6, 6], [57, 6], [6, 57], [57, 57], [32, 6], [32, 57]]) { g.fillStyle = grey(1); g.fillRect(x, y, 2, 2); g.fillStyle = grey(0.45); g.fillRect(x + 1, y + 1, 2, 1); }
    });
    cell(PREG.steel, () => {
      base(0.96);
      for (let i = 0; i < 26; i++) { g.fillStyle = grey(0.82 + rnd() * 0.18); g.fillRect(0, rnd() * PPX, PPX, 1); }
      g.fillStyle = grey(0.7);
      g.fillRect(0, 0, PPX, 2);
      g.fillRect(0, PPX - 2, PPX, 2);
    });
    cell(PREG.wood, () => {
      base(0.86);
      for (let i = 0; i < 30; i++) { g.fillStyle = grey(0.66 + rnd() * 0.2); g.fillRect(rnd() * PPX, 0, 1, PPX); }
      for (let i = 0; i < 4; i++) { g.fillStyle = grey(0.55); g.beginPath(); g.ellipse(rnd() * PPX, rnd() * PPX, 2, 4, 0, 0, Math.PI * 2); g.fill(); }
    });
    cell(PREG.hair, () => {
      base(0.86);
      for (let x = 0; x < PPX; x++) { g.fillStyle = grey(0.7 + rnd() * 0.3); g.fillRect(x, 0, 1, PPX); }
      speckle(g, rnd, 200, 0.6, 1, 1, 3);
    });
    cell(PREG.trim, () => {
      base(1);
      speckle(g, rnd, 200, 0.85, 1, 1, 1);
      g.fillStyle = raw([238, 232, 216]);
      for (let x = 0; x < PPX; x += 8) {
        g.fillRect(x + 3, 10, 2, 2); g.fillRect(x + 2, 12, 4, 1); g.fillRect(x + 3, 13, 2, 2);
        g.fillRect(x + 3, 48, 2, 2); g.fillRect(x + 2, 50, 4, 1); g.fillRect(x + 3, 51, 2, 2);
      }
      for (let y = 20; y < 44; y += 8) for (let x = 0; x < PPX; x += 8) g.fillRect(x + (y % 16 ? 4 : 0), y, 2, 2);
    });
    cell(PREG.felt, () => { base(0.9); speckle(g, rnd, 900, 0.78, 1, 1, 1); });
    cell(PREG.quilt, () => {
      base(0.92);
      speckle(g, rnd, 500, 0.8, 1, 1, 1);
      g.fillStyle = grey(0.62);
      for (let k = -PPX; k < PPX * 2; k += 10) for (let i = 0; i < PPX; i++) { g.fillRect(k + i, i, 1, 1); g.fillRect(k - i + PPX, i, 1, 1); }
    });
    cell(PREG.boot, () => {
      base(0.72);
      speckle(g, rnd, 500, 0.55, 0.85, 1, 1);
      g.fillStyle = grey(0.5);
      for (let i = 0; i < 9; i++) g.fillRect(0, 6 + i * 7 + rnd() * 3, PPX, 1);
    });
    cell(PREG.slit, () => { g.fillStyle = raw([10, 10, 12]); g.fillRect(0, 0, PPX, PPX); });
    cell(PREG.smooth, () => { base(0.97); speckle(g, rnd, 400, 0.9, 1, 1, 1); });
    for (let f = 0; f < 8; f++) cell(PREG.face + f, () => face(g, rnd, f));
    cell(PREG.straw, () => {
      base(0.9);
      for (let i = 0; i < 260; i++) { g.fillStyle = grey(0.62 + rnd() * 0.42); g.fillRect(Math.floor(rnd() * PPX), Math.floor(rnd() * PPX), 1, 4 + Math.floor(rnd() * 9)); }
    });
    const furStrokes = (n, lo, hi) => { for (let i = 0; i < n; i++) { g.fillStyle = grey(lo + rnd() * (hi - lo)); g.fillRect(Math.floor(rnd() * PPX), Math.floor(rnd() * PPX), 1, 2 + Math.floor(rnd() * 4)); } };
    cell(PREG.fur, () => { base(0.9); furStrokes(900, 0.72, 1); speckle(g, rnd, 200, 0.6, 0.8, 1, 1); });
    cell(PREG.spots, () => {
      base(0.9);
      furStrokes(700, 0.75, 1);
      for (let i = 0; i < 26; i++) { g.fillStyle = raw([232, 222, 200]); g.beginPath(); g.arc(rnd() * PPX, rnd() * PPX * 0.55, 1.5 + rnd() * 1.8, 0, Math.PI * 2); g.fill(); }
    });
    cell(PREG.patches, () => {
      base(0.9);
      furStrokes(500, 0.8, 1);
      for (let i = 0; i < 5; i++) { g.fillStyle = raw([238, 234, 226]); g.beginPath(); g.ellipse(rnd() * PPX, rnd() * PPX, 6 + rnd() * 10, 5 + rnd() * 8, rnd() * 3, 0, Math.PI * 2); g.fill(); }
    });
    cell(PREG.feather, () => {
      base(0.85);
      for (let y = 0; y < PPX; y += 4) for (let x = (y / 4 % 2) * 3; x < PPX; x += 6) { g.fillStyle = grey(0.65 + rnd() * 0.3); g.fillRect(x, y, 5, 3); g.fillStyle = grey(0.55); g.fillRect(x, y + 3, 5, 1); }
    });
    cell(PREG.flesh, () => {
      g.fillStyle = raw([118, 18, 16]);
      g.fillRect(0, 0, PPX, PPX);
      for (let i = 0; i < 160; i++) { g.fillStyle = raw([150 + Math.floor(rnd() * 50), 26 + Math.floor(rnd() * 20), 24]); g.fillRect(Math.floor(rnd() * PPX), Math.floor(rnd() * PPX), 2, 2); }
      g.fillStyle = raw([236, 228, 206]);
      g.beginPath();
      g.arc(PPX / 2, PPX / 2, PPX * 0.17, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = raw([190, 150, 130]);
      g.beginPath();
      g.arc(PPX / 2, PPX / 2, PPX * 0.07, 0, Math.PI * 2);
      g.fill();
    });
    return cv;
  };

  const GSIZE = 512;
  const GBASE = Object.freeze([[74, 102, 44], [108, 112, 54], [60, 48, 32], [112, 92, 64], [126, 118, 102], [70, 64, 56], [110, 108, 102], [116, 110, 98], [226, 230, 236], [58, 54, 36], [174, 158, 118], [90, 68, 44]]);
  const GTILE = Object.freeze([3, 3, 3, 3, 2.5, 2.5, 4, 4, 6, 4, 3, 6]);
  const GRAIN = Object.freeze([0.25, 0.25, 0.4, 0.5, 0.3, 0.2, 0.9, 0.6, 0.25, 0.5, 0.45, 0.4]);

  const groundLayer = (m, rnd) => {
    const c = document.createElement('canvas');
    c.width = GSIZE;
    c.height = GSIZE;
    const g = c.getContext('2d'), S = GSIZE, base = GBASE[m];
    const col = (k, a, rgb) => { const q = rgb || base; return `rgba(${Math.round(Math.min(255, q[0] * k))},${Math.round(Math.min(255, q[1] * k))},${Math.round(Math.min(255, q[2] * k))},${a === undefined ? 1 : a})`; };
    const wrap = (x, y, r, f) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const X = x + ox, Y = y + oy; if (X > -r && X < S + r && Y > -r && Y < S + r) f(X, Y); } };
    g.fillStyle = col(1);
    g.fillRect(0, 0, S, S);
    for (let i = 0; i < 70; i++) {
      const x = rnd() * S, y = rnd() * S, r = 30 + rnd() * 90, k = 0.82 + rnd() * 0.36;
      wrap(x, y, r, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, r); gr.addColorStop(0, col(k, 0.22)); gr.addColorStop(1, col(k, 0)); g.fillStyle = gr; g.fillRect(X - r, Y - r, r * 2, r * 2); });
    }
    const dot = (n, r0, r1, kk, rgb) => { for (let i = 0; i < n; i++) { const x = rnd() * S, y = rnd() * S, r = r0 + rnd() * (r1 - r0), k = kk[0] + rnd() * (kk[1] - kk[0]); wrap(x, y, r + 2, (X, Y) => { g.fillStyle = col(k, 1, rgb && rgb[Math.floor(rnd() * rgb.length)]); g.beginPath(); g.ellipse(X, Y, r, r * (0.6 + rnd() * 0.4), rnd() * 3.14, 0, Math.PI * 2); g.fill(); }); } };
    const stone = (n, r0, r1, kk, rgb, sharp) => {
      for (let i = 0; i < n; i++) {
        const x = rnd() * S, y = rnd() * S, r = r0 + rnd() * (r1 - r0), k = kk[0] + rnd() * (kk[1] - kk[0]), c0 = rgb ? rgb[Math.floor(rnd() * rgb.length)] : base, sides = sharp ? 5 + Math.floor(rnd() * 3) : 0, rot = rnd() * 6.28;
        const shape = (X, Y, rr) => { g.beginPath(); if (sides) { for (let s = 0; s < sides; s++) { const a = rot + s / sides * 6.28, q = rr * (0.7 + 0.3 * ((s * 7919 + i) % 5) / 4); s ? g.lineTo(X + Math.cos(a) * q, Y + Math.sin(a) * q) : g.moveTo(X + Math.cos(a) * q, Y + Math.sin(a) * q); } g.closePath(); } else g.ellipse(X, Y, rr, rr * 0.75, rot, 0, Math.PI * 2); };
        wrap(x, y, r + 3, (X, Y) => {
          g.fillStyle = 'rgba(0,0,0,0.35)'; shape(X + r * 0.25, Y + r * 0.3, r); g.fill();
          g.fillStyle = col(k, 1, c0); shape(X, Y, r); g.fill();
          g.fillStyle = col(k * 1.25, 0.5, c0); shape(X - r * 0.2, Y - r * 0.25, r * 0.55); g.fill();
        });
      }
    };
    const blade = (n, l0, l1, kk, rgb, w, upright) => {
      g.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const x = rnd() * S, y = rnd() * S, l = l0 + rnd() * (l1 - l0), a = upright ? -Math.PI / 2 + (rnd() - 0.5) * 1.4 : rnd() * 6.28, k = kk[0] + rnd() * (kk[1] - kk[0]);
        wrap(x, y, l + 2, (X, Y) => { g.strokeStyle = col(k, 0.9, rgb && rgb[Math.floor(rnd() * rgb.length)]); g.lineWidth = w || 1.2; g.beginPath(); g.moveTo(X, Y); g.quadraticCurveTo(X + Math.cos(a) * l * 0.5 + (rnd() - 0.5) * 3, Y + Math.sin(a) * l * 0.5, X + Math.cos(a) * l, Y + Math.sin(a) * l); g.stroke(); });
      }
    };
    if (m === 0) { blade(9000, 4, 10, [0.7, 1.35], [[70, 104, 40], [86, 118, 46], [60, 90, 36], [104, 124, 52]], 1.3, true); dot(60, 1.2, 2, [1, 1], [[236, 228, 120], [240, 240, 240], [190, 150, 220]]); }
    else if (m === 1) { blade(7000, 5, 12, [0.75, 1.3], [[120, 120, 56], [140, 132, 70], [100, 110, 50], [150, 140, 84]], 1.3, true); }
    else if (m === 2) { blade(2600, 4, 10, [0.6, 1.4], [[120, 74, 36], [96, 62, 34], [140, 96, 50]], 1, false); dot(600, 2, 4.5, [0.7, 1.3], [[110, 70, 34], [128, 96, 40], [86, 58, 30]]); for (let i = 0; i < 26; i++) { const x = rnd() * S, y = rnd() * S, r = 14 + rnd() * 30; wrap(x, y, r, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, r); gr.addColorStop(0, 'rgba(58,84,34,0.55)'); gr.addColorStop(1, 'rgba(58,84,34,0)'); g.fillStyle = gr; g.fillRect(X - r, Y - r, r * 2, r * 2); }); } blade(140, 14, 34, [0.5, 0.8], [[70, 52, 34]], 2.4, false); }
    else if (m === 3) { dot(2200, 0.8, 2.2, [0.7, 1.3]); stone(120, 2, 4, [0.8, 1.2], [[124, 112, 92], [104, 96, 82]]); blade(500, 3, 7, [0.6, 1], [[80, 100, 44]], 1, true); }
    else if (m === 4) { stone(2600, 2, 5, [0.75, 1.25], [[140, 132, 116], [118, 110, 98], [150, 136, 110], [104, 100, 92]]); }
    else if (m === 5) {
      const cell = 32;
      for (let yy = 0; yy < S / cell; yy++) for (let xx = 0; xx < S / cell; xx++) {
        const x = xx * cell + (yy % 2) * cell / 2 + (rnd() - 0.5) * 4, y = yy * cell + (rnd() - 0.5) * 4, w = cell * 0.44 + rnd() * 2, h = cell * 0.4 + rnd() * 2, k = 0.85 + rnd() * 0.4, c0 = [[118, 112, 104], [128, 116, 98], [104, 100, 96], [136, 124, 110]][Math.floor(rnd() * 4)];
        wrap(x + cell / 2, y + cell / 2, cell, (X, Y) => {
          const rr = (dx, dy, ww, hh) => { g.beginPath(); if (g.roundRect) g.roundRect(X - ww + dx, Y - hh + dy, ww * 2, hh * 2, 6); else g.rect(X - ww + dx, Y - hh + dy, ww * 2, hh * 2); };
          g.fillStyle = 'rgba(0,0,0,0.4)'; rr(2, 3, w, h); g.fill();
          g.fillStyle = col(k, 1, c0); rr(0, 0, w, h); g.fill();
          g.fillStyle = col(k * 1.2, 0.45, c0); rr(-3, -3, w * 0.6, h * 0.55); g.fill();
        });
      }
    }
    else if (m === 6) {
      for (let i = 0; i < 16; i++) { const y = rnd() * S, h = 6 + rnd() * 18, k = 0.85 + rnd() * 0.3; wrap(S / 2, y, S, (X, Y) => { g.fillStyle = col(k, 0.25); g.fillRect(0, Y, S, h); }); }
      g.lineCap = 'round';
      for (let i = 0; i < 70; i++) { let x = rnd() * S, y = rnd() * S; const n = 3 + Math.floor(rnd() * 5), seg = []; for (let s = 0; s < n; s++) { seg.push([x, y]); x += (rnd() - 0.5) * 16 + 6; y += (rnd() - 0.5) * 10; } wrap(seg[0][0], seg[0][1], 160, (X, Y) => { const dx = X - seg[0][0], dy = Y - seg[0][1]; g.strokeStyle = 'rgba(46,44,42,0.32)'; g.lineWidth = 0.6 + rnd() * 0.6; g.beginPath(); seg.forEach(([a, b], q) => q ? g.lineTo(a + dx, b + dy) : g.moveTo(a + dx, b + dy)); g.stroke(); g.strokeStyle = 'rgba(170,166,158,0.35)'; g.lineWidth = 1; g.beginPath(); seg.forEach(([a, b], q) => q ? g.lineTo(a + dx + 1.5, b + dy + 1.5) : g.moveTo(a + dx + 1.5, b + dy + 1.5)); g.stroke(); }); }
      dot(500, 1, 2.6, [1, 1], [[112, 118, 92], [128, 126, 104], [98, 106, 84]]);
    }
    else if (m === 7) { stone(900, 4, 12, [0.7, 1.25], [[128, 124, 116], [106, 102, 96], [140, 132, 118], [92, 90, 86]], true); stone(1600, 1.5, 3.5, [0.75, 1.2], null, true); }
    else if (m === 8) { for (let i = 0; i < 60; i++) { const x = rnd() * S, y = rnd() * S, r = 20 + rnd() * 70; wrap(x, y, r, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, r); gr.addColorStop(0, 'rgba(176,190,214,0.22)'); gr.addColorStop(1, 'rgba(176,190,214,0)'); g.fillStyle = gr; g.fillRect(X - r, Y - r, r * 2, r * 2); }); } dot(500, 0.6, 1.2, [1.1, 1.15], [[255, 255, 255]]); }
    else if (m === 9) { for (let i = 0; i < 30; i++) { const x = rnd() * S, y = rnd() * S, r = 18 + rnd() * 50; wrap(x, y, r * 1.6, (X, Y) => { g.fillStyle = 'rgba(46,56,58,0.75)'; g.beginPath(); g.ellipse(X, Y, r * 1.5, r, rnd() * 3, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(120,132,128,0.35)'; g.lineWidth = 1.5; g.stroke(); }); } blade(2500, 5, 12, [0.7, 1.2], [[70, 88, 40], [90, 96, 46]], 1.2, true); dot(400, 1, 2, [1, 1], [[100, 140, 40]]); }
    else if (m === 10) { dot(4000, 0.6, 1.4, [0.82, 1.2]); stone(200, 1.5, 4, [0.8, 1.2], [[150, 140, 120], [120, 116, 104], [168, 150, 120]]); for (let i = 0; i < 14; i++) { const y = rnd() * S; wrap(S / 2, y, S, (X, Y) => { g.strokeStyle = 'rgba(120,104,72,0.25)'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= S; x += 8) { const yy = Y + Math.sin(x / 30 + i) * 4; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }); } }
    else if (m === 11) { for (let y = 0; y < S; y += 16) { g.fillStyle = col(0.72, 0.9); g.fillRect(0, y, S, 6); g.fillStyle = col(1.22, 0.6); g.fillRect(0, y + 9, S, 4); } dot(1400, 1.5, 3.5, [0.7, 1.25]); blade(300, 3, 6, [0.8, 1.1], [[86, 104, 44]], 1, true); }
    const img = g.getImageData(0, 0, S, S), d = img.data, grain = GRAIN[m];
    if (grain) {
      const lat = [16, 32, 64, 128].map(f => { const a = new Float32Array(f * f); for (let q = 0; q < a.length; q++) a[q] = rnd(); return [f, a]; });
      const val = (f, a, x, y) => { const X = x / S * f, Y = y / S * f, i = Math.floor(X), j = Math.floor(Y), u = X - i, v = Y - j, s = u * u * (3 - 2 * u), r = v * v * (3 - 2 * v), at = (p, q) => a[((q % f) + f) % f * f + ((p % f) + f) % f]; return at(i, j) + (at(i + 1, j) - at(i, j)) * s + (at(i, j + 1) - at(i, j)) * r + (at(i, j) - at(i + 1, j) - at(i, j + 1) + at(i + 1, j + 1)) * s * r; };
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        let n = 0, amp = 0.5, norm = 0;
        for (const [f, a] of lat) { n += amp * val(f, a, x, y); norm += amp; amp *= 0.55; }
        const k = 1 + (n / norm - 0.5) * grain, q = (y * S + x) * 4;
        d[q] = Math.min(255, d[q] * k); d[q + 1] = Math.min(255, d[q + 1] * k); d[q + 2] = Math.min(255, d[q + 2] * k);
      }
    }
    for (let q = 0; q < d.length; q += 4) { const n = (rnd() - 0.5) * 14; d[q] = Math.max(0, Math.min(255, d[q] + n)); d[q + 1] = Math.max(0, Math.min(255, d[q + 1] + n)); d[q + 2] = Math.max(0, Math.min(255, d[q + 2] + n)); d[q + 3] = 255; }
    return d;
  };

  const grass = () => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const g = c.getContext('2d'), rnd = K.rng(919), CS = 128;
    g.lineCap = 'round';
    const at = k => [(k % 4) * CS, Math.floor(k / 4) * CS];
    const blades = (k, n, h, w, cols, spread, bend) => {
      const [ox, oy] = at(k);
      for (let i = 0; i < n; i++) {
        const off = (rnd() + rnd() + rnd() - 1.5) / 1.5, x = ox + CS / 2 + off * CS * spread * 0.5, len = h * (0.35 + rnd() * 0.65) * (1 - Math.abs(off) * 0.45), lean = (rnd() - 0.5) * bend + off * bend * 0.6, cc = cols[Math.floor(rnd() * cols.length)], ww = w * (0.6 + rnd() * 0.5);
        g.strokeStyle = `rgb(${cc[0]},${cc[1]},${cc[2]})`;
        const mx = x + lean * 0.35, my = oy + CS - len * 0.55;
        g.lineWidth = ww;
        g.beginPath(); g.moveTo(x, oy + CS - 1); g.quadraticCurveTo(x + lean * 0.1, oy + CS - len * 0.3, mx, my); g.stroke();
        g.lineWidth = ww * 0.55;
        g.beginPath(); g.moveTo(mx, my); g.quadraticCurveTo(x + lean * 0.75, oy + CS - len * 0.82, x + lean, oy + CS - len); g.stroke();
      }
    };
    const heads = (k, n, r, col, eye, yTop, yBot) => {
      const [ox, oy] = at(k);
      for (let i = 0; i < n; i++) {
        const x = ox + 20 + rnd() * (CS - 40), y = oy + CS * (yTop + rnd() * (yBot - yTop));
        g.strokeStyle = 'rgb(70,104,40)';
        g.lineWidth = 2;
        g.beginPath(); g.moveTo(x, oy + CS - 1); g.lineTo(x + (rnd() - 0.5) * 6, y); g.stroke();
        g.fillStyle = col;
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        if (eye) { g.fillStyle = eye; g.beginPath(); g.arc(x, y, r * 0.4, 0, Math.PI * 2); g.fill(); }
      }
    };
    const GR = [[64, 98, 36], [80, 116, 44], [58, 86, 32], [96, 124, 52]];
    blades(0, 90, 116, 2.6, GR, 0.9, 34);
    blades(1, 80, 124, 2.8, [[66, 100, 40], [84, 112, 46], [62, 90, 36], [100, 116, 56]], 0.9, 44);
    blades(2, 24, 50, 3, GR, 0.8, 20);
    { const [ox, oy] = at(2); for (let i = 0; i < 26; i++) { const x = ox + 12 + rnd() * (CS - 24), y = oy + CS - 18 - rnd() * 30; g.fillStyle = `rgb(${60 + rnd() * 20},${104 + rnd() * 24},${40})`; for (let l = 0; l < 3; l++) { g.beginPath(); g.ellipse(x + Math.cos(l * 2.1) * 5, y + Math.sin(l * 2.1) * 5, 5, 4, l, 0, Math.PI * 2); g.fill(); } } }
    blades(3, 26, 80, 2.5, GR, 0.8, 20); heads(3, 9, 7, 'rgb(244,244,236)', 'rgb(236,196,40)', 0.25, 0.5);
    blades(4, 26, 90, 2.5, GR, 0.8, 20); heads(4, 8, 6, 'rgb(70,104,214)', null, 0.2, 0.45);
    blades(5, 26, 70, 2.5, GR, 0.8, 20); heads(5, 8, 5, 'rgb(150,120,216)', null, 0.35, 0.6);
    blades(6, 22, 96, 2.5, GR, 0.8, 20); heads(6, 7, 8, 'rgb(214,40,32)', 'rgb(40,20,20)', 0.15, 0.4);
    { const [ox, oy] = at(7); for (let i = 0; i < 34; i++) { const x = ox + 8 + rnd() * (CS - 16), top = oy + 6 + rnd() * 20; g.strokeStyle = `rgb(${190 + rnd() * 30},${160 + rnd() * 30},${80 + rnd() * 20})`; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x, oy + CS - 1); g.lineTo(x + (rnd() - 0.5) * 8, top + 16); g.stroke(); g.fillStyle = `rgb(${200 + rnd() * 30},${168 + rnd() * 30},${84})`; g.beginPath(); g.ellipse(x + (rnd() - 0.5) * 6, top + 8, 2.6, 9, (rnd() - 0.5) * 0.3, 0, Math.PI * 2); g.fill(); } }
    blades(8, 18, 126, 4, [[96, 116, 56], [110, 120, 62], [84, 104, 48]], 0.7, 20); { const [ox, oy] = at(8); for (let i = 0; i < 5; i++) { const x = ox + 30 + rnd() * 70; g.fillStyle = 'rgb(96,64,34)'; g.beginPath(); g.ellipse(x, oy + 12 + rnd() * 14, 3.5, 10, 0, 0, Math.PI * 2); g.fill(); } }
    blades(9, 50, 90, 3, [[90, 110, 50], [104, 116, 58], [80, 98, 44]], 0.85, 60);
    { blades(10, 14, 40, 3, [[60, 90, 40]], 0.8, 20); const [ox, oy] = at(10); for (let i = 0; i < 60; i++) { const x = ox + 10 + rnd() * (CS - 20), y = oy + CS - 6 - rnd() * 34; g.fillStyle = i % 5 ? `rgb(${50 + rnd() * 20},${90 + rnd() * 30},${44})` : 'rgb(52,58,120)'; g.beginPath(); g.ellipse(x, y, i % 5 ? 4.5 : 3, i % 5 ? 3 : 3, rnd() * 3, 0, Math.PI * 2); g.fill(); } }
    blades(11, 50, 80, 2.5, [[150, 132, 80], [128, 116, 70], [170, 150, 96], [110, 104, 64]], 0.8, 50);
    return c;
  };

  const ground = () => {
    const rnd = K.rng(4242), out = new Uint8Array(GSIZE * GSIZE * 4 * GBASE.length);
    for (let m = 0; m < GBASE.length; m++) out.set(groundLayer(m, rnd), m * GSIZE * GSIZE * 4);
    return out;
  };

  K.Tex = { grass, GSIZE, GBASE, GTILE, ground, SIZE, REGIONS, flora: draw, region, PSIZE, PREG, pcell, people };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
