(function () {
  const { M4, V3, Builder, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, spherePatch, tube, mesh, noiseTex, discXY } = K;

  function texQuilt(ctx, w, h) {
    const n = 4;
    const cw = w / n;
    ctx.fillStyle = '#b4b4b4';
    ctx.fillRect(0, 0, w, h);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const x = i * cw, y = j * cw;
        const g = ctx.createRadialGradient(x + cw * 0.42, y + cw * 0.38, cw * 0.05, x + cw / 2, y + cw / 2, cw * 0.62);
        g.addColorStop(0, '#f6f6f6');
        g.addColorStop(0.55, '#e6e6e6');
        g.addColorStop(1, '#b8b8b8');
        ctx.fillStyle = g;
        ctx.fillRect(x + 1, y + 1, cw - 2, cw - 2);
      }
    }
    ctx.fillStyle = '#9a9a9a';
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      ctx.beginPath();
      ctx.arc(i * cw, j * cw, 2.5, 0, PI * 2);
      ctx.fill();
    }
  }

  function texWood(base, dark) {
    return (ctx, w, h) => {
      const g = rand(19);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = dark;
      for (let i = 0; i < 30; i++) {
        ctx.globalAlpha = 0.25 + g() * 0.3;
        ctx.lineWidth = 1 + g() * 2;
        const y = g() * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.3, y + (g() - 0.5) * 8, w * 0.6, y + (g() - 0.5) * 8, w, y + (g() - 0.5) * 4);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
  }

  function texCork(ctx, w, h) {
    const g = rand(23);
    ctx.fillStyle = '#c98f55';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < w * h * 0.4; i++) {
      ctx.fillStyle = ['#b27842', '#d9a26a', '#a86c3a', '#e2b07a'][Math.floor(g() * 4)];
      ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 1 + Math.floor(g() * 2), 1 + Math.floor(g() * 2));
    }
  }

  function texChalk(ctx, w, h) {
    const g = rand(29);
    ctx.fillStyle = '#2e4a3a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(230,240,230,0.18)';
    for (let i = 0; i < 40; i++) {
      ctx.lineWidth = 1 + g() * 3;
      ctx.beginPath();
      const x = g() * w, y = g() * h;
      ctx.moveTo(x, y);
      ctx.lineTo(x + (g() - 0.5) * 60, y + (g() - 0.5) * 12);
      ctx.stroke();
    }
  }

  function texWindow(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#f6fbff');
    g.addColorStop(1, '#cfe6f2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8e2d6';
    ctx.fillRect(0, h * 0.48, w, 4);
    ctx.fillRect(w * 0.48, 0, 4, h);
    ctx.fillStyle = 'rgba(160,200,150,0.5)';
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
  }

  function texTiles(a, b) {
    return (ctx, w, h) => {
      const n = 4;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        ctx.fillStyle = (i + j) % 2 ? a : b;
        ctx.fillRect((i * w) / n, (j * h) / n, w / n, h / n);
      }
    };
  }

  function texSnow(ctx, w, h) {
    const g = rand(31);
    ctx.fillStyle = '#dfe6f0';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(180,196,220,0.5)' : 'rgba(255,255,255,0.8)';
      ctx.fillRect(g() * w, g() * h, 2 + g() * 4, 1 + g() * 2);
    }
  }

  function texStone(base, line) {
    return (ctx, w, h) => {
      const g = rand(37);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = line;
      ctx.lineWidth = 2;
      const rows = 4;
      for (let j = 0; j < rows; j++) {
        const y = (j * h) / rows;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        for (let i = 0; i < 3; i++) {
          const x = ((i + (j % 2) * 0.5) * w) / 3;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + h / rows);
          ctx.stroke();
        }
      }
      for (let i = 0; i < 300; i++) {
        ctx.fillStyle = g() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)';
        ctx.fillRect(g() * w, g() * h, 2, 2);
      }
    };
  }

  function texWindows(ctx, w, h) {
    const g = rand(43);
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 0, w, h);
    for (let j = 0; j < 6; j++) for (let i = 0; i < 4; i++) {
      ctx.fillStyle = g() < 0.55 ? ['#ffcf7a', '#ffe3a8', '#ffb45a'][Math.floor(g() * 3)] : '#1a1a26';
      ctx.fillRect(i * (w / 4) + 5, j * (h / 6) + 4, w / 4 - 10, h / 6 - 8);
    }
  }

  function texStars(seed, density) {
    return (ctx, w, h) => {
      const g = rand(seed);
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#060a1c');
      bg.addColorStop(1, '#141c44');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < w * h * (density || 0.004); i++) {
        const b = g();
        ctx.fillStyle = b < 0.7 ? '#8fa6d8' : '#ffffff';
        const s = b > 0.97 ? 2 : 1;
        ctx.fillRect(g() * w, g() * h, s, s);
      }
      for (let i = 0; i < 5; i++) {
        const x = g() * w, y = g() * h;
        const r = ctx.createRadialGradient(x, y, 0, x, y, 40 + g() * 60);
        r.addColorStop(0, 'rgba(90,110,220,0.35)');
        r.addColorStop(1, 'rgba(90,110,220,0)');
        ctx.fillStyle = r;
        ctx.fillRect(0, 0, w, h);
      }
    };
  }

  function texGlow(ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, '#9a9a9a');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function texFire(ctx, w, h) {
    const g = ctx.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, '#ffe07a');
    g.addColorStop(0.4, '#ff8a1c');
    g.addColorStop(1, '#8a1c00');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function makeTextures(r) {
    const tx = (size, fn, opts) => r.texture(size, fn, opts);
    return {
      quilt: tx(128, texQuilt),
      wood: tx(128, texWood('#9a6a3a', '#5a3a1a')),
      desk: tx(128, texWood('#7b8a52', '#4a5a2a')),
      floorWood: tx(128, texWood('#a57a4a', '#6a4a26')),
      cork: tx(128, texCork),
      chalk: tx(128, texChalk),
      window: tx(64, texWindow),
      tiles: tx(64, texTiles('#d8d8d4', '#c6c6c2')),
      snow: tx(128, texSnow),
      cobble: tx(128, texStone('#5a5a66', '#3a3a44')),
      brick: tx(128, texStone('#6a5a52', '#3a2e2a')),
      metal: tx(128, noiseTex('#6a7488', 7, 0.16)),
      windows: tx(64, texWindows),
      stars: tx(256, texStars(51, 0.006)),
      nebula: tx(256, texStars(52, 0.003)),
      glow: tx(64, texGlow, { clamp: true }),
      fire: tx(32, texFire, { clamp: true })
    };
  }

  function quadXY(b, x0, y0, x1, y1, z, col, uv) {
    const n = [0, 0, 1];
    b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, uv || [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
  }

  function buildRoom(r) {
    return {
      shell: mesh(r, b => {
        const W = [1, 1, 1, 0];
        const t = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
        b.quad([-4, 0, -2.4], [4, 0, -2.4], [4, 3.2, -2.4], [-4, 3.2, -2.4], W, t(0, 0, 3.2, 1.28), [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        b.quad([-4, 0, 3], [-4, 0, -2.4], [-4, 3.2, -2.4], [-4, 3.2, 3], W, t(0, 0, 2.16, 1.28), [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]);
        b.quad([4, 0, -2.4], [4, 0, 3], [4, 3.2, 3], [4, 3.2, -2.4], W, t(0, 0, 2.16, 1.28), [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0]]);
      }),
      floor: mesh(r, b => b.quad([-4, 0, 3], [4, 0, 3], [4, 0, -2.4], [-4, 0, -2.4], [0.78, 0.78, 0.78, 0])),
      desk: mesh(r, b => {
        b.at(0, 0.72, 0.42, h => h.box(1.9, 0.05, 0.62, [1, 1, 1, 0]));
        b.at(0, 0.36, 0.72, h => h.box(1.9, 0.72, 0.03, [0.85, 0.85, 0.85, 0]));
      }),
      tv: mesh(r, b => {
        b.at(-1.2, 1.55, -2.34, h => h.box(1.25, 0.82, 0.08, 0x1a1a1e));
      }),
      screen: mesh(r, b => quadXY(b, -1.78, 1.19, -0.62, 1.91, -2.29, [1, 1, 1, 1]))
    };
  }

  function buildClass(r) {
    return {
      room: mesh(r, b => {
        const n = [0, 0, 1];
        b.quad([-5, 0, -4], [5, 0, -4], [5, 3.2, -4], [-5, 3.2, -4], [0.95, 0.95, 0.93, 0], null, [n, n, n, n]);
        b.quad([-5, 0, 7], [5, 0, 7], [5, 3.2, 7], [-5, 3.2, 7], [0.95, 0.95, 0.93, 0], null, [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
        b.quad([-5, 0, 7], [5, 0, 7], [5, 0, -4], [-5, 0, -4], [0.85, 0.82, 0.78, 0], [[0, 0], [5, 0], [5, 5], [0, 5]]);
        b.quad([-5, 3.2, 7], [5, 3.2, 7], [5, 3.2, -4], [-5, 3.2, -4], [0.95, 0.95, 0.94, 0]);
        b.quad([-5, 0, 7], [-5, 0, -4], [-5, 3.2, -4], [-5, 3.2, 7], [0.95, 0.95, 0.93, 0]);
        b.quad([5, 0, -4], [5, 0, 7], [5, 3.2, 7], [5, 3.2, -4], [0.95, 0.95, 0.93, 0]);
        b.at(0, 1.1, 6.95, h => h.box(4.4, 1.3, 0.06, [0.2, 0.36, 0.26, 0]));
        b.at(0, 0.45, 6.95, h => h.box(4.6, 0.06, 0.12, [0.7, 0.62, 0.5, 0]));
      }),
      windows: mesh(r, b => {
        for (let i = 0; i < 5; i++) {
          const z = 6.2 - i * 2.2;
          b.quad([4.95, 1.0, z], [4.95, 1.0, z - 1.6], [4.95, 2.7, z - 1.6], [4.95, 2.7, z], [1, 1, 1, 1]);
          b.quad([-4.95, 1.0, z - 1.6], [-4.95, 1.0, z], [-4.95, 2.7, z], [-4.95, 2.7, z - 1.6], [1, 1, 1, 1]);
        }
      }),
      board: mesh(r, b => quadXY(b, -2.2, 1.0, 2.2, 2.4, -3.88, [1, 1, 1, 0], [[0, 0], [3, 0], [3, 1], [0, 1]])),
      lamps: mesh(r, b => {
        for (let i = 0; i < 3; i++) for (let j = -1; j <= 1; j += 2) b.at(j * 1.8, 3.15, 3 - i * 2.6, h => h.box(0.3, 0.06, 1.3, [1, 1, 0.96, 1]));
      }),
      desks: mesh(r, b => {
        for (let row = 0; row < 4; row++) for (let col = -2; col <= 2; col++) {
          const x = col * 1.5, z = 0.6 + row * 1.25;
          b.at(x, 0.7, z, h => h.box(0.75, 0.04, 0.5, [0.72, 0.52, 0.32, 0]));
          [[-0.33, -0.2], [0.33, -0.2], [-0.33, 0.2], [0.33, 0.2]].forEach(([dx, dz]) => b.at(x + dx, 0, z + dz, h => h.box(0.03, 0.7, 0.03, 0x6a6a70, { base: true })));
          b.at(x, 0.42, z + 0.45, h => h.box(0.4, 0.04, 0.38, [0.62, 0.44, 0.28, 0]));
          b.at(x, 0.65, z + 0.63, h => h.box(0.4, 0.42, 0.03, [0.62, 0.44, 0.28, 0]));
        }
      }),
      teacher: mesh(r, b => {
        b.at(0, 0.78, -0.2, h => h.box(1.8, 0.06, 0.8, [1, 1, 1, 0]));
        b.at(0, 0.39, 0.18, h => h.box(1.8, 0.78, 0.04, [0.88, 0.94, 0.8, 0]));
      })
    };
  }

  function buildBoard(r) {
    return {
      frame: mesh(r, b => {
        b.at(0, 0, -0.04, h => h.box(3.1, 2.1, 0.06, 0x3a2414));
      }),
      cork: mesh(r, b => quadXY(b, -1.45, -0.95, 1.45, 0.95, 0.0, [1, 1, 1, 0], [[0, 0], [3, 0], [3, 2], [0, 2]])),
      paper: mesh(r, b => quadXY(b, -0.5, -0.5, 0.5, 0.5, 0, [1, 1, 1, 1])),
      pin: mesh(r, b => b.ellipsoid(0.03, 0.03, 0.02, 6, 4, [0.85, 0.1, 0.1, 0.3]))
    };
  }

  function arenaSnow(r) {
    return mesh(r, b => {
      const g = rand(61);
      for (let x = -20; x < 20; x += 4) for (let z = -24; z < 12; z += 4) b.quad([x, 0, z + 4], [x + 4, 0, z + 4], [x + 4, 0, z], [x, 0, z], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      for (let i = 0; i < 18; i++) {
        const x = -18 + i * 2.1 + g(), z = -14 - g() * 6;
        b.at(x, 0, z, h => h.prism(5, 1.2 + g() * 1.5, 1.0 + g(), 0, 0.2, 0.2, 2 + g() * 4, [0.86, 0.9, 0.96, 0]));
      }
      for (let i = 0; i < 12; i++) b.at(-10 + i * 1.8, 0, -7.5, h => h.box(0.12, 0.9, 0.12, 0x3a3a44, { base: true }));
      b.at(0, 0.8, -7.5, h => h.box(22, 0.08, 0.08, 0x3a3a44));
      b.at(0, 0.45, -7.5, h => h.box(22, 0.06, 0.06, 0x3a3a44));
    });
  }

  function arenaYard(r) {
    return mesh(r, b => {
      const g = rand(67);
      for (let x = -20; x < 20; x += 4) for (let z = -24; z < 12; z += 4) b.quad([x, 0, z + 4], [x + 4, 0, z + 4], [x + 4, 0, z], [x, 0, z], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      for (let i = 0; i < 6; i++) b.at(-14 + i * 5.5, 0, -13 - g() * 3, h => h.box(3 + g() * 2, 3 + g() * 5, 2, [0.3, 0.3, 0.36, 0], { base: true }));
      b.at(-9, 0, -9, h => { h.prism(6, 0.4, 0.4, 0, 0.3, 0.3, 7, 0x3a3a44); });
      b.at(-9, 7, -9, h => { h.push(M4.rotZ(-0.9)); h.box(0.25, 6, 0.25, 0x4a4a54); h.pop(); });
      for (let i = 0; i < 5; i++) b.at(-6 + i * 3, 0, -10, h => h.box(1.2 + g(), 0.6 + g() * 0.8, 1, [0.36, 0.36, 0.42, 0], { base: true }));
      for (let i = 0; i < 20; i++) b.at(-16 + g() * 32, 0.02, -4 - g() * 12, h => h.ellipsoid(0.8 + g(), 0.05, 0.5 + g() * 0.6, 6, 2, [0.9, 0.92, 0.98, 0]));
    });
  }

  function crystals(r) {
    return mesh(r, b => {
      const g = rand(71);
      [[-5, -9], [4, -10], [8, -8], [-9, -7], [1, -12]].forEach(([x, z]) => {
        for (let i = 0; i < 5; i++) {
          b.push(M4.translate(x + (g() - 0.5), 0, z + (g() - 0.5)), M4.rotZ((g() - 0.5) * 0.9), M4.rotX((g() - 0.5) * 0.5));
          b.prism(4, 0.25 + g() * 0.2, 0.18, 0, 0.02, 0.02, 1.4 + g() * 2.6, [1, 0.62, 0.16, 1], { topColor: [1, 0.9, 0.5, 1] });
          b.pop();
        }
      });
    });
  }

  function arenaStreet(r) {
    return mesh(r, b => {
      for (let x = -20; x < 20; x += 4) for (let z = -24; z < 12; z += 4) b.quad([x, 0, z + 4], [x + 4, 0, z + 4], [x + 4, 0, z], [x, 0, z], [1, 1, 1, 0], [[0, 0], [2, 0], [2, 2], [0, 2]]);
      [-1, 1].forEach(s => {
        for (let i = 0; i < 5; i++) {
          const z = -14 + i * 5;
          b.at(s * 9, 0, z, h => h.box(3, 9 + (i % 2) * 3, 4.4, [0.42, 0.36, 0.34, 0], { base: true }));
        }
      });
      b.at(0, 0, -18, h => h.box(20, 11, 3, [0.36, 0.32, 0.32, 0], { base: true }));
      for (let i = 0; i < 6; i++) b.at(-6 + i * 2.4, 0, -9, h => {
        h.prism(6, 0.05, 0.05, 0, 0.05, 0.05, 3.2, 0x22222a);
        h.at(0, 3.25, 0, l => l.ellipsoid(0.16, 0.12, 0.16, 6, 3, [1, 0.85, 0.5, 1]));
      });
    });
  }

  function arenaPlaza(r) {
    return mesh(r, b => {
      for (let x = -20; x < 20; x += 4) for (let z = -24; z < 12; z += 4) b.quad([x, 0, z + 4], [x + 4, 0, z + 4], [x + 4, 0, z], [x, 0, z], [1, 1, 1, 0], [[0, 0], [2, 0], [2, 2], [0, 2]]);
      for (let i = 0; i < 5; i++) b.at(-12 + i * 6, 0, -16, h => {
        h.box(5.5, 10 + (i % 2) * 2, 3, [0.76, 0.72, 0.64, 0], { base: true });
        for (let k = 0; k < 3; k++) h.at(-1.6 + k * 1.6, 5, 1.52, o => o.box(0.8, 1.6, 0.04, [0.3, 0.36, 0.5, 0]));
      });
      b.at(0, 0, -9, h => h.box(10, 0.4, 3, [0.7, 0.68, 0.62, 0], { base: true }));
    });
  }

  function arenaStation(r) {
    return mesh(r, b => {
      for (let x = -12; x < 12; x += 3) for (let z = -16; z < 8; z += 3) b.quad([x, 0, z + 3], [x + 3, 0, z + 3], [x + 3, 0, z], [x, 0, z], [0.45, 0.52, 0.66, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      [-1, 1].forEach(s => {
        b.quad([s * 7, 0, -16], [s * 7, 0, 8], [s * 7, 5, 8], [s * 7, 5, -16], [0.56, 0.62, 0.76, 0]);
        for (let i = 0; i < 6; i++) b.at(s * 6.9, 2.5, -14 + i * 4, h => h.box(0.1, 3.6, 0.3, [0.4, 0.75, 1, 1]));
      });
      b.quad([-7, 5, -16], [7, 5, -16], [7, 5, 8], [-7, 5, 8], [0.3, 0.34, 0.46, 0]);
      for (let i = 0; i < 8; i++) b.at(0, 4.95, -14 + i * 3, h => h.box(10, 0.05, 0.3, [0.6, 0.85, 1, 1]));
    });
  }

  function starDome(r) {
    return mesh(r, b => spherePatch(b, 40, 40, 40, -PI, PI, -PI / 2, PI / 2, 16, 10, [1, 1, 1, 1], [3, 2]));
  }

  function buildDoor(r) {
    return mesh(r, b => {
      const gold = [0.5, 0.45, 0.33, 0.03];
      const dark = [0.22, 0.17, 0.11, 0.02];
      [-1, 1].forEach(s => b.at(s * 0.62, 0, 0.12, h => {
        h.box(1.2, 3.8, 0.12, gold, { base: true });
        for (let k = 0; k < 4; k++) h.at(0, 0.6 + k * 0.85, 0.07, o => o.box(0.9, 0.06, 0.03, dark));
      }));
      b.at(0, 1.9, 0.2, h => h.box(0.05, 3.6, 0.05, dark));
      [-1, 1].forEach(s => {
        b.at(s * 1.6, 0, 0, h => h.box(0.5, 4.2, 0.6, gold, { base: true }));
        b.at(s * 1.05, 3.4, 0.05, h => { h.push(M4.rotZ(s * 0.6)); h.box(0.25, 1.4, 0.4, gold); h.pop(); });
      });
      b.at(0, 4.2, 0, h => h.box(3.8, 0.4, 0.6, gold));
      b.at(0, 3.6, 0.2, h => { h.push(M4.rotZ(PI / 4)); h.box(0.5, 0.5, 0.2, dark); h.pop(); });
      b.quad([-2.5, 0, 0.4], [2.5, 0, 0.4], [2.5, 0, 8], [-2.5, 0, 8], [0.6, 0.62, 0.64, 0.75]);
      for (let i = -3; i <= 3; i++) b.quad([i * 0.7 - 0.02, 0.005, 0.4], [i * 0.7 + 0.02, 0.005, 0.4], [i * 0.7 + 0.02, 0.005, 8], [i * 0.7 - 0.02, 0.005, 8], [0.8, 0.66, 0.36, 0.2]);
      for (let k = 1; k < 8; k++) b.quad([-2.5, 0.005, k - 0.02], [2.5, 0.005, k - 0.02], [2.5, 0.005, k + 0.02], [-2.5, 0.005, k + 0.02], [0.8, 0.66, 0.36, 0.2]);
      b.at(0, 0.45, 0.3, h => h.box(3.2, 0.1, 0.1, [0.4, 0.8, 1, 1]));
    });
  }

  function buildTunnel(r) {
    return mesh(r, b => {
      const n = 14;
      for (let j = 0; j < 12; j++) {
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
          const z0 = -j * 3, z1 = -(j + 1) * 3;
          const col = (i + j) % 3 === 0 ? [0.55, 0.85, 1, 1] : [0.1, 0.3, 0.8, 1];
          b.quad([C(a0) * 2, S(a0) * 2, z0], [C(a1) * 2, S(a1) * 2, z0], [C(a1) * 2, S(a1) * 2, z1], [C(a0) * 2, S(a0) * 2, z1], col);
        }
      }
    });
  }

  function buildCard(r) {
    return mesh(r, b => {
      quadXY(b, -0.5, -0.7, 0.5, 0.7, 0.012, [1, 1, 1, 1]);
      b.box(1.06, 1.46, 0.02, [0.86, 0.76, 0.5, 0.4]);
    });
  }

  function buildPlatform(r) {
    return mesh(r, b => {
      b.prism(24, 1.4, 1.4, -0.08, 1.4, 1.4, 0, [0.3, 0.42, 0.7, 0.6], { capTop: true });
      b.prism(24, 1.45, 1.45, -0.02, 1.45, 1.45, 0.005, [0.7, 0.85, 1, 1], { capTop: false });
      for (let i = 0; i < 3; i++) b.prism(24, 1.8 + i * 0.5, 1.8 + i * 0.5, -0.01, 1.82 + i * 0.5, 1.82 + i * 0.5, 0.0, [0.5, 0.7, 1, 1], { capTop: false });
    });
  }

  function buildEmoji(r, kind) {
    return mesh(r, b => {
      const y = [1, 0.8, 0.05, 0.3];
      if (kind === 'face') {
        spherePatch(b, 1.005, 1.005, 0.925, -0.95, 0.95, -0.9, 0.7, 10, 8, [1, 1, 1, 0.3], [1, 1]);
        return;
      }
      spherePatch(b, 1, 1, 0.92, -PI, PI, -PI / 2, PI / 2, 16, 12, y);
      if (kind === 'hands') {
        [-1, 1].forEach(s => b.at(s * 1.25, 0.1, 0.2, h => {
          h.ellipsoid(0.32, 0.3, 0.14, 8, 5, [1, 1, 1, 0.3]);
          for (let i = 0; i < 3; i++) h.at(s * 0.1 + (i - 1) * 0.14, 0.34, 0, f => f.ellipsoid(0.07, 0.16, 0.08, 6, 4, [1, 1, 1, 0.3]));
        }));
      }
    });
  }

  function buildPenguin(r) {
    return mesh(r, b => {
      b.ellipsoid(0.55, 0.75, 0.5, 12, 8, 0x1a1a22);
      b.at(0, -0.05, 0.3, h => h.ellipsoid(0.42, 0.6, 0.3, 10, 7, 0xf4f4f4));
      b.at(0, 0.75, 0, h => h.ellipsoid(0.42, 0.4, 0.4, 10, 7, 0x1a1a22));
      [-1, 1].forEach(s => b.at(s * 0.16, 0.82, 0.32, h => {
        h.ellipsoid(0.1, 0.1, 0.05, 6, 4, 0xffffff);
        h.at(0, 0, 0.04, e => e.ellipsoid(0.045, 0.05, 0.03, 5, 3, 0x0a0a0a));
      }));
      b.at(0, 0.66, 0.38, h => { h.push(M4.rotX(0.2)); h.prism(6, 0.14, 0.08, 0, 0.02, 0.02, 0.28, [1, 0.62, 0.1, 0.3]); h.pop(); });
      [-1, 1].forEach(s => b.at(s * 0.52, 0.1, 0, h => { h.push(M4.rotZ(s * 0.3)); h.ellipsoid(0.1, 0.45, 0.2, 6, 5, 0x1a1a22); h.pop(); }));
    });
  }

  function buildCat(r, color) {
    return mesh(r, b => {
      b.ellipsoid(0.7, 0.45, 0.45, 12, 8, color);
      b.at(0.72, 0.35, 0, h => h.ellipsoid(0.36, 0.33, 0.34, 10, 7, color));
      [-1, 1].forEach(s => b.at(0.78, 0.66, s * 0.17, h => { h.push(M4.rotX(-s * 0.2)); h.prism(3, 0.1, 0.1, 0, 0.01, 0.01, 0.2, color); h.pop(); }));
      [-1, 1].forEach(s => b.at(1.02, 0.45, s * 0.15, h => h.ellipsoid(0.04, 0.05, 0.03, 6, 4, 0x1a1a14)));
      b.at(1.08, 0.33, 0, h => h.ellipsoid(0.035, 0.025, 0.03, 5, 3, 0xe89a9a));
      [-1, 1].forEach(s => b.at(1.06, 0.26, s * 0.04, h => h.ellipsoid(0.012, 0.03, 0.03, 4, 3, 0x6a4a4a)));
      [[-0.45, -0.2], [-0.45, 0.2], [0.45, -0.2], [0.45, 0.2]].forEach(([x, z]) => b.at(x, -0.55, z, h => h.prism(6, 0.09, 0.09, 0, 0.1, 0.1, 0.3, color)));
      tube(b, [[-0.7, 0.1, 0], [-1.0, 0.3, 0], [-1.1, 0.7, 0.05]], [0.07, 0.06, 0.04], 5, color);
    });
  }

  function buildHorse(r) {
    return mesh(r, b => {
      const c = 0x5a3a26;
      b.ellipsoid(0.5, 0.55, 1.1, 10, 7, c);
      b.push(M4.translate(0, 0.55, 1.0), M4.rotX(-0.7));
      b.prism(8, 0.26, 0.3, 0, 0.18, 0.2, 0.9, c);
      b.pop();
      b.push(M4.translate(0, 1.15, 1.45), M4.rotX(0.9));
      b.ellipsoid(0.2, 0.55, 0.24, 8, 6, c);
      b.pop();
      [-1, 1].forEach(s => b.at(s * 0.1, 1.55, 1.25, h => h.prism(3, 0.05, 0.05, 0, 0.01, 0.01, 0.16, c)));
      [-1, 1].forEach(s => b.at(s * 0.17, 1.28, 1.6, h => h.ellipsoid(0.03, 0.04, 0.03, 5, 3, 0x0a0a0a)));
      b.at(0, 1.1, 1.2, h => h.box(0.06, 0.5, 0.5, 0x1a1210));
    });
  }

  function buildHorseHead(r) {
    return mesh(r, b => {
      const c = [0.36, 0.24, 0.16, 0];
      const dark = [0.08, 0.06, 0.05, 0];
      tube(b, [[0, 0, -0.1], [0, 0.45, 0.2], [0, 0.85, 0.42]], [0.3, 0.23, 0.18], 10, c);
      tube(b, [[0, 0.98, 0.42], [0, 0.8, 0.72], [0, 0.55, 0.98]], [0.19, 0.16, 0.12], 10, c);
      b.at(0, 0.82, 0.55, h => h.ellipsoid(0.15, 0.21, 0.2, 10, 7, c));
      b.at(0, 0.5, 1.02, h => h.ellipsoid(0.12, 0.12, 0.14, 8, 6, c));
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * 0.07, 1.06, 0.36), M4.rotX(-0.35));
        b.prism(4, 0.05, 0.03, 0, 0.008, 0.008, 0.17, c, { phase: PI / 4 });
        b.pop();
        b.at(s * 0.14, 0.86, 0.66, h => h.ellipsoid(0.03, 0.035, 0.03, 6, 4, dark));
        b.at(s * 0.07, 0.46, 1.13, h => h.ellipsoid(0.025, 0.02, 0.02, 5, 3, dark));
      });
      for (let i = 0; i < 8; i++) {
        const k = i / 7;
        b.push(M4.translate(0, 0.1 + k * 0.9, -0.2 + k * 0.52), M4.rotX(-0.5));
        b.box(0.05, 0.16, 0.1, dark);
        b.pop();
      }
      b.at(0, 1.02, 0.5, h => h.box(0.05, 0.1, 0.14, dark));
    });
  }

  function buildBird(r, color) {
    return mesh(r, b => {
      b.ellipsoid(0.35, 0.3, 0.5, 10, 7, color);
      b.at(0, 0.35, 0.35, h => h.ellipsoid(0.2, 0.2, 0.2, 8, 6, color));
      b.at(0, 0.34, 0.56, h => { h.push(M4.rotX(PI / 2)); h.prism(4, 0.05, 0.04, 0, 0.005, 0.005, 0.12, [0.95, 0.75, 0.2, 0.2]); h.pop(); });
      [-1, 1].forEach(s => b.at(s * 0.1, 0.4, 0.5, h => h.ellipsoid(0.03, 0.03, 0.02, 5, 3, 0xff7a2a)));
      [-1, 1].forEach(s => b.at(s * 0.1, -0.45, 0, h => h.prism(4, 0.02, 0.02, 0, 0.02, 0.02, 0.2, 0xd07a6a)));
    });
  }

  function buildExpress(r) {
    return mesh(r, b => {
      const silver = [0.78, 0.8, 0.86, 0.1];
      const gold = [0.9, 0.72, 0.36, 0.3];
      b.at(0, 1.2, 0, h => { h.push(M4.rotX(PI / 2)); h.prism(12, 0.9, 0.9, -2.2, 0.9, 0.9, 2.2, silver, { capTop: true, capBottom: true }); h.pop(); });
      b.at(0, 1.2, 2.2, h => h.ellipsoid(0.92, 0.92, 0.5, 12, 6, silver));
      b.at(0, 1.2, 2.66, h => h.ellipsoid(0.3, 0.3, 0.12, 8, 4, [1, 0.95, 0.7, 1]));
      [-1, 1].forEach(s2 => b.at(s2 * 0.92, 1.2, 0, h => h.box(0.04, 0.12, 4.2, gold)));
      b.at(0, 2.3, -1.2, h => h.prism(8, 0.25, 0.25, 0, 0.3, 0.3, 0.6, gold));
      b.at(0, 2.2, 0.6, h => h.box(1.2, 0.5, 2.2, [0.3, 0.32, 0.42, 0.05]));
      for (let i = 0; i < 4; i++) [-1, 1].forEach(s2 => b.at(s2 * 0.75, 0.35, -1.6 + i * 1.0, h => { h.push(M4.rotZ(PI / 2)); h.prism(12, 0.35, 0.35, -0.08, 0.35, 0.35, 0.08, gold, { capBottom: true }); h.pop(); }));
    });
  }

  function buildPompom(r) {
    return mesh(r, b => {
      const fur = [0.86, 0.86, 0.9, 0.1];
      const red = [0.72, 0.12, 0.14, 0.05];
      b.at(0, 0.5, 0, h => h.ellipsoid(0.42, 0.48, 0.38, 12, 8, red));
      b.at(0, 0.62, 0.3, h => h.ellipsoid(0.26, 0.2, 0.12, 8, 5, [1, 1, 1, 0.3]));
      b.at(0, 1.08, 0, h => h.ellipsoid(0.42, 0.38, 0.38, 12, 8, fur));
      [-1, 1].forEach(s2 => {
        b.at(s2 * 0.16, 1.1, 0.32, h => { h.ellipsoid(0.11, 0.13, 0.05, 8, 5, [1, 1, 1, 0.4]); h.at(0, 0, 0.03, e => e.ellipsoid(0.08, 0.1, 0.03, 6, 4, [0.2, 0.45, 0.9, 0.5])); });
        b.push(M4.translate(s2 * 0.3, 1.2, 0.05), M4.rotZ(-s2 * 2.85), M4.rotX(0.2));
        b.prism(6, 0.09, 0.06, 0, 0.06, 0.04, 0.75, [0.36, 0.38, 0.46, 0.05]);
        b.pop();
        b.at(s2 * 0.08, 0.72, 0.4, h => h.ellipsoid(0.07, 0.06, 0.06, 6, 4, fur));
      });
      b.at(0, 1.42, 0, h => h.prism(12, 0.3, 0.3, 0, 0.26, 0.26, 0.28, red));
      b.at(0, 1.42, 0, h => h.prism(12, 0.4, 0.4, -0.02, 0.4, 0.4, 0.02, [0.4, 0.08, 0.1, 0], { capBottom: true }));
      b.at(0, 1.56, 0.29, h => h.ellipsoid(0.09, 0.09, 0.05, 8, 5, [1, 0.92, 0.55, 1]));
    });
  }

  function buildTelescope(r) {
    return mesh(r, b => {
      const white = [0.94, 0.94, 0.96, 0.1];
      const red = [0.8, 0.14, 0.2, 0.1];
      b.push(M4.rotX(-0.6));
      b.prism(12, 0.35, 0.35, 0, 0.5, 0.5, 2.8, white, { capBottom: true });
      b.at(0, 2.8, 0, h => h.prism(12, 0.55, 0.55, 0, 0.55, 0.55, 0.3, red));
      b.at(0, 1.2, 0, h => h.prism(12, 0.46, 0.46, 0, 0.46, 0.46, 0.14, [0.9, 0.72, 0.36, 0.3]));
      b.pop();
      b.at(0, 0, 0, h => h.box(1.2, 0.3, 1.0, white, { base: true }));
      [-1, 1].forEach(s2 => b.at(s2 * 0.7, 0.3, 0.2, h => { h.push(M4.rotZ(s2 * 0.5)); h.box(0.2, 1.2, 0.3, red, { base: true }); h.pop(); }));
    });
  }

  function buildRing(r) {
    return mesh(r, b => {
      const n = 48;
      [[1, 0.06], [0.82, 0.03], [0.6, 0.02]].forEach(([rad, w]) => {
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
          b.quad([C(a0) * rad, S(a0) * rad, 0], [C(a1) * rad, S(a1) * rad, 0], [C(a1) * (rad - w), S(a1) * (rad - w), 0], [C(a0) * (rad - w), S(a0) * (rad - w), 0], [1, 1, 1, 1]);
        }
      });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * PI * 2;
        b.quad([C(a) * 0.6, S(a) * 0.6, 0], [C(a + 0.02) * 0.6, S(a + 0.02) * 0.6, 0], [C(a + 0.02) * 0.94, S(a + 0.02) * 0.94, 0], [C(a) * 0.94, S(a) * 0.94, 0], [1, 1, 1, 1]);
      }
    });
  }

  function buildProps(r) {
    return {
      chest: mesh(r, b => {
        b.box(0.9, 0.5, 0.6, [0.86, 0.66, 0.24, 0.3], { base: true });
        b.at(0, 0.5, 0, h => { h.push(M4.rotZ(PI / 2)); h.prism(10, 0.3, 0.3, -0.45, 0.3, 0.3, 0.45, [0.9, 0.72, 0.3, 0.3], { capBottom: true }); h.pop(); });
      }),
      portal: mesh(r, b => {
        const cols = [[1, 0.4, 0.4, 1], [1, 0.8, 0.3, 1], [0.4, 1, 0.5, 1], [0.4, 0.7, 1, 1], [0.8, 0.4, 1, 1]];
        for (let i = 0; i < 10; i++) {
          b.push(M4.rotY(i * 0.6), M4.rotZ((i % 3 - 1) * 0.3));
          b.prism(4, 0.35, 0.2, 0, 0.02, 0.02, 2.2 + (i % 4) * 0.4, cols[i % 5]);
          b.pop();
        }
      }),
      crystal: mesh(r, b => {
        b.prism(6, 0.25, 0.25, 0, 0.02, 0.02, 0.8, [0.4, 1, 0.6, 1]);
        b.at(0, 0, 0, h => h.prism(6, 0.25, 0.25, 0, 0.02, 0.02, -0.5, [0.3, 0.9, 0.5, 1]));
      }),
      carts: mesh(r, b => {
        for (let i = 0; i < 3; i++) b.at(-1 + i * 1.6, 0, 0, h => {
          h.box(1.2, 0.6, 0.8, [0.36, 0.3, 0.26, 0.05], { base: true });
          h.at(0, 0.6, 0, o => o.ellipsoid(0.55, 0.22, 0.35, 8, 4, [1, 0.8, 0.2, 0.6]));
        });
        [-0.35, 0.35].forEach(z => b.at(0.6, 0.02, z, h => h.box(8, 0.04, 0.06, [0.4, 0.4, 0.44, 0])));
      }),
      stalls: mesh(r, b => {
        for (let i = 0; i < 4; i++) b.at(-6 + i * 3.2, 0, -3, h => {
          h.box(2.4, 1.0, 1.2, [0.55, 0.4, 0.26, 0], { base: true });
          h.at(0, 2.2, 0, o => o.box(2.8, 0.1, 1.6, [0.7, 0.3, 0.2, 0]));
          for (let k = 0; k < 6; k++) h.at(-0.9 + k * 0.36, 1.1, 0.2, o => o.ellipsoid(0.12, 0.1, 0.12, 6, 3, [1, 0.85, 0.2, 0.2]));
          h.at(0, 2.0, 0.8, o => o.ellipsoid(0.12, 0.16, 0.12, 6, 3, [1, 0.6, 0.3, 1]));
        });
      }),
      wall: mesh(r, b => {
        const g = rand(81);
        let x = -12, y = 0, z = -10;
        for (let i = 0; i < 24; i++) {
          const nx = x + 1.2, ny = S(i * 0.5) * 1.6 + (g() - 0.5) * 0.3, nz = z - 0.4 + S(i * 0.3) * 0.6;
          b.quad([x, y, z], [nx, ny, nz], [nx, ny + 1.4, nz], [x, y + 1.4, z], [0.72, 0.66, 0.54, 0]);
          b.quad([x, y + 1.4, z], [nx, ny + 1.4, nz], [nx, ny + 1.4, nz - 0.6], [x, y + 1.4, z - 0.6], [0.8, 0.74, 0.6, 0]);
          if (i % 5 === 0) b.at(x, y + 1.4, z - 0.3, h => h.box(0.9, 1.4, 1.0, [0.7, 0.64, 0.52, 0], { base: true }));
          x = nx; y = ny; z = nz;
        }
        for (let i = 0; i < 8; i++) b.at(-12 + i * 3.5, -2, -14, h => h.ellipsoid(3, 2.2, 3, 8, 4, [0.35, 0.5, 0.3, 0]));
      }),
      rag: mesh(r, b => {
        for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) b.quad([-0.6 + i * 0.2, 0.05 + ((i + j) % 2) * 0.04, -0.4 + j * 0.2], [-0.4 + i * 0.2, 0.05 + ((i + j + 1) % 2) * 0.04, -0.4 + j * 0.2], [-0.4 + i * 0.2, 0.05, -0.2 + j * 0.2], [-0.6 + i * 0.2, 0.05, -0.2 + j * 0.2], [0.5, 0.5, 0.52, 0]);
        const g = rand(4);
        for (let i = 0; i < 20; i++) b.at((g() - 0.5) * 3, 0, (g() - 0.5) * 2, h => h.ellipsoid(0.2 + g() * 0.2, 0.1, 0.2, 6, 3, [0.2, 0.2, 0.22, 0]));
      }),
      arm: mesh(r, b => {
        const dark = [0.26, 0.26, 0.34, 0.05];
        b.push(M4.rotZ(-0.5));
        b.box(1.0, 3.2, 1.0, dark, { base: true });
        b.at(0, 3.2, 0, h => h.box(1.3, 1.0, 1.2, [0.34, 0.36, 0.46, 0.05]));
        b.pop();
      }),
      dog: mesh(r, b => {
        const c = 0x8a5a2a;
        b.ellipsoid(0.55, 0.35, 0.3, 10, 6, c);
        b.at(0.55, 0.35, 0, h => h.ellipsoid(0.26, 0.24, 0.22, 8, 6, c));
        b.at(0.76, 0.28, 0, h => h.ellipsoid(0.13, 0.1, 0.11, 6, 4, shade(c, 0.7)));
        b.at(0.88, 0.31, 0, h => h.ellipsoid(0.025, 0.022, 0.03, 5, 3, 0x111111));
        [-1, 1].forEach(s2 => {
          b.push(M4.translate(0.5, 0.55, s2 * 0.14), M4.rotX(s2 * 0.35));
          b.prism(4, 0.07, 0.05, 0, 0.005, 0.005, 0.1, shade(c, 0.7), { phase: PI / 4 });
          b.pop();
          b.at(0.78, 0.42, s2 * 0.075, h => h.ellipsoid(0.03, 0.035, 0.03, 6, 4, 0x1a1a1a));
          b.at(0.805, 0.43, s2 * 0.075, h => h.ellipsoid(0.008, 0.01, 0.01, 4, 3, 0xffffff));
        });
        [[-0.35, -0.15], [-0.35, 0.15], [0.35, -0.15], [0.35, 0.15]].forEach(([x, z]) => b.at(x, -0.55, z, h => h.prism(6, 0.07, 0.07, 0, 0.08, 0.08, 0.3, c)));
      }),
      mech: mesh(r, b => {
        const purple = [0.42, 0.3, 0.62, 0.05];
        b.at(0, 1.6, 0, h => h.box(1.4, 1.4, 1.2, purple));
        b.at(0, 2.5, 0.2, h => h.box(0.7, 0.5, 0.6, [0.5, 0.38, 0.7, 0.05]));
        b.at(0, 2.55, 0.52, h => h.box(0.4, 0.08, 0.04, [1, 0.4, 0.9, 1]));
        [-1, 1].forEach(s2 => {
          b.at(s2 * 1.0, 1.6, 0.3, h => h.box(0.5, 0.5, 1.6, [0.3, 0.24, 0.44, 0.05]));
          b.at(s2 * 0.4, 0, 0, h => h.box(0.4, 0.9, 0.5, [0.28, 0.22, 0.4, 0.05], { base: true }));
        });
      }),
      ghost: null
    };
  }

  function buildSets(r) {
    return {
      T: makeTextures(r),
      room: buildRoom(r),
      cls: buildClass(r),
      board: buildBoard(r),
      snow: arenaSnow(r),
      yard: arenaYard(r),
      crystals: crystals(r),
      street: arenaStreet(r),
      station: arenaStation(r),
      plaza: arenaPlaza(r),
      dome: starDome(r),
      door: buildDoor(r),
      tunnel: buildTunnel(r),
      card: buildCard(r),
      platform: buildPlatform(r),
      emoji: buildEmoji(r, 'plain'),
      emojiHands: buildEmoji(r, 'hands'),
      emojiFace: buildEmoji(r, 'face'),
      antlers: mesh(r, b => [-1, 1].forEach(s => {
        const col = [0.55, 0.38, 0.2, 0];
        tube(b, [[s * 0.5, 0.75, 0], [s * 0.8, 1.3, 0], [s * 0.95, 1.9, 0]], [0.09, 0.07, 0.04], 6, col);
        tube(b, [[s * 0.72, 1.2, 0], [s * 0.45, 1.6, 0.05]], [0.06, 0.03], 5, col);
        tube(b, [[s * 0.88, 1.65, 0], [s * 1.3, 1.95, 0]], [0.05, 0.025], 5, col);
      })),
      penguin: buildPenguin(r),
      cat: buildCat(r, 0x8a7a6a),
      catWhite: buildCat(r, 0xeeeeea),
      catBlack: buildCat(r, 0x1c1c20),
      horse: buildHorse(r),
      horseHead: buildHorseHead(r),
      armorFg: mesh(r, b => {
        const coat = [0.07, 0.07, 0.09, 0];
        const plate = [0.36, 0.34, 0.62, 0.08];
        const plateDark = [0.24, 0.22, 0.44, 0.05];
        b.at(-0.72, 0.4, 0.4, h => h.box(0.4, 2.2, 0.3, coat, { base: true }));
        b.push(M4.translate(-0.42, 1.37, 0.42), M4.rotZ(-0.25));
        b.at(0, 0, -0.02, h => h.ellipsoid(0.15, 0.27, 0.12, 10, 7, plateDark));
        for (let i = 0; i < 4; i++) {
          b.at(0, -0.2 + i * 0.13, 0.07, h => h.ellipsoid(0.16 - i * 0.01, 0.07, 0.05, 10, 5, plate));
          b.at(-0.04, -0.18 + i * 0.13, 0.11, h => h.ellipsoid(0.05, 0.015, 0.01, 6, 3, [0.82, 0.84, 1, 0.5]));
        }
        b.at(0, -0.33, 0, h => h.ellipsoid(0.14, 0.1, 0.13, 8, 5, plate));
        b.pop();
        b.at(-0.36, 1.02, 0.5, h => h.box(0.05, 0.14, 0.03, [0.85, 0.1, 0.12, 0.3]));
      }),
      monkey: mesh(r, b => {
        const fur = [0.6, 0.6, 0.62, 0];
        const face = [0.9, 0.78, 0.72, 0];
        b.at(0, 0.45, 0, h => h.ellipsoid(0.32, 0.4, 0.28, 10, 7, fur));
        b.at(0, 0.98, 0.04, h => h.ellipsoid(0.26, 0.25, 0.24, 10, 7, fur));
        b.at(0, 0.95, 0.2, h => h.ellipsoid(0.16, 0.15, 0.08, 8, 5, face));
        [-1, 1].forEach(s => {
          b.at(s * 0.26, 1.0, 0.02, h => h.ellipsoid(0.08, 0.09, 0.04, 6, 4, face));
          b.at(s * 0.06, 0.99, 0.27, h => h.ellipsoid(0.025, 0.03, 0.02, 5, 3, [0.1, 0.08, 0.08, 0]));
          K.tube(b, [[s * 0.28, 0.7, 0.05], [s * 0.4, 0.35, 0.15], [s * 0.3, 0.1, 0.22]], [0.08, 0.07, 0.06], 6, fur);
          b.at(s * 0.16, 0.05, 0.05, h => h.ellipsoid(0.12, 0.08, 0.16, 6, 4, fur));
        });
      }),
      crystalBlade: mesh(r, b => {
        const core = [0.75, 0.06, 0.12, 1];
        const mid = [0.9, 0.12, 0.2, 1];
        const edge = [1, 0.31, 0.38, 1];
        const A = [-0.5, 0.09, 0], B = [-0.5, -0.09, 0], C = [0.1, 0.11, 0.03], D = [0.1, -0.07, 0.03], E = [0.55, 0, 0], M = [-0.1, 0.01, 0.06];
        b.tri(A, M, C, mid);
        b.tri(B, D, M, core);
        b.tri(A, B, M, core);
        b.tri(M, D, E, core);
        b.tri(M, E, C, mid);
        b.tri([-0.5, 0.09, 0.01], [0.1, 0.11, 0.04], [0.1, 0.13, 0.04], edge);
        b.tri([-0.5, 0.09, 0.01], [0.1, 0.13, 0.04], [-0.5, 0.11, 0.01], edge);
        b.tri([0.1, 0.11, 0.04], [0.55, 0, 0.01], [0.1, 0.13, 0.04], edge);
      }),
      scopeTube: mesh(r, b => {
        tube(b, [[0, 0, 0], [0, 1, 0]], [0.15, 0.13], 12, [0.9, 0.9, 0.92, 0]);
        [0.08, 0.5, 0.92].forEach(y => b.at(0, y, 0, h => h.prism(12, 0.16, 0.16, -0.03, 0.16, 0.16, 0.03, [0.45, 0.46, 0.5, 0])));
        b.at(0, 1, 0, h => h.prism(12, 0.13, 0.13, 0, 0.1, 0.1, 0.06, [0.2, 0.22, 0.3, 0.2]));
      }),
      orb: mesh(r, b => spherePatch(b, 1, 1, 1, -PI, PI, -PI / 2, PI / 2, 9, 6, [1, 1, 1, 0.1])),
      pigeon: buildBird(r, 0x9a8aa6),
      rooster: buildBird(r, 0xb86a2a),
      express: buildExpress(r),
      pompom: buildPompom(r),
      telescope: buildTelescope(r),
      ring: buildRing(r),
      props: buildProps(r),
      unit: mesh(r, b => quadXY(b, -0.5, -0.5, 0.5, 0.5, 0, [1, 1, 1, 1])),
      unitLit: mesh(r, b => quadXY(b, -0.5, -0.5, 0.5, 0.5, 0, [1, 1, 1, 0])),
      disc: mesh(r, b => discXY(b, 0, 0, 0, 0.5, 20, [1, 1, 1, 1]))
    };
  }

  window.HayatoSets = { buildSets, quadXY };
})();
