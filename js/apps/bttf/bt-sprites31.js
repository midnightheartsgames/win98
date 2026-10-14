(function (S, B) {
  'use strict';
  const C = B.C;
  const R = B.rig;
  const COSTUMES = S.COSTUMES;
  const A = B.art;

  function hat(P, J, ramp, band, kind) {
    const h = J.head, d = J.d;
    const top = h.y - d.ry - 1;
    if (kind === 'cap') {
      P.part(P.path(`M ${h.x - d.rx - 1} ${h.y - 5} Q ${h.x - d.rx} ${top - 6} ${h.x + 1} ${top - 6} Q ${h.x + d.rx + 2} ${top - 5} ${h.x + d.rx + 1} ${h.y - 5} Z`), ramp, { b: 2 });
      P.part(P.path(`M ${h.x + (J.side ? 4 : -9)} ${h.y - 6} L ${h.x + (J.side ? d.rx + 9 : 9)} ${h.y - 6} L ${h.x + (J.side ? d.rx + 7 : 8)} ${h.y - 3} L ${h.x + (J.side ? 4 : -8)} ${h.y - 3} Z`), ramp, { b: 1, sh: 0 });
      return;
    }
    if (kind === 'fedora') {
      const fx = J.side ? 3 : 0;
      P.part(P.path(`M ${h.x - d.rx - 6 + fx} ${h.y - 6} Q ${h.x + fx} ${h.y - 9} ${h.x + d.rx + 6 + fx} ${h.y - 6} L ${h.x + d.rx + 5 + fx} ${h.y - 3} Q ${h.x + fx} ${h.y - 5} ${h.x - d.rx - 5 + fx} ${h.y - 3} Z`), ramp, { b: 3, sh: 0 });
      P.part(P.path(`M ${h.x - d.rx + 1} ${h.y - 7} L ${h.x - d.rx + 2} ${top - 4} Q ${h.x - 3} ${top - 9} ${h.x} ${top - 6} Q ${h.x + 3} ${top - 9} ${h.x + d.rx - 2} ${top - 4} L ${h.x + d.rx - 1} ${h.y - 7} Z`), ramp, { b: 3 });
      if (band) P.part(P.rect(h.x - d.rx + 1, h.y - 11, (d.rx - 1) * 2, 3), band, { b: 2, sh: 0, hi: 0 });
      return;
    }
    const brim = kind === 'straw' ? 8 : 5;
    P.part(P.rect(h.x - d.rx - brim, h.y - 8, (d.rx + brim) * 2, 4), ramp, { b: 2, sh: 0 });
    P.part(P.path(`M ${h.x - d.rx + 1} ${h.y - 7} L ${h.x - d.rx + 2} ${top - 8} Q ${h.x} ${top - 12} ${h.x + d.rx - 2} ${top - 8} L ${h.x + d.rx - 1} ${h.y - 7} Z`), ramp, { b: 3 });
    if (band) P.part(P.rect(h.x - d.rx + 1, h.y - 12, (d.rx - 1) * 2, 4), band, { b: 2, sh: 0, hi: 0 });
  }

  function wild(ramp, br) {
    return (P, J) => {
      const h = J.head, d = J.d;
      const pts = [];
      const n = 11;
      for (let i = 0; i <= n; i++) {
        const a = Math.PI * (0.95 + i / n * 1.1);
        const r = (i % 2 ? 1.45 : 1.15);
        pts.push(h.x + Math.cos(a) * d.rx * r, h.y - 2 + Math.sin(a) * d.ry * r);
      }
      if (J.back) { P.part(P.ell(h.x, h.y - 1, d.rx + 3, d.ry + 2), ramp, { b: br }); return; }
      if (J.side) { P.part(P.path(`M ${h.x - d.rx - 7} ${h.y + 4} L ${h.x - d.rx - 3} ${h.y - 12} L ${h.x - 4} ${h.y - d.ry - 6} L ${h.x + 4} ${h.y - d.ry - 2} L ${h.x + 2} ${h.y - 8} L ${h.x - 3} ${h.y + 3} Z`), ramp, { b: br }); return; }
      P.part(P.poly(pts.concat([h.x + d.rx - 3, h.y - 6, h.x - d.rx + 3, h.y - 6])), ramp, { b: br });
      for (const s of [-1, 1]) P.part(P.path(`M ${h.x + s * (d.rx - 1)} ${h.y - 8} L ${h.x + s * (d.rx + 7)} ${h.y - 2} L ${h.x + s * (d.rx + 1)} ${h.y + 4} Z`), ramp, { b: br });
    };
  }

  function cap(ramp, br, extra) {
    return (P, J, o) => {
      const h = J.head, d = J.d;
      if (J.back) P.part(P.ell(h.x, h.y - 1, d.rx + 1, d.ry + 1), ramp, { b: br });
      else if (J.side) P.part(P.path(`M ${h.x + d.rx - 2} ${h.y - 6} Q ${h.x + d.rx} ${h.y - d.ry - 3} ${h.x - 2} ${h.y - d.ry - 2} Q ${h.x - d.rx - 4} ${h.y - d.ry + 2} ${h.x - d.rx - 1} ${h.y + 6} L ${h.x - 3} ${h.y + 3} L ${h.x + 2} ${h.y - 6} Z`), ramp, { b: br });
      else P.part(P.path(`M ${h.x - d.rx - 1} ${h.y} Q ${h.x - d.rx - 1} ${h.y - d.ry - 2} ${h.x} ${h.y - d.ry - 2} Q ${h.x + d.rx + 1} ${h.y - d.ry - 2} ${h.x + d.rx + 1} ${h.y} L ${h.x + d.rx - 1} ${h.y - 6} Q ${h.x} ${h.y - 10} ${h.x - d.rx + 1} ${h.y - 6} Z`), ramp, { b: br });
      if (extra) extra(P, J, o);
    };
  }

  function skirt(ramp, len) {
    return (P, J) => {
      const top = J.hipY - 4, bot = J.hipY + len;
      if (J.side) P.part(P.poly([-12, top, 12, top, 15, bot, -14, bot]), ramp, { b: 2 });
      else P.part(P.poly([-13, top, 13, top, 17, bot, -17, bot]), ramp, { b: 2 });
    };
  }

  function vest(ramp, open, under) {
    return (P, J, T) => {
      if (under && J.back) return;
      if (under && J.side) { P.part(P.poly([T.f - 7, T.top + 4, T.f - 2, T.top + 4, T.f - 2, T.bot - 8, T.f - 6, T.bot - 8]), ramp, { b: 3, sh: 0 }); return; }
      if (J.side) { P.part(P.poly([T.b + 1, T.top + 1, T.f - 3, T.top + 2, T.f - 3, T.bot - 6, T.b + 1, T.bot - 6]), ramp, { b: 3 }); return; }
      if (J.back) { P.part(P.poly([-T.sw + 2, T.top + 1, T.sw - 2, T.top + 1, T.hw - 2, T.bot - 6, -T.hw + 2, T.bot - 6]), ramp, { b: 3 }); return; }
      for (const s of [-1, 1]) P.part(P.poly([s * open, T.top + 6, s * (T.sw - 2), T.top + 1, s * (T.hw - 2), T.bot - 6, s * open, T.bot - 4]), ramp, { b: 3 });
    };
  }

  function tie(ramp) {
    return (P, J, T) => {
      if (J.back || J.side) return;
      P.part(P.poly([-2, T.top, 2, T.top, 3, T.top + 22, 0, T.top + 26, -3, T.top + 22]), ramp, { b: 3, sh: 0 });
    };
  }

  function docMane(P, J) {
    const h = J.head, d = J.d, R = C.snow;
    if (J.side) {
      P.part(P.poly([h.x + 3, h.y - d.ry - 2, h.x - 6, h.y - d.ry - 4, h.x - d.rx - 12, h.y - 10, h.x - d.rx - 5, h.y - 5, h.x - d.rx - 15, h.y + 1, h.x - d.rx - 4, h.y + 6, h.x - d.rx - 10, h.y + 12, h.x - 4, h.y + 8, h.x + 2, h.y - 4]), R, { b: 3 });
      return;
    }
    const pts = [];
    const n = 13;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI * (0.88 + i / n * 1.24);
      const r = i % 2 ? 1.5 : 1.22;
      pts.push(h.x + Math.cos(a) * d.rx * r * 1.12, h.y - 4 + Math.sin(a) * d.ry * r);
    }
    pts.push(h.x + d.rx * 0.9, h.y + 8, h.x - d.rx * 0.9, h.y + 8);
    P.part(P.poly(pts), R, { b: 3 });
  }

  function docTufts(P, J) {
    const h = J.head, d = J.d;
    if (J.back) { docMane(P, J); return; }
    if (J.side) return;
    for (const s of [-1, 1]) P.part(P.poly([h.x + s * (d.rx - 3), h.y - 7, h.x + s * (d.rx + 9), h.y - 3, h.x + s * (d.rx + 3), h.y + 1, h.x + s * (d.rx + 8), h.y + 6, h.x + s * (d.rx - 1), h.y + 5]), C.snow, { b: 3, sh: 0 });
  }

  function suit85(P, J, T) {
    if (J.side) { P.part(P.rect(T.b + 1, J.hipY - 2, T.f - T.b - 2, 3), C.grey, { b: 2, sh: 0, hi: 0 }); return; }
    P.part(P.rect(-13, J.hipY - 3, 26, 3), C.grey, { b: 2, sh: 0, hi: 0 });
    if (J.back) return;
    P.part(P.poly([-7, T.top - 3, 7, T.top - 3, 0, T.top + 11]), C.green, { b: 3, sh: 0 });
    P.part(P.poly([-3, T.top - 1, 3, T.top - 1, 0, T.top + 5]), C.pink, { b: 4, sh: 0, hi: 0, ol: 0 });
    P.part(P.ell(-7, T.top + 15, 3.4, 3.4), C.gold, { b: 4, sh: 0 });
    P.part(P.ell(-7, T.top + 15, 1, 1), C.black, { b: 0, sh: 0, hi: 0, ol: 0 });
  }

  function collar31(P, J, T) {
    if (J.side || J.back) return;
    for (const s of [-1, 1]) P.part(P.poly([0, T.top + 2, s * 6, T.top - 3, s * 7, T.top + 2]), C.snow, { b: 4, sh: 0 });
  }

  function argyle(P, J, T) {
    const R = C.teal;
    if (J.side || J.back) { vest(R, 0)(P, J, T); return; }
    P.part(P.poly([-T.sw + 2, T.top + 1, -5, T.top + 1, 0, T.top + 13, 5, T.top + 1, T.sw - 2, T.top + 1, T.hw - 1, T.bot - 3, -T.hw + 1, T.bot - 3]), R, { b: 2 });
    for (let r = 0, y = T.top + 17; y < T.bot - 4; r++, y += 7) for (let x = -T.hw + 4 + (r % 2) * 4; x < T.hw - 3; x += 8) P.part(P.poly([x, y - 3, x + 3, y, x, y + 3, x - 3, y]), R, { b: r % 2 ? 4 : 1, sh: 0, hi: 0, ol: 0 });
  }

  function suitDB(P, J, T) {
    const st = C.plum[4];
    if (J.back) { for (let x = -T.hw + 3; x < T.hw - 1; x += 4) P.line(x, T.top, x, T.bot - 1, st); return; }
    if (J.side) {
      for (let x = T.b + 3; x < T.f - 1; x += 4) P.line(x, T.top, x, T.bot - 1, st);
      P.part(P.poly([T.f - 6, T.top - 1, T.f - 1, T.top + 1, T.f - 2, T.top + 16, T.f - 6, T.top + 10]), C.plum, { b: 2, sh: 0 });
      P.part(P.poly([T.f - 3, T.top, T.f, T.top + 2, T.f - 1, T.top + 12]), C.snow, { b: 4, sh: 0, hi: 0 });
      return;
    }
    for (let x = -T.hw + 3; x < T.hw - 1; x += 4) if (Math.abs(x) > 6) P.line(x, T.top + 1, x, T.bot - 1, st);
    P.part(P.poly([-6, T.top - 1, 6, T.top - 1, 0, T.top + 16]), C.snow, { b: 4, sh: 0 });
    P.part(P.poly([-1.5, T.top, 1.5, T.top, 2, T.top + 13, 0, T.top + 15, -2, T.top + 13]), C.red, { b: 3, sh: 0 });
    for (const s of [-1, 1]) P.part(P.poly([s * 6, T.top - 1, s * 10, T.top, s * 5, T.top + 12, 0, T.top + 17]), C.plum, { b: 2, sh: 0 });
    for (const s of [-1, 1]) for (const y of [T.top + 22, T.top + 30]) P.part(P.ell(s * 4, y, 1.2, 1.2), C.raven, { b: 3, sh: 0, hi: 0, ol: 0 });
  }

  function plaidVest(P, J, T) {
    const R = C.wood;
    if (J.back) { vest(R, 0)(P, J, T); return; }
    if (J.side) {
      vest(R, 0)(P, J, T);
      for (let y = T.top + 5; y < T.bot - 7; y += 4) P.line(T.b + 2, y, T.f - 4, y, R[3]);
      for (let x = T.b + 3; x < T.f - 3; x += 4) P.line(x, T.top + 2, x, T.bot - 7, R[1]);
      return;
    }
    P.part(P.poly([-T.sw + 2, T.top + 1, -5, T.top + 1, 0, T.top + 12, 5, T.top + 1, T.sw - 2, T.top + 1, T.hw - 1, T.bot - 4, 0, T.bot - 1, -T.hw + 1, T.bot - 4]), R, { b: 2 });
    for (let y = T.top + 5; y < T.bot - 5; y += 4) for (const s of [-1, 1]) { const vx = y < T.top + 12 ? 5 - (y - T.top) * 5 / 11 + 1 : 1; P.line(s * vx, y, s * (T.sw - 3 + (T.hw - T.sw) * (y - T.top) / (T.bot - T.top)), y, R[3]); }
    for (let x = -T.hw + 3; x < T.hw - 2; x += 4) if (Math.abs(x) > 1) P.line(x, T.top + 2 + Math.max(0, 12 - Math.abs(x) * 2.4), x, T.bot - 5, R[1]);
    for (let i = 0; i < 4; i++) P.part(P.ell(0, T.top + 15 + i * 6, 0.9, 0.9), C.cream, { b: 4, sh: 0, hi: 0, ol: 0 });
  }

  function plaidTie(P, J, T) {
    if (J.back || J.side) return;
    P.part(P.poly([-1.5, T.top, 1.5, T.top, 2, T.top + 10, 0, T.top + 12, -2, T.top + 10]), C.green, { b: 3, sh: 0 });
    P.part(P.rect(-1, T.top + 4, 1, 1), C.green, { b: 4, sh: 0, hi: 0, ol: 0 });
  }

  function cookJacket(P, J, T) {
    if (J.back) { P.line(-T.hw + 2, T.bot - 14, T.hw - 2, T.bot - 14, C.snow[2]); for (const s of [-1, 1]) P.part(P.poly([0, T.bot - 14, s * 4, T.bot - 17, s * 4, T.bot - 11]), C.snow, { b: 3, sh: 0 }); return; }
    if (J.side) {
      P.part(P.poly([T.f - 7, T.top + 1, T.f - 1, T.top + 3, T.f - 1, T.bot - 14, T.f - 7, T.bot - 14]), C.wood, { b: 2, sh: 0 });
      P.part(P.poly([T.f - 9, T.bot - 14, T.f + 1, T.bot - 14, T.f + 4, T.bot + 22, T.f - 10, T.bot + 22]), C.snow, { b: 3, sh: 0 });
      P.line(T.f - 9, T.bot - 14, T.b + 1, T.bot - 14, C.snow[2]);
      return;
    }
    P.part(P.poly([-8, T.top - 1, 8, T.top - 1, 10, T.bot - 12, -10, T.bot - 12]), C.wood, { b: 2, sh: 0 });
    P.part(P.poly([-5, T.top - 1, 5, T.top - 1, 0, T.top + 10]), C.snow, { b: 4, sh: 0 });
    P.part(P.poly([-1.5, T.top, 1.5, T.top, 2, T.top + 12, 0, T.top + 14, -2, T.top + 12]), C.maroon, { b: 3, sh: 0 });
    for (const y of [T.top + 16, T.top + 22, T.top + 28]) P.part(P.ell(0, y, 0.9, 0.9), C.wood, { b: 4, sh: 0, hi: 0, ol: 0 });
    for (const s of [-1, 1]) P.part(P.poly([s * 8, T.top - 1, s * 12, T.top, s * 10, T.top + 14, s * 8, T.top + 16]), C.tan, { b: 2, sh: 0 });
    P.part(P.poly([-T.hw - 1, T.bot - 14, T.hw + 1, T.bot - 14, T.hw + 3, T.bot + 22, -T.hw - 3, T.bot + 22]), C.snow, { b: 3 });
    P.line(-T.hw - 1, T.bot - 13, T.hw + 1, T.bot - 13, C.snow[2]);
    P.part(P.rect(3, T.bot - 6, 7, 6), C.snow, { b: 2, sh: 0, hi: 0 });
  }

  function suit3(P, J, T) {
    if (J.back) return;
    if (J.side) {
      P.part(P.poly([T.f - 6, T.top - 1, T.f - 1, T.top + 1, T.f - 2, T.top + 16, T.f - 6, T.top + 10]), C.sage, { b: 2, sh: 0 });
      P.part(P.poly([T.f - 3, T.top, T.f, T.top + 2, T.f - 1, T.top + 10]), C.mint, { b: 4, sh: 0, hi: 0 });
      return;
    }
    P.part(P.poly([-7, T.top - 1, 7, T.top - 1, 8, T.top + 26, 0, T.top + 30, -8, T.top + 26]), C.sage, { b: 1, sh: 0 });
    P.part(P.poly([-5, T.top - 1, 5, T.top - 1, 0, T.top + 10]), C.mint, { b: 4, sh: 0 });
    P.part(P.poly([-1.5, T.top, 1.5, T.top, 2, T.top + 9, 0, T.top + 11, -2, T.top + 9]), C.teal, { b: 3, sh: 0 });
    for (const y of [T.top + 15, T.top + 21]) P.part(P.ell(0, y, 0.9, 0.9), C.sage, { b: 4, sh: 0, hi: 0, ol: 0 });
    for (const s of [-1, 1]) P.part(P.poly([s * 7, T.top - 1, s * 11, T.top, s * 9, T.top + 12, s * 8, T.top + 26]), C.sage, { b: 2, sh: 0 });
  }

  function policeCap(P, J) {
    const h = J.head, d = J.d, top = h.y - d.ry - 1, fx = J.side ? 4 : 0;
    P.part(P.path(`M ${h.x - d.rx - 2} ${h.y - 8} L ${h.x - d.rx - 3} ${top - 5} Q ${h.x} ${top - 9} ${h.x + d.rx + 3} ${top - 5} L ${h.x + d.rx + 2} ${h.y - 8} Z`), C.navy, { b: 3 });
    P.part(P.rect(h.x - d.rx - 1, h.y - 11, (d.rx + 1) * 2, 3), C.navy, { b: 1, sh: 0, hi: 0 });
    P.line(h.x - d.rx - 1, h.y - 11, h.x + d.rx + 1, h.y - 11, C.gold[2]);
    if (J.back) return;
    P.part(P.path(`M ${h.x - (J.side ? -2 : d.rx - 1)} ${h.y - 8} L ${h.x + (J.side ? d.rx + 6 : d.rx - 1)} ${h.y - 8} Q ${h.x + fx} ${h.y - 4} ${h.x - (J.side ? -2 : d.rx - 1)} ${h.y - 8} Z`), C.raven, { b: 2, sh: 0 });
    P.part(P.rect(h.x + fx - 1.5, top - 4, 3, 4), C.gold, { b: 3, sh: 0, hi: 0 });
  }

  function uniform(P, J, T) {
    const belt = T.bot - 11;
    if (J.back) { P.part(P.rect(-T.hw, belt, T.hw * 2, 3), C.raven, { b: 2, sh: 0 }); P.line(-T.sw + 3, T.top + 1, T.hw - 3, belt, C.raven[2]); return; }
    if (J.side) {
      P.part(P.rect(T.b, belt, T.f - T.b, 3), C.raven, { b: 2, sh: 0 });
      P.part(P.poly([T.f - 5, T.top, T.f - 1, T.top + 2, T.f - 2, T.top + 8]), C.snow, { b: 4, sh: 0, hi: 0 });
      P.part(P.ell(T.f - 5, T.top + 12, 1.6, 1.6), C.gold, { b: 4, sh: 0, hi: 0, ol: 0 });
      return;
    }
    P.part(P.poly([-5, T.top - 1, 5, T.top - 1, 0, T.top + 9]), C.snow, { b: 4, sh: 0 });
    P.part(P.poly([-1.5, T.top, 1.5, T.top, 2, T.top + 9, 0, T.top + 11, -2, T.top + 9]), C.navy, { b: 3, sh: 0 });
    for (const y of [T.top + 14, T.top + 20, T.top + 26]) P.part(P.ell(0, y, 0.9, 0.9), C.gold, { b: 4, sh: 0, hi: 0, ol: 0 });
    P.line(T.sw - 3, T.top + 1, -T.hw + 3, belt, C.raven[2]);
    const sx = -7, sy = T.top + 12, pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 1.4 : 3.2; pts.push(sx + Math.cos(a) * r, sy + Math.sin(a) * r); }
    P.part(P.poly(pts), C.gold, { b: 4, sh: 0, hi: 0 });
    P.part(P.rect(-T.hw, belt, T.hw * 2, 3), C.raven, { b: 2, sh: 0 });
    P.part(P.rect(-2, belt - 0.5, 4, 4), C.gold, { b: 3, sh: 0, hi: 0 });
  }

  function openCollar(P, J, T) {
    if (J.back) return;
    if (J.side) { P.part(P.poly([T.f - 5, T.top - 2, T.f - 1, T.top, T.f - 3, T.top + 5]), C.snow, { b: 4, sh: 0 }); return; }
    P.part(P.poly([-2, T.top - 1, 2, T.top - 1, 0, T.top + 5]), C.skin, { b: 2, sh: 0, hi: 0 });
    for (const s of [-1, 1]) P.part(P.poly([s * 1, T.top + 4, s * 6, T.top - 3, s * 6, T.top + 2]), C.snow, { b: 4, sh: 0 });
    for (const y of [T.top + 14, T.top + 20, T.top + 26]) P.part(P.ell(-4, y, 0.9, 0.9), C.cocoa, { b: 4, sh: 0, hi: 0, ol: 0 });
  }

  function apron(P, J, T, o) {
    if (!o || o.v !== 'apron') return;
    if (J.back) { for (const s of [-1, 1]) P.line(s * (T.sw - 4), T.top + 1, -s * (T.hw - 3), T.bot - 4, C.wood[2]); P.line(-T.hw, T.bot - 4, T.hw, T.bot - 4, C.wood[2]); for (const s of [-1, 1]) P.part(P.poly([0, T.bot - 4, s * 4, T.bot - 7, s * 4, T.bot - 1]), C.wood, { b: 3, sh: 0 }); return; }
    if (J.side) { P.part(P.poly([T.f - 7, T.top + 10, T.f + 1, T.top + 10, T.f + 4, T.bot + 26, T.f - 8, T.bot + 26]), C.wood, { b: 3, sh: 0 }); P.line(T.f - 7, T.top + 10, T.b + 3, T.top + 1, C.wood[1]); P.line(T.f - 8, T.bot - 4, T.b + 1, T.bot - 4, C.wood[1]); return; }
    P.part(P.poly([-7, T.top + 10, 7, T.top + 10, 8, T.bot - 4, T.hw + 1, T.bot + 26, -T.hw - 1, T.bot + 26, -8, T.bot - 4]), C.wood, { b: 3 });
    for (const s of [-1, 1]) P.line(s * 7, T.top + 10, s * (T.sw - 4), T.top + 1, C.wood[1]);
    P.line(-T.hw, T.bot - 4, T.hw, T.bot - 4, C.wood[1]);
    P.part(P.rect(-4, T.bot + 4, 8, 6), C.wood, { b: 2, sh: 0, hi: 0 });
  }

  function bowTie(ramp) {
    return (P, J, T) => {
      if (J.back) return;
      const x = J.side ? 4 : 0, y = T.top - 1;
      if (J.side) { P.part(P.poly([x - 1, y - 2, x + 3, y, x - 1, y + 2]), ramp, { b: 3, sh: 0 }); return; }
      for (const s of [-1, 1]) P.part(P.poly([x, y, x + s * 6, y - 3, x + s * 6, y + 3]), ramp, { b: 3, sh: 0 });
      P.part(P.rect(x - 1.5, y - 1.5, 3, 3), ramp, { b: 1, sh: 0, hi: 0 });
    };
  }

  function both(...fs) { return (P, J, T, o) => { for (const f of fs) if (f) f(P, J, T, o); }; }

  const LOOKS = {
    doc85: { h: 164, headW: 0.94, headH: 1.12, legs: C.snow, shoes: C.grey, coat: C.snow, sleeve: C.snow, eyes: C.hair, brow: C.snow[3], hem: 4,
      hairBack: docMane, hair: docTufts, over: suit85 },
    doc31: { h: 164, headW: 0.94, headH: 1.12, legs: C.mustard, shoes: C.wood, coat: C.mustard, sleeve: C.mustard, eyes: C.hair, brow: C.snow[3], hem: 10,
      hairBack: docMane, hair: (P, J, o) => { docTufts(P, J, o); hat(P, J, C.khaki, C.hair, 'straw'); },
      over: both(vest(C.red, 4, true), tie(C.navy)), collar: collar31 },
    marty31: { h: 150, legs: C.char, shoes: C.raven, sole: C.raven, coat: C.snow, sleeve: C.snow, cuff: C.snow, eyes: C.sky, brow: C.hair[1], hem: 2,
      hair: A.hairOf(C.hair, 3, 'swept'), over: both(vest(C.cocoa, 3), openCollar) },
    edna86: { h: 136, wide: 0.84, legs: C.skin, shoes: C.wood, coat: C.salmon, sleeve: C.salmon, eyes: C.teal, brow: C.snow[1], hem: 2, headW: 0.9, headH: 1.04, face: 'angry',
      under: skirt(C.mint, 50),
      over: (P, J, T) => { if (J.back || J.side) return; for (let i = 0; i < 6; i++) P.px((i % 2 ? 5 : -6) + (i % 3), T.top + 8 + i * 5, C.snow[4]); for (const s of [-1, 1]) P.part(P.poly([0, T.top - 1, s * 6, T.top - 3, s * 5, T.top + 3]), C.snow, { b: 4, sh: 0 }); },
      hair: (P, J) => {
        const h = J.head, d = J.d;
        if (J.back) { P.part(P.ell(h.x, h.y - 2, d.rx + 1, d.ry), C.snow, { b: 2 }); P.part(P.ell(h.x, h.y - 6, 6, 6), C.snow, { b: 3 }); return; }
        if (J.side) { P.part(P.path(`M ${h.x + d.rx - 3} ${h.y - 7} Q ${h.x} ${h.y - d.ry - 4} ${h.x - d.rx - 1} ${h.y - 4} L ${h.x - d.rx} ${h.y + 4} L ${h.x - 4} ${h.y + 2} L ${h.x + 2} ${h.y - 6} Z`), C.snow, { b: 2 }); P.part(P.ell(h.x - d.rx - 3, h.y - 7, 6, 6), C.snow, { b: 3 }); P.part(P.ell(h.x - 2, h.y + 6, 1.4, 2), C.purple, { b: 3, sh: 0 }); return; }
        P.part(P.path(`M ${h.x - d.rx - 1} ${h.y + 1} Q ${h.x - d.rx - 1} ${h.y - d.ry - 2} ${h.x} ${h.y - d.ry - 3} Q ${h.x + d.rx + 1} ${h.y - d.ry - 2} ${h.x + d.rx + 1} ${h.y + 1} L ${h.x + d.rx - 1} ${h.y - 6} Q ${h.x} ${h.y - 10} ${h.x - d.rx + 1} ${h.y - 6} Z`), C.snow, { b: 2 });
        P.part(P.ell(h.x, h.y - d.ry - 4, 6, 4.5), C.snow, { b: 3 });
        for (const s of [-1, 1]) P.part(P.ell(h.x + s * (d.rx + 0.5), h.y + 7, 1.4, 2.2), C.purple, { b: 3, sh: 0, hi: 0 });
      },
      prop: (P, J, o) => {
        if (o.act !== 'horn') return;
        const a = J.arms[1].hand;
        const dx = J.side ? 1 : 0.4;
        P.part(P.poly([a.x + 2, a.y - 3, a.x + 2 + 22 * dx, a.y - 14, a.x + 2 + 26 * dx, a.y + 2, a.x + 2, a.y + 3]), C.cream, { b: 3 });
        P.part(P.ell(a.x + 2 + 24 * dx, a.y - 6, 4, 9), C.cream, { b: 1, sh: 0 });
        P.part(P.rect(a.x - 3, a.y, 6, 9), C.red, { b: 3, sh: 0 });
      } },
    edna31: { h: 148, wide: 0.86, legs: C.navy, shoes: C.navy, coat: C.peri, sleeve: C.peri, eyes: C.green, brow: C.black, hem: 4, headW: 0.92,
      under: skirt(C.navy, 66),
      over: (P, J, T) => { if (J.back || J.side) return; P.part(P.poly([-6, T.top + 2, 6, T.top + 2, 4, T.top + 24, -4, T.top + 24]), C.grey, { b: 3, sh: 0 }); },
      collar: (P, J, T) => { P.part(P.rect(-6, T.top - 6, 12, 8), C.navy, { b: 2, sh: 0 }); if (!J.back) P.part(P.ell(J.side ? 4 : 0, T.top + 1, 1.6, 1.6), C.gold, { b: 4, sh: 0, hi: 0 }); },
      hair: (P, J) => {
        const h = J.head, d = J.d;
        if (J.back) { P.part(P.path(`M ${h.x - d.rx - 2} ${h.y + 8} L ${h.x - d.rx - 1} ${h.y - 4} Q ${h.x} ${h.y - d.ry - 4} ${h.x + d.rx + 1} ${h.y - 4} L ${h.x + d.rx + 2} ${h.y + 8} Z`), C.raven, { b: 0 }); P.part(P.ell(h.x, h.y - d.ry + 1, d.rx + 1, 3.5), C.raven, { b: 0 }); return; }
        if (J.side) {
          P.part(P.path(`M ${h.x + d.rx - 3} ${h.y - 8} Q ${h.x} ${h.y - d.ry - 3} ${h.x - d.rx - 2} ${h.y - 3} L ${h.x - d.rx - 2} ${h.y + 9} L ${h.x - 4} ${h.y + 9} L ${h.x - 2} ${h.y - 2} L ${h.x + 4} ${h.y - 6} Z`), C.raven, { b: 0 });
          P.part(P.ell(h.x + 2, h.y - d.ry + 1, d.rx, 4), C.raven, { b: 0 });
          P.part(P.ell(h.x - 3, h.y + 6, 1.4, 1.4), C.snow, { b: 4, sh: 0, hi: 0, ol: 0 });
          return;
        }
        P.part(P.path(`M ${h.x - d.rx - 2} ${h.y + 9} L ${h.x - d.rx - 1} ${h.y - 4} Q ${h.x - d.rx} ${h.y - d.ry - 2} ${h.x} ${h.y - d.ry - 2} Q ${h.x + d.rx} ${h.y - d.ry - 2} ${h.x + d.rx + 1} ${h.y - 4} L ${h.x + d.rx + 2} ${h.y + 9} L ${h.x + d.rx - 1} ${h.y + 9} L ${h.x + d.rx - 2} ${h.y - 4} Q ${h.x} ${h.y - 10} ${h.x - d.rx + 2} ${h.y - 4} L ${h.x - d.rx + 1} ${h.y + 9} Z`), C.raven, { b: 0 });
        P.part(P.ell(h.x - 1, h.y - d.ry + 1, d.rx + 1.5, 4), C.raven, { b: 0 });
        P.part(P.ell(h.x + d.rx - 1, h.y - d.ry + 2, 2.5, 2.5), C.raven, { b: 0 });
        P.line(h.x - 4, h.y - d.ry, h.x + 2, h.y - d.ry - 1, C.raven[3]);
        for (const s of [-1, 1]) P.part(P.ell(h.x + s * (d.rx - 0.5), h.y + 5, 1.4, 1.4), C.snow, { b: 4, sh: 0, hi: 0, ol: 0 });
      } },
    emmett: { h: 178, wide: 0.84, legs: C.khaki, shoes: C.wood, coat: C.snow, sleeve: C.snow, eyes: C.hair, brow: C.hair[1], hem: 4, headW: 0.88, headH: 1.1, earK: 1.35,
      hair: cap(C.hair, 3, (P, J) => {
        const h = J.head, d = J.d;
        if (J.back) { for (let i = -1; i <= 1; i++) P.line(h.x + i * 4, h.y - d.ry, h.x + i * 5, h.y - 2, C.hair[1]); return; }
        if (J.side) { P.part(P.ell(h.x + 3, h.y - d.ry - 1, 7, 3.5), C.hair, { b: 3 }); P.line(h.x - 6, h.y - d.ry + 1, h.x + 6, h.y - d.ry - 2, C.hair[4]); return; }
        P.part(P.ell(h.x + 2, h.y - d.ry - 1, d.rx - 1, 3.5), C.hair, { b: 3 });
        P.line(h.x - 4, h.y - d.ry - 1, h.x - 4, h.y - d.ry + 4, C.hair[0]);
        P.line(h.x, h.y - d.ry - 2, h.x + 7, h.y - d.ry - 1, C.hair[4]);
      }),
      over: both(argyle, apron), collar: bowTie(C.green) },
    kid: { h: 172, wide: 1.18, legs: C.plum, shoes: C.raven, coat: C.plum, sleeve: C.plum, pin: C.plum[4], eyes: C.raven, brow: C.raven[0], hem: 10, headW: 1.04, face: 'angry',
      hair: (P, J, o) => {
        cap(C.raven, 1)(P, J, o);
        const h = J.head;
        if (J.side) P.line(h.x + 4, h.y + 5, h.x + 9, h.y + 5, C.raven[0]);
        else if (!J.back) { P.line(h.x - 4, h.y + 5, h.x - 1, h.y + 4, C.raven[0]); P.line(h.x + 1, h.y + 4, h.x + 4, h.y + 5, C.raven[0]); }
        hat(P, J, C.plum, C.raven, 'fedora');
      },
      over: suitDB },
    artie: { h: 152, wide: 0.9, legs: C.grey, shoes: C.wood, coat: C.cream, sleeve: C.cream, cuff: C.cream, eyes: C.green, brow: C.hair[0], hem: 2, face: 'worried',
      hair: (P, J, o) => {
        cap(C.hair, 1)(P, J, o);
        const h = J.head, d = J.d;
        if (o.v !== 'nohat') {
          hat(P, J, C.cream, C.red, 'fedora');
          if (!J.back) P.part(P.poly([h.x + (J.side ? -6 : d.rx - 4), h.y - 10, h.x + (J.side ? -10 : d.rx), h.y - 13, h.x + (J.side ? -10 : d.rx), h.y - 7]), C.red, { b: 3, sh: 0 });
          return;
        }
        if (J.back) return;
        P.part(P.ell(h.x + (J.side ? 3 : -2), h.y - d.ry, J.side ? 6 : d.rx - 1, 3.5), C.hair, { b: 1 });
        P.line(h.x + (J.side ? -2 : -6), h.y - d.ry - 1, h.x + (J.side ? 6 : 2), h.y - d.ry - 2, C.hair[3]);
      },
      over: both(plaidVest, plaidTie) },
    cueball: { h: 158, wide: 1.34, belly: 6, legs: C.wood, shoes: C.raven, coat: C.tan, sleeve: C.tan, eyes: C.sky, brow: C.hair[2], hem: 8, headW: 1.16, face: 'angry',
      hair: (P, J) => hat(P, J, C.wood, null, 'cap'),
      over: cookJacket },
    matches: { h: 176, wide: 0.86, legs: C.sage, shoes: C.raven, coat: C.sage, sleeve: C.sage, eyes: C.hair, brow: C.raven[0], hem: 10, headW: 0.9, headH: 1.1,
      hair: (P, J, o) => {
        cap(C.raven, 1)(P, J, o);
        hat(P, J, C.sage, C.sage[0], 'fedora');
        if (J.back) return;
        const h = J.head, x0 = h.x + (J.side ? 7 : 2), y0 = h.y + 8;
        P.line(x0, y0, x0 + 7, y0 - 2, C.cream[4]);
        P.part(P.rect(x0 + 6, y0 - 3, 2, 2), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
      },
      over: suit3 },
    parker: { h: 160, wide: 0.9, skin: C.umber, legs: C.police, shoes: C.raven, coat: C.police, sleeve: C.police, cuff: C.police, eyes: C.hair, brow: C.raven[0], hem: 8, headW: 0.92, face: 'worried',
      hair: (P, J, o) => { cap(C.raven, 0)(P, J, o); policeCap(P, J); },
      over: uniform }
  };

  for (const [id, L] of Object.entries(LOOKS)) {
    COSTUMES['bt_' + id] = { h: L.h + 6, w: 46 * (L.wide || 1), draw(P, o) { R.draw(P, o, L); } };
  }

  function shag(cx, cy, rx, ry, n, amp, seed) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      const r = 1 + (i % 2 ? amp : -amp * 0.4) * (0.6 + S.hash(i, seed, 11) * 0.8);
      pts.push(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r);
    }
    return pts;
  }

  function dogHead(P, x, y, o, front) {
    const F = C.cream, E2 = C.tan;
    if (front) {
      for (const s of [-1, 1]) P.part(P.poly(shag(x + s * 13, y + 2, 6, 12, 16, 0.18, s + 5)), E2, { b: 2 });
      P.part(P.poly(shag(x, y, 14, 13, 16, 0.18, 2)), F, { b: 3 });
      P.part(P.poly(shag(x, y - 6, 12, 6, 12, 0.3, 3)), F, { b: 4, sh: 0 });
      if (!o.blink) for (const s of [-1, 1]) { P.part(P.ell(x + s * 5, y - 1, 2, 1.8), C.hair, { b: 1, sh: 0, hi: 0 }); P.px(x + s * 5, y - 1, C.pupil); }
      P.part(P.ell(x, y + 6, 6, 4.5), F, { b: 4, sh: 0 });
      P.part(P.ell(x, y + 4, 3, 2.2), C.pupil, { b: 0, sh: 0, hi: 0 });
      if (o.talk) P.part(P.ell(x, y + 10, 3, 2), C.maroon, { b: 1, sh: 0, hi: 0 });
      return;
    }
    P.part(P.poly(shag(x, y, 13, 12, 16, 0.18, 4)), F, { b: 3 });
    P.part(P.poly(shag(x + 9, y + 3, 8, 6, 10, 0.15, 6)), F, { b: 4, sh: 0 });
    P.part(P.ell(x + 16, y + 1, 2.6, 2.2), C.pupil, { b: 0, sh: 0, hi: 0 });
    P.part(P.poly(shag(x - 4, y + 2, 5, 11, 16, 0.18, 7)), E2, { b: 2 });
    P.part(P.poly(shag(x + 3, y - 6, 9, 5, 10, 0.3, 8)), F, { b: 4, sh: 0 });
    if (!o.blink) P.px(x + 7, y - 2, C.pupil);
    if (o.talk) P.part(P.ell(x + 13, y + 8, 3, 2), C.maroon, { b: 1, sh: 0, hi: 0 });
  }

  function fur(P, cx, cy, rx, ry, n, seed) {
    for (let i = 0; i < n; i++) {
      const x = cx + (S.hash(i, seed, 1) - 0.5) * rx * 1.6, y = cy + (S.hash(i, seed, 2) - 0.5) * ry * 1.4;
      P.curve(`M ${x} ${y} Q ${x + 1.5} ${y + 2.5} ${x + 0.5} ${y + 5}`, C.cream[1]);
    }
  }

  function leg(P, x, top, len, lift, br) {
    P.part(P.cap(x, top, x, -2 - lift, 4.2, 3.6), C.cream, { b: br, sh: 1 });
    P.part(P.ell(x + 1, -2 - lift, 4.6, 2.4), C.cream, { b: br + 1, sh: 0 });
  }

  COSTUMES.bt_einstein = {
    h: 62, w: 76,
    draw(P, o) {
      const side = o.dir === 'e' || o.dir === 'w';
      const ph = o.walk >= 0 ? o.walk : 0;
      const sw = o.walk >= 0 ? Math.sin(ph * Math.PI * 2) * 6 : 0;
      const bob = o.walk >= 0 ? -Math.abs(Math.sin(ph * Math.PI * 2)) * 1.5 : 0;
      const F = C.cream;
      if (side) {
        leg(P, -18 + sw * 0.4, -18, 16, Math.max(0, sw) * 0.4, 2);
        leg(P, 14 - sw * 0.4, -18, 16, Math.max(0, -sw) * 0.4, 2);
        P.part(P.poly(shag(-33, -33 + bob, 9, 5, 14, 0.3, 9)), F, { b: 3 });
        P.part(P.poly(shag(-2, -27 + bob, 27, 14, 30, 0.1, 1)), F, { b: 3 });
        fur(P, -2, -28 + bob, 24, 10, 9, 3);
        leg(P, -14 - sw * 0.4, -18, 16, Math.max(0, -sw) * 0.4, 3);
        leg(P, 18 + sw * 0.4, -18, 16, Math.max(0, sw) * 0.4, 3);
        dogHead(P, 26, -38 + bob, o, false);
        return;
      }
      if (o.dir === 'n') {
        for (const x of [-9, 9]) leg(P, x, -16, 14, 0, 3);
        P.part(P.poly(shag(0, -26, 17, 15, 28, 0.1, 12)), F, { b: 3 });
        fur(P, 0, -26, 14, 12, 7, 4);
        P.part(P.poly(shag(0, -14, 5, 8, 12, 0.3, 14)), F, { b: 4, sh: 0 });
        for (const s of [-1, 1]) P.part(P.poly(shag(s * 11, -40, 5, 9, 14, 0.2, s + 30)), C.tan, { b: 2 });
        P.part(P.poly(shag(0, -43, 12, 11, 20, 0.12, 13)), F, { b: 3 });
        return;
      }
      for (const x of [-9, 9]) leg(P, x, -16, 14, o.walk >= 0 && (x > 0) === (sw > 0) ? 2 : 0, 3);
      P.part(P.poly(shag(0, -25, 17, 15, 28, 0.1, 15)), F, { b: 3 });
      P.part(P.poly(shag(0, -22, 9, 11, 16, 0.18, 16)), C.cream, { b: 4, sh: 0 });
      dogHead(P, 0, -42, o, true);
    }
  };

  B.art.dogHead = dogHead;
  B.art.shag = shag;

  Object.assign(A.LOOKS, LOOKS);
  Object.assign(A, { hat, wild, cap, skirt, vest, tie });
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
