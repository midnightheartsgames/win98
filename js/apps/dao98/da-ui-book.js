(function (D) {
  'use strict';
  const { el, esc, clamp } = D;
  const U = D.UI.prototype;
  const MOD_NAME = { str: 'Сила', dex: 'Ловкость', wil: 'Сила воли', mag: 'Магия', cun: 'Хитрость', con: 'Телосложение', atk: 'Точность', def: 'Защита', arm: 'Броня', dmg: 'Урон', hpMax: 'Здоровье', mpMax: 'Мана/выносливость', res: 'Сопротивление', sp: 'Сила заклинаний', crit: 'Шанс крита', move: 'Скорость', mpRegen: 'Восстановление маны', nature: 'Сопротивление природе', mdef: 'Защита от стрел' };
  const SLOT_LEFT = [['main', 'Правая рука', 'sword'], ['head', 'Голова', 'helm'], ['gloves', 'Руки', 'gloves'], ['chest', 'Тело', 'armor'], ['boots', 'Ноги', 'boots']];
  const SLOT_RIGHT = [['off', 'Левая рука', 'shield'], ['amulet', 'Шея', 'amulet'], ['belt', 'Пояс', 'belt'], ['ring1', 'Кольцо', 'ring'], ['ring2', 'Кольцо', 'ring']];
  const TYPE_NAME = { weapon: 'Оружие', shield: 'Щит', armor: 'Доспех', accessory: 'Украшение', use: 'Расходуемый предмет', mat: 'Материал', gift: 'Подарок', quest: 'Предмет задания' };
  const WEIGHT = { light: 'лёгкий', medium: 'средний', heavy: 'тяжёлый', massive: 'массивный', robe: 'одеяние' };

  const splatter = (() => {
    let url = null;
    return () => {
      if (url) return url;
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const g = c.getContext('2d');
      const drop = (x, y, r, a) => { g.fillStyle = `rgba(${110 + Math.random() * 40},${6 + Math.random() * 10},${8},${a})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
      for (let k = 0; k < 3; k++) {
        const cx = 40 + Math.random() * 180, cy = 40 + Math.random() * 180;
        drop(cx, cy, 10 + Math.random() * 14, 0.34);
        for (let i = 0; i < 26; i++) { const a = Math.random() * 7, d = 10 + Math.random() * 50; drop(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1 + Math.random() * 4, 0.2 + Math.random() * 0.22); }
      }
      url = c.toDataURL();
      return url;
    };
  })();

  D.itemTooltip = (it, g, c) => {
    if (!it) return '';
    const L = [it.name, TYPE_NAME[it.type] || ''];
    if (it.type === 'weapon') {
      L.push('Урон: ' + it.dmg + (it.staff ? ' (' + (D.ELEMENTS[it.staff] || it.staff) + ')' : ''));
      L.push('Скорость атаки: ' + it.spd + ' с' + (it.hands === 2 ? ', двуручное' : ''));
      if (it.crit) L.push('Шанс крита: ' + it.crit + '%');
      if (it.pierce) L.push('Пробивание брони: ' + it.pierce);
      if (it.range) L.push('Дальность: ' + it.range);
    }
    if (it.type === 'shield') { L.push('Защита: +' + it.def); L.push('Защита от стрел: +' + it.mdef); }
    if (it.type === 'armor' || it.type === 'shield') { if (it.arm) L.push('Броня: ' + it.arm); if (it.fat) L.push('Утомление: ' + it.fat + '%'); if (it.weight) L.push('Вес: ' + WEIGHT[it.weight]); }
    if (it.mods) for (const [k, v] of Object.entries(it.mods)) if (MOD_NAME[k]) L.push((v > 0 ? '+' : '') + v + ' ' + MOD_NAME[k].toLowerCase());
    if (it.req) { const r = Object.entries(it.req).filter(([, v]) => v).map(([k, v]) => D.ATTR_NAME[k] + ' ' + v); if (r.length) L.push('Требуется: ' + r.join(', ') + (c && !D.meetsReq(c, it) ? ' (не выполнено)' : '')); }
    if (it.likes) L.push('Нравится: ' + Object.keys(it.likes).map(k => (D.COMPANIONS[k] || {}).name || k).join(', '));
    if (it.desc) L.push(it.desc);
    if (it.price) L.push('Цена: ' + D.fmtMoney(it.price));
    return L.filter(Boolean).join('\n');
  };

  U.openPanel = function (id) {
    const g = this.g;
    if (!g || g.mode === 'dialog' || this.slidesEl || g.mode === 'map') return;
    if (id === 'menu') { this.showGameMenu(); return; }
    if (g.mode === 'dead') return;
    this.closePanel(true);
    this.panel = id;
    this.sfx('page');
    this.panelChar = this.panelChar && g.party.includes(this.panelChar) ? this.panelChar : g.leader;
    for (const b of this.topbar.children) b.classList.toggle('on', b.dataset.id === id);
    this.renderPanel();
  };
  U.closePanel = function (silent) {
    if (this.bookEl) { this.bookEl.remove(); this.bookEl = null; }
    if (this.menuPanel) { this.menuPanel.remove(); this.menuPanel = null; }
    if (this.panel === 'shop' && this.g) this.g.closeShop();
    this.panel = null;
    if (this.topbar) for (const b of this.topbar.children) b.classList.remove('on');
    if (!silent) this.sfx('page');
    this.previewOn = false;
  };
  U.book = function (titleL, titleR) {
    if (this.bookEl) this.bookEl.remove();
    const b = el('div', 'da-book', `<div class="da-page L"><h2>${esc(titleL)}</h2><div class="pc"></div></div><div class="da-spine"></div><div class="da-page R"><h2>${esc(titleR)}</h2><div class="pc"></div></div><button class="da-close" title="Закрыть">✕</button>`, this.layer);
    b.style.setProperty('--blood', `url(${splatter()})`);
    b.querySelector('.da-close').onclick = () => this.closePanel();
    this.bookEl = b;
    return [b.querySelector('.L .pc'), b.querySelector('.R .pc'), b];
  };
  U.renderPanel = function () {
    const id = this.panel;
    if (!id) return;
    const fn = { inv: this.panelInv, char: this.panelChar_, abil: this.panelAbil, journal: this.panelJournal, map: this.panelMap, tactics: this.panelTactics, craft: this.panelCraft, party: this.panelParty, shop: this.panelShop }[id];
    if (fn) fn.call(this);
  };
  U.charHeader = function (host) {
    const g = this.g;
    const c = this.panelChar;
    const i = g.party.indexOf(c);
    const h = el('div', 'da-charhdr', `<button class="prev">◀</button><div class="nm">${esc(c.name)}</div><button class="next">▶</button>`, host);
    h.querySelector('.prev').onclick = () => { this.panelChar = g.party[(i - 1 + g.party.length) % g.party.length]; this.renderPanel(); };
    h.querySelector('.next').onclick = () => { this.panelChar = g.party[(i + 1) % g.party.length]; this.renderPanel(); };
  };
  U.attachPreview = function (host, c, w, h) {
    if (!this.BR) {
      this.bcv = document.createElement('canvas');
      this.bcv.width = 240; this.bcv.height = 330;
      try { this.BR = new D.Renderer(this.bcv); } catch (e) { this.BR = null; }
    }
    const wrap = el('div', 'da-preview', null, host);
    if (!this.BR) { wrap.innerHTML = `<img src="${this.portraitFor(c)}">`; return wrap; }
    this.bcv.style.width = (w || 240) + 'px'; this.bcv.style.height = (h || 330) + 'px';
    wrap.appendChild(this.bcv);
    this.previewOn = true;
    this.previewChar = c;
    this.previewYaw = this.previewYaw || 0;
    let drag = null;
    this.bcv.onmousedown = e => { drag = e.clientX; };
    window.addEventListener('mouseup', () => { drag = null; }, { once: true });
    this.bcv.onmousemove = e => { if (drag !== null) { this.previewYaw += (e.clientX - drag) * 0.02; drag = e.clientX; } };
    const loop = () => {
      if (!this.previewOn || this.dead || !wrap.isConnected) return;
      this.previewYaw += 0.004;
      try { this.BR.renderPreview(this.previewChar, { yaw: this.previewYaw, armed: true, bg: [0.2, 0.15, 0.1] }); } catch (e) { }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return wrap;
  };

  U.panelInv = function () {
    const g = this.g, c = this.panelChar;
    const [L, R] = this.book('Снаряжение', 'Инвентарь отряда');
    this.charHeader(L);
    const body = el('div', 'da-eq', null, L);
    const colL = el('div', 'da-eqcol', null, body);
    const mid = el('div', 'da-eqmid', null, body);
    const colR = el('div', 'da-eqcol', null, body);
    const humanoid = !c.look.kind || c.look.kind === 'humanoid';
    const setBtn = el('button', 'da-setbtn', c.activeSet ? 'II' : 'I', colL);
    setBtn.title = 'Сменить набор оружия (второй набор: ' + (c.set2.main ? D.ITEMS[c.set2.main].name : 'пусто') + ')';
    setBtn.onclick = () => { if (!humanoid) return; g.swapWeaponSet(c); this.renderPanel(); };
    const slot = (host, [sid, name, ic]) => {
      const id = c.equip[sid];
      const d = el('div', 'da-slot' + (id ? '' : ' empty'), id ? `<img src="${D.ICONS.item(id, 52)}">` : `<img class="ghost" src="${D.ICONS.ui(ic, 34, '#5a4a3a')}">`, host);
      d.title = id ? D.itemTooltip(D.ITEMS[id], g, c) + '\n\n(щёлкните, чтобы снять)' : name;
      d.onclick = () => { if (!humanoid) return; if (id) { g.unequip(c, sid); this.renderPanel(); } else { this.invFilter = { weapon: 'weapon', off: 'weapon', head: 'armor', chest: 'armor', gloves: 'armor', boots: 'armor', amulet: 'acc', belt: 'acc', ring1: 'acc', ring2: 'acc', main: 'weapon' }[sid] || 'all'; this.renderPanel(); } };
    };
    SLOT_LEFT.forEach(s => slot(colL, s));
    SLOT_RIGHT.forEach(s => slot(colR, s));
    this.attachPreview(mid, c, 200, 280);
    const st = c.stats;
    el('div', 'da-eqstats top', `<div><i class="ic hp"></i>${Math.round(c.hp)} / ${st.hpMax}</div><div><i class="ic ${c.cls === 'mage' ? 'mana' : 'stam'}"></i>${Math.round(c.mp)} / ${st.mpMax}</div><div class="fat" title="Утомление: увеличивает стоимость способностей"><i class="ic fatg"></i>${st.fat}%</div>`, mid);
    el('div', 'da-eqstats bot', `<div title="Броня"><i class="ic arm"></i>${st.arm}</div><div title="Защита"><i class="ic def"></i>${st.def}</div><div title="Точность"><i class="ic atk"></i>${st.atk}</div><div title="Урон"><i class="ic dmg"></i>${st.dmg}</div>`, mid);
    if (c.kind === 'party' && !c.temp) {
      const ap = c.approval;
      el('div', 'da-approval', `<span>${g.approvalWord(ap)}</span><div class="bar"><i style="left:${(ap + 100) / 2}%"></i></div>`, L);
    }
    const xpNow = c.xp - D.xpForLevel(c.lvl), xpNeed = D.xpForLevel(c.lvl + 1) - D.xpForLevel(c.lvl);
    el('div', 'da-xp', `<b>XP</b><div class="bar"><i style="width:${clamp(xpNow / xpNeed * 100, 0, 100)}%"></i></div><span>ур. ${c.lvl}</span>`, L);
    const m = D.coins(g.gold);
    const top = el('div', 'da-invtop', `<div class="coins"><span class="cg"></span>${m.g}<span class="cs"></span>${m.s}<span class="cc"></span>${m.c}</div><select class="sort"><option value="type">По типу</option><option value="name">По названию</option><option value="new">Сначала новые</option><option value="price">По цене</option></select>`, R);
    const sortSel = top.querySelector('.sort');
    sortSel.value = this.invSort || 'type';
    sortSel.onchange = () => { this.invSort = sortSel.value; this.renderPanel(); };
    const tabs = el('div', 'da-invtabs', null, R);
    const TAB_IC = { all: 'bag', use: 'potion', weapon: 'sword', armor: 'armor', acc: 'ring', craft: 'herb', gift: 'gift', quest: 'scroll' };
    const filt = this.invFilter || 'all';
    for (const [k, name] of D.CATS) {
      const b = el('button', 'da-invtab' + (k === filt ? ' on' : ''), `<img src="${D.ICONS.ui(TAB_IC[k], 26)}">`, tabs);
      b.title = name;
      b.onclick = () => { this.invFilter = k; this.renderPanel(); };
    }
    const list = el('div', 'da-invlist', null, R);
    let items = g.inv.filter(e => filt === 'all' || D.ITEMS[e.id].cat === filt);
    const ord = { use: 0, weapon: 1, armor: 2, acc: 3, craft: 4, gift: 5, quest: 6 };
    const so = this.invSort || 'type';
    items.sort((a, b) => {
      const A = D.ITEMS[a.id], B = D.ITEMS[b.id];
      if (so === 'name') return A.name.localeCompare(B.name);
      if (so === 'new') return (b.t || 0) - (a.t || 0);
      if (so === 'price') return B.price - A.price;
      return (ord[A.cat] - ord[B.cat]) || A.name.localeCompare(B.name);
    });
    for (const e of items) {
      const it = D.ITEMS[e.id];
      const slotFor = this.slotForItem(c, it);
      const can = slotFor ? !D.canEquip(c, slotFor, e.id) : false;
      const row = el('div', 'da-invrow' + (it.unique ? ' uniq' : '') + (slotFor && !can ? ' noreq' : ''), `<img src="${D.ICONS.item(e.id, 40)}"><span class="n">${esc(it.name)}</span>${e.n > 1 ? `<span class="cnt">×${e.n}</span>` : ''}`, list);
      row.title = D.itemTooltip(it, g, c) + (slotFor ? '\n\nЩелчок — надеть' : it.use ? '\n\nЩелчок — использовать' : it.type === 'gift' ? '\n\nЩелчок — подарить ' + c.name : '') + (it.quest ? '' : '\nShift+щелчок — выбросить');
      row.onclick = ev => {
        if (ev.shiftKey && !it.quest) { if (confirm('Выбросить «' + it.name + '»?')) { g.take(e.id, 1); this.renderPanel(); } return; }
        if (slotFor) { const err = g.equipFromInv(c, slotFor, e.id); if (err) this.toast(err, 'warn'); this.renderPanel(); return; }
        if (it.use && !it.use.bomb && !it.use.trap) { const err = g.useItem(c, e.id); if (err) this.toast(err, 'warn'); this.handleEvents(); this.renderPanel(); return; }
        if (it.type === 'gift') { this.giveGift(c, e.id); return; }
      };
    }
    if (!items.length) el('div', 'da-empty', 'Здесь пусто', list);
    const cap = g.invCap(), used = g.invSlots();
    el('div', 'da-cap', `<div class="bar"><i style="width:${clamp(used / cap * 100, 0, 100)}%"></i></div><span>${used} / ${cap}</span>`, R);
  };
  U.slotForItem = function (c, it) {
    if (!it || (it.type !== 'weapon' && it.type !== 'shield' && it.type !== 'armor' && it.type !== 'accessory')) return null;
    if (it.slot === 'ring') return c.equip.ring1 ? (c.equip.ring2 ? 'ring1' : 'ring2') : 'ring1';
    if (it.type === 'weapon' && it.hands === 1 && c.equip.main && D.ITEMS[c.equip.main].hands === 1 && !c.equip.off && c.cls !== 'mage' && !it.bow && (c.cls === 'rogue' || c.abilities.includes('dual_training'))) return 'off';
    return it.slot;
  };
  U.giveGift = function (c, id) {
    const g = this.g, it = D.ITEMS[id];
    if (c.kind !== 'party' || c.temp || c === g.pc) { this.toast('Подарки дарят спутникам', 'warn'); return; }
    g.take(id, 1);
    const n = (it.likes && it.likes[c.key]) || 1;
    g.approve(c.key, n);
    this.handleEvents();
    this.renderPanel();
  };

  U.panelChar_ = function () {
    const g = this.g, c = this.panelChar;
    const [L, R] = this.book('Персонаж', 'Характеристики');
    this.charHeader(L);
    const race = D.RACES[c.race] ? D.RACES[c.race].name : c.race === 'qunari' ? 'Кунари' : c.race === 'beast' ? 'Мабари' : c.race;
    const orig = c === g.pc ? D.ORIGINS[g.origin].name : '';
    el('div', 'da-charinfo', `<div>${esc(race)} · ${esc(D.CLASSES[c.cls] ? D.CLASSES[c.cls].name : '')}${orig ? ' · ' + esc(orig) : ''}</div><div>Уровень ${c.lvl} · опыт ${c.xp} / ${D.xpForLevel(c.lvl + 1)}</div>`, L);
    const top = el('div', 'da-charrow', null, L);
    this.attachPreview(top, c, 150, 210);
    const at = el('div', 'da-attrs', null, top);
    for (const [k, name, desc] of D.ATTRS) {
      const base = c.base[k], tot = c.stats.a[k];
      const r = el('div', 'da-attr', `<span class="an">${name}</span><span class="av">${tot}${tot !== base ? ` <small>(${base})</small>` : ''}</span>`, at);
      r.title = desc;
      if (c.points.attr > 0) { const b = el('button', 'da-plus', '+', r); b.onclick = () => { D.spendAttr(c, k); this.renderPanel(); }; }
    }
    if (c.points.attr > 0) el('div', 'da-points', 'Очки характеристик: ' + c.points.attr, at);
    const bl = el('div', 'da-btnrow', null, L);
    if (c.points.attr + c.points.talent + c.points.skill > 0) { const b = el('button', 'da-btn', 'Распределить автоматически', bl); b.onclick = () => { D.autoLevel(c); c.tactics = c.tactics && c.tactics.length ? c.tactics : D.defaultTactics(c); this.renderPanel(); }; }
    const s = c.stats;
    const rows = [
      ['Здоровье', Math.round(c.hp) + ' / ' + s.hpMax], [c.cls === 'mage' ? 'Мана' : 'Выносливость', Math.round(c.mp) + ' / ' + s.mpMax],
      ['Точность', s.atk], ['Защита', s.def], ['Броня', s.arm], ['Урон', s.dmg], ['Шанс крита', s.crit + '%'], ['Скорость атаки', s.spd + ' с'],
      ['Сила заклинаний', s.sp], ['Сопротивление магии', s.resMent + '%'], ['Физ. стойкость', s.resPhys + '%'], ['Утомление', s.fat + '%'], ['Пробивание брони', s.pierce.toFixed(1)]
    ];
    if (c.stats.lock) rows.push(['Взлом замков', 'уровень ' + c.stats.lock]);
    const tb = el('div', 'da-stats', rows.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join(''), R);
    tb.title = 'Точность против Защиты определяет шанс попадания. Броня поглощает часть урона.';
    if (c.injuries.length) el('div', 'da-injuries', '<h3>Травмы</h3>' + c.injuries.map(id => { const i = D.INJURIES.find(x => x.id === id); return `<div>${esc(i.name)} — ${esc(i.desc)}</div>`; }).join('') + '<div class="dim">Набор от травм лечит все травмы.</div>', R);
    if (c.kind === 'party' && !c.temp) {
      const d = D.COMPANIONS[c.key];
      el('div', 'da-approval big', `<h3>Отношение: ${g.approvalWord(c.approval)} (${c.approval})</h3><div class="bar"><i style="left:${(c.approval + 100) / 2}%"></i></div>`, R);
      if (d && d.bio) el('div', 'da-bio', esc(d.bio), R);
    }
    if (c === g.pc) el('div', 'da-bio', `Убито врагов: ${g.stats.kills} · Критических ударов: ${g.stats.crits} · Время в игре: ${Math.floor(g.playTime / 60)} мин.`, R);
  };

  U.panelAbil = function () {
    const g = this.g, c = this.panelChar;
    const [L, R] = this.book('Таланты и заклинания', 'Навыки');
    this.charHeader(L);
    el('div', 'da-points', `Очки способностей: <b>${c.points.talent}</b>`, L);
    const clsKey = c.look.kind === 'dog' ? 'dog' : c.cls;
    const lines = Object.entries(D.LINES).filter(([, l]) => l.cls.includes(clsKey));
    const grid = el('div', 'da-lines', null, L);
    for (const [lid, line] of lines) {
      const row = el('div', 'da-line', `<div class="ln">${esc(line.name)}</div>`, grid);
      const icons = el('div', 'da-lineicons', null, row);
      line.list.forEach((id, i) => {
        const a = D.AB[id];
        const st = D.abilityState(c, id);
        const b = el('div', 'da-abil ' + st, `<img src="${D.ICONS.ability(id, 38)}">`, icons);
        b.title = `${a.name} (${a.kind === 'pas' ? 'пассивная' : a.kind === 'sus' ? 'поддерживаемая' : 'активная'})\n${a.desc}\n${a.cost ? 'Стоимость: ' + a.cost + (a.kind === 'sus' ? ' (плюс снижение восстановления)' : '') + '\n' : ''}${a.cd ? 'Перезарядка: ' + a.cd + ' с\n' : ''}Требуется уровень ${D.TIER_LEVEL[i]}${i ? ' и «' + D.AB[line.list[i - 1]].name + '»' : ''}${a.need ? '\nНужно: ' + { shield: 'щит', '2h': 'двуручное оружие', dual: 'два клинка', bow: 'лук' }[a.need] : ''}${st === 'open' ? '\n\nЩелчок — изучить' : st === 'known' && a.kind !== 'pas' ? '\n\nЩелчок — использовать' : ''}`;
        b.onclick = () => {
          if (st === 'open' && c.points.talent > 0) { D.learnAbility(c, id); c.tactics = D.defaultTactics(c); this.sfx('levelup'); this.renderPanel(); this.updateHud(true); }
          else if (st === 'known' && a.kind !== 'pas' && c === g.leader) { this.closePanel(); this.beginTargeting('ab', id); }
        };
      });
    }
    if (clsKey === 'dog') { el('div', 'da-empty', 'Боевой мабари не владеет навыками, но понимает людей лучше, чем многие люди.', R); return; }
    el('div', 'da-points', `Очки навыков: <b>${c.points.skill}</b> · максимальный ранг сейчас: ${D.skillCap(c)}`, R);
    const sk = el('div', 'da-skills', null, R);
    for (const [id, s] of Object.entries(D.SKILLS)) {
      const r = c.skills[id] || 0;
      const row = el('div', 'da-skill', `<div class="sn">${esc(s.name)}</div><div class="pips">${[0, 1, 2, 3].map(i => `<i class="${i < r ? 'on' : ''}"></i>`).join('')}</div><div class="sd">${esc(r ? s.ranks[r - 1] : 'Не изучено')}</div>`, sk);
      row.title = s.desc;
      if (c.points.skill > 0 && r < D.skillCap(c)) { const b = el('button', 'da-plus', '+', row); b.onclick = () => { D.raiseSkill(c, id); this.renderPanel(); }; }
    }
  };

  U.panelTactics = function () {
    const g = this.g, c = this.panelChar;
    const [L, R] = this.book('Тактика', 'Поведение');
    this.charHeader(L);
    if (!c.tactics) c.tactics = D.defaultTactics(c);
    const slots = D.tacticSlots(c);
    const list = el('div', 'da-tactics', null, L);
    const acts = [['attack', D.TAC_ACT_BASE.attack], ['item:poultice', D.TAC_ACT_BASE.poultice], ['item:lyrium', D.TAC_ACT_BASE.lyrium], ['item:stamina', D.TAC_ACT_BASE.stamina], ['to_leader', D.TAC_ACT_BASE.to_leader], ['switch_melee', D.TAC_ACT_BASE.switch_melee], ['switch_ranged', D.TAC_ACT_BASE.switch_ranged]];
    if (c.look.kind === 'dog') acts.push(['item:crunch', 'Мабари-хрустяшка']);
    for (const id of c.abilities) { const a = D.AB[id]; if (a && a.kind !== 'pas') acts.push(['ab:' + id, a.name]); }
    for (let i = 0; i < slots; i++) {
      const t = c.tactics[i] || { c: 'enemy_near', a: 'attack', on: false };
      const row = el('div', 'da-tac' + (t.on ? '' : ' off'), `<b>${i + 1}</b><input type="checkbox" ${t.on ? 'checked' : ''}><select class="c">${Object.entries(D.TAC_COND).map(([k, v]) => `<option value="${k}" ${k === t.c ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select><span>→</span><select class="a">${acts.map(([k, v]) => `<option value="${k}" ${k === t.a ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select><button class="up" title="Выше">▲</button>`, list);
      const save = () => { c.tactics[i] = { c: row.querySelector('.c').value, a: row.querySelector('.a').value, on: row.querySelector('input').checked }; row.classList.toggle('off', !c.tactics[i].on); };
      row.querySelector('.c').onchange = save; row.querySelector('.a').onchange = save; row.querySelector('input').onchange = save;
      row.querySelector('.up').onclick = () => { if (i > 0 && c.tactics[i]) { const x = c.tactics[i]; c.tactics[i] = c.tactics[i - 1]; c.tactics[i - 1] = x; this.renderPanel(); } };
    }
    el('div', 'da-dim', `Доступно ячеек: ${slots}. Навык «Боевая тактика» добавляет по две ячейки за ранг.`, L);
    const beh = el('div', 'da-beh', `<h3>Поведение в бою</h3><select>${Object.entries(D.BEHAVIORS).map(([k, v]) => `<option value="${k}" ${k === c.behavior ? 'selected' : ''}>${v}</option>`).join('')}</select><label><input type="checkbox" ${c.tacticsOn ? 'checked' : ''}> Тактика включена</label>`, R);
    beh.querySelector('select').onchange = e => { c.behavior = e.target.value; };
    beh.querySelector('input').onchange = e => { c.tacticsOn = e.target.checked; };
    const pr = el('div', 'da-btnrow col', null, R);
    const b = el('button', 'da-btn', 'Сбросить к стандартной тактике', pr);
    b.onclick = () => { c.tactics = D.defaultTactics(c); this.renderPanel(); };
    el('div', 'da-help', 'Спутники выполняют первое правило, условие которого сейчас выполнено. Правила проверяются сверху вниз, поэтому лечение и зелья ставьте выше атак. Управляемый вами персонаж тактику не использует.<br><br>Выбрать персонажа — F1–F4 или щелчок по портрету. Shift+щелчок добавляет его к выделению: весь выделенный отряд пойдёт или атакует по вашей команде.', R);
  };

  U.panelJournal = function () {
    const g = this.g;
    const tab = this.jTab || 'quests';
    const [L, R, B] = this.book(tab === 'quests' ? 'Журнал' : 'Кодекс', '');
    const tabs = el('div', 'da-jtabs', null, B);
    for (const [k, n] of [['quests', 'Задания'], ['codex', 'Кодекс']]) { const b = el('button', 'da-jtab' + (k === tab ? ' on' : ''), n, tabs); b.onclick = () => { this.jTab = k; this.renderPanel(); }; }
    if (tab === 'quests') {
      const act = g.questLog.filter(id => !g.questDone(id) && !(D.QUESTS[id].fail || []).includes(g.quests[id]));
      const done = g.questLog.filter(id => !act.includes(id));
      if (!this.jSel || !g.quests[this.jSel]) this.jSel = act[0] || done[0];
      const list = el('div', 'da-qlist', null, L);
      const add = (id, cls) => { const q = D.QUESTS[id]; const d = el('div', 'da-qitem ' + cls + (id === this.jSel ? ' on' : ''), esc(q.name), list); d.onclick = () => { this.jSel = id; this.renderPanel(); }; };
      el('div', 'da-qhead', 'Текущие', list);
      act.forEach(id => add(id, 'act'));
      if (!act.length) el('div', 'da-dim', 'Нет активных заданий', list);
      el('div', 'da-qhead', 'Завершённые', list);
      done.forEach(id => add(id, 'done'));
      if (this.jSel) {
        const q = D.QUESTS[this.jSel], st = g.quests[this.jSel];
        R.parentNode.querySelector('h2').textContent = q.name;
        const stages = Object.entries(q.stages).filter(([k]) => +k <= st && (!q.fail || !q.fail.includes(+k) || +k === st));
        el('div', 'da-qtext', stages.map(([k, t], i) => `<p class="${i === stages.length - 1 ? 'cur' : ''}">${esc(t)}</p>`).join(''), R);
      }
      return;
    }
    const cats = D.CODEX_CATS;
    const ids = Object.keys(g.codex);
    if (!this.cSel || !g.codex[this.cSel]) this.cSel = ids[0];
    const list = el('div', 'da-qlist', null, L);
    for (const cat of cats) {
      const inCat = ids.filter(id => D.CODEX[id].cat === cat);
      if (!inCat.length) continue;
      el('div', 'da-qhead', esc(cat) + ` (${inCat.length})`, list);
      for (const id of inCat) {
        const d = el('div', 'da-qitem' + (id === this.cSel ? ' on' : '') + (g.codexNew[id] ? ' new' : ''), esc(D.CODEX[id].title), list);
        d.onclick = () => { this.cSel = id; delete g.codexNew[id]; this.renderPanel(); };
      }
    }
    el('div', 'da-dim', `Записей: ${ids.length} из ${Object.keys(D.CODEX).length}`, list);
    if (this.cSel) {
      const e = D.CODEX[this.cSel];
      delete g.codexNew[this.cSel];
      R.parentNode.querySelector('h2').textContent = e.title;
      el('div', 'da-qtext codex', e.text.split('\n').map(p => `<p>${esc(p)}</p>`).join(''), R);
    }
  };

  U.panelMap = function () {
    const g = this.g;
    const [L, R, B] = this.book('', '');
    B.classList.add('wide');
    const title = el('div', 'da-maptitle', esc(g.def.name), B);
    const cv = el('canvas', 'da-bigmap', null, B);
    const W = 820, H = 520;
    cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    const Lr = g.L;
    const sc = Math.min(W / Lr.w, H / Lr.h) * 0.95;
    const ox = (W - Lr.w * sc) / 2, oz = (H - Lr.h * sc) / 2;
    x.fillStyle = '#d8c8a0'; x.fillRect(0, 0, W, H);
    x.imageSmoothingEnabled = false;
    x.globalAlpha = 0.85;
    x.drawImage(this.miniBase, ox, oz, Lr.w * sc, Lr.h * sc);
    x.globalAlpha = 1;
    x.fillStyle = 'rgba(80,50,20,0.25)'; x.fillRect(0, 0, W, H);
    const P = (px, pz) => [ox + px * sc, oz + pz * sc];
    x.textAlign = 'center';
    const labels = [];
    for (const o of g.activeObjs()) {
      if (o.t !== 'exit' || o.hidden) continue;
      const [a, b] = P(o.x, o.z);
      x.fillStyle = '#2a4a8a'; x.beginPath(); x.arc(a, b, 5, 0, 7); x.fill();
      labels.push([this.objLabel(o), a, b, 'bold 12px Georgia', '#1a2a4a']);
    }
    for (const e of g.ents) {
      if (e.gone || e.dead) continue;
      const [a, b] = P(e.x, e.z);
      if (e.kind === 'npc' && e.dlg) {
        x.fillStyle = '#b08010'; x.beginPath(); x.arc(a, b, 4, 0, 7); x.fill();
        if (sc > 5) labels.push([e.name, a, b, '11px Georgia', '#3a2a10']);
      }
      if (e.faction === 'party') { x.fillStyle = e === g.leader ? '#fff' : '#2a8a2a'; x.strokeStyle = '#000'; x.beginPath(); x.arc(a, b, e === g.leader ? 6 : 4, 0, 7); x.fill(); x.stroke(); }
    }
    const placed = [];
    const overlaps = r => placed.some(q => r[0] < q[0] + q[2] && q[0] < r[0] + r[2] && r[1] < q[1] + q[3] && q[1] < r[1] + r[3]);
    for (const [text, a, b, font, col] of labels) {
      x.font = font;
      const w = x.measureText(text).width + 4;
      for (const dy of [-7, 17, -19, 29]) {
        const r = [a - w / 2, b + dy - 11, w, 13];
        if (overlaps(r)) continue;
        placed.push(r);
        x.fillStyle = 'rgba(230,214,176,0.75)'; x.fillRect(r[0], r[1], r[2], r[3]);
        x.fillStyle = col; x.fillText(text, a, b + dy);
        break;
      }
    }
    el('div', 'da-dim center', 'Золотые точки — те, с кем можно поговорить. Синие — выходы.', B);
  };

  U.panelCraft = function () {
    const g = this.g;
    const [L, R] = this.book('Ремесло', 'Рецепт');
    const skills = ['herbalism', 'poison', 'traps'];
    const list = el('div', 'da-qlist', null, L);
    if (!this.rSel) this.rSel = D.RECIPES[0].id;
    for (const sk of skills) {
      const best = g.bestCrafter(sk);
      el('div', 'da-qhead', esc(D.SKILLS[sk].name) + (best && best.skills[sk] ? ` (${esc(best.name)}, ранг ${best.skills[sk]})` : ' (никто не владеет)'), list);
      for (const r of D.RECIPES.filter(x => x.skill === sk)) {
        const ok = g.canCraft(r);
        const d = el('div', 'da-qitem' + (r.id === this.rSel ? ' on' : '') + (ok ? '' : ' dim'), `<img src="${D.ICONS.item(r.out, 24)}"> ${esc(D.ITEMS[r.out].name)}`, list);
        d.onclick = () => { this.rSel = r.id; this.renderPanel(); };
      }
    }
    const r = D.RECIPES.find(x => x.id === this.rSel);
    if (!r) return;
    const it = D.ITEMS[r.out];
    el('div', 'da-recipe', `<img src="${D.ICONS.item(r.out, 64)}"><h3>${esc(it.name)}</h3><div>${esc(it.desc || '')}</div><div class="dim">Требуется: ${esc(D.SKILLS[r.skill].name)}, ранг ${r.rank}</div><h3>Ингредиенты</h3>${r.need.map(([id, n]) => `<div class="ing${g.count(id) >= n ? '' : ' miss'}"><img src="${D.ICONS.item(id, 24)}"> ${esc(D.ITEMS[id].name)}: ${g.count(id)} / ${n}</div>`).join('')}`, R);
    const b = el('button', 'da-btn', 'Изготовить', el('div', 'da-btnrow', null, R));
    b.disabled = !g.canCraft(r);
    b.onclick = () => { const err = g.craft(r.id); if (err) this.toast(err, 'warn'); else this.toast('Изготовлено: ' + it.name, 'item'); this.renderPanel(); };
  };

  U.panelParty = function () {
    const g = this.g;
    const [L, R] = this.book('Отряд', 'Спутники');
    const members = Object.values(g.roster).filter(c => !c.temp);
    const inParty = new Set(g.party.map(c => c.key));
    el('div', 'da-help', 'В отряде может быть до четырёх человек, включая вас. Спутники вне отряда ждут неподалёку и получают опыт вместе со всеми.', L);
    const cards = el('div', 'da-cards', null, L);
    const pcCard = el('div', 'da-card on fixed', `<img src="${this.portraitFor(g.pc)}"><b>${esc(g.pc.name)}</b><span>ур. ${g.pc.lvl}</span>`, cards);
    pcCard.title = 'Вы всегда в отряде';
    const temps = g.party.filter(c => c.temp);
    for (const c of temps) el('div', 'da-card on fixed', `<img src="${this.portraitFor(c)}"><b>${esc(c.name)}</b><span>временный спутник</span>`, cards);
    for (const c of members) {
      const on = inParty.has(c.key);
      const d = el('div', 'da-card' + (on ? ' on' : ''), `<img src="${this.portraitFor(c)}"><b>${esc(c.name)}</b><span>ур. ${c.lvl} · ${g.approvalWord(c.approval)}</span>`, cards);
      d.onclick = () => {
        if (g.combat) { this.toast('Не во время боя', 'warn'); return; }
        const keys = g.party.filter(p => p !== g.pc).map(p => p.key);
        if (on) keys.splice(keys.indexOf(c.key), 1);
        else { if (g.party.length >= 4) { this.toast('Отряд уже полон', 'warn'); return; } keys.push(c.key); }
        g.setActiveParty(keys);
        this.renderPanel();
        this.updateHud(true);
      };
    }
    if (!members.length) el('div', 'da-dim', 'Пока у вас нет постоянных спутников.', L);
    for (const c of members) el('div', 'da-comp', `<b>${esc(c.name)}</b> <span class="dim">${esc(g.approvalWord(c.approval))}</span><div class="bio">${esc((D.COMPANIONS[c.key] || {}).bio || '')}</div><div class="bar"><i style="left:${(c.approval + 100) / 2}%"></i></div>`, R);
  };

  U.panelShop = function () {
    const g = this.g;
    if (!g.shop) { this.closePanel(); return; }
    const s = g.shop;
    const [L, R] = this.book(s.def.name, 'Ваши вещи');
    const m = D.coins(g.gold);
    el('div', 'da-invtop', `<div class="coins"><span class="cg"></span>${m.g}<span class="cs"></span>${m.s}<span class="cc"></span>${m.c}</div>`, R);
    if (s.def.desc) el('div', 'da-dim', esc(s.def.desc), L);
    const list = el('div', 'da-invlist', null, L);
    for (const e of s.stock) {
      const it = D.ITEMS[e.id];
      const p = g.buyPrice(e.id);
      const row = el('div', 'da-invrow' + (g.gold < p ? ' noreq' : ''), `<img src="${D.ICONS.item(e.id, 40)}"><span class="n">${esc(it.name)}</span><span class="price">${D.fmtMoney(p)}</span>${e.n < 50 && e.n > 1 ? `<span class="cnt">×${e.n}</span>` : ''}`, list);
      row.title = D.itemTooltip(it, g, g.leader) + '\n\nЩелчок — купить';
      row.onclick = () => { const err = g.buy(e.id); if (err) this.toast(err, 'warn'); this.renderPanel(); };
    }
    const list2 = el('div', 'da-invlist', null, R);
    for (const e of g.inv) {
      const it = D.ITEMS[e.id];
      if (it.quest) continue;
      const row = el('div', 'da-invrow', `<img src="${D.ICONS.item(e.id, 40)}"><span class="n">${esc(it.name)}</span>${e.n > 1 ? `<span class="cnt">×${e.n}</span>` : ''}<span class="price">${D.fmtMoney(g.sellPrice(e.id))}</span>`, list2);
      row.title = D.itemTooltip(it, g, g.leader) + '\n\nЩелчок — продать';
      row.onclick = () => { const err = g.sell(e.id); if (err) this.toast(err, 'warn'); this.renderPanel(); };
    }
  };

  U.showGameMenu = function () {
    const g = this.g;
    if (this.panel === 'menu') { this.closePanel(); return; }
    this.closePanel(true);
    this.panel = 'menu';
    const d = el('div', 'da-gmenu', `<div class="da-gmenu-t">Dragon Age: Origins 98</div>`, this.layer);
    this.menuPanel = d;
    const btn = (t, fn, dis) => { const b = el('button', 'da-mbtn', t, d); b.disabled = !!dis; b.onclick = fn; return b; };
    btn('Продолжить', () => this.closePanel());
    btn('Сохранить игру', () => this.showSaveList(true), g.mode !== 'play' || g.combat);
    btn('Загрузить игру', () => this.showSaveList(false));
    btn('Настройки', () => this.showOptions());
    btn('Главное меню', () => { if (confirm('Выйти в главное меню? Несохранённый прогресс будет потерян.')) { this.closePanel(); this.showMenu(); } });
    if (this.opts.onExit) btn('Выйти из игры', () => { if (confirm('Закрыть игру?')) this.opts.onExit(); });
  };
  U.showSaveList = function (saving) {
    const host = this.menuPanel || this.layer;
    const d = el('div', 'da-saves', `<div class="da-gmenu-t">${saving ? 'Сохранить игру' : 'Загрузить игру'}</div><div class="list"></div><div class="da-btnrow"><button class="da-btn back">Назад</button></div>`, this.layer);
    const list = d.querySelector('.list');
    const saves = this.listSaves();
    if (saving) {
      const r = el('div', 'da-saverow new', '<b>+ Новое сохранение</b>', list);
      r.onclick = () => { const slot = 's' + Date.now(); if (this.writeSave(slot, 'Сохранение')) { d.remove(); this.closePanel(); } };
    }
    for (const s of saves) {
      const dt = new Date(s.time);
      const r = el('div', 'da-saverow', `<b>${esc(s.label)}</b> — ${esc(s.name)}, ур. ${s.lvl} · ${esc(s.area)}<br><small>${dt.toLocaleDateString('ru-RU')} ${dt.toLocaleTimeString('ru-RU')} · ${Math.floor((s.play || 0) / 60)} мин.</small><button class="del" title="Удалить">✕</button>`, list);
      r.onclick = e => {
        if (e.target.classList.contains('del')) { e.stopPropagation(); if (confirm('Удалить сохранение?')) { localStorage.removeItem('dao98_save_' + s.slot); localStorage.setItem('dao98_saves', JSON.stringify(this.listSaves().filter(x => x.slot !== s.slot))); d.remove(); this.showSaveList(saving); } return; }
        if (saving) { if (this.writeSave(s.slot, s.label)) { d.remove(); this.closePanel(); } }
        else { d.remove(); if (this.menuPanel) this.closePanel(); this.loadSave(s.slot); }
      };
    }
    if (!saves.length && !saving) el('div', 'da-dim', 'Сохранений нет', list);
    d.querySelector('.back').onclick = () => d.remove();
    return d;
  };
  U.showOptions = function () {
    const s = this.settings;
    const d = el('div', 'da-saves opts', `<div class="da-gmenu-t">Настройки</div>
      <label>Общая громкость <input type="range" min="0" max="1" step="0.05" data-k="master" value="${s.master}"></label>
      <label>Музыка <input type="range" min="0" max="1" step="0.05" data-k="music" value="${s.music}"></label>
      <label>Звуки <input type="range" min="0" max="1" step="0.05" data-k="sfx" value="${s.sfx}"></label>
      <label>Разрешение 3D <select data-k="res"><option value="0.5">Низкое (как на Voodoo)</option><option value="0.7">Среднее</option><option value="0.85">Высокое</option><option value="1">Максимальное</option></select></label>
      <label>Скорость камеры <input type="range" min="0.4" max="2" step="0.1" data-k="camSpeed" value="${s.camSpeed}"></label>
      <label><input type="checkbox" data-k="autoPause" ${s.autoPause ? 'checked' : ''}> Пауза при начале боя</label>
      <label><input type="checkbox" data-k="bars" ${s.bars ? 'checked' : ''}> Полоски здоровья врагов</label>
      ${this.g ? `<label>Сложность <select data-k="difficulty">${Object.entries(D.DIFFICULTY).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</select></label>` : ''}
      <div class="da-opt-h">Озвучка диалогов</div>
      <label><input type="checkbox" data-k="voice" ${s.voice ? 'checked' : ''}> Читать реплики вслух</label>
      <label>Громкость голоса <input type="range" min="0" max="1" step="0.05" data-k="voiceVol" value="${s.voiceVol}"></label>
      <label>Скорость речи <input type="range" min="0.6" max="1.6" step="0.05" data-k="voiceRate" value="${s.voiceRate}"></label>
      <label>Мужские роли <select data-k="voiceM"></select></label>
      <label>Женские роли <select data-k="voiceF"></select></label>
      <label>Рассказчик <select data-k="voiceNarr"></select></label>
      <div class="da-dim da-voice-note"></div>
      <div class="da-btnrow"><button class="da-btn back">Готово</button></div>`, this.layer);
    d.querySelector('[data-k=res]').value = String(s.res);
    const dsel = d.querySelector('[data-k=difficulty]');
    if (dsel) dsel.value = this.g.difficulty;
    const fillVoices = () => {
      const list = this.audio.voices();
      const label = v => esc(v.name.replace(/^Microsoft\s+/, '').replace(/\s+-\s+.*$/, ''));
      for (const k of ['voiceM', 'voiceF', 'voiceNarr']) {
        const sel = d.querySelector(`[data-k=${k}]`);
        const extra = k === 'voiceNarr' ? '<option value="off">Не озвучивать</option>' : '';
        const lost = s[k] && s[k] !== 'off' && !list.some(v => v.name === s[k]) ? `<option value="${esc(s[k])}">${esc(s[k])}</option>` : '';
        sel.innerHTML = `<option value="">Автоматически</option>${extra}${list.map(v => `<option value="${esc(v.name)}">${label(v)}</option>`).join('')}${lost}`;
        sel.value = s[k];
      }
      d.querySelector('.da-voice-note').textContent = !this.audio.canSpeak() ? 'Синтез речи недоступен в этом браузере.' : list.length ? '' : 'Русские голоса не найдены: установите русский речевой пакет Win.';
      d.querySelectorAll('[data-k^=voice]').forEach(inp => { inp.disabled = !this.audio.canSpeak(); });
    };
    fillVoices();
    const unwatch = this.audio.watchVoices(fillVoices);
    d.querySelectorAll('[data-k]').forEach(inp => {
      inp.oninput = inp.onchange = () => {
        const k = inp.dataset.k;
        const v = inp.type === 'checkbox' ? inp.checked : inp.type === 'range' || k === 'res' ? +inp.value : inp.value;
        if (k === 'difficulty') { this.g.difficulty = v; return; }
        s[k] = v;
        if (k === 'master' || k === 'music' || k === 'sfx') this.audio.setVol(k, v);
        if (k.startsWith('voice')) this.audio.speech = D.speechOpts(s);
        if (k === 'res') this.onResize();
        this.saveSettings();
      };
      if (inp.dataset.k.startsWith('voice')) inp.addEventListener('change', () => {
        const k = inp.dataset.k;
        if (s.voice) this.audio.sample(k === 'voiceF' ? 'f' : k === 'voiceNarr' ? 'narr' : 'm');
        else this.audio.hush();
      });
    });
    d.querySelector('.back').onclick = () => { unwatch(); this.audio.hush(); d.remove(); };
  };
})(globalThis.Dao98 = globalThis.Dao98 || {});
