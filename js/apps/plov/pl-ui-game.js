(function (P) {
  'use strict';
  const O = P.Orn, A = P.Art, S = P.Scene, I = P.Icons;
  const { W, H, FONT, SERIF, label, wrap, paper, well, plaque, keyLine, ikatBorder, SCREENS, TEXT, TUNE, ITEMS } = P;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const CS = 1.25;
  const MONEY_AT = { x: 206, y: 16 };
  const HELD_PX = { plov: 25, achichuk: 19, samsa: 16, non: 19, teaBlack: 22, teaGreen: 22, compote: 18, veg: 20 };
  const STATION_ICON = { kazan: ['g', 'kazan'], tandoor: ['g', 'tandoor'], pass: ['g', 'pass'], bin: ['g', 'bin'] };
  const ACT_ICON = { chop: 'knife', stir: 'kapkir', order: 'notepad', pay: 'coins', bake: 'dough' };

  let mentorLook = null;
  function mentor() {
    if (!mentorLook) mentorLook = Object.assign({}, A.lookFor({ type: 'elder', seed: 424242, idx: 0 }), { key: 'mentor', skin: '#c68a5c', skinShade: '#a8704a', sash: '#e8c860' });
    return mentorLook;
  }

  function archPath(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + w * 0.46);
    ctx.quadraticCurveTo(x, y + w * 0.06, x + w / 2, y - w * 0.08);
    ctx.quadraticCurveTo(x + w, y + w * 0.06, x + w, y + w * 0.46);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  }

  function bust(ctx, D, x, y, w, h, expr) {
    archPath(ctx, x - 4, y - 4, w + 8, h + 8);
    A.finish(ctx, '#6a3a1e', '#241006', 1.4);
    archPath(ctx, x - 1.6, y - 1.6, w + 3.2, h + 3.2);
    ctx.strokeStyle = '#2a9aa8'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save();
    archPath(ctx, x, y, w, h);
    ctx.clip();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#fbe6b0'); g.addColorStop(1, '#d8904e');
    ctx.fillStyle = g; ctx.fillRect(x, y - w * 0.1, w, h + w * 0.1);
    ctx.globalAlpha = 0.18;
    O.suzani(ctx, x + w / 2, y + h * 0.42, w * 0.62, 7070, O.PALETTES.madder);
    ctx.globalAlpha = 1;
    const s = h / (37 * D.scale);
    A.drawCharHD(ctx, D, { dir: 'down', act: 'stand', frame: 0, expr: expr || 'ok' }, x + w / 2, y + 53 * s * D.scale, s);
    ctx.restore();
    archPath(ctx, x, y, w, h);
    ctx.strokeStyle = '#241006'; ctx.lineWidth = 1.2; ctx.stroke();
  }

  function hearts(ctx, x, y, value, r) {
    const n = TUNE.hearts;
    const rr = r || 3.9;
    const col = value > 3 ? '#f04858' : value > 1.6 ? '#f59a2a' : '#ff3a24';
    for (let i = 0; i < n; i++) {
      const frac = P.clamp(value - i, 0, 1);
      A.heart(ctx, x + (i - (n - 1) / 2) * rr * 2.6, y, rr, col, frac);
    }
  }

  function badge(ctx, x, y, text, fill) {
    A.ell(ctx, x, y + 1, 7.5, 7.5, 'rgba(20,8,0,0.4)', null);
    A.ell(ctx, x, y, 7.5, 7.5, fill || '#ffd23a', '#241006', 1.2);
    label(ctx, text, x, y + 0.5, { size: 10, color: '#241006' });
  }

  function fitFont(ctx, text, maxW, size, family, bold) {
    let s = size;
    for (; s > 7; s -= 0.5) { ctx.font = (bold ? 'bold ' : '') + s + 'px ' + family; if (ctx.measureText(text).width <= maxW) break; }
    return (bold ? 'bold ' : '') + s + 'px ' + family;
  }

  function brackets(ctx, r, col, t) {
    const pad = 3 + Math.sin(t * 6) * 1.4;
    const x0 = r.x - pad, y0 = r.y - pad, x1 = r.x + r.w + pad, y1 = r.y + r.h + pad;
    const L = Math.min(13, r.w / 3, r.h / 3);
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x0, y0 + L); ctx.lineTo(x0, y0); ctx.lineTo(x0 + L, y0);
      ctx.moveTo(x1 - L, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + L);
      ctx.moveTo(x1, y1 - L); ctx.lineTo(x1, y1); ctx.lineTo(x1 - L, y1);
      ctx.moveTo(x0 + L, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - L);
    };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    path(); ctx.strokeStyle = 'rgba(24,10,2,0.8)'; ctx.lineWidth = 4.6; ctx.stroke();
    path(); ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.stroke();
  }

  class PlayScreen {
    constructor(ui, arg) {
      this.ui = ui;
      this.day = arg.day || 1;
      this.level = P.LEVELS[this.day - 1];
      const rec = ui.dayRecord(this.day);
      this.rec = rec;
      this.game = new P.Game({ level: this.level, seed: this.day * 1000 + (rec.plays || 0) * 7 + 1, upgrades: ui.save.up, relaxed: ui.save.relaxed, skipTutorial: rec.best > 0 });
      this.bg = S.buildBackground(this.game);
      this.acc = 0;
      this.phase = 'intro';
      this.paused = false;
      this.fx = [];
      this.pops = [];
      this.coins = [];
      this.selected = null;
      this.drag = null;
      this.hover = null;
      this.nopeText = '';
      this.nopeT = 0;
      this.shownMoney = 0;
      this.chopT = 0;
      this.doneT = 0;
      this.flash = 0;
      this.introT = 0;
      this.introItems = this.newItems();
      this.fate = {};
      this.cards = [];
    }

    newItems() {
      const prev = this.day > 1 ? new Set(P.LEVELS[this.day - 2].items) : new Set();
      return this.level.items.filter(i => !prev.has(i));
    }

    enter() { this.ui.audio.play('menu'); }

    start() {
      this.phase = 'play';
      this.ui.audio.play('day');
      this.ui.audio.sfx('start');
      const rec = this.ui.save.days[this.day] || { best: 0, stars: 0, plays: 0 };
      rec.plays = (rec.plays || 0) + 1;
      this.ui.save.days[this.day] = rec;
      this.ui.save.played = (this.ui.save.played || 0) + 1;
      this.ui.persist();
    }

    pause() { if (this.phase === 'play') { this.paused = true; this.ui.openModal(this.pauseModal()); } }

    resume() { this.paused = false; this.ui.closeModal(); }

    trackFates() {
      for (const grp of this.game.groups) {
        if (grp.state === 'leave') this.fate[grp.id] = 'ok';
        else if (grp.state === 'angry' || grp.state === 'turned') this.fate[grp.id] = 'lost';
      }
    }

    update(dt) {
      const ui = this.ui, g = this.game;
      this.introT += dt;
      if (this.phase === 'play' && !this.paused && !ui.isActive()) this.pause();
      if (this.paused && !ui.modal) ui.openModal(this.pauseModal());
      const running = this.phase === 'play' && !this.paused && !ui.modal;
      if (running || this.phase === 'done') this.animate(dt);
      if (running) {
        let dx = 0, dy = 0;
        const k = ui.keys;
        if (k.has('KeyA') || k.has('ArrowLeft')) dx -= 1;
        if (k.has('KeyD') || k.has('ArrowRight')) dx += 1;
        if (k.has('KeyW') || k.has('ArrowUp')) dy -= 1;
        if (k.has('KeyS') || k.has('ArrowDown')) dy += 1;
        g.setMove(dx, dy);
        this.acc += dt;
        let n = 0;
        while (this.acc >= STEP && n < 8) {
          g.update(STEP);
          this.acc -= STEP;
          n++;
          this.handle(g.drain());
          this.trackFates();
          if (g.phase === 'end') break;
        }
        if (n >= 8) this.acc = 0;
        const b = g.hero.busy;
        if (b && b.anim === 'chop') { this.chopT -= dt; if (this.chopT <= 0) { ui.audio.sfx('chop'); this.chopT = 0.19; } }
        if (g.phase === 'end' && this.phase === 'play') { this.phase = 'done'; this.doneT = 0; ui.audio.play(null); ui.audio.sfx(g.result.passed ? 'win' : 'fail'); }
      }
      if (this.phase === 'done') {
        this.doneT += dt;
        if (this.doneT > 2.2) this.finish();
      }
      this.shownMoney += (g.money - this.shownMoney) * Math.min(1, dt * 6);
      if (Math.abs(g.money - this.shownMoney) < 1) this.shownMoney = g.money;
      if (this.nopeT > 0) this.nopeT -= dt;
      if (this.flash > 0) this.flash -= dt;
    }

    finish() {
      const ui = this.ui, g = this.game, res = g.result;
      const s = ui.save;
      const rec = s.days[this.day] || { best: 0, stars: 0, plays: 1 };
      const prevBest = rec.best || 0, prevStars = rec.stars || 0;
      rec.best = Math.max(prevBest, res.money);
      rec.stars = Math.max(prevStars, res.stars);
      s.days[this.day] = rec;
      const savings = Math.max(0, Math.round(res.money * TUNE.savings / 10) * 10);
      s.wallet += savings;
      s.earned += Math.max(0, res.money);
      const unlockedNow = res.passed && s.unlocked === this.day && this.day < P.LEVELS.length;
      if (res.passed) s.unlocked = Math.max(s.unlocked, Math.min(P.LEVELS.length, this.day + 1));
      const finale = res.passed && this.day === P.LEVELS.length && !s.finale;
      if (finale) s.finale = true;
      ui.persist();
      ui.go('results', { day: this.day, result: res, prevBest, prevStars, savings, unlockedNow, finale });
    }

    handle(events) {
      const ui = this.ui;
      for (const e of events) {
        switch (e.t) {
          case 'sfx': ui.audio.sfx(e.id); break;
          case 'pop': this.pops.push({ x: e.x, y: e.y, text: e.text, col: e.col, t: 0, big: e.col === 'gold' }); break;
          case 'nope': this.nopeText = e.text; this.nopeT = 2.2; this.pops.push({ x: e.x, y: e.y, text: e.text, col: 'nope', t: 0 }); break;
          case 'cash': {
            const n = P.clamp(Math.round((e.amount + e.tip) / 120), 3, 14);
            for (let i = 0; i < n; i++) this.coins.push({ x: e.x + (Math.random() - 0.5) * 30, y: e.y + (Math.random() - 0.5) * 16, sx: e.x, sy: e.y, t: -i * 0.05, vx: (Math.random() - 0.5) * 80, vy: -60 - Math.random() * 60 });
            this.pops.push({ x: e.x, y: e.y - 8, text: '+' + P.money(e.amount), col: 'gold', t: 0, big: true, coin: true });
            if (e.tip > 0) this.pops.push({ x: e.x, y: e.y + 12, text: 'чаевые +' + P.money(e.tip), col: 'green', t: -0.25 });
            break;
          }
          case 'combo': this.pops.push({ x: e.x, y: e.y - 26, text: 'Серия ×' + e.n + '  +' + e.bonus, col: 'combo', t: 0 }); ui.audio.sfx('combo', e.n); break;
          case 'hearts': for (let i = 0; i < 3; i++) this.fx.push({ kind: 'heart', x: e.x + (i - 1) * 8, y: e.y, vx: (i - 1) * 8, vy: -30 - i * 6, t: 0, life: 0.9 }); break;
          case 'angry': for (let i = 0; i < 5; i++) this.fx.push({ kind: 'puff', x: e.x + (Math.random() - 0.5) * 24, y: e.y, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 20, t: 0, life: 1 }); this.flash = 0.25; break;
          case 'queued': ui.audio.sfx('hover'); break;
        }
      }
    }

    animate(dt) {
      for (const p of this.pops) p.t += dt;
      this.pops = this.pops.filter(p => p.t < 1.6);
      for (const f of this.fx) { f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; }
      this.fx = this.fx.filter(f => f.t < f.life);
      for (const c of this.coins) {
        c.t += dt;
        if (c.t < 0) continue;
        if (c.t < 0.35) { c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 260 * dt; c.px = c.x; c.py = c.y; }
        else {
          const k = Math.min(1, (c.t - 0.35) / 0.45);
          const e = k * k;
          c.x = c.px + (MONEY_AT.x - c.px) * e;
          c.y = c.py + (MONEY_AT.y - c.py) * e - Math.sin(k * Math.PI) * 40;
        }
      }
      const before = this.coins.length;
      this.coins = this.coins.filter(c => c.t < 0.8);
      if (this.coins.length < before) this.ui.audio.sfx('tick');
    }

    groupRect(grp) {
      const xs = grp.members.map(m => m.x), ys = grp.members.map(m => m.y);
      return { x: Math.min(...xs) - 16, y: Math.min(...ys) - 58, w: Math.max(...xs) - Math.min(...xs) + 32, h: Math.max(...ys) - Math.min(...ys) + 64 };
    }

    cardAt(x, y) {
      for (const c of this.cards) if (P.inRect(x, y, c.rect)) return c;
      return null;
    }

    targetAtMouse() {
      const ui = this.ui;
      if (ui.my < P.HUD_TOP || ui.my > P.HUD_BOTTOM) return null;
      const c = this.cardAt(ui.mx, ui.my);
      if (c) return { id: 'q' + c.group.id, kind: 'queue', group: c.group, rect: c.rect };
      return this.game.targetAt(ui.mx, ui.my);
    }

    move() {
      this.usedKeys = false;
      if (this.phase !== 'play') return;
      this.hover = this.targetAtMouse();
    }

    click(x, y, button) {
      const ui = this.ui, g = this.game;
      if (this.phase === 'intro' || this.phase === 'done') return;
      if (g.modal) { g.ack(); ui.audio.sfx('click'); return; }
      if (button === 2) { g.clearQueue(); this.selected = null; ui.audio.sfx('nope'); return; }
      if (y < P.HUD_TOP || y > P.HUD_BOTTOM) return;
      const card = this.cardAt(x, y);
      const tg = card ? { id: 'q' + card.group.id, kind: 'queue', group: card.group } : g.targetAt(x, y);
      if (tg && tg.kind === 'queue') {
        this.selected = tg.group.id;
        this.drag = { id: tg.group.id, x, y, moved: false };
        ui.audio.sfx('seat');
        return;
      }
      if (this.selected !== null && tg && tg.kind === 'table') {
        if (g.seat(this.selected, tg.id)) { this.selected = null; }
        this.handle(g.drain());
        return;
      }
      this.selected = null;
      if (tg) { g.click(tg.id); this.handle(g.drain()); return; }
      if (y > P.FLOOR.y0 && y < P.FLOOR.y1 && x > P.FLOOR.x0 && x < P.FLOOR.x1) { g.click('floor:' + Math.round(x) + ',' + Math.round(y)); this.handle(g.drain()); }
    }

    up(x, y) {
      const g = this.game;
      if (!this.drag) return;
      const d = this.drag;
      this.drag = null;
      if (Math.hypot(x - d.x, y - d.y) < 8) return;
      const tg = g.targetAt(x, y);
      if (tg && tg.kind === 'table' && this.selected !== null) { if (g.seat(this.selected, tg.id)) this.selected = null; this.handle(g.drain()); }
    }

    key(e) {
      const ui = this.ui, g = this.game, k = e.key, code = e.code;
      if (this.phase === 'intro') {
        if (k === 'Enter' || k === ' ') { this.start(); return true; }
        if (k === 'Escape') { ui.go('days'); return true; }
        return false;
      }
      if (this.phase !== 'play') return true;
      this.usedKeys = true;
      if (g.modal) { if (k === 'Enter' || k === ' ' || k === 'Escape') { g.ack(); ui.audio.sfx('click'); } return true; }
      if (k === 'Escape' || k === 'p' || k === 'P' || k === 'з' || k === 'З') { this.pause(); return true; }
      if (code === 'Space' || code === 'KeyE' || k === 'Enter') { this.keyAct(); return true; }
      if (code === 'KeyQ' || k === 'Backspace') { g.clearQueue(); this.selected = null; return true; }
      if (k === 'Tab') {
        if (!g.queue.length) return true;
        const i = g.queue.findIndex(q => q.id === this.selected);
        this.selected = g.queue[(i + 1) % g.queue.length].id;
        ui.audio.sfx('seat');
        return true;
      }
      if (/^Digit[1-6]$/.test(code) || /^Numpad[1-6]$/.test(code)) {
        const n = +code.slice(-1);
        const tb = g.tables.find(t => t.n === n);
        const grp = this.selected !== null ? this.selected : (g.queue[0] && g.queue[0].id);
        if (tb && grp !== undefined && grp !== null) { if (g.seat(grp, tb.id)) this.selected = null; this.handle(g.drain()); }
        return true;
      }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) return true;
      return false;
    }

    keyAct() {
      const g = this.game;
      const f = g.focus();
      if (f && this.selected !== null && g.tab[f]) {
        if (g.seat(this.selected, f)) this.selected = null;
        this.handle(g.drain());
        return;
      }
      const r = g.interact();
      if (r && r.select) { this.selected = r.select; this.ui.audio.sfx('seat'); }
      this.handle(g.drain());
    }

    blur() { this.game.setMove(0, 0); }

    cursor() { return this.phase === 'play' && !!this.hover; }

    draw(ctx) {
      const ui = this.ui, g = this.game, t = ui.t;
      this.trackFates();
      if (this.phase === 'play' && !ui.modal) this.hover = this.targetAtMouse();
      ctx.drawImage(this.bg.c, 0, 0, W, H);
      S.drawStations(ctx, g, t);
      this.drawEntities(ctx, t);
      this.drawOverlays(ctx, t);
      this.drawFx(ctx, t);
      this.drawHudTop(ctx, t);
      this.drawHudBottom(ctx, t);
      if (g.modal && this.phase === 'play') this.drawDialog(ctx, g.modal.text, g.modal.kind === 'tut' ? (g.modal.step.arrow || null) : g.modal.arrow, true);
      else if (this.phase === 'play' && g.tut) { const s = g.tutStep(); if (s) this.drawDialog(ctx, TEXT.tut[s.id], s.arrow, false); }
      if (this.flash > 0) { ctx.fillStyle = 'rgba(200,30,20,' + (this.flash * 0.4).toFixed(3) + ')'; ctx.fillRect(0, P.HUD_TOP, W, P.HUD_BOTTOM - P.HUD_TOP); }
      if (this.phase === 'intro') this.drawIntro(ctx, t);
      if (this.phase === 'done') this.drawDone(ctx, t);
    }

    selectedGroup() {
      if (this.selected === null) return null;
      return this.game.groups.find(x => x.id === this.selected && this.game.queue.includes(x)) || null;
    }

    drawEntities(ctx, t) {
      const g = this.game;
      const sel = this.selectedGroup();
      const ents = [];
      for (const tb of g.tables) {
        const fit = sel ? (!tb.group && !tb.dirty && tb.cap >= sel.size) : undefined;
        ents.push({ y: tb.y + (tb.kind === 'small' ? 12 : 6), d: () => S.drawTable(ctx, tb, g, fit) });
      }
      for (const grp of g.groups) for (const m of grp.members) ents.push({ y: m.y, d: () => this.drawGuest(ctx, m, grp, t) });
      ents.push({ y: g.hero.y + 0.5, d: () => this.drawHero(ctx, t) });
      ents.sort((a, b) => a.y - b.y);
      for (const e of ents) e.d();
    }

    blinking(t, seed) { return ((t + (seed % 997) / 131) % (3.4 + (seed % 7) * 0.25)) < 0.12; }

    drawGuest(ctx, m, grp, t) {
      const D = A.lookFor(m.look);
      let act = m.pose === 'walk' ? 'walk' : m.pose;
      let arm = null;
      let frame = act === 'walk' ? Math.floor(m.walkT * 8) % 4 : 0;
      let expr = 'ok';
      if (grp.state === 'angry' || grp.mood === 'angry') expr = 'angry';
      else if (grp.mood === 'impatient') expr = 'impatient';
      else if (grp.state === 'leave') expr = 'happy';
      const settled = m.seat && m.path.length === 0;
      if (settled) {
        if (grp.state === 'eat') { arm = (m.i + Math.floor(t * 0.5)) % 3 === 2 ? 'drink' : 'eat'; frame = Math.floor(t * 3 + m.i) % 2; expr = arm === 'eat' && frame ? 'eat' : 'happy'; }
        else if (grp.state === 'waitOrder' && m.i === 0) { arm = 'raise'; frame = Math.floor(t * 2.5) % 2; }
        else if (grp.type === 'business' && m.i === 0) arm = 'phone';
      } else if (!m.path.length && grp.type === 'business' && (grp.state === 'queue' || grp.state === 'arrive') && m.i === 0) arm = 'phone';
      if (expr === 'ok' && this.blinking(t, m.look.seed)) expr = 'blink';
      if (!m.seat || m.path.length) A.shadow(ctx, m.x, m.y, 11 * D.scale, 3.8 * D.scale);
      if (grp.vip) {
        ctx.fillStyle = 'rgba(255,215,80,' + (0.25 + Math.sin(t * 4) * 0.1).toFixed(3) + ')';
        ctx.beginPath(); ctx.ellipse(m.x, m.y - 32, 22, 40, 0, 0, TAU); ctx.fill();
      }
      A.drawChar(ctx, D, { dir: m.dir, act, arm, frame, expr, s: CS }, m.x, m.y);
      if (m.i === 0 && grp.state !== 'leave') {
        const head = m.y - (m.pose === 'sit' ? 58 : m.pose === 'sitx' ? 50 : 66) * D.scale;
        if (grp.state === 'angry' || grp.mood === 'angry') { const k = 1 + Math.abs(Math.sin(t * 7)) * 0.25; I.glyph(ctx, 'anger', m.x + 12, head, 13 * k); }
        else if (grp.mood === 'impatient') I.glyph(ctx, 'sweat', m.x + 12, head + 3 + Math.sin(t * 5) * 1.5, 12);
      }
    }

    drawHero(ctx, t) {
      const g = this.game, h = g.hero;
      const D = A.HAYATO;
      let act = h.moving ? 'walk' : 'stand';
      let arm = null;
      let frame = h.moving ? Math.floor(h.walkT * 9) % 4 : 0;
      const carrying = h.hands[0] || h.hands[1];
      if (h.busy) { arm = 'work'; frame = Math.floor(t * 8) % 2; }
      else if (carrying) arm = 'carry';
      A.shadow(ctx, h.x, h.y, 14, 4.4, 0.28);
      const items = h.hands.filter(Boolean);
      const dir = h.dir;
      const behind = dir === 'up';
      const drawHeld = () => {
        items.forEach((it, i) => {
          let ix, iy;
          if (dir === 'down') { ix = h.x + (items.length > 1 ? (i ? 10 : -10) : 0); iy = h.y - 24; }
          else if (dir === 'up') { ix = h.x + (items.length > 1 ? (i ? 14 : -14) : 0); iy = h.y - 22; }
          else { const s = dir === 'right' ? 1 : -1; ix = h.x + s * (18 - i * 7); iy = h.y - 27 - i * 7; }
          I.foodAt(ctx, it, ix, iy, HELD_PX[it] || 20);
        });
      };
      if (behind && !h.busy) drawHeld();
      let expr = h.busy && h.busy.anim === 'pay' ? 'happy' : 'ok';
      if (expr === 'ok' && this.blinking(t, 4242)) expr = 'blink';
      A.drawChar(ctx, D, { dir, act, arm, frame, expr, s: CS }, h.x, h.y);
      if (!behind && !h.busy) drawHeld();
      if (h.busy) this.drawProp(ctx, h, t);
      if (h.busy && h.busy.dur > 0.55) {
        const k = P.clamp(h.busy.t / h.busy.dur, 0, 1);
        const bx = h.x - 24, by = h.y - 112, bw = 50;
        A.rrect(ctx, bx, by, bw, 12, 6, 'rgba(34,18,8,0.9)', '#f4dca0', 1);
        A.rrect(ctx, bx + 15, by + 3, (bw - 19) * k, 6, 3, '#7ad04a', null);
        const ic = this.actIcon(h.busy);
        A.ell(ctx, bx + 5, by + 6, 9, 9, '#fff4d8', '#241006', 1.1);
        if (ic) this.iconFor(ctx, ic, bx + 5, by + 6, 14);
      }
    }

    actIcon(b) {
      if (b.anim === 'clean') return ['g', this.game.tab[b.id] ? 'cloth' : 'broom'];
      if (b.anim === 'pour') { const s = this.game.st[b.id]; return ['f', s && s.item ? s.item : 'teaGreen']; }
      if (ACT_ICON[b.anim]) return ['g', ACT_ICON[b.anim]];
      return null;
    }

    iconFor(ctx, ic, x, y, px) {
      if (ic[0] === 'f') I.food(ctx, ic[1], x, y, px); else I.glyph(ctx, ic[1], x, y, px);
    }

    drawProp(ctx, h, t) {
      const b = h.busy, a = b.anim;
      const k = P.clamp(b.t / b.dur, 0, 1);
      const side = h.dir === 'left' ? -1 : 1;
      const x = h.x, y = h.y;
      if (a === 'chop') I.glyph(ctx, 'knife', x + 11 * side, y - 44 + (Math.floor(t * 8) % 2 ? -5 : 1.5), 17);
      else if (a === 'stir') I.glyph(ctx, 'kapkir', x + 9 + Math.cos(t * 7) * 3.4, y - 50 + Math.sin(t * 7) * 2, 22);
      else if (a === 'order') I.glyph(ctx, 'notepad', x - 13 * side, y - 44 + Math.sin(t * 9) * 1.2, 16);
      else if (a === 'clean') {
        if (this.game.tab[b.id]) I.glyph(ctx, 'cloth', x + Math.sin(t * 11) * 9, y - 38, 15);
        else I.glyph(ctx, 'broom', x + 10 + Math.sin(t * 12) * 4, y - 42, 18);
      } else if (a === 'pay') { I.glyph(ctx, 'coins', x + 12 * side, y - 44 - k * 6, 15); if (Math.floor(t * 6) % 2) I.glyph(ctx, 'sparkle', x + 18 * side, y - 54, 9); }
      else if (a === 'bake') I.glyph(ctx, 'dough', x + 8, y - 42 - k * 10, 14);
      else if (a === 'pour') { const s = this.game.st[b.id]; if (s && s.kind === 'tea') I.food(ctx, s.item, x + 10, y - 44, 16); }
    }

    targetAnchor(id) {
      const g = this.game;
      if (g.st[id]) { const s = g.st[id]; return { x: s.use.x, y: s.rect.y + 30 }; }
      if (g.tab[id]) { const tb = g.tab[id]; return { x: tb.x + (tb.kind === 'small' ? 34 : 64), y: tb.y + 20 }; }
      if (/^g\d+$/.test(id)) { const grp = g.groups.find(x => x.id === +id.slice(1)); if (grp) return { x: grp.members[0].x + 14, y: grp.members[0].y - 60 }; }
      if (/^floor:/.test(id)) { const [x, y] = id.slice(6).split(',').map(Number); return { x, y }; }
      return null;
    }

    seatOk(tb) {
      const grp = this.selectedGroup();
      return !!(grp && tb && !tb.group && !tb.dirty && tb.cap >= grp.size);
    }

    drawOverlays(ctx, t) {
      const g = this.game, ui = this.ui;
      const hv = this.hover;
      this.cards = [];
      this.heroBox = { x: g.hero.x - 11, y: g.hero.y - 84, w: 22, h: 70 };
      if (hv && this.phase === 'play' && !g.modal && hv.kind !== 'queue') {
        let col = '#ffd23a';
        if (hv.kind === 'table' && this.selected !== null) col = this.seatOk(g.tab[hv.id]) ? '#6ae05a' : '#ff5a3a';
        brackets(ctx, hv.rect, col, t);
      }
      const sel = this.selectedGroup();
      if (this.selected !== null && !sel) this.selected = null;
      if (sel) {
        const r = this.groupRect(sel);
        A.rrect(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 8, 'rgba(255,210,58,0.12)', null);
        brackets(ctx, r, '#ffd23a', t);
        if (ui.mx > 0 && this.phase === 'play') {
          ctx.strokeStyle = 'rgba(20,8,0,0.5)'; ctx.lineWidth = 4; ctx.setLineDash([6, 5]);
          ctx.beginPath(); ctx.moveTo(r.x + r.w / 2, r.y + 10); ctx.lineTo(ui.mx, ui.my); ctx.stroke();
          ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
          A.ell(ctx, ui.mx, ui.my, 9, 9, '#ffd23a', '#241006', 1.2);
          label(ctx, '×' + sel.size, ui.mx, ui.my + 0.5, { size: 9, color: '#241006' });
        }
      }
      const focusId = this.phase === 'play' && !g.hero.busy ? g.focus() : null;
      if (focusId && (ui.keys.size || this.usedKeys)) {
        const a = this.targetAnchor(focusId[0] === 'q' ? null : focusId);
        if (a) { A.poly(ctx, [[a.x - 6, a.y - 12 + Math.sin(t * 6) * 2], [a.x + 6, a.y - 12 + Math.sin(t * 6) * 2], [a.x, a.y - 4 + Math.sin(t * 6) * 2]], '#ffd23a', '#241006', 1.2); }
      }
      for (const tb of g.tables) {
        if (!tb.dirty || tb.group) continue;
        const x = tb.bubble.x, y = tb.bubble.y + 10;
        S.bubble(ctx, x, y, 30, 26, 'rgba(255,250,240,0.9)', 'rgba(59,36,23,0.8)');
        I.glyph(ctx, 'cloth', x, y - 13, 21);
      }
      for (const grp of g.groups) this.drawGroupUi(ctx, grp, t);
      const h = g.hero;
      const q = [];
      if (h.cur) q.push(h.cur.id);
      for (const e of h.queue) q.push(e.id);
      const seen = {};
      q.forEach((id, i) => {
        const a = this.targetAnchor(id);
        if (!a) return;
        const k = seen[id] || 0;
        seen[id] = k + 1;
        if (/^floor:/.test(id)) { A.ell(ctx, a.x, a.y, 7, 2.8, null, '#241006', 3); A.ell(ctx, a.x, a.y, 7, 2.8, null, '#ffd23a', 1.6); return; }
        badge(ctx, a.x + k * 13, a.y - 2, String(i + 1), i === 0 && h.cur ? '#7ad04a' : '#ffd23a');
      });
    }

    card(ctx, spec, t) {
      const items = spec.items;
      const n = items.length;
      const slot = 27;
      const w = Math.max(spec.minW || 58, n * slot + 10);
      const h = 44;
      const low = spec.patience !== undefined && spec.patience <= 1.6;
      const blink = low && Math.floor(t * 4) % 2 === 0;
      let left, top;
      if (spec.side === 'left') { left = spec.x + 9; top = spec.y - h / 2; }
      else { left = P.clamp(spec.x - w / 2, 4, W - w - 4); top = spec.y - h; }
      const border = low ? (blink ? '#ff3a1a' : '#8a1a10') : spec.border || '#3b2417';
      const hb = this.heroBox;
      const covers = hb && left < hb.x + hb.w && left + w > hb.x && top < hb.y + hb.h && top + h > hb.y;
      ctx.save();
      if (covers) ctx.globalAlpha = 0.5;
      A.rrect(ctx, left + 1.5, top + 2.5, w, h, 7, 'rgba(20,8,0,0.35)', null);
      if (spec.side === 'left') A.poly(ctx, [[left + 1, top + h / 2 - 6], [left - 8, top + h / 2], [left + 1, top + h / 2 + 6]], '#fffaf0', border, low ? 2 : 1.3);
      else A.poly(ctx, [[spec.x - 6, top + h - 1], [spec.x, top + h + 7], [spec.x + 6, top + h - 1]], '#fffaf0', border, low ? 2 : 1.3);
      A.rrect(ctx, left, top, w, h, 7, spec.fill || '#fffaf0', border, low ? 2 : 1.3);
      if (spec.side === 'left') { ctx.fillStyle = spec.fill || '#fffaf0'; ctx.fillRect(left - 0.6, top + h / 2 - 5, 3, 10); }
      else { ctx.fillStyle = spec.fill || '#fffaf0'; ctx.fillRect(spec.x - 5, top + h - 3, 10, 3.2); }
      if (spec.patience !== undefined) {
        A.rrect(ctx, left + 3, top + h - 15, w - 6, 12, 5, low ? '#6a140c' : '#3b2417', null);
        hearts(ctx, left + w / 2, top + h - 9, spec.patience, 3.7);
      }
      if (spec.fast > 0) {
        A.rrect(ctx, left + 6, top + 2, (w - 12), 2.4, 1.2, 'rgba(59,36,23,0.18)', null);
        A.rrect(ctx, left + 6, top + 2, (w - 12) * spec.fast, 2.4, 1.2, '#f0b030', null);
      }
      items.forEach((it, i) => {
        const cx = left + w / 2 + (i - (n - 1) / 2) * slot, cy = top + 16;
        if (it.match) {
          const p = 0.55 + Math.sin(t * 8) * 0.3;
          A.ell(ctx, cx, cy, 13, 12, 'rgba(255,210,58,' + p.toFixed(3) + ')', null);
        }
        if (it.saucer !== false) A.ell(ctx, cx, cy + 1, 11.5, 10.5, it.match ? '#ffe9a0' : '#f3e7cc', it.match ? '#c8901a' : 'rgba(59,36,23,0.25)', 1);
        const base = ctx.globalAlpha;
        ctx.globalAlpha = base * (it.done ? 0.35 : 1);
        it.draw(ctx, cx, cy);
        ctx.globalAlpha = base;
        if (it.done) I.glyph(ctx, 'check', cx + 7, cy + 6, 13);
      });
      if (spec.tag) {
        ctx.font = 'bold 9px ' + FONT;
        const tw = ctx.measureText(spec.tag).width + 10;
        A.rrect(ctx, left - 4, top - 7, tw, 13, 4, '#c8432a', '#241006', 1);
        label(ctx, spec.tag, left - 4 + tw / 2, top - 0.5, { size: 9, color: '#fff4d8' });
      }
      if (spec.corner) spec.corner(ctx, left + w - 2, top + 2);
      ctx.restore();
      return { x: left - (spec.side === 'left' ? 9 : 0), y: top, w: w + (spec.side === 'left' ? 9 : 0), h: h + 7 };
    }

    drawGroupUi(ctx, grp, t) {
      const g = this.game;
      if (grp.state === 'turned' || grp.state === 'leave' || grp.state === 'angry') { this.drawLine(ctx, grp); return; }
      const st = grp.state;
      const xs = grp.members.map(m => m.x), ys = grp.members.map(m => m.y);
      if (st === 'queue' || st === 'arrive') {
        const ax = Math.max(...xs) + 14, ay = (Math.min(...ys) + Math.max(...ys)) / 2 - 36;
        const corner = grp.vip ? (c, x, y) => I.glyph(c, 'star', x, y, 17) : grp.type === 'business' ? (c, x, y) => I.glyph(c, 'briefcase', x, y + 1, 16) : null;
        const rect = this.card(ctx, {
          side: 'left', x: ax, y: ay, patience: grp.patience, minW: 58, corner,
          border: this.selected === grp.id ? '#e8a010' : null,
          fill: this.selected === grp.id ? '#fff2c0' : null,
          items: [{ saucer: false, draw: (c, x, y) => { I.glyph(c, 'guests', x - 10, y + 1, 21); label(c, '×' + grp.size, x + 10, y + 1.5, { size: 14, color: '#3b2417', font: 'bold 14px ' + FONT }); } }]
        }, t);
        if (g.queue.includes(grp)) this.cards.push({ group: grp, rect });
        this.drawLine(ctx, grp, ax + 30, ay - 22);
        return;
      }
      let ax, ay;
      if (grp.table) { ax = grp.table.bubble.x; ay = grp.table.bubble.y + 8; }
      else { ax = Math.max(44, (Math.min(...xs) + Math.max(...xs)) / 2); ay = Math.min(...ys) - 72; }
      if (st === 'toTable' || st === 'toTake') return;
      if (st === 'menu') {
        S.bubble(ctx, ax, ay, 32, 20, '#fffaf0');
        for (let i = 0; i < 3; i++) A.ell(ctx, ax - 8 + i * 8, ay - 10 - (Math.floor(t * 3) % 3 === i ? 2 : 0), 2, 2, '#6a4a2a', null);
        return;
      }
      if (st === 'eat') {
        S.progressRing(ctx, ax, ay - 8, 7.5, grp.t / grp.eatTime, '#f0b030');
        return;
      }
      if (st === 'waitOrder') {
        const bob = Math.sin(t * 5 + grp.id) * 1.4;
        this.card(ctx, { x: ax, y: ay, patience: grp.patience, items: [{ saucer: false, draw: (c, x, y) => I.glyph(c, 'hand', x, y + bob, 25) }], fill: '#fff6d0' }, t);
        this.drawLine(ctx, grp, ax, ay - 48);
        return;
      }
      if (st === 'waitFood') {
        const need = grp.order.need.slice();
        const held = g.hero.hands.filter(Boolean);
        const items = grp.order.items.map(it => {
          const k = need.indexOf(it);
          const done = k < 0;
          if (!done) need.splice(k, 1);
          const hk = done ? -1 : held.indexOf(it);
          if (hk >= 0) held.splice(hk, 1);
          return { done, match: hk >= 0, draw: (c, x, y) => I.food(c, it, x, y, 23) };
        });
        const total = TUNE.fastBase + TUNE.fastItem * grp.order.items.length;
        const fast = (grp.fastUntil - g.t) / total;
        this.card(ctx, { x: ax, y: ay, patience: grp.patience, items, fast, tag: grp.round > 1 ? 'ещё' : null, fill: grp.courier ? '#fff0f0' : null }, t);
        this.drawLine(ctx, grp, ax, ay - 50);
        return;
      }
      if (st === 'waitPay') {
        const bob = Math.sin(t * 5 + grp.id) * 1.2;
        this.card(ctx, { x: ax, y: ay, patience: grp.patience, items: [{ saucer: false, draw: (c, x, y) => I.glyph(c, 'coins', x, y + bob, 25) }], fill: '#eefbe4', border: '#2a6a2a' }, t);
        this.drawLine(ctx, grp, ax, ay - 48);
      }
    }

    drawLine(ctx, grp, x, y) {
      if (!grp.line || grp.lineT <= 0) return;
      let ax = x, ay = y;
      if (ax === undefined) { const m = grp.members[0]; ax = m.x; ay = m.y - 70; }
      ctx.font = 'bold 11px ' + FONT;
      const tw = ctx.measureText(grp.line).width;
      const a = Math.min(1, grp.lineT * 2);
      ctx.globalAlpha = a;
      const bx = P.clamp(ax, tw / 2 + 12, W - tw / 2 - 12);
      const angry = grp.mood === 'angry' || grp.state === 'angry';
      A.rrect(ctx, bx - tw / 2 - 7, ay - 22, tw + 14, 18, 8, angry ? '#ffe2da' : '#ffffff', '#3b2417', 1.2);
      label(ctx, grp.line, bx, ay - 12.5, { size: 11, color: grp.state === 'angry' ? '#a8201a' : '#3b2417' });
      ctx.globalAlpha = 1;
    }

    drawFx(ctx, t) {
      for (const f of this.fx) {
        const k = f.t / f.life;
        ctx.globalAlpha = 1 - k;
        if (f.kind === 'heart') A.heart(ctx, f.x, f.y, 4 + k * 2, '#e8384a', 1);
        else { ctx.fillStyle = 'rgba(120,120,130,0.8)'; ctx.beginPath(); ctx.ellipse(f.x, f.y, 5 + k * 8, 4 + k * 6, 0, 0, TAU); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
      for (const c of this.coins) { if (c.t >= 0) I.glyph(ctx, 'coin', c.x, c.y, 12); }
      for (const p of this.pops) {
        if (p.t < 0) continue;
        const k = p.t / 1.6;
        const y = p.y - 26 * P.easeOutQuad(Math.min(1, p.t / 0.8));
        const sc = p.big ? 1 + Math.max(0, 0.3 - p.t) * 1.5 : 1;
        ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
        const col = { gold: '#ffd23a', red: '#ff5a4a', green: '#8af06a', grey: '#e8e2d4', nope: '#ffb0a0', combo: '#8ae0ff', white: '#ffffff' }[p.col] || '#fff';
        ctx.save(); ctx.translate(p.x, y); ctx.scale(sc, sc);
        label(ctx, p.text, 0, 0, { size: p.big ? 16 : 12, color: col, outline: '#2a1208', ow: 3.5 });
        if (p.coin) { ctx.font = 'bold 16px ' + FONT; const tw = ctx.measureText(p.text).width; I.glyph(ctx, 'coin', -tw / 2 - 10, 0, 15); }
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }

    drawHudTop(ctx, t) {
      const g = this.game, L = this.level;
      const hudTop = P.memoCanvas('hudTop2', W, P.HUD_TOP, cx => {
        const top = cx.createLinearGradient(0, 0, 0, P.HUD_TOP);
        top.addColorStop(0, '#6e3e20'); top.addColorStop(1, '#3a1e0c');
        cx.fillStyle = top; cx.fillRect(0, 0, W, P.HUD_TOP);
        const r = P.rng(17);
        cx.strokeStyle = 'rgba(20,8,0,0.3)'; cx.lineWidth = 1;
        for (let i = 0; i < 14; i++) { const y = r() * 36; cx.beginPath(); cx.moveTo(0, y); cx.bezierCurveTo(W * 0.3, y + (r() - 0.5) * 6, W * 0.7, y + (r() - 0.5) * 6, W, y + (r() - 0.5) * 4); cx.stroke(); }
        cx.fillStyle = 'rgba(255,220,170,0.25)'; cx.fillRect(0, 0, W, 1);
        O.girih(cx, 0, P.HUD_TOP - 5, W, 5, 3, ['#1f5fa8', '#2aa0a8', '#f4e6c8', '#c8643c', '#123a6a']);
      });
      ctx.drawImage(hudTop.c, 0, 0, W, P.HUD_TOP);
      plaque(ctx, 6, 5, 178, 31);
      A.ell(ctx, 12.5, 20.5, 1.7, 1.7, '#d8b060', '#5a3a14', 0.6);
      A.ell(ctx, 177.5, 20.5, 1.7, 1.7, '#d8b060', '#5a3a14', 0.6);
      const dayText = 'День ' + L.n;
      label(ctx, dayText, 19, 21, { align: 'left', font: 'bold 16px ' + SERIF, color: '#7a2410' });
      ctx.font = 'bold 16px ' + SERIF;
      const dw = ctx.measureText(dayText).width;
      label(ctx, L.title, 19 + dw + 7, 21.5, { align: 'left', font: fitFont(ctx, L.title, 170 - dw - 22, 11, FONT, true), color: '#3b2417' });
      this.drawMoney(ctx, t);
      this.drawGuestsBox(ctx, t);
      this.drawSeries(ctx, t);
      this.ui.btn([712, 6, 82, 30], 'Пауза', () => this.pause(), { color: '#8a5a2a', size: 13 });
    }

    drawMoney(ctx, t) {
      const L = this.level, g = this.game;
      well(ctx, 190, 5, 290, 32);
      const shown = this.shownMoney;
      I.glyph(ctx, 'coin', MONEY_AT.x, MONEY_AT.y, 19);
      const txt = P.money(shown);
      label(ctx, txt, 220, 16, { align: 'left', font: 'bold 17px ' + FONT, color: shown < 0 ? '#ff8a7a' : '#ffe08a', outline: '#120602', ow: 3 });
      ctx.font = 'bold 17px ' + FONT;
      const mw = ctx.measureText(txt).width;
      label(ctx, 'сум', 224 + mw, 17, { align: 'left', font: 'bold 10px ' + FONT, color: '#c8a070' });
      const mid = g.result ? g.result.mid : Math.round((L.target + L.expert) / 2 / 10) * 10;
      const marks = [[L.target, 1], [mid, 2], [L.expert, 3]];
      const next = marks.find(m => g.money < m[0]);
      const rx = 472;
      if (next) {
        ctx.font = 'bold 11px ' + FONT;
        const nt = P.money(next[0]);
        const nw = ctx.measureText(nt).width;
        label(ctx, nt, rx, 15, { align: 'right', font: 'bold 11px ' + FONT, color: '#f4e6c8' });
        for (let i = 0; i < next[1]; i++) A.star(ctx, rx - nw - 7 - i * 8, 14.5, 4, '#ffd23a', '#241006');
        label(ctx, next[1] === 1 ? 'цель' : 'дальше', rx - nw - 13 - (next[1] - 1) * 8, 15, { align: 'right', font: '10px ' + FONT, color: '#c8a070' });
      } else {
        for (let i = 0; i < 3; i++) A.star(ctx, rx - 38 + i * 9, 14.5, 4.4, '#ffd23a', '#241006');
        label(ctx, 'мастер', rx - 44, 15, { align: 'right', font: 'bold 10px ' + FONT, color: '#ffe08a' });
      }
      const bx = 200, bw = 270, by = 27;
      const max = L.expert * 1.05;
      A.rrect(ctx, bx, by, bw, 7, 3.5, '#120804', '#5a3418', 1);
      const frac = P.clamp(shown / max, 0, 1);
      const gold = shown >= L.target;
      if (frac > 0) {
        const fg = ctx.createLinearGradient(0, by, 0, by + 7);
        fg.addColorStop(0, gold ? '#fff09a' : '#b8f07a'); fg.addColorStop(1, gold ? '#e8a818' : '#4aa02a');
        A.rrect(ctx, bx + 1, by + 1, Math.max(5, (bw - 2) * frac), 5, 2.5, fg, null);
      }
      for (const [v, n] of marks) {
        const x = bx + bw * v / max;
        const on = shown >= v;
        ctx.fillStyle = on ? '#ffe08a' : '#a08868'; ctx.fillRect(x - 0.75, by - 1, 1.5, 9);
        for (let i = 0; i < n; i++) A.star(ctx, x - (n - 1) * 3.6 + i * 7.2, by + 3.5, 4.3, on ? '#ffd23a' : '#b09a74', '#120602');
      }
    }

    drawGuestsBox(ctx, t) {
      const g = this.game;
      well(ctx, 486, 5, 132, 32);
      I.glyph(ctx, 'guests', 499, 15, 19);
      const done = g.stats.served + g.stats.lost;
      const total = g.schedule.length;
      label(ctx, done + ' / ' + total, 512, 15.5, { align: 'left', font: 'bold 13px ' + FONT, color: '#f4e6c8' });
      if (g.stats.lost) label(ctx, 'ушли ' + g.stats.lost, 610, 15.5, { align: 'right', font: 'bold 10px ' + FONT, color: '#ff9a8a' });
      const step = Math.min(8.4, 118 / Math.max(1, total));
      for (let i = 0; i < total; i++) {
        const x = 494 + i * step, y = 29.5, id = i + 1;
        const f = this.fate[id];
        if (f === 'ok') A.ell(ctx, x, y, 3, 3, '#7ad04a', '#0e0602', 0.8);
        else if (f === 'lost') A.ell(ctx, x, y, 3, 3, '#e8402a', '#0e0602', 0.8);
        else if (i < g.spawnIdx) A.ell(ctx, x, y, 3, 3, '#3a2210', '#ffd23a', 1.1);
        else A.ell(ctx, x, y, 2.6, 2.6, '#3a2210', 'rgba(244,220,160,0.35)', 0.8);
      }
    }

    drawSeries(ctx, t) {
      const g = this.game;
      well(ctx, 624, 5, 82, 32);
      const combo = g.combo.n;
      const left = g.comboLeft();
      const on = combo >= 2 && left > 0;
      ctx.globalAlpha = on ? 1 : 0.5;
      I.glyph(ctx, 'doira', 643, 21, 22);
      ctx.globalAlpha = 1;
      if (left > 0 && combo >= 1) {
        ctx.lineCap = 'butt';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(643, 21, 13.5, 0, TAU); ctx.stroke();
        ctx.strokeStyle = on ? '#8ae0ff' : '#c8a070'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(643, 21, 13.5, -Math.PI / 2, -Math.PI / 2 + TAU * left); ctx.stroke();
        ctx.lineCap = 'round';
      }
      label(ctx, 'серия', 682, 12.5, { font: '9px ' + FONT, color: '#c8a070' });
      label(ctx, on ? '×' + combo : '×1', 682, 26, { font: 'bold 15px ' + FONT, color: on ? '#8ae0ff' : '#a89070', outline: '#120602', ow: 3 });
    }

    drawHudBottom(ctx, t) {
      const g = this.game;
      const hudBot = P.memoCanvas('hudBottom2', W, H - P.HUD_BOTTOM, cx => {
        const bot = cx.createLinearGradient(0, 0, 0, H - P.HUD_BOTTOM);
        bot.addColorStop(0, '#5e321a'); bot.addColorStop(1, '#2e160a');
        cx.fillStyle = bot; cx.fillRect(0, 0, W, H - P.HUD_BOTTOM);
        const r = P.rng(23);
        cx.strokeStyle = 'rgba(20,8,0,0.3)'; cx.lineWidth = 1;
        for (let i = 0; i < 12; i++) { const y = 6 + r() * 52; cx.beginPath(); cx.moveTo(0, y); cx.bezierCurveTo(W * 0.3, y + (r() - 0.5) * 6, W * 0.7, y + (r() - 0.5) * 6, W, y + (r() - 0.5) * 4); cx.stroke(); }
        O.girih(cx, 0, 0, W, 5, 4, ['#1f5fa8', '#2aa0a8', '#f4e6c8', '#c8643c', '#123a6a']);
      });
      ctx.drawImage(hudBot.c, 0, P.HUD_BOTTOM, W, H - P.HUD_BOTTOM);
      for (let i = 0; i < 2; i++) {
        const x = 8 + i * 50, y = 547;
        const it = g.hero.hands[i];
        well(ctx, x, y, 46, 48, { fill: it ? '#3a2412' : '#26140a' });
        if (it) {
          I.food(ctx, it, x + 23, y + 18, 30);
          label(ctx, ITEMS[it].short, x + 23, y + 41, { font: fitFont(ctx, ITEMS[it].short, 42, 9, FONT, true), color: '#f4e6c8' });
        } else {
          ctx.globalAlpha = 0.2; I.glyph(ctx, 'hand', x + 23, y + 22, 24); ctx.globalAlpha = 1;
        }
      }
      let hint = null;
      if (this.phase === 'play') {
        if (this.nopeT > 0) hint = { text: this.nopeText, col: '#ffb0a0' };
        else if (this.selected !== null) hint = { key: '1–6', text: 'Куда посадить? Щёлкните по столу или нажмите его номер' };
        else if (this.hover && this.hover.kind !== 'queue') hint = { key: 'ЛКМ', text: g.describe(this.hover.id) || '' };
        else if (this.hover && this.hover.kind === 'queue') hint = { key: 'ЛКМ', text: 'Выбрать гостей, затем стол' };
        else {
          const f = g.focus();
          if (f && f[0] !== 'q') hint = { key: 'Пробел', text: g.describe(f) || '' };
          else if (f) hint = { key: 'Пробел', text: 'Выбрать гостей у ворот' };
        }
      }
      if (hint && hint.text) keyLine(ctx, [[hint.key || null, hint.text]], 384, 563, { size: 10, textSize: 13, bold: true, color: hint.col || '#fff4d8', outline: '#1a0a02', ow: 3 });
      keyLine(ctx, [['ЛКМ', 'действие'], ['ПКМ', 'отмена'], ['WASD', 'ходить'], ['Пробел', 'рядом'], ['Tab', 'гости'], ['1–6', 'стол'], ['Esc', 'пауза']], 384, 586, { size: 9, textSize: 10, gap: 9, color: 'rgba(240,220,180,0.85)' });
      this.drawJobs(ctx, t);
    }

    drawJobs(ctx, t) {
      const g = this.game, h = g.hero;
      const q = [];
      if (h.cur) q.push(h.cur.id);
      for (const e of h.queue) q.push(e.id);
      for (let i = 0; i < TUNE.queueMax; i++) {
        const x = 666 + i * 26, y = 549;
        const id = q[i];
        well(ctx, x, y, 24, 26, { r: 4, fill: id ? '#3a2412' : '#26140a' });
        if (!id) continue;
        this.jobIcon(ctx, id, x + 12, y + 13);
        const cur = i === 0 && h.cur;
        A.ell(ctx, x + 20, y + 3, 5, 5, cur ? '#7ad04a' : '#ffd23a', '#120602', 0.9);
        label(ctx, String(i + 1), x + 20, y + 3.4, { font: 'bold 8px ' + FONT, color: '#120602' });
      }
      label(ctx, 'Дела', 730, 587, { font: 'bold 10px ' + FONT, color: '#e8c890' });
    }

    jobIcon(ctx, id, x, y) {
      const g = this.game;
      if (/^floor:/.test(id)) { I.glyph(ctx, 'footprints', x, y, 18); return; }
      if (g.tab[id]) { I.glyph(ctx, 'table', x, y + 2, 20); label(ctx, String(g.tab[id].n), x, y - 4, { font: 'bold 9px ' + FONT, color: '#fff', outline: '#1f4f9f', ow: 3 }); return; }
      if (/^g\d+$/.test(id)) { I.glyph(ctx, 'flower', x, y, 18); return; }
      const s = g.st[id];
      if (!s) return;
      const ic = STATION_ICON[s.kind];
      if (ic) I.glyph(ctx, ic[1], x, y, 20);
      else I.food(ctx, s.item, x, y, 20);
    }

    drawDialog(ctx, text, arrow, modal) {
      const g = this.game, t = this.ui.t;
      if (!text) return;
      const ap = arrow ? g.arrowPos(arrow) : null;
      const topPos = ap && ap.y > 300;
      const x = 144, w = 512, h = 88;
      const y = topPos ? 62 : 434;
      if (modal) { ctx.fillStyle = 'rgba(20,10,5,0.25)'; ctx.fillRect(0, P.HUD_TOP, W, P.HUD_BOTTOM - P.HUD_TOP); }
      paper(ctx, x, y, w, h, { r: 8 });
      bust(ctx, mentor(), x + 12, y - 16, 74, 96, 'happy');
      plaque(ctx, x + 98, y - 10, 118, 20, { fill: '#c8432a', shadow: false });
      label(ctx, TEXT.mentor, x + 157, y + 0.5, { font: 'bold 12px ' + SERIF, color: '#fff4d8', outline: '#3a0a04', ow: 3 });
      ctx.font = '13px ' + FONT; ctx.fillStyle = '#2a1a0c'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      const lines = wrap(ctx, text, w - 116);
      lines.slice(0, 4).forEach((l, i) => ctx.fillText(l, x + 100, y + 27 + i * 15.5));
      if (modal) {
        this.ui.btn([x + w - 110, y + h - 13, 100, 26], 'Далее ▸', () => { g.ack(); }, { color: '#c8432a', size: 12 });
        keyLine(ctx, [['Пробел', null]], x + w - 144, y + h, { size: 9 });
      }
      if (ap) {
        const bob = Math.sin(t * 6) * 4;
        ctx.save(); ctx.translate(ap.x, ap.y - 8 + bob);
        A.poly(ctx, [[0, 0], [-11, -15], [-4.5, -15], [-4.5, -28], [4.5, -28], [4.5, -15], [11, -15]], '#ffd23a', '#241006', 1.8);
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-3, -26, 2, 10);
        ctx.restore();
      }
    }

    drawIntro(ctx, t) {
      const L = this.level, ui = this.ui, g = this.game;
      ctx.fillStyle = 'rgba(20,10,5,0.55)'; ctx.fillRect(0, 0, W, H);
      const x = 140, y = 64, w = 520, h = 462;
      const k = P.easeOutBack(Math.min(1, this.introT * 2.5));
      ctx.save(); ctx.translate(400, 295); ctx.scale(k, k); ctx.translate(-400, -295);
      paper(ctx, x, y, w, h, { r: 10 });
      ikatBorder(ctx, x, y, w, h, 100 + L.n, 10);
      label(ctx, 'День ' + L.n, 400, y + 42, { font: 'bold 30px ' + SERIF, color: '#8a2410' });
      label(ctx, L.title, 400, y + 72, { font: 'bold 20px ' + SERIF, color: '#3b2417' });
      ctx.font = 'italic 14px ' + SERIF; ctx.fillStyle = '#3b2417'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      const story = wrap(ctx, L.story, 440);
      story.slice(0, 4).forEach((l, i) => ctx.fillText(l, 400, y + 104 + i * 19));
      const by = y + 184;
      A.rrect(ctx, x + 28, by, w - 56, 124, 8, 'rgba(200,120,40,0.13)', '#b8703a', 1);
      plaque(ctx, 400 - 110, by - 11, 220, 22, { fill: '#c8432a', shadow: false });
      label(ctx, 'Новое: ' + L.news, 400, by + 0.5, { font: fitFont(ctx, 'Новое: ' + L.news, 206, 13, FONT, true), color: '#fff4d8', outline: '#3a0a04', ow: 3 });
      const items = this.introItems;
      if (items.length) {
        const step = Math.min(120, (w - 80) / items.length);
        items.forEach((it, i) => {
          const cx = 400 + (i - (items.length - 1) / 2) * step;
          A.ell(ctx, cx, by + 52, 34, 26, 'rgba(255,240,200,0.7)', null);
          I.food(ctx, it, cx, by + 52, 58);
          label(ctx, ITEMS[it].name, cx, by + 94, { font: 'bold 13px ' + FONT, color: '#3b2417' });
          label(ctx, P.money(ITEMS[it].price) + ' сум', cx, by + 111, { font: '12px ' + FONT, color: '#8a5a2a' });
        });
      } else {
        const show = { 7: ['teaGreen', 'samsa'], 8: ['business'], 9: ['critic'], 10: ['courier'] }[L.n] || [];
        show.forEach((it, i) => {
          const cx = 400 + (i - (show.length - 1) / 2) * 110;
          if (ITEMS[it]) { I.food(ctx, it, cx, by + 52, 54); label(ctx, ITEMS[it].name, cx, by + 94, { font: 'bold 13px ' + FONT, color: '#3b2417' }); return; }
          const D = A.lookFor({ type: it, seed: { business: 99, critic: 5, courier: 7 }[it], idx: 0 });
          const px = cx - 40;
          A.shadow(ctx, px, by + 110, 22, 5, 0.25);
          A.drawCharHD(ctx, D, { dir: 'down', act: 'stand', arm: it === 'business' ? 'phone' : null, frame: 0, expr: it === 'courier' ? 'happy' : 'ok' }, px, by + 110, 1.35);
          if (it === 'courier') I.food(ctx, 'plov', px + 40, by + 84, 40);
          label(ctx, P.TYPES[it].name, cx + 30, by + 52, { align: 'left', font: 'bold 15px ' + SERIF, color: '#8a2410' });
          ctx.font = '12px ' + FONT; ctx.fillStyle = '#3b2417'; ctx.textAlign = 'left';
          wrap(ctx, TEXT.guests[it], 190).slice(0, 3).forEach((l, j) => ctx.fillText(l, cx + 30, by + 72 + j * 15));
        });
      }
      const sy = by + 146;
      const groups = g.schedule.length;
      const stats = [['guests', groups + ' ' + P.plural(groups, 'компания', 'компании', 'компаний')], ['table', g.tables.length + ' ' + P.plural(g.tables.length, 'стол', 'стола', 'столов')]];
      let sx = x + 44;
      ctx.font = 'bold 13px ' + FONT;
      for (const [ic, text] of stats) {
        I.glyph(ctx, ic, sx + 9, sy, 20);
        label(ctx, text, sx + 22, sy + 0.5, { align: 'left', font: 'bold 13px ' + FONT, color: '#3b2417' });
        ctx.font = 'bold 13px ' + FONT;
        sx += 22 + ctx.measureText(text).width + 22;
      }
      label(ctx, 'Меню:', sx, sy + 0.5, { align: 'left', font: 'bold 13px ' + FONT, color: '#3b2417' });
      ctx.font = 'bold 13px ' + FONT;
      const mx0 = sx + ctx.measureText('Меню:').width + 14;
      L.items.forEach((it, i) => I.food(ctx, it, mx0 + i * 22, sy, 21));
      const gy = sy + 34;
      A.rrect(ctx, x + 40, gy - 14, w - 80, 28, 6, 'rgba(255,255,255,0.35)', 'rgba(184,112,58,0.6)', 1);
      A.star(ctx, x + 58, gy, 7, '#ffd23a', '#6a3a08');
      const goal = 'Цель дня: ' + P.money(L.target) + ' сум';
      label(ctx, goal, x + 70, gy + 0.5, { align: 'left', font: 'bold 14px ' + FONT, color: '#3b2417' });
      const master = 'Мастер: ' + P.money(L.expert);
      ctx.font = 'bold 14px ' + FONT;
      const mw = ctx.measureText(master).width;
      const mx = x + w - 52 - mw;
      label(ctx, master, mx, gy + 0.5, { align: 'left', font: 'bold 14px ' + FONT, color: '#3b2417' });
      for (let i = 0; i < 3; i++) A.star(ctx, mx - 36 + i * 11, gy, 5.5, '#ffd23a', '#6a3a08');
      if (this.rec.best > 0) label(ctx, 'Ваш рекорд: ' + P.money(this.rec.best) + ' сум', 400, gy + 26, { font: '12px ' + FONT, color: '#6a4a2a' });
      ctx.restore();
      if (k >= 0.99) {
        ui.btn([x + w - 250, y + h - 54, 220, 40], 'Открыть чайхану!', () => this.start(), { color: '#c8432a', size: 16, serif: true });
        ui.btn([x + 30, y + h - 54, 120, 40], 'Назад', () => ui.go('days', { sel: this.day }), { color: '#6a5a4a', size: 14 });
        keyLine(ctx, [['Enter', 'открыть чайхану'], ['Esc', 'назад']], 400, y + h + 18, { size: 9, textSize: 11, color: '#f4e6c8' });
      }
    }

    drawDone(ctx, t) {
      const g = this.game;
      const k = P.easeOutBack(Math.min(1, this.doneT * 2));
      ctx.fillStyle = 'rgba(20,10,5,' + (0.35 * Math.min(1, this.doneT * 2)).toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(400, 280); ctx.scale(k, k);
      const passed = g.result.passed;
      plaque(ctx, -210, -48, 420, 96, { fill: passed ? '#2a6ab0' : '#8a3a1a', r: 10 });
      ikatBorder(ctx, -204, -42, 408, 84, passed ? 311 : 313, 6);
      label(ctx, passed ? 'Чайхана закрыта!' : 'День не удался...', 0, -10, { font: 'bold 28px ' + SERIF, color: '#fff4d0', outline: '#2a1208', ow: 5 });
      I.glyph(ctx, 'coin', -78, 22, 18);
      label(ctx, 'Выручка: ' + P.money(g.money) + ' сум', 8, 22, { font: 'bold 15px ' + FONT, color: '#ffe8a0', outline: '#2a1208', ow: 3 });
      ctx.restore();
    }

    pauseModal() {
      const ui = this.ui;
      return {
        draw: (ctx) => {
          ctx.fillStyle = 'rgba(20,10,5,0.6)'; ctx.fillRect(0, 0, W, H);
          paper(ctx, 270, 146, 260, 312, { r: 10 });
          ikatBorder(ctx, 270, 146, 260, 312, 555, 8);
          label(ctx, 'Пауза', 400, 188, { font: 'bold 26px ' + SERIF, color: '#8a2410' });
          ui.btn([300, 220, 200, 38], 'Продолжить', () => this.resume(), { color: '#c8432a', serif: true });
          ui.btn([300, 268, 200, 38], 'Начать заново', () => { ui.closeModal(); ui.go('play', { day: this.day }); }, { color: '#2a6ab0' });
          ui.btn([300, 316, 200, 38], 'Настройки', () => ui.openModal(Object.assign(P.settingsModal(ui), { cancel: () => ui.openModal(this.pauseModal()) })), { color: '#2a6ab0' });
          ui.btn([300, 364, 200, 38], 'В дафтар', () => { ui.closeModal(); ui.go('days', { sel: this.day }); }, { color: '#6a5a4a' });
          keyLine(ctx, [['Esc', 'продолжить']], 400, 428, { size: 9, textSize: 11, color: '#6a4a2a' });
        },
        key: (e) => { if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { this.resume(); return true; } return false; },
        cancel: () => this.resume()
      };
    }
  }

  SCREENS.play = (ui, arg) => new PlayScreen(ui, arg);
  Object.assign(P, { PlayScreen, mentor, fitFont });
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(globalThis.Plov = globalThis.Plov || {});
