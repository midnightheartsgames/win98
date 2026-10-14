/**
 * Diablo 98 — DOM interface: 640x480 stage scaled to the window, classic control panel,
 * inventory/character/spellbook/quest panels, NPC stores, menus, input and the main loop.
 */
(function (D) {
  'use strict';
  const SAVE_KEY = 'diablo98-save', OPT_KEY = 'diablo98-options';
  const { CLASSES, SPELLS, SKILLS } = D.DATA;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const store = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); return true; } catch (_) { return false; } }, del(k) { try { localStorage.removeItem(k); } catch (_) {} } };
  const OBJ_NAMES = { barrel: 'Бочка', chest: 'Сундук', bigchest: 'Большой сундук', sarcophagus: 'Саркофаг', shrine: 'Святилище', rack: 'Стойка с оружием', bookcase: 'Книжный шкаф', fountain_blood: 'Кровавый фонтан', fountain_mana: 'Очищающий источник', pedestal: 'Пьедестал', portal: 'Городской портал', well: 'Колодец' };
  const SHRINE_NAMES = { mysterious: 'Таинственное', divine: 'Божественное', eerie: 'Жуткое', glimmering: 'Мерцающее', religious: 'Благочестивое', enchanted: 'Зачарованное', cryptic: 'Загадочное', spooky: 'Призрачное', abandoned: 'Заброшенное', creepy: 'Зловещее', quiet: 'Тихое', magical: 'Магическое' };
  const SLOTS = { head: [133, 12, 2, 2], amulet: [205, 26, 1, 1], weapon: [18, 64, 2, 3], shield: [244, 64, 2, 3], body: [133, 80, 2, 3], ring1: [48, 164, 1, 1], ring2: [244, 164, 1, 1] };
  const SLOT_NAMES = { head: 'Шлем', amulet: 'Амулет', weapon: 'Оружие', shield: 'Щит', body: 'Доспех', ring1: 'Кольцо', ring2: 'Кольцо' };
  const CELL = 29, GRID_X = 15, GRID_Y = 214;

  const urlCache = new Map();
  function iconURL(item) {
    const b = D.baseOf(item), key = `${item.base}|${b.color || ''}|${item.quality}|${item.unique || ''}|${item.spell || ''}|${item.staffSpell || ''}`;
    if (urlCache.has(key)) return urlCache.get(key);
    const src = D.itemIcon(item), cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height; cv.getContext('2d').drawImage(src, 0, 0);
    const url = cv.toDataURL(); urlCache.set(key, url); return url;
  }
  const spellCache = new Map();
  function spellIconURL(id) {
    if (spellCache.has(id)) return spellCache.get(id);
    const cv = document.createElement('canvas'); cv.width = cv.height = 56; const c = cv.getContext('2d'); c.scale(2, 2);
    const sp = SPELLS[id], col = sp ? sp.color : '#c0a060';
    const g = c.createLinearGradient(0, 0, 28, 28); g.addColorStop(0, '#2a1e14'); g.addColorStop(1, '#0a0806'); c.fillStyle = g; c.fillRect(0, 0, 28, 28);
    c.strokeStyle = '#8a7040'; c.lineWidth = 1; c.strokeRect(0.5, 0.5, 27, 27);
    c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 2; c.lineCap = 'round'; c.shadowColor = col; c.shadowBlur = 4;
    const zig = (x, y, w) => { c.beginPath(); c.moveTo(x + 8 * w, y); c.lineTo(x, y + 10); c.lineTo(x + 6 * w, y + 10); c.lineTo(x - 2 * w, y + 22); c.stroke(); };
    switch (id) {
      case 'firebolt': c.beginPath(); c.moveTo(6, 22); c.lineTo(20, 8); c.stroke(); c.beginPath(); c.arc(20, 8, 4, 0, 7); c.fill(); break;
      case 'fireball': c.beginPath(); c.arc(14, 14, 8, 0, 7); c.fill(); c.fillStyle = '#ffe080'; c.beginPath(); c.arc(12, 12, 3, 0, 7); c.fill(); break;
      case 'lightning': zig(12, 3, 1); break;
      case 'chainlightning': zig(8, 3, 0.8); zig(17, 3, 0.8); break;
      case 'heal': c.fillRect(11, 5, 6, 18); c.fillRect(5, 11, 18, 6); break;
      case 'flash': for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(14, 14); c.lineTo(14 + Math.cos(a) * 11, 14 + Math.sin(a) * 11); c.stroke(); } break;
      case 'nova': c.beginPath(); c.arc(14, 14, 9, 0, 7); c.stroke(); c.beginPath(); c.arc(14, 14, 4, 0, 7); c.stroke(); break;
      case 'townportal': c.beginPath(); c.ellipse(14, 14, 6, 11, 0, 0, 7); c.stroke(); break;
      case 'manashield': c.beginPath(); c.moveTo(6, 6); c.lineTo(22, 6); c.lineTo(22, 14); c.quadraticCurveTo(22, 22, 14, 25); c.quadraticCurveTo(6, 22, 6, 14); c.closePath(); c.stroke(); break;
      case 'stonecurse': c.fillStyle = '#909090'; c.beginPath(); c.arc(14, 12, 8, 0, 7); c.fill(); c.fillStyle = '#000'; c.fillRect(9, 10, 3, 3); c.fillRect(16, 10, 3, 3); c.fillRect(11, 20, 6, 4); break;
      case 'teleport': c.beginPath(); for (let i = 0; i < 30; i++) { const a = i * 0.45, r = i * 0.35; c.lineTo(14 + Math.cos(a) * r, 14 + Math.sin(a) * r); } c.stroke(); break;
      case 'identify': c.beginPath(); c.ellipse(14, 14, 10, 6, 0, 0, 7); c.stroke(); c.beginPath(); c.arc(14, 14, 3, 0, 7); c.fill(); break;
      case 'repair': c.fillStyle = '#b0b0b0'; c.fillRect(6, 6, 14, 6); c.strokeStyle = '#8a6030'; c.lineWidth = 3; c.beginPath(); c.moveTo(13, 12); c.lineTo(13, 24); c.stroke(); break;
      case 'disarm': c.strokeStyle = '#d0b060'; c.beginPath(); c.arc(10, 10, 5, 0, 7); c.stroke(); c.beginPath(); c.moveTo(14, 14); c.lineTo(23, 23); c.moveTo(19, 19); c.lineTo(22, 16); c.stroke(); break;
      case 'recharge': c.strokeStyle = '#8a6030'; c.lineWidth = 3; c.beginPath(); c.moveTo(10, 24); c.lineTo(18, 8); c.stroke(); c.fillStyle = '#80a0ff'; c.beginPath(); c.arc(19, 7, 4, 0, 7); c.fill(); break;
      default: c.font = '16px serif'; c.fillText('?', 9, 20);
    }
    const url = cv.toDataURL(); spellCache.set(id, url); return url;
  }

  class UI {
    constructor(root, opts = {}) {
      this.root = root; this.opts = opts; this.ac = new AbortController(); const sig = { signal: this.ac.signal };
      root.classList.add('d98'); root.tabIndex = 0;
      root.innerHTML = `<div class="d98-stage">
        <canvas class="d98-canvas" width="640" height="480" aria-label="Изометрическое подземелье Diablo"></canvas>
        <div class="d98-banner"></div><div class="d98-bark"></div><div class="d98-msg" role="status" aria-live="polite"></div>
        <div class="d98-panel d98-left" hidden></div><div class="d98-panel d98-right" hidden></div>
        <div class="d98-dialog" hidden></div><div class="d98-spellsel" hidden></div>
        <div class="d98-control">
          <div class="d98-xpbar"><i></i></div>
          <div class="d98-orb d98-life" data-orb="life"><div class="d98-fill"></div><div class="d98-gloss"></div></div>
          <div class="d98-btns d98-bl"><button data-ui="char">ХАР</button><button data-ui="quest">КВЕСТЫ</button><button data-ui="map">КАРТА</button><button data-ui="menu">МЕНЮ</button></div>
          <div class="d98-center"><div class="d98-info"></div><div class="d98-belt">${Array.from({ length: 8 }, (_, i) => `<div class="d98-slot" data-belt="${i}"><b>${i + 1}</b></div>`).join('')}</div></div>
          <div class="d98-btns d98-br"><button data-ui="inv">ИНВ</button><button data-ui="book">КНИГА</button><button class="d98-lvl" data-ui="char" hidden>ОЧКИ</button></div>
          <button class="d98-spellbtn" data-ui="spells" aria-label="Текущее заклинание"></button>
          <div class="d98-orb d98-mana" data-orb="mana"><div class="d98-fill"></div><div class="d98-gloss"></div></div>
        </div>
        <div class="d98-screen"></div>
        <img class="d98-held" alt="" hidden><div class="d98-tip" hidden></div>
      </div>`;
      const q = s => root.querySelector(s);
      this.stage = q('.d98-stage'); this.canvas = q('.d98-canvas'); this.screen = q('.d98-screen'); this.left = q('.d98-left'); this.right = q('.d98-right');
      this.dialog = q('.d98-dialog'); this.spellsel = q('.d98-spellsel'); this.info = q('.d98-info'); this.msgEl = q('.d98-msg'); this.bannerEl = q('.d98-banner'); this.barkEl = q('.d98-bark');
      this.heldEl = q('.d98-held'); this.tipEl = q('.d98-tip'); this.control = q('.d98-control');
      this.renderer = new D.Renderer(this.canvas); this.audio = new D.Audio();
      this.options = { music: 0.45, sfx: 0.8 }; try { Object.assign(this.options, JSON.parse(store.get(OPT_KEY)) || {}); } catch (_) {}
      this.audio.musicVol = this.options.music; this.audio.sfxVol = this.options.sfx;
      this.game = null; this.state = 'title'; this.panelL = null; this.panelR = null; this.automap = false; this.mouse = { x: 320, y: 200, down: false, right: false };
      this.scale = 1; this.last = 0; this.acc = 0; this.sigs = {};
      this.bind(sig);
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(root); this.resize();
      this.showTitle();
      this.frame = this.frame.bind(this); this.raf = requestAnimationFrame(this.frame);
    }
    // ------------------------------------------------------------ layout
    resize() {
      const r = this.root.getBoundingClientRect(); if (!r.width || !r.height) return;
      this.scale = Math.min(r.width / 640, r.height / 480);
      this.stage.style.transform = `translate(${(r.width - 640 * this.scale) / 2}px, ${(r.height - 480 * this.scale) / 2}px) scale(${this.scale})`;
      this.renderer.setResolution(Math.min(2, Math.ceil(this.scale * (window.devicePixelRatio || 1))));
    }
    stagePos(e) { const r = this.stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / this.scale, y: (e.clientY - r.top) / this.scale }; }
    // ------------------------------------------------------------ input
    bind(sig) {
      const root = this.root;
      root.addEventListener('contextmenu', e => e.preventDefault(), sig);
      root.addEventListener('mousemove', e => { const p = this.stagePos(e); this.mouse.x = p.x; this.mouse.y = p.y; this.heldEl.style.left = p.x + 'px'; this.heldEl.style.top = p.y + 'px'; if (!e.target.closest('.d98-panel,.d98-dialog,.d98-control,.d98-spellsel')) this.hideTip(); }, sig);
      this.canvas.addEventListener('mousedown', e => this.worldDown(e), sig);
      document.addEventListener('mouseup', e => { if (e.button === 0) { this.mouse.down = false; const o = this.game && this.game.hero.order; if (o && o.hold) o.hold = false; } if (e.button === 2) this.mouse.right = false; }, sig);
      root.addEventListener('click', e => {
        const b = e.target.closest('[data-ui]'); if (b) { this.audio.play('click'); this.uiAction(b.dataset.ui); return; }
        const a = e.target.closest('[data-act]'); if (a) { this.audio.play('click'); this.act(a.dataset.act, a.dataset); }
      }, sig);
      root.addEventListener('mousedown', e => { this.audio.ensure(); if (!e.target.closest('input')) root.focus({ preventScroll: true }); }, sig);
      root.addEventListener('keydown', e => this.key(e, true), sig);
      root.addEventListener('keyup', e => this.key(e, false), sig);
      root.addEventListener('mousedown', e => this.panelDown(e), Object.assign({ capture: false }, sig));
      root.addEventListener('mouseover', e => this.panelHover(e), sig);
      root.addEventListener('mouseleave', () => { this.mouse.down = false; this.mouse.right = false; }, sig);
      root.addEventListener('focusout', e => { if (!root.contains(e.relatedTarget)) { this.mouse.down = false; this.labelsHeld = false; } }, sig);
      window.addEventListener('blur', () => { this.mouse.down = false; this.labelsHeld = false; }, sig);
    }
    playing() { return this.state === 'play' && this.game && !this.game.hero.dead; }
    worldDown(e) {
      if (!this.playing() || this.dialogOpen() || this.screenOpen()) return;
      const g = this.game, h = g.hero, p = this.stagePos(e); if (p.y > D.VIEW_H) return;
      e.preventDefault();
      const pick = this.renderer.pick(g, p.x, p.y);
      if (e.button === 2) {
        if (h.mode) { h.mode = null; this.flash('Отменено'); return; }
        if (h.cursor) return;
        this.mouse.right = true; this.castAt(pick); return;
      }
      if (e.button !== 0) return;
      this.mouse.down = true; this.downPick = pick; this.repeatT = 0.25;
      if (h.cursor) { if (!g.dropCursor()) this.flash('Здесь нельзя положить.'); this.mouse.down = false; return; }
      if (h.mode) {
        if (h.mode === 'disarm' && pick.o) { g.cmdInteract(pick.o); this.mouse.down = false; return; }
        if (h.mode !== 'disarm') { this.flash('Выберите предмет в инвентаре'); this.openRight('inv'); this.mouse.down = false; return; }
        h.mode = null;
      }
      if (e.shiftKey && g.level.index > 0) { this.shiftAttack(p); this.mouse.shift = true; return; }
      this.mouse.shift = false;
      this.issue(pick);
    }
    issue(pick) {
      const g = this.game;
      if (pick.m) { g.cmdAttack(pick.m); if (g.hero.order) g.hero.order.hold = true; }
      else if (pick.n) g.cmdTalk(pick.n);
      else if (pick.o) g.cmdInteract(pick.o);
      else if (pick.f) g.cmdPickup(pick.f);
      else if (pick.stairs) g.cmdStairs(pick.stairs.x, pick.stairs.y);
      else if (pick.tile) g.cmdMove(pick.tile.x, pick.tile.y);
    }
    shiftAttack(p) { const t = this.renderer.toTile(p.x, p.y + 8); this.game.cmdAttackAt(t.x, t.y); }
    castAt(pick) {
      const g = this.game; const t = pick.m ? { x: pick.m.tx, y: pick.m.ty } : pick.tile || pick.stairs || (pick.o ? { x: pick.o.x, y: pick.o.y } : pick.f ? { x: pick.f.x, y: pick.f.y } : null) || this.renderer.toTile(this.mouse.x, this.mouse.y + 8);
      if (g.heroBusy()) return;
      g.cmdCast(t.x, t.y, pick.m || null);
      if (g.hero.mode && g.hero.mode !== 'disarm') this.openRight('inv');
    }
    key(e, down) {
      if (e.target.matches('input')) { if (down && e.key === 'Enter') this.act('create', {}); return; }
      if (e.key === 'Alt') { e.preventDefault(); this.labelsHeld = down; return; }
      if (!down) return;
      if (['Tab', 'F5', 'F6', 'F7', 'F8', 'F1', ' '].includes(e.key) || e.key.startsWith('Arrow')) e.preventDefault();
      if (this.state !== 'play' || !this.game) { if (e.key === 'Escape' && this.screenBack) this.screenBack(); return; }
      if (this.screenOpen()) { if (e.key === 'Escape') this.closeScreen(); return; }
      const g = this.game, h = g.hero, k = e.key.toLowerCase();
      if (e.key === 'Escape') {
        if (h.mode) { h.mode = null; return; }
        if (!this.spellsel.hidden) { this.spellsel.hidden = true; return; }
        if (this.dialogOpen()) { this.closeDialog(); return; }
        if (this.panelL || this.panelR) { this.closePanels(); return; }
        this.showGameMenu(); return;
      }
      if (h.dead) return;
      if (/^[1-8]$/.test(e.key)) { g.useBelt(+e.key - 1); return; }
      if (/^F[5-8]$/.test(e.key)) {
        const i = +e.key[1] - 5;
        if (!this.spellsel.hidden && this.hoverSpell) { h.hot[i] = { id: this.hoverSpell.id, src: this.hoverSpell.src }; this.flash(`${e.key}: ${this.hoverSpell.name}`); this.renderSpellSel(); }
        else if (h.hot[i]) g.setSpell(h.hot[i].id, h.hot[i].src);
        return;
      }
      if (this.dialogOpen()) return;
      switch (k) {
        case 'i': case 'ш': this.toggleRight('inv'); break;
        case 'b': case 'и': this.toggleRight('book'); break;
        case 'c': case 'с': this.toggleLeft('char'); break;
        case 'q': case 'й': this.toggleLeft('quest'); break;
        case 's': case 'ы': this.toggleSpellSel(); break;
        case 'z': case 'я': this.labelsToggle = !this.labelsToggle; break;
        case 'tab': this.automap = !this.automap; break;
        case ' ': this.closePanels(); this.spellsel.hidden = true; break;
        case 'f1': this.showHelp(); break;
      }
    }
    // panels: inventory/belt clicks
    panelDown(e) {
      if (!this.playing()) return;
      const g = this.game, h = g.hero;
      const slot = e.target.closest('[data-slot]'), cell = e.target.closest('.d98-grid'), belt = e.target.closest('[data-belt]'), stat = e.target.closest('[data-stat]'), spell = e.target.closest('[data-spell]');
      if (spell && e.button === 0) { g.setSpell(spell.dataset.spell, spell.dataset.src); this.spellsel.hidden = true; this.audio.play('click'); return; }
      if (stat) { g.spendPoint(stat.dataset.stat); this.audio.play('click'); return; }
      if (belt) {
        const i = +belt.dataset.belt;
        if (e.button === 2) { g.useBelt(i); return; }
        if (e.button === 0) { if (h.mode && h.belt[i]) { g.applyMode(h.belt[i]); return; } g.beltClick(i); }
        return;
      }
      if (slot) {
        const s = slot.dataset.slot;
        if (e.button === 2) { return; }
        if (h.mode && h.equip[s]) { g.applyMode(h.equip[s]); return; }
        g.equipClick(s); this.hideTip(); return;
      }
      if (cell) {
        const p = this.stagePos(e), cx = Math.floor((p.x - 320 - GRID_X) / CELL), cy = Math.floor((p.y - GRID_Y) / CELL);
        const entry = g.invAt(cx, cy);
        if (e.button === 2) { if (entry && !h.cursor) { g.useItem(entry.item); this.hideTip(); } return; }
        if (e.button !== 0) return;
        if (h.mode) { if (entry) g.applyMode(entry.item); return; }
        g.invClick(cx, cy); this.hideTip();
      }
    }
    panelHover(e) {
      if (!this.game) return;
      const g = this.game, h = g.hero, t = e.target;
      const slot = t.closest('[data-slot]'), belt = t.closest('[data-belt]'), inv = t.closest('[data-inv]'), shop = t.closest('[data-shopidx]'), orb = t.closest('[data-orb]'), sp = t.closest('[data-spell]'), btn = t.closest('.d98-spellbtn');
      let item = null;
      if (slot) item = h.equip[slot.dataset.slot];
      if (belt) item = h.belt[+belt.dataset.belt];
      if (inv) { const e2 = h.inv.find(x => x.item.uid === +inv.dataset.inv); item = e2 && e2.item; }
      if (shop) item = this.shopList && this.shopList[+shop.dataset.shopidx];
      this.hoverSpell = null;
      if (item) { this.showTip(item, shop ? shop.dataset.price : null); return; }
      if (orb) { const s = h.stats; this.info.innerHTML = orb.dataset.orb === 'life' ? `Здоровье: ${Math.ceil(h.life)} из ${s.maxLife}` : `Мана: ${Math.floor(h.mana)} из ${s.maxMana}`; this.infoLock = 1.5; }
      if (sp) { const s = g.availableSpells().find(x => x.id === sp.dataset.spell && x.src === sp.dataset.src); this.hoverSpell = s; if (s) { this.info.innerHTML = this.spellText(s); this.infoLock = 1.5; } }
      if (btn) { const s = g.availableSpells().find(x => x.id === h.cur.id && x.src === h.cur.src); if (s) { this.info.innerHTML = this.spellText(s) + '<br><small>S — выбор заклинания, ПКМ — применить</small>'; this.infoLock = 1.5; } }
      this.hideTip();
    }
    spellText(s) {
      if (s.src === 'skill') return `<b>${esc(s.name)}</b> — умение<br><small>${esc(SKILLS[s.id].desc)}</small>`;
      const g = this.game, sp = SPELLS[s.id];
      if (s.src === 'spell') { const d = g.spellDamage(s.id, g.spellLevel(s.id)); return `<b>${esc(sp.name)}</b>, уровень ${s.level}<br>Мана: ${s.mana}${d[1] ? ` · Урон: ${d[0]}-${d[1]}` : ''}`; }
      if (s.src === 'scroll') return `<b>${esc(sp.name)}</b> (свиток)<br>Осталось свитков: ${s.count}`;
      return `<b>${esc(sp.name)}</b> (посох)<br>Зарядов: ${s.count}`;
    }
    showTip(item, price) {
      const h = this.game.hero, lines = D.describeItem(item, h);
      let html = `<div class="d98-tipname" style="color:${D.itemColor(item, h)}">${esc(D.itemName(item))}</div>` + lines.map(l => `<div${l.color ? ` style="color:${l.color}"` : ''}>${esc(l.text)}</div>`).join('');
      if (price) html += `<div class="d98-price">Цена: ${price}</div>`;
      this.tipEl.innerHTML = html; this.tipEl.hidden = false;
      const w = this.tipEl.offsetWidth, hh = this.tipEl.offsetHeight;
      let x = this.mouse.x + 16, y = this.mouse.y - hh - 8;
      if (x + w > 636) x = this.mouse.x - w - 16; if (y < 4) y = this.mouse.y + 20; if (y + hh > 476) y = 476 - hh;
      this.tipEl.style.left = Math.max(4, x) + 'px'; this.tipEl.style.top = y + 'px';
    }
    hideTip() { this.tipEl.hidden = true; }
    // ------------------------------------------------------------ actions
    uiAction(a) {
      if (!this.game || this.state !== 'play') return;
      if (a === 'char') this.toggleLeft('char'); if (a === 'quest') this.toggleLeft('quest'); if (a === 'inv') this.toggleRight('inv'); if (a === 'book') this.toggleRight('book');
      if (a === 'map') this.automap = !this.automap; if (a === 'menu') this.showGameMenu(); if (a === 'spells') this.toggleSpellSel();
    }
    toggleLeft(p) { this.panelL = this.panelL === p ? null : p; this.sigs.left = null; }
    toggleRight(p) { this.panelR = this.panelR === p ? null : p; this.sigs.right = null; }
    openRight(p) { this.panelR = p; this.sigs.right = null; }
    closePanels() { this.panelL = this.panelR = null; this.hideTip(); }
    toggleSpellSel() { this.spellsel.hidden = !this.spellsel.hidden; if (!this.spellsel.hidden) this.renderSpellSel(); }
    dialogOpen() { return !this.dialog.hidden; }
    screenOpen() { return this.screen.classList.contains('on'); }
    flash(text, ms = 3500) {
      const d = document.createElement('div'); d.textContent = text; this.msgEl.appendChild(d);
      while (this.msgEl.children.length > 3) this.msgEl.firstChild.remove();
      setTimeout(() => d.remove(), ms);
    }
    act(a, ds) {
      const g = this.game;
      switch (a) {
        case 'new': this.showClassSelect(); break;
        case 'continue': this.continueGame(); break;
        case 'help': this.showHelp(); break;
        case 'exit': if (this.opts.onExit) this.opts.onExit(); break;
        case 'title': this.saveGame(true); this.showTitle(); break;
        case 'pickclass': this.pickedClass = ds.cls; this.root.querySelectorAll('.d98-classcard').forEach(c => c.classList.toggle('sel', c.dataset.cls === ds.cls)); { const n = this.root.querySelector('.d98-name'); if (n && (!n.value || n.dataset.auto)) { n.value = { warrior: 'Айдан', rogue: 'Кашья', sorcerer: 'Джазрет' }[ds.cls]; n.dataset.auto = '1'; } } break;
        case 'create': {
          const n = this.root.querySelector('.d98-name'); if (!n) return;
          const name = n.value.trim() || 'Герой';
          this.game = new D.Game({ cls: this.pickedClass || 'warrior', name });
          this.showIntro(); break;
        }
        case 'play': this.startPlay(); break;
        case 'resume': this.closeScreen(); break;
        case 'save': this.saveGame(false); this.closeScreen(); break;
        case 'load': { const lg = this.loadGame(); if (lg) { this.game = lg; this.startPlay(); this.flash('Игра загружена'); } else this.flash('Сохранение не найдено'); break; }
        case 'options': this.showOptions(); break;
        case 'respawn': g.respawn(); this.startPlay(); break;
        case 'travel': this.closeScreen(); g.travel(+ds.level); break;
        case 'keepplaying': this.startPlay(); g.enterLevel(0, 'start'); break;
        case 'npc': this.npcAction(ds.op); break;
        case 'buy': this.buyItem(+ds.idx); break;
        case 'sellitem': { const it = this.findItem(+ds.uid); if (it) { const p = g.sell(this.dlg.npc, it); if (p) this.flash(`Продано за ${p} золота`); } this.renderDialog(); break; }
        case 'repairitem': { const it = this.findItem(+ds.uid); if (it) g.repair(it); this.renderDialog(); break; }
        case 'identifyitem': { const it = this.findItem(+ds.uid); if (it && g.identify(it)) this.dlg.text = `Это ${D.itemName(it)}.`; this.dlg.view = 'main'; this.renderDialog(); break; }
        case 'rechargeitem': { const it = this.findItem(+ds.uid); if (it) g.recharge(it); this.renderDialog(); break; }
        case 'closedlg': this.closeDialog(); break;
        case 'back': this.dlg.view = 'main'; this.dlg.text = null; this.renderDialog(); break;
        case 'wipe': store.del(SAVE_KEY); this.showTitle(); break;
      }
    }
    findItem(uid) { return this.game.allItems().find(i => i.uid === uid); }
    // ------------------------------------------------------------ screens
    openScreen(html, cls = '') { this.screen.className = 'd98-screen on ' + cls; this.screen.innerHTML = html; this.screenBack = null; this.hideTip(); }
    closeScreen() { this.screen.className = 'd98-screen'; this.screen.innerHTML = ''; this.screenBack = null; }
    logo() { return `<div class="d98-logo"><span>DIABLO</span><small>98</small></div>`; }
    savedInfo() { try { const d = JSON.parse(store.get(SAVE_KEY)); if (d && d.hero) return d.hero; } catch (_) {} return null; }
    showTitle() {
      this.state = 'title'; this.game = null; this.closePanels(); this.closeDialog(); this.spellsel.hidden = true; this.control.hidden = true;
      const s = this.savedInfo();
      this.openScreen(`${this.logo()}<div class="d98-menu">
        ${s ? `<button data-act="continue">Продолжить<small>${esc(s.name)} — ${CLASSES[s.cls] ? CLASSES[s.cls].name : ''}, ур. ${s.level}</small></button>` : ''}
        <button data-act="new">Новая игра</button><button data-act="help">Управление</button>${this.opts.onExit ? '<button data-act="exit">Выход</button>' : ''}</div>
        <div class="d98-copy">Фан-клон в духе Blizzard North, 1996 · Вся графика и звук синтезированы</div>`, 'title');
      this.audio.setMusic('menu');
    }
    showClassSelect() {
      this.pickedClass = 'warrior';
      const s = this.savedInfo();
      this.openScreen(`<h2>Выберите класс героя</h2><div class="d98-classes">${Object.values(CLASSES).map(c => `
        <div class="d98-classcard${c.id === 'warrior' ? ' sel' : ''}" data-act="pickclass" data-cls="${c.id}"><canvas data-portrait="${c.id}" width="96" height="120"></canvas><h3>${c.name}</h3>
        <p>${esc(c.desc)}</p><table><tr><td>Сила</td><td>${c.base.str}</td></tr><tr><td>Магия</td><td>${c.base.mag}</td></tr><tr><td>Ловкость</td><td>${c.base.dex}</td></tr><tr><td>Живучесть</td><td>${c.base.vit}</td></tr></table></div>`).join('')}</div>
        <label class="d98-namebox">Имя героя: <input class="d98-name" maxlength="15" value="Айдан" data-auto="1" aria-label="Имя героя"></label>
        ${s ? '<p class="d98-warn">Внимание: текущее сохранение будет заменено при следующей записи.</p>' : ''}
        <div class="d98-menu row"><button data-act="create">Начать</button><button data-act="title">Назад</button></div>`, 'classes');
      this.screenBack = () => this.showTitle();
      for (const cv of this.screen.querySelectorAll('[data-portrait]')) this.drawPortrait(cv, cv.dataset.portrait);
    }
    drawPortrait(cv, cls) {
      const c = cv.getContext('2d'), g = new D.Game({ restore: true, seed: 1 });
      g.hero = { cls, equip: { weapon: { base: cls === 'warrior' ? 'shortsword' : cls === 'rogue' ? 'shortbow' : 'shortstaff', quality: 'normal' }, shield: cls === 'warrior' ? { base: 'buckler', quality: 'normal' } : null, head: null, body: null }, dirX: 1, dirY: 0 };
      const bg = c.createRadialGradient(48, 70, 5, 48, 70, 70); bg.addColorStop(0, '#3a1a10'); bg.addColorStop(1, '#000'); c.fillStyle = bg; c.fillRect(0, 0, 96, 120);
      const r = this.renderer, look = r.heroLook(g);
      r.humanoid(c, { x: 48, y: 108 }, Object.assign(look, { facing: 1, st: { walk: -1, attack: -1, cast: -1, hit: 0 }, scale: 1.7 }));
    }
    showIntro() {
      this.openScreen(`<div class="d98-story"><h2>Тристрам</h2>
        <p>Некогда тихий городок Тристрам охвачен ужасом. Безумный король Леорик мёртв, его сын Альбрехт исчез, а под старым собором пробудилось нечто древнее.</p>
        <p>Горожане шепчутся о демонах, что выползают из катакомб по ночам. Смельчаки, спустившиеся вниз, не вернулись.</p>
        <p>Ты, <b>${esc(this.game.hero.name)}</b>, пришёл в Тристрам, чтобы положить этому конец. Шестнадцать уровней тьмы отделяют тебя от Повелителя Ужаса — Диабло.</p>
        <p class="d98-hint">Поговорите с жителями, загляните к Грисвольду и Пепину, а затем войдите в собор на севере города.</p>
        <div class="d98-menu row"><button data-act="play">В путь</button></div></div>`, 'story');
      this.audio.setMusic('menu');
    }
    showHelp() {
      const back = this.state === 'play' ? 'resume' : 'title';
      this.openScreen(`<h2>Управление</h2><div class="d98-help">
        <div><b>ЛКМ</b> — идти, атаковать, говорить, подобрать, открыть</div><div><b>Удержание ЛКМ</b> — продолжать движение / атаку</div>
        <div><b>Shift + ЛКМ</b> — атака на месте</div><div><b>ПКМ</b> — применить текущее заклинание или умение</div>
        <div><b>I / C / B / Q</b> — инвентарь, персонаж, книга заклинаний, задания</div><div><b>S</b> — выбор заклинания, <b>F5–F8</b> — горячие клавиши (наведите на заклинание в меню S)</div>
        <div><b>1–8</b> — пояс (зелья и свитки)</div><div><b>Tab</b> — карта, <b>Alt</b> (удерживать) или <b>Z</b> — названия предметов на полу</div>
        <div><b>Пробел</b> — закрыть панели, <b>Esc</b> — меню игры</div><div><b>Инвентарь:</b> ЛКМ — взять/положить/надеть, ПКМ — использовать или надеть</div>
        <div>Жёлтая аура у врага — уникальный монстр. Красная рамка у сундука видна только Разбойнице: это ловушка.</div>
        <div>Городской портал возвращает в Тристрам и обратно. Игра сохраняется при переходе между уровнями.</div></div>
        <div class="d98-menu row"><button data-act="${back}">Назад</button></div>`, 'help');
      this.screenBack = () => back === 'title' ? this.showTitle() : this.closeScreen();
    }
    showGameMenu() {
      this.openScreen(`${this.logo()}<div class="d98-menu"><button data-act="resume">Вернуться в игру</button><button data-act="save">Сохранить игру</button><button data-act="load">Загрузить игру</button>
        <button data-act="options">Настройки звука</button><button data-act="help">Управление</button><button data-act="title">Выйти в главное меню</button></div>`, 'gamemenu');
      this.screenBack = () => this.closeScreen();
    }
    showOptions() {
      this.openScreen(`<h2>Настройки звука</h2><div class="d98-opts">
        <label>Музыка <input type="range" min="0" max="100" value="${Math.round(this.options.music * 100)}" data-opt="music"></label>
        <label>Эффекты <input type="range" min="0" max="100" value="${Math.round(this.options.sfx * 100)}" data-opt="sfx"></label>
        <p>Общая громкость и отключение звука — регулятором в трее Win 98.</p></div><div class="d98-menu row"><button data-act="${this.state === 'play' ? 'resume' : 'title'}">Готово</button></div>`, 'options');
      this.screen.querySelectorAll('[data-opt]').forEach(inp => inp.addEventListener('input', () => {
        this.options[inp.dataset.opt] = inp.value / 100; this.audio.musicVol = this.options.music; this.audio.sfxVol = this.options.sfx; this.audio.applyVolume(); store.set(OPT_KEY, JSON.stringify(this.options));
        if (inp.dataset.opt === 'sfx') this.audio.play('gold');
      }));
      this.screenBack = () => this.closeScreen();
    }
    showDeath() {
      const g = this.game;
      this.openScreen(`<div class="d98-dead">Вы погибли</div><p class="d98-sub">${esc(g.hero.name)} пал на ${g.level.index ? `${g.level.index}-м уровне подземелья` : 'улицах Тристрама'}.</p>
        <div class="d98-menu"><button data-act="respawn">Очнуться в Тристраме<small>теряется половина золота</small></button>${this.savedInfo() ? '<button data-act="load">Загрузить сохранение</button>' : ''}<button data-act="title">Главное меню</button></div>`, 'death');
    }
    showVictory() {
      const g = this.game, h = g.hero;
      const ending = { warrior: 'Воин поднимает камень души и, стиснув зубы, вонзает его себе в лоб. Тьма бьётся внутри, но он удержит её... пока хватит сил.', rogue: 'Разбойница сжимает камень души. Она знает: заключённое в нём зло нельзя оставить без присмотра. Её путь лежит на восток.', sorcerer: 'Чародей чувствует, как сила Диабло взывает к нему из камня. Он заключает её в себе, надеясь, что его воли хватит, чтобы сдерживать Повелителя Ужаса.' }[h.cls];
      this.openScreen(`${this.logo()}<div class="d98-story"><h2>Диабло повержен</h2><p>Тело Повелителя Ужаса рассыпается, и из пепла проступает облик принца Альбрехта. Слишком поздно — мальчик мёртв.</p><p>${ending}</p>
        <p class="d98-hint">${esc(h.name)} · ${CLASSES[h.cls].name}, уровень ${h.level} · Убито монстров: ${h.kills} · Время: ${Math.floor(g.time / 60)} мин</p>
        <div class="d98-menu row"><button data-act="keepplaying">Продолжить игру</button><button data-act="title">Главное меню</button></div></div>`, 'victory');
      this.audio.setMusic('town'); this.saveGame(true);
    }
    showStairsMenu(levels) {
      this.openScreen(`<h2>Куда спуститься?</h2><div class="d98-menu">${levels.map(n => `<button data-act="travel" data-level="${n}">${n === 1 ? 'Собор' : n === 5 ? 'Катакомбы' : n === 9 ? 'Пещеры' : 'Ад'} — уровень ${n}</button>`).join('')}<button data-act="resume">Остаться в городе</button></div>`, 'stairs');
      this.screenBack = () => this.closeScreen();
    }
    startPlay() {
      this.closeScreen(); this.state = 'play'; this.control.hidden = false; this.sigs = {};
      this.onLevel(this.game.level.index);
      for (const e of this.game.drainEvents()) if (e.t === 'msg') this.flash(e.text);
      this.root.focus({ preventScroll: true });
    }
    continueGame() { const g = this.loadGame(); if (!g) { this.flash('Не удалось загрузить сохранение'); this.showTitle(); return; } this.game = g; this.startPlay(); }
    saveGame(quiet) {
      const g = this.game; if (!g || g.hero.dead) return false;
      const ok = store.set(SAVE_KEY, JSON.stringify(g.serialize()));
      if (!quiet) this.flash(ok ? 'Игра сохранена' : 'Не удалось сохранить игру');
      return ok;
    }
    loadGame() { try { const d = JSON.parse(store.get(SAVE_KEY)); return d ? D.Game.load(d) : null; } catch (e) { console.warn('Diablo 98: load failed', e); return null; } }
    onLevel(n) {
      const L = this.game.level;
      this.audio.setMusic(n === 0 ? 'town' : L.theme.id === 'hell' ? 'hell' : L.theme.id === 'caves' ? 'caves' : 'dungeon');
      this.bannerEl.textContent = n === 0 ? 'Тристрам' : `${L.theme.name} · уровень ${n}`; this.bannerEl.classList.remove('show'); void this.bannerEl.offsetWidth; this.bannerEl.classList.add('show');
    }
    // ------------------------------------------------------------ NPC dialogs & stores
    openNPC(id) {
      const g = this.game; this.closePanels(); this.spellsel.hidden = true;
      if (id === 'townsman') { this.dlg = { npc: id, view: 'main', text: g.talk(id) }; this.renderDialog(); return; }
      if (id === 'pepin') g.healAtPepin();
      const greet = { griswold: 'Ну, чего тебе? А, это ты! Заходи, посмотри товар.', pepin: 'Позволь осмотреть твои раны... Вот так, гораздо лучше. Чем ещё могу помочь?', adria: 'Я ждала тебя. Что ищешь — знание или силу?', cain: 'Приветствую, друг мой. Чем старый Каин может помочь?', ogden: 'Добро пожаловать в «Восходящее солнце»!', gillian: 'Здравствуй. Хорошо, что ты вернулся живым.', farnham: 'Ик... А, это ты... Садись, выпьем...', wirt: 'Пс-с. Эй. Подойди-ка сюда.' }[id];
      this.dlg = { npc: id, view: 'main', text: greet }; this.renderDialog();
    }
    npcOptions(id) {
      const g = this.game, o = [['talk', 'Поговорить']];
      if (id === 'griswold') { o.push(['buy', 'Купить товары'], ['premium', 'Особые товары'], ['sell', 'Продать'], ['repair', 'Ремонт']); if (g.hasItem(i => i.base === 'magicrock') && g.quests.magicrock < 2) o.push(['giverock', 'Отдать Магический камень']); if (g.hasItem(i => i.base === 'anvil') && g.quests.anvil < 2) o.push(['giveanvil', 'Отдать Наковальню Ярости']); }
      if (id === 'pepin') o.push(['heal', 'Лечение'], ['buy', 'Купить']);
      if (id === 'adria') o.push(['buy', 'Купить'], ['sell', 'Продать'], ['recharge', 'Перезарядить посох']);
      if (id === 'cain') o.push(['identify', 'Опознать предмет (100 з.)']);
      if (id === 'wirt') o.push(['wirt', g.shops.wirtSeen ? 'Посмотреть товар' : 'Посмотреть товар (50 з.)']);
      o.push(['leave', 'Уйти']);
      return o;
    }
    npcAction(op) {
      const g = this.game, d = this.dlg;
      if (op === 'leave') { this.closeDialog(); return; }
      if (op === 'talk') { d.text = g.talk(d.npc); d.view = 'main'; }
      else if (op === 'heal') { g.healAtPepin(); d.text = 'Ты полностью здоров. Будь осторожен.'; }
      else if (op === 'giverock') { g.giveQuestItem('magicrock'); d.text = 'Вот это да! Держи — Небесная Лента. Носи с гордостью.'; }
      else if (op === 'giveanvil') { g.giveQuestItem('anvil'); d.text = 'Клинок, выкованный на Наковальне Ярости! Пусть он разит демонов без пощады.'; }
      else if (op === 'wirt') { if (g.peekWirt()) d.view = 'wirt'; }
      else d.view = op;
      this.renderDialog();
    }
    closeDialog() { this.dialog.hidden = true; this.dlg = null; this.shopList = null; this.hideTip(); }
    buyItem(idx) {
      const g = this.game, d = this.dlg, shop = d.view === 'buy' ? (d.npc === 'griswold' ? 'griswold' : d.npc) : d.view === 'premium' ? 'premium' : 'wirt';
      if (g.buy(shop, idx)) this.flash('Куплено'); this.renderDialog();
    }
    renderDialog() {
      const g = this.game, d = this.dlg; if (!d) return;
      const npcData = D.DATA.NPCS.find(n => n.id === d.npc), h = g.hero;
      const title = `${esc(npcData.name)}${npcData.title ? ` <small>${esc(npcData.title)}</small>` : ''}`;
      let body = '';
      const row = (item, price, act, extra = '') => `<div class="d98-shoprow${price > h.gold ? ' poor' : ''}" data-act="${act}" ${extra}><img src="${iconURL(item)}" alt=""><span style="color:${D.itemColor(item, h)}">${esc(D.itemName(item))}</span><em>${price}</em></div>`;
      this.shopList = null;
      if (d.view === 'main') {
        body = `<p class="d98-talk">${esc(d.text || '')}</p>` + (d.npc === 'townsman' ? '<div class="d98-opts2"><div data-act="closedlg">Уйти</div></div>' : `<div class="d98-opts2">${this.npcOptions(d.npc).map(([op, l]) => `<div data-act="npc" data-op="${op}">${esc(l)}</div>`).join('')}</div>`);
      } else if (d.view === 'buy' || d.view === 'premium' || d.view === 'wirt') {
        const list = d.view === 'wirt' ? (g.shops.wirt ? [g.shops.wirt] : []) : d.view === 'premium' ? g.shops.premium : d.npc === 'griswold' ? g.shops.griswold : g.shops[d.npc];
        const shop = d.view === 'wirt' ? 'wirt' : 'x';
        this.shopList = list;
        body = `<p class="d98-talk small">${d.view === 'wirt' ? 'Вот что у меня есть. Цена — не обсуждается.' : 'Выбери товар, чтобы купить.'} Золото: <b>${h.gold}</b></p><div class="d98-shoplist">${list.length ? list.map((it, i) => row(it, g.buyPrice(it, shop), 'buy', `data-idx="${i}" data-shopidx="${i}" data-price="${g.buyPrice(it, shop)}"`)).join('') : '<p>Товара нет.</p>'}</div>`;
      } else {
        const all = d.view === 'sell' ? [...h.inv.map(e => e.item), ...h.belt.filter(Boolean)].filter(it => g.shopBuys(d.npc, it))
          : d.view === 'repair' ? g.allItems().filter(it => g.repairCost(it) > 0)
          : d.view === 'identify' ? g.allItems().filter(it => !it.identified)
          : g.allItems().filter(it => g.rechargeCost(it) > 0);
        const price = it => d.view === 'sell' ? g.sellPrice(it) : d.view === 'repair' ? g.repairCost(it) : d.view === 'identify' ? 100 : g.rechargeCost(it);
        const act = { sell: 'sellitem', repair: 'repairitem', identify: 'identifyitem', recharge: 'rechargeitem' }[d.view];
        this.shopList = all;
        const head = { sell: 'Что продаёшь?', repair: 'Что починить?', identify: 'Что опознать?', recharge: 'Какой посох перезарядить?' }[d.view];
        body = `<p class="d98-talk small">${head} Золото: <b>${h.gold}</b></p><div class="d98-shoplist">${all.length ? all.map((it, i) => row(it, d.view === 'sell' ? 0 : price(it), act, `data-uid="${it.uid}" data-shopidx="${i}" data-price="${price(it)}"`).replace('<em>0</em>', `<em class="sell">+${price(it)}</em>`)).join('') : '<p>Нет подходящих предметов.</p>'}</div>`;
      }
      if (d.view !== 'main') body += '<div class="d98-opts2"><div data-act="back">Назад</div></div>';
      this.dialog.innerHTML = `<div class="d98-dlgtitle">${title}</div>${body}`; this.dialog.hidden = false;
    }
    // ------------------------------------------------------------ panels render
    renderPanels() {
      const g = this.game, h = g.hero;
      const sigL = this.panelL ? `${this.panelL}|${h.level}|${h.xp}|${h.points}|${h.gold}|${JSON.stringify(h.base)}|${h.stats.maxLife}|${h.stats.ac}|${h.stats.dmgMin}-${h.stats.dmgMax}|${Math.ceil(h.life)}|${Math.floor(h.mana)}|${JSON.stringify(g.quests)}` : '';
      if (sigL !== this.sigs.left) { this.sigs.left = sigL; this.left.hidden = !this.panelL; if (this.panelL === 'char') this.left.innerHTML = this.charHTML(); if (this.panelL === 'quest') this.left.innerHTML = this.questHTML(); }
      const eqSig = Object.entries(h.equip).map(([k, v]) => k + (v ? v.uid + ':' + v.dur + v.identified : '')).join();
      const sigR = this.panelR ? `${this.panelR}|${h.inv.map(e => e.item.uid + ':' + e.x + ',' + e.y + (e.item.identified ? 'i' : '') + (e.item.dur || '')).join()}|${eqSig}|${h.gold}|${JSON.stringify(h.spells)}|${h.cur.id}|${h.stats.str},${h.stats.dex},${h.stats.mag}` : '';
      if (sigR !== this.sigs.right) { this.sigs.right = sigR; this.right.hidden = !this.panelR; if (this.panelR === 'inv') this.right.innerHTML = this.invHTML(); if (this.panelR === 'book') this.right.innerHTML = this.bookHTML(); }
    }
    charHTML() {
      const g = this.game, h = g.hero, s = h.stats, c = CLASSES[h.cls], XP = D.DATA.XP;
      const stat = (k, name) => `<div class="d98-stat"><span>${name}</span><b>${h.base[k]}</b><b class="${s[k] > h.base[k] ? 'up' : s[k] < h.base[k] ? 'down' : ''}">${s[k]}</b>${h.points && h.base[k] < c.max[k] ? `<button data-stat="${k}" aria-label="Повысить">+</button>` : '<i></i>'}</div>`;
      return `<h3>${esc(h.name)}</h3><div class="d98-cgrid"><div><small>Класс</small>${c.name}</div><div><small>Уровень</small>${h.level}</div><div><small>Опыт</small>${h.xp}</div><div><small>Следующий</small>${h.level < 50 ? XP[h.level] : '—'}</div></div>
        <div class="d98-stats"><div class="d98-stat hd"><span></span><b>база</b><b>итог</b><i></i></div>${stat('str', 'Сила')}${stat('mag', 'Магия')}${stat('dex', 'Ловкость')}${stat('vit', 'Живучесть')}
        ${h.points ? `<div class="d98-points">Свободные очки: ${h.points}</div>` : ''}</div>
        <div class="d98-cgrid two"><div><small>Золото</small>${h.gold}</div><div><small>Защита</small>${s.ac}</div><div><small>Точность</small>${s.toHit}%</div><div><small>Урон</small>${s.dmgMin}-${s.dmgMax}</div>
        <div><small>Здоровье</small>${Math.ceil(h.life)}/${s.maxLife}</div><div><small>Мана</small>${Math.floor(h.mana)}/${s.maxMana}</div>
        <div><small>Сопр. магии</small>${s.resM}%</div><div><small>Сопр. огню</small>${s.resF}%</div><div><small>Сопр. молнии</small>${s.resL}%</div><div><small>Блок</small>${s.block}%</div></div>`;
    }
    questHTML() {
      const log = this.game.questLog();
      return `<h3>Задания</h3>${log.length ? log.map(q => `<div class="d98-quest ${q.state === 2 ? 'done' : ''}"><b>${esc(q.name)}</b><p>${esc(q.text)}</p></div>`).join('') : '<p class="d98-empty">Заданий пока нет. Поговорите с жителями Тристрама.</p>'}`;
    }
    invHTML() {
      const g = this.game, h = g.hero, s = h.stats;
      let html = '<h3>Инвентарь</h3>';
      for (const [slot, [x, y, w, hh]] of Object.entries(SLOTS)) {
        const it = h.equip[slot], bad = it && !s.active.has(it.uid);
        const twoGhost = slot === 'shield' && !it && h.equip.weapon && D.baseOf(h.equip.weapon).two;
        html += `<div class="d98-eq${bad ? ' bad' : ''}${it && it.quality !== 'normal' ? ' ' + it.quality : ''}" data-slot="${slot}" style="left:${x}px;top:${y}px;width:${w * CELL}px;height:${hh * CELL}px">${it ? `<img src="${iconURL(it)}" alt="">` : twoGhost ? `<img class="ghost" src="${iconURL(h.equip.weapon)}" alt="">` : `<span>${SLOT_NAMES[slot]}</span>`}</div>`;
      }
      html += `<div class="d98-grid" style="left:${GRID_X}px;top:${GRID_Y}px;width:${10 * CELL}px;height:${4 * CELL}px">`;
      for (const e of h.inv) {
        const b = D.baseOf(e.item), bad = !D.meetsReq(h, e.item);
        html += `<div class="d98-invitem${bad ? ' bad' : ''}${e.item.quality !== 'normal' ? ' ' + e.item.quality : ''}" data-inv="${e.item.uid}" style="left:${e.x * CELL}px;top:${e.y * CELL}px;width:${b.w * CELL}px;height:${b.h * CELL}px"><img src="${iconURL(e.item)}" alt=""></div>`;
      }
      html += `</div><div class="d98-gold">Золото: ${h.gold}</div>`;
      return html;
    }
    bookHTML() {
      const g = this.game, h = g.hero, ids = Object.keys(h.spells);
      const skill = CLASSES[h.cls].skill;
      return `<h3>Книга заклинаний</h3><div class="d98-book">
        <div class="d98-bookrow${h.cur.id === skill ? ' cur' : ''}" data-spell="${skill}" data-src="skill"><img src="${spellIconURL(skill)}" alt=""><div><b>${SKILLS[skill].name}</b><small>Умение класса</small></div></div>
        ${ids.length ? ids.map(id => { const d = g.spellDamage(id, g.spellLevel(id)); return `<div class="d98-bookrow${h.cur.id === id && h.cur.src === 'spell' ? ' cur' : ''}" data-spell="${id}" data-src="spell"><img src="${spellIconURL(id)}" alt=""><div><b>${SPELLS[id].name}</b><small>Уровень ${g.spellLevel(id)} · мана ${g.manaCost(id)}${d[1] ? ` · урон ${d[0]}-${d[1]}` : ''}</small></div></div>`; }).join('') : '<p class="d98-empty">Вы пока не знаете заклинаний. Книги можно найти в подземелье или купить у Адрии.</p>'}
        </div>`;
    }
    renderSpellSel() {
      const g = this.game, h = g.hero, list = g.availableSpells();
      const hk = s => { const i = h.hot.findIndex(x => x && x.id === s.id && x.src === s.src); return i >= 0 ? `<i>F${i + 5}</i>` : ''; };
      const group = (src, title) => { const l = list.filter(s => s.src === src); return l.length ? `<div class="d98-sgroup"><small>${title}</small>${l.map(s => `<div class="d98-sicon ${src}${h.cur.id === s.id && h.cur.src === s.src ? ' cur' : ''}" data-spell="${s.id}" data-src="${s.src}"><img src="${spellIconURL(s.id)}" alt="${esc(s.name)}">${hk(s)}</div>`).join('')}</div>` : ''; };
      this.spellsel.innerHTML = group('skill', 'Умение') + group('spell', 'Заклинания') + group('scroll', 'Свитки') + group('staff', 'Посох') + '<div class="d98-shelp">Наведите и нажмите F5–F8, чтобы назначить клавишу</div>';
    }
    // ------------------------------------------------------------ HUD
    updateHUD(dt) {
      const g = this.game, h = g.hero, s = h.stats;
      const lf = this.control.querySelector('.d98-life .d98-fill'), mf = this.control.querySelector('.d98-mana .d98-fill');
      lf.style.height = (100 * Math.max(0, h.life) / s.maxLife).toFixed(1) + '%'; mf.style.height = (s.maxMana ? 100 * h.mana / s.maxMana : 0).toFixed(1) + '%';
      this.control.querySelector('.d98-mana').classList.toggle('shield', !!h.manaShield);
      const XP = D.DATA.XP, prev = XP[h.level - 1] || 0, next = XP[h.level] || prev + 1;
      this.control.querySelector('.d98-xpbar i').style.width = Math.min(100, 100 * (h.xp - prev) / (next - prev)).toFixed(1) + '%';
      this.control.querySelector('.d98-lvl').hidden = !h.points;
      const beltSig = h.belt.map(i => i ? i.uid : 0).join();
      if (beltSig !== this.sigs.belt) {
        this.sigs.belt = beltSig;
        this.control.querySelectorAll('[data-belt]').forEach((el, i) => { const it = h.belt[i]; el.innerHTML = `<b>${i + 1}</b>${it ? `<img src="${iconURL(it)}" alt="">` : ''}`; });
      }
      const curSig = h.cur.id + h.cur.src;
      if (curSig !== this.sigs.cur) { this.sigs.cur = curSig; const b = this.control.querySelector('.d98-spellbtn'); b.innerHTML = h.cur.id ? `<img src="${spellIconURL(h.cur.id)}" alt="">` : ''; b.className = 'd98-spellbtn ' + h.cur.src; }
      // held item
      if (h.cursor) { const u = iconURL(h.cursor); if (this.heldEl.getAttribute('src') !== u) this.heldEl.src = u; const b = D.baseOf(h.cursor); this.heldEl.style.width = b.w * 28 + 'px'; this.heldEl.style.height = b.h * 28 + 'px'; this.heldEl.style.marginLeft = -(b.w * 14) + 'px'; this.heldEl.style.marginTop = -(b.h * 14) + 'px'; this.heldEl.hidden = false; }
      else this.heldEl.hidden = true;
      this.root.dataset.mode = h.mode || '';
      // info line from world hover
      if (this.infoLock > 0) { this.infoLock -= dt; return; }
      const hv = this.renderer.hover; let html = '';
      const L = g.level;
      if (h.mode) html = { identify: 'Опознание: выберите предмет', repair: 'Ремонт: выберите предмет', recharge: 'Перезарядка: выберите посох', disarm: 'Обезвреживание: выберите сундук' }[h.mode] + '<br><small>ПКМ или Esc — отмена</small>';
      else if (hv && hv.m) { const m = hv.m, pct = Math.max(0, m.hp / m.maxHp * 100); html = `<span class="${m.boss || m.elite ? 'uniq' : ''}">${esc(m.name)}</span>${m.elite ? '<small> (уникальный)</small>' : ''}<div class="d98-hp"><i style="width:${pct.toFixed(0)}%"></i></div>`; }
      else if (hv && hv.n) html = `${esc(hv.n.name)}${hv.n.title ? `<br><small>${esc(hv.n.title)}</small>` : ''}`;
      else if (hv && hv.o) { const o = hv.o; html = o.type === 'shrine' ? `${SHRINE_NAMES[o.shrine]} святилище` : o.type === 'portal' ? (L.index === 0 ? `Портал на уровень ${g.portal ? g.portal.level : ''}` : 'Портал в Тристрам') : OBJ_NAMES[o.type] || ''; if (o.trap && h.cls === 'rogue') html += ' <span class="bad">(ловушка)</span>'; }
      else if (hv && hv.f) html = `<span style="color:${D.itemColor(hv.f.item, h)}">${esc(D.itemName(hv.f.item))}</span>`;
      else if (hv && hv.stairs) { const t = L.get(hv.stairs.x, hv.stairs.y); html = L.index === 0 ? 'Вход в собор' : t === D.T.UP ? (L.index === 1 ? 'Подъём в Тристрам' : `Вверх на уровень ${L.index - 1}`) : L.sealed ? 'Проход запечатан' : `Вниз на уровень ${L.index + 1}`; }
      if (html !== this.lastInfo) { this.info.innerHTML = html; this.lastInfo = html; }
    }
    // ------------------------------------------------------------ events
    handleEvents() {
      const g = this.game; if (!g) return;
      for (const e of g.drainEvents()) {
        switch (e.t) {
          case 'sfx': this.audio.play(e.id, e); break;
          case 'msg': this.flash(e.text); break;
          case 'bark': this.barkEl.innerHTML = `<b>${esc(e.name)}:</b> «${esc(e.text)}»`; this.barkEl.classList.remove('show'); void this.barkEl.offsetWidth; this.barkEl.classList.add('show'); break;
          case 'level': this.onLevel(e.n); break;
          case 'talk': this.openNPC(e.npc); break;
          case 'stairsMenu': this.showStairsMenu(e.levels); break;
          case 'death': this.state = 'dead'; setTimeout(() => { if (this.game === g && g.hero.dead) this.showDeath(); }, 1600); break;
          case 'victory': this.showVictory(); break;
          case 'autosave': this.saveGame(true); break;
          case 'levelup': this.flash(`Новый уровень: ${e.level}! Распределите очки характеристик.`); break;
          case 'quest': this.flash('Новое задание!'); this.audio.play('quest'); break;
          case 'herohit': this.stage.classList.remove('hurt'); void this.stage.offsetWidth; this.stage.classList.add('hurt'); break;
          case 'mode': if (e.mode !== 'disarm') this.openRight('inv'); this.flash(e.mode === 'disarm' ? 'Выберите сундук с ловушкой' : 'Выберите предмет'); break;
          case 'immune': this.flash('Иммунитет!', 1200); break;
        }
      }
    }
    // ------------------------------------------------------------ loop
    isPaused() {
      if (this.state !== 'play' || !this.game) return true;
      if (this.screenOpen() || this.dialogOpen()) return true;
      if (document.hidden || !this.root.getClientRects().length) return true;
      if (this.opts.isActive && !this.opts.isActive()) return true;
      return false;
    }
    frame(now) {
      if (this.destroyed) return;
      const dt = Math.min(0.1, this.last ? (now - this.last) / 1000 : 0); this.last = now;
      const g = this.game;
      if (g && (this.state === 'play' || this.state === 'dead')) {
        const paused = this.isPaused() && this.state !== 'dead';
        if (!paused) {
          this.acc += dt; let n = 0;
          while (this.acc >= 1 / 60 && n++ < 6) { g.update(1 / 60); this.acc -= 1 / 60; }
          if (n >= 6) this.acc = 0;
          this.heldInput(dt);
        }
        this.handleEvents();
        if (this.state === 'play' || this.state === 'dead') {
          const over = this.mouse.y < D.VIEW_H && !this.screenOpen() && !this.dialogOpen();
          this.renderer.hover = over && !paused ? this.renderer.pick(g, this.mouse.x, this.mouse.y) : null;
          this.renderer.showLabels = this.labelsHeld || this.labelsToggle;
          this.renderer.render(g, paused ? 0 : dt, { automap: this.automap });
          if (this.state === 'play') { this.updateHUD(dt); this.renderPanels(); }
        }
      } else this.drawBackdrop(dt);
      this.raf = requestAnimationFrame(this.frame);
    }
    heldInput(dt) {
      const g = this.game, h = g.hero; if (h.dead) return;
      if (this.mouse.right && !g.heroBusy() && !h.mode && this.mouse.y < D.VIEW_H) this.castAt(this.renderer.pick(g, this.mouse.x, this.mouse.y));
      if (!this.mouse.down || h.cursor || this.mouse.y >= D.VIEW_H) return;
      if (this.mouse.shift) { if (!g.heroBusy()) this.shiftAttack(this.mouse); return; }
      this.repeatT -= dt; if (this.repeatT > 0) return; this.repeatT = 0.18;
      const d = this.downPick;
      if (d && d.m) { if (d.m.dead && (!h.order)) { const p = this.renderer.pick(g, this.mouse.x, this.mouse.y); if (p.m) { g.cmdAttack(p.m); h.order.hold = true; this.downPick = p; } } return; }
      if (d && d.tile) { const p = this.renderer.pick(g, this.mouse.x, this.mouse.y); if (p.tile) g.cmdMove(p.tile.x, p.tile.y); else if (p.m) { g.cmdAttack(p.m); if (h.order) h.order.hold = true; this.downPick = p; } }
    }
    drawBackdrop(dt) {
      const r = this.renderer, c = r.ctx; r.time += dt; const t = r.time;
      c.setTransform(r.R, 0, 0, r.R, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, 640, 480);
      const g = c.createRadialGradient(320, 520, 20, 320, 480, 420); g.addColorStop(0, `rgba(160,30,10,${0.55 + 0.1 * Math.sin(t * 3)})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 640, 480);
      for (let i = 0; i < 70; i++) { const k = (t * (0.05 + (i % 7) * 0.012) + i * 0.137) % 1; const x = (i * 97.3 + Math.sin(t + i) * 20) % 640; c.fillStyle = `rgba(255,${120 + (i % 5) * 20},40,${1 - k})`; c.fillRect(x, 480 - k * 480, 2, 2); }
    }
    destroy() {
      if (this.destroyed) return;
      if (this.state === 'play') this.saveGame(true);
      this.destroyed = true; cancelAnimationFrame(this.raf); this.ac.abort(); this.ro.disconnect(); this.audio.destroy(); this.root.replaceChildren();
    }
  }
  D.UI = UI;
})(globalThis.Diablo98 = globalThis.Diablo98 || {});
