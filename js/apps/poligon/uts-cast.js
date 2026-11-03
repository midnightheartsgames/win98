(function () {
  const { M4, V3, Builder, rgb } = window.P3D;
  const Cast = window.P3DCccCast;
  const GK = window.P3DGodKnowsCast;
  const { R, headPoint, headPatch, sideLocks, backHair, band } = Cast;

  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const NZ = [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]];
  const HX = 0.88, HY = 0.94, HZ = 0.9;

  const css = (c) => {
    const v = rgb(c);
    return `rgb(${Math.round(v[0] * 255)},${Math.round(v[1] * 255)},${Math.round(v[2] * 255)})`;
  };
  const mixc = (a, b, k) => {
    const x = rgb(a), y = rgb(b);
    return [lerp(x[0], y[0], k), lerp(x[1], y[1], k), lerp(x[2], y[2], k), 0];
  };
  const shade = (c, k) => {
    const v = rgb(c);
    return [Math.min(1, v[0] * k), Math.min(1, v[1] * k), Math.min(1, v[2] * k), v[3]];
  };
  const glow = (c, k) => {
    const v = rgb(c);
    return [v[0], v[1], v[2], k === undefined ? 0.9 : k];
  };

  const EYE_Y = 121;
  const EYE_X = [87, 169];
  const MX = 128, MY = 197;
  const LIDS = { smug: 0.42, sly: 0.36, blank: 0.32, grin: 0.12, cream: 0.18, sad: 0.14, dreamy: 0.5, sing: 0.08, say: 0.06, belt: 0.3 };
  const SHUT = { happy: 'up', sleep: 'down', shout: 'squeeze', kiss: 'down', bliss: 'up' };

  function eye(ctx, P, x, s, kind, skin) {
    const y = EYE_Y;
    const shut = SHUT[kind] || (kind === 'wink' && s > 0 ? 'up' : null);
    const ew = 18 * P.eyeW;
    const eh = 10.5 * P.eyeH * (kind === 'surprised' || kind === 'shock' ? 1.3 : 1);
    if (P.shadow && !shut) {
      ctx.fillStyle = css(mixc(skin, P.shadow, 0.5));
      ctx.beginPath();
      ctx.ellipse(x, y - 6, ew * 1.08, eh * 1.25, 0, PI, 0);
      ctx.fill();
    }
    if (shut) {
      ctx.strokeStyle = P.lash;
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      if (shut === 'up') {
        ctx.moveTo(x - ew, y + 3);
        ctx.quadraticCurveTo(x, y - 9, x + ew, y + 3);
      } else if (shut === 'squeeze') {
        ctx.moveTo(x + s * ew, y - 7);
        ctx.lineTo(x - s * ew * 0.55, y);
        ctx.lineTo(x + s * ew, y + 6);
      } else {
        ctx.moveTo(x - ew, y);
        ctx.quadraticCurveTo(x, y + 7, x + ew, y);
      }
      ctx.stroke();
      if (P.lashes && shut === 'down') {
        ctx.lineWidth = 2;
        [-0.6, -0.2, 0.2, 0.6].forEach(f => {
          ctx.beginPath();
          ctx.moveTo(x + f * ew, y + 5);
          ctx.lineTo(x + f * ew + s * 2, y + 10);
          ctx.stroke();
        });
      }
      return;
    }
    const outer = [x + s * ew, y - 1.5], inner = [x - s * ew, y + 2];
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(inner[0], inner[1]);
      ctx.bezierCurveTo(x - s * ew * 0.45, y - eh * 1.15, x + s * ew * 0.5, y - eh * 1.1, outer[0], outer[1]);
      ctx.bezierCurveTo(x + s * ew * 0.45, y + eh * 0.72, x - s * ew * 0.5, y + eh * 0.8, inner[0], inner[1]);
      ctx.closePath();
    };
    ctx.save();
    path();
    ctx.fillStyle = '#f1ede6';
    ctx.fill();
    ctx.clip();
    let gx = 0, gy = 0;
    if (kind === 'smug' || kind === 'sly') gx = s * 3;
    if (kind === 'side') gx = 6;
    if (kind === 'sad' || kind === 'dreamy') gy = 3;
    if (kind === 'up') gy = -4;
    const ir = P.irisR * (kind === 'shock' ? 0.8 : 1);
    const g = ctx.createRadialGradient(x + gx - 2, y + gy - 3, 1, x + gx, y + gy, ir);
    g.addColorStop(0, P.iris[2]);
    g.addColorStop(0.6, P.iris[1]);
    g.addColorStop(1, P.iris[0]);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x + gx, y + gy - 0.5, ir, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0c0806';
    ctx.beginPath();
    ctx.arc(x + gx, y + gy - 0.5, ir * 0.42, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + gx - ir * 0.35, y + gy - ir * 0.45, 2.1, 0, PI * 2);
    ctx.fill();
    const lid = LIDS[kind] || 0;
    if (lid > 0) {
      ctx.fillStyle = css(skin);
      ctx.fillRect(x - ew - 2, y - eh * 1.4, ew * 2 + 4, eh * 1.4 * lid * 1.6);
    }
    ctx.restore();
    ctx.strokeStyle = P.lash;
    ctx.lineWidth = P.lashW;
    ctx.beginPath();
    if (lid > 0.2) {
      const ly = y - eh * 1.4 + eh * 1.4 * lid * 1.6;
      ctx.moveTo(inner[0], Math.min(inner[1], ly + 2));
      ctx.lineTo(outer[0], ly);
    } else {
      ctx.moveTo(inner[0], inner[1]);
      ctx.bezierCurveTo(x - s * ew * 0.45, y - eh * 1.15, x + s * ew * 0.5, y - eh * 1.1, outer[0], outer[1]);
    }
    ctx.stroke();
    if (P.liner) {
      ctx.fillStyle = P.lash;
      ctx.beginPath();
      ctx.moveTo(outer[0] - s * 4, outer[1] - 2);
      ctx.lineTo(outer[0] + s * 7, outer[1] - 7);
      ctx.lineTo(outer[0], outer[1] + 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = css(mixc(skin, 0x000000, 0.28));
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - s * ew * 0.6, y - eh * 1.15 - 3);
    ctx.quadraticCurveTo(x, y - eh * 1.5 - 3, x + s * ew * 0.85, y - eh * 0.9 - 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(inner[0] + s * 3, inner[1] + 2);
    ctx.quadraticCurveTo(x, y + eh * 0.95, outer[0] - s * 2, outer[1] + 1);
    ctx.stroke();
  }

  function brow(ctx, P, x, s, kind) {
    let inner = 0, outer = 0;
    if (['angry', 'shout', 'grit', 'stop'].includes(kind)) { inner = 7; outer = -3; }
    if (['sad', 'dreamy'].includes(kind)) { inner = -6; outer = 3; }
    if (['surprised', 'shock', 'belt'].includes(kind)) { inner = -8; outer = -6; }
    if (kind === 'smug' && s > 0) { inner = -5; outer = -8; }
    if (kind === 'sly' && s < 0) { inner = 4; outer = 0; }
    if (kind === 'sing' || kind === 'kiss') { inner = -3; outer = -1; }
    const y = 97;
    ctx.strokeStyle = P.brow;
    ctx.lineWidth = P.browW;
    ctx.beginPath();
    ctx.moveTo(x - s * 17, y + inner);
    ctx.quadraticCurveTo(x + s * 3, y - 6 + (inner + outer) / 2, x + s * 23, y + 3 + outer);
    ctx.stroke();
  }

  function lipsClosed(ctx, P, smile, asym) {
    const up = smile * 6;
    const lw = 17 * P.mouthW;
    const lc = css(P.lipHex), dk = css(mixc(P.lipHex, 0x000000, 0.35));
    const yl = MY - up * (1 - asym), yr = MY - up * (1 + asym);
    ctx.fillStyle = lc;
    ctx.beginPath();
    ctx.moveTo(MX - lw, yl);
    ctx.quadraticCurveTo(MX - lw * 0.5, MY - 7 * P.lipFull, MX - 3, MY - 5.5 * P.lipFull);
    ctx.lineTo(MX, MY - 4 * P.lipFull);
    ctx.lineTo(MX + 3, MY - 5.5 * P.lipFull);
    ctx.quadraticCurveTo(MX + lw * 0.5, MY - 7 * P.lipFull, MX + lw, yr);
    ctx.quadraticCurveTo(MX, MY + 1 - up * 0.4, MX - lw, yl);
    ctx.fill();
    ctx.fillStyle = css(mixc(P.lipHex, 0xffffff, 0.12));
    ctx.beginPath();
    ctx.moveTo(MX - lw * 0.86, yl + 1);
    ctx.quadraticCurveTo(MX, MY + 1 - up * 0.4, MX + lw * 0.86, yr + 1);
    ctx.quadraticCurveTo(MX, MY + 10 * P.lipFull - up * 0.3, MX - lw * 0.86, yl + 1);
    ctx.fill();
    ctx.strokeStyle = dk;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(MX - lw, yl);
    ctx.quadraticCurveTo(MX, MY + 1 - up * 0.4, MX + lw, yr);
    ctx.stroke();
  }

  function lipsOpen(ctx, P, rx, ry, o) {
    const opts = o || {};
    const lc = css(P.lipHex);
    const up = (opts.smile || 0) * 5;
    const cy = MY + ry * 0.35;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(MX - rx, cy - up);
    ctx.quadraticCurveTo(MX - rx * 0.6, cy - ry, MX, cy - ry * 0.95);
    ctx.quadraticCurveTo(MX + rx * 0.6, cy - ry, MX + rx, cy - up);
    ctx.quadraticCurveTo(MX + rx * 0.7, cy + ry * (opts.flat ? 0.6 : 1.05), MX, cy + ry * (opts.flat ? 0.65 : 1.1));
    ctx.quadraticCurveTo(MX - rx * 0.7, cy + ry * (opts.flat ? 0.6 : 1.05), MX - rx, cy - up);
    ctx.closePath();
    ctx.fillStyle = P.mouth;
    ctx.fill();
    ctx.clip();
    if (opts.teeth !== false) {
      ctx.fillStyle = '#f4f1ea';
      ctx.fillRect(MX - rx, cy - ry * 1.1, rx * 2, ry * 0.42);
      if (opts.lower) ctx.fillRect(MX - rx, cy + ry * 0.62, rx * 2, ry * 0.5);
    }
    if (opts.tongue) {
      ctx.fillStyle = '#c85a64';
      ctx.beginPath();
      ctx.ellipse(MX, cy + ry * 0.75, rx * 0.62, ry * 0.42, 0, 0, PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = lc;
    ctx.lineWidth = 4.2 * P.lipFull;
    ctx.beginPath();
    ctx.moveTo(MX - rx, cy - up);
    ctx.quadraticCurveTo(MX - rx * 0.6, cy - ry - 1.5, MX, cy - ry - 1);
    ctx.quadraticCurveTo(MX + rx * 0.6, cy - ry - 1.5, MX + rx, cy - up);
    ctx.stroke();
    ctx.lineWidth = 5.2 * P.lipFull;
    ctx.beginPath();
    ctx.moveTo(MX - rx, cy - up);
    ctx.quadraticCurveTo(MX - rx * 0.7, cy + ry * (opts.flat ? 0.6 : 1.05) + 2, MX, cy + ry * (opts.flat ? 0.65 : 1.1) + 2.5);
    ctx.quadraticCurveTo(MX + rx * 0.7, cy + ry * (opts.flat ? 0.6 : 1.05) + 2, MX + rx, cy - up);
    ctx.stroke();
  }

  function pucker(ctx, P) {
    ctx.fillStyle = css(P.lipHex);
    ctx.beginPath();
    ctx.ellipse(MX, MY + 1, 9 * P.mouthW, 8, 0, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = css(mixc(P.lipHex, 0x000000, 0.3));
    ctx.lineWidth = 1.6;
    [-1, 1].forEach(sx => {
      ctx.beginPath();
      ctx.moveTo(MX + sx * 3, MY - 5);
      ctx.lineTo(MX + sx * 4, MY - 2);
      ctx.moveTo(MX + sx * 3, MY + 7);
      ctx.lineTo(MX + sx * 4, MY + 4);
      ctx.stroke();
    });
    ctx.fillStyle = P.mouth;
    ctx.beginPath();
    ctx.ellipse(MX, MY + 1, 2.6, 2.2, 0, 0, PI * 2);
    ctx.fill();
  }

  function mouthFor(ctx, P, kind) {
    if (kind === 'kiss' || kind === 'pucker') return pucker(ctx, P);
    if (kind === 'say') return lipsOpen(ctx, P, 10 * P.mouthW, 4.5, { teeth: true, flat: true });
    if (kind === 'sing') return lipsOpen(ctx, P, 12 * P.mouthW, 9);
    if (kind === 'belt') return lipsOpen(ctx, P, 14 * P.mouthW, 14, { tongue: true });
    if (kind === 'shout') return lipsOpen(ctx, P, 17 * P.mouthW, 13, { lower: true, flat: true });
    if (kind === 'surprised' || kind === 'shock') return lipsOpen(ctx, P, 8, 10, { teeth: false });
    if (kind === 'grin' || kind === 'happy' || kind === 'bliss') return lipsOpen(ctx, P, 17 * P.mouthW, 7, { lower: true, smile: 1.2, flat: true });
    if (kind === 'tongue') return lipsOpen(ctx, P, 12 * P.mouthW, 10, { tongue: true });
    if (kind === 'sly') return lipsOpen(ctx, P, 15 * P.mouthW, 5, { smile: 0.8, flat: true });
    if (kind === 'smile' || kind === 'wink' || kind === 'dreamy') return lipsClosed(ctx, P, 1, 0);
    if (kind === 'smug') return lipsClosed(ctx, P, 0.9, 0.7);
    if (kind === 'sad') return lipsClosed(ctx, P, -0.8, 0);
    return lipsClosed(ctx, P, 0.1, 0);
  }

  function dots(ctx, col, x0, y0, x1, y1, n, seed, inside) {
    ctx.fillStyle = col;
    let s = seed;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, rnd()), y = lerp(y0, y1, rnd());
      if (inside && !inside(x, y)) continue;
      ctx.fillRect(x, y, 1.6, 1.6);
    }
  }

  function paintFace(P, kind, mask, skinOver) {
    const skin = skinOver === undefined ? P.skin : skinOver;
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (P.blush) {
        ctx.fillStyle = css(mixc(skin, 0xe06a7a, 0.22));
        [64, 192].forEach(x => { ctx.beginPath(); ctx.ellipse(x, 160, 22, 12, 0, 0, PI * 2); ctx.fill(); });
      }
      if (P.stubble) {
        const jaw = (x, y) => {
          const dx = (x - 128) / 112, dy = (y - 150) / 100;
          return dx * dx + dy * dy < 1 && (y > 210 || (y > 172 && Math.abs(x - 128) > 34) || (y > 178 && y < 188 && Math.abs(x - 128) < 26));
        };
        dots(ctx, css(mixc(skin, P.stubble, 0.55)), 18, 170, 238, 256, 1700, 7, jaw);
      }
      if (P.freckles) dots(ctx, css(mixc(skin, 0x8a4a22, 0.42)), 70, 140, 186, 168, 70, 3, (x, y) => Math.abs(x - 128) > 10);
      EYE_X.forEach((x, i) => eye(ctx, P, x, i ? 1 : -1, kind, skin));
      EYE_X.forEach((x, i) => brow(ctx, P, x, i ? 1 : -1, kind));
      ctx.fillStyle = css(mixc(skin, 0x000000, 0.42));
      [-1, 1].forEach(sx => { ctx.beginPath(); ctx.ellipse(MX + sx * 7, 166, 3.6, 2, sx * 0.3, 0, PI * 2); ctx.fill(); });
      ctx.strokeStyle = css(mixc(skin, 0x000000, 0.18));
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(MX - 4, 178);
      ctx.lineTo(MX - 3, 186);
      ctx.moveTo(MX + 4, 178);
      ctx.lineTo(MX + 3, 186);
      ctx.stroke();
      mouthFor(ctx, P, kind);
      if (kind === 'cream') {
        [[-14, 4, 7], [12, 6, 6], [2, 12, 8], [-4, -9, 5], [18, -4, 4], [-20, 12, 4]].forEach(([dx, dy, r]) => {
          ctx.fillStyle = '#fbf8f0';
          ctx.beginPath();
          ctx.arc(MX + dx, MY + dy, r, 0, PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#d8d2c4';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
      ctx.restore();
    };
  }

  const person = (o) => Object.assign({
    paint: paintFace, eyeW: 1, eyeH: 1, irisR: 7.6, lashW: 2.6, browW: 6.4, mouthW: 1, lipFull: 0.8,
    iris: ['#2a1608', '#6a4224', '#a8784c'], lash: '#2a1a12', brow: '#3a2818', mouth: '#4a1416'
  }, o);

  const MALE_LIP = (skin) => mixc(skin, 0xa83a3a, 0.32);

  Object.assign(Cast.PEOPLE, {
    utsHero: person({ skin: 0xecc2a2, lipHex: MALE_LIP(0xecc2a2), eyeW: 1.1, eyeH: 1.08, irisR: 8, iris: ['#16301e', '#3c7048', '#86c08a'], lash: '#4a2412', brow: '#8a4020', freckles: true }),
    utsGirl: person({ skin: 0xf2d2bf, lipHex: 0xc8122c, lipFull: 1.1, mouthW: 0.92, eyeW: 1.04, eyeH: 1.12, irisR: 8.2, iris: ['#1e0e04', '#5a3014', '#a66a38'], lash: '#0a0606', lashW: 4, browW: 4.4, brow: '#141016', liner: true, lashes: true, shadow: 0x9a5a8a, blush: true }),
    utsGuitar: person({ skin: 0xe8c8a8, lipHex: MALE_LIP(0xe8c8a8), brow: '#24160c', stubble: 0x2a1a10 }),
    utsBass: person({ skin: 0xf0c4a4, lipHex: MALE_LIP(0xf0c4a4), brow: '#b0602a', iris: ['#10283a', '#2a5a7a', '#6aa0c0'] }),
    utsDj: person({ skin: 0xc48c64, lipHex: mixc(0xc48c64, 0x6a2a2a, 0.35), brow: '#140c08', iris: ['#140a04', '#3a2210', '#6a4426'] }),
    utsDrum: person({ skin: 0xf2d6c0, lipHex: MALE_LIP(0xf2d6c0), brow: '#4a3a20', stubble: 0x5a4020 }),
    utsMan: person({ skin: 0xecc8a8, lipHex: MALE_LIP(0xecc8a8), brow: '#3a2a1e' }),
    utsWoman: person({ skin: 0xf4d8c4, lipHex: 0xb8485a, lipFull: 1, mouthW: 0.9, eyeH: 1.08, irisR: 8, lashW: 3.6, browW: 4.2, brow: '#4a3020', liner: true, lashes: true, blush: true })
  });

  Object.assign(Cast.HAIR, {
    utsHero: { mid: 0xa8522a, hi: 0xcc7440, dark: 0x6a3016 },
    utsGirl: { mid: 0x17151d, hi: 0x302e40, dark: 0x0a090e },
    utsGuitar: { mid: 0x2e1e14, hi: 0x4a3222, dark: 0x1a100a },
    utsDj: { mid: 0x140e0a, hi: 0x2a201a, dark: 0x0a0604 },
    utsSlick: { mid: 0x1c1816, hi: 0x3a3430, dark: 0x0e0c0a },
    utsBlondM: { mid: 0xc8a868, hi: 0xe4c88a, dark: 0x947844 },
    utsBrownM: { mid: 0x5a3c26, hi: 0x7a5638, dark: 0x3a2616 },
    utsBlackM: { mid: 0x1e1a18, hi: 0x38322e, dark: 0x100c0a },
    utsBlondF: { mid: 0xe2c88a, hi: 0xf6e4b4, dark: 0xb89a5a },
    utsBrownF: { mid: 0x6a4028, hi: 0x8c5a3a, dark: 0x442818 },
    utsRedF: { mid: 0xa83a22, hi: 0xc8583a, dark: 0x702414 },
    utsBlackF: { mid: 0x1a1618, hi: 0x36303a, dark: 0x0c0a0c },
    utsAfro: { mid: 0x3a2418, hi: 0x56382a, dark: 0x22140c },
    utsDreads: { mid: 0x2a1c12, hi: 0x44301e, dark: 0x160e08 },
    utsGrey: { mid: 0x9a9690, hi: 0xc0bcb4, dark: 0x6a6660 }
  });

  function ponytail(col) {
    return (b, H) => {
      const p = headPoint(PI, 0.2, 1.12);
      b.push(M4.translate(p[0], p[1], p[2]), M4.rotX(0.4));
      b.prism(8, 0.028, 0.028, -0.02, 0.03, 0.03, 0.02, col, { capTop: false });
      b.prism(8, 0.045, 0.04, -0.34, 0.026, 0.026, -0.02, H.mid, { capBottom: true, capTop: false });
      b.pop();
    };
  }

  function dreads(b, H) {
    for (let i = 0; i < 14; i++) {
      const yaw = PI * 0.42 + (i / 13) * PI * 1.16;
      const p = headPoint(yaw, -0.1, 1.1);
      b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(yaw), M4.rotX(0.12 + 0.05 * S(i * 2.3)));
      b.prism(5, 0.014, 0.014, -0.32 - 0.06 * S(i * 1.7), 0.016, 0.016, 0.02, i % 3 ? H.mid : H.hi, { capBottom: true });
      b.pop();
    }
  }

  Object.assign(Cast.SHELLS, {
    utsHero: {
      low: (y) => lerp(lerp(0.3 + 0.12 * clamp(y / 0.6, -1, 1) + 0.05 * S(y * 11), -0.08, band(y, 0.6, 1.3)), -0.6, band(y, 1.8, 2.6)),
      tip: (y) => 0.13 + 0.05 * S(y * 5.3 + 1), k: 1.13, flare: 0.1
    },
    utsGirl: {
      low: (y) => lerp(lerp(0.06, -0.95, band(y, 0.66, 0.8)), -0.95, band(y, 1.5, 2.2)),
      tip: () => 0.02, k: 1.08, flare: 0.04,
      extra: (head, back, H) => {
        sideLocks(head, H, 0.92, 0.5, 0.065, false);
        backHair(back, H, 0.62, 0.3, false, 0.08);
      }
    },
    utsGuitar: {
      low: (y) => lerp(lerp(0.34 - 0.14 * Math.min(1, Math.abs(y) / 0.5), -0.9, band(y, 0.6, 1.0)), -0.95, band(y, 1.5, 2.2)),
      tip: () => 0.05, k: 1.09, flare: 0.06,
      extra: (head, back, H) => {
        sideLocks(head, H, 0.94, 0.46, 0.065, true);
        backHair(back, H, 0.5, 0.3, true, 0.14);
      }
    },
    utsDj: {
      low: (y) => lerp(lerp(0.3, -0.2, band(y, 0.5, 1.1)), -0.6, band(y, 1.7, 2.5)),
      tip: () => 0.03, k: 1.04, flare: 0.02
    },
    utsSlick: {
      low: (y) => lerp(lerp(0.46, -0.22, band(y, 0.5, 1.2)), -0.62, band(y, 1.7, 2.5)),
      tip: () => 0.02, k: 1.05, flare: 0.02
    },
    utsShortM: {
      low: (y) => lerp(lerp(0.34, -0.22, band(y, 0.5, 1.2)), -0.66, band(y, 1.7, 2.5)),
      tip: () => 0.07, k: 1.07, flare: 0.05
    },
    utsLongF: {
      low: (y) => lerp(lerp(0.24 + 0.08 * clamp(y / 0.6, -1, 1), -0.8, band(y, 0.55, 1.0)), -0.95, band(y, 1.6, 2.4)),
      tip: () => 0.1, k: 1.09, flare: 0.1,
      extra: (head, back, H) => {
        sideLocks(head, H, 0.95, 0.42, 0.06, true);
        backHair(back, H, 0.62, 0.3, true, 0.3);
      }
    },
    utsBobF: {
      low: (y) => lerp(lerp(0.1, -0.72, band(y, 0.55, 0.78)), -0.8, band(y, 1.6, 2.4)),
      tip: () => 0.04, k: 1.1, flare: 0.1
    },
    utsTailF: {
      low: (y) => lerp(lerp(0.26, -0.4, band(y, 0.5, 1.0)), -0.58, band(y, 1.6, 2.4)),
      tip: () => 0.05, k: 1.07, flare: 0.04,
      extra: (head, back, H) => ponytail(0x2a2a30)(head, H)
    },
    utsAfro: {
      low: (y) => lerp(lerp(0.3, -0.45, band(y, 0.6, 1.2)), -0.6, band(y, 1.7, 2.4)),
      tip: () => 0.08, k: 1.42, flare: 0.08
    },
    utsDreads: {
      low: (y) => lerp(lerp(0.3, -0.2, band(y, 0.5, 1.2)), -0.5, band(y, 1.7, 2.5)),
      tip: () => 0.05, k: 1.08, flare: 0.04,
      extra: (head, back, H) => dreads(head, H)
    }
  });
  ['utsBlondM', 'utsBrownM', 'utsBlackM', 'utsGrey'].forEach(id => { Cast.SHELLS[id] = Cast.SHELLS.utsShortM; });
  ['utsBlondF', 'utsBrownF'].forEach(id => { Cast.SHELLS[id] = Cast.SHELLS.utsLongF; });
  Cast.SHELLS.utsRedF = Cast.SHELLS.utsBobF;
  Cast.SHELLS.utsBlackF = Cast.SHELLS.utsTailF;

  function nose(skin, size) {
    const k = size || 1;
    return (b) => {
      const top = headPoint(0, -0.05, 1.0);
      const base = headPoint(0, -0.3, 1.0);
      const tip = [0, base[1] + 0.004, base[2] + 0.024 * k];
      const wl = headPoint(-0.14 * k, -0.34, 1.0), wr = headPoint(0.14 * k, -0.34, 1.0);
      const under = [0, base[1] - 0.012, base[2] + 0.006 * k];
      const col = rgb(skin), dk = shade(skin, 0.82);
      const nl = V3.norm([-0.8, 0.15, 0.6]), nr = V3.norm([0.8, 0.15, 0.6]), nd = V3.norm([0, -0.85, 0.5]), nt = V3.norm([0, 0.3, 1]);
      b.tri(top, wl, tip, col, null, [nt, nl, nt]);
      b.tri(top, tip, wr, col, null, [nt, nt, nr]);
      b.tri(wl, under, tip, dk, null, [nd, nd, nt]);
      b.tri(tip, under, wr, dk, null, [nt, nd, nd]);
    };
  }

  function mustache(col) {
    return (b) => {
      for (let i = -6; i <= 6; i++) {
        const f = i / 6;
        const p = headPoint(f * 0.42, -0.38 - 0.03 * (1 - Math.abs(f)), 1.03);
        b.at(p[0], p[1], p[2], (h) => h.ellipsoid(0.011, 0.008 + 0.004 * (1 - Math.abs(f)), 0.008, 6, 4, col));
      }
      [-1, 1].forEach(s => {
        const p = headPoint(s * 0.48, -0.36, 1.02);
        b.push(M4.translate(p[0], p[1], p[2]), M4.rotZ(-s * 0.5));
        b.prism(5, 0.006, 0.006, 0, 0.003, 0.003, 0.03, col);
        b.pop();
      });
    };
  }

  function beard(col) {
    return (b) => {
      headPatch(b, R * HX * 1.05, R * HY * 1.04, R * HZ * 1.07, -1.35, 1.35, -1.2, -0.52, 10, 4, col);
      const c = headPoint(0, -0.95, 1.05);
      b.at(c[0], c[1] - 0.03, c[2] - 0.01, (h) => h.prism(7, 0.05, 0.04, -0.14, 0.075, 0.05, 0.03, col, { capBottom: true }));
      mustache(col)(b);
    };
  }

  function shades(frame, lens, round) {
    return (b) => {
      [-1, 1].forEach(s => {
        const p = headPoint(s * 0.32, -0.12, 1.08);
        b.at(p[0], p[1], p[2] + 0.004, (h) => {
          h.ellipsoid(round ? 0.022 : 0.027, round ? 0.022 : 0.019, 0.006, 10, 5, lens);
          h.prism(12, (round ? 0.023 : 0.028), (round ? 0.023 : 0.02), -0.003, (round ? 0.023 : 0.028), (round ? 0.023 : 0.02), 0.003, frame, { capTop: false });
        });
        const e = headPoint(s * 0.92, -0.08, 1.07);
        b.push(M4.translate(e[0], e[1], e[2]), M4.rotY(s * 0.9));
        b.box(0.004, 0.004, 0.08, frame);
        b.pop();
      });
      const m = headPoint(0, -0.09, 1.1);
      b.at(m[0], m[1], m[2], (h) => h.box(0.024, 0.004, 0.004, frame));
    };
  }

  function capBack(col) {
    return (b) => {
      headPatch(b, R * HX * 1.1, R * HY * 1.1, R * HZ * 1.1, -PI, PI, 0.32, PI / 2, 14, 4, col);
      const p = headPoint(PI, 0.3, 1.1);
      b.push(M4.translate(p[0], p[1] - 0.01, p[2]), M4.rotX(0.25));
      b.box(0.15, 0.012, 0.1, shade(col, 0.82));
      b.pop();
      b.at(0, R * HY * 1.1, 0, (h) => h.ellipsoid(0.012, 0.008, 0.012, 6, 3, shade(col, 1.2)));
    };
  }

  function mohawk(col) {
    return (b) => {
      for (let i = 0; i < 9; i++) {
        const pit = PI / 2 - 0.95 + (i / 8) * 1.9;
        const p = [0, S(pit) * R * HY * 1.0, C(pit) * R * HZ * 1.0];
        const n = V3.norm([0, S(pit), C(pit)]);
        const hgt = 0.06 + 0.02 * S(i * 1.3);
        const tip = V3.add(p, V3.mul(n, hgt));
        const along = V3.norm([0, C(pit), -S(pit)]);
        const a = V3.add(p, V3.mul(along, 0.024)), c = V3.sub(p, V3.mul(along, 0.024));
        [-0.006, 0.006].forEach(x => b.tri([x, a[1], a[2]], [x, c[1], c[2]], [x, tip[1], tip[2]], i % 2 ? col : shade(col, 1.2), null, [[x > 0 ? 1 : -1, 0, 0], [x > 0 ? 1 : -1, 0, 0], [x > 0 ? 1 : -1, 0, 0]]));
      }
      headPatch(b, R * HX * 1.01, R * HY * 1.01, R * HZ * 1.01, -0.12, 0.12, 0.6, PI / 2, 2, 3, shade(col, 0.8));
      headPatch(b, R * HX * 1.01, R * HY * 1.01, R * HZ * 1.01, PI - 0.12, PI + 0.12, 0.3, PI / 2, 2, 3, shade(col, 0.8));
    };
  }

  function bonnet(col) {
    return (b) => {
      headPatch(b, R * HX * 1.16, R * HY * 1.14, R * HZ * 1.16, 1.0, 2 * PI - 1.0, -0.8, 1.5, 10, 6, col);
      headPatch(b, R * HX * 1.16, R * HY * 1.14, R * HZ * 1.16, -1.0, 1.0, 0.42, 1.5, 6, 3, col);
      for (let i = 0; i < 12; i++) {
        const a = -1.05 + (i / 11) * 2.1;
        const p = headPoint(a, a > -0.95 && a < 0.95 ? 0.48 : 0.0, 1.26);
        b.at(p[0], p[1], p[2], (h) => h.ellipsoid(0.026, 0.026, 0.012, 6, 3, shade(col, 0.95)));
      }
    };
  }

  function blindfold(col) {
    return (b) => {
      headPatch(b, R * HX * 1.05, R * HY * 1.05, R * HZ * 1.08, -PI, PI, -0.24, 0.02, 16, 1, col);
      const p = headPoint(PI, -0.1, 1.08);
      [-1, 1].forEach(s => b.at(p[0] + s * 0.018, p[1], p[2] - 0.006, (h) => h.ellipsoid(0.018, 0.012, 0.008, 6, 3, col)));
      [-1, 1].forEach(s => {
        b.push(M4.translate(p[0] + s * 0.01, p[1] - 0.01, p[2] - 0.01), M4.rotZ(s * 0.3));
        b.box(0.014, 0.08, 0.004, col);
        b.pop();
      });
    };
  }

  function robotHead(b) {
    b.ellipsoid(R * 1.2, R * 1.24, R * 1.22, 14, 9, [0.78, 0.8, 0.86, 0.15]);
    headPatch(b, R * HX * 1.38, R * HY * 1.08, R * HZ * 1.4, -0.95, 0.95, -0.34, 0.06, 10, 2, [0.08, 0.1, 0.14, 0.35]);
    headPatch(b, R * HX * 1.41, R * HY * 1.08, R * HZ * 1.43, -0.7, 0.7, -0.17, -0.11, 8, 1, glow(0x60d0ff, 0.95));
    [-1, 1].forEach(s => b.at(s * R * 1.18, 0, 0, (h) => h.prism(10, 0.03, 0.03, -0.02, 0.03, 0.03, 0.02, 0x9aa0aa)));
    b.at(0, R * 1.2, 0, (h) => h.prism(6, 0.006, 0.006, 0, 0.004, 0.004, 0.09, 0x8a8e96));
    b.at(0, R * 1.2 + 0.095, 0, (h) => h.ellipsoid(0.014, 0.014, 0.014, 6, 4, glow(0xff4040)));
  }

  function hoops(col) {
    return (b) => {
      [-1, 1].forEach(s => {
        const p = headPoint(s * 1.5, -0.42, 1.02);
        b.push(M4.translate(p[0] + s * 0.006, p[1] - 0.02, p[2]), M4.rotY(PI / 2));
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * PI * 2;
          b.at(C(a) * 0.016, S(a) * 0.016, 0, (h) => h.box(0.006, 0.006, 0.004, col));
        }
        b.pop();
      });
    };
  }

  function earpiece(b) {
    const p = headPoint(1.55, -0.1, 1.04);
    b.at(p[0], p[1], p[2], (h) => h.ellipsoid(0.008, 0.012, 0.01, 6, 3, 0x1a1a1a));
    b.at(p[0] + 0.004, p[1] - 0.08, p[2] - 0.02, (h) => h.box(0.003, 0.14, 0.003, [0.8, 0.82, 0.86, 0.3]));
  }

  function shirtV(blazer, shirt, opts) {
    const o = opts || {};
    return (b, d) => {
      const top = d.torso - 0.01;
      b.tri([-0.055, top, 0.084], [0.055, top, 0.084], [0, o.deep || 0.2, 0.124], shirt, null, [[0, 0.2, 1], [0, 0.2, 1], [0, 0.2, 1]]);
      if (o.tie) {
        b.quad([-0.011, top - 0.03, 0.094], [0.011, top - 0.03, 0.094], [0.016, 0.15, 0.128], [-0.014, 0.15, 0.128], o.tie, null, NZ);
        b.at(0, top - 0.02, 0.092, (h) => h.box(0.026, 0.02, 0.01, shade(o.tie, 0.8)));
      }
      [-1, 1].forEach(s => {
        b.quad([s * 0.055, top, 0.086], [s * 0.09, top - 0.015, 0.074], [s * 0.022, (o.deep || 0.2) - 0.01, 0.127], [s * 0.004, o.deep || 0.2, 0.126], o.lapel || shade(blazer, 0.78), null, NZ);
        if (!o.tie) b.quad([s * 0.035, top + 0.035, 0.05], [s * 0.075, top + 0.025, 0.02], [s * 0.06, top - 0.02, 0.07], [s * 0.025, top - 0.015, 0.09], shirt);
      });
      if (o.buttons !== false) [0.12, 0.06].forEach(y => b.at(0.02, y, 0.124, (h) => h.ellipsoid(0.007, 0.007, 0.004, 6, 3, shade(blazer, 0.6))));
    };
  }

  function vestOpen(vest, tank) {
    return (b, d) => {
      const top = d.torso - 0.01;
      b.quad([-0.05, top, 0.08], [0.05, top, 0.08], [0.05, 0.0, 0.118], [-0.05, 0.0, 0.118], tank, null, NZ);
      [-1, 1].forEach(s => b.at(s * 0.11, 0.18, 0.1, (h) => h.box(0.012, 0.3, 0.012, shade(vest, 0.7))));
    };
  }

  function apronFront(col) {
    return (b, d) => {
      b.quad([-0.08, 0.32, 0.112], [0.08, 0.32, 0.112], [0.17, -0.42, 0.17], [-0.17, -0.42, 0.17], col, null, NZ);
      [-1, 1].forEach(s => b.quad([s * 0.075, 0.32, 0.11], [s * 0.09, 0.32, 0.11], [s * 0.07, d.torso + 0.02, 0.04], [s * 0.055, d.torso + 0.02, 0.05], col, null, NZ));
    };
  }

  function neckPhones(b, d) {
    b.prism(12, 0.07, 0.065, d.torso - 0.01, 0.07, 0.065, d.torso + 0.01, 0x1a1a1e, { capTop: false });
    [-1, 1].forEach(s => b.at(s * 0.065, d.torso - 0.01, 0.04, (h) => h.prism(10, 0.032, 0.032, -0.015, 0.032, 0.032, 0.015, 0x2a2a30)));
  }

  function zipLine(col) {
    return (b, d) => {
      b.quad([-0.004, d.torso - 0.02, 0.1], [0.004, d.torso - 0.02, 0.1], [0.004, 0.0, 0.118], [-0.004, 0.0, 0.118], col, null, NZ);
      b.prism(12, 0.06, 0.055, d.torso - 0.04, 0.05, 0.048, d.torso + 0.03, shade(col, 0.6), { capTop: false });
    };
  }

  function dressSkirt(col, len) {
    return (b) => {
      b.prism(16, 0.19, 0.17, -(len || 0.34), 0.125, 0.1, 0.08, col, { capTop: false });
      b.prism(16, 0.192, 0.172, -(len || 0.34) - 0.012, 0.19, 0.17, -(len || 0.34), shade(col, 0.8), { capTop: false });
    };
  }

  function coatSkirt(col, len) {
    return (b) => {
      b.prism(14, 0.18, 0.16, -(len || 0.55), 0.13, 0.11, 0.08, col, { capTop: false, skip: [0, 13] });
    };
  }

  function strap(col) {
    return (b, d) => [-1, 1].forEach(s => b.quad([s * 0.07, d.torso - 0.02, 0.06], [s * 0.085, d.torso - 0.02, 0.06], [s * 0.08, 0.3, 0.106], [s * 0.066, 0.3, 0.108], col, null, NZ));
  }

  function armStripe(col, len) {
    return (b) => b.at(0.038, -len / 2, 0, (h) => h.box(0.006, len, 0.016, col));
  }

  function skates(b, d) {
    [-0.07, -0.02, 0.05, 0.1].forEach(z => b.at(0, -d.shin - d.sole - 0.018, z + 0.04, (h) => h.prism(8, 0.018, 0.018, -0.022, 0.018, 0.018, 0.022, 0xf2d040, { capBottom: true })));
  }

  const SNEAKER = (col, sole) => ({ type: 'sneaker', col, sole: sole || 0xf2f2f2 });
  const BOOT = (col) => ({ type: 'boot', col });
  const SHOE = (col) => ({ type: 'flat', col });
  const HEEL = (col) => ({ type: 'heel', col, sole: col });
  const plain = (col) => [[0, 1, col]];
  const legs = (col, shoe, extra) => Object.assign({ thigh: plain(col), shin: plain(col), shoe }, extra || {});

  function man(personId, skin, hair, top, legCol, shoe, extra) {
    return Object.assign({
      person: personId, body: 'him', skin, hair,
      torso: { body: top },
      hips: legCol,
      arm: { upper: plain(top), fore: plain(top) },
      leg: legs(legCol, shoe),
      gear: [nose(skin)]
    }, extra || {});
  }

  function woman(personId, skin, hair, top, legCol, shoe, extra) {
    return Object.assign({
      person: personId, skin, hair, bust: 0.55,
      torso: { body: top },
      hips: legCol,
      arm: { upper: plain(top), fore: plain(skin) },
      leg: legs(legCol, shoe),
      gear: [nose(skin, 0.82)]
    }, extra || {});
  }

  const HERO_SKIN = 0xecc2a2, WINE = 0x6a1e2e, MUSTARD = 0xd8a020, JEANS = 0x2c3e5c;
  const GIRL_SKIN = 0xf2d2bf, FUCHSIA = 0xc81e6e;

  const FORMS = {
    utsHero: man('utsHero', HERO_SKIN, 'utsHero', WINE, JEANS, SNEAKER(0xf0f0ec, 0xd8d8d4), {
      torsoExtras: [shirtV(WINE, MUSTARD, { deep: 0.17 })],
      arm: { upper: plain(WINE), fore: [[0, 0.07, MUSTARD], [0.07, 1, WINE]] }
    }),
    utsGirl: woman('utsGirl', GIRL_SKIN, 'utsGirl', FUCHSIA, GIRL_SKIN, HEEL(0x16121a), {
      bust: 0.7,
      torso: { waist: FUCHSIA, chest: FUCHSIA, top: GIRL_SKIN, shoulder: GIRL_SKIN, neck: GIRL_SKIN },
      torsoExtras: [strap(FUCHSIA)],
      decal: ['utsSequins', 0, 0.2, 0.111, 0.2, 0.26],
      hips: FUCHSIA,
      hipExtras: [dressSkirt(FUCHSIA, 0.3)],
      arm: { upper: plain(GIRL_SKIN), fore: plain(GIRL_SKIN), foreExtras: [(b) => b.prism(10, 0.034, 0.034, -0.205, 0.034, 0.034, -0.19, 0xe8c050, { capTop: false })] },
      leg: legs(GIRL_SKIN, HEEL(0x16121a)),
      gear: [nose(GIRL_SKIN, 0.78), hoops(glow(0xe8c050, 0.4))]
    }),
    utsGuitar: man('utsGuitar', 0xe8c8a8, 'utsGuitar', 0x1a1a1e, 0x22242a, BOOT(0x1a1614), {
      decal: ['utsBolt', 0, 0.22, 0.112, 0.15, 0.16],
      arm: { upper: [[0, 0.5, 0xe8c8a8], [0.5, 1, 0x1a1a1e]], fore: plain(0xe8c8a8), foreExtras: [(b) => b.prism(8, 0.033, 0.033, -0.2, 0.033, 0.033, -0.15, 0x101012, { capTop: false })] },
      leg: legs(0x22242a, BOOT(0x1a1614), { shin: [[0, 0.82, 0x22242a], [0.82, 0.94, 0xe8c8a8], [0.94, 1, 0x22242a]] })
    }),
    utsBass: man('utsBass', 0xf0c4a4, null, 0x1f8a86, 0xf0ece0, SHOE(0x7a4a2a), {
      decal: ['utsHawaii', 0, 0.2, 0.113, 0.24, 0.3],
      torsoExtras: [shirtV(0x1f8a86, 0xf0c4a4, { deep: 0.27, lapel: 0x1a7470, buttons: false })],
      arm: { upper: [[0, 0.55, 0xf0c4a4], [0.55, 1, 0x1f8a86]], fore: plain(0xf0c4a4) },
      gear: [nose(0xf0c4a4, 1.1), mustache(0xb8622a), shades(0xd8c070, [0.12, 0.42, 0.44, 0.45])]
    }),
    utsDj: man('utsDj', 0xc48c64, 'utsDj', 0xc02028, 0xc02028, SNEAKER(0xf4f4f4), {
      torsoExtras: [zipLine(0xf0f0f0), neckPhones],
      arm: { upper: plain(0xc02028), fore: plain(0xc02028), upperExtras: [armStripe(0xf4f4f4, 0.26)], foreExtras: [armStripe(0xf4f4f4, 0.2)] },
      leg: legs(0xc02028, SNEAKER(0xf4f4f4), { thighExtras: [(b, d) => b.at(0.068, -d.thigh / 2, 0, (h) => h.box(0.008, d.thigh, 0.02, 0xf4f4f4))] }),
      gear: [nose(0xc48c64, 1.05), capBack(0x1a2a5a)]
    }),
    utsDrum: man('utsDrum', 0xf2d6c0, null, 0x4a6a9a, 0x18181c, BOOT(0x141210), {
      scale: 1.04,
      torso: { body: 0x4a6a9a, chest: 0x4a6a9a, top: 0xf0f0ec, shoulder: 0xf2d6c0 },
      torsoExtras: [vestOpen(0x4a6a9a, 0xf0f0ec)],
      arm: { upper: plain(0xf2d6c0), fore: plain(0xf2d6c0) },
      gear: [nose(0xf2d6c0, 1.08), mohawk(0x38c060)]
    }),
    utsDoorman: man('utsMan', 0xd8b090, null, 0x16161a, 0x16161a, SHOE(0x0e0e10), {
      scale: 1.08,
      torsoExtras: [shirtV(0x16161a, 0x101012, { buttons: false })],
      gear: [nose(0xd8b090, 1.1), earpiece]
    }),
    utsBusker: man('utsMan', 0xecc8a8, 'utsBlondM', 0x141416, 0x4a6a9a, BOOT(0x2a1a10), {
      decal: ['utsWings', 0, 0.24, -0.118, 0.2, 0.16],
      torsoExtras: [zipLine(0x8a8a90)]
    }),
    utsRoller: woman('utsWoman', 0xd8a07a, 'utsAfro', 0xd02a2a, 0xe0b040, SNEAKER(0xf4f4f4), {
      torso: { body: 0xd02a2a, waist: 0xd8a07a },
      arm: { upper: plain(0xd8a07a), fore: plain(0xd8a07a) },
      leg: { thigh: [[0, 0.82, 0xd8a07a], [0.82, 1, 0xe0b040]], shin: [[0, 0.62, 0xf4f4f4], [0.62, 0.68, 0xd02a2a], [0.68, 0.74, 0xf4f4f4], [0.74, 1, 0xd8a07a]], shoe: SNEAKER(0xf4f4f4), shinExtras: [skates] },
      gear: [nose(0xd8a07a, 0.82)]
    }),
    utsCream: man('utsMan', 0xe2bc98, 'utsSlick', 0xf4f2ea, 0xf4f2ea, SHOE(0xf4f2ea), {
      torsoExtras: [shirtV(0xf4f2ea, 0x16161a, { buttons: false })],
      gear: [nose(0xe2bc98, 1.05), mustache(0x1c1816)]
    }),
    utsHippie: man('utsMan', 0xe0b894, 'utsGuitar', 0x6a2a8a, 0x6a2a8a, SHOE(0x8a6a4a), {
      decal: ['utsKaftan', 0, 0.16, 0.114, 0.24, 0.32],
      skirt: { type: 'long', col: 0x6a2a8a, dark: 0xd8b040 },
      gear: [nose(0xe0b894, 1.05), beard(0x2e1e14)]
    }),
    utsSipA: man('utsMan', 0xecc8a8, 'utsBrownM', 0x2a2a30, 0x3a3a44, SHOE(0x1a1a1a), { torsoExtras: [shirtV(0x2a2a30, 0xe8e8ee)] }),
    utsSipB: man('utsMan', 0xd8b090, 'utsBlackM', 0x3a4a6a, 0x2a2a30, SHOE(0x1a1a1a)),
    utsClerk: man('utsMan', 0xecc8a8, 'utsSlick', 0x6a7280, 0x6a7280, SHOE(0x1a1614), {
      glasses: 0x101012,
      torsoExtras: [shirtV(0x6a7280, 0xf4f4f6, { tie: 0xc81e24 })]
    }),
    utsClerkHero: man('utsMan', 0xecc8a8, 'utsSlick', 0x6a7280, 0x6a7280, SHOE(0x1a1614), {
      glasses: 0x101012,
      decal: ['utsPlunger', 0, 0.24, 0.12, 0.13, 0.13],
      torsoExtras: [shirtV(0x6a7280, 0x1e4ab0, { tie: 0xc81e24, deep: 0.1 })]
    }),
    utsMaid: woman('utsWoman', 0xf2d8c4, 'utsBlondF', 0x7a98c8, 0x7a98c8, SHOE(0x2a1a14), {
      torsoExtras: [apronFront(0xf6f4ee)],
      skirt: { type: 'long', col: 0x7a98c8, dark: 0x5a78a8 },
      arm: { upper: plain(0x7a98c8), fore: [[0, 0.8, 0xf2d8c4], [0.8, 1, 0x7a98c8]] },
      gear: [nose(0xf2d8c4, 0.8), bonnet(0xf8f6f0)]
    }),
    utsRobot: {
      person: 'utsMan', body: 'him', skin: 0xc0c4cc, hair: null, scale: 1.04,
      torso: { body: 0xc8ccd4, waist: 0x2a2e36, shoulder: 0xdadde4 },
      torsoExtras: [(b) => b.at(0, 0.24, 0.112, (h) => h.box(0.12, 0.08, 0.02, 0x2a2e36)), (b) => [-0.03, 0, 0.03].forEach((x, i) => b.at(x, 0.24, 0.124, (h) => h.ellipsoid(0.01, 0.01, 0.006, 6, 3, glow([0xff4040, 0x40ff60, 0xffd040][i]))))],
      hips: 0xa8acb6,
      arm: { upper: plain(0xc8ccd4), fore: plain(0xb8bcc6), hand: 0x8a8e98 },
      leg: legs(0xc8ccd4, BOOT(0x8a8e98)),
      gear: [robotHead]
    },
    utsInventor: man('utsMan', 0xecc8a8, null, 0xf6f6f4, 0x4a4e58, SHOE(0x2a2a2a), {
      torsoExtras: [shirtV(0xf6f6f4, 0x8aa8d8, { buttons: false, lapel: 0xe8e8e4 })],
      hipExtras: [coatSkirt(0xf6f6f4, 0.5)],
      gear: [nose(0xecc8a8, 1.12), shades(0x2a2a2a, [0.75, 0.82, 0.86, 0.35], true)]
    }),
    utsBlind: man('utsMan', 0xd8a882, 'utsBlackM', 0xf0f0ea, 0x2a3240, SHOE(0x1a1a1a), {
      torso: { body: 0xf0f0ea, top: 0xd8a882, shoulder: 0xd8a882 },
      arm: { upper: plain(0xd8a882), fore: plain(0xd8a882) },
      gear: [nose(0xd8a882, 1.05), blindfold(0x1e3a8a)]
    }),
    utsTank: man('utsMan', 0xc8946a, 'utsBlackM', 0x1a1a1e, 0x5a6a7a, SNEAKER(0xe8e8e8), {
      torso: { body: 0x1a1a1e, top: 0xc8946a, shoulder: 0xc8946a },
      arm: { upper: plain(0xc8946a), fore: plain(0xc8946a) }
    }),
    utsSleeper: man('utsMan', 0x9a6a48, 'utsDreads', 0xe0a020, 0x3a3a40, SNEAKER(0x2a2a2a)),
    utsWalker: man('utsMan', 0xe2bc98, 'utsGrey', 0x1c1c22, 0x1c1c22, SHOE(0x101010), { hipExtras: [coatSkirt(0x1c1c22, 0.42)] }),
    utsM1: man('utsMan', 0xecc8a8, 'utsBrownM', 0x6a9ad8, 0x2a3240, SHOE(0x2a1a14), { torsoExtras: [shirtV(0x6a9ad8, 0x6a9ad8, { lapel: 0x5a8ac8, buttons: false })] }),
    utsM2: man('utsMan', 0xe8c4a0, 'utsBlondM', 0x1a1a1e, 0x3a4a5a, SNEAKER(0xe0e0e0), { gear: [nose(0xe8c4a0), shades(0x1a1a1a, [0.1, 0.1, 0.12, 0.4])] }),
    utsM3: man('utsMan', 0xd0a07a, 'utsBlackM', 0x5a2a6a, 0x16161a, SHOE(0x101010), { torsoExtras: [shirtV(0x16161a, 0x5a2a6a)], torso: { body: 0x16161a }, arm: { upper: plain(0x16161a), fore: plain(0x16161a) }, gear: [nose(0xd0a07a), shades(0xc0c0c8, [0.3, 0.32, 0.36, 0.45])] }),
    utsM4: man('utsDj', 0x8a5a3a, 'utsBlackM', 0x2a7a4a, 0x2a2a30, SNEAKER(0xf0f0f0)),
    utsF1: woman('utsWoman', 0xf6dcc8, 'utsBlondF', 0xc0283a, 0x2a3a5a, HEEL(0x1a1a1a), {
      torso: { body: 0xc0283a, top: 0xf6dcc8, shoulder: 0xf6dcc8, neck: 0xf6dcc8 },
      torsoExtras: [strap(0xc0283a), (b, d) => b.prism(14, 0.045, 0.04, d.torso - 0.06, 0.044, 0.039, d.torso - 0.045, glow(0xf6f0e4, 0.5), { capTop: false })],
      arm: { upper: plain(0xf6dcc8), fore: plain(0xf6dcc8) }
    }),
    utsF2: woman('utsWoman', 0xe8c0a0, 'utsBrownF', 0x2a9a9a, 0x1a1a22, HEEL(0x1a1a1a), { hipExtras: [dressSkirt(0x1a1a22, 0.28)], leg: legs(0xe8c0a0, HEEL(0x1a1a1a)) }),
    utsF3: woman('utsWoman', 0xf4d4c0, 'utsRedF', 0xf0f0ec, 0x3a4a6a, SNEAKER(0xf4f4f4)),
    utsF4: woman('utsWoman', 0xc8946a, 'utsBlackF', 0x16161a, 0xc8946a, HEEL(0x16161a), {
      torso: { body: 0x16161a, top: 0xc8946a, shoulder: 0xc8946a, neck: 0xc8946a },
      torsoExtras: [strap(0x16161a)],
      hipExtras: [dressSkirt(0x16161a, 0.26)],
      arm: { upper: plain(0xc8946a), fore: plain(0xc8946a) }
    }),
    utsPink: woman('utsWoman', 0xf2d4c0, 'utsBrownF', 0xe868a8, 0x2a3a5a, SNEAKER(0xf4f4f4))
  };
  Object.assign(Cast.FORMS, FORMS);

  const CROWD_FORMS = ['utsM1', 'utsF1', 'utsM2', 'utsF2', 'utsM3', 'utsF3', 'utsM4', 'utsF4', 'utsPink', 'utsTank'];

  function printSequins(ctx, w, h) {
    ctx.fillStyle = '#c81e6e';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 6) {
      for (let x = (y / 6) % 2 ? 3 : 0; x < w; x += 6) {
        const k = (x * 7 + y * 13) % 5;
        ctx.fillStyle = k === 0 ? '#ffd0e8' : k === 1 ? '#e8508e' : k === 2 ? '#9a1050' : '#d62a7a';
        ctx.fillRect(x, y, 4, 4);
      }
    }
  }

  function printBolt(ctx, w, h) {
    ctx.fillStyle = '#1a1a1e';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f0c820';
    ctx.beginPath();
    ctx.moveTo(w * 0.58, h * 0.04);
    ctx.lineTo(w * 0.22, h * 0.56);
    ctx.lineTo(w * 0.46, h * 0.56);
    ctx.lineTo(w * 0.36, h * 0.96);
    ctx.lineTo(w * 0.8, h * 0.4);
    ctx.lineTo(w * 0.54, h * 0.4);
    ctx.closePath();
    ctx.fill();
  }

  function printHawaii(ctx, w, h) {
    ctx.fillStyle = '#1f8a86';
    ctx.fillRect(0, 0, w, h);
    const flower = (x, y, r, col) => {
      ctx.fillStyle = col;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + C(a) * r * 0.6, y + S(a) * r * 0.6, r * 0.55, r * 0.32, a, 0, PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f8e070';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.2, 0, PI * 2);
      ctx.fill();
    };
    ctx.fillStyle = '#2aa860';
    [[0.2, 0.3], [0.7, 0.62], [0.4, 0.9], [0.85, 0.15]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.ellipse(w * x, h * y, w * 0.16, h * 0.05, 0.6, 0, PI * 2);
      ctx.fill();
    });
    [[0.25, 0.18, '#f06aa0'], [0.72, 0.36, '#f8f0f0'], [0.3, 0.6, '#f8f0f0'], [0.78, 0.82, '#f06aa0'], [0.12, 0.88, '#f06aa0']].forEach(([x, y, col]) => flower(w * x, h * y, w * 0.13, col));
  }

  function printWings(ctx, w, h) {
    ctx.fillStyle = '#141416';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8e4dc';
    [-1, 1].forEach(s => {
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(w * 0.5 + s * w * (0.2 + i * 0.07), h * (0.42 - i * 0.04), w * 0.12, h * 0.06, s * (0.3 + i * 0.15), 0, PI * 2);
        ctx.fill();
      }
    });
    ctx.fillStyle = '#c81e24';
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.82);
    ctx.bezierCurveTo(w * 0.2, h * 0.6, w * 0.28, h * 0.28, w * 0.5, h * 0.42);
    ctx.bezierCurveTo(w * 0.72, h * 0.28, w * 0.8, h * 0.6, w * 0.5, h * 0.82);
    ctx.fill();
    ctx.strokeStyle = '#141416';
    ctx.lineWidth = w * 0.03;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.44);
    ctx.lineTo(w * 0.45, h * 0.58);
    ctx.lineTo(w * 0.55, h * 0.64);
    ctx.lineTo(w * 0.5, h * 0.8);
    ctx.stroke();
  }

  function printPlunger(ctx, w, h) {
    ctx.fillStyle = '#1e4ab0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f0c820';
    ctx.beginPath();
    ctx.moveTo(w * 0.12, h * 0.12);
    ctx.lineTo(w * 0.88, h * 0.12);
    ctx.lineTo(w * 0.88, h * 0.55);
    ctx.quadraticCurveTo(w * 0.86, h * 0.84, w * 0.5, h * 0.96);
    ctx.quadraticCurveTo(w * 0.14, h * 0.84, w * 0.12, h * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c81e24';
    ctx.beginPath();
    ctx.moveTo(w * 0.17, h * 0.17);
    ctx.lineTo(w * 0.83, h * 0.17);
    ctx.lineTo(w * 0.83, h * 0.55);
    ctx.quadraticCurveTo(w * 0.81, h * 0.8, w * 0.5, h * 0.9);
    ctx.quadraticCurveTo(w * 0.19, h * 0.8, w * 0.17, h * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f0c820';
    ctx.fillRect(w * 0.46, h * 0.22, w * 0.08, h * 0.36);
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.72);
    ctx.quadraticCurveTo(w * 0.3, h * 0.54, w * 0.5, h * 0.54);
    ctx.quadraticCurveTo(w * 0.7, h * 0.54, w * 0.7, h * 0.72);
    ctx.closePath();
    ctx.fill();
  }

  function printKaftan(ctx, w, h) {
    ctx.fillStyle = '#6a2a8a';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 3; x++) {
        const cx = w * (0.2 + x * 0.3 + (y % 2) * 0.15), cy = h * (0.14 + y * 0.24);
        ['#d8b040', '#f0e6d0', '#2a6ab0'].forEach((col, i) => {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(cx, cy, w * (0.11 - i * 0.035), 0, PI * 2);
          ctx.fill();
        });
      }
    }
  }

  Object.assign(Cast.PRINTS, { utsSequins: printSequins, utsBolt: printBolt, utsHawaii: printHawaii, utsWings: printWings, utsPlunger: printPlunger, utsKaftan: printKaftan });

  function polySlab(b, pts, z0, z1, top, side) {
    let cx = 0, cy = 0;
    pts.forEach(([x, y]) => { cx += x; cy += y; });
    cx /= pts.length;
    cy /= pts.length;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      b.tri([cx, cy, z1], [p[0], p[1], z1], [q[0], q[1], z1], top, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      b.tri([cx, cy, z0], [q[0], q[1], z0], [p[0], p[1], z0], side, null, [[0, 0, -1], [0, 0, -1], [0, 0, -1]]);
      const n = V3.norm([q[1] - p[1], -(q[0] - p[0]), 0]);
      b.quad([p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1], side, null, [n, n, n, n]);
    }
  }

  function strings(b, x0, x1, n, z) {
    for (let i = 0; i < n; i++) {
      const y = (i - (n - 1) / 2) * (0.036 / (n - 1));
      b.quad([x0, y - 0.0009, z], [x1, y * 0.85 - 0.0009, z], [x1, y * 0.85 + 0.0009, z], [x0, y + 0.0009, z], [0.9, 0.9, 0.88, 0.5], null, NZ);
    }
  }

  function arrowGuitar(b) {
    const body = 0xf0f0ec, edge = 0xc8c8c4, red = 0xd02028;
    polySlab(b, [[-0.26, 0.17], [-0.12, 0.05], [0.15, 0.035], [0.18, -0.03], [0.04, -0.07], [-0.22, -0.2], [-0.16, -0.02]], -0.022, 0.022, body, edge);
    b.quad([-0.2, 0.12, 0.0235], [0.1, 0.022, 0.0235], [0.1, 0.0, 0.0235], [-0.18, 0.09, 0.0235], red, null, NZ);
    b.quad([-0.17, -0.15, 0.0235], [0.02, -0.05, 0.0235], [0.01, -0.03, 0.0235], [-0.15, -0.12, 0.0235], red, null, NZ);
    [0.06, -0.04].forEach(x => b.at(x, -0.005, 0.027, (h) => h.box(0.028, 0.066, 0.008, 0x18181a)));
    b.at(-0.1, -0.01, 0.027, (h) => h.box(0.014, 0.06, 0.006, 0xc8c8c0));
    b.at(0.38, 0, 0.024, (h) => h.box(0.46, 0.048, 0.02, 0x2a1810));
    b.push(M4.translate(0.61, 0, 0.024), M4.rotY(0.15));
    polySlab(b, [[0, 0.03], [0.17, 0.05], [0.13, -0.03], [0, -0.028]], -0.008, 0.008, body, edge);
    b.pop();
    strings(b, -0.1, 0.61, 6, 0.036);
  }

  function acousticGuitar(b) {
    const top = 0xd88a3a, side = 0x8a4a1e;
    b.push(M4.rotX(PI / 2));
    b.at(-0.08, 0, 0, (h) => h.prism(16, 0.19, 0.17, -0.05, 0.19, 0.17, 0.05, side, { capBottom: true, topColor: side }));
    b.at(0.13, 0, 0, (h) => h.prism(14, 0.14, 0.13, -0.05, 0.14, 0.13, 0.05, side, { capBottom: true, topColor: side }));
    b.pop();
    b.at(-0.08, 0, 0.051, (h) => { h.push(M4.rotX(PI / 2)); h.disc(0.185, 16, top, 0); h.pop(); });
    b.at(0.13, 0, 0.051, (h) => { h.push(M4.rotX(PI / 2)); h.disc(0.135, 14, top, 0); h.pop(); });
    b.at(0.06, 0, 0.053, (h) => { h.push(M4.rotX(PI / 2)); h.disc(0.045, 12, 0x1a0e06, 0); h.pop(); });
    b.at(-0.16, 0, 0.055, (h) => h.box(0.03, 0.08, 0.008, 0x2a1810));
    b.at(0.42, 0, 0.03, (h) => h.box(0.36, 0.05, 0.02, 0x4a2a14));
    b.at(0.66, 0, 0.03, (h) => h.box(0.14, 0.075, 0.016, 0x2a1810));
    strings(b, -0.16, 0.6, 6, 0.058);
  }

  Object.assign(Cast.PROPS, {
    utsArrow: arrowGuitar,
    utsAcoustic: acousticGuitar,
    utsClipboard: (b) => {
      b.box(0.24, 0.32, 0.01, 0x8a5a2a);
      b.at(0, -0.01, 0.007, (h) => h.box(0.21, 0.27, 0.003, 0xf4f4ee));
      [0.08, 0.05, 0.02, -0.01, -0.04, -0.07].forEach(y => b.at(0, y, 0.009, (h) => h.box(0.16, 0.006, 0.001, 0x5a5a6a)));
      b.at(0, 0.15, 0.01, (h) => h.box(0.08, 0.03, 0.014, 0xb8bcc4));
    },
    utsTray: (b) => {
      b.prism(16, 0.2, 0.2, -0.01, 0.2, 0.2, 0.01, [0.86, 0.86, 0.9, 0.25], { capBottom: true });
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * PI * 2, rr = i % 3 ? 0.12 : 0.05;
        b.at(C(a) * rr, 0.035, S(a) * rr, (h) => {
          h.ellipsoid(0.034, 0.026, 0.034, 8, 5, 0xe0b070);
          h.at(0, 0.022, 0, (c) => c.ellipsoid(0.026, 0.016, 0.026, 8, 4, 0xfbf8f0));
        });
      }
    },
    utsPuff: (b) => {
      b.ellipsoid(0.034, 0.026, 0.034, 8, 5, 0xe0b070);
      b.at(0, 0.022, 0, (c) => c.ellipsoid(0.028, 0.017, 0.028, 8, 4, 0xfbf8f0));
    },
    utsBowl: (b) => {
      b.prism(16, 0.06, 0.06, -0.08, 0.2, 0.2, 0.06, [0.8, 0.86, 0.92, 0.3], { capBottom: true, capTop: false });
      b.at(0, 0.045, 0, (h) => h.disc(0.19, 16, glow(0xd0203a, 0.35), 0));
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * 0.08, 0.04, 0.05), M4.rotZ(s * 0.35));
        b.prism(6, 0.005, 0.005, 0, 0.005, 0.005, 0.32, s > 0 ? 0xf0f040 : 0x40e0f0);
        b.pop();
      });
    },
    utsRemote: (b) => {
      b.box(0.16, 0.1, 0.04, 0x8a8e96);
      [-0.04, 0.04].forEach(x => b.at(x, 0.0, 0.024, (h) => h.prism(6, 0.008, 0.008, 0, 0.006, 0.006, 0.04, 0x1a1a1a)));
      b.at(0.06, 0.05, 0, (h) => h.prism(6, 0.004, 0.004, 0, 0.002, 0.002, 0.36, 0xc8ccd4));
    },
    utsPail: (b) => {
      b.prism(14, 0.1, 0.1, -0.22, 0.12, 0.12, 0, 0xb8bcc4, { capBottom: true, capTop: false });
      b.at(0, -0.01, 0, (h) => h.disc(0.115, 14, 0xfbfbf6, 0));
      b.push(M4.rotX(0));
      for (let i = 0; i <= 8; i++) {
        const a = (i / 8) * PI;
        b.at(C(a) * 0.12, 0.06 + S(a) * 0.08, 0, (h) => h.box(0.008, 0.008, 0.008, 0x6a6e76));
      }
      b.pop();
    },
    utsHearts: (b) => {
      for (let i = 0; i < 6; i++) {
        b.push(M4.translate(-0.3 + i * 0.12, 0.02 * S(i * 1.7), 0));
        [-1, 1].forEach(s => b.at(s * 0.022, 0.012, 0, (h) => h.ellipsoid(0.032, 0.03, 0.003, 8, 3, 0xe02040)));
        b.tri([-0.05, 0.005, 0], [0.05, 0.005, 0], [0, -0.06, 0], 0xe02040, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        b.pop();
      }
    },
    utsTp: (b) => {
      b.push(M4.rotZ(PI / 2));
      b.prism(12, 0.055, 0.055, -0.05, 0.055, 0.055, 0.05, 0xfbfbf8, { capBottom: true });
      b.pop();
      b.at(0, -0.12, 0.05, (h) => h.box(0.1, 0.24, 0.002, 0xfbfbf8));
    },
    utsCup: (b) => {
      b.prism(10, 0.03, 0.03, -0.06, 0.038, 0.038, 0.06, [0.85, 0.9, 1.0, 0.35], { capBottom: true, capTop: false });
      b.at(0, 0.03, 0, (h) => h.disc(0.035, 10, glow(0xe8a020, 0.3), 0));
    },
    utsPucker: (b) => {
      b.at(0, 0.006, 0.006, (h) => h.ellipsoid(0.017, 0.008, 0.012, 10, 6, 0xb85a5a));
      b.at(0, -0.008, 0.005, (h) => h.ellipsoid(0.016, 0.009, 0.012, 10, 6, 0xc06464));
      b.at(0, -0.001, 0.016, (h) => h.ellipsoid(0.005, 0.004, 0.003, 8, 4, 0x3a1214));
    },
    utsLipstick: (b) => {
      b.prism(8, 0.01, 0.01, -0.03, 0.01, 0.01, 0.03, 0xd8b040, { capBottom: true });
      b.at(0, 0.03, 0, (h) => h.prism(8, 0.008, 0.008, 0, 0.004, 0.004, 0.025, 0xc8122c));
    }
  });

  Object.assign(GK.RIGS, {
    utsArrow: { at: [-0.03, -0.04, 0.15], rot: [-0.06, -0.22, 0.42], strum: [0.0, 0.03, 0.05], fret: [0.3, 0.56] },
    utsAcoustic: { at: [-0.02, -0.02, 0.17], rot: [-0.06, -0.2, 0.3], strum: [0.06, 0.03, 0.07], fret: [0.3, 0.58] }
  });

  const DOG_BLACK = 0x18161a, DOG_WHITE = 0xf2efe8;

  function dogSet(r) {
    const mk = (fn) => { const b = new Builder(); fn(b); return r.mesh(b); };
    const coat = (p) => (p[1] > 0.02 || (p[2] < -0.12 && p[1] > -0.06) ? DOG_BLACK : DOG_WHITE);
    return {
      body: mk(b => b.ellipsoid(0.13, 0.12, 0.27, 10, 7, DOG_WHITE, { colorAt: coat })),
      chest: mk(b => b.at(0, -0.02, 0.2, (h) => h.ellipsoid(0.1, 0.11, 0.09, 8, 5, DOG_WHITE))),
      head: mk(b => {
        b.ellipsoid(0.09, 0.085, 0.095, 10, 7, DOG_BLACK, { colorAt: (p) => (Math.abs(p[0]) < 0.022 && p[2] > 0.0 ? DOG_WHITE : DOG_BLACK) });
        b.at(0, -0.028, 0.085, (h) => h.ellipsoid(0.045, 0.04, 0.07, 8, 5, DOG_WHITE));
        b.at(0, -0.012, 0.152, (h) => h.ellipsoid(0.02, 0.015, 0.014, 6, 4, 0x0a0808));
        [-1, 1].forEach(s => {
          b.at(s * 0.042, 0.022, 0.07, (h) => h.ellipsoid(0.016, 0.015, 0.012, 14, 8, 0xc08030));
          b.at(s * 0.044, 0.022, 0.081, (h) => h.ellipsoid(0.008, 0.009, 0.004, 12, 6, 0x0a0606));
          b.at(s * 0.04, 0.026, 0.086, (h) => h.ellipsoid(0.003, 0.003, 0.002, 4, 2, [1, 1, 1, 1]));
          b.push(M4.translate(s * 0.065, 0.06, -0.01), M4.rotZ(-s * 0.4), M4.rotX(0.3));
          b.prism(3, 0.04, 0.012, -0.08, 0.012, 0.006, 0.0, DOG_BLACK, { capBottom: true, phase: PI });
          b.pop();
        });
      }),
      tongue: mk(b => b.at(0, -0.06, 0.13, (h) => h.ellipsoid(0.022, 0.006, 0.04, 6, 3, 0xe06a7a))),
      upper: mk(b => b.prism(6, 0.035, 0.035, -0.17, 0.045, 0.045, 0.0, DOG_BLACK, { capBottom: true })),
      lower: mk(b => {
        b.prism(6, 0.022, 0.022, -0.17, 0.028, 0.028, 0.0, DOG_WHITE, { capBottom: true });
        b.at(0, -0.17, 0.02, (h) => h.ellipsoid(0.028, 0.016, 0.04, 6, 3, DOG_WHITE));
      }),
      tail: mk(b => {
        b.prism(6, 0.02, 0.02, 0, 0.012, 0.012, 0.22, DOG_BLACK);
        b.at(0, 0.24, 0, (h) => h.ellipsoid(0.016, 0.04, 0.016, 6, 4, DOG_WHITE));
      })
    };
  }

  function dogMatrices(d) {
    const root = M4.chain(M4.translate(d.x, 0, d.z), M4.rotY(d.ry || 0));
    const gait = d.walk || 0;
    const ph = d.phase || 0;
    const bob = gait * 0.012 * Math.abs(S(ph * 2));
    const body = M4.chain(root, M4.translate(0, 0.42 + bob, 0));
    const out = { body };
    out.head = M4.chain(body, M4.translate(0, 0.12, 0.27), M4.rotY(d.look || 0), M4.rotX(d.nod || 0));
    out.tail = M4.chain(body, M4.translate(0, 0.05, -0.25), M4.rotX(-2.1 + (d.tailUp || 0)), M4.rotZ(0.5 * S(d.wag || 0)));
    const legsAt = [[0.07, 0.18, 0], [-0.07, 0.18, PI], [0.07, -0.18, PI], [-0.07, -0.18, 0]];
    legsAt.forEach(([x, z, off], i) => {
      const swing = gait * 0.5 * S(ph * 2 + off);
      const up = M4.chain(body, M4.translate(x, -0.06, z), M4.rotX(swing));
      out['up' + i] = up;
      out['lo' + i] = M4.chain(up, M4.translate(0, -0.17, 0), M4.rotX(gait * 0.4 * Math.max(0, S(ph * 2 + off + 1.2)) * (z > 0 ? -1 : 1)));
    });
    return out;
  }

  function drawDog(r, D, d, opts) {
    const m = dogMatrices(d);
    const pass = opts || {};
    r.draw(D.body, m.body, pass);
    r.draw(D.chest, m.body, pass);
    r.draw(D.head, m.head, pass);
    if (d.tongue) r.draw(D.tongue, M4.mul(m.head, M4.scale(1, 1, 0.6 + d.tongue * 0.8)), pass);
    r.draw(D.tail, m.tail, pass);
    for (let i = 0; i < 4; i++) {
      r.draw(D.upper, m['up' + i], pass);
      r.draw(D.lower, m['lo' + i], pass);
    }
    return m;
  }

  window.P3DUhnTissCast = { FORMS, CROWD_FORMS, PEOPLE_IDS: ['utsHero', 'utsGirl', 'utsGuitar', 'utsBass', 'utsDj', 'utsDrum'], dogSet, drawDog, dogMatrices, paintFace, nose };
})();
