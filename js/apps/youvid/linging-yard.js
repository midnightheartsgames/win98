(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp } = K;

  const COL = {
    skyTop: 0xd8ecfa,
    skyBot: 0xf7ebd2,
    stoneSun: 0xe8cab0,
    stoneMid: 0xc8ae96,
    stoneShadow: 0x747682,
    stepLight: 0xd8cfc2,
    stepDark: 0x7e8088,
    wallSun: 0xe6be8a,
    wallMid: 0xc29e72,
    wallShadow: 0x786a5e,
    woodDark: 0x4e392c,
    woodMid: 0x6e523e,
    woodLight: 0x9c7a58,
    roofDark: 0x3b444b,
    roofMid: 0x56626a,
    barkDark: 0x68533e,
    barkLight: 0x9e825c,
    leafDark: 0x385e32,
    leafMid: 0x5e9444,
    leafBright: 0x98cc5e,
    moss: 0x7ea046,
    pot: 0x5c4234
  };

  function boxAt(b, pos, size, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.box(size[0], size[1], size[2], col);
    if (rotM) b.pop();
    b.pop();
  }

  function sphereAt(b, pos, r, seg, rings, col) {
    b.at(pos[0], pos[1], pos[2], q => q.ellipsoid(r, r, r, seg, rings, col));
  }

  function cylBetween(b, p0, p1, r0, r1, sides, col) {
    K.tube(b, [p0, p1], [r0, r1], sides, col);
  }

  function noise(ctx, w, h, seed, amount, count) {
    const g = rand(seed);
    for (let i = 0; i < count; i++) {
      const v = g();
      ctx.fillStyle = v < 0.5 ? `rgba(0,0,0,${amount * g()})` : `rgba(255,255,255,${amount * g()})`;
      ctx.fillRect(g() * w, g() * h, 1 + g() * 3, 1 + g() * 2);
    }
  }

  function texCourtyardFloor(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#eccab0');
    gr.addColorStop(0.62, '#e5c2a6');
    gr.addColorStop(0.7, '#7d7f8c');
    gr.addColorStop(1, '#686a76');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);

    const sideL = ctx.createLinearGradient(0, 0, w * 0.3, 0);
    sideL.addColorStop(0, 'rgba(68,72,86,0.72)');
    sideL.addColorStop(0.65, 'rgba(68,72,86,0.22)');
    sideL.addColorStop(1, 'rgba(68,72,86,0)');
    ctx.fillStyle = sideL;
    ctx.fillRect(0, 0, w * 0.3, h);

    const sideR = ctx.createLinearGradient(w, 0, w * 0.7, 0);
    sideR.addColorStop(0, 'rgba(68,72,86,0.58)');
    sideR.addColorStop(0.65, 'rgba(68,72,86,0.16)');
    sideR.addColorStop(1, 'rgba(68,72,86,0)');
    ctx.fillStyle = sideR;
    ctx.fillRect(w * 0.7, 0, w * 0.3, h);

    const g = rand(301);
    const rows = 18, cols = 14;
    const rh = h / rows, cw = w / cols;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * (cw * 0.5);
      const inShadow = r > rows * 0.64;
      for (let c = -1; c <= cols; c++) {
        const x = c * cw + off;
        const y = r * rh;
        const tone = (g() - 0.5) * 22;
        if (inShadow) {
          ctx.fillStyle = `rgba(${clamp(112 + tone, 80, 145)},${clamp(114 + tone, 82, 148)},${clamp(128 + tone, 95, 160)},0.48)`;
        } else {
          ctx.fillStyle = `rgba(${clamp(234 + tone, 200, 252)},${clamp(198 + tone, 168, 224)},${clamp(170 + tone, 142, 198)},0.48)`;
        }
        ctx.fillRect(x + 2, y + 2, cw - 4, rh - 4);
        ctx.strokeStyle = inShadow ? 'rgba(52,54,64,0.55)' : 'rgba(168,132,106,0.52)';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(x + 1, y + 1, cw - 2, rh - 2);
      }
    }

    for (let i = 0; i < 16; i++) {
      const lx = w * (0.58 + g() * 0.22);
      const ly = h * (0.44 + g() * 0.22);
      ctx.fillStyle = i % 2 ? 'rgba(132,178,68,0.85)' : 'rgba(104,152,52,0.8)';
      ctx.beginPath();
      ctx.ellipse(lx, ly, 3 + g() * 4, 1.8 + g() * 2.2, g() * PI, 0, PI * 2);
      ctx.fill();
    }

    noise(ctx, w, h, 309, 0.08, w * h * 0.05);
  }

  function texWallPlaster(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#6a5d52');
    gr.addColorStop(0.22, '#8c7864');
    gr.addColorStop(0.34, '#e2ba86');
    gr.addColorStop(1, '#d8ae78');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);

    const g = rand(401);
    ctx.fillStyle = 'rgba(98,82,66,0.32)';
    for (let i = 0; i < 18; i++) {
      const rx = w * (0.04 + g() * 0.36);
      const ry = h * (0.18 + g() * 0.55);
      ctx.beginPath();
      ctx.ellipse(rx, ry, 18 + g() * 34, 10 + g() * 24, (g() - 0.5) * 0.6, 0, PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 14; i++) {
      const rx = w * (0.52 + g() * 0.28);
      const ry = h * (0.22 + g() * 0.48);
      ctx.beginPath();
      ctx.ellipse(rx, ry, 14 + g() * 28, 8 + g() * 20, (g() - 0.5) * 0.6, 0, PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#5e646c';
    ctx.fillRect(0, h * 0.86, w, h * 0.14);
    noise(ctx, w, h, 409, 0.08, w * h * 0.05);
  }

  function texRoofTiles(ctx, w, h) {
    ctx.fillStyle = '#434d55';
    ctx.fillRect(0, 0, w, h);
    const cols = 20;
    const cw = w / cols;
    for (let i = 0; i < cols; i++) {
      const x = i * cw;
      const g = ctx.createLinearGradient(x, 0, x + cw, 0);
      g.addColorStop(0, '#2c343a');
      g.addColorStop(0.45, '#66737d');
      g.addColorStop(0.85, '#3b444b');
      g.addColorStop(1, '#252c31');
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, cw, h);
    }
    const rows = 10;
    const rh = h / rows;
    ctx.strokeStyle = 'rgba(22,26,30,0.55)';
    ctx.lineWidth = 2;
    for (let r = 1; r < rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * rh);
      ctx.lineTo(w, r * rh);
      ctx.stroke();
    }
    ctx.fillStyle = '#8b98a0';
    for (let i = 0; i < cols; i++) {
      ctx.beginPath();
      ctx.arc((i + 0.5) * cw, h - 5, cw * 0.32, 0, PI * 2);
      ctx.fill();
    }
  }

  function texBambooScreen(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#b5976c');
    gr.addColorStop(0.5, '#d5b98c');
    gr.addColorStop(1, '#a68960');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#4e392a';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.beginPath();
    ctx.moveTo(w / 3, 0); ctx.lineTo(w / 3, h);
    ctx.moveTo((w * 2) / 3, 0); ctx.lineTo((w * 2) / 3, h);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(92,68,44,0.35)';
    ctx.lineWidth = 1.5;
    for (let y = 6; y < h - 6; y += 5) {
      ctx.beginPath();
      ctx.moveTo(4, y);
      ctx.lineTo(w - 4, y);
      ctx.stroke();
    }
  }

  function addFoliageCluster(b, cx, cy, cz, rx, ry, rz, seed) {
    const g = rand(seed);
    const cols = [COL.leafDark, COL.leafMid, COL.leafBright];
    for (let i = 0; i < 14; i++) {
      const a = g() * PI * 2;
      const u = (g() - 0.4) * 1.4;
      const r = 0.35 + g() * 0.65;
      const px = cx + C(a) * rx * r;
      const py = cy + u * ry * 0.65;
      const pz = cz + S(a) * rz * r;
      const sr = (0.14 + g() * 0.16) * Math.min(rx, rz) * 1.5;
      const col = cols[Math.min(2, Math.floor((u + 0.8) * 1.4 + g() * 0.7))];
      sphereAt(b, [px, py, pz], sr, 7, 5, col);
    }
  }

  function addGnarledTree(b) {
    boxAt(b, [0.42, 0.14, -3.35], [1.25, 0.28, 1.05], COL.stepDark);
    boxAt(b, [0.42, 0.29, -3.35], [1.34, 0.05, 1.14], COL.stepLight);
    boxAt(b, [0.42, 0.3, -3.35], [1.14, 0.04, 0.94], COL.moss);

    const pts = [
      [0.48, 0.22, -3.32],
      [0.62, 0.62, -3.25],
      [0.74, 1.08, -3.2],
      [0.68, 1.52, -3.18],
      [0.42, 1.92, -3.2],
      [0.12, 2.28, -3.24],
      [-0.18, 2.58, -3.28]
    ];
    const radii = [0.24, 0.21, 0.18, 0.15, 0.12, 0.09, 0.06];
    K.tube(b, pts, radii, 9, COL.barkLight);

    const root1 = [[0.24, 0.28, -3.14], [0.4, 0.44, -3.24], [0.54, 0.68, -3.26]];
    K.tube(b, root1, [0.08, 0.1, 0.09], 7, COL.barkDark);
    const root2 = [[0.72, 0.28, -3.18], [0.66, 0.52, -3.24], [0.7, 0.84, -3.2]];
    K.tube(b, root2, [0.08, 0.09, 0.08], 7, COL.barkDark);

    const br1 = [[0.66, 1.44, -3.18], [0.34, 1.62, -3.06], [0.08, 1.76, -3.0]];
    K.tube(b, br1, [0.08, 0.06, 0.035], 6, COL.barkDark);
    const br2 = [[0.34, 2.0, -3.2], [0.62, 2.34, -3.14], [0.86, 2.55, -3.1]];
    K.tube(b, br2, [0.08, 0.055, 0.035], 6, COL.barkLight);

    addFoliageCluster(b, 0.12, 1.82, -2.98, 0.34, 0.22, 0.28, 501);
    addFoliageCluster(b, -0.18, 2.65, -3.18, 0.62, 0.34, 0.42, 502);
    addFoliageCluster(b, 0.38, 2.85, -3.15, 0.68, 0.38, 0.46, 503);
    addFoliageCluster(b, 0.88, 2.62, -3.08, 0.46, 0.28, 0.38, 504);
    addFoliageCluster(b, -0.58, 2.92, -3.25, 0.55, 0.32, 0.4, 505);
  }

  function addPavilion(b, side) {
    const s = side;
    const xBase = s * 2.25;
    boxAt(b, [xBase, 0.18, -1.55], [1.65, 0.36, 4.8], COL.stepDark);
    boxAt(b, [xBase, 0.37, -1.55], [1.72, 0.05, 4.88], COL.stepLight);

    const stZ = -1.35;
    for (let i = 0; i < 4; i++) {
      const h = (i + 1) * 0.09;
      const x = s * (0.98 + i * 0.13);
      boxAt(b, [x, h * 0.5, stZ], [0.18, h, 1.05], i % 2 ? COL.stepLight : COL.stoneMid);
    }
    boxAt(b, [s * 1.18, 0.19, stZ - 0.58], [0.62, 0.36, 0.1], COL.stepLight);
    boxAt(b, [s * 1.18, 0.19, stZ + 0.58], [0.62, 0.36, 0.1], COL.stepLight);

    const colX = s * 1.52;
    [-3.3, -1.95, -0.65, 0.55].forEach(z => {
      cylBetween(b, [colX, 0.38, z], [colX, 2.35, z], 0.072, 0.068, 10, COL.woodDark);
      boxAt(b, [colX, 0.41, z], [0.18, 0.07, 0.18], COL.stepDark);
    });

    boxAt(b, [colX, 2.28, -1.55], [0.15, 0.16, 4.6], COL.woodDark);
    boxAt(b, [colX, 2.04, -1.55], [0.1, 0.09, 4.5], COL.woodMid);

    boxAt(b, [colX, 0.64, -2.62], [0.08, 0.38, 1.25], COL.woodMid);
    boxAt(b, [colX, 0.84, -2.62], [0.12, 0.05, 1.3], COL.woodLight);

    boxAt(b, [s * 2.65, 1.45, -1.55], [0.22, 2.2, 4.6], COL.wallMid);
    boxAt(b, [s * 2.1, 1.4, -2.62], [0.95, 2.0, 1.2], 0x28231e);

    const potX = s * 1.78, potZ = -3.2;
    cylBetween(b, [potX, 0.38, potZ], [potX, 0.62, potZ], 0.14, 0.18, 10, COL.pot);
    cylBetween(b, [potX, 0.62, potZ], [potX, 1.18, potZ], 0.035, 0.025, 7, COL.barkDark);
    addFoliageCluster(b, potX, 1.28, potZ, 0.28, 0.22, 0.28, side < 0 ? 611 : 612);

    if (side > 0) {
      cylBetween(b, [1.62, 0.38, -2.12], [1.62, 0.58, -2.12], 0.075, 0.085, 8, 0xc88a3e);
      cylBetween(b, [1.76, 0.38, -2.28], [1.76, 0.54, -2.28], 0.065, 0.075, 8, 0xb47832);
      boxAt(b, [1.52, 0.24, 0.15], [0.38, 0.22, 0.48], COL.stepLight);
    } else {
      boxAt(b, [-1.46, 0.54, -2.02], [0.05, 0.38, 0.22], 0xc68642, M4.rotZ(-0.28));
    }
  }

  function addPeepRing(b, r0, r1, col0, col1) {
    const cx = 320, cy = 180;
    const rx = 306, ry = 202;
    const segs = 64;
    const n = [0, 0, 1];
    const c0 = rgb(col0, 1), c1 = rgb(col1 === undefined ? col0 : col1, 1);
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * PI * 2, a1 = ((i + 1) / segs) * PI * 2;
      const p0 = [cx + C(a0) * rx * r0, cy + S(a0) * ry * r0, 0];
      const p1 = [cx + C(a1) * rx * r0, cy + S(a1) * ry * r0, 0];
      const q0 = [cx + C(a0) * rx * r1, cy + S(a0) * ry * r1, 0];
      const q1 = [cx + C(a1) * rx * r1, cy + S(a1) * ry * r1, 0];
      b.quad(p0, p1, q1, q0, [c0, c0, c1, c1], null, [n, n, n, n]);
    }
  }

  function build(r) {
    const tFloor = r.texture(512, texCourtyardFloor);
    const tWall = r.texture(512, texWallPlaster, { height: 256, clamp: true });
    const tRoof = r.texture(256, texRoofTiles, { height: 128 });
    const tScreen = r.texture(256, texBambooScreen, { clamp: true });
    const ov = K.overlay(r, 640, 360);

    const mPeepOuter = K.mesh(r, b => {
      addPeepRing(b, 0.985, 1.85, 0x161412, 0x050506);
    });
    const mPeepRim = K.mesh(r, b => {
      addPeepRing(b, 0.945, 0.985, 0x685a46, 0x1a1714);
    });
    const mPeepGlass = K.mesh(r, b => {
      addPeepRing(b, 0.905, 0.945, 0x2c251c, 0x564938);
    });

    const mSky = K.mesh(r, b => {
      const cTop = rgb(COL.skyTop, 1), cBot = rgb(COL.skyBot, 1);
      b.quad([-18, 12, -14], [18, 12, -14], [18, -1, -14], [-18, -1, -14], [cTop, cTop, cBot, cBot], null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    });

    const mFloor = K.mesh(r, b => {
      const c = [1, 1, 1, 0];
      b.quad([-4.6, 0, -4.8], [4.6, 0, -4.8], [4.6, 0, 2.2], [-4.6, 0, 2.2], [c, c, c, c], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    });

    const mBackWall = K.mesh(r, b => {
      const c = [1, 1, 1, 0];
      b.quad([-4.6, 2.65, -4.15], [4.6, 2.65, -4.15], [4.6, 0, -4.15], [-4.6, 0, -4.15], [c, c, c, c], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    });

    const mScreens = K.mesh(r, b => {
      const c = [1, 1, 1, 0];
      b.quad([-1.56, 2.02, -1.95], [-1.56, 2.02, -3.28], [-1.56, 1.05, -3.28], [-1.56, 1.05, -1.95], [c, c, c, c], [[0, 0], [1, 0], [1, 1], [0, 1]], [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]);
      b.quad([1.56, 2.02, -3.28], [1.56, 2.02, -1.95], [1.56, 1.05, -1.95], [1.56, 1.05, -3.28], [c, c, c, c], [[0, 0], [1, 0], [1, 1], [0, 1]], [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0]]);
    });

    const mRoofs = K.mesh(r, b => {
      const c = [1, 1, 1, 0];
      b.quad([-4.8, 3.15, -4.55], [4.8, 3.15, -4.55], [4.8, 2.55, -3.85], [-4.8, 2.55, -3.85], [c, c, c, c], [[0, 0], [4, 0], [4, 1], [0, 1]], [[0, 0.8, 0.6], [0, 0.8, 0.6], [0, 0.8, 0.6], [0, 0.8, 0.6]]);
      b.quad([-2.75, 3.1, 0.8], [-2.75, 3.1, -3.8], [-1.15, 2.32, -3.8], [-1.15, 2.32, 0.8], [c, c, c, c], [[0, 0], [3, 0], [3, 1], [0, 1]], [[0.6, 0.8, 0], [0.6, 0.8, 0], [0.6, 0.8, 0], [0.6, 0.8, 0]]);
      b.quad([2.75, 3.1, -3.8], [2.75, 3.1, 0.8], [1.15, 2.32, 0.8], [1.15, 2.32, -3.8], [c, c, c, c], [[0, 0], [3, 0], [3, 1], [0, 1]], [[-0.6, 0.8, 0], [-0.6, 0.8, 0], [-0.6, 0.8, 0], [-0.6, 0.8, 0]]);
      b.quad([-4.2, 4.35, -5.8], [4.2, 4.35, -5.8], [4.2, 3.25, -4.6], [-4.2, 3.25, -4.6], [c, c, c, c], [[0, 0], [4, 0], [4, 1], [0, 1]], [[0, 0.75, 0.65], [0, 0.75, 0.65], [0, 0.75, 0.65], [0, 0.75, 0.65]]);
    });

    const mYard = K.mesh(r, b => {
      boxAt(b, [0, 0.14, 1.12], [4.2, 0.28, 0.75], COL.stoneShadow);
      boxAt(b, [0, 0.29, 0.78], [4.2, 0.04, 0.14], 0x888b96);

      [-1.02, 0.35].forEach(wx => {
        boxAt(b, [wx, 1.38, -4.11], [0.58, 0.32, 0.08], COL.roofMid);
        boxAt(b, [wx, 1.38, -4.09], [0.46, 0.22, 0.08], 0x2d3338);
      });

      boxAt(b, [0, 3.65, -5.6], [7.8, 1.1, 0.6], COL.woodDark);
      addGnarledTree(b);
      addPavilion(b, -1);
      addPavilion(b, 1);
    });

    return { tFloor, tWall, tRoof, tScreen, ov, mPeepOuter, mPeepRim, mPeepGlass, mSky, mFloor, mBackWall, mScreens, mRoofs, mYard };
  }

  function draw(r, W) {
    r.draw(W.mSky, M4.ident(), { noFog: true });
    r.draw(W.mFloor, M4.ident(), { texture: W.tFloor });
    r.draw(W.mBackWall, M4.ident(), { texture: W.tWall });
    r.draw(W.mScreens, M4.ident(), { texture: W.tScreen });
    r.draw(W.mRoofs, M4.ident(), { texture: W.tRoof });
    r.draw(W.mYard, M4.ident());
  }

  function drawPeephole(r, W) {
    W.ov.begin();
    r.draw(W.mPeepGlass, M4.ident(), { noFog: true, blend: true, alpha: 0.26 });
    r.draw(W.mPeepRim, M4.ident(), { noFog: true, blend: true, alpha: 0.65 });
    r.draw(W.mPeepOuter, M4.ident(), { noFog: true });
  }

  window.LingingYard = { build, draw, drawPeephole };
})();
