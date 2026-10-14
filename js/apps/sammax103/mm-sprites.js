(function (S) {
  'use strict';
  const { C } = S;
  const COSTUMES = S.COSTUMES;
  const TAU = Math.PI * 2;

  const MOB = {
    lovey: { head: C.gold, hb: 3, face: C.cream, hat: C.stone, suit: C.stone, sb: 3, shirt: C.night, tie: C.grey, tb: 5, square: true },
    cuddly: { head: C.green, hb: 3, face: C.pistachio, hat: C.lilac, suit: C.plum, sb: 3, shirt: C.green, tie: C.green, tb: 1, square: false },
    guard: { head: C.sky, hb: 3, face: C.cream, hat: C.stone, suit: C.grey, sb: 4, shirt: C.gold, tie: C.purple, tb: 2, square: false },
    chuckles: { head: C.rose, hb: 3, face: C.cream, hat: C.grey, suit: C.night, sb: 1, shirt: C.night, tie: C.grey, tb: 5, square: true, small: true },
    ted: { head: C.oak, hb: 3, face: C.cream }
  };

  function bearMask(P, x, y, cfg, o) {
    const H = cfg.head, F = cfg.face;
    for (const s of [-1, 1]) {
      P.part(P.ell(x + s * 11, y - 14.5, 5.6, 5.4), H, { b: cfg.hb || 3 });
      P.part(P.ell(x + s * 11, y - 14, 3, 2.8), F, { b: 3, sh: 0, hi: 0, ol: 0 });
    }
    P.part(P.path(`M ${x - 14} ${y + 13} Q ${x - 16.5} ${y - 5} ${x - 12} ${y - 13} Q ${x} ${y - 18.5} ${x + 12} ${y - 13} Q ${x + 16.5} ${y - 5} ${x + 14} ${y + 13} Q ${x} ${y + 17.5} ${x - 14} ${y + 13} Z`), H, { b: cfg.hb || 3 });
    P.part(P.path(`M ${x - 12.5} ${y + 12} Q ${x - 14.5} ${y - 2} ${x - 9} ${y - 9.5} Q ${x - 4} ${y - 11.5} ${x} ${y - 5.5} Q ${x + 4} ${y - 11.5} ${x + 9} ${y - 9.5} Q ${x + 14.5} ${y - 2} ${x + 12.5} ${y + 12} Q ${x} ${y + 16} ${x - 12.5} ${y + 12} Z`), F, { b: 4, sh: 1, ol: F[1] });
    const look = o && o.look ? o.look : 0;
    for (const s of [-1, 1]) {
      const ex = x + s * 5.4, ey = y - 4;
      P.part(P.ell(ex, ey, 4.1, 4.3), C.eye, { sh: 0, hi: 0 });
      P.part(P.ell(ex - s * 0.6 + look, ey + 0.6, 1.3, 1.4), C.night, { b: 0, sh: 0, hi: 0, ol: 0 });
      P.px(ex - s * 0.6 + look + 0.5, ey, C.eye);
      for (let k = 0; k < 3; k++) {
        const a = -Math.PI / 2 + s * (0.55 + k * 0.38);
        P.line(ex + Math.cos(a) * 4.3, ey + Math.sin(a) * 4.5, ex + Math.cos(a) * 6.4, ey + Math.sin(a) * 6.6, C.black);
      }
    }
    P.part(P.ell(x, y + 2.8, 5.5, 3.6), F, { b: 4, sh: 0, ol: F[1] });
    P.part(P.ell(x, y + 1.2, 2.5, 1.7), C.night, { b: 1, sh: 0, hi: 0 });
    P.px(x - 0.8, y + 0.6, C.grey[4]);
    for (const [dx, dy] of [[-3.6, 3.4], [-2.6, 4.4], [3.6, 3.4], [2.6, 4.4]]) P.px(x + dx, y + dy, F[1]);
    const jaw = o && o.talk ? 1 : 0;
    P.part(P.path(`M ${x - 9} ${y + 6} Q ${x} ${y + 3.8} ${x + 9} ${y + 6} Q ${x + 8} ${y + 13 + jaw} ${x} ${y + 13 + jaw} Q ${x - 8} ${y + 13 + jaw} ${x - 9} ${y + 6} Z`), C.night, { b: 0, sh: 0, hi: 0 });
    P.part(P.rect(x - 2.4, y + 5, 2.2, 3.2), C.eye, { sh: 0, hi: 0, ol: C.grey[2] });
    P.part(P.rect(x + 0.2, y + 5, 2.2, 3.2), C.eye, { sh: 0, hi: 0, ol: C.grey[2] });
    if (cfg.hat) {
      const hx = x + 1.5, hy = y - 16.5, k = cfg.small ? 0.75 : 1;
      P.part(P.ell(hx, hy + 1, 9 * k, 2 * k), cfg.hat, { b: 2, sh: 0 });
      P.part(P.path(`M ${hx - 6 * k} ${hy + 0.5} Q ${hx - 6 * k} ${hy - 6 * k} ${hx} ${hy - 6.5 * k} Q ${hx + 6 * k} ${hy - 6 * k} ${hx + 6 * k} ${hy + 0.5} Z`), cfg.hat, { b: 3 });
      P.part(P.rect(hx - 6 * k, hy - 1.4 * k, 12 * k, 1.6 * k), C.night, { b: 1, sh: 0, hi: 0, ol: 0 });
      P.line(hx - 2 * k, hy - 6 * k, hx + 1 * k, hy - 4.5 * k, cfg.hat[1]);
    }
  }

  function pinstripe(P, m, ramp, b) {
    const x0 = P.X(0);
    m.each((x, y) => {
      if (P.b.px[y * P.b.w + x] === C.black) return;
      if ((x - x0 + 64) % 3 === 0) P.b.set(x, y, ramp[Math.min(ramp.length - 1, b + 1)]);
    });
  }

  function suitBody(P, o, cfg, opt) {
    const act = o.act || '';
    const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
    const k = act === 'run' ? 4 : 2.6;
    const leg = cfg.suit, lb = Math.max(0, cfg.sb - 1);
    const H = opt.h;
    P.part(P.cap(-4, -30 * H, -4.5 - w * k, -3, 3.5, 3.1), leg, { b: lb, sh: 1 });
    P.part(P.cap(4, -30 * H, 4.5 + w * k, -3, 3.5, 3.1), leg, { b: lb + 1 > 4 ? 4 : lb + 1, sh: 1 });
    P.part(P.ell(-5 - w * k, -1.6, 4.4, 2), C.grey, { b: 0, sh: 0 });
    P.part(P.ell(5 + w * k, -1.6, 4.4, 2), C.grey, { b: 0, sh: 0 });
    const top = -58 * H, bot = -28 * H;
    const torso = P.path(`M ${-11 * opt.wd} ${top} Q ${-13.5 * opt.wd} ${(top + bot) / 2} ${-10.5 * opt.wd} ${bot} L ${10.5 * opt.wd} ${bot} Q ${13.5 * opt.wd} ${(top + bot) / 2} ${11 * opt.wd} ${top} Q 0 ${top - 3} ${-11 * opt.wd} ${top} Z`);
    P.part(torso, cfg.suit, { b: cfg.sb });
    if (opt.stripes) pinstripe(P, torso, cfg.suit, cfg.sb);
    P.part(P.poly([-4.5, top, 4.5, top, 0, top + 12]), cfg.shirt, { b: 2, sh: 0, hi: 0 });
    P.part(P.poly([-1.3, top + 1, 1.3, top + 1, 2.1, top + 10, 0, top + 13, -2.1, top + 10]), cfg.tie, { b: cfg.tb, sh: 0, hi: 0 });
    P.line(-4.5, top, -2, top + 15, cfg.suit[Math.max(0, cfg.sb - 1)]);
    P.line(4.5, top, 2, top + 15, cfg.suit[Math.max(0, cfg.sb - 1)]);
    if (cfg.square) P.part(P.poly([5.5, top + 7, 9, top + 6.5, 8, top + 9]), C.grey, { b: 5, sh: 0, hi: 0 });
    P.line(-10 * opt.wd, bot + 0.5, 10 * opt.wd, bot + 0.5, C.black);
    return { top, bot };
  }

  function arms(P, cfg, act, top, o, glove, sleeve) {
    const G = glove || C.grey, gb = glove ? 3 : 0;
    const SL = sleeve || cfg.suit, sb = sleeve ? 3 : cfg.sb;
    let la = [-13, top + 24], ra = [13, top + 24];
    if (act === 'deal') { la = [-7, top + 18]; ra = [8, top + 17]; }
    if (act === 'read') { la = [-10, top + 4]; ra = [10, top + 4]; }
    if (act === 'block') { la = [4, top + 11]; ra = [-4, top + 13]; }
    if (act === 'point') ra = [23, top - 2];
    if (act === 'whisper') ra = [6, top - 8];
    if (act === 'wave') ra = [17, top - 20 + Math.sin((o.anim || 0) * TAU / 4) * 2];
    if (act === 'up' || act === 'shock') { la = [-15, top - 18]; ra = [15, top - 18]; }
    if (act === 'give') ra = [19, top + 12];
    if (act === 'run') { la = [-12, top + 12]; ra = [12, top + 12]; }
    P.part(P.cap(-10, top + 3, la[0], la[1], 2.8, 2.4), SL, { b: sb, sh: 1 });
    P.part(P.cap(10, top + 3, ra[0], ra[1], 2.8, 2.4), SL, { b: sb, sh: 1 });
    P.part(P.ell(la[0], la[1] + 1, 2.6, 2.4), G, { b: gb, sh: 0 });
    P.part(P.ell(ra[0], ra[1] + 1, 2.6, 2.4), G, { b: gb, sh: 0 });
    if (act === 'deal') {
      P.part(P.rect(ra[0] - 1, ra[1] - 3, 4, 5), C.grey, { b: 5, sh: 0, hi: 0 });
      P.px(ra[0] + 1, ra[1] - 1, C.red[3]);
    }
    if (act === 'read') {
      P.part(P.poly([-15, top - 2, 15, top - 3, 16, top + 24, -14, top + 25]), C.cream, { b: 4 });
      P.part(P.rect(-12, top + 1, 25, 5), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
      for (let i = 0; i < 5; i++) P.line(-12, top + 9 + i * 3, i % 2 ? 2 : 12, top + 9 + i * 3, C.cream[1]);
      P.part(P.ell(8, top + 14, 3, 2.2), C.slime, { b: 3, sh: 0, hi: 0, ol: 0 });
    }
    return { la, ra };
  }

  COSTUMES.mobster = {
    h: 94, w: 34,
    draw(P, o) {
      const cfg = MOB[o.v] || MOB.lovey;
      const act = o.act || '';
      const { top } = suitBody(P, o, cfg, { h: 1, wd: 1, stripes: true });
      if (act !== 'read') arms(P, cfg, act, top, o);
      const bob = o.talk ? -1 : 0;
      const tilt = act === 'whisper' ? 3 : 0;
      bearMask(P, tilt, -75 + bob, cfg, { talk: o.talk, look: act === 'whisper' ? 1 : 0 });
      if (act === 'read') arms(P, cfg, act, top, o);
    },
    anim: o => o.act === 'wave' ? Math.floor((o.t || 0) * 6) % 4 : 0
  };

  function hypnoBear(P, x, y, s, o) {
    const Q = P.scaled(x, y, s);
    const B = C.purple;
    Q.part(Q.ell(x - 4.5, y - 3, 2.6, 2), C.night, { b: 1, sh: 0 });
    Q.part(Q.ell(x + 4.5, y - 3, 2.6, 2), C.night, { b: 1, sh: 0 });
    Q.part(Q.path(`M ${x - 6} ${y - 4} Q ${x - 7} ${y - 12} ${x} ${y - 13} Q ${x + 7} ${y - 12} ${x + 6} ${y - 4} Z`), C.night, { b: 1 });
    Q.part(Q.poly([x - 2.2, y - 13, x + 2.2, y - 13, x, y - 7]), C.grey, { b: 5, sh: 0, hi: 0 });
    Q.part(Q.poly([x - 2.6, y - 12.6, x, y - 11.4, x + 2.6, y - 12.6, x + 2.6, y - 10.4, x, y - 11.4, x - 2.6, y - 10.4]), C.night, { b: 0, sh: 0, hi: 0 });
    Q.px(x, y - 9, C.gold[3]);
    Q.part(Q.cap(x - 6, y - 11, x - 9, y - 7, 1.8, 1.6), B, { b: 3, sh: 0 });
    Q.part(Q.cap(x + 6, y - 11, x + 9, y - 7, 1.8, 1.6), B, { b: 3, sh: 0 });
    Q.part(Q.ell(x - 5.5, y - 22, 2.4, 2.4), B, { b: 3 });
    Q.part(Q.ell(x + 5.5, y - 22, 2.4, 2.4), B, { b: 3 });
    Q.part(Q.ell(x, y - 18, 6.8, 6), B, { b: 3 });
    Q.part(Q.path(`M ${x - 5.6} ${y - 14.5} Q ${x - 6.5} ${y - 20} ${x - 3} ${y - 21} Q ${x} ${y - 19} ${x + 3} ${y - 21} Q ${x + 6.5} ${y - 20} ${x + 5.6} ${y - 14.5} Q ${x} ${y - 12} ${x - 5.6} ${y - 14.5} Z`), C.cream, { b: 4, sh: 0, ol: C.cream[1] });
    const spin = o && o.act === 'spin';
    for (const ex of [-2.4, 2.4]) {
      if (spin) S.art.spiral(Q, x + ex, y - 18.5, 1.9, (o.t || 0) * 6);
      else { Q.part(Q.ell(x + ex, y - 18.5, 1.7, 1.8), C.eye, { sh: 0, hi: 0 }); Q.px(x + ex, y - 18.2, C.pupil); }
    }
    Q.part(Q.ell(x, y - 15.6, 1.2, 0.8), C.night, { b: 1, sh: 0, hi: 0, ol: 0 });
    Q.part(Q.ell(x, y - 13.8, 2.6, 1.4), C.night, { b: 0, sh: 0, hi: 0 });
    Q.px(x - 0.5, y - 14.4, C.eye); Q.px(x + 0.5, y - 14.4, C.eye);
  }

  COSTUMES.hbear = {
    h: 24, w: 18,
    draw(P, o) { hypnoBear(P, 0, 0, 1, { act: o.act, t: (o.anim || 0) * TAU / 48 }); },
    anim: o => o.act === 'spin' ? Math.floor((o.t || 0) * 6) % 8 : 0
  };

  function moleHead(P, x, y, o) {
    const G = C.stone, K = C.pink;
    for (const s of [-1, 1]) {
      P.part(P.ell(x + s * 10.5, y - 5, 3.6, 3.8), K, { b: 3 });
      P.part(P.ell(x + s * 10.5, y - 4.6, 2, 2.2), K, { b: 2, sh: 0, hi: 0, ol: 0 });
    }
    P.part(P.path(`M ${x - 10.5} ${y + 5} Q ${x - 13} ${y - 7} ${x - 7.5} ${y - 14} Q ${x} ${y - 18.5} ${x + 7.5} ${y - 14} Q ${x + 13} ${y - 7} ${x + 10.5} ${y + 5} Q ${x} ${y + 11} ${x - 10.5} ${y + 5} Z`), G, { b: 3 });
    for (const [hx, hy, a] of [[-2, -16.5, -0.5], [0.5, -17.5, 0.1], [3, -16.5, 0.6]]) P.line(x + hx, y + hy, x + hx + Math.sin(a) * 3, y + hy - 3, C.grey[4]);
    const scared = o.act === 'panic' || o.act === 'sucked';
    if (scared) {
      P.part(P.ell(x - 3.4, y - 8.4, 2.4, 2.6), C.eye, { sh: 0, hi: 0 });
      P.part(P.ell(x + 4, y - 9, 2.8, 3), C.eye, { sh: 0, hi: 0 });
      P.px(x - 3.4, y - 8.4, C.pupil); P.px(x + 4, y - 9, C.pupil);
    } else {
      P.part(P.ell(x - 3.4, y - 8, 1.5, 1.6), C.night, { b: 0, sh: 0, hi: 0 });
      P.part(P.ell(x + 4, y - 8.6, 2.1, 2.2), C.night, { b: 0, sh: 0, hi: 0 });
      P.px(x - 3.8, y - 8.6, C.eye);
      P.px(x + 3.4, y - 9.4, C.eye);
      if (o.blink) { P.line(x - 4.9, y - 8, x - 1.9, y - 8, G[1]); P.line(x + 1.9, y - 8.6, x + 6.1, y - 8.6, G[1]); }
    }
    if (o.talk || scared) P.part(P.ell(x + 2, y + 7.6, 3.4, 2), C.red, { b: 1, sh: 0, hi: 0 });
    else P.curve(`M ${x - 3} ${y + 6.6} Q ${x + 2} ${y + 8.6} ${x + 7} ${y + 6}`, C.black);
    P.part(P.rect(x + 0.4, y + 6.2, 1.8, 2.6), C.eye, { sh: 0, hi: 0, ol: C.grey[2] });
    P.part(P.rect(x + 2.3, y + 6.2, 1.8, 2.6), C.eye, { sh: 0, hi: 0, ol: C.grey[2] });
    P.part(P.path(`M ${x - 1.6} ${y - 2.4} Q ${x + 6} ${y - 5.2} ${x + 13} ${y - 2.2} Q ${x + 16} ${y - 0.2} ${x + 14} ${y + 2.4} Q ${x + 10.4} ${y + 4} ${x + 4.2} ${y + 3.4} Q ${x - 1} ${y + 3} ${x - 2.4} ${y + 0.8} Q ${x - 3} ${y - 1.2} ${x - 1.6} ${y - 2.4} Z`), K, { b: 3 });
    P.part(P.ell(x + 14, y - 0.3, 0.8, 1.1), C.rose, { b: 1, sh: 0, hi: 0, ol: 0 });
    P.part(P.ell(x + 12.4, y + 1.7, 0.8, 1), C.rose, { b: 1, sh: 0, hi: 0, ol: 0 });
    for (const [a, b] of [[[-4, 1], [-9, -0.6]], [[-4, 2.6], [-9, 3.4]], [[6, 5.6], [9, 8]], [[4, 5.6], [5, 9]]]) P.line(x + a[0], y + a[1], x + b[0], y + b[1], G[1]);
  }

  COSTUMES.ted = {
    h: 104, w: 44,
    draw(P, o) {
      const act = o.act || '';
      const masked = o.v === 'masked';
      const ph = (o.anim || 0) * TAU / 4;
      if (act === 'sucked') {
        P.part(P.path('M -16 -40 Q -20 -60 -14 -76 L 14 -76 Q 20 -60 16 -40 Q 0 -34 -16 -40 Z'), C.purple, { b: 3 });
        P.part(P.cap(-12, -72, -18, -98, 3.6, 3), C.purple, { b: 3, sh: 1 });
        P.part(P.cap(12, -72, 18, -98, 3.6, 3), C.purple, { b: 3, sh: 1 });
        P.part(P.cap(-6, -42, -8 + Math.sin(ph) * 3, -16, 4.2, 3.6), C.purple, { b: 2, sh: 1 });
        P.part(P.cap(6, -42, 8 - Math.sin(ph) * 3, -16, 4.2, 3.6), C.purple, { b: 3, sh: 1 });
        moleHead(P.scaled(0, -86, 1.1), 0, -86, o);
        return;
      }
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      const run = act === 'panic' ? 3.8 : 2.4;
      P.part(P.cap(-6, -32, -6.5 - w * run, -3, 4.8, 4.2), C.purple, { b: 2, sh: 1 });
      P.part(P.cap(6, -32, 6.5 + w * run, -3, 4.8, 4.2), C.purple, { b: 3, sh: 1 });
      P.part(P.ell(-7 - w * run, -1.8, 5.2, 2.2), C.grey, { b: 0, sh: 0 });
      P.part(P.ell(7 + w * run, -1.8, 5.2, 2.2), C.grey, { b: 0, sh: 0 });
      const top = -70, bot = -30;
      P.part(P.path(`M -18 ${top} Q -23 -50 -16 ${bot} L 16 ${bot} Q 23 -50 18 ${top} Q 0 ${top - 5} -18 ${top} Z`), C.purple, { b: 3 });
      P.part(P.path(`M -6 ${top - 1} L 6 ${top - 1} L 8 -46 L 0 -38 L -8 -46 Z`), C.red, { b: 1, sh: 0 });
      P.part(P.poly([-3.5, top - 1, 3.5, top - 1, 0, top + 9]), C.grey, { b: 5, sh: 0, hi: 0 });
      P.part(P.poly([-4, top, 0, top + 2, 4, top, 4, top + 4, 0, top + 2, -4, top + 4]), C.plum, { b: 0, sh: 0, hi: 0 });
      P.line(-6, top - 1, -3, -44, C.purple[1]);
      P.line(6, top - 1, 3, -44, C.purple[1]);
      P.line(-15, bot + 0.5, 15, bot + 0.5, C.black);
      P.part(P.ell(-10, top + 8, 2.4, 2.2), C.pink, { b: 3, sh: 0 });
      P.line(-10, top + 10, -9, top + 16, C.green[2]);
      const G = C.grey;
      let la = [-20, -40], ra = [20, -40];
      if (act === 'gun' || act === 'hypno') { la = [-16, act === 'hypno' ? -86 : -58]; ra = [22, -52]; }
      if (act === 'unmask') la = [-19, -52];
      if (act === 'slap') ra = [24, -70];
      if (act === 'panic') { la = [-22 + Math.sin(ph) * 4, -88]; ra = [22 - Math.sin(ph) * 4, -86]; }
      if (act === 'pull') { la = [-10, -70]; ra = [4, -72]; }
      P.part(P.cap(-15, top + 4, la[0], la[1], 4, 3.4), C.purple, { b: 3, sh: 1 });
      P.part(P.cap(15, top + 4, ra[0], ra[1], 4, 3.4), C.purple, { b: 3, sh: 1 });
      P.part(P.ell(la[0], la[1] + 1, 3.4, 3.2), G, { b: 4, sh: 1 });
      P.part(P.ell(ra[0], ra[1] + 1, 3.4, 3.2), G, { b: 4, sh: 1 });
      if (act === 'gun' || act === 'hypno') {
        P.part(P.poly([ra[0] + 1, ra[1] - 3, ra[0] + 13, ra[1] - 4, ra[0] + 13, ra[1] - 1, ra[0] + 4, ra[1] + 0.5, ra[0] + 3, ra[1] + 4, ra[0], ra[1] + 4]), C.grey, { b: 3 });
        P.part(P.ell(ra[0] + 5, ra[1] - 0.5, 1.8, 1.6), C.grey, { b: 1, sh: 0 });
        hypnoBear(P, la[0], la[1] + 6, 0.8, { act: act === 'hypno' ? 'spin' : '', t: ph / 6 });
      }
      if (act === 'unmask') bearMask(P.scaled(la[0] - 2, la[1] + 2, 0.55), la[0] - 2, la[1] + 2, MOB.ted, {});
      if (masked) bearMask(P.scaled(0, -86, 1.18), 0, -86, MOB.ted, { talk: o.talk });
      else moleHead(P.scaled(0, -84, 1.15), 0, -84, o);
    },
    anim: o => o.act === 'panic' || o.act === 'sucked' || o.act === 'hypno' ? Math.floor((o.t || 0) * 8) % 4 : 0
  };

  function leoSkin(v) {
    if (v === 'r1') return C.skin;
    if (v === 'r2') return C.rose;
    if (v === 'r3' || v === 'r4') return C.red;
    return C.pale;
  }

  function leonardHead(P, x, y, o) {
    const K = leoSkin(o.v);
    const kb = o.v === 'r4' ? 4 : 3;
    P.part(P.ell(x - 7.6, y + 1, 1.8, 2.8), K, { b: kb - 1, sh: 0 });
    P.part(P.ell(x + 7.6, y + 1, 1.8, 2.8), K, { b: kb - 1, sh: 0 });
    P.part(P.path(`M ${x - 7.5} ${y + 3} Q ${x - 9} ${y - 14} ${x} ${y - 15} Q ${x + 9} ${y - 14} ${x + 7.5} ${y + 3} Q ${x + 6} ${y + 10} ${x} ${y + 11} Q ${x - 6} ${y + 10} ${x - 7.5} ${y + 3} Z`), K, { b: kb });
    P.px(x - 3, y - 11, K[Math.min(4, kb + 1)]); P.px(x - 2, y - 12, K[Math.min(4, kb + 1)]);
    P.part(P.path(`M ${x - 7.4} ${y - 3.6} Q ${x - 5} ${y - 9} ${x - 0.6} ${y - 5.6} L ${x - 0.8} ${y - 3.6} Q ${x - 4.2} ${y - 6.4} ${x - 6.6} ${y - 2.2} Z`), C.night, { b: 0, sh: 0, hi: 0 });
    P.part(P.path(`M ${x + 7.4} ${y - 3.6} Q ${x + 5} ${y - 9} ${x + 0.6} ${y - 5.6} L ${x + 0.8} ${y - 3.6} Q ${x + 4.2} ${y - 6.4} ${x + 6.6} ${y - 2.2} Z`), C.night, { b: 0, sh: 0, hi: 0 });
    const up = o.act === 'glance' || o.look === 'up';
    for (const ex of [-3.4, 3.4]) {
      P.part(P.ell(x + ex, y - 1.4, 2, 1.6), C.eye, { sh: 0, hi: 0 });
      if (o.blink) P.line(x + ex - 2, y - 1.4, x + ex + 2, y - 1.4, C.black);
      else {
        P.px(x + ex + (up ? -0.8 : 0.4), y + (up ? -2.2 : -1.2), C.fur[0]);
        P.line(x + ex - 2, y - 2.6, x + ex + 2, y - 2.6, K[1]);
      }
    }
    P.part(P.path(`M ${x - 0.6} ${y - 1} Q ${x + 2.6} ${y + 3} ${x + 1.8} ${y + 4.6} Q ${x} ${y + 5.2} ${x - 1.4} ${y + 4.4} Z`), K, { b: kb - 1, sh: 0, hi: 1 });
    if (o.v === 'tape') P.part(P.rect(x - 4.5, y + 5.5, 9, 3.4), C.stone, { b: 4, sh: 0 });
    else if (o.talk) P.part(P.ell(x, y + 7.8, 2.4, 1.4), C.red, { b: 1, sh: 0, hi: 0 });
    else P.line(x - 2, y + 7.6, x + 2, y + 7.6, K[0]);
    const lobe = s => `Q ${x + s * 3} ${y + 2} ${x + s * 6.6} ${y + 3.4} Q ${x + s * 9.4} ${y + 4.6} ${x + s * 10.2} ${y + 2.4} Q ${x + s * 10.6} ${y + 0.4} ${x + s * 9} ${y + 0.6} Q ${x + s * 8.2} ${y + 1.8} ${x + s * 9.2} ${y + 3.2} Q ${x + s * 9} ${y + 7} ${x + s * 5.6} ${y + 6.8} Q ${x + s * 2.6} ${y + 6.6} ${x} ${y + 6}`;
    P.part(P.path(`M ${x} ${y + 3.2} ${lobe(-1)} Z M ${x} ${y + 3.2} ${lobe(1)} Z`), C.night, { b: 1, sh: 0, hi: 1 });
    if (o.v === 'tape') P.part(P.rect(x - 4.5, y + 6, 9, 2.8), C.stone, { b: 4, sh: 0, ol: C.stone[2] });
  }

  COSTUMES.leonard = {
    h: 96, w: 30,
    draw(P, o) {
      const act = o.act || '';
      const T = C.rose, K = leoSkin(o.v);
      if (act === 'sit' || act === 'glance') {
        P.part(P.cap(-2, -26, 12, -26, 4, 3.6), C.asphalt, { b: 2, sh: 1 });
        P.part(P.cap(12, -26, 13, -3, 3.6, 3.2), C.asphalt, { b: 2, sh: 1 });
        P.part(P.ell(15, -1.6, 4.6, 2), C.grey, { b: 0, sh: 0 });
        P.part(P.path('M -9 -60 Q -12 -44 -8 -26 L 8 -26 Q 11 -44 9 -60 Q 0 -63 -9 -60 Z'), T, { b: 1 });
        P.part(P.rect(-6, -66, 12, 7), T, { b: 1, sh: 1 });
        P.part(P.cap(-7, -57, 10, -38, 2.6, 2.2), T, { b: 1, sh: 1 });
        P.part(P.cap(7, -57, 16, -40, 2.6, 2.2), T, { b: 2, sh: 1 });
        P.part(P.ell(11, -37, 2.4, 2), K, { b: 3, sh: 0 });
        P.part(P.ell(17, -39, 2.4, 2), K, { b: 3, sh: 0 });
        leonardHead(P, 1, -76, o);
        return;
      }
      if (act === 'tied') {
        P.part(P.cap(-4, -10, 14, -5, 4, 3.4), C.asphalt, { b: 2, sh: 1 });
        P.part(P.cap(-2, -8, 16, -2, 4, 3.4), C.asphalt, { b: 3, sh: 1 });
        P.part(P.ell(18, -3, 3, 4.2), C.grey, { b: 0, sh: 0 });
        P.part(P.path('M -10 -46 Q -13 -30 -9 -8 L 9 -8 Q 12 -30 10 -46 Q 0 -49 -10 -46 Z'), T, { b: 1 });
        P.part(P.rect(-6, -52, 12, 7), T, { b: 1, sh: 1 });
        for (const ry of [-38, -30, -22]) { P.part(P.rect(-11, ry, 22, 2.4), C.sand, { b: 3, sh: 0 }); }
        P.line(-11, -38, 10, -20, C.sand[1]);
        leonardHead(P, 0, -62, o);
        return;
      }
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      P.part(P.cap(-3.5, -40, -4 - w * 3, -3, 3.3, 2.9), C.asphalt, { b: 2, sh: 1 });
      P.part(P.cap(3.5, -40, 4 + w * 3, -3, 3.3, 2.9), C.asphalt, { b: 3, sh: 1 });
      P.part(P.ell(-5 - w * 3, -1.6, 4.6, 2), C.grey, { b: 0, sh: 0 });
      P.part(P.ell(5 + w * 3, -1.6, 4.6, 2), C.grey, { b: 0, sh: 0 });
      P.part(P.path('M -10 -76 Q -13 -58 -9.5 -40 L 9.5 -40 Q 13 -58 10 -76 Q 0 -79 -10 -76 Z'), T, { b: 1 });
      P.part(P.rect(-10, -42, 20, 3), C.night, { b: 0, sh: 0, hi: 0 });
      P.part(P.rect(-2.5, -42.5, 5, 4), C.grey, { b: 4, sh: 0 });
      P.px(-1, -41, C.grey[1]); P.px(1, -41, C.grey[1]);
      P.part(P.rect(-6, -82, 12, 7), T, { b: 1, sh: 1 });
      for (let i = 0; i < 3; i++) P.line(-5, -80 + i * 2, 5, -80 + i * 2, T[0]);
      let la = [-13, -52], ra = [13, -52];
      if (act === 'aim') ra = [22, -64];
      if (act === 'lose' || act === 'closet') { la = [-8, -94]; ra = [8, -94]; }
      if (act === 'closet') { la = [-6, -50]; ra = [6, -50]; }
      P.part(P.cap(-9, -73, la[0], la[1], 2.8, 2.4), T, { b: 1, sh: 1 });
      P.part(P.cap(9, -73, ra[0], ra[1], 2.8, 2.4), T, { b: 2, sh: 1 });
      P.part(P.ell(la[0], la[1] + 1, 2.5, 2.3), K, { b: 3, sh: 0 });
      P.part(P.ell(ra[0], ra[1] + 1, 2.5, 2.3), K, { b: 3, sh: 0 });
      if (act === 'aim') {
        P.part(P.poly([ra[0] + 1, ra[1] - 3, ra[0] + 12, ra[1] - 3.6, ra[0] + 12, ra[1] - 0.6, ra[0] + 4, ra[1] + 0.4, ra[0] + 3, ra[1] + 4, ra[0], ra[1] + 4]), C.grey, { b: 4 });
        P.part(P.rect(ra[0] + 11, ra[1] - 3.6, 2.4, 3), C.orange, { b: 3, sh: 0, hi: 0 });
      }
      if (act === 'closet') {
        for (const ry of [-70, -60, -50]) P.part(P.rect(-11, ry, 22, 2.4), C.stone, { b: 4, sh: 0 });
      }
      leonardHead(P, 0, -92, act === 'closet' ? Object.assign({}, o, { v: 'tape' }) : o);
    }
  };

  function beret(P, x, y) {
    P.part(P.path(`M ${x - 11.5} ${y - 6.5} Q ${x - 11} ${y - 14.5} ${x + 1} ${y - 15} Q ${x + 12} ${y - 14.5} ${x + 13.5} ${y - 9} Q ${x + 12} ${y - 6} ${x + 3} ${y - 6.5} Q ${x - 5} ${y - 5} ${x - 11.5} ${y - 6.5} Z`), C.night, { b: 1 });
    P.part(P.rect(x - 0.5, y - 17, 1.6, 2.4), C.night, { b: 1, sh: 0, hi: 0 });
    P.curve(`M ${x - 9} ${y - 9} Q ${x} ${y - 12.5} ${x + 10} ${y - 10}`, C.night[2]);
  }

  function frenchMustache(P, x, y) {
    P.curve(`M ${x - 7} ${y + 4.4} Q ${x - 9} ${y + 3.6} ${x - 8.6} ${y + 2.2}`, C.black);
    P.curve(`M ${x - 7} ${y + 4.4} Q ${x - 3} ${y + 5.2} ${x} ${y + 4.8} Q ${x + 3} ${y + 5.2} ${x + 7} ${y + 4.4}`, C.black);
    P.curve(`M ${x + 7} ${y + 4.4} Q ${x + 9} ${y + 3.6} ${x + 8.6} ${y + 2.2}`, C.black);
  }

  function bandaHead(P, x, y, o) {
    S.art.boscoHead(P, x, y, o);
    frenchMustache(P, x, y);
    beret(P, x, y - 1);
  }

  COSTUMES.banda = {
    h: 86, w: 44,
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
      P.part(P.rect(-12, -46, 7, 4), C.grey, { b: 5, sh: 0, hi: 0 });
      P.line(-11, -44, -7, -44, C.red[3]);
      P.part(P.rect(-4, -56, 8, 5), K, { b: 2, sh: 0 });
      const arm = (sx, ex, ey) => {
        P.part(P.cap(sx, -49, (sx + ex) / 2, (-49 + ey) / 2, 3.8, 3.4), C.grey, { b: 4, sh: 1 });
        P.part(P.cap((sx + ex) / 2, (-49 + ey) / 2, ex, ey, 3.2, 2.8), K, { b: 3, sh: 1 });
        P.part(P.ell(ex, ey + 1, 3.4, 3), K, { b: 3, sh: 1 });
      };
      if (act === 'watch') { arm(-15, -6, -68); arm(15, 6, -68); }
      else if (act === 'up') { arm(-15, -22, -84); arm(15, 22, -84); }
      else if (act === 'give') { arm(-15, -30, -40); arm(15, 19, -29); }
      else if (act === 'point') { arm(-15, -19, -29); arm(15, 24, -64); }
      else if (act === 'shrug') { arm(-15, -24, -48); arm(15, 24, -48); }
      else { arm(-15, -19, -29); arm(15, 19, -29); }
      bandaHead(P, 0, -66, o);
      if (act === 'watch') {
        for (const bx of [-4.5, 4.5]) {
          P.part(P.rect(bx - 3, -70, 6, 7), C.night, { b: 2 });
          P.part(P.ell(bx, -70, 3, 1.6), C.sky, { b: 4, sh: 0, hi: 0 });
        }
        P.part(P.rect(-1.5, -69, 3, 3), C.night, { b: 1, sh: 0 });
      }
    }
  };

  function witnessBody(P, o) {
    const act = o.act || '';
    const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
    const jit = act === 'jitter' ? (Math.floor((o.t || 0) * 30) % 2 ? 1 : -1) : 0;
    const Q = jit ? P.scaled(0, 0, 1) : P;
    if (jit) Q.ox += jit * Math.abs(P.sx);
    Q.part(Q.cap(-3, -24, -3.5 - w * 2, -5, 2.3, 1.8), C.grey, { b: 1, sh: 0 });
    Q.part(Q.cap(3, -24, 3.5 + w * 2, -5, 2.3, 1.8), C.grey, { b: 1, sh: 0 });
    Q.part(Q.poly([-6 - w * 2, -5, -1.5 - w * 2, -5, -1.5 - w * 2, -1, -6.5 - w * 2, -0.5]), C.red, { b: 3, sh: 0 });
    Q.part(Q.poly([1.5 + w * 2, -5, 6 + w * 2, -5, 6.5 + w * 2, -0.5, 1.5 + w * 2, -1]), C.red, { b: 3, sh: 0 });
    Q.part(Q.path('M -7 -56 Q -10.5 -44 -8.5 -34 Q -9.5 -26 -8 -19 L 8 -19 Q 9.5 -26 8.5 -34 Q 10.5 -44 7 -56 Z'), C.purple, { b: 3 });
    Q.part(Q.rect(-8.5, -38, 17, 2.5), C.pink, { b: 2, sh: 0 });
    Q.part(Q.ell(-4, -51, 2.6, 1.6), C.gold, { b: 3, sh: 0 });
    let lx = -11, ly = -37, rx = 11, ry = -37;
    if (act === 'shock') { lx = -12; ly = -66; rx = 12; ry = -66; }
    if (act === 'drink') { rx = 3; ry = -61; }
    if (act === 'hold' || act === 'jitter') { rx = 6; ry = -44; }
    if (act === 'point') { rx = 20; ry = -52; }
    Q.part(Q.cap(-7.5, -54, lx, ly, 1.9, 1.6), C.skin, { b: 3, sh: 0 });
    Q.part(Q.cap(7.5, -54, rx, ry, 1.9, 1.6), C.skin, { b: 3, sh: 0 });
    Q.part(Q.cap(0, -56, 0, -62, 2.2), C.skin, { b: 3, sh: 0 });
    S.art.sybilHead(Q, 0, -69, o);
    if (act === 'drink' || act === 'hold' || act === 'jitter') {
      const mx = act === 'drink' ? 3 : 7, my = act === 'drink' ? -63 : -46;
      Q.part(Q.rect(mx - 3, my - 3, 6, 6), C.grey, { b: 5 });
      Q.part(Q.ell(mx + 3.4, my, 1.6, 1.8), C.grey, { b: 4, sh: 0 });
      Q.px(mx - 1, my - 1, C.red[3]);
    }
    if (o.v === 'ketchup') {
      for (const [sx, sy, r] of [[-3, -48, 2.6], [3, -42, 2], [-1, -33, 2.4], [4, -52, 1.6], [-5, -28, 1.4], [2, -66, 1.3], [-3, -71, 1]]) Q.part(Q.ell(sx, sy, r, r * 0.8), C.red, { b: 2, sh: 0, hi: 0, ol: 0 });
      Q.line(-1, -31, -1, -26, C.red[2]); Q.line(3, -40, 3, -35, C.red[2]);
    }
  }

  COSTUMES.witness = {
    h: 86, w: 30,
    draw(P, o) {
      if (o.act === 'dead') {
        P.part(P.path('M -30 -2 Q -31 -8 -22 -9 L 10 -9 Q 16 -8 16 -3 L 16 0 L -30 0 Z'), C.purple, { b: 3 });
        P.part(P.rect(-8, -9, 2.5, 9), C.pink, { b: 2, sh: 0 });
        P.part(P.cap(16, -4, 26, -3, 2, 1.6), C.grey, { b: 1, sh: 0 });
        P.part(P.cap(16, -2, 25, 0, 2, 1.6), C.grey, { b: 1, sh: 0 });
        P.part(P.ell(28, -3, 2.4, 2.2), C.red, { b: 3, sh: 0 });
        P.part(P.cap(-14, -8, -8, -16, 1.8, 1.5), C.skin, { b: 3, sh: 0 });
        S.art.sybilHead(P.scaled(-36, -6, 0.95), -36, -6, { blink: true });
        for (const [sx, sy, r] of [[-20, -7, 2.8], [-10, -4, 2.2], [0, -6, 3], [8, -3, 2], [-40, -2, 2.2], [-30, 1, 3.4], [4, 1, 2.6]]) P.part(P.ell(sx, sy, r, r * 0.7), C.red, { b: 2, sh: 0, hi: 0, ol: 0 });
        if (Math.floor((o.t || 0) * 0.7) % 5 === 2) P.px(-38, -9, C.pupil);
        return;
      }
      witnessBody(P, o);
    },
    anim: o => o.act === 'jitter' ? Math.floor((o.t || 0) * 30) % 2 : o.act === 'dead' ? Math.floor((o.t || 0) * 0.7) % 5 : 0
  };

  COSTUMES.roach = {
    h: 12, w: 20,
    draw(P, o) {
      const B = C.fur;
      const ph = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      if (o.act === 'salute') {
        P.part(P.ell(0, -8, 2.6, 6), B, { b: 2 });
        P.part(P.ell(0.5, -15, 2.2, 2), B, { b: 1, sh: 0 });
        P.curve('M 1 -16.5 Q 3 -22 7 -24', B[0]);
        P.curve('M 0 -16.5 Q -1 -22 -5 -24', B[0]);
        P.line(2, -12, 3.5, -16, B[0]);
        P.line(-1, -2, -3, 0, B[0]); P.line(1, -2, 3, 0, B[0]);
        P.line(-2, -8, -4, -6, B[0]);
        return;
      }
      for (let i = 0; i < 3; i++) {
        const lx = -3 + i * 3, sw = (i % 2 ? 1 : -1) * ph * 1.2;
        P.line(lx, -2, lx - 1.5 + sw, 0, B[0]);
        P.line(lx + 0.5, -2, lx + 2 - sw, 0, B[0]);
      }
      P.part(P.ell(-0.5, -3.4, 5.6, 2.3), B, { b: 2 });
      P.line(-5, -3.6, 4, -3.2, B[1]);
      P.part(P.ell(5.6, -3.2, 1.8, 1.6), B, { b: 1, sh: 0 });
      P.curve('M 6.5 -4.4 Q 10 -9 15 -8', B[0]);
      P.curve('M 6.8 -3.6 Q 11 -6 16 -3', B[0]);
      P.line(-6, -3, -8.5, -2, B[0]);
    }
  };

  function mobCar(P, o) {
    const R = C.pink;
    const top = o.v !== 'topless';
    P.part(P.path('M -34 -2 L -35 -14 Q -34 -19 -26 -20 L 26 -20 Q 34 -19 35 -14 L 34 -2 Z'), R, { b: 2 });
    P.part(P.rect(-20, -16, 40, 10), C.grey, { b: 4 });
    for (let i = 0; i < 8; i++) P.line(-18 + i * 5, -15, -18 + i * 5, -7, C.grey[2]);
    for (const s of [-1, 1]) {
      P.part(P.ell(s * 27, -12, 5, 4.2), [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp], { sh: 0, hi: 0 });
      P.part(P.ell(s * 27, -12, 5, 4.2), C.grey, { b: 1, sh: 0, hi: 0, ol: C.black }).each((x, y) => { if ((x + y) % 4 === 0) P.b.set(x, y, C.lamp); });
      P.part(P.ell(s * 27, -12, 3.4, 2.8), [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp], { sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(s * 29 - 4, -2, 8, 4), C.grey, { b: 0 });
    }
    P.part(P.rect(-36, -5, 72, 4), C.grey, { b: 4, sh: 0 });
    P.part(P.poly([-27, -20, 27, -20, 22, -34, -22, -34]), C.sky, { b: 2, sh: 0 });
    const heads = [['lovey', -12], ['cuddly', 0], ['guard', 12]];
    for (const [v, hx] of heads) {
      const Q = P.scaled(hx, -30, 0.36);
      bearMask(Q, hx, -30, MOB[v], { talk: false });
    }
    if (top) {
      P.part(P.poly([-24, -36, 24, -36, 21, -42, -21, -42]), R, { b: 3 });
      P.part(P.rect(-22, -44, 44, 3), R, { b: 4, sh: 0 });
    } else {
      P.part(P.rect(-24, -21, 48, 2), C.grey, { b: 1, sh: 0, hi: 0 });
      P.line(-26, -21, -30, -36, C.grey[3]); P.line(26, -21, 30, -36, C.grey[3]);
    }
    if (o.frame) for (let i = 0; i < 6; i++) P.px(-10 + i * 4, -26 - (i % 2) * 3, C.lamp);
  }

  COSTUMES.mobcar = {
    h: 48, w: 76,
    draw(P, o) { mobCar(P, o); }
  };

  function card(P, x, y, rank, suit, s) {
    s = s || 1;
    const Q = P.scaled(x, y, s);
    Q.part(Q.rect(x - 7, y - 10, 14, 20), C.grey, { b: 5, sh: 0, hi: 0 });
    const red = suit === 'h' || suit === 'd';
    const col = red ? C.red[3] : C.night[1];
    suitShape(Q, x, y + 2, suit, 1.3, col);
    S.font.draw(Q.b, rank, Math.round(Q.X(x - 5.5)), Math.round(Q.Y(y - 9)), col, 0);
  }

  function suitShape(P, x, y, suit, s, col) {
    const ramp = [col, col, col, col, col];
    const sc = P.scaled(x, y, s);
    if (suit === 's') {
      sc.part(sc.path(`M ${x} ${y - 4} Q ${x + 4.4} ${y} ${x + 3} ${y + 2} Q ${x + 2} ${y + 3.4} ${x} ${y + 2} L ${x + 1.2} ${y + 4.6} L ${x - 1.2} ${y + 4.6} L ${x} ${y + 2} Q ${x - 2} ${y + 3.4} ${x - 3} ${y + 2} Q ${x - 4.4} ${y} ${x} ${y - 4} Z`), ramp, { sh: 0, hi: 0, ol: 0 });
    } else if (suit === 'h') {
      sc.part(sc.path(`M ${x} ${y + 4} L ${x - 3.6} ${y} Q ${x - 4.4} ${y - 3} ${x - 2} ${y - 3.4} Q ${x - 0.5} ${y - 3.4} ${x} ${y - 2} Q ${x + 0.5} ${y - 3.4} ${x + 2} ${y - 3.4} Q ${x + 4.4} ${y - 3} ${x + 3.6} ${y} Z`), ramp, { sh: 0, hi: 0, ol: 0 });
    } else if (suit === 'd') {
      sc.part(sc.poly([x, y - 4, x + 3, y, x, y + 4, x - 3, y]), ramp, { sh: 0, hi: 0, ol: 0 });
    } else {
      for (const [cx, cy] of [[0, -2], [-2, 0.6], [2, 0.6]]) sc.part(sc.ell(x + cx, y + cy, 1.6, 1.6), ramp, { sh: 0, hi: 0, ol: 0 });
      sc.part(sc.poly([x - 0.6, y + 0.5, x + 0.6, y + 0.5, x + 1.4, y + 4, x - 1.4, y + 4]), ramp, { sh: 0, hi: 0, ol: 0 });
    }
  }

  function mrBear(P, x, y, t) {
    const B = C.night;
    P.part(P.ell(x - 4, y - 3, 3, 2.4), B, { b: 3 });
    P.part(P.ell(x + 4, y - 3, 3, 2.4), B, { b: 3 });
    P.part(P.ell(x, y - 8, 5.5, 5.5), B, { b: 3 });
    P.part(P.ell(x, y - 7, 3, 3), C.stone, { b: 3, sh: 0, hi: 0 });
    P.part(P.ell(x - 6, y - 9, 2, 2.6), B, { b: 3, sh: 0 });
    P.part(P.ell(x + 6, y - 9, 2, 2.6), B, { b: 3, sh: 0 });
    P.part(P.ell(x - 4.2, y - 19.5, 2.2, 2.2), B, { b: 3 });
    P.part(P.ell(x + 4.2, y - 19.5, 2.2, 2.2), B, { b: 3 });
    P.part(P.ell(x, y - 15, 5.2, 4.8), B, { b: 3 });
    P.part(P.ell(x, y - 13.2, 2.4, 1.7), C.stone, { b: 3, sh: 0, hi: 0 });
    P.px(x, y - 13.8, C.black);
    const k = Math.floor((t || 0) * 3) % 8;
    P.px(x - 2.2, y - 16, C.cycle[k]); P.px(x + 2.2, y - 16, C.cycle[(k + 4) % 8]);
    P.part(P.ell(x + 3, y - 5, 2.2, 1.8), C.cream, { b: 4, sh: 0 });
    P.part(P.ell(x - 2, y - 21.2, 1.4, 1.2), C.cream, { b: 4, sh: 0 });
    for (let i = 0; i < 3; i++) P.line(x - 5 + i * 5, y - 4, x - 4 + i * 5, y - 2, C.grey[3]);
  }

  function portrait(id) {
    const b = new S.Buf(24, 20);
    const put = (fn, x, y, s) => { const P = new S.Pen(b).at(x, y, s); fn(P); };
    if (MOB[id]) put(P => bearMask(P, 0, 0, MOB[id], {}), 12, 11, 0.5);
    else if (id === 'ted') put(P => bearMask(P, 0, 0, MOB.ted, {}), 12, 11, 0.52);
    else if (id === 'harry') put(P => moleHead(P, 0, 0, {}), 12, 12, 0.72);
    else if (id === 'leonard') put(P => leonardHead(P, 0, 0, {}), 12, 11, 0.72);
    else if (id === 'banda') put(P => bandaHead(P, 0, 0, {}), 12, 13, 0.62);
    else if (id === 'roach') { const sp = S.sprite('roach', { dir: 'e' }, 1.2); S.blit(b, sp.buf, 12 - sp.ox, 14 - sp.oy); }
    else if (id === 'hbear') { const sp = S.sprite('hbear', { act: 'spin', t: 0.3 }, 0.85); S.blit(b, sp.buf, 12 - sp.ox, 19 - sp.oy); }
    return b;
  }

  S.art103 = { MOB, bearMask, hypnoBear, moleHead, leonardHead, bandaHead, beret, card, suitShape, mobCar, mrBear, portrait };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
