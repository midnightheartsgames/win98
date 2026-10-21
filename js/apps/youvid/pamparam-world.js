(function () {
  const { M4, rand, shade } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, mesh } = K;

  const COL = {
    floor: 0xc2b6a4,
    wallTop: 0xe6e6e4,
    wallYellow: 0xebd876,
    wallPanel: 0xdad8d2,
    pillar: 0xeeece8,
    curtain: 0x48494d,
    curtainDark: 0x37383c,
    wood: 0x9e6d3e,
    woodDark: 0x7c522b,
    woodLight: 0xc29864,
    benchBlue: 0x344d6e,
    steel: 0xcfd4da,
    steelDark: 0x7e848c,
    pvc: 0xf0f2f4,
    pvcShade: 0xd4d8dc,
    gasket: 0x282b30,
    cardboard: 0x9e8364,
    cardboardDark: 0x846b4e,
    label: 0xf4f4f0,
    hose: 0x222428
  };

  function slab(b, x0, y0, z0, x1, y1, z1, col, faces) {
    b.at((x0 + x1) / 2, y0, (z0 + z1) / 2, h => h.box(x1 - x0, y1 - y0, z1 - z0, col, { base: true, faces: faces || {} }));
  }

  function texFloor(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#c8bca8');
    gr.addColorStop(0.65, '#b8ac9c');
    gr.addColorStop(1, '#7c7a78');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    const g = rand(19);
    for (let i = 0; i < w * h * 0.22; i++) {
      const v = g();
      ctx.fillStyle = v < 0.5 ? `rgba(40,36,32,${0.08 * g()})` : `rgba(255,250,242,${0.08 * g()})`;
      ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 1 + Math.floor(g() * 3), 1 + Math.floor(g() * 2));
    }
    ctx.strokeStyle = 'rgba(70,64,58,0.28)';
    ctx.lineWidth = 1.5;
    for (let y = 32; y < h; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + (g() - 0.5) * 6);
      ctx.stroke();
    }
  }

  function texCurtain(ctx, w, h) {
    ctx.fillStyle = '#4c4d52';
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) {
      const gr = ctx.createLinearGradient(x, 0, x + 16, 0);
      gr.addColorStop(0, '#38393d');
      gr.addColorStop(0.45, '#5c5d63');
      gr.addColorStop(1, '#3e3f44');
      ctx.fillStyle = gr;
      ctx.fillRect(x, 0, 16, h);
    }
    const g = rand(43);
    for (let i = 0; i < 180; i++) {
      ctx.fillStyle = `rgba(220,220,225,${0.05 * g()})`;
      ctx.fillRect(g() * w, g() * h, 2 + g() * 6, 8 + g() * 24);
    }
  }

  function buildRackAndProfiles(b) {
    const z0 = -2.55, z1 = -2.05;
    [-3.4, -2.1, -0.85, 0.35, 1.35].forEach(x => {
      slab(b, x - 0.045, 0, z0, x + 0.045, 1.48, z0 + 0.09, COL.woodDark);
      slab(b, x - 0.045, 0, z1 - 0.09, x + 0.045, 1.48, z1, COL.wood);
      slab(b, x - 0.04, 1.42, z0, x + 0.04, 1.5, z1, COL.wood);
    });
    slab(b, -3.5, 1.46, z0 - 0.04, 1.45, 1.54, z1 + 0.06, COL.wood);
    slab(b, -3.5, 0.92, z0, 1.45, 0.98, z1 + 0.02, COL.woodDark);
    slab(b, -3.5, 0.44, z0, 1.45, 0.5, z1 + 0.02, COL.woodDark);

    const levels = [0.52, 0.62, 0.72, 0.82, 1.0, 1.1, 1.2, 1.3, 1.38];
    levels.forEach((y, idx) => {
      const col = idx % 2 === 0 ? COL.pvc : COL.steel;
      slab(b, -3.35, y, z0 + 0.06, -0.92, y + 0.055, z1 - 0.05, col);
      slab(b, -0.78, y, z0 + 0.06, 1.28, y + 0.055, z1 - 0.05, idx % 3 === 0 ? COL.pvcShade : col);
    });

    [-2.5, -1.65, -0.25, 0.55].forEach(x => {
      slab(b, x - 0.035, 0, -1.65, x + 0.035, 0.74, -1.57, COL.benchBlue);
      slab(b, x - 0.035, 0, -2.0, x + 0.035, 0.74, -1.92, COL.benchBlue);
      slab(b, x - 0.04, 0.72, -2.02, x + 0.04, 0.77, -1.55, COL.benchBlue);
    });
    slab(b, -2.65, 0.77, -1.98, 0.7, 0.83, -1.54, COL.wood);
    slab(b, -2.55, 0.83, -1.9, 0.6, 0.9, -1.6, COL.pvc);

    for (let i = 0; i < 10; i++) {
      const a0 = (i / 10) * PI * 1.4 - 0.4;
      const a1 = ((i + 1) / 10) * PI * 1.4 - 0.4;
      K.tube(b, [[-0.05 + C(a0) * 0.48, 0.02, -1.55 + S(a0) * 0.24], [-0.05 + C(a1) * 0.48, 0.02, -1.55 + S(a1) * 0.24]], [0.016, 0.016], 4, COL.hose);
    }
  }

  function buildLadder(b) {
    b.push(M4.translate(-0.28, 1.45, -2.05), M4.rotZ(-0.34), M4.rotX(0.18));
    [-0.16, 0.16].forEach(x => slab(b, x - 0.02, -0.1, -0.02, x + 0.02, 1.15, 0.02, COL.steel));
    for (let y = 0.08; y <= 1.0; y += 0.22) {
      slab(b, -0.15, y, -0.015, 0.15, y + 0.03, 0.015, COL.pvc);
    }
    b.pop();
    b.push(M4.translate(0.12, 1.48, -2.08), M4.rotZ(-0.58));
    slab(b, -0.025, 0, -0.02, 0.025, 0.68, 0.02, COL.wood);
    b.pop();
  }

  function buildBoxStacks(b) {
    slab(b, 1.38, 0, -2.55, 1.92, 3.3, -1.95, COL.pillar);
    [1.48, 1.56, 1.64].forEach(x => slab(b, x, 0, -1.94, x + 0.035, 2.35, -1.88, COL.steelDark));

    slab(b, 1.95, 0, -2.15, 4.15, 0.38, -1.45, COL.woodDark);
    for (let y = 0.4; y <= 1.18; y += 0.13) {
      slab(b, 1.92, y, -2.05, 4.1, y + 0.075, -1.42, y > 0.8 ? COL.pvc : COL.steel);
    }
    slab(b, 2.05, 0.52, -1.98, 2.95, 0.78, -1.5, COL.cardboard);

    const stackX = [2.15, 3.08];
    stackX.forEach((x0, si) => {
      const w = 0.86;
      for (let i = 0; i < 8; i++) {
        const y0 = 1.32 + i * 0.135;
        const dx = ((i * 3 + si) % 3 - 1) * 0.025;
        const c = (i + si) % 2 === 0 ? COL.cardboard : COL.cardboardDark;
        slab(b, x0 + dx, y0, -2.02, x0 + w + dx, y0 + 0.128, -1.46, c);
        if (i % 2 === 0) {
          b.quad([x0 + dx + 0.08, y0 + 0.03, -1.456], [x0 + dx + 0.34, y0 + 0.03, -1.456], [x0 + dx + 0.34, y0 + 0.095, -1.456], [x0 + dx + 0.08, y0 + 0.095, -1.456], COL.label);
        }
      }
    });
    slab(b, 1.88, 2.28, -1.96, 2.76, 2.42, -1.44, COL.cardboardDark);
  }

  function buildWindowFrame(b, x0, y0, z, w, h, d, col) {
    const fw = 0.085;
    slab(b, x0, y0, z, x0 + w, y0 + fw, z + d, col);
    slab(b, x0, y0 + h - fw, z, x0 + w, y0 + h, z + d, col);
    slab(b, x0, y0 + fw, z, x0 + fw, y0 + h - fw, z + d, col);
    slab(b, x0 + w - fw, y0 + fw, z, x0 + w, y0 + h - fw, z + d, col);
    const mx = x0 + w * 0.52;
    slab(b, mx - fw * 0.45, y0 + fw, z, mx + fw * 0.45, y0 + h - fw, z + d, col);
    const g = 0.012;
    slab(b, x0 + fw - g, y0 + fw - g, z + d + 0.002, x0 + w - fw + g, y0 + fw, z + d + 0.006, COL.gasket);
    slab(b, x0 + fw - g, y0 + h - fw, z + d + 0.002, x0 + w - fw + g, y0 + h - fw + g, z + d + 0.006, COL.gasket);
    slab(b, x0 + fw - g, y0 + fw, z + d + 0.002, x0 + fw, y0 + h - fw, z + d + 0.006, COL.gasket);
    slab(b, x0 + w - fw, y0 + fw, z + d + 0.002, x0 + w - fw + g, y0 + h - fw, z + d + 0.006, COL.gasket);
  }

  function buildRightFrames(b) {
    slab(b, 3.85, 0, -1.65, 5.75, 0.14, -0.58, COL.woodDark);
    [4.1, 4.9, 5.45].forEach(x => slab(b, x, 0.14, -1.6, x + 0.14, 0.24, -0.55, COL.wood));

    slab(b, 3.82, 0.24, -1.58, 5.55, 1.55, -1.42, COL.woodLight);
    slab(b, 3.72, 1.38, -1.52, 5.65, 1.52, -0.82, COL.woodLight);
    slab(b, 3.92, 0.92, -1.48, 5.62, 1.06, -0.78, COL.wood);

    buildWindowFrame(b, 4.02, 0.24, -1.24, 1.55, 1.36, 0.07, COL.pvcShade);
    buildWindowFrame(b, 4.1, 0.24, -1.08, 1.55, 1.36, 0.07, COL.pvc);
    buildWindowFrame(b, 4.18, 0.24, -0.92, 1.52, 1.34, 0.075, COL.pvc);

    slab(b, 4.28, 0.45, -0.88, 5.58, 0.56, -0.83, COL.pvc);
    slab(b, 4.28, 0.76, -0.88, 5.58, 0.85, -0.83, COL.woodLight);

    slab(b, 4.12, 1.58, -1.18, 4.38, 2.08, -0.9, COL.cardboard);
    slab(b, 4.55, 1.62, -1.35, 5.65, 2.04, -1.18, COL.woodDark);

    buildWindowFrame(b, 2.75, 1.45, -2.35, 1.15, 0.95, 0.06, COL.gasket);
  }

  function buildWallsAndForeground(b) {
    slab(b, -5.5, 0, -2.75, 7.2, 1.38, -2.55, COL.wallPanel);
    slab(b, -5.5, 1.38, -2.75, 1.4, 2.08, -2.55, COL.wallYellow);
    slab(b, -5.5, 2.08, -2.75, 7.2, 3.6, -2.55, COL.wallTop);
    slab(b, 1.4, 1.38, -2.75, 7.2, 2.08, -2.55, COL.wallTop);

    slab(b, -5.5, 3.45, -2.75, 7.2, 3.65, 2.5, shade(COL.wallTop, 0.88));
    for (let x = -4.0; x <= 6.0; x += 2.5) {
      slab(b, x - 0.06, 3.25, -2.7, x + 0.06, 3.45, 2.2, COL.steelDark);
      slab(b, x - 0.6, 3.2, -0.8, x + 0.6, 3.26, -0.65, 0xfafcff);
    }

    slab(b, -3.15, 0, 0.45, -2.18, 3.5, 1.35, COL.pillar);
    slab(b, -2.18, 0, 0.52, -2.1, 3.5, 1.28, shade(COL.pillar, 0.88));
  }

  function build(r) {
    const T = {
      floor: r.texture(256, texFloor),
      curtain: r.texture(256, texCurtain)
    };

    const floor = mesh(r, b => {
      const n = [0, 1, 0];
      b.quad([-6, 0, 3.6], [7.5, 0, 3.6], [7.5, 0, -2.8], [-6, 0, -2.8], 0xffffff, [[0, 1], [3, 1], [3, 0], [0, 0]], [n, n, n, n]);
    });

    const curtain = mesh(r, b => {
      const n = [0, 0, 1];
      b.quad([-3.2, 1.88, -1.42], [1.18, 1.88, -1.42], [1.18, 3.45, -1.42], [-3.2, 3.45, -1.42], 0xffffff, [[0, 0], [3, 0], [3, 1], [0, 1]], [n, n, n, n]);
    });

    const workshop = mesh(r, b => {
      buildWallsAndForeground(b);
      buildRackAndProfiles(b);
      buildLadder(b);
      buildBoxStacks(b);
      buildRightFrames(b);
    });

    const shadowBlob = mesh(r, b => {
      const n = 14;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        b.tri([0, 0, 0], [C(a1), 0, S(a1)], [C(a0), 0, S(a0)], [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
      }
    });

    return { T, floor, curtain, workshop, shadowBlob };
  }

  function draw(r, W) {
    r.draw(W.floor, null, { texture: W.T.floor });
    r.draw(W.workshop);
    r.draw(W.curtain, null, { texture: W.T.curtain });
  }

  window.PamparamWorld = { COL, build, draw };
})();
