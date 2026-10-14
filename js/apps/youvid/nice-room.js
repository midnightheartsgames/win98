(function () {
  const { M4, V3, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp, mesh, tube } = K;

  const EYE = [0.362, 1.133, 1.576];
  const FOV = 44;
  const BACK = -3.53;
  const SIDE = 0.42;
  const FRONT = -1.32;
  const LEFT = -2.65;
  const RIGHT = 2.6;
  const CEIL = 3.25;

  function texWallpaper(ctx, w, h) {
    const g = rand(11);
    ctx.fillStyle = '#e2d9c4';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(160, 140, 100, 0.06)' : 'rgba(255, 250, 235, 0.08)';
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 4 + g() * 16, 3 + g() * 10, g() * PI, 0, PI * 2);
      ctx.fill();
    }
    const sprig = (x, y, s) => {
      ctx.strokeStyle = 'rgba(104, 110, 106, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.8, x + s, y - s * 1.2);
      ctx.stroke();
      for (let k = 0; k < 4; k++) {
        const t = 0.25 + k * 0.22;
        const px = x + s * t, py = y - s * 1.2 * t;
        ctx.fillStyle = k % 2 ? 'rgba(128, 136, 128, 0.8)' : 'rgba(162, 160, 146, 0.8)';
        ctx.beginPath();
        ctx.ellipse(px + (k % 2 ? 4 : -4), py, 4, 2, (k % 2 ? 0.6 : -0.6), 0, PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(190, 160, 150, 0.85)';
      ctx.beginPath();
      ctx.arc(x + s, y - s * 1.2, 3, 0, PI * 2);
      ctx.fill();
    };
    for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) sprig((i + (j % 2) * 0.5) * (w / 6) + 6, (j + 0.8) * (h / 6), 14 + g() * 6);
  }

  function texTulle(ctx, w, h) {
    const g = rand(5);
    ctx.fillStyle = '#faf7f0';
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x++) {
      const k = Math.pow(0.5 + 0.5 * S((x / w) * PI * 8), 3);
      ctx.fillStyle = `rgba(120, 108, 86, ${0.02 + k * 0.38})`;
      ctx.fillRect(x, 0, 1, h);
    }
    for (let i = 0; i < 26; i++) {
      const x = g() * w, y = g() * h;
      ctx.fillStyle = 'rgba(205, 196, 176, 0.9)';
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + C(a) * 3, y + S(a) * 3, 2.4, 1.4, a, 0, PI * 2);
        ctx.fill();
      }
    }
  }

  function texParquet(ctx, w, h) {
    const g = rand(17);
    ctx.fillStyle = '#b8864e';
    ctx.fillRect(0, 0, w, h);
    const bw = w / 8, bh = h / 2;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 8; i++) {
      const tone = 0.85 + g() * 0.3;
      ctx.fillStyle = `rgb(${Math.round(184 * tone)}, ${Math.round(134 * tone)}, ${Math.round(78 * tone)})`;
      ctx.fillRect(i * bw, j * bh + (i % 2) * bh * 0.5, bw - 1, bh - 1);
      ctx.strokeStyle = 'rgba(110, 70, 30, 0.25)';
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(i * bw + 2 + g() * (bw - 4), j * bh);
        ctx.lineTo(i * bw + 2 + g() * (bw - 4), j * bh + bh);
        ctx.stroke();
      }
    }
  }

  function texPlaid(ctx, w, h) {
    ctx.fillStyle = '#c03a2c';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(90, 18, 12, 0.3)';
    for (let i = 0; i < 4; i++) ctx.fillRect(i * w / 4 + w / 12, 0, w / 10, h);
    ctx.fillStyle = 'rgba(244, 232, 214, 0.95)';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(i * w / 4, 0, 4, h);
      ctx.fillRect(0, i * h / 4, w, 4);
    }
    ctx.fillStyle = 'rgba(30, 10, 8, 0.7)';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(i * w / 4 + 7, 0, 2, h);
      ctx.fillRect(0, i * h / 4 + 7, w, 2);
    }
  }

  function texWestern(ctx, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#d8541e');
    sky.addColorStop(0.55, '#e8792a');
    sky.addColorStop(1, '#b8331c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f2a640';
    ctx.beginPath();
    ctx.arc(w * 0.62, h * 0.32, w * 0.3, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9e1e18';
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h);
    ctx.lineTo(w * 0.28, h * 0.42);
    ctx.lineTo(w * 0.45, h * 0.3);
    ctx.lineTo(w * 0.62, h * 0.4);
    ctx.lineTo(w * 0.78, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a1414';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.17, w * 0.24, h * 0.025, -0.1, 0, PI * 2);
    ctx.fill();
    ctx.fillRect(w * 0.4, h * 0.09, w * 0.2, h * 0.08);
    ctx.fillStyle = '#c88a64';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.25, w * 0.1, h * 0.07, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2418';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.29, w * 0.09, h * 0.035, 0, 0, PI);
    ctx.fill();
    ctx.strokeStyle = '#2a1a14';
    ctx.lineWidth = w * 0.035;
    ctx.beginPath();
    ctx.moveTo(w * 0.32, h * 0.38);
    ctx.lineTo(w * 0.66, h * 0.62);
    ctx.stroke();
    ctx.fillStyle = '#5a5a5e';
    ctx.fillRect(w * 0.08, h * 0.3, w * 0.2, h * 0.035);
    ctx.fillStyle = '#c88a64';
    ctx.beginPath();
    ctx.arc(w * 0.27, h * 0.33, w * 0.05, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#121010';
    ctx.fillRect(w * 0.86, 0, w * 0.14, h);
    ctx.save();
    ctx.translate(w * 0.95, h * 0.04);
    ctx.rotate(PI / 2);
    ctx.fillStyle = '#e8e0d0';
    ctx.font = `bold ${Math.round(w * 0.075)}px Georgia, serif`;
    ctx.fillText('ДИКИЙ КАНЬОН', 0, 0);
    ctx.restore();
  }

  function texSmallPoster(ctx, w, h) {
    ctx.fillStyle = '#c23a20';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1a1212';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.35, w * 0.3, h * 0.2, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0e6d2';
    ctx.font = `bold ${Math.round(w * 0.17)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ДИКИЙ', w / 2, h * 0.78);
    ctx.fillText('КАНЬОН', w / 2, h * 0.92);
  }

  function texYellow(ctx, w, h) {
    ctx.fillStyle = '#e2b437';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c47a28';
    ctx.beginPath();
    ctx.arc(w * 0.6, h * 0.45, w * 0.3, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#20304a';
    ctx.fillRect(w * 0.25, 0, w * 0.22, h * 0.8);
    ctx.fillStyle = '#f2f2f2';
    for (let i = 0; i < 6; i++) ctx.fillRect(w * 0.25, i * h * 0.13 + h * 0.03, w * 0.22, h * 0.03);
  }

  function texLeather(ctx, w, h) {
    const g = rand(23);
    ctx.fillStyle = '#8a979e';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(60, 62, 66, 0.08)' : 'rgba(220, 222, 224, 0.08)';
      ctx.fillRect(g() * w, g() * h, 2 + g() * 6, 1 + g() * 3);
    }
    ctx.strokeStyle = 'rgba(30, 30, 34, 0.55)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      let x = g() * w, y = g() * h;
      ctx.moveTo(x, y);
      for (let k = 0; k < 4; k++) {
        x += (g() - 0.5) * 24;
        y += 4 + g() * 10;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function texRug(ctx, w, h) {
    ctx.fillStyle = '#b9ae94';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#4a5a6a';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.strokeStyle = '#7a5040';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, w * (0.12 + i * 0.07), h * (0.1 + i * 0.06), 0, 0, PI * 2);
      ctx.stroke();
    }
  }

  function quad(b, a, c, d, e, col, uvs) {
    b.quad(a, c, d, e, col, uvs || [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }

  function rect(b, x0, y0, x1, y1, z, col, us, vs) {
    quad(b, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, [[0, 0], [us || 1, 0], [us || 1, vs || 1], [0, vs || 1]]);
  }

  function buildWalls(b) {
    const W = [1, 1, 1, 0];
    rect(b, LEFT, 0, -2.39, CEIL, BACK, W, 1, 2);
    rect(b, -0.02, 0, SIDE, CEIL, BACK, W, 0.6, 2);
    rect(b, -2.39, 0, -0.02, 0.75, BACK, W, 2, 0.5);
    quad(b, [SIDE, 0, BACK], [SIDE, 0, FRONT], [SIDE, CEIL, FRONT], [SIDE, CEIL, BACK], W, [[0, 0], [1.5, 0], [1.5, 2], [0, 2]]);
    rect(b, SIDE, 0, RIGHT, CEIL, FRONT, W, 1.6, 2);
    quad(b, [LEFT, 0, 2], [LEFT, 0, BACK], [LEFT, CEIL, BACK], [LEFT, CEIL, 2], W, [[0, 0], [4, 0], [4, 2], [0, 2]]);
  }

  function buildFloor(b) {
    quad(b, [LEFT, 0, 2], [RIGHT, 0, 2], [RIGHT, 0, BACK], [LEFT, 0, BACK], [1, 1, 1, 0], [[0, 0], [5, 0], [5, 5.5], [0, 5.5]]);
  }

  function buildCeiling(b) {
    quad(b, [LEFT, CEIL, BACK], [RIGHT, CEIL, BACK], [RIGHT, CEIL, 2], [LEFT, CEIL, 2], [0.86, 0.84, 0.8, 0]);
  }

  function buildTulle(b) {
    const nx = 40;
    const x0 = -2.39, x1 = -0.02, y0 = 0.75, y1 = CEIL - 0.08, z = BACK + 0.12;
    for (let i = 0; i < nx; i++) {
      const xa = lerp(x0, x1, i / nx), xb = lerp(x0, x1, (i + 1) / nx);
      const za = z + (i % 2 ? 0.05 : 0), zb = z + ((i + 1) % 2 ? 0.05 : 0);
      const na = V3.norm([i % 2 ? 0.5 : -0.5, 0, 1]), nb = na;
      b.quad([xa, y0, za], [xb, y0, zb], [xb, y1, zb], [xa, y1, za], [1.02, 1, 0.96, 0.45], [[i / nx * 4, 0], [(i + 1) / nx * 4, 0], [(i + 1) / nx * 4, 3], [i / nx * 4, 3]], [na, nb, nb, na]);
    }
    b.at((x0 + x1) / 2, y1 + 0.03, z, h => h.box(x1 - x0 + 0.3, 0.05, 0.08, [0.75, 0.68, 0.5, 0]));
  }

  function buildRadiator(b) {
    const white = [0.92, 0.91, 0.88, 0];
    for (let i = 0; i < 12; i++) b.at(-1.9 + i * 0.075, 0.06, BACK + 0.1, h => h.box(0.06, 0.36, 0.08, white, { base: true }));
    b.at(-1.48, 0.7, BACK + 0.1, h => h.box(2.5, 0.05, 0.22, [0.95, 0.94, 0.92, 0]));
  }

  function buildBed(b) {
    b.at(-1.85, 0, -1.9, h => h.box(1.5, 0.42, 3.0, [0.32, 0.18, 0.12, 0], { base: true }));
    b.at(-1.85, 0.42, -3.32, h => h.box(1.5, 0.36, 0.2, [0.26, 0.5, 0.26, 0], { base: true }));
  }

  function buildBlanket(b) {
    const g = rand(9);
    const nx = 10, nz = 12;
    const grid = [];
    for (let j = 0; j <= nz; j++) {
      const row = [];
      for (let i = 0; i <= nx; i++) {
        const x = lerp(-2.6, -1.08, i / nx), z = lerp(-3.2, -0.42, j / nz);
        const edge = i === nx ? -0.12 : 0;
        row.push([x + (i === nx ? 0.03 : 0), 0.46 + 0.04 * g() + 0.03 * S(i * 1.3 + j) + edge, z]);
      }
      grid.push(row);
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = grid[j][i], c = grid[j][i + 1], d = grid[j + 1][i + 1], e = grid[j + 1][i];
      b.quad(a, e, d, c, [1, 1, 1, 0.08], [[i / nx * 1.5, j / nz * 2.5], [i / nx * 1.5, (j + 1) / nz * 2.5], [(i + 1) / nx * 1.5, (j + 1) / nz * 2.5], [(i + 1) / nx * 1.5, j / nz * 2.5]]);
    }
  }

  function buildLamp(b) {
    const wood = [0.45, 0.28, 0.16, 0];
    b.at(-2.5, 0, -2.9, h => h.prism(8, 0.16, 0.16, 0, 0.12, 0.12, 0.05, wood));
    tube(b, [[-2.5, 0.05, -2.9], [-2.5, 0.6, -2.9], [-2.52, 1.1, -2.9], [-2.5, 1.6, -2.9]], [0.025, 0.03, 0.022, 0.02], 6, wood);
    for (let i = 0; i < 6; i++) b.at(-2.5, 0.4 + i * 0.2, -2.9, h => h.ellipsoid(0.045, 0.04, 0.045, 6, 3, shade(wood, 1.15)));
    b.at(-2.5, 1.55, -2.9, h => h.prism(12, 0.3, 0.3, 0, 0.18, 0.18, 0.32, [1.05, 0.96, 0.82, 0.55]));
  }

  function buildRug(b) {
    quad(b, [-1.25, 0.004, -1.25], [-0.45, 0.004, -1.25], [-0.45, 0.004, -2.4], [-1.25, 0.004, -2.4], [1, 1, 1, 0]);
  }

  function buildStandee(b) {
    b.at(1.39, 0, -1.08, h => h.box(0.84, 1.96, 0.18, [0.1, 0.08, 0.08, 0], { base: true }));
  }

  function buildStandeeFront(b) {
    quad(b, [0.97, 0.0, -0.985], [1.81, 0.0, -0.985], [1.81, 1.96, -0.985], [0.97, 1.96, -0.985], [1, 1, 1, 0.15]);
  }

  function buildWallArt(b) {
    quad(b, [0.55, 1.03, FRONT + 0.01], [0.9, 1.03, FRONT + 0.01], [0.9, 1.66, FRONT + 0.01], [0.55, 1.66, FRONT + 0.01], [1, 1, 1, 0.1]);
  }

  function buildYellow(b) {
    quad(b, [-0.12, 1.1, BACK + 0.02], [0.36, 1.1, BACK + 0.02], [0.36, 2.25, BACK + 0.02], [-0.12, 2.25, BACK + 0.02], [1, 1, 1, 0.1]);
  }

  function buildHat(b) {
    const black = [0.07, 0.07, 0.08, 0];
    b.push(M4.translate(0.66, 1.62, FRONT + 0.1), M4.rotX(-1.25));
    b.prism(14, 0.2, 0.17, 0, 0.2, 0.17, 0.012, black, { capBottom: true });
    b.at(0, 0.012, 0, h => h.prism(10, 0.1, 0.085, 0, 0.085, 0.07, 0.11, black));
    b.pop();
  }

  function buildMonitor(b) {
    b.at(0.6, 0.98, -0.82, h => h.box(0.44, 0.24, 0.05, [0.9, 0.9, 0.88, 0.05], { base: true }));
    b.at(0.6, 0.72, -0.82, h => h.box(0.05, 0.26, 0.05, [0.85, 0.85, 0.83, 0], { base: true }));
    b.at(0.6, 0.0, -0.82, h => h.box(0.6, 0.72, 0.4, [0.36, 0.24, 0.16, 0], { base: true }));
  }

  function buildRecliner(b) {
    const g = [1, 1, 1, 0];
    const dark = shade(g, 0.72);
    b.push(M4.translate(0.76, 0, 0.0), M4.rotY(-0.4));
    b.at(0, 0, 0, h => h.box(0.84, 0.4, 0.78, dark, { base: true }));
    b.at(0, 0.48, 0.06, h => h.ellipsoid(0.3, 0.09, 0.36, 12, 6, g));
    b.push(M4.translate(0, 0.42, -0.36), M4.rotX(0.22));
    b.at(0, 0.0, -0.06, h => h.box(0.72, 0.56, 0.12, g, { base: true }));
    [[0.14, 0.33, 0.12], [0.34, 0.33, 0.12], [0.52, 0.31, 0.11]].forEach(([y, rx, ry]) => b.at(0, y, 0.06, h => h.ellipsoid(rx, ry, 0.11, 14, 7, g)));
    b.pop();
    [-0.37, 0.37].forEach(x => {
      b.at(x, 0.2, 0.0, h => h.box(0.14, 0.36, 0.72, dark, { base: true }));
      b.push(M4.translate(x, 0.6, 0.0), M4.rotX(PI / 2));
      b.prism(12, 0.095, 0.08, -0.38, 0.095, 0.08, 0.36, g, { capBottom: true });
      b.pop();
      b.at(x, 0.6, 0.36, h => h.ellipsoid(0.095, 0.08, 0.05, 10, 5, g));
    });
    b.pop();
  }

  function buildMicStand(b) {
    const black = [0.06, 0.06, 0.07, 0];
    b.at(0.96, 0.0, 0.62, h => h.box(0.5, 0.74, 0.55, [0.42, 0.28, 0.18, 0], { base: true }));
    b.at(0.98, 0.74, 0.62, h => h.prism(10, 0.06, 0.06, 0, 0.06, 0.06, 0.03, black));
    b.at(0.98, 0.77, 0.62, h => h.prism(8, 0.01, 0.01, 0, 0.01, 0.01, 0.28, black));
    b.at(0.98, 1.06, 0.62, h => h.prism(12, 0.045, 0.045, -0.06, 0.045, 0.045, 0.12, black, { capBottom: true }));
    b.push(M4.translate(0.84, 1.07, 0.62), M4.rotY(0.6));
    K.discXY(b, 0, 0, 0, 0.08, 14, [0.05, 0.05, 0.06, 0.1]);
    b.pop();
  }

  function build(r) {
    const T = {
      wall: r.texture(256, texWallpaper),
      tulle: r.texture(128, texTulle),
      parquet: r.texture(256, texParquet),
      plaid: r.texture(128, texPlaid),
      western: r.texture(256, texWestern, { height: 512, clamp: true }),
      small: r.texture(128, texSmallPoster, { height: 192, clamp: true }),
      yellow: r.texture(128, texYellow, { height: 256, clamp: true }),
      leather: r.texture(128, texLeather),
      rug: r.texture(128, texRug, { clamp: true })
    };
    const M = {
      walls: mesh(r, buildWalls),
      floor: mesh(r, buildFloor),
      ceiling: mesh(r, buildCeiling),
      tulle: mesh(r, buildTulle),
      radiator: mesh(r, buildRadiator),
      bed: mesh(r, buildBed),
      blanket: mesh(r, buildBlanket),
      lamp: mesh(r, buildLamp),
      rug: mesh(r, buildRug),
      standee: mesh(r, buildStandee),
      standeeFront: mesh(r, buildStandeeFront),
      wallArt: mesh(r, buildWallArt),
      yellow: mesh(r, buildYellow),
      hat: mesh(r, buildHat),
      monitor: mesh(r, buildMonitor),
      recliner: mesh(r, buildRecliner),
      micStand: mesh(r, buildMicStand)
    };
    return { T, M };
  }

  function draw(r, R) {
    const { T, M } = R;
    r.draw(M.walls, null, { texture: T.wall });
    r.draw(M.floor, null, { texture: T.parquet });
    r.draw(M.ceiling);
    r.draw(M.tulle, null, { texture: T.tulle });
    r.draw(M.radiator);
    r.draw(M.bed);
    r.draw(M.blanket, null, { texture: T.plaid });
    r.draw(M.lamp);
    r.draw(M.rug, null, { texture: T.rug });
    r.draw(M.standee);
    r.draw(M.standeeFront, null, { texture: T.western });
    r.draw(M.wallArt, null, { texture: T.small });
    r.draw(M.yellow, null, { texture: T.yellow });
    r.draw(M.hat);
    r.draw(M.monitor);
    r.draw(M.recliner, null, { texture: T.leather });
    r.draw(M.micStand);
  }

  window.NiceRoom = { EYE, FOV, build, draw };
})();
