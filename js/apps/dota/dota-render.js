(function (D) {
  'use strict';
  const DD = D.DATA, { HEROES, HERO_ORDER, ITEMS, MAP, RUNES } = DD;
  const G = D.GFX, { KX, KY, KZ, TU } = G;
  const W = 800, H = 600, TOP = 28, HUD_Y = 462;
  const FONT = 'Tahoma, "MS Sans Serif", Arial, sans-serif', SERIF = 'Georgia, "Times New Roman", serif';
  const BRONZE = '#c8a060', BRONZE_D = '#6a4a20', TEAMC = ['#5ac85a', '#e04a3a'];
  const PCOL = ['#3375ff', '#66ffbf', '#bf00bf', '#f3f00b', '#ff6b00', '#fe86c2', '#a1b447', '#65d9f7', '#008321', '#a46900'];
  const MM = { x: 6, y: 472, w: 200, h: 100 };
  const COS = D.Cosmetics;
  const STATUS_ICON = {
    malefice: 'a:malefice', bh: 'a:black_hole', frostbite: 'a:frostbite', nova: 'a:crystal_nova', nova_root: 'a:crystal_nova', ff_armor: 'a:freezing_field', ff_slow: 'a:freezing_field', warcry: 'a:warcry', warcry_shield: 'a:warcry', gods_strength: 'a:gods_strength',
    taunt: 'a:berserkers_call', call_armor: 'a:berserkers_call', battle_hunger: 'a:battle_hunger', cull_speed: 'a:culling_blade', blade_fury: 'a:blade_fury', omnislash: 'a:omnislash', rot: 'a:rot', rot_slow: 'a:rot', hooked: 'a:meat_hook', dismember: 'a:dismember',
    drain_slow: 'a:mana_drain', aimed: 'a:assassinate', headshot: 'a:headshot', shrapnel: 'a:shrapnel', fiery_soul: 'a:fiery_soul', hex: 'i:scythe', tango: 'i:tango', salve: 'i:salve', clarity: 'i:clarity', bottle: 'i:bottle', phase: 'i:phase_boots', glimmer: 'i:glimmer',
    cyclone: 'i:euls', abyssal: 'i:abyssal', bkb: 'i:bkb', blade_mail: 'i:blade_mail', shadow: 'i:shadow_blade', madness: 'i:mask_madness', dust: 'i:dust', corrupt: 'i:desolator', pushed: 'i:force_staff', glyph: 'g', slam: 's', stun: 's',
    rune_dd: 'r:dd', rune_haste: 'r:haste', rune_invis: 'r:invis', rune_regen: 'r:regen', arcane: 'r:arcane'
  };
  const statusKey = (tag) => STATUS_ICON[tag] || (tag.startsWith('stun_') ? 's' : null);

  class Renderer {
    constructor(canvas, ui) {
      this.cv = canvas; this.ctx = canvas.getContext('2d'); this.ui = ui;
      this.cam = { x: 0, y: 0 }; this.fx = []; this.floats = []; this.hits = []; this.t = 0;
      this.sprites = new G.SpriteCache();
      this.fogCv = document.createElement('canvas'); this.fogCv.width = this.fogCv.height = D.Map.SN;
      this.fogCtx = this.fogCv.getContext('2d'); this.fogImg = this.fogCtx.createImageData(D.Map.SN, D.Map.SN);
      this.nightK = 0; this.portraits = {}; this.hookFx = [];
    }
    setAssets(A) { this.A = A; }
    get S() { return this.ui.S; }
    L(o) { return o ? (o[this.ui.lang] || o.en) : ''; }

    text(s, x, y, o = {}) {
      const c = this.ctx; c.font = `${o.bold ? 'bold ' : ''}${o.size || 11}px ${o.serif ? SERIF : FONT}`; c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic';
      if (o.shadow !== false) { c.fillStyle = o.shadowColor || 'rgba(0,0,0,0.9)'; c.fillText(s, x + 1, y + 1); }
      c.fillStyle = o.color || '#fff'; c.fillText(s, x, y);
      return c.measureText(s).width;
    }
    tw(s, size = 11, bold) { const c = this.ctx; c.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`; return c.measureText(s).width; }
    wrap(s, x, y, w, o = {}) {
      const c = this.ctx; c.font = `${o.bold ? 'bold ' : ''}${o.size || 11}px ${FONT}`;
      const words = String(s).split(' '); let line = '', yy = y; const lh = o.lh || (o.size || 11) + 3;
      for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (c.measureText(t).width > w && line) { this.text(line, x, yy, o); line = wd; yy += lh; } else line = t; }
      if (line) { this.text(line, x, yy, o); yy += lh; }
      return yy;
    }
    wrapH(s, w, size = 11) { const c = this.ctx; c.font = `${size}px ${FONT}`; let n = 0, line = ''; for (const wd of String(s).split(' ')) { const t = line ? line + ' ' + wd : wd; if (c.measureText(t).width > w && line) { n++; line = wd; } else line = t; } return (n + (line ? 1 : 0)) * (size + 3); }
    stone(x, y, w, h, o = {}) {
      const c = this.ctx;
      const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, o.top || '#4a3e30'); g.addColorStop(1, o.bottom || '#1e1812');
      c.fillStyle = g; c.fillRect(x, y, w, h);
      c.fillStyle = BRONZE_D; c.fillRect(x, y, w, 2); c.fillRect(x, y + h - 2, w, 2); c.fillRect(x, y, 2, h); c.fillRect(x + w - 2, y, 2, h);
      c.fillStyle = BRONZE; c.fillRect(x + 2, y + 2, w - 4, 1); c.fillRect(x + 2, y + 2, 1, h - 4);
      c.fillStyle = '#20160c'; c.fillRect(x + 2, y + h - 3, w - 4, 1); c.fillRect(x + w - 3, y + 2, 1, h - 4);
      if (o.title) { this.text(o.title, x + w / 2, y + 18, { align: 'center', size: 15, bold: true, serif: true, color: '#f0d890' }); c.fillStyle = BRONZE_D; c.fillRect(x + 10, y + 25, w - 20, 1); }
    }
    button(x, y, w, h, label, id, o = {}) {
      const c = this.ctx, hot = this.ui.hover && this.ui.hover.id === id && (o.data === undefined || this.ui.hover.data === o.data), dis = o.disabled;
      const g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, dis ? '#3a3834' : o.active ? '#7a5a20' : hot ? '#6a5a3a' : '#4a3c2a'); g.addColorStop(1, dis ? '#1e1c1a' : o.active ? '#3a2808' : hot ? '#2e2414' : '#1c150c');
      c.fillStyle = g; c.fillRect(x, y, w, h);
      c.fillStyle = hot && !dis ? '#f0d080' : BRONZE_D; c.fillRect(x, y, w, 1); c.fillRect(x, y + h - 1, w, 1); c.fillRect(x, y, 1, h); c.fillRect(x + w - 1, y, 1, h);
      c.fillStyle = 'rgba(255,230,160,0.15)'; c.fillRect(x + 1, y + 1, w - 2, 1);
      this.text(label, x + w / 2, y + h / 2 + 1, { align: 'center', base: 'middle', size: o.size || 12, bold: true, color: dis ? '#777' : o.color || (o.active ? '#fff0c0' : hot ? '#fff' : '#e8d8b0') });
      if (!dis) this.hit(x, y, w, h, id, o.data, o.tip);
    }
    hit(x, y, w, h, id, data, tip) { this.hits.push({ x, y, w, h, id, data, tip }); }
    bar(x, y, w, h, frac, col, back = '#200808') { const c = this.ctx; c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = back; c.fillRect(x, y, w, h); const f = Math.max(0, Math.min(1, frac)); c.fillStyle = col; c.fillRect(x, y, f * w, h); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x, y, f * w, 1); }
    icon(img, x, y, w, h) { if (img) this.ctx.drawImage(img, x, y, w, h || w); }
    cooldown(x, y, w, h, frac) {
      if (frac <= 0) return; const c = this.ctx; c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      c.fillStyle = 'rgba(0,0,0,0.65)'; c.beginPath(); c.moveTo(x + w / 2, y + h / 2); c.arc(x + w / 2, y + h / 2, Math.max(w, h), -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2, false); c.closePath(); c.fill(); c.restore();
    }
    portrait(model, w, h = w, focus) { const k = model + '|' + w + 'x' + h + '|' + (focus || ''); if (!this.portraits[k]) this.portraits[k] = G.renderPortrait(model, w, h, { focus }); return this.portraits[k]; }
    rarityCol(r) { return COS.RARITY[r] ? COS.RARITY[r].color : '#c8b080'; }
    glyph(kind, x, y, col = '#e8d8b0') {
      const c = this.ctx; c.save(); c.translate(x, y); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 1.6; c.lineCap = 'round';
      if (kind === 'dmg') { c.beginPath(); c.moveTo(1, 9); c.lineTo(9, 1); c.stroke(); c.beginPath(); c.moveTo(1.5, 5.5); c.lineTo(4.5, 8.5); c.stroke(); }
      else if (kind === 'armor') { c.beginPath(); c.moveTo(1, 1); c.lineTo(9, 1); c.lineTo(9, 5); c.quadraticCurveTo(9, 8.5, 5, 10); c.quadraticCurveTo(1, 8.5, 1, 5); c.closePath(); c.fill(); c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(4.4, 2, 1.2, 7); }
      else if (kind === 'ms') { c.beginPath(); c.moveTo(2, 1); c.lineTo(5, 1); c.lineTo(5, 6); c.lineTo(9, 7.5); c.lineTo(9, 10); c.lineTo(2, 10); c.closePath(); c.fill(); c.globalAlpha = 0.6; c.fillRect(0, 3, 1.4, 1); c.fillRect(-1, 6, 2, 1); }
      c.restore();
    }
    statusIcon(st, x, y, sz) {
      const c = this.ctx, k = statusKey(st.tag), A = this.A.icons;
      c.fillStyle = '#0a0806'; c.fillRect(x, y, sz, sz);
      if (k && k[1] === ':' && k[0] === 'a' && A.abil[k.slice(2)]) c.drawImage(A.abil[k.slice(2)], x, y, sz, sz);
      else if (k && k[1] === ':' && k[0] === 'i' && A.item[k.slice(2)]) c.drawImage(A.item[k.slice(2)], 22, 0, 44, 64, x, y, sz, sz);
      else if (k && k[0] === 'r') { const col = (RUNES[k.slice(2)] || {}).color || '#fff', g = c.createRadialGradient(x + sz * 0.4, y + sz * 0.4, 1, x + sz / 2, y + sz / 2, sz / 2); g.addColorStop(0, '#fff'); g.addColorStop(0.45, col); g.addColorStop(1, '#101010'); c.fillStyle = g; c.fillRect(x, y, sz, sz); }
      else if (k === 's') { c.fillStyle = '#3a3010'; c.fillRect(x, y, sz, sz); c.fillStyle = '#ffe060'; for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.5; c.fillRect(x + sz / 2 + Math.cos(a) * sz * 0.28 - 1.5, y + sz / 2 + Math.sin(a) * sz * 0.2 - 1.5, 3, 3); } }
      else if (k === 'g') { c.fillStyle = '#103a4a'; c.fillRect(x, y, sz, sz); c.strokeStyle = '#80e0ff'; c.lineWidth = 2; c.strokeRect(x + 4, y + 4, sz - 8, sz - 8); }
      else this.text((st.tag || '?').slice(0, 2).toUpperCase(), x + sz / 2, y + sz - 5, { align: 'center', size: 8, bold: true });
    }

    sx(x, y) { return (x + y) * KX - this.cam.x; }
    sy(x, y) { return (y - x) * KY - this.cam.y; }
    toWorld(px, py) { const a = (px + this.cam.x) / KX, b = (py + this.cam.y) / KY; return [(a - b) / 2, (a + b) / 2]; }
    centerOn(x, y) {
      this.cam.x = (x + y) * KX - W / 2; this.cam.y = (y - x) * KY - (HUD_Y + TOP) / 2;
      this.clampCam();
    }
    clampCam() { this.cam.x = Math.max(-100, Math.min(2 * MAP * KX - W + 100, this.cam.x)); this.cam.y = Math.max(-MAP * KY - 60, Math.min(MAP * KY - HUD_Y + 80, this.cam.y)); }
    onScreen(x, y, m = 120) { const a = this.sx(x, y), b = this.sy(x, y); return a > -m && a < W + m && b > -m && b < HUD_Y + m * 1.5; }
    ellipse(x, y, r, fill, stroke, lw = 1) { const c = this.ctx, a = this.sx(x, y), b = this.sy(x, y); c.beginPath(); c.ellipse(a, b, r * G.S, r * G.S * 0.5, 0, 0, 7); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } }

    addFx(g, e) {
      const u = e.unit ? g.unitById(e.unit) : null;
      const x = e.x != null ? e.x : u ? u.x : 0, y = e.y != null ? e.y : u ? u.y : 0;
      const F = (o) => this.fx.push(Object.assign({ t: 0, x, y }, o));
      switch (e.kind) {
        case 'explosion': F({ type: 'explosion', dur: e.big ? 0.9 : 0.6, r: e.r || 200, big: e.big }); for (let i = 0; i < (e.big ? 24 : 12); i++) { const a = Math.random() * 6.28, sp = 150 + Math.random() * 350; F({ type: 'spark', dur: 0.6 + Math.random() * 0.5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: 200 + Math.random() * 300, z: 20, color: Math.random() < 0.5 ? '#ffb040' : '#604030' }); } break;
        case 'ring': F({ type: 'ring', dur: 0.6, r: e.r || 300, color: e.color || '#fff' }); break;
        case 'beam': F({ type: 'beam', dur: 0.4, x2: e.x2, y2: e.y2, color: e.color || '#ff4040', w: 6 }); break;
        case 'lightning': F({ type: 'lightning', dur: 0.35, x2: e.x2, y2: e.y2, color: '#a0d0ff' }); break;
        case 'laguna': F({ type: 'lightning', dur: 0.5, x2: e.x2, y2: e.y2, color: '#ff6040', w: 4 }); F({ type: 'pillar', dur: 0.6, x: e.x2, y: e.y2, color: '#ff8040' }); break;
        case 'finger': F({ type: 'beam', dur: 0.5, x2: e.x2, y2: e.y2, color: '#ff2020', w: 5, jag: true }); break;
        case 'blink': F({ type: 'burst', dur: 0.45, color: e.color || '#d0a0ff', n: 14 }); break;
        case 'nova': F({ type: 'nova', dur: 0.7, r: e.r || 425 }); break;
        case 'lsa_warn': F({ type: 'warn', dur: e.t || 0.5, r: e.r || 250, color: '#ff8020' }); break;
        case 'lsa': F({ type: 'pillar', dur: 0.7, color: '#ffa030', r: e.r || 250 }); F({ type: 'ring', dur: 0.5, r: e.r || 250, color: '#ffd060' }); break;
        case 'malefice': F({ type: 'burst', dur: 0.5, color: '#a070ff', n: 10 }); break;
        case 'eidolon': F({ type: 'burst', dur: 0.6, color: '#8050ff', n: 18 }); break;
        case 'ice_blast': F({ type: 'iceblast', dur: 0.45, r: 150 }); break;
        case 'helix': F({ type: 'helix', dur: 0.4, r: 275 }); break;
        case 'cull': F({ type: 'slash', dur: 0.5, color: '#ff3020' }); break;
        case 'poof': F({ type: 'burst', dur: 0.4, color: '#c0c0ff', n: 8 }); break;
        case 'hex': F({ type: 'burst', dur: 0.5, color: '#60ff60', n: 12 }); break;
        case 'revive': F({ type: 'pillar', dur: 1.2, color: '#ffe080' }); break;
        case 'mine_trigger': F({ type: 'warn', dur: e.dur || 1.6, r: e.r || 400, color: '#ff2020', blink: true }); break;
        case 'shrapnel_fall': for (let i = 0; i < 16; i++) { const a = Math.random() * 6.28, r = Math.random() * (e.r || 450); F({ type: 'fall', x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, dur: e.delay || 1.2, z0: 900 }); } break;
        case 'hook_back': this.hookFx.push({ t: 0, x: e.x, y: e.y, unit: e.unit, src: e.src, dur: Math.max(0.1, e.dur || 0.3) }); break;
        case 'omni_trail': F({ type: 'beam', dur: 0.3, x2: e.x2, y2: e.y2, color: '#ffffff', w: 3 }); break;
        default: F({ type: 'burst', dur: 0.4, color: '#fff', n: 6 });
      }
    }
    drawWorld(g, alpha, dt) {
      const c = this.ctx, team = this.ui.viewTeam();
      this.t += dt;
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      c.save(); c.imageSmoothingEnabled = false;
      c.setTransform(KX * TU, -KY * TU, KX * TU, KY * TU, -this.cam.x, -this.cam.y);
      c.drawImage(this.A.tex, 0, 0);
      c.restore();
      this.drawDecals(g, team);
      const list = [];
      const inter = (u) => [u.px + (u.x - u.px) * alpha, u.py + (u.y - u.py) * alpha];
      const x0 = this.toWorld(0, 0), x1 = this.toWorld(W, HUD_Y + 200);
      for (const t of g.map.trees) {
        if (!t.alive) continue; const a = this.sx(t.x, t.y), b = this.sy(t.x, t.y);
        if (a < -60 || a > W + 60 || b < -20 || b > HUD_Y + 140) continue;
        list.push({ d: t.y - t.x, kind: 'tree', t, a, b });
      }
      void x0; void x1;
      for (const u of g.units) {
        if (u.dead && (u.structure || this.ui.g.time - u.deathT > 2.2 || u.kind === 'courier' || u.kind === 'mine' || u.kind === 'hero' && !u.illusion && this.ui.g.time - u.deathT > 2.2)) { if (!u.structure) continue; }
        if (u.structure && u.dead) { list.push({ d: u.y - u.x - 60, kind: 'ruin', u }); continue; }
        if (team >= 0 && !u.vis[team] && !u.structure) continue;
        if (team >= 0 && u.team !== team && (u.kind === 'ward' || u.kind === 'mine' || u.kind === 'sign') && !u.vis[team]) continue;
        const [x, y] = u.structure ? [u.x, u.y] : inter(u);
        if (!this.onScreen(x, y, 220)) continue;
        list.push({ d: y - x, kind: 'unit', u, x, y });
      }
      for (const r of g.runes) if (this.onScreen(r.x, r.y) && (team < 0 || g.slotVisible(team, r.x, r.y))) list.push({ d: r.y - r.x, kind: 'rune', r });
      for (const dp of g.drops) if (this.onScreen(dp.x, dp.y)) list.push({ d: dp.y - dp.x, kind: 'drop', dp });
      for (const s of g.map.secret) if (this.onScreen(s[0], s[1], 200)) list.push({ d: s[1] - s[0], kind: 'static', model: 'secret_shop', x: s[0], y: s[1] });
      for (let t = 0; t < 2; t++) { const s = g.map.shop[t]; if (this.onScreen(s[0], s[1], 200)) list.push({ d: s[1] - s[0], kind: 'static', model: 'shop_' + t, x: s[0], y: s[1] }); }
      list.sort((p, q) => p.d - q.d);
      for (const it of list) if (it.kind === 'unit' && !it.u.structure && !g.isWardLike(it.u)) { const u = it.u; this.ellipse(it.x, it.y, u.r * 1.1 + 4, 'rgba(0,0,0,0.35)'); }
      for (const it of list) {
        if (it.kind === 'tree') { const t = it.t, s = this.sprites.get('tree_' + t.side + '_' + t.v, 0.8 + t.v, 'idle', 0); c.drawImage(s.cv, Math.round(it.a - s.ox), Math.round(it.b - s.oy)); }
        else if (it.kind === 'unit') this.drawUnit(g, it.u, it.x, it.y, team);
        else if (it.kind === 'ruin') { const u = it.u, a = this.sx(u.x, u.y), b = this.sy(u.x, u.y); c.fillStyle = 'rgba(30,24,20,0.8)'; c.beginPath(); c.ellipse(a, b, u.r * G.S, u.r * G.S * 0.5, 0, 0, 7); c.fill(); c.fillStyle = '#4a4038'; for (let i = 0; i < 6; i++) { const k = D.hash2(u.id, i); c.fillRect(a - 20 + k * 40, b - 6 - D.hash2(i, u.id) * 12, 6, 5); } }
        else if (it.kind === 'rune') this.drawRune(it.r);
        else if (it.kind === 'drop') this.drawDrop(it.dp);
        else if (it.kind === 'static') { const s = this.sprites.static(it.model); c.drawImage(s.cv, Math.round(this.sx(it.x, it.y) - s.ox), Math.round(this.sy(it.x, it.y) - s.oy)); }
      }
      this.drawProjectiles(g, alpha, team);
      this.drawFx(g, dt);
      if (team >= 0) this.drawFog(g, team);
      const nk = g.isNight() ? 1 : 0; this.nightK += (nk - this.nightK) * Math.min(1, dt * 0.5);
      if (this.nightK > 0.01) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(${255 - 130 * this.nightK | 0},${255 - 110 * this.nightK | 0},${255 - 40 * this.nightK | 0},1)`; c.fillRect(0, 0, W, HUD_Y); c.restore(); }
      for (const it of list) if (it.kind === 'unit') this.drawBars(g, it.u, it.x, it.y, team);
      this.drawFloats(dt);
      this.drawIndicators(g);
    }
    drawDecals(g, team) {
      const c = this.ctx, T = this.t;
      for (const a of g.areas) {
        if (!this.onScreen(a.x, a.y, a.r * 0.5 + 100)) continue;
        const sx = this.sx(a.x, a.y), sy = this.sy(a.x, a.y), rx = a.r * G.S, ry = rx * 0.5;
        c.save();
        if (a.kind === 'black_hole') {
          const gr = c.createRadialGradient(sx, sy, 2, sx, sy, rx); gr.addColorStop(0, 'rgba(0,0,0,0.95)'); gr.addColorStop(0.4, 'rgba(40,10,80,0.8)'); gr.addColorStop(1, 'rgba(120,60,220,0)');
          c.fillStyle = gr; c.beginPath(); c.ellipse(sx, sy, rx, ry, 0, 0, 7); c.fill();
          c.strokeStyle = 'rgba(200,160,255,0.7)'; c.lineWidth = 2;
          for (let k = 0; k < 4; k++) { c.beginPath(); for (let t = 0; t < 7; t += 0.15) { const r = (1 - t / 7) * rx, an = t * 1.3 - T * 4 + k * 1.57; const x = sx + Math.cos(an) * r, y = sy + Math.sin(an) * r * 0.5; t ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
          for (let k = 0; k < 20; k++) { const an = k * 2.4 - T * 3, r = ((k * 37 + T * 90) % rx); c.fillStyle = '#fff'; c.fillRect(sx + Math.cos(an) * r, sy + Math.sin(an) * r * 0.5, 2, 2); }
        } else if (a.kind === 'midnight_pulse') {
          c.fillStyle = 'rgba(60,20,120,0.28)'; c.beginPath(); c.ellipse(sx, sy, rx, ry, 0, 0, 7); c.fill();
          const p = (T * 0.8) % 1; c.strokeStyle = `rgba(180,120,255,${0.8 - p * 0.8})`; c.lineWidth = 2; c.beginPath(); c.ellipse(sx, sy, rx * p, ry * p, 0, 0, 7); c.stroke();
          c.strokeStyle = 'rgba(150,90,240,0.8)'; c.beginPath(); c.ellipse(sx, sy, rx, ry, 0, 0, 7); c.stroke();
        } else if (a.kind === 'shrapnel') {
          if (g.time >= a.start) { c.fillStyle = 'rgba(80,60,30,0.25)'; c.beginPath(); c.ellipse(sx, sy, rx, ry, 0, 0, 7); c.fill(); c.fillStyle = '#ffd060'; for (let k = 0; k < 18; k++) { const an = D.hash2(k, (T * 12) | 0) * 6.28, r = D.hash2((T * 12) | 0, k) * rx; c.fillRect(sx + Math.cos(an) * r, sy + Math.sin(an) * r * 0.5, 2, 2); } }
        } else if (a.kind === 'freezing_field') {
          c.fillStyle = 'rgba(200,230,255,0.18)'; c.beginPath(); c.ellipse(sx, sy, rx, ry, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(220,240,255,0.5)'; c.lineWidth = 1; c.stroke();
          c.fillStyle = '#fff'; for (let k = 0; k < 30; k++) { const an = D.hash2(k, 1) * 6.28 + T * 0.3, r = D.hash2(k, 2) * rx, fall = (T * 60 + k * 13) % 40; c.fillRect(sx + Math.cos(an) * r, sy + Math.sin(an) * r * 0.5 - 40 + fall, 2, 2); }
        } else if (a.kind === 'fire_trail') {
          c.fillStyle = 'rgba(255,120,20,0.35)'; c.beginPath(); c.ellipse(sx, sy, rx, ry, 0, 0, 7); c.fill();
          for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? '#ffb030' : '#ff5010'; c.beginPath(); c.ellipse(sx + Math.sin(T * 7 + k) * rx * 0.5, sy - 6 - (T * 40 + k * 7) % 16, 4, 6, 0, 0, 7); c.fill(); }
        }
        c.restore();
      }
      for (const t of g.treeRegrow) { if (!this.onScreen(t.x, t.y)) continue; c.fillStyle = '#5a3a1a'; c.beginPath(); c.ellipse(this.sx(t.x, t.y), this.sy(t.x, t.y), 4, 2.5, 0, 0, 7); c.fill(); }
      for (const h of g.heroes) if (h.tpCh && (team < 0 || h.team === team || g.slotVisible(team, h.tpCh.x, h.tpCh.y))) { const p = h.tpCh.t / h.tpCh.dur; this.ellipse(h.tpCh.x, h.tpCh.y, 120, `rgba(120,200,255,${0.2 + p * 0.3})`, '#a0e0ff', 2); this.ellipse(h.x, h.y, 80 + Math.sin(this.t * 10) * 10, null, '#a0e0ff', 2); }
      for (const s of g.scans) if (s.scan && s.team === team) { this.ellipse(s.x, s.y, s.r, s.found ? 'rgba(255,60,40,0.15)' : 'rgba(80,200,255,0.12)', s.found ? '#ff6040' : '#60c0ff', 2); }
    }
    modelOf(u) {
      switch (u.kind) {
        case 'hero': return this.ui.skinOf(u);
        case 'creep': return 'creep_' + u.creepType + '_' + u.team;
        case 'neutral': return u.ntype;
        case 'roshan': return 'roshan';
        case 'courier': return u.flying ? 'courier_fly' : 'courier';
        case 'eidolon': return 'eidolon';
        case 'ward': return u.wardType === 'obs' ? 'ward_obs' : 'ward_sentry';
        case 'mine': return 'mine_' + (u.mineType || 'land');
        case 'sign': return 'sign';
        case 'hward': return 'hward';
        case 'tower': return `tower_${u.team}_${u.tier}`;
        case 'rax': return `rax_${u.team}_${u.raxType}`;
        case 'ancient': return 'ancient_' + u.team;
        case 'fountain': return 'fountain_' + u.team;
      }
      return 'kobold';
    }
    drawUnit(g, u, x, y, team) {
      const c = this.ctx, a = this.sx(x, y), b0 = this.sy(x, y), z = u.z || 0, b = b0 - z * KZ;
      const m = this.modelOf(u);
      let anim = 'idle', t = (this.t * 0.6 + u.id * 0.37) % 1, face = u.face;
      const now = g.time;
      if (u.structure) { anim = 'idle'; face = Math.PI * 0.75; t = 0; }
      else if (u.dead) anim = 'idle';
      else if (u.status.some(s => s.spin)) { anim = 'spin'; t = (this.t * 3) % 1; }
      else if (now - (u.anim.castT || -9) < 0.45) { anim = 'cast'; t = (now - u.anim.castT) / 0.45; }
      else if (now - (u.anim.atkT || -9) < Math.min(0.8, u.st.bat / (u.st.as / 100))) { anim = 'attack'; t = (now - u.anim.atkT) / Math.min(0.8, u.st.bat / (u.st.as / 100)); }
      else if (u.anim.moving) { anim = 'walk'; t = (u.anim.walk / (u.kind === 'hero' ? 110 : 90)) % 1; }
      if (u.anim.spinT && now - u.anim.spinT < 0.4) { anim = 'spin'; t = (now - u.anim.spinT) / 0.4; }
      if (u.status.some(s => s.hex)) { this.drawFrog(a, b); return; }
      const s = this.sprites.get(m, face, anim, t); if (!s) return;
      c.save();
      if (u.dead) { const k = Math.min(1, (now - u.deathT) / 2); c.globalAlpha = 1 - k; c.translate(0, k * 8); }
      if (team >= 0 && u.team === team && (g.isInvisible(u) || u.status.some(s2 => s2.invis && s2.fadeAt <= now))) c.globalAlpha *= 0.45;
      if (u.illusion && team === u.team) c.globalAlpha *= 0.75;
      c.drawImage(s.cv, Math.round(a - s.ox), Math.round(b - s.oy));
      if (u.illusion && team === u.team) { c.globalCompositeOperation = 'source-atop'; }
      c.restore();
      const top = b - s.h - 6;
      for (const st of u.status) {
        if (st.stun || st.bh) { for (let i = 0; i < 3; i++) { const an = this.t * 5 + i * 2.1; c.fillStyle = '#ffe060'; c.fillRect(a + Math.cos(an) * 10 - 1.5, top + 4 + Math.sin(an) * 3, 3, 3); } }
        if (st.frozenFx) { c.fillStyle = 'rgba(160,220,255,0.45)'; c.strokeStyle = '#e0f8ff'; c.beginPath(); c.moveTo(a - 12, b); c.lineTo(a - 14, top + 14); c.lineTo(a, top + 6); c.lineTo(a + 14, top + 14); c.lineTo(a + 12, b); c.closePath(); c.fill(); c.stroke(); }
        if (st.malefice) { c.strokeStyle = 'rgba(180,140,255,0.8)'; c.beginPath(); c.ellipse(a, b - 4, 16 + Math.sin(this.t * 6) * 3, 7, 0, 0, 7); c.stroke(); }
        if (st.rot) { c.fillStyle = 'rgba(110,150,40,0.22)'; for (let i = 0; i < 5; i++) { const an = this.t * 1.5 + i * 1.3; c.beginPath(); c.ellipse(a + Math.cos(an) * 30, b - 6 + Math.sin(an) * 12, 22, 11, 0, 0, 7); c.fill(); } }
        if (st.immune && !st.spin) { c.strokeStyle = 'rgba(255,210,80,0.7)'; c.lineWidth = 2; c.beginPath(); c.ellipse(a, (b + top) / 2 + 6, 16, (b - top) / 2, 0, 0, 7); c.stroke(); }
        if (st.chill) { c.fillStyle = 'rgba(150,210,255,0.35)'; c.beginPath(); c.ellipse(a, b - 2, 14, 6, 0, 0, 7); c.fill(); }
        if (st.taunt) { c.fillStyle = '#ff3020'; c.font = 'bold 12px ' + FONT; c.textAlign = 'center'; c.fillText('!', a, top + 2); }
        if (st.silence) { c.strokeStyle = '#c080ff'; c.lineWidth = 2; c.beginPath(); c.arc(a, top + 2, 5, 0, 7); c.moveTo(a - 4, top - 2); c.lineTo(a + 4, top + 6); c.stroke(); }
        if (st.crosshair) { c.strokeStyle = '#ff2020'; c.lineWidth = 1.5; c.beginPath(); c.arc(a, b - 20, 14, 0, 7); c.moveTo(a - 20, b - 20); c.lineTo(a + 20, b - 20); c.moveTo(a, b - 40); c.lineTo(a, b); c.stroke(); }
        if (st.glow && !u.dead) { c.fillStyle = 'rgba(255,80,30,0.25)'; c.beginPath(); c.ellipse(a, b - 20, 20, 30, 0, 0, 7); c.fill(); }
      }
      if (u.kind === 'mine' && u.revealed && ((this.t * 8) | 0) % 2) { c.fillStyle = '#ff2020'; c.beginPath(); c.arc(a, b - 5, 4, 0, 7); c.fill(); }
      if (u.channel) { c.strokeStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.arc(a, top, 8, -Math.PI / 2, -Math.PI / 2 + 6.28 * (1 - u.channel.t / u.channel.dur)); c.stroke(); }
      if (u.channel && u.channel.beam) { const t2 = g.unitById(u.channel.beam); if (t2) { c.strokeStyle = 'rgba(80,140,255,0.8)'; c.lineWidth = 3; c.beginPath(); c.moveTo(a, top + 10); c.lineTo(this.sx(t2.x, t2.y), this.sy(t2.x, t2.y) - 30); c.stroke(); } }
      u._sy = top; u._sx = a;
    }
    drawFrog(a, b) { const c = this.ctx; c.fillStyle = '#50b030'; c.beginPath(); c.ellipse(a, b - 6, 10, 7, 0, 0, 7); c.fill(); c.beginPath(); c.arc(a - 5, b - 13, 3.5, 0, 7); c.arc(a + 5, b - 13, 3.5, 0, 7); c.fill(); c.fillStyle = '#000'; c.fillRect(a - 6, b - 14, 2, 2); c.fillRect(a + 4, b - 14, 2, 2); }
    drawRune(r) {
      const c = this.ctx, a = this.sx(r.x, r.y), b = this.sy(r.x, r.y) - 18 - Math.sin(this.t * 3) * 4, col = RUNES[r.kind].color;
      const gr = c.createRadialGradient(a - 3, b - 3, 1, a, b, 12); gr.addColorStop(0, '#fff'); gr.addColorStop(0.4, col); gr.addColorStop(1, 'rgba(0,0,0,0.2)');
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(a, this.sy(r.x, r.y), 10, 4, 0, 0, 7); c.fill();
      c.fillStyle = gr; c.beginPath(); c.arc(a, b, 10, 0, 7); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(a, b, 13 + Math.sin(this.t * 5) * 2, 0, 7); c.stroke();
    }
    drawDrop(d) {
      const c = this.ctx, a = this.sx(d.x, d.y), b = this.sy(d.x, d.y), ic = this.A.icons.item[d.item.id];
      c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(a, b, 14, 6, 0, 0, 7); c.fill();
      if (ic) c.drawImage(ic, a - 11, b - 22 - Math.sin(this.t * 2) * 2, 22, 16);
      if (d.item.id === 'aegis') { c.strokeStyle = 'rgba(255,220,120,0.8)'; c.beginPath(); c.arc(a, b - 14, 16 + Math.sin(this.t * 4) * 2, 0, 7); c.stroke(); }
    }
    drawProjectiles(g, alpha, team) {
      const c = this.ctx;
      for (const p of g.projectiles) {
        const x = p.px != null ? p.px + (p.x - p.px) * alpha : p.x, y = p.py != null ? p.py + (p.y - p.py) * alpha : p.y;
        if (!this.onScreen(x, y)) continue;
        if (team >= 0 && p.team !== team && !g.slotVisible(team, x, y)) continue;
        const a = this.sx(x, y); let z = p.z || 50;
        if (p.arc && p.len) z = 30 + Math.sin(Math.PI * Math.min(1, (p.travel || 0) / p.len)) * p.arc;
        const b = this.sy(x, y) - z * KZ;
        switch (p.kind) {
          case 'attack': {
            const col = { techies: '#303030', crystal_maiden: '#b0f0ff', sniper: '#ffe080', lina: '#ff8020', lion: '#ff4020', tower: '#80ffa0', fountain: '#ffffff' }[p.hid] || (p.team === 0 ? '#c0ff80' : '#ff6060');
            if (p.hid === 'sniper') { const ang = p.ang || 0; c.strokeStyle = '#ffe080'; c.lineWidth = 2; c.beginPath(); c.moveTo(a, b); c.lineTo(a - Math.cos(ang) * 12 * KX * 4, b); c.stroke(); break; }
            if (p.hid === 'tower' || p.src && p.src.kind === 'tower') { c.fillStyle = p.team === 0 ? '#80ffb0' : '#ff5030'; c.beginPath(); c.arc(a, b, 5, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(a, b, 2, 0, 7); c.fill(); break; }
            c.fillStyle = col; c.beginPath(); c.arc(a, b, p.hid === 'techies' ? 4 : 3, 0, 7); c.fill();
            if (p.hid === 'techies') { c.fillStyle = '#ffb020'; c.fillRect(a + 2, b - 5, 2, 2); }
            break;
          }
          case 'hammer': c.fillStyle = '#a0c0ff'; c.beginPath(); c.arc(a, b, 7, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.stroke(); break;
          case 'assassinate': c.strokeStyle = '#ffd040'; c.lineWidth = 3; c.beginPath(); c.moveTo(a, b); c.lineTo(a - Math.cos(p.ang || 0) * 20, b - Math.sin(p.ang || 0) * 10); c.stroke(); break;
          case 'dragon_slave': case 'wave': {
            const ang = p.ang, px = -Math.sin(ang), py = Math.cos(ang), wd = (p.width || 200) / 2;
            for (let k = -2; k <= 2; k++) { const wx = x + px * wd * k / 2, wy = y + py * wd * k / 2, sa = this.sx(wx, wy), sb = this.sy(wx, wy) - 18; c.fillStyle = k % 2 ? '#ffd040' : '#ff5010'; c.beginPath(); c.ellipse(sa, sb - Math.sin(this.t * 20 + k) * 4, 9, 14, 0, 0, 7); c.fill(); }
            break;
          }
          case 'earth_spike': {
            for (let k = 0; k < 6; k++) { const back = k * 60; const wx = x - Math.cos(p.ang) * back, wy = y - Math.sin(p.ang) * back; if ((p.travel || 0) < back) break; const sa = this.sx(wx, wy), sb = this.sy(wx, wy); c.fillStyle = k % 2 ? '#8a6a4a' : '#a08060'; c.beginPath(); c.moveTo(sa - 7, sb); c.lineTo(sa, sb - 26 + k * 3); c.lineTo(sa + 7, sb); c.fill(); }
            break;
          }
          case 'hook': {
            const src = p.src; if (src) { const sa = this.sx(src.x, src.y), sb = this.sy(src.x, src.y) - 30; c.strokeStyle = '#888'; c.setLineDash([4, 3]); c.lineWidth = 2; c.beginPath(); c.moveTo(sa, sb); c.lineTo(a, b); c.stroke(); c.setLineDash([]); }
            c.strokeStyle = '#d0d0d8'; c.lineWidth = 3; c.beginPath(); c.arc(a, b, 5, 0, Math.PI * 1.3); c.stroke(); break;
          }
          default: c.fillStyle = '#fff'; c.beginPath(); c.arc(a, b, 4, 0, 7); c.fill();
        }
      }
      for (let i = this.hookFx.length - 1; i >= 0; i--) {
        const hf = this.hookFx[i]; hf.t += 1 / 60; if (hf.t > hf.dur + 0.05) { this.hookFx.splice(i, 1); continue; }
        const src = g.unitById(hf.src); if (!src) continue; const u = hf.unit ? g.unitById(hf.unit) : null;
        const k = Math.min(1, hf.t / hf.dur), hx = u ? u.x : hf.x + (src.x - hf.x) * k, hy = u ? u.y : hf.y + (src.y - hf.y) * k;
        c.strokeStyle = '#999'; c.setLineDash([4, 3]); c.lineWidth = 2; c.beginPath(); c.moveTo(this.sx(src.x, src.y), this.sy(src.x, src.y) - 30); c.lineTo(this.sx(hx, hy), this.sy(hx, hy) - 20); c.stroke(); c.setLineDash([]);
      }
    }
    drawFx(g, dt) {
      const c = this.ctx;
      for (let i = this.fx.length - 1; i >= 0; i--) {
        const f = this.fx[i]; f.t += dt; const k = f.t / f.dur; if (k >= 1) { this.fx.splice(i, 1); continue; }
        if (!this.onScreen(f.x, f.y, 300)) continue;
        const a = this.sx(f.x, f.y), b = this.sy(f.x, f.y);
        c.save();
        switch (f.type) {
          case 'explosion': { const r = f.r * G.S * (0.3 + k * 0.7); const gr = c.createRadialGradient(a, b - 10, 2, a, b - 10, r); gr.addColorStop(0, `rgba(255,255,200,${1 - k})`); gr.addColorStop(0.4, `rgba(255,140,30,${0.9 - k})`); gr.addColorStop(1, 'rgba(80,20,0,0)'); c.fillStyle = gr; c.beginPath(); c.ellipse(a, b - 10, r, r * 0.7, 0, 0, 7); c.fill(); c.fillStyle = `rgba(40,30,20,${0.5 * (1 - k)})`; c.beginPath(); c.ellipse(a, b - 20 - k * 40, r * 0.6, r * 0.4, 0, 0, 7); c.fill(); break; }
          case 'spark': { f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt; f.vz -= 900 * dt; if (f.z < 0) f.z = 0; c.fillStyle = f.color; c.fillRect(this.sx(f.x, f.y), this.sy(f.x, f.y) - f.z * KZ, 3, 3); break; }
          case 'ring': { c.strokeStyle = f.color; c.globalAlpha = 1 - k; c.lineWidth = 3; c.beginPath(); c.ellipse(a, b, f.r * G.S * k, f.r * G.S * 0.5 * k, 0, 0, 7); c.stroke(); break; }
          case 'beam': case 'lightning': {
            const a2 = this.sx(f.x2, f.y2), b2 = this.sy(f.x2, f.y2) - 30; c.strokeStyle = f.color; c.globalAlpha = 1 - k; c.lineWidth = f.w || 2; c.beginPath(); c.moveTo(a, b - 30);
            if (f.type === 'lightning' || f.jag) { const n = 8; for (let j = 1; j < n; j++) { const t = j / n; c.lineTo(a + (a2 - a) * t + (Math.random() - 0.5) * 16, b - 30 + (b2 - b + 30) * t + (Math.random() - 0.5) * 16); } }
            c.lineTo(a2, b2); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 1; c.stroke(); break;
          }
          case 'burst': { c.fillStyle = f.color; c.globalAlpha = 1 - k; for (let j = 0; j < f.n; j++) { const an = j / f.n * 6.28, r = 8 + k * 40; c.fillRect(a + Math.cos(an) * r, b - 20 + Math.sin(an) * r * 0.5 - k * 20, 3, 3); } break; }
          case 'nova': { const r = f.r * G.S * Math.min(1, k * 2); c.fillStyle = `rgba(180,230,255,${0.5 * (1 - k)})`; c.beginPath(); c.ellipse(a, b, r, r * 0.5, 0, 0, 7); c.fill(); c.strokeStyle = `rgba(255,255,255,${1 - k})`; c.lineWidth = 2; c.stroke(); for (let j = 0; j < 10; j++) { const an = j * 0.63; c.fillStyle = '#e0f8ff'; c.beginPath(); c.moveTo(a + Math.cos(an) * r * 0.8, b + Math.sin(an) * r * 0.4); c.lineTo(a + Math.cos(an) * r * 0.8 - 3, b + Math.sin(an) * r * 0.4 - 12 * (1 - k)); c.lineTo(a + Math.cos(an) * r * 0.8 + 3, b + Math.sin(an) * r * 0.4); c.fill(); } break; }
          case 'warn': { if (f.blink && ((f.t * 8) | 0) % 2) break; c.strokeStyle = f.color; c.lineWidth = 2; c.globalAlpha = 0.8; c.beginPath(); c.ellipse(a, b, f.r * G.S, f.r * G.S * 0.5, 0, 0, 7); c.stroke(); c.globalAlpha = 0.15 + k * 0.2; c.fillStyle = f.color; c.fill(); break; }
          case 'pillar': { const r = (f.r || 120) * G.S; const gr = c.createLinearGradient(0, b - 160, 0, b); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, f.color); c.globalAlpha = 1 - k; c.fillStyle = gr; c.fillRect(a - r * 0.5, b - 160, r, 160); c.beginPath(); c.ellipse(a, b, r * 0.8, r * 0.4, 0, 0, 7); c.fill(); break; }
          case 'iceblast': { c.globalAlpha = 1 - k; c.fillStyle = '#e8f8ff'; for (let j = 0; j < 6; j++) { const an = j + f.x; c.fillRect(a + Math.cos(an) * k * 30, b - 10 + Math.sin(an) * k * 15 - (1 - k) * 20, 3, 3); } c.strokeStyle = 'rgba(200,240,255,0.7)'; c.beginPath(); c.ellipse(a, b, f.r * G.S * k, f.r * G.S * 0.5 * k, 0, 0, 7); c.stroke(); break; }
          case 'helix': { c.strokeStyle = `rgba(255,220,200,${1 - k})`; c.lineWidth = 3; c.beginPath(); c.ellipse(a, b - 20, f.r * G.S, f.r * G.S * 0.5, 0, k * 6, k * 6 + 4); c.stroke(); break; }
          case 'slash': { c.strokeStyle = f.color; c.lineWidth = 4; c.globalAlpha = 1 - k; c.beginPath(); c.moveTo(a - 30, b - 60); c.lineTo(a + 30, b); c.stroke(); break; }
          case 'fall': { const zz = f.z0 * (1 - k); c.fillStyle = '#ffd060'; c.fillRect(a, b - zz * KZ, 2, 6); break; }
        }
        c.restore();
      }
    }
    drawFog(g, team) {
      const v = g.vis[team], d = this.fogImg.data, n = v.length;
      if (this._fogTick !== g.tickN) {
        this._fogTick = g.tickN;
        for (let i = 0; i < n; i++) { const o = i * 4; d[o] = 6; d[o + 1] = 8; d[o + 2] = 14; d[o + 3] = v[i] ? 0 : 150; }
        this.fogCtx.putImageData(this.fogImg, 0, 0);
      }
      const c = this.ctx, s = D.Map.SLOT;
      c.save(); c.imageSmoothingEnabled = true;
      c.setTransform(KX * s, -KY * s, KX * s, KY * s, -this.cam.x, -this.cam.y);
      c.drawImage(this.fogCv, 0, 0);
      c.restore();
    }
    drawBars(g, u, x, y, team) {
      if (u.dead || u.kind === 'fountain' || g.isWardLike(u) && u.kind !== 'hward') return;
      const c = this.ctx, a = this.sx(x, y), top = u._sy != null ? u._sy : this.sy(x, y) - 40;
      const own = this.ui.player && u.id === this.ui.player.id, ally = team < 0 ? u.team === 0 : u.team === team;
      const col = u.team === 2 ? '#e0c040' : own ? '#40ff40' : ally ? '#30b030' : '#e03030';
      if (u.kind === 'hero') {
        const w = 62; this.bar(a - w / 2, top - 8, w, 6, u.hp / u.maxHp, col);
        c.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 250; i < u.maxHp; i += 250) { const xx = a - w / 2 + w * i / u.maxHp; c.fillRect(xx, top - 8, 1, 6); }
        this.bar(a - w / 2, top - 1, w, 2, u.maxMp ? u.mp / u.maxMp : 0, '#3a7aff', '#101830');
        c.fillStyle = '#1a1208'; c.fillRect(a - w / 2 - 14, top - 9, 13, 11); c.strokeStyle = BRONZE_D; c.strokeRect(a - w / 2 - 14.5, top - 9.5, 14, 12);
        this.text(String(u.level), a - w / 2 - 7.5, top - 0.5, { align: 'center', size: 9, bold: true, color: '#f0d890' });
        if (this.ui.options.names || u.illusion === undefined) this.text(u.name.replace(' [BOT]', ''), a, top - 12, { align: 'center', size: 9, color: PCOL[g.heroes.indexOf(u) % 10] || '#fff' });
      } else if (u.structure) {
        const w = u.kind === 'ancient' ? 110 : u.kind === 'rax' ? 80 : 70; this.bar(a - w / 2, top - 4, w, 5, u.hp / u.maxHp, col);
        if (u.glyphT > g.time) { c.strokeStyle = '#80e0ff'; c.lineWidth = 2; c.strokeRect(a - w / 2 - 2, top - 6, w + 4, 9); }
      } else if (this.ui.options.creepHp || u.hp < u.maxHp) {
        const w = u.kind === 'roshan' ? 70 : u.kind === 'courier' ? 30 : 34; this.bar(a - w / 2, top - 3, w, 3, u.hp / u.maxHp, col);
      }
    }
    drawFloats(dt) {
      for (let i = this.floats.length - 1; i >= 0; i--) {
        const f = this.floats[i]; f.t += dt; if (f.t > (f.dur || 1.1)) { this.floats.splice(i, 1); continue; }
        const k = f.t / (f.dur || 1.1), a = this.sx(f.x, f.y), b = this.sy(f.x, f.y) - 50 - k * 30;
        this.ctx.globalAlpha = 1 - k * k;
        this.text(f.text, a + (f.dx || 0), b, { align: 'center', size: f.big ? 15 : 11, bold: true, color: f.color });
        this.ctx.globalAlpha = 1;
      }
    }
    drawIndicators(g) {
      const ui = this.ui, p = ui.player, c = this.ctx;
      if (ui.clickMark) { const m = ui.clickMark; m.t += 1 / 60; if (m.t > 0.5) ui.clickMark = null; else { this.ellipse(m.x, m.y, 40 * (1 - m.t * 1.5) + 10, null, m.attack ? '#ff4040' : '#60ff60', 2); } }
      if (!p || p.dead) return;
      const tg = ui.targeting;
      if (tg) {
        const [wx, wy] = this.toWorld(ui.mx, ui.my);
        let range = 0, aoe = 0;
        if (tg.kind === 'ability') { range = g.abRange(p, tg.slot); aoe = ui.aoeOf(p, tg.slot); }
        else if (tg.kind === 'item') { const it = g.itemIn(p, tg.slot); range = it ? (ITEMS[it.id].range || 0) : 0; if (it && it.id === 'tp') range = 0; }
        else if (tg.kind === 'attackMove') range = p.st.range;
        if (range) this.ellipse(p.x, p.y, range, 'rgba(120,200,255,0.06)', 'rgba(140,210,255,0.6)', 1.5);
        if (aoe) this.ellipse(wx, wy, aoe, 'rgba(255,220,120,0.12)', '#ffd070', 1.5);
        if (tg.kind === 'ability' && ['meat_hook', 'dragon_slave', 'earth_spike'].includes(g.ability(p, tg.slot).key)) {
          const len = g.ability(p, tg.slot).key === 'meat_hook' ? g.av(p, 0, 'len') : g.av(p, tg.slot, 'len'), ang = Math.atan2(wy - p.y, wx - p.x);
          c.strokeStyle = 'rgba(255,220,120,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(this.sx(p.x, p.y), this.sy(p.x, p.y)); c.lineTo(this.sx(p.x + Math.cos(ang) * len, p.y + Math.sin(ang) * len), this.sy(p.x + Math.cos(ang) * len, p.y + Math.sin(ang) * len)); c.stroke();
        }
      }
      this.ellipse(p.x, p.y, p.r + 16, null, 'rgba(80,255,80,0.8)', 1.5);
      if (ui.hoverUnit && !ui.hoverUnit.dead) this.ellipse(ui.hoverUnit.x, ui.hoverUnit.y, ui.hoverUnit.r + 14, null, ui.hoverUnit.team === p.team ? 'rgba(80,255,80,0.6)' : 'rgba(255,80,60,0.8)', 1.5);
    }

    drawTopBar(g) {
      const c = this.ctx, ui = this.ui, TH = 34;
      const gr = c.createLinearGradient(0, 0, 0, TH); gr.addColorStop(0, '#3a2e22'); gr.addColorStop(1, '#140e08');
      c.fillStyle = gr; c.beginPath(); c.moveTo(34, 0); c.lineTo(766, 0); c.lineTo(760, TH); c.lineTo(40, TH); c.closePath(); c.fill();
      c.strokeStyle = BRONZE_D; c.lineWidth = 1; c.beginPath(); c.moveTo(40.5, TH - 0.5); c.lineTo(759.5, TH - 0.5); c.stroke(); c.fillStyle = 'rgba(255,220,160,0.12)'; c.fillRect(40, TH - 2, 720, 1);
      c.fillStyle = '#0e0a06'; c.fillRect(356, 0, 88, TH + 6); c.strokeStyle = BRONZE; c.strokeRect(356.5, -0.5, 87, TH + 6);
      const t = Math.abs(g.time), mm = Math.floor(t / 60), ss = Math.floor(t % 60);
      this.text((g.time < 0 ? '-' : '') + mm + ':' + String(ss).padStart(2, '0'), 400, 16, { align: 'center', size: 14, bold: true, color: '#f0e0b0' });
      const night = g.isNight(); c.fillStyle = night ? '#a0b0ff' : '#ffd040'; c.beginPath(); c.arc(400, 30, 5, 0, 7); c.fill(); if (night) { c.fillStyle = '#0e0a06'; c.beginPath(); c.arc(402, 29, 4.5, 0, 7); c.fill(); }
      this.hit(356, 0, 88, 38, 'clock', null, night ? this.S.night : this.S.day);
      this.text(String(g.teamStats[0].kills), 348, 23, { align: 'right', size: 18, bold: true, color: TEAMC[0], serif: true });
      this.text(String(g.teamStats[1].kills), 452, 23, { size: 18, bold: true, color: TEAMC[1], serif: true });
      const view = ui.viewTeam(), myTeam = ui.player ? ui.player.team : 0;
      for (let tm = 0; tm < 2; tm++) {
        const hs = g.heroes.filter(h => h.team === tm && !h.illusion);
        hs.forEach((h, i) => {
          const x = tm === 0 ? 304 - (i + 1) * 52 : 496 + i * 52, y = 2, w = 50, ih = 26;
          const vis = view < 0 || h.team === view || h.vis[view];
          c.save(); if (h.dead) c.filter = 'grayscale(1) brightness(0.55)';
          c.drawImage(this.portrait(ui.skinOf(h), w, ih), x, y); c.restore();
          c.fillStyle = PCOL[g.heroes.indexOf(h) % 10]; c.fillRect(x, y + ih, w, 2);
          if (h.dead) this.text(String(Math.ceil(h.respawnT - g.time)), x + w / 2, y + 18, { align: 'center', size: 14, bold: true, color: '#ff6a5a' });
          else if (vis) { c.fillStyle = '#000'; c.fillRect(x, y + ih + 2, w, 3); c.fillStyle = tm === 0 ? '#40d040' : '#e04030'; c.fillRect(x, y + ih + 2, w * h.hp / h.maxHp, 3); }
          if (h.team === myTeam && h.ranks[3] && h.cds[3] <= 0 && !h.dead) { c.fillStyle = '#000'; c.beginPath(); c.arc(x + w - 5, y + 5, 4, 0, 7); c.fill(); c.fillStyle = '#80c8ff'; c.beginPath(); c.arc(x + w - 5, y + 5, 3, 0, 7); c.fill(); }
          const me = ui.player && h.id === ui.player.id; c.strokeStyle = me ? '#f0e080' : '#000'; c.lineWidth = me ? 2 : 1; c.strokeRect(x - 0.5, y - 0.5, w + 1, ih + 6); c.lineWidth = 1;
          this.hit(x, y, w, ih + 5, 'topHero', h.id, h.name.replace(' [BOT]', '') + ' — ' + this.L(h.def.name) + ' (' + this.S.level + ' ' + h.level + ')');
        });
      }
    }
    drawHUD(g) {
      const c = this.ctx, ui = this.ui, p = ui.player, S = this.S;
      if (!this.hudBg) this.hudBg = this.makeHudBg();
      c.drawImage(this.hudBg, 0, HUD_Y);
      this.drawMinimap(g);
      this.button(6, 578, 64, 18, S.glyph + (g.glyphCd[ui.team()] > g.time ? ' ' + Math.ceil(g.glyphCd[ui.team()] - g.time) : ''), 'glyph', { size: 10, disabled: !p || g.glyphCd[p.team] > g.time, tip: S.glyph + ' (Alt+G): 5 ' + S.sec });
      this.button(74, 578, 60, 18, S.scan + (g.scanCd[ui.team()] > g.time ? ' ' + Math.ceil(g.scanCd[ui.team()] - g.time) : ''), 'scan', { size: 10, disabled: !p || g.scanCd[p.team] > g.time || g.time < 0, active: ui.targeting && ui.targeting.kind === 'scan' });
      if (!p) { this.text(S.spectate, 400, 452, { align: 'center', size: 12, bold: true, serif: true, color: '#e8d8b0' }); this.drawSpectatorList(g); return; }
      const cr = p.courier;
      this.button(138, 578, 68, 18, S.courier + (cr.dead ? ' ✝' : ''), 'courier', { size: 10, disabled: cr.dead, tip: S.deliver + ' (F3)', active: cr.state === 'deliver' || cr.state === 'secret' });
      c.fillStyle = '#000'; c.fillRect(214, 466, 64, 64); c.drawImage(this.portrait(this.ui.skinOf(p), 60, 60), 216, 468); c.strokeStyle = BRONZE; c.strokeRect(215.5, 467.5, 61, 61);
      this.hit(216, 468, 60, 60, 'portrait', null, null);
      if (p.dead) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(216, 468, 60, 60); this.text(String(Math.ceil(p.respawnT - g.time)), 246, 505, { align: 'center', size: 20, bold: true, color: '#ff5050', serif: true }); }
      c.fillStyle = '#140e08'; c.beginPath(); c.arc(270, 522, 10, 0, 7); c.fill(); c.strokeStyle = BRONZE; c.lineWidth = 1.5; c.stroke(); c.lineWidth = 1;
      this.text(String(p.level), 270, 526, { align: 'center', size: 11, bold: true, color: '#ffe090' });
      const dmgA = Math.round((p.st.dmgMin + p.st.dmgMax) / 2), bonus = Math.round(p.st.dmgBonus || 0);
      this.glyph('dmg', 283, 471); this.text(dmgA + (bonus ? ' +' + bonus : ''), 297, 480, { size: 11, color: '#f0e0c0' }); this.hit(280, 470, 64, 13, 'stat', 'dmg', S.damage + ': ' + Math.round(p.st.dmgMin) + '–' + Math.round(p.st.dmgMax) + (bonus ? ' +' + bonus : '') + ' • ' + S.attackSpeed + ' ' + Math.round(p.st.as) + ' • ' + S.range + ' ' + Math.round(p.st.range));
      this.glyph('armor', 283, 487); this.text(p.st.armor.toFixed(1), 297, 496, { size: 11, color: '#f0e0c0' }); this.hit(280, 486, 64, 13, 'stat', 'armor', S.armor + ' ' + p.st.armor.toFixed(1) + ' • ' + S.mr + ' ' + Math.round(p.st.mr * 100) + '%');
      this.glyph('ms', 283, 503); this.text(String(Math.round(p.st.ms)), 297, 512, { size: 11, color: '#f0e0c0' }); this.hit(280, 502, 64, 13, 'stat', 'ms', S.ms + ' ' + Math.round(p.st.ms));
      this.text(this.L(p.def.name), 216, 541, { size: 11, bold: true, color: '#f0d890' });
      const xp0 = DD.XP_TABLE[p.level - 1] || 0, xp1 = DD.XP_TABLE[p.level] || xp0;
      this.bar(216, 547, 124, 6, p.level >= DD.MAX_LEVEL ? 1 : (p.xp - xp0) / Math.max(1, xp1 - xp0), '#c89a30', '#201608');
      this.hit(216, 544, 124, 10, 'stat', 'xp', S.level + ' ' + p.level + (p.level >= DD.MAX_LEVEL ? '' : ' • ' + Math.floor(p.xp - xp0) + ' / ' + (xp1 - xp0)));
      const at = [['STR', p.str, '#ff5a3a', 'str'], ['AGI', p.agi, '#4ade4a', 'agi'], ['INT', p.int, '#4aa8ff', 'int']];
      at.forEach(([n, v, col, k], i) => { const x = 216 + i * 43; this.text(n, x, 570, { size: 9, bold: true, color: p.def.attr === k ? '#fff' : col }); this.text(String(Math.floor(v)), x + 20, 570, { size: 11, bold: true, color: col }); if (p.def.attr === k) { c.fillStyle = col; c.fillRect(x, 572, 40, 1); } });
      this.text(S.gold, 216, 590, { size: 10, color: '#c8b080' }); this.text(String(g.goldOf(p)), 256, 590, { size: 12, bold: true, color: '#ffd040' });
      const canT = p.talents.some((ch, i) => g.canTalent(p, i));
      c.drawImage(this.A.icons.abil.talent, 348, 470, 22, 48); if (canT && ((this.t * 3) | 0) % 2) { c.strokeStyle = '#ffe060'; c.lineWidth = 2; c.strokeRect(347, 469, 24, 50); c.lineWidth = 1; }
      this.hit(348, 470, 22, 48, 'talents', null, S.talents + ' (U)');
      for (let s = 0; s < 4; s++) this.drawAbilitySlot(g, p, s, 374 + s * 52, 470, 48);
      g.extraSlots(p).forEach((s, i) => this.drawAbilitySlot(g, p, s, 582, 470 + i * 25, 22));
      this.bar(348, 530, 230, 13, p.hp / p.maxHp, '#3ab03a', '#102010'); this.text(Math.ceil(p.hp) + ' / ' + Math.ceil(p.maxHp), 463, 541, { align: 'center', size: 10, bold: true }); this.text('+' + p.st.hpr.toFixed(1), 575, 541, { align: 'right', size: 9, color: '#a0ffa0' });
      this.bar(348, 546, 230, 11, p.maxMp ? p.mp / p.maxMp : 0, '#3a6ae0', '#101830'); this.text(Math.ceil(p.mp) + ' / ' + Math.ceil(p.maxMp), 463, 556, { align: 'center', size: 9, bold: true }); this.text('+' + p.st.mpr.toFixed(1), 575, 556, { align: 'right', size: 9, color: '#a0c0ff' });
      let bx = 348; for (const st of p.status) { if (!st.buff && !st.debuff || st.t > 1e6 && !st.rot) continue; if (bx > 560) break; this.statusIcon(st, bx, 561, 18); if (st.dur && st.t < 1e5) this.cooldown(bx, 561, 18, 18, 1 - st.t / st.dur); c.strokeStyle = st.debuff ? '#ff5a4a' : '#7ae07a'; c.lineWidth = 1.5; c.strokeRect(bx - 0.25, 560.75, 18.5, 18.5); c.lineWidth = 1; this.hit(bx, 561, 18, 18, 'buff', st.tag, ui.statusName(st) + (st.t < 1e5 ? ' — ' + st.t.toFixed(1) + ' ' + S.sec : '')); bx += 21; }
      if (p.dead) { const cost = g.buybackCost(p), cd = p.buybackCd > g.time; this.button(390, 582, 180, 16, S.buyback + ' ' + cost + (cd ? ' (' + Math.ceil(p.buybackCd - g.time) + ')' : ''), 'buyback', { size: 10, disabled: cd || g.goldOf(p) < cost || !!p.aegisRevive, color: '#ffd040' }); }
      for (let i = 0; i < 6; i++) this.drawItemSlot(g, p, 'items', i, 606 + (i % 3) * 45, 470 + Math.floor(i / 3) * 34, 42, 31);
      for (let i = 0; i < 3; i++) this.drawItemSlot(g, p, 'backpack', i, 606 + i * 45, 540, 42, 18);
      this.drawTpSlot(g, p, 744, 470);
      this.button(744, 504, 52, 20, S.shop, 'shop', { size: 10, active: ui.overlay === 'shop', tip: S.shop + ' (F4)' });
      c.fillStyle = '#0e0a06'; c.fillRect(744, 527, 52, 18); c.strokeStyle = BRONZE_D; c.strokeRect(744.5, 527.5, 51, 17); this.text(String(g.goldOf(p)), 792, 541, { align: 'right', size: 12, bold: true, color: '#ffd040' }); c.fillStyle = '#ffd040'; c.beginPath(); c.arc(752, 536, 4, 0, 7); c.fill();
      this.hit(744, 527, 52, 18, 'gold', null, S.gold + ': ' + Math.floor(p.rgold) + ' / ' + Math.floor(p.ugold));
      if (p.stash.some(x => x) || p.secretQueue.length) {
        this.text(S.stash, 606, 572, { size: 9, color: '#c8b080' });
        for (let i = 0; i < 6; i++) this.drawItemSlot(g, p, 'stash', i, 640 + i * 26, 562, 24, 17);
        if (p.secretQueue.length) this.text('+' + p.secretQueue.length + ' ★', 796, 590, { align: 'right', size: 9, color: '#e0a0ff' });
      }
      const cst = { idle: '', deliver: '→', secret: '★', home: '←' }[cr.state] || '';
      if (cst) this.text(S.courier + ' ' + cst + (cr.carry.length ? ' (' + cr.carry.length + ')' : ''), 606, 596, { size: 9, color: '#c0e0ff' });
    }
    makeHudBg() {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H - HUD_Y; const c = cv.getContext('2d'), hh = cv.height;
      const g = c.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, '#4a3c2c'); g.addColorStop(1, '#1a130c'); c.fillStyle = g; c.fillRect(0, 0, W, hh);
      for (let i = 0; i < 1400; i++) { c.fillStyle = `rgba(${D.hash2(i, 1) < 0.5 ? '0,0,0' : '255,220,160'},${0.04 + D.hash2(i, 2) * 0.05})`; c.fillRect(D.hash2(i, 3) * W, D.hash2(i, 4) * hh, 2 + D.hash2(i, 5) * 6, 1 + D.hash2(i, 6) * 2); }
      c.fillStyle = BRONZE; c.fillRect(0, 0, W, 2); c.fillStyle = BRONZE_D; c.fillRect(0, 2, W, 2);
      for (let x = 20; x < W; x += 40) { c.fillStyle = BRONZE_D; c.beginPath(); c.moveTo(x - 5, 4); c.lineTo(x, 8); c.lineTo(x + 5, 4); c.fill(); }
      for (const [x0, x1] of [[3, 209], [212, 343], [346, 600], [603, 740], [743, 797]]) {
        const y0 = 9, y1 = hh - 3;
        c.fillStyle = 'rgba(8,5,2,0.42)'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
        c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(x0, y0, x1 - x0, 2); c.fillRect(x0, y0, 2, y1 - y0);
        c.fillStyle = 'rgba(255,220,160,0.14)'; c.fillRect(x0, y1 - 1, x1 - x0, 1); c.fillRect(x1 - 1, y0, 1, y1 - y0);
        for (const [rx, ry] of [[x0 + 4, y0 + 4], [x1 - 4, y0 + 4], [x0 + 4, y1 - 4], [x1 - 4, y1 - 4]]) { c.fillStyle = BRONZE_D; c.beginPath(); c.arc(rx, ry, 2, 0, 7); c.fill(); c.fillStyle = 'rgba(255,230,170,0.5)'; c.fillRect(rx - 1, ry - 1, 1, 1); }
      }
      return cv;
    }
    drawAbilitySlot(g, p, s, x, y, sz) {
      const c = this.ctx, ab = g.ability(p, s); if (!ab) return;
      const r = g.rank(p, s), ui = this.ui, S = this.S;
      c.fillStyle = '#000'; c.fillRect(x - 2, y - 2, sz + 4, sz + 4); c.strokeStyle = BRONZE_D; c.strokeRect(x - 1.5, y - 1.5, sz + 3, sz + 3);
      c.drawImage(this.A.icons.abil[ab.key], x, y, sz, sz);
      const mana = r ? g.abMana(p, s) : 0;
      if (!r) { c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(x, y, sz, sz); }
      else if (ab.tgt !== 'passive') {
        const cdMax = ab.charges ? ab.cd[0] : g.abCd(p, s) || 1;
        if (ab.charges) { if (p.charges[s] <= 0) this.cooldown(x, y, sz, sz, p.chargeT[s] / ab.chargeT); this.text(String(p.charges[s]), x + sz - 3, y + sz - 3, { align: 'right', size: 11, bold: true, color: '#ffe080' }); }
        else if (p.cds[s] > 0) { this.cooldown(x, y, sz, sz, p.cds[s] / cdMax); this.text(String(Math.ceil(p.cds[s])), x + sz / 2, y + sz / 2 + 5, { align: 'center', size: sz > 30 ? 15 : 10, bold: true }); }
        if (p.mp < mana && p.cds[s] <= 0) { c.fillStyle = 'rgba(40,60,160,0.55)'; c.fillRect(x, y, sz, sz); }
        if (ab.tgt === 'toggle' && g.has(p, ab.key)) { c.strokeStyle = '#80ff60'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, sz - 2, sz - 2); c.lineWidth = 1; }
      }
      if (ui.targeting && ui.targeting.kind === 'ability' && ui.targeting.slot === s) { c.strokeStyle = '#ffe060'; c.lineWidth = 2; c.strokeRect(x - 1, y - 1, sz + 2, sz + 2); c.lineWidth = 1; }
      if (sz > 30) {
        const key = ['Q', 'W', 'E', 'R'][s]; c.fillStyle = 'rgba(10,6,2,0.8)'; c.fillRect(x, y, 12, 12); this.text(key, x + 6, y + 10, { align: 'center', size: 9, bold: true, color: '#f0e0b0' });
        if (mana) { const mw = this.tw(String(Math.round(mana)), 8) + 5; c.fillStyle = 'rgba(8,16,40,0.85)'; c.fillRect(x + sz - mw, y + sz - 11, mw, 11); this.text(String(Math.round(mana)), x + sz - 2, y + sz - 2, { align: 'right', size: 8, bold: true, color: '#a8c8ff' }); }
        const max = ab.ult ? 3 : 4; for (let i = 0; i < max; i++) { c.fillStyle = i < r ? '#ffd040' : '#3a3020'; c.fillRect(x + 3 + i * ((sz - 6) / max), y + sz + 2, (sz - 6) / max - 2, 3); }
        if (g.canLearn(p, s)) { const hot = ui.hover && ui.hover.id === 'learn' && ui.hover.data === s; c.fillStyle = hot ? '#fff080' : '#e0b030'; c.fillRect(x + sz / 2 - 9, y - 12, 18, 11); c.fillStyle = '#000'; c.font = 'bold 11px ' + FONT; c.textAlign = 'center'; c.fillText('+', x + sz / 2, y - 3); this.hit(x + sz / 2 - 9, y - 12, 18, 11, 'learn', s, S.learn + ' (Ctrl+' + key + ')'); }
      }
      this.hit(x, y, sz, sz, 'ability', s, null);
    }
    drawItemSlot(g, p, where, i, x, y, w, h) {
      const c = this.ctx, it = p[where][i], ui = this.ui;
      c.fillStyle = '#0a0806'; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x, y, w, 2); c.fillRect(x, y, 2, h); c.fillStyle = 'rgba(255,220,160,0.1)'; c.fillRect(x, y + h - 1, w, 1); c.fillRect(x + w - 1, y, 1, h);
      if (!it && where !== 'stash') { c.strokeStyle = 'rgba(200,160,96,0.1)'; c.beginPath(); c.moveTo(x + w / 2 - 5, y + h / 2); c.lineTo(x + w / 2 + 5, y + h / 2); c.moveTo(x + w / 2, y + h / 2 - 5); c.lineTo(x + w / 2, y + h / 2 + 5); c.stroke(); }
      if (it) {
        c.drawImage(this.A.icons.item[it.id], x + 1, y + 1, w - 2, h - 2);
        if (where === 'backpack') { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x, y, w, h); }
        const d = ITEMS[it.id];
        if (it.cd > 0 && d.cd) { this.cooldown(x, y, w, h, it.cd / d.cd); if (where === 'items') this.text(String(Math.ceil(it.cd)), x + w / 2, y + h / 2 + 5, { align: 'center', size: 12, bold: true }); }
        if (d.charges || d.stick || d.bottle) this.text(String(it.charges), x + w - 2, y + h - 2, { align: 'right', size: 10, bold: true, color: '#fff' });
        if (it.id === 'power_treads') this.text(p.treads.toUpperCase(), x + 2, y + h - 2, { size: 8, bold: true, color: p.treads === 'str' ? '#ff6040' : p.treads === 'agi' ? '#40e040' : '#40a0ff' });
        if (it.id === 'aegis' && it.expires) this.text(String(Math.ceil((it.expires - g.time) / 60)) + 'm', x + 2, y + h - 2, { size: 8, bold: true, color: '#ffe080' });
      }
      if (where === 'items') { this.text(['Z', 'X', 'C', 'V', 'B', 'N'][i], x + 2, y + 9, { size: 8, color: 'rgba(255,240,200,0.6)' }); if (ui.targeting && ui.targeting.kind === 'item' && ui.targeting.slot === i) { c.strokeStyle = '#ffe060'; c.lineWidth = 2; c.strokeRect(x, y, w, h); c.lineWidth = 1; } }
      if (ui.drag && ui.drag.where === where && ui.drag.i === i) { c.strokeStyle = '#fff'; c.strokeRect(x, y, w, h); }
      this.hit(x, y, w, h, 'slot', { where, i }, null);
    }
    drawTpSlot(g, p, x, y) {
      const c = this.ctx; c.fillStyle = '#0a0806'; c.fillRect(x, y, 52, 31); c.strokeStyle = '#3a2e20'; c.strokeRect(x + 0.5, y + 0.5, 51, 30);
      if (p.tp.charges > 0) { c.drawImage(this.A.icons.item.tp, x + 5, y + 1, 42, 29); if (p.tp.cd > 0) { this.cooldown(x, y, 52, 31, p.tp.cd / 80); this.text(String(Math.ceil(p.tp.cd)), x + 26, y + 20, { align: 'center', size: 12, bold: true }); } this.text(String(p.tp.charges), x + 49, y + 29, { align: 'right', size: 10, bold: true }); }
      this.text('T', x + 2, y + 9, { size: 8, color: 'rgba(255,240,200,0.6)' });
      if (this.ui.targeting && this.ui.targeting.kind === 'item' && this.ui.targeting.slot === 'tp') { c.strokeStyle = '#ffe060'; c.lineWidth = 2; c.strokeRect(x, y, 52, 31); c.lineWidth = 1; }
      this.hit(x, y, 52, 31, 'tp', null, null);
    }
    drawMinimap(g) {
      const c = this.ctx, ui = this.ui, team = ui.viewTeam();
      if (!this.A.mini) this.A.mini = G.buildMinimap(this.A.tex, MM.w, MM.h);
      c.save();
      c.beginPath(); c.moveTo(MM.x, MM.y + MM.h / 2); c.lineTo(MM.x + MM.w / 2, MM.y); c.lineTo(MM.x + MM.w, MM.y + MM.h / 2); c.lineTo(MM.x + MM.w / 2, MM.y + MM.h); c.closePath();
      c.fillStyle = '#000'; c.fill(); c.clip();
      c.drawImage(this.A.mini, MM.x, MM.y);
      if (team >= 0) { c.save(); const s = D.Map.SLOT, kx = MM.w / (2 * MAP), ky = MM.h / (2 * MAP); c.setTransform(kx * s, -ky * s, kx * s, ky * s, MM.x, MM.y + MM.h / 2); c.globalAlpha = 0.8; c.drawImage(this.fogCv, 0, 0); c.restore(); }
      const P = (x, y) => [MM.x + (x + y) / (2 * MAP) * MM.w, MM.y + MM.h / 2 + (y - x) / (2 * MAP) * MM.h];
      for (const s of g.structs) { if (s.dead || s.kind === 'fountain') continue; const [x, y] = P(s.x, s.y); c.fillStyle = s.team === 0 ? '#60ff60' : '#ff4a3a'; const r = s.kind === 'ancient' ? 4 : s.kind === 'rax' ? 2.5 : 2; c.fillRect(x - r, y - r, r * 2, r * 2); c.strokeStyle = '#000'; c.strokeRect(x - r - 0.5, y - r - 0.5, r * 2 + 1, r * 2 + 1); }
      for (const u of g.units) {
        if (u.dead || u.structure || g.isWardLike(u) && u.kind !== 'ward') continue;
        if (team >= 0 && !u.vis[team]) continue;
        const [x, y] = P(u.x, u.y);
        if (u.kind === 'hero') continue;
        if (u.kind === 'ward') { if (team >= 0 && u.team !== team) continue; c.fillStyle = u.wardType === 'obs' ? '#ffe060' : '#60a0ff'; c.fillRect(x - 1, y - 1, 3, 3); continue; }
        c.fillStyle = u.team === 0 ? '#40a040' : u.team === 1 ? '#a03a30' : u.kind === 'roshan' ? '#ffffff' : '#c0a040'; c.fillRect(x - 1, y - 0.5, 2, 2);
      }
      for (const h of g.heroes) { if (h.dead || h.illusion && team !== h.team || team >= 0 && !h.vis[team]) continue; const [x, y] = P(h.x, h.y); c.fillStyle = '#000'; c.beginPath(); c.arc(x, y, 3.8, 0, 7); c.fill(); c.fillStyle = PCOL[g.heroes.indexOf(h) % 10]; c.beginPath(); c.arc(x, y, 2.8, 0, 7); c.fill(); if (ui.player && h === ui.player) { c.strokeStyle = '#fff'; c.beginPath(); c.arc(x, y, 5, 0, 7); c.stroke(); } }
      for (const r of g.runes) if (team < 0 || g.slotVisible(team, r.x, r.y)) { const [x, y] = P(r.x, r.y); c.fillStyle = RUNES[r.kind].color; c.fillRect(x - 1.5, y - 1.5, 3, 3); }
      for (const pg of ui.pings) { const [x, y] = P(pg.x, pg.y); const k = (g.time - pg.t) / 3; c.strokeStyle = `rgba(255,${pg.color || 220},80,${1 - k})`; c.beginPath(); c.arc(x, y, 3 + k * 10, 0, 7); c.stroke(); }
      for (const s of g.scans) if (s.scan && s.team === team) { const [x, y] = P(s.x, s.y); c.strokeStyle = s.found ? '#ff5030' : '#60c0ff'; c.beginPath(); c.arc(x, y, 900 / (2 * MAP) * MM.w * 1.4, 0, 7); c.stroke(); }
      const k = MM.w / (2 * MAP * KX); c.strokeStyle = '#fff'; c.lineWidth = 1; c.strokeRect(MM.x + this.cam.x * k, MM.y + MM.h / 2 + this.cam.y * k, W * k, HUD_Y * k);
      c.restore();
      c.strokeStyle = BRONZE; c.lineWidth = 2; c.beginPath(); c.moveTo(MM.x, MM.y + MM.h / 2); c.lineTo(MM.x + MM.w / 2, MM.y); c.lineTo(MM.x + MM.w, MM.y + MM.h / 2); c.lineTo(MM.x + MM.w / 2, MM.y + MM.h); c.closePath(); c.stroke(); c.lineWidth = 1;
      this.hit(MM.x, MM.y, MM.w, MM.h, 'minimap', null, null);
    }
    miniToWorld(px, py) {
      const u = (px - MM.x) / MM.w, v = (py - MM.y - MM.h / 2) / MM.h;
      const s = u * 2 * MAP, d = v * 2 * MAP; return [(s - d) / 2, (s + d) / 2];
    }
    drawSpectatorList(g) {
      g.heroes.filter(h => !h.illusion).forEach((h, i) => {
        const x = 220 + (i % 5) * 116, y = 476 + Math.floor(i / 5) * 52;
        this.icon(this.portrait(this.ui.skinOf(h), 36, 36), x, y, 36, 36); this.ctx.fillStyle = PCOL[i]; this.ctx.fillRect(x, y + 36, 36, 3);
        this.text(this.L(h.def.name), x + 40, y + 11, { size: 10, bold: true, color: h.team ? '#ff8a7a' : '#8aff8a' });
        this.text(`${this.S.level} ${h.level}  ${h.kills}/${h.deaths}/${h.assists}`, x + 40, y + 24, { size: 9 });
        this.bar(x + 40, y + 29, 70, 4, h.dead ? 0 : h.hp / h.maxHp, h.team ? '#e04030' : '#40c040');
        this.hit(x, y, 110, 40, 'topHero', h.id, h.name);
      });
    }
    drawFeed(g) {
      const ui = this.ui; let y = 54;
      for (const k of ui.killFeed) {
        if (g.time - k.t > 9) continue;
        const c = this.ctx; c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(560, y - 12, 236, 18);
        if (k.killer) this.icon(this.portrait(k.killer, 30, 16), 564, y - 11, 30, 16);
        this.text(k.text, 600, y, { size: 10, color: k.color || '#fff' });
        if (k.victim) this.icon(this.portrait(k.victim, 30, 16), 762, y - 11, 30, 16);
        y += 20;
      }
      if (ui.announce && g.time - ui.announce.t < 3) { const a = ui.announce, k = (g.time - a.t) / 3; this.ctx.globalAlpha = k < 0.8 ? 1 : (1 - k) * 5; this.text(a.text, 400, 96, { align: 'center', size: 24, bold: true, serif: true, color: a.color || '#ffd060' }); if (a.sub) this.text(a.sub, 400, 116, { align: 'center', size: 13, color: '#f0e0c0' }); this.ctx.globalAlpha = 1; }
      if (ui.msg && g.time - ui.msg.t < 1.8) this.text(ui.msg.text, 400, 440, { align: 'center', size: 14, bold: true, color: '#ff6050' });
      let cy = 452; const lines = ui.chat.filter(m => performance.now() - m.at < 12000 || ui.chatOpen).slice(-6);
      for (let i = lines.length - 1; i >= 0; i--) { const m = lines[i]; cy -= 15; this.text((m.all ? '[' + (this.ui.lang === 'ru' ? 'Всем' : 'All') + '] ' : '') + (m.from ? m.from + ': ' : ''), 8, cy, { size: 11, bold: true, color: m.team === 0 ? '#8aff8a' : m.team === 1 ? '#ff8a7a' : '#ffd060' }); this.text(m.text, 8 + this.tw((m.all ? '[All] ' : '') + (m.from ? m.from + ': ' : ''), 11, true) + 2, cy, { size: 11, color: m.sys ? '#ffd060' : '#fff' }); }
      if (ui.chatOpen) { const c = this.ctx; c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(6, 440, 380, 18); c.strokeStyle = BRONZE_D; c.strokeRect(6.5, 440.5, 379, 17); this.text('> ' + ui.chatText + (((performance.now() / 400) | 0) % 2 ? '_' : ''), 10, 453, { size: 11 }); }
      if (ui.options.fps) this.text(ui.fps + ' FPS', 796, 48, { align: 'right', size: 10, color: '#0f0' });
    }
    tooltip(lines, x, y, w = 260) {
      const c = this.ctx; let h = 10;
      for (const l of lines) h += l.gap ? 6 : l.icons ? 24 : l.wrap ? this.wrapH(l.text, w - 16, l.size || 11) : (l.size || 11) + 5;
      x = Math.max(4, Math.min(W - w - 4, x)); y = Math.max(TOP + 4, Math.min(H - h - 4, y - h));
      c.fillStyle = 'rgba(14,10,6,0.96)'; c.fillRect(x, y, w, h); c.strokeStyle = BRONZE; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      let yy = y + 6;
      for (const l of lines) {
        if (l.gap) { c.fillStyle = BRONZE_D; c.fillRect(x + 8, yy + 2, w - 16, 1); yy += 6; continue; }
        if (l.icons) { l.icons.forEach((ic, i) => { c.fillStyle = '#000'; c.fillRect(x + 8 + i * 29, yy + 2, 28, 20); if (ic) c.drawImage(ic, x + 8 + i * 29, yy + 2, 28, 20); }); yy += 24; continue; }
        if (l.wrap) { yy = this.wrap(l.text, x + 8, yy + (l.size || 11), w - 16, { size: l.size || 11, color: l.color || '#e8dcc0' }) - (l.size || 11); continue; }
        yy += (l.size || 11) + 1; this.text(l.text, x + 8, yy, { size: l.size || 11, bold: l.bold, color: l.color || '#e8dcc0' }); if (l.right) this.text(l.right, x + w - 8, yy, { align: 'right', size: l.size || 11, color: l.rcolor || '#c0b090' }); yy += 4;
      }
    }
    abilityLines(g, h, s) {
      const ab = g.ability(h, s), S = this.S, L = this.ui.lang, r = g.rank(h, s);
      const lines = [{ text: this.L(ab.name), size: 13, bold: true, color: '#ffe0a0', right: ab.ult ? S.ult : ab.tgt === 'passive' ? S.passive : '' }];
      let desc = this.L(ab.desc);
      desc = desc.replace(/\{(\w+)\}/g, (m0, k) => { const arr = ab.v[k]; if (!arr) return '?'; const vals = arr.map((v, i) => { let x = v; h.def.talents.forEach((pair, ti) => { const ch = h.talents[ti]; if (ch >= 0 && pair[ch].ab === s && pair[ch].k === k) x += pair[ch].v; }); return +x.toFixed(2); }); const uniq = [...new Set(vals)]; return uniq.length === 1 ? String(uniq[0]) : vals.map((v, i) => i === r - 1 ? '[' + v + ']' : v).join('/'); });
      lines.push({ gap: true }, { text: desc, wrap: true });
      if (ab.tgt !== 'passive' && ab.tgt !== 'toggle') {
        lines.push({ gap: true });
        const mana = [...new Set(ab.mana)], cd = [...new Set(ab.cd)];
        if (mana.some(v => v)) lines.push({ text: S.mana + ': ' + mana.join('/'), color: '#9ac0ff', size: 10 });
        if (cd.some(v => v)) lines.push({ text: S.cd + ': ' + (ab.charges ? ab.chargeT + ' (' + ab.charges + '×)' : cd.join('/')) + ' ' + S.sec, color: '#c0c0c0', size: 10 });
      }
      if (ab.ult && h.def.scepterDesc) lines.push({ gap: true }, { text: S.scepter + ': ' + this.L(h.def.scepterDesc), wrap: true, size: 10, color: g.hasScepter(h) ? '#80c0ff' : '#708090' });
      if (s === 0 && h.def.shardDesc) lines.push({ text: S.shard + ': ' + this.L(h.def.shardDesc), wrap: true, size: 10, color: g.hasShard(h) ? '#80c0ff' : '#708090' });
      void L; return lines;
    }
    itemLines(g, id, h) {
      const d = ITEMS[id], S = this.S, lines = [{ text: this.L(d.name), size: 13, bold: true, color: d.secret ? '#e0a0ff' : '#ffe0a0', right: d.cost ? String(d.cost) : '', rcolor: '#ffd040' }];
      if (d.st) { const parts = []; for (const k in d.st) { const v = d.st[k]; const n = { str: S.strength, agi: S.agility, int: S.intelligence, all: this.ui.lang === 'ru' ? 'ко всем атрибутам' : 'All Attributes', dmg: S.damage, as: S.attackSpeed, armor: S.armor, hp: this.ui.lang === 'ru' ? 'здоровья' : 'Health', mp: S.mana, hpr: this.ui.lang === 'ru' ? 'рег. здоровья' : 'HP Regen', mpr: this.ui.lang === 'ru' ? 'рег. маны' : 'Mana Regen', ms: S.ms, msPct: S.ms + ' %', evasion: this.ui.lang === 'ru' ? '% уклонения' : '% Evasion', mr: S.mr + ' %', lifesteal: this.ui.lang === 'ru' ? '% вампиризма' : '% Lifesteal', range: S.range }[k] || k; parts.push('+' + v + ' ' + n); } lines.push({ text: parts.join(', '), wrap: true, size: 10, color: '#c0e0a0' }); }
      if (d.desc) lines.push({ gap: true }, { text: this.L(d.desc), wrap: true });
      if (d.active && d.cd) lines.push({ text: S.cd + ': ' + d.cd + ' ' + S.sec + (d.mana ? '   ' + S.mana + ': ' + d.mana : ''), size: 10, color: '#c0c0c0' });
      if (d.from) { lines.push({ gap: true }, { text: S.components + ': ' + d.from.map(f => this.L(ITEMS[f].name)).join(', ') + (d.recipe ? ' + ' + S.recipe + ' (' + d.recipe + ')' : ''), wrap: true, size: 10, color: '#b0a080' }); }
      if (d.secret) lines.push({ text: S.secretOnly, size: 10, color: '#e0a0ff' });
      if (h) { const plan = g.buyPlan(h, id); if (plan.cost !== d.cost) lines.push({ text: (this.ui.lang === 'ru' ? 'Докупить за ' : 'Complete for ') + plan.cost, size: 10, color: '#ffd040' }); }
      return lines;
    }
    drawShop(g) {
      const ui = this.ui, p = ui.player, S = this.S, c = this.ctx; if (!p) return;
      const X = 396, Y = 32, Wd = 402, Hd = 428;
      this.stone(X, Y, Wd, Hd, { top: '#3a2e22', bottom: '#120c08' });
      this.hit(X, Y, Wd, Hd, 'shopPanel', null, null);
      DD.SHOP_TABS.forEach((t, i) => this.button(X + 8 + i * 100, Y + 8, 96, 20, this.L(t.name), 'shopTab', { data: i, active: ui.shopTab === i, size: 11 }));
      this.button(X + Wd - 30, Y + 8, 22, 20, '×', 'shopClose', { size: 13 });
      this.text(S.recommended, X + 214, Y + 22, { size: 10, color: '#c8b080' });
      const rec = p.def.build.filter((id, i, a) => a.indexOf(id) === i).slice(0, 14);
      rec.forEach((id, i) => { const x = X + 10 + (i % 14) * 27, y = Y + 34; this.shopItem(g, p, id, x, y, 25, 18); });
      const tab = DD.SHOP_TABS[ui.shopTab || 0], cols = tab.cols, cw = Math.floor((Wd - 16) / cols.length);
      cols.forEach((cat, ci) => {
        const x = X + 8 + ci * cw; this.text(this.L(DD.CAT_NAMES[cat]), x + cw / 2, Y + 70, { align: 'center', size: 10, bold: true, color: cat === 'secret' ? '#e0a0ff' : '#f0d890' });
        const ids = Object.keys(ITEMS).filter(k => ITEMS[k].cat === cat).sort((a, b) => ITEMS[a].cost - ITEMS[b].cost);
        const iw = Math.floor((cw - 8) / 2), ih = Math.round(iw * 0.72);
        ids.forEach((id, i) => this.shopItem(g, p, id, x + 3 + (i % 2) * (iw + 2), Y + 76 + Math.floor(i / 2) * (ih + 3), iw, ih));
      });
      if (p.secretQueue.length) this.text(S.quickbuy + ': ' + p.secretQueue.map(it => this.L(ITEMS[it.id].name)).join(', '), X + 10, Y + Hd - 10, { size: 10, color: '#e0a0ff' });
      else this.text(ui.lang === 'ru' ? 'ПКМ/ЛКМ — купить. Своя лавка у фонтана, тайная — у реки.' : 'Click to buy. Your shop is by the fountain, the Secret Shop by the river.', X + 10, Y + Hd - 10, { size: 9, color: '#a09070' });
    }
    shopItem(g, p, id, x, y, w, h) {
      const c = this.ctx, d = ITEMS[id]; const plan = g.buyPlan(p, id), afford = g.goldOf(p) >= plan.cost;
      const locked = d.after && g.time < d.after || this.ui.g.stock[id] && this.ui.g.stock[id][p.team] <= 0;
      c.drawImage(this.A.icons.item[id], x, y, w, h);
      if (!afford || locked) { c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(x, y, w, h); }
      if (w > 28) this.text(String(plan.cost), x + w - 1, y + h - 1, { align: 'right', size: 8, bold: true, color: afford ? '#ffd040' : '#a08040' });
      if (this.ui.g.stock[id]) this.text(String(this.ui.g.stock[id][p.team]), x + 2, y + 9, { size: 8, bold: true });
      if (d.secret && w > 28) { c.fillStyle = '#c070ff'; c.fillRect(x + 1, y + 1, 3, 3); }
      const hot = this.ui.hover && this.ui.hover.id === 'buy' && this.ui.hover.data === id; if (hot) { c.strokeStyle = '#ffe080'; c.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1); }
      this.hit(x, y, w, h, 'buy', id, null);
    }
    drawTalents(g) {
      const p = this.ui.player, S = this.S; if (!p) return;
      const X = 240, Y = 250, Wd = 360, Hd = 206; this.stone(X, Y, Wd, Hd, { title: S.talents });
      for (let tier = 3; tier >= 0; tier--) {
        const y = Y + 34 + (3 - tier) * 42, lv = DD.TALENT_LEVELS[tier];
        const c = this.ctx; c.fillStyle = '#0e0a06'; c.beginPath(); c.arc(X + Wd / 2, y + 16, 15, 0, 7); c.fill(); c.strokeStyle = p.level >= lv ? '#ffd040' : '#5a4a30'; c.stroke();
        this.text(String(lv), X + Wd / 2, y + 21, { align: 'center', size: 12, bold: true, color: p.level >= lv ? '#ffd040' : '#8a7a5a' });
        for (let ch = 0; ch < 2; ch++) {
          const t = p.def.talents[tier][ch], chosen = p.talents[tier] === ch, other = p.talents[tier] >= 0 && !chosen, can = g.canTalent(p, tier);
          const x = ch === 0 ? X + 10 : X + Wd / 2 + 20, w = Wd / 2 - 30;
          c.fillStyle = chosen ? '#5a4a10' : can ? '#2e2616' : '#1a140c'; c.fillRect(x, y, w, 32); c.strokeStyle = chosen ? '#ffe060' : can ? BRONZE : '#3a2e20'; c.strokeRect(x + 0.5, y + 0.5, w - 1, 31);
          this.wrap(this.L(t.t), x + 6, y + 13, w - 12, { size: 10, color: other ? '#6a6050' : chosen ? '#fff0c0' : '#e0d0b0', lh: 12 });
          if (can) this.hit(x, y, w, 32, 'talent', { tier, ch }, null);
        }
      }
      this.hit(X, Y, Wd, Hd, 'talentPanel', null, null);
    }
    drawScoreboard(g) {
      const S = this.S, X = 60, Y = 44, Wd = 680, Hd = 370; this.stone(X, Y, Wd, Hd, { title: S.scoreboard });
      const cols = [[S.hero, 12], [S.level, 172], [S.kda, 226], [S.lhdn, 290], [S.nw, 384], [S.items, 446]];
      for (const [n, x] of cols) this.text(n, X + x, Y + 42, { size: 10, bold: true, color: '#c8b080' });
      let y = Y + 50;
      for (let tm = 0; tm < 2; tm++) {
        this.text(tm === 0 ? S.radiant : S.dire, X + 12, y + 12, { size: 12, bold: true, serif: true, color: TEAMC[tm] }); y += 16;
        for (const h of g.heroes.filter(x => x.team === tm && !x.illusion)) {
          const c = this.ctx; c.fillStyle = this.ui.player && h.id === this.ui.player.id ? 'rgba(255,220,120,0.12)' : 'rgba(0,0,0,0.25)'; c.fillRect(X + 8, y, Wd - 16, 24);
          this.icon(this.portrait(this.ui.skinOf(h), 36, 22), X + 12, y + 2, 36, 22); c.fillStyle = PCOL[g.heroes.indexOf(h) % 10]; c.fillRect(X + 12, y + 23, 36, 2);
          this.text(h.name, X + 54, y + 11, { size: 10, bold: true }); this.text(this.L(h.def.name), X + 54, y + 22, { size: 9, color: '#b0a080' });
          this.text(String(h.level), X + 180, y + 16, { size: 11, bold: true });
          this.text(`${h.kills}/${h.deaths}/${h.assists}`, X + 226, y + 16, { size: 11 });
          this.text(`${h.lh}/${h.dn}`, X + 290, y + 16, { size: 11 });
          this.text(String(g.netWorth(h)), X + 384, y + 16, { size: 11, color: '#ffd040' });
          h.items.forEach((it, i) => { if (it) this.icon(this.A.icons.item[it.id], X + 446 + i * 32, y + 3, 30, 19); });
          if (h.dead) this.text('✝ ' + Math.ceil(h.respawnT - g.time), X + Wd - 16, y + 17, { align: 'right', size: 10, color: '#ff6060' });
          y += 26;
        }
        y += 4;
      }
    }
    drawTitle() {
      const c = this.ctx, S = this.S, t = this.t;
      this.menuBg();
      c.save(); c.translate(400, 150);
      const gr = c.createLinearGradient(0, -50, 0, 40); gr.addColorStop(0, '#ffb080'); gr.addColorStop(0.45, '#c81e10'); gr.addColorStop(1, '#4a0804');
      c.font = 'bold 96px ' + SERIF; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#000'; c.fillText('DOTA', 4, 6); c.fillStyle = gr; c.fillText('DOTA', 0, 0); c.strokeStyle = '#f0c080'; c.lineWidth = 1.5; c.strokeText('DOTA', 0, 0);
      c.font = 'bold 34px ' + SERIF; c.fillStyle = '#f0d890'; c.fillText('98', 150, 34); c.restore();
      this.text(S.subtitle, 400, 212, { align: 'center', size: 18, serif: true, color: '#e8d0a0' });
      this.text('© 1999 Valve & IceFrog • Win 98 Edition', 400, 232, { align: 'center', size: 10, color: '#a09070' });
      const items = [['play', S.play], ['heroes', S.heroes], ['armory', S.armory], ['options', S.options], ['help', S.help], ['exit', S.exit]];
      items.forEach(([id, label], i) => this.button(300, 262 + i * 42, 200, 34, label, 'menu', { data: id, size: 15 }));
      const nCh = this.ui.col.chests.length; if (nCh) { const bx = 486, by = 262 + 2 * 42 + 2; c.fillStyle = '#b02010'; c.beginPath(); c.arc(bx, by, 10, 0, 7); c.fill(); c.strokeStyle = '#ffd890'; c.lineWidth = 1.5; c.stroke(); c.lineWidth = 1; this.text(String(nCh), bx, by + 4, { align: 'center', size: 11, bold: true }); }
      const s0 = this.sprites.get('ancient_0', t * 0.2, 'idle', 0), s1 = this.sprites.get('ancient_1', -t * 0.2, 'idle', 0);
      if (s0) c.drawImage(s0.cv, 130 - s0.ox, 470 - s0.oy); if (s1) c.drawImage(s1.cv, 670 - s1.ox, 470 - s1.oy);
      this.text(S.radiant, 130, 500, { align: 'center', size: 14, bold: true, serif: true, color: TEAMC[0] });
      this.text(S.dire, 670, 500, { align: 'center', size: 14, bold: true, serif: true, color: TEAMC[1] });
      const prof = this.ui.profile; this.text((this.ui.lang === 'ru' ? 'Побед: ' : 'Wins: ') + prof.wins + '  ' + (this.ui.lang === 'ru' ? 'Поражений: ' : 'Losses: ') + prof.losses, 400, 580, { align: 'center', size: 11, color: '#c8b080' });
    }
    menuBg() {
      const c = this.ctx;
      if (!this.bgCv) {
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const b = cv.getContext('2d');
        const g = b.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1a2a14'); g.addColorStop(0.5, '#140e0a'); g.addColorStop(1, '#2a0e0a'); b.fillStyle = g; b.fillRect(0, 0, W, H);
        for (let i = 0; i < 2600; i++) { b.fillStyle = `rgba(${D.hash2(i, 9) < 0.5 ? '0,0,0' : '255,230,180'},${0.03 + D.hash2(i, 8) * 0.05})`; b.fillRect(D.hash2(i, 1) * W, D.hash2(i, 2) * H, 1 + D.hash2(i, 3) * 4, 1 + D.hash2(i, 4) * 3); }
        b.strokeStyle = BRONZE_D; b.lineWidth = 3; b.strokeRect(6, 6, W - 12, H - 12); b.strokeStyle = BRONZE; b.lineWidth = 1; b.strokeRect(10, 10, W - 20, H - 20);
        this.bgCv = cv;
      }
      c.drawImage(this.bgCv, 0, 0);
    }
    drawLobby() {
      const S = this.S, sel = this.ui.sel; this.menuBg();
      this.stone(200, 90, 400, 400, { title: S.lobby });
      this.text(S.team, 230, 146, { size: 12, bold: true, color: '#f0d890' });
      this.button(230, 154, 160, 26, S.radiant, 'team', { data: 0, active: sel.team === 0, color: TEAMC[0] }); this.button(410, 154, 160, 26, S.dire, 'team', { data: 1, active: sel.team === 1, color: TEAMC[1] });
      this.text(S.difficulty, 230, 206, { size: 12, bold: true, color: '#f0d890' });
      S.diff.forEach((d, i) => this.button(230 + i * 86, 214, 82, 24, d, 'diff', { data: i, active: sel.diff === i, size: 11 }));
      if (sel.diff === 3) this.text(S.unfair, 230, 254, { size: 10, color: '#ff9070' });
      this.text(S.mode, 230, 280, { size: 12, bold: true, color: '#f0d890' });
      S.modes.forEach((m, i) => this.button(230 + i * 115, 288, 110, 24, m, 'mode', { data: i, active: sel.mode === i, size: 11 }));
      this.button(230, 330, 340, 24, (sel.cheats ? '☑ ' : '☐ ') + S.cheats, 'cheats', { size: 11 });
      this.button(230, 370, 340, 24, (sel.fast ? '☑ ' : '☐ ') + (this.ui.lang === 'ru' ? 'Быстрое воскрешение (обучение)' : 'Fast respawn (practice)'), 'fast', { size: 11 });
      this.button(230, 440, 160, 32, S.back, 'back'); this.button(410, 440, 160, 32, S.start, 'lobbyStart', { color: '#ffe080' });
    }
    drawPick(g) {
      const ui = this.ui, S = this.S, sel = ui.sel, c = this.ctx; this.menuBg();
      this.text(S.pick, 400, 36, { align: 'center', size: 22, bold: true, serif: true, color: '#f0d890' });
      if (ui.pickTimer != null) this.text(String(Math.max(0, Math.ceil(ui.pickTimer))), 400, 60, { align: 'center', size: 16, bold: true, color: ui.pickTimer < 10 ? '#ff6050' : '#e8d8b0' });
      const groups = [['str', S.strength, '#ff5a3a'], ['agi', S.agility, '#4ade4a'], ['int', S.intelligence, '#4aa8ff']];
      groups.forEach(([attr, name, col], gi) => {
        const x = 30 + gi * 250; this.text(name, x, 90, { size: 13, bold: true, color: col, serif: true });
        HERO_ORDER.filter(h => HEROES[h].attr === attr).forEach((hid, i) => {
          const px = x + (i % 4) * 58, py = 98 + Math.floor(i / 4) * 64, taken = ui.pickTaken && ui.pickTaken[hid] && ui.pickTaken[hid] !== 'me';
          c.drawImage(this.portrait(this.ui.lookModel(hid), 54, 54), px, py);
          if (taken) { c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(px, py, 54, 54); }
          c.strokeStyle = sel.hero === hid ? '#ffe060' : BRONZE_D; c.lineWidth = sel.hero === hid ? 2 : 1; c.strokeRect(px - 0.5, py - 0.5, 55, 55); c.lineWidth = 1;
          this.text(this.L(HEROES[hid].name), px + 27, py + 62, { align: 'center', size: 9, color: taken ? '#666' : '#e8d8b0' });
          if (!taken) this.hit(px, py, 54, 54, 'heroSel', hid, null);
        });
      });
      const hid = sel.hero, h = HEROES[hid];
      this.stone(20, 250, 760, 290, {});
      const sp = this.sprites.get(this.ui.lookModel(hid), this.t * 0.8, 'idle', this.t * 0.5, 2.2);
      if (sp) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(110, 470, 64, 18, 0, 0, 7); c.fill(); c.drawImage(sp.cv, 110 - sp.ox, 470 - sp.oy); }
      this.text(this.L(h.name), 210, 282, { size: 22, bold: true, serif: true, color: '#ffe0a0' });
      this.text(this.L(h.title) + ' • ' + (h.melee ? S.melee : S.ranged) + ' • ' + h.roles.map(r => S.roles[r]).join(', '), 210, 300, { size: 11, color: '#c8b080' });
      const at = [['STR', h.str, '#ff5a3a', 'str'], ['AGI', h.agi, '#4ade4a', 'agi'], ['INT', h.int, '#4aa8ff', 'int']];
      at.forEach(([n, v, col, k], i) => this.text(`${n} ${v[0]} +${v[1]}`, 210 + i * 90, 320, { size: 11, bold: h.attr === k, color: col }));
      this.text(`${S.damage} ${h.dmg[0] + h[h.attr][0]}–${h.dmg[1] + h[h.attr][0]}   ${S.armor} ${(h.armor + h.agi[0] / 6).toFixed(1)}   ${S.ms} ${h.ms}   ${S.range} ${h.range}`, 210, 338, { size: 10, color: '#e8d8b0' });
      this.wrap(this.L(h.lore), 210, 358, 540, { size: 10, color: '#b8a888', lh: 13 });
      h.abilities.concat(h.extra || [], h.scepter ? [h.scepter] : []).forEach((ab, i) => {
        const x = 210 + i * 58, y = 400; c.drawImage(this.A.icons.abil[ab.key], x, y, 48, 48); c.strokeStyle = BRONZE_D; c.strokeRect(x - 0.5, y - 0.5, 49, 49);
        this.hit(x, y, 48, 48, 'pickAbility', i, null);
      });
      this.text(ui.lang === 'ru' ? 'Наведите на способность, чтобы прочитать описание' : 'Hover an ability to read about it', 210, 468, { size: 9, color: '#8a7a5a' });
      if (!ui.picked) { this.button(560, 486, 200, 36, S.pickHero, 'pickConfirm', { size: 15, color: '#ffe080' }); this.button(350, 486, 190, 36, S.random, 'pickRandom', { size: 13 }); }
      else this.text(S.lockIn + '!', 660, 510, { align: 'center', size: 16, bold: true, color: '#80ff80' });
      this.button(210, 486, 120, 36, S.back, 'back', { size: 12 });
      if (ui.pickSlots) ui.pickSlots.forEach((s, i) => {
        const tm = s.team, k = ui.pickSlots.filter(x => x.team === tm).indexOf(s), x = tm === 0 ? 22 + k * 74 : 410 + k * 74, y = 552;
        c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(x, y, 70, 40); c.strokeStyle = TEAMC[tm]; c.strokeRect(x + 0.5, y + 0.5, 69, 39);
        if (s.shown) c.drawImage(this.portrait(s.model || s.hero, 30, 30), x + 2, y + 5);
        const nm = (s.bot ? s.name.replace(' [BOT]', '') : this.ui.profile.name); this.text(nm.length > 7 ? nm.slice(0, 6) + '…' : nm, x + 35, y + 16, { size: 8, color: s.bot ? '#c8b080' : '#ffe080' });
        if (s.shown) { const hn = this.L(HEROES[s.hero].name); this.text(hn.length > 7 ? hn.slice(0, 6) + '…' : hn, x + 35, y + 30, { size: 8, color: '#e8d8b0' }); }
        void i;
      });
    }
    drawLoading(g) {
      const ui = this.ui, S = this.S, c = this.ctx; this.menuBg();
      this.text('DOTA 98', 400, 60, { align: 'center', size: 34, bold: true, serif: true, color: '#c81e10' });
      const slots = ui.pickSlots || [];
      for (let tm = 0; tm < 2; tm++) {
        this.text(tm === 0 ? S.radiant : S.dire, 400, tm === 0 ? 110 : 330, { align: 'center', size: 16, bold: true, serif: true, color: TEAMC[tm] });
        slots.filter(s => s.team === tm).forEach((s, k) => {
          const x = 60 + k * 140, y = tm === 0 ? 122 : 342;
          this.stone(x, y, 128, 170, {}); c.drawImage(this.portrait(s.model || s.hero, 100, 100), x + 14, y + 10);
          this.text(this.L(HEROES[s.hero].name), x + 64, y + 128, { align: 'center', size: 12, bold: true, color: '#ffe0a0' });
          this.text(s.bot ? s.name.replace(' [BOT]', '') : this.ui.profile.name, x + 64, y + 146, { align: 'center', size: 10, color: s.bot ? '#c8b080' : '#80ff80' });
          this.text(S.roles[HEROES[s.hero].roles[0]], x + 64, y + 161, { align: 'center', size: 9, color: '#8a7a5a' });
        });
      }
      const k = Math.min(1, ui.loadK || 0);
      this.bar(150, 540, 500, 12, k, '#c89a30', '#201608'); this.text(S.loading + ' ' + Math.round(k * 100) + '%', 400, 570, { align: 'center', size: 11 });
      const tip = S.helpLines[Math.floor((ui.loadTip || 0)) % S.helpLines.length]; this.text(tip, 400, 590, { align: 'center', size: 10, color: '#c8b080' });
    }
    drawMenu() {
      const S = this.S; this.ctx.fillStyle = 'rgba(0,0,0,0.5)'; this.ctx.fillRect(0, 0, W, H);
      this.stone(290, 170, 220, 230, { title: S.menu });
      this.button(310, 210, 180, 30, S.resume, 'resume'); this.button(310, 250, 180, 30, S.options, 'options'); this.button(310, 290, 180, 30, S.help, 'help'); this.button(310, 350, 180, 30, S.quit, 'quit', { color: '#ff9080' });
    }
    drawOptions() {
      const S = this.S, o = this.ui.options; this.ctx.fillStyle = 'rgba(0,0,0,0.5)'; this.ctx.fillRect(0, 0, W, H);
      this.stone(230, 120, 340, 340, { title: S.options });
      const rows = [['sfx', S.optSfx], ['music', S.optMusic]];
      rows.forEach(([k, n], i) => { const y = 160 + i * 40; this.text(n, 250, y + 14, { size: 11 }); for (let j = 0; j <= 10; j++) this.button(400 + j * 14, y, 12, 20, '', 'vol', { data: k + ':' + j, active: Math.round(o[k] * 10) >= j && j > 0 }); });
      const toggles = [['edge', S.optEdge], ['dmgnums', S.optNums], ['quickcast', S.optQuick], ['creepHp', S.optHp], ['fps', S.optFps]];
      toggles.forEach(([k, n], i) => this.button(250, 250 + i * 30, 300, 24, (o[k] ? '☑ ' : '☐ ') + n, 'opt', { data: k, size: 11 }));
      this.button(320, 420, 160, 28, S.back, 'optBack');
    }
    drawHelp() {
      const S = this.S; this.ctx.fillStyle = 'rgba(0,0,0,0.6)'; this.ctx.fillRect(0, 0, W, H);
      this.stone(90, 60, 620, 460, { title: S.help });
      let y = 110; for (const l of S.helpLines) y = this.wrap('• ' + l, 110, y, 580, { size: 11, color: '#e8dcc0', lh: 15 }) + 6;
      this.button(320, 478, 160, 28, S.back, 'helpBack');
    }
    drawHeroesBook() {
      const ui = this.ui, S = this.S, c = this.ctx; this.menuBg();
      this.text(S.heroes, 400, 40, { align: 'center', size: 22, bold: true, serif: true, color: '#f0d890' });
      HERO_ORDER.forEach((hid, i) => { const x = 40 + i * 72, y = 60; c.drawImage(this.portrait(hid, 64, 64), x, y); c.strokeStyle = ui.bookHero === hid ? '#ffe060' : BRONZE_D; c.strokeRect(x - 0.5, y - 0.5, 65, 65); this.hit(x, y, 64, 64, 'bookHero', hid, null); });
      const hid = ui.bookHero || 'techies', h = HEROES[hid];
      this.stone(30, 140, 740, 400, {});
      const sp = this.sprites.get(hid, this.t * 0.8, ui.bookAnim || 'walk', this.t * 0.8, 2.4);
      if (sp) c.drawImage(sp.cv, 130 - sp.ox, 380 - sp.oy);
      ['idle', 'walk', 'attack', 'cast'].forEach((a, i) => this.button(50 + i * 52, 500, 48, 20, a, 'bookAnim', { data: a, size: 9, active: (ui.bookAnim || 'walk') === a }));
      this.text(this.L(h.name) + ' — ' + this.L(h.title), 250, 172, { size: 18, bold: true, serif: true, color: '#ffe0a0' });
      let y = this.wrap(this.L(h.lore), 250, 194, 500, { size: 10, color: '#b8a888', lh: 13 }) + 4;
      for (const ab of h.abilities.concat(h.extra || [], h.scepter ? [h.scepter] : [])) {
        c.drawImage(this.A.icons.abil[ab.key], 250, y, 32, 32);
        this.text(this.L(ab.name) + (ab.ult ? ' (' + S.ult + ')' : ''), 290, y + 11, { size: 11, bold: true, color: '#ffe0a0' });
        const desc = this.L(ab.desc).replace(/\{(\w+)\}/g, (m0, k) => { const a = ab.v[k]; return a ? [...new Set(a)].join('/') : '?'; });
        y = this.wrap(desc, 290, y + 24, 460, { size: 9, color: '#e0d4b8', lh: 11 }) + 4; if (y < 0) break;
      }
      this.button(620, 552, 150, 30, S.back, 'back');
    }
    drawArmory() {
      const ui = this.ui, S = this.S, c = this.ctx, col = ui.col, hid = ui.armHero, H0 = HEROES[hid];
      this.menuBg();
      this.text(S.armory, 24, 42, { size: 24, bold: true, serif: true, color: '#f0d890' });
      const total = COS.ITEMS.length, own = col.owned.length;
      this.text(S.collected + ': ' + own + ' / ' + total, 784, 36, { align: 'right', size: 12, color: '#c8b080' });
      this.bar(604, 42, 180, 4, own / total, '#c89a30', '#201608');
      HERO_ORDER.forEach((h, i) => {
        const x = 16, y = 58 + i * 47, sel = h === hid, n = COS.itemsFor(h).filter(it => COS.owns(col, it.id)).length;
        c.fillStyle = sel ? 'rgba(200,150,60,0.28)' : 'rgba(0,0,0,0.32)'; c.fillRect(x, y, 180, 43);
        c.drawImage(this.portrait(ui.lookModel(h), 62, 39), x + 2, y + 2);
        c.strokeStyle = sel ? '#ffe070' : BRONZE_D; c.lineWidth = sel ? 2 : 1; c.strokeRect(x + 0.5, y + 0.5, 179, 42); c.lineWidth = 1;
        this.text(this.L(HEROES[h].name), x + 70, y + 18, { size: 11, bold: true, color: sel ? '#fff0c0' : '#e8d8b0' });
        for (let k = 0; k < 9; k++) { c.fillStyle = k < n ? '#e0b040' : '#3a3020'; c.fillRect(x + 70 + k * 11, y + 28, 9, 5); }
        this.hit(x, y, 180, 43, 'armHero', h, null);
      });
      const SX = 206, SY = 58, SW = 290, SH = 468, tone = { str: '#b8402a', agi: '#3a9a44', int: '#3a6ad0' }[H0.attr];
      const bg = c.createLinearGradient(0, SY, 0, SY + SH); bg.addColorStop(0, '#0c0906'); bg.addColorStop(1, '#241a10'); c.fillStyle = bg; c.fillRect(SX, SY, SW, SH);
      const gl = c.createRadialGradient(SX + SW / 2, SY + 220, 10, SX + SW / 2, SY + 220, 230); gl.addColorStop(0, tone + '66'); gl.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gl; c.fillRect(SX, SY, SW, SH);
      c.fillStyle = '#2a2016'; c.beginPath(); c.ellipse(SX + SW / 2, SY + 392, 104, 26, 0, 0, 7); c.fill(); c.strokeStyle = BRONZE_D; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#3a2e20'; c.beginPath(); c.ellipse(SX + SW / 2, SY + 388, 96, 22, 0, 0, 7); c.fill(); c.strokeStyle = BRONZE; c.lineWidth = 1; c.stroke();
      const lm = ui.lookModel(hid), sp = this.sprites.get(lm, ui.armAngle, 'idle', this.t * 0.4, this.stageScale(lm, 250));
      if (sp) c.drawImage(sp.cv, Math.round(SX + SW / 2 - sp.ox), Math.round(SY + 390 - sp.oy));
      c.strokeStyle = BRONZE_D; c.lineWidth = 2; c.strokeRect(SX - 1, SY - 1, SW + 2, SH + 2); c.lineWidth = 1; c.strokeStyle = BRONZE; c.strokeRect(SX + 1.5, SY + 1.5, SW - 3, SH - 3);
      this.text(this.L(H0.name), SX + SW / 2, SY + 438, { align: 'center', size: 18, bold: true, serif: true, color: '#ffe0a0' });
      this.text(this.L(H0.title), SX + SW / 2, SY + 456, { align: 'center', size: 10, color: '#a89878' });
      this.button(SX + 10, SY + 12, 28, 24, '◄', 'armRot', { data: -1, size: 12 }); this.button(SX + SW - 38, SY + 12, 28, 24, '►', 'armRot', { data: 1, size: 12 });
      const PX = 508;
      COS.SLOT_ORDER.forEach((slot, si) => {
        const y = 58 + si * 156, eq = COS.equippedId(col, hid, slot), eqIt = eq ? COS.BY_ID[eq] : null;
        c.fillStyle = 'rgba(0,0,0,0.32)'; c.fillRect(PX - 6, y - 4, 288, 146);
        this.text(this.L(COS.SLOTS[hid][slot]), PX, y + 14, { size: 14, bold: true, serif: true, color: '#f0d890' });
        this.text(eqIt ? this.L(eqIt.name) : this.L(COS.DEFAULT_NAME), PX + 276, y + 14, { align: 'right', size: 10, color: eqIt ? this.rarityCol(eqIt.rarity) : '#a09070' });
        [null, ...COS.itemsFor(hid, slot)].forEach((it, i) => {
          const x = PX + i * 69, ty = y + 24, sz = 64, owned = !it || COS.owns(col, it.id), on = it ? eq === it.id : !eq;
          const model = G.heroModel(hid, it ? { [slot]: it.style } : null), rc = it ? this.rarityCol(it.rarity) : BRONZE;
          c.drawImage(this.portrait(model, sz, sz, slot === 'head' ? null : slot === 'back' ? 'back' : 'full'), x, ty);
          if (!owned) { c.fillStyle = 'rgba(6,4,2,0.68)'; c.fillRect(x, ty, sz, sz); c.fillStyle = '#8a7a5a'; c.fillRect(x + sz / 2 - 6, ty + sz / 2 - 2, 12, 10); c.strokeStyle = '#8a7a5a'; c.lineWidth = 2; c.beginPath(); c.arc(x + sz / 2, ty + sz / 2 - 3, 4.5, Math.PI, 0); c.stroke(); c.lineWidth = 1; }
          c.strokeStyle = on ? '#ffe070' : owned ? rc : 'rgba(120,100,70,0.6)'; c.lineWidth = on ? 3 : 2; c.strokeRect(x + (on ? 1.5 : 1), ty + (on ? 1.5 : 1), sz - (on ? 3 : 2), sz - (on ? 3 : 2)); c.lineWidth = 1;
          if (it) { c.fillStyle = owned ? rc : 'rgba(120,100,70,0.6)'; c.fillRect(x, ty + sz + 3, sz, 3); }
          if (on) { c.fillStyle = '#ffe070'; c.beginPath(); c.arc(x + sz - 8, ty + 8, 6, 0, 7); c.fill(); c.strokeStyle = '#2a1a08'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + sz - 11, ty + 8); c.lineTo(x + sz - 8.5, ty + 10.5); c.lineTo(x + sz - 4.5, ty + 5.5); c.stroke(); c.lineWidth = 1; }
          const hot = ui.hover && ui.hover.id === 'armItem' && ui.hover.data.slot === slot && ui.hover.data.i === i; if (hot && owned && !on) { c.strokeStyle = '#fff8d0'; c.strokeRect(x - 0.5, ty - 0.5, sz + 1, sz + 1); }
          this.hit(x, ty, sz, sz, 'armItem', { slot, i, id: it ? it.id : null }, null);
        });
        this.text(COS.itemsFor(hid, slot).filter(it => COS.owns(col, it.id)).length + ' / 3 ' + S.ownedShort, PX, y + 132, { size: 10, color: '#8a7a5a' });
      });
      this.stone(206, 536, 578, 56, {});
      c.drawImage(this.chestArt(64, 46, col.chests.length ? col.chests[0].hero : hid), 214, 541);
      const nCh = col.chests.length;
      this.text(S.chests + ': ' + nCh, 286, 560, { size: 14, bold: true, serif: true, color: nCh ? '#ffe0a0' : '#a09070' });
      this.text(nCh ? S.chestHintOpen : COS.canGrant(col) ? S.chestHintEmpty : S.collectionDone, 286, 578, { size: 10, color: '#a89878' });
      this.button(534, 548, 130, 32, S.openChest, 'armOpen', { disabled: !nCh, color: '#ffe080', size: 13 });
      this.button(672, 548, 104, 32, S.back, 'back', { size: 13 });
    }
    stageScale(model, px) { const m = G.MODELS[model]; return m ? Math.round(Math.min(5, Math.max(2, px / ((m.h || 120) * (m.scale || 1) * KZ))) * 10) / 10 : 2.5; }
    chestArt(w, h, hero, o = {}) {
      const key = [w, h, hero, o.lid || 0, o.glow || '', Math.round((o.glowA || 0) * 12)].join('|'), cache = this.chestCache || (this.chestCache = new Map());
      if (!cache.has(key)) { if (cache.size > 80) cache.clear(); const tone = hero && HEROES[hero] ? { str: '#c85030', agi: '#50b050', int: '#5080e0' }[HEROES[hero].attr] : '#c89030'; cache.set(key, D.ItemArt.chest(w, h, Object.assign({ gem: tone }, o, { glowA: Math.round((o.glowA || 0) * 12) / 12 }))); }
      return cache.get(key);
    }
    drawChest() {
      const ui = this.ui, ch = ui.chest, c = this.ctx, S = this.S; if (!ch) return;
      this.hits = []; this.hit(0, 0, W, H, ch.phase === 'shake' ? 'chestSkip' : 'chestBackdrop', null, null);
      c.fillStyle = 'rgba(0,0,0,0.82)'; c.fillRect(0, 0, W, H);
      const it = ch.res && ch.res.item, rc = it ? this.rarityCol(it.rarity) : '#c89030', cx = 400;
      const rgbC = G.hex(rc).join(','), rays = (y, k, r) => { c.save(); c.translate(cx, y); c.rotate(this.t * 0.2); c.globalCompositeOperation = 'lighter'; const gr = c.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, `rgba(${rgbC},${0.42 * k})`); gr.addColorStop(0.5, `rgba(${rgbC},${0.14 * k})`); gr.addColorStop(1, `rgba(${rgbC},0)`); c.fillStyle = gr; for (let i = 0; i < 16; i++) { c.rotate(Math.PI * 2 / 16); c.beginPath(); c.moveTo(0, 0); c.lineTo(-r * (i % 2 ? 0.07 : 0.13), -r); c.lineTo(r * (i % 2 ? 0.07 : 0.13), -r); c.closePath(); c.fill(); } const core = c.createRadialGradient(0, 0, 0, 0, 0, r * 0.45); core.addColorStop(0, `rgba(${rgbC},${0.35 * k})`); core.addColorStop(1, `rgba(${rgbC},0)`); c.fillStyle = core; c.beginPath(); c.arc(0, 0, r * 0.45, 0, 7); c.fill(); c.restore(); };
      if (ch.phase === 'shake') {
        const k = Math.min(1, ch.t / 1.4), sh = Math.sin(ch.t * 38) * 5 * k * k;
        rays(250, k, 260);
        c.drawImage(this.chestArt(264, 192, ch.res.chest.hero, { glow: rc, glowA: 0.2 + k * 0.7 }), Math.round(cx - 132 + sh), 150 + Math.round(Math.abs(sh) * 0.3));
        this.text(S.chestOf + ': ' + this.L(HEROES[ch.res.chest.hero].name), cx, 392, { align: 'center', size: 16, bold: true, serif: true, color: '#f0d890' });
        this.text(S.clickToSkip, cx, 414, { align: 'center', size: 10, color: '#8a7a5a' });
        return;
      }
      const k = Math.min(1, ch.t / 0.45);
      rays(214, k, 170 + 110 * k);
      c.fillStyle = 'rgba(0,0,0,0.45)'; c.beginPath(); c.ellipse(cx, 316, 80, 16, 0, 0, 7); c.fill();
      const model = G.heroModel(it.hero, Object.assign(COS.look(ui.col, it.hero), { [it.slot]: it.style }));
      const sp = this.sprites.get(model, Math.PI * 0.62 + (it.slot === 'back' ? Math.PI : 0) + Math.sin(this.t * 0.8) * 0.5, 'idle', this.t * 0.5, this.stageScale(model, 190));
      if (sp) { c.globalAlpha = k; c.drawImage(sp.cv, Math.round(cx - sp.ox), Math.round(316 - sp.oy + (1 - k) * 24)); c.globalAlpha = 1; }
      const R = COS.RARITY[it.rarity];
      c.fillStyle = rc; c.fillRect(cx - 64, 340, 128, 18); this.text(this.L(R.name), cx, 353, { align: 'center', size: 11, bold: true, color: '#140c04', shadow: false });
      this.text(this.L(it.name), cx, 392, { align: 'center', size: 24, bold: true, serif: true, color: rc });
      this.text(this.L(HEROES[it.hero].name) + ' — ' + this.L(COS.SLOTS[it.hero][it.slot]), cx, 414, { align: 'center', size: 12, color: '#c8b890' });
      const on = COS.equippedId(ui.col, it.hero, it.slot) === it.id, more = ui.col.chests.length;
      const btns = [[on ? S.equipped : S.equip, 'chestEquip', { disabled: on, color: '#ffe080' }], ...(more ? [[S.openNext + ' (' + more + ')', 'chestNext', {}]] : []), [S.done, 'chestClose', {}]];
      const bw = 150, x0 = cx - (btns.length * bw + (btns.length - 1) * 12) / 2;
      btns.forEach(([label, id, o], i) => this.button(x0 + i * (bw + 12), 444, bw, 32, label, id, Object.assign({ size: 13 }, o)));
    }
    drawToast() {
      const ui = this.ui, t = ui.toast; if (!t) return;
      const age = (performance.now() - t.at) / 1000; if (age > 2.8) { ui.toast = null; return; }
      const c = this.ctx, w = Math.max(220, this.tw(t.text, 12, true) + 40), x = 400 - w / 2, y = ui.screen === 'game' ? 60 : 6;
      c.globalAlpha = age > 2.3 ? (2.8 - age) * 2 : 1;
      c.fillStyle = 'rgba(14,10,6,0.94)'; c.fillRect(x, y, w, 30); c.strokeStyle = BRONZE; c.strokeRect(x + 0.5, y + 0.5, w - 1, 29);
      this.text(t.text, 400, y + 20, { align: 'center', size: 12, bold: true, color: t.color || '#ffe0a0' });
      c.globalAlpha = 1;
    }
    drawEnd(g) {
      const ui = this.ui, S = this.S, c = this.ctx, win = g.winner;
      c.fillStyle = 'rgba(0,0,0,0.75)'; c.fillRect(0, 0, W, H);
      const mine = ui.player ? ui.player.team : 0, victory = win === mine;
      c.fillStyle = 'rgba(0,0,0,0.85)'; c.fillRect(0, 0, W, 40);
      this.text((win === 0 ? S.radiantWin : S.direWin) + (ui.player ? '  —  ' + (victory ? S.victory : S.defeat) : ''), 400, 28, { align: 'center', size: 22, bold: true, serif: true, color: ui.player ? (victory ? '#ffe080' : '#ff7060') : TEAMC[win] });
      this.drawScoreboard(g);
      const rw = ui.reward ? 214 : 0, X = 60, Y = 420, Wd = 680 - rw, Hd = 124; this.stone(X, Y, Wd, Hd, {});
      if (ui.reward) this.drawReward(X + Wd + 6, Y, rw - 6, Hd);
      this.text(S.networth, X + 10, Y + 16, { size: 10, bold: true, color: '#c8b080' });
      const hist = g.nwHistory; if (hist.length > 1) {
        const max = Math.max(1000, ...hist.map(p => Math.abs(p.d))), mid = Y + Hd / 2 + 6;
        c.strokeStyle = '#5a4a30'; c.beginPath(); c.moveTo(X + 10, mid); c.lineTo(X + Wd - 10, mid); c.stroke();
        c.beginPath(); hist.forEach((p, i) => { const x = X + 10 + i / (hist.length - 1) * (Wd - 20), y = mid - p.d / max * (Hd / 2 - 16); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.strokeStyle = '#f0d890'; c.lineWidth = 2; c.stroke(); c.lineWidth = 1;
        this.text('+' + Math.round(max), X + Wd - 12, Y + 22, { align: 'right', size: 9, color: TEAMC[0] }); this.text('-' + Math.round(max), X + Wd - 12, Y + Hd - 6, { align: 'right', size: 9, color: TEAMC[1] });
      }
      this.button(250, 552, 140, 30, S.continue, 'endContinue'); this.button(410, 552, 140, 30, S.toMenu, 'toMenu');
    }
    drawReward(x, y, w, h) {
      const ui = this.ui, S = this.S, c = this.ctx, rw = ui.reward;
      this.stone(x, y, w, h, {});
      this.text(S.reward, x + 10, y + 16, { size: 10, bold: true, color: '#c8b080' });
      if (rw.item) {
        const it = rw.item, rc = this.rarityCol(it.rarity);
        c.drawImage(this.portrait(G.heroModel(it.hero, { [it.slot]: it.style }), 56, 56, it.slot === 'head' ? null : it.slot === 'back' ? 'back' : 'full'), x + 10, y + 26); c.strokeStyle = rc; c.lineWidth = 2; c.strokeRect(x + 11, y + 27, 54, 54); c.lineWidth = 1;
        this.wrap(this.L(it.name), x + 74, y + 40, w - 82, { size: 12, bold: true, color: rc, lh: 14 });
        this.text(this.L(COS.RARITY[it.rarity].name), x + 74, y + 78, { size: 10, color: '#a89878' });
      } else if (rw.granted) {
        c.drawImage(this.chestArt(88, 64, rw.hero, { glow: '#ffd060', glowA: 0.25 + Math.sin(this.t * 3) * 0.1 }), x + 4, y + 22);
        this.wrap(S.chestOf + ': ' + this.L(HEROES[rw.hero].name), x + 96, y + 38, w - 104, { size: 11, bold: true, color: '#ffe0a0', lh: 13 });
      } else this.wrap(S.collectionDone, x + 10, y + 42, w - 20, { size: 11, color: '#a89878', lh: 14 });
      if (ui.col.chests.length) this.button(x + 10, y + h - 30, w - 20, 22, S.openChest + (ui.col.chests.length > 1 ? ' (' + ui.col.chests.length + ')' : ''), 'endOpen', { size: 11, color: '#ffe080' });
    }
  }
  Renderer.W = W; Renderer.H = H; Renderer.TOP = TOP; Renderer.HUD_Y = HUD_Y; Renderer.PCOL = PCOL; Renderer.MM = MM; Renderer.statusKey = statusKey;
  D.Renderer = Renderer;
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Dota98 = globalThis.Dota98 || {});
