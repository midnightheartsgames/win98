(function (L) {
  'use strict';
  const D = L.DATA, { CHAMPS, ITEMS, SPELLS, STAT_NAMES, PCT_STATS } = D;
  const W = 800, H = 600, HUD_Y = 464, VIEW_H = HUD_Y, Z = 0.3;
  const FONT = 'Tahoma, "MS Sans Serif", Arial, sans-serif', SERIF = '"Times New Roman", Georgia, serif';
  const GOLD = '#e8c060', GOLD_D = '#8a6a28';
  const TEAMC = ['#4a8aff', '#ff4a3a'];
  const AURA = { snow: '#e8f8ff', stars: '#fff2a0', embers: '#ff8a30', sparks: '#ff5a6a', sparkle: '#ffe890' };

  class Renderer {
    constructor(canvas, ui) {
      this.cv = canvas; this.ctx = canvas.getContext('2d'); this.ui = ui;
      this.fx = []; this.floats = []; this.hits = []; this.cam = { x: 0, y: 0 };
      this.fogCv = document.createElement('canvas'); this.fogCv.width = L.VIS.VIS_N; this.fogCv.height = L.VIS.VIS_N;
      this.fogCtx = this.fogCv.getContext('2d'); this.fogImg = this.fogCtx.createImageData(L.VIS.VIS_N, L.VIS.VIS_N);
      this.miniFog = document.createElement('canvas'); this.miniFog.width = this.miniFog.height = L.VIS.VIS_N;
      this.t = 0;
    }
    setAssets(A) { this.A = A; }
    get S() { return this.ui.S; }
    L(o) { return o ? (o[this.ui.lang] || o.en) : ''; }

    text(s, x, y, o = {}) {
      const c = this.ctx; c.font = `${o.bold ? 'bold ' : ''}${o.size || 11}px ${o.serif ? SERIF : FONT}`; c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic';
      if (o.shadow !== false) { c.fillStyle = o.shadowColor || 'rgba(0,0,0,0.85)'; c.fillText(s, x + 1, y + 1); }
      c.fillStyle = o.color || '#fff'; c.fillText(s, x, y);
      return c.measureText(s).width;
    }
    wrap(s, x, y, w, o = {}) {
      const c = this.ctx; c.font = `${o.bold ? 'bold ' : ''}${o.size || 11}px ${FONT}`;
      const words = String(s).split(' '); let line = '', yy = y; const lh = o.lh || (o.size || 11) + 3;
      for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (c.measureText(t).width > w && line) { this.text(line, x, yy, o); line = wd; yy += lh; } else line = t; }
      if (line) { this.text(line, x, yy, o); yy += lh; }
      return yy;
    }
    wrapHeight(s, w, size = 11) {
      const c = this.ctx; c.font = `${size}px ${FONT}`; const words = String(s).split(' '); let line = '', n = 0;
      for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (c.measureText(t).width > w && line) { n++; line = wd; } else line = t; }
      return (n + (line ? 1 : 0)) * (size + 3);
    }
    panel(x, y, w, h, o = {}) {
      const c = this.ctx;
      const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, o.top || '#23283a'); g.addColorStop(1, o.bottom || '#0d0f18');
      c.fillStyle = g; c.fillRect(x, y, w, h);
      c.fillStyle = GOLD_D; c.fillRect(x, y, w, 2); c.fillRect(x, y + h - 2, w, 2); c.fillRect(x, y, 2, h); c.fillRect(x + w - 2, y, 2, h);
      c.fillStyle = GOLD; c.fillRect(x + 2, y + 2, w - 4, 1); c.fillRect(x + 2, y + 2, 1, h - 4);
      c.fillStyle = '#3a2a10'; c.fillRect(x + 2, y + h - 3, w - 4, 1); c.fillRect(x + w - 3, y + 2, 1, h - 4);
      if (o.title) { this.text(o.title, x + w / 2, y + 17, { align: 'center', size: 14, bold: true, serif: true, color: GOLD }); c.fillStyle = GOLD_D; c.fillRect(x + 10, y + 24, w - 20, 1); }
    }
    button(x, y, w, h, label, id, o = {}) {
      const c = this.ctx, hot = this.ui.hover && this.ui.hover.id === id && (o.data === undefined || this.ui.hover.data === o.data), dis = o.disabled;
      const g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, dis ? '#3a3a40' : o.active ? '#6a5020' : hot ? '#4a5a8a' : '#2e3a5e'); g.addColorStop(1, dis ? '#202024' : o.active ? '#3a2a08' : hot ? '#1e2a4a' : '#141a2e');
      c.fillStyle = g; c.fillRect(x, y, w, h);
      c.fillStyle = hot && !dis ? GOLD : GOLD_D; c.fillRect(x, y, w, 1); c.fillRect(x, y + h - 1, w, 1); c.fillRect(x, y, 1, h); c.fillRect(x + w - 1, y, 1, h);
      this.text(label, x + w / 2, y + h / 2 + 1, { align: 'center', base: 'middle', size: o.size || 12, bold: true, color: dis ? '#777' : (o.active ? '#fff0c0' : (hot ? '#fff' : '#e8dcc0')) });
      if (!dis) this.hit(x, y, w, h, id, o.data, o.tip);
    }
    hit(x, y, w, h, id, data, tip) { this.hits.push({ x, y, w, h, id, data, tip }); }
    bar(x, y, w, h, frac, col, back = '#200808') { const c = this.ctx; c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = back; c.fillRect(x, y, w, h); c.fillStyle = col; c.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, h); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, 1); }
    icon(img, x, y, s) { if (img) this.ctx.drawImage(img, x, y, s, s); }
    frame(x, y, s, col = GOLD_D) { const c = this.ctx; c.strokeStyle = col; c.lineWidth = 1; c.strokeRect(x - 0.5, y - 0.5, s + 1, s + 1); }

    sx(x) { return (x - this.cam.x) * Z; }
    sy(y) { return (y - this.cam.y) * Z; }
    toWorld(px, py) { return [px / Z + this.cam.x, py / Z + this.cam.y]; }
    centerOn(x, y) { this.cam.x = Math.max(0, Math.min(D.MAP - W / Z, x - W / Z / 2)); this.cam.y = Math.max(0, Math.min(D.MAP - VIEW_H / Z, y - VIEW_H / Z / 2)); }

    addFx(g, e) {
      const u = e.unit ? g.units.find(x => x.id === e.unit) : null;
      const x = e.x != null ? e.x : u ? u.x : 0, y = e.y != null ? e.y : u ? u.y : 0;
      const col = e.color;
      const push = o => this.fx.push(Object.assign({ t: 0, x, y }, o));
      switch (e.kind) {
        case 'boom': push({ type: 'ring', life: e.big ? 0.7 : 0.45, r: e.r || 150, color: col || '#ffa030', fill: true }); for (let i = 0; i < (e.big ? 26 : 12); i++) push({ type: 'spark', life: 0.5 + Math.random() * 0.4, vx: (Math.random() - 0.5) * 900, vy: (Math.random() - 0.5) * 900, color: i % 2 ? '#ffe060' : (col || '#ff6020') }); break;
        case 'quake': push({ type: 'ring', life: 0.6, r: e.r, color: '#d0b080', fill: true }); for (let i = 0; i < 14; i++) push({ type: 'spark', life: 0.6, vx: (Math.random() - 0.5) * 700, vy: (Math.random() - 0.5) * 500, color: '#8a6a48', size: 3 }); break;
        case 'cone': push({ type: 'cone', life: 0.45, dx: e.dx, dy: e.dy, r: e.r, a: e.a, color: col }); break;
        case 'flash': push({ type: 'ring', life: 0.35, r: 120, color: col || '#ffe060', fill: true }); break;
        case 'heal': push({ type: 'rise', life: 0.8, color: '#60ff60', unit: e.unit }); break;
        case 'ignite': case 'exhaust': case 'smite': push({ type: 'ring', life: 0.4, r: 90, color: e.kind === 'smite' ? '#ffd040' : e.kind === 'ignite' ? '#ff6020' : '#ffa040', fill: true, unit: e.unit }); break;
        case 'barrier': case 'shield': push({ type: 'bubble', life: 0.6, color: col || '#ffff80', unit: e.unit }); break;
        case 'spellshield': push({ type: 'bubble', life: 0.5, color: '#40e0e0', unit: e.unit }); break;
        case 'spark': case 'slash': push({ type: 'slash', life: 0.25, color: col || '#ffffff' }); break;
        case 'poof': case 'sparkle': for (let i = 0; i < 12; i++) push({ type: 'spark', life: 0.6, vx: (Math.random() - 0.5) * 400, vy: -Math.random() * 400, color: col || '#ffffff', unit: e.kind === 'sparkle' ? e.unit : null }); break;
        case 'grow': push({ type: 'ring', life: 0.6, r: 350, color: '#80ff80' }); break;
        case 'charge': push({ type: 'charge', life: e.t || 0.6, color: col, unit: e.unit }); break;
        case 'sword': push({ type: 'sword', life: 0.5, unit: e.unit }); break;
        case 'reveal': push({ type: 'ring', life: 1.5, r: e.r, color: '#a0e0ff' }); break;
        case 'shatter': push({ type: 'ring', life: 0.5, r: e.r, color: '#c0f0ff', fill: true }); for (let i = 0; i < 16; i++) push({ type: 'spark', life: 0.6, vx: (Math.random() - 0.5) * 800, vy: (Math.random() - 0.5) * 800, color: '#e0ffff' }); break;
        case 'cloud': push({ type: 'cloud', life: 2.5, r: e.r, color: col }); break;
        case 'prison': push({ type: 'prison', life: e.t || 1, unit: e.unit }); break;
        case 'roar': push({ type: 'ring', life: 0.5, r: e.r, color: '#80ff80' }); break;
        case 'collapse': for (let i = 0; i < 30; i++) push({ type: 'spark', life: 1 + Math.random(), vx: (Math.random() - 0.5) * 600, vy: -Math.random() * 600, color: i % 3 ? '#8a8a90' : '#ffa040', size: 4 }); push({ type: 'ring', life: 1, r: e.r * 2, color: '#ffa040', fill: true }); break;
        case 'laser': push({ type: 'laser', life: 0.2, tx: e.tx, ty: e.ty }); break;
        case 'recall': push({ type: 'ring', life: 0.5, r: 150, color: '#80c0ff', fill: true }); break;
        case 'revive': push({ type: 'ring', life: 1, r: 200, color: '#ffe0a0', fill: true }); break;
      }
    }
    addFloat(text, x, y, color, size = 11, life = 0.9) { if (this.floats.length > 80) this.floats.shift(); this.floats.push({ text, x, y, color, size, life, t: 0 }); }

    draw(g, alpha, dt) {
      const c = this.ctx; this.t += dt; this.hits = [];
      c.imageSmoothingEnabled = false;
      const team = this.ui.viewTeam;
      const T = this.A.terrain, ts = T.scale;
      c.fillStyle = '#0a1a0a'; c.fillRect(0, 0, W, VIEW_H);
      c.drawImage(T.canvas, this.cam.x * ts, this.cam.y * ts, W / Z * ts, VIEW_H / Z * ts, 0, 0, W, VIEW_H);
      c.save(); c.beginPath(); c.rect(0, 0, W, VIEW_H); c.clip();
      for (let t = 0; t < 2; t++) { const f = g.map.fountain[t]; const im = this.A.prop['fountain' + t]; c.drawImage(im, this.sx(f[0]) - 80, this.sy(f[1]) - 64); const sh = this.A.prop['shop' + t]; c.drawImage(sh, this.sx(f[0] + (t ? -650 : 650)) - 48, this.sy(f[1] + (t ? 250 : -250)) - 76); }
      this.drawGroundFx(g);
      this.ui.drawIndicator(this);
      const vx0 = this.cam.x - 400, vx1 = this.cam.x + W / Z + 400, vy0 = this.cam.y - 300, vy1 = this.cam.y + VIEW_H / Z + 500;
      const list = [];
      for (const u of g.units) {
        if (u.x < vx0 || u.x > vx1 || u.y < vy0 || u.y > vy1) continue;
        if (u.dead && !u.structure && !(u.kind !== 'champ' && g.time - u.deathT < 0.8)) continue;
        if (u.kind === 'champ' && u.dead) continue;
        if (!this.ui.spectator) {
          if (!u.structure && u.team !== team && !u.vis[team]) continue;
          if ((u.kind === 'trap' || u.kind === 'ward') && u.team !== team && !u.vis[team]) continue;
        }
        list.push(u);
      }
      const ix = u => u.px + (u.x - u.px) * alpha, iy = u => u.py + (u.y - u.py) * alpha;
      list.sort((a, b) => iy(a) - iy(b));
      for (const u of list) this.drawUnit(g, u, ix(u), iy(u), team);
      for (const p of g.projectiles) this.drawProjectile(g, p, team);
      this.drawFx(dt, g);
      if (!this.ui.spectator) this.drawFog(g, team);
      for (const u of list) if (!u.dead && u.kind !== 'trap') this.drawBars(g, u, ix(u), iy(u), team);
      for (const f of this.floats) { f.t += dt; const k = f.t / f.life; this.ctx.globalAlpha = Math.max(0, 1 - k * k); this.text(f.text, this.sx(f.x), this.sy(f.y) - 50 - k * 30, { align: 'center', size: f.size, bold: true, color: f.color }); }
      this.ctx.globalAlpha = 1; this.floats = this.floats.filter(f => f.t < f.life);
      const m = this.ui.clickMark; if (m && m.t < 0.5) { m.t += dt; c.strokeStyle = m.attack ? '#ff4030' : '#40ff60'; c.lineWidth = 2; c.beginPath(); c.ellipse(this.sx(m.x), this.sy(m.y), 14 * (1 - m.t), 7 * (1 - m.t), 0, 0, 6.3); c.stroke(); }
      c.restore();
    }
    drawGroundFx(g) {
      const c = this.ctx;
      for (const u of g.units) {
        if (u.dead) continue;
        if (u.kind === 'tower' && this.ui.player && !this.ui.player.dead && u.team !== this.ui.player.team && Math.hypot(u.x - this.ui.player.x, u.y - this.ui.player.y) < 1300) {
          c.strokeStyle = u.target === this.ui.player ? 'rgba(255,40,30,0.8)' : 'rgba(255,120,80,0.35)'; c.lineWidth = 2; c.setLineDash([6, 6]);
          c.beginPath(); c.ellipse(this.sx(u.x), this.sy(u.y), (u.st.range + 30) * Z, (u.st.range + 30) * Z, 0, 0, 6.3); c.stroke(); c.setLineDash([]);
        }
        if (u.kind === 'champ' && u.k.spinT > 0) { c.fillStyle = 'rgba(220,230,255,0.25)'; c.beginPath(); c.arc(this.sx(u.x), this.sy(u.y), 330 * Z, 0, 6.3); c.fill(); }
        const wg = u.kind === 'champ' && g.tagged(u, 'wgAura'); if (wg) { c.strokeStyle = 'rgba(128,255,128,0.4)'; c.lineWidth = 2; c.beginPath(); c.arc(this.sx(u.x), this.sy(u.y), 350 * Z, 0, 6.3); c.stroke(); }
        if (u.kind === 'pet' && u.aura) { c.fillStyle = 'rgba(255,120,30,0.15)'; c.beginPath(); c.arc(this.sx(u.x), this.sy(u.y), 350 * Z, 0, 6.3); c.fill(); }
      }
    }
    lookId(x) { return typeof x === 'string' ? (x.includes('.') ? x : L.SKINS.baseId(x)) : (x && x.skinId) || L.SKINS.baseId(x ? x.cid : 'jinx'); }
    face(x, s) { return L.Art.icon(this.lookId(x), s); }
    champSet(u) { return L.Art.sprites(this.lookId(u), u.cid === 'jinx' && u.k.rocket ? { rocket: true } : null); }
    unitAnim(u) {
      if (u.anim.cast > 0) return ['cast', u.anim.cast > 0.18 ? 0 : 1];
      if (u.windup > 0) return ['atk', 0];
      if (u.anim.atk > 0) return ['atk', u.anim.atk > 0.1 ? 1 : 2];
      if (u.anim.moving || Math.hypot(u.x - u.px, u.y - u.py) > 0.5) return ['walk', Math.floor(this.t * 12 + u.id) % 6];
      return ['idle', Math.floor(this.t * 2.5 + u.id * 0.37) % 4];
    }
    drawUnit(g, u, x, y, team) {
      const c = this.ctx, sx = Math.round(this.sx(x)), sy = Math.round(this.sy(y)), A = this.A;
      const hover = this.ui.hoverUnit === u, sel = this.ui.selected === u;
      if (u.structure) {
        const im = u.kind === 'tower' ? A.tower[u.team][u.dead ? 1 : 0] : u.kind === 'inhib' ? A.inhib[u.team][u.dead ? 1 : 0] : A.nexus[u.team][u.dead ? 1 : 0];
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(sx, sy, im.width * 0.38, im.width * 0.14, 0, 0, 6.3); c.fill();
        if (hover && !u.dead) this.ring(sx, sy, u.r * Z + 6, u.team === team ? '#60ff60' : '#ff4040');
        c.drawImage(im, sx - im.width / 2, sy - im.height + 6);
        if (!u.dead && g.isStructureVulnerable(u) === false && u.team !== team) { c.globalAlpha = 0.35; c.fillStyle = '#80c0ff'; c.beginPath(); c.ellipse(sx, sy - im.height * 0.5, im.width * 0.45, im.height * 0.5, 0, 0, 6.3); c.fill(); c.globalAlpha = 1; }
        return;
      }
      const dying = u.dead; if (dying) c.globalAlpha = Math.max(0, 1 - (g.time - u.deathT) / 0.8);
      const inBrush = g.brushOf(u) && u.team === team, stealth = u.stealth || g.tagged(u, 'camo');
      if ((inBrush || (stealth && u.team === team)) && !dying) c.globalAlpha = 0.55;
      const z = (u.z || 0) * Z;
      const sr = Math.max(8, u.r * Z * 0.9);
      c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(sx, sy, sr, sr * 0.45, 0, 0, 6.3); c.fill();
      if (u.kind === 'champ') { c.strokeStyle = u === this.ui.player ? '#ffe060' : TEAMC[u.team]; c.lineWidth = 1.5; c.beginPath(); c.ellipse(sx, sy, sr + 2, (sr + 2) * 0.45, 0, 0, 6.3); c.stroke(); }
      if (hover || sel) this.ring(sx, sy, sr + 4, u.team === team ? '#60ff60' : u.team === 2 ? '#ffe060' : '#ff4040');
      let img = null, ox = 0, oy = 0, top = 30;
      const face = u.face >= 0 ? 0 : 1;
      if (u.kind === 'champ') {
        if (g.has(u, 'poly')) { this.drawCritter(sx, sy - z); c.globalAlpha = 1; return; }
        const set = this.champSet(u), grow = g.tagged(u, 'wildGrowth') ? 1.5 : 1;
        top = set.top * grow;
        if (g.has(u, 'stasis')) { const f = set.idle[0][face]; c.globalAlpha = 1; c.drawImage(f.cv, sx - f.ox, sy - f.oy - z); c.fillStyle = 'rgba(255,215,60,0.55)'; c.fillRect(sx - 16, sy - set.top, 32, set.top); }
        else {
          const [an, fr] = this.unitAnim(u), list = set[an], f = list[fr % list.length][face];
          if (grow > 1) c.drawImage(f.cv, sx - f.ox * grow, sy - f.oy * grow - z, f.cv.width * grow, f.cv.height * grow);
          else c.drawImage(f.cv, sx - f.ox, sy - f.oy - z);
        }
        if (!dying && u.lookFx && u.lookFx.aura) this.drawAura(u, sx, sy - z, top);
      } else if (u.kind === 'minion') {
        const s = A.minion[u.team][u.mtype]; const moving = Math.hypot(u.x - u.px, u.y - u.py) > 0.3;
        const fr = u.anim.atk > 0 ? 2 + (u.windup > 0 ? 0 : 1) : moving ? Math.floor(this.t * 6 + u.id) % 2 : 0;
        img = s.frames[fr % s.frames.length][face]; ox = s.ox; oy = s.oy;
      } else if (u.kind === 'monster') {
        const s = A.monster[u.mtype]; img = s.frames[(u.anim.atk > 0 ? 1 : 0)][face]; ox = s.ox; oy = s.oy; top = Math.min(110, 30 + u.r * 0.35);
      } else if (u.kind === 'pet') {
        const s = L.Art.pets(this.lookId(u.ownerRef || 'annie')).tibbers || L.Art.pets('annie.classic').tibbers;
        const moving = Math.hypot(u.x - u.px, u.y - u.py) > 0.3, fr = u.anim.atk > 0 ? 2 : moving ? (Math.floor(this.t * 6) % 2 ? 1 : 3) : 0;
        const f = s.frames[fr][face]; c.drawImage(f.cv, sx - f.ox, sy - f.oy - z); top = 76;
      } else if (u.kind === 'ward') { img = A.prop[u.pink ? 'pinkWard' : 'ward']; ox = 10; oy = 30; }
      else if (u.kind === 'trap') { img = A.prop[u.look] || A.prop.shroom; ox = img.width / 2; oy = img.height - 2; if (u.team === team && u.stealth) c.globalAlpha = 0.6; }
      if (img) c.drawImage(img, sx - ox, sy - oy - z);
      c.globalAlpha = 1;
      if (!dying) {
        const hy = sy - top - z;
        if (g.has(u, 'stun') || g.has(u, 'knockup')) this.stars(sx, hy - 2);
        if (g.has(u, 'root')) { c.strokeStyle = '#60c0ff'; c.lineWidth = 2; c.beginPath(); c.ellipse(sx, sy, 16, 6, 0, 0, 6.3); c.stroke(); }
        if (g.has(u, 'silence')) this.text('…', sx + 12, hy + 4, { size: 14, bold: true, color: '#ffe060' });
        if (g.has(u, 'blind')) this.text('?', sx, hy, { size: 13, bold: true, color: '#a0ff60', align: 'center' });
        if (u.shields.length) { c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1; c.beginPath(); c.ellipse(sx, sy - top * 0.45 - z, 20, top * 0.55, 0, 0, 6.3); c.stroke(); }
        if (g.has(u, 'recall')) { const r = g.has(u, 'recall'); c.strokeStyle = '#80c0ff'; c.lineWidth = 2; c.beginPath(); c.ellipse(sx, sy, 22, 10, 0, 0, 6.3); c.stroke(); c.fillStyle = 'rgba(120,180,255,0.25)'; c.fillRect(sx - 16, sy - top * (1 - r.t / r.max), 32, top * (1 - r.t / r.max)); }
        if (g.tagged(u, 'moltenShield')) { c.fillStyle = 'rgba(255,100,20,0.25)'; c.beginPath(); c.ellipse(sx, sy - top * 0.45, 20, top * 0.5, 0, 0, 6.3); c.fill(); }
        if (g.tagged(u, 'highlander')) { c.fillStyle = 'rgba(120,255,80,0.2)'; c.beginPath(); c.ellipse(sx, sy - top * 0.45, 18, top * 0.5, 0, 0, 6.3); c.fill(); }
        if (g.tagged(u, 'meditate')) { c.strokeStyle = 'rgba(160,255,120,0.7)'; c.lineWidth = 1; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(sx, sy - top * 0.4, 12 + ((this.t * 20 + i * 8) % 24), 0, 6.3); c.stroke(); } }
        if (g.tagged(u, 'redBuff')) { c.fillStyle = 'rgba(255,60,20,0.8)'; c.fillRect(sx - 2 + Math.sin(this.t * 7) * 8, sy - top * 0.55 + Math.cos(this.t * 5) * 10, 2, 2); }
        if (g.tagged(u, 'blueBuff')) { c.fillStyle = 'rgba(80,160,255,0.9)'; c.fillRect(sx - 2 + Math.cos(this.t * 6) * 9, sy - top * 0.55 + Math.sin(this.t * 4) * 10, 2, 2); }
        if (u.kind === 'champ' && u.cid === 'lulu') { const pix = L.Art.pets(this.lookId(u)).pix; if (pix) { const im = pix[Math.floor(this.t * 8) % 2]; c.drawImage(im, Math.round(sx + Math.cos(this.t * 2.2) * 20 - im.width / 2), Math.round(sy - top * 0.8 + Math.sin(this.t * 3.1) * 5 - im.height / 2 - z)); } }
        if (u.kind === 'champ' && u.cid === 'annie' && u.k.stunReady) { c.fillStyle = `rgba(255,${120 + Math.sin(this.t * 10) * 60},30,0.8)`; c.beginPath(); c.arc(sx, sy - top * 0.55, 3, 0, 6.3); c.fill(); }
      }
    }
    drawAura(u, x, y, top) {
      const c = this.ctx, kind = u.lookFx.aura, col = AURA[kind] || '#ffffff', fall = kind === 'snow';
      for (let i = 0; i < 6; i++) {
        const ph = (this.t * 0.5 + i / 6 + u.id * 0.37) % 1, a = Math.sin(ph * Math.PI);
        const px = x + Math.sin(i * 2.4 + this.t * 1.3 + u.id) * 14, py = fall ? y - top + ph * top : y - 2 - ph * top;
        c.globalAlpha = a * 0.9; c.fillStyle = col;
        if (kind === 'stars' || kind === 'sparkle') { c.fillRect(px - 2, py - 0.5, 5, 1); c.fillRect(px - 0.5, py - 2, 1, 5); }
        else c.fillRect(px - 1, py - 1, 2, kind === 'sparks' ? 3 : 2);
      }
      c.globalAlpha = 1;
    }
    drawCritter(x, y) { const c = this.ctx; c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(x, y - 8, 9, 7, 0, 0, 6.3); c.fill(); c.fillStyle = '#f0e0e0'; c.beginPath(); c.ellipse(x + 8, y - 12, 4, 3.5, 0, 0, 6.3); c.fill(); c.fillStyle = '#402020'; c.fillRect(x - 5, y - 3, 2, 4); c.fillRect(x + 3, y - 3, 2, 4); c.fillRect(x + 9, y - 13, 1, 1); c.strokeStyle = '#000'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y - 8, 9, 7, 0, 0, 6.3); c.stroke(); }
    ring(x, y, r, col) { const c = this.ctx; c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, r, r * 0.45, 0, 0, 6.3); c.stroke(); }
    stars(x, y) { const c = this.ctx; for (let i = 0; i < 3; i++) { const a = this.t * 5 + i * 2.1; c.fillStyle = '#ffe060'; c.fillRect(x + Math.cos(a) * 9 - 1.5, y + Math.sin(a) * 3 - 1.5, 3, 3); } }
    drawBars(g, u, x, y, team) {
      if (u.kind === 'ward' || (u.kind === 'monster' && u.hp >= u.maxHp && !u.aggro)) return;
      const c = this.ctx, sx = Math.round(this.sx(x)), z = (u.z || 0) * Z;
      if (u.structure) {
        if (u.dead) return;
        const im = u.kind === 'tower' ? this.A.tower[0][0] : u.kind === 'inhib' ? this.A.inhib[0][0] : this.A.nexus[0][0];
        const by = Math.round(this.sy(y)) - im.height + 2;
        this.bar(sx - 30, by, 60, 5, u.hp / u.maxHp, u.team === team ? '#40c040' : '#e03030');
        return;
      }
      const sy = Math.round(this.sy(y)) - z;
      if (u.kind === 'champ') {
        const top = sy - (this.champSet(u).top + 7) * (g.tagged(u, 'wildGrowth') ? 1.5 : 1);
        const col = u === this.ui.player ? '#50d050' : u.team === team ? '#4a8ae0' : '#e04040';
        c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(sx - 34, top - 3, 70, u.maxMp ? 13 : 9);
        c.fillStyle = u.team === team ? '#1a2a50' : '#501a1a'; c.fillRect(sx - 34, top - 3, 11, u.maxMp ? 13 : 9);
        this.text(String(u.level), sx - 28.5, top + 6, { align: 'center', size: 9, bold: true, color: '#ffe8a0' });
        this.bar(sx - 22, top - 1, 55, 5, u.hp / u.maxHp, col);
        const sh = g.shieldTotal(u); if (sh > 0) { c.fillStyle = '#f0f0f0'; const w = Math.min(55, sh / u.maxHp * 55); c.fillRect(sx - 22 + Math.min(55 - w, u.hp / u.maxHp * 55), top - 1, w, 5); }
        c.fillStyle = 'rgba(0,0,0,0.6)'; for (let i = 1; i < u.maxHp / 250; i++) c.fillRect(sx - 22 + i * 250 / u.maxHp * 55, top - 1, 1, 3);
        if (u.maxMp) this.bar(sx - 22, top + 6, 55, 2, u.mp / u.maxMp, '#4070e0', '#101830');
        if (this.ui.options.names) this.text(u.name, sx, top - 6, { align: 'center', size: 9, color: u.team === team ? '#c0d8ff' : '#ffc0c0' });
        return;
      }
      if (u.kind === 'trap') return;
      const w = u.kind === 'monster' ? (u.maxHp > 3000 ? 70 : 40) : u.kind === 'pet' ? 50 : 28;
      const top = sy - (u.kind === 'minion' ? (u.mtype === 'super' ? 48 : 36) : u.kind === 'pet' ? 80 : u.kind === 'monster' ? Math.min(110, 30 + u.r * 0.35) : 30);
      this.bar(sx - w / 2, top, w, 3, u.hp / u.maxHp, u.team === team ? '#4a8ae0' : u.team === 2 ? '#e0c040' : '#e04040');
    }
    drawProjectile(g, p, team) {
      const c = this.ctx, x = this.sx(p.x), y = this.sy(p.y);
      if (x < -60 || y < -60 || x > W + 60 || y > VIEW_H + 60) return;
      if (!this.ui.spectator && p.kind === 'homing' && p.target && !p.target.vis[team] && p.team !== team && !(p.src && p.src.vis && p.src.vis[team])) return;
      const ang = p.kind === 'line' ? Math.atan2(p.dy, p.dx) : (p.ang || 0), fx = p.src && p.src.lookFx && p.src.lookFx.proj;
      c.save(); c.translate(x, y); c.rotate(ang);
      switch (p.look) {
        case 'tower': c.fillStyle = p.team ? '#ff8060' : '#80b0ff'; c.beginPath(); c.arc(0, 0, 5, 0, 6.3); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 2, 0, 6.3); c.fill(); break;
        case 'caster': c.fillStyle = p.team ? '#ff9070' : '#90c0ff'; c.fillRect(-3, -2, 6, 4); break;
        case 'cannon': c.fillStyle = '#202028'; c.beginPath(); c.arc(0, 0, 4, 0, 6.3); c.fill(); break;
        case 'rocket': c.fillStyle = '#e04040'; c.fillRect(-7, -2, 12, 4); c.fillStyle = '#ffe060'; c.fillRect(-10, -1, 3, 2); break;
        case 'megarocket': c.fillStyle = '#e04040'; c.fillRect(-18, -5, 30, 10); c.fillStyle = '#40a0ff'; c.fillRect(8, -5, 6, 10); c.fillStyle = '#ffe060'; c.fillRect(-26, -3, 8, 6); c.fillStyle = 'rgba(255,160,40,0.6)'; c.fillRect(-40, -2, 14, 4); break;
        case 'lance': c.fillStyle = fx || '#ff80ff'; c.fillRect(-16, -2, 26, 4); c.fillStyle = '#fff'; c.fillRect(6, -1, 6, 2); break;
        case 'zap': c.strokeStyle = '#80e0ff'; c.lineWidth = 2; c.beginPath(); c.moveTo(-24, 0); for (let i = -18; i <= 8; i += 6) c.lineTo(i, (i / 6 % 2 ? -4 : 4)); c.stroke(); break;
        case 'arrow': c.fillStyle = fx || '#c0f0ff'; c.fillRect(-10, -1, 14, 2); break;
        case 'crystal': c.fillStyle = '#a0e0ff'; c.beginPath(); c.moveTo(18, 0); c.lineTo(-10, -8); c.lineTo(-18, 0); c.lineTo(-10, 8); c.fill(); c.fillStyle = '#fff'; c.fillRect(-4, -2, 12, 4); break;
        case 'fireball': c.fillStyle = fx || '#ff6020'; c.beginPath(); c.arc(0, 0, 6, 0, 6.3); c.fill(); c.fillStyle = fx ? '#ffffff' : '#ffe060'; c.beginPath(); c.arc(1, 0, 3, 0, 6.3); c.fill(); break;
        case 'hawk': c.fillStyle = '#a0c0e0'; c.beginPath(); c.moveTo(8, 0); c.lineTo(-6, -8 + Math.sin(this.t * 20) * 3); c.lineTo(-3, 0); c.lineTo(-6, 8 - Math.sin(this.t * 20) * 3); c.fill(); break;
        case 'pix': c.fillStyle = fx || '#ffe0ff'; c.fillRect(-2, -2, 4, 4); break;
        case 'shard': c.fillStyle = '#b08a60'; c.beginPath(); c.moveTo(8, 0); c.lineTo(-4, -5); c.lineTo(-6, 4); c.fill(); break;
        case 'dart': c.fillStyle = fx || '#80ff40'; c.fillRect(-6, -1, 10, 2); break;
        case 'orb': c.fillStyle = fx || p.color || '#60c0ff'; c.beginPath(); c.arc(0, 0, 5, 0, 6.3); c.fill(); c.fillStyle = '#fff'; c.fillRect(-1, -1, 2, 2); break;
        default: c.fillStyle = fx || p.color || '#ffe060'; c.beginPath(); c.arc(0, 0, 3.5, 0, 6.3); c.fill();
      }
      c.restore();
    }
    drawFx(dt, g) {
      const c = this.ctx;
      for (const f of this.fx) {
        f.t += dt; const k = f.t / f.life; if (k >= 1) continue;
        if (f.unit) { const u = g.units.find(x => x.id === f.unit); if (u) { f.x = u.x; f.y = u.y; } }
        const x = this.sx(f.x), y = this.sy(f.y);
        c.globalAlpha = 1 - k;
        switch (f.type) {
          case 'ring': { const r = f.r * Z * (0.4 + 0.6 * k); c.strokeStyle = f.color; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r, 0, 6.3); c.stroke(); if (f.fill) { c.globalAlpha = (1 - k) * 0.3; c.fillStyle = f.color; c.fill(); } break; }
          case 'spark': { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.93; f.vy *= 0.93; c.fillStyle = f.color; const s = f.size || 2; c.fillRect(this.sx(f.x) - s / 2, this.sy(f.y) - 20 - s / 2, s, s); break; }
          case 'cone': { c.fillStyle = f.color; const a0 = Math.atan2(f.dy, f.dx); c.beginPath(); c.moveTo(x, y - 10); c.arc(x, y - 10, f.r * Z * (0.5 + k * 0.5), a0 - f.a, a0 + f.a); c.closePath(); c.globalAlpha = (1 - k) * 0.6; c.fill(); break; }
          case 'bubble': c.strokeStyle = f.color; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y - 18, 20 + k * 6, 26 + k * 6, 0, 0, 6.3); c.stroke(); break;
          case 'rise': c.fillStyle = f.color; for (let i = 0; i < 5; i++) c.fillRect(x - 12 + i * 6, y - 10 - k * 40 - (i % 2) * 8, 3, 3); break;
          case 'slash': c.strokeStyle = f.color; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 12, y - 30 + k * 10); c.lineTo(x + 12, y - 14 - k * 10); c.stroke(); break;
          case 'charge': c.strokeStyle = f.color; c.lineWidth = 2; c.beginPath(); c.arc(x, y - 20, 18 * (1 - k) + 4, 0, 6.3); c.stroke(); break;
          case 'sword': { const yy = y - 160 * (1 - Math.min(1, k * 2.5)); c.fillStyle = '#f0f8ff'; c.fillRect(x - 4, yy - 70, 8, 60); c.fillStyle = '#ffd040'; c.fillRect(x - 12, yy - 14, 24, 4); c.fillStyle = '#6a4a2a'; c.fillRect(x - 2, yy - 10, 4, 12); break; }
          case 'cloud': c.fillStyle = f.color; c.globalAlpha = (1 - k) * 0.35; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(x + Math.cos(i) * f.r * Z * 0.5, y + Math.sin(i * 1.3) * f.r * Z * 0.3, f.r * Z * 0.45, 0, 6.3); c.fill(); } break;
          case 'prison': c.strokeStyle = '#60c0ff'; c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(x, y - 8 - i * 10, 18, 8, 0, 0, 6.3); c.stroke(); } break;
          case 'laser': c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y - 40); c.lineTo(this.sx(f.tx), this.sy(f.ty) - 20); c.stroke(); break;
        }
      }
      c.globalAlpha = 1; this.fx = this.fx.filter(f => f.t < f.life);
    }
    drawFog(g, team) {
      const v = g.vis[team], N = L.VIS.VIS_N, p = this.fogImg.data;
      for (let i = 0; i < N * N; i++) { p[i * 4] = 8; p[i * 4 + 1] = 10; p[i * 4 + 2] = 24; p[i * 4 + 3] = v[i] ? 0 : 150; }
      this.fogCtx.putImageData(this.fogImg, 0, 0);
      const c = this.ctx, cs = L.VIS.VIS_CELL;
      c.imageSmoothingEnabled = true;
      c.drawImage(this.fogCv, this.cam.x / cs, this.cam.y / cs, W / Z / cs, VIEW_H / Z / cs, 0, 0, W, VIEW_H);
      c.imageSmoothingEnabled = false;
    }

    hudBackground() {
      if (this.hudBg) return this.hudBg;
      const top = 12, cv = document.createElement('canvas'); cv.width = W; cv.height = H - HUD_Y + top;
      const c = cv.getContext('2d');
      const edge = () => { c.moveTo(0, top); c.lineTo(312, top); c.lineTo(324, 0); c.lineTo(606, 0); c.lineTo(618, top); c.lineTo(W, top); };
      c.save(); c.beginPath(); edge(); c.lineTo(W, cv.height); c.lineTo(0, cv.height); c.closePath(); c.clip();
      const gr = c.createLinearGradient(0, 0, 0, cv.height); gr.addColorStop(0, '#343644'); gr.addColorStop(0.25, '#23252f'); gr.addColorStop(1, '#0c0d12');
      c.fillStyle = gr; c.fillRect(0, 0, W, cv.height);
      const rnd = L.RNG(77);
      for (let i = 0; i < 1800; i++) { c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.2)'; c.fillRect(rnd() * W | 0, rnd() * cv.height | 0, 1 + (rnd() * 2 | 0), 1); }
      c.fillStyle = 'rgba(0,0,0,0.3)';
      for (let row = 0; row < 4; row++) { const y = top + 8 + row * 32; c.fillRect(0, y, W, 1); for (let x = (row % 2) * 34; x < W; x += 68) c.fillRect(x, y, 1, 32); }
      c.restore();
      const inset = (x, y, w, h) => { c.fillStyle = 'rgba(4,5,10,0.55)'; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x, y, w, 1); c.fillRect(x, y, 1, h); c.fillStyle = 'rgba(255,230,160,0.14)'; c.fillRect(x, y + h - 1, w, 1); c.fillRect(x + w - 1, y, 1, h); };
      inset(138, top + 4, 180, 124); inset(606, top + 4, 124, 124); inset(733, top + 4, 65, 124); inset(1, top + 2, 134, 132);
      c.lineJoin = 'miter';
      c.strokeStyle = '#3a2a10'; c.lineWidth = 5; c.beginPath(); edge(); c.stroke();
      c.strokeStyle = GOLD_D; c.lineWidth = 3; c.beginPath(); edge(); c.stroke();
      c.strokeStyle = GOLD; c.lineWidth = 1; c.beginPath(); c.moveTo(0, top + 0.5); c.lineTo(312.5, top + 0.5); c.lineTo(324.5, 0.5); c.lineTo(605.5, 0.5); c.lineTo(617.5, top + 0.5); c.lineTo(W, top + 0.5); c.stroke();
      for (const x of [136, 320, 604, 731]) { c.fillStyle = '#3a2a10'; c.fillRect(x, top + 2, 2, cv.height); c.fillStyle = 'rgba(232,192,96,0.35)'; c.fillRect(x + 2, top + 2, 1, cv.height); }
      for (const [x, y] of [[143, top + 9], [313, top + 9], [611, top + 9], [725, top + 9], [143, cv.height - 6], [313, cv.height - 6], [611, cv.height - 6], [725, cv.height - 6], [330, 5], [600, 5]]) {
        c.fillStyle = '#1a1206'; c.beginPath(); c.arc(x, y, 3, 0, 6.3); c.fill(); c.fillStyle = GOLD; c.beginPath(); c.arc(x - 0.5, y - 0.5, 2, 0, 6.3); c.fill(); c.fillStyle = '#fff4c0'; c.fillRect(x - 1.5, y - 1.5, 1, 1);
      }
      this.hudBg = cv;
      return cv;
    }
    drawHud(g) {
      const c = this.ctx, p = this.ui.player, S = this.S;
      c.drawImage(this.hudBackground(), 0, HUD_Y - 12);
      this.drawMinimap(g, 5, HUD_Y + 5, 126);
      if (!p) { this.drawSpectator(g); return; }
      const px = 146, py = HUD_Y + 9;
      c.fillStyle = '#000'; c.fillRect(px - 3, py - 3, 70, 70); this.icon(this.face(p, 64), px, py, 64); this.frame(px, py, 64, GOLD); this.frame(px - 2, py - 2, 68, GOLD_D);
      if (p.dead) { c.fillStyle = 'rgba(0,0,0,0.62)'; c.fillRect(px, py, 64, 64); this.text(String(Math.ceil(p.respawnT)), px + 32, py + 40, { align: 'center', size: 22, bold: true, color: '#ff6060' }); }
      c.fillStyle = '#1a1206'; c.beginPath(); c.arc(px + 62, py + 62, 11, 0, 6.3); c.fill(); c.strokeStyle = GOLD; c.lineWidth = 2; c.stroke(); c.lineWidth = 1;
      this.text(String(p.level), px + 62, py + 66.5, { align: 'center', size: 12, bold: true, color: '#ffe8a0' });
      const xp0 = D.XP_TABLE[p.level - 1] || 0, xp1 = D.XP_TABLE[p.level] || xp0 + 1;
      this.bar(px, py + 76, 50, 4, p.level >= 18 ? 1 : (p.xp - xp0) / (xp1 - xp0), '#b060ff', '#200830');
      this.hit(px, py, 64, 64, 'portrait', null, 'portrait');
      this.text(p.name, px + 32, py + 96, { align: 'center', size: 10, color: '#c8c0a8' });
      this.text(p.def.name, px + 32, py + 110, { align: 'center', size: 9, color: '#8a8470' });
      const st = p.st, x0 = 222, y0 = HUD_Y + 20;
      const rows = [['ad', Math.round(st.ad), '#ffb060'], ['ap', Math.round(st.ap), '#c890ff'], ['armor', Math.round(st.armor), '#e8d060'], ['mr', Math.round(st.mr), '#70c8ff'], ['asp', st.as.toFixed(2), '#ffe080'], ['msFlat', Math.round(st.ms), '#e8e8e8'], ['crit', Math.round(st.crit * 100) + '%', '#ff8a60'], ['cdr', Math.round(st.cdr * 100) + '%', '#80e8ff']];
      rows.forEach((r, i) => {
        const x = x0 + (i % 2) * 48, y = y0 + Math.floor(i / 2) * 17;
        c.drawImage(L.Icons.stat(r[0], 12), x, y - 10);
        this.text(String(r[1]), x + 15, y, { size: 10, bold: true, color: r[2] });
        this.hit(x, y - 11, 46, 15, 'stat', r[0], { text: this.L(STAT_NAMES[r[0]]) });
      });
      this.text(`${S.kda}  ${p.kills} / ${p.deaths} / ${p.assists}`, x0, HUD_Y + 102, { size: 10, bold: true, color: '#e8dcc0' });
      this.text(`${S.cs}  ${p.cs}`, x0, HUD_Y + 118, { size: 10, color: '#b8b0a0' });
      for (let s = 0; s < 4; s++) this.drawAbility(g, p, s, 330 + s * 52, HUD_Y + 5);
      for (let i = 0; i < 2; i++) this.drawSpell(g, p, i, 540 + i * 33, HUD_Y + 11);
      const bx = 330, by = HUD_Y + 64, bw = 272;
      this.bar(bx, by, bw, 13, p.hp / p.maxHp, '#30b030', '#301010');
      const sh = g.shieldTotal(p); if (sh > 0) { c.fillStyle = 'rgba(240,240,240,0.85)'; const w = Math.min(bw, sh / p.maxHp * bw); c.fillRect(bx + Math.min(bw - w, p.hp / p.maxHp * bw), by, w, 13); }
      c.fillStyle = 'rgba(0,0,0,0.45)'; for (let i = 1; i < p.maxHp / 100; i++) c.fillRect(bx + Math.round(i * 100 / p.maxHp * bw), by, 1, i % 10 ? 4 : 13);
      this.text(`${Math.ceil(p.hp)} / ${Math.round(p.maxHp)}`, bx + bw / 2, by + 10.5, { align: 'center', size: 10, bold: true });
      this.text('+' + p.st.hpReg.toFixed(1), bx + bw - 3, by + 10.5, { align: 'right', size: 9, color: '#a0e0a0' });
      if (p.maxMp) { this.bar(bx, by + 17, bw, 10, p.mp / p.maxMp, '#3060d0', '#101830'); this.text(`${Math.floor(p.mp)} / ${Math.round(p.maxMp)}`, bx + bw / 2, by + 26, { align: 'center', size: 9, bold: true }); this.text('+' + p.st.mpReg.toFixed(1), bx + bw - 3, by + 26, { align: 'right', size: 8, color: '#a0c0ff' }); }
      else this.bar(bx, by + 17, bw, 10, 1, '#606060', '#202020');
      this.drawBuffs(g, p, bx, HUD_Y + 100);
      const ix = 612, iy = HUD_Y + 8;
      for (let i = 0; i < 6; i++) this.drawItemSlot(g, p, i, ix + (i % 3) * 38, iy + Math.floor(i / 3) * 38);
      c.fillStyle = '#050608'; c.fillRect(ix, HUD_Y + 88, 112, 22); c.strokeStyle = GOLD_D; c.strokeRect(ix + 0.5, HUD_Y + 88.5, 111, 21);
      for (let i = 0; i < 3; i++) { c.fillStyle = '#6a4a08'; c.beginPath(); c.ellipse(ix + 13, HUD_Y + 103 - i * 3, 7, 3, 0, 0, 6.3); c.fill(); c.fillStyle = i === 2 ? '#ffe070' : '#e0a820'; c.beginPath(); c.ellipse(ix + 13, HUD_Y + 102 - i * 3, 6.5, 2.5, 0, 0, 6.3); c.fill(); }
      this.text(String(Math.floor(p.gold)), ix + 66, HUD_Y + 104, { align: 'center', size: 13, bold: true, color: '#ffe060' });
      this.hit(ix, HUD_Y + 88, 112, 22, 'shop', null, { text: this.S.shop + ' (P)' });
      this.hudButton(736, HUD_Y + 8, 'shop', 'P', '#ffd040');
      this.hudButton(736, HUD_Y + 48, 'recall', 'B', '#80c0ff');
      this.hudButton(736, HUD_Y + 88, 'menu', '≡', '#c0c0c0');
      this.hudButton(766, HUD_Y + 8, 'camlock', 'Y', this.ui.camLocked ? '#60ff60' : '#806060');
      this.hudButton(766, HUD_Y + 48, 'score', 'Tab', '#c0c0c0', 9);
      this.hudButton(766, HUD_Y + 88, 'help', '?', '#c0c0c0');
      if (p.points > 0) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(326, HUD_Y - 34, this.measure(S.levelUp, 10, true) + 12, 16); this.text(S.levelUp, 332, HUD_Y - 22, { size: 10, bold: true, color: '#ffe060' }); }
    }
    drawBuffs(g, p, x, y) {
      const c = this.ctx;
      const keyOf = s => s.buffIcon === 'blue' ? 'blue' : s.buffIcon === 'red' ? 'red' : s.tag === 'baron' ? 'baron' : s.type === 'regen' ? 'regen' : ['excited', 'highlander', 'whimsy', 'wildGrowth', 'desperate'].includes(s.tag) ? s.tag : null;
      const list = p.status.filter(s => keyOf(s)).slice(0, 11);
      for (const b of list) {
        c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, 20, 20); c.drawImage(L.Icons.buff(keyOf(b), 18), x, y);
        c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x, y, 18, 18 * (1 - b.t / b.max));
        x += 22;
      }
      if (g.dragonStacks[p.team]) { c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, 20, 20); c.drawImage(L.Icons.buff('dragon', 18), x, y); this.text('x' + g.dragonStacks[p.team], x + 17, y + 17, { align: 'right', size: 9, bold: true }); }
    }
    hudButton(x, y, id, label, col, size = 13) {
      const c = this.ctx, hot = this.ui.hover && this.ui.hover.id === id;
      const gr = c.createLinearGradient(0, y, 0, y + 36); gr.addColorStop(0, hot ? '#46547a' : '#262e48'); gr.addColorStop(1, hot ? '#1e2640' : '#10141f');
      c.fillStyle = gr; c.fillRect(x, y, 28, 36); c.strokeStyle = hot ? GOLD : GOLD_D; c.strokeRect(x + 0.5, y + 0.5, 27, 35);
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x + 1, y + 1, 26, 1);
      this.text(label, x + 14, y + 23, { align: 'center', size, bold: true, color: col });
      const tips = { shop: this.S.shop + ' (P)', recall: this.S.recall + ' (B)', menu: 'Esc', camlock: this.S.camlock + ' (Y)', score: this.S.scoreboard + ' (Tab)', help: this.S.help };
      this.hit(x, y, 28, 36, id, null, { text: tips[id] });
    }
    drawAbility(g, p, s, x, y) {
      const c = this.ctx, a = p.def.abilities[s], r = p.ranks[s], n = 46;
      c.fillStyle = '#000'; c.fillRect(x - 2, y - 2, n + 4, n + 4);
      this.icon(L.Icons.ability(p.cid, s, 44), x + 1, y + 1, 44);
      const teemoR = p.cid === 'teemo' && s === 3;
      if (!r) { c.fillStyle = 'rgba(0,0,0,0.68)'; c.fillRect(x, y, n, n); }
      else if (teemoR ? p.charges < 1 : p.cds[s] > 0) {
        const tot = teemoR ? a.v.rech[r - 1] : a.cd[r - 1] * (1 - p.st.cdr), left = teemoR ? tot - p.chargeT : p.cds[s];
        c.fillStyle = 'rgba(0,0,0,0.66)'; c.beginPath(); c.moveTo(x + n / 2, y + n / 2); c.arc(x + n / 2, y + n / 2, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, left / tot)); c.closePath();
        c.save(); c.beginPath(); c.rect(x, y, n, n); c.clip(); c.fill(); c.restore();
        this.text(left >= 1 ? String(Math.ceil(left)) : left.toFixed(1), x + n / 2, y + 29, { align: 'center', size: 15, bold: true });
      } else if (p.mp < g.abilityCost(p, s)) { c.fillStyle = 'rgba(20,40,160,0.55)'; c.fillRect(x, y, n, n); }
      if (teemoR && r) this.text(String(p.charges), x + n - 3, y + n - 3, { align: 'right', size: 11, bold: true, color: '#c0ff80' });
      else if (r && a.cost[0]) this.text(String(g.abilityCost(p, s)), x + n - 3, y + n - 3, { align: 'right', size: 9, bold: true, color: '#8ab8ff' });
      if (p.cid === 'jinx' && s === 0 && p.k.rocket) { c.strokeStyle = '#ff6060'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, n - 2, n - 2); c.lineWidth = 1; }
      const armed = this.ui.targeting && this.ui.targeting.slot === s && this.ui.targeting.kind === 'ability';
      this.frame(x, y, n, armed ? '#ffffff' : r ? GOLD : GOLD_D);
      c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(x + 1, y + 1, 13, 13); this.text('QWER'[s], x + 7.5, y + 11.5, { align: 'center', size: 10, bold: true, color: '#ffe8a0' });
      const max = s === 3 ? 3 : 5, pw = (n - 4) / max;
      for (let i = 0; i < max; i++) { c.fillStyle = '#000'; c.fillRect(x + 2 + i * pw, y + n + 3, pw - 2, 4); c.fillStyle = i < r ? '#ffd040' : '#34302a'; c.fillRect(x + 2 + i * pw, y + n + 3, pw - 2, 3); }
      this.hit(x, y, n, n, 'ability', s, { ability: s });
      if (g.canLevel(p, s)) {
        const lx = x + n / 2 - 8, ly = y - 15, pulse = 0.75 + Math.sin(this.t * 6) * 0.25;
        c.fillStyle = `rgba(255,208,64,${pulse})`; c.fillRect(lx, ly, 16, 12); c.strokeStyle = '#3a2a10'; c.strokeRect(lx + 0.5, ly + 0.5, 15, 11);
        c.fillStyle = '#000'; c.fillRect(lx + 7, ly + 2, 2, 8); c.fillRect(lx + 4, ly + 5, 8, 2);
        this.hit(lx, ly, 16, 12, 'levelup', s);
      }
    }
    drawSpell(g, p, i, x, y) {
      const c = this.ctx, id = p.spells[i];
      c.fillStyle = '#000'; c.fillRect(x - 2, y - 2, 34, 34); this.icon(L.Icons.spell(id, 30), x, y, 30);
      if (p.spellCds[i] > 0) { c.fillStyle = 'rgba(0,0,0,0.66)'; c.fillRect(x, y + 30 * (1 - p.spellCds[i] / SPELLS[id].cd), 30, 30 * p.spellCds[i] / SPELLS[id].cd); this.text(String(Math.ceil(p.spellCds[i])), x + 15, y + 20, { align: 'center', size: 11, bold: true }); }
      this.frame(x, y, 30, GOLD_D);
      c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(x + 1, y + 1, 10, 11); this.text('DF'[i], x + 6, y + 10, { align: 'center', size: 9, bold: true, color: '#ffe8a0' });
      this.hit(x, y, 30, 30, 'spell', i, { spell: id });
    }
    drawItemSlot(g, p, i, x, y) {
      const c = this.ctx, it = p.items[i];
      c.fillStyle = '#050608'; c.fillRect(x, y, 36, 36); c.strokeStyle = GOLD_D; c.strokeRect(x + 0.5, y + 0.5, 35, 35);
      if (it) {
        this.icon(L.Icons.item(it.id, 34), x + 1, y + 1, 34);
        if (it.n > 1) this.text(String(it.n), x + 33, y + 33, { align: 'right', size: 10, bold: true });
        if (it.cd > 0) { c.fillStyle = 'rgba(0,0,0,0.66)'; c.fillRect(x + 1, y + 1, 34, 34); this.text(String(Math.ceil(it.cd)), x + 18, y + 23, { align: 'center', size: 11, bold: true }); }
        const def = ITEMS[it.id]; if (def.use || def.active) { c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(x + 1, y + 1, 9, 10); this.text(String(i + 1), x + 5.5, y + 9.5, { align: 'center', size: 8, bold: true, color: '#ffe8a0' }); }
        this.hit(x, y, 36, 36, 'item', i, { item: it.id, slot: i });
      } else { this.text(String(i + 1), x + 18, y + 22, { align: 'center', size: 10, color: '#2a2a30', shadow: false }); this.hit(x, y, 36, 36, 'itemEmpty', i); }
    }
    drawMinimap(g, x, y, s) {
      const c = this.ctx, team = this.ui.viewTeam, k = s / D.MAP;
      c.fillStyle = '#000'; c.fillRect(x - 2, y - 2, s + 4, s + 4);
      c.imageSmoothingEnabled = true; c.drawImage(this.A.terrain.mini, x, y, s, s);
      if (!this.ui.spectator) c.drawImage(this.fogCv, x, y, s, s);
      c.imageSmoothingEnabled = false;
      for (const u of g.units) {
        if (u.dead && !u.structure) continue;
        const ux = x + u.x * k, uy = y + u.y * k;
        if (u.structure) { if (u.dead) continue; c.fillStyle = u.team ? '#ff5040' : '#5090ff'; const sz = u.kind === 'nexus' ? 6 : 4; c.fillRect(ux - sz / 2, uy - sz / 2, sz, sz); c.strokeStyle = '#000'; c.strokeRect(ux - sz / 2 - 0.5, uy - sz / 2 - 0.5, sz + 1, sz + 1); continue; }
        if (u.team !== team && !u.vis[team] && !this.ui.spectator) continue;
        if (u.kind === 'minion') { c.fillStyle = u.team ? '#ff8070' : '#80b0ff'; c.fillRect(ux - 1, uy - 1, 2, 2); }
        else if (u.kind === 'monster') { c.fillStyle = '#ffd040'; c.fillRect(ux - 1.5, uy - 1.5, 3, 3); }
        else if (u.kind === 'ward' && u.team === team) { c.fillStyle = '#60ff60'; c.fillRect(ux - 1, uy - 1, 2, 2); }
      }
      for (const cp of g.camps) if (cp.def.side === 2) { const alive = cp.alive.some(m => !m.dead); c.fillStyle = alive ? (cp.def.id === 'dragon' ? '#ff8030' : '#c060ff') : '#404040'; c.fillRect(x + cp.def.p[0] * k - 2, y + cp.def.p[1] * k - 2, 4, 4); }
      c.imageSmoothingEnabled = true;
      for (const u of g.champs) {
        if (u.dead || (u.team !== team && !u.vis[team] && !this.ui.spectator)) continue;
        const ux = Math.round(x + u.x * k), uy = Math.round(y + u.y * k);
        c.fillStyle = u === this.ui.player ? '#ffe060' : u.team ? '#ff3020' : '#2a70ff';
        c.fillRect(ux - 7, uy - 7, 14, 14); c.drawImage(this.face(u, 24), ux - 6, uy - 6, 12, 12);
      }
      c.imageSmoothingEnabled = false;
      c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.strokeRect(x + this.cam.x * k, y + this.cam.y * k, W / Z * k, VIEW_H / Z * k);
      for (const pg of this.ui.pings) { const kk = pg.t / 2; c.strokeStyle = pg.color || '#ffe060'; c.beginPath(); c.arc(x + pg.x * k, y + pg.y * k, 3 + kk * 10, 0, 6.3); c.stroke(); }
      c.strokeStyle = GOLD_D; c.strokeRect(x - 1.5, y - 1.5, s + 3, s + 3);
      this.hit(x, y, s, s, 'minimap');
      this.miniRect = { x, y, s };
    }
    drawSpectator(g) {
      const c = this.ctx;
      for (let t = 0; t < 2; t++) {
        g.champs.filter(ch => ch.team === t).forEach((ch, i) => {
          const x = 142 + i * 131, y = HUD_Y + 10 + t * 62;
          c.fillStyle = t ? 'rgba(90,24,24,0.55)' : 'rgba(24,44,96,0.55)'; c.fillRect(x - 2, y - 2, 127, 56); c.strokeStyle = GOLD_D; c.strokeRect(x - 1.5, y - 1.5, 126, 55);
          this.icon(this.face(ch, 32), x, y, 32); this.frame(x, y, 32, t ? '#c04030' : '#3060c0');
          if (ch.dead) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x, y, 32, 32); this.text(String(Math.ceil(ch.respawnT)), x + 16, y + 21, { align: 'center', size: 12, bold: true, color: '#ff6060' }); }
          this.text(ch.def.name, x + 37, y + 11, { size: 10, bold: true, color: t ? '#ffb8a8' : '#a8c8ff' });
          this.text(`${this.S.level} ${ch.level}   ${ch.kills}/${ch.deaths}/${ch.assists}`, x + 37, y + 24, { size: 9, color: '#e0d8c8' });
          this.bar(x + 37, y + 30, 84, 4, ch.hp / ch.maxHp, '#40c040');
          ch.items.slice(0, 6).forEach((it, k2) => { c.fillStyle = '#000'; c.fillRect(x + k2 * 20, y + 36, 18, 14); if (it) c.drawImage(L.Icons.item(it.id, 22), 2, 4, 18, 14, x + k2 * 20, y + 36, 18, 14); });
        });
      }
    }
    drawAllies(g) {
      const p = this.ui.player; if (!p) return;
      const c = this.ctx, allies = g.champs.filter(ch => ch.team === p.team && ch !== p);
      allies.forEach((ch, i) => {
        const x = 4, y = 28 + i * 40, hot = this.ui.hover && this.ui.hover.id === 'ally' && this.ui.hover.data === ch.id;
        c.fillStyle = hot ? 'rgba(30,40,70,0.85)' : 'rgba(8,10,20,0.72)'; c.fillRect(x, y, 112, 36); c.strokeStyle = hot ? GOLD : GOLD_D; c.strokeRect(x + 0.5, y + 0.5, 111, 35);
        this.icon(this.face(ch, 32), x + 2, y + 2, 32);
        if (ch.dead) { c.fillStyle = 'rgba(0,0,0,0.62)'; c.fillRect(x + 2, y + 2, 32, 32); this.text(String(Math.ceil(ch.respawnT)), x + 18, y + 23, { align: 'center', size: 13, bold: true, color: '#ff6060' }); }
        c.fillStyle = '#000'; c.fillRect(x + 2, y + 24, 12, 10); this.text(String(ch.level), x + 8, y + 32.5, { align: 'center', size: 8, bold: true, color: '#ffe8a0' });
        this.text(ch.def.name, x + 38, y + 11, { size: 9, bold: true, color: '#c8d8ff' });
        this.bar(x + 38, y + 16, 70, 5, ch.hp / ch.maxHp, '#40b040');
        if (ch.maxMp) this.bar(x + 38, y + 24, 70, 3, ch.mp / ch.maxMp, '#4070e0', '#101830');
        if (ch.ranks[3] > 0 && ch.cds[3] <= 0 && !ch.dead) { c.fillStyle = '#ffd040'; c.beginPath(); c.moveTo(x + 104, y + 4); c.lineTo(x + 108, y + 8); c.lineTo(x + 104, y + 12); c.lineTo(x + 100, y + 8); c.closePath(); c.fill(); }
        this.hit(x, y, 112, 36, 'ally', ch.id, { text: `${ch.def.name} — ${ch.name}` });
      });
    }
    drawTop(g) {
      const c = this.ctx, S = this.S, team = this.ui.viewTeam;
      const gr = c.createLinearGradient(0, 0, 0, 24); gr.addColorStop(0, 'rgba(26,30,46,0.92)'); gr.addColorStop(1, 'rgba(8,10,20,0.92)');
      c.fillStyle = gr; c.beginPath(); c.moveTo(292, 0); c.lineTo(508, 0); c.lineTo(498, 24); c.lineTo(302, 24); c.closePath(); c.fill();
      c.strokeStyle = GOLD_D; c.beginPath(); c.moveTo(292, 0.5); c.lineTo(302, 24.5); c.lineTo(498, 24.5); c.lineTo(508, 0.5); c.stroke();
      const k0 = g.teamStats[team].kills, k1 = g.teamStats[1 - team].kills;
      this.text(String(k0), 356, 17, { align: 'center', size: 15, bold: true, color: '#80b0ff' }); this.text('⚔', 400, 17, { align: 'center', size: 12, color: GOLD });
      this.text(String(k1), 444, 17, { align: 'center', size: 15, bold: true, color: '#ff8070' });
      this.text(String(g.teamStats[team].towers), 318, 16, { align: 'center', size: 9, color: '#80b0ff' }); this.text(String(g.teamStats[1 - team].towers), 482, 16, { align: 'center', size: 9, color: '#ff8070' });
      const m = Math.floor(g.time / 60), s = Math.floor(g.time % 60);
      c.fillStyle = 'rgba(8,10,20,0.85)'; c.fillRect(726, 0, 74, 20); c.fillStyle = GOLD_D; c.fillRect(726, 20, 74, 1);
      const p = this.ui.player;
      this.text(`${m}:${String(s).padStart(2, '0')}`, 790, 14, { align: 'right', size: 11, bold: true });
      if (p) this.text(`${p.cs}`, 740, 14, { align: 'center', size: 9, color: '#c8c0a8' });
      if (this.ui.options.fps) this.text('FPS ' + this.ui.fps, 124, 14, { size: 10, color: '#a0ffa0' });
      this.drawAllies(g);
      let y = 30;
      for (const kf of this.ui.killFeed) {
        if (kf.t > 8) continue;
        c.globalAlpha = Math.min(1, (8 - kf.t) / 1.5);
        c.fillStyle = kf.ally ? 'rgba(20,40,90,0.78)' : 'rgba(90,20,20,0.78)'; c.fillRect(616, y, 180, 28); c.strokeStyle = kf.ally ? '#3060c0' : '#c04030'; c.strokeRect(616.5, y + 0.5, 179, 27);
        if (kf.killer) this.icon(this.face(kf.killer, 24), 619, y + 2, 24); else this.text('☠', 631, y + 20, { align: 'center', size: 16, color: '#e0d0c0' });
        this.text('⚔', 706, y + 18, { align: 'center', size: 12, color: GOLD });
        this.icon(this.face(kf.victim, 24), 769, y + 2, 24);
        if (kf.label) this.text(kf.label, 648, y + 18, { size: 9, bold: true, color: '#ffe8a0' });
        y += 31;
      }
      c.globalAlpha = 1;
      const an = this.ui.announce;
      if (an && an.t < 3.5 && !this.ui.endShown) {
        const a = Math.min(1, (3.5 - an.t) / 0.8);
        c.globalAlpha = a;
        const gw = c.createLinearGradient(150, 0, 650, 0); gw.addColorStop(0, 'rgba(0,0,0,0)'); gw.addColorStop(0.2, 'rgba(0,0,0,0.62)'); gw.addColorStop(0.8, 'rgba(0,0,0,0.62)'); gw.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gw; c.fillRect(150, 74, 500, 38); c.fillStyle = GOLD_D; c.fillRect(230, 74, 340, 1); c.fillRect(230, 111, 340, 1);
        this.text(an.text, 400, 100, { align: 'center', size: 20, bold: true, serif: true, color: an.color || GOLD });
        c.globalAlpha = 1;
      }
      let cy = HUD_Y - 40;
      const lines = this.ui.chat.filter(l => l.t < 10 || this.ui.chatOpen).slice(-7);
      for (let i = lines.length - 1; i >= 0; i--) {
        const l = lines[i]; c.globalAlpha = this.ui.chatOpen ? 1 : Math.min(1, (10 - l.t) / 2);
        const w = this.text(l.from ? `[${l.all ? (this.ui.lang === 'ru' ? 'Все' : 'All') : (this.ui.lang === 'ru' ? 'Ком' : 'Team')}] ${l.from}: ` : '', 8, cy, { size: 10, bold: true, color: l.team === team ? '#80b0ff' : '#ff8070' });
        this.text(l.text, 8 + w, cy, { size: 10, color: l.sys ? '#ffe060' : '#ffffff' });
        cy -= 13;
      }
      c.globalAlpha = 1;
      if (this.ui.chatOpen) { c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(6, HUD_Y - 32, 300, 16); c.strokeStyle = GOLD_D; c.strokeRect(6.5, HUD_Y - 31.5, 299, 15); this.text('> ' + this.ui.chatText + (Math.floor(this.t * 2) % 2 ? '_' : ''), 10, HUD_Y - 20, { size: 10 }); }
      if (p && p.dead) {
        c.fillStyle = 'rgba(40,40,50,0.35)'; c.fillRect(0, 0, W, VIEW_H);
        this.text(`${S.respawnIn} ${Math.ceil(p.respawnT)}`, 400, 150, { align: 'center', size: 18, bold: true, serif: true, color: '#ff8080' });
      }
      const su = this.ui.selected;
      if (su && !su.dead && (su.team === team || su.vis[team] || su.structure)) {
        const fx = 302, fy = 28;
        c.fillStyle = 'rgba(8,10,20,0.84)'; c.fillRect(fx, fy, 196, 40); c.strokeStyle = GOLD_D; c.strokeRect(fx + 0.5, fy + 0.5, 195, 39);
        const nm = su.kind === 'champ' ? `${su.def.name} (${su.name})` : su.kind === 'minion' ? (this.ui.lang === 'ru' ? 'Миньон' : 'Minion') : su.kind === 'tower' ? S.tower : su.kind === 'inhib' ? S.inhib : su.kind === 'nexus' ? S.nexus : su.kind === 'monster' ? su.mtype : su.kind;
        let tx = fx + 6;
        if (su.kind === 'champ') { this.icon(this.face(su, 32), fx + 4, fy + 4, 32); tx = fx + 40; }
        this.text(nm, tx, fy + 13, { size: 10, bold: true, color: su.team === team ? '#a0c0ff' : '#ffb0a0' });
        this.bar(tx, fy + 18, fx + 190 - tx, 6, su.hp / su.maxHp, su.team === team ? '#40c040' : '#e03030');
        this.text(`${Math.ceil(su.hp)}/${Math.round(su.maxHp)}  ${this.ui.lang === 'ru' ? 'СА' : 'AD'} ${Math.round(su.st.ad)}  ${this.ui.lang === 'ru' ? 'Бр' : 'Arm'} ${Math.round(su.st.armor)}`, tx, fy + 35, { size: 9, color: '#c8c0a8' });
      }
    }

    tooltip(tip, mx, my) {
      if (!tip) return;
      const p = this.ui.player, lines = [];
      let title = '', tag = '', sub = '', body = '', w = 270, icon = null;
      if (tip.text) { title = tip.text; w = 12 + this.measure(title, 11, true); }
      else if (tip.ability != null && p) {
        const a = p.def.abilities[tip.ability], r = p.ranks[tip.ability];
        title = `${this.L(a.name)} [${a.key}]`; icon = L.Icons.ability(p.cid, tip.ability, 32);
        tag = `${this.S.rank} ${r}/${tip.ability === 3 ? 3 : 5}`;
        sub = (a.target !== 'passive' && a.target !== 'toggle' ? `${this.S.cooldown}: ${(a.cd[Math.max(0, r - 1)] * (1 - p.st.cdr)).toFixed(1)}` : '') + (a.cost[0] ? `   ${this.S.manaCost}: ${a.cost[Math.max(0, r - 1)]}` : '');
        body = this.fmtAbility(a, r);
        lines.push({ t: `${this.S.passive}: ${this.L(p.def.passive.name)}`, c: '#c0a060' });
      } else if (tip.ability != null) return;
      else if (tip.spell) { const sp = SPELLS[tip.spell]; title = this.L(sp.name); tag = `${this.S.cooldown}: ${sp.cd}`; body = this.L(sp.desc); icon = L.Icons.spell(tip.spell, 30); }
      else if (tip.item) {
        const it = ITEMS[tip.item]; title = this.L(it.name); icon = L.Icons.item(tip.item, 32);
        tag = `${this.S.cost}: ${it.cost}` + (tip.slot != null ? `  (${this.S.sell}: ${Math.floor(it.cost * 0.7)})` : '');
        for (const k in it.stats || {}) lines.push({ t: `+${PCT_STATS.has(k) ? Math.round(it.stats[k] * 100) + '%' : it.stats[k]} ${this.L(STAT_NAMES[k])}`, c: '#a0e0a0' });
        body = it.desc ? this.L(it.desc) : '';
      } else if (tip.custom) { title = tip.custom.title; tag = tip.custom.tag || ''; sub = tip.custom.sub || ''; body = tip.custom.body || ''; icon = tip.custom.icon || null; w = 300; }
      else if (tip === 'portrait' && p) { title = `${p.def.name} — ${this.L(p.def.title)}`; body = this.L(p.def.lore); sub = `${this.L(p.def.passive.name)}: ${this.L(p.def.passive.desc)}`; icon = this.face(p, 32); w = 300; }
      else return;
      if (icon) w = Math.max(w, 52 + this.measure(title, 11, true));
      const head = icon ? 42 : tag ? 34 : 22;
      const bh = body ? this.wrapHeight(body, w - 12, 10) : 0, sh = sub ? this.wrapHeight(sub, w - 12, 10) : 0;
      const h = head + sh + lines.length * 13 + bh + (body ? 6 : 2);
      const x = Math.max(4, Math.min(W - w - 4, mx + 12)); let y = my - h - 8; if (y < 4) y = Math.min(H - h - 4, my + 20);
      const c = this.ctx; c.fillStyle = 'rgba(6,8,16,0.95)'; c.fillRect(x, y, w, h); c.strokeStyle = GOLD; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); c.strokeStyle = 'rgba(232,192,96,0.25)'; c.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
      let tx = x + 7;
      if (icon) { c.fillStyle = '#000'; c.fillRect(x + 5, y + 5, 34, 34); c.drawImage(icon, x + 6, y + 6, 32, 32); tx = x + 46; }
      this.text(title, tx, y + (icon ? 19 : 15), { size: 11, bold: true, color: GOLD });
      if (tag) this.text(tag, tx, y + (icon ? 33 : 29), { size: 10, color: '#ffe070' });
      let yy = y + head + 10;
      if (sub) yy = this.wrap(sub, x + 7, yy, w - 12, { size: 10, color: '#a8b0c8' });
      for (const l of lines) { this.text(l.t, x + 7, yy, { size: 10, color: l.c }); yy += 13; }
      if (body) this.wrap(body, x + 7, yy + 2, w - 12, { size: 10, color: '#e8e4d8' });
    }
    measure(s, size, bold) { this.ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`; return this.ctx.measureText(s).width; }
    fmtAbility(a, r) {
      const lang = this.ui.lang;
      return this.L(a.desc).replace(/\{(\w+)\}/g, (_, k) => {
        const v = a.v[k];
        if (Array.isArray(v)) return v.map((x, i) => (i === r - 1 ? '[' : '') + (x < 1 && x > 0 && k !== 't' && k !== 'poly' ? Math.round(x * 100) + '%' : x) + (i === r - 1 ? ']' : '')).join('/');
        if (typeof v === 'number') return v < 5 ? (v * 100 < 1000 && k !== 'ap' && k !== 'adr' && k !== 'bad' && k !== 'badr' ? Math.round(v * 100) + '%' : String(v)) : String(v);
        void lang; return k;
      });
    }
  }
  Renderer.W = W; Renderer.H = H; Renderer.HUD_Y = HUD_Y; Renderer.VIEW_H = VIEW_H; Renderer.Z = Z; Renderer.GOLD = GOLD; Renderer.GOLD_D = GOLD_D;
  L.Renderer = Renderer;
})(globalThis.LoL98 = globalThis.LoL98 || {});
