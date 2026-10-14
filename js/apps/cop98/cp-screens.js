(function (C) {
  'use strict';
  const { clamp } = C;
  const D = C.DATA;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const STACK_TYPES = new Set(['ammo', 'consumable', 'part', 'grenade']);
  const TYPE_ORDER = { weapon: 0, outfit: 1, detector: 2, artifact: 3, ammo: 4, grenade: 5, consumable: 6, part: 7, quest: 8 };
  const TYPE_NAME = { weapon: 'Оружие', outfit: 'Защитный костюм', detector: 'Детектор', artifact: 'Артефакт', ammo: 'Боеприпасы', grenade: 'Граната', consumable: 'Расходник', part: 'Часть мутанта', quest: 'Сюжетный предмет' };
  const WEAPON_KIND = { knife: 'Нож', pistol: 'Пистолет', shotgun: 'Дробовик', rifle: 'Автомат', sniper: 'Снайперская винтовка' };
  const SLOT_NAME = { knife: 'Нож', pistol: 'Пистолет', rifle: 'Основное оружие', outfit: 'Костюм', detector: 'Детектор' };
  const FACTION = { stalker: 'Вольный сталкер', bandit: 'Бандит', merc: 'Наёмник', zombie: 'Зомбированный', monster: 'Мутант' };
  const PROTECT = [['armor', 'bullet', 'Пули'], ['burn', 'burn', 'Огонь'], ['shock', 'shock', 'Электричество'], ['chem', 'chem', 'Химия'], ['rad', 'rad', 'Радиация']];
  const USE_NAME = { health: 'Здоровье', bleed: 'Кровотечение', rad: 'Радиация', food: 'Сытость', stamina: 'Выносливость', drunk: 'Опьянение' };
  const ART_NAME = { carry: 'Переносимый вес', armor: 'Защита от пуль', stamina: 'Выносливость', health: 'Заживление ран', bleedHeal: 'Остановка крови', shock: 'Электрозащита', chem: 'Химзащита', compass: 'Видит аномалии' };
  const UPG_GLYPH = { w_recoil: 'w_recoil', w_sight: 'w_sight', w_mag: 'w_mag', w_barrel: 'w_barrel', w_rate: 'w_rate', w_reliable: 'w_reliable', o_light: 'o_light', o_plates: 'o_plates', o_belt: 'o_belt', o_chem: 'o_chem', o_carry: 'o_carry', o_belt2: 'o_belt2' };

  const WMAX = (() => {
    const ws = Object.values(D.WEAPONS).filter(w => !w.melee);
    return { dmg: Math.max(...ws.map(w => w.dmg * (w.pellets || 1))), rpm: Math.max(...ws.map(w => w.rpm)), spread: Math.max(...ws.map(w => w.spread)), recoil: Math.max(...ws.map(w => w.recoil)) };
  })();

  const sortItems = list => list.slice().sort((a, b) => {
    const da = D.ITEMS[a.id], db = D.ITEMS[b.id];
    const t = TYPE_ORDER[da.type] - TYPE_ORDER[db.type];
    if (t) return t;
    const fa = C.Icons.footprint(a.id), fb = C.Icons.footprint(b.id);
    return fb[0] * fb[1] - fa[0] * fa[1] || da.name.localeCompare(db.name);
  });

  const methods = {
    cellU() {
      const r = this.winEl.getBoundingClientRect(), W = r.width || this.root.clientWidth || 1000, H = r.height || this.root.clientHeight || 680;
      return clamp(Math.floor(Math.min(W / 20.4, H / 15.6)), 26, 58);
    },

    iconPx() { return Math.round((this.U || this.cellU()) * (globalThis.devicePixelRatio || 1)); },

    iconUrl(id, px) {
      px = px || this.iconPx();
      if (!this.iconUrlCache) this.iconUrlCache = new Map();
      const key = id + '@' + px;
      let u = this.iconUrlCache.get(key);
      if (!u) { u = C.Skin.imageToUrl(C.Icons.render(id, px)); this.iconUrlCache.set(key, u); }
      return u;
    },

    itemIcon(it) { return this.iconUrl(it.id, Math.max(24, this.iconPx())); },

    portraitUrl(look) {
      if (!this.portraitCache) this.portraitCache = new Map();
      const key = C.Portraits.has(look) ? look : 'loner';
      let u = this.portraitCache.get(key);
      if (!u) { u = C.Skin.imageToUrl(this.bank.portrait(key)); this.portraitCache.set(key, u); }
      return u;
    },

    itemLabel(it) {
      const def = D.ITEMS[it.id];
      return def.name + ((def.type === 'ammo' || ((def.type === 'consumable' || def.type === 'part' || def.type === 'grenade') && it.count > 1)) ? ' ×' + it.count : '');
    },

    itemKindLine(it) {
      const def = D.ITEMS[it.id];
      if (def.type === 'weapon') { const w = D.WEAPONS[it.id]; return (WEAPON_KIND[w.melee ? 'knife' : w.npc] || 'Оружие') + (w.ammo ? ' · ' + w.ammo.map(a => D.AMMO[a].name).join(', ') : ''); }
      if (def.type === 'artifact') return 'Артефакт · ' + ({ gravity: 'гравитационный', electro: 'электрический', fire: 'термический', chem: 'химический' }[D.ARTIFACTS[it.id].type] || '');
      return TYPE_NAME[def.type] || '';
    },

    statBar(label, v, text, cls = '') {
      return `<div class="cps-stat ${cls}"><span>${esc(label)}</span><i><b style="width:${Math.round(clamp(v, 0, 1) * 100)}%"></b></i><em>${esc(text)}</em></div>`;
    },

    statLine(label, value, sign = 0) { return `<div class="cps-line ${sign > 0 ? 'good' : sign < 0 ? 'bad' : ''}"><span>${esc(label)}</span><em>${esc(value)}</em></div>`; },

    itemStatsHTML(it) {
      const g = this.game, def = D.ITEMS[it.id], out = [];
      if (def.type === 'weapon') {
        const s = g ? g.weaponStats(it) : D.WEAPONS[it.id];
        if (!s.melee) {
          const dmg = s.dmg * (s.pellets || 1);
          out.push(this.statBar('Урон', dmg / WMAX.dmg, String(Math.round(dmg))), this.statBar('Точность', 1 - s.spread / (WMAX.spread * 1.1), Math.round((1 - s.spread * 20) * 100) + '%'), this.statBar('Темп стрельбы', s.rpm / WMAX.rpm, Math.round(s.rpm) + '/мин'), this.statBar('Удобство', 1 - s.recoil / (WMAX.recoil * 1.15), ''));
          out.push(this.statLine('Магазин', String(s.mag)));
          if (it.ammoType) out.push(this.statLine('Заряжено', `${it.mag} × ${D.AMMO[it.ammoType].name}`));
        } else out.push(this.statLine('Урон', String(s.dmg)));
        if (it.cond != null) out.push(this.statBar('Состояние', it.cond, Math.round(it.cond * 100) + '%', it.cond < 0.5 ? 'low' : ''));
        if (it.upg && it.upg.length) out.push(this.statLine('Апгрейды', it.upg.map(u => D.UPGRADES.weapon.find(q => q.id === u).name).join(', ')));
      } else if (def.type === 'outfit') {
        const o = Object.assign({}, D.OUTFITS[it.id]);
        for (const u of it.upg || []) { const up = D.UPGRADES.outfit.find(q => q.id === u); if (up) for (const [k, v] of Object.entries(up.fx)) o[k] = (o[k] || 0) + v; }
        for (const [k, , n] of PROTECT) out.push(this.statBar(n, o[k] / 0.8, Math.round(o[k] * 100) + '%'));
        out.push(this.statLine('Контейнеры для артефактов', String(o.belt)));
        if (o.carry) out.push(this.statLine('Переносимый вес', '+' + o.carry + ' кг', 1));
        if (o.noSprint) out.push(this.statLine('Бег', 'невозможен', -1));
        if (it.cond != null) out.push(this.statBar('Состояние', it.cond, Math.round(it.cond * 100) + '%', it.cond < 0.5 ? 'low' : ''));
      } else if (def.type === 'artifact') {
        const a = D.ARTIFACTS[it.id];
        out.push(this.statLine('Радиация', (a.rad > 0 ? '+' : '') + a.rad, a.rad > 0 ? -1 : 1));
        for (const [k, v] of Object.entries(a.fx)) out.push(this.statLine(ART_NAME[k] || k, k === 'compass' ? 'да' : '+' + (k === 'carry' ? v + ' кг' : k === 'armor' || k === 'shock' || k === 'chem' ? Math.round(v * 100) + '%' : v), 1));
      } else if (def.type === 'consumable') {
        for (const [k, v] of Object.entries(D.CONSUMABLES[it.id].use)) out.push(this.statLine(USE_NAME[k] || k, (v > 0 ? '+' : '') + v, (k === 'bleed' || k === 'rad') ? (v < 0 ? 1 : -1) : k === 'drunk' ? -1 : 1));
      } else if (def.type === 'ammo') {
        const a = D.AMMO[def.caliber];
        out.push(this.statLine('В пачке', `${it.count} шт.`), this.statBar('Бронебойность', a.pierce, Math.round(a.pierce * 100) + '%'));
        if (a.slug) out.push(this.statLine('Тип', 'пуля-жакан'));
      } else if (def.type === 'detector') {
        const d = D.DETECTORS[it.id];
        out.push(this.statLine('Радиус поиска', d.range + ' м'), this.statLine('Направление на артефакт', d.arrow ? 'есть' : 'нет', d.arrow ? 1 : 0), this.statLine('Экран с отметками', d.map ? 'есть' : 'нет', d.map ? 1 : 0));
      } else if (def.type === 'grenade') out.push(this.statLine('Урон', String(def.dmg)), this.statLine('Радиус', def.radius + ' м'));
      return out.join('');
    },

    itemDetails(it) {
      const g = this.game, def = D.ITEMS[it.id];
      const w = g ? g.itemWeight(it) : (def.weight || 0) * (it.count || 1);
      return `<h3>${esc(def.name)}</h3><div class="cps-kind">${esc(this.itemKindLine(it))}</div><div class="cp98-desc">${esc(def.desc || '')}</div><div class="cp98-stats cps-stats">${this.itemStatsHTML(it)}</div><div class="cps-wp"><span>Вес ${w.toFixed(2)} кг</span><span>${def.type === 'quest' ? 'Не продаётся' : 'Цена ' + C.formatMoney(def.price)}</span></div>`;
    },

    cardHTML(it, extra = '') {
      return `<div class="cps-card-head"><img src="${this.iconUrl(it.id)}" alt=""></div>${this.itemDetails(it)}${extra}`;
    },

    showCard(anchor, it, extra) {
      const root = this.winEl;
      let card = root.querySelector(':scope > .cps-card');
      if (!card) { card = document.createElement('div'); card.className = 'cps-card'; root.appendChild(card); }
      card.innerHTML = this.cardHTML(it, extra);
      card.style.display = 'block';
      const rr = root.getBoundingClientRect(), ar = anchor.getBoundingClientRect(), cr = card.getBoundingClientRect();
      let x = ar.right - rr.left + 8;
      if (x + cr.width > rr.width - 4) x = ar.left - rr.left - cr.width - 8;
      if (x < 4) x = clamp(ar.left - rr.left, 4, rr.width - cr.width - 4);
      const y = clamp(ar.top - rr.top, 4, Math.max(4, rr.height - cr.height - 4));
      card.style.left = Math.round(x) + 'px'; card.style.top = Math.round(y) + 'px';
    },

    hideCard() { const c = this.winEl.querySelector(':scope > .cps-card'); if (c) c.style.display = 'none'; },

    openMenu(ev, actions, run) {
      this.closeMenu();
      if (!actions.length) return;
      const root = this.winEl, rr = root.getBoundingClientRect();
      const m = document.createElement('div');
      m.className = 'cps-menu';
      m.innerHTML = actions.map(([k, label, off]) => `<button data-m="${k}" ${off ? 'disabled' : ''}>${esc(label)}</button>`).join('');
      root.appendChild(m);
      const mr = m.getBoundingClientRect();
      m.style.left = Math.round(clamp(ev.clientX - rr.left, 2, rr.width - mr.width - 2)) + 'px';
      m.style.top = Math.round(clamp(ev.clientY - rr.top, 2, rr.height - mr.height - 2)) + 'px';
      m.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; e.stopPropagation(); this.closeMenu(); run(b.dataset.m); });
      const first = m.querySelector('button:not([disabled])');
      if (first) first.focus({ preventScroll: true });
    },

    closeMenu() { const m = this.winEl.querySelector(':scope > .cps-menu'); if (m) m.remove(); },

    note(text, color) {
      const el = this.winEl.querySelector('.cps-note');
      if (!el) return;
      el.textContent = text; el.style.color = color || '';
      el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    },

    act(fn) {
      const g = this.game, before = this.msgs.length ? this.msgs[this.msgs.length - 1] : null;
      fn();
      this.processEvents(g);
      const last = this.msgs.length ? this.msgs[this.msgs.length - 1] : null;
      return last && last !== before ? last : null;
    },

    gridHTML(list, cols, src, opts = {}) {
      const { cells, rows } = C.Icons.pack(sortItems(list), cols);
      const minRows = opts.minRows || 0;
      const items = cells.map(({ it, x, y, w, h }) => this.cellHTML(it, `${src}:${it.uid}`, x, y, w, h, opts.extra ? opts.extra(it) : '', opts.dim && opts.dim(it))).join('');
      const hint = !list.length && opts.hint ? `<span class="cps-gridhint">${esc(opts.hint)}</span>` : '';
      return `<div class="cps-grid" data-drop="${src}" style="--cols:${cols};--rows:${Math.max(rows, minRows)}">${items}${hint}</div>`;
    },

    cellHTML(it, key, x, y, w, h, extra = '', dim = false) {
      const def = D.ITEMS[it.id];
      const cnt = def.type === 'ammo' || ((def.type === 'consumable' || def.type === 'part' || def.type === 'grenade') && it.count > 1) ? `<span class="cps-cnt">${def.type === 'ammo' ? it.count : '×' + it.count}</span>` : '';
      const cond = it.cond != null ? `<i class="cps-cond" style="--c:${Math.round(it.cond * 10)}"></i>` : '';
      return `<div class="cps-it ${dim ? 'dim' : ''}" tabindex="0" data-src="${key}" style="left:calc(${x} * var(--u));top:calc(${y} * var(--u));width:calc(${w} * var(--u));height:calc(${h} * var(--u))"><img src="${this.iconUrl(it.id)}" alt="${esc(def.name)}" draggable="false">${cnt}${cond}${extra}</div>`;
    },

    slotHTML(slot, it, cls) {
      const f = it ? C.Icons.footprint(it.id) : null;
      const rot = it && cls === 'tall' && f[0] > f[1];
      const img = it ? `<div class="cps-it in-slot" tabindex="0" data-src="slot:${slot}:${it.uid}"><img class="${rot ? 'rot' : ''}" style="--iw:${f[0]};--ih:${f[1]}" src="${this.iconUrl(it.id)}" alt="${esc(D.ITEMS[it.id].name)}" draggable="false">${it.cond != null ? `<i class="cps-cond" style="--c:${Math.round(it.cond * 10)}"></i>` : ''}</div>` : '';
      return `<div class="cps-slot ${cls} ${it ? 'full' : ''}" data-drop="slot:${slot}"><span class="cps-slot-name">${SLOT_NAME[slot]}</span>${img}</div>`;
    },

    lookFor(actor) {
      if (!actor) return null;
      if (actor.kind === 'human') return actor.look || 'loner';
      return C.Portraits.has(actor.kind) ? actor.kind : null;
    },

    faceHTML(look) {
      if (look === 'stash') return `<img class="cps-face stash" src="${this.iconUrl('nimble_case')}" alt="">`;
      if (!look) return '';
      const key = C.Portraits.has(look) ? look : 'loner';
      if (this.bank.hasPortrait(key)) return `<img class="cps-face" src="${this.portraitUrl(key)}" alt="">`;
      this.queuePortrait(key, () => { for (const im of this.winEl.querySelectorAll(`.cps-face[data-look="${key}"]`)) { im.src = this.portraitUrl(key); im.classList.remove('wait'); } }, true);
      return `<img class="cps-face wait" data-look="${key}" src="${C.Skin.glyphUrl('pda', 32, '#6a665a')}" alt="">`;
    },

    headHTML(name, sub, money, look, extra = '') {
      return `<div class="cps-head"><div class="cps-who"><b>${esc(name)}</b><span>${esc(sub)}</span>${money != null ? `<em>${C.formatMoney(money)}</em>` : ''}${extra}</div>${this.faceHTML(look)}</div>`;
    },

    bindItems(el, h) {
      const findIt = key => {
        if (!key) return null;
        const parts = key.split(':'), uid = Number(parts[parts.length - 1]);
        return h.item ? h.item(key, uid) : this.game.item(uid);
      };
      el.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        const node = e.target.closest('[data-src]'); if (!node) return;
        this.closeMenu();
        const key = node.dataset.src, it = findIt(key); if (!it) return;
        const x0 = e.clientX, y0 = e.clientY, rr = this.winEl.getBoundingClientRect();
        let ghost = null, over = null;
        try { node.setPointerCapture(e.pointerId); } catch (_) {}
        const move = ev => {
          if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 5) {
            ghost = document.createElement('img');
            ghost.className = 'cps-ghost'; ghost.src = node.querySelector('img').src;
            const f = C.Icons.footprint(it.id);
            ghost.style.width = `calc(${f[0]} * var(--u))`; ghost.style.height = `calc(${f[1]} * var(--u))`;
            el.appendChild(ghost); el.classList.add('dragging');
            this.hideCard();
            for (const z of el.querySelectorAll('[data-drop]')) z.classList.toggle('can', !!(h.canDrop && h.canDrop(key, z.dataset.drop, it)));
          }
          if (!ghost) return;
          const gr = ghost.getBoundingClientRect();
          ghost.style.left = Math.round(ev.clientX - rr.left - gr.width / 2) + 'px'; ghost.style.top = Math.round(ev.clientY - rr.top - gr.height / 2) + 'px';
          const t = document.elementFromPoint(ev.clientX, ev.clientY), z = t && t.closest('[data-drop]');
          if (z !== over) { if (over) over.classList.remove('hot'); over = z; if (over && over.classList.contains('can')) over.classList.add('hot'); }
        };
        const up = ev => {
          node.removeEventListener('pointermove', move); node.removeEventListener('pointerup', up); node.removeEventListener('pointercancel', up);
          if (!ghost) return;
          ghost.remove(); el.classList.remove('dragging');
          for (const z of el.querySelectorAll('.can, .hot')) z.classList.remove('can', 'hot');
          if (ev.type === 'pointercancel') return;
          const t = document.elementFromPoint(ev.clientX, ev.clientY), z = t && t.closest('[data-drop]');
          if (z && h.canDrop && h.canDrop(key, z.dataset.drop, it)) h.drop(key, z.dataset.drop, it);
        };
        node.addEventListener('pointermove', move); node.addEventListener('pointerup', up); node.addEventListener('pointercancel', up);
      });
      el.addEventListener('dblclick', e => { const node = e.target.closest('[data-src]'); if (!node) return; const it = findIt(node.dataset.src); if (it && h.primary) h.primary(node.dataset.src, it); });
      el.addEventListener('contextmenu', e => {
        e.preventDefault();
        const node = e.target.closest('[data-src]'); if (!node || !h.menu) return;
        const it = findIt(node.dataset.src); if (!it) return;
        this.hideCard();
        this.openMenu(e, h.menu(node.dataset.src, it), k => h.run(k, node.dataset.src, it));
      });
      el.addEventListener('keydown', e => {
        const node = e.target.closest && e.target.closest('[data-src]'); if (!node) return;
        const it = findIt(node.dataset.src); if (!it) return;
        if (e.key === 'Enter' && h.primary) { e.preventDefault(); h.primary(node.dataset.src, it); }
        if ((e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) && h.menu) { e.preventDefault(); const r = node.getBoundingClientRect(); this.openMenu({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }, h.menu(node.dataset.src, it), k => h.run(k, node.dataset.src, it)); }
      });
      el.addEventListener('mouseover', e => { const node = e.target.closest('[data-src]'); if (!node || el.classList.contains('dragging') || this.winEl.querySelector(':scope > .cps-menu')) return; const it = findIt(node.dataset.src); if (it) this.showCard(node, h.view ? h.view(node.dataset.src, it) : it, h.cardExtra ? h.cardExtra(node.dataset.src, it) : ''); });
      el.addEventListener('focusin', e => { const node = e.target.closest && e.target.closest('[data-src]'); if (!node) return; const it = findIt(node.dataset.src); if (it) this.showCard(node, h.view ? h.view(node.dataset.src, it) : it, h.cardExtra ? h.cardExtra(node.dataset.src, it) : ''); });
      el.addEventListener('mouseout', e => { const node = e.target.closest('[data-src]'); if (node && !node.contains(e.relatedTarget)) this.hideCard(); });
      el.addEventListener('pointerdown', e => { if (!e.target.closest('.cps-menu')) this.closeMenu(); }, true);
    },

    screen(mode, html, cls) {
      this.U = this.cellU();
      const el = this.openPanel(mode, html, 'cps ' + cls);
      el.style.setProperty('--u', this.U + 'px');
      for (const [k, v] of Object.entries(C.Skin.vars())) this.winEl.style.setProperty(k, v);
      this.winEl.style.setProperty('--u', this.U + 'px');
      return el;
    },

    protectHTML() {
      const g = this.game, o = g.outfitStats(), fx = {};
      for (const a of g.beltArtifacts()) for (const [k, v] of Object.entries(D.ARTIFACTS[a.id].fx)) fx[k] = (fx[k] || 0) + v;
      const radArt = g.beltArtifacts().reduce((s, a) => s + D.ARTIFACTS[a.id].rad, 0);
      const left = PROTECT.map(([k, gl, n]) => `<div class="cps-prot" title="${n}"><img src="${C.Skin.glyphUrl(gl, 16, '#c8c0a0')}" alt=""><span>${n}</span><i><b style="width:${Math.round(clamp(o[k] || 0, 0, 1) * 100)}%"></b></i><em>${Math.round((o[k] || 0) * 100)}%</em></div>`).join('');
      const rows = [['carry', 'Переносимый вес', '+' + ((o.carry || 0)) + ' кг', (o.carry || 0) > 0], ['stamina', 'Выносливость', fx.stamina ? '+' + fx.stamina : '—', !!fx.stamina], ['regen', 'Заживление', fx.health ? '+' + fx.health : '—', !!fx.health], ['bleed', 'Остановка крови', fx.bleedHeal ? '+' + fx.bleedHeal : '—', !!fx.bleedHeal], ['rad', 'Фон артефактов', radArt ? (radArt > 0 ? '+' : '') + radArt.toFixed(2) : '—', radArt < 0]];
      const right = rows.map(([gl, n, v, on]) => `<div class="cps-prot fx ${on ? 'on' : ''}" title="${n}"><img src="${C.Skin.glyphUrl(gl, 16, on ? '#a8d878' : '#6a665a')}" alt=""><span>${n}</span><em>${v}</em></div>`).join('');
      return `<div class="cps-prots"><div>${left}</div><div>${right}</div></div>`;
    },

    equipHTML(opts = {}) {
      const g = this.game, p = g.player;
      const quick = p.quick.map((id, i) => {
        const n = id ? g.countItem(id) : 0;
        return `<div class="cps-q ${n ? '' : 'empty'}" data-drop="quick:${i}">${id ? `<div class="cps-it in-slot" data-src="quick:${i}:0" tabindex="0"><img src="${this.iconUrl(id)}" alt="${esc(D.ITEMS[id].name)}" draggable="false"></div><span class="cps-cnt">×${n}</span>` : ''}<b>F${i + 1}</b></div>`;
      }).join('');
      const beltN = g.beltSlots();
      let belt = '';
      for (let i = 0; i < 5; i++) {
        const u = p.belt[i], it = u ? g.item(u) : null;
        belt += i < beltN ? `<div class="cps-b" data-drop="belt">${it ? `<div class="cps-it in-slot" data-src="belt:${i}:${it.uid}" tabindex="0"><img src="${this.iconUrl(it.id)}" alt="${esc(D.ITEMS[it.id].name)}" draggable="false"></div>` : ''}</div>` : '<div class="cps-b locked" title="Контейнер недоступен: нужен костюм или апгрейд"></div>';
      }
      const ind = [['bleed', p.bleed > 0.05, '#e04030', 'Кровотечение'], ['rad', p.rad > 30, p.rad > 150 ? '#ff5020' : '#e0d040', 'Радиация ' + Math.round(p.rad)], ['hunger', p.food < 20, '#e0a040', 'Голод']].map(([gl, on, c, t]) => `<img class="${on ? 'on' : ''}" title="${t}" src="${C.Skin.glyphUrl(gl, 18, on ? c : '#4a4638')}" alt="">`).join('');
      return `<section class="cps-frame cps-equip">
        <div class="cps-slots">${this.slotHTML('pistol', g.slotItem('pistol'), 'tall')}<div class="cps-stack">${this.slotHTML('knife', g.slotItem('knife'), 'small')}${this.slotHTML('outfit', g.slotItem('outfit'), 'big')}${this.slotHTML('detector', g.slotItem('detector'), 'small')}</div>${this.slotHTML('rifle', g.slotItem('rifle'), 'tall')}</div>
        <div class="cps-quick">${quick}</div>
        <div class="cps-belt">${belt}</div>
        <div class="cps-hp"><i><b style="width:${Math.round(clamp(p.hp / 100, 0, 1) * 100)}%"></b></i><span>${Math.ceil(p.hp)}</span>${ind}</div>
        ${this.protectHTML()}
        ${opts.exit !== false ? `<button class="cps-exit" data-a="close">${esc(opts.exitLabel || 'Выход')}</button>` : ''}
      </section>`;
    },

    bagHTML(list, opts = {}) {
      const g = this.game, p = g.player, w = g.totalWeight(), mw = g.maxWeight();
      return `<section class="cps-frame cps-bag ${opts.cls || ''}">
        ${this.headHTML(opts.name || 'Дегтярёв', opts.sub || 'Вольный сталкер', opts.money != null ? opts.money : p.money, opts.look === undefined ? 'degtyarev' : opts.look)}
        <div class="cps-scroll">${this.gridHTML(list, 7, opts.src || 'bag', opts)}</div>
        <div class="cps-foot ${w > mw ? 'over' : ''}">${opts.foot != null ? opts.foot : `Общий вес: ${w.toFixed(1)} кг <small>(max ${mw.toFixed(1)} кг)</small>`}</div>
      </section>`;
    },

    bagItems() {
      const p = this.game.player, eq = new Set([...Object.values(p.slots), ...p.belt].filter(Boolean));
      return p.inv.filter(it => !eq.has(it.uid));
    },

    itemMenu(it) {
      const g = this.game, p = g.player, def = D.ITEMS[it.id];
      const eq = Object.values(p.slots).includes(it.uid), belt = p.belt.includes(it.uid), acts = [];
      if (def.type === 'consumable') { acts.push(['use', 'Использовать']); for (let i = 0; i < 4; i++) acts.push(['q' + i, `В быстрый слот F${i + 1}`]); }
      if (['weapon', 'outfit', 'detector'].includes(def.type)) acts.push(eq ? ['unequip', 'Снять'] : ['equip', 'Надеть']);
      if (def.type === 'artifact') acts.push(['equip', belt ? 'Снять с пояса' : 'Повесить на пояс', !belt && p.belt.length >= g.beltSlots()]);
      if (def.type === 'weapon' && it.mag > 0 && !D.WEAPONS[it.id].melee) acts.push(['unload', 'Разрядить']);
      if (it.id === 'skat2_log') acts.push(['read', 'Читать']);
      if (it.id === 'noah_letter') acts.push(['readnoah', 'Читать']);
      if (def.type !== 'quest') { acts.push(['drop', 'Выбросить']); if ((it.count || 1) > 1) acts.push(['drop1', 'Выбросить одну']); }
      return acts;
    },

    doItemAction(it, a) {
      const g = this.game, p = g.player;
      if (a === 'read') { this.showStory('Бортовой журнал «Скат-2»', C.QUEST_TEXT.SKAT2_LOG.map(esc), () => this.openInventory()); return; }
      if (a === 'readnoah') { this.showStory('Записка Ноя', ['«На Плато — через дрожащий воздух у Сгоревшего хутора. Наверху ходи по камням, где пух не вьётся. Электры бьют там, где трава выжжена кругом. Между ними — тропа. Ной.»'], () => this.openInventory()); return; }
      const m = this.act(() => {
        if (a === 'use') g.useConsumable(it.id);
        else if (a === 'equip') g.equip(it);
        else if (a === 'unequip') { for (const k in p.slots) if (p.slots[k] === it.uid) g.unequip(k); }
        else if (a === 'unload') g.unloadWeapon(it);
        else if (a === 'drop') g.dropItem(it);
        else if (a === 'drop1') g.dropItem(it, 1);
        else if (a[0] === 'q') p.quick[Number(a.slice(1))] = it.id;
      });
      this.openInventory();
      if (m) this.note(m.text, m.color);
    },

    primaryAction(it) {
      const p = this.game.player, def = D.ITEMS[it.id];
      if (Object.values(p.slots).includes(it.uid)) return 'unequip';
      if (def.type === 'consumable') return 'use';
      if (['weapon', 'outfit', 'detector', 'artifact'].includes(def.type)) return 'equip';
      if (it.id === 'skat2_log') return 'read';
      if (it.id === 'noah_letter') return 'readnoah';
      return null;
    },

    openInventory() {
      const g = this.game;
      if (!g) return;
      const el = this.screen('inventory', `<div class="cps-world" data-drop="ground"><span>Перетащите сюда, чтобы выбросить</span></div>${this.equipHTML()}${this.bagHTML(this.bagItems(), { minRows: 9 })}<div class="cps-note"></div>`, 'cps-inv');
      const slotOf = it => { const def = D.ITEMS[it.id]; return def.type === 'weapon' ? D.WEAPONS[it.id].slot : def.type === 'outfit' ? 'outfit' : def.type === 'detector' ? 'detector' : null; };
      this.bindItems(el, {
        item: (key, uid) => key.startsWith('quick:') ? (() => { const id = g.player.quick[Number(key.split(':')[1])]; return id ? (g.player.inv.find(i => i.id === id) || C.makeItem(id, 0)) : null; })() : g.item(uid),
        canDrop: (key, dst, it) => {
          const def = D.ITEMS[it.id], from = key.split(':')[0];
          if (dst === 'ground') return from !== 'quick' && def.type !== 'quest';
          if (dst === 'bag') return from === 'slot' || from === 'belt' || from === 'quick';
          if (dst.startsWith('slot:')) return from !== 'quick' && slotOf(it) === dst.slice(5) && !Object.values(g.player.slots).includes(it.uid);
          if (dst === 'belt') return from === 'bag' && def.type === 'artifact' && g.player.belt.length < g.beltSlots();
          if (dst.startsWith('quick:')) return def.type === 'consumable' && from !== 'quick';
          return false;
        },
        drop: (key, dst, it) => {
          const from = key.split(':')[0];
          if (from === 'quick' && dst === 'bag') { g.player.quick[Number(key.split(':')[1])] = null; return this.openInventory(); }
          if (dst === 'ground') return this.doItemAction(it, 'drop');
          if (dst === 'bag') return this.doItemAction(it, from === 'belt' ? 'equip' : 'unequip');
          if (dst.startsWith('quick:')) return this.doItemAction(it, 'q' + dst.slice(6));
          return this.doItemAction(it, 'equip');
        },
        primary: (key, it) => { if (key.startsWith('quick:')) return; const a = this.primaryAction(it); if (a) this.doItemAction(it, a); },
        menu: (key, it) => key.startsWith('quick:') ? [['clearq', 'Убрать из быстрого слота']] : this.itemMenu(it),
        run: (k, key, it) => { if (k === 'clearq') { g.player.quick[Number(key.split(':')[1])] = null; return this.openInventory(); } this.doItemAction(it, k); },
        cardExtra: (key, it) => { const a = key.startsWith('quick:') ? null : this.primaryAction(it); const n = { equip: 'надеть', unequip: 'снять', use: 'использовать', read: 'читать', readnoah: 'читать' }[a]; return `<div class="cps-hint">${n ? 'Двойной щелчок — ' + n + '. ' : ''}Правая кнопка — действия. Перетащите за край — выбросить.</div>`; }
      });
      el.addEventListener('click', e => { const a = e.target.closest('[data-a]'); if (a && a.dataset.a === 'close') this.closePanel(); });
    },

    tradeUnit(it, left) {
      const def = D.ITEMS[it.id];
      if (def.type === 'ammo') return Math.min(left, def.box);
      return STACK_TYPES.has(def.type) ? 1 : left;
    },

    openTrade(actor) {
      this.deal = { mine: new Map(), theirs: new Map() };
      this.renderTrade(actor);
    },

    renderTrade(actor, noteText, noteColor) {
      const g = this.game, tid = actor.trader, T = D.TRADERS[tid], stock = g.traderStock[tid], deal = this.deal;
      const mineList = this.bagItems();
      const left = (map, it) => (it.count || 1) - (map.get(it) || 0);
      const rest = (list, map) => list.filter(it => left(map, it) > 0).map(it => map.has(it) ? Object.assign({}, it, { count: left(map, it) }) : it);
      const offered = map => [...map].map(([it, n]) => Object.assign({}, it, { count: n }));
      const sideOf = key => key.startsWith('mine') || key.startsWith('mo') ? 'sell' : 'buy';
      const mapOf = key => sideOf(key) === 'sell' ? deal.mine : deal.theirs;
      const isOffer = key => key.startsWith('mo') || key.startsWith('to');
      const cost = (it, n, side) => g.price(g.dealUnit(it, n), side, tid);
      const unitOf = (key, it) => {
        const map = mapOf(key), n = isOffer(key) ? map.get(it) || 0 : left(map, it);
        return { n, one: this.tradeUnit(it, n) };
      };
      const findIt = (key, uid) => (sideOf(key) === 'sell' ? mineList : stock).find(s => s.uid === uid);
      const tag = (key, view) => {
        const it = findIt(key, view.uid), side = sideOf(key);
        if (!it || (side === 'sell' && !g.traderBuys(tid, it))) return '';
        const { n, one } = unitOf(key, it);
        return `<span class="cps-price ${side}">${C.formatMoney(cost(it, isOffer(key) ? n : one, side))}</span>`;
      };
      const v = g.dealValue(tid, [...deal.mine], [...deal.theirs]);
      const empty = !deal.mine.size && !deal.theirs.size;
      const after = g.player.money + v.balance;
      const buys = T.buys.map(t => ({ artifact: 'артефакты', part: 'части мутантов', weapon: 'оружие', outfit: 'костюмы', ammo: 'патроны', consumable: 'медицину и еду', detector: 'детекторы', grenade: 'гранаты' }[t])).join(', ');
      const offerHTML = (src, label, total, side, list, hint) => `<div class="cps-offer"><div class="cps-offer-h"><span>${label}</span><b class="${side}">${total ? C.formatMoney(total) : '—'}</b></div><div class="cps-scroll">${this.gridHTML(list, 7, src, { minRows: 3, hint, extra: it => tag(src, it) })}</div></div>`;
      const el = this.screen('trade', `<section class="cps-frame cps-bag mine">${this.headHTML('Дегтярёв', 'Вольный сталкер', g.player.money, 'degtyarev')}
          ${offerHTML('mo', 'Продаёте', v.sell, 'sell', offered(deal.mine), 'Перетащите сюда то, что продаёте')}
          <div class="cps-scroll">${this.gridHTML(rest(mineList, deal.mine), 7, 'mine', { minRows: 7, extra: it => tag('mine', it), dim: it => !g.traderBuys(tid, it) })}</div>
          <div class="cps-foot">Общий вес: ${g.totalWeight().toFixed(1)} кг <small>(max ${g.maxWeight().toFixed(1)} кг)</small></div></section>
        <section class="cps-frame cps-bag theirs">${this.headHTML(T.name, FACTION[actor.faction] || 'Торговец', null, this.lookFor(actor), `<small>Покупает: ${esc(buys)}</small>`)}
          ${offerHTML('to', 'Покупаете', v.buy, 'buy', offered(deal.theirs), 'Перетащите сюда то, что покупаете')}
          <div class="cps-scroll">${this.gridHTML(rest(stock, deal.theirs), 7, 'theirs', { minRows: 7, extra: it => tag('theirs', it) })}</div>
          <div class="cps-foot">Двойной щелчок — в сделку или обратно</div></section>
        <div class="cps-tradebar"><div class="cps-note"></div>
          <div class="cps-sum ${after < 0 ? 'bad' : ''}">${empty ? 'Соберите сделку: предметы из рюкзака и со склада торговца' : after < 0 ? `Не хватает <b>${C.formatMoney(-after)}</b>` : `После сделки: <b>${C.formatMoney(after)}</b> <small>(${v.balance >= 0 ? '+' : '−'}${C.formatMoney(Math.abs(v.balance))})</small>`}</div>
          <button class="cps-exit dim" data-a="reset" ${empty ? 'disabled' : ''}>Вернуть всё</button><button class="cps-exit" data-a="deal" ${v.ok ? '' : 'disabled'}>Торговать</button><button class="cps-exit dim" data-a="close">Выход</button></div>`, 'cps-trade cps-deal');
      if (noteText) this.note(noteText, noteColor);
      const move = (key, it, all) => {
        const map = mapOf(key), side = sideOf(key);
        if (!isOffer(key) && side === 'sell' && !g.traderBuys(tid, it)) return this.renderTrade(actor, `${T.name} такое не покупает.`, '#e0a060');
        const { n, one } = unitOf(key, it), k = all ? n : one;
        if (k <= 0) return;
        const now = (map.get(it) || 0) + (isOffer(key) ? -k : k);
        if (now > 0) map.set(it, now); else map.delete(it);
        this.audio.play('click');
        this.renderTrade(actor);
      };
      this.bindItems(el, {
        item: findIt,
        view: (key, it) => { const n = unitOf(key, it).n; return n === (it.count || 1) ? it : Object.assign({}, it, { count: n }); },
        canDrop: (key, dst, it) => {
          const from = key.split(':')[0];
          if (from === 'mine') return dst === 'mo' && g.traderBuys(tid, it);
          if (from === 'theirs') return dst === 'to';
          return (from === 'mo' && dst === 'mine') || (from === 'to' && dst === 'theirs');
        },
        drop: (key, dst, it) => move(key, it, true),
        primary: (key, it) => move(key, it, false),
        menu: (key, it) => {
          const side = sideOf(key), { n, one } = unitOf(key, it), stack = one < n;
          if (!isOffer(key) && side === 'sell' && !g.traderBuys(tid, it)) return [['none', 'Торговец не покупает', true]];
          const unitName = D.ITEMS[it.id].type === 'ammo' ? 'коробку' : 'одну';
          if (isOffer(key)) return stack ? [['one', `Убрать ${unitName}`], ['all', 'Убрать всё']] : [['all', 'Убрать из сделки']];
          const verb = side === 'sell' ? 'Продать' : 'Купить';
          return stack ? [['one', `${verb} ${unitName} — ${C.formatMoney(cost(it, one, side))}`], ['all', `${verb} всё (${n}) — ${C.formatMoney(cost(it, n, side))}`]] : [['all', `${verb} — ${C.formatMoney(cost(it, n, side))}`]];
        },
        run: (k, key, it) => { if (k !== 'none') move(key, it, k === 'all'); },
        cardExtra: (key, it) => {
          const side = sideOf(key), { n, one } = unitOf(key, it);
          if (side === 'sell' && !g.traderBuys(tid, it)) return '<div class="cps-hint bad">Этот торговец такое не покупает.</div>';
          if (isOffer(key)) return `<div class="cps-dealprice ${side}">В сделке${n > 1 ? ` ${n} шт.` : ''}: <b>${C.formatMoney(cost(it, n, side))}</b></div><div class="cps-hint">Двойной щелчок — убрать ${one < n ? (D.ITEMS[it.id].type === 'ammo' ? 'коробку' : 'одну') : 'из сделки'}.</div>`;
          const unit = one < n ? (D.ITEMS[it.id].type === 'ammo' ? ` за ${one} шт.` : ' за штуку') : '';
          return `<div class="cps-dealprice ${side}">${side === 'buy' ? 'Купить' : 'Продать'}${unit}: <b>${C.formatMoney(cost(it, one, side))}</b></div><div class="cps-hint">Двойной щелчок — в сделку. Правая кнопка — выбрать количество.</div>`;
        }
      });
      el.addEventListener('click', e => {
        const a = e.target.closest('[data-a]'); if (!a || a.disabled) return;
        if (a.dataset.a === 'close') return this.closePanel();
        if (a.dataset.a === 'reset') { this.deal = { mine: new Map(), theirs: new Map() }; return this.renderTrade(actor); }
        if (a.dataset.a === 'deal') {
          let r = null;
          const m = this.act(() => { r = g.executeDeal(tid, [...deal.mine], [...deal.theirs]); });
          if (!r) return this.renderTrade(actor, m ? m.text : 'Сделка не состоялась.', m ? m.color : '#e08060');
          this.deal = { mine: new Map(), theirs: new Map() };
          const parts = [r.sell && 'продано на ' + C.formatMoney(r.sell), r.buy && 'куплено на ' + C.formatMoney(r.buy)].filter(Boolean).join(', ');
          return this.renderTrade(actor, 'Сделка: ' + parts, '#a8d878');
        }
      });
    },

    openLoot(target, source, noteText, noteColor) {
      const g = this.game, items = source === 'stash' ? target.items : target.inv;
      const title = source === 'stash' ? target.name : (target.name || 'Труп');
      const takeMoney = () => { if (target.money) { g.player.money += target.money; g.msg('Взято ' + C.formatMoney(target.money), '#e0d080'); target.money = 0; } };
      const look = source === 'stash' ? 'stash' : this.lookFor(target);
      const sub = source === 'stash' ? 'Тайник' : (FACTION[target.faction] || 'Погибший') + ' · мёртв';
      const el = this.screen('loot', `${this.bagHTML(this.bagItems(), { minRows: 10, cls: 'mine' })}
        <section class="cps-frame cps-bag theirs">${this.headHTML(title, sub, target.money || null, look)}<div class="cps-scroll">${this.gridHTML(items, 7, 'loot', { minRows: 10, hint: 'Пусто. Перетащите сюда то, что хотите оставить' })}</div><div class="cps-foot">Двойной щелчок — взять или положить</div></section>
        <div class="cps-tradebar"><div class="cps-note"></div><button class="cps-exit" data-a="all" ${items.length || target.money ? '' : 'disabled'}>Взять всё</button><button class="cps-exit dim" data-a="close">Выход</button></div>`, 'cps-trade cps-loot');
      if (noteText) this.note(noteText, noteColor);
      const again = (text, color) => { if (this.mode === 'loot') this.openLoot(target, source, text, color); };
      const quest = it => D.ITEMS[it.id].type === 'quest';
      const take = it => {
        let ok = false;
        this.act(() => { ok = g.takeItem(items, it); takeMoney(); });
        if (ok) again('Взято: ' + this.itemLabel(it), '#d0d0b0');
      };
      const put = it => {
        if (quest(it)) return this.note('Сюжетный предмет лучше оставить при себе.', '#e0a060');
        let ok = false;
        this.act(() => { ok = g.storeItem(items, it); });
        if (!ok) return;
        if (source !== 'stash') target.keep = true;
        again('Оставлено: ' + this.itemLabel(it), '#d0d0b0');
      };
      this.bindItems(el, {
        item: (key, uid) => key.startsWith('loot') ? items.find(s => s.uid === uid) : g.item(uid),
        canDrop: (key, dst, it) => key.startsWith('loot') ? dst === 'bag' : dst === 'loot' && !quest(it),
        drop: (key, dst, it) => key.startsWith('loot') ? take(it) : put(it),
        primary: (key, it) => key.startsWith('loot') ? take(it) : put(it),
        menu: (key, it) => key.startsWith('loot') ? [['take', 'Взять']] : [['put', 'Положить', quest(it)]],
        run: (k, key, it) => k === 'take' ? take(it) : put(it),
        cardExtra: (key, it) => `<div class="cps-hint">${key.startsWith('loot') ? 'Двойной щелчок — взять.' : quest(it) ? 'Сюжетный предмет оставить нельзя.' : 'Двойной щелчок — положить ' + (source === 'stash' ? 'в тайник.' : 'к телу.')}</div>`
      });
      el.addEventListener('click', e => {
        const a = e.target.closest('[data-a]'); if (!a) return;
        if (a.dataset.a === 'close') { this.act(takeMoney); return this.closePanel(); }
        if (a.dataset.a === 'all') { this.act(() => { takeMoney(); for (const it of items.splice(0)) g.addInstance(it); g.sound2d('pickup'); }); return this.closePanel(); }
      });
    },

    openUpgrade(repairMode, selUid, upId) {
      const g = this.game, p = g.player;
      const can = it => ['weapon', 'outfit'].includes(D.ITEMS[it.id].type) && !(D.WEAPONS[it.id] && D.WEAPONS[it.id].melee);
      const cands = p.inv.filter(can);
      const sel = (selUid && g.item(selUid)) || g.slotItem('rifle') || cands[0] || null;
      const cardan = g.actors.find(a => a.named === 'cardan');
      let tree = '<div class="cps-empty">Нет снаряжения для работы. Принесите оружие или костюм.</div>', detail = '';
      if (sel) {
        const kind = D.ITEMS[sel.id].type === 'weapon' ? 'weapon' : 'outfit';
        const cols = [1, 2, 3].map(t => `<div class="cps-tier"><b>${['Базовые', 'Средние', 'Тонкие'][t - 1]}</b>${D.UPGRADES[kind].filter(u => u.tier === t).map(u => {
          const st = g.canUpgrade(sel, u);
          return `<button class="cps-up ${st} ${u.id === upId ? 'on' : ''}" data-up="${u.id}" title="${esc(u.name + ': ' + u.desc)}"><img src="${C.Skin.glyphUrl(UPG_GLYPH[u.id] || 'check', 28, st === 'installed' ? '#a8d878' : st === 'tools' ? '#5a5648' : '#d8cfa8')}" alt=""><span>${esc(u.name)}</span>${st === 'installed' ? `<img class="cps-up-mark" src="${C.Skin.glyphUrl('check', 14, '#a8d878')}" alt="установлено">` : st === 'tools' ? `<img class="cps-up-mark" src="${C.Skin.glyphUrl('lock', 14, '#8a8470')}" alt="нужны инструменты">` : ''}</button>`;
        }).join('')}</div>`).join('');
        tree = `<div class="cps-tree">${cols}</div>`;
        const u = upId ? D.UPGRADES[kind].find(q => q.id === upId) : null;
        if (u) {
          const st = g.canUpgrade(sel, u);
          const why = st === 'installed' ? 'Уже установлено.' : st === 'tools' ? `Нужны инструменты уровня ${u.tier}. Сейчас: ${g.upgradeTier}.` : st === 'money' ? `Не хватает ${C.formatMoney(u.price - p.money)}.` : '';
          detail = `<div class="cps-updetail"><b>${esc(u.name)}</b><span>${esc(u.desc)}</span>${why ? `<em>${esc(why)}</em>` : ''}<button class="cps-exit" data-a="install" ${st === 'ok' ? '' : 'disabled'}>Установить — ${C.formatMoney(u.price)}</button></div>`;
        } else detail = '<div class="cps-updetail muted">Выберите улучшение в схеме, чтобы увидеть цену и установить.</div>';
      }
      const rc = sel ? g.repairCost(sel) : 0;
      const selHTML = sel ? `<div class="cps-sel"><img src="${this.iconUrl(sel.id)}" style="--iw:${C.Icons.footprint(sel.id)[0]};--ih:${C.Icons.footprint(sel.id)[1]}" alt=""><div><b>${esc(D.ITEMS[sel.id].name)}</b><i class="cps-bar ${sel.cond < 0.5 ? 'low' : ''}"><b style="width:${Math.round(sel.cond * 100)}%"></b></i><span>Состояние ${Math.round(sel.cond * 100)}%</span><button class="cps-exit sm" data-a="repair" ${rc > 0 && p.money >= rc ? '' : 'disabled'}>${rc > 0 ? 'Ремонт — ' + C.formatMoney(rc) : 'Ремонт не нужен'}</button></div></div>` : '';
      const el = this.screen('upgrade', `<section class="cps-frame cps-tech">${this.headHTML('Кардан', 'Техник «Скадовска»', null, cardan ? cardan.look : 'cardan', `<small>Инструменты: ${g.upgradeTier} из 3</small>`)}${selHTML}${tree}${detail}</section>
        ${this.equipHTML({ exitLabel: 'Выход' })}${this.bagHTML(this.bagItems(), { minRows: 9, dim: it => !can(it) })}<div class="cps-note"></div>`, 'cps-inv cps-upg');
      this.bindItems(el, {
        canDrop: () => false,
        primary: (key, it) => { if (can(it)) this.openUpgrade(repairMode, it.uid); },
        menu: (key, it) => can(it) ? [['sel', 'Выбрать для работы']] : [],
        run: (k, key, it) => this.openUpgrade(repairMode, it.uid),
        cardExtra: (key, it) => can(it) ? '<div class="cps-hint">Щелчок — выбрать для ремонта и улучшений.</div>' : '<div class="cps-hint">Кардан с этим не работает.</div>'
      });
      el.addEventListener('click', e => {
        const node = e.target.closest('[data-src]');
        if (node && !e.target.closest('.cps-menu')) { const uid = Number(node.dataset.src.split(':').pop()), it = g.item(uid); if (it && can(it)) return this.openUpgrade(repairMode, uid); }
        const up = e.target.closest('[data-up]'); if (up) return this.openUpgrade(repairMode, sel && sel.uid, up.dataset.up);
        const a = e.target.closest('[data-a]'); if (!a) return;
        if (a.dataset.a === 'close') return this.closePanel();
        if (a.dataset.a === 'repair' && sel) { const m = this.act(() => g.repair(sel)); this.openUpgrade(repairMode, sel.uid, upId); this.note(m ? m.text : 'Отремонтировано: ' + D.ITEMS[sel.id].name, m ? m.color : '#a8d878'); return; }
        if (a.dataset.a === 'install' && sel && upId) { const kind = D.ITEMS[sel.id].type === 'weapon' ? 'weapon' : 'outfit'; const m = this.act(() => g.upgrade(sel, D.UPGRADES[kind].find(u => u.id === upId))); this.openUpgrade(repairMode, sel.uid, upId); if (m) this.note(m.text, m.color); }
      });
    },

    warmAssets() {
      const g = this.game;
      if (!g || this.warmed === g) return;
      this.warmed = g;
      for (const look of ['degtyarev', 'beard', 'owl', 'nimble', 'cardan', 'sultan', 'noah', 'zarya', 'loner', 'loner2', 'bandit', 'bandit2', 'lotsman', 'zveroboy', 'merc', 'tesak', 'military', 'zombie', ...C.Portraits.MUTANTS]) this.queueAsset({ look });
      this.iconQueue = [...new Set(g.player.inv.map(it => it.id).concat(...Object.values(g.traderStock).map(st => st.map(it => it.id)), Object.keys(D.ITEMS)))];
    },

    queueAsset(entry, front = false) {
      this.assetQueue = this.assetQueue || [];
      this.assetKeys = this.assetKeys || new Map();
      const key = entry.look ? 'p:' + entry.look : 'i:' + entry.id + '@' + entry.px;
      let e = this.assetKeys.get(key);
      if (!e) { e = { key, look: entry.look, id: entry.id, px: entry.px, ready: [] }; this.assetKeys.set(key, e); this.assetQueue.push(e); }
      if (entry.onReady) e.ready.push(entry.onReady);
      const i = front ? this.assetQueue.indexOf(e) : -1;
      if (i > 0) { this.assetQueue.splice(i, 1); this.assetQueue.unshift(e); }
    },

    queuePortrait(look, onReady, front = false) { if (look) this.queueAsset({ look: C.Portraits.has(look) ? look : 'loner', onReady }, front); },

    assetDone(e, img) {
      if (e.key) this.assetKeys.delete(e.key);
      if (img && e.look) { this.bank.cache.set('portrait|' + e.look, img); if (this.pdaRefresh) this.pdaRefresh(); }
      for (const f of e.ready || []) f();
    },

    pumpAssets(ms) {
      const t0 = performance.now();
      while (performance.now() - t0 < ms) {
        if (this.assetJob) {
          const img = this.assetJob.step(Math.max(0.5, ms - (performance.now() - t0)));
          if (!img) return;
          const e = this.assetJob.entry;
          this.assetJob = null;
          this.assetDone(e, img);
          continue;
        }
        let e = this.assetQueue && this.assetQueue.shift();
        if (!e) { const id = this.iconQueue && this.iconQueue.shift(); if (!id) return; e = { id, px: this.iconPx() }; }
        if (e.look ? this.bank.hasPortrait(e.look) : C.Icons.cached(e.id, e.px)) { this.assetDone(e, null); continue; }
        this.assetJob = Object.assign(e.look ? C.Portraits.job(e.look) : C.Icons.job(e.id, e.px), { entry: e });
      }
    },

    openDialog(actor) {
      const view = this.game.dialogOpen(actor);
      if (!view) return;
      this.talkLog = [{ who: 'npc', name: view.speaker, text: view.text }];
      this.talkActor = actor;
      this.renderDialog(view);
    },

    renderDialog(view) {
      const g = this.game, actor = this.talkActor || g.talkingTo;
      const log = this.talkLog || [{ who: 'npc', name: view.speaker, text: view.text }];
      const look = view.look || (actor && actor.look) || 'loner';
      const sub = actor ? (FACTION[actor.faction] || '') + (actor.trader ? ' · торговец' : '') : '';
      const el = this.screen('dialog', `<div class="cps-frame cps-talk">
        <div class="cps-talkhead">${this.faceHTML(look)}<div><b>${esc(view.speaker)}</b><span>${esc(sub)}</span></div></div>
        <div class="cps-log">${log.map(l => `<p class="${l.who}"><b>${esc(l.name)}</b>${esc(l.text).replace(/\n/g, '<br>')}</p>`).join('')}</div>
        <div class="cps-opts">${view.options.map((o, n) => `<button class="cp98-opt" data-i="${o.index}"><span>${n + 1}.</span> ${esc(o.text)}</button>`).join('')}</div>
      </div>`, 'cps-dialog');
      const lg = el.querySelector('.cps-log'); lg.scrollTop = lg.scrollHeight;
      el.addEventListener('click', e => {
        const b = e.target.closest('.cp98-opt'); if (!b) return;
        this.audio.play('click');
        const text = b.textContent.replace(/^\s*\d+\.\s*/, '');
        const r = g.dialogChoose(Number(b.dataset.i));
        this.processEvents(g);
        if (this.mode !== 'dialog') return;
        if (r.end) {
          if (r.action === 'trade') this.openTrade(r.actor);
          else if (r.action === 'upgrade') this.openUpgrade(false);
          else if (r.action === 'repair') this.openUpgrade(true);
          else this.closePanel();
          return;
        }
        this.talkLog = (this.talkLog || []).concat([{ who: 'me', name: 'Дегтярёв', text }, { who: 'npc', name: r.speaker, text: r.text }]).slice(-14);
        this.renderDialog(r);
      });
    }
  };

  Object.assign(C.UI.prototype, methods);
})(globalThis.Cop98 = globalThis.Cop98 || {});
