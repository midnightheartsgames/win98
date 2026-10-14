(function (N) {
  'use strict';

  const MAP_LAND = { f: '#6a9656', p: '#a4c08a', g: '#bfc79c', e: '#b0c4a8', b: '#b4c290', o: '#c4c8a6', i: '#7aa860', j: '#c4b08a', c: '#b8b4aa', t: '#b8765a', y: '#dccca0', s: '#e0d0a0', q: '#bdb7ab', k: '#c2bdb0', m: '#d8c0a0', h: '#d8d0b0', d: '#d8d4b0', x: '#e0c8c0', z: '#a8b89a', a: '#b8c48e', r: '#b8b2aa', n: '#bcb4ac', u: '#c8bc98', v: '#d0c4bc', l: '#c4c890', P: '#ddd6c8', w: '#4a7ab8' };
  const MAP_ORDER = 'Rlanvdhxzgpbeforskmqcjiytw';

  N.renderMap = (city, scale) => {
    const s = scale || 0.35;
    const X0 = Math.floor(city.PX0 - 220), Z0 = Math.floor(city.PZ0 - 220), X1 = Math.ceil(city.PX1 + 220), Z1 = Math.ceil(city.PZ1 + 220);
    const c = document.createElement('canvas');
    c.width = Math.round((X1 - X0) * s);
    c.height = Math.round((Z1 - Z0) * s);
    c.ox = X0;
    c.oz = Z0;
    c.s = s;
    const g = c.getContext('2d');
    g.setTransform(s, 0, 0, s, -X0 * s, -Z0 * s);
    const path = (p, close) => { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); if (close) g.closePath(); };
    g.fillStyle = '#cfc7ae';
    g.fillRect(X0, Z0, X1 - X0, Z1 - Z0);
    if (city.water.length) {
      g.fillStyle = '#4a7ab8';
      g.beginPath();
      for (const r of city.water) { g.moveTo(r[0], r[1]); for (let i = 2; i < r.length; i += 2) g.lineTo(r[i], r[i + 1]); g.closePath(); }
      g.fill('evenodd');
    }
    for (const l of city.land.slice().sort((p, q) => MAP_ORDER.indexOf(p.k) - MAP_ORDER.indexOf(q.k))) {
      const col = MAP_LAND[l.k];
      if (!col || l.box.x1 < X0 || l.box.x0 > X1 || l.box.z1 < Z0 || l.box.z0 > Z1) continue;
      g.fillStyle = col;
      path(l.poly, true);
      g.fill();
    }
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.strokeStyle = '#d8d0bc';
    for (const f of city.foot) { g.lineWidth = Math.max(2, f.w); path(f.pts); g.stroke(); }
    g.strokeStyle = '#e4e0d4';
    for (const q of city.surf) { g.lineWidth = q.w; path(q.pts); g.stroke(); }
    g.strokeStyle = '#7a7068';
    g.lineWidth = 3;
    g.setLineDash([8, 5]);
    for (const r of city.rails) if (r.k !== 'A') { path(r.pts); g.stroke(); }
    g.setLineDash([]);
    for (const e of city.edges) { g.strokeStyle = '#dcd6c4'; g.lineWidth = e.hw * 2 + e.swR + e.swL; path(e.pts); g.stroke(); }
    for (const e of city.edges) { g.strokeStyle = e.plant ? '#e2ded4' : e.main ? '#fff2c8' : '#f6f4ee'; g.lineWidth = e.hw * 2; path(e.pts); g.stroke(); }
    g.fillStyle = '#f6f4ee';
    for (const n of city.nodes) if (n.poly) { path(n.poly, true); g.fill(); }
    g.fillStyle = 'rgba(80,120,60,0.55)';
    for (const p of city.props) if (p.type === 'tree') g.fillRect(p.x - 1.6, p.z - 1.6, 3.2, 3.2);
    const ML = city.metroLine;
    if (ML) {
      g.strokeStyle = 'rgba(212,42,42,0.75)';
      g.lineWidth = 7;
      g.setLineDash([16, 8]);
      g.beginPath();
      ML.st.forEach((q, i) => (i ? g.lineTo(q.real.x, q.real.z) : g.moveTo(q.real.x, q.real.z)));
      g.stroke();
      g.setLineDash([]);
    }
    g.strokeStyle = '#7a7266';
    g.lineWidth = 1.2;
    for (const b of city.buildings) {
      if (b.removed || b.y0 > 0) continue;
      g.fillStyle = b.style === 'hall' || b.style === 'factory' || b.style === 'warehouse' ? '#8e8a82' : b.style === 'wood' || b.style === 'shed' || b.style === 'brickhouse' ? '#a08a70' : b.style === 'garage' ? '#a09c94' : '#9a9284';
      path(b.poly, true);
      g.fill();
      g.stroke();
    }
    return c;
  };

  const ICONS = {
    save(g, r) { g.fillStyle = '#3ac0ff'; g.beginPath(); g.moveTo(-r, 0); g.lineTo(0, -r); g.lineTo(r, 0); g.lineTo(r * 0.7, 0); g.lineTo(r * 0.7, r * 0.8); g.lineTo(-r * 0.7, r * 0.8); g.lineTo(-r * 0.7, 0); g.closePath(); g.fill(); g.stroke(); },
    gun(g, r) { g.fillStyle = '#ffa030'; g.fillRect(-r, -r * 0.35, r * 1.8, r * 0.6); g.fillRect(-r * 0.2, 0, r * 0.5, r * 0.9); g.strokeRect(-r, -r * 0.35, r * 1.8, r * 0.6); },
    clothes(g, r) { g.fillStyle = '#ffa030'; g.beginPath(); g.moveTo(-r, -r * 0.5); g.lineTo(-r * 0.4, -r * 0.8); g.lineTo(r * 0.4, -r * 0.8); g.lineTo(r, -r * 0.5); g.lineTo(r * 0.6, -r * 0.1); g.lineTo(r * 0.5, r * 0.8); g.lineTo(-r * 0.5, r * 0.8); g.lineTo(-r * 0.6, -r * 0.1); g.closePath(); g.fill(); g.stroke(); },
    spray(g, r) { g.fillStyle = '#5a8cff'; g.fillRect(-r * 0.45, -r * 0.4, r * 0.9, r * 1.3); g.strokeRect(-r * 0.45, -r * 0.4, r * 0.9, r * 1.3); g.fillStyle = '#fff'; g.fillRect(-r * 0.2, -r * 0.8, r * 0.4, r * 0.4); },
    hosp(g, r) { g.fillStyle = '#fff'; g.fillRect(-r, -r, r * 2, r * 2); g.strokeRect(-r, -r, r * 2, r * 2); g.fillStyle = '#e02020'; g.fillRect(-r * 0.25, -r * 0.75, r * 0.5, r * 1.5); g.fillRect(-r * 0.75, -r * 0.25, r * 1.5, r * 0.5); },
    ovd(g, r) { g.fillStyle = '#2050c0'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? r * 0.45 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); },
    metro(g, r) { g.fillStyle = '#f2f2f2'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#d42a2a'; g.font = 'bold ' + (r * 1.45 | 0) + 'px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('М', 0, r * 0.1); },
    wheel(g, r) { g.strokeStyle = '#111'; g.lineWidth = 3; g.beginPath(); g.arc(0, -r * 0.15, r * 0.8, 0, 7); g.stroke(); g.strokeStyle = '#7ac8ff'; g.lineWidth = 1.8; g.beginPath(); g.arc(0, -r * 0.15, r * 0.8, 0, 7); for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI; g.moveTo(Math.cos(a) * r * 0.8, -r * 0.15 + Math.sin(a) * r * 0.8); g.lineTo(-Math.cos(a) * r * 0.8, -r * 0.15 - Math.sin(a) * r * 0.8); } g.moveTo(-r * 0.6, r); g.lineTo(0, -r * 0.15); g.lineTo(r * 0.6, r); g.stroke(); },
    tir(g, r) { for (const [rr, c] of [[1, '#f4f2ec'], [0.66, '#e0302a'], [0.3, '#f4f2ec']]) { g.fillStyle = c; g.beginPath(); g.arc(0, 0, r * rr, 0, 7); g.fill(); } g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); },
    food(g, r) { g.fillStyle = '#e8d29a'; g.beginPath(); g.moveTo(-r * 0.45, r); g.lineTo(-r * 0.6, -r * 0.6); g.lineTo(r * 0.6, -r * 0.6); g.lineTo(r * 0.45, r); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#a0602a'; g.fillRect(-r * 0.55, -r * 0.95, r * 1.1, r * 0.4); g.strokeRect(-r * 0.55, -r * 0.95, r * 1.1, r * 0.4); },
    buy(g, r) { g.fillStyle = '#40d060'; g.beginPath(); g.moveTo(-r, 0); g.lineTo(0, -r); g.lineTo(r, 0); g.lineTo(r * 0.7, 0); g.lineTo(r * 0.7, r * 0.8); g.lineTo(-r * 0.7, r * 0.8); g.lineTo(-r * 0.7, 0); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#111'; g.font = 'bold ' + (r * 1.1 | 0) + 'px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('₽', 0, r * 0.35); }
  };

  function weaponIcon(g, id, w, h) {
    g.save();
    g.translate(w / 2, h / 2);
    const s = Math.min(w, h) / 64;
    g.scale(s, s);
    g.lineJoin = 'round';
    g.strokeStyle = '#111';
    g.lineWidth = 3;
    const fill = (col, path) => { g.fillStyle = col; g.beginPath(); path(); g.closePath(); g.fill(); g.stroke(); };
    if (id === 'fists') {
      fill('#e8b894', () => { g.moveTo(-14, -16); g.lineTo(12, -18); g.lineTo(18, -6); g.lineTo(16, 14); g.lineTo(-8, 18); g.lineTo(-18, 4); });
      g.beginPath(); for (const y of [-10, -3, 4]) { g.moveTo(-4, y); g.lineTo(14, y); } g.stroke();
    } else if (id === 'knuckles') {
      fill('#d8c890', () => { g.rect(-22, -10, 44, 16); });
      g.fillStyle = '#1a1a1a'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-15 + i * 10, -2, 4, 0, 7); g.fill(); }
    } else if (id === 'knife') {
      fill('#d0d4d8', () => { g.moveTo(-24, -4); g.lineTo(10, -8); g.lineTo(26, 0); g.lineTo(10, 4); g.lineTo(-24, 4); });
      fill('#5a3a20', () => { g.rect(-28, -6, 12, 12); });
    } else if (id === 'pm') {
      fill('#3a3c40', () => { g.moveTo(-22, -12); g.lineTo(22, -12); g.lineTo(22, -2); g.lineTo(-4, -2); g.lineTo(-8, 18); g.lineTo(-20, 18); g.lineTo(-16, -2); g.lineTo(-22, -2); });
      g.fillStyle = '#6a3a20'; g.fillRect(-18, 2, 8, 14);
    } else if (id === 'shotgun') {
      fill('#3a3c40', () => { g.rect(-30, -8, 56, 6); });
      fill('#7a4a24', () => { g.moveTo(-30, -2); g.lineTo(-6, -2); g.lineTo(-10, 8); g.lineTo(-30, 12); });
      fill('#7a4a24', () => { g.rect(4, -2, 14, 5); });
    } else if (id === 'ak') {
      fill('#3a3c40', () => { g.rect(-18, -10, 48, 8); });
      fill('#8a4a20', () => { g.moveTo(-18, -8); g.lineTo(-32, -4); g.lineTo(-32, 6); g.lineTo(-18, 0); });
      fill('#9a5a28', () => { g.moveTo(2, -2); g.lineTo(10, -2); g.lineTo(16, 16); g.lineTo(8, 18); });
      fill('#8a4a20', () => { g.rect(14, -10, 12, 6); });
    } else if (id === 'svd') {
      fill('#3a3c40', () => { g.rect(-14, -6, 48, 5); });
      fill('#8a4a20', () => { g.moveTo(-14, -6); g.lineTo(-32, -2); g.lineTo(-32, 8); g.lineTo(-20, 8); g.lineTo(-14, 0); });
      fill('#1a1a1a', () => { g.rect(-8, -14, 22, 6); });
      fill('#5a5a5a', () => { g.rect(0, -1, 6, 10); });
    } else if (id === 'rsh12') {
      fill('#2a2c30', () => { g.moveTo(-16, -14); g.lineTo(28, -14); g.lineTo(28, -3); g.lineTo(-6, -3); g.lineTo(-10, 4); g.lineTo(-16, 4); });
      fill('#4a4e56', () => { g.rect(-12, -12, 14, 13); });
      g.fillStyle = '#c8a050'; for (let i = 0; i < 3; i++) g.fillRect(-11, -10 + i * 4, 3, 2);
      fill('#1e1e20', () => { g.moveTo(-16, 0); g.lineTo(-6, 0); g.lineTo(-12, 20); g.lineTo(-24, 20); });
    } else if (id === 'toz34') {
      fill('#3a3c40', () => { g.rect(-12, -11, 44, 4); });
      fill('#3a3c40', () => { g.rect(-12, -7, 44, 4); });
      fill('#b8b8b0', () => { g.rect(-18, -11, 8, 11); });
      fill('#7a4a24', () => { g.moveTo(-18, -7); g.lineTo(-32, -3); g.lineTo(-32, 8); g.lineTo(-16, 0); });
      fill('#7a4a24', () => { g.rect(-6, -3, 18, 4); });
    } else if (id === 'kiparis') {
      fill('#2a2c30', () => { g.rect(-14, -10, 34, 10); });
      fill('#2a2c30', () => { g.moveTo(-10, 0); g.lineTo(-2, 0); g.lineTo(-6, 16); g.lineTo(-14, 16); });
      fill('#3a3c40', () => { g.rect(4, 0, 7, 18); });
      fill('#2a2c30', () => { g.rect(20, -7, 7, 4); });
      g.beginPath(); g.moveTo(-14, -13); g.lineTo(14, -13); g.lineTo(14, -10); g.stroke();
    } else if (id === 'bizon') {
      fill('#2a2c30', () => { g.rect(-16, -11, 42, 7); });
      fill('#3a3c40', () => { g.rect(-6, -4, 30, 9); });
      g.strokeStyle = '#6a6c70'; g.beginPath(); for (let x = -2; x < 22; x += 5) { g.moveTo(x, -3); g.lineTo(x + 3, 4); } g.stroke(); g.strokeStyle = '#111';
      fill('#2a2c30', () => { g.moveTo(-16, -4); g.lineTo(-10, -4); g.lineTo(-14, 14); g.lineTo(-20, 14); });
      g.beginPath(); g.moveTo(-16, -9); g.lineTo(-32, -7); g.lineTo(-32, 2); g.lineTo(-18, -2); g.stroke();
    } else if (id === 'sks') {
      fill('#8a5228', () => { g.moveTo(-32, -2); g.lineTo(-14, -6); g.lineTo(18, -6); g.lineTo(18, 0); g.lineTo(-14, 0); g.lineTo(-32, 8); });
      fill('#3a3c40', () => { g.rect(-14, -10, 46, 4); });
      fill('#3a3c40', () => { g.rect(-6, 0, 9, 5); });
      g.beginPath(); g.moveTo(14, -1); g.lineTo(30, -1); g.stroke();
    } else if (id === 'vss') {
      fill('#3a3c40', () => { g.rect(-12, -8, 18, 8); });
      fill('#2a2c30', () => { g.rect(6, -10, 26, 11); });
      fill('#8a5228', () => { g.moveTo(-12, -6); g.lineTo(-32, -2); g.lineTo(-32, 8); g.lineTo(-26, 8); g.lineTo(-24, 2); g.lineTo(-12, 0); });
      fill('#1a1a1a', () => { g.rect(-8, -17, 18, 6); });
      fill('#3a3c40', () => { g.rect(-2, 0, 6, 10); });
    } else if (id === 'pkm') {
      fill('#2a2c30', () => { g.rect(-16, -10, 22, 9); });
      fill('#2a2c30', () => { g.rect(6, -7, 26, 3); });
      fill('#8a5228', () => { g.moveTo(-16, -8); g.lineTo(-32, -4); g.lineTo(-32, 6); g.lineTo(-16, 0); });
      fill('#5a6a3a', () => { g.rect(-10, -1, 14, 12); });
      g.beginPath(); g.moveTo(22, -4); g.lineTo(18, 12); g.moveTo(22, -4); g.lineTo(28, 12); g.stroke();
    } else if (id === 'rpg7') {
      fill('#4a5040', () => { g.rect(-30, -6, 44, 7); });
      fill('#8a5228', () => { g.rect(-6, -8, 12, 11); });
      fill('#2a2c30', () => { g.moveTo(-34, -9); g.lineTo(-28, -6); g.lineTo(-28, 1); g.lineTo(-34, 4); });
      fill('#5a6a3a', () => { g.moveTo(14, -5); g.lineTo(20, -10); g.lineTo(28, -10); g.lineTo(34, -3); g.lineTo(28, 4); g.lineTo(20, 4); g.lineTo(14, 0); });
      fill('#2a2c30', () => { g.rect(-14, 1, 5, 12); });
      fill('#2a2c30', () => { g.rect(4, 1, 5, 12); });
    } else if (id === 'izh38') {
      fill('#2c2e32', () => { g.rect(-10, -9, 44, 4); });
      fill('#3a3c40', () => { g.rect(-18, -11, 14, 7); });
      fill('#b07a46', () => { g.moveTo(-18, -5); g.lineTo(-33, -2); g.lineTo(-33, 9); g.lineTo(-28, 9); g.lineTo(-14, 1); g.lineTo(4, 1); g.lineTo(4, -5); });
      g.beginPath(); g.moveTo(-10, 1); g.quadraticCurveTo(-8, 7, -4, 7); g.stroke();
    } else if (id === 'molotov') {
      fill('#7a9a6a', () => { g.moveTo(-8, 22); g.lineTo(8, 22); g.lineTo(8, -2); g.lineTo(3, -8); g.lineTo(3, -14); g.lineTo(-3, -14); g.lineTo(-3, -8); g.lineTo(-8, -2); });
      g.fillStyle = 'rgba(200,120,40,0.7)'; g.fillRect(-7, 4, 14, 17);
      fill('#e8e0c8', () => { g.rect(-3, -20, 6, 7); });
      fill('#ffb030', () => { g.moveTo(0, -34); g.quadraticCurveTo(9, -25, 3, -20); g.lineTo(-3, -20); g.quadraticCurveTo(-9, -26, 0, -34); });
    } else if (id === 'grenade') {
      fill('#5a6a3a', () => { g.ellipse(0, 4, 13, 16, 0, 0, 7); });
      g.strokeStyle = '#2a3a1a'; g.beginPath(); for (let i = -10; i <= 10; i += 6) { g.moveTo(i, -8); g.lineTo(i, 18); } g.stroke(); g.strokeStyle = '#111';
      fill('#a0a0a0', () => { g.rect(-5, -16, 10, 6); });
      g.beginPath(); g.arc(10, -14, 6, 0, 7); g.stroke();
    }
    g.restore();
  }
  N.weaponIcon = weaponIcon;

  N.drawBeacon = (g, x, y, r, on, i, t) => {
    g.save();
    g.translate(x, y);
    g.lineWidth = 2.5;
    g.strokeStyle = '#000';
    g.fillStyle = on ? '#2a2a2a' : 'rgba(20,20,30,0.5)';
    g.fillRect(-r * 1.05, r * 0.35, r * 2.1, r * 0.55);
    g.strokeRect(-r * 1.05, r * 0.35, r * 2.1, r * 0.55);
    const blue = (Math.floor(t * 6) + i) % 2 === 0;
    const col = on ? (blue ? '#3a78ff' : '#ff3a3a') : 'rgba(80,100,140,0.35)';
    if (on) { g.shadowColor = col; g.shadowBlur = r * 1.2; }
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(-r * 0.8, r * 0.35); g.lineTo(-r * 0.62, -r * 0.55); g.quadraticCurveTo(0, -r * 1.15, r * 0.62, -r * 0.55); g.lineTo(r * 0.8, r * 0.35); g.closePath();
    g.fill();
    g.shadowBlur = 0;
    g.stroke();
    if (on) { g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(-r * 0.35, -r * 0.45, r * 0.22, r * 0.6); }
    g.restore();
  };

  class Hud {
    constructor(canvas, city) {
      this.c = canvas;
      this.g = canvas.getContext('2d');
      this.city = city;
      this.map = null;
      this.moneyShown = 0;
      this.hurtFlash = 0;
      this.zone = null;
      this.lastWanted = 0;
      this.wantedFlashT = 0;
    }

    ensureMap() { if (!this.map) this.map = N.renderMap(this.city, 0.35); return this.map; }

    text(t, x, y, o) {
      const g = this.g;
      g.font = o.font;
      g.textAlign = o.align || 'left';
      g.textBaseline = o.base || 'alphabetic';
      if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.stroke; g.strokeStyle = o.strokeCol || '#000'; g.strokeText(t, x, y); }
      if (o.shadow) { g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillText(t, x + o.shadow, y + o.shadow); }
      g.fillStyle = o.fill || '#fff';
      g.fillText(t, x, y);
    }

    wrap(t, maxW) {
      const g = this.g;
      const words = t.split(' ');
      const lines = [];
      let cur = '';
      for (const w of words) {
        const test = cur ? cur + ' ' + w : w;
        if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
      }
      if (cur) lines.push(cur);
      return lines;
    }

    draw(st) {
      const g = this.g, W = this.c.width, H = this.c.height;
      g.clearRect(0, 0, W, H);
      const S = Math.max(0.6, Math.min(W / 1280, H / 720) * 1.05);
      this.S = S;
      const game = st.game, world = game.world, pl = world.player;
      if (st.scope) this.scope(W, H, S);
      this.box169 = N.approach(this.box169 || 0, st.cut ? 1 : 0, 1 / 60 * (st.cut ? 3.2 : 2.4));
      if (st.cut || this.box169 > 0.001) {
        const bh = H * 0.11 * N.smooth(0, 1, this.box169);
        g.fillStyle = '#000';
        g.fillRect(0, 0, W, bh);
        g.fillRect(0, H - bh, W, bh);
      }
      if (st.cut) {
        const c = game.cut;
        if (c && c.black > 0.001) { g.fillStyle = `rgba(0,0,0,${N.clamp(c.black, 0, 1)})`; g.fillRect(0, 0, W, H); }
        this.subs(game, W, H - H * 0.11 + 6 * S, S, true);
        this.title(game, W, H, S);
        if (c && c.t < 3.5 && c.i === 0) {
          g.globalAlpha = N.clamp(Math.min(c.t * 2, 3.5 - c.t), 0, 0.75);
          this.text('Пробел — дальше · X — пропустить сценку', W - 18 * S, H - 10 * S, { font: `bold ${12 * S | 0}px Arial`, align: 'right', fill: '#d8d8d8' });
          g.globalAlpha = 1;
        }
        this.fade(game, W, H);
        return;
      }
      if (st.hideHud) { this.fade(game, W, H); return; }
      if (this.hurtFlash > 0) { g.fillStyle = `rgba(200,0,0,${Math.min(0.35, this.hurtFlash)})`; g.fillRect(0, 0, W, H); }
      if (st.turret) this.turretSight(W, H, S, st.turret);
      else if (st.crosshair && !st.scope) this.crosshair(W, H, S, st.crossTarget, st.dot);
      this.topRight(game, W, S, st);
      this.radar(game, st, 22 * S, H - 22 * S, 92 * S);
      this.messages(game, W, H, S, st);
      this.fade(game, W, H);
    }

    fade(game, W, H) {
      const f = game.fade;
      if (!f) return;
      const a = f.t < f.dur ? f.t / f.dur : f.t < f.dur + (f.hold || 0.2) ? 1 : 1 - (f.t - f.dur - (f.hold || 0.2)) / f.dur;
      this.g.fillStyle = `rgba(0,0,0,${N.clamp(a, 0, 1)})`;
      this.g.fillRect(0, 0, W, H);
    }

    topRight(game, W, S, st) {
      const g = this.g;
      const world = game.world, pl = world.player;
      const x = W - 24 * S;
      let y = 18 * S;
      const boxW = 96 * S, boxH = 80 * S;
      const bx = x - boxW, by = y;
      g.save();
      g.fillStyle = 'rgba(10,14,30,0.42)';
      g.strokeStyle = '#e8e0d0';
      g.lineWidth = 3 * S;
      const r = 14 * S;
      g.beginPath();
      g.moveTo(bx + r, by); g.lineTo(bx + boxW - r, by); g.quadraticCurveTo(bx + boxW, by, bx + boxW, by + r); g.lineTo(bx + boxW, by + boxH - r); g.quadraticCurveTo(bx + boxW, by + boxH, bx + boxW - r, by + boxH); g.lineTo(bx + r, by + boxH); g.quadraticCurveTo(bx, by + boxH, bx, by + boxH - r); g.lineTo(bx, by + r); g.quadraticCurveTo(bx, by, bx + r, by); g.closePath();
      g.fill(); g.stroke();
      g.save();
      g.beginPath(); g.rect(bx, by, boxW, boxH); g.clip();
      g.fillStyle = '#1c4aa8'; g.fillRect(bx, by + boxH - 6 * S, boxW / 3, 6 * S);
      g.fillStyle = '#f0f0f0'; g.fillRect(bx + boxW / 3, by + boxH - 6 * S, boxW / 3, 6 * S);
      g.fillStyle = '#d82828'; g.fillRect(bx + boxW * 2 / 3, by + boxH - 6 * S, boxW / 3, 6 * S);
      g.restore();
      const wid = pl.weapon;
      g.save();
      g.translate(bx + 8 * S, by + 4 * S);
      weaponIcon(g, wid, boxW - 16 * S, boxH - 26 * S);
      g.restore();
      const slot = pl.weapons && pl.weapons[wid];
      const Wp = N.WEAPONS[wid];
      if (slot && !Wp.melee) {
        const txt = Wp.throw ? String(slot.ammo) : slot.clip + '-' + slot.ammo;
        this.text(txt, bx + boxW / 2, by + boxH - 10 * S, { font: `bold ${13 * S | 0}px Arial`, align: 'center', stroke: 3 * S, fill: pl.reloadT > 0 ? '#ffd060' : '#fff' });
      }
      g.restore();
      const cx = bx - 14 * S;
      const clockFont = `italic 900 ${34 * S | 0}px "Arial Black", Impact, Arial`;
      this.text(N.clock(world.clock), cx, by + 30 * S, { font: clockFont, align: 'right', stroke: 5 * S, fill: '#bfe4ff' });
      this.moneyShown = N.approach(this.moneyShown, game.state.money, Math.max(1, Math.abs(game.state.money - this.moneyShown) * 0.12));
      const money = N.pad(this.moneyShown, 8) + 'р';
      this.text(money, cx, by + 62 * S, { font: clockFont, align: 'right', stroke: 5 * S, fill: '#f2c83a' });
      let hy = by + 94 * S;
      const hpTxt = N.pad(Math.max(0, Math.ceil(pl.hp)), 3);
      const hpLow = pl.hp < 25 && Math.floor(world.t * 4) % 2;
      this.text(hpTxt, cx, hy, { font: `italic 900 ${26 * S | 0}px "Arial Black", Impact, Arial`, align: 'right', stroke: 4 * S, fill: hpLow ? '#fff' : '#ff6a8a' });
      this.heart(cx - 74 * S, hy - 10 * S, 11 * S, '#ff4a6a');
      if (pl.armor > 0) {
        const ax = cx - 110 * S;
        this.text(N.pad(Math.ceil(pl.armor), 3), ax, hy, { font: `italic 900 ${26 * S | 0}px "Arial Black", Impact, Arial`, align: 'right', stroke: 4 * S, fill: '#9ac8ff' });
        this.shield(ax - 74 * S, hy - 10 * S, 11 * S);
      }
      hy += 12 * S;
      const w = world.wanted;
      if (w.level > this.lastWanted) this.wantedFlashT = 2.5;
      this.lastWanted = w.level;
      if (this.wantedFlashT > 0) this.wantedFlashT -= 1 / 60;
      for (let i = 0; i < 6; i++) {
        const on = i < w.level;
        const flash = on && (w.flash || this.wantedFlashT > 0) && Math.floor(world.t * 5) % 2;
        this.beacon(cx - (5 - i) * 29 * S - 12 * S, hy + 14 * S, 11 * S, on && !flash, i, world.t);
      }
      hy += 44 * S;
      if (world.hidden && w.level > 0) {
        this.text('В КУСТАХ', cx, hy, { font: `italic 900 ${17 * S | 0}px "Arial Black", Impact, Arial`, align: 'right', stroke: 4 * S, fill: '#9ad070' });
        hy += 24 * S;
      }
      const T = world.park && world.park.tir;
      if (T && T.on) {
        const sl = pl.weapons && pl.weapons.izh38, left = sl ? sl.clip + sl.ammo : 0;
        this.text('ТИР · СБИТО ' + T.hits, cx, hy, { font: `italic 900 ${20 * S | 0}px "Arial Black", Impact, Arial`, align: 'right', stroke: 4 * S, fill: '#ffe0a0' });
        hy += 12 * S;
        for (let i = 0; i < T.P.shots; i++) {
          const x = cx - (T.P.shots - 1 - i) * 13 * S - 5 * S, on = i < left;
          g.fillStyle = on ? '#c8ccd2' : 'rgba(40,40,40,0.5)';
          g.strokeStyle = '#000'; g.lineWidth = 1.5;
          g.beginPath(); g.ellipse(x, hy + 6 * S, 4 * S, 5.5 * S, 0, 0, 7); g.fill(); g.stroke();
        }
        hy += 24 * S;
      }
      if (pl.ride && world.park) {
        const h = Math.max(0, pl.y - world.city.groundY(pl.x, pl.z));
        this.text('КОЛЕСО · ' + Math.round(h) + ' М', cx, hy, { font: `italic 900 ${20 * S | 0}px "Arial Black", Impact, Arial`, align: 'right', stroke: 4 * S, fill: '#bfe4ff' });
        hy += 26 * S;
      }
      const bar = game.mission && !game.cut ? game.mission.bar : null;
      if (bar) {
        const bw = 150 * S, bhh = 11 * S, bx = cx - bw;
        this.text(bar.label, cx, hy, { font: `italic 900 ${16 * S | 0}px "Arial Black", Impact, Arial`, align: 'right', stroke: 4 * S, fill: '#f0f0f0' });
        hy += 8 * S;
        g.fillStyle = 'rgba(0,0,0,0.65)';
        g.fillRect(bx - 2 * S, hy - 2 * S, bw + 4 * S, bhh + 4 * S);
        g.fillStyle = bar.col || '#f0c040';
        g.fillRect(bx, hy, bw * N.clamp(bar.k, 0, 1), bhh);
        hy += bhh + 18 * S;
      }
      const timer = game.mission && game.mission.timer !== null ? game.mission.timer : game.side && game.side.timer !== undefined && game.side.state !== 'find' ? game.side.timer : null;
      if (timer !== null && timer !== undefined && !game.cut) {
        const m = Math.max(0, Math.ceil(timer));
        this.text('ВРЕМЯ ' + N.pad(m / 60, 2) + ':' + N.pad(m % 60, 2), cx, hy, { font: `italic 900 ${20 * S | 0}px "Arial Black", Impact, Arial`, align: 'right', stroke: 4 * S, fill: m < 15 && Math.floor(world.t * 3) % 2 ? '#ff5050' : '#ffe0a0' });
        hy += 26 * S;
      }
      if (game.side) {
        const label = game.side.kind === 'taxi' ? 'ТАКСИ · СЕРИЯ ' + game.side.streak : 'МИЛИЦИЯ · УРОВЕНЬ ' + game.side.level;
        this.text(label, cx, hy, { font: `italic 900 ${17 * S | 0}px "Arial Black", Impact, Arial`, align: 'right', stroke: 4 * S, fill: '#f0f0f0' });
      }
    }

    heart(x, y, r, col) {
      const g = this.g;
      g.save();
      g.translate(x, y);
      g.fillStyle = col;
      g.strokeStyle = '#000';
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(0, r * 0.9);
      g.bezierCurveTo(-r * 1.6, -r * 0.2, -r * 0.8, -r * 1.3, 0, -r * 0.45);
      g.bezierCurveTo(r * 0.8, -r * 1.3, r * 1.6, -r * 0.2, 0, r * 0.9);
      g.fill();
      g.stroke();
      g.restore();
    }

    shield(x, y, r) {
      const g = this.g;
      g.save();
      g.translate(x, y);
      g.fillStyle = '#6aa0f0';
      g.strokeStyle = '#000';
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(0, -r); g.lineTo(r, -r * 0.6); g.lineTo(r * 0.8, r * 0.4); g.lineTo(0, r); g.lineTo(-r * 0.8, r * 0.4); g.lineTo(-r, -r * 0.6); g.closePath();
      g.fill(); g.stroke();
      g.restore();
    }

    beacon(x, y, r, on, i, t) { N.drawBeacon(this.g, x, y, r, on, i, t); }

    radar(game, st, x0, y1, R) {
      const g = this.g;
      const S = this.S;
      const world = game.world, pl = world.player;
      const map = this.ensureMap();
      const cx = x0 + R, cy = y1 - R;
      const op = this.city.outsidePos(pl.x, pl.z);
      const px = op.x, pz = op.z;
      const zoom = pl.veh ? N.clamp(0.6 - Math.abs(pl.veh.spd) * 0.006, 0.38, 0.6) : 0.7;
      const scale = R / (140 / zoom);
      const rot = st.camYaw;
      g.save();
      g.beginPath();
      g.arc(cx, cy, R, 0, Math.PI * 2);
      g.clip();
      g.fillStyle = '#4a6a3e';
      g.fillRect(cx - R, cy - R, R * 2, R * 2);
      g.translate(cx, cy);
      g.rotate(-rot);
      g.scale(scale / map.s, scale / map.s);
      g.imageSmoothingEnabled = true;
      g.drawImage(map, (map.ox - px) * map.s, (map.oz - pz) * map.s);
      g.restore();
      g.save();
      g.beginPath();
      g.arc(cx, cy, R, 0, Math.PI * 2);
      g.clip();
      const toScreen = (x, z) => {
        const dx = (x - px) * scale, dz = (z - pz) * scale;
        const c = Math.cos(-rot), s = Math.sin(-rot);
        return [cx + dx * c - dz * s, cy + dx * s + dz * c];
      };
      const clampR = (p, m) => { const dx = p[0] - cx, dy = p[1] - cy; const d = Math.hypot(dx, dy); if (d > R - m) return [cx + dx / d * (R - m), cy + dy / d * (R - m), true]; return [p[0], p[1], false]; };
      const icon = (p, kind, letter) => {
        const [sx, sy] = clampR(p, 9 * S);
        g.save();
        g.translate(sx, sy);
        g.strokeStyle = '#000';
        g.lineWidth = 1.6;
        if (kind === 'letter') {
          g.fillStyle = '#1a1a1a';
          g.beginPath(); g.arc(0, 0, 8 * S, 0, 7); g.fill();
          g.strokeStyle = '#ffd030'; g.lineWidth = 2; g.stroke();
          this.text(letter, 0, 1, { font: `bold ${11 * S | 0}px Arial`, align: 'center', base: 'middle', fill: '#ffd030' });
        } else if (ICONS[kind]) ICONS[kind](g, 6.5 * S);
        g.restore();
      };
      for (const ic of game.radarIcons()) icon(toScreen(ic.x, ic.z), ic.icon, ic.letter);
      const blink = Math.floor(world.t * 3) % 2;
      for (const b of game.blips()) {
        const col = N.MARKER_COL[b.type] || [255, 255, 255];
        const p = clampR(toScreen(b.x, b.z), 6 * S);
        g.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
        g.strokeStyle = '#000';
        g.lineWidth = 1.5;
        if (b.type === 'dest') { g.fillRect(p[0] - 5 * S, p[1] - 5 * S, 10 * S, 10 * S); g.strokeRect(p[0] - 5 * S, p[1] - 5 * S, 10 * S, 10 * S); }
        else { g.beginPath(); g.arc(p[0], p[1], (blink && b.type === 'enemy' ? 5 : 4.2) * S, 0, 7); g.fill(); g.stroke(); }
      }
      if (world.wanted.level > 0) {
        for (const v of world.vehs) {
          if (!(v.copCar || v.driver && v.driver.cop) || v.dead) continue;
          const p = toScreen(v.x, v.z);
          if (Math.hypot(p[0] - cx, p[1] - cy) > R) continue;
          g.fillStyle = blink ? '#3a78ff' : '#ff3a3a';
          g.fillRect(p[0] - 2.5 * S, p[1] - 2.5 * S, 5 * S, 5 * S);
        }
      }
      g.restore();
      g.save();
      g.translate(cx, cy);
      g.rotate((pl.veh ? pl.veh.yaw : pl.yaw) - rot);
      g.fillStyle = '#fff';
      g.strokeStyle = '#000';
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, -8 * S); g.lineTo(6 * S, 7 * S); g.lineTo(0, 3.5 * S); g.lineTo(-6 * S, 7 * S); g.closePath(); g.fill(); g.stroke();
      g.restore();
      g.save();
      g.lineWidth = 6 * S;
      g.strokeStyle = '#1a1a1c';
      g.beginPath(); g.arc(cx, cy, R + 2 * S, 0, 7); g.stroke();
      const segs = ['#f0f0f0', '#1c4aa8', '#d82828'];
      for (let i = 0; i < 3; i++) {
        g.strokeStyle = segs[i];
        g.lineWidth = 3 * S;
        g.beginPath(); g.arc(cx, cy, R + 2 * S, Math.PI * 0.5 + i * Math.PI * 2 / 3 + 0.05, Math.PI * 0.5 + (i + 1) * Math.PI * 2 / 3 - 0.05); g.stroke();
      }
      const na = -rot - Math.PI / 2;
      const nx = cx + Math.cos(na) * (R + 2 * S), ny = cy + Math.sin(na) * (R + 2 * S);
      g.fillStyle = '#111';
      g.beginPath(); g.arc(nx, ny, 10 * S, 0, 7); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      this.text('С', nx, ny + 1, { font: `bold ${13 * S | 0}px Arial`, align: 'center', base: 'middle', fill: '#fff' });
      g.restore();
    }

    crosshair(W, H, S, tgt, dot) {
      const g = this.g;
      const x = W / 2, y = H / 2;
      if (dot) {
        g.save();
        g.fillStyle = 'rgba(255,60,40,0.95)';
        g.strokeStyle = 'rgba(0,0,0,0.7)';
        g.lineWidth = 1.5;
        g.beginPath(); g.arc(x, y, 2.6 * S, 0, 7); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.55)';
        g.beginPath(); g.arc(x, y, 9 * S, 0, 7); g.stroke();
        g.restore();
        return;
      }
      g.save();
      g.strokeStyle = tgt ? '#ff3030' : 'rgba(255,255,255,0.9)';
      g.lineWidth = 2;
      const r = 10 * S;
      g.beginPath();
      g.moveTo(x - r * 1.6, y); g.lineTo(x - r * 0.5, y);
      g.moveTo(x + r * 0.5, y); g.lineTo(x + r * 1.6, y);
      g.moveTo(x, y - r * 1.6); g.lineTo(x, y - r * 0.5);
      g.moveTo(x, y + r * 0.5); g.lineTo(x, y + r * 1.6);
      g.stroke();
      if (tgt) {
        const hp = N.clamp(tgt.hp / tgt.maxHp, 0, 1);
        g.fillStyle = 'rgba(0,0,0,0.6)';
        g.fillRect(x - 20 * S, y + 22 * S, 40 * S, 5 * S);
        g.fillStyle = hp > 0.5 ? '#40d040' : hp > 0.25 ? '#e0c030' : '#e03030';
        g.fillRect(x - 20 * S, y + 22 * S, 40 * S * hp, 5 * S);
      }
      g.restore();
    }

    turretSight(W, H, S, t) {
      const g = this.g, x = W / 2, y = H / 2, r = 16 * S, busy = t.reload > 0;
      g.save();
      g.strokeStyle = 'rgba(255,255,255,0.85)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x - r * 2, y); g.lineTo(x - r * 0.6, y);
      g.moveTo(x + r * 0.6, y); g.lineTo(x + r * 2, y);
      g.moveTo(x, y + r * 0.6); g.lineTo(x, y + r * 1.6);
      g.stroke();
      if (busy) {
        g.strokeStyle = '#ffd060';
        g.lineWidth = 3 * S;
        g.beginPath();
        g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - t.reload));
        g.stroke();
      }
      if (t.gx !== null) {
        g.strokeStyle = busy ? 'rgba(255,208,96,0.9)' : '#7dff7d';
        g.lineWidth = 2;
        g.beginPath();
        g.arc(t.gx, t.gy, 6 * S, 0, Math.PI * 2);
        g.moveTo(t.gx - 11 * S, t.gy); g.lineTo(t.gx - 7 * S, t.gy);
        g.moveTo(t.gx + 7 * S, t.gy); g.lineTo(t.gx + 11 * S, t.gy);
        g.stroke();
      }
      const by = H - 46 * S;
      this.text(t.name + (busy ? ' · заряжание' : ' · готов'), x, by, { font: `bold ${14 * S | 0}px Arial`, align: 'center', stroke: 3 * S, fill: busy ? '#ffd060' : '#fff' });
      g.fillStyle = 'rgba(0,0,0,0.55)';
      g.fillRect(x - 60 * S, by + 8 * S, 120 * S, 6 * S);
      g.fillStyle = t.hp > 0.5 ? '#40d040' : t.hp > 0.25 ? '#e0c030' : '#e03030';
      g.fillRect(x - 60 * S, by + 8 * S, 120 * S * t.hp, 6 * S);
      g.restore();
    }

    scope(W, H, S) {
      const g = this.g;
      const r = Math.min(W, H) * 0.44;
      g.save();
      g.fillStyle = '#000';
      g.beginPath();
      g.rect(0, 0, W, H);
      g.arc(W / 2, H / 2, r, 0, Math.PI * 2, true);
      g.fill('evenodd');
      g.strokeStyle = 'rgba(10,10,10,0.9)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(W / 2 - r, H / 2); g.lineTo(W / 2 + r, H / 2);
      g.moveTo(W / 2, H / 2 - r * 0.3); g.lineTo(W / 2, H / 2 + r);
      g.stroke();
      g.lineWidth = 4;
      g.beginPath(); g.moveTo(W / 2 - r, H / 2); g.lineTo(W / 2 - r * 0.25, H / 2); g.moveTo(W / 2 + r * 0.25, H / 2); g.lineTo(W / 2 + r, H / 2); g.moveTo(W / 2, H / 2 + r * 0.25); g.lineTo(W / 2, H / 2 + r); g.stroke();
      g.fillStyle = 'rgba(200,30,30,0.9)';
      g.beginPath(); g.moveTo(W / 2, H / 2 - 2); g.lineTo(W / 2 - 7, H / 2 + 12); g.lineTo(W / 2 + 7, H / 2 + 12); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(10,10,10,0.9)';
      g.lineWidth = 1.5;
      for (let i = 1; i <= 4; i++) { g.beginPath(); g.moveTo(W / 2 - 6, H / 2 + r * 0.1 * i + 12); g.lineTo(W / 2 + 6, H / 2 + r * 0.1 * i + 12); g.stroke(); }
      for (let i = 1; i <= 4; i++) { g.beginPath(); g.moveTo(W / 2 - r * 0.08 * i - 12, H / 2 - 4); g.lineTo(W / 2 - r * 0.08 * i - 12, H / 2 + 4); g.moveTo(W / 2 + r * 0.08 * i + 12, H / 2 - 4); g.lineTo(W / 2 + r * 0.08 * i + 12, H / 2 + 4); g.stroke(); }
      g.restore();
    }

    subs(game, W, y, S, cut) {
      const s = game.subs[0];
      if (!s || (!cut && game.settings.subtitles === false)) return;
      const g = this.g;
      const ch = N.CHARS[s.who];
      const name = (ch ? ch.name : s.who && !N.CHARS[s.who] && s.who.length > 1 && s.who[0] === s.who[0].toUpperCase() ? s.who : '') + (s.via === 'radio' ? ' (рация)' : s.via === 'phone' ? ' (телефон)' : s.via === 'pa' ? ' (динамик)' : '');
      g.font = `bold ${19 * S | 0}px Arial`;
      const lines = this.wrap((name ? name + ': ' : '') + s.text, W * 0.7);
      let yy = y + 20 * S;
      const nameCol = (ch && ch.col) || '#e0e0e0';
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (i === 0 && name && l.startsWith(name + ':')) {
          const w0 = g.measureText(l).width;
          const nx = W / 2 - w0 / 2;
          this.text(name + ':', nx, yy, { font: `bold ${19 * S | 0}px Arial`, stroke: 4 * S, fill: nameCol });
          const nw = g.measureText(name + ': ').width;
          this.text(l.slice(name.length + 2), nx + nw, yy, { font: `bold ${19 * S | 0}px Arial`, stroke: 4 * S, fill: '#fff' });
        } else this.text(l, W / 2, yy, { font: `bold ${19 * S | 0}px Arial`, align: 'center', stroke: 4 * S, fill: '#fff' });
        yy += 24 * S;
      }
    }

    title(game, W, H, S) {
      const t = game.msg.title;
      if (!t) return;
      const a = Math.min(1, t.t / 0.6);
      this.g.globalAlpha = a;
      this.text(t.text, W / 2, H * (t.cut ? 0.2 : 0.68), { font: `italic 900 ${38 * S | 0}px "Arial Black", Impact, Arial`, align: 'center', stroke: 6 * S, fill: '#f2c83a' });
      this.g.globalAlpha = 1;
    }

    box(x, y, w, h, alpha) {
      const g = this.g;
      g.fillStyle = `rgba(0,0,0,${alpha || 0.62})`;
      const r = 8 * this.S;
      g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.fill();
    }

    messages(game, W, H, S, st) {
      const g = this.g;
      const m = game.msg;
      let ly = 20 * S;
      if (m.help) {
        g.font = `bold ${17 * S | 0}px Arial`;
        const lines = this.wrap(m.help.text, 330 * S);
        const h = lines.length * 22 * S + 16 * S;
        g.globalAlpha = Math.min(1, m.help.t * 2);
        this.box(20 * S, ly, 360 * S, h);
        lines.forEach((l, i) => this.text(l, 32 * S, ly + 26 * S + i * 22 * S, { font: `bold ${17 * S | 0}px Arial`, fill: '#f0f0f0' }));
        g.globalAlpha = 1;
        ly += h + 10 * S;
      }
      if (m.pager.length) {
        const p = m.pager[0];
        const pw = 300 * S, ph = 56 * S;
        const x = 20 * S, y = ly;
        g.fillStyle = '#2a2c30';
        g.fillRect(x, y, pw, ph);
        g.strokeStyle = '#111'; g.lineWidth = 2; g.strokeRect(x, y, pw, ph);
        g.fillStyle = '#9ac080';
        g.fillRect(x + 12 * S, y + 10 * S, pw - 50 * S, ph - 20 * S);
        g.fillStyle = '#5a5c60';
        g.beginPath(); g.arc(x + pw - 20 * S, y + ph / 2, 9 * S, 0, 7); g.fill();
        g.save();
        g.beginPath(); g.rect(x + 14 * S, y + 10 * S, pw - 54 * S, ph - 20 * S); g.clip();
        g.font = `bold ${16 * S | 0}px "Courier New", monospace`;
        const tw = g.measureText(p.text).width;
        const off = Math.max(0, p.t - 1) * 70 * S;
        const xx = x + 16 * S + (pw - 58 * S) - Math.min(off, tw + pw - 58 * S);
        g.fillStyle = '#1a2a14';
        g.textBaseline = 'middle';
        g.fillText(p.text, xx, y + ph / 2 + 1);
        g.restore();
        this.text('ПЕЙДЖЕР', x + pw - 20 * S, y + ph + 12 * S, { font: `bold ${10 * S | 0}px Arial`, align: 'center', fill: '#ddd', stroke: 3 });
      }
      this.subs(game, W, H * 0.78, S, false);
      if (m.obj && !game.subs.length) {
        g.font = `bold ${19 * S | 0}px Arial`;
        const lines = this.wrap(m.obj.text, W * 0.62);
        lines.forEach((l, i) => this.text(l, W / 2, H * 0.84 + i * 24 * S, { font: `bold ${19 * S | 0}px Arial`, align: 'center', stroke: 4 * S, fill: '#fff' }));
      }
      if (m.big) {
        const b = m.big;
        const a = Math.min(1, b.t * 2, (b.t0 - b.t) * 4 + 0.2);
        g.globalAlpha = N.clamp(a, 0, 1);
        const style = b.style;
        const col = style === 'wasted' ? '#e02020' : style === 'busted' ? '#4a8aff' : style === 'fail' ? '#e04040' : style === 'money' ? '#58e058' : style === 'side' ? '#f0f0f0' : '#f2c83a';
        const big = style === 'wasted' || style === 'busted';
        this.text(b.title, W / 2, H * (big ? 0.5 : 0.38), { font: `italic 900 ${(big ? 64 : 40) * S | 0}px "Arial Black", Impact, Arial`, align: 'center', stroke: (big ? 8 : 6) * S, fill: col });
        if (b.sub) this.text(b.sub, W / 2, H * (big ? 0.5 : 0.38) + 40 * S, { font: `italic 900 ${24 * S | 0}px "Arial Black", Impact, Arial`, align: 'center', stroke: 5 * S, fill: style === 'fail' ? '#fff' : '#58e058' });
        g.globalAlpha = 1;
      }
      this.title(game, W, H, S);
      let by = H - 26 * S;
      if (m.zone) {
        const a = Math.min(1, m.zone.t);
        g.globalAlpha = a;
        this.text(m.zone.text, W - 26 * S, by, { font: `italic 900 ${30 * S | 0}px "Arial Black", Impact, Arial`, align: 'right', stroke: 5 * S, fill: '#8ad8ff' });
        g.globalAlpha = 1;
        by -= 38 * S;
      }
      if (m.veh) {
        g.globalAlpha = Math.min(1, m.veh.t);
        this.text(m.veh.text, W - 26 * S, by, { font: `italic 900 ${26 * S | 0}px "Arial Black", Impact, Arial`, align: 'right', stroke: 5 * S, fill: '#7ae07a' });
        g.globalAlpha = 1;
      }
      if (m.radio) {
        g.globalAlpha = Math.min(1, m.radio.t);
        this.text(m.radio.text, W / 2, 34 * S, { font: `italic 900 ${26 * S | 0}px "Arial Black", Impact, Arial`, align: 'center', stroke: 5 * S, fill: '#ffb030' });
        if (m.radio.sub) this.text(m.radio.sub, W / 2, 56 * S, { font: `bold ${14 * S | 0}px Arial`, align: 'center', stroke: 3 * S, fill: '#f0f0f0' });
        g.globalAlpha = 1;
      }
      if (st.prompt) {
        g.font = `bold ${16 * S | 0}px Arial`;
        const w = g.measureText(st.prompt).width + 24 * S;
        this.box(W / 2 - w / 2, H * 0.62, w, 30 * S, 0.5);
        this.text(st.prompt, W / 2, H * 0.62 + 20 * S, { font: `bold ${16 * S | 0}px Arial`, align: 'center', fill: '#fff' });
      }
      if (st.fps) this.text(st.fps, 10, H - 8, { font: '11px monospace', fill: '#ff0' });
      if (game.shop) this.shop(game, W, H, S);
    }

    shop(game, W, H, S) {
      const g = this.g;
      const s = game.shop;
      const w = 460 * S, rowH = 30 * S;
      const h = (s.items.length + 3) * rowH + 30 * S;
      const x = W / 2 - w / 2, y = H / 2 - h / 2;
      this.box(x, y, w, h, 0.82);
      this.text(s.title, W / 2, y + 34 * S, { font: `italic 900 ${24 * S | 0}px "Arial Black", Impact, Arial`, align: 'center', fill: '#f2c83a', stroke: 4 * S });
      s.items.forEach((it, i) => {
        const yy = y + 56 * S + i * rowH;
        if (i === s.sel) { g.fillStyle = 'rgba(255,200,60,0.25)'; g.fillRect(x + 10 * S, yy - 4 * S, w - 20 * S, rowH); }
        const dis = it.owned && it.kind !== 'ammo';
        this.text(it.name + (it.note ? ' — ' + it.note : ''), x + 22 * S, yy + 17 * S, { font: `bold ${16 * S | 0}px Arial`, fill: dis ? '#888' : '#fff' });
        this.text(dis ? 'есть' : N.money(it.price), x + w - 22 * S, yy + 17 * S, { font: `bold ${16 * S | 0}px Arial`, align: 'right', fill: game.state.money >= it.price ? '#7ae07a' : '#e06060' });
      });
      const fy = y + h - 22 * S;
      this.text(s.msg || 'Стрелки — выбор · Enter — купить · Esc — выйти', W / 2, fy, { font: `${14 * S | 0}px Arial`, align: 'center', fill: '#ccc' });
      this.text('У тебя: ' + N.money(game.state.money), W / 2, fy - 22 * S, { font: `bold ${15 * S | 0}px Arial`, align: 'center', fill: '#f2c83a' });
    }
  }

  N.Hud = Hud;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
