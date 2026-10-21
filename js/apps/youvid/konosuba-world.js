(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;

  const COL = {
    stoneLight: 0xe8dcc4,
    stoneMid: 0xd2c4a8,
    stoneDark: 0x9a8c74,
    stoneShade: 0x5c564c,
    brick: 0xb05a40,
    bronze: 0x8a6634,
    bronzeLight: 0xc8a050,
    iron: 0x2a2826,
    wood: 0x4a2618,
    woodDark: 0x3a1c12,
    woodGold: 0xb87a34,
    woodGoldDark: 0x7a4a1c,
    velvet: 0xb81c2c,
    velvetDark: 0x7c0e1a,
    plaster: 0xeee6d8,
    gold: 0xc8a048,
    leaf: 0x3c8c48,
    leafLight: 0x6cba5c,
    leafDark: 0x24603a
  };

  function boxAt(b, pos, size, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.box(size[0], size[1], size[2], col);
    if (rotM) b.pop();
    b.pop();
  }

  function ellAt(b, pos, rx, ry, rz, seg, rings, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.ellipsoid(rx, ry, rz, seg, rings, col);
    if (rotM) b.pop();
    b.pop();
  }

  function texQuad(b, a, bq, c, d, uv, col, nrm) {
    const cc = col || [1, 1, 1, 0];
    const n = nrm || V3.norm(V3.cross(V3.sub(bq, a), V3.sub(d, a)));
    const uvs = (uv || [[0, 0], [1, 0], [1, 1], [0, 1]]).map(([u, v]) => [u, 1 - v]);
    b.quad(a, bq, c, d, [cc, cc, cc, cc], uvs, [n, n, n, n]);
  }

  function cloud(ctx, g, cx, cy, sc, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sc, sc * 0.55);
    const puffs = [];
    for (let i = 0; i < 9; i++) puffs.push([(i - 4) * 20 + (g() - 0.5) * 14, -(4 - Math.abs(i - 4)) * 7 + (g() - 0.5) * 10, 30 - Math.abs(i - 4) * 3 + g() * 12]);
    ctx.fillStyle = `rgba(150,206,206,${alpha * 0.85})`;
    puffs.forEach(([x, y, rr]) => { ctx.beginPath(); ctx.arc(x + 4, y + 12, rr, 0, PI * 2); ctx.fill(); });
    ctx.fillStyle = `rgba(255,252,246,${alpha})`;
    puffs.forEach(([x, y, rr]) => { ctx.beginPath(); ctx.arc(x, y, rr * 0.92, 0, PI * 2); ctx.fill(); });
    ctx.fillStyle = `rgba(255,236,222,${alpha * 0.5})`;
    puffs.forEach(([x, y, rr]) => { ctx.beginPath(); ctx.arc(x - 6, y - 8, rr * 0.5, 0, PI * 2); ctx.fill(); });
    ctx.restore();
  }

  function skyTex(top, mid, low, seed) {
    return (ctx, w, h) => {
      const gr = ctx.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, top);
      gr.addColorStop(0.55, mid);
      gr.addColorStop(1, low);
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
      const g = rand(seed);
      for (let i = 0; i < 90; i++) {
        const y = h * (0.1 + g() * 0.82);
        const sc = (0.18 + g() * 0.32) * (0.6 + y / h);
        const x = g() * w;
        cloud(ctx, g, x, y, sc, 0.82 + g() * 0.18);
        if (x < 160) cloud(ctx, rand(seed + i), x + w, y, sc, 0.9);
        if (x > w - 160) cloud(ctx, rand(seed + i), x - w, y, sc, 0.9);
      }
      const ray = ctx.createLinearGradient(0, 0, w * 0.2, h);
      ray.addColorStop(0, 'rgba(255,255,255,0.18)');
      ray.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = ray;
      ctx.fillRect(0, 0, w, h);
    };
  }

  function texGrass(ctx, w, h) {
    ctx.fillStyle = '#6cb844';
    ctx.fillRect(0, 0, w, h);
    const g = rand(709);
    for (let i = 0; i < 260; i++) {
      const x = g() * w, y = g() * h, rr = 10 + g() * 40;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(176,226,96,0.35)' : i % 3 === 1 ? 'rgba(52,120,40,0.3)' : 'rgba(120,196,70,0.3)';
      ctx.beginPath();
      ctx.ellipse(x, y, rr, rr * 0.5, g() * PI, 0, PI * 2);
      ctx.fill();
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < 2600; i++) {
      const x = g() * w, y = g() * h, bh = 4 + g() * 10, tilt = (g() - 0.5) * 6;
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(206,250,140,0.6)' : i % 4 === 1 ? 'rgba(48,112,36,0.55)' : i % 4 === 2 ? 'rgba(130,206,76,0.55)' : 'rgba(84,160,52,0.5)';
      ctx.lineWidth = 1 + g() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + tilt * 0.4, y - bh * 0.6, x + tilt, y - bh);
      ctx.stroke();
    }
  }

  function texFlags(ctx, w, h) {
    ctx.fillStyle = '#d8c8a8';
    ctx.fillRect(0, 0, w, h);
    const g = rand(811);
    const rows = 8;
    for (let r = 0; r < rows; r++) {
      const y0 = (r / rows) * h, rh = h / rows;
      let x = -g() * 60;
      while (x < w) {
        const bw = 50 + g() * 70;
        const v = 196 + Math.floor(g() * 40);
        ctx.fillStyle = `rgb(${v + 10},${v - 4},${v - 30})`;
        ctx.fillRect(x + 2, y0 + 2, bw - 4, rh - 4);
        ctx.fillStyle = 'rgba(255,248,226,0.25)';
        ctx.fillRect(x + 2, y0 + 2, bw - 4, 4);
        x += bw;
      }
    }
  }

  function texTiles(ctx, w, h) {
    ctx.fillStyle = '#c6ae8e';
    ctx.fillRect(0, 0, w, h);
    const g = rand(823);
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const v = g() * 16 - 8;
        ctx.fillStyle = `rgb(${200 + v},${180 + v},${150 + v})`;
        ctx.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
        for (let k = 0; k < 14; k++) {
          ctx.fillStyle = g() > 0.5 ? 'rgba(120,96,70,0.08)' : 'rgba(255,240,215,0.1)';
          ctx.beginPath();
          ctx.ellipse(i * s + g() * s, j * s + g() * s, 6 + g() * 20, 4 + g() * 10, g() * PI, 0, PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.strokeStyle = '#4a3a2c';
    ctx.lineWidth = 3;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath(); ctx.moveTo(i * s, 0); ctx.lineTo(i * s, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * s); ctx.lineTo(w, i * s); ctx.stroke();
    }
  }

  function texVelvet(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#c42032');
    gr.addColorStop(1, '#8e1222');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    const cols = 6, rows = 3, cw = w / cols, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = (c + (r % 2 ? 0.5 : 0)) * cw, cy = (r + 0.5) * rh;
        const rg = ctx.createRadialGradient(cx - cw * 0.1, cy - rh * 0.15, 4, cx, cy, cw * 0.62);
        rg.addColorStop(0, 'rgba(240,80,90,0.55)');
        rg.addColorStop(0.7, 'rgba(160,20,36,0.0)');
        rg.addColorStop(1, 'rgba(60,0,10,0.35)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(cx, cy - rh * 0.62);
        ctx.lineTo(cx + cw * 0.52, cy);
        ctx.lineTo(cx, cy + rh * 0.62);
        ctx.lineTo(cx - cw * 0.52, cy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#4a0610';
        ctx.beginPath();
        ctx.arc(cx, cy - rh * 0.6, 4, 0, PI * 2);
        ctx.fill();
      }
    }
    ctx.strokeStyle = 'rgba(70,4,14,0.6)';
    ctx.lineWidth = 2;
    for (let r = 0; r <= rows; r++) {
      for (let c = -1; c <= cols; c++) {
        const cx = (c + (r % 2 ? 0.5 : 0)) * cw, cy = r * rh + rh * 0.5 - rh * 0.6;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + cw * 0.5, cy + rh * 0.6);
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - cw * 0.5, cy + rh * 0.6);
        ctx.stroke();
      }
    }
  }

  function texCarving(ctx, w, h) {
    ctx.fillStyle = '#9a5e26';
    ctx.fillRect(0, 0, w, h);
    const g = rand(857);
    for (let i = 0; i < 26; i++) {
      const x = (i / 26) * w + g() * 10, y = h * (0.3 + g() * 0.4), rr = 14 + g() * 18;
      ctx.strokeStyle = 'rgba(232,170,90,0.9)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y, rr, g() * PI, g() * PI + PI * 1.4);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(70,34,10,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + 3, y + 3, rr * 0.6, g() * PI, g() * PI + PI * 1.3);
      ctx.stroke();
    }
  }

  function texBrick(ctx, w, h) {
    ctx.fillStyle = '#7a3a2a';
    ctx.fillRect(0, 0, w, h);
    const g = rand(863);
    const rows = 16, bw = w / 6, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = -1; c < 7; c++) {
        const x = c * bw + (r % 2 ? bw / 2 : 0);
        const v = Math.floor(g() * 30);
        ctx.fillStyle = `rgb(${176 + v},${86 + v / 2},${60 + v / 3})`;
        ctx.fillRect(x + 2, r * rh + 2, bw - 4, rh - 4);
      }
    }
  }

  function texMansion(ctx, w, h) {
    ctx.fillStyle = '#d6c8ae';
    ctx.fillRect(0, 0, w, h);
    const g = rand(877);
    for (let y = 0; y < h; y += 14) {
      for (let x = (y / 14) % 2 ? -20 : 0; x < w; x += 40) {
        const v = Math.floor(g() * 24);
        ctx.fillStyle = `rgb(${200 + v},${186 + v},${160 + v})`;
        ctx.fillRect(x + 1, y + 1, 38, 12);
      }
    }
    ctx.fillStyle = '#b8a888';
    ctx.fillRect(0, h * 0.43, w, h * 0.05);
    ctx.fillStyle = '#efe6d2';
    ctx.fillRect(0, h * 0.41, w, h * 0.025);
    for (let x = 6; x < w; x += 18) {
      ctx.fillStyle = '#efe6d2';
      ctx.fillRect(x, h * 0.33, 8, h * 0.08);
      ctx.fillStyle = 'rgba(120,104,80,0.5)';
      ctx.fillRect(x + 6, h * 0.33, 2, h * 0.08);
    }
    ctx.fillStyle = '#efe6d2';
    ctx.fillRect(0, h * 0.32, w, h * 0.015);
    [0.08, 0.3, 0.52, 0.74, 0.96].forEach(fx => {
      const cx = w * fx, aw = w * 0.085;
      ctx.fillStyle = '#3c3c44';
      ctx.beginPath();
      ctx.moveTo(cx - aw, h);
      ctx.lineTo(cx - aw, h * 0.66);
      ctx.arc(cx, h * 0.66, aw, PI, 0);
      ctx.lineTo(cx + aw, h);
      ctx.fill();
      ctx.strokeStyle = '#eee4cc';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(cx, h * 0.66, aw + 4, PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#5a5a64';
      ctx.fillRect(cx - aw * 0.6, h * 0.7, aw * 1.2, h * 0.3);
    });
    [0.18, 0.42, 0.64, 0.86].forEach(fx => {
      const cx = w * fx;
      ctx.fillStyle = '#efe6d2';
      ctx.fillRect(cx - 26, h * 0.06, 52, h * 0.22);
      ctx.fillStyle = '#4a5866';
      ctx.fillRect(cx - 18, h * 0.08, 36, h * 0.18);
      ctx.fillStyle = '#efe6d2';
      ctx.fillRect(cx - 2, h * 0.08, 4, h * 0.18);
      ctx.fillRect(cx - 18, h * 0.16, 36, 4);
    });
  }

  function texTrees(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(887);
    for (let i = 0; i < 260; i++) {
      const x = g() * w, y = h * (0.12 + g() * 0.75), rr = 6 + g() * 16;
      const k = g();
      ctx.fillStyle = k < 0.33 ? '#2e6a3a' : k < 0.66 ? '#428a46' : '#5ca852';
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(160,220,120,0.5)';
      ctx.beginPath();
      ctx.arc(x - rr * 0.3, y - rr * 0.35, rr * 0.45, 0, PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#2e6a3a';
    ctx.fillRect(0, h * 0.82, w, h * 0.18);
  }

  function texMountains(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(911);
    const ridge = (base, amp, col, seed) => {
      const gg = rand(seed);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) {
        const y = h * base - amp * h * (0.5 + 0.5 * S(x / w * PI * 6 + seed) * 0.6 + 0.4 * S(x / w * PI * 15 + seed * 2) * 0.3 + gg() * 0.05);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    };
    ridge(0.55, 0.45, '#8ab4c4', 3);
    ridge(0.7, 0.4, '#5e9a8a', 7);
    ridge(0.86, 0.22, '#4e8a5e', 11);
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = 'rgba(40,90,60,0.25)';
      ctx.beginPath();
      ctx.arc(g() * w, h * (0.55 + g() * 0.4), 3 + g() * 6, 0, PI * 2);
      ctx.fill();
    }
  }

  function texWaterTop(ctx, w, h) {
    ctx.fillStyle = '#7a9a62';
    ctx.fillRect(0, 0, w, h);
    const g = rand(919);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(170,200,130,0.3)' : 'rgba(70,104,56,0.3)';
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 20 + g() * 60, 6 + g() * 14, 0, 0, PI * 2);
      ctx.fill();
    }
  }

  function texSandy(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#8a9a4c');
    gr.addColorStop(1, '#a89a64');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    const g = rand(929);
    ctx.lineWidth = 3;
    for (let i = 0; i < 150; i++) {
      ctx.strokeStyle = `rgba(250,240,170,${0.2 + g() * 0.3})`;
      const x = g() * w, y = g() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 20, y - 10, x + 30, y + 14, x + 54, y + 4);
      ctx.stroke();
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = 'rgba(60,70,30,0.2)';
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 30 + g() * 40, 10 + g() * 20, 0, 0, PI * 2);
      ctx.fill();
    }
  }

  function texCeiling(ctx, w, h) {
    const gr = ctx.createRadialGradient(w * 0.5, h * 0.4, 20, w * 0.5, h * 0.5, w * 0.7);
    gr.addColorStop(0, '#e6dccc');
    gr.addColorStop(1, '#a8a092');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    const g = rand(937);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = g() > 0.5 ? 'rgba(120,110,96,0.08)' : 'rgba(255,250,240,0.08)';
      ctx.beginPath();
      ctx.arc(g() * w, g() * h, 4 + g() * 16, 0, PI * 2);
      ctx.fill();
    }
  }

  function texPlaque(ctx, w, h) {
    ctx.fillStyle = '#b8902c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e8c860';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.strokeStyle = '#7a5a18';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.fillStyle = '#e0bc50';
    ctx.beginPath();
    ctx.arc(w * 0.45, h * 0.4, 12, 0, PI * 2);
    ctx.arc(w * 0.56, h * 0.55, 12, 0, PI * 2);
    ctx.arc(w * 0.44, h * 0.66, 10, 0, PI * 2);
    ctx.fill();
  }

  function skyDome(r, tex) {
    return K.mesh(r, b => {
      const n = 32, R = 60;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        const u0 = (i / n) * 3, u1 = ((i + 1) / n) * 3;
        const P = (a, y) => [S(a) * R, y, -C(a) * R];
        texQuad(b, P(a0, 42), P(a1, 42), P(a1, -8), P(a0, -8), [[u0 * 2, 0], [u1 * 2, 0], [u1 * 2, 1], [u0 * 2, 1]], [1, 1, 1, 1], [0, 0, 1]);
      }
    });
  }

  function skyCap(r, col) {
    return K.mesh(r, b => {
      b.push(M4.translate(0, 41.9, 0));
      b.disc(61, 32, rgb(col, 1));
      b.pop();
    });
  }

  function groundMesh(r, size, uvs, y, z0) {
    return K.mesh(r, b => {
      const s = size;
      texQuad(b, [-s, y || 0, (z0 || 0) - s], [s, y || 0, (z0 || 0) - s], [s, y || 0, (z0 || 0) + s], [-s, y || 0, (z0 || 0) + s], [[0, 0], [uvs, 0], [uvs, uvs], [0, uvs]], [1, 1, 1, 0.25], [0, 1, 0]);
    });
  }

  function buildPorch(r, T) {
    const solid = K.mesh(r, b => {
      for (let i = 0; i < 5; i++) {
        const y = (i + 1) * 0.17;
        const z = -0.05 - i * 0.34;
        boxAt(b, [-1.0, y / 2, z - 0.6], [4.2, y, 1.2], i % 2 ? COL.stoneMid : COL.stoneLight);
        boxAt(b, [-1.0, y - 0.006, z + 0.01], [4.22, 0.014, 0.02], 0xf2e8d2);
      }
      boxAt(b, [-1.2, 2.2, -2.3], [4.4, 3.0, 0.4], COL.stoneShade);
      for (let i = 0; i < 9; i++) boxAt(b, [-3.2 + i * 0.5, 1.6 + (i % 2) * 0.12, -2.08], [0.46, 0.2, 0.02], 0x48443e);
      boxAt(b, [-2.35, 1.9, -1.6], [0.6, 3.4, 0.5], COL.stoneMid);
      boxAt(b, [-0.15, 1.9, -1.6], [0.6, 3.4, 0.5], COL.stoneMid);
      boxAt(b, [-0.15, 1.9, -1.33], [0.5, 3.4, 0.04], COL.stoneLight);
      boxAt(b, [0.24, 0.12, -0.45], [0.66, 0.24, 0.66], COL.stoneMid);
      boxAt(b, [0.24, 0.27, -0.45], [0.6, 0.08, 0.6], COL.stoneLight);
      boxAt(b, [0.24, 1.6, -0.45], [0.5, 2.6, 0.5], COL.stoneLight);
      boxAt(b, [0.24, 1.45, -0.195], [0.3, 1.9, 0.02], COL.stoneDark);
      boxAt(b, [0.24, 1.45, -0.192], [0.24, 1.8, 0.02], 0xc0b294);
      ellAt(b, [0.24, 2.4, -0.195], 0.15, 0.15, 0.02, 12, 4, COL.stoneDark);
      boxAt(b, [3.0, 0.75, -0.6], [2.6, 1.5, 0.4], COL.stoneLight);
      for (let i = 0; i < 5; i++) boxAt(b, [1.95 + i * 0.5, 0.75, -0.39], [0.02, 1.5, 0.02], 0xb8a888);
      boxAt(b, [3.0, 0.38, -0.39], [2.6, 0.02, 0.02], 0xb8a888);
    });
    const tree = K.mesh(r, b => {
      const c = [1, 1, 1, 0.3];
      texQuad(b, [1.6, 3.6, -2.0], [5.2, 3.6, -2.0], [5.2, 1.3, -2.0], [1.6, 1.3, -2.0], null, c, [0, 0, 1]);
    });
    return { solid, tree };
  }

  function buildHall(r) {
    const floor = K.mesh(r, b => {
      const c = [1, 1, 1, 0.22];
      const s = 7;
      texQuad(b, [0, 0, -s * 1.414], [s * 1.414, 0, 0], [0, 0, s * 1.414], [-s * 1.414, 0, 0], [[0, 0], [5, 0], [5, 5], [0, 5]], c, [0, 1, 0]);
    });
    const furniture = K.mesh(r, b => {
      b.push(M4.translate(-1.6, 0, -3.6), M4.rotY(0.32));
      boxAt(b, [0, 0.62, 0], [1.6, 0.9, 0.55], COL.wood);
      boxAt(b, [0, 1.09, 0], [1.66, 0.05, 0.6], COL.woodDark);
      boxAt(b, [0, 0.19, 0.02], [1.62, 0.06, 0.58], COL.woodDark);
      [[-0.74, 0.22], [0.74, 0.22], [-0.74, -0.22], [0.74, -0.22]].forEach(([x, z]) => K.tube(b, [[x, 0.17, z], [x, 0.08, z], [x * 1.01, 0, z]], [0.045, 0.03, 0.04], 6, COL.woodDark));
      for (let i = 0; i < 3; i++) boxAt(b, [0, 0.4 + i * 0.25, 0.275], [1.5, 0.02, 0.02], COL.woodDark);
      b.pop();
      boxAt(b, [0.2, 0.62, -3.2], [0.9, 1.25, 0.5], COL.wood, M4.rotY(-0.5));
    });
    return { floor, furniture };
  }

  function buildSofa(r) {
    const back = K.mesh(r, b => {
      const n = 10, c = [1, 1, 1, 0.12];
      for (let i = 0; i < n; i++) {
        const x0 = -1.6 + 3.2 * i / n, x1 = -1.6 + 3.2 * (i + 1) / n;
        const top = (x) => 0.78 - 0.18 * Math.max(0, (x + 0.2) / 1.4) + 0.06 * S(x * 2);
        const a = [x0, top(x0), -0.42], bq = [x1, top(x1), -0.42], cq = [x1, 0.05, -0.2], d = [x0, 0.05, -0.2];
        texQuad(b, a, bq, cq, d, [[i / n * 3, 0], [(i + 1) / n * 3, 0], [(i + 1) / n * 3, 1], [i / n * 3, 1]], c, [0, 0.3, 0.95]);
      }
    });
    const seat = K.mesh(r, b => {
      boxAt(b, [0, -0.12, 0.2], [3.4, 0.3, 1.0], COL.velvet);
      boxAt(b, [0, 0.04, 0.2], [3.3, 0.06, 0.96], 0xc42234);
      b.push(M4.translate(-1.45, 0.25, 0.15), M4.rotZ(-0.25));
      boxAt(b, [0, 0, 0], [0.32, 0.55, 0.95], COL.velvet);
      b.pop();
      K.tube(b, [[-1.62, 0.5, 0.65], [-1.62, 0.62, 0.2], [-1.62, 0.55, -0.3]], [0.07, 0.08, 0.07], 8, COL.woodGold);
      boxAt(b, [0, 0.5, -0.6], [5, 2, 0.1], 0x1e1416);
    });
    const crest = K.mesh(r, b => {
      const pts = [];
      for (let i = 0; i <= 14; i++) {
        const x = -1.6 + 3.2 * i / 14;
        pts.push([x, 0.8 - 0.18 * Math.max(0, (x + 0.2) / 1.4) + 0.06 * S(x * 2) + 0.05, -0.43]);
      }
      const c = [1, 1, 1, 0.15];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], bq = pts[i + 1];
        texQuad(b, [a[0], a[1] + 0.2, a[2] - 0.02], [bq[0], bq[1] + 0.2, bq[2] - 0.02], [bq[0], bq[1] - 0.02, bq[2] + 0.05], [a[0], a[1] - 0.02, a[2] + 0.05], [[i / 4, 0], [(i + 1) / 4, 0], [(i + 1) / 4, 1], [i / 4, 1]], c, [0, 0.4, 0.9]);
      }
      K.tube(b, pts.map(p => [p[0], p[1] - 0.02, p[2] + 0.06]), pts.map(() => 0.025), 6, COL.woodGoldDark);
    });
    return { back, seat, crest };
  }

  function bronzeBar(b, p0, p1, rad) {
    K.tube(b, [p0, p1], [rad, rad], 6, COL.bronze);
  }

  function gateLeaf(b, width, height) {
    for (let i = 0; i <= 12; i++) {
      const x = -0.08 - i * (width - 0.16) / 12;
      const top = height + S((i / 12) * PI) * 0.12;
      bronzeBar(b, [x, 0.06, 0], [x, top, 0], 0.014);
      ellAt(b, [x, top + 0.03, 0], 0.018, 0.035, 0.018, 6, 4, COL.bronzeLight);
    }
    [0.08, 0.5, 1.0, 1.25].forEach(y => bronzeBar(b, [-0.05, y, 0], [-width + 0.05, y, 0], y < 0.1 ? 0.022 : 0.015));
    bronzeBar(b, [-0.05, 0.0, 0], [-0.05, height + 0.45, 0], 0.03);
    bronzeBar(b, [-width + 0.05, 0.0, 0], [-width + 0.05, height + 0.1, 0], 0.03);
    const arc = [];
    for (let i = 0; i <= 14; i++) {
      const u = i / 14;
      arc.push([-0.05 - (width - 0.1) * u, height + 0.12 + (1 - u) * 0.35 + S(u * PI) * 0.12, 0]);
    }
    K.tube(b, arc, arc.map(() => 0.02), 6, COL.bronzeLight);
    for (let i = 0; i < 8; i++) {
      const u = (i + 0.5) / 8;
      const cx = -0.05 - (width - 0.1) * u, cy = height + 0.2 + (1 - u) * 0.3 + S(u * PI) * 0.1;
      const curl = [];
      for (let k = 0; k <= 9; k++) {
        const a = k / 9 * PI * 1.7 + i;
        curl.push([cx + C(a) * 0.09 * (1 - k / 15), cy + S(a) * 0.09 * (1 - k / 15), 0]);
      }
      K.tube(b, curl, curl.map(() => 0.012), 5, COL.bronzeLight);
    }
  }

  function buildGate(r) {
    const solid = K.mesh(r, b => {
      boxAt(b, [0.57, 1.5, -0.6], [0.6, 3.0, 0.6], COL.brick);
      boxAt(b, [0.57, 3.04, -0.6], [0.68, 0.1, 0.68], COL.stoneLight);
      boxAt(b, [0.57, 0.14, -0.6], [0.66, 0.28, 0.66], COL.stoneMid);
      b.push(M4.translate(0.27, 0, -0.6), M4.rotY(-0.18));
      gateLeaf(b, 1.5, 1.95);
      b.pop();
      for (let i = 0; i < 9; i++) {
        const x = -1.9 - i * 1.15, z = -1.3 - i * 0.75;
        boxAt(b, [x, 0.75, z], [1.2, 1.5, 0.3], COL.brick, M4.rotY(0.58));
        boxAt(b, [x, 1.53, z], [1.22, 0.06, 0.34], COL.stoneLight, M4.rotY(0.58));
        boxAt(b, [x + 0.5, 0.95, z + 0.33], [0.3, 1.9, 0.36], COL.brick, M4.rotY(0.58));
        boxAt(b, [x + 0.5, 1.93, z + 0.33], [0.36, 0.08, 0.42], COL.stoneLight, M4.rotY(0.58));
      }
      boxAt(b, [1.2, 1.2, 1.4], [0.09, 2.4, 0.09], 0x2a2420);
      boxAt(b, [1.16, 1.0, 1.4], [0.05, 0.6, 0.12], 0x3a3026);
      ellAt(b, [1.13, 0.95, 1.45], 0.04, 0.04, 0.008, 10, 4, 0x6a5434);
    });
    const ground = K.mesh(r, b => {
      texQuad(b, [-1.5, 0, -1.2], [8, 0, -3.0], [8, 0, 4], [-3.5, 0, 4], [[0, 0], [7, -1.4], [7, 4], [-1.4, 4]], [1, 1, 1, 0.2], [0, 1, 0]);
    });
    const lawn = K.mesh(r, b => {
      texQuad(b, [-16, -0.005, -16], [16, -0.005, -16], [16, -0.005, 4], [-16, -0.005, 4], [[0, 0], [12, 0], [12, 8], [0, 8]], [1, 1, 1, 0.25], [0, 1, 0]);
    });
    const trees = K.mesh(r, b => {
      const c = [1, 1, 1, 0.3];
      texQuad(b, [-12, 5.0, -12], [-2, 5.0, -10], [-2, -0.2, -10], [-12, -0.2, -12], null, c, [0, 0, 1]);
      texQuad(b, [0.5, 5.2, -9], [8.5, 5.2, -8], [8.5, -0.2, -8], [0.5, -0.2, -9], [[0.4, 0], [1.4, 0], [1.4, 1], [0.4, 1]], c, [0, 0, 1]);
      texQuad(b, [-3.4, 0.9, -1.0], [-1.6, 0.9, -0.9], [-1.6, -0.05, -0.9], [-3.4, -0.05, -1.0], [[0, 0.65], [0.3, 0.65], [0.3, 1], [0, 1]], c, [0, 0, 1]);
      texQuad(b, [1.6, 0.8, -2.6], [3.6, 0.8, -2.4], [3.6, -0.05, -2.4], [1.6, -0.05, -2.6], [[0.5, 0.65], [0.85, 0.65], [0.85, 1], [0.5, 1]], c, [0, 0, 1]);
    });
    return { solid, ground, lawn, trees };
  }

  function buildMansion(r) {
    const facade = K.mesh(r, b => {
      texQuad(b, [-6, 6.2, -6], [3, 6.2, -6], [3, 0, -6], [-6, 0, -6], [[0, 0], [1, 0], [1, 1], [0, 1]], [1, 1, 1, 0.22], [0, 0, 1]);
    });
    const solid = K.mesh(r, b => {
      boxAt(b, [-1.5, 6.6, -6.3], [9.5, 1.0, 1.0], 0x4a8a72, M4.rotX(0.5));
      boxAt(b, [-4.4, 7.2, -5.9], [1.2, 2.0, 0.4], 0xc8b898);
      boxAt(b, [1.25, 1.5, -0.75], [0.42, 3.0, 0.42], COL.brick);
      boxAt(b, [1.25, 3.02, -0.75], [0.5, 0.1, 0.5], COL.stoneLight);
      b.push(M4.translate(1.04, 0, -0.8), M4.rotY(0.1));
      gateLeaf(b, 1.1, 1.85);
      b.pop();
    });
    const trees = K.mesh(r, b => {
      texQuad(b, [0.0, 3.4, -3.5], [4.0, 3.4, -3.5], [4.0, -0.2, -3.5], [0.0, -0.2, -3.5], [[0, 0.1], [0.6, 0.1], [0.6, 1], [0, 1]], [1, 1, 1, 0.3], [0, 0, 1]);
    });
    return { facade, solid, trees };
  }

  function buildBath(r) {
    const room = K.mesh(r, b => {
      boxAt(b, [0, 2.0, -1.6], [6, 4.4, 0.2], COL.plaster);
      boxAt(b, [0, 0.28, -1.2], [6, 0.12, 0.7], 0xd0c6b0);
      boxAt(b, [0, 0.4, -1.42], [6, 0.12, 0.3], 0xc4b8a0);
      for (let i = 0; i < 11; i++) {
        boxAt(b, [-2.5 + i * 0.5, 0.11, -0.04], [0.48, 0.22, 0.3], i % 2 ? 0xb8b0a0 : 0xc6bea8);
      }
      boxAt(b, [0, 0.2, -0.6], [6, 0.02, 1.0], 0xc8bca6);
      boxAt(b, [-1.38, 1.5, -1.5], [0.26, 3.0, 0.08], COL.stoneMid);
      boxAt(b, [-1.38, 2.3, -1.44], [0.06, 0.3, 0.06], COL.gold);
      ellAt(b, [-1.38, 2.5, -1.42], 0.05, 0.08, 0.05, 8, 6, rgb(0xffe8a0, 0.9));
      boxAt(b, [0.3, 1.4, -1.49], [0.36, 0.7, 0.02], COL.gold);
      boxAt(b, [0.3, 1.4, -1.48], [0.28, 0.62, 0.02], 0xe8e0cc);
      boxAt(b, [1.75, 0.5, -1.0], [0.75, 0.6, 0.6], COL.stoneLight);
      boxAt(b, [1.75, 0.82, -1.0], [0.8, 0.05, 0.65], 0xe6dccc);
      K.tube(b, [[1.75, 0.84, -1.0], [1.75, 0.95, -1.0], [1.75, 1.15, -1.0], [1.75, 1.32, -1.0], [1.75, 1.42, -1.0]], [0.1, 0.18, 0.2, 0.12, 0.11], 12, 0x7a7c78);
      [-1, 1].forEach(s => K.tube(b, [[1.75 + s * 0.12, 1.36, -1.0], [1.75 + s * 0.22, 1.32, -1.0], [1.75 + s * 0.2, 1.15, -1.0]], [0.018, 0.018, 0.018], 5, 0x6a6c68));
      boxAt(b, [-1.6, 0.8, 0.45], [0.6, 1.6, 0.6], 0x9a9282);
      boxAt(b, [-1.6, 1.65, 0.45], [0.7, 0.12, 0.7], 0xaaa290);
      boxAt(b, [-1.6, 2.4, 0.45], [0.5, 1.4, 0.5], 0x8e8676);
      ellAt(b, [-1.3, 0.55, 0.62], 0.16, 0.2, 0.14, 10, 8, 0x7a7466);
      ellAt(b, [-1.2, 0.48, 0.68], 0.08, 0.05, 0.06, 8, 6, 0x3a2a24);
    });
    const plaque = K.mesh(r, b => texQuad(b, [-0.92, 1.85, -1.49], [-0.42, 1.85, -1.49], [-0.42, 1.35, -1.49], [-0.92, 1.35, -1.49], null, [1, 1, 1, 0.3], [0, 0, 1]));
    const water = K.mesh(r, b => texQuad(b, [-4, 0.02, 0.12], [4, 0.02, 0.12], [4, 0.02, 4], [-4, 0.02, 4], [[0, 0], [3, 0], [3, 1.5], [0, 1.5]], [1, 1, 1, 0.35], [0, 1, 0]));
    const spout = K.mesh(r, b => {
      K.tube(b, [[-1.18, 0.48, 0.72], [-1.08, 0.36, 0.85], [-1.0, 0.15, 0.95], [-0.96, 0.02, 1.0]], [0.04, 0.05, 0.06, 0.07], 8, rgb(0xb8dcc0, 0.4));
    });
    return { room, plaque, water, spout };
  }

  function buildLookup(r) {
    return K.mesh(r, b => {
      texQuad(b, [-3, 2.6, -3], [3, 2.6, -3], [3, 2.6, 1], [-3, 2.6, 1], null, [1, 1, 1, 0.3], [0, -1, 0]);
    });
  }

  function buildLookupTrim(r) {
    return K.mesh(r, b => {
      [-1, 1].forEach(s => {
        boxAt(b, [s * 1.35, 1.4, -1.2], [0.2, 3, 0.2], 0xb0a690);
        boxAt(b, [s * 1.25, 2.4, -1.2], [0.05, 0.4, 2.5], COL.gold, M4.rotY(s * 0.0));
      });
      boxAt(b, [0, 2.55, -2.5], [3, 0.1, 0.1], COL.gold);
    });
  }

  function buildBowl(r) {
    return K.mesh(r, b => {
      const n = 24;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        const P = (a, rr, y) => [S(a) * rr, y, C(a) * rr];
        b.quad(P(a0, 0.25, 0.06), P(a1, 0.25, 0.06), P(a1, 0.21, 0.0), P(a0, 0.21, 0.0), 0x9a5a2a);
        b.quad(P(a1, 0.25, 0.06), P(a0, 0.25, 0.06), P(a0, 0.225, 0.065), P(a1, 0.225, 0.065), 0xb8763a);
      }
      b.disc(0.226, n, rgb(0xf6e2cc, 0.3), 0.05);
    });
  }

  function buildField(r) {
    const hills = K.mesh(r, b => {
      const n = 28, R = 40;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        const P = (a, y) => [S(a) * R, y, -C(a) * R];
        texQuad(b, P(a0, 9), P(a1, 9), P(a1, -0.5), P(a0, -0.5), [[i / n * 4, 0], [(i + 1) / n * 4, 0], [(i + 1) / n * 4, 1], [i / n * 4, 1]], [1, 1, 1, 0.45], [0, 0, 1]);
      }
    });
    const slope = K.mesh(r, b => {
      const n = 12;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const P = (u, v) => {
            const x = -12 + 24 * u, z = -14 + 18 * v;
            return [x, 0.8 * S(x * 0.25 + 1) + 0.6 * S(z * 0.3) - 0.6, z];
          };
          const p = [P(i / n, j / n), P((i + 1) / n, j / n), P((i + 1) / n, (j + 1) / n), P(i / n, (j + 1) / n)];
          texQuad(b, p[0], p[1], p[2], p[3], [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], [1, 1, 1, 0.25]);
        }
      }
    });
    return { hills, slope };
  }

  function build(r) {
    return {
      tex: {
        skyTeal: r.texture(1024, skyTex('#1cbcb0', '#4ed8cc', '#c4f6ec', 701), { height: 512 }),
        skyBlue: r.texture(1024, skyTex('#3a8ee0', '#6ab8ec', '#d8f0fa', 733), { height: 512 }),
        grass: r.texture(512, texGrass),
        flags: r.texture(512, texFlags),
        tiles: r.texture(512, texTiles),
        velvet: r.texture(512, texVelvet, { height: 256 }),
        carving: r.texture(512, texCarving, { height: 128 }),
        brick: r.texture(256, texBrick),
        mansion: r.texture(1024, texMansion, { height: 512, clamp: true }),
        trees: r.texture(512, texTrees, { height: 256, clamp: true }),
        mountains: r.texture(1024, texMountains, { height: 256 }),
        waterTop: r.texture(256, texWaterTop),
        sandy: r.texture(512, texSandy),
        ceiling: r.texture(512, texCeiling, { clamp: true }),
        plaque: r.texture(128, texPlaque, { clamp: true })
      },
      sky: skyDome(r),
      skyCapTeal: skyCap(r, 0x1cbcb0),
      skyCapBlue: skyCap(r, 0x3a8ee0),
      ground: groundMesh(r, 60, 90),
      porch: buildPorch(r),
      porchGround: K.mesh(r, b => texQuad(b, [-4, 0, -0.1], [4, 0, -0.1], [4, 0, 4], [-4, 0, 4], [[0, 0], [5, 0], [5, 3], [0, 3]], [1, 1, 1, 0.22], [0, 1, 0])),
      hall: buildHall(r),
      sofa: buildSofa(r),
      gate: buildGate(r),
      mansion: buildMansion(r),
      bath: buildBath(r),
      lookup: buildLookup(r),
      lookupTrim: buildLookupTrim(r),
      bowl: buildBowl(r),
      field: buildField(r),
      underwater: K.mesh(r, b => texQuad(b, [-4, -0.6, -4], [4, -0.6, -4], [4, -0.6, 3], [-4, -0.6, 3], [[0, 0], [3, 0], [3, 3], [0, 3]], [1, 1, 1, 0.5], [0, 1, 0]))
    };
  }

  function sky(r, W, kind, spin) {
    const tex = kind === 'blue' ? W.tex.skyBlue : W.tex.skyTeal;
    const m = M4.rotY(spin || 0);
    r.draw(W.sky, m, { texture: tex, noFog: true });
    r.draw(kind === 'blue' ? W.skyCapBlue : W.skyCapTeal, M4.ident(), { noFog: true });
  }

  function draw(r, W, set, t, st) {
    const T = W.tex;
    const o = (st && st.world) || {};
    if (set === 'meadow' || set === 'bowl' || set === 'field' || set === 'slope') {
      sky(r, W, 'teal', o.skySpin);
      if (set === 'field' || set === 'slope') r.draw(W.field.hills, M4.rotY(o.hillSpin || 0), { texture: T.mountains, noFog: true });
      if (set === 'slope') r.draw(W.field.slope, M4.ident(), { texture: T.grass });
      else r.draw(W.ground, M4.ident(), { texture: T.grass, uvScroll: o.grassScroll || [0, 0] });
      if (set === 'bowl') r.draw(W.bowl, M4.translate(o.bowl ? o.bowl[0] : 0, 0, o.bowl ? o.bowl[2] : 0));
      return;
    }
    if (set === 'sky') {
      sky(r, W, 'teal', o.skySpin);
      return;
    }
    if (set === 'porch') {
      sky(r, W, 'blue', 0);
      r.draw(W.porchGround, M4.ident(), { texture: T.flags });
      r.draw(W.porch.solid, M4.ident());
      r.draw(W.porch.tree, M4.ident(), { texture: T.trees });
      return;
    }
    if (set === 'hall') {
      r.draw(W.hall.floor, M4.ident(), { texture: T.tiles, noFog: true });
      r.draw(W.hall.furniture, M4.ident(), { noFog: true });
      return;
    }
    if (set === 'sofa') {
      r.draw(W.sofa.seat, M4.ident(), { noFog: true });
      r.draw(W.sofa.back, M4.ident(), { texture: T.velvet, noFog: true });
      r.draw(W.sofa.crest, M4.ident(), { texture: T.carving, noFog: true });
      return;
    }
    if (set === 'gate') {
      sky(r, W, 'blue', 0.4);
      r.draw(W.gate.lawn, M4.ident(), { texture: T.grass });
      r.draw(W.gate.ground, M4.ident(), { texture: T.flags });
      r.draw(W.gate.trees, M4.ident(), { texture: T.trees });
      r.draw(W.gate.solid, M4.ident());
      return;
    }
    if (set === 'mansion') {
      sky(r, W, 'blue', 0.9);
      r.draw(W.mansion.facade, M4.ident(), { texture: T.mansion });
      r.draw(W.mansion.trees, M4.ident(), { texture: T.trees });
      r.draw(W.mansion.solid, M4.ident());
      return;
    }
    if (set === 'bath') {
      r.draw(W.bath.room, M4.ident());
      r.draw(W.bath.plaque, M4.ident(), { texture: T.plaque });
      r.draw(W.bath.water, M4.ident(), { texture: T.waterTop, uvScroll: [t * 0.02, 0] });
      r.draw(W.bath.spout, M4.ident(), { blend: true, alpha: 0.7 });
      return;
    }
    if (set === 'bathLookup') {
      r.draw(W.lookup, M4.ident(), { texture: T.ceiling, noFog: true });
      r.draw(W.lookupTrim, M4.ident(), { noFog: true });
      return;
    }
    if (set === 'water') {
      r.draw(W.underwater, M4.ident(), { texture: T.sandy, uvScroll: [t * 0.015, S(t * 0.7) * 0.01], noFog: true });
    }
  }

  window.KonosubaWorld = { build, draw };
})();
