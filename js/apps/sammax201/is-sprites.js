(function (S) {
  'use strict';
  const { C } = S;
  const COSTUMES = S.COSTUMES;
  const TAU = Math.PI * 2;

  function blitSprite(P, id, pose, dy) {
    const s = Math.abs(P.sx);
    const spr = S.sprite(id, pose, s);
    const x = Math.round(P.ox - spr.ox), y = Math.round(P.oy - spr.oy) + (dy || 0);
    S.blit(P.b, spr.buf, x, y);
    return { x, y, w: spr.buf.w, h: spr.buf.h };
  }

  function retint(b, r, from, to) {
    for (let y = Math.max(0, r.y); y < Math.min(b.h, r.y + r.h); y++) for (let x = Math.max(0, r.x); x < Math.min(b.w, r.x + r.w); x++) {
      const i = y * b.w + x;
      const k = from.indexOf(b.px[i]);
      if (k >= 0) b.px[i] = to[Math.min(to.length - 1, k)];
    }
  }

  function ghostly(b, r, keep) {
    for (let y = Math.max(0, r.y); y < Math.min(b.h, r.y + r.h); y++) for (let x = Math.max(0, r.x); x < Math.min(b.w, r.x + r.w); x++) {
      const i = y * b.w + x;
      if (!b.px[i] || b.px[i] === C.black) continue;
      if (y > r.y + r.h * keep && (x + y) % 2 === 0) b.px[i] = 0;
    }
  }

  function santaHead(P, x, y, o) {
    const K = C.skin, Wt = C.grey;
    const evil = o.v === 'evil';
    P.part(P.ell(x, y, 7.4, 7.6), K, { b: 3 });
    P.part(P.path(`M ${x - 8} ${y - 1} Q ${x - 11} ${y + 12} ${x - 2} ${y + 21} Q ${x + 4} ${y + 24} ${x + 9} ${y + 16} Q ${x + 12} ${y + 6} ${x + 8} ${y - 1} Q ${x} ${y + 5} ${x - 8} ${y - 1} Z`), Wt, { b: 5 });
    for (let i = 0; i < 6; i++) P.curve(`M ${x - 6 + i * 2.6} ${y + 6} Q ${x - 7 + i * 2.6} ${y + 12} ${x - 5 + i * 2.4} ${y + 17}`, Wt[3]);
    P.part(P.path(`M ${x - 7} ${y + 3} Q ${x} ${y + 1} ${x + 7} ${y + 3} Q ${x + 4} ${y + 6.4} ${x} ${y + 4.4} Q ${x - 4} ${y + 6.4} ${x - 7} ${y + 3} Z`), Wt, { b: 4, sh: 0 });
    P.part(P.ell(x, y + 1, 2.2, 1.9), C.red, { b: 3, sh: 0 });
    if (o.talk) P.part(P.ell(x, y + 7.6, 2.4, 1.6), evil ? C.slime : C.red, { b: 1, sh: 0, hi: 0 });
    for (const ex of [-3, 3]) {
      if (evil) { P.part(P.ell(x + ex, y - 2.4, 1.6, 1.4), C.slime, { b: 4, sh: 0, hi: 0, ol: 0 }); P.px(x + ex, y - 2.4, C.neonB); }
      else if (o.blink) P.line(x + ex - 1.4, y - 2.2, x + ex + 1.4, y - 2.2, C.black);
      else P.px(x + ex, y - 2.2, C.pupil);
      S.outline(P.b, P.ell(x + ex, y - 2.3, 2.4, 2.2), C.gold[3]);
      P.line(x + ex - 2.4, y - 5.6, x + ex + 2.4, y - 5 + (evil ? (ex < 0 ? 1.4 : -1.4) : 0), Wt[5]);
    }
    if (evil) { P.line(x - 1, y + 6, x - 1.6, y + 12, C.slime[3]); P.px(x - 1.6, y + 13, C.slime[4]); }
    P.part(P.path(`M ${x - 8} ${y - 5} Q ${x - 4} ${y - 16} ${x + 4} ${y - 15} Q ${x + 12} ${y - 13} ${x + 15} ${y - 4} L ${x + 11} ${y - 5} Q ${x + 8} ${y - 10} ${x + 3} ${y - 9} L ${x + 8} ${y - 5} Z`), C.red, { b: 3 });
    P.part(P.cap(x - 9, y - 5, x + 9, y - 5, 2.2), Wt, { b: 5, sh: 0 });
    P.part(P.ell(x + 15, y - 3, 2.6, 2.6), Wt, { b: 5, sh: 0 });
  }

  function gun(P, x, y) {
    P.part(P.poly([x, y - 2, x + 16, y - 2, x + 16, y + 1, x + 6, y + 1, x + 5, y + 6, x + 2, y + 6, x + 1, y + 1, x, y + 1]), C.grey, { b: 1 });
    P.part(P.rect(x + 7, y + 1, 2.4, 6), C.grey, { b: 1, sh: 0 });
    P.px(x + 16, y - 1, C.grey[3]);
  }

  COSTUMES.santa21 = {
    h: 86, w: 44,
    draw(P, o) {
      const act = o.act || '';
      const R = C.red, Wt = C.grey;
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      const side = o.dir === 'e' || o.dir === 'w';
      P.part(P.cap(-5 - w * 2, -18, -6 - w * 4, -4, 4, 3.4), R, { b: 2, sh: 1 });
      P.part(P.cap(5 + w * 2, -18, 6 + w * 4, -4, 4, 3.4), R, { b: 3, sh: 1 });
      P.part(P.ell(-5 - w * 4, -2, 6, 3), C.night, { b: 1 });
      P.part(P.ell(7 + w * 4, -2, 6, 3), C.night, { b: 1 });
      P.part(P.ell(0, -36, 17, 20), R, { b: 3 });
      P.part(P.rect(-16, -31, 32, 4), C.night, { b: 1, sh: 0 });
      P.part(P.rect(-3, -32, 6, 6), C.gold, { b: 3, sh: 0 });
      P.part(P.rect(-17, -18, 34, 4), Wt, { b: 5, sh: 0 });
      if (!side) P.part(P.rect(-2, -54, 4, 23), Wt, { b: 5, sh: 0 });
      else P.part(P.rect(8, -52, 3.6, 21), Wt, { b: 5, sh: 0 });
      let la = [-16, -22], ra = [16, -22];
      if (act === 'shoot') ra = [18, -40];
      if (act === 'up') { la = [-16, -66]; ra = [16, -66]; }
      if (act === 'eat') ra = [8, -54];
      if (act === 'point') ra = [24, -50];
      if (act === 'shake') { la = [-20, -46 + Math.sin((o.t || 0) * 20) * 3]; ra = [20, -46 - Math.sin((o.t || 0) * 20) * 3]; }
      P.part(P.cap(-13, -48, la[0], la[1], 3.6, 3), R, { b: 2, sh: 1 });
      P.part(P.ell(la[0], la[1] + 1.4, 3.6, 3.2), C.night, { b: 1, sh: 0 });
      P.part(P.cap(13, -48, ra[0], ra[1], 3.6, 3), R, { b: 3, sh: 1 });
      P.part(P.ell(ra[0], ra[1] + 1.4, 3.6, 3.2), C.night, { b: 1, sh: 0 });
      if (act === 'shoot') { gun(P, ra[0] - 2, ra[1]); if (Math.floor((o.t || 0) * 12) % 2) for (let i = 0; i < 3; i++) P.line(ra[0] + 15, ra[1] - 1, ra[0] + 20 + i * 2, ra[1] - 3 + i * 2, C.lamp); }
      else if (act !== 'up' && act !== 'eat') gun(P, la[0] - 14, la[1] - 1);
      if (act === 'eat') { P.part(P.ell(ra[0] + 2, ra[1] - 2, 6, 1.8), C.grey, { b: 4 }); P.part(P.ell(ra[0] + 2, ra[1] - 3.4, 4, 2), C.slime, { b: 3, sh: 0 }); }
      santaHead(P, side ? 3 : 0, -66, o);
    },
    anim: o => (o.act === 'shoot' || o.act === 'shake' ? Math.floor((o.t || 0) * 12) % 2 : 0)
  };

  const ELF = { red: { coat: C.red, hat: C.red, legs: C.grey }, green: { coat: C.green, hat: C.green, legs: C.red } };

  COSTUMES.elf21 = {
    h: 44, w: 26,
    draw(P, o) {
      const act = o.act || '';
      const T = ELF[o.v] || ELF.green;
      if (act === 'faint') {
        P.part(P.ell(0, -4, 14, 4.4), T.coat, { b: 3 });
        P.part(P.ell(-15, -5, 5.4, 5), C.skin, { b: 3 });
        P.part(P.poly([-19, -8, -26, -14, -18, -3]), T.hat, { b: 3 });
        P.line(-16.6, -6.6, -14.6, -4.6, C.black); P.line(-16.6, -4.6, -14.6, -6.6, C.black);
        P.part(P.cap(12, -3, 20, -2, 1.8), T.legs, { b: 3, sh: 0 });
        return;
      }
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      P.part(P.cap(-2.6, -12, -3 - w * 2, -2, 1.9, 1.6), T.legs, { b: 3, sh: 0 });
      P.part(P.cap(2.6, -12, 3 + w * 2, -2, 1.9, 1.6), T.legs, { b: 4, sh: 0 });
      P.part(P.path(`M ${-6 - w * 2} -1 L ${-1 - w * 2} -2 L ${0 - w * 2} 0 Q ${-6 - w * 2} 1 ${-8 - w * 2} -3 Z`), C.wood, { b: 3, sh: 0 });
      P.part(P.path(`M ${1 + w * 2} -2 L ${6 + w * 2} -1 L ${8 + w * 2} -3 Q ${6 + w * 2} 1 ${0 + w * 2} 0 Z`), C.wood, { b: 3, sh: 0 });
      P.part(P.path('M -7 -26 Q -9 -18 -8 -11 L 8 -11 Q 9 -18 7 -26 Z'), T.coat, { b: 3 });
      for (let i = -7; i <= 7; i += 3.5) P.part(P.poly([i - 1.8, -11.4, i + 1.8, -11.4, i, -8.6]), T.coat, { b: 2, sh: 0, hi: 0 });
      P.part(P.rect(-7.4, -18, 14.8, 2), C.night, { b: 1, sh: 0 });
      P.px(0, -17, C.gold[3]);
      let la = [-9, -16], ra = [9, -16];
      if (act === 'scared') { la = [-10, -32]; ra = [10, -32]; }
      if (act === 'point') ra = [14, -24];
      if (act === 'work') { la = [-6, -19 + Math.sin((o.t || 0) * 12) * 1.6]; ra = [6, -19 - Math.sin((o.t || 0) * 12) * 1.6]; }
      if (act === 'cry') { la = [-3, -30]; ra = [3, -30]; }
      P.part(P.cap(-5.6, -24, la[0], la[1], 1.7, 1.4), T.coat, { b: 2, sh: 0 });
      P.part(P.cap(5.6, -24, ra[0], ra[1], 1.7, 1.4), T.coat, { b: 3, sh: 0 });
      P.part(P.ell(la[0], la[1], 1.8, 1.8), C.skin, { b: 3, sh: 0 });
      P.part(P.ell(ra[0], ra[1], 1.8, 1.8), C.skin, { b: 3, sh: 0 });
      if (o.v === 'red' && act !== 'scared' && act !== 'cry') { P.part(P.rect(ra[0] - 1, ra[1] - 6, 6, 8), C.oak, { b: 3, sh: 0 }); P.part(P.rect(ra[0], ra[1] - 5, 4, 6), C.grey, { b: 5, sh: 0, hi: 0 }); }
      P.part(P.ell(0, -31, 5.6, 5.4), C.skin, { b: 3 });
      P.part(P.poly([-5, -32, -10, -36, -5.4, -29]), C.skin, { b: 3, sh: 0 });
      P.part(P.poly([5, -32, 10, -36, 5.4, -29]), C.skin, { b: 3, sh: 0 });
      P.part(P.ell(-2.6, -28.6, 1.4, 1), C.rose, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(2.6, -28.6, 1.4, 1), C.rose, { b: 3, sh: 0, hi: 0, ol: 0 });
      for (const ex of [-2, 2]) {
        if (o.blink || act === 'cry') P.line(ex - 1, -32, ex + 1, -32, C.black);
        else { P.px(ex, -32, C.pupil); P.px(ex, -31, C.pupil); }
      }
      if (o.talk) P.part(P.ell(0, -27.6, 1.6, 1.1), C.red, { b: 1, sh: 0, hi: 0 });
      else if (act === 'scared') P.part(P.ell(0, -27.4, 1.4, 1.6), C.night, { b: 0, sh: 0, hi: 0 });
      else P.curve('M -1.6 -28 Q 0 -26.8 1.6 -28', C.black);
      if (act === 'cry') for (const ex of [-2.4, 2.4]) { P.line(ex, -31, ex + (ex < 0 ? -1 : 1), -24, C.sky[3]); P.px(ex + (ex < 0 ? -1.4 : 1.4), -22.6, C.sky[4]); }
      const sw = Math.sin((o.t || 0) * 3) * 1.6;
      P.part(P.path(`M -6 -34 Q -2 -44 ${6 + sw} -46 L ${9 + sw} -44 Q 2 -42 6 -34 Z`), T.hat, { b: 3 });
      P.part(P.cap(-6.4, -34, 6.4, -34, 1.5), C.grey, { b: 5, sh: 0 });
      P.part(P.ell(9 + sw, -44.6, 1.8, 1.8), C.gold, { b: 4, sh: 0 });
    },
    anim: o => (o.act === 'work' ? Math.floor((o.t || 0) * 8) % 4 : Math.floor((o.t || 0) * 2) % 3)
  };

  COSTUMES.demon21 = {
    h: 56, w: 50,
    draw(P, o) {
      const k = o.anim || 0;
      const wob = Math.sin(k * TAU / 6) * 1.6;
      const B = C.sky;
      P.part(P.path(`M -22 -2 Q -26 -16 -18 ${-30 - wob} Q -12 ${-46 + wob} 0 -48 Q ${12 - wob} ${-47} 18 ${-34 + wob} Q 26 -18 22 -2 Q 12 2 0 0 Q -12 2 -22 -2 Z`), B, { b: 3 });
      for (let i = 0; i < 5; i++) { const x = -16 + i * 8; P.part(P.ell(x, -2 + ((i + k) % 2), 3, 2.4), B, { b: 2, sh: 0 }); }
      S.light(P.b, P.ell(-8, -36, 7, 5), 0.8);
      for (const [x, y] of [[-12, -18], [9, -12], [3, -30], [-4, -10]]) P.part(P.ell(x, y + ((k + x) % 3) * 0.4, 1.4, 1.4), B, { b: 4, sh: 0, hi: 0, ol: B[2] });
      for (const ex of [-7, 7]) { P.part(P.ell(ex, -32, 4, 3.6), C.yellow, { b: 4, sh: 0 }); P.part(P.ell(ex + (o.dir === 'w' ? -1 : 1), -32, 1.4, 2), C.red, { b: 2, sh: 0, hi: 0, ol: 0 }); }
      P.part(P.path(o.talk ? 'M -8 -22 Q 0 -14 8 -22 Q 0 -18 -8 -22 Z' : 'M -7 -21 Q 0 -18 7 -21 Q 0 -19 -7 -21 Z'), C.navy, { b: 0, sh: 0, hi: 0 });
      P.part(P.poly([-2.4, -14, 2.4, -14, 3.6, -4, 0, -1, -3.6, -4]), C.red, { b: 2, sh: 0 });
      P.part(P.poly([-3.4, -16, 3.4, -16, 2.4, -13, -2.4, -13]), C.red, { b: 3, sh: 0 });
    },
    anim: o => Math.floor((o.t || 0) * 6) % 6
  };

  const GHOST = {
    past: { robe: C.pink, glow: C.orchid },
    present: { robe: C.gold, glow: C.cream },
    future: { robe: C.stone, glow: C.night }
  };

  COSTUMES.ghost21 = {
    h: 80, w: 40,
    draw(P, o) {
      const G = GHOST[o.v] || GHOST.past;
      const k = o.anim || 0;
      const fy = -8 - Math.sin(k * TAU / 8) * 3;
      const b = P.b;
      const x0 = Math.round(P.ox - 24), y0 = Math.round(P.oy - 96);
      if (o.v === 'future') {
        P.part(P.path(`M -13 ${fy - 4} Q -16 ${fy - 40} -9 ${fy - 62} Q 0 ${fy - 74} 9 ${fy - 62} Q 16 ${fy - 40} 13 ${fy - 4} Q 6 ${fy + 2} 0 ${fy - 4} Q -6 ${fy + 2} -13 ${fy - 4} Z`), G.robe, { b: 1 });
        P.part(P.ell(0, fy - 56, 6.4, 7), C.night, { b: 0, sh: 0, hi: 0 });
        for (const ex of [-2.4, 2.4]) P.px(ex, fy - 57, C.lamp);
        const nod = o.act === 'nod' ? Math.round(Math.sin((o.t || 0) * 12)) : o.act === 'shake' ? 0 : 0;
        if (o.act === 'shake') P.px(Math.round(Math.sin((o.t || 0) * 14) * 2), fy - 66, C.grey[3]);
        if (nod) P.px(0, fy - 66 + nod, C.grey[3]);
        P.part(P.cap(9, fy - 44, 16, fy - 30, 2.4, 2), G.robe, { b: 2, sh: 0 });
      } else {
        P.part(P.path(`M -14 ${fy - 14} Q -17 ${fy - 34} -11 ${fy - 46} Q 0 ${fy - 52} 11 ${fy - 46} Q 17 ${fy - 34} 14 ${fy - 14} Q 8 ${fy - 2} 2 ${fy + 4} Q -2 ${fy - 2} -6 ${fy + 2} Q -10 ${fy - 6} -14 ${fy - 14} Z`), G.robe, { b: 3 });
        P.part(P.rect(-14, fy - 26, 28, 3), G.glow, { b: 4, sh: 0 });
        santaHead(P, 0, fy - 56, { blink: o.blink, talk: o.talk });
        if (o.v === 'past') {
          for (let i = -3; i <= 3; i++) P.part(P.ell(i * 3.4, fy - 67 + Math.abs(i) * 0.8, 1.7, 1.7), i % 2 ? C.yellow : C.pink, { b: 4, sh: 0, hi: 0 });
          P.part(P.ell(0, fy - 18, 4, 4), G.glow, { b: 4, sh: 0 });
          P.line(0, fy - 22, 0, fy - 14, C.plum[1]); P.line(0, fy - 18, -2.6, fy - 15, C.plum[1]); P.line(0, fy - 18, 2.6, fy - 15, C.plum[1]);
        } else {
          P.part(P.ell(10, fy - 22, 3, 3), C.gold, { b: 4 });
          P.line(10, fy - 22, 10, fy - 24, C.black); P.line(10, fy - 22, 11.4, fy - 22, C.black);
          P.curve(`M 7 ${fy - 26} Q 2 ${fy - 32} -4 ${fy - 28}`, C.gold[3]);
        }
        P.part(P.cap(-11, fy - 40, -16, fy - 26, 2.6, 2.2), G.robe, { b: 2, sh: 0 });
        P.part(P.cap(11, fy - 40, o.act === 'point' ? 22 : 16, o.act === 'point' ? fy - 46 : fy - 26, 2.6, 2.2), G.robe, { b: 3, sh: 0 });
      }
      ghostly(b, { x: x0, y: y0, w: 48, h: 104 }, 0.62);
    },
    anim: o => Math.floor((o.t || 0) * 4) % 8
  };

  function stinkyHead(P, x, y, o) {
    const K = C.pale;
    P.part(P.path(`M ${x - 9} ${y + 6} Q ${x - 13} ${y - 8} ${x - 6} ${y - 13} Q ${x} ${y - 17} ${x + 7} ${y - 13} Q ${x + 13} ${y - 7} ${x + 10} ${y + 6} Q ${x + 5} ${y + 2} ${x} ${y + 2} Q ${x - 5} ${y + 2} ${x - 9} ${y + 6} Z`), C.teal, { b: 3 });
    P.part(P.ell(x, y - 1, 5.6, 7), K, { b: 3 });
    P.part(P.path(`M ${x - 6} ${y - 4} Q ${x - 2} ${y - 10} ${x + 6} ${y - 6} Q ${x + 2} ${y - 9} ${x - 6} ${y - 4} Z`), C.teal, { b: 4, sh: 0 });
    for (const ex of [-2.4, 2.4]) {
      if (o.blink) P.line(x + ex - 1.2, y - 1.6, x + ex + 1.2, y - 1.6, C.black);
      else { P.px(x + ex, y - 1.6, C.teal[1]); P.px(x + ex, y - 0.6, C.teal[1]); P.line(x + ex - 1.2, y - 3, x + ex + 1.4, y - 3.4, C.black); }
    }
    P.part(P.ell(x, y + 3.4, o.talk ? 2.2 : 2, o.talk ? 1.4 : 0.8), C.rose, { b: 3, sh: 0, hi: 0 });
    P.part(P.poly([x - 4, y - 12, x - 3, y - 16, x - 1, y - 13, x, y - 17, x + 1, y - 13, x + 3, y - 16, x + 4, y - 12]), C.gold, { b: 4, sh: 0 });
    P.part(P.ell(x - 6, y + 2, 1.4, 1.6), C.pink, { b: 4, sh: 0, hi: 0 });
    P.part(P.ell(x + 6, y + 2, 1.4, 1.6), C.pink, { b: 4, sh: 0, hi: 0 });
  }

  COSTUMES.stinky21 = {
    h: 92, w: 34,
    draw(P, o) {
      const act = o.act || '';
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      P.part(P.cap(-3, -30, -3.6 - w * 2, -4, 2.6, 2), C.lilac, { b: 3, sh: 0 });
      P.part(P.cap(3, -30, 3.6 + w * 2, -4, 2.6, 2), C.lilac, { b: 4, sh: 0 });
      P.part(P.ell(-4.6 - w * 2, -2, 3.6, 2), C.purple, { b: 2, sh: 0 });
      P.part(P.ell(4.6 + w * 2, -2, 3.6, 2), C.purple, { b: 2, sh: 0 });
      P.part(P.path('M -8 -62 Q -10 -46 -8 -30 L 8 -30 Q 10 -46 8 -62 Z'), C.purple, { b: 3 });
      const apron = P.path('M -7 -56 L 7 -56 L 9 -26 Q 0 -22 -9 -26 Z');
      P.part(apron, C.teal, { b: 3 });
      apron.each((x, y) => { if (P.b.px[y * P.b.w + x] !== C.black && (y % 4 === 0) && ((x + (y >> 2)) % 3 === 0)) P.b.set(x, y, C.teal[4]); });
      P.part(P.path('M -4 -38 Q 0 -44 4 -38 Q 2 -34 0 -36 Q -2 -34 -4 -38 Z'), C.mint, { b: 3, sh: 0 });
      let la = [-11, -36], ra = [11, -36];
      if (act === 'phone') ra = [6, -76];
      if (act === 'point') ra = [18, -54];
      if (act === 'shrug') { la = [-14, -58]; ra = [14, -58]; }
      if (act === 'host') { la = [-6, -48]; ra = [6, -48]; }
      if (act === 'cheer') { la = [-12, -84]; ra = [12, -84]; }
      P.part(P.cap(-7, -60, la[0], la[1], 1.9, 1.5), C.pale, { b: 3, sh: 0 });
      P.part(P.cap(7, -60, ra[0], ra[1], 1.9, 1.5), C.pale, { b: 3, sh: 0 });
      P.part(P.ell(la[0], la[1] + 2, 1.6, 1), C.gold, { b: 3, sh: 0, hi: 0 });
      P.part(P.ell(ra[0], ra[1] + 2, 1.6, 1), C.gold, { b: 3, sh: 0, hi: 0 });
      if (act === 'phone') P.part(P.cap(ra[0] + 1, ra[1] - 4, ra[0] + 2, ra[1] + 5, 1.6), C.red, { b: 3, sh: 0 });
      if (act === 'host') P.part(P.rect(-4, -54, 8, 6), C.cream, { b: 4, sh: 0 });
      P.part(P.cap(0, -62, 0, -68, 2), C.pale, { b: 3, sh: 0 });
      for (let i = -3; i <= 3; i++) P.px(i * 1.4, -63 + Math.abs(i) * 0.4, i % 2 ? C.grey[5] : C.cream[4]);
      stinkyHead(P, 0, -76, o);
    }
  };

  function ratHead(P, x, y, o, R, extra) {
    P.part(P.ell(x, y, 4.6, 4.2), R, { b: 3 });
    P.part(P.ell(x - 3.4, y - 4, 2.4, 2.6), R, { b: 3 });
    P.part(P.ell(x + 3.4, y - 4, 2.4, 2.6), R, { b: 3 });
    P.part(P.ell(x - 3.4, y - 4, 1.2, 1.4), C.pink, { b: 3, sh: 0, hi: 0, ol: 0 });
    P.part(P.ell(x + 3.4, y - 4, 1.2, 1.4), C.pink, { b: 3, sh: 0, hi: 0, ol: 0 });
    P.part(P.path(`M ${x + 2} ${y - 1} L ${x + 9} ${y + 1} L ${x + 2} ${y + 3} Z`), R, { b: 3, sh: 0 });
    P.px(x + 9, y + 1, C.pink[3]);
    if (o.blink) P.line(x + 1, y - 1.4, x + 2.6, y - 1.4, C.black); else P.px(x + 2, y - 1.4, C.pupil);
    if (o.talk) P.px(x + 5, y + 2.6, C.red[1]);
    if (extra) extra(P, x, y);
  }

  COSTUMES.mary21 = {
    h: 28, w: 18,
    draw(P, o) {
      const act = o.act || '';
      const R = C.rat;
      P.part(P.cap(-4, -3, -12, -6, 1.1, 0.6), C.pink, { b: 2, sh: 0 });
      P.part(P.ell(0, -2, 5, 2.2), R, { b: 2 });
      P.part(P.path('M -5 -15 Q -7 -6 -5 -2 L 5 -2 Q 7 -6 5 -15 Z'), C.rose, { b: 3 });
      P.part(P.rect(-3, -13, 6, 10), C.cream, { b: 4, sh: 0 });
      const ra = act === 'nag' ? [8, -16] : act === 'hug' ? [5, -12] : [5, -8];
      P.part(P.cap(3, -13, ra[0], ra[1], 1.1), R, { b: 3, sh: 0 });
      ratHead(P, 1.5, -19, o, R, (Q, x, y) => {
        for (const dx of [-3, 0, 3]) Q.part(Q.cap(x + dx, y - 6, x + dx + 1.4, y - 5, 1.2), C.pink, { b: 4, sh: 0 });
        if (act === 'cry') { Q.line(x + 2, y, x + 2, y + 4, C.sky[3]); }
      });
    }
  };

  COSTUMES.yjimmy21 = {
    h: 30, w: 20,
    draw(P, o) {
      const act = o.act || '';
      const R = C.rat;
      const hop = act === 'cheer' ? -2 : 0;
      P.part(P.cap(-4, -3 + hop, -13, -7 + hop, 1.1, 0.6), C.pink, { b: 2, sh: 0 });
      P.part(P.ell(-1, -2 + hop, 4.4, 2.2), R, { b: 2 });
      P.part(P.ell(-0.6, -9 + hop, 4.6, 5.4), R, { b: 3 });
      P.part(P.rect(-4.6, -7 + hop, 9, 4), C.red, { b: 3, sh: 0 });
      P.line(-4.6, -6 + hop, 4.4, -6 + hop, C.grey[5]);
      const up = act === 'cheer' || act === 'punch';
      const pa = act === 'punch' ? [10, -12] : up ? [4, -22] : [5, -9];
      const pb = up && act === 'cheer' ? [-5, -22] : [-5, -9];
      P.part(P.cap(-3, -11 + hop, pb[0], pb[1] + hop, 1.1), R, { b: 3, sh: 0 });
      P.part(P.cap(2, -11 + hop, pa[0], pa[1] + hop, 1.1), R, { b: 3, sh: 0 });
      if (o.v === 'glove') P.part(P.ell(pa[0] + 1, pa[1] + hop, 3, 2.6), C.red, { b: 3 });
      else P.part(P.rect(pa[0] - 0.6, pa[1] - 2.6 + hop, 3, 3.6), C.grey, { b: 4, sh: 0 });
      ratHead(P, 2, -18 + hop, o, R);
    }
  };

  COSTUMES.timmy21 = {
    h: 14, w: 12,
    draw(P, o) {
      const R = C.rat;
      P.part(P.cap(-3, -2, -8, -4, 0.8, 0.5), C.pink, { b: 2, sh: 0 });
      P.part(P.ell(0, -3.6, 3.4, 3.4), R, { b: 3 });
      P.part(P.ell(0, -2.4, 3.6, 2.2), C.grey, { b: 5, sh: 0 });
      ratHead(P.scaled(0, -9, 0.7), 0.6, -9, o, R);
      if (o.act === 'swear') for (let i = 0; i < 3; i++) P.px(5 + i * 2, -14 - (i % 2), [C.neonA, C.lamp, C.neonA][i]);
    }
  };

  COSTUMES.pedro21 = {
    h: 76, w: 40,
    draw(P, o) {
      const act = o.act || '';
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      P.part(P.cap(-3, -24, -3.6 - w * 2, -3, 2.6, 2.2), C.night, { b: 2, sh: 0 });
      P.part(P.cap(3, -24, 3.6 + w * 2, -3, 2.6, 2.2), C.night, { b: 2, sh: 0 });
      for (let y = -22; y < -4; y += 4) { P.px(-5.6 - w * 2, y, C.grey[4]); P.px(5.6 + w * 2, y, C.grey[4]); }
      P.part(P.path('M -8 -48 Q -10 -36 -8 -24 L 8 -24 Q 10 -36 8 -48 Z'), C.night, { b: 2 });
      for (let y = -46; y < -26; y += 4) { P.px(-5, y, C.grey[5]); P.px(5, y, C.grey[5]); }
      P.part(P.poly([-2.4, -48, 2.4, -48, 0, -42]), C.grey, { b: 5, sh: 0, hi: 0 });
      P.part(P.poly([-3, -46, 3, -46, 2, -43, -2, -43]), C.red, { b: 3, sh: 0, hi: 0 });
      const strum = act === 'sing' ? Math.sin((o.t || 0) * 18) * 1.4 : 0;
      P.part(P.ell(4, -32, 7, 6, -0.5), C.oak, { b: 3 });
      P.part(P.ell(4, -32, 2, 2), C.night, { b: 0, sh: 0, hi: 0 });
      P.part(P.cap(-2, -40, -12, -52, 1.4), C.wood, { b: 2, sh: 0 });
      P.part(P.cap(-7, -46, 4, -34 + strum, 1.6, 1.4), C.night, { b: 2, sh: 0 });
      P.part(P.cap(7, -46, -9, -48, 1.6, 1.4), C.night, { b: 3, sh: 0 });
      P.part(P.ell(4, -34 + strum, 1.6, 1.6), C.skin, { b: 3, sh: 0 });
      P.part(P.ell(-9, -48, 1.6, 1.6), C.skin, { b: 3, sh: 0 });
      P.part(P.ell(0, -55, 5, 5.6), C.skin, { b: 3 });
      P.part(P.path('M -4 -52 Q 0 -54 4 -52 Q 2 -50 0 -51 Q -2 -50 -4 -52 Z'), C.night, { b: 1, sh: 0 });
      for (const ex of [-2, 2]) { if (o.blink) P.line(ex - 1, -57, ex + 1, -57, C.black); else P.px(ex, -57, C.pupil); }
      if (o.talk || act === 'sing') P.part(P.ell(0, -50, 1.8, 1.4), C.red, { b: 1, sh: 0, hi: 0 });
      P.part(P.ell(0, -61, 18, 3.4), C.gold, { b: 3 });
      P.part(P.path('M -7 -61 Q -6 -72 0 -73 Q 6 -72 7 -61 Z'), C.gold, { b: 3 });
      P.part(P.rect(-6.6, -64, 13.2, 2), C.red, { b: 3, sh: 0, hi: 0 });
    },
    anim: o => (o.act === 'sing' ? Math.floor((o.t || 0) * 8) % 4 : 0)
  };

  COSTUMES.fsam21 = {
    h: 68, w: 40,
    draw(P, o) {
      const r = blitSprite(P, 'sam', { dir: o.dir, walk: o.walk, talk: o.talk, blink: o.blink, act: o.act });
      retint(P.b, r, C.fur, [C.grey[1], C.grey[2], C.grey[3], C.grey[3], C.grey[4]]);
      retint(P.b, r, C.suit, [C.stone[0], C.stone[1], C.stone[2], C.stone[2], C.stone[3]]);
    }
  };

  COSTUMES.fmax21 = {
    h: 52, w: 26,
    draw(P, o) {
      blitSprite(P, 'max', { dir: o.dir, walk: o.walk, talk: o.talk, blink: o.blink, act: o.act });
      if (o.dir === 'n') return;
      const side = o.dir === 'e' || o.dir === 'w';
      const bx = side ? 6 : 0;
      P.part(P.path(`M ${bx - 6} -18 Q ${bx - 7} -6 ${bx} -2 Q ${bx + 7} -6 ${bx + 6} -18 Q ${bx} -14 ${bx - 6} -18 Z`), C.grey, { b: 4 });
      for (let i = 0; i < 3; i++) P.line(bx - 3 + i * 3, -14, bx - 3 + i * 3, -5, C.grey[2]);
      P.line(bx - 5, -32, bx - 1, -31, C.grey[3]);
      P.line(bx + 1, -31, bx + 5, -32, C.grey[3]);
    }
  };

  function portrait(id) {
    const b = new S.Buf(24, 20);
    const put = (fn, x, y, s) => fn(new S.Pen(b).at(x, y, s));
    const spr = (cos, pose, s, x, y) => { const sp = S.sprite(cos, pose, s); S.blit(b, sp.buf, Math.round(x - sp.ox), Math.round(y - sp.oy)); return sp; };
    if (id === 'santa') put(P => santaHead(P, 0, 0, {}), 11, 9, 0.62);
    else if (id === 'evil') put(P => santaHead(P, 0, 0, { v: 'evil' }), 11, 9, 0.62);
    else if (id === 'elfr') spr('elf21', { v: 'red', act: 'scared', dir: 's' }, 0.62, 12, 28);
    else if (id === 'elfg') spr('elf21', { v: 'green', dir: 's' }, 0.62, 12, 28);
    else if (id === 'demon') spr('demon21', { dir: 's' }, 0.4, 12, 19);
    else if (id === 'gpast' || id === 'gpres' || id === 'gfut') spr('ghost21', { v: { gpast: 'past', gpres: 'present', gfut: 'future' }[id], dir: 's' }, 0.28, 12, 22);
    else if (id === 'stinky') put(P => stinkyHead(P, 0, 0, {}), 12, 12, 0.72);
    else if (id === 'mary') spr('mary21', { dir: 'e' }, 0.95, 11, 19);
    else if (id === 'yjimmy') spr('yjimmy21', { dir: 'e', v: 'glove' }, 0.85, 11, 19);
    else if (id === 'timmy') spr('timmy21', { dir: 'e', act: 'swear' }, 1.2, 10, 18);
    else if (id === 'pedro') put(P => {
      P.part(P.ell(0, 2, 5, 5.6), C.skin, { b: 3 });
      P.part(P.ell(0, -4, 11, 2.4), C.gold, { b: 3 });
      P.part(P.path('M -5 -4 Q -4 -12 0 -12 Q 4 -12 5 -4 Z'), C.gold, { b: 3 });
      P.part(P.path('M -3.4 5 Q 0 3.6 3.4 5 Q 0 6 -3.4 5 Z'), C.night, { b: 1, sh: 0 });
      P.px(-1.8, 0.6, C.pupil); P.px(1.8, 0.6, C.pupil);
    }, 12, 10, 1.1);
    else if (id === 'bug') spr('roach', { dir: 'e' }, 1.2, 12, 16);
    else if (id === 'lincoln') put(P => S.art104.lincolnHead(P, 0, 0, {}), 12, 12, 0.5);
    else if (id === 'cops') { spr('copcurt', {}, 0.3, 6, 19); spr('copbob', {}, 0.3, 18, 19); spr('copchippy', {}, 0.3, 12, 11); }
    else if (id === 'fsam') { put(P => S.art.samHeadFront(P, 0, {}), 12, 38, 0.56); retint(b, { x: 0, y: 0, w: 24, h: 20 }, C.fur, [C.grey[1], C.grey[2], C.grey[3], C.grey[3], C.grey[4]]); }
    else if (id === 'fmax') { const sp = S.sprite('max', { act: 'head' }, 0.6); S.blit(b, sp.buf, 12 - sp.ox, 17 - sp.oy); put(P => { P.part(P.path('M -5 0 Q -6 7 0 9 Q 6 7 5 0 Q 0 3 -5 0 Z'), C.grey, { b: 4 }); }, 12, 10, 1); }
    return b;
  }

  S.art201 = { blitSprite, retint, ghostly, santaHead, stinkyHead, ratHead, gun, portrait };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
