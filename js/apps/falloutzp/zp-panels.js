(function (Z) {
  'use strict';

  const U = Z.UI.prototype;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  Z.esc = esc;
  const CAT_ORDER = { weapon: 0, apparel: 1, aid: 2, book: 3, misc: 4, ammo: 5 };

  U.openPanel = function (panel) {
    this.panels.push(panel);
    this.layer.appendChild(panel.el);
    if (this.mode !== 'panel') this.prevMode = this.mode;
    this.mode = 'panel';
    if (this.game && panel.pause !== false) this.game.paused = true;
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    this.keys.clear();
    this.mouse.b = 0;
    if (this.audio) this.audio.uiSound('open');
    return panel;
  };

  U.closePanel = function (panel) {
    panel = panel || this.panels[this.panels.length - 1];
    if (!panel) return;
    this.panels = this.panels.filter(p => p !== panel);
    panel.el.remove();
    if (panel.onClose) panel.onClose();
    if (!this.panels.length) {
      this.mode = this.prevMode === 'panel' || !this.prevMode ? 'play' : this.prevMode;
      if (this.game) this.game.paused = false;
      this.el.focus({ preventScroll: true });
    }
    if (this.audio) this.audio.uiSound('close');
  };

  U.closeAllPanels = function () { while (this.panels.length) this.closePanel(); };

  U.onPanelKey = function (e) {
    const p = this.panels[this.panels.length - 1];
    if (!p) return;
    if (p.key && p.key(e) === true) { e.preventDefault(); return; }
    if (e.code === 'Escape' && p.escClose !== false) { this.closePanel(p); e.preventDefault(); }
  };

  U.panelEl = function (cls, html) {
    const wrap = document.createElement('div');
    wrap.className = 'zp-panel';
    wrap.innerHTML = '<div class="zp-crt ' + cls + '">' + html + '</div>';
    wrap.addEventListener('mousedown', e => e.stopPropagation());
    wrap.addEventListener('wheel', e => e.stopPropagation());
    return wrap;
  };

  U.message = function (title, text, buttons, opts = {}) {
    const btns = buttons || [{ label: 'OK' }];
    const el = this.panelEl('zp-msg', (title ? '<h2>' + esc(title) + '</h2>' : '') + '<p>' + (opts.html ? text : esc(text)) + '</p><div style="text-align:center">' + btns.map((b, i) => '<span class="btn" data-i="' + i + '">' + esc(b.label) + '</span>').join('') + '</div>');
    const panel = { el, escClose: !opts.modal };
    let sel = 0;
    const els = () => [...el.querySelectorAll('.btn')];
    const pick = i => { this.closePanel(panel); if (btns[i] && btns[i].fn) btns[i].fn(); };
    const mark = () => els().forEach((b, i) => b.classList.toggle('sel', i === sel));
    el.querySelectorAll('.btn').forEach(b => b.addEventListener('click', () => pick(+b.dataset.i)));
    panel.key = e => {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') { sel = (sel + btns.length - 1) % btns.length; mark(); return true; }
      if (e.code === 'ArrowRight' || e.code === 'ArrowDown' || e.code === 'Tab') { sel = (sel + 1) % btns.length; mark(); return true; }
      if (e.code === 'Enter' || e.code === 'KeyE' || e.code === 'Space') { pick(sel); return true; }
      return false;
    };
    mark();
    return this.openPanel(panel);
  };

  U.askQty = function (title, max, fn) {
    if (max <= 1) { fn(1); return; }
    const el = this.panelEl('zp-qty', '<h2>' + esc(title) + '</h2><input type="range" min="1" max="' + max + '" value="' + max + '"><div style="text-align:center;margin:8px 0"><span class="qv">' + max + '</span> / ' + max + '</div><div style="text-align:center"><span class="btn" data-k="ok">Принять</span><span class="btn" data-k="no">Отмена</span></div>');
    const panel = { el };
    const inp = el.querySelector('input'), qv = el.querySelector('.qv');
    inp.addEventListener('input', () => { qv.textContent = inp.value; });
    const ok = () => { this.closePanel(panel); fn(+inp.value); };
    el.querySelector('[data-k=ok]').addEventListener('click', ok);
    el.querySelector('[data-k=no]').addEventListener('click', () => this.closePanel(panel));
    panel.key = e => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { inp.value = Math.max(1, +inp.value - 1); qv.textContent = inp.value; return true; }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { inp.value = Math.min(max, +inp.value + 1); qv.textContent = inp.value; return true; }
      if (e.code === 'Enter' || e.code === 'KeyE') { ok(); return true; }
      return false;
    };
    this.openPanel(panel);
    inp.focus();
  };

  Z.sortInv = list => list.slice().sort((a, b) => {
    const da = Z.item(a.id) || {}, db = Z.item(b.id) || {};
    if (da.currency !== db.currency) return da.currency ? -1 : 1;
    return (CAT_ORDER[da.cat] - CAT_ORDER[db.cat]) || String(da.name).localeCompare(String(db.name), 'ru');
  });

  Z.itemLabel = (e, a) => {
    const d = Z.item(e.id) || { name: e.id };
    let s = d.name;
    if (e.n > 1) s += ' (' + e.n + ')';
    return s;
  };

  Z.itemInfo = (e, game) => {
    const d = Z.item(e.id);
    if (!d) return '';
    const parts = [];
    if (d.cat === 'weapon') {
      if (d.dmg) parts.push('УРН ' + Math.round(d.dmg * (d.pellets || 1)));
      if (d.mag) parts.push('МАГ ' + (e.loaded || 0) + '/' + d.mag);
      if (d.ammo) parts.push(Z.item(d.ammo).name);
      if (d.durab && e.cond !== undefined) parts.push('СОСТ ' + Math.round(e.cond * 100) + '%');
      if (d.str) parts.push('СИЛ ' + d.str);
      parts.push('ОД ' + d.ap);
    } else if (d.cat === 'apparel') {
      parts.push('ПУ ' + d.dt);
      if (e.cond !== undefined) parts.push('СОСТ ' + Math.round(e.cond * 100) + '%');
      if (d.bonus) for (const k in d.bonus) parts.push((k.startsWith('sk_') ? Z.skillName(k.slice(3)) : (Z.STATS.find(s => s.id === k) || {}).short || k) + ' ' + (d.bonus[k] > 0 ? '+' : '') + d.bonus[k]);
      if (d.rr) parts.push('РАД.ЗАЩ +' + d.rr + '%');
    } else if (d.cat === 'aid') {
      if (d.heal) parts.push('ОЗ +' + d.heal);
      if (d.rad > 0) parts.push('РАД +' + d.rad);
      if (d.rad < 0) parts.push('РАД ' + d.rad);
      if (d.effect) for (const k in d.effect) parts.push(k + ' ' + d.effect[k]);
    } else if (d.cat === 'book') parts.push(d.mag ? 'Журнал: ' + Z.skillName(d.skill) + ' +10 на время' : 'Книга: ' + Z.skillName(d.skill) + ' +3');
    parts.push('ВЕС ' + (d.w || 0));
    parts.push('ЦЕНА ' + Z.itemValue(e.id, e.cond));
    return '<div>' + parts.join(' &nbsp; ') + '</div>' + (d.desc ? '<div class="dim" style="margin-top:4px;white-space:normal">' + esc(d.desc) + '</div>' : '');
  };

  const EFFECT_NAMES = { str: 'Сила', per: 'Восприятие', end: 'Выносливость', cha: 'Обаяние', int: 'Интеллект', agi: 'Ловкость', luk: 'Удача', rr: 'Сопр. радиации, %', dt: 'Порог урона', dmg: 'Урон, %', apRestore: 'Очки действия' };
  const SLOT_NAMES = { body: 'тело', head: 'голова', eyes: 'глаза' };
  Z.itemCategory = d => d.cat === 'weapon' ? 'Оружие' : d.cat === 'apparel' ? 'Одежда · ' + (SLOT_NAMES[d.slot] || d.slot) : d.cat === 'aid' ? (d.food ? (d.drink ? 'Питьё' : 'Еда') : 'Медицина') : d.cat === 'ammo' ? 'Боеприпасы' : d.cat === 'book' ? (d.mag ? 'Журнал' : 'Книга') : d.quest ? 'Сюжетный предмет' : d.currency ? 'Деньги' : 'Вещи';
  Z.itemCard = (e, game, o = {}) => {
    const d = Z.item(e.id);
    if (!d) return '';
    const p = game.player, cells = [];
    const delta = (v, base, better = 1) => {
      if (base === undefined || base === null || Math.abs(v - base) < 1e-6) return '';
      const up = v > base, good = (v - base) * better > 0;
      return '<b class="' + (good ? 'grn' : 'red') + '">' + (up ? '▲' : '▼') + Math.round(Math.abs(v - base) * 10) / 10 + '</b>';
    };
    const cell = (lb, v, dl, wide) => cells.push('<div class="ic-cell' + (wide ? ' wide' : '') + '"><span>' + esc(lb) + '</span><b>' + v + '</b>' + (dl || '') + '</div>');
    const eqd = Object.values(p.equip).includes(e);
    if (d.cat === 'weapon') {
      const ew = p.equip.weapon && p.equip.weapon !== e ? Z.item(p.equip.weapon.id) : null;
      const dmg = Math.round(d.dmg * (d.pellets || 1));
      cell('Урон', dmg, ew ? delta(dmg, Math.round(ew.dmg * (ew.pellets || 1))) : '');
      cell('Выстрелов в сек.', d.rof, ew ? delta(d.rof, ew.rof) : '');
      cell('Очки действия', d.ap, ew ? delta(d.ap, ew.ap, -1) : '');
      if (d.mag) cell('Магазин', (e.loaded || 0) + ' / ' + d.mag);
      if (d.wtype !== 'melee' && d.wtype !== 'unarmed' && !d.thrown && !d.mine) cell('Дальность', d.range + ' м', ew && ew.range ? delta(d.range, ew.range) : '');
      if (d.radius) cell('Радиус взрыва', d.radius + ' м');
      if (d.crit) cell('Крит. шанс', '+' + d.crit + '%');
      if (d.str) cell('Нужна сила', d.str, p.sheet.stat('str') < d.str ? '<b class="red">!</b>' : '');
      if (d.skillReq) cell('Нужен навык', Z.skillName(d.skill) + ' ' + d.skillReq, p.sheet.skill(d.skill) < d.skillReq ? '<b class="red">!</b>' : '', true);
      if (d.ammo) cell('Патроны', esc(Z.item(d.ammo).name) + ' · ' + p.count(d.ammo), '', true);
    } else if (d.cat === 'apparel') {
      const ea = p.equip[d.slot] && p.equip[d.slot] !== e ? Z.item(p.equip[d.slot].id) : null;
      cell('Порог урона', d.dt, ea ? delta(d.dt, ea.dt) : (p.equip[d.slot] ? '' : delta(d.dt, 0)));
      if (d.rr) cell('Защита от радиации', '+' + d.rr + '%');
      if (d.fireRes) cell('Защита от огня', '+' + d.fireRes + '%');
      if (d.bonus) for (const k in d.bonus) if (d.bonus[k]) cell(k.startsWith('sk_') ? Z.skillName(k.slice(3)) : Z.statName(k), (d.bonus[k] > 0 ? '+' : '') + d.bonus[k]);
      if (d.faction) cell('Маскировка', esc((Z.FACTIONS.find(f => f.id === d.faction) || { name: d.faction }).name), '', true);
    } else if (d.cat === 'aid') {
      if (d.heal) cell('Здоровье', '+' + d.heal + (d.over ? ' за ' + d.over + ' с' : ''));
      if (d.rad) cell('Радиация', (d.rad > 0 ? '+' : '') + d.rad, d.rad > 0 ? '<b class="red">!</b>' : '');
      if (d.limbs) cell('Конечности', 'лечит увечья');
      if (d.effect) for (const k in d.effect) cell(EFFECT_NAMES[k] || k, (d.effect[k] > 0 ? '+' : '') + d.effect[k] + (d.dur ? ' на ' + Math.round(d.dur / 60 * 10) / 10 + ' мин' : ''), '', !!d.dur);
      if (d.addict) cell('Привыкание', Math.round(d.addict * 100) + '%', '<b class="red">!</b>');
      if (game.hardcore && d.fod) cell('Голод', '−' + Math.round(d.fod / 10) + '%');
      if (game.hardcore && d.h2o) cell('Жажда', (d.h2o > 0 ? '−' : '+') + Math.abs(Math.round(d.h2o / 10)) + '%');
    } else if (d.cat === 'ammo') {
      const guns = Object.values(Z.ITEMS).filter(w => w.ammo === d.id && !w.hidden).map(w => w.name);
      cell('В запасе', p.count(d.id));
      if (guns.length) cell('Подходит к', esc(guns.slice(0, 4).join(', ')), '', true);
    } else if (d.cat === 'book') cell(d.mag ? 'Временно' : 'Навсегда', Z.skillName(d.skill) + (d.mag ? ' +10' : ' +3'), '', true);
    if (e.n > 1) cell('Количество', e.n);
    cell('Вес', d.w || 0);
    cell('Цена', Z.itemValue(e.id, e.cond) + ' т.');
    const cond = (d.durab || d.cat === 'apparel') && e.cond !== undefined && !d.stack ? '<div class="ic-cond"><span>Состояние</span><div class="meter"><i style="width:' + Math.round(e.cond * 100) + '%"></i></div><b>' + Math.round(e.cond * 100) + '%</b></div>' : '';
    return '<div class="icard"><div class="ic-top"><div class="ic-pic">' + Z.iconHTML(e.id, o.pic || 104) + '</div><div class="ic-name"><h2>' + esc(d.name) + '</h2><div class="dim">' + esc(Z.itemCategory(d)) + (eqd ? ' · <span class="ic-on">надето</span>' : '') + '</div>' + cond + '</div></div>' +
      '<div class="ic-grid">' + cells.join('') + '</div>' + (d.desc ? '<div class="ic-desc dim">' + esc(d.desc) + '</div>' : '') + (o.keys ? '<div class="ic-keys dim">' + o.keys + '</div>' : '') + '</div>';
  };
  Z.itemInfoRow = (e, game) => {
    if (!e || !Z.item(e.id)) return '';
    return '<div class="ii">' + Z.iconHTML(e.id, 46) + '<div class="ii-t"><b>' + esc(Z.item(e.id).name) + '</b>' + Z.itemInfo(e, game) + '</div></div>';
  };

  U.openTransfer = function (o) {
    const g = this.game;
    const el = this.panelEl('zp-xfer', '<h2>' + esc(o.title) + '</h2><div class="cols"><div class="col" data-c="0"><div class="hd"></div><div class="list scroll"></div></div><div class="col" data-c="1"><div class="hd"></div><div class="list scroll"></div></div></div><div class="info"></div><div class="foot"><span class="fl"></span><span class="fr"></span></div>');
    const panel = { el };
    const cols = [o.left, o.right];
    let side = o.startSide || 1;
    const sel = [0, 0];
    let lists = [[], []];
    const render = () => {
      lists = cols.map(c => Z.sortInv(c.items()));
      cols.forEach((c, k) => {
        const colEl = el.querySelector('.col[data-c="' + k + '"]');
        colEl.classList.toggle('active', side === k);
        colEl.querySelector('.hd').innerHTML = esc(c.title) + (c.sub ? ' <span class="dim">' + esc(c.sub()) + '</span>' : '');
        sel[k] = Z.clamp(sel[k], 0, Math.max(0, lists[k].length - 1));
        colEl.querySelector('.list').innerHTML = lists[k].map((e, i) => {
          const d = Z.item(e.id) || {};
          const eq = c.equipped && c.equipped(e);
          const extra = c.col2 ? c.col2(e) : (d.w || 0);
          return '<div class="row' + (i === sel[k] && side === k ? ' sel' : '') + (eq ? ' eq' : '') + '" data-i="' + i + '"><span class="nm">' + Z.iconHTML(e.id, 20) + esc(Z.itemLabel(e)) + '</span><span class="num dim">' + extra + '</span></div>';
        }).join('') || '<div class="dim" style="padding:6px">Пусто</div>';
        colEl.querySelectorAll('.row').forEach(r => {
          r.addEventListener('mouseenter', () => { side = k; sel[k] = +r.dataset.i; showInfo(); });
          r.addEventListener('click', () => { side = k; sel[k] = +r.dataset.i; act(); });
        });
      });
      showInfo();
      el.querySelector('.fl').innerHTML = o.footL ? o.footL() : '';
      el.querySelector('.fr').innerHTML = o.footR ? o.footR() : '';
    };
    const showInfo = () => {
      const e = lists[side][sel[side]];
      el.querySelector('.info').innerHTML = e ? Z.itemInfoRow(e, g) : '';
      cols.forEach((c, k) => el.querySelectorAll('.col[data-c="' + k + '"] .row').forEach((r, i) => r.classList.toggle('sel', k === side && i === sel[k])));
    };
    const act = () => {
      const e = lists[side][sel[side]];
      if (!e) return;
      const c = cols[side];
      const go = n => { c.act(e, n); render(); if (o.after) o.after(); };
      if (e.n > 1 && c.qty !== false) this.askQty(Z.item(e.id).name, e.n, go);
      else go(1);
    };
    panel.key = ev => {
      if (ev.code === 'ArrowUp' || ev.code === 'KeyW') { sel[side] = Math.max(0, sel[side] - 1); showInfo(); return true; }
      if (ev.code === 'ArrowDown' || ev.code === 'KeyS') { sel[side] = Math.min(lists[side].length - 1, sel[side] + 1); showInfo(); return true; }
      if (ev.code === 'ArrowLeft' || ev.code === 'KeyA') { side = 0; render(); return true; }
      if (ev.code === 'ArrowRight' || ev.code === 'KeyD' || ev.code === 'Tab') { side = ev.code === 'Tab' ? 1 - side : 1; render(); return true; }
      if (ev.code === 'Enter' || ev.code === 'KeyE') { act(); return true; }
      if (ev.code === 'KeyR' && o.takeAll) { o.takeAll(); render(); return true; }
      if (o.keys && o.keys(ev, lists[side][sel[side]])) { render(); return true; }
      return false;
    };
    panel.refresh = render;
    render();
    return this.openPanel(panel);
  };

  U.openContainer = function (ob, actor) {
    const g = this.game, p = g.player;
    const inv = actor ? actor.inv : ob.inv;
    const fake = actor ? { inv: actor.inv, id: 'body_' + actor.id, owner: null, name: actor.name } : ob;
    const title = actor ? 'Обыскать: ' + actor.name : ob.name;
    this.openTransfer({
      title,
      left: { title: 'ВЫ', sub: () => 'вес ' + p.weight() + '/' + p.sheet.carry(), items: () => p.inv.filter(e => !Z.item(e.id).quest || true), equipped: e => Object.values(p.equip).includes(e), act: (e, n) => { if (Object.values(p.equip).includes(e) && Z.item(e.id).cat !== 'weapon') p.unequip(Z.item(e.id).slot); g.putToObject(fake, e, n); } },
      right: { title: actor ? actor.name.toUpperCase() : ob.name.toUpperCase(), items: () => inv, act: (e, n) => { if (actor) { for (const s in actor.equip) if (actor.equip[s] === e) actor.equip[s] = null; } g.takeFromObject(fake, e, n); } },
      takeAll: () => { for (const e of inv.slice()) { if (actor) for (const s in actor.equip) if (actor.equip[s] === e) actor.equip[s] = null; g.takeFromObject(fake, e, e.n); } },
      footL: () => '<span class="dim">E/Enter — переложить, R — взять всё, Esc — закрыть</span>',
      footR: () => 'Талоны: ' + p.count('talon')
    });
  };

  U.readNotePanel = function (id) {
    const n = Z.NOTES && Z.NOTES[id];
    if (!n) return;
    this.message(n.title, n.text);
  };

  U.openWait = function (sleep) {
    const g = this.game;
    const hostile = g.cell.actors.some(a => a.ai && !a.dead && a.ai.state === 'combat');
    if (hostile) { g.msg('Нельзя отдыхать, когда рядом враги.', 'warn'); return; }
    let hours = 1;
    const el = this.panelEl('zp-qty', '<h2>' + (sleep ? 'СОН' : 'ОЖИДАНИЕ') + '</h2><div>Сейчас ' + Z.fmtTime(g.time) + ', ' + Z.dateStr(g.time) + '</div><input type="range" min="1" max="24" value="1"><div style="text-align:center;margin:8px 0"><span class="qv">1</span> ч.</div><div style="text-align:center"><span class="btn" data-k="ok">' + (sleep ? 'Спать' : 'Ждать') + '</span><span class="btn" data-k="no">Отмена</span></div>');
    const panel = { el };
    const inp = el.querySelector('input'), qv = el.querySelector('.qv');
    inp.addEventListener('input', () => { hours = +inp.value; qv.textContent = hours; });
    const ok = () => { this.closePanel(panel); g.passTime(hours * 60, sleep); };
    el.querySelector('[data-k=ok]').addEventListener('click', ok);
    el.querySelector('[data-k=no]').addEventListener('click', () => this.closePanel(panel));
    panel.key = e => {
      if (e.code === 'ArrowLeft') { inp.value = hours = Math.max(1, hours - 1); qv.textContent = hours; return true; }
      if (e.code === 'ArrowRight') { inp.value = hours = Math.min(24, hours + 1); qv.textContent = hours; return true; }
      if (e.code === 'Enter' || e.code === 'KeyE') { ok(); return true; }
      return false;
    };
    this.openPanel(panel);
  };

  U.openCraft = function (at) {
    const g = this.game, p = g.player;
    const recipes = Z.RECIPES.filter(r => r.at === at);
    const el = this.panelEl('zp-xfer', '<h2>' + (at === 'bench' ? 'ВЕРСТАК' : 'КОСТЁР') + '</h2><div class="cols"><div class="col active"><div class="list scroll"></div></div><div class="col"><div class="det"></div></div></div><div class="foot"><span class="dim">E/Enter — изготовить, Esc — закрыть</span><span class="fr"></span></div>');
    const panel = { el };
    let sel = 0;
    const can = r => p.sheet.skill(r.skill[0]) >= r.skill[1] && Object.entries(r.need).every(([id, n]) => p.count(id) >= n);
    const render = () => {
      el.querySelector('.list').innerHTML = recipes.map((r, i) => '<div class="row' + (i === sel ? ' sel' : '') + '" data-i="' + i + '"><span class="nm' + (can(r) ? '' : ' dim') + '">' + esc(Z.item(r.out[0]).name) + (r.out[1] > 1 ? ' (' + r.out[1] + ')' : '') + '</span></div>').join('');
      el.querySelectorAll('.row').forEach(row => { row.addEventListener('mouseenter', () => { if (sel === +row.dataset.i) return; sel = +row.dataset.i; render(); }); row.addEventListener('click', () => { sel = +row.dataset.i; make(); }); });
      const r = recipes[sel];
      if (r) {
        const sk = p.sheet.skill(r.skill[0]);
        el.querySelector('.det').innerHTML = '<div>' + esc(Z.skillName(r.skill[0])) + ' ' + r.skill[1] + ' <span class="' + (sk >= r.skill[1] ? 'grn' : 'red') + '">(' + sk + ')</span></div><div style="margin-top:8px">Нужно:</div>' + Object.entries(r.need).map(([id, n]) => '<div class="' + (p.count(id) >= n ? '' : 'red') + '">' + esc(Z.item(id).name) + ' ' + p.count(id) + '/' + n + (r.keep && r.keep.includes(id) ? ' <span class="dim">(не расходуется)</span>' : '') + '</div>').join('') + '<div class="dim" style="margin-top:10px;white-space:normal">' + esc(Z.item(r.out[0]).desc || '') + '</div>';
      }
    };
    const make = () => {
      const r = recipes[sel];
      if (!r || !can(r)) { g.msg('Не хватает навыка или материалов.', 'warn'); return; }
      for (const [id, n] of Object.entries(r.need)) if (!(r.keep && r.keep.includes(id))) p.take(id, n);
      p.give(r.out[0], r.out[1]);
      g.msg('Изготовлено: ' + Z.item(r.out[0]).name + (r.out[1] > 1 ? ' (' + r.out[1] + ')' : ''), 'item');
      g.ev.emit('craft', { id: r.id });
      render();
    };
    panel.key = e => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { sel = Math.max(0, sel - 1); render(); return true; }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { sel = Math.min(recipes.length - 1, sel + 1); render(); return true; }
      if (e.code === 'Enter' || e.code === 'KeyE') { make(); return true; }
      return false;
    };
    render();
    this.openPanel(panel);
  };

  Z.Game.prototype.passTime = function (minutes, sleep) {
    const p = this.player;
    const steps = Math.ceil(minutes / 10);
    for (let i = 0; i < steps; i++) {
      this.time += minutes / steps;
      if (sleep) { p.heal(p.hpMax * 0.05); }
    }
    if (sleep) { p.hp = Math.min(p.hpMax, p.hp + p.hpMax * 0.5); p.healLimbs(false); this.flags.sleptAt = this.time; if (this.hardcore) this.needs.slp = 0; }
    this.ev.emit('timePassed', { minutes, sleep });
    this.msg((sleep ? 'Вы проспали ' : 'Прошло ') + Math.round(minutes / 60) + ' ' + Z.plural(Math.round(minutes / 60), 'час', 'часа', 'часов') + '.', 'info');
    if (this.onTimePassed) this.onTimePassed(minutes);
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
