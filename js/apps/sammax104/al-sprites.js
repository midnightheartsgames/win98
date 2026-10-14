(function (S) {
  'use strict';
  const { C } = S;
  const COSTUMES = S.COSTUMES;
  const TAU = Math.PI * 2;
  const LAMP = [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp];

  function shades(P, x, y, w) {
    for (const s of [-1, 1]) {
      const a = x + s * 0.8, b = x + s * (w + 0.8);
      P.part(P.path(`M ${a} ${y - 3.6} L ${b} ${y - 3.6} Q ${b - s * 0.2} ${y + 0.8} ${(a + b) / 2} ${y + 0.8} Q ${a + s * 0.2} ${y + 0.8} ${a} ${y - 3.6} Z`), C.night, { b: 0, sh: 0, hi: 0 });
      P.px((a + b) / 2 - 1, y - 2.2, C.grey[3]);
    }
    P.line(x - w - 1.6, y - 3.6, x + w + 1.6, y - 3.6, C.black);
  }

  function superballHead(P, x, y, o) {
    const K = C.pale, H = C.wood;
    P.part(P.ell(x - 6.6, y + 1, 1.8, 2.8), K, { b: 3, sh: 0 });
    P.part(P.ell(x + 6.6, y + 1, 1.8, 2.8), K, { b: 3, sh: 0 });
    P.part(P.path(`M ${x - 6.5} ${y - 8} Q ${x - 7.5} ${y + 3} ${x - 5.5} ${y + 9} Q ${x} ${y + 13} ${x + 5.5} ${y + 9} Q ${x + 7.5} ${y + 3} ${x + 6.5} ${y - 8} Q ${x} ${y - 11} ${x - 6.5} ${y - 8} Z`), K, { b: 4 });
    P.part(P.path(`M ${x - 7} ${y - 5.4} Q ${x - 8.6} ${y - 15} ${x - 2} ${y - 18} Q ${x + 5} ${y - 20.5} ${x + 8} ${y - 14} Q ${x + 8.6} ${y - 9} ${x + 7} ${y - 4.6} Q ${x + 5} ${y - 9.4} ${x} ${y - 8.6} Q ${x - 4} ${y - 8.8} ${x - 7} ${y - 5.4} Z`), H, { b: 1 });
    P.curve(`M ${x - 4} ${y - 12} Q ${x + 1} ${y - 16.5} ${x + 6} ${y - 13}`, H[2]);
    P.line(x - 5.6, y - 5.6, x - 1.2, y - 4.8, H[0]);
    P.line(x + 1.2, y - 4.8, x + 5.6, y - 5.6, H[0]);
    shades(P, x, y, 5.2);
    P.part(P.ell(x, y + 2.6, 1.8, 2.1), K, { b: 3, sh: 0, hi: 1, ol: K[1] });
    if (o.wide) P.part(P.ell(x, y + 7.8, 2.8, 2.6), C.red, { b: 1, sh: 0, hi: 0 });
    else if (o.talk) P.part(P.ell(x, y + 7.4, 2.2, 1.4), C.red, { b: 1, sh: 0, hi: 0 });
    else P.line(x - 2.2, y + 7.2, x + 2.2, y + 7.2, K[0]);
    P.part(P.ell(x + 7.2, y + 1, 1.5, 1.8), C.lilac, { b: 3, sh: 0 });
    P.line(x + 8.2, y + 0.4, x + 11.4, y - 1.6, C.grey[1]);
  }

  function suit(P, ramp, b, top, bot, wd) {
    P.part(P.path(`M ${-wd} ${top} Q ${-wd - 2.6} ${(top + bot) / 2} ${-wd + 0.5} ${bot} L ${wd - 0.5} ${bot} Q ${wd + 2.6} ${(top + bot) / 2} ${wd} ${top} Q 0 ${top - 3} ${-wd} ${top} Z`), ramp, { b });
    P.part(P.poly([-3.6, top - 1, 3.6, top - 1, 0, top + 12]), C.grey, { b: 5, sh: 0, hi: 0 });
    P.part(P.poly([-1.3, top, 1.3, top, 2.1, top + 9, 0, top + 12.5, -2.1, top + 9]), C.red, { b: 3, sh: 0, hi: 0 });
    P.line(-1.4, top + 3, 1.2, top + 1.6, C.grey[3]);
    P.line(-1.6, top + 6.4, 1.6, top + 4.8, C.grey[3]);
    P.line(-3.6, top - 1, -1.2, top + 14, ramp[Math.max(0, b - 1)]);
    P.line(3.6, top - 1, 1.2, top + 14, ramp[Math.max(0, b - 1)]);
    P.line(-wd + 0.5, bot + 0.5, wd - 0.5, bot + 0.5, C.black);
  }

  function sleeve(P, ramp, b, sx, sy, hx, hy, skin) {
    P.part(P.cap(sx, sy, hx, hy, 2.8, 2.4), ramp, { b, sh: 1 });
    P.part(P.ell(hx, hy + 1, 2.5, 2.3), skin, { b: 3, sh: 0 });
  }

  function superballLying(P, o) {
    const G = C.grey, K = C.pale;
    P.part(P.cap(10, -8, 44, -5, 3.2, 2.8), G, { b: 1, sh: 1 });
    P.part(P.ell(46, -6, 2.2, 4.2), G, { b: 0, sh: 0 });
    P.part(P.cap(10, -13, 40, -15, 3.3, 2.8), G, { b: 1, sh: 1 });
    P.part(P.ell(42, -16, 2.2, 4.4), G, { b: 0, sh: 0 });
    P.part(P.path('M -14 -25 Q -18 -14 -10 -5 L 14 -4 Q 19 -12 14 -20 Q 0 -27 -14 -25 Z'), G, { b: 1 });
    P.part(P.poly([-14, -24, -6, -25, -8, -16]), C.grey, { b: 5, sh: 0, hi: 0 });
    P.part(P.poly([-12, -23, -8, -24, -9, -18]), C.red, { b: 3, sh: 0, hi: 0 });
    sleeve(P, G, 1, 4, -21, 13, -9, K);
    P.part(P.cap(-13, -18, -20, -2, 2.8, 2.4), G, { b: 1, sh: 1 });
    P.part(P.cap(-20, -2, -21, -21, 2.6, 2.2), G, { b: 1, sh: 1 });
    P.part(P.ell(-20, -22, 2.6, 2.4), K, { b: 3, sh: 0 });
    superballHead(P, -16, -32, o);
  }

  COSTUMES.superball = {
    h: 104, w: 30,
    draw(P, o) {
      const act = o.act || '';
      const G = C.grey, K = C.pale;
      if (act === 'lie') return superballLying(P, o);
      const ph = o.anim || 0;
      const dance = act === 'dance';
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      const bob = dance && ph % 2 ? -2 : act === 'squat' ? 9 : 0;
      let l1 = [-4 - w * 3, -3], l2 = [4 + w * 3, -3];
      if (dance && ph === 1) l2 = [15, -22];
      if (dance && ph === 3) l1 = [-15, -22];
      if (act === 'kick') { if (ph) l2 = [21, -52]; else l1 = [-21, -52]; }
      if (act === 'squat') { l1 = [-11, -3]; l2 = ph ? [18, -12] : [11, -3]; }
      P.part(P.cap(-3.5, -42 + bob, l1[0], l1[1], 3.3, 2.8), G, { b: 1, sh: 1 });
      P.part(P.cap(3.5, -42 + bob, l2[0], l2[1], 3.3, 2.8), G, { b: 1, sh: 1 });
      P.part(P.ell(l1[0] - 1.2, l1[1] + 1.4, 4.4, 2), G, { b: 0, sh: 0 });
      P.part(P.ell(l2[0] + 1.2, l2[1] + 1.4, 4.4, 2), G, { b: 0, sh: 0 });
      suit(P, G, 1, -80 + bob, -42 + bob, 9.5);
      if (o.v === 'sec') {
        P.part(P.ell(-5.6, -70 + bob, 2.6, 2.6), C.red, { b: 3, sh: 0 });
        P.part(P.poly([-7, -68 + bob, -4.4, -68 + bob, -3.6, -62 + bob, -5.6, -64 + bob, -7.6, -62 + bob]), C.red, { b: 2, sh: 0, hi: 0 });
      }
      const sy = -77 + bob;
      let la = [-3, -48 + bob], ra = [3, -48 + bob];
      if (act === 'block') { la = [5, -65]; ra = [-5, -63]; }
      if (act === 'phone' || act === 'report') ra = [7.5, -89];
      if (act === 'salute') ra = [7, -100];
      if (act === 'point') ra = [22, -72];
      if (dance) {
        if (ph === 0) { la = [-17, -100]; ra = [17, -100]; }
        if (ph === 1) { la = [-21, -72]; ra = [12, -98]; }
        if (ph === 2) { la = [-21, -66]; ra = [21, -66]; }
        if (ph === 3) { la = [-12, -98]; ra = [21, -72]; }
      }
      if (act === 'sing') { la = [-20, -62]; ra = [20, -62]; }
      if (act === 'chest') { la = [-19, -58]; ra = [-1, -70]; }
      if (act === 'up') { la = [-15, -106]; ra = [15, -106]; }
      if (act === 'wave') ra = [ph ? 19 : 13, -101];
      if (act === 'thumb') ra = [13, -76];
      if (act === 'kick' || act === 'squat') { la = [-21, -64 + bob]; ra = [21, -64 + bob]; }
      if (act !== 'shout') {
        sleeve(P, G, 1, -9, sy, la[0], la[1], K);
        sleeve(P, G, 1, 9, sy, ra[0], ra[1], K);
      }
      if (act === 'thumb') P.part(P.cap(ra[0], ra[1] - 1, ra[0] + 0.5, ra[1] - 6, 1.3), K, { b: 3, sh: 0 });
      superballHead(P, 0, -93 + bob, o);
      if (act === 'shout') {
        sleeve(P, G, 1, -9, sy, -4, -86, K);
        sleeve(P, G, 1, 9, sy, 4, -86, K);
      }
      if (act === 'phone') {
        P.part(P.cap(9, -95, 10, -84, 1.7), G, { b: 0, sh: 0 });
        P.curve('M 10 -84 Q 16 -70 12 -56', C.black);
      }
    },
    anim: o => o.act === 'dance' ? Math.floor((o.t || 0) * 4) % 4 : o.act === 'kick' || o.act === 'squat' || o.act === 'wave' ? Math.floor((o.t || 0) * 4) % 2 : 0
  };

  function chucklesHead(P, x, y, o) {
    const K = C.pale, H = C.stone;
    for (const s of [-1, 1]) {
      P.part(P.ell(x + s * 9.6, y + 1, 2.8, 4.2), K, { b: 2, sh: 0 });
      P.part(P.ell(x + s * 8.6, y - 4.4, 2.8, 4.4), H, { b: 4, sh: 0 });
    }
    P.part(P.path(`M ${x - 8.5} ${y - 7} Q ${x - 10} ${y + 4} ${x - 6} ${y + 9.5} Q ${x} ${y + 12.6} ${x + 6} ${y + 9.5} Q ${x + 10} ${y + 4} ${x + 8.5} ${y - 7} Q ${x} ${y - 10} ${x - 8.5} ${y - 7} Z`), K, { b: 3 });
    P.part(P.poly([x - 9, y - 6.6, x - 8.4, y - 15.4, x + 8, y - 16.6, x + 9.6, y - 6.6, x + 5, y - 9.6, x - 5, y - 9.4]), H, { b: 2 });
    for (let i = -3; i <= 3; i++) P.line(x + i * 2.2, y - 15.4, x + i * 2.2 + 0.4, y - 10.4, H[1]);
    P.part(P.poly([x - 7.2, y - 6, x - 1.4, y - 4.8, x - 1.4, y - 3.6, x - 7.2, y - 4.6]), H, { b: 1, sh: 0, hi: 0, ol: 0 });
    P.part(P.poly([x + 7.2, y - 6, x + 1.4, y - 4.8, x + 1.4, y - 3.6, x + 7.2, y - 4.6]), H, { b: 1, sh: 0, hi: 0, ol: 0 });
    shades(P, x, y + 0.4, 6);
    P.part(P.ell(x + 0.4, y + 3.4, 3, 3.1), K, { b: 3, sh: 1, hi: 1, ol: K[1] });
    if (o.talk) P.part(P.ell(x + 0.6, y + 8.6, 2.6, 1.5), C.red, { b: 1, sh: 0, hi: 0 });
    else P.curve(`M ${x - 3.4} ${y + 8} Q ${x} ${y + 9.6} ${x + 4.2} ${y + 7.4}`, C.black);
  }

  COSTUMES.agentc = {
    h: 96, w: 34,
    draw(P, o) {
      const act = o.act || '';
      const B = C.wood, K = C.pale;
      if (act === 'sit') {
        P.part(P.cap(-3, -3, 7, -1.5, 3.4, 3), B, { b: 1, sh: 1 });
        P.part(P.cap(3, -3, 10, -1, 3.4, 3), B, { b: 1, sh: 1 });
        P.part(P.cap(7, -1.5, 8, 11, 3, 2.6), B, { b: 1, sh: 1 });
        P.part(P.cap(10, -1, 12, 11, 3, 2.6), B, { b: 1, sh: 1 });
        P.part(P.ell(9.5, 13, 4.2, 2), C.grey, { b: 0, sh: 0 });
        P.part(P.ell(13.5, 13, 4.2, 2), C.grey, { b: 0, sh: 0 });
        suit(P, B, 1, -34, -2, 10);
        sleeve(P, B, 1, -9.5, -31, -12, -8, K);
        sleeve(P, B, 1, 9.5, -31, o.talk ? 16 : 8, o.talk ? -22 : -8, K);
        chucklesHead(P, 0, -47, o);
        return;
      }
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      P.part(P.cap(-4, -36, -4.5 - w * 2.6, -3, 3.5, 3.1), B, { b: 1, sh: 1 });
      P.part(P.cap(4, -36, 4.5 + w * 2.6, -3, 3.5, 3.1), B, { b: 1, sh: 1 });
      P.part(P.ell(-5 - w * 2.6, -1.6, 4.4, 2), C.grey, { b: 0, sh: 0 });
      P.part(P.ell(5 + w * 2.6, -1.6, 4.4, 2), C.grey, { b: 0, sh: 0 });
      suit(P, B, 1, -68, -35, 10.5);
      let la = [-13, -44], ra = [13, -44];
      if (act === 'grab') ra = [23, -58];
      if (act === 'remote') ra = [14, -82];
      if (act === 'point') ra = [24, -66];
      sleeve(P, B, 1, -10, -65, la[0], la[1], K);
      sleeve(P, B, 1, 10, -65, ra[0], ra[1], K);
      if (act === 'remote') {
        P.part(P.rect(ra[0] - 2, ra[1] - 8, 5, 8), C.grey, { b: 1 });
        P.px(ra[0], ra[1] - 6, C.neonA);
        P.line(ra[0], ra[1] - 8, ra[0] + 1, ra[1] - 13, C.grey[4]);
      }
      chucklesHead(P, 0, -81, o);
    }
  };

  function presHead(P, x, y, o) {
    const K = C.skin;
    const jaw = o.talk ? 2 : 0;
    P.part(P.ell(x - 11.6, y - 1, 2.6, 4), K, { b: 2, sh: 0 });
    P.part(P.ell(x + 11.6, y - 1, 2.6, 4), K, { b: 2, sh: 0 });
    P.part(P.path(`M ${x - 9} ${y - 10} Q ${x - 13} ${y - 2} ${x - 11} ${y + 7 + jaw} Q ${x - 6} ${y + 12 + jaw} ${x} ${y + 12 + jaw} Q ${x + 6} ${y + 12 + jaw} ${x + 11} ${y + 7 + jaw} Q ${x + 13} ${y - 2} ${x + 9} ${y - 10} Q ${x} ${y - 13.5} ${x - 9} ${y - 10} Z`), K, { b: 3 });
    P.part(P.path(`M ${x - 9.6} ${y - 7.6} Q ${x - 9.4} ${y - 15.6} ${x} ${y - 16.2} Q ${x + 9.4} ${y - 15.6} ${x + 9.6} ${y - 7.6} Q ${x + 5} ${y - 11.6} ${x} ${y - 11} Q ${x - 5} ${y - 11.6} ${x - 9.6} ${y - 7.6} Z`), C.wood, { b: 2 });
    for (let i = -2; i <= 2; i++) P.px(x + i * 3, y - 15.6 + Math.abs(i) * 0.5, C.wood[3]);
    P.line(x - 7, y - 7.6, x - 2, y - 6.8, C.wood[0]);
    P.line(x + 2, y - 6.8, x + 7, y - 7.6, C.wood[0]);
    for (const ex of [-4.2, 4.2]) {
      if (o.v === 'dead') { P.line(x + ex - 2, y - 5.6, x + ex + 2, y - 2.4, C.black); P.line(x + ex - 2, y - 2.4, x + ex + 2, y - 5.6, C.black); }
      else S.art.spiral(P, x + ex, y - 4, 2.6, 0.4);
    }
    P.part(P.ell(x, y + 0.6, 2.5, 2.1), C.rose, { b: 3, sh: 0 });
    for (const s of [-1, 1]) { P.px(x + s * 6, y + 1.4, K[2]); P.px(x + s * 7.6, y + 0.2, K[2]); P.px(x + s * 7.4, y + 2.6, K[2]); }
    P.part(P.path(`M ${x - 8} ${y + 3.6} Q ${x} ${y + 6.2} ${x + 8} ${y + 3.6} Q ${x + 6.6} ${y + 10.4 + jaw} ${x} ${y + 10.6 + jaw} Q ${x - 6.6} ${y + 10.4 + jaw} ${x - 8} ${y + 3.6} Z`), C.red, { b: 1, sh: 0, hi: 0 });
    P.part(P.path(`M ${x - 7} ${y + 4.2} Q ${x} ${y + 6.6} ${x + 7} ${y + 4.2} L ${x + 6.2} ${y + 6.4} Q ${x} ${y + 8.6} ${x - 6.2} ${y + 6.4} Z`), C.eye, { sh: 0, hi: 0, ol: 0 });
    for (let i = -2; i <= 2; i++) P.line(x + i * 2.4, y + 5.4 - Math.abs(i) * 0.3, x + i * 2.4, y + 7.6 - Math.abs(i) * 0.4, C.grey[3]);
    P.line(x - 8, y + 4.2, x - 7.4, y + 11 + jaw, K[1]);
    P.line(x + 8, y + 4.2, x + 7.4, y + 11 + jaw, K[1]);
  }

  COSTUMES.puppet = {
    h: 88, w: 40,
    draw(P, o) {
      const act = o.act || '';
      const N = C.navy, K = C.skin;
      const headless = o.v === 'headless';
      P.part(P.cap(-5, -22, -6, -3, 4, 3.4), N, { b: 1, sh: 1 });
      P.part(P.cap(5, -22, 6, -3, 4, 3.4), N, { b: 1, sh: 1 });
      const lean = headless ? 5 : 0;
      P.part(P.path(`M ${-14 + lean} -54 Q ${-17 + lean * 0.5} -38 -13 -20 L 13 -20 Q ${17 + lean * 0.5} -38 ${14 + lean} -54 Q ${lean} -58 ${-14 + lean} -54 Z`), N, { b: 2 });
      P.part(P.poly([-4 + lean, -55, 4 + lean, -55, lean * 0.6, -41]), C.grey, { b: 5, sh: 0, hi: 0 });
      P.part(P.poly([-1.5 + lean, -54, 1.5 + lean, -54, 2.2 + lean * 0.6, -43, lean * 0.5, -39, -2.2 + lean * 0.6, -43]), C.red, { b: 3, sh: 0, hi: 0 });
      let la = [-15, -24], ra = [15, -24];
      if (act === 'point') ra = [20, -62];
      if (act === 'wave') ra = [22, -66 + Math.sin((o.anim || 0) * TAU / 4) * 2];
      if (headless) { la = [-18, -12]; ra = [20, -10]; }
      P.part(P.cap(-13 + lean, -51, la[0], la[1], 3.6, 3), N, { b: 2, sh: 1 });
      P.part(P.cap(13 + lean, -51, ra[0], ra[1], 3.6, 3), N, { b: 2, sh: 1 });
      P.part(P.ell(la[0], la[1] + 1, 3, 2.8), K, { b: 3, sh: 0 });
      P.part(P.ell(ra[0], ra[1] + 1, 3, 2.8), K, { b: 3, sh: 0 });
      if (act === 'point') P.part(P.cap(ra[0], ra[1], ra[0] + 0.6, ra[1] - 8, 1.3), K, { b: 3, sh: 0 });
      if (headless) {
        P.part(P.rect(lean - 3, -60, 6, 5), C.oak, { b: 3, sh: 0 });
        for (let i = 0; i < 4; i++) P.line(lean - 2.5 + (i % 2) * 5, -61 - i * 2.4, lean + 2.5 - (i % 2) * 5, -63.4 - i * 2.4, C.grey[4]);
        P.line(lean + 2, -60, lean + 8, -66, C.red[3]);
        P.line(lean - 2, -60, lean - 7, -64, C.yellow[3]);
        return;
      }
      P.part(P.rect(-3, -60, 6, 6), K, { b: 2, sh: 0 });
      presHead(P, 0, -71, o);
    },
    anim: o => o.act === 'wave' ? Math.floor((o.t || 0) * 6) % 4 : 0
  };

  function lincolnHead(P, x, y, o) {
    const M = C.cream;
    const rage = o.act === 'rage' || o.v === 'rage';
    P.part(P.ell(x - 9.4, y - 1, 1.9, 3.2), M, { b: 3, sh: 0 });
    P.part(P.ell(x + 9.4, y - 1, 1.9, 3.2), M, { b: 3, sh: 0 });
    P.part(P.ell(x - 8.4, y - 6.4, 2.8, 6), M, { b: 2, sh: 0 });
    P.part(P.ell(x + 8.4, y - 6.4, 2.8, 6), M, { b: 2, sh: 0 });
    P.part(P.path(`M ${x - 8.6} ${y + 1} Q ${x - 8.4} ${y + 12.6} ${x} ${y + 17} Q ${x + 8.4} ${y + 12.6} ${x + 8.6} ${y + 1} Z`), M, { b: 2 });
    P.part(P.path(`M ${x - 8} ${y - 12} Q ${x - 9.4} ${y - 2} ${x - 6.6} ${y + 7} Q ${x} ${y + 11.6} ${x + 6.6} ${y + 7} Q ${x + 9.4} ${y - 2} ${x + 8} ${y - 12} Z`), M, { b: 3 });
    for (let i = -2; i <= 2; i++) P.line(x + i * 2.8, y + 10.6 - Math.abs(i) * 0.8, x + i * 2.6, y + 14.4 - Math.abs(i) * 1.2, M[1]);
    P.part(P.poly([x - 7.2, y - 7.6, x - 1.4, y - 6.2, x - 1.4, y - 4.8, x - 7.2, y - 5.8]), M, { b: 1, sh: 0, hi: 0, ol: 0 });
    P.part(P.poly([x + 7.2, y - 7.6, x + 1.4, y - 6.2, x + 1.4, y - 4.8, x + 7.2, y - 5.8]), M, { b: 1, sh: 0, hi: 0, ol: 0 });
    for (const ex of [-3.8, 3.8]) {
      if (rage) {
        P.part(P.ell(x + ex, y - 3.2, 2.5, 1.9), LAMP, { sh: 0, hi: 0 });
        P.px(x + ex, y - 3.2, C.cycle[(o.anim || 0) * 3 % 8]);
      } else {
        P.part(P.ell(x + ex, y - 3.2, 2.3, 1.6), M, { b: 1, sh: 0, hi: 0 });
        if (!o.blink) P.px(x + ex, y - 3.2, M[0]);
      }
    }
    P.part(P.poly([x - 1, y - 5, x + 2.6, y + 2.2, x - 1.8, y + 2.8]), M, { b: 3, sh: 0, hi: 1, ol: M[1] });
    P.line(x - 5.4, y + 0.6, x - 4.2, y + 4.4, M[2]);
    P.line(x + 5.4, y + 0.6, x + 4.2, y + 4.4, M[2]);
    if (o.talk) P.part(P.rect(x - 3.2, y + 4.8, 6.4, 3.4), M, { b: 0, sh: 0, hi: 0 });
    else P.line(x - 3.2, y + 6, x + 3.2, y + 6, M[0]);
    P.part(P.path(`M ${x - 8.6} ${y - 12.6} L ${x - 9.6} ${y - 40} Q ${x} ${y - 43} ${x + 9.6} ${y - 40} L ${x + 8.6} ${y - 12.6} Z`), M, { b: 3 });
    P.part(P.rect(x - 8.8, y - 17.6, 17.6, 3.2), M, { b: 2, sh: 0, hi: 0 });
    P.part(P.ell(x, y - 12.6, 15.5, 3.2), M, { b: 3, sh: 1 });
    P.line(x - 5, y - 38, x - 4.4, y - 20, M[4]);
  }

  function sash(P, x0, y0, x1, y1, wd) {
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len * wd / 3, ny = dx / len * wd / 3;
    const ramps = [C.red, C.grey, C.blue];
    for (let i = 0; i < 3; i++) {
      const a = i - 1.5, b = i - 0.5;
      P.part(P.poly([x0 + nx * a, y0 + ny * a, x1 + nx * a, y1 + ny * a, x1 + nx * b, y1 + ny * b, x0 + nx * b, y0 + ny * b]), ramps[i], { b: i === 1 ? 5 : 3, sh: 0, hi: 0, ol: 0 });
    }
  }

  COSTUMES.lincoln = {
    h: 152, w: 70,
    draw(P, o) {
      const act = o.act || '';
      const M = C.cream;
      const back = o.dir === 'n';
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      const lift = o.walk >= 0 ? Math.max(0, Math.cos(o.walk * TAU)) * 5 : 0;
      P.part(P.cap(-10, -46, -11 - w * 5, -5 - (w > 0 ? lift : 0), 8, 6.6), M, { b: 2, sh: 1 });
      P.part(P.cap(10, -46, 11 + w * 5, -5 - (w < 0 ? lift : 0), 8, 6.6), M, { b: 3, sh: 1 });
      P.part(P.ell(-13 - w * 5, -2.6 - (w > 0 ? lift : 0), 10, 4), M, { b: 2, sh: 1 });
      P.part(P.ell(13 + w * 5, -2.6 - (w < 0 ? lift : 0), 10, 4), M, { b: 2, sh: 1 });
      const coat = P.path('M -24 -93 Q -30 -66 -23 -36 L 23 -36 Q 30 -66 24 -93 Q 0 -99 -24 -93 Z');
      P.part(coat, M, { b: 3 });
      let la = [-31, -54], ra = [31, -54];
      if (act === 'lapel' || act === 'read') ra = [11, -74];
      if (act === 'point') ra = [48, -98];
      if (act === 'rage') { la = [-42, -120]; ra = [42, -120]; }
      if (act === 'grab') { la = [-16, -66]; ra = [16, -66]; }
      const arm = (sx, a, b) => {
        if (act === 'lapel' || act === 'read') {
          if (sx > 0) { P.part(P.cap(sx, -88, 29, -70, 6.6, 5.6), M, { b: 3, sh: 1 }); P.part(P.cap(29, -70, a[0], a[1], 5.6, 5), M, { b: 3, sh: 1 }); }
          else P.part(P.cap(sx, -88, a[0], a[1], 6.6, 5.4), M, { b: b, sh: 1 });
        } else P.part(P.cap(sx, -88, a[0], a[1], 6.6, 5.4), M, { b: b, sh: 1 });
        P.part(P.ell(a[0], a[1] + 2, 5, 5.4), M, { b: 3, sh: 1 });
      };
      if (back) {
        P.line(0, -92, 0, -38, M[1]);
        P.part(P.poly([-6, -60, 0, -64, 6, -60, 6, -38, -6, -38]), M, { b: 2, sh: 0, hi: 0, ol: M[1] });
        arm(-24, la, 2);
        arm(24, ra, 3);
        if (o.v === 'beacon') {
          P.part(P.rect(-4, -80, 8, 7), C.olive, { b: 2 });
          P.part(P.ell(0, -82, 2.2, 2.2), [C.neonA, C.neonA, C.neonA, C.neonA, C.neonA], { sh: 0, hi: 0 });
        }
        P.part(P.ell(0, -106, 9, 10), M, { b: 2 });
        P.part(P.path('M -8.6 -118.6 L -9.6 -146 Q 0 -149 9.6 -146 L 8.6 -118.6 Z'), M, { b: 3 });
        P.part(P.rect(-8.8, -123.6, 17.6, 3.2), M, { b: 2, sh: 0, hi: 0 });
        P.part(P.ell(0, -118.6, 15.5, 3.2), M, { b: 3, sh: 1 });
        return;
      }
      P.line(0, -84, 0, -38, M[1]);
      for (const by of [-74, -62, -50]) P.part(P.ell(2.4, by, 1.4, 1.4), M, { b: 2, sh: 0, hi: 0 });
      P.part(P.poly([-8, -95, 0, -78, -4, -70, -13, -89]), M, { b: 4, sh: 1 });
      P.part(P.poly([8, -95, 0, -78, 4, -70, 13, -89]), M, { b: 4, sh: 1 });
      P.part(P.poly([-5.4, -97, 0, -94.4, 5.4, -97, 5.4, -91, 0, -93.6, -5.4, -91]), M, { b: 1, sh: 0 });
      if (o.v !== 'bare') sash(P, -23, -88, 23, -46, 13);
      arm(-24, la, 3);
      arm(24, ra, 3);
      if (act === 'rage') for (const s of [-1, 1]) for (let k = 0; k < 3; k++) P.line(s * 4, -109, s * (24 + k * 12), -60 + k * 8, k % 2 ? C.lamp : C.yellow[3]);
      lincolnHead(P, 0, -106, o);
    },
    anim: o => o.act === 'rage' ? Math.floor((o.t || 0) * 6) % 2 : 0
  };

  function starShape(P, cx, cy, r1, r2, ramp, b) {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1; pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    return P.part(P.poly(pts), ramp, { b: b === undefined ? 3 : b, sh: 0, hi: 0 });
  }

  function boscovHead(P, x, y, o) {
    S.art.boscoHead(P, x, y, o);
    P.part(P.path(`M ${x - 8.6} ${y + 5} Q ${x - 4} ${y + 2.8} ${x} ${y + 4.8} Q ${x + 4} ${y + 2.8} ${x + 8.6} ${y + 5} Q ${x + 10} ${y + 8.4} ${x + 5} ${y + 7.6} Q ${x} ${y + 6.8} ${x - 5} ${y + 7.6} Q ${x - 10} ${y + 8.4} ${x - 8.6} ${y + 5} Z`), C.night, { b: 0, sh: 0, hi: 1 });
    const F = C.asphalt;
    for (const s of [-1, 1]) P.part(P.path(`M ${x + s * 8.4} ${y - 6} L ${x + s * 12.4} ${y - 6} Q ${x + s * 13.6} ${y + 3} ${x + s * 11.2} ${y + 7.6} Q ${x + s * 9} ${y + 7} ${x + s * 8.6} ${y + 1} Z`), F, { b: 2, sh: 1 });
    P.part(P.path(`M ${x - 11.6} ${y - 5} L ${x - 10.4} ${y - 16.6} Q ${x} ${y - 19.4} ${x + 10.4} ${y - 16.6} L ${x + 11.6} ${y - 5} Q ${x} ${y - 8} ${x - 11.6} ${y - 5} Z`), F, { b: 1 });
    P.part(P.path(`M ${x - 12.2} ${y - 4.4} Q ${x} ${y - 7.6} ${x + 12.2} ${y - 4.4} L ${x + 11.6} ${y - 10.4} Q ${x} ${y - 13.4} ${x - 11.6} ${y - 10.4} Z`), F, { b: 3, sh: 1 });
    for (let i = -4; i <= 4; i++) P.px(x + i * 2.4, y - 7.4 - (i % 2 ? 1.4 : 0), F[4]);
    starShape(P, x, y - 9.4, 3, 1.3, C.red, 3);
  }

  COSTUMES.boscov = {
    h: 88, w: 44,
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
      starShape(P, -9, -44, 2.6, 1.1, C.red, 3);
      P.part(P.rect(-4, -56, 8, 5), K, { b: 2, sh: 0 });
      const arm = (sx, ex, ey) => {
        P.part(P.cap(sx, -49, (sx + ex) / 2, (-49 + ey) / 2, 3.8, 3.4), C.grey, { b: 4, sh: 1 });
        P.part(P.cap((sx + ex) / 2, (-49 + ey) / 2, ex, ey, 3.2, 2.8), K, { b: 3, sh: 1 });
        P.part(P.ell(ex, ey + 1, 3.4, 3), K, { b: 3, sh: 1 });
      };
      if (act === 'up') { arm(-15, -22, -84); arm(15, 22, -84); }
      else if (act === 'give') { arm(-15, -30, -40); arm(15, 19, -29); }
      else if (act === 'point') { arm(-15, -19, -29); arm(15, 24, -64); }
      else if (act === 'shrug') { arm(-15, -24, -48); arm(15, 24, -48); }
      else if (act === 'salute') { arm(-15, -19, -29); arm(15, 13, -74); }
      else { arm(-15, -19, -29); arm(15, 19, -29); }
      boscovHead(P, 0, -66, o);
    }
  };

  COSTUMES.sybil4 = {
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
      if (o.v === 'heart') P.part(P.path('M -4 -47.6 L -6.8 -50.4 Q -6.8 -52.6 -5.2 -52.6 Q -4.4 -52.6 -4 -51.6 Q -3.6 -52.6 -2.8 -52.6 Q -1.2 -52.6 -1.2 -50.4 Z'), C.red, { b: 3, sh: 0, hi: 0 });
      let lx = -11, ly = -37, rx = 11, ry = -37;
      if (act === 'shock') { lx = -12; ly = -66; rx = 12; ry = -66; }
      if (act === 'swoon') { lx = -3; ly = -48; rx = 4; ry = -49; }
      if (act === 'cry') { lx = -4; ly = -66; rx = 4; ry = -66; }
      if (act === 'scan' || act === 'point') { rx = 20; ry = -50; }
      if (act === 'phone') { rx = 8; ry = -68; }
      P.part(P.cap(-7.5, -54, lx, ly, 1.9, 1.6), C.skin, { b: 3, sh: 0 });
      P.part(P.cap(7.5, -54, rx, ry, 1.9, 1.6), C.skin, { b: 3, sh: 0 });
      P.part(P.cap(0, -56, 0, -62, 2.2), C.skin, { b: 3, sh: 0 });
      S.art.sybilHead(P, 0, -69, act === 'cry' ? Object.assign({}, o, { blink: true }) : o);
      if (act === 'cry') for (const s of [-1, 1]) { P.line(s * 5.4, -66, s * 6.2, -60, C.sky[3]); P.px(s * 6.4, -58.6, C.sky[4]); }
      if (act === 'scan') {
        P.part(P.poly([rx, ry - 3.6, rx + 9, ry - 5, rx + 9, ry - 1.4, rx + 3, ry, rx + 2.4, ry + 4, rx - 0.6, ry + 4]), C.teal, { b: 3 });
        P.px(rx + 9.6, ry - 3.2, C.neonB);
      }
      if (act === 'phone') P.part(P.cap(rx + 1, ry - 4, rx + 2, ry + 5, 1.6), C.pink, { b: 3, sh: 0 });
    }
  };

  function portrait(id) {
    const b = new S.Buf(24, 20);
    const put = (fn, x, y, s) => fn(new S.Pen(b).at(x, y, s));
    if (id === 'superball') put(P => superballHead(P, 0, 0, {}), 12, 13, 0.62);
    else if (id === 'agentc') put(P => chucklesHead(P, 0, 0, {}), 12, 12, 0.66);
    else if (id === 'pres') put(P => presHead(P, 0, 0, { t: 0.4 }), 12, 12, 0.66);
    else if (id === 'lincoln') put(P => lincolnHead(P, 0, 0, {}), 12, 12, 0.56);
    else if (id === 'boscov') put(P => boscovHead(P, 0, 0, {}), 12, 13, 0.6);
    return b;
  }

  S.art104 = { shades, superballHead, chucklesHead, presHead, lincolnHead, boscovHead, starShape, sash, suit, sleeve, portrait, LAMP };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
