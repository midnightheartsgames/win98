/**
 * S.T.A.L.K.E.R. 98 — DOM windows: main/pause menus, difficulty, save/load slots, options, controls, credits,
 * intro and ending slides, dialogue, inventory (slots, artifact belt), trade, loot, PDA (tasks, map, diary,
 * statistics, contacts), level travel prompt and the death screen. Also item icons, portraits and the map canvas.
 */
(function (S) {
  'use strict';
  const { clamp } = S;
  const D = S.DATA, IT = D.ITEMS, Q = () => S.QUESTS;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  // ================================================================ icons
  const iconCache = {};
  function drawItemIcon(x, id, w, h) {
    const d = IT[id]; if (!d) return;
    const col = d.col || '#808080';
    x.save(); x.lineJoin = 'round';
    const dark = '#1e1e1e', steel = '#3a3a3c', wood = '#7a4420', plum = '#6a2a1a';
    const R = (a, b, c, e, f) => { x.fillStyle = f; x.fillRect(a, b, c, e); };
    switch (d.icon) {
      case 'knife': x.translate(w / 2, h / 2); x.rotate(-0.5); R(-26, -3, 30, 7, '#c8c8d0'); x.fillStyle = '#c8c8d0'; x.beginPath(); x.moveTo(4, -3); x.lineTo(10, 1); x.lineTo(4, 4); x.fill(); R(-40, -4, 14, 9, dark); R(-27, -6, 2, 13, steel); break;
      case 'pistol': case 'pistol2': R(w * 0.22, h * 0.32, w * 0.56, h * 0.16, d.icon === 'pistol2' ? dark : steel); x.fillStyle = d.icon === 'pistol2' ? dark : '#4a3424'; x.beginPath(); x.moveTo(w * 0.52, h * 0.46); x.lineTo(w * 0.72, h * 0.46); x.lineTo(w * 0.78, h * 0.82); x.lineTo(w * 0.6, h * 0.82); x.fill(); x.strokeStyle = steel; x.lineWidth = 2; x.beginPath(); x.arc(w * 0.5, h * 0.52, 5, 0, Math.PI); x.stroke(); break;
      case 'sawnoff': case 'shotgun': { const L = d.icon === 'shotgun' ? 0.9 : 0.6; R(w * (0.95 - L), h * 0.36, w * L * 0.62, h * 0.08, steel); R(w * (0.95 - L), h * 0.45, w * L * 0.62, h * 0.08, steel); x.fillStyle = wood; x.beginPath(); x.moveTo(w * (0.95 - L * 0.38), h * 0.34); x.lineTo(w * 0.95, h * 0.4); x.lineTo(w * 0.97, h * (d.icon === 'shotgun' ? 0.75 : 0.62)); x.lineTo(w * 0.86, h * 0.72); x.lineTo(w * (0.95 - L * 0.4), h * 0.56); x.fill(); break; }
      case 'smg': R(w * 0.2, h * 0.34, w * 0.5, h * 0.18, dark); R(w * 0.08, h * 0.39, w * 0.14, h * 0.07, steel); R(w * 0.68, h * 0.36, w * 0.24, h * 0.08, steel); x.fillStyle = steel; x.beginPath(); x.moveTo(w * 0.4, h * 0.52); x.lineTo(w * 0.47, h * 0.52); x.lineTo(w * 0.44, h * 0.85); x.lineTo(w * 0.38, h * 0.84); x.fill(); R(w * 0.56, h * 0.52, w * 0.06, h * 0.22, dark); break;
      case 'aksu': case 'ak': { const long = d.icon === 'ak'; R(w * (long ? 0.04 : 0.14), h * 0.37, w * (long ? 0.26 : 0.14), h * 0.05, steel); R(w * (long ? 0.24 : 0.26), h * 0.33, w * 0.16, h * 0.12, long ? plum : '#8a4a1a'); R(w * 0.4, h * 0.32, w * 0.26, h * 0.15, steel); x.fillStyle = '#8a4a1a'; x.beginPath(); x.moveTo(w * 0.44, h * 0.47); x.lineTo(w * 0.52, h * 0.47); x.quadraticCurveTo(w * 0.52, h * 0.7, w * 0.44, h * 0.86); x.lineTo(w * 0.37, h * 0.82); x.quadraticCurveTo(w * 0.44, h * 0.66, w * 0.44, h * 0.47); x.fill(); R(w * 0.6, h * 0.47, w * 0.05, h * 0.2, long ? plum : '#8a4a1a'); if (long) { x.fillStyle = plum; x.beginPath(); x.moveTo(w * 0.66, h * 0.34); x.lineTo(w * 0.97, h * 0.4); x.lineTo(w * 0.97, h * 0.66); x.lineTo(w * 0.66, h * 0.47); x.fill(); } else { x.strokeStyle = steel; x.lineWidth = 3; x.strokeRect(w * 0.66, h * 0.36, w * 0.26, h * 0.14); } break; }
      case 'ammo': R(w * 0.18, h * 0.3, w * 0.64, h * 0.44, col); R(w * 0.24, h * 0.4, w * 0.52, h * 0.22, '#e8e0c0'); x.fillStyle = '#202020'; x.font = `bold ${Math.floor(h * 0.16)}px Arial`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(d.label || '', w / 2, h * 0.51); break;
      case 'shells': for (let i = 0; i < 4; i++) { R(w * (0.2 + i * 0.16), h * 0.28, w * 0.12, h * 0.34, '#b02818'); R(w * (0.2 + i * 0.16), h * 0.6, w * 0.12, h * 0.12, '#c8a040'); } break;
      case 'f1': case 'rgd5': x.fillStyle = d.icon === 'f1' ? '#4a5a30' : '#5a6a48'; x.beginPath(); x.ellipse(w / 2, h * 0.58, w * 0.2, h * 0.26, 0, 0, 7); x.fill(); if (d.icon === 'f1') { x.strokeStyle = '#2a3418'; x.lineWidth = 1.5; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(w / 2 + i * w * 0.07, h * 0.36); x.lineTo(w / 2 + i * w * 0.07, h * 0.82); x.stroke(); } } R(w * 0.44, h * 0.24, w * 0.12, h * 0.1, '#909090'); R(w * 0.55, h * 0.26, w * 0.05, h * 0.28, '#909090'); break;
      case 'medkit': R(w * 0.2, h * 0.28, w * 0.6, h * 0.46, col); R(w * 0.45, h * 0.35, w * 0.1, h * 0.32, '#fff'); R(w * 0.34, h * 0.46, w * 0.32, h * 0.1, '#fff'); break;
      case 'bandage': x.fillStyle = '#e8e8e0'; x.beginPath(); x.ellipse(w * 0.45, h / 2, w * 0.2, h * 0.22, 0, 0, 7); x.fill(); x.strokeStyle = '#b0b0a8'; x.beginPath(); x.ellipse(w * 0.45, h / 2, w * 0.08, h * 0.09, 0, 0, 7); x.stroke(); R(w * 0.6, h * 0.55, w * 0.25, h * 0.12, '#e8e8e0'); break;
      case 'antirad': R(w * 0.2, h * 0.3, w * 0.6, h * 0.4, '#e0e0e0'); R(w * 0.2, h * 0.3, w * 0.6, h * 0.12, '#2a6ab0'); x.fillStyle = '#e0c020'; x.beginPath(); x.arc(w / 2, h * 0.58, h * 0.09, 0, 7); x.fill(); break;
      case 'vodka': R(w * 0.4, h * 0.14, w * 0.2, h * 0.2, '#c0c8c0'); R(w * 0.32, h * 0.32, w * 0.36, h * 0.56, '#b8d0c8'); R(w * 0.32, h * 0.48, w * 0.36, h * 0.2, '#c02020'); R(w * 0.43, h * 0.1, w * 0.14, h * 0.06, '#d0b040'); break;
      case 'bread': x.fillStyle = '#c08a40'; x.beginPath(); x.ellipse(w / 2, h * 0.55, w * 0.34, h * 0.2, 0, 0, 7); x.fill(); x.strokeStyle = '#8a5a20'; for (let i = -1; i <= 1; i++) { x.beginPath(); x.moveTo(w / 2 + i * w * 0.12 - 5, h * 0.45); x.lineTo(w / 2 + i * w * 0.12 + 5, h * 0.62); x.stroke(); } break;
      case 'sausage': x.fillStyle = '#a03a3a'; x.beginPath(); x.ellipse(w / 2, h / 2, w * 0.36, h * 0.12, -0.3, 0, 7); x.fill(); x.fillStyle = '#e0a0a0'; x.beginPath(); x.ellipse(w * 0.8, h * 0.4, w * 0.04, h * 0.1, -0.3, 0, 7); x.fill(); break;
      case 'can': R(w * 0.3, h * 0.28, w * 0.4, h * 0.46, '#a0a0a8'); R(w * 0.3, h * 0.38, w * 0.4, h * 0.2, '#c04020'); break;
      case 'energy': R(w * 0.36, h * 0.2, w * 0.28, h * 0.6, '#30a030'); R(w * 0.36, h * 0.42, w * 0.28, h * 0.14, '#f0f040'); break;
      case 'suit': x.fillStyle = col; x.beginPath(); x.moveTo(w * 0.3, h * 0.12); x.lineTo(w * 0.7, h * 0.12); x.lineTo(w * 0.9, h * 0.35); x.lineTo(w * 0.78, h * 0.42); x.lineTo(w * 0.72, h * 0.34); x.lineTo(w * 0.72, h * 0.92); x.lineTo(w * 0.28, h * 0.92); x.lineTo(w * 0.28, h * 0.34); x.lineTo(w * 0.22, h * 0.42); x.lineTo(w * 0.1, h * 0.35); x.fill(); x.strokeStyle = 'rgba(0,0,0,0.5)'; x.beginPath(); x.moveTo(w / 2, h * 0.14); x.lineTo(w / 2, h * 0.92); x.stroke(); break;
      case 'art': { const g = x.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * 0.4); g.addColorStop(0, '#fff'); g.addColorStop(0.35, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = col; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(w / 2 + Math.cos(i * 1.3) * w * 0.12, h / 2 + Math.sin(i * 1.7) * h * 0.1, w * 0.09, 0, 7); x.fill(); } break; }
      case 'tail': x.strokeStyle = col; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(w * 0.2, h * 0.7); x.quadraticCurveTo(w * 0.5, h * 0.2, w * 0.82, h * 0.4); x.stroke(); break;
      case 'eye': x.fillStyle = '#e0d0b0'; x.beginPath(); x.arc(w / 2, h / 2, w * 0.2, 0, 7); x.fill(); x.fillStyle = '#402010'; x.beginPath(); x.arc(w * 0.55, h / 2, w * 0.08, 0, 7); x.fill(); break;
      case 'hoof': x.fillStyle = col; x.beginPath(); x.moveTo(w * 0.3, h * 0.2); x.lineTo(w * 0.6, h * 0.2); x.lineTo(w * 0.72, h * 0.8); x.lineTo(w * 0.24, h * 0.8); x.fill(); break;
      case 'tentacle': x.strokeStyle = col; x.lineWidth = 3; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(w * 0.3 + i * 6, h * 0.25); x.quadraticCurveTo(w * 0.2 + i * 10, h * 0.6, w * 0.35 + i * 8, h * 0.82); x.stroke(); } break;
      case 'flashdrive': R(w * 0.3, h * 0.36, w * 0.36, h * 0.24, '#3060c0'); R(w * 0.66, h * 0.4, w * 0.12, h * 0.16, '#b0b0b0'); break;
      case 'pda': R(w * 0.28, h * 0.16, w * 0.44, h * 0.68, '#303838'); R(w * 0.33, h * 0.22, w * 0.34, h * 0.36, '#6a8a5a'); for (let i = 0; i < 3; i++) R(w * (0.35 + i * 0.11), h * 0.66, w * 0.08, h * 0.08, '#606868'); break;
      case 'detector': R(w * 0.24, h * 0.24, w * 0.52, h * 0.5, '#4a4a3a'); x.fillStyle = '#c02020'; x.beginPath(); x.arc(w * 0.38, h * 0.4, 4, 0, 7); x.fill(); R(w * 0.48, h * 0.34, w * 0.22, h * 0.16, '#7a9a6a'); break;
      case 'binoc': x.fillStyle = dark; x.beginPath(); x.arc(w * 0.36, h * 0.52, w * 0.14, 0, 7); x.arc(w * 0.64, h * 0.52, w * 0.14, 0, 7); x.fill(); R(w * 0.4, h * 0.4, w * 0.2, h * 0.14, steel); break;
      case 'bolt': x.fillStyle = '#909090'; R(w * 0.46, h * 0.3, w * 0.08, h * 0.44, '#909090'); x.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; x.lineTo(w / 2 + Math.cos(a) * w * 0.12, h * 0.28 + Math.sin(a) * h * 0.08); } x.fill(); break;
      case 'guitar': x.fillStyle = '#8a4a1a'; x.beginPath(); x.ellipse(w * 0.36, h * 0.6, w * 0.18, h * 0.22, 0, 0, 7); x.fill(); R(w * 0.5, h * 0.54, w * 0.42, h * 0.08, '#4a2a10'); break;
      case 'harmonica': R(w * 0.2, h * 0.42, w * 0.6, h * 0.16, '#c0c0c8'); for (let i = 0; i < 8; i++) R(w * (0.23 + i * 0.07), h * 0.47, w * 0.04, h * 0.06, '#303030'); break;
      default: R(w * 0.3, h * 0.3, w * 0.4, h * 0.4, col);
    }
    x.restore();
  }
  function itemIcon(id, w = 64, h = 64) {
    const k = `${id}|${w}|${h}`; if (iconCache[k]) return iconCache[k];
    const c = document.createElement('canvas'); c.width = w; c.height = h; drawItemIcon(c.getContext('2d'), id, w, h);
    return (iconCache[k] = c.toDataURL());
  }
  // portraits for dialogue and PDA news
  const PORTRAIT = { trader: 'trader', stalker: 'loner', military: 'military', pda: null, stash: null, bandit: 'bandit' };
  function drawPortrait(c, key, x, y, s) {
    c.save(); c.translate(x, y); c.fillStyle = '#1a1c14'; c.fillRect(0, 0, s, s); c.strokeStyle = '#8a8060'; c.strokeRect(0.5, 0.5, s - 1, s - 1);
    const look = S.LOOKS[PORTRAIT[key] !== undefined ? PORTRAIT[key] : key];
    if (!look) {
      if (key === 'stash') { c.fillStyle = '#4a4a2a'; c.beginPath(); c.ellipse(s / 2, s * 0.6, s * 0.3, s * 0.25, 0, 0, 7); c.fill(); c.fillStyle = '#40a0ff'; c.fillRect(s * 0.44, s * 0.2, s * 0.12, s * 0.2); }
      else { c.fillStyle = '#303838'; c.fillRect(s * 0.25, s * 0.12, s * 0.5, s * 0.76); c.fillStyle = '#7aa06a'; c.fillRect(s * 0.3, s * 0.2, s * 0.4, s * 0.4); }
      c.restore(); return;
    }
    const hex = v => '#' + v.toString(16).padStart(6, '0');
    c.fillStyle = hex(look.suit); c.beginPath(); c.moveTo(s * 0.1, s); c.quadraticCurveTo(s * 0.12, s * 0.7, s * 0.5, s * 0.68); c.quadraticCurveTo(s * 0.88, s * 0.7, s * 0.9, s); c.fill();
    c.fillStyle = hex(look.skin); c.beginPath(); c.ellipse(s / 2, s * 0.44, s * (look.fat ? 0.24 : 0.2), s * 0.25, 0, 0, 7); c.fill();
    if (look.head === 'gasmask') { c.fillStyle = '#3a3a34'; c.beginPath(); c.ellipse(s / 2, s * 0.45, s * 0.22, s * 0.27, 0, 0, 7); c.fill(); c.fillStyle = '#90a0a0'; c.beginPath(); c.arc(s * 0.41, s * 0.4, s * 0.06, 0, 7); c.arc(s * 0.59, s * 0.4, s * 0.06, 0, 7); c.fill(); c.fillStyle = '#2a2a26'; c.beginPath(); c.arc(s / 2, s * 0.6, s * 0.08, 0, 7); c.fill(); }
    else {
      c.fillStyle = '#1a1a1a'; c.fillRect(s * 0.38, s * 0.4, s * 0.07, s * 0.03); c.fillRect(s * 0.55, s * 0.4, s * 0.07, s * 0.03);
      c.fillStyle = '#6a3030'; c.fillRect(s * 0.44, s * 0.56, s * 0.12, s * 0.02);
      if (look.head === 'hood') { c.fillStyle = hex(look.hood); c.beginPath(); c.moveTo(s * 0.24, s * 0.62); c.quadraticCurveTo(s * 0.18, s * 0.12, s / 2, s * 0.14); c.quadraticCurveTo(s * 0.82, s * 0.12, s * 0.76, s * 0.62); c.lineTo(s * 0.68, s * 0.6); c.quadraticCurveTo(s * 0.7, s * 0.25, s / 2, s * 0.24); c.quadraticCurveTo(s * 0.3, s * 0.25, s * 0.32, s * 0.6); c.fill(); }
      if (look.head === 'cap') { c.fillStyle = hex(look.hood); c.fillRect(s * 0.28, s * 0.2, s * 0.44, s * 0.1); c.fillRect(s * 0.3, s * 0.28, s * 0.5, s * 0.04); }
      if (look.head === 'helmet') { c.fillStyle = hex(look.hood); c.beginPath(); c.ellipse(s / 2, s * 0.3, s * 0.25, s * 0.16, 0, Math.PI, 0); c.fill(); c.fillRect(s * 0.25, s * 0.28, s * 0.5, s * 0.05); }
      if (look.head === 'beret') { c.fillStyle = hex(look.hood); c.beginPath(); c.ellipse(s * 0.52, s * 0.24, s * 0.22, s * 0.08, -0.2, 0, 7); c.fill(); }
      if (look.head === 'bare') { c.fillStyle = hex(look.hair || 0x302018); c.beginPath(); c.ellipse(s / 2, s * 0.26, s * 0.21, s * 0.1, 0, Math.PI, 0); c.fill(); }
    }
    c.restore();
  }

  class Windows {
    constructor(ui) { this.ui = ui; this.el = ui.winEl; this.maps = {}; }
    get g() { return this.ui.game; }
    L(o) { return this.ui.L(o); }
    t(k) { return this.ui.t(k); }
    portrait(c, key, x, y, s) { drawPortrait(c, key, x, y, s); }
    open(name, html, cls = '') {
      const ui = this.ui; ui.win = name; ui.skipPause = true; ui.unlock(); ui.mouse.fire = false; ui.mouse.aim = false; ui.keys.clear();
      this.el.innerHTML = `<div class="st98-panel ${cls}">${html}</div>`;
      this.el.style.display = 'flex';
      this.ui.audio.play('ui_open');
      return this.el.firstElementChild;
    }
    close() {
      const ui = this.ui; const was = ui.win;
      ui.win = null; this.el.innerHTML = ''; this.el.style.display = 'none'; this.onKey = null;
      if (was && ui.state === 'play' && ui.game && !ui.game.player.dead) { ui.lock(); ui.root.focus({ preventScroll: true }); }
    }
    key(c, e) {
      if (this.onKey && this.onKey(c, e) === true) return;
      if (c === 'Escape' && this.escClose !== false) { if (this.ui.state === 'play') this.close(); }
      if ((c === 'KeyI' && this.ui.win === 'inventory') || ((c === 'KeyP' || c === 'Tab' || c === 'KeyM') && this.ui.win === 'pda')) this.close();
    }
    btn(label, act, cls = '') { return `<button class="st98-btn ${cls}" data-act="${act}">${esc(label)}</button>`; }
    wire(root, acts) { root.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); this.ui.audio.play('ui_click'); const f = acts[b.dataset.act]; if (f) f(b); })); }

    // ================================================================ menus
    mainMenu() {
      const ui = this.ui, T = k => this.t(k), last = ui.latestSlot();
      const html = `<div class="st98-logo"><div class="st98-logo-t">S.T.A.L.K.E.R.</div><div class="st98-logo-s">${esc(T('subtitle'))}</div><div class="st98-logo-e">${esc(T('edition'))}</div></div>
        <div class="st98-menu">${last ? this.btn(T('cont'), 'cont') : ''}${this.btn(T('newGame'), 'new')}${this.btn(T('load'), 'load')}${this.btn(T('options'), 'opt')}${this.btn(T('controls'), 'ctl')}${this.btn(T('credits'), 'cred')}${ui.opts.onExit ? this.btn(T('quit'), 'quit') : ''}</div>
        <div class="st98-foot">v1.0 · GSC Game World tribute · 1998</div>`;
      const r = this.open('main', html, 'st98-mainmenu'); this.escClose = false; this.onKey = null;
      this.wire(r, { cont: () => ui.loadFrom(last), new: () => this.skillMenu(), load: () => this.slotMenu('load', () => this.mainMenu()), opt: () => this.optionsMenu(() => this.mainMenu()), ctl: () => this.controlsMenu(() => this.mainMenu()), cred: () => this.credits(), quit: () => ui.opts.onExit && ui.opts.onExit() });
    }
    skillMenu() {
      const T = k => this.t(k);
      const html = `<h2>${esc(T('skill'))}</h2><div class="st98-menu">${D.SKILLS.map((s, i) => this.btn(this.L(s.name), 's' + i)).join('')}${this.btn(T('back'), 'back')}</div>`;
      const r = this.open('skill', html, 'st98-mainmenu'); this.escClose = false;
      const acts = { back: () => this.mainMenu() }; D.SKILLS.forEach((s, i) => { acts['s' + i] = () => this.ui.newGame(i); });
      this.wire(r, acts); this.onKey = c => { if (c === 'Escape') { this.mainMenu(); return true; } };
    }
    pauseMenu() {
      const ui = this.ui, T = k => this.t(k);
      if (ui.state !== 'play' || !ui.game) return;
      const html = `<h2>${esc(T('title'))}</h2><div class="st98-menu">${this.btn(T('resume'), 'res')}${this.btn(T('save'), 'save')}${this.btn(T('load'), 'load')}${this.btn(T('options'), 'opt')}${this.btn(T('controls'), 'ctl')}${this.btn(T('mainMenu'), 'menu')}</div>`;
      const r = this.open('pause', html, 'st98-pausemenu'); this.escClose = true; this.onKey = null;
      this.wire(r, { res: () => this.close(), save: () => this.slotMenu('save', () => this.pauseMenu()), load: () => this.slotMenu('load', () => this.pauseMenu()), opt: () => this.optionsMenu(() => this.pauseMenu()), ctl: () => this.controlsMenu(() => this.pauseMenu()), menu: () => ui.toMenu() });
    }
    slotMenu(mode, back) {
      const ui = this.ui, T = k => this.t(k), idx = ui.saveIndex();
      const slots = mode === 'save' ? ['quick', '1', '2', '3', '4', '5'] : ['quick', 'auto', '1', '2', '3', '4', '5'];
      const lbl = s => (s === 'quick' ? T('quickSave') : s === 'auto' ? T('autoSave') : `${T('slot')} ${s}`);
      const fmt = m => { if (!m) return `<i>${esc(T('empty'))}</i>`; const hh = Math.floor((m.time % 86400) / 3600), mm = Math.floor((m.time % 3600) / 60), day = Math.floor(m.time / 86400) + 1; return `${esc(m.name)} · ${this.ui.lang === 'ru' ? 'день' : 'day'} ${day}, ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} · ${esc(m.rank || '')} · <span class="dim">${new Date(m.date).toLocaleString()}</span>`; };
      const html = `<h2>${esc(mode === 'save' ? T('save') : T('load'))}</h2><div class="st98-slots">${slots.map(s => `<div class="st98-slot ${!idx[s] && mode === 'load' ? 'off' : ''}" data-act="s_${s}"><b>${esc(lbl(s))}</b><span>${fmt(idx[s])}</span></div>`).join('')}</div><div class="st98-menu row">${this.btn(T('back'), 'back')}</div>`;
      const r = this.open('slots', html, 'st98-pausemenu wide'); this.escClose = false;
      const acts = { back }; for (const s of slots) acts['s_' + s] = () => { if (mode === 'save') { ui.saveTo(s); this.slotMenu(mode, back); } else if (idx[s]) ui.loadFrom(s); };
      this.wire(r, acts); this.onKey = c => { if (c === 'Escape') { back(); return true; } };
    }
    optionsMenu(back) {
      const ui = this.ui, o = ui.options, T = k => this.t(k), onoff = v => (v ? T('on') : T('off'));
      const rows = [
        ['sens', T('sens'), () => String(o.sens), d => { o.sens = clamp(o.sens + d, 1, 20); }],
        ['inv', T('invert'), () => onoff(o.invert), () => { o.invert = !o.invert; }],
        ['fov', T('fov'), () => `${o.fov}°`, d => { o.fov = clamp(o.fov + d * 5, 55, 95); }],
        ['sfx', T('sfx'), () => `${Math.round(o.sfx * 100)}%`, d => { o.sfx = clamp(Math.round((o.sfx + d * 0.1) * 10) / 10, 0, 1); }],
        ['mus', T('music'), () => `${Math.round(o.music * 100)}%`, d => { o.music = clamp(Math.round((o.music + d * 0.1) * 10) / 10, 0, 1); }],
        ['res', T('res'), () => [T('resLow'), T('resMed'), T('resHigh'), T('resFull')][o.res], d => { o.res = (o.res + d + 4) % 4; ui.resize(); }],
        ['grass', T('grass'), () => onoff(o.grass), () => { o.grass = !o.grass; ui.renderer.grassOn = o.grass; const gm = ui.game || ui.demo; if (gm) ui.renderer.setLevel(gm); }],
        ['bob', T('bob'), () => onoff(o.bob), () => { o.bob = !o.bob; }],
        ['fps', T('fps'), () => onoff(o.fps), () => { o.fps = !o.fps; }],
        ['lang', T('lang'), () => (ui.lang === 'ru' ? 'Русский' : 'English'), () => { o.lang = ui.lang === 'ru' ? 'en' : 'ru'; ui.lang = o.lang; ui.S = D.STR[ui.lang]; if (ui.game) ui.game.lang = ui.lang; }]
      ];
      const draw = () => {
        const html = `<h2>${esc(T('options'))}</h2><div class="st98-opts">${rows.map(r => `<div class="st98-opt"><span>${esc(r[1])}</span><button class="st98-btn sm" data-act="m_${r[0]}">◄</button><b>${esc(r[2]())}</b><button class="st98-btn sm" data-act="p_${r[0]}">►</button></div>`).join('')}</div><div class="st98-menu row">${this.btn(T('back'), 'back')}</div>`;
        const root = this.open('options', html, 'st98-pausemenu wide'); this.escClose = false;
        const acts = { back: () => { ui.saveOptions(); back(); } };
        for (const r of rows) { acts['m_' + r[0]] = () => { r[3](-1); ui.saveOptions(); draw(); }; acts['p_' + r[0]] = () => { r[3](1); ui.saveOptions(); draw(); }; }
        this.wire(root, acts); this.onKey = c => { if (c === 'Escape') { ui.saveOptions(); back(); return true; } };
      };
      draw();
    }
    controlsMenu(back) {
      const T = k => this.t(k);
      const html = `<h2>${esc(T('controls'))}</h2><ul class="st98-help">${this.ui.S.help.map(l => `<li>${esc(l)}</li>`).join('')}</ul><div class="st98-menu row">${this.btn(T('back'), 'back')}</div>`;
      const r = this.open('controls', html, 'st98-pausemenu wide'); this.escClose = false; this.wire(r, { back }); this.onKey = c => { if (c === 'Escape') { back(); return true; } };
    }
    credits() {
      const html = `<h2>${esc(this.t('credits'))}</h2><div class="st98-credits">${Q().CREDITS.map(l => `<p>${esc(this.L(l))}</p>`).join('')}</div><div class="st98-menu row">${this.btn(this.t('back'), 'back')}</div>`;
      const r = this.open('credits', html, 'st98-pausemenu wide'); this.escClose = false; this.wire(r, { back: () => this.mainMenu() }); this.onKey = c => { if (c === 'Escape') { this.mainMenu(); return true; } };
    }
    exitPrompt(exit) {
      const g = this.g; if (!g) return;
      const label = this.L(exit.label);
      const html = `<h2>${esc(this.t('leaveLevel'))}</h2><p class="st98-center">${esc(label)}?</p><div class="st98-menu row">${this.btn(this.ui.lang === 'ru' ? 'Да' : 'Yes', 'yes')}${this.btn(this.ui.lang === 'ru' ? 'Нет' : 'No', 'no')}</div>`;
      const r = this.open('exit', html, 'st98-pausemenu'); this.escClose = true;
      this.wire(r, { yes: () => this.ui.travel(exit), no: () => this.close() });
      this.onKey = c => { if (c === 'Enter' || c === 'KeyY') { this.ui.travel(exit); return true; } };
    }
    deathScreen() {
      const ui = this.ui, T = k => this.t(k), last = ui.lastSlot || ui.latestSlot();
      const html = `<h2 class="red">${esc(T('youDied'))}</h2><p class="st98-center dim">${esc(T('deadHint'))}</p><div class="st98-menu">${last ? this.btn(T('loadLast'), 'last') : ''}${this.btn(T('load'), 'load')}${this.btn(T('toMenu'), 'menu')}</div>`;
      const r = this.open('dead', html, 'st98-pausemenu'); this.escClose = false;
      this.wire(r, { last: () => ui.loadFrom(last), load: () => this.slotMenu('load', () => this.deathScreen()), menu: () => ui.toMenu() });
    }

    // ================================================================ intro / ending slides (drawn on the HUD canvas)
    intro() { this.close(); const ui = this.ui; ui.state = 'intro'; this.slides = Q().INTRO.map(l => this.L(l)); this.slideI = 0; this.slideT = 0; this.slideKind = 'intro'; ui.audio.resume(); ui.audio.startMusic('menu'); }
    introNext(skipAll) {
      if (this.ui.state !== 'intro') return;
      const cur = this.slides[this.slideI] || '';
      if (!skipAll && this.slideT * 40 < cur.length) { this.slideT = cur.length / 40 + 0.01; return; }
      this.slideI++; this.slideT = 0; this.ui.audio.play('ui_click');
      if (skipAll || this.slideI >= this.slides.length) { this.ui.startNewGame(); }
    }
    ending() {
      const ui = this.ui; this.close(); ui.state = 'ending'; ui.unlock(); ui.skipPause = true;
      this.slides = Q().ENDING.map(l => this.L(l)).concat(['__credits']); this.slideI = 0; this.slideT = 0; this.slideKind = 'ending';
      ui.saveTo('auto', true); ui.audio.startMusic('menu');
    }
    endingNext() {
      const cur = this.slides[this.slideI] || '';
      if (cur !== '__credits' && this.slideT * 40 < cur.length) { this.slideT = cur.length / 40 + 0.01; return; }
      this.slideI++; this.slideT = 0;
      if (this.slideI >= this.slides.length) this.endMenu();
    }
    endMenu() {
      const ui = this.ui, T = k => this.t(k);
      const html = `<h2>${esc(T('theEnd'))}</h2><p class="st98-center">${esc(T('endHint'))}</p><div class="st98-menu">${this.btn(T('continueFree'), 'cont')}${this.btn(T('toMenu'), 'menu')}</div>`;
      const r = this.open('endmenu', html, 'st98-pausemenu'); this.escClose = false;
      this.wire(r, { cont: () => { ui.state = 'play'; const g = ui.game; g.flags.ended = true; const sp = g.def.spawns.from_agroprom; if (sp) { g.player.x = sp.x; g.player.z = sp.z; g.player.y = g.W.groundAt(sp.x, sp.z, 0.3); g.player.yaw = sp.yaw; } this.close(); }, menu: () => ui.toMenu() });
    }
    drawSlides(c, w, h) {
      const ui = this.ui, dt = 1 / 60; this.slideT += dt;
      c.fillStyle = '#050504'; c.fillRect(0, 0, w, h);
      // rain & lightning on black
      c.strokeStyle = 'rgba(150,160,170,0.25)'; c.lineWidth = 1;
      for (let i = 0; i < 120; i++) { const x = (i * 97 + ui.last * 0.3) % w, y = (i * 53 + ui.last * 0.9) % h; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3, y + 14); c.stroke(); }
      if (Math.random() < 0.004) this.lightning = 1;
      if (this.lightning > 0) { c.fillStyle = `rgba(200,210,255,${this.lightning * 0.25})`; c.fillRect(0, 0, w, h); this.lightning -= 0.05; if (this.lightning > 0.9) ui.audio.play('thunder', null, null, null, 0.6); }
      const cur = this.slides[this.slideI];
      if (cur === '__credits') {
        const lines = Q().CREDITS.map(l => this.L(l)), y0 = h - this.slideT * 40;
        lines.forEach((l, i) => ui.bigText(c, l, w / 2, y0 + i * 44, i === 0 ? 30 : 18, i === 0 ? '#d8c070' : '#d0d0c0'));
        if (y0 + lines.length * 44 < -20) this.endingNext();
      } else if (cur) {
        const n = Math.floor(this.slideT * 40), text = cur.slice(0, n);
        c.font = `20px "Courier New", monospace`; const lines = ui.wrap(c, text, Math.min(760, w - 80));
        c.fillStyle = '#d8d4c0'; c.textAlign = 'left'; c.textBaseline = 'middle';
        const lx = w / 2 - Math.min(760, w - 80) / 2;
        lines.forEach((l, i) => c.fillText(l, lx, h / 2 - lines.length * 14 + i * 28));
        if (n < cur.length && Math.floor(this.slideT * 30) % 3 === 0) ui.audio.play('ui_click', null, null, null, 0.15);
        if (this.slideKind === 'intro' && this.slideI === 0) ui.bigText(c, 'S.T.A.L.K.E.R.', w / 2, h * 0.18, 36, '#c8b060');
      }
      c.font = `13px "Arial Narrow", Arial`; c.fillStyle = '#707060'; c.textAlign = 'right'; c.fillText(this.t('skip'), w - 16, h - 16);
      if (cur && cur !== '__credits' && this.slideT * 40 > cur.length + 120) (this.slideKind === 'intro' ? this.introNext() : this.endingNext());
    }

    // ================================================================ dialogue
    dialog(actor) {
      const g = this.g, ui = this.ui; if (!g || !actor) return;
      let dlgId = actor.wounded && !actor.storyWound ? 'wounded' : actor.dialog || 'generic';
      if (actor.wounded && actor.dialog && actor.storyWound) dlgId = actor.dialog;
      const DLG = Q().DIALOGS[dlgId]; if (!DLG) return;
      actor.talk = 99; if (actor.ai) actor.ai.lookAt = { x: g.player.x, z: g.player.z, t: 5 };
      this.log = []; this.dActor = actor; this.dDef = DLG;
      this.escClose = !(dlgId === 'sidorovich' && !g.flags.intro_done);
      this.dNode(DLG.start(g, actor));
    }
    dNode(id) {
      const g = this.g, a = this.dActor, DLG = this.dDef, ui = this.ui;
      if (id == null) { a.talk = 0; this.close(); return; }
      const node = DLG.nodes[id]; if (!node) { a.talk = 0; this.close(); return; }
      if (node.trade) { this.trade(a); return; }
      const say = typeof node.say === 'function' ? node.say(g, a) : node.say;
      this.log.push({ who: this.L(a.name), text: this.L(say), npc: true });
      const opts = node.opts.filter(o => !o.if || o.if(g, a));
      const fac = a.kind === 'human' ? this.L(D.FACTIONS[a.faction].name) : '';
      const html = `<div class="st98-dlg-head"><canvas class="st98-portrait" width="96" height="96"></canvas><div><div class="st98-dlg-name">${esc(this.L(a.name))}</div><div class="dim">${esc(fac)}${a.rank != null ? ' · ' + esc(this.L((D.RANKS[a.rank] || D.RANKS[0]).name)) : ''}</div></div></div>
        <div class="st98-dlg-log">${this.log.slice(-8).map(l => `<p class="${l.npc ? 'npc' : 'me'}"><b>${esc(l.who)}:</b> ${esc(l.text)}</p>`).join('')}</div>
        <div class="st98-dlg-opts">${opts.map((o, i) => `<div class="st98-dlg-opt" data-act="o${i}">${i + 1}. ${esc(this.L(o.t))}</div>`).join('')}</div>`;
      const r = this.open('dialog', html, 'st98-dialog');
      drawPortrait(r.querySelector('canvas').getContext('2d'), a.look || 'loner', 0, 0, 96);
      const logEl = r.querySelector('.st98-dlg-log'); logEl.scrollTop = logEl.scrollHeight;
      const choose = i => { const o = opts[i]; if (!o) return; this.log.push({ who: this.ui.lang === 'ru' ? 'Меченый' : 'Marked One', text: this.L(o.t), npc: false }); if (o.do) o.do(g, a); ui.handleEvents(g.events); ui.renderer.events(g.events, g); g.events.length = 0; this.dNode(o.go); };
      const acts = {}; opts.forEach((o, i) => { acts['o' + i] = () => choose(i); });
      this.wire(r, acts);
      this.onKey = c => { const m = /^Digit(\d)$/.exec(c); if (m) { choose(+m[1] - 1); return true; } if (c === 'Escape' && this.escClose === false) return true; if (c === 'Escape') { a.talk = 0; } };
    }

    // ================================================================ item lists
    itemTile(it, extra = '', price = null) {
      const d = IT[it.id]; const wide = d.kind === 'weapon' && d.slot === 'rifle' || d.kind === 'suit';
      const cnt = d.kind === 'ammo' ? it.n : it.id === 'bolt' ? '∞' : '';
      const cond = it.cond != null ? `<i class="cond" style="width:${Math.round(it.cond * 100)}%;background:${it.cond < 0.4 ? '#c04020' : it.cond < 0.7 ? '#c0a030' : '#70a040'}"></i>` : '';
      return `<div class="st98-item ${wide ? 'wide' : ''} ${extra}" data-uid="${it.uid}" title="${esc(this.L(d.name))}"><img src="${itemIcon(it.id, wide ? 128 : 64, 64)}" alt="">${cnt !== '' ? `<em>${cnt}</em>` : ''}${price != null ? `<u>${price}</u>` : ''}${cond}</div>`;
    }
    details(it, price) {
      if (!it) return `<div class="dim">${this.ui.lang === 'ru' ? 'Выберите предмет' : 'Select an item'}</div>`;
      const d = IT[it.id], L = this.ui.lang === 'ru';
      const rows = [];
      rows.push(`${L ? 'Вес' : 'Weight'}: ${this.g.itemWeight(it).toFixed(2)} ${L ? 'кг' : 'kg'}`);
      if (it.cond != null) rows.push(`${L ? 'Состояние' : 'Condition'}: ${Math.round(it.cond * 100)}%`);
      if (d.kind === 'weapon' && d.mag) rows.push(`${L ? 'Урон' : 'Damage'}: ${d.dmg}${d.pellets ? '×' + d.pellets : ''} · ${L ? 'Магазин' : 'Mag'}: ${it.mag}/${d.mag} · ${L ? 'Патроны' : 'Ammo'}: ${d.ammo.map(a => this.L(IT[a].name)).join(', ')}`);
      if (d.kind === 'suit') rows.push(Object.entries(d.prot).map(([k, v]) => `${{ bullet: L ? 'пули' : 'bullets', tear: L ? 'разрыв' : 'tear', burn: L ? 'огонь' : 'burn', shock: L ? 'электр.' : 'shock', chem: L ? 'хим.' : 'chem', rad: L ? 'радиация' : 'rad' }[k]} ${Math.round(v * 100)}%`).join(' · '));
      if (d.kind === 'art') rows.push(Object.entries(d.eff).map(([k, v]) => ({ bullet: `${L ? 'Пулестойкость' : 'Bullet res.'} +${Math.round(v * 100)}%`, rad: v > 0 ? `<span class="red">${L ? 'Радиация' : 'Radiation'} +${Math.round(v * 10000)}</span>` : `<span class="green">${L ? 'Выводит радиацию' : 'Removes radiation'}</span>`, hp: `${L ? 'Заживление' : 'Healing'} +${Math.round(v * 100)}`, bleed: v > 0 ? `${L ? 'Свёртываемость крови' : 'Clotting'} +${Math.round(v * 100)}` : `<span class="red">${L ? 'Кровотечение' : 'Bleeding'} +${Math.round(-v * 100)}</span>`, stamina: `${L ? 'Выносливость' : 'Stamina'} +${Math.round(v * 100)}`, shock: `${L ? 'Защита от электричества' : 'Shock res.'} +${Math.round(v * 100)}%`, burn: `${L ? 'Защита от огня' : 'Burn res.'} +${Math.round(v * 100)}%`, weight: `${L ? 'Переносимый вес' : 'Carry weight'} +${v} ${L ? 'кг' : 'kg'}` }[k] || '')).join('<br>'));
      if (d.eff && (d.kind === 'med' || d.kind === 'food')) { const e = d.eff, parts = []; if (e.hp) parts.push(`${L ? 'Здоровье' : 'Health'} +${e.hp}`); if (e.bleed) parts.push(L ? 'Останавливает кровь' : 'Stops bleeding'); if (e.rad) parts.push(`${L ? 'Радиация' : 'Radiation'} −${Math.round(e.rad * 100)}`); if (e.food) parts.push(`${L ? 'Сытость' : 'Satiety'} +${Math.round(e.food * 100)}`); if (e.stamina) parts.push(L ? 'Выносливость' : 'Stamina'); rows.push(parts.join(' · ')); }
      if (price != null) rows.push(`<b>${this.t('price')}: ${price} RU</b>`);
      return `<div class="st98-det-name">${esc(this.L(d.name))}</div><img class="st98-det-img" src="${itemIcon(it.id, 128, 64)}"><div class="st98-det-desc">${esc(this.L(d.desc))}</div><div class="st98-det-rows">${rows.map(r => `<div>${r}</div>`).join('')}</div>`;
    }
    statusBars() {
      const g = this.g, p = g.player, L = this.ui.lang === 'ru';
      const bar = (lbl, v, col) => `<div class="st98-sbar"><span>${lbl}</span><i><b style="width:${Math.round(clamp(v, 0, 1) * 100)}%;background:${col}"></b></i></div>`;
      return bar(L ? 'Здоровье' : 'Health', p.hp / 100, '#b82a1a') + bar(L ? 'Выносливость' : 'Stamina', p.stamina / 100, '#c8a848') + bar(L ? 'Радиация' : 'Radiation', p.rad, '#d0d020') + bar(L ? 'Кровотечение' : 'Bleeding', p.bleed / 2, '#a01010') + bar(L ? 'Сытость' : 'Satiety', p.food, '#70a040') +
        `<div class="st98-prot">${L ? 'Защита' : 'Protection'}: ${L ? 'пули' : 'bullets'} ${Math.round(g.prot('bullet') * 100)}% · ${L ? 'радиация' : 'rad'} ${Math.round(g.prot('rad') * 100)}% · ${L ? 'огонь' : 'burn'} ${Math.round(g.prot('burn') * 100)}% · ${L ? 'электр.' : 'shock'} ${Math.round(g.prot('shock') * 100)}%</div>`;
    }

    // ================================================================ inventory
    inventory(sel) {
      const g = this.g, T = k => this.t(k), L = this.ui.lang === 'ru'; if (!g) return;
      const slotBox = (label, uid, cls = '') => { const it = uid ? g.item(uid) : null; return `<div class="st98-slotbox ${cls}"><div class="lbl">${esc(label)}</div>${it ? this.itemTile(it, sel === it.uid ? 'sel' : '') : '<div class="st98-empty"></div>'}</div>`; };
      const bag = g.inv.filter(i => !g.isEquipped(i.uid)).sort((a, b) => ['weapon', 'suit', 'ammo', 'grenade', 'med', 'food', 'art', 'part', 'quest', 'misc'].indexOf(IT[a.id].kind) - ['weapon', 'suit', 'ammo', 'grenade', 'med', 'food', 'art', 'part', 'quest', 'misc'].indexOf(IT[b.id].kind));
      const selIt = sel ? g.item(sel) : null, d = selIt ? IT[selIt.id] : null;
      const actions = [];
      if (selIt) {
        if (d.kind === 'med') actions.push(['use', T('use')]); if (d.kind === 'food') actions.push(['use', selIt.id === 'vodka' || selIt.id === 'energy' ? T('drink') : T('eat')]);
        if (d.kind === 'weapon' || d.kind === 'suit') actions.push(g.isEquipped(sel) ? ['uneq', T('unequip')] : ['eq', T('equip')]);
        if (d.kind === 'art') actions.push(g.slots.belt.includes(sel) ? ['uneq', T('fromBelt')] : ['eq', T('toBelt')]);
        if (d.kind === 'weapon' && selIt.mag > 0) actions.push(['unload', T('unload')]);
        if (!d.noDrop && d.kind !== 'quest') actions.push(['drop', T('drop')]);
      }
      const wt = g.weight(), mw = g.maxWeight();
      const html = `<div class="st98-head"><span>${esc(T('inventory'))}</span><button class="st98-x" data-act="close">✕</button></div>
      <div class="st98-inv">
        <div class="st98-inv-left">
          <div class="st98-slots-row">${slotBox(T('outfit'), g.slots.suit, 'suit')}${slotBox(this.L(IT.knife.name), g.slots.knife)}${slotBox(L ? 'Пистолет' : 'Pistol', g.slots.pistol)}</div>
          <div class="st98-slots-row">${slotBox(L ? 'Основное оружие' : 'Primary weapon', g.slots.rifle, 'wide')}</div>
          <div class="lbl">${esc(T('belt'))}</div><div class="st98-belt">${g.slots.belt.map(u => { const it = u ? g.item(u) : null; return it ? this.itemTile(it, sel === u ? 'sel' : '') : '<div class="st98-empty"></div>'; }).join('')}</div>
          <div class="st98-status">${this.statusBars()}</div>
        </div>
        <div class="st98-inv-mid"><div class="st98-grid">${bag.map(it => this.itemTile(it, sel === it.uid ? 'sel' : '')).join('')}</div></div>
        <div class="st98-inv-right"><div class="st98-details">${this.details(selIt)}</div><div class="st98-actions">${actions.map(a => this.btn(a[1], 'a_' + a[0], 'sm')).join('')}</div></div>
      </div>
      <div class="st98-foot2"><span class="${wt > mw ? 'red' : ''}">${esc(T('weight'))}: ${wt.toFixed(1)} / ${mw.toFixed(0)} ${L ? 'кг' : 'kg'}</span><span>${esc(T('money'))}: <b>${g.money}</b> RU</span><span class="dim">${esc(g.L(g.rank().name))}</span></div>`;
      const r = this.open('inventory', html, 'st98-invwin'); this.escClose = true;
      const acts = {
        close: () => this.close(),
        a_use: () => { g.useItem(sel); this.flush(); this.inventory(); },
        a_eq: () => { g.equip(sel); this.flush(); this.inventory(sel); }, a_uneq: () => { g.unequip(sel); this.flush(); this.inventory(sel); },
        a_unload: () => { g.unloadWeapon(sel); this.flush(); this.inventory(sel); }, a_drop: () => { g.dropItem(sel); this.flush(); this.inventory(); }
      };
      this.wire(r, acts);
      r.querySelectorAll('.st98-item').forEach(el => {
        el.addEventListener('click', e => { e.stopPropagation(); this.ui.audio.play('ui_click'); this.inventory(+el.dataset.uid); });
        el.addEventListener('dblclick', e => { e.stopPropagation(); const u = +el.dataset.uid, it = g.item(u); if (!it) return; const k = IT[it.id].kind; if (k === 'med' || k === 'food') g.useItem(u); else if (k === 'weapon' || k === 'suit' || k === 'art') { if (g.isEquipped(u)) g.unequip(u); else g.equip(u); } this.flush(); this.inventory(g.item(u) ? u : undefined); });
      });
      this.onKey = null;
    }
    flush() { const g = this.g, ui = this.ui; ui.handleEvents(g.events); ui.renderer.events(g.events, g); g.events.length = 0; }

    // ================================================================ trade
    trade(actor, sel, side) {
      const g = this.g, T = k => this.t(k), L = this.ui.lang === 'ru';
      const tr = Q().traderState(g, actor.trade); if (!tr) { this.close(); return; }
      const mine = g.inv.filter(i => !g.isEquipped(i.uid) && !IT[i.id].noDrop && IT[i.id].kind !== 'quest');
      const stock = tr.stock.map((e, i) => Object.assign({ uid: 'st' + i, idx: i }, e, { n: e.id && IT[e.id].kind === 'ammo' ? IT[e.id].box : e.n }));
      const selMine = side === 'me' ? g.item(sel) : null, selSt = side === 'tr' ? stock.find(s => s.uid === sel) : null;
      const priceMine = selMine ? g.sellPrice(selMine, tr) : null, priceSt = selSt ? g.buyPrice(selSt.id, selSt.cond, tr) : null;
      const html = `<div class="st98-head"><span>${esc(T('trade'))}: ${esc(this.L(tr.name))}</span><button class="st98-x" data-act="close">✕</button></div>
      <div class="st98-trade">
        <div class="st98-trcol"><div class="lbl">${L ? 'Ваши вещи' : 'Your items'} · ${g.money} RU</div><div class="st98-grid">${mine.map(it => this.itemTile(it, side === 'me' && sel === it.uid ? 'sel' : '', g.sellPrice(it, tr))).join('')}</div></div>
        <div class="st98-trmid"><div class="st98-details">${selMine ? this.details(selMine, priceMine) : selSt ? this.details(Object.assign({ uid: 0 }, selSt, { n: IT[selSt.id].kind === 'ammo' ? IT[selSt.id].box : undefined, cond: selSt.cond == null && (IT[selSt.id].kind === 'weapon' || IT[selSt.id].kind === 'suit') ? 1 : selSt.cond }), priceSt) : this.details(null)}</div>
          <div class="st98-actions">${selMine ? this.btn(`${T('sell')} (+${priceMine})`, 'sell') : ''}${selSt ? this.btn(`${T('buy')} (−${priceSt})`, 'buy', g.money < priceSt ? 'off' : '') : ''}${this.btn(L ? 'Назад к разговору' : 'Back to talk', 'talk', 'sm')}</div></div>
        <div class="st98-trcol"><div class="lbl">${esc(this.L(tr.name))} · ${tr.money} RU</div><div class="st98-grid">${stock.map(s => `<div class="st98-item ${IT[s.id].kind === 'weapon' && IT[s.id].slot === 'rifle' || IT[s.id].kind === 'suit' ? 'wide' : ''} ${side === 'tr' && sel === s.uid ? 'sel' : ''}" data-st="${s.uid}"><img src="${itemIcon(s.id, IT[s.id].kind === 'weapon' && IT[s.id].slot === 'rifle' || IT[s.id].kind === 'suit' ? 128 : 64, 64)}">${s.n != null && IT[s.id].kind !== 'ammo' ? `<em>${s.n}</em>` : IT[s.id].kind === 'ammo' ? `<em>${IT[s.id].box}</em>` : ''}<u>${g.buyPrice(s.id, s.cond, tr)}</u></div>`).join('')}</div></div>
      </div>
      <div class="st98-foot2"><span>${esc(T('weight'))}: ${g.weight().toFixed(1)} / ${g.maxWeight().toFixed(0)}</span><span>${esc(T('money'))}: <b>${g.money}</b> RU</span></div>`;
      const r = this.open('trade', html, 'st98-invwin'); this.escClose = true;
      this.wire(r, {
        close: () => { actor.talk = 0; this.close(); },
        talk: () => { this.log = this.log || []; this.dActor = actor; this.dDef = Q().DIALOGS[actor.dialog] || Q().DIALOGS.generic; this.dNode('root'); },
        sell: () => { g.sell(tr, sel); this.flush(); this.trade(actor); },
        buy: () => { if (g.buy(tr, tr.stock[selSt.idx])) { this.flush(); this.trade(actor, tr.stock[selSt.idx] ? sel : null, 'tr'); } else { this.flush(); } }
      });
      r.querySelectorAll('[data-uid]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); this.ui.audio.play('ui_click'); this.trade(actor, +el.dataset.uid, 'me'); }));
      r.querySelectorAll('[data-st]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); this.ui.audio.play('ui_click'); this.trade(actor, el.dataset.st, 'tr'); }));
      this.onKey = c => { if (c === 'Escape') actor.talk = 0; };
    }

    // ================================================================ loot
    loot(cont, kind, sel, side) {
      const g = this.g, T = k => this.t(k), L = this.ui.lang === 'ru';
      const list = cont.items || cont.inv;
      const title = kind === 'stash' ? (this.L(cont.name) || (L ? 'Тайник' : 'Stash')) : `${T('search')}: ${this.L(cont.name)}`;
      const selC = side === 'c' ? list.find(i => i.uid === sel) : null, selM = side === 'me' ? g.item(sel) : null;
      const mine = g.inv.filter(i => !g.isEquipped(i.uid) && !IT[i.id].noDrop && IT[i.id].kind !== 'quest');
      const html = `<div class="st98-head"><span>${esc(title)}</span><button class="st98-x" data-act="close">✕</button></div>
      <div class="st98-trade">
        <div class="st98-trcol"><div class="lbl">${L ? 'Ваши вещи' : 'Your items'}</div><div class="st98-grid">${mine.map(it => this.itemTile(it, side === 'me' && sel === it.uid ? 'sel' : '')).join('')}</div></div>
        <div class="st98-trmid"><div class="st98-details">${this.details(selC || selM)}</div><div class="st98-actions">${selC ? this.btn(T('take'), 'take') : ''}${selM && kind === 'stash' ? this.btn(L ? 'Положить' : 'Put', 'put') : ''}${this.btn(T('takeAll'), 'all')}</div>${cont.money ? `<div class="st98-money">${L ? 'Деньги' : 'Money'}: ${cont.money} RU ${this.btn(T('take'), 'money', 'sm')}</div>` : ''}</div>
        <div class="st98-trcol"><div class="lbl">${esc(title)}</div><div class="st98-grid">${list.length ? list.map(it => this.itemTile(it, side === 'c' && sel === it.uid ? 'sel' : '').replace('data-uid', 'data-cuid')).join('') : `<div class="dim">${esc(T('empty'))}</div>`}</div></div>
      </div>
      <div class="st98-foot2"><span>${esc(T('weight'))}: ${g.weight().toFixed(1)} / ${g.maxWeight().toFixed(0)}</span><span>${esc(T('money'))}: <b>${g.money}</b> RU</span></div>`;
      const r = this.open('loot', html, 'st98-invwin'); this.escClose = true;
      this.wire(r, {
        close: () => this.close(),
        take: () => { g.lootTake(cont, sel); this.flush(); this.loot(cont, kind); },
        put: () => { g.lootPut(cont, sel); this.flush(); this.loot(cont, kind); },
        all: () => { g.lootAll(cont); this.flush(); this.close(); },
        money: () => { g.lootMoney(cont); this.flush(); this.loot(cont, kind); }
      });
      r.querySelectorAll('[data-cuid]').forEach(el => { el.addEventListener('click', e => { e.stopPropagation(); this.ui.audio.play('ui_click'); this.loot(cont, kind, +el.dataset.cuid, 'c'); }); el.addEventListener('dblclick', e => { e.stopPropagation(); g.lootTake(cont, +el.dataset.cuid); this.flush(); this.loot(cont, kind); }); });
      r.querySelectorAll('[data-uid]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); this.ui.audio.play('ui_click'); this.loot(cont, kind, +el.dataset.uid, 'me'); }));
      this.onKey = c => { if (c === 'KeyF' || c === 'Space') { g.lootAll(cont); this.flush(); this.close(); return true; } };
    }

    // ================================================================ PDA
    mapCanvas(g) {
      const id = g.levelId; if (this.maps[id]) return this.maps[id];
      const W = g.W, sc = 2, w = (W.bx1 - W.bx0) * sc, h = (W.bz1 - W.bz0) * sc;
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
      const img = x.createImageData(w, h), d = img.data;
      let mn = Infinity, mx = -Infinity; for (let j = 0; j < h; j += 4) for (let i = 0; i < w; i += 4) { const v = W.terrainAt(W.bx1 - i / sc, W.bz1 - j / sc); mn = Math.min(mn, v); mx = Math.max(mx, v); }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const wx = W.bx1 - i / sc, wz = W.bz1 - j / sc, v = (W.terrainAt(wx, wz) - mn) / (mx - mn || 1);
        const sh = (W.terrainAt(wx + 1, wz) - W.terrainAt(wx - 1, wz)) * 0.12;
        const k = (j * w + i) * 4, base = 60 + v * 70 + sh * 60;
        d[k] = base * 0.8; d[k + 1] = base * 0.95; d[k + 2] = base * 0.62; d[k + 3] = 255;
        if (Math.round(W.terrainAt(wx, wz)) % 3 === 0 && Math.abs(W.terrainAt(wx, wz) - Math.round(W.terrainAt(wx, wz))) < 0.06) { d[k] *= 0.8; d[k + 1] *= 0.8; d[k + 2] *= 0.8; }
      }
      x.putImageData(img, 0, 0);
      const P = (wx, wz) => [(W.bx1 - wx) * sc, (W.bz1 - wz) * sc];
      for (const t of g.def.trees) { const [px, py] = P(t.x, t.z); x.fillStyle = 'rgba(30,60,20,0.5)'; x.beginPath(); x.arc(px, py, 3 * t.s, 0, 7); x.fill(); }
      for (const r of g.def.roads) { x.strokeStyle = r.kind === 'asphalt' ? '#6a6a60' : '#8a7a58'; x.lineWidth = r.w * sc; x.lineCap = 'round'; x.beginPath(); r.pts.forEach((p, i) => { const [px, py] = P(p[0], p[1]); if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.stroke(); }
      for (const r of g.def.rails) { x.strokeStyle = '#3a3a34'; x.lineWidth = 3; x.setLineDash([6, 4]); x.beginPath(); r.pts.forEach((p, i) => { const [px, py] = P(p[0], p[1]); if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.stroke(); x.setLineDash([]); }
      for (const wv of g.def.water) { const [ax, ay] = P(wv.x1, wv.z1), [bx, by] = P(wv.x0, wv.z0); x.fillStyle = '#3a5a6a'; x.fillRect(ax, ay, bx - ax, by - ay); }
      for (const b of g.def.boxes) { if (!b.render || b.y1 - b.y0 < 1.5 || b.thin) continue; const [ax, ay] = P(b.x1, b.z1), [bx, by] = P(b.x0, b.z0); x.fillStyle = b.tex === 'fence' ? '#8a8a80' : '#4a4a44'; x.fillRect(ax, ay, Math.max(1, bx - ax), Math.max(1, by - ay)); }
      for (const r of g.def.rads) { const [px, py] = P(r.x, r.z); x.fillStyle = 'rgba(220,210,40,0.18)'; x.beginPath(); x.arc(px, py, r.r * sc, 0, 7); x.fill(); }
      return (this.maps[id] = { c, sc });
    }
    pda(tab = 'tasks') {
      const g = this.g, T = k => this.t(k), L = this.ui.lang === 'ru'; if (!g) return;
      this.pdaTab = tab;
      const tabs = [['tasks', T('tasks')], ['map', T('map')], ['diary', T('diary')], ['contacts', T('contacts')], ['stats', T('stats')]];
      let body = '';
      if (tab === 'tasks') {
        const act = g.questOrder.filter(q => g.quests[q].state === 'active'), dn = g.questOrder.filter(q => g.quests[q].state !== 'active');
        const QS = Q().QUESTS;
        const card = id => { const s = g.quests[id], q = QS[id], st = q.stages[Math.min(s.stage, q.stages.length - 1)]; const hist = q.stages.slice(0, s.stage).map(x => `<li class="dim">${esc(this.L(x.text))}</li>`).join(''); return `<div class="st98-task ${s.state} ${q.main ? 'main' : ''}"><b>${q.main ? '★ ' : ''}${esc(this.L(q.title))}</b>${s.state === 'active' ? `<p>${esc(this.L(st.text))}</p>${hist ? `<ul>${hist}</ul>` : ''}` : `<span class="tag">${esc(T(s.state === 'done' ? 'done' : 'failed'))}</span>`}</div>`; };
        body = `<div class="st98-tasks"><h3>${esc(T('active'))}</h3>${act.length ? act.map(card).join('') : `<p class="dim">${esc(T('noTasks'))}</p>`}${dn.length ? `<h3>${esc(T('done'))}</h3>${dn.slice().reverse().map(card).join('')}` : ''}</div>`;
      } else if (tab === 'map') body = `<div class="st98-mapwrap"><canvas class="st98-map"></canvas><div class="st98-maplegend">${L ? '▲ вы · ◆ задание · ■ тайник · ● одиночки' : '▲ you · ◆ task · ■ stash · ● loners'}<br>${esc(this.L(g.def.name))}${Q().markers(g).filter(m => m.level && m.level !== g.levelId).map(m => `<br>◆ ${esc(this.L(Q().QUESTS[m.q].title))} → ${esc(m.level === 'garbage' ? (L ? 'Свалка' : 'Garbage') : (L ? 'Кордон' : 'Cordon'))}`).join('')}</div></div>`;
      else if (tab === 'diary') {
        const news = g.news.slice().reverse().slice(0, 30);
        body = `<div class="st98-tasks"><h3>${L ? 'Записи' : 'Entries'}</h3>${g.diary.map(e => `<div class="st98-task"><b>${esc(e.title)}</b><p>${esc(e.text)}</p></div>`).join('') || `<p class="dim">—</p>`}
          <h3>${L ? 'Энциклопедия' : 'Encyclopedia'}</h3>${Object.values(D.ANOMALIES).map(a => `<div class="st98-task"><b>${esc(this.L(a.name))}</b></div>`).join('')}
          <h3>${L ? 'Сообщения' : 'Messages'}</h3>${news.map(n => { const hh = Math.floor((n.time % 86400) / 3600), mm = Math.floor((n.time % 3600) / 60); return `<div class="st98-news"><span class="dim">${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}</span> <b>${esc(n.from)}:</b> ${esc(n.text)}</div>`; }).join('')}</div>`;
      } else if (tab === 'contacts') {
        const p = g.player, near = g.actors.filter(a => !a.hidden && !a.dead && a.kind === 'human' && Math.hypot(a.x - p.x, a.z - p.z) < 70).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
        body = `<div class="st98-tasks">${near.map(a => { const att = g.attitudeOf(a, 'player'); return `<div class="st98-contact"><canvas width="40" height="40" data-look="${esc(a.look)}"></canvas><div><b class="${att < 0 ? 'red' : att > 0 ? 'green' : ''}">${esc(this.L(a.name))}</b><br><span class="dim">${esc(this.L(D.FACTIONS[a.faction].name))} · ${esc(this.L((D.RANKS[a.rank] || D.RANKS[0]).name))} · ${Math.round(Math.hypot(a.x - p.x, a.z - p.z))} ${L ? 'м' : 'm'}</span></div></div>`; }).join('') || `<p class="dim">—</p>`}</div>`;
      } else {
        const st = g.stats, r = g.rank();
        const gw = f => { const v = g.goodwill[f] || 0; return `<span class="${v <= -300 ? 'red' : v >= 300 ? 'green' : ''}">${v <= -300 ? T('enemy') : v >= 300 ? T('friend') : T('neutral')} (${v})</span>`; };
        body = `<div class="st98-stats"><div class="st98-contact big"><canvas width="96" height="96" data-look="loner"></canvas><div><b>${L ? 'Меченый' : 'Marked One'}</b><br>${esc(T('rank'))}: ${esc(this.L(r.name))}<br>${esc(T('rating'))}: ${st.rating}<br>${esc(T('money'))}: ${g.money} RU</div></div>
          <table><tr><td>${esc(T('kills'))} — ${esc(T('humans'))}</td><td>${st.human}</td></tr><tr><td>${esc(T('kills'))} — ${esc(T('mutants'))}</td><td>${st.mutant}</td></tr><tr><td>${esc(T('artifacts'))}</td><td>${st.arts}</td></tr><tr><td>${esc(T('stashes'))}</td><td>${st.stashes}</td></tr><tr><td>${esc(T('days'))}</td><td>${g.day()}</td></tr>
          ${['stalker', 'bandit', 'military', 'duty'].map(f => `<tr><td>${esc(T('reputation'))}: ${esc(this.L(D.FACTIONS[f].name))}</td><td>${gw(f)}</td></tr>`).join('')}</table></div>`;
      }
      const html = `<div class="st98-head"><span>${esc(T('pda'))}</span><button class="st98-x" data-act="close">✕</button></div><div class="st98-tabs">${tabs.map(t => `<button class="st98-tab ${t[0] === tab ? 'on' : ''}" data-act="t_${t[0]}">${esc(t[1])}</button>`).join('')}</div><div class="st98-pdabody">${body}</div>`;
      const r = this.open('pda', html, 'st98-pda'); this.escClose = true;
      const acts = { close: () => this.close() }; for (const t of tabs) acts['t_' + t[0]] = () => this.pda(t[0]);
      this.wire(r, acts);
      r.querySelectorAll('canvas[data-look]').forEach(cv => drawPortrait(cv.getContext('2d'), cv.dataset.look, 0, 0, cv.width));
      if (tab === 'map') this.drawPdaMap(r.querySelector('.st98-map'));
      this.onKey = null;
    }
    drawPdaMap(cv) {
      const g = this.g, W = g.W, m = this.mapCanvas(g), box = cv.parentElement.getBoundingClientRect();
      const k = Math.min((box.width - 180) / m.c.width, (box.height - 10) / m.c.height, 1.2);
      cv.width = Math.max(100, Math.floor(m.c.width * k)); cv.height = Math.max(100, Math.floor(m.c.height * k));
      const x = cv.getContext('2d'); x.drawImage(m.c, 0, 0, cv.width, cv.height);
      const P = (wx, wz) => [(W.bx1 - wx) * m.sc * k, (W.bz1 - wz) * m.sc * k];
      x.font = 'bold 12px "Arial Narrow", Arial'; x.textAlign = 'center';
      for (const l of g.def.labels) { const [px, py] = P(l.x, l.z); x.lineWidth = 3; x.strokeStyle = 'rgba(0,0,0,0.8)'; x.strokeText(this.L(l.t), px, py); x.fillStyle = '#f0e8c0'; x.fillText(this.L(l.t), px, py); }
      for (const a of g.actors) if (!a.dead && !a.hidden && a.kind === 'human' && g.attitudeOf(a, 'player') > 0 && Math.hypot(a.x - g.player.x, a.z - g.player.z) < 120) { const [px, py] = P(a.x, a.z); x.fillStyle = '#50e040'; x.beginPath(); x.arc(px, py, 2.5, 0, 7); x.fill(); }
      for (const id in g.knownStashes) { const s = g.knownStashes[id]; if (s.level !== g.levelId) continue; const st = g.stashes.find(q => q.id === id); if (st && st.opened) continue; const [px, py] = P(s.x, s.z); x.fillStyle = '#40a0ff'; x.fillRect(px - 4, py - 4, 8, 8); x.strokeStyle = '#000'; x.strokeRect(px - 4, py - 4, 8, 8); }
      for (const mk of Q().markers(g)) { if (mk.x == null) continue; const [px, py] = P(mk.x, mk.z); x.fillStyle = mk.main ? '#ffd040' : '#80c8ff'; x.beginPath(); x.moveTo(px, py - 7); x.lineTo(px + 6, py); x.lineTo(px, py + 7); x.lineTo(px - 6, py); x.closePath(); x.fill(); x.strokeStyle = '#000'; x.stroke(); }
      for (const e of g.def.exits) { const [px, py] = P((e.x0 + e.x1) / 2, (e.z0 + e.z1) / 2); x.fillStyle = '#ff9040'; x.font = 'bold 11px Arial'; x.fillText('⇨ ' + this.L(e.label), px, py + (py < 20 ? 14 : -6)); }
      const p = g.player, [px, py] = P(p.x, p.z);
      x.save(); x.translate(px, py); x.rotate(-p.yaw); x.fillStyle = '#ff3020'; x.beginPath(); x.moveTo(0, -9); x.lineTo(6, 7); x.lineTo(-6, 7); x.closePath(); x.fill(); x.strokeStyle = '#fff'; x.stroke(); x.restore();
    }
  }

  S.Windows = Windows; S.itemIcon = itemIcon; S.drawItemIcon = drawItemIcon;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Stalker98 = globalThis.Stalker98 || {});
