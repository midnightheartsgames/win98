(function (K) {
  'use strict';
  const { clamp, lerp, segSegDist2 } = K;

  const J = { pelvis: 0, chest: 1, neck: 2, head: 3, shL: 4, elL: 5, haL: 6, shR: 7, elR: 8, haR: 9, hipL: 10, knL: 11, ftL: 12, hipR: 13, knR: 14, ftR: 15 };
  const NJ = 16;
  const SEGS = [
    { a: 0, b: 2, part: 'torso', w: 0.36, d: 0.22, r: 0.2 },
    { a: 2, b: 3, part: 'head', r: 0.14, head: true },
    { a: 4, b: 5, part: 'armL', lower: false, w: 0.11, d: 0.11, r: 0.075 },
    { a: 5, b: 6, part: 'armL', lower: true, w: 0.09, d: 0.09, r: 0.065 },
    { a: 7, b: 8, part: 'armR', lower: false, w: 0.11, d: 0.11, r: 0.075 },
    { a: 8, b: 9, part: 'armR', lower: true, w: 0.09, d: 0.09, r: 0.065 },
    { a: 10, b: 11, part: 'legL', lower: false, w: 0.15, d: 0.15, r: 0.095 },
    { a: 11, b: 12, part: 'legL', lower: true, w: 0.12, d: 0.12, r: 0.08 },
    { a: 13, b: 14, part: 'legR', lower: false, w: 0.15, d: 0.15, r: 0.095 },
    { a: 14, b: 15, part: 'legR', lower: true, w: 0.12, d: 0.12, r: 0.08 }
  ];
  const LIMB_JOINTS = {
    armL: { upper: [J.shL, J.elL, J.haL], lower: [J.elL, J.haL] },
    armR: { upper: [J.shR, J.elR, J.haR], lower: [J.elR, J.haR] },
    legL: { upper: [J.hipL, J.knL, J.ftL], lower: [J.knL, J.ftL] },
    legR: { upper: [J.hipR, J.knR, J.ftR], lower: [J.knR, J.ftR] },
    head: { upper: [J.neck, J.head], lower: [J.neck, J.head] }
  };
  const RAG_LINKS = [[0, 1], [1, 2], [2, 3], [1, 4], [1, 7], [4, 5], [5, 6], [7, 8], [8, 9], [0, 10], [0, 13], [10, 11], [11, 12], [13, 14], [14, 15], [4, 7], [10, 13], [4, 10], [7, 13], [4, 13], [7, 10], [0, 2], [3, 1]];

  const Q = { hip: 0, sh: 1, neck: 2, head: 3, fl: 4, fr: 5, rl: 6, rr: 7, tail: 8 };
  const QNJ = 9;
  const QSEGS = [
    { a: 0, b: 1, part: 'torso', body: true, r: 0.4 },
    { a: 1, b: 2, part: 'torso', neck: true, r: 0.18 },
    { a: 2, b: 3, part: 'head', r: 0.2, head: true },
    { a: 1, b: 4, part: 'torso', leg: -1, r: 0.08 },
    { a: 1, b: 5, part: 'torso', leg: 1, r: 0.08 },
    { a: 0, b: 6, part: 'torso', leg: -1, r: 0.08 },
    { a: 0, b: 7, part: 'torso', leg: 1, r: 0.08 },
    { a: 0, b: 8, part: 'torso', tail: true, r: 0.03 }
  ];
  const QRAG_LINKS = [[0, 1], [1, 2], [2, 3], [1, 4], [1, 5], [0, 6], [0, 7], [0, 8], [4, 5], [6, 7], [4, 6], [5, 7], [0, 2]];
  const QUAD = {
    cow: { len: 1.7, h: 1.15, neckUp: 0.25, neckF: 0.35, head: 0.5, leg: 0.95, legSpread: 0.26, scale: 1 },
    wolf: { len: 0.95, h: 0.62, neckUp: 0.18, neckF: 0.22, head: 0.32, leg: 0.55, legSpread: 0.14, scale: 1 }
  };

  const ATK = {
    swing: { win: [0.3, 0.62], blade: 0.05 },
    thrust: { win: [0.36, 0.56], blade: 0.04 },
    chop: { win: [0.42, 0.64], blade: 0.05 },
    kick: { win: [0.3, 0.58], blade: 0.06 }
  };

  function ik(ax, ay, az, tx, ty, tz, l1, l2, px, py, pz, out, o) {
    let dx = tx - ax, dy = ty - ay, dz = tz - az;
    let d = Math.hypot(dx, dy, dz) || 1e-4;
    const maxd = (l1 + l2) * 0.999;
    if (d > maxd) { const k = maxd / d; dx *= k; dy *= k; dz *= k; d = maxd; }
    const ux = dx / d, uy = dy / d, uz = dz / d;
    const dot = px * ux + py * uy + pz * uz;
    let qx = px - ux * dot, qy = py - uy * dot, qz = pz - uz * dot;
    const ql = Math.hypot(qx, qy, qz) || 1;
    qx /= ql; qy /= ql; qz /= ql;
    const ca = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), sa = Math.sqrt(1 - ca * ca);
    out[o] = ax + (ux * ca + qx * sa) * l1; out[o + 1] = ay + (uy * ca + qy * sa) * l1; out[o + 2] = az + (uz * ca + qz * sa) * l1;
    out[o + 3] = ax + dx; out[o + 4] = ay + dy; out[o + 5] = az + dz;
  }

  const ease = t => t * t * (3 - 2 * t);
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const norm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

  function weaponPose(kind, t, hy, s) {
    const rest = { hand: [0.24, 1.02 * s, 0.22], dir: [0.05, 0.75, 0.66], twist: 0 };
    if (kind === 'swing' || kind === 'hook') {
      const droop = clamp((hy - 1.3 * s) * 1.1, -0.8, 0.5);
      const at = (al) => ({ hand: [Math.sin(al) * 0.52, hy, Math.cos(al) * 0.52 + 0.05], dir: norm3([Math.sin(al), droop, Math.cos(al)]), twist: al * 0.45 });
      const a0 = 1.95, a1 = -1.05;
      if (t < 0.3) { const k = ease(t / 0.3), w = at(a0); return { hand: mix3(rest.hand, w.hand, k), dir: norm3(mix3(rest.dir, w.dir, k)), twist: w.twist * k }; }
      if (t < 0.62) return at(lerp(a0, a1, ease((t - 0.3) / 0.32)));
      const k = ease((t - 0.62) / 0.38), w = at(a1);
      return { hand: mix3(w.hand, rest.hand, k), dir: norm3(mix3(w.dir, rest.dir, k)), twist: w.twist * (1 - k) };
    }
    if (kind === 'thrust') {
      const slope = clamp((hy - 1.3 * s) * 0.6, -0.6, 0.4);
      const back = { hand: [0.24, hy, -0.12], dir: norm3([0, slope, 1]), twist: 0.35 };
      const fwd = { hand: [0.1, hy, 0.7], dir: norm3([-0.05, slope, 1]), twist: -0.2 };
      if (t < 0.36) { const k = ease(t / 0.36); return { hand: mix3(rest.hand, back.hand, k), dir: norm3(mix3(rest.dir, back.dir, k)), twist: back.twist * k }; }
      if (t < 0.56) { const k = ease((t - 0.36) / 0.2); return { hand: mix3(back.hand, fwd.hand, k), dir: back.dir, twist: lerp(back.twist, fwd.twist, k) }; }
      const k = ease((t - 0.56) / 0.44); return { hand: mix3(fwd.hand, rest.hand, k), dir: norm3(mix3(fwd.dir, rest.dir, k)), twist: fwd.twist * (1 - k) };
    }
    if (kind === 'chop') {
      const up = { hand: [0.12, 1.98 * s, -0.08], dir: norm3([0, 0.55, -0.85]), twist: 0.15 };
      const low = { hand: [0.06, Math.max(0.55, hy - 0.15), 0.56], dir: norm3([0, clamp((hy - 1.5 * s), -0.95, -0.2), 0.85]), twist: -0.1 };
      if (t < 0.42) { const k = ease(t / 0.42); return { hand: mix3(rest.hand, up.hand, k), dir: norm3(mix3(rest.dir, up.dir, k)), twist: up.twist * k }; }
      if (t < 0.64) {
        const k = ease((t - 0.42) / 0.22), end = clamp(1.6 + (1.3 * s - hy) * 1.2, 1.3, 2.5), f = lerp(-0.6, end, k);
        const arc = Math.sin(k * Math.PI) * 0.18;
        return { hand: [lerp(up.hand[0], low.hand[0], k), lerp(up.hand[1], low.hand[1], k) + arc, lerp(up.hand[2], low.hand[2], k) + arc], dir: [0, Math.cos(f), Math.sin(f)], twist: lerp(up.twist, low.twist, k) };
      }
      const k = ease((t - 0.64) / 0.36); return { hand: mix3(low.hand, rest.hand, k), dir: norm3(mix3(low.dir, rest.dir, k)), twist: low.twist * (1 - k) };
    }
    return rest;
  }

  const L = new Float32Array(NJ * 3);
  function setL(j, x, y, z) { L[j * 3] = x; L[j * 3 + 1] = y; L[j * 3 + 2] = z; }

  function pose(a, out, ground) {
    const an = a.anim || {}, s = a.scale || 1, sw = a.female ? 0.9 : 1;
    const ph = an.phase || 0, sp = clamp(an.speed || 0, 0, 1.6), cr = an.crouch || 0;
    const limb = a.limbs || {};
    const gone = p => limb[p] && (limb[p].state === 'lost');
    const legOK = p => !gone(p) || (a.pros && a.pros[p]);
    const crawl = an.mode === 'crawl', chair = an.mode === 'chair', air = an.air;
    let pelY, lean = an.lean || 0;
    const stag = an.stagger || 0;
    let tw = 0, hand = null, dir = null, offHand = null;
    const hy = (1.3 + clamp(an.aim || 0, -1, 1) * 0.55) * s;
    const atk = an.atk;
    if (atk && atk.kind !== 'bow' && atk.kind !== 'xbow' && atk.kind !== 'kick') {
      const wp = weaponPose(atk.kind, atk.t, hy, s); hand = wp.hand; dir = wp.dir; tw = wp.twist;
    }
    if (crawl) {
      setL(J.pelvis, 0, 0.24, -0.35); setL(J.chest, 0, 0.3, 0.12); setL(J.neck, 0, 0.36, 0.3); setL(J.head, 0, 0.46, 0.44);
    } else if (chair) {
      setL(J.pelvis, 0, 0.66, -0.05); setL(J.chest, 0, 1.06 * s, 0.0); setL(J.neck, 0, 1.22 * s, 0.02); setL(J.head, 0, 1.36 * s, 0.05);
    } else {
      const bob = -Math.abs(Math.sin(ph)) * 0.05 * Math.min(1, sp);
      pelY = (0.95 - 0.33 * cr) * s + bob - (air ? 0.05 : 0);
      if (an.peg) pelY -= Math.max(0, Math.sin(ph + (an.peg === 'L' ? Math.PI : 0))) * 0.05 * Math.min(1, sp);
      lean = lean + sp * 0.09 + cr * 0.12 - stag * 0.25;
      setL(J.pelvis, 0, pelY, 0);
      setL(J.chest, 0, pelY + 0.42 * s, lean * 0.42);
      setL(J.neck, 0, pelY + 0.58 * s, lean * 0.6 + 0.01);
      setL(J.head, 0, pelY + 0.71 * s, lean * 0.7 + 0.03 + (an.pitch || 0) * 0.04);
    }
    const cx = L[3], cy = L[4], cz = L[5];
    const ct = Math.cos(tw), st = Math.sin(tw), shw = 0.2 * sw * s;
    const shY = crawl ? cy + 0.02 : cy + 0.07 * s;
    setL(J.shR, cx + ct * shw, shY, cz - st * shw);
    setL(J.shL, cx - ct * shw, shY, cz + st * shw);
    const px = L[0], py = L[1], pz = L[2];
    setL(J.hipR, px + 0.1 * sw * s, py - 0.04, pz); setL(J.hipL, px - 0.1 * sw * s, py - 0.04, pz);
    const ul = 0.3 * s, fl = 0.3 * s, th = 0.45 * s, sh = 0.45 * s;
    for (const side of [1, -1]) {
      const hip = side > 0 ? J.hipR : J.hipL, kn = side > 0 ? J.knR : J.knL, ft = side > 0 ? J.ftR : J.ftL, name = side > 0 ? 'legR' : 'legL';
      const hx = L[hip * 3], hyy = L[hip * 3 + 1], hz = L[hip * 3 + 2];
      let tx, ty, tz, pzp = 1, pyp = 0;
      if (crawl) { tx = hx + side * 0.08; ty = 0.06; tz = hz - 0.8 + Math.sin(ph + (side > 0 ? 0 : Math.PI)) * 0.08; pyp = 1; pzp = 0; }
      else if (chair) { tx = side * 0.13; ty = 0.14; tz = 0.46; }
      else if (atk && atk.kind === 'kick' && side > 0) {
        const k = atk.t < 0.3 ? ease(atk.t / 0.3) * 0.3 : atk.t < 0.6 ? 0.3 + ease((atk.t - 0.3) / 0.3) * 0.7 : 1 - ease((atk.t - 0.6) / 0.4);
        tx = side * 0.1; ty = lerp(0.02, 0.45 + (an.aim || 0) * 0.25, k); tz = lerp(0.05, 0.85, k);
      }
      else if (air) { tx = side * 0.12; ty = pelY - 0.75 * s; tz = side * 0.08; }
      else {
        const lph = ph + (side > 0 ? 0 : Math.PI);
        const stride = (an.peg === (side > 0 ? 'R' : 'L') ? 0.2 : 0.38) * Math.min(1.2, sp) * s;
        const strafe = (an.side || 0) * 0.22 * Math.sin(lph);
        tx = side * (0.11 + cr * 0.08) * s + strafe; tz = Math.sin(lph) * stride + (an.back ? 0 : 0.02);
        ty = Math.max(0, Math.cos(lph)) * 0.16 * Math.min(1, sp);
        if (cr > 0) tz += 0.1 * cr * side;
      }
      if (!legOK(name) && !crawl && !chair) { tx = hx; ty = hyy - 0.25; tz = hz + 0.1; }
      ik(hx, hyy, hz, tx, ty, tz, th, sh, 0, pyp, pzp, L, kn * 3);
    }
    const shield = a.offLook === 'shield' && !gone('armL');
    const twoH = an.twoHand;
    for (const side of [1, -1]) {
      const shJ = side > 0 ? J.shR : J.shL, el = side > 0 ? J.elR : J.elL, name = side > 0 ? 'armR' : 'armL';
      const sx = L[shJ * 3], sy = L[shJ * 3 + 1], sz = L[shJ * 3 + 2];
      const lph = ph + (side > 0 ? Math.PI : 0);
      let tx = sx + side * 0.04, ty = sy - 0.55 * s, tz = sz + Math.sin(lph) * 0.22 * Math.min(1, sp);
      let ppx = side * 0.3, ppy = 0, ppz = -1;
      const main = side === (an.leftMain ? -1 : 1);
      if (crawl) { tx = sx + side * 0.12; ty = 0.04; tz = sz + 0.42 + Math.sin(lph) * 0.18; ppx = side; ppz = 0; ppy = 1; }
      else if (chair) { tx = side * 0.34; ty = 0.62 + Math.sin(lph) * 0.06; tz = 0.02 + Math.cos(lph) * 0.14; }
      else if (an.mode === 'bow') {
        const dr = an.draw || 0, pt = clamp(an.pitch || 0, -1, 1);
        const bowH = [0.02, sy + pt * 0.45, sz + 0.62];
        if (side < 0) { tx = bowH[0] - 0.02; ty = bowH[1]; tz = bowH[2]; ppx = -1; ppz = 0; ppy = -0.3; }
        else { tx = lerp(bowH[0] + 0.04, 0.16, dr); ty = lerp(bowH[1], sy + 0.02, dr); tz = lerp(bowH[2] - 0.05, sz - 0.12, dr); ppx = 1; ppz = 0; ppy = -0.4; }
      } else if (an.mode === 'xbow') {
        const pt = clamp(an.pitch || 0, -1, 1);
        tx = side * 0.08; ty = sy - 0.1 + pt * 0.3; tz = sz + (side > 0 ? 0.3 : 0.5);
      } else if (main && hand) { tx = hand[0] * (an.leftMain ? -1 : 1); ty = hand[1]; tz = hand[2]; }
      else if (!main && twoH && hand) { tx = hand[0] * 0.6 - 0.08; ty = hand[1] - 0.06; tz = hand[2] - 0.06; ppx = -0.6; ppy = -0.3; }
      else if (an.block > 0 && side < 0 && shield) { const k = an.block; tx = lerp(tx, -0.04, k); ty = lerp(ty, 1.3 * s, k); tz = lerp(tz, sz + 0.42, k); ppx = -1; ppz = -0.3; }
      else if (an.block > 0 && main && !shield) { const k = an.block; tx = lerp(tx, 0.08, k); ty = lerp(ty, 1.5 * s, k); tz = lerp(tz, sz + 0.36, k); }
      else if (main && an.armed && an.wlook) {
        if (twoH) { tx = 0.2; ty = 1.0 * s; tz = sz + 0.3; } else { tx = 0.26; ty = 1.0 * s; tz = sz + 0.22 + Math.sin(lph) * 0.06 * sp; }
      } else if (!main && twoH && an.armed) { tx = 0.04; ty = 0.92 * s; tz = sz + 0.32; }
      else if (side < 0 && shield) { tx = -0.3; ty = 1.0 * s; tz = sz + 0.15; }
      if (an.torch && side < 0 && !shield && !twoH && an.mode !== 'bow') { tx = -0.3; ty = 1.25 * s; tz = sz + 0.3; }
      if (gone(name) && !(a.pros && a.pros[name])) { tx = sx + side * 0.05; ty = sy - 0.2; tz = sz; }
      ik(sx, sy, sz, tx, ty, tz, ul, fl, ppx, ppy, ppz, L, el * 3);
    }
    const yaw = a.yaw || 0, c = Math.cos(yaw), sn = Math.sin(yaw);
    const ox = a.x, oy = a.y, oz = a.z;
    for (let j = 0; j < NJ; j++) {
      const lx = L[j * 3], ly = L[j * 3 + 1], lz = L[j * 3 + 2];
      out[j * 3] = ox + lx * c + lz * sn;
      out[j * 3 + 1] = oy + ly;
      out[j * 3 + 2] = oz + lx * sn - lz * c;
    }
    if (ground && !crawl && !chair && !air) {
      for (const f of [J.ftL, J.ftR]) {
        const g = ground(out[f * 3], out[f * 3 + 2]) - oy;
        const adj = clamp(g, -0.35, 0.35);
        if (Math.abs(adj) > 0.02) {
          out[f * 3 + 1] += adj;
          const kn = f - 1;
          out[kn * 3 + 1] += adj * 0.5;
        }
      }
    }
    let wdir = null, whand = null;
    const mainHand = an.leftMain ? J.haL : J.haR;
    if (dir) {
      const dx = dir[0] * (an.leftMain ? -1 : 1), dy = dir[1], dz = dir[2];
      wdir = [dx * c + dz * sn, dy, dx * sn - dz * c];
    } else if (an.armed) {
      const dx = an.mode === 'xbow' ? 0 : 0.05, dy = an.mode === 'xbow' ? 0.05 : (an.block > 0 && !shield ? 0.2 : 0.75), dz = an.mode === 'xbow' ? 1 : (an.block > 0 && !shield ? 0.4 : 0.66);
      const bx = an.block > 0 && !shield ? -1 : dx;
      wdir = norm3([bx * c + dz * sn, dy, bx * sn - dz * c]);
    }
    whand = [out[mainHand * 3], out[mainHand * 3 + 1], out[mainHand * 3 + 2]];
    return { wdir, whand, yawC: c, yawS: sn };
  }

  function quadPose(a, out) {
    const q = QUAD[a.kindBody] || QUAD.cow, s = a.scale || 1;
    const an = a.anim || {}, ph = an.phase || 0, sp = clamp(an.speed || 0, 0, 1.6);
    const graze = an.graze || 0;
    const loc = [];
    const bob = Math.abs(Math.sin(ph * 2)) * 0.03 * sp;
    loc[Q.hip] = [0, q.h * s + bob, -q.len / 2 * s];
    loc[Q.sh] = [0, q.h * s + bob + 0.04, q.len / 2 * s];
    const nUp = lerp(q.neckUp, -q.h * 0.75, graze), nF = lerp(q.neckF, q.neckF * 0.8, graze);
    loc[Q.neck] = [0, loc[Q.sh][1] + nUp * s, loc[Q.sh][2] + nF * s];
    const ha = an.atk ? Math.sin(clamp(an.atk.t, 0, 1) * Math.PI) * 0.25 : 0;
    loc[Q.head] = [0, loc[Q.neck][1] - (0.08 + graze * 0.1) * s, loc[Q.neck][2] + (q.head + ha) * s];
    const legs = [[Q.fl, -1, 1, 0], [Q.fr, 1, 1, Math.PI], [Q.rl, -1, -1, Math.PI], [Q.rr, 1, -1, 0]];
    for (const [j, side, fr, off] of legs) {
      const base = fr > 0 ? loc[Q.sh] : loc[Q.hip];
      const lph = ph + off;
      loc[j] = [side * q.legSpread * s, Math.max(0, Math.cos(lph)) * 0.1 * Math.min(1, sp), base[2] + Math.sin(lph) * 0.3 * Math.min(1.2, sp) * s];
    }
    loc[Q.tail] = [Math.sin(ph * 0.7) * 0.1, loc[Q.hip][1] - 0.45 * s, loc[Q.hip][2] - 0.18 * s];
    const yaw = a.yaw || 0, c = Math.cos(yaw), sn = Math.sin(yaw);
    for (let j = 0; j < QNJ; j++) {
      const [lx, ly, lz] = loc[j];
      out[j * 3] = a.x + lx * c + lz * sn; out[j * 3 + 1] = a.y + ly; out[j * 3 + 2] = a.z + lx * sn - lz * c;
    }
    return { wdir: null, whand: null, yawC: c, yawS: sn };
  }

  function capsules(a, joints) {
    const res = [];
    if (a.quad) {
      const q = QUAD[a.kindBody] || QUAD.cow;
      for (const sg of QSEGS) {
        if (sg.tail) continue;
        const ax = joints[sg.a * 3], ay = joints[sg.a * 3 + 1], az = joints[sg.a * 3 + 2];
        let bx = joints[sg.b * 3], by = joints[sg.b * 3 + 1], bz = joints[sg.b * 3 + 2];
        if (sg.leg) { bx = lerp(ax, bx, 0.5); by = lerp(ay, by, 0.5); bz = lerp(az, bz, 0.5); }
        res.push({ part: sg.part, lower: false, a: [ax, ay, az], b: [bx, by, bz], r: sg.body ? q.h * 0.36 : sg.r });
      }
      return res;
    }
    const limb = a.limbs || {};
    for (const sg of SEGS) {
      const lb = limb[sg.part];
      if (lb && lb.state === 'lost' && (lb.cut === 'upper' || sg.lower || sg.part === 'head')) {
        if (!(a.pros && a.pros[sg.part])) continue;
      }
      const ax = joints[sg.a * 3], ay = joints[sg.a * 3 + 1], az = joints[sg.a * 3 + 2];
      let bx = joints[sg.b * 3], by = joints[sg.b * 3 + 1], bz = joints[sg.b * 3 + 2];
      let r = sg.r;
      if (sg.head) { by += 0.1; }
      if (sg.part === 'torso') { r = sg.r * (a.female ? 0.92 : 1); }
      res.push({ part: sg.part, lower: !!sg.lower, a: [ax, ay, az], b: [bx, by, bz], r });
    }
    return res;
  }

  function sweepHit(caps, p0, p1, rad) {
    let best = null, bd = Infinity;
    for (const c of caps) {
      const r = segSegDist2(p0, p1, c.a, c.b), lim = c.r + rad;
      if (r.d2 < lim * lim) { const score = Math.sqrt(r.d2) - c.r + r.s * 0.1; if (score < bd) { bd = score; best = { cap: c, s: r.s, t: r.t }; } }
    }
    return best;
  }

  class Ragdoll {
    constructor(joints, nj, links, vel, opts = {}) {
      this.nj = nj;
      this.p = Float32Array.from(joints.subarray ? joints.subarray(0, nj * 3) : joints.slice(0, nj * 3));
      this.o = Float32Array.from(this.p);
      if (vel) for (let j = 0; j < nj; j++) { this.o[j * 3] -= vel[0] * 0.016; this.o[j * 3 + 1] -= vel[1] * 0.016; this.o[j * 3 + 2] -= vel[2] * 0.016; }
      this.on = new Uint8Array(nj).fill(1);
      this.links = [];
      for (const [a, b] of links) {
        const dx = this.p[a * 3] - this.p[b * 3], dy = this.p[a * 3 + 1] - this.p[b * 3 + 1], dz = this.p[a * 3 + 2] - this.p[b * 3 + 2];
        this.links.push([a, b, Math.hypot(dx, dy, dz)]);
      }
      this.rad = opts.rad || 0.08;
      this.sleep = 0; this.asleep = false; this.age = 0;
    }
    kick(j, vx, vy, vz) { this.o[j * 3] -= vx * 0.016; this.o[j * 3 + 1] -= vy * 0.016; this.o[j * 3 + 2] -= vz * 0.016; this.asleep = false; this.sleep = 0; }
    remove(list) {
      for (const j of list) this.on[j] = 0;
      this.links = this.links.filter(([a, b]) => this.on[a] && this.on[b]);
    }
    step(dt, ground) {
      if (this.asleep) return;
      this.age += dt;
      const p = this.p, o = this.o, g = -13 * dt * dt;
      let motion = 0;
      for (let j = 0; j < this.nj; j++) {
        if (!this.on[j]) continue;
        const i = j * 3;
        const vx = (p[i] - o[i]) * 0.985, vy = (p[i + 1] - o[i + 1]) * 0.985, vz = (p[i + 2] - o[i + 2]) * 0.985;
        o[i] = p[i]; o[i + 1] = p[i + 1]; o[i + 2] = p[i + 2];
        p[i] += vx; p[i + 1] += vy + g; p[i + 2] += vz;
        motion += Math.abs(vx) + Math.abs(vy) + Math.abs(vz);
      }
      for (let it = 0; it < 6; it++) {
        for (const [a, b, len] of this.links) {
          const ia = a * 3, ib = b * 3;
          const dx = p[ib] - p[ia], dy = p[ib + 1] - p[ia + 1], dz = p[ib + 2] - p[ia + 2];
          const d = Math.hypot(dx, dy, dz) || 1e-5, k = (d - len) / d * 0.5;
          p[ia] += dx * k; p[ia + 1] += dy * k; p[ia + 2] += dz * k;
          p[ib] -= dx * k; p[ib + 1] -= dy * k; p[ib + 2] -= dz * k;
        }
        for (let j = 0; j < this.nj; j++) {
          if (!this.on[j]) continue;
          const i = j * 3, gy = ground(p[i], p[i + 2], p[i + 1]) + this.rad;
          if (p[i + 1] < gy) {
            p[i + 1] = gy;
            o[i] = lerp(o[i], p[i], 0.35); o[i + 2] = lerp(o[i + 2], p[i + 2], 0.35);
            if (o[i + 1] < gy) o[i + 1] = lerp(o[i + 1], gy, 0.6);
          }
        }
      }
      if (motion < 0.004 * this.nj && this.age > 0.6) { this.sleep += dt; if (this.sleep > 0.8) this.asleep = true; } else this.sleep = 0;
    }
    center() {
      let x = 0, y = 0, z = 0, n = 0;
      for (let j = 0; j < this.nj; j++) if (this.on[j]) { x += this.p[j * 3]; y += this.p[j * 3 + 1]; z += this.p[j * 3 + 2]; n++; }
      return n ? [x / n, y / n, z / n] : [0, 0, 0];
    }
  }

  function limbPiece(joints, part, cut, vel) {
    const ids = LIMB_JOINTS[part][cut === 'upper' ? 'upper' : 'lower'];
    const pts = new Float32Array(ids.length * 3);
    ids.forEach((j, k) => { pts[k * 3] = joints[j * 3]; pts[k * 3 + 1] = joints[j * 3 + 1]; pts[k * 3 + 2] = joints[j * 3 + 2]; });
    const links = [];
    for (let k = 0; k < ids.length - 1; k++) links.push([k, k + 1]);
    const r = new Ragdoll(pts, ids.length, links, vel, { rad: 0.06 });
    r.ids = ids;
    return r;
  }

  K.Body = { J, NJ, SEGS, LIMB_JOINTS, RAG_LINKS, Q, QNJ, QSEGS, QRAG_LINKS, QUAD, ATK, pose, quadPose, capsules, sweepHit, Ragdoll, limbPiece, weaponPose, ik };
})(globalThis.Korovany = globalThis.Korovany || {});
