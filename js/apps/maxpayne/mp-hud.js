(function (M) {
  'use strict';
  const NAMES = {
    max: 'Макс', bb: 'Би-Би', alex: 'Алекс', bravura: 'Бравура', woden: 'Воден', vinnie: 'Винни', lupino: 'Лупино', rico: 'Рико', joey: 'Джоуи', virgilio: 'Вирджилио',
    worker: 'Работник станции', tenant: 'Жилец', reporter: 'Репортёр', michelle: 'Мишель', doorman: 'Вышибала', guide: 'Бандит', radio: 'Рация', cop: 'Полицейский', tv: 'Телевизор'
  };
  M.SPEAKERS = NAMES;

  class HUD {
    constructor(canvas) {
      this.cv = canvas;
      this.c = canvas.getContext('2d');
      this.hints = [];
      this.pickups = [];
      this.hurts = [];
      this.healT = 0;
      this.lockMsg = null;
    }
    resize(w, h) {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.dpr = dpr;
      if (this.cv.width !== Math.round(w * dpr) || this.cv.height !== Math.round(h * dpr)) {
        this.cv.width = Math.round(w * dpr);
        this.cv.height = Math.round(h * dpr);
      }
      this.W = w; this.H = h;
    }
    event(ev, t) {
      if (ev.t === 'hint') this.hints = [{ text: ev.text, t, dur: ev.dur || 6 }];
      else if (ev.t === 'pickup') { this.pickups.push({ text: ev.text, t }); if (this.pickups.length > 4) this.pickups.shift(); }
      else if (ev.t === 'hurt' && ev.dir) this.hurts.push({ dir: ev.dir, t, k: Math.min(1, ev.dmg / 25) });
      else if (ev.t === 'locked') this.lockMsg = { text: ev.text, t };
      else if (ev.t === 'heal') this.healT = t;
    }
    clear() { this.c.clearRect(0, 0, this.cv.width, this.cv.height); }

    draw(ui, g, t) {
      const c = this.c, W = this.W, H = this.H;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      if (!g) return;
      const s = Math.max(0.7, Math.min(1.4, H / 620));
      if (!ui.cine && !g.player.dead && ui.mode === 'play') this.crosshair(c, W, H, ui);
      if (ui.opts.hud !== false && !ui.cine) {
        this.health(c, g, 18 * s, H - 20 * s, s, t);
        this.weapon(c, g, W - 18 * s, H - 20 * s, s);
      }
      this.subtitles(c, g, W, H, s);
      this.hintBox(c, W, H, s, t);
      this.pickupList(c, W, H, s, t);
      this.hurtArcs(c, g, W, H, t, ui);
      if (g.nym) this.timer(c, g, W, s);
      const f = ui.mode === 'play' && !ui.cine ? g.focus() : null;
      if (f) this.prompt(c, W, H, s, g.labelOf ? (f.label || g.labelOf(f)) : 'Использовать');
      else if (ui.mode === 'play' && !ui.cine && g.player.coverSpot && this.fighting(g)) this.prompt(c, W, H, s, g.player.coverSpot.tall ? 'Укрыться за стеной' : 'Укрыться', 'X', 0.75);
      if (this.lockMsg && t - this.lockMsg.t < 2.2) this.centerText(c, W, H * 0.62, this.lockMsg.text, 13 * s, 1 - Math.max(0, t - this.lockMsg.t - 1.6) / 0.6);
      if (ui.saveFlash && t - ui.saveFlash.t < 1.8) this.centerText(c, W, H * 0.12, ui.saveFlash.text, 14 * s, 1 - Math.max(0, t - ui.saveFlash.t - 1.2) / 0.6);
    }

    crosshair(c, W, H, ui) {
      const x = W / 2, y = H / 2;
      c.save();
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = 1.5;
      const r = ui.aimEnemy ? 3 : 5;
      c.beginPath();
      c.moveTo(x - r - 5, y); c.lineTo(x - r, y);
      c.moveTo(x + r, y); c.lineTo(x + r + 5, y);
      c.moveTo(x, y - r - 5); c.lineTo(x, y - r);
      c.moveTo(x, y + r); c.lineTo(x, y + r + 5);
      c.stroke();
      c.fillStyle = ui.aimEnemy ? 'rgba(255,90,70,0.95)' : 'rgba(255,255,255,0.9)';
      c.fillRect(x - 1, y - 1, 2, 2);
      c.restore();
    }

    figurePath(c, x, y, h) {
      const k = h / 100;
      const P = (px, py) => [x + px * k, y - py * k];
      c.beginPath();
      c.arc(...P(0, 91), 7.5 * k, 0, Math.PI * 2);
      c.moveTo(...P(-6, 82));
      const pts = [[-13, 80], [-17, 72], [-19, 52], [-17, 38], [-13, 38], [-12, 52], [-11, 60], [-10, 44], [-9, 22], [-8, 2], [-2, 2], [-1, 34], [1, 34], [2, 2], [8, 2], [9, 22], [10, 44], [11, 60], [12, 52], [13, 38], [17, 38], [19, 52], [17, 72], [13, 80], [6, 82]];
      for (const p of pts) c.lineTo(...P(p[0], p[1]));
      c.closePath();
    }

    health(c, g, x, y, s, t) {
      const p = g.player;
      const h = 108 * s;
      const fx = x + 34 * s, fy = y;
      c.save();
      c.globalAlpha = 0.9;
      for (let i = 0; i < 8; i++) {
        const bx = x, by = y - 12 * s - i * 13 * s;
        c.fillStyle = i < p.pk ? '#e8e0d0' : 'rgba(255,255,255,0.08)';
        c.fillRect(bx, by - 8 * s, 14 * s, 10 * s);
        if (i < p.pk) { c.fillStyle = '#d88a20'; c.fillRect(bx, by - 5 * s, 14 * s, 5 * s); c.fillStyle = '#fff'; c.fillRect(bx + 1 * s, by - 10 * s, 12 * s, 2.5 * s); }
      }
      this.figurePath(c, fx, fy, h);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fill();
      c.save();
      this.figurePath(c, fx, fy, h);
      c.clip();
      const dmg = M.clamp(1 - p.hp / 100, 0, 1);
      const redTop = fy - h * dmg;
      c.fillStyle = 'rgba(240,236,228,0.92)';
      c.fillRect(fx - 25 * s, fy - h, 50 * s, h);
      if (dmg > 0) {
        const pulse = p.hp < 30 ? 0.75 + Math.sin(t * 8) * 0.25 : 1;
        c.fillStyle = `rgba(${Math.round(190 * pulse)},20,18,0.95)`;
        c.fillRect(fx - 25 * s, redTop, 50 * s, h * dmg + 2);
      }
      if (p.heal > 0) { c.fillStyle = 'rgba(255,220,120,0.35)'; c.fillRect(fx - 25 * s, fy - h, 50 * s, h); }
      c.restore();
      this.figurePath(c, fx, fy, h);
      c.strokeStyle = 'rgba(0,0,0,0.8)';
      c.lineWidth = 1.2;
      c.stroke();
      const hx = fx + 28 * s, hy = fy - 4 * s, hw = 16 * s, hh = 50 * s;
      const m = g.bt.meter;
      c.strokeStyle = 'rgba(220,200,150,0.9)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(hx, hy - hh); c.lineTo(hx + hw, hy - hh); c.lineTo(hx + hw * 0.56, hy - hh / 2); c.lineTo(hx + hw, hy); c.lineTo(hx, hy); c.lineTo(hx + hw * 0.44, hy - hh / 2); c.closePath();
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.fill();
      c.stroke();
      c.save();
      c.clip();
      const sand = g.bt.on ? '#f0c060' : '#d8a848';
      c.fillStyle = sand;
      const top = m * hh / 2;
      c.fillRect(hx, hy - hh / 2 - top, hw, top);
      c.fillStyle = 'rgba(216,168,72,0.55)';
      c.fillRect(hx, hy - (1 - m) * hh / 2, hw, (1 - m) * hh / 2);
      if (g.bt.on) { c.fillStyle = sand; c.fillRect(hx + hw / 2 - 1, hy - hh / 2, 2, hh / 2); }
      c.restore();
      c.restore();
    }

    weapon(c, g, x, y, s) {
      const p = g.player;
      if (!p.cur) return;
      const W = M.WEAPONS[p.cur];
      c.save();
      c.textAlign = 'right';
      c.fillStyle = 'rgba(240,236,228,0.95)';
      c.shadowColor = '#000'; c.shadowBlur = 3;
      c.font = `bold ${13 * s}px Georgia, serif`;
      c.fillText(W.name, x, y - 64 * s);
      this.gunIcon(c, p.cur, x - 90 * s, y - 50 * s, s);
      if (W.melee) { c.restore(); return; }
      if (W.throwable) {
        c.font = `bold ${22 * s}px Georgia, serif`;
        c.fillText('× ' + p.ammo[W.ammo], x, y - 2 * s);
        c.restore();
        return;
      }
      const clip = p.clips[p.cur] || 0;
      const shell = W.ammo === '12g';
      const bw = (shell ? 6 : 3.4) * s, bh = (shell ? 13 : 12) * s;
      const perRow = Math.min(W.clip, shell ? 8 : 18);
      for (let i = 0; i < W.clip; i++) {
        const row = Math.floor(i / perRow), col = i % perRow;
        const bx = x - (col + 1) * (bw + 2 * s) - 58 * s, by = y - bh - row * (bh + 3 * s);
        c.fillStyle = i < clip ? (shell ? '#c8301e' : '#e0c060') : 'rgba(255,255,255,0.1)';
        c.fillRect(bx, by, bw, bh);
        if (i < clip) { c.fillStyle = shell ? '#d8b040' : '#8a6a2a'; c.fillRect(bx, by + bh * (shell ? 0.72 : 0.62), bw, bh * (shell ? 0.28 : 0.38)); }
      }
      c.font = `bold ${22 * s}px Georgia, serif`;
      c.fillStyle = p.reload > 0 ? '#e0a040' : 'rgba(240,236,228,0.95)';
      c.fillText(String(p.ammo[W.ammo]), x, y - 2 * s);
      if (p.ammo.gren > 0 || p.ammo.molo > 0) {
        c.font = `${11 * s}px Georgia, serif`;
        c.fillStyle = 'rgba(220,210,190,0.85)';
        c.fillText(`гранаты ${p.ammo.gren}  бутылки ${p.ammo.molo}`, x, y - 80 * s);
      }
      c.restore();
    }

    gunIcon(c, id, x, y, s) {
      c.save();
      c.translate(x, y);
      c.scale(s, s);
      c.fillStyle = 'rgba(240,236,228,0.9)';
      const dual = id === 'beretta2' || id === 'ingram2';
      const one = (ox, oy) => {
        c.save(); c.translate(ox, oy);
        switch (id) {
          case 'beretta': case 'beretta2': c.fillRect(0, 0, 34, 7); c.fillRect(24, 5, 8, 16); c.fillRect(18, 7, 4, 5); break;
          case 'deagle': c.fillRect(-6, -1, 44, 9); c.fillRect(28, 7, 9, 17); break;
          case 'pump': c.fillRect(-30, 2, 70, 4); c.fillRect(-18, 7, 20, 5); c.fillRect(38, 0, 16, 9); c.fillRect(52, 3, 26, 10); break;
          case 'sawed': c.fillRect(-4, 0, 40, 5); c.fillRect(-4, 5, 40, 4); c.fillRect(34, 2, 16, 14); break;
          case 'ingram': case 'ingram2': c.fillRect(0, 0, 30, 10); c.fillRect(18, 10, 7, 20); c.fillRect(-8, 3, 8, 4); break;
          case 'pipe': c.fillRect(-10, 6, 70, 5); break;
          case 'bat': c.beginPath(); c.moveTo(-14, 6); c.lineTo(52, 4); c.lineTo(52, 12); c.lineTo(-14, 11); c.fill(); break;
          case 'grenade': c.beginPath(); c.ellipse(30, 10, 9, 11, 0, 0, 6.3); c.fill(); c.fillRect(27, -4, 6, 5); break;
          case 'molotov': c.fillRect(24, 4, 14, 22); c.fillRect(28, -6, 6, 10); c.fillStyle = '#e0a040'; c.fillRect(28, -12, 6, 6); break;
        }
        c.restore();
      };
      if (dual) { one(-20, 4); one(18, -2); } else one(0, 0);
      c.restore();
    }

    subtitles(c, g, W, H, s) {
      const subs = g.subs.slice(-3);
      if (!subs.length) return;
      c.save();
      c.textAlign = 'center';
      let y = H - 118 * s;
      const fs = 14 * s;
      for (let i = subs.length - 1; i >= 0; i--) {
        const q = subs[i];
        const a = Math.min(1, (q.dur - q.t) / 0.4, q.t / 0.15);
        c.globalAlpha = Math.max(0, a);
        const name = q.thought ? '' : (M.SPEAKERS[q.who] || q.who);
        c.font = `${q.thought ? 'italic ' : ''}${fs}px Georgia, "Times New Roman", serif`;
        const lines = this.wrap(c, (q.tv ? '' : '') + q.text, Math.min(W * 0.7, 720 * s));
        const lh = fs * 1.3;
        const blockH = lines.length * lh + (name ? lh * 0.9 : 0) + 8 * s;
        const bw = Math.min(W * 0.74, 760 * s);
        c.fillStyle = 'rgba(0,0,0,0.5)';
        c.fillRect(W / 2 - bw / 2, y - blockH, bw, blockH);
        let ly = y - blockH + lh * 0.95;
        if (name) {
          c.font = `bold ${fs * 0.85}px Georgia, serif`;
          c.fillStyle = q.tv ? '#9ac0c8' : q.npc ? '#e0a080' : q.phone ? '#b0d0a0' : '#f0d890';
          c.fillText(q.tv ? 'Телевизор' : (q.phone ? 'Телефон · ' : '') + name, W / 2, ly);
          ly += lh * 0.9;
          c.font = `${fs}px Georgia, "Times New Roman", serif`;
        }
        c.fillStyle = q.thought ? '#e8e0c8' : '#ffffff';
        if (q.thought) c.font = `italic ${fs}px Georgia, serif`;
        for (const L of lines) { c.fillText(L, W / 2, ly); ly += lh; }
        y -= blockH + 6 * s;
      }
      c.restore();
    }

    wrap(c, text, maxW) {
      const words = String(text).split(/\s+/);
      const lines = [];
      let cur = '';
      for (const w of words) {
        const t = cur ? cur + ' ' + w : w;
        if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
      }
      if (cur) lines.push(cur);
      return lines;
    }

    hintBox(c, W, H, s, t) {
      const h = this.hints[0];
      if (!h) return;
      const age = t - h.t;
      if (age > h.dur) { this.hints.length = 0; return; }
      c.save();
      c.globalAlpha = Math.min(1, age / 0.3, (h.dur - age) / 0.6);
      c.font = `${12.5 * s}px "Courier New", monospace`;
      const lines = this.wrap(c, h.text, Math.min(W * 0.46, 420 * s));
      const lh = 16 * s;
      const bw = Math.min(W * 0.5, 450 * s), bh = lines.length * lh + 14 * s;
      c.fillStyle = 'rgba(12,12,14,0.72)';
      c.fillRect(16 * s, 16 * s, bw, bh);
      c.strokeStyle = 'rgba(220,200,150,0.6)';
      c.strokeRect(16 * s + 0.5, 16 * s + 0.5, bw, bh);
      c.fillStyle = '#e8dcc0';
      lines.forEach((L, i) => c.fillText(L, 26 * s, 16 * s + 18 * s + i * lh));
      c.restore();
    }

    pickupList(c, W, H, s, t) {
      this.pickups = this.pickups.filter(p => t - p.t < 2.6);
      c.save();
      c.textAlign = 'right';
      c.font = `${12 * s}px Georgia, serif`;
      this.pickups.forEach((p, i) => {
        c.globalAlpha = Math.min(1, (2.6 - (t - p.t)) / 0.5);
        c.fillStyle = 'rgba(0,0,0,0.45)';
        const tw = c.measureText(p.text).width;
        c.fillRect(W - 24 * s - tw, 18 * s + i * 20 * s - 13 * s, tw + 12 * s, 18 * s);
        c.fillStyle = '#f0e8d0';
        c.fillText(p.text, W - 18 * s, 18 * s + i * 20 * s);
      });
      c.restore();
    }

    hurtArcs(c, g, W, H, t, ui) {
      this.hurts = this.hurts.filter(h => t - h.t < 0.9);
      if (!this.hurts.length) return;
      const yaw = g.player.yaw;
      c.save();
      for (const h of this.hurts) {
        const d = [-h.dir[0], -h.dir[2]];
        if (Math.abs(d[0]) + Math.abs(d[1]) < 0.01) continue;
        const a = Math.atan2(d[0], -d[1]) + yaw;
        const ang = -a - Math.PI / 2;
        c.globalAlpha = (1 - (t - h.t) / 0.9) * 0.8;
        c.strokeStyle = '#d01a10';
        c.lineWidth = 6;
        c.beginPath();
        c.arc(W / 2, H / 2, Math.min(W, H) * 0.18, ang - 0.35, ang + 0.35);
        c.stroke();
      }
      c.restore();
    }

    timer(c, g, W, s) {
      c.save();
      c.textAlign = 'center';
      c.font = `bold ${22 * s}px Georgia, serif`;
      const v = Math.max(0, g.nym.t);
      c.fillStyle = v < 10 ? '#ff5040' : '#f0e8d0';
      c.shadowColor = '#000'; c.shadowBlur = 4;
      c.fillText(Math.floor(v / 60) + ':' + String(Math.floor(v % 60)).padStart(2, '0'), W / 2, 34 * s);
      c.restore();
    }

    fighting(g) {
      if (g.flags.coverHints) return true;
      const p = g.player;
      return g.chars.some(q => q.state === 'alive' && q.ai && q.ai.aware && q.ai.mode === 'combat' && !q.civilian && !q.friendly && M.dist(q.pos, p.pos) < 30);
    }

    prompt(c, W, H, s, text, key, alpha) {
      c.save();
      c.globalAlpha = alpha || 1;
      c.textAlign = 'center';
      c.font = `${13 * s}px Georgia, serif`;
      const label = '[' + (key || 'E') + ']  ' + text;
      const tw = c.measureText(label).width;
      c.fillStyle = 'rgba(0,0,0,0.5)';
      c.fillRect(W / 2 - tw / 2 - 10 * s, H * 0.58 - 15 * s, tw + 20 * s, 22 * s);
      c.fillStyle = '#f0d890';
      c.fillText(label, W / 2, H * 0.58);
      c.restore();
    }

    centerText(c, W, y, text, fs, a) {
      c.save();
      c.globalAlpha = M.clamp(a, 0, 1);
      c.textAlign = 'center';
      c.font = `${fs}px Georgia, serif`;
      const tw = c.measureText(text).width;
      c.fillStyle = 'rgba(0,0,0,0.55)';
      c.fillRect(W / 2 - tw / 2 - 12, y - fs, tw + 24, fs * 1.6);
      c.fillStyle = '#f0e8d0';
      c.fillText(text, W / 2, y);
      c.restore();
    }
  }
  M.HUD = HUD;
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
