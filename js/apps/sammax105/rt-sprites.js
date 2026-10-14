(function (S) {
  'use strict';
  const { C } = S;
  const COSTUMES = S.COSTUMES;
  const TAU = Math.PI * 2;
  const GLOW = [C.tvB, C.tvB, C.tvA, C.tvA, C.tvA];
  const LAMP = [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp];
  const NEON_R = [C.neonA, C.neonA, C.neonA, C.neonA, C.neonA];
  const NEON_G = [C.neonB, C.neonB, C.neonB, C.neonB, C.neonB];

  function visor(P, x, y, w) {
    P.part(P.rect(x - w - 1.6, y - 1.6, w * 2 + 3.2, 2.2), C.grey, { b: 0, sh: 0, hi: 0 });
    P.part(P.path(`M ${x - w} ${y - 4.2} L ${x + w} ${y - 4.2} L ${x + w + 1} ${y + 2.6} L ${x + 1.6} ${y + 2.6} L ${x} ${y + 1.2} L ${x - 1.6} ${y + 2.6} L ${x - w - 1} ${y + 2.6} Z`), C.grey, { b: 1 });
    P.part(P.rect(x - w + 1.4, y - 2.8, w * 2 - 2.8, 2.6), GLOW, { b: 3, sh: 0, hi: 0, ol: 0 });
    P.px(x - w + 2.4, y - 2.4, C.eye);
  }

  function sybil5Head(P, x, y, o) {
    S.art.sybilHead(P, x, y, o);
    if (o.v === 'vr') visor(P, x, y - 0.4, 7);
  }

  COSTUMES.sybil5 = {
    h: 86, w: 30,
    draw(P, o) {
      const act = o.act || '';
      const ph = o.anim || 0;
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      const hop = act === 'flail' && ph % 2 ? -1.5 : 0;
      P.part(P.cap(-3, -24 + hop, -3.5 - w * 2, -5, 2.3, 1.8), C.grey, { b: 1, sh: 0 });
      P.part(P.cap(3, -24 + hop, 3.5 + w * 2, -5, 2.3, 1.8), C.grey, { b: 1, sh: 0 });
      P.part(P.poly([-6 - w * 2, -5, -1.5 - w * 2, -5, -1.5 - w * 2, -1, -6.5 - w * 2, -0.5]), C.red, { b: 3, sh: 0 });
      P.part(P.poly([1.5 + w * 2, -5, 6 + w * 2, -5, 6.5 + w * 2, -0.5, 1.5 + w * 2, -1]), C.red, { b: 3, sh: 0 });
      P.part(P.path(`M -7 ${-56 + hop} Q -10.5 ${-44 + hop} -8.5 ${-34 + hop} Q -9.5 ${-26 + hop} -8 ${-19 + hop} L 8 ${-19 + hop} Q 9.5 ${-26 + hop} 8.5 ${-34 + hop} Q 10.5 ${-44 + hop} 7 ${-56 + hop} Z`), C.purple, { b: 3 });
      P.part(P.rect(-8.5, -38 + hop, 17, 2.5), C.pink, { b: 2, sh: 0 });
      P.part(P.rect(-6, -52 + hop, 5.4, 3.6), C.grey, { b: 5, sh: 0, hi: 0 });
      P.px(-4.6, -50.4 + hop, C.green[3]); P.px(-3, -50.4 + hop, C.green[3]);
      let la = [-11, -37], ra = [11, -37];
      if (act === 'flail') {
        const F = [[[-16, -68], [15, -42]], [[-19, -50], [17, -66]], [[-12, -40], [16, -72]], [[-18, -62], [19, -48]]][ph % 4];
        la = F[0]; ra = F[1];
      }
      if (act === 'shock') { la = [-12, -66]; ra = [12, -66]; }
      if (act === 'point') ra = [20, -52];
      if (act === 'rub') ra = [4, -76];
      if (act === 'arms') { la = [-5, -44]; ra = [5, -46]; }
      P.part(P.cap(-7.5, -54 + hop, la[0], la[1] + hop, 1.9, 1.6), C.skin, { b: 3, sh: 0 });
      P.part(P.cap(7.5, -54 + hop, ra[0], ra[1] + hop, 1.9, 1.6), C.skin, { b: 3, sh: 0 });
      P.part(P.cap(0, -56 + hop, 0, -62 + hop, 2.2), C.skin, { b: 3, sh: 0 });
      sybil5Head(P, 0, -69 + hop, o);
      if (act === 'rub') { P.px(7, -84, C.yellow[4]); P.px(10, -80, C.yellow[4]); P.px(4, -87, C.yellow[4]); }
    },
    anim: o => o.act === 'flail' ? Math.floor((o.t || 0) * 7) % 4 : 0
  };

  function elfEars(P, x, y) {
    P.part(P.rect(x - 10.4, y - 8.6, 20.8, 2.6), C.green, { b: 3, sh: 0 });
    for (const s of [-1, 1]) P.part(P.poly([x + s * 9.4, y - 3.4, x + s * 19, y - 11, x + s * 10.6, y + 3]), C.cream, { b: 4, sh: 1 });
    P.px(x, y - 7.4, C.gold[4]);
  }

  function bosco5Head(P, x, y, o) {
    S.art.boscoHead(P, x, y, o);
    elfEars(P, x, y);
    if (o.v === 'vr') visor(P, x, y + 0.4, 8.6);
  }

  function boscoBackHead(P, x, y) {
    const K = C.dskin;
    P.part(P.ell(x - 10, y + 1, 2.6, 3.6), K, { b: 2 });
    P.part(P.ell(x + 10, y + 1, 2.6, 3.6), K, { b: 2 });
    P.part(P.ell(x, y, 10, 11), K, { b: 2 });
    P.part(P.ell(x + 3, y - 6, 3, 1.6), K, { b: 3, sh: 0, hi: 0, ol: 0 });
    P.line(x - 5, y + 6, x + 5, y + 6, K[1]);
    P.part(P.rect(x - 4.4, y + 7, 8.8, 3.2), C.sky, { b: 2, sh: 0, hi: 0, ol: 0 });
    for (let i = 0; i < 4; i++) P.px(x - 3.4 + i * 2.2, y + 8.4, C.navy[1]);
    P.part(P.rect(x - 10.4, y - 8.6, 20.8, 2.6), C.green, { b: 2, sh: 0 });
    for (const s of [-1, 1]) P.part(P.poly([x + s * 9.4, y - 3.4, x + s * 19, y - 11, x + s * 10.6, y + 3]), C.cream, { b: 3, sh: 1 });
  }

  COSTUMES.bosco5 = {
    h: 86, w: 48,
    draw(P, o) {
      const act = o.act || '';
      const K = C.dskin;
      const back = act === 'turn';
      P.curve('M 15 -78 Q 30 -50 15 -20', C.oak[2]);
      P.line(15, -78, 15, -20, C.grey[4]);
      P.part(P.cap(-6, -27, -6.5, -4, 4.5, 4), C.navy, { b: 2, sh: 1 });
      P.part(P.cap(6, -27, 6.5, -4, 4.5, 4), C.navy, { b: 2, sh: 1 });
      P.part(P.ell(-7, -2, 5, 2.4), C.grey, { b: 1, sh: 0 });
      P.part(P.ell(7, -2, 5, 2.4), C.grey, { b: 1, sh: 0 });
      P.part(P.path('M -15 -53 Q -21 -40 -16 -25 L 16 -25 Q 21 -40 15 -53 Z'), C.grey, { b: 4 });
      if (back) {
        P.part(P.path('M -14 -54 Q -20 -38 -17 -22 L 17 -22 Q 20 -38 14 -54 Q 0 -58 -14 -54 Z'), C.green, { b: 2 });
        P.line(0, -54, 0, -24, C.green[1]);
      } else {
        P.part(P.path('M -13 -51 Q -18 -39 -15 -26 L 15 -26 Q 18 -39 13 -51 L 5 -51 L 0 -41 L -5 -51 Z'), C.orange, { b: 2 });
        for (let yy = -48; yy < -27; yy += 3) for (let xx = -12; xx <= 12; xx += 4) P.px(xx + (yy % 2 ? 1 : 0), yy, C.orange[1]);
        P.part(P.poly([-5, -51, 5, -51, 0, -41]), C.grey, { b: 4, sh: 0, hi: 0 });
        P.part(P.path('M -16 -54 Q -22 -44 -20 -30 L -14 -32 Q -16 -44 -11 -53 Z'), C.green, { b: 2 });
        P.part(P.path('M 16 -54 Q 22 -44 20 -30 L 14 -32 Q 16 -44 11 -53 Z'), C.green, { b: 2 });
        P.part(P.ell(0, -52, 2.2, 2), C.gold, { b: 3, sh: 0 });
      }
      P.part(P.rect(-4, -56, 8, 5), K, { b: 2, sh: 0 });
      const arm = (sx, ex, ey) => {
        P.part(P.cap(sx, -49, (sx + ex) / 2, (-49 + ey) / 2, 3.8, 3.4), back ? C.green : C.grey, { b: back ? 2 : 4, sh: 1 });
        P.part(P.cap((sx + ex) / 2, (-49 + ey) / 2, ex, ey, 3.2, 2.8), K, { b: 3, sh: 1 });
        P.part(P.ell(ex, ey + 1, 3.4, 3), K, { b: 3, sh: 1 });
      };
      if (act === 'give') { arm(-15, -30, -40); arm(15, 19, -29); }
      else if (act === 'point') { arm(-15, -19, -29); arm(15, 24, -64); }
      else if (act === 'shrug') { arm(-15, -24, -48); arm(15, 24, -48); }
      else if (act === 'rub') { arm(-15, -19, -29); arm(15, 8, -80); }
      else if (act === 'sneeze') { arm(-15, -19, -29); arm(15, 4, -62); }
      else if (act === 'bow') { arm(-15, -24, -62); arm(15, 22, -48); }
      else { arm(-15, -19, -29); arm(15, 19, -29); }
      if (back) boscoBackHead(P, 0, -66);
      else bosco5Head(P, 0, -66, o);
      if (act === 'sneeze') {
        P.part(P.poly([0, -66, 9, -65, 8, -57, 1, -58]), C.grey, { b: 5, sh: 1 });
        for (const [dx, dy] of [[-12, -70], [-16, -64], [-13, -58]]) P.px(dx, dy, C.slime[3]);
      }
      if (act === 'rub') { P.px(-4, -84, C.yellow[4]); P.px(2, -87, C.yellow[4]); P.px(12, -84, C.yellow[4]); }
    }
  };

  function helmet(P, x, y) {
    P.part(P.path(`M ${x - 6} ${y - 1.4} Q ${x - 5.6} ${y - 8.4} ${x + 0.6} ${y - 8.6} Q ${x + 6.4} ${y - 8.2} ${x + 7} ${y - 1.6} Z`), C.olive, { b: 2 });
    P.line(x - 6.6, y - 1.4, x + 7.6, y - 1.6, C.olive[0]);
    P.px(x - 1, y - 6.4, C.olive[4]);
  }

  function jimmy5Head(P, x, y, o) {
    S.art.jimmyHead(P, x, y, o);
    if (o.v === 'vr') { P.part(P.rect(x + 0.6, y - 3, 5.4, 3.2), C.grey, { b: 1 }); P.px(x + 3, y - 1.6, C.tvA); P.px(x + 4, y - 1.6, C.tvA); }
    else helmet(P, x, y - 3.4);
  }

  COSTUMES.jimmy5 = {
    h: 28, w: 18,
    draw(P, o) {
      const act = o.act || '';
      const R = C.rat;
      const ph = o.anim || 0;
      if (act === 'peek') { jimmy5Head(P, 0, -5, o); return; }
      P.part(P.cap(-4, -3, -14, -6, 1.1, 0.6), C.pink, { b: 2, sh: 0 });
      P.part(P.ell(-2.5, -2.2, 3.8, 2.2), R, { b: 2 });
      P.part(P.ell(-1, -8.5, 5.4, 6.6, 0.2), R, { b: 3 });
      P.part(P.ell(1.4, -7.5, 2.8, 4.4), R, { b: 4, sh: 0 });
      P.part(P.ell(2.8, -1, 2.6, 1.2), C.pink, { b: 3, sh: 0 });
      P.line(-4, -13, 3, -5, C.oak[1]);
      for (let i = 0; i < 3; i++) P.px(-3 + i * 2.2, -12 + i * 2.6, C.gold[3]);
      if (act === 'load') {
        const lift = ph % 2 ? -2 : 0;
        P.part(P.cap(2, -11, 7, -13 + lift, 1.1), R, { b: 3, sh: 0 });
        P.part(P.ell(9.4, -14 + lift, 3.2, 3.2), C.grey, { b: 1 });
        P.px(8.4, -15.4 + lift, C.grey[4]);
      } else if (act === 'fire') {
        P.part(P.cap(2, -11, 8, -16, 1.1), R, { b: 3, sh: 0 });
        P.line(8, -16, 12, -20, C.sand[3]);
      } else if (act === 'salute') {
        P.part(P.cap(2, -11, 6, -18, 1.1), R, { b: 3, sh: 0 });
      } else {
        P.part(P.cap(2, -11, 5, -8, 1.1), R, { b: 3, sh: 0 });
      }
      jimmy5Head(P, 3.5, -17, o);
    },
    anim: o => o.act === 'load' ? Math.floor((o.t || 0) * 5) % 2 : 0
  };

  function glassTube(P, ramp, sunk) {
    const b = P.b;
    const body = P.rect(-17, -80, 34, 76);
    body.each((x, y) => { if ((x + y) % 3 === 0) b.set(x, y, ramp[1]); else if ((x * 2 + y) % 7 === 0) b.set(x, y, ramp[0]); });
    P.line(-17, -80, -17, -4, ramp[3]);
    P.line(17, -80, 17, -4, ramp[3]);
    P.line(-13, -76, -13, -12, ramp[4]);
    P.part(P.ell(0, -81, 18, 4), ramp, { b: 3 });
    P.part(P.ell(0, -3, 19, 4.4), ramp, { b: 2 });
    P.part(P.ell(0, -4.4, 13, 2.4), GLOW, { b: 3, sh: 0, hi: 0, ol: 0 });
    if (sunk) for (let i = 0; i < 3; i++) P.px(-8 + i * 8, -84 - i % 2, C.cycle[i * 2]);
  }

  function pixBug(P, x, y) {
    P.part(P.rect(x - 3, y - 4, 6, 4), NEON_G, { sh: 0, hi: 0 });
    P.px(x - 2, y - 3, C.black); P.px(x + 1, y - 3, C.black);
    P.line(x - 4, y - 5, x - 5, y - 7, C.neonB); P.line(x + 3, y - 5, x + 4, y - 7, C.neonB);
    for (const s of [-1, 1]) { P.px(x + s * 4, y - 2, C.neonB); P.px(x + s * 4, y, C.neonB); }
  }

  function inTube(P, o, ramp, draw) {
    const sunk = o.act === 'sunk';
    const ph = o.anim || 0;
    const bob = sunk ? 0 : Math.round(Math.sin(ph * TAU / 4) * 1.6);
    glassTube(P, ramp, sunk);
    const cy = sunk ? -8 : -30 + bob;
    const Q = P.scaled(0, 0, 0.62);
    Q.oy += cy * Math.abs(P.sy);
    draw(Q, o);
    if (sunk) pixBug(P, 3, cy - 26);
    P.line(-17, -80, -17, -4, ramp[3]);
    P.line(17, -80, 17, -4, ramp[3]);
  }

  function curtBox(P, o) {
    P.part(P.rect(-20, -44, 40, 27), C.cream, { b: 3 });
    P.part(P.rect(-20, -44, 40, 3), C.cream, { b: 4, sh: 0, hi: 0 });
    P.part(P.rect(-7, -40, 14, 11), C.grey, { b: 1 });
    P.part(P.rect(-5.4, -38.6, 10.8, 8.2), C.night, { b: 0, sh: 0, hi: 0, ol: 0 });
    const rows = o.talk ? 3 : 1;
    for (let r = 0; r < rows; r++) for (let i = 0; i < 4 - r; i++) P.px(-4 + i * 2, -37 + r * 2.4, C.orange[3]);
    if (!o.talk && !o.blink) P.px(-4, -33, C.orange[4]);
    for (const sx of [-17.6, 9.4]) {
      P.part(P.rect(sx, -39, 8.2, 8.6), C.cream, { b: 2, sh: 1, hi: 1 });
      P.part(P.rect(sx + 1.2, -36.4, 5.8, 1.4), C.night, { b: 0, sh: 0, hi: 0, ol: 0 });
      P.px(sx + 6, -32.6, o.talk ? C.neonA : C.red[1]);
    }
    P.part(P.rect(-12, -25.4, 24, 5), C.grey, { b: 5, sh: 0, hi: 0 });
    for (let i = 0; i < 4; i++) P.line(-10 + i * 5.4, -24, -7 + i * 5.4, -24, C.grey[3]);
    P.part(P.poly([-20, -17, 20, -17, 24, -10, -24, -10]), C.cream, { b: 2 });
    for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) P.px(-17 + i * 3 + r, -15 + r * 2.4, C.grey[2]);
    P.part(P.rect(-6, -47, 12, 3.4), C.grey, { b: 1, sh: 0 });
  }

  COSTUMES.copcurt = {
    h: 50, w: 46,
    draw(P, o) {
      if (o.v === 'vr') { inTube(P, o, C.blue, curtBox); return; }
      P.part(P.rect(-19, -10, 38, 10), C.oak, { b: 2 });
      P.line(-19, -5, 19, -5, C.oak[0]);
      P.line(-6, -10, -6, 0, C.oak[0]); P.line(8, -10, 8, 0, C.oak[0]);
      curtBox(P, o);
    },
    anim: o => o.v === 'vr' ? Math.floor((o.t || 0) * 3) % 4 : 0
  };

  function bobPhone(P, o) {
    P.part(P.poly([-13, -26, 13, -26, 10, -40, -10, -40]), C.sand, { b: 3 });
    P.part(P.poly([-10, -40, 10, -40, 8, -43, -8, -43]), C.sand, { b: 4, sh: 0 });
    P.part(P.cap(-11.5, -46.5, 11.5, -46.5, 3), C.sand, { b: 2 });
    P.part(P.ell(-11.5, -46, 3.6, 3.2), C.sand, { b: 3 });
    P.part(P.ell(11.5, -46, 3.6, 3.2), C.sand, { b: 3 });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      const lit = o.talk && (r * 3 + c + (o.anim || 0)) % 5 === 0;
      P.part(P.rect(-1.4 + c * 3.4, -38.6 + r * 3, 2.4, 2), lit ? LAMP : C.grey, { b: 4, sh: 0, hi: 0, ol: 0 });
    }
    for (let i = 0; i < 4; i++) P.line(-10, -37.6 + i * 2.2, -4, -37.6 + i * 2.2, C.sand[1]);
    P.px(-7, -28.4, o.talk ? C.neonA : C.red[1]);
    P.curve('M -11 -43 Q -18 -38 -15 -32 Q -12 -28 -16 -24', C.grey[1]);
  }

  COSTUMES.copbob = {
    h: 54, w: 32,
    draw(P, o) {
      if (o.v === 'vr') { inTube(P, o, C.purple, Q => { const R = Q.scaled(0, 0, 1); R.oy += 12 * Math.abs(Q.sy); bobPhone(R, o); }); return; }
      P.part(P.cap(-7, -24, -11, -1, 1.5), C.grey, { b: 2, sh: 0 });
      P.part(P.cap(7, -24, 11, -1, 1.5), C.grey, { b: 2, sh: 0 });
      P.line(-9, -10, 9, -10, C.grey[1]);
      P.part(P.ell(0, -25, 13, 3.4), C.red, { b: 2 });
      bobPhone(P, o);
    },
    anim: o => o.v === 'vr' ? Math.floor((o.t || 0) * 3) % 4 : Math.floor((o.t || 0) * 8) % 5
  };

  function blusterCab(P, o) {
    const ph = o.anim || 0;
    P.part(P.path('M -17 0 L -17 -58 L -13 -63 L -15 -78 L -13 -92 L 15 -92 L 17 -78 L 13 -63 L 17 -58 L 17 0 Z'), C.night, { b: 1 });
    P.part(P.rect(-13, -92, 28, 9), C.orange, { b: 3 });
    P.part(P.poly([-6, -90, -1, -90, -4, -87, 1, -87, -5, -84.4, -3, -86.6, -8, -86.6]), LAMP, { sh: 0, hi: 0, ol: 0 });
    P.part(P.poly([5, -90, 10, -90, 7, -87, 12, -87, 6, -84.4, 8, -86.6, 3, -86.6]), LAMP, { sh: 0, hi: 0, ol: 0 });
    P.part(P.rect(-11.4, -81, 24.8, 17), C.grey, { b: 0, sh: 0, hi: 0 });
    const scr = P.rect(-9.4, -79.4, 20.8, 13.8);
    P.part(scr, C.night, { b: 0, sh: 0, hi: 0, ol: 0 });
    const eyeY = -76;
    for (const s of [-1, 1]) {
      P.part(P.poly([1 + s * 3, eyeY + 2.6, 1 + s * 8, eyeY - (o.blink ? 0 : 1.4), 1 + s * 8, eyeY + 2.6]), NEON_R, { sh: 0, hi: 0, ol: 0 });
    }
    const open = o.talk ? 3 : 1;
    for (let i = 0; i < 7; i++) P.line(-5 + i * 2, -70, -5 + i * 2, -70 + (i % 2 ? open : 0.4), C.neonA);
    if (o.talk && ph % 2) for (let i = 0; i < 4; i++) P.px(-8 + i * 6, -79 + (i % 2), C.lamp);
    P.part(P.poly([-13, -63, 13, -63, 17, -57, -17, -57]), C.orange, { b: 2 });
    P.part(P.cap(-6, -60, -7, -66, 0.9), C.grey, { b: 4, sh: 0 });
    P.part(P.ell(-7, -67, 2.2, 2.2), C.red, { b: 3 });
    P.part(P.ell(3, -60.4, 1.8, 1.4), C.yellow, { b: 3, sh: 0 });
    P.part(P.ell(9, -60.4, 1.8, 1.4), C.sky, { b: 3, sh: 0 });
    P.part(P.rect(-7, -44, 14, 16), C.grey, { b: 1 });
    P.part(P.rect(-3.4, -40, 6.8, 2), LAMP, { sh: 0, hi: 0, ol: 0 });
    P.part(P.rect(-3.4, -34, 6.8, 3), C.grey, { b: 0, sh: 0, hi: 0, ol: 0 });
    for (const sx of [-15.4, 13]) for (let i = 0; i < 7; i++) P.line(sx, -54 + i * 7, sx + 2.4, -51 + i * 7, C.orange[2]);
    P.part(P.rect(-17, -3, 34, 3), C.grey, { b: 0, sh: 0, hi: 0 });
  }

  COSTUMES.copbluster = {
    h: 96, w: 40,
    draw(P, o) {
      if (o.v === 'vr') { inTube(P, o, C.yellow, Q => { const R = Q.scaled(0, 0, 0.78); R.oy += 8 * Math.abs(Q.sy); blusterCab(R, o); }); return; }
      blusterCab(P, o);
    },
    anim: o => o.v === 'vr' ? Math.floor((o.t || 0) * 3) % 4 : Math.floor((o.t || 0) * 8) % 2
  };

  function chippySet(P, o) {
    const ph = o.anim || 0;
    P.line(-4, -47, -12, -58, C.grey[3]); P.line(4, -47, 12, -58, C.grey[3]);
    P.part(P.rect(-15, -47, 30, 22), C.wood, { b: 2 });
    for (let i = 0; i < 4; i++) P.line(-14, -44 + i * 5, -12 + i, -41 + i * 5, C.wood[1]);
    P.part(P.rect(-12.4, -44.6, 19, 16.6), C.grey, { b: 0, sh: 0, hi: 0 });
    const x0 = -11, y0 = -43.4, w = 16.4, h = 14;
    P.part(P.rect(x0, y0, w, h), C.night, { b: 0, sh: 0, hi: 0, ol: 0 });
    for (let i = 0; i < 5; i++) P.px(x0 + w / 2, y0 + 1 + i * 3, C.grey[3]);
    const k = ph % 6;
    const bx = x0 + 2 + [0, 3, 6, 9, 6, 3][k] * 1.3, by = y0 + 2 + [2, 5, 8, 5, 2, 6][k];
    P.part(P.rect(x0 + 0.6, y0 + 1 + [1, 3, 6, 5, 2, 4][k], 1.2, 4), C.grey, { b: 5, sh: 0, hi: 0, ol: 0 });
    P.part(P.rect(x0 + w - 1.8, y0 + 1 + [6, 5, 3, 2, 4, 6][k], 1.2, 4), C.grey, { b: 5, sh: 0, hi: 0, ol: 0 });
    P.part(P.rect(bx, by, 1.4, 1.4), o.talk ? NEON_G : C.grey, { b: 5, sh: 0, hi: 0, ol: 0 });
    P.part(P.ell(10.4, -41, 1.8, 1.8), C.grey, { b: 3, sh: 0 });
    P.part(P.ell(10.4, -35, 1.8, 1.8), C.grey, { b: 3, sh: 0 });
    P.part(P.rect(-13, -24, 26, 6), C.grey, { b: 1 });
    P.part(P.rect(-13, -24, 26, 1.6), C.wood, { b: 3, sh: 0, hi: 0, ol: 0 });
    for (const kx of [-7, 7]) { P.part(P.ell(kx, -20.6, 2.4, 2), C.grey, { b: 4, sh: 0 }); P.px(kx, -21.4, C.grey[1]); }
    P.px(0, -20.6, o.talk ? C.neonB : C.green[1]);
  }

  COSTUMES.copchippy = {
    h: 60, w: 34,
    draw(P, o) {
      if (o.v === 'vr') { inTube(P, o, C.green, Q => { const R = Q.scaled(0, 0, 1); R.oy += 12 * Math.abs(Q.sy); chippySet(R, o); }); return; }
      P.part(P.rect(-14, -18, 28, 2.6), C.oak, { b: 3, sh: 0 });
      P.line(-12, -15, 10, -1, C.grey[2]); P.line(12, -15, -10, -1, C.grey[2]);
      P.line(-13, -1, -7, -1, C.grey[1]); P.line(7, -1, 13, -1, C.grey[1]);
      chippySet(P, o);
    },
    anim: o => o.v === 'vr' ? Math.floor((o.t || 0) * 3) % 4 : Math.floor((o.t || 0) * 6) % 6
  };

  function portrait(id) {
    const b = new S.Buf(24, 20);
    const put = (fn, x, y, s) => fn(new S.Pen(b).at(x, y, s));
    const spr = (cos, pose, s, x, y) => { const sp = S.sprite(cos, pose, s); S.blit(b, sp.buf, x - sp.ox, y - sp.oy); };
    if (id === 'sybil5') put(P => sybil5Head(P, 0, 0, { v: 'vr' }), 12, 14, 0.85);
    else if (id === 'jimmy5') put(P => jimmy5Head(P, 0, 0, {}), 8, 14, 1.15);
    else if (id === 'cops') { spr('copcurt', {}, 0.3, 6, 19); spr('copbob', {}, 0.3, 18, 19); spr('copchippy', {}, 0.3, 12, 11); }
    return b;
  }

  S.art105 = { visor, pixBug, portrait, GLOW, LAMP, NEON_R, NEON_G };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
