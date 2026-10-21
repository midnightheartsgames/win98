(function (C) {
  'use strict';
  const { W, H, T, hash, clamp } = C;

  const THEMES = {
    meadow: {
      sky: '#29adff',
      layers: [
        { img: 'g_cloud2', y: 14, f: 0.04, drift: 5, gap: 260, top: true },
        { img: 'g_cloud1', y: 46, f: 0.07, drift: 8, gap: 190, top: true },
        { img: 'g_bg4', f: 0.12, fy: 0.05 },
        { img: 'g_bg3', f: 0.25, fy: 0.1 },
        { img: 'g_bg2', f: 0.4, fy: 0.16 }
      ],
      bird: 'sparrow', diver: 'cardinal', dog: 'dog'
    },
    mountain: {
      skyImg: 'm_bg',
      layers: [
        { img: 'm_far', f: 0.08, fy: 0.04 },
        { img: 'm_mount', f: 0.18, fy: 0.08 },
        { img: 'm_trees', f: 0.32, fy: 0.13 },
        { img: 'm_fg', f: 0.5, fy: 0.2 }
      ],
      bird: 'jay', diver: 'cardinal', dog: 'dog'
    },
    site: {
      skyImg: 'i_bg',
      layers: [
        { img: 'i_far', f: 0.1, fy: 0.05 },
        { img: 'i_build', f: 0.22, fy: 0.1 },
        { img: 'i_fg', f: 0.4, fy: 0.16 }
      ],
      bird: 'dove', diver: 'jay', dog: 'dogDark'
    },
    neon: {
      skyImg: 'c_far',
      layers: [
        { img: 'c_back', f: 0.2, fy: 0.08 },
        { img: 'c_fg', f: 0.42, fy: 0.15 }
      ],
      bird: 'dove', diver: 'crow', dog: 'dogGrey'
    }
  };

  const GROUND = '#X';

  class Renderer {
    constructor(S) {
      this.S = S;
      this.buf = C.Assets.canvas(W, H);
      this.g = this.buf.getContext('2d');
      this.g.imageSmoothingEnabled = false;
      this.parts = [];
      this.pops = [];
      this.skyCache = {};
      this.land = 0;
      this.trail = [];
    }

    setGame(game, theme, skin) {
      this.game = game;
      this.theme = theme;
      this.th = THEMES[theme];
      this.skin = skin || 'catniss';
      this.parts = [];
      this.pops = [];
      this.trail = [];
      this.buildRegions();
      this.buildAutoDecor();
    }

    buildRegions() {
      const lv = this.game.lv;
      this.region = new Int32Array(lv.w * lv.h).fill(-1);
      this.regionReveal = [];
      let id = 0;
      for (let i = 0; i < lv.tiles.length; i++) {
        if (lv.tiles[i] !== 'X' || this.region[i] >= 0) continue;
        const stack = [i];
        while (stack.length) {
          const k = stack.pop();
          if (this.region[k] >= 0 || lv.tiles[k] !== 'X') continue;
          this.region[k] = id;
          const x = k % lv.w;
          if (x > 0) stack.push(k - 1);
          if (x < lv.w - 1) stack.push(k + 1);
          if (k >= lv.w) stack.push(k - lv.w);
          if (k + lv.w < lv.tiles.length) stack.push(k + lv.w);
        }
        this.regionReveal.push(0);
        id++;
      }
    }

    buildAutoDecor() {
      const lv = this.game.lv, out = [];
      const th = this.theme;
      if (this.game.def.noDecor) { this.autoDecor = out; return; }
      for (let cy = 1; cy < lv.h; cy++) {
        for (let cx = 0; cx < lv.w; cx++) {
          const ch = lv.tiles[cy * lv.w + cx];
          if (ch !== '#') continue;
          const above = lv.tiles[(cy - 1) * lv.w + cx];
          if (above !== '.') continue;
          const r = hash(cx * 7919 + cy * 104729 + 17) % 100;
          if (th === 'meadow') {
            if (r < 30) out.push({ img: 'g_grass' + (1 + (r % 4)), x: cx * T, y: (cy - 1) * T });
            else if (r < 36) out.push({ img: 'g_flower', x: cx * T, y: (cy - 1) * T });
            else if (r < 39) out.push({ img: 'g_stone' + (1 + (r % 2)), x: cx * T, y: (cy - 1) * T });
          } else if (th === 'mountain') {
            if (r < 26) out.push({ img: 'g_grass' + (1 + (r % 4)), x: cx * T, y: (cy - 1) * T });
            else if (r < 32) out.push({ img: 'g_stone' + (1 + (r % 2)), x: cx * T, y: (cy - 1) * T });
          } else if (th === 'site') {
            if (r < 9) out.push({ img: 'g_stone' + (1 + (r % 2)), x: cx * T, y: (cy - 1) * T });
            else if (r < 20) out.push({ img: 'g_grass' + (1 + (r % 4)), x: cx * T, y: (cy - 1) * T });
          }
        }
      }
      this.autoDecor = out;
    }

    events(list) {
      for (const e of list) {
        switch (e.t) {
          case 'jump': this.dust(e.x, e.y, 4, 0.6); this.squash = { t: 0.12, kind: 'stretch' }; break;
          case 'land': this.dust(e.x, e.y, Math.min(8, 3 + e.v / 80), 1); this.squash = { t: 0.12, kind: 'squash' }; break;
          case 'walljump': this.dust(e.x, e.y, 4, 0.8); break;
          case 'coin': this.spark(e.x, e.y, '#ffe27a', 5); break;
          case 'butterfly': this.spark(e.x, e.y, '#bfe8ff', 8); this.pop(e.x, e.y, '+3', '#ffe27a'); break;
          case 'life': this.pop(e.x, e.y - 6, '+1', '#ff6a8a', true); this.spark(e.x, e.y, '#ff9ab0', 8); break;
          case 'fish': this.spark(e.x, e.y, '#9ae8ff', 16); this.spark(e.x, e.y, '#ffe27a', 10); break;
          case 'stomp': this.stars(e.x, e.y); break;
          case 'kill': this.feathers(e.x, e.y, e.who); break;
          case 'hurt': this.spark(e.x, e.y, '#ff4a6a', 8); break;
          case 'drown': this.splash(e.x, e.y); break;
          case 'check': this.spark(e.x, e.y, '#ffd34a', 10); break;
          case 'crumble': this.debris(e.x, e.y); break;
          case 'brick': this.debris(e.x, e.y - 4, '#b5562e'); break;
          case 'bosshit': this.stars(e.x, e.y); this.spark(e.x, e.y, '#ffd34a', 14); break;
          case 'vanbreak': for (let i = 0; i < 5; i++) this.debris(e.x - 20 + i * 10, e.y, '#c2bfd0'); break;
          case 'bounce': this.dust(e.x, e.y, 3, 0.5, '#ffffff'); break;
          case 'rescue': this.spark(e.x, e.y, '#ffd34a', 22); this.spark(e.x, e.y, '#ff9ab0', 12); break;
          case 'clear': this.spark(e.x, e.y, '#ffffff', 16); break;
        }
      }
    }

    dust(x, y, n, sp, col) {
      for (let i = 0; i < n; i++) this.parts.push({ x: x + (Math.random() - 0.5) * 8, y: y - 1, vx: (Math.random() - 0.5) * 60 * sp, vy: -Math.random() * 30 * sp, life: 0.35 + Math.random() * 0.2, max: 0.5, col: col || (this.theme === 'neon' ? '#5a4a80' : this.theme === 'mountain' ? '#f6eefa' : '#e8d8b8'), size: 2, g: 60 });
    }

    spark(x, y, col, n) {
      for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 30 + Math.random() * 70; this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4 + Math.random() * 0.3, max: 0.7, col, size: 1, g: 0 }); }
    }

    stars(x, y) {
      for (let i = 0; i < 5; i++) { const a = -Math.PI * (0.15 + 0.7 * i / 4); this.parts.push({ x, y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, life: 0.35, max: 0.35, col: '#fff7a0', size: 2, g: 0 }); }
    }

    feathers(x, y, who) {
      const col = who === 'hen' ? '#ffffff' : who === 'bird' || who === 'diver' ? '#c88a5a' : '#d8c8a8';
      for (let i = 0; i < 8; i++) this.parts.push({ x, y, vx: (Math.random() - 0.5) * 90, vy: -Math.random() * 90, life: 0.8 + Math.random() * 0.4, max: 1.2, col, size: 2, g: 120, sway: true });
    }

    splash(x, y) {
      for (let i = 0; i < 14; i++) this.parts.push({ x: x + (Math.random() - 0.5) * 10, y, vx: (Math.random() - 0.5) * 100, vy: -60 - Math.random() * 120, life: 0.7, max: 0.7, col: i % 2 ? '#bfe8ff' : '#29adff', size: 2, g: 500 });
    }

    debris(x, y, col) {
      for (let i = 0; i < 8; i++) this.parts.push({ x: x + (Math.random() - 0.5) * 12, y: y + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 80, vy: -Math.random() * 90, life: 0.8, max: 0.8, col: col || '#5d4466', size: 3, g: 600 });
    }

    pop(x, y, text, col, heart) { this.pops.push({ x, y, text, col, heart, life: 1.0 }); }

    update(dt) {
      for (const p of this.parts) {
        p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt + (p.sway ? Math.sin(p.life * 12) * 0.4 : 0); p.y += p.vy * dt;
        if (p.sway) { p.vx *= 0.96; p.vy = Math.min(p.vy, 30); }
      }
      this.parts = this.parts.filter(p => p.life > 0);
      for (const p of this.pops) { p.life -= dt; p.y -= 18 * dt; }
      this.pops = this.pops.filter(p => p.life > 0);
      if (this.squash) { this.squash.t -= dt; if (this.squash.t <= 0) this.squash = null; }
      const gm = this.game;
      if (gm && gm.player.dashT > 0) this.trail.push({ x: gm.player.x, y: gm.player.y, face: gm.player.face, life: 0.18 });
      for (const t of this.trail) t.life -= dt;
      this.trail = this.trail.filter(t => t.life > 0);
      if (gm) {
        const p = gm.player;
        for (let i = 0; i < this.regionReveal.length; i++) this.regionReveal[i] = Math.max(0, this.regionReveal[i] - dt * 2);
        const x0 = Math.floor(p.x / T) - 1, x1 = Math.floor((p.x + p.w) / T) + 1, y0 = Math.floor(p.y / T) - 1, y1 = Math.floor((p.y + p.h) / T) + 1;
        for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
          if (cx < 0 || cy < 0 || cx >= gm.lv.w || cy >= gm.lv.h) continue;
          const r = this.region[cy * gm.lv.w + cx];
          if (r >= 0) this.regionReveal[r] = Math.min(1, this.regionReveal[r] + dt * 6);
        }
      }
    }

    draw(t) {
      const g = this.g, gm = this.game, S = this.S;
      const shake = gm.shake > 0 ? Math.round((Math.random() - 0.5) * 4 * gm.shake / 0.25) : 0;
      const cx = Math.round(gm.cam.x), cy = Math.round(gm.cam.y) + shake;
      this.cx = cx; this.cy = cy;
      this.drawBackground(g, t, cx, cy);
      g.save();
      g.translate(-cx, -cy);
      this.drawDecor(g, t, true);
      this.drawTiles(g, t, cx, cy);
      this.drawDecor(g, t, false);
      for (const e of gm.ents) if (e.alive) this.drawEnt(g, e, t);
      this.drawPlayer(g, t);
      this.drawWater(g, t, cx, cy);
      for (const p of this.parts) {
        g.globalAlpha = clamp(p.life / p.max * 1.5, 0, 1);
        g.fillStyle = p.col;
        g.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
      g.globalAlpha = 1;
      g.restore();
      if (gm.scroll) this.drawPack(g, t);
    }

    skyInfo(name) {
      if (this.skyCache[name]) return this.skyCache[name];
      const im = this.S.raw[name];
      if (!im) return null;
      const c = C.Assets.canvas(im.width, im.height);
      const cg = c.getContext('2d');
      cg.drawImage(im, 0, 0);
      const top = cg.getImageData(2, 0, 1, 1).data, bot = cg.getImageData(2, im.height - 1, 1, 1).data;
      const info = { top: `rgb(${top[0]},${top[1]},${top[2]})`, bot: `rgb(${bot[0]},${bot[1]},${bot[2]})` };
      this.skyCache[name] = info;
      return info;
    }

    drawBackground(g, t, cx, cy) {
      const th = this.th, S = this.S, gm = this.game;
      const maxY = Math.max(0, gm.lv.h * T - H);
      const up = maxY - cy;
      if (th.skyImg) {
        const im = S.raw[th.skyImg];
        const info = this.skyInfo(th.skyImg);
        if (im && info) {
          const sy = th.skyImg === 'c_far' || th.skyImg === 'i_bg' ? H - im.height + Math.min(up * 0.03, 40) : Math.min(up * 0.02, 30);
          g.fillStyle = info.top; g.fillRect(0, 0, W, Math.max(0, sy + 1));
          g.fillStyle = info.bot; g.fillRect(0, sy + im.height - 1, W, H);
          this.tileX(g, im, cx * 0.03, sy);
        }
      } else {
        g.fillStyle = th.sky; g.fillRect(0, 0, W, H);
      }
      for (const L of th.layers) {
        const im = S.raw[L.img];
        if (!im) continue;
        if (L.top) {
          const off = cx * L.f + t * L.drift;
          const span = im.width + L.gap;
          let x = -((off % span) + span) % span;
          for (; x < W; x += span) g.drawImage(im, Math.round(x), L.y + Math.round(Math.min(up * 0.04, 30)));
          continue;
        }
        const y = H - im.height + Math.round(Math.min(up * L.fy, im.height * 0.9));
        this.tileX(g, im, cx * L.f, y);
      }
    }

    tileX(g, im, off, y) {
      let x = -((Math.round(off) % im.width) + im.width) % im.width;
      for (; x < W; x += im.width) g.drawImage(im, x, Math.round(y));
    }

    isGround(cx, cy) {
      const lv = this.game.lv;
      if (cx < 0 || cx >= lv.w) return true;
      if (cy < 0) return false;
      if (cy >= lv.h) return true;
      return GROUND.includes(lv.tiles[cy * lv.w + cx]);
    }

    drawTiles(g, t, cx, cy) {
      const gm = this.game, lv = gm.lv, S = this.S;
      const ts = S.tiles[this.theme] || S.tiles.meadow;
      const x0 = Math.max(0, Math.floor(cx / T)), x1 = Math.min(lv.w - 1, Math.floor((cx + W) / T));
      const y0 = Math.max(0, Math.floor(cy / T)), y1 = Math.min(lv.h - 1, Math.floor((cy + H) / T));
      const blit = (tx, ty, x, y) => g.drawImage(ts, tx * T, ty * T, T, T, x, y, T, T);
      const ventCells = this.ventCells || (this.ventCells = new Set(gm.ents.filter(e => e.type === 'vent' || e.type === 'fan' || e.type === 'dropper').map(e => Math.floor(e.y / T) * lv.w + Math.floor(e.x / T))));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const k = y * lv.w + x;
          const ch = lv.tiles[k];
          const px = x * T, py = y * T;
          if (ch === '.' || ch === ':' || ch === '~' || ch === 'w') continue;
          if (ventCells.has(k)) continue;
          if (ch === '#' || ch === 'X') {
            if (ch === 'X') { const r = this.regionReveal[this.region[k]] || 0; if (r > 0) g.globalAlpha = 1 - r * 0.62; }
            const U = this.isGround(x, y - 1), D = this.isGround(x, y + 1), L = this.isGround(x - 1, y), R = this.isGround(x + 1, y);
            const col = L && R ? 1 : !L && R ? 0 : L && !R ? 2 : 3;
            const row = !U && D ? 0 : U && D ? 1 : U && !D ? 2 : 3;
            if (col === 1 && row === 1) {
              const h = hash(k * 31 + 7) % 23;
              if (h === 0 && this.isGround(x, y - 2)) blit(8, 7, px, py);
              else if (h === 1 && this.isGround(x, y - 2)) blit(9, 7, px, py);
              else blit(1, 1, px, py);
              if (U && L && !this.isGround(x - 1, y - 1)) blit(5, 1, px, py);
              else if (U && R && !this.isGround(x + 1, y - 1)) blit(4, 1, px, py);
            } else blit(col, row, px, py);
            if (ch === 'X') { g.globalAlpha *= 0.35; g.drawImage(S.crack, px, py); }
            g.globalAlpha = 1;
          } else if (ch === 'C') {
            const c = gm.crumble.get(k);
            if (c && c.gone > 0) {
              g.globalAlpha = 0.18; blit(3, 3, px, py); g.globalAlpha = 1;
              continue;
            }
            const sh = c && c.shake > 0 ? Math.round(Math.sin(t * 70) * 1) : 0;
            blit(3, 3, px + sh, py);
            g.drawImage(S.crack, px + sh, py);
          } else if (ch === '=') {
            const L = lv.tiles[k - 1] === '=', R = lv.tiles[k + 1] === '=';
            blit(L && R ? 5 : !L && R ? 4 : L && !R ? 6 : 5, 7, px, py);
          } else if (ch === '-') {
            const L = lv.tiles[k - 1] === '-', R = lv.tiles[k + 1] === '-';
            blit(L && R ? 5 : !L ? 4 : 6, 6, px, py);
          } else if (ch === '^') {
            g.drawImage(S.spikes[this.theme], px, py);
          } else if (ch === '<' || ch === '>') {
            const fr = Math.floor(t * 12) % 6;
            g.drawImage(ch === '>' ? S.conveyorR[fr] : S.conveyorL[fr], px, py);
          } else if (ch === 't' || ch === 'T') {
            const ph = ch === 't' ? 0 : 1;
            const on = gm.flickOn(ph);
            const warn = gm.flickWarn(ph) && Math.floor(t * 16) % 2;
            const set = ph ? S.neonB : S.neonA;
            g.drawImage(set[on && !warn ? 1 : 0], px, py);
            if (on && !warn) { g.globalAlpha = 0.18; g.fillStyle = ph ? '#41f2ff' : '#ff3f8e'; g.fillRect(px - 1, py - 2, 18, 9); g.globalAlpha = 1; }
          }
        }
      }
    }

    drawWater(g, t, cx, cy) {
      const gm = this.game, lv = gm.lv, S = this.S;
      const ts = S.tiles[this.theme] || S.tiles.meadow;
      const deco = S.deco[this.theme] || S.deco.meadow;
      const x0 = Math.max(0, Math.floor(cx / T)), x1 = Math.min(lv.w - 1, Math.floor((cx + W) / T));
      const y0 = Math.max(0, Math.floor(cy / T)), y1 = Math.min(lv.h - 1, Math.floor((cy + H) / T));
      const fr = Math.floor(t * 8) % 10;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const ch = lv.tiles[y * lv.w + x];
        if (ch !== '~' && ch !== 'w') continue;
        g.globalAlpha = 0.85;
        g.drawImage(ts, 7 * T, 6 * T + 2, T, T - 4, x * T, y * T + (ch === '~' ? 6 : 0), T, ch === '~' ? T - 6 : T);
        g.globalAlpha = 1;
        if (ch === '~' && deco.g_water) g.drawImage(deco.g_water, ((fr + x) % 10) * T, 0, T, T, x * T, y * T - 4, T, T);
        if (ch === 'w' && deco.g_bubbles && hash(x * 13 + y) % 5 === 0) g.drawImage(deco.g_bubbles, (Math.floor(t * 6 + x) % 5) * T, 0, T, T, x * T, y * T, T, T);
      }
    }

    drawDecor(g, t, back) {
      const gm = this.game, deco = this.S.deco[this.theme] || this.S.deco.meadow, S = this.S;
      const cx = this.cx, cy = this.cy;
      const vis = (x, y, w, h) => x + w > cx && x < cx + W && y + h > cy && y < cy + H;
      if (back) {
        for (const d of gm.lv.decor) {
          const x = d.cx * T, y = d.cy * T;
          let im = null, ox = 0, oy = 0;
          if (d.ch === 'Y') { im = deco.g_tree; ox = -24; oy = -64; }
          else if (d.ch === 'J') { im = S.neonSigns[hash(d.cx * 3 + d.cy) % S.neonSigns.length]; ox = 0; oy = 2; }
          if (!im || !vis(x + ox, y + oy, im.width, im.height)) continue;
          if (d.ch === 'J' && hash(d.cx + Math.floor(t * 3)) % 23 === 0) g.globalAlpha = 0.4;
          g.drawImage(im, x + ox, y + oy);
          g.globalAlpha = 1;
        }
        return;
      }
      for (const d of this.autoDecor) {
        const im = deco[d.img];
        if (im && vis(d.x, d.y, 16, 16)) g.drawImage(im, d.x, d.y);
      }
      for (const d of gm.lv.decor) {
        const x = d.cx * T, y = d.cy * T;
        let im = null, ox = 0;
        if (d.ch === 'y') im = deco.g_bush;
        else if (d.ch === '%') { im = deco.g_stone3; ox = -8; }
        if (im && vis(x + ox, y, im.width, 16)) g.drawImage(im, x + ox, y + T - im.height);
      }
    }

    frameOf(fr, dir, k) {
      const row = dir < 0 ? fr.left : fr.right;
      return row[k % 3];
    }

    drawSprite(g, im, x, y, sx, sy, rot) {
      const w = im.width, h = im.height;
      if (sx === 1 && sy === 1 && !rot) { g.drawImage(im, Math.round(x - w / 2), Math.round(y - h)); return; }
      g.save();
      g.translate(Math.round(x), Math.round(y));
      if (rot) { g.translate(0, -h / 2); g.rotate(rot); g.translate(0, h / 2); }
      g.scale(sx, sy);
      g.drawImage(im, -w / 2, -h);
      g.restore();
    }

    drawPlayer(g, t) {
      const gm = this.game, p = gm.player, S = this.S;
      const fr = S.cats[this.skin] || S.cats.catniss;
      if (!fr) return;
      for (const tr of this.trail) {
        g.globalAlpha = tr.life / 0.18 * 0.45;
        this.drawSprite(g, this.frameOf(fr, tr.face, 2), tr.x + p.w / 2, tr.y + p.h + 1, 1.2, 0.86);
      }
      g.globalAlpha = 1;
      if (p.invul > 0 && gm.state === 'play' && Math.floor(t * 20) % 2) return;
      const bx = p.x + p.w / 2, by = p.y + p.h + 1;
      let im, sx = 1, sy = 1, rot = 0;
      if (gm.state === 'dying') {
        im = fr.down[1];
        this.drawSprite(g, im, bx, by, 1, -1);
        return;
      }
      if (gm.state === 'clear' || gm.state === 'rescue') {
        im = fr.down[Math.floor(t * 4) % 2 ? 1 : 0];
        this.drawSprite(g, im, bx, by, 1, 1);
        return;
      }
      if (p.wall) {
        im = this.frameOf(fr, p.wall, Math.floor(t * 6) % 3);
        rot = p.wall > 0 ? -Math.PI / 2 : Math.PI / 2;
        this.drawSprite(g, im, bx + p.wall * 1, by - 2, 1, 1, rot);
        return;
      }
      if (p.dashT > 0) { im = this.frameOf(fr, p.face, 2); sx = 1.22; sy = 0.84; }
      else if (!p.onGround) {
        if (p.fan) { im = this.frameOf(fr, p.face, Math.floor(t * 8) % 3); sy = 1.05; }
        else if (p.vy < -60) { im = this.frameOf(fr, p.face, 2); sx = 0.92; sy = 1.1; }
        else if (p.vy > 80) { im = this.frameOf(fr, p.face, 0); sx = 0.95; sy = 1.06; }
        else im = this.frameOf(fr, p.face, 1);
      } else if (Math.abs(p.vx) > 8) {
        const k = Math.floor(t * (5 + Math.abs(p.vx) / 14)) % 4;
        im = this.frameOf(fr, p.face, [0, 1, 2, 1][k]);
      } else if (p.idle > 3.5) {
        im = fr.down[p.idle > 7 && Math.floor(p.idle * 1.5) % 5 === 0 ? 0 : 1];
      } else im = this.frameOf(fr, p.face, 1);
      if (this.squash && p.dashT <= 0) {
        const k = this.squash.t / 0.12;
        if (this.squash.kind === 'squash' && p.onGround) { sx = 1 + 0.18 * k; sy = 1 - 0.18 * k; }
        if (this.squash.kind === 'stretch') { sx = 1 - 0.12 * k; sy = 1 + 0.14 * k; }
      }
      if (p.hurtT > 0) { g.globalAlpha = 0.7; }
      this.drawSprite(g, im, bx, by, sx, sy);
      g.globalAlpha = 1;
    }

    drawEnt(g, e, t) {
      const S = this.S, gm = this.game;
      const cx = this.cx, cy = this.cy;
      if (e.x + e.w < cx - 80 || e.x > cx + W + 80 || e.y + e.h < cy - 80 || e.y > cy + H + 80) return;
      const bx = e.x + e.w / 2, by = e.y + e.h + 1;
      const flash = e.hitT > 0 && Math.floor(t * 24) % 2;
      if (flash) g.globalAlpha = 0.5;
      switch (e.type) {
        case 'coin': {
          const f = S.coin[(Math.floor(t * 10 + e.x * 0.13)) % 6];
          if (f) g.drawImage(f, 0, 0, 16, 16, Math.round(e.x - 1), Math.round(e.y - 1 + Math.sin(t * 3 + e.x) * 1), 12, 12);
          break;
        }
        case 'fish': {
          const bags = S.fishSmall && S.fishSmall[this.game.def.fishIndex || 0];
          const fr = bags ? bags[Math.floor(t * 4) % bags.length] : null;
          const yb = Math.round(e.y + Math.sin(t * 2.4) * 2) - 8;
          g.globalAlpha = 0.35 + Math.sin(t * 5) * 0.15;
          g.fillStyle = '#ffffff';
          g.beginPath(); g.arc(e.x + 10, yb + 18, 15, 0, Math.PI * 2); g.fill();
          g.globalAlpha = 1;
          if (fr) g.drawImage(fr, Math.round(e.x - 2), yb);
          if (Math.floor(t * 3) % 2) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(e.x + 18), yb + 2, 1, 3); g.fillRect(Math.round(e.x + 17), yb + 3, 3, 1); }
          break;
        }
        case 'milk': g.drawImage(S.milk, Math.round(e.x), Math.round(e.y + Math.sin(t * 3) * 1)); break;
        case 'check': g.drawImage(S.box[e.on ? 1 : 0], Math.round(e.x), Math.round(e.y));
          if (e.on) { const hd = S.head[this.skin] || S.head.catniss; g.drawImage(hd, Math.round(e.x + 4), Math.round(e.y - 5 + Math.sin(t * 3))); }
          break;
        case 'exit': {
          const deco = S.deco[this.theme] || S.deco.meadow;
          const pulse = 0.25 + Math.sin(t * 3) * 0.12;
          g.globalAlpha = pulse; g.fillStyle = '#fff7d8';
          g.fillRect(e.x - 4, e.y - 2, e.w + 8, e.h + 2);
          g.globalAlpha = 1;
          if (deco.g_entry4) g.drawImage(deco.g_entry4, e.x, e.y);
          if (Math.floor(t * 2) % 2) { g.fillStyle = '#ffffff'; g.fillRect(e.x + 7, e.y - 8 + Math.round(Math.sin(t * 4) * 2), 2, 4); g.fillRect(e.x + 6, e.y - 5 + Math.round(Math.sin(t * 4) * 2), 4, 1); }
          break;
        }
        case 'cage': {
          const kit = S.cats[e.kitten];
          if (!e.open) {
            if (kit) this.drawSprite(g, kit.down[Math.floor(t * 2) % 2 ? 1 : 0], e.x + 12, e.y + 22, 0.75, 0.75);
            g.drawImage(S.cage, Math.round(e.x), Math.round(e.y));
          } else {
            g.globalAlpha = 0.5; g.drawImage(S.cage, Math.round(e.x), Math.round(e.y) + 4); g.globalAlpha = 1;
            if (kit) this.drawSprite(g, kit.down[Math.floor(t * 6) % 3], e.x + 30, e.y + 25 - Math.abs(Math.sin(t * 6)) * 6, 1, 1);
          }
          break;
        }
        case 'kitten': {
          const kit = S.cats[e.kitten];
          if (kit) this.drawSprite(g, e.st === 'jump' ? this.frameOf(kit, e.dir, 2) : kit.down[Math.floor(t * 3) % 2 ? 1 : 0], bx, by, 1, 1);
          break;
        }
        case 'sign': {
          g.drawImage(S.sign, e.x, e.y);
          break;
        }
        case 'hen': {
          const k = e.st === 'peck' ? (Math.floor(t * 8) % 2 ? 0 : 2) : Math.floor(t * 6) % 3;
          this.drawEntSprite(g, S.hen, e, k, bx, by);
          break;
        }
        case 'dog': {
          const fr = S[this.th.dog] || S.dog;
          const sp = e.st === 'charge' ? 16 : e.st === 'walk' ? 6 : 0;
          const k = sp ? Math.floor(t * sp) % 3 : 1;
          this.drawEntSprite(g, fr, e, k, bx, by);
          if (e.st === 'alert') this.bang(g, bx, e.y - 14, t);
          if (e.st === 'stun') this.dizzy(g, bx, e.y - 6, t);
          break;
        }
        case 'wolf': {
          const k = e.st === 'crouch' ? 1 : e.st === 'leap' ? 2 : Math.floor(t * 8) % 3;
          const sy = e.st === 'crouch' ? 0.82 : 1;
          if (e.dying) { this.drawSprite(g, this.frameOf(S.wolf, e.dir, 1), bx, by, 1, -1); break; }
          this.drawSprite(g, this.frameOf(S.wolf, e.dir, k), bx, by, 1, sy);
          if (e.st === 'stun') this.dizzy(g, bx, e.y - 6, t);
          break;
        }
        case 'sheep': {
          const sq = e.squash > 0 ? e.squash / 0.25 : 0;
          const k = e.st === 'walk' ? Math.floor(t * 4) % 3 : 1;
          this.drawSprite(g, this.frameOf(S.sheep, e.dir, k), bx, by, 1 + sq * 0.2, 1 - sq * 0.3);
          break;
        }
        case 'bird': case 'diver': {
          const name = e.type === 'diver' ? this.th.diver : this.th.bird;
          const fr = S.birds && S.birds[name];
          if (!fr) break;
          const sp = e.type === 'diver' && e.st === 'warn' ? 22 : 9;
          const k = Math.floor(t * sp + e.x0) % 3;
          if (e.dying) { this.drawSprite(g, this.frameOf(fr, e.dir || 1, 1), bx, e.y + 20, 1, -1); break; }
          this.drawSprite(g, this.frameOf(fr, e.dir || 1, k), bx, e.y + 24, 1, 1);
          if (e.type === 'diver' && e.st === 'warn') this.bang(g, bx, e.y - 10, t);
          break;
        }
        case 'butterfly': {
          const deco = S.deco[this.theme] || S.deco.meadow;
          if (deco.g_butterfly) g.drawImage(deco.g_butterfly, (Math.floor(t * 10) % 4) * 16, 0, 16, 16, Math.round(e.x - 3), Math.round(e.y - 3), 16, 16);
          break;
        }
        case 'plat': {
          const ts = S.tiles[this.theme] || S.tiles.meadow;
          const x = Math.round(e.x), y = Math.round(e.y);
          g.drawImage(ts, 4 * T, 7 * T, T, T, x, y, T, T);
          g.drawImage(ts, 5 * T, 7 * T, T, T, x + T, y, T, T);
          g.drawImage(ts, 6 * T, 7 * T, T, T, x + 2 * T, y, T, T);
          if (this.theme === 'site') { g.fillStyle = '#12181c'; g.fillRect(x + 23, y - 40, 2, 40); }
          break;
        }
        case 'vent': {
          g.drawImage(S.vent, e.x, e.y);
          if (gm.ventWarn(e)) { if (Math.floor(t * 12) % 2) { g.fillStyle = '#e8eef0'; g.fillRect(e.x + 4 + (Math.floor(t * 30) % 8), e.y - 3, 2, 2); } }
          if (gm.ventOn(e)) {
            const h = e.y - e.top;
            for (let i = 0; i < 9; i++) {
              const yy = e.y - ((t * 90 + i * 17) % h);
              const r = 3 + (e.y - yy) / h * 4;
              g.globalAlpha = 0.75 - (e.y - yy) / h * 0.4;
              g.fillStyle = i % 2 ? '#ffffff' : '#d8e4e8';
              g.beginPath(); g.arc(e.x + 8 + Math.sin(i * 2.1 + t * 9) * 2, yy, r, 0, Math.PI * 2); g.fill();
            }
            g.globalAlpha = 1;
          }
          break;
        }
        case 'fan': {
          g.drawImage(S.fan[Math.floor(t * 20) % 2], e.x, e.y);
          g.fillStyle = '#41f2ff';
          for (let i = 0; i < 5; i++) {
            const h = e.y - e.top;
            const yy = e.y - ((t * 120 + i * 29) % h);
            g.globalAlpha = 0.45;
            g.fillRect(e.x + 2 + i * 3, Math.round(yy), 1, 5);
          }
          g.globalAlpha = 1;
          break;
        }
        case 'dropper': {
          g.drawImage(S.dropper, e.x + (e.warn ? Math.round(Math.sin(t * 60)) : 0), e.y);
          if (e.warn) {
            g.globalAlpha = 0.25 + (e.k - 0.7) * 1.5;
            g.fillStyle = '#000000';
            g.beginPath(); g.ellipse(e.x + 8, e.bottom - 1, 7, 2, 0, 0, Math.PI * 2); g.fill();
            g.globalAlpha = 1;
          }
          break;
        }
        case 'brick': g.drawImage(S.brick, Math.round(e.x), Math.round(e.y)); break;
        case 'car': {
          const im = (e.vx < 0 ? S.carsL : S.cars)[e.tint];
          g.drawImage(im, Math.round(e.x), Math.round(e.y));
          g.globalAlpha = 0.18; g.fillStyle = '#fff7a0';
          if (e.vx > 0) g.fillRect(Math.round(e.x + e.w), Math.round(e.y + 4), 40, 7); else g.fillRect(Math.round(e.x - 40), Math.round(e.y + 4), 40, 7);
          g.globalAlpha = 1;
          break;
        }
        case 'van': this.drawVan(g, e, t); break;
      }
      g.globalAlpha = 1;
    }

    drawEntSprite(g, fr, e, k, bx, by) {
      if (e.dying) { this.drawSprite(g, this.frameOf(fr, e.dir, 1), bx, by, 1, -1); return; }
      this.drawSprite(g, this.frameOf(fr, e.dir, k), bx, by, 1, 1);
    }

    bang(g, x, y, t) {
      g.fillStyle = '#ffffff'; g.fillRect(Math.round(x) - 2, Math.round(y) - 1, 5, 9);
      g.fillStyle = '#e8202a'; g.fillRect(Math.round(x) - 1, Math.round(y), 3, 4); g.fillRect(Math.round(x) - 1, Math.round(y) + 5, 3, 2);
    }

    dizzy(g, x, y, t) {
      g.fillStyle = '#fff7a0';
      for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; g.fillRect(Math.round(x + Math.cos(a) * 8), Math.round(y + Math.sin(a) * 3), 2, 2); }
    }

    drawVan(g, v, t) {
      const S = this.S;
      const moving = Math.abs(v.vx) > 1;
      const bob = moving ? Math.round(Math.sin(t * 20)) : 0;
      const shakeX = v.st === 'hit' ? Math.round(Math.sin(t * 50) * 2) : 0;
      const x = Math.round(v.x) + shakeX, y = Math.round(v.y) - 18 + bob;
      const flip = v.vx < 0 || (!moving && v.side < 0 && v.st !== 'drive');
      const body = v.hp > 0 ? (flip ? S.vanBodyL : S.vanBody) : (flip ? S.vanEmptyL : S.vanEmpty);
      g.drawImage(body, x, y);
      const backX = flip ? x + 58 : x + 4;
      if (v.st === 'stop' || v.st === 'expose' || v.st === 'hit') { g.fillStyle = '#0a0812'; g.fillRect(backX, y + 21, 10, 28); }
      if (v.st === 'broken') { g.fillStyle = '#0a0812'; g.fillRect(x + 25, y + 7, 22, 10); }
      const wk = moving ? Math.floor(t * 14) % 2 : 0;
      g.drawImage(S.wheel[wk], x + 8, Math.round(v.y) + v.h - 12);
      g.drawImage(S.wheel[wk], x + 52, Math.round(v.y) + v.h - 12);
      if (v.st === 'expose' && Math.floor(t * 8) % 2) {
        g.globalAlpha = 0.5; g.fillStyle = '#ffd34a';
        g.fillRect(x + 22, y - 2, 28, 22);
        g.globalAlpha = 1;
      }
      if (v.hitT > 0 && Math.floor(t * 20) % 2) { g.globalAlpha = 0.6; g.fillStyle = '#ffffff'; g.fillRect(x, y + 18, 72, 34); g.globalAlpha = 1; }
      if (moving && Math.floor(t * 10) % 3 === 0) this.parts.push({ x: flip ? x + 72 : x, y: Math.round(v.y) + v.h - 6, vx: (flip ? 1 : -1) * 20, vy: -15, life: 0.6, max: 0.6, col: '#8a86a0', size: 3, g: -20 });
      if (v.st === 'broken' && Math.floor(t * 8) % 2) this.parts.push({ x: x + 36 + (Math.random() - 0.5) * 30, y: y + 20, vx: 0, vy: -30, life: 0.8, max: 0.8, col: '#4a4660', size: 3, g: -10 });
    }

    drawPack(g, t) {
      const S = this.S;
      if (!S.wolf) return;
      const p = this.game.player;
      for (let i = 0; i < 3; i++) {
        const k = Math.floor(t * 10 + i) % 3;
        const yy = Math.round(clamp(p.y + p.h - this.cy, 40, H - 8)) + (i - 1) * 22;
        this.drawSprite(g, this.frameOf(S.wolf, 1, k), -6 + (i % 2) * 10 + Math.sin(t * 4 + i) * 3, yy + 1, 1, 1);
      }
      g.globalAlpha = 0.5;
      const grd = g.createLinearGradient(0, 0, 30, 0);
      grd.addColorStop(0, 'rgba(10,6,20,0.9)'); grd.addColorStop(1, 'rgba(10,6,20,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 30, H);
      g.globalAlpha = 1;
    }
  }

  C.Render = { Renderer, THEMES };
})(globalThis.Catniss = globalThis.Catniss || {});
