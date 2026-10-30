(function (A) {
  'use strict';
  const M = A.Maps, T = M.T, TS = M.TILE;
  const GREY = {
    [T.floor]: ['#6c6c72', '#68686e'], [T.floor2]: ['#7a766c', '#76726a'], [T.wall]: ['#2c2c32'], [T.low]: ['#56565e'],
    [T.pit]: ['#07070b'], [T.bridge]: ['#07070b'], [T.over]: ['#6c6c72', '#68686e'], [T.door]: ['#5c5248'], [T.pillar]: ['#3a3a42'],
    [T.rubble]: ['#4a4440'], [T.filled]: ['#5e5a52']
  };
  const AWNING = ['#8a3a34', '#b8783a', '#3a7a7a', '#7a4a8a'];

  A.FieldView = class {
    constructor() {
      this.sprites = new Map();
      this.mapCanvas = null;
      this.mapKey = '';
      this.t = 0;
    }

    sprite(look, dir, frame) {
      const key = look + dir + frame;
      let c = this.sprites.get(key);
      if (!c) {
        c = A.Pix.field(look, dir, frame).canvas();
        this.sprites.set(key, c);
      }
      return c;
    }

    renderMap(f) {
      const m = f.map, c = document.createElement('canvas');
      c.width = m.w * TS;
      c.height = m.h * TS;
      const g = c.getContext('2d'), down = f.bridgeDown();
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const t = f.tile(x, y), cols = GREY[t] || GREY[T.floor], X = x * TS, Y = y * TS;
        g.fillStyle = cols[(x + y) & 1 && cols[1] ? 1 : 0];
        g.fillRect(X, Y, TS, TS);
        if (t === T.floor || t === T.over || t === T.floor2) {
          g.fillStyle = 'rgba(0,0,0,0.08)';
          g.fillRect(X, Y + 15, TS, 1);
          g.fillRect(X + 15, Y, 1, TS);
        }
        if (t === T.wall || t === T.pillar || t === T.rubble) {
          const below = f.tile(x, y + 1);
          if (below !== T.wall && below !== T.pillar && below !== T.rubble) {
            g.fillStyle = t === T.rubble ? '#5a524a' : '#46464e';
            g.fillRect(X, Y + 6, TS, 10);
            g.fillStyle = 'rgba(0,0,0,0.25)';
            for (let i = 0; i < 3; i++) g.fillRect(X, Y + 8 + i * 3, TS, 1);
            g.fillStyle = '#5a5a62';
            g.fillRect(X, Y + 5, TS, 1);
          }
          if (t === T.rubble) {
            g.fillStyle = '#6a625a';
            for (let i = 0; i < 4; i++) g.fillRect(X + 2 + i * 3, Y + 2 + (i * 5) % 9, 3, 2);
          }
        }
        if (t === T.low) {
          g.fillStyle = '#8a8a92';
          g.fillRect(X, Y, TS, 3);
          g.fillStyle = '#3a3a40';
          g.fillRect(X, Y + 13, TS, 3);
        }
        if (t === T.pit || (t === T.bridge && !down)) {
          if (f.tile(x, y - 1) !== T.pit && f.tile(x, y - 1) !== T.bridge) {
            g.fillStyle = '#2a2a30';
            g.fillRect(X, Y, TS, 4);
          }
        }
        if (t === T.bridge && down) {
          g.fillStyle = '#7a6248';
          g.fillRect(X, Y + 1, TS, 14);
          g.fillStyle = '#5a4630';
          for (let i = 0; i < 4; i++) g.fillRect(X + i * 4 + 3, Y + 1, 1, 14);
        }
        if (t === T.door) {
          g.fillStyle = '#3a3028';
          g.fillRect(X, Y, 2, TS);
          g.fillRect(X + 14, Y, 2, TS);
        }
        if (t === T.filled) {
          g.fillStyle = '#7a5a3a';
          g.fillRect(X + 2, Y + 2, 12, 12);
        }
      }
      for (const [x0, y0, x1, y1] of m.def.forbid || []) {
        g.fillStyle = 'rgba(150,40,40,0.16)';
        g.fillRect(x0 * TS, y0 * TS, (x1 - x0 + 1) * TS, (y1 - y0 + 1) * TS);
      }
      return c;
    }

    mapCanvasFor(f) {
      const key = f.map.id + ':' + Object.keys(f.mem(f.map.id).tiles).length + ':' + f.bridgeDown();
      if (key !== this.mapKey) {
        this.mapCanvas = this.renderMap(f);
        this.mapKey = key;
      }
      return this.mapCanvas;
    }

    camera(f) {
      const W = f.map.w * TS, H = f.map.h * TS;
      const cx = W <= A.LW ? (W - A.LW) / 2 : Math.max(0, Math.min(W - A.LW, f.p.x - A.LW / 2));
      const cy = H <= A.LH ? (H - A.LH) / 2 : Math.max(0, Math.min(H - A.LH, f.p.y - 10 - A.LH / 2));
      return [Math.round(cx), Math.round(cy)];
    }

    cone(g, f, e, ox, oy) {
      const pts = [[e.px - ox, e.py - 8 - oy]];
      const n = 14, range = A.FIELD.SIGHT.range, half = A.FIELD.SIGHT.half;
      for (let i = 0; i <= n; i++) {
        const a = e.angle - half + (half * 2 * i) / n;
        let d = 0;
        while (d < range) {
          const x = e.px + Math.cos(a) * d, y = e.py - 8 + Math.sin(a) * d;
          if (f.sightBlocked(Math.floor(x / TS), Math.floor(y / TS))) break;
          d += 3;
        }
        pts.push([e.px + Math.cos(a) * d - ox, e.py - 8 + Math.sin(a) * d - oy]);
      }
      g.fillStyle = e.mode === 'chase' || e.mode === 'alert' ? 'rgba(230,60,40,0.35)' : 'rgba(240,200,80,0.25)';
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (const p of pts) g.lineTo(p[0], p[1]);
      g.closePath();
      g.fill();
    }

    glint(g, x, y, col) {
      const k = Math.floor(this.t * 6) % 4;
      g.fillStyle = col;
      g.fillRect(x + 7, y + 3 + k, 2, 2);
      g.fillRect(x + 3 + k, y + 8, 2, 1);
      g.fillRect(x + 11 - k, y + 11, 1, 2);
    }

    drawObject(g, f, o, X, Y) {
      const vis = f.visible(o);
      switch (o.type) {
        case 'crate':
          g.fillStyle = '#1a1018';
          g.fillRect(X, Y, 16, 16);
          g.fillStyle = '#7a5a3a';
          g.fillRect(X + 1, Y + 1, 14, 14);
          g.fillStyle = '#5a4026';
          g.fillRect(X + 1, Y + 7, 14, 2);
          g.fillRect(X + 7, Y + 1, 2, 14);
          g.fillStyle = '#9a7a52';
          g.fillRect(X + 1, Y + 1, 14, 1);
          break;
        case 'meditate': {
          const r = 5 + Math.sin(this.t * 3);
          g.strokeStyle = '#d8c080';
          g.lineWidth = 1;
          g.beginPath();
          g.arc(X + 8, Y + 9, r, 0, Math.PI * 2);
          g.stroke();
          g.fillStyle = '#d8c080';
          g.fillRect(X + 7, Y + 6, 2, 6);
          break;
        }
        case 'fragile':
          g.fillStyle = '#2c2c32';
          g.fillRect(X, Y, 16, 16);
          g.fillStyle = '#46464e';
          g.fillRect(X, Y + 6, 16, 10);
          if (vis) {
            g.fillStyle = '#b0e0ff';
            g.fillRect(X + 4, Y + 7, 1, 6);
            g.fillRect(X + 5, Y + 9, 4, 1);
            g.fillRect(X + 9, Y + 6, 1, 5);
            this.glint(g, X, Y, '#d0f0ff');
          }
          break;
        case 'jump':
          if (vis) {
            const s = Math.sign(o.to[0]) || 0, k = Math.floor(this.t * 4) % 2;
            g.fillStyle = '#f4bf6a';
            for (let i = 0; i < 2; i++) {
              const cx = X + 4 + i * 5 + k;
              g.fillRect(cx, Y + 6, 2, 2);
              g.fillRect(cx + s, Y + 8, 2, 2);
              g.fillRect(cx, Y + 10, 2, 2);
            }
          }
          break;
        case 'cache':
          if (vis && !f.mem(f.map.id).taken[o.id]) this.glint(g, X, Y, '#fff2b0');
          break;
        case 'clue':
          if (o.solid) {
            g.fillStyle = '#1a1018';
            g.fillRect(X, Y, 16, 16);
            g.fillStyle = '#6a5a3a';
            g.fillRect(X + 1, Y + 1, 14, 14);
            g.fillStyle = '#4a3a26';
            g.fillRect(X + 3, Y + 3, 10, 10);
          }
          if (vis) {
            g.fillStyle = 'rgba(150,220,255,0.35)';
            g.fillRect(X + 2, Y + 4, 12, 9);
            this.glint(g, X, Y, '#c0f0ff');
          }
          break;
        case 'duty':
          if (f.mem(f.map.id).taken[o.id]) break;
          g.fillStyle = '#5a4630';
          g.fillRect(X + 3, Y + 9, 10, 3);
          g.fillStyle = '#d8b060';
          g.fillRect(X + 4, Y + 7, 3, 2);
          g.fillRect(X + 9, Y + 7, 3, 2);
          this.glint(g, X, Y, '#ffe8a0');
          break;
        case 'repair': {
          const done = f.mem(f.map.id).taken[o.id];
          g.fillStyle = '#1a1a22';
          g.fillRect(X + 2, Y - 2, 12, 16);
          g.fillStyle = '#4a4a5a';
          g.fillRect(X + 3, Y - 1, 10, 14);
          g.fillStyle = '#2a2a34';
          for (let i = 0; i < 3; i++) g.fillRect(X + 4, Y + 1 + i * 4, 8, 2);
          g.fillStyle = done ? '#6ad06a' : Math.floor(this.t * 3) % 2 ? '#e0603a' : '#7a2a1a';
          g.fillRect(X + 10, Y, 2, 2);
          if (!done) this.glint(g, X, Y, '#ffe080');
          break;
        }
        case 'fire': {
          const k = Math.floor(this.t * 8 + o.x) % 3;
          g.fillStyle = '#5a1a0a';
          g.fillRect(X + 1, Y + 10, 14, 6);
          g.fillStyle = '#e0501a';
          g.fillRect(X + 2, Y + 3 + k, 12, 10 - k);
          g.fillStyle = '#ffb030';
          g.fillRect(X + 4, Y + 6 + (k ? 0 : 1), 8, 6);
          g.fillStyle = '#fff0a0';
          g.fillRect(X + 6 + k, Y + 9, 3, 3);
          break;
        }
        case 'lock':
          g.fillStyle = '#1a1a22';
          g.fillRect(X, Y - 6, 16, 22);
          g.fillStyle = '#5a5a66';
          g.fillRect(X + 1, Y - 5, 14, 20);
          g.fillStyle = '#3a3a44';
          g.fillRect(X + 7, Y - 5, 2, 20);
          g.fillStyle = '#d0402a';
          g.fillRect(X + 11, Y + 2, 2, 2);
          break;
        case 'screen':
          for (let i = 0; i < 3; i++) {
            g.fillStyle = i % 2 ? '#7a4a3a' : '#8a5a44';
            g.fillRect(X + 1 + i * 5, Y - 6 + (i % 2), 4, 20);
            g.fillStyle = '#c8a060';
            g.fillRect(X + 1 + i * 5, Y - 6 + (i % 2), 4, 1);
          }
          break;
        case 'examine':
          if (o.solid) {
            g.fillStyle = '#1a1018';
            g.fillRect(X + 1, Y + 4, 14, 11);
            g.fillStyle = '#6a5a4a';
            g.fillRect(X + 2, Y + 5, 12, 6);
            g.fillStyle = '#2a2420';
            g.fillRect(X + 3, Y + 11, 3, 3);
            g.fillRect(X + 10, Y + 11, 3, 3);
          } else {
            g.fillStyle = '#9a9aa0';
            g.fillRect(X + 4, Y + 3, 1, 5);
            g.fillRect(X + 6, Y + 3, 1, 5);
            g.fillRect(X + 8, Y + 3, 1, 5);
            g.fillRect(X + 11, Y + 4, 2, 2);
          }
          break;
        case 'exit':
          g.fillStyle = '#1a1018';
          g.fillRect(X + 2, Y + 2, 12, 12);
          g.fillStyle = '#0a0a0e';
          g.fillRect(X + 3, Y + 3, 10, 10);
          g.fillStyle = '#7a6040';
          for (let i = 0; i < 3; i++) g.fillRect(X + 4, Y + 4 + i * 3, 8, 1);
          break;
        case 'end':
          g.fillStyle = '#1a1018';
          g.fillRect(X + 1, Y, 14, 16);
          g.fillStyle = '#5a4030';
          g.fillRect(X + 2, Y + 1, 12, 15);
          g.fillStyle = '#c8a050';
          g.fillRect(X + 11, Y + 8, 2, 2);
          break;
        case 'lever':
          g.fillStyle = '#3a3a40';
          g.fillRect(X + 6, Y + 8, 4, 7);
          g.fillStyle = o.on ? '#8ad06a' : '#d0603a';
          g.fillRect(o.on ? X + 9 : X + 3, Y + 3, 4, 4);
          break;
        case 'bridge':
          if (!o.on) {
            g.fillStyle = '#1a1018';
            g.fillRect(X + 3, Y - 8, 10, 24);
            g.fillStyle = '#7a6248';
            g.fillRect(X + 4, Y - 7, 8, 22);
            g.fillStyle = '#5a4630';
            g.fillRect(X + 4, Y - 1, 8, 1);
            g.fillRect(X + 4, Y + 7, 8, 1);
          } else {
            g.fillStyle = '#5a4630';
            g.fillRect(X + 6, Y + 6, 4, 8);
          }
          break;
        case 'brace':
          g.fillStyle = '#1a1018';
          g.fillRect(X + 1, Y - 10, 4, 26);
          g.fillRect(X + 11, Y - 10, 4, 26);
          g.fillStyle = '#7a5a34';
          g.fillRect(X + 2, Y - 9, 2, 24);
          g.fillRect(X + 12, Y - 9, 2, 24);
          g.fillRect(X, Y - 11, 16, 3);
          break;
        case 'cocoon':
          g.fillStyle = '#1a1018';
          g.fillRect(X + 3, Y - 7, 10, 22);
          g.fillStyle = '#b8b0c0';
          g.fillRect(X + 4, Y - 6, 8, 20);
          g.fillStyle = '#d8d0e0';
          g.fillRect(X + 5, Y - 5, 3, 17);
          g.fillStyle = '#8a8098';
          for (let i = 0; i < 4; i++) g.fillRect(X + 4, Y - 3 + i * 5, 8, 1);
          g.fillRect(X + 7, Y - 12, 1, 6);
          break;
        case 'drift': {
          const bob = Math.round(Math.sin(this.t * 2 + o.home[0]) * 1.5);
          g.fillStyle = 'rgba(0,0,0,0.3)';
          g.fillRect(X + 3, Y + 12, 10, 3);
          g.fillStyle = '#1a1018';
          g.fillRect(X + 1, Y - 3 + bob, 14, 12);
          g.fillStyle = '#8a7a62';
          g.fillRect(X + 2, Y - 2 + bob, 12, 10);
          g.fillStyle = '#a8987a';
          g.fillRect(X + 3, Y - 2 + bob, 7, 3);
          g.fillStyle = '#6a5a46';
          g.fillRect(X + 9, Y + 4 + bob, 4, 3);
          break;
        }
        case 'rest':
          g.fillStyle = '#1a1018';
          g.fillRect(X + 1, Y + 6, 14, 8);
          g.fillStyle = '#7a5a3a';
          g.fillRect(X + 2, Y + 7, 12, 6);
          g.fillStyle = '#a07a4a';
          g.fillRect(X + 2, Y + 7, 4, 6);
          g.fillStyle = '#f4c060';
          g.fillRect(X + 12, Y + 3 + (Math.floor(this.t * 5) % 2), 2, 3);
          break;
        case 'spot':
          if (o.occupied) {
            this.actor(g, 'anzat_feral', 'down', 'idle0', X + 8, Y + 14);
            g.fillStyle = '#2e4a22';
            g.fillRect(X, Y + 8, 16, 8);
            g.fillStyle = '#4a6a32';
            for (let i = 0; i < 4; i++) g.fillRect(X + i * 4, Y + 6 + (i % 2) * 2, 3, 4);
          } else {
            g.fillStyle = '#1a2a14';
            g.fillRect(X + 1, Y + 5, 14, 11);
            g.fillStyle = '#3e5a2a';
            for (let i = 0; i < 5; i++) g.fillRect(X + 1 + i * 3, Y + 3 + (i % 2) * 3, 3, 9);
            if (f.S.flags.retinue && (f.S.flags.placed || 0) < 2) {
              g.fillStyle = `rgba(244,191,106,${0.4 + 0.3 * Math.sin(this.t * 5)})`;
              g.fillRect(X + 6, Y - 4, 4, 3);
            }
          }
          break;
        case 'shelter':
          g.fillStyle = '#1a1018';
          g.fillRect(X - 9, Y - 10, 34, 12);
          g.fillStyle = '#5a4a3a';
          g.fillRect(X - 8, Y - 9, 32, 9);
          g.fillStyle = '#7a6a52';
          g.fillRect(X - 8, Y - 9, 32, 2);
          g.fillStyle = 'rgba(0,0,0,0.35)';
          g.fillRect(X - 8, Y, 32, 14);
          break;
        case 'scene':
          g.fillStyle = '#05040a';
          g.fillRect(X - 6, Y - 14, 28, 30);
          g.fillStyle = '#3a3440';
          g.fillRect(X - 7, Y - 15, 30, 2);
          g.fillRect(X - 7, Y - 15, 2, 31);
          g.fillRect(X + 21, Y - 15, 2, 31);
          g.strokeStyle = 'rgba(200,196,220,0.55)';
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(X - 5, Y - 13);
          g.lineTo(X + 21, Y + 10);
          g.moveTo(X + 21, Y - 13);
          g.lineTo(X - 5, Y + 6);
          g.moveTo(X + 8, Y - 13);
          g.lineTo(X + 8, Y + 14);
          g.stroke();
          break;
        case 'gate': {
          g.fillStyle = '#2a2a32';
          g.fillRect(X, Y - 6, 3, 22);
          g.fillRect(X + 13, Y - 6, 3, 22);
          if (o.on) break;
          const k = 0.55 + 0.25 * Math.sin(this.t * 14 + o.x);
          for (let i = 0; i < 4; i++) {
            g.fillStyle = `rgba(255,60,40,${k.toFixed(2)})`;
            g.fillRect(X + 3, Y - 3 + i * 5, 10, 1);
            g.fillStyle = 'rgba(255,200,160,0.5)';
            g.fillRect(X + 3, Y - 3 + i * 5, 10, 1 / 2);
          }
          break;
        }
        case 'decoy':
          if (f.mem(f.map.id).taken[o.id]) break;
          g.fillStyle = 'rgba(224,176,32,0.35)';
          g.fillRect(X + 2, Y + 2, 12, 12);
          g.fillStyle = '#e0b020';
          g.fillRect(X + 7, Y + 3, 2, 8);
          g.fillRect(X + 9, Y + 3, 4, 3);
          break;
        case 'grab': {
          const k = 0.5 + 0.3 * Math.sin(this.t * 5);
          g.fillStyle = '#1a1018';
          g.fillRect(X + 3, Y + 4, 10, 9);
          g.fillStyle = '#8a8a7a';
          g.fillRect(X + 4, Y + 5, 8, 7);
          g.fillStyle = `rgba(120,220,255,${k.toFixed(2)})`;
          g.fillRect(X + 6, Y + 7, 4, 2);
          break;
        }
        case 'glow': {
          if (!A.Memory.has(f.S, o.frag)) break;
          const r = 2 + Math.sin(this.t * 3 + o.x);
          g.fillStyle = 'rgba(255,214,140,0.85)';
          g.fillRect(X + 7, Y + 6 - r, 2, 2);
          g.fillStyle = 'rgba(255,240,200,0.6)';
          g.fillRect(X + 6, Y + 9, 4, 1);
          break;
        }
      }
    }

    darkness(g, f, ox, oy) {
      const w = A.LW / 2, h = A.LH / 2;
      if (!this.shade) {
        this.shade = document.createElement('canvas');
        this.shade.width = w;
        this.shade.height = h;
      }
      const s = this.shade.getContext('2d');
      s.globalCompositeOperation = 'source-over';
      s.clearRect(0, 0, w, h);
      s.fillStyle = 'rgba(2,1,6,0.94)';
      s.fillRect(0, 0, w, h);
      s.globalCompositeOperation = 'destination-out';
      const light = (x, y, r) => {
        const cx = (x - ox) / 2, cy = (y - oy) / 2, rr = r / 2;
        if (cx < -rr || cy < -rr || cx > w + rr || cy > h + rr) return;
        const gr = s.createRadialGradient(cx, cy, rr * 0.3, cx, cy, rr);
        gr.addColorStop(0, 'rgba(0,0,0,1)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        s.fillStyle = gr;
        s.beginPath();
        s.arc(cx, cy, rr, 0, Math.PI * 2);
        s.fill();
      };
      const glow = { meditate: 34, cocoon: 16, scene: 26, exit: 20, cache: 12, clue: 14, examine: 12, npc: 18, rest: 30, grab: 18 };
      light(f.p.x, f.p.y - 10, 64 + Math.sin(this.t * 9) * 2);
      for (const fl of f.followers) light(fl.x, fl.y - 10, 30);
      for (const o of f.objs) {
        if (A.Field.mobile(o)) { if (f.visible(o)) light(o.px, o.py - 6, 14); }
        else if (o.type === 'glow') { if (A.Memory.has(f.S, o.frag)) light(o.x * TS + 8, o.y * TS + 8, 72); }
        else if (o.type === 'gate' && !o.on) light(o.x * TS + 8, o.y * TS + 6, 18);
        else if (glow[o.type] && f.visible(o) && (o.type !== 'meditate' || f.can('meditate'))) light(o.x * TS + 8, o.y * TS + 8, glow[o.type]);
      }
      g.imageSmoothingEnabled = false;
      g.drawImage(this.shade, 0, 0, A.LW, A.LH);
    }

    draw(g, f) {
      const [ox, oy] = this.camera(f);
      g.fillStyle = '#000';
      g.fillRect(0, 0, A.LW, A.LH);
      g.drawImage(this.mapCanvasFor(f), -ox, -oy);
      if (f.senseShow > 0) for (const e of f.objs) if (A.Field.mobile(e) && f.visible(e)) this.cone(g, f, e, ox, oy);
      const items = [];
      for (const o of f.objs) {
        if (A.Field.mobile(o)) { if (f.visible(o)) items.push({ y: o.py, draw: () => this.actor(g, o.look, A.Field.dirOfAngle(o.angle), o.mode === 'patrol' || o.mode === 'return' ? 'walk' + (Math.floor(o.anim * 6) % 4) : 'idle0', o.px - ox, o.py - oy, 0, o.mode) }); }
        else if (o.type === 'npc') items.push({ y: o.y * TS + 14, draw: () => this.actor(g, o.look, o.face || 'down', 'idle' + (Math.floor(this.t / 0.7 + o.x) % 2), o.x * TS + 8 - ox, o.y * TS + 14 - oy) });
        else {
          const X = Math.round((o.ax !== undefined ? o.ax : o.x * TS) - ox), Y = Math.round((o.ay !== undefined ? o.ay : o.y * TS) - oy);
          if (o.type === 'trigger') continue;
          const flat = ['meditate', 'jump', 'cache', 'exit', 'rest', 'shelter', 'glow', 'decoy'].includes(o.type) && o.type !== 'spot' || (o.type === 'clue' && !o.solid) || (o.type === 'examine' && !o.solid);
          if (o.type === 'meditate' && !f.can('meditate')) continue;
          if (flat) this.drawObject(g, f, o, X, Y);
          else items.push({ y: Y + oy + 15, draw: () => this.drawObject(g, f, o, X, Y) });
        }
      }
      const p = f.p;
      for (const fl of f.followers) items.push({ y: fl.y, draw: () => this.actor(g, fl.look, fl.dir, fl.frame, fl.x - ox, fl.y - oy) });
      const look = A.Party ? A.Party.look(f.S, 'aayla') : 'aayla_padawan';
      items.push({ y: p.y, draw: () => this.actor(g, look, p.dir, p.frame, p.x - ox, p.y - oy, p.lift || 0) });
      items.sort((a, b) => a.y - b.y).forEach(it => it.draw());
      const m = f.map;
      for (let y = Math.max(0, Math.floor(oy / TS)); y < Math.min(m.h, Math.ceil((oy + A.LH) / TS) + 1); y++) {
        for (let x = Math.max(0, Math.floor(ox / TS)); x < Math.min(m.w, Math.ceil((ox + A.LW) / TS) + 1); x++) {
          if (f.tile(x, y) !== T.over) continue;
          const X = x * TS - ox, Y = y * TS - oy;
          g.fillStyle = AWNING[(Math.floor(x / 3) + y) % AWNING.length];
          g.fillRect(X, Y - 6, TS, 14);
          g.fillStyle = 'rgba(0,0,0,0.25)';
          g.fillRect(X, Y + 6, TS, 2);
          g.fillStyle = 'rgba(255,255,255,0.18)';
          g.fillRect(X + (x % 2) * 8, Y - 6, 8, 14);
        }
      }
      if (m.def.water) {
        g.fillStyle = 'rgba(24,80,150,0.34)';
        g.fillRect(0, 0, A.LW, A.LH);
        g.fillStyle = 'rgba(200,230,255,0.5)';
        for (let i = 0; i < 14; i++) g.fillRect(Math.round((i * 47 + this.t * 6) % A.LW), Math.round(A.LH - ((i * 31 + this.t * 30) % A.LH)), 1, 1);
      }
      if (m.def.dark) this.darkness(g, f, ox, oy);
      if (f.storm) this.weather(g, f);
      if (f.wave >= 0) {
        const r = (f.wave / 0.6) * A.FIELD.SENSE.radius;
        g.strokeStyle = 'rgba(140,220,255,' + (1 - f.wave / 0.6).toFixed(2) + ')';
        g.lineWidth = 2;
        g.beginPath();
        g.arc(p.x - ox, p.y - 8 - oy, r, 0, Math.PI * 2);
        g.stroke();
      }
    }

    weather(g, f) {
      const s = f.storm, sheltered = f.sheltered();
      let a = s.phase === 'warn' ? 0.1 + 0.08 * Math.sin(this.t * 6) : s.phase === 'blow' ? 0.32 : 0;
      if (sheltered) a *= 0.4;
      if (a <= 0) return;
      g.fillStyle = `rgba(255,120,40,${a.toFixed(3)})`;
      g.fillRect(0, 0, A.LW, A.LH);
      if (s.phase !== 'blow') return;
      g.fillStyle = sheltered ? 'rgba(255,200,140,0.18)' : 'rgba(255,220,160,0.45)';
      for (let i = 0; i < 40; i++) {
        const x = ((i * 53 + this.t * 420) % (A.LW + 40)) - 20, y = (i * 37) % A.LH;
        g.fillRect(Math.round(x), y, 9, 1);
      }
    }

    actor(g, look, dir, frame, x, y, lift, mode) {
      if (lift) {
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.fillRect(Math.round(x) - 5, Math.round(y) - 2, 10, 3);
      }
      const c = this.sprite(look, dir, frame), top = A.Pix.FIELD_BEASTS[look] ? y - 6 - c.height / 2 : y - c.height - (lift || 0);
      g.drawImage(c, Math.round(x - c.width / 2), Math.round(top));
      if (mode === 'alert' || mode === 'chase' || mode === 'look') {
        const t = mode === 'look' ? '?' : '!';
        g.fillStyle = '#1a1018';
        g.fillRect(Math.round(x) - 3, Math.round(y) - 35, 7, 9);
        g.fillStyle = mode === 'look' ? '#f4e070' : '#f05030';
        if (t === '!') { g.fillRect(Math.round(x), Math.round(y) - 34, 1, 5); g.fillRect(Math.round(x), Math.round(y) - 28, 1, 1); }
        else { g.fillRect(Math.round(x) - 1, Math.round(y) - 34, 3, 1); g.fillRect(Math.round(x) + 1, Math.round(y) - 33, 1, 2); g.fillRect(Math.round(x), Math.round(y) - 31, 1, 1); g.fillRect(Math.round(x), Math.round(y) - 28, 1, 1); }
      }
    }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
