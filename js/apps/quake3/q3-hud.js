(function (Q) {
  'use strict';
  const WP = Q.WP;
  const FONT = "Impact, 'Arial Narrow Bold', 'Arial Black', sans-serif";
  const SMALL = "'Arial Black', Verdana, sans-serif";

  function wcol(w, a) {
    const c = Q.WEAPONS[w] ? Q.WEAPONS[w].color : [1, 1, 1];
    return `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a === undefined ? 1 : a})`;
  }

  function weaponIcon(ctx, w, x, y, s, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 32, s / 32);
    ctx.globalAlpha *= alpha === undefined ? 1 : alpha;
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#9a9a9e';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.6;
    const R = (x0, y0, w0, h0, c) => { ctx.fillStyle = c || '#9a9a9e'; ctx.fillRect(x0, y0, w0, h0); ctx.strokeRect(x0, y0, w0, h0); };
    const C = (cx, cy, r, c) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); ctx.stroke(); };
    switch (w) {
      case 1: R(4, 12, 12, 12, '#8a7a6a'); C(22, 16, 8, '#c8d8f0'); C(22, 16, 2, '#333'); break;
      case 2: R(2, 13, 18, 6, '#8a8a8e'); R(20, 14, 10, 3, '#555'); R(8, 19, 4, 8, '#444'); R(3, 18, 4, 7, '#555'); break;
      case 3: R(1, 13, 10, 6, '#7a5030'); R(11, 12, 19, 3, '#888'); R(11, 16, 19, 3, '#888'); R(10, 18, 4, 6, '#333'); break;
      case 4: C(12, 16, 8, '#5a7a4a'); R(19, 13, 11, 6, '#555'); R(8, 22, 5, 7, '#333'); break;
      case 5: R(1, 12, 29, 7, '#8a6a5a'); R(26, 11, 4, 9, '#333'); R(10, 19, 4, 8, '#333'); R(12, 8, 6, 4, '#a02010'); break;
      case 6: R(3, 12, 14, 8, '#9aa0b0'); R(17, 11, 12, 2.5, '#cde'); R(17, 18.5, 12, 2.5, '#cde'); R(6, 20, 4, 7, '#333'); break;
      case 7: R(2, 13, 14, 6, '#4a5a50'); R(16, 11, 15, 2.5, '#333'); R(16, 18.5, 15, 2.5, '#333'); R(16, 14.5, 15, 3, '#40ff60'); break;
      case 8: R(2, 13, 12, 7, '#606078'); C(15, 16, 6, '#9a70ff'); R(20, 14, 10, 4, '#777'); break;
      case 9: R(2, 9, 20, 14, '#5a605a'); R(12, 12, 6, 8, '#60ff60'); R(22, 10, 8, 12, '#333'); break;
      default: break;
    }
    ctx.restore();
  }
  Q.weaponIcon = weaponIcon;

  function itemIcon(ctx, key, x, y, s) {
    const d = Q.ITEMS[key];
    if (!d) return;
    if (d.type === 'weapon') { weaponIcon(ctx, d.wp, x, y, s); return; }
    ctx.save();
    ctx.translate(x + s / 2, y + s / 2);
    const k = s / 32;
    ctx.lineWidth = 1.5 * k;
    ctx.strokeStyle = '#111';
    const col = d.color ? `rgb(${d.color.map(c => Math.round(c * 255)).join(',')})` : '#ccc';
    if (d.type === 'health') {
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 12 * k, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(-3 * k, -8 * k, 6 * k, 16 * k); ctx.fillRect(-8 * k, -3 * k, 16 * k, 6 * k);
    } else if (d.type === 'armor') {
      ctx.fillStyle = d.amount === 5 ? '#8ab050' : col;
      ctx.beginPath(); ctx.moveTo(-12 * k, -10 * k); ctx.lineTo(12 * k, -10 * k); ctx.lineTo(9 * k, 12 * k); ctx.lineTo(-9 * k, 12 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (d.type === 'ammo') {
      ctx.fillStyle = '#555'; ctx.fillRect(-10 * k, -8 * k, 20 * k, 16 * k); ctx.strokeRect(-10 * k, -8 * k, 20 * k, 16 * k);
      ctx.fillStyle = wcol(d.wp); ctx.fillRect(-10 * k, -3 * k, 20 * k, 5 * k);
    } else if (d.type === 'powerup') {
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 13 * k, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `bold ${16 * k}px ${SMALL}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText({ quad: 'Q', regen: '+', haste: 'H', battlesuit: 'B', invis: 'I' }[d.pw] || '?', 0, 1 * k);
    } else if (d.type === 'holdable') {
      ctx.fillStyle = d.hold === 'medkit' ? '#eee' : '#4cf'; ctx.fillRect(-11 * k, -9 * k, 22 * k, 18 * k); ctx.strokeRect(-11 * k, -9 * k, 22 * k, 18 * k);
      if (d.hold === 'medkit') { ctx.fillStyle = '#d00'; ctx.fillRect(-2.5 * k, -7 * k, 5 * k, 14 * k); ctx.fillRect(-7 * k, -2.5 * k, 14 * k, 5 * k); }
    }
    ctx.restore();
  }
  Q.itemIcon = itemIcon;

  function medal(ctx, award, x, y, s) {
    const colors = { excellent: '#e8c040', impressive: '#50d060', gauntlet: '#d04030', accuracy: '#40a0f0', perfect: '#f0f0f0', frags: '#c07030' };
    const glyph = { excellent: 'E', impressive: 'I', gauntlet: 'G', accuracy: 'A', perfect: 'P', frags: 'F' };
    ctx.save();
    ctx.translate(x + s / 2, y + s / 2);
    const k = s / 48;
    ctx.fillStyle = '#801010'; ctx.fillRect(-9 * k, -24 * k, 7 * k, 20 * k); ctx.fillStyle = '#1030a0'; ctx.fillRect(2 * k, -24 * k, 7 * k, 20 * k);
    ctx.beginPath();
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = (i % 2 ? 15 : 19) * k; ctx.lineTo(Math.cos(a) * r, 6 * k + Math.sin(a) * r); }
    ctx.closePath();
    ctx.fillStyle = colors[award] || '#ccc'; ctx.fill(); ctx.strokeStyle = '#201008'; ctx.lineWidth = 2 * k; ctx.stroke();
    ctx.fillStyle = '#201008'; ctx.font = `bold ${18 * k}px ${SMALL}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(glyph[award] || '?', 0, 7 * k);
    ctx.restore();
  }
  Q.medalIcon = medal;

  function crosshair(ctx, type, cx, cy, s, col) {
    ctx.save();
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1, s * 0.09);
    const r = s / 2;
    ctx.beginPath();
    switch (type) {
      case 1: ctx.moveTo(cx - r, cy); ctx.lineTo(cx - r * 0.3, cy); ctx.moveTo(cx + r * 0.3, cy); ctx.lineTo(cx + r, cy); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy - r * 0.3); ctx.moveTo(cx, cy + r * 0.3); ctx.lineTo(cx, cy + r); ctx.stroke(); break;
      case 2: ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2); ctx.stroke(); ctx.fillRect(cx - 1, cy - 1, 2, 2); break;
      case 3: ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3); break;
      case 4: ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke(); break;
      case 5: ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2); ctx.moveTo(cx - r, cy); ctx.lineTo(cx - r * 0.5, cy); ctx.moveTo(cx + r * 0.5, cy); ctx.lineTo(cx + r, cy); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy - r * 0.5); ctx.moveTo(cx, cy + r * 0.5); ctx.lineTo(cx, cy + r); ctx.stroke(); break;
      case 6: ctx.moveTo(cx - r * 0.7, cy + r * 0.5); ctx.lineTo(cx, cy - r * 0.2); ctx.lineTo(cx + r * 0.7, cy + r * 0.5); ctx.stroke(); break;
      default: ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2); ctx.stroke(); ctx.fillRect(cx - 1, cy - 1, 2, 2);
    }
    ctx.restore();
  }
  Q.drawCrosshair = crosshair;

  class HUD {
    constructor(canvas) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d');
      this.notify = [];
      this.center = null;
      this.pickup = null;
      this.awards = [];
      this.wselT = -10;
      this.flash = 0;
      this.flashDir = null;
      this.attacker = null;
      this.big = null;
      this.lowAmmoT = 0;
    }

    resize(w, h) { if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; } }

    reset() {
      this.notify = [];
      this.center = null;
      this.pickup = null;
      this.awards = [];
      this.attacker = null;
      this.flash = 0;
      this.wselT = -10;
    }

    add(text, color, time) {
      this.notify.push({ text, color: color || '#fff', t: time });
      if (this.notify.length > 5) this.notify.shift();
    }

    event(e, game, me, time) {
      const P = id => game.player(id);
      if (e.t === 'obit') {
        this.add(e.text, '#ffffff', time);
        if (me && e.a === me.id && e.v !== me.id) {
          const v = P(e.v);
          const r = game.rankOf(me);
          this.center = { text: 'You fragged ' + (v ? v.name : '?'), sub: game.teamGame ? '' : (r.tied ? 'Tied for ' : '') + Q.place(r.rank) + ' place with ' + me.score, t: time };
        }
        if (me && e.v === me.id && e.a && e.a !== me.id) {
          const a = P(e.a);
          this.center = { text: 'Fragged by ' + (a ? a.name : '?'), sub: '', t: time };
        }
      } else if (e.t === 'chat') {
        this.add(e.name + ': ' + e.text, e.team === 'red' ? '#ff8080' : e.team === 'blue' ? '#80a0ff' : '#60ff60', time);
      } else if (e.t === 'pickup' && me && e.p === me.id) {
        this.pickup = { key: e.key, t: time };
      } else if (e.t === 'award' && me && e.p === me.id) {
        this.awards.push({ award: e.award, t: time, count: me.stats[e.award] || 1 });
        if (this.awards.length > 3) this.awards.shift();
      } else if (e.t === 'damage' && me && e.v === me.id) {
        this.flash = Math.min(1, this.flash + e.dmg / 40);
        this.flashDir = e.dir;
        if (e.a && e.a !== me.id) this.attacker = { id: e.a, t: time };
      } else if (e.t === 'print') {
        this.add(e.text, e.color || '#fff', time);
      }
    }

    number(ctx, val, x, y, width, h, style) {
      const s = String(Math.max(-99, Math.min(999, Math.round(val))));
      ctx.save();
      ctx.font = `${h}px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'alphabetic';
      const g = ctx.createLinearGradient(0, y - h * 0.8, 0, y);
      if (style === 'white') { g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#b0b0b8'); }
      else if (style === 'red') { g.addColorStop(0, '#ff7050'); g.addColorStop(1, '#900000'); }
      else { g.addColorStop(0, '#fff480'); g.addColorStop(0.5, '#f8b830'); g.addColorStop(1, '#a05808'); }
      ctx.lineWidth = Math.max(2, h / 14);
      ctx.strokeStyle = '#1a0a00';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowOffsetX = h / 24; ctx.shadowOffsetY = h / 24;
      ctx.strokeText(s, x + width, y);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = g;
      ctx.fillText(s, x + width, y);
      ctx.restore();
    }

    text(ctx, t, x, y, size, color, align, font) {
      ctx.font = `${size}px ${font || SMALL}`;
      ctx.textAlign = align || 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillText(t, x + Math.max(1, size / 12), y + Math.max(1, size / 12));
      ctx.fillStyle = color || '#fff';
      ctx.fillText(t, x, y);
    }

    layout() {
      const w = this.cv.width, h = this.cv.height;
      const s = Math.min(w / 640, h / 480);
      return { w, h, s, ox: (w - 640 * s) / 2, oy: h - 480 * s };
    }

    icons(st) {
      const L = this.layout();
      const me = st.me;
      const out = [];
      if (!me || !st.showStatus) return out;
      const y = L.h - 46 * L.s, sz = 42 * L.s;
      if (me.weapon !== WP.GAUNTLET) out.push({ kind: 'weapon', wp: me.weapon, x: L.ox + 102 * L.s, y, w: sz, h: sz });
      out.push({ kind: 'head', p: me, x: L.ox + 288 * L.s, y: y - 2 * L.s, w: sz, h: sz + 4 * L.s });
      if (me.armor > 0) out.push({ kind: 'armor', x: L.ox + 472 * L.s, y, w: sz, h: sz });
      if (this.attacker && st.time - this.attacker.t < 8) {
        const a = st.game.player(this.attacker.id);
        if (a && a !== me) out.push({ kind: 'head', p: a, x: L.w - 56 * L.s, y: 26 * L.s, w: 48 * L.s, h: 48 * L.s });
      }
      return out;
    }

    draw(st) {
      const ctx = this.ctx, L = this.layout(), s = L.s;
      const { game, me, time } = st;
      ctx.clearRect(0, 0, L.w, L.h);
      if (!game) return;
      const X = x => L.ox + x * s;
      this.flash = Math.max(0, this.flash - st.dt * 1.6);
      if (this.flash > 0 && me && me.alive) {
        ctx.fillStyle = `rgba(160,0,0,${Math.min(0.5, this.flash * 0.45)})`;
        ctx.fillRect(0, 0, L.w, L.h);
      }
      if (st.intermission) { this.drawScoreboard(st, L, true); this.drawNotify(st, L); return; }
      if (me && me.alive && st.showStatus) {
        const ammo = me.ammo[me.weapon];
        if (me.weapon !== WP.GAUNTLET) this.number(ctx, ammo, X(0), L.h - 6 * s, 98 * s, 50 * s, ammo === 0 ? 'red' : 'gold');
        const hp = me.health;
        this.number(ctx, hp, X(185), L.h - 6 * s, 98 * s, 50 * s, hp > 100 ? 'white' : hp > 25 ? 'gold' : (Math.floor(time * 4) % 2 ? 'red' : 'gold'));
        if (me.armor > 0) this.number(ctx, me.armor, X(370), L.h - 6 * s, 98 * s, 50 * s, me.armor > 100 ? 'white' : 'gold');
        if (me.weapon !== WP.GAUNTLET && ammo > 0 && ammo <= (me.weapon === WP.LIGHTNING || me.weapon === WP.MACHINEGUN || me.weapon === WP.PLASMA ? 20 : 3)) this.text(ctx, 'LOW AMMO WARNING', L.w / 2, L.h - 88 * s, 12 * s, '#ffe040', 'center');
        if (ammo === 0 && me.weapon !== WP.GAUNTLET) this.text(ctx, 'OUT OF AMMO', L.w / 2, L.h - 88 * s, 12 * s, '#ff4030', 'center');
        let py = L.h - 120 * s;
        for (const k of Q.POWERUPS) {
          if (!(me.powerups[k] > game.time)) continue;
          const left = Math.ceil(me.powerups[k] - game.time);
          const key = Object.keys(Q.ITEMS).find(kk => Q.ITEMS[kk].pw === k);
          if (left > 3 || Math.floor(time * 6) % 2) itemIcon(ctx, key, L.w - 44 * s, py - 16 * s, 32 * s);
          this.number(ctx, left, L.w - 150 * s, py + 14 * s, 100 * s, 34 * s, 'gold');
          py -= 40 * s;
        }
        if (me.holdable) {
          const key = me.holdable === 'medkit' ? 'holdable_medkit' : 'holdable_teleporter';
          itemIcon(ctx, key, L.w - 44 * s, L.h - 100 * s - (py < L.h - 120 * s ? L.h - 120 * s - py : 0), 32 * s);
        }
        if (this.pickup && time - this.pickup.t < 3) {
          const a = Math.min(1, (3 - (time - this.pickup.t)) * 2);
          ctx.globalAlpha = a;
          itemIcon(ctx, this.pickup.key, X(4), L.h - 112 * s, 30 * s);
          this.text(ctx, Q.ITEMS[this.pickup.key].name, X(40), L.h - 97 * s, 13 * s, '#fff');
          ctx.globalAlpha = 1;
        }
        if (time - this.wselT < 1.4) this.drawWeaponSelect(ctx, L, me, st.wsel || me.weapon, 1 - Math.max(0, time - this.wselT - 1) / 0.4);
        if (st.crosshair && !st.dead) {
          const cs = st.crosshairSize * s;
          crosshair(ctx, st.crosshair, L.w / 2, L.h / 2, cs, st.crosshairColor || '#ffffff');
        }
        if (st.target) this.text(ctx, st.target, L.w / 2, L.h / 2 + 36 * s, 11 * s, '#ffffff', 'center');
      }
      this.drawScores(st, L);
      if (this.attacker && st.time - this.attacker.t < 8 && me) {
        const a = game.player(this.attacker.id);
        if (a && a !== me) this.text(ctx, a.name, L.w - 32 * s, 86 * s, 11 * s, '#ffffff', 'center');
      }
      if (st.timer) this.text(ctx, Q.fmtTime(game.matchTime), L.w - 8 * s, 10 * s, 13 * s, '#ffffff', 'right');
      if (st.fps) this.text(ctx, st.fps + ' fps', L.w - 8 * s, (st.timer ? 28 : 10) * s, 11 * s, '#ffffff', 'right');
      this.drawNotify(st, L);
      const board = st.scores || (me && !me.alive && game.state === 'play') || game.state === 'exiting';
      if (this.center && time - this.center.t < 1.8 && !board) {
        const a = Math.min(1, (1.8 - (time - this.center.t)) * 2.5);
        ctx.globalAlpha = a;
        this.text(ctx, this.center.text, L.w / 2, 110 * s + L.oy / 3, 15 * s, '#ffffff', 'center');
        if (this.center.sub) this.text(ctx, this.center.sub, L.w / 2, 132 * s + L.oy / 3, 12 * s, '#ffffff', 'center');
        ctx.globalAlpha = 1;
      }
      const aw = this.awards.filter(a => time - a.t < 2.2);
      aw.forEach((a, i) => {
        const x = L.w / 2 - (aw.length * 56 * s) / 2 + i * 56 * s;
        medal(ctx, a.award, x, 150 * s, 48 * s);
        if (a.count > 1) this.text(ctx, String(a.count), x + 24 * s, 206 * s, 12 * s, '#fff', 'center');
      });
      if (game.state === 'warmup') {
        const n = Math.ceil(game.warmupEnd - game.time);
        this.text(ctx, n > 0 ? String(n) : 'FIGHT!', L.w / 2, L.h * 0.3, 42 * s, '#ffffff', 'center', FONT);
        this.text(ctx, st.arenaTitle || '', L.w / 2, L.h * 0.3 - 46 * s, 14 * s, '#ffd040', 'center');
      } else if (game.state === 'play' && game.time - game.matchStart < 1) {
        ctx.globalAlpha = 1 - (game.time - game.matchStart);
        this.text(ctx, 'FIGHT!', L.w / 2, L.h * 0.3, 46 * s, '#ff3020', 'center', FONT);
        ctx.globalAlpha = 1;
      }
      if (game.sudden && game.state === 'play') this.text(ctx, 'SUDDEN DEATH', L.w / 2, 40 * s, 14 * s, '#ff5030', 'center');
      if (me && !me.alive && game.state !== 'intermission' && !st.demo) {
        if (game.time >= me.respawnAt) this.text(ctx, 'Click FIRE to respawn', L.w / 2, L.h * 0.7, 13 * s, '#ffffff', 'center');
      }
      if (st.follow) this.text(ctx, st.follow, L.w / 2, L.h - 72 * s, 11 * s, '#ffffff', 'center');
      if (board) this.drawScoreboard(st, L, false);
    }

    drawNotify(st, L) {
      const ctx = this.ctx, s = L.s;
      const now = st.time;
      this.notify = this.notify.filter(n => now - n.t < 7);
      this.notify.forEach((n, i) => this.text(ctx, n.text, 8 * s, (12 + i * 16) * s, 11 * s, n.color));
    }

    drawWeaponSelect(ctx, L, me, sel, a) {
      const s = L.s;
      const ws = [];
      for (let w = 1; w <= 9; w++) if (me.weapons[w]) ws.push(w);
      const size = 32 * s, gap = 8 * s;
      const total = ws.length * (size + gap) - gap;
      let x = L.w / 2 - total / 2;
      const y = L.h - 150 * s;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, a));
      for (const w of ws) {
        if (w === sel) { ctx.strokeStyle = '#ffd040'; ctx.lineWidth = 2 * s; ctx.strokeRect(x - 3 * s, y - 3 * s, size + 6 * s, size + 6 * s); }
        weaponIcon(ctx, w, x, y, size, me.ammo[w] === 0 && w !== 1 ? 0.35 : 1);
        if (me.ammo[w] === 0 && w !== 1) { ctx.strokeStyle = '#ff2020'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + size, y + size); ctx.stroke(); }
        x += size + gap;
      }
      if (Q.WEAPONS[sel]) this.text(ctx, Q.WEAPONS[sel].name, L.w / 2, y - 14 * s, 12 * s, '#ffffff', 'center');
      ctx.restore();
    }

    drawScores(st, L) {
      const ctx = this.ctx, s = L.s, game = st.game, me = st.me || st.followed;
      const y = L.h - 14 * s;
      const box = (x, val, color, own) => {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(x, y - 34 * s, 50 * s, 38 * s);
        ctx.globalAlpha = 1;
        if (own) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5 * s; ctx.strokeRect(x, y - 34 * s, 50 * s, 38 * s); }
        this.text(ctx, String(val), x + 25 * s, y - 15 * s, 18 * s, '#ffffff', 'center', FONT);
      };
      const x0 = L.w - 116 * s;
      if (game.teamGame) {
        box(x0, game.teamScores.red, '#c01010', me && me.team === 'red');
        box(x0 + 56 * s, game.teamScores.blue, '#1030c0', me && me.team === 'blue');
      } else if (me) {
        const r = game.ranking();
        const other = r[0] === me ? r[1] : r[0];
        const mineFirst = r[0] === me;
        if (mineFirst) { box(x0, me.score, '#1030c0', true); if (other) box(x0 + 56 * s, other.score, '#606060', false); }
        else { box(x0, other ? other.score : 0, '#c01010', false); box(x0 + 56 * s, me.score, '#1030c0', true); }
      }
      if (game.fraglimit) this.text(ctx, String(game.fraglimit), x0 - 10 * s, y - 15 * s, 18 * s, '#ffffff', 'right', FONT);
    }

    drawScoreboard(st, L, inter) {
      const ctx = this.ctx, s = L.s, game = st.game, me = st.me;
      const rows = game.ranking();
      const w = 440 * s, x = L.w / 2 - w / 2;
      let y = (inter ? 60 : 70) * s;
      let head = '';
      if (game.teamGame) {
        const rs = game.teamScores.red, bs = game.teamScores.blue;
        head = rs === bs ? 'Teams are tied at ' + rs : (rs > bs ? 'Red' : 'Blue') + ' leads ' + Math.max(rs, bs) + ' to ' + Math.min(rs, bs);
      } else if (me) {
        const r = game.rankOf(me);
        head = r.rank === 1 && !r.tied && inter ? 'You win!' : (r.tied ? 'Tied for ' : '') + Q.place(r.rank) + ' place with ' + me.score;
      } else if (rows[0]) head = rows[0].name + ' leads with ' + rows[0].score;
      this.text(ctx, head, L.w / 2, y, 18 * s, '#ffffff', 'center', FONT);
      y += 26 * s;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(x, y, w, (22 + rows.length * 20) * s);
      const cols = [x + 44 * s, x + 110 * s, x + 170 * s, x + 220 * s];
      this.text(ctx, 'SCORE', cols[0], y + 10 * s, 10 * s, '#c8c8c8', 'center');
      this.text(ctx, 'PING', cols[1], y + 10 * s, 10 * s, '#c8c8c8', 'center');
      this.text(ctx, 'TIME', cols[2], y + 10 * s, 10 * s, '#c8c8c8', 'center');
      this.text(ctx, 'NAME', cols[3], y + 10 * s, 10 * s, '#c8c8c8', 'left');
      y += 22 * s;
      for (const p of rows) {
        if (p === me) { ctx.fillStyle = 'rgba(40,70,200,0.55)'; ctx.fillRect(x, y, w, 20 * s); }
        else if (game.teamGame) { ctx.fillStyle = p.team === 'red' ? 'rgba(160,20,20,0.3)' : 'rgba(20,40,160,0.3)'; ctx.fillRect(x, y, w, 20 * s); }
        const ping = p.human ? (st.demo ? 0 : 5) : p.ping || 0;
        this.text(ctx, String(p.score), cols[0], y + 10 * s, 12 * s, '#ffffff', 'center');
        this.text(ctx, p.botKey && !p.ping ? 'BOT' : String(ping), cols[1], y + 10 * s, 10 * s, '#ffffff', 'center');
        this.text(ctx, String(Math.floor((game.time - p.joinTime) / 60)), cols[2], y + 10 * s, 10 * s, '#ffffff', 'center');
        const name = p.name + (p.botKey && !p.ping ? '  (' + Q.SKILLS[Math.max(0, p.skill - 1)] + ')' : '') + (!p.alive && game.state === 'play' ? '  *' : '');
        this.text(ctx, name, cols[3], y + 10 * s, 11 * s, p === me ? '#ffffff' : '#e8e8e8', 'left');
        y += 20 * s;
      }
      if (inter && me) {
        y += 18 * s;
        const acc = Math.round(game.accuracy(me) * 100);
        this.text(ctx, 'Accuracy ' + acc + '%   Excellent ' + me.stats.excellent + '   Impressive ' + me.stats.impressive + '   Humiliation ' + me.stats.gauntlet, L.w / 2, y, 11 * s, '#ffd040', 'center');
      }
    }

    showWeaponSelect(time) { this.wselT = time; }
  }
  Q.HUD = HUD;
})(globalThis.Quake3 = globalThis.Quake3 || {});
