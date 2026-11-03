(function () {
  const { M4, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;

  const COL = {
    wall: 0xc4c8c6,
    wallHi: 0xd6d9d6,
    grey: 0x8a8f92,
    charcoal: 0x3c4044,
    charcoalHi: 0x4c5054,
    frame: 0x1c1e21,
    carpet: 0x5e6266,
    ceiling: 0xc8cbc8,
    cubicle: 0x6c7886,
    cubicleTop: 0x3a3e44,
    desk: 0x8a6a4a,
    deskDark: 0x4a3626,
    wood: 0x9a6a3c,
    woodDk: 0x6a4424,
    door: 0x24221f,
    chair: 0x2a2a2e,
    leaf: 0x3c5a2e,
    leafHi: 0x5a7a3c,
    pot: 0x6a6a66,
    brass: 0xb09a5a,
    paper: 0xe8e8e0,
    lamp: 0x2a2a2a
  };

  function blindsTex(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const y0 = (i / n) * h;
      const g = ctx.createLinearGradient(0, y0, 0, y0 + h / n * 0.72);
      g.addColorStop(0, '#f2f4f2');
      g.addColorStop(0.6, '#d6dad8');
      g.addColorStop(1, '#a8acaa');
      ctx.fillStyle = g;
      ctx.fillRect(0, y0, w, (h / n) * 0.72);
    }
  }

  function carpetTex(ctx, w, h) {
    const g = rand(7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < w * h * 0.5; i++) {
      const v = 200 + Math.floor(g() * 55);
      ctx.fillStyle = `rgb(${v},${v},${v + 2})`;
      ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 1, 1);
    }
  }

  function lightTex(ctx, w, h) {
    ctx.fillStyle = '#f6f8f4';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#a4a8a4';
    ctx.lineWidth = 3;
    for (let i = 1; i < 8; i++) {
      ctx.beginPath(); ctx.moveTo((i / 8) * w, 0); ctx.lineTo((i / 8) * w, h); ctx.stroke();
    }
    for (let j = 1; j < 3; j++) {
      ctx.beginPath(); ctx.moveTo(0, (j / 3) * h); ctx.lineTo(w, (j / 3) * h); ctx.stroke();
    }
    ctx.strokeStyle = '#6a6e6a';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, w, h);
  }

  const ATLAS = {
    cert: [0, 0, 0.25, 0.32],
    abstract: [0.25, 0, 0.5, 0.42],
    print: [0.75, 0, 0.25, 0.32],
    plate: [0, 0.34, 0.25, 0.08],
    calendar: [0, 0.44, 0.25, 0.3],
    blot: [0.6, 0.44, 0.4, 0.3],
    shelf: [0.25, 0.58, 0.35, 0.4]
  };

  function atlasTex(ctx, w, h) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, w, h);
    const R = (k) => { const a = ATLAS[k]; return [a[0] * w, a[1] * h, a[2] * w, a[3] * h]; };
    let [x, y, cw, ch] = R('cert');
    ctx.fillStyle = '#5a4630'; ctx.fillRect(x, y, cw, ch);
    ctx.fillStyle = '#f0ead8'; ctx.fillRect(x + cw * 0.08, y + ch * 0.07, cw * 0.84, ch * 0.86);
    ctx.fillStyle = '#7a6a4a';
    for (let i = 0; i < 9; i++) ctx.fillRect(x + cw * 0.2, y + ch * (0.24 + i * 0.065), cw * (i % 3 === 0 ? 0.6 : 0.5), ch * 0.018);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x + cw * 0.25, y + ch * 0.12, cw * 0.5, ch * 0.05);
    ctx.fillStyle = '#b08a3a'; ctx.beginPath(); ctx.arc(x + cw * 0.72, y + ch * 0.82, cw * 0.07, 0, PI * 2); ctx.fill();

    [x, y, cw, ch] = R('abstract');
    ctx.fillStyle = '#1a1a1c'; ctx.fillRect(x, y, cw, ch);
    ctx.fillStyle = '#d8d0b8'; ctx.fillRect(x + cw * 0.03, y + ch * 0.04, cw * 0.94, ch * 0.92);
    ctx.fillStyle = '#2a4a7a'; ctx.fillRect(x + cw * 0.05, y + ch * 0.06, cw * 0.4, ch * 0.88);
    ctx.fillStyle = '#e0a040';
    ctx.beginPath(); ctx.moveTo(x + cw * 0.35, y + ch * 0.2); ctx.lineTo(x + cw * 0.85, y + ch * 0.12); ctx.lineTo(x + cw * 0.72, y + ch * 0.7); ctx.lineTo(x + cw * 0.3, y + ch * 0.62); ctx.fill();
    ctx.fillStyle = '#c4582a';
    ctx.beginPath(); ctx.moveTo(x + cw * 0.12, y + ch * 0.5); ctx.lineTo(x + cw * 0.3, y + ch * 0.18); ctx.lineTo(x + cw * 0.4, y + ch * 0.86); ctx.fill();
    ctx.fillStyle = '#141414'; ctx.fillRect(x + cw * 0.6, y + ch * 0.66, cw * 0.3, ch * 0.22);
    ctx.fillStyle = '#e8e4d6'; ctx.fillRect(x + cw * 0.18, y + ch * 0.74, cw * 0.36, ch * 0.12);

    [x, y, cw, ch] = R('print');
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x, y, cw, ch);
    ctx.fillStyle = '#e4e4de'; ctx.fillRect(x + cw * 0.1, y + ch * 0.08, cw * 0.8, ch * 0.84);
    ctx.fillStyle = '#8a9aa8'; ctx.fillRect(x + cw * 0.2, y + ch * 0.2, cw * 0.6, ch * 0.45);
    ctx.fillStyle = '#5a6a5a'; ctx.fillRect(x + cw * 0.2, y + ch * 0.5, cw * 0.6, ch * 0.15);

    [x, y, cw, ch] = R('plate');
    ctx.fillStyle = '#b8a060'; ctx.fillRect(x, y, cw, ch);
    ctx.fillStyle = '#3a2a10'; ctx.font = `bold ${Math.round(ch * 0.5)}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('VICE PRESIDENT', x + cw / 2, y + ch / 2);

    [x, y, cw, ch] = R('calendar');
    ctx.fillStyle = '#f0f0ea'; ctx.fillRect(x, y, cw, ch);
    ctx.fillStyle = '#a02020'; ctx.fillRect(x, y, cw, ch * 0.2);
    ctx.fillStyle = '#404040';
    for (let i = 0; i < 5; i++) for (let j = 0; j < 7; j++) ctx.fillRect(x + cw * (0.08 + j * 0.13), y + ch * (0.3 + i * 0.13), cw * 0.08, ch * 0.06);

    [x, y, cw, ch] = R('blot');
    ctx.fillStyle = '#dedad0'; ctx.fillRect(x, y, cw, ch);
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath(); ctx.ellipse(x + cw * 0.5, y + ch * 0.5, cw * 0.3, ch * 0.36, 0.3, 0, PI * 2); ctx.fill();
    ctx.fillStyle = '#dedad0';
    ctx.beginPath(); ctx.ellipse(x + cw * 0.45, y + ch * 0.48, cw * 0.12, ch * 0.2, -0.4, 0, PI * 2); ctx.fill();

    [x, y, cw, ch] = R('shelf');
    ctx.fillStyle = '#7a4e28'; ctx.fillRect(x, y, cw, ch);
    const g = rand(11);
    for (let s = 0; s < 4; s++) {
      const sy = y + ch * (0.04 + s * 0.24);
      ctx.fillStyle = '#5a3418'; ctx.fillRect(x, sy + ch * 0.2, cw, ch * 0.035);
      let bx = x + cw * 0.04;
      while (bx < x + cw * 0.94) {
        const bw = cw * (0.02 + g() * 0.035);
        const bh = ch * (0.12 + g() * 0.07);
        const hue = ['#6a2a22', '#2a3a5a', '#3a4a2a', '#c8c0a8', '#4a3a2a', '#1c1c20'][Math.floor(g() * 6)];
        ctx.fillStyle = hue;
        ctx.fillRect(bx, sy + ch * 0.2 - bh, bw, bh);
        bx += bw + cw * 0.004;
        if (g() < 0.12) bx += cw * 0.08;
      }
    }
  }

  function uvRect(key) {
    const a = ATLAS[key];
    return [[a[0], 1 - a[1] - a[3]], [a[0] + a[2], 1 - a[1] - a[3]], [a[0] + a[2], 1 - a[1]], [a[0], 1 - a[1]]];
  }

  function box(b, x0, y0, z0, x1, y1, z1, col, faces) {
    b.push(M4.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2));
    b.box(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), col, faces ? { faces } : {});
    b.pop();
  }

  function wallX(b, x, z0, z1, y0, y1, col) {
    b.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], col);
  }

  function wallZ(b, z, x0, x1, y0, y1, col) {
    b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col);
  }

  function plant(b, x, z, h, seed, spread) {
    const g = rand(seed);
    const w = spread || 0.32;
    b.at(x, 0, z, q => q.prism(10, 0.15, 0.15, 0, 0.18, 0.18, 0.36, COL.pot, { capBottom: false }));
    K.tube(b, [[x, 0.3, z], [x + 0.03, h * 0.5, z - 0.02], [x - 0.02, h * 0.85, z + 0.02]], [0.022, 0.016, 0.009], 5, 0x5a4630);
    for (let i = 0; i < 26; i++) {
      const a = g() * PI * 2, y = 0.6 + g() * (h - 0.75);
      const end = [x + C(a) * w * (0.4 + g() * 0.6), y + 0.1 + g() * 0.2, z + S(a) * w * (0.4 + g() * 0.6)];
      K.tube(b, [[x, y, z], end], [0.006, 0.004], 3, 0x5a4a30);
      for (let k = 0; k < 7; k++) {
        const u = 0.3 + 0.7 * g();
        const p = [lerp(x, end[0], u) + (g() - 0.5) * 0.12, lerp(y, end[1], u) - g() * 0.12, lerp(z, end[2], u) + (g() - 0.5) * 0.12];
        b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(g() * PI * 2), M4.rotX(0.6 + g() * 0.8));
        const lc = g() < 0.35 ? COL.leafHi : COL.leaf;
        b.quad([-0.028, 0, 0], [0, 0, -0.012], [0.028, 0, 0], [0, 0, 0.07], lc);
        b.pop();
      }
    }
  }

  function desk(b, x, z, rot, w, d) {
    b.push(M4.translate(x, 0, z), M4.rotY(rot));
    box(b, -w / 2, 0.71, -d / 2, w / 2, 0.75, d / 2, COL.desk);
    box(b, -w / 2, 0.0, -d / 2 + 0.03, -w / 2 + 0.05, 0.71, d / 2 - 0.03, COL.deskDark);
    box(b, w / 2 - 0.45, 0.0, -d / 2 + 0.03, w / 2, 0.71, d / 2 - 0.03, COL.deskDark);
    box(b, -w / 2, 0.15, -d / 2 + 0.02, w / 2, 0.71, -d / 2 + 0.05, COL.deskDark);
    box(b, -0.1, 0.75, 0.05, 0.12, 0.76, 0.33, COL.paper);
    b.pop();
  }

  function lamp(b, x, z, y) {
    box(b, x - 0.07, y, z - 0.07, x + 0.07, y + 0.03, z + 0.07, COL.lamp);
    K.tube(b, [[x, y + 0.03, z], [x + 0.05, y + 0.32, z], [x + 0.14, y + 0.42, z]], [0.008, 0.008, 0.008], 4, COL.lamp);
    b.at(x + 0.17, y + 0.38, z, h => h.prism(8, 0.05, 0.05, -0.06, 0.03, 0.03, 0.04, COL.lamp));
  }

  function phone(b, x, z, y) {
    box(b, x - 0.1, y, z - 0.09, x + 0.1, y + 0.06, z + 0.09, 0x2a2a2a);
    box(b, x - 0.11, y + 0.06, z - 0.03, x + 0.11, y + 0.09, z + 0.03, 0x1c1c1c);
  }

  function chair(b, x, z, rot, col) {
    b.push(M4.translate(x, 0, z), M4.rotY(rot));
    box(b, -0.24, 0.42, -0.24, 0.24, 0.5, 0.24, col || COL.chair);
    box(b, -0.24, 0.5, -0.28, 0.24, 1.05, -0.2, col || COL.chair);
    box(b, -0.03, 0.05, -0.03, 0.03, 0.42, 0.03, 0x404040);
    box(b, -0.28, 0.02, -0.03, 0.28, 0.06, 0.03, 0x404040);
    box(b, -0.03, 0.02, -0.28, 0.03, 0.06, 0.28, 0x404040);
    b.pop();
  }

  function cubicle(b, x0, z0, x1, z1) {
    const h = 1.28;
    if (Math.abs(x1 - x0) > Math.abs(z1 - z0)) {
      box(b, x0, 0, z0 - 0.03, x1, h, z0 + 0.03, COL.cubicle);
      box(b, x0, h, z0 - 0.04, x1, h + 0.03, z0 + 0.04, COL.cubicleTop);
    } else {
      box(b, x0 - 0.03, 0, z0, x0 + 0.03, h, z1, COL.cubicle);
      box(b, x0 - 0.04, h, z0, x0 + 0.04, h + 0.03, z1, COL.cubicleTop);
    }
  }

  function picture(b, key, x, y, z, w, h, facing) {
    const uv = uvRect(key);
    const hw = w / 2, hh = h / 2;
    let q;
    if (facing === 'x+') q = [[x, y - hh, z + hw], [x, y - hh, z - hw], [x, y + hh, z - hw], [x, y + hh, z + hw]];
    else if (facing === 'x-') q = [[x, y - hh, z - hw], [x, y - hh, z + hw], [x, y + hh, z + hw], [x, y + hh, z - hw]];
    else if (facing === 'z+') q = [[x - hw, y - hh, z], [x + hw, y - hh, z], [x + hw, y + hh, z], [x - hw, y + hh, z]];
    else q = [[x + hw, y - hh, z], [x - hw, y - hh, z], [x - hw, y + hh, z], [x + hw, y + hh, z]];
    b.quad(q[0], q[1], q[2], q[3], [1, 1, 1, 0.05], uv);
  }

  function blindsX(b, x, z0, z1, y0, y1) {
    const rows = (y1 - y0) / 0.034;
    const cols = Math.abs(z1 - z0) / 0.5;
    b.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], [1, 1, 1, 0.25], [[0, 0], [cols, 0], [cols, rows / 8], [0, rows / 8]]);
  }

  function blindsSeg(b, x0, z0, x1, z1, y0, y1) {
    const rows = (y1 - y0) / 0.034;
    const cols = Math.hypot(x1 - x0, z1 - z0) / 0.5;
    b.quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], [1, 1, 1, 0.25], [[0, 0], [cols, 0], [cols, rows / 8], [0, rows / 8]]);
  }

  function blindsZ(b, z, x0, x1, y0, y1) {
    const rows = (y1 - y0) / 0.034;
    const cols = Math.abs(x1 - x0) / 0.5;
    b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [1, 1, 1, 0.25], [[0, 0], [cols, 0], [cols, rows / 8], [0, rows / 8]]);
  }

  function ceilingLights(b, list, y) {
    list.forEach(([x, z, w, d]) => {
      b.quad([x - w / 2, y - 0.005, z + d / 2], [x + w / 2, y - 0.005, z + d / 2], [x + w / 2, y - 0.005, z - d / 2], [x - w / 2, y - 0.005, z - d / 2], [1, 1, 1, 0.92], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    });
  }

  function buildShell(b) {
    b.quad([-4.5, 0, -16], [6.5, 0, -16], [6.5, 0, 12], [-4.5, 0, 12], COL.carpet, [[0, 0], [11, 0], [11, 28], [0, 28]]);
  }

  function wallSeg(b, x0, z0, x1, z1, y0, y1, col) {
    b.quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], col);
  }

  function postAt(b, x, z, col) {
    box(b, x - 0.045, 0, z - 0.045, x + 0.045, 2.62, z + 0.045, col || COL.frame);
  }

  function glassLine(b, x0, z0, x1, z1, bars, posts) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ang = Math.atan2(x1 - x0, z1 - z0);
    b.push(M4.translate(x0, 0, z0), M4.rotY(ang));
    bars.forEach(y => box(b, -0.035, y - 0.022, 0, 0.035, y + 0.022, len, COL.frame));
    box(b, -0.045, 0, 0, 0.045, 0.08, len, COL.frame);
    for (let i = 0; i <= posts; i++) box(b, -0.045, 0, (i / posts) * len - 0.045, 0.045, 2.62, (i / posts) * len + 0.045, COL.frame);
    b.pop();
  }

  function buildSolid(b) {
    const Y = 2.62;
    glassLine(b, -1.3, -9.5, 1.1, -10.66, [0.75, 1.45, 2.12], 3);
    wallSeg(b, -1.3, -9.5, 1.1, -10.66, 2.12, Y, COL.wall);
    wallSeg(b, 1.1, -10.66, 2.3, -10.05, 0, Y, COL.charcoal);
    box(b, 2.3, 0, -10.12, 2.62, Y, -9.8, COL.charcoalHi, { front: COL.charcoalHi, back: COL.charcoal, left: COL.grey, right: COL.charcoal, top: COL.charcoal, bottom: COL.charcoal });
    wallSeg(b, 3.3, -9.56, 4.8, -8.9, 0, Y, COL.charcoal);
    wallSeg(b, 2.62, -9.85, 3.3, -9.56, 2.15, Y, COL.charcoal);
    postAt(b, 3.3, -9.56);
    postAt(b, 4.36, -9.1);
    wallZ(b, -11.4, 2.3, 4.8, 0, Y, COL.charcoalHi);
    wallX(b, 4.8, -11.4, -8.9, 0, Y, COL.charcoalHi);
    wallX(b, 2.3, -11.4, -10.1, 0, Y, COL.charcoal);
    desk(b, 3.1, -10.85, 0, 1.4, 0.7);
    lamp(b, 3.6, -10.95, 0.76);
    phone(b, 2.6, -10.8, 0.76);
    wallSeg(b, -3.6, -10.8, 1.1, -12.9, 0, Y, COL.wall);
    wallSeg(b, 1.1, -12.9, 1.1, -10.66, 0, Y, COL.charcoal);
    plant(b, -0.15, -11.25, 1.7, 3, 0.36);
    desk(b, -1.6, -11.0, 1.1, 1.4, 0.7);
    chair(b, -1.2, -10.6, 2.3);
    box(b, -3.5, 0, -11.4, -3.1, 1.9, -10.2, COL.woodDk);

    glassLine(b, -1.3, -9.5, -1.3, -7.0, [2.12], 2);
    wallX(b, -1.3, -9.5, -7.0, 2.15, Y, COL.wall);
    box(b, -1.35, 0, -7.02, -1.25, 2.2, -6.94, COL.frame);
    box(b, -1.35, 0, -6.16, -1.25, 2.2, -6.08, COL.frame);
    box(b, -1.35, 2.12, -7.0, -1.25, 2.2, -6.1, COL.frame);
    wallX(b, -1.3, -7.0, -6.1, 2.2, Y, COL.wall);
    wallX(b, -1.3, -6.1, -5.3, 0, Y, COL.wallHi);
    box(b, -1.3, 0, -6.12, -1.16, Y, -5.98, COL.wallHi);
    glassLine(b, -1.3, -5.3, -1.3, 1.0, [2.12], 5);
    wallX(b, -1.3, -5.3, 1.0, 2.15, Y, COL.wall);
    wallX(b, -3.8, -10.8, 1.0, 0, Y, COL.wall);
    desk(b, -2.5, -8.3, PI / 2, 1.4, 0.7);
    chair(b, -2.0, -8.3, -PI / 2);
    lamp(b, -2.7, -7.9, 0.76);
    desk(b, -2.6, -4.2, PI / 2, 1.4, 0.7);
    chair(b, -2.1, -4.2, -PI / 2);
    desk(b, -2.6, -1.4, PI / 2, 1.4, 0.7);
    plant(b, -3.3, -2.8, 1.6, 13, 0.3);
    box(b, -3.75, 0, -6.4, -3.4, 1.9, -5.0, COL.woodDk);
    plant(b, -0.9, -2.0, 1.5, 9, 0.3);

    wallX(b, 1.25, -6.5, 1.0, 0, Y, COL.wallHi);
    box(b, 1.25, 0, -6.55, 1.5, Y, -6.25, COL.wallHi);
    box(b, 1.21, 0, -3.2, 1.29, 2.15, -3.1, COL.frame);
    box(b, 1.21, 0, -2.25, 1.29, 2.15, -2.15, COL.frame);
    box(b, 1.21, 2.1, -3.2, 1.29, 2.15, -2.15, COL.frame);
    box(b, 1.23, 0.02, -3.12, 1.27, 2.08, -2.23, COL.door);
    box(b, 1.25, 0, -6.0, 1.42, Y, -5.7, COL.wallHi);
    wallZ(b, 1.0, -3.8, -1.3, 0, Y, COL.wall);
    wallZ(b, 1.0, 1.25, 4.4, 0, Y, COL.wall);

    const XR = -0.78, ZE = 10.8;
    wallX(b, XR, -1.2, 1.6, 0, Y, COL.wall);
    glassLine(b, XR, 1.6, XR, 4.0, [2.12], 2);
    wallX(b, XR, 1.6, 4.0, 2.15, Y, COL.wall);
    box(b, XR - 0.3, 0, 4.0, XR + 0.04, Y, 4.35, COL.wallHi);
    glassLine(b, XR, 4.35, XR, 5.9, [2.12], 1);
    wallX(b, XR, 4.35, 5.9, 2.15, Y, COL.wall);
    plant(b, XR + 0.36, 3.75, 1.65, 21, 0.3);
    wallX(b, -3.2, 1.6, 5.9, 0, Y, COL.wall);
    wallZ(b, 1.6, -3.2, XR, 0, Y, COL.wall);
    desk(b, -2.0, 3.0, PI / 2, 1.5, 0.75);
    lamp(b, -2.2, 3.5, 0.76);
    phone(b, -1.9, 2.5, 0.76);
    chair(b, -2.6, 3.0, PI / 2);
    desk(b, -1.9, 5.1, PI / 2, 1.4, 0.7);

    glassLine(b, XR, 5.9, XR, 7.1, [2.12], 1);
    box(b, XR - 0.06, 0, 7.08, XR + 0.04, 2.2, 7.16, COL.frame);
    box(b, XR - 0.06, 0, 7.88, XR + 0.04, 2.2, 7.96, COL.frame);
    box(b, XR - 0.06, 2.12, 7.1, XR + 0.04, 2.2, 7.96, COL.frame);
    b.push(M4.translate(XR - 0.02, 0, 7.14), M4.rotY(-1.25));
    box(b, -0.03, 0.02, 0.0, 0.03, 2.1, 0.76, COL.door);
    box(b, 0.03, 1.0, 0.56, 0.06, 1.04, 0.7, COL.brass);
    b.pop();
    wallX(b, XR, 5.9, 7.9, 2.2, Y, COL.wall);
    wallX(b, -2.9, 5.9, 7.9, 0, Y, COL.wallHi);
    wallZ(b, 5.9, -3.2, XR, 0, Y, COL.wall);
    wallZ(b, 7.9, -2.9, XR, 0, Y, COL.wall);
    box(b, -2.88, 0.0, 6.0, -2.5, 2.1, 6.95, COL.wood);
    box(b, -2.88, 0.0, 6.95, -2.6, 0.9, 7.8, COL.woodDk);
    chair(b, -1.27, 7.75, PI / 2 + 0.35, 0x3a2a22);
    desk(b, -2.15, 6.5, PI / 2, 1.2, 0.65);

    wallX(b, XR, 7.9, 9.75, 0, Y, COL.wallHi);
    box(b, XR - 0.05, 0, 9.72, XR + 0.03, 2.18, 9.79, COL.frame);
    box(b, XR - 0.05, 0, 10.63, XR + 0.03, 2.18, 10.7, COL.frame);
    box(b, XR - 0.05, 2.1, 9.75, XR + 0.03, 2.18, 10.7, COL.frame);
    box(b, XR - 0.035, 0.02, 9.79, XR - 0.005, 2.1, 10.63, COL.door);
    box(b, XR + 0.0, 0.97, 9.88, XR + 0.04, 1.01, 10.04, COL.brass);
    wallX(b, XR, 9.75, 10.7, 2.18, Y, COL.wall);
    box(b, XR, 1.15, 9.6, XR + 0.012, 1.27, 9.68, 0xdcdcd4);
    wallX(b, XR, 10.7, ZE, 0, Y, COL.wallHi);

    glassLine(b, XR, ZE - 0.02, -0.2, ZE - 0.02, [2.12], 1);
    wallZ(b, ZE, XR, -0.2, 2.15, Y, COL.wall);
    glassLine(b, -0.2, ZE, 1.6, ZE, [0.92, 2.12], 3);
    wallZ(b, ZE, -0.2, 1.6, 2.15, Y, COL.wall);
    wallZ(b, ZE, 1.6, 3.6, 0, Y, COL.wallHi);
    wallZ(b, 12.4, -1.2, 3.6, 0, Y, COL.wallHi);
    wallX(b, -1.2, ZE, 12.4, 0, Y, COL.wall);
    desk(b, 0.6, 11.4, PI, 1.6, 0.62);
    lamp(b, 0.0, 11.45, 0.76);
    phone(b, 1.0, 11.3, 0.76);
    b.at(1.32, 0.76, 11.27, h => {
      h.prism(8, 0.07, 0.07, 0, 0.09, 0.09, 0.13, 0xc8b8a0);
      const g = rand(5);
      for (let i = 0; i < 18; i++) {
        const a = g() * PI * 2, r = 0.04 + g() * 0.12;
        h.push(M4.translate(C(a) * r, 0.17 + g() * 0.14, S(a) * r), M4.rotY(a), M4.rotX(0.5));
        h.box(0.1, 0.014, 0.06, [0.8, 0.07, 0.09, 0.3]);
        h.pop();
      }
    });
    box(b, -1.15, 0, 11.7, -0.7, 1.4, 12.35, COL.woodDk);

    glassLine(b, 0.95, -1.5, 0.95, 1.7, [2.12], 2);
    wallX(b, 0.95, -1.5, 1.7, 2.15, Y, COL.wall);
    box(b, 0.9, 0, 1.7, 1.3, Y, 3.6, COL.wallHi);
    cubicle(b, 1.4, 3.7, 1.4, 6.0);
    cubicle(b, 1.4, 7.2, 1.4, 9.4);
    cubicle(b, 1.4, 6.0, 3.6, 6.0);
    cubicle(b, 1.4, 7.2, 3.6, 7.2);
    desk(b, 2.5, 4.8, 0, 1.4, 0.7);
    desk(b, 2.5, 8.3, PI, 1.4, 0.7);
    chair(b, 2.5, 8.9, PI);
    lamp(b, 3.0, 8.2, 0.76);
    phone(b, 2.1, 4.9, 0.76);
    wallX(b, 3.6, -1.5, 12.4, 0, Y, COL.wall);
    plant(b, 1.4, 8.7, 1.6, 31, 0.3);
    box(b, 1.75, 0, 9.5, 2.0, Y, ZE, COL.wallHi);
    box(b, 2.6, 0, 9.6, 3.5, 1.1, 10.2, COL.woodDk);
    wallZ(b, -1.5, 0.95, 3.6, 0, Y, COL.wall);
    wallZ(b, -1.2, -3.2, XR, 0, Y, COL.wall);
  }

  function buildPictures(b) {
    picture(b, 'cert', -1.29, 1.52, -5.7, 0.36, 0.46, 'x+');
    picture(b, 'abstract', 2.95, 1.5, -11.38, 1.0, 0.82, 'z+');
    picture(b, 'print', 1.24, 1.5, -4.6, 0.6, 0.7, 'x-');
    picture(b, 'cert', -3.19, 1.55, 3.2, 0.32, 0.42, 'x+');
    picture(b, 'print', 3.59, 1.5, 5.0, 0.7, 0.8, 'x-');
    picture(b, 'print', 0.89, 1.55, 2.6, 0.36, 0.44, 'x-');
    picture(b, 'calendar', 2.95, 1.0, 6.04, 0.3, 0.36, 'z+');
    picture(b, 'shelf', -2.49, 1.05, 6.47, 0.95, 2.0, 'x+');
    picture(b, 'print', -2.89, 1.55, 7.5, 0.42, 0.52, 'x+');
    picture(b, 'cert', -2.89, 1.6, 7.05, 0.3, 0.38, 'x+');
    picture(b, 'blot', 0.6, 1.6, 12.39, 0.8, 0.6, 'z-');
    picture(b, 'calendar', 1.5, 1.5, 12.39, 0.3, 0.36, 'z-');
    picture(b, 'plate', -0.775, 1.56, 10.36, 0.2, 0.06, 'x+');
  }

  function buildBlinds(b) {
    blindsSeg(b, -1.36, -9.48, 1.06, -10.72, 0.95, 2.1);
    blindsX(b, -1.36, -9.5, -7.0, 1.1, 2.1);
    blindsX(b, -1.36, -5.3, -2.0, 1.3, 2.1);
    blindsX(b, -1.36, -2.0, 1.0, 1.6, 2.1);
    blindsX(b, -0.83, 1.6, 4.0, 0.5, 2.1);
    blindsX(b, -0.83, 4.35, 5.9, 0.3, 2.1);
    blindsX(b, -0.83, 5.9, 7.1, 0.95, 2.1);
    blindsZ(b, 10.86, -0.78, -0.2, 1.0, 2.1);
    blindsZ(b, 10.87, -0.2, 1.6, 1.3, 2.1);
    blindsX(b, 1.0, -1.5, 1.7, 0.4, 2.1);
  }

  function buildLights(b) {
    ceilingLights(b, [
      [0.4, -10.6, 0.6, 1.2], [3.4, -10.3, 1.2, 0.6], [-2.4, -10.0, 1.2, 0.6], [0.0, -8.0, 0.6, 1.2], [0.0, -5.0, 0.6, 1.2], [0.0, -2.0, 0.6, 1.2], [0.0, 0.6, 0.6, 1.2],
      [-2.5, -6.0, 1.2, 0.6], [-2.5, -2.5, 1.2, 0.6],
      [0.1, 2.6, 0.6, 1.2], [0.1, 5.4, 0.6, 1.2], [0.1, 8.2, 0.6, 1.2], [0.4, 10.2, 0.6, 0.8],
      [2.4, 4.8, 1.2, 0.6], [2.4, 8.2, 1.2, 0.6], [-2.0, 3.0, 1.2, 0.6], [-1.9, 6.9, 1.2, 0.6], [0.6, 11.5, 1.2, 0.6]
    ], 2.62);
  }

  function buildCeiling(b) {
    const Y = 2.62;
    b.quad([-4.5, Y, -16], [-4.5, Y, 12.6], [6.5, Y, 12.6], [6.5, Y, -16], COL.ceiling);
  }

  function buildGlass(b) {
    const col = [0.78, 0.84, 0.86, 0.3];
    wallSeg(b, -1.3, -9.5, 1.1, -10.66, 0.08, 2.12, col);
    [
      ['x', -1.3, -9.5, -7.0, 0.08, 2.12],
      ['x', -1.3, -6.96, -6.14, 0.0, 2.12],
      ['x', -1.3, -5.3, 1.0, 0.08, 2.12],
      ['x', -0.78, 1.6, 4.0, 0.08, 2.12],
      ['x', -0.78, 4.35, 7.1, 0.08, 2.12],
      ['z', 10.78, -0.78, -0.2, 0.08, 2.12],
      ['z', 10.8, -0.2, 1.6, 0.08, 2.12],
      ['x', 0.95, -1.5, 1.7, 0.08, 2.12]
    ].forEach(([ax, c, a0, a1, y0, y1]) => {
      if (ax === 'x') wallX(b, c, a0, a1, y0, y1, col);
      else wallZ(b, c, a0, a1, y0, y1, col);
    });
  }

  function build(r) {
    return {
      carpet: r.texture(128, carpetTex),
      blindsTex: r.texture(64, blindsTex),
      lightTex: r.texture(128, lightTex, { height: 64 }),
      atlas: r.texture(1024, atlasTex, { clamp: true }),
      shell: mesh(r, buildShell),
      ceiling: mesh(r, buildCeiling),
      solid: mesh(r, buildSolid),
      pictures: mesh(r, buildPictures),
      blinds: mesh(r, buildBlinds),
      lights: mesh(r, buildLights),
      glass: mesh(r, buildGlass)
    };
  }

  function draw(r, W, st) {
    const pass = { noCookie: true };
    r.draw(W.shell, null, Object.assign({ texture: W.carpet }, pass));
    r.draw(W.ceiling, null, pass);
    r.draw(W.solid, null, pass);
    r.draw(W.pictures, null, Object.assign({ texture: W.atlas }, pass));
    r.draw(W.blinds, null, Object.assign({ texture: W.blindsTex }, pass));
    r.draw(W.lights, null, Object.assign({ texture: W.lightTex }, pass));
  }

  function drawGlass(r, W, st) {
    r.draw(W.glass, null, { blend: true, alpha: 0.16, noCookie: true });
  }

  window.YegudOffice = { COL, build, draw, drawGlass };
})();
