(function (F) {
  'use strict';

  const esc = s => F.esc(s);
  const h = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };

  const DT_NAME = { FWD: 'FWD', RWD: 'RWD', AWD: 'AWD' };
  const STAT_NAMES = [['speed', 'Скорость'], ['handling', 'Управляемость'], ['accel', 'Ускорение'], ['launch', 'Старт'], ['braking', 'Торможение'], ['offroad', 'Бездорожье']];
  const WEATHER_ICON = { clear: 'sun', overcast: 'cloud', downpour: 'rain', storm: 'storm', fog: 'fog' };
  const weatherName = id => F.WEATHER[F.weatherId(id)].name;
  const LIVERIES = [['none', 'Без ливреи'], ['stripes', 'Гоночные полосы'], ['side', 'Боковая полоса'], ['twotone', 'Двухцветная'], ['tail', 'Хвостовая полоса'], ['number', 'Номер в круге'], ['horizon', 'Horizon'], ['rally', 'Раллийная'], ['cola', 'BALTIC COLA'], ['fm', 'RĪGA FM 101.5'], ['mobile', 'DZINTARS MOBILE'], ['kafija', 'Sprīdītis Kafija']];

  function clsBadge(pi) {
    const k = F.classOf(pi);
    return `<span class="fz-cls" style="--c:${k.col}"><b>${k.c}</b><i>${pi}</i></span>`;
  }

  function carTitle(car) { return `<b>${car.year}</b> ${esc(car.make)} ${esc(car.model)}`; }

  const TIME_PRESETS = [['Рассвет', 6.5], ['Утро', 9], ['Полдень', 12.5], ['Закат', 18.5], ['Ночь', 23]];

  function tempAt(clock, weather) {
    return Math.round(14 + 6 * Math.sin((clock - 8) / 24 * Math.PI * 2) + F.WEATHER[F.weatherId(weather)].temp);
  }

  function hhmm(clock) {
    const m = Math.floor((((clock % 24) + 24) % 24) * 60 + 1e-6);
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }

  function skipText(hours) {
    const m = Math.round(hours * 60);
    if (!m) return 'Без перемотки';
    const hh = Math.floor(m / 60), mm = m % 60;
    return '+' + (hh ? hh + ' ч' : '') + (hh && mm ? ' ' : '') + (mm ? mm + ' мин' : '');
  }

  function weatherIcon(clock, weather) {
    const icon = WEATHER_ICON[F.weatherId(weather)];
    return icon === 'sun' && Math.sin((clock - 6.2) / 12.6 * Math.PI) < 0 ? 'moon' : icon;
  }

  function rgbCss(c) { return `rgb(${c.map(v => Math.round(F.clamp(v, 0, 1) * 255)).join(',')})`; }

  class Menus {
    constructor(ui) {
      this.ui = ui;
      this.root = ui.menuEl;
      this.stack = [];
      this.thumbs = new Map();
    }

    get g() { return this.ui.game; }
    get top() { return this.stack[this.stack.length - 1] || null; }
    get open() { return this.stack.length > 0; }

    thumb(id, c1, c2, livery, wing, metal) {
      const key = [id, c1, c2, livery, wing, metal ? 'm' : ''].join('|');
      if (this.thumbs.has(key)) return this.thumbs.get(key);
      let url = '';
      try {
        const cv = this.ui.renderer.thumbnail(id, F.hexRgb(c1), F.hexRgb(c2 || c1), livery, wing, 256, 150, metal);
        url = cv.toDataURL('image/png');
      } catch (e) { url = ''; }
      this.thumbs.set(key, url);
      return url;
    }

    entryThumb(entry) {
      const sp = F.Cars.spec(entry.id, entry.up);
      return this.thumb(entry.id, entry.c1, entry.c2, entry.livery, sp.wing, entry.metal);
    }

    push(scr) {
      if (this.top) this.top.el.classList.add('fz-hidden');
      this.stack.push(scr);
      this.root.appendChild(scr.el);
      this.root.classList.add('on');
      this.ui.menuOpen = true;
      if (scr.showroom) this.ui.showroom = scr.showroom(); else this.ui.showroom = null;
      this.autoFocus(scr);
      this.ui.audio.play('blip');
    }

    replace(scr) {
      const old = this.stack.pop();
      if (old) { old.el.remove(); if (old.onClose) old.onClose(); }
      this.push(scr);
    }

    pop() {
      const s = this.stack.pop();
      if (s) { s.el.remove(); if (s.onClose) s.onClose(); }
      if (this.top) {
        this.top.el.classList.remove('fz-hidden');
        if (this.top.refresh) this.top.refresh();
        this.ui.showroom = this.top.showroom ? this.top.showroom() : null;
        this.autoFocus(this.top, true);
      } else {
        this.root.classList.remove('on');
        this.ui.menuOpen = false;
        this.ui.showroom = null;
        this.ui.onMenusClosed();
      }
      this.ui.audio.play('back');
    }

    closeAll() {
      while (this.stack.length) {
        const s = this.stack.pop();
        s.el.remove();
        if (s.onClose) s.onClose();
      }
      this.root.classList.remove('on');
      this.ui.menuOpen = false;
      this.ui.showroom = null;
    }

    navs(scr = this.top) {
      if (!scr) return [];
      return [...scr.el.querySelectorAll('[data-nav]')].filter(e => e.offsetParent !== null && !e.classList.contains('fz-dis-nav'));
    }

    setFocus(el) {
      const scr = this.top;
      if (!scr) return;
      if (scr.focus && scr.focus !== el) scr.focus.classList.remove('fz-focus');
      scr.focus = el;
      if (el) {
        el.classList.add('fz-focus');
        if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        if (el._onFocus) el._onFocus();
      }
    }

    autoFocus(scr, keep) {
      const list = this.navs(scr);
      if (keep && scr.focus && list.includes(scr.focus)) { this.setFocus(scr.focus); return; }
      const pref = scr.el.querySelector('[data-first]');
      this.setFocus(pref && list.includes(pref) ? pref : list[0] || null);
    }

    move(dx, dy) {
      const scr = this.top;
      const list = this.navs();
      if (!list.length) return;
      const cur = scr.focus && list.includes(scr.focus) ? scr.focus : null;
      if (!cur) { this.setFocus(list[0]); return; }
      const r0 = cur.getBoundingClientRect();
      const cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
      let best = null, bs = Infinity;
      for (const e of list) {
        if (e === cur) continue;
        const r = e.getBoundingClientRect();
        const ex = r.left + r.width / 2, ey = r.top + r.height / 2;
        const px = ex - cx, py = ey - cy;
        const along = px * dx + py * dy;
        if (along <= 4) continue;
        const across = Math.abs(px * dy - py * dx);
        const sc = along + across * 2.2;
        if (sc < bs) { bs = sc; best = e; }
      }
      if (best) { this.setFocus(best); this.ui.audio.play('blip'); }
    }

    key(e) {
      const scr = this.top;
      if (!scr) return false;
      if (scr.onKey && scr.onKey(e)) return true;
      const k = e.code;
      const f = scr.focus;
      if ((k === 'ArrowLeft' || k === 'KeyA') && f && f._adj) { f._adj(-1); this.ui.audio.play('blip'); return true; }
      if ((k === 'ArrowRight' || k === 'KeyD') && f && f._adj) { f._adj(1); this.ui.audio.play('blip'); return true; }
      if (k === 'ArrowLeft' || k === 'KeyA') { this.move(-1, 0); return true; }
      if (k === 'ArrowRight' || k === 'KeyD') { this.move(1, 0); return true; }
      if (k === 'ArrowUp' || k === 'KeyW') { this.move(0, -1); return true; }
      if (k === 'ArrowDown' || k === 'KeyS') { this.move(0, 1); return true; }
      if (k === 'Enter' || k === 'Space' || k === 'NumpadEnter') { if (f) { this.ui.audio.play('select'); f.click(); } return true; }
      if (k === 'Escape' || k === 'Backspace') { if (scr.back) scr.back(); else this.pop(); return true; }
      if ((k === 'KeyQ' || k === 'PageUp') && scr.tab) { scr.tab(-1); return true; }
      if ((k === 'KeyE' || k === 'PageDown') && scr.tab) { scr.tab(1); return true; }
      return false;
    }

    nav(el, fn, adj) {
      el.setAttribute('data-nav', '1');
      el.addEventListener('mouseenter', () => { if (this.top && this.top.el.contains(el)) this.setFocus(el); });
      el.addEventListener('click', ev => { ev.stopPropagation(); if (this.top && this.top.focus !== el) this.setFocus(el); if (fn) fn(); });
      if (adj) el._adj = adj;
      return el;
    }

    topBar() {
      const g = this.g, p = g.profile, e = g.entry;
      const car = F.Cars.get(e.id);
      const pi = g.carPI(e);
      return h('div', 'fz-top', `<div class="fz-top-l">${clsBadge(pi)}<span class="fz-carname">${carTitle(car)}</span></div>
        <div class="fz-top-r"><span class="fz-lvl">${p.level}</span><span class="fz-pname">${esc(p.name)}</span><span class="fz-cr"><i>CR</i>${F.fmtCR(p.credits)}</span></div>`);
    }

    hints(list) {
      return h('div', 'fz-hints', list.map(([k, t]) => `<span><kbd>${esc(k)}</kbd>${esc(t)}</span>`).join(''));
    }

    title() {
      const ui = this.ui;
      const el = h('div', 'fz-scr fz-title');
      const has = !!F.Profile.loadProfile();
      el.innerHTML = `<div class="fz-logo"><div class="fz-logo-f">FORZA</div><div class="fz-logo-h">HORIZON</div><div class="fz-logo-r">RĪGA</div></div>
        <div class="fz-tmenu"></div>
        <div class="fz-tfoot">© 2000 Playground Games · Microslop Game Studios · Win 98 Edition · Фестиваль Horizon, лето 2001 года</div>`;
      const m = el.querySelector('.fz-tmenu');
      const add = (t, fn, first) => { const b = this.nav(h('div', 'fz-titem', esc(t)), fn); if (first) b.setAttribute('data-first', '1'); m.appendChild(b); return b; };
      if (has) add('Продолжить', () => ui.continueGame(), true);
      add('Новая игра', () => {
        if (has) this.confirm('Новая игра', 'Текущий прогресс будет удалён. Начать фестиваль заново?', () => ui.newGame());
        else ui.newGame();
      }, !has);
      add('Настройки', () => this.push(this.settingsScreen(true)));
      add('Об игре', () => this.push(this.about()));
      add('Выход', () => ui.exit());
      return { el, back: () => ui.exit(), noEsc: true };
    }

    about() {
      const el = h('div', 'fz-scr fz-modal-wrap');
      const box = h('div', 'fz-modal fz-about', `<h2>Forza Horizon: Рига</h2>
        <p>Открытый мир Риги начала 2000-х: Вецрига, Центр, Вантовый мост, Даугава, Межапаркс, Бикерниеки, Задаугава, аэропорт и Юрмала.</p>
        <p>33 автомобиля — от Lada 2105 до McLaren F1. Шоссейные, уличные, грунтовые гонки, кросс-кантри и витрины против электрички и самолёта. Трюки PR, цепочки навыков, щиты, находки в сараях и финал фестиваля.</p>
        <p class="fz-dim">Управление: WASD/стрелки — газ, тормоз, руль · Пробел — ручник · C — камера · V — фоторежим · R — перемотка · Backspace — сброс · M — карта · Tab — радио · H — гудок · L — фары · Q/E — передачи (ручная КПП) · Esc — меню · F7 — отладка. Геймпад поддерживается.</p>`);
      const b = this.nav(h('div', 'fz-btn', 'Закрыть'), () => this.pop());
      box.appendChild(b);
      el.appendChild(box);
      return { el };
    }

    confirm(title, text, yes, no) {
      const el = h('div', 'fz-scr fz-modal-wrap');
      const box = h('div', 'fz-modal', `<h2>${esc(title)}</h2><p>${text}</p>`);
      const row = h('div', 'fz-row');
      const y = this.nav(h('div', 'fz-btn fz-btn-hot', 'Да'), () => { this.pop(); yes(); });
      const n = this.nav(h('div', 'fz-btn', 'Нет'), () => { this.pop(); if (no) no(); });
      n.setAttribute('data-first', '1');
      row.appendChild(y); row.appendChild(n);
      box.appendChild(row);
      el.appendChild(box);
      this.push({ el });
    }

    popup(title, body, col = '#e6146e', btn = 'Продолжить', fn = null, img = null) {
      const el = h('div', 'fz-scr fz-modal-wrap');
      const box = h('div', 'fz-modal fz-popup', `<div class="fz-pop-band" style="background:${col}"></div><h2>${esc(title)}</h2>${img ? `<img class="fz-pop-img" src="${img}">` : ''}<div class="fz-pop-body">${body}</div>`);
      const b = this.nav(h('div', 'fz-btn fz-btn-hot', esc(btn)), () => { this.pop(); if (fn) fn(); });
      box.appendChild(b);
      el.appendChild(box);
      this.push({ el, back: () => { this.pop(); if (fn) fn(); } });
    }

    hub(tab = 0) {
      const ui = this.ui, g = this.g;
      const el = h('div', 'fz-scr fz-hub');
      const tabs = ['ГЛАВНАЯ', 'ФЕСТИВАЛЬ', 'МАШИНЫ', 'НАВЫКИ', 'НАСТРОЙКИ'];
      const scr = { el, tabIdx: tab };
      const render = () => {
        el.innerHTML = '';
        el.appendChild(this.topBar());
        const tb = h('div', 'fz-tabs');
        tb.appendChild(h('span', 'fz-lb', 'Q'));
        tabs.forEach((t, i) => {
          const s = this.nav(h('span', 'fz-tab' + (i === scr.tabIdx ? ' on' : ''), t), () => { scr.tabIdx = i; render(); });
          tb.appendChild(s);
        });
        tb.appendChild(h('span', 'fz-rb', 'E'));
        el.appendChild(tb);
        const body = h('div', 'fz-hub-body');
        el.appendChild(body);
        [this.homeTab, this.festTab, this.carsTab, this.skillsTab, this.settingsTab][scr.tabIdx].call(this, body, scr);
        el.appendChild(this.hints([['Enter', 'Выбрать'], ['Esc', 'Назад'], ['Q / E', 'Вкладки'], ['M', 'Карта мира'], ['Tab', 'Радио']]));
        this.autoFocus(scr);
        const cur = el.querySelectorAll('.fz-tab')[scr.tabIdx];
        if (cur) cur.classList.remove('fz-focus');
      };
      scr.tab = d => { scr.tabIdx = (scr.tabIdx + d + tabs.length) % tabs.length; render(); this.ui.audio.play('blip'); };
      scr.refresh = render;
      scr.back = () => { this.pop(); };
      scr.onKey = e => { if (e.code === 'KeyM') { this.push(this.mapScreen()); return true; } return false; };
      render();
      return scr;
    }

    homeTab(body) {
      const ui = this.ui, g = this.g, p = g.profile;
      body.className = 'fz-hub-body fz-home';
      const wname = weatherName(g.weather);
      const tile = (cls, html, fn, first) => {
        const t = this.nav(h('div', 'fz-tile ' + cls, html), fn);
        if (first) t.setAttribute('data-first', '1');
        body.appendChild(t);
        return t;
      };
      tile('t-weather', `<div class="fz-wicon fz-w-${weatherIcon(g.clock, g.weather)}"></div><div class="fz-wtemp">${tempAt(g.clock, g.weather)}°C</div><div class="fz-wname">${wname}</div><div class="fz-wskip">Перемотать время</div><div class="fz-wclock">${hhmm(g.clock)}</div>`, () => this.push(this.timeScreen()));
      const mapT = tile('t-map', `<canvas class="fz-mini"></canvas><div class="fz-tlabel">КАРТА МИРА</div>`, () => this.push(this.mapScreen()), true);
      this.drawMini(mapT.querySelector('canvas'));
      const np = ui.audio.nowPlaying;
      tile('t-radio', `<div class="fz-rlogo">${np ? esc(np.station) : 'РАДИО ВЫКЛЮЧЕНО'}</div><div class="fz-rnow">${np ? `<b>${esc(np.title)}</b><br>${esc(np.artist)}` : 'Нажмите, чтобы включить'}</div><div class="fz-eq">${'<i></i>'.repeat(8)}</div><div class="fz-tlabel">HORIZON РАДИО</div>`, () => { ui.cycleRadio(); this.top.refresh(); });
      const band = F.EV.BANDS[p.band], next = F.EV.BANDS[p.band + 1];
      const prog = next ? (p.pts - band.need) / (next.need - band.need) : 1;
      tile('t-fest', `<div class="fz-band" style="--c:${band.col}"></div><div class="fz-tbig">${esc(band.name)}</div><div class="fz-bar"><i style="width:${Math.round(F.clamp(prog, 0, 1) * 100)}%;background:${next ? next.col : band.col}"></i></div><div class="fz-tsub">${next ? `${p.pts} / ${next.need} очков фестиваля до «${esc(next.name)}»` : p.finale ? 'Чемпион Horizon Rīga!' : 'Финал Horizon Rīga открыт'}</div><div class="fz-tlabel">ФЕСТИВАЛЬ</div>`, () => { this.top.tabIdx = 1; this.top.refresh(); });
      const comp = g.completion();
      const owned = [...new Set(p.cars.map(c => c.id))].slice(0, 4);
      tile('t-coll', `<div class="fz-thumbs">${owned.map(id => { const e = p.cars.find(c => c.id === id); return `<img src="${this.entryThumb(e)}">`; }).join('')}</div><div class="fz-tsub">${comp.cars} из ${comp.carsTotal} машин</div><div class="fz-tlabel">КОЛЛЕКЦИЯ</div>`, () => this.push(this.garage()));
      const btns = h('div', 't-btns');
      body.appendChild(btns);
      const sb = (t, icon, fn) => btns.appendChild(this.nav(h('div', 'fz-sbtn', `<span class="fz-ico fz-ico-${icon}"></span>${t}`), fn));
      sb('Настройки', 'gear', () => { this.top.tabIdx = 4; this.top.refresh(); });
      sb('Сброс на дорогу', 'reset', () => { this.closeAll(); ui.resumeFromMenu(); g.resetCar(); });
      const cost = g.repairCost();
      sb(cost ? `Ремонт · CR ${F.fmtCR(cost)}` : 'Ремонт: машина цела', 'repair', () => {
        if (!cost) { ui.toast('Машина цела', 'Ремонт не нужен', '#9ad0ff'); return; }
        if (g.buyRepair()) { this.closeAll(); ui.resumeFromMenu(); ui.handleEvents(g.drain()); }
        else ui.toast('Не хватает кредитов', `Ремонт стоит CR ${F.fmtCR(cost)} · бесплатно на аванпостах`, '#ff8080');
      });
      sb('Перемещение', 'ft', () => this.push(this.mapScreen({ ft: true })));
      sb('Фоторежим', 'photo', () => ui.openPhoto());
      const car = F.Cars.get(g.entry.id);
      tile('t-car', `<img src="${this.entryThumb(g.entry)}"><div class="fz-tbig">${carTitle(car)}</div><div class="fz-tlabel">СМЕНИТЬ МАШИНУ<small>Доставка к текущему месту</small></div>`, () => this.push(this.garage()));
      const need = F.EV.xpForLevel(p.level);
      tile('t-level', `<div class="fz-lvnum">${p.level}</div><div class="fz-bar"><i style="width:${Math.round(p.xp / need * 100)}%"></i></div><div class="fz-tsub">${F.fmtCR(p.xp)} / ${F.fmtCR(need)} XP</div><div class="fz-tlabel">УРОВЕНЬ</div>`, () => { this.top.tabIdx = 3; this.top.refresh(); });
      const st = p.stats;
      tile('t-stats', `<div class="fz-slist"><div><span>Победы</span><b>${st.wins} / ${st.races}</b></div><div><span>Пробег</span><b>${F.fmtDist(st.dist)}</b></div><div><span>Лучший дрифт</span><b>${F.fmtCR(Math.round(st.drift))}</b></div><div><span>Макс. скорость</span><b>${Math.round(st.top)} км/ч</b></div><div><span>Дороги</span><b>${Math.floor(comp.roads / comp.roadsTotal * 100)}%</b></div></div><div class="fz-tlabel">СТАТИСТИКА</div>`, () => { this.top.tabIdx = 1; this.top.refresh(); });
    }

    drawMini(cv) {
      const ui = this.ui, g = this.g, art = ui.mapArt;
      if (!art) return;
      const W = 420, H = 300;
      cv.width = W; cv.height = H;
      const c = cv.getContext('2d');
      const v = g.veh;
      const sc = 1.0;
      c.fillStyle = '#233';
      c.fillRect(0, 0, W, H);
      c.drawImage(art.cv, (v.x - art.x0) * art.scale - W / 2 / sc, (v.z - art.z0) * art.scale - H / 2 / sc, W / sc, H / sc, 0, 0, W, H);
      c.save(); c.translate(W / 2, H / 2); c.rotate(v.yaw);
      c.fillStyle = '#fff'; c.strokeStyle = '#000';
      c.beginPath(); c.moveTo(0, -10); c.lineTo(7, 8); c.lineTo(0, 4); c.lineTo(-7, 8); c.closePath(); c.fill(); c.stroke();
      c.restore();
      const k = art.scale;
      for (const ev of F.EV.EVENTS) {
        if (ev.id === 'prologue') continue;
        const x = W / 2 + (ev.via[0][0] - v.x) * k, y = H / 2 + (ev.via[0][1] - v.z) * k;
        if (x < 0 || y < 0 || x > W || y > H) continue;
        c.fillStyle = g.eventLocked(ev) ? '#777' : F.EV.TYPES[ev.type].col;
        c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke();
      }
    }

    timeScreen() {
      const ui = this.ui, g = this.g;
      const from = g.clock;
      const last = Math.ceil((from + 24) * 4 - 1e-6) / 4 - 0.25;
      const wname = weatherName(g.weather);
      const el = h('div', 'fz-scr fz-time');
      el.innerHTML = `<div class="fz-thead"><div class="fz-gtitle">Время суток</div><div class="fz-tweather"><div class="fz-wicon"></div><b></b><span>${esc(wname)}</span></div></div>
        <div class="fz-tpanel"><div class="fz-tread"><span>${hhmm(from)}</span><i></i><b></b><small></small></div></div>`;
      const panel = el.querySelector('.fz-tpanel');
      const iconEl = el.querySelector('.fz-tweather .fz-wicon'), tempEl = el.querySelector('.fz-tweather b'), toEl = el.querySelector('.fz-tread b'), skipEl = el.querySelector('.fz-tread small');
      const scr = { el, at: from, view: from, applied: false, drag: false, drawn: '', bg: null, t: performance.now() };
      const strip = h('div', 'fz-tstrip', '<canvas></canvas>');
      const cv = strip.querySelector('canvas');
      const row = h('div', 'fz-trow');
      panel.appendChild(strip);
      panel.appendChild(row);
      panel.appendChild(this.hints([['←→', '±15 минут'], ['Q / E', '±1 час'], ['Enter', 'Перемотать'], ['Esc', 'Отмена']]));
      const show = () => {
        toEl.textContent = hhmm(scr.at);
        skipEl.textContent = skipText(scr.at - from);
        tempEl.textContent = tempAt(scr.at, g.weather) + '°C';
        iconEl.className = 'fz-wicon fz-w-' + weatherIcon(scr.at, g.weather);
      };
      const setAt = a => { scr.at = F.clamp(a, from, last); show(); };
      const step = d => setAt(d > 0 ? Math.floor(scr.at * 4 + 1e-6) / 4 + 0.25 : Math.ceil(scr.at * 4 - 1e-6) / 4 - 0.25);
      const stepHour = d => setAt(d > 0 ? Math.floor(scr.at + 1e-6) + 1 : Math.ceil(scr.at - 1e-6) - 1);
      const apply = () => {
        scr.applied = true;
        g.clock = from;
        g.skipTime(scr.at);
        this.pop();
      };
      this.nav(strip, null, step).setAttribute('data-first', '1');
      const pick = e => {
        const r = cv.getBoundingClientRect();
        setAt(Math.round((from + F.clamp((e.clientX - r.left) / r.width, 0, 1) * 24) * 4) / 4);
      };
      strip.addEventListener('pointerdown', e => { scr.drag = true; strip.setPointerCapture(e.pointerId); this.setFocus(strip); pick(e); });
      strip.addEventListener('pointermove', e => { if (scr.drag) pick(e); });
      strip.addEventListener('pointerup', () => { scr.drag = false; });
      for (const [name, c] of TIME_PRESETS) {
        const env = F.skyEnv(c, g.weather, 900);
        row.appendChild(this.nav(h('div', 'fz-tpre', `<i style="background:linear-gradient(${rgbCss(env.skyTop)}, ${rgbCss(env.skyHor)})"></i><b>${name}</b><span>${hhmm(c)}</span>`), () => setAt(from + (c - from + 24) % 24)));
      }
      const btns = h('div', 'fz-tbtns');
      btns.appendChild(this.nav(h('div', 'fz-btn', 'Отмена'), () => this.pop()));
      btns.appendChild(this.nav(h('div', 'fz-btn fz-btn-hot', 'Перемотать'), apply));
      row.appendChild(btns);
      const sunY = (a, hy, SH) => {
        const s = Math.sin((a - 6.2) / 12.6 * Math.PI);
        return hy - s * (s > 0 ? hy * 0.78 : (SH - hy) * 0.8);
      };
      const background = (W, H, SH, hy) => {
        const bg = document.createElement('canvas');
        bg.width = W; bg.height = H;
        const c = bg.getContext('2d');
        const cols = 96;
        for (let i = 0; i < cols; i++) {
          const env = F.skyEnv((from + (i + 0.5) / 4) % 24, g.weather, 900);
          const x0 = Math.floor(i * W / cols), x1 = Math.floor((i + 1) * W / cols);
          const gr = c.createLinearGradient(0, 0, 0, hy);
          gr.addColorStop(0, rgbCss(env.skyTop));
          gr.addColorStop(1, rgbCss(env.skyHor));
          c.fillStyle = gr;
          c.fillRect(x0, 0, x1 - x0, hy);
          c.fillStyle = rgbCss(env.groundCol.map(v => v * 0.7));
          c.fillRect(x0, hy, x1 - x0, SH - hy);
        }
        c.fillStyle = 'rgba(255,255,255,0.3)';
        c.fillRect(0, Math.round(hy), W, 1);
        const path = new Path2D();
        for (let x = 0; x <= W; x += 3) path[x ? 'lineTo' : 'moveTo'](x, sunY(from + x / W * 24, hy, SH));
        c.lineWidth = 2;
        c.save(); c.beginPath(); c.rect(0, 0, W, hy); c.clip(); c.strokeStyle = 'rgba(255,210,58,0.9)'; c.stroke(path); c.restore();
        c.save(); c.beginPath(); c.rect(0, hy, W, SH - hy); c.clip(); c.setLineDash([4, 4]); c.strokeStyle = 'rgba(255,255,255,0.3)'; c.stroke(path); c.restore();
        c.font = '11px "Segoe UI", Arial';
        c.textAlign = 'center';
        c.fillStyle = '#ccc';
        for (let k = Math.ceil(from); k < from + 24; k++) {
          const x = (k - from) / 24 * W;
          c.fillRect(Math.round(x), SH, 1, k % 3 ? 3 : 6);
          if (k % 3 === 0 && x > 16 && x < W - 16) c.fillText(hhmm(k), x, H - 2);
        }
        return bg;
      };
      const drawStrip = () => {
        const W = cv.clientWidth, H = cv.clientHeight;
        if (!W || !H) return;
        const key = [W, H, scr.at, scr.view].join('|');
        if (key === scr.drawn) return;
        scr.drawn = key;
        const SH = H - 16, hy = Math.round(SH * 0.64);
        if (cv.width !== W || cv.height !== H || !scr.bg) { cv.width = W; cv.height = H; scr.bg = background(W, H, SH, hy); }
        const c = cv.getContext('2d');
        c.clearRect(0, 0, W, H);
        c.drawImage(scr.bg, 0, 0);
        const tx = Math.round((scr.at - from) / 24 * W);
        c.fillStyle = 'rgba(0,0,0,0.5)';
        c.fillRect(tx, 0, W - tx, SH);
        c.fillStyle = '#e6146e';
        c.fillRect(0, SH - 5, tx, 5);
        c.fillStyle = '#fff';
        c.fillRect(tx - 1, 0, 2, SH);
        const vx = (scr.view - from) / 24 * W, vy = sunY(scr.view, hy, SH);
        const up = vy < hy;
        c.beginPath(); c.arc(vx, vy, 7, 0, Math.PI * 2);
        c.fillStyle = up ? '#ffd23a' : '#dfe8ff'; c.fill();
        c.lineWidth = 2; c.strokeStyle = up ? 'rgba(255,160,40,0.8)' : 'rgba(40,50,90,0.9)'; c.stroke();
      };
      scr.draw = () => {
        const now = performance.now();
        const dt = Math.min(0.1, (now - scr.t) / 1000);
        scr.t = now;
        const d = scr.at - scr.view;
        scr.view = Math.abs(d) < 1e-3 ? scr.at : scr.view + Math.sign(d) * Math.min(Math.abs(d), Math.max(3, Math.abs(d) * 5) * dt);
        g.clock = scr.view % 24;
        drawStrip();
      };
      scr.onKey = e => {
        const k = e.code;
        if ((k === 'Enter' || k === 'NumpadEnter' || k === 'Space') && scr.focus === strip) { ui.audio.play('select'); apply(); return true; }
        if (k === 'KeyQ' || k === 'PageUp') { stepHour(-1); ui.audio.play('blip'); return true; }
        if (k === 'KeyE' || k === 'PageDown') { stepHour(1); ui.audio.play('blip'); return true; }
        return false;
      };
      scr.onClose = () => { if (!scr.applied) g.clock = from; };
      show();
      return scr;
    }

    festTab(body) {
      const g = this.g, p = g.profile;
      body.className = 'fz-hub-body fz-festtab';
      const bands = h('div', 'fz-bands');
      F.EV.BANDS.forEach((b, i) => {
        const got = p.band >= i;
        bands.appendChild(h('div', 'fz-bandc' + (got ? ' got' : '') + (p.band === i ? ' cur' : ''), `<i style="background:${b.col}"></i><b>${esc(b.name)}</b><small>${i ? b.need + ' очк.' : 'старт'} · класс ${b.cls}</small>`));
      });
      body.appendChild(bands);
      const cols = h('div', 'fz-fcols');
      const list = h('div', 'fz-evlist');
      const tiers = [...new Set(F.EV.EVENTS.filter(e => e.tier >= 0).map(e => e.tier))];
      for (const t of tiers) {
        list.appendChild(h('div', 'fz-evtier', esc(F.EV.BANDS[t].name) + ` · класс ${F.EV.BANDS[t].cls}`));
        for (const ev of F.EV.EVENTS.filter(e => e.tier === t)) {
          const res = p.results[ev.id];
          const locked = g.eventLocked(ev);
          const T = F.EV.TYPES[ev.type];
          const medal = res ? (res.pos === 1 ? 'gold' : res.pos === 2 ? 'silver' : res.pos === 3 ? 'bronze' : 'done') : '';
          const row = this.nav(h('div', 'fz-evrow' + (locked ? ' locked' : ''), `<i class="fz-evtype" style="background:${T.col}">${T.short}</i><b>${esc(ev.name)}</b><span class="fz-evcls">${ev.cls}</span><span class="fz-medal ${medal}">${res ? res.pos + '-е' : locked ? 'закрыто' : '—'}</span>`), () => {
            g.setWaypoint(ev.via[0][0], ev.via[0][1]);
            this.ui.toast('Маршрут проложен: ' + ev.name, 'Следуйте за синей линией на мини-карте');
            this.closeAll();
            this.ui.resumeFromMenu();
          });
          list.appendChild(row);
        }
      }
      cols.appendChild(list);
      const comp = g.completion();
      cols.appendChild(h('div', 'fz-compl', `<h3>Прогресс фестиваля</h3>
        <div><span>События</span><b>${comp.events} / ${comp.eventsTotal}</b></div>
        <div><span>Победы</span><b>${comp.wins}</b></div>
        <div><span>Трюки PR (звёзды)</span><b>${comp.stars} / ${comp.starsTotal}</b></div>
        <div><span>Щиты опыта</span><b>${comp.xpBoards} / ${comp.xpTotal}</b></div>
        <div><span>Щиты перемещения</span><b>${comp.ftBoards} / ${comp.ftTotal}</b></div>
        <div><span>Находки в сараях</span><b>${comp.barns} / ${comp.barnsTotal}</b></div>
        <div><span>Открыто дорог</span><b>${comp.roads} / ${comp.roadsTotal}</b></div>
        <div><span>Машины</span><b>${comp.cars} / ${comp.carsTotal}</b></div>
        ${g.rumors().map(r => `<p class="fz-rumor"><b>Слух:</b> ${esc(r.hint)}</p>`).join('')}`));
      body.appendChild(cols);
    }

    carsTab(body) {
      const g = this.g;
      body.className = 'fz-hub-body fz-carstab';
      const big = (cls, title, sub, fn, first) => {
        const t = this.nav(h('div', 'fz-ctile ' + cls, `<div class="fz-cicon"></div><div class="fz-tbig">${title}</div><div class="fz-tsub">${sub}</div>`), fn);
        if (first) t.setAttribute('data-first', '1');
        body.appendChild(t);
      };
      big('c-garage', 'МОИ МАШИНЫ', `${g.profile.cars.length} в гараже`, () => this.push(this.garage()), true);
      big('c-show', 'АВТОСАЛОН', 'Купить новую машину', () => this.push(this.autoshow()));
      big('c-tune', 'ТЮНИНГ', 'Улучшения и класс', () => this.push(this.tune(g.entry.uid)));
      big('c-paint', 'ПОКРАСКА', 'Цвет и ливрея', () => this.push(this.paint(g.entry.uid)));
      body.appendChild(this.statPanel(g.entry));
    }

    statPanel(entry) {
      const car = F.Cars.get(entry.id);
      const pf = F.perfOf(entry.id, entry.up);
      const R = F.RARITY[car.rarity];
      const sp = F.Cars.spec(entry.id, entry.up);
      const el = h('div', 'fz-ginfo', `<div class="fz-brand">${esc(car.make)}</div><div class="fz-rar" style="background:${R.col}">${R.name}</div>
        <div class="fz-stats">${STAT_NAMES.map(([k, n]) => `<div><span>${n}</span><b>${pf[k].toFixed(1)}</b></div>`).join('')}</div>
        <div class="fz-gfoot">${clsBadge(pf.pi)}<span class="fz-dt">${DT_NAME[car.dt]}</span></div>
        <div class="fz-spec">${Math.round(sp.P / 745.7)} л.с. · ${Math.round(sp.mass - 75)} кг · 0–100 ${pf.t100.toFixed(1)} с · ${Math.round(pf.vmax)} км/ч</div>
        <div class="fz-value"><i>CR</i>${F.fmtCR(this.g.carValue(entry))}</div>`);
      return el;
    }

    skillsTab(body) {
      const g = this.g, p = g.profile;
      body.className = 'fz-hub-body fz-skillstab';
      body.appendChild(h('div', 'fz-sp', `<div class="fz-spnum">${p.sp}</div><div>очков навыков</div><small>Очки дают банковые цепочки: дрифт, полёты, опасные обгоны, скорость и разрушения. 3 500 очков цепочки = 1 очко навыка.</small>`));
      const grid = h('div', 'fz-perks');
      for (const pk of F.EV.PERKS) {
        const own = p.perks.includes(pk.id);
        const can = !own && p.sp >= pk.cost;
        const c = this.nav(h('div', 'fz-perk' + (own ? ' own' : can ? ' can' : ''), `<b>${esc(pk.name)}</b><p>${esc(pk.desc)}</p><span>${own ? 'ОТКРЫТО' : pk.cost + ' очк.'}</span>`), () => {
          if (own) return;
          if (g.buyPerk(pk.id)) { this.ui.audio.play('levelup'); this.top.refresh(); } else this.ui.toast('Не хватает очков навыков', `Нужно ${pk.cost}, есть ${p.sp}`, '#ff8080');
        });
        grid.appendChild(c);
      }
      body.appendChild(grid);
    }

    settingsTab(body) {
      body.className = 'fz-hub-body fz-settab';
      this.settingsBody(body);
    }

    settingsScreen(fromTitle) {
      const el = h('div', 'fz-scr fz-setscr');
      el.appendChild(h('div', 'fz-gtitle', 'Настройки'));
      const body = h('div', 'fz-settab');
      el.appendChild(body);
      this.settingsBody(body, fromTitle);
      el.appendChild(this.hints([['↑↓', 'Пункт'], ['←→', 'Изменить'], ['Esc', 'Назад']]));
      return { el };
    }

    settingsBody(body, fromTitle) {
      const ui = this.ui;
      const s = ui.settings();
      const rows = [
        ['Ассистенты', null],
        ['ABS', 'abs', [true, false], v => v ? 'Вкл' : 'Выкл (+5%)'],
        ['Антипробуксовка (TCS)', 'tcs', [true, false], v => v ? 'Вкл' : 'Выкл (+5%)'],
        ['Стабилизация (STM)', 'stm', [true, false], v => v ? 'Вкл' : 'Выкл (+5%)'],
        ['Коробка передач', 'auto', [true, false], v => v ? 'Автомат' : 'Ручная (+10%)'],
        ['Руль', 'steer', ['std', 'sim'], v => v === 'std' ? 'Стандарт' : 'Симуляция (+5%)'],
        ['Линия движения', 'line', ['full', 'brake', 'off'], v => ({ full: 'Полная', brake: 'Только торможение', off: 'Выключена' })[v]],
        ['Повреждения', 'dmg', ['full', 'cosmetic', 'off'], v => ({ full: 'Полные (кузов и механика)', cosmetic: 'Только внешние', off: 'Выключены' })[v]],
        ['Соперники', null],
        ['Сложность', 'diff', [0, 1, 2, 3, 4], v => `${F.DIFF[v].name} (+${Math.round(F.DIFF[v].pay * 100)}%)`],
        ['Трафик', 'traffic', [0, 0.5, 1, 1.5], v => ({ 0: 'Нет', 0.5: 'Мало', 1: 'Обычно', 1.5: 'Много' })[v]],
        ['Камера и HUD', null],
        ['Камера по умолчанию', 'cam', ['chase', 'far', 'hood', 'cockpit'], v => ({ chase: 'За машиной', far: 'Дальняя', hood: 'Капот', cockpit: 'Из кабины' })[v]],
        ['Единицы', 'units', ['kmh', 'mph'], v => v === 'kmh' ? 'км/ч' : 'миль/ч'],
        ['Зеркало заднего вида', 'mirror', [true, false], v => v ? 'Вкл' : 'Выкл'],
        ['Графика', null],
        ['Качество графики', 'gfx', ['retro', 'high', 'ultra'], v => ({ retro: 'Ретро 2000', high: 'Высокое', ultra: 'Ультра (тени)' })[v]],
        ['Разрешение', 'res', [360, 480, 600, 768, 0], v => v ? `${Math.round(v * 4 / 3)}×${v}` : 'Как у окна'],
        ['Дальность прорисовки', 'draw', [600, 900, 1300], v => ({ 600: 'Низкая', 900: 'Средняя', 1300: 'Высокая' })[v]],
        ['Растительность', 'flora', [0, 1, 2], v => ({ 0: 'Низкая (плоские деревья)', 1: 'Средняя', 2: 'Высокая (трава и кусты)' })[v]],
        ['16-битный цвет', 'dither', [true, false], v => v ? 'Вкл' : 'Выкл'],
        ['Звук', null],
        ['Общая громкость', 'vol', 1],
        ['Двигатель', 'engine', 1.2],
        ['Эффекты (шины, удары, меню)', 'sfx', 1],
        ['Окружение (дождь, гроза, салют)', 'ambient', 1],
        ['Радио', 'music', 1]
      ];
      let first = true;
      for (const r of rows) {
        if (!r[1]) { body.appendChild(h('div', 'fz-sethead', esc(r[0]))); continue; }
        const [label, key, opts, fmt] = r;
        if (!fmt) {
          const row = this.volumeRow(label, key, opts, s);
          if (first) { row.setAttribute('data-first', '1'); first = false; }
          body.appendChild(row);
          continue;
        }
        const row = h('div', 'fz-setrow', `<span>${esc(label)}</span><b><i>◀</i><em></em><i>▶</i></b>`);
        const val = row.querySelector('em');
        const show = () => { val.textContent = fmt(s[key]); };
        const adj = d => {
          let i = opts.findIndex(o => o === s[key]);
          if (i < 0) i = 0;
          i = (i + d + opts.length) % opts.length;
          s[key] = opts[i];
          show();
          ui.applySettings();
        };
        this.nav(row, () => adj(1), adj);
        if (first) { row.setAttribute('data-first', '1'); first = false; }
        show();
        body.appendChild(row);
      }
      if (!fromTitle) {
        body.appendChild(h('div', 'fz-sethead', 'Профиль'));
        const reset = this.nav(h('div', 'fz-setrow fz-danger', '<span>Удалить прогресс и начать заново</span><b>…</b>'), () => this.confirm('Удалить прогресс', 'Все машины, кредиты и результаты будут удалены.', () => ui.newGame()));
        body.appendChild(reset);
      }
      body.appendChild(h('div', 'fz-sethead', 'Управление'));
      body.appendChild(h('div', 'fz-keys', `<div><kbd>W</kbd><kbd>↑</kbd> газ</div><div><kbd>S</kbd><kbd>↓</kbd> тормоз / задний ход</div><div><kbd>A</kbd><kbd>D</kbd> руль</div><div><kbd>Пробел</kbd> ручник</div>
        <div><kbd>C</kbd> камера</div><div><kbd>B</kbd> смотреть назад</div><div><kbd>R</kbd> перемотка (держать)</div><div><kbd>Backspace</kbd> сброс на дорогу</div>
        <div><kbd>Q</kbd><kbd>E</kbd> передачи (ручная КПП)</div><div><kbd>M</kbd> карта</div><div><kbd>Tab</kbd> радио</div><div><kbd>H</kbd> гудок · <kbd>L</kbd> фары</div><div><kbd>Enter</kbd> начать событие</div><div><kbd>F</kbd> подлатать двигатель (держать)</div><div><kbd>Esc</kbd> меню</div>`));
    }

    volumeRow(label, key, max, s) {
      const ui = this.ui;
      const row = h('div', 'fz-setrow fz-volrow', `<span>${esc(label)}</span><b><div class="fz-vol"><div class="fz-vol-fill"></div><div class="fz-vol-knob"></div></div><em></em></b>`);
      const track = row.querySelector('.fz-vol'), fill = row.querySelector('.fz-vol-fill'), knob = row.querySelector('.fz-vol-knob'), val = row.querySelector('em');
      const pct = () => F.clamp(Math.round((Number.isFinite(s[key]) ? s[key] : 0) / max * 100), 0, 100);
      const show = () => { const p = pct(); fill.style.width = p + '%'; knob.style.left = p + '%'; val.textContent = p + '%'; };
      const set = p => { s[key] = F.clamp(Math.round(p), 0, 100) / 100 * max; show(); ui.applyVolumes(); };
      const adj = d => {
        const p = pct(), to = F.clamp(d > 0 ? Math.floor(p / 5 + 1) * 5 : Math.ceil(p / 5 - 1) * 5, 0, 100);
        if (to === p) return;
        set(to);
        ui.applySettings();
        ui.audio.sample(key);
      };
      const at = ev => { const r = track.getBoundingClientRect(); set((ev.clientX - r.left) / Math.max(1, r.width) * 100); };
      let drag = false;
      const end = () => {
        if (!drag) return;
        drag = false;
        row.classList.remove('fz-drag');
        ui.applySettings();
        if (!ui.audio.sample(key)) ui.audio.play('blip');
      };
      track.addEventListener('pointerdown', ev => {
        if (ev.button) return;
        ev.preventDefault();
        drag = true;
        row.classList.add('fz-drag');
        if (track.setPointerCapture) track.setPointerCapture(ev.pointerId);
        this.setFocus(row);
        at(ev);
      });
      track.addEventListener('pointermove', ev => { if (drag) at(ev); });
      track.addEventListener('pointerup', end);
      track.addEventListener('pointercancel', end);
      this.nav(row, null, adj);
      show();
      return row;
    }

    garage(opts = {}) {
      const g = this.g;
      const el = h('div', 'fz-scr fz-garage');
      const scr = { el, tabIdx: 0 };
      const makes = () => ['ВСЕ', ...[...new Set(g.profile.cars.map(c => F.Cars.get(c.id).make.toUpperCase()))].sort()];
      const render = () => {
        const ms = makes();
        if (scr.tabIdx >= ms.length) scr.tabIdx = 0;
        el.innerHTML = '';
        el.appendChild(this.topBar());
        el.appendChild(h('div', 'fz-gtitle', opts.title || 'Мои машины'));
        const tb = h('div', 'fz-mtabs');
        tb.appendChild(h('span', 'fz-lb', 'Q'));
        ms.forEach((m, i) => tb.appendChild(this.nav(h('span', 'fz-mtab' + (i === scr.tabIdx ? ' on' : ''), esc(m)), () => { scr.tabIdx = i; render(); })));
        tb.appendChild(h('span', 'fz-rb', 'E'));
        el.appendChild(tb);
        const bodyEl = h('div', 'fz-gbody');
        const info = h('div', 'fz-ginfo-wrap');
        bodyEl.appendChild(info);
        const cards = h('div', 'fz-gcards');
        bodyEl.appendChild(cards);
        el.appendChild(bodyEl);
        let list = g.profile.cars.slice();
        const mk = ms[scr.tabIdx];
        if (mk !== 'ВСЕ') list = list.filter(c => F.Cars.get(c.id).make.toUpperCase() === mk);
        list.sort((a, b) => (b.uid === g.profile.current) - (a.uid === g.profile.current) || g.carPI(a) - g.carPI(b));
        let firstCard = null;
        for (const entry of list) {
          const car = F.Cars.get(entry.id);
          const pi = g.carPI(entry);
          const R = F.RARITY[car.rarity];
          const ok = !opts.filter || opts.filter(entry);
          const cur = entry.uid === g.profile.current;
          const card = this.nav(h('div', 'fz-card' + (cur ? ' cur' : '') + (ok ? '' : ' bad'), `<div class="fz-card-t"><b>${esc(car.model.toUpperCase())} <span>${car.year}</span></b><small>${esc(car.make.toUpperCase())}</small></div><img src="${this.entryThumb(entry)}">${cur ? '<em class="fz-cur">ТЕКУЩАЯ</em>' : ''}<div class="fz-card-b"><span style="background:${R.col}">${R.name}</span>${clsBadge(pi)}</div>`), () => {
            if (!ok) { this.ui.toast('Эта машина не подходит по классу', null, '#ff8080'); return; }
            if (opts.pick) { opts.pick(entry); return; }
            if (!cur) { g.setCar(entry.uid); this.ui.audio.play('select'); this.ui.toast('Машина доставлена: ' + car.make + ' ' + car.model); }
            render();
          });
          card._onFocus = () => { info.innerHTML = ''; info.appendChild(this.statPanel(entry)); scr.sel = entry; };
          if (!firstCard) firstCard = card;
          cards.appendChild(card);
        }
        if (firstCard) firstCard.setAttribute('data-first', '1');
        el.appendChild(this.hints([['Enter', opts.pick ? 'Выбрать' : 'Сесть за руль'], ['Esc', 'Назад'], ['Q / E', 'Марка'], ['T', 'Тюнинг'], ['P', 'Покраска'], ['Del', 'Продать']]));
        this.autoFocus(scr);
      };
      scr.tab = d => { const n = makes().length; scr.tabIdx = (scr.tabIdx + d + n) % n; render(); };
      scr.refresh = render;
      scr.onKey = e => {
        if (!scr.sel) return false;
        if (e.code === 'KeyT') { this.push(this.tune(scr.sel.uid)); return true; }
        if (e.code === 'KeyP') { this.push(this.paint(scr.sel.uid)); return true; }
        if (e.code === 'Delete') {
          const entry = scr.sel;
          if (entry.uid === g.profile.current || g.profile.cars.length < 2) { this.ui.toast('Нельзя продать текущую машину', null, '#ff8080'); return true; }
          const val = Math.round(g.carValue(entry) * 0.6);
          this.confirm('Продать машину', `${esc(F.Cars.get(entry.id).make)} ${esc(F.Cars.get(entry.id).model)} за <b>CR ${F.fmtCR(val)}</b>?`, () => { g.sellCar(entry.uid); this.top.refresh(); });
          return true;
        }
        return false;
      };
      render();
      return scr;
    }

    autoshow() {
      const g = this.g, ui = this.ui;
      const el = h('div', 'fz-scr fz-show');
      const makes = [...new Set(F.Cars.CARS.filter(c => !c.barn).map(c => c.make))].sort();
      const scr = { el, make: makes[0], sel: null };
      scr.showroom = () => scr.sel ? { id: scr.sel.id, c1: scr.sel.col, c2: scr.sel.col2 || scr.sel.col, livery: scr.sel.livery || 'none', metal: scr.sel.year >= 1992, cx: 0.53, dist: 2.4 } : null;
      const render = () => {
        el.innerHTML = '';
        el.appendChild(this.topBar());
        el.appendChild(h('div', 'fz-gtitle', 'Автосалон'));
        const cols = h('div', 'fz-show-cols');
        const ml = h('div', 'fz-show-makes');
        const cl = h('div', 'fz-show-cars');
        const sp = h('div', 'fz-show-spec');
        makes.forEach(m => {
          const b = this.nav(h('div', 'fz-smake' + (m === scr.make ? ' on' : ''), esc(m)), () => { scr.make = m; render(); });
          b._onFocus = () => { if (scr.make !== m) { scr.make = m; fillCars(); } };
          ml.appendChild(b);
        });
        const fillCars = () => {
          cl.innerHTML = '';
          ml.querySelectorAll('.fz-smake').forEach(b => b.classList.toggle('on', b.textContent === scr.make));
          const list = F.Cars.CARS.filter(c => !c.barn && c.make === scr.make).sort((a, b) => a.price - b.price);
          if (!scr.sel || scr.sel.make !== scr.make) scr.sel = list[0] || null;
          if (scr.sel) { ui.showroom = scr.showroom(); fillSpec(scr.sel); }
          for (const car of list) {
            const pi = F.perfOf(car.id, {}).pi;
            const owned = g.profile.cars.filter(c => c.id === car.id).length;
            const row = this.nav(h('div', 'fz-scar', `${clsBadge(pi)}<b>${esc(car.model)}</b><span>${car.year}</span><em>${owned ? '✓ ' + owned : ''}</em><i>CR ${F.fmtCR(car.price)}</i>`), () => buy(car));
            row._onFocus = () => { scr.sel = car; ui.showroom = scr.showroom(); fillSpec(car); };
            cl.appendChild(row);
          }
        };
        const fillSpec = car => {
          const pf = F.perfOf(car.id, {});
          const R = F.RARITY[car.rarity];
          const spec = F.Cars.spec(car.id, {});
          sp.innerHTML = `<div class="fz-brand">${esc(car.make)}</div><h2>${esc(car.model)} <small>${car.year}</small></h2><div class="fz-rar" style="background:${R.col}">${R.name}</div>
            <div class="fz-bars">${STAT_NAMES.map(([k, n]) => `<div><span>${n}</span><i><u style="width:${pf[k] * 10}%"></u></i><b>${pf[k].toFixed(1)}</b></div>`).join('')}</div>
            <div class="fz-spec">${esc(F.Cars.COUNTRY[car.country])} · ${Math.round(spec.P / 745.7)} л.с. · ${car.kg} кг · ${car.dt} · 0–100 ${pf.t100.toFixed(1)} с · ${Math.round(pf.vmax)} км/ч</div>
            <div class="fz-price">${clsBadge(pf.pi)}<span><i>CR</i>${F.fmtCR(car.price)}</span></div>`;
          const b = this.nav(h('div', 'fz-btn fz-btn-hot' + (g.profile.credits < car.price ? ' fz-dis' : ''), g.profile.credits < car.price ? 'Не хватает кредитов' : 'Купить'), () => buy(car));
          sp.appendChild(b);
        };
        const buy = car => {
          if (g.profile.credits < car.price) { ui.toast('Не хватает кредитов', `Нужно CR ${F.fmtCR(car.price)}`, '#ff8080'); return; }
          this.confirm('Покупка', `Купить <b>${esc(car.make)} ${esc(car.model)}</b> за <b>CR ${F.fmtCR(car.price)}</b>?`, () => {
            const uid = g.buyCar(car.id);
            if (uid) {
              ui.audio.play('levelup');
              this.confirm('Новая машина', 'Машина в гараже. Сесть за руль сейчас?', () => { g.setCar(uid); this.top.refresh && this.top.refresh(); });
              render();
            }
          });
        };
        cols.appendChild(ml); cols.appendChild(cl); cols.appendChild(sp);
        el.appendChild(cols);
        fillCars();
        el.appendChild(this.hints([['↑↓', 'Выбор'], ['Enter', 'Купить'], ['Esc', 'Назад']]));
        this.autoFocus(scr);
      };
      scr.refresh = render;
      render();
      return scr;
    }

    tune(uid) {
      const g = this.g, ui = this.ui;
      const el = h('div', 'fz-scr fz-tune');
      const entry = g.profile.cars.find(c => c.uid === uid);
      const car = F.Cars.get(entry.id);
      const scr = { el, cat: 0 };
      scr.showroom = () => ({ id: entry.id, c1: entry.c1, c2: entry.c2, livery: entry.livery, metal: !!entry.metal, wing: F.Cars.spec(entry.id, entry.up).wing, cx: 0.8, dist: 2.6 });
      const render = () => {
        el.innerHTML = '';
        el.appendChild(this.topBar());
        el.appendChild(h('div', 'fz-gtitle', `Тюнинг · ${esc(car.make)} ${esc(car.model)}`));
        const cols = h('div', 'fz-tune-cols');
        const cats = h('div', 'fz-tcats');
        const opts = h('div', 'fz-topts');
        const stat = h('div', 'fz-tstat');
        F.Cars.UPGRADES.forEach((u, i) => {
          const lv = entry.up[u.id] | 0;
          const b = this.nav(h('div', 'fz-tcat' + (i === scr.cat ? ' on' : ''), `<b>${esc(u.name)}</b><small>${esc(u.levels[lv].name)}</small>`), () => { scr.cat = i; fillOpts(); });
          b._onFocus = () => { if (scr.cat !== i) { scr.cat = i; fillOpts(); } };
          if (i === scr.cat) b.setAttribute('data-first', '1');
          cats.appendChild(b);
        });
        const base = F.perfOf(entry.id, entry.up);
        const showStats = (preview) => {
          const pf = preview ? F.perfOf(entry.id, preview) : base;
          stat.innerHTML = `<div class="fz-pi-row">${clsBadge(base.pi)}${preview && pf.pi !== base.pi ? `<span class="fz-arrow">→</span>${clsBadge(pf.pi)}` : ''}</div>
            <div class="fz-bars">${STAT_NAMES.map(([k, n]) => {
              const d = pf[k] - base[k];
              return `<div><span>${n}</span><i><u style="width:${Math.min(base[k], pf[k]) * 10}%"></u>${d ? `<s class="${d > 0 ? 'up' : 'dn'}" style="left:${Math.min(base[k], pf[k]) * 10}%;width:${Math.abs(d) * 10}%"></s>` : ''}</i><b>${pf[k].toFixed(1)}</b></div>`;
            }).join('')}</div>
            <div class="fz-spec">0–100 ${pf.t100.toFixed(1)} с · ${Math.round(pf.vmax)} км/ч · ${pf.latG.toFixed(2)} g</div>`;
        };
        const fillOpts = () => {
          cats.querySelectorAll('.fz-tcat').forEach((b, i) => b.classList.toggle('on', i === scr.cat));
          opts.innerHTML = '';
          const u = F.Cars.UPGRADES[scr.cat];
          const cur = entry.up[u.id] | 0;
          u.levels.forEach((lv, i) => {
            const price = i ? g.partPrice(entry, u.id, i) : 0;
            const inst = i === cur;
            const b = this.nav(h('div', 'fz-topt' + (inst ? ' inst' : ''), `<b>${esc(lv.name)}</b><span>${inst ? 'УСТАНОВЛЕНО' : i === 0 ? 'Бесплатно' : 'CR ' + F.fmtCR(price)}</span>`), () => {
              if (inst) return;
              if (g.buyPart(uid, u.id, i)) { ui.audio.play('select'); render(); if (uid === g.profile.current) ui.toast(`${u.name}: ${lv.name}`, `PI ${F.perfOf(entry.id, entry.up).pi}`); }
              else ui.toast('Не хватает кредитов', `Нужно CR ${F.fmtCR(price)}`, '#ff8080');
            });
            b._onFocus = () => showStats(Object.assign({}, entry.up, { [u.id]: i }));
            opts.appendChild(b);
          });
          showStats(null);
        };
        cols.appendChild(cats); cols.appendChild(opts); cols.appendChild(stat);
        el.appendChild(cols);
        fillOpts();
        el.appendChild(this.hints([['↑↓', 'Выбор'], ['→', 'Детали'], ['Enter', 'Установить'], ['Esc', 'Назад']]));
        this.autoFocus(scr);
      };
      scr.refresh = render;
      render();
      return scr;
    }

    paint(uid) {
      const g = this.g, ui = this.ui;
      const el = h('div', 'fz-scr fz-paintscr');
      const entry = g.profile.cars.find(c => c.uid === uid);
      const car = F.Cars.get(entry.id);
      const st = { c1: entry.c1, c2: entry.c2 || entry.c1, livery: entry.livery || 'none', metal: !!entry.metal };
      const scr = { el };
      scr.showroom = () => ({ id: entry.id, c1: st.c1, c2: st.c2, livery: st.livery, metal: st.metal, wing: F.Cars.spec(entry.id, entry.up).wing, cx: 0.68, dist: 1.8 });
      const upd = () => { ui.showroom = scr.showroom(); };
      el.appendChild(this.topBar());
      el.appendChild(h('div', 'fz-gtitle', `Покраска · ${esc(car.make)} ${esc(car.model)}`));
      const panel = h('div', 'fz-ppanel');
      const pal = (title, key) => {
        panel.appendChild(h('div', 'fz-sethead', title));
        const row = h('div', 'fz-swatches');
        for (const c of F.PAINTS.concat([car.col])) {
          const sw = this.nav(h('div', 'fz-sw' + (st[key] === c ? ' on' : ''), ''), () => { st[key] = c; row.querySelectorAll('.fz-sw').forEach(x => x.classList.remove('on')); sw.classList.add('on'); upd(); });
          sw.style.background = c;
          sw._onFocus = () => { st[key] = c; row.querySelectorAll('.fz-sw').forEach(x => x.classList.remove('on')); sw.classList.add('on'); upd(); };
          row.appendChild(sw);
        }
        panel.appendChild(row);
      };
      pal('Основной цвет', 'c1');
      pal('Второй цвет', 'c2');
      const fin = h('div', 'fz-livs fz-finish');
      fin.appendChild(h('div', 'fz-sethead', 'Покрытие'));
      for (const [val, name] of [[false, 'Глянец'], [true, 'Металлик']]) {
        const b = this.nav(h('div', 'fz-liv' + (st.metal === val ? ' on' : ''), name), () => { st.metal = val; fin.querySelectorAll('.fz-liv').forEach(x => x.classList.toggle('on', x === b)); upd(); });
        fin.appendChild(b);
      }
      panel.appendChild(fin);
      panel.appendChild(h('div', 'fz-sethead', 'Ливрея'));
      const lv = h('div', 'fz-livs');
      for (const [id, name] of LIVERIES) {
        const b = this.nav(h('div', 'fz-liv' + (st.livery === id ? ' on' : ''), esc(name)), () => { st.livery = id; lv.querySelectorAll('.fz-liv').forEach(x => x.classList.toggle('on', x === b)); upd(); });
        lv.appendChild(b);
      }
      panel.appendChild(lv);
      const save = this.nav(h('div', 'fz-btn fz-btn-hot', 'Сохранить покраску'), () => { g.paintCar(uid, st.c1, st.c2, st.livery, st.metal); ui.audio.play('select'); ui.toast('Покраска сохранена'); this.pop(); });
      panel.appendChild(save);
      el.appendChild(panel);
      el.appendChild(this.hints([['Стрелки', 'Цвет'], ['Enter', 'Выбрать'], ['Esc', 'Отмена']]));
      return scr;
    }

    mapScreen(opts = {}) {
      const g = this.g, ui = this.ui;
      const el = h('div', 'fz-scr fz-mapscr');
      el.innerHTML = `<canvas class="fz-bigmap"></canvas><div class="fz-maptitle">КАРТА МИРА · РИГА</div><div class="fz-mapinfo"></div><div class="fz-legend"></div>`;
      const cv = el.querySelector('canvas'), info = el.querySelector('.fz-mapinfo'), legend = el.querySelector('.fz-legend');
      const v = g.veh;
      const scr = { el, cx: v.x, cz: v.z, zoom: 0.55, cur: { x: v.x, z: v.z }, hover: null, drag: null };
      const filters = { ev: true, st: true, bd: true, op: true, bf: true };
      legend.innerHTML = [['ev', 'События'], ['st', 'Трюки PR'], ['bd', 'Щиты'], ['op', 'Аванпосты'], ['bf', 'Слухи']].map(([k, n]) => `<label data-f="${k}" class="on">${n}</label>`).join('');
      legend.querySelectorAll('label').forEach(l => l.addEventListener('click', () => { filters[l.dataset.f] = !filters[l.dataset.f]; l.classList.toggle('on', filters[l.dataset.f]); }));
      const items = () => {
        const out = [];
        if (filters.ev) for (const ev of F.EV.EVENTS) if (ev.id !== 'prologue' && !(ev.id === 'finale' && g.eventLocked(ev))) out.push({ kind: 'ev', x: ev.via[0][0], z: ev.via[0][1], ev });
        if (filters.st) for (const d of g.stuntDefs) { const p = d.kind === 'trap' ? d.at : d.kind === 'jump' ? d.at : d.a; out.push({ kind: 'st', x: p[0], z: p[1], d }); }
        if (filters.bd) for (const b of g.world.boards) if (g.profile.boards.includes(b.id)) out.push({ kind: 'bd', x: b.x, z: b.z, b });
        if (filters.op) for (const o of F.MAP.OUTPOSTS) out.push({ kind: 'op', x: o.x, z: o.z, o });
        if (filters.bf) for (const r of g.rumors()) out.push({ kind: 'bf', x: r.rumor[0], z: r.rumor[1], r });
        return out;
      };
      const draw = () => {
        const W = cv.clientWidth, H = cv.clientHeight;
        if (!W || !H) return;
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        const c = cv.getContext('2d');
        const art = ui.mapArt;
        c.fillStyle = '#1a3a5a'; c.fillRect(0, 0, W, H);
        const k = scr.zoom;
        const sx = x => W / 2 + (x - scr.cx) * k, sz = z => H / 2 + (z - scr.cz) * k;
        if (art) c.drawImage(art.cv, sx(art.x0), sz(art.z0), art.W / art.scale * k, art.H / art.scale * k);
        if (g.waypoint && g.gps) {
          c.strokeStyle = '#3a8cff'; c.lineWidth = 4; c.beginPath();
          for (let i = 0; i < g.gps.n; i += 2) { const x = sx(g.gps.x[i]), y = sz(g.gps.z[i]); if (i) c.lineTo(x, y); else c.moveTo(x, y); }
          c.stroke();
        }
        scr.hover = null;
        let hd = 14;
        for (const it of items()) {
          const x = sx(it.x), y = sz(it.z);
          if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
          const cxp = sx(scr.cur.x), czp = sz(scr.cur.z);
          const dd = Math.hypot(x - cxp, y - czp);
          if (dd < hd) { hd = dd; scr.hover = it; }
          this.mapIcon(c, it, x, y, g);
        }
        c.save(); c.translate(sx(v.x), sz(v.z)); c.rotate(v.yaw);
        c.fillStyle = '#fff'; c.strokeStyle = '#e6146e'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(0, -12); c.lineTo(9, 10); c.lineTo(0, 5); c.lineTo(-9, 10); c.closePath(); c.fill(); c.stroke();
        c.restore();
        if (g.waypoint) { c.fillStyle = '#e6146e'; c.beginPath(); c.arc(sx(g.waypoint.x), sz(g.waypoint.z), 7, 0, Math.PI * 2); c.fill(); }
        const px = sx(scr.cur.x), pz = sz(scr.cur.z);
        c.strokeStyle = '#fff'; c.lineWidth = 2;
        c.beginPath(); c.arc(px, pz, 16, 0, Math.PI * 2); c.moveTo(px - 24, pz); c.lineTo(px - 10, pz); c.moveTo(px + 10, pz); c.lineTo(px + 24, pz); c.moveTo(px, pz - 24); c.lineTo(px, pz - 10); c.moveTo(px, pz + 10); c.lineTo(px, pz + 24); c.stroke();
        const it = scr.hover;
        const d = g.world.districtAt(scr.cur.x, scr.cur.z);
        let html = `<div class="fz-mi-loc">${esc(d ? d.name : 'Рига')}</div>`;
        if (it) html += this.mapInfo(it, g);
        else html += `<div class="fz-mi-act"><kbd>Enter</kbd> Поставить метку</div>`;
        if (info.innerHTML !== html) info.innerHTML = html;
      };
      scr.draw = draw;
      const act = () => {
        const it = scr.hover;
        if (it && it.kind === 'op') {
          if (!g.profile.outposts.includes(it.o.id)) { ui.toast('Аванпост ещё не открыт', 'Доберитесь до него своим ходом', '#ff8080'); return; }
          const cost = g.fastTravelCost(it.o.id);
          this.confirm('Быстрое перемещение', `Переместиться: <b>${esc(it.o.name)}</b>${cost ? ` за <b>CR ${F.fmtCR(cost)}</b>` : ' бесплатно'}?`, () => {
            if (g.fastTravel(it.o.id)) { this.closeAll(); ui.resumeFromMenu(); } else ui.toast('Не хватает кредитов', null, '#ff8080');
          });
          return;
        }
        const x = it ? it.x : scr.cur.x, z = it ? it.z : scr.cur.z;
        g.setWaypoint(x, z);
        ui.toast('Метка поставлена', 'Маршрут — синей линией', '#3a8cff');
      };
      scr.onKey = e => {
        const step = 40 / scr.zoom * 0.35;
        switch (e.code) {
          case 'ArrowLeft': case 'KeyA': scr.cur.x -= step; break;
          case 'ArrowRight': case 'KeyD': scr.cur.x += step; break;
          case 'ArrowUp': case 'KeyW': scr.cur.z -= step; break;
          case 'ArrowDown': case 'KeyS': scr.cur.z += step; break;
          case 'Equal': case 'NumpadAdd': case 'KeyZ': scr.zoom = Math.min(3, scr.zoom * 1.25); break;
          case 'Minus': case 'NumpadSubtract': case 'KeyX': scr.zoom = Math.max(0.12, scr.zoom / 1.25); break;
          case 'Enter': case 'Space': act(); break;
          case 'Delete': g.setWaypoint(null); break;
          case 'Escape': case 'Backspace': case 'KeyM': this.pop(); return true;
          default: return false;
        }
        const W = cv.clientWidth, H = cv.clientHeight;
        const mx = (scr.cur.x - scr.cx) * scr.zoom, mz = (scr.cur.z - scr.cz) * scr.zoom;
        if (Math.abs(mx) > W * 0.35) scr.cx += (mx - Math.sign(mx) * W * 0.35) / scr.zoom;
        if (Math.abs(mz) > H * 0.35) scr.cz += (mz - Math.sign(mz) * H * 0.35) / scr.zoom;
        return true;
      };
      cv.addEventListener('wheel', e => { e.preventDefault(); scr.zoom = F.clamp(scr.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 0.12, 3); }, { passive: false });
      cv.addEventListener('mousedown', e => { scr.drag = { x: e.clientX, y: e.clientY, cx: scr.cx, cz: scr.cz, moved: false }; });
      cv.addEventListener('mousemove', e => {
        const r = cv.getBoundingClientRect();
        if (scr.drag && (e.buttons & 1)) {
          const dx = e.clientX - scr.drag.x, dy = e.clientY - scr.drag.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) scr.drag.moved = true;
          scr.cx = scr.drag.cx - dx / scr.zoom; scr.cz = scr.drag.cz - dy / scr.zoom;
        }
        scr.cur.x = scr.cx + (e.clientX - r.left - r.width / 2) / scr.zoom;
        scr.cur.z = scr.cz + (e.clientY - r.top - r.height / 2) / scr.zoom;
      });
      cv.addEventListener('mouseup', () => { if (scr.drag && !scr.drag.moved) act(); scr.drag = null; });
      if (opts.ft) filters.ev = filters.st = filters.bd = filters.bf = false;
      return scr;
    }

    mapIcon(c, it, x, y, g) {
      c.save();
      c.translate(x, y);
      if (it.kind === 'ev') {
        const locked = g.eventLocked(it.ev);
        const res = g.profile.results[it.ev.id];
        c.fillStyle = locked ? '#666' : F.EV.TYPES[it.ev.type].col;
        c.beginPath(); c.moveTo(0, -11); c.lineTo(10, 0); c.lineTo(0, 11); c.lineTo(-10, 0); c.closePath(); c.fill();
        c.strokeStyle = res && res.pos === 1 ? '#ffcf20' : '#fff'; c.lineWidth = 2; c.stroke();
      } else if (it.kind === 'st') {
        const best = g.profile.stunts[it.d.id] || 0;
        const n = it.d.stars.filter(t => best >= t).length;
        c.fillStyle = n === 3 ? '#ffcf20' : '#e6146e';
        c.fillRect(-6, -6, 12, 12);
        c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.strokeRect(-6, -6, 12, 12);
      } else if (it.kind === 'bd') {
        c.fillStyle = it.b.kind === 'xp' ? '#ffb020' : '#30b4ff';
        c.fillRect(-5, -4, 10, 8);
      } else if (it.kind === 'op') {
        const got = g.profile.outposts.includes(it.o.id);
        c.fillStyle = got ? '#e6146e' : '#777';
        c.beginPath(); c.moveTo(0, -12); c.lineTo(11, 9); c.lineTo(-11, 9); c.closePath(); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
      } else if (it.kind === 'bf') {
        c.strokeStyle = 'rgba(255,207,32,0.9)'; c.lineWidth = 2; c.setLineDash([5, 4]);
        c.beginPath(); c.arc(0, 0, 180 * this.top.zoom, 0, Math.PI * 2); c.stroke();
        c.setLineDash([]);
        c.fillStyle = '#ffcf20'; c.font = 'bold 14px Arial'; c.textAlign = 'center'; c.fillText('?', 0, 5);
      }
      c.restore();
    }

    mapInfo(it, g) {
      if (it.kind === 'ev') {
        const ev = it.ev, T = F.EV.TYPES[ev.type];
        const res = g.profile.results[ev.id];
        const locked = g.eventLocked(ev);
        return `<div class="fz-mi-card"><i style="background:${T.col}">${T.name}</i><b>${esc(ev.name)}</b><p>${esc(ev.desc)}</p><div>Класс ${ev.cls}${ev.laps > 1 ? ` · ${ev.laps} круга` : ''}${ev.rivals ? ` · ${ev.rivals + 1} участников` : ''}</div>
          <div>${locked ? `Нужен ${esc(F.EV.BANDS[Math.max(0, ev.tier)].name.toLowerCase())}` : res ? `Лучший результат: ${res.pos}-е место · ${F.fmtTime(res.time)}` : 'Ещё не пройдено'}</div></div><div class="fz-mi-act"><kbd>Enter</kbd> Проложить маршрут</div>`;
      }
      if (it.kind === 'st') {
        const d = it.d, best = g.profile.stunts[d.id] || 0;
        const kn = { trap: 'Скоростная ловушка', zone: 'Зона скорости', drift: 'Зона дрифта', jump: 'Опасный прыжок' }[d.kind];
        const unit = d.kind === 'drift' ? ' очк.' : d.kind === 'jump' ? ' м' : ' км/ч';
        return `<div class="fz-mi-card"><i style="background:#e6146e">${kn}</i><b>${esc(d.name)}</b><div>Звёзды: ${d.stars.map(s => F.fmtCR(s) + unit).join(' / ')}</div><div>Рекорд: ${best ? F.fmtCR(best) + unit : '—'}</div></div><div class="fz-mi-act"><kbd>Enter</kbd> Проложить маршрут</div>`;
      }
      if (it.kind === 'op') {
        const got = g.profile.outposts.includes(it.o.id);
        const cost = g.fastTravelCost(it.o.id);
        return `<div class="fz-mi-card"><i style="background:#e6146e">Аванпост Horizon</i><b>${esc(it.o.name)}</b><div>${got ? (cost ? `Перемещение: CR ${F.fmtCR(cost)}` : 'Перемещение бесплатно') : 'Не открыт — доберитесь своим ходом'}</div></div><div class="fz-mi-act"><kbd>Enter</kbd> ${got ? 'Быстрое перемещение' : 'Проложить маршрут'}</div>`;
      }
      if (it.kind === 'bf') return `<div class="fz-mi-card"><i style="background:#ffcf20;color:#000">Слух</i><b>Находка в сарае</b><p>${esc(it.r.hint)}</p><div>Ищите сарай в пределах круга и подъезжайте к воротам медленно.</div></div>`;
      if (it.kind === 'bd') return `<div class="fz-mi-card"><i style="background:#30b4ff">Щит собран</i><b>${it.b.kind === 'xp' ? 'Щит опыта' : 'Щит быстрого перемещения'}</b></div>`;
      return '';
    }

    lobby(ev) {
      const g = this.g, ui = this.ui;
      const el = h('div', 'fz-scr fz-lobby');
      const T = F.EV.TYPES[ev.type];
      const scr = { el, diff: g.settings.diff };
      const render = () => {
        el.innerHTML = '';
        el.appendChild(this.topBar());
        const card = h('div', 'fz-lcard', `<div class="fz-lhead" style="background:${T.col}"><span>${T.name.toUpperCase()}</span><b>${esc(ev.name)}</b></div>
          <p>${esc(ev.desc)}</p>
          <div class="fz-lmeta"><div><span>Класс</span><b>${ev.cls}</b></div><div><span>Длина</span><b>${F.fmtDist(ui.routeLen(ev))}</b></div><div><span>Круги</span><b>${ev.laps}</b></div><div><span>Участники</span><b>${ev.rivalCar ? (ev.rivalCar === 'train' ? 'Электричка ER2' : 'Самолёт Ан-2') : ev.rivals + 1}</b></div>
          <div><span>Время</span><b>${String(Math.floor(ev.time)).padStart(2, '0')}:${String(Math.round((ev.time % 1) * 60)).padStart(2, '0')}</b></div><div><span>Трафик</span><b>${ev.traffic ? 'Да' : 'Нет'}</b></div></div>
          <div class="fz-lreward">Награда за победу: <b>CR ${F.fmtCR((ev.id === 'finale' ? 100000 : F.EV.CLASS_PAY[ev.cls] * (ev.type === 'showcase' ? 1.5 : 1)) * (1 + F.DIFF[scr.diff].pay))}</b></div>
          ${g.profile.results[ev.id] ? `<div class="fz-lbest">Лучший результат: ${g.profile.results[ev.id].pos}-е · ${F.fmtTime(g.profile.results[ev.id].time)}</div>` : ''}`);
        const mapc = h('canvas', 'fz-lmap');
        card.appendChild(mapc);
        el.appendChild(card);
        const side = h('div', 'fz-lside');
        const entry = g.entry, car = F.Cars.get(entry.id), pi = g.carPI(entry);
        const allowed = g.eventAllowed(ev);
        const tooLow = F.classIndex(F.classOf(pi).c) < F.classIndex(ev.cls);
        side.appendChild(h('div', 'fz-lcar', `<img src="${this.entryThumb(entry)}"><div>${carTitle(car)}</div>${clsBadge(pi)}${!allowed ? `<p class="fz-bad">Класс машины выше класса ${ev.cls}. Выберите другую машину.</p>` : tooLow ? `<p class="fz-warn">Соперники будут на машинах класса ${ev.cls} — ваша машина слабее. Улучшите её или выберите другую.</p>` : ''}`));
        const chg = this.nav(h('div', 'fz-btn', 'Сменить машину'), () => {
          this.push(this.garage({ title: 'Выбор машины · класс ' + ev.cls, filter: e => g.eventAllowed(ev, e), pick: e => { g.setCar(e.uid); this.pop(); render(); } }));
        });
        side.appendChild(chg);
        const diffRow = h('div', 'fz-setrow', `<span>Сложность</span><b><i>◀</i><em>${F.DIFF[scr.diff].name}</em><i>▶</i></b>`);
        this.nav(diffRow, () => { scr.diff = (scr.diff + 1) % 5; g.settings.diff = scr.diff; render(); }, d => { scr.diff = (scr.diff + d + 5) % 5; g.settings.diff = scr.diff; render(); });
        side.appendChild(diffRow);
        const go = this.nav(h('div', 'fz-btn fz-btn-hot fz-go' + (allowed ? '' : ' fz-dis'), 'СТАРТ'), () => {
          if (!g.eventAllowed(ev)) { ui.toast('Машина не подходит по классу', null, '#ff8080'); return; }
          this.closeAll();
          ui.beginEvent(ev.id);
        });
        go.setAttribute('data-first', '1');
        side.appendChild(go);
        el.appendChild(side);
        el.appendChild(this.hints([['Enter', 'Старт'], ['←→', 'Сложность'], ['Esc', 'Отмена']]));
        this.autoFocus(scr);
        requestAnimationFrame(() => this.drawRoute(mapc, ev));
      };
      scr.refresh = render;
      render();
      return scr;
    }

    drawRoute(cv, ev) {
      const ui = this.ui, art = ui.mapArt;
      const route = ui.routeFor(ev);
      if (!art || !route) return;
      const W = cv.clientWidth || 300, H = cv.clientHeight || 200;
      cv.width = W; cv.height = H;
      const c = cv.getContext('2d');
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (let i = 0; i < route.n; i++) { x0 = Math.min(x0, route.x[i]); x1 = Math.max(x1, route.x[i]); z0 = Math.min(z0, route.z[i]); z1 = Math.max(z1, route.z[i]); }
      const k = Math.min(W / (x1 - x0 + 200), H / (z1 - z0 + 200));
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      c.fillStyle = '#123'; c.fillRect(0, 0, W, H);
      c.drawImage(art.cv, W / 2 + (art.x0 - cx) * k, H / 2 + (art.z0 - cz) * k, art.W / art.scale * k, art.H / art.scale * k);
      c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.lineJoin = 'round';
      c.beginPath();
      for (let i = 0; i < route.n; i++) { const x = W / 2 + (route.x[i] - cx) * k, y = H / 2 + (route.z[i] - cz) * k; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
      if (route.closed) c.closePath();
      c.stroke();
      c.strokeStyle = F.EV.TYPES[ev.type].col; c.lineWidth = 3.5; c.stroke();
      const sx = W / 2 + (route.x[0] - cx) * k, sy = H / 2 + (route.z[0] - cz) * k;
      c.fillStyle = '#3fc46a'; c.beginPath(); c.arc(sx, sy, 7, 0, Math.PI * 2); c.fill();
      if (!route.closed) { const ex = W / 2 + (route.x[route.n - 1] - cx) * k, ey = H / 2 + (route.z[route.n - 1] - cz) * k; c.fillStyle = '#e6146e'; c.beginPath(); c.arc(ex, ey, 7, 0, Math.PI * 2); c.fill(); }
    }

    results(r, ev) {
      const g = this.g, ui = this.ui;
      const el = h('div', 'fz-scr fz-results');
      const T = F.EV.TYPES[ev.type];
      const special = !!(g.race && g.race.special);
      const won = r.pos === 1;
      const head = ev.id === 'prologue' ? 'ДОБРО ПОЖАЛОВАТЬ В HORIZON' : special ? (won ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ') : `${r.pos}-Е МЕСТО`;
      el.innerHTML = `<div class="fz-rhead" style="--c:${T.col}"><span>${esc(ev.name)}</span><b>${head}</b><em>${F.fmtTime(r.time)}</em></div>`;
      const cols = h('div', 'fz-rcols');
      const table = h('div', 'fz-rtable');
      if (ev.id !== 'prologue') {
        r.standings.forEach((row, i) => {
          const car = row.car ? F.Cars.get(row.car) : null;
          table.appendChild(h('div', 'fz-rrow' + (row.player ? ' me' : ''), `<span>${i + 1}</span><b>${esc(row.name)}</b><em>${car ? esc(car.make + ' ' + car.model) : row.special ? '' : ''}</em><i>${row.done ? F.fmtTime(row.time) : '+' + F.fmtTime(Math.max(0, row.est - r.time)).slice(3)}</i>`));
        });
      } else {
        table.appendChild(h('div', 'fz-rtext', `<p>«Рига, лето 2001-го! Городу 800 лет, и мы празднуем по-своему. Я — Марта Лиепиня, директор фестиваля Horizon. Этот McLaren — главный приз финала, а тебе придётся начать с чего-то попроще.»</p><p>«Твой дядя оставил тебе свою пятёрку — Lada 2105 1985 года. Не смейся: она уже у сцены. Побеждай в гонках, собирай очки фестиваля, получай браслеты — и в финале сразишься с Вилксом, королём рижских улиц.»</p>`));
      }
      cols.appendChild(table);
      const rw = h('div', 'fz-rrew', `<div><span>Кредиты</span><b class="fz-count" data-v="${r.cr}">CR 0</b></div><div><span>Опыт</span><b>+${F.fmtCR(r.xp)} XP</b></div>${ev.id !== 'prologue' ? `<div><span>Очки фестиваля</span><b>+${r.gained} (${r.pts} за событие)</b></div><div><span>Бонус сложности и ассистентов</span><b>+${Math.round(r.bonus * 100)}%</b></div>` : ''}${r.prev && r.prev.time && r.time < r.prev.time ? '<div class="fz-rnew">Новый рекорд!</div>' : ''}`);
      cols.appendChild(rw);
      el.appendChild(cols);
      const row = h('div', 'fz-row fz-rbtns');
      const cont = this.nav(h('div', 'fz-btn fz-btn-hot', 'Продолжить'), () => { this.closeAll(); ui.afterResults(r, ev, false); });
      cont.setAttribute('data-first', '1');
      row.appendChild(cont);
      if (ev.id !== 'prologue') row.appendChild(this.nav(h('div', 'fz-btn', 'Перезапустить'), () => { this.closeAll(); ui.afterResults(r, ev, true); }));
      el.appendChild(row);
      const cnt = el.querySelector('.fz-count');
      if (cnt) {
        const target = +cnt.dataset.v;
        let t0 = performance.now();
        const tick = () => {
          const k = Math.min(1, (performance.now() - t0) / 1200);
          cnt.textContent = 'CR ' + F.fmtCR(target * (1 - Math.pow(1 - k, 3)));
          if (k < 1 && el.isConnected) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
      return { el, back: () => { this.closeAll(); ui.afterResults(r, ev, false); } };
    }

    racePause() {
      const ui = this.ui, g = this.g;
      const el = h('div', 'fz-scr fz-modal-wrap');
      const box = h('div', 'fz-modal fz-rpause', `<h2>${esc(g.race.ev.name)}</h2>`);
      const add = (t, fn, first) => { const b = this.nav(h('div', 'fz-btn' + (first ? ' fz-btn-hot' : ''), t), fn); if (first) b.setAttribute('data-first', '1'); box.appendChild(b); };
      add('Продолжить', () => { this.pop(); }, true);
      add('Перезапустить', () => { this.closeAll(); ui.restartEvent(); });
      add('Фоторежим', () => ui.openPhoto());
      add('Настройки', () => this.push(this.settingsScreen(true)));
      if (g.race.ev.id !== 'prologue') add('Покинуть гонку', () => this.confirm('Покинуть гонку', 'Результат не будет засчитан.', () => { this.closeAll(); ui.quitEvent(); }));
      el.appendChild(box);
      return { el };
    }

    debug() {
      const ui = this.ui, g = this.g, p = g.profile;
      const el = h('div', 'fz-scr fz-dbg');
      const panel = h('div', 'fz-dbg-panel');
      el.appendChild(panel);
      const scr = { el, tp: 0, isDebug: true };
      const groups = ['Аванпосты', 'Достопримечательности', 'События', 'Сараи'];
      const spots = g.teleportSpots();
      const status = h('div', 'fz-dbg-status');
      const infos = [];
      const say = t => { for (const f of infos) f(); status.textContent = t; status.classList.remove('on'); void status.offsetWidth; status.classList.add('on'); };
      const btn = (t, fn, cls = '') => this.nav(h('div', 'fz-dbg-btn ' + cls, esc(t)), fn);
      const section = (title, info) => {
        const s = h('div', 'fz-dbg-sec', `<div class="fz-dbg-h"><b>${esc(title)}</b><span></span></div>`);
        const row = h('div', 'fz-dbg-row');
        s.appendChild(row);
        panel.appendChild(s);
        const inf = s.querySelector('.fz-dbg-h span');
        const upd = () => { inf.textContent = info(); };
        upd();
        infos.push(upd);
        return { row, upd };
      };
      panel.appendChild(h('div', 'fz-dbg-top', '<b>ОТЛАДКА</b><span><kbd>F7</kbd> закрыть</span>'));
      const cr = section('Кредиты', () => 'CR ' + F.fmtCR(p.credits));
      for (const n of [10000, 100000, 1000000]) cr.row.appendChild(btn('+' + F.fmtCR(n), () => { g.grantCredits(n); cr.upd(); say('Начислено CR ' + F.fmtCR(n)); }));
      const xp = section('Опыт', () => `Уровень ${p.level} · ${F.fmtCR(p.xp)} / ${F.fmtCR(F.EV.xpForLevel(p.level))} XP`);
      for (const n of [1000, 10000]) xp.row.appendChild(btn('+' + F.fmtCR(n) + ' XP', () => { g.grantXp(n); xp.upd(); say('Начислено ' + F.fmtCR(n) + ' XP'); }));
      xp.row.appendChild(btn('+1 уровень', () => { const l = p.level; g.grantLevel(); xp.upd(); say(p.level > l ? 'Уровень ' + p.level : 'Максимальный уровень'); }));
      const wx = section('Погода', () => F.WEATHER[g.weather].name + (g.race ? ' · недоступно в гонке' : ''));
      const wbtns = {};
      const markWx = () => { for (const [id, b] of Object.entries(wbtns)) b.classList.toggle('on', id === g.weather); wx.upd(); };
      for (const id of Object.keys(F.WEATHER)) {
        wbtns[id] = btn(F.WEATHER[id].name, () => {
          if (g.race) { say('Погоду нельзя сменить во время гонки'); return; }
          g.setWeather(id, true);
          markWx();
          say('Погода: ' + F.WEATHER[id].name.toLowerCase());
        }, 'fz-dbg-wx fz-dbg-w-' + id);
        wx.row.appendChild(wbtns[id]);
      }
      markWx();
      wx.row.appendChild(btn('Молния рядом', () => {
        if (g.race) { say('Недоступно во время гонки'); return; }
        if (g.weather !== 'storm') { g.setWeather('storm', true); markWx(); }
        g.strike(true);
        ui.handleEvents(g.drain());
        say('Удар молнии');
      }, 'fz-dbg-wide'));
      const dm = section('Повреждения', () => {
        const d = g.veh.dmg;
        if (!d) return 'выключены в настройках';
        return `кузов ${Math.round(d.severity() * 100)}% · мотор ${Math.round(d.hp * 100)}%${d.burning ? ' · горит' : ''}${d.burnt ? ' · разбита' : ''}`;
      });
      for (const [name, kind, text] of [['Спереди', 'front', 'Лобовой удар'], ['Сзади', 'rear', 'Удар в корму'], ['Слева', 'left', 'Боковой удар'], ['Справа', 'right', 'Боковой удар'], ['Мотор 25%', 'engine', 'Двигатель повреждён'], ['Прокол', 'flat', 'Прокол переднего колеса'], ['Поджечь', 'fire', 'Двигатель горит'], ['Ремонт', 'repair', 'Машина отремонтирована']]) {
        dm.row.appendChild(btn(name, () => {
          if (!g.debugDamage(kind)) { say('Повреждения выключены в настройках'); return; }
          ui.handleEvents(g.drain());
          dm.upd();
          say(text);
        }));
      }
      const tm = section('Время суток', () => hhmm(g.clock));
      for (const [name, c] of TIME_PRESETS) tm.row.appendChild(btn(name, () => {
        if (g.race) { say('Недоступно во время гонки'); return; }
        g.clock = c; p.clock = c; tm.upd(); say('Время: ' + hhmm(c));
      }));
      const tpSec = h('div', 'fz-dbg-sec fz-dbg-tpsec', '<div class="fz-dbg-h"><b>Телепорт</b><span></span></div>');
      const tabs = h('div', 'fz-dbg-tabs'), list = h('div', 'fz-dbg-list');
      tpSec.appendChild(tabs); tpSec.appendChild(list);
      panel.appendChild(tpSec);
      tpSec.querySelector('span').textContent = g.race ? 'недоступно в гонке' : spots.length + ' мест';
      const go = s => {
        if (!g.teleport(s)) { say(g.race ? 'Телепорт недоступен во время гонки' : 'Рядом нет дороги'); return; }
        this.closeAll();
        ui.resumeFromMenu();
        ui.handleEvents(g.drain());
      };
      const fill = () => {
        list.innerHTML = '';
        if (scr.tp === groups.length) {
          const w = g.waypoint;
          list.appendChild(w ? btn('К метке на карте', () => go({ name: 'Метка на карте', x: w.x, z: w.z }), 'fz-dbg-item') : h('div', 'fz-dbg-empty', 'Метка не поставлена — откройте карту (M) и нажмите Enter'));
        } else for (const s of spots.filter(q => q.group === groups[scr.tp])) list.appendChild(btn(s.name, () => go(s), 'fz-dbg-item'));
        tabs.querySelectorAll('.fz-dbg-tab').forEach((t, i) => t.classList.toggle('on', i === scr.tp));
      };
      groups.concat(['Метка']).forEach((name, i) => tabs.appendChild(this.nav(h('div', 'fz-dbg-tab', esc(name === 'Достопримечательности' ? 'Места' : name)), () => { scr.tp = i; fill(); })));
      fill();
      panel.appendChild(status);
      panel.appendChild(this.hints([['Enter', 'Выбрать'], ['Q / E', 'Разделы телепорта'], ['Esc / F7', 'Закрыть']]));
      scr.tab = d => { scr.tp = (scr.tp + d + groups.length + 1) % (groups.length + 1); fill(); this.ui.audio.play('blip'); };
      scr.onKey = e => { if (e.code === 'F7') { this.pop(); return true; } return false; };
      return scr;
    }

    credits() {
      const ui = this.ui;
      const el = h('div', 'fz-scr fz-credits');
      const lines = ['FORZA HORIZON: РИГА', '', 'Чемпион фестиваля Horizon Rīga 2001', '', '— Фестиваль —', 'Марта Лиепиня — директор', 'Вилкс — король рижских улиц', '', '— Город —', 'Вецрига · Центр · Межапаркс', 'Задаугава · Кенгарагс · Пурвциемс', 'Юрмала · Бикерниеки · Спилве', '', '— Машины —', ...F.Cars.CARS.map(c => `${c.year} ${c.make} ${c.model}`), '', 'Спасибо за игру!', '', 'Фестиваль продолжается — Рига ждёт.'];
      el.innerHTML = `<div class="fz-croll">${lines.map(l => `<div>${esc(l)}</div>`).join('')}</div>`;
      const b = this.nav(h('div', 'fz-btn fz-cskip', 'Продолжить'), () => { this.pop(); });
      el.appendChild(b);
      return { el, back: () => this.pop() };
    }
  }

  F.Menus = Menus;
})(globalThis.Forza = globalThis.Forza || {});
