(function (S, B) {
  'use strict';
  const C = B.C;
  const TAU = Math.PI * 2;

  const skin = L => L.skin || C.skin;

  function dims(L) {
    const k = (L.h || 150) / 150;
    const w = L.wide || 1;
    return {
      k, w,
      headY: -129 * k, rx: 12 * (L.headW || 1), ry: 14.5 * (L.headH || 1),
      neckY: -115 * k, shY: -109 * k, shW: 15.5 * w, hipY: -70 * k, hipW: 6.5 * w,
      thigh: 34 * k, shin: 33 * k, upper: 24 * k, fore: 22 * k
    };
  }

  function joints(o, L) {
    const d = dims(L);
    const side = o.dir === 'e' || o.dir === 'w', back = o.dir === 'n';
    const walking = o.walk >= 0;
    const ph = walking ? o.walk : 0;
    const bob = walking ? -Math.abs(Math.sin(ph * TAU)) * 2.2 * d.k : 0;
    const legs = [], arms = [];
    if (o.act === 'sit') {
      const hy = -42 * d.k;
      for (const near of [false, true]) {
        const hx = side ? (near ? 2 : -2) : (near ? d.hipW : -d.hipW);
        const knee = side ? { x: hx + d.thigh, y: hy + 2 } : { x: hx * 2.1, y: hy + 9 };
        const ankle = side ? { x: knee.x + 2, y: 0 } : { x: hx * 1.7, y: 0 };
        legs.push({ hip: { x: hx, y: hy }, knee, ankle, near });
      }
      return finish(o, L, d, side, back, legs, arms, 0, 28 * d.k);
    }
    for (const near of [false, true]) {
      const p = ph + (near ? 0 : 0.5);
      if (side) {
        const th = walking ? Math.sin(p * TAU) * 0.44 : (near ? 0.04 : -0.04);
        const bend = walking ? Math.max(0, Math.cos(p * TAU)) * 0.75 : 0;
        const hip = { x: near ? 1 : -1, y: d.hipY + bob };
        const knee = { x: hip.x + Math.sin(th) * d.thigh, y: hip.y + Math.cos(th) * d.thigh };
        const sa = th - bend;
        const ankle = { x: knee.x + Math.sin(sa) * d.shin, y: knee.y + Math.cos(sa) * d.shin };
        legs.push({ hip, knee, ankle, near });
      } else {
        const sx = near ? d.hipW : -d.hipW;
        const lift = walking ? Math.max(0, Math.sin(p * TAU)) * 6 * d.k : 0;
        const hip = { x: sx, y: d.hipY + bob };
        const ankle = { x: sx * 1.12, y: -lift };
        const knee = { x: sx * 1.08, y: (hip.y + ankle.y) / 2 - lift * 0.2 };
        legs.push({ hip, knee, ankle, near });
      }
    }
    return finish(o, L, d, side, back, legs, arms, bob, 0);
  }

  function finish(o, L, d, side, back, legs, arms, bob, drop) {
    const ph = o.walk >= 0 ? o.walk : 0;
    const walking = o.walk >= 0;
    const base = bob + drop;
    for (const near of [false, true]) {
      const sgn = near ? 1 : -1;
      if (side) {
        const sh = { x: near ? 1 : -2, y: d.shY + 4 + base };
        let a = walking ? -Math.sin((ph + (near ? 0 : 0.5)) * TAU) * 0.4 : (near ? 0.06 : -0.06);
        let e = a + 0.22;
        if (o.act === 'reach' && near) { a = 1.35; e = 1.5; }
        if (o.act === 'hold' && near) { a = 0.5; e = 1.7; }
        if (o.act === 'hips' && !walking) { a = near ? -0.5 : 0.4; e = near ? 0.8 : -0.4; }
        if (o.act === 'sit') { a = near ? 0.35 : 0.2; e = 1.1; }
        let elbow = { x: sh.x + Math.sin(a) * d.upper, y: sh.y + Math.cos(a) * d.upper };
        let hand = { x: elbow.x + Math.sin(e) * d.fore, y: elbow.y + Math.cos(e) * d.fore };
        if (o.act === 'horn' && near) { elbow = { x: sh.x + 10, y: sh.y + 13 }; hand = { x: 12, y: d.headY + base + 9 }; }
        if (o.act === 'guitar') {
          const hy = d.hipY + base;
          if (near) { elbow = { x: sh.x + 2, y: sh.y + 21 }; hand = { x: 9, y: hy - 4 }; }
          else { elbow = { x: sh.x + 13, y: sh.y + 15 }; hand = { x: 30, y: hy - 22 }; }
        }
        arms.push({ sh, elbow, hand, near });
      } else {
        const sh = { x: sgn * d.shW, y: d.shY + 3 + base };
        const swing = walking ? Math.sin((ph + (near ? 0 : 0.5)) * TAU) * 3 * d.k : 0;
        let elbow = { x: sgn * (d.shW + 2.5), y: sh.y + d.upper };
        let hand = { x: sgn * (d.shW + 1.5), y: elbow.y + d.fore - Math.abs(swing) };
        if (o.act === 'reach' && near) { elbow = { x: sgn * (d.shW + 8), y: sh.y + 12 }; hand = { x: sgn * (d.shW + 14), y: sh.y - 4 }; }
        if (o.act === 'guitar') { const hy = d.hipY + base; if (near) { elbow = { x: d.shW + 3, y: sh.y + 22 }; hand = { x: 1, y: hy - 5 }; } else { elbow = { x: -d.shW - 7, y: sh.y + 14 }; hand = { x: -25, y: hy - 25 }; } }
        if (o.act === 'hold' && near) { elbow = { x: sgn * (d.shW + 4), y: sh.y + 21 }; hand = { x: sgn * (d.shW - 2), y: sh.y + 30 }; }
        if (o.act === 'horn' && near) { elbow = { x: d.shW + 5, y: sh.y + 10 }; hand = { x: 6, y: d.headY + base + 10 }; }
        if (o.act === 'hips' && !walking) { elbow = { x: sgn * (d.shW + 9), y: sh.y + 18 }; hand = { x: sgn * (d.shW - 3), y: sh.y + 32 }; }
        if (o.act === 'sit') { elbow = { x: sgn * (d.shW + 4), y: sh.y + 22 }; hand = { x: sgn * (d.shW + 2), y: sh.y + 38 }; }
        arms.push({ sh, elbow, hand, near });
      }
    }
    return { d, side, back, legs, arms, head: { x: side ? 2 : 0, y: d.headY + base }, neck: { x: side ? 1 : 0, y: d.neckY + base }, shY: d.shY + base, hipY: d.hipY + base, base };
  }

  function limb(P, a, b, c, r0, r1, r2, ramp, br) {
    P.part(P.cap(a.x, a.y, b.x, b.y, r0, r1).union(P.cap(b.x, b.y, c.x, c.y, r1, r2)), ramp, { b: br, sh: 1 });
  }

  function shoe(P, j, L, side, br) {
    const a = j.ankle;
    if (side) {
      P.part(P.path(`M ${a.x - 5} ${a.y - 6} Q ${a.x + 4} ${a.y - 8} ${a.x + 11} ${a.y - 3} L ${a.x + 12} ${a.y + 1} L ${a.x - 6} ${a.y + 1} Z`), L.shoes, { b: br, sh: 1 });
      if (L.sole) P.part(P.rect(a.x - 6, a.y - 1, 18, 2), L.sole, { b: 2, sh: 0, hi: 0 });
    } else {
      P.part(P.path(`M ${a.x - 5} ${a.y - 6} Q ${a.x} ${a.y - 9} ${a.x + 5} ${a.y - 6} L ${a.x + 6} ${a.y + 1} L ${a.x - 6} ${a.y + 1} Z`), L.shoes, { b: br, sh: 1 });
      if (L.sole) P.part(P.rect(a.x - 6, a.y - 1, 12, 2), L.sole, { b: 2, sh: 0, hi: 0 });
    }
  }

  function legs(P, J, L, which) {
    for (const j of J.legs) {
      if (which !== undefined && j.near !== which) continue;
      const br = J.side && !j.near ? 2 : 3;
      limb(P, j.hip, j.knee, j.ankle, 6.4 * J.d.w, 5.4 * J.d.w, 4.6 * J.d.w, L.legs, br);
      if (L.stripe && J.side) { P.line(j.hip.x, j.hip.y + 3, j.knee.x, j.knee.y, L.stripe); P.line(j.knee.x, j.knee.y, j.ankle.x - 1, j.ankle.y - 6, L.stripe); }
      if (L.stripe && !J.side) P.line(j.hip.x + (j.near ? 5 : -5), j.hip.y + 3, j.ankle.x + (j.near ? 4 : -4), j.ankle.y - 6, L.stripe);
      if (L.pin) for (const k of [-2, 2]) { P.line(j.hip.x + k, j.hip.y + 3, j.knee.x + k, j.knee.y, L.pin); P.line(j.knee.x + k, j.knee.y, j.ankle.x + k * 0.8, j.ankle.y - 6, L.pin); }
      shoe(P, j, L, J.side, br);
    }
  }

  function hand(P, at, br, L) { P.part(P.ell(at.x, at.y + 1, 3.6, 4), skin(L), { b: br, sh: 1 }); }

  function arm(P, J, a, L) {
    const br = J.side && !a.near ? 2 : 3;
    const sl = L.sleeve || L.coat;
    limb(P, a.sh, a.elbow, a.hand, 5.4 * J.d.w, 4.8 * J.d.w, 4.2 * J.d.w, sl, br);
    if (L.cuff) {
      const t = 0.78;
      const cx = a.elbow.x + (a.hand.x - a.elbow.x) * t, cy = a.elbow.y + (a.hand.y - a.elbow.y) * t;
      P.part(P.cap(cx, cy, a.elbow.x + (a.hand.x - a.elbow.x) * 0.95, a.elbow.y + (a.hand.y - a.elbow.y) * 0.95, 4.6, 4.4), L.cuff, { b: 3, sh: 0, hi: 0 });
    }
    if (L.stripe) P.line(a.sh.x, a.sh.y + 2, a.hand.x, a.hand.y - 3, L.stripe);
    if (L.pin) { P.line(a.sh.x, a.sh.y + 3, a.elbow.x, a.elbow.y, L.pin); P.line(a.elbow.x, a.elbow.y, a.hand.x, a.hand.y - 4, L.pin); }
    hand(P, a.hand, br, L);
  }

  function torso(P, J, L) {
    const d = J.d, top = J.shY, bot = J.hipY + (L.hem || 6);
    const bw = (L.belly || 0) * d.w;
    if (J.side) {
      const f = 11.5 * d.w + bw, b = -11 * d.w;
      P.part(P.path(`M ${b} ${top + 2} Q ${b - 2} ${top} ${0} ${top - 2} Q ${f - 2} ${top} ${f - 1} ${top + 6} Q ${f + bw * 0.6} ${(top + bot) / 2 + 6} ${f - 2} ${bot} L ${b + 1} ${bot} Q ${b - 2} ${(top + bot) / 2} ${b} ${top + 2} Z`), L.coat, { b: 3 });
      return { f, b, top, bot };
    }
    const sw = d.shW + 1.5, hw = 12.5 * d.w + bw;
    P.part(P.path(`M ${-sw} ${top + 3} Q ${-sw + 1} ${top - 1} ${-sw + 6} ${top - 2} L ${sw - 6} ${top - 2} Q ${sw - 1} ${top - 1} ${sw} ${top + 3} Q ${sw + bw * 0.5} ${(top + bot) / 2} ${hw} ${bot} L ${-hw} ${bot} Q ${-sw - bw * 0.5} ${(top + bot) / 2} ${-sw} ${top + 3} Z`), L.coat, { b: 3 });
    return { sw, hw, top, bot };
  }

  function face(P, J, L, o) {
    const h = J.head, d = J.d;
    const rx = d.rx, ry = d.ry;
    const expr = o.face || L.face || 'neutral';
    if (J.side) {
      P.part(P.ell(h.x - 1, h.y + 1, rx * 0.95, ry), skin(L), { b: 3 });
      P.part(P.path(`M ${h.x + rx * 0.7} ${h.y - 2} Q ${h.x + rx + 3} ${h.y + 1} ${h.x + rx - 0.5} ${h.y + 4} Z`), skin(L), { b: 3, sh: 0 });
      P.part(P.ell(h.x - 4, h.y + 1, 2.6 * (L.earK || 1), 3.6 * (L.earK || 1)), skin(L), { b: 2, sh: 0, hi: 0 });
      const ey = h.y - 1.5;
      if (o.blink) P.line(h.x + 4, ey, h.x + 7, ey, skin(L)[0]);
      else { P.part(P.ell(h.x + 5.6, ey, 1.8, 2.1), C.eye, { b: 0, sh: 0, hi: 0, ol: 0 }); P.part(P.ell(h.x + 6.4, ey, 1, 1.4), L.eyes || C.pupil, { b: 1, sh: 0, hi: 0, ol: 0 }); }
      P.line(h.x + 3, ey - 4 + (expr === 'worried' ? 1 : 0), h.x + 8, ey - (expr === 'angry' ? 3 : 4) - (expr === 'worried' ? 1 : 0), L.brow || C.hair[0]);
      if (o.talk) P.part(P.ell(h.x + 6.5, h.y + 7.5, 2.4, 1.8), C.maroon, { b: 1, sh: 0, hi: 0 });
      else if (expr === 'smile') P.curve(`M ${h.x + 4} ${h.y + 7} Q ${h.x + 7} ${h.y + 9} ${h.x + 9} ${h.y + 6}`, skin(L)[0]);
      else P.line(h.x + 4.5, h.y + 7.5, h.x + 8.5, h.y + 7.5, skin(L)[0]);
      return;
    }
    P.part(P.ell(h.x, h.y + 1, rx, ry), skin(L), { b: 3 });
    if (J.back) return;
    for (const sx of [-1, 1]) P.part(P.ell(h.x + sx * (rx - 0.5 + ((L.earK || 1) - 1) * 2), h.y + 1, 2.2 * (L.earK || 1), 3.6 * (L.earK || 1)), skin(L), { b: 2, sh: 0, hi: 0 });
    const ey = h.y - 1;
    for (const sx of [-1, 1]) {
      const ex = h.x + sx * 4.4;
      if (o.blink) P.line(ex - 2, ey, ex + 2, ey, skin(L)[0]);
      else { P.part(P.ell(ex, ey, 2.3, 2), C.eye, { b: 0, sh: 0, hi: 0, ol: 0 }); P.part(P.ell(ex + sx * 0.3, ey + 0.2, 1.1, 1.4), L.eyes || C.pupil, { b: 1, sh: 0, hi: 0, ol: 0 }); }
      const bi = expr === 'worried' ? 1.5 : expr === 'angry' ? -1.5 : 0;
      P.line(ex - 2.5, ey - 3.6 + (sx < 0 ? -bi : bi) * 0.5, ex + 2.5, ey - 3.6 - (sx < 0 ? -bi : bi) * 0.5, L.brow || C.hair[0]);
    }
    P.line(h.x + 0.5, h.y + 1, h.x + 1.5, h.y + 4, skin(L)[1]);
    if (o.talk) P.part(P.ell(h.x, h.y + 8, 3, 2.2), C.maroon, { b: 1, sh: 0, hi: 0 });
    else if (expr === 'smile') P.curve(`M ${h.x - 3.5} ${h.y + 7} Q ${h.x} ${h.y + 10} ${h.x + 3.5} ${h.y + 7}`, skin(L)[0]);
    else if (expr === 'worried' || expr === 'angry') P.curve(`M ${h.x - 3} ${h.y + 9} Q ${h.x} ${h.y + 7} ${h.x + 3} ${h.y + 9}`, skin(L)[0]);
    else P.line(h.x - 2.5, h.y + 8, h.x + 2.5, h.y + 8, skin(L)[0]);
  }

  function neck(P, J, L) { P.part(P.rect(J.neck.x - 3.5, J.neck.y - 4, 7, 10), skin(L), { b: 2, sh: 0, hi: 0 }); }

  function draw(P, o, L) {
    const J = joints(o, L);
    if (J.side) {
      arm(P, J, J.arms[0], L);
      legs(P, J, L, false);
      legs(P, J, L, true);
      if (L.under) L.under(P, J, o);
      const T = torso(P, J, L);
      if (L.over) L.over(P, J, T, o);
      neck(P, J, L);
      if (L.hairBack) L.hairBack(P, J, o);
      face(P, J, L, o);
      if (L.hair) L.hair(P, J, o);
      if (L.prop) L.prop(P, J, o);
      arm(P, J, J.arms[1], L);
      if (L.hand) L.hand(P, J, o);
      return;
    }
    legs(P, J, L);
    if (J.back) for (const a of J.arms) arm(P, J, a, L);
    if (L.under) L.under(P, J, o);
    const T = torso(P, J, L);
    if (L.over) L.over(P, J, T, o);
    neck(P, J, L);
    if (L.collar) L.collar(P, J, T, o);
    if (!J.back && L.hairBack) L.hairBack(P, J, o);
    face(P, J, L, o);
    if (L.hair) L.hair(P, J, o);
    if (!J.back) {
      if (L.prop) L.prop(P, J, o);
      for (const a of J.arms) arm(P, J, a, L);
      if (L.hand) L.hand(P, J, o);
    }
  }

  B.rig = { dims, joints, limb, legs, arm, torso, face, neck, draw, hand, TAU };
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
