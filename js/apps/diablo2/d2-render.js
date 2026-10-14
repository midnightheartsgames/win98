(function (D) {
  'use strict';
  const { W, H, HX, HY, ZS, BASES } = D;
  const TAU = Math.PI * 2;
  const T = () => D.Terrain;
  const CLIFF_H = [1.2, 1.6, 2.0, 2.5];
  const WALL_HS = [1.7, 2.0, 2.3];

  const EL_COL = { fire: '#ff7a20', cold: '#80c8ff', light: '#c0d0ff', poison: '#60ff40', magic: '#b080ff', holy: '#fff0a0', shadow: '#a060c0', nature: '#80e060', bone: '#e8e0c8', blood: '#b01010', phys: '#e0e0e0', corpse: '#ff6020' };

  class Renderer {
    constructor(ctx) {
      this.c = ctx;
      this.light = T().mk(W / 2, H / 2);
      this.lc = this.light.getContext('2d');
      this.ground = null;
      this.groundArea = null;
      this.hits = [];
      this.t = 0;
      this.shake = 0;
      this.hurt = 0;
      this.labelRects = [];
    }

    camFor(g) {
      const h = g.hero;
      return { x: Math.round(D.toScreenX(h.x, h.y) - W / 2), y: Math.round(D.toScreenY(h.x, h.y, 0) - H / 2 + 30) };
    }

    toScreen(x, y, z) { return { x: D.toScreenX(x, y) - this.cam.x, y: D.toScreenY(x, y, z || 0) - this.cam.y }; }

    toWorld(sx, sy) { return D.toWorld(sx + this.cam.x, sy + this.cam.y); }

    render(g, o, dt) {
      o = o || {};
      const c = this.c;
      this.t += dt;
      const a = g.area;
      if (this.groundArea !== a) { this.ground = new (T().Ground)(a); this.groundArea = a; this.firstFrame = true; }
      const cam = this.camFor(g);
      for (const v of g.vfx) if (v.k === 'shake' && v.t < 0.05) this.shake = 0.35;
      if (this.shake > 0) { this.shake -= dt; cam.x += Math.round((Math.random() - 0.5) * 8 * this.shake / 0.35); cam.y += Math.round((Math.random() - 0.5) * 8 * this.shake / 0.35); }
      this.cam = cam;
      if (a.dungeon) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); }
      else { c.save(); c.translate(-cam.x % 128, -cam.y % 64); c.fillStyle = T().voidPattern(c); c.fillRect(-128, -64, W + 256, H + 128); c.restore(); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, 0, W, H); }
      this.drawGround(g);
      this.hits = [];
      const list = [];
      this.collectWalls(g, list);
      this.collectObjects(g, list, o);
      this.collectEnts(g, list, o);
      this.collectItems(g, list, o);
      this.collectMissiles(g, list);
      this.collectEffects(g, list);
      list.sort((p, q) => p.d - q.d);
      for (const it of list) it.f();
      this.drawVfx(g);
      this.drawLight(g);
      this.drawOverhead(g, o);
      this.drawLabels(g, o);
      this.firstFrame = false;
    }

    drawGround(g) {
      const c = this.c, gr = this.ground, a = g.area;
      const CH = gr.CH;
      const cam = this.cam;
      const corners = [this.toWorld(0, 0), this.toWorld(W, 0), this.toWorld(0, H), this.toWorld(W, H)];
      const minx = Math.floor(Math.min(...corners.map(p => p.x)) / CH) - 1, maxx = Math.floor(Math.max(...corners.map(p => p.x)) / CH) + 1;
      const miny = Math.floor(Math.min(...corners.map(p => p.y)) / CH) - 1, maxy = Math.floor(Math.max(...corners.map(p => p.y)) / CH) + 1;
      const cmax = Math.ceil(a.w / CH), rmax = Math.ceil(a.h / CH);
      for (let cy = Math.max(0, miny); cy <= Math.min(rmax - 1, maxy); cy++) {
        for (let cx = Math.max(0, minx); cx <= Math.min(cmax - 1, maxx); cx++) {
          const sx = D.toScreenX(cx * CH, cy * CH) - cam.x, sy = D.toScreenY(cx * CH, cy * CH) - cam.y;
          if (sx + CH * 32 < 0 || sx - CH * 32 > W || sy > H || sy + CH * 32 < 0) continue;
          const ch = gr.get(cx, cy, this.firstFrame || gr.chunks.size < 6);
          if (ch) c.drawImage(ch, Math.round(sx - CH * 32), Math.round(sy));
        }
      }
      gr.pump(7);
    }

    visibleCells(g, margin) {
      const corners = [this.toWorld(-margin, -margin), this.toWorld(W + margin, -margin), this.toWorld(-margin, H + margin * 3), this.toWorld(W + margin, H + margin * 3)];
      const a = g.area;
      return {
        x0: Math.max(0, Math.floor(Math.min(...corners.map(p => p.x)))), x1: Math.min(a.w - 1, Math.ceil(Math.max(...corners.map(p => p.x)))),
        y0: Math.max(0, Math.floor(Math.min(...corners.map(p => p.y)))), y1: Math.min(a.h - 1, Math.ceil(Math.max(...corners.map(p => p.y))))
      };
    }

    heroScreen(g) { const h = g.hero; return this.toScreen(h.x, h.y); }

    occludes(g, sx, sy, d, w, h) {
      const hs = this.heroScreen(g);
      const hd = g.hero.x + g.hero.y;
      if (d <= hd + 0.3) return false;
      return Math.abs(sx - hs.x) < w && hs.y < sy + 10 && hs.y > sy - h;
    }

    collectWalls(g, list) {
      const a = g.area, c = this.c;
      const v = this.visibleCells(g, 80);
      const theme = a.theme.wall || '';
      for (let y = v.y0; y <= v.y1; y++) for (let x = v.x0; x <= v.x1; x++) {
        const i = y * a.w + x;
        const k = a.wall[i];
        if (!k || k === 7) continue;
        if (a.dungeon && !a.seen[i] && !this.nearSeen(a, x, y)) continue;
        const sx = D.toScreenX(x + 0.5, y + 0.5) - this.cam.x, sy = D.toScreenY(x + 0.5, y + 0.5) - this.cam.y;
        if (sx < -80 || sx > W + 80 || sy < -40 || sy > H + 160) continue;
        const d = x + y + 1;
        const vv = a.wvar[i];
        if (k === 4) { const s = T().palSprite(vv & 7); list.push({ d, f: () => this.blit(s, sx, sy + 16, this.occludes(g, sx, sy + 16, d, 50, 100) ? 0.4 : 1) }); continue; }
        if (k === 1 && !a.dungeon) {
          const hM = this.cliffH(a, x, y);
          const hN = (nx, ny) => { if (nx < 0 || ny < 0 || nx >= a.w || ny >= a.h) return 99; const j = ny * a.w + nx; return a.wall[j] === 1 ? this.cliffH(a, nx, ny) : 0; };
          const faceR = hN(x + 1, y) < hM, faceB = hN(x, y + 1) < hM;
          const rim = (faceR || faceB) && (hN(x + 1, y) === 0 || hN(x, y + 1) === 0) && D.hash2(x, y, 3) > 0.35;
          list.push({
            d, f: () => {
              const hPx = Math.round(hM * ZS);
              const alpha = this.occludes(g, sx, sy, d, 64, hPx + 30) ? 0.4 : 1;
              c.globalAlpha = alpha;
              if (faceR) c.drawImage(T().faceTex(1, 'cliff', 'R', vv & 3, hM).cv, Math.round(sx), Math.round(sy - hPx));
              if (faceB) c.drawImage(T().faceTex(1, 'cliff', 'L', (vv >> 2) & 3, hM).cv, Math.round(sx - 32), Math.round(sy - hPx));
              c.drawImage(T().wallTop(1, 'cliff', vv & 3).cv, Math.round(sx - 32), Math.round(sy - 16 - hPx));
              if (rim) this.blit(T().objSprite('rock', (x * 7 + y) & 3), sx + (faceR ? 14 : -14), sy + 12, alpha);
              c.globalAlpha = 1;
            }
          });
          continue;
        }
        if (k === 3) { const s = T().fenceSprite(vv & 7); list.push({ d, f: () => this.blit(s, sx, sy + 16, 1) }); continue; }
        if (k === 6) { const s = T().ruinSprite(vv & 7); list.push({ d, f: () => this.blit(s, sx, sy + 16, this.occludes(g, sx, sy, d, 45, 70) ? 0.45 : 1) }); continue; }
        if (k === 8) { const s = T().pillarSprite(theme); list.push({ d, f: () => this.blit(s, sx, sy + 16, this.occludes(g, sx, sy, d, 40, 110) ? 0.35 : 1) }); continue; }
        const cave = theme === 'cave';
        const hM = cave ? this.wallH(a, x, y) : T().WALL_H[5];
        const hOf = (nx, ny) => { const j = ny * a.w + nx; return a.wall[j] === 5 || a.wall[j] === 8 ? (cave ? this.wallH(a, nx, ny) : hM) : 0; };
        const openR = x + 1 < a.w && hOf(x + 1, y) < hM;
        const openB = y + 1 < a.h && hOf(x, y + 1) < hM;
        const rimRock = cave && (openR || openB) && D.hash2(x, y, 9) > 0.45 && (a.walk[i + 1] === 1 || a.walk[i + a.w] === 1);
        list.push({
          d, f: () => {
            const alpha = this.occludes(g, sx, sy, d, 64, 95) ? 0.3 : 1;
            c.globalAlpha = alpha;
            const hPx = Math.round(hM * ZS);
            if (openR) { const f = T().faceTex(5, theme, 'R', vv & 3, hM); c.drawImage(f.cv, Math.round(sx), Math.round(sy - hPx)); }
            if (openB) { const f = T().faceTex(5, theme, 'L', (vv >> 2) & 3, hM); c.drawImage(f.cv, Math.round(sx - 32), Math.round(sy - hPx)); }
            if (rimRock) this.blit(T().objSprite('rock', (x * 5 + y) & 3), sx + (openR ? 14 : -14), sy + 12, alpha);
            const top = T().wallTop(5, theme, vv & 3);
            c.drawImage(top.cv, Math.round(sx - 32), Math.round(sy - 16 - hPx));
            c.globalAlpha = 1;
          }
        });
      }
    }

    cliffH(a, x, y) {
      const f = D.fbm(x * 0.21, y * 0.21, a.seed + 11, 2);
      return CLIFF_H[D.clamp(Math.floor((f - 0.28) * 8), 0, 3)];
    }

    wallH(a, x, y) {
      const f = D.fbm(x * 0.3, y * 0.3, a.seed + 13, 2);
      return WALL_HS[D.clamp(Math.floor((f - 0.3) * 7), 0, 2)];
    }

    nearSeen(a, x, y) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < a.w && ny < a.h && a.seen[ny * a.w + nx]) return true;
      }
      return false;
    }

    blit(s, x, y, alpha) {
      if (!s) return;
      const c = this.c;
      if (alpha !== 1) c.globalAlpha = alpha;
      c.drawImage(s.cv, Math.round(x - s.ox), Math.round(y - s.oy));
      if (alpha !== 1) c.globalAlpha = 1;
    }

    collectObjects(g, list, o) {
      const a = g.area, c = this.c;
      const v = this.visibleCells(g, 200);
      const objs = a.objs.concat(a.dyn);
      for (const ob of objs) {
        if (ob.x < v.x0 - 3 || ob.x > v.x1 + 3 || ob.y < v.y0 - 3 || ob.y > v.y1 + 3) continue;
        const s = this.toScreen(ob.x, ob.y);
        if (s.x < -160 || s.x > W + 160 || s.y < -60 || s.y > H + 300) continue;
        const flat = ob.type === 'wp' || ob.type === 'stairs_down' || ob.type === 'portal' || ob.type === 'redportal' || ob.type === 'corpse';
        const d = flat ? (ob.type === 'portal' || ob.type === 'redportal' ? ob.x + ob.y : -1e6 + ob.x + ob.y) : ob.x + ob.y + (ob.cells && ob.cells.length > 4 ? 0.8 : 0);
        const hover = o.hover && o.hover.ref === ob;
        list.push({ d, f: () => this.drawObj(g, ob, s, hover) });
      }
    }

    drawObj(g, ob, s, hover) {
      const c = this.c;
      const interactive = ob.label || ['chest', 'barrel', 'urn', 'body', 'shrine', 'stash', 'wp', 'stairs_down', 'stairs_up', 'cave', 'tower', 'gate', 'portal', 'redportal', 'cairn', 'inifuss', 'cage', 'tome', 'malus', 'wirt', 'corpse'].includes(ob.type);
      let spr = null;
      const ex = ob.open ? 'open' : ob.lit ? 'lit' : '';
      switch (ob.type) {
        case 'portal': case 'redportal': this.drawPortal(ob, s, ob.type === 'redportal'); break;
        case 'fire': spr = T().objSprite('fire', 0); this.blit(spr, s.x, s.y + 8, 1); this.flame(s.x, s.y - 2, 1.4); break;
        case 'torch': spr = T().objSprite('torch', 0); this.blit(spr, s.x, s.y + 8, 1); this.flame(s.x, s.y - 50, 0.7); break;
        case 'wtorch': spr = T().objSprite('wtorch', 0); this.blit(spr, s.x, s.y, 1); this.flame(s.x, s.y - 56, 0.5); break;
        case 'forge': spr = T().objSprite('forge', 0); this.blit(spr, s.x, s.y + 8, 1); this.flame(s.x, s.y - 16, 0.5); break;
        case 'corpse': {
          const m = D.Models.heroModel(g.hero);
          const sp = D.Sprites.sprite(m, 'dead', 1, 0.6);
          c.drawImage(sp.cv, Math.round(s.x - sp.ox), Math.round(s.y - sp.oy));
          break;
        }
        case 'cage': spr = T().objSprite('cage', 0); this.blit(spr, s.x, s.y + 8, this.occludes(g, s.x, s.y, ob.x + ob.y, 40, 100) ? 0.5 : 1); if (!ob.open) this.drawCainInCage(s); break;
        case 'malus': spr = T().objSprite('malus', 0); this.blit(spr, s.x, s.y + 8, 1); if (!ob.open) { const ic = D.Icons.item(D.makeItem('q_malus'), 18); c.drawImage(ic, Math.round(s.x - 9), Math.round(s.y - 34)); } break;
        default: {
          spr = T().objSprite(ob.type, ob.v || (ob.type === 'cairn' ? ob.rune : 0), ex);
          if (!spr) break;
          const tall = spr.tall ? 1 : 0;
          const alpha = tall && this.occludes(g, s.x, s.y, ob.x + ob.y + 0.8, spr.w * 0.35, spr.oy) ? 0.42 : 1;
          const off = ob.type === 'wp' || ob.type === 'stairs_down' ? 0 : 8;
          this.blit(spr, s.x, s.y + off, alpha);
          if (ob.type === 'wp') this.drawWpGlow(g, ob, s);
          if (ob.type === 'shrine' && !ob.open) this.glow(s.x, s.y - 34, 16, '#80c0ff', 0.35 + Math.sin(this.t * 3) * 0.1);
          if (ob.type === 'cairn' && ob.lit) this.glow(s.x, s.y - 30, 18, '#ff4020', 0.5);
          if (ob.type === 'inifuss' && !ob.open && g.q('cain') >= 1 && g.q('cain') < 3) this.glow(s.x + 6, s.y - 60, 14, '#ffd080', 0.4 + Math.sin(this.t * 2) * 0.15);
        }
      }
      if (interactive) {
        const box = this.objBox(ob, s, spr);
        this.hits.push({ kind: 'obj', ref: ob, x0: box[0], y0: box[1], x1: box[2], y1: box[3], d: ob.x + ob.y });
        if (hover && spr) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25; c.drawImage(spr.cv, Math.round(s.x - spr.ox), Math.round(s.y + (ob.type === 'wp' || ob.type === 'stairs_down' ? 0 : 8) - spr.oy)); c.restore(); }
      }
    }

    objBox(ob, s, spr) {
      if (ob.type === 'wp') return [s.x - 55, s.y - 30, s.x + 55, s.y + 28];
      if (ob.type === 'portal' || ob.type === 'redportal') return [s.x - 22, s.y - 70, s.x + 22, s.y + 6];
      if (ob.type === 'cave' || ob.type === 'tower') { const m = this.toScreen(ob.mouth.x, ob.mouth.y); return [m.x - 40, m.y - 60, m.x + 40, m.y + 20]; }
      if (ob.type === 'inifuss') return [s.x - 40, s.y - 120, s.x + 50, s.y + 10];
      if (ob.type === 'gate') return [s.x - 50, s.y - 110, s.x + 50, s.y + 10];
      if (ob.type === 'stairs_down') return [s.x - 40, s.y - 20, s.x + 40, s.y + 20];
      if (ob.type === 'corpse') return [s.x - 30, s.y - 20, s.x + 30, s.y + 10];
      if (spr) return [s.x - Math.min(spr.w / 2, 30), s.y + 8 - spr.oy + 4, s.x + Math.min(spr.w / 2, 30), s.y + 10];
      return [s.x - 20, s.y - 40, s.x + 20, s.y + 8];
    }

    drawCainInCage(s) {
      const m = D.Models.entModel({ kind: 'npc', model: 'cain' });
      const sp = D.Sprites.sprite(m, 'idle', (this.t * 0.4) % 1, Math.PI / 4);
      this.c.drawImage(sp.cv, Math.round(s.x - sp.ox), Math.round(s.y - sp.oy));
    }

    drawWpGlow(g, ob, s) {
      const active = !!g.prog.wp[g.area.id];
      if (!active) return;
      const c = this.c;
      c.save();
      c.globalCompositeOperation = 'lighter';
      const gr = c.createLinearGradient(0, s.y - 90, 0, s.y);
      gr.addColorStop(0, 'rgba(60,100,255,0)');
      gr.addColorStop(1, 'rgba(90,140,255,0.35)');
      c.fillStyle = gr;
      c.beginPath(); c.ellipse(s.x, s.y - 2, 36, 16, 0, 0, Math.PI); c.lineTo(s.x - 36, s.y - 90); c.lineTo(s.x + 36, s.y - 90); c.closePath(); c.fill();
      for (let i = 0; i < 6; i++) { const a = this.t * 1.5 + i; const py = s.y - ((this.t * 30 + i * 15) % 90); c.fillStyle = 'rgba(160,200,255,0.6)'; c.fillRect(s.x + Math.cos(a) * 28, py, 2, 2); }
      c.restore();
    }

    drawPortal(ob, s, red) {
      const c = this.c;
      c.save();
      const k = 1 + Math.sin(this.t * 4) * 0.04;
      const gr = c.createRadialGradient(s.x, s.y - 34, 2, s.x, s.y - 34, 34);
      if (red) { gr.addColorStop(0, '#ffe0c0'); gr.addColorStop(0.3, '#ff4020'); gr.addColorStop(0.8, 'rgba(120,0,0,0.6)'); gr.addColorStop(1, 'rgba(60,0,0,0)'); }
      else { gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, '#60a0ff'); gr.addColorStop(0.8, 'rgba(20,40,160,0.6)'); gr.addColorStop(1, 'rgba(0,0,60,0)'); }
      c.fillStyle = gr;
      c.beginPath(); c.ellipse(s.x, s.y - 34, 18 * k, 34 * k, 0, 0, TAU); c.fill();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = red ? 'rgba(255,120,60,0.6)' : 'rgba(150,200,255,0.6)';
      c.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(s.x, s.y - 34, (10 + i * 4) * k, (22 + i * 5) * k, this.t * (i + 1) * 0.7, 0, 4.5); c.stroke(); }
      c.restore();
    }

    flame(x, y, s) {
      const c = this.c;
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const ph = this.t * 7 + i * 1.7;
        const fx = x + Math.sin(ph) * 3 * s + (i - 2.5) * 2 * s, fy = y - (i % 3) * 3 * s;
        const h = (14 + Math.sin(ph * 1.3) * 5) * s;
        const gr = c.createRadialGradient(fx, fy - h * 0.3, 1, fx, fy - h * 0.3, h * 0.7);
        gr.addColorStop(0, 'rgba(255,240,180,0.9)');
        gr.addColorStop(0.4, 'rgba(255,140,30,0.6)');
        gr.addColorStop(1, 'rgba(160,30,0,0)');
        c.fillStyle = gr;
        c.beginPath(); c.ellipse(fx, fy - h * 0.3, h * 0.35, h * 0.7, 0, 0, TAU); c.fill();
      }
      c.restore();
    }

    glow(x, y, r, col, a) {
      const c = this.c;
      c.save();
      c.globalCompositeOperation = 'lighter';
      const gr = c.createRadialGradient(x, y, 0, x, y, r);
      const [R, G, B] = D.rgb(col);
      gr.addColorStop(0, 'rgba(' + R + ',' + G + ',' + B + ',' + a + ')');
      gr.addColorStop(1, 'rgba(' + R + ',' + G + ',' + B + ',0)');
      c.fillStyle = gr;
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.restore();
    }

    phaseOf(e) {
      const a = e.anim;
      if (a.n === 'walk' || a.n === 'run') { const stride = a.n === 'run' ? 2.6 : 1.7; return ((e.stepPhase || 0) / stride) % 1; }
      if (a.n === 'idle') return (a.t / 2.4) % 1;
      if (a.n === 'spin') return (a.t / 0.5) % 1;
      return Math.min(0.999, a.t / (a.dur || 1));
    }

    collectEnts(g, list, o) {
      const v = this.visibleCells(g, 150);
      const hov = o.hover && o.hover.kind === 'ent' ? o.hover.ref : null;
      for (const e of g.ents) {
        if (e.x < v.x0 - 2 || e.x > v.x1 + 2 || e.y < v.y0 - 2 || e.y > v.y1 + 2) continue;
        const s = this.toScreen(e.x, e.y);
        if (s.x < -120 || s.x > W + 120 || s.y < -40 || s.y > H + 200) continue;
        const d = e.x + e.y + (e.dead ? -0.3 : 0);
        list.push({ d, f: () => this.drawEnt(g, e, s, e === hov) });
      }
    }

    drawEnt(g, e, s, hover) {
      const c = this.c;
      const m = D.Models.entModel(e);
      const a = e.anim;
      let anim = a.n;
      if (anim === 'attack' && e.kind === 'mon' && e.mon && e.mon.ai !== 'melee' && e.mon.ai !== 'fallen' && e.mon.ai !== 'ghost' && e.mon.ai !== 'andariel' && e.mon.ai !== 'flyer') anim = e.mon.weapon === 'bow' ? 'shoot' : 'cast';
      if (anim === 'shoot' && m.rig !== 'biped') anim = 'attack';
      if (m.rig !== 'biped' && !['idle', 'walk', 'run', 'attack', 'death', 'dead', 'hit'].includes(anim)) anim = 'idle';
      if (anim === 'bow' || anim === 'xbow') anim = 'shoot';
      const p = this.phaseOf(e);
      const sp = D.Sprites.sprite(m, anim === 'shoot' ? 'shoot' : anim, p, e.dir);
      const z = (e.z || 0) * ZS;
      const float = e.float && !e.dead;
      if (!e.dead || a.n === 'death') {
        c.fillStyle = 'rgba(0,0,0,0.32)';
        const sr = (e.r || 0.35) * 42 * (m.scale || 1) * (float ? 0.7 : 1);
        c.beginPath(); c.ellipse(s.x + 3, s.y + 2, sr, sr * 0.45, 0, 0, TAU); c.fill();
      }
      let filter = '';
      if (e.fx.freeze > 0) filter = 'saturate(0.2) brightness(1.3) hue-rotate(170deg) saturate(3)';
      else if (e.fx.chill > 0) filter = 'saturate(0.5) hue-rotate(190deg) saturate(2)';
      else if (e.fx.poison) filter = 'hue-rotate(70deg) saturate(1.6)';
      if (e.champ && !filter) filter = e.champKind === 'ghostly' ? 'saturate(0.2) brightness(1.4)' : 'brightness(1.12) saturate(1.3)';
      if (hover) filter = (filter ? filter + ' ' : '') + 'brightness(1.45)';
      let alpha = 1;
      if (m.ghost || e.champKind === 'ghostly') alpha = 0.62;
      if (e.unit === 'decoy') alpha = 0.7;
      if (e.unit === 'valkyrie') alpha = 0.85;
      if (e.dead && e.noCorpse) alpha = Math.max(0, 1 - (e.deathT || 0) / 0.6);
      if (a.n === 'appear') alpha = Math.min(1, a.t / (a.dur || 0.5) + 0.2);
      if (filter) c.filter = filter;
      if (alpha < 1) c.globalAlpha = alpha;
      c.drawImage(sp.cv, Math.round(s.x - sp.ox), Math.round(s.y - sp.oy - z));
      c.filter = 'none';
      c.globalAlpha = 1;
      if (e.glow || e.unit === 'firegolem' || e.unit === 'spiritwolf') this.glow(s.x, s.y - 30, 30, e.unit === 'firegolem' ? '#ff6010' : '#80b0ff', 0.25);
      if (e.unique || e.su) { if (!e.dead) this.glow(s.x, s.y - 30 * (m.scale || 1), 26 * (m.scale || 1), e.boss && e.type === 'andariel' ? '#ff4060' : '#c0a040', 0.12); }
      if (e.fx.curse && !e.dead) this.curseIcon(e, s, m);
      if (!e.dead && e.kind !== 'npc' && !(e.untargetable && e.unit !== 'raven')) {
        const hh = 70 * (m.scale || 1) * (m.rig === 'quad' ? 0.6 : m.rig === 'bird' ? 0.6 : 1);
        const hw = 18 * (m.scale || 1) * (m.rig === 'quad' ? 1.6 : 1);
        this.hits.push({ kind: 'ent', ref: e, x0: s.x - hw, y0: s.y - hh - z, x1: s.x + hw, y1: s.y + 6 - z, d: e.x + e.y });
      }
      if (e.kind === 'npc') this.hits.push({ kind: 'ent', ref: e, x0: s.x - 18, y0: s.y - 72, x1: s.x + 18, y1: s.y + 6, d: e.x + e.y });
      if (e.dead && e.kind === 'mon' && !e.noCorpse) this.hits.push({ kind: 'corpse', ref: e, x0: s.x - 26, y0: s.y - 18, x1: s.x + 26, y1: s.y + 10, d: e.x + e.y - 50 });
      if (e === g.hero && g.hero.charges && g.hero.charges.n) {
        for (let i = 0; i < g.hero.charges.n; i++) { const an = this.t * 3 + i * TAU / 3; this.glow(s.x + Math.cos(an) * 18, s.y - 40 + Math.sin(an) * 8, 7, g.hero.charges.kind === 'fire' || g.hero.charges.kind === 'phoenix' ? '#ff8030' : g.hero.charges.kind === 'thunder' ? '#c0d0ff' : '#ffffff', 0.8); }
      }
      if (e === g.hero && e.fx.buffs.bone_armor) { c.strokeStyle = 'rgba(230,220,200,0.35)'; c.lineWidth = 2; c.beginPath(); c.ellipse(s.x, s.y - 34, 20, 38, 0, 0, TAU); c.stroke(); }
      if (e === g.hero && e.fx.buffs.frozen_armor) { c.strokeStyle = 'rgba(150,210,255,0.35)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(s.x, s.y - 34, 18, 36, 0, 0, TAU); c.stroke(); }
      if (e === g.hero && g.hero.activeAuras && g.hero.activeAuras.length && !e.dead) {
        const sk = D.SKILLS[g.hero.activeAuras[0]];
        const col = EL_COL[sk.el] || '#ffffff';
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.28 + Math.sin(this.t * 3) * 0.08;
        c.strokeStyle = col; c.lineWidth = 2;
        c.beginPath(); c.ellipse(s.x, s.y, 26, 12, 0, 0, TAU); c.stroke();
        const an = this.t * 2;
        for (let i = 0; i < 4; i++) { const b = an + i * TAU / 4; c.fillStyle = col; c.fillRect(s.x + Math.cos(b) * 26 - 1, s.y + Math.sin(b) * 12 - 1, 3, 3); }
        c.restore();
      }
    }

    curseIcon(e, s, m) {
      const c = this.c;
      const col = { amplify: '#ff4040', weaken: '#d0c040', iron_maiden: '#c0c0c0', life_tap: '#ff2060', decrepify: '#8040c0', inner_sight: '#ff80ff' }[e.fx.curse.type] || '#ff4040';
      const y = s.y - 78 * (m.scale || 1);
      c.save();
      c.globalAlpha = 0.85;
      c.strokeStyle = col; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(s.x - 5, y - 5); c.lineTo(s.x + 5, y + 5); c.moveTo(s.x + 5, y - 5); c.lineTo(s.x - 5, y + 5); c.stroke();
      c.beginPath(); c.arc(s.x, y, 7, 0, TAU); c.stroke();
      c.restore();
    }

    collectItems(g, list, o) {
      const a = g.area;
      const v = this.visibleCells(g, 60);
      for (const gi of a.items) {
        if (gi.x < v.x0 - 1 || gi.x > v.x1 + 1 || gi.y < v.y0 - 1 || gi.y > v.y1 + 1) continue;
        list.push({ d: gi.x + gi.y - 0.2, f: () => this.drawItem(g, gi, o) });
      }
    }

    drawItem(g, gi, o) {
      const c = this.c;
      const k = Math.min(1, gi.t / 0.35);
      let x = gi.x, y = gi.y, z = 0;
      if (k < 1 && gi.fromX !== undefined) { x = gi.fromX + (gi.x - gi.fromX) * k; y = gi.fromY + (gi.y - gi.fromY) * k; z = Math.sin(k * Math.PI) * 1.2; }
      const s = this.toScreen(x, y, z);
      if (gi.gold) {
        const n = Math.min(8, 2 + Math.floor(Math.log2(gi.gold + 1)));
        for (let i = 0; i < n; i++) { const px = s.x + Math.cos(i * 2.4) * (i * 0.9), py = s.y + Math.sin(i * 2.4) * (i * 0.5); c.fillStyle = '#6a5010'; c.beginPath(); c.ellipse(px, py, 3.5, 2, 0, 0, TAU); c.fill(); c.fillStyle = '#e0c040'; c.beginPath(); c.ellipse(px, py - 1, 3.2, 1.7, 0, 0, TAU); c.fill(); }
        this.hits.push({ kind: 'item', ref: gi, x0: s.x - 12, y0: s.y - 10, x1: s.x + 12, y1: s.y + 6, d: gi.x + gi.y });
        return;
      }
      const it = gi.item;
      const b = BASES[it.base];
      const ic = D.Icons.item(it, 14);
      const w = ic.width * 0.7, h = ic.height * 0.7;
      c.save();
      c.translate(s.x, s.y - 3);
      c.rotate(((gi.id.charCodeAt(1) || 0) % 7 - 3) * 0.15);
      c.drawImage(ic, -w / 2, -h / 2, w, h);
      c.restore();
      if (it.q === 'unique' || it.q === 'set' || b.type === 'rune' || it.q === 'runeword') this.glow(s.x, s.y - 3, 14, D.nameColor(it), 0.3 + Math.sin(this.t * 4) * 0.1);
      this.hits.push({ kind: 'item', ref: gi, x0: s.x - Math.max(10, w / 2), y0: s.y - Math.max(10, h / 2) - 3, x1: s.x + Math.max(10, w / 2), y1: s.y + 6, d: gi.x + gi.y });
    }

    collectMissiles(g, list) {
      for (const m of g.missiles) {
        const s = this.toScreen(m.x, m.y, m.z);
        if (s.x < -40 || s.x > W + 40 || s.y < -40 || s.y > H + 40) continue;
        list.push({ d: m.x + m.y + 0.1, f: () => this.drawMissile(m, s) });
      }
    }

    drawMissile(m, s) {
      const c = this.c;
      const look = m.look;
      const ang = Math.atan2((Math.cos(m.ang) + Math.sin(m.ang)) * HY, (Math.cos(m.ang) - Math.sin(m.ang)) * HX);
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const tr = (col, w, len) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(s.x - dx * len, s.y - dy * len); c.lineTo(s.x, s.y); c.stroke(); };
      c.save();
      switch (look) {
        case 'arrow': case 'javelin': case 'quill': {
          const len = look === 'javelin' ? 22 : look === 'quill' ? 9 : 16;
          tr(look === 'quill' ? '#d8d0b0' : '#6a4a2a', look === 'javelin' ? 2 : 1.4, len);
          c.fillStyle = '#c8ccd0'; c.beginPath(); c.moveTo(s.x + dx * 4, s.y + dy * 4); c.lineTo(s.x - dy * 2, s.y + dx * 2); c.lineTo(s.x + dy * 2, s.y - dx * 2); c.fill();
          if (look === 'arrow') { c.strokeStyle = '#d8d8d8'; c.lineWidth = 1; c.beginPath(); c.moveTo(s.x - dx * len, s.y - dy * len); c.lineTo(s.x - dx * (len - 4) - dy * 3, s.y - dy * (len - 4) + dx * 3); c.stroke(); }
          break;
        }
        case 'magicarrow': case 'firearrow': case 'coldarrow': case 'lightjav': case 'lbolt': {
          const col = look === 'magicarrow' ? '#a0a0ff' : look === 'firearrow' ? '#ffa040' : look === 'coldarrow' ? '#a0e0ff' : '#e0e8ff';
          c.globalCompositeOperation = 'lighter';
          tr(col, 3, look === 'lbolt' ? 20 : 18);
          tr('#ffffff', 1, 10);
          if (look === 'lbolt' || look === 'lightjav') { c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); c.moveTo(s.x, s.y); for (let i = 1; i < 5; i++) c.lineTo(s.x - dx * i * 6 + (Math.random() - 0.5) * 8, s.y - dy * i * 6 + (Math.random() - 0.5) * 8); c.stroke(); }
          break;
        }
        case 'firebolt': case 'fireball': case 'icebolt': case 'iceshard': case 'holybolt': case 'lball': case 'poison': case 'nova_fire': case 'nova_cold': case 'nova_light': case 'nova_poison': case 'cbolt': {
          const col = { firebolt: '#ff8020', fireball: '#ff6010', icebolt: '#80c8ff', iceshard: '#b0e8ff', holybolt: '#fff0a0', lball: '#c0c0ff', poison: '#60ff40', nova_fire: '#ff6010', nova_cold: '#a0e0ff', nova_light: '#c0d0ff', nova_poison: '#60ff40', cbolt: '#a0b0ff' }[look];
          const r = look === 'fireball' ? 9 : look === 'lball' ? 8 : look.startsWith('nova') ? 6 : look === 'iceshard' ? 4 : 6;
          c.globalCompositeOperation = 'lighter';
          const gr = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 2);
          gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = gr; c.beginPath(); c.arc(s.x, s.y, r * 2, 0, TAU); c.fill();
          if (look === 'firebolt' || look === 'fireball' || look === 'icebolt') { c.globalAlpha = 0.5; tr(col, r * 0.8, r * 3); }
          if (look === 'cbolt' || look === 'nova_light' || look === 'lball') { c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.beginPath(); c.moveTo(s.x - r, s.y); for (let i = 0; i < 4; i++) c.lineTo(s.x + (Math.random() - 0.5) * r * 2.5, s.y + (Math.random() - 0.5) * r * 2.5); c.stroke(); }
          break;
        }
        case 'tooth': c.fillStyle = '#e8e0d0'; c.beginPath(); c.moveTo(s.x + dx * 5, s.y + dy * 5); c.lineTo(s.x - dy * 2.5, s.y + dx * 2.5); c.lineTo(s.x + dy * 2.5, s.y - dx * 2.5); c.fill(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4; tr('#b080ff', 3, 10); break;
        case 'bonespear': c.globalCompositeOperation = 'lighter'; tr('rgba(200,180,255,0.5)', 6, 30); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#e8e0d0'; c.beginPath(); c.moveTo(s.x + dx * 10, s.y + dy * 10); c.lineTo(s.x - dx * 20 - dy * 3, s.y - dy * 20 + dx * 3); c.lineTo(s.x - dx * 20 + dy * 3, s.y - dy * 20 - dx * 3); c.fill(); break;
        case 'hammer': {
          c.translate(s.x, s.y - 10);
          c.rotate(this.t * 14);
          c.globalCompositeOperation = 'lighter';
          this.glowAt(0, 0, 16, '#8090ff', 0.5);
          c.fillStyle = '#d8d8f0'; c.fillRect(-2, -10, 4, 16); c.fillRect(-7, -12, 14, 7);
          break;
        }
        case 'bomb': case 'rock': ball(c, s.x, s.y, look === 'rock' ? 5 : 4, look === 'rock' ? '#6a4030' : '#3a3a3a'); if (look === 'bomb') this.glowAt(s.x + 3, s.y - 3, 5, '#ffa040', 0.9); else this.glowAt(s.x, s.y, 8, '#ff6010', 0.5); break;
        case 'web': c.strokeStyle = 'rgba(180,200,255,0.8)'; c.lineWidth = 1; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x + Math.cos(a) * 8, s.y + Math.sin(a) * 5); c.stroke(); } break;
        case 'sentinel': {
          c.translate(s.x, s.y - 10); c.rotate(this.t * 20);
          c.fillStyle = '#d0d4dc'; for (let i = 0; i < 3; i++) { c.rotate(TAU / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(12, -3); c.lineTo(14, 2); c.fill(); }
          break;
        }
        case 'fstorm': this.flame(s.x, s.y + 4, 0.7); break;
        case 'boulder': { ball(c, s.x, s.y - 12, 12, '#5a3a28'); c.globalCompositeOperation = 'lighter'; this.glowAt(s.x, s.y - 12, 14, '#ff5010', 0.45); break; }
        case 'tornado': {
          for (let i = 0; i < 8; i++) { const r = 4 + i * 2.2, yy = s.y - i * 7; c.strokeStyle = 'rgba(190,190,170,' + (0.5 - i * 0.04) + ')'; c.lineWidth = 2; c.beginPath(); c.ellipse(s.x + Math.sin(this.t * 10 + i) * 3, yy, r, r * 0.35, 0, this.t * 8 + i, this.t * 8 + i + 4); c.stroke(); }
          break;
        }
        case 'frozenorb': { c.globalCompositeOperation = 'lighter'; this.glowAt(s.x, s.y, 20, '#a0e0ff', 0.8); c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const a = this.t * 6 + i; c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x + Math.cos(a) * 12, s.y + Math.sin(a) * 7); c.stroke(); } break; }
        default: this.glowAt(s.x, s.y, 6, '#ffffff', 0.6);
      }
      c.restore();
    }

    glowAt(x, y, r, col, a) {
      const c = this.c;
      const gr = c.createRadialGradient(x, y, 0, x, y, r);
      const [R, G, B] = D.rgb(col);
      gr.addColorStop(0, 'rgba(255,255,255,' + a + ')');
      gr.addColorStop(0.3, 'rgba(' + R + ',' + G + ',' + B + ',' + a + ')');
      gr.addColorStop(1, 'rgba(' + R + ',' + G + ',' + B + ',0)');
      c.fillStyle = gr;
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }

    collectEffects(g, list) {
      for (const f of g.effects) {
        const s = this.toScreen(f.x, f.y);
        if (s.x < -80 || s.x > W + 80 || s.y < -80 || s.y > H + 80) continue;
        list.push({ d: f.x + f.y + (f.k === 'meteor' ? 5 : 0), f: () => this.drawEffect(g, f, s) });
      }
    }

    drawEffect(g, f, s) {
      const c = this.c;
      const life = 1 - f.t / f.dur;
      if (f.k === 'fire' || f.k === 'firewall') { c.globalAlpha = Math.min(1, life * 3); this.flame(s.x, s.y + 4, f.k === 'firewall' ? 1.1 : 0.75); c.globalAlpha = 1; }
      else if (f.k === 'poison') { c.save(); c.globalAlpha = Math.min(0.5, life); for (let i = 0; i < 4; i++) { const a = this.t + i * 1.6; this.glowAt(s.x + Math.cos(a) * 10, s.y + Math.sin(a) * 5 - 6, 16, '#40c020', 0.35); } c.restore(); }
      else if (f.k === 'web') { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(170,190,255,' + (0.6 * life) + ')'; c.lineWidth = 1; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + this.t; c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x + Math.cos(a) * 30 + (Math.random() - 0.5) * 6, s.y + Math.sin(a) * 15 + (Math.random() - 0.5) * 4); c.stroke(); } c.beginPath(); c.ellipse(s.x, s.y, 22, 11, 0, 0, TAU); c.stroke(); c.restore(); }
      else if (f.k === 'meteor') {
        const p = f.t / f.dur;
        c.save();
        c.strokeStyle = 'rgba(255,80,20,0.6)'; c.lineWidth = 2; c.beginPath(); c.ellipse(s.x, s.y, 40 * (1 - p * 0.3), 20 * (1 - p * 0.3), 0, 0, TAU); c.stroke();
        const my = s.y - 300 * (1 - p), mx = s.x - 150 * (1 - p);
        c.globalCompositeOperation = 'lighter';
        this.glowAt(mx, my, 26, '#ff7020', 0.9);
        c.strokeStyle = 'rgba(255,140,40,0.5)'; c.lineWidth = 10; c.beginPath(); c.moveTo(mx, my); c.lineTo(mx - 60, my - 120); c.stroke();
        c.restore();
      } else if (f.k === 'blizzard') {
        c.save(); c.globalAlpha = 0.25; c.fillStyle = '#c0e0ff'; c.beginPath(); c.ellipse(s.x, s.y, f.r * 40, f.r * 20, 0, 0, TAU); c.fill(); c.restore();
      }
    }

    drawVfx(g) {
      const c = this.c;
      for (const v of g.vfx) {
        const p = v.t / v.dur;
        let x = v.x, y = v.y;
        if (v.follow) { const e = g.ents.find(e2 => e2.id === v.follow); if (e) { x = e.x; y = e.y; } }
        if (v.k === 'flash') { c.save(); c.globalAlpha = (1 - p) * 0.35; c.fillStyle = v.c || '#ffffff'; c.fillRect(0, 0, W, H); c.restore(); continue; }
        if (v.k === 'shake') continue;
        if (v.k === 'bolt') {
          c.save(); c.globalCompositeOperation = 'lighter';
          for (let pass = 0; pass < 2; pass++) {
            c.strokeStyle = pass ? 'rgba(255,255,255,' + (1 - p) + ')' : 'rgba(120,150,255,' + (1 - p) * 0.8 + ')';
            c.lineWidth = pass ? 1.5 : 5;
            c.beginPath();
            v.pts.forEach((pt, i) => {
              const s2 = this.toScreen(pt.x, pt.y, 1);
              if (i === 0) c.moveTo(s2.x, s2.y);
              else {
                const pr = this.toScreen(v.pts[i - 1].x, v.pts[i - 1].y, 1);
                for (let k = 1; k <= 5; k++) c.lineTo(pr.x + (s2.x - pr.x) * k / 5 + (k < 5 ? (Math.random() - 0.5) * 14 : 0), pr.y + (s2.y - pr.y) * k / 5 + (k < 5 ? (Math.random() - 0.5) * 14 : 0));
              }
            });
            c.stroke();
          }
          c.restore();
          continue;
        }
        if (v.k === 'stream') {
          const col = v.el === 'fire' ? '#ff7020' : '#a0e0ff';
          c.save(); c.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 10; i++) {
            const t = (i / 10 + this.t * 3) % 1;
            const d = t * v.r;
            const sp = (Math.random() - 0.5) * 0.4 * t;
            const wx = x + Math.cos(v.ang + sp) * d, wy = y + Math.sin(v.ang + sp) * d;
            const s2 = this.toScreen(wx, wy, 1 - t * 0.4);
            this.glowAt(s2.x, s2.y, 6 + t * 10, col, 0.5 * (1 - p));
          }
          c.restore();
          continue;
        }
        const s = this.toScreen(x, y, v.z || 0);
        c.save();
        switch (v.k) {
          case 'hit': {
            const col = EL_COL[v.el] || '#b01010';
            if (v.el === 'blood') { c.fillStyle = 'rgba(150,10,10,' + (1 - p) + ')'; for (let i = 0; i < 6; i++) { const a = i * 1.1 + v.x; c.beginPath(); c.arc(s.x + Math.cos(a) * p * 16 * v.s, s.y + Math.sin(a) * p * 10 * v.s + p * p * 12, 2 * (1 - p) + 0.5, 0, TAU); c.fill(); } }
            else if (v.el === 'bone') { c.fillStyle = 'rgba(230,220,200,' + (1 - p) + ')'; for (let i = 0; i < 5; i++) { const a = i * 1.3 + v.x; c.fillRect(s.x + Math.cos(a) * p * 18, s.y + Math.sin(a) * p * 12, 2, 2); } }
            else { c.globalCompositeOperation = 'lighter'; this.glowAt(s.x, s.y, 16 * (1 - p * 0.5) * v.s, col, 0.7 * (1 - p)); }
            break;
          }
          case 'boom': { c.globalCompositeOperation = 'lighter'; const col = EL_COL[v.el] || '#ff7020'; const r = (v.r || 2) * 36 * (0.4 + p * 0.8); this.glowAt(s.x, s.y, r, col, 0.8 * (1 - p)); c.strokeStyle = 'rgba(255,220,160,' + (1 - p) * 0.5 + ')'; c.lineWidth = 3; c.beginPath(); c.ellipse(s.x, s.y + 8, r, r * 0.5, 0, 0, TAU); c.stroke(); break; }
          case 'ring': case 'static': case 'warcry': case 'aurapulse': {
            const col = v.k === 'static' ? '#c0d0ff' : v.k === 'warcry' ? '#ffe0a0' : EL_COL[v.el] || '#ffffff';
            const r = (v.r || 4) * 36 * (v.k === 'aurapulse' ? 1 : p);
            c.globalCompositeOperation = 'lighter';
            c.strokeStyle = col; c.globalAlpha = (1 - p) * (v.k === 'aurapulse' ? 0.3 : 0.8); c.lineWidth = v.k === 'aurapulse' ? 2 : 4;
            c.beginPath(); c.ellipse(s.x, s.y, r, r * 0.5, 0, 0, TAU); c.stroke();
            break;
          }
          case 'tele': case 'summon': case 'buff': case 'shrine': case 'heal': case 'lvlup': case 'spark': {
            const col = v.k === 'lvlup' ? '#ffd060' : v.k === 'heal' ? '#80ff80' : v.c || EL_COL[v.el] || '#a0c0ff';
            c.globalCompositeOperation = 'lighter';
            if (v.k === 'lvlup') { const gr = c.createLinearGradient(0, s.y - 160, 0, s.y); gr.addColorStop(0, 'rgba(255,220,120,0)'); gr.addColorStop(1, 'rgba(255,220,120,' + (1 - p) * 0.6 + ')'); c.fillStyle = gr; c.fillRect(s.x - 22, s.y - 160, 44, 160); }
            for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + p * 3; const r = 12 + p * 18; c.fillStyle = col; c.globalAlpha = 1 - p; c.fillRect(s.x + Math.cos(a) * r, s.y - 30 + Math.sin(a) * r * 0.5 - p * 30, 2.5, 2.5); }
            if (v.k === 'tele' || v.k === 'summon') this.glowAt(s.x, s.y - 30, 30 * (1 - p), col, 0.6);
            break;
          }
          case 'curse': { const col = { amplify: '#ff4040', weaken: '#d0c040', iron_maiden: '#c0c0c0', life_tap: '#ff2060', decrepify: '#8040c0', inner_sight: '#ff80ff' }[v.sub] || '#a040ff'; c.strokeStyle = col; c.globalAlpha = 1 - p; c.lineWidth = 2; const r = (v.r || 2) * 36; c.beginPath(); c.ellipse(s.x, s.y, r * (0.6 + p * 0.4), r * 0.5 * (0.6 + p * 0.4), 0, 0, TAU); c.stroke(); break; }
          case 'shard': { const fall = 1 - p; c.globalCompositeOperation = 'lighter'; const sy = s.y - fall * 120; c.strokeStyle = 'rgba(200,240,255,0.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(s.x + fall * 40, sy); c.lineTo(s.x + fall * 40 - 6, sy - 16); c.stroke(); if (p > 0.8) this.glowAt(s.x, s.y, 14, '#a0e0ff', 0.6); break; }
          case 'stun': case 'dodge': { c.fillStyle = '#ffffff'; c.globalAlpha = 1 - p; c.font = '11px ' + D.FONT; c.textAlign = 'center'; c.fillText(v.k === 'stun' ? '✦' : 'Уклон', s.x, s.y - 80 - p * 10); break; }
        }
        c.restore();
      }
    }

    drawLight(g) {
      const a = g.area, lc = this.lc;
      const amb = a.theme.ambient;
      const LW = W / 2, LH = H / 2;
      lc.globalCompositeOperation = 'source-over';
      lc.clearRect(0, 0, LW, LH);
      lc.fillStyle = 'rgba(0,0,0,' + amb + ')';
      lc.fillRect(0, 0, LW, LH);
      lc.globalCompositeOperation = 'destination-out';
      const lights = [];
      const h = g.hero;
      lights.push({ x: h.x, y: h.y, r: h.lightR || 8, a: 1 });
      for (const L of a.lights) {
        const fl = 1 + Math.sin(this.t * 9 + L.x * 3) * (L.f || 0) * 0.3 + Math.sin(this.t * 23 + L.y) * (L.f || 0) * 0.1;
        lights.push({ x: L.x, y: L.y, r: L.r * fl, a: 0.9 });
      }
      for (const m of g.missiles) if (m.def.glow) lights.push({ x: m.x, y: m.y, r: 3, a: 0.8 });
      for (const f of g.effects) if (f.k === 'fire' || f.k === 'firewall' || f.k === 'meteor') lights.push({ x: f.x, y: f.y, r: 2.5, a: 0.7 });
      for (const e of g.ents) if (!e.dead && (e.unit === 'firegolem' || e.unit === 'spiritwolf' || e.unit === 'oaksage' || e.unit === 'wolverine' || e.unit === 'volcano')) lights.push({ x: e.x, y: e.y, r: 3.5, a: 0.8 });
      for (const ob of a.dyn) if (ob.type === 'portal' || ob.type === 'redportal') lights.push({ x: ob.x, y: ob.y, r: 4, a: 0.9 });
      for (const L of lights) {
        const s = this.toScreen(L.x, L.y);
        const sx = s.x / 2, sy = (s.y - 20) / 2;
        const r = L.r * 18;
        if (sx < -r || sx > LW + r || sy < -r || sy > LH + r) continue;
        lc.save();
        lc.translate(sx, sy);
        lc.scale(1, 0.62);
        const gr = lc.createRadialGradient(0, 0, 0, 0, 0, r);
        gr.addColorStop(0, 'rgba(0,0,0,' + L.a + ')');
        gr.addColorStop(0.55, 'rgba(0,0,0,' + L.a * 0.75 + ')');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        lc.fillStyle = gr;
        lc.beginPath(); lc.arc(0, 0, r, 0, TAU); lc.fill();
        lc.restore();
      }
      const c = this.c;
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (const L of a.lights) {
        const s = this.toScreen(L.x, L.y);
        if (s.x < -100 || s.x > W + 100 || s.y < -100 || s.y > H + 100) continue;
        const [R, G, B] = D.rgb(L.c || '#ff9a40');
        const r = L.r * 30;
        const gr = c.createRadialGradient(s.x, s.y - 10, 0, s.x, s.y - 10, r);
        gr.addColorStop(0, 'rgba(' + R + ',' + G + ',' + B + ',0.14)');
        gr.addColorStop(1, 'rgba(' + R + ',' + G + ',' + B + ',0)');
        c.fillStyle = gr;
        c.beginPath(); c.ellipse(s.x, s.y - 10, r, r * 0.6, 0, 0, TAU); c.fill();
      }
      c.restore();
      c.drawImage(this.light, 0, 0, W, H);
      if (a.theme.tint && a.theme.tint !== '#000000') { c.save(); c.globalCompositeOperation = 'soft-light'; c.globalAlpha = 0.35; c.fillStyle = a.theme.tint; c.fillRect(0, 0, W, H); c.restore(); }
      const hp = h.hpMax ? h.hp / h.hpMax : 1;
      if (hp < 0.25 && !h.dead) { c.save(); c.globalAlpha = (0.25 - hp) * 1.2 * (0.7 + Math.sin(this.t * 6) * 0.3); const gr = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8); gr.addColorStop(0, 'rgba(120,0,0,0)'); gr.addColorStop(1, 'rgba(160,0,0,1)'); c.fillStyle = gr; c.fillRect(0, 0, W, H); c.restore(); }
    }

    drawOverhead(g, o) {
      const c = this.c;
      if (!o.overheads) return;
      c.save();
      c.font = '13px ' + D.FONT;
      c.textAlign = 'center';
      for (const ov of o.overheads) {
        const e = g.ents.find(x => x.id === ov.id);
        if (!e) continue;
        const s = this.toScreen(e.x, e.y);
        const y = s.y - 92;
        c.fillStyle = 'rgba(0,0,0,0.5)';
        const w = c.measureText(ov.text).width + 10;
        c.fillRect(s.x - w / 2, y - 13, w, 17);
        c.fillStyle = ov.c || '#e0e0e0';
        c.fillText(ov.text, s.x, y);
      }
      c.restore();
    }

    drawLabels(g, o) {
      const c = this.c;
      const a = g.area;
      this.labelRects = [];
      const show = o.alt;
      const hovItem = o.hover && o.hover.kind === 'item' ? o.hover.ref : null;
      const list = [];
      for (const gi of a.items) {
        if (!show && gi !== hovItem) continue;
        const s = this.toScreen(gi.x, gi.y);
        if (s.x < -50 || s.x > W + 50 || s.y < 0 || s.y > H - 40) continue;
        const text = gi.gold ? gi.gold + ' золота' : D.shortName(gi.item);
        const col = gi.gold ? D.COL.white : D.nameColor(gi.item);
        list.push({ gi, s, text, col });
      }
      list.sort((p, q) => q.s.y - p.s.y);
      c.save();
      c.font = '12px ' + D.FONT;
      c.textAlign = 'center';
      const placed = [];
      for (const L of list) {
        const w = c.measureText(L.text).width + 8;
        let y = L.s.y - 16;
        let guard = 0;
        while (placed.some(r => Math.abs(r.x - L.s.x) < (r.w + w) / 2 && Math.abs(r.y - y) < 15) && guard++ < 20) y -= 15;
        placed.push({ x: L.s.x, y, w });
        const hov = L.gi === hovItem;
        c.fillStyle = hov ? 'rgba(40,40,90,0.85)' : 'rgba(0,0,0,0.7)';
        c.fillRect(L.s.x - w / 2, y - 12, w, 15);
        c.fillStyle = L.col;
        c.fillText(L.text, L.s.x, y);
        this.labelRects.push({ kind: 'item', ref: L.gi, x0: L.s.x - w / 2, y0: y - 12, x1: L.s.x + w / 2, y1: y + 3, d: 1e9 });
      }
      c.restore();
    }

    pick(mx, my) {
      for (let i = this.labelRects.length - 1; i >= 0; i--) { const r = this.labelRects[i]; if (mx >= r.x0 && mx <= r.x1 && my >= r.y0 && my <= r.y1) return r; }
      let best = null;
      for (const h of this.hits) {
        if (mx < h.x0 || mx > h.x1 || my < h.y0 || my > h.y1) continue;
        const pri = h.kind === 'ent' ? (h.ref.team === 1 ? 3 : h.ref.kind === 'npc' ? 2.5 : 1) : h.kind === 'item' ? 2 : h.kind === 'corpse' ? 0.5 : 1.5;
        const score = pri * 1000 + h.d;
        if (!best || score > best.score) best = Object.assign({ score }, h);
      }
      return best;
    }
  }

  function ball(c, x, y, r, col) { D.Sprites.ball(c, { x, y }, r, col); }

  D.Renderer = Renderer;
  D.EL_COL = EL_COL;
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
