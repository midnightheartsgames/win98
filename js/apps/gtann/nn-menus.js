(function (N) {
  'use strict';

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const CONTROLS = [
    ['W A S D / стрелки', 'Идти, ехать, рулить'],
    ['Мышь', 'Обзор; в машине камера сама вернётся назад'],
    ['Левая кнопка / Ctrl', 'Удар, выстрел; в танке и БТР — пушка'],
    ['Правая кнопка', 'Прицел; у СВД — оптика, колесо — кратность; в танке и БТР — пулемёт'],
    ['Shift / Alt', 'Бег / шаг'],
    ['Пробел', 'Прыжок; в машине — ручник'],
    ['F / Enter', 'Сесть в машину или выйти; в танк и БТР — через люк'],
    ['Q / E, колесо, 1–7', 'Смена оружия; в машине Q/E — смотреть вбок и стрелять'],
    ['G', 'Бросить гранату'],
    ['R', 'Перезарядка; в машине — следующая радиостанция'],
    ['H', 'Сигнал; в служебной машине — мигалка'],
    ['T', 'Подработка: такси или милиция'],
    ['C', 'Камера: ближе, дальше, сверху, от первого лица; в машине — ещё из салона и с бампера'],
    ['B', 'Посмотреть назад'],
    ['M / Tab', 'Карта города'],
    ['Пробел / Enter / клик', 'В сценке — следующая реплика'],
    ['X', 'В сценке — пропустить сценку целиком'],
    ['Esc / P', 'Пауза'],
    ['F7', 'Отладка: оружие, деньги, телепорт, погода, время, бессмертие, розыск, транспорт'],
    ['F8', 'Фотоаппарат: время стоит, камера летает рядом с Тёмой; объективы, плёнки, рамки, дата на снимке. Снимки — в «Мои рисунки\\Нижний Сити»'],
    ['Чит-коды', 'ZDOROVIE, BRONYA, STVOLY, BABKI, MENTY, POGODA']
  ];

  class Menus {
    constructor(ui) {
      this.ui = ui;
      this.el = ui.menuEl;
      this.active = null;
      this.sel = 0;
      this.items = [];
      this.tab = null;
      this.srow = -1;
      this.mapView = null;
    }

    open(kind, arg) {
      this.active = kind;
      this.arg = arg;
      this.sel = 0;
      this.el.classList.add('on');
      if (kind === 'main') this.main();
      else if (kind === 'pause') this.pause(arg || 'resume');
      else if (kind === 'save') this.save(arg);
      else if (kind === 'load') this.load(arg);
      else if (kind === 'settings') this.settingsPage(arg);
      else if (kind === 'controls') this.controls(arg);
      else if (kind === 'about') this.about();
      else if (kind === 'fail') this.fail(arg);
    }

    close() {
      this.active = null;
      this.el.classList.remove('on');
      this.el.innerHTML = '';
    }

    sound() { if (this.ui.audio.on) this.ui.audio.play('menu'); }

    frame(bg, title, body, cls) {
      this.el.innerHTML = `<div class="nn-mscr ${cls || ''}">${bg ? '<canvas class="nn-mbg"></canvas>' : ''}<div class="nn-mhead"><canvas class="nn-mlogo" width="420" height="160"></canvas>${title ? `<div class="nn-mtitle">${esc(title)}</div>` : ''}</div><div class="nn-mbody">${body}</div><div class="nn-mfoot">↑↓ — выбор · Enter — да · Esc — назад</div></div>`;
      const logo = this.el.querySelector('.nn-mlogo');
      if (logo) N.Art.logo(logo);
      if (bg) {
        const c = this.el.querySelector('.nn-mbg');
        c.width = 640; c.height = 400;
        N.Art.poster(c, bg, { night: true });
      }
    }

    list(items, cls) {
      this.items = items;
      if (this.sel >= items.length) this.sel = 0;
      return `<div class="nn-mlist ${cls || ''}">${items.map((it, i) => `<div class="nn-mitem${i === this.sel ? ' sel' : ''}${it.disabled ? ' dis' : ''}" data-i="${i}">${esc(it.label)}${it.note ? `<span>${esc(it.note)}</span>` : ''}</div>`).join('')}</div>`;
    }

    bindList() {
      this.el.querySelectorAll('.nn-mitem').forEach(n => {
        n.addEventListener('mouseenter', () => { this.sel = +n.dataset.i; this.srow = -1; this.highlight(); this.markRow(); });
        n.addEventListener('mousedown', e => { if (e.button !== 0) return; e.preventDefault(); this.ui.el.focus({ preventScroll: true }); this.sel = +n.dataset.i; this.choose(); });
      });
    }

    highlight() { this.el.querySelectorAll('.nn-mitem').forEach(n => n.classList.toggle('sel', +n.dataset.i === this.sel)); }

    choose() {
      const it = this.items[this.sel];
      if (!it || it.disabled) { if (this.ui.audio.on) this.ui.audio.play('deny'); return; }
      this.sound();
      it.fn();
    }

    key(e) {
      e.preventDefault();
      const k = e.code;
      if (this.active === 'pause' && this.tab === 'map' && this.mapKey(k)) return;
      if (this.active === 'pause' && this.tab === 'settings' && this.settingsKey(k)) return;
      if (this.active === 'pause' && this.tab === 'album' && this.albumKey(k)) return;
      if (k === 'ArrowUp' || k === 'KeyW') { this.sel = (this.sel + this.items.length - 1) % this.items.length; this.highlight(); this.sound(); }
      else if (k === 'ArrowDown' || k === 'KeyS') { this.sel = (this.sel + 1) % this.items.length; this.highlight(); this.sound(); }
      else if (k === 'ArrowLeft' || k === 'ArrowRight') { const it = this.items[this.sel]; if (it && it.adj) { it.adj(k === 'ArrowLeft' ? -1 : 1); this.sound(); } }
      else if (k === 'Enter' || k === 'Space' || k === 'NumpadEnter') this.choose();
      else if (k === 'Escape' || k === 'Backspace') this.back();
    }

    back() {
      this.sound();
      if (this.active === 'pause') this.ui.resume();
      else if (this.active === 'save') this.ui.resume();
      else if (this.active === 'fail') this.ui.leaveMission();
      else if (this.returnTo) { const r = this.returnTo; this.returnTo = null; this.open(r[0], r[1]); }
      else if (this.active !== 'main') this.open(this.ui.state === 'menu' ? 'main' : 'pause');
    }

    main() {
      const slots = N.Game.slots().filter(s => s.s);
      const latest = slots.sort((a, b) => String(b.s.savedAt).localeCompare(String(a.s.savedAt)))[0];
      const items = [
        { label: 'Новая игра', fn: () => this.ui.newGame() },
        { label: 'Продолжить', note: latest ? latest.s.label : 'нет сохранений', disabled: !latest, fn: () => this.ui.loadGame(latest.slot) },
        { label: 'Загрузить', fn: () => { this.returnTo = ['main']; this.open('load'); } },
        { label: 'Настройки', fn: () => { this.returnTo = ['main']; this.open('settings'); } },
        { label: 'Управление', fn: () => { this.returnTo = ['main']; this.open('controls'); } },
        { label: 'Об игре', fn: () => { this.returnTo = ['main']; this.open('about'); } },
        { label: 'Выход', fn: () => { if (this.ui.opts.onExit) this.ui.opts.onExit(); } }
      ];
      if (!this.ui.opts.onExit) items.pop();
      this.frame(0, '', this.list(items, 'nn-mmain') + '<div class="nn-mver">Нижний Новгород · лето 2000 · версия 1.0</div>', 'nn-main');
      this.bindList();
    }

    pause(tab) {
      if (tab !== this.tab) this.srow = -1;
      this.tab = tab;
      const g = this.ui.game;
      const tabs = [
        ['resume', 'Продолжить'], ['map', 'Карта'], ['brief', 'Задание'], ['stats', 'Статистика'], ['photo', 'Фотоаппарат'], ['album', 'Фотоальбом'], ['settings', 'Настройки'], ['controls', 'Управление'], ['quit', 'В главное меню']
      ];
      if (globalThis.Parohod98Report) tabs.splice(tabs.length - 1, 0, ['report', 'Сообщить об ошибке']);
      if (globalThis.TouchControls && globalThis.TouchControls.testChannel()) tabs.splice(tabs.length - 1, 0, ['debug', 'Отладка']);
      const items = tabs.map(([id, label]) => ({ label, id, fn: () => this.pauseTab(id) }));
      this.sel = Math.max(0, tabs.findIndex(t => t[0] === tab));
      let content = '';
      if (tab === 'map') content = '<canvas class="nn-map"></canvas><div class="nn-legend"><span class="lg-m">К П Л — задания</span><span class="lg-s">⌂ — сохранение</span><span class="lg-g">▬ — «Охотник»</span><span class="lg-r">▮ — перекраска</span><span class="lg-h">✚ — больница</span><span class="lg-o">★ — ОВД</span><span class="lg-d">■ — цель</span></div>';
      else if (tab === 'brief') content = this.brief(g);
      else if (tab === 'stats') content = this.stats(g);
      else if (tab === 'settings') content = this.settingsHtml();
      else if (tab === 'controls') content = this.controlsHtml();
      else if (tab === 'album') content = this.albumHtml(g);
      else content = `<div class="nn-pinfo"><div class="nn-pbig">ПАУЗА</div><div>${esc(g.world.city.zoneAt(g.world.player.x, g.world.player.z))} · ${N.clock(g.world.clock)} · ${esc(g.world.wx.name)}</div><div>${esc(N.money(g.state.money))}</div><div class="nn-pnote">Сохраниться можно в гостинице «Автозаводская» — розовый маркер у двери.</div></div>`;
      this.el.innerHTML = `<div class="nn-mscr nn-pause"><div class="nn-ptabs">${this.list(items, 'nn-ptablist')}</div><div class="nn-pcontent">${content}</div></div>`;
      this.bindList();
      if (tab === 'map') this.drawMap(true);
      if (tab === 'settings') this.bindSettings();
      if (tab === 'album') this.bindAlbum();
    }

    pauseTab(id) {
      if (id === 'resume') this.ui.resume();
      else if (id === 'report') globalThis.Parohod98Report.open();
      else if (id === 'debug') { this.ui.resume(); this.ui.debug.show(); }
      else if (id === 'quit') { this.ui.exitToMenu(); }
      else if (id === 'photo') {
        this.ui.resume();
        if (!this.ui.photo.open()) { const why = this.ui.photo.blocked(); if (why) this.ui.game.help(why, 3); }
      }
      else { if (id !== 'album') { this.albumMsg = ''; this.delArm = false; } this.pause(id); }
    }

    albumHtml(g) {
      const P = N.PHOTO, A = N.PhotoAlbum, list = A.list(), got = new Set(g.state.views || []);
      this.album = list;
      if (!(this.albumSel >= 0) || this.albumSel >= list.length) this.albumSel = list.length - 1;
      const views = `<div class="nn-alb-views"><h4>Виды Автозавода для «Автозаводца»</h4><p>${got.size} из ${P.VIEWS.length} · ${esc(N.money(P.fee))} за каждый новый вид, за все — премия ${esc(N.money(P.bonus))}. Вид засчитывается, если он целиком и крупно в кадре и ничем не заслонён.</p><ul>${P.VIEWS.map(v => `<li class="${got.has(v.id) ? 'got' : ''}">${got.has(v.id) ? '\u2713' : '\u2022'} ${esc(v.name)}</li>`).join('')}</ul></div>`;
      const where = A.kept() ? 'C:\\Мои документы\\' + P.shown : 'без рабочего стола снимки живут до конца сеанса';
      if (!list.length) return `<div class="nn-album nn-alb-none"><div class="nn-alb-empty"><b>Плёнка пустая</b><span>${N.touchUi ? '«Фотоаппарат» в паузе' : 'F8 или «Фотоаппарат»'} — снимать. На плёнке ${P.roll} кадра; ${esc(where)}.</span></div>${views}</div>`;
      const sel = this.albumSel, cur = list[sel], m = cur.meta || {}, url = A.read(cur.file) || '';
      const name = id => (P.VIEWS.find(v => v.id === id) || { name: id }).name;
      const facts = [
        ['Кадр', '№' + cur.n + ' · ' + cur.file],
        ['Где', m.zone], ['Когда', m.day !== undefined ? N.photoDateText(m.day) + (m.clock !== undefined ? ', ' + N.clock(m.clock) : '') : null],
        ['Погода', m.wx], ['Объектив', m.lens ? m.lens + ' мм, f/' + String(m.stop).replace('.', ',') : null], ['Плёнка', m.film],
        ['В кадре', m.views && m.views.length ? m.views.map(name).join(', ') : null]
      ].filter(r => r[1]);
      const thumbs = list.map((it, i) => `<img class="nn-alb-th${i === sel ? ' sel' : ''}" data-p="${i}" src="${esc(A.read(it.file) || '')}" alt="${esc(it.file)}">`).join('');
      return `<div class="nn-album"><div class="nn-alb-left"><div class="nn-alb-main"><img class="nn-alb-img" src="${esc(url)}" alt="${esc(cur.file)}"></div><div class="nn-alb-strip">${thumbs}</div></div>`
        + `<div class="nn-alb-side"><table class="nn-alb-facts">${facts.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table>`
        + `<div class="nn-alb-nav"><button type="button" data-b="prev">\u25c4</button><span>${sel + 1} из ${list.length}</span><button type="button" data-b="next">\u25ba</button></div>`
        + `<div class="nn-alb-acts">${globalThis.Parohod98 ? '' : '<button type="button" data-b="wall">На рабочий стол <small>B</small></button><button type="button" data-b="view">Открыть в программе <small>O</small></button>'}<button type="button" data-b="del" class="${this.delArm ? 'arm' : ''}">${this.delArm ? 'Точно удалить?' : 'Удалить'} <small>Del</small></button></div>`
        + `<div class="nn-alb-msg">${esc(this.albumMsg || where)}</div>${views}</div></div>`;
    }

    bindAlbum() {
      this.el.querySelectorAll('[data-p], [data-b]').forEach(n => n.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        e.preventDefault();
        this.ui.el.focus({ preventScroll: true });
        if (n.dataset.p !== undefined) { this.albumSel = +n.dataset.p; this.delArm = false; this.albumMsg = ''; this.sound(); this.pause('album'); }
        else this.albumAct(n.dataset.b);
      }));
    }

    albumKey(k) {
      const map = { ArrowLeft: 'prev', KeyA: 'prev', ArrowRight: 'next', KeyD: 'next', Delete: 'del', KeyB: 'wall', KeyO: 'view' };
      if (!map[k]) return false;
      this.albumAct(map[k]);
      return true;
    }

    albumAct(a) {
      const list = this.album || [], cur = list[this.albumSel], A = N.PhotoAlbum;
      const win = typeof window !== 'undefined' ? window : {};
      if (a === 'prev' || a === 'next') {
        if (!list.length) return;
        this.albumSel = (this.albumSel + (a === 'prev' ? list.length - 1 : 1)) % list.length;
        this.delArm = false;
        this.albumMsg = '';
      } else if (!cur) return;
      else if (a === 'del') {
        if (!this.delArm) { this.delArm = true; this.albumMsg = 'Снимок удалится насовсем, мимо Корзины. Нажмите «Удалить» ещё раз.'; }
        else { A.remove(cur.file); this.delArm = false; this.albumMsg = cur.file + ' удалён, на плёнке освободился кадр.'; }
      } else if (a === 'wall') {
        const D = win.appDialogs, url = A.read(cur.file);
        if (D && D.saveDisplaySettings && url) { D.applyDisplaySettings(D.saveDisplaySettings({ wallpaper: url, wallpaperMode: 'stretch' })); this.albumMsg = 'Снимок теперь на рабочем столе. Вернуть прежние обои — «Свойства экрана».'; }
        else this.albumMsg = 'Рабочий стол недоступен.';
      } else if (a === 'view') {
        const V = win.appImageViewer, url = A.read(cur.file);
        if (V && url) { V.open(cur.file, url, N.PHOTO.dir); this.albumMsg = cur.file + ' открыт в программе просмотра.'; }
        else this.albumMsg = 'Программа просмотра недоступна.';
      }
      this.sound();
      this.pause('album');
    }

    brief(g) {
      const m = g.mission;
      const done = N.MISSIONS.filter(x => g.state.done[x.id]);
      const avail = g.available();
      const who = { kesha: 'Кеша, «Фемида»', colonel: 'Полковник, дебаркадер', lyova: 'Лёва, «Мираж»' };
      return `<div class="nn-brief">${m ? `<h3>${esc(m.def.title)}</h3><p>${esc(m.text || '')}</p>` : '<h3>Свободная игра</h3>'}
      ${avail.length ? `<h4>Ждут тебя</h4><ul>${avail.map(a => `<li><b>${esc(N.GIVER[a.giver])}</b> ${esc(who[a.giver])}: «${esc(a.title)}»</li>`).join('')}</ul>` : ''}
      <h4>Пройдено: ${done.length} из ${N.MISSIONS.length}</h4><ul>${done.map(d => `<li>${esc(d.title)}</li>`).join('')}</ul>
      ${g.flags.chapter1 ? '<p class="nn-end">Первая глава закончена. Продолжение следует…</p>' : ''}</div>`;
    }

    stats(g) {
      const s = Object.assign({}, g.state.stats, g.world.stats);
      const p = g.progress();
      const row = (a, b) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`;
      const acc = s.shots ? Math.round(s.hits / s.shots * 100) + '%' : '—';
      const hrs = Math.floor(g.state.played / 3600), mins = Math.floor(g.state.played / 60) % 60;
      return `<table class="nn-stats">
        ${row('Задания', p.missions + ' из ' + p.missionsTotal)}
        ${row('Заначки', p.stashes + ' из ' + p.stashTotal)}
        ${row('Уникальные трюки', p.jumps + ' из ' + p.jumpTotal)}
        ${row('Виды для «Автозаводца»', p.views + ' из ' + p.viewTotal)}
        ${row('Снимков сделано', s.photos || 0)}
        ${row('Пассажиров такси', p.taxi)}
        ${row('Уровень в милиции', p.police)}
        ${row('Заработано всего', N.money(s.earned || 0))}
        ${row('Уложено людей', s.kills)}
        ${row('Из них милиционеров', s.copsKilled)}
        ${row('Угнано машин', s.carsStolen)}
        ${row('Взорвано машин', s.carsDestroyed)}
        ${row('Наезжено', (s.driven / 1000).toFixed(1) + ' км')}
        ${row('Находено пешком', (s.walked / 1000).toFixed(1) + ' км')}
        ${row('Выстрелов / точность', s.shots + ' / ' + acc)}
        ${row('Попаданий в голову', s.headshots)}
        ${row('Потрачено / Повязали', (s.wasted || 0) + ' / ' + (s.busted || 0))}
        ${row('Время в игре', hrs + ' ч ' + mins + ' мин')}
      </table>`;
    }

    settingItems() {
      const s = this.ui.settings;
      const pct = v => Math.round(v * 100) + '%';
      const mk = (label, key, min, max, step, fmt) => ({ label, key, note: fmt(s[key]), adj: d => { s[key] = N.clamp(Math.round((s[key] + d * step) * 100) / 100, min, max); this.ui.applySettings(); this.refreshSettings(); }, fn: () => { s[key] = s[key] + step > max + 1e-6 ? min : Math.round((s[key] + step) * 100) / 100; this.ui.applySettings(); this.refreshSettings(); } });
      return [
        mk('Громкость звуков', 'sfx', 0, 1, 0.1, pct),
        mk('Громкость радио', 'radio', 0, 1, 0.1, pct),
        mk('Громкость голосов', 'voice', 0, 1, 0.1, pct),
        { label: 'Озвучка реплик', note: s.tts !== false ? 'да' : 'нет', fn: () => { s.tts = s.tts === false; this.ui.applySettings(); this.refreshSettings(); }, adj: () => { s.tts = s.tts === false; this.ui.applySettings(); this.refreshSettings(); } },
        mk('Чувствительность мыши', 'sens', 0.3, 2.5, 0.1, v => v.toFixed(1)),
        { label: 'Инверсия мыши', note: s.invert ? 'да' : 'нет', fn: () => { s.invert = !s.invert; this.ui.applySettings(); this.refreshSettings(); }, adj: () => { s.invert = !s.invert; this.ui.applySettings(); this.refreshSettings(); } },
        mk('Дальность прорисовки', 'draw', 0.5, 1.5, 0.1, pct),
        mk('Плотность машин', 'traffic', 0.2, 1.6, 0.1, pct),
        mk('Плотность пешеходов', 'peds', 0.2, 1.6, 0.1, pct),
        mk('Разрешение', 'scale', 0.4, 1, 0.1, pct),
        { label: 'Эффекты', note: s.gfx === 'low' ? 'простые' : 'полные', fn: () => { s.gfx = s.gfx === 'low' ? 'high' : 'low'; this.ui.applySettings(); this.refreshSettings(); }, adj: () => { s.gfx = s.gfx === 'low' ? 'high' : 'low'; this.ui.applySettings(); this.refreshSettings(); } },
        { label: 'Детализация машин', note: (N.CAR_DETAIL[s.cars] || N.CAR_DETAIL.high).name, fn: () => this.cycleCars(1), adj: d => this.cycleCars(d) },
        { label: 'Детализация города', note: (N.CITY_DETAIL[s.city] || N.CITY_DETAIL.high).name, fn: () => this.cycleCity(1), adj: d => this.cycleCity(d) },
        { label: 'Субтитры', note: s.subtitles !== false ? 'да' : 'нет', fn: () => { s.subtitles = s.subtitles === false; this.ui.applySettings(); this.refreshSettings(); }, adj: () => { s.subtitles = s.subtitles === false; this.ui.applySettings(); this.refreshSettings(); } },
        { label: 'Траектория броска', note: s.throwAid !== false ? 'да' : 'нет', fn: () => { s.throwAid = s.throwAid === false; this.ui.applySettings(); this.refreshSettings(); }, adj: () => { s.throwAid = s.throwAid === false; this.ui.applySettings(); this.refreshSettings(); } },
        ...(this.ui.touch ? this.ui.touch.settingsRows().map(r => Object.assign({}, r, { fn: () => { r.fn(); this.refreshSettings(); }, adj: d => { r.adj(d); this.refreshSettings(); } })) : [])
      ];
    }

    cycleCity(d) {
      const s = this.ui.settings, keys = Object.keys(N.CITY_DETAIL), i = Math.max(0, keys.indexOf(s.city));
      s.city = keys[(i + (d < 0 ? keys.length - 1 : 1)) % keys.length];
      this.ui.applySettings();
      this.refreshSettings();
    }

    cycleCars(d) {
      const s = this.ui.settings, keys = Object.keys(N.CAR_DETAIL), i = Math.max(0, keys.indexOf(s.cars));
      s.cars = keys[(i + (d < 0 ? keys.length - 1 : 1)) % keys.length];
      this.ui.applySettings();
      this.refreshSettings();
    }

    settingsHtml() {
      this.sItems = this.settingItems();
      return `<div class="nn-settings">${this.sItems.map((it, i) => `<div class="nn-srow${i === this.srow ? ' sel' : ''}" data-s="${i}"><span>${esc(it.label)}</span><b><i data-d="-1">◄</i> <em>${esc(it.note)}</em> <i data-d="1">►</i></b></div>`).join('')}<p class="nn-pnote">Клик по ◄ ► или ←/→ меняют значение · ↑↓ — выбор настройки · Esc — к вкладкам.</p></div>`;
    }

    bindSettings() {
      this.el.querySelectorAll('.nn-srow').forEach(n => {
        n.addEventListener('mouseenter', () => { this.srow = +n.dataset.s; this.markRow(); });
        n.addEventListener('mousedown', e => {
          if (e.button !== 0) return;
          e.preventDefault();
          this.ui.el.focus({ preventScroll: true });
          const d = e.target.closest && e.target.closest('[data-d]');
          this.srow = +n.dataset.s;
          this.sItems[this.srow].adj(d ? +d.dataset.d : 1);
          this.sound();
        });
      });
    }

    markRow() { this.el.querySelectorAll('.nn-srow').forEach(n => n.classList.toggle('sel', +n.dataset.s === this.srow)); }

    settingsKey(k) {
      const n = this.sItems ? this.sItems.length : 0;
      if (!n) return false;
      if (!(this.srow >= 0)) {
        const onTab = this.items[this.sel] && this.items[this.sel].id === 'settings';
        if (!onTab || !['ArrowRight', 'KeyD', 'Enter', 'NumpadEnter', 'Space'].includes(k)) return false;
        this.srow = 0;
        this.markRow();
        this.sound();
        return true;
      }
      const it = this.sItems[this.srow];
      if (k === 'ArrowUp' || k === 'KeyW') { this.srow = this.srow > 0 ? this.srow - 1 : -1; this.markRow(); this.sound(); }
      else if (k === 'ArrowDown' || k === 'KeyS') { this.srow = (this.srow + 1) % n; this.markRow(); this.sound(); }
      else if (k === 'ArrowLeft' || k === 'KeyA') { it.adj(-1); this.sound(); }
      else if (k === 'ArrowRight' || k === 'KeyD') { it.adj(1); this.sound(); }
      else if (k === 'Enter' || k === 'NumpadEnter' || k === 'Space') { it.fn(); this.sound(); }
      else if (k === 'Escape' || k === 'Backspace') { this.srow = -1; this.markRow(); this.sound(); }
      else return false;
      return true;
    }

    refreshSettings() {
      const fresh = this.settingItems();
      if (this.active === 'pause' && this.tab === 'settings') {
        this.sItems = fresh;
        this.el.querySelectorAll('.nn-srow').forEach(n => { n.querySelector('em').textContent = fresh[+n.dataset.s].note; });
      } else if (this.active === 'settings') {
        fresh.forEach((it, i) => { this.items[i] = Object.assign(this.items[i], it); });
        this.el.querySelectorAll('.nn-mitem').forEach(n => { const it = this.items[+n.dataset.i], sp = n.querySelector('span'); if (sp && it) sp.textContent = it.note; });
      }
    }

    settingsPage() {
      const items = this.settingItems().concat([{ label: 'Назад', fn: () => this.back() }]);
      this.frame(0, 'Настройки', this.list(items.map(it => Object.assign({}, it, { note: it.note })), 'nn-mset'));
      this.bindList();
    }

    controlsHtml() { return `<table class="nn-stats nn-ctl">${(this.ui.touch ? this.ui.touch.controlsRows() : CONTROLS).map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table>`; }

    controls() {
      this.frame(0, 'Управление', this.controlsHtml() + this.list([{ label: 'Назад', fn: () => this.back() }]));
      this.bindList();
    }

    about() {
      const text = 'Лето 2000 года. Тимофей Верещагин, отсидевший восемь лет, приезжает в Нижний Новгород с московскими деньгами — купить сорок «Волг» мимо кассы. Сделка на причале у Оки оборачивается засадой, деньги исчезают. Автозаводский район как он есть: ГАЗ и Соцгород, проспект Ленина и Мончегорский рынок, «Жигули», «Волги» и «бумеры», пейджеры, ларьки и милиция на «семёрках».';
      this.frame(0, 'Об игре', `<div class="nn-about"><p>${esc(text)}</p><p>Rockstar North (2002) / Win 98 Edition. Все персонажи вымышлены, совпадения с реальными людьми случайны.</p></div>` + this.list([{ label: 'Назад', fn: () => this.back() }]));
      this.bindList();
    }

    fail(info) {
      const items = [];
      if (info.cp) items.push({ label: 'Повторить с контрольной точки', note: info.cp.name, fn: () => this.ui.retryMission('cp') });
      items.push({ label: 'Начать задание заново', note: info.cp ? 'со вступления' : '', fn: () => this.ui.retryMission('start') });
      const after = info.death === 'wasted' ? 'больница, лечение за свой счёт' : info.death === 'busted' ? 'ОВД, штраф и без оружия' : 'свободная игра';
      items.push({ label: 'Продолжить без задания', note: after, fn: () => this.ui.leaveMission() });
      this.el.innerHTML = `<div class="nn-mscr nn-failscr${info.death ? ' nn-faildead' : ''}"><div class="nn-fail-box"><div class="nn-fail-title">ЗАДАНИЕ ПРОВАЛЕНО</div><div class="nn-fail-name">«${esc(info.def.title)}»</div><div class="nn-fail-why">${esc(info.reason || '')}</div>${this.list(items, 'nn-mfail')}<div class="nn-mfoot">↑↓ — выбор · Enter — да · Esc — продолжить без задания</div></div></div>`;
      this.bindList();
    }

    save(at) {
      const slots = N.Game.slots().filter(s => s.slot <= 4);
      const items = slots.map(s => ({ label: 'Ячейка ' + s.slot, note: s.s ? s.s.label + ' · ' + new Date(s.s.savedAt).toLocaleString('ru-RU') : 'пусто', fn: () => {
        const ok = this.ui.game.save(s.slot, at);
        this.ui.game.help(ok ? 'Игра сохранена в ячейку ' + s.slot + '.' : 'Не удалось сохранить игру.');
        this.ui.resume();
      } }));
      items.push({ label: 'Не сохранять', fn: () => this.ui.resume() });
      this.frame(0, 'Сохранить игру', this.list(items, 'nn-mslots'), 'nn-save');
      this.bindList();
    }

    load() {
      const slots = N.Game.slots();
      const items = slots.map(s => ({ label: s.slot > 4 ? 'Автосохранение' : 'Ячейка ' + s.slot, note: s.s ? s.s.label : 'пусто', disabled: !s.s, fn: () => this.ui.loadGame(s.slot) }));
      items.push({ label: 'Назад', fn: () => this.back() });
      this.frame(0, 'Загрузить игру', this.list(items, 'nn-mslots'));
      this.bindList();
    }

    drawMap(reset) {
      const c = this.el.querySelector('.nn-map');
      if (!c) return;
      const g = this.ui.game;
      const pl = g.world.player;
      const box = c.parentNode.getBoundingClientRect();
      c.width = Math.max(200, box.width - 20);
      c.height = Math.max(200, box.height - 60);
      const map = this.ui.hud.ensureMap();
      const op = g.city.outsidePos(pl.x, pl.z);
      if (reset || !this.mapView) this.mapView = { x: op.x, z: op.z, zoom: 0.6 };
      const V = this.mapView;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#4a6a3e';
      ctx.fillRect(0, 0, c.width, c.height);
      const s = V.zoom;
      const ox = c.width / 2 - V.x * s, oz = c.height / 2 - V.z * s;
      ctx.drawImage(map, ox + map.ox * s, oz + map.oz * s, map.width / map.s * s, map.height / map.s * s);
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const ic of g.radarIcons()) {
        const x = ox + ic.x * s, y = oz + ic.z * s;
        ctx.fillStyle = ic.icon === 'letter' ? '#ffd030' : ic.icon === 'save' ? '#3ac0ff' : ic.icon === 'hosp' || ic.icon === 'metro' ? '#fff' : ic.icon === 'ovd' ? '#2050c0' : ic.icon === 'spray' ? '#5a8cff' : ic.icon === 'buy' ? '#40d060' : '#ffa030';
        ctx.strokeStyle = '#000';
        ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = ic.icon === 'metro' ? '#d42a2a' : '#000';
        ctx.fillText(ic.letter || { save: '⌂', hosp: '✚', ovd: '★', spray: '▮', gun: '▬', clothes: 'Т', buy: '₽', metro: 'М' }[ic.icon] || '', x, y + 1);
      }
      for (const b of g.blips()) {
        const col = N.MARKER_COL[b.type] || [255, 255, 255];
        ctx.fillStyle = `rgb(${col})`;
        ctx.fillRect(ox + b.x * s - 5, oz + b.z * s - 5, 10, 10);
        ctx.strokeRect(ox + b.x * s - 5, oz + b.z * s - 5, 10, 10);
      }
      const px = op.x, pz = op.z;
      ctx.save();
      ctx.translate(ox + px * s, oz + pz * s);
      ctx.rotate(pl.veh ? pl.veh.yaw : pl.yaw);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(7, 8); ctx.lineTo(0, 4); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      const hint = N.touchText('Колесо — масштаб · тяни мышью · Esc — назад');
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(8, 8, ctx.measureText(hint).width + 12, 24);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.fillText(hint, 14, 20);
      if (!c.bound) {
        c.bound = true;
        c.addEventListener('wheel', e => { e.preventDefault(); V.zoom = N.clamp(V.zoom * (e.deltaY < 0 ? 1.15 : 0.87), 0.2, 3); this.drawMap(); }, { passive: false });
        let drag = null;
        c.addEventListener('mousedown', e => { drag = [e.clientX, e.clientY]; });
        window.addEventListener('mouseup', () => { drag = null; });
        c.addEventListener('mousemove', e => { if (!drag) return; V.x -= (e.clientX - drag[0]) / V.zoom; V.z -= (e.clientY - drag[1]) / V.zoom; drag = [e.clientX, e.clientY]; this.drawMap(); });
        if (this.ui.touch) this.ui.touch.bindMap(c, V, () => this.drawMap());
      }
    }

    mapKey(k) {
      const V = this.mapView;
      if (!V) return false;
      const st = 60 / V.zoom;
      if (k === 'KeyA') V.x -= st; else if (k === 'KeyD') V.x += st; else if (k === 'KeyW') V.z -= st; else if (k === 'KeyS') V.z += st;
      else if (k === 'Equal' || k === 'NumpadAdd') V.zoom = Math.min(3, V.zoom * 1.2); else if (k === 'Minus' || k === 'NumpadSubtract') V.zoom = Math.max(0.2, V.zoom / 1.2);
      else return false;
      this.drawMap();
      return true;
    }
  }

  N.Menus = Menus;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
