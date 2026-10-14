(function (D) {
  'use strict';
  const DD = D.DATA, { HEROES, HERO_ORDER, ITEMS, STR, DT, RUNES } = DD;
  const R_ = D.Renderer, W = R_.W, H = R_.H, HUD_Y = R_.HUD_Y, TOP = R_.TOP;
  const OPT_KEY = 'dota98-options', PROF_KEY = 'dota98-profile', SEL_KEY = 'dota98-select', COL_KEY = 'dota98-collection';
  const COS = D.Cosmetics, GFX = D.GFX;
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
  const AOE = {
    land_mines: 'radius', stasis_trap: 'radius', suicide_squad: 'radius', remote_mines: 'radius', focused_detonate: 'radius', midnight_pulse: 'radius', black_hole: 'radius',
    crystal_nova: 'radius', shrapnel: 'radius', light_strike_array: 'radius', healing_ward: 'radius'
  };

  class UI {
    constructor(root, opts = {}) {
      this.root = root; this.opts = opts; this.ac = new AbortController();
      root.classList.add('dota98'); root.tabIndex = 0;
      root.innerHTML = '<canvas class="dota98-cv" width="800" height="600"></canvas><div class="dota98-err"></div>';
      this.cv = root.querySelector('canvas'); this.ctx = this.cv.getContext('2d');
      this.lang = opts.lang || ((globalThis.i18n && globalThis.i18n.getLanguage && globalThis.i18n.getLanguage()) === 'en' ? 'en' : 'ru');
      this.S = STR[this.lang];
      this.options = { sfx: 0.8, music: 0.5, announcer: true, quickcast: false, dmgnums: true, fps: false, edge: true, names: true, creepHp: false };
      Object.assign(this.options, store.get(OPT_KEY) || {});
      this.profile = Object.assign({ name: this.lang === 'ru' ? 'Игрок' : 'Player', wins: 0, losses: 0 }, store.get(PROF_KEY) || {});
      this.sel = Object.assign({ hero: 'techies', team: 0, diff: 1, mode: 0, cheats: true, fast: false }, store.get(SEL_KEY) || {});
      if (!HEROES[this.sel.hero]) this.sel.hero = 'techies';
      this.col = COS.normalize(store.get(COL_KEY)); this.armHero = this.sel.hero; this.armAngle = Math.PI * 0.62; this.armSpin = true; this.chest = null; this.toast = null; this.reward = null;
      this.audio = new D.Audio(); this.audio.lang = this.lang; this.applyAudio();
      G_build();
      this.R = new D.Renderer(this.cv, this);
      this.A = { icons: D.GFX.buildIcons(), tex: null }; this.R.setAssets(this.A);
      this.screen = 'title'; this.overlay = null; this.t = 0; this.fps = 0; this.fpsN = 0; this.fpsT = 0;
      this.mx = 400; this.my = 300; this.hover = null; this.keys = new Set();
      this.chat = []; this.killFeed = []; this.pings = []; this.announce = null; this.msg = null; this.clickMark = null; this.shopTab = 0;
      this.bind();
      this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.resize()) : null; if (this.ro) this.ro.observe(root); this.resize();
      this.last = performance.now(); this.frame = this.frame.bind(this); this.raf = requestAnimationFrame(this.frame);
      this.audio.playTune('menu');
      if (opts.onReady) opts.onReady(this);
    }
    L(o) { return o ? (o[this.lang] || o.en) : ''; }
    applyAudio() { this.audio.sfxVol = this.options.sfx; this.audio.musicVol = this.options.music; this.audio.voice = this.options.announcer; this.audio.applyVolume(); }
    saveOptions() { store.set(OPT_KEY, this.options); this.applyAudio(); }
    saveCol() { store.set(COL_KEY, this.col); }
    lookModel(hid) { return GFX.heroModel(hid, COS.look(this.col, hid)); }
    skinOf(u) { const m = this.skins && this.skins.get(u.illusion ? u.owner : u.id); return m || u.hid; }
    showToast(text, color) { this.toast = { text, color, at: performance.now() }; }
    grantChest(hero, src) {
      if (!COS.grantChest(this.col, hero, src)) { this.showToast(this.S.collectionDone, '#a89878'); return false; }
      this.saveCol(); this.showToast((src === 'debug' ? this.S.chestDebug : this.S.chestGot) + ': ' + this.L(HEROES[hero].name)); this.audio.play('chest_rattle');
      return true;
    }
    startChest(fromReward) {
      if (this.chest && this.chest.phase === 'shake') return;
      const pending = fromReward && this.reward && this.reward.granted && !this.reward.item;
      const res = COS.openChest(this.col, Math.random, pending ? this.col.chests.length - 1 : 0); if (!res) { this.chest = null; return; }
      this.saveCol(); this.chest = { phase: 'shake', t: 0, res }; this.audio.play('chest_rattle');
      if (pending) this.reward.item = res.item;
    }
    revealChest() { const ch = this.chest; if (!ch || ch.phase !== 'shake') return; ch.phase = 'open'; ch.t = 0; this.audio.play('chest_open'); if (ch.res.item.rarity === 'mythical' || ch.res.item.rarity === 'legendary') this.audio.play('levelup'); }
    equipItem(id) { if (!COS.equip(this.col, id)) return; this.saveCol(); this.audio.play('equip'); }
    debugHero() { return this.player ? this.player.hid : this.screen === 'armory' ? this.armHero : this.sel.hero; }
    viewTeam() { return this.player ? this.player.team : (this.g ? -1 : 0); }
    team() { return this.player ? this.player.team : 0; }
    get g() { return this._g; } set g(v) { this._g = v; }

    resize() {
      const r = this.root.getBoundingClientRect(); if (!r.width || !r.height) return;
      const s = Math.min(r.width / W, r.height / H);
      this.cv.style.width = Math.floor(W * s) + 'px'; this.cv.style.height = Math.floor(H * s) + 'px';
      this.cv.style.imageRendering = s >= 1.5 ? 'pixelated' : 'auto'; this.scale = s;
    }
    toCanvas(e) { const r = this.cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
    bind() {
      const sig = { signal: this.ac.signal }, root = this.root;
      root.addEventListener('keydown', e => this.onKey(e, true), sig);
      root.addEventListener('keyup', e => this.onKey(e, false), sig);
      this.cv.addEventListener('mousemove', e => { [this.mx, this.my] = this.toCanvas(e); this.mouseIn = true; if (this.dragMini) this.miniCam(); }, sig);
      this.cv.addEventListener('mouseleave', () => { this.mouseIn = false; }, sig);
      this.cv.addEventListener('mousedown', e => { root.focus({ preventScroll: true }); this.audio.resume(); [this.mx, this.my] = this.toCanvas(e); this.onMouse(e); }, sig);
      document.addEventListener('mouseup', e => { this.dragMini = false; if (this.drag) { this.drop(); } }, sig);
      this.cv.addEventListener('contextmenu', e => e.preventDefault(), sig);
      this.cv.addEventListener('wheel', e => { e.preventDefault(); }, { signal: this.ac.signal, passive: false });
      window.addEventListener('blur', () => this.keys.clear(), sig);
    }
    hitAt(x, y) { const h = this.R.hits; for (let i = h.length - 1; i >= 0; i--) { const r = h[i]; if (x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h) return r; } return null; }

    onKey(e, down) {
      const code = e.code, g = this.g;
      if (this.screen === 'game' && this.chatOpen && down) {
        e.preventDefault(); e.stopPropagation();
        if (code === 'Enter') return this.sendChat();
        if (code === 'Escape') { this.chatOpen = false; this.chatText = ''; return; }
        if (code === 'Backspace') { this.chatText = this.chatText.slice(0, -1); return; }
        if (e.key.length === 1 && this.chatText.length < 80) this.chatText += e.key;
        return;
      }
      if (code === 'F7') { e.preventDefault(); if (down && !e.repeat) this.grantChest(this.debugHero(), 'debug'); return; }
      if (this.chest && down) { e.preventDefault(); if (code === 'Escape' || code === 'Enter' || code === 'Space') { if (this.chest.phase === 'shake') this.revealChest(); else this.chest = null; } return; }
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyD', 'KeyF', 'F1', 'F2', 'F3', 'F4', 'Enter', 'KeyB', 'KeyN', 'KeyV', 'KeyC', 'KeyX', 'KeyZ', 'KeyT'].includes(code) || e.ctrlKey && /Key[QWERD]/.test(code)) e.preventDefault();
      if (down) this.keys.add(code); else this.keys.delete(code);
      if (!down) return;
      this.audio.resume();
      if (code === 'Escape') return this.escape();
      if (this.screen !== 'game' || !g) return;
      if (this.overlay === 'menu' || this.overlay === 'options' || this.overlay === 'help' || this.endShown) return;
      const p = this.player;
      if (code === 'Enter') { this.chatOpen = true; this.chatText = ''; return; }
      if (code === 'F4' || code === 'KeyP' && !p) { this.overlay = this.overlay === 'shop' ? null : 'shop'; this.audio.play('click'); return; }
      if (code === 'Space' || code === 'F1') { if (p) this.R.centerOn(p.x, p.y); return; }
      if (code === 'F12') { this.options.fps = !this.options.fps; return; }
      if (!p) return;
      if (code === 'KeyU') { this.overlay = this.overlay === 'talents' ? null : 'talents'; return; }
      if (code === 'F3') { g.courierDeliver(p); this.audio.play('click'); return; }
      if (code === 'F2') { const c = p.courier; if (c && !c.dead) this.R.centerOn(c.x, c.y); return; }
      if (e.altKey && code === 'KeyG') { this.doGlyph(); return; }
      const slot = { KeyQ: 0, KeyW: 1, KeyE: 2, KeyR: 3, KeyD: 4, KeyF: 5 }[code];
      if (slot != null) { if ((e.ctrlKey || e.altKey) && slot < 4) { g.levelAbility(p, slot); return; } this.beginTarget('ability', slot); return; }
      const item = { KeyZ: 0, KeyX: 1, KeyC: 2, KeyV: 3, KeyB: 4, KeyN: 5 }[code];
      if (item != null) return this.beginTarget('item', item);
      if (code === 'KeyT') return this.beginTarget('item', 'tp');
      if (code === 'KeyS') { g.order(p, { type: 'stop' }); this.targeting = null; return; }
      if (code === 'KeyH') { g.order(p, { type: 'hold' }); this.targeting = null; return; }
      if (code === 'KeyA') { this.targeting = { kind: 'attackMove' }; return; }
      if (code === 'KeyY') { this.follow = !this.follow; return; }
    }
    escape() {
      if (this.screen === 'lobby' || this.screen === 'heroes' || this.screen === 'armory') { this.screen = 'title'; return; }
      if (this.screen === 'pick') { this.screen = 'lobby'; return; }
      if (this.screen !== 'game') { this.overlay = null; return; }
      if (this.endShown) return;
      if (this.chatOpen) { this.chatOpen = false; return; }
      if (this.targeting) { this.targeting = null; return; }
      if (this.overlay === 'shop' || this.overlay === 'talents') { this.overlay = null; return; }
      if (this.overlay === 'options' || this.overlay === 'help') { this.overlay = 'menu'; return; }
      this.overlay = this.overlay === 'menu' ? null : 'menu';
    }
    beginTarget(kind, slot) {
      const g = this.g, p = this.player; if (!p || p.dead) return;
      if (kind === 'ability') {
        const ab = g.ability(p, slot); if (!ab || !g.rank(p, slot)) return;
        if (ab.tgt === 'passive') return;
        if (ab.tgt === 'none' || ab.tgt === 'toggle') { g.order(p, { type: 'cast', slot }); return; }
        if (!g.checkCast(p, slot, { x: p.x, y: p.y, target: p })) { if (ab.tgt === 'point' || ab.tgt === 'none') return; }
        this.targeting = { kind, slot };
        if (this.options.quickcast && this.my < HUD_Y && this.my > TOP) this.worldClick(0, true);
        return;
      }
      if (kind === 'item') {
        const it = g.itemIn(p, slot); if (!it) return; const d = ITEMS[it.id]; if (!d.active) return;
        const needsTarget = ['tango', 'tp', 'ward_obs', 'ward_sentry', 'blink', 'force', 'euls', 'dagon', 'hex', 'midas', 'glimmer', 'chop', 'abyssal'].includes(d.active);
        if (!needsTarget) { g.order(p, { type: 'item', slot }); return; }
        this.targeting = { kind, slot };
        if (this.options.quickcast && this.my < HUD_Y && this.my > TOP) this.worldClick(0, true);
      }
    }
    aoeOf(p, slot) { const ab = this.g.ability(p, slot), k = AOE[ab.key]; if (!k) return 0; return this.g.av(p, slot, k); }
    onMouse(e) {
      const h = this.hitAt(this.mx, this.my);
      if (this.chest) { if (e.button === 0 && h) this.click(h); return; }
      if (this.screen !== 'game') { if (e.button === 0 && h) this.click(h); if (e.button === 2 && this.screen === 'pick' && h && h.id === 'heroSel') { this.click(h); this.click({ id: 'pickConfirm' }); } return; }
      const g = this.g, p = this.player;
      if (this.endShown) { if (e.button === 0 && h) this.click(h); return; }
      if (this.overlay && this.overlay !== 'shop' && this.overlay !== 'talents') { if (e.button === 0 && h) this.click(h); return; }
      if (this.overlay === 'talents' && h && (h.id === 'talent' || h.id === 'talentPanel')) { if (h.id === 'talent') this.click(h); return; }
      if (this.overlay === 'shop' && h && (h.id === 'buy' || h.id === 'shopPanel' || h.id === 'shopTab' || h.id === 'shopClose')) { if (h.id !== 'shopPanel') this.click(h, e.button === 2); return; }
      if (h && (this.my >= HUD_Y || this.my < TOP + 2 || h.id !== 'minimap')) {
        if (h.id === 'minimap') {
          const [wx, wy] = this.R.miniToWorld(this.mx, this.my);
          if (this.targeting && e.button === 0) return this.applyTarget(wx, wy, null, e);
          if (e.button === 0) { if (e.altKey) { this.pings.push({ x: wx, y: wy, t: g.time }); this.audio.play('click'); return; } this.dragMini = true; this.follow = false; this.miniCam(); }
          else if (p) { g.order(p, { type: 'move', x: wx, y: wy }); this.clickMark = { x: wx, y: wy, t: 0 }; this.targeting = null; }
          return;
        }
        if (h.id === 'slot' && e.button === 0 && p) { const it = p[h.data.where][h.data.i]; if (it) { this.drag = { where: h.data.where, i: h.data.i, x: this.mx, y: this.my }; } return; }
        if (h.id === 'slot' && e.button === 2 && p) { const it = p[h.data.where][h.data.i]; if (it) { if (g.nearShop(p) || h.data.where === 'stash') g.sell(p, h.data.where, h.data.i); else this.showMsg(this.S.noShop.split('—')[0]); } return; }
        this.click(h, e.button === 2);
        return;
      }
      if (this.my >= HUD_Y) return;
      this.worldClick(e.button, false, e);
    }
    drop() {
      const d = this.drag; this.drag = null; const p = this.player; if (!p) return;
      const h = this.hitAt(this.mx, this.my);
      const moved = Math.hypot(this.mx - d.x, this.my - d.y) > 6;
      if (!moved) { if (d.where === 'items') this.beginTarget('item', d.i); return; }
      if (h && h.id === 'slot') { if (h.data.where === 'stash' && d.where !== 'stash' && !this.g.nearShop(p)) return; if (d.where === 'stash' && h.data.where !== 'stash' && !this.g.nearShop(p)) return; this.g.swapItems(p, d.where, d.i, h.data.where, h.data.i); this.audio.play('click'); }
      else if (this.my < HUD_Y && this.my > TOP) {  }
    }
    unitAt(px, py, filter) {
      const g = this.g, team = this.viewTeam(); let best = null, bd = 1e9;
      for (const u of g.units) {
        if (u.dead || !u._sy && !u.structure && u._sy !== 0) { if (!u.structure) continue; }
        if (team >= 0 && !u.vis[team]) continue;
        if (filter && !filter(u)) continue;
        const a = this.R.sx(u.x, u.y), b = this.R.sy(u.x, u.y), top = u.structure ? b - (u.kind === 'ancient' ? 120 : 60) : (u._sy != null ? u._sy : b - 40), rr = Math.max(12, u.r * 0.45 + (u.structure ? 30 : 6));
        if (px >= a - rr && px <= a + rr && py >= top && py <= b + 8) { const d = Math.abs(px - a) + Math.abs(py - (b + top) / 2) * 0.5 - (u.kind === 'hero' ? 12 : 0); if (d < bd) { bd = d; best = u; } }
      }
      return best;
    }
    worldClick(button, quick, e) {
      const g = this.g, p = this.player;
      const [wx, wy] = this.R.toWorld(this.mx, this.my);
      const u = this.unitAt(this.mx, this.my);
      if (button === 0) {
        if (this.targeting) return this.applyTarget(wx, wy, u, e);
        this.selected = u || null; return;
      }
      if (button === 2) {
        if (this.targeting) { this.targeting = null; return; }
        if (!p || p.dead) return;
        const rune = g.runes.find(r => Math.hypot(r.x - wx, r.y - wy) < 120);
        if (rune) { g.order(p, { type: 'pickup', rune }); this.clickMark = { x: rune.x, y: rune.y, t: 0 }; return; }
        const dropIt = g.drops.find(d => Math.hypot(d.x - wx, d.y - wy) < 120);
        if (dropIt) { g.order(p, { type: 'pickup', drop: dropIt }); this.clickMark = { x: dropIt.x, y: dropIt.y, t: 0 }; return; }
        if (u && u !== p && g.canAttack(p, u) && u.kind !== 'courier' || u && u.team !== p.team && u.kind !== 'courier' && !u.structure && g.canAttack(p, u)) { g.order(p, { type: 'attack', target: u }); this.clickMark = { x: u.x, y: u.y, t: 0, attack: true }; this.audio.play('click'); return; }
        if (u && u.structure && u.team !== p.team && g.canAttack(p, u)) { g.order(p, { type: 'attack', target: u }); this.clickMark = { x: u.x, y: u.y, t: 0, attack: true }; return; }
        if (u && u.team === p.team && u.kind === 'hero' && u !== p) { g.order(p, { type: 'follow', target: u }); return; }
        g.order(p, { type: 'move', x: wx, y: wy }); this.clickMark = { x: wx, y: wy, t: 0 };
      }
    }
    applyTarget(wx, wy, u, e) {
      const g = this.g, p = this.player, tg = this.targeting; if (!p || !tg) return;
      const keep = e && e.shiftKey;
      if (tg.kind === 'attackMove') { if (u && u.team !== p.team && g.canAttack(p, u)) g.order(p, { type: 'attack', target: u }); else g.order(p, { type: 'amove', x: wx, y: wy }); this.clickMark = { x: wx, y: wy, t: 0, attack: true }; this.targeting = null; return; }
      if (tg.kind === 'scan') { if (g.scan(p.team, wx, wy)) this.audio.play('click'); this.targeting = null; return; }
      if (tg.kind === 'ability') {
        const ab = g.ability(p, tg.slot);
        let o = { type: 'cast', slot: tg.slot };
        if (ab.tgt === 'unit' || ab.tgt === 'creep' || ab.tgt === 'ally') {
          const t = u || this.unitAt(this.mx, this.my);
          if (!t) { this.showMsg(this.S.invalid); return; }
          o.target = t;
        } else { o.x = wx; o.y = wy; }
        if (g.order(p, o)) { this.targeting = keep ? tg : null; } else this.audio.play('error');
        return;
      }
      if (tg.kind === 'item') {
        const it = g.itemIn(p, tg.slot); if (!it) { this.targeting = null; return; }
        const d = ITEMS[it.id], o = { type: 'item', slot: tg.slot, x: wx, y: wy };
        if (['tango', 'chop'].includes(d.active)) { const tree = g.map.nearestTree(wx, wy, 140); if (!tree) { this.showMsg(this.S.invalid); return; } o.tree = tree; }
        else if (['force', 'euls', 'glimmer'].includes(d.active)) o.target = u || p;
        else if (['dagon', 'hex', 'midas', 'abyssal'].includes(d.active)) { if (!u) { this.showMsg(this.S.invalid); return; } o.target = u; }
        if (g.order(p, o)) this.targeting = null; else this.audio.play('error');
      }
    }
    miniCam() { const [wx, wy] = this.R.miniToWorld(this.mx, this.my); this.R.centerOn(wx, wy); }
    click(h, right) {
      const g = this.g, p = this.player, S = this.S;
      this.audio.play('click');
      switch (h.id) {
        case 'menu':
          if (h.data === 'play') this.screen = 'lobby';
          else if (h.data === 'heroes') { this.screen = 'heroes'; this.bookHero = this.bookHero || 'techies'; }
          else if (h.data === 'armory') { this.screen = 'armory'; this.armAngle = Math.PI * 0.62; this.armSpin = true; }
          else if (h.data === 'options') this.overlay = 'options';
          else if (h.data === 'help') this.overlay = 'help';
          else if (h.data === 'exit') { if (this.opts.onExit) this.opts.onExit(); }
          break;
        case 'team': this.sel.team = h.data; break;
        case 'diff': this.sel.diff = h.data; break;
        case 'mode': this.sel.mode = h.data; break;
        case 'cheats': this.sel.cheats = !this.sel.cheats; break;
        case 'fast': this.sel.fast = !this.sel.fast; break;
        case 'back': this.screen = this.screen === 'pick' ? 'lobby' : 'title'; break;
        case 'armHero': this.armHero = h.data; this.armAngle = Math.PI * 0.62; this.armSpin = true; break;
        case 'armRot': this.armSpin = false; this.armAngle += h.data * Math.PI / 4; break;
        case 'armItem': if (!h.data.id) { COS.unequip(this.col, this.armHero, h.data.slot); this.saveCol(); } else if (COS.owns(this.col, h.data.id)) this.equipItem(h.data.id); else this.audio.play('error'); break;
        case 'armOpen': this.startChest(false); break;
        case 'endOpen': this.startChest(true); break;
        case 'chestSkip': this.revealChest(); break;
        case 'chestEquip': if (this.chest && this.chest.res) this.equipItem(this.chest.res.item.id); break;
        case 'chestNext': this.chest = null; this.startChest(false); break;
        case 'chestClose': this.chest = null; break;
        case 'chestBackdrop': break;
        case 'lobbyStart': store.set(SEL_KEY, this.sel); this.startPick(); break;
        case 'heroSel': if (!this.picked) this.sel.hero = h.data; break;
        case 'pickRandom': { const free = HERO_ORDER.filter(x => !this.pickTaken[x]); this.sel.hero = free[Math.floor(Math.random() * free.length)]; this.confirmPick(); break; }
        case 'pickConfirm': this.confirmPick(); break;
        case 'bookHero': this.bookHero = h.data; break;
        case 'bookAnim': this.bookAnim = h.data; break;
        case 'resume': this.overlay = null; break;
        case 'options': this.overlay = 'options'; break;
        case 'help': this.overlay = 'help'; break;
        case 'quit': this.leaveGame(); break;
        case 'optBack': this.overlay = this.screen === 'game' ? 'menu' : null; this.saveOptions(); break;
        case 'helpBack': this.overlay = this.screen === 'game' ? 'menu' : null; break;
        case 'opt': this.options[h.data] = !this.options[h.data]; this.saveOptions(); break;
        case 'vol': { const [k, v] = h.data.split(':'); this.options[k] = +v / 10; this.saveOptions(); break; }
        case 'endContinue': this.endShown = false; this.spectateEnd = true; break;
        case 'toMenu': this.leaveGame(); break;
        case 'ability': if (p) this.beginTarget('ability', h.data); break;
        case 'learn': if (p) g.levelAbility(p, h.data); break;
        case 'talents': this.overlay = this.overlay === 'talents' ? null : 'talents'; break;
        case 'talent': if (p && g.learnTalent(p, h.data.tier, h.data.ch)) this.audio.play('levelup'); break;
        case 'tp': if (p) this.beginTarget('item', 'tp'); break;
        case 'shop': this.overlay = this.overlay === 'shop' ? null : 'shop'; break;
        case 'shopTab': this.shopTab = h.data; break;
        case 'shopClose': this.overlay = null; break;
        case 'buy': if (p) { if (g.buy(p, h.data)) {  } } break;
        case 'courier': if (p) g.courierDeliver(p); break;
        case 'glyph': this.doGlyph(); break;
        case 'scan': this.targeting = { kind: 'scan' }; break;
        case 'buyback': if (p) g.buyback(p); break;
        case 'topHero': { const u = g.unitById(h.data); if (u && (!u.dead) && (this.viewTeam() < 0 || u.team === this.viewTeam() || u.vis[this.viewTeam()])) { this.R.centerOn(u.x, u.y); if (!p) this.followUnit = u; } break; }
        case 'portrait': if (p) this.R.centerOn(p.x, p.y); break;
      }
    }
    doGlyph() { const p = this.player; if (p && this.g.glyph(p.team)) this.audio.play('click'); }
    showMsg(text) { this.msg = { text, t: this.g ? this.g.time : 0 }; this.audio.play('error'); }
    sendChat() {
      const txt = this.chatText.trim(); this.chatOpen = false; this.chatText = '';
      if (!txt || !this.g) return;
      if (txt[0] === '-' && !this.g.cheats) { this.pushChat({ from: '', text: this.lang === 'ru' ? 'Читы выключены в настройках лобби.' : 'Cheats are disabled in the lobby.', sys: true }); return; }
      this.g.chat(this.player, txt);
    }
    pushChat(m) { m.at = performance.now(); this.chat.push(m); if (this.chat.length > 40) this.chat.shift(); }

    startPick() {
      this.screen = 'pick'; this.picked = false; this.pickTaken = {}; this.pickTimer = 60; this.pickT = 0;
      const humanTeam = this.sel.team, spect = this.sel.mode === 2;
      const names = DD.BOT_NAMES.slice().sort(() => Math.random() - 0.5);
      const slots = [];
      for (let t = 0; t < 2; t++) for (let i = 0; i < 5; i++) {
        const human = !spect && t === humanTeam && i === 0;
        slots.push({ team: t, bot: !human, name: human ? this.profile.name : names.pop() + ' [BOT]', hero: null, shown: false });
      }
      this.pickSlots = slots;
      if (this.sel.mode === 1 && !spect) { const free = HERO_ORDER.slice(); this.sel.hero = free[Math.floor(Math.random() * free.length)]; this.confirmPick(); }
      if (spect) this.picked = true;
    }
    confirmPick() {
      if (this.picked || this.pickTaken[this.sel.hero]) return;
      const s = this.pickSlots.find(x => !x.bot); if (!s) return;
      s.hero = this.sel.hero; s.model = this.lookModel(s.hero); s.shown = true; this.pickTaken[s.hero] = 'me'; this.picked = true;
      store.set(SEL_KEY, this.sel);
      this.audio.play('levelup');
    }
    tickPick(dt) {
      this.pickTimer -= dt; this.pickT += dt;
      if (this.pickTimer <= 0 && !this.picked) { const free = HERO_ORDER.filter(x => !this.pickTaken[x]); this.sel.hero = free[Math.floor(Math.random() * free.length)]; this.confirmPick(); }
      if (this.pickT > (this.picked ? 0.45 : 1.6)) {
        this.pickT = 0;
        const bots = this.pickSlots.filter(s => s.bot && !s.hero);
        if (bots.length) {
          const n0 = this.pickSlots.filter(s => s.team === 0 && s.hero).length, n1 = this.pickSlots.filter(s => s.team === 1 && s.hero).length;
          const s = bots.find(b => b.team === (n0 <= n1 ? 0 : 1)) || bots[0];
          const humanLeft = this.pickSlots.some(x => !x.bot && !x.hero);
          const free = HERO_ORDER.filter(x => !this.pickTaken[x] && !(humanLeft && x === this.sel.hero && bots.length > 1));
          if (!free.length) return;
          s.hero = free[Math.floor(Math.random() * free.length)]; s.model = GFX.heroModel(s.hero, COS.randomLook(s.hero, Math.random)); s.shown = true; this.pickTaken[s.hero] = true; this.audio.play('click');
        } else if (this.picked) { this.startLoading(); }
      }
    }
    startLoading() {
      this.screen = 'loading'; this.loadK = 0; this.loadTip = Math.random() * 10;
      const steps = [
        () => { if (!this.A.tex) { this.map0 = new D.Map(); } },
        () => { if (!this.A.tex) this.A.tex = D.GFX.buildTerrain(this.map0); },
        () => { this.A.mini = null; },
        () => { for (const hid of HERO_ORDER) for (let d = 0; d < 16; d += 2) this.R.sprites.get(hid, d / 16 * Math.PI * 2, 'idle', 0); },
        () => { for (let t = 0; t < 2; t++) for (let tier = 1; tier <= 4; tier++) this.R.sprites.static(`tower_${t}_${tier}`); for (let t = 0; t < 2; t++) for (let v = 0; v < 4; v++) this.R.sprites.get('tree_' + t + '_' + v, 0.8 + v, 'idle', 0); },
        () => this.newGame()
      ];
      this.loadSteps = steps; this.loadI = 0;
    }
    tickLoading() {
      if (!this.loadSteps) return;
      if (this.loadI < this.loadSteps.length) { try { this.loadSteps[this.loadI](); } catch (e) { this.fatal(e); return; } this.loadI++; this.loadK = this.loadI / this.loadSteps.length; }
    }
    newGame() {
      const slots = this.pickSlots.map(s => ({ hero: s.hero, team: s.team, bot: s.bot, name: s.name }));
      for (let t = 0; t < 2; t++) D.assignRoles(slots.filter(s => s.team === t));
      const g = new D.Game({ seed: (Math.random() * 1e9) | 0, slots, diff: this.sel.diff, cheats: this.sel.cheats, lang: this.lang, fastRespawn: this.sel.fast });
      this.skins = new Map(); g.heroes.forEach((h, i) => { const s = this.pickSlots[i]; if (s && s.hero === h.hid && s.model) this.skins.set(h.id, s.model); });
      this.reward = null;
      this.g = g; this.player = g.player; this.acc = 0; this.overlay = null; this.endShown = false; this.spectateEnd = false; this.targeting = null; this.followUnit = null;
      this.chat = []; this.killFeed = []; this.pings = []; this.announce = null; this.msg = null; this.R.fx = []; this.R.floats = []; this.recorded = false;
      const p = this.player || g.heroes[0]; this.R.centerOn(p.x, p.y);
      this.screen = 'game'; this.audio.playTune('game');
      this.pushChat({ from: '', text: this.lang === 'ru' ? 'Добро пожаловать в Dota 98! Бой начнётся через ' + Math.round(-g.time) + ' с. F4 — лавка.' : 'Welcome to Dota 98! The battle starts in ' + Math.round(-g.time) + 's. F4 — shop.', sys: true });
      if (g.cheats) this.pushChat({ from: '', text: this.S.cheatsOn + ': -gold 5000, -lvlup 5, -refresh, -wtf', sys: true });
    }
    leaveGame() { this.g = null; this.player = null; this.skins = null; this.reward = null; this.chest = null; this.screen = 'title'; this.overlay = null; this.endShown = false; this.audio.playTune('menu'); }
    fatal(e) { const el = this.root.querySelector('.dota98-err'); if (el) { el.style.display = 'block'; el.textContent = 'Dota 98: ' + (e && e.message || e); } if (typeof console !== 'undefined') console.error(e); }

    processEvents(g) {
      const p = this.player, team = this.viewTeam(), S = this.S, A = this.audio, R = this.R;
      const heroName = (id) => { const u = g.unitById(id); return u ? this.L(u.def.name) : '?'; };
      for (const e of g.events) {
        switch (e.type) {
          case 'sfx': {
            if (e.local && (!p || e.unit !== p.id)) break;
            if (e.global || e.x == null) { A.play(e.name, null, null, { global: true }); break; }
            if (team >= 0 && !g.slotVisible(team, e.x, e.y) && !(p && e.unit === p.id)) break;
            A.play(e.name, e.x, e.y); break;
          }
          case 'fx': if (team < 0 || e.x == null || g.slotVisible(team, e.x, e.y) || e.kind === 'hook_back') R.addFx(g, e); break;
          case 'float': if (team < 0 || e.team === team || g.slotVisible(team, e.x, e.y)) R.floats.push({ x: e.x, y: e.y, text: e.text, color: e.color, big: e.big, t: 0 }); break;
          case 'dmg': if (this.options.dmgnums && p && (e.src === p.id || e.tgt === p.id) && e.amt >= 1 && (e.kind !== 'phys' || e.tgt === p.id && e.amt >= 40)) R.floats.push({ x: e.x, y: e.y, text: String(e.amt), color: e.kind === 'mag' ? '#80a0ff' : e.kind === 'pure' ? '#ffe060' : '#ff6060', t: 0, dx: (Math.random() - 0.5) * 20, dur: 0.9 }); break;
          case 'gold': if (p && e.unit === p.id && e.amt > 0) { R.floats.push({ x: e.x, y: e.y, text: '+' + e.amt, color: '#ffd040', t: 0 }); A.play('gold', e.x, e.y); } break;
          case 'miss': if (p && e.src === p.id) R.floats.push({ x: e.x, y: e.y, text: this.lang === 'ru' ? 'промах' : 'miss', color: '#c0c0c0', t: 0, dur: 0.7 }); break;
          case 'deny': if (team < 0 || g.slotVisible(team, e.x, e.y)) R.floats.push({ x: e.x, y: e.y, text: '!', color: '#ffffff', big: true, t: 0, dur: 0.8 }); break;
          case 'error': if (p && e.unit === p.id) this.showMsg(S[e.key] || e.key); break;
          case 'levelup': if (p && e.unit === p.id) { R.floats.push({ x: p.x, y: p.y, text: S.level + ' ' + e.level + '!', color: '#ffe060', big: true, t: 0, dur: 1.5 }); } break;
          case 'kill': {
            const v = g.unitById(e.victim), k = e.killer ? g.unitById(e.killer) : null;
            const kh = k && k.kind === 'hero' ? k.hid : null;
            const text = kh && !e.deny ? (this.L(k.def.name) + ' ' + S.killed + ' ' + this.L(v.def.name)) : (this.L(v.def.name) + (this.lang === 'ru' ? ' погиб' : ' died'));
            this.killFeed.unshift({ t: g.time, killer: kh && !e.deny ? this.skinOf(k) : null, victim: this.skinOf(v), text, color: v.team === team ? '#ff8070' : '#90ff90' }); if (this.killFeed.length > 6) this.killFeed.pop();
            if (p && e.victim === p.id) this.showMsg((this.lang === 'ru' ? 'Вас убил: ' : 'Killed by: ') + (k ? (k.kind === 'hero' ? this.L(k.def.name) : k.kind) : '?'));
            if (p && e.killer === p.id && e.gold) R.floats.push({ x: v.x, y: v.y, text: '+' + e.gold, color: '#ffd040', big: true, t: 0, dur: 1.4 });
            break;
          }
          case 'announce': this.onAnnounce(g, e); break;
          case 'msg': this.onMsg(g, e); break;
          case 'chat': if (e.all || team < 0 || e.team === team || e.sys) this.pushChat({ from: e.from, text: e.text, team: e.team, all: e.all, sys: e.sys }); break;
          case 'rune': if (p && e.unit === p.id) { const n = this.L(RUNES[e.kind].name); this.announce = { text: n, t: g.time, color: RUNES[e.kind].color }; if (e.kind !== 'bounty' && e.kind !== 'water') A.speak(n); } break;
          case 'scan': if (e.team === team) this.pings.push({ x: e.x, y: e.y, t: g.time }); break;
          case 'respawn': if (p && e.unit === p.id) R.centerOn(p.x, p.y); break;
          case 'tpDone': if (p && e.unit === p.id) R.centerOn(p.x, p.y); break;
          case 'death': if (e.kind === 'creep' && (team < 0 || g.slotVisible(team, e.x, e.y))) A.play('creep_die', e.x, e.y); break;
          case 'victory': this.onVictory(g, e.team); break;
        }
      }
      g.events.length = 0;
      this.pings = this.pings.filter(pg => g.time - pg.t < 3);
    }
    onAnnounce(g, e) {
      const ru = this.lang === 'ru', S = this.S;
      const T = {
        welcome: ru ? 'Добро пожаловать в Dota 98' : 'Welcome to Dota 98', horn: S.horn, firstBlood: S.firstBlood,
        streak3: ru ? 'Серия убийств!' : 'Killing Spree!', streak4: ru ? 'Доминирует!' : 'Dominating!', streak5: ru ? 'Мега-убийство!' : 'Mega Kill!', streak6: ru ? 'Неудержим!' : 'Unstoppable!',
        streak7: ru ? 'Нечто невероятное!' : 'Wicked Sick!', streak8: ru ? 'Монстр!' : 'Monster Kill!', streak9: ru ? 'Богоподобен!' : 'Godlike!', streak10: ru ? 'Выше богов!' : 'Beyond Godlike!',
        multi2: ru ? 'Двойное убийство!' : 'Double Kill!', multi3: ru ? 'Тройное убийство!' : 'Triple Kill!', multi4: ru ? 'Ультра-убийство!' : 'Ultra Kill!', multi5: ru ? 'Буйство!' : 'Rampage!',
        ended: ru ? 'Серия прервана!' : 'Shut Down!', radiantTower: ru ? 'Башня Сил Света разрушена' : 'The Radiant tower has fallen', direTower: ru ? 'Башня Сил Тьмы разрушена' : 'The Dire tower has fallen', towerDenied: ru ? 'Башня добита своими' : 'Tower denied',
        rax: S.raxFell, roshan: S.roshanKilled, aegis: ru ? 'Аегис подобран' : 'The Aegis has been claimed', aegisExpired: ru ? 'Аегис истёк' : 'The Aegis has expired', blackHole: ru ? 'Чёрная дыра!' : 'Black Hole!'
      };
      const text = T[e.key]; if (!text) return;
      let sub = '';
      if (e.unit) { const u = g.unitById(e.unit); if (u && u.def) sub = u.name.replace(' [BOT]', '') + ' — ' + this.L(u.def.name); }
      if (e.key === 'blackHole' && this.player && g.unitById(e.unit) && g.unitById(e.unit).team === this.player.team && this.viewTeam() >= 0) {  }
      this.announce = { text, sub, t: g.time, color: e.key.startsWith('streak') || e.key.startsWith('multi') ? '#ff9040' : e.key === 'firstBlood' ? '#ff4030' : '#ffd060' };
      if (e.key !== 'blackHole') { this.audio.play('announce', null, null, { global: true }); this.audio.speak(text); }
      if (e.key === 'horn') this.audio.play('horn', null, null, { global: true });
    }
    onMsg(g, e) {
      const S = this.S, ru = this.lang === 'ru';
      const laneN = { top: ru ? 'верхней' : 'top', mid: ru ? 'центральной' : 'middle', bot: ru ? 'нижней' : 'bottom', base: ru ? 'базы' : 'base' };
      let text = '';
      if (e.key === 'towerFell') text = (e.team === 0 ? S.radiant : S.dire) + ': ' + (ru ? 'башня T' + e.tier + ' ' + laneN[e.lane] + ' линии разрушена' : 'tier ' + e.tier + ' ' + laneN[e.lane] + ' tower destroyed');
      else if (e.key === 'raxFell') text = (e.team === 0 ? S.radiant : S.dire) + ': ' + (ru ? 'казармы (' + (e.raxType === 'melee' ? 'ближние' : 'дальние') + ') ' + laneN[e.lane] + ' линии разрушены' : laneN[e.lane] + ' ' + e.raxType + ' barracks destroyed');
      else if (e.key === 'roshanKilled') text = S.roshanKilled + ' (' + (e.team === 0 ? S.radiant : S.dire) + ')';
      else if (e.key === 'aegisTaken' || e.key === 'aegisReborn' || e.key === 'runeTaken') { const u = g.unitById(e.unit); text = (u ? this.L(u.def.name) : '?') + ' ' + S[e.key] + (e.rune ? ': ' + this.L(RUNES[e.rune].name) : ''); }
      else if (e.key === 'glyphUsed') text = (e.team === 0 ? S.radiant : S.dire) + ': ' + S.glyphUsed;
      else if (e.key === 'courierDead') text = (e.team === 0 ? S.radiant : S.dire) + ': ' + S.courierDead;
      if (text) this.pushChat({ from: '', text, sys: true });
    }
    onVictory(g, team) {
      this.audio.stopTune(); this.audio.playTune('victory');
      const ru = this.lang === 'ru';
      this.audio.speak(team === 0 ? (ru ? 'Силы Света победили' : 'The Radiant are victorious') : (ru ? 'Силы Тьмы победили' : 'The Dire are victorious'));
      if (!this.recorded && this.player) { this.recorded = true; if (team === this.player.team) this.profile.wins++; else this.profile.losses++; store.set(PROF_KEY, this.profile); const hero = this.player.hid, granted = COS.grantChest(this.col, hero, 'match'); if (granted) this.saveCol(); this.reward = { hero, granted }; }
      setTimeout(() => { if (this.g === g) this.endShown = true; }, 2500);
    }
    statusName(st) {
      const ru = this.lang === 'ru';
      const N = { stun: ru ? 'Оглушение' : 'Stunned', malefice: 'Malefice', bh: 'Black Hole', frostbite: 'Frostbite', nova: 'Crystal Nova', warcry: 'Warcry', gods_strength: "God's Strength", taunt: ru ? 'Провокация' : 'Taunted', battle_hunger: 'Battle Hunger', blade_fury: 'Blade Fury', rot: 'Rot', hex: ru ? 'Превращение' : 'Hexed', salve: ru ? 'Лечебная мазь' : 'Healing Salve', clarity: ru ? 'Ясность' : 'Clarity', tango: 'Tango', bottle: ru ? 'Фляга' : 'Bottle', bkb: 'Black King Bar', shadow: ru ? 'Невидимость' : 'Invisible', rune_dd: ru ? 'Двойной урон' : 'Double Damage', rune_haste: ru ? 'Ускорение' : 'Haste', rune_invis: ru ? 'Невидимость' : 'Invisibility', rune_regen: ru ? 'Регенерация' : 'Regeneration', arcane: ru ? 'Волшебство' : 'Arcane', fiery_soul: 'Fiery Soul', cyclone: ru ? 'Смерч' : 'Cyclone', corrupt: ru ? 'Порча брони' : 'Armor Corruption' };
      for (const k in N) if (st.tag === k || st.tag.startsWith(k + '_')) return N[k];
      return st.tag;
    }

    frame(now) {
      this.raf = requestAnimationFrame(this.frame);
      if (this.opts.isActive && !this.opts.isActive() && this.screen === 'game') { this.last = now; }
      const dt = Math.min(0.25, (now - this.last) / 1000); this.last = now; this.t += dt;
      this.fpsN++; this.fpsT += dt; if (this.fpsT >= 1) { this.fps = this.fpsN; this.fpsN = 0; this.fpsT = 0; }
      try { this.update(dt); this.draw(dt); } catch (e) { this.fatal(e); cancelAnimationFrame(this.raf); }
    }
    update(dt) {
      if (this.chest) { this.chest.t += dt; if (this.chest.phase === 'shake' && this.chest.t >= 1.4) this.revealChest(); }
      if (this.screen === 'armory' && this.armSpin) this.armAngle += dt * 0.45;
      if (this.screen === 'pick') this.tickPick(dt);
      if (this.screen === 'loading') this.tickLoading();
      if (this.screen !== 'game' || !this.g) return;
      const g = this.g;
      const paused = this.overlay === 'menu' || this.overlay === 'options' || this.overlay === 'help';
      if (!paused) {
        this.acc += dt * (this.speed || 1);
        let n = 0; while (this.acc >= DT && n < 8) { g.tick(); this.processEvents(g); this.acc -= DT; n++; }
        if (n >= 8) this.acc = 0;
      }
      this.camera(dt);
      const [cx, cy] = this.R.toWorld(W / 2, (HUD_Y + TOP) / 2); this.audio.cam = { x: cx, y: cy };
      this.hoverUnit = this.my < HUD_Y && this.my > TOP ? this.unitAt(this.mx, this.my) : null;
    }
    camera(dt) {
      const R = this.R, sp = 900 * dt, p = this.player;
      let dx = 0, dy = 0;
      if (this.keys.has('ArrowLeft')) dx -= sp; if (this.keys.has('ArrowRight')) dx += sp; if (this.keys.has('ArrowUp')) dy -= sp; if (this.keys.has('ArrowDown')) dy += sp;
      if (this.options.edge && this.mouseIn && !this.dragMini && !this.chatOpen && (!this.opts.isActive || this.opts.isActive())) { if (this.mx < 6) dx -= sp; if (this.mx > W - 6) dx += sp; if (this.my < 6) dy -= sp; if (this.my > H - 6) dy += sp; }
      if (dx || dy) { R.cam.x += dx; R.cam.y += dy; R.clampCam(); this.follow = false; this.followUnit = null; }
      else if (this.keys.has('Space') && p) R.centerOn(p.x, p.y);
      else if (this.follow && p) R.centerOn(p.x, p.y);
      else if (this.followUnit && !this.followUnit.dead) R.centerOn(this.followUnit.x, this.followUnit.y);
    }
    draw(dt) {
      const R = this.R; R.hits = [];
      if (this.screen === 'title') R.drawTitle();
      else if (this.screen === 'lobby') R.drawLobby();
      else if (this.screen === 'pick') R.drawPick();
      else if (this.screen === 'loading') R.drawLoading();
      else if (this.screen === 'heroes') R.drawHeroesBook();
      else if (this.screen === 'armory') R.drawArmory();
      else if (this.screen === 'game' && this.g) {
        const g = this.g;
        R.drawWorld(g, Math.max(0, Math.min(1, this.acc / DT)), dt);
        R.drawTopBar(g); R.drawHUD(g); R.drawFeed(g);
        if (this.overlay === 'shop') R.drawShop(g);
        if (this.overlay === 'talents') R.drawTalents(g);
        if (this.keys.has('Tab') && !this.endShown) R.drawScoreboard(g);
        if (this.endShown) R.drawEnd(g);
        if (this.overlay === 'menu') R.drawMenu();
        if (this.drag) { const it = this.player && this.player[this.drag.where][this.drag.i]; if (it) this.ctx.drawImage(this.A.icons.item[it.id], this.mx - 20, this.my - 14, 40, 28); }
      }
      if (this.overlay === 'options') R.drawOptions();
      if (this.overlay === 'help') R.drawHelp();
      if (this.chest) R.drawChest();
      R.drawToast();
      this.hover = this.hitAt(this.mx, this.my);
      this.drawTooltip();
      this.cv.style.cursor = this.targeting ? 'crosshair' : (this.hoverUnit && this.player && this.hoverUnit.team !== this.player.team ? 'pointer' : 'default');
    }
    drawTooltip() {
      const h = this.hover, R = this.R, g = this.g; if (!h) { if (this.screen === 'game' && this.hoverUnit && this.my < HUD_Y) this.unitTip(this.hoverUnit); return; }
      const p = this.player;
      if (h.id === 'ability' && p) R.tooltip(R.abilityLines(g, p, h.data), this.mx - 130, this.my - 10, 280);
      else if (h.id === 'pickAbility') { const hid = this.screen === 'heroes' ? this.bookHero : this.sel.hero, hd = HEROES[hid]; const ab = hd.abilities.concat(hd.extra || [], hd.scepter ? [hd.scepter] : [])[h.data]; const fake = { def: hd, talents: [-1, -1, -1, -1], ranks: [0, 0, 0, 0, 0] }; const lines = [{ text: this.L(ab.name), size: 13, bold: true, color: '#ffe0a0' }, { gap: true }, { text: this.L(ab.desc).replace(/\{(\w+)\}/g, (m0, k) => ab.v[k] ? [...new Set(ab.v[k])].join('/') : '?'), wrap: true }]; void fake; if (ab.mana && ab.mana.some(v => v)) lines.push({ text: this.S.mana + ': ' + [...new Set(ab.mana)].join('/') + '   ' + this.S.cd + ': ' + [...new Set(ab.cd)].join('/'), size: 10, color: '#9ac0ff' }); R.tooltip(lines, this.mx - 140, this.my - 10, 300); }
      else if (h.id === 'slot' && p) { const it = p[h.data.where][h.data.i]; if (it) R.tooltip(R.itemLines(g, it.id), this.mx - 130, this.my - 10, 260); }
      else if (h.id === 'tp' && p) R.tooltip(R.itemLines(g, 'tp'), this.mx - 130, this.my - 10, 240);
      else if (h.id === 'buy' && p) R.tooltip(R.itemLines(g, h.data, p), this.mx - 270, this.my + 10, 260);
      else if (h.id === 'talent' && p) { const t = p.def.talents[h.data.tier][h.data.ch]; R.tooltip([{ text: this.L(t.t), bold: true, color: '#ffe0a0' }], this.mx - 100, this.my - 6, 220); }
      else if (h.id === 'armItem') {
        const it = h.data.id ? COS.BY_ID[h.data.id] : null, S = this.S;
        if (!it) { const on = !COS.equippedId(this.col, this.armHero, h.data.slot); R.tooltip([{ text: this.L(COS.DEFAULT_NAME), bold: true, color: '#e8d8b0' }, { text: on ? S.equipped : S.clickEquip, size: 10, color: on ? '#ffe070' : '#a0e0a0' }], this.mx - 120, this.my - 8, 220); }
        else { const owned = COS.owns(this.col, it.id), on = COS.equippedId(this.col, it.hero, it.slot) === it.id; R.tooltip([{ text: this.L(it.name), bold: true, size: 12, color: R.rarityCol(it.rarity) }, { text: this.L(COS.RARITY[it.rarity].name) + ' • ' + this.L(COS.SLOTS[it.hero][it.slot]), size: 10, color: '#c8b890' }, { gap: true }, { text: on ? S.equipped : owned ? S.clickEquip : S.itemLocked, size: 10, color: on ? '#ffe070' : owned ? '#a0e0a0' : '#a89878' }], this.mx - 120, this.my - 8, 240); }
      }
      else if (h.tip) R.tooltip([{ text: h.tip, wrap: true }], this.mx - 100, this.my - 6, Math.min(300, Math.max(120, R.tw(h.tip) + 20)));
    }
    unitTip(u) {
      const R = this.R, g = this.g, ru = this.lang === 'ru';
      let name = u.kind === 'hero' ? this.L(u.def.name) + ' (' + u.name.replace(' [BOT]', '') + ')' : u.kind === 'neutral' ? this.L(DD.NEUTRALS[u.ntype].name) : u.kind === 'roshan' ? this.L(DD.ROSHAN.name) : u.kind === 'creep' ? (ru ? 'Крип' : 'Creep') : u.kind === 'tower' ? (ru ? 'Башня T' : 'Tier ') + u.tier : u.kind === 'rax' ? (ru ? 'Казармы' : 'Barracks') : u.kind === 'ancient' ? (ru ? 'Древний' : 'Ancient') : u.kind === 'courier' ? this.S.courier : u.kind === 'mine' ? { land: 'Land Mine', stasis: 'Stasis Trap', remote: 'Remote Mine' }[u.mineType] : u.kind === 'eidolon' ? 'Eidolon' : u.kind === 'ward' ? (u.wardType === 'obs' ? 'Observer Ward' : 'Sentry Ward') : u.kind;
      if (u.illusion && this.player && u.team === this.player.team) name += ru ? ' (иллюзия)' : ' (illusion)';
      const lines = [{ text: name, bold: true, color: u.team === this.team() ? '#90ff90' : u.team === 2 ? '#ffd060' : '#ff8070' }, { text: Math.ceil(u.hp) + ' / ' + Math.ceil(u.maxHp) + (u.maxMp ? '   ' + Math.ceil(u.mp) + ' / ' + Math.ceil(u.maxMp) : ''), size: 10 }];
      if (!u.structure && u.st) lines.push({ text: `${this.S.damage} ${Math.round(u.st.dmgMin)}–${Math.round(u.st.dmgMax)}  ${this.S.armor} ${u.st.armor.toFixed(1)}`, size: 10, color: '#c8b080' });
      if (u.structure && g.isInvuln(u)) lines.push({ text: ru ? 'Неуязвима' : 'Invulnerable', size: 10, color: '#80c0ff' });
      if (u.kind === 'hero' && u.items && u.items.some(Boolean)) lines.push({ icons: u.items.map(it => it ? this.A.icons.item[it.id] : null) });
      R.tooltip(lines, this.mx + 16, this.my + 40, u.kind === 'hero' ? 196 : 190);
    }
    destroy() {
      cancelAnimationFrame(this.raf); this.ac.abort(); if (this.ro) this.ro.disconnect(); this.audio.destroy();
      this.g = null;
    }
  }
  function G_build() { D.GFX.buildModels(); }
  D.UI = UI;
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Dota98 = globalThis.Dota98 || {});
