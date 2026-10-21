(function () {
  const { M4, V3, rgb, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;

  function drawWoodTex(base, dark, seed) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 48; i++) {
        ctx.fillStyle = i % 2 ? dark : 'rgba(255,245,230,0.06)';
        ctx.fillRect(0, Math.floor(g() * h), w, 1 + Math.floor(g() * 3));
      }
      for (let i = 0; i < 320; i++) {
        ctx.fillStyle = `rgba(0,0,0,${0.03 * g()})`;
        ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 2 + Math.floor(g() * 6), 1);
      }
    };
  }

  function drawPhoneScreenTex() {
    return (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w * 0.35, h);
      bg.addColorStop(0, '#173760');
      bg.addColorStop(0.45, '#25568b');
      bg.addColorStop(0.8, '#316ea6');
      bg.addColorStop(1, '#3b7fb6');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const cloud = (cx, cy, rx, ry, a) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, ry / rx);
        const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        gr.addColorStop(0, `rgba(235,248,255,${a})`);
        gr.addColorStop(0.55, `rgba(205,235,252,${a * 0.65})`);
        gr.addColorStop(1, 'rgba(180,220,248,0)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, PI * 2);
        ctx.fill();
        ctx.restore();
      };
      cloud(w * 0.88, h * 0.22, w * 0.32, h * 0.14, 0.92);
      cloud(w * 0.76, h * 0.16, w * 0.22, h * 0.1, 0.78);
      cloud(w * 0.94, h * 0.3, w * 0.24, h * 0.11, 0.82);

      const g = rand(41);
      for (let i = 0; i < 95; i++) {
        const sx = g() * w, sy = g() * h * 0.85;
        const r = 0.6 + g() * 1.4;
        ctx.fillStyle = `rgba(240,250,255,${0.25 + g() * 0.65})`;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(235,248,255,0.9)';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(14 + i * 7, 18, 2.2, 0, PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#7be0ad';
      ctx.fillRect(46, 11, 14, 13);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(46, 11, 14, 13);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(68, 11, 12, 13);

      ctx.fillStyle = '#f6fbff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '300 84px Arial, sans-serif';
      ctx.fillText('10:24', w * 0.5, h * 0.34);

      ctx.font = 'bold 28px "Microsoft Sans Serif", Arial, sans-serif';
      ctx.fillText('日曜日', w * 0.5, h * 0.455);

      ctx.save();
      ctx.translate(w * 0.52, h * 0.78);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.font = '900 82px "Microsoft Sans Serif", Arial, sans-serif';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 10;
      ctx.strokeText('龍', -36, 0);
      ctx.strokeText('女', 42, 4);
      ctx.fillStyle = '#4cb838';
      ctx.fillText('龍', -36, 0);
      ctx.fillText('女', 42, 4);
      ctx.restore();
    };
  }

  function drawDepotTileTex() {
    return (ctx, w, h) => {
      const g = rand(73);
      ctx.fillStyle = '#2b3022';
      ctx.fillRect(0, 0, w, h);
      const step = 32;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const d = Math.floor((g() - 0.5) * 14);
          ctx.fillStyle = `rgb(${43 + d},${48 + d},${34 + d})`;
          ctx.fillRect(x + 2, y + 2, step - 3, step - 3);
        }
      }
      ctx.fillStyle = '#181b13';
      for (let y = 0; y < h; y += step) ctx.fillRect(0, y, w, 2);
      for (let x = 0; x < w; x += step) ctx.fillRect(x, 0, 2, h);
      for (let i = 0; i < 400; i++) {
        ctx.fillStyle = `rgba(15,12,8,${0.08 * g()})`;
        ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 2 + Math.floor(g() * 6), 2 + Math.floor(g() * 6));
      }
    };
  }

  function drawDepotPlasterTex() {
    return (ctx, w, h) => {
      const g = rand(89);
      ctx.fillStyle = '#383826';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = i % 3 === 0 ? 'rgba(92,78,44,0.22)' : 'rgba(26,28,18,0.24)';
        ctx.beginPath();
        ctx.ellipse(g() * w, g() * h, 10 + g() * 36, 8 + g() * 28, g() * PI, 0, PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 500; i++) {
        ctx.fillStyle = `rgba(0,0,0,${0.05 * g()})`;
        ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 2, 2);
      }
    };
  }

  function drawMarbleTex() {
    return (ctx, w, h) => {
      const g = rand(57);
      ctx.fillStyle = '#684430';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(168,124,92,0.35)' : 'rgba(46,26,16,0.38)';
        ctx.beginPath();
        ctx.ellipse(g() * w, g() * h, 6 + g() * 22, 4 + g() * 14, g() * PI, 0, PI * 2);
        ctx.fill();
      }
    };
  }

  function drawSubtitleTex(lines) {
    return K.textCanvas(640, 96, (ctx, w, h) => {
      ctx.font = 'bold 23px Arial, "Microsoft Sans Serif", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      lines.forEach((line, i) => {
        const y = 30 + i * 32;
        ctx.strokeStyle = 'rgba(0,0,0,0.92)';
        ctx.lineWidth = 5;
        ctx.strokeText(line, w / 2, y);
        ctx.fillStyle = '#f4f4f0';
        ctx.fillText(line, w / 2, y);
      });
    });
  }

  function buildPhoneBody(b) {
    const body = 0xf4f6fa, rim = 0xc8ced8, dark = 0x262a34;
    b.box(0.078, 0.154, 0.008, body, { faces: { left: rim, right: rim, top: rim, bottom: rim, back: 0xeaeef4 } });
    b.at(0, 0.066, 0.0043, h => h.box(0.016, 0.0025, 0.001, dark));
    b.at(-0.016, 0.066, 0.0043, h => h.ellipsoid(0.0022, 0.0022, 0.001, 6, 4, dark));
    b.at(0, -0.066, 0.0043, h => K.discXY(h, 0, 0, 0, 0.0055, 10, rim));
    b.at(0, -0.066, 0.0045, h => K.discXY(h, 0, 0, 0, 0.0042, 10, body));
  }

  function buildPhoneScreen(b, lit) {
    const c = lit ? [1, 1, 1, 0.9] : [0.22, 0.25, 0.34, 0.15];
    b.quad([-0.034, -0.055, 0.0044], [0.034, -0.055, 0.0044], [0.034, 0.055, 0.0044], [-0.034, 0.055, 0.0044], c, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
  }

  function buildPovHand(b, mode) {
    const skin = 0xf2ccb8, shadeSkin = 0xdcb09a, sleeve = 0x9ec6dc, sleeveDark = 0x82acc4;
    b.at(0, -0.18, -0.02, h => h.prism(10, 0.048, 0.042, -0.16, 0.042, 0.036, 0.12, sleeve, { topColor: sleeveDark }));
    b.at(0, -0.04, 0, h => h.prism(10, 0.032, 0.026, -0.04, 0.034, 0.024, 0.04, skin));
    b.at(0, 0.035, 0.005, h => h.ellipsoid(0.042, 0.048, 0.018, 10, 6, skin));
    if (mode === 'hold') {
      b.push(M4.translate(-0.042, 0.045, 0.022), M4.rotZ(-0.35), M4.rotX(0.25));
      b.ellipsoid(0.014, 0.036, 0.013, 8, 5, skin);
      b.pop();
      for (let i = 0; i < 4; i++) {
        const y = 0.02 + i * 0.022;
        b.at(-0.048, y, -0.002, h => h.ellipsoid(0.012, 0.01, 0.016, 6, 4, shadeSkin));
      }
    } else {
      b.push(M4.translate(-0.038, 0.03, 0.01), M4.rotZ(0.45));
      b.ellipsoid(0.011, 0.032, 0.01, 7, 4, skin);
      b.pop();
      [-0.024, -0.008, 0.008, 0.024].forEach((x, i) => {
        const len = [0.034, 0.04, 0.037, 0.029][i];
        b.push(M4.translate(x, 0.075, 0.006), M4.rotZ((1.5 - i) * 0.08), M4.rotX(0.12));
        b.ellipsoid(0.0085, len, 0.008, 7, 4, i % 2 ? skin : shadeSkin);
        b.pop();
      });
    }
  }

  function buildBedroom(r, T) {
    const wall = 0xd8c8ae, wallLight = 0xe8dcc6, floor = 0x8c6848;
    const door = 0x42362e, doorDark = 0x2e241e, trim = 0x362c25;
    const desk = 0xdce2ea, deskSide = 0xc2cad4;

    const room = mesh(r, b => {
      b.at(0, -0.02, 0, h => h.box(3.4, 0.04, 3.2, floor));
      b.at(0, 2.55, 0, h => h.box(3.4, 0.04, 3.2, 0xf2eee6));
      b.at(-0.4, 1.25, -1.08, h => h.box(2.5, 2.55, 0.06, wall));
      b.at(0.95, 1.25, -1.08, h => h.box(0.8, 2.55, 0.06, wallLight));
      b.at(-1.55, 1.25, 0.2, h => h.box(0.06, 2.55, 2.8, wall));
      b.at(1.38, 1.25, -0.65, h => h.box(0.06, 2.55, 0.9, wallLight));

      b.at(0.38, 1.08, -1.04, h => h.box(0.86, 2.18, 0.04, trim));
      b.at(0.38, 1.07, -1.02, h => h.box(0.78, 2.12, 0.035, door));
      b.at(0.38, 1.52, -1.0, h => h.box(0.62, 0.82, 0.015, doorDark));
      b.at(0.38, 0.56, -1.0, h => h.box(0.62, 0.78, 0.015, doorDark));
      b.at(0.06, 1.06, -0.99, h => h.box(0.03, 0.18, 0.02, 0x9aa0a8));
      b.at(0.08, 1.06, -0.97, h => h.box(0.07, 0.022, 0.025, 0xc4cad2));

      b.at(-0.98, 0.85, -0.88, h => h.box(0.68, 1.65, 0.32, 0xc8a482));
      b.at(-0.98, 1.18, -0.86, h => h.box(0.6, 0.03, 0.28, 0xa88464));
      b.at(-0.98, 0.78, -0.86, h => h.box(0.6, 0.03, 0.28, 0xa88464));
      [-1.16, -1.04, -0.92, -0.8].forEach((x, i) => {
        const cols = [0xd86878, 0x5898c8, 0x78b870, 0xe8b858];
        b.at(x, 1.31, -0.84, h => h.box(0.07, 0.2, 0.18, cols[i]));
      });

      b.at(-0.36, 0.24, 0.36, h => h.box(1.18, 0.44, 1.6, 0xeae4dc));
      b.at(-0.36, 0.48, 0.72, h => h.ellipsoid(0.42, 0.1, 0.24, 10, 6, 0xf6dce2));
      b.at(-0.36, 0.46, 0.18, h => h.box(1.12, 0.12, 0.95, 0xf4ecf0));

      b.at(0.56, 0.34, 0.24, h => h.box(0.68, 0.68, 0.64, deskSide));
      b.at(0.56, 0.69, 0.24, h => h.box(0.72, 0.035, 0.68, desk, { faces: { top: 0xe8edf4, front: deskSide, left: deskSide } }));
    });

    const windowGlow = mesh(r, b => {
      b.at(1.34, 1.35, 0.25, h => h.box(0.03, 1.75, 1.35, [0.96, 0.98, 1.0, 0.92]));
      for (let i = 0; i < 5; i++) {
        const z = -0.32 + i * 0.14;
        b.at(1.26, 1.32, z, h => h.prism(8, 0.045, 0.06, -0.88, 0.04, 0.055, 0.88, [0.88, 0.93, 0.97, 0.55]));
      }
      for (let i = 0; i < 4; i++) {
        const z = 0.42 + i * 0.11;
        b.at(1.22, 1.32, z, h => h.prism(8, 0.05, 0.055, -0.88, 0.045, 0.05, 0.88, 0x88ab7c));
      }
    });

    const mug = mesh(r, b => {
      b.prism(14, 0.052, 0.052, 0, 0.055, 0.055, 0.125, 0x9c2418, { capBottom: true, capTop: false });
      b.at(0, 0.123, 0, h => h.prism(14, 0.056, 0.056, -0.004, 0.056, 0.056, 0.004, 0xb83424));
      b.at(0, 0.112, 0, h => h.disc(0.049, 12, 0x261812));
      K.tube(b, [[-0.05, 0.098, 0], [-0.076, 0.092, 0], [-0.078, 0.038, 0], [-0.05, 0.03, 0]], [0.009, 0.009, 0.009, 0.009], 8, 0x9c2418);
    });

    const depotTiles = mesh(r, b => {
      b.at(-0.78, 1.2, -0.62, h => h.box(1.1, 2.4, 0.05, [1, 1, 1, 0], { uvScale: 1.4 }));
    });

    const depotPlaster = mesh(r, b => {
      b.at(0.0, 1.2, -0.64, h => h.box(0.6, 2.4, 0.05, [1, 1, 1, 0], { uvScale: 0.9 }));
      b.at(1.6, 1.2, -0.64, h => h.box(1.6, 2.4, 0.05, [1, 1, 1, 0], { uvScale: 0.9 }));
      b.at(-1.52, 1.2, 0.0, h => h.box(0.05, 2.4, 2.4, [1, 1, 1, 0], { uvScale: 0.9 }));
      b.at(0.4, 2.0, -0.62, h => h.box(3.0, 0.6, 0.06, [1, 1, 1, 0], { uvScale: 0.9 }));
    });

    const depotWood = mesh(r, b => {
      b.at(0.78, 0.65, -0.6, h => h.box(0.86, 1.3, 0.07, 0x4a3524));
      b.at(0.78, 0.65, -0.55, h => h.box(0.72, 1.16, 0.04, 0x1c1a12));
      b.at(0.78, 1.3, -0.56, h => h.box(0.9, 0.06, 0.1, 0x6a4a32));
      b.at(0.4, 0.65, -0.55, h => h.box(0.05, 1.3, 0.09, 0x4e382a));
      b.at(0.78, 0.65, -0.5, h => h.box(0.04, 1.16, 0.02, 0x4e382a));

      b.at(0.34, 0.35, 0.44, h => h.box(1.3, 0.7, 0.54, 0x2a2018));
      b.at(0.34, 0.715, 0.44, h => h.box(1.36, 0.04, 0.6, 0x3c2c20));

      b.at(-1.46, 0.6, -0.2, h => h.box(0.18, 1.2, 0.62, 0x3a3e26));
      [1.0, 0.64, 0.28].forEach(y => {
        b.at(-1.36, y, -0.2, h => h.box(0.02, 0.34, 0.54, 0x2e321e));
        b.push(M4.translate(-1.35, y, -0.2), M4.rotY(-PI / 2));
        K.discXY(b, 0, 0, 0, 0.026, 10, 0x8a8058);
        K.discXY(b, 0, 0, 0.003, 0.015, 10, 0x383426);
        b.pop();
      });
    });

    const depotMarble = mesh(r, b => {
      b.at(-0.45, 0.82, -0.5, h => h.box(0.5, 0.07, 0.22, [1, 1, 1, 0], { uvScale: 2.0 }));
    });

    return {
      room,
      windowGlow,
      mug,
      depotTiles,
      depotPlaster,
      depotWood,
      depotMarble,
      phoneBody: mesh(r, buildPhoneBody),
      phoneScreenLit: mesh(r, b => buildPhoneScreen(b, true)),
      phoneScreenDim: mesh(r, b => buildPhoneScreen(b, false)),
      handReach: mesh(r, b => buildPovHand(b, 'reach')),
      handHold: mesh(r, b => buildPovHand(b, 'hold')),
      T
    };
  }

  function build(r) {
    const T = {
      wood: r.texture(128, drawWoodTex('#6b4d35', 'rgba(42,26,14,0.35)', 12)),
      phoneScreen: r.texture(256, drawPhoneScreenTex(), { height: 512, clamp: true }),
      depotTile: r.texture(128, drawDepotTileTex()),
      depotPlaster: r.texture(128, drawDepotPlasterTex()),
      marble: r.texture(128, drawMarbleTex()),
      sub1: r.texture(512, drawSubtitleTex(['-Roman! Are you sleeping, you fat f***? Come on!', '-Huh! No! No way!']), { height: 96, clamp: true })
    };
    return buildBedroom(r, T);
  }

  function camFrame(cam) {
    const f = V3.norm(V3.sub(cam.at, cam.eye));
    const rgt = V3.norm(V3.cross(f, cam.up || [0, 1, 0]));
    const up = V3.cross(rgt, f);
    const basis = new Float32Array([
      rgt[0], rgt[1], rgt[2], 0,
      up[0], up[1], up[2], 0,
      f[0], f[1], f[2], 0,
      cam.eye[0], cam.eye[1], cam.eye[2], 1
    ]);
    return { basis, f, rgt, up };
  }

  function drawBedroom(r, W, st) {
    r.draw(W.room);
    r.draw(W.windowGlow, null, { noFog: true });

    if (st.phoneOnDesk) {
      const pm = M4.chain(
        M4.translate(0.62, 0.712, 0.16),
        M4.rotY(-0.28),
        M4.rotX(-PI / 2),
        M4.scale(1.25)
      );
      r.draw(W.phoneBody, pm);
      r.draw(W.phoneScreenDim, pm);
    }

    if (st.pov && st.pov.kind === 'reach') {
      const p = st.pov;
      const hm = M4.chain(
        M4.translate(p.pos[0], p.pos[1], p.pos[2]),
        M4.rotY(p.yaw || -0.35),
        M4.rotX(p.pitch || -1.35),
        M4.rotZ(p.roll || 0.15)
      );
      r.draw(W.handReach, hm);
      if (p.hasPhone) {
        const pm = M4.chain(hm, M4.translate(-0.015, 0.06, 0.015), M4.rotZ(0.2));
        r.draw(W.phoneBody, pm);
        r.draw(W.phoneScreenDim, pm);
      }
    }

    if (st.pov && st.pov.kind === 'holdPhone') {
      const cf = camFrame(st.camera);
      const p = st.pov;
      const pm = M4.chain(
        cf.basis,
        M4.translate(p.off[0], p.off[1], p.off[2]),
        M4.rotZ(p.rz || 0.28),
        M4.rotY(p.ry || -0.18),
        M4.rotX(p.rx || 0.12),
        M4.scale(p.scale || 1.65)
      );
      r.draw(W.phoneBody, pm, { noFog: true });
      if (p.lit) {
        r.draw(W.phoneScreenLit, pm, { texture: W.T.phoneScreen, noFog: true });
      } else {
        r.draw(W.phoneScreenDim, pm, { noFog: true });
      }
      const hm = M4.chain(
        pm,
        M4.translate(0.052 + (p.tap || 0) * -0.025, -0.015, -0.004),
        M4.rotZ(0.18 + (p.tap || 0) * 0.25)
      );
      r.draw(W.handHold, hm, { noFog: true });
    }
  }

  function drawDepot(r, W, st) {
    r.draw(W.depotTiles, null, { texture: W.T.depotTile });
    r.draw(W.depotPlaster, null, { texture: W.T.depotPlaster });
    r.draw(W.depotWood);
    r.draw(W.depotMarble, null, { texture: W.T.marble });
    r.draw(W.mug, M4.translate(0.1, 0.735, 0.2));
  }

  function draw(r, W, st) {
    if (st.set === 'depot') drawDepot(r, W, st);
    else drawBedroom(r, W, st);
  }

  window.RomanWorld = { build, draw };
})();
