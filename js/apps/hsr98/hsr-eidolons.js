(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const K = H.Cine.Kit, LW = K.LW, LH = K.LH, hx = K.hx, cl = K.cl, lerp = K.lerp, eOut = K.eOut;
  const CW = 32, CH = 30, COLS = 10, ROWS = 8, SC = 2;
  const SLOTS = [[3, 5], [3, 3], [4, 1], [5, 1], [6, 3], [6, 5]];
  const STAGE = { color: 1, decor: 3, life: 6 };
  const NUM = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const SCENES = {};
  const TAB = 0.09, JIT = 0.035;

  function cubic(out, p0, p1, p2, p3, n) {
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
      out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
    }
  }

  function tabEdge(ax, ay, bx, by, nx, ny, seed) {
    const L = Math.hypot(bx - ax, by - ay), j = k => (hx(seed, k, 57) * 2 - 1) * JIT, flip = hx(seed, 9, 57) < 0.5 ? 1 : -1;
    const a = j(1), b = j(2), c = j(3), d = j(4), e = j(5), t = TAB;
    const P = (u, v) => [ax + (bx - ax) * u + nx * L * v * flip, ay + (by - ay) * u + ny * L * v * flip];
    const out = [[ax, ay]];
    cubic(out, P(0, 0), P(0.2, a), P(0.5 + b + d, -t + c), P(0.5 - t + b, t + c), 7);
    cubic(out, P(0.5 - t + b, t + c), P(0.5 - 2 * t + b - d, 3 * t + c), P(0.5 + 2 * t + b - d, 3 * t + c), P(0.5 + t + b, t + c), 10);
    cubic(out, P(0.5 + t + b, t + c), P(0.5 + b + d, -t + c), P(0.8, e), P(1, 0), 7);
    return out;
  }

  let EDGES = null;
  function edges() {
    if (EDGES) return EDGES;
    const hor = [], ver = [], cw = CW * SC, ch = CH * SC;
    for (let r = 1; r < ROWS; r++) { hor[r] = []; for (let c = 0; c < COLS; c++) hor[r][c] = tabEdge(c * cw, r * ch, (c + 1) * cw, r * ch, 0, 1, r * 31 + c * 7 + 3); }
    for (let c = 1; c < COLS; c++) { ver[c] = []; for (let r = 0; r < ROWS; r++) ver[c][r] = tabEdge(c * cw, r * ch, c * cw, (r + 1) * ch, 1, 0, c * 53 + r * 11 + 5); }
    EDGES = { hor, ver };
    return EDGES;
  }

  const outlines = new Map();
  function outline(c, r) {
    const key = c + ',' + r;
    if (outlines.has(key)) return outlines.get(key);
    const E = edges(), cw = CW * SC, ch = CH * SC, x0 = c * cw, y0 = r * ch, x1 = x0 + cw, y1 = y0 + ch, pts = [];
    const add = (arr, rev) => { for (const p of rev ? arr.slice().reverse() : arr) pts.push(p); };
    add(r === 0 ? [[x0, y0], [x1, y0]] : E.hor[r][c]);
    add(c === COLS - 1 ? [[x1, y0], [x1, y1]] : E.ver[c + 1][r]);
    add(r === ROWS - 1 ? [[x1, y1], [x0, y1]] : E.hor[r + 1][c], true);
    add(c === 0 ? [[x0, y1], [x0, y0]] : E.ver[c][r], true);
    outlines.set(key, pts);
    return pts;
  }

  const slotPts = i => outline(SLOTS[i][0], SLOTS[i][1]);

  function trace(ctx, pts, dx, dy) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0] + dx, pts[0][1] + dy);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] + dx, pts[i][1] + dy);
    ctx.closePath();
  }

  function nodes() { return SLOTS.map(([c, r]) => [(c * CW + CW / 2) * SC, (r * CH + CH / 2) * SC]); }

  function slotRect(i) { const [c, r] = SLOTS[i]; return { x: c * CW * SC, y: r * CH * SC, w: CW * SC, h: CH * SC }; }

  let seamCv = null;
  function seams() {
    if (seamCv) return seamCv;
    const cv = G.mkCanvas(W, HGT), g = cv.getContext('2d'), E = edges();
    const stroke = (arr, col, o) => { g.strokeStyle = col; g.beginPath(); g.moveTo(arr[0][0] + o, arr[0][1] + o); for (let i = 1; i < arr.length; i++) g.lineTo(arr[i][0] + o, arr[i][1] + o); g.stroke(); };
    g.lineWidth = 1;
    const all = [];
    for (let r = 1; r < ROWS; r++) for (let c = 0; c < COLS; c++) all.push(E.hor[r][c]);
    for (let c = 1; c < COLS; c++) for (let r = 0; r < ROWS; r++) all.push(E.ver[c][r]);
    for (const e of all) stroke(e, 'rgba(255,246,222,0.2)', 1.5);
    for (const e of all) stroke(e, 'rgba(6,4,14,0.62)', 0.5);
    seamCv = cv;
    return cv;
  }

  let goldCv = null;
  function goldSeams() {
    if (goldCv) return goldCv;
    const cv = G.mkCanvas(W, HGT), g = cv.getContext('2d'), E = edges();
    const stroke = (arr, col, w, o) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(arr[0][0] + o, arr[0][1] + o); for (let i = 1; i < arr.length; i++) g.lineTo(arr[i][0] + o, arr[i][1] + o); g.stroke(); };
    const all = [];
    for (let r = 1; r < ROWS; r++) for (let c = 0; c < COLS; c++) all.push(E.hor[r][c]);
    for (let c = 1; c < COLS; c++) for (let r = 0; r < ROWS; r++) all.push(E.ver[c][r]);
    for (const e of all) stroke(e, 'rgba(90,50,10,0.55)', 2.4, 0.8);
    for (const e of all) stroke(e, 'rgba(232,184,82,0.95)', 1.4, 0);
    for (const e of all) stroke(e, 'rgba(255,240,190,0.7)', 0.5, -0.4);
    goldCv = cv;
    return cv;
  }

  function stageX(g, t) { return Object.assign({ g, t, S: H.Cine.stage(g, null, t) }, K); }

  function copyOf(src) {
    const cv = G.mkCanvas(src.width, src.height), g = cv.getContext('2d');
    g.drawImage(src, 0, 0);
    return cv;
  }

  function grayInPlace(cv) {
    const g = cv.getContext('2d'), img = g.getImageData(0, 0, cv.width, cv.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2], y = cl((v - 128) * 1.12 / 255 + 0.5) * 255;
      d[i] = d[i + 1] = d[i + 2] = y;
    }
    g.putImageData(img, 0, 0);
  }

  const outfitScenes = {};
  function sceneOf(key) {
    if (SCENES[key]) return SCENES[key];
    const o = H.OUTFITS && H.OUTFITS[key], cut = o && H.outfitCutOf ? H.outfitCutOf(key, 'eidolon') : null;
    if (!cut || !SCENES[o.char]) return null;
    return outfitScenes[key] || (outfitScenes[key] = Object.assign({}, SCENES[o.char], cut));
  }
  function keyOf(k, game, outfit) {
    const oid = outfit !== undefined ? outfit : H.wornOutfit ? H.wornOutfit(k, game) : null;
    return oid && H.OUTFITS[oid].char === k && sceneOf(oid) ? oid : k;
  }

  const pics = new Map();
  function pic(key) {
    let p = pics.get(key);
    if (p) return p;
    const sc = sceneOf(key);
    const paintOf = live => { const cv = G.mkCanvas(LW, LH), g = cv.getContext('2d'); g.imageSmoothingEnabled = false; sc.paint(g, stageX(g, 0), live); return cv; };
    const raw = paintOf(false);
    const colorD = copyOf(raw);
    H.Cine.dither(colorD.getContext('2d'));
    const grayD = copyOf(raw);
    grayInPlace(grayD);
    H.Cine.dither(grayD.getContext('2d'));
    let rawLive = null;
    p = { raw, colorD, grayD, live: () => rawLive || (rawLive = paintOf(true)) };
    pics.set(key, p);
    return p;
  }

  const bufs = { a: null, b: null };
  function liveFrame(key, t, decorK, lifeK) {
    const sc = sceneOf(key), p = pic(key);
    const a = bufs.a || (bufs.a = G.mkCanvas(LW, LH)), ga = a.getContext('2d');
    const paint = (g, decor, life) => {
      g.save();
      g.imageSmoothingEnabled = false;
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.drawImage(life ? p.live() : p.raw, 0, 0);
      const X = stageX(g, t);
      if (decor && sc.decor) sc.decor(g, t, X);
      if (life && sc.life) sc.life(g, t, X);
      g.restore();
    };
    paint(ga, decorK >= 1, lifeK >= 1);
    const mid = (decorK > 0 && decorK < 1) ? decorK : (lifeK > 0 && lifeK < 1) ? lifeK : 0;
    if (mid) {
      const b = bufs.b || (bufs.b = G.mkCanvas(LW, LH)), gb = b.getContext('2d');
      paint(gb, decorK > 0, lifeK > 0);
      ga.save(); ga.globalAlpha = mid; ga.drawImage(b, 0, 0); ga.restore();
    }
    H.Cine.dither(ga);
    return a;
  }

  class Assembly {
    constructor(from, to) {
      this.from = from; this.to = to; this.t = -0.35; this.steps = []; this.cue = 0; this.done = false;
      let at = 0;
      const step = (kind, n, d) => { this.steps.push({ kind, n, at, d }); at += d; };
      for (let n = from + 1; n <= to; n++) {
        step('fly', n, 0.55);
        step('snap', n, 0.32);
        if (n === STAGE.color) step('color', n, 1.05);
        if (n === STAGE.decor) step('decor', n, 0.85);
        if (n === STAGE.life) step('life', n, 1.4);
      }
      this.total = at;
    }
    tick(dt, ui) {
      this.t += dt;
      while (this.cue < this.steps.length && this.steps[this.cue].at <= this.t) {
        const s = this.steps[this.cue++];
        if (ui) ui.sfx({ fly: 'swing', snap: 'glint', color: 'anchor', decor: 'buff', life: 'star5' }[s.kind]);
      }
      if (this.t >= this.total + 0.25) this.done = true;
    }
    find(kind, n) { return this.steps.find(s => s.kind === kind && (n == null || s.n === n)); }
    kOf(kind, stage) {
      if (this.from >= stage) return 1;
      if (this.to < stage) return 0;
      const s = this.find(kind);
      return s ? cl((this.t - s.at) / s.d) : 0;
    }
    shown() { return this.from + this.steps.filter(s => s.kind === 'snap' && s.at <= this.t).length; }
    current(kind) {
      const s = this.steps.find(x => x.kind === kind && this.t >= x.at && this.t < x.at + x.d);
      return s ? { n: s.n, p: cl((this.t - s.at) / s.d) } : null;
    }
  }

  function view(key, eid, asm) {
    if (asm) return { shown: asm.shown(), colorK: asm.kOf('color', STAGE.color), decorK: asm.kOf('decor', STAGE.decor), lifeK: asm.kOf('life', STAGE.life) };
    const n = Math.max(0, Math.min(6, eid || 0));
    return { shown: n, colorK: n >= STAGE.color ? 1 : 0, decorK: n >= STAGE.decor ? 1 : 0, lifeK: n >= STAGE.life ? 1 : 0 };
  }

  const pieceCache = new Map();
  function pieceImage(key, i) {
    const id = key + '|' + i;
    if (pieceCache.has(id)) return pieceCache.get(id);
    const R = slotRect(i), pad = 16, pts = slotPts(i), p = pic(key);
    const cv = G.mkCanvas(R.w + pad * 2, R.h + pad * 2), g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.save();
    g.drawImage(p.colorD, 0, 0, LW, LH, pad - R.x, pad - R.y, LW * SC, LH * SC);
    g.globalCompositeOperation = 'destination-in';
    trace(g, pts, pad - R.x, pad - R.y); g.fillStyle = '#ffffff'; g.fill();
    g.restore();
    g.lineWidth = 1.5; g.strokeStyle = 'rgba(242,220,154,0.9)'; trace(g, pts, pad - R.x, pad - R.y); g.stroke();
    const out = { cv, pad, R };
    pieceCache.set(id, out);
    return out;
  }

  function hole(ui, c, i) {
    const pts = slotPts(i), R = slotRect(i);
    c.save();
    trace(c, pts, 0, 0); c.clip();
    ui.fullBg(c);
    const gr = c.createRadialGradient(R.x + R.w / 2, R.y + R.h / 2, 4, R.x + R.w / 2, R.y + R.h / 2, R.w * 0.8);
    gr.addColorStop(0, 'rgba(120,140,255,0.16)'); gr.addColorStop(1, 'rgba(2,3,16,0.35)');
    c.fillStyle = gr; c.fillRect(R.x - 20, R.y - 20, R.w + 40, R.h + 40);
    c.lineWidth = 7; c.strokeStyle = 'rgba(0,0,0,0.6)'; trace(c, pts, 0, 0); c.stroke();
    c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.5)'; trace(c, pts, 1, 2); c.stroke();
    c.restore();
    c.lineWidth = 1; c.strokeStyle = 'rgba(201,164,92,0.75)'; trace(c, pts, 0.5, 0.5); c.stroke();
  }

  function backdrop(ui, c, k, eid, o = {}) {
    const key = keyOf(k, ui.game, o.outfit), t = ui.t, asm = o.asm || null, V = view(key, eid, asm), p = pic(key);
    const was = c.imageSmoothingEnabled;
    c.imageSmoothingEnabled = false;
    if (V.colorK <= 0) c.drawImage(p.grayD, 0, 0, W, HGT);
    else {
      const frame = V.decorK > 0 || V.lifeK > 0 ? liveFrame(key, t, V.decorK, V.lifeK) : p.colorD;
      if (V.colorK >= 1) c.drawImage(frame, 0, 0, W, HGT);
      else {
        c.drawImage(p.grayD, 0, 0, W, HGT);
        const [nx, ny] = nodes()[0], rad = eOut(V.colorK) * 820;
        c.save(); c.beginPath(); c.arc(nx, ny, Math.max(1, rad), 0, Math.PI * 2); c.clip();
        c.drawImage(frame, 0, 0, W, HGT);
        c.restore();
        c.save(); c.globalCompositeOperation = 'lighter';
        c.strokeStyle = 'rgba(255,236,190,' + (0.55 * (1 - V.colorK)).toFixed(3) + ')'; c.lineWidth = 6;
        c.beginPath(); c.arc(nx, ny, Math.max(1, rad), 0, Math.PI * 2); c.stroke();
        c.restore();
      }
    }
    c.imageSmoothingEnabled = was;
    const seamA = 1 - V.lifeK;
    if (seamA > 0) { c.save(); c.globalAlpha = seamA * (V.colorK > 0 ? 0.8 : 0.65); c.drawImage(seams(), 0, 0); c.restore(); }
    if (V.lifeK > 0 && sceneOf(key) && sceneOf(key).seams === 'gold') { c.save(); c.globalAlpha = V.lifeK; c.drawImage(goldSeams(), 0, 0); c.restore(); }
    if (V.lifeK > 0 && V.lifeK < 1) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const x = lerp(-200, W + 200, V.lifeK), gr = c.createLinearGradient(x - 160, 0, x + 160, 0);
      gr.addColorStop(0, 'rgba(255,220,140,0)'); gr.addColorStop(0.5, 'rgba(255,230,170,0.35)'); gr.addColorStop(1, 'rgba(255,220,140,0)');
      c.fillStyle = gr; c.fillRect(0, 0, W, HGT);
      c.restore();
    }
    if (V.decorK > 0 && V.decorK < 1) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 26; i++) {
        const x = hx(i, 3, 71) * 440 + 10, y = 60 + hx(i, 4, 71) * 380, a = Math.sin(V.decorK * Math.PI) * (0.4 + 0.6 * hx(i, 5, 71));
        c.fillStyle = 'rgba(255,240,200,' + a.toFixed(3) + ')'; c.fillRect(Math.round(x), Math.round(y), 2, 2);
      }
      c.restore();
    }
    for (let i = V.shown; i < 6; i++) hole(ui, c, i);
    const fly = asm && asm.current('fly'), snap = asm && asm.current('snap');
    if (o.sel != null && !asm && !o.view) {
      const pts = slotPts(o.sel), pulse = 0.5 + 0.5 * Math.sin(t * 5);
      c.save();
      c.lineWidth = 3; c.strokeStyle = 'rgba(20,12,4,0.55)'; trace(c, pts, 0.5, 1.5); c.stroke();
      c.lineWidth = o.focus ? 2 : 1.5; c.strokeStyle = 'rgba(242,220,154,' + (o.focus ? 0.65 + 0.35 * pulse : 0.55).toFixed(3) + ')'; trace(c, pts, 0.5, 0.5); c.stroke();
      if (o.sel < V.shown) { c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,236,190,' + (0.05 + 0.05 * pulse).toFixed(3) + ')'; trace(c, pts, 0, 0); c.fill(); }
      c.restore();
    }
    if (snap) {
      const pts = slotPts(snap.n - 1), a = 1 - snap.p;
      c.save(); c.globalCompositeOperation = 'lighter';
      c.lineWidth = 2 + 4 * a; c.strokeStyle = 'rgba(255,240,190,' + (0.85 * a).toFixed(3) + ')'; trace(c, pts, 0, 0); c.stroke();
      c.fillStyle = 'rgba(255,244,214,' + (0.4 * a).toFixed(3) + ')'; trace(c, pts, 0, 0); c.fill();
      const [nx, ny] = nodes()[snap.n - 1];
      for (let k = 0; k < 10; k++) {
        const ang = k / 10 * Math.PI * 2 + snap.n, d = 20 + snap.p * 46;
        c.fillStyle = 'rgba(255,236,170,' + a.toFixed(3) + ')'; c.fillRect(Math.round(nx + Math.cos(ang) * d) - 1, Math.round(ny + Math.sin(ang) * d * 0.9) - 1, 3, 3);
      }
      c.restore();
    }
    if (fly) {
      const im = pieceImage(key, fly.n - 1), R = im.R, e = eOut(fly.p);
      const sx = 306, sy = HGT + 40, tx = R.x + R.w / 2, ty = R.y + R.h / 2;
      const x = lerp(sx, tx, e), y = lerp(sy, ty, e) - Math.sin(e * Math.PI) * 60, rot = (1 - e) * (fly.n % 2 ? 0.7 : -0.7), s = lerp(1.35, 1, e);
      c.save();
      c.translate(x + 7, y + 9); c.rotate(rot); c.scale(s, s);
      c.globalAlpha = 0.35; c.fillStyle = '#000000';
      trace(c, slotPts(fly.n - 1), -tx, -ty); c.fill();
      c.restore();
      c.save();
      c.translate(x, y); c.rotate(rot); c.scale(s, s);
      c.imageSmoothingEnabled = false;
      c.drawImage(im.cv, -R.w / 2 - im.pad, -R.h / 2 - im.pad);
      c.restore();
    }
    return V;
  }

  function shade(c, view) {
    if (view) return;
    let gr = c.createLinearGradient(0, 0, 210, 0);
    gr.addColorStop(0, 'rgba(4,6,22,0.86)'); gr.addColorStop(0.7, 'rgba(4,6,22,0.5)'); gr.addColorStop(1, 'rgba(4,6,22,0)');
    c.fillStyle = gr; c.fillRect(0, 0, 210, HGT);
    gr = c.createLinearGradient(0, 0, 0, 58);
    gr.addColorStop(0, 'rgba(4,6,22,0.82)'); gr.addColorStop(1, 'rgba(4,6,22,0)');
    c.fillStyle = gr; c.fillRect(0, 0, W, 58);
    gr = c.createLinearGradient(0, HGT - 40, 0, HGT);
    gr.addColorStop(0, 'rgba(4,6,22,0)'); gr.addColorStop(1, 'rgba(4,6,22,0.8)');
    c.fillStyle = gr; c.fillRect(0, HGT - 40, W, 40);
  }

  const closedLooks = new WeakMap();
  function closedOf(look) {
    let v = closedLooks.get(look);
    if (!v) { v = Object.assign({}, look, { closed: true }); closedLooks.set(look, v); }
    return v;
  }
  const WAIST = { m: 42, tall: 41, slim: 41, lean: 41, petite: 45, f: 40.5, tallf: 39.5, small: 57.5 };

  function figure(c, look, x, y, s, t, k, seed) {
    if (!(k > 0) || look.style) { G.drawFigure(c, look, x, y, s); return; }
    const sd = (String(seed || '').split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) % 97) / 97 * 4;
    const blink = ((t + sd) % 4.1) < 0.14 || ((t + sd) % 4.1 > 0.32 && (t + sd) % 4.1 < 0.44 && hx(Math.floor((t + sd) / 4.1), 2, 19) > 0.6);
    const cv = G.figureCanvas(blink && k >= 1 ? closedOf(look) : look);
    const up = Math.sin((t + sd) * Math.PI * 2 / 3.4) > 0.15 && k >= 1 ? 1 : 0;
    const cut = Math.round(WAIST[look.body] || 41), FW = G.FIG_W, FH = G.FIG_H;
    const X0 = Math.round(x - FW / 2 * s), Y0 = Math.round(y - G.FIG_FOOT * s);
    const was = c.imageSmoothingEnabled;
    c.imageSmoothingEnabled = false;
    c.drawImage(cv, 0, cut - 1, FW, FH - cut + 1, X0, Y0 + (cut - 1) * s, FW * s, (FH - cut + 1) * s);
    c.drawImage(cv, 0, 0, FW, cut, X0, Y0 - up * s, FW * s, cut * s);
    c.imageSmoothingEnabled = was;
  }

  const rgba = (rgb, a) => 'rgba(' + rgb + ',' + cl(a).toFixed(3) + ')';
  const AURA = {
    ice(c, t, x, y, k) {
      for (let i = 0; i < 16; i++) {
        const ph = (t * 0.22 + hx(i, 1, 41)) % 1, px = x + (hx(i, 2, 41) - 0.5) * 150 + Math.sin(t + i) * 6, py = y - 30 - ph * 250;
        const a = Math.sin(ph * Math.PI) * k, r = hx(i, 3, 41) > 0.7 ? 3 : 2;
        c.fillStyle = rgba('220,246,255', a); c.beginPath(); c.moveTo(px, py - r); c.lineTo(px + r, py); c.lineTo(px, py + r); c.lineTo(px - r, py); c.fill();
      }
    },
    fire(c, t, x, y, k) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 22; i++) {
        const ph = (t * 0.45 + hx(i, 1, 43)) % 1, px = x + (hx(i, 2, 43) - 0.5) * 130 + Math.sin(t * 2 + i) * 8, py = y - 10 - ph * 220;
        c.fillStyle = rgba(hx(i, 4, 43) > 0.5 ? '255,170,70' : '255,110,40', (1 - ph) * 0.9 * k); c.fillRect(Math.round(px), Math.round(py), 2, 2);
      }
      c.restore();
    },
    elec(c, t, x, y, k, col) {
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineWidth = 1.5;
      const f = Math.floor(t * 9);
      for (let i = 0; i < 3; i++) {
        if (hx(i, f, 45) > 0.55) continue;
        let px = x + (hx(i, f, 46) - 0.5) * 140, py = y - 60 - hx(i, f, 47) * 200;
        c.strokeStyle = rgba(col || '200,170,255', 0.9 * k); c.beginPath(); c.moveTo(px, py);
        for (let s = 0; s < 4; s++) { px += (hx(i, s + f, 48) - 0.5) * 18; py += 7 + hx(s, i, 49) * 6; c.lineTo(px, py); }
        c.stroke();
      }
      c.restore();
    },
    wind(c, t, x, y, k, col) {
      c.save(); c.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const ph = (t * 0.35 + i / 4) % 1, cy = y - 40 - i * 55, rx = 70 + i * 6;
        c.strokeStyle = rgba(col || '200,255,230', Math.sin(ph * Math.PI) * 0.6 * k);
        c.beginPath(); c.ellipse(x, cy, rx, 14, 0, ph * Math.PI * 2, ph * Math.PI * 2 + 1.6); c.stroke();
      }
      c.restore();
    },
    quant(c, t, x, y, k) {
      const f = Math.floor(t * 6);
      for (let i = 0; i < 12; i++) {
        if (hx(i, f, 51) > 0.6) continue;
        const px = x + (hx(i, f, 52) - 0.5) * 150, py = y - 30 - hx(i, f, 53) * 240;
        c.fillStyle = rgba(i % 2 ? '170,120,255' : '110,90,230', 0.75 * k); c.fillRect(Math.round(px), Math.round(py), 2 + (i % 3) * 2, 2);
      }
    },
    imag(c, t, x, y, k) {
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.3 + i / 3) % 1;
        c.strokeStyle = rgba('200,160,255', (1 - ph) * 0.55 * k);
        c.beginPath(); c.ellipse(x, y - 6, 30 + ph * 70, 7 + ph * 16, 0, 0, Math.PI * 2); c.stroke();
      }
      for (let i = 0; i < 8; i++) { const a = t * 0.8 + i * 0.785, px = x + Math.cos(a) * 64, py = y - 130 + Math.sin(a) * 18; c.fillStyle = rgba('255,214,120', 0.7 * k); c.fillRect(Math.round(px), Math.round(py), 2, 2); }
      c.restore();
    },
    phys(c, t, x, y, k) {
      for (let i = 0; i < 14; i++) {
        const ph = (t * 0.18 + hx(i, 1, 55)) % 1, px = x + (hx(i, 2, 55) - 0.5) * 160, py = y - ph * 260;
        c.fillStyle = rgba('255,244,214', Math.sin(ph * Math.PI) * 0.7 * k); c.fillRect(Math.round(px), Math.round(py), 1, 1);
      }
      const p = 0.5 + 0.5 * Math.sin(t * 2.2);
      c.save(); c.globalCompositeOperation = 'lighter';
      const gr = c.createRadialGradient(x, y - 170, 1, x, y - 170, 26);
      gr.addColorStop(0, rgba('170,230,255', 0.5 * p * k)); gr.addColorStop(1, rgba('170,230,255', 0));
      c.fillStyle = gr; c.fillRect(x - 26, y - 196, 52, 52);
      c.restore();
    },
    butterfly(c, t, x, y, k) {
      for (let i = 0; i < 7; i++) {
        const a = t * (0.5 + hx(i, 1, 57) * 0.4) + i * 0.9, px = x + Math.cos(a) * (60 + i * 6), py = y - 90 - i * 22 + Math.sin(a * 1.7) * 14;
        const flap = Math.abs(Math.sin(t * 9 + i)) * 4 + 1;
        c.fillStyle = rgba(i % 2 ? '180,120,255' : '120,90,240', 0.85 * k);
        c.fillRect(Math.round(px - flap), Math.round(py - 2), Math.round(flap), 4); c.fillRect(Math.round(px + 1), Math.round(py - 2), Math.round(flap), 4);
        c.fillStyle = rgba('240,220,255', 0.9 * k); c.fillRect(Math.round(px), Math.round(py - 2), 1, 4);
      }
    },
    petal(c, t, x, y, k) {
      for (let i = 0; i < 14; i++) {
        const ph = (t * 0.12 + hx(i, 1, 59)) % 1, px = x + (hx(i, 2, 59) - 0.5) * 220 + Math.sin(t * 1.3 + i) * 14, py = y - 290 + ph * 300;
        c.fillStyle = rgba(i % 3 ? '255,236,240' : '248,196,214', Math.sin(ph * Math.PI) * 0.9 * k);
        c.fillRect(Math.round(px), Math.round(py), 3, 2); c.fillRect(Math.round(px + 1), Math.round(py - 1), 1, 1);
      }
    },
    heal(c, t, x, y, k) {
      for (let i = 0; i < 9; i++) {
        const ph = (t * 0.3 + hx(i, 1, 61)) % 1, px = Math.round(x + (hx(i, 2, 61) - 0.5) * 130), py = Math.round(y - 20 - ph * 230);
        c.fillStyle = rgba('150,255,180', Math.sin(ph * Math.PI) * 0.8 * k); c.fillRect(px - 1, py - 3, 3, 7); c.fillRect(px - 3, py - 1, 7, 3);
      }
    },
    swords(c, t, x, y, k) {
      for (let i = 0; i < 4; i++) {
        const a = t * 0.9 + i * Math.PI / 2, px = x + Math.cos(a) * 82, py = y - 150 + Math.sin(a) * 26, front = Math.sin(a) > 0;
        c.save(); c.translate(px, py); c.rotate(-0.9 + Math.cos(a) * 0.2);
        c.fillStyle = rgba('200,236,255', (front ? 0.95 : 0.5) * k); c.fillRect(-1, -18, 3, 26);
        c.fillStyle = rgba('216,176,80', (front ? 0.95 : 0.5) * k); c.fillRect(-4, 6, 9, 2); c.fillRect(0, 8, 1, 6);
        c.restore();
      }
    },
    stars(c, t, x, y, k) {
      for (let i = 0; i < 12; i++) {
        const tw = 0.5 + 0.5 * Math.sin(t * (2 + hx(i, 1, 63) * 3) + i), px = Math.round(x + (hx(i, 2, 63) - 0.5) * 170), py = Math.round(y - 40 - hx(i, 3, 63) * 240);
        c.fillStyle = rgba('255,236,180', tw * 0.9 * k); c.fillRect(px - 2, py, 5, 1); c.fillRect(px, py - 2, 1, 5);
      }
    },
    svarog(c, t, x, y, k) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const p = 0.6 + 0.4 * Math.sin(t * 1.6), gr = c.createRadialGradient(x + 70, y - 220, 2, x + 70, y - 220, 60);
      gr.addColorStop(0, rgba('255,46,142', 0.45 * p * k)); gr.addColorStop(1, rgba('255,46,142', 0));
      c.fillStyle = gr; c.fillRect(x + 10, y - 280, 120, 120);
      c.restore();
      AURA.phys(c, t, x, y, k * 0.6);
    },
    notes(c, t, x, y, k) {
      AURA.elec(c, t, x, y, k * 0.8, '150,200,255');
      for (let i = 0; i < 5; i++) {
        const ph = (t * 0.25 + i / 5) % 1, px = Math.round(x + 60 + Math.sin(ph * 6 + i) * 16 - i * 34), py = Math.round(y - 120 - ph * 150);
        c.fillStyle = rgba('255,236,170', Math.sin(ph * Math.PI) * 0.9 * k); c.fillRect(px, py, 4, 3); c.fillRect(px + 3, py - 9, 1, 10); c.fillRect(px + 4, py - 9, 3, 1);
      }
    },
    coins(c, t, x, y, k) {
      AURA.wind(c, t, x, y, k * 0.7, '170,255,200');
      for (let i = 0; i < 6; i++) {
        const ph = (t * 0.5 + i / 6) % 1, px = Math.round(x + (hx(i, 1, 65) - 0.5) * 120), py = Math.round(y - 260 + ph * 240), w = Math.max(1, Math.round(Math.abs(Math.cos(t * 6 + i)) * 4));
        c.fillStyle = rgba('255,214,90', Math.sin(ph * Math.PI) * k); c.fillRect(px - w / 2, py, w, 4);
      }
    },
    puppet(c, t, x, y, k) {
      AURA.ice(c, t, x, y, k * 0.7);
      for (let i = 0; i < 6; i++) {
        const a = t * 2.4 + i * 1.047, px = Math.round(x + Math.cos(a) * 46), py = Math.round(y - 120 + Math.sin(a) * 10);
        c.fillStyle = rgba('200,150,255', 0.8 * k); c.fillRect(px - 1, py - 1, 3, 3);
      }
    }
  };

  function aura(c, kind, x, y, t, k) {
    const fn = AURA[kind];
    if (fn && k > 0) { c.save(); fn(c, t, x, y, k); c.restore(); }
  }

  function scene(ui, c, k, eid, asm, outfit) {
    const g = ui.game, forced = outfit !== undefined, look = forced && outfit ? H.outfitLook(outfit, g.state.gender) : G.lookOf(g.kitOf(k), forced ? null : g);
    const V = backdrop(ui, c, k, eid, { asm, view: true, outfit });
    const gr = c.createRadialGradient(306, 444, 4, 306, 444, 70);
    gr.addColorStop(0, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.save(); c.translate(306, 444); c.scale(1, 0.22); c.translate(-306, -444); c.fillStyle = gr; c.fillRect(226, 374, 160, 140); c.restore();
    if (V.lifeK > 0) aura(c, sceneOf(keyOf(k, g, outfit)).aura, 306, 444, ui.t, V.lifeK);
    figure(c, look, 306, 444, 3, ui.t, V.lifeK, k);
    return V;
  }

  function syncAsm(s, g, k) {
    if (s.asm && s.asmK === k) return;
    if (s.asm && s.asmK !== k) skipAsm(s, g);
    const n = g.eidNew(k);
    if (n > 0 && SCENES[k]) { const r = g.state.roster[k]; s.asm = new Assembly(r.eid - n, r.eid); s.asmK = k; }
  }
  function tickAsm(s, dt, ui, g) {
    if (!s.asm) return;
    s.asm.tick(dt, ui);
    if (s.asm.done) skipAsm(s, g);
  }
  function skipAsm(s, g) {
    if (s.asmK && g.state.roster[s.asmK]) g.seeEid(s.asmK);
    s.asm = null; s.asmK = null;
  }

  function stageName(n) { return n >= STAGE.life ? 'Сцена живёт' : n >= STAGE.decor ? 'Декор ожил' : n >= STAGE.color ? 'Цвет' : 'Чёрно-белая'; }
  function stageGift(i) { const n = i + 1; return n === STAGE.color ? 'вернёт картине цвет' : n === STAGE.decor ? 'оживит декор картины' : n === STAGE.life ? 'оживит героя и всю сцену' : 'добавит фрагмент картины'; }

  Object.assign(H.UI.prototype, {
    openEidolonView(start) {
      const ui = this, g = this.game, E = H.Eidolons;
      return this.push({
        full: true, k: start, asm: null, asmK: null,
        tick(dt) { tickAsm(this, dt, ui, g); },
        draw(c) {
          const k = this.k, r = g.state.roster[k], kit = H.CHARS[g.kitOf(k)], sc = sceneOf(keyOf(k, g));
          syncAsm(this, g, k);
          const V = scene(ui, c, k, r.eid, this.asm);
          const name = k === 'trail' ? g.state.name : kit.name, cap = name + ' · ' + sc.title;
          const w = Math.max(250, Math.round(ui.measure(cap, 13, true, true) + 40)), x = Math.round(W / 2 - w / 2), y = HGT - 54;
          ui.win(x, y, w, 40, { alpha: 0.82 });
          ui.text(cap, W / 2, y + 7, { align: 'center', size: 13, bold: true, serif: true, col: C.gold });
          ui.text('Эйдолоны ' + V.shown + ' / 6 · ' + stageName(V.shown), W / 2, y + 24, { align: 'center', size: 10, col: C.sub });
          if (this.asm) ui.hit(0, 0, W, HGT, () => skipAsm(this, g));
          else {
            ui.hints([['Q/E', 'Персонаж'], ['Esc', 'Назад']], W - 12, 12, { align: 'right' });
            ui.hit(0, 0, W, HGT, () => ui.pop());
          }
        },
        key(kk, code) {
          if (this.asm) { skipAsm(this, g); return; }
          const list = ui.rosterKeys().filter(x => SCENES[x]), i = list.indexOf(this.k);
          if ((code === 'KeyQ' || kk === 'left') && list.length) { this.k = list[(i - 1 + list.length) % list.length]; ui.sfx('select'); return; }
          if ((code === 'KeyE' || kk === 'right') && list.length) { this.k = list[(i + 1) % list.length]; ui.sfx('select'); return; }
          if (kk === 'back' || kk === 'ok' || code === 'KeyV') ui.pop();
        }
      });
    }
  });

  H.Eidolons = { SCENES, sceneOf, keyOf, SLOTS, STAGE, NUM, CW, CH, COLS, ROWS, SC, has: k => !!SCENES[k], nodes, slotRect, outline, slotPts, backdrop, scene, shade, figure, aura, view, pic, Assembly, syncAsm, tickAsm, skipAsm, stageName, stageGift, AURA };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
