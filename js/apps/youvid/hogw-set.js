(function () {
  const { M4, V3, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, mesh, tube } = K;

  const ROOM = { rear: -4.2, front: 4.2, win: -3.0, cor: 3.0, h: 3.1 };
  const LIT = [1, 1, 1, 0];
  const GLOW = [1, 1, 1, 1];
  const WINDOWS = [-2.35, 0.25, 2.85];
  const ROWS = [-1.95, 0.05, 2.05];
  const COLS = [-2.1, -0.7, 0.7, 2.1];
  const SPOTS = {
    harryDesk: [-2.1, -1.95],
    hermDesk: [-2.1, 0.05],
    readerDesk: [-0.7, 0.05],
    brownDoor: [-3.7, ROOM.cor],
    whiteDoor: [-1.0, ROOM.cor],
    hooks: [-3.0, 1.75, ROOM.cor],
    clock: [-2.75, 2.45, ROOM.cor],
    sign: [-1.9, 1.9, ROOM.cor]
  };

  function quadUV(b, a, bb, c, d, col, rep) {
    const r = rep || [1, 1];
    b.quad(a, bb, c, d, col, [[0, 0], [r[0], 0], [r[0], r[1]], [0, r[1]]]);
  }

  function cube(b, x, y, z, sx, sy, sz, col, faces) {
    b.push(M4.translate(x, y, z));
    b.box(sx, sy, sz, col, { base: true, faces });
    b.pop();
  }

  function part(r, fn, texture, opts) {
    return { mesh: mesh(r, fn), texture: texture || null, opts: opts || {} };
  }

  function drawPart(r, p, model, extra) {
    const o = Object.assign({}, p.opts, extra || {});
    if (p.texture) o.texture = p.texture;
    r.draw(p.mesh, model || null, o);
  }

  function grain(ctx, w, h, base, dark, light, seed, vertical) {
    const g = rand(seed);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const p = g() * (vertical ? w : h);
      ctx.strokeStyle = g() < 0.55 ? dark : light;
      ctx.globalAlpha = 0.12 + g() * 0.22;
      ctx.lineWidth = 0.6 + g() * 2.2;
      ctx.beginPath();
      const amp = 2 + g() * 5, ph = g() * 6;
      for (let s = 0; s <= 24; s++) {
        const q = (s / 24) * (vertical ? h : w);
        const o = p + S(q * 0.05 + ph) * amp;
        if (vertical) { if (s) ctx.lineTo(o, q); else ctx.moveTo(o, q); } else { if (s) ctx.lineTo(q, o); else ctx.moveTo(q, o); }
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function textures(r) {
    const t = (size, fn, opts) => r.texture(size, fn, opts || {});
    return {
      wall: t(256, K.noiseTex('#ece2c6', 11, 0.05, 0.25)),
      ceiling: t(128, K.noiseTex('#f1ece0', 12, 0.03, 0.2)),
      floor: t(256, (ctx, w, h) => {
        K.noiseTex('#7c6a58', 13, 0.12, 0.6)(ctx, w, h);
        const g = rand(14);
        for (let i = 0; i < 40; i++) {
          ctx.fillStyle = `rgba(${g() < 0.5 ? '40,30,22' : '150,132,110'},${0.06 + g() * 0.08})`;
          ctx.beginPath();
          ctx.ellipse(g() * w, g() * h, 6 + g() * 22, 3 + g() * 8, g() * PI, 0, PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(40,30,22,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      }),
      veneer: t(256, (ctx, w, h) => grain(ctx, w, h, '#b9733a', '#7a4318', '#d89558', 15, true)),
      door: t(256, (ctx, w, h) => grain(ctx, w, h, '#c08850', '#80532a', '#dcae78', 16, true)),
      desk: t(128, (ctx, w, h) => grain(ctx, w, h, '#dcc89e', '#b49a70', '#efe0bc', 17, false)),
      board: t(256, (ctx, w, h) => {
        ctx.fillStyle = '#2e4537';
        ctx.fillRect(0, 0, w, h);
        const g = rand(18);
        for (let i = 0; i < 26; i++) {
          ctx.fillStyle = `rgba(220,230,220,${0.03 + g() * 0.06})`;
          ctx.beginPath();
          ctx.ellipse(g() * w, g() * h, 20 + g() * 60, 8 + g() * 20, (g() - 0.5) * 0.6, 0, PI * 2);
          ctx.fill();
        }
      }),
      clock: t(128, (ctx, w, h) => {
        ctx.fillStyle = '#bfc2c4';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#f6f4ee';
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, w * 0.43, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222';
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * PI * 2;
          const r0 = i % 3 ? 0.36 : 0.32;
          ctx.save();
          ctx.translate(w / 2 + S(a) * w * 0.39, h / 2 - C(a) * h * 0.39);
          ctx.rotate(a);
          ctx.fillRect(-w * (i % 3 ? 0.008 : 0.016), -w * 0.03, w * (i % 3 ? 0.016 : 0.032), w * (0.43 - r0) * 0.9);
          ctx.restore();
        }
        const hand = (a, len, wd) => {
          ctx.save();
          ctx.translate(w / 2, h / 2);
          ctx.rotate(a);
          ctx.fillRect(-wd / 2, -len, wd, len + w * 0.04);
          ctx.restore();
        };
        hand((7.75 / 12) * PI * 2, w * 0.22, w * 0.035);
        hand((45 / 60) * PI * 2, w * 0.33, w * 0.022);
        ctx.fillStyle = '#b22';
        hand((20 / 60) * PI * 2, w * 0.35, w * 0.008);
      }),
      sign: t(64, (ctx, w, h) => {
        ctx.fillStyle = '#d4242a';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.18);
        ctx.quadraticCurveTo(w * 0.78, h * 0.5, w * 0.62, h * 0.82);
        ctx.lineTo(w * 0.38, h * 0.82);
        ctx.quadraticCurveTo(w * 0.22, h * 0.5, w * 0.5, h * 0.18);
        ctx.fill();
        ctx.fillStyle = '#d4242a';
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h * 0.66, w * 0.08, h * 0.13, 0, 0, PI * 2);
        ctx.fill();
      }),
      outside: t(128, (ctx, w, h) => {
        const gr = ctx.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, '#e9edee');
        gr.addColorStop(0.55, '#cdd5d8');
        gr.addColorStop(1, '#a7b0b0');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, w, h);
        const g = rand(19);
        for (let i = 0; i < 18; i++) {
          ctx.fillStyle = `rgba(120,128,126,${0.08 + g() * 0.1})`;
          ctx.fillRect(g() * w, h * (0.55 + g() * 0.45), 6 + g() * 20, h);
        }
      }),
      leaf: t(64, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        const g = rand(20);
        for (let i = 0; i < 9; i++) {
          const a = -PI / 2 + (g() - 0.5) * 2.4;
          const len = h * (0.35 + g() * 0.15);
          ctx.save();
          ctx.translate(w / 2, h * 0.95);
          ctx.rotate(a + PI / 2);
          ctx.fillStyle = g() < 0.5 ? '#3f6e2c' : '#2f5a22';
          ctx.beginPath();
          ctx.ellipse(0, -len / 2, w * 0.06, len / 2, 0, 0, PI * 2);
          ctx.fill();
          ctx.restore();
        }
      })
    };
  }

  function buildShell(r, T) {
    const { rear, front, win, cor, h } = ROOM;
    return {
      floor: part(r, b => quadUV(b, [rear, 0, cor], [front, 0, cor], [front, 0, win], [rear, 0, win], LIT, [(front - rear) / 1.6, (cor - win) / 1.6]), T.floor),
      ceiling: part(r, b => quadUV(b, [rear, h, win], [front, h, win], [front, h, cor], [rear, h, cor], LIT, [4, 3]), T.ceiling),
      walls: part(r, b => {
        const rep = (len) => [len / 1.4, h / 1.4];
        quadUV(b, [rear, 0, cor], [rear, 0, win], [rear, h, win], [rear, h, cor], LIT, rep(cor - win));
        quadUV(b, [front, 0, win], [front, 0, cor], [front, h, cor], [front, h, win], LIT, rep(cor - win));
        quadUV(b, [rear, 0, win], [front, 0, win], [front, h, win], [rear, h, win], LIT, rep(front - rear));
        quadUV(b, [front, 0, cor], [rear, 0, cor], [rear, h, cor], [front, h, cor], LIT, rep(front - rear));
      }, T.wall),
      trim: part(r, b => {
        const base = 0x5a4434;
        cube(b, rear + 0.01, 0, 0, 0.02, 0.08, cor - win, base);
        cube(b, front - 0.01, 0, 0, 0.02, 0.08, cor - win, base);
        cube(b, 0, 0, cor - 0.01, front - rear, 0.08, 0.02, base);
        cube(b, 0, 0, win + 0.01, front - rear, 0.08, 0.02, base);
      }),
      lamps: part(r, b => {
        [-2.6, 0, 2.6].forEach(x => [-1.4, 1.4].forEach(z => {
          cube(b, x, h - 0.04, z, 0.64, 0.04, 0.64, 0xd8d8d4);
          b.quad([x - 0.29, h - 0.045, z + 0.29], [x + 0.29, h - 0.045, z + 0.29], [x + 0.29, h - 0.045, z - 0.29], [x - 0.29, h - 0.045, z - 0.29], [1, 0.99, 0.94, 1]);
        }));
      })
    };
  }

  function buildWindows(r, T) {
    const { win } = ROOM;
    const W = 1.6, y0 = 0.9, y1 = 2.65;
    return {
      glass: part(r, b => WINDOWS.forEach(x => quadUV(b, [x - W / 2, y0, win + 0.012], [x + W / 2, y0, win + 0.012], [x + W / 2, y1, win + 0.012], [x - W / 2, y1, win + 0.012], [1, 1, 1, 0.85]))),
      frames: part(r, b => {
        const white = 0xf2f0ea;
        WINDOWS.forEach(x => {
          cube(b, x, y0 - 0.05, win + 0.05, W + 0.16, 0.05, 0.1, white);
          cube(b, x, y1, win + 0.04, W + 0.16, 0.07, 0.08, white);
          [-1, 1].forEach(s => cube(b, x + s * (W / 2 + 0.04), y0 - 0.02, win + 0.04, 0.08, y1 - y0 + 0.08, 0.08, white));
          [-1, 1].forEach(s => cube(b, x + s * W / 6, y0, win + 0.035, 0.06, y1 - y0, 0.07, white));
          cube(b, x, 2.12, win + 0.035, W, 0.05, 0.07, white);
          cube(b, x, y0 - 0.08, win + 0.13, W + 0.3, 0.035, 0.26, 0xf6f4ee);
          const yc = (y0 + y1) / 2;
          const clip = (p, q) => {
            let t0 = 0, t1 = 1;
            const d = [q[0] - p[0], q[1] - p[1]];
            [[-d[0], p[0] - (x - W / 2)], [d[0], (x + W / 2) - p[0]], [-d[1], p[1] - y0], [d[1], y1 - p[1]]].forEach(([pp, qq]) => {
              if (Math.abs(pp) < 1e-9) { if (qq < 0) t1 = -1; return; }
              const tt = qq / pp;
              if (pp < 0) t0 = Math.max(t0, tt); else t1 = Math.min(t1, tt);
            });
            return t1 > t0 ? [[p[0] + d[0] * t0, p[1] + d[1] * t0], [p[0] + d[0] * t1, p[1] + d[1] * t1]] : null;
          };
          for (let i = -9; i <= 9; i++) {
            [1, -1].forEach(dir => {
              const c = i * 0.21;
              const seg = clip([x - 2, yc + c - dir * 2], [x + 2, yc + c + dir * 2]);
              if (seg) tube(b, [[seg[0][0], seg[0][1], win + 0.06], [seg[1][0], seg[1][1], win + 0.06]], [0.008, 0.008], 4, 0xf4f2ee);
            });
          }
        });
      }),
      radiators: part(r, b => WINDOWS.forEach(x => {
        for (let i = 0; i < 9; i++) cube(b, x - 0.48 + i * 0.12, 0.2, win + 0.12, 0.07, 0.5, 0.1, 0xe8e4da);
        tube(b, [[x - 0.7, 0.3, win + 0.12], [x + 0.6, 0.3, win + 0.12]], [0.018, 0.018], 6, 0xe0dcd2);
      }))
    };
  }

  function buildPlant(b, x, y, z, s, seed) {
    const g = rand(seed);
    b.push(M4.translate(x, y, z));
    b.prism(8, 0.07 * s, 0.07 * s, 0, 0.09 * s, 0.09 * s, 0.13 * s, g() < 0.5 ? 0xb8643a : 0xe6e2da, { capBottom: true });
    b.at(0, 0.125 * s, 0, h => h.disc(0.085 * s, 8, 0x3a2a1c));
    const n = 5 + Math.floor(g() * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2 + g();
      const lean = 0.25 + g() * 0.5;
      const hgt = (0.3 + g() * 0.25) * s;
      b.push(M4.translate(0, 0.12 * s, 0), M4.rotY(a), M4.rotX(lean));
      b.quad([-0.13 * s, 0, 0], [0.13 * s, 0, 0], [0.13 * s, hgt, 0], [-0.13 * s, hgt, 0], [0.75, 0.85, 0.65, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      b.pop();
    }
    b.pop();
  }

  function buildFurniture(r, T) {
    const { rear, cor, win, front } = ROOM;
    return {
      cabinets: part(r, b => {
        cube(b, rear + 0.31, 0, -2.35, 0.62, 2.25, 1.3, LIT);
        cube(b, rear + 0.225, 0, 0.45, 0.45, 1.6, 4.0, LIT);
      }, T.veneer),
      cabinetLines: part(r, b => {
        const dark = 0x5a3216;
        cube(b, rear + 0.625, 0.02, -2.35, 0.012, 2.2, 0.012, dark);
        [-2.95, -1.75].forEach(z => cube(b, rear + 0.625, 0.02, z + (z < -2 ? 0.01 : -0.01), 0.012, 2.2, 0.012, dark));
        cube(b, rear + 0.625, 2.24, -2.35, 0.012, 0.012, 1.3, dark);
        for (let i = 0; i <= 8; i++) cube(b, rear + 0.455, 0.02, -1.55 + i * 0.5, 0.012, 1.56, 0.012, dark);
        cube(b, rear + 0.455, 1.58, 0.45, 0.012, 0.014, 4.0, dark);
        [-2.47, -2.23].forEach(z => cube(b, rear + 0.64, 1.0, z, 0.03, 0.12, 0.02, 0xc8c8c4));
        for (let i = 0; i < 8; i++) cube(b, rear + 0.47, 1.25, -1.55 + i * 0.5 + 0.4, 0.03, 0.08, 0.02, 0xc8c8c4);
      }),
      plantsTop: part(r, b => {
        buildPlant(b, rear + 0.3, 2.25, -2.7, 1.2, 31);
        buildPlant(b, rear + 0.35, 2.25, -2.05, 1.0, 32);
      }, T.leaf),
      plantsSill: part(r, b => {
        let seed = 40;
        WINDOWS.forEach(x => [-0.55, -0.1, 0.45].forEach(o => buildPlant(b, x + o, 0.85, win + 0.14, 0.9 + ((seed * 7) % 5) * 0.08, seed++)));
      }, T.leaf),
      brownDoor: part(r, b => {
        const x = SPOTS.brownDoor[0];
        cube(b, x, 0, cor - 0.025, 0.9, 2.05, 0.03, LIT);
      }, T.door),
      doorTrim: part(r, b => {
        const white = 0xefece4;
        const bx = SPOTS.brownDoor[0];
        [-1, 1].forEach(s => cube(b, bx + s * 0.49, 0, cor - 0.03, 0.08, 2.12, 0.05, white));
        cube(b, bx, 2.08, cor - 0.03, 1.06, 0.08, 0.05, white);
        cube(b, bx + 0.34, 1.0, cor - 0.06, 0.14, 0.03, 0.06, 0xbcbcb8);
        const wx = SPOTS.whiteDoor[0];
        cube(b, wx, 0, cor - 0.025, 0.92, 2.05, 0.03, 0xf3f1ec);
        [-1, 1].forEach(s => cube(b, wx + s * 0.5, 0, cor - 0.03, 0.08, 2.12, 0.05, white));
        cube(b, wx, 2.08, cor - 0.03, 1.08, 0.08, 0.05, white);
        cube(b, wx + 0.36, 1.0, cor - 0.06, 0.14, 0.03, 0.06, 0x9a9a98);
        [[0.62, 0.55], [0.62, 1.35]].forEach(([hh, y]) => cube(b, wx, y, cor - 0.045, 0.7, hh, 0.012, 0xe6e3dc));
        const [hx, hy] = SPOTS.hooks;
        cube(b, hx, hy - 0.03, cor - 0.02, 0.36, 0.06, 0.03, 0x8a6a48);
        [-0.12, -0.04, 0.04, 0.12].forEach((dx, i) => {
          tube(b, [[hx + dx, hy, cor - 0.035], [hx + dx, hy + 0.02, cor - 0.09]], [0.008, 0.006], 4, 0x9a9a98);
          if (i % 2 === 0) tube(b, [[hx + dx, hy + 0.02, cor - 0.07], [hx + dx - 0.004, hy - 0.04, cor - 0.075], [hx + dx - 0.2, hy - 0.2, cor - 0.08], [hx + dx + 0.2, hy - 0.2, cor - 0.08], [hx + dx - 0.004, hy - 0.04, cor - 0.075]], [0.004, 0.004, 0.004, 0.004, 0.004], 3, 0x9c9c9a);
        });
      }),
      board: part(r, b => quadUV(b, [front - 0.02, 0.85, -1.8], [front - 0.02, 0.85, 1.8], [front - 0.02, 2.1, 1.8], [front - 0.02, 2.1, -1.8], LIT), T.board),
      boardFrame: part(r, b => {
        const wood = 0x8a5a30;
        cube(b, front - 0.03, 0.8, 0, 0.06, 0.05, 3.7, wood);
        cube(b, front - 0.03, 2.1, 0, 0.06, 0.05, 3.7, wood);
        cube(b, front - 0.08, 0.82, 0, 0.12, 0.025, 3.6, wood);
        cube(b, 3.3, 0, -0.5, 0.7, 0.76, 1.3, 0x9a6a3e);
      }),
      clock: part(r, b => {
        const [x, y, z] = SPOTS.clock;
        b.push(M4.translate(x, y, z - 0.03), M4.rotY(PI));
        K.discXY(b, 0, 0, 0, 0.165, 24, LIT);
        b.pop();
      }, T.clock),
      clockRim: part(r, b => {
        const [x, y, z] = SPOTS.clock;
        const pts = [];
        for (let i = 0; i <= 24; i++) pts.push([x + S((i / 24) * PI * 2) * 0.165, y + C((i / 24) * PI * 2) * 0.165, z - 0.03]);
        tube(b, pts, pts.map(() => 0.014), 5, 0xa8aaac);
      }),
      sign: part(r, b => {
        const [x, y, z] = SPOTS.sign;
        quadUV(b, [x + 0.07, y - 0.05, z - 0.012], [x - 0.07, y - 0.05, z - 0.012], [x - 0.07, y + 0.05, z - 0.012], [x + 0.07, y + 0.05, z - 0.012], [1, 1, 1, 0.35]);
      }, T.sign)
    };
  }

  function buildDesk(r, T) {
    return {
      top: part(r, b => cube(b, 0, 0.73, 0, 0.52, 0.03, 1.2, LIT), T.desk),
      frame: part(r, b => {
        const metal = 0x8c8478;
        [-1, 1].forEach(s => {
          cube(b, -0.18, 0, s * 0.54, 0.04, 0.73, 0.04, metal);
          cube(b, 0.18, 0, s * 0.54, 0.04, 0.73, 0.04, metal);
          cube(b, 0, 0.08, s * 0.54, 0.4, 0.035, 0.035, metal);
        });
        cube(b, 0.2, 0.42, 0, 0.02, 0.3, 1.12, 0xc4b08a);
        cube(b, -0.02, 0.6, 0, 0.4, 0.015, 1.12, 0xa89670);
      }),
      chair: part(r, b => {
        const metal = 0x7a7268, wood = 0xc8a874;
        cube(b, 0, 0.43, 0, 0.4, 0.025, 0.4, wood);
        cube(b, -0.19, 0.55, 0, 0.02, 0.25, 0.38, wood);
        [[-0.17, -0.17], [-0.17, 0.17], [0.17, -0.17], [0.17, 0.17]].forEach(([x, z]) => cube(b, x, 0, z, 0.025, 0.43, 0.025, metal));
        [-0.17, 0.17].forEach(z => cube(b, -0.19, 0.43, z, 0.02, 0.38, 0.02, metal));
      })
    };
  }

  function build(r) {
    const T = textures(r);
    return Object.assign({ T, desk: buildDesk(r, T) }, buildShell(r, T), buildWindows(r, T), buildFurniture(r, T));
  }

  function deskPlaces() {
    const out = [];
    ROWS.forEach(z => COLS.forEach(x => out.push({ x, z })));
    return out;
  }

  const PLACES = deskPlaces();

  function chairM(x, z, o) {
    const off = o || {};
    return M4.chain(M4.translate(x + (off.dx || 0), 0, z + (off.dz || 0)), M4.rotY(off.ry || 0));
  }

  function draw(r, W, st) {
    const s = st || {};
    drawPart(r, W.floor);
    drawPart(r, W.ceiling);
    drawPart(r, W.walls);
    drawPart(r, W.trim);
    drawPart(r, W.lamps);
    drawPart(r, W.glass, null, { texture: W.T.outside });
    drawPart(r, W.frames);
    drawPart(r, W.radiators);
    drawPart(r, W.cabinets);
    drawPart(r, W.cabinetLines);
    drawPart(r, W.brownDoor);
    drawPart(r, W.doorTrim);
    drawPart(r, W.board);
    drawPart(r, W.boardFrame);
    drawPart(r, W.clock);
    drawPart(r, W.clockRim);
    drawPart(r, W.sign);
    const chairs = s.chairs || {};
    PLACES.forEach((p, i) => {
      const dm = M4.translate(p.x, 0, p.z);
      drawPart(r, W.desk.top, dm);
      drawPart(r, W.desk.frame, dm);
      [-0.3, 0.3].forEach((dz, k) => {
        const key = i * 2 + k;
        drawPart(r, W.desk.chair, chairM(p.x - 0.5, p.z + dz, chairs[key]));
      });
    });
    drawPart(r, W.plantsTop);
    drawPart(r, W.plantsSill);
  }

  function seatOf(row, col, side) {
    return [COLS[col] - 0.5, 0.45, ROWS[row] + (side < 0 ? -0.3 : 0.3)];
  }

  window.HogwSet = { ROOM, SPOTS, ROWS, COLS, WINDOWS, build, draw, seatOf };
})();
