/**
 * Doom 98 — software renderer. Draws into a 32-bit framebuffer from 8-bit graphics through 32 light
 * colormaps, exactly like the DOS engine: front-to-back BSP walk, per-column wall/floor/ceiling spans
 * clipped against ceiling/floor clip arrays, sky, distance lighting, sprites with a depth buffer, fuzz,
 * player weapon, status bar / fullscreen HUD and the automap. No DOM: works in Node for tests.
 */
(function (D) {
  'use strict';
  const { PALETTE, RAMP, C, MF, WEAPONS } = D.DATA;
  const PI = Math.PI;

  class Renderer {
    constructor(w = 320, h = 200) {
      this.G = D.GFX.build();
      this.gamma = 0; this.tint = null; this.hud = 'bar'; this.freelook = false;
      this.resize(w, h);
      this.buildColormaps();
    }
    resize(w, h) {
      this.W = w; this.H = h; this.scale = w / 320;
      this.fb = new Uint32Array(w * h);
      this.depth = new Float32Array(w * h);
      this.ceilClip = new Int16Array(w); this.floorClip = new Int16Array(w);
      this.colDx = new Float32Array(w); this.colDy = new Float32Array(w); this.colAng = new Float32Array(w);
    }
    // 34 maps: 0..31 light levels, 32 = invulnerability, 33 = fullbright white-ish for light amp
    buildColormaps() {
      const key = `${this.gamma}|${this.tint ? this.tint.join(',') : ''}`;
      if (key === this.cmKey) return; this.cmKey = key;
      const g = [1, 0.85, 0.72, 0.6, 0.5][this.gamma] || 1;
      const cm = this.cm || (this.cm = new Uint32Array(34 * 256));
      const t = this.tint;
      for (let i = 0; i < 256; i++) {
        let r = PALETTE[i * 3], gg = PALETTE[i * 3 + 1], b = PALETTE[i * 3 + 2];
        if (t) { r += (t[0] - r) * t[3]; gg += (t[1] - gg) * t[3]; b += (t[2] - b) * t[3]; }
        for (let l = 0; l < 32; l++) {
          const f = Math.pow(1 - l / 32, 1.15);
          const R = 255 * Math.pow(r * f / 255, g), G = 255 * Math.pow(gg * f / 255, g), B = 255 * Math.pow(b * f / 255, g);
          cm[l * 256 + i] = 0xff000000 | (Math.min(255, B) << 16) | (Math.min(255, G) << 8) | Math.min(255, R);
        }
        const gray = 255 - (PALETTE[i * 3] * 0.3 + PALETTE[i * 3 + 1] * 0.59 + PALETTE[i * 3 + 2] * 0.11);
        cm[32 * 256 + i] = 0xff000000 | (gray << 16) | (gray << 8) | gray;
      }
    }
    setTint(t) { this.tint = t; this.buildColormaps(); }
    lightLevel(light, dist) {
      const start = (15 - Math.min(15, light >> 4)) * 4;
      return Math.max(0, Math.min(31, Math.round(start - 1280 / Math.max(1, dist))));
    }

    // ================================================================ frame
    render(game, frac = 1, opts = {}) {
      const p = game.player, mo = p.mo, W = this.W;
      this.game = game; this.L = game.L;
      const lerp = (a, b) => a + (b - a) * frac;
      this.vx = lerp(mo.px, mo.x); this.vy = lerp(mo.py, mo.y);
      this.vz = p.pviewz != null ? lerp(p.pviewz, p.viewz) : p.viewz;
      let ang = mo.angle; if (p.pangle != null && opts.interpAngle) ang = p.pangle + D.normAng(mo.angle - p.pangle) * frac;
      if (opts.angle != null) ang = opts.angle;
      this.va = ang; this.cos = Math.cos(ang); this.sin = Math.sin(ang);
      this.leveltime = game.leveltime; this.frac = frac;
      const bar = this.hud === 'bar' && !opts.noHud;
      this.viewH = bar ? this.H - Math.round(32 * this.scale) : this.H;
      this.proj = W / 2;
      const pitch = this.freelook ? (p.pitch || 0) : 0;
      this.cy = this.viewH / 2 + Math.tan(pitch) * this.proj * 0.9;
      this.fixed = p.powers.invuln > 128 || (p.powers.invuln & 8) ? 32 : (p.powers.infrared > 128 || (p.powers.infrared & 8) ? 0 : -1);
      this.extralight = p.extralight;
      // palette effects
      let tint = null;
      const dmg = p.damagecount + (p.powers.strength ? Math.max(0, 12 - (p.powers.strength >> 6)) : 0);
      if (dmg > 0) tint = [255, 0, 0, Math.min(0.6, (dmg + 7) / 8 * 0.07)];
      else if (p.bonuscount) tint = [215, 186, 69, Math.min(0.35, (p.bonuscount + 7) / 8 * 0.12)];
      else if (p.powers.ironfeet > 128 || (p.powers.ironfeet & 8)) tint = [0, 255, 0, 0.12];
      this.setTint(tint);
      // per-column ray directions
      for (let x = 0; x < W; x++) {
        const t = (x + 0.5 - W / 2) / this.proj;
        this.colDx[x] = this.cos + this.sin * t; this.colDy[x] = this.sin - this.cos * t; this.colAng[x] = Math.atan(t);
      }
      this.ceilClip.fill(-1); this.floorClip.fill(this.viewH);
      this.depth.fill(1e9, 0, W * this.viewH);
      this.solidCols = 0; this.frameId = (this.frameId || 0) + 1;
      this.visited = this.visited && this.visited.length === this.L.sectors.length ? this.visited : new Int32Array(this.L.sectors.length);
      this.masked = [];
      this.renderNode(this.L.root);
      this.drawSprites(game);
      this.drawMasked();
      if (!opts.noWeapon) this.drawWeapon(game);
      if (bar) this.drawStatusBar(game);
      else if (!opts.noHud) this.drawFullHud(game);
      if (opts.automap) this.drawAutomap(game, opts.automap);
      return this.fb;
    }

    // ---------------------------------------------------------------- BSP walk
    renderNode(n) {
      if (this.solidCols >= this.W) return;
      if (n.leaf) { this.renderSubsector(n.leaf); return; }
      const front = D.sideOf(this.vx, this.vy, n.x, n.y, n.dx, n.dy) >= 0;
      this.renderNode(front ? n.front : n.back);
      const box = front ? n.bbox : n.fbox;
      if (this.boxVisible(box)) this.renderNode(front ? n.back : n.front);
    }
    boxVisible(b) {
      if (this.vx >= b[0] && this.vx <= b[2] && this.vy >= b[1] && this.vy <= b[3]) return true;
      let minX = Infinity, maxX = -Infinity, behind = 0;
      const corners = [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]];
      for (const [x, y] of corners) {
        const dx = x - this.vx, dy = y - this.vy, z = dx * this.cos + dy * this.sin, sx = dx * this.sin - dy * this.cos;
        if (z < 1) { behind++; if (sx < 0) minX = -Infinity; else maxX = Infinity; if (behind === 4) return false; continue; }
        const px = this.W / 2 + sx / z * this.proj; if (px < minX) minX = px; if (px > maxX) maxX = px;
      }
      if (behind) { // straddles the view plane: be conservative
        return true;
      }
      const x0 = Math.max(0, Math.floor(minX)), x1 = Math.min(this.W - 1, Math.ceil(maxX));
      if (x0 > x1) return false;
      for (let x = x0; x <= x1; x++) if (this.ceilClip[x] < this.floorClip[x] - 1) return true;
      return false;
    }
    renderSubsector(ss) {
      this.visited[ss.sector] = this.frameId;
      for (const sg of ss.segs) this.renderSeg(sg);
    }

    // ---------------------------------------------------------------- segs
    renderSeg(sg) {
      const vx = this.vx, vy = this.vy;
      // back-face: viewer must be on the left of the seg
      if ((sg.x2 - sg.x1) * (vy - sg.y1) - (sg.y2 - sg.y1) * (vx - sg.x1) <= 0) return;
      const L = this.L, line = L.lines[sg.line], side = L.sides[line.sides[sg.side]];
      // view space: z forward, x right
      let ax = sg.x1 - vx, ay = sg.y1 - vy, bx = sg.x2 - vx, by = sg.y2 - vy;
      let az = ax * this.cos + ay * this.sin, axx = ax * this.sin - ay * this.cos;
      let bz = bx * this.cos + by * this.sin, bxx = bx * this.sin - by * this.cos;
      const segLen = Math.hypot(sg.x2 - sg.x1, sg.y2 - sg.y1);
      let ua = sg.offset, ub = sg.offset + segLen;
      const NEAR = 0.5;
      if (az < NEAR && bz < NEAR) return;
      if (az < NEAR) { const t = (NEAR - az) / (bz - az); axx += (bxx - axx) * t; ua += (ub - ua) * t; az = NEAR; }
      else if (bz < NEAR) { const t = (NEAR - az) / (bz - az); bxx = axx + (bxx - axx) * t; ub = ua + (ub - ua) * t; bz = NEAR; }
      const W = this.W, hw = W / 2, proj = this.proj;
      const sxa = hw + axx / az * proj, sxb = hw + bxx / bz * proj;
      // seg runs right-to-left on screen (a is the right end)
      let x1 = Math.ceil(sxb - 0.5), x2 = Math.ceil(sxa - 0.5) - 1;
      if (x2 < 0 || x1 >= W || x1 > x2) return;
      if (x1 < 0) x1 = 0; if (x2 >= W) x2 = W - 1;
      let any = false; for (let x = x1; x <= x2; x++) if (this.ceilClip[x] < this.floorClip[x] - 1) { any = true; break; }
      if (!any) return;
      line.flags |= D.LF.MAPPED;

      const fs = L.sectors[sg.sector], bs = sg.back >= 0 ? L.sectors[sg.back] : null;
      const G = this.G, vz = this.vz, cy = this.cy, viewH = this.viewH;
      const fceil = fs.ceil - vz, ffloor = fs.floor - vz;
      const skyC = fs.ctex === 'F_SKY1';
      let light = fs.light + this.extralight * 16;
      if (line.y1 === line.y2) light -= 16; else if (line.x1 === line.x2) light += 16;
      const tex = n => { if (!n) return null; const an = G.anims.tex[n]; if (an) n = an[(this.leveltime >> 3) % an.length]; return G.textures[n] || G.textures.STARTAN; };
      let midT = null, upT = null, loT = null, aboveT = null, bceil = 0, bfloor = 0, drawUpper = false, drawLower = false;
      if (!bs) midT = tex(side.mid);
      else {
        bceil = bs.ceil - vz; bfloor = bs.floor - vz;
        drawUpper = bs.ceil < fs.ceil && !(skyC && bs.ctex === 'F_SKY1');
        drawLower = bs.floor > fs.floor;
        if (drawUpper) { upT = tex(side.upper); if (side.above && !(line.flags & D.LF.UPPER_UNPEGGED)) aboveT = tex(side.above); }
        if (drawLower) loT = tex(side.lower);
        if (side.mid) this.masked.push({ sg, side, fs, bs, x1, x2, ua, ub, az, bz, axx, bxx, light });
      }
      // texture anchors (world z of texture row 0)
      const flags = line.flags, UPEG = D.LF.UPPER_UNPEGGED, LPEG = D.LF.LOWER_UNPEGGED;
      let midTop = 0, upTop = 0, loTop = 0;
      const autoLow = side.mid && /^SW/.test(side.mid);
      if (midT) midTop = (flags & LPEG || autoLow) ? fs.floor + midT.h : fs.ceil;
      if (upT) upTop = (flags & UPEG) ? fs.ceil : bs.ceil + upT.h;
      if (loT) loTop = (flags & LPEG) ? fs.ceil : bs.floor;
      const yoff = side.yoff || 0, xoff = side.xoff || 0;
      const closed = bs && (bs.ceil <= bs.floor || bs.ceil <= fs.floor || bs.floor >= fs.ceil);
      const fb = this.fb, depth = this.depth, cm = this.cm;
      const ceilVisible = fs.ceil > vz || skyC, floorVisible = fs.floor < vz;
      // ray/seg intersection per column (exact perspective)
      const dxs = bxx - axx, dzs = bz - az;
      for (let x = x1; x <= x2; x++) {
        let top = this.ceilClip[x] + 1, bot = this.floorClip[x] - 1;
        if (top > bot) continue;
        const t = (x + 0.5 - hw) / proj;
        const den = t * dzs - dxs;
        let s = den !== 0 ? (axx - t * az) / den : 0; if (s < 0) s = 0; else if (s > 1) s = 1;
        const z = az + dzs * s, u = ua + (ub - ua) * s + xoff, sc = proj / z;
        const yc = cy - fceil * sc, yf = cy - ffloor * sc;
        let lvl = this.fixed >= 0 ? this.fixed : this.lightLevel(light, z * 320 / W * 0 + z);
        const cmo = lvl * 256;
        // ceiling
        let cEnd = Math.min(Math.ceil(yc - 0.5) - 1, bot);
        if (ceilVisible && top <= cEnd) this.drawPlaneCol(x, top, cEnd, fs, true);
        // floor
        let fStart = Math.max(Math.ceil(yf - 0.5), top);
        if (floorVisible && fStart <= bot) this.drawPlaneCol(x, fStart, bot, fs, false);
        const wTop = Math.max(Math.ceil(yc - 0.5), top), wBot = Math.min(Math.ceil(yf - 0.5) - 1, bot);
        if (!bs) {
          if (wTop <= wBot) this.drawWallCol(x, wTop, wBot, midT, u, midTop + yoff, sc, z, cmo);
          this.ceilClip[x] = viewH; this.floorClip[x] = -1; this.solidCols++;
          continue;
        }
        // upper
        let newTop = Math.max(top, Math.ceil(yc - 0.5));
        if (drawUpper) {
          const yb = cy - bceil * sc, uBot = Math.min(Math.ceil(yb - 0.5) - 1, wBot);
          if (wTop <= uBot) this.drawWallCol(x, wTop, uBot, upT, u, upTop + yoff, sc, z, cmo, aboveT);
          newTop = Math.max(newTop, uBot + 1);
        } else if (skyC && bs.ctex === 'F_SKY1') {
          // sky hack: paint sky down to the back ceiling
          const yb = cy - bceil * sc, sEnd = Math.min(Math.ceil(yb - 0.5) - 1, bot);
          if (top <= sEnd && ceilVisible) this.drawPlaneCol(x, Math.max(top, cEnd + 1), sEnd, fs, true);
          newTop = Math.max(newTop, sEnd + 1);
        }
        let newBot = Math.min(bot, Math.ceil(yf - 0.5) - 1);
        if (drawLower) {
          const yb = cy - bfloor * sc, lTop = Math.max(Math.ceil(yb - 0.5), wTop, top);
          if (lTop <= wBot) this.drawWallCol(x, lTop, wBot, loT, u, loTop + yoff, sc, z, cmo);
          newBot = Math.min(newBot, lTop - 1);
        }
        if (closed || newTop > newBot) { this.ceilClip[x] = viewH; this.floorClip[x] = -1; this.solidCols++; }
        else { this.ceilClip[x] = newTop - 1; this.floorClip[x] = newBot + 1; }
      }
    }
    drawWallCol(x, y0, y1, T, u, anchor, sc, z, cmo, alt) {
      const W = this.W, fb = this.fb, depth = this.depth, cm = this.cm, cols = T.cols, th = T.h, tw = T.w;
      const col = ((Math.floor(u) % tw) + tw) % tw * th;
      const inv = 1 / sc;
      // world z at pixel centre y: vz + (cy - y - 0.5) / sc ; texture v = anchor - worldZ
      let v = anchor - (this.vz + (this.cy - y0 - 0.5) * inv);
      let o = y0 * W + x;
      if (alt) { // above a door: the wall texture continues over the lintel
        const ah = alt.h, aw = alt.w, acol = ((Math.floor(u) % aw) + aw) % aw * ah;
        for (; y0 <= y1 && v < 0; y0++, o += W, v += inv) { fb[o] = cm[cmo + alt.cols[acol + (((Math.floor(v) % ah) + ah) % ah)]]; depth[o] = z; }
      }
      for (let y = y0; y <= y1; y++, o += W, v += inv) {
        fb[o] = cm[cmo + cols[col + (((Math.floor(v) % th) + th) % th)]];
        depth[o] = z;
      }
    }
    drawPlaneCol(x, y0, y1, sec, isCeil) {
      if (y0 > y1) return;
      const W = this.W, fb = this.fb, depth = this.depth, cm = this.cm, G = this.G;
      let ftex = isCeil ? sec.ctex : sec.ftex;
      if (ftex === 'F_SKY1') { this.drawSkyCol(x, y0, y1); return; }
      const an = G.anims.flat[ftex]; if (an) ftex = an[(this.leveltime >> 3) % an.length];
      const flat = (G.flats[ftex] || G.flats.FLOOR4).px;
      const h = (isCeil ? sec.ceil : sec.floor) - this.vz;
      const dx = this.colDx[x], dy = this.colDy[x], cy = this.cy, proj = this.proj, vx = this.vx, vy = this.vy;
      const light = sec.light + this.extralight * 16, fixed = this.fixed;
      const start = (15 - Math.min(15, light >> 4)) * 4;
      let o = y0 * W + x;
      for (let y = y0; y <= y1; y++, o += W) {
        const dyp = cy - (y + 0.5);
        const z = h * proj / dyp;                   // depth along view direction
        if (!(z > 0)) { fb[o] = cm[31 * 256]; depth[o] = 1e8; continue; }
        const wx = vx + dx * z, wy = vy + dy * z;
        const lvl = fixed >= 0 ? fixed : Math.max(0, Math.min(31, (start - 1280 / z + 0.5) | 0));
        fb[o] = cm[lvl * 256 + flat[((63 - ((wy | 0) & 63)) << 6) | ((wx | 0) & 63)]];
        depth[o] = z;
      }
    }
    drawSkyCol(x, y0, y1) {
      const sky = this.G.textures[this.L.sky] || this.G.textures.SKY1, W = this.W, fb = this.fb, depth = this.depth;
      const cm = this.fixed === 32 ? this.cm : this.cm, cmo = this.fixed === 32 ? 32 * 256 : 0;
      const ang = this.va - this.colAng[x];
      let u = Math.floor(-ang / (PI / 2) * 256) % sky.w; if (u < 0) u += sky.w;
      const col = u * sky.h, k = 128 / (this.viewH * 1.25), base = this.cy - this.viewH * 0.62;
      let o = y0 * W + x;
      for (let y = y0; y <= y1; y++, o += W) {
        let v = Math.floor((y - base) * k); if (v < 0) v = 0; else if (v > 127) v = 127;
        fb[o] = cm[cmo + sky.cols[col + v]]; depth[o] = 1e7;
      }
    }
    // two-sided lines with a masked middle texture (grates)
    drawMasked() {
      for (const m of this.masked) {
        const T = this.G.textures[m.side.mid]; if (!T) continue;
        const { fs, bs } = m, top = Math.min(fs.ceil, bs.ceil), bottom = Math.max(fs.floor, bs.floor);
        const hw = this.W / 2, proj = this.proj, dxs = m.bxx - m.axx, dzs = m.bz - m.az;
        for (let x = m.x1; x <= m.x2; x++) {
          const t = (x + 0.5 - hw) / proj, den = t * dzs - dxs;
          let s = den !== 0 ? (m.axx - t * m.az) / den : 0; s = Math.max(0, Math.min(1, s));
          const z = m.az + dzs * s, u = m.ua + (m.ub - m.ua) * s, sc = proj / z;
          const y0 = Math.max(0, Math.ceil(this.cy - (top - this.vz) * sc - 0.5)), y1 = Math.min(this.viewH - 1, Math.ceil(this.cy - (bottom - this.vz) * sc - 0.5) - 1);
          const col = ((Math.floor(u) % T.w) + T.w) % T.w * T.h, inv = 1 / sc, cmo = (this.fixed >= 0 ? this.fixed : this.lightLevel(m.light, z)) * 256;
          let v = top - (this.vz + (this.cy - y0 - 0.5) * inv), o = y0 * this.W + x;
          for (let y = y0; y <= y1; y++, o += this.W, v += inv) {
            if (this.depth[o] <= z) continue;
            const c = T.cols[col + (((Math.floor(v) % T.h) + T.h) % T.h)]; if (!c) continue;
            this.fb[o] = this.cm[cmo + c]; this.depth[o] = z;
          }
        }
      }
    }

    // ---------------------------------------------------------------- sprites
    spriteFor(mo, viewAng) {
      const S = this.G.sprites, base = mo.info.sprite; if (!base) return null;
      const f = mo.frame;
      // rotation: 0 = facing the viewer
      const an = Math.atan2(this.vy - mo.y, this.vx - mo.x);
      let r = Math.round(D.normAng(an - mo.angle) / (PI / 4)); r = ((r % 8) + 8) % 8;
      let view = 'F', flip = false;
      if (r === 2) { view = 'S'; flip = true; } else if (r === 6) { view = 'S'; flip = false; } else if (r >= 3 && r <= 5) view = 'B'; else if (r === 1 || r === 7) { view = 'F'; }
      let pic = S[base + f + view];
      if (!pic) { pic = S[base + f + 'F'] || S[base + f]; flip = false; }
      return pic ? { pic, flip } : null;
    }
    drawSprites(game) {
      const list = [], vis = this.visited, fid = this.frameId, frac = this.frac;
      for (const m of game.mobjs) {
        if (m.player || m.removed || !m.info.sprite) continue;
        const x = m.px + (m.x - m.px) * frac, y = m.py + (m.y - m.py) * frac;
        if (vis[m.sector] !== fid && Math.hypot(x - this.vx, y - this.vy) > 160) continue;
        const dx = x - this.vx, dy = y - this.vy, tz = dx * this.cos + dy * this.sin;
        if (tz < 4) continue;
        list.push({ m, x, y, z: m.pz + (m.z - m.pz) * frac, tz, tx: dx * this.sin - dy * this.cos });
      }
      list.sort((a, b) => b.tz - a.tz);
      for (const s of list) this.drawSprite(s);
    }
    drawSprite(s) {
      const m = s.m, spr = this.spriteFor(m); if (!spr) return;
      const pic = spr.pic, sc = this.proj / s.tz, W = this.W, viewH = this.viewH;
      const sx = W / 2 + s.tx / s.tz * this.proj;
      const bob = m.info.float ? Math.sin(this.leveltime / 6 + m.id) * 2 : 0;
      const x0f = sx - (spr.flip ? pic.w - pic.ox : pic.ox) * sc, topz = s.z + pic.oy + bob;
      const y0f = this.cy - (topz - this.vz) * sc;
      const xa = Math.max(0, Math.ceil(x0f - 0.5)), xb = Math.min(W - 1, Math.ceil(x0f + pic.w * sc - 0.5) - 1);
      if (xa > xb) return;
      const fuzz = m.flags & MF.SHADOW;
      const sec = this.L.sectors[m.sector];
      const lvl = this.fixed >= 0 ? this.fixed : m.bright ? 0 : this.lightLevel(sec.light + this.extralight * 16, s.tz);
      const cmo = lvl * 256, cm = this.cm, fb = this.fb, depth = this.depth, inv = 1 / sc, cols = pic.cols, spans = pic.spans, ph = pic.h;
      for (let x = xa; x <= xb; x++) {
        let c = Math.floor((x + 0.5 - x0f) * inv); if (c < 0 || c >= pic.w) continue;
        if (spr.flip) c = pic.w - 1 - c;
        const r0 = spans[c * 2], r1 = spans[c * 2 + 1]; if (r0 < 0) continue;
        let ya = Math.max(0, Math.ceil(y0f + r0 * sc - 0.5)), yb = Math.min(viewH - 1, Math.ceil(y0f + (r1 + 1) * sc - 0.5) - 1);
        let o = ya * W + x, v = (ya + 0.5 - y0f) * inv;
        const cb = c * ph;
        for (let y = ya; y <= yb; y++, o += W, v += inv) {
          if (depth[o] <= s.tz) continue;
          const vi = v | 0; if (vi >= ph) break;
          const p = cols[cb + vi]; if (!p) continue;
          if (fuzz) { const src = fb[o + ((((x * 7 + y * 3 + this.leveltime) & 3) === 0) ? -W : W)] || fb[o]; fb[o] = ((src >> 1) & 0x7f7f7f) | 0xff000000; }
          else fb[o] = cm[cmo + p];
        }
      }
    }

    // ---------------------------------------------------------------- HUD
    blitHud(pic, x, y, cmo = 0, clipH = this.H, fuzz = false) {
      const s = this.scale, W = this.W, fb = this.fb, cm = this.cm, cols = pic.cols;
      const X0 = Math.round(x * s), Y0 = Math.round(y * s), w = Math.round(pic.w * s), h = Math.round(pic.h * s);
      for (let i = Math.max(0, -X0); i < w && X0 + i < W; i++) {
        const cx = Math.min(pic.w - 1, Math.floor(i / s)) * pic.h;
        for (let j = Math.max(0, -Y0); j < h && Y0 + j < clipH; j++) {
          const c = cols[cx + Math.min(pic.h - 1, Math.floor(j / s))]; if (!c) continue;
          const o = (Y0 + j) * W + X0 + i;
          if (fuzz) { const src = fb[o + (((i + j + this.leveltime) & 3) ? W : -W)] || fb[o]; fb[o] = ((src >> 1) & 0x7f7f7f) | 0xff000000; }
          else fb[o] = cm[cmo + c];
        }
      }
    }
    drawWeapon(game) {
      const p = game.player, H = this.G.hud; if (!p.mo) return;
      const sec = this.L.sectors[p.mo.sector];
      const viewBottom = this.viewH / this.scale, fuzz = !!p.powers.invis && (p.powers.invis > 128 || (p.powers.invis & 8));
      for (let i = 0; i < 2; i++) {
        const psp = p.psp[i]; if (!psp.state) continue;
        const w = WEAPONS[p.ready];
        const name = i === 0 ? w.sprite + psp.state.frame : (w.flash + psp.state.frame);
        const pic = H[name]; if (!pic) continue;
        const lvl = this.fixed >= 0 ? this.fixed : psp.state.bright ? 0 : Math.max(0, this.lightLevel(sec.light + this.extralight * 16, 48));
        const x = 160 - pic.ox + (psp.sx - 1) + pic.dx, y = viewBottom - pic.oy + (psp.sy - 32) + pic.dy + 2;
        this.blitHud(pic, x, y, lvl * 256, this.viewH, fuzz && i === 0);
      }
    }
    num(n, x, y, pre, w, pct) { // right-aligned digits ending at x
      const H = this.G.hud; let s = String(Math.max(0, Math.floor(n)));
      if (pct) { const pc = H[pre + '%']; if (pc) this.blitHud(pc, x, y); }
      for (let i = s.length - 1; i >= 0; i--) { const pic = H[pre + s[i]]; x -= w; if (pic) this.blitHud(pic, x, y); }
    }
    faceName(game) {
      const p = game.player, st = this.faceState || (this.faceState = { name: 'STFST00', count: 0, prio: 0, oldHealth: 100, look: 0, lastAttack: -1, oldWeapons: 0 });
      const lvl = Math.min(4, Math.floor((100 - Math.min(100, p.health)) / 20));
      if (p.dead || p.health <= 0) return 'STFDEAD0';
      if (p.cheats.god || p.powers.invuln) return 'STFGOD0';
      const t = game.leveltime; if (st.t === t) return st.name; st.t = t;
      const wcount = Object.keys(p.weapons).length;
      if (wcount > st.oldWeapons && st.oldWeapons) { st.prio = 8; st.name = `STFEVL${lvl}`; st.count = 70; }
      st.oldWeapons = wcount;
      if (p.damagecount && p.attacker && p.attacker !== p.mo && st.prio < 7) {
        if (st.oldHealth - p.health > 20) { st.name = `STFOUCH${lvl}`; st.prio = 7; }
        else { const a = D.normAng(Math.atan2(p.attacker.y - p.mo.y, p.attacker.x - p.mo.x) - p.mo.angle); st.name = Math.abs(a) < PI / 8 ? `STFKILL${lvl}` : a > 0 ? `STFTL${lvl}0` : `STFTR${lvl}0`; st.prio = 6; }
        st.count = 35;
      } else if (p.damagecount && st.prio < 6) { st.name = `STFOUCH${lvl}`; st.prio = 6; st.count = 35; }
      if (p.fire && p.refire > 20 && st.prio < 5) { st.name = `STFKILL${lvl}`; st.prio = 5; st.count = 2; }
      st.oldHealth = p.health;
      if (--st.count <= 0) { st.prio = 0; st.look = (Math.random() * 3) | 0; st.name = `STFST${lvl}${st.look}`; st.count = 17; }
      return st.name;
    }
    drawStatusBar(game) {
      const p = game.player, H = this.G.hud, y0 = 168, w = WEAPONS[p.ready];
      this.blitHud(H.STBAR, 0, y0);
      if (w.ammo) this.num(p.ammo[w.ammo], 44, y0 + 3, 'STTNUM', 14);
      this.num(p.health, 90, y0 + 3, 'STTNUM', 14, true);
      this.num(p.armor, 221, y0 + 3, 'STTNUM', 14, true);
      const arms = [[2, p.weapons.pistol], [3, p.weapons.shotgun || p.weapons.ssg], [4, p.weapons.chaingun], [5, p.weapons.rocket], [6, p.weapons.plasma], [7, p.weapons.bfg]];
      arms.forEach(([n, has], i) => { const pic = H[(has ? 'STYSNUM' : 'STGNUM') + n]; this.blitHud(pic, 111 + (i % 3) * 12, y0 + 4 + Math.floor(i / 3) * 10); });
      const face = H[this.faceName(game)] || H.STFST00; this.blitHud(face, 147, y0 + 2);
      const keys = [['blue', 'STKEYS0'], ['yellow', 'STKEYS1'], ['red', 'STKEYS2']];
      keys.forEach(([k, pic], i) => { if (p.keys[k]) this.blitHud(H[pic], 238, y0 + 4 + i * 9); });
      ['bullets', 'shells', 'rockets', 'cells'].forEach((a, i) => { this.num(p.ammo[a], 288, y0 + 5 + i * 6, 'STYSNUM', 4); this.num(p.maxammo[a], 314, y0 + 5 + i * 6, 'STYSNUM', 4); });
    }
    drawFullHud(game) {
      const p = game.player, H = this.G.hud, w = WEAPONS[p.ready];
      this.num(p.health, 50, 180, 'STTNUM', 14, true);
      const face = H[this.faceName(game)]; if (face) this.blitHud(face, 60, 169);
      if (p.armor) this.num(p.armor, 140, 180, 'STTNUM', 14, true);
      if (w.ammo) this.num(p.ammo[w.ammo], 314, 180, 'STTNUM', 14);
      [['blue', 'STKEYS0'], ['yellow', 'STKEYS1'], ['red', 'STKEYS2']].forEach(([k, pic], i) => { if (p.keys[k]) this.blitHud(H[pic], 240 + i * 10, 186); });
    }

    // ---------------------------------------------------------------- automap
    drawAutomap(game, am) {
      const W = this.W, Hh = this.viewH, fb = this.fb, L = this.L, p = game.player;
      const bg = this.cm[C(RAMP.GRAY, 1)];
      for (let i = 0; i < W * Hh; i++) fb[i] = bg;
      const zoom = (am.zoom || 0.2) * this.scale, cx = am.follow !== false ? this.vx : am.x, cy = am.follow !== false ? this.vy : am.y;
      const rot = !!am.rotate, ca = Math.cos(-this.va + PI / 2), sa = Math.sin(-this.va + PI / 2);
      const tr = (x, y) => { let dx = x - cx, dy = y - cy; if (rot) { const rx = dx * ca - dy * sa, ry = dx * sa + dy * ca; dx = rx; dy = ry; } return [W / 2 + dx * zoom, Hh / 2 - dy * zoom]; };
      const col = (ramp, s) => this.cm[C(ramp, s)];
      const all = am.cheat || p.powers.allmap;
      for (const l of L.lines) {
        const mapped = l.flags & D.LF.MAPPED;
        if (l.flags & D.LF.NEVERMAP) continue;
        if (!mapped && !all) continue;
        let c;
        if (!mapped) c = col(RAMP.GRAY, 7);
        else if (l.back < 0) c = col(RAMP.RED, 11);
        else {
          const f = L.sectors[l.front], b = L.sectors[l.back];
          if (l.flags & D.LF.SECRET) c = col(RAMP.RED, 11);
          else if (f.door || b.door) c = col(f.door && f.door.key || b.door && b.door.key ? ({ red: RAMP.RED, blue: RAMP.BLUE, yellow: RAMP.YELLOW })[(f.door && f.door.key) || b.door.key] : RAMP.YELLOW, 13);
          else if (f.floor !== b.floor) c = col(RAMP.BROWN, 11);
          else if (f.ceil !== b.ceil) c = col(RAMP.YELLOW, 12);
          else if (am.cheat) c = col(RAMP.GRAY, 8); else continue;
        }
        const [x1, y1] = tr(l.x1, l.y1), [x2, y2] = tr(l.x2, l.y2);
        this.line(x1, y1, x2, y2, c, Hh);
      }
      // player arrow
      const mo = p.mo, a = rot ? PI / 2 : this.va, [px, py] = tr(this.vx, this.vy), s = 16 * zoom + 3 * this.scale;
      const pt = (dx, dy) => { const x = dx * Math.cos(a) - dy * Math.sin(a), y = dx * Math.sin(a) + dy * Math.cos(a); return [px + x, py - y]; };
      const wc = this.cm[C(RAMP.GRAY, 15)];
      const segs = [[[-s, 0], [s, 0]], [[s, 0], [s * 0.4, s * 0.4]], [[s, 0], [s * 0.4, -s * 0.4]], [[-s, 0], [-s * 1.3, s * 0.4]], [[-s, 0], [-s * 1.3, -s * 0.4]]];
      for (const [u, v] of segs) { const [x1, y1] = pt(...u), [x2, y2] = pt(...v); this.line(x1, y1, x2, y2, wc, Hh); }
      if (am.cheat === 2) for (const m of game.mobjs) { if (m.player || !m.info.sprite) continue; const [x, y] = tr(m.x, m.y), r = m.radius * zoom; const c = col(m.flags & MF.COUNTKILL ? RAMP.RED : m.flags & MF.SPECIAL ? RAMP.YELLOW : RAMP.GREEN, 12); this.line(x - r, y - r, x + r, y + r, c, Hh); this.line(x - r, y + r, x + r, y - r, c, Hh); }
    }
    line(x0, y0, x1, y1, c, hMax) {
      const W = this.W, fb = this.fb, n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
      if (n > 4000) return;
      for (let i = 0; i <= n; i++) { const t = n ? i / n : 0, x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t); if (x >= 0 && y >= 0 && x < W && y < hMax) fb[y * W + x] = c; }
    }
    // palette pic -> RGBA for the UI (menus, icons)
    picRGBA(pic) { const out = new Uint8ClampedArray(pic.w * pic.h * 4); for (let i = 0; i < pic.w * pic.h; i++) { const c = pic.px[i]; if (!c) continue; out[i * 4] = PALETTE[c * 3]; out[i * 4 + 1] = PALETTE[c * 3 + 1]; out[i * 4 + 2] = PALETTE[c * 3 + 2]; out[i * 4 + 3] = 255; } return out; }
  }
  D.Renderer = Renderer;
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Doom98 = globalThis.Doom98 || {});
