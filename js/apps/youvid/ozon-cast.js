(function () {
  const { M4, V3, shade } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, mesh, spherePatch } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const DIMS = {
    ozon: { hipX: 0.13, hipY: -0.05, thigh: 0.46, shin: 0.45, chestY: 0.13, neckY: 0.35, shX: 0.245, shY: 0.24, upper: 0.31, fore: 0.28, headY: 0.15, head: 0.112 },
    kirya: { hipX: 0.1, hipY: -0.05, thigh: 0.45, shin: 0.44, chestY: 0.12, neckY: 0.305, shX: 0.2, shY: 0.215, upper: 0.29, fore: 0.26, headY: 0.135, head: 0.101 },
    lysy: { hipX: 0.12, hipY: -0.05, thigh: 0.45, shin: 0.44, chestY: 0.12, neckY: 0.325, shX: 0.23, shY: 0.225, upper: 0.3, fore: 0.27, headY: 0.14, head: 0.108 },
    guest: { hipX: 0.12, hipY: -0.05, thigh: 0.45, shin: 0.44, chestY: 0.12, neckY: 0.33, shX: 0.235, shY: 0.225, upper: 0.3, fore: 0.27, headY: 0.14, head: 0.107 }
  };

  const RINGS = {
    heavy: [[-0.2, 0.25, 0.2, 0.03], [-0.12, 0.3, 0.25, 0.07], [-0.02, 0.315, 0.26, 0.08], [0.08, 0.31, 0.245, 0.06], [0.17, 0.3, 0.22, 0.03], [0.25, 0.28, 0.19, 0.0], [0.31, 0.235, 0.16, -0.015], [0.35, 0.16, 0.12, -0.015], [0.375, 0.1, 0.09, 0.0]],
    slim: [[-0.2, 0.155, 0.115, 0.0], [-0.08, 0.162, 0.115, 0.0], [0.05, 0.178, 0.118, 0.005], [0.16, 0.2, 0.124, 0.0], [0.24, 0.205, 0.116, -0.005], [0.29, 0.165, 0.1, -0.01], [0.32, 0.095, 0.075, 0.0]],
    mid: [[-0.2, 0.2, 0.15, 0.015], [-0.08, 0.215, 0.16, 0.025], [0.05, 0.225, 0.162, 0.022], [0.16, 0.235, 0.15, 0.01], [0.25, 0.228, 0.135, 0.0], [0.31, 0.175, 0.112, -0.01], [0.345, 0.1, 0.08, 0.0]]
  };

  const PEOPLE = {
    ozon: {
      body: 'heavy', skin: 0xdcae98, hair: 0x3a2a20, hairHi: 0x4a3828, brow: '#2e2018', beard: 0x3e2c20, beardCss: 'rgba(58, 40, 28, 0.94)',
      cap: [0.62, 0.42, -0.25], eyes: ['open', 'half', 'shut', 'wide', 'squint'], mouths: ['shut', 'open', 'wide', 'grin'], iris: '#4a3a2c',
      outfits: {
        hoodie: { top: 0xc8401e, upper: 0x1c1c1e, fore: 0xc8401e, cuff: 0x1c1c1e, pants: 0x22232a, shin: 0x22232a, shoe: 0x18181a, hood: 0x1c1c1e },
        tee: { top: 0x161618, upper: 0x161618, short: true, pants: 0x1a1b20, shin: 0x1a1b20, shoe: 0x101012 },
        grey: { top: 0x3c3f46, upper: 0x3c3f46, short: true, pants: 0x18181c, shin: 0x18181c, shoe: 0x101012, print: 'extasy' },
        print: { top: 0x141416, upper: 0x141416, short: true, pants: 0x1a1b20, shin: 0x1a1b20, shoe: 0x101012, print: 'ozoni' }
      }
    },
    kirya: {
      body: 'slim', skin: 0xe2b8a2, hair: 0x7a5a3a, hairHi: 0x8e6c48, brow: '#5a3e28',
      cap: [0.5, 0.25, -0.4], eyes: ['open', 'half', 'shut', 'wide'], mouths: ['shut', 'open', 'wide', 'grin'], iris: '#5a6a74',
      outfits: {
        track: { top: 0x141416, upper: 0x141416, fore: 0x141416, cuff: 0x0c0c0e, pants: 0x18181a, shorts: true, shin: 0xe2b8a2, shoe: 0x101012, stripes: true, zip: true }
      }
    },
    lysy: {
      body: 'mid', skin: 0xd4a68c, hair: null, brow: '#3a2a20', stubble: 'rgba(80, 64, 54, 0.62)',
      cap: null, eyes: ['open', 'squint'], mouths: ['shut', 'grin', 'open'], iris: '#3a2c22',
      outfits: {
        hoodie: { top: 0x18181c, upper: 0x18181c, fore: 0x18181c, cuff: 0x101012, pants: 0x1a1a1e, shin: 0x1a1a1e, shoe: 0x101012, print: 'lysy', hood: 0x141418 }
      }
    },
    guest: {
      body: 'mid', skin: 0xd8ac94, hair: 0x2a2018, hairHi: 0x3a2c20, brow: '#2a2018',
      cap: [0.5, 0.25, -0.5], eyes: ['open'], mouths: ['shut'], iris: '#3a2c22',
      outfits: {
        jacket: { top: 0x1e2534, upper: 0x1e2534, fore: 0x1e2534, cuff: 0x161a24, pants: 0x1a1a1e, shin: 0x1a1a1e, shoe: 0x101012 },
        hood: { top: 0x121214, upper: 0x121214, fore: 0x121214, cuff: 0x0c0c0e, pants: 0x1a1a1e, shin: 0x1a1a1e, shoe: 0x101012, hood: 0x121214, hoodUp: true, strings: true }
      }
    }
  };

  function ringsOf(kind) {
    return RINGS[kind];
  }

  function surfaceAt(kind, y) {
    const R = ringsOf(kind);
    for (let i = 0; i < R.length - 1; i++) {
      const a = R[i], b = R[i + 1];
      if (y <= b[0]) {
        const k = clamp((y - a[0]) / (b[0] - a[0]), 0, 1);
        return { rx: a[1] + (b[1] - a[1]) * k, rz: a[2] + (b[2] - a[2]) * k, cz: a[3] + (b[3] - a[3]) * k };
      }
    }
    const l = R[R.length - 1];
    return { rx: l[1], rz: l[2], cz: l[3] };
  }

  function buildTorso(b, kind, o, skin) {
    const R = ringsOf(kind);
    const n = R.length;
    loft(b, R.map(([y, rx, rz, cz], i) => ring(y, rx, rz, cz, i === n - 1 ? skin : o.top)), 16, { capBottom: true });
    if (o.hood) {
      const top = R[n - 2];
      b.push(M4.translate(0, top[0] + 0.02, top[3] - top[2] * 0.6), M4.rotX(o.hoodUp ? -0.2 : 0.5));
      b.ellipsoid(top[1] * 0.85, 0.07, 0.09, 10, 5, o.hood);
      b.pop();
    }
    if (o.zip) {
      const pts = [];
      for (let y = R[0][0]; y <= R[n - 2][0]; y += 0.05) {
        const s = surfaceAt(kind, y);
        pts.push([0, y, s.cz + s.rz * 1.004]);
      }
      K.tube(b, pts, pts.map(() => 0.004), 4, 0xd8d8dc);
    }
    if (o.strings) {
      [-1, 1].forEach(s => K.tube(b, [[s * 0.04, 0.3, 0.1], [s * 0.045, 0.18, 0.15], [s * 0.04, 0.1, 0.16]], [0.004, 0.004, 0.004], 4, 0xe8e8ea));
    }
  }

  function buildPrint(b, kind, y0, y1, a0, a1) {
    const nu = 10, nv = 6;
    const pt = (u, v) => {
      const y = y0 + (y1 - y0) * v;
      const s = surfaceAt(kind, y);
      const a = a0 + (a1 - a0) * u;
      return [S(a) * s.rx * 1.012, y, s.cz + C(a) * s.rz * 1.012];
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const am = a0 + (a1 - a0) * (u0 + u1) / 2;
        const n = V3.norm([S(am), 0, C(am)]);
        b.quad(pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1), [1, 1, 1, 0.15], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], [n, n, n, n]);
      }
    }
  }

  function printTex(kind) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#ededed';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (kind === 'ozoni') {
        ctx.font = `bold ${Math.round(h * 0.34)}px Georgia, serif`;
        ctx.save();
        ctx.translate(w / 2, h * 0.3);
        ctx.scale(1.1, 1);
        ctx.fillText('OZONI', 0, 0);
        ctx.restore();
        for (let i = 0; i < 4; i++) {
          const y = h * (0.56 + i * 0.08), half = w * (0.26 - i * 0.05);
          ctx.fillRect(w / 2 - half, y, half * 0.9, h * 0.04);
          ctx.fillRect(w / 2 + half * 0.1, y, half * 0.9, h * 0.04);
        }
      } else if (kind === 'extasy') {
        ctx.font = `bold ${Math.round(h * 0.2)}px Arial, sans-serif`;
        ctx.fillText('EXTASY', w / 2, h * 0.3);
        ctx.font = `bold ${Math.round(h * 0.09)}px Arial, sans-serif`;
        ctx.fillText('NIGHT · CLUB · 98', w / 2, h * 0.52);
      } else {
        ctx.font = `bold ${Math.round(h * 0.2)}px Arial, sans-serif`;
        ctx.fillText('STREET', w / 2, h * 0.3);
        ctx.fillRect(w * 0.2, h * 0.5, w * 0.6, h * 0.05);
        ctx.font = `bold ${Math.round(h * 0.12)}px Arial, sans-serif`;
        ctx.fillText('TEAM 98', w / 2, h * 0.7);
      }
    };
  }

  function buildPelvis(b, kind, o) {
    const w = kind === 'heavy' ? 1.25 : kind === 'slim' ? 0.82 : 1.0;
    loft(b, [ring(-0.17, 0.15 * w, 0.12 * w, -0.01, o.pants), ring(-0.09, 0.19 * w, 0.15 * w, -0.01, o.pants), ring(0.02, 0.2 * w, 0.16 * w, 0.0, o.pants), ring(0.09, 0.2 * w, 0.16 * w, 0.01, o.pants)], 14, { capBottom: true, capTop: true });
  }

  function buildUpper(b, D, o, skin, k) {
    const sl = o.upper;
    b.ellipsoid(0.08 * k, 0.075 * k, 0.08 * k, 8, 5, sl);
    const low = o.short ? skin : sl;
    const rings = [ring(-D.upper - 0.01, 0.056 * k, 0.058 * k, 0, low), ring(-0.18, 0.066 * k, 0.068 * k, 0, low)];
    if (o.short) rings.push(ring(-0.14, 0.068 * k, 0.07 * k, 0, low), ring(-0.14, 0.078 * k, 0.08 * k, 0, sl));
    rings.push(ring(-0.04, 0.078 * k, 0.08 * k, 0, sl), ring(0.03, 0.074 * k, 0.076 * k, 0, sl));
    loft(b, rings, 10, { capBottom: true });
    if (o.stripes) {
      [-1, 1].forEach(s => {
        b.push(M4.rotY(s * 0.18));
        b.at(0, -D.upper * 0.48, 0.066 * k, h => h.box(0.012, D.upper * 1.02, 0.012, 0xeeeeee));
        b.pop();
      });
    }
  }

  function buildFore(b, D, o, skin, k) {
    const col = o.short ? skin : o.fore;
    b.ellipsoid(0.058 * k, 0.058 * k, 0.058 * k, 8, 5, o.short ? skin : col);
    loft(b, [ring(-D.fore + 0.005, 0.042 * k, 0.045 * k, 0, col), ring(-0.16, 0.052 * k, 0.055 * k, 0, col), ring(0.0, 0.056 * k, 0.058 * k, 0, col)], 10, { capBottom: true });
    if (!o.short) b.at(0, -D.fore + 0.02, 0, h => h.prism(10, 0.048 * k, 0.05 * k, -0.02, 0.046 * k, 0.048 * k, 0.025, o.cuff || shade(col, 0.75)));
    if (o.stripes) {
      [-1, 1].forEach(s => {
        b.push(M4.rotY(s * 0.18));
        b.at(0, -D.fore * 0.5, 0.05 * k, h => h.box(0.011, D.fore * 0.95, 0.012, 0xeeeeee));
        b.pop();
      });
    }
  }

  function buildHand(b, skin, side, grip, k) {
    const inward = side === 'L' ? -1 : 1;
    const sk = skin;
    b.at(0, -0.045 * k, 0, h => h.box(0.03 * k, 0.09 * k, 0.085 * k, sk));
    if (grip === 'fist') {
      b.at(inward * 0.012 * k, -0.1 * k, 0, h => h.box(0.05 * k, 0.045 * k, 0.08 * k, sk));
    } else if (grip === 'grip') {
      b.push(M4.translate(inward * 0.01 * k, -0.09 * k, 0), M4.rotZ(-inward * 0.9));
      b.at(0, -0.035 * k, 0, h => h.box(0.026 * k, 0.07 * k, 0.08 * k, sk));
      b.pop();
    } else if (grip === 'point') {
      b.at(inward * 0.012 * k, -0.095 * k, -0.012 * k, h => h.box(0.045 * k, 0.04 * k, 0.06 * k, sk));
      b.at(0, -0.12 * k, 0.03 * k, h => h.box(0.022 * k, 0.075 * k, 0.022 * k, sk));
    } else if (grip === 'cig' || grip === 'phone') {
      b.at(inward * 0.016 * k, -0.1 * k, 0, h => h.box(0.032 * k, 0.05 * k, 0.078 * k, sk));
      b.at(inward * 0.01 * k, -0.06 * k, 0.045 * k, h => h.box(0.026 * k, 0.05 * k, 0.022 * k, sk));
    } else if (grip === 'open') {
      b.at(0, -0.125 * k, 0, h => h.box(0.022 * k, 0.075 * k, 0.082 * k, sk));
    } else {
      b.push(M4.translate(0, -0.09 * k, 0), M4.rotZ(-inward * 0.35));
      b.at(0, -0.032 * k, 0, h => h.box(0.024 * k, 0.065 * k, 0.08 * k, sk));
      b.pop();
    }
    b.push(M4.translate(inward * 0.012 * k, -0.03 * k, 0.05 * k), M4.rotX(-0.5));
    b.at(0, -0.025 * k, 0, h => h.box(0.022 * k, 0.05 * k, 0.022 * k, sk));
    b.pop();
  }

  function buildThigh(b, D, o, k) {
    const col = o.pants;
    const len = o.shorts ? D.thigh * 0.82 : D.thigh + 0.02;
    loft(b, [ring(-len, 0.08 * k, 0.082 * k, 0, col), ring(-0.3, 0.092 * k, 0.096 * k, 0, col), ring(-0.12, 0.108 * k, 0.112 * k, 0.005, col), ring(0.05, 0.115 * k, 0.115 * k, 0, col)], 10, { capBottom: true, capTop: true });
    if (o.shorts) loft(b, [ring(-D.thigh - 0.01, 0.058 * k, 0.06 * k, 0, o.shin), ring(-len + 0.02, 0.07 * k, 0.072 * k, 0, o.shin)], 10, { capBottom: true });
  }

  function buildShin(b, D, o, k) {
    const col = o.shin;
    b.ellipsoid(0.066 * k, 0.064 * k, 0.07 * k, 8, 5, col);
    loft(b, [ring(-D.shin + 0.02, 0.046 * k, 0.048 * k, 0, col), ring(-0.3, 0.056 * k, 0.062 * k, 0, col), ring(-0.12, 0.062 * k, 0.068 * k, 0.005, col), ring(0, 0.066 * k, 0.07 * k, 0, col)], 10, { capBottom: true });
  }

  function buildFoot(b, o, slides) {
    const F = o.shoe;
    b.at(0, -0.04, 0, h => h.ellipsoid(0.048, 0.042, 0.052, 7, 4, slides ? 0x2a2a2c : F));
    b.push(M4.translate(0, -0.065, 0.06));
    b.box(0.095, 0.055, 0.22, F);
    b.pop();
  }

  function buildHead(b, P, R) {
    const sk = P.skin;
    b.ellipsoid(R * 0.98, R * 1.06, R * 1.0, 14, 10, sk);
    [-1, 1].forEach(s => b.at(s * R * 0.96, -R * 0.06, -R * 0.04, h => h.ellipsoid(R * 0.12, R * 0.24, R * 0.17, 6, 4, shade(sk, 0.86))));
    b.at(0, -R * 0.14, R * 0.98, h => h.ellipsoid(R * 0.16, R * 0.2, R * 0.17, 6, 4, shade(sk, 0.95)));
    if (P.beard) {
      b.at(0, -R * 0.84, R * 0.12, h => h.ellipsoid(R * 0.74, R * 0.4, R * 0.7, 10, 5, P.beard));
      [-1, 1].forEach(s => b.at(s * R * 0.62, -R * 0.5, R * 0.2, h => h.ellipsoid(R * 0.36, R * 0.42, R * 0.6, 8, 4, P.beard)));
    }
  }

  function buildHair(b, P, R) {
    if (!P.cap) return;
    const [front, side, back] = P.cap;
    const H = P.hair, Hi = P.hairHi;
    const nu = 18, nv = 5;
    const lower = (yaw) => {
      const a = Math.abs(yaw);
      if (a < 0.9) return front - 0.08 * C(yaw * 2);
      if (a < 1.9) return side;
      return back;
    };
    const pt = (i, j) => {
      const yaw = -PI + (i / nu) * 2 * PI;
      const p0 = lower(yaw);
      const pit = p0 + (PI / 2 - p0) * (j / nv);
      const k = 1.045 + (j > 0 && j < nv ? 0.02 * S(i * 2.3 + j * 1.7) : 0);
      return [S(yaw) * C(pit) * R * 0.98 * k, S(pit) * R * 1.06 * k + R * 0.015, C(yaw) * C(pit) * R * k];
    };
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) b.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), (i + j) % 4 === 0 ? Hi : H);
  }

  function drawFace(P, eyes, mouth) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (P.beardCss) {
        ctx.fillStyle = P.beardCss;
        ctx.beginPath();
        ctx.moveTo(10, 120);
        ctx.quadraticCurveTo(30, 170, 74, 172);
        ctx.quadraticCurveTo(102, 160, 128, 164);
        ctx.quadraticCurveTo(154, 160, 182, 172);
        ctx.quadraticCurveTo(226, 170, 246, 120);
        ctx.lineTo(256, 256);
        ctx.lineTo(0, 256);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(96, 178);
        ctx.quadraticCurveTo(128, 162, 160, 178);
        ctx.quadraticCurveTo(128, 172, 96, 178);
        ctx.fill();
      }
      if (P.stubble) {
        ctx.fillStyle = P.stubble;
        ctx.beginPath();
        ctx.moveTo(30, 150);
        ctx.quadraticCurveTo(128, 240, 226, 150);
        ctx.lineTo(226, 256);
        ctx.lineTo(30, 256);
        ctx.closePath();
        ctx.fill();
      }
      const ey = 78;
      ctx.strokeStyle = P.brow;
      ctx.lineWidth = 7.5;
      [[83, -1], [173, 1]].forEach(([x, s]) => {
        const lift = eyes === 'wide' ? -6 : eyes === 'squint' ? 4 : 0;
        ctx.beginPath();
        ctx.moveTo(x - s * 23, ey - 18 + lift);
        ctx.quadraticCurveTo(x, ey - 27 + lift, x + s * 23, ey - 20 + lift + (eyes === 'squint' ? 4 : 0));
        ctx.stroke();
      });
      [83, 173].forEach(x => {
        if (eyes === 'shut' || eyes === 'squint') {
          ctx.strokeStyle = '#2a1c16';
          ctx.lineWidth = eyes === 'squint' ? 5 : 4;
          ctx.beginPath();
          if (eyes === 'squint') {
            ctx.moveTo(x - 16, ey + 4);
            ctx.quadraticCurveTo(x, ey - 4, x + 16, ey + 4);
          } else {
            ctx.moveTo(x - 15, ey + 1);
            ctx.quadraticCurveTo(x, ey + 6, x + 15, ey + 1);
          }
          ctx.stroke();
          return;
        }
        const tall = eyes === 'wide' ? 9 : eyes === 'half' ? 4 : 6.8;
        ctx.fillStyle = '#efe6e0';
        ctx.beginPath();
        ctx.ellipse(x, ey + 2, 14.5, tall, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = P.iris;
        ctx.beginPath();
        ctx.arc(x, ey + 2 + (eyes === 'half' ? 1 : 0), Math.min(6.2, tall + 0.8), 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#100c0c';
        ctx.beginPath();
        ctx.arc(x, ey + 2, 2.6, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2e1e18';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x - 15, ey + 2 - tall * 0.6);
        ctx.quadraticCurveTo(x, ey - tall - 2, x + 15, ey + 2 - tall * 0.6);
        ctx.stroke();
      });
      ctx.fillStyle = 'rgba(140, 86, 70, 0.62)';
      ctx.beginPath();
      ctx.ellipse(128, 138, 13, 5.5, 0, 0, PI * 2);
      ctx.fill();
      const my = 190;
      ctx.fillStyle = '#3a1616';
      ctx.strokeStyle = '#6e3a34';
      ctx.lineWidth = 4;
      if (mouth === 'shut') {
        ctx.beginPath();
        ctx.moveTo(108, my);
        ctx.quadraticCurveTo(128, my + 3, 148, my);
        ctx.stroke();
      } else if (mouth === 'grin') {
        ctx.beginPath();
        ctx.moveTo(100, my - 4);
        ctx.quadraticCurveTo(128, my + 22, 156, my - 4);
        ctx.quadraticCurveTo(128, my + 6, 100, my - 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ece4da';
        ctx.fillRect(110, my - 2, 36, 5);
      } else {
        const hh = mouth === 'wide' ? 15 : 8;
        ctx.beginPath();
        ctx.ellipse(128, my + 2, mouth === 'wide' ? 20 : 15, hh, 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
        if (mouth === 'wide') {
          ctx.fillStyle = '#e4dcd2';
          ctx.fillRect(115, my - hh + 4, 26, 4);
        }
      }
      ctx.restore();
    };
  }

  function buildPerson(r, who) {
    const P = PEOPLE[who];
    const D = DIMS[who];
    const R = D.head;
    const k = P.body === 'heavy' ? 1.18 : P.body === 'slim' ? 0.88 : 1.02;
    const faces = {};
    P.eyes.forEach(e => P.mouths.forEach(mo => { faces[e + '-' + mo] = r.texture(256, drawFace(P, e, mo), { clamp: true }); }));
    const outfits = {};
    Object.keys(P.outfits).forEach(name => {
      const o = P.outfits[name];
      const hands = {};
      ['L', 'R'].forEach(s => ['relax', 'open', 'fist', 'grip', 'point', 'cig', 'phone'].forEach(gr => { hands[s + gr] = mesh(r, b => buildHand(b, P.skin, s, gr, k)); }));
      outfits[name] = {
        torso: mesh(r, b => buildTorso(b, P.body, o, P.skin)),
        print: o.print ? mesh(r, b => buildPrint(b, P.body, 0.06, 0.26, -0.7, 0.7)) : null,
        printTex: o.print ? r.texture(256, printTex(o.print), { height: 128, clamp: true }) : null,
        pelvis: mesh(r, b => buildPelvis(b, P.body, o)),
        upper: mesh(r, b => buildUpper(b, D, o, P.skin, k)),
        fore: mesh(r, b => buildFore(b, D, o, P.skin, k)),
        hands,
        thigh: mesh(r, b => buildThigh(b, D, o, k)),
        shin: mesh(r, b => buildShin(b, D, o, k)),
        foot: mesh(r, b => buildFoot(b, o, o.shorts)),
        hoodUp: o.hoodUp ? mesh(r, b => b.at(0, R * 0.12, -R * 0.12, h => h.ellipsoid(R * 1.25, R * 1.3, R * 1.3, 12, 7, o.hood))) : null
      };
    });
    return {
      faces,
      neck: mesh(r, b => loft(b, [ring(-0.06, 0.07 * k, 0.065 * k, 0, P.skin), ring(0.1, 0.065 * k, 0.06 * k, 0.01, P.skin)], 10)),
      head: mesh(r, b => buildHead(b, P, R)),
      hair: P.cap ? mesh(r, b => buildHair(b, P, R)) : null,
      face: mesh(r, b => spherePatch(b, R * 0.987, R * 1.067, R * 1.008, -0.95, 0.95, -0.74, 0.42, 12, 9, [1, 1, 1, 0], [1, 1])),
      outfits
    };
  }

  function build(r) {
    const out = {};
    Object.keys(PEOPLE).forEach(who => { out[who] = buildPerson(r, who); });
    out.cig = mesh(r, b => {
      b.push(M4.rotX(PI / 2));
      b.prism(6, 0.0045, 0.0045, 0, 0.0045, 0.0045, 0.07, 0xf2f0ec, { capBottom: true });
      b.prism(6, 0.0047, 0.0047, 0, 0.0047, 0.0047, 0.02, 0xd08a40);
      b.at(0, 0.071, 0, h => h.ellipsoid(0.005, 0.004, 0.005, 5, 3, [1, 0.45, 0.12, 1]));
      b.pop();
    });
    out.phone = mesh(r, b => {
      b.box(0.075, 0.15, 0.01, 0x121214);
      b.at(0, 0, 0.0055, h => h.box(0.066, 0.135, 0.001, [0.55, 0.7, 0.85, 1]));
    });
    return out;
  }

  function solve(who, pose) {
    const D = DIMS[who];
    const yaw = pose.yaw || 0;
    const lean = pose.lean || 0;
    const roll = pose.roll || 0;
    const cy = C(yaw), sy = S(yaw);
    const fwd = pose.fwd || [sy, -lean, cy];
    const up = pose.up || [S(roll) * cy, C(roll), -S(roll) * sy];
    const p = Object.assign({}, pose, { p: pose.pos || [0, 0.95, 0], fwd, up });
    let m = Rig.solve(p, D);
    const FLOOR = 0.05;
    const knee = Math.min(m.pts.kneeL[1], m.pts.kneeR[1]);
    if (knee < FLOOR) {
      p.p = [p.p[0], p.p[1] + FLOOR - knee + 0.01, p.p[2]];
      m = Rig.solve(p, D);
    }
    let fix = false;
    ['L', 'R'].forEach(s => {
      const w = m.pts['wrist' + s], e = m.pts['elbow' + s];
      if (w[1] < FLOOR || e[1] < FLOOR) {
        p['h' + s + 'w'] = [w[0], Math.max(FLOOR + 0.02, w[1]), w[2]];
        if (e[1] < FLOOR) p['e' + s + 'w'] = [e[0], FLOOR + 0.3, e[2]];
        fix = true;
      }
    });
    return fix ? Rig.solve(p, D) : m;
  }

  function draw(r, V, who, m, pose, opts) {
    const o = opts || {};
    const pass = o.alpha ? { blend: true, alpha: o.alpha } : {};
    const P = PEOPLE[who];
    const CM = V[who];
    const name = pose.outfit && CM.outfits[pose.outfit] ? pose.outfit : Object.keys(CM.outfits)[0];
    const O = CM.outfits[name];
    r.draw(O.pelvis, m.pelvis, pass);
    r.draw(O.torso, m.chest, pass);
    if (O.print) r.draw(O.print, m.chest, Object.assign({ texture: O.printTex }, pass));
    r.draw(CM.neck, m.neck, pass);
    r.draw(CM.head, m.head, pass);
    if (!o.noFace) {
      const e = P.eyes.includes(pose.eyes) ? pose.eyes : P.eyes[0];
      const mo = P.mouths.includes(pose.mouth) ? pose.mouth : P.mouths[0];
      r.draw(CM.face, m.head, Object.assign({ texture: CM.faces[e + '-' + mo] }, pass));
    }
    if (CM.hair) r.draw(CM.hair, m.head, pass);
    if (O.hoodUp) r.draw(O.hoodUp, m.head, pass);
    ['L', 'R'].forEach(s => {
      r.draw(O.upper, m['upper' + s], pass);
      r.draw(O.fore, m['fore' + s], pass);
      const gr = pose['g' + s] || 'relax';
      r.draw(O.hands[s + gr] || O.hands[s + 'relax'], m['hand' + s], pass);
      if (!pose.noLegs) {
        r.draw(O.thigh, m['thigh' + s], pass);
        r.draw(O.shin, m['shin' + s], pass);
        r.draw(O.foot, m['foot' + s], pass);
      }
    });
    if (pose.gR === 'cig' || pose.gL === 'cig') {
      const s = pose.gR === 'cig' ? 'R' : 'L';
      r.draw(V.cig, M4.chain(m['hand' + s], M4.translate(0, -0.09, 0.05), M4.rotX(0.3)), pass);
    }
    if (pose.gR === 'phone' || pose.gL === 'phone') {
      const s = pose.gR === 'phone' ? 'R' : 'L';
      r.draw(V.phone, M4.chain(m['hand' + s], M4.translate(s === 'R' ? 0.03 : -0.03, -0.11, 0.0), M4.rotY(s === 'R' ? -PI / 2 : PI / 2)), pass);
    }
  }

  window.OzonCast = { DIMS, PEOPLE, build, solve, draw };
})();
