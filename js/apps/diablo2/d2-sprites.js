(function (D) {
  'use strict';
  const PX = 32, PY = 16, PZ = 36;
  const TAU = Math.PI * 2;

  const BASE = { lean: 0, bob: 0, twist: 0, crouch: 0, lsp: 0.12, lsa: 0.14, lel: 0.3, rsp: 0.12, rsa: 0.14, rel: 0.3, lhp: 0, lkn: 0.05, rhp: 0, rkn: 0.05, wp: -1.0, wy: 0.25, sh: 0, fall: 0, spin: 0, jump: 0, head: 0, both: 0, sway: 0, lsp2: 0 };

  function lerpPose(a, b, t) {
    const o = {};
    for (const k in a) o[k] = a[k] + ((b[k] !== undefined ? b[k] : a[k]) - a[k]) * t;
    return o;
  }

  function keyed(keys, p) {
    let i = 0;
    while (i < keys.length - 1 && p > keys[i + 1][0]) i++;
    const [t0, k0] = keys[i];
    const [t1, k1] = keys[Math.min(i + 1, keys.length - 1)];
    const t = t1 > t0 ? D.smooth(D.clamp((p - t0) / (t1 - t0), 0, 1)) : 0;
    const a = Object.assign({}, BASE, k0), b = Object.assign({}, BASE, k1);
    return lerpPose(a, b, t);
  }

  const COMBAT = { lsp: 0.55, lel: 0.9, rsp: 0.45, rel: 0.7, wp: 0.35, wy: 0.1, lhp: 0.12, rhp: -0.12, lkn: 0.15, rkn: 0.2, crouch: 0.03 };

  const ATTACKS = {
    swing: [[0, COMBAT], [0.38, { rsp: 2.5, rsa: 0.5, rel: 0.9, wp: 1.9, wy: -0.6, twist: 0.5, lsp: 0.8, lel: 0.9, lhp: 0.2, rhp: -0.2, lkn: 0.2, rkn: 0.2, crouch: 0.05 }], [0.6, { rsp: 0.9, rsa: 0.2, rel: 0.1, wp: -0.5, wy: 0.7, twist: -0.45, lean: 0.25, lsp: 0.4, lhp: 0.4, rhp: -0.3, lkn: 0.35, rkn: 0.1, crouch: 0.08 }], [1, COMBAT]],
    attack2: [[0, COMBAT], [0.35, { rsp: 1.9, rsa: 1.0, rel: 0.4, wp: 0.3, wy: -1.4, twist: 0.7, lsp: 0.6 }], [0.62, { rsp: 1.3, rsa: -0.2, rel: 0.2, wp: 0.2, wy: 1.4, twist: -0.7, lean: 0.15, lhp: 0.3 }], [1, COMBAT]],
    thrust: [[0, COMBAT], [0.4, { rsp: 0.6, rel: 1.6, wp: 0.1, wy: 0, twist: 0.35, lean: -0.05, lsp: 0.7 }], [0.6, { rsp: 1.45, rel: 0.05, wp: 0.05, wy: 0, twist: -0.35, lean: 0.3, lhp: 0.45, rhp: -0.35, lkn: 0.4, crouch: 0.08 }], [1, COMBAT]],
    pole: [[0, Object.assign({}, COMBAT, { both: 1, wp: 0.3 })], [0.4, { rsp: 0.7, rel: 1.3, wp: 0.25, wy: 0, twist: 0.4, both: 1, lsp: 1.0, lel: 0.8 }], [0.6, { rsp: 1.5, rel: 0.1, wp: 0.1, wy: 0, twist: -0.2, both: 1, lean: 0.35, lhp: 0.5, lkn: 0.4, lsp: 1.3, lel: 0.3, crouch: 0.08 }], [1, Object.assign({}, COMBAT, { both: 1, wp: 0.3 })]],
    twohand: [[0, Object.assign({}, COMBAT, { both: 1, wp: 0.7 })], [0.42, { rsp: 2.8, rel: 0.5, wp: 2.4, wy: 0, twist: 0.3, both: 1, lsp: 2.6, lel: 0.6, lean: -0.15, lhp: 0.15, rhp: -0.2 }], [0.65, { rsp: 1.0, rel: 0.1, wp: -0.6, wy: 0, twist: -0.2, both: 1, lsp: 1.0, lel: 0.2, lean: 0.35, lhp: 0.45, lkn: 0.45, rkn: 0.1, crouch: 0.12 }], [1, Object.assign({}, COMBAT, { both: 1, wp: 0.7 })]],
    staff: [[0, Object.assign({}, COMBAT, { both: 1, wp: 0.9 })], [0.4, { rsp: 2.2, rel: 0.6, wp: 2.0, wy: -0.4, twist: 0.4, both: 1, lsp: 2.0 }], [0.62, { rsp: 1.0, rel: 0.2, wp: -0.2, wy: 0.5, twist: -0.4, both: 1, lsp: 0.9, lean: 0.3, lhp: 0.4 }], [1, Object.assign({}, COMBAT, { both: 1, wp: 0.9 })]],
    claw: [[0, Object.assign({}, COMBAT, { lsp: 0.9, lel: 1.2, rsp: 0.9, rel: 1.2, wp: 0.3 })], [0.3, { rsp: 0.5, rel: 1.8, lsp: 1.4, lel: 0.2, twist: -0.5, lean: 0.2, wp: 0.2 }], [0.6, { rsp: 1.5, rel: 0.1, lsp: 0.5, lel: 1.7, twist: 0.5, lean: 0.25, wp: 0.1, lhp: 0.4, lkn: 0.4 }], [1, Object.assign({}, COMBAT, { lsp: 0.9, lel: 1.2, rsp: 0.9, rel: 1.2 })]],
    hand: [[0, Object.assign({}, COMBAT, { rsp: 0.8, rel: 1.4 })], [0.35, { rsp: 0.4, rel: 2.0, twist: 0.4 }], [0.58, { rsp: 1.5, rel: 0.1, twist: -0.4, lean: 0.25, lhp: 0.35, lkn: 0.35 }], [1, Object.assign({}, COMBAT, { rsp: 0.8, rel: 1.4 })]],
    bow: [[0, { lsp: 1.35, lsa: 0.05, lel: 0.05, rsp: 1.35, rel: 0.6, twist: -0.25, wp: 0.05, wy: 0, lhp: 0.15, rhp: -0.15 }], [0.5, { lsp: 1.45, lsa: 0.0, lel: 0.0, rsp: 1.3, rsa: 0.5, rel: 2.1, twist: -0.4, wp: 0.05, wy: 0, lhp: 0.2, rhp: -0.2, draw: 1 }], [0.62, { lsp: 1.45, lel: 0, rsp: 1.0, rsa: 0.7, rel: 0.6, twist: -0.3, draw: 0 }], [1, { lsp: 1.3, lel: 0.1, rsp: 0.9, rel: 0.6, twist: -0.2 }]],
    xbow: [[0, { lsp: 1.3, lel: 0.3, rsp: 1.1, rel: 0.6, wp: 0.05, wy: 0, twist: -0.1 }], [0.6, { lsp: 1.4, lel: 0.2, rsp: 1.2, rel: 0.5, lean: -0.1 }], [1, { lsp: 1.3, lel: 0.3, rsp: 1.1, rel: 0.6 }]],
    throw: [[0, COMBAT], [0.4, { rsp: 2.7, rsa: 0.3, rel: 1.4, wp: 2.4, wy: 0, twist: 0.6, lean: -0.2, lsp: 1.2, lel: 0.2, lhp: 0.3, rhp: -0.4, rkn: 0.3 }], [0.6, { rsp: 1.4, rel: 0.1, wp: 0.2, twist: -0.5, lean: 0.35, lsp: 0.2, lhp: 0.5, lkn: 0.4, noWeapon: 1 }], [1, COMBAT]],
    kick: [[0, COMBAT], [0.35, { rhp: 0.2, rkn: 1.8, lean: -0.15, lsp: 0.8, rsp: 0.8, lel: 1.2, rel: 1.2, crouch: 0.02 }], [0.55, { rhp: 1.55, rkn: 0.05, lean: -0.3, lsp: 0.6, rsp: 0.5, lsa: 0.6, rsa: 0.6, lkn: 0.25, crouch: 0.06 }], [1, COMBAT]],
    cast: [[0, { lsp: 0.3, rsp: 0.3, lel: 0.4, rel: 0.4, wp: -0.8 }], [0.4, { lsp: 2.3, lsa: 0.5, rsp: 2.3, rsa: 0.5, lel: 0.5, rel: 0.5, lean: -0.15, head: -0.2, wp: 1.6, wy: 0 }], [0.62, { lsp: 1.45, lsa: 0.15, rsp: 1.45, rsa: 0.15, lel: 0.05, rel: 0.05, lean: 0.2, wp: 0.3, wy: 0, lhp: 0.3, lkn: 0.3 }], [1, { lsp: 0.3, rsp: 0.3, lel: 0.4, rel: 0.4, wp: -0.8 }]],
    special: [[0, COMBAT], [0.45, { lsp: 2.6, lsa: 1.0, rsp: 2.6, rsa: 1.0, lel: 0.3, rel: 0.3, head: -0.4, lean: -0.25, wp: 2.2, lhp: 0.2, rhp: -0.2, lkn: 0.1, crouch: -0.02 }], [0.7, { lsp: 2.4, lsa: 1.1, rsp: 2.4, rsa: 1.1, head: -0.5, lean: -0.3, wp: 2.2 }], [1, COMBAT]],
    block: [[0, COMBAT], [0.4, { lsp: 1.35, lsa: 0.1, lel: 0.8, sh: 1, rsp: 0.6, rel: 0.9, lean: -0.1, crouch: 0.08, lkn: 0.35, rkn: 0.35, lhp: 0.25 }], [1, { lsp: 1.35, lel: 0.8, sh: 1, crouch: 0.06, lkn: 0.3, rkn: 0.3 }]],
    hit: [[0, COMBAT], [0.35, { lean: -0.35, lsp: 0.9, lsa: 0.8, rsp: 0.9, rsa: 0.8, head: 0.4, lhp: -0.2, rhp: 0.2, crouch: 0.02 }], [1, COMBAT]],
    death: [[0, COMBAT], [0.25, { lean: -0.3, lsp: 1.6, lsa: 1.0, rsp: 1.6, rsa: 1.0, head: 0.4, lkn: 0.6, rkn: 0.6, crouch: 0.15 }], [0.8, { fall: 1, lsp: 2.4, lsa: 0.9, rsp: 2.2, rsa: 0.5, lkn: 0.4, rkn: 0.8, lhp: 0.3, rhp: 0.5, head: 0.3 }], [1, { fall: 1, lsp: 2.5, lsa: 0.9, rsp: 2.3, rsa: 0.5, lkn: 0.3, rkn: 0.9, lhp: 0.3, rhp: 0.5, head: 0.2 }]],
    leap: [[0, COMBAT], [0.2, { crouch: 0.25, lkn: 1.2, rkn: 1.2, lhp: 0.7, rhp: 0.7, lean: 0.3, rsp: 0.3, wp: -0.4 }], [0.55, { jump: 1, lkn: 1.4, rkn: 1.0, lhp: 0.9, rhp: 0.4, rsp: 2.6, rel: 0.6, wp: 2.2, lsp: 1.2, lean: -0.1 }], [0.85, { rsp: 0.9, rel: 0.1, wp: -0.6, lean: 0.4, crouch: 0.2, lkn: 1.0, rkn: 0.8, lhp: 0.6, rhp: 0.3 }], [1, COMBAT]],
    appear: [[0, { crouch: 0.9, lkn: 2.2, rkn: 2.2, lhp: 1.5, rhp: 1.5, lean: 0.6, lsp: 0.2, rsp: 0.2 }], [1, COMBAT]]
  };

  function pose(anim, p, o) {
    const cls = o.wclass || 'swing';
    switch (anim) {
      case 'idle': {
        const s = Math.sin(p * TAU);
        const c = o.combat ? COMBAT : { wp: o.staffy ? 1.3 : -1.0 };
        return Object.assign({}, BASE, c, { bob: s * 0.012, lsp: (c.lsp || BASE.lsp) + s * 0.03, rsp: (c.rsp || BASE.rsp) - s * 0.03, both: cls === 'twohand' || cls === 'pole' || cls === 'staff' ? 0.6 : 0, head: s * 0.03 });
      }
      case 'walk': case 'run': {
        const run = anim === 'run';
        const s = Math.sin(p * TAU), c = Math.cos(p * TAU);
        const A = run ? 0.75 : 0.45;
        const base = o.hunch ? { lean: 0.35, lsp: 0.7 + s * 0.3, rsp: 0.7 - s * 0.3, lel: 0.8, rel: 0.8 } : o.zombie ? { lsp: 1.35 + s * 0.1, rsp: 1.35 - s * 0.1, lel: 0.15, rel: 0.15, lean: 0.1 } : { lsp: -s * (run ? 0.7 : 0.4), rsp: s * (run ? 0.7 : 0.4), lel: run ? 1.3 : 0.35, rel: run ? 1.3 : 0.35 };
        return Object.assign({}, BASE, {
          lhp: s * A, rhp: -s * A, lkn: Math.max(0, -c) * (run ? 1.3 : 0.7) + 0.05, rkn: Math.max(0, c) * (run ? 1.3 : 0.7) + 0.05,
          bob: Math.abs(c) * (run ? 0.05 : 0.025), lean: run ? 0.25 : 0.04, wp: run ? 0.2 : -0.9, twist: s * 0.12, both: cls === 'twohand' || cls === 'pole' || cls === 'staff' ? 0.6 : 0
        }, base);
      }
      case 'attack': {
        const k = o.attackKind || (cls === 'thrust' ? 'thrust' : cls === 'pole' ? 'pole' : cls === 'twohand' ? 'twohand' : cls === 'staff' ? 'staff' : cls === 'claw' ? 'claw' : cls === 'hand' ? 'hand' : cls === 'bow' ? 'bow' : cls === 'xbow' ? 'xbow' : 'swing');
        return keyed(ATTACKS[k] || ATTACKS.swing, p);
      }
      case 'shoot': return keyed(ATTACKS.bow, p);
      case 'spin': return Object.assign({}, BASE, { lsp: 1.4, lsa: 1.3, rsp: 1.4, rsa: 1.3, lel: 0.1, rel: 0.1, wp: 0.1, wy: 1.3, spin: p * TAU * 2, lhp: Math.sin(p * TAU * 2) * 0.3, rhp: -Math.sin(p * TAU * 2) * 0.3, lean: 0.1 });
      case 'dead': return keyed(ATTACKS.death, 1);
      default: return keyed(ATTACKS[anim] || ATTACKS.hit, p);
    }
  }

  function unit(x, y, z) { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; }

  function bipedJoints(P, m) {
    const H = m.h;
    const k = H / 1.8;
    const build = m.build || 1;
    const hipW = 0.1 * build * k, shW = 0.2 * build * k;
    const Lt = 0.44 * k, Ls = 0.43 * k, Lu = 0.29 * k, Lf = 0.27 * k;
    const crouch = (P.crouch || 0) * k;
    const pelvisZ = 0.93 * k - crouch + P.bob * k + (P.jump || 0) * 0.6;
    const J = {};
    const leg = (side, hp, kn) => {
      const hip = [0, side * hipW, pelvisZ];
      const d1 = [Math.sin(hp), 0, -Math.cos(hp)];
      const knee = [hip[0] + d1[0] * Lt, hip[1], hip[2] + d1[2] * Lt];
      const a2 = hp - kn;
      const d2 = [Math.sin(a2), 0, -Math.cos(a2)];
      const ankle = [knee[0] + d2[0] * Ls, knee[1], knee[2] + d2[2] * Ls];
      const toe = [ankle[0] + 0.13 * k, ankle[1], ankle[2] - 0.03 * k];
      return { hip, knee, ankle, toe };
    };
    J.L = leg(-1, P.lhp, P.lkn);
    J.R = leg(1, P.rhp, P.rkn);
    const low = Math.min(J.L.ankle[2], J.R.ankle[2], J.L.toe[2], J.R.toe[2]);
    const lift = (P.jump ? 0 : -low + 0.04 * k);
    for (const s of ['L', 'R']) for (const j in J[s]) J[s][j][2] += lift;
    const pz = pelvisZ + lift;
    const lean = P.lean + (m.hunch ? 0.45 : 0) + (m.lean || 0);
    const spineL = 0.5 * k * (m.torsoLen || 1);
    const chest = [Math.sin(lean) * spineL, 0, pz + Math.cos(lean) * spineL];
    const neck = [chest[0] + Math.sin(lean) * 0.1 * k, 0, chest[2] + Math.cos(lean) * 0.1 * k];
    const hl = lean + (P.head || 0) * 0.5 + (m.hunch ? -0.2 : 0);
    const head = [neck[0] + Math.sin(hl) * 0.15 * k + (m.hunch ? 0.08 * k : 0), 0, neck[2] + Math.cos(hl) * 0.14 * k];
    const tw = P.twist + (P.spin || 0);
    const rot = (p, cx) => {
      const x = p[0] - cx, y = p[1];
      return [cx + x * Math.cos(tw) - y * Math.sin(tw), x * Math.sin(tw) + y * Math.cos(tw), p[2]];
    };
    const shoulder = side => rot([chest[0] - Math.sin(lean) * 0.05, side * shW, chest[2] - 0.04 * k], 0);
    const arm = (side, sp, sa, el) => {
      const S = shoulder(side);
      let u = unit(Math.sin(sp) * Math.cos(sa), side * Math.sin(sa), -Math.cos(sp) * Math.cos(sa));
      u = [u[0] * Math.cos(tw) - u[1] * Math.sin(tw), u[0] * Math.sin(tw) + u[1] * Math.cos(tw), u[2]];
      const E = [S[0] + u[0] * Lu, S[1] + u[1] * Lu, S[2] + u[2] * Lu];
      const a2 = sp + el;
      let f = unit(Math.sin(a2) * Math.cos(sa * 0.5), side * Math.sin(sa * 0.5), -Math.cos(a2) * Math.cos(sa * 0.5));
      f = [f[0] * Math.cos(tw) - f[1] * Math.sin(tw), f[0] * Math.sin(tw) + f[1] * Math.cos(tw), f[2]];
      const Hn = [E[0] + f[0] * Lf, E[1] + f[1] * Lf, E[2] + f[2] * Lf];
      return { sh: S, el: E, hand: Hn, fdir: f };
    };
    J.RA = arm(1, P.rsp, P.rsa, P.rel);
    J.LA = arm(-1, P.lsp, P.lsa, P.lel);
    if (P.both > 0.01) {
      const t = D.clamp(P.both, 0, 1);
      const w = weaponDir(P, tw);
      const grip = [J.RA.hand[0] + w[0] * 0.2 * k, J.RA.hand[1] + w[1] * 0.2 * k, J.RA.hand[2] + w[2] * 0.2 * k];
      const lh = J.LA.hand;
      J.LA.hand = [lh[0] + (grip[0] - lh[0]) * t, lh[1] + (grip[1] - lh[1]) * t, lh[2] + (grip[2] - lh[2]) * t];
      J.LA.el = [(J.LA.sh[0] + J.LA.hand[0]) / 2 + 0.05 * k, (J.LA.sh[1] + J.LA.hand[1]) / 2 - 0.08 * k, (J.LA.sh[2] + J.LA.hand[2]) / 2 - 0.06 * k];
    }
    J.pelvis = [0, 0, pz];
    J.chest = rot(chest, 0);
    J.neck = rot(neck, 0);
    J.head = rot(head, 0);
    J.tw = tw;
    J.k = k;
    J.shL = shoulder(-1); J.shR = shoulder(1);
    return J;
  }

  function weaponDir(P, tw) {
    const wy = P.wy + tw;
    return [Math.cos(P.wp) * Math.cos(wy), Math.cos(P.wp) * Math.sin(wy), Math.sin(P.wp)];
  }

  function applyFall(J, fall, k) {
    if (!fall) return;
    const phi = fall * Math.PI / 2 * 0.96;
    const c = Math.cos(phi), s = Math.sin(phi);
    const f = p => { const x = p[0], z = p[2]; p[0] = x * c - z * s; p[2] = Math.max(0.04 * k, x * s + z * c + 0.08 * k * fall); };
    const walk = o => { for (const key in o) { const v = o[key]; if (Array.isArray(v) && v.length === 3 && typeof v[0] === 'number') f(v); else if (v && typeof v === 'object' && !Array.isArray(v)) walk(v); } };
    walk(J);
  }

  function makeProj(dir, scale, ox, oy) {
    const F = [Math.cos(dir), Math.sin(dir)], R = [-Math.sin(dir), Math.cos(dir)];
    return p => {
      const wx = p[0] * F[0] + p[1] * R[0], wy = p[0] * F[1] + p[1] * R[1];
      return { x: ox + (wx - wy) * PX * scale, y: oy + (wx + wy) * PY * scale - p[2] * PZ * scale, d: wx + wy, z: p[2] };
    };
  }

  const LIGHT = [-0.62, -0.78];

  function capsule(c, a, b, r1, r2, col, o) {
    o = o || {};
    const dx = b.x - a.x, dy = b.y - a.y;
    const L = Math.hypot(dx, dy) || 0.001;
    const nx = -dy / L, ny = dx / L;
    const ang = Math.atan2(ny, nx);
    c.beginPath();
    c.arc(a.x, a.y, r1, ang, ang + Math.PI);
    c.arc(b.x, b.y, r2, ang + Math.PI, ang + TAU);
    c.closePath();
    const lit = nx * LIGHT[0] + ny * LIGHT[1] > 0 ? 1 : -1;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, rr = Math.max(r1, r2);
    const g = c.createLinearGradient(mx - nx * rr * lit, my - ny * rr * lit, mx + nx * rr * lit, my + ny * rr * lit);
    g.addColorStop(0, D.shade(col, -0.62));
    g.addColorStop(0.45, D.shade(col, -0.12));
    g.addColorStop(0.78, D.shade(col, o.gloss || 0.2));
    g.addColorStop(1, D.shade(col, -0.2));
    c.fillStyle = g;
    c.fill();
    if (o.edge) { c.strokeStyle = D.shade(col, -0.7); c.lineWidth = 0.7; c.stroke(); }
  }

  function ball(c, p, r, col, o) {
    o = o || {};
    const g = c.createRadialGradient(p.x + r * LIGHT[0] * 0.45, p.y + r * LIGHT[1] * 0.45, r * 0.1, p.x, p.y, r * 1.05);
    g.addColorStop(0, D.shade(col, o.gloss || 0.3));
    g.addColorStop(0.6, col);
    g.addColorStop(1, D.shade(col, -0.6));
    c.fillStyle = g;
    c.beginPath();
    if (o.ry) c.ellipse(p.x, p.y, r, o.ry, o.rot || 0, 0, TAU); else c.arc(p.x, p.y, r, 0, TAU);
    c.fill();
  }

  function poly(c, pts, col, o) {
    o = o || {};
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
    c.closePath();
    if (o.grad) {
      let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
      for (const p of pts) { minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x); miny = Math.min(miny, p.y); maxy = Math.max(maxy, p.y); }
      const g = c.createLinearGradient(minx, miny, maxx, maxy);
      g.addColorStop(0, D.shade(col, 0.2));
      g.addColorStop(0.5, col);
      g.addColorStop(1, D.shade(col, -0.55));
      c.fillStyle = g;
    } else c.fillStyle = col;
    c.fill();
    if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.lw || 0.8; c.stroke(); }
  }

  function mid(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function add3(a, b, s) { return [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s]; }

  function drawWeapon(c, pr, J, P, w, s, parts) {
    if (!w || w.type === 'none' || P.noWeapon) return;
    const k = J.k;
    const dir = weaponDir(P, J.tw);
    const hand = J.RA.hand;
    const len = (w.len || 0.8) * k;
    const back = (w.grip || 0.12) * k;
    const t0 = add3(hand, dir, -back), t1 = add3(hand, dir, len);
    const a = pr(t0), b = pr(t1), h = pr(hand);
    const d = (a.d + b.d) / 2 + 0.02;
    const col = w.col || '#c0c0c8';
    const type = w.type;
    parts.push({
      d, f: () => {
        if (type === 'bow' || type === 'xbow') {
          const L = pr(J.LA.hand);
          const up = [0, 0, 1];
          const bl = (w.len || 1.0) * k * 0.55;
          const side = [dir[1], -dir[0], 0];
          const top = pr(add3(J.LA.hand, up, bl)), bot = pr(add3(J.LA.hand, up, -bl));
          const bend = pr(add3(add3(J.LA.hand, [Math.cos(J.tw), Math.sin(J.tw), 0], 0.18 * k), side, 0));
          if (type === 'xbow') {
            const tip = pr(add3(J.LA.hand, [Math.cos(J.tw), Math.sin(J.tw), 0], 0.35 * k));
            capsule(c, pr(J.RA.hand), tip, 1.8 * s, 1.5 * s, '#6a4a2a');
            capsule(c, pr(add3(J.LA.hand, side, 0.22 * k)), pr(add3(J.LA.hand, side, -0.22 * k)), 1.2 * s, 1.2 * s, '#8a8a90');
            return;
          }
          c.strokeStyle = '#5a3a1c'; c.lineWidth = 2.2 * s;
          c.beginPath(); c.moveTo(top.x, top.y); c.quadraticCurveTo(bend.x * 2 - (top.x + bot.x) / 2, bend.y * 2 - (top.y + bot.y) / 2, bot.x, bot.y); c.stroke();
          c.strokeStyle = D.shade('#8a6a3a', 0.2); c.lineWidth = 0.8 * s; c.stroke();
          const R = pr(P.draw ? J.RA.hand : J.LA.hand);
          c.strokeStyle = 'rgba(230,230,220,0.8)'; c.lineWidth = 0.6;
          c.beginPath(); c.moveTo(top.x, top.y); c.lineTo(R.x, R.y); c.lineTo(bot.x, bot.y); c.stroke();
          return;
        }
        if (type === 'staff' || type === 'spear' || type === 'polearm' || type === 'javelin') {
          capsule(c, a, b, 1.3 * s, 1.1 * s, type === 'staff' ? '#6a4a28' : '#7a5a34');
          if (type === 'spear' || type === 'javelin') { const tp = pr(add3(t1, dir, 0.16 * k)); poly(c, [pr(add3(t1, [dir[1], -dir[0], 0], 0.035 * k)), tp, pr(add3(t1, [-dir[1], dir[0], 0], 0.035 * k))], col, { grad: true }); }
          if (type === 'polearm') { const bl = pr(add3(t1, [dir[1], -dir[0], 0.02], 0.16 * k)); poly(c, [b, bl, pr(add3(t1, dir, -0.22 * k))], col, { grad: true, stroke: D.shade(col, -0.5) }); }
          if (type === 'staff' && w.orb) ball(c, b, 2.4 * s, w.orb);
          return;
        }
        if (type === 'axe' || type === 'hammer' || type === 'mace' || type === 'club' || type === 'scepter' || type === 'wand') {
          capsule(c, a, b, 1.2 * s, 1.0 * s, type === 'club' ? '#6a4a2a' : type === 'wand' ? '#d8d0b8' : '#5a4a3a');
          const side = [dir[1], -dir[0], 0.4];
          if (type === 'axe') {
            const h1 = pr(add3(t1, side, 0.15 * k)), h2 = pr(add3(add3(t1, dir, -0.2 * k), side, 0.17 * k)), h3 = pr(add3(t1, dir, -0.24 * k));
            poly(c, [b, h1, h2, h3], col, { grad: true, stroke: D.shade(col, -0.5) });
          } else if (type === 'hammer') {
            const p1 = pr(add3(t1, side, 0.11 * k)), p2 = pr(add3(t1, side, -0.11 * k));
            capsule(c, p1, p2, 3.2 * s, 3.2 * s, col);
          } else if (type === 'mace' || type === 'scepter') {
            ball(c, b, 3 * s, col);
            if (type === 'mace') for (let i = 0; i < 5; i++) { const an = i / 5 * TAU; c.fillStyle = D.shade(col, 0.3); c.fillRect(b.x + Math.cos(an) * 3 * s - 0.7, b.y + Math.sin(an) * 3 * s - 0.7, 1.4, 1.4); }
            if (type === 'scepter') ball(c, { x: b.x, y: b.y - 2 * s }, 1.6 * s, '#e0c060');
          } else if (type === 'club') {
            capsule(c, pr(add3(t1, dir, -0.25 * k)), b, 1.8 * s, 2.6 * s, '#6a4a2a');
          } else if (type === 'wand') ball(c, b, 1.5 * s, '#e8e0c8');
          return;
        }
        if (type === 'claw') {
          for (let i = -1; i <= 1; i++) { const off = [dir[1] * 0.03 * i, -dir[0] * 0.03 * i, 0]; capsule(c, pr(add3(hand, off, 1)), pr(add3(add3(hand, dir, 0.3 * k), off, 1)), 0.8 * s, 0.3 * s, col); }
          return;
        }
        if (type === 'orb') { ball(c, pr(add3(hand, [0, 0, 1], 0.05 * k)), 2.6 * s, w.orb || '#80a0ff'); return; }
        if (type === 'malus') { capsule(c, a, b, 1.2 * s, 1.0 * s, '#5a4a3a'); ball(c, b, 3.2 * s, '#c0a060'); return; }
        const wide = (w.wide || 1) * 1.6 * s;
        const side = [dir[1], -dir[0], 0];
        poly(c, [pr(add3(add3(hand, dir, 0.05 * k), side, 0.022 * k * (w.wide || 1))), pr(add3(t1, side, 0.005 * k)), pr(add3(t1, dir, 0.06 * k)), pr(add3(add3(hand, dir, 0.05 * k), side, -0.022 * k * (w.wide || 1)))], col, { grad: true, stroke: D.shade(col, -0.55), lw: 0.5 });
        capsule(c, pr(add3(hand, side, 0.06 * k)), pr(add3(hand, side, -0.06 * k)), wide * 0.5, wide * 0.5, w.guard || '#8a6a30');
        capsule(c, a, h, 1.1 * s, 1.1 * s, '#4a3020');
      }
    });
  }

  function drawShield(c, pr, J, P, sh, s, parts) {
    if (!sh || sh.type === 'none') return;
    const k = J.k;
    const hand = J.LA.hand;
    const fwd = [Math.cos(J.tw) * 0.08 * k, Math.sin(J.tw) * 0.08 * k, 0];
    const cpos = add3(hand, fwd, 1);
    const p = pr(cpos);
    const size = (sh.size || 1) * 11 * s * k;
    const col = sh.col || '#7a5a3a';
    parts.push({
      d: p.d + 0.08, f: () => {
        c.save();
        c.translate(p.x, p.y);
        c.scale(0.55 + 0.45 * Math.abs(Math.sin((J.dirAng || 0) + J.tw + Math.PI / 4)), 1);
        const shape = sh.type;
        c.beginPath();
        if (shape === 'kite') { c.moveTo(0, -size); c.quadraticCurveTo(size * 0.9, -size * 0.8, size * 0.7, 0); c.lineTo(0, size * 1.3); c.lineTo(-size * 0.7, 0); c.quadraticCurveTo(-size * 0.9, -size * 0.8, 0, -size); }
        else if (shape === 'tower') { c.rect(-size * 0.7, -size * 1.1, size * 1.4, size * 2.2); }
        else c.arc(0, 0, size * (shape === 'buckler' ? 0.7 : 1), 0, TAU);
        const g = c.createRadialGradient(-size * 0.3, -size * 0.4, size * 0.1, 0, 0, size * 1.3);
        g.addColorStop(0, D.shade(col, 0.35)); g.addColorStop(0.6, col); g.addColorStop(1, D.shade(col, -0.6));
        c.fillStyle = g; c.fill();
        c.strokeStyle = sh.rim || '#b0a080'; c.lineWidth = 1.2 * s; c.stroke();
        if (sh.boss) { ball(c, { x: 0, y: 0 }, size * 0.22, sh.rim || '#c0b080'); }
        if (sh.cross) { c.fillStyle = sh.cross; c.fillRect(-size * 0.12, -size * 0.8, size * 0.24, size * 1.7); c.fillRect(-size * 0.55, -size * 0.25, size * 1.1, size * 0.22); }
        c.restore();
      }
    });
  }

  function drawBiped(c, m, P, dir, s, ox, oy) {
    const J = bipedJoints(P, m);
    J.dirAng = dir;
    applyFall(J, P.fall, J.k);
    const pr = makeProj(dir, s, ox, oy);
    const k = J.k;
    const parts = [];
    const skin = m.skin || '#c89070';
    const cl = m.cloth || '#6a5a4a';
    const legC = m.legs || cl;
    const armC = m.arms || skin;
    const bootC = m.boots || '#4a3020';
    const th = (m.thick || 1) * s;
    const addCap = (p1, p2, r1, r2, col, bias, o) => {
      const a = pr(p1), b = pr(p2);
      parts.push({ d: (a.d + b.d) / 2 + (bias || 0), f: () => capsule(c, a, b, r1 * th, r2 * th, col, o) });
    };
    const ghost = m.ghost;
    for (const side of ['L', 'R']) {
      const L = J[side];
      if (ghost) continue;
      addCap(L.hip, L.knee, 4.0 * k, 3.1 * k, legC, 0);
      addCap(L.knee, L.ankle, 3.1 * k, 2.4 * k, m.greaves || legC, 0);
      addCap(L.ankle, L.toe, 2.5 * k, 2.0 * k, bootC, 0.01);
      if (m.furLegs) addCap(L.knee, L.ankle, 3.5 * k, 2.8 * k, m.furLegs, 0.005);
    }
    const pel = J.pelvis, ch = J.chest;
    const torsoR = (m.torsoW || 1) * (m.build || 1) * 6.3 * k;
    if (!ghost) addCap(J.L.hip, J.R.hip, 4.2 * k * (m.build || 1), 4.2 * k * (m.build || 1), m.hips || legC, 0.015);
    addCap(pel, ch, torsoR * 0.88, torsoR, m.torso || cl, 0.02, { gloss: m.plate ? 0.45 : 0.18, edge: m.plate });
    if (m.belly) { const b = mid(pel, ch, 0.35); addCap(b, add3(b, [0.05, 0, 0.02], 1), torsoR * 1.15, torsoR * 1.1, m.torso || cl, 0.03); }
    addCap(J.shL, J.shR, 4.0 * k * (m.build || 1), 4.0 * k * (m.build || 1), m.shoulders || m.torso || cl, 0.021);
    if (m.pads) { for (const sp of [J.shL, J.shR]) { const p = pr(sp); parts.push({ d: p.d + 0.05, f: () => ball(c, { x: p.x, y: p.y - 1 * s }, 3.8 * s * k, m.pads, { gloss: 0.45 }) }); } }
    if (m.robe || ghost) {
      const hl = J.L.hip, hr = J.R.hip;
      const bottomZ = ghost ? 0.2 * k : (m.robeLen === 'short' ? 0.5 * k : 0.08 * k);
      const la = ghost ? [J.pelvis[0] - 0.15 * k, -0.2 * k, bottomZ] : [J.L.ankle[0] * (m.robeLen === 'short' ? 0.5 : 0.8), -0.2 * k * (m.robeW || 1), bottomZ];
      const ra = ghost ? [J.pelvis[0] - 0.15 * k, 0.2 * k, bottomZ] : [J.R.ankle[0] * (m.robeLen === 'short' ? 0.5 : 0.8), 0.2 * k * (m.robeW || 1), bottomZ];
      const back = [J.pelvis[0] - 0.1 * k, 0, bottomZ + 0.02];
      const front = [J.pelvis[0] + 0.12 * k + (J.L.knee[0] + J.R.knee[0]) * 0.25, 0, bottomZ];
      const P1 = [hl[0], hl[1] * 1.6, hl[2] + 0.05 * k], P2 = [hr[0], hr[1] * 1.6, hr[2] + 0.05 * k];
      const pts = [P1, P2, ra, front, la].map(pr);
      const pb = pr(back);
      const col = m.robe || cl;
      parts.push({ d: pr(J.pelvis).d + 0.035, f: () => { poly(c, [pts[0], pts[1], pts[2], pb, pts[4]], D.shade(col, -0.35)); poly(c, pts, col, { grad: true }); if (m.robeTrim) { c.strokeStyle = m.robeTrim; c.lineWidth = 1.1 * s; c.beginPath(); c.moveTo(pts[4].x, pts[4].y); c.lineTo(pts[3].x, pts[3].y); c.lineTo(pts[2].x, pts[2].y); c.stroke(); } } });
    }
    if (m.skirt) {
      const hl = J.L.hip, hr = J.R.hip;
      const z = 0.62 * k;
      const pts = [[hl[0], hl[1] * 1.8, hl[2]], [hr[0], hr[1] * 1.8, hr[2]], [(J.R.knee[0]) * 0.6 + 0.02, 0.17 * k, z], [0.1 * k + J.R.knee[0] * 0.3, 0, z - 0.03], [(J.L.knee[0]) * 0.6 + 0.02, -0.17 * k, z]].map(pr);
      parts.push({ d: pr(J.pelvis).d + 0.036, f: () => poly(c, pts, m.skirt, { grad: true }) });
    }
    if (m.cape) {
      const a = [J.shL[0] - 0.08 * k, J.shL[1], J.shL[2]], b = [J.shR[0] - 0.08 * k, J.shR[1], J.shR[2]];
      const sw = Math.sin((P.bob || 0) * 40) * 0.04;
      const la = [-0.3 * k - (P.lean > 0 ? P.lean * 0.3 : 0), -0.24 * k, 0.28 * k], ra = [-0.3 * k - (P.lean > 0 ? P.lean * 0.3 : 0), 0.24 * k, 0.28 * k + sw];
      const pts = [a, b, ra, la].map(pr);
      parts.push({ d: pr(J.pelvis).d - 0.18, f: () => poly(c, pts, m.cape, { grad: true }) });
    }
    if (m.belt) { const b0 = mid(pel, ch, 0.06); addCap(add3(b0, [0, 1, 0], -0.12 * k), add3(b0, [0, 1, 0], 0.12 * k), 1.6 * k, 1.6 * k, m.belt, 0.04); }
    for (const [A, side] of [[J.LA, -1], [J.RA, 1]]) {
      const bias = 0.004;
      addCap(A.sh, A.el, 3.2 * k * (m.build || 1), 2.7 * k * (m.build || 1), m.sleeves || armC, bias);
      addCap(A.el, A.hand, 2.7 * k * (m.build || 1), 2.2 * k * (m.build || 1), m.bracers || armC, bias);
      const hp = pr(A.hand);
      parts.push({ d: hp.d + bias + 0.01, f: () => ball(c, hp, 2.3 * s * k * (m.build || 1), m.gloves || skin) });
      if (m.claws2) { const t = add3(A.hand, A.fdir, 0.14 * k); addCap(A.hand, t, 0.9 * k, 0.2 * k, '#e8e0c0', 0.02); }
    }
    const neckP = pr(J.neck), headP = pr(J.head);
    addCap(J.chest, J.neck, 2.2 * k, 2.0 * k, m.neckC || skin, 0.03);
    const hr = (m.headR || 1) * 4.6 * s * k;
    const face = Math.cos(dir - Math.PI / 4 - J.tw);
    if (m.hairBack && !m.skull) {
      const chP = pr(J.chest);
      parts.push({ d: face > 0 ? chP.d - 0.12 : headP.d + 0.07, f: () => { c.fillStyle = m.hairBack; c.beginPath(); c.ellipse(headP.x - (Math.cos(dir) - Math.sin(dir)) * hr * 0.25, headP.y + hr * 0.7, hr * 1.0, hr * 1.55, 0, 0, TAU); c.fill(); } });
    }
    parts.push({
      d: headP.d + 0.06, f: () => {
        const hc = m.head || skin;
        if (m.skull) {
          ball(c, headP, hr * 0.95, '#e0d8c0', { ry: hr * 1.05 });
          if (face > -0.2) { c.fillStyle = '#1a1010'; const ex = Math.sin(dir - Math.PI / 4 - J.tw) * hr * 0.35; c.beginPath(); c.arc(headP.x - hr * 0.35 * face + ex, headP.y - hr * 0.1, hr * 0.22, 0, TAU); c.arc(headP.x + hr * 0.35 * face + ex, headP.y - hr * 0.1, hr * 0.22, 0, TAU); c.fill(); }
          if (m.eyes) { c.fillStyle = m.eyes; c.fillRect(headP.x - hr * 0.4, headP.y - hr * 0.15, 1.2, 1.2); c.fillRect(headP.x + hr * 0.2, headP.y - hr * 0.15, 1.2, 1.2); }
          return;
        }
        ball(c, headP, hr, hc, { ry: hr * 1.08 });
        if (m.snout) {
          const sx = headP.x + (Math.cos(dir) - Math.sin(dir)) * hr * 0.6, sy = headP.y + (Math.cos(dir) + Math.sin(dir)) * hr * 0.3 + hr * 0.3;
          ball(c, { x: sx, y: sy }, hr * 0.55, D.shade(hc, 0.1));
        }
        if (face > 0.15 && !m.hood && !m.helmFull) {
          const ex = Math.sin(dir - Math.PI / 4 - J.tw) * hr * 0.5;
          c.fillStyle = m.eyes || '#201010';
          const es = Math.max(0.9, hr * 0.14);
          c.fillRect(headP.x - hr * 0.38 * face + ex - es / 2, headP.y - hr * 0.08, es, es);
          c.fillRect(headP.x + hr * 0.3 * face + ex - es / 2, headP.y - hr * 0.08, es, es);
          if (m.beard) { c.fillStyle = m.beard; c.beginPath(); c.ellipse(headP.x + ex * 0.8, headP.y + hr * 0.62, hr * 0.62, hr * 0.55, 0, 0, TAU); c.fill(); }
        } else if (m.beard && face > -0.3) { c.fillStyle = m.beard; c.beginPath(); c.ellipse(headP.x, headP.y + hr * 0.62, hr * 0.5, hr * 0.45, 0, 0, TAU); c.fill(); }
        if (m.hair) {
          c.fillStyle = m.hair;
          c.beginPath();
          c.ellipse(headP.x, headP.y - hr * 0.35, hr * 1.02, hr * 0.78, 0, Math.PI, TAU);
          c.fill();
          if (m.ponytail) { const bx = headP.x - (Math.cos(dir) - Math.sin(dir)) * hr * 0.8, by = headP.y - (Math.cos(dir) + Math.sin(dir)) * hr * 0.4; capsule(c, { x: bx, y: by }, { x: bx - (Math.cos(dir) - Math.sin(dir)) * hr * 0.6, y: by + hr * 1.3 }, hr * 0.32, hr * 0.2, m.hair); }
        }
        if (m.hood) { c.fillStyle = m.hood; c.beginPath(); c.ellipse(headP.x, headP.y - hr * 0.1, hr * 1.18, hr * 1.25, 0, Math.PI * 0.95, Math.PI * 2.05); c.lineTo(headP.x + hr * 1.1, headP.y + hr * 0.9); c.lineTo(headP.x - hr * 1.1, headP.y + hr * 0.9); c.closePath(); c.fill(); if (face > 0.1) { c.fillStyle = 'rgba(0,0,0,0.55)'; c.beginPath(); c.ellipse(headP.x + Math.sin(dir - Math.PI / 4) * hr * 0.3, headP.y + hr * 0.1, hr * 0.6, hr * 0.7, 0, 0, TAU); c.fill(); if (m.eyes) { c.fillStyle = m.eyes; c.fillRect(headP.x - hr * 0.3, headP.y, 1.3, 1.3); c.fillRect(headP.x + hr * 0.2, headP.y, 1.3, 1.3); } } }
        if (m.horns) {
          c.fillStyle = m.horns;
          for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(headP.x + sd * hr * 0.45, headP.y - hr * 0.6); c.quadraticCurveTo(headP.x + sd * hr * 1.5, headP.y - hr * 1.2, headP.x + sd * hr * 1.1, headP.y - hr * (m.hornsBig ? 2.2 : 1.7)); c.lineTo(headP.x + sd * hr * 0.2, headP.y - hr * 0.8); c.fill(); }
        }
        drawHelm(c, headP, hr, m.helm, s, dir);
      }
    });
    if (m.wings) {
      const back = pr([J.chest[0] - 0.1 * k, 0, J.chest[2]]);
      parts.push({ d: back.d - 0.2, f: () => { for (const sd of [-1, 1]) { const flap = Math.sin((P.bob || 0) * 60 + sd) * 4; c.fillStyle = m.wings; c.beginPath(); c.moveTo(back.x, back.y); c.lineTo(back.x + sd * 22 * s * k, back.y - 20 * s * k + flap); c.lineTo(back.x + sd * 26 * s * k, back.y + 4 * s * k); c.lineTo(back.x + sd * 12 * s * k, back.y + 6 * s * k); c.closePath(); c.fill(); c.strokeStyle = D.shade(m.wings, -0.5); c.lineWidth = 0.8; c.stroke(); } } });
    }
    if (m.spikes) {
      for (const [sd, side, up, len] of [[-1, 0.1, 0.02, 1], [1, 0.1, 0.02, 1], [-1, 0.2, -0.08, 0.85], [1, 0.2, -0.08, 0.85], [-1, 0.28, -0.2, 0.6], [1, 0.28, -0.2, 0.6]]) {
        const root = [J.chest[0] - 0.1 * k, sd * side * k, J.chest[2] + up * k];
        const midp = add3(root, [-0.28 * len, sd * (0.08 + side * 0.4) * len, 0.22 * len], k);
        const tip = add3(root, [-0.62 * len, sd * (0.14 + side * 0.9) * len, 0.52 * len], k);
        const a = pr(root), b = pr(midp), t = pr(tip);
        parts.push({ d: a.d - 0.15, f: () => { capsule(c, a, b, 2.4 * s, 1.7 * s, m.spikes); capsule(c, b, t, 1.7 * s, 0.35 * s, D.shade(m.spikes, 0.2)); } });
      }
    }
    if (m.tail) { const b = add3(J.pelvis, [-0.1, 0, -0.05], k); const t = add3(b, [-0.4, 0.1 * Math.sin(P.bob * 50), -0.3], k); addCap(b, t, 1.6 * k, 0.5 * k, m.tail, -0.1); }
    drawWeapon(c, pr, J, P, m.weapon, s, parts);
    drawShield(c, pr, J, P, m.shield, s, parts);
    if (m.offWeapon) {
      const P2 = Object.assign({}, P, { wy: -P.wy });
      const J2 = Object.assign({}, J, { RA: J.LA });
      drawWeapon(c, pr, J2, P2, m.offWeapon, s, parts);
    }
    parts.sort((a, b) => a.d - b.d);
    for (const p of parts) p.f();
  }

  function drawHelm(c, p, r, h, s, dir) {
    if (!h) return;
    const col = h.col || '#8a8a90';
    c.save();
    if (h.type === 'cap') { c.fillStyle = col; c.beginPath(); c.ellipse(p.x, p.y - r * 0.3, r * 1.05, r * 0.8, 0, Math.PI, TAU); c.fill(); }
    else if (h.type === 'helm' || h.type === 'full' || h.type === 'great' || h.type === 'bone') {
      const g = c.createRadialGradient(p.x - r * 0.4, p.y - r * 0.7, r * 0.1, p.x, p.y - r * 0.2, r * 1.4);
      g.addColorStop(0, D.shade(col, 0.5)); g.addColorStop(0.5, col); g.addColorStop(1, D.shade(col, -0.6));
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(p.x, p.y - r * 0.15, r * 1.12, r * (h.type === 'great' ? 1.25 : 1.05), 0, Math.PI * (h.type === 'helm' ? 1 : 0.85), Math.PI * (h.type === 'helm' ? 2 : 2.15));
      if (h.type !== 'helm') c.lineTo(p.x + r * 1.0, p.y + r * 0.7); else c.lineTo(p.x + r * 1.1, p.y);
      if (h.type !== 'helm') c.lineTo(p.x - r * 1.0, p.y + r * 0.7);
      c.closePath(); c.fill();
      if (h.type === 'great' || h.type === 'full') { c.fillStyle = '#101010'; c.fillRect(p.x - r * 0.6, p.y - r * 0.1, r * 1.2, r * 0.18); }
      if (h.type === 'bone') { c.fillStyle = '#e8e0c8'; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(p.x + i * r * 0.5, p.y - r * 0.9); c.lineTo(p.x + i * r * 0.6, p.y - r * 1.7); c.lineTo(p.x + i * r * 0.3, p.y - r * 0.9); c.fill(); } }
      if (h.wings) { c.fillStyle = '#e0e0e8'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(p.x + sd * r, p.y - r * 0.4); c.lineTo(p.x + sd * r * 1.9, p.y - r * 1.5); c.lineTo(p.x + sd * r * 1.2, p.y - r * 0.1); c.fill(); } }
      if (h.horns) { c.fillStyle = '#d8d0b0'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(p.x + sd * r * 0.8, p.y - r * 0.5); c.quadraticCurveTo(p.x + sd * r * 1.8, p.y - r * 0.6, p.x + sd * r * 1.6, p.y - r * 1.6); c.lineTo(p.x + sd * r * 0.6, p.y - r * 0.8); c.fill(); } }
    } else if (h.type === 'crown' || h.type === 'circlet') {
      c.fillStyle = h.type === 'crown' ? '#d8b040' : '#c0c0d0';
      c.fillRect(p.x - r * 0.95, p.y - r * 0.55, r * 1.9, r * 0.3);
      if (h.type === 'crown') for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(p.x + i * r * 0.4 - r * 0.15, p.y - r * 0.55); c.lineTo(p.x + i * r * 0.4, p.y - r * 1.0); c.lineTo(p.x + i * r * 0.4 + r * 0.15, p.y - r * 0.55); c.fill(); }
      c.fillStyle = h.gem || '#c02040'; c.fillRect(p.x - 1, p.y - r * 0.5, 2, 2);
    } else if (h.type === 'mask') {
      c.fillStyle = col; c.beginPath(); c.ellipse(p.x, p.y, r * 0.95, r * 1.0, 0, 0, TAU); c.fill();
      c.fillStyle = '#100808'; c.fillRect(p.x - r * 0.5, p.y - r * 0.2, r * 0.3, r * 0.25); c.fillRect(p.x + r * 0.2, p.y - r * 0.2, r * 0.3, r * 0.25);
    } else if (h.type === 'hood') {
      c.fillStyle = col; c.beginPath(); c.ellipse(p.x, p.y - r * 0.1, r * 1.2, r * 1.25, 0, Math.PI * 0.95, Math.PI * 2.05); c.lineTo(p.x + r * 1.1, p.y + r * 0.9); c.lineTo(p.x - r * 1.1, p.y + r * 0.9); c.closePath(); c.fill();
    } else if (h.type === 'leaves') {
      for (let i = 0; i < 7; i++) { const a = Math.PI + i / 6 * Math.PI; c.fillStyle = i % 2 ? '#4a7a2a' : '#6a9a3a'; c.beginPath(); c.ellipse(p.x + Math.cos(a) * r, p.y - r * 0.2 + Math.sin(a) * r * 0.9, r * 0.45, r * 0.25, a, 0, TAU); c.fill(); }
    } else if (h.type === 'turban') {
      ball(c, { x: p.x, y: p.y - r * 0.45 }, r * 1.1, col, { ry: r * 0.8 });
    }
    c.restore();
  }

  function quadJoints(P, m, anim, p) {
    const k = m.h / 1.0;
    const len = (m.len || 0.9) * k, h = (m.legH || 0.45) * k, w = (m.w || 0.16) * k;
    const s = Math.sin(p * TAU), c = Math.cos(p * TAU);
    const run = anim === 'run' || anim === 'walk';
    const A = run ? (anim === 'run' ? 0.7 : 0.45) : 0;
    const bob = run ? Math.abs(c) * 0.03 * k : Math.sin(p * TAU) * 0.01 * k;
    let lunge = 0, rear = 0;
    if (anim === 'attack') { const q = D.clamp(p * 1.6, 0, 1); lunge = Math.sin(q * Math.PI) * 0.35; rear = Math.sin(D.clamp(p * 2.5, 0, 1) * Math.PI) * 0.15; }
    const back = [-len / 2, 0, h + bob], front = [len / 2 + lunge * 0.3 * k, 0, h + bob + rear * k + 0.05 * k];
    const leg = (hip, side, ph) => {
      const sw = Math.sin(p * TAU + ph) * A;
      const knee = [hip[0] + Math.sin(sw) * h * 0.5, side * w, hip[2] - h * 0.5];
      const foot = [knee[0] + Math.sin(sw * 1.3) * h * 0.5, side * w, Math.max(0.02 * k, knee[2] - h * 0.5 + Math.max(0, Math.cos(p * TAU + ph)) * (run ? 0.08 * k : 0))];
      return { hip: [hip[0], side * w, hip[2]], knee, foot };
    };
    return {
      back, front, k,
      legs: [leg(back, -1, 0), leg(back, 1, Math.PI), leg(front, -1, Math.PI), leg(front, 1, 0)],
      head: [front[0] + 0.22 * k + lunge * 0.3 * k, 0, front[2] + (m.headUp || 0.08) * k - lunge * 0.1 * k],
      tail: [back[0] - 0.35 * k, Math.sin(p * TAU * 2) * 0.1 * k, back[2] + 0.05 * k]
    };
  }

  function drawQuad(c, m, anim, p, dir, s, ox, oy, fall) {
    const J = quadJoints(null, m, anim, p);
    const k = J.k;
    let proj = makeProj(dir, s, ox, oy);
    let pr = proj;
    if (fall) {
      const roll = fall * Math.PI / 2;
      pr = pt => proj([pt[0], pt[1] * Math.cos(roll) - pt[2] * Math.sin(roll) * 0.9, Math.max(0.03, pt[1] * Math.sin(roll) + pt[2] * Math.cos(roll) * (1 - fall * 0.6))]);
    }
    const parts = [];
    const col = m.fur || '#6a5a4a';
    const addCap = (a, b, r1, r2, cc, bias) => { const A = pr(a), B = pr(b); parts.push({ d: (A.d + B.d) / 2 + (bias || 0), f: () => capsule(c, A, B, r1 * s, r2 * s, cc) }); };
    for (const L of J.legs) { addCap(L.hip, L.knee, 2.4 * k * (m.legT || 1), 1.9 * k * (m.legT || 1), col, 0); addCap(L.knee, L.foot, 1.8 * k * (m.legT || 1), 1.4 * k * (m.legT || 1), D.shade(col, -0.15), 0); }
    addCap(J.back, J.front, (m.bodyR || 5.5) * k, (m.bodyR2 || m.bodyR || 6) * k, col, 0.02);
    addCap(J.front, J.head, 3 * k, 3.2 * k, col, 0.03);
    if (m.tailC !== null) addCap(J.back, J.tail, 1.8 * k, 0.6 * k, m.tailC || col, -0.02);
    const hp = pr(J.head);
    const snout = pr([J.head[0] + 0.16 * k, 0, J.head[2] - 0.04 * k]);
    parts.push({
      d: hp.d + 0.05, f: () => {
        ball(c, hp, 3.6 * s * k * (m.headR || 1), m.headC || col);
        capsule(c, hp, snout, 2.4 * s * k * (m.headR || 1), 1.5 * s * k, D.shade(m.headC || col, 0.05));
        c.fillStyle = m.eyes || '#ffd040';
        c.fillRect(hp.x - 1.5, hp.y - 1.5, 1.3, 1.3);
        c.fillRect(hp.x + 1, hp.y - 1.5, 1.3, 1.3);
        if (m.ears) { c.fillStyle = D.shade(m.headC || col, -0.2); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(hp.x + sd * 2 * s * k, hp.y - 2 * s * k); c.lineTo(hp.x + sd * 3 * s * k, hp.y - 6 * s * k); c.lineTo(hp.x + sd * 0.5 * s * k, hp.y - 3 * s * k); c.fill(); } }
      }
    });
    if (m.quills) {
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const base = mid(J.back, J.front, t);
        const tip = add3(base, [-0.12, (i % 2 ? 0.1 : -0.1), 0.22], k);
        const A = pr(base), B = pr(tip);
        parts.push({ d: A.d + 0.04, f: () => { c.strokeStyle = m.quills; c.lineWidth = 1.1 * s; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke(); } });
      }
    }
    parts.sort((a, b) => a.d - b.d);
    for (const q of parts) q.f();
  }

  function drawFlyer(c, m, anim, p, dir, s, ox, oy, fall) {
    const k = m.h;
    const pr = makeProj(dir, s, ox, oy);
    const z = fall ? 0.1 : (m.alt || 1.4) + Math.sin(p * TAU) * 0.1;
    const body = pr([0, 0, z]);
    const flap = fall ? 0.2 : Math.sin(p * TAU * (anim === 'attack' ? 3 : 2));
    const col = m.fur || '#302020';
    for (const sd of [-1, 1]) {
      const w1 = pr([-0.05 * k, sd * 0.35 * k, z + flap * 0.25 * k]);
      const w2 = pr([-0.2 * k, sd * 0.55 * k, z + flap * 0.35 * k - 0.05]);
      c.fillStyle = D.shade(col, sd < 0 ? -0.2 : 0.05);
      c.beginPath(); c.moveTo(body.x, body.y); c.quadraticCurveTo(w1.x, w1.y - 4 * s, w2.x, w2.y); c.lineTo((w2.x + body.x) / 2, (w2.y + body.y) / 2 + 3 * s); c.closePath(); c.fill();
    }
    ball(c, body, 3.2 * s * k, col, { ry: 2.6 * s * k });
    const hd = pr([0.12 * k, 0, z + 0.03]);
    ball(c, hd, 2.1 * s * k, col);
    if (m.beak) { c.fillStyle = m.beak; c.beginPath(); c.moveTo(hd.x, hd.y); c.lineTo(hd.x + (Math.cos(dir) - Math.sin(dir)) * 4 * s, hd.y + (Math.cos(dir) + Math.sin(dir)) * 2 * s); c.lineTo(hd.x, hd.y + 1.5); c.fill(); }
    c.fillStyle = m.eyes || '#ff3020'; c.fillRect(hd.x - 1, hd.y - 1, 1.2, 1.2); c.fillRect(hd.x + 0.8, hd.y - 1, 1.2, 1.2);
  }

  const FRAMES = { idle: 8, walk: 8, run: 8, attack: 10, attack2: 10, shoot: 8, bow: 8, xbow: 6, throw: 8, kick: 8, cast: 8, special: 8, block: 3, hit: 4, death: 10, dead: 1, spin: 8, leap: 8, appear: 6 };

  const cache = new Map();
  let cacheBytes = 0;
  const MAX_BYTES = 90 * 1024 * 1024;

  function sprite(model, anim, p, dir) {
    const m = model;
    const n = FRAMES[anim] || 8;
    const fi = anim === 'dead' ? 0 : Math.min(n - 1, Math.floor(((p % 1) + 1) % 1 * n));
    const d16 = D.dir16(dir);
    const key = m.key + '|' + anim + '|' + d16 + '|' + fi;
    let e = cache.get(key);
    if (e) { cache.delete(key); cache.set(key, e); return e; }
    const scale = m.scale || 1;
    const W = Math.ceil(150 * scale * (m.wide || 1)), H = Math.ceil(150 * scale);
    const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(W, H) : document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const ox = W / 2, oy = H * 0.8;
    const dAng = d16 / 16 * TAU;
    const ph = anim === 'dead' ? 1 : (fi + 0.5) / n;
    const s = 1;
    if (m.rig === 'quad') {
      const fall = anim === 'death' ? D.clamp(ph * 1.4, 0, 1) : anim === 'dead' ? 1 : 0;
      drawQuad(c, m, anim === 'death' || anim === 'dead' ? 'idle' : anim, ph, dAng, s, ox, oy, fall);
    } else if (m.rig === 'bird') {
      drawFlyer(c, m, anim, ph, dAng, s, ox, oy, anim === 'death' || anim === 'dead');
    } else if (m.rig === 'draw') {
      m.draw(c, anim, ph, dAng, s, ox, oy);
    } else {
      const P = pose(anim, ph, m);
      drawBiped(c, m, P, dAng, s, ox, oy);
    }
    e = { cv, ox, oy, w: W, h: H };
    cache.set(key, e);
    cacheBytes += W * H * 4;
    while (cacheBytes > MAX_BYTES && cache.size) {
      const k0 = cache.keys().next().value;
      const e0 = cache.get(k0);
      cacheBytes -= e0.w * e0.h * 4;
      cache.delete(k0);
    }
    return e;
  }

  function clearCache() { cache.clear(); cacheBytes = 0; }

  D.Sprites = { sprite, pose, clearCache, capsule, ball, poly, FRAMES, drawBiped, bipedJoints, makeProj, drawHelm };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
