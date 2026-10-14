(function (S) {
  'use strict';
  const { esc, iconSVG, MOODLETS, WISHES, LTW } = S;
  const G = S.UI.prototype;
  const TABS = [['needs', 'ui_plumbob', 'Потребности'], ['rel', 'ui_rel', 'Отношения'], ['career', 'm_briefcase', 'Карьера и учёба'], ['skills', 'sk_logic', 'Навыки'], ['opps', 'ui_opp', 'Возможности'], ['rewards', 'm_star', 'Награды за счастье'], ['inv', 'ui_inv', 'Инвентарь'], ['simology', 'ui_simology', 'Характер']];

  function btn(icon, title, cls, size) { return '<button class="s3-btn ' + (cls || '') + '" title="' + esc(title) + '" data-a="' + icon + '">' + iconSVG(icon, size || 18) + '</button>'; }

  G.buildHud = function () {
    const h = this.hudEl;
    h.innerHTML = '';
    const bottom = document.createElement('div');
    bottom.className = 's3-bottom';
    bottom.style.cssText = 'position:absolute;left:0;bottom:0;width:900px;height:220px;transform-origin:left bottom;pointer-events:none;';
    bottom.innerHTML =
      '<div class="s3-portraits" style="pointer-events:auto"></div>' +
      '<div class="s3-cp" style="pointer-events:auto"><div class="walls">' + btn('ui_wup', 'Стены подняты (V)', 'sm', 13) + btn('ui_wcut', 'Стены в разрезе (V)', 'sm', 13) + btn('ui_wdown', 'Стены опущены (V)', 'sm', 13) + btn('ui_gear', 'Меню игры (Esc)', 'sm', 14) + '</div>' +
      '<div class="ring"><div class="inner"></div>' +
      '<button class="s3-btn sm" style="left:4px;top:8px" data-a="rotl" title="Повернуть (Q)">' + iconSVG('ui_rotl', 13) + '</button>' +
      '<button class="s3-btn sm" style="right:4px;top:8px" data-a="rotr" title="Повернуть (E)">' + iconSVG('ui_rotr', 13) + '</button>' +
      '<button class="s3-btn sm" style="left:4px;bottom:8px" data-a="zin" title="Приблизить (Z)">' + iconSVG('ui_zin', 13) + '</button>' +
      '<button class="s3-btn sm" style="right:4px;bottom:8px" data-a="zout" title="Отдалить (X)">' + iconSVG('ui_zout', 13) + '</button>' +
      '<button class="s3-btn sm" style="left:37px;top:1px" data-a="lvup">' + iconSVG('ui_lvup', 13) + '</button>' +
      '<button class="s3-btn sm" style="left:37px;bottom:1px" data-a="lvdn">' + iconSVG('ui_lvdn', 13) + '</button>' +
      '<div class="lvb">1</div>' +
      '<button class="s3-btn" style="left:33px;top:33px;width:34px;height:34px" data-a="center" title="К симу (Home)">' + iconSVG('ui_center', 16) + '</button></div>' +
      '<div class="modes">' + btn('ui_live', 'Режим жизни (F1)', '', 17) + btn('ui_buy', 'Режим покупки (F2)', '', 17) + btn('ui_build', 'Режим строительства (F3)', '', 17) + btn('ui_map', 'Карта города (M)', '', 17) + '</div>' +
      '<div class="funds">§ 0</div></div>' +
      '<div class="s3-wishp s3-panel" style="pointer-events:auto"><div class="offers"></div><div class="slots"></div><div class="face"></div><div class="ltw"></div><div class="lh"></div>' +
      '<div class="s3-clock">' + btn('ui_pause', 'Пауза (0, пробел)', '', 10) + btn('ui_play', 'Обычная скорость (1)', '', 10) + btn('ui_ff', 'Быстро (2)', '', 10) + btn('ui_fff', 'Очень быстро (3)', '', 10) + '<div class="time"><span class="wx"></span><span class="tm">8:00</span></div></div></div>' +
      '<div class="s3-moodp s3-panel" style="pointer-events:auto"><div class="s3-mood"><div class="ptr"></div></div><div class="s3-moodlets"></div></div>' +
      '<div class="s3-simp s3-panel" style="pointer-events:auto"><div class="s3-tabs"></div><div class="s3-tabc"></div></div>' +
      '<div class="s3-catalog s3-panel s3-hidden" style="pointer-events:auto"></div>';
    h.appendChild(bottom);
    this.hudInner = bottom;
    const q = document.createElement('div'); q.className = 's3-queue'; h.appendChild(q); this.queueEl = q;
    const t = document.createElement('div'); t.className = 's3-tns'; h.appendChild(t); this.tnsEl = t;
    this.el = {
      ports: bottom.querySelector('.s3-portraits'), funds: bottom.querySelector('.funds'), offers: bottom.querySelector('.offers'), slots: bottom.querySelector('.slots'),
      face: bottom.querySelector('.face'), ltw: bottom.querySelector('.ltw'), lh: bottom.querySelector('.lh'), time: bottom.querySelector('.time'), clock: bottom.querySelector('.s3-clock'),
      ptr: bottom.querySelector('.ptr'), moodlets: bottom.querySelector('.s3-moodlets'), tabs: bottom.querySelector('.s3-tabs'), tabc: bottom.querySelector('.s3-tabc'),
      wishp: bottom.querySelector('.s3-wishp'), moodp: bottom.querySelector('.s3-moodp'), simp: bottom.querySelector('.s3-simp'), catalog: bottom.querySelector('.s3-catalog'),
      modes: bottom.querySelector('.modes'), walls: bottom.querySelector('.walls'),
      lvup: bottom.querySelector('[data-a="lvup"]'), lvdn: bottom.querySelector('[data-a="lvdn"]'), lvb: bottom.querySelector('.lvb'), wx: bottom.querySelector('.wx'), tm: bottom.querySelector('.tm')
    };
    this.wxSig = '';
    this.tab = this.tab || 'needs';
    for (const [k, ic, title] of TABS) {
      const b = document.createElement('div');
      b.className = 's3-tab';
      b.dataset.k = k;
      b.innerHTML = iconSVG(ic, 16);
      this.tipOn(b, '<b>' + esc(title) + '</b>');
      b.onclick = () => { this.tab = k; this.tabSig = ''; this.refreshHud(true); if (this.audio) this.audio.ui('tab'); };
      this.el.tabs.appendChild(b);
    }
    bottom.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      const g = this.game;
      if (a === 'rotl') this.rotate(-1);
      else if (a === 'rotr') this.rotate(1);
      else if (a === 'zin') this.zoomBy(-1);
      else if (a === 'zout') this.zoomBy(1);
      else if (a === 'center') this.centerOnSim();
      else if (a === 'lvup') { this.stepLv(1); return; }
      else if (a === 'lvdn') { this.stepLv(-1); return; }
      else if (a === 'ui_live') this.setSub('live');
      else if (a === 'ui_buy') this.setSub('buy');
      else if (a === 'ui_build') this.setSub('build');
      else if (a === 'ui_map') this.setSub(this.sub === 'map' ? 'live' : 'map');
      else if (a === 'ui_gear') this.gameMenu();
      else if (a === 'ui_wup') this.setWallMode('up');
      else if (a === 'ui_wcut') this.setWallMode('cut');
      else if (a === 'ui_wdown') this.setWallMode('down');
      else if (a === 'ui_pause') this.setSpeed(0);
      else if (a === 'ui_play') this.setSpeed(1);
      else if (a === 'ui_ff') this.setSpeed(2);
      else if (a === 'ui_fff') this.setSpeed(3);
      else return;
      if (this.audio && !/ui_(pause|play|ff|fff)|rot/.test(a)) this.audio.ui('click');
    });
    this.el.ltw.onclick = () => { this.tab = 'simology'; this.tabSig = ''; this.refreshHud(true); };
    this.tipOn(this.el.ltw, () => { const s = this.game.selected(); const L = s && LTW[s.ltw]; return L ? '<b>Мечта всей жизни: ' + esc(L.name) + '</b>' + esc(L.desc) + '<div class="val">Выполнено: ' + Math.round(this.game.ltwProgress(s) * 100) + '%</div>' : '<b>Мечты всей жизни пока нет</b>'; });
    this.tipOn(this.el.funds, () => { const hh = this.game.active(); return hh ? '<b>Семейный бюджет</b>' + (this.game.unpaid(hh) ? '<div class="neg">Неоплаченные счета: ' + S.fmtMoney(this.game.unpaid(hh)) + '</div>' : 'Счетов нет') : ''; });
    this.tipOn(this.el.lvup, () => '<b>Этаж выше (Page Up)</b>' + (this.sub === 'build' ? 'В режиме строительства можно подняться на этаж, которого ещё нет, и начать его строить.' : 'Верхние этажи скрыты, пока вы смотрите на нижний.'));
    this.tipOn(this.el.lvdn, '<b>Этаж ниже (Page Down)</b>');
    this.tipOn(this.el.lvb, () => '<b>Этаж ' + (this.curViewLv() + 1) + '</b>' + (this.maxViewLv() ? 'Всего этажей: ' + (this.lotTop(this.focusLot()) + 1) + '.' : 'В этом доме один этаж.') + ' Камера следует за выбранным симом и по этажам.');
    this.tipOn(this.el.time, () => this.weatherTip());
    this.tipOn(this.el.moodp.querySelector('.s3-mood'), () => { const s = this.game.selected(); return s ? '<b>Настроение: ' + ['ужасное', 'плохое', 'нормальное', 'хорошее', 'отличное'][s.moodLevel] + '</b>Сумма мудлетов: ' + Math.round(s.mood) + '. Хорошее настроение приносит очки счастья.' : ''; });
    this.layout();
    this.refreshHud(true);
  };

  G.setSub = function (sub) {
    if (!this.game) return;
    const hh = this.game.active();
    if ((sub === 'buy' || sub === 'build') && (!hh || hh.lot < 0)) { this.hint('Сначала нужно поселиться на участке.'); return; }
    if ((sub === 'buy' || sub === 'build')) {
      const lot = this.game.lots[hh.lot];
      this.r.cam.tx = lot.x + lot.w / 2; this.r.cam.ty = lot.y + lot.h / 2;
      if (this.r.cam.zoom > 1) this.r.cam.setZoom(1);
      this.follow = false;
    }
    const prev = this.sub;
    this.sub = sub;
    this.closePie();
    this.hideTip();
    if (this.exitBuild && prev !== sub && (prev === 'buy' || prev === 'build')) this.exitBuild();
    if (prev === 'map' && sub !== 'map' && this.exitMap) this.exitMap();
    if (sub === 'map') { if (this.enterMap) this.enterMap(); }
    else if (prev === 'map') this.r.cam.setZoom(this.mapPrevZoom !== undefined ? this.mapPrevZoom : 1);
    if (sub === 'buy' || sub === 'build') { if (this.game.speed) this.prevSpeed = this.game.speed; this.game.speed = 0; if (this.enterBuild) this.enterBuild(sub); }
    else if ((prev === 'buy' || prev === 'build') && this.game.speed === 0) this.game.speed = this.prevSpeed || 1;
    const live = sub === 'live' || sub === 'map';
    this.el.wishp.classList.toggle('s3-hidden', !live);
    this.el.moodp.classList.toggle('s3-hidden', !live);
    this.el.simp.classList.toggle('s3-hidden', !live);
    this.el.catalog.classList.toggle('s3-hidden', live);
    if (this.audio) { this.audio.ui('mode'); this.audio.modeMusic(sub); }
    this.refreshHud(true);
  };

  G.refreshClock = function () {
    const g = this.game;
    if (!this.el) return;
    this.el.tm.textContent = S.fmtClock(g.t) + (g.speed === 0 ? ' ▌▌' : '');
    const W = g.weather || { kind: 'clear' };
    const wsig = W.kind + (g.isNight() ? 'n' : 'd');
    if (wsig !== this.wxSig) { this.wxSig = wsig; this.el.wx.innerHTML = iconSVG(W.kind === 'clear' && g.isNight() ? 'w_moon' : (S.WEATHER[W.kind] || S.WEATHER.clear).icon, 12); }
    const btns = this.el.clock.querySelectorAll('button');
    btns.forEach((b, i) => b.classList.toggle('on', i === g.speed));
  };

  G.refreshHud = function (force) {
    const g = this.game;
    if (!g || !this.el) return;
    const hh = g.active();
    let sim = g.selected();
    if (hh && (!sim || sim.hh !== hh.id || sim.dead)) { const m = g.members(hh).filter(s => !s.isBaby); if (m.length) { g.sel = m[0].id; sim = m[0]; } }
    this.el.funds.textContent = hh ? S.fmtMoney(hh.funds) : '§ 0';
    this.el.funds.style.color = hh && g.overdue(hh) ? '#ffb0a0' : '';
    this.refreshClock();
    for (const b of this.el.modes.querySelectorAll('button')) b.classList.toggle('on', 'ui_' + this.sub === b.dataset.a);
    for (const b of this.el.walls.querySelectorAll('button')) b.classList.toggle('on', b.dataset.a === 'ui_w' + this.r.wallMode);
    const vl = this.curViewLv(), vmax = this.maxViewLv();
    this.el.lvb.textContent = vl + 1;
    this.el.lvup.disabled = vl >= vmax;
    this.el.lvdn.disabled = vl <= 0;
    const psig = hh ? g.members(hh).map(s => s.id + s.age + s.outfit + (s.inside ? 'i' : '') + (s.id === g.sel ? '*' : '')).join(',') : '';
    if (force || psig !== this.portSig) {
      this.portSig = psig;
      this.el.ports.innerHTML = '';
      if (hh) for (const s of g.members(hh)) {
        const p = document.createElement('div');
        p.className = 's3-port' + (s.id === g.sel ? ' sel' : '');
        p.innerHTML = '<img src="' + this.stage.portrait(s, 64) + '">' + (s.inside ? '<div class="away">' + iconSVG(s.insideWhat === 'Работа' ? 'm_briefcase' : s.insideWhat === 'Школа' ? 'm_book' : 'm_map', 9) + '</div>' : '');
        p.onclick = () => { if (s.isBaby) { this.centerOnSim(s); return; } this.selectSim(s); };
        p.ondblclick = () => this.centerOnSim(s);
        this.tipOn(p, () => '<b>' + esc(s.name) + '</b>' + esc(S.AGE_INFO[s.age].name) + (s.inside ? '<div>Сейчас: ' + esc(s.insideWhat || '') + '</div>' : s.queue[0] && !s.queue[0].def.hidden ? '<div>' + esc(s.queue[0].name) + '</div>' : ''));
        this.el.ports.appendChild(p);
      }
    }
    if (!sim) return;
    const wsig = sim.id + ':' + sim.offers.map(o => o.key).join('|') + ':' + sim.wishes.map(o => o.key).join('|') + ':' + sim.ltw;
    if (force || wsig !== this.wishSig) {
      this.wishSig = wsig;
      this.el.offers.innerHTML = '';
      sim.offers.forEach((o, i) => {
        const d = document.createElement('div');
        d.className = 's3-wish';
        d.innerHTML = iconSVG(WISHES[o.k].icon, 16);
        d.onclick = () => { if (g.promiseWish(sim, i)) { if (this.audio) this.audio.ui('promise'); this.refreshHud(true); } else this.hint('Можно пообещать не больше четырёх желаний.'); };
        this.tipOn(d, () => '<b>' + esc(g.wishText(o)) + '</b><div class="val">+' + S.fmtNum(o.lh) + ' очков счастья</div>Щёлкните, чтобы пообещать исполнить желание.');
        this.el.offers.appendChild(d);
      });
      this.el.slots.innerHTML = '';
      for (let i = 0; i < 4; i++) {
        const w = sim.wishes[i];
        const d = document.createElement('div');
        d.className = 's3-wish' + (w ? '' : ' empty');
        if (w) {
          d.innerHTML = iconSVG(WISHES[w.k].icon, 20);
          d.oncontextmenu = e => { e.preventDefault(); g.cancelWish(sim, i); this.refreshHud(true); };
          this.tipOn(d, () => '<b>' + esc(g.wishText(w)) + '</b><div class="val">+' + S.fmtNum(w.lh) + ' очков счастья</div>Правый щелчок: отказаться от желания.');
        }
        this.el.slots.appendChild(d);
      }
      this.el.face.innerHTML = '<img src="' + this.stage.portrait(sim, 96) + '">';
      const L = LTW[sim.ltw];
      this.el.ltw.innerHTML = L ? iconSVG('m_star', 10) + esc(L.name) : 'Без мечты';
    }
    this.el.lh.textContent = 'Счастье: ' + S.fmtNum(sim.lh);
    const m = S.clamp(sim.mood, -100, 100);
    this.el.ptr.style.top = (4 + (1 - (m + 100) / 200) * 90) + 'px';
    const msig = sim.id + ':' + sim.moods.map(x => x.k + Math.ceil(x.until ? (x.until - g.t) / 60 : 0)).join('|');
    if (force || msig !== this.moodSig) {
      this.moodSig = msig;
      this.el.moodlets.innerHTML = '';
      const list = sim.moods.slice().sort((a, b) => Math.abs(b.v) - Math.abs(a.v)).slice(0, 9);
      for (const md of list) {
        const def = MOODLETS[md.k];
        if (!def) continue;
        const d = document.createElement('div');
        d.className = 's3-ml ' + (md.v >= 0 ? 'pos' : 'neg');
        const left = md.until ? Math.max(0, md.until - g.t) : 0;
        d.innerHTML = iconSVG(def.icon, 20) + (md.until ? '<div class="tm">' + (left >= 60 ? Math.ceil(left / 60) + ' ч' : Math.ceil(left) + ' м') + '</div>' : '');
        this.tipOn(d, () => '<b>' + esc(def.name) + '</b>' + esc(def.desc) + '<div class="' + (md.v >= 0 ? 'val' : 'neg') + '">' + (md.v >= 0 ? '+' : '') + md.v + ' к настроению</div>' + (md.until ? '<div>Осталось: ' + S.fmtDuration(md.until - g.t) + '</div>' : ''));
        this.el.moodlets.appendChild(d);
      }
    }
    for (const b of this.el.tabs.children) b.classList.toggle('on', b.dataset.k === this.tab);
    this.renderTab(sim, force);
    this.refreshQueue(sim, force);
  };

  G.weatherTip = function () {
    const g = this.game, W = g.weather;
    if (!W) return '';
    const left = Math.max(0, W.until - g.t);
    const hrs = Math.max(1, Math.round(left / 60));
    const next = S.WEATHER[W.next] ? S.WEATHER[W.next].name.toLowerCase() : '';
    const notes = { clear: 'Хорошая погода для прогулок и работы в саду.', cloudy: 'Ночью облака закрывают звёзды.', rain: 'Симы на улице промокают. Грядки поливает сам дождь.', storm: 'Молнии бьют по открытым местам. Лучше переждать дома.' };
    return '<b>' + esc(S.fmtClock(g.t)) + '</b>Погода: ' + esc(g.weatherName().toLowerCase()) + '. ' + esc(notes[W.kind] || '') + (next ? '<div>Прогноз: ' + esc(next) + ' примерно через ' + hrs + ' ' + S.plural(hrs, ['час', 'часа', 'часов']) + '.</div>' : '');
  };

  G.refreshQueue = function (sim, force) {
    const sig = sim.id + ':' + sim.queue.map(a => a.key + (a.cancelled ? 'c' : '') + (a.auto ? 'a' : '')).join('|');
    if (!force && sig === this.qSig) return;
    this.qSig = sig;
    this.queueEl.innerHTML = '';
    sim.queue.slice(0, 7).forEach(a => {
      if (a.def.hidden && a.key !== 'pass_out') return;
      const d = document.createElement('div');
      d.className = 's3-q' + (a.auto ? ' auto' : '');
      d.innerHTML = iconSVG(a.icon || 'm_hand', 22);
      d.onclick = () => { this.game.cancelAction(sim, a); if (this.audio) this.audio.ui('cancel'); this.refreshHud(true); };
      this.tipOn(d, '<b>' + esc(a.name) + '</b>' + (a.auto ? 'Сам решил' + S.genderize(sim, '', 'а') + '. ' : '') + 'Щёлкните, чтобы отменить.');
      this.queueEl.appendChild(d);
    });
  };

  Object.assign(S, { HUD_TABS: TABS });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
