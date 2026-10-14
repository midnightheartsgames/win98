(function (S) {
  'use strict';
  const { clamp, wrapAng, lerp } = S;
  const D = S.DATA;
  const DT = 1 / 60, PI = Math.PI;
  const SAVE_KEY = 'dmc98-save', OPT_KEY = 'dmc98-options';
  const store = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); return true; } catch (_) { return false; } } };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const RES = [320, 480, 640, 960];
  const GOTH = '"Times New Roman", Georgia, serif', IMP = 'Impact, "Arial Black", Arial, sans-serif';
  const KEYMAP = { KeyJ: 'sword', KeyK: 'gun', KeyL: 'bring', Space: 'jump', KeyI: 'exceed', KeyO: 'dtk', KeyU: 'taunt' };
  const ITEM_KEYS = { Digit1: 'vitalS', Digit2: 'vitalL', Digit3: 'devilStar', Digit4: 'holyWater' };
  const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function newProfile() { return { v: 1, profile: S.defaultSave(), unlocked: 0, best: {}, sos: false, done: false, diff: 1 }; }

  class UI {
    constructor(root, opts = {}) {
      this.root = root; this.opts = opts; this.ac = new AbortController();
      root.classList.add('dm98'); root.tabIndex = 0;
      root.innerHTML = '<canvas class="dm98-gl"></canvas><canvas class="dm98-hud"></canvas><div class="dm98-ov"></div><div class="dm98-err"></div>';
      this.glc = root.querySelector('.dm98-gl'); this.hud = root.querySelector('.dm98-hud'); this.hx = this.hud.getContext('2d'); this.ov = root.querySelector('.dm98-ov');
      this.options = { sfx: 0.8, music: 0.55, res: 2, autoCam: true, tips: true, invert: false };
      try { Object.assign(this.options, JSON.parse(store.get(OPT_KEY)) || {}); } catch (_) {}
      this.data = this.loadData();
      this.audio = new S.Audio(); this.audio.sfxVol = this.options.sfx; this.audio.musicVol = this.options.music;
      try { this.renderer = new S.Renderer(this.glc); } catch (err) { this.fail(err); return; }
      this.keys = new Set(); this.pressed = {}; this.mouse = { dx: 0, dy: 0, l: false, r: false, m: false };
      this.cam = { x: 0, y: 3, z: -10, lx: 0, ly: 1, lz: 0, fov: 60 }; this.camS = { yaw: 0, pitch: 0.3, dist: 6.4, manualT: 9, px: null };
      this.flash = null; this.cards = []; this.popups = []; this.orbShown = 0; this.state = 'title'; this.acc = 0; this.last = 0; this.gp = { prev: [] };
      this.bind();
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(root); this.resize();
      this.setupBackdrop();
      this.titleScreen();
      this.frame = this.frame.bind(this); this.raf = requestAnimationFrame(this.frame);
      if (opts.onReady) opts.onReady(this);
    }
    fail(err) { this.failed = true; const el = this.root.querySelector('.dm98-err'); el.textContent = 'Не удалось запустить Direct3D-ускорение (WebGL): ' + (err && err.message ? err.message : ''); el.style.display = 'block'; }
    loadData() { let d = null; try { d = JSON.parse(store.get(SAVE_KEY)); } catch (_) {} const n = newProfile(); if (!d || d.v !== 1) return n; d.profile = Object.assign(S.defaultSave(), d.profile || {}); d.profile.items = Object.assign(S.defaultSave().items, d.profile.items || {}); return Object.assign(n, d); }
    saveData() { store.set(SAVE_KEY, JSON.stringify(this.data)); }
    saveOptions() { store.set(OPT_KEY, JSON.stringify(this.options)); this.audio.sfxVol = this.options.sfx; this.audio.musicVol = this.options.music; this.audio.applyVolume(); this.resize(); }
    hasSave() { return this.data.unlocked > 0 || this.data.profile.orbs > 0; }

    resize() {
      const r = this.root.getBoundingClientRect(); if (!r.width || !r.height) return;
      const dpr = Math.min(2, globalThis.devicePixelRatio || 1), W = RES[this.options.res] || 640;
      const w = Math.min(Math.round(r.width * dpr), W), h = Math.round(w * r.height / r.width);
      if (this.renderer) this.renderer.resize(Math.max(160, w), Math.max(120, h));
      this.glc.style.imageRendering = this.options.res <= 1 ? 'pixelated' : 'auto';
      this.hud.width = Math.round(r.width * dpr); this.hud.height = Math.round(r.height * dpr); this.dpr = dpr;
    }
    locked() { return document.pointerLockElement === this.glc; }
    bind() {
      const sig = { signal: this.ac.signal }, root = this.root;
      root.addEventListener('keydown', e => this.onKey(e, true), sig);
      root.addEventListener('keyup', e => this.onKey(e, false), sig);
      root.addEventListener('mousedown', e => {
        if (e.target.closest && e.target.closest('.dm98-ov > *')) return;
        root.focus({ preventScroll: true }); this.audio.resume();
        if (this.state === 'title') { this.mainMenu(); return; }
        if (this.state !== 'play') return;
        if (e.button === 0) { this.mouse.l = true; this.pressed.sword = true; }
        if (e.button === 2) { this.mouse.r = true; this.pressed.gun = true; }
        if (e.button === 1) { e.preventDefault(); this.pressed.bring = true; }
      }, sig);
      document.addEventListener('mouseup', e => { if (e.button === 0) this.mouse.l = false; if (e.button === 2) this.mouse.r = false; }, sig);
      root.addEventListener('contextmenu', e => e.preventDefault(), sig);
      root.addEventListener('dblclick', () => { if (this.state === 'play' && !this.locked() && this.glc.requestPointerLock) { try { const p = this.glc.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (_) {} } }, sig);
      document.addEventListener('mousemove', e => { if (this.state !== 'play') return; if (this.locked() || (e.buttons & 4)) { this.mouse.dx += e.movementX || 0; this.mouse.dy += e.movementY || 0; } }, sig);
      root.addEventListener('blur', () => { this.keys.clear(); this.mouse.l = this.mouse.r = false; }, sig);
    }
    onKey(e, down) {
      const c = e.code;
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(c)) e.preventDefault();
      if (!down) { this.keys.delete(c); return; }
      this.audio.resume();
      if (this.state === 'title') { if (c === 'Enter' || c === 'Space') this.mainMenu(); return; }
      if (this.onMenuKey && this.onMenuKey(c, e)) return;
      if (this.state !== 'play') return;
      if (e.repeat) return;
      this.keys.add(c);
      const g = this.game;
      if (g && g.cut) { if (c === 'Enter' || c === 'Escape' || c === 'Space') this.pressed.skip = true; return; }
      if (c === 'Escape') { this.pauseMenu(); return; }
      if (c === 'Enter' && g && g.nearStatue) { this.shop(true); return; }
      if (c === 'Tab') { this.showObj = !this.showObj; return; }
      if (c === 'KeyC') { this.camS.yaw = g.player.face; this.camS.manualT = 0; return; }
      if (KEYMAP[c]) this.pressed[KEYMAP[c]] = true;
      if (ITEM_KEYS[c]) this.pressed.item = ITEM_KEYS[c];
    }
    pollPad() {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [], gp = Array.from(pads || []).find(p => p && p.connected);
      if (!gp) return null;
      const b = i => gp.buttons[i] && gp.buttons[i].pressed, prev = this.gp.prev, st = gp.buttons.map(x => x.pressed);
      const edge = i => b(i) && !prev[i];
      this.gp.prev = st;
      if (this.state === 'play') {
        const map = { 3: 'sword', 2: 'gun', 1: 'bring', 0: 'jump', 6: 'exceed', 4: 'dtk', 8: 'taunt' };
        for (const i in map) if (edge(+i)) this.pressed[map[i]] = true;
        if (edge(9)) { if (this.game && this.game.cut) this.pressed.skip = true; else this.pauseMenu(); }
        if (edge(12) && this.game && this.game.nearStatue) this.shop(true);
      } else if (edge(0) || edge(9)) { if (this.state === 'title') this.mainMenu(); }
      const dz = v => Math.abs(v) < 0.2 ? 0 : v;
      return { mx: dz(gp.axes[0] || 0), mz: -dz(gp.axes[1] || 0), cx: dz(gp.axes[2] || 0), cy: dz(gp.axes[3] || 0), lock: b(5), sword: b(3), gun: b(2) };
    }
    input(pad) {
      const k = this.keys, P = this.pressed, inp = {};
      inp.mx = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
      inp.mz = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
      if (pad && (pad.mx || pad.mz)) { inp.mx = pad.mx; inp.mz = pad.mz; }
      inp.lock = k.has('ShiftLeft') || k.has('ShiftRight') || !!(pad && pad.lock);
      inp.swordHeld = k.has('KeyJ') || this.mouse.l || !!(pad && pad.sword);
      inp.gunHeld = k.has('KeyK') || this.mouse.r || !!(pad && pad.gun);
      inp.cam = this.camS.yaw;
      for (const key of ['sword', 'gun', 'bring', 'jump', 'exceed', 'dtk', 'taunt', 'skip']) if (P[key]) inp[key] = true;
      if (P.item) inp.item = P.item;
      this.pressed = {};
      return inp;
    }

    setupBackdrop() {
      if (this.failed) return;
      this.bg = new S.Game({ mission: 0, skipIntro: true, noCuts: true, diff: 1 });
      this.bg.player.hidden = true;
      this.renderer.setArea(this.bg);
      this.bgT = 0;
    }
    clearOv() { this.ov.innerHTML = ''; this.ov.style.display = 'none'; this.onMenuKey = null; }
    ovShow(html, cls = '') {
      this.ov.innerHTML = `<div class="dm98-panel ${cls}">${html}</div>`; this.ov.style.display = 'flex';
      const btns = [...this.ov.querySelectorAll('[data-a]')].filter(b => !b.disabled);
      this.menuIx = 0; btns.forEach((b, i) => b.addEventListener('mouseenter', () => { this.menuIx = i; this.focusBtn(btns); }));
      this.focusBtn(btns);
      this.onMenuKey = (c) => {
        const list = [...this.ov.querySelectorAll('[data-a]')].filter(b => !b.disabled);
        if (!list.length) return true;
        if (c === 'ArrowDown' || c === 'KeyS' || c === 'ArrowRight' && list[0].closest('.row')) { this.menuIx = (this.menuIx + 1) % list.length; this.focusBtn(list); this.audio.play('ui_move'); return true; }
        if (c === 'ArrowUp' || c === 'KeyW' || c === 'ArrowLeft' && list[0].closest('.row')) { this.menuIx = (this.menuIx - 1 + list.length) % list.length; this.focusBtn(list); this.audio.play('ui_move'); return true; }
        if (c === 'Enter' || c === 'Space' || c === 'KeyJ') { list[this.menuIx] && list[this.menuIx].click(); return true; }
        if (c === 'Escape' && this.escBack) { this.escBack(); return true; }
        return true;
      };
      return this.ov.firstChild;
    }
    focusBtn(list) { list.forEach((b, i) => b.classList.toggle('sel', i === this.menuIx)); }
    on(a, fn) { const el = this.ov.querySelector(`[data-a="${a}"]`); if (el) el.addEventListener('click', () => { this.audio.play('ui_click'); fn(el); }); }
    onAll(sel, fn) { this.ov.querySelectorAll(sel).forEach(el => el.addEventListener('click', () => { this.audio.play('ui_click'); fn(el); })); }

    titleScreen() {
      this.state = 'title'; this.escBack = null; this.clearOv(); this.audio.music('menu');
      this.ov.style.display = 'flex';
      this.ov.innerHTML = `<div class="dm98-title"><div class="dm98-logo"><div class="dm98-logo-s">CAPCOM · 2000</div><div class="dm98-logo-t">DEVIL MAY CRY</div><div class="dm98-logo-4">4</div><div class="dm98-logo-e">Win 98 Edition</div></div><div class="dm98-press">НАЖМИТЕ ENTER</div><div class="dm98-copy">© CAPCOM CO., LTD. 2000 · Русская версия</div></div>`;
      this.onMenuKey = null;
    }
    mainMenu() {
      this.state = 'menu'; this.audio.music('menu'); this.escBack = () => this.titleScreen();
      const d = this.data;
      this.ovShow(`<div class="dm98-logo small"><div class="dm98-logo-t">DEVIL MAY CRY</div><div class="dm98-logo-4">4</div></div>
        <div class="dm98-menu">
          ${this.hasSave() ? `<button class="dm98-btn" data-a="cont">Продолжить</button>` : ''}
          <button class="dm98-btn" data-a="new">Новая игра</button>
          <button class="dm98-btn" data-a="sel" ${this.hasSave() ? '' : 'disabled'}>Выбор миссии</button>
          <button class="dm98-btn" data-a="shop" ${this.hasSave() ? '' : 'disabled'}>Статуя божества</button>
          <button class="dm98-btn" data-a="ctl">Управление</button>
          <button class="dm98-btn" data-a="opt">Настройки</button>
          ${this.opts.onExit ? '<button class="dm98-btn" data-a="exit">Выход</button>' : ''}
        </div>
        <div class="dm98-foot">Красные сферы: ${d.profile.orbs} · Гордые души: ${d.profile.souls}${d.done ? ' · Игра пройдена' : ''}</div>`, 'dm98-main');
      this.on('cont', () => this.missionIntro(Math.min(d.unlocked, S.MISSIONS.length - 1), d.diff));
      this.on('new', () => this.newGame());
      this.on('sel', () => this.missionSelect());
      this.on('shop', () => this.shop(false));
      this.on('ctl', () => this.controls(() => this.mainMenu()));
      this.on('opt', () => this.optionsMenu(() => this.mainMenu()));
      this.on('exit', () => this.opts.onExit && this.opts.onExit());
    }
    newGame() {
      this.escBack = () => this.mainMenu();
      const warn = this.hasSave() ? '<p class="dm98-warn">Прогресс, сферы и навыки будут сброшены.</p>' : '';
      this.ovShow(`<h2>Выберите сложность</h2>${warn}<div class="dm98-list">${D.DIFF.map((df, i) => `<button class="dm98-item" data-a="d${i}" ${df.locked && !this.data.sos ? 'disabled' : ''}><b>${esc(df.name)}</b><span>${df.locked && !this.data.sos ? 'Откроется после прохождения игры.' : esc(df.desc)}</span></button>`).join('')}</div><div class="dm98-menu row"><button class="dm98-btn sm" data-a="back">Назад</button></div>`);
      D.DIFF.forEach((df, i) => this.on('d' + i, () => { const sos = this.data.sos; this.data = newProfile(); this.data.sos = sos; this.data.diff = i; this.saveData(); this.missionIntro(0, i); }));
      this.on('back', () => this.mainMenu());
    }
    missionSelect() {
      this.escBack = () => this.mainMenu();
      const d = this.data;
      this.selDiff = this.selDiff == null ? d.diff : this.selDiff;
      const rows = S.MISSIONS.map((m, i) => { const best = d.best[`${this.selDiff}:${m.id}`]; const open = i <= d.unlocked; return `<button class="dm98-item mission" data-a="m${i}" ${open ? '' : 'disabled'}><b>MISSION ${String(m.num).padStart(2, '0')} · ${esc(m.name)}</b><span>${open ? esc(m.ru + ' — ' + m.place) : '???'}</span><em>${best != null ? D.GRADES[best] : '—'}</em></button>`; }).join('');
      this.ovShow(`<h2>Выбор миссии</h2><div class="dm98-menu row">${D.DIFF.map((df, i) => `<button class="dm98-btn sm ${i === this.selDiff ? 'on' : ''}" data-a="df${i}" ${df.locked && !d.sos ? 'disabled' : ''}>${esc(df.name)}</button>`).join('')}</div><div class="dm98-list">${rows}</div><div class="dm98-menu row"><button class="dm98-btn sm" data-a="back">Назад</button></div>`, 'dm98-wide');
      D.DIFF.forEach((df, i) => this.on('df' + i, () => { this.selDiff = i; this.missionSelect(); }));
      S.MISSIONS.forEach((m, i) => this.on('m' + i, () => this.missionIntro(i, this.selDiff)));
      this.on('back', () => this.mainMenu());
    }
    missionIntro(mi, diff) {
      this.escBack = () => this.mainMenu();
      const m = S.MISSIONS[mi];
      this.pending = { mi, diff };
      this.ovShow(`<div class="dm98-card"><div class="dm98-mnum">MISSION ${String(m.num).padStart(2, '0')}</div><div class="dm98-mname">${esc(m.name)}</div><div class="dm98-mru">«${esc(m.ru)}» · ${esc(m.place)}</div><p class="dm98-goal">${esc(m.goal)}</p><div class="dm98-sub">Сложность: ${esc(D.DIFF[diff].name)}</div></div>
        <div class="dm98-menu"><button class="dm98-btn" data-a="go">Начать миссию</button><button class="dm98-btn" data-a="shop">Статуя божества</button><button class="dm98-btn" data-a="back">Назад</button></div>`, 'dm98-intro');
      this.on('go', () => this.startMission(mi, diff));
      this.on('shop', () => this.shop(false, () => this.missionIntro(mi, diff)));
      this.on('back', () => this.mainMenu());
    }
    controls(back) {
      this.escBack = back;
      this.ovShow(`<h2>Управление</h2><table class="dm98-tbl">${D.CONTROLS.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table><p class="dm98-note">Геймпад: Y — меч, X — револьвер, B — рука дьявола, A — прыжок, RB — захват, LT — Exceed, LB — Devil Trigger. Двойной щелчок по игре захватывает мышь для управления камерой.</p><div class="dm98-menu row"><button class="dm98-btn sm" data-a="back">Назад</button></div>`, 'dm98-wide');
      this.on('back', back);
    }
    optionsMenu(back) {
      this.escBack = back;
      const o = this.options, resN = ['320 (пикселизация)', '480', '640', '960'];
      this.ovShow(`<h2>Настройки</h2><div class="dm98-opts">
        <label>Звуки <input type="range" min="0" max="1" step="0.05" value="${o.sfx}" data-o="sfx"></label>
        <label>Музыка <input type="range" min="0" max="1" step="0.05" value="${o.music}" data-o="music"></label>
        <label>Разрешение <select data-o="res">${resN.map((n, i) => `<option value="${i}" ${i === o.res ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label><input type="checkbox" data-o="autoCam" ${o.autoCam ? 'checked' : ''}> Камера сама разворачивается за Неро</label>
        <label><input type="checkbox" data-o="invert" ${o.invert ? 'checked' : ''}> Инвертировать мышь по вертикали</label>
        <label><input type="checkbox" data-o="tips" ${o.tips ? 'checked' : ''}> Подсказки</label>
      </div><div class="dm98-menu row"><button class="dm98-btn sm" data-a="back">Готово</button></div>`);
      this.ov.querySelectorAll('[data-o]').forEach(el => el.addEventListener('input', () => { const k = el.dataset.o; o[k] = el.type === 'checkbox' ? el.checked : el.tagName === 'SELECT' ? +el.value : +el.value; this.saveOptions(); }));
      this.on('back', back);
    }

    price(id) { const it = D.ITEMS[id], n = this.shopSave().bought[id] || 0; return Math.round(it.base * Math.pow(it.grow, n) / 10) * 10; }
    skillPrice(id) { return D.SKILLS[id].base + this.shopSave().skillCount * D.SKILL_STEP; }
    shopSave() { return this.game && this.state === 'shop' && this.shopInGame ? this.game.save : this.data.profile; }
    shop(inGame, back) {
      this.state = 'shop'; this.shopInGame = inGame; this.shopTab = this.shopTab || 'items';
      if (inGame) { this.audio.pause(false); this.releaseMouse(); }
      const done = () => { if (inGame) { this.clearOv(); this.state = 'play'; } else if (back) back(); else this.mainMenu(); };
      this.escBack = done;
      const sv = this.shopSave(), dtOK = sv.dt;
      const count = id => id === 'blueOrb' ? sv.blue : id === 'purpleOrb' ? sv.purple : (sv.items[id] || 0);
      const rows = this.shopTab === 'items'
        ? Object.keys(D.ITEMS).map(id => { const it = D.ITEMS[id], p = this.price(id), c = count(id), lock = it.needDT && !dtOK, max = c >= it.max; return `<div class="dm98-shoprow"><div><b>${esc(it.name)}</b><span>${esc(lock ? 'Недоступно, пока не пробуждён Devil Trigger.' : it.desc)}</span></div><em>${it.perm ? `${c}/${it.max}` : '×' + c}</em><button class="dm98-btn sm" data-a="b_${id}" ${lock || max || sv.orbs < p ? 'disabled' : ''}>${max ? 'Максимум' : p + ' ◆'}</button></div>`; }).join('')
        : Object.keys(D.SKILLS).map(id => { const sk = D.SKILLS[id], has = sv.skills[id], p = this.skillPrice(id), need = sk.need && !sv.skills[sk.need]; return `<div class="dm98-shoprow"><div><b>${esc(sk.name)}</b> <small>${esc(sk.group)}</small><span>${esc(sk.desc)}${need ? ' (сначала ' + esc(D.SKILLS[sk.need].name) + ')' : ''}</span></div><em>${has ? '✔' : ''}</em><button class="dm98-btn sm" data-a="s_${id}" ${has || need || sv.souls < p ? 'disabled' : ''}>${has ? 'Изучено' : p + ' ✦'}</button></div>`; }).join('');
      this.ovShow(`<h2>Статуя божества</h2><div class="dm98-wallet"><span class="orb">◆ Красные сферы: <b>${sv.orbs}</b></span><span class="soul">✦ Гордые души: <b>${sv.souls}</b></span></div>
        <div class="dm98-menu row"><button class="dm98-btn sm ${this.shopTab === 'items' ? 'on' : ''}" data-a="tabI">Предметы</button><button class="dm98-btn sm ${this.shopTab === 'skills' ? 'on' : ''}" data-a="tabS">Навыки</button></div>
        <div class="dm98-shop">${rows}</div><p class="dm98-note">${this.shopTab === 'skills' ? 'Каждый изученный навык делает остальные дороже.' : 'Каждая покупка поднимает цену предмета.'}</p><div class="dm98-menu row"><button class="dm98-btn sm" data-a="back">${inGame ? 'Вернуться' : 'Назад'}</button></div>`, 'dm98-wide dm98-statue');
      this.on('tabI', () => { this.shopTab = 'items'; this.shop(inGame, back); });
      this.on('tabS', () => { this.shopTab = 'skills'; this.shop(inGame, back); });
      Object.keys(D.ITEMS).forEach(id => this.on('b_' + id, () => {
        const p = this.price(id); if (sv.orbs < p) return;
        sv.orbs -= p; sv.bought[id] = (sv.bought[id] || 0) + 1;
        if (id === 'blueOrb') { sv.blue++; if (this.game && inGame) this.game.player.hp = this.game.maxHp; }
        else if (id === 'purpleOrb') sv.purple++;
        else sv.items[id] = (sv.items[id] || 0) + 1;
        this.audio.play('orbbig'); if (!inGame) this.saveData(); this.shop(inGame, back);
      }));
      Object.keys(D.SKILLS).forEach(id => this.on('s_' + id, () => { const p = this.skillPrice(id); if (sv.souls < p) return; sv.souls -= p; sv.skills[id] = true; sv.skillCount++; this.audio.play('keyitem'); if (!inGame) this.saveData(); this.shop(inGame, back); }));
      this.on('back', done);
    }

    startMission(mi, diff) {
      this.clearOv(); this.state = 'loading'; this.loadT = 0.6; this.loadName = S.MISSIONS[mi].name;
      this.data.diff = diff; this.saveData();
      setTimeout(() => {
        if (this.destroyed) return;
        this.game = new S.Game({ mission: mi, diff, save: this.data.profile, seed: (Date.now() & 0xffff) + 1 });
        this.renderer.setArea(this.game);
        this.state = 'play'; this.camS = { yaw: this.game.player.face, pitch: 0.3, dist: 6.4, manualT: 9, px: null };
        this.orbShown = this.game.save.orbs; this.flash = null; this.cards = []; this.popups = [];
        this.handleEvents();
        this.root.focus({ preventScroll: true });
      }, 60);
    }
    releaseMouse() { if (this.locked() && document.exitPointerLock) document.exitPointerLock(); }
    pauseMenu() {
      if (this.state !== 'play') return;
      this.state = 'pause'; this.audio.pause(true); this.releaseMouse();
      const resume = () => { this.clearOv(); this.state = 'play'; this.audio.pause(false); };
      this.escBack = resume;
      const m = this.game.M;
      this.ovShow(`<h2>Пауза</h2><div class="dm98-sub">MISSION ${String(m.num).padStart(2, '0')} · ${esc(m.name)} — ${esc(m.goal)}</div><div class="dm98-menu"><button class="dm98-btn" data-a="res">Продолжить</button><button class="dm98-btn" data-a="ctl">Управление</button><button class="dm98-btn" data-a="opt">Настройки</button><button class="dm98-btn" data-a="rst">Начать миссию заново</button><button class="dm98-btn" data-a="quit">Выйти в главное меню</button></div>`);
      this.on('res', resume);
      this.on('ctl', () => this.controls(() => { this.state = 'play'; this.pauseMenu(); }));
      this.on('opt', () => this.optionsMenu(() => { this.state = 'play'; this.pauseMenu(); }));
      this.on('rst', () => { this.audio.pause(false); this.startMission(this.game.mi, this.game.diffIx); });
      this.on('quit', () => { this.audio.pause(false); this.quitToMenu(); });
    }
    quitToMenu() { this.game = null; this.clearOv(); this.renderer.setArea(this.bg); this.mainMenu(); }
    deadMenu() {
      this.state = 'dead'; this.releaseMouse();
      this.ovShow(`<h2 class="red">Неро пал</h2><div class="dm98-sub">CONTINUE?</div><div class="dm98-menu"><button class="dm98-btn" data-a="yes">Да — с начала зоны</button><button class="dm98-btn" data-a="no">Нет — в главное меню</button></div>`);
      this.escBack = null;
      this.on('yes', () => { this.clearOv(); this.game.continueGame(); this.renderer.setArea(this.game); this.state = 'play'; this.handleEvents(); });
      this.on('no', () => this.quitToMenu());
    }
    results() {
      const g = this.game, R = g.result, d = this.data;
      this.state = 'results'; this.releaseMouse(); this.audio.music('results');
      d.profile = g.save;
      const key = `${g.diffIx}:${g.M.id}`; d.best[key] = Math.max(d.best[key] == null ? -1 : d.best[key], R.rank);
      d.unlocked = Math.max(d.unlocked, Math.min(S.MISSIONS.length - 1, g.mi + 1));
      if (g.gameComplete) { d.done = true; d.sos = true; }
      this.saveData();
      const G = D.GRADES, s = R.stats;
      const row = (n, v, gr) => `<tr><td>${n}</td><td>${v}</td><td class="gr g${gr}">${G[gr]}</td></tr>`;
      this.ovShow(`<div class="dm98-clear">MISSION CLEAR</div><div class="dm98-sub">MISSION ${String(g.M.num).padStart(2, '0')} · ${esc(g.M.name)} · ${esc(g.diff.name)}</div>
        <table class="dm98-res">${row('Время', fmtTime(s.time), R.time)}${row('Стильные очки', Math.round(s.style), R.style)}${row('Красные сферы', s.orbs, R.orbs)}</table>
        <div class="dm98-resx">Предметов использовано: ${s.items} · Продолжений: ${s.deaths} · Убито демонов: ${s.kills}</div>
        <div class="dm98-rank g${R.rank}">${G[R.rank]}</div>
        <div class="dm98-bonus">✦ Гордые души: +${R.souls} &nbsp; ◆ Бонус сфер: +${R.bonus}</div>
        <div class="dm98-menu row"><button class="dm98-btn" data-a="next">${g.gameComplete ? 'Финал' : g.mi + 1 < S.MISSIONS.length ? 'Следующая миссия' : 'В меню'}</button><button class="dm98-btn" data-a="menu">Главное меню</button></div>`, 'dm98-results');
      this.audio.play(R.rank >= 4 ? 'rankS' : 'rank');
      this.escBack = null;
      this.on('next', () => { if (g.gameComplete) this.credits(); else if (g.mi + 1 < S.MISSIONS.length) { this.game = null; this.renderer.setArea(this.bg); this.missionIntro(g.mi + 1, g.diffIx); } else this.quitToMenu(); });
      this.on('menu', () => this.quitToMenu());
    }
    credits() {
      this.game = null; this.renderer.setArea(this.bg); this.state = 'menu'; this.audio.music('menu');
      const lines = ['DEVIL MAY CRY 4', 'Win 98 Edition', '', 'Неро — Red Queen, Blue Rose, Devil Bringer', 'Данте · Кирие · Кредо · Санктус · Агнус', '', 'Пять миссий:', 'Birds of Feathers', "La Porte De L'Enfer", 'Cold Blooded', 'Resurrection', 'Profession of Faith', '', 'Производство: CAPCOM Production Studio (2000)', 'Порт для Win 98: команда «Фортуна»', 'Русская версия', '', 'Открыта сложность «Сын Спарды»', '', 'ПРОДОЛЖЕНИЕ СЛЕДУЕТ...'];
      this.ovShow(`<div class="dm98-credits"><div class="roll">${lines.map(l => `<p>${esc(l) || '&nbsp;'}</p>`).join('')}</div></div><div class="dm98-menu row"><button class="dm98-btn" data-a="menu">Главное меню</button></div>`, 'dm98-wide');
      this.escBack = () => this.mainMenu();
      this.on('menu', () => this.mainMenu());
    }

    handleEvents() {
      const g = this.game; if (!g) return;
      const evs = g.events.splice(0);
      this.renderer.events(evs, g);
      for (const e of evs) {
        switch (e.t) {
          case 'sfx': this.audio.play(e.s, e.x, e.y, e.z, e.v); break;
          case 'music': this.audio.music(e.m === 'explore' ? (g.env.music === 'boss' ? 'explore' : g.env.music || 'explore') : e.m); break;
          case 'area': this.renderer.setArea(g); this.cards.push({ text: g.env.name || '', t: 0, life: 2.6, kind: 'area' }); if (!g.fight && !g.boss) this.audio.music(g.env.music === 'boss' ? 'explore' : g.env.music || 'explore'); this.camS.yaw = g.player.face; this.camS.px = null; break;
          case 'flash': this.flash = { c: e.c, a: e.a, t: 0 }; break;
          case 'missionCard': this.cards.push({ mission: true, t: 0, life: 3.4 }); if (!g.fight && !g.boss) this.audio.music(g.env.music === 'boss' ? 'battle' : g.env.music || 'explore'); break;
          case 'rank': this.audio.play(e.r >= 4 ? 'rankS' : 'rank'); break;
          case 'bark': this.popups.push({ text: `${e.who}: ${e.text}`, t: 0, life: 3.2 }); break;
          case 'taunt': this.popups.push({ text: ['Давай, иди сюда!', 'И это всё?', 'Скукота...', 'Ну же!'][Math.floor(Math.random() * 4)], t: 0, life: 1.5, small: true }); break;
          case 'clear': this.clearT = 0; break;
          case 'exact': this.exFlash = e.max ? 2 : 1; break;
          default: break;
        }
      }
    }

    updateCam(dt, pad) {
      const g = this.game, C = this.camS;
      if (!g) return;
      if (g.cut && g.cut.cam) { const c = g.cut.cam; this.cam = { x: c[0], y: c[1], z: c[2], lx: c[3], ly: c[4], lz: c[5], fov: 55 }; C.px = null; return; }
      const p = g.player;
      let turn = (this.keys.has('KeyQ') ? -1 : 0) + (this.keys.has('KeyE') ? 1 : 0);
      if (pad && pad.cx) turn += pad.cx;
      if (turn) { C.yaw += turn * 2.4 * dt; C.manualT = 0; }
      if (this.mouse.dx || this.mouse.dy) { C.yaw += this.mouse.dx * 0.0045; C.pitch = clamp(C.pitch + this.mouse.dy * 0.003 * (this.options.invert ? -1 : 1), -0.1, 1.1); C.manualT = 0; this.mouse.dx = this.mouse.dy = 0; }
      if (pad && pad.cy) C.pitch = clamp(C.pitch + pad.cy * 1.5 * dt, -0.1, 1.1);
      C.manualT += dt;
      const lock = p.lock && !p.lock.dead ? p.lock : null, boss = g.boss && !g.boss.won ? g.boss : null;
      if (lock) { const want = Math.atan2(lock.x - p.x, lock.z - p.z); C.yaw += clamp(wrapAng(want - C.yaw), -2.6 * dt, 2.6 * dt); }
      else if (this.options.autoCam && C.manualT > 1.2 && Math.hypot(p.vx, p.vz) > 2 && p.ground) { const want = Math.atan2(p.vx, p.vz), d = wrapAng(want - C.yaw); if (Math.abs(d) < 2.4) C.yaw += clamp(d, -0.9 * dt, 0.9 * dt) * Math.min(1, Math.abs(Math.sin(d)) * 2); }
      const big = boss && (boss.type === 'berial' || boss.type === 'bael') ? 1 : 0;
      const dist = lerp(6.2, 10, big), pitch = C.pitch + big * 0.12;
      const tx = p.x, ty = p.y + 1.45 + big * 0.8, tz = p.z;
      let dx = -Math.sin(C.yaw) * Math.cos(pitch), dy = Math.sin(pitch), dz = -Math.cos(C.yaw) * Math.cos(pitch);
      const hit = g.W.ray(tx, ty, tz, dx, dy, dz, dist + 0.4);
      const dd = Math.max(1.2, Math.min(dist, hit - 0.4));
      const want = [tx + dx * dd, ty + dy * dd, tz + dz * dd], B = g.def.bounds;
      if (B) { want[0] = clamp(want[0], B[0] + 0.5, B[2] - 0.5); want[2] = clamp(want[2], B[1] + 0.5, B[3] - 0.5); }
      if (!C.px) C.px = want.slice();
      const k = Math.min(1, dt * 10);
      for (let i = 0; i < 3; i++) C.px[i] += (want[i] - C.px[i]) * k;
      let lx = tx, ly = ty - 0.2, lz = tz;
      if (lock) { lx = lerp(tx, lock.x, 0.3); lz = lerp(tz, lock.z, 0.3); ly = lerp(ty - 0.2, lock.y + 1.2, 0.2); }
      this.cam = { x: C.px[0], y: C.px[1], z: C.px[2], lx, ly, lz, fov: 62 };
    }

    frame(ts) {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(this.frame);
      if (this.failed) return;
      const dt = Math.min(0.1, this.last ? (ts - this.last) / 1000 : 0.016); this.last = ts;
      const active = !this.opts.isActive || this.opts.isActive();
      const pad = this.pollPad();
      const g = this.game;
      if (g && (this.state === 'play' || this.state === 'dead') && active) {
        const scale = g.slowmo > 0 ? 0.35 : 1; if (g.slowmo > 0) g.slowmo -= dt;
        this.acc += dt * scale;
        let steps = 0;
        while (this.acc >= DT && steps < 5) {
          this.acc -= DT; steps++;
          const inp = this.input(pad);
          g.tick(inp);
          this.handleEvents();
          if (g.state === 'dead' && this.state === 'play' && g.deadT > 1.6) this.deadMenu();
          if (g.state === 'clear' && this.state === 'play') { this.clearT = (this.clearT || 0) + DT; if (this.clearT > 0.5) { this.results(); break; } }
        }
        if (steps >= 5) this.acc = 0;
        this.updateCam(dt, pad);
        this.audio.setListener(this.cam.x, this.cam.y, this.cam.z, Math.atan2(this.cam.lx - this.cam.x, this.cam.lz - this.cam.z));
        this.renderer.step(dt * scale, g);
        this.renderer.render(g, this.cam);
      } else if (g && this.state !== 'loading') {
        this.renderer.render(g, this.cam);
      } else if (this.bg) {
        this.bgT += dt;
        const a = this.bgT * 0.08;
        this.cam = { x: Math.sin(a) * 9, y: 5 + Math.sin(this.bgT * 0.2), z: -4 + Math.cos(a) * 10, lx: 0, ly: 3, lz: 12, fov: 60 };
        this.renderer.step(dt, this.bg);
        this.renderer.render(this.bg, this.cam);
      }
      this.audio.update();
      this.drawHud(dt);
    }

    drawHud(dt) {
      const x = this.hx, W = this.hud.width, H = this.hud.height, s = H / 600;
      x.clearRect(0, 0, W, H);
      const g = this.game;
      if (this.state === 'loading') { x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.fillStyle = '#c8b890'; x.font = `italic ${24 * s}px ${GOTH}`; x.textAlign = 'center'; x.fillText('Загрузка...', W / 2, H / 2); return; }
      if (!g || this.state === 'results' || (this.state === 'menu' && !g)) { if (this.state === 'title' || this.state === 'menu' || this.state === 'shop') this.vignette(x, W, H, 0.7); return; }
      if (this.state === 'shop' && !this.shopInGame) return;
      const p = g.player;
      if (g.cut) { this.drawCut(x, W, H, s); this.drawFlash(x, W, H, dt); return; }
      if (p.hp < g.maxHp * 0.3) { const k = 0.25 + Math.sin(performance.now() / 200) * 0.1; const gr = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8); gr.addColorStop(0, 'rgba(120,0,0,0)'); gr.addColorStop(1, `rgba(140,0,0,${k})`); x.fillStyle = gr; x.fillRect(0, 0, W, H); }
      if (p.dtOn) { x.fillStyle = 'rgba(40,60,160,0.12)'; x.fillRect(0, 0, W, H); }
      this.drawVitals(x, s, g);
      this.drawStyle(x, W, H, s, g, dt);
      this.drawOrbs(x, W, s, g, dt);
      this.drawLock(x, W, H, s, g);
      if (g.boss && !g.boss.won) this.drawBoss(x, W, H, s, g.boss);
      this.drawMsgs(x, W, H, s, g, dt);
      this.drawCards(x, W, H, s, dt);
      if (g.nearStatue) { x.textAlign = 'center'; x.font = `bold ${15 * s}px ${GOTH}`; x.fillStyle = '#9ad8ff'; x.fillText('Enter — Статуя божества', W / 2, H * 0.72); }
      if (this.showObj) { x.fillStyle = 'rgba(0,0,0,0.7)'; x.fillRect(W / 2 - 260 * s, 70 * s, 520 * s, 70 * s); x.strokeStyle = '#8a1a1a'; x.strokeRect(W / 2 - 260 * s, 70 * s, 520 * s, 70 * s); x.textAlign = 'center'; x.fillStyle = '#e0c890'; x.font = `italic bold ${17 * s}px ${GOTH}`; x.fillText(`MISSION ${String(g.M.num).padStart(2, '0')} — ${g.M.name}`, W / 2, 98 * s); x.font = `${14 * s}px ${GOTH}`; x.fillStyle = '#ddd'; x.fillText(g.M.goal + '  ·  ' + fmtTime(g.stats.time), W / 2, 124 * s); }
      if (g.transition) { const t = g.transition.t, a = t < 0.45 ? t / 0.45 : 1 - (t - 0.45) / 0.45; x.fillStyle = `rgba(0,0,0,${clamp(a, 0, 1)})`; x.fillRect(0, 0, W, H); }
      if (g.state === 'dead') { x.fillStyle = `rgba(60,0,0,${Math.min(0.6, g.deadT * 0.4)})`; x.fillRect(0, 0, W, H); }
      if (g.state === 'clear') { x.fillStyle = `rgba(0,0,0,${Math.min(1, (this.clearT || 0) * 2)})`; x.fillRect(0, 0, W, H); }
      this.drawFlash(x, W, H, dt);
    }
    vignette(x, W, H, a) { const gr = x.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.9); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${a})`); x.fillStyle = gr; x.fillRect(0, 0, W, H); }
    drawFlash(x, W, H, dt) { const f = this.flash; if (!f) return; f.t += Math.max(0, dt); const a = Math.min(0.6, f.a) * Math.max(0, 1 - f.t / 0.35); if (!(a > 0)) { this.flash = null; return; } x.fillStyle = `rgba(${f.c[0] * 255 | 0},${f.c[1] * 255 | 0},${f.c[2] * 255 | 0},${a})`; x.fillRect(0, 0, W, H); }
    drawVitals(x, s, g) {
      const p = g.player, X = 20 * s, Y = 20 * s, bw = (220 + (g.maxHp - 100) * 1.6) * s, bh = 16 * s;
      x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(X - 4 * s, Y - 4 * s, bw + 8 * s, bh + 8 * s);
      x.strokeStyle = '#b8a070'; x.lineWidth = 2 * s; x.strokeRect(X - 4 * s, Y - 4 * s, bw + 8 * s, bh + 8 * s);
      const k = clamp(p.hp / g.maxHp, 0, 1), gr = x.createLinearGradient(0, Y, 0, Y + bh); gr.addColorStop(0, '#9aff8a'); gr.addColorStop(0.5, '#2eb83a'); gr.addColorStop(1, '#0a5a14');
      x.fillStyle = gr; x.fillRect(X, Y, bw * k, bh);
      x.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 1; i < g.maxHp / 10; i++) x.fillRect(X + bw * i * 10 / g.maxHp, Y, 1.5 * s, bh);
      const ey = Y + bh + 10 * s;
      for (let i = 0; i < 3; i++) {
        const f = clamp(p.exceed - i, 0, 1), ex = X + i * 30 * s;
        x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(ex, ey, 26 * s, 9 * s);
        x.fillStyle = this.exFlash ? '#fff' : '#ff4a1a'; x.fillRect(ex + 1 * s, ey + 1 * s, 24 * s * f, 7 * s);
        x.strokeStyle = '#8a6a4a'; x.lineWidth = 1 * s; x.strokeRect(ex, ey, 26 * s, 9 * s);
      }
      if (this.exFlash) { this.exFlash = Math.max(0, this.exFlash - 0.05); if (this.exFlash < 0.05) this.exFlash = 0; }
      x.font = `italic bold ${11 * s}px ${GOTH}`; x.fillStyle = '#e0b080'; x.textAlign = 'left'; x.fillText('EXCEED', X + 96 * s, ey + 8 * s);
      if (g.save.dt) {
        const dy = ey + 16 * s, bars = g.dtMax / 100;
        for (let i = 0; i < bars; i++) { const f = clamp(p.dt / 100 - i, 0, 1), dx = X + i * 22 * s; x.beginPath(); x.arc(dx + 9 * s, dy + 9 * s, 8 * s, 0, 7); x.fillStyle = 'rgba(20,0,30,0.8)'; x.fill(); x.beginPath(); x.arc(dx + 9 * s, dy + 9 * s, 7 * s * f, 0, 7); x.fillStyle = p.dtOn ? '#9ab0ff' : '#b04aff'; x.fill(); x.strokeStyle = '#6a4a8a'; x.stroke(); }
        if (p.dtOn) { x.fillStyle = '#9ab0ff'; x.font = `italic bold ${12 * s}px ${GOTH}`; x.fillText('DEVIL TRIGGER', X + bars * 22 * s + 6 * s, dy + 13 * s); }
      }
      const it = g.save.items; x.font = `${11 * s}px ${GOTH}`; x.fillStyle = 'rgba(230,220,200,0.85)'; x.textAlign = 'left';
      x.fillText(`1 Звезда S ×${it.vitalS}   2 Звезда L ×${it.vitalL}   ${g.save.dt ? `3 Звезда дьявола ×${it.devilStar}   ` : ''}4 Святая вода ×${it.holyWater}${it.goldOrb ? `   Золотая сфера ×${it.goldOrb}` : ''}`, 20 * s, this.hud.height - 14 * s);
      if (p.charge > 0.2 && p.gunHeld) { const lv = S.chargeLevel(g, p.charge); x.fillStyle = ['#8aa', '#6af', '#48f', '#fff'][lv]; x.font = `bold ${12 * s}px ${IMP}`; x.fillText(lv ? `CHARGE ${lv}` : 'CHARGE', X, ey + (g.save.dt ? 52 : 28) * s); }
    }
    drawStyle(x, W, H, s, g) {
      const st = g.style, R = D.RANKS[st.rank];
      if (st.sp < 20 && st.rank === 0) return;
      const cx = W - 110 * s, cy = H * 0.34, k = 1 + st.flash * 0.35;
      const prog = st.rank < D.RANKS.length - 1 ? clamp((st.sp - R.need) / (D.RANKS[st.rank + 1].need - R.need), 0, 1) : clamp((st.sp - R.need) / (D.STYLE_MAX - R.need), 0, 1);
      x.save(); x.translate(cx, cy); x.scale(k, k);
      x.textAlign = 'center'; x.font = `italic bold ${64 * s}px ${GOTH}`; x.lineWidth = 5 * s; x.strokeStyle = 'rgba(0,0,0,0.8)'; x.strokeText(R.l, 0, 0); x.fillStyle = R.col; x.fillText(R.l, 0, 0);
      x.restore();
      x.textAlign = 'center'; x.font = `italic bold ${15 * s}px ${GOTH}`; x.fillStyle = R.col; x.strokeStyle = 'rgba(0,0,0,0.8)'; x.lineWidth = 3 * s; x.strokeText(R.name, cx, cy + 22 * s); x.fillText(R.name, cx, cy + 22 * s);
      x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(cx - 60 * s, cy + 30 * s, 120 * s, 6 * s); x.fillStyle = R.col; x.fillRect(cx - 60 * s, cy + 30 * s, 120 * s * prog, 6 * s);
    }
    drawOrbs(x, W, s, g, dt) {
      const target = g.save.orbs; this.orbShown += (target - this.orbShown) * Math.min(1, dt * 8); if (Math.abs(target - this.orbShown) < 0.5) this.orbShown = target;
      const X = W - 30 * s, Y = 34 * s;
      x.beginPath(); x.arc(X - 110 * s, Y - 6 * s, 10 * s, 0, 7); const gr = x.createRadialGradient(X - 113 * s, Y - 9 * s, 1, X - 110 * s, Y - 6 * s, 10 * s); gr.addColorStop(0, '#ffb0a0'); gr.addColorStop(0.5, '#e02010'); gr.addColorStop(1, '#500000'); x.fillStyle = gr; x.fill();
      x.textAlign = 'right'; x.font = `bold ${22 * s}px ${IMP}`; x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 3 * s; x.strokeText(String(Math.round(this.orbShown)), X, Y); x.fillText(String(Math.round(this.orbShown)), X, Y);
    }
    drawLock(x, W, H, s, g) {
      const p = g.player, t = p.lock; if (!t || t.dead) return;
      const q = this.renderer.project(t.x, t.y + (t.lure ? 0 : Math.min(t.h * 0.55, 2.5)), t.z); if (!q) return;
      const X = q[0] * W, Y = q[1] * H, r = 22 * s, a = performance.now() / 400;
      x.strokeStyle = 'rgba(255,60,40,0.9)'; x.lineWidth = 2 * s;
      for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(X, Y, r, a + i * PI / 2, a + i * PI / 2 + 0.9); x.stroke(); }
      if (t.maxHp && !t.boss) { x.strokeStyle = 'rgba(80,255,80,0.9)'; x.lineWidth = 3 * s; x.beginPath(); x.arc(X, Y, r + 6 * s, -PI / 2, -PI / 2 + PI * 2 * clamp(t.hp / t.maxHp, 0, 1)); x.stroke(); }
    }
    drawBoss(x, W, H, s, b) {
      const bw = 420 * s, X = W / 2 - bw / 2, Y = H - 52 * s;
      x.fillStyle = 'rgba(0,0,0,0.65)'; x.fillRect(X - 4 * s, Y - 4 * s, bw + 8 * s, 18 * s);
      x.strokeStyle = '#8a2a2a'; x.lineWidth = 2 * s; x.strokeRect(X - 4 * s, Y - 4 * s, bw + 8 * s, 18 * s);
      const k = clamp(b.hp / b.maxHp, 0, 1); const gr = x.createLinearGradient(0, Y, 0, Y + 10 * s); gr.addColorStop(0, '#ff8a6a'); gr.addColorStop(1, '#8a0a0a');
      x.fillStyle = gr; x.fillRect(X, Y, bw * k, 10 * s);
      if (b.type === 'berial' && b.flameMax) { x.fillStyle = '#ffb040'; x.fillRect(X, Y + 11 * s, bw * clamp(b.flame / b.flameMax, 0, 1), 3 * s); }
      if (b.type === 'credo' && b.guardMax) { x.fillStyle = '#a0c8ff'; x.fillRect(X, Y + 11 * s, bw * (1 - clamp(b.guardDmg / b.guardMax, 0, 1)), 3 * s); }
      x.textAlign = 'center'; x.font = `italic bold ${15 * s}px ${GOTH}`; x.fillStyle = '#f0d8b0'; x.fillText(b.type === 'agnus' ? 'Агнус — стекло кабины' : b.def.name, W / 2, Y - 9 * s);
    }
    drawMsgs(x, W, H, s, g, dt) {
      if (!this.options.tips) g.msgs = g.msgs.filter(m => m.kind !== 'tip');
      x.textAlign = 'center';
      g.msgs.forEach((m, i) => {
        const a = clamp(m.t * 2, 0, 1), y = H * 0.8 - (g.msgs.length - 1 - i) * 28 * s;
        x.font = `${m.kind === 'tip' ? 'italic ' : ''}${15 * s}px ${GOTH}`;
        const w = Math.min(W - 40 * s, x.measureText(m.text).width + 30 * s);
        x.fillStyle = `rgba(0,0,0,${0.6 * a})`; x.fillRect(W / 2 - w / 2, y - 17 * s, w, 24 * s);
        if (m.kind === 'tip') { x.strokeStyle = `rgba(90,140,220,${a})`; x.lineWidth = 1 * s; x.strokeRect(W / 2 - w / 2, y - 17 * s, w, 24 * s); }
        x.fillStyle = m.kind === 'tip' ? `rgba(170,210,255,${a})` : `rgba(240,225,190,${a})`;
        this.fitText(x, m.text, W / 2, y, W - 60 * s);
      });
      this.popups = this.popups.filter(p2 => (p2.t += dt) < p2.life);
      this.popups.forEach((p2, i) => { const a = clamp((p2.life - p2.t) * 2, 0, 1); x.font = `italic bold ${(p2.small ? 16 : 17) * s}px ${GOTH}`; x.fillStyle = `rgba(255,200,160,${a})`; x.strokeStyle = `rgba(0,0,0,${a})`; x.lineWidth = 3 * s; const y = H * 0.18 + i * 26 * s; x.strokeText(p2.text, W / 2, y); x.fillText(p2.text, W / 2, y); });
    }
    fitText(x, text, cx, y, maxW) { let t = text; while (x.measureText(t).width > maxW && t.length > 10) t = t.slice(0, -2); if (t !== text) t = t.slice(0, -1) + '…'; x.fillText(t, cx, y); }
    drawCards(x, W, H, s, dt) {
      const g = this.game;
      this.cards = this.cards.filter(c => (c.t += dt) < c.life);
      for (const c of this.cards) {
        const a = clamp(Math.min(c.t * 2, (c.life - c.t) * 1.5), 0, 1);
        x.textAlign = 'center';
        if (c.mission) {
          x.fillStyle = `rgba(0,0,0,${0.55 * a})`; x.fillRect(0, H * 0.36, W, H * 0.2);
          x.font = `italic bold ${20 * s}px ${GOTH}`; x.fillStyle = `rgba(200,40,40,${a})`; x.fillText(`MISSION ${String(g.M.num).padStart(2, '0')}`, W / 2, H * 0.42);
          x.font = `bold ${36 * s}px ${GOTH}`; x.fillStyle = `rgba(240,230,210,${a})`; x.fillText(g.M.name, W / 2, H * 0.49);
          x.font = `italic ${15 * s}px ${GOTH}`; x.fillStyle = `rgba(200,180,150,${a})`; x.fillText(`«${g.M.ru}»`, W / 2, H * 0.535);
        } else if (c.text) { x.font = `italic ${18 * s}px ${GOTH}`; x.fillStyle = `rgba(230,210,170,${a})`; x.strokeStyle = `rgba(0,0,0,${a})`; x.lineWidth = 3 * s; x.strokeText(c.text, W / 2, 90 * s); x.fillText(c.text, W / 2, 90 * s); }
      }
    }
    drawCut(x, W, H, s) {
      const R = this.game.cut, bar = H * 0.11;
      x.fillStyle = '#000'; x.fillRect(0, 0, W, bar); x.fillRect(0, H - bar, W, bar);
      if (R.fade > 0) { x.fillStyle = `rgba(0,0,0,${R.fade})`; x.fillRect(0, 0, W, H); }
      if (R.say && R.say[1]) {
        x.textAlign = 'center';
        const who = R.say[0], text = R.say[1], lines = this.wrap(x, text, W * 0.8, `${17 * s}px ${GOTH}`);
        let y = H - bar + 26 * s - (lines.length - 1) * 11 * s;
        if (who) { x.font = `bold ${14 * s}px ${GOTH}`; x.fillStyle = { 'Неро': '#8ab8ff', 'Данте': '#ff7a6a', 'Кирие': '#ffd0a0', 'Кредо': '#e8e8ff', 'Агнус': '#c0a0e0', 'Санктус': '#f0d890' }[who] || '#e8c080'; x.fillText(who, W / 2, y - 20 * s); }
        x.font = `${who ? '' : 'italic '}${17 * s}px ${GOTH}`; x.fillStyle = '#f0ece0';
        for (const l of lines) { x.fillText(l, W / 2, y); y += 22 * s; }
      }
      x.textAlign = 'right'; x.font = `${11 * s}px ${GOTH}`; x.fillStyle = 'rgba(200,200,200,0.6)'; x.fillText('Enter — пропустить сцену', W - 14 * s, H - 10 * s);
    }
    wrap(x, text, maxW, font) { x.font = font; const words = text.split(' '), out = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; } if (cur) out.push(cur); return out; }

    destroy() {
      this.destroyed = true; cancelAnimationFrame(this.raf); this.ac.abort(); if (this.ro) this.ro.disconnect(); this.audio.destroy(); this.releaseMouse();
    }
  }

  S.UI = UI;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Dmc98 = globalThis.Dmc98 || {});
