(function (L) {
  'use strict';
  const D = L.DATA, SK = L.SKINS;
  const TAU = Math.PI * 2, PI = Math.PI;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  function rgbOf(c) { const n = parseInt(String(c).slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function toHex(r, g, b) { return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
  function shade(c, f) { const [r, g, b] = rgbOf(c); return f >= 1 ? toHex(r + (255 - r) * (f - 1), g + (255 - g) * (f - 1), b + (255 - b) * (f - 1)) : toHex(r * f, g * f, b * f); }
  function mix(a, b, t) { const x = rgbOf(a), y = rgbOf(b); return toHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); }
  function rgba(c, a) { const [r, g, b] = rgbOf(c); return `rgba(${r},${g},${b},${a})`; }
  function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }

  function kit(ctx, px, forceHi) {
    const hi = forceHi || px >= 2.5, lw = 1.15 / px;
    const k = {
      ctx, px, hi, lo: px < 1.8, glows: [], anchor: {},
      part(path, col, o) {
        if (!col) return;
        o = o || {};
        const c = ctx;
        c.beginPath(); path(c);
        if (o.flat) { c.fillStyle = col; c.fill(); }
        else {
          const s = o.sh == null ? 0.75 : o.sh;
          c.save(); c.clip();
          c.fillStyle = o.dark || shade(col, 0.7); c.fillRect(-400, -400, 800, 800);
          c.translate(-s, -s * 0.8); c.beginPath(); path(c); c.fillStyle = col; c.fill();
          if (hi && o.hl !== false) { c.translate(s * 1.25, s * 1.05); c.beginPath(); path(c); c.strokeStyle = o.light || shade(col, 1.32); c.lineWidth = s * 0.6; c.stroke(); }
          c.restore();
        }
        if (hi && !o.noInk) { c.beginPath(); path(c); c.strokeStyle = o.ink || shade(col, 0.42); c.lineWidth = lw * (o.inkW || 1); c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
      },
      ell(x, y, rx, ry, col, o) { k.part(c => c.ellipse(x, y, Math.max(0.15, rx), Math.max(0.15, ry), (o && o.rot) || 0, 0, TAU), col, o); },
      circ(x, y, r, col, o) { k.ell(x, y, r, r, col, o); },
      poly(p, col, o) { k.part(c => { c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); }, col, o); },
      seg(x0, y0, x1, y1, r0, r1, col, o) { const a = Math.atan2(y1 - y0, x1 - x0); k.part(c => { c.arc(x0, y0, r0, a + PI / 2, a - PI / 2); c.arc(x1, y1, r1, a - PI / 2, a + PI / 2); c.closePath(); }, col, o); },
      path(fn, col, o) { k.part(fn, col, o); },
      flat(fn, col) { k.part(fn, col, { flat: true, noInk: true }); },
      dot(x, y, r, col) { k.flat(c => c.arc(x, y, Math.max(r, 0.55 / px), 0, TAU), col); },
      line(x0, y0, x1, y1, col, w) { const c = ctx; c.strokeStyle = col; c.lineWidth = Math.max(w || 1, 0.9 / px); c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); },
      curve(p, col, w) {
        const c = ctx; c.strokeStyle = col; c.lineWidth = Math.max(w || 1, 0.9 / px); c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(p[0], p[1]);
        if (p.length === 6) c.quadraticCurveTo(p[2], p[3], p[4], p[5]); else if (p.length === 8) c.bezierCurveTo(p[2], p[3], p[4], p[5], p[6], p[7]); else for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]);
        c.stroke();
      },
      glow(x, y, r, col, a) { k.glows.push({ x, y, r, col, a: a == null ? 0.7 : a, m: ctx.getTransform(), mode: 'lighter' }); },
      tint(fn, col, a) { k.glows.push({ fn, col, a, m: ctx.getTransform(), mode: 'source-over' }); },
      at(x, y, a, fn) { ctx.save(); ctx.translate(x, y); if (a) ctx.rotate(a); fn(); ctx.restore(); }
    };
    return k;
  }
  function paintGlows(ctx, glows) {
    for (const g of glows) {
      ctx.save(); ctx.setTransform(g.m); ctx.globalCompositeOperation = g.mode;
      if (g.fn) { ctx.globalAlpha = g.a; ctx.fillStyle = g.col; ctx.beginPath(); g.fn(ctx); ctx.fill(); }
      else {
        const gr = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
        gr.addColorStop(0, rgba(g.col, g.a)); gr.addColorStop(0.4, rgba(g.col, g.a * 0.42)); gr.addColorStop(1, rgba(g.col, 0));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  function crisp(cv, outline) {
    const ctx = cv.getContext('2d'), w = cv.width, h = cv.height, id = ctx.getImageData(0, 0, w, h), p = id.data;
    const solid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) { if (p[i * 4 + 3] > 110) { p[i * 4 + 3] = 255; solid[i] = 1; } else p[i * 4 + 3] = 0; }
    const o = outline || [18, 10, 8];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (solid[i]) continue;
      if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) { p[i * 4] = o[0]; p[i * 4 + 1] = o[1]; p[i * 4 + 2] = o[2]; p[i * 4 + 3] = 255; }
    }
    ctx.putImageData(id, 0, 0);
    return cv;
  }

  function ik(ax, ay, bx, by, l1, l2, dir) {
    const dx = bx - ax, dy = by - ay, d = clamp(Math.hypot(dx, dy), 0.01, l1 + l2 - 0.01);
    const a = Math.atan2(dy, dx), c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
    const t = a - dir * Math.acos(c);
    return [ax + Math.cos(t) * l1, ay + Math.sin(t) * l1];
  }
  function skel(B, pose) {
    const w = pose.walk != null ? pose.walk * TAU : null, splash = pose.kind === 'splash';
    const bob = w != null ? Math.abs(Math.sin(w)) * (B.bobW || 0.8) - (B.bobW || 0.8) * 0.5 : (pose.breath || 0) * 0.3 + (pose.kind === 'atk' && pose.f === 1 ? 0.8 : 0) + (splash ? (B.splashCrouch || 1.4) : 0);
    const lean = w != null ? 0.5 : pose.kind === 'atk' ? [-0.7, 1.3, 0.4][pose.f] : splash ? (B.splashLean == null ? 1 : B.splashLean) : pose.kind === 'cast' ? [-0.3, 0.6][pose.f] : 0;
    const hipY = -B.hip + bob;
    const stance = splash ? (B.splashStance || 3.4) : pose.kind === 'atk' ? 1.6 : pose.kind === 'cast' ? 0.8 : 0;
    const legs = [0, 1].map(i => {
      const hx = (i ? B.hipW : -B.hipW) * 0.8;
      let fx = i ? 1.3 + stance : -1.1 - stance * 0.9, fy = 0;
      if (w != null) { const a = w + (i ? 0 : PI); fx = Math.sin(a) * B.stride + (i ? 0.6 : -0.6); fy = -Math.max(0, Math.cos(a)) * B.lift; }
      const [kx, ky] = ik(hx, hipY, fx, fy, B.thigh, B.shin, 1);
      return { hx, hy: hipY, kx, ky, fx, fy };
    });
    return { hipY, shY: hipY - B.torso, legs, lean, bob, w, sway: w != null ? Math.sin(w) : (pose.breath || 0) * 0.35, atk: pose.kind === 'atk' ? pose.f : -1, cast: pose.kind === 'cast' ? pose.f : -1, splash };
  }
  function leg(k, g, o) {
    const dk = c => c && (o.far ? shade(c, 0.8) : c);
    k.seg(g.hx, g.hy, g.kx, g.ky, o.r0, o.r1, dk(o.thigh));
    k.seg(g.kx, g.ky, g.fx, g.fy - (o.ank || 1.2), o.r1, o.r2, dk(o.shin || o.thigh));
    if (o.stripes && k.px >= 1.9) {
      const c = k.ctx, n = 5; c.save(); c.strokeStyle = dk(o.stripes); c.lineWidth = 0.7;
      for (let i = 1; i <= n; i++) { const t = i / (n + 1), x = lerp(g.kx, g.fx, t), y = lerp(g.ky, g.fy - 1.2, t); c.beginPath(); c.moveTo(x - o.r1, y); c.lineTo(x + o.r1, y - 0.2); c.stroke(); }
      c.restore();
    }
    if (o.knee) k.circ(g.kx, g.ky, o.r1 * 1.12, dk(o.knee), { sh: 0.4 });
    foot(k, g.fx, g.fy, o, dk(o.boot));
  }
  function foot(k, x, y, o, col) {
    const h = o.bootH || 2.2, l = o.bootL || 2.4, w = o.r2 || 1;
    k.path(c => { c.moveTo(x - w - 0.2, y - h); c.lineTo(x + w * 0.9, y - h); c.lineTo(x + w + 0.2, y - 1.4); c.quadraticCurveTo(x + l + 1, y - 1.3, x + l + 0.9, y); c.lineTo(x - w - 0.7, y); c.closePath(); }, col, { sh: 0.45 });
  }
  function arm(k, sx, sy, hx, hy, l1, l2, r0, r1, up, low, hand) {
    const [ex, ey] = ik(sx, sy, hx, hy, l1, l2, -1);
    k.seg(sx, sy, ex, ey, r0, r1 * 0.95, up);
    k.seg(ex, ey, hx, hy, r1 * 0.95, r1 * 0.8, low || up);
    if (hand) k.circ(hx, hy, r1 * 1.02, hand, { sh: 0.35 });
    return [ex, ey];
  }
  function torso(k, S, o) {
    const t = S.shY, b = S.hipY + (o.drop == null ? 1 : o.drop), m = (t + b) / 2, l = S.lean;
    k.path(c => {
      c.moveTo(-o.sw + l, t); c.lineTo(o.sw + l + (o.chest || 0), t);
      c.quadraticCurveTo(o.ww + 1 + l * 0.6, m, o.hw, b); c.lineTo(-o.hw, b);
      c.quadraticCurveTo(-o.ww - 0.6 + l * 0.4, m, -o.sw + l, t); c.closePath();
    }, o.col, o.opt);
  }
  function eyes(k, x, y, r, o) {
    const ey = y + (o.dy == null ? 0.1 : o.dy) * r, big = o.big || 1, nx = x + (o.nx == null ? 0.44 : o.nx) * r, fx = x + (o.fx == null ? -0.02 : o.fx) * r;
    if (o.glow) {
      const w = 0.2 * r * big, h = 0.1 * r * big;
      for (const ex of [fx, nx]) { k.flat(c => c.ellipse(ex, ey, w, Math.max(h, 0.6 / k.px), -0.15, 0, TAU), o.glow); k.glow(ex, ey, r * 0.55, o.glow, 0.9); }
      return;
    }
    if (!k.hi) {
      const w = Math.max(1 / k.px, 0.12 * r * big), h = Math.max(1.3 / k.px, 0.22 * r * big);
      const col = k.px >= 1.9 && o.iris ? shade(o.iris, 0.5) : (o.dark || '#1a1014');
      k.flat(c => c.rect(nx - w / 2, ey - h / 2, w, h), col);
      k.flat(c => c.rect(fx - w * 0.45, ey - h / 2, w * 0.9, h), col);
      return;
    }
    for (const [ex, s] of [[fx, 0.8], [nx, 1]]) {
      const w = 0.19 * r * big * s, h = 0.26 * r * big;
      k.flat(c => c.ellipse(ex, ey, w, h, 0, 0, TAU), o.white || '#fbf8f4');
      k.flat(c => c.ellipse(ex + w * 0.2, ey + h * 0.08, w * 0.72, h * 0.76, 0, 0, TAU), o.iris || '#3a2a20');
      k.flat(c => c.ellipse(ex + w * 0.26, ey + h * 0.1, w * 0.36, h * 0.42, 0, 0, TAU), '#0e0a10');
      k.flat(c => c.ellipse(ex - w * 0.1, ey - h * 0.34, w * 0.3, h * 0.22, 0, 0, TAU), '#ffffff');
      const c = k.ctx; c.strokeStyle = o.lid || '#1a1014'; c.lineWidth = (o.lash ? 2 : 1.3) / k.px; c.beginPath(); c.ellipse(ex, ey, w * 1.04, h * 1.02, 0, PI * 1.04, PI * 1.96); c.stroke();
      if (o.lash) { c.beginPath(); c.moveTo(ex + w * 0.9, ey - h * 0.5); c.lineTo(ex + w * 1.5, ey - h * 0.85); c.stroke(); }
    }
    if (o.brow) {
      const bw = 0.08 * r * (o.browW || 1), a = o.angry ? 0.12 * r : 0;
      k.curve([fx - 0.22 * r, ey - 0.4 * r, fx, ey - 0.5 * r, fx + 0.16 * r, ey - 0.42 * r + a], o.brow, bw);
      k.curve([nx - 0.18 * r, ey - 0.44 * r + a, nx + 0.04 * r, ey - 0.54 * r, nx + 0.26 * r, ey - 0.46 * r], o.brow, bw);
    }
  }
  function mouth(k, x, y, r, kind, col) {
    if (!k.hi) return;
    const mx = x + 0.4 * r, my = y + 0.52 * r;
    switch (kind) {
      case 'grin':
        k.flat(c => { c.moveTo(mx - 0.26 * r, my - 0.06 * r); c.quadraticCurveTo(mx + 0.04 * r, my + 0.3 * r, mx + 0.36 * r, my - 0.12 * r); c.closePath(); }, '#5a1020');
        k.flat(c => { c.moveTo(mx - 0.22 * r, my - 0.04 * r); c.lineTo(mx + 0.32 * r, my - 0.1 * r); c.lineTo(mx + 0.27 * r, my + 0.01 * r); c.lineTo(mx - 0.16 * r, my + 0.04 * r); c.closePath(); }, '#ffffff');
        break;
      case 'smile': k.curve([mx - 0.18 * r, my - 0.02 * r, mx + 0.02 * r, my + 0.12 * r, mx + 0.22 * r, my - 0.06 * r], col || '#6a2a2a', 0.07 * r); break;
      case 'open': k.flat(c => c.ellipse(mx + 0.02 * r, my + 0.02 * r, 0.13 * r, 0.11 * r, 0, 0, TAU), '#5a1020'); break;
      case 'frown': k.curve([mx - 0.18 * r, my + 0.06 * r, mx + 0.02 * r, my - 0.05 * r, mx + 0.22 * r, my + 0.05 * r], col || '#4a2020', 0.07 * r); break;
      default: k.line(mx - 0.16 * r, my + 0.02 * r, mx + 0.2 * r, my - 0.01 * r, col || '#4a2a2a', 0.07 * r);
    }
  }
  function nose(k, x, y, r, col) { if (k.hi) k.curve([x + 0.76 * r, y + 0.12 * r, x + 0.9 * r, y + 0.32 * r, x + 0.72 * r, y + 0.36 * r], col, 0.06 * r); }
  function blush(k, x, y, r, col) { if (k.hi) k.flat(c => c.ellipse(x + 0.52 * r, y + 0.42 * r, 0.16 * r, 0.08 * r, 0, 0, TAU), rgba(col || '#ff6080', 0.55)); }
  function head(k, x, y, r, col, o) {
    o = o || {};
    const j = o.jaw == null ? 0.3 : o.jaw, t = o.tall || 1;
    k.path(c => {
      c.moveTo(x - r * 0.98, y + r * 0.12);
      c.bezierCurveTo(x - r * 1.02, y - r * 1.32 * t, x + r * 1.02, y - r * 1.32 * t, x + r * 0.98, y - r * 0.08);
      c.quadraticCurveTo(x + r * (0.98 + j * 0.1), y + r * (0.5 + j * 0.12), x + r * (0.32 + j * 0.3), y + r * (0.84 + j * 0.2));
      c.quadraticCurveTo(x - r * 0.05, y + r * (0.98 + j * 0.12), x - r * 0.52, y + r * (0.72 + j * 0.06));
      c.quadraticCurveTo(x - r * 0.98, y + r * 0.56, x - r * 0.98, y + r * 0.12);
      c.closePath();
    }, col, { sh: r * 0.12 });
  }
  function ear(k, x, y, r, col) {
    k.ell(x - r * 0.16, y + r * 0.22, r * 0.2, r * 0.27, col, { sh: r * 0.06 });
    if (k.hi) k.curve([x - r * 0.1, y + r * 0.1, x - r * 0.22, y + r * 0.22, x - r * 0.12, y + r * 0.36], shade(col, 0.62), r * 0.05);
  }
  function roundEar(k, bx, by, tx, ty, w, col, inner) {
    const a = Math.atan2(ty - by, tx - bx), len = Math.hypot(tx - bx, ty - by), mx = (bx + tx) / 2, my = (by + ty) / 2;
    k.path(c => { c.ellipse(mx, my, len / 2 + w * 0.2, w, a, 0, TAU); }, col, { sh: w * 0.22 });
    if (inner && k.px >= 1.6) k.flat(c => c.ellipse(lerp(mx, tx, 0.12), lerp(my, ty, 0.12), len * 0.36, w * 0.5, a, 0, TAU), inner);
  }
  function longEar(k, bx, by, tx, ty, w, col, inner) {
    const a = Math.atan2(ty - by, tx - bx), nx = -Math.sin(a), ny = Math.cos(a), mx = (bx + tx) / 2, my = (by + ty) / 2;
    k.path(c => { c.moveTo(bx + nx * w, by + ny * w); c.quadraticCurveTo(mx + nx * w * 1.2, my + ny * w * 1.2, tx, ty); c.quadraticCurveTo(mx - nx * w * 0.9, my - ny * w * 0.9, bx - nx * w, by - ny * w); c.closePath(); }, col, { sh: w * 0.25 });
    if (inner && k.px >= 1.6) k.path(c => { c.moveTo(bx + nx * w * 0.5, by + ny * w * 0.5); c.quadraticCurveTo(mx + nx * w * 0.6, my + ny * w * 0.6, lerp(mx, tx, 0.6), lerp(my, ty, 0.6)); c.quadraticCurveTo(mx - nx * w * 0.2, my - ny * w * 0.2, bx - nx * w * 0.3, by - ny * w * 0.3); c.closePath(); }, inner, { flat: true, noInk: true });
  }
  function star(c, x, y, r, n, inner) { for (let i = 0; i < n * 2; i++) { const a = -PI / 2 + i * PI / n, rr = i % 2 ? r * (inner || 0.45) : r; if (i) c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
  function braid(k, x0, y0, x1, y1, w, col, col2) {
    const n = 11;
    for (let i = n; i >= 0; i--) {
      const t = i / n, x = lerp(x0, x1, t) + Math.sin(t * PI) * -1.6, y = lerp(y0, y1, t), ww = w * (1 - t * 0.4);
      k.ell(x + (i % 2 ? 0.35 : -0.35) * ww, y, ww * 0.72, ww * 1.05, i % 2 ? col : shade(col, 0.88), { sh: ww * 0.28, rot: i % 2 ? 0.6 : -0.6 });
    }
    k.ell(x1 - 0.3, y1 + 1.6, w * 0.34, w * 0.5, col2 || col, { sh: 0.2 });
    k.path(c => { c.moveTo(x1 - w * 0.3, y1 + 2); c.lineTo(x1 - w * 0.7, y1 + 4.4); c.lineTo(x1 - 0.1, y1 + 3.2); c.lineTo(x1 + w * 0.5, y1 + 4.6); c.lineTo(x1 + w * 0.3, y1 + 2); c.closePath(); }, col, { sh: 0.2 });
  }

  const C = {};

  C.jinx = (k, P, pose, parts) => {
    const B = { hip: 16.2, thigh: 8.1, shin: 8.4, torso: 10.6, hipW: 1.2, stride: 4.6, lift: 2.4, bobW: 0.9, splashStance: 3.8 };
    const S = skel(B, pose), l = S.lean, sh = S.shY, rocket = !!pose.rocket;
    const hx = 1 + l * 1.2, hy = sh - 5.9, r = 5;
    k.anchor.head = [hx, hy, r];
    braid(k, hx - 3.4, hy - 0.6, hx - 9.2 - S.sway * 1.4, -4.6, 2.1, P.hair, P.hair2);
    if (!rocket) launcher(k, P, parts, hx - 3, sh + 3.8, -2.35, 0.72);
    const aim = rocket ? -0.05 : S.atk >= 0 ? [-0.22, -0.02, -0.1][S.atk] : S.splash ? -0.18 : S.cast >= 0 ? -0.45 : 0.18;
    const grip = rocket ? [2.6 + l, sh - 1.4] : [3.4 + l, S.hipY - 2.4 - (S.cast >= 0 ? 3 : 0)];
    arm(k, -1.9 + l, sh + 1.2, grip[0] + (rocket ? -2.5 : 3.4), grip[1] + (rocket ? 1.5 : 0.8), 4.6, 4.8, 1.2, 1, shade(P.skin, 0.86), shade(P.skin, 0.86), shade(P.skin, 0.86));
    const [lb, lf] = S.legs;
    leg(k, lb, { far: true, r0: 1.9, r1: 1.25, r2: 1.05, thigh: P.cloth, shin: P.stock, stripes: P.stock2, boot: P.boot, bootH: 3.2 });
    leg(k, lf, { r0: 1.9, r1: 1.25, r2: 1.05, thigh: P.cloth, shin: P.skin, boot: P.boot, bootH: 3.2 });
    const y0 = S.hipY;
    k.poly([-2.3, y0 - 1, 2.4 + l * 0.3, y0 - 1, 2.8, y0 + 2.4, -2.9, y0 + 2.6], P.cloth);
    torso(k, S, { sw: 2.2, ww: 1.3, hw: 2.1, col: P.skin, drop: -0.6 });
    k.path(c => { c.moveTo(-2.4 + l, sh - 0.2); c.lineTo(2.8 + l, sh - 0.2); c.lineTo(2.9 + l * 0.8, sh + 4.4); c.lineTo(-2.2 + l * 0.7, sh + 4.6); c.closePath(); }, P.cloth);
    if (k.px >= 1.6) { k.line(-1.6 + l, sh + 0.2, 1.6 + l, sh + 4.2, P.cloth2, 0.55); k.line(2 + l, sh, -0.6 + l, sh + 4.3, P.cloth2, 0.45); }
    k.path(c => { c.moveTo(-2.6, y0 - 1.6); c.lineTo(2.8 + l * 0.3, y0 - 2.1); c.lineTo(2.9 + l * 0.3, y0 - 0.9); c.lineTo(-2.6, y0 - 0.3); c.closePath(); }, P.belt, { sh: 0.3 });
    if (k.hi) { for (let i = 0; i < 5; i++) k.flat(c => c.rect(-2.1 + i * 1.05, y0 - 1.9 - i * 0.1, 0.5, 1.1), '#fff0b0'); k.curve([-1.4 + l, y0 - 4.2, 0 + l, y0 - 5.6, 1 + l, y0 - 4.1], P.acc, 0.35); }
    k.seg(0.2 + l, sh, 0.5 + l, sh - 1.4, 0.9, 0.9, shade(P.skin, 0.92));
    head(k, hx, hy, r, P.skin, { jaw: 0.35 });
    ear(k, hx, hy, r, P.skin);
    eyes(k, hx, hy, r, { iris: P.eye, big: 1.12, lash: true, brow: shade(P.hair, 0.6) });
    mouth(k, hx, hy, r, 'grin');
    blush(k, hx, hy, r, '#ff7090');
    k.path(c => { c.moveTo(hx - r * 1.05, hy + r * 0.2); c.quadraticCurveTo(hx - r * 1.1, hy - r * 1.25, hx + r * 0.3, hy - r * 1.12); c.quadraticCurveTo(hx + r * 1.1, hy - r * 0.95, hx + r * 1.05, hy - r * 0.2); c.lineTo(hx + r * 0.75, hy - r * 0.45); c.lineTo(hx + r * 0.62, hy - r * 0.05); c.lineTo(hx + r * 0.3, hy - r * 0.55); c.lineTo(hx + r * 0.05, hy - r * 0.15); c.lineTo(hx - r * 0.2, hy - r * 0.6); c.lineTo(hx - r * 0.55, hy - r * 0.05); c.closePath(); }, P.hair, { sh: 0.6 });
    k.circ(hx - r * 0.72, hy - r * 0.5, 1.1, P.hair2 || P.hair, { sh: 0.3 });
    jinxHat(k, P, parts, hx, hy, r);
    if (rocket) launcher(k, P, parts, grip[0] - 3.4, grip[1] + 0.6, aim, 1);
    else powpow(k, P, parts, grip[0], grip[1], aim, S.atk === 1 || S.splash);
    arm(k, 2 + l, sh + 1.2, grip[0] + 0.2, grip[1] + 0.9, 4.6, 4.7, 1.25, 1.05, P.skin, P.skin, P.skin);
    if (k.hi) k.curve([2.6 + l, sh + 2.4, 3.4 + l, sh + 3.8, 2.8 + l, sh + 5], P.acc, 0.35);
    if (S.cast === 1) k.glow(grip[0] + 9, grip[1] - 5, 7, P.acc, 0.8);
  };
  function jinxHat(k, P, parts, hx, hy, r) {
    switch (parts.hat) {
      case 'fedora':
        k.ell(hx + 0.4, hy - r * 0.78, r * 1.45, r * 0.3, P.hat, { sh: 0.4 });
        k.path(c => { c.moveTo(hx - r * 0.8, hy - r * 0.8); c.lineTo(hx - r * 0.65, hy - r * 1.6); c.quadraticCurveTo(hx + 0.4, hy - r * 1.95, hx + r * 0.85, hy - r * 1.55); c.lineTo(hx + r * 0.95, hy - r * 0.8); c.closePath(); }, P.hat);
        k.path(c => c.rect(hx - r * 0.78, hy - r * 1.12, r * 1.72, r * 0.3), P.acc, { sh: 0.2 });
        break;
      case 'hairpins':
        for (const [dx, dy] of [[-0.7, -0.9], [0.1, -1.1]]) { k.line(hx + r * dx, hy + r * dy, hx + r * dx - 1.8, hy + r * dy - 2.2, P.acc, 0.5); k.circ(hx + r * dx - 1.9, hy + r * dy - 2.3, 0.8, P.hair2); }
        k.seg(hx - r * 0.9, hy - r * 0.2, hx - r * 1.1, hy + r * 1.3, 0.5, 0.3, P.acc);
        break;
      case 'star':
        k.path(c => star(c, hx - r * 0.35, hy - r * 1.05, 1.9, 5), P.acc, { sh: 0.3 });
        k.path(c => star(c, hx + r * 0.55, hy - r * 0.95, 1.2, 5), P.acc, { sh: 0.2 });
        k.glow(hx - r * 0.35, hy - r * 1.05, 3.4, P.acc, 0.45);
        break;
    }
  }
  function powpow(k, P, parts, x, y, a, fire) {
    k.at(x, y, a, () => {
      const kind = parts.gun || 'minigun';
      if (kind === 'tommy') {
        k.poly([-6.4, -1.6, -2.2, -2.2, -2, 0.6, -6.8, 1.4], P.gun);
        k.path(c => c.rect(-2.4, -2.8, 8.6, 3), P.gun2);
        k.path(c => c.rect(6, -2.3, 5.4, 1.2), P.gun2, { sh: 0.2 });
        k.circ(1.2, 1.4, 2.2, P.gun2); if (k.hi) k.circ(1.2, 1.4, 0.8, P.gunAcc);
        k.path(c => c.rect(-1, -0.2, 1.2, 3.2), P.gun, { sh: 0.3 });
      } else {
        k.path(c => { c.moveTo(-5, -3.2); c.lineTo(5.2, -3.2); c.quadraticCurveTo(7, -1.2, 5.2, 1.1); c.lineTo(-5, 1.1); c.closePath(); }, P.gun);
        k.circ(-4.6, -1, 2.3, P.gun2);
        for (let i = 0; i < 3; i++) k.path(c => c.rect(5.6, -2.9 + i * 1.1, 6.2, 0.9), P.gun2, { sh: 0.25 });
        k.path(c => c.rect(11.4, -3.2, 1.2, 3.8), shade(P.gun2, 1.3), { sh: 0.2 });
        k.circ(0.4, 1.8, 2, P.gun2);
        if (kind === 'dragon') { k.path(c => { c.moveTo(4.6, -4.4); c.lineTo(8.6, -3.6); c.lineTo(7, -2.6); c.lineTo(9.4, -1.4); c.lineTo(5, -0.6); c.closePath(); }, P.gunAcc, { sh: 0.3 }); if (k.px >= 1.6) k.dot(6.2, -3, 0.45, '#101010'); }
        if (kind === 'star') { k.path(c => star(c, 0.6, -1.1, 2.3, 5), P.gunAcc, { sh: 0.3 }); k.glow(0.6, -1.1, 3.6, P.gunAcc, 0.5); }
        if (kind === 'minigun' && k.hi) { k.flat(c => { c.moveTo(1, -0.4); for (let i = 0; i < 5; i++) { c.lineTo(1.6 + i * 0.8, 0.5); c.lineTo(2 + i * 0.8, -0.4); } c.closePath(); }, '#ffffff'); k.dot(-2.4, -2, 0.5, P.gunAcc); k.dot(-1.2, -2, 0.5, P.gunAcc); }
        k.path(c => c.rect(-1.4, 0.6, 1.3, 2.8), P.gun2, { sh: 0.3 });
      }
      if (fire) { k.poly([12.4, -1.8, 16.5, -3.6, 15, -1.2, 17.8, 0.2, 14.4, 0.2, 15.4, 2.4, 12.4, 0.4], '#ffe060', { flat: true, noInk: true }); k.glow(13.8, -0.9, 6, '#ffb030', 0.85); }
    });
  }
  function launcher(k, P, parts, x, y, a, s) {
    const kind = parts.launcher || 'shark';
    k.at(x, y, a, () => {
      k.ctx.scale(s, s);
      if (kind === 'case') {
        k.path(c => { c.moveTo(-8, -2.6); c.quadraticCurveTo(-3, -4, 1, -2.2); c.quadraticCurveTo(5, -3.6, 9, -2.2); c.lineTo(9, 2.2); c.quadraticCurveTo(5, 3.6, 1, 2.2); c.quadraticCurveTo(-3, 4, -8, 2.6); c.closePath(); }, P.gun2);
        k.path(c => c.rect(8.6, -1.8, 2.8, 3.6), P.gunAcc, { sh: 0.3 });
        k.line(-6, 0, 6, 0, P.gunAcc, 0.4);
        return;
      }
      const body = kind === 'dragon' ? P.gun : kind === 'star' ? P.gun : P.launcher, belly = kind === 'shark' ? P.launcher2 : P.gunAcc;
      k.path(c => { c.moveTo(-8.4, -2); c.quadraticCurveTo(-1, -3.8, 7, -3); c.lineTo(9.4, -1.6); c.lineTo(9.4, 1.6); c.lineTo(7, 3); c.quadraticCurveTo(-1, 3.8, -8.4, 2); c.closePath(); }, body);
      k.path(c => { c.moveTo(-6, 1.4); c.quadraticCurveTo(0, 3.2, 7, 2.2); c.lineTo(7, 0.8); c.quadraticCurveTo(0, 1.8, -6, 0.6); c.closePath(); }, belly, { sh: 0.2 });
      k.poly([-8.4, -2, -11.2, -4.4, -10, 0, -11.2, 4.4, -8.4, 2], shade(body, 0.85));
      k.poly([-2.6, -3.1, 0.6, -6.4, 1.8, -3.3], shade(body, 0.9));
      if (kind === 'star') { k.path(c => star(c, 2, -0.2, 2.4, 5), P.gunAcc, { sh: 0.3 }); k.glow(2, -0.2, 4, P.gunAcc, 0.4); }
      if (k.px >= 1.6) {
        k.path(c => { c.moveTo(7.2, -2.6); c.lineTo(10.4, 0); c.lineTo(7.2, 2.6); c.closePath(); }, '#401018', { flat: true, noInk: true });
        if (k.hi) for (let i = 0; i < 3; i++) { k.flat(c => { c.moveTo(7.6 + i * 0.9, -2.1 + i * 0.6); c.lineTo(8.1 + i * 0.9, -1.2 + i * 0.6); c.lineTo(8.6 + i * 0.9, -2.2 + i * 0.7); c.closePath(); }, '#ffffff'); k.flat(c => { c.moveTo(7.6 + i * 0.9, 2.1 - i * 0.6); c.lineTo(8.1 + i * 0.9, 1.2 - i * 0.6); c.lineTo(8.6 + i * 0.9, 2.2 - i * 0.7); c.closePath(); }, '#ffffff'); }
        k.circ(5.2, -1.4, 0.9, '#ffffff', { sh: 0.1 }); k.dot(5.5, -1.4, 0.45, '#101018');
      }
      if (kind === 'dragon') { k.poly([4, -3.2, 5, -6.2, 6.4, -3], P.gunAcc); k.poly([1.6, -3.4, 2.4, -5.6, 3.6, -3.2], P.gunAcc); }
    });
  }

  C.lulu = (k, P, pose, parts) => {
    const B = { hip: 7.6, thigh: 3.9, shin: 4, torso: 7.6, hipW: 1.2, stride: 3.2, lift: 1.7, bobW: 0.7, splashStance: 2.2, splashLean: 0.5, splashCrouch: 0.6 };
    const S = skel(B, pose), l = S.lean, sh = S.shY;
    const hx = 0.9 + l, hy = sh - 6.6, r = 7.2;
    k.anchor.head = [hx, hy, r];
    longEar(k, hx - 3, hy - 1.2, hx - 13.6, hy - 6.4 - S.sway * 0.6, 2.2, shade(P.skin, 0.86), null);
    k.path(c => { c.moveTo(hx - r * 0.9, hy - r * 0.2); c.quadraticCurveTo(hx - r * 1.5, hy + r * 1.2, hx - r * 1.1 - S.sway, sh + 7); c.lineTo(hx - r * 0.2, sh + 2); c.closePath(); }, shade(P.hair, 0.9));
    const staffUp = S.cast >= 0 || S.splash;
    const hand = staffUp ? [4.6 + l, sh - 4 - (S.cast === 1 ? 1 : 0)] : S.atk >= 0 ? [[2.4, sh + 1.2], [6.6, sh], [5, sh + 1.4]][S.atk] : [4.2 + l, sh + 4.8 + S.sway * 0.3];
    arm(k, -1.6 + l, sh + 1, -2.8 + l - S.sway * 0.8, sh + 5.6, 2.6, 2.6, 1.05, 0.9, shade(P.cloth, 0.85), shade(P.cloth, 0.85), shade(P.skin, 0.88));
    const [lb, lf] = S.legs;
    leg(k, lb, { far: true, r0: 1.3, r1: 1.1, r2: 1, thigh: P.cloth2, shin: P.cloth2, stripes: P.cloth, boot: P.cloth, bootH: 1.8, bootL: 2.8 });
    leg(k, lf, { r0: 1.3, r1: 1.1, r2: 1, thigh: P.cloth2, shin: P.cloth2, stripes: P.cloth, boot: P.cloth, bootH: 1.8, bootL: 2.8 });
    const hem = S.hipY + 2.2;
    k.path(c => { c.moveTo(-2.8 + l, sh); c.lineTo(3 + l, sh); c.quadraticCurveTo(4.4, sh + 5, 6.4, hem); c.lineTo(-6, hem + 0.4); c.quadraticCurveTo(-4.2, sh + 5, -2.8 + l, sh); c.closePath(); }, P.cloth);
    if (k.px >= 1.6) { k.path(c => { c.moveTo(-6, hem + 0.4); for (let i = 0; i <= 8; i++) c.lineTo(-6 + i * 1.55, hem + (i % 2 ? -1 : 0.6)); c.lineTo(6.4, hem - 1.4); c.lineTo(-6, hem - 1); c.closePath(); }, P.cloth2, { sh: 0.3 }); }
    k.path(c => c.rect(-3.8 + l * 0.5, sh + 3.2, 7.8, 1.5), P.cloth2, { sh: 0.3 });
    k.poly([-4.4, sh + 3.6, -7.2, sh + 1.8, -7, sh + 6, -4.4, sh + 4.6], P.cloth2);
    head(k, hx, hy, r, P.skin, { tall: 0.96, jaw: 0.1 });
    eyes(k, hx, hy + 0.6, r, { iris: P.eye, big: 1.32, lash: true, nx: 0.46, dy: 0.12 });
    blush(k, hx, hy + 0.4, r, '#ff5aa0');
    mouth(k, hx - 0.4, hy - 0.4, r, 'smile');
    k.path(c => { c.moveTo(hx - r * 1, hy - r * 0.1); c.quadraticCurveTo(hx - r * 0.8, hy - r * 1.05, hx + r * 0.4, hy - r * 0.95); c.quadraticCurveTo(hx + r * 1.1, hy - r * 0.7, hx + r * 1, hy - r * 0.05); c.lineTo(hx + r * 0.6, hy - r * 0.35); c.lineTo(hx + r * 0.35, hy - r * 0.02); c.lineTo(hx + r * 0.05, hy - r * 0.42); c.lineTo(hx - r * 0.35, hy - r * 0.1); c.closePath(); }, P.hair, { sh: 0.5 });
    longEar(k, hx - 3.2, hy + 2, hx - 12.6, hy + 4.4 - S.sway * 0.4, 2.3, P.skin, mix(P.skin, '#ff90c0', 0.45));
    luluHat(k, P, parts, hx, hy, r, S);
    const top = luluStaff(k, P, parts, hand[0], hand[1], staffUp ? -1.25 : S.atk === 1 ? -0.7 : -1.45, S);
    arm(k, 1.8 + l, sh + 1.1, hand[0], hand[1], 2.8, 2.8, 1.1, 0.95, P.cloth, P.cloth, P.skin);
    if (S.cast >= 0 || S.splash) k.glow(top[0], top[1], S.splash ? 9 : 6, P.acc, 0.85);
  };
  function luluHat(k, P, parts, hx, hy, r, S) {
    const kind = parts.hat || 'witch', by = hy - r * 0.62, sw = S.sway * 0.8;
    if (kind === 'winter') {
      k.path(c => { c.moveTo(hx - r * 1.05, by + 0.4); c.quadraticCurveTo(hx - r * 0.9, by - r * 1.3, hx + 0.8, by - r * 1.45); c.quadraticCurveTo(hx - r * 0.2 - sw, by - r * 2.3, hx - r * 1.4 - sw, by - r * 2.1); c.quadraticCurveTo(hx + r * 0.9, by - r * 1.5, hx + r * 1.05, by + 0.4); c.closePath(); }, P.hat);
      k.path(c => c.rect(hx - r * 1.05, by - r * 0.5, r * 2.1, r * 0.22), P.hat2, { sh: 0.3 });
      for (let i = 0; i < 7; i++) k.circ(hx - r * 1.05 + i * r * 0.35, by + 0.3, r * 0.26, '#ffffff', { sh: 0.3 });
      k.circ(hx - r * 1.45 - sw, by - r * 2.1, r * 0.4, '#ffffff', { sh: 0.4 });
      return;
    }
    const col = P.hat, band = P.hat2;
    k.ell(hx + 0.2, by + 0.2, r * 1.42, r * 0.32, shade(col, 0.9), { sh: 0.5 });
    const tip = [hx - r * 1.5 - sw, by - r * 2.25];
    k.path(c => { c.moveTo(hx - r * 0.82, by); c.quadraticCurveTo(hx - r * 0.6, by - r * 1.3, hx + r * 0.1, by - r * 1.75); c.quadraticCurveTo(hx - r * 0.4, by - r * 2.3, tip[0], tip[1]); c.quadraticCurveTo(hx + r * 0.2, by - r * 1.95, hx + r * 0.72, by - r * 1.3); c.quadraticCurveTo(hx + r * 0.95, by - r * 0.4, hx + r * 0.92, by); c.closePath(); }, col);
    if (kind === 'candy' && k.px >= 1.6) for (let i = 0; i < 3; i++) k.line(hx - r * 0.7 + i * r * 0.5, by - r * 0.1, hx - r * 0.2 + i * r * 0.45, by - r * 1.3, P.hat2, 0.7);
    k.path(c => { c.moveTo(hx - r * 0.84, by - r * 0.08); c.lineTo(hx + r * 0.93, by - r * 0.08); c.lineTo(hx + r * 0.86, by - r * 0.42); c.lineTo(hx - r * 0.76, by - r * 0.42); c.closePath(); }, band, { sh: 0.3 });
    if (kind === 'wicked') { k.poly([hx + r * 1.2, by + 0.3, hx + r * 1.7, by + 1.4, hx + r * 1.1, by + 0.8], shade(col, 0.9)); k.poly([hx - r * 1.3, by + 0.3, hx - r * 1.8, by + 1.6, hx - r * 1.1, by + 0.9], shade(col, 0.9)); }
    if (kind === 'candy') { k.circ(tip[0], tip[1], 1.6, '#e02040', { sh: 0.4 }); k.line(tip[0], tip[1] - 1.4, tip[0] + 1, tip[1] - 3, '#3a8a2a', 0.5); }
    else if (kind === 'wicked') { k.glow(tip[0], tip[1], 3, P.acc, 0.6); k.circ(tip[0], tip[1], 0.9, P.acc); }
    else { k.circ(tip[0], tip[1], 1.2, P.acc, { sh: 0.3 }); }
  }
  function luluStaff(k, P, parts, x, y, a, S) {
    const kind = parts.staff || 'curl', len = 15;
    const tx = x + Math.cos(a) * len * 0.72, ty = y + Math.sin(a) * len * 0.72, bx = x - Math.cos(a) * len * 0.28, by = y - Math.sin(a) * len * 0.28;
    if (kind === 'lollipop') {
      k.seg(bx, by, tx, ty, 0.55, 0.55, P.staff, { sh: 0.2 });
      k.circ(tx, ty - 1.5, 3.4, '#ff6fa8');
      if (k.px >= 1.6) { const c = k.ctx; c.save(); c.strokeStyle = '#ffffff'; c.lineWidth = 0.9; c.beginPath(); for (let i = 0; i < 26; i++) { const t = i / 26 * TAU * 2.2, rr = 0.3 + i / 26 * 2.9; c.lineTo(tx + Math.cos(t) * rr, ty - 1.5 + Math.sin(t) * rr); } c.stroke(); c.restore(); }
      return [tx, ty - 1.5];
    }
    if (kind === 'snowflake') {
      k.seg(bx, by, tx, ty, 0.6, 0.5, P.staff, { sh: 0.2 });
      k.at(tx, ty - 1.6, 0, () => { for (let i = 0; i < 6; i++) { const aa = i * PI / 3; k.line(0, 0, Math.cos(aa) * 3.2, Math.sin(aa) * 3.2, '#e8f8ff', 0.8); k.line(Math.cos(aa) * 2, Math.sin(aa) * 2, Math.cos(aa + 0.5) * 2.8, Math.sin(aa + 0.5) * 2.8, '#bff0ff', 0.5); } k.circ(0, 0, 1, P.acc); });
      k.glow(tx, ty - 1.6, 4, '#bff0ff', 0.5);
      return [tx, ty - 1.6];
    }
    const wood = P.staff, curl = kind === 'thorn' ? shade(wood, 0.8) : wood;
    k.seg(bx, by, tx, ty, 0.62, 0.52, wood, { sh: 0.25 });
    k.path(c => { c.arc(tx - 1.2, ty - 1.6, 2.2, 0.4, PI * 1.7); c.arc(tx - 1.2, ty - 1.6, 1.2, PI * 1.7, 0.4, true); c.closePath(); }, curl, { sh: 0.2 });
    if (kind === 'thorn') for (let i = 1; i < 4; i++) { const t = i / 4, px = lerp(bx, tx, t), py = lerp(by, ty, t); k.poly([px, py, px - 1.4, py - 0.6, px - 0.2, py - 0.5], curl, { flat: true, noInk: true }); }
    k.circ(tx - 1.2, ty - 1.6, 1.1, P.acc, { sh: 0.25 });
    return [tx - 1.2, ty - 1.6];
  }

  C.teemo = (k, P, pose, parts) => {
    const B = { hip: 7.2, thigh: 3.7, shin: 3.8, torso: 7, hipW: 1.2, stride: 3.2, lift: 1.8, bobW: 0.8, splashStance: 2, splashLean: 0.8, splashCrouch: 0.8 };
    const S = skel(B, pose), l = S.lean, sh = S.shY;
    const hx = 1 + l, hy = sh - 6.8, r = 7.4;
    k.anchor.head = [hx, hy, r];
    roundEar(k, hx - 3.4, hy - 1.6, hx - 12.4, hy - 5.8 - S.sway * 0.5, 3.4, shade(P.skin, 0.84), shade(P.skin2, 0.8));
    k.path(c => c.rect(-4.4 + l * 0.5, sh + 0.6, 3, 4.4), P.cloth2, { sh: 0.4 });
    const shoot = S.atk >= 0 || S.cast >= 0 || S.splash;
    const hand = shoot ? [3.6 + l, hy + 3.2] : [3.4 + l, sh + 4.6 + S.sway * 0.4];
    arm(k, -1.4 + l, sh + 1, shoot ? hand[0] - 2.2 : -2.6 + l - S.sway * 0.8, shoot ? hand[1] + 0.6 : sh + 5.2, 2.5, 2.5, 1, 0.9, shade(P.cloth, 0.85), shade(P.cloth, 0.85), shade(P.skin, 0.88));
    const [lb, lf] = S.legs;
    leg(k, lb, { far: true, r0: 1.4, r1: 1.15, r2: 1.1, thigh: P.cloth, shin: P.skin, boot: P.boot, bootH: 2.4, bootL: 2.2 });
    leg(k, lf, { r0: 1.4, r1: 1.15, r2: 1.1, thigh: P.cloth, shin: P.skin, boot: P.boot, bootH: 2.4, bootL: 2.2 });
    torso(k, S, { sw: 2.6, ww: 2.4, hw: 3, col: P.cloth, drop: 1.4 });
    if (parts.hat === 'bubble') k.path(c => c.rect(-1.5 + l, sh + 1, 3.4, 3.4), P.cloth2, { sh: 0.4 });
    k.path(c => c.rect(-3.2 + l * 0.4, S.hipY - 0.9, 6.6, 1.3), P.cloth2, { sh: 0.3 });
    if (k.px >= 1.6) k.path(c => c.rect(0.4 + l * 0.4, S.hipY - 1.1, 1.4, 1.7), '#e8c050', { sh: 0.2 });
    head(k, hx, hy, r, P.skin, { tall: 0.94, jaw: 0.12 });
    k.ell(hx + r * 0.55, hy + r * 0.42, r * 0.46, r * 0.32, P.skin2, { sh: 0.3 });
    k.ell(hx + r * 0.98, hy + r * 0.22, r * 0.14, r * 0.11, '#2a1a14', { sh: 0.1 });
    eyes(k, hx, hy - 0.4, r, { iris: P.eye, big: 1.28, nx: 0.42, fx: -0.06, dy: 0.02, white: '#fbf8f4' });
    mouth(k, hx + 0.6, hy - 0.2, r, 'smile', '#5a2a1a');
    roundEar(k, hx - 3.2, hy + 2.4, hx - 12.6, hy + 4.6 - S.sway * 0.4, 3.6, P.skin, P.skin2);
    teemoHat(k, P, parts, hx, hy, r, S);
    if (parts.gun === 'ray') {
      k.at(hand[0], hand[1], shoot ? -0.08 : 0.9, () => { k.path(c => c.rect(-1, -1.2, 6, 2.4), P.gun); k.circ(5.4, 0, 1.4, P.acc); k.path(c => c.rect(-0.4, 0.8, 1.2, 2), P.gun, { sh: 0.2 }); });
      if (S.atk === 1 || S.splash) k.glow(hand[0] + 6, hand[1], 4, P.acc, 0.8);
    } else {
      k.at(hand[0], hand[1], shoot ? -0.12 : 1.05, () => { k.seg(-5, 0, 9, 0, 0.62, 0.55, P.gun, { sh: 0.2 }); if (k.px >= 1.6) { k.path(c => c.rect(-0.8, -0.72, 0.9, 1.44), P.cloth2, { sh: 0.1 }); k.path(c => c.rect(4.6, -0.7, 0.8, 1.4), P.cloth2, { sh: 0.1 }); } });
      if (S.atk === 1) k.glow(hand[0] + 9, hand[1] - 1, 3.2, '#c0ff60', 0.7);
    }
    arm(k, 2 + l, sh + 1.1, hand[0], hand[1] + (shoot ? 0.4 : 0), 2.6, 2.6, 1.05, 0.95, P.cloth, P.cloth, P.skin);
  };
  function teemoHat(k, P, parts, hx, hy, r, S) {
    const kind = parts.hat || 'scout', by = hy - r * 0.55;
    if (kind === 'bubble') {
      k.path(c => { c.arc(hx, hy, r * 1.32, 0, TAU); c.arc(hx, hy, r * 1.2, 0, TAU, true); }, P.hat, { sh: 0.3 });
      k.path(c => c.rect(hx - r * 1.1, hy + r * 1.05, r * 2.2, r * 0.36), P.hat2, { sh: 0.3 });
      k.line(hx - r * 0.5, hy - r * 1.3, hx - r * 0.9, hy - r * 2.1, P.hat, 0.5); k.circ(hx - r * 0.9, hy - r * 2.1, 0.9, P.acc);
      k.tint(c => c.arc(hx, hy, r * 1.22, 0, TAU), '#9ad8ff', 0.22);
      k.tint(c => c.ellipse(hx - r * 0.45, hy - r * 0.6, r * 0.35, r * 0.2, -0.6, 0, TAU), '#ffffff', 0.55);
      return;
    }
    if (kind === 'badger') {
      k.path(c => { c.moveTo(hx - r * 1.05, by + r * 0.5); c.quadraticCurveTo(hx - r * 1.05, hy - r * 1.3, hx + 0.4, hy - r * 1.22); c.quadraticCurveTo(hx + r * 1.08, hy - r * 1.1, hx + r * 1.02, by + r * 0.3); c.lineTo(hx + r * 0.6, by + r * 0.1); c.quadraticCurveTo(hx, by - r * 0.1, hx - r * 0.7, by + r * 0.5); c.closePath(); }, P.hat);
      k.path(c => { c.moveTo(hx + r * 0.4, hy - r * 1.24); c.quadraticCurveTo(hx + r * 0.2, by - r * 0.1, hx + r * 0.62, by + r * 0.12); c.lineTo(hx + r * 0.9, by + r * 0.05); c.quadraticCurveTo(hx + r * 0.7, hy - r * 0.9, hx + r * 0.72, hy - r * 1.16); c.closePath(); }, P.hat2, { sh: 0.3 });
      k.circ(hx - r * 0.55, hy - r * 1.05, r * 0.28, P.hat, { sh: 0.3 }); k.circ(hx + r * 0.62, hy - r * 1.02, r * 0.24, P.hat, { sh: 0.3 });
      return;
    }
    if (kind === 'helmet') {
      k.path(c => { c.moveTo(hx - r * 1.12, by + r * 0.35); c.quadraticCurveTo(hx - r * 1.1, hy - r * 1.45, hx + 0.2, hy - r * 1.4); c.quadraticCurveTo(hx + r * 1.15, hy - r * 1.3, hx + r * 1.14, by + r * 0.35); c.closePath(); }, P.hat);
      if (k.px >= 1.6) for (const [dx, dy, rr] of [[-0.5, -0.9, 0.22], [0.3, -1.05, 0.18], [0.7, -0.6, 0.16], [-0.2, -0.45, 0.14]]) k.ell(hx + r * dx, hy + r * dy, r * rr, r * rr * 0.7, P.hat2, { flat: true, noInk: true });
      k.path(c => c.rect(hx - r * 1.16, by + r * 0.22, r * 2.32, r * 0.24), P.acc, { sh: 0.2 });
      k.circ(hx + r * 0.1, by - r * 0.2, r * 0.26, P.acc, { sh: 0.2 }); k.circ(hx + r * 0.62, by - r * 0.2, r * 0.26, P.acc, { sh: 0.2 });
      if (k.px >= 1.6) { k.dot(hx + r * 0.1, by - r * 0.2, r * 0.15, P.lens); k.dot(hx + r * 0.62, by - r * 0.2, r * 0.15, P.lens); }
      return;
    }
    k.ell(hx, by + r * 0.08, r * 1.36, r * 0.34, P.hat2, { sh: 0.5 });
    k.path(c => { c.moveTo(hx - r * 0.9, by); c.quadraticCurveTo(hx - r * 0.8, hy - r * 1.55, hx + r * 0.1, hy - r * 1.5); c.quadraticCurveTo(hx + r * 0.95, hy - r * 1.45, hx + r * 0.88, by); c.closePath(); }, P.hat);
    k.path(c => c.rect(hx - r * 0.9, by - r * 0.36, r * 1.8, r * 0.28), shade(P.hat, 0.7), { sh: 0.2 });
    k.path(c => { c.moveTo(hx - r * 0.5, by - r * 0.3); c.quadraticCurveTo(hx - r * 1.5, hy - r * 2 - S.sway * 0.4, hx - r * 2.1, hy - r * 1.6 - S.sway * 0.6); c.quadraticCurveTo(hx - r * 1.2, hy - r * 1.35, hx - r * 0.3, by - r * 0.12); c.closePath(); }, P.acc, { sh: 0.3 });
    if (k.px >= 1.6) { k.circ(hx + r * 0.25, by - r * 0.25, r * 0.2, '#3a3a30', { sh: 0.1 }); k.circ(hx + r * 0.66, by - r * 0.25, r * 0.2, '#3a3a30', { sh: 0.1 }); if (k.hi) { k.dot(hx + r * 0.25, by - r * 0.25, r * 0.12, '#80e0ff'); k.dot(hx + r * 0.66, by - r * 0.25, r * 0.12, '#80e0ff'); } }
  }

  C.annie = (k, P, pose, parts) => {
    const B = { hip: 9.6, thigh: 4.7, shin: 5, torso: 8.2, hipW: 1.1, stride: 3.4, lift: 1.9, bobW: 0.8, splashStance: 2, splashLean: 0.4, splashCrouch: 0.5 };
    const S = skel(B, pose), l = S.lean, sh = S.shY;
    const hx = 0.8 + l, hy = sh - 5.5, r = 6;
    k.anchor.head = [hx, hy, r];
    if (parts.hood) k.path(c => { c.moveTo(hx - r * 0.9, hy - r * 0.6); c.quadraticCurveTo(hx - r * 2.4 - S.sway, sh + 6, hx - r * 1.4 - S.sway * 1.5, S.hipY + 1); c.lineTo(3, S.hipY - 1); c.lineTo(hx + r * 0.3, hy); c.closePath(); }, shade(P.hood, 0.85));
    else k.path(c => { c.moveTo(-5.2 + l, sh + 0.6); c.quadraticCurveTo(-6.6 + l, sh + 3.6, -4.8 + l, sh + 6.6); c.lineTo(-1.2 + l, sh + 6); c.lineTo(-1.4 + l, sh + 0.4); c.closePath(); }, P.bag);
    const fire = S.cast >= 0 || S.splash || S.atk >= 0;
    const fh = S.cast >= 0 || S.splash ? [4.6 + l, sh - 3.4] : S.atk >= 0 ? [[1.8, sh + 0.6], [6.4, sh + 1.4], [4.8, sh + 2.6]][S.atk] : [3 + l, sh + 5.4 + S.sway * 0.3];
    arm(k, -1.4 + l, sh + 1, 2.6 + l, sh + 5.2, 2.9, 2.8, 1, 0.85, shade(P.skin, 0.88), shade(P.skin, 0.88), shade(P.skin, 0.88));
    const [lb, lf] = S.legs;
    leg(k, lb, { far: true, r0: 1.25, r1: 1, r2: 0.95, thigh: P.legs, shin: P.legs, boot: P.shoes, bootH: 1.6, bootL: 2 });
    leg(k, lf, { r0: 1.25, r1: 1, r2: 0.95, thigh: P.legs, shin: P.legs, boot: P.shoes, bootH: 1.6, bootL: 2 });
    const hem = S.hipY + 3;
    k.path(c => { c.moveTo(-2.2 + l, sh); c.lineTo(2.4 + l, sh); c.quadraticCurveTo(3.8, sh + 5, 5.6, hem); c.lineTo(-5.2, hem + 0.3); c.quadraticCurveTo(-3.8, sh + 5, -2.2 + l, sh); c.closePath(); }, P.cloth);
    if (k.px >= 1.6) { k.path(c => { c.moveTo(-5.2, hem + 0.3); c.lineTo(5.6, hem); c.lineTo(5.3, hem - 1.1); c.lineTo(-5, hem - 0.8); c.closePath(); }, P.cloth2, { sh: 0.3 }); }
    k.path(c => { c.moveTo(-2.6 + l, sh - 0.2); c.lineTo(2.8 + l, sh - 0.2); c.lineTo(1.6 + l, sh + 2.2); c.lineTo(0.2 + l, sh + 1.2); c.lineTo(-1.2 + l, sh + 2.2); c.closePath(); }, P.cloth2, { sh: 0.3 });
    if (parts.hood && k.px >= 1.6) k.path(c => { c.moveTo(-1.8, sh + 3); c.lineTo(3.2, sh + 3); c.lineTo(4.2, hem - 1.2); c.lineTo(-2.4, hem - 1); c.closePath(); }, '#f4f0e8', { sh: 0.3 });
    head(k, hx, hy, r, P.skin, { tall: 0.98, jaw: 0.15 });
    eyes(k, hx, hy + 0.3, r, { iris: P.eye, big: 1.25, lash: true, nx: 0.46, dy: 0.12 });
    blush(k, hx, hy + 0.2, r, '#ff5060');
    mouth(k, hx - 0.2, hy - 0.2, r, fire ? 'open' : 'smile');
    if (parts.hood) {
      k.path(c => { c.arc(hx - 0.3, hy - 0.2, r * 1.32, PI * 0.62, PI * 2.08); c.quadraticCurveTo(hx + r * 1.05, hy + r * 0.6, hx + r * 0.7, hy + r * 1.1); c.arc(hx, hy, r * 1.02, PI * 0.32, PI * 1.62, true); c.closePath(); }, P.hood);
    } else {
      k.path(c => { c.moveTo(hx - r * 1.1, hy + r * 0.9); c.quadraticCurveTo(hx - r * 1.35, hy - r * 1.2, hx + r * 0.2, hy - r * 1.15); c.quadraticCurveTo(hx + r * 1.2, hy - r * 1.05, hx + r * 1.08, hy - r * 0.1); c.lineTo(hx + r * 0.72, hy - r * 0.4); c.lineTo(hx + r * 0.5, hy - r * 0.05); c.lineTo(hx + r * 0.18, hy - r * 0.45); c.lineTo(hx - r * 0.2, hy - r * 0.05); c.lineTo(hx - r * 0.4, hy + r * 0.9); c.closePath(); }, P.hair, { sh: 0.5 });
      k.path(c => { c.moveTo(hx - r * 0.2, hy - r * 1.05); c.lineTo(hx - r * 1.1, hy - r * 1.6); c.lineTo(hx - r * 0.9, hy - r * 0.8); c.lineTo(hx + r * 0.1, hy - r * 1.3); c.lineTo(hx + r * 0.2, hy - r * 2); c.lineTo(hx + r * 0.7, hy - r * 1.2); c.closePath(); }, P.bow, { sh: 0.3 });
      if (parts.tiara) { k.path(c => { c.moveTo(hx - r * 0.5, hy - r * 1.02); c.lineTo(hx - r * 0.2, hy - r * 1.55); c.lineTo(hx + 0.1, hy - r * 1.15); c.lineTo(hx + r * 0.35, hy - r * 1.75); c.lineTo(hx + r * 0.6, hy - r * 1.1); c.closePath(); }, '#e8f8ff', { sh: 0.2 }); k.glow(hx + r * 0.35, hy - r * 1.6, 2.6, '#80e0ff', 0.5); }
    }
    tibbersDoll(k, P, parts, 2.6 + l, sh + 5.6 + S.sway * 0.2);
    arm(k, 1.8 + l, sh + 1.1, fh[0], fh[1], 2.9, 2.9, 1.05, 0.9, P.skin, P.skin, P.skin);
    if (fire) { const col = P.fire || '#ff7a20'; k.circ(fh[0] + 0.8, fh[1] - 1.2, S.splash ? 2.2 : 1.4, mix(col, '#ffe080', 0.5), { flat: true, noInk: true }); k.glow(fh[0] + 0.8, fh[1] - 1.4, S.splash ? 10 : 5, col, 0.9); }
  };
  function tibbersDoll(k, P, parts, x, y) {
    const b = P.bear, b2 = P.bear2, kind = parts.bear || 'bear';
    if (kind === 'wolf') {
      k.ell(x, y + 0.6, 2.1, 2.6, b, { sh: 0.3 }); k.ell(x + 0.4, y - 2.4, 1.9, 1.6, b, { sh: 0.3 });
      k.poly([x + 1.4, y - 2.8, x + 3.6, y - 2, x + 1.6, y - 1.6], b2); k.poly([x - 0.8, y - 3.6, x - 0.4, y - 5.4, x + 0.4, y - 3.8], b); k.poly([x + 0.6, y - 3.6, x + 1.4, y - 5.2, x + 1.6, y - 3.4], b);
      if (k.px >= 1.6) k.dot(x + 0.9, y - 2.8, 0.3, '#ffe040');
      return;
    }
    k.ell(x, y + 0.8, 2.2, 2.6, b, { sh: 0.3 });
    k.ell(x + 0.2, y + 1, 1.2, 1.5, b2, { sh: 0.2 });
    k.circ(x + 0.2, y - 2.3, 1.9, b, { sh: 0.3 });
    k.circ(x - 1.3, y - 3.9, 0.8, b, { sh: 0.2 }); k.circ(x + 1.6, y - 3.8, 0.8, b, { sh: 0.2 });
    k.ell(x + 0.9, y - 1.9, 0.8, 0.6, b2, { sh: 0.1 });
    if (k.px >= 1.6) { k.dot(x + 1.1, y - 2.8, 0.34, '#101010'); k.line(x - 0.6, y - 3.1, x + 0.1, y - 2.5, '#101010', 0.25); k.line(x - 0.6, y - 2.5, x + 0.1, y - 3.1, '#101010', 0.25); }
    if (kind === 'ice') k.glow(x, y - 1, 3, '#80e0ff', 0.35);
  }

  C.ashe = (k, P, pose, parts) => {
    const B = { hip: 16.6, thigh: 8.3, shin: 8.6, torso: 11, hipW: 1.2, stride: 4.4, lift: 2.2, bobW: 0.8, splashStance: 3.6, splashLean: 0.4 };
    const S = skel(B, pose), l = S.lean, sh = S.shY;
    const hx = 0.7 + l, hy = sh - 5.8, r = 4.9;
    k.anchor.head = [hx, hy, r];
    const draw = S.atk >= 0 || S.cast >= 0 || S.splash;
    k.path(c => { c.moveTo(-2.6 + l, sh - 0.6); c.quadraticCurveTo(-6 - S.sway, sh + 10, -7.5 - S.sway * 1.8, S.hipY + 9); c.lineTo(-0.5, S.hipY + 7.6); c.lineTo(1.6 + l, sh + 1); c.closePath(); }, P.hood2 || shade(P.hood, 0.8));
    const bowH = draw ? [8.6 + l, sh + 1.6] : [5.6 + l, S.hipY - 1.4 + S.sway * 0.3];
    arm(k, -1.4 + l, sh + 1.2, bowH[0], bowH[1], 5, 5, 1.1, 0.95, shade(P.cloth, 0.8), shade(P.cloth2, 0.85), shade(P.skin, 0.88));
    const [lb, lf] = S.legs;
    leg(k, lb, { far: true, r0: 1.8, r1: 1.2, r2: 1.05, thigh: P.legs, shin: P.legs, boot: P.boots, bootH: 4.6, knee: P.cloth2 });
    leg(k, lf, { r0: 1.8, r1: 1.2, r2: 1.05, thigh: P.legs, shin: P.legs, boot: P.boots, bootH: 4.6, knee: P.cloth2 });
    k.path(c => { c.moveTo(-2.4, S.hipY - 1.4); c.lineTo(2.8, S.hipY - 1.4); c.lineTo(4 + S.sway * 0.3, S.hipY + 5.4); c.lineTo(1.2, S.hipY + 4.4); c.lineTo(-0.4, S.hipY + 6); c.lineTo(-3.6 - S.sway * 0.3, S.hipY + 4.8); c.closePath(); }, P.cloth);
    torso(k, S, { sw: 2.5, ww: 1.4, hw: 2.4, col: P.cloth, drop: 0 });
    k.path(c => { c.moveTo(-0.2 + l, sh); c.lineTo(1.8 + l, sh); c.lineTo(0.9 + l * 0.6, S.hipY - 1.2); c.closePath(); }, P.cloth2, { sh: 0.3 });
    k.path(c => c.rect(-2.4, S.hipY - 2.2, 5.2, 1.1), P.acc2 || shade(P.cloth2, 0.8), { sh: 0.25 });
    if (!parts.crown) k.path(c => { c.arc(hx - 0.8, hy + 0.2, r * 1.45, PI * 0.55, PI * 2.02); c.lineTo(hx + r * 0.6, hy + r * 1.4); c.lineTo(hx - r * 1.2, hy + r * 1.6); c.closePath(); }, P.hood);
    k.seg(0.3 + l, sh, 0.5 + l, sh - 1.4, 0.95, 0.9, shade(P.skin, 0.9));
    head(k, hx, hy, r, P.skin, { jaw: 0.42 });
    eyes(k, hx, hy, r, { iris: P.eye, big: 1.02, lash: true, brow: shade(P.hair, 0.72) });
    nose(k, hx, hy, r, shade(P.skin, 0.72));
    mouth(k, hx, hy, r, 'flat', '#a04a4a');
    k.path(c => { c.moveTo(hx - r * 1, hy + r * 1.5); c.quadraticCurveTo(hx - r * 1.3, hy - r * 1.1, hx + r * 0.3, hy - r * 1.05); c.quadraticCurveTo(hx + r * 1.1, hy - r * 0.9, hx + r * 1.02, hy - r * 0.1); c.lineTo(hx + r * 0.6, hy - r * 0.55); c.quadraticCurveTo(hx, hy - r * 0.35, hx - r * 0.35, hy + r * 0.2); c.lineTo(hx - r * 0.3, hy + r * 1.7); c.closePath(); }, P.hair, { sh: 0.45 });
    if (parts.crown) { k.path(c => { c.moveTo(hx - r * 0.8, hy - r * 0.7); c.lineTo(hx - r * 0.7, hy - r * 1.55); c.lineTo(hx - r * 0.3, hy - r * 1.05); c.lineTo(hx + 0.1, hy - r * 1.8); c.lineTo(hx + r * 0.45, hy - r * 1.05); c.lineTo(hx + r * 0.85, hy - r * 1.5); c.lineTo(hx + r * 0.85, hy - r * 0.62); c.closePath(); }, P.acc, { sh: 0.25 }); k.dot(hx + 0.1, hy - r * 1.05, 0.5, '#e03060'); }
    else {
      k.path(c => { c.arc(hx - 0.6, hy - 0.2, r * 1.38, PI * 1.05, PI * 1.92); c.quadraticCurveTo(hx + r * 1.2, hy - r * 0.4, hx + r * 0.95, hy - r * 0.55); c.arc(hx - 0.2, hy + 0.2, r * 1.05, PI * 1.85, PI * 1.08, true); c.closePath(); }, P.hood);
      if (parts.fur) for (let i = 0; i < 7; i++) { const a = PI * 1.05 + i * 0.14; k.circ(hx - 0.6 + Math.cos(a) * r * 1.38, hy - 0.2 + Math.sin(a) * r * 1.38, 1.1, P.fur, { sh: 0.3 }); }
    }
    const bow = parts.bow || 'ice';
    k.at(bowH[0], bowH[1], draw ? 0 : -0.25, () => {
      const col = P.bow, h = 11;
      k.path(c => { c.moveTo(-0.6, -h); c.quadraticCurveTo(3.4, -h * 0.55, 1.2, -1.2); c.quadraticCurveTo(1.6, 0, 1.2, 1.2); c.quadraticCurveTo(3.4, h * 0.55, -0.6, h); c.quadraticCurveTo(2.2, h * 0.5, 0.2, 1.1); c.lineTo(0.2, -1.1); c.quadraticCurveTo(2.2, -h * 0.5, -0.6, -h); c.closePath(); }, col, { sh: 0.3 });
      if (bow === 'royal' || bow === 'ice') { k.poly([-0.6, -h, -1.8, -h - 1.4, 0.2, -h + 0.6], P.acc, { sh: 0.2 }); k.poly([-0.6, h, -1.8, h + 1.4, 0.2, h - 0.6], P.acc, { sh: 0.2 }); }
      k.path(c => c.rect(0.2, -1.4, 1.4, 2.8), P.grip || '#6a4a2a', { sh: 0.2 });
      const sx = draw ? -7.2 : -0.5;
      k.curve([-0.6, -h, sx, 0, -0.6, h], P.string, 0.3);
      if (draw) {
        k.line(sx, 0, 4.4, 0, P.arrow || '#c8f0ff', 0.55);
        k.poly([4.4, -0.9, 6.4, 0, 4.4, 0.9], P.arrow || '#c8f0ff', { flat: true, noInk: true });
        if (bow === 'ice' || S.splash) k.glow(4.6, 0, S.splash ? 6 : 3.4, P.arrowGlow || '#a0e8ff', 0.7);
      }
    });
    const fh = draw ? [bowH[0] - 7.2, bowH[1]] : [2.8 + l, S.hipY - 2 - S.sway * 0.3];
    arm(k, 2 + l, sh + 1.2, fh[0], fh[1], 5, 5, 1.2, 1, P.cloth, P.cloth2, P.skin);
  };

  C.garen = (k, P, pose, parts) => {
    const B = { hip: 16.8, thigh: 8.2, shin: 8.8, torso: 12, hipW: 1.9, stride: 4.6, lift: 2.2, bobW: 1, splashStance: 4.2, splashLean: 0.6, splashCrouch: 1.8 };
    const S = skel(B, pose), l = S.lean, sh = S.shY, armor = P.armor, armor2 = P.armor2, commando = parts.body === 'vest';
    const hx = 0.9 + l, hy = sh - 5.6, r = 5;
    k.anchor.head = [hx, hy, r];
    if (P.cape) k.path(c => { c.moveTo(-3.6 + l, sh); c.quadraticCurveTo(-8 - S.sway * 1.2, sh + 12, -9.4 - S.sway * 2, -1.5); c.lineTo(-2, -2.6); c.lineTo(2 + l, sh + 2); c.closePath(); }, P.cape);
    const swing = S.atk >= 0 ? [-2.5, 0.35, -0.4][S.atk] : S.cast >= 0 ? [-1.9, -1.6][S.cast] : S.splash ? -1.2 : -2.2;
    const hand = S.atk >= 0 ? [[0.4, sh - 3.2], [6.8, sh + 2.6], [5.6, sh + 3]][S.atk] : S.cast >= 0 ? [3 + l, sh - 5.2] : S.splash ? [5.4 + l, sh - 4.4] : [4 + l, sh + 3.4 + S.sway * 0.3];
    arm(k, -2.6 + l, sh + 1.4, hand[0] - 1.6, hand[1] + 1, 5, 5, 1.6, 1.3, shade(commando ? P.skin : armor2, 0.9), shade(commando ? P.skin : armor, 0.85), shade(commando ? P.skin : armor, 0.8));
    const [lb, lf] = S.legs;
    const legO = { r0: 2.3, r1: 1.7, r2: 1.5, thigh: commando ? P.armor : armor2, shin: commando ? P.armor : armor, knee: commando ? null : armor, boot: commando ? '#2a2420' : shade(armor, 0.9), bootH: commando ? 4.2 : 3.4, bootL: 2.8 };
    leg(k, lb, Object.assign({ far: true }, legO)); leg(k, lf, legO);
    if (!commando) k.path(c => { c.moveTo(-1.4 + l * 0.4, S.hipY - 2); c.lineTo(3 + l * 0.4, S.hipY - 2); c.lineTo(2.6 + S.sway * 0.4, S.hipY + 7.4); c.lineTo(-0.8 + S.sway * 0.4, S.hipY + 7.6); c.closePath(); }, P.cloth2);
    torso(k, S, { sw: 3.8, ww: 2.8, hw: 3.1, col: armor, drop: 0.4, chest: 0.6 });
    if (commando) {
      k.path(c => { c.moveTo(-3.2 + l, sh + 1.4); c.lineTo(3.6 + l, sh + 1.4); c.lineTo(3.2, S.hipY - 0.6); c.lineTo(-3, S.hipY - 0.6); c.closePath(); }, P.cloth2);
      if (k.px >= 1.6) for (let i = 0; i < 3; i++) k.path(c => c.rect(-2.4 + i * 1.9 + l * 0.7, sh + 4.4, 1.5, 1.9), shade(P.cloth2, 0.8), { sh: 0.2 });
      if (k.hi) k.curve([-0.2 + l, sh + 0.2, 1 + l, sh + 3, 2.2 + l, sh + 0.2], '#c0c0c8', 0.25);
    } else {
      k.path(c => { c.moveTo(-1.2 + l, sh + 0.8); c.lineTo(3.2 + l, sh + 0.8); c.lineTo(2.8 + l * 0.5, S.hipY - 1); c.lineTo(-1 + l * 0.5, S.hipY - 1); c.closePath(); }, P.cloth2);
      if (k.px >= 1.6) k.path(c => { c.moveTo(1 + l * 0.8, sh + 2.4); c.lineTo(2.4 + l * 0.8, sh + 3.6); c.lineTo(1 + l * 0.8, sh + 6.2); c.lineTo(-0.4 + l * 0.8, sh + 3.6); c.closePath(); }, P.trim, { sh: 0.25 });
    }
    k.path(c => c.rect(-3.2, S.hipY - 2.2, 6.6 + l * 0.4, 1.4), commando ? '#3a3024' : P.trim, { sh: 0.3 });
    garenPauldron(k, P, parts, -3.3 + l, sh + 0.6, true);
    k.seg(0.4 + l, sh + 0.2, 0.7 + l, sh - 1.6, 1.3, 1.25, shade(P.skin, 0.9));
    head(k, hx, hy, r, P.skin, { jaw: 0.95 });
    if (parts.head !== 'helm') ear(k, hx, hy, r, P.skin);
    if (parts.head === 'helm') {
      k.path(c => { c.arc(hx, hy - 0.2, r * 1.14, PI * 0.72, PI * 2.25); c.lineTo(hx + r * 1.15, hy + r * 1.05); c.lineTo(hx - r * 0.8, hy + r * 1.15); c.closePath(); }, armor);
      k.poly([hx - r * 0.5, hy - r * 0.9, hx - r * 1.6, hy - r * 2.1, hx - r * 0.1, hy - r * 1.2], P.trim);
      k.poly([hx + r * 0.3, hy - r * 1.05, hx + r * 0.2, hy - r * 2.3, hx + r * 0.85, hy - r * 1.0], P.trim);
      k.path(c => c.rect(hx + r * 0.05, hy - r * 0.05, r * 1.05, r * 0.2), '#0a0608', { flat: true, noInk: true });
      eyes(k, hx, hy - r * 0.12, r, { glow: P.eye, big: 0.8 });
    } else {
      eyes(k, hx, hy, r, { iris: P.eye, brow: shade(P.hair, 0.7), browW: 1.4, angry: true });
      nose(k, hx, hy, r, shade(P.skin, 0.7));
      mouth(k, hx, hy, r, 'flat', '#8a4a3a');
      k.path(c => { c.moveTo(hx - r * 1.02, hy + r * 0.3); c.quadraticCurveTo(hx - r * 1.2, hy - r * 1.1, hx + r * 0.2, hy - r * 1.12); c.lineTo(hx + r * 0.5, hy - r * 1.45); c.lineTo(hx + r * 0.7, hy - r * 1.02); c.quadraticCurveTo(hx + r * 1.1, hy - r * 0.8, hx + r * 1.02, hy - r * 0.35); c.lineTo(hx + r * 0.5, hy - r * 0.62); c.lineTo(hx - r * 0.1, hy - r * 0.55); c.lineTo(hx - r * 0.45, hy + r * 0.15); c.closePath(); }, P.hair, { sh: 0.45 });
      if (parts.head === 'beret') { k.path(c => { c.moveTo(hx - r * 1.1, hy - r * 0.55); c.quadraticCurveTo(hx - r * 0.6, hy - r * 1.6, hx + r * 0.5, hy - r * 1.3); c.quadraticCurveTo(hx + r * 1.2, hy - r * 1.05, hx + r * 0.9, hy - r * 0.62); c.closePath(); }, P.band, { sh: 0.4 }); k.dot(hx + r * 0.55, hy - r * 0.92, 0.6, '#e8c050'); }
    }
    garenSword(k, P, parts, hand[0], hand[1], swing, S);
    arm(k, 2.6 + l, sh + 1.4, hand[0], hand[1], 5, 5, 1.7, 1.4, commando ? P.skin : armor2, commando ? P.skin : armor, commando ? P.skin : armor);
    garenPauldron(k, P, parts, 3 + l, sh + 0.6, false);
  };
  function garenPauldron(k, P, parts, x, y, far) {
    if (parts.body === 'vest') return;
    const col = far ? shade(P.armor, 0.85) : P.armor;
    k.path(c => { c.moveTo(x - 3.4, y + 2.4); c.quadraticCurveTo(x - 3, y - 2.8, x + 0.6, y - 2.6); c.quadraticCurveTo(x + 3.8, y - 2, x + 3.4, y + 2.6); c.closePath(); }, col, { sh: 0.6 });
    k.path(c => { c.moveTo(x - 3.4, y + 2.4); c.lineTo(x + 3.4, y + 2.6); c.lineTo(x + 3.2, y + 1.5); c.lineTo(x - 3.2, y + 1.3); c.closePath(); }, far ? shade(P.trim, 0.85) : P.trim, { sh: 0.2 });
    if (parts.body === 'spikes') { k.poly([x - 1.4, y - 2.4, x - 2.6, y - 6, x - 0.2, y - 2.6], P.trim); k.poly([x + 1, y - 2.4, x + 1.6, y - 5.4, x + 2.4, y - 2], P.trim); }
  }
  function garenSword(k, P, parts, x, y, a, S) {
    const kind = parts.blade || 'great';
    k.at(x, y, a, () => {
      if (kind === 'knife') {
        k.path(c => { c.moveTo(1.6, -1.3); c.lineTo(12.5, -1.6); c.quadraticCurveTo(15.6, -0.8, 16.4, 1.2); c.lineTo(1.6, 1.3); c.closePath(); }, P.blade);
        if (k.px >= 1.6) for (let i = 0; i < 5; i++) k.poly([3.4 + i * 1.8, -1.4, 4.3 + i * 1.8, -2.3, 5.2 + i * 1.8, -1.45], P.blade, { flat: true, noInk: true });
        k.path(c => c.rect(-3.8, -1, 5.6, 2), '#2a2420', { sh: 0.3 });
        k.path(c => c.rect(1.2, -2.2, 1, 4.4), '#4a4a50', { sh: 0.2 });
        return;
      }
      const len = kind === 'dread' ? 24 : 23, w = kind === 'dread' ? 1.9 : 1.6;
      k.path(c => { c.moveTo(2.4, -w); c.lineTo(len - 2.6, -w * 0.95); c.lineTo(len, 0); c.lineTo(len - 2.6, w * 0.95); c.lineTo(2.4, w); c.closePath(); }, P.blade);
      if (k.px >= 1.6) k.line(3.6, 0, len - 3.4, 0, P.edge, kind === 'dread' ? 0.5 : 0.35);
      if (kind === 'dread') { for (let i = 0; i < 3; i++) k.poly([6 + i * 5, -w, 7.6 + i * 5, -w - 1.6, 8.4 + i * 5, -w], P.blade); k.glow(len * 0.6, 0, 7, P.edge, 0.45); }
      k.path(c => { c.moveTo(1.6, -4); c.quadraticCurveTo(2.9, -1, 2.4, 0); c.quadraticCurveTo(2.9, 1, 1.6, 4); c.lineTo(3, 4); c.quadraticCurveTo(3.4, 1, 3.3, 0); c.quadraticCurveTo(3.4, -1, 3, -4); c.closePath(); }, P.trim, { sh: 0.25 });
      k.path(c => c.rect(-3.6, -0.7, 5.4, 1.4), P.hilt || '#5a3a20', { sh: 0.25 });
      k.circ(-4, 0, 1, P.trim, { sh: 0.2 });
    });
    if (S.cast >= 0) k.glow(x, y - 12, 8, '#ffe8a0', 0.6);
  }

  C.masteryi = (k, P, pose, parts) => {
    const B = { hip: 16, thigh: 8, shin: 8.4, torso: 11, hipW: 1.4, stride: 5, lift: 2.4, bobW: 0.9, splashStance: 5, splashLean: 1.6, splashCrouch: 3 };
    const S = skel(B, pose), l = S.lean, sh = S.shY, armored = parts.body === 'armor';
    const hx = 1 + l, hy = sh - 5.5, r = 4.9;
    k.anchor.head = [hx, hy, r];
    k.path(c => { c.moveTo(hx - r * 0.6, hy - r * 0.9); c.quadraticCurveTo(hx - r * 2.2, hy - r * 1.2 - S.sway, hx - r * 3.2 - S.sway, hy + r * 0.3); c.quadraticCurveTo(hx - r * 1.9, hy - r * 0.1, hx - r * 0.8, hy - r * 0.2); c.closePath(); }, P.hair, { sh: 0.4 });
    k.path(c => { c.moveTo(-2.4, S.hipY - 1.6); c.quadraticCurveTo(-6 - S.sway, S.hipY + 2, -7.4 - S.sway * 1.6, S.hipY + 5.6); c.lineTo(-5.6 - S.sway, S.hipY + 5.2); c.quadraticCurveTo(-4.4, S.hipY + 1.6, -2.2, S.hipY - 0.2); c.closePath(); }, P.sash, { sh: 0.3 });
    const cut = S.atk >= 0 ? [-2.4, 0.2, -0.5][S.atk] : S.cast >= 0 ? [-1.8, -0.8][S.cast] : S.splash ? -0.05 : 2.3;
    const hand = S.atk >= 0 ? [[-0.6, sh - 1.6], [7.4, sh + 2.6], [6, sh + 4]][S.atk] : S.cast >= 0 ? [4 + l, sh - 3.6] : S.splash ? [7.4 + l, sh + 3.4] : [3.2 + l, S.hipY - 1.6 + S.sway * 0.3];
    arm(k, -2 + l, sh + 1.2, S.splash ? -5.6 : -2.2 + l - S.sway, S.splash ? sh + 3 : sh + 7, 4.6, 4.6, 1.3, 1.05, shade(armored ? P.cloth2 : P.cloth, 0.84), shade(P.skin, 0.85), shade(P.skin, 0.85));
    const [lb, lf] = S.legs;
    const legO = { r0: 2.2, r1: 1.7, r2: 1.05, thigh: armored ? P.cloth : P.cloth2, shin: armored ? P.cloth2 : P.cloth2, boot: P.boot || '#2a2018', bootH: armored ? 4 : 2.6, bootL: 2.4 };
    leg(k, lb, Object.assign({ far: true }, legO)); leg(k, lf, legO);
    if (k.px >= 1.6 && !armored) { for (const g of S.legs) k.path(c => c.rect(g.fx - 1.3, g.fy - 4.6, 2.6, 1.6), '#e8e0c8', { sh: 0.2 }); }
    torso(k, S, { sw: 2.9, ww: 1.8, hw: 2.6, col: armored ? P.cloth : P.cloth, drop: 0.6 });
    if (armored) {
      k.path(c => { c.moveTo(-2.4 + l, sh + 0.6); c.lineTo(3.2 + l, sh + 0.6); c.lineTo(2.6 + l * 0.6, sh + 6.4); c.lineTo(-2 + l * 0.6, sh + 6.4); c.closePath(); }, P.cloth2, { sh: 0.4 });
      k.line(-1.8 + l, sh + 3.4, 2.8 + l, sh + 3.4, P.sash, 0.45); k.glow(0.6 + l, sh + 3.4, 2.6, P.sash, 0.5);
    } else {
      k.path(c => { c.moveTo(-2.6 + l, sh); c.lineTo(-0.6 + l, sh); c.lineTo(2.4 + l * 0.6, S.hipY - 1.4); c.lineTo(0.6 + l * 0.6, S.hipY - 1.4); c.closePath(); }, shade(P.cloth, 0.8), { sh: 0.2 });
      k.path(c => { c.moveTo(0.4 + l, sh + 0.2); c.lineTo(2.4 + l, sh + 0.2); c.lineTo(1.2 + l * 0.8, sh + 4.4); c.closePath(); }, P.skin, { sh: 0.2 });
    }
    k.path(c => c.rect(-2.9, S.hipY - 2.6, 6 + l * 0.5, 1.8), P.sash, { sh: 0.3 });
    k.seg(0.4 + l, sh + 0.2, 0.6 + l, sh - 1.4, 1, 0.95, shade(P.skin, 0.9));
    head(k, hx, hy, r, P.skin, { jaw: 0.55 });
    ear(k, hx, hy, r, P.skin);
    const gog = parts.goggles || 'lens';
    if (gog === 'skull') {
      k.path(c => { c.ellipse(hx + 0.3, hy - 0.2, r * 1.12, r * 1.1, 0, 0, TAU); c.moveTo(hx + r * 1.1, hy + r * 0.2); c.lineTo(hx + r * 1.3, hy + r * 0.9); c.lineTo(hx + r * 0.2, hy + r * 1.1); }, P.frame);
      k.ell(hx + r * 0.05, hy + r * 0.05, r * 0.28, r * 0.3, '#1a1010', { flat: true, noInk: true }); k.ell(hx + r * 0.66, hy + r * 0.02, r * 0.26, r * 0.28, '#1a1010', { flat: true, noInk: true });
      k.dot(hx + r * 0.05, hy + r * 0.05, r * 0.12, P.lens); k.dot(hx + r * 0.66, hy + r * 0.02, r * 0.11, P.lens);
      k.glow(hx + r * 0.35, hy, r * 0.9, P.lens, 0.4);
      for (let i = 0; i < 3; i++) k.path(c => { c.moveTo(hx - r * 0.6 + i * r * 0.2, hy - r * 0.9); c.quadraticCurveTo(hx - r * 1.6 - i * r * 0.3, hy - r * 2.2, hx - r * 2.4 + i * r * 0.2, hy - r * 1.9); c.quadraticCurveTo(hx - r * 1.4, hy - r * 1.6, hx - r * 0.3 + i * r * 0.2, hy - r * 0.7); c.closePath(); }, ['#c8302a', '#e8b030', '#3a8ac8'][i], { sh: 0.2 });
    } else if (gog === 'visor') {
      k.path(c => { c.arc(hx, hy - 0.4, r * 1.08, PI * 0.9, PI * 2.1); c.lineTo(hx + r * 1.02, hy + r * 0.3); c.lineTo(hx - r * 1.02, hy + r * 0.5); c.closePath(); }, P.frame);
      k.path(c => { c.moveTo(hx - r * 0.2, hy - r * 0.2); c.lineTo(hx + r * 1.12, hy - r * 0.3); c.lineTo(hx + r * 1.1, hy + r * 0.18); c.lineTo(hx - r * 0.1, hy + r * 0.2); c.closePath(); }, P.lens, { flat: true, noInk: true });
      k.glow(hx + r * 0.6, hy, r * 1.1, P.lens, 0.55);
      mouth(k, hx, hy + r * 0.1, r, 'flat', '#5a3a2a');
    } else {
      if (parts.mask) k.path(c => { c.moveTo(hx - r * 0.2, hy + r * 0.28); c.lineTo(hx + r * 1.1, hy + r * 0.2); c.lineTo(hx + r * 0.8, hy + r * 1.05); c.lineTo(hx - r * 0.1, hy + r * 1.05); c.closePath(); }, P.cloth, { sh: 0.2 });
      else mouth(k, hx, hy + r * 0.05, r, 'flat', '#6a3a2a');
      k.path(c => { c.moveTo(hx - r * 1.05, hy + r * 0.3); c.quadraticCurveTo(hx - r * 1.1, hy - r * 1.2, hx + r * 0.3, hy - r * 1.12); c.quadraticCurveTo(hx + r * 1.08, hy - r * 0.95, hx + r * 1, hy - r * 0.3); c.lineTo(hx - r * 0.2, hy - r * 0.45); c.closePath(); }, P.hair, { sh: 0.4 });
      k.path(c => c.rect(hx - r * 1.05, hy - r * 0.62, r * 2.1, r * 0.44), P.frame, { sh: 0.25 });
      k.circ(hx + r * 0.72, hy - r * 0.1, r * 0.44, P.frame, { sh: 0.2 }); k.circ(hx + r * 0.08, hy - r * 0.12, r * 0.4, P.frame, { sh: 0.2 }); k.circ(hx + r * 0.42, hy - r * 0.82, r * 0.3, P.frame, { sh: 0.2 });
      for (const [dx, dy, rr] of [[0.72, -0.1, 0.3], [0.08, -0.12, 0.27], [0.42, -0.82, 0.19]]) { k.circ(hx + r * dx, hy + r * dy, r * rr, P.lens, { sh: r * rr * 0.3 }); if (k.hi) k.dot(hx + r * (dx - 0.1), hy + r * (dy - 0.1), r * 0.07, '#ffffff'); }
      k.glow(hx + r * 0.45, hy - r * 0.2, r * 0.9, P.lens, 0.32);
    }
    yiBlade(k, P, parts, hand[0], hand[1], cut, S);
    arm(k, 2.2 + l, sh + 1.2, hand[0], hand[1], 4.6, 4.6, 1.35, 1.1, P.cloth, P.skin, P.skin);
    if (!armored) k.path(c => { c.moveTo(0.4 + l, sh - 0.4); c.quadraticCurveTo(4 + l, sh - 1.6, 4.6 + l, sh + 1.6); c.lineTo(1.6 + l, sh + 2.6); c.closePath(); }, P.guard || shade(P.cloth2, 1.1), { sh: 0.4 });
    else k.path(c => { c.moveTo(0.2 + l, sh - 0.6); c.quadraticCurveTo(4.4 + l, sh - 2, 5 + l, sh + 1.8); c.lineTo(1.4 + l, sh + 2.6); c.closePath(); }, P.cloth2, { sh: 0.4 });
  };
  function yiBlade(k, P, parts, x, y, a, S) {
    const kind = parts.blade || 'katana';
    k.at(x, y, a, () => {
      if (kind === 'bone') {
        k.path(c => { c.moveTo(1.4, -1); c.quadraticCurveTo(9, -3.2, 15.4, -2.4); c.quadraticCurveTo(10, -0.2, 1.4, 1); c.closePath(); }, P.blade);
        if (k.px >= 1.6) for (let i = 0; i < 4; i++) k.poly([4 + i * 2.6, 0.2 - i * 0.4, 5 + i * 2.6, 1.4 - i * 0.4, 6 + i * 2.6, 0 - i * 0.4], '#fff8e8', { flat: true, noInk: true });
      } else {
        k.path(c => { c.moveTo(1.6, -0.6); c.quadraticCurveTo(10, -1.6, 17, -2.8); c.lineTo(16.4, -1.7); c.quadraticCurveTo(10, -0.4, 1.6, 0.6); c.closePath(); }, P.blade, { sh: 0.2 });
        if (kind === 'energy') { k.glow(9, -1.2, 7, P.blade, 0.7); k.line(2, 0, 16.4, -2.2, '#ffffff', 0.3); }
      }
      k.path(c => c.rect(0.8, -1.5, 0.9, 3), P.guard2 || '#c8a040', { sh: 0.2 });
      k.path(c => c.rect(-3.8, -0.65, 4.6, 1.3), P.hilt || '#3a2a1a', { sh: 0.2 });
      if (k.px >= 1.6) for (let i = 0; i < 3; i++) k.line(-3.2 + i * 1.4, -0.6, -2.6 + i * 1.4, 0.6, '#e8e0c8', 0.25);
    });
    if (S.atk === 1 && kind !== 'energy') k.glow(x + 8, y, 5, '#e0ffe0', 0.35);
    if (S.cast >= 0 || S.splash) k.glow(x, y, S.splash ? 6 : 4, kind === 'energy' ? P.blade : '#a0ff70', 0.5);
  }

  C.malphite = (k, P, pose, parts) => {
    const w = pose.walk != null ? pose.walk * TAU : null, splash = pose.kind === 'splash';
    const bob = w != null ? Math.abs(Math.sin(w)) * 1.2 - 0.6 : (pose.breath || 0) * 0.4 + (splash ? 1.6 : 0);
    const atk = pose.kind === 'atk' ? pose.f : -1, cast = pose.kind === 'cast' ? pose.f : -1;
    const lean = atk >= 0 ? [-1, 2.4, 0.8][atk] : splash ? 1.6 : w != null ? 0.6 : 0;
    const rock = P.rock, rock2 = P.rock2, glow = P.glow, mecha = !!parts.mecha;
    const bx = lean, by = -17 + bob;
    k.anchor.head = [bx + 3, by - 10.4, 4.4];
    const fa = atk >= 0 ? [[-8, by + 1], [15, by - 1], [9, by + 3]][atk] : cast >= 0 ? [[5, by - 13], [10, by - 12]][cast] : splash ? [12, by - 10] : [7 + bx, by + 7 + (w != null ? Math.sin(w) * 1.6 : 0)];
    const ba = splash ? [-9, by + 4] : [-6 + bx - (w != null ? Math.sin(w) * 1.6 : 0), by + 7];
    const limb = (x0, y0, x1, y1, s, far) => {
      const col = far ? shade(rock, 0.8) : rock, col2 = far ? shade(rock2, 0.8) : rock2;
      const mx = (x0 + x1) / 2 - 1, my = (y0 + y1) / 2 + 1.4;
      k.circ(x0, y0, 4 * s, col2, { sh: 0.8 });
      if (mecha) { k.seg(x0, y0, mx, my, 1.4 * s, 1.4 * s, '#4a4e58'); k.seg(mx, my, x1, y1, 1.3 * s, 1.3 * s, '#4a4e58'); }
      k.circ(mx, my, 2.9 * s, col, { sh: 0.6 });
      k.circ(x1, y1, 3.4 * s, col2, { sh: 0.7 });
      if (mecha) { k.circ(x1, y1, 1.2 * s, glow, { flat: true, noInk: true }); k.glow(x1, y1, 3 * s, glow, 0.4); }
      else if (k.px >= 1.6) k.line(x1 - 1.6 * s, y1 - 0.4 * s, x1 + 1.2 * s, y1 + 0.8 * s, P.moss, 0.4);
    };
    limb(-4 + bx, by - 5, ba[0], ba[1], 0.92, true);
    for (const i of [0, 1]) {
      const ph = w != null ? w + (i ? 0 : PI) : 0, fx = (i ? 3.4 : -3.2) + (w != null ? Math.sin(ph) * 3 : splash ? (i ? 3 : -3) : 0), fy = w != null ? -Math.max(0, Math.cos(ph)) * 1.6 : 0;
      const col = i ? rock : shade(rock, 0.8);
      k.circ((i ? 2.4 : -2.4) + bx * 0.5, by + 7.6, 3.6, i ? rock2 : shade(rock2, 0.8), { sh: 0.6 });
      k.path(c => { c.moveTo(fx - 3.4, fy); c.lineTo(fx - 3, fy - 5); c.quadraticCurveTo(fx, fy - 7.4, fx + 3, fy - 5); c.lineTo(fx + 3.8, fy); c.closePath(); }, col, { sh: 0.7 });
      if (mecha) k.path(c => c.rect(fx - 2.6, fy - 1.6, 5.8, 1.6), '#3a3e46', { sh: 0.2 });
    }
    k.path(c => { c.moveTo(bx - 9, by + 4); c.quadraticCurveTo(bx - 10.6, by - 9, bx - 2, by - 10.6); c.quadraticCurveTo(bx + 9.4, by - 10.4, bx + 9.6, by - 1); c.quadraticCurveTo(bx + 8.6, by + 8.6, bx, by + 9.4); c.quadraticCurveTo(bx - 7.6, by + 9, bx - 9, by + 4); c.closePath(); }, rock, { sh: 1.4 });
    if (mecha) {
      k.path(c => { c.moveTo(bx - 5.4, by - 6.4); c.lineTo(bx + 6, by - 6.8); c.lineTo(bx + 6.4, by + 2); c.lineTo(bx - 5, by + 2.6); c.closePath(); }, rock2, { sh: 0.6 });
      k.circ(bx + 0.6, by - 2.2, 2.4, '#1e2228', { sh: 0.2 }); k.circ(bx + 0.6, by - 2.2, 1.5, glow, { flat: true, noInk: true }); k.glow(bx + 0.6, by - 2.2, 6, glow, 0.7);
      if (k.px >= 1.6) for (let i = 0; i < 4; i++) k.dot(bx - 4 + i * 3.2, by + 4.4, 0.45, '#1e2228');
    } else {
      k.path(c => { c.moveTo(bx - 7, by - 3); c.quadraticCurveTo(bx - 5.6, by - 9.6, bx + 0.6, by - 9); c.lineTo(bx + 1.6, by - 3.4); c.closePath(); }, rock2, { sh: 0.7 });
      k.path(c => { c.moveTo(bx + 2, by - 8.6); c.quadraticCurveTo(bx + 8.2, by - 8.2, bx + 8.4, by - 2); c.lineTo(bx + 3, by - 1.4); c.closePath(); }, shade(rock2, 0.95), { sh: 0.6 });
      k.path(c => { c.moveTo(bx - 7.4, by + 1); c.lineTo(bx + 7.6, by + 0.6); c.quadraticCurveTo(bx + 6.4, by + 7.4, bx, by + 8); c.quadraticCurveTo(bx - 6, by + 7, bx - 7.4, by + 1); c.closePath(); }, shade(rock, 0.92), { sh: 0.6 });
      k.path(c => { c.moveTo(bx - 3.6, by - 3); c.lineTo(bx - 0.4, by - 1.4); c.lineTo(bx + 2.6, by - 3.2); c.lineTo(bx + 4.8, by - 0.8); }, glow, { flat: true, noInk: true });
      k.line(bx - 3.6, by - 2.8, bx - 0.4, by - 1.2, glow, 0.8); k.line(bx - 0.4, by - 1.2, bx + 2.6, by - 3, glow, 0.8); k.line(bx + 2.6, by - 3, bx + 4.8, by - 0.6, glow, 0.8);
      k.glow(bx + 0.6, by - 1.8, 5, glow, 0.4);
      if (parts.clover && k.px >= 1.6) for (const [dx, dy] of [[-5, -7], [4, -6], [-2, 5]]) for (let i = 0; i < 3; i++) k.circ(bx + dx + Math.cos(i * 2.1) * 0.9, by + dy + Math.sin(i * 2.1) * 0.9, 0.85, P.moss, { sh: 0.2 });
      if (parts.spikes === 'ice') for (const [dx, dy, a] of [[-6, -8, -2.3], [-2, -10.4, -1.9], [3, -10, -1.4], [7.4, -6, -0.9]]) k.poly([bx + dx - 1.2, by + dy + 0.6, bx + dx + Math.cos(a) * 5, by + dy + Math.sin(a) * 5, bx + dx + 1.2, by + dy + 0.6], P.moss, { sh: 0.3 });
    }
    const hxx = bx + 3.2, hyy = by - 10.4;
    k.path(c => { c.moveTo(hxx - 4.4, hyy + 2.4); c.quadraticCurveTo(hxx - 4.8, hyy - 4.4, hxx + 0.4, hyy - 4.6); c.quadraticCurveTo(hxx + 5, hyy - 4, hxx + 4.8, hyy + 1.4); c.quadraticCurveTo(hxx + 3, hyy + 3.6, hxx - 4.4, hyy + 2.4); c.closePath(); }, mecha ? rock2 : rock, { sh: 0.7 });
    if (mecha) { k.path(c => c.rect(hxx - 0.6, hyy - 1.4, 5, 1.8), '#1e2228', { sh: 0.1 }); k.line(hxx - 2, hyy - 4.4, hxx - 3.6, hyy - 8, '#9aa2b0', 0.5); k.dot(hxx - 3.6, hyy - 8, 0.7, glow); }
    k.flat(c => { c.rect(hxx + 0.2, hyy - 1, 1.7, 0.9); c.rect(hxx + 2.7, hyy - 1.1, 1.7, 0.9); }, glow);
    k.glow(hxx + 2.2, hyy - 0.6, 3, glow, 0.6);
    limb(4 + bx, by - 5, fa[0], fa[1], 1, false);
    if (atk === 1) k.glow(fa[0] + 2, fa[1], 6, '#ffe8c0', 0.5);
  };

  C.ryze = (k, P, pose, parts) => {
    const B = { hip: 16.2, thigh: 8, shin: 8.5, torso: 11.5, hipW: 1.4, stride: 4.2, lift: 2.2, bobW: 0.8, splashStance: 3.4, splashLean: 0.5 };
    const S = skel(B, pose), l = S.lean, sh = S.shY;
    const hx = 0.9 + l, hy = sh - 5.6, r = 5;
    k.anchor.head = [hx, hy, r];
    const scroll = parts.scroll || 'scroll';
    k.at(-2.6 + l, sh + 4, -1.05, () => {
      k.seg(-8, 0, 8, 0, 2, 2, P.scroll, { sh: 0.5 });
      k.circ(-8, 0, 2.3, scroll === 'map' ? '#8a5a2a' : P.trim, { sh: 0.4 }); k.circ(8, 0, 2.3, scroll === 'map' ? '#8a5a2a' : P.trim, { sh: 0.4 });
      if (scroll === 'torn' && k.px >= 1.6) k.poly([2, 1.8, 3.4, 4.4, 4.4, 1.9], P.scroll, { flat: true, noInk: true });
      if (k.px >= 1.6) k.line(-6, -0.6, 6, -0.6, shade(P.scroll, 0.8), 0.3);
    });
    k.line(-3.2 + l, sh, 1.6 + l, S.hipY - 1, '#5a3a20', 0.8);
    const cast = S.cast >= 0 || S.splash || S.atk >= 0;
    const fh = S.cast >= 0 ? [[4.6, sh - 1], [7.2, sh + 0.6]][S.cast] : S.atk >= 0 ? [[2, sh + 1], [7.4, sh + 1.4], [5.6, sh + 2.8]][S.atk] : S.splash ? [6.6 + l, sh - 2] : [3.2 + l, S.hipY - 0.6 + S.sway * 0.3];
    const bh = S.splash ? [-5.2, sh + 2] : [-2.2 + l - S.sway * 0.8, S.hipY - 0.4];
    arm(k, -2 + l, sh + 1.2, bh[0], bh[1], 4.8, 4.8, 1.4, 1.2, shade(P.cloth, 0.8), shade(P.skin, 0.85), shade(P.skin, 0.85));
    if (S.splash) k.glow(bh[0], bh[1], 5, P.rune, 0.6);
    const [lb, lf] = S.legs;
    const legO = { r0: 2, r1: 1.5, r2: 1.2, thigh: P.legs, shin: P.legs, boot: P.boots, bootH: 3.6, bootL: 2.4, stripes: parts.hat === 'tophat' ? '#c8202a' : null };
    leg(k, lb, Object.assign({ far: true }, legO)); leg(k, lf, legO);
    const hem = S.hipY + 7;
    k.path(c => { c.moveTo(-3 + l, sh); c.lineTo(3.2 + l, sh); c.quadraticCurveTo(3.4, S.hipY, 4.8 + S.sway * 0.5, hem); c.lineTo(1.4, hem - 1.2); c.lineTo(-0.2, hem + 0.4); c.lineTo(-4.6 - S.sway * 0.5, hem - 0.6); c.quadraticCurveTo(-3.8, S.hipY, -3 + l, sh); c.closePath(); }, P.cloth);
    if (parts.rot && k.px >= 1.6) for (let i = 0; i < 4; i++) k.poly([-4 + i * 2.4, hem - 0.6, -3 + i * 2.4, hem + 1.2, -2.2 + i * 2.4, hem - 0.7], P.cloth, { flat: true, noInk: true });
    k.path(c => { c.moveTo(-0.4 + l, sh); c.lineTo(1.6 + l, sh); c.lineTo(1.8 + l * 0.5, hem - 0.6); c.lineTo(0.2 + l * 0.5, hem - 0.2); c.closePath(); }, P.cloth2, { sh: 0.3 });
    k.path(c => c.rect(-3.2, S.hipY - 2, 6.8 + l * 0.4, 1.3), P.trim, { sh: 0.3 });
    if (k.px >= 1.6) k.path(c => c.rect(-2.8, S.hipY - 1, 2.2, 2.4), shade(P.cloth2, 0.7), { sh: 0.2 });
    k.seg(0.4 + l, sh + 0.2, 0.7 + l, sh - 1.4, 1.2, 1.15, shade(P.skin, 0.9));
    head(k, hx, hy, r, P.skin, { jaw: 0.6 });
    ear(k, hx, hy, r, P.skin);
    if (parts.patch) { eyes(k, hx, hy, r, { iris: P.eye, brow: shade(P.skin, 0.55) }); k.path(c => c.ellipse(hx + r * 0.46, hy + r * 0.08, r * 0.28, r * 0.24, 0, 0, TAU), '#1a1414', { sh: 0.1 }); k.line(hx + r * 0.2, hy - r * 0.1, hx - r * 0.9, hy - r * 0.6, '#1a1414', 0.4); }
    else eyes(k, hx, hy, r, { iris: P.eye, brow: shade(P.skin, 0.55), glow: parts.rot ? P.eye : null });
    nose(k, hx, hy, r, shade(P.skin, 0.65));
    mouth(k, hx, hy, r, parts.rot ? 'open' : 'flat', shade(P.skin, 0.5));
    if (k.hi && !parts.beard) { k.curve([hx + r * 0.1, hy + r * 0.6, hx + r * 0.5, hy + r * 1.05, hx + r * 0.85, hy + r * 0.62], shade(P.skin, 0.6), 0.2); }
    if (parts.beard) k.path(c => { c.moveTo(hx + r * 0.1, hy + r * 0.62); c.quadraticCurveTo(hx + r * 0.5, hy + r * 2, hx + r * 1, hy + r * 0.6); c.closePath(); }, P.beard, { sh: 0.3 });
    if (k.px >= 1.6 && !parts.hat) { k.line(hx - r * 0.6, hy - r * 0.5, hx - r * 0.1, hy - r * 0.9, P.rune, 0.35); k.line(hx - r * 0.1, hy - r * 0.9, hx + r * 0.3, hy - r * 0.55, P.rune, 0.35); }
    if (parts.rot && k.px >= 1.6) { k.ell(hx - r * 0.4, hy - r * 0.4, r * 0.3, r * 0.2, shade(P.skin, 0.7), { flat: true, noInk: true }); k.ell(hx + r * 0.3, hy + r * 0.7, r * 0.2, r * 0.14, shade(P.skin, 0.6), { flat: true, noInk: true }); }
    if (parts.hat === 'tophat') {
      k.ell(hx + 0.2, hy - r * 0.82, r * 1.28, r * 0.24, P.hat2, { sh: 0.3 });
      k.path(c => c.rect(hx - r * 0.72, hy - r * 2.5, r * 1.54, r * 1.7), P.hat);
      if (k.px >= 1.6) for (let i = 0; i < 3; i++) k.path(c => c.rect(hx - r * 0.72 + i * r * 0.56, hy - r * 2.5, r * 0.28, r * 1.3), P.hat2, { flat: true, noInk: true });
      k.path(c => c.rect(hx - r * 0.72, hy - r * 1.2, r * 1.54, r * 0.38), P.cloth, { sh: 0.2 });
      if (k.hi) for (let i = 0; i < 3; i++) k.path(c => star(c, hx - r * 0.45 + i * r * 0.45, hy - r * 1.01, r * 0.13, 5), '#ffffff', { flat: true, noInk: true });
    } else if (parts.hat === 'tricorn') {
      k.path(c => { c.moveTo(hx - r * 1.5, hy - r * 0.55); c.quadraticCurveTo(hx - r * 0.8, hy - r * 2.3, hx + 0.4, hy - r * 1.6); c.quadraticCurveTo(hx + r * 1.2, hy - r * 2.2, hx + r * 1.7, hy - r * 0.5); c.quadraticCurveTo(hx, hy - r * 1.1, hx - r * 1.5, hy - r * 0.55); c.closePath(); }, P.hat);
      if (k.px >= 1.6) k.curve([hx - r * 1.4, hy - r * 0.62, hx, hy - r * 1.1, hx + r * 1.6, hy - r * 0.58], P.hat2, 0.4);
      if (k.hi) { k.dot(hx + 0.2, hy - r * 1.35, r * 0.16, '#f4f0e8'); }
    }
    if (cast) { k.glow(fh[0] + 1, fh[1] - 0.6, S.splash ? 8 : 5, P.rune, 0.85); k.circ(fh[0] + 1, fh[1] - 0.6, 1.2, mix(P.rune, '#ffffff', 0.5), { flat: true, noInk: true }); }
    arm(k, 2.2 + l, sh + 1.2, fh[0], fh[1], 4.8, 4.8, 1.5, 1.25, P.cloth, P.skin, P.skin);
    if (k.px >= 1.6) { const [ex, ey] = ik(2.2 + l, sh + 1.2, fh[0], fh[1], 4.8, 4.8, -1); k.line(ex + 0.2, ey + 0.2, (ex + fh[0]) / 2, (ey + fh[1]) / 2, P.rune, 0.35); }
  };

  C.alistar = (k, P, pose, parts) => {
    const B = { hip: 14.4, thigh: 7, shin: 7.4, torso: 12.5, hipW: 2.4, stride: 4, lift: 2, bobW: 1.1, splashStance: 4, splashLean: 2.4, splashCrouch: 2 };
    const S = skel(B, pose), l = S.lean + 0.8, sh = S.shY;
    const hx = 5.4 + l * 1.2, hy = sh - 1.8;
    k.anchor.head = [hx, hy, 5.2];
    const fur = P.fur, fur2 = P.fur2;
    k.path(c => { c.moveTo(-4, S.hipY - 1); c.quadraticCurveTo(-8 - S.sway, S.hipY + 2, -9 - S.sway * 1.6, S.hipY + 7); c.lineTo(-8.2 - S.sway * 1.6, S.hipY + 7.4); c.quadraticCurveTo(-7 - S.sway, S.hipY + 3, -4, S.hipY + 0.6); c.closePath(); }, shade(fur, 0.85), { sh: 0.3 });
    k.ell(-9 - S.sway * 1.6, S.hipY + 8, 1.2, 1.8, shade(fur, 0.6), { sh: 0.3 });
    const punch = S.atk >= 0 ? [[0, sh + 2], [12, sh + 1], [9, sh + 4]][S.atk] : S.cast >= 0 ? [[6, sh - 6], [11, sh - 2]][S.cast] : S.splash ? [12, sh + 3] : [5.4 + l, S.hipY + 0.6 + S.sway * 0.4];
    const back = S.splash ? [-6, sh + 5] : [-2.6 + l - S.sway * 1.2, S.hipY + 1];
    const armCol = f => f ? shade(fur, 0.8) : fur;
    const [e0x, e0y] = ik(-3 + l, sh + 2, back[0], back[1], 6, 6, -1);
    k.seg(-3 + l, sh + 2, e0x, e0y, 2.8, 2.3, armCol(1)); k.seg(e0x, e0y, back[0], back[1], 2.3, 2, armCol(1));
    k.path(c => c.rect(back[0] - 2.2, back[1] - 3.4, 4.4, 2), shade(P.ring, 0.8), { sh: 0.3 });
    k.circ(back[0], back[1] + 0.6, 2.2, shade(fur, 0.7), { sh: 0.4 });
    const [lb, lf] = S.legs;
    const legO = { r0: 2.9, r1: 2.1, r2: 1.7, thigh: fur, shin: fur, boot: P.hoof || '#2a2020', bootH: 2.2, bootL: 1.6 };
    leg(k, lb, Object.assign({ far: true }, legO)); leg(k, lf, legO);
    k.path(c => { c.moveTo(-5.4 + l * 0.4, sh + 0.4); c.quadraticCurveTo(-1, sh - 3.6, 5.6 + l, sh - 1.4); c.quadraticCurveTo(8.4 + l, sh + 3, 5.6 + l * 0.6, S.hipY - 0.6); c.lineTo(-4.6, S.hipY); c.quadraticCurveTo(-7.4, sh + 5, -5.4 + l * 0.4, sh + 0.4); c.closePath(); }, fur, { sh: 1.2 });
    k.path(c => { c.moveTo(0.6 + l, sh + 1.4); c.quadraticCurveTo(6 + l, sh + 1, 6 + l * 0.7, sh + 6); c.quadraticCurveTo(4 + l * 0.6, S.hipY - 1, 0.4 + l * 0.5, S.hipY - 0.6); c.closePath(); }, fur2, { sh: 0.6 });
    if (parts.lava) { for (const [x0, y0, x1, y1] of [[-3, sh + 3, 0, sh + 7], [0, sh + 7, -1.6, S.hipY - 2], [2.4, sh + 2.6, 4.8, sh + 5]]) { k.line(x0 + l * 0.5, y0, x1 + l * 0.5, y1, P.fur2, 0.7); } k.glow(0.6 + l * 0.5, sh + 5, 6, P.fur2, 0.45); }
    if (parts.jacket) {
      k.path(c => { c.moveTo(-5.4 + l * 0.4, sh + 0.4); c.quadraticCurveTo(-1, sh - 3.6, 5.6 + l, sh - 1.4); c.lineTo(4.4 + l, sh + 5.4); c.lineTo(1 + l * 0.6, sh + 4); c.lineTo(-3.6, sh + 6.8); c.quadraticCurveTo(-6.8, sh + 4, -5.4 + l * 0.4, sh + 0.4); c.closePath(); }, P.cloth);
      if (k.px >= 1.6) { k.curve([-4.6, sh + 5.6, -1.2, sh + 3, 3.6 + l, sh + 4.6], P.cloth2, 0.6); for (let i = 0; i < 3; i++) k.dot(0 + i * 1.6 + l * 0.6, sh + 0.6 + i * 0.4, 0.45, P.cloth2); }
    }
    k.path(c => { c.moveTo(-4.8, S.hipY - 1.6); c.lineTo(5 + l * 0.5, S.hipY - 1.8); c.lineTo(4.6 + l * 0.5, S.hipY + 0.4); c.lineTo(-4.6, S.hipY + 0.6); c.closePath(); }, parts.jacket ? '#1e1a1a' : P.cloth2, { sh: 0.3 });
    k.path(c => { c.moveTo(-0.2 + l * 0.3, S.hipY); c.lineTo(4.4 + l * 0.3, S.hipY - 0.2); c.lineTo(3.4 + S.sway * 0.5, S.hipY + 5.2); c.lineTo(0.2 + S.sway * 0.5, S.hipY + 5.4); c.closePath(); }, P.cloth);
    k.ell(hx - 3.4, hy + 0.2, 2.6, 1.3, shade(fur, 0.85), { rot: -0.6, sh: 0.3 });
    const horn = P.horn;
    k.path(c => { c.moveTo(hx - 3.2, hy - 2.4); c.quadraticCurveTo(hx - 8.6, hy - 4.6, hx - 7.4, hy - 10.6); c.quadraticCurveTo(hx - 6.2, hy - 6.4, hx - 1.6, hy - 3.8); c.closePath(); }, shade(horn, 0.86), { sh: 0.4 });
    k.path(c => { c.moveTo(hx - 3.6, hy - 5.2); c.quadraticCurveTo(hx - 0.4, hy - 3.8, hx + 0.2, hy - 1.8); c.quadraticCurveTo(hx + 1.6, hy - 3.4, hx - 3.6, hy - 5.2); c.closePath(); }, fur, { sh: 0.5 });
    k.path(c => { c.moveTo(hx - 4.4, hy + 2.6); c.quadraticCurveTo(hx - 5.4, hy - 4.4, hx - 0.6, hy - 4.8); c.quadraticCurveTo(hx + 3.2, hy - 4.6, hx + 4.2, hy - 1.2); c.quadraticCurveTo(hx + 4.4, hy + 2.8, hx, hy + 3.6); c.closePath(); }, fur, { sh: 0.8 });
    k.path(c => { c.moveTo(hx + 1.6, hy - 1.8); c.quadraticCurveTo(hx + 6.8, hy - 1.4, hx + 7, hy + 1.8); c.quadraticCurveTo(hx + 6.4, hy + 4.2, hx + 2.4, hy + 3.8); c.quadraticCurveTo(hx + 0.6, hy + 1.6, hx + 1.6, hy - 1.8); c.closePath(); }, fur2, { sh: 0.5 });
    if (k.px >= 1.6) { k.ell(hx + 5.6, hy + 0.4, 0.5, 0.8, shade(fur2, 0.45), { flat: true, noInk: true }); k.ell(hx + 4.2, hy + 0.6, 0.45, 0.7, shade(fur2, 0.5), { flat: true, noInk: true }); }
    k.path(c => { c.arc(hx + 5.6, hy + 2.8, 1.8, -0.3, PI + 0.3, false); c.arc(hx + 5.6, hy + 2.8, 1.1, PI + 0.3, -0.3, true); c.closePath(); }, P.ring, { sh: 0.25 });
    eyes(k, hx + 0.8, hy - 1.2, 3.4, parts.lava || parts.glowEyes ? { glow: P.eye, big: 1 } : { iris: P.eye, big: 0.9, brow: shade(fur, 0.55), angry: true });
    k.path(c => { c.moveTo(hx - 1.6, hy - 3.8); c.quadraticCurveTo(hx + 2.4, hy - 7.4, hx + 1.4, hy - 12.4); c.quadraticCurveTo(hx + 4.8, hy - 7, hx + 0.4, hy - 2.6); c.closePath(); }, horn, { sh: 0.4 });
    if (parts.hat === 'montera') { k.path(c => { c.moveTo(hx - 4.4, hy - 3.4); c.quadraticCurveTo(hx - 3.6, hy - 7.6, hx - 1.2, hy - 5.6); c.quadraticCurveTo(hx + 0.8, hy - 7.6, hx + 2, hy - 3.6); c.closePath(); }, '#1e1a1e', { sh: 0.3 }); k.circ(hx - 3.6, hy - 6.4, 1, '#1e1a1e', { sh: 0.2 }); k.circ(hx + 1.2, hy - 6.6, 1, '#1e1a1e', { sh: 0.2 }); }
    if (parts.lava) { k.glow(hx + 1.4, hy - 12, 4, P.horn, 0.7); k.glow(hx - 7.4, hy - 10.4, 3.4, P.horn, 0.6); }
    const [e1x, e1y] = ik(3 + l, sh + 2, punch[0], punch[1], 6.2, 6.2, -1);
    k.seg(3 + l, sh + 2, e1x, e1y, 3, 2.5, fur); k.seg(e1x, e1y, punch[0], punch[1], 2.5, 2.2, fur);
    const ang = Math.atan2(punch[1] - e1y, punch[0] - e1x);
    k.at(punch[0], punch[1], ang, () => k.path(c => c.rect(-3.4, -2.6, 2.4, 5.2), P.ring, { sh: 0.3 }));
    k.circ(punch[0] + Math.cos(ang) * 0.8, punch[1] + Math.sin(ang) * 0.8, 2.4, shade(fur, 0.9), { sh: 0.5 });
    if (S.cast >= 0 || S.splash) k.glow(punch[0], punch[1], 6, parts.lava ? '#ff8020' : '#a0ffa0', 0.5);
  };

  function pix(k, kind, f) {
    const up = f % 2 ? -1 : 1;
    const look = { classic: ['#ffb6f2', '#a8f0ff'], candy: ['#ff7ab8', '#fff0f6'], wicked: ['#3a2a48', '#7aff70'], snow: ['#ffffff', '#9ad8ff'] }[kind] || ['#ffb6f2', '#a8f0ff'];
    k.ell(-2.6, -1.4 * up, 2.4, 1.2, look[1], { rot: -0.5 * up, sh: 0.2 });
    k.ell(2.6, -1.4 * up, 2.4, 1.2, look[1], { rot: 0.5 * up, sh: 0.2 });
    k.circ(0, 0, 1.9, look[0], { sh: 0.4 });
    k.dot(0.6, -0.3, 0.4, kind === 'wicked' ? '#7aff70' : '#1a1020');
    if (kind === 'candy') k.poly([-1.9, 0, -3.4, -1, -3.4, 1], look[1], { flat: true, noInk: true });
    k.glow(0, 0, 4.4, look[kind === 'wicked' ? 1 : 0], 0.45);
  }

  function tibbers(k, P, kind, f) {
    const lg = f === 1 ? 2 : f === 3 ? -2 : 0, atk = f === 2;
    const c = P.bear, c2 = P.bear2, flame = kind === 'goth' ? '#c070ff' : kind === 'ice' ? '#60c8ff' : '#ff8020';
    if (kind === 'wolf') {
      k.seg(-6, -14, -8 - lg, -1, 3.4, 2.4, shade(c, 0.75)); k.seg(6, -14, 8 + lg, -1, 3.4, 2.4, shade(c, 0.85));
      k.path(q => { q.moveTo(-13, -30); q.quadraticCurveTo(-20, -26, -22, -14); q.lineTo(-17, -18); q.quadraticCurveTo(-15, -26, -10, -26); q.closePath(); }, shade(c, 0.8));
      k.ell(0, -28, 14, 16, c, { sh: 1.4 }); k.ell(2, -24, 8, 10, c2, { sh: 0.8 });
      k.seg(-11, -36, atk ? -4 : -18, atk ? -52 : -22, 3.6, 3, shade(c, 0.85)); k.seg(11, -36, atk ? 22 : 18, atk ? -46 : -22, 3.6, 3, c);
      for (const x of [atk ? 22 : 18]) for (let i = 0; i < 3; i++) k.poly([x - 1.4 + i * 1.4, atk ? -47 : -23, x - 0.8 + i * 1.4, atk ? -51 : -19, x + i * 1.4, atk ? -47 : -23], '#f0f0f0', { flat: true, noInk: true });
      k.path(q => { q.moveTo(-6, -50); q.quadraticCurveTo(0, -60, 8, -52); q.lineTo(20, -48); q.quadraticCurveTo(18, -42, 8, -42); q.quadraticCurveTo(-2, -38, -6, -44); q.closePath(); }, c, { sh: 0.8 });
      k.poly([-5, -54, -4, -66, 2, -56], c); k.poly([2, -56, 6, -66, 8, -54], c);
      k.path(q => { q.moveTo(8, -48); q.lineTo(20, -48); q.lineTo(19, -45); q.lineTo(8, -44); q.closePath(); }, '#5a1020', { flat: true, noInk: true });
      k.dot(19.4, -49.4, 1, '#1a1010'); k.dot(6, -52, 1.2, '#ffe040');
      k.path(q => { q.moveTo(-8, -46); q.quadraticCurveTo(0, -56, 10, -50); q.lineTo(8, -44); q.quadraticCurveTo(0, -46, -8, -40); q.closePath(); }, '#c8202a', { sh: 0.4 });
      return;
    }
    k.seg(-6, -14, -8 - lg, -1, 4, 3, shade(c, 0.72)); k.seg(6, -14, 8 + lg, -1, 4, 3, shade(c, 0.82));
    k.ell(0, -28, 17, 18, c, { sh: 1.6 });
    k.ell(1, -24, 10, 11, c2, { sh: 0.8 });
    if (k.px >= 1.6) for (let i = 0; i < 4; i++) k.line(-3 + i * 2, -38 + i * 3, -1 + i * 2, -36 + i * 3, shade(c, 0.5), 0.6);
    k.seg(-13, -36, atk ? -6 : -20, atk ? -52 : -22, 4, 3.4, shade(c, 0.85)); k.seg(13, -36, atk ? 24 : 20, atk ? -46 : -22, 4, 3.4, c);
    for (let i = 0; i < 3; i++) k.poly([(atk ? 24 : 20) + i * 1.6 - 1.6, atk ? -48 : -24, (atk ? 24 : 20) + i * 1.6 - 0.8, atk ? -52 : -20, (atk ? 24 : 20) + i * 1.6, atk ? -48 : -24], '#f0f0f0', { flat: true, noInk: true });
    k.ell(0, -52, 12, 11, c, { sh: 1 });
    k.circ(-9, -62, 4.6, c, { sh: 0.6 }); k.circ(9, -62, 4.6, c, { sh: 0.6 }); k.circ(-9, -62, 2.2, c2); k.circ(9, -62, 2.2, c2);
    k.ell(3, -48, 6, 4, c2, { sh: 0.4 }); k.ell(5, -50, 1.8, 1.2, '#1a1010', { flat: true, noInk: true });
    k.flat(q => { q.rect(-6, -56, 3, 2.4); q.rect(3, -56, 3, 2.4); }, kind === 'ice' ? '#60e0ff' : '#ff3010');
    k.glow(0, -55, 6, kind === 'ice' ? '#60e0ff' : '#ff4010', 0.6);
    for (let i = 0; i < 5; i++) { const x = -12 + i * 6, y = -70 - ((f + i) % 2) * 2; k.poly([x - 2, y + 4, x, y - 3, x + 2, y + 4], flame, { flat: true, noInk: true }); k.glow(x, y + 1, 4, flame, 0.5); }
    if (kind === 'goth' && k.px >= 1.6) { k.line(-6, -30, 6, -30, P.bear2, 0.8); k.line(-4, -22, 4, -22, P.bear2, 0.8); }
  }

  L.Models = { C, kit, paintGlows, crisp, pix, tibbers, shade, mix, rgba, mk, star, TAU, PI, clamp };
})(globalThis.LoL98 = globalThis.LoL98 || {});
