(function (K) {
  'use strict';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  K.esc = esc;
  const SAVE_KEY = 'kotor98_saves';

  const PORTRAIT_BG = { party: ['#1a3a4a', '#0a1a24'], hostile: ['#4a1a1a', '#200a0a'], neutral: ['#3a3a24', '#1a1a0a'] };

  function drawPortrait(cv, model, faction, dead) {
    const x = cv.getContext('2d');
    const w = cv.width, h = cv.height;
    const bg = PORTRAIT_BG[faction] || PORTRAIT_BG.party;
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const m = model || {};
    const skin = m.skin || '#c89070';
    x.save();
    x.translate(w / 2, h * 0.56);
    const s = w / 64;
    x.scale(s, s);
    const body = m.b === 'rakghoul' || m.b === 'wookiee' || m.b === 'rancor' ? skin : (m.top || '#606060');
    x.fillStyle = body;
    x.beginPath(); x.ellipse(0, 30, 26, 16, 0, Math.PI, 0); x.fill();
    if (m.vest) { x.fillStyle = m.vest; x.fillRect(-10, 16, 20, 14); }
    if (m.b === 'astromech') {
      x.fillStyle = '#b0b0b8'; x.beginPath(); x.arc(0, 0, 18, Math.PI, 0); x.fill();
      x.fillStyle = m.top || '#8a8a90'; x.fillRect(-18, 0, 36, 26);
      x.fillStyle = '#3080ff'; x.fillRect(-5, -8, 10, 6);
      x.fillStyle = m.trim || '#3060a0'; x.fillRect(-12, 6, 24, 6);
    } else if (m.b === 'droid') {
      x.fillStyle = m.top; x.fillRect(-11, -14, 22, 24);
      x.fillStyle = m.trim || '#ff2020'; x.fillRect(-8, -4, 16, 3);
    } else if (m.helm) {
      x.fillStyle = m.top; x.beginPath(); x.ellipse(0, -2, 15, 18, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = m.mask ? '#303030' : '#101014'; x.fillRect(-11, -6, 22, 7);
    } else if (m.b === 'hutt') {
      x.fillStyle = skin; x.beginPath(); x.ellipse(0, 4, 24, 20, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#e0a020'; x.fillRect(-11, -4, 6, 4); x.fillRect(5, -4, 6, 4);
      x.fillStyle = '#4a3020'; x.fillRect(-12, 8, 24, 3);
    } else {
      const big = m.b === 'gamorrean' || m.b === 'wookiee' || m.b === 'rancor' ? 1.2 : m.b === 'rodian' || m.b === 'duros' ? 1.1 : 1;
      if (m.b === 'twilek') { x.fillStyle = skin; x.beginPath(); x.ellipse(-9, 18, 5, 18, 0.2, 0, Math.PI * 2); x.fill(); x.beginPath(); x.ellipse(9, 18, 5, 18, -0.2, 0, Math.PI * 2); x.fill(); }
      if (m.fem && m.hair && m.b === 'human') { x.fillStyle = m.hair; x.beginPath(); x.ellipse(0, 2, 15, 20, 0, 0, Math.PI * 2); x.fill(); }
      x.fillStyle = skin;
      x.beginPath(); x.ellipse(0, -2, 12 * big, 15 * big, 0, 0, Math.PI * 2); x.fill();
      if (m.b === 'rodian') { x.fillStyle = '#101018'; x.beginPath(); x.ellipse(-6, -3, 5, 6, 0.3, 0, Math.PI * 2); x.fill(); x.beginPath(); x.ellipse(6, -3, 5, 6, -0.3, 0, Math.PI * 2); x.fill(); }
      else if (m.b === 'duros') { x.fillStyle = '#ff3020'; x.fillRect(-8, -4, 5, 3); x.fillRect(3, -4, 5, 3); }
      else if (m.b === 'rakghoul') { x.fillStyle = '#ffe040'; x.fillRect(-7, -5, 4, 3); x.fillRect(3, -5, 4, 3); x.fillStyle = '#4a4a3a'; x.fillRect(-6, 5, 12, 4); }
      else if (m.b === 'gamorrean') { x.fillStyle = '#8aa060'; x.fillRect(-6, 2, 12, 7); x.fillStyle = '#f0e8d0'; x.fillRect(-6, 8, 2, 4); x.fillRect(4, 8, 2, 4); x.fillStyle = '#101010'; x.fillRect(-6, -5, 3, 3); x.fillRect(3, -5, 3, 3); }
      else {
        x.fillStyle = '#1a1410'; x.fillRect(-6, -4, 3, 2); x.fillRect(3, -4, 3, 2);
        x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(-3, 6, 6, 1.5);
        if (m.b === 'wookiee') { x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(-5, 2, 10, 6); }
      }
      if (m.hair && m.b === 'human') { x.fillStyle = m.hair; x.beginPath(); x.ellipse(0, -11, 12.5, 7, 0, Math.PI, 0); x.fill(); x.fillRect(-12.5, -12, 3, 10); x.fillRect(9.5, -12, 3, 10); }
      if (m.beard) { x.fillStyle = m.beard; x.beginPath(); x.ellipse(0, 9, 9, 6, 0, 0, Math.PI); x.fill(); }
      if (m.cap) { x.fillStyle = m.cap; x.fillRect(-13, -17, 26, 7); }
      if (m.glasses) { x.fillStyle = '#202830'; x.fillRect(-9, -5, 18, 3); }
    }
    x.restore();
    if (dead) { x.fillStyle = 'rgba(80,0,0,0.55)'; x.fillRect(0, 0, w, h); }
  }
  K.drawPortrait = drawPortrait;

  class UI {
    constructor(root, opts) {
      this.root = root;
      this.opts = opts || {};
      root.classList.add('kt98');
      root.tabIndex = 0;
      root.innerHTML = '<canvas class="kt-gl"></canvas><canvas class="kt-ov"></canvas><div class="kt-hud"></div><div class="kt-layer"></div><div class="kt-toasts"></div>';
      this.gl = root.querySelector('.kt-gl');
      this.ov = root.querySelector('.kt-ov');
      this.ovx = this.ov.getContext('2d');
      this.hud = root.querySelector('.kt-hud');
      this.layer = root.querySelector('.kt-layer');
      this.toasts = root.querySelector('.kt-toasts');
      this.audio = new K.Audio();
      this.game = new K.Game({});
      this.settings = this.loadSettings();
      Object.assign(this.game.settings, this.settings.game || {});
      try { this.r = new K.Renderer(this.gl); }
      catch (e) { this.r = null; this.glError = e.message; }
      this.floats = [];
      this.keys = {};
      this.screen = null;
      this.panel = null;
      this.hover = null;
      this.selected = null;
      this.lastT = performance.now();
      this.hudT = 0;
      this.destroyed = false;
      this.bindInput();
      this.resize();
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(root);
      this.showTitle();
      this.frame = this.frame.bind(this);
      this.raf = requestAnimationFrame(this.frame);
    }

    destroy() {
      this.destroyed = true;
      cancelAnimationFrame(this.raf);
      if (this.ro) this.ro.disconnect();
      this.audio.close();
      window.removeEventListener('mouseup', this.onWinUp);
      this.root.innerHTML = '';
    }

    isActive() { return !this.opts.isActive || this.opts.isActive(); }

    loadSettings() {
      try { return Object.assign({ sound: true, music: true, game: { autoPause: true, autoFight: true, difficulty: 1 } }, JSON.parse(localStorage.getItem('kotor98_settings') || '{}')); }
      catch (e) { return { sound: true, music: true, game: { autoPause: true, autoFight: true, difficulty: 1 } }; }
    }
    saveSettings() { try { localStorage.setItem('kotor98_settings', JSON.stringify(this.settings)); } catch (e) { return; } }

    resize() {
      const w = Math.max(320, this.root.clientWidth), h = Math.max(240, this.root.clientHeight);
      this.W = w; this.H = h;
      if (this.r) this.r.resize(w, h);
      this.ov.width = w; this.ov.height = h;
      if (this.sub && this.sub.resize) this.sub.resize();
    }

    sfx(id) { if (this.settings.sound) this.audio.sfx(id); }

    frame(now) {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(this.frame);
      const dt = Math.min(0.1, (now - this.lastT) / 1000);
      this.lastT = now;
      this.audio.musicOn = this.settings.music;
      this.audio.update();
      if (this.sub && this.sub.frame) { this.sub.frame(dt); return; }
      if (this.screen !== 'game') return;
      const g = this.game;
      if (g.mode === 'play' && !this.panel && this.isActive()) this.keyMove(dt);
      g.update(dt);
      for (const e of g.drain()) this.onEvent(e);
      if (!this.r) return;
      this.dialogCamera();
      this.r.render(g, dt, this);
      this.drawOverlay(dt);
      this.hudT -= dt;
      if (this.hudT <= 0) { this.hudT = 0.12; this.updateHud(); }
    }

    onEvent(e) {
      const g = this.game;
      if (this.r) this.r.onEvent(e, g);
      switch (e.type) {
        case 'float': {
          const c = g.creatureByUid(e.uid);
          if (c) this.floats.push({ uid: e.uid, x: c.x, z: c.z, h: (c.big ? 3.4 : 2.1) * (c.model.h && !c.big ? c.model.h : 1), text: e.text, col: e.col, t: 0, max: e.long ? 3.5 : 1.3, crit: e.crit, dx: (Math.random() - 0.5) * 20 });
          break;
        }
        case 'sfx': this.sfx(e.id); break;
        case 'toast': this.toast(e.text); break;
        case 'area': this.music(); this.hover = null; this.selected = null; this.toast(g.area.def.n, true); break;
        case 'combat': this.music(); break;
        case 'pause': if (e.on) this.toast(e.why === 'mine' ? 'Мина обнаружена — пауза' : 'Враг замечен — пауза'); break;
        case 'mode': this.onMode(e.mode); break;
        case 'dialog': this.renderDialog(); break;
        case 'levelup': this.sfx('levelup'); break;
        case 'ui': if (e.open) this.openPanel(e.open); break;
        case 'ending': break;
      }
    }

    music() {
      const g = this.game;
      if (!g.area) return;
      this.audio.music(g.combat ? 'battle' : (g.area.def.music || 'calm'));
    }

    onMode(mode) {
      const g = this.game;
      this.closeSub();
      this.layer.innerHTML = '';
      if (mode === 'dialog') this.renderDialog();
      else if (mode === 'shop') this.openShop();
      else if (mode === 'loot') this.openLoot();
      else if (mode === 'pazaak') this.sub = new K.PazaakScreen(this);
      else if (mode === 'swoop') this.sub = new K.SwoopScreen(this);
      else if (mode === 'ending') { this.audio.music('ending'); this.sub = new K.EndingScreen(this); }
      else if (mode === 'gameover') this.showGameOver();
      else if (mode === 'play') { this.dialogEl = null; if (this.panel) this.openPanel(this.panel); }
      this.root.focus({ preventScroll: true });
      if (mode === 'play' && g.area) this.music();
    }

    closeSub() {
      if (this.sub && this.sub.destroy) this.sub.destroy();
      this.sub = null;
    }

    toast(text, big) {
      const d = document.createElement('div');
      d.className = 'kt-toast' + (big ? ' big' : '');
      d.textContent = text;
      this.toasts.appendChild(d);
      setTimeout(() => d.classList.add('out'), big ? 2200 : 2600);
      setTimeout(() => d.remove(), big ? 3000 : 3300);
    }

    showTitle() {
      this.screen = 'title';
      this.closeSub();
      this.hud.innerHTML = '';
      this.panel = null;
      this.sub = new K.TitleScreen(this);
      this.audio.music('title');
    }

    startNewGame(spec) {
      this.closeSub();
      this.layer.innerHTML = '';
      const g = new K.Game({ settings: this.settings.game });
      this.game = g;
      g.newGame(spec);
      g.drain();
      this.screen = 'prologue';
      this.sub = new K.PrologueScreen(this, () => {
        this.closeSub();
        this.enterGame();
      });
    }

    enterGame() {
      this.screen = 'game';
      this.buildHud();
      if (this.r) { this.r.static = null; this.r.cam.tx = null; }
      this.music();
      const g = this.game;
      if (g.mode === 'dialog') this.renderDialog();
      this.toast(g.area.def.n, true);
      this.root.focus({ preventScroll: true });
    }

    saves() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); } catch (e) { return {}; } }
    writeSave(slot, label) {
      const g = this.game;
      if (g.combat || g.mode !== 'play') { this.toast('Сейчас нельзя сохраниться'); return false; }
      const all = this.saves();
      const data = g.serialize();
      data.label = label || (g.area.def.n + ' — ' + g.player.name);
      data.areaName = g.area.def.n;
      all[slot] = data;
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(all)); }
      catch (e) { this.toast('Не удалось сохранить: нет места'); return false; }
      this.toast('Игра сохранена');
      return true;
    }
    loadSave(slot) {
      const all = this.saves();
      const s = all[slot];
      if (!s) return false;
      this.closeSub();
      this.layer.innerHTML = '';
      const g = new K.Game({ settings: this.settings.game });
      g.deserialize(s);
      g.drain();
      this.game = g;
      this.panel = null;
      this.enterGame();
      this.toast('Загружено: ' + (s.label || slot));
      return true;
    }
    latestSave() {
      const all = this.saves();
      let best = null;
      for (const [k, v] of Object.entries(all)) if (!best || v.t > all[best].t) best = k;
      return best;
    }

    bindInput() {
      const root = this.root, cv = this.ov;
      root.addEventListener('keydown', e => this.onKey(e, true));
      root.addEventListener('keyup', e => this.onKey(e, false));
      root.addEventListener('blur', () => { this.keys = {}; });
      cv.addEventListener('contextmenu', e => e.preventDefault());
      cv.addEventListener('mousedown', e => {
        root.focus({ preventScroll: true });
        this.audio.resume();
        if (this.screen !== 'game' || this.sub) return;
        const p = this.mpos(e);
        if (e.button === 2 || e.button === 1) { this.drag = { x: p[0], y: p[1], yaw: this.r && this.r.cam.yaw, pitch: this.r && this.r.cam.pitch, moved: false }; e.preventDefault(); return; }
        if (e.button === 0) this.click(p[0], p[1], e.shiftKey);
      });
      cv.addEventListener('mousemove', e => {
        const p = this.mpos(e);
        this.mouse = p;
        if (this.drag && this.r) {
          const dx = p[0] - this.drag.x, dy = p[1] - this.drag.y;
          if (Math.abs(dx) + Math.abs(dy) > 3) this.drag.moved = true;
          this.r.cam.yaw = this.drag.yaw - dx * 0.008;
          this.r.cam.pitch = K.clamp(this.drag.pitch + dy * 0.005, 0.25, 1.35);
          return;
        }
        this.hoverT = 0;
      });
      this.onWinUp = () => { this.drag = null; };
      window.addEventListener('mouseup', this.onWinUp);
      cv.addEventListener('wheel', e => {
        if (!this.r || this.screen !== 'game') return;
        e.preventDefault();
        this.r.cam.dist = K.clamp(this.r.cam.dist * (e.deltaY > 0 ? 1.1 : 0.9), 4, 20);
      }, { passive: false });
    }

    mpos(e) { const r = this.ov.getBoundingClientRect(); return [(e.clientX - r.left) * this.ov.width / r.width, (e.clientY - r.top) * this.ov.height / r.height]; }

    onKey(e, down) {
      if (!this.isActive()) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const code = e.code;
      if (this.sub && this.sub.key) { if (this.sub.key(e, down) !== false) { e.preventDefault(); return; } }
      if (this.screen !== 'game') return;
      const g = this.game;
      const map = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', ArrowUp: 'w', ArrowLeft: 'a', ArrowDown: 's', ArrowRight: 'd', KeyQ: 'q', KeyE: 'e' };
      if (map[code]) { this.keys[map[code]] = down; if (!this.panel && g.mode === 'play') e.preventDefault(); }
      if (!down) return;
      if (g.mode === 'dialog') {
        const n = parseInt(k, 10);
        if (n >= 1 && n <= 9) { this.chooseReply(n - 1); e.preventDefault(); }
        else if ((code === 'Space' || code === 'Enter') && g.dialog && g.dialog.replies.length === 1) { this.chooseReply(0); e.preventDefault(); }
        else if (code === 'Escape' && g.dialog && g.dialog.replies.some(r => r.target === 'END' && !r.acts.length)) { this.chooseReply(g.dialog.replies.findIndex(r => r.target === 'END' && !r.acts.length)); e.preventDefault(); }
        return;
      }
      if (g.mode === 'shop' && code === 'Escape') { g.closeShop(); e.preventDefault(); return; }
      if (g.mode === 'loot') { if (code === 'Escape') g.closeLoot(); if (code === 'Space' || code === 'Enter') { g.takeLoot(); g.closeLoot(); } e.preventDefault(); return; }
      if (g.mode !== 'play') return;
      const panels = { KeyI: 'inv', KeyU: 'equip', KeyC: 'char', KeyK: 'abil', KeyJ: 'journal', KeyM: 'map', KeyL: 'log', KeyP: 'party', KeyO: 'system' };
      if (panels[code]) { this.togglePanel(panels[code]); e.preventDefault(); return; }
      if (code === 'Escape') { if (this.panel) this.closePanel(); else this.openPanel('system'); e.preventDefault(); return; }
      if (this.panel) return;
      if (code === 'Space') { g.paused = !g.paused; this.sfx('click'); this.updateHud(); e.preventDefault(); }
      else if (code === 'Tab') { g.cycleLeader(); e.preventDefault(); }
      else if (code === 'KeyR') { g.rest(); }
      else if (code === 'KeyF') { this.useNearest(); }
      else if (code === 'KeyH') { this.quickHeal(); }
      else if (code === 'KeyG') { const t = this.selected || (g.leader.target && g.creatureByUid(g.leader.target)); if (t && g.countItem('frag')) g.cmdItem('frag', g.leader, t); else this.toast('Нужна цель и осколочная граната'); }
      else if (code === 'F5') { this.writeSave('quick', 'Быстрое сохранение'); e.preventDefault(); }
      else if (code === 'F9') { if (!this.loadSave('quick')) this.toast('Нет быстрого сохранения'); e.preventDefault(); }
      else if (code >= 'Digit1' && code <= 'Digit3') { const id = g.active[+code.slice(5) - 1]; if (id) g.setLeader(id); }
    }

    keyMove(dt) {
      const g = this.game, r = this.r;
      if (!r) return;
      if (this.keys.q) r.cam.yaw += dt * 2.2;
      if (this.keys.e) r.cam.yaw -= dt * 2.2;
      let fx = 0, fz = 0;
      if (this.keys.w) fz -= 1;
      if (this.keys.s) fz += 1;
      if (this.keys.a) fx -= 1;
      if (this.keys.d) fx += 1;
      const L = g.leader;
      if (!L || L.dead) return;
      if (!fx && !fz) { if (this.kbMoving) { this.kbMoving = false; L.path = null; } return; }
      const yaw = r.cam.yaw;
      const dx = fx * Math.cos(yaw) + fz * Math.sin(yaw);
      const dz = -fx * Math.sin(yaw) + fz * Math.cos(yaw);
      const l = Math.hypot(dx, dz);
      this.kbT = (this.kbT || 0) - dt;
      if (this.kbT > 0 && L.path) return;
      this.kbT = 0.12;
      this.kbMoving = true;
      L.queue = []; L.target = null; L.attacking = false; L.interact = null;
      const tx = L.x + dx / l * 1.4, tz = L.z + dz / l * 1.4;
      if (g.pathWalk(Math.floor(tx), Math.floor(tz))) L.path = [[tx, tz]];
      else g.pathTo(L, tx, tz, false);
      L.stuckT = 0;
    }

    click(x, y, shift) {
      const g = this.game;
      if (!this.r || g.mode !== 'play') return;
      const p = this.r.pick(g, x, y);
      if (!p) return;
      this.sfx('click');
      if (p.ground) { g.cmdMove(p.x, p.z); this.selected = null; return; }
      if (p.uid) {
        const c = p;
        this.selected = c;
        if (c.faction === 'hostile') { if (!shift) g.leader.queue = []; g.cmdAttack(c); }
        else if (c.faction === 'party') { if (c.pid !== g.leaderId) g.interact(c); }
        else g.interact(c);
        return;
      }
      if (p.type === 'door') { g.interact(p); return; }
      g.interact(p);
    }

    useNearest() {
      const g = this.game, L = g.leader;
      let best = null, bd = 4;
      for (const o of g.objects) { if (o.type === 'trig' || o.type === 'mine' && !o.found) continue; const d = K.dist(L.x, L.z, o.x, o.z); if (d < bd) { bd = d; best = o; } }
      for (const c of g.creatures) { if (c.dead || c === L || c.faction === 'hostile' || !(c.dlg || c.bark || c.pid)) continue; const d = K.dist(L.x, L.z, c.x, c.z); if (d < bd) { bd = d; best = c; } }
      if (best) g.interact(best); else this.toast('Рядом нет ничего интересного');
    }

    quickHeal() {
      const g = this.game, L = g.leader;
      const id = L.droid ? 'repair_kit' : (L.hp < L.maxHp * 0.4 && g.countItem('adv_medpac') ? 'adv_medpac' : 'medpac');
      if (!g.countItem(id)) { this.toast('Нет: ' + K.ITEMS[id].n); return; }
      g.cmdItem(id, L, L);
    }

    dialogCamera() {
      const g = this.game;
      this.dialogCam = null;
      if (g.mode !== 'dialog' || !g.dialog) return;
      const D = g.dialog;
      const sp = D.speaker && D.speaker.uid ? g.creatureByUid(D.speaker.uid) : null;
      const L = g.leader;
      let other = sp && sp !== L ? sp : (D.owner && D.owner.uid && D.owner !== L ? D.owner : null);
      if (!other && D.owner && D.owner.x != null && !D.owner.uid) other = D.owner;
      if (!other || !L) return;
      const focus = sp === L ? L : other;
      const from = sp === L ? other : L;
      let dx = from.x - focus.x, dz = from.z - focus.z;
      const d = Math.hypot(dx, dz) || 1;
      dx /= d; dz /= d;
      const yaw = Math.atan2(dx, dz) + 0.35;
      const hh = focus.big ? 2.6 : focus.model && focus.model.b === 'astromech' ? 0.9 : focus.model && focus.model.b === 'hutt' ? 1.6 : 1.55 * ((focus.model && focus.model.h) || 1);
      this.dialogCam = { x: focus.x + dx * 0.3, z: focus.z + dz * 0.3, y: hh, dist: focus.big ? 7 : 3.6, pitch: 0.12, yaw };
      if (this.r) this.r.cam.yawDlg = yaw;
    }

    renderDialog() {
      const g = this.game;
      const D = g.dialog;
      if (!D) return;
      this.closePanel(true);
      let el = this.layer.querySelector('.kt-dialog');
      if (!el) {
        this.layer.innerHTML = '<div class="kt-letterbox top"></div><div class="kt-letterbox bot"></div><div class="kt-dialog"></div>';
        el = this.layer.querySelector('.kt-dialog');
      }
      const reps = D.replies.map((r, i) => '<div class="kt-reply" data-i="' + i + '"><b>' + (i + 1) + '.</b> ' + esc(r.text) + '</div>').join('');
      el.innerHTML = (D.speaker.name ? '<div class="kt-speaker">' + esc(D.speaker.name) + '</div>' : '') + '<div class="kt-dtext' + (D.speaker.name ? '' : ' narr') + '">' + esc(D.text).replace(/\n/g, '<br>') + '</div><div class="kt-replies">' + reps + '</div>';
      el.querySelectorAll('.kt-reply').forEach(r => {
        r.onclick = () => this.chooseReply(+r.dataset.i);
        r.onmouseenter = () => this.sfx('hover');
      });
    }

    chooseReply(i) {
      const g = this.game;
      if (!g.dialog || !g.dialog.replies[i]) return;
      this.sfx('click');
      g.choose(i);
      for (const e of g.drain()) this.onEvent(e);
      if (g.mode === 'dialog') this.renderDialog();
      else if (g.mode === 'play') this.layer.innerHTML = '';
    }

    buildHud() {
      this.hud.innerHTML = `
<div class="kt-target"></div>
<div class="kt-topcenter"><div class="kt-pause">ПАУЗА</div><div class="kt-combat">БОЙ</div></div>
<div class="kt-topright"><canvas class="kt-mini" width="150" height="150"></canvas><div class="kt-areaname"></div>
<div class="kt-menubtns">
<button data-p="equip" title="Экипировка (U)">⚔</button><button data-p="inv" title="Инвентарь (I)">▤</button><button data-p="char" title="Персонаж (C)">☺</button><button data-p="abil" title="Способности (K)">✦</button><button data-p="journal" title="Журнал (J)">✎</button><button data-p="map" title="Карта (M)">◈</button><button data-p="party" title="Отряд (P)">♟</button><button data-p="log" title="Сообщения (L)">≡</button><button data-p="system" title="Меню (Esc)">⚙</button>
</div></div>
<div class="kt-party"></div>
<div class="kt-actions"></div>
<div class="kt-log"></div>
<div class="kt-hint"></div>`;
      this.hud.querySelectorAll('.kt-menubtns button').forEach(b => { b.onclick = () => this.togglePanel(b.dataset.p); });
      this.mini = this.hud.querySelector('.kt-mini');
      this.partyKey = '';
      this.actKey = '';
    }

    updateHud() {
      const g = this.game;
      if (this.screen !== 'game' || !this.hud.firstChild) return;
      const q = s => this.hud.querySelector(s);
      q('.kt-pause').style.display = g.paused && g.mode === 'play' ? 'block' : 'none';
      q('.kt-combat').style.display = g.combat && !g.paused ? 'block' : 'none';
      q('.kt-areaname').textContent = g.area.def.n;
      this.hud.style.display = g.mode === 'dialog' || this.sub || this.panel || g.mode === 'shop' || g.mode === 'loot' ? 'none' : 'block';
      const party = g.partyCreatures();
      const pk = party.map(c => c.uid + (c.dead ? 'd' : '') + g.leaderId + g.pendingLevels(c)).join('|');
      const pEl = q('.kt-party');
      if (pk !== this.partyKey) {
        this.partyKey = pk;
        pEl.innerHTML = party.map(c => `<div class="kt-pm${c.pid === g.leaderId ? ' lead' : ''}" data-pid="${c.pid}"><canvas width="56" height="56"></canvas><div class="kt-pmname">${esc(c.name)}${g.pendingLevels(c) ? ' <span class="kt-lvup" title="Повышение уровня">▲</span>' : ''}</div><div class="kt-bar hp"><i></i></div>${c.maxFp ? '<div class="kt-bar fp"><i></i></div>' : ''}<div class="kt-queue"></div></div>`).join('');
        pEl.querySelectorAll('.kt-pm').forEach((d, i) => {
          drawPortrait(d.querySelector('canvas'), party[i].model, 'party', party[i].dead);
          d.onclick = () => { g.setLeader(d.dataset.pid); this.partyKey = ''; };
          d.oncontextmenu = ev => { ev.preventDefault(); this.openPanel('char', d.dataset.pid); };
          const lv = d.querySelector('.kt-lvup');
          if (lv) lv.onclick = ev => { ev.stopPropagation(); this.openPanel('char', d.dataset.pid); };
        });
      }
      pEl.querySelectorAll('.kt-pm').forEach((d, i) => {
        const c = party[i];
        if (!c) return;
        d.querySelector('.hp i').style.width = (100 * Math.max(0, c.hp) / c.maxHp) + '%';
        d.querySelector('.hp').title = 'Здоровье ' + Math.max(0, c.hp) + '/' + c.maxHp;
        const fp = d.querySelector('.fp i');
        if (fp) fp.style.width = (100 * c.fp / Math.max(1, c.maxFp)) + '%';
        const qd = d.querySelector('.kt-queue');
        const items = c.queue.map(a => a.k === 'attack' ? (a.feat ? K.FEATS[a.feat].icon : 'AT') : a.k === 'item' ? 'IT' : a.k === 'grenade' ? 'GR' : a.k === 'power' ? K.POWERS[a.power].icon : '?');
        if (c.attacking && !items.length) items.push('AT');
        qd.textContent = items.join(' ');
        d.classList.toggle('dead', !!c.dead);
      });
      this.updateActions();
      this.updateTarget();
      this.updateLog();
      this.drawMini();
      const hint = q('.kt-hint');
      hint.textContent = this.hoverText || '';
    }

    updateActions() {
      const g = this.game;
      const L = g.leader;
      if (!L) return;
      const ranged = K.isRanged(L);
      const feats = L.feats.filter(f => K.FEATS[f] && K.FEATS[f].type === (ranged ? 'ranged' : 'melee'));
      const itemIds = ['medpac', 'adv_medpac', 'repair_kit', 'stim', 'shield', 'frag', 'stun_gren', 'ion_gren'].filter(id => g.countItem(id));
      const key = L.uid + '|' + feats.join() + '|' + itemIds.map(id => id + g.countItem(id)).join() + '|' + L.powers.join() + L.fp;
      if (key === this.actKey) return;
      this.actKey = key;
      const el = this.hud.querySelector('.kt-actions');
      const btn = (cls, data, label, title, count, dis) => `<button class="kt-act ${cls}"${dis ? ' disabled' : ''} data-a="${data}" title="${esc(title)}">${label}${count != null ? '<sub>' + count + '</sub>' : ''}</button>`;
      let h = '<div class="kt-actgroup">' + btn('atk', 'attack', '⚔', 'Атаковать цель') + feats.map(f => btn('feat', 'feat:' + f, K.FEATS[f].icon, K.FEATS[f].n + ': ' + K.FEATS[f].desc)).join('') + '</div>';
      h += '<div class="kt-actgroup">' + itemIds.map(id => btn('item ' + (K.ITEMS[id].use.grenade ? 'gren' : 'med'), 'item:' + id, ITEM_ICON[id] || '•', K.ITEMS[id].n + ' — ' + (K.ITEMS[id].desc || ''), g.countItem(id))).join('') + '</div>';
      if (L.powers.length) h += '<div class="kt-actgroup">' + L.powers.map(p => btn('pow', 'pow:' + p, K.POWERS[p].icon, K.POWERS[p].n + ' (' + K.POWERS[p].fp + ' ОС): ' + K.POWERS[p].desc, null, L.fp < K.POWERS[p].fp)).join('') + '</div>';
      h += '<div class="kt-actgroup">' + btn('sys', 'rest', '☾', 'Отдых (R)') + btn('sys', 'pause', '❚❚', 'Пауза (Пробел)') + '</div>';
      el.innerHTML = h;
      el.querySelectorAll('.kt-act').forEach(b => { b.onclick = () => this.doAction(b.dataset.a); });
    }

    doAction(a) {
      const g = this.game, L = g.leader;
      this.sfx('click');
      const tgt = this.selected && !this.selected.dead && this.selected.faction === 'hostile' ? this.selected : (L.target ? g.creatureByUid(L.target) : null);
      if (a === 'attack') { if (tgt) g.cmdAttack(tgt); else this.toast('Выберите цель'); return; }
      if (a === 'rest') { g.rest(); return; }
      if (a === 'pause') { g.paused = !g.paused; return; }
      const [k, id] = a.split(':');
      if (k === 'feat') { if (tgt) g.cmdAttack(tgt, id); else this.toast('Выберите врага'); }
      else if (k === 'item') {
        const it = K.ITEMS[id];
        if (it.use.grenade) { if (tgt) g.cmdItem(id, L, tgt); else this.toast('Выберите цель для гранаты'); }
        else g.cmdItem(id, L, L);
      } else if (k === 'pow') g.cmdPower(id, L, K.POWERS[id].target === 'enemy' ? tgt : null);
      this.updateHud();
    }

    updateTarget() {
      const g = this.game;
      const el = this.hud.querySelector('.kt-target');
      const t = this.hover && this.hover.uid ? this.hover : this.selected && !this.selected.dead ? this.selected : null;
      if (!t || !t.uid || t.dead) { el.style.display = 'none'; return; }
      el.style.display = 'block';
      const cls = t.faction === 'hostile' ? 'hostile' : t.faction === 'party' ? 'party' : 'neutral';
      const D = K.describe(t);
      el.className = 'kt-target ' + cls;
      el.innerHTML = `<div class="nm">${esc(t.name)}</div><div class="kt-bar hp"><i style="width:${100 * Math.max(0, t.hp) / t.maxHp}%"></i></div><div class="sub">${cls === 'hostile' ? 'Уровень ' + t.level + ' · Защита ' + D.def + ' · ' + esc(D.weapon) : cls === 'party' ? 'Уровень ' + t.level + ' · ' + K.CLASSES[t.cls].n : ''}</div>`;
    }

    updateLog() {
      const g = this.game;
      const el = this.hud.querySelector('.kt-log');
      const lines = g.log.slice(-6);
      const key = g.log.length + ':' + (lines[lines.length - 1] || {}).text;
      if (key === this.logKey) return;
      this.logKey = key;
      el.innerHTML = lines.map(l => `<div style="color:${l.col}">${esc(l.text)}</div>`).join('');
    }

    drawMini() {
      const g = this.game, cv = this.mini;
      if (!cv) return;
      const x = cv.getContext('2d');
      const a = g.area, L = g.leader;
      const S = 4, R = 18;
      x.fillStyle = '#05101a'; x.fillRect(0, 0, 150, 150);
      x.save();
      x.translate(75, 75);
      x.rotate(this.r ? this.r.cam.yaw : 0);
      for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
        const tx = Math.floor(L.x) + dx, tz = Math.floor(L.z) + dz;
        if (!g.inside(tx, tz) || !a.explored[tz * a.w + tx]) continue;
        const t = a.tiles[tz * a.w + tx];
        const w = g.baseWalk(tx, tz);
        x.fillStyle = t === '#' ? '#4a8a9a' : t === 'x' ? '#40e0ff' : t === '+' ? '#80c0d0' : w ? '#12303c' : '#1e4450';
        if (t === ' ') continue;
        x.fillRect((tx - L.x) * S, (tz - L.z) * S, S, S);
      }
      for (const o of g.objects) {
        if (o.type === 'trig' || o.type === 'mine' && !o.found) continue;
        const px = (o.x - L.x) * S, pz = (o.z - L.z) * S;
        if (Math.abs(px) > 75 || Math.abs(pz) > 75 || !a.explored[Math.floor(o.z) * a.w + Math.floor(o.x)]) continue;
        x.fillStyle = o.type === 'exit' ? '#40ffff' : o.type === 'mine' ? '#ff3030' : o.looted ? '#406070' : '#80e0ff';
        x.fillRect(px - 2, pz - 2, 4, 4);
      }
      for (const c of g.creatures) {
        if (c.dead) continue;
        const px = (c.x - L.x) * S, pz = (c.z - L.z) * S;
        if (Math.abs(px) > 75 || Math.abs(pz) > 75) continue;
        if (c.faction === 'hostile' && !c.aggro && !g.los(L.x, L.z, c.x, c.z)) continue;
        x.fillStyle = c === L ? '#ffffff' : c.faction === 'party' ? '#60a0ff' : c.faction === 'hostile' ? '#ff4040' : (c.dlg ? '#ffe060' : '#a0a080');
        x.beginPath(); x.arc(px, pz, c === L ? 3 : 2.2, 0, Math.PI * 2); x.fill();
      }
      x.restore();
      x.strokeStyle = '#ffffff'; x.beginPath(); x.moveTo(75, 69); x.lineTo(71, 78); x.lineTo(79, 78); x.closePath(); x.stroke();
      x.strokeStyle = '#2fb7b7'; x.lineWidth = 2; x.strokeRect(1, 1, 148, 148); x.lineWidth = 1;
    }

    drawOverlay(dt) {
      const x = this.ovx, g = this.game, r = this.r;
      x.clearRect(0, 0, this.W, this.H);
      if (g.mode === 'dialog' || this.sub) { this.floats = []; return; }
      this.hoverT = (this.hoverT || 0) - dt;
      if (this.mouse && this.hoverT <= 0 && !this.drag) {
        this.hoverT = 0.08;
        const p = r.pick(g, this.mouse[0], this.mouse[1]);
        this.hover = p && !p.ground ? p : null;
        this.hoverText = this.hover ? (this.hover.uid ? this.hover.name : this.hover.type === 'door' ? (this.hover.locked ? (this.hover.n || 'Дверь') + ' (заперта)' : this.hover.n || 'Дверь') : this.hover.type === 'mine' ? (this.hover.def.n || 'Мина') + ' — обезвредить' : this.hover.n) : '';
        this.ov.style.cursor = this.hover ? (this.hover.faction === 'hostile' ? 'crosshair' : 'pointer') : 'default';
      }
      x.textAlign = 'center';
      x.font = 'bold 12px Tahoma, Arial';
      for (const c of g.creatures) {
        if (c.dead) continue;
        const show = c.faction === 'hostile' && c.aggro || c === this.hover || c === this.selected;
        if (!show) continue;
        const p = r.project(c.x, (c.big ? 3.3 : 2.05 * (c.model.h || 1)), c.z);
        if (!p) continue;
        const w = 46;
        x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(p[0] - w / 2 - 1, p[1] - 1, w + 2, 6);
        x.fillStyle = c.faction === 'hostile' ? '#e03030' : c.faction === 'party' ? '#40c060' : '#c0c040';
        x.fillRect(p[0] - w / 2, p[1], w * Math.max(0, c.hp) / c.maxHp, 4);
        if (c === this.hover || c === this.selected) { x.fillStyle = '#ffffff'; x.fillText(c.name, p[0], p[1] - 6); }
      }
      if (this.hover && !this.hover.uid && this.hover.x != null) {
        const o = this.hover;
        const p = r.project(o.x + (o.type === 'door' ? 0.5 : 0), 1.6, o.z + (o.type === 'door' ? 0.5 : 0));
        if (p) { x.fillStyle = '#80f0ff'; x.fillText(this.hoverText, p[0], p[1]); }
      }
      for (let i = this.floats.length - 1; i >= 0; i--) {
        const f = this.floats[i];
        f.t += dt;
        if (f.t > f.max) { this.floats.splice(i, 1); continue; }
        const c = g.creatureByUid(f.uid);
        if (c) { f.x = c.x; f.z = c.z; }
        const p = r.project(f.x, f.h + f.t * 0.6, f.z);
        if (!p) continue;
        const a = Math.min(1, (f.max - f.t) / 0.4);
        x.globalAlpha = a;
        x.font = (f.crit ? 'bold 18px' : f.long ? '13px' : 'bold 14px') + ' Tahoma, Arial';
        x.lineWidth = 3; x.strokeStyle = 'rgba(0,0,0,0.85)';
        const tx = p[0] + (f.long ? 0 : f.dx);
        if (f.long) {
          const lines = wrap(x, f.text, 260);
          lines.forEach((ln, k) => { x.strokeText(ln, tx, p[1] - (lines.length - k) * 15); x.fillStyle = f.col || '#fff'; x.fillText(ln, tx, p[1] - (lines.length - k) * 15); });
        } else { x.strokeText(f.text, tx, p[1]); x.fillStyle = f.col || '#fff'; x.fillText(f.text, tx, p[1]); }
        x.globalAlpha = 1;
      }
    }

    showGameOver() {
      this.layer.innerHTML = `<div class="kt-screen kt-gameover"><h1>Вы погибли</h1><p>Отряд пал. Тарис поглотит ещё несколько безымянных тел…</p><div class="kt-btnrow"><button data-a="load">Загрузить последнее сохранение</button><button data-a="title">Главное меню</button></div></div>`;
      this.layer.querySelector('[data-a=load]').onclick = () => { const s = this.latestSave(); if (!s || !this.loadSave(s)) this.toast('Сохранений нет'); };
      this.layer.querySelector('[data-a=title]').onclick = () => { this.layer.innerHTML = ''; this.showTitle(); };
    }
  }

  const ITEM_ICON = { medpac: '✚', adv_medpac: '✚✚', repair_kit: '⚙', stim: '⚡', shield: '◍', frag: '✹', stun_gren: '✺', ion_gren: 'ϟ' };
  K.ITEM_ICON = ITEM_ICON;

  function wrap(x, text, max) {
    const words = text.split(' ');
    const out = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (x.measureText(t).width > max && cur) { out.push(cur); cur = w; } else cur = t;
    }
    if (cur) out.push(cur);
    return out;
  }
  K.wrapText = wrap;

  K.UI = UI;
})(globalThis.Kotor98 = globalThis.Kotor98 || {});
