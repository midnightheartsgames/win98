(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;

  const COL = {
    crimson: 0xb8162c,
    crimsonDark: 0x680a18,
    crimsonDeep: 0x38040c,
    gold: 0xe6b84c,
    goldLight: 0xfff0a8,
    goldDark: 0x986e22,
    wood: 0x42241b,
    woodDark: 0x26120c,
    woodWarm: 0x7a4832,
    ivory: 0xf4ece2,
    navy: 0x1e2442,
    navyDark: 0x0e1226,
    indigo: 0x2c3468,
    deskWood: 0x6e5444,
    chalk: 0x243832,
    neonPink: 0xff3878,
    neonCyan: 0x36e8e0,
    neonPurple: 0x8a38e8,
    charcoal: 0x1a1820,
    black: 0x08060a
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

  function cylAt(b, p0, p1, r0, r1, sides, col) {
    K.tube(b, [p0, p1], [r0, r1], sides, col);
  }

  function texQuad(b, a, bq, c, d, uv, col, nrm) {
    const cc = col || [1, 1, 1, 0];
    const n = nrm || V3.norm(V3.cross(V3.sub(bq, a), V3.sub(d, a)));
    const uvs = (uv || [[0, 0], [1, 0], [1, 1], [0, 1]]).map(([u, v]) => [u, 1 - v]);
    b.quad(a, bq, c, d, [cc, cc, cc, cc], uvs, [n, n, n, n]);
  }

  function texCurtain(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#a81428');
    gr.addColorStop(0.55, '#820c1e');
    gr.addColorStop(1, '#3e040e');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    const folds = 16;
    for (let i = 0; i < folds; i++) {
      const x0 = (i / folds) * w;
      const fw = w / folds;
      const fg = ctx.createLinearGradient(x0, 0, x0 + fw, 0);
      fg.addColorStop(0, 'rgba(30,0,8,0.65)');
      fg.addColorStop(0.38, 'rgba(255,70,95,0.32)');
      fg.addColorStop(0.62, 'rgba(220,30,55,0.18)');
      fg.addColorStop(1, 'rgba(25,0,6,0.7)');
      ctx.fillStyle = fg;
      ctx.fillRect(x0, 0, fw, h);
    }
    ctx.fillStyle = '#e6b84c';
    ctx.fillRect(0, h - 18, w, 10);
    for (let i = 0; i < 32; i++) {
      const x = (i + 0.5) * (w / 32);
      ctx.beginPath();
      ctx.arc(x, h - 18, 5, 0, PI * 2);
      ctx.fill();
    }
  }

  function texStageFloor(ctx, w, h) {
    ctx.fillStyle = '#381814';
    ctx.fillRect(0, 0, w, h);
    const g = rand(301);
    const planks = 16;
    const ph = h / planks;
    for (let r = 0; r < planks; r++) {
      const v = Math.floor(g() * 22);
      ctx.fillStyle = `rgb(${68 + v},${28 + Math.floor(v * 0.6)},${24 + Math.floor(v * 0.5)})`;
      ctx.fillRect(0, r * ph + 1, w, ph - 2);
      ctx.strokeStyle = 'rgba(20,6,6,0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, r * ph);
      ctx.lineTo(w, r * ph);
      ctx.stroke();
    }
    const rg = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, w * 0.48);
    rg.addColorStop(0, 'rgba(255,180,120,0.24)');
    rg.addColorStop(0.6, 'rgba(200,30,60,0.12)');
    rg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);
  }

  function texClockFace(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R = w * 0.46;
    const gr = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
    gr.addColorStop(0, 'rgba(90,45,130,0.88)');
    gr.addColorStop(0.68, 'rgba(38,18,68,0.92)');
    gr.addColorStop(1, 'rgba(230,184,76,0.96)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffd878';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.94, 0, PI * 2);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.74, 0, PI * 2);
    ctx.stroke();

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2 - PI / 2;
      const x0 = cx + C(a) * R * 0.76, y0 = cy + S(a) * R * 0.76;
      const x1 = cx + C(a) * R * 0.9, y1 = cy + S(a) * R * 0.9;
      ctx.strokeStyle = i % 3 === 0 ? '#fff2a8' : '#e6b84c';
      ctx.lineWidth = i % 3 === 0 ? 7 : 4;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.strokeStyle = '#ff3868';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * 0.45, cy - R * 0.32);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - R * 0.18, cy - R * 0.64);
    ctx.stroke();
    ctx.fillStyle = '#ffd878';
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, PI * 2);
    ctx.fill();
  }

  function texClassFloor(ctx, w, h) {
    ctx.fillStyle = '#383c5e';
    ctx.fillRect(0, 0, w, h);
    const n = 8, s = w / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = (i + j) % 2 === 0 ? '#424870' : '#323656';
        ctx.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      }
    }
  }

  function texChalkboard(ctx, w, h) {
    ctx.fillStyle = '#1d2d34';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(220,235,255,0.28)';
    ctx.lineWidth = 3;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = 'rgba(255,110,150,0.45)';
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillText('WHO AM I ?', 54, 78);
    ctx.strokeStyle = 'rgba(255,80,120,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w * 0.72, h * 0.52, 42, 0, PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w * 0.72 - 14, h * 0.48, 5, 0, PI * 2);
    ctx.arc(w * 0.72 + 14, h * 0.48, 5, 0, PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.72, h * 0.55, 20, 0.15 * PI, 0.85 * PI);
    ctx.stroke();
  }

  function texBackdrop(mode) {
    return (ctx, w, h) => {
      const gr = ctx.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.5, w * 0.7);
      if (mode === 'crimson') {
        gr.addColorStop(0, '#ff3864');
        gr.addColorStop(0.45, '#9e1232');
        gr.addColorStop(1, '#28040e');
      } else if (mode === 'penacony') {
        gr.addColorStop(0, '#9a58d8');
        gr.addColorStop(0.5, '#3c2468');
        gr.addColorStop(1, '#120b28');
      } else if (mode === 'golden') {
        gr.addColorStop(0, '#ffe29a');
        gr.addColorStop(0.5, '#9e5438');
        gr.addColorStop(1, '#341614');
      } else {
        gr.addColorStop(0, '#46b8d8');
        gr.addColorStop(0.5, '#283268');
        gr.addColorStop(1, '#0c1024');
      }
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = mode === 'golden' ? 'rgba(255,235,170,0.35)' : 'rgba(255,180,210,0.28)';
      ctx.lineWidth = 3;
      for (let r = 1; r <= 6; r++) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.48, r * 42, 0, PI * 2);
        ctx.stroke();
      }
      const rays = 24;
      for (let i = 0; i < rays; i++) {
        const a = (i / rays) * PI * 2;
        ctx.beginPath();
        ctx.moveTo(w * 0.5 + C(a) * 35, h * 0.48 + S(a) * 35);
        ctx.lineTo(w * 0.5 + C(a) * w * 0.7, h * 0.48 + S(a) * w * 0.7);
        ctx.stroke();
      }
    };
  }

  function texBannerLogo(kind) {
    return (ctx, w, h) => {
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, w, h);
      const rg = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, w * 0.45);
      rg.addColorStop(0, kind === 'intro' ? 'rgba(120,160,255,0.22)' : 'rgba(255,60,100,0.25)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (kind === 'intro') {
        ctx.fillStyle = '#e8f0ff';
        ctx.font = 'bold 34px Tahoma, sans-serif';
        ctx.fillText('HoYoverse  •  HSR 98', w / 2, h * 0.46);
        ctx.fillStyle = '#9aa8c8';
        ctx.font = '16px Tahoma, sans-serif';
        ctx.fillText('PRESENTS A MASKED FOOLS PRODUCTION', w / 2, h * 0.62);
      } else if (kind === 'title') {
        ctx.fillStyle = '#ff2856';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#18040a';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w * 0.36, 0);
        ctx.lineTo(w * 0.18, h);
        ctx.lineTo(0, h);
        ctx.fill();
        ctx.strokeStyle = '#ffd878';
        ctx.lineWidth = 5;
        ctx.strokeRect(18, 18, w - 36, h - 36);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 46px Georgia, serif';
        ctx.fillText('SPARKLE', w * 0.55, h * 0.38);
        ctx.fillStyle = '#ffd878';
        ctx.font = 'bold 28px Tahoma, sans-serif';
        ctx.fillText('« MONODRAMA »', w * 0.55, h * 0.62);
        ctx.fillStyle = '#ffccd8';
        ctx.font = '16px Tahoma, sans-serif';
        ctx.fillText('ИСКОРКА : МОНОДРАМА В ТРЁХ АКТАХ', w * 0.55, h * 0.8);
      } else {
        ctx.fillStyle = '#f4ece2';
        ctx.font = 'bold 38px Georgia, serif';
        ctx.fillText('HONKAI: STAR RAIL', w / 2, h * 0.42);
        ctx.fillStyle = '#ff4870';
        ctx.font = 'bold 20px Tahoma, sans-serif';
        ctx.fillText('SPARKLE  •  MONODRAMA  •  HSR98', w / 2, h * 0.62);
        ctx.fillStyle = '#c8b898';
        ctx.font = '14px Tahoma, sans-serif';
        ctx.fillText('http://hsr.hoyoverse.com', w / 2, h * 0.78);
      }
    };
  }

  function buildPenaconySet(r, T) {
    const floor = K.mesh(r, b => {
      texQuad(b, [-5.5, 0, 4.5], [5.5, 0, 4.5], [5.5, 0, -6.5], [-5.5, 0, -6.5], [[0, 0], [4, 0], [4, 4], [0, 4]]);
    });
    const back = K.mesh(r, b => {
      texQuad(b, [-6.5, 0, -5.2], [6.5, 0, -5.2], [6.5, 5.2, -5.2], [-6.5, 5.2, -5.2]);
    });
    const clock = K.mesh(r, b => {
      texQuad(b, [-1.8, -1.8, 0], [1.8, -1.8, 0], [1.8, 1.8, 0], [-1.8, 1.8, 0]);
    });
    const arch = K.mesh(r, b => {
      [-3.4, -2.1, 2.1, 3.4].forEach((x, idx) => {
        const h = idx === 0 || idx === 3 ? 3.8 : 3.2;
        boxAt(b, [x, h * 0.5, -2.8 - (idx % 2) * 0.9], [0.42, h, 0.42], COL.navy);
        boxAt(b, [x, h + 0.14, -2.8 - (idx % 2) * 0.9], [0.58, 0.18, 0.58], COL.gold);
        boxAt(b, [x, h * 0.65, -2.56 - (idx % 2) * 0.9], [0.16, h * 0.7, 0.06], idx % 2 ? COL.neonCyan : COL.neonPink);
      });
      boxAt(b, [0, 0.14, -1.5], [3.6, 0.28, 2.4], COL.Crimson || COL.crimsonDark);
      boxAt(b, [0, 0.3, -1.5], [3.4, 0.05, 2.2], COL.gold);
      for (let i = -3; i <= 3; i++) {
        if (i === 0) continue;
        const lx = i * 1.15;
        cylAt(b, [lx, 0, -0.6], [lx, 2.1, -0.6], 0.035, 0.03, 6, COL.goldDark);
        ellAt(b, [lx, 2.22, -0.6], 0.14, 0.18, 0.14, 8, 6, i % 2 ? COL.neonPink : COL.goldLight);
      }
    });
    return { floor, back, clock, arch };
  }

  function buildClassroomSet(r, T) {
    const floor = K.mesh(r, b => {
      texQuad(b, [-4.8, 0, 4.0], [4.8, 0, 4.0], [4.8, 0, -4.8], [-4.8, 0, -4.8], [[0, 0], [4, 0], [4, 4], [0, 4]]);
    });
    const board = K.mesh(r, b => {
      texQuad(b, [-2.2, 0.85, -2.65], [2.2, 0.85, -2.65], [2.2, 2.45, -2.65], [-2.2, 2.45, -2.65]);
    });
    const room = K.mesh(r, b => {
      boxAt(b, [0, 1.8, -2.75], [8.4, 3.6, 0.14], COL.indigo);
      boxAt(b, [-4.1, 1.8, -0.4], [0.16, 3.6, 5.2], 0x242c58);
      boxAt(b, [4.1, 1.8, -0.4], [0.16, 3.6, 5.2], 0x242c58);
      [-1.8, -0.4, 1.0].forEach(z => {
        boxAt(b, [-4.0, 1.85, z], [0.06, 1.35, 0.92], 0x6a82c4);
        boxAt(b, [-3.96, 1.85, z], [0.04, 1.4, 0.06], COL.ivory);
        boxAt(b, [-3.96, 1.85, z], [0.04, 0.06, 0.96], COL.ivory);
      });
      const deskCoords = [
        [-1.35, -0.9], [0, -0.9], [1.35, -0.9],
        [-1.35, 0.25], [0, 0.25], [1.35, 0.25],
        [-1.35, 1.35], [1.35, 1.35]
      ];
      deskCoords.forEach(([dx, dz]) => {
        boxAt(b, [dx, 0.68, dz], [0.74, 0.05, 0.48], COL.deskWood);
        boxAt(b, [dx, 0.58, dz], [0.66, 0.14, 0.42], 0x48362c);
        [[-0.3, -0.18], [0.3, -0.18], [-0.3, 0.18], [0.3, 0.18]].forEach(([ox, oz]) => {
          cylAt(b, [dx + ox, 0, dz + oz], [dx + ox, 0.66, dz + oz], 0.02, 0.02, 5, COL.charcoal);
        });
        boxAt(b, [dx, 0.42, dz + 0.38], [0.42, 0.04, 0.38], COL.deskWood);
        boxAt(b, [dx, 0.72, dz + 0.55], [0.42, 0.32, 0.04], COL.deskWood);
      });
    });
    return { floor, board, room };
  }

  function buildStageSet(r, T) {
    const floor = K.mesh(r, b => {
      texQuad(b, [-5.5, 0, 4.2], [5.5, 0, 4.2], [5.5, 0, -5.5], [-5.5, 0, -5.5], [[0, 0], [3, 0], [3, 3], [0, 3]]);
    });
    const back = K.mesh(r, b => {
      texQuad(b, [-6.0, 0, -4.6], [6.0, 0, -4.6], [6.0, 4.8, -4.6], [-6.0, 4.8, -4.6]);
    });
    const curtains = K.mesh(r, b => {
      texQuad(b, [-4.6, 0, -1.8], [-2.1, 0, -1.8], [-2.1, 4.2, -1.8], [-4.6, 4.2, -1.8]);
      texQuad(b, [2.1, 0, -1.8], [4.6, 0, -1.8], [4.6, 4.2, -1.8], [2.1, 4.2, -1.8]);
      texQuad(b, [-4.8, 3.3, -1.6], [4.8, 3.3, -1.6], [4.8, 4.4, -1.6], [-4.8, 4.4, -1.6], [[0, 0], [2, 0], [2, 0.4], [0, 0.4]]);
    });
    const torii = K.mesh(r, b => {
      [-2.8, -1.8, 1.8, 2.8].forEach((x, idx) => {
        const z = idx === 0 || idx === 3 ? -2.4 : -3.4;
        cylAt(b, [x, 0, z], [x, 2.9, z], 0.14, 0.12, 10, COL.crimson);
        cylAt(b, [x, 0, z], [x, 0.35, z], 0.16, 0.15, 10, COL.black);
        boxAt(b, [x, 2.85, z], [0.34, 0.14, 0.34], COL.gold);
      });
      boxAt(b, [0, 2.95, -3.4], [4.4, 0.18, 0.24], COL.crimson);
      boxAt(b, [0, 3.12, -3.4], [4.8, 0.12, 0.32], COL.black);
      boxAt(b, [0, 2.52, -3.4], [3.9, 0.12, 0.18], COL.crimson);
      boxAt(b, [0, 2.74, -3.32], [0.38, 0.42, 0.1], COL.gold);

      for (let i = 0; i < 16; i++) {
        const a0 = (i / 16) * PI * 2, a1 = ((i + 1) / 16) * PI * 2;
        const rIn = 1.65, rOut = 1.82;
        b.quad(
          [C(a0) * rIn, 0.02, S(a0) * rIn - 0.5],
          [C(a1) * rIn, 0.02, S(a1) * rIn - 0.5],
          [C(a1) * rOut, 0.02, S(a1) * rOut - 0.5],
          [C(a0) * rOut, 0.02, S(a0) * rOut - 0.5],
          i % 2 === 0 ? COL.gold : COL.crimson,
          null,
          [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]
        );
      }
    });
    const pinwheel = K.mesh(r, b => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * PI * 2;
        const a2 = a + 0.38;
        const col = i % 2 === 0 ? COL.crimson : COL.ivory;
        b.tri([0, 0, 0], [C(a) * 0.48, S(a) * 0.48, 0.02], [C(a2) * 0.34, S(a2) * 0.34, -0.02], col, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      }
      ellAt(b, [0, 0, 0.03], 0.07, 0.07, 0.04, 8, 6, COL.gold);
    });
    return { floor, back, curtains, torii, pinwheel };
  }

  function buildKaleidoSet(r) {
    const ringMesh = K.mesh(r, b => {
      const segs = 24;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * PI * 2, a1 = ((i + 1) / segs) * PI * 2;
        const r0 = 2.6, r1 = 2.85;
        const col = i % 3 === 0 ? COL.goldLight : i % 3 === 1 ? COL.crimson : COL.ivory;
        b.quad(
          [C(a0) * r0, S(a0) * r0, 0],
          [C(a1) * r0, S(a1) * r0, 0],
          [C(a1) * r1, S(a1) * r1, 0],
          [C(a0) * r1, S(a0) * r1, 0],
          col,
          null,
          [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]
        );
      }
    });
    const burst = K.mesh(r, b => {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * PI * 2;
        const col = i % 2 === 0 ? COL.goldLight : COL.neonPink;
        cylAt(b, [C(a) * 0.15, S(a) * 0.15, 0], [C(a) * 0.95, S(a) * 0.95, 0], 0.028, 0.004, 5, col);
      }
    });
    return { ringMesh, burst };
  }

  function build(r) {
    const T = {
      curtain: r.texture(256, texCurtain),
      stageFloor: r.texture(256, texStageFloor),
      clockFace: r.texture(256, texClockFace, { clamp: true }),
      classFloor: r.texture(256, texClassFloor),
      chalkboard: r.texture(512, texChalkboard, { height: 256, clamp: true }),
      backCrimson: r.texture(256, texBackdrop('crimson')),
      backPenacony: r.texture(256, texBackdrop('penacony')),
      backGolden: r.texture(256, texBackdrop('golden')),
      backKaleido: r.texture(256, texBackdrop('kaleido')),
      logoIntro: r.texture(512, texBannerLogo('intro'), { height: 288, clamp: true }),
      logoTitle: r.texture(512, texBannerLogo('title'), { height: 288, clamp: true }),
      logoOutro: r.texture(512, texBannerLogo('outro'), { height: 288, clamp: true })
    };

    const penacony = buildPenaconySet(r, T);
    const classroom = buildClassroomSet(r, T);
    const stage = buildStageSet(r, T);
    const kaleido = buildKaleidoSet(r);

    return { T, penacony, classroom, stage, kaleido };
  }

  function draw(r, W, st) {
    const set = st.set || 'stage';
    const t = st.t || 0;

    if (set === 'penacony') {
      r.draw(W.penacony.floor, M4.ident(), { texture: W.T.stageFloor });
      r.draw(W.penacony.back, M4.ident(), { texture: W.T.backPenacony, noFog: true });
      r.draw(W.penacony.arch, M4.ident());
      const cm = M4.chain(M4.translate(0, 2.2, -3.8), M4.rotZ(t * 0.35));
      r.draw(W.penacony.clock, cm, { texture: W.T.clockFace, blend: true });
      return;
    }

    if (set === 'classroom') {
      r.draw(W.classroom.floor, M4.ident(), { texture: W.T.classFloor });
      r.draw(W.classroom.room, M4.ident());
      r.draw(W.classroom.board, M4.ident(), { texture: W.T.chalkboard });
      return;
    }

    const backTex = set === 'curtain' ? W.T.backGolden : set === 'kaleido' ? W.T.backKaleido : W.T.backCrimson;
    r.draw(W.stage.floor, M4.ident(), { texture: W.T.stageFloor });
    r.draw(W.stage.back, M4.ident(), { texture: backTex, noFog: true });
    r.draw(W.stage.torii, M4.ident());
    r.draw(W.stage.curtains, M4.ident(), { texture: W.T.curtain });

    const pwPositions = [
      [-1.55, 1.65, -2.2],
      [1.55, 1.65, -2.2],
      [-2.35, 2.25, -2.6],
      [2.35, 2.25, -2.6]
    ];
    pwPositions.forEach(([px, py, pz], i) => {
      const pm = M4.chain(M4.translate(px, py, pz), M4.rotZ(t * (2.4 + i * 0.4) * (i % 2 ? 1 : -1)));
      r.draw(W.stage.pinwheel, pm);
    });

    if (set === 'kaleido' || st.fireworks) {
      for (let i = 0; i < 3; i++) {
        const rm = M4.chain(
          M4.translate(0, 1.5, -2.6 - i * 0.55),
          M4.rotZ(t * (0.8 + i * 0.35) * (i % 2 ? -1 : 1)),
          M4.scale(0.65 + i * 0.25)
        );
        r.draw(W.kaleido.ringMesh, rm);
      }
    }

    if (st.fireworks) {
      const bursts = [
        [-1.6, 2.4, -2.9, 0.0],
        [1.6, 2.5, -2.8, 0.35],
        [0.0, 2.8, -3.1, 0.65]
      ];
      bursts.forEach(([bx, by, bz, ph]) => {
        const u = ((t * 1.4 + ph) % 1);
        const sc = 0.25 + u * 1.15;
        const bm = M4.chain(M4.translate(bx, by, bz), M4.rotZ(t * 1.5 + ph * 4), M4.scale(sc));
        r.draw(W.kaleido.burst, bm);
      });
    }
  }

  window.SparkleWorld = { build, draw };
})();
