(function (S) {
  'use strict';
  const { C } = S;
  const COSTUMES = S.COSTUMES;
  const A = S.art105;
  const TAU = Math.PI * 2;
  const { GLOW, LAMP } = A;

  function netHead(P, x, y, o) {
    const v = o.v || '';
    if (v === 'crash') {
      const m = P.ell(x, y - 2, 8.4, 10);
      const b = P.b;
      const seed = o.anim || 0;
      m.each((px, py) => b.set(px, py, S.hash(px, py, seed) > 0.5 ? C.grey[5] : C.grey[1]));
      return;
    }
    S.art102.directorHead(P, x, y, o);
    const sick = v === 'sick';
    for (const ex of [-2.6, 2.6]) {
      P.part(P.rect(x + ex - 2.3, y - 1.6, 4.6, 3.4), sick ? C.slime : GLOW, { b: 3, sh: 0, hi: 0 });
      if (sick) P.line(x + ex - 1.6, y - 0.4, x + ex + 1.6, y + 0.6, C.slime[0]);
      else if (!o.blink) P.px(x + ex + [-1, 0, 1, 0][(o.anim || 0) % 4], y, C.eye);
    }
    if (sick) {
      P.part(P.ell(x + 0.4, y + 2.4, 1.6, 1.4), C.red, { b: 3, sh: 0, hi: 0 });
      P.px(x - 4.4, y + 3.4, C.slime[3]); P.px(x + 4.6, y + 3.6, C.slime[3]);
      P.line(x + 5.4, y - 6, x + 5.4, y - 3.4, C.sky[4]);
    }
  }

  COSTUMES.internet = {
    h: 62, w: 48,
    draw(P, o) {
      const ph = o.anim || 0;
      const bob = Math.round(Math.sin(ph * TAU / 4) * 1.5);
      const y0 = -34 + bob;
      const sick = o.v === 'sick' || o.v === 'crash';
      for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + ph * 0.4; P.px(Math.cos(a) * 26, y0 + Math.sin(a) * 26, sick ? C.slime[3] : C.tvA); }
      for (let i = -3; i <= 3; i++) {
        P.part(P.rect(i * 5 - 1, y0 - 23.4, 2, 4.4), C.grey, { b: 4, sh: 0 });
        P.part(P.rect(i * 5 - 1, y0 + 19, 2, 4.4), C.grey, { b: 4, sh: 0 });
        P.part(P.rect(-23.4, y0 + i * 5 - 1, 4.4, 2), C.grey, { b: 4, sh: 0 });
        P.part(P.rect(19, y0 + i * 5 - 1, 4.4, 2), C.grey, { b: 4, sh: 0 });
      }
      P.part(P.rect(-19.4, y0 - 19.4, 38.8, 38.8), C.green, { b: 1 });
      const tr = sick ? C.slime[2] : C.neonB;
      for (const [x1, y1, x2, y2] of [[-18, -14, -11, -14], [-11, -14, -11, -9], [18, -12, 12, -12], [12, -12, 12, -8], [-18, 13, -10, 13], [-10, 13, -10, 9], [18, 15, 11, 15], [11, 15, 11, 10], [-4, -18, -4, -15], [6, 18, 6, 15]]) P.line(x1, y0 + y1, x2, y0 + y2, tr);
      for (const [dx, dy] of [[-15, -5], [15, 3], [-14, 5], [14, -17]]) P.part(P.rect(dx - 1.4, y0 + dy - 1, 2.8, 2), C.grey, { b: 0, sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(0, y0, 13.6, 14.6), C.night, { b: 1 });
      netHead(P.scaled(0, y0 + 2, 1.22), 0, y0 + 2, o);
    },
    anim: o => Math.floor((o.t || 0) * 4) % 4
  };

  function wizHat(P, x, y) {
    P.part(P.path(`M ${x - 15} ${y} Q ${x} ${y - 5} ${x + 15} ${y} L ${x + 6} ${y - 24} Q ${x + 8} ${y - 33} ${x + 15} ${y - 34} Q ${x + 5} ${y - 40} ${x - 1} ${y - 27} Z`), C.blue, { b: 2 });
    P.part(P.ell(x, y, 21, 4.4), C.blue, { b: 3 });
    for (const [dx, dy] of [[-4, -8], [5, -14], [-1, -20], [8, -5]]) { P.px(x + dx, y + dy, C.lamp); P.px(x + dx + 1, y + dy, C.yellow[4]); P.px(x + dx, y + dy - 1, C.yellow[4]); }
    P.part(P.ell(x + 15, y - 34, 1.8, 1.8), LAMP, { sh: 0, hi: 0 });
  }

  COSTUMES.netwiz = {
    h: 92, w: 52,
    draw(P, o) {
      const ph = o.anim || 0;
      const bob = Math.round(Math.sin(ph * TAU / 4) * 2);
      const hy = -34 + bob;
      for (let i = 0; i < 3; i++) P.part(P.ell(-6 + i * 6, hy + 30 + (i % 2) * 4, 4 - i, 2.4), C.lilac, { b: 4, sh: 0, hi: 0, ol: 0 });
      S.art102.hughHead(P.scaled(0, hy, 2.1), 0, hy, o.act === 'magic' ? Object.assign({}, o, { blink: true }) : o);
      wizHat(P, 0, hy - 22);
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6 + ph * TAU / 16;
        P.px(Math.cos(a) * 27, hy + 4 + Math.sin(a) * 10, C.cycle[i]);
        if (o.act === 'magic') P.px(Math.cos(a) * 20, hy + 4 + Math.sin(a) * 16, C.lamp);
      }
    },
    anim: o => Math.floor((o.t || 0) * 4) % 4
  };

  function pan(P, hx, hy, ang) {
    const dx = Math.cos(ang), dy = Math.sin(ang);
    P.part(P.cap(hx, hy, hx + dx * 9, hy + dy * 9, 1.3), C.grey, { b: 1, sh: 0 });
    P.part(P.ell(hx + dx * 15, hy + dy * 15, 7.4, 6.6), C.grey, { b: 1 });
    P.part(P.ell(hx + dx * 15, hy + dy * 15, 5, 4.4), C.grey, { b: 0, sh: 0, hi: 0, ol: 0 });
    P.px(hx + dx * 13, hy + dy * 13 - 2, C.grey[3]);
  }

  COSTUMES.auntie = {
    h: 110, w: 46,
    draw(P, o) {
      const act = o.act || '';
      const K = C.pale, M = C.stone, T = C.pistachio;
      const ph = o.anim || 0;
      if (act === 'fade') {
        const b = P.b;
        const m = P.ell(0, -50, 20, 50);
        m.each((x, y) => { if (S.hash(x, y, ph) > 0.78) b.set(x, y, C.cycle[(x + y + ph) & 7]); });
        return;
      }
      const arm = (sx, sy, hx, hy) => {
        P.part(P.cap(sx, sy, hx, hy, 3.3, 2.7), T, { b: 3, sh: 0 });
        P.part(P.ell(hx, hy + 1, 2.5, 2.4), K, { b: 3, sh: 0 });
      };
      P.part(P.ell(-6.2, -2.2, 4.8, 2.4), C.grey, { b: 1, sh: 0 });
      P.part(P.ell(6.2, -2.2, 4.8, 2.4), C.grey, { b: 1, sh: 0 });
      const skirt = P.path('M -14 -43 L 14 -43 Q 17 -24 14 -5 L -14 -5 Q -17 -24 -14 -43 Z');
      P.part(skirt, M, { b: 3 });
      skirt.each((x, y) => { if ((x + y * 2) % 4 === 0 && P.b.px[y * P.b.w + x] !== C.black) P.b.set(x, y, M[1]); });
      P.part(P.path('M -12 -42 L 12 -42 L 10 -14 Q 0 -10 -10 -14 Z'), C.cream, { b: 4, sh: 1 });
      P.part(P.path('M -15 -65 Q -18.5 -52 -15 -41 L 15 -41 Q 18.5 -52 15 -65 Q 8 -69 0 -69 Q -8 -69 -15 -65 Z'), M, { b: 4 });
      P.part(P.rect(-15, -44, 30, 3.2), M, { b: 2, sh: 0, hi: 0 });
      for (const s of [-1, 1]) P.part(P.ell(s * 14, -64, 5, 3.6), M, { b: 4, sh: 1 });
      S.font.draw(P.b, '+1', Math.round(P.X(0)) - 4, Math.round(P.Y(-61)), C.red[3], 0);
      P.part(P.rect(-4.8, -74, 9.6, 8.4), T, { b: 3, sh: 1 });
      let la = [-17, -46], ra = [19, -78], ang = -1.9;
      if (act === 'swing') { ra = [24, -52]; ang = 0.5; }
      if (act === 'block') { ra = [10, -58]; ang = -0.4; }
      if (act === 'hit') { la = [-22, -70]; ra = [22, -68]; ang = -1.2; }
      if (act === 'guard' && ph % 2) { ra = [20, -80]; ang = -1.8; }
      arm(-12, -62, la[0], la[1]);
      arm(12, -62, ra[0], ra[1]);
      pan(P, ra[0], ra[1], ang);
      S.art102.myraHead(P, 0, -80, act === 'hit' ? Object.assign({}, o, { act: 'fried' }) : o);
    },
    anim: o => o.act === 'fade' ? Math.floor((o.t || 0) * 10) % 8 : Math.floor((o.t || 0) * 1.5) % 2
  };

  const ELF = { skin: C.dskin, tunic: C.green, hose: C.oak, boot: C.wood, cloak: C.olive, gold: C.gold };
  const BOT = { skin: C.grey, tunic: C.stone, hose: C.stone, boot: C.grey, cloak: C.grey, gold: C.grey };

  function elfHead(P, x, y, o, K) {
    const bot = K === BOT;
    if (bot) {
      P.part(P.ell(x, y, 9, 10.4), K.skin, { b: 3 });
      P.part(P.rect(x - 6, y - 3, 12, 5), C.night, { b: 1, sh: 0, hi: 0 });
      for (let i = 0; i < 3; i++) P.px(x - 3 + i * 3, y - 0.6, (o.anim || 0) % 3 === i ? C.tvA : C.grey[2]);
      P.line(x, y - 10, x, y - 15, C.grey[3]);
      P.part(P.ell(x, y - 16, 1.6, 1.6), A.NEON_R, { sh: 0, hi: 0 });
    } else {
      S.art.boscoHead(P.scaled(x, y, 0.92), x, y, o);
      P.part(P.rect(x - 9, y - 8.4, 18, 2), K.gold, { b: 3, sh: 0 });
      P.px(x, y - 8, C.neonB);
    }
    for (const s of [-1, 1]) P.part(P.poly([x + s * 8.6, y - 3, x + s * 20, y - 14, x + s * 10, y + 3.4]), K.skin, { b: bot ? 3 : 3, sh: 1 });
  }

  COSTUMES.elfav = {
    h: 98, w: 46,
    draw(P, o) {
      const act = o.act || '';
      const K = o.v === 'bot' ? BOT : ELF;
      P.part(P.path('M -14 -66 Q -22 -40 -18 -12 L 18 -12 Q 22 -40 14 -66 Z'), K.cloak, { b: 1 });
      P.part(P.cap(-4.5, -36, -5, -5, 3.2, 2.8), K.hose, { b: 2, sh: 1 });
      P.part(P.cap(4.5, -36, 5, -5, 3.2, 2.8), K.hose, { b: 3, sh: 1 });
      P.part(P.poly([-9, -8, -2, -8, -1.4, -1, -10.4, -0.6]), K.boot, { b: 2 });
      P.part(P.poly([2, -8, 9, -8, 10.4, -0.6, 1.4, -1]), K.boot, { b: 2 });
      P.part(P.path('M -11.5 -68 Q -14.5 -52 -12.5 -40 L -14 -30 L 14 -30 L 12.5 -40 Q 14.5 -52 11.5 -68 Q 0 -71 -11.5 -68 Z'), K.tunic, { b: 3 });
      P.part(P.rect(-13, -43, 26, 3.4), K.boot, { b: 1, sh: 0 });
      P.part(P.rect(-2, -43.6, 4, 4.6), K.gold, { b: 3, sh: 0 });
      P.part(P.poly([-3.4, -68, 3.4, -68, 0, -60]), K.skin, { b: 3, sh: 0, hi: 0 });
      P.line(-11, -66, 9, -44, K.boot[2]);
      let la = [-15, -46], ra = [15, -46];
      if (act === 'give') ra = [24, -56];
      if (act === 'point') ra = [24, -70];
      if (act === 'hit') { la = [-18, -82]; ra = [18, -82]; }
      if (act === 'bow') la = [-19, -58];
      P.part(P.cap(-10.5, -65, la[0], la[1], 2.8, 2.4), K.tunic, { b: 3, sh: 1 });
      P.part(P.cap(10.5, -65, ra[0], ra[1], 2.8, 2.4), K.tunic, { b: 3, sh: 1 });
      P.part(P.ell(la[0], la[1] + 1, 2.6, 2.4), K.skin, { b: 3, sh: 0 });
      P.part(P.ell(ra[0], ra[1] + 1, 2.6, 2.4), K.skin, { b: 3, sh: 0 });
      P.curve(`M ${la[0] - 1} ${la[1] - 26} Q ${la[0] - 12} ${la[1]} ${la[0] - 1} ${la[1] + 26}`, K.boot[3]);
      P.line(la[0] - 1, la[1] - 26, la[0] - 1, la[1] + 26, C.grey[4]);
      elfHead(P, 0, -80, o, K);
      if (act === 'hit') for (let i = 0; i < 3; i++) { const a = (o.anim || 0) + i * TAU / 3; P.part(P.ell(Math.cos(a) * 12, -96 + Math.sin(a) * 3, 1.6, 1.6), C.yellow, { b: 4, sh: 0, hi: 0 }); }
      if (o.v === 'bot') {
        P.part(P.rect(-13, -58, 26, 9), C.cream, { b: 4 });
        S.font.draw(P.b, 'БОТ', Math.round(P.X(0)) - 8, Math.round(P.Y(-57)), C.red[2], 0);
      }
    },
    anim: o => Math.floor((o.t || 0) * 3) % 3
  };

  COSTUMES.sybav = {
    h: 88, w: 34,
    draw(P, o) {
      const ph = o.anim || 0;
      P.part(P.path('M -7 -56 Q -11 -42 -9 -28 L -13 -2 L 13 -2 L 9 -28 Q 11 -42 7 -56 Z'), C.pink, { b: 3 });
      for (let i = 0; i < 6; i++) P.px(-8 + ((i * 7 + ph * 3) % 17), -8 - ((i * 11) % 40), C.lamp);
      P.part(P.rect(-9, -38, 18, 2.5), C.gold, { b: 3, sh: 0 });
      for (const s of [-1, 1]) P.part(P.path(`M ${s * 7} -52 Q ${s * 22} -66 ${s * 20} -40 Q ${s * 14} -34 ${s * 8} -42 Z`), [C.tvB, C.tvB, C.tvA, C.tvA, C.tvA], { b: 2, sh: 0, hi: 0, ol: C.sky[2] });
      const ra = o.talk ? [14, -60] : [11, -40];
      P.part(P.cap(-7.5, -54, -11, -38, 1.9, 1.6), C.skin, { b: 3, sh: 0 });
      P.part(P.cap(7.5, -54, ra[0], ra[1], 1.9, 1.6), C.skin, { b: 3, sh: 0 });
      P.line(ra[0] + 1, ra[1], ra[0] + 4, ra[1] - 12, C.gold[3]);
      P.part(P.ell(ra[0] + 4.4, ra[1] - 13, 2, 2), LAMP, { sh: 0, hi: 0 });
      P.part(P.cap(0, -56, 0, -62, 2.2), C.skin, { b: 3, sh: 0 });
      S.art.sybilHead(P, 0, -69, o);
      P.part(P.poly([-6, -79, -3, -85, 0, -80, 3, -86, 6, -79]), C.gold, { b: 4, sh: 0 });
      P.px(0, -82, C.neonA);
    },
    anim: o => Math.floor((o.t || 0) * 3) % 4
  };

  COSTUMES.slime5 = {
    h: 24, w: 30,
    draw(P, o) {
      const act = o.act || '';
      const ph = o.anim || 0;
      const sq = act === 'hit' ? 0.5 : [1, 0.86, 1, 1.12][ph % 4];
      const w = 13 / Math.sqrt(sq), h = 19 * sq;
      P.part(P.path(`M ${-w} 0 Q ${-w - 2} ${-h * 0.55} ${-w * 0.45} ${-h * 0.8} Q 0 ${-h * 1.2} ${w * 0.45} ${-h * 0.8} Q ${w + 2} ${-h * 0.55} ${w} 0 Q 0 3 ${-w} 0 Z`), C.sky, { b: 3 });
      P.part(P.ell(-w * 0.4, -h * 0.72, 2.4, 1.4), C.sky, { b: 4, sh: 0, hi: 0, ol: 0 });
      const ey = -h * 0.5;
      for (const ex of [-4, 4]) {
        if (act === 'hit') { P.line(ex - 1.5, ey - 1.5, ex + 1.5, ey + 1.5, C.black); P.line(ex - 1.5, ey + 1.5, ex + 1.5, ey - 1.5, C.black); }
        else { P.part(P.ell(ex, ey, 2.2, 2.6), C.eye, { sh: 0, hi: 0 }); P.px(ex + 0.4, ey + 0.4, C.pupil); }
      }
      if (act !== 'hit') P.part(P.path(`M -5 ${ey + 4} Q 0 ${ey + 8.4} 5 ${ey + 4} Q 0 ${ey + 5.4} -5 ${ey + 4} Z`), C.red, { b: 1, sh: 0, hi: 0 });
      else P.part(P.ell(0, ey + 5, 2, 1.4), C.red, { b: 1, sh: 0, hi: 0 });
      if (o.v === 'angry') { P.line(-6.4, ey - 4.4, -2, ey - 2.6, C.black); P.line(6.4, ey - 4.4, 2, ey - 2.6, C.black); }
    },
    anim: o => Math.floor((o.t || 0) * 5) % 4
  };

  function flat(base) {
    const src = COSTUMES[base];
    return {
      h: src.h, w: src.w,
      draw(P, o) {
        const s = Math.abs(P.sx);
        const side = o.dir === 'e' || o.dir === 'w';
        const hop = o.walk >= 0 ? Math.round(Math.abs(Math.sin(o.walk * TAU)) * 3 * s) : 0;
        const spr = S.sprite(base, { dir: o.dir === 'n' ? 'n' : 's', walk: -1, talk: o.talk, blink: o.blink, act: side ? '' : o.act, t: 0 }, s);
        const k = side ? 0.16 : 1;
        const b = P.b, sb = spr.buf;
        const wOut = Math.max(2, Math.round(sb.w * k));
        const x0 = Math.round(P.ox - spr.ox * k), y0 = Math.round(P.oy - spr.oy) - hop;
        for (let dx = 0; dx < wOut; dx++) {
          const sx = Math.min(sb.w - 1, Math.floor(dx / k));
          for (let y = 0; y < sb.h; y++) {
            let c = sb.px[y * sb.w + sx];
            if (side && !c) { for (let q = 1; q < 4 && !c; q++) c = sb.px[y * sb.w + Math.min(sb.w - 1, sx + q)] || sb.px[y * sb.w + Math.max(0, sx - q)]; }
            if (c) b.set(x0 + dx, y0 + y, side && (dx === 0 || dx === wOut - 1) ? C.grey[5] : c);
          }
        }
      }
    };
  }

  function light(base) {
    const src = COSTUMES[base];
    return {
      h: src.h + 8, w: src.w,
      draw(P, o) {
        const s = Math.abs(P.sx);
        const hop = Math.round((o.walk >= 0 ? Math.abs(Math.sin(o.walk * TAU)) * 7 : 1 + [0, 1, 2, 1][o.anim || 0]) * s);
        const spr = S.sprite(base, { dir: o.dir, walk: o.walk, talk: o.talk, blink: o.blink, act: o.act, t: o.t, v: o.v }, s);
        P.part(P.ell(0, -1, src.w * 0.32, 1.6), C.night, { b: 1, sh: 0, hi: 0, ol: 0 });
        S.blit(P.b, spr.buf, Math.round(P.ox - spr.ox), Math.round(P.oy - spr.oy) - hop);
      },
      anim: o => (o.walk >= 0 ? 0 : Math.floor((o.t || 0) * 3) % 4)
    };
  }

  COSTUMES.samflat = flat('sam');
  COSTUMES.maxflat = flat('max');
  COSTUMES.samlight = light('sam');
  COSTUMES.maxlight = light('max');

  function popup(P, x, y, w, h, k) {
    P.part(P.rect(x, y, w, h), C.grey, { b: 4, sh: 0, hi: 0 });
    P.part(P.rect(x + 1, y + 1, w - 2, 4), C.blue, { b: 2, sh: 0, hi: 0, ol: 0 });
    P.part(P.rect(x + w - 5, y + 1.6, 3, 2.8), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
    P.part(P.rect(x + 1.6, y + 6, w - 3.2, h - 7.6), [C.purple, C.gold, C.pink, C.teal][k % 4], { b: 3, sh: 0, hi: 0, ol: 0 });
    const cx = x + w / 2, cy = y + 6 + (h - 7.6) / 2;
    P.part(P.ell(cx - 3, cy - 2.4, 1.8, 1.8), C.oak, { b: 3, sh: 0, hi: 0, ol: 0 });
    P.part(P.ell(cx + 3, cy - 2.4, 1.8, 1.8), C.oak, { b: 3, sh: 0, hi: 0, ol: 0 });
    P.part(P.ell(cx, cy + 0.6, 4, 3.4), C.oak, { b: 3, sh: 0, hi: 0, ol: 0 });
    P.px(cx - 1.4, cy, C.eye); P.px(cx + 1.4, cy, C.eye);
  }

  function coin(P, x, y, r, ph) {
    const k = [1, 0.7, 0.25, 0.7][ph % 4];
    P.part(P.ell(x, y, Math.max(1, r * k), r), C.gold, { b: 3 });
    if (k > 0.5) { P.part(P.ell(x, y, r * k * 0.5, r * 0.56), C.gold, { b: 4, sh: 0, hi: 0, ol: C.gold[1] }); P.px(x - r * k * 0.5, y - r * 0.5, C.lamp); }
  }

  function portrait(id) {
    const b = new S.Buf(24, 20);
    const put = (fn, x, y, s) => fn(new S.Pen(b).at(x, y, s));
    if (id === 'internet') put(P => { P.part(P.rect(-11, -9, 22, 18), C.green, { b: 1 }); netHead(P.scaled(0, 1, 0.9), 0, 1, {}); }, 12, 10, 1);
    else if (id === 'wizard') put(P => { S.art102.hughHead(P.scaled(0, 4, 0.8), 0, 4, {}); wizHat(P.scaled(0, -4, 0.5), 0, -4); }, 12, 11, 1);
    else if (id === 'auntie') put(P => { S.art102.myraHead(P.scaled(0, 3, 0.72), 0, 3, {}); }, 10, 12, 1);
    else if (id === 'elfbot') put(P => elfHead(P, 0, 0, {}, BOT), 12, 13, 0.6);
    return b;
  }

  Object.assign(A, { netHead, pan, popup, coin, portrait2: portrait });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
