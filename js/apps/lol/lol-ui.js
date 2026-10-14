(function (L) {
  'use strict';
  const D = L.DATA, { CHAMPS, CHAMP_ORDER, ITEMS, SPELLS, SPELL_ORDER, STR, SHOP_TABS, DT } = D;
  const R_ = L.Renderer, W = R_.W, H = R_.H, HUD_Y = R_.HUD_Y, Z = R_.Z, GOLD = R_.GOLD, GOLD_D = R_.GOLD_D;
  const OPT_KEY = 'lol98-options', PROF_KEY = 'lol98-profile';
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
  const AOE = { annie: { 3: 290 }, malphite: { 3: 320 }, jinx: { 2: 220 }, teemo: { 3: 320 }, ashe: { 2: 1000 } };
  const WIDTH = { lulu: { 0: 60 }, jinx: { 1: 60, 3: 140 }, ashe: { 1: 200, 3: 130 }, annie: { 1: 250 } };

  class UI {
    constructor(root, opts = {}) {
      this.root = root; this.opts = opts; this.ac = new AbortController();
      root.classList.add('lol98'); root.tabIndex = 0;
      root.innerHTML = '<canvas class="lol98-cv" width="800" height="600"></canvas><div class="lol98-err"></div>';
      this.cv = root.querySelector('canvas'); this.ctx = this.cv.getContext('2d');
      this.lang = opts.lang || ((globalThis.i18n && globalThis.i18n.getLanguage && globalThis.i18n.getLanguage()) === 'en' ? 'en' : 'ru');
      this.S = STR[this.lang];
      this.options = { sfx: 0.8, music: 0.5, announcer: true, quickcast: false, camlock: true, dmgnums: true, fps: false, edge: true, names: false };
      Object.assign(this.options, store.get(OPT_KEY) || {});
      this.profile = Object.assign({ name: this.lang === 'ru' ? 'Призыватель' : 'Summoner', wins: 0, losses: 0, champ: {} }, store.get(PROF_KEY) || {});
      this.audio = new L.Audio(); this.audio.lang = this.lang; this.applyAudioOpts();
      this.R = new L.Renderer(this.cv, this);
      this.map = new L.Map();
      const b = L.GFX.build(this.map); this.A = b.A; this.steps = b.steps.slice(1).concat(b.steps[0]); this.stepI = 0; this.R.setAssets(this.A);
      this.coll = new L.SKINS.Collection(store.get(L.SKINS.STORE_KEY));
      this.jobs = []; this.jobKeys = new Set(); this.toast = null; this.chest = null; this.endReward = null; this.selAbil = -1;
      this.screen = 'title'; this.overlay = null; this.t = 0; this.fps = 0; this.fpsN = 0; this.fpsT = 0;
      this.mx = 400; this.my = 300; this.hover = null; this.keys = new Set();
      this.sel = { champ: 'jinx', role: 'any', spells: ['flash', 'heal'], spellSlot: 0, diff: 1, team: 0 };
      Object.assign(this.sel, store.get('lol98-select') || {});
      if (!CHAMPS[this.sel.champ]) this.sel.champ = 'jinx';
      this.collSel = { champ: this.sel.champ, skin: null };
      this.chat = []; this.killFeed = []; this.pings = []; this.announce = null; this.msg = null; this.clickMark = null;
      this.camLocked = this.options.camlock;
      this.bind();
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(root); this.resize();
      this.last = performance.now(); this.frame = this.frame.bind(this); this.raf = requestAnimationFrame(this.frame);
      if (opts.onReady) opts.onReady(this);
    }
    t_(k) { return this.S[k] != null ? this.S[k] : k; }
    L(o) { return o ? (o[this.lang] || o.en) : ''; }
    applyAudioOpts() { this.audio.sfxVol = this.options.sfx; this.audio.musicVol = this.options.music; this.audio.voice = this.options.announcer; this.audio.applyVolume(); }
    saveOptions() { store.set(OPT_KEY, this.options); this.applyAudioOpts(); }

    resize() {
      const r = this.root.getBoundingClientRect(); if (!r.width || !r.height) return;
      const s = Math.min(r.width / W, r.height / H);
      this.cv.style.width = Math.floor(W * s) + 'px'; this.cv.style.height = Math.floor(H * s) + 'px';
      this.cv.style.imageRendering = s >= 1.5 ? 'pixelated' : 'auto';
      this.scale = s;
    }
    toCanvas(e) { const r = this.cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
    bind() {
      const sig = { signal: this.ac.signal }, root = this.root;
      root.addEventListener('keydown', e => this.onKey(e, true), sig);
      root.addEventListener('keyup', e => this.onKey(e, false), sig);
      this.cv.addEventListener('mousemove', e => { [this.mx, this.my] = this.toCanvas(e); this.mouseIn = true; if (this.dragMini) this.miniCam(); }, sig);
      this.cv.addEventListener('mouseleave', () => { this.mouseIn = false; }, sig);
      this.cv.addEventListener('mousedown', e => { root.focus({ preventScroll: true }); this.audio.resume(); [this.mx, this.my] = this.toCanvas(e); this.onMouse(e); }, sig);
      document.addEventListener('mouseup', () => { this.dragMini = false; }, sig);
      this.cv.addEventListener('contextmenu', e => e.preventDefault(), sig);
      this.cv.addEventListener('wheel', e => { if (this.overlay === 'shop') { this.shopScroll = Math.max(0, (this.shopScroll || 0) + Math.sign(e.deltaY)); e.preventDefault(); } }, { signal: this.ac.signal, passive: false });
      window.addEventListener('blur', () => this.keys.clear(), sig);
    }
    hitAt(x, y) { const h = this.R.hits; for (let i = h.length - 1; i >= 0; i--) { const r = h[i]; if (x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h) return r; } return null; }

    onKey(e, down) {
      const code = e.code;
      if (code === 'F7') { e.preventDefault(); if (down && !e.repeat) this.debugChest(); return; }
      if (this.screen === 'game' && this.chatOpen && down) {
        e.preventDefault(); e.stopPropagation();
        if (code === 'Enter') { this.sendChat(); return; }
        if (code === 'Escape') { this.chatOpen = false; this.chatText = ''; return; }
        if (code === 'Backspace') { this.chatText = this.chatText.slice(0, -1); return; }
        if (e.key.length === 1 && this.chatText.length < 80) this.chatText += e.key;
        return;
      }
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyD', 'KeyF', 'Enter', 'F1'].includes(code) || (e.ctrlKey && /Key[QWER]/.test(code))) e.preventDefault();
      if (down) this.keys.add(code); else this.keys.delete(code);
      if (!down) return;
      this.audio.resume();
      if (code === 'Escape') { this.escape(); return; }
      if (this.screen !== 'game' || !this.g) return;
      if (this.overlay === 'menu' || this.overlay === 'options' || this.overlay === 'help' || this.overlay === 'chest' || this.endShown) return;
      const p = this.player;
      if (code === 'Enter') { this.chatOpen = true; this.chatText = ''; return; }
      if (code === 'KeyY') { this.camLocked = !this.camLocked; return; }
      if (code === 'KeyP') { this.overlay = this.overlay === 'shop' ? null : 'shop'; this.audio.play('click'); return; }
      if (!p) return;
      const slotKey = { KeyQ: 0, KeyW: 1, KeyE: 2, KeyR: 3 }[code];
      if (slotKey != null) { if (e.ctrlKey || e.altKey) this.g.levelAbility(p, slotKey); else this.beginTarget('ability', slotKey); return; }
      if (code === 'KeyD') return this.beginTarget('spell', 0);
      if (code === 'KeyF') return this.beginTarget('spell', 1);
      const item = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5 }[code];
      if (item != null) return this.beginTarget('item', item);
      if (code === 'KeyB') { if (this.g.recall(p)) this.overlay = this.overlay === 'shop' ? null : this.overlay; return; }
      if (code === 'KeyS') { this.g.order(p, { type: 'stop' }); this.targeting = null; return; }
      if (code === 'KeyA') { this.targeting = { kind: 'attackMove' }; return; }
    }
    escape() {
      if (this.overlay === 'chest') { if (!this.chest || this.chest.phase !== 'opening') this.closeChest(); return; }
      if (this.screen === 'select' || this.screen === 'collection') { this.screen = 'title'; return; }
      if (this.screen !== 'game') { if (this.overlay) this.overlay = null; return; }
      if (this.chatOpen) { this.chatOpen = false; return; }
      if (this.targeting) { this.targeting = null; return; }
      if (this.overlay === 'shop' || this.overlay === 'help' || this.overlay === 'options') { this.overlay = this.overlay === 'options' || this.overlay === 'help' ? 'menu' : null; return; }
      this.overlay = this.overlay === 'menu' ? null : 'menu';
    }
    onMouse(e) {
      const h = this.hitAt(this.mx, this.my);
      if (this.screen !== 'game') { if (e.button === 0 && h) this.click(h); return; }
      const g = this.g, p = this.player;
      if (this.endShown) { if (e.button === 0 && h) this.click(h); return; }
      if (this.overlay && this.overlay !== 'shop') { if (e.button === 0 && h) this.click(h); return; }
      if (this.overlay === 'shop' && this.inShopPanel(this.mx, this.my)) { if (h) this.click(h, e.button === 2); return; }
      if (h && (this.my >= HUD_Y || h.id !== 'minimap' && h.id)) {
        if (h.id === 'minimap') { if (e.button === 0) { this.dragMini = true; this.camLocked = false; this.miniCam(); } else if (p) { const [wx, wy] = this.miniWorld(); this.g.order(p, { type: 'move', x: wx, y: wy }); this.clickMark = { x: wx, y: wy, t: 0 }; } return; }
        if (e.button === 0) this.click(h);
        return;
      }
      if (this.my >= HUD_Y) return;
      const [wx, wy] = this.R.toWorld(this.mx, this.my);
      if (!p) { if (e.button === 0) this.selected = this.hoverUnit; return; }
      if (e.button === 2) {
        if (this.targeting) { this.targeting = null; return; }
        const u = this.hoverUnit;
        if (u && u.team !== p.team && g.validAttackTarget(p, u)) { g.order(p, { type: 'attack', unit: u }); this.clickMark = { x: u.x, y: u.y, t: 0, attack: true }; }
        else { g.order(p, { type: 'move', x: wx, y: wy }); this.clickMark = { x: wx, y: wy, t: 0 }; }
        return;
      }
      if (e.button === 0) {
        if (this.targeting) { this.fireTarget(wx, wy); return; }
        this.selected = this.hoverUnit || null;
      }
    }
    miniWorld() { const m = this.R.miniRect; return [(this.mx - m.x) / m.s * D.MAP, (this.my - m.y) / m.s * D.MAP]; }
    miniCam() { const [wx, wy] = this.miniWorld(); this.R.centerOn(wx, wy); }
    inShopPanel(x, y) { return x >= 90 && x < 710 && y >= 34 && y < 450; }

    beginTarget(kind, slot) {
      const g = this.g, p = this.player; if (!p || p.dead) return;
      if (kind === 'ability') {
        const a = p.def.abilities[slot], err = g.castCheck(p, slot, { x: 0, y: 0, unit: p });
        if (err && err !== 'target') { this.errMsg(err); return; }
        if (a.target === 'self' || a.target === 'toggle') { const r = g.cast(p, slot, {}); if (r) this.errMsg(r); return; }
        if (a.target === 'passive') return;
        this.targeting = { kind, slot, a, type: a.target, range: a.range };
      } else if (kind === 'spell') {
        const id = p.spells[slot], sp = SPELLS[id];
        if (p.spellCds[slot] > 0) { this.errMsg('cooldown'); return; }
        if (sp.target === 'self') { const r = g.useSpell(p, slot, {}); if (r) this.errMsg(r); return; }
        this.targeting = { kind, slot, type: sp.target, range: sp.range || 0 };
      } else if (kind === 'item') {
        const it = p.items[slot]; if (!it) return; const def = ITEMS[it.id];
        if (def.use === 'ward' || def.use === 'visionWard') this.targeting = { kind, slot, type: 'point', range: 600 };
        else { const r = g.useItem(p, slot); if (r && r !== 'none') this.errMsg(r); }
        return;
      }
      if (this.options.quickcast && this.targeting) { const [wx, wy] = this.R.toWorld(this.mx, this.my); this.fireTarget(wx, wy, true); }
    }
    fireTarget(wx, wy, quick) {
      const g = this.g, p = this.player, t = this.targeting; if (!t || !p) return;
      if (t.kind === 'attackMove') {
        const u = this.hoverUnit;
        if (u && u.team !== p.team && g.validAttackTarget(p, u)) g.order(p, { type: 'attack', unit: u }); else g.order(p, { type: 'attackMove', x: wx, y: wy });
        this.clickMark = { x: wx, y: wy, t: 0, attack: true }; this.targeting = null; return;
      }
      let unit = this.hoverUnit;
      if ((t.type === 'ally' || t.type === 'unit') && !unit && Math.hypot(wx - p.x, wy - p.y) < 150) unit = p;
      if (t.type === 'ally' && !unit) unit = p;
      const tgt = { x: wx, y: wy, unit };
      let r;
      if (t.kind === 'ability') r = g.cast(p, t.slot, tgt);
      else if (t.kind === 'spell') r = g.useSpell(p, t.slot, tgt);
      else if (t.kind === 'item') r = g.useItem(p, t.slot, tgt);
      if (r === 'target' && quick) return;
      if (r) this.errMsg(r);
      if (!r || r !== 'target') this.targeting = null;
    }
    errMsg(err) {
      const m = { mana: 'notEnoughMana', cooldown: 'onCooldown', gold: 'notEnoughGold', full: 'invFull', shop: 'notInShop' }[err];
      if (m) { this.msg = { text: this.S[m], t: 0 }; this.audio.play('click'); }
    }
    drawIndicator(R) {
      const t = this.targeting, p = this.player; if (!t || !p || p.dead) return;
      const c = R.ctx, px = R.sx(p.x), py = R.sy(p.y);
      const [wx, wy] = R.toWorld(this.mx, this.my);
      const range = t.kind === 'attackMove' ? p.st.range + 60 : t.range;
      c.save();
      if (range && range < 3000) { c.strokeStyle = 'rgba(120,200,255,0.7)'; c.lineWidth = 2; c.beginPath(); c.arc(px, py, range * Z, 0, 6.3); c.stroke(); c.fillStyle = 'rgba(120,200,255,0.06)'; c.fill(); }
      if (t.type === 'dir') {
        const dx = wx - p.x, dy = wy - p.y, d = Math.hypot(dx, dy) || 1, len = Math.min(range, 2200), w = ((WIDTH[p.cid] || {})[t.slot] || 60) * Z;
        c.translate(px, py); c.rotate(Math.atan2(dy, dx)); c.fillStyle = 'rgba(120,200,255,0.3)'; c.fillRect(0, -w, len * Z, w * 2); c.strokeStyle = 'rgba(200,240,255,0.8)'; c.strokeRect(0, -w, len * Z, w * 2);
        void d;
      } else if (t.type === 'point') {
        let tx = wx, ty = wy; const d = Math.hypot(tx - p.x, ty - p.y);
        if (range < 3000 && d > range && !(p.cid === 'malphite')) { tx = p.x + (tx - p.x) / d * range; ty = p.y + (ty - p.y) / d * range; }
        const r = (t.kind === 'ability' ? ((AOE[p.cid] || {})[t.slot] || 80) : 60) * Z;
        c.strokeStyle = 'rgba(255,220,120,0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(R.sx(tx), R.sy(ty), r, 0, 6.3); c.stroke(); c.fillStyle = 'rgba(255,220,120,0.15)'; c.fill();
      }
      c.restore();
    }

    click(h, right) {
      const id = h.id, g = this.g, p = this.player;
      this.audio.play('click');
      if (this.clientClick(h)) return;
      switch (id) {
        case 'play': if (this.assetsReady()) { this.screen = 'select'; } break;
        case 'options': this.overlay = 'options'; break;
        case 'help': this.overlay = 'help'; break;
        case 'exit': if (this.opts.onExit) this.opts.onExit(); break;
        case 'close': this.overlay = this.screen === 'game' && (this.overlay === 'options' || this.overlay === 'help') ? 'menu' : null; break;
        case 'opt': { const k = h.data; if (typeof this.options[k] === 'boolean') this.options[k] = !this.options[k]; if (k === 'camlock') this.camLocked = this.options.camlock; this.saveOptions(); break; }
        case 'vol': { const [k, d] = h.data; this.options[k] = Math.round(Math.max(0, Math.min(1, this.options[k] + d)) * 10) / 10; this.saveOptions(); break; }
        case 'pick': this.sel.champ = h.data; this.selAbil = -1; this.audio.play('buy'); break;
        case 'role': this.sel.role = h.data; break;
        case 'spellSlot': this.sel.spellSlot = h.data; break;
        case 'spellPick': { const o = this.sel.spells, i = this.sel.spellSlot, other = o[1 - i]; if (other === h.data) o[1 - i] = o[i]; o[i] = h.data; this.sel.spellSlot = 1 - i; break; }
        case 'diff': this.sel.diff = h.data; break;
        case 'side': this.sel.team = h.data; break;
        case 'back': this.screen = 'title'; break;
        case 'start': this.startLoading(false); break;
        case 'spectate': this.startLoading(true); break;
        case 'resume': this.overlay = null; break;
        case 'menuOptions': this.overlay = 'options'; break;
        case 'menuHelp': this.overlay = 'help'; break;
        case 'surrender': this.surrender(); break;
        case 'quit': this.toTitle(); break;
        case 'continue': this.toTitle(); break;
        case 'ability': if (p) this.beginTarget('ability', h.data); break;
        case 'levelup': if (p) g.levelAbility(p, h.data); break;
        case 'spell': if (p) this.beginTarget('spell', h.data); break;
        case 'item': if (p) { if (this.overlay === 'shop') { this.shopSel = p.items[h.data].id; this.invSel = h.data; if (right) this.doSell(h.data); } else this.beginTarget('item', h.data); } break;
        case 'shop': this.overlay = this.overlay === 'shop' ? null : 'shop'; break;
        case 'recall': if (p) g.recall(p); break;
        case 'menu': this.overlay = 'menu'; break;
        case 'camlock': this.camLocked = !this.camLocked; break;
        case 'score': this.showScore = !this.showScore; break;
        case 'shopTab': this.shopTab = h.data; this.shopScroll = 0; break;
        case 'shopItem': this.shopSel = h.data; this.invSel = null; if (right || (this.lastClickItem === h.data && performance.now() - this.lastClickT < 400)) this.doBuy(h.data); this.lastClickItem = h.data; this.lastClickT = performance.now(); break;
        case 'buy': this.doBuy(this.shopSel); break;
        case 'sell': if (this.invSel != null) this.doSell(this.invSel); break;
        case 'undo': if (p) g.undoBuy(p); break;
        case 'shopClose': this.overlay = null; break;
        case 'ally': { const u = g && g.champs.find(ch => ch.id === h.data); if (u) { this.camLocked = false; this.R.centerOn(u.x, u.y); } break; }
      }
    }
    doBuy(id) { const p = this.player; if (!p || !id) return; const r = this.g.buy(p, id); if (r) this.errMsg(r === 'boots' ? 'full' : r); }
    doSell(slot) { const p = this.player; if (!p) return; const r = this.g.sell(p, slot); if (r) this.errMsg(r); this.invSel = null; }
    surrender() {
      const g = this.g, p = this.player; if (!p) return;
      if (g.time < 900) { this.sys(this.S.surrenderEarly); this.overlay = null; return; }
      const mine = g.teamStats[p.team], theirs = g.teamStats[1 - p.team];
      const losing = theirs.kills + theirs.towers * 3 > mine.kills + mine.towers * 3 + 5;
      this.overlay = null;
      if (losing) { this.sys(this.S.surrenderVote + ': 4/5'); const nx = g.structs.find(s => s.kind === 'nexus' && s.team === p.team); g.killUnit(nx, null); }
      else this.sys(this.S.surrenderVote + ': 1/5 — ' + this.S.surrenderFail);
    }
    toTitle() { this.screen = 'title'; this.overlay = null; this.chest = null; this.endReward = null; this.g = null; this.player = null; this.endShown = false; this.audio.playTune('menu'); }
    sys(text) { this.chat.push({ text, t: 0, sys: true }); }
    sendChat() {
      const txt = this.chatText.trim(); this.chatOpen = false; this.chatText = '';
      if (!txt) return;
      const p = this.player;
      if (txt.startsWith('/')) {
        if (txt === '/ff' || txt === '/surrender') return this.surrender();
        if (p && this.g.command(p, txt)) { this.sys('OK: ' + txt); return; }
        this.sys('?: ' + txt); return;
      }
      this.chat.push({ from: this.profile.name, text: txt, team: p ? p.team : 0, all: true, t: 0 });
      if (this.g && Math.random() < 0.5) {
        const b = this.g.champs.filter(c => c.bot)[Math.floor(Math.random() * 9)];
        const ans = /gg/i.test(txt) ? D.BOT_CHAT.win : /(hi|привет|gl)/i.test(txt) ? D.BOT_CHAT.start : ['?', 'lol', 'ok', 'да', 'noob', ':)', 'afk?'];
        setTimeout(() => { if (this.g && b) this.chat.push({ from: b.name, text: ans[Math.floor(Math.random() * ans.length)], team: b.team, all: true, t: 0 }); }, 800 + Math.random() * 1500);
      }
    }

    assetsReady() { return this.stepI >= this.steps.length; }
    startLoading(spectate) {
      store.set('lol98-select', this.sel);
      const seed = (Date.now() & 0xffffff) | 1;
      this.spectator = !!spectate;
      const human = spectate ? { champ: null } : { champ: this.sel.champ, role: this.sel.role, team: this.sel.team, spells: this.sel.spells.slice(), name: this.profile.name };
      this.g = new L.Game({ seed, diff: this.sel.diff, human });
      this.player = this.g.player;
      const rng = L.RNG(seed ^ 0x5eed);
      for (const ch of this.g.champs) { ch.skinId = ch === this.player ? this.coll.lookFor(ch.cid) : L.SKINS.randomLook(ch.cid, rng); ch.lookFx = L.Art.lookOf(ch.skinId).fx; }
      this.prepareMatchArt();
      this.viewTeam = this.player ? this.player.team : 0;
      this.screen = 'loading'; this.loadT = 0;
      this.chat = []; this.killFeed = []; this.pings = []; this.announce = null; this.selected = null; this.targeting = null; this.overlay = null; this.endShown = false; this.endT = null; this.showScore = false;
      this.shopTab = 'rec'; this.shopSel = null; this.camLocked = this.options.camlock; this.acc = 0; this.endReward = null; this.chest = null;
      const f = this.g.map.fountain[this.viewTeam]; this.R.centerOn(f[0], f[1]);
      this.audio.stopTune();
    }
    prepareMatchArt() {
      for (const ch of this.g.champs) {
        const id = ch.skinId, me = ch === this.player;
        this.queue('m:' + id, () => { L.Art.sprites(id); if (ch.cid === 'jinx') L.Art.sprites(id, { rocket: true }); L.Art.pets(id); });
        this.queue('l:' + id, () => L.Art.splash(id, 138, 172, 'tall'));
        this.queue('f:' + id, () => { L.Art.icon(id, 24); L.Art.icon(id, 32); if (me) L.Art.icon(id, 64); });
      }
      this.loadJobs = this.jobs.length;
    }
    frame(now) {
      this.raf = requestAnimationFrame(this.frame);
      const dt = Math.max(0, Math.min(0.1, (now - this.last) / 1000)); this.last = now; this.t += dt;
      this.fpsN++; this.fpsT += dt; if (this.fpsT >= 1) { this.fps = this.fpsN; this.fpsN = 0; this.fpsT = 0; }
      if (this.stepI < this.steps.length) { const t0 = performance.now(); while (this.stepI < this.steps.length && performance.now() - t0 < 30) this.steps[this.stepI++](); }
      else if (this.jobs.length) this.runJobs(this.screen === 'game' ? 8 : 18);
      try { this.update(dt); this.draw(dt); } catch (err) { this.fail(err); }
    }
    fail(err) { if (this.failed) return; this.failed = true; cancelAnimationFrame(this.raf); const el = this.root.querySelector('.lol98-err'); el.textContent = 'League of Legends 98: ' + (err && err.message ? err.message : err); el.style.display = 'block'; console.error(err); }
    update(dt) {
      if (this.screen === 'title' && this.assetsReady() && !this.audio.tune && this.audio.ctx) this.audio.playTune('menu');
      if (this.toast) { this.toast.t += dt; if (this.toast.t > 2.6) this.toast = null; }
      if (this.chest) this.updateChest(dt);
      if (this.screen === 'loading') {
        this.loadT += dt;
        if (this.loadT > 3 && this.assetsReady() && !this.jobs.length) { this.screen = 'game'; this.audio.playTune('game'); this.chat.push({ text: this.S.chatHint, t: 0, sys: true }); if (this.player) this.overlay = 'shop'; }
        return;
      }
      if (this.screen !== 'game' || !this.g) return;
      const g = this.g;
      const active = !this.opts.isActive || this.opts.isActive();
      const paused = this.overlay === 'menu' || this.overlay === 'options' || this.overlay === 'help' || !active;
      if (!paused) {
        this.acc += dt;
        let n = 0;
        while (this.acc >= DT && n < 5) { g.tick(); this.processEvents(g); this.acc -= DT; n++; }
        if (n >= 5) this.acc = 0;
      }
      this.alpha = paused ? 1 : Math.min(1, this.acc / DT);
      for (const k of this.killFeed) k.t += dt; this.killFeed = this.killFeed.filter(k => k.t < 9).slice(-6);
      for (const l of this.chat) l.t += dt; if (this.chat.length > 40) this.chat.shift();
      for (const pg of this.pings) pg.t += dt; this.pings = this.pings.filter(p => p.t < 2);
      if (this.announce) this.announce.t += dt;
      if (this.msg) { this.msg.t += dt; if (this.msg.t > 1.6) this.msg = null; }
      if (g.winner >= 0) { this.endT = (this.endT || 0) + dt; if (this.endT > 3 && !this.endShown) this.showEnd(); }
      this.updateCamera(dt);
      this.audio.cam = { x: this.R.cam.x + W / Z / 2, y: this.R.cam.y + HUD_Y / Z / 2 };
      this.hoverUnit = this.pickUnit();
      if (this.selected && this.selected.dead && !this.selected.structure) this.selected = null;
    }
    updateCamera(dt) {
      const p = this.player, R = this.R, sp = 2200 * dt;
      if (p && (this.camLocked || this.keys.has('Space')) && !this.dragMini) { const a = this.alpha || 1; R.centerOn(p.px + (p.x - p.px) * a, p.py + (p.y - p.py) * a); return; }
      let dx = 0, dy = 0;
      if (this.keys.has('ArrowLeft')) dx -= 1; if (this.keys.has('ArrowRight')) dx += 1; if (this.keys.has('ArrowUp')) dy -= 1; if (this.keys.has('ArrowDown')) dy += 1;
      const active = !this.opts.isActive || this.opts.isActive();
      if (this.options.edge && this.mouseIn && active && !this.overlay) { if (this.mx < 6) dx -= 1; if (this.mx > W - 6) dx += 1; if (this.my < 6) dy -= 1; if (this.my > H - 6) dy += 1; }
      if (dx || dy) R.centerOn(R.cam.x + W / Z / 2 + dx * sp, R.cam.y + HUD_Y / Z / 2 + dy * sp);
    }
    pickUnit() {
      if (this.my >= HUD_Y || !this.g) return null;
      const [wx, wy] = this.R.toWorld(this.mx, this.my), team = this.viewTeam;
      let best = null, bd = 1e9;
      for (const u of this.g.units) {
        if (u.dead || u.kind === 'trap') continue;
        if (!this.spectator && u.team !== team && !u.vis[team] && !u.structure) continue;
        const h = u.structure ? (u.kind === 'nexus' ? 380 : u.kind === 'tower' ? 300 : 200) : u.kind === 'champ' ? this.R.champSet(u).top / Z * 0.92 : u.kind === 'monster' ? Math.max(90, u.r * 1.2) : 90;
        const cx = u.x, cy = u.y - h / 2 - (u.z || 0), rx = Math.max(55, u.r * 1.1), ry = h / 2 + 20;
        const d = Math.hypot((wx - cx) / rx, (wy - cy) / ry);
        if (d < 1 && d - (u.kind === 'champ' ? 0.3 : 0) < bd) { bd = d - (u.kind === 'champ' ? 0.3 : 0); best = u; }
      }
      return best;
    }

    processEvents(g) {
      const pl = this.player, team = this.viewTeam, byId = id => g.units.find(u => u.id === id);
      let fbThisTick = false;
      for (const e of g.events) {
        switch (e.type) {
          case 'sfx': if (e.unit != null && (!pl || e.unit !== pl.id) && e.name === 'buy') break; if (e.x == null || this.spectator || g.vis[team][g.visIdx(e.x, e.y)] || e.global) this.audio.play(e.name, e.x, e.y, { global: e.global }); break;
          case 'fx': { const u = e.unit ? byId(e.unit) : null; const x = e.x != null ? e.x : u && u.x, y = e.y != null ? e.y : u && u.y; if (this.spectator || x == null || g.vis[team][g.visIdx(x, y)]) this.R.addFx(g, e); break; }
          case 'dmg': {
            if (!this.options.dmgnums) break;
            const mine = pl && (e.src === pl.id || e.tgt === pl.id); if (!mine && !this.spectator) break;
            const toMe = pl && e.tgt === pl.id;
            if (e.dtype === 'miss') this.R.addFloat(this.lang === 'ru' ? 'Промах' : 'Miss', e.x, e.y, '#c0c0c0', 10);
            else if (e.dtype === 'heal') { if (toMe || e.src === (pl && pl.id)) this.R.addFloat('+' + e.amt, e.x, e.y, '#60ff60', 10); }
            else if (e.amt >= 3 || e.crit) this.R.addFloat(String(e.amt) + (e.crit ? '!' : ''), e.x + (Math.random() - 0.5) * 60, e.y, toMe ? '#ff4040' : e.dtype === 'magic' ? '#d080ff' : e.dtype === 'true' ? '#ffffff' : '#ffb060', e.crit ? 15 : 10);
            break;
          }
          case 'gold': if (pl && e.unit === pl.id) { this.R.addFloat('+' + e.amt, e.x, e.y - 30, '#ffd040', 11); this.audio.play('gold', e.x, e.y); } break;
          case 'announce': {
            let key = e.key, color = GOLD;
            if (key === 'firstBlood') { fbThisTick = true; this.kfLabel = this.S.firstBlood; }
            if (key === 'tower') { key = e.team === team ? 'towerAlly' : 'towerEnemy'; color = e.team === team ? '#ff8070' : '#80b0ff'; this.pings.push({ x: e.x, y: e.y, t: 0, color: '#ffa040' }); }
            if (key === 'inhib') { key = e.team === team ? 'inhibAlly' : 'inhibEnemy'; color = e.team === team ? '#ff8070' : '#80b0ff'; }
            if (key === 'dragon' || key === 'baron') { key = key + (e.team === team ? 'Ally' : 'Enemy'); }
            if (key === 'ace') { if (e.team === team) { color = '#ff8070'; } }
            if (key === 'dragonSpawn' || key === 'baronSpawn') break;
            if (this.S[key]) this.say(this.S[key], color);
            break;
          }
          case 'kill': {
            const k = byId(e.killer), v = byId(e.victim); if (!v) break;
            this.killFeed.push({ killer: k && k.kind === 'champ' ? (k.skinId || k.cid) : null, victim: v.skinId || v.cid, ally: v.team !== team, t: 0, label: fbThisTick ? this.S.firstBlood : e.multi >= 2 ? this.S.multi[Math.min(5, e.multi)] : '' });
            if (fbThisTick) break;
            let text, color = GOLD;
            if (e.multi >= 2) text = this.S.multi[Math.min(5, e.multi)];
            else if (pl && v === pl) { text = this.S.youDied; color = '#ff6060'; }
            else if (pl && k === pl) text = e.shutdown ? this.S.shutdown : this.S.youSlain;
            else if (e.spree >= 3 && this.S.spree[Math.min(8, e.spree)]) text = this.S.spree[Math.min(8, e.spree)];
            else if (e.shutdown) text = this.S.shutdown;
            else { text = v.team === team ? this.S.allySlain : this.S.enemySlain; color = v.team === team ? '#ff8070' : '#80b0ff'; }
            this.say(text, color);
            if (k && k.bot && Math.random() < 0.12) L.AI.say(g, k, 'kill', 1);
            if (v.bot && Math.random() < 0.12) L.AI.say(g, v, 'death', 1);
            break;
          }
          case 'chat': this.chat.push({ from: e.from, text: e.text, team: e.team, all: e.all, t: 0 }); break;
          case 'levelup': if (pl && e.unit === pl.id) { this.audio.play('levelup'); this.R.addFloat(this.lang === 'ru' ? 'Новый уровень!' : 'Level up!', pl.x, pl.y - 60, '#ffe060', 12, 1.4); } break;
          case 'towerAggro': if (pl && e.unit === pl.id) this.audio.play('warning'); break;
          case 'recallEnd': if (pl && e.unit === pl.id && e.done) { this.audio.play('recall', null, null); } break;
          case 'respawn': if (pl && e.unit === pl.id) this.camLocked = this.options.camlock || this.camLocked; break;
          case 'end': this.recordResult(e.winner); break;
        }
      }
      g.events.length = 0;
    }
    say(text, color) { this.announce = { text, color, t: 0 }; if (!this.audio.speak(text)) this.audio.play('announce'); }
    recordResult(winner) {
      const p = this.player; if (!p) return;
      const win = winner === p.team, pr = this.profile;
      if (win) pr.wins++; else pr.losses++;
      const c = pr.champ[p.cid] = pr.champ[p.cid] || { w: 0, l: 0 }; if (win) c.w++; else c.l++;
      store.set(PROF_KEY, pr);
      if (this.coll.complete()) this.endReward = { chest: false };
      else { this.endReward = { chest: this.coll.addChest(p.cid) }; this.saveColl(); }
    }
    showEnd() { this.endShown = true; this.overlay = null; this.targeting = null; this.audio.stopTune(); const p = this.player; this.say(!p || this.g.winner === p.team ? this.S.victory : this.S.defeat, GOLD); }

    draw(dt) {
      const c = this.ctx, R = this.R;
      R.hits = []; c.imageSmoothingEnabled = false;
      if (this.screen === 'title') this.drawTitle(dt);
      else if (this.screen === 'collection') this.drawCollection();
      else if (this.screen === 'select') this.drawSelect();
      else if (this.screen === 'loading') this.drawLoading();
      else if (this.screen === 'game' && this.g) this.drawGame(dt);
      if (this.overlay === 'options') this.drawOptions();
      if (this.overlay === 'help') this.drawHelp();
      if (this.overlay === 'chest') { R.hits = []; this.drawChest(); }
      this.drawToast();
      this.hover = this.hitAt(this.mx, this.my);
      if (this.hover && this.hover.tip) R.tooltip(this.hover.tip, this.mx, this.my, this.g);
      if (this.screen === 'game' && this.my < HUD_Y && !this.overlay) {
        const u = this.hoverUnit, p = this.player;
        if (this.targeting || (u && p && u.team !== p.team)) { c.strokeStyle = this.targeting ? '#80c0ff' : '#ff4040'; c.lineWidth = 1.5; c.beginPath(); c.arc(this.mx, this.my, 7, 0, 6.3); c.moveTo(this.mx - 10, this.my); c.lineTo(this.mx + 10, this.my); c.moveTo(this.mx, this.my - 10); c.lineTo(this.mx, this.my + 10); c.stroke(); }
      }
    }
    drawBg(dim = 0.55) {
      const c = this.ctx, T = this.A.terrain;
      if (T) {
        const t = this.t * 12, s = T.scale, x = 700 + (Math.sin(t / 90) * 0.5 + 0.5) * 900, y = 700 + (Math.cos(t / 110) * 0.5 + 0.5) * 900;
        c.drawImage(T.canvas, x, y, W / 2, H / 2, 0, 0, W, H); void s;
      } else { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a1430'); g.addColorStop(1, '#02040a'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
      c.fillStyle = `rgba(4,6,14,${dim})`; c.fillRect(0, 0, W, H);
    }
    logo(x, y, s = 1) {
      const R = this.R, c = this.ctx;
      R.text('LEAGUE', x, y, { align: 'center', size: 44 * s, bold: true, serif: true, color: GOLD, shadowColor: '#2a1a00' });
      R.text('of', x, y + 24 * s, { align: 'center', size: 16 * s, serif: true, color: '#d8c090' });
      R.text('LEGENDS', x, y + 64 * s, { align: 'center', size: 44 * s, bold: true, serif: true, color: GOLD, shadowColor: '#2a1a00' });
      c.fillStyle = '#8a1a10'; c.fillRect(x + 118 * s, y + 30 * s, 56 * s, 34 * s); c.strokeStyle = GOLD; c.lineWidth = 2; c.strokeRect(x + 118 * s, y + 30 * s, 56 * s, 34 * s);
      R.text('98', x + 146 * s, y + 57 * s, { align: 'center', size: 26 * s, bold: true, serif: true, color: '#ffe8a0' });
    }
    drawGame(dt) {
      const R = this.R, g = this.g, c = this.ctx;
      this.viewTeam = this.player ? this.player.team : 0;
      R.draw(g, this.alpha == null ? 1 : this.alpha, (this.overlay === 'menu' || this.overlay === 'options' || this.overlay === 'help') ? 0 : dt);
      R.drawTop(g);
      R.drawHud(g);
      if (this.msg) R.text(this.msg.text, 400, 140, { align: 'center', size: 13, bold: true, color: '#ff6060' });
      if (this.targeting && this.targeting.kind === 'attackMove') R.text('A', this.mx + 10, this.my + 18, { size: 10, bold: true, color: '#ff6060' });
      if (this.overlay === 'shop') this.drawShop();
      if (this.keys.has('Tab') || this.showScore) this.drawScore();
      if (this.overlay === 'menu') this.drawMenu();
      const active = !this.opts.isActive || this.opts.isActive();
      if (!active && !this.overlay && !this.endShown) { c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(0, 0, W, HUD_Y); R.text(this.S.paused, 400, 230, { align: 'center', size: 26, bold: true, serif: true, color: GOLD }); }
      if (this.endShown) this.drawEnd();
    }
    drawMenu() {
      const R = this.R, S = this.S;
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)'; this.ctx.fillRect(0, 0, W, H);
      R.panel(290, 150, 220, 250, { title: S.paused });
      R.button(310, 190, 180, 30, S.resume, 'resume');
      R.button(310, 228, 180, 30, S.options, 'menuOptions');
      R.button(310, 266, 180, 30, S.help, 'menuHelp');
      R.button(310, 304, 180, 30, S.surrender, 'surrender', { disabled: !this.player });
      R.button(310, 352, 180, 30, S.quitGame, 'quit');
    }
    drawOptions() {
      const R = this.R, S = this.S, o = this.options;
      this.ctx.fillStyle = 'rgba(0,0,0,0.55)'; this.ctx.fillRect(0, 0, W, H);
      R.panel(220, 100, 360, 380, { title: S.options });
      let y = 140;
      for (const k of ['sfx', 'music']) {
        R.text(S[k], 240, y + 16, { size: 12, color: '#e8dcc0' });
        R.button(400, y, 26, 24, '−', 'vol', { data: [k, -0.1] }); R.bar(432, y + 8, 90, 8, o[k], '#40a0ff', '#101830'); R.button(530, y, 26, 24, '+', 'vol', { data: [k, 0.1] });
        y += 34;
      }
      for (const k of ['announcer', 'quickcast', 'camlock', 'dmgnums', 'names', 'edge', 'fps']) {
        R.text(k === 'names' ? (this.lang === 'ru' ? 'Имена над чемпионами' : 'Names above champions') : S[k], 240, y + 16, { size: 12, color: '#e8dcc0' });
        R.button(480, y, 76, 24, o[k] ? S.on : S.off, 'opt', { data: k, active: o[k] });
        y += 32;
      }
      R.button(340, 438, 120, 30, S.back, 'close');
    }
    drawHelp() {
      const R = this.R, S = this.S;
      this.ctx.fillStyle = 'rgba(0,0,0,0.6)'; this.ctx.fillRect(0, 0, W, H);
      R.panel(90, 80, 620, 420, { title: S.help });
      let y = 130;
      for (const line of S.helpText) { R.text('•', 110, y, { size: 12, color: GOLD }); y = R.wrap(line, 124, y, 570, { size: 11, color: '#e8e0d0' }) + 8; }
      R.button(340, 452, 120, 30, S.back, 'close');
    }
    drawShop() {
      const R = this.R, S = this.S, g = this.g, p = this.player, c = this.ctx; if (!p) return;
      R.panel(84, 30, 632, 424, { title: S.shop });
      R.button(688, 36, 22, 20, '×', 'shopClose');
      const inShop = g.inShop(p);
      SHOP_TABS.forEach((t, i) => R.button(94, 64 + i * 30, 102, 26, this.L(t.name), 'shopTab', { data: t.id, active: this.shopTab === t.id, size: 10 }));
      c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(94, 252, 102, 44); c.strokeStyle = GOLD_D; c.strokeRect(94.5, 252.5, 101, 43);
      R.text(S.gold, 145, 268, { align: 'center', size: 9, color: '#b8a878' });
      R.text(String(Math.floor(p.gold)), 145, 288, { align: 'center', size: 16, bold: true, color: '#ffe060' });
      if (!inShop) { c.fillStyle = 'rgba(110,24,20,0.8)'; c.fillRect(94, 304, 102, 44); c.strokeStyle = '#c05040'; c.strokeRect(94.5, 304.5, 101, 43); R.wrap(S.notInShop, 100, 320, 92, { size: 9, bold: true, color: '#ffd0c0', lh: 11 }); }
      let list;
      const tab = SHOP_TABS.find(t => t.id === this.shopTab) || SHOP_TABS[0];
      if (tab.id === 'rec') { const seen = new Set(); list = []; for (const id of p.def.build.concat(['hpPot', 'ward', 'visionWard'])) if (!seen.has(id)) { seen.add(id); list.push(id); } }
      else if (tab.id === 'cons') list = Object.keys(ITEMS).filter(k => ITEMS[k].cat === 'cons');
      else list = Object.keys(ITEMS).filter(k => tab.cats.includes(ITEMS[k].cat) && (!tab.filter || tab.filter(ITEMS[k].stats || {}))).sort((a, b) => ITEMS[a].cost - ITEMS[b].cost);
      const cols = 6, per = cols * 6, maxScroll = Math.max(0, Math.ceil((list.length - per) / cols));
      this.shopScroll = Math.min(this.shopScroll || 0, maxScroll);
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(204, 60, 296, 346);
      const owned = new Set(p.items.filter(Boolean).map(i => i.id));
      list.slice(this.shopScroll * cols, this.shopScroll * cols + per).forEach((id, i) => {
        const x = 211 + (i % cols) * 48, y = 66 + Math.floor(i / cols) * 56;
        const can = !g.canBuy(p, id), price = g.buyPlan(p, id).price, on = this.shopSel === id;
        if (on) { c.fillStyle = 'rgba(232,192,96,0.22)'; c.fillRect(x - 4, y - 4, 46, 54); }
        c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, 40, 40); R.icon(L.Icons.item(id, 38), x, y, 38);
        if (!can) { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x, y, 38, 38); }
        R.frame(x, y, 38, on ? '#ffffff' : GOLD_D);
        if (owned.has(id)) { c.fillStyle = '#1a6a2a'; c.fillRect(x + 27, y + 27, 11, 11); R.text('✓', x + 32.5, y + 36, { align: 'center', size: 9, bold: true, color: '#c0ffc0' }); }
        R.text(String(price), x + 19, y + 49, { align: 'center', size: 10, bold: true, color: can ? '#ffe060' : '#8a7040' });
        R.hit(x - 3, y - 3, 44, 54, 'shopItem', id, { item: id });
      });
      if (maxScroll) R.text(`${this.shopScroll + 1}/${maxScroll + 1} ▲▼`, 352, 402, { align: 'center', size: 9, color: '#9aa0b8' });
      const sel = this.shopSel || list[0];
      if (sel) {
        const it = ITEMS[sel], x0 = 510, plan = g.buyPlan(p, sel);
        c.fillStyle = 'rgba(0,0,0,0.38)'; c.fillRect(x0 - 4, 60, 204, 346); c.strokeStyle = 'rgba(138,106,40,0.5)'; c.strokeRect(x0 - 3.5, 60.5, 203, 345);
        c.fillStyle = '#000'; c.fillRect(x0 + 2, 66, 46, 46); R.icon(L.Icons.item(sel, 44), x0 + 3, 67, 44); R.frame(x0 + 3, 67, 44, GOLD);
        R.text(this.L(it.name), x0 + 54, 80, { size: this.fitSize(this.L(it.name), 142, 12, true), bold: true, color: GOLD });
        R.text(`${S.cost}: ${plan.price}` + (plan.price !== it.cost ? ` (${it.cost})` : ''), x0 + 54, 95, { size: 10, bold: true, color: '#ffe060' });
        R.button(x0 + 54, 100, 142, 22, S.buy, 'buy', { disabled: !!g.canBuy(p, sel), size: 11, active: !g.canBuy(p, sel) });
        let y = 134;
        for (const k in it.stats || {}) { R.text(`+${D.PCT_STATS.has(k) ? Math.round(it.stats[k] * 100) + '%' : it.stats[k]} ${this.L(D.STAT_NAMES[k])}`, x0 + 4, y, { size: 10, color: '#a0e0a0' }); y += 13; }
        if (it.desc) y = R.wrap(this.L(it.desc), x0 + 4, y + 2, 190, { size: 9, color: '#e0dccc', lh: 11 }) + 2;
        if (it.from) { R.text(S.recipe + ':', x0 + 4, y + 10, { size: 10, color: '#c0a060' }); y = this.drawRecipe(p, sel, x0 - 2, y + 18, 204); }
        const into = Object.keys(ITEMS).filter(k => (ITEMS[k].from || []).includes(sel));
        if (into.length && y < 360) { R.text(S.buildsInto + ':', x0 + 4, y + 12, { size: 10, color: '#c0a060' }); into.slice(0, 7).forEach((f, i) => { R.icon(L.Icons.item(f, 24), x0 + 4 + i * 27, y + 18, 24); R.frame(x0 + 4 + i * 27, y + 18, 24, GOLD_D); R.hit(x0 + 4 + i * 27, y + 18, 24, 24, 'shopItem', f, { item: f }); }); }
      }
      R.button(612, 414, 96, 28, S.sell + (this.invSel != null && p.items[this.invSel] ? ' ' + Math.floor(ITEMS[p.items[this.invSel].id].cost * 0.7) : ''), 'sell', { disabled: this.invSel == null || !p.items[this.invSel] || !inShop, size: 10 });
      R.button(510, 414, 96, 28, S.undo, 'undo', { disabled: !p.buys.length || !inShop, size: 10 });
      R.text(this.lang === 'ru' ? 'ПКМ/двойной щелчок — купить, ПКМ по своему предмету — продать' : 'RMB/double-click — buy, RMB on your item — sell', 206, 432, { size: 9, color: '#8a90a8' });
    }
    drawRecipe(p, id, x0, y, w) {
      const R = this.R, c = this.ctx, kids = ITEMS[id].from || [];
      const have = f => p.items.some(q => q && q.id === f);
      const node = (f, x, yy, s) => { c.fillStyle = '#000'; c.fillRect(x - 1, yy - 1, s + 2, s + 2); R.icon(L.Icons.item(f, s), x, yy, s); R.frame(x, yy, s, have(f) ? '#60ff60' : GOLD_D); R.hit(x, yy, s, s, 'shopItem', f, { item: f }); };
      const link = (x1, y1, x2, y2) => { const my = Math.round((y1 + y2) / 2) + 0.5; c.strokeStyle = '#8a6a28'; c.beginPath(); c.moveTo(Math.round(x1) + 0.5, y1); c.lineTo(Math.round(x1) + 0.5, my); c.lineTo(Math.round(x2) + 0.5, my); c.lineTo(Math.round(x2) + 0.5, y2); c.stroke(); };
      const grand = kids.some(f => ITEMS[f].from), kw = grand ? 62 : 36, cx = x0 + w / 2;
      node(id, cx - 14, y, 28);
      kids.forEach((f, i) => {
        const kx = cx - kids.length * kw / 2 + i * kw + (kw - 26) / 2, ky = y + 44;
        link(cx, y + 29, kx + 13, ky - 1); node(f, kx, ky, 26);
        const gk = ITEMS[f].from || [];
        gk.forEach((gf, j) => { const gx = kx + 13 - gk.length * 11 + j * 22 + 1, gy = ky + 40; link(kx + 13, ky + 27, gx + 10, gy - 1); node(gf, gx, gy, 20); });
      });
      return y + (grand ? 106 : 74);
    }
    drawScore() {
      const R = this.R, g = this.g, c = this.ctx, S = this.S;
      R.panel(56, 44, 688, 372, { title: S.scoreboard + `  ${Math.floor(g.time / 60)}:${String(Math.floor(g.time % 60)).padStart(2, '0')}` });
      const hy = 84;
      R.text(S.level, 250, hy, { align: 'center', size: 9, color: '#9aa0b8' }); R.text(S.kda, 312, hy, { align: 'center', size: 9, color: '#9aa0b8' }); R.text(S.cs, 374, hy, { align: 'center', size: 9, color: '#9aa0b8' }); R.text(S.goldEarned, 734, hy, { align: 'right', size: 9, color: '#9aa0b8' });
      for (let t = 0; t < 2; t++) {
        const y0 = 100 + t * 158, ts = g.teamStats[t];
        c.fillStyle = t ? 'rgba(120,30,30,0.35)' : 'rgba(30,60,140,0.35)'; c.fillRect(66, y0 - 12, 668, 16);
        R.text(`${t ? S.red : S.blue}`, 72, y0, { size: 11, bold: true, color: t ? '#ff8070' : '#80b0ff' });
        R.text(`⚔ ${ts.kills}    ${S.tower}: ${ts.towers}    ${S.dragonShort}: ${ts.dragons}    ${S.baronShort}: ${ts.barons}`, 200, y0, { size: 10, color: '#e0d8c8' });
        g.champs.filter(ch => ch.team === t).forEach((ch, i) => {
          const y = y0 + 6 + i * 28;
          if (ch === this.player) { c.fillStyle = 'rgba(255,220,100,0.13)'; c.fillRect(66, y, 668, 26); }
          R.icon(this.R.face(ch, 24), 72, y + 1, 24); R.frame(72, y + 1, 24, t ? '#a04030' : '#3060b0');
          if (ch.dead) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(72, y + 1, 24, 24); R.text(String(Math.ceil(ch.respawnT)), 84, y + 18, { align: 'center', size: 10, bold: true, color: '#ff6060' }); }
          R.text(`${ch.def.name}`, 102, y + 12, { size: 10, bold: true }); R.text(ch.name, 102, y + 24, { size: 9, color: '#9aa0b8' });
          R.text(String(ch.level), 250, y + 18, { align: 'center', size: 11, bold: true, color: '#ffe8a0' });
          R.text(`${ch.kills} / ${ch.deaths} / ${ch.assists}`, 312, y + 18, { align: 'center', size: 11 });
          R.text(String(ch.cs), 374, y + 18, { align: 'center', size: 11, color: '#c8c0a8' });
          ch.items.forEach((it, k) => { c.fillStyle = '#000'; c.fillRect(410 + k * 24, y + 2, 22, 22); if (it) R.icon(L.Icons.item(it.id, 22), 410 + k * 24, y + 2, 22); });
          R.icon(L.Icons.spell(ch.spells[0], 20), 566, y + 3, 20); R.icon(L.Icons.spell(ch.spells[1], 20), 588, y + 3, 20);
          R.text(String(Math.round(ch.goldEarned)), 734, y + 18, { align: 'right', size: 10, color: '#ffe060' });
        });
      }
    }
    drawEnd() {
      const R = this.R, g = this.g, c = this.ctx, S = this.S, p = this.player;
      const win = !p || g.winner === p.team;
      c.fillStyle = 'rgba(0,0,0,0.66)'; c.fillRect(0, 0, W, H);
      const bg = c.createLinearGradient(0, 0, W, 0); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(0.5, win ? 'rgba(120,90,20,0.55)' : 'rgba(110,20,20,0.55)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = bg; c.fillRect(0, 34, W, 64);
      R.text(win ? S.victory : S.defeat, 400, 84, { align: 'center', size: 50, bold: true, serif: true, color: win ? GOLD : '#d04a38', shadowColor: '#000' });
      if (this.spectator) R.text((g.winner === 0 ? S.blue : S.red) + ' — ' + S.victory, 400, 106, { align: 'center', size: 13, color: '#e8dcc0' });
      R.panel(50, 112, 700, 352, { title: S.stats });
      const hy = 152;
      R.text(S.level, 286, hy, { align: 'center', size: 9, color: '#9aa0b8' }); R.text(S.kda, 340, hy, { align: 'center', size: 9, color: '#9aa0b8' }); R.text(S.cs, 400, hy, { align: 'center', size: 9, color: '#9aa0b8' }); R.text(S.damage, 468, hy, { align: 'center', size: 9, color: '#9aa0b8' }); R.text(S.goldEarned, 740, hy, { align: 'right', size: 9, color: '#9aa0b8' });
      for (let t = 0; t < 2; t++) {
        g.champs.filter(ch => ch.team === t).forEach((ch, i) => {
          const y = 158 + t * 150 + i * 29;
          if (ch === p) { c.fillStyle = 'rgba(255,220,100,0.13)'; c.fillRect(60, y - 1, 680, 28); }
          c.fillStyle = t ? '#8a2a20' : '#2a4a9a'; c.fillRect(60, y - 1, 3, 28);
          R.icon(this.R.face(ch, 24), 68, y + 1, 24);
          R.text(`${ch.def.name} (${ch.name})`, 98, y + 12, { size: 10, bold: true });
          const look = ch.skinId || '';
          R.text(look.endsWith('.classic') || !look ? this.L(L.SKINS.RARITY.base.name) : this.skinName(look), 98, y + 24, { size: 9, color: look && !look.endsWith('.classic') ? this.rarityOf(look).color : '#8a8470' });
          R.text(String(ch.level), 286, y + 18, { align: 'center', size: 11, bold: true, color: '#ffe8a0' });
          R.text(`${ch.kills}/${ch.deaths}/${ch.assists}`, 340, y + 18, { align: 'center', size: 11, bold: true });
          R.text(String(ch.cs), 400, y + 18, { align: 'center', size: 10, color: '#c8c0a8' });
          R.text(String(Math.round(ch.dmgToChamps)), 468, y + 18, { align: 'center', size: 10, color: '#ffb060' });
          ch.items.forEach((it, k) => { c.fillStyle = '#000'; c.fillRect(512 + k * 21, y + 3, 19, 19); if (it) R.icon(L.Icons.item(it.id, 22), 512 + k * 21, y + 3, 19); });
          R.text(`${Math.round(ch.goldEarned)}`, 740, y + 18, { align: 'right', size: 10, color: '#ffe060' });
        });
      }
      const ry = 472;
      c.fillStyle = 'rgba(8,10,20,0.9)'; c.fillRect(50, ry, 700, 60); c.strokeStyle = GOLD_D; c.strokeRect(50.5, ry + 0.5, 699, 59);
      R.text(S.reward, 64, ry + 18, { size: 11, bold: true, color: GOLD });
      const rw = this.endReward;
      if (this.spectator || !rw) R.text(S.noRewardSpectate, 64, ry + 40, { size: 11, color: '#b8b0a0' });
      else if (rw.chest) {
        const bob = Math.sin(this.t * 3) * 2;
        c.drawImage(L.Icons.chest(56, false), 150, ry + 2 + bob);
        R.text(S.chestReward, 214, ry + 26, { size: 13, bold: true, serif: true, color: '#e8f4ff' });
        R.text(`${S.chests}: ${this.coll.chests.length}   ·   ${S.skins}: ${this.coll.ownedCount()} / ${this.coll.total()}`, 214, ry + 44, { size: 10, color: '#9aa0b8' });
        R.button(560, ry + 12, 176, 36, S.openChest, 'openChest', { disabled: !this.coll.chests.length || this.coll.complete(), active: this.coll.chests.length > 0, size: 12 });
      } else R.text(S.allOwned, 64, ry + 40, { size: 12, bold: true, color: '#ffe070' });
      R.button(320, 544, 160, 36, this.lang === 'ru' ? 'Продолжить' : 'Continue', 'continue');
    }
    destroy() {
      this.ac.abort(); cancelAnimationFrame(this.raf); if (this.ro) this.ro.disconnect(); this.audio.destroy(); this.g = null;
    }
  }
  L.UI = UI;
})(globalThis.LoL98 = globalThis.LoL98 || {});
