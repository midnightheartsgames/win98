(function (S) {
  'use strict';
  const { W, H, C, Buf, Pen, blit, font } = S;
  const CLOSEUPS = S.CLOSEUPS = S.CLOSEUPS || {};
  const BG = S.BG;
  const cache = new Map();

  function cached(key, w, h, fn) {
    if (cache.has(key)) return cache.get(key);
    const b = new Buf(w, h);
    fn(new Pen(b), b);
    cache.set(key, b);
    return b;
  }

  function bigText(f, text, cx, y, s, col, hi, shadow) {
    const w = font.measure(text) * s;
    let x = Math.round(cx - w / 2);
    const m = new S.Mask(0, 0, f.w, f.h);
    for (const ch of text) {
      const g = font.glyph(ch);
      for (let i = 0; i < g.bits.length; i += 2) for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) m.put(x + g.bits[i] * s + dx, y + g.bits[i + 1] * s + dy, 1);
      x += (g.w + 1) * s;
    }
    if (shadow) m.each((px, py) => { for (let k = 1; k <= shadow; k++) if (!m.has(px + k, py + k)) f.set(px + k, py + k, C.black); });
    m.each((px, py) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!m.has(px + dx, py + dy)) f.set(px + dx, py + dy, C.black); });
    const y0 = y, y1 = y + 7 * s;
    m.each((px, py) => {
      const t = (py - y0) / (y1 - y0);
      f.set(px, py, !m.has(px, py - 1) ? hi : (t > 0.55 && S.dith(px, py, (t - 0.55) * 2.2)) ? S.DARKER[col] : col);
    });
  }

  function starfield(f, seed, ramp) {
    const m = new S.Mask(0, 0, W, H); m.m.fill(1);
    S.grad(f, m, ramp, (x, y) => y / H * 0.9);
    for (let i = 0; i < 70; i++) f.set(Math.floor(S.hash(i, seed, 1) * W), Math.floor(S.hash(i, seed, 2) * H * 0.7), S.hash(i, seed, 3) > 0.5 ? C.grey[5] : C.yellow[4]);
  }

  CLOSEUPS.titlecard = function (f, g, cu) {
    const t = g.time - cu.t0;
    starfield(f, 7, [C.night[0], C.night[1], C.purple[1], C.plum[2]]);
    const sam = S.sprite('sam', { dir: 's' }, 1.6);
    const max = S.sprite('max', { dir: 's', act: 'grin' }, 1.6);
    const bob = Math.round(Math.sin(t * 3) * 2);
    S.BG.pool(f, 160, 185, 120, 26, 1.5);
    blit(f, sam.buf, 190 - sam.ox, 196 - sam.oy);
    blit(f, max.buf, 118 - max.ox, 196 - max.oy + (bob > 0 ? -bob : 0));
    bigText(f, 'SAM & MAX', 160, 18, 4, C.orange[3], C.yellow[4], 2);
    if (t > 1) bigText(f, cu.lines[1] || '', 160, 58, 2, C.sky[3], C.sky[4], 1);
    if (t > 1.8) bigText(f, cu.lines[2] || '', 160, 78, 3, C.red[3], C.orange[4], 2);
  };

  function tvFrame(f) {
    const bg = cached('tvframe', W, H, (P, b) => {
      const m = new S.Mask(0, 0, W, H); m.m.fill(1);
      S.grad(b, m, C.wood, (x, y) => 0.2 + y / H * 0.3);
      BG.planks(b, P.poly([0, 150, 320, 150, 320, 200, 0, 200]), 160, 60, C.wood, { step: 26 });
      P.part(P.poly([36, 6, 284, 4, 290, 158, 30, 160]), C.grey, { b: 2 });
      P.part(P.poly([48, 16, 238, 14, 240, 146, 46, 148]), C.grey, { b: 0, sh: 0, hi: 0 });
      P.part(P.rect(250, 30, 24, 10), C.grey, { b: 4, sh: 0 });
      P.part(P.ell(262, 64, 9, 9), C.grey, { b: 3 });
      P.part(P.ell(262, 94, 9, 9), C.grey, { b: 3 });
      P.part(P.rect(250, 120, 24, 22), C.grey, { b: 1 });
      for (let i = 0; i < 5; i++) P.line(252, 123 + i * 4, 272, 123 + i * 4, C.grey[0]);
      P.line(120, 4, 90, -30, C.black);
      P.line(200, 4, 232, -30, C.black);
    });
    blit(f, bg, 0, 0);
  }

  const SCREEN = { x0: 52, y0: 20, x1: 236, y1: 142 };

  function screenMask() {
    const m = new S.Mask(SCREEN.x0, SCREEN.y0, SCREEN.x1 - SCREEN.x0, SCREEN.y1 - SCREEN.y0);
    m.m.fill(1);
    return m;
  }

  function scanlines(f) {
    for (let y = SCREEN.y0; y < SCREEN.y1; y += 2) for (let x = SCREEN.x0; x < SCREEN.x1; x++) {
      const i = y * W + x;
      f.px[i] = S.DARKER[f.px[i]];
    }
    for (let x = SCREEN.x0; x < SCREEN.x1; x++) { f.set(x, SCREEN.y0, C.grey[0]); f.set(x, SCREEN.y1 - 1, C.grey[0]); }
  }

  function progEyebo(f, t) {
    const m = screenMask();
    const cx = 144, cy = 80;
    m.each((x, y) => {
      const a = Math.atan2(y - cy, x - cx), r = Math.hypot(x - cx, (y - cy) * 1.3);
      const k = Math.floor((a * 3 + r * 0.18 - t * 4) / 1.1);
      f.set(x, y, C.cycle[((k % 8) + 8) % 8]);
    });
    const P = new Pen(f).at(cx, cy + 14, 3.2);
    S.art.bradyHead(P, 0, 0, { act: 'hypno', talk: Math.floor(t * 8) % 3 !== 0, t });
  }

  function progAnchor(f, t, who) {
    const m = screenMask();
    S.grad(f, m, C.blue, (x, y) => 0.2 + (y - 20) / 200);
    const P = new Pen(f);
    P.part(P.rect(140, 40, 84, 50), C.sky, { b: 3 });
    const img = who === 'brady' ? 'brady' : 'poppers';
    const ic = S.art.portrait(img);
    blit(f, S.scaleBuf(ic, 3), 146, 38);
    P.part(P.rect(52, 112, 184, 30), C.wood, { b: 2 });
    const a = new Pen(f).at(96, 112, 1.6);
    a.part(a.ell(0, -14, 13, 10), C.hair, { b: 3 });
    a.part(a.rect(-14, -8, 28, 14), C.pink, { b: 3 });
    S.art.sybilHead(a.scaled(0, -24, 1), 0, -24, { talk: Math.floor(t * 8) % 3 !== 0, blink: Math.floor(t * 2) % 7 === 0 });
    font.draw(f, who === 'brady' ? 'КТО ТАКОЙ БРЭДИ?' : 'НОВОСТИ 13', 56, 24, C.yellow[4]);
  }

  function progSitcom(f, t, who) {
    const m = screenMask();
    S.grad(f, m, C.pink, (x, y) => 0.35 + (y - 20) / 260);
    const P = new Pen(f);
    P.part(P.poly([52, 112, 236, 112, 236, 142, 52, 142]), C.teal, { b: 2, sh: 0 });
    P.part(P.rect(64, 60, 40, 52), C.oak, { b: 3 });
    P.part(P.rect(180, 50, 44, 30), C.sky, { b: 4 });
    for (let i = 0; i < 6; i++) f.set(186 + i * 6, 56 + (i % 2) * 4, C.red[3]);
    const kinds = ['specs', 'whizzer', 'peepers'];
    kinds.forEach((k, i) => {
      const star = k === who;
      const act = star ? (k === 'specs' ? 'spray' : k === 'peepers' ? 'run' : 'basket') : '';
      const walk = star && k === 'peepers' ? (t * 1.5) % 1 : -1;
      const spr = S.sprite(k, { dir: 's', act, walk, talk: star && Math.floor(t * 8) % 3 !== 0, t, v: star && k === 'whizzer' ? '' : '' }, star ? 1.5 : 1.1);
      let x = 90 + i * 55;
      if (star && k === 'peepers') x = 60 + ((t * 70) % 170);
      blit(f, spr.buf, Math.round(x - spr.ox), Math.round((star ? 140 : 132) - spr.oy));
    });
    font.draw(f, '1982', 206, 24, C.grey[5]);
    font.draw(f, 'СОДА-ПОППЕРЫ', 58, 24, C.yellow[4]);
  }

  function progBradyPhoto(f, t) {
    const m = screenMask();
    S.grad(f, m, C.gold, (x, y) => 0.3 + (y - 20) / 220);
    const P = new Pen(f);
    P.part(P.rect(84, 30, 110, 100), C.grey, { b: 5 });
    P.part(P.rect(90, 36, 98, 80), C.sky, { b: 3, sh: 0 });
    const q = new Pen(f).at(139, 90, 2.4);
    S.art.bradyHead(q, 0, 0, { talk: Math.floor(t * 8) % 3 !== 0, blink: false });
    font.drawCentered(f, 'Брэди Калчер, 1981', 139, 120, C.grey[1], 0);
  }

  CLOSEUPS.tv = function (f, g, cu) {
    const t = g.time - cu.t0;
    tvFrame(f);
    if (cu.prog === 'eyebo') progEyebo(f, t);
    else if (cu.prog === 'news') progAnchor(f, t, 'news');
    else if (cu.prog === 'brady') progBradyPhoto(f, t);
    else if (cu.prog === 'specs' || cu.prog === 'whizzer' || cu.prog === 'peepers') progSitcom(f, t, cu.prog);
    else progSitcom(f, t, 'whizzer');
    scanlines(f);
  };

  const TITLE_ITEMS = ['Новая игра', 'Продолжить', 'Загрузить', 'Настройки', 'Выход'];

  S.TITLE = {
    items: TITLE_ITEMS,
    draw(f, t, hover, enabled) {
      starfield(f, 11, [C.night[0], C.night[1], C.night[2], C.purple[2], C.plum[3]]);
      const P = new Pen(f);
      const street = cached('titlestreet', W, 80, (Q) => {
        for (let i = 0; i < 12; i++) {
          const x = i * 28 - 6, h = 30 + Math.floor(S.hash(i, 3, 1) * 40);
          Q.part(Q.rect(x, 80 - h, 26, h), C.night, { b: 1, sh: 0, hi: 0, ol: C.night[0] });
          for (let yy = 80 - h + 4; yy < 76; yy += 6) for (let xx = x + 3; xx < x + 23; xx += 5) if (S.hash(xx, yy, 2) > 0.55) Q.b.set(xx, yy, C.lamp);
        }
      });
      blit(f, street, 0, 96);
      P.part(P.rect(0, 170, W, 30), C.asphalt, { b: 1, sh: 0, hi: 0, ol: 0 });
      S.BG.pool(f, 230, 186, 90, 20, 1.6);
      const sam = S.sprite('sam', { dir: 'w', talk: Math.floor(t * 0.5) % 4 === 1 && Math.floor(t * 8) % 2 === 0 ? 1 : 0, blink: Math.floor(t * 2) % 9 === 0 }, 1.5);
      const max = S.sprite('max', { dir: 'w', act: 'grin', walk: -1 }, 1.5);
      blit(f, sam.buf, 272 - sam.ox, 192 - sam.oy);
      blit(f, max.buf, 208 - max.ox, 192 - max.oy - (Math.floor(t * 2.5) % 2 ? 3 : 0));
      bigText(f, 'SAM & MAX', 100, 14, 3, C.orange[3], C.yellow[4], 2);
      bigText(f, 'КУЛЬТУРНЫЙ ШОК', 100, 44, 2, C.red[3], C.orange[4], 1);
      font.drawCentered(f, 'ЭПИЗОД 101', 100, 64, C.sky[4]);
      TITLE_ITEMS.forEach((s, i) => {
        const on = enabled[i];
        const col = !on ? C.grey[2] : hover === i ? C.yellow[4] : C.grey[5];
        font.draw(f, (hover === i && on ? '» ' : '  ') + s, 30, 90 + i * 14, col);
      });
      font.draw(f, '(c) 2000 LucasArts. Win 98 Edition', 4, 190, C.grey[2]);
    },
    hit(x, y) {
      for (let i = 0; i < TITLE_ITEMS.length; i++) if (x >= 26 && x < 150 && y >= 88 + i * 14 && y < 100 + i * 14) return i;
      return -1;
    }
  };

  S.bigText = bigText;
  S.starfield = starfield;
  S.tvCache = cache;
  S.tvArt = { tvFrame, scanlines, screenMask, SCREEN, cached };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
