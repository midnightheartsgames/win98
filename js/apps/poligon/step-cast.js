(function () {
  const { M4, V3, rgb } = window.P3D;
  const Cast = window.P3DCccCast;
  const { R, HER, headPoint, band } = Cast;

  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const lerp = (a, b, k) => a + (b - a) * k;
  const NZ = [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]];
  const NB = [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]];

  const css = (c) => {
    const v = rgb(c);
    return `rgb(${Math.round(v[0] * 255)},${Math.round(v[1] * 255)},${Math.round(v[2] * 255)})`;
  };
  const mixc = (a, b, k) => {
    const x = rgb(a), y = rgb(b);
    return [lerp(x[0], y[0], k), lerp(x[1], y[1], k), lerp(x[2], y[2], k), 0];
  };

  const SKIN = 0xfde4d2;
  const JACKET = 0x23253d;
  const CORSET = 0x3b2d4e;
  const RED = [0.84, 0.1, 0.15, 0.1];
  const RED_DARK = [0.62, 0.06, 0.1, 0.06];
  const GOLD = [0.93, 0.71, 0.25, 0.14];
  const GREEN = [0.1, 0.62, 0.42, 0.12];
  const GLOVE = 0xf8f6f3;
  const WHITE = 0xfbfaf8;
  const STOCK = 0x1d1b27;
  const SHOE = 0x18141a;
  const TRAIN = 0x1d1a27;
  const TRAIN_HI = 0x2b2638;

  const EYE_Y = 129;
  const EYE_X = [85, 171];
  const MX = 128, MY = 192;
  const ALIAS = {
    calm: 'open|smile', smile: 'open|smile', happy: 'happy|beam', grin: 'open|grin', beam: 'open|beam', wink: 'wink|smile',
    sleep: 'shut|rest', blank: 'open|rest', say: 'open|say', sing: 'open|sing', belt: 'happy|belt', surprised: 'wide|oh', shout: 'happy|belt'
  };

  function faceParts(kind) {
    const p = (ALIAS[kind] || kind || 'open|smile').split('|');
    return { eyes: p[0] || 'open', mouth: p[1] || 'smile' };
  }

  function eyeMode(mode, right) {
    if (mode === 'wink') return right ? 'happy' : 'open';
    if (mode === 'winkR') return right ? 'open' : 'happy';
    return mode;
  }

  function eye(ctx, P, x, s, mode, skin) {
    const y = EYE_Y;
    if (mode === 'happy' || mode === 'shut') {
      ctx.strokeStyle = P.lash;
      ctx.lineWidth = 6;
      ctx.beginPath();
      if (mode === 'shut') {
        ctx.moveTo(x - 23, y + 1);
        ctx.quadraticCurveTo(x, y + 11, x + 23, y + 1);
      } else {
        ctx.moveTo(x - 22, y + 8);
        ctx.quadraticCurveTo(x, y - 15, x + 22, y + 8);
      }
      ctx.stroke();
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(x + s * 20, y + 4);
      ctx.lineTo(x + s * 28, y - 3);
      ctx.stroke();
      return;
    }
    const k = mode === 'wide' ? 1.2 : 1.13;
    const shape = () => {
      ctx.beginPath();
      ctx.moveTo(-s * 23, 3);
      ctx.bezierCurveTo(-s * 21, -24, s * 12, -31, s * 24, -7);
      ctx.bezierCurveTo(s * 24, 12, s * 10, 24, 0, 24);
      ctx.bezierCurveTo(-s * 11, 24, -s * 22, 15, -s * 23, 3);
      ctx.closePath();
    };
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    shape();
    ctx.fillStyle = '#fdfbf7';
    ctx.fill();
    ctx.save();
    shape();
    ctx.clip();
    const gx = (mode === 'side' ? 5 : 0) - s * 1.5, gy = mode === 'up' ? -4 : 2;
    const ir = mode === 'wide' ? 14 : 16;
    const g = ctx.createLinearGradient(0, gy - ir * 1.25, 0, gy + ir * 1.25);
    g.addColorStop(0, P.iris[0]);
    g.addColorStop(0.5, P.iris[1]);
    g.addColorStop(1, P.iris[2]);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(gx, gy, ir, ir * 1.24, 0, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.iris[0];
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = P.pupil;
    ctx.beginPath();
    ctx.ellipse(gx, gy + 1, ir * 0.42, ir * 0.56, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(40,22,8,0.35)';
    ctx.fillRect(-30, -34, 60, 15);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(gx - s * 5 - 1, gy - 8, 5.5, 6.5, -0.3, 0, PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(gx + s * 6, gy + 10, 2.6, 0, PI * 2);
    ctx.fill();
    if (mode === 'half') {
      ctx.fillStyle = css(skin);
      ctx.fillRect(-30, -36, 60, 21);
    }
    ctx.restore();
    ctx.strokeStyle = P.lash;
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    if (mode === 'half') {
      ctx.moveTo(-s * 23, 1);
      ctx.quadraticCurveTo(0, -16, s * 24, -7);
    } else {
      ctx.moveTo(-s * 23, 3);
      ctx.bezierCurveTo(-s * 21, -24, s * 12, -31, s * 24, -7);
    }
    ctx.stroke();
    ctx.fillStyle = P.lash;
    ctx.beginPath();
    ctx.moveTo(s * 17, -15);
    ctx.lineTo(s * 31, -14);
    ctx.lineTo(s * 25, -3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = css(mixc(P.lashHex, 0xffffff, 0.45));
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 12, 23);
    ctx.quadraticCurveTo(0, 26, s * 12, 22);
    ctx.stroke();
    ctx.restore();
  }

  function mouth(ctx, P, kind) {
    const open = (w, h, o) => {
      const opts = o || {};
      const top = MY - h * 0.25;
      ctx.beginPath();
      ctx.moveTo(MX - w, top);
      ctx.quadraticCurveTo(MX, top - (opts.flat ? 1 : h * 0.25), MX + w, top);
      ctx.quadraticCurveTo(MX + w * 0.86, MY + h * 0.95, MX, MY + h);
      ctx.quadraticCurveTo(MX - w * 0.86, MY + h * 0.95, MX - w, top);
      ctx.closePath();
      ctx.fillStyle = P.mouth;
      ctx.fill();
      ctx.save();
      ctx.clip();
      if (opts.teeth) {
        ctx.fillStyle = '#fbf8f4';
        ctx.fillRect(MX - w, top - h, w * 2, h + h * 0.22);
      }
      ctx.fillStyle = P.lip;
      ctx.beginPath();
      ctx.ellipse(MX, MY + h * 0.95, w * 0.62, h * 0.42, 0, 0, PI * 2);
      ctx.fill();
      ctx.restore();
    };
    if (kind === 'say') return open(12, 9);
    if (kind === 'sing') return open(16, 16);
    if (kind === 'belt') return open(18, 21, { teeth: true });
    if (kind === 'beam') return open(20, 15, { flat: true, teeth: true });
    if (kind === 'grin') return open(18, 10, { flat: true, teeth: true });
    if (kind === 'oh') {
      ctx.fillStyle = P.mouth;
      ctx.beginPath();
      ctx.ellipse(MX, MY + 4, 8.5, 11, 0, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = P.lip;
      ctx.beginPath();
      ctx.ellipse(MX, MY + 9, 4.4, 3.6, 0, 0, PI * 2);
      ctx.fill();
      return;
    }
    ctx.strokeStyle = P.mouth;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    if (kind === 'rest') {
      ctx.moveTo(MX - 7, MY + 1);
      ctx.quadraticCurveTo(MX, MY + 4, MX + 7, MY + 1);
    } else {
      ctx.moveTo(MX - 11, MY - 3);
      ctx.quadraticCurveTo(MX, MY + 7, MX + 11, MY - 3);
    }
    ctx.stroke();
  }

  function paintFace(P, kind, mask, skinOver) {
    const skin = skinOver === undefined ? P.skin : skinOver;
    const f = faceParts(kind);
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = css(mixc(skin, 0xf27a8a, 0.24));
      [60, 196].forEach(x => { ctx.beginPath(); ctx.ellipse(x, 163, 20, 10, 0, 0, PI * 2); ctx.fill(); });
      EYE_X.forEach((x, i) => eye(ctx, P, x, i ? 1 : -1, eyeMode(f.eyes, i === 1), skin));
      ctx.strokeStyle = P.brow;
      ctx.lineWidth = 3.4;
      const lift = f.eyes === 'happy' || f.eyes === 'wide' ? -4 : 0;
      EYE_X.forEach((x, i) => {
        const s = i ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(x - s * 15, 95 + lift);
        ctx.quadraticCurveTo(x + s * 3, 87 + lift, x + s * 22, 94 + lift);
        ctx.stroke();
      });
      ctx.fillStyle = css(mixc(skin, 0x6a2a1a, 0.32));
      ctx.beginPath();
      ctx.ellipse(MX + 2, 163, 2.2, 1.6, 0, 0, PI * 2);
      ctx.fill();
      mouth(ctx, P, f.mouth);
      ctx.restore();
    };
  }

  Object.assign(Cast.PEOPLE, {
    mio: { paint: paintFace, skin: SKIN, iris: ['#4a2e0e', '#a27626', '#e8c65c'], pupil: '#2a1606', lash: '#3a2214', lashHex: 0x3a2214, brow: '#8a5c3a', mouth: '#b02c44', lip: '#f2909c' }
  });

  Object.assign(Cast.HAIR, {
    mio: { mid: 0x7d5435, hi: 0xa2724c, dark: 0x543620 }
  });

  Object.assign(Cast.SHELLS, {
    mio: {
      low: (y) => lerp(lerp(0.14 + 0.04 * C(y * 7), -0.46, band(y, 0.42, 1.05)), -0.68, band(y, 1.6, 2.4)),
      tip: (y) => (Math.abs(y) < 0.5 ? 0.06 : 0.08) + 0.06 * Math.abs(S(y * 6.5)), k: 1.15, flare: 0.15,
      extra: (head, back, H) => locks(head, H)
    }
  });

  function lock(b, col, yaw, w, pTop, pTip, kTop, kTip, curl) {
    const pMid = lerp(pTop, pTip, 0.55), kMid = lerp(kTop, kTip, 0.5) + 0.025;
    const a = headPoint(yaw - w, pTop, kTop), c = headPoint(yaw + w, pTop, kTop);
    const d = headPoint(yaw + w * 0.62 + curl * 0.4, pMid, kMid), e = headPoint(yaw - w * 0.62 + curl * 0.4, pMid, kMid);
    const tip = headPoint(yaw + curl, pTip, kTip);
    const n0 = Cast.headNormal(yaw, pTop), n1 = Cast.headNormal(yaw, pMid), n2 = Cast.headNormal(yaw + curl, pTip);
    b.quad(a, c, d, e, col, null, [n0, n0, n1, n1]);
    b.tri(e, d, tip, col, null, [n1, n1, n2]);
  }

  function locks(b, H) {
    [[-0.66, 0.1, 0.08], [-0.47, 0.11, 0.04], [-0.29, 0.1, -0.01], [-0.12, 0.1, 0.02], [0.05, 0.1, -0.03], [0.22, 0.1, 0.03], [0.39, 0.1, 0.0], [0.56, 0.1, 0.06], [0.72, 0.09, 0.1]].forEach(([yaw, w, tip], i) => {
      lock(b, i % 3 === 1 ? H.hi : i % 2 ? H.dark : H.mid, yaw, w, 0.55, tip, 1.17, 1.13, -yaw * 0.08);
    });
    [-1, 1].forEach(s => {
      [[0.95, 0.12, -0.6], [1.16, 0.12, -0.7], [1.38, 0.13, -0.66], [1.62, 0.13, -0.74], [1.88, 0.14, -0.7]].forEach(([yaw, w, tip], i) => {
        lock(b, i % 2 ? H.mid : H.hi, s * yaw, w, 0.18, tip, 1.16, 1.3, s * 0.1);
      });
    });
    for (let i = 0; i < 9; i++) {
      const yaw = 2.15 + (i / 8) * (PI * 2 - 4.3);
      lock(b, i % 2 ? H.dark : H.mid, yaw, 0.17, 0.05, -0.8 - (i % 3) * 0.05, 1.15, 1.24, 0);
    }
  }

  function onHead(b, yaw, pit, k, fn) {
    const p = headPoint(yaw, pit, k);
    b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(yaw), M4.rotX(-pit));
    fn(b);
    b.pop();
  }

  function crown(b) {
    onHead(b, 1.05, 0.62, 1.1, (h) => {
      h.push(M4.rotX(PI / 2 - 0.45), M4.rotZ(0.25), M4.scale(0.82));
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * PI * 2;
        h.at(S(a) * 0.052, 0.002, C(a) * 0.05, (c) => c.ellipsoid(0.022, 0.011, 0.016, 6, 3, WHITE));
      }
      h.prism(12, 0.044, 0.042, 0.0, 0.05, 0.047, 0.042, RED, { capBottom: true, capTop: false });
      h.prism(12, 0.047, 0.045, -0.002, 0.048, 0.046, 0.008, GOLD, { capTop: false });
      h.prism(12, 0.051, 0.048, 0.034, 0.052, 0.049, 0.044, GOLD, { capTop: false });
      h.at(0, 0.038, 0, (c) => c.ellipsoid(0.046, 0.03, 0.043, 10, 5, RED_DARK));
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * PI * 2;
        h.at(S(a) * 0.05, 0.044, C(a) * 0.047, (c) => {
          c.prism(4, 0.011, 0.007, 0, 0.002, 0.002, 0.022, GOLD, { phase: PI / 4 });
          c.at(0, 0.025, 0, (d) => d.ellipsoid(0.006, 0.006, 0.006, 6, 3, WHITE));
        });
      }
      [0, PI / 2].forEach(rot => {
        h.push(M4.rotY(rot));
        for (let i = 0; i < 7; i++) {
          const a0 = -PI / 2 + (i / 7) * PI, a1 = -PI / 2 + ((i + 1) / 7) * PI;
          const p0 = [S(a0) * 0.046, 0.044 + C(a0) * 0.04, 0], p1 = [S(a1) * 0.046, 0.044 + C(a1) * 0.04, 0];
          const w = 0.006;
          h.quad([p0[0], p0[1], -w], [p1[0], p1[1], -w], [p1[0], p1[1], w], [p0[0], p0[1], w], GOLD);
        }
        h.pop();
      });
      h.at(0, 0.094, 0, (c) => {
        c.box(0.006, 0.026, 0.006, GOLD);
        c.at(0, 0.004, 0, (d) => d.box(0.018, 0.006, 0.006, GOLD));
      });
      h.at(0, 0.02, 0.05, (c) => c.ellipsoid(0.011, 0.013, 0.007, 8, 4, GREEN));
      [-0.02, 0.0, 0.02].forEach((x, i) => {
        for (let k = 0; k < 4; k++) h.at(x - 0.035, -0.012 - k * 0.016 - i * 0.004, -0.03 + x * 0.6, (c) => c.ellipsoid(0.0065, 0.0065, 0.0065, 6, 3, WHITE));
      });
      h.pop();
    });
  }

  function pins(b) {
    onHead(b, -0.5, 0.36, 1.12, (h) => {
      [[0.62, RED], [-0.62, GOLD]].forEach(([a, col]) => {
        h.push(M4.rotZ(a));
        h.at(0, 0, 0.004, (c) => c.box(0.008, 0.05, 0.006, col));
        h.pop();
      });
      h.at(0.004, 0.034, 0.004, (c) => c.box(0.03, 0.006, 0.006, GOLD));
      h.at(0.004, 0.044, 0.004, (c) => c.box(0.026, 0.006, 0.006, GOLD));
    });
  }

  function earrings(b) {
    [-1, 1].forEach(s => b.at(s * R * 0.87, -R * 0.33, -R * 0.02, (h) => {
      h.ellipsoid(0.0055, 0.0055, 0.0055, 6, 3, GOLD);
      h.at(0, -0.013, 0, (c) => c.ellipsoid(0.0045, 0.008, 0.0045, 6, 3, GOLD));
    }));
  }

  function profile(d, y) {
    const bust = 0.5;
    const cz = d.depth * (0.98 + 0.12 * bust);
    if (y < 0.12) return [lerp(d.waist * 1.1, d.waist, (y + 0.02) / 0.14), lerp(d.depth * 0.95, d.depth * 0.9, (y + 0.02) / 0.14)];
    if (y < 0.26) return [lerp(d.waist, d.chest, (y - 0.12) / 0.14), lerp(d.depth * 0.9, cz, (y - 0.12) / 0.14)];
    if (y < 0.34) return [lerp(d.chest, d.chest * 1.02, (y - 0.26) / 0.08), lerp(cz, d.depth * 0.85, (y - 0.26) / 0.08)];
    return [lerp(d.chest * 1.02, 0.085, (y - 0.34) / (d.torso - 0.34)), lerp(d.depth * 0.85, 0.06, (y - 0.34) / (d.torso - 0.34))];
  }

  function surface(d, a, y, k, out) {
    const [rx, rz] = profile(d, y);
    return [S(a) * rx * k, y, C(a) * rz * k + (out || 0)];
  }

  function jacket(b, d) {
    const k = 1.05;
    const ys = [0.0, 0.06, 0.12, 0.19, 0.26, 0.3, 0.34, 0.37, d.torso];
    const n = 16;
    for (let j = 0; j < ys.length - 1; j++) {
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        const m = (a0 + a1) / 2;
        if (m < 0.62 || m > PI * 2 - 0.62) continue;
        const p00 = surface(d, a0, ys[j], k), p10 = surface(d, a1, ys[j], k), p11 = surface(d, a1, ys[j + 1], k), p01 = surface(d, a0, ys[j + 1], k);
        const nm = V3.norm([S(m), 0.1, C(m)]);
        b.quad(p00, p10, p11, p01, JACKET, null, [nm, nm, nm, nm]);
      }
    }
    [-1, 1].forEach(s => {
      for (let j = 0; j < ys.length - 2; j++) {
        const a0 = s * 0.6, a1 = s * 0.78;
        const p00 = surface(d, a0, ys[j], k, 0.002), p10 = surface(d, a1, ys[j], k, 0.002), p11 = surface(d, a1, ys[j + 1], k, 0.002), p01 = surface(d, a0, ys[j + 1], k, 0.002);
        b.quad(p00, p10, p11, p01, RED, null, NZ);
        const g0 = surface(d, s * 0.8, ys[j], k, 0.003), g1 = surface(d, s * 0.84, ys[j], k, 0.003), g2 = surface(d, s * 0.84, ys[j + 1], k, 0.003), g3 = surface(d, s * 0.8, ys[j + 1], k, 0.003);
        b.quad(g0, g1, g2, g3, GOLD, null, NZ);
      }
      [0.08, 0.16].forEach(y => {
        const p = surface(d, s * 0.92, y, k, 0.004);
        b.at(p[0], p[1], p[2], (h) => h.ellipsoid(0.007, 0.007, 0.004, 6, 3, GOLD));
      });
    });
    for (let j = 0; j < ys.length - 2; j++) {
      const a0 = PI - 0.16, a1 = PI + 0.16;
      b.quad(surface(d, a1, ys[j], k, -0.003), surface(d, a0, ys[j], k, -0.003), surface(d, a0, ys[j + 1], k, -0.003), surface(d, a1, ys[j + 1], k, -0.003), RED, null, NB);
    }
  }

  function collar(b, d) {
    const top = d.torso;
    [-1, 1].forEach(s => {
      b.tri([s * 0.012, top - 0.004, 0.07], [s * 0.078, top - 0.03, 0.058], [s * 0.032, top - 0.072, 0.092], RED, null, [[s * 0.3, 0.3, 1], [s * 0.3, 0.3, 1], [s * 0.3, 0.3, 1]]);
      b.tri([s * 0.012, top - 0.004, 0.07], [s * 0.032, top - 0.072, 0.092], [s * 0.004, top - 0.05, 0.08], RED_DARK, null, [[0, 0.2, 1], [0, 0.2, 1], [0, 0.2, 1]]);
    });
    [[top - 0.03, 0.026, 0.014], [top - 0.056, 0.032, 0.016], [top - 0.084, 0.026, 0.015]].forEach(([y, rx, ry]) => {
      const z = profile(d, Math.min(y, top - 0.001))[1] + 0.01;
      b.at(0, y, z, (h) => h.ellipsoid(rx, ry, 0.009, 10, 4, WHITE));
    });
    b.at(0, top - 0.012, 0.062, (h) => h.ellipsoid(0.01, 0.011, 0.008, 8, 4, GREEN));
  }

  function sash(b, d) {
    const k = 1.05;
    const path = [[0.13, 0.385], [0.085, 0.33], [0.035, 0.26], [-0.02, 0.18], [-0.065, 0.1], [-0.095, 0.03], [-0.11, -0.02]];
    const pt = (x, y, out) => {
      const [rx, rz] = profile(d, y);
      const f = Math.min(0.995, Math.abs(x) / (rx * k));
      return [x, y, rz * k * Math.sqrt(1 - f * f) + out];
    };
    for (let i = 0; i < path.length - 1; i++) {
      const [x0, y0] = path[i], [x1, y1] = path[i + 1];
      const dir = V3.norm([x1 - x0, y1 - y0, 0]);
      const nx = -dir[1], ny = dir[0];
      const w = 0.019;
      const quad = (lo, hi, out, col) => b.quad(pt(x0 + nx * w * lo, y0 + ny * w * lo, out), pt(x1 + nx * w * lo, y1 + ny * w * lo, out), pt(x1 + nx * w * hi, y1 + ny * w * hi, out), pt(x0 + nx * w * hi, y0 + ny * w * hi, out), col, null, NZ);
      quad(-1, 1, 0.006, RED);
      quad(-0.62, -0.42, 0.0072, GOLD);
      quad(0.42, 0.62, 0.0072, GOLD);
    }
  }

  function medal(b, d) {
    const [rx, rz] = profile(d, 0.27);
    const z = rz * 1.05 * Math.sqrt(1 - Math.pow(0.098 / (rx * 1.05), 2)) + 0.006;
    b.at(0.098, 0.275, z, (h) => {
      h.box(0.022, 0.03, 0.004, GREEN);
      h.at(0, -0.006, 0.001, (c) => c.box(0.006, 0.03, 0.004, RED));
      h.at(0, -0.03, 0.003, (c) => {
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * PI * 2, a1 = a + PI / 5;
          c.tri([0, 0, 0], [S(a) * 0.014, C(a) * 0.014, 0], [S(a1) * 0.006, C(a1) * 0.006, 0], GOLD, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
          c.tri([0, 0, 0], [S(a1) * 0.006, C(a1) * 0.006, 0], [S(a + (PI * 2) / 5) * 0.014, C(a + (PI * 2) / 5) * 0.014, 0], GOLD, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        }
      });
    });
  }

  const skirtPt = (a, r, y) => [S(a) * r, y, C(a) * r * 0.82];

  function skirtBand(b, a0, a1, n, top, hem, colA, colB, opts) {
    const o = opts || {};
    for (let i = 0; i < n; i++) {
      const u0 = a0 + ((a1 - a0) * i) / n, u1 = a0 + ((a1 - a0) * (i + 1)) / n;
      const h0 = hem(u0, i), h1 = hem(u1, i + 1);
      const t0 = top(u0), t1 = top(u1);
      const m0 = [lerp(t0[0], h0[0], 0.55) + (o.bulge || 0), lerp(t0[1], h0[1], 0.55)];
      const m1 = [lerp(t1[0], h1[0], 0.55) + (o.bulge || 0), lerp(t1[1], h1[1], 0.55)];
      const col = i % 2 ? colA : colB;
      const nm = V3.norm([S((u0 + u1) / 2), 0.3, C((u0 + u1) / 2)]);
      b.quad(skirtPt(u0, t0[0], t0[1]), skirtPt(u1, t1[0], t1[1]), skirtPt(u1, m1[0], m1[1]), skirtPt(u0, m0[0], m0[1]), col, null, [nm, nm, nm, nm]);
      b.quad(skirtPt(u0, m0[0], m0[1]), skirtPt(u1, m1[0], m1[1]), skirtPt(u1, h1[0], h1[1]), skirtPt(u0, h0[0], h0[1]), col, null, [nm, nm, nm, nm]);
      if (o.trim) {
        b.quad(skirtPt(u0, h0[0], h0[1]), skirtPt(u1, h1[0], h1[1]), skirtPt(u1, h1[0] + 0.004, h1[1] - o.trim), skirtPt(u0, h0[0] + 0.004, h0[1] - o.trim), GOLD, null, [nm, nm, nm, nm]);
      }
    }
  }

  function idolSkirt(b) {
    const back = (a) => (1 - C(a)) / 2;
    skirtBand(b, 1.1, PI * 2 - 1.1, 24, () => [0.14, 0.075], (a, i) => [0.25 + 0.07 * back(a) + (i % 2 ? 0.012 : -0.004), -0.2 - 0.3 * Math.pow(back(a), 1.6) + (i % 2 ? 0.012 : 0)], TRAIN, TRAIN_HI, { trim: 0.014, bulge: 0.02 });
    skirtBand(b, 1.3, PI * 2 - 1.3, 20, () => [0.145, 0.07], (a, i) => [0.23 + 0.05 * back(a) + (i % 2 ? 0.01 : 0), -0.12 - 0.12 * back(a) + (i % 2 ? 0.01 : 0)], TRAIN_HI, TRAIN, { trim: 0.01, bulge: 0.015 });
    skirtBand(b, -0.62, 0.62, 16, () => [0.138, 0.075], () => [0.21, -0.25], WHITE, STOCK, { bulge: 0.012 });
    [-1, 1].forEach(s => {
      [[0.075, -0.05, 0.142, 0.21], [0.02, -0.12, 0.168, 0.24], [-0.045, -0.19, 0.192, 0.266]].forEach(([yt, yh, rt, rh], k) => {
        const a0 = s > 0 ? 0.3 + k * 0.06 : -(2.25 - k * 0.1), a1 = s > 0 ? 2.25 - k * 0.1 : -(0.3 + k * 0.06);
        skirtBand(b, a0, a1, 10, () => [rt, yt], (a, i) => [rh + (i % 2 ? 0.012 : 0), yh + (i % 2 ? 0.014 : 0)], RED, RED_DARK, { trim: 0.01, bulge: 0.008 });
      });
    });
    const p = skirtPt(-0.62, 0.178, 0.035);
    b.push(M4.translate(p[0], p[1], p[2] + 0.02), M4.rotY(-0.62));
    [-1, 1].forEach(s => {
      b.push(M4.translate(s * 0.036, 0.004, 0), M4.rotZ(s * 0.35));
      b.ellipsoid(0.036, 0.022, 0.012, 8, 4, GREEN);
      b.at(0, 0, 0.004, (h) => h.ellipsoid(0.026, 0.014, 0.01, 8, 4, RED));
      b.pop();
      b.push(M4.translate(s * 0.012, -0.012, 0.004), M4.rotZ(s * 0.25));
      b.quad([-0.009, 0, 0], [0.009, 0, 0], [0.011, -0.07, 0.006], [-0.007, -0.07, 0.006], RED, null, NZ);
      b.pop();
    });
    b.at(0, 0.002, 0.012, (h) => h.ellipsoid(0.014, 0.016, 0.01, 8, 4, GOLD));
    b.pop();
  }

  function stripedTube(b, y0, y1, r0x, r0z, r1x, r1z, n, colA, colB) {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const n0 = [S(a0), 0, C(a0)], n1 = [S(a1), 0, C(a1)];
      b.quad([S(a0) * r0x, y0, C(a0) * r0z], [S(a1) * r0x, y0, C(a1) * r0z], [S(a1) * r1x, y1, C(a1) * r1z], [S(a0) * r1x, y1, C(a0) * r1z], i % 2 ? colA : colB, null, [n0, n1, n1, n0]);
    }
  }

  const TOP = 0.68;
  const stripesThigh = (b, d) => stripedTube(b, -d.thigh, -d.thigh + TOP * (d.thigh + 0.03), 0.0462, 0.0482, lerp(0.045, 0.072, TOP) + 0.0012, lerp(0.047, 0.075, TOP) + 0.0012, 24, WHITE, STOCK);
  const stripesShin = (b, d) => stripedTube(b, -d.shin + 0.04, 0, 0.0348, 0.0368, 0.0452, 0.0472, 24, WHITE, STOCK);
  const garter = (b, d) => b.at(0, -0.045, 0.071, (h) => h.box(0.009, 0.13, 0.004, STOCK));
  const anklet = (b, d) => {
    b.prism(12, 0.036, 0.038, -d.shin + 0.02, 0.036, 0.038, -d.shin + 0.032, GOLD, { capTop: false });
    b.at(0, -d.shin + 0.026, 0.038, (h) => h.ellipsoid(0.007, 0.007, 0.004, 6, 3, RED));
  };
  const puff = (b) => b.at(0, -0.035, 0, (h) => h.ellipsoid(0.057, 0.066, 0.057, 10, 6, JACKET));
  const cuff = (b) => {
    b.prism(12, 0.05, 0.05, -0.122, 0.052, 0.052, -0.086, RED, { capTop: false });
    b.prism(12, 0.052, 0.052, -0.126, 0.052, 0.052, -0.119, GOLD, { capTop: false });
  };
  const bracelet = (b, d) => {
    b.prism(12, 0.037, 0.038, -d.fore + 0.012, 0.037, 0.038, -d.fore + 0.052, GOLD, { capTop: false });
    b.prism(12, 0.0385, 0.0395, -d.fore + 0.024, 0.0385, 0.0395, -d.fore + 0.04, RED, { capTop: false });
  };
  const frill = (b, d) => b.prism(12, 0.034, 0.035, -d.fore + 0.012, 0.054, 0.054, -d.fore - 0.018, WHITE, { capTop: false });

  const FORMS = {
    mioStep: {
      person: 'mio', skin: SKIN, hair: 'mio', bust: 0.5,
      torso: { body: CORSET, shoulder: JACKET, neck: SKIN },
      torsoExtras: [jacket, collar, sash, medal],
      hips: CORSET,
      skirt: { build: idolSkirt },
      arm: { upper: [[0, 0.5, SKIN], [0.5, 1, JACKET]], fore: [[0, 0.07, GLOVE], [0.07, 1, SKIN]], hand: GLOVE, upperExtras: [puff, cuff], foreExtras: [bracelet, frill] },
      leg: { thigh: [[0, TOP, STOCK], [TOP, TOP + 0.05, 0x2e2a3a], [TOP + 0.05, 1, SKIN]], shin: [[0, 1, STOCK]], shoe: { type: 'heel', col: SHOE, sole: SHOE }, thighExtras: [garter], shinExtras: [anklet] },
      legL: { thighExtras: [garter, stripesThigh], shinExtras: [anklet, stripesShin] },
      gear: [crown, pins, earrings]
    }
  };
  Object.assign(Cast.FORMS, FORMS);

  window.P3DStepCast = { FORMS, paintFace, faceParts, dims: HER };
})();
