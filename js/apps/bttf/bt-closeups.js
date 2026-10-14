(function (S, B) {
  'use strict';
  const { Buf, Pen, blit, rectFill, BAYER } = S;
  const C = B.C;
  const BAR = 40;
  const CACHE = new Map();

  function cached(key, w, h, paint) {
    if (!CACHE.has(key)) { const b = new Buf(w, h); paint(b); CACHE.set(key, b); }
    return CACHE.get(key);
  }

  function bigText(f, text, cx, y, k, col, ol) {
    const w = (B.font.measure(text) + 4) * k, h = 16 * k;
    const buf = cached('big|' + text + '|' + k + '|' + col + '|' + ol, w, h, b => B.games.big(b, text, w / 2, 0, k, col, ol));
    blit(f, buf, Math.round(cx - w / 2), y);
  }

  function scanlines(f, step) {
    blit(f, cached('scan' + step, 640, 480, b => { rectFill(b, 0, 0, 640, 480, C.char[0]); for (let y = 40; y < 440; y += step) S.line(b, 0, y, 639, y, C.char[1]); }), 0, 0);
  }

  const JITTER = Array.from({ length: 640 }, (_, x) => S.hash(x, 1, 3) * 24);

  function crop(f, src, sx, sy, dx, dy, w, h) {
    for (let y = 0; y < h; y++) {
      const yy = sy + y, ty = dy + y;
      if (yy < 0 || yy >= src.h || ty < 0 || ty >= f.h) continue;
      for (let x = 0; x < w; x++) {
        const xx = sx + x, tx = dx + x;
        if (xx < 0 || xx >= src.w || tx < 0 || tx >= f.w) continue;
        const v = src.px[yy * src.w + xx];
        if (v) f.px[ty * f.w + tx] = v;
      }
    }
  }

  function sprite(f, id, o, x, y, s) {
    const spr = S.sprite(id, Object.assign({ walk: -1 }, o), s || 1);
    blit(f, spr.buf, Math.round(x - spr.ox), Math.round(y - spr.oy));
    return spr;
  }

  let MONO = null;
  function mono(f, x0, y0, w, h) {
    if (!MONO) {
      MONO = new Uint8Array(256);
      const P = B.PAL.PALETTE, R = C.grey;
      for (let i = 0; i < 256; i++) { const c = P[i] || [0, 0, 0]; const l = (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255; MONO[i] = R[Math.max(0, Math.min(R.length - 1, Math.round(l * (R.length - 1) * 1.1)))]; }
    }
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) f.px[y * f.w + x] = MONO[f.px[y * f.w + x]];
  }

  function dither(f, level, col, y0, y1) {
    if (level <= 0) return;
    for (let y = y0 || 0; y < (y1 || f.h); y++) for (let x = 0; x < f.w; x++) if (BAYER[((y & 3) << 2) | (x & 3)] < level) f.px[y * f.w + x] = col;
  }

  function rain(f, t, n, y0, y1) {
    for (let i = 0; i < n; i++) {
      const x = Math.floor((S.hash(i, 1, 4) * 700 + t * 90) % 700) - 30, y = Math.floor((S.hash(i, 2, 4) * (y1 - y0) + t * 520) % (y1 - y0)) + y0;
      S.line(f, x, y, x - 3, y + 9, i % 3 ? C.stone[3] : C.snow[2]);
    }
  }

  function lightning(t, at) { let v = 0; for (const a of at) { const d = t - a; if (d >= 0 && d < 0.5) v = Math.max(v, d < 0.08 ? 1 : (0.5 - d) * 1.6); } return v; }

  function fireTrails(f, x0, x1, ys, t) {
    for (let x = Math.max(0, x0); x < Math.min(f.w, x1); x++) for (const y0 of ys) {
      f.set(x, y0 + 2, C.black);
      for (let k = -1; k <= 1; k++) f.set(x, y0 + k, C.cycle[(x + y0 + k * 3 + Math.floor(t * 12)) % 8]);
      if (S.hash(x, y0, Math.floor(t * 8)) > 0.72) { const h = 2 + Math.floor(S.hash(x, y0, 7 + Math.floor(t * 8)) * 7); for (let k = 2; k < h; k++) f.set(x, y0 - k, C.cycle[(x + k) % 8]); }
    }
  }

  class Cine {
    constructor(shots) {
      this.kind = 'cine';
      this.shots = shots;
      this.i = 0;
      this.t = 0;
      this.fired = new Set();
      this.prep();
    }
    sub(s) { return s.dur || (1.6 + s.text.length * 0.055) / ((this.g && this.g.textSpeed) || 1); }
    prep() {
      const sh = this.shots[this.i];
      if (!sh) return;
      let end = sh.dur || 0;
      for (const s of sh.subs || []) end = Math.max(end, s.at + this.sub(s));
      this.len = end + 0.35;
    }
    next() {
      this.i++; this.t = 0; this.fired.clear();
      if (this.i >= this.shots.length) { B.games.close(this, true); return; }
      this.prep();
    }
    update(dt) {
      if (this.g.skipping) { B.games.close(this, true); return; }
      this.t += dt;
      const sh = this.shots[this.i];
      for (const [at, name] of sh.sfx || []) if (this.t >= at && !this.fired.has(at + name)) { this.fired.add(at + name); this.g.sfx(name); }
      if (this.t >= this.len) this.next();
    }
    click() {
      if (this.t < 0.25) return;
      const sh = this.shots[this.i];
      const later = (sh.subs || []).filter(s => s.at > this.t + 0.05);
      const cur = (sh.subs || []).find(s => this.t >= s.at && this.t < s.at + this.sub(s));
      if (cur && later.length) this.t = later[0].at;
      else if (later.length && !cur) this.t = later[0].at;
      else this.next();
    }
    key(k) {
      if (k === 'Escape') { B.games.close(this, true); return true; }
      if (k === ' ' || k === 'Enter') { this.click(); return true; }
      return false;
    }
    render(f) {
      const sh = this.shots[this.i];
      if (!sh) return;
      const g = this.g, t = this.t;
      f.px.fill(C.black);
      sh.art(f, t, g, this);
      let fl = sh.flash ? sh.flash(t) : 0;
      if (g.softFlash) fl = Math.min(0.25, fl * 0.3);
      dither(f, fl, C.snow[4], BAR, f.h - BAR);
      const edge = Math.min(t / 0.3, (this.len - t) / 0.3, 1);
      if (!sh.cut) dither(f, 1 - edge, C.black, sh.bare ? 0 : BAR, sh.bare ? f.h : f.h - BAR);
      if (!sh.bare) { f.px.fill(C.black, 0, BAR * f.w); f.px.fill(C.black, (f.h - BAR) * f.w); }
      const s = (sh.subs || []).find(q => t >= q.at && t < q.at + this.sub(q));
      if (s) {
        const col = s.col || (B.EP1.COLORS && B.EP1.COLORS[s.who]) || C.snow[4];
        const text = s.name ? s.name + ': ' + s.text : s.text;
        const lines = B.font.wrap(text, 600);
        lines.forEach((l, i) => B.font.drawCentered(f, l, 320, f.h - BAR + 4 + i * 15 - (lines.length - 1) * 7, col, C.black));
      }
      if (sh.caption) B.font.draw(f, sh.caption, 16, BAR + 10, C.snow[4], C.black);
      if (!sh.bare) B.font.drawCentered(f, 'Esc: пропустить', 590, 12, C.stone[2], 0);
    }
  }

  function* play(g, shots) { return yield* B.games.play(g, new Cine(shots)); }

  function mallBg() { return cached('mall', 960, 480, b => B.BG.paintMall(b, false, true)); }
  function stormBg() { return cached('mallStorm', 960, 480, b => B.BG.paintMall(b, true)); }
  function carBuf(o) { return cached('car' + (o.dog ? 'd' : ''), 250, 100, b => B.BG.paintDeLorean(b, o)); }

  function titleArt(f, t) {
    crop(f, mallBg(), 220, 0, 0, 0, 640, 480);
    dither(f, 0.35, C.night[0], 0, 300);
    const run = Math.min(1, ((t * 0.5) % 6) / 1.2);
    fireTrails(f, Math.round(410 - run * 410), 410, [424, 431], t);
    blit(f, carBuf({ dog: false }), 400, 334, true);
  }

  function prologue() {
    const VF = (f, t) => {
      crop(f, mallBg(), 140, 0, 0, 0, 640, 480);
      sprite(f, 'bt_doc85', { dir: 'e', act: t > 3 ? 'reach' : '' }, 150, 420, 1);
      const vx = 2.4;
      let x = 680 - Math.max(0, t - 0.6) * 160 - Math.max(0, t - 1.6) * Math.max(0, t - 1.6) * 210;
      if (t < vx) blit(f, carBuf({ dog: true }), Math.round(x), 324);
      if (t >= vx) {
        const gone = 680 - (vx - 0.6) * 160 - (vx - 1.6) * (vx - 1.6) * 210;
        fireTrails(f, Math.round(gone) + 40, 700, [404, 418], t);
      }
      if (t > vx - 0.25 && t < vx) for (let i = 0; i < 30; i++) { const a = S.hash(i, 3, Math.floor(t * 30)) * 6.28; S.line(f, Math.round(x + 60), 370, Math.round(x + 60 + Math.cos(a) * 40), Math.round(370 + Math.sin(a) * 30), C.sky[4]); }
      mono(f, 0, BAR, 640, 400);
      for (const [cx, cy, sx, sy] of [[40, 70, 1, 1], [600, 70, -1, 1], [40, 410, 1, -1], [600, 410, -1, -1]]) { S.line(f, cx, cy, cx + sx * 26, cy, C.snow[4]); S.line(f, cx, cy, cx, cy + sy * 20, C.snow[4]); }
      if (Math.floor(t * 2) % 2 === 0) { const P = new Pen(f); P.part(P.ell(64, 88, 5, 5), C.red, { b: 3, sh: 0, hi: 0 }); }
      B.font.draw(f, 'REC', 76, 82, C.snow[4], C.black);
      B.font.draw(f, '1:20:' + String(Math.floor(t + 14)).padStart(2, '0') + ' AM', 470, 392, C.snow[4], C.black);
      B.font.draw(f, 'OCT 26 1985', 470, 376, C.snow[4], C.black);
    };
    return [
      { dur: 2.2, caption: '26 октября 1985, 1:20', art: (f, t) => { crop(f, mallBg(), 140 + Math.round(t * 8), 0, 0, 0, 640, 480); }, subs: [{ at: 0.4, text: 'Стоянка торгового центра «Две сосны».', col: C.snow[3] }] },
      { dur: 4.4, art: VF, subs: [{ at: 0.2, who: 'doc', name: 'Док', text: 'Если мои расчёты верны, то, когда эта малышка разгонится до восьмидесяти восьми миль в час...' }], sfx: [[2.4, 'boom']], flash: t => t > 2.4 && t < 2.7 ? (2.7 - t) * 3 : 0 }
    ];
  }

  function nightmare() {
    const sign = lone => cached('sign' + lone, 206, 106, b => B.BG.paintMallSign(b, lone));
    const N1 = (f, t) => {
      crop(f, stormBg(), 300, 0, 0, 0, 640, 480);
      const lone = Math.floor(t * 3.2) % 3 === 2 || (t > 1.4 && t < 1.7);
      blit(f, S.scaleBuf(sign(lone), 2), 114, 130);
      rain(f, t, 220, BAR, 440);
    };
    const N2 = (f, t) => {
      crop(f, stormBg(), 300, 0, 0, 0, 640, 480);
      dither(f, 0.5, C.night[0], BAR, 440);
      const spr = S.sprite('bt_doc85', { dir: 's', walk: -1, talk: t > 0.3 && t < 1.6 && Math.floor(t * 8) % 2 }, 2);
      const melt = Math.max(0, (t - 1.8) / 1.4);
      const b = spr.buf, x0 = 320 - Math.round(spr.ox), y0 = 440 - Math.round(spr.oy);
      for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
        const v = b.px[y * b.w + x];
        if (!v) continue;
        if (S.hash(x >> 1, y >> 1, 3) < melt * 1.15 - (1 - y / b.h) * 0.2) continue;
        f.set(x0 + x, y0 + y + Math.round(melt * melt * 30 * S.hash(x, 1, 2)), v);
      }
      rain(f, t, 160, BAR, 440);
    };
    return [
      { dur: 2.6, art: N1, flash: t => lightning(t, [0.2, 1.4]), sfx: [[0.2, 'boom'], [1.4, 'boom']], subs: [{ at: 0.3, text: 'Гроза. Вывеска мигает.', col: C.snow[3] }] },
      { dur: 3.4, art: N2, flash: t => lightning(t, [1.8]), sfx: [[1.8, 'boom']], subs: [{ at: 0.3, who: 'doc', name: 'Док', text: 'Прости, Марти...' }] }
    ];
  }

  function paintBedroom(b) {
    const P = new Pen(b);
    B.BG.dfill(b, 0, 0, b.w, 330, C.sky, (x, y) => 0.25 + B.BG.light([{ x: 470, y: 150, rx: 300, ry: 260, k: 0.4 }], x, y) * 0.8);
    B.BG.dfill(b, 0, 330, b.w, b.h, C.navy, (x, y) => 0.3 + (S.hash(x >> 1, y >> 1, 4) - 0.5) * 0.1);
    P.part(P.rect(410, 80, 140, 120), C.cream, { b: 3, sh: 1 });
    B.BG.dfill(b, 418, 88, 542, 192, [C.sky[3], C.sky[4], C.cream[4], C.glow, C.glow], (x, y) => 0.5 + (S.hash(x, y >> 2, 6) - 0.5) * 0.2);
    for (let y = 90; y < 192; y += 6) S.line(b, 418, y, 541, y, C.cream[2]);
    P.part(P.rect(40, 70, 90, 120), C.night, { b: 1, sh: 0 });
    P.part(P.path('M 62 150 L 64 104 Q 85 90 106 104 L 108 150 Z'), C.green, { b: 2, sh: 0 });
    P.part(P.rect(64, 96, 42, 12), C.raven, { b: 1, sh: 0 });
    for (const x of [72, 98]) b.set(x, 120, C.ledY);
    S.font.drawCentered(b, 'ФРАНКЕНШТЕЙН', 85, 172, C.green[4], 0);
    P.part(P.rect(150, 90, 100, 76), C.cream, { b: 4, sh: 0 });
    S.font.drawCentered(b, 'ОХ УЖ ЭТА', 200, 98, C.red[2], 0);
    S.font.drawCentered(b, 'НАУКА', 200, 110, C.red[2], 0);
    P.part(P.ell(200, 140, 18, 14), C.teal, { b: 3, sh: 0 });
    P.part(P.rect(270, 70, 110, 80), C.pink, { b: 3, sh: 0 });
    P.part(P.rect(270, 116, 110, 34), C.teal, { b: 3, sh: 0 });
    S.font.drawCentered(b, 'ПОЛИЦИЯ', 325, 82, C.snow[4], 0);
    S.font.drawCentered(b, 'МАЙАМИ', 325, 96, C.snow[4], 0);
    P.part(P.rect(290, 190, 54, 42), C.wood, { b: 3, sh: 0 });
    P.part(P.rect(294, 194, 46, 34), C.tan, { b: 3, sh: 0, hi: 0 });
    P.part(P.ell(317, 200, 6, 6), C.cream, { b: 2, sh: 0 });
    for (const x of [306, 330]) P.part(P.rect(x - 3, 210, 7, 16), C.tan, { b: 1, sh: 0 });
    P.part(P.rect(360, 196, 30, 22), C.snow, { b: 4, sh: 0 });
    P.part(P.ell(375, 206, 7, 7), C.stone, { b: 3, sh: 0 });
    P.part(P.rect(0, 250, 400, 110), C.wood, { b: 2, sh: 1 });
    P.part(P.rect(10, 270, 380, 70), C.vest, { b: 3, sh: 1 });
    for (let x = 20; x < 380; x += 30) S.line(b, x, 272, x, 338, C.vest[2]);
    P.part(P.rect(20, 254, 90, 30), C.snow, { b: 4, sh: 1 });
    P.part(P.rect(470, 260, 90, 100), C.raven, { b: 2, sh: 1 });
    P.part(P.ell(515, 300, 28, 28), C.stone, { b: 1, sh: 0 });
    for (let k = 0; k < 4; k++) P.part(P.ell(515, 300, 26 - k * 6, 26 - k * 6), C.stone, { b: 1 + (k % 2), sh: 0, hi: 0 });
    P.part(P.path('M 444 352 Q 430 330 440 300 L 452 230 L 460 230 L 458 300 Q 470 330 456 352 Z'), C.red, { b: 3, sh: 1 });
    S.line(b, 454, 230, 454, 330, C.snow[3]);
    P.part(P.rect(450, 214, 8, 18), C.wood, { b: 1, sh: 0 });
    P.part(P.rect(120, 404, 110, 10), C.raven, { b: 2, sh: 0 });
    for (const x of [136, 214]) P.part(P.ell(x, 418, 7, 7), C.gold, { b: 3, sh: 0 });
    P.part(P.rect(580, 60, 50, 290), C.wood, { b: 2, sh: 1 });
    P.part(P.ell(590, 210, 3, 3), C.gold, { b: 4, sh: 0 });
  }

  function bedroom() {
    const room = () => cached('bedroom', 640, 480, paintBedroom);
    const W1 = (f, t) => {
      blit(f, room(), 0, 0);
      const k = t < 0.5 ? Math.round(Math.sin(t * 60) * 3 * (0.5 - t) * 2) : 0;
      sprite(f, 'bt_marty', { dir: 's', act: 'sit', talk: t < 1.2 && Math.floor(t * 8) % 2 }, 170 + k, 330, 1.25);
    };
    const W2 = (f, t) => {
      blit(f, room(), 0, 0);
      sprite(f, 'bt_marty', { dir: 'e', act: 'sit' }, 170, 330, 1.25);
    };
    return [
      { dur: 1.6, cut: true, caption: '14 мая 1986', art: W1, sfx: [[0.05, 'boom']], subs: [{ at: 0.1, who: 'marty', name: 'Марти', text: 'ДОК!' }] },
      { dur: 1, art: W2, subs: [
        { at: 0.3, name: 'Лоррейн (за дверью)', col: C.pink[4], text: 'Марти, на дворе восемьдесят шестой год, конец света отменяется.' },
        { at: 0.3 + 3.6, name: 'Лоррейн (за дверью)', col: C.pink[4], text: 'Папа уже у Дока, вставай!' }
      ] }
    ];
  }

  function pickup(P, x, y, k) {
    const q = v => Math.round(v * k);
    P.part(P.rect(x, y - q(40), q(120), q(26)), C.red, { b: 2, sh: 1 });
    P.part(P.path(`M ${x + q(120)} ${y - q(14)} L ${x + q(120)} ${y - q(62)} L ${x + q(160)} ${y - q(62)} L ${x + q(178)} ${y - q(40)} L ${x + q(210)} ${y - q(36)} L ${x + q(214)} ${y - q(14)} Z`), C.red, { b: 3, sh: 1 });
    P.part(P.poly([x + q(128), y - q(58), x + q(156), y - q(58), x + q(170), y - q(40), x + q(128), y - q(40)]), C.sky, { b: 2, sh: 0, hi: 1 });
    P.part(P.rect(x - q(4), y - q(18), q(220), q(8)), C.steel, { b: 3, sh: 0 });
    P.part(P.rect(x - q(2), y - q(42), q(6), q(26)), C.red, { b: 1, sh: 0 });
    P.part(P.rect(x + q(204), y - q(30), q(8), q(5)), C.cream, { b: 4, sh: 0 });
    for (const wx of [x + q(34), x + q(174)]) { P.part(P.ell(wx, y - q(8), q(16), q(16)), C.raven, { b: 1, sh: 0 }); P.part(P.ell(wx, y - q(8), q(7), q(7)), C.steel, { b: 3, sh: 0 }); }
  }

  function skate() {
    const street = () => cached('street86', 960, 480, b => B.BG.paintStreet86(b));
    const ART = (f, t) => {
      crop(f, street(), Math.round(t * 90), 0, 0, 0, 640, 480);
      const P = new Pen(f);
      for (let i = 0; i < 14; i++) { const y = 330 + Math.floor(S.hash(i, 1, 2) * 100), x = Math.floor((S.hash(i, 2, 2) * 900 - t * 900) % 900 + 900) % 900 - 100; S.line(f, x, y, x + 40, y, C.stone[3]); }
      pickup(P, 176, 398, 1.9);
      const bob = Math.round(Math.sin(t * 18) * 1.5);
      P.part(P.rect(94, 418 + bob, 58, 5), C.raven, { b: 2, sh: 0 });
      for (const wx of [104, 142]) P.part(P.ell(wx, 425 + bob, 4, 4), C.gold, { b: 3, sh: 0 });
      sprite(f, 'bt_marty', { dir: 'e', act: 'reach' }, 126, 418 + bob, 1);
      sprite(f, 'bt_einstein', { dir: 'e', walk: (t * 2.6) % 1 }, 612, 396, 0.9);
    };
    return [{ dur: 3.4, art: ART, sfx: [[0.05, 'skate'], [0.1, 'whoosh']], subs: [{ at: 0.4, who: 'marty', name: 'Марти', text: 'Эйни! Не так быстро!' }] }];
  }

  function rewrite() {
    const page = (k, i) => cached('paper' + k + i, 640, 480, b => B.games.PAPERS[k][i](b));
    const ART = (f, t) => {
      rectFill(f, 0, 0, f.w, f.h, C.wood[0]);
      const a = page('v1', 1), b = page('v2', 0);
      const edge = 40 + Math.max(0, t - 1.2) * 260;
      for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
        const src = y < edge - 12 + JITTER[x] ? b : a;
        const v = src.px[y * f.w + x];
        if (v) f.px[y * f.w + x] = v;
      }
      if (t > 1.2 && edge < 470) for (let x = 70; x < 570; x++) if (S.hash(x, Math.floor(t * 20), 5) > 0.5) f.set(x, Math.round(edge + S.hash(x, 2, 3) * 10), C.hair[0]);
    };
    return [{ dur: 3.6, bare: true, art: ART, subs: [{ at: 1.3, text: 'Заголовок меняется на глазах.', col: C.snow[4] }] }];
  }

  function circuitsSet() {
    const ROWS = [['DESTINATION TIME', ['JUN', '13', '1931', 'AM', '04:00'], C.ledR], ['PRESENT TIME', ['MAY', '14', '1986', 'PM', '07:27'], C.ledG], ['LAST TIME DEPARTED', ['888', '88', '8888', '', '88:88'], C.ledY]];
    const ART = (f, t) => {
      scanlines(f, 3);
      ROWS.forEach(([label, vals, col], r) => {
        const y = 70 + r * 120;
        rectFill(f, 40, y, 560, 100, C.stone[0]);
        for (let k = 0; k < 560; k++) { f.set(40 + k, y, C.stone[2]); f.set(40 + k, y + 99, C.raven[0]); }
        let x = 60;
        vals.forEach((v, i) => {
          const w = [86, 56, 112, 36, 116][i];
          rectFill(f, x, y + 12, w, 52, C.black);
          const on = r < 2 ? (r === 0 ? t > 0.4 + i * 0.25 : true) : Math.floor(t * 6 + i) % 3 !== 0;
          if (v && on) bigText(f, v, x + w / 2, y + 22, 2, col, 0);
          x += w + 12;
        });
        rectFill(f, 200, y + 72, 240, 18, C.red[1]);
        S.font.drawCentered(f, label, 320, y + 76, C.snow[4], 0);
      });
    };
    return [{ dur: 3.2, art: ART, sfx: [[0.4, 'click'], [0.65, 'click'], [0.9, 'click'], [1.15, 'click'], [1.4, 'click']], subs: [{ at: 1.5, who: 'marty', name: 'Марти', text: 'Тринадцатое июня тысяча девятьсот тридцать первого. Держись, Док.' }] }];
  }

  function highwayBg(dusk) {
    return cached('hw' + (dusk ? 'd' : 'n'), 640, 480, b => {
      const P = new Pen(b);
      if (dusk) B.BG.dfill(b, 0, 0, 640, 300, C.dusk, (x, y) => 0.2 + y / 300 * 0.8);
      else { B.BG.dfill(b, 0, 0, 640, 300, C.night, (x, y) => 0.06 + y / 300 * 0.3); for (let i = 0; i < 60; i++) b.set(Math.floor(S.hash(i, 4, 1) * 640), Math.floor(S.hash(i, 5, 1) * 220), C.snow[3]); }
      for (let x = -40; x < 700; x += 60) P.part(P.ell(x + S.hash(x, 1, 3) * 30, 290, 70, 30 + S.hash(x, 2, 3) * 40), dusk ? C.dusk : C.night, { b: dusk ? 1 : 2, sh: 0, hi: 0, ol: 0 });
      B.BG.dfill(b, 0, 290, 640, 330, C.olive, (x, y) => (dusk ? 0.25 : 0.08) + (S.hash(x >> 1, y >> 1, 3) - 0.5) * 0.3);
      B.BG.dfill(b, 0, 330, 640, 480, C.char, (x, y) => (dusk ? 0.35 : 0.15) + (S.hash(x >> 1, y >> 1, 6) - 0.5) * 0.1);
    });
  }

  function roadLines(f, t, speed, dir, ys) {
    const sh = Math.floor(t * speed) * (dir || 1);
    for (const y of ys) for (let x = -120; x < 760; x += 120) { const xx = ((x - sh) % 120 + 120) % 120 + x - (x % 120 + 120) % 120; rectFill(f, xx, y, 60, 3, C.snow[3]); }
    for (let x = -300; x < 940; x += 300) { const xx = Math.round(((x - sh * 0.5) % 300 + 300) % 300 + x - (x % 300 + 300) % 300); rectFill(f, xx, 220, 5, 110, C.wood[1]); rectFill(f, xx - 14, 226, 34, 3, C.wood[1]); }
  }

  function sparks(f, x, y, w, h, t, n) {
    for (let i = 0; i < n; i++) {
      let px = x + S.hash(i, 1, Math.floor(t * 24)) * w, py = y + S.hash(i, 2, Math.floor(t * 24)) * h;
      for (let k = 0; k < 5; k++) { const nx = px + (S.hash(i, k, 9 + Math.floor(t * 24)) - 0.5) * 16, ny = py + (S.hash(k, i, 11 + Math.floor(t * 24)) - 0.5) * 14; S.line(f, Math.round(px), Math.round(py), Math.round(nx), Math.round(ny), k % 2 ? C.sky[4] : C.snow[4]); px = nx; py = ny; }
    }
  }

  function car31(P, x, y, ramp, police) {
    P.part(P.path(`M ${x} ${y - 14} L ${x + 4} ${y - 34} Q ${x + 30} ${y - 38} ${x + 54} ${y - 36} L ${x + 64} ${y - 62} L ${x + 120} ${y - 62} L ${x + 132} ${y - 36} L ${x + 168} ${y - 34} L ${x + 172} ${y - 14} Z`), ramp, { b: 2, sh: 1 });
    P.part(P.poly([x + 70, y - 58, x + 94, y - 58, x + 94, y - 38, x + 64, y - 38]), C.night, { b: 2, sh: 0, hi: 1 });
    P.part(P.poly([x + 98, y - 58, x + 118, y - 58, x + 126, y - 38, x + 98, y - 38]), C.night, { b: 2, sh: 0, hi: 1 });
    if (police) { P.part(P.rect(x + 66, y - 36, 60, 20), C.snow, { b: 4, sh: 0 }); star(P, x + 96, y - 26, 7); P.part(P.rect(x + 86, y - 68, 14, 6), C.red, { b: 4, sh: 0 }); }
    for (const [cx, r] of [[x + 30, 15], [x + 144, 15]]) { P.part(P.ell(cx, y - 8, r + 3, r), ramp, { b: 1, sh: 0 }); P.part(P.ell(cx, y - 4, r - 2, r - 2), C.raven, { b: 1, sh: 0 }); P.part(P.ell(cx, y - 4, 6, 6), C.steel, { b: 4, sh: 0 }); }
    P.part(P.ell(x + 170, y - 26, 4, 5), C.cream, { b: 4, sh: 0 });
  }

  function star(P, x, y, r) {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.42 : r; pts.push(x + Math.cos(a) * q, y + Math.sin(a) * q); }
    P.part(P.poly(pts), C.gold, { b: 3, sh: 0 });
  }

  function beam(f, x, y, len, dir) {
    for (let k = 0; k < len; k++) { const h = 4 + k * 0.25; for (let yy = -h; yy <= h; yy++) { const xx = x + k * dir; if (S.BAYER[(((y + yy) & 3) << 2) | (xx & 3)] < 0.45 * (1 - k / len)) f.set(xx, Math.round(y + yy), C.cream[4]); } }
  }

  function highway() {
    const car = () => cached('carM', 250, 100, b => B.BG.paintDeLorean(b, {}));
    const H1 = (f, t) => {
      blit(f, highwayBg(true), 0, 0);
      roadLines(f, t, 900, 1, [404]);
      blit(f, car(), 196 + Math.round(Math.sin(t * 20)), 336, true);
      if (t > 1.8) sparks(f, 200, 350, 240, 80, t, 6);
      beam(f, 446, 400, 160, 1);
    };
    const H2 = (f, t) => {
      scanlines(f, 4);
      rectFill(f, 160, 140, 320, 170, C.black);
      for (let k = 0; k < 320; k++) { f.set(160 + k, 140, C.stone[2]); f.set(160 + k, 309, C.stone[2]); }
      const mph = Math.min(88, Math.floor(72 + t * 11));
      bigText(f, String(mph), 300, 170, 7, mph >= 88 ? C.ledY : C.ledR, 0);
      B.font.draw(f, 'MPH', 420, 270, C.ledR, 0);
    };
    const H3 = (f, t) => {
      blit(f, highwayBg(true), 0, 0);
      roadLines(f, t, 900, 1, [404]);
      if (t < 0.5) { blit(f, car(), 196, 336, true); sparks(f, 190, 330, 260, 110, t, 14); }
      fireTrails(f, 0, t < 0.5 ? 220 : 640 - Math.round((t - 0.5) * 300), [416, 426], t);
    };
    return [
      { dur: 2.6, caption: '14 мая 1986, 19:27', art: H1, sfx: [[0.05, 'flux'], [0.1, 'engine'], [1.8, 'zap']], subs: [{ at: 0.5, text: 'Шоссе за городом.', col: C.snow[3] }] },
      { dur: 2.0, art: H2, subs: [{ at: 0.2, who: 'marty', name: 'Марти', text: 'Восемьдесят шесть... восемьдесят семь...' }] },
      { dur: 2.2, art: H3, sfx: [[0.45, 'boom']], flash: t => t > 0.45 && t < 0.9 ? (0.9 - t) * 2.2 : 0 }
    ];
  }

  function arrival() {
    const A1 = (f, t) => {
      blit(f, highwayBg(false), 0, 0);
      roadLines(f, t, 600, 1, [410]);
      const P = new Pen(f);
      car31(P, 430 + Math.round(t * 12), 436, C.plum, false);
      if (t > 0.9) { const k = Math.min(1, (t - 0.9) * 2); blit(f, cached('carM', 250, 100, b => B.BG.paintDeLorean(b, {})), 210, 336, true); if (k < 1) sparks(f, 210, 340, 250, 90, t, 12); }
      car31(P, 20 - Math.round(t * 6), 436, C.raven, true);
      beam(f, 192, 410, 140, 1);
      if (Math.floor(t * 6) % 2) { const Q = new Pen(f); Q.part(Q.ell(612, 380, 6, 4), C.ledY, { b: 4, sh: 0, hi: 0 }); }
    };
    const A2 = (f, t) => {
      blit(f, highwayBg(false), 0, 0);
      roadLines(f, t, 600, 1, [410]);
      const P = new Pen(f);
      const sw = Math.min(1, t / 1.2);
      blit(f, cached('carM', 250, 100, b => B.BG.paintDeLorean(b, {})), 300, 336, true);
      dither(f, 0.4 * (1 - sw), C.glow, BAR, 440);
      car31(P, 40 - Math.round(sw * 150), 436 + Math.round(sw * 24 + Math.sin(t * 30) * 3 * sw), C.raven, true);
      for (let i = 0; i < 24; i++) { const a = S.hash(i, 1, 2) * 3.14 + 3.14; P.part(P.ell(80 - sw * 80 + Math.cos(a) * 50 * sw, 420 + Math.sin(a) * 30 * sw, 5, 4), i % 3 ? C.olive : C.green, { b: 2, sh: 0 }); }
      car31(P, 460 + Math.round(t * 160), 436, C.plum, false);
    };
    const BB = (f, t) => {
      blit(f, highwayBg(false), 0, 0);
      const P = new Pen(f);
      blit(f, cached('carM', 250, 100, b => B.BG.paintDeLorean(b, {})), 260, 250);
      P.part(P.rect(150, 150, 340, 150), C.cream, { b: 3, sh: 1 });
      P.part(P.rect(156, 156, 328, 138), C.navy, { b: 2, sh: 0 });
      B.font.drawCentered(f, 'НАУЧНАЯ ВЫСТАВКА', 320, 168, C.gold[4], 0);
      B.font.drawCentered(f, 'ХИЛЛ-ВЭЛЛИ', 320, 186, C.gold[4], 0);
      bigText(f, 'АВТОМОБИЛЬ', 320, 212, 2, C.snow[4], C.black);
      bigText(f, 'БУДУЩЕГО', 320, 244, 2, C.snow[4], C.black);
      for (const x of [190, 446]) P.part(P.rect(x, 300, 8, 60), C.wood, { b: 2, sh: 0 });
      P.part(P.rect(530, 330, 70, 26), C.cream, { b: 3, sh: 0 });
      S.font.drawCentered(f, 'ХИЛЛ-ВЭЛЛИ', 565, 334, C.hair[0], 0);
      S.font.drawCentered(f, '2 МИЛИ', 565, 345, C.hair[0], 0);
      P.part(P.rect(562, 356, 6, 40), C.wood, { b: 2, sh: 0 });
      sprite(f, 'bt_marty31', { dir: 'e', walk: (t * 1.4) % 1 }, 140 + t * 70, 432, 1);
    };
    return [
      { dur: 2.6, caption: '13 июня 1931, 4:00', art: A1, sfx: [[0.3, 'gun'], [0.6, 'gun'], [0.9, 'boom'], [1.3, 'gun'], [1.7, 'gun']], flash: t => t > 0.9 && t < 1.2 ? (1.2 - t) * 3 : 0, subs: [{ at: 1.1, who: 'marty', name: 'Марти', text: 'Это что, перестрелка?!' }] },
      { dur: 2.4, art: A2, sfx: [[0.2, 'tire'], [1, 'crash']], subs: [{ at: 0.3, text: 'Жалюзи на стекле слепят Паркера. Полицейская машина слетает с дороги, гангстеры уходят.', col: C.snow[3] }] },
      { dur: 3.4, art: BB, subs: [{ at: 0.3, text: 'Машина спрятана за щитом выставки. До города две мили пешком.', col: C.snow[3] }] }
    ];
  }

  function paintLawOffice(b) {
    const P = new Pen(b);
    B.BG.dfill(b, 0, 0, 640, 320, C.wood, (x, y) => 0.25 + B.BG.light([{ x: 320, y: 100, rx: 380, ry: 260, k: 0.35 }], x, y));
    for (let x = 0; x < 640; x += 40) S.line(b, x, 0, x, 319, C.wood[1]);
    B.BG.dfill(b, 0, 320, 640, 480, C.maroon, (x, y) => 0.25 + (S.hash(x >> 1, y >> 1, 3) - 0.5) * 0.1);
    P.part(P.rect(220, 60, 200, 160), C.wood, { b: 1, sh: 0 });
    B.BG.dfill(b, 228, 68, 412, 212, C.sky, (x, y) => 0.75 - (y - 68) / 144 * 0.3);
    const sign = new Buf(200, 12);
    S.font.drawCentered(sign, 'ГЕЙЛ, ЗЕМЕКИС И ФАЙН', 100, 2, C.gold[4], 0);
    blit(b, sign, 220, 128, true);
    for (const x of [40, 520]) { P.part(P.rect(x, 140, 80, 180), C.steel, { b: 2, sh: 1 }); for (let y = 150; y < 320; y += 40) { P.part(P.rect(x + 6, y, 68, 34), C.steel, { b: 3, sh: 0 }); P.part(P.rect(x + 30, y + 14, 20, 4), C.gold, { b: 3, sh: 0 }); } }
    P.part(P.rect(160, 300, 320, 24), C.wood, { b: 3, sh: 1 });
    P.part(P.rect(170, 324, 300, 110), C.wood, { b: 2, sh: 1 });
    for (let x = 186; x < 460; x += 70) P.part(P.rect(x, 336, 54, 86), C.wood, { b: 1, sh: 0 });
    P.part(P.rect(200, 286, 60, 14), C.cream, { b: 4, sh: 0 });
    P.part(P.rect(380, 276, 30, 24), C.raven, { b: 2, sh: 0 });
  }

  function squareChase() {
    const sq = () => cached('sq31', 1600, 480, b => B.BG31.paintSquare31(b, false));
    const K1 = (f, t) => {
      const cx = Math.round(1040 - t * 260);
      crop(f, sq(), cx, 0, 0, 0, 640, 480);
      sprite(f, 'bt_marty31', { dir: 'w', walk: (t * 2.4) % 1 }, 200, 430, 1);
      sprite(f, 'bt_kid', { dir: 'w', walk: (t * 2.2) % 1 }, 420, 432, 1);
      sprite(f, 'bt_matches', { dir: 'w', walk: (t * 2.2 + 0.5) % 1 }, 520, 436, 1);
    };
    const K2 = (f, t) => {
      blit(f, cached('law', 640, 480, paintLawOffice), 0, 0);
      sprite(f, 'bt_emmett', { dir: 's', act: 'sit', talk: t < 1.6 && Math.floor(t * 8) % 2 }, 300, 330, 1);
      sprite(f, 'bt_marty31', { dir: 's', act: 'sit' }, 380, 336, 1);
      const P = new Pen(f);
      P.part(P.rect(160, 300, 320, 24), C.wood, { b: 3, sh: 1 });
      P.part(P.rect(170, 324, 300, 110), C.wood, { b: 2, sh: 1 });
      for (let x = 186; x < 460; x += 70) P.part(P.rect(x, 336, 54, 86), C.wood, { b: 1, sh: 0 });
      if (t > 2.4) sprite(f, 'bt_kid', { dir: 's', walk: -1 }, 320, 210, 0.6);
    };
    const K3 = (f, t) => {
      crop(f, sq(), 380, 0, 0, 0, 640, 480);
      const up = Math.min(1, t / 1.8);
      sprite(f, 'bt_marty31', { dir: 'n', act: 'reach' }, 226, 300 - Math.round(up * 140), 1);
      sprite(f, 'bt_kid', { dir: 'n', walk: -1 }, 120, 432, 1);
    };
    return [
      { dur: 2.8, art: K1, sfx: [[0.1, 'whoosh']], subs: [{ at: 0.2, who: 'kid', name: 'Кид', text: 'Держи его, Спичка!' }] },
      { dur: 1, art: K2, subs: [
        { at: 0.3, who: 'emmett', name: 'Эмметт', text: 'В школе меня звали Стрелой.' },
        { at: 2.6, who: 'kid', name: 'Кид (за дверью)', text: 'Я тебе всё нутро эвакуирую!' },
        { at: 5.0, who: 'matches', name: 'Спичка', text: 'Выпотрошу, босс. Слово такое: выпотрошу.' }
      ] },
      { dur: 2.4, art: K3, subs: [{ at: 0.3, text: 'Марти лезет на крышу эстрады.', col: C.snow[3] }] }
    ];
  }

  function smoke(f, x, y, t, n, spread) {
    const P = new Pen(f);
    for (let i = 0; i < n; i++) {
      const life = (t * 0.8 + S.hash(i, 1, 5)) % 1;
      const px = x + (S.hash(i, 2, 5) - 0.5) * spread * life, py = y - life * 90;
      P.part(P.ell(px, py, 4 + life * 14, 3 + life * 10), C.stone, { b: 3 - Math.floor(life * 2), sh: 0, hi: 0, ol: 0 });
    }
  }

  function drillBlast() {
    const sq = () => cached('sq31n', 1600, 480, b => B.BG31.paintSquare31(b, true));
    const drill = () => cached('drill2', 200, 60, b => { const d = new Buf(100, 30); B.BG31.paintDrill(d); const z = S.scaleBuf(d, 2); blit(b, z, 0, 0); });
    const D1 = (f, t) => {
      crop(f, sq(), 0, 0, 0, 0, 640, 480);
      const sh = Math.round(Math.sin(t * 50) * Math.min(3, t * 2));
      for (const [x0, x1] of [[200, 180], [200, 222], [260, 250]]) S.line(f, x0 + sh, 222, x1, 304, C.steel[2]);
      blit(f, drill(), 130 + sh, 192, true);
      sparks(f, 110, 190, 30, 40, t, 3 + Math.floor(t * 3));
      smoke(f, 230, 250, t, 10, 60);
      sprite(f, 'bt_marty31', { dir: 'w', act: 'reach' }, 380, 420, 1);
    };
    const D2 = (f, t) => {
      crop(f, sq(), 0, 0, 0, 0, 640, 480);
      const P = new Pen(f);
      for (let i = 0; i < 16; i++) {
        const a = S.hash(i, 1, 7) * Math.PI * 2, v = 120 + S.hash(i, 2, 7) * 220;
        const x = 200 + Math.cos(a) * v * t, y = 240 + Math.sin(a) * v * t + 260 * t * t;
        P.part(P.rect(x, y, 6 + (i % 3) * 4, 4 + (i % 2) * 4), i % 2 ? C.steel : C.red, { b: 2, sh: 0 });
      }
      smoke(f, 200, 260, t + 2, 16, 140);
      sprite(f, 'bt_marty31', { dir: 's', act: 'hold' }, 380, 420, 1);
    };
    return [
      { dur: 2.4, caption: '13 июня 1931, ночь', art: D1, sfx: [[0.2, 'engine'], [0.9, 'zap'], [1.6, 'zap']], subs: [{ at: 0.2, who: 'marty', name: 'Марти', text: 'Газ на восемь...' }] },
      { dur: 2.0, art: D2, sfx: [[0.05, 'explosion']], flash: t => t < 0.3 ? 0.9 - t * 3 : 0 }
    ];
  }

  function bike(P, f, x, y, t) {
    for (const wx of [x - 30, x + 30]) { P.part(P.ell(wx, y - 16, 16, 16), C.raven, { b: 1, sh: 0 }); P.part(P.ell(wx, y - 16, 12, 12), C.night, { b: 0, sh: 0, hi: 0, ol: 0 }); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI + t * 20; S.line(f, wx, y - 16, Math.round(wx + Math.cos(a) * 12), Math.round(y - 16 + Math.sin(a) * 12), C.steel[2]); } }
    for (const [x0, y0, x1, y1] of [[-30, -16, -6, -40], [-6, -40, 24, -40], [24, -40, 30, -16], [-6, -40, 4, -16], [4, -16, -30, -16], [4, -16, 24, -40]]) { S.line(f, x + x0, y + y0, x + x1, y + y1, C.pink[3]); S.line(f, x + x0, y + y0 + 1, x + x1, y + y1 + 1, C.pink[2]); }
    P.part(P.rect(x + 24, y - 54, 18, 12), C.wood, { b: 2, sh: 0 });
    P.part(P.rect(x - 40, y - 34, 44, 10), C.steel, { b: 3, sh: 0 });
    for (let k = 0; k < 30; k++) { const len = 16 + S.hash(k, Math.floor(t * 20), 3) * 26; f.set(Math.round(x - 40 - len * (k / 30)), Math.round(y - 29 + (S.hash(k, 2, Math.floor(t * 20)) - 0.5) * 8 * (k / 30)), C.cycle[(k + Math.floor(t * 12)) % 8]); }
    for (let k = 0; k < 40; k++) { const d = S.hash(k, 5, Math.floor(t * 20)) * 40; f.set(Math.round(x - 42 - d), Math.round(y - 29 + (S.hash(k, 6, Math.floor(t * 20)) - 0.5) * d * 0.4), C.cycle[k % 4]); }
  }

  function wagonBackSmall(P, x, y) {
    P.part(P.rect(x, y - 130, 120, 118), C.navy, { b: 2, sh: 1 });
    P.part(P.rect(x + 30, y - 120, 60, 26), C.raven, { b: 1, sh: 0, hi: 0 });
    for (let k = x + 34; k < x + 90; k += 8) P.part(P.rect(k, y - 120, 2, 26), C.steel, { b: 2, sh: 0 });
    star(P, x + 30, y - 60, 12); star(P, x + 90, y - 60, 12);
    P.part(P.rect(x - 6, y - 14, 132, 8), C.steel, { b: 2, sh: 0 });
    for (const wx of [x + 18, x + 102]) P.part(P.ell(wx, y - 4, 12, 12), C.raven, { b: 1, sh: 0 });
    for (const lx of [x + 4, x + 110]) P.part(P.rect(lx, y - 36, 6, 8), C.red, { b: 4, sh: 0 });
  }

  function rocketRide() {
    const R1 = (f, t) => {
      blit(f, highwayBg(false), 0, 0);
      const P = new Pen(f);
      const gx = 520 - t * 260;
      P.part(P.rect(gx, 250, 150, 80), C.cream, { b: 2, sh: 1 });
      P.part(P.rect(gx + 10, 230, 130, 22), C.red, { b: 2, sh: 0 });
      B.font.drawCentered(f, 'БЕНЗИН 17¢', gx + 75, 234, C.snow[4], 0);
      for (const px of [gx + 30, gx + 100]) { P.part(P.rect(px, 290, 16, 40), C.red, { b: 3, sh: 1 }); P.part(P.ell(px + 8, 286, 9, 9), C.cream, { b: 4, sh: 0 }); }
      roadLines(f, t, 1100, 1, [410]);
      bike(P, f, 300, 430, t);
      sprite(f, 'bt_marty31', { dir: 'e', act: 'sit' }, 296, 424, 1);
    };
    const R2 = (f, t) => {
      blit(f, highwayBg(false), 0, 0);
      roadLines(f, t, 500, 1, [410]);
      const P = new Pen(f);
      const k = Math.min(1, t / 1.6);
      wagonBackSmall(P, 380 - Math.round(k * 120), 430);
      if (t > 1.8) { for (const dx of [-10, 10]) P.part(P.ell(320 + dx, 330, 5, 4), C.skin, { b: 3, sh: 0 }); }
      bike(P, f, 170 + Math.round(k * 60), 432, t);
      sprite(f, 'bt_marty31', { dir: 'e', act: t > 1.4 ? 'reach' : 'sit' }, 166 + Math.round(k * 60), 426, 1);
    };
    return [
      { dur: 2.4, art: R1, sfx: [[0.1, 'missile']], subs: [{ at: 0.4, text: 'Шоссе за городом. Ракетный велосипед ревёт мимо заправки.', col: C.snow[3] }] },
      { dur: 1, art: R2, sfx: [[1.4, 'crack']], subs: [
        { at: 0.6, who: 'marty', name: 'Марти', text: 'Ты же Стрела, Док.' },
        { at: 3.0, who: 'doc', name: 'Док', text: 'Откуда ты знаешь это прозвище?' }
      ] }
    ];
  }

  function manure() {
    const truck = (P, f, x, y) => {
      P.part(P.rect(x, y - 90, 200, 70), C.olive, { b: 2, sh: 1 });
      P.part(P.rect(x + 200, y - 70, 60, 50), C.olive, { b: 3, sh: 1 });
      P.part(P.rect(x + 210, y - 64, 30, 22), C.night, { b: 2, sh: 0, hi: 1 });
      B.font.drawCentered(f, 'Д. ДЖОНС', x + 100, y - 78, C.cream[4], 0);
      B.font.drawCentered(f, 'ВЫВОЗ НАВОЗА', x + 100, y - 60, C.cream[4], 0);
      for (const wx of [x + 40, x + 160, x + 230]) P.part(P.ell(wx, y - 12, 16, 16), C.raven, { b: 1, sh: 0 });
      P.part(P.path(`M ${x} ${y - 90} Q ${x + 100} ${y - 130} ${x + 200} ${y - 90} Z`), C.wood, { b: 1, sh: 0 });
    };
    const M1 = (f, t) => {
      blit(f, highwayBg(false), 0, 0);
      const P = new Pen(f);
      truck(P, f, 330, 436);
      const k = Math.min(1, t / 1.1);
      if (t < 1.1) wagonBackSmall(P, 20 + Math.round(k * 240), 436 - Math.round(Math.sin(t * 14) * 4));
      else {
        wagonBackSmall(P, 260, 436);
        for (let i = 0; i < 40; i++) { const a = S.hash(i, 1, 3) * Math.PI, r = 30 + S.hash(i, 2, 3) * 80 * Math.min(1, (t - 1.1) * 2); P.part(P.ell(330 + Math.cos(a) * r, 340 - Math.sin(a) * r * 0.8 + (t - 1.1) * 60 * S.hash(i, 3, 3), 8, 6), C.wood, { b: 1 + (i % 2), sh: 0 }); }
        P.part(P.path('M 240 436 Q 330 300 420 436 Z'), C.wood, { b: 1, sh: 1 });
        const hy = 300 - (t - 1.1) * 120 + (t - 1.1) * (t - 1.1) * 80;
        P.part(P.rect(300 + (t - 1.1) * 40, hy, 26, 8), C.plum, { b: 2, sh: 0 });
        P.part(P.rect(306 + (t - 1.1) * 40, hy - 10, 14, 10), C.plum, { b: 2, sh: 0 });
      }
    };
    const M2 = f => {
      blit(f, highwayBg(false), 0, 0);
      roadLines(f, 0, 0, 1, [410]);
      const P = new Pen(f);
      P.part(P.poly([260, 432, 380, 420, 384, 426, 264, 438]), C.steel, { b: 2, sh: 0 });
      P.part(P.poly([380, 420, 392, 410, 396, 414, 384, 426]), C.steel, { b: 3, sh: 0 });
    };
    return [
      { dur: 2.6, art: M1, sfx: [[1.1, 'crash'], [1.25, 'splat']], subs: [{ at: 1.2, who: 'kid', name: 'Кид', text: 'Ой, чтоб тебя...' }] },
      { dur: 1.8, art: M2, subs: [{ at: 0.3, text: 'Монтировка остаётся лежать на дороге.', col: C.snow[3] }] }
    ];
  }

  function finale() {
    const BB = (f, t) => {
      blit(f, highwayBg(false), 0, 0);
      const P = new Pen(f);
      blit(f, cached('carM', 250, 100, b => B.BG.paintDeLorean(b, {})), 260, 250);
      P.part(P.rect(150, 150, 340, 150), C.cream, { b: 2, sh: 1 });
      P.part(P.rect(156, 156, 328, 138), C.navy, { b: 1, sh: 0 });
      bigText(f, 'АВТОМОБИЛЬ', 320, 196, 2, C.snow[3], C.black);
      bigText(f, 'БУДУЩЕГО', 320, 228, 2, C.snow[3], C.black);
      for (const x of [190, 446]) P.part(P.rect(x, 300, 8, 60), C.wood, { b: 2, sh: 0 });
      sprite(f, 'bt_doc31', { dir: 'e', walk: (t * 2) % 1 }, 120 + t * 90, 432, 1);
      sprite(f, 'bt_marty31', { dir: 'e', walk: (t * 2 + 0.5) % 1 }, 60 + t * 90, 436, 1);
    };
    const HAND = (f, t) => {
      blit(f, highwayBg(false), 0, 0);
      dither(f, 0.4, C.night[0], BAR, 440);
      const hand = cached('hand', 640, 480, b => {
        const Q = new Pen(b);
        Q.part(Q.path('M 250 480 L 262 330 Q 270 300 300 296 L 380 300 Q 404 306 404 334 L 400 480 Z'), C.skin, { b: 3, sh: 1 });
        for (const [x, top, w] of [[272, 150, 22], [302, 120, 24], [334, 130, 24], [364, 164, 22]]) Q.part(Q.path(`M ${x} 312 L ${x} ${top + 10} Q ${x + w / 2} ${top - 6} ${x + w} ${top + 10} L ${x + w} 312 Z`), C.skin, { b: 3, sh: 1 });
        Q.part(Q.path('M 262 360 Q 220 330 206 290 Q 204 276 218 278 Q 240 300 270 320 Z'), C.skin, { b: 3, sh: 1 });
        Q.part(Q.path('M 250 480 L 254 420 L 404 420 L 404 480 Z'), C.snow, { b: 4, sh: 1 });
      });
      const fade = Math.max(0, Math.min(1, (t - 0.6) / 2));
      for (let y = BAR; y < 440; y++) for (let x = 190; x < 420; x++) {
        const v = hand.px[y * 640 + x];
        if (!v) continue;
        const flick = Math.sin(t * 9 + y * 0.05) * 0.15;
        if (S.BAYER[((y & 3) << 2) | (x & 3)] < fade * 0.85 + flick * fade && y < 420) continue;
        f.px[y * f.w + x] = v;
      }
    };
    const TBC = (f, t) => {
      rectFill(f, 0, 0, f.w, f.h, C.black);
      const k = Math.min(1, t / 1.2);
      fireTrails(f, 120, 120 + Math.round(k * 400), [300, 310], t);
      bigText(f, 'ПРОДОЛЖЕНИЕ', 320, 170, 3, C.vest[4], C.maroon[0]);
      bigText(f, 'СЛЕДУЕТ', 320, 220, 3, C.vest[4], C.maroon[0]);
    };
    return [
      { dur: 2.4, caption: 'Щит выставки, ночь', art: BB, subs: [{ at: 0.2, who: 'doc', name: 'Док', text: 'Скорее в 1986 год, пока наши дела в прошлом не обрушились лавиной на будущее!' }] },
      { dur: 1, art: HAND, subs: [
        { at: 0.8, who: 'marty', name: 'Марти', text: 'Кажется, у нас проблема посерьёзнее.' },
        { at: 3.6, who: 'doc', name: 'Док', text: 'Великий Скотт!' }
      ] },
      { dur: 3.4, art: TBC, cut: true }
    ];
  }

  function creditsArt(f, t) {
    crop(f, mallBg(), 160 + Math.round(t * 4) % 160, 0, 0, 0, 640, 480);
    dither(f, 0.75, C.night[0], 0, 480);
  }

  B.cine = { Cine, play, titleArt, creditsArt, prologue, nightmare, bedroom, skate, rewrite, circuitsSet, highway, arrival, squareChase, drillBlast, rocketRide, manure, finale, car31, pickup, cached, crop, sprite, mono, dither, rain, lightning, fireTrails, BAR };
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
