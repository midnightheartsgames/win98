(function (S) {
  'use strict';
  const { C } = S;
  const COSTUMES = S.COSTUMES;
  const TAU = Math.PI * 2;

  function spiral(P, x, y, r, t) {
    P.part(P.ell(x, y, r, r), C.eye, { sh: 0, hi: 0 });
    const n = Math.max(3, Math.round(r * 3));
    for (let i = 0; i < n; i++) {
      const a = i * 0.9 + (t || 0);
      const rr = r * (i + 1) / (n + 1);
      P.px(x + Math.cos(a) * rr, y + Math.sin(a) * rr, C.cycle[i % 8]);
    }
  }

  function jimmyHead(P, x, y, o) {
    const R = C.rat;
    P.part(P.ell(x - 3, y - 4.5, 2.6, 2.8), R, { b: 2, sh: 1 });
    P.part(P.ell(x, y, 5, 4.2), R, { b: 3 });
    P.part(P.poly([x + 2, y - 3, x + 10.5, y + 0.2, x + 9.5, y + 2.6, x + 2, y + 3.4]), R, { b: 3, sh: 1 });
    P.part(P.ell(x + 10.2, y + 0.8, 1.5, 1.3), C.pink, { b: 3, sh: 0 });
    P.part(P.ell(x - 0.5, y - 4.8, 2.8, 3.1), R, { b: 3, sh: 1 });
    P.px(x - 0.5, y - 4.5, C.pink[3]);
    P.part(P.rect(x + 5.4, y + 2.6, 1.8, 3), C.eye, { sh: 0, hi: 0 });
    P.part(P.rect(x + 7.2, y + 2.4, 1.8, 3), C.eye, { sh: 0, hi: 0 });
    if (o.hypno || o.act === 'hypno') { P.px(x + 3, y - 1.5, C.cycle[1]); P.px(x + 3, y - 0.5, C.cycle[4]); }
    else if (o.blink) P.px(x + 3, y - 1, C.black);
    else { P.px(x + 3, y - 1.5, C.pupil); P.px(x + 3, y - 0.5, C.pupil); P.px(x + 3.8, y - 1.5, C.eye); }
    P.line(x + 8, y + 1, x + 12.5, y - 1.2, R[1]);
    P.line(x + 8, y + 1.6, x + 12.5, y + 2.6, R[1]);
    if (o.talk) P.part(P.ell(x + 6, y + 3.4, 1.8, 1), C.red, { b: 1, sh: 0, hi: 0 });
  }

  COSTUMES.jimmy = {
    h: 26, w: 16,
    draw(P, o) {
      const act = o.act || '';
      const R = C.rat;
      if (act === 'peek') { jimmyHead(P, 0, -5, o); return; }
      P.part(P.cap(-4, -3, -14, -6, 1.1, 0.6), C.pink, { b: 2, sh: 0 });
      P.part(P.ell(-2.5, -2.2, 3.8, 2.2), R, { b: 2 });
      P.part(P.ell(-1, -8.5, 5.4, 6.6, 0.2), R, { b: 3 });
      P.part(P.ell(1.4, -7.5, 2.8, 4.4), R, { b: 4, sh: 0 });
      P.part(P.ell(2.8, -1, 2.6, 1.2), C.pink, { b: 3, sh: 0 });
      jimmyHead(P, 3.5, -17, o);
      if (act === 'phone') {
        P.part(P.cap(2, -11, 7, -13, 1.1), R, { b: 3, sh: 0 });
        P.part(P.cap(5, -9, 11, -20, 1.8), C.grey, { b: 1, sh: 0 });
        P.part(P.ell(11, -20.5, 2.4, 1.8), C.grey, { b: 1, sh: 0 });
        P.part(P.ell(5, -8.5, 2.4, 1.8), C.grey, { b: 1, sh: 0 });
      } else if (act === 'eat') {
        P.part(P.poly([8, -12, 14, -11, 13, -7, 8, -8]), C.cheese, { b: 3, sh: 1 });
        P.px(10, -10, C.cheese[1]);
        P.part(P.cap(2, -11, 8, -10, 1.1), R, { b: 3, sh: 0 });
      } else {
        P.part(P.cap(2, -11, 5, -8, 1.1), R, { b: 3, sh: 0 });
      }
    }
  };

  function boscoHead(P, x, y, o) {
    const K = C.dskin;
    P.part(P.ell(x - 10, y + 1, 2.6, 3.6), K, { b: 2 });
    P.part(P.ell(x + 10, y + 1, 2.6, 3.6), K, { b: 2 });
    P.part(P.ell(x, y, 10, 11), K, { b: 3 });
    P.part(P.ell(x - 4, y - 7, 2.6, 1.4), K, { b: 4, sh: 0, hi: 0, ol: 0 });
    P.part(P.ell(x, y + 8.5, 6.5, 3.4), K, { b: 3, sh: 1 });
    P.line(x - 7.5, y - 3.5, x - 2, y - 2.2, C.black);
    P.line(x + 2, y - 2.2, x + 7.5, y - 3.5, C.black);
    const look = o.v === 'wary' ? -1 : o.v === 'wary2' ? 1 : 0;
    for (const ex of [-4.5, 4.5]) {
      P.part(P.ell(x + ex, y, 2.3, 1.3), C.eye, { sh: 0, hi: 0 });
      if (!o.blink) P.px(x + ex + look, y, C.pupil); else P.line(x + ex - 2, y, x + ex + 2, y, C.black);
      P.line(x + ex - 2, y + 2.2, x + ex + 1.5, y + 2.2, K[1]);
    }
    P.part(P.ell(x, y + 3.5, 3.2, 2.6), K, { b: 2, sh: 1 });
    if (o.talk) P.part(P.ell(x, y + 9.5, 3.2, 2), C.red, { b: 1, sh: 0, hi: 0 });
    else P.line(x - 3, y + 9.5, x + 3, y + 9.5, C.black);
    P.part(P.path(`M ${x - 7.5} ${y + 7.5} Q ${x} ${y + 3.2} ${x + 7.5} ${y + 7.5} Q ${x + 4} ${y + 9.2} ${x} ${y + 7.6} Q ${x - 4} ${y + 9.2} ${x - 7.5} ${y + 7.5} Z`), C.grey, { b: 0, sh: 0, hi: 1 });
  }

  COSTUMES.bosco = {
    h: 80, w: 44,
    draw(P, o) {
      const act = o.act || '';
      const K = C.dskin;
      P.part(P.cap(-6, -27, -6.5, -4, 4.5, 4), C.navy, { b: 2, sh: 1 });
      P.part(P.cap(6, -27, 6.5, -4, 4.5, 4), C.navy, { b: 2, sh: 1 });
      P.part(P.ell(-7, -2, 5, 2.4), C.grey, { b: 1, sh: 0 });
      P.part(P.ell(7, -2, 5, 2.4), C.grey, { b: 1, sh: 0 });
      P.part(P.path('M -15 -53 Q -21 -40 -16 -25 L 16 -25 Q 21 -40 15 -53 Z'), C.grey, { b: 4 });
      P.part(P.path('M -13 -51 Q -18 -39 -15 -26 L 15 -26 Q 18 -39 13 -51 L 5 -51 L 0 -41 L -5 -51 Z'), C.orange, { b: 2 });
      for (let yy = -48; yy < -27; yy += 3) for (let xx = -12; xx <= 12; xx += 4) P.px(xx + (yy % 2 ? 1 : 0), yy, C.orange[1]);
      P.part(P.poly([-5, -51, 5, -51, 0, -41]), C.grey, { b: 4, sh: 0, hi: 0 });
      P.part(P.rect(-4, -56, 8, 5), K, { b: 2, sh: 0 });
      const arm = (sx, ex, ey) => {
        P.part(P.cap(sx, -49, (sx + ex) / 2, (-49 + ey) / 2, 3.8, 3.4), C.grey, { b: 4, sh: 1 });
        P.part(P.cap((sx + ex) / 2, (-49 + ey) / 2, ex, ey, 3.2, 2.8), K, { b: 3, sh: 1 });
        P.part(P.ell(ex, ey + 1, 3.4, 3), K, { b: 3, sh: 1 });
      };
      if (act === 'give') { arm(-15, -30, -40); arm(15, 19, -29); }
      else if (act === 'point') { arm(-15, -19, -29); arm(15, 24, -64); }
      else if (act === 'build') { arm(-15, -8, -36 - (Math.floor((o.t || 0) * 8) % 2) * 5); arm(15, 9, -34); }
      else if (act === 'shrug') { arm(-15, -24, -48); arm(15, 24, -48); }
      else { arm(-15, -19, -29); arm(15, 19, -29); }
      boscoHead(P, 0, -66, o);
    }
  };

  function sybilHead(P, x, y, o) {
    const Hh = C.hair;
    P.part(P.ell(x, y - 8, 8.5, 7.5), Hh, { b: 2 });
    P.part(P.ell(x + 1, y - 15, 5.5, 5), Hh, { b: 3 });
    P.part(P.ell(x, y, 6.2, 7.6), C.skin, { b: 3 });
    P.part(P.path(`M ${x - 7} ${y - 1} Q ${x - 7} ${y - 9} ${x} ${y - 8.5} Q ${x + 7} ${y - 9} ${x + 7} ${y - 1} Q ${x + 5} ${y - 6} ${x} ${y - 6} Q ${x - 5} ${y - 6} ${x - 7} ${y - 1} Z`), Hh, { b: 3 });
    for (const ex of [-2.8, 2.8]) {
      P.part(P.poly([x + ex - 2.6, y - 2.2, x + ex + 2.6, y - 2.6 - (ex > 0 ? 0.8 : -0.4), x + ex + 2.2, y + 0.8, x + ex - 2.2, y + 0.8]), C.eye, { sh: 0, hi: 0 });
      if (o.blink) P.line(x + ex - 1.5, y - 0.5, x + ex + 1.5, y - 0.5, C.black);
      else { P.px(x + ex, y - 0.8, C.pupil); P.px(x + ex, y + 0.2, C.pupil); }
    }
    P.px(x - 6, y - 3, C.black); P.px(x + 6, y - 3.5, C.black);
    P.line(x, y + 0.5, x + 0.8, y + 2.2, C.skin[1]);
    if (o.talk) P.part(P.ell(x, y + 4.4, 2.6, 1.8), C.red, { b: 1, sh: 0, hi: 0, ol: C.red[3] });
    else P.part(P.ell(x, y + 4.4, 2.6, 1.3), C.red, { b: 3, sh: 0, hi: 0 });
    P.px(x - 6.4, y + 2, C.gold[3]); P.px(x + 6.4, y + 2, C.gold[3]);
  }

  COSTUMES.sybil = {
    h: 86, w: 30,
    draw(P, o) {
      const act = o.act || '';
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      P.part(P.cap(-3, -24, -3.5 - w * 2, -5, 2.3, 1.8), C.grey, { b: 1, sh: 0 });
      P.part(P.cap(3, -24, 3.5 + w * 2, -5, 2.3, 1.8), C.grey, { b: 1, sh: 0 });
      P.part(P.poly([-6 - w * 2, -5, -1.5 - w * 2, -5, -1.5 - w * 2, -1, -6.5 - w * 2, -0.5]), C.red, { b: 3, sh: 0 });
      P.part(P.poly([1.5 + w * 2, -5, 6 + w * 2, -5, 6.5 + w * 2, -0.5, 1.5 + w * 2, -1]), C.red, { b: 3, sh: 0 });
      P.part(P.path('M -7 -56 Q -10.5 -44 -8.5 -34 Q -9.5 -26 -8 -19 L 8 -19 Q 9.5 -26 8.5 -34 Q 10.5 -44 7 -56 Z'), C.purple, { b: 3 });
      P.part(P.rect(-8.5, -38, 17, 2.5), C.pink, { b: 2, sh: 0 });
      let lx = -11, ly = -37, rx = 11, ry = -37;
      if (act === 'shock') { lx = -12; ly = -66; rx = 12; ry = -66; }
      if (act === 'clip' || act === 'write') { lx = -3; ly = -40; rx = 5; ry = -41; }
      if (act === 'point') { rx = 20; ry = -52; }
      P.part(P.cap(-7.5, -54, lx, ly, 1.9, 1.6), C.skin, { b: 3, sh: 0 });
      P.part(P.cap(7.5, -54, rx, ry, 1.9, 1.6), C.skin, { b: 3, sh: 0 });
      if (act === 'clip' || act === 'write') {
        P.part(P.poly([-4, -48, 6, -49, 7, -35, -3, -34]), C.oak, { b: 3 });
        P.part(P.poly([-2.5, -46, 5, -47, 5.5, -36.5, -2, -36]), C.grey, { b: 5, sh: 0, hi: 0 });
        for (let i = 0; i < 3; i++) P.line(-1.5, -44 + i * 3, 4, -44.5 + i * 3, C.grey[2]);
      }
      P.part(P.cap(0, -56, 0, -62, 2.2), C.skin, { b: 3, sh: 0 });
      sybilHead(P, 0, -69, o);
    }
  };

  const POP = {
    specs: { hair: C.fur, face: 'specs' },
    whizzer: { hair: C.yellow, face: 'whiz' },
    peepers: { hair: C.grey, face: 'peep' }
  };

  function popperHead(P, x, y, kind, o) {
    const cfg = POP[kind];
    const v = o.v || '';
    const hyp = o.hypno || o.act === 'hypno';
    if (v === 'wig') {
      P.part(P.ell(x, y - 8, 10, 7.5), C.hair, { b: 2 });
      P.part(P.ell(x + 1, y - 14, 6, 5), C.hair, { b: 3 });
    }
    P.part(P.ell(x, y, 9, 8.5), C.skin, { b: 3 });
    P.part(P.ell(x - 9, y + 1, 1.8, 2.6), C.skin, { b: 2, sh: 0 });
    P.part(P.ell(x + 9, y + 1, 1.8, 2.6), C.skin, { b: 2, sh: 0 });
    if (v === 'brady') {
      P.part(P.path(`M ${x - 9} ${y - 2} Q ${x - 12} ${y - 15} ${x} ${y - 17} Q ${x + 12} ${y - 18} ${x + 10} ${y - 5} Q ${x + 6} ${y - 9} ${x - 9} ${y - 2} Z`), C.yellow, { b: 3 });
      P.curve(`M ${x - 5} ${y - 10} Q ${x + 1} ${y - 15} ${x + 7} ${y - 10}`, C.yellow[1]);
    } else if (v !== 'wig') {
      if (cfg.face === 'peep') P.part(P.path(`M ${x - 9} ${y + 1} Q ${x - 10} ${y - 9} ${x} ${y - 9.5} Q ${x + 10} ${y - 9} ${x + 9} ${y + 1} L ${x + 7} ${y - 3} L ${x - 7} ${y - 3} Z`), cfg.hair, { b: 1 });
      else if (cfg.face === 'whiz') P.part(P.path(`M ${x - 8} ${y - 3} Q ${x} ${y - 11} ${x + 8} ${y - 3} Q ${x} ${y - 6} ${x - 8} ${y - 3} Z`), cfg.hair, { b: 3 });
      else { P.part(P.ell(x - 7.5, y - 3, 3, 4), cfg.hair, { b: 2 }); P.part(P.ell(x + 7.5, y - 3, 3, 4), cfg.hair, { b: 2 }); }
      P.part(P.poly([x - 8, y - 6, x + 8, y - 6, x + 6, y - 13, x - 6, y - 13]), C.grey, { b: 5, sh: 1, hi: 0 });
      P.part(P.poly([x - 7.6, y - 8.2, x + 7.6, y - 8.2, x + 7.2, y - 10, x - 7.2, y - 10]), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
    }
    const gassed = o.act === 'gassed';
    if (cfg.face === 'specs' && !gassed) {
      for (const ex of [-4, 4]) {
        P.part(P.ell(x + ex, y, 3.6, 3.6), C.grey, { b: 0, sh: 0, hi: 0 });
        if (hyp) spiral(P, x + ex, y, 2.6, o.t);
        else {
          P.part(P.ell(x + ex, y, 2.6, 2.6), C.eye, { sh: 0, hi: 0, ol: 0 });
          if (!o.blink) P.px(x + ex, y, C.pupil);
        }
      }
      P.line(x - 0.5, y, x + 0.5, y, C.black);
    } else if (cfg.face === 'peep' && !gassed) {
      for (const ex of [-4, 4]) {
        if (hyp) spiral(P, x + ex, y - 0.5, 3.5, o.t);
        else {
          P.part(P.ell(x + ex, y - 0.5, 3.5, 4.2), C.eye, { sh: 0, hi: 0 });
          if (!o.blink) { P.px(x + ex + (ex < 0 ? 1 : -1), y - 0.5, C.pupil); }
          else P.line(x + ex - 3, y - 0.5, x + ex + 3, y - 0.5, C.black);
        }
      }
    } else if (!gassed) {
      for (const ex of [-3.5, 3.5]) {
        if (hyp) spiral(P, x + ex, y - 1, 2.2, o.t);
        else if (o.blink) P.line(x + ex - 1.5, y - 1, x + ex + 1.5, y - 1, C.black);
        else { P.part(P.ell(x + ex, y - 1, 1.8, 2.2), C.eye, { sh: 0, hi: 0 }); P.px(x + ex, y - 0.5, C.pupil); }
      }
      P.part(P.ell(x + 7.5, y - 5, 0.9, 1.4), C.sky, { b: 4, sh: 0, hi: 0 });
    } else {
      for (const ex of [-4, 4]) { P.line(x + ex - 2.5, y - 1, x + ex + 2.5, y, C.black); P.part(P.ell(x + ex, y + 3.5, 0.9, 1.6), C.sky, { b: 4, sh: 0, hi: 0 }); }
    }
    P.part(P.ell(x, y + 2.5, 1.4, 1.1), C.skin, { b: 2, sh: 0, hi: 0, ol: 0 });
    if (o.talk || o.act === 'worship' || o.act === 'sing') P.part(P.ell(x, y + 5.4, 2.4, 1.8), C.red, { b: 1, sh: 0, hi: 0 });
    else if (cfg.face === 'whiz') P.curve(`M ${x - 3} ${y + 5.5} Q ${x - 1.5} ${y + 4.5} ${x} ${y + 5.5} Q ${x + 1.5} ${y + 6.5} ${x + 3} ${y + 5.5}`, C.black);
    else if (hyp) P.line(x - 2.5, y + 5.5, x + 2.5, y + 5.5, C.black);
    else P.curve(`M ${x - 3} ${y + 4.8} Q ${x} ${y + 6.8} ${x + 3} ${y + 4.8}`, C.black);
  }

  function stripes(P, m) {
    const x0 = P.X(0);
    m.each((x, y) => {
      const edge = !m.has(x - 1, y) || !m.has(x + 1, y) || !m.has(x, y - 1) || !m.has(x, y + 1);
      P.b.set(x, y, edge ? C.black : (Math.floor((x - x0 + 100) / 2) % 2 ? C.red[3] : C.grey[5]));
    });
  }

  function popper(kind) {
    return {
      h: 56, w: 26,
      draw(P, o) {
        const act = o.act || '';
        if (act === 'ko' || act === 'sleep') return popperDown(P, kind, o);
        const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
        const bob = o.walk >= 0 ? -Math.abs(w) * 1.5 : 0;
        const run = act === 'run';
        const gov = o.v === 'gov';
        const plain = gov || o.v === 'nobasket';
        const cross = kind === 'whizzer' && o.walk < 0 && !act;
        const kneel = act === 'worship';
        const dance = act === 'dance' ? Math.sin((o.t || 0) * 10) : 0;
        const by = bob + (kneel ? 6 : 0);
        if (kneel) {
          P.part(P.ell(-4, -3, 4, 3), C.skin, { b: 3 });
          P.part(P.ell(4, -3, 4, 3), C.skin, { b: 3 });
        } else if (cross) {
          P.part(P.cap(-3, -13, 2.5, -4, 2, 1.8), C.skin, { b: 3, sh: 0 });
          P.part(P.cap(3, -13, -2.5, -4, 2, 1.8), C.skin, { b: 3, sh: 0 });
          P.part(P.ell(3.5, -2, 3.2, 1.8), C.grey, { b: 0, sh: 0 });
          P.part(P.ell(-3.5, -2, 3.2, 1.8), C.grey, { b: 0, sh: 0 });
        } else {
          const k = run ? 3.5 : 2;
          P.part(P.cap(-3, -13 + by, -3 - w * k + dance * 2, -4 - (w > 0 ? w * 2 : 0), 2, 1.8), C.skin, { b: 3, sh: 0 });
          P.part(P.cap(3, -13 + by, 3 + w * k + dance * 2, -4 - (w < 0 ? -w * 2 : 0), 2, 1.8), C.skin, { b: 3, sh: 0 });
          P.part(P.rect(-5 - w * k + dance * 2, -6 - (w > 0 ? w * 2 : 0), 4, 2), C.grey, { b: 5, sh: 0, hi: 0 });
          P.part(P.rect(1 + w * k + dance * 2, -6 - (w < 0 ? -w * 2 : 0), 4, 2), C.grey, { b: 5, sh: 0, hi: 0 });
          P.part(P.ell(-3.5 - w * k + dance * 2, -2 - (w > 0 ? w * 2 : 0), 3.2, 1.8), C.grey, { b: 0, sh: 0 });
          P.part(P.ell(3.5 + w * k + dance * 2, -2 - (w < 0 ? -w * 2 : 0), 3.2, 1.8), C.grey, { b: 0, sh: 0 });
        }
        P.part(P.poly([-6.5, -18 + by, 6.5, -18 + by, 7, -11 + by, -7, -11 + by]), C.blue, { b: 2 });
        const torso = P.poly([-7, -30 + by, 7, -30 + by, 7.5, -17 + by, -7.5, -17 + by]);
        stripes(P, torso);
        if (gov) {
          P.part(P.poly([-7, -30 + by, -3.4, -30 + by, 7.5, -20 + by, 7.5, -17 + by, 4.4, -17 + by, -7, -26.6 + by]), C.blue, { b: 3, sh: 0, hi: 0 });
          P.part(P.ell(1, -23.4 + by, 1.7, 1.7), C.gold, { b: 4, sh: 0, hi: 0 });
        }
        let la = [-10, -20], ra = [10, -20];
        if (act === 'spray') ra = [12, -36];
        if (act === 'basket' || kind === 'whizzer' && !act && !plain) { la = [-5, -21]; ra = [5, -21]; }
        if (run) { la = [-10 + w * 3, -25]; ra = [10 - w * 3, -25]; }
        if (act === 'gassed') { la = [-4, -37]; ra = [4, -37]; }
        if (act === 'worship') { la = [-3, -38]; ra = [3, -38]; }
        if (act === 'attack') { la = [-9, -34]; ra = [9, -34]; }
        if (act === 'dance') { la = [-11, -34 + dance * 4]; ra = [11, -34 - dance * 4]; }
        if (act === 'hypno') { la = [-6, -25]; ra = [6, -25]; }
        if (act === 'sing') { la = [-11, -31 + dance * 3]; ra = [3, -33]; }
        P.part(P.cap(-6.5, -28 + by, la[0], la[1] + by, 2.1, 1.8), C.red, { b: 3, sh: 0 });
        P.part(P.cap(6.5, -28 + by, ra[0], ra[1] + by, 2.1, 1.8), C.red, { b: 3, sh: 0 });
        P.part(P.ell(la[0], la[1] + by + 1, 2, 1.9), C.skin, { b: 3, sh: 0 });
        P.part(P.ell(ra[0], ra[1] + by + 1, 2, 1.9), C.skin, { b: 3, sh: 0 });
        if (act === 'spray') {
          P.part(P.rect(ra[0] - 1, ra[1] + by - 6, 3.5, 6.5), C.green, { b: 3, sh: 0 });
          P.px(ra[0], ra[1] + by - 7, C.grey[4]);
        }
        if (act === 'sing') {
          P.part(P.cap(ra[0], ra[1] + by, ra[0] - 1, ra[1] + by - 4, 1.1), C.grey, { b: 1, sh: 0 });
          P.part(P.ell(ra[0] - 1.3, ra[1] + by - 5.5, 1.9, 1.9), C.grey, { b: 3, sh: 0 });
        }
        if ((act === 'basket' || kind === 'whizzer' && !act) && !plain) {
          P.part(P.poly([-8, -22 + by, 8, -22 + by, 6, -13 + by, -6, -13 + by]), C.oak, { b: 3 });
          for (let i = -6; i <= 6; i += 3) P.line(i, -21 + by, i * 0.8, -14 + by, C.oak[1]);
          P.curve(`M -6 ${-22 + by} Q 0 ${-31 + by} 6 ${-22 + by}`, C.oak[1]);
          if (o.v === 'cheese') P.part(P.poly([-3, -22 + by, 4, -23 + by, 3, -20 + by, -3, -20 + by]), C.cheese, { b: 3, sh: 0 });
        }
        P.part(P.poly([-2.5, -31 + by, 0, -29.5 + by, 2.5, -31 + by, 2.5, -28 + by, 0, -29.5 + by, -2.5, -28 + by]), C.blue, { b: 3, sh: 0, hi: 0 });
        popperHead(P, 0, -38 + by, kind, o);
        if (act === 'attack') { P.line(-11, -40 + by, -14, -43 + by, C.black); P.line(11, -40 + by, 14, -43 + by, C.black); }
      }
    };
  }

  function popperDown(P, kind, o) {
    P.part(P.poly([-10, -7, 6, -8, 6, -1, -10, 0]), C.red, { b: 3 });
    stripes(P, P.poly([-10, -8, 6, -8, 6, -1, -10, -1]));
    P.part(P.poly([6, -7, 13, -7, 13, -1, 6, -1]), C.blue, { b: 2 });
    P.part(P.cap(13, -5, 22, -4, 2, 1.8), C.skin, { b: 3, sh: 0 });
    P.part(P.cap(13, -2, 21, -1, 2, 1.8), C.skin, { b: 3, sh: 0 });
    P.part(P.ell(23, -4, 2, 3), C.grey, { b: 0, sh: 0 });
    P.part(P.ell(22, -1, 2, 3), C.grey, { b: 0, sh: 0 });
    popperHead(P.scaled(-18, -8, 1), -18, -8, kind, Object.assign({}, o, { act: '', blink: true, talk: false }));
    if (o.act === 'ko') {
      for (let i = 0; i < 3; i++) {
        const a = (o.t || 0) * 3 + i * TAU / 3;
        P.part(P.ell(-18 + Math.cos(a) * 9, -20 + Math.sin(a) * 2.2, 1.5, 1.5), C.yellow, { b: 4, sh: 0, hi: 0 });
      }
    } else {
      S.font.draw(P.b, 'z', P.X(-10), P.Y(-24), C.grey[5]);
      S.font.draw(P.b, 'Z', P.X(-5), P.Y(-30), C.grey[5]);
    }
  }

  COSTUMES.specs = popper('specs');
  COSTUMES.whizzer = popper('whizzer');
  COSTUMES.peepers = popper('peepers');

  function bradyHair(P, x, y) {
    P.part(P.path(`M ${x - 8.5} ${y - 2} Q ${x - 11.5} ${y - 14} ${x - 2} ${y - 17.5} Q ${x + 9} ${y - 20} ${x + 11} ${y - 11} Q ${x + 11} ${y - 5} ${x + 8.5} ${y - 2} Q ${x + 6} ${y - 8} ${x} ${y - 7} Q ${x - 5} ${y - 7} ${x - 8.5} ${y - 2} Z`), C.yellow, { b: 3 });
    P.curve(`M ${x - 6} ${y - 9} Q ${x - 1} ${y - 16} ${x + 7} ${y - 12}`, C.yellow[1]);
    P.curve(`M ${x - 3} ${y - 7.5} Q ${x + 2} ${y - 12} ${x + 8} ${y - 8}`, C.yellow[4]);
  }

  function bradyHead(P, x, y, o) {
    const skin = C.skin;
    P.part(P.ell(x - 7.8, y + 1, 1.8, 2.8), skin, { b: 2, sh: 0 });
    P.part(P.ell(x + 7.8, y + 1, 1.8, 2.8), skin, { b: 2, sh: 0 });
    P.part(P.path(`M ${x - 7.5} ${y - 4} Q ${x - 8} ${y + 7} ${x - 3} ${y + 9.5} L ${x + 3} ${y + 9.5} Q ${x + 8} ${y + 7} ${x + 7.5} ${y - 4} Q ${x} ${y - 9} ${x - 7.5} ${y - 4} Z`), skin, { b: 2 });
    bradyHair(P, x, y);
    P.line(x - 5.5, y - 3.2, x - 1.5, y - 3.8, C.yellow[1]);
    P.line(x + 1.5, y - 3.8, x + 5.5, y - 3.2, C.yellow[1]);
    const hyp = o.act === 'hypno' || o.hypno;
    for (const ex of [-3.4, 3.4]) {
      if (hyp) spiral(P, x + ex, y - 0.5, 2.6, o.t);
      else if (o.blink) P.line(x + ex - 1.5, y - 0.5, x + ex + 1.5, y - 0.5, C.black);
      else if (o.v === 'dazed') { P.part(P.ell(x + ex, y - 0.5, 2, 2.2), C.eye, { sh: 0, hi: 0 }); P.px(x + ex, y + 0.5, C.pupil); }
      else { P.part(P.ell(x + ex, y - 0.5, 2, 2.2), C.eye, { sh: 0, hi: 0 }); P.px(x + ex, y - 0.5, C.blue[2]); }
    }
    P.line(x, y + 0.5, x - 0.8, y + 3, skin[1]);
    if (o.talk) {
      P.part(P.path(`M ${x - 4.5} ${y + 4.5} Q ${x} ${y + 3.5} ${x + 4.5} ${y + 4.5} Q ${x + 3} ${y + 9} ${x} ${y + 9} Q ${x - 3} ${y + 9} ${x - 4.5} ${y + 4.5} Z`), C.red, { b: 1, sh: 0, hi: 0 });
      P.part(P.poly([x - 3.5, y + 4.5, x + 3.5, y + 4.5, x + 3, y + 6, x - 3, y + 6]), C.eye, { sh: 0, hi: 0, ol: 0 });
    } else {
      P.part(P.path(`M ${x - 5} ${y + 4.5} Q ${x} ${y + 3.6} ${x + 5} ${y + 4.5} Q ${x} ${y + 8.5} ${x - 5} ${y + 4.5} Z`), C.eye, { sh: 0, hi: 0 });
      P.line(x - 3.8, y + 5.6, x + 3.8, y + 5.6, C.grey[3]);
    }
  }

  COSTUMES.brady = {
    h: 80, w: 34,
    draw(P, o) {
      const act = o.act || '';
      if (act === 'ko') {
        P.part(P.ell(0, -6, 16, 6), C.blue, { b: 3 });
        P.part(P.cap(12, -5, 26, -4, 3.2, 3), C.cream, { b: 3 });
        P.part(P.ell(28, -4, 3, 2), C.grey, { b: 5, sh: 0 });
        bradyHead(P.scaled(-20, -9, 1), -20, -9, { v: 'dazed', blink: false });
        return;
      }
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      P.part(P.cap(-4.5, -28, -5 - w * 3, -4, 3.6, 3.2), C.cream, { b: 3, sh: 1 });
      P.part(P.cap(4.5, -28, 5 + w * 3, -4, 3.6, 3.2), C.cream, { b: 3, sh: 1 });
      P.part(P.ell(-6 - w * 3, -2, 4.5, 2.2), C.grey, { b: 5, sh: 1 });
      P.part(P.ell(6 + w * 3, -2, 4.5, 2.2), C.grey, { b: 5, sh: 1 });
      P.part(P.path('M -12 -52 Q -13 -40 -9 -27 L 9 -27 Q 13 -40 12 -52 Q 0 -55 -12 -52 Z'), C.blue, { b: 3 });
      P.part(P.rect(-9, -29, 18, 2.6), C.oak, { b: 2, sh: 0 });
      P.part(P.rect(-1.5, -29, 3, 2.6), C.gold, { b: 3, sh: 0, hi: 0 });
      P.part(P.rect(-4, -57, 8, 5), C.blue, { b: 3, sh: 0 });
      for (let i = -3; i <= 3; i += 2) P.line(i, -56, i, -53, C.blue[1]);
      let la = [-15, -30], ra = [15, -30];
      if (act === 'arms') { la = [-24, -62]; ra = [24, -62]; }
      if (act === 'hypno') { la = [-7, -44]; ra = [7, -44]; }
      if (act === 'point') ra = [24, -48];
      if (act === 'bow') { la = [-10, -26]; ra = [10, -26]; }
      P.part(P.cap(-11, -50, la[0], la[1], 3, 2.6), C.blue, { b: 3, sh: 1 });
      P.part(P.cap(11, -50, ra[0], ra[1], 3, 2.6), C.blue, { b: 3, sh: 1 });
      P.part(P.ell(la[0], la[1] + 1, 2.8, 2.6), C.skin, { b: 2, sh: 0 });
      P.part(P.ell(ra[0], ra[1] + 1, 2.8, 2.6), C.skin, { b: 2, sh: 0 });
      if (act === 'hypno') { P.px(la[0], la[1] - 3, C.cycle[0]); P.px(ra[0], ra[1] - 3, C.cycle[3]); P.px(la[0] - 2, la[1] - 1, C.cycle[5]); P.px(ra[0] + 2, ra[1] - 1, C.cycle[6]); }
      bradyHead(P, 0, act === 'bow' ? -61 : -66, o);
    }
  };

  COSTUMES.monkey = {
    h: 32, w: 22,
    draw(P, o) {
      const clap = o.act === 'clap' && Math.floor((o.t || 0) * 8) % 2 === 0;
      P.part(P.ell(-3, -2, 3, 2), C.fur, { b: 2 });
      P.part(P.ell(3, -2, 3, 2), C.fur, { b: 2 });
      P.part(P.ell(0, -9, 6, 7), C.fur, { b: 3 });
      P.part(P.poly([-5.5, -14, 5.5, -14, 5, -5, -5, -5]), C.red, { b: 3 });
      P.part(P.ell(0, -19, 6, 5.5), C.fur, { b: 3 });
      P.part(P.ell(-6, -19, 1.8, 2.2), C.fur, { b: 2, sh: 0 });
      P.part(P.ell(6, -19, 1.8, 2.2), C.fur, { b: 2, sh: 0 });
      P.part(P.ell(0, -17.5, 4, 3.4), C.sand, { b: 4, sh: 0 });
      P.part(P.ell(-2, -20, 1.4, 1.6), C.eye, { sh: 0, hi: 0 }); P.px(-2, -20, C.pupil);
      P.part(P.ell(2, -20, 1.4, 1.6), C.eye, { sh: 0, hi: 0 }); P.px(2, -20, C.pupil);
      if (o.talk || clap) P.part(P.ell(0, -16, 2.2, 1.2), C.red, { b: 1, sh: 0, hi: 0 });
      else P.curve('M -2.5 -16.5 Q 0 -14.8 2.5 -16.5', C.black);
      P.part(P.poly([-3.5, -23, 3.5, -23, 2.5, -28, -2.5, -28]), C.red, { b: 3, sh: 1 });
      P.part(P.cap(0, -28, 4, -26, 0.6), C.gold, { b: 3, sh: 0 });
      const cx = clap ? 3.5 : 9;
      P.part(P.cap(-4, -12, -cx, -12, 1.4), C.fur, { b: 3, sh: 0 });
      P.part(P.cap(4, -12, cx, -12, 1.4), C.fur, { b: 3, sh: 0 });
      P.part(P.ell(-cx - 0.5, -12, 1.4, 4.2), C.gold, { b: 3, sh: 0 });
      P.part(P.ell(cx + 0.5, -12, 1.4, 4.2), C.gold, { b: 3, sh: 0 });
      if (clap) { P.line(-2, -19, -4, -22, C.yellow[4]); P.line(2, -19, 4, -22, C.yellow[4]); P.line(0, -18, 0, -23, C.yellow[4]); }
    }
  };

  COSTUMES.bulb = {
    h: 30, w: 20,
    draw(P, o) {
      const on = o.v !== 'off';
      P.line(0, -30, 0, -22, C.black);
      P.part(P.rect(-3, -23, 6, 4), C.grey, { b: 2, sh: 0 });
      P.part(P.ell(0, -12, 7.5, 8.5), on ? [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp] : C.grey, { b: on ? 2 : 3 });
      bradyHead(P.scaled(0, -12, 0.55), 0, -12, Object.assign({}, o, { v: on ? '' : 'dazed', blink: !on }));
    }
  };

  COSTUMES.bradycheese = {
    h: 36, w: 36,
    draw(P, o) {
      P.part(P.path('M -16 0 L -12 -16 L -4 -26 L 6 -28 L 14 -20 L 17 0 Z'), C.cheese, { b: 3 });
      for (const [x, y] of [[-8, -6], [9, -8], [-11, -2], [12, -3], [3, -24]]) P.part(P.ell(x, y, 1.6, 1.4), C.cheese, { b: 0, sh: 0, hi: 0, ol: C.cheese[1] });
      bradyHead(P.scaled(0, -14, 0.9), 0, -14, o);
    }
  };

  COSTUMES.bradymax = {
    h: 60, w: 26,
    draw(P, o) {
      S.art.maxBody(P, o);
      bradyHead(P.scaled(0, -24, 0.95), 0, -24, o);
    }
  };

  COSTUMES.van = {
    h: 50, w: 80,
    draw(P, o) {
      P.part(P.poly([-38, -8, -38, -40, 20, -40, 30, -28, 38, -24, 38, -8]), C.cream, { b: 3 });
      P.part(P.poly([21, -38, 29, -28, 21, -28]), C.sky, { b: 3, sh: 0 });
      P.part(P.rect(-38, -12, 76, 4), C.grey, { b: 2, sh: 0 });
      P.part(P.ell(-24, -6, 6, 6), C.grey, { b: 0 });
      P.part(P.ell(24, -6, 6, 6), C.grey, { b: 0 });
      P.part(P.ell(-24, -6, 2.5, 2.5), C.grey, { b: 3, sh: 0 });
      P.part(P.ell(24, -6, 2.5, 2.5), C.grey, { b: 3, sh: 0 });
      P.part(P.ell(-12, -26, 9, 7), C.eye, { sh: 0, hi: 0 });
      P.part(P.ell(-12, -26, 4, 4), C.blue, { b: 2, sh: 0, hi: 0 });
      P.px(-12, -26, C.pupil);
      S.font.drawCentered(P.b, 'EYE-BO', P.X(10), P.Y(-24), C.red[3], C.black);
    }
  };

  function portrait(id) {
    const b = new S.Buf(24, 20);
    const P = new S.Pen(b);
    const o = { talk: false, blink: false };
    if (id === 'jimmy') { P.at(8, 12, 1.1); jimmyHead(P, 0, 0, o); }
    else if (id === 'bosco') { P.at(12, 11, 0.8); boscoHead(P, 0, 0, o); }
    else if (id === 'sybil') { P.at(12, 13, 0.9); sybilHead(P, 0, 0, o); }
    else if (id === 'brady') { P.at(12, 13, 0.85); bradyHead(P, 0, 0, o); }
    else if (POP[id]) { P.at(12, 12, 0.85); popperHead(P, 0, 0, id, o); }
    else if (id === 'poppers') { for (const [k, x] of [['specs', 5], ['peepers', 19], ['whizzer', 12]]) { const q = new S.Pen(b).at(x, 12, 0.55); popperHead(q, 0, 0, k, o); } }
    else if (id === 'monkey') { const s = S.sprite('monkey', {}, 0.7); S.blit(b, s.buf, 12 - s.ox, 19 - s.oy); }
    else if (id === 'sam') { const s = S.sprite('sam', { dir: 's' }, 0.55); S.blit(b, s.buf, 12 - s.ox, 40 - s.oy); }
    else if (id === 'max') { const s = S.sprite('max', { act: 'head' }, 0.62); S.blit(b, s.buf, 12 - s.ox, 18 - s.oy); }
    return b;
  }

  S.art = S.art || {};
  Object.assign(S.art, { jimmyHead, boscoHead, sybilHead, popperHead, bradyHead, bradyHair, spiral, portrait });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
