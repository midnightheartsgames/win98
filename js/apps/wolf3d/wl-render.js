(function (W) {
  'use strict';
  const D = W.Data, G = W.Gfx;
  const SW = 320, SH = 200, ASPECT = 1.2, PLANE = 0.72;
  const hexRGB = s => G.hex(s);
  const PIX = {
    A: '.#.|#.#|###|#.#|#.#', B: '##.|#.#|##.|#.#|##.', C: '.##|#..|#..|#..|.##', D: '##.|#.#|#.#|#.#|##.', E: '###|#..|##.|#..|###', F: '###|#..|##.|#..|#..',
    G: '.##|#..|#.#|#.#|.##', H: '#.#|#.#|###|#.#|#.#', I: '###|.#.|.#.|.#.|###', J: '..#|..#|..#|#.#|.#.', K: '#.#|#.#|##.|#.#|#.#', L: '#..|#..|#..|#..|###',
    M: '#...#|##.##|#.#.#|#...#|#...#', N: '#..#|##.#|#.##|#..#|#..#', O: '.#.|#.#|#.#|#.#|.#.', P: '##.|#.#|##.|#..|#..', Q: '.#.|#.#|#.#|##.|.##',
    R: '##.|#.#|##.|#.#|#.#', S: '.##|#..|.#.|..#|##.', T: '###|.#.|.#.|.#.|.#.', U: '#.#|#.#|#.#|#.#|###', V: '#.#|#.#|#.#|#.#|.#.',
    W: '#...#|#...#|#.#.#|##.##|#...#', X: '#.#|#.#|.#.|#.#|#.#', Y: '#.#|#.#|.#.|.#.|.#.', Z: '###|..#|.#.|#..|###',
    'Б': '###|#..|##.|#.#|##.', 'Г': '###|#..|#..|#..|#..', 'Д': '.###|.#.#|.#.#|####|#..#', 'Ж': '#.#.#|#.#.#|.###.|#.#.#|#.#.#', 'З': '##.|..#|.#.|..#|##.',
    'И': '#..#|#.##|##.#|#..#|#..#', 'Л': '.##|#.#|#.#|#.#|#.#', 'П': '###|#.#|#.#|#.#|#.#', 'У': '#.#|#.#|.##|..#|##.', 'Ф': '.###.|#.#.#|#.#.#|.###.|..#..',
    'Ц': '#.#.|#.#.|#.#.|####|...#', 'Ч': '#.#|#.#|.##|..#|..#', 'Ш': '#.#.#|#.#.#|#.#.#|#.#.#|#####', 'Щ': '#.#.#.|#.#.#.|#.#.#.|######|.....#',
    'Ъ': '##..|.#..|.##.|.#.#|.##.', 'Ы': '#...#|#...#|##..#|#.#.#|##..#', 'Ь': '#..|#..|##.|#.#|##.', 'Э': '##.|..#|.##|..#|##.',
    'Ю': '#.##.|#.#.#|###.#|#.#.#|#.##.', 'Я': '.##|#.#|.##|#.#|#.#',
    0: '###|#.#|#.#|#.#|###', 1: '.#.|##.|.#.|.#.|###', 2: '##.|..#|.#.|#..|###', 3: '##.|..#|.#.|..#|##.', 4: '#.#|#.#|###|..#|..#',
    5: '###|#..|##.|..#|##.', 6: '.##|#..|###|#.#|###', 7: '###|..#|.#.|.#.|.#.', 8: '###|#.#|###|#.#|###', 9: '###|#.#|###|..#|##.',
    '.': '.|.|.|.|#', ',': '.|.|.|#|#', ':': '.|#|.|#|.', '-': '...|...|###|...|...', '/': '..#|..#|.#.|#..|#..', '!': '#|#|#|.|#', '?': '##.|..#|.#.|...|.#.',
    '(': '.#|#.|#.|#.|.#', ')': '#.|.#|.#|.#|#.', '%': '#.#|..#|.#.|#..|#.#', "'": '#|#|.|.|.', '+': '...|.#.|###|.#.|...', '—': '...|...|###|...|...',
    '«': '....|.#.#|#.#.|.#.#|....', '»': '....|#.#.|.#.#|#.#.|....', '←': '...|.#.|###|.#.|...', '→': '...|.#.|###|.#.|...'
  };
  const PIX_ALIAS = { 'А': 'A', 'В': 'B', 'Е': 'E', 'Ё': 'E', 'Й': 'И', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X' };
  const PIX_CACHE = {};
  function pixGlyph(ch) {
    let k = ch.toUpperCase();
    if (PIX_ALIAS[k]) k = PIX_ALIAS[k];
    if (PIX_CACHE[k]) return PIX_CACHE[k];
    if (k === ' ') return (PIX_CACHE[k] = { w: 3, h: 5, bits: new Uint8Array(15), adv: 3 });
    const def = PIX[k];
    if (!def) return null;
    const rows = def.split('|'), w = rows[0].length, bits = new Uint8Array(w * 5);
    rows.forEach((r, y) => { for (let x = 0; x < w; x++) bits[y * w + x] = r[x] === '#' ? 1 : 0; });
    return (PIX_CACHE[k] = { w, h: 5, bits, adv: w + 1 });
  }

  class Renderer {
    constructor() {
      this.fb = new Uint32Array(SW * SH);
      this.tex = G.buildTextures();
      this.texList = [null].concat(D.TEXTURES.map(n => this.tex[n]));
      this.statics = G.staticSprites();
      this.weapons = G.weaponSprites();
      this.faces = G.faces();
      this.digits = G.digits();
      this.misc = G.misc();
      this.zbuf = new Float32Array(SW);
      this.font = null;
      this.setViewSize(19);
    }

    setViewSize(size) {
      this.viewSize = Math.max(4, Math.min(20, size));
      this.vw = this.viewSize * 16;
      this.vh = this.viewSize * 8;
      this.vx = (SW - this.vw) >> 1;
      this.vy = Math.max(0, (160 - this.vh) >> 1);
    }

    fill(x, y, w, h, c) {
      const fb = this.fb;
      const x0 = Math.max(0, x | 0), y0 = Math.max(0, y | 0), x1 = Math.min(SW, (x + w) | 0), y1 = Math.min(SH, (y + h) | 0);
      for (let j = y0; j < y1; j++) fb.fill(c, j * SW + x0, j * SW + x1);
    }

    blit(pic, x, y, opt = {}) {
      const s = opt.scale || 1, fb = this.fb;
      const w = Math.round(pic.w * s), h = Math.round(pic.h * s);
      for (let j = 0; j < h; j++) {
        const Y = (y | 0) + j;
        if (Y < 0 || Y >= SH) continue;
        const sy = Math.min(pic.h - 1, Math.floor(j / s));
        for (let i = 0; i < w; i++) {
          const X = (x | 0) + i;
          if (X < 0 || X >= SW) continue;
          const sx = Math.min(pic.w - 1, Math.floor(i / s));
          const c = pic.px[sy * pic.w + (opt.flip ? pic.w - 1 - sx : sx)];
          if (c) fb[Y * SW + X] = opt.tint ? opt.tint(c) : c;
        }
      }
    }

    bevel(x, y, w, h, light, dark) {
      this.fill(x, y, w, 1, light); this.fill(x, y, 1, h, light);
      this.fill(x, y + h - 1, w, 1, dark); this.fill(x + w - 1, y, 1, h, dark);
    }

    glyph(ch, font) { return font === 'pix' ? pixGlyph(ch) : this.font ? this.font.glyph(ch, font) : null; }

    textWidth(str, font = 'small') {
      if (!this.font && font !== 'pix') return str.length * 6;
      let w = 0;
      for (const ch of str) { const g = this.glyph(ch, font); w += g ? g.adv : 4; }
      return w;
    }

    text(str, x, y, color, font = 'small', align = 'left', shadow = 0) {
      if (!this.font && font !== 'pix') return;
      str = String(str);
      const w = this.textWidth(str, font);
      let cx = align === 'center' ? Math.round(x - w / 2) : align === 'right' ? x - w : x;
      const fb = this.fb;
      for (const ch of str) {
        const g = this.glyph(ch, font);
        if (!g) { cx += 4; continue; }
        for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) {
          if (!g.bits[j * g.w + i]) continue;
          if (shadow) { const X = cx + i + 1, Y = y + j + 1; if (X >= 0 && X < SW && Y >= 0 && Y < SH && !(j + 1 < g.h && i + 1 < g.w && g.bits[(j + 1) * g.w + i + 1])) fb[Y * SW + X] = shadow; }
          const X = cx + i, Y = y + j;
          if (X >= 0 && X < SW && Y >= 0 && Y < SH) fb[Y * SW + X] = typeof color === 'function' ? color(i, j, g) : color;
        }
        cx += g.adv;
      }
      return w;
    }

    drawBorder() {
      const bg = G.rgb(0, 64, 64);
      this.fill(0, 0, SW, 160, bg);
      const { vx, vy, vw, vh } = this;
      if (vw < SW) this.bevel(vx - 1, vy - 1, vw + 2, vh + 2, G.rgb(0, 24, 24), G.rgb(0, 120, 120));
    }

    drawView(g, opts = {}) {
      const { vx, vy, vw, vh } = this, fb = this.fb;
      const ceil = hexRGB(g.level.ceil), floor = G.rgb(112, 112, 112);
      const horizon = vy + (vh >> 1);
      for (let y = vy; y < vy + vh; y++) fb.fill(y < horizon ? ceil : floor, y * SW + vx, y * SW + vx + vw);
      const ca = Math.cos(g.angle), sa = Math.sin(g.angle);
      const plx = -sa * PLANE, ply = ca * PLANE;
      const focal = (vw / 2) / PLANE;
      this.cam = { ca, sa, plx, ply, focal, horizon };
      const ox = g.px, oy = g.py;
      for (let x = 0; x < vw; x++) {
        const camX = 2 * (x + 0.5) / vw - 1;
        const rdx = ca + plx * camX, rdy = sa + ply * camX;
        const hit = W.castRay(g, ox, oy, rdx, rdy, 96);
        if (!hit) { this.zbuf[x] = 1e9; continue; }
        const t = Math.max(0.05, hit.t);
        this.zbuf[x] = t;
        const lineH = focal / (t * ASPECT);
        const top = horizon - lineH / 2;
        const tx = this.texList[hit.tex] || this.texList[1];
        const col = hit.side ? tx.dark : tx.light;
        const texX = Math.min(63, Math.floor(hit.u * 64)) * 64;
        const y0 = Math.max(vy, Math.ceil(top)), y1 = Math.min(vy + vh, Math.ceil(top + lineH));
        const step = 64 / lineH;
        let tp = (y0 - top) * step;
        let o = y0 * SW + vx + x;
        for (let y = y0; y < y1; y++) { fb[o] = col[texX + (tp & 63)]; tp += step; o += SW; }
      }
      this.drawSprites(g);
      if (!opts.noWeapon) this.drawWeapon(g);
      this.drawFlashes(g);
    }

    actorFrame(a, g) {
      const spr = G.actorSprites(a.type);
      if (a.state === 'dead') return spr.dead;
      if (a.def.ghost) return spr[`w${(a.walkFrame || 0) & 1}_${a.variant & 3}`];
      if (a.anim) return spr[a.anim[a.frame][0]] || spr.shoot1;
      const rotates = !!a.def.rot;
      const f = a.state === 'stand' ? -1 : (a.walkFrame || 0);
      if (!rotates) return spr['w' + Math.max(0, f)];
      let rot = 0;
      if (a.dir !== W.NODIR) {
        const toViewer = Math.atan2(g.py - a.y, g.px - a.x);
        let rel = toViewer - a.dir * Math.PI / 4;
        rel = Math.atan2(Math.sin(rel), Math.cos(rel));
        rot = ((Math.round(rel / (Math.PI / 4)) % 8) + 8) % 8;
      }
      return f < 0 ? spr['s' + rot] : spr[`w${f}_${rot}`];
    }

    collectSprites(g) {
      const list = [];
      for (const st of g.level.statics) if (st.active) list.push({ x: st.x + 0.5, y: st.y + 0.5, pic: this.statics[st.spr] });
      for (const a of g.actors) { const pic = this.actorFrame(a, g); if (pic) list.push({ x: a.x, y: a.y, pic, actor: a }); }
      for (const p of g.projectiles) {
        const name = p.kind === 'fireball' ? 'fire' + ((p.t >> 3) & 1) : p.kind;
        list.push({ x: p.x, y: p.y, pic: this.statics[name] });
      }
      for (const e of g.effects) list.push({ x: e.x, y: e.y, pic: this.statics[e.seq[e.f]] });
      return list;
    }

    drawSprites(g) {
      const { vx, vy, vw, vh } = this, fb = this.fb, { ca, sa, plx, ply, focal, horizon } = this.cam;
      const invDet = 1 / (plx * sa - ca * ply);
      const items = [];
      for (const s of this.collectSprites(g)) {
        if (!s.pic) continue;
        const rx = s.x - g.px, ry = s.y - g.py;
        const tX = invDet * (sa * rx - ca * ry), tY = invDet * (-ply * rx + plx * ry);
        if (tY <= 0.12) continue;
        items.push({ s, tX, tY });
      }
      items.sort((a, b) => b.tY - a.tY);
      for (const { s, tX, tY } of items) {
        const pic = s.pic;
        const sx = vw / 2 * (1 + tX / tY);
        const h = focal / (tY * ASPECT), w = focal / tY;
        const top = horizon - h / 2, left = sx - w / 2;
        const x0 = Math.max(0, Math.ceil(left)), x1 = Math.min(vw, Math.ceil(left + w));
        const y0 = Math.max(vy, Math.ceil(top)), y1 = Math.min(vy + vh, Math.ceil(top + h));
        if (x0 >= x1 || y0 >= y1) continue;
        const stepY = pic.h / h, stepX = pic.w / w;
        for (let x = x0; x < x1; x++) {
          if (tY >= this.zbuf[x]) continue;
          const u = Math.min(pic.w - 1, Math.floor((x + 0.5 - left) * stepX));
          let v = (y0 - top) * stepY;
          let o = y0 * SW + vx + x;
          for (let y = y0; y < y1; y++) {
            const c = pic.px[Math.min(pic.h - 1, v | 0) * pic.w + u];
            if (c) fb[o] = c;
            v += stepY; o += SW;
          }
        }
      }
    }

    drawWeapon(g) {
      if (g.mode !== 'play' && g.mode !== 'exit') return;
      const id = D.WEAPONS[g.weapon].id;
      const pic = this.weapons[id][g.weaponFrame];
      const { vx, vy, vw, vh } = this;
      const size = vh;
      const x0 = vx + (vw >> 1) - (size >> 1), y0 = vy + vh - size;
      const s = size / 64, fb = this.fb;
      for (let j = 0; j < size; j++) {
        const Y = y0 + j, sy = Math.min(63, Math.floor(j / s));
        for (let i = 0; i < size; i++) {
          const X = x0 + i;
          if (X < vx || X >= vx + vw) continue;
          const c = pic.px[sy * 64 + Math.min(63, Math.floor(i / s))];
          if (c) fb[Y * SW + X] = c;
        }
      }
    }

    drawFlashes(g) {
      let r = 0, gg = 0, b = 0, k = 0;
      if (g.damageFlash > 0) { r = 255; gg = 0; b = 0; k = Math.min(0.6, g.damageFlash * 0.55); }
      else if (g.bonusFlash > 0) { r = 255; gg = 236; b = 160; k = g.bonusFlash * 0.28; }
      if (g.mode === 'dying') { r = 200; gg = 0; b = 0; k = Math.min(0.55, 0.2 + g.dyingTics / 160); }
      if (k <= 0) return;
      this.tintView(r, gg, b, k);
    }

    tintView(r, gg, b, k) {
      const { vx, vy, vw, vh } = this, fb = this.fb, ik = 1 - k;
      for (let y = vy; y < vy + vh; y++) for (let x = vx; x < vx + vw; x++) {
        const o = y * SW + x, c = fb[o];
        fb[o] = G.rgb((c & 255) * ik + r * k, ((c >>> 8) & 255) * ik + gg * k, ((c >>> 16) & 255) * ik + b * k);
      }
    }

    drawNumber(n, right, y, digits) {
      const s = String(Math.max(0, n | 0));
      const shown = s.length > digits ? s.slice(-digits) : s;
      for (let i = 0; i < shown.length; i++) this.blit(this.digits[+shown[shown.length - 1 - i]], right - (i + 1) * 8, y);
    }

    drawStatusBar(g, S) {
      const y = 160, bg = G.rgb(0, 0, 112), hi = G.rgb(72, 72, 184), lo = G.rgb(0, 0, 48), white = G.rgb(232, 232, 232);
      this.fill(0, y, SW, 40, bg);
      this.bevel(0, y, SW, 40, hi, lo);
      const box = (x, w) => { this.fill(x, y + 4, w, 24, G.rgb(0, 0, 0)); this.bevel(x - 1, y + 3, w + 2, 26, lo, hi); };
      const label = (txt, x, w) => this.text(txt, x + w / 2, y + 31, white, 'pix', 'center');
      box(4, 22); this.drawNumber(g.floor + 1, 4 + 22 - 3, y + 8, 2); label(S.floor, 4, 22);
      box(30, 56); this.drawNumber(g.score, 30 + 56 - 3, y + 8, 7); label(S.score, 30, 56);
      box(90, 20); this.drawNumber(g.lives, 90 + 20 - 6, y + 8, 1); label(S.lives, 90, 20);
      this.fill(115, y + 3, 26, 34, G.rgb(0, 0, 0)); this.bevel(114, y + 2, 28, 36, lo, hi);
      const face = this.faces[g.faceName] || this.faces.f0_0;
      this.blit(face, 116, y + 4);
      box(144, 42); this.drawNumber(g.health, 144 + 42 - 4, y + 8, 3); label(S.health, 144, 42);
      box(190, 36); this.drawNumber(g.ammo, 190 + 36 - 6, y + 8, 2); label(S.ammo, 190, 36);
      this.fill(231, y + 4, 10, 34, G.rgb(0, 0, 0)); this.bevel(230, y + 3, 12, 36, lo, hi);
      if (g.keys[0]) this.blit(this.misc.key1, 232, y + 5);
      if (g.keys[1]) this.blit(this.misc.key2, 232, y + 21);
      this.fill(246, y + 4, 70, 32, G.rgb(0, 0, 0)); this.bevel(245, y + 3, 72, 34, lo, hi);
      this.blit(this.weapons[D.WEAPONS[g.weapon].id + '_icon'], 257, y + 8);
    }
    fizzleOrder() {
      if (this._fizzle) return this._fizzle;
      const n = SW * SH, arr = new Uint32Array(n);
      for (let i = 0; i < n; i++) arr[i] = i;
      let s = 1234567;
      for (let i = n - 1; i > 0; i--) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; const j = s % (i + 1); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
      this._fizzle = arr;
      return arr;
    }
  }

  W.Renderer = Renderer;
  W.SCREEN = { W: SW, H: SH, ASPECT, PLANE };
})(globalThis.Wolf3D = globalThis.Wolf3D || {});
