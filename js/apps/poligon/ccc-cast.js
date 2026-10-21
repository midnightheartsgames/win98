(function () {
  const { M4, V3, Builder, shade, rgb } = window.P3D;
  const { Figure } = window.P3DFigure;

  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;

  const HER = { hip: 0.078, thigh: 0.4, shin: 0.38, sole: 0.055, shoulder: 0.158, upper: 0.25, fore: 0.21, torso: 0.4, waist: 0.1, chest: 0.142, depth: 0.095, headR: 0.082 };
  const HIM = { hip: 0.088, thigh: 0.43, shin: 0.41, sole: 0.06, shoulder: 0.188, upper: 0.28, fore: 0.24, torso: 0.46, waist: 0.125, chest: 0.162, depth: 0.108, headR: 0.085 };
  const dimsOf = (spec) => (spec.body === 'him' ? HIM : HER);
  const GYN = { hip: 0.09, thigh: 0.43, shin: 0.43, sole: 0.06, shoulder: 0.18, upper: 0.27, fore: 0.24, torso: 0.44, waist: 0.095, chest: 0.16, depth: 0.105, headR: 0.118 };
  const R = 0.13;
  const NECK_TOP = HER.torso + 0.08;
  const HEAD_Y = HER.headR * 1.25;

  const css = (c) => {
    const v = rgb(c);
    return `rgb(${Math.round(v[0] * 255)},${Math.round(v[1] * 255)},${Math.round(v[2] * 255)})`;
  };
  const mixc = (a, b, k) => {
    const x = rgb(a), y = rgb(b);
    return [lerp(x[0], y[0], k), lerp(x[1], y[1], k), lerp(x[2], y[2], k), 0];
  };

  const PEOPLE = {
    amanda: {
      skin: 0xfeebd7, iris: ['#0c3a1c', '#1f7a3a', '#5ad06a'], lash: '#3a2418', brow: '#b08840', lip: '#c86a6a', mouth: '#8a3436',
      shape: 'sharp', eyeScale: 1.1
    },
    makoto: {
      skin: 0xfeddd0, iris: ['#1e1236', '#4a3c86', '#9a90d8'], lash: '#2a1612', brow: '#5a3028', lip: '#d07070', mouth: '#8e2a34',
      shape: 'soft', eyeScale: 1.1
    },
    jacob: {
      skin: 0xf2d2b6, iris: ['#2a1608', '#6a4022', '#b07a4a'], lash: '#2a1a12', brow: '#4a3020', lip: '#c07a6a', mouth: '#7a3a34',
      shape: 'soft', eyeScale: 0.95
    },
    crowd: {
      skin: 0xf0d0b8, iris: ['#1a1008', '#4a3020', '#8a6040'], lash: '#1a1210', brow: '#3a2818', lip: '#c07070', mouth: '#7a3034',
      shape: 'soft', eyeScale: 1.0
    },
    talleah: {
      skin: 0xbdd6f3, iris: ['#06143e', '#1c48c0', '#5aa8ff'], lash: '#0e1a40', brow: '#c8dcf4', lip: '#8a9ad8', mouth: '#4a3a8a',
      shape: 'round', eyeScale: 1.2
    }
  };

  const FACES = ['calm', 'happy', 'grin', 'angry', 'scowl', 'shy', 'sad', 'surprised', 'sleep', 'wink', 'smug', 'pathos', 'awe', 'blank', 'sing', 'yawn', 'sly'];

  function drawFace(person, kind, mask, skinOver) {
    const P = PEOPLE[person];
    const skin = css(skinOver === undefined ? P.skin : skinOver);
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const eyeY = 120;
      const xs = [84, 172];
      if (mask) {
        ctx.fillStyle = css(mask);
        ctx.beginPath();
        ctx.moveTo(40, 112);
        ctx.quadraticCurveTo(84, 78, 128, 104);
        ctx.quadraticCurveTo(172, 78, 216, 112);
        ctx.quadraticCurveTo(206, 150, 168, 150);
        ctx.quadraticCurveTo(140, 146, 128, 132);
        ctx.quadraticCurveTo(116, 146, 88, 150);
        ctx.quadraticCurveTo(50, 150, 40, 112);
        ctx.fill();
      }
      if (kind === 'shy' || kind === 'pathos' || kind === 'awe') {
        ctx.fillStyle = css(mixc(skinOver === undefined ? P.skin : skinOver, 0xff6a8a, kind === 'shy' ? 0.55 : 0.35));
        [52, 204].forEach(x => { ctx.beginPath(); ctx.ellipse(x, 162, 22, 10, 0, 0, PI * 2); ctx.fill(); });
        if (kind === 'shy') {
          ctx.strokeStyle = css(mixc(P.skin, 0xd02040, 0.7));
          ctx.lineWidth = 2.2;
          [52, 204].forEach(x => [-10, 0, 10].forEach(d => { ctx.beginPath(); ctx.moveTo(x + d - 4, 168); ctx.lineTo(x + d + 4, 156); ctx.stroke(); }));
        }
      }
      const shut = ['happy', 'sleep', 'yawn'].includes(kind);
      xs.forEach((x, i) => {
        const s = i ? 1 : -1;
        if (shut || (kind === 'wink' && i === 1)) {
          ctx.strokeStyle = P.lash;
          ctx.lineWidth = 6;
          ctx.beginPath();
          if (kind === 'happy' || kind === 'wink') {
            ctx.moveTo(x - 22, eyeY + 6);
            ctx.quadraticCurveTo(x, eyeY - 16, x + 22, eyeY + 6);
          } else {
            ctx.moveTo(x - 24, eyeY);
            ctx.quadraticCurveTo(x, eyeY + 13, x + 24, eyeY);
          }
          ctx.stroke();
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(x + s * 22, eyeY + 1);
          ctx.lineTo(x + s * 30, eyeY - 5);
          ctx.stroke();
          return;
        }
        const k = P.eyeScale * (kind === 'surprised' ? 1.08 : 1);
        const top = P.shape === 'sharp' ? -26 : P.shape === 'round' ? -32 : -29;
        ctx.save();
        ctx.translate(x, eyeY);
        ctx.scale(k, k);
        ctx.beginPath();
        if (P.shape === 'sharp') {
          ctx.moveTo(-25, 2);
          ctx.quadraticCurveTo(-s * 4, top, 25, -6 * s * -1 - 2);
          ctx.quadraticCurveTo(22, 26, 0, 27);
          ctx.quadraticCurveTo(-22, 26, -25, 2);
        } else {
          ctx.moveTo(-25, -1);
          ctx.quadraticCurveTo(-s * 2, top, 25, -2);
          ctx.quadraticCurveTo(23, 27, 0, 28);
          ctx.quadraticCurveTo(-23, 27, -25, -1);
        }
        ctx.closePath();
        ctx.fillStyle = '#fbfbfe';
        ctx.fill();
        ctx.clip();
        let gx = i ? -2 : 2, gy = 3;
        if (kind === 'shy' || kind === 'sad') gy += 6;
        if (kind === 'smug') gx += s * -3;
        const ir = kind === 'surprised' ? 15 : 19;
        const g = ctx.createLinearGradient(0, -20, 0, 26);
        g.addColorStop(0, P.iris[0]);
        g.addColorStop(0.45, P.iris[1]);
        g.addColorStop(1, P.iris[2]);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(gx, gy, ir, ir * 1.25, 0, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = P.iris[0];
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = P.iris[0];
        ctx.beginPath();
        ctx.ellipse(gx, gy, ir * 0.42, ir * 0.58, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = css(mixc(P.iris[0], 0x000000, 0.4));
        ctx.fillRect(-30, -30, 60, 13);
        if (kind !== 'blank') {
          ctx.fillStyle = '#ffffff';
          if (kind === 'awe') {
            [[gx - 5, gy - 6, 8], [gx + 7, gy + 9, 4]].forEach(([sx, sy, sr]) => {
              ctx.beginPath();
              for (let j = 0; j < 8; j++) {
                const a = (j / 8) * PI * 2;
                const rr = j % 2 ? sr * 0.38 : sr;
                ctx.lineTo(sx + C(a) * rr, sy + S(a) * rr);
              }
              ctx.closePath();
              ctx.fill();
            });
          } else {
            ctx.beginPath();
            ctx.ellipse(gx - 6, gy - 7, 6, 7, -0.2, 0, PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(gx + 7, gy + 10, 3, 0, PI * 2);
            ctx.fill();
          }
        }
        const lid = kind === 'sly' ? 0.34 : kind === 'scowl' ? 0.38 : kind === 'smug' ? 0.45 : kind === 'shy' ? 0.3 : kind === 'angry' ? 0.22 : kind === 'blank' ? 0.25 : 0;
        if (lid > 0) {
          ctx.fillStyle = skin;
          ctx.fillRect(-32, -34, 64, 8 + lid * 52);
        }
        ctx.restore();
        ctx.save();
        ctx.translate(x, eyeY);
        ctx.scale(k, k);
        const ly = lid > 0 ? -26 + lid * 52 : null;
        ctx.strokeStyle = P.lash;
        ctx.lineWidth = 7;
        ctx.beginPath();
        if (ly !== null) {
          ctx.moveTo(-25, ly + 2);
          ctx.lineTo(25, ly + (P.shape === 'sharp' ? -2 * s : 0));
        } else if (P.shape === 'sharp') {
          ctx.moveTo(-25, 2);
          ctx.quadraticCurveTo(-s * 4, top, 25, s * 6 - 2);
        } else {
          ctx.moveTo(-25, -1);
          ctx.quadraticCurveTo(-s * 2, top, 25, -2);
        }
        ctx.stroke();
        ctx.fillStyle = P.lash;
        ctx.beginPath();
        const ey = ly !== null ? ly : -4;
        ctx.moveTo(s * 20, ey - 3);
        ctx.lineTo(s * 33, ey - 10);
        ctx.lineTo(s * 25, ey + 4);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = css(mixc(P.lash, 0xffffff, 0.35));
        ctx.beginPath();
        ctx.moveTo(-13, 26);
        ctx.quadraticCurveTo(0, 30, 13, 26);
        ctx.stroke();
        ctx.restore();
      });
      ctx.strokeStyle = P.brow;
      ctx.lineWidth = 4.5;
      xs.forEach((x, i) => {
        const s = i ? 1 : -1;
        let inner = 0, outer = 0;
        if (kind === 'angry' || kind === 'pathos' || kind === 'sly') { inner = 9; outer = -4; }
        if (kind === 'scowl') { inner = 6; outer = 0; }
        if (kind === 'sad' || kind === 'shy') { inner = -7; outer = 4; }
        if (kind === 'surprised' || kind === 'awe') { inner = -8; outer = -8; }
        if (kind === 'smug' && i === 1) { inner = -5; outer = -6; }
        ctx.beginPath();
        ctx.moveTo(x - s * 18, 90 + inner);
        ctx.quadraticCurveTo(x, 84 + (inner + outer) / 2, x + s * 21, 91 + outer);
        ctx.stroke();
      });
      ctx.fillStyle = css(mixc(P.skin, 0x000000, 0.25));
      ctx.beginPath();
      ctx.ellipse(128, 156, 1.8, 2.6, 0, 0, PI * 2);
      ctx.fill();
      const mx = 128, my = 192;
      ctx.strokeStyle = P.mouth;
      ctx.fillStyle = P.mouth;
      ctx.lineWidth = 3.2;
      const open = (rx, ry, tongue) => {
        ctx.fillStyle = P.mouth;
        ctx.beginPath();
        ctx.ellipse(mx, my + 2, rx, ry, 0, 0, PI * 2);
        ctx.fill();
        if (tongue) {
          ctx.fillStyle = P.lip;
          ctx.beginPath();
          ctx.ellipse(mx, my + 2 + ry * 0.5, rx * 0.6, ry * 0.35, 0, 0, PI * 2);
          ctx.fill();
        }
      };
      if (kind === 'sing') open(9, 11, true);
      else if (kind === 'surprised') open(6, 8, false);
      else if (kind === 'yawn') open(11, 15, true);
      else if (kind === 'pathos' || kind === 'awe') {
        ctx.beginPath();
        ctx.moveTo(mx - 14, my - 3);
        ctx.quadraticCurveTo(mx, my - 6, mx + 14, my - 3);
        ctx.quadraticCurveTo(mx, my + 20, mx - 14, my - 3);
        ctx.fill();
        ctx.fillStyle = P.lip;
        ctx.beginPath();
        ctx.ellipse(mx, my + 7, 6, 3.5, 0, 0, PI * 2);
        ctx.fill();
      } else if (kind === 'grin' || kind === 'happy') {
        ctx.beginPath();
        ctx.moveTo(mx - 15, my - 3);
        ctx.quadraticCurveTo(mx, my - 1, mx + 15, my - 3);
        ctx.quadraticCurveTo(mx, my + 15, mx - 15, my - 3);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(mx - 9, my - 3, 18, 3);
      } else if (kind === 'angry') {
        ctx.beginPath();
        ctx.moveTo(mx - 11, my + 4);
        ctx.quadraticCurveTo(mx, my - 4, mx + 11, my + 4);
        ctx.stroke();
      } else if (kind === 'sad') {
        ctx.beginPath();
        ctx.moveTo(mx - 9, my + 4);
        ctx.quadraticCurveTo(mx, my - 2, mx + 9, my + 4);
        ctx.stroke();
      } else if (kind === 'scowl' || kind === 'blank') {
        ctx.beginPath();
        ctx.moveTo(mx - 9, my + 1);
        ctx.lineTo(mx + 9, my + 1);
        ctx.stroke();
      } else if (kind === 'shy') {
        ctx.beginPath();
        ctx.moveTo(mx - 9, my + 2);
        ctx.quadraticCurveTo(mx - 4, my - 2, mx, my + 2);
        ctx.quadraticCurveTo(mx + 4, my + 6, mx + 9, my + 1);
        ctx.stroke();
      } else if (kind === 'sly') {
        ctx.beginPath();
        ctx.moveTo(mx - 14, my - 2);
        ctx.quadraticCurveTo(mx, my + 12, mx + 15, my - 6);
        ctx.quadraticCurveTo(mx, my + 4, mx - 14, my - 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(mx - 6, my + 1, 12, 2);
      } else if (kind === 'smug') {
        ctx.beginPath();
        ctx.moveTo(mx - 10, my + 2);
        ctx.quadraticCurveTo(mx + 2, my + 5, mx + 12, my - 4);
        ctx.stroke();
      } else if (kind === 'sleep') {
        ctx.beginPath();
        ctx.moveTo(mx - 5, my + 2);
        ctx.quadraticCurveTo(mx, my + 4, mx + 5, my + 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(mx - 9, my);
        ctx.quadraticCurveTo(mx, my + 6, mx + 9, my);
        ctx.stroke();
      }
      ctx.restore();
    };
  }

  function headPatch(b, rx, ry, rz, y0, y1, p0, p1, nu, nv, col, uvs) {
    const pt = (u, v) => {
      const yaw = y0 + (y1 - y0) * u, pit = p0 + (p1 - p0) * v;
      const sp = S(pit), cp = C(pit), sy = S(yaw), cy = C(yaw);
      const low = sp < 0 ? -sp : 0;
      const tx = 1 - 0.34 * low * low;
      const tz = 1 - 0.1 * low * low;
      const chin = sp < -0.25 && cy > 0 ? 0.06 * (low - 0.25) * cy * cy : 0;
      const n = [sy * cp * tx, sp - chin, cy * cp * tz];
      return { p: [n[0] * rx, n[1] * ry, n[2] * rz], n: V3.norm([sy * cp / rx, sp / ry, cy * cp / rz]) };
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const a = pt(u0, v0), bb = pt(u1, v0), c = pt(u1, v1), d = pt(u0, v1);
        b.quad(a.p, bb.p, c.p, d.p, col, uvs ? [[u0, v0], [u1, v0], [u1, v1], [u0, v1]] : null, [a.n, bb.n, c.n, d.n]);
      }
    }
    return b;
  }

  const HX = 0.88, HY = 0.94, HZ = 0.9;
  const headPoint = (yaw, pit, k) => {
    const sp = S(pit), cp = C(pit), sy = S(yaw), cy = C(yaw);
    const low = sp < 0 ? -sp : 0;
    const chin = sp < -0.25 && cy > 0 ? 0.06 * (low - 0.25) * cy * cy : 0;
    return [sy * cp * (1 - 0.34 * low * low) * R * HX * k, (sp - chin) * R * HY * k, cy * cp * (1 - 0.1 * low * low) * R * HZ * k];
  };
  const headNormal = (yaw, pit) => V3.norm([S(yaw) * C(pit) / HX, S(pit) / HY, C(yaw) * C(pit) / HZ]);

  function hairShell(b, H, low, tip, k0, flare, nu) {
    const kAt = (pit) => k0 + flare * Math.max(0, -pit);
    const P = (yaw, pit) => headPoint(yaw, pit, kAt(pit));
    const rows = 7;
    for (let i = 0; i < nu; i++) {
      const ya = -PI + (2 * PI * i) / nu, yb = ya + (2 * PI) / nu, ym = (ya + yb) / 2;
      const edge = (low(ya) + low(yb)) / 2;
      const col = i % 5 === 0 ? H.hi : i % 3 === 1 ? H.dark : H.mid;
      for (let r = 0; r < rows; r++) {
        const pa = lerp(PI / 2, edge, Math.pow(r / rows, 0.8)), pb = lerp(PI / 2, edge, Math.pow((r + 1) / rows, 0.8));
        b.quad(P(yb, pa), P(ya, pa), P(ya, pb), P(yb, pb), r < 2 ? H.mid : col, null, [headNormal(yb, pa), headNormal(ya, pa), headNormal(ya, pb), headNormal(yb, pb)]);
      }
      const t = P(ym, edge - tip(ym));
      const n = headNormal(ym, edge);
      b.tri(P(yb, edge), P(ya, edge), t, col, null, [n, n, n]);
    }
  }

  const band = (yaw, a, b2) => clamp((Math.abs(yaw) - a) / (b2 - a), 0, 1);

  function sideLocks(b, H, yaw, len, width, wave) {
    [-1, 1].forEach(s => {
      const top = headPoint(s * yaw, -0.2, 1.1);
      const segs = Math.max(2, Math.round(len / 0.07));
      b.push(M4.translate(top[0], top[1], top[2]), M4.rotY(s * 0.35));
      for (let q = 0; q < segs; q++) {
        const y0 = -(q * len) / segs, y1 = -((q + 1) * len) / segs;
        const dx0 = wave ? S(q * 1.9) * 0.012 * s : 0, dx1 = wave ? S((q + 1) * 1.9) * 0.012 * s : 0;
        const z0 = -0.01 + 0.02 * (q / segs), z1 = -0.01 + 0.02 * ((q + 1) / segs);
        const w0 = width * (1 - 0.3 * (q / segs)), w1 = q === segs - 1 ? width * 0.1 : width * (1 - 0.3 * ((q + 1) / segs));
        b.quad([-w0 / 2 + dx0, y0, z0], [w0 / 2 + dx0, y0, z0], [w1 / 2 + dx1, y1, z1], [-w1 / 2 + dx1, y1, z1], q % 2 ? H.mid : H.hi, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        b.quad([w0 / 2 + dx0, y0, z0 - 0.008], [-w0 / 2 + dx0, y0, z0 - 0.008], [-w1 / 2 + dx1, y1, z1 - 0.008], [w1 / 2 + dx1, y1, z1 - 0.008], H.dark, null, [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
      }
      b.pop();
    });
  }

  function backHair(b, H, len, width, wave, flare) {
    const top = NECK_TOP + 0.1;
    const n = 9;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1) - 0.5;
      const x = f * width;
      const segs = Math.max(2, Math.round(len / 0.07));
      const own = len * (1 - 0.12 * Math.abs(f) * 2) * (i % 2 ? 1 : 0.95);
      for (let q = 0; q < segs; q++) {
        const ka = q / segs, kb = (q + 1) / segs;
        const ya = top - ka * own, yb = top - kb * own;
        const bulge = (k) => -0.105 - 0.045 * S(PI * Math.min(1, k * 2.4)) - k * 0.03 - Math.abs(f) * 0.03;
        const xa = x * (1 + ka * flare) + (wave ? S(ka * 10 + i) * 0.016 : 0);
        const xb = x * (1 + kb * flare) + (wave ? S(kb * 10 + i) * 0.016 : 0);
        const w = (width / (n - 1)) * 0.72 * (1 + ka * flare * 0.6);
        const wb = q === segs - 1 ? w * 0.15 : (width / (n - 1)) * 0.72 * (1 + kb * flare * 0.6);
        const col = i % 4 === 1 ? H.hi : i % 2 ? H.mid : shade(H.mid, 0.9);
        b.quad([xa - w, ya, bulge(ka)], [xa + w, ya, bulge(ka)], [xb + wb, yb, bulge(kb)], [xb - wb, yb, bulge(kb)], col, null, [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
        b.quad([xa + w, ya, bulge(ka) + 0.01], [xa - w, ya, bulge(ka) + 0.01], [xb - wb, yb, bulge(kb) + 0.01], [xb + wb, yb, bulge(kb) + 0.01], H.dark, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      }
    }
  }

  const HAIR = {
    amandaShort: { mid: 0xe8c878, hi: 0xf6e2a8, dark: 0xc49a52 },
    amandaLong: { mid: 0xf0d896, hi: 0xfcefc6, dark: 0xd2ae6a },
    makoto: { mid: 0x74433d, hi: 0x9a5e52, dark: 0x4d2c31 },
    talleah: { mid: 0xe1ebfa, hi: 0xffffff, dark: 0xa8c8ee },
    kidAmanda: { mid: 0xe8c878, hi: 0xf6e2a8, dark: 0xc49a52 },
    witch: { mid: 0x2a1a30, hi: 0x4a3058, dark: 0x160c1a },
    ranger: { mid: 0xd08a3a, hi: 0xeeb060, dark: 0xa06020 },
    jacob: { mid: 0x5a4030, hi: 0x7a5a42, dark: 0x3a2820 },
    pink: { mid: 0xf0a0c0, hi: 0xffc8dc, dark: 0xc87898 },
    black: { mid: 0x1a1820, hi: 0x34303c, dark: 0x0e0c12 },
    blue: { mid: 0x2a3a8a, hi: 0x4a5ab0, dark: 0x1a2460 },
    brown: { mid: 0x6a4428, hi: 0x8a6040, dark: 0x4a2e1a }
  };

  const sweptBangs = (yaw) => 0.2 + 0.1 * clamp(yaw / 0.6, -1, 1);

  const SHELLS = {
    amandaShort: {
      low: (y) => lerp(lerp(sweptBangs(y), -0.62, band(y, 0.5, 1.1)), -0.92, band(y, 1.6, 2.4)),
      tip: (y) => (Math.abs(y) < 0.55 ? 0.12 : 0.15), k: 1.09, flare: 0.22
    },
    kidAmanda: {
      low: (y) => lerp(lerp(0.04, -0.55, band(y, 0.5, 1.1)), -0.8, band(y, 1.6, 2.4)),
      tip: () => 0.08, k: 1.09, flare: 0.12
    },
    amandaLong: {
      low: (y) => lerp(lerp(sweptBangs(y), -0.75, band(y, 0.5, 1.05)), -0.95, band(y, 1.6, 2.4)),
      tip: (y) => (Math.abs(y) < 0.55 ? 0.12 : 0.1), k: 1.09, flare: 0.12
    },
    makoto: {
      low: (y) => lerp(lerp(0.0, -0.95, band(y, 0.62, 0.72)), -0.95, band(y, 1.5, 2.2)),
      tip: (y) => (Math.abs(y) < 0.62 ? 0.03 : 0.05), k: 1.08, flare: 0.05
    },
    talleah: {
      low: (y) => lerp(lerp(0.34 - 0.1 * Math.min(1, Math.abs(y) / 0.6) + (Math.abs(y) < 0.08 ? 0.12 : 0), -0.85, band(y, 0.6, 1.1)), -0.95, band(y, 1.6, 2.4)),
      tip: (y) => (Math.abs(y) < 0.6 ? 0.1 : 0.12), k: 1.1, flare: 0.18
    },
    witch: {
      low: (y) => lerp(lerp(0.02, -0.9, band(y, 0.6, 0.75)), -0.95, band(y, 1.5, 2.2)),
      tip: () => 0.03, k: 1.08, flare: 0.05
    },
    ranger: {
      low: (y) => lerp(lerp(0.05, -0.5, band(y, 0.5, 1.1)), -0.75, band(y, 1.6, 2.4)),
      tip: () => 0.1, k: 1.09, flare: 0.2
    },
    jacob: {
      low: (y) => lerp(lerp(0.32, -0.25, band(y, 0.5, 1.2)), -0.72, band(y, 1.7, 2.5)),
      tip: () => 0.14, k: 1.1, flare: 0.18
    },
    pink: {
      low: (y) => lerp(lerp(0.12, -0.72, band(y, 0.55, 0.75)), -0.85, band(y, 1.6, 2.4)),
      tip: () => 0.05, k: 1.08, flare: 0.1
    },
    black: {
      low: (y) => lerp(lerp(0.3, -0.3, band(y, 0.5, 1.2)), -0.75, band(y, 1.7, 2.5)),
      tip: () => 0.06, k: 1.08, flare: 0.05
    },
    blue: {
      low: (y) => lerp(lerp(0.14, -0.6, band(y, 0.55, 0.8)), -0.8, band(y, 1.6, 2.4)),
      tip: () => 0.05, k: 1.08, flare: 0.08
    },
    brown: {
      low: (y) => lerp(lerp(0.28, -0.3, band(y, 0.5, 1.2)), -0.75, band(y, 1.7, 2.5)),
      tip: () => 0.1, k: 1.09, flare: 0.12
    }
  };

  function buildHair(style) {
    const H = HAIR[style];
    const sh = SHELLS[style];
    const head = new Builder();
    const back = new Builder();
    hairShell(head, H, sh.low, sh.tip, sh.k, sh.flare, 28);
    if (style === 'amandaLong') {
      sideLocks(head, H, 0.95, 0.4, 0.06, true);
      backHair(back, H, 0.8, 0.3, true, 0.35);
    } else if (style === 'makoto') {
      sideLocks(head, H, 0.86, 0.34, 0.05, false);
      backHair(back, H, 0.62, 0.27, false, 0.1);
    } else if (style === 'talleah') {
      sideLocks(head, H, 0.9, 0.5, 0.065, true);
      backHair(back, H, 0.95, 0.34, true, 0.45);
    } else if (style === 'witch') {
      backHair(back, H, 0.5, 0.26, false, 0.1);
    }
    return { head, back };
  }

  function bandPrism(b, y0, y1, r0x, r0z, r1x, r1z, bands, opts) {
    bands.forEach(([f0, f1, col]) => {
      const ya = lerp(y0, y1, f0), yb = lerp(y0, y1, f1);
      b.prism(10, lerp(r0x, r1x, f0), lerp(r0z, r1z, f0), ya, lerp(r0x, r1x, f1), lerp(r0z, r1z, f1), yb, col, Object.assign({ capTop: false }, opts || {}));
    });
  }

  function torsoMesh(spec) {
    const d = dimsOf(spec);
    const b = new Builder();
    const T = spec.torso;
    const bust = spec.bust === undefined ? 1 : spec.bust;
    b.prism(12, d.waist * 1.1, d.depth * 0.95, -0.02, d.waist, d.depth * 0.9, 0.12, T.waist || T.body, { capTop: false, capBottom: true });
    b.prism(12, d.waist, d.depth * 0.9, 0.12, d.chest, d.depth * (0.98 + 0.12 * bust), 0.26, T.chest || T.body, { capTop: false });
    b.prism(12, d.chest, d.depth * (0.98 + 0.12 * bust), 0.26, d.chest * 1.02, d.depth * 0.85, 0.34, T.chest || T.body, { capTop: false });
    b.prism(12, d.chest * 1.02, d.depth * 0.85, 0.34, 0.085, 0.06, d.torso, T.top || T.chest || T.body);
    b.prism(8, 0.036, 0.034, d.torso - 0.03, 0.033, 0.031, d.torso + 0.1, T.neck || spec.skin, { capTop: false });
    [-1, 1].forEach(s => b.at(s * (d.shoulder - 0.012), d.torso * 0.9, 0, (h) => h.ellipsoid(0.056, 0.048, 0.055, 8, 5, T.shoulder || T.top || T.chest || T.body)));
    (spec.torsoExtras || []).forEach(fn => fn(b, d));
    return b;
  }

  function hipsMesh(spec) {
    const d = dimsOf(spec);
    const b = new Builder();
    b.prism(12, 0.124, d.depth * 1.05, -0.08, d.waist * 1.12, d.depth * 0.98, 0.1, spec.hips, { capBottom: true });
    (spec.hipExtras || []).forEach(fn => fn(b, d));
    return b;
  }

  function armMeshes(spec) {
    const d = dimsOf(spec);
    const A = spec.arm;
    const up = new Builder();
    bandPrism(up, -d.upper, 0.02, 0.037, 0.037, 0.047, 0.047, A.upper, { capBottom: true });
    const fo = new Builder();
    bandPrism(fo, -d.fore, 0, 0.028, 0.03, 0.037, 0.037, A.fore, { capBottom: true });
    const hand = A.hand || spec.skin;
    fo.at(0, -d.fore - 0.035, 0.004, (h) => h.box(0.05, 0.075, 0.026, hand));
    fo.at(0.014, -d.fore - 0.02, 0.022, (h) => h.box(0.016, 0.042, 0.016, hand));
    (A.foreExtras || []).forEach(fn => fn(fo, d));
    (A.upperExtras || []).forEach(fn => fn(up, d));
    return { up, fo };
  }

  function legMeshes(spec) {
    const d = dimsOf(spec);
    const L = spec.leg;
    const th = new Builder();
    bandPrism(th, -d.thigh, 0.03, 0.045, 0.047, 0.072, 0.075, L.thigh, { capBottom: true });
    const sh = new Builder();
    const flare = L.flare || 0;
    bandPrism(sh, -d.shin, 0, 0.032 + flare, 0.034 + flare, 0.044, 0.046, L.shin, { capBottom: !flare });
    const shoe = L.shoe;
    sh.at(0, -d.shin - d.sole / 2, 0.045, (h) => {
      if (shoe.type === 'heel') {
        h.at(0, 0.004, 0.02, (c) => c.box(0.05, d.sole * 0.7, 0.13, shoe.col));
        h.at(0, -0.004, -0.045, (c) => c.box(0.018, d.sole, 0.018, shoe.sole || shoe.col));
      } else {
        h.box(0.074, d.sole, 0.19, shoe.col);
        h.at(0, -d.sole / 2 + 0.008, 0.004, (c) => c.box(0.078, 0.016, 0.196, shoe.sole || shade(shoe.col, 0.7)));
        if (shoe.type === 'sneaker') h.at(0, -0.004, 0.078, (c) => c.box(0.072, 0.03, 0.04, shoe.sole || 0xffffff));
      }
    });
    (L.shinExtras || []).forEach(fn => fn(sh, d));
    (L.thighExtras || []).forEach(fn => fn(th, d));
    return { th, sh };
  }

  function skirtMesh(spec) {
    const K = spec.skirt;
    if (!K) return null;
    const b = new Builder();
    if (K.type === 'pleat') {
      const n = 18;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        const ro = i % 2 ? 1.0 : 0.94;
        const p00 = [S(a0) * 0.2 * ro, -0.26, C(a0) * 0.165 * ro], p10 = [S(a1) * 0.2 * (i % 2 ? 0.94 : 1), -0.26, C(a1) * 0.165 * (i % 2 ? 0.94 : 1)];
        const p11 = [S(a1) * 0.13, 0.08, C(a1) * 0.105], p01 = [S(a0) * 0.13, 0.08, C(a0) * 0.105];
        const nm = V3.norm([S((a0 + a1) / 2), 0.2, C((a0 + a1) / 2)]);
        b.quad(p00, p10, p11, p01, i % 2 ? K.col : K.dark, K.tex ? [[0, 0], [1, 0], [1, 2], [0, 2]] : null, [nm, nm, nm, nm]);
      }
    } else if (K.type === 'frill') {
      const tiers = [[0.08, -0.06, 0.13, 0.17, K.col], [-0.04, -0.16, 0.17, 0.215, K.light], [-0.13, -0.235, 0.205, 0.25, K.col]];
      tiers.forEach(([y1, y0, r1, r0, col]) => {
        const n = 20;
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
          const dip0 = i % 2 ? 0 : 0.018, dip1 = i % 2 ? 0.018 : 0;
          const nm = V3.norm([S((a0 + a1) / 2), 0.35, C((a0 + a1) / 2)]);
          b.quad([S(a0) * r0, y0 - dip0, C(a0) * r0 * 0.85], [S(a1) * r0, y0 - dip1, C(a1) * r0 * 0.85], [S(a1) * r1, y1, C(a1) * r1 * 0.8], [S(a0) * r1, y1, C(a0) * r1 * 0.8], col, null, [nm, nm, nm, nm]);
        }
        b.prism(20, r0 * 1.01, r0 * 0.86, y0 - 0.02, r0 * 1.01, r0 * 0.86, y0, K.trim || 0xffffff, { capTop: false });
      });
    } else if (K.type === 'long') {
      b.prism(14, 0.32, 0.28, -0.72, 0.13, 0.105, 0.08, K.col, { capTop: false });
      b.prism(14, 0.325, 0.285, -0.74, 0.32, 0.28, -0.7, K.dark, { capTop: false });
    }
    return b;
  }

  const box = (x, y, z, sx, sy, sz, col) => (b) => b.at(x, y, z, (h) => h.box(sx, sy, sz, col));
  const ell = (x, y, z, rx, ry, rz, col) => (b) => b.at(x, y, z, (h) => h.ellipsoid(rx, ry, rz, 8, 5, col));
  const front = (x0, x1, y0, y1, z, col) => (b) => b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
  const ring = (y, r, h, col, rz) => (b) => b.prism(12, r, rz || r, y - h / 2, r, rz || r, y + h / 2, col, { capTop: false });
  const glow = (c) => [rgb(c)[0], rgb(c)[1], rgb(c)[2], 0.9];

  const AMANDA_SKIN = 0xfeebd7;
  const MAKOTO_SKIN = 0xfeddd0;
  const TALLEAH_SKIN = 0xbdd6f3;
  const NAVY = 0x16355b;
  const PLATE = 0xe2e8f8;

  const FORMS = {
    amandaCasual: {
      person: 'amanda', skin: AMANDA_SKIN, hair: 'amandaShort', bust: 0,
      torso: { body: 0xf2f6fd, shoulder: 0x304158 },
      torsoExtras: [ring(0.385, 0.045, 0.02, 0x304158)],
      decal: ['print', 0, 0.235, 0.097, 0.13, 0.085],
      hips: 0x82a1c3,
      hipExtras: [ring(0.07, 0.112, 0.03, 0x6c8eb2)],
      arm: { upper: [[0, 0.45, AMANDA_SKIN], [0.45, 1, 0x304158]], fore: [[0, 1, AMANDA_SKIN]], foreExtras: [] },
      armL: { foreExtras: [ring(-0.17, 0.031, 0.012, 0x3aa84a), ring(-0.185, 0.031, 0.012, 0xf068a0)] },
      leg: { thigh: [[0, 1, 0x82a1c3]], shin: [[0, 1, 0x82a1c3]], flare: 0.018, shoe: { type: 'sneaker', col: 0x2a2d33, sole: 0xf4f4f4 } }
    },
    amandaLantern: {
      person: 'amanda', skin: AMANDA_SKIN, hair: 'amandaShort', bust: 0, mask: 0x2f9a4a,
      torso: { body: 0x2f9a4a, shoulder: 0x1c2420, top: 0x1c2420 },
      decal: ['lantern', 0, 0.255, 0.098, 0.07, 0.07],
      torsoExtras: [box(-0.12, 0.17, 0, 0.03, 0.26, 0.17, 0x1c2420), box(0.12, 0.17, 0, 0.03, 0.26, 0.17, 0x1c2420)],
      hips: 0x2f9a4a,
      hipExtras: [ring(0.07, 0.113, 0.035, 0x1c2420, 0.1)],
      arm: { upper: [[0, 1, 0x1c2420]], fore: [[0, 0.55, 0xf4f4f4], [0.55, 1, 0x2f9a4a]], hand: 0xf4f4f4 },
      leg: { thigh: [[0, 1, 0x2f9a4a]], shin: [[0, 0.75, 0x1c2420], [0.75, 1, 0x2f9a4a]], shoe: { type: 'boot', col: 0x1c2420 } }
    },
    amandaPink: {
      person: 'amanda', skin: AMANDA_SKIN, hair: 'amandaLong', bust: 0.8, bow: true,
      torso: { waist: 0xfcc7dd, chest: 0xfdf0f6, top: AMANDA_SKIN, shoulder: AMANDA_SKIN, neck: AMANDA_SKIN },
      torsoExtras: [
        ring(0.115, 0.104, 0.016, 0xc5883d, 0.092), ring(0.3, 0.146, 0.014, 0xc5883d, 0.108),
        ell(0, 0.27, 0.122, 0.05, 0.03, 0.02, 0xf06aa0), ell(-0.045, 0.27, 0.112, 0.035, 0.025, 0.018, 0xe85a92), ell(0.045, 0.27, 0.112, 0.035, 0.025, 0.018, 0xe85a92),
        ring(NECK_TOP - 0.03, 0.037, 0.02, 0xf06aa0), ell(0, NECK_TOP - 0.035, 0.04, 0.014, 0.014, 0.01, glow(0xff4a8a))
      ],
      hips: 0xe26396,
      skirt: { type: 'frill', col: 0xe26396, light: 0xf5ced2, trim: 0xffffff },
      arm: { upper: [[0, 1, AMANDA_SKIN]], fore: [[0, 1, 0xfbfbff]], hand: 0xfbfbff, foreExtras: [ring(-0.005, 0.038, 0.03, 0xf675b6)] },
      leg: { thigh: [[0, 0.55, 0xfedfea], [0.55, 0.62, 0xf06aa0], [0.62, 1, AMANDA_SKIN]], shin: [[0, 1, 0xfedfea]], shoe: { type: 'heel', col: 0xfdf4f8, sole: 0xc5883d }, shinExtras: [ell(-0.05, -0.36, -0.02, 0.012, 0.03, 0.035, 0xffffff), ell(0.05, -0.36, -0.02, 0.012, 0.03, 0.035, 0xffffff)] }
    },
    makotoSchool: {
      person: 'makoto', skin: MAKOTO_SKIN, hair: 'makoto', bust: 0.7, glasses: 0xc0303a, scale: 0.955,
      torso: { body: 0xf2f4f4 },
      torsoExtras: [
        (b) => b.quad([-0.016, 0.34, 0.112], [0.016, 0.34, 0.112], [0.012, 0.13, 0.108], [-0.012, 0.13, 0.108], 0xb73641, null, [[0, 0.1, 1], [0, 0.1, 1], [0, 0.1, 1], [0, 0.1, 1]]),
        box(0, 0.36, 0.085, 0.03, 0.026, 0.02, 0xb73641),
        box(-0.03, 0.385, 0.06, 0.04, 0.03, 0.03, 0xffffff), box(0.03, 0.385, 0.06, 0.04, 0.03, 0.03, 0xffffff)
      ],
      hips: 0xab2f3f,
      skirt: { type: 'pleat', col: 0xab2f3f, dark: 0x882230 },
      arm: { upper: [[0, 1, 0xf2f4f4]], fore: [[0, 0.82, MAKOTO_SKIN], [0.82, 1, 0xf2f4f4]] },
      leg: { thigh: [[0, 1, MAKOTO_SKIN]], shin: [[0, 0.15, 0x2e2a2e], [0.15, 0.95, 0x2e2a2e], [0.95, 1, MAKOTO_SKIN]], shoe: { type: 'sneaker', col: 0x6a3a2a, sole: 0x3a2018 } }
    },
    makotoCat: {
      person: 'makoto', skin: MAKOTO_SKIN, hair: 'makoto', bust: 0.7, ears: true, scale: 0.955,
      torso: { body: 0x6d173a, chest: 0x5a1430, top: 0x51192e },
      torsoExtras: [
        (b) => [-1, 1].forEach(s => b.quad([s * 0.012, NECK_TOP - 0.06, 0.098], [s * 0.022, NECK_TOP - 0.06, 0.098], [s * 0.05, 0.13, 0.112], [s * 0.04, 0.13, 0.112], glow(0xfb2894), null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])),
        ring(0.03, 0.112, 0.012, glow(0x40e0f0)), ring(NECK_TOP - 0.03, 0.037, 0.016, glow(0x40e0f0))
      ],
      hips: 0x51192e,
      hipExtras: [box(-0.13, -0.06, 0.02, 0.03, 0.14, 0.06, 0x3a1323), box(0.13, -0.06, 0.02, 0.03, 0.14, 0.06, 0x3a1323), box(-0.15, -0.09, 0.03, 0.012, 0.16, 0.025, glow(0xff8ad0)), box(0.15, -0.09, 0.03, 0.012, 0.16, 0.025, glow(0xff8ad0))],
      arm: { upper: [[0, 1, 0x6d173a]], fore: [[0, 1, 0x51192e]], hand: 0x3a1323, foreExtras: [ring(-0.17, 0.034, 0.016, glow(0x40e0f0))] },
      armL: { foreExtras: [ring(-0.17, 0.034, 0.016, glow(0xfb2894))] },
      leg: {
        thigh: [[0, 1, 0x51192e]], shin: [[0, 0.7, 0x3a1323], [0.7, 1, 0x51192e]], shoe: { type: 'heel', col: 0x3a1323, sole: glow(0x40e0f0) },
        thighExtras: [(b) => b.quad([-0.02, -0.02, 0.07], [-0.008, -0.02, 0.07], [-0.004, -0.36, 0.05], [-0.016, -0.36, 0.05], glow(0xfb2894), null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])]
      }
    },
    talleahSuit: {
      person: 'talleah', skin: TALLEAH_SKIN, hair: 'talleah', bust: 0.45, harness: true, scale: 1.035,
      torso: { body: NAVY, top: NAVY, shoulder: PLATE },
      torsoExtras: [front(-0.035, 0.035, 0.02, 0.3, 0.11, 0x6792c4), ring(NECK_TOP - 0.035, 0.042, 0.045, 0x213659), ell(0, NECK_TOP - 0.05, 0.045, 0.014, 0.014, 0.01, glow(0x3a7ae0))],
      hips: NAVY,
      arm: { upper: [[0, 1, NAVY]], fore: [[0, 1, NAVY]], hand: 0x101c34, foreExtras: [(b) => b.prism(8, 0.038, 0.038, -0.17, 0.042, 0.042, -0.04, PLATE, { capTop: false })] },
      leg: {
        thigh: [[0, 0.82, TALLEAH_SKIN], [0.82, 1, NAVY]], shin: [[0, 0.65, PLATE], [0.65, 1, TALLEAH_SKIN]], shoe: { type: 'boot', col: PLATE, sole: 0x8aa0c8 },
        thighExtras: [ell(0, -0.4, 0.04, 0.045, 0.04, 0.03, PLATE), (b) => b.at(0, -0.12, 0.05, (h) => h.box(0.06, 0.12, 0.02, PLATE))]
      }
    },
    talleahKnight: {
      person: 'talleah', skin: 0xf2d6c2, hair: null, helmet: 'knight', bust: 0.45, scale: 1.035,
      torso: { body: 0xa8acb4, chest: 0xc0c4cc, shoulder: 0xd0d4dc },
      torsoExtras: [front(-0.03, 0.03, 0.06, 0.3, 0.115, 0xb02028)],
      hips: 0x8a8e96,
      arm: { upper: [[0, 1, 0xb8bcc4]], fore: [[0, 1, 0xa8acb4]], hand: 0x8a8e96 },
      leg: { thigh: [[0, 1, 0x8a8e96]], shin: [[0, 1, 0xa8acb4]], shoe: { type: 'boot', col: 0x6a6e76 } }
    },
    talleahWitch: {
      person: 'talleah', skin: 0xf4dccc, hair: 'witch', hat: 'witch', bust: 0.45, scale: 1.035,
      torso: { body: 0x2a4a2a },
      hips: 0x1a301a,
      skirt: { type: 'long', col: 0x1a301a, dark: 0x6a3a8a },
      arm: { upper: [[0, 1, 0x2a4a2a]], fore: [[0, 1, 0x2a4a2a]] },
      leg: { thigh: [[0, 1, 0x1a1020]], shin: [[0, 1, 0x1a1020]], shoe: { type: 'boot', col: 0x1a1020 } }
    },
    talleahRanger: {
      person: 'talleah', skin: 0xf6dcc8, hair: 'ranger', helmet: 'bubble', bust: 0.45, scale: 1.035,
      torso: { body: 0xf0f2f6, chest: 0xf6f8fb },
      torsoExtras: [box(0, 0.24, 0.11, 0.07, 0.05, 0.02, 0xd03030), box(0, 0.2, -0.14, 0.18, 0.24, 0.08, 0xc8ccd6), box(0, 0.04, 0.0, 0.25, 0.03, 0.2, 0x3a6ab0)],
      hips: 0xe0e4ea,
      arm: { upper: [[0, 1, 0xf0f2f6]], fore: [[0, 0.7, 0xf0f2f6], [0.7, 1, 0x3a6ab0]], hand: 0x3a6ab0 },
      leg: { thigh: [[0, 1, 0xe0e4ea]], shin: [[0, 0.6, 0x3a6ab0], [0.6, 1, 0xe0e4ea]], shoe: { type: 'boot', col: 0x3a6ab0 } }
    },
    kidAmanda: {
      person: 'amanda', skin: AMANDA_SKIN, hair: 'kidAmanda', bust: 0, scale: 0.68,
      torso: { body: 0xe8a040, chest: 0xf4f4f4 },
      torsoExtras: [ring(0.2, 0.142, 0.04, 0xe8a040, 0.104), ring(0.29, 0.144, 0.04, 0xe8a040, 0.1)],
      hips: 0x4a6a9a,
      arm: { upper: [[0, 0.5, AMANDA_SKIN], [0.5, 1, 0xf4f4f4]], fore: [[0, 1, AMANDA_SKIN]] },
      leg: { thigh: [[0, 1, 0x4a6a9a]], shin: [[0, 0.3, 0xf4f4f4], [0.3, 1, AMANDA_SKIN]], shoe: { type: 'sneaker', col: 0xd03030, sole: 0xffffff } }
    }
  };

  const JACOB_SKIN = 0xf2d2b6;
  const MALE_LEG = (col, shoe) => ({ thigh: [[0, 1, col]], shin: [[0, 1, col]], shoe });
  const SNEAKER = (col) => ({ type: 'sneaker', col, sole: 0xf0f0f0 });
  const BOOT = (col) => ({ type: 'boot', col });

  Object.assign(FORMS, {
    jacobHelmet: {
      person: 'jacob', body: 'him', skin: JACOB_SKIN, hair: null, gear: ['magnitude'],
      torso: { body: 0xb02028, waist: 0x5a2a7a, shoulder: 0x5a2a7a },
      torsoExtras: [ring(0.02, 0.135, 0.04, 0x5a2a7a, 0.115)],
      cape: { col: 0x5a2a7a, inner: 0x3a1a50, len: 1.05 },
      hips: 0x5a2a7a,
      arm: { upper: [[0, 1, 0xb02028]], fore: [[0, 0.5, 0xb02028], [0.5, 1, 0xd02838]], hand: 0xd02838 },
      leg: { thigh: [[0, 1, 0xb02028]], shin: [[0, 0.6, 0x5a2a7a], [0.6, 1, 0xb02028]], shoe: BOOT(0x5a2a7a) }
    },
    jacobHoodie: {
      person: 'jacob', body: 'him', skin: JACOB_SKIN, hair: 'jacob',
      torso: { body: 0x8a8e96, shoulder: 0x8a8e96 },
      torsoExtras: [ell(0, 0.42, -0.1, 0.12, 0.06, 0.06, 0x7a7e86), box(0, 0.06, 0.112, 0.15, 0.08, 0.02, 0x7a7e86), box(0, 0.22, -0.16, 0.24, 0.3, 0.1, 0x2a4a3a), box(-0.08, 0.3, -0.06, 0.03, 0.2, 0.18, 0x1a2a20), box(0.08, 0.3, -0.06, 0.03, 0.2, 0.18, 0x1a2a20)],
      hips: 0x4a6a9a,
      arm: { upper: [[0, 1, 0x8a8e96]], fore: [[0, 1, 0x8a8e96]] },
      leg: MALE_LEG(0x4a6a9a, SNEAKER(0x30343c))
    },
    kidJacob: {
      person: 'jacob', body: 'him', skin: JACOB_SKIN, hair: null, gear: ['boxhead'], scale: 0.62,
      torso: { body: 0x6a8ac0 },
      torsoExtras: [box(0, 0.24, 0.115, 0.1, 0.1, 0.02, 0xc8ccd6), box(-0.02, 0.26, 0.127, 0.02, 0.02, 0.004, glow(0xff4040)), box(0.02, 0.22, 0.127, 0.02, 0.02, 0.004, glow(0x40ff60))],
      hips: 0x4a5a7a,
      arm: { upper: [[0, 1, 0x6a8ac0]], fore: [[0, 1, JACOB_SKIN]] },
      leg: { thigh: [[0, 1, 0x4a5a7a]], shin: [[0, 1, JACOB_SKIN]], shoe: SNEAKER(0x2a2a2a) }
    },
    silver: {
      person: 'crowd', body: 'him', skin: 0xeccab0, hair: null, gear: ['silverBubble'], helmet: 'bubble',
      torso: { body: 0xc8ccd6, shoulder: 0xe0e4ec },
      torsoExtras: [box(-0.2, 0.36, 0, 0.08, 0.02, 0.1, 0xe0e4ec), box(0.2, 0.36, 0, 0.08, 0.02, 0.1, 0xe0e4ec), ell(0, 0.28, 0.11, 0.03, 0.03, 0.01, glow(0x60a0ff))],
      hips: 0xa8acb6,
      arm: { upper: [[0, 1, 0xc8ccd6]], fore: [[0, 1, 0xc8ccd6]], hand: 0x8a8e96 },
      leg: MALE_LEG(0xc8ccd6, BOOT(0x8a8e96))
    }
  });

  const CROWD = [
    { body: 'him', skin: 0xf0d0b8, hair: null, gear: ['knight'], torso: { body: 0xa8acb4, chest: 0xc0c4cc, shoulder: 0xd0d4dc }, hips: 0x8a8e96, arm: { upper: [[0, 1, 0xb8bcc4]], fore: [[0, 1, 0xa8acb4]], hand: 0x8a8e96 }, leg: MALE_LEG(0x8a8e96, BOOT(0x6a6e76)) },
    { skin: 0xf4dccc, hair: 'witch', gear: ['witch'], torso: { body: 0x2a4a2a }, hips: 0x1a301a, skirt: { type: 'long', col: 0x1a301a, dark: 0x6a3a8a }, arm: { upper: [[0, 1, 0x2a4a2a]], fore: [[0, 1, 0x2a4a2a]] }, leg: MALE_LEG(0x101010, BOOT(0x101010)) },
    { skin: 0xfeebd7, hair: 'pink', gear: ['catEars'], torso: { body: 0x202030, chest: 0xffffff }, hips: 0x202030, skirt: { type: 'pleat', col: 0x202030, dark: 0x2a2a40 }, arm: { upper: [[0, 1, 0x202030]], fore: [[0, 0.8, 0xfeebd7], [0.8, 1, 0xffffff]] }, leg: { thigh: [[0, 0.5, 0xffffff], [0.5, 1, 0xfeebd7]], shin: [[0, 1, 0xffffff]], shoe: { type: 'sneaker', col: 0x202020 } } },
    { body: 'him', skin: 0xd8a880, hair: 'black', mask: 0x1a1a1a, torso: { body: 0x1a8a84, chest: 0x1a8a84 }, torsoExtras: [ell(0, 0.26, 0.118, 0.035, 0.035, 0.01, 0xf4f4f4)], cape: { col: 0xe07020, len: 0.85 }, hips: 0x1a1a1a, arm: { upper: [[0, 1, 0x1a8a84]], fore: [[0, 1, 0x1a8a84]], hand: 0x1a1a1a }, leg: { thigh: [[0, 1, 0x1a8a84]], shin: [[0, 0.6, 0x1a1a1a], [0.6, 1, 0x1a8a84]], shoe: BOOT(0x1a1a1a) } },
    { body: 'him', skin: 0xf0d0b8, hair: null, gear: ['chromeA'], torso: { body: 0x16161a }, hips: 0x16161a, arm: { upper: [[0, 1, 0x16161a]], fore: [[0, 1, 0x16161a]], hand: 0x16161a }, leg: MALE_LEG(0x16161a, BOOT(0x16161a)) },
    { body: 'him', skin: 0xa87850, hair: null, gear: ['chromeB'], torso: { body: 0x16161a }, hips: 0x16161a, arm: { upper: [[0, 1, 0x16161a]], fore: [[0, 1, 0x16161a]], hand: 0x16161a }, leg: MALE_LEG(0x16161a, BOOT(0x16161a)) },
    { body: 'him', skin: 0xfeebd7, hair: null, gear: ['jester'], torso: { body: 0xd02030, chest: 0xf0c020 }, torsoExtras: [ring(0.4, 0.09, 0.05, 0xffffff, 0.075)], hips: 0xf0c020, arm: { upper: [[0, 1, 0xf0c020]], fore: [[0, 1, 0xd02030]] }, leg: { thigh: [[0, 1, 0xd02030]], shin: [[0, 1, 0xf0c020]], shoe: BOOT(0xd02030) } },
    { skin: 0xfeebd7, hair: 'blue', torso: { body: 0x2050c0, chest: 0xf0f0f4 }, torsoExtras: [front(-0.04, 0.04, 0.05, 0.3, 0.116, 0x2050c0)], hips: 0x2050c0, skirt: { type: 'frill', col: 0x2050c0, light: 0xf0f0f4, trim: 0x101010 }, arm: { upper: [[0, 1, 0xf0f0f4]], fore: [[0, 1, 0x2050c0]] }, leg: { thigh: [[0, 1, 0x101018]], shin: [[0, 1, 0x101018]], shoe: { type: 'heel', col: 0x101018 } } },
    { body: 'him', skin: 0xeccab0, hair: null, gear: ['ninja'], mask: 0x16161c, torso: { body: 0x16161c }, hips: 0x16161c, arm: { upper: [[0, 1, 0x16161c]], fore: [[0, 1, 0x16161c]], hand: 0x16161c }, leg: MALE_LEG(0x16161c, BOOT(0x16161c)) },
    { skin: 0xf6dcc8, hair: 'brown', gear: ['goggles'], torso: { body: 0xe07020, shoulder: 0xf0f0f0 }, torsoExtras: [box(0, 0.2, 0.11, 0.02, 0.26, 0.02, 0xf0f0f0)], hips: 0xe07020, arm: { upper: [[0, 1, 0xe07020]], fore: [[0, 1, 0xe07020]], hand: 0x303030 }, leg: { thigh: [[0, 1, 0xe07020]], shin: [[0, 1, 0xe07020]], shoe: BOOT(0x303030) } },
    { body: 'him', skin: 0xf0d0b8, hair: null, gear: ['wizard'], torso: { body: 0x3a2a8a }, hips: 0x3a2a8a, skirt: { type: 'long', col: 0x3a2a8a, dark: 0xd0b040 }, arm: { upper: [[0, 1, 0x3a2a8a]], fore: [[0, 1, 0x3a2a8a]] }, leg: MALE_LEG(0x2a1a6a, BOOT(0x2a1a6a)) },
    { skin: 0xfeebd7, hair: 'black', gear: ['bun'], torso: { body: 0xc04060 }, torsoExtras: [ring(0.12, 0.112, 0.08, 0xf0c040, 0.1)], hips: 0xc04060, skirt: { type: 'long', col: 0xc04060, dark: 0xf0c040 }, arm: { upper: [[0, 1, 0xc04060]], fore: [[0, 1, 0xc04060]] }, leg: MALE_LEG(0xf4f4f4, { type: 'sneaker', col: 0xa07040 }) },
    { body: 'him', skin: 0xd8a880, hair: 'brown', torso: { body: 0x2a6ab0 }, hips: 0x3a3a3a, arm: { upper: [[0, 1, 0x2a6ab0]], fore: [[0, 1, 0x2a6ab0]] }, leg: MALE_LEG(0x3a3a3a, SNEAKER(0xd02020)), props: [{ id: 'sword', part: 'foreR' }] }
  ];
  CROWD.forEach((c, i) => { FORMS['crowd' + i] = Object.assign({ person: 'crowd' }, c); });
  FORMS.rangerFan = Object.assign({}, FORMS.talleahRanger, { person: 'crowd', body: 'him', skin: 0xeccab0, hair: 'brown', bust: 0, scale: 1 });

  function headMesh() {
    const b = new Builder();
    headPatch(b, R * HX, R * HY, R * HZ, -PI, PI, -PI / 2, PI / 2, 16, 12, 0xffffff);
    [-1, 1].forEach(s => b.at(s * R * 0.86, -R * 0.12, -R * 0.02, (h) => h.ellipsoid(0.014, 0.026, 0.018, 6, 4, 0xffffff)));
    return b;
  }

  function faceMesh() {
    const b = new Builder();
    const k = 1.006;
    headPatch(b, R * HX * k, R * HY * k, R * HZ * k, -0.92, 0.92, -0.74, 0.42, 12, 10, [1, 1, 1, 0], [1, 1]);
    return b;
  }

  function glassesMesh(col) {
    const b = new Builder();
    const t = 0.0055;
    [-1, 1].forEach(s => {
      const cx = s * 0.037, cy = -0.012, z = 0.124 - Math.abs(s) * 0.004;
      b.at(cx, cy + 0.017, z, (h) => h.box(0.054, t, t, col));
      b.at(cx, cy - 0.017, z, (h) => h.box(0.054, t, t, col));
      b.at(cx + 0.027, cy, z, (h) => h.box(t, 0.034, t, col));
      b.at(cx - 0.027, cy, z, (h) => h.box(t, 0.034, t, col));
      b.at(s * 0.074, cy + 0.012, 0.07, (h) => h.box(t, t, 0.1, col));
    });
    b.at(0, -0.002, 0.128, (h) => h.box(0.022, t, t, col));
    return b;
  }

  function earsMesh() {
    const b = new Builder();
    const band = 0x51192e, inner = 0xfb2894;
    headPatch(b, R * HX * 1.12, R * HY * 1.12, R * HZ * 1.12, -1.6, 1.6, 0.85, 0.95, 10, 1, band);
    [-1, 1].forEach(s => {
      const p = headPoint(s * 0.62, 0.95, 1.08);
      b.push(M4.translate(p[0], p[1], p[2]), M4.rotZ(-s * 0.35));
      b.prism(3, 0.05, 0.03, 0, 0.004, 0.004, 0.085, band, { phase: PI, capBottom: true });
      b.at(0, 0.008, 0.012, (h) => h.prism(3, 0.022, 0.008, 0, 0.003, 0.003, 0.045, glow(inner), { phase: PI }));
      b.pop();
    });
    return b;
  }

  function bowMesh() {
    const b = new Builder();
    b.push(M4.translate(-R * 0.45, R * 0.72, -R * 0.62), M4.rotY(-0.7), M4.rotX(-0.35), M4.scale(0.8));
    [-1, 1].forEach(s => b.at(s * 0.07, 0, 0, (h) => h.ellipsoid(0.07, 0.05, 0.022, 8, 5, 0xf06aa0)));
    [-1, 1].forEach(s => b.at(s * 0.03, -0.07, 0, (h) => h.box(0.03, 0.08, 0.012, 0xe85a92)));
    b.ellipsoid(0.028, 0.03, 0.026, 8, 5, glow(0xff4a8a));
    b.pop();
    return b;
  }

  function harnessMesh() {
    const b = new Builder();
    [-1, 1].forEach(s => {
      const p = headPoint(s * 1.25, 0.1, 1.1);
      b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(s * 1.25));
      b.box(0.012, 0.05, 0.03, 0x213659);
      b.at(0, -0.01, 0.018, (h) => h.box(0.014, 0.01, 0.01, glow(0x3a7ae0)));
      b.pop();
    });
    return b;
  }

  function hatMesh(kind) {
    const b = new Builder();
    if (kind === 'witch') {
      b.at(0, R * 0.7, -0.01, (h) => {
        h.prism(14, 0.24, 0.24, -0.01, 0.24, 0.24, 0.01, 0x2a1a40, { capBottom: true });
        h.prism(10, 0.12, 0.12, 0.01, 0.01, 0.01, 0.3, 0x3a2a5a);
        h.prism(10, 0.123, 0.123, 0.01, 0.112, 0.112, 0.04, 0x8a4ab0, { capTop: false });
      });
    } else if (kind === 'knight') {
      b.ellipsoid(R * 1.06, R * 1.12, R * 1.1, 12, 8, 0xc0c4cc);
      b.at(0, 0, R * 1.0, (h) => h.box(R * 1.3, 0.016, 0.02, 0x2a2a30));
      b.at(0, R * 1.0, -0.02, (h) => h.ellipsoid(0.03, 0.08, 0.12, 6, 4, 0xd02030));
    }
    return b;
  }

  function bubbleMesh() {
    const b = new Builder();
    b.ellipsoid(R * 1.45, R * 1.45, R * 1.45, 14, 10, [0.75, 0.9, 1.0, 0.6]);
    return b;
  }

  function printTex(ctx, w, h, kind) {
    ctx.fillStyle = kind === 'lantern' ? '#2f9a4a' : '#f2f6fd';
    ctx.fillRect(0, 0, w, h);
    if (kind === 'lantern') {
      ctx.fillStyle = '#f4f4f4';
      ctx.fillRect(w * 0.42, h * 0.1, w * 0.16, h * 0.1);
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.25);
      ctx.lineTo(w * 0.7, h * 0.25);
      ctx.lineTo(w * 0.62, h * 0.78);
      ctx.lineTo(w * 0.38, h * 0.78);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffe680';
      ctx.fillRect(w * 0.44, h * 0.36, w * 0.12, h * 0.3);
      ctx.fillStyle = '#f4f4f4';
      ctx.fillRect(w * 0.32, h * 0.82, w * 0.36, h * 0.08);
      return;
    }
    ctx.fillStyle = '#1a1a22';
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.3);
    ctx.lineTo(w * 0.9, h * 0.18);
    ctx.lineTo(w * 0.62, h * 0.95);
    ctx.lineTo(w * 0.38, h * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f0489a';
    ctx.font = `bold ${Math.round(h * 0.42)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Magia', w * 0.5, h * 0.45);
  }

  function gearMesh(kinds) {
    const b = new Builder();
    kinds.forEach(kind => {
      if (kind === 'magnitude') {
        b.ellipsoid(R * 1.12, R * 1.16, R * 1.14, 14, 9, 0xb02028);
        headPatch(b, R * HX * 1.16, R * HY * 1.08, R * HZ * 1.2, -0.62, 0.62, -0.2, 0.0, 8, 1, [0.06, 0.04, 0.06, 0.2]);
        b.at(0, -R * 0.62, R * 0.62, (h) => h.box(R * 1.2, R * 0.4, R * 0.5, 0x8a1820));
        [-1, 1].forEach(s => {
          b.push(M4.translate(s * R * 0.42, R * 0.9, 0), M4.rotZ(-s * 0.25));
          b.box(0.03, 0.12, 0.05, 0x9aa0aa);
          b.at(0, 0.07, 0, (h) => h.box(0.032, 0.03, 0.052, 0xd02030));
          b.pop();
        });
        b.at(0, R * 0.95, 0, (h) => h.box(R * 0.9, 0.025, 0.05, 0x9aa0aa));
      } else if (kind === 'boxhead') {
        b.at(0, 0.01, 0, (h) => h.box(0.3, 0.29, 0.29, 0xb08a5a));
        b.at(0, 0.0, 0.147, (h) => h.box(0.2, 0.07, 0.004, 0x2a2018));
        [-1, 1].forEach(s => b.at(s * 0.05, 0.0, 0.15, (h) => h.box(0.03, 0.03, 0.004, glow(0x60ff70))));
        b.at(0.08, 0.17, 0, (h) => h.box(0.008, 0.06, 0.008, 0x8a8e96));
      } else if (kind === 'chromeA' || kind === 'chromeB') {
        const c = kind === 'chromeA' ? [0.86, 0.88, 0.92, 0.25] : [0.95, 0.78, 0.36, 0.25];
        b.ellipsoid(R * 1.18, R * 1.24, R * 1.2, 14, 9, c);
        headPatch(b, R * HX * 1.36, R * HY * 1.04, R * HZ * 1.36, -0.9, 0.9, -0.4, 0.12, 10, 2, [0.05, 0.05, 0.08, 0.3]);
      } else if (kind === 'jester') {
        b.ellipsoid(R * 1.08, R * 0.9, R * 1.08, 12, 6, 0xd02030);
        [[-1, 0xd02030], [0, 0xf0c020], [1, 0xd02030]].forEach(([s, col]) => {
          b.push(M4.translate(s * R * 0.6, R * 0.6, -R * 0.2), M4.rotZ(-s * 0.9), M4.rotX(s === 0 ? -0.6 : 0));
          b.prism(6, 0.05, 0.05, 0, 0.012, 0.012, 0.2, col);
          b.at(0, 0.21, 0, (h) => h.ellipsoid(0.02, 0.02, 0.02, 6, 4, 0xf8e040));
          b.pop();
        });
      } else if (kind === 'ninja') {
        b.ellipsoid(R * 1.08, R * 1.12, R * 1.1, 12, 8, 0x16161c);
        b.at(0, R * 0.32, 0, (h) => h.prism(12, R * 1.1, R * 1.12, 0, R * 1.1, R * 1.12, 0.03, 0xc02030, { capTop: false }));
      } else if (kind === 'wizard') {
        b.at(0, R * 0.7, -0.01, (h) => {
          h.prism(14, 0.22, 0.22, -0.01, 0.22, 0.22, 0.01, 0x3a2a8a, { capBottom: true });
          h.push(M4.rotX(-0.25));
          h.prism(10, 0.12, 0.12, 0.01, 0.01, 0.01, 0.34, 0x3a2a8a);
          h.pop();
        });
        b.at(0, -R * 0.75, R * 0.6, (h) => h.prism(8, 0.08, 0.05, -0.2, 0.09, 0.06, 0.04, 0xf0f0f4, { capBottom: true }));
      } else if (kind === 'goggles') {
        b.at(0, R * 0.45, 0, (h) => h.prism(14, R * 0.98, R * 1.04, -0.012, R * 0.98, R * 1.04, 0.012, 0x2a2a2a, { capTop: false }));
        [-1, 1].forEach(s => b.at(s * 0.04, R * 0.45, R * 0.98, (h) => h.prism(10, 0.026, 0.026, -0.012, 0.026, 0.026, 0.012, [0.5, 0.8, 1.0, 0.4])));
      } else if (kind === 'bun') {
        b.at(0, R * 0.75, -R * 0.55, (h) => h.ellipsoid(0.06, 0.055, 0.06, 8, 5, 0x141018));
        b.at(0.02, R * 0.85, -R * 0.55, (h) => h.box(0.006, 0.006, 0.16, 0xd03040));
      } else if (kind === 'catEars') {
        [-1, 1].forEach(s => {
          const p = headPoint(s * 0.6, 0.95, 1.06);
          b.push(M4.translate(p[0], p[1], p[2]), M4.rotZ(-s * 0.35));
          b.prism(3, 0.045, 0.026, 0, 0.004, 0.004, 0.075, 0x1a1418, { phase: PI, capBottom: true });
          b.pop();
        });
      } else if (kind === 'silverBubble') {
        b.at(0, -R * 0.95, 0, (h) => h.prism(14, R * 1.1, R * 1.1, -0.02, R * 1.15, R * 1.15, 0.02, 0xc8ccd6));
      } else if (kind === 'knight' || kind === 'witch') {
        const k = hatMesh(kind);
        b.data.push(...k.data);
      }
    });
    return b;
  }

  function capeMesh(spec) {
    const C0 = spec.cape;
    const d = dimsOf(spec);
    const b = new Builder();
    const top = d.torso * 0.94, z0 = -d.depth - 0.03;
    const n = 6;
    for (let i = 0; i < n; i++) {
      const fa = i / n - 0.5, fb = (i + 1) / n - 0.5;
      const xa0 = fa * 0.34, xb0 = fb * 0.34, xa1 = fa * 0.56, xb1 = fb * 0.56;
      const y1 = top - C0.len;
      const za = z0 - 0.04 * C(fa * PI), zb = z0 - 0.04 * C(fb * PI);
      b.quad([xa0, top, z0], [xb0, top, z0], [xb1, y1, zb - 0.06], [xa1, y1, za - 0.06], i % 2 ? C0.col : shade(C0.col, 0.9), null, [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
      b.quad([xb0, top, z0 + 0.008], [xa0, top, z0 + 0.008], [xa1, y1, za - 0.052], [xb1, y1, zb - 0.052], C0.inner || shade(C0.col, 0.7), null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    }
    b.prism(12, d.chest * 0.75, d.depth * 0.9, top - 0.02, d.chest * 0.62, d.depth * 0.75, top + 0.04, C0.col, { capTop: false });
    return b;
  }

  function propMesh(id) {
    const b = new Builder();
    if (id === 'badge') {
      b.box(0.06, 0.085, 0.004, 0xf4f4f0);
      b.at(0, 0.02, 0.003, (h) => h.box(0.05, 0.03, 0.002, 0xc02040));
      b.at(-0.012, -0.015, 0.003, (h) => h.box(0.02, 0.025, 0.002, 0x8aa0c0));
      [0.006, -0.004, -0.014, -0.024].forEach(y => b.at(0.014, y, 0.003, (h) => h.box(0.02, 0.003, 0.002, 0x606060)));
      b.at(0, -0.02, -0.006, (h) => h.box(0.012, 0.14, 0.003, 0x2050c0));
    } else if (id === 'letter') {
      b.box(0.15, 0.1, 0.003, 0xf6f0e2);
      b.quad([-0.075, 0.05, 0.002], [0.075, 0.05, 0.002], [0, -0.01, 0.002], [0, -0.01, 0.002], 0xe8e0cc, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      b.at(0, -0.005, 0.003, (h) => h.ellipsoid(0.016, 0.014, 0.003, 8, 3, 0xd02030));
      [-1, 1].forEach(s => b.at(s * 0.008, 0.008, 0.004, (h) => h.prism(3, 0.006, 0.003, 0, 0.001, 0.001, 0.01, 0xd02030)));
    } else if (id === 'phone') {
      b.box(0.055, 0.11, 0.012, 0x2a2a30);
      b.at(0, 0.01, 0.0065, (h) => h.box(0.046, 0.07, 0.001, [0.85, 0.9, 1.0, 0.8]));
      [[-0.008, 0.03], [0.006, 0.012], [-0.006, -0.006]].forEach(([x, y]) => b.at(x, y, 0.0075, (h) => h.box(0.026, 0.012, 0.001, [1.0, 0.55, 0.75, 0.9])));
    } else if (id === 'cuffs') {
      b.prism(10, 0.045, 0.045, -0.015, 0.045, 0.045, 0.015, [0.75, 0.78, 0.85, 0.3], { capTop: false });
      b.at(0.05, 0, 0, (h) => h.box(0.06, 0.012, 0.012, [0.6, 0.62, 0.7, 0.2]));
    } else if (id === 'scepter') {
      b.push(M4.rotX(PI));
      b.prism(8, 0.012, 0.012, -0.12, 0.012, 0.012, 0.42, 0xf6a8cc, { capBottom: true });
      b.at(0, -0.13, 0, (h) => h.ellipsoid(0.02, 0.02, 0.02, 6, 4, 0xc5883d));
      b.at(0, 0.47, 0, (h) => {
        h.push(M4.rotZ(PI / 4));
        h.box(0.06, 0.06, 0.03, glow(0xff3a86));
        h.pop();
        h.at(0.03, 0.03, 0, (c) => c.ellipsoid(0.034, 0.034, 0.02, 8, 5, glow(0xff3a86)));
        h.at(-0.03, 0.03, 0, (c) => c.ellipsoid(0.034, 0.034, 0.02, 8, 5, glow(0xff3a86)));
        h.prism(12, 0.07, 0.07, -0.012, 0.07, 0.07, 0.012, 0xc5883d, { capTop: false });
        [-1, 1].forEach(sx => {
          h.push(M4.translate(sx * 0.07, 0.02, -0.01), M4.rotZ(sx * -0.5));
          h.quad([0, 0, 0], [sx * 0.11, 0.04, 0], [sx * 0.1, 0.1, 0], [0, 0.05, 0], 0xfafafe, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
          h.pop();
        });
      });
      b.pop();
    } else if (id === 'blaster') {
      b.push(M4.rotX(PI));
      b.at(0, -0.02, 0, (h) => h.box(0.035, 0.09, 0.05, 0x6a6e78));
      b.prism(10, 0.03, 0.03, 0, 0.022, 0.022, 0.16, 0xc0c4d0, { capBottom: true });
      [0.03, 0.06, 0.09].forEach(y => b.prism(10, 0.04, 0.04, y - 0.006, 0.04, 0.04, y + 0.006, 0xe0b040, { capTop: false }));
      b.at(0, 0.18, 0, (h) => h.ellipsoid(0.026, 0.026, 0.026, 8, 5, glow(0x5ab0ff)));
      b.pop();
    } else if (id === 'pistol') {
      b.push(M4.rotX(PI));
      b.at(0, -0.02, 0, (h) => h.box(0.03, 0.08, 0.045, 0x3a1323));
      b.at(0, 0.06, 0.012, (h) => h.box(0.04, 0.15, 0.05, 0x8d2f4e));
      b.at(0, 0.06, 0.04, (h) => h.box(0.042, 0.12, 0.008, glow(0xfb2894)));
      b.at(0, 0.14, 0.012, (h) => h.ellipsoid(0.014, 0.014, 0.014, 6, 4, glow(0xff6ad0)));
      b.pop();
    } else if (id === 'shield') {
      [[0.3, 0x2050c0], [0.24, 0xf0d040], [0.17, 0x2050c0], [0.09, 0xf0d040]].forEach(([rr, col], i) => b.at(0, 0, i * 0.008, (h) => {
        h.push(M4.rotX(PI / 2));
        h.prism(20, rr, rr, -0.01, rr, rr, 0.01, col, { capBottom: true });
        h.pop();
      }));
    } else if (id === 'keycard') {
      b.box(0.055, 0.085, 0.004, 0xf4f4f0);
      b.at(0, 0.02, 0.003, (h) => h.box(0.045, 0.012, 0.002, 0x2a2a2a));
    } else if (id === 'camera') {
      b.box(0.12, 0.07, 0.05, 0x2a2a30);
      b.at(0, 0, 0.04, (h) => h.prism(10, 0.024, 0.024, -0.01, 0.022, 0.022, 0.03, 0x101014));
      b.at(0.04, 0.045, 0, (h) => h.box(0.03, 0.02, 0.03, [0.9, 0.9, 0.95, 0.6]));
    } else if (id === 'device') {
      b.box(0.14, 0.05, 0.09, 0x6a6e78);
      [-0.04, 0, 0.04].forEach((x, i) => b.at(x, 0.03, 0.02, (h) => h.ellipsoid(0.012, 0.012, 0.012, 6, 4, glow([0xff3040, 0x40ff60, 0xffd040][i]))));
      b.at(0.05, 0.08, -0.02, (h) => h.box(0.006, 0.12, 0.006, 0xc8ccd4));
      b.at(0.05, 0.14, -0.02, (h) => h.ellipsoid(0.012, 0.012, 0.012, 6, 4, glow(0xfb2894)));
    } else if (id === 'crate') {
      b.box(0.44, 0.3, 0.32, 0xe8ecf6);
      b.at(0, 0, 0.162, (h) => h.box(0.36, 0.03, 0.004, glow(0x6ccefb)));
      b.at(0, 0.152, 0, (h) => h.box(0.3, 0.004, 0.24, 0xc8d0e4));
    } else if (id === 'sword') {
      b.at(0, -0.06, 0.02, (h) => h.box(0.03, 0.08, 0.03, 0x2a2a2a));
      b.at(0, -0.03, 0.02, (h) => h.box(0.12, 0.02, 0.03, 0x8a6a3a));
      b.at(0, 0.3, 0.02, (h) => h.box(0.06, 0.6, 0.012, 0xc8a070));
    } else if (id === 'helmetProp') {
      const g = gearMesh(['magnitude']);
      b.data.push(...g.data);
    }
    return b;
  }

  function povArmMesh(sleeve, hand) {
    const b = new Builder();
    b.push(M4.rotX(PI / 2));
    b.prism(10, 0.04, 0.042, -0.42, 0.034, 0.036, -0.02, sleeve, { capBottom: true });
    b.at(0, -0.46, 0.004, (h) => h.box(0.058, 0.085, 0.03, hand));
    b.at(0.03, -0.44, 0.02, (h) => h.box(0.018, 0.05, 0.018, hand));
    b.pop();
    return b;
  }

  function viewFrame(camera) {
    const f = V3.norm(V3.sub(camera.at, camera.eye));
    let rt = V3.cross(f, [0, 1, 0]);
    if (V3.len(rt) < 1e-4) rt = [1, 0, 0];
    rt = V3.norm(rt);
    const up = V3.cross(rt, f);
    const e = camera.eye;
    return new Float32Array([rt[0], rt[1], rt[2], 0, up[0], up[1], up[2], 0, -f[0], -f[1], -f[2], 0, e[0], e[1], e[2], 1]);
  }

  function drawPov(r, X, camera, arms) {
    const V = viewFrame(camera);
    arms.forEach(arm => {
      const s = arm.side === 'L' ? -1 : 1;
      const key = arm.sleeve + ':' + arm.hand;
      const mesh = X.povArm(key, arm.sleeve, arm.hand);
      const p = arm.at || [s * 0.2, -0.3, -0.14];
      const rot = arm.rot || [0.32, s * 0.2, 0];
      const M = M4.chain(V, M4.translate(p[0], p[1], p[2]), M4.rotY(rot[1]), M4.rotX(rot[0]), M4.rotZ(rot[2]));
      r.draw(mesh, M, {});
      if (arm.prop) r.draw(X.prop(arm.prop), M4.chain(M, M4.translate(0, 0.03, -0.5), M4.rotX(arm.propTilt === undefined ? -0.2 : arm.propTilt)), {});
    });
  }

  function buildForm(r, id) {
    const spec = FORMS[id];
    const mk = (b) => (b ? r.mesh(b) : null);
    const armR = armMeshes(spec);
    const armL = spec.armL ? armMeshes(Object.assign({}, spec, { arm: Object.assign({}, spec.arm, spec.armL) })) : armR;
    const legs = legMeshes(spec);
    const hair = spec.hair ? buildHair(spec.hair) : null;
    const set = {
      spec,
      hips: mk(hipsMesh(spec)),
      torso: mk(torsoMesh(spec)),
      skirt: mk(skirtMesh(spec)),
      upperR: mk(armR.up), foreR: mk(armR.fo), upperL: mk(armL.up), foreL: mk(armL.fo),
      thigh: mk(legs.th), shin: mk(legs.sh),
      hair: hair ? mk(hair.head) : null,
      back: hair && hair.back.data.length ? mk(hair.back) : null,
      glasses: spec.glasses ? mk(glassesMesh(spec.glasses)) : null,
      ears: spec.ears ? mk(earsMesh()) : null,
      bow: spec.bow ? mk(bowMesh()) : null,
      harness: spec.harness ? mk(harnessMesh()) : null,
      hat: spec.hat ? mk(hatMesh(spec.hat)) : spec.helmet === 'knight' ? mk(hatMesh('knight')) : null,
      bubble: spec.helmet === 'bubble' ? mk(bubbleMesh()) : null,
      gear: spec.gear ? mk(gearMesh(spec.gear)) : null,
      cape: spec.cape ? mk(capeMesh(spec)) : null
    };
    return set;
  }

  function decalMeshes(r) {
    const quad = new Builder();
    quad.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    return r.mesh(quad);
  }

  function gynoidSet(r) {
    const d = GYN;
    const W = 0xe2e5fa, Wd = 0xbbc8e7, K = 0x16203c, F = 0x1d3074;
    const mk = (fn) => { const b = new Builder(); fn(b); return r.mesh(b); };
    return {
      head: mk(b => {
        b.ellipsoid(0.12, 0.14, 0.13, 12, 8, W);
        headPatch(b, 0.127, 0.146, 0.136, -1.05, 1.05, -0.6, 0.45, 10, 6, [0.08, 0.12, 0.22, 0.25]);
        [-1, 1].forEach(s => {
          b.push(M4.translate(s * 0.115, 0.03, -0.02), M4.rotZ(-s * 0.35), M4.rotX(-0.35));
          b.prism(4, 0.022, 0.05, 0, 0.004, 0.02, 0.16, F, { phase: PI / 4, capBottom: true });
          b.pop();
          b.at(s * 0.118, -0.01, 0, (h) => h.ellipsoid(0.02, 0.035, 0.035, 6, 4, K));
        });
      }),
      torso: mk(b => {
        b.prism(12, d.waist, d.depth * 0.9, -0.02, d.waist * 0.95, d.depth * 0.85, 0.18, K, { capBottom: true, capTop: false });
        for (let y = 0.02; y < 0.18; y += 0.04) b.prism(12, d.waist * 1.02, d.depth * 0.92, y, d.waist * 1.0, d.depth * 0.9, y + 0.012, 0x2a3450, { capTop: false });
        b.prism(12, d.waist * 0.95, d.depth * 0.85, 0.18, d.chest, d.depth * 1.05, 0.3, W, { capTop: false });
        b.prism(12, d.chest, d.depth * 1.05, 0.3, 0.06, 0.05, d.torso, W);
        b.at(0, 0.26, 0.07, (h) => h.ellipsoid(0.11, 0.07, 0.06, 10, 6, Wd));
        b.prism(8, 0.035, 0.033, d.torso - 0.02, 0.032, 0.03, d.torso + 0.1, K, { capTop: false });
        [-1, 1].forEach(s => b.at(s * (d.shoulder - 0.005), d.torso * 0.9, 0, (h) => h.ellipsoid(0.065, 0.05, 0.065, 10, 6, W)));
      }),
      hatch: mk(b => {
        b.quad([-0.05, -0.04, 0], [0.05, -0.04, 0], [0.05, 0.04, 0], [-0.05, 0.04, 0], Wd, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      }),
      scanner: mk(b => b.at(0, 0, -0.005, (h) => h.ellipsoid(0.035, 0.03, 0.01, 8, 4, glow(0x6ccefb)))),
      hips: mk(b => {
        b.prism(12, d.waist * 1.2, d.depth, -0.11, d.waist * 1.0, d.depth * 0.92, 0.08, K, { capBottom: true });
        b.at(0, -0.04, 0.09, (h) => h.box(0.13, 0.09, 0.03, W));
        [-1, 1].forEach(s => b.at(s * 0.1, -0.03, 0, (h) => h.box(0.04, 0.12, 0.14, W)));
      }),
      upper: mk(b => {
        b.prism(8, 0.036, 0.036, -d.upper, 0.044, 0.044, -0.02, W, { capBottom: true });
        b.at(0, -d.upper, 0, (h) => h.ellipsoid(0.034, 0.034, 0.034, 6, 4, K));
      }),
      fore: mk(b => {
        b.prism(8, 0.03, 0.03, -d.fore, 0.038, 0.038, -0.01, W, { capBottom: true });
        b.at(0, -d.fore - 0.04, 0.004, (h) => h.box(0.05, 0.08, 0.028, K));
        b.at(0.014, -d.fore - 0.03, 0.022, (h) => h.box(0.016, 0.05, 0.016, K));
      }),
      thigh: mk(b => {
        b.prism(8, 0.05, 0.052, -d.thigh, 0.07, 0.072, -0.02, W, { capBottom: true });
        b.at(0, -d.thigh, 0, (h) => h.ellipsoid(0.045, 0.045, 0.045, 6, 4, K));
      }),
      shin: mk(b => {
        b.prism(8, 0.03, 0.034, -d.shin, 0.048, 0.05, -0.02, W, { capBottom: true });
        b.at(0, -d.shin - d.sole / 2, 0.05, (h) => {
          h.box(0.05, d.sole * 0.8, 0.13, W);
          h.at(0, -d.sole * 0.1, -0.055, (c) => c.box(0.016, d.sole * 1.2, 0.016, K));
        });
      })
    };
  }

  function solver(form) {
    if (form === 'gynoid') return { d: GYN, scale: 1.0 };
    const spec = FORMS[form];
    return { d: dimsOf(spec), scale: spec.scale || 1 };
  }

  function solve(form, pose) {
    return Figure.prototype.solve.call(solver(form), pose);
  }

  function makeCast(r) {
    const forms = {};
    const faces = {};
    const tex = {};
    const X = {
      r,
      head: r.mesh(headMesh()),
      face: r.mesh(faceMesh()),
      decal: decalMeshes(r),
      gynoid: gynoidSet(r),
      form(id) {
        return forms[id] || (forms[id] = buildForm(r, id));
      },
      faceTex(person, kind, mask, skin) {
        const key = person + ':' + kind + ':' + (mask || '') + ':' + (skin === undefined ? '' : skin);
        return faces[key] || (faces[key] = r.texture(256, drawFace(person, kind, mask, skin), { clamp: true }));
      },
      prop(id) {
        return tex['prop:' + id] || (tex['prop:' + id] = r.mesh(propMesh(id)));
      },
      povArm(key, sleeve, hand) {
        return tex['arm:' + key] || (tex['arm:' + key] = r.mesh(povArmMesh(sleeve, hand)));
      },
      print(kind) {
        return tex[kind] || (tex[kind] = r.texture(128, (ctx, w, h) => printTex(ctx, w, h, kind), { clamp: true }));
      }
    };
    return X;
  }

  function drawGynoid(r, X, m, pass, pose) {
    const G = X.gynoid;
    r.draw(G.hips, m.hips, pass);
    r.draw(G.torso, m.torso, pass);
    r.draw(G.head, m.head, pass);
    ['L', 'R'].forEach(s => {
      r.draw(G.upper, m['upper' + s], pass);
      r.draw(G.fore, m['fore' + s], pass);
      r.draw(G.thigh, m['thigh' + s], pass);
      r.draw(G.shin, m['shin' + s], pass);
    });
    const open = clamp(pose.hatch || 0, 0, 1);
    const hm = M4.chain(m.torso, M4.translate(0, 0.27, 0.134), M4.translate(0, 0.04, 0), M4.rotX(-open * 1.9), M4.translate(0, -0.04, 0));
    r.draw(G.hatch, hm, pass);
    if (open > 0.1 && !pass.flat) r.draw(G.scanner, M4.chain(m.torso, M4.translate(0, 0.27, 0.13)), pass);
  }

  function drawActor(r, X, a, opts) {
    if (!a || a.hidden) return;
    const o = opts || {};
    const m = a.m;
    const D = o.pre ? (mesh, M, ps) => r.draw(mesh, M4.mul(o.pre, M), ps) : (mesh, M, ps) => r.draw(mesh, M, ps);
    const pass = o.flat ? { flat: o.flat, blend: o.flat[3] < 1, shadow: o.shadow } : o.tint ? { tint: o.tint } : {};
    if (a.form === 'gynoid') {
      drawGynoid(r, X, m, pass, a.pose);
      (a.props || []).forEach(pr => {
        const at = pr.at || [0, -GYN.fore - 0.05, 0.02];
        const rot = pr.rot || [0, 0, 0];
        D(X.prop(pr.id), M4.chain(m[pr.part || 'foreR'], M4.translate(at[0], at[1], at[2]), M4.rotX(rot[0]), M4.rotY(rot[1]), M4.rotZ(rot[2])), pass);
      });
      return;
    }
    const F = X.form(a.form);
    const spec = F.spec;
    const skinTint = rgb(spec.skin);
    const skinPass = o.flat ? pass : Object.assign({ tint: [skinTint[0], skinTint[1], skinTint[2]] }, pass);
    D(F.hips, m.hips, pass);
    if (F.skirt) D(F.skirt, m.skirt, pass);
    D(F.torso, m.torso, pass);
    if (spec.decal && !o.flat) {
      const [kind, x, y, z, sx, sy] = spec.decal;
      D(X.decal, M4.chain(m.torso, M4.translate(x, y, z), M4.scale(sx, sy, 1)), { texture: X.print(kind) });
    }
    ['L', 'R'].forEach(s => {
      D(F['upper' + s], m['upper' + s], pass);
      D(F['fore' + s], m['fore' + s], pass);
      D(F.thigh, m['thigh' + s], pass);
      D(F.shin, m['shin' + s], pass);
    });
    const hm = M4.mul(m.head, M4.translate(0, -0.005, 0.006));
    D(X.head, hm, skinPass);
    if (!o.flat) {
      const kind = a.pose.face || 'calm';
      const blinking = a.pose.blink > 0.5 && !['happy', 'sleep', 'yawn', 'wink'].includes(kind);
      D(X.face, hm, Object.assign({ texture: X.faceTex(spec.person, blinking ? 'sleep' : kind, a.pose.noMask ? null : spec.mask, spec.skin) }, pass));
    }
    if (F.hair) D(F.hair, hm, pass);
    if (F.back) {
      const sway = a.pose.hair || 0;
      const top = NECK_TOP + 0.13;
      D(F.back, M4.chain(m.torso, M4.translate(0, top, -0.11), M4.rotX(sway), M4.translate(0, -top, 0.11)), pass);
    }
    if (F.glasses && !a.pose.noGlasses) D(F.glasses, hm, pass);
    if (F.ears) D(F.ears, hm, pass);
    if (F.bow) D(F.bow, hm, pass);
    if (F.harness) D(F.harness, hm, pass);
    if (F.hat) D(F.hat, hm, pass);
    if (F.gear) D(F.gear, hm, pass);
    if (F.cape) {
      const d = dimsOf(spec);
      const top = d.torso * 0.94;
      D(F.cape, M4.chain(m.torso, M4.translate(0, top, 0), M4.rotX(a.pose.cape || 0), M4.translate(0, -top, 0)), pass);
    }
    (spec.props || []).concat(a.props || []).forEach(pr => {
      const at = pr.at || [0, -dimsOf(spec).fore - 0.05, 0.02];
      const rot = pr.rot || [0, 0, 0];
      D(X.prop(pr.id), M4.chain(m[pr.part || 'foreR'], M4.translate(at[0], at[1], at[2]), M4.rotX(rot[0]), M4.rotY(rot[1]), M4.rotZ(rot[2])), pass);
    });
    if (F.bubble && !o.flat) D(F.bubble, hm, { blend: true, alpha: 0.28 });
  }

  window.P3DCccCast = { HER, HIM, GYN, R, CROWD_COUNT: CROWD.length, drawPov, viewFrame, FORMS, FACES, PEOPLE, solve, solver, makeCast, drawActor, isHeroine: (form) => form === 'gynoid' || !!FORMS[form] };
})();
