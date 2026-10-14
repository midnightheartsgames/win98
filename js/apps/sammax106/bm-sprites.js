(function (S) {
  'use strict';
  const { C } = S;
  const COSTUMES = S.COSTUMES;
  const TAU = Math.PI * 2;
  const VICE = { red: C.red, green: C.slime, blue: C.sky };
  const RAINBOW = [C.red[3], C.orange[3], C.yellow[3], C.green[3], C.blue[3], C.purple[3]];

  function blitSprite(P, id, pose, dy) {
    const s = Math.abs(P.sx);
    const spr = S.sprite(id, pose, s);
    const x = Math.round(P.ox - spr.ox), y = Math.round(P.oy - spr.oy) + (dy || 0);
    S.blit(P.b, spr.buf, x, y);
    return { x, y, w: spr.buf.w, h: spr.buf.h };
  }

  function retint(b, r, ramp) {
    const from = C.maxw;
    for (let y = Math.max(0, r.y); y < Math.min(b.h, r.y + r.h); y++) for (let x = Math.max(0, r.x); x < Math.min(b.w, r.x + r.w); x++) {
      const i = y * b.w + x;
      const k = from.indexOf(b.px[i]);
      if (k >= 0) b.px[i] = ramp[k];
    }
  }

  function halo(P, x, y, w, k) {
    const cols = [C.red[3], C.yellow[3], C.sky[3]];
    for (let i = 0; i < 3; i++) {
      const r = w - i * 1.6;
      P.curve(`M ${x - r} ${y} Q ${x} ${y - r * 1.3} ${x + r} ${y}`, cols[(i + (k || 0)) % 3]);
    }
  }

  function calmEyes(P, xs, y, skin, b) {
    for (const ex of xs) {
      P.part(P.ell(ex, y, 2.7, 1.9), skin, { b: b === undefined ? 3 : b, sh: 0, hi: 0, ol: 0 });
      P.curve(`M ${ex - 2} ${y - 0.4} Q ${ex} ${y + 1.6} ${ex + 2} ${y - 0.4}`, C.black);
    }
  }

  COSTUMES.maxbliss6 = {
    h: 62, w: 28,
    draw(P, o) {
      const act = o.act === 'reach' || o.act === 'use' ? 'reach' : '';
      blitSprite(P, 'max', { dir: o.dir, walk: o.walk, talk: o.talk, blink: true, act });
      const cols = { r: C.red, g: C.slime, b: C.sky };
      const v = (o.v || '').split('').filter(ch => cols[ch]);
      const k = o.anim || 0;
      const hop = o.walk >= 0 ? -Math.abs(Math.sin(o.walk * TAU)) * 4 : 0;
      for (let i = 0; i < v.length; i++) {
        const a = k * TAU / 8 + i * TAU / Math.max(1, v.length);
        P.part(P.ell(Math.cos(a) * 11, -57 + hop + Math.sin(a) * 3, 1.6, 1.6), cols[v[i]], { b: 3, sh: 0, hi: 0 });
      }
      if (o.dir !== 'n') P.curve(`M -4 ${-61 + hop} Q 0 ${-64 + hop} 4 ${-61 + hop}`, C.lamp);
    },
    anim: o => Math.floor((o.t || 0) * 4) % 8
  };

  function slothBack(P, R) {
    P.part(P.path('M -22 -4 Q -31 -3 -37 -6 Q -39 -9 -35 -10 Q -28 -9 -21 -8 Z'), R, { b: 2, sh: 1 });
    P.part(P.path('M -20 -9 Q -29 -12 -34 -17 Q -34 -20 -30 -19 Q -25 -15 -19 -12 Z'), R, { b: 3, sh: 1 });
    P.part(P.ell(2, -6.5, 13, 6.5), R, { b: 3 });
    P.part(P.cap(10, -8, 18, -11, 2.3, 2), R, { b: 2, sh: 1 });
    P.part(P.ell(20.5, -11.5, 3.6, 2.4, -0.4), R, { b: 2, sh: 1 });
    P.part(P.cap(12, -5, 20, -4, 2.3, 2), R, { b: 3, sh: 1 });
    P.part(P.ell(22.5, -4, 3.6, 2.2), R, { b: 3, sh: 1 });
    P.part(P.cap(-2, -11, -4, -16, 1.8, 1.6), R, { b: 3, sh: 1 });
    P.part(P.ell(-14, -9, 9.5, 8), R, { b: 3 });
    for (const ex of [-17.5, -11]) { P.line(ex - 1.8, -11, ex + 1.8, -11, C.black); P.px(ex, -10, C.pupil); P.line(ex - 1.5, -8, ex + 1.5, -8, R[1]); }
    P.curve('M -19 -3.4 Q -14 -5.6 -9 -3.4', C.black);
  }

  function slothFront(P, R) {
    P.part(P.path('M -22 -3 Q -32 -2 -38 -4 Q -40 -7 -36 -8 Q -28 -7 -21 -7 Z'), R, { b: 2, sh: 1 });
    P.part(P.path('M -21 -6 Q -30 -8 -36 -12 Q -36 -15 -32 -14 Q -26 -11 -20 -9 Z'), R, { b: 3, sh: 1 });
    P.part(P.ell(-14, -6.5, 9.5, 6.5), R, { b: 2 });
    P.part(P.ell(2, -7.5, 13, 7.5), R, { b: 3 });
    P.part(P.cap(11, -5, 21, -3.4, 2.4, 2), R, { b: 2, sh: 1 });
    P.part(P.ell(23.5, -3, 3.8, 2), R, { b: 2, sh: 1 });
    P.part(P.cap(-4, -4, -9, -1.6, 1.8, 1.6), R, { b: 3, sh: 1 });
    P.part(P.ell(9, -15.5, 3.8, 3.4), C.maxw, { b: 3 });
    P.px(8, -17, C.maxw[4]);
  }

  COSTUMES.maxvice6 = {
    h: 60, w: 44,
    draw(P, o) {
      const v = o.v || 'red';
      const R = VICE[v] || C.red;
      const act = o.act || '';
      if (v === 'blue') { if (act === 'flipped') slothFront(P, R); else slothBack(P, R); return; }
      const hop = o.walk >= 0 ? -Math.abs(Math.sin(o.walk * TAU)) * 4 : 0;
      const side = o.dir === 'e' || o.dir === 'w';
      if (v === 'green') {
        const s = Math.abs(P.sx);
        const spr = S.sprite('max', { dir: o.dir, walk: o.walk, talk: o.talk || act === 'eat' ? 1 : 0, blink: o.blink, act: '' }, s);
        const kx = 1.34;
        const w = Math.round(spr.buf.w * kx);
        const x0 = Math.round(P.ox - spr.ox * kx), y0 = Math.round(P.oy - spr.oy);
        for (let y = 0; y < spr.buf.h; y++) for (let x = 0; x < w; x++) {
          const c = spr.buf.px[y * spr.buf.w + Math.min(spr.buf.w - 1, Math.floor(x / kx))];
          if (c) P.b.set(x0 + x, y0 + y, c);
        }
        retint(P.b, { x: x0, y: y0, w, h: spr.buf.h }, R);
        if (o.dir !== 'n') P.part(P.ell(side ? 2 : 0, -11 + hop, 6.4, 5.4), C.maxw, { b: 3, sh: 1 });
        if (act === 'eat') for (let i = 0; i < 4; i++) P.px(-8 + ((i * 7 + (o.anim || 0) * 3) % 17), -24 + ((i * 5 + (o.anim || 0)) % 9), C.oak[3]);
        return;
      }
      const r = blitSprite(P, 'max', { dir: o.dir, walk: o.walk, talk: o.talk, blink: o.blink, act: '' });
      retint(P.b, r, R);
      if (o.dir === 'n') return;
      if (side) {
        P.line(6, -32.5 + hop, 11, -30 + hop, C.black);
        P.part(P.cap(2, -14 + hop, 10, -18 + hop, 1.8, 1.6), R, { b: 3, sh: 1 });
        P.part(P.ell(11.5, -18.6 + hop, 2.4, 2.2), C.maxw, { b: 3, sh: 0 });
        P.part(P.poly([12, -22 + hop, 22, -22 + hop, 22, -19.6 + hop, 15, -19 + hop, 14.4, -16 + hop, 12, -16 + hop]), C.grey, { b: 1, sh: 0 });
        if (act === 'shoot') for (let i = 0; i < 4; i++) P.line(23, -21 + hop, 27 + (i % 2) * 2, -24 + i * 2 + hop, C.lamp);
      } else {
        P.line(-6.4, -32 + hop, -2, -30 + hop, C.black);
        P.line(6.4, -32 + hop, 2, -30 + hop, C.black);
        P.part(P.cap(6, -14 + hop, 11, -20 + hop, 1.8, 1.6), R, { b: 3, sh: 1 });
        P.part(P.ell(11.4, -21 + hop, 2.4, 2.2), C.maxw, { b: 3, sh: 0 });
        P.part(P.poly([10, -30 + hop, 12.6, -30 + hop, 12.6, -22 + hop, 10, -22 + hop]), C.grey, { b: 1, sh: 0 });
        if (act === 'shoot') for (let i = 0; i < 4; i++) P.line(11.3, -31 + hop, 8 + i * 2.2, -35 - (i % 2) * 2 + hop, C.lamp);
      }
    },
    anim: o => (o.act === 'eat' ? Math.floor((o.t || 0) * 6) % 4 : 0)
  };

  function mommaHead(P, x, y, o) {
    const K = C.dskin, G = C.grey;
    P.part(P.ell(x, y - 3, 13, 12.5), G, { b: 4 });
    S.art.boscoHead(P, x, y, o);
    P.part(P.path(`M ${x - 10.6} ${y - 2.4} Q ${x - 12} ${y - 14} ${x} ${y - 14.6} Q ${x + 12} ${y - 14} ${x + 10.6} ${y - 2.4} Q ${x + 7} ${y - 8.4} ${x} ${y - 7.8} Q ${x - 7} ${y - 8.4} ${x - 10.6} ${y - 2.4} Z`), G, { b: 5 });
    P.part(P.ell(x, y - 16.5, 5.4, 4.2), G, { b: 4 });
    P.curve(`M ${x - 3} ${y - 17} Q ${x} ${y - 19.4} ${x + 3} ${y - 17}`, G[2]);
    if (o.hypno) calmEyes(P, [x - 4.5, x + 4.5], y, K);
    for (const ex of [-4.5, 4.5]) {
      P.line(x + ex - 3.4, y - 2.6, x + ex + 3.4, y - 2.6, C.gold[3]);
      P.line(x + ex - 3.4, y + 2.6, x + ex + 3.4, y + 2.6, C.gold[3]);
      P.line(x + ex - 3.6, y - 2.4, x + ex - 3.6, y + 2.4, C.gold[3]);
      P.line(x + ex + 3.6, y - 2.4, x + ex + 3.6, y + 2.4, C.gold[3]);
    }
    P.line(x - 1, y - 0.4, x + 1, y - 0.4, C.gold[3]);
    if (!o.talk) P.part(P.ell(x, y + 9.8, 3, 1.3), C.red, { b: 3, sh: 0, hi: 0 });
    P.px(x - 10.6, y + 5.4, C.gold[4]); P.px(x + 10.6, y + 5.4, C.gold[4]);
    if (o.hypno) halo(P, x, y - 22, 9, o.anim || 0);
  }

  COSTUMES.bosco6 = {
    h: 94, w: 46,
    draw(P, o) {
      const act = o.act || '';
      const K = C.dskin;
      P.part(P.cap(-5, -14, -5.5, -4, 3, 2.6), K, { b: 2, sh: 1 });
      P.part(P.cap(5, -14, 5.5, -4, 3, 2.6), K, { b: 2, sh: 1 });
      P.part(P.ell(-6.5, -2, 5, 2.4), C.plum, { b: 2, sh: 0 });
      P.part(P.ell(6.5, -2, 5, 2.4), C.plum, { b: 2, sh: 0 });
      const skirt = P.path('M -15 -30 Q -19.5 -18 -17 -9 L 17 -9 Q 19.5 -18 15 -30 Z');
      P.part(skirt, C.lilac, { b: 2 });
      skirt.each((x, y) => { if (P.b.px[y * P.b.w + x] !== C.black && S.hash(x >> 1, y >> 1, 9) < 0.09) P.b.set(x, y, C.pink[3]); });
      P.part(P.path('M -15 -53 Q -21 -40 -16 -27 L 16 -27 Q 21 -40 15 -53 Z'), C.rose, { b: 2 });
      P.part(P.path('M -9 -48 L 9 -48 L 11 -14 Q 0 -11 -11 -14 Z'), C.cream, { b: 4, sh: 1 });
      P.line(-9, -30, 9, -30, C.cream[2]);
      P.part(P.rect(2.6, -45, 7.4, 4), C.grey, { b: 5, sh: 0, hi: 0 });
      P.line(3.6, -43, 9, -43, C.red[3]);
      P.part(P.rect(-4, -56, 8, 5), K, { b: 2, sh: 0 });
      for (let i = -3; i <= 3; i++) P.px(i * 1.8, -51.4 + (3 - Math.abs(i)) * 0.7, C.grey[5]);
      const arm = (sx, ex, ey) => {
        P.part(P.cap(sx, -49, (sx + ex) / 2, (-49 + ey) / 2, 3.8, 3.4), C.rose, { b: 2, sh: 1 });
        P.part(P.cap((sx + ex) / 2, (-49 + ey) / 2, ex, ey, 3.2, 2.8), K, { b: 3, sh: 1 });
        P.part(P.ell(ex, ey + 1, 3.4, 3), K, { b: 3, sh: 1 });
      };
      if (o.hypno) { arm(-15, -6, -38); arm(15, 6, -38); }
      else if (act === 'give') { arm(-15, -30, -40); arm(15, 19, -29); }
      else if (act === 'point') { arm(-15, -19, -29); arm(15, 24, -64); }
      else if (act === 'shrug') { arm(-15, -24, -48); arm(15, 24, -48); }
      else if (act === 'gasp') { arm(-15, -8, -58); arm(15, 8, -58); }
      else { arm(-15, -19, -29); arm(15, 19, -29); }
      mommaHead(P, 0, -66, o);
    },
    anim: o => (o.hypno ? Math.floor((o.t || 0) * 2) % 3 : 0)
  };

  function queenHead(P, x, y, o) {
    S.art.sybilHead(P, x, y, o);
    if (o.hypno) calmEyes(P, [x - 2.8, x + 2.8], y - 0.6, C.skin);
    P.part(P.poly([x - 6, y - 19, x - 6.6, y - 26, x - 3, y - 22.6, x, y - 27, x + 3, y - 22.6, x + 6.6, y - 26, x + 6, y - 19]), C.gold, { b: 3 });
    P.px(x, y - 22, C.red[3]); P.px(x - 4, y - 21, C.sky[3]); P.px(x + 4, y - 21, C.sky[3]);
    if (o.hypno) halo(P, x, y - 30, 8, o.anim || 0);
  }

  COSTUMES.sybil6 = {
    h: 100, w: 38,
    draw(P, o) {
      const act = o.act || '';
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      P.part(P.cap(-3, -24, -3.5 - w * 2, -5, 2.3, 1.8), C.grey, { b: 1, sh: 0 });
      P.part(P.cap(3, -24, 3.5 + w * 2, -5, 2.3, 1.8), C.grey, { b: 1, sh: 0 });
      P.part(P.poly([-6 - w * 2, -5, -1.5 - w * 2, -5, -1.5 - w * 2, -1, -6.5 - w * 2, -0.5]), C.red, { b: 3, sh: 0 });
      P.part(P.poly([1.5 + w * 2, -5, 6 + w * 2, -5, 6.5 + w * 2, -0.5, 1.5 + w * 2, -1]), C.red, { b: 3, sh: 0 });
      P.part(P.path('M -10 -57 Q -17.5 -36 -15.5 -8 L 15.5 -8 Q 17.5 -36 10 -57 Z'), C.red, { b: 2 });
      P.part(P.rect(-15.5, -12.5, 31, 4.6), C.grey, { b: 5, sh: 0 });
      for (let i = 0; i < 6; i++) P.px(-13 + i * 5.2, -10.4, C.black);
      P.part(P.path('M -7 -56 Q -10.5 -44 -8.5 -34 Q -9.5 -26 -8 -19 L 8 -19 Q 9.5 -26 8.5 -34 Q 10.5 -44 7 -56 Z'), C.purple, { b: 3 });
      P.part(P.rect(-8.5, -38, 17, 2.5), C.gold, { b: 3, sh: 0 });
      P.part(P.path('M -8.8 -57.4 Q 0 -52 8.8 -57.4 L 9.4 -53.4 Q 0 -48 -9.4 -53.4 Z'), C.grey, { b: 5, sh: 0 });
      for (const sx of [-6, -2, 2, 6]) P.px(sx, -52.4 + Math.abs(sx) * 0.24, C.black);
      P.part(P.poly([-4.4, -44, -2.8, -47.4, -1.2, -44, -2.8, -41.6]), C.red, { b: 3, sh: 0, hi: 0 });
      let lx = -11, ly = -37, rx = 11, ry = -37;
      if (o.hypno) { lx = -3.4; ly = -46; rx = 3.4; ry = -46; }
      else if (act === 'shock') { lx = -12; ly = -66; rx = 12; ry = -66; }
      else if (act === 'point') { rx = 20; ry = -52; }
      else if (act === 'phone') { rx = 8; ry = -68; }
      else if (act === 'swoon') { lx = -3; ly = -48; rx = 4; ry = -49; }
      else if (act === 'give') { rx = 18; ry = -44; }
      P.part(P.cap(-7.5, -54, lx, ly, 1.9, 1.6), C.skin, { b: 3, sh: 0 });
      P.part(P.cap(7.5, -54, rx, ry, 1.9, 1.6), C.skin, { b: 3, sh: 0 });
      if (!o.hypno && act !== 'shock' && act !== 'swoon') {
        P.line(lx - 1, ly - 30, lx - 1, ly + 28, C.oak[3]);
        P.line(lx, ly - 30, lx, ly + 28, C.oak[2]);
        P.part(P.poly([lx - 1.6, ly + 27, lx + 7, ly + 30, lx + 7, ly + 32.4, lx - 1.6, ly + 30]), C.oak, { b: 2, sh: 0 });
        P.part(P.ell(lx - 0.5, ly - 31, 2, 2), C.gold, { b: 3, sh: 0 });
      }
      if (act === 'phone') P.part(P.cap(rx + 1, ry - 4, rx + 2, ry + 5, 1.6), C.red, { b: 3, sh: 0 });
      P.part(P.cap(0, -56, 0, -62, 2.2), C.skin, { b: 3, sh: 0 });
      queenHead(P, 0, -69, o);
    },
    anim: o => (o.hypno ? Math.floor((o.t || 0) * 2) % 3 : 0)
  };

  function talismanOn(P, x, y, ramp, r) {
    P.part(P.ell(x, y, r, r), C.gold, { b: 3 });
    P.part(P.ell(x, y, r * 0.58, r * 0.58), ramp, { b: 3, sh: 0, hi: 0 });
  }

  COSTUMES.abehead6 = {
    h: 118, w: 56,
    draw(P, o) {
      const M = C.cream;
      P.part(P.rect(-23, -9, 46, 5), C.oak, { b: 3 });
      P.part(P.ell(-16, -3.4, 3.6, 3.4), C.grey, { b: 1 });
      P.part(P.ell(16, -3.4, 3.6, 3.4), C.grey, { b: 1 });
      P.part(P.ell(0, -12, 20, 4.4), C.red, { b: 2 });
      P.part(P.poly([-13, -12, -14, -23, -9, -20, -4, -25, 2, -21, 7, -26, 13, -21, 14, -12]), M, { b: 2 });
      const Q = P.scaled(0, -22, 1.5);
      S.art104.lincolnHead(Q, 0, -39, o);
      P.line(-6, -40, -9, -48, M[1]);
      P.line(-9, -48, -7, -54, M[1]);
      P.line(9, -34, 12, -42, M[1]);
      if (o.v === 'tal') {
        P.line(-3, -22, 0, -16, C.gold[2]); P.line(3, -22, 0, -16, C.gold[2]);
        talismanOn(P, 0, -14, C.slime, 3.6);
      }
      if (o.act === 'sad') { P.line(-7.4, -82, -7.4, -76, C.sky[3]); P.px(-7.4, -74.6, C.sky[4]); }
    }
  };

  COSTUMES.harry6 = {
    h: 68, w: 38,
    draw(P, o) {
      const act = o.act || '';
      const G = C.stone;
      const low = act === 'sigh' ? 3 : 0;
      P.part(P.cap(-4, -14, -4.5, -3, 3, 2.6), C.asphalt, { b: 2, sh: 1 });
      P.part(P.cap(4, -14, 4.5, -3, 3, 2.6), C.asphalt, { b: 2, sh: 1 });
      P.part(P.ell(-5.5, -1.6, 4.4, 2), C.grey, { b: 0, sh: 0 });
      P.part(P.ell(5.5, -1.6, 4.4, 2), C.grey, { b: 0, sh: 0 });
      P.part(P.path('M -10 -36 Q -13 -26 -10.5 -13 L 10.5 -13 Q 13 -26 10 -36 Q 0 -39 -10 -36 Z'), C.teal, { b: 2 });
      P.part(P.poly([-3.6, -37.4, 3.6, -37.4, 0, -27]), C.grey, { b: 5, sh: 0, hi: 0 });
      P.part(P.poly([-3.4, -37.8, 0, -35.8, 3.4, -37.8, 3.4, -33.6, 0, -35.6, -3.4, -33.6]), C.red, { b: 3, sh: 0, hi: 0 });
      P.part(P.rect(3, -31, 6.4, 4.4), C.cream, { b: 4, sh: 0, hi: 0 });
      for (let i = 0; i < 3; i++) P.px(4.4 + i * 1.6, -29, RAINBOW[i * 2]);
      let la = [-13, -18], ra = [13, -18];
      if (act === 'point') ra = [20, -38];
      if (act === 'sigh') { la = [-11, -14]; ra = [11, -14]; }
      if (act === 'panic') { la = [-15, -52]; ra = [15, -52]; }
      if (act === 'give') ra = [19, -28];
      P.part(P.cap(-9, -33, la[0], la[1], 2.6, 2.2), C.teal, { b: 2, sh: 1 });
      P.part(P.cap(9, -33, ra[0], ra[1], 2.6, 2.2), C.teal, { b: 2, sh: 1 });
      P.part(P.ell(la[0], la[1] + 1, 3, 2.6), C.pink, { b: 3, sh: 0 });
      P.part(P.ell(ra[0], ra[1] + 1, 3, 2.6), C.pink, { b: 3, sh: 0 });
      for (const [hx, hy] of [la, ra]) for (let i = -1; i <= 1; i++) P.line(hx + i * 1.6, hy + 2.6, hx + i * 2.2, hy + 5, G[4]);
      S.art103.moleHead(P.scaled(0, -46 + low, 0.95), 0, -46 + low, act === 'panic' ? Object.assign({}, o, { act: 'panic' }) : Object.assign({}, o, { act: '' }));
    }
  };

  COSTUMES.superball6 = {
    h: 104, w: 30,
    draw(P, o) {
      blitSprite(P, 'superball', { dir: o.dir, walk: o.walk, talk: o.talk, blink: o.blink, act: o.act, t: o.t, v: '' });
      if (o.dir === 'n') return;
      for (let i = 0; i <= 18; i++) {
        const t = i / 18;
        const x = -8 + t * 16, y = -78 + t * 33;
        P.px(x, y, RAINBOW[i % 6]); P.px(x + 1, y, RAINBOW[i % 6]); P.px(x + 2, y, RAINBOW[(i + 1) % 6]);
      }
    },
    anim: o => (o.act === 'dance' ? Math.floor((o.t || 0) * 4) % 4 : 0)
  };

  COSTUMES.jimmy6 = {
    h: 30, w: 20,
    draw(P, o) {
      const act = o.act || '';
      const R = C.rat;
      if (act === 'peek') { S.art.jimmyHead(P, 0, -5, o); return; }
      P.part(P.cap(-4, -3, -13, -6, 1.1, 0.6), C.pink, { b: 2, sh: 0 });
      P.part(P.ell(-0.5, -2.2, 6.4, 2.3), R, { b: 2 });
      P.part(P.ell(-1, -8.6, 5.6, 6.4, 0.2), C.orange, { b: 3 });
      P.line(-4, -13, 3, -4.6, C.orange[1]);
      if (act === 'fly') {
        P.part(P.cap(2, -11, 8, -18, 1.1), R, { b: 3, sh: 0 });
        P.part(P.cap(-3, -11, -8, -17, 1.1), R, { b: 3, sh: 0 });
      } else {
        P.part(P.cap(2, -10, 5.4, -8.4, 1.1), R, { b: 3, sh: 0 });
        P.part(P.ell(5.4, -8, 1.5, 1.3), R, { b: 4, sh: 0 });
      }
      S.art.jimmyHead(P, 3.5, -17, o);
      if (act !== 'fly') { P.px(3, -23.6, C.lamp); P.px(5, -24.4, C.yellow[3]); P.px(7, -23.6, C.lamp); }
    }
  };

  COSTUMES.hugh6 = {
    h: 84, w: 34,
    draw(P, o) {
      const v = o.v || '';
      const r = blitSprite(P, 'hugh', { dir: o.dir, walk: o.walk, talk: o.talk, blink: o.blink, act: o.act, t: o.t, v: v === 'germ' ? '' : v });
      if (v !== 'germ') return;
      const b = P.b, k = o.anim || 0;
      for (let y = Math.max(0, r.y); y < Math.min(b.h, r.y + r.h); y++) for (let x = Math.max(0, r.x); x < Math.min(b.w, r.x + r.w); x++) {
        const i = y * b.w + x;
        const c = b.px[i];
        if (!c || c === C.black) continue;
        const h = S.hash(x >> 1, (y + k) >> 1, 7);
        b.px[i] = h < 0.22 ? C.teal[3] : h < 0.56 ? C.mint[3] : h < 0.86 ? C.slime[3] : C.mint[4];
      }
      if (o.dir !== 'n') for (const ex of [-2.4, 2.4]) { P.px(ex, -78.2, C.lamp); P.px(ex, -77.4, C.lamp); }
    },
    anim: o => (o.v === 'germ' ? Math.floor((o.t || 0) * 6) % 6 : 0)
  };

  function portrait(id) {
    const b = new S.Buf(24, 20);
    const put = (fn, x, y, s) => fn(new S.Pen(b).at(x, y, s));
    const spr = (cos, pose, s, x, y) => { const sp = S.sprite(cos, pose, s); S.blit(b, sp.buf, x - sp.ox, y - sp.oy); return sp; };
    if (id === 'hugh') put(P => S.art102.hughHead(P, 0, 0, {}), 12, 12, 0.85);
    else if (id === 'superball') put(P => S.art104.superballHead(P, 0, 0, {}), 12, 13, 0.62);
    else if (id === 'harry') put(P => S.art103.moleHead(P, 0, 0, {}), 10, 12, 0.72);
    else if (id === 'abe') put(P => S.art104.lincolnHead(P, 0, 0, {}), 12, 12, 0.52);
    else if (id === 'philo') put(P => S.art102.chickenHead(P, 0, 0, {}, false), 10, 15, 1.05);
    else if (id === 'momma') put(P => mommaHead(P, 0, 0, {}), 12, 14, 0.6);
    else if (id === 'queen') put(P => queenHead(P, 0, 0, {}), 12, 16, 0.68);
    else if (id === 'leonard') put(P => S.art103.leonardHead(P, 0, 0, {}), 12, 11, 0.72);
    else if (id === 'cops') { spr('copcurt', {}, 0.3, 6, 19); spr('copbob', {}, 0.3, 18, 19); spr('copchippy', {}, 0.3, 12, 11); }
    else if (id === 'jimmy') put(P => S.art.jimmyHead(P, 0, 0, {}), 8, 12, 1.1);
    else if (VICE[id]) { const sp = S.sprite('max', { act: 'head' }, 0.6); const x = Math.round(12 - sp.ox), y = Math.round(17 - sp.oy); S.blit(b, sp.buf, x, y); retint(b, { x, y, w: sp.buf.w, h: sp.buf.h }, VICE[id]); }
    else if (id === 'maxbliss') { const sp = S.sprite('max', { act: 'head', blink: true }, 0.6); S.blit(b, sp.buf, 12 - sp.ox, 18 - sp.oy); put(P => halo(P, 0, 0, 7, 0), 12, 5, 1); }
    return b;
  }

  S.art106 = { halo, portrait };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
