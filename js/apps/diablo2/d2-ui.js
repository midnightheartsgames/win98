(function (D) {
  'use strict';
  const { W, H, SKILLS, COL } = D;
  const SAVE_KEY = 'diablo2_98_chars';
  const SET_KEY = 'diablo2_98_settings';
  const SEEN_KEY = 'diablo2_98_seen';

  function store(key, val) {
    try {
      if (val === undefined) { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
    return null;
  }

  class UI {
    constructor(root, opts) {
      this.root = root;
      this.opts = opts || {};
      root.classList.add('d2g');
      root.tabIndex = 0;
      root.innerHTML = '<canvas class="d2g-cv" width="' + W + '" height="' + H + '"></canvas>';
      this.cv = root.querySelector('canvas');
      this.c = this.cv.getContext('2d');
      this.settings = Object.assign({ music: 0.45, sfx: 0.7, labels: false, lowLight: false }, store(SET_KEY) || {});
      this.audio = new D.Audio();
      this.audio.setVolumes(this.settings.music, this.settings.sfx);
      this.screen = 'menu';
      this.t = 0;
      this.mx = W / 2; this.my = H / 2;
      this.buttons = { 0: false, 2: false };
      this.keys = {};
      this.msgs = [];
      this.overheads = [];
      this.modal = null;
      this.selIdx = 0;
      this.nameInput = '';
      this.hardcore = false;
      this.createSel = null;
      this.g = null;
      this.r = null;
      this.left = null; this.right = null;
      this.destroyed = false;
      this.listeners = [];
      this.bind();
      this.resize();
      if (typeof ResizeObserver !== 'undefined') { this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(root); }
      this.last = performance.now();
      this.frame = this.frame.bind(this);
      this.raf = requestAnimationFrame(this.frame);
      this.audio.music('menu');
      this.saveTimer = 0;
    }

    destroy() {
      if (this.destroyed) return;
      this.saveGame();
      this.destroyed = true;
      cancelAnimationFrame(this.raf);
      if (this.ro) this.ro.disconnect();
      this.audio.close();
      for (const [el, ev, fn] of this.listeners) el.removeEventListener(ev, fn);
      this.root.innerHTML = '';
    }

    isActive() { return !this.opts.isActive || this.opts.isActive(); }
    on(el, ev, fn, o) { el.addEventListener(ev, fn, o); this.listeners.push([el, ev, fn]); }

    bind() {
      const cv = this.cv;
      const pos = e => {
        const r = cv.getBoundingClientRect();
        this.mx = Math.max(0, Math.min(W - 1, (e.clientX - r.left) / r.width * W));
        this.my = Math.max(0, Math.min(H - 1, (e.clientY - r.top) / r.height * H));
      };
      this.on(cv, 'mousemove', e => pos(e));
      this.on(cv, 'mousedown', e => {
        e.preventDefault();
        this.root.focus({ preventScroll: true });
        this.audio.resume();
        if (this.audio.want) this.audio.music(this.audio.want);
        pos(e);
        const b = e.button === 2 ? 2 : 0;
        this.buttons[b] = true;
        this.mods = { shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey, alt: e.altKey };
        const now = performance.now();
        const dbl = b === 0 && now - (this.lastDown || 0) < 320;
        this.lastDown = now;
        this.down(b, dbl);
      });
      this.on(window, 'mouseup', e => { const b = e.button === 2 ? 2 : 0; this.buttons[b] = false; if (b === 0) this.holdTarget = null; if (b === 2) this.rightHold = false; });
      this.on(cv, 'contextmenu', e => e.preventDefault());
      this.on(this.root, 'keydown', e => this.key(e, true));
      this.on(this.root, 'keyup', e => this.key(e, false));
      this.on(this.root, 'blur', () => { this.buttons[0] = this.buttons[2] = false; this.keys = {}; });
    }

    resize() {
      const rw = this.root.clientWidth || W, rh = this.root.clientHeight || H;
      const s = Math.min(rw / W, rh / H);
      this.cv.style.width = Math.floor(W * s) + 'px';
      this.cv.style.height = Math.floor(H * s) + 'px';
    }

    saves() { return store(SAVE_KEY) || {}; }

    chars() {
      const s = this.saves();
      return Object.values(s).sort((a, b) => (b.lastPlayed || b.created || 0) - (a.lastPlayed || a.created || 0));
    }

    anySeen(k) { const s = store(SEEN_KEY) || {}; return !!s[k]; }
    markSeen(k) { const s = store(SEEN_KEY) || {}; s[k] = 1; store(SEEN_KEY, s); }

    createChar(name, cls, hc) {
      const ch = D.newChar(name, cls, hc);
      ch.lastPlayed = Date.now();
      const s = this.saves();
      s[name] = D.serializeChar(ch);
      store(SAVE_KEY, s);
      this.createSel = null;
      this.selIdx = 0;
      this.startGame(name, 0);
    }

    deleteChar(name) {
      const s = this.saves();
      delete s[name];
      store(SAVE_KEY, s);
      this.selIdx = 0;
    }

    go(screen) {
      this.screen = screen;
      this.modal = null;
      if (screen === 'menu' || screen === 'select' || screen === 'create') this.audio.music('menu');
      if (screen === 'credits') { this.creditsT = this.t; this.audio.music('tristram'); }
    }

    modalConnect() {
      this.modal = { text: 'Подключение к Battle.net...\nШлюз: RUBATTLE.NET', buttons: [['cancel', 'ОТМЕНА']], spinner: true, on: () => { this.modal = null; clearTimeout(this.connT); } };
      this.connT = setTimeout(() => {
        if (this.modal && this.modal.spinner) this.modal = { text: 'Не удалось подключиться к Battle.net.\nСервер RUBATTLE.NET не отвечает. Проверьте подключение к Интернету или попробуйте позже.', buttons: [['ok', 'ОК']] };
      }, 2600);
    }

    playCine(id, done) {
      this.screen = 'cine';
      this.cine = { id, t0: this.t, done };
      this.markSeen(id);
      this.audio.music(id === 'prologue' ? 'wild' : 'tristram');
    }

    startGame(name, diff) {
      const raw = this.saves()[name];
      if (!raw) return;
      const ch = D.deserializeChar(raw);
      const begin = () => {
        this.screen = 'loading';
        this.loadT = this.t;
        this.pending = () => {
          D.Sprites.clearCache();
          this.g = new D.Game(ch, { diff });
          this.r = new D.Renderer(this.c);
          this.left = this.right = null;
          this.menu = null; this.help = false; this.automap = false; this.npcMenu = null; this.talk = null; this.skillPick = null;
          this.msgs = [];
          this.processEvents();
          this.screen = 'game';
          this.msg('Добро пожаловать в лагерь разбойниц. Нажмите H для справки.', COL.dim);
          this.saveGame();
        };
      };
      if (!ch.seen || !ch.seen.prologue) { ch.seen = ch.seen || {}; ch.seen.prologue = true; this.playCine('prologue', begin); }
      else begin();
    }

    saveGame() {
      const g = this.g;
      if (!g) return;
      const data = g.saveState();
      data.lastPlayed = Date.now();
      const s = this.saves();
      s[data.name] = data;
      store(SAVE_KEY, s);
    }

    exitToSelect() {
      this.saveGame();
      this.g = null; this.r = null;
      this.go('select');
    }

    exit() {
      this.saveGame();
      if (this.opts.onExit) this.opts.onExit();
      else this.go('menu');
    }

    msg(text, c) { this.msgs.push({ text, c: c || COL.white, t: this.t }); if (this.msgs.length > 30) this.msgs.shift(); }

    frame(now) {
      if (this.destroyed) return;
      const dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      this.t += dt;
      try { this.update(dt); this.draw(dt); } catch (e) { if (typeof console !== 'undefined') console.error(e); }
      this.raf = requestAnimationFrame(this.frame);
    }

    update(dt) {
      if (this.screen === 'loading' && this.t - this.loadT > 0.45 && this.pending) { const p = this.pending; this.pending = null; p(); }
      if (this.screen !== 'game' || !this.g) return;
      const g = this.g;
      if (!this.menu && !this.help) {
        this.holdInput();
        g.update(dt);
      }
      this.processEvents();
      this.saveTimer += dt;
      if (this.saveTimer > 60) { this.saveTimer = 0; this.saveGame(); }
      this.overheads = this.overheads.filter(o => this.t - o.t < 2.2);
    }

    worldBlocked(mx, my) {
      if (my >= 553) return true;
      if (D.HUD.inCircle(mx, my, D.HUD.L.lorb) || D.HUD.inCircle(mx, my, D.HUD.L.rorb)) return true;
      if (this.left && mx < D.Panels.PW && my < D.Panels.PY + D.Panels.PH) return true;
      if (this.right && mx >= D.Panels.RX && my < D.Panels.PY + D.Panels.PH) return true;
      if (this.miniOpen && D.HUD.inR(mx, my, D.HUD.L.mini)) return true;
      return false;
    }

    holdInput() {
      const g = this.g, h = g.hero;
      if (h.dead || this.skillPick || this.npcMenu) return;
      if (!this.r || !this.r.cam) return;
      const wp = this.r.toWorld(this.mx, this.my);
      if (this.buttons[0] && this.holdMode && !g.held) {
        if (this.holdMode === 'move' && !this.worldBlocked(this.mx, this.my)) g.cmdMove(wp.x, wp.y);
        else if (this.holdMode === 'attack') {
          const t = this.holdTarget;
          if (t && !t.dead) { if (!h.order || h.order.target !== t) g.cmdSkill('left', t.x, t.y, t, true); }
          else { this.holdMode = 'move'; }
        } else if (this.holdMode === 'still' && !h.act) g.cmdSkill('left', wp.x, wp.y, this.hover && this.hover.kind === 'ent' && this.hover.ref.team === 1 ? this.hover.ref : null, false, true);
      }
      if (this.buttons[2] && this.rightHold && !g.held && !this.worldBlocked(this.mx, this.my)) {
        const sk = SKILLS[g.char.right];
        if (sk && (sk.kind === 'buff' || sk.kind === 'summon' || sk.kind === 'warcry' || sk.kind === 'form' || sk.kind === 'teleport' || sk.kind === 'trap' || sk.kind === 'corpse' || sk.kind === 'curse')) return;
        if (!h.act) {
          const tgt = this.hover && this.hover.kind === 'ent' && this.hover.ref.team === 1 ? this.hover.ref : null;
          g.cmdSkill('right', tgt ? tgt.x : wp.x, tgt ? tgt.y : wp.y, tgt, true, this.keys.Shift || (sk && sk.kind !== 'strike' && sk.kind !== 'shot'));
        }
      }
    }

    processEvents() {
      const g = this.g;
      if (!g) return;
      const h = g.hero;
      for (const ev of g.events.splice(0)) {
        switch (ev.t) {
          case 'sfx': {
            let v = 1;
            if (ev.x || ev.y) { const d = Math.hypot(ev.x - h.x, ev.y - h.y); v = Math.max(0, 1 - d / 22); }
            this.audio.sfx(ev.s, v);
            break;
          }
          case 'msg': this.msg(ev.text, ev.c); break;
          case 'overhead': this.overheads.push({ id: ev.id, text: ev.text, t: this.t }); this.audio.sfx('cant', 0.6); break;
          case 'talk': this.talk = { text: ev.text, name: D.NPCS[ev.npc] ? D.NPCS[ev.npc].name : '', t0: this.t }; this.npcMenu = null; break;
          case 'read': this.talk = { text: ev.text, name: '', t0: this.t }; break;
          case 'npc': this.npcMenu = { npc: ev.npc, id: ev.id }; this.left = null; break;
          case 'open':
            if (ev.panel === 'wp') this.left = 'wp';
            if (ev.panel === 'stash') { this.left = 'stash'; this.right = 'inv'; }
            break;
          case 'area': {
            const a = D.AREAS[ev.id];
            this.audio.music(a.music || 'wild');
            if (!ev.first) this.areaTitle = { text: a.name, t: this.t };
            this.left = this.left === 'wp' ? null : this.left;
            this.npcMenu = null; this.talk = null;
            if (this.left === 'trade' || this.left === 'gamble' || this.left === 'hire' || this.left === 'stash') this.left = null;
            break;
          }
          case 'lvlup': this.audio.sfx('lvlup'); break;
          case 'quest': this.audio.sfx('quest', 0.7); break;
          case 'died': break;
          case 'herodeath': this.left = this.right = null; this.npcMenu = null; this.talk = null; break;
          case 'hcdead': this.saveGame(); this.hcDead = true; break;
          case 'autosave': this.saveGame(); break;
          case 'actend': this.saveGame(); this.playCine('act1end', () => { this.screen = 'game'; this.audio.music('town'); this.msg('Открыта сложность «' + D.DIFFS[Math.min(2, g.diff + 1)] + '». Выберите её при следующем входе в игру.', COL.gold); }); break;
          case 'bossdown': this.audio.sfx('quest'); break;
        }
      }
    }

    down(b, dbl) {
      const mx = this.mx, my = this.my;
      if (this.modal) { D.Screens.modalClick(this, mx, my); return; }
      switch (this.screen) {
        case 'menu': if (b === 0) D.Screens.Menu.click(this, mx, my); return;
        case 'select': if (b === 0) D.Screens.Select.click(this, mx, my, dbl); return;
        case 'create': if (b === 0) D.Screens.Create.click(this, mx, my); return;
        case 'credits': D.Screens.Credits.click(this); return;
        case 'cine': D.Screens.Cine.click(this); return;
        case 'game': this.gameDown(b); return;
      }
    }

    gameDown(b) {
      const g = this.g, P = D.Panels, HU = D.HUD;
      const mx = this.mx, my = this.my;
      const mods = this.mods || {};
      if (this.menu) { this.menuClick(); return; }
      if (this.help) { this.help = false; return; }
      if (g.hero.dead) return;
      if (this.skillPick) { P.pickClick(this, g, mx, my); return; }
      if (this.talk) { this.talk = null; return; }
      if (this.npcMenu) {
        const m = this.npcMenu;
        const hit = (m.items || []).find(it => HU.inR(mx, my, it));
        if (hit) this.npcAction(m.npc, hit.id);
        else this.npcMenu = null;
        return;
      }
      if (this.right === 'inv' && P.invClick(this, g, mx, my, b, mods)) return;
      if (this.right === 'skills' && P.skillsClick(this, g, mx, my)) return;
      if (this.left === 'char' && P.charClick(this, g, mx, my)) return;
      if (this.left === 'quest' && P.questsClick(this, g, mx, my)) return;
      if (this.left === 'wp' && P.wpClick(this, g, mx, my)) return;
      if ((this.left === 'trade' || this.left === 'gamble') && P.tradeClick(this, g, mx, my, b)) return;
      if (this.left === 'stash' && P.stashClick(this, g, mx, my, b, mods)) return;
      if (this.left === 'hire' && P.hireClick(this, g, mx, my)) return;
      if (this.hudClick(b)) return;
      if (this.worldBlocked(mx, my)) return;
      if (g.held) { if (b === 0) g.dropHeld(); return; }
      if (g.cursorMode) { g.cursorMode = null; return; }
      const hv = this.hover;
      const w = this.r.toWorld(mx, my);
      if (b === 0) {
        if (mods.shift) { this.holdMode = 'still'; g.cmdSkill('left', w.x, w.y, hv && hv.kind === 'ent' && hv.ref.team === 1 ? hv.ref : null, true, true); return; }
        if (hv && hv.kind === 'ent' && hv.ref.team === 1) { this.holdMode = 'attack'; this.holdTarget = hv.ref; g.cmdSkill('left', hv.ref.x, hv.ref.y, hv.ref, true); return; }
        if (hv && hv.kind === 'ent' && hv.ref.kind === 'npc') { this.holdMode = null; g.cmdInteract(hv.ref); return; }
        if (hv && (hv.kind === 'item' || hv.kind === 'obj')) { this.holdMode = null; g.cmdInteract(hv.ref); return; }
        this.holdMode = 'move';
        g.cmdMove(w.x, w.y);
        return;
      }
      const sid = g.char.right;
      if (sid === 'tp' || sid === 'id') { g.useTomeSkill(sid); return; }
      const sk = SKILLS[sid];
      if (sk && sk.kind === 'aura') return;
      this.rightHold = true;
      const tgt = hv && (hv.kind === 'ent' && hv.ref.team === 1 || hv.kind === 'corpse') ? hv.ref : null;
      const still = mods.shift || (sk && sk.kind !== 'strike' && sk.kind !== 'shot' && sk.kind !== 'corpse' && !(sk.kind === 'summon' && sk.corpse)) || sid === 'attack' && g.hero.st.ranged;
      g.cmdSkill('right', tgt ? tgt.x : w.x, tgt ? tgt.y : w.y, tgt, true, still && !(tgt && sk && sk.kind === 'strike'));
    }

    hudClick(b) {
      const g = this.g, HU = D.HUD, L = HU.L;
      const mx = this.mx, my = this.my;
      if (HU.inR(mx, my, L.lskill)) { this.skillPick = this.skillPick === 'left' ? null : 'left'; return true; }
      if (HU.inR(mx, my, L.rskill)) { this.skillPick = this.skillPick === 'right' ? null : 'right'; return true; }
      if (HU.inR(mx, my, L.run)) { g.toggleRun(); return true; }
      if (HU.inR(mx, my, L.minibtn)) { this.miniOpen = !this.miniOpen; return true; }
      if (g.char.statPts > 0 && HU.inR(mx, my, L.lvlStat)) { this.left = 'char'; return true; }
      if (g.char.skillPts > 0 && HU.inR(mx, my, L.lvlSkill)) { this.right = 'skills'; return true; }
      if (this.miniOpen && HU.inR(mx, my, L.mini)) {
        const i = Math.floor((mx - L.mini.x - 3) / 25.5);
        const id = (HU.MINI_BTNS[i] || [])[0];
        if (id === 'char') this.left = this.left === 'char' ? null : 'char';
        if (id === 'inv') this.right = this.right === 'inv' ? null : 'inv';
        if (id === 'skills') this.right = this.right === 'skills' ? null : 'skills';
        if (id === 'quest') this.left = this.left === 'quest' ? null : 'quest';
        if (id === 'map') this.automap = !this.automap;
        if (id === 'menu') this.menu = 'main';
        if (id === 'msg') this.msg('Журнал сообщений пуст.', COL.dim);
        if (id === 'party') this.msg('Вы играете в одиночку.', COL.dim);
        return true;
      }
      const rows = D.beltRows(g.char);
      for (let r = 0; r < (this.beltOpen ? rows : 1); r++) for (let col = 0; col < 4; col++) {
        const rr = { x: L.belt.x + col * L.belt.s, y: L.belt.y - r * L.belt.s, w: 29, h: 29 };
        if (!HU.inR(mx, my, rr)) continue;
        const idx = r * 4 + col;
        const it = g.char.belt[idx];
        if (g.held) { g.beltPut(idx); return true; }
        if (!it) return true;
        if (b === 2 || r === 0 && b === 0 && !this.mods.shift) { if (b === 2) { g.char.belt[idx] = undefined; D.beltCompact(g.char); g.drink(it); } else g.take(it, 'belt'); }
        else g.take(it, 'belt');
        return true;
      }
      return my >= 553;
    }

    npcAction(npc, id) {
      const g = this.g;
      this.npcMenu = null;
      if (id === 'talk') g.talk(npc);
      else if (id === 'trade') { this.left = 'trade'; this.right = 'inv'; this.shopNpc = npc; }
      else if (id === 'gamble') { this.left = 'gamble'; this.right = 'inv'; this.shopNpc = npc; }
      else if (id === 'hire') { this.left = 'hire'; }
      else if (id === 'identify') g.identifyAll();
      else if (id === 'imbue') { this.right = 'inv'; g.cursorMode = { k: 'imbue' }; this.msg('Выберите обычную вещь в инвентаре', COL.gold); }
      else if (id === 'travel') g.travelEast();
      else g.talking = null;
    }

    menuClick() {
      const HU = D.HUD;
      for (const m of this.menuItems || []) if (HU.inR(this.mx, this.my, m.r)) {
        this.audio.sfx('ui_click');
        const s = this.settings;
        if (m.id === 'opts') this.menu = 'opts';
        else if (m.id === 'save') { this.menu = null; this.exitToSelect(); }
        else if (m.id === 'back') this.menu = null;
        else if (m.id === 'back2') this.menu = 'main';
        else if (m.id === 'sfx') { s.sfx = (Math.round(s.sfx * 10) + 1) % 11 / 10; }
        else if (m.id === 'music') { s.music = (Math.round(s.music * 10) + 1) % 11 / 10; }
        else if (m.id === 'labels') s.labels = !s.labels;
        else if (m.id === 'light') s.lowLight = !s.lowLight;
        this.audio.setVolumes(s.music, s.sfx);
        store(SET_KEY, s);
        return;
      }
    }

    key(e, down) {
      const k = e.key;
      if (['Tab', 'Alt', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', ' ', 'Escape', 'Backspace'].includes(k) || (k.length === 1 && this.screen === 'game')) e.preventDefault();
      if (k === 'Shift' || k === 'Control' || k === 'Alt') { this.keys[k] = down; if (k === 'Alt') this.keys.Alt = down; return; }
      if (!down) return;
      this.audio.resume();
      if (this.modal) { if (k === 'Escape' || k === 'Enter') { const m = this.modal; const b = m.buttons[m.buttons.length - 1]; if (m.on) m.on(b[0]); else this.modal = null; } return; }
      if (this.screen === 'create') { if (k === 'Escape') { if (this.createSel) this.createSel = null; else this.go('select'); return; } D.Screens.Create.key(this, e); return; }
      if (this.screen === 'cine') { if (k === 'Escape' || k === ' ' || k === 'Enter') D.Screens.Cine.finish(this); return; }
      if (this.screen === 'credits') { this.go('menu'); return; }
      if (this.screen === 'select') { if (k === 'Escape') this.go('menu'); if (k === 'Enter') D.Screens.Select.play(this); return; }
      if (this.screen === 'menu') { if (k === 'Enter') this.go('select'); return; }
      if (this.screen !== 'game') return;
      const g = this.g;
      const code = e.code || '';
      const low = k.toLowerCase();
      if (k === 'Escape') {
        if (g.hero.dead) { if (g.char.hc || this.hcDead) { this.hcDead = false; this.exitToSelect(); } else g.respawn(); return; }
        if (this.help) { this.help = false; return; }
        if (this.menu) { this.menu = this.menu === 'opts' ? 'main' : null; return; }
        if (this.skillPick) { this.skillPick = null; return; }
        if (this.talk) { this.talk = null; return; }
        if (this.npcMenu) { this.npcMenu = null; return; }
        if (g.cursorMode) { g.cursorMode = null; return; }
        if (this.left || this.right) { this.left = this.right = null; return; }
        if (this.automap) { this.automap = false; return; }
        this.menu = 'main';
        return;
      }
      if (this.menu) return;
      if (/^F[1-8]$/.test(k)) {
        if (this.skillPick && this.pickHover) { g.setHot(k, this.pickHover); this.audio.sfx('select'); return; }
        const sid = g.char.hot[k];
        if (sid && g.skillChoices('right').includes(sid)) g.setSkill('right', sid);
        else if (sid && g.skillChoices('left').includes(sid)) g.setSkill('left', sid);
        return;
      }
      if (code === 'KeyH' || low === 'h' || low === 'р') { this.help = !this.help; return; }
      if (g.hero.dead) return;
      if (code === 'Tab' || k === 'Tab') { this.automap = !this.automap; return; }
      if (code === 'KeyI' || code === 'KeyB') { this.right = this.right === 'inv' ? null : 'inv'; return; }
      if (code === 'KeyC' || code === 'KeyA') { this.left = this.left === 'char' ? null : 'char'; return; }
      if (code === 'KeyT') { this.right = this.right === 'skills' ? null : 'skills'; return; }
      if (code === 'KeyQ') { this.left = this.left === 'quest' ? null : 'quest'; return; }
      if (code === 'KeyS') { this.skillPick = this.skillPick === 'right' ? null : 'right'; return; }
      if (code === 'KeyR') { g.toggleRun(); return; }
      if (code === 'KeyW') { g.swapWeapons(); return; }
      if (k === ' ') { this.left = this.right = null; this.npcMenu = null; this.talk = null; this.skillPick = null; return; }
      if (/^Digit[1-4]$/.test(code)) { g.beltUse(+code.slice(5) - 1); return; }
    }

    computeHover() {
      if (!this.r || this.screen !== 'game') { this.hover = null; return; }
      if (this.worldBlocked(this.mx, this.my) || this.g.held || this.skillPick || this.npcMenu) { this.hover = null; return; }
      if (this.buttons[0] && this.holdMode === 'move') { this.hover = null; return; }
      const p = this.r.pick(this.mx, this.my);
      this.hover = p;
    }

    draw(dt) {
      const c = this.c;
      c.save();
      switch (this.screen) {
        case 'menu': D.Screens.Menu.draw(this, c); break;
        case 'select': D.Screens.Select.draw(this, c); break;
        case 'create': D.Screens.Create.draw(this, c); break;
        case 'credits': D.Screens.Credits.draw(this, c); break;
        case 'cine': if (this.cine) D.Screens.Cine.draw(this, c); break;
        case 'loading': D.Screens.loading(this, c); break;
        case 'game': this.drawGame(c, dt); break;
      }
      D.Screens.drawModal(this, c);
      this.drawCursor(c);
      c.restore();
    }

    drawGame(c, dt) {
      const g = this.g, P = D.Panels, HU = D.HUD;
      this.computeHover();
      this.r.render(g, { hover: this.hover, alt: this.keys.Alt || this.settings.labels, overheads: this.overheads.map(o => ({ id: o.id, text: o.text })) }, (this.menu || this.help) ? 0 : dt);
      if (this.automap) HU.automap(this, c, g);
      HU.targetBox(this, c, g);
      HU.mercPortrait(this, c, g);
      this.tipItem = null; this.tipSkill = null; this.hoverSkillBtn = null;
      if (HU.inR(this.mx, this.my, HU.L.lskill)) this.hoverSkillBtn = 'left';
      if (HU.inR(this.mx, this.my, HU.L.rskill)) this.hoverSkillBtn = 'right';
      if (this.left === 'char') P.drawChar(this, c, g);
      if (this.left === 'quest') P.drawQuests(this, c, g);
      if (this.left === 'wp') P.drawWp(this, c, g);
      if (this.left === 'trade' || this.left === 'gamble') P.drawTrade(this, c, g);
      if (this.left === 'stash') P.drawStash(this, c, g);
      if (this.left === 'hire') P.drawHire(this, c, g);
      if (this.right === 'inv') P.drawInv(this, c, g);
      if (this.right === 'skills') P.drawSkills(this, c, g);
      HU.messages(this, c);
      HU.drawBar(this, c, g);
      this.pickHover = null;
      if (this.skillPick) P.skillPicker(this, c, g);
      HU.npcMenu(this, c, g);
      HU.talkBox(this, c);
      if (this.tipSkill) P.skillTip(this, c, g);
      if (this.tipItem && !g.held) HU.itemTip(c, g, this.tipItem.it, this.tipItem.x, this.tipItem.y, this.tipItem.extra);
      if (this.hover && this.hover.kind === 'item' && !this.keys.Alt && this.hover.ref.item && this.keys.Control) HU.itemTip(c, g, this.hover.ref.item, this.mx, this.my - 10);
      if (g.hero.dead && g.hero.deathT > 1.2) P.deathOverlay(this, c, g);
      if (this.help) P.helpOverlay(this, c);
      if (this.menu) P.menuOverlay(this, c);
      if (g.held) {
        const ic = D.Icons.item(g.held, P.CELL);
        c.drawImage(ic, this.mx - ic.width / 2, this.my - ic.height / 2);
      }
    }

    drawCursor(c) {
      const x = this.mx, y = this.my;
      if (this.g && this.screen === 'game' && this.g.held) return;
      c.save();
      c.translate(x, y);
      const busy = this.g && this.g.cursorMode;
      c.fillStyle = busy ? '#c0a060' : '#b8a888';
      c.strokeStyle = '#2a2018';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(3, 13); c.lineTo(6, 10); c.lineTo(11, 16); c.lineTo(15, 13); c.lineTo(10, 7); c.lineTo(14, 5); c.closePath();
      const g = c.createLinearGradient(0, 0, 14, 16);
      g.addColorStop(0, '#f0e0c0'); g.addColorStop(1, '#7a6a4a');
      c.fillStyle = g;
      c.fill(); c.stroke();
      if (busy) { c.fillStyle = '#ffd040'; c.font = 'bold 12px serif'; c.fillText('?', 12, 22); }
      c.restore();
    }
  }

  D.UI = UI;
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
