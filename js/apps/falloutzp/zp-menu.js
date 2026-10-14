(function (Z) {
  'use strict';

  const U = Z.UI.prototype;
  const esc = s => Z.esc(s);
  Z.MainMenu = true;

  const CONTROLS = [
    ['W A S D', 'Ходьба'], ['Мышь', 'Обзор'], ['ЛКМ', 'Атака, выстрел'], ['ПКМ', 'Прицелиться'], ['R', 'Перезарядка'], ['E', 'Действие: говорить, открыть, взять'],
    ['Пробел', 'Прыжок'], ['Ctrl', 'Красться'], ['Shift', 'Идти шагом'], ['Caps Lock', 'Всегда шагом'], ['V', 'С.Т.Р.Е.Л.А.'], ['Tab', '«Пионер-77»'],
    ['F', 'Вид от первого/третьего лица'], ['G', 'Бросить гранату'], ['1-8', 'Быстрые слоты'], ['Колесо', 'Сменить оружие'], ['T', 'Ждать'], ['L', 'Фонарь «Пионера»'],
    ['F5 / F9', 'Быстрое сохранение / загрузка'], ['Esc', 'Меню']
  ];
  Z.CONTROLS = CONTROLS;

  U.openMainMenu = function () {
    this.mode = 'menu';
    this.game = null;
    this.menuCam = { t: 0 };
    const saves = Z.listSaves().filter(s => !s.empty).sort((a, b) => b.real - a.real);
    const el = document.createElement('div');
    el.className = 'zp-panel zp-mainmenu';
    el.style.background = 'transparent';
    el.innerHTML = '<div class="mm"><div class="mm-title">FALLOUT</div><div class="mm-sub">ЗАПОРОЖЬЕ</div><div class="mm-tag">Советский Союз · 2280</div><div class="mm-list zp-crt"></div><div class="mm-foot">© 2280 НПО «Радиоприбор» · карта: © участники OpenStreetMap, рельеф: SRTM</div></div>';
    el.addEventListener('mousedown', e => e.stopPropagation());
    const items = [];
    if (saves.length) items.push(['Продолжить', () => this.loadSlot(saves[0].slot)]);
    items.push(['Новая игра', () => this.newGameFlow()]);
    if (saves.length) items.push(['Загрузить', () => this.openSaveLoad(false)]);
    items.push(['Настройки', () => this.openSettings()]);
    items.push(['Управление', () => this.openHelp()]);
    items.push(['Титры', () => this.openCredits()]);
    if (this.opts.onExit) items.push(['Выход', () => this.opts.onExit()]);
    let sel = 0;
    const list = el.querySelector('.mm-list');
    const render = () => {
      list.innerHTML = items.map((it, i) => '<div class="row' + (i === sel ? ' sel' : '') + '" data-i="' + i + '"><span class="nm">' + esc(it[0]) + '</span></div>').join('');
      list.querySelectorAll('.row').forEach(r => { r.addEventListener('mouseenter', () => { if (sel === +r.dataset.i) return; sel = +r.dataset.i; render(); }); r.addEventListener('click', () => items[+r.dataset.i][1]()); });
    };
    const panel = { el, escClose: false, pause: false };
    panel.key = e => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { sel = (sel + items.length - 1) % items.length; render(); return true; }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { sel = (sel + 1) % items.length; render(); return true; }
      if (e.code === 'Enter' || e.code === 'KeyE' || e.code === 'Space') { items[sel][1](); return true; }
      return false;
    };
    this.menuPanel = panel;
    render();
    this.openPanel(panel);
    this.mode = 'menu';
    if (this.audio) this.audio.music('menu');
  };

  U.renderIdle = function (dt) {
    if (!this.r || !this.scene) return;
    const m = this.menuCam || (this.menuCam = { t: 0 });
    m.t += dt;
    const a = m.t * 0.03;
    const c = this.cam;
    c.x = -560 + Math.cos(a) * 220; c.z = -560 + Math.sin(a) * 140; c.y = 60;
    c.yaw = Z.yawOf(-380 - c.x, -900 - c.z) + Math.sin(m.t * 0.05) * 0.15;
    c.pitch = -0.05;
    c.fov = 1.05;
    const env = Z.envAt(18.6 * 60 + Math.sin(m.t * 0.02) * 20, { cloud: 0.35, dark: 0, fog: 0.05, haze: 0.2 });
    const sc = this.scene;
    sc.shadowsOn = false;
    sc.cell = null;
    this.r.points = [];
    this.r.frame(c, env, dt, { shadow: r => { r.shadowTex = r.dummyShadow; r.shadowP = [0, 0, 0, 0]; }, opaque: r => { sc.drawStatic(r); sc.drawTrees(r); if (sc.drawSites) sc.drawSites(r); } });
    if (this.hudUI) this.hudUI.draw(dt);
  };

  U.newGameFlow = function () {
    const opts = { hardcore: false, difficulty: 'normal' };
    this.message('Новая игра', 'Режим «Выживание» (голод, жажда, сон, медленное лечение, вес патронов, смертные спутники). Включить?', [
      { label: 'Обычный режим', fn: () => this.beginNewGame(opts) },
      { label: 'Выживание', fn: () => { opts.hardcore = true; this.beginNewGame(opts); } }
    ]);
  };

  U.beginNewGame = function (opts) {
    this.closeAllPanels();
    this.setLoading('Строится мир…');
    setTimeout(() => {
      this.layer.innerHTML = '';
      this.startGame(opts);
      if (this.audio) this.audio.music(null);
    }, 30);
  };

  U.loadSlot = function (slot) {
    const s = Z.readSave(slot);
    if (!s) { this.message('Загрузка', 'Сохранение повреждено или отсутствует.'); return; }
    this.closeAllPanels();
    this.setLoading('Загрузка…');
    setTimeout(() => {
      this.layer.innerHTML = '';
      this.startGame({ restore: s, seed: s.seed });
      this.game.msg('Игра загружена.', 'info');
      if (this.audio) this.audio.music(null);
    }, 30);
  };

  U.quickSave = function () {
    if (!this.game || this.game.player.dead) return;
    if (this.game.cell.actors.some(a => a.ai && !a.dead && a.ai.state === 'combat' && this.game.hostileToPlayer(a)) && this.game.hardcore) { this.game.msg('Нельзя сохраняться в бою.', 'warn'); return; }
    const ok = Z.writeSave('quick', this.game);
    this.game.msg(ok ? 'Быстрое сохранение.' : 'Не удалось сохранить: нет места.', ok ? 'info' : 'warn');
  };

  U.quickLoad = function () { if (Z.readSave('quick')) this.loadSlot('quick'); };

  U.autoSave = function () { if (this.game && !this.game.player.dead) Z.writeSave('auto', this.game); };

  U.openSaveLoad = function (saving) {
    const saves = Z.listSaves();
    const el = this.panelEl('zp-xfer', '<h2>' + (saving ? 'СОХРАНИТЬ ИГРУ' : 'ЗАГРУЗИТЬ ИГРУ') + '</h2><div class="list scroll" style="flex:1"></div><div class="foot"><span class="dim">Enter — выбрать, Del — удалить, Esc — назад</span></div>');
    const panel = { el };
    let sel = 0;
    const rows = saves.filter(s => saving ? !['quick', 'auto'].includes(s.slot) : !s.empty);
    const label = s => {
      const nm = s.slot === 'quick' ? 'Быстрое' : s.slot === 'auto' ? 'Авто' : 'Ячейка ' + s.slot;
      if (s.empty) return nm + ' — пусто';
      return nm + ' — ' + esc(s.name) + ', ур. ' + s.level + ', ' + esc(s.loc) + ', ' + Z.fmtTime(s.time) + ' ' + Z.dateStr(s.time);
    };
    const render = () => {
      el.querySelector('.list').innerHTML = rows.map((s, i) => '<div class="row' + (i === sel ? ' sel' : '') + '" data-i="' + i + '"><span class="nm">' + label(s) + '</span></div>').join('') || '<div class="dim">Нет сохранений.</div>';
      el.querySelectorAll('.row').forEach(r => { r.addEventListener('mouseenter', () => { if (sel === +r.dataset.i) return; sel = +r.dataset.i; render(); }); r.addEventListener('click', () => { sel = +r.dataset.i; pick(); }); });
    };
    const pick = () => {
      const s = rows[sel];
      if (!s) return;
      if (saving) {
        const ok = Z.writeSave(s.slot, this.game);
        this.closePanel(panel);
        this.game.msg(ok ? 'Игра сохранена.' : 'Не удалось сохранить.', ok ? 'info' : 'warn');
      } else this.loadSlot(s.slot);
    };
    panel.key = e => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { sel = Math.max(0, sel - 1); render(); return true; }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { sel = Math.min(rows.length - 1, sel + 1); render(); return true; }
      if (e.code === 'Enter' || e.code === 'KeyE') { pick(); return true; }
      if (e.code === 'Delete' && rows[sel] && !rows[sel].empty) { Z.store.del('falloutzp_save_' + rows[sel].slot); Z.store.del('falloutzp_save_' + rows[sel].slot + '_meta'); rows[sel].empty = true; render(); return true; }
      return false;
    };
    render();
    this.openPanel(panel);
  };

  U.openPauseMenu = function () {
    const items = [
      ['Продолжить', () => this.closePanel(panel)],
      ['Сохранить', () => this.openSaveLoad(true)],
      ['Загрузить', () => this.openSaveLoad(false)],
      ['Настройки', () => this.openSettings()],
      ['Управление', () => this.openHelp()],
      ['Главное меню', () => this.message('Главное меню', 'Несохранённый прогресс будет потерян. Выйти?', [{ label: 'Выйти', fn: () => { this.closeAllPanels(); this.openMainMenu(); } }, { label: 'Отмена' }])]
    ];
    let sel = 0;
    const el = this.panelEl('zp-msg', '<h2>ПАУЗА</h2><div class="list"></div>');
    const panel = { el };
    const render = () => {
      el.querySelector('.list').innerHTML = items.map((it, i) => '<div class="row' + (i === sel ? ' sel' : '') + '" data-i="' + i + '"><span class="nm">' + esc(it[0]) + '</span></div>').join('');
      el.querySelectorAll('.row').forEach(r => { r.addEventListener('mouseenter', () => { if (sel === +r.dataset.i) return; sel = +r.dataset.i; render(); }); r.addEventListener('click', () => items[+r.dataset.i][1]()); });
    };
    panel.key = e => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { sel = (sel + items.length - 1) % items.length; render(); return true; }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { sel = (sel + 1) % items.length; render(); return true; }
      if (e.code === 'Enter' || e.code === 'KeyE') { items[sel][1](); return true; }
      return false;
    };
    render();
    this.openPanel(panel);
  };

  U.openSettings = function () {
    const s = this.settings;
    const defs = [
      ['sens', 'Чувствительность мыши', 0.3, 3, 0.1], ['fov', 'Поле зрения', 55, 95, 1], ['volume', 'Громкость', 0, 1, 0.05],
      ['invert', 'Инверсия мыши', null], ['shadows', 'Тени', null], ['tts', 'Озвучка реплик (синтез речи)', null], ['subtitles', 'Субтитры возгласов', null]
    ];
    const el = this.panelEl('zp-msg', '<h2>НАСТРОЙКИ</h2><div class="list"></div><div style="text-align:center;margin-top:10px"><span class="btn" data-k="ok">Готово</span></div>');
    const panel = { el, onClose: () => Z.saveSettings(this.settings) };
    let sel = 0;
    const render = () => {
      el.querySelector('.list').innerHTML = defs.map((d, i) => {
        const v = s[d[0]];
        const val = d[2] === null || d[2] === undefined ? (v ? 'ВКЛ' : 'ВЫКЛ') : (d[0] === 'volume' ? Math.round(v * 100) + '%' : d[0] === 'sens' ? v.toFixed(1) : v);
        return '<div class="row' + (i === sel ? ' sel' : '') + '" data-i="' + i + '"><span class="nm">' + esc(d[1]) + '</span><span class="num" style="width:90px">◄ ' + val + ' ►</span></div>';
      }).join('');
      el.querySelectorAll('.row').forEach(r => { r.addEventListener('mouseenter', () => { if (sel === +r.dataset.i) return; sel = +r.dataset.i; render(); }); r.addEventListener('click', ev => { sel = +r.dataset.i; const rect = r.getBoundingClientRect(); change(ev.clientX < rect.left + rect.width * 0.75 ? 1 : -1); }); });
    };
    const change = dir => {
      const d = defs[sel];
      if (d[2] === null || d[2] === undefined) s[d[0]] = !s[d[0]];
      else s[d[0]] = Z.clamp(Math.round((s[d[0]] + dir * d[4]) * 100) / 100, d[2], d[3]);
      if (this.audio) this.audio.setVolume(s.volume);
      render();
    };
    el.querySelector('[data-k=ok]').addEventListener('click', () => this.closePanel(panel));
    panel.key = e => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { sel = (sel + defs.length - 1) % defs.length; render(); return true; }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { sel = (sel + 1) % defs.length; render(); return true; }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { change(-1); return true; }
      if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'Enter') { change(1); return true; }
      return false;
    };
    render();
    this.openPanel(panel);
  };

  U.openHelp = function () {
    this.message('УПРАВЛЕНИЕ', '<div style="display:grid;grid-template-columns:120px 1fr;gap:2px 10px;font-size:13px">' + CONTROLS.map(([k, v]) => '<span>' + esc(k) + '</span><span class="dim">' + esc(v) + '</span>').join('') + '</div>', null, { html: true });
  };

  U.openCredits = function () {
    this.message('ТИТРЫ', 'Fallout: Запорожье — Win 98 Edition.\n\nВознесеновский район и острова Хортица и Байда. Карта построена по данным OpenStreetMap (© участники OpenStreetMap, лицензия ODbL), рельеф — по данным SRTM (NASA).\n\nВсе персонажи, фракции и события вымышлены. Любые совпадения с реальными людьми случайны.\n\nСпасибо, что выбрали «Пионер-77».');
  };

  U.onPlayerDeath = function () {
    const g = this.game;
    this.mode = 'dead';
    this.deathT = 0;
    setTimeout(() => {
      const saves = Z.listSaves().filter(s => !s.empty).sort((a, b) => b.real - a.real);
      const btns = [];
      if (saves.length) btns.push({ label: 'Загрузить последнее', fn: () => this.loadSlot(saves[0].slot) });
      btns.push({ label: 'Главное меню', fn: () => this.openMainMenu() });
      this.message('ВЫ ПОГИБЛИ', g.player.deathInfo && g.player.deathInfo.rads ? 'Лучевая болезнь оказалась сильнее.' : 'Пустошь Запорожья забрала ещё одного курьера.', btns, { modal: true });
    }, 2200);
  };

  U.deathTick = function (dt) {
    const g = this.game, p = g.player, c = this.cam;
    this.deathT = (this.deathT || 0) + dt;
    g.paused = false;
    g.update(dt, null);
    const a = this.deathT * 0.25;
    c.x = p.x + Math.cos(a) * 3.5; c.z = p.z + Math.sin(a) * 3.5; c.y = p.y + 2.4 + this.deathT * 0.3;
    c.yaw = Z.yawOf(p.x - c.x, p.z - c.z);
    c.pitch = Math.atan2(p.y + 0.3 - c.y, 3.5);
    this.view.third = true;
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
