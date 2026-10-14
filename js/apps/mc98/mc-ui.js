(function (M) {
  'use strict';
  const B = M.BLOCKS, I = M.ITEMS, K = M.ITEM_BY_KEY;
  const OPT_KEY = 'mc98.options', WORLDS_KEY = 'mc98.worlds';
  const DEFAULT_OPTS = { renderDistance: 4, resolution: 300, sound: 0.7, music: 0.35, sens: 1, bob: true, dither: true, invertY: false, fov: 70 };
  const SPLASHES = ['Также для Pentium II!', 'Софтверный рендер 320x240!', '16-битный цвет!', 'Не забудьте сохраниться!', 'Криперы не спят!', 'Воксели — это будущее!', 'Работает без 3dfx!', 'Копай глубже!', 'Освещение по блокам!', 'Ночью страшно!', 'Алмазы на глубине 12!', 'Не копай прямо вниз!'];
  const CREATIVE_TABS = [
    { name: 'Блоки', filter: it => it.id > 0 && it.id < 256 && !it.isItem && it.id !== 8 && it.id !== 9 && it.id !== 35 && it.id !== 42 },
    { name: 'Инструменты', filter: it => it.tool || it.armor != null || it.id === K.bow.id || it.id === K.arrow.id || it.id === K.flint_and_steel.id || it.id === K.bucket.id || it.id === K.water_bucket.id || it.id === K.lava_bucket.id },
    { name: 'Материалы', filter: it => it.isItem && !it.tool && it.armor == null && !it.food && ![K.bow.id, K.arrow.id, K.flint_and_steel.id, K.bucket.id, K.water_bucket.id, K.lava_bucket.id].includes(it.id) },
    { name: 'Еда', filter: it => !!it.food },
    { name: 'Прочее', filter: it => it.id === 8 || it.id === 9 || it.id === 42 }
  ];
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  class IconCache {
    constructor(atlas) {
      this.atlas = atlas; this.cache = new Map();
      const c = document.createElement('canvas'); c.width = c.height = atlas.size;
      const ctx = c.getContext('2d'); const img = ctx.createImageData(atlas.size, atlas.size); img.data.set(atlas.data); ctx.putImageData(img, 0, 0);
      this.canvas = c;
    }
    tileRect(name) { const i = this.atlas.index(name), g = this.atlas.grid; return [(i % g) * 16, Math.floor(i / g) * 16]; }
    icon(id) {
      let c = this.cache.get(id);
      if (c) return c;
      c = document.createElement('canvas'); c.width = c.height = 32;
      const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
      const it = I[id];
      if (!it) return c;
      const isCube = id < 256 && ['cube', 'half', 'cactus', 'liquid'].includes(B[id].model);
      if (isCube) {
        const b = B[id], h = b.model === 'half' ? 0.5 : 1;
        const [tx, ty] = this.tileRect(M.faceTexture(b, 'top')), [sx, sy] = this.tileRect(M.faceTexture(b, 'side')), [fx, fy] = this.tileRect(M.faceTexture(b, 'front'));
        ctx.save(); ctx.translate(16, 3 + (1 - h) * 14 * 0.5); ctx.transform(1, 0.5, -1, 0.5, 0, 0); ctx.scale(13 / 16, 13 / 16); ctx.drawImage(this.canvas, tx, ty, 16, 16, 0, -16, 16, 16); ctx.restore();
        ctx.save(); ctx.translate(3, 9.5 + (1 - h) * 13 * 0.5 + 6.5); ctx.transform(1, 0.5, 0, 1, 0, 0); ctx.scale(13 / 16, 13 * h / 16); ctx.globalAlpha = 1; ctx.drawImage(this.canvas, sx, sy, 16, 16, 0, -16 + (1 - h) * 0, 16, 16); ctx.restore();
        ctx.save(); ctx.translate(16, 16 + (1 - h) * 13 * 0.5 + 6.5); ctx.transform(1, -0.5, 0, 1, 0, 0); ctx.scale(13 / 16, 13 * h / 16); ctx.drawImage(this.canvas, fx, fy, 16, 16, 0, -16, 16, 16); ctx.restore();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.moveTo(3, 9.5 + (1 - h) * 6.5); ctx.lineTo(16, 16 + (1 - h) * 6.5); ctx.lineTo(16, 32); ctx.lineTo(3, 25.5); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.moveTo(16, 16 + (1 - h) * 6.5); ctx.lineTo(29, 9.5 + (1 - h) * 6.5); ctx.lineTo(29, 25.5); ctx.lineTo(16, 32); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else {
        const tex = id < 256 ? B[id].tex : it.tex, name = typeof tex === 'string' ? tex : tex.side;
        const [x, y] = this.tileRect(name);
        ctx.drawImage(this.canvas, x, y, 16, 16, 0, 0, 32, 32);
      }
      this.cache.set(id, c);
      return c;
    }
  }

  class UI {
    constructor(root, opts = {}) {
      this.root = root; this.opts = opts; this.standalone = !!opts.standalone;
      root.classList.add('mc98'); root.tabIndex = 0;
      this.view = el('canvas', 'mc98-view'); this.hud = el('canvas', 'mc98-hud'); this.layer = el('div', 'mc98-layer');
      root.append(this.view, this.hud, this.layer);
      this.options = Object.assign({}, DEFAULT_OPTS, lsGet(OPT_KEY, {}));
      this.atlas = new M.Atlas();
      this.icons = new IconCache(this.atlas);
      this.audio = new M.Audio();
      try { this.renderer = new M.Renderer(this.view, this.atlas); } catch (e) { this.renderer = null; this.glError = e.message; }
      this.game = null; this.worldId = null; this.mode = 'menu';
      this.keys = new Set(); this.mouse = { attack: false, use: false, useHeld: false, attackClick: false, dx: 0, dy: 0, useT: 0 };
      this.yaw = 0; this.pitch = 0; this.look = { l: false, r: false, u: false, d: false };
      this.messages = []; this.toasts = []; this.debug = false; this.hurtFlash = 0; this.lastFrame = 0; this.acc = 0; this.fps = 0; this.frames = 0; this.fpsT = 0;
      this.autosaveT = 0; this.holdName = 0; this.sleepFade = 0; this.wake = 0;
      this.dirtUrl = this.makeDirt();
      this.bind();
      this.showMain();
      this.running = true;
      this.frame = this.frame.bind(this);
      requestAnimationFrame(this.frame);
    }
    makeDirt() {
      const c = document.createElement('canvas'); c.width = c.height = 64; const ctx = c.getContext('2d');
      const [x, y] = this.icons.tileRect('dirt');
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) ctx.drawImage(this.icons.canvas, x, y, 16, 16, i * 16, j * 16, 16, 16);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, 64, 64);
      return c.toDataURL();
    }
    saveOptions() { lsSet(OPT_KEY, this.options); this.applyOptions(); }
    applyOptions() {
      const o = this.options;
      this.audio.setVolume(o.sound); this.audio.setMusicVolume(o.music);
      if (this.renderer) { this.renderer.dither = o.dither; this.renderer.viewBob = o.bob; this.renderer.fov = o.fov; }
      if (this.game) this.game.renderDistance = o.renderDistance;
      this.resize();
    }
    resize() {
      const w = this.root.clientWidth || 640, h = this.root.clientHeight || 480;
      const ih = this.options.resolution, iw = Math.round(ih * w / h);
      if (this.renderer && (this.renderer.width !== iw || this.renderer.height !== ih)) this.renderer.resize(iw, ih);
      const hs = Math.max(1, Math.round(h / 300));
      if (this.hud.width !== Math.round(w / hs) || this.hud.height !== Math.round(h / hs)) { this.hud.width = Math.round(w / hs); this.hud.height = Math.round(h / hs); }
    }
    destroy() {
      this.running = false;
      if (this.game && this.mode !== 'menu') this.saveGame();
      for (const [t, f, o] of this.listeners) o.removeEventListener(t, f);
      if (document.pointerLockElement === this.view) document.exitPointerLock();
      if (this.audio.ctx) this.audio.ctx.close();
      this.root.innerHTML = '';
    }
    active() { return !this.opts.isActive || this.opts.isActive(); }
    bind() {
      this.listeners = [];
      const on = (o, t, f, opt) => { o.addEventListener(t, f, opt); this.listeners.push([t, f, o]); };
      on(this.root, 'keydown', e => this.keydown(e));
      on(this.root, 'keyup', e => { this.keys.delete(e.code); });
      on(this.root, 'blur', () => { this.keys.clear(); this.mouse.attack = this.mouse.useHeld = false; });
      on(this.view, 'mousedown', e => this.mousedown(e));
      on(window, 'mouseup', e => { if (e.button === 0) this.mouse.attack = false; if (e.button === 2) this.mouse.useHeld = false; });
      on(this.view, 'contextmenu', e => e.preventDefault());
      on(this.layer, 'contextmenu', e => e.preventDefault());
      on(document, 'mousemove', e => this.mousemove(e));
      on(document, 'pointerlockchange', () => { if (document.pointerLockElement !== this.view && this.mode === 'play' && this.game) this.pause(); });
      on(this.view, 'wheel', e => { if (this.mode === 'play' && this.game) { this.game.selected = (this.game.selected + (e.deltaY > 0 ? 1 : 8)) % 9; this.holdName = 2; e.preventDefault(); } }, { passive: false });
      on(window, 'resize', () => this.resize());
      on(this.root, 'mousedown', () => { this.audio.init(); this.audio.resume(); this.root.focus({ preventScroll: true }); });
    }
    keydown(e) {
      if (!this.active()) return;
      this.audio.init(); this.audio.resume();
      const c = e.code;
      if (c === 'F3') { this.debug = !this.debug; e.preventDefault(); return; }
      if (c === 'Escape') {
        e.preventDefault();
        if (this.mode === 'play') this.pause(); else if (this.mode === 'pause') this.resume(); else if (this.mode === 'inventory') this.closeInventory(); else if (this.mode === 'options') this.closeOptions();
        return;
      }
      if (this.mode === 'play' && this.game) {
        if (c === 'KeyE' || c === 'Tab') { this.openInventory(); e.preventDefault(); return; }
        if (c === 'KeyQ') { this.game.tickQueue = this.game.tickQueue || {}; this.pendingDrop = true; }
        if (/^Digit[1-9]$/.test(c)) { this.game.selected = parseInt(c[5]) - 1; this.holdName = 2; }
        if (c === 'Space') { const now = performance.now(); if (this.game.mode === 'creative' && now - (this.lastSpace || 0) < 300) { this.pendingFly = true; } this.lastSpace = now; }
        if (c === 'Enter') this.mouse.use = true;
        if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(c)) e.preventDefault();
      } else if (this.mode === 'inventory' && (c === 'KeyE')) { this.closeInventory(); e.preventDefault(); return; }
      this.keys.add(c);
    }
    mousedown(e) {
      if (!this.active()) return;
      if (this.mode !== 'play' || !this.game) return;
      e.preventDefault();
      if (document.pointerLockElement !== this.view) { try { const r = this.view.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (err) {} }
      if (e.button === 0) { this.mouse.attack = true; this.mouse.attackClick = true; }
      if (e.button === 2) { this.mouse.use = true; this.mouse.useHeld = true; this.mouse.useT = 0; }
      if (e.button === 1) this.pickBlock();
    }
    pickBlock() {
      const g = this.game, t = g.target; if (!t || t.entity) return;
      const id = t.id === K.furnace_lit.id ? K.furnace.id : t.id;
      const idx = g.inventory.findIndex((s, i) => s && s.id === id && i < 9);
      if (idx >= 0) g.selected = idx;
      else if (g.mode === 'creative') g.inventory[g.selected] = M.stackOf(id, 1);
    }
    mousemove(e) {
      if (this.mode !== 'play' || document.pointerLockElement !== this.view) return;
      const s = 0.0025 * this.options.sens;
      this.yaw -= e.movementX * s; this.pitch += (this.options.invertY ? 1 : -1) * e.movementY * s;
      this.pitch = M.clamp(this.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
    }

    worlds() { return lsGet(WORLDS_KEY, []); }
    setWorlds(list) { lsSet(WORLDS_KEY, list); }
    saveGame() {
      if (!this.game || !this.worldId) return false;
      const data = this.game.serialize();
      const ok = lsSet('mc98.world.' + this.worldId, data);
      const list = this.worlds().map(w => w.id === this.worldId ? Object.assign(w, { saved: Date.now(), mode: this.game.mode, difficulty: this.game.difficulty }) : w);
      this.setWorlds(list);
      if (!ok) this.pushMessage('Не удалось сохранить: мало места');
      return ok;
    }
    createWorld(name, seedStr, mode, difficulty) {
      const seed = M.seedFromString(seedStr);
      const id = 'w' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
      const list = this.worlds(); list.unshift({ id, name: name || 'Новый мир', seed, mode, difficulty, saved: Date.now() }); this.setWorlds(list);
      this.startGame(id, { seed, name: name || 'Новый мир', mode, difficulty });
    }
    startGame(id, opts) {
      this.worldId = id;
      this.showLoading('Создание мира...');
      setTimeout(() => {
        try { this.game = new M.Game(Object.assign({ renderDistance: this.options.renderDistance }, opts)); }
        catch (e) { console.error(e); this.showMain(); this.pushMessage('Ошибка загрузки мира'); return; }
        this.yaw = this.game.player.yaw; this.pitch = this.game.player.pitch;
        this.loadingUntil = true;
        this.mode = 'loading';
      }, 30);
    }
    loadWorld(id) {
      const data = lsGet('mc98.world.' + id, null);
      if (!data) { this.pushMessage('Сохранение не найдено'); return; }
      this.startGame(id, { save: data });
    }
    quitToMenu() {
      if (this.game) this.saveGame();
      if (document.pointerLockElement === this.view) document.exitPointerLock();
      this.game = null; this.worldId = null;
      this.showMain();
    }

    panel(cls) { this.layer.innerHTML = ''; const p = el('div', 'mc98-panel ' + (cls || '')); this.layer.appendChild(p); this.layer.style.display = 'flex'; return p; }
    button(label, fn, cls) { const b = el('button', 'mc98-btn ' + (cls || ''), label); b.onclick = () => { this.audio.init(); this.audio.play('click'); fn(); }; return b; }
    showMain() {
      this.mode = 'menu';
      this.layer.style.backgroundImage = 'url(' + this.dirtUrl + ')'; this.layer.classList.add('dirt');
      const p = this.panel('mc98-main');
      const splash = SPLASHES[Math.floor(Math.random() * SPLASHES.length)];
      p.appendChild(el('div', 'mc98-logo', '<div class="mc98-logo-t">MINECRAFT</div><div class="mc98-logo-98">98</div><div class="mc98-splash">' + splash + '</div>'));
      p.appendChild(this.button('Одиночная игра', () => this.showWorlds()));
      p.appendChild(this.button('Настройки', () => this.showOptions('menu')));
      if (this.opts.onExit) p.appendChild(this.button('Выход', () => this.opts.onExit()));
      p.appendChild(el('div', 'mc98-foot', 'Minecraft 98 Alpha v1.0.17 &nbsp;·&nbsp; Mojang Specifications (1999) / Win 98 Edition' + (this.glError ? '<br><span class="red">3D-ускоритель не найден: ' + this.glError + '</span>' : '')));
    }
    showWorlds() {
      this.mode = 'menu';
      const p = this.panel('mc98-worlds');
      p.appendChild(el('h2', null, 'Выбор мира'));
      const list = el('div', 'mc98-list');
      const worlds = this.worlds();
      let sel = worlds[0] ? worlds[0].id : null;
      const refresh = () => { list.querySelectorAll('.mc98-world').forEach(w => w.classList.toggle('sel', w.dataset.id === sel)); };
      if (!worlds.length) list.appendChild(el('div', 'mc98-empty', 'Миров пока нет. Создайте новый!'));
      for (const w of worlds) {
        const d = el('div', 'mc98-world', '<b>' + escapeHtml(w.name) + '</b><span>(' + new Date(w.saved).toLocaleString() + ')</span><br><small>' + (w.mode === 'creative' ? 'Творчество' : 'Выживание') + ' · сложность ' + ['мирная', 'лёгкая', 'нормальная', 'сложная'][w.difficulty] + ' · seed ' + w.seed + '</small>');
        d.dataset.id = w.id; d.onclick = () => { sel = w.id; refresh(); }; d.ondblclick = () => this.loadWorld(w.id);
        list.appendChild(d);
      }
      refresh();
      p.appendChild(list);
      const row = el('div', 'mc98-row');
      row.appendChild(this.button('Играть', () => { if (sel) this.loadWorld(sel); }));
      row.appendChild(this.button('Создать новый', () => this.showCreate()));
      p.appendChild(row);
      const row2 = el('div', 'mc98-row');
      row2.appendChild(this.button('Удалить', () => { if (!sel) return; if (!confirm('Удалить мир навсегда?')) return; try { localStorage.removeItem('mc98.world.' + sel); } catch (e) {} this.setWorlds(this.worlds().filter(w => w.id !== sel)); this.showWorlds(); }, 'dim'));
      row2.appendChild(this.button('Назад', () => this.showMain(), 'dim'));
      p.appendChild(row2);
    }
    showCreate() {
      const p = this.panel('mc98-create');
      p.appendChild(el('h2', null, 'Новый мир'));
      const form = el('div', 'mc98-form');
      form.innerHTML = '<label>Название<input id="mcName" maxlength="32" value="Новый мир"></label><label>Зерно (пусто = случайное)<input id="mcSeed" maxlength="32"></label><label>Режим<select id="mcMode"><option value="survival">Выживание</option><option value="creative">Творчество</option></select></label><label>Сложность<select id="mcDiff"><option value="0">Мирная</option><option value="1">Лёгкая</option><option value="2" selected>Нормальная</option><option value="3">Сложная</option></select></label>';
      p.appendChild(form);
      form.querySelectorAll('input,select').forEach(i => i.addEventListener('keydown', e => e.stopPropagation()));
      const row = el('div', 'mc98-row');
      row.appendChild(this.button('Создать мир', () => this.createWorld(form.querySelector('#mcName').value.trim(), form.querySelector('#mcSeed').value, form.querySelector('#mcMode').value, parseInt(form.querySelector('#mcDiff').value))));
      row.appendChild(this.button('Отмена', () => this.showWorlds(), 'dim'));
      p.appendChild(row);
      setTimeout(() => form.querySelector('#mcName').focus(), 0);
    }
    showOptions(back) {
      this.optionsBack = back;
      this.mode = 'options';
      const p = this.panel('mc98-options');
      p.appendChild(el('h2', null, 'Настройки'));
      const o = this.options, form = el('div', 'mc98-form');
      const ctl = (label, inner) => { const l = el('label'); l.innerHTML = label + inner; form.appendChild(l); return l; };
      const rd = ctl('Дальность прорисовки', '<select id="oRd"><option value="2">Крошечная (2)</option><option value="3">Малая (3)</option><option value="4">Нормальная (4)</option><option value="5">Большая (5)</option><option value="6">Далёкая (6)</option></select>').querySelector('select'); rd.value = o.renderDistance;
      const res = ctl('Разрешение', '<select id="oRes"><option value="240">320x240</option><option value="300">400x300</option><option value="360">480x360</option><option value="480">640x480</option><option value="600">800x600</option></select>').querySelector('select'); res.value = o.resolution;
      const snd = ctl('Звук', '<input type="range" min="0" max="1" step="0.05">').querySelector('input'); snd.value = o.sound;
      const mus = ctl('Музыка', '<input type="range" min="0" max="1" step="0.05">').querySelector('input'); mus.value = o.music;
      const sens = ctl('Чувствительность мыши', '<input type="range" min="0.2" max="3" step="0.1">').querySelector('input'); sens.value = o.sens;
      const fov = ctl('Угол обзора', '<input type="range" min="50" max="110" step="1">').querySelector('input'); fov.value = o.fov;
      const bob = ctl('Покачивание камеры', '<input type="checkbox">').querySelector('input'); bob.checked = o.bob;
      const dit = ctl('16-битный цвет (дизеринг)', '<input type="checkbox">').querySelector('input'); dit.checked = o.dither;
      const inv = ctl('Инвертировать мышь', '<input type="checkbox">').querySelector('input'); inv.checked = o.invertY;
      p.appendChild(form);
      form.querySelectorAll('input,select').forEach(i => i.addEventListener('keydown', e => e.stopPropagation()));
      p.appendChild(el('div', 'mc98-small', 'WASD — ходьба, мышь — обзор, ЛКМ — ломать, ПКМ — ставить/использовать, E — инвентарь, Q — выбросить, Shift — красться, Ctrl — бег, Space — прыжок, 1–9 — слоты, F3 — отладка'));
      p.appendChild(this.button('Готово', () => {
        Object.assign(o, { renderDistance: parseInt(rd.value), resolution: parseInt(res.value), sound: parseFloat(snd.value), music: parseFloat(mus.value), sens: parseFloat(sens.value), fov: parseInt(fov.value), bob: bob.checked, dither: dit.checked, invertY: inv.checked });
        this.saveOptions(); this.closeOptions();
      }));
    }
    closeOptions() { if (this.optionsBack === 'pause') this.showPause(); else this.showMain(); }
    showLoading(text) { this.mode = 'loading'; const p = this.panel('mc98-loading'); p.appendChild(el('h2', null, text)); p.appendChild(el('div', 'mc98-bar', '<div></div>')); this.loadBar = p.querySelector('.mc98-bar div'); p.appendChild(el('div', 'mc98-load-t', 'Построение ландшафта')); this.loadText = p.querySelector('.mc98-load-t'); }
    enterPlay() {
      this.mode = 'play';
      this.layer.style.display = 'none'; this.layer.innerHTML = ''; this.layer.classList.remove('dirt'); this.layer.style.backgroundImage = '';
      this.root.focus({ preventScroll: true });
      this.keys.clear();
    }
    pause() {
      if (this.mode !== 'play') return;
      this.mode = 'pause';
      if (document.pointerLockElement === this.view) document.exitPointerLock();
      this.showPause();
    }
    showPause() {
      this.mode = 'pause';
      const p = this.panel('mc98-pause');
      p.appendChild(el('h2', null, 'Пауза'));
      p.appendChild(this.button('Вернуться в игру', () => this.resume()));
      p.appendChild(this.button('Настройки', () => this.showOptions('pause')));
      p.appendChild(this.button('Достижения', () => this.showAchievements()));
      p.appendChild(this.button('Сохранить и выйти', () => this.quitToMenu(), 'dim'));
      this.layer.classList.remove('dirt'); this.layer.style.backgroundImage = '';
    }
    showAchievements() {
      const p = this.panel('mc98-ach');
      p.appendChild(el('h2', null, 'Достижения'));
      const list = el('div', 'mc98-list');
      for (const [k, a] of Object.entries(M.ACHIEVEMENTS)) { const has = this.game.achievements.has(k); list.appendChild(el('div', 'mc98-world ' + (has ? 'done' : 'todo'), '<b>' + (has ? '✔ ' : '') + a.name + '</b><br><small>' + a.desc + '</small>')); }
      p.appendChild(list);
      const s = this.game.stats;
      p.appendChild(el('div', 'mc98-small', 'Добыто блоков: ' + s.mined + ' · Поставлено: ' + s.placed + ' · Убито: ' + s.kills + ' · Смертей: ' + s.deaths + ' · Скрафчено: ' + s.crafted));
      p.appendChild(this.button('Назад', () => this.showPause(), 'dim'));
    }
    resume() {
      if (!this.game) return;
      this.enterPlay();
      try { const r = this.view.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {}
    }
    showDeath() {
      this.mode = 'dead';
      if (document.pointerLockElement === this.view) document.exitPointerLock();
      const p = this.panel('mc98-death');
      p.appendChild(el('h2', 'red', 'Вы погибли!'));
      p.appendChild(el('div', 'mc98-small', this.game.deathReason + '<br>Очки: ' + (this.game.stats.mined + this.game.stats.kills * 10)));
      p.appendChild(this.button('Возродиться', () => { this.game.respawn(); this.resume(); }));
      p.appendChild(this.button('В главное меню', () => this.quitToMenu(), 'dim'));
      this.layer.style.backgroundImage = 'linear-gradient(rgba(120,0,0,0.55), rgba(120,0,0,0.55))';
    }

    openInventory() {
      const g = this.game;
      if (!g.container) g.openInventory();
      this.mode = 'inventory';
      if (document.pointerLockElement === this.view) document.exitPointerLock();
      this.buildContainer();
    }
    closeInventory() {
      if (this.game) this.game.closeContainer();
      this.resume();
    }
    slotEl(area, i) {
      const s = el('div', 'mc98-slot');
      s.dataset.area = area; s.dataset.i = i;
      s.appendChild(el('canvas')); s.querySelector('canvas').width = 32; s.querySelector('canvas').height = 32;
      s.appendChild(el('span', 'mc98-count'));
      s.appendChild(el('div', 'mc98-dur'));
      s.onmousedown = e => { e.preventDefault(); this.slotClick(area, i, e.button, e.shiftKey); };
      s.onmouseenter = () => { this.hoverSlot = [area, i]; };
      s.onmouseleave = () => { this.hoverSlot = null; this.tooltip.style.display = 'none'; };
      return s;
    }
    grid(area, n, cols, cls) { const g = el('div', 'mc98-grid ' + (cls || '')); g.style.gridTemplateColumns = 'repeat(' + cols + ', 36px)'; for (let i = 0; i < n; i++) g.appendChild(this.slotEl(area, i)); return g; }
    buildContainer() {
      const g = this.game, c = g.container || { type: 'inventory' };
      const p = this.panel('mc98-inv');
      p.style.backgroundImage = '';
      this.layer.style.backgroundImage = 'linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45))';
      const top = el('div', 'mc98-invtop');
      if (c.type === 'inventory') {
        top.appendChild(el('h3', null, g.mode === 'creative' ? 'Творчество' : 'Инвентарь'));
        const row = el('div', 'mc98-row2');
        row.appendChild(this.grid('armor', 4, 1, 'armor'));
        const face = el('div', 'mc98-face'); const fc = el('canvas'); fc.width = 32; fc.height = 32; fc.getContext('2d').drawImage(this.icons.canvas, ...this.icons.tileRect('player_face'), 16, 16, 0, 0, 32, 32); face.appendChild(fc); row.appendChild(face);
        if (g.mode !== 'creative') { const cr = el('div', 'mc98-craft'); cr.appendChild(el('div', 'mc98-label', 'Крафт')); cr.appendChild(this.grid('craft', 4, 2)); cr.appendChild(el('div', 'mc98-arrow', '➜')); cr.appendChild(this.grid('result', 1, 1, 'result')); row.appendChild(cr); }
        top.appendChild(row);
        if (g.mode === 'creative') {
          const tabs = el('div', 'mc98-tabs');
          this.creativeTab = this.creativeTab || 0;
          CREATIVE_TABS.forEach((t, i) => { const b = el('button', 'mc98-tab' + (i === this.creativeTab ? ' on' : ''), t.name); b.onclick = () => { this.creativeTab = i; this.buildContainer(); }; tabs.appendChild(b); });
          top.appendChild(tabs);
          const pal = el('div', 'mc98-grid mc98-palette'); pal.style.gridTemplateColumns = 'repeat(9, 36px)';
          const items = I.filter(it => it && it.id > 0 && CREATIVE_TABS[this.creativeTab].filter(it));
          items.forEach((it, i) => { const s = this.slotEl('creative', it.id); s.dataset.i = it.id; pal.appendChild(s); });
          top.appendChild(pal);
        }
      } else if (c.type === 'table') {
        top.appendChild(el('h3', null, 'Верстак'));
        const cr = el('div', 'mc98-craft big'); cr.appendChild(this.grid('craft', 9, 3)); cr.appendChild(el('div', 'mc98-arrow', '➜')); cr.appendChild(this.grid('result', 1, 1, 'result')); top.appendChild(cr);
      } else if (c.type === 'chest') {
        top.appendChild(el('h3', null, 'Сундук'));
        top.appendChild(this.grid('chest', 27, 9));
      } else if (c.type === 'furnace') {
        top.appendChild(el('h3', null, 'Печь'));
        const f = el('div', 'mc98-furnace');
        const col = el('div', 'mc98-fcol'); col.appendChild(this.slotEl('furnace', 0)); col.appendChild(el('div', 'mc98-flame')); col.appendChild(this.slotEl('furnace', 1)); f.appendChild(col);
        f.appendChild(el('div', 'mc98-farrow', '<div></div>'));
        f.appendChild(this.slotEl('furnace', 2));
        top.appendChild(f);
      }
      p.appendChild(top);
      p.appendChild(el('div', 'mc98-label', 'Инвентарь'));
      const main = this.grid('inv', 27, 9); main.querySelectorAll('.mc98-slot').forEach((s, i) => { s.dataset.i = i + 9; });
      p.appendChild(main);
      p.appendChild(this.grid('inv', 9, 9, 'hotbar'));
      this.cursorEl = el('div', 'mc98-slot mc98-cursor'); this.cursorEl.appendChild(el('canvas')); this.cursorEl.querySelector('canvas').width = 32; this.cursorEl.querySelector('canvas').height = 32; this.cursorEl.appendChild(el('span', 'mc98-count')); this.cursorEl.style.display = 'none';
      this.layer.appendChild(this.cursorEl);
      this.tooltip = el('div', 'mc98-tip'); this.tooltip.style.display = 'none'; this.layer.appendChild(this.tooltip);
      const mm = e => { const r = this.layer.getBoundingClientRect(); this.cursorEl.style.left = (e.clientX - r.left - 18) + 'px'; this.cursorEl.style.top = (e.clientY - r.top - 18) + 'px'; this.tooltip.style.left = (e.clientX - r.left + 14) + 'px'; this.tooltip.style.top = (e.clientY - r.top + 8) + 'px'; };
      this.layer.onmousemove = mm;
      this.layer.onmousedown = e => { if (e.target === this.layer) { e.preventDefault(); if (g.cursor) { g.throwStack(g.cursor); g.cursor = null; this.refreshSlots(); } } };
      this.refreshSlots(true);
    }
    slotClick(area, i, button, shift) {
      const g = this.game;
      this.audio.play('click');
      if (area === 'creative') { if (shift) { const d = I[i]; const left = g.addToInventory(M.stackOf(i, d.stack === 1 ? 1 : 64)); } else g.creativeTake(i, button); }
      else if (area === 'result') g.takeResult(shift);
      else g.clickSlot(area, i, button, shift);
      this.refreshSlots();
    }
    stackFor(area, i) {
      const g = this.game;
      if (area === 'inv') return g.inventory[i]; if (area === 'armor') return g.armor[i]; if (area === 'chest' || area === 'furnace') return g.container && g.container.be ? g.container.be.slots[i] : null;
      if (area === 'craft') { const s = g.craftSize; return g.craft[Math.floor(i / s) * 3 + (i % s)]; }
      if (area === 'result') { g.updateCraftResult(); return g.craftResult; }
      if (area === 'creative') return M.stackOf(i, 1);
      return null;
    }
    drawStack(slot, st, force) {
      const key = st ? st.id + ':' + st.count + ':' + (st.dmg || 0) : '';
      if (!force && slot.dataset.key === key) return;
      slot.dataset.key = key;
      const cv = slot.querySelector('canvas'), ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, 32, 32);
      const cnt = slot.querySelector('.mc98-count'), dur = slot.querySelector('.mc98-dur');
      if (!st) { cnt.textContent = ''; if (dur) dur.style.display = 'none'; return; }
      ctx.drawImage(this.icons.icon(st.id), 0, 0);
      cnt.textContent = st.count > 1 ? st.count : '';
      const d = I[st.id];
      if (dur) { if (d.durability && st.dmg) { dur.style.display = 'block'; const f = 1 - st.dmg / d.durability; dur.style.setProperty('--f', (f * 100) + '%'); dur.style.setProperty('--c', f > 0.5 ? '#40d040' : f > 0.25 ? '#e0c020' : '#e03020'); } else dur.style.display = 'none'; }
    }
    refreshSlots(force) {
      if (this.mode !== 'inventory' || !this.game) return;
      const g = this.game;
      this.layer.querySelectorAll('.mc98-slot').forEach(s => { if (s === this.cursorEl) return; this.drawStack(s, this.stackFor(s.dataset.area, parseInt(s.dataset.i)), force); });
      if (this.cursorEl) { this.cursorEl.style.display = g.cursor ? 'block' : 'none'; if (g.cursor) this.drawStack(this.cursorEl, g.cursor, force); }
      if (g.container && g.container.type === 'furnace') {
        const be = g.container.be, fl = this.layer.querySelector('.mc98-flame'), ar = this.layer.querySelector('.mc98-farrow div');
        if (fl) fl.style.setProperty('--f', (be.burnMax ? be.burn / be.burnMax * 100 : 0) + '%');
        if (ar) ar.style.width = (be.cook / 200 * 100) + '%';
      }
      if (this.hoverSlot && !g.cursor) {
        const st = this.stackFor(this.hoverSlot[0], this.hoverSlot[1]);
        if (st) { const d = I[st.id]; this.tooltip.style.display = 'block'; this.tooltip.innerHTML = escapeHtml(d.name) + (d.durability ? '<br><small>Прочность: ' + (d.durability - (st.dmg || 0)) + ' / ' + d.durability + '</small>' : '') + (d.food ? '<br><small>Восстанавливает ' + d.food / 2 + ' ♥</small>' : '') + (d.damage ? '<br><small>Урон: ' + d.damage / 2 + ' ♥</small>' : '') + (d.protection ? '<br><small>Защита: ' + d.protection + '</small>' : ''); }
        else this.tooltip.style.display = 'none';
      } else if (this.tooltip) this.tooltip.style.display = 'none';
    }

    input() {
      const k = this.keys, m = this.mouse;
      const inp = { fwd: (k.has('KeyW') ? 1 : 0) - (k.has('KeyS') ? 1 : 0), strafe: (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0), jump: k.has('Space'), sneak: k.has('ShiftLeft') || k.has('ShiftRight'), sprint: k.has('ControlLeft') || k.has('ControlRight'), attack: m.attack, attackClick: m.attackClick, use: m.use, yaw: this.yaw, pitch: this.pitch, dropKey: this.pendingDrop, toggleFly: this.pendingFly };
      m.attackClick = false; m.use = false; this.pendingDrop = false; this.pendingFly = false;
      const ls = 0.09;
      if (k.has('ArrowLeft')) this.yaw += ls; if (k.has('ArrowRight')) this.yaw -= ls; if (k.has('ArrowUp')) this.pitch += ls; if (k.has('ArrowDown')) this.pitch -= ls;
      this.pitch = M.clamp(this.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
      inp.yaw = this.yaw; inp.pitch = this.pitch;
      if (m.useHeld) { m.useT += M.DT; if (m.useT >= 0.25) { m.useT = 0; inp.use = true; } }
      return inp;
    }
    processEvents() {
      const g = this.game, p = g.player;
      for (const ev of g.events) {
        if (ev.type === 'sound') this.audio.playAt(ev.name, ev.x, ev.y, ev.z, p.x, p.y, p.z);
        else if (ev.type === 'message') this.pushMessage(ev.text);
        else if (ev.type === 'achievement') { this.toasts.push({ name: ev.name, desc: ev.desc, t: 5 }); this.audio.play('achievement'); }
        else if (ev.type === 'hurt') this.hurtFlash = 0.4;
        else if (ev.type === 'wake') this.wake = 1;
      }
      g.events.length = 0;
    }
    pushMessage(text) { this.messages.push({ text, t: 4 }); if (this.messages.length > 5) this.messages.shift(); }
    frame(now) {
      if (!this.running) return;
      requestAnimationFrame(this.frame);
      const dt = Math.min(0.1, (now - (this.lastFrame || now)) / 1000); this.lastFrame = now;
      this.frames++; this.fpsT += dt; if (this.fpsT >= 1) { this.fps = this.frames; this.frames = 0; this.fpsT = 0; }
      this.resize();
      if (this.mode === 'loading' && this.game) {
        const g = this.game, p = g.player, work = g.world.load(Math.floor(p.x), Math.floor(p.z), g.renderDistance + 1, 12);
        const ready = g.world.readyChunks(Math.floor(p.x), Math.floor(p.z), g.renderDistance).length, need = Math.PI * g.renderDistance * g.renderDistance * 0.9;
        if (this.loadBar) this.loadBar.style.width = Math.min(100, ready / need * 100) + '%';
        if (this.loadText) this.loadText.textContent = 'Чанков готово: ' + ready;
        if (work === 0 || ready >= need) { g.settle(); this.enterPlay(); this.pushMessage('Мир «' + g.name + '» загружен'); }
        return;
      }
      if (!this.game || this.mode === 'menu' || this.mode === 'options' && !this.game) { this.drawHud(dt); return; }
      const g = this.game;
      const playing = this.mode === 'play' || this.mode === 'inventory' || this.mode === 'dead';
      if (playing) {
        this.acc += dt;
        let n = 0;
        while (this.acc >= M.DT && n < 4) {
          const inp = this.mode === 'play' ? this.input() : { yaw: this.yaw, pitch: this.pitch };
          g.tick(inp);
          this.acc -= M.DT; n++;
        }
        if (n === 4) this.acc = 0;
        this.processEvents();
        if (g.player.dead && this.mode !== 'dead') this.showDeath();
        if (this.mode === 'inventory' && g.tickCount % 4 === 0) this.refreshSlots();
        this.autosaveT += dt; if (this.autosaveT > 60) { this.autosaveT = 0; this.saveGame(); }
        this.audio.tickMusic(dt, g.player.y > 20);
      }
      if (this.renderer) { try { this.renderer.render(g, { alpha: this.acc / M.DT }); } catch (e) { if (!this.renderErr) { console.error(e); this.renderErr = true; } } }
      this.drawHud(dt);
    }
    drawHud(dt) {
      const c = this.hud, ctx = c.getContext('2d'), W = c.width, H = c.height;
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = false;
      if (!this.game || this.mode === 'menu' || this.mode === 'loading') return;
      const g = this.game, p = g.player;
      ctx.font = 'bold 9px "Courier New", monospace'; ctx.textBaseline = 'top';
      const text = (s, x, y, col = '#fff', align = 'left') => { ctx.textAlign = align; ctx.fillStyle = '#000'; ctx.fillText(s, x + 1, y + 1); ctx.fillStyle = col; ctx.fillText(s, x, y); };
      if (this.mode === 'play') {
        ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff';
        ctx.fillRect(W / 2 - 5, H / 2, 11, 1); ctx.fillRect(W / 2, H / 2 - 5, 1, 11);
        ctx.globalCompositeOperation = 'source-over';
      }
      const sw = 20, hx = Math.floor(W / 2 - sw * 4.5), hy = H - sw - 2;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(hx - 1, hy - 1, sw * 9 + 2, sw + 2);
      for (let i = 0; i < 9; i++) {
        const x = hx + i * sw;
        ctx.strokeStyle = i === g.selected ? '#fff' : '#555'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, hy + 0.5, sw - 1, sw - 1);
        const st = g.inventory[i];
        if (st) { ctx.drawImage(this.icons.icon(st.id), x + 2, hy + 2, 16, 16); if (st.count > 1) text(String(st.count), x + sw - 2, hy + sw - 10, '#fff', 'right'); const d = I[st.id]; if (d.durability && st.dmg) { const f = 1 - st.dmg / d.durability; ctx.fillStyle = '#000'; ctx.fillRect(x + 3, hy + sw - 4, 14, 2); ctx.fillStyle = f > 0.5 ? '#40d040' : f > 0.25 ? '#e0c020' : '#e03020'; ctx.fillRect(x + 3, hy + sw - 4, Math.round(14 * f), 1); } }
      }
      if (g.mode !== 'creative') {
        const hp = p.hp, blink = p.hurtT > 0 && Math.floor(g.tickCount / 2) % 2 === 0;
        for (let i = 0; i < 10; i++) {
          const x = hx + i * 8, y = hy - 11;
          this.heart(ctx, x, y, hp >= (i + 1) * 2 ? 2 : hp >= i * 2 + 1 ? 1 : 0, blink, hp <= 4 && Math.floor(g.tickCount / 3) % 2 === 0 ? 1 : 0);
        }
        const ap = g.armorPoints();
        if (ap > 0) for (let i = 0; i < 10; i++) { const x = hx + sw * 9 - 80 + i * 8, y = hy - 11; ctx.fillStyle = ap >= (i + 1) * 2 ? '#c8c8c8' : ap >= i * 2 + 1 ? '#888' : '#333'; ctx.fillRect(x + 1, y + 1, 6, 6); ctx.fillStyle = '#000'; ctx.fillRect(x + 3, y + 3, 2, 2); }
        if (p.air < 300) for (let i = 0; i < 10; i++) { const x = hx + sw * 9 - 80 + i * 8, y = hy - 20; if (p.air > i * 30) { ctx.fillStyle = '#9cf'; ctx.beginPath(); ctx.arc(x + 4, y + 4, 3, 0, M.TAU); ctx.fill(); } }
      }
      if (this.holdName > 0 && this.mode === 'play') { this.holdName -= dt; const st = g.held(); if (st) text(I[st.id].name, W / 2, hy - 24, 'rgba(255,255,255,' + Math.min(1, this.holdName) + ')', 'center'); }
      if (this.hurtFlash > 0) { this.hurtFlash -= dt; ctx.fillStyle = 'rgba(255,0,0,' + (this.hurtFlash * 0.6) + ')'; ctx.fillRect(0, 0, W, H); }
      if (g.sleeping > 0) { ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, g.sleeping / 1.2) + ')'; ctx.fillRect(0, 0, W, H); text('Спим...', W / 2, H / 2, '#fff', 'center'); }
      if (this.wake > 0) { this.wake -= dt; ctx.fillStyle = 'rgba(0,0,0,' + Math.max(0, this.wake) + ')'; ctx.fillRect(0, 0, W, H); }
      let my = 4;
      for (const m of this.messages) { m.t -= dt; text(m.text, 4, my, 'rgba(255,255,255,' + Math.min(1, m.t) + ')'); my += 11; }
      this.messages = this.messages.filter(m => m.t > 0);
      if (this.toasts.length) {
        const t = this.toasts[0]; t.t -= dt;
        const y = t.t > 4.6 ? -40 + (5 - t.t) / 0.4 * 40 : t.t < 0.4 ? -40 + t.t / 0.4 * 40 : 0;
        ctx.fillStyle = 'rgba(20,20,20,0.9)'; ctx.fillRect(W - 150, y + 2, 146, 30); ctx.strokeStyle = '#e8c860'; ctx.strokeRect(W - 149.5, y + 2.5, 145, 29);
        text('Достижение получено!', W - 144, y + 6, '#e8c860'); text(t.name, W - 144, y + 18, '#fff');
        if (t.t <= 0) this.toasts.shift();
      }
      if (this.debug) {
        const lines = ['Minecraft 98 ' + this.fps + ' fps, ' + (this.renderer ? this.renderer.stats.chunks + ' chunks, ' + this.renderer.stats.verts + ' verts' : 'no 3d'), 'x: ' + p.x.toFixed(2) + ' y: ' + p.y.toFixed(2) + ' z: ' + p.z.toFixed(2), 'chunk: ' + (Math.floor(p.x) >> 4) + ',' + (Math.floor(p.z) >> 4) + ' loaded: ' + g.world.chunks.size, 'biome: ' + g.biome() + ' light: ' + g.lightAt(p.x, p.y + 1, p.z) + ' (sky ' + g.world.getSky(Math.floor(p.x), Math.floor(p.y + 1), Math.floor(p.z)) + ')', 'time: ' + M.formatTime(g.time) + ' day ' + Math.floor(g.time / M.DAY) + ' entities: ' + g.entities.length, 'seed: ' + g.seed + ' mode: ' + g.mode + ' diff: ' + g.difficulty, g.target && !g.target.entity ? 'target: ' + B[g.target.id].en + ' @ ' + g.target.x + ',' + g.target.y + ',' + g.target.z + ' meta ' + g.target.meta : g.target ? 'target: ' + g.target.entity.type : ''];
        lines.forEach((l, i) => text(l, 4, 40 + i * 10, '#fff'));
      }
    }
    heart(ctx, x, y, state, blink, low) {
      const y2 = y + (low ? -1 : 0);
      ctx.fillStyle = blink ? '#fff' : '#3a1010'; this.heartShape(ctx, x, y2, 8);
      if (state > 0) { ctx.fillStyle = '#e02020'; if (state === 2) this.heartShape(ctx, x + 1, y2 + 1, 6); else { ctx.save(); ctx.beginPath(); ctx.rect(x, y2, 4, 10); ctx.clip(); this.heartShape(ctx, x + 1, y2 + 1, 6); ctx.restore(); } }
    }
    heartShape(ctx, x, y, s) { ctx.beginPath(); ctx.moveTo(x + s / 2, y + s); ctx.lineTo(x, y + s / 2); ctx.lineTo(x, y + s / 4); ctx.lineTo(x + s / 4, y); ctx.lineTo(x + s / 2, y + s / 4); ctx.lineTo(x + s * 3 / 4, y); ctx.lineTo(x + s, y + s / 4); ctx.lineTo(x + s, y + s / 2); ctx.closePath(); ctx.fill(); }
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  Object.assign(M, { UI, IconCache, CREATIVE_TABS });
})(globalThis.Mc98 = globalThis.Mc98 || {});
