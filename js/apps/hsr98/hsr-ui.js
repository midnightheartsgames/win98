(function (H) {
  'use strict';
  const G = H.Gfx, T = H.TUNING;
  const W = 640, HGT = 480, TS = 32;
  const FONT = '"MS Sans Serif", Tahoma, Arial, sans-serif';
  const SCROLL_W = 10;
  const SERIF = 'Georgia, "Times New Roman", serif';
  const C = {
    night: '#060818', ink: '#111842', ink2: '#070a22', brass: '#c9a45c', brassHi: '#f2dc9a', brassDk: '#6a5328',
    cream: '#f1ead8', sub: '#9aa6d0', gold: '#f2dc9a', dim: '#646a8c', ok: '#86e39a', bad: '#ff8a8a', cyan: '#80e0ff', pink: '#ffb0e0'
  };
  const SAVE_KEY = 'hsr98.save.', OPT_KEY = 'hsr98.options';
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const SAVE_SLOTS = [1, 2, 3, 'auto'];
  const SAVE_DIR = ['My Computer', 'C:', 'Games', 'StarRail98'];
  const saveFileName = slot => (slot === 'auto' ? 'AUTOSAVE.SAV' : 'SAVE' + slot + '.SAV');
  const mirrorSave = (slot, data, onlyMissing) => {
    const vfs = typeof window !== 'undefined' ? window.vfs : null;
    if (!vfs || !vfs.resolvePath || !data) return false;
    const dir = vfs.resolvePath(SAVE_DIR);
    if (!dir || !dir.children) return false;
    if (onlyMissing && dir.children[saveFileName(slot)]) return false;
    return vfs.writeFile(SAVE_DIR, saveFileName(slot), { type: 'file', icon: 'file-txt', content: JSON.stringify(data) });
  };
  const mirrorAllSaves = () => SAVE_SLOTS.forEach(slot => mirrorSave(slot, lsGet(SAVE_KEY + slot, null), true));
  const SAVE_FILE_FORMAT = 'StarRail98-saves';
  const slotTitle = s => (s === 'auto' ? 'авто' : 'блок ' + s);
  const slotTitles = list => list.map(slotTitle).join(', ');
  const storedSlots = () => SAVE_SLOTS.filter(s => lsGet(SAVE_KEY + s, null));
  const isSaveData = d => !!(d && typeof d === 'object' && d.state && typeof d.state === 'object' && d.summary && typeof d.summary === 'object' && typeof d.summary.where === 'string');
  const readSaveFile = text => {
    let raw;
    try { raw = JSON.parse(text); } catch (e) { return null; }
    if (!raw || typeof raw !== 'object') return null;
    const found = {};
    SAVE_SLOTS.forEach(s => {
      let d = raw.slots ? raw.slots[s] : raw[SAVE_KEY + s];
      if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
      if (isSaveData(d)) found[s] = d;
    });
    return Object.keys(found).length ? found : null;
  };
  const RES = [
    { id: '640', tag: '640', w: 640 },
    { id: '800', tag: '800', w: 800 },
    { id: '1024', tag: '1024', w: 1024 },
    { id: '1280', tag: '1280', w: 1280 },
    { id: 'window', tag: 'Окно', w: 0 }
  ];
  const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Enter: 'ok', Space: 'ok', NumpadEnter: 'ok', Escape: 'back', Backspace: 'back' };
  const GLOW_NAME = { starlight: ['Неугасаемый звёздный свет', 'звёздного света'], embers: ['Неугасаемый пепел', 'пепла'] };
  const HUD_CARD = { h: 46, step: 50, barW: 35, fill: 0.9, energy: '#f2b632', energyText: '#ffe0a0' };

  class UI {
    constructor(root, opts = {}) {
      this.root = root; this.opts = opts;
      root.classList.add('hsr98'); root.tabIndex = 0;
      this.canvas = document.createElement('canvas');
      this.canvas.width = W; this.canvas.height = HGT;
      this.canvas.className = 'hsr98-canvas';
      root.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      this.options = Object.assign({ sfx: 0.6, music: 0.35, battleSpeed: 1, textSpeed: 2, res: '640', ultCine: 'on', fusionCine: 'on', skinCine: 'first' }, lsGet(OPT_KEY, {}));
      mirrorAllSaves();
      this.applyRes();
      this.audio = new H.Audio();
      this.audio.setVolumes(this.options.sfx, this.options.music);
      this.game = null;
      this.mode = 'title';
      this.screens = [];
      this.held = [];
      this.walk = false;
      this.toasts = [];
      this.hits = [];
      this.t = 0;
      this.wheels = [];
      this.drag = null;
      this.dlg = null;
      this.particles = [];
      this.titleSel = 0;
      this.banner = null;
      this.listeners = [];
      this.bind();
      this.running = true;
      this.last = performance.now();
      this.frame = this.frame.bind(this);
      requestAnimationFrame(this.frame);
      this.audio.music('menu');
    }

    destroy() {
      this.running = false;
      if (this.game && this.mode !== 'title') this.writeSave('auto');
      for (const [o, t, f] of this.listeners) o.removeEventListener(t, f);
      this.audio.destroy();
      this.root.innerHTML = '';
    }

    active() { return !this.opts.isActive || this.opts.isActive(); }

    resPreset() { return RES.find(r => r.id === this.options.res) || RES[0]; }

    resScale() {
      const p = this.resPreset();
      if (p.w) return p.w / W;
      const r = this.canvas.getBoundingClientRect(), dpr = globalThis.devicePixelRatio || 1;
      if (!r.width || !r.height) return this.canvas.width / W;
      return Math.max(0.5, Math.min(4, Math.min(r.width / W, r.height / HGT) * dpr));
    }

    applyRes() {
      const k = this.resScale(), w = Math.round(W * k), h = Math.round(HGT * k);
      if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    }

    bind() {
      const on = (o, t, f, op) => { o.addEventListener(t, f, op); this.listeners.push([o, t, f]); };
      on(this.root, 'keydown', e => this.keydown(e));
      on(this.root, 'keyup', e => { this.held = this.held.filter(k => k !== e.code); if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.walk = false; });
      on(this.root, 'blur', () => { this.held = []; this.walk = false; });
      on(this.canvas, 'mousedown', e => this.click(e));
      on(this.canvas, 'wheel', e => this.wheel(e), { passive: false });
      const doc = typeof document !== 'undefined' && document.addEventListener ? document : this.root;
      on(doc, 'mousemove', e => { this.mouse = Object.assign(this.pointer(e), { t: this.t }); if (this.drag) this.drag.move(this.mouse); });
      on(doc, 'mouseup', e => { const d = this.drag; this.drag = null; if (d && d.drop) d.drop(this.pointer(e)); });
      on(this.root, 'mousedown', () => { this.audio.init(); this.audio.resume(); this.root.focus({ preventScroll: true }); });
      on(this.canvas, 'contextmenu', e => e.preventDefault());
    }

    sfx(id) { this.audio.sfx(id); }

    frame(now) {
      if (!this.running) return;
      const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
      this.last = now;
      this.t += dt;
      try { this.applyRes(); this.update(dt); this.render(); } catch (err) { console.error(err); }
      requestAnimationFrame(this.frame);
    }

    keydown(e) {
      if (!this.active()) return;
      this.audio.init(); this.audio.resume();
      const code = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'Backspace', 'F7', 'F8'].includes(code)) e.preventDefault();
      if (code === 'F7') { if (!e.repeat) this.debugJade(); return; }
      if (code === 'F8') { if (!e.repeat) this.toggleDebug(); return; }
      if (code === 'ShiftLeft' || code === 'ShiftRight') this.walk = true;
      const k = KEYMAP[code] || null;
      if (!this.held.includes(code)) this.held.push(code);
      if (e.repeat && !['up', 'down', 'left', 'right'].includes(k)) return;
      this.handleKey(k, code, e);
    }

    pointer(e) {
      const r = this.canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * HGT / r.height };
    }

    click(e) {
      const p = this.pointer(e), { x, y } = p;
      this.audio.init(); this.audio.resume();
      for (let i = this.hits.length - 1; i >= 0; i--) {
        const h = this.hits[i];
        if (x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h) { h.fn(e.button, p); return; }
      }
      if (this.dlg || (this.game && this.game.pending && ['say', 'tut'].includes(this.game.pending.type))) this.handleKey('ok', 'Enter', e);
    }

    hit(x, y, w, h, fn) { this.hits.push({ x, y, w, h, fn }); }

    wheelZone(x, y, w, h, fn) { this.wheels.push({ x, y, w, h, fn }); }

    wheel(e) {
      const { x, y } = this.pointer(e);
      for (let i = this.wheels.length - 1; i >= 0; i--) {
        const h = this.wheels[i];
        if (x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h) { if (e.preventDefault) e.preventDefault(); h.fn(Math.sign(e.deltaY)); return; }
      }
    }

    handleKey(k, code, e) {
      if (this.screens.length) { const s = this.screens[this.screens.length - 1]; if (s.key) s.key(k, code, e); return; }
      if (this.mode === 'title') return this.titleKey(k, code);
      if (this.mode === 'battle') return this.battleKey(k, code);
      if (this.mode === 'field') return this.fieldKey(k, code);
      if (this.mode === 'credits' && (k === 'ok' || k === 'back')) this.endCredits();
    }

    push(s) { s.sel = s.sel || 0; this.screens.push(s); this.sfx('confirm'); return s; }
    pop() { const s = this.screens.pop(); if (s && s.onClose) s.onClose(); this.sfx('cancel'); return s; }
    top() { return this.screens[this.screens.length - 1]; }

    listNav(s, k, n) {
      if (!n) return false;
      if (k === 'up') { s.sel = (s.sel - 1 + n) % n; this.sfx('select'); return true; }
      if (k === 'down') { s.sel = (s.sel + 1) % n; this.sfx('select'); return true; }
      return false;
    }

    newGame() {
      this.game = new H.Game({ fresh: true });
      this.enterField();
    }

    loadGame(slot) {
      const d = lsGet(SAVE_KEY + slot, null);
      if (!d) return false;
      this.game = new H.Game({ state: d.state });
      this.screens = [];
      this.enterField();
      this.toast('Загружено: ' + (slot === 'auto' ? 'автосохранение' : 'блок ' + slot));
      return true;
    }

    writeSave(slot) {
      if (!this.game || this.game.battle) return false;
      const data = { date: new Date().toLocaleString('ru-RU'), summary: this.game.summary(), state: this.game.serialize() };
      if (!lsSet(SAVE_KEY + slot, data)) return false;
      mirrorSave(slot, data, false);
      return true;
    }

    exportSaves() {
      const list = storedSlots();
      if (!list.length) { this.sfx('deny'); return; }
      const slots = {};
      list.forEach(s => { slots[s] = lsGet(SAVE_KEY + s, null); });
      const now = new Date();
      const text = JSON.stringify({ format: SAVE_FILE_FORMAT, version: 1, exported: now.toISOString(), slots });
      this.exportName = 'StarRail98_saves_' + now.toISOString().slice(0, 10) + '.json';
      const android = window.Sr98Android;
      if (android && android.saveFile) { android.saveFile(this.exportName, text); return; }
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = this.exportName;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      this.fileSaved(true);
    }

    fileSaved(ok) {
      this.sfx(ok ? 'anchor' : 'deny');
      this.toast(ok ? 'Сохранения выгружены в файл ' + this.exportName : 'Файл не записан');
    }

    importSaves() {
      const android = window.Sr98Android;
      if (android && android.openFile) { android.openFile(); return; }
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.json,application/json';
      input.onchange = () => {
        const f = input.files && input.files[0];
        if (f) f.text().then(t => this.fileOpened(t), () => this.fileOpened(''));
      };
      input.click();
    }

    fileOpened(text) {
      const slots = readSaveFile(text);
      if (!slots) { this.sfx('deny'); this.toast('В файле нет сохранений игры'); return; }
      const list = SAVE_SLOTS.filter(s => slots[s]), busy = list.filter(s => lsGet(SAVE_KEY + s, null));
      if (busy.length) this.confirmImport(slots, list, busy);
      else this.applyImport(slots, list);
    }

    applyImport(slots, list) {
      if (!list.every(s => lsSet(SAVE_KEY + s, slots[s]))) { this.sfx('deny'); this.toast('Не хватает места для сохранений'); return; }
      list.forEach(s => mirrorSave(s, slots[s], false));
      this.sfx('anchor');
      this.toast('Загружено из файла: ' + slotTitles(list));
    }

    enterField() {
      this.mode = 'field';
      this.audio.music(this.game.mapMusic(this.game.map.def));
      this.banner = { text: this.game.map.def.name, t: 2.6 };
    }

    toast(text) { this.toasts.push({ text, t: 3.4 }); if (this.toasts.length > 4) this.toasts.shift(); }

    debugJade() {
      if (!this.game || this.mode === 'title') { this.sfx('deny'); return false; }
      this.game.grantDebugJade();
      this.drainGameEvents();
      if (this.mode === 'battle' && this.bt && this.toasts.length) { this.bt.msg = this.toasts[this.toasts.length - 1].text; this.bt.msgT = 1.8; this.bt.msgWarn = false; }
      this.sfx('star4');
      return true;
    }

    update(dt) {
      const debugAt = this.screens.findIndex(s => s.debug || s.pause);
      this.screens.forEach((s, i) => { if (s.tick && i >= debugAt) s.tick(dt); });
      if (this.mode === 'credits') this.creditsT = (this.creditsT || 0) + dt;
      if (this.mode !== 'battle') for (const tt of this.toasts) tt.t -= dt;
      this.toasts = this.toasts.filter(x => x.t > 0);
      if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
      for (const p of this.particles) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; }
      this.particles = this.particles.filter(p => p.t > 0);
      const g = this.game;
      if (!g || this.mode === 'title') return;
      if (this.mode === 'battle') { if (debugAt < 0) this.updateBattle(dt); this.drainGameEvents(); return; }
      if (this.mode === 'credits') return;
      const dir = this.heldDir();
      const blocked = this.screens.length > 0 || this.dlg;
      g.update(dt, blocked ? {} : { dir, walk: this.walk });
      this.drainGameEvents();
      this.syncPending(dt);
      if (this.mode === 'field' && g.map) this.updateMinimap(dt);
      if (this.mode === 'field') this.updateChat(dt);
      if (this.mode === 'field' && this.passTick) this.passTick(dt);
      if (this.mode === 'field' && !this.screens.length && !this.dlg && !this.toasts.length && !g.busy() && !g.cg && g.ascNoteDue && g.ascNoteDue() && this.openAscNotice) this.openAscNotice();
      if (this.mode === 'field' && !this.screens.length && !this.dlg && !this.toasts.length && !g.busy() && !g.cg && g.eventsOpen() && !g.state.flags.events_note) this.openEventsNotice();
      else if (this.mode === 'field' && !this.screens.length && !this.dlg && !this.toasts.length && !g.busy() && !g.cg && g.eventsOpen() && this.newEventNotice) this.newEventNotice();
    }

    heldDir() {
      for (let i = this.held.length - 1; i >= 0; i--) { const k = KEYMAP[this.held[i]]; if (k === 'up' || k === 'down' || k === 'left' || k === 'right') return k; }
      return null;
    }

    drainGameEvents() {
      const g = this.game;
      while (g.events.length) {
        const e = g.events.shift();
        switch (e.t) {
          case 'toast': this.toast(e.text); break;
          case 'sfx': this.sfx(e.id === 'break' ? 'break_obj' : e.id); break;
          case 'map': if (this.mode === 'field') { this.audio.music(e.music); this.banner = { text: e.name, t: 2.6 }; } break;
          case 'music': this.audio.music(e.id); break;
          case 'obj': this.toast('Новое задание: ' + e.text); break;
          case 'quest': { const ty = H.MISSION_TYPES[e.type || 'comp']; this.toast(e.step === 'done' ? ty.one + ' выполнена: «' + e.name + '»' : ty.one + ' «' + e.name + '»: ' + e.text); this.sfx(e.step === 'done' ? 'star4' : 'confirm'); break; }
          case 'mission': this.toast('Миссия Освоения выполнена: «' + e.name + '»' + (e.got.length ? '. Получено: ' + e.got.join(', ') : '')); this.sfx('star4'); break;
          case 'join': this.sfx('levelup'); break;
          case 'tl': this.toast('Уровень Освоения ' + e.lvl + (this.game.tlRewardsOpen && this.game.tlRewardsOpen() ? '. Пом-Пом приготовил награду' : '')); break;
          case 'autosave': this.writeSave('auto'); break;
          case 'burst': for (let i = 0; i < 14; i++) this.particles.push({ field: true, x: e.x * TS + 16, y: e.y * TS + 16, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 120, g: 300, t: 0.6, col: '#c8a060' }); break;
          case 'battle': this.startBattleUI(e); break;
          case 'chat': this.chatEvent(e); break;
        }
      }
    }

    syncPending(dt) {
      const g = this.game, p = g.pending;
      if (!p) { this.dlg = null; return; }
      if (p.type === 'say') {
        if (!this.dlg || this.dlg.src !== p) {
          const sp = H.SPEAKERS[p.spk] || { name: p.spk };
          const name = p.name != null ? p.name : p.spk === '@' || p.spk === 'trail' ? g.state.name : sp.name;
          this.dlg = { src: p, spk: p.spk, name, text: p.text, shown: 0, age: 0 };
        }
        this.dlg.age += dt;
        const before = Math.floor(this.dlg.shown);
        this.dlg.shown = Math.min(this.dlg.text.length, this.dlg.shown + dt * 30 * this.options.textSpeed);
        if (Math.floor(this.dlg.shown) > before && Math.floor(this.dlg.shown) % 3 === 0) this.sfx('text');
        return;
      }
      this.dlg = null;
      if (p.type === 'choice' && !this.top()) this.openChoice(p);
      if (p.type === 'tut' && !this.top()) this.openTut(p);
      if (p.type === 'ui' && !this.top()) this.openUi(p);
      if (p.type === 'credits' && p.id && this.openClipCredits) { if (!this.top()) this.openClipCredits(p.id, true); }
      else if (p.type === 'credits' && this.mode !== 'credits') this.openCredits();
      if (p.type === 'cine' && !this.top()) this.openCine(p);
    }

    openCine(p) {
      if (!H.Cine || !H.Cine.CINES[p.id]) { this.finishPending(); return; }
      const ui = this, show = new H.Cine.Player(this, p.id);
      const end = () => { if (show.done && ui.top() === s) { ui.screens.pop(); ui.finishPending(); } };
      const s = this.push({
        full: true, show,
        tick(dt) { show.tick(dt); end(); },
        draw(c) { show.draw(c); },
        key(k) { show.key(k); end(); }
      });
    }

    finishPending(val) { this.game.resume(val); }

    fieldKey(k, code) {
      const g = this.game;
      if (g.pending && g.pending.type === 'say') {
        if (code === 'Tab') { this.openSkip(); return; }
        if (k === 'ok' || k === 'back') {
          if (this.dlg && this.dlg.shown < this.dlg.text.length) this.dlg.shown = this.dlg.text.length;
          else { this.dlg = null; g.resume(); }
        }
        return;
      }
      if (g.busy()) return;
      if (k === 'ok') { g.interact({ shift: this.walk }); return; }
      if (k === 'back' || code === 'Tab') { this.openMenu(); return; }
      if (code === 'KeyM') { if (g.state.su) this.openSuRun(); else this.openNav(null); return; }
      if (code === 'KeyF') { g.attack(); return; }
      if (code === 'KeyE') { g.technique(); return; }
      if (/^Digit[1-4]$/.test(code)) { g.setLeader(+code.slice(5) - 1); return; }
    }

    titleKey(k) {
      const items = this.titleItems();
      if (k === 'up' || k === 'down') {
        const n = items.length;
        this.titleSel = (this.titleSel + (k === 'up' ? n - 1 : 1)) % n;
        this.sfx('select');
        return;
      }
      if (k === 'ok') items[this.titleSel].fn();
    }

    titleItems() {
      const has = [1, 2, 3, 'auto'].some(s => lsGet(SAVE_KEY + s, null));
      const items = [
        { label: 'Новая игра', icon: 'warp', note: 'Диск 1 · Станция «Герта»', fn: () => { this.sfx('confirm'); this.newGame(); } },
        { label: 'Продолжить', icon: 'nav', disabled: !has, note: has ? this.slotNote(this.latestSlot()) : 'Нет сохранений', fn: () => { if (!has) return this.sfx('deny'); this.loadGame(this.latestSlot()); } },
        { label: 'Загрузить', icon: 'load', disabled: !has, note: 'Карта памяти', fn: () => { if (!has) return this.sfx('deny'); this.openSaves('load'); } },
        { label: 'Перенос', icon: 'transfer', note: 'Сохранения в файл и из файла', fn: () => this.openTransfer() },
        { label: 'Настройки', icon: 'settings', note: 'Звук, скорость, разрешение', fn: () => this.openSettings() }
      ];
      if (this.opts.onExit) items.push({ label: 'Выход', icon: 'exit', note: 'Вернуться в Win', fn: () => this.opts.onExit() });
      return items;
    }

    slotNote(slot) {
      const d = lsGet(SAVE_KEY + slot, null);
      return d ? d.summary.name + ' · ур. ' + d.summary.lvl + ' · ' + d.summary.where.split(': ').pop() : '';
    }

    latestSlot() {
      let best = 'auto', bt = -1;
      for (const s of [1, 2, 3, 'auto']) {
        const d = lsGet(SAVE_KEY + s, null);
        if (!d) continue;
        const tm = d.state && d.state.time || 0;
        if (tm > bt) { bt = tm; best = s; }
      }
      return best;
    }

    render() {
      const c = this.ctx;
      this.hits = [];
      this.wheels = [];
      c.save();
      c.setTransform(this.canvas.width / W, 0, 0, this.canvas.height / HGT, 0, 0);
      c.imageSmoothingEnabled = false;
      const full = this.screens.map(s => !!s.full).lastIndexOf(true);
      if (full < 0) {
        if (this.mode === 'title') this.drawTitle(c);
        else if (this.mode === 'field') this.drawField(c);
        else if (this.mode === 'battle') this.drawBattle(c);
        else if (this.mode === 'credits') this.drawCredits(c);
        if (this.game && this.game.cg && this.mode === 'field') G.drawCG(c, this.game.cg, W, HGT, this.t, this.game);
        if (this.dlg && this.mode !== 'battle') this.drawDialog(c);
      }
      this.screens.forEach((s, i) => {
        if (i < full) return;
        if (i > Math.max(0, full) && !s.full) { c.fillStyle = 'rgba(2,3,12,0.55)'; c.fillRect(0, 0, W, HGT); }
        if (s === this.top()) { this.hits = []; this.wheels = []; }
        s.draw(c, s === this.top());
      });
      if (this.game && this.game.skipping && this.mode === 'field') this.drawSkipping(c);
      if (this.mode === 'field') this.drawChatNotice(c);
      if (this.mode !== 'battle') this.drawToasts(c);
      c.restore();
    }

    font(size, bold, serif) { this.ctx.font = (bold ? 'bold ' : '') + size + 'px ' + (serif ? SERIF : FONT); }

    text(str, x, y, o = {}) {
      const c = this.ctx;
      this.font(o.size || 12, o.bold, o.serif);
      c.textAlign = o.align || 'left';
      c.textBaseline = 'top';
      if (o.shadow !== false) { c.fillStyle = 'rgba(0,0,0,0.85)'; c.fillText(str, x + 1, y + 1); }
      c.fillStyle = o.col || C.cream;
      c.fillText(str, x, y);
    }

    measure(str, size, bold, serif) { this.font(size || 12, bold, serif); return this.ctx.measureText(str).width; }

    clip(str, maxW, size, bold, serif) {
      let s = String(str);
      if (this.measure(s, size, bold, serif) <= maxW) return s;
      while (s.length > 1 && this.measure(s + '…', size, bold, serif) > maxW) s = s.slice(0, -1);
      return s.trimEnd() + '…';
    }

    wrap(str, maxW, size, bold, serif) {
      this.font(size || 12, bold, serif);
      const words = String(str).split(' '), lines = [];
      let cur = '';
      for (const w of words) {
        const t = cur ? cur + ' ' + w : w;
        if (this.ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
      }
      if (cur) lines.push(cur);
      return lines;
    }

    richWrap(segs, maxW, size) {
      this.font(size || 12);
      const words = [[]];
      for (const s of segs) String(s.t).split(' ').forEach((part, i) => { if (i) words.push([]); if (part) words[words.length - 1].push({ t: part, hot: !!s.hot }); });
      const lines = [];
      let cur = [], curW = '';
      for (const w of words.filter(x => x.length)) {
        const t = w.map(p => p.t).join(''), next = curW ? curW + ' ' + t : t;
        if (this.ctx.measureText(next).width > maxW && cur.length) { lines.push(cur); cur = [w]; curW = t; } else { cur.push(w); curW = next; }
      }
      if (cur.length) lines.push(cur);
      return lines;
    }

    richText(line, x, y, o = {}) {
      let cx = x;
      line.forEach((w, i) => {
        if (i) cx += this.measure(' ', o.size, o.bold);
        for (const p of w) { this.text(p.t, cx, y, Object.assign({}, o, { col: p.hot ? o.hot || C.gold : o.col })); cx += this.measure(p.t, o.size, o.bold); }
      });
    }

    dither() {
      if (this._dither) return this._dither;
      const cv = G.mkCanvas(4, 4), g = cv.getContext('2d');
      g.fillStyle = 'rgba(255,255,255,0.035)'; g.fillRect(0, 0, 1, 1); g.fillRect(2, 2, 1, 1);
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(2, 0, 1, 1); g.fillRect(0, 2, 1, 1);
      this._dither = this.ctx.createPattern(cv, 'repeat');
      return this._dither;
    }

    diamond(x, y, r, col, line) {
      const c = this.ctx;
      c.fillStyle = col; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); c.fill();
      if (line) { c.strokeStyle = line; c.lineWidth = 1; c.stroke(); }
    }

    win(x, y, w, h, o = {}) {
      const c = this.ctx;
      x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
      c.save();
      c.globalAlpha = o.alpha == null ? 0.95 : o.alpha;
      const gr = c.createLinearGradient(x, y, x, y + h);
      gr.addColorStop(0, o.top || C.ink); gr.addColorStop(1, o.bottom || C.ink2);
      c.fillStyle = gr; c.fillRect(x, y, w, h);
      c.globalAlpha = 1;
      c.fillStyle = this.dither(); c.fillRect(x, y, w, h);
      c.restore();
      const b = o.border || C.brass;
      c.strokeStyle = '#010208'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      c.strokeStyle = b; c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      c.strokeStyle = 'rgba(242,220,154,0.22)'; c.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
      c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(x + 4, y + 4, w - 8, 1);
      if (o.corners !== false) for (const [cx, cy] of [[x + 2, y + 2], [x + w - 2, y + 2], [x + 2, y + h - 2], [x + w - 2, y + h - 2]]) this.diamond(cx, cy, 3, o.corner || C.brassHi, '#1a1208');
      if (o.title) this.plate(x + 12, y - 8, o.title, o);
    }

    plate(x, y, label, o = {}) {
      const c = this.ctx, size = o.plateSize || 12;
      const w = Math.round(this.measure(label, size, true, true) + 26), h = size + 6;
      const gr = c.createLinearGradient(x, y, x, y + h);
      gr.addColorStop(0, '#f6e6a8'); gr.addColorStop(0.5, '#e0c078'); gr.addColorStop(1, '#a8803a');
      c.fillStyle = '#1a1208'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
      c.fillStyle = gr; c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(x, y, w, 1);
      this.diamond(x + 6, y + h / 2, 2.5, '#5a3a14');
      this.diamond(x + w - 6, y + h / 2, 2.5, '#5a3a14');
      this.text(label, x + w / 2, y + 3, { align: 'center', size, bold: true, serif: true, col: '#20140c', shadow: false });
      return w;
    }

    bar(x, y, w, h, f, col, bg) {
      const c = this.ctx;
      x = Math.round(x); y = Math.round(y);
      c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
      c.fillStyle = bg || '#141626'; c.fillRect(x, y, w, h);
      const fw = Math.round(Math.max(0, Math.min(1, f)) * w);
      c.fillStyle = col; c.fillRect(x, y, fw, h);
      if (fw > 0 && h > 2) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x, y, fw, 1); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x, y + h - 1, fw, 1); }
    }

    rail(x, y, w, f, col) {
      const c = this.ctx;
      x = Math.round(x); y = Math.round(y);
      c.fillStyle = '#05060e'; c.fillRect(x, y - 2, w, 5);
      for (let i = 2; i < w; i += 6) { c.fillStyle = '#3a3020'; c.fillRect(x + i, y - 3, 2, 7); }
      c.fillStyle = '#6a5a3a'; c.fillRect(x, y - 2, w, 1); c.fillRect(x, y + 2, w, 1);
      const fw = Math.round(Math.max(0, Math.min(1, f)) * w);
      c.fillStyle = col || C.brassHi; c.fillRect(x, y - 1, fw, 3);
      this.diamond(x + fw, y + 0.5, 4, col || C.brassHi, '#1a1208');
    }

    cursor(x, y) {
      const c = this.ctx, bx = Math.round(x + Math.sin(this.t * 7) * 1.5);
      c.fillStyle = '#1a1208'; c.beginPath(); c.moveTo(bx - 1, y - 6); c.lineTo(bx + 7, y); c.lineTo(bx - 1, y + 6); c.fill();
      c.fillStyle = C.brassHi; c.beginPath(); c.moveTo(bx, y - 4); c.lineTo(bx + 5, y); c.lineTo(bx, y + 4); c.fill();
    }

    keycap(x, y, label) {
      const c = this.ctx, w = Math.max(14, Math.round(this.measure(label, 9, true) + 8));
      c.fillStyle = '#000'; c.fillRect(x, y, w, 13);
      c.fillStyle = '#c8c4b8'; c.fillRect(x, y, w - 1, 12);
      c.fillStyle = '#f4f0e6'; c.fillRect(x, y, w - 1, 1); c.fillRect(x, y, 1, 12);
      c.fillStyle = '#7a766a'; c.fillRect(x + 1, y + 11, w - 2, 1); c.fillRect(x + w - 2, y + 1, 1, 11);
      this.text(label, x + w / 2 - 0.5, y + 1, { align: 'center', size: 9, bold: true, col: '#1a1814', shadow: false });
      return w;
    }

    hints(list, x, y, o = {}) {
      let cx = x;
      if (o.align === 'center' || o.align === 'right') {
        let total = 0;
        for (const [k, l] of list) total += Math.max(14, this.measure(k, 9, true) + 8) + 4 + this.measure(l, 10) + 12;
        cx = o.align === 'center' ? x - total / 2 : x - total;
      }
      for (const [k, l] of list) {
        cx += this.keycap(cx, y, k) + 4;
        this.text(l, cx, y + 1, { size: 10, col: o.col || C.sub });
        cx += this.measure(l, 10) + 12;
      }
      return cx;
    }

    badge(x, y) {
      const c = this.ctx;
      x = Math.round(x); y = Math.round(y);
      c.fillStyle = '#1a0608'; c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#d82828'; c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ff9a8a'; c.fillRect(x - 4, y - 3, 1, 3);
      c.fillStyle = '#ffffff'; c.fillRect(x - 1, y - 4, 2, 5); c.fillRect(x - 1, y + 2, 2, 2);
    }

    button(x, y, w, h, label, fn, o = {}) {
      const c = this.ctx;
      x = Math.round(x); y = Math.round(y);
      const gr = c.createLinearGradient(x, y, x, y + h);
      if (o.active) { gr.addColorStop(0, '#f2dc9a'); gr.addColorStop(1, '#b08a44'); }
      else if (o.disabled) { gr.addColorStop(0, '#22243a'); gr.addColorStop(1, '#16182a'); }
      else { gr.addColorStop(0, '#2a3478'); gr.addColorStop(1, '#141a48'); }
      c.fillStyle = '#000'; c.fillRect(x, y, w, h);
      c.fillStyle = gr; c.fillRect(x + 1, y + 1, w - 2, h - 2);
      c.fillStyle = o.active ? 'rgba(255,255,255,0.6)' : 'rgba(170,190,255,0.35)'; c.fillRect(x + 1, y + 1, w - 2, 1); c.fillRect(x + 1, y + 1, 1, h - 2);
      c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(x + 1, y + h - 2, w - 2, 1); c.fillRect(x + w - 2, y + 1, 1, h - 2);
      let tx = x + w / 2;
      if (o.icon) { G.menuIcon(c, o.icon, x + 5, y + (h - 16) / 2, 16, o.active ? '#2a1a0c' : o.disabled ? '#5a5a6a' : C.brassHi); tx += 8; }
      this.text(label, tx, y + (h - (o.size || 12)) / 2 - 1, { align: 'center', size: o.size || 12, bold: !!o.bold, col: o.active ? '#1c1208' : o.disabled ? '#5c6078' : C.cream, shadow: !o.active });
      if (fn) this.hit(x, y, w, h, fn);
    }

    list(x, y, w, items, sel, o = {}) {
      const c = this.ctx, rh = o.rowH || 20, max = o.max || 12, sc = o.scroll, bar = sc && items.length > max;
      const start = sc ? this.listTop(sc, sel, items.length, max) : Math.max(0, Math.min(sel - Math.floor(max / 2), items.length - max));
      if (bar) { this.scrollBar(x + w - SCROLL_W, y, max * rh - 2, sc, items.length, max); w -= SCROLL_W + 4; }
      if (sc) this.wheelZone(x, y, w, max * rh, d => { sc.top += d * 3; });
      for (let i = start; i < Math.min(items.length, start + max); i++) {
        const it = items[i], yy = y + (i - start) * rh;
        const on = i === sel && o.focus !== false;
        if (on) {
          const gr = c.createLinearGradient(x, 0, x + w, 0);
          gr.addColorStop(0, 'rgba(242,220,154,0.32)'); gr.addColorStop(1, 'rgba(242,220,154,0.03)');
          c.fillStyle = gr; c.fillRect(x, yy, w, rh - 2);
          c.fillStyle = C.brassHi; c.fillRect(x, yy, 2, rh - 2);
          this.cursor(x + 4, yy + (rh - 2) / 2);
        } else if (i === sel) { c.fillStyle = 'rgba(242,220,154,0.1)'; c.fillRect(x, yy, w, rh - 2); }
        let tx = x + 16;
        if (it.icon) { it.icon(c, tx, yy + (rh - 2) / 2); tx += it.iconW || 20; }
        const room = (it.right ? x + w - 14 - this.measure(it.right, 11) : x + w - 4) - tx;
        this.text(this.clip(it.label, room, o.size || 12, on), tx, yy + (rh - 14) / 2, { col: it.disabled ? C.dim : it.col || C.cream, bold: on, size: o.size || 12 });
        if (it.right) this.text(it.right, x + w - 6, yy + (rh - 14) / 2 + 1, { align: 'right', size: 11, col: it.rcol || C.sub });
        if (o.onClick) this.hit(x, yy, w, rh, () => o.onClick(i));
      }
      if (items.length > max && !bar) {
        if (start > 0) this.diamond(x + w - 5, y - 4, 3, C.brassHi);
        if (start + max < items.length) this.diamond(x + w - 5, y + max * rh + 1, 3, C.brassHi);
      }
    }

    listTop(sc, sel, n, max) {
      if (sc.sel !== sel) {
        if (sc.sel == null) sc.top = sel - Math.floor(max / 2);
        else if (sel < sc.top) sc.top = sel;
        else if (sel >= sc.top + max) sc.top = sel - max + 1;
        sc.sel = sel;
      }
      sc.top = Math.max(0, Math.min(Math.round(sc.top), n - max));
      return sc.top;
    }

    scrollBar(x, y, h, sc, n, max) {
      const c = this.ctx, aw = SCROLL_W, track = h - aw * 2, range = n - max;
      const th = Math.max(16, Math.round(track * max / n)), ty = y + aw + Math.round((track - th) * sc.top / range);
      const arrow = (ay, dir) => {
        c.fillStyle = '#05060e'; c.fillRect(x, ay, aw, aw);
        c.fillStyle = '#3a3020'; c.fillRect(x, ay, aw, 1); c.fillRect(x, ay + aw - 1, aw, 1);
        const can = dir < 0 ? sc.top > 0 : sc.top < range, cx = x + aw / 2, cy = ay + aw / 2;
        c.fillStyle = can ? C.brassHi : C.dim;
        c.beginPath(); c.moveTo(cx - 3.5, cy - dir * 2); c.lineTo(cx + 3.5, cy - dir * 2); c.lineTo(cx, cy + dir * 2.5); c.fill();
        this.hit(x, ay, aw, aw, () => { sc.top += dir; this.sfx('select'); });
      };
      arrow(y, -1);
      arrow(y + h - aw, 1);
      c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x, y + aw, aw, track);
      c.fillStyle = '#3a3020'; c.fillRect(x, y + aw, 1, track); c.fillRect(x + aw - 1, y + aw, 1, track);
      const on = this.drag && this.drag.sc === sc;
      c.fillStyle = on ? C.brassHi : C.brass; c.fillRect(x + 1, ty, aw - 2, th);
      c.fillStyle = on ? '#fff4d0' : C.brassHi; c.fillRect(x + 1, ty, aw - 2, 1);
      c.fillStyle = C.brassDk; c.fillRect(x + 1, ty + th - 1, aw - 2, 1);
      for (let i = -1; i <= 1; i++) c.fillRect(x + 3, ty + Math.floor(th / 2) + i * 3, aw - 6, 1);
      this.hit(x, y + aw, aw, track, (b, p) => {
        if (!p || p.y < ty || p.y >= ty + th) { sc.top += (p && p.y < ty ? -1 : 1) * max; this.sfx('select'); return; }
        const grab = p.y - ty;
        this.drag = { sc, move: q => { sc.top = (q.y - grab - y - aw) / Math.max(1, track - th) * range; } };
      });
    }

    money(x, y, kind, value, o = {}) {
      G.itemIcon(this.ctx, kind, x, y - 2, o.size || 16);
      this.text(typeof value === 'number' ? H.fmt(value) : value, x + (o.size || 16) + 3, y, { size: 11, bold: true, col: o.col || C.cream });
      return (o.size || 16) + 6 + this.measure(typeof value === 'number' ? H.fmt(value) : value, 11, true);
    }

    glowOf(r) {
      if (r.glow) return r.glow;
      const n = r.kind === 'char' ? H.charGlow(r.res, r.rar) : 0;
      return n ? { cur: 'starlight', n } : null;
    }

    resultTag(x, y, r, fresh) {
      const lines = r.kind === 'char'
        ? (r.res === 'new' ? fresh : r.res === 'eid' ? [['Дубликат', C.sub], ['Эйдолон +1', C.gold]] : r.res === 'max' ? [['Дубликат', C.sub], ['Все эйдолоны открыты', C.gold]] : [['Дубликат', C.sub], ['+3 000 кредитов', C.gold]])
        : r.sup > 1 ? [['Дубликат', C.sub], ['Наложение S' + r.sup, C.gold]] : [['Световой конус', C.sub], ['добавлен в инвентарь', C.cream]];
      const gl = this.glowOf(r);
      this.win(x, y, 182, gl ? 68 : 50, { alpha: 0.9 });
      lines.forEach(([s, col], i) => this.text(s, x + 14, y + 10 + i * 16, { size: i ? 11 : 12, bold: !i, col }));
      if (gl) this.money(x + 14, y + 44, gl.cur, '+' + gl.n + ' ' + GLOW_NAME[gl.cur][1], { col: C.cyan });
    }

    portraitCard(c, look, x, y, size, o = {}) {
      const gr = c.createLinearGradient(x, y, x, y + size);
      gr.addColorStop(0, o.bgTop || '#2a3068'); gr.addColorStop(1, o.bgBottom || '#0c0f2a');
      c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, size + 2, size + 2);
      c.fillStyle = gr; c.fillRect(x, y, size, size);
      if (o.elem) { c.fillStyle = G.dark(H.ELEMENTS[o.elem].col, 0.55); c.fillRect(x, y + size - Math.round(size * 0.35), size, Math.round(size * 0.35)); }
      G.drawPortrait(c, look, x, y, size);
      c.strokeStyle = o.border || C.brass; c.lineWidth = 1; c.strokeRect(x - 0.5, y - 0.5, size + 1, size + 1);
    }

    drawTitle(c) {
      H.TitleScene.draw(c, W, HGT, this.t);
      const lg = c.createRadialGradient(130, 80, 20, 130, 80, 180);
      lg.addColorStop(0, 'rgba(2,3,14,0.55)'); lg.addColorStop(1, 'rgba(2,3,14,0)');
      c.fillStyle = lg; c.fillRect(0, 0, 320, 260);
      const mg = c.createLinearGradient(W - 180, 0, W, 0);
      mg.addColorStop(0, 'rgba(2,3,14,0)'); mg.addColorStop(1, 'rgba(2,3,14,0.55)');
      c.fillStyle = mg; c.fillRect(W - 180, 0, 180, HGT);
      const bg = c.createRadialGradient(0, 0, 10, 0, 0, 210);
      bg.addColorStop(0, 'rgba(2,3,14,0.62)'); bg.addColorStop(1, 'rgba(2,3,14,0)');
      c.save(); c.translate(W / 2 - 40, HGT - 84); c.scale(1, 0.42); c.fillStyle = bg; c.fillRect(-210, -210, 420, 420); c.restore();
      if (H.BRAND.standalone) {
        this.text('STAR RAIL', 36, 44, { size: 40, bold: true, serif: true, col: '#e8d098' });
        this.text('98', 36 + this.measure('STAR RAIL', 40, true, true) + 10, 38, { size: 46, bold: true, serif: true, col: '#ffb040' });
        this.text(H.BRAND.edition, 40, 100, { size: 11, col: '#b8c4ea' });
      } else {
        this.text('HONKAI', 36, 34, { size: 40, bold: true, serif: true, col: '#e8d098' });
        this.text('STAR RAIL', 38, 78, { size: 29, bold: true, serif: true, col: '#ffffff' });
        this.text('98', 210, 72, { size: 34, bold: true, serif: true, col: '#ffb040' });
        this.text('Издание «Ярило-VI» · PC CD-ROM', 40, 114, { size: 11, col: '#b8c4ea' });
      }
      const items = this.titleItems();
      const x0 = W - 132, y0 = 40;
      items.forEach((it, i) => {
        const y = y0 + i * 56, on = i === this.titleSel;
        if (on) { const gr = c.createLinearGradient(x0 - 20, 0, W, 0); gr.addColorStop(0, 'rgba(242,220,154,0)'); gr.addColorStop(1, 'rgba(242,220,154,0.28)'); c.fillStyle = gr; c.fillRect(x0 - 20, y - 4, W - x0 + 20, 50); }
        G.menuIcon(c, it.icon, x0 + 46, y, 28, it.disabled ? '#5a5a70' : on ? '#fff4c8' : '#d8dcf0');
        if (it.badge) this.text(it.badge, x0 + 78, y - 2, { size: 9, bold: true, col: C.gold });
        this.text(it.label, x0 + 60, y + 30, { align: 'center', size: 11, bold: on, col: it.disabled ? C.dim : on ? C.gold : '#e8ecf8' });
        this.hit(x0 - 10, y - 4, W - x0 + 10, 50, () => { this.titleSel = i; it.fn(); });
      });
      const cur = items[this.titleSel] || items[0];
      const blink = 0.65 + 0.35 * Math.sin(this.t * 3);
      c.globalAlpha = blink;
      this.text(cur.label, W / 2 - 40, HGT - 108, { align: 'center', size: 30, bold: true, serif: true, col: '#ffffff' });
      c.globalAlpha = 1;
      const note = cur.note || '';
      const pw = Math.max(200, this.measure(note, 12) + 60), px = W / 2 - 40 - pw / 2, py = HGT - 64;
      c.fillStyle = 'rgba(6,8,24,0.72)'; c.fillRect(px, py, pw, 24);
      c.strokeStyle = 'rgba(242,220,154,0.7)'; c.strokeRect(px + 0.5, py + 0.5, pw - 1, 23);
      this.diamond(px + 16, py + 12, 5, cur.disabled ? '#5a5a70' : C.brassHi, '#1a1208');
      this.text(note, px + pw / 2 + 8, py + 5, { align: 'center', size: 12, col: cur.disabled ? C.dim : cur.noteCol || C.cream });
      this.hit(px, HGT - 112, pw, 72, () => cur.fn());
      this.text(H.BRAND.disc, 10, HGT - 16, { size: 9, col: '#7080a8' });
      this.hints([['↑↓', 'Выбор'], ['Enter', 'Подтвердить']], W - 10, HGT - 18, { align: 'right' });
    }

    camera() {
      const g = this.game, p = g.player, m = g.map;
      const mw = m.w * TS, mh = m.h * TS;
      let cx = p.fx * TS + 16 - W / 2, cy = p.fy * TS + 16 - HGT / 2;
      cx = mw <= W ? (mw - W) / 2 : Math.max(0, Math.min(mw - W, cx));
      cy = mh <= HGT ? (mh - HGT) / 2 : Math.max(0, Math.min(mh - HGT, cy));
      return [Math.round(cx), Math.round(cy)];
    }

    drawWorld(c) {
      const g = this.game, m = g.map, th = m.def.theme;
      const [cx, cy] = this.camera();
      if (m.def.car) m.outside = g.expressWorld().id;
      G.drawMap(c, m, cx, cy, this.t, W, HGT);
      const draws = [], L = G.mapLayer(m);
      for (const s of L.sprites || []) {
        if (s.if && !g.cond(s.if)) continue;
        const sx = s.x * TS - cx, sy = s.y * TS - cy;
        if (sx > W + 32 || sy > HGT + 32 || sx + s.w * TS < -32 || sy + s.h * TS < -32) continue;
        draws.push({ y: s.sort, fn: () => H.Train.drawSprite(c, s, sx, sy, this.t) });
      }
      if (g.tram && m.def.tram && H.Jarilo) {
        const tr = H.Jarilo.tramSprite(), d = m.def.tram, tx = d.x * TS - cx, ty = g.tram.y * TS - cy;
        if (ty > -200 && ty < HGT + 100) draws.push({ y: g.tram.y + d.len - 1, fn: () => H.Train.drawSprite(c, tr, tx, ty) });
      }
      for (const e of m.ents) {
        if (!g.visible(e)) continue;
        const fl = e.kind === 'enemy' || (e.kind === 'npc' && e.fx != null);
        const ex = (fl ? e.fx : e.x) * TS - cx, ey = (fl ? e.fy : e.y) * TS - cy;
        if (ex < -64 || ey < -64 || ex > W + 32 || ey > HGT + 32) continue;
        draws.push({ y: (fl ? e.fy : e.y), fn: () => this.drawEnt(c, e, ex, ey) });
      }
      const p = g.player;
      const lead = g.state.party[0];
      const frame = p.moving ? (Math.floor(p.prog * 2) + (p.step % 2) * 2) % 4 : 0;
      draws.push({ y: p.fy + 0.01, fn: () => {
        const px = p.fx * TS - cx, py = p.fy * TS - cy;
        if (g.state.pendingTechs.length) { c.fillStyle = 'rgba(120,200,255,' + (0.25 + 0.15 * Math.sin(this.t * 6)) + ')'; c.beginPath(); c.ellipse(px + 16, py + 26, 18, 7, 0, 0, Math.PI * 2); c.fill(); }
        if (this.drawCarry) this.drawCarry(c, px, py, p.dir, true);
        G.drawSprite(c, G.lookOf(g.kitOf(lead), g), p.dir, frame, px, py);
        if (this.drawCarry) this.drawCarry(c, px, py, p.dir, false);
        if (g.attackAnim > 0) {
          const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir];
          c.strokeStyle = 'rgba(255,255,255,' + g.attackAnim * 4 + ')'; c.lineWidth = 3; c.beginPath();
          c.arc(px + 16 + dx * 20, py + 16 + dy * 20, 16, 0, Math.PI * 2 * (1 - g.attackAnim * 3)); c.stroke();
        }
      } });
      const pet = this.drawPetField && g.pet;
      if (pet) draws.push({ y: pet.fy + 0.005, fn: () => this.drawPetField(c, pet, pet.fx * TS - cx, pet.fy * TS - cy) });
      draws.sort((a, b) => a.y - b.y);
      for (const d of draws) d.fn();
      if (pet) this.drawPetSay(c, pet, pet.fx * TS - cx, pet.fy * TS - cy);
      for (const pa of this.particles) if (pa.field) { c.fillStyle = pa.col; c.fillRect(pa.x - cx, pa.y - cy, 3, 3); }
      if (L.deco) H.Train.drawFx(c, L, m, cx, cy, this.t, W, HGT, x => g.cond(x));
      const fd = g.findieTarget && g.findieTarget();
      if (fd) {
        const px = g.player.fx * TS - cx + 16, py = g.player.fy * TS - cy - 30, a = Math.atan2(fd.y - g.player.fy, fd.x - g.player.fx), hot = Math.max(0, 1 - fd.dist / 18);
        const beat = 0.5 + 0.5 * Math.sin(this.t * (4 + hot * 18));
        c.save(); c.translate(px, py); c.rotate(a);
        c.fillStyle = 'rgba(255,208,64,' + (0.55 + 0.45 * beat).toFixed(3) + ')';
        c.beginPath(); c.moveTo(14, 0); c.lineTo(2, -6); c.lineTo(2, 6); c.closePath(); c.fill();
        c.restore();
        c.fillStyle = 'rgba(20,16,8,0.82)'; c.fillRect(W / 2 - 80, 8, 160, 16);
        this.text('Находюша: ' + (fd.dist < 2 ? 'цель рядом!' : fd.dist < 7 ? 'горячо' : fd.dist < 14 ? 'тепло' : 'холодно'), W / 2, 10, { align: 'center', size: 10, bold: true, col: '#ffd040' });
        this.findieT = (this.findieT || 0) + 1 / 60;
        if (this.findieT > 1.4 - hot * 1.2) { this.findieT = 0; this.sfx('select'); }
      }
      const bl = g.barkLine && g.barkLine();
      if (bl) {
        const w = Math.min(380, this.measure(bl.text, 10, false) + 12), bx = Math.max(4, Math.min(W - w - 4, bl.x * TS - cx + 16 - w / 2)), by = bl.y * TS - cy - 34;
        c.fillStyle = 'rgba(250,246,236,0.94)'; c.fillRect(bx, by, w, 15);
        c.strokeStyle = 'rgba(60,44,30,0.85)'; c.lineWidth = 1; c.strokeRect(bx + 0.5, by + 0.5, w - 1, 14);
        c.fillStyle = 'rgba(250,246,236,0.94)'; c.beginPath(); c.moveTo(bl.x * TS - cx + 12, by + 15); c.lineTo(bl.x * TS - cx + 20, by + 15); c.lineTo(bl.x * TS - cx + 16, by + 20); c.fill();
        this.text(bl.text, bx + w / 2, by + 2, { align: 'center', size: 10, col: '#3a2a1e' });
      }
      if (th === 'snow' || th === 'hill' || th === 'ice' || th === 'rivet') {
        c.fillStyle = 'rgba(255,255,255,0.85)';
        for (let i = 0; i < 70; i++) { const sx = (G.hash(i, 1, 1) * W + this.t * (20 + G.hash(i, 2, 2) * 30)) % W, sy = (G.hash(1, i, 3) * HGT + this.t * (40 + G.hash(i, 3, 3) * 50)) % HGT; c.fillRect(sx, sy, 2, 2); }
      }
      if (th === 'mine' || th === 'under') {
        const gr = c.createRadialGradient(W / 2, HGT / 2, 120, W / 2, HGT / 2, 380);
        gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.6)');
        c.fillStyle = gr; c.fillRect(0, 0, W, HGT);
      }
    }

    drawField(c) {
      this.drawWorld(c);
      if (this.game.state.su) this.drawSuScene(c);
      if (!this.screens.length && !this.dlg) this.drawHud(c);
    }

    drawEnt(c, e, x, y) {
      const g = this.game;
      switch (e.kind) {
        case 'npc': {
          if (e.def.near) {
            const a = Math.max(0, Math.min(1, (e.def.near - Math.hypot(e.x - g.player.fx, e.y - g.player.fy)) / 1.4));
            if (a <= 0) break;
            c.save();
            c.globalAlpha = a * (0.86 + 0.14 * Math.sin(this.t * 5 + e.x));
            G.drawSprite(c, G.lookOf(e.def.who, g), e.dir || 'down', 0, x, y);
            c.restore();
            break;
          }
          if (e.def.echo) { c.save(); c.globalAlpha = 0.5 + 0.12 * Math.sin(this.t * 3 + e.x); G.drawSprite(c, G.lookOf(e.def.who, g), e.dir || 'down', 0, x, y); c.restore(); }
          else if (!e.def.ghost) G.drawSprite(c, G.lookOf(e.def.who, g), e.dir || 'down', e.prog < 1 ? (Math.floor(e.prog * 2) + 1) % 4 : 0, x, y);
          if (e.def.label) {
            const w = this.measure(e.def.label, 10, true) + 10, ly = y - 30 - (e.def.lift || 0);
            c.fillStyle = 'rgba(6,10,30,0.8)'; c.fillRect(x + 16 - w / 2, ly, w, 13);
            c.strokeStyle = 'rgba(128,224,255,0.7)'; c.strokeRect(x + 16.5 - w / 2, ly + 0.5, w - 1, 12);
            this.text(e.def.label, x + 16, ly + 1, { align: 'center', size: 10, bold: true, col: C.cyan });
          } else if (e.def.who === 'pompom' && g.tlReadyCount && g.tlReadyCount()) this.badge(x + 16, y - 24 + Math.sin(this.t * 4) * 2);
          else if (e.def.script && Math.hypot(e.x - g.player.x, e.y - g.player.y) < 3) this.diamond(x + 16, y - 22 + Math.sin(this.t * 4) * 2, 4, C.brassHi, '#1a1208');
          break;
        }
        case 'enemy': {
          const d = H.ENEMIES[e.def.g[0]];
          G.fieldEnemy(c, d, x, y, this.t, e.def.g.some(id => H.ENEMIES[id].elite || H.ENEMIES[id].boss));
          if (e.chase) this.text('!', x + 16, y - 30, { align: 'center', size: 16, bold: true, col: '#ff4040' });
          break;
        }
        case 'chest': G.drawObject(c, 'chest', x, y, { open: !!g.state.opened[e.key], phase: this.objPhase(e) }, this.t); break;
        case 'anchor': G.drawObject(c, 'anchor', x, y, { on: g.state.anchors.includes(e.key), phase: this.objPhase(e) }, this.t); break;
        case 'destr': G.drawObject(c, 'destr', x, y, { phase: this.objPhase(e) }, this.t); break;
        case 'lever': G.drawObject(c, 'lever', x, y, { on: !!g.state.flags[e.def.flag] }, this.t); break;
        case 'gate': G.drawObject(c, 'gate', x, y, {}, this.t); break;
        case 'prop': {
          G.drawObject(c, e.def.obj, x, y, { art: e.def.art, on: !!(e.def.magflow && g.state.flags[e.def.magflow]), phase: this.objPhase(e) }, this.t);
          if (e.def.label) {
            const w = this.measure(e.def.label, 10, true) + 10, ly = e.def.obj === 'su_machine' ? y - 86 : y - 30;
            c.fillStyle = 'rgba(14,6,30,0.82)'; c.fillRect(x + 16 - w / 2, ly, w, 13);
            c.strokeStyle = 'rgba(200,150,255,0.8)'; c.strokeRect(x + 16.5 - w / 2, ly + 0.5, w - 1, 12);
            this.text(e.def.label, x + 16, ly + 1, { align: 'center', size: 10, bold: true, col: '#e8d0ff' });
          } else if (e.def.script && Math.hypot(e.x - g.player.x, e.y - g.player.y) < 2.5) this.diamond(x + 16, y - (e.def.obj === 'portrait' ? 38 : 24) - (e.def.lift || 0) + Math.sin(this.t * 4) * 2, 4, C.brassHi, '#1a1208');
          break;
        }
        case 'portal': this.drawSuPortal(c, e, x, y); break;
        case 'marvel': {
          const lit = g.marvelLit(e) || g.marvelDone(e.def.group), k = 0.5 + 0.5 * Math.sin(this.t * 3 + e.x + e.y);
          c.fillStyle = lit ? 'rgba(120,230,255,' + (0.55 + 0.2 * k).toFixed(3) + ')' : 'rgba(120,200,255,' + (0.06 + 0.06 * k).toFixed(3) + ')';
          c.fillRect(x + 2, y + 2, 28, 28);
          c.strokeStyle = lit ? 'rgba(230,250,255,0.95)' : 'rgba(160,220,255,' + (0.18 + 0.12 * k).toFixed(3) + ')'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(x + 9, y + 3); c.lineTo(x + 23, y + 3); c.lineTo(x + 29, y + 16); c.lineTo(x + 23, y + 29); c.lineTo(x + 9, y + 29); c.lineTo(x + 3, y + 16); c.closePath(); c.stroke();
          break;
        }
        case 'rbridge': {
          const on = g.rbridgeOn(e.def.color), col = e.def.color === 'blue' ? '80,170,255' : '255,160,60';
          if (!on) { c.strokeStyle = 'rgba(' + col + ',0.22)'; c.lineWidth = 1; c.strokeRect(x + 3.5, y + 3.5, 25, 25); break; }
          c.fillStyle = 'rgba(' + col + ',0.6)'; c.fillRect(x, y + 2, 32, 28);
          c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(x, y + 2, 32, 2); c.fillRect(x, y + 28, 32, 2);
          c.fillStyle = 'rgba(' + col + ',0.95)'; c.fillRect(x + ((Math.floor(this.t * 24) + e.y * 9) % 32), y + 6, 3, 20);
          break;
        }
        case 'gbridge': {
          if (!g.gbridgeOn(e.def.arm)) {
            c.fillStyle = g.map.def.gearPit || '#05060c'; c.fillRect(x, y, 32, 32);
            c.fillStyle = 'rgba(120,140,180,0.10)'; c.fillRect(x + ((e.x * 7 + e.y * 3) % 20), y + ((e.y * 11) % 24), 6, 2);
            break;
          }
          c.fillStyle = '#3a3e4c'; c.fillRect(x, y, 32, 32);
          c.fillStyle = '#5a6074'; if (e.def.arm === 'ew') { c.fillRect(x, y + 1, 32, 3); c.fillRect(x, y + 28, 32, 3); for (let i = 2; i < 32; i += 8) c.fillRect(x + i, y + 5, 2, 22); } else { c.fillRect(x + 1, y, 3, 32); c.fillRect(x + 28, y, 3, 32); for (let i = 2; i < 32; i += 8) c.fillRect(x + 5, y + i, 22, 2); }
          c.fillStyle = '#8a92a8'; if (e.def.arm === 'ew') c.fillRect(x, y + 1, 32, 1); else c.fillRect(x + 1, y, 1, 32);
          break;
        }
        case 'trigger': {
          if (!e.def.sight) break;
          const k = 0.5 + 0.5 * Math.sin(this.t * 4 + e.x + e.y);
          c.fillStyle = 'rgba(255,90,60,' + (0.14 + 0.1 * k).toFixed(3) + ')'; c.fillRect(x + 1, y + 1, 30, 30);
          c.strokeStyle = 'rgba(255,140,100,0.35)'; c.lineWidth = 1; c.strokeRect(x + 2.5, y + 2.5, 27, 27);
          break;
        }
        case 'span': {
          if (!g.marvelDone(e.def.group)) { c.fillStyle = 'rgba(120,200,255,' + (0.05 + 0.04 * Math.sin(this.t * 2 + e.x)).toFixed(3) + ')'; c.fillRect(x + 4, y + 4, 24, 24); break; }
          c.fillStyle = 'rgba(90,200,255,0.55)'; c.fillRect(x, y + 2, 32, 28);
          c.fillStyle = 'rgba(220,250,255,0.9)'; c.fillRect(x, y + 2, 32, 2); c.fillRect(x, y + 28, 32, 2);
          c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x + ((Math.floor(this.t * 20) + e.x * 7) % 32), y + 4, 2, 24);
          break;
        }
        case 'su_frame': this.drawSuFrameEnt(c, e, x, y); break;
        case 'su_heal': case 'su_tp': G.drawObject(c, e.kind, x, y, { phase: this.objPhase(e) }, this.t); break;
        case 'exit': {
          const m = g.map, dir = e.x === 0 ? 'left' : e.x === m.w - 1 ? 'right' : e.y === m.h - 1 ? 'down' : 'up';
          G.drawObject(c, 'exit', x, y, { dir, locked: !!(e.def.need && !g.cond(e.def.need)) }, this.t);
          break;
        }
      }
    }

    objPhase(e) { return e.x * 1.7 + e.y * 2.9; }

    drawHudMission(c) {
      const g = this.game, s = g.state, tm = g.missionTracked();
      if (!tm) {
        if (g.missionsState().track === 'none' || !s.obj) return;
        const obj = this.wrap(s.obj, 200, 11);
        c.fillStyle = 'rgba(4,6,20,0.55)'; c.fillRect(6, 30, 214, 8 + obj.length * 13);
        this.diamond(13, 37, 3.5, C.brassHi);
        obj.forEach((l, i) => this.text(l, 21, 31 + i * 13, { size: 11, col: '#ffe8b0' }));
        return;
      }
      const ty = H.MISSION_TYPES[tm.type], lines = this.wrap(tm.text || '', 196, 11).slice(0, 3);
      c.fillStyle = 'rgba(4,6,20,0.62)'; c.fillRect(6, 30, 214, 22 + lines.length * 13);
      c.fillStyle = ty.col; c.fillRect(6, 30, 2, 22 + lines.length * 13);
      G.menuIcon(c, ty.icon, 11, 32, 14, ty.col);
      this.text(this.clipText ? this.clipText(tm.name, 190, 10, true) : tm.name, 28, 33, { size: 10, bold: true, col: ty.col });
      lines.forEach((l, i) => this.text(l, 14, 48 + i * 13, { size: 11, col: '#ffe8b0' }));
    }

    drawHud(c) {
      const g = this.game, s = g.state;
      if (this.banner) {
        const a = Math.min(1, this.banner.t * 1.5), parts = this.banner.text.split(': ');
        c.globalAlpha = a;
        const main = parts.pop(), region = parts.join(': ');
        const w = Math.max(240, this.measure(main, 20, true, true) + 80);
        c.fillStyle = 'rgba(4,6,20,0.72)'; c.fillRect(W / 2 - w / 2, 58, w, 50);
        c.fillStyle = C.brass; c.fillRect(W / 2 - w / 2, 58, w, 1); c.fillRect(W / 2 - w / 2, 107, w, 1);
        this.diamond(W / 2 - w / 2 + 12, 83, 4, C.brassHi); this.diamond(W / 2 + w / 2 - 12, 83, 4, C.brassHi);
        if (region) this.text(region, W / 2, 63, { align: 'center', size: 10, col: C.sub });
        this.text(main, W / 2, region ? 76 : 70, { align: 'center', size: 20, bold: true, serif: true, col: C.gold });
        c.globalAlpha = 1;
      }
      if (s.su) this.drawSuHudTop(c);
      else {
        const place = g.map.def.name.split(': ').pop();
        const pw = this.measure(place, 11, true) + 34;
        c.fillStyle = 'rgba(4,6,20,0.78)'; c.fillRect(6, 6, pw, 20);
        c.fillStyle = C.brass; c.fillRect(6, 25, pw, 1);
        G.menuIcon(c, 'nav', 9, 8, 16, C.brassHi);
        this.text(place, 28, 10, { size: 11, bold: true, col: C.cream });
        this.drawHudMission(c);
      }
      const step = Math.max(0, this.t - (this.hudEnT == null ? this.t : this.hudEnT));
      this.hudEnT = this.t;
      s.party.slice(0, 4).forEach((k, i) => {
        const x = W - 132, y = 8 + i * HUD_CARD.step, h = HUD_CARD.h, lead = i === 0;
        const r = s.roster[k], kit = g.kitOf(k), st = s.su ? g.suHpOf(k) : { cur: r.hp == null ? g.charStats(k).hp : r.hp, max: g.charStats(k).hp }, hp = st.cur;
        c.fillStyle = lead ? 'rgba(40,32,12,0.82)' : 'rgba(4,6,20,0.72)'; c.fillRect(x, y, 126, h);
        c.fillStyle = lead ? C.brassHi : 'rgba(154,166,208,0.5)'; c.fillRect(x, y, 2, h);
        this.portraitCard(c, G.lookOf(kit, g), x + 6, y + 6, 34, { elem: H.CHARS[kit].elem, border: lead ? C.brassHi : '#4a5080' });
        if (hp <= 0) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x + 6, y + 6, 34, 34); }
        this.text(String(i + 1), x + 8, y + 6, { size: 9, bold: true, col: C.gold });
        this.text(this.shortName(k), x + 46, y + 3, { size: 11, bold: lead, col: lead ? C.gold : C.cream });
        this.hudGlyph(c, 'hp', x + 44, y + 20);
        this.bar(x + 51, y + 21, 35, 4, hp / st.max, hp / st.max < 0.3 ? '#ff5050' : '#52d67a');
        this.text(hp + '', x + 121, y + 17, { size: 9, align: 'right', col: C.sub });
        this.hudEnergy(c, k, x + 51, y + 33, step);
        if (s.pendingTechs.includes(kit)) this.diamond(x + 116, y + 9, 4, C.cyan, '#08202a');
      });
      this.drawMinimap(c);
      const bx = W - 170, by = HGT - 52;
      c.fillStyle = 'rgba(4,6,20,0.78)'; c.fillRect(bx, by, 164, 46);
      c.fillStyle = C.brass; c.fillRect(bx, by, 164, 1);
      this.text('Техника', bx + 8, by + 6, { size: 10, col: C.sub });
      this.keycap(bx + 54, by + 5, 'E');
      for (let i = 0; i < T.tpMax; i++) this.diamond(bx + 88 + i * 15, by + 12, 5, i < s.tp ? C.cyan : '#1c2a44', '#081828');
      const hx = this.hints(s.su ? [['F', 'удар'], ['M', 'погружение']] : [['F', 'удар'], ['Esc', 'меню']], bx + 8, by + 27), al = g.alerts();
      if (al.events || al.mail || al.chat) this.badge(hx - 4, by + 33);
      if (!g.busy() && !this.screens.length) {
        const [fx, fy] = g.front();
        const e = g.entAt(fx, fy, x => x.kind !== 'enemy' && x.kind !== 'trigger' && x.kind !== 'exit' && x.kind !== 'marvel' && x.kind !== 'span' && x.kind !== 'rbridge' && x.kind !== 'gbridge');
        const pt = !e && g.petFront && g.petFront();
        if (e || pt) {
          const label = pt ? 'Погладить: ' + H.PETS[pt.id].name : (e.def && e.def.hint) || { npc: 'Говорить', prop: 'Осмотреть', chest: g.state.opened[e.key] ? 'Пусто' : 'Открыть', anchor: 'Якорь пространства', lever: 'Рубильник', destr: 'Разбить (F)', gate: 'Переборка', su_frame: 'Событие', su_heal: 'Капсула восстановления', su_tp: 'Очко техники' }[e.kind] || '';
          const w = this.measure(label, 12, true) + 70;
          c.fillStyle = 'rgba(4,6,20,0.82)'; c.fillRect(W / 2 - w / 2, HGT - 86, w, 22);
          c.strokeStyle = C.brass; c.strokeRect(W / 2 - w / 2 + 0.5, HGT - 85.5, w - 1, 21);
          const kw = this.keycap(W / 2 - w / 2 + 8, HGT - 81, 'Пробел');
          this.text(label, W / 2 - w / 2 + 14 + kw, HGT - 82, { size: 12, bold: true });
        }
      }
    }

    hudGlyph(c, kind, x, y) {
      if (kind === 'hp') { c.fillStyle = '#000'; c.fillRect(x, y + 1, 5, 3); c.fillRect(x + 1, y, 3, 5); c.fillStyle = '#52d67a'; c.fillRect(x, y + 2, 5, 1); c.fillRect(x + 2, y, 1, 5); return; }
      c.fillStyle = '#000'; c.beginPath(); c.moveTo(x + 3.5, y - 1.5); c.lineTo(x - 0.5, y + 3.5); c.lineTo(x + 1.8, y + 3.5); c.lineTo(x + 0.5, y + 7.5); c.lineTo(x + 5.5, y + 2); c.lineTo(x + 3.2, y + 2); c.lineTo(x + 4.8, y - 1.5); c.fill();
      c.fillStyle = HUD_CARD.energy; c.beginPath(); c.moveTo(x + 3.5, y - 0.5); c.lineTo(x + 0.6, y + 3); c.lineTo(x + 2.6, y + 3); c.lineTo(x + 1.4, y + 6.2); c.lineTo(x + 4.6, y + 2.4); c.lineTo(x + 2.6, y + 2.4); c.lineTo(x + 4, y - 0.5); c.fill();
    }

    hudEnergy(c, k, x, y, step) {
      const g = this.game, en = g.energyOf(k), f = en.max ? en.cur / en.max : 0, full = en.cur >= en.max;
      if (!en.max) { this.hudGlyph(c, 'energy', x - 7, y - 1); this.text('ноты в бою', x, y - 4, { size: 9, col: HUD_CARD.energyText }); return; }
      const shown = this.hudEn || (this.hudEn = {});
      shown[k] = shown[k] == null || shown[k] > f ? f : Math.min(f, shown[k] + step * HUD_CARD.fill);
      const w = HUD_CARD.barW, col = full ? 'hsl(' + ((this.t * 200) % 360) + ',90%,65%)' : HUD_CARD.energy;
      this.hudGlyph(c, 'energy', x - 7, y - 1);
      this.bar(x, y, w, 4, shown[k], col);
      if (shown[k] < f) { const a = x + Math.round(w * shown[k]), z = x + Math.round(w * f); c.fillStyle = 'rgba(255,246,200,' + (0.55 + 0.35 * Math.sin(this.t * 14)).toFixed(2) + ')'; c.fillRect(a, y, z - a, 4); }
      c.fillStyle = 'rgba(0,0,0,0.6)';
      for (let q = 1; q < 4; q++) c.fillRect(x + Math.round(w * q / 4), y, 1, 4);
      if (full) { c.fillStyle = 'rgba(255,240,180,' + (0.25 + 0.2 * Math.sin(this.t * 5)).toFixed(2) + ')'; c.fillRect(x - 1, y - 2, w + 2, 1); c.fillRect(x - 1, y + 5, w + 2, 1); }
      this.text(en.cur + '/' + en.max, x + 70, y - 4, { size: 9, align: 'right', bold: full, col: full ? C.gold : HUD_CARD.energyText });
    }

    shortName(k) {
      const g = this.game;
      if (k === 'trail' || k === '@') return g.state.name;
      const n = H.CHARS[g.kitOf(k)] ? H.CHARS[g.kitOf(k)].name : String(k);
      return n.length > 11 ? n.split(' ')[0] : n;
    }

    drawDialog(c) {
      const d = this.dlg, g = this.game;
      const bx = 12, by = HGT - 106, bw = W - 24, bh = 96;
      const speaker = d.spk && d.spk !== 'narrator' && d.spk !== '';
      if (speaker) {
        const look = G.lookOf(d.spk === '@' ? 'trail' : d.spk, g);
        const rise = Math.min(1, (d.age || 0) * 6);
        c.save(); c.globalAlpha = rise;
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(88, by + 4, 60, 10, 0, 0, Math.PI * 2); c.fill();
        G.drawBust(c, look, 24, by - 124 + Math.round((1 - rise) * 10), 2);
        c.restore();
      }
      this.win(bx, by, bw, bh, { alpha: 0.93 });
      if (d.name) this.plate(speaker ? bx + 150 : bx + 24, by - 9, d.name, { plateSize: 13 });
      const lines = this.wrap(d.text.slice(0, Math.floor(d.shown)), bw - 40, 13);
      lines.slice(0, 4).forEach((l, i) => this.text(l, bx + 18, by + 16 + i * 18, { size: 13 }));
      if (d.shown >= d.text.length) this.diamond(bx + bw - 18, by + bh - 14 + Math.sin(this.t * 6) * 2, 5, C.brassHi, '#1a1208');
      if (g.skipInfo()) this.skipButton(c, bx + bw - 10, by - 10);
    }

    skipButton(c, right, y) {
      const label = 'Пропустить »', kw = Math.max(14, Math.round(this.measure('Tab', 9, true) + 8));
      const w = kw + this.measure(label, 11, true) + 20, x = Math.round(right - w);
      c.fillStyle = '#010208'; c.fillRect(x - 1, y - 1, w + 2, 21);
      c.fillStyle = 'rgba(14,18,48,0.94)'; c.fillRect(x, y, w, 19);
      c.fillStyle = C.brass; c.fillRect(x, y, w, 1);
      c.fillStyle = C.brassDk; c.fillRect(x, y + 18, w, 1);
      this.keycap(x + 6, y + 3, 'Tab');
      this.text(label, x + kw + 12, y + 3, { size: 11, bold: true, col: C.gold });
      this.hit(x, y, w, 19, () => this.openSkip());
    }

    drawSkipping(c) {
      const label = 'Сцена пропускается', w = Math.round(this.measure(label, 11, true) + 34), x = W - w - 12, y = 12;
      c.fillStyle = 'rgba(4,6,20,0.82)'; c.fillRect(x, y, w, 20);
      c.fillStyle = C.brass; c.fillRect(x, y, w, 1); c.fillRect(x, y + 19, w, 1);
      for (let i = 0; i < 2; i++) {
        const ax = x + 8 + i * 6 + ((this.t * 8) % 2 < 1 ? 1 : 0);
        c.fillStyle = C.brassHi; c.beginPath(); c.moveTo(ax, y + 5); c.lineTo(ax + 5, y + 10); c.lineTo(ax, y + 15); c.fill();
      }
      this.text(label, x + 26, y + 4, { size: 11, bold: true, col: C.gold });
    }

    openSkip() {
      const ui = this, g = this.game, info = g.skipInfo();
      if (!info) { this.sfx('deny'); return; }
      const lines = this.wrap(info.text, 436, 12), note = 'Ответы в диалогах останутся за вами. Бои и подсказки не пропускаются.';
      const go = () => { ui.screens.pop(); ui.sfx('confirm'); ui.dlg = null; g.skip(); ui.drainGameEvents(); };
      const stay = () => ui.pop();
      this.push({
        sel: 0,
        draw(c) {
          const w = 480, h = 150 + lines.length * 17, x = W / 2 - w / 2, y = Math.round(HGT / 2 - h / 2 - 30);
          c.fillStyle = 'rgba(2,3,12,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Пропуск сцены' });
          G.menuIcon(c, 'mission', x + 18, y + 18, 32);
          ui.text('Краткое содержание', x + 60, y + 18, { size: 10, col: C.sub });
          ui.text(info.title, x + 60, y + 31, { size: 15, bold: true, serif: true, col: C.gold });
          c.fillStyle = C.brassDk; c.fillRect(x + 18, y + 58, w - 36, 1);
          lines.forEach((l, i) => ui.text(l, x + 22, y + 68 + i * 17, { size: 12 }));
          const ny = y + 76 + lines.length * 17;
          ui.text(note, W / 2, ny, { align: 'center', size: 10, col: C.dim });
          [['Пропустить', go], ['Читать дальше', stay]].forEach(([label, fn], i) => ui.button(W / 2 - 146 + i * 152, ny + 22, 140, 24, label, fn, { active: this.sel === i }));
          ui.hints([['Tab', 'пропустить'], ['←→', 'выбор'], ['Esc', 'читать дальше']], W / 2, ny + 56, { align: 'center' });
        },
        key(k, code) {
          if (code === 'Tab') return go();
          if (k === 'left' || k === 'right' || k === 'up' || k === 'down') { this.sel = 1 - this.sel; ui.sfx('select'); return; }
          if (k === 'ok') return this.sel === 0 ? go() : stay();
          if (k === 'back') stay();
        }
      });
    }

    drawToasts(c) {
      this.toasts.forEach((tt, i) => {
        const lines = this.wrap(tt.text, 360, 11);
        const h = 12 + lines.length * 13, y = 116 + i * 38, w = 390;
        c.globalAlpha = Math.min(1, tt.t * 2);
        c.fillStyle = 'rgba(24,18,6,0.9)'; c.fillRect(W / 2 - w / 2, y, w, h);
        c.fillStyle = C.brass; c.fillRect(W / 2 - w / 2, y, w, 1); c.fillRect(W / 2 - w / 2, y + h - 1, w, 1);
        this.diamond(W / 2 - w / 2 + 9, y + h / 2, 3.5, C.brassHi);
        lines.forEach((l, j) => this.text(l, W / 2 + 6, y + 6 + j * 13, { align: 'center', size: 11, col: '#fff2c8' }));
        c.globalAlpha = 1;
      });
    }

    openChoice(p) {
      const ui = this;
      this.push({
        sel: 0,
        draw() {
          const opts = p.options, w = 300, h = opts.length * 24 + 26, x = W - w - 20, y = HGT - 118 - h;
          ui.win(x, y, w, h, { title: p.title || 'Ответ' });
          ui.list(x + 8, y + 16, w - 16, opts.map(o => ({ label: o[0] })), this.sel, { rowH: 24, onClick: i => { this.sel = i; this.key('ok'); } });
        },
        key(k) {
          if (ui.listNav(this, k, p.options.length)) return;
          if (k === 'ok') { ui.screens.pop(); ui.sfx('confirm'); ui.finishPending(this.sel); }
        }
      });
    }

    openTut(p) {
      const ui = this;
      this.push({
        draw(c) {
          const lines = ui.wrap(p.text, 400, 12);
          const h = 62 + lines.length * 16, x = W / 2 - 240, y = HGT / 2 - h / 2;
          c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, 480, h, { title: 'Подсказка' });
          G.menuIcon(c, 'guide', x + 16, y + 20, 32);
          lines.forEach((l, i) => ui.text(l, x + 60, y + 22 + i * 16));
          ui.hints([['Enter', 'Понятно']], W / 2, y + h - 22, { align: 'center' });
          ui.hit(0, 0, W, HGT, () => this.key('ok'));
        },
        key(k) { if (k === 'ok' || k === 'back') { ui.screens.pop(); ui.sfx('confirm'); ui.finishPending(); } }
      });
    }

    openUi(p) {
      const close = () => { this.finishPending(); };
      if (this['openUi_' + p.ui]) return this['openUi_' + p.ui](p);
      switch (p.ui) {
        case 'name': return this.openName();
        case 'shop': return this.openShop(p.id, close);
        case 'tlrewards': return this.openTlRewards(close);
        case 'rumor': return this.openRumors(p.who, close);
        case 'warp': return this.openWarp(close);
        case 'calyx': return this.openCalyx(close, p.only);
        case 'magflow': return this.openMagflow(p.id, ok => this.finishPending(!!ok));
        case 'carts': return this.openCarts(p.id, ok => this.finishPending(!!ok));
        case 'nav': return this.openStarMap(close);
        case 'databank': return this.openBank(close);
        case 'book': return this.openBook(p.book, close);
        case 'doc': return this.openDoc(p.doc, close);
        case 'anchor': return this.openAnchor(p.anchor, close);
        case 'su': return this.openSuTerminal(close);
        case 'su_bless': return this.openSuBless(p);
        case 'su_curio': return this.openSuCurio(p);
        case 'su_shop': return this.openSuShop(p, close);
        case 'su_enhance': return this.openSuEnhance(p, close);
        case 'su_end': return this.openSuEnd(p);
        case 'fh': return this.openFh(close);
        case 'fh_shop': return this.openFhShop(close);
      }
      close();
    }

    openName() {
      const ui = this;
      const opts = [{ name: 'Келус', gender: 'm' }, { name: 'Стелла', gender: 'f' }];
      this.push({
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.7)'; c.fillRect(0, 0, W, HGT);
          ui.win(W / 2 - 220, 60, 440, 350, { title: 'Выбор сосуда' });
          opts.forEach((o, i) => {
            const x = W / 2 - 200 + i * 210, y = 84, on = i === this.sel;
            const gr = c.createLinearGradient(0, y, 0, y + 290);
            gr.addColorStop(0, on ? '#2a2a60' : '#12142e'); gr.addColorStop(1, on ? '#4a3a70' : '#0a0c20');
            c.fillStyle = gr; c.fillRect(x, y, 190, 290);
            c.strokeStyle = on ? C.brassHi : '#3a4070'; c.strokeRect(x + 0.5, y + 0.5, 189, 289);
            c.fillStyle = 'rgba(160,190,255,0.25)'; c.beginPath(); c.ellipse(x + 95, y + 236, 60, 10, 0, 0, Math.PI * 2); c.fill();
            G.drawFigure(c, G.trailLook(o.gender), x + 95, y + 238, 2);
            ui.text(o.name, x + 95, y + 250, { align: 'center', bold: true, serif: true, size: 16, col: on ? C.gold : C.cream });
            ui.text('Активный сосуд', x + 95, y + 270, { align: 'center', size: 11, col: C.sub });
            ui.hit(x, y, 190, 290, () => { this.sel = i; this.key('ok'); });
          });
          ui.hints([['←→', 'Выбор'], ['Enter', 'Этот сосуд']], W / 2, 386, { align: 'center' });
        },
        key(k) {
          if (k === 'left' || k === 'right' || k === 'up' || k === 'down') { this.sel = 1 - this.sel; ui.sfx('select'); return; }
          if (k === 'ok') { ui.screens.pop(); ui.sfx('confirm'); ui.finishPending(opts[this.sel]); }
        }
      });
    }

    openAnchor(anchor, close) {
      const ui = this, g = this.game;
      const items = () => [
        { label: 'Отдохнуть', right: 'полное лечение', icon: (c, x, y) => G.itemIcon(c, 'medkit', x, y - 8, 16), fn: () => { g.rest(); ui.sfx('heal'); ui.toast('Команда полностью восстановлена.'); } },
        { label: 'Сохранить игру', right: 'карта памяти', icon: (c, x, y) => G.menuIcon(c, 'save', x, y - 8, 16), fn: () => ui.openSaves('save') },
        { label: 'Телепорт', right: 'карта навигации', icon: (c, x, y) => G.menuIcon(c, 'nav', x, y - 8, 16), fn: () => ui.openNav(null) },
        { label: 'Закрыть', icon: (c, x, y) => G.menuIcon(c, 'exit', x, y - 8, 16), fn: () => { ui.screens.pop(); close(); } }
      ];
      this.push({
        draw() {
          ui.win(W / 2 - 170, 120, 340, 150, { title: 'Якорь пространства' });
          ui.text(anchor.name, W / 2, 138, { align: 'center', size: 13, bold: true, serif: true, col: C.cyan });
          ui.list(W / 2 - 160, 160, 320, items(), this.sel, { rowH: 24, onClick: i => { this.sel = i; this.key('ok'); } });
        },
        key(k) {
          const it = items();
          if (ui.listNav(this, k, it.length)) return;
          if (k === 'ok') it[this.sel].fn();
          if (k === 'back') { ui.screens.pop(); ui.sfx('cancel'); close(); }
        }
      });
    }

    openSaves(mode, onDone) {
      const ui = this;
      const slots = mode === 'load' ? [1, 2, 3, 'auto'] : [1, 2, 3];
      this.push({
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.6)'; c.fillRect(0, 0, W, HGT);
          const h = 54 + slots.length * 62;
          ui.win(W / 2 - 230, 70, 460, h, { title: mode === 'load' ? 'Карта памяти — загрузка' : 'Карта памяти — сохранение' });
          ui.closeBtn(W / 2 + 230 - 30, 70 + 8, () => this.key('back'));
          slots.forEach((s, i) => {
            const d = lsGet(SAVE_KEY + s, null), y = 104 + i * 62, x = W / 2 - 216, on = i === this.sel;
            c.fillStyle = on ? 'rgba(242,220,154,0.2)' : 'rgba(0,0,0,0.3)'; c.fillRect(x, y, 432, 56);
            if (on) { c.fillStyle = C.brassHi; c.fillRect(x, y, 2, 56); }
            G.menuIcon(c, 'save', x + 8, y + 8, 40, d ? (s === 'auto' ? C.cyan : C.brassHi) : '#4a4e68');
            ui.text(s === 'auto' ? 'Авто' : 'Блок ' + s, x + 58, y + 6, { bold: true, serif: true, col: C.gold });
            if (d) {
              G.drawPortrait(c, G.trailLook(d.state && d.state.gender), x + 380, y + 6, 44);
              ui.text(d.summary.name + ' · ур. ' + d.summary.lvl + ' · ' + d.summary.time, x + 118, y + 7, { size: 12 });
              ui.text(d.summary.where, x + 58, y + 24, { size: 11, col: C.sub });
              ui.text(d.date || '', x + 58, y + 39, { size: 10, col: C.dim });
            } else ui.text('— пусто —', x + 118, y + 20, { col: C.dim });
            ui.hit(x, y, 432, 56, () => { this.sel = i; this.key('ok'); });
          });
          ui.hints([['Enter', mode === 'load' ? 'Загрузить' : 'Записать'], ['Esc', 'Назад']], W / 2, 70 + h - 20, { align: 'center' });
        },
        key(k) {
          if (ui.listNav(this, k, slots.length)) return;
          if (k === 'back') { ui.pop(); return; }
          if (k === 'ok') {
            const s = slots[this.sel];
            if (mode === 'save') { if (ui.writeSave(s)) { ui.sfx('anchor'); ui.toast('Игра записана в блок ' + s); } ui.screens.pop(); if (onDone) onDone(); }
            else { if (!lsGet(SAVE_KEY + s, null)) { ui.sfx('deny'); return; } ui.screens = []; ui.loadGame(s); }
          }
        }
      });
    }

    openTransfer() {
      const ui = this;
      const items = () => {
        const n = storedSlots().length;
        return [
          { label: 'Выгрузить в файл', right: n ? 'блоков: ' + n : 'нет сохранений', disabled: !n, icon: (c, x, y) => G.menuIcon(c, 'save', x, y - 8, 16), fn: () => ui.exportSaves() },
          { label: 'Загрузить из файла', right: '.json', icon: (c, x, y) => G.menuIcon(c, 'load', x, y - 8, 16), fn: () => ui.importSaves() },
          { label: 'Закрыть', icon: (c, x, y) => G.menuIcon(c, 'exit', x, y - 8, 16), fn: () => ui.pop() }
        ];
      };
      this.push({
        draw(c) {
          c.fillStyle = 'rgba(2,3,12,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(W / 2 - 190, 130, 380, 164, { title: 'Перенос сохранений' });
          ui.closeBtn(W / 2 + 190 - 30, 130 + 8, () => this.key('back'));
          ui.text('Все блоки карты памяти — одним файлом', W / 2, 150, { align: 'center', size: 11, col: C.sub });
          ui.list(W / 2 - 170, 172, 340, items(), this.sel, { rowH: 26, onClick: i => { this.sel = i; this.key('ok'); } });
          ui.hints([['Enter', 'Выбрать'], ['Esc', 'Назад']], W / 2, 130 + 164 - 20, { align: 'center' });
        },
        key(k) {
          const it = items();
          if (ui.listNav(this, k, it.length)) return;
          if (k === 'back') { ui.pop(); return; }
          if (k === 'ok') { if (it[this.sel].disabled) { ui.sfx('deny'); return; } it[this.sel].fn(); }
        }
      });
    }

    confirmImport(slots, list, busy) {
      const ui = this;
      const items = [
        { label: 'Заменить', icon: (c, x, y) => G.menuIcon(c, 'load', x, y - 8, 16), fn: () => { ui.screens.pop(); ui.applyImport(slots, list); } },
        { label: 'Отмена', icon: (c, x, y) => G.menuIcon(c, 'exit', x, y - 8, 16), fn: () => ui.pop() }
      ];
      this.push({
        draw() {
          ui.win(W / 2 - 200, 150, 400, 148, { title: 'Замена сохранений' });
          ui.text('В файле: ' + slotTitles(list), W / 2, 170, { align: 'center', size: 12, col: C.cream });
          ui.text('Будут перезаписаны: ' + slotTitles(busy), W / 2, 188, { align: 'center', size: 11, col: C.bad });
          ui.list(W / 2 - 180, 212, 360, items, this.sel, { rowH: 26, onClick: i => { this.sel = i; this.key('ok'); } });
        },
        key(k) {
          if (ui.listNav(this, k, items.length)) return;
          if (k === 'back') { ui.pop(); return; }
          if (k === 'ok') items[this.sel].fn();
        }
      });
    }

    openSettings() {
      const ui = this;
      const rows = () => [
        { label: 'Громкость эффектов', k: 'sfx', step: 0.1, max: 1, min: 0, fmt: v => Math.round(v * 10) + '/10' },
        { label: 'Громкость музыки', k: 'music', step: 0.1, max: 1, min: 0, fmt: v => Math.round(v * 10) + '/10' },
        { label: 'Скорость боя', k: 'battleSpeed', step: 0.5, max: 3, min: 1, fmt: v => '×' + v },
        { label: 'Сцены абсолютных техник', k: 'ultCine', presets: H.Ults ? H.Ults.MODES : [{ id: 'off', tag: 'Выкл.' }], cur: () => ui.options.ultCine || 'on', set: setCine('ultCine'), fmt: () => '' },
        { label: 'Сцены слияний', k: 'fusionCine', presets: H.Fusions ? H.Fusions.MODES : [{ id: 'off', tag: 'Выкл.' }], cur: () => ui.options.fusionCine || 'on', set: setCine('fusionCine'), fmt: () => '' },
        { label: 'Сцены навыков облика', k: 'skinCine', presets: H.Ults ? H.Ults.MODES : [{ id: 'off', tag: 'Выкл.' }], cur: () => ui.options.skinCine || 'first', set: setCine('skinCine'), fmt: () => '' },
        { label: 'Скорость текста', k: 'textSpeed', step: 1, max: 5, min: 1, fmt: v => '×' + v },
        { label: 'Разрешение', k: 'res', presets: RES, cur: () => ui.resPreset().id, set: id => setRes(id), fmt: () => ui.canvas.width + '×' + ui.canvas.height }
      ].concat(ui.game && ui.game.coneSupMode ? [{ label: 'Наложение конусов', k: 'coneSup', presets: [{ id: 'auto', tag: 'Авто' }, { id: 'manual', tag: 'Вручную' }], cur: () => ui.game.coneSupMode(), set: id => { if (ui.game.coneSupMode() !== id) { ui.game.setConeSup(id); ui.sfx('select'); } }, fmt: () => '' }] : []);
      const setCine = k => id => {
        if (ui.options[k] === id) return;
        ui.options[k] = id;
        lsSet(OPT_KEY, ui.options);
        ui.sfx('select');
      };
      const setRes = id => {
        if (ui.options.res === id) return;
        ui.options.res = id;
        ui.applyRes();
        lsSet(OPT_KEY, ui.options);
        ui.sfx('select');
      };
      const presetStrip = (r, x, y, w, on, pick) => {
        const n = r.presets.length, sw = Math.floor((w - (n - 1) * 3) / n);
        r.presets.forEach((p, j) => {
          const px = x + j * (sw + 3), cur = p.id === r.cur();
          ui.ctx.fillStyle = cur ? C.brass : '#05060e'; ui.ctx.fillRect(px, y, sw, 13);
          ui.ctx.fillStyle = cur ? C.brassHi : '#3a3020'; ui.ctx.fillRect(px, y, sw, 1);
          ui.ctx.fillStyle = '#6a5a3a'; ui.ctx.fillRect(px, y + 12, sw, 1);
          ui.text(p.tag, px + sw / 2, y + 1, { align: 'center', size: 10, bold: cur, shadow: !cur, col: cur ? C.ink2 : on ? C.cream : C.dim });
          ui.hit(px, y, sw, 13, () => pick(p.id));
        });
      };
      this.push({
        draw(c) {
          const list = rows(), x = W / 2 - 200, h = 66 + list.length * 34, y = Math.round((HGT - h) / 2);
          ui.win(x, y, 400, h, { title: 'Настройки' });
          ui.closeBtn(x + 400 - 30, y + 8, () => this.key('back'));
          G.menuIcon(c, 'settings', x + 18, y + 30, 32);
          list.forEach((r, i) => {
            const yy = y + 36 + i * 34, on = i === this.sel, v = ui.options[r.k];
            if (on) { c.fillStyle = 'rgba(242,220,154,0.15)'; c.fillRect(x + 60, yy - 3, 324, 30); ui.cursor(x + 62, yy + 6); }
            ui.text(r.label, x + 76, yy, { bold: on, col: on ? C.gold : C.cream });
            ui.hit(x + 60, yy - 3, 324, 30, () => { this.sel = i; });
            if (r.presets) presetStrip(r, x + 76, yy + 14, r.fmt(v) ? 220 : 300, on, id => { this.sel = i; r.set(id); });
            else ui.rail(x + 76, yy + 20, 220, (v - r.min) / (r.max - r.min));
            ui.text(r.fmt(v), x + 376, yy + 12, { align: 'right', size: 11, col: C.sub });
          });
          ui.hints([['←→', 'Изменить'], ['Esc', 'Готово']], W / 2, y + h - 24, { align: 'center' });
        },
        key(k) {
          const r = rows();
          if (ui.listNav(this, k, r.length)) return;
          const it = r[this.sel];
          if ((k === 'left' || k === 'right') && it.presets) {
            const i = it.presets.findIndex(p => p.id === it.cur()) + (k === 'left' ? -1 : 1);
            if (it.presets[i]) it.set(it.presets[i].id);
          } else if (k === 'left' || k === 'right') {
            const d = k === 'left' ? -it.step : it.step;
            ui.options[it.k] = Math.round(Math.max(it.min, Math.min(it.max, ui.options[it.k] + d)) * 10) / 10;
            ui.audio.setVolumes(ui.options.sfx, ui.options.music);
            lsSet(OPT_KEY, ui.options);
            ui.sfx('select');
          }
          if (k === 'back' || k === 'ok') ui.pop();
        }
      });
    }

    canSaveHere() {
      const g = this.game;
      if (g.map.def.safe) return true;
      return g.map.ents.some(e => e.kind === 'anchor' && Math.abs(e.x - g.player.x) + Math.abs(e.y - g.player.y) <= 3);
    }

    openCredits() {
      this.mode = 'credits';
      this.creditsT = 0;
      this.audio.music('express');
    }

    drawCredits(c) {
      G.drawCG(c, 'express', W, HGT, this.t);
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, W, HGT);
      const lines = [...H.BRAND.credits, 'Контакт, Слияния и Слухи — Persona 2', 'Тема главного меню — HOYO-MiX (MIDI-переложение)', 'Боевые темы — HOYO-MiX (MIDI-переложения)', '', 'Программирование, графика, музыка:', H.BRAND.makers, '', 'Звёздный экспресс: Химико, Вельт, Март 7, Дань Хэн, Пом-Пом', 'Белобог: Броня, Зеле, Гепард, Сервал, Наташа, Хук, Сампо', '', 'Спасибо за игру!', '', 'Следующая остановка — Сяньчжоу «Лофу»...'];
      const y0 = HGT - this.creditsT * 30;
      lines.forEach((l, i) => this.text(l, W / 2, y0 + i * 26, { align: 'center', size: i === 0 ? 22 : 13, bold: i === 0, serif: i === 0, col: i === 0 ? C.gold : C.cream }));
      if (y0 + lines.length * 26 < 0) this.endCredits();
      this.hit(0, 0, W, HGT, () => this.endCredits());
    }

    endCredits() {
      if (this.mode !== 'credits') return;
      this.mode = 'field';
      this.finishPending();
      this.enterField();
    }
  }

  Object.assign(H, { UI, UI_CONST: { W, HGT, TS, C, GLOW_NAME, FONT, SERIF, lsGet, lsSet, SAVE_KEY, OPT_KEY, SAVE_SLOTS, SAVE_DIR, saveFileName, mirrorSave } });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
