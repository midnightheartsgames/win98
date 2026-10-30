(function (F) {
  'use strict';

  const FONT = "'Segoe UI', 'Trebuchet MS', Tahoma, Arial, sans-serif";
  const THIN = (px, w = 300) => `italic ${w} ${px}px ${FONT}`;
  const BOLD = (px) => `italic 700 ${px}px ${FONT}`;

  class Hud {
    constructor(canvas) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d');
      this.toasts = [];
      this.banners = [];
      this.big = null;
      this.mapCanvas = null;
      this.flash = 0;
      this.shake = 0;
      this.t = 0;
    }

    resize(w, h, dpr) {
      const W = Math.round(w * dpr), H = Math.round(h * dpr);
      if (this.cv.width !== W || this.cv.height !== H) { this.cv.width = W; this.cv.height = H; }
      this.w = w; this.h = h; this.dpr = dpr;
    }

    toast(text, sub, col = '#ffffff', dur = 3.2) {
      this.toasts.push({ text, sub, col, t: 0, dur });
      if (this.toasts.length > 4) this.toasts.shift();
    }

    banner(title, sub, col = '#e6146e', dur = 4, extra = null) {
      this.banners.push({ title, sub, col, t: 0, dur, extra });
      if (this.banners.length > 3) this.banners.shift();
    }

    bigText(text, col = '#ffffff', dur = 1) { this.big = { text, col, t: 0, dur }; }

    update(dt) {
      this.t += dt;
      for (const a of [this.toasts, this.banners]) {
        for (let i = a.length - 1; i >= 0; i--) { a[i].t += dt; if (a[i].t > a[i].dur) a.splice(i, 1); }
      }
      if (this.big) { this.big.t += dt; if (this.big.t > this.big.dur) this.big = null; }
      this.flash = Math.max(0, this.flash - dt * 2);
      this.dmgT = Math.max(0, (this.dmgT || 0) - dt);
    }

    draw(ui) {
      const c = this.ctx, w = this.w, h = this.h;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      if (!ui.game || ui.mode !== 'play') { this.drawBanners(c, w, h); return; }
      const g = ui.game;
      const L = this.layout = ui.touch ? ui.touch.hudLayout() : null;
      const s = Math.min(1.25, Math.max(L ? L.minScale : 0.62, h / 720));
      this.s = s;
      if (ui.mirrorRect) this.drawMirror(c, w, h, ui.mirrorRect);
      if (ui.menuOpen) { this.drawToasts(c, w, h, s); this.drawBanners(c, w, h); return; }
      if (ui.rewinding) this.drawRewind(c, w, h, s);
      c.save();
      if (L) c.translate(0, L.topDy);
      if (g.race) this.drawRace(c, w, h, s, ui);
      else this.drawFree(c, w, h, s, ui);
      c.restore();
      if (ui.showHud !== false) {
        this.drawMinimap(c, w, h, s, ui);
        c.save();
        if (L) c.translate(0, -L.lift);
        this.drawSpeedo(c, w, h, s, ui);
        this.drawDamage(c, w, h, s, ui);
        c.restore();
      }
      this.drawChain(c, w, h, s, ui);
      this.drawToasts(c, w, h, s);
      this.drawBanners(c, w, h);
      if (this.big) {
        const k = this.big.t / this.big.dur;
        const sc = 1 + k * 0.4;
        c.save();
        c.globalAlpha = 1 - k * k;
        c.translate(w / 2, h * 0.36);
        c.scale(sc, sc);
        c.font = BOLD(Math.round(96 * s));
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,0.5)';
        c.strokeText(this.big.text, 0, 0);
        c.fillStyle = this.big.col;
        c.fillText(this.big.text, 0, 0);
        c.restore();
      }
      if (this.flash > 0) { c.fillStyle = `rgba(255,255,255,${this.flash * 0.35})`; c.fillRect(0, 0, w, h); }
    }

    label(c, x, y, text, size, align = 'left') {
      c.font = `italic 600 ${Math.round(size)}px ${FONT}`;
      c.textAlign = align;
      c.fillText(text, x, y);
    }

    shadowText(c, text, x, y, font, col = '#fff', align = 'left') {
      c.font = font;
      c.textAlign = align;
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillText(text, x + 2, y + 2);
      c.fillStyle = col;
      c.fillText(text, x, y);
    }

    drawRace(c, w, h, s, ui) {
      const g = ui.game, r = g.race;
      const pad = 26 * s;
      c.textBaseline = 'alphabetic';
      const special = r.ev.type === 'prologue';
      const pct = Math.floor(r.progressFrac() * 100);
      const y0 = pad + 70 * s;
      this.shadowText(c, String(pct), pad, y0, THIN(Math.round(86 * s)));
      const pw = c.measureText(String(pct)).width;
      this.shadowText(c, '%', pad + pw + 2, y0 - 38 * s, THIN(Math.round(34 * s)));
      c.fillStyle = '#fff';
      this.shadowText(c, 'ПРОГРЕСС', pad + pw + 4, y0 - 4 * s, `italic 600 ${Math.round(11 * s)}px ${FONT}`);
      const tt = F.fmtTime(r.state === 'grid' ? 0 : r.time);
      this.shadowText(c, tt, pad, y0 + 34 * s, THIN(Math.round(30 * s), 400));
      const tw = c.measureText(tt).width;
      this.shadowText(c, 'ВРЕМЯ', pad + tw + 6, y0 + 34 * s, `italic 600 ${Math.round(11 * s)}px ${FONT}`);
      if (r.laps > 1) {
        const lap = Math.min(r.laps, r.curLap + 1);
        this.shadowText(c, `КРУГ ${lap}/${r.laps}`, pad, y0 + 62 * s, `italic 600 ${Math.round(16 * s)}px ${FONT}`);
      }
      if (!special) {
        const total = r.rivals.length + 1 + (r.special ? 1 : 0);
        const px = w - pad;
        const big = String(r.pos);
        c.font = THIN(Math.round(86 * s));
        const bw = c.measureText(big).width;
        c.font = THIN(Math.round(40 * s));
        const tw2 = c.measureText(String(total)).width;
        const x0 = px - tw2 - 18 * s - bw;
        this.shadowText(c, big, x0, y0, THIN(Math.round(86 * s)));
        c.strokeStyle = '#fff'; c.lineWidth = 2 * s;
        c.beginPath(); c.moveTo(x0 + bw + 12 * s, y0 - 64 * s); c.lineTo(x0 + bw + 4 * s, y0 + 2 * s); c.stroke();
        this.shadowText(c, String(total), px - tw2, y0 - 38 * s, THIN(Math.round(40 * s)));
        this.shadowText(c, 'ПОЗИЦИЯ', px - tw2, y0 - 4 * s, `italic 600 ${Math.round(11 * s)}px ${FONT}`);
      }
      if (r.state === 'grid') {
        const n = Math.ceil(r.count - 0.6);
        if (n > 0 && n <= 3) {
          c.font = BOLD(Math.round(140 * s)); c.textAlign = 'center';
          c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillText(String(n), w / 2 + 4, h * 0.42 + 4);
          c.fillStyle = '#fff'; c.fillText(String(n), w / 2, h * 0.42);
        }
        c.font = `italic 600 ${Math.round(15 * s)}px ${FONT}`; c.textAlign = 'center';
        c.fillStyle = 'rgba(255,255,255,0.85)';
        c.fillText('Держите обороты в зелёной зоне для идеального старта', w / 2, h * 0.52);
      }
      if (r.wrong > 1.2) this.warn(c, w, h, s, 'НЕВЕРНОЕ НАПРАВЛЕНИЕ');
      else if (r.off > 3) this.warn(c, w, h, s, 'ВЕРНИТЕСЬ НА ТРАССУ  ·  BACKSPACE — СБРОС');
      this.drawNames(c, ui);
    }

    warn(c, w, h, s, text) {
      const a = 0.6 + 0.4 * Math.sin(this.t * 8);
      c.font = BOLD(Math.round(24 * s)); c.textAlign = 'center';
      c.fillStyle = `rgba(230,20,110,${a})`;
      c.fillText(text, w / 2, h * 0.3);
    }

    drawNames(c, ui) {
      const r = ui.game.race;
      const C = ui.lastCam;
      if (!C) return;
      c.textAlign = 'center';
      c.font = `italic 600 ${Math.round(12 * this.s)}px ${FONT}`;
      const v = ui.game.veh;
      for (const a of r.rivals) {
        const d = Math.hypot(a.x - v.x, a.z - v.z);
        if (d > 90 || d < 4) continue;
        const p = F.M4.apply(C.vp, a.x, a.y + 1.9, a.z);
        if (p[3] <= 0 || Math.abs(p[0]) > 1 || Math.abs(p[1]) > 1) continue;
        const sx = (p[0] * 0.5 + 0.5) * this.w, sy = (0.5 - p[1] * 0.5) * this.h;
        c.globalAlpha = F.clamp(1.4 - d / 70, 0, 1);
        c.fillStyle = 'rgba(0,0,0,0.5)';
        const tw = c.measureText(a.name).width;
        c.fillRect(sx - tw / 2 - 5, sy - 13 * this.s, tw + 10, 17 * this.s);
        c.fillStyle = a.name === 'Вилкс' ? '#ffcf20' : '#fff';
        c.fillText(a.name, sx, sy);
      }
      c.globalAlpha = 1;
    }

    drawFree(c, w, h, s, ui) {
      const g = ui.game;
      const pad = 24 * s;
      if (ui.locT > 0) {
        c.globalAlpha = F.clamp(ui.locT, 0, 1);
        this.shadowText(c, ui.locName || '', pad, pad + 28 * s, BOLD(Math.round(26 * s)));
        this.shadowText(c, ui.locSub || '', pad, pad + 50 * s, `italic 500 ${Math.round(14 * s)}px ${FONT}`, '#e8e8e8');
        c.globalAlpha = 1;
      }
      const st = g.activeStunt();
      if (st) {
        const d = st.d;
        const label = d.kind === 'zone' ? 'ЗОНА СКОРОСТИ' : 'ЗОНА ДРИФТА';
        const val = d.kind === 'zone' ? `${st.value} км/ч` : F.fmtCR(st.value);
        this.shadowText(c, label + ' · ' + d.name, w / 2, pad + 20 * s, `italic 600 ${Math.round(14 * s)}px ${FONT}`, '#fff', 'center');
        this.shadowText(c, val, w / 2, pad + 58 * s, THIN(Math.round(40 * s), 400), '#fff', 'center');
        this.drawStars(c, w / 2, pad + 76 * s, s, d.stars.filter(t => st.value >= t).length, 3);
      }
      const ev = g.nearestEvent(30);
      if (ev && !ui.menuOpen) {
        const T = F.EV.TYPES[ev.type];
        const locked = g.eventLocked(ev);
        const y = h - 150 * s;
        const txt = locked ? `${ev.name} — нужен ${F.EV.BANDS[Math.max(0, ev.tier)].name.toLowerCase()}` : `ENTER — ${ev.name}`;
        c.font = BOLD(Math.round(18 * s));
        const tw = c.measureText(txt).width + 60 * s;
        c.fillStyle = 'rgba(12,12,16,0.72)';
        c.fillRect(w / 2 - tw / 2, y - 26 * s, tw, 44 * s);
        c.fillStyle = T.col; c.fillRect(w / 2 - tw / 2, y - 26 * s, 6 * s, 44 * s);
        c.fillStyle = '#fff'; c.textAlign = 'center';
        c.fillText(txt, w / 2, y + 2 * s);
        c.font = `italic 600 ${Math.round(11 * s)}px ${FONT}`;
        c.fillStyle = '#cfd';
        c.fillText(`${T.name.toUpperCase()} · КЛАСС ${ev.cls}${ev.laps > 1 ? ' · ' + ev.laps + ' КРУГА' : ''}`, w / 2, y + 14 * s);
      }
    }

    drawStars(c, x, y, s, n, total) {
      for (let i = 0; i < total; i++) {
        const cx = x + (i - (total - 1) / 2) * 22 * s;
        c.fillStyle = i < n ? '#ffcf20' : 'rgba(255,255,255,0.25)';
        star(c, cx, y, 8 * s);
      }
    }

    drawRewind(c, w, h, s) {
      c.fillStyle = 'rgba(40,90,200,0.18)';
      c.fillRect(0, 0, w, h);
      c.font = BOLD(Math.round(28 * s)); c.textAlign = 'center';
      c.fillStyle = '#fff';
      c.fillText('◀◀ ПЕРЕМОТКА', w / 2, h * 0.2);
    }

    drawChain(c, w, h, s, ui) {
      const g = ui.game;
      const ch = g.chain;
      if (!ch || ch.pts < 5) return;
      const x = w / 2, y = (g.race ? 120 : 92) * s;
      const mult = g.chainMult();
      const name = F.SKILL[ch.last] || '';
      c.textAlign = 'center';
      this.shadowText(c, name, x, y, BOLD(Math.round(20 * s)), '#fff', 'center');
      this.shadowText(c, F.fmtCR(Math.round(ch.pts)) + (mult > 1 ? `  ×${mult}` : ''), x, y + 30 * s, THIN(Math.round(30 * s), 500), '#ffcf20', 'center');
      const win = 3.2 + (g.hasPerk('chain') ? 1.5 : 0);
      const k = g.drift ? 1 : F.clamp(1 - ch.t / win, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(x - 70 * s, y + 38 * s, 140 * s, 4 * s);
      c.fillStyle = '#e6146e'; c.fillRect(x - 70 * s, y + 38 * s, 140 * s * k, 4 * s);
      let yy = y + 58 * s;
      c.font = `italic 600 ${Math.round(11 * s)}px ${FONT}`;
      for (let i = ch.list.length - 1; i >= Math.max(0, ch.list.length - 3); i--) {
        const it = ch.list[i];
        c.fillStyle = 'rgba(255,255,255,0.75)';
        c.fillText(`${F.SKILL[it.kind] || it.kind}  ${F.fmtCR(it.pts)}`, x, yy);
        yy += 14 * s;
      }
    }

    drawToasts(c, w, h, s) {
      let y = h * 0.62;
      c.textAlign = 'center';
      for (const t of this.toasts) {
        const a = F.clamp(Math.min(t.t * 4, (t.dur - t.t) * 2), 0, 1);
        c.globalAlpha = a;
        c.font = BOLD(Math.round(18 * s));
        this.shadowText(c, t.text, w / 2, y, BOLD(Math.round(18 * s)), t.col, 'center');
        if (t.sub) this.shadowText(c, t.sub, w / 2, y + 18 * s, `italic 500 ${Math.round(12 * s)}px ${FONT}`, '#e0e0e0', 'center');
        y += (t.sub ? 44 : 30) * s;
      }
      c.globalAlpha = 1;
    }

    drawBanners(c, w, h) {
      const s = this.s || 1;
      let y = h * 0.16;
      for (const b of this.banners) {
        const inK = F.smooth(0, 0.3, b.t), outK = F.smooth(b.dur - 0.4, b.dur, b.t);
        const a = inK * (1 - outK);
        const bw = Math.min(w * 0.7, 560 * s), bh = (b.extra ? 86 : 64) * s;
        const x = w / 2 - bw / 2 + (1 - inK) * -80;
        c.globalAlpha = a;
        c.fillStyle = 'rgba(14,14,18,0.85)';
        c.fillRect(x, y, bw, bh);
        c.fillStyle = b.col;
        c.fillRect(x, y, bw, 5 * s);
        c.textAlign = 'center'; c.fillStyle = '#fff';
        c.font = BOLD(Math.round(22 * s));
        c.fillText(b.title, w / 2, y + 32 * s);
        c.font = `italic 500 ${Math.round(13 * s)}px ${FONT}`;
        c.fillStyle = '#ddd';
        c.fillText(b.sub || '', w / 2, y + 52 * s);
        if (b.extra && b.extra.stars !== undefined) this.drawStars(c, w / 2, y + 72 * s, s, b.extra.stars, 3);
        y += bh + 10 * s;
      }
      c.globalAlpha = 1;
    }

    drawMinimap(c, w, h, s, ui) {
      const g = ui.game, v = g.veh;
      const M = this.layout && this.layout.map;
      const R = 88 * s * (M ? M.k : 1);
      const cx = M ? M.cx : 30 * s + R, cy = M ? M.cy : h - 30 * s - R;
      const scale = (g.race ? 0.55 : 0.42) * s * (M ? M.k : 1);
      c.save();
      c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.closePath();
      c.fillStyle = 'rgba(8,10,14,0.55)'; c.fill();
      c.clip();
      const mc = ui.mapArt;
      c.translate(cx, cy);
      c.rotate(-v.yaw);
      c.globalAlpha = 0.75;
      if (mc) {
        const k = mc.scale;
        c.save();
        c.scale(scale / k, scale / k);
        c.drawImage(mc.cv, -(v.x - mc.x0) * k, -(v.z - mc.z0) * k);
        c.restore();
      }
      c.globalAlpha = 1;
      const route = g.race ? g.race.route : g.gps;
      if (route) {
        const from = g.race ? g.race.pProg : 0;
        c.strokeStyle = '#3a8cff'; c.lineWidth = 5 * s; c.lineJoin = 'round'; c.lineCap = 'round';
        c.beginPath();
        let first = true;
        for (let k = -20; k < 320; k += 2) {
          const p = route.point(from + k * 4);
          if (!route.closed && (from + k * 4 < 0 || from + k * 4 > route.total)) continue;
          const x = (p.x - v.x) * scale, y = (p.z - v.z) * scale;
          if (first) { c.moveTo(x, y); first = false; } else c.lineTo(x, y);
        }
        c.stroke();
      }
      const icon = (x, z, col, rad = 4) => {
        const px = (x - v.x) * scale, pz = (z - v.z) * scale;
        const d = Math.hypot(px, pz);
        const k = d > R / 1 - 8 * s ? (R - 8 * s) / d : 1;
        c.save();
        c.translate(px * k, pz * k);
        c.rotate(v.yaw);
        c.fillStyle = col; c.strokeStyle = '#000'; c.lineWidth = 1;
        c.beginPath(); c.arc(0, 0, rad * s, 0, Math.PI * 2); c.fill(); c.stroke();
        c.restore();
      };
      if (g.race) {
        for (const a of g.race.rivals) icon(a.x, a.z, a.name === 'Вилкс' ? '#ffcf20' : '#ff5050', 3.5);
        if (g.race.special) icon(g.race.special.x, g.race.special.z, '#ffcf20', 5);
      } else {
        for (const ev of F.EV.EVENTS) {
          if (ev.id === 'prologue') continue;
          const d = Math.hypot(ev.via[0][0] - v.x, ev.via[0][1] - v.z);
          if (d > 600) continue;
          icon(ev.via[0][0], ev.via[0][1], g.eventLocked(ev) ? '#777' : F.EV.TYPES[ev.type].col, 4.5);
        }
        if (g.waypoint) icon(g.waypoint.x, g.waypoint.z, '#e6146e', 5);
        for (const t of g.traffic.cars) {
          const d = Math.hypot(t.x - v.x, t.z - v.z);
          if (d < 160) icon(t.x, t.z, 'rgba(255,255,255,0.6)', 2);
        }
      }
      c.restore();
      c.save();
      c.translate(cx, cy);
      c.fillStyle = '#fff';
      c.beginPath(); c.moveTo(0, -9 * s); c.lineTo(7 * s, 8 * s); c.lineTo(0, 4 * s); c.lineTo(-7 * s, 8 * s); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.5 * s;
      c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.stroke();
      const na = -v.yaw - Math.PI / 2;
      const nx = Math.cos(na) * (R - 12 * s), ny = Math.sin(na) * (R - 12 * s);
      c.font = `600 ${Math.round(12 * s)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#fff'; c.fillText('С', nx, ny);
      c.restore();
      c.textBaseline = 'alphabetic';
    }

    drawMirror(c, w, h, r) {
      const x = r[0] * w, y = r[1] * h, mw = r[2] * w, mh = r[3] * h, b = Math.max(4, mh * 0.12), R = b * 1.4;
      const box = (x0, y0, bw, bh, rad) => {
        c.moveTo(x0 + rad, y0); c.arcTo(x0 + bw, y0, x0 + bw, y0 + bh, rad); c.arcTo(x0 + bw, y0 + bh, x0, y0 + bh, rad);
        c.arcTo(x0, y0 + bh, x0, y0, rad); c.arcTo(x0, y0, x0 + bw, y0, rad); c.closePath();
      };
      c.save();
      c.fillStyle = '#121214';
      c.fillRect(x + mw / 2 - b * 0.7, 0, b * 1.4, Math.max(0, y - b + 2));
      const g = c.createLinearGradient(0, y - b, 0, y + mh + b);
      g.addColorStop(0, '#3a3c42'); g.addColorStop(0.5, '#1c1d20'); g.addColorStop(1, '#0c0c0e');
      c.beginPath();
      box(x - b, y - b, mw + b * 2, mh + b * 2, R);
      box(x + 1, y + 1, mw - 2, mh - 2, R * 0.45);
      c.fillStyle = g;
      c.fill('evenodd');
      c.beginPath();
      box(x - b + 1, y - b + 1, mw + b * 2 - 2, mh + b * 2 - 2, R - 1);
      c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 1;
      c.stroke();
      c.restore();
    }

    drawSpeedo(c, w, h, s, ui) {
      const g = ui.game, v = g.veh, sp = v.spec;
      if (ui.camMode === 'cockpit') {
        const mph = g.settings.units === 'mph', x0 = w - 34 * s, y0 = h - 44 * s;
        const txt = String(Math.round(mph ? v.speed * 2.237 : v.speed * 3.6));
        c.save();
        c.textAlign = 'right'; c.textBaseline = 'alphabetic';
        c.font = THIN(Math.round(44 * s), 300);
        c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillText(txt, x0 + 2, y0 + 2);
        c.fillStyle = '#fff'; c.fillText(txt, x0, y0);
        c.font = `italic 600 ${Math.round(10 * s)}px ${FONT}`;
        c.fillText(mph ? 'MPH' : 'КМ/Ч', x0, y0 + 15 * s);
        c.strokeStyle = v.limiter ? '#e8453c' : '#ffcf20'; c.lineWidth = 2 * s;
        c.beginPath(); c.arc(x0 - 96 * s, y0 - 14 * s, 13 * s, 0, Math.PI * 2); c.stroke();
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `italic 600 ${Math.round(16 * s)}px ${FONT}`;
        c.fillText(v.gear < 0 ? 'R' : v.gear === 0 ? 'N' : String(v.gear), x0 - 96 * s, y0 - 13 * s);
        c.restore();
        return;
      }
      const R = 86 * s;
      const cx = w - 40 * s - R, cy = h - 34 * s - R * 0.9;
      const maxRpm = Math.ceil(sp.red / 1000 + 0.5);
      const a0 = Math.PI * 0.72, a1 = Math.PI * 2.02;
      const ang = rpm => a0 + (a1 - a0) * F.clamp(rpm / (maxRpm * 1000), 0, 1);
      c.save();
      c.lineCap = 'butt';
      c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2 * s;
      c.beginPath(); c.arc(cx, cy, R, a0, ang(sp.red)); c.stroke();
      c.strokeStyle = '#e8453c'; c.lineWidth = 3 * s;
      c.beginPath(); c.arc(cx, cy, R, ang(sp.red), a1); c.stroke();
      c.font = `500 ${Math.round(11 * s)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let k = 0; k <= maxRpm; k++) {
        const a = ang(k * 1000);
        const red = k * 1000 >= sp.red;
        c.strokeStyle = red ? '#e8453c' : '#fff'; c.lineWidth = 2 * s;
        c.beginPath(); c.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.lineTo(cx + Math.cos(a) * (R - 9 * s), cy + Math.sin(a) * (R - 9 * s)); c.stroke();
        c.fillStyle = red ? '#e8453c' : '#fff';
        c.fillText(String(k), cx + Math.cos(a) * (R - 20 * s), cy + Math.sin(a) * (R - 20 * s));
        if (k < maxRpm) {
          const am = ang(k * 1000 + 500);
          c.lineWidth = 1 * s;
          c.beginPath(); c.moveTo(cx + Math.cos(am) * R, cy + Math.sin(am) * R); c.lineTo(cx + Math.cos(am) * (R - 5 * s), cy + Math.sin(am) * (R - 5 * s)); c.stroke();
        }
      }
      const ra = ang(v.rpm);
      c.strokeStyle = '#fff'; c.lineWidth = 2.5 * s;
      c.beginPath(); c.moveTo(cx + Math.cos(ra) * 12 * s, cy + Math.sin(ra) * 12 * s); c.lineTo(cx + Math.cos(ra) * (R - 4 * s), cy + Math.sin(ra) * (R - 4 * s)); c.stroke();
      const gx = cx + 4 * s, gy = cy + 2 * s;
      c.strokeStyle = v.limiter ? '#e8453c' : '#ffcf20'; c.lineWidth = 2 * s;
      c.beginPath(); c.arc(gx, gy, 13 * s, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#fff'; c.font = `italic 600 ${Math.round(16 * s)}px ${FONT}`;
      c.fillText(v.gear < 0 ? 'R' : v.gear === 0 ? 'N' : String(v.gear), gx, gy + 1);
      c.font = `600 ${Math.round(9 * s)}px ${FONT}`; c.fillStyle = 'rgba(255,255,255,0.8)';
      const as = g.settings;
      c.fillText(as.abs ? 'ABS' : '', cx - 36 * s, cy - 8 * s);
      c.fillText(as.tcs ? 'TCS' : '', cx - 36 * s, cy + 4 * s);
      c.fillText(as.stm ? 'STM' : '', cx - 36 * s, cy + 16 * s);
      const kmh = as.units === 'mph' ? v.speed * 2.237 : v.speed * 3.6;
      const txt = String(Math.round(kmh)).padStart(3, '0');
      c.textAlign = 'right'; c.textBaseline = 'alphabetic';
      c.font = THIN(Math.round(56 * s), 300);
      const lead = txt.match(/^0*/)[0].length === 3 ? 2 : txt.match(/^0*/)[0].length;
      const full = c.measureText(txt).width;
      const x = cx + R * 0.95, y = cy + R * 0.82;
      c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillText(txt, x + 2, y + 2);
      c.textAlign = 'left';
      let xx = x - full;
      for (let i = 0; i < txt.length; i++) {
        c.fillStyle = i < lead ? 'rgba(255,255,255,0.4)' : '#fff';
        c.fillText(txt[i], xx, y);
        xx += c.measureText(txt[i]).width;
      }
      c.textAlign = 'right';
      c.font = `italic 600 ${Math.round(10 * s)}px ${FONT}`;
      c.fillStyle = '#fff';
      c.fillText(as.units === 'mph' ? 'MPH' : 'КМ/Ч', x, cy + R * 0.4);
      c.restore();
    }

    drawDamage(c, w, h, s, ui) {
      const g = ui.game, v = g.veh, d = v.dmg;
      if (!d) { this.dmgSeen = null; return; }
      const key = d.ver + ':' + Math.round(d.hp * 50);
      if (this.dmgSeen !== key) { if (this.dmgSeen !== null && d.damaged) this.dmgT = 5; this.dmgSeen = key; }
      const T = F.DMG.TUNE;
      if (d.damaged || d.burnt) {
        const alpha = d.burning || d.burnt ? 1 : 0.62 + 0.38 * F.clamp(this.dmgT, 0, 1);
        const cock = ui.camMode === 'cockpit';
        const R = 86 * s, bx = cock ? w - 180 * s : w - 40 * s - R * 2 - 46 * s, by = cock ? h - 92 * s : h - 34 * s - R * 1.55;
        const bw = 26 * s, bh = 54 * s;
        const col = k => { const r = Math.round(F.clamp(k * 2, 0, 1) * 235 + 20), gg = Math.round(F.clamp(2 - k * 2, 0, 1) * 205 + 30); return `rgb(${r},${gg},48)`; };
        c.save();
        c.globalAlpha = alpha;
        c.fillStyle = 'rgba(8,10,14,0.55)';
        c.fillRect(bx - 16 * s, by - 10 * s, bw + 32 * s, bh + 40 * s);
        const z = d.zones();
        const zh = bh * 0.28;
        c.fillStyle = col(z[0]); c.fillRect(bx + 3 * s, by, bw - 6 * s, zh);
        c.fillStyle = col(z[1]); c.fillRect(bx + 3 * s, by + bh - zh, bw - 6 * s, zh);
        c.fillStyle = col(z[2]); c.fillRect(bx, by + zh, bw * 0.5, bh - zh * 2);
        c.fillStyle = col(z[3]); c.fillRect(bx + bw * 0.5, by + zh, bw * 0.5, bh - zh * 2);
        c.fillStyle = 'rgba(20,24,30,0.85)';
        c.fillRect(bx + bw * 0.2, by + bh * 0.36, bw * 0.6, bh * 0.3);
        c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.5 * s;
        c.strokeRect(bx, by, bw, bh);
        const ey = d.lay.rear ? by + bh - zh * 0.85 : by + zh * 0.15, hpK = d.mechOn ? 1 - d.hp : 0;
        const blink = d.burning ? (Math.sin(this.t * 14) > 0 ? '#ff3a1a' : '#ffd23a') : col(hpK);
        c.fillStyle = blink;
        c.fillRect(bx + bw * 0.3, ey, bw * 0.4, zh * 0.7);
        c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1 * s;
        c.strokeRect(bx + bw * 0.3, ey, bw * 0.4, zh * 0.7);
        const wy = [by + bh * 0.16, by + bh * 0.16, by + bh * 0.72, by + bh * 0.72];
        for (let i = 0; i < 4; i++) {
          const wx = i % 2 ? bx + bw + 1 * s : bx - 6 * s;
          c.fillStyle = d.flat[i] ? '#ff3a2a' : d.bend[i] > 0.05 ? '#ffc020' : '#1c1c1e';
          c.fillRect(wx, wy[i], 5 * s, bh * 0.14);
          c.strokeStyle = 'rgba(255,255,255,0.6)';
          c.strokeRect(wx, wy[i], 5 * s, bh * 0.14);
        }
        c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        c.font = `italic 600 ${Math.round(9 * s)}px ${FONT}`;
        c.fillStyle = '#fff';
        const label = d.burnt ? 'РАЗБИТА' : d.mechOn ? `МОТОР ${Math.round(d.hp * 100)}%` : 'КУЗОВ';
        c.fillText(label, bx + bw / 2, by + bh + 14 * s);
        c.fillStyle = 'rgba(255,255,255,0.7)';
        c.fillText(`${Math.round(d.severity() * 100)}%`, bx + bw / 2, by + bh + 25 * s);
        c.restore();
      }
      const cx = w / 2;
      if (d.burning) {
        const left = Math.max(0, T.fireT - d.fireT);
        this.warn(c, w, h, s, `ПОЖАР!  BACKSPACE — ЭВАКУАТОР  ·  ${left.toFixed(1)} С`);
        c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(cx - 120 * s, h * 0.3 + 10 * s, 240 * s, 5 * s);
        c.fillStyle = '#ff3a1a'; c.fillRect(cx - 120 * s, h * 0.3 + 10 * s, 240 * s * F.clamp(d.fireT / T.fireT, 0, 1), 5 * s);
      } else if (d.burnt) {
        this.warn(c, w, h, s, 'МАШИНА РАЗБИТА  ·  ЖДЁМ ЭВАКУАТОР');
      } else if (g.fixT > 0) {
        const k = F.clamp(g.fixT / T.fixT, 0, 1);
        this.shadowText(c, 'РЕМОНТ ДВИГАТЕЛЯ…', cx, h * 0.3, BOLD(Math.round(20 * s)), '#ffffff', 'center');
        c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(cx - 110 * s, h * 0.3 + 10 * s, 220 * s, 6 * s);
        c.fillStyle = '#3fc46a'; c.fillRect(cx - 110 * s, h * 0.3 + 10 * s, 220 * s * k, 6 * s);
      } else if (g.fixable) {
        this.shadowText(c, 'F (удерживать) — подлатать двигатель', cx, h * 0.3, `italic 600 ${Math.round(15 * s)}px ${FONT}`, '#ffcf20', 'center');
      }
    }

    mapArt(world) {
      const x0 = world.b.x0, z0 = world.b.z0;
      const k = 0.25;
      const W = Math.round((world.b.x1 - x0) * k), H = Math.round((world.b.z1 - z0) * k);
      const cv = F.Tex.canvas(W, H);
      const c = cv.getContext('2d');
      const img = c.createImageData(W, H);
      const bcol = [[40, 88, 140], [214, 200, 160], [92, 124, 70], [98, 130, 78], [52, 84, 52], [128, 124, 118], [112, 108, 100], [118, 132, 96], [150, 146, 140], [116, 118, 104]];
      for (let y = 0; y < H; y++) {
        for (let xx = 0; xx < W; xx++) {
          const wx = x0 + xx / k, wz = z0 + y / k;
          const gi = world.gi(wx, wz);
          const col = world.water[gi] ? bcol[0] : (bcol[world.biome[gi]] || bcol[2]);
          const i = (y * W + xx) * 4;
          img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255;
        }
      }
      c.putImageData(img, 0, 0);
      const pc = { tiles: 'rgba(206,194,172,0.95)', lot: 'rgba(96,96,102,0.95)', apron: 'rgba(168,168,162,0.95)', sand: 'rgba(224,200,144,0.95)', beach: 'rgba(236,222,176,0.95)', walk: 'rgba(196,190,178,0.9)', path: 'rgba(214,194,146,0.9)', court: 'rgba(214,194,146,0.9)' };
      for (const pt of world.patches || []) {
        c.fillStyle = c.strokeStyle = pc[pt.kind] || pc.tiles;
        c.beginPath();
        (pt.poly || pt.pts).forEach((p, i) => { if (i) c.lineTo((p[0] - x0) * k, (p[1] - z0) * k); else c.moveTo((p[0] - x0) * k, (p[1] - z0) * k); });
        if (pt.poly) { c.closePath(); c.fill(); } else { c.lineWidth = Math.max(1, pt.w * k); c.stroke(); }
      }
      c.fillStyle = 'rgba(70,64,60,0.85)';
      for (const b of world.buildings) {
        c.beginPath();
        b.poly.forEach((p, i) => { if (i) c.lineTo((p[0] - x0) * k, (p[1] - z0) * k); else c.moveTo((p[0] - x0) * k, (p[1] - z0) * k); });
        c.closePath();
        c.fill();
      }
      const trg = world.trg;
      if (trg) {
        const fill = (pts, col) => {
          c.fillStyle = col;
          c.beginPath();
          pts.forEach((p, i) => { if (i) c.lineTo((p[0] - x0) * k, (p[1] - z0) * k); else c.moveTo((p[0] - x0) * k, (p[1] - z0) * k); });
          c.closePath();
          c.fill();
        };
        fill(trg.block, 'rgba(112,100,84,0.95)');
        for (const r of trg.roofs) fill(r, 'rgba(196,188,160,0.98)');
        for (const s of trg.solids) if (s.kind === 'shed') fill([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [s.x + s.c * a * s.hx - s.s * b * s.hz, s.z + s.s * a * s.hx + s.c * b * s.hz]), 'rgba(96,136,108,0.95)');
      }
      if (world.festPads) {
        const tint = { floor: 'rgba(214,176,190,0.95)', asph: 'rgba(84,84,90,0.95)', gravel: 'rgba(170,156,128,0.95)' };
        world.festPads.list.forEach((pd, i) => {
          c.fillStyle = tint[F.MAP.FEST.pads[i].k] || tint.floor;
          c.beginPath();
          pd.poly.forEach((p, j) => { if (j) c.lineTo((p[0] - x0) * k, (p[1] - z0) * k); else c.moveTo((p[0] - x0) * k, (p[1] - z0) * k); });
          c.closePath();
          c.fill();
        });
        const st = F.MAP.FEST.stage;
        c.fillStyle = '#e6146e';
        c.fillRect((st.x - st.w / 2 - x0) * k, (st.z - st.d / 2 - z0) * k, st.w * k, st.d * k);
      }
      const kc = { hwy: '#f2c230', ave: '#f4f4f0', str: '#e8e8e2', old: '#d8b890', lane: '#d8d8d0', gravel: '#b8a888', dirt: '#a88a58', sand: '#f0e0a8', grass: '#90b060', track: '#f05050', runway: '#9a9a9a' };
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (const pass of [0, 1]) {
        for (const e of world.edges) {
          c.strokeStyle = pass === 0 ? 'rgba(20,20,20,0.55)' : (kc[e.kind] || '#ddd');
          c.lineWidth = Math.max(1.2, e.w * k * (pass === 0 ? 1.6 : 1.1));
          c.beginPath();
          e.pts.forEach((p, i) => { const px = (p[0] - x0) * k, pz = (p[1] - z0) * k; if (i) c.lineTo(px, pz); else c.moveTo(px, pz); });
          c.stroke();
        }
      }
      const air = world.air;
      if (air) {
        c.fillStyle = 'rgba(92,104,98,0.95)';
        for (const h of air.hangars) {
          const hc = Math.cos(h.yaw), hs = Math.sin(h.yaw), ax = -hs, az = hc;
          c.beginPath();
          for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) c.lineTo((h.x + hc * u * h.w / 2 + ax * v * h.d / 2 - x0) * k, (h.z + hs * u * h.w / 2 + az * v * h.d / 2 - z0) * k);
          c.closePath(); c.fill();
        }
        c.strokeStyle = '#ffffff'; c.lineWidth = 2;
        for (const pl of air.planes) {
          const fx = Math.sin(pl.yaw), fz = -Math.cos(pl.yaw), px = (pl.x - x0) * k, pz = (pl.z - z0) * k, L = pl.len * k / 2;
          c.beginPath(); c.moveTo(px + fx * L, pz + fz * L); c.lineTo(px - fx * L, pz - fz * L); c.moveTo(px + fz * L * 0.9, pz - fx * L * 0.9); c.lineTo(px - fz * L * 0.9, pz + fx * L * 0.9); c.stroke();
        }
      }
      if (world.rail) {
        c.strokeStyle = 'rgba(40,40,40,0.8)'; c.lineWidth = 1.5; c.setLineDash([4, 3]);
        c.beginPath();
        world.rail.pts.forEach((p, i) => { const px = (p[0] - x0) * k, pz = (p[1] - z0) * k; if (i) c.lineTo(px, pz); else c.moveTo(px, pz); });
        c.stroke(); c.setLineDash([]);
      }
      const bis = world.bis;
      if (bis) {
        c.fillStyle = 'rgba(70,64,60,0.85)';
        for (const s of bis.solids) {
          c.beginPath();
          for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) c.lineTo((s.x + s.tx * u * s.hx - s.tz * v * s.hz - x0) * k, (s.z + s.tz * u * s.hx + s.tx * v * s.hz - z0) * k);
          c.closePath(); c.fill();
        }
        c.strokeStyle = 'rgba(150,44,40,0.85)'; c.lineWidth = 1;
        for (const run of bis.tram.runs) {
          c.beginPath();
          run.forEach((p, i) => { const px = (p.x - x0) * k, pz = (p.z - z0) * k; if (i) c.lineTo(px, pz); else c.moveTo(px, pz); });
          c.stroke();
        }
      }
      return { cv, x0, z0, scale: k, W, H };
    }
  }

  function star(c, x, y, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rr = i % 2 ? r * 0.45 : r;
      c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
    c.fill();
  }

  const PALETTES = {
    su: { bg: '#15120f', face: '#080807', ink: '#d2e6c8', needle: '#f2922e', rim: '#4c4a44', red: '#e0301c', glow: [0.55, 1, 0.62], lcd: ['#050505', '#f0f0e8'], drum: true },
    eu: { bg: '#0c0c0e', face: '#060606', ink: '#f2f2f2', needle: '#ff5a1e', rim: '#2e2e32', red: '#e8261c', glow: [1, 0.55, 0.18], lcd: ['#140a02', '#ff8a2a'] },
    jp: { bg: '#121318', face: '#ebe7da', ink: '#161616', needle: '#e8201a', rim: '#8c8c92', red: '#d8181a', glow: [0.75, 0.9, 1], lcd: ['#041008', '#5aff8a'] },
    us: { bg: '#141414', face: '#0a0a0a', ink: '#f0e6c0', needle: '#f4f4f4', rim: '#c8c8cc', red: '#e02a20', glow: [0.55, 0.9, 0.7], lcd: ['#050505', '#f2f2ea'], drum: true },
    it: { bg: '#0e0e0e', face: '#0a0a0a', ink: '#f6f6f6', needle: '#ff7418', rim: '#3a3a3a', red: '#ff2a1a', glow: [1, 0.62, 0.3], lcd: ['#100600', '#ff9a3a'] },
    retro: { bg: '#2a2622', face: '#efe6cc', ink: '#1e1a14', needle: '#b81a12', rim: '#d0d0d4', red: '#c0201a', glow: [1, 0.85, 0.55], lcd: ['#060606', '#f0ece0'], drum: true }
  };

  const LAYOUTS = {
    su: {
      dials: [{ k: 'speed', x: 176, y: 128, r: 92, a0: -135, a1: 135 }, { k: 'rpm', x: 360, y: 116, r: 70, a0: -120, a1: 120 }, { k: 'fuel', x: 312, y: 214, r: 28, a0: -50, a1: 50 }, { k: 'temp', x: 412, y: 212, r: 28, a0: -50, a1: 50 }],
      lamps: [{ k: 'choke', x: 92, y: 210 }, { k: 'oil', x: 118, y: 222 }, { k: 'bat', x: 146, y: 229 }, { k: 'hand', x: 206, y: 229 }, { k: 'beam', x: 234, y: 222 }],
      lcd: [{ k: 'odo', x: 176, y: 190, w: 76, h: 18 }, { k: 'clock', x: 360, y: 158, w: 52, h: 15 }]
    },
    eu: {
      dials: [{ k: 'speed', x: 158, y: 122, r: 90, a0: -130, a1: 130 }, { k: 'rpm', x: 354, y: 122, r: 90, a0: -130, a1: 130 }, { k: 'temp', x: 158, y: 184, r: 20, a0: -45, a1: 45 }, { k: 'fuel', x: 354, y: 184, r: 20, a0: -45, a1: 45 }],
      boost: { k: 'boost', x: 256, y: 42, r: 20, a0: -80, a1: 80 },
      lamps: [{ k: 'abs', x: 212, y: 226 }, { k: 'tcs', x: 238, y: 232 }, { k: 'beam', x: 274, y: 232 }, { k: 'hand', x: 300, y: 226 }],
      lcd: [{ k: 'odo', x: 158, y: 150, w: 64, h: 15 }, { k: 'clock', x: 354, y: 150, w: 52, h: 15 }, { k: 'gear', x: 256, y: 196, w: 30, h: 30 }]
    },
    jp: {
      dials: [{ k: 'rpm', x: 256, y: 130, r: 98, a0: -135, a1: 120 }, { k: 'speed', x: 420, y: 134, r: 60, a0: -125, a1: 125 }, { k: 'temp', x: 92, y: 174, r: 30, a0: -60, a1: 60 }],
      boost: { k: 'boost', x: 92, y: 92, r: 42, a0: -110, a1: 110 },
      lamps: [{ k: 'shift', x: 256, y: 11 }, { k: 'abs', x: 222, y: 212 }, { k: 'tcs', x: 256, y: 218 }, { k: 'beam', x: 290, y: 212 }],
      lcd: [{ k: 'odo', x: 256, y: 186, w: 72, h: 15 }, { k: 'gear', x: 256, y: 158, w: 26, h: 26 }]
    },
    pods: {
      bg: 'wood',
      dials: [{ k: 'fuel', x: 72, y: 128, r: 46, a0: -60, a1: 60 }, { k: 'speed', x: 190, y: 126, r: 64, a0: -135, a1: 135 }, { k: 'rpm', x: 322, y: 126, r: 64, a0: -135, a1: 135 }, { k: 'temp', x: 440, y: 128, r: 46, a0: -60, a1: 60 }],
      lamps: [{ k: 'beam', x: 226, y: 214 }, { k: 'oil', x: 256, y: 220 }, { k: 'hand', x: 286, y: 214 }],
      lcd: [{ k: 'odo', x: 190, y: 176, w: 56, h: 14 }]
    },
    twin: {
      dials: [{ k: 'speed', x: 140, y: 116, r: 84, a0: -135, a1: 135 }, { k: 'rpm', x: 372, y: 116, r: 84, a0: -135, a1: 135 }, { k: 'oil', x: 256, y: 64, r: 25, a0: -60, a1: 60 }, { k: 'temp', x: 256, y: 162, r: 25, a0: -60, a1: 60 }],
      lamps: [{ k: 'beam', x: 226, y: 224 }, { k: 'oil', x: 256, y: 230 }, { k: 'hand', x: 286, y: 224 }],
      lcd: [{ k: 'odo', x: 140, y: 176, w: 60, h: 14 }]
    },
    it: {
      dials: [{ k: 'rpm', x: 256, y: 130, r: 98, a0: -135, a1: 120 }, { k: 'speed', x: 424, y: 134, r: 56, a0: -125, a1: 125 }, { k: 'oil', x: 88, y: 100, r: 32, a0: -60, a1: 60 }, { k: 'temp', x: 88, y: 178, r: 32, a0: -60, a1: 60 }],
      lamps: [{ k: 'shift', x: 256, y: 11 }, { k: 'abs', x: 226, y: 212 }, { k: 'tcs', x: 256, y: 218 }, { k: 'beam', x: 286, y: 212 }],
      lcd: [{ k: 'odo', x: 256, y: 186, w: 70, h: 15 }, { k: 'gear', x: 256, y: 158, w: 26, h: 26 }]
    },
    center: {
      dials: [{ k: 'rpm', x: 256, y: 130, r: 100, a0: -135, a1: 135 }, { k: 'fuel', x: 74, y: 128, r: 40, a0: -60, a1: 60 }, { k: 'temp', x: 438, y: 128, r: 40, a0: -60, a1: 60 }],
      lamps: [{ k: 'shift', x: 256, y: 11 }, { k: 'abs', x: 206, y: 214 }, { k: 'tcs', x: 306, y: 214 }, { k: 'beam', x: 256, y: 226 }],
      lcd: [{ k: 'speed', x: 256, y: 190, w: 70, h: 24 }, { k: 'gear', x: 256, y: 160, w: 22, h: 20 }]
    },
    fan: {
      dials: [{ k: 'speed', x: 256, y: 186, r: 150, a0: -78, a1: 78, fan: true }, { k: 'fuel', x: 150, y: 214, r: 26, a0: -55, a1: 55 }, { k: 'temp', x: 362, y: 214, r: 26, a0: -55, a1: 55 }],
      lamps: [{ k: 'beam', x: 236, y: 234 }, { k: 'oil', x: 276, y: 234 }],
      lcd: [{ k: 'odo', x: 256, y: 204, w: 60, h: 16 }]
    },
    three: {
      dials: [{ k: 'temp', x: 108, y: 134, r: 56, a0: -70, a1: 70 }, { k: 'rpm', x: 256, y: 122, r: 82, a0: -135, a1: 135 }, { k: 'speed', x: 404, y: 134, r: 56, a0: -135, a1: 135 }],
      lamps: [{ k: 'beam', x: 236, y: 226 }, { k: 'oil', x: 276, y: 226 }],
      lcd: [{ k: 'odo', x: 404, y: 175, w: 46, h: 12 }]
    }
  };

  const LAMP = {
    beam: '#3a8aff', hand: '#ff3020', abs: '#ffb01a', tcs: '#ffb01a', oil: '#ff3020', bat: '#ff3020', choke: '#ffb01a', shift: '#ff2a1a'
  };

  const faceCache = new Map();

  function styleOf(car) { return (F.COCK && F.COCK[car.cock] && F.COCK[car.cock].face) || 'eu'; }

  function layoutOf(car, spec) {
    const base = LAYOUTS[car.sh.cluster] || LAYOUTS[styleOf(car)] || LAYOUTS.eu;
    const turbo = spec ? spec.turbo : /t$/.test(car.eng);
    if (!base.boost) return base;
    return Object.assign({}, base, { dials: turbo ? base.dials.concat([base.boost]) : base.dials });
  }

  function paletteOf(car) { return PALETTES[styleOf(car)] || PALETTES.eu; }

  function scaleOf(k, spec, units) {
    if (k === 'speed') {
      const top = F.perf(spec).vmax * (units === 'mph' ? 0.6214 : 1);
      const max = Math.ceil(top / 20 + 0.6) * 20;
      return { min: 0, max, step: max > 200 ? 40 : 20, sub: max > 200 ? 20 : 10 };
    }
    if (k === 'rpm') return { min: 0, max: Math.ceil(spec.red / 1000 + 0.5), step: 1, sub: 0.5, red: spec.red / 1000 };
    if (k === 'boost') return { min: -1, max: 1.5, step: 1, sub: 0.5 };
    return { min: 0, max: 1, step: 1, sub: 0.5 };
  }

  function angleOf(dial, value, sc) {
    return dial.a0 + (dial.a1 - dial.a0) * F.clamp((value - sc.min) / (sc.max - sc.min), 0, 1.02);
  }

  const ENDS = { fuel: ['E', 'F'], temp: ['C', 'H'], oil: ['0', '5'], volt: ['8', '16'] };
  const NAMES = { fuel: 'ТОПЛ', temp: '°C', oil: 'МАСЛО', volt: 'V', boost: 'BAR' };

  function drawFace(car, spec, units) {
    const pal = paletteOf(car), lay = layoutOf(car, spec);
    const cv = F.Tex.canvas(512, 256), x = cv.getContext('2d');
    const rad = d => (d - 90) * Math.PI / 180;
    if (lay.bg === 'wood') {
      x.fillStyle = '#5c3418'; x.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 40; i++) {
        x.strokeStyle = i % 3 ? 'rgba(30,14,4,0.35)' : 'rgba(150,90,40,0.25)'; x.lineWidth = 1 + (i % 4);
        x.beginPath(); x.moveTo(0, i * 6.5 + Math.sin(i) * 3);
        for (let k = 0; k <= 8; k++) x.lineTo(k * 64, i * 6.5 + Math.sin(i * 1.7 + k * 0.9) * 4);
        x.stroke();
      }
    } else {
      x.fillStyle = pal.bg; x.fillRect(0, 0, 512, 256);
    }
    const text = (s, px, py, size, col, weight = 'bold') => {
      x.fillStyle = col; x.font = `${weight} ${Math.round(size)}px Arial`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, px, py);
    };
    for (const d of lay.dials) {
      const sc = scaleOf(d.k, spec, units);
      const small = d.k !== 'speed' && d.k !== 'rpm' && d.k !== 'boost';
      if (d.fan) {
        x.fillStyle = pal.rim; x.beginPath(); x.arc(d.x, d.y, d.r + 10, rad(d.a0 - 6), rad(d.a1 + 6)); x.arc(d.x, d.y, d.r * 0.55, rad(d.a1 + 6), rad(d.a0 - 6), true); x.closePath(); x.fill();
        x.fillStyle = pal.face; x.beginPath(); x.arc(d.x, d.y, d.r + 4, rad(d.a0 - 4), rad(d.a1 + 4)); x.arc(d.x, d.y, d.r * 0.58, rad(d.a1 + 4), rad(d.a0 - 4), true); x.closePath(); x.fill();
      } else {
        x.fillStyle = pal.rim; x.beginPath(); x.arc(d.x, d.y, d.r + 5, 0, Math.PI * 2); x.fill();
        x.fillStyle = pal.face; x.beginPath(); x.arc(d.x, d.y, d.r, 0, Math.PI * 2); x.fill();
      }
      const ang = v => rad(angleOf(d, v, sc));
      const pt = (v, k) => [d.x + Math.cos(ang(v)) * d.r * k, d.y + Math.sin(ang(v)) * d.r * k];
      if (sc.red !== undefined) {
        x.strokeStyle = pal.red; x.lineWidth = d.r * 0.07;
        x.beginPath(); x.arc(d.x, d.y, d.r * 0.9, ang(sc.red), ang(sc.max)); x.stroke();
      }
      x.lineCap = 'butt';
      for (let v = sc.min; v <= sc.max + 1e-6; v += sc.sub) {
        const major = Math.abs(v / sc.step - Math.round(v / sc.step)) < 1e-6;
        const hot = sc.red !== undefined && v >= sc.red - 1e-6;
        const a = pt(v, 0.96), c = pt(v, major ? (small ? 0.72 : 0.8) : 0.87);
        x.strokeStyle = hot ? pal.red : pal.ink; x.lineWidth = major ? Math.max(2, d.r * 0.035) : Math.max(1, d.r * 0.02);
        x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); x.stroke();
        if (major && !small && !d.fan && d.k !== 'boost') { const q = pt(v, 0.64); text(String(Math.round(v * 10) / 10), q[0], q[1], d.r * 0.19, hot ? pal.red : pal.ink); }
        if (major && d.fan) { const q = pt(v, 0.78); text(String(Math.round(v)), q[0], q[1], 17, pal.ink); }
      }
      if (small || d.k === 'boost') {
        const ends = d.k === 'boost' ? ['-1', '1.5'] : ENDS[d.k] || ['', ''];
        const p0 = pt(sc.min, 0.55), p1 = pt(sc.max, 0.55);
        text(ends[0], p0[0], p0[1], d.r * 0.32, pal.ink); text(ends[1], p1[0], p1[1], d.r * 0.32, pal.ink);
        text(NAMES[d.k] || '', d.x, d.y + d.r * 0.42, d.r * 0.26, pal.ink, 'normal');
      } else if (d.k === 'speed') text(units === 'mph' ? 'MPH' : 'КМ/Ч', d.x, d.y - d.r * (d.fan ? 0.66 : 0.3), d.fan ? 13 : d.r * 0.13, pal.ink, 'normal');
      else if (d.k === 'rpm') text('×1000 ОБ/МИН', d.x, d.y - d.r * 0.3, d.r * 0.1, pal.ink, 'normal');
    }
    for (const l of lay.lcd) {
      x.fillStyle = pal.lcd[0]; x.fillRect(l.x - l.w / 2 - 2, l.y - l.h / 2 - 2, l.w + 4, l.h + 4);
    }
    for (const l of lay.lamps) {
      x.fillStyle = '#000000'; x.beginPath(); x.arc(l.x, l.y, 11, 0, Math.PI * 2); x.fill();
    }
    return cv;
  }

  function face(car, spec, units) {
    const key = car.id + '|' + units + '|' + spec.red + '|' + (spec.turbo ? 1 : 0) + '|' + Math.round(F.perf(spec).vmax);
    let cv = faceCache.get(key);
    if (!cv) { cv = drawFace(car, spec, units); faceCache.set(key, cv); }
    return { cv, key };
  }

  const SLOTS = { odo: [0, 0, 128, 32], clock: [128, 0, 128, 32], gear: [0, 32, 48, 32], speed: [48, 32, 96, 32], radio: [144, 32, 112, 32] };
  const LAMP_CELL = i => [i * 32, 64, 32, 32];

  function drawLcd(cv, pal, lay, st) {
    const x = cv.getContext('2d');
    x.clearRect(0, 0, 256, 96);
    const box = (r, bg) => { x.fillStyle = bg; x.fillRect(r[0], r[1], r[2], r[3]); };
    const text = (s, r, size, col, font = 'bold') => {
      x.fillStyle = col; x.font = `${font} ${size}px 'Courier New', monospace`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, r[0] + r[2] / 2, r[1] + r[3] / 2 + 1);
    };
    const [bg, fg] = pal.lcd;
    const odo = SLOTS.odo;
    box(odo, bg);
    if (pal.drum) {
      const digits = String(Math.floor(st.odo * 10) % 10000000).padStart(7, '0');
      for (let i = 0; i < 7; i++) {
        const last = i === 6, cw = odo[2] / 7;
        box([odo[0] + i * cw + 1, odo[1] + 2, cw - 2, odo[3] - 4], last ? fg : '#101010');
        text(digits[i], [odo[0] + i * cw, odo[1], cw, odo[3]], 22, last ? bg : fg);
      }
    } else text(String(Math.floor(st.odo)).padStart(6, '0'), odo, 24, fg);
    box(SLOTS.clock, bg); text(st.clock, SLOTS.clock, 24, fg);
    box(SLOTS.gear, bg); text(st.gear, SLOTS.gear, 28, fg);
    box(SLOTS.speed, bg); text(st.speed, SLOTS.speed, 30, fg);
    box(SLOTS.radio, '#06100a'); text(st.radio, SLOTS.radio, st.radio.length > 12 ? 11 : 13, '#7cf0a0');
    lay.lamps.forEach((l, i) => {
      const r = LAMP_CELL(i), on = st.lamps[i];
      box(r, '#000000');
      const cx = r[0] + 16, cy = r[1] + 16, col = on ? LAMP[l.k] : '#262626';
      if (on) { const g = x.createRadialGradient(cx, cy, 2, cx, cy, 16); g.addColorStop(0, LAMP[l.k]); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(r[0], r[1], 32, 32); }
      x.strokeStyle = on ? '#ffffff' : col; x.fillStyle = on ? '#ffffff' : col; x.lineWidth = 2;
      if (l.k === 'beam') { x.beginPath(); x.arc(cx + 2, cy, 6, -Math.PI / 2, Math.PI / 2); x.closePath(); x.stroke(); for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(cx - 9, cy + k * 4); x.lineTo(cx - 3, cy + k * 4); x.stroke(); } }
      else if (l.k === 'hand') { x.beginPath(); x.arc(cx, cy, 9, 0, Math.PI * 2); x.stroke(); x.font = 'bold 12px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('P', cx, cy + 1); }
      else if (l.k === 'bat') { x.strokeRect(cx - 9, cy - 5, 18, 12); x.fillRect(cx - 6, cy - 8, 3, 3); x.fillRect(cx + 3, cy - 8, 3, 3); }
      else if (l.k === 'oil') { x.beginPath(); x.moveTo(cx - 9, cy + 5); x.lineTo(cx + 4, cy + 5); x.lineTo(cx + 9, cy - 2); x.lineTo(cx - 2, cy - 2); x.lineTo(cx - 5, cy - 6); x.closePath(); x.stroke(); }
      else if (l.k === 'choke') { x.beginPath(); x.arc(cx, cy, 8, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(cx - 6, cy + 6); x.lineTo(cx + 6, cy - 6); x.stroke(); }
      else { x.font = `bold ${l.k === 'shift' ? 9 : 10}px Arial`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(l.k.toUpperCase(), cx, cy + 1); }
    });
  }

  F.Cluster = { PALETTES, LAYOUTS, LAMP, SLOTS, LAMP_CELL, layoutOf, paletteOf, scaleOf, angleOf, face, lcd: drawLcd };

  F.Hud = Hud;
  F.star = star;
})(globalThis.Forza = globalThis.Forza || {});
