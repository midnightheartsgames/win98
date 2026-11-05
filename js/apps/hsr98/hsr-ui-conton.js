(function (H) {
  'use strict';
  const G = H.Gfx, T = H.TUNING;
  const { W } = H.UI_CONST;
  const GYN_AT = { x: 568, y: 336, s: 128 };
  const PINK = '#ff8ac8', HEART = '#ff5aa0', AVIA = '#7ab4ff', THIEF = '#ff3a5a', SHINE = '#ffd850';
  const SCAN = '#6ccefb';
  const CUT_LEN = { heist: 0.8, call: 0.85 };
  const cl = v => Math.max(0, Math.min(1, v));
  const ease = k => 1 - (1 - k) * (1 - k);
  const SQUAD = [[-26, -30, 0.66], [24, -30, 0.66], [-48, -12, 0.78], [44, -12, 0.78]];

  function heartPath(c, cx, cy, r) {
    c.beginPath();
    c.moveTo(cx, cy + r * 0.95);
    c.bezierCurveTo(cx - r * 1.35, cy + r * 0.05, cx - r * 0.95, cy - r * 1.05, cx, cy - r * 0.4);
    c.bezierCurveTo(cx + r * 0.95, cy - r * 1.05, cx + r * 1.35, cy + r * 0.05, cx, cy + r * 0.95);
    c.closePath();
  }

  Object.assign(H.UI.prototype, {
    ccUi() {
      const bt = this.bt;
      if (!bt.cc) bt.cc = { gyn: null, cut: null, steals: [], burst: null, clap: null, chains: new Map(), rail: new Map() };
      return bt.cc;
    },

    gynAt() { return this.wide() ? { x: 254, y: 248, s: 118 } : GYN_AT; },

    gynoidPos() { const g = this.gynAt(); return { x: g.x, y: g.y - g.s * 0.55 }; },

    contonEvent(e) {
      const bt = this.bt, cc = this.ccUi();
      switch (e.t) {
        case 'gynoids':
          if (e.on) {
            cc.gyn = { u: e.u, t: 0, a: 0, shotT: 0, leaving: false };
            bt.big = { text: 'ГИНОИДЫ', sub: 'Таллея вызывает подмогу', col: AVIA, t: 0.9 };
            this.sfx('warp');
          } else if (cc.gyn && cc.gyn.u === e.u) cc.gyn.leaving = true;
          return true;
        case 'mark':
          for (const f of bt.foes) f.dSig = f === e.u;
          this.floatAt(e.u, e.text, AVIA, 11);
          this.sfx('debuff');
          return true;
        case 'shackle':
          e.u.dShackle = e.n;
          if (e.tick) { cc.chains.set(e.u, 0.6); this.floatAt(e.u, 'Оковы!', AVIA, 13); this.sfx('glint'); }
          else this.floatAt(e.u, 'Оковы ' + e.n, AVIA, 10);
          return true;
        case 'shiny':
          e.u.dShiny = e.v;
          if (e.add > 0) { this.floatAt(e.u, 'Блестяшка +' + e.add, SHINE, 11); this.sfx('glint'); }
          return true;
        case 'steal':
          this.floatAt(e.from, e.text, THIEF, 13);
          cc.steals.push({ from: e.from, to: e.u, t: 0 });
          this.sfx('whoosh');
          return true;
        case 'away':
          e.u.dAway = 'portal';
          this.floatAt(e.u, e.text, THIEF, 12);
          this.sfx('warp');
          return true;
        case 'back': {
          e.u.dAway = null;
          const hit = bt.queue.find(x => x.t === 'dmg' && x.src === e.u && x.u.side === 'enemy');
          cc.cut = { kind: 'heist', u: e.u, at: hit ? hit.u : null, t: 0 };
          bt.shake = Math.max(bt.shake, 6);
          this.sfx('ult');
          return true;
        }
        case 'capsule':
          e.u.dAway = e.on ? 'capsule' : null;
          if (e.hp != null) e.u.dHp = e.hp;
          if (!e.on) this.floatAt(e.u, e.text, '#90ffb0', 12);
          if (e.on) { e.u.dShield = 0; e.u.dHp = Math.max(1, e.u.dHp || 0); bt.big = { text: 'КАПСУЛА', sub: e.u.name + ' на корабле', col: AVIA, t: 0.9 }; }
          this.sfx(e.on ? 'warp' : 'heal');
          return true;
        case 'ccForm':
          e.u.dPink = e.on;
          if (!cc.cut) bt.big = { text: 'РОЗОВАЯ ЗАЩИТНИЦА', sub: e.u.name + ' превращается', col: PINK, t: 0.9 };
          this.sfx('star4');
          return true;
        case 'applause': {
          const b = this.game.battle || this.lastBattle;
          cc.clap = { t: 0, text: e.text };
          if (b) for (const a of b.allies) if (!a.dead && !a.flags.away) this.floatAt(a, '+' + e.v + ' энергии', '#ffe890', 10);
          this.sfx('buff');
          return true;
        }
      }
      return false;
    },

    contonAct(e) {
      const bt = this.bt, cc = this.ccUi();
      if (e.u.id === 'gynoids' && cc.gyn) cc.gyn.shotT = 0.5;
      if (e.call) { cc.cut = { kind: 'call', u: e.u, t: 0 }; e.hold = CUT_LEN.call; }
      if (e.burst) { cc.burst = { at: e.burst, t: 0 }; e.hold = 0.6; bt.shake = Math.max(bt.shake, 6); }
    },

    contonUpdate(dt) {
      const cc = this.ccUi();
      const g = cc.gyn;
      if (g) {
        g.t += dt;
        g.shotT = Math.max(0, g.shotT - dt);
        g.a = g.leaving ? Math.max(0, g.a - dt * 2) : Math.min(1, g.a + dt * 2.5);
        if (g.leaving && g.a <= 0) cc.gyn = null;
      }
      if (cc.cut) { cc.cut.t += dt; if (cc.cut.t > CUT_LEN[cc.cut.kind]) cc.cut = null; }
      for (const s of cc.steals) s.t += dt;
      cc.steals = cc.steals.filter(s => s.t < 0.7);
      if (cc.burst) { cc.burst.t += dt; if (cc.burst.t > 0.8) cc.burst = null; }
      if (cc.clap) { cc.clap.t += dt; if (cc.clap.t > 1.2) cc.clap = null; }
      for (const [u, t] of cc.chains) { if (t - dt <= 0) cc.chains.delete(u); else cc.chains.set(u, t - dt); }
    },

    contonPortrait(c, u, x, y, size) {
      const pink = u.dPink != null ? u.dPink : u.flags.pink;
      if (u.charId !== 'amanda' || !pink || !u.kit.pinkLook) return false;
      G.drawPortrait(c, u.kit.pinkLook, x, y, size);
      return true;
    },

    contonCard(c, u, x, y, tags, tx) {
      if (u.charId === 'makoto') {
        const n = u.dShiny == null ? u.flags.shiny || 0 : u.dShiny;
        const sm = u.flags.shinyMax || T.mkShinyMax;
        for (let k = 0; k < sm; k++) this.diamond(x + 9 + k * 8, y + 93, 3, k < n ? SHINE : '#20263e', '#0a1020');
        tx = x + 12 + sm * 8;
      }
      if (u.buffs.some(b => b.name === 'Все смотрят')) tags.unshift('Все смотрят');
      if (u.charId === 'talleah' && !u.flags.capsuleUsed && !u.dead) tags.push('Капсула');
      if (u.dShield > 0 && u.flags.cocoon) this.cocoonFrame(c, x + 3, y + 3, 58);
      const away = u.dAway === undefined ? u.flags.away : u.dAway;
      if (away && !u.dead) this.awayCard(c, u, x, y, away);
      return tx;
    },

    cocoonFrame(c, x, y, s) {
      const pulse = 0.65 + 0.35 * Math.sin(this.t * 5), cx = x + s / 2, cy = y + s / 2 + 2;
      c.save();
      c.strokeStyle = 'rgba(255,90,160,' + (pulse * 0.5).toFixed(2) + ')'; c.lineWidth = 5;
      heartPath(c, cx, cy, s * 0.44); c.stroke();
      c.strokeStyle = HEART; c.lineWidth = 2;
      heartPath(c, cx, cy, s * 0.44); c.stroke();
      c.fillStyle = '#1a0610'; heartPath(c, x + s - 7, y + 8, 7); c.fill();
      c.fillStyle = HEART; heartPath(c, x + s - 7, y + 8, 5.5); c.fill();
      c.fillStyle = '#ffd0e4'; c.fillRect(Math.round(x + s - 10), Math.round(y + 5), 2, 2);
      c.restore();
    },

    awayCard(c, u, x, y, away) {
      const portal = away === 'portal';
      c.save();
      c.fillStyle = portal ? 'rgba(34,4,22,0.45)' : 'rgba(6,16,44,0.5)';
      c.fillRect(x, y, 108, 100);
      if (portal) this.portalRing(c, x + 50, y + 50, 13, 1);
      else this.capsuleGlyph(c, x + 46, y + 50, 1.1);
      c.fillStyle = portal ? '#1c040e' : '#060e24'; c.fillRect(x + 2, y + 61, 104, 37);
      c.fillStyle = portal ? THIEF : AVIA; c.fillRect(x + 2, y + 61, 104, 1);
      this.text(portal ? 'В другом измерении' : 'На корабле', x + 54, y + 66, { align: 'center', size: 9, bold: true, col: portal ? '#ffb0c0' : '#b8d8ff' });
      this.text(portal ? 'вернётся с ударом' : 'вернётся в свой ход', x + 54, y + 80, { align: 'center', size: 9, col: portal ? '#e8a0b0' : '#a0c0e8' });
      c.restore();
    },

    portalRing(c, cx, cy, r, a) {
      const t = this.t;
      c.save();
      c.globalAlpha *= a;
      const gr = c.createRadialGradient(cx, cy, 1, cx, cy, r);
      gr.addColorStop(0, 'rgba(10,0,8,0.95)'); gr.addColorStop(0.7, 'rgba(60,4,24,0.85)'); gr.addColorStop(1, 'rgba(255,58,90,0.6)');
      c.fillStyle = gr; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = THIEF; c.lineWidth = Math.max(2, r * 0.14); c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = '#ffd0dc'; c.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) { const an = t * 3 + i * Math.PI / 3; c.beginPath(); c.arc(cx, cy, r * 1.12, an, an + 0.45); c.stroke(); }
      c.restore();
    },

    capsuleGlyph(c, cx, cy, k) {
      c.save();
      c.translate(cx, cy); c.scale(k, k);
      c.fillStyle = '#0a1020'; c.beginPath(); c.ellipse(0, 0, 13, 8, -0.35, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e2e8f8'; c.beginPath(); c.ellipse(0, 0, 11.5, 6.6, -0.35, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#6792c4'; c.beginPath(); c.ellipse(2, -1.5, 5, 3, -0.35, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffb060'; c.beginPath(); c.moveTo(-10, 3); c.lineTo(-17, 6 + Math.sin(this.t * 20)); c.lineTo(-10, 6); c.fill();
      c.restore();
    },

    contonFoeTags(u, tags) {
      const n = u.dShackle != null ? u.dShackle : u.flags.shackle ? u.flags.shackle.n : 0;
      for (const name of ['Оковы', 'Сигнатура']) { const i = tags.indexOf(name); if (i >= 0) tags.splice(i, 1); }
      if (n > 0) tags.unshift('Оковы ' + n);
    },

    contonBack(c, lay) {
      const cut = this.ccUi().cut;
      if (!cut || cut.kind !== 'heist') return;
      const p = cut.at && lay.get(cut.at);
      if (!p) return;
      const k = cut.t / CUT_LEN.heist, a = cl(k * 8) * cl((1 - k) * 5), r = p.s * 0.62 * (0.4 + 0.6 * ease(cl(k * 3)));
      this.portalRing(c, p.x, p.y - p.s * 0.45, r, a);
    },

    contonField(c, lay) {
      const cc = this.ccUi(), b = this.game.battle || this.lastBattle;
      for (const [u, p] of lay) {
        if (u.dead || u.gone) continue;
        const sig = u.dSig != null ? u.dSig : u.buffs.some(x => x.name === 'Сигнатура');
        if (sig) this.sigReticle(c, p.x, p.y - p.s * 0.45, Math.max(20, p.s * 0.3));
        const ch = cc.chains.get(u);
        if (ch) this.chainFlash(c, p.x, p.y - p.s * 0.45, p.s * 0.36, ch / 0.6);
      }
      if (cc.gyn) this.drawGynoids(c, cc.gyn, lay, b);
      if (cc.burst) this.drawBurst(c, cc.burst, lay);
      if (cc.clap) this.drawClap(c, cc.clap);
    },

    sigReticle(c, cx, cy, r) {
      const t = this.t, a = 0.7 + 0.3 * Math.sin(t * 4);
      c.save();
      c.strokeStyle = 'rgba(122,180,255,' + a.toFixed(2) + ')'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
      for (let i = 0; i < 4; i++) {
        const an = t * 0.8 + i * Math.PI / 2, dx = Math.cos(an), dy = Math.sin(an);
        c.beginPath(); c.moveTo(cx + dx * (r - 5), cy + dy * (r - 5)); c.lineTo(cx + dx * (r + 7), cy + dy * (r + 7)); c.stroke();
      }
      c.fillStyle = AVIA; c.fillRect(Math.round(cx) - 1, Math.round(cy) - 1, 2, 2);
      c.restore();
    },

    chainFlash(c, cx, cy, r, k) {
      c.save();
      c.globalAlpha = cl(k * 1.6);
      c.strokeStyle = '#e8f2ff'; c.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const an = i / 12 * Math.PI * 2 + (1 - k) * 2, x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r * 0.55;
        c.beginPath(); c.ellipse(x, y, 5, 3, an + Math.PI / 2 * (i % 2), 0, Math.PI * 2); c.stroke();
      }
      c.strokeStyle = AVIA; c.lineWidth = 1;
      c.beginPath(); c.ellipse(cx, cy, r * 1.1, r * 0.62, 0, 0, Math.PI * 2); c.stroke();
      c.restore();
    },

    drawGynoids(c, g, lay, b) {
      const { x, y, s } = this.gynAt(), bt = this.bt, lunge = (bt.lunge.get(g.u) || 0) * 24;
      c.save();
      c.globalAlpha = g.a;
      if (g.u.flags.squad > 0) for (const [dx, dy, k] of SQUAD) this.gynoidFigure(c, x + dx, y + dy, s * k, g.t + dx, 0.85);
      this.gynoidFigure(c, x - lunge, y, s, g.t, 1, g.shotT);
      if (g.shotT > 0 && b) {
        const tgt = [...lay.keys()].find(u => !u.dead && !u.gone && (u.dSig != null ? u.dSig : u === b.ccSig));
        const p = tgt && lay.get(tgt);
        if (p) {
          c.globalAlpha = g.a * cl(g.shotT * 3);
          c.strokeStyle = SCAN; c.lineWidth = 3;
          c.beginPath(); c.moveTo(x - lunge, y - s * 0.66); c.lineTo(p.x, p.y - p.s * 0.45); c.stroke();
          c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.stroke();
        }
      }
      c.restore();
    },

    gynoidFigure(c, x, y, s, t, a, shot) {
      const dw = Math.max(12, Math.round(s / 2)) * 2, bob = Math.sin(t * 2.2) * 2;
      c.save();
      c.globalAlpha *= a;
      c.fillStyle = 'rgba(10,20,50,0.35)'; c.beginPath(); c.ellipse(x, y + 3, s * 0.2, 6, 0, 0, Math.PI * 2); c.fill();
      G.drawEnemy(c, { id: 'gynoid' }, x, y + bob, s, { t, aura: false, flash: shot ? 0.25 : 0 });
      if (shot) {
        const gr = c.createRadialGradient(x, y + bob - dw * 0.66, 1, x, y + bob - dw * 0.66, dw * 0.12);
        gr.addColorStop(0, 'rgba(108,206,251,0.9)'); gr.addColorStop(1, 'rgba(108,206,251,0)');
        c.fillStyle = gr; c.fillRect(x - dw * 0.12, y + bob - dw * 0.78, dw * 0.24, dw * 0.24);
      }
      c.restore();
    },

    gynoidIcon(c, x, y, size) {
      G.foeIcon(c, { id: 'gynoid', fam: 'automaton' }, x, y, size, { border: false });
    },

    contonRail(c, u, x, y, size) {
      const cc = this.ccUi();
      cc.rail.set(u, { x, y, size });
      const away = u.dAway === undefined ? u.flags.away : u.dAway;
      if (away === 'portal') this.portalRing(c, x + size / 2, y + size / 2, size * 0.36, 0.9);
      if (away === 'capsule') { c.fillStyle = 'rgba(6,16,44,0.55)'; c.fillRect(x, y, size, size); this.capsuleGlyph(c, x + size / 2, y + size / 2, size / 40); }
      if (u.id === 'gynoids' && u.flags.squad > 0) for (let i = 0; i < 5; i++) this.gynoidIcon(c, this.wide() ? x + i * 8 : x + size + 4 + i * 11, this.wide() ? y - 13 : y + size / 2 - 6, this.wide() ? 10 : 12);
    },

    contonRailFx(c) {
      const cc = this.ccUi();
      for (const s of cc.steals) {
        const from = this.railOrField(cc, s.from), to = this.railOrField(cc, s.to), k = ease(cl(s.t / 0.55));
        const x = from.x + (to.x - from.x) * k, y = from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * 26;
        this.catToken(c, x, y, cl((0.7 - s.t) * 6));
      }
      cc.rail.clear();
    },

    railOrField(cc, u) {
      const r = cc.rail.get(u);
      return r ? { x: r.x + r.size / 2, y: r.y + r.size / 2 } : this.unitPos(u);
    },

    catToken(c, x, y, a) {
      c.save();
      c.globalAlpha = a;
      c.fillStyle = '#1a0408';
      c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(x - 8, y - 3); c.lineTo(x - 7, y - 13); c.lineTo(x - 1, y - 7); c.fill();
      c.beginPath(); c.moveTo(x + 8, y - 3); c.lineTo(x + 7, y - 13); c.lineTo(x + 1, y - 7); c.fill();
      c.fillStyle = THIEF;
      c.beginPath(); c.arc(x, y, 7.5, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(x - 6.5, y - 3); c.lineTo(x - 6, y - 11); c.lineTo(x - 1.5, y - 6); c.fill();
      c.beginPath(); c.moveTo(x + 6.5, y - 3); c.lineTo(x + 6, y - 11); c.lineTo(x + 1.5, y - 6); c.fill();
      c.fillStyle = SHINE; c.fillRect(Math.round(x - 4), Math.round(y - 2), 2, 2); c.fillRect(Math.round(x + 2), Math.round(y - 2), 2, 2);
      c.restore();
    },

    drawBurst(c, s, lay) {
      const from = this.unitPos(s.at), k = s.t / 0.8, a = cl((0.8 - s.t) * 5);
      const foes = [...lay.entries()].filter(([u]) => !u.dead && !u.gone);
      c.save();
      c.globalAlpha = a;
      c.strokeStyle = HEART; c.lineWidth = 3;
      heartPath(c, from.x, from.y - 20, 14 + k * 40); c.stroke();
      foes.forEach(([u, p], j) => {
        const tx = p.x, ty = p.y - p.s * 0.45;
        for (let i = 0; i < 12; i++) {
          const q = cl(k * 1.6 - i * 0.05), sw = Math.sin(q * Math.PI) * (30 + i * 3) * (i % 2 ? 1 : -1);
          const x = from.x + (tx - from.x) * q + Math.cos(q * 9 + i + j) * sw * 0.4, y = from.y + (ty - from.y) * q - Math.sin(q * Math.PI) * 50 + Math.sin(q * 9 + i) * sw * 0.3;
          if (q <= 0 || q >= 1) continue;
          c.fillStyle = i % 3 === 0 ? '#7affb0' : i % 3 === 1 ? '#ff7ab8' : '#ffd0e4';
          if (i % 4 === 0) { heartPath(c, x, y, 4); c.fill(); } else c.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
        }
      });
      c.restore();
    },

    drawClap(c, s) {
      const up = ease(cl(s.t * 4)) * cl((1.2 - s.t) * 4), top = 376 - 44 * up;
      c.save();
      c.globalAlpha = Math.min(1, up * 1.3);
      for (let i = 0; i < 26; i++) {
        const hx = 6 + i * 25 + (i % 2) * 6, hy = top + 14 + (i % 3) * 4, hop = Math.abs(Math.sin(s.t * 18 + i * 1.7)) * 3;
        c.fillStyle = i % 2 ? '#1a1030' : '#24163e';
        c.beginPath(); c.arc(hx, hy - hop, 7, 0, Math.PI * 2); c.fill();
        c.fillRect(hx - 11, hy + 5 - hop, 22, 40);
        const clap = Math.sin(s.t * 22 + i) > 0 ? 3 : 6;
        c.fillRect(hx - clap - 3, hy - 16 - hop, 3, 9); c.fillRect(hx + clap, hy - 16 - hop, 3, 9);
      }
      this.text(s.text, W / 2, top - 14, { align: 'center', size: 14, bold: true, serif: true, col: '#ffe890' });
      c.restore();
    },

    contonOver(c) {
      const cut = this.ccUi().cut;
      if (!cut) return;
      const len = CUT_LEN[cut.kind], k = cut.t / len, a = cl(k * 6) * cl((1 - k) * 5), slide = 1 - ease(cl(k * 5)), y = 214;
      const heist = cut.kind === 'heist', col = heist ? THIEF : PINK;
      c.save();
      c.globalAlpha = a;
      c.translate(slide * (heist ? -320 : 320), 0);
      c.fillStyle = 'rgba(0,0,0,0.78)'; c.beginPath(); c.moveTo(0, y + 30); c.lineTo(W, y - 10); c.lineTo(W, y + 56); c.lineTo(0, y + 96); c.fill();
      c.fillStyle = col; c.beginPath(); c.moveTo(0, y + 30); c.lineTo(W, y - 10); c.lineTo(W, y - 5); c.lineTo(0, y + 35); c.fill();
      c.beginPath(); c.moveTo(0, y + 91); c.lineTo(W, y + 51); c.lineTo(W, y + 56); c.lineTo(0, y + 96); c.fill();
      const u = cut.u, look = u.kit && u.kit.pinkLook && !heist ? u.kit.pinkLook : G.lookOf(u.charId, this.game);
      const bx = heist ? 40 : W - 168;
      if (heist) this.portalRing(c, bx + 64, y + 34, 58, 0.9);
      else this.callMoths(c, bx + 64, y + 34, k);
      G.drawBust(c, look, bx, y - 34, 2);
      if (!heist) this.heartWand(c, bx + 18, y + 4, k);
      const tx = heist ? W / 2 + 70 : W / 2 - 80;
      if (heist) {
        this.text('Мяу.', tx, y + 12, { align: 'center', size: 34, bold: true, serif: true, col: '#ffd0dc' });
        this.text(u.name + ' выходит из портала', tx, y + 54, { align: 'center', size: 11, bold: true, col: '#ffb0c0' });
      } else {
        this.text('ЗОВ ЗАЩИТНИЦЫ', tx, y + 6, { align: 'center', size: 24, bold: true, serif: true, col: '#ffd0e8' });
        this.text('«Поверить не могу, что делаю это.»', tx, y + 42, { align: 'center', size: 12, bold: true, col: '#ffe8f2' });
      }
      c.restore();
    },

    callMoths(c, cx, cy, k) {
      for (let i = 0; i < 18; i++) {
        const an = i / 18 * Math.PI * 2 + k * 5, r = 70 - 40 * ease(k) + G.hash(i, 7, 23) * 14, x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r * 0.7;
        c.fillStyle = i % 3 ? '#ff9ad0' : '#ffe0f0';
        if (i % 3 === 0) { heartPath(c, x, y, 4); c.fill(); }
        else { c.fillRect(Math.round(x) - 3, Math.round(y) - 1, 2, 2); c.fillRect(Math.round(x) + 1, Math.round(y) - 1, 2, 2); }
      }
    },

    heartWand(c, x, y, k) {
      const lift = ease(cl(k * 3)) * 10;
      c.save();
      c.translate(x, y - lift);
      c.rotate(-0.35);
      c.fillStyle = '#ff7ab8'; c.fillRect(-1.5, 0, 3, 46);
      c.fillStyle = '#ffffff';
      c.beginPath(); c.moveTo(-6, -2); c.lineTo(-20, -12); c.lineTo(-16, 0); c.fill();
      c.beginPath(); c.moveTo(6, -2); c.lineTo(20, -12); c.lineTo(16, 0); c.fill();
      c.fillStyle = '#c5883d'; heartPath(c, 0, -4, 9); c.fill();
      c.fillStyle = HEART; heartPath(c, 0, -4, 7); c.fill();
      c.fillStyle = '#ffd0e4'; c.fillRect(-4, -8, 2, 2);
      c.restore();
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
