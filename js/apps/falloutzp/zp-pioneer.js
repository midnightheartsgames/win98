(function (Z) {
  'use strict';

  const U = Z.UI.prototype;
  const esc = s => Z.esc(s);
  const TABS = [
    { id: 'stat', name: 'СТАТ', sub: [['status', 'Состояние'], ['gto', 'ГТО'], ['skills', 'Навыки'], ['perks', 'Перки'], ['general', 'Общее']] },
    { id: 'items', name: 'ВЕЩИ', sub: [['weapon', 'Оружие'], ['apparel', 'Одежда'], ['aid', 'Помощь'], ['misc', 'Прочее'], ['ammo', 'Патроны']] },
    { id: 'data', name: 'ДАННЫЕ', sub: [['map', 'Карта'], ['quests', 'Задания'], ['notes', 'Записи'], ['radio', 'Радио']] }
  ];

  Z.drawMascot = (g, W, H, a, opts = {}) => {
    const cx = W / 2, top = H * 0.1, s = Math.min(a ? W / 4.4 : W / 3, H / 5.4);
    const col = '#ffb642', dim = 'rgba(255,182,66,0.4)';
    g.lineWidth = Math.max(2, s * 0.06);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.shadowColor = 'rgba(255,150,30,0.8)'; g.shadowBlur = 6;
    const limb = (part, pts) => {
      const crip = a && a.crippled[part];
      g.strokeStyle = crip ? '#ff6a40' : col;
      g.setLineDash(crip ? [s * 0.12, s * 0.1] : []);
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.stroke();
      g.setLineDash([]);
    };
    const hy = top + s * 0.55;
    g.strokeStyle = a && a.crippled.head ? '#ff6a40' : col;
    g.beginPath(); g.arc(cx, hy, s * 0.48, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(cx - s * 0.5, hy - s * 0.18); g.quadraticCurveTo(cx, hy - s * 0.85, cx + s * 0.5, hy - s * 0.18); g.lineTo(cx - s * 0.5, hy - s * 0.18); g.stroke();
    g.beginPath(); g.arc(cx - s * 0.17, hy + s * 0.02, s * 0.05, 0, Math.PI * 2); g.arc(cx + s * 0.17, hy + s * 0.02, s * 0.05, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(cx, hy + s * 0.12, s * 0.22, 0.2, Math.PI - 0.2); g.stroke();
    if (opts.wink) { g.beginPath(); g.moveTo(cx + s * 0.08, hy); g.lineTo(cx + s * 0.26, hy); g.stroke(); }
    const sh = hy + s * 0.75, hip = sh + s * 1.35;
    g.strokeStyle = a && a.crippled.torso ? '#ff6a40' : col;
    g.beginPath(); g.moveTo(cx - s * 0.42, sh); g.lineTo(cx + s * 0.42, sh); g.lineTo(cx + s * 0.34, hip); g.lineTo(cx - s * 0.34, hip); g.closePath(); g.stroke();
    g.fillStyle = '#ff6a40';
    g.beginPath(); g.moveTo(cx - s * 0.2, sh); g.lineTo(cx + s * 0.2, sh); g.lineTo(cx + s * 0.04, sh + s * 0.25); g.lineTo(cx + s * 0.12, sh + s * 0.6); g.lineTo(cx, sh + s * 0.32); g.lineTo(cx - s * 0.12, sh + s * 0.6); g.lineTo(cx - s * 0.04, sh + s * 0.25); g.closePath(); g.fill();
    limb('larm', [[cx - s * 0.42, sh + s * 0.05], [cx - s * 0.85, sh + s * 0.55], [cx - s * 0.95, sh + s * 1.15]]);
    limb('rarm', [[cx + s * 0.42, sh + s * 0.05], [cx + s * 0.85, sh - s * 0.3], [cx + s * 0.75, sh - s * 0.85]]);
    g.strokeStyle = col;
    g.beginPath(); g.arc(cx + s * 0.72, sh - s * 0.95, s * 0.12, 0, Math.PI * 2); g.stroke();
    limb('lleg', [[cx - s * 0.2, hip], [cx - s * 0.32, hip + s * 0.9], [cx - s * 0.36, hip + s * 1.7], [cx - s * 0.6, hip + s * 1.75]]);
    limb('rleg', [[cx + s * 0.2, hip], [cx + s * 0.32, hip + s * 0.9], [cx + s * 0.36, hip + s * 1.7], [cx + s * 0.6, hip + s * 1.75]]);
    g.shadowBlur = 0;
    if (a) {
      const fs = Z.clamp(Math.round(s * 0.16), 10, 13);
      g.font = 'bold ' + fs + "px 'Courier New', monospace";
      const bw = Z.clamp((W - s * 2.3) / 2 - 10, 40, 110), bh = Math.max(5, Math.round(s * 0.09));
      const bar = (x, y, part, label, align) => {
        const v = Z.clamp(a.limbs[part] / a.limbMax(part), 0, 1), crip = a.crippled[part];
        x = Z.clamp(x, 4, W - bw - 4);
        g.fillStyle = crip ? '#ff6a40' : 'rgba(255,182,66,0.7)';
        g.textAlign = align === 'r' ? 'right' : 'left';
        g.fillText(label, align === 'r' ? x + bw : x, y - 4);
        g.strokeStyle = dim; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, bw, bh);
        g.fillStyle = crip ? '#ff6a40' : col; g.fillRect(x + 1.5, y + 1.5, Math.max(0, (bw - 2) * v), bh - 2);
      };
      const lx = cx - s * 1.15 - bw, rx = cx + s * 1.15;
      bar(cx - bw / 2, Math.max(fs + 6, top - s * 0.32), 'head', 'Голова', 'l');
      bar(lx, sh + s * 0.5, 'larm', 'Л. рука', 'r');
      bar(rx, sh - s * 0.55, 'rarm', 'П. рука', 'l');
      bar(lx, hip + s * 1.15, 'lleg', 'Л. нога', 'r');
      bar(rx, hip + s * 1.15, 'rleg', 'П. нога', 'l');
      bar(rx, sh + s * 0.55, 'torso', 'Торс', 'l');
      g.textAlign = 'left';
    }
  };

  Z.mapImage = map => {
    if (map._amber) return map._amber;
    const mpp = 4, W = Math.round((map.x1 - map.x0) / mpp), H = Math.round((map.z1 - map.z0) / mpp);
    const cv = Z.mkCanvas(W, H), g = cv.getContext('2d'), img = g.createImageData(W, H), d = img.data;
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const x = map.x0 + (px + 0.5) * mpp, z = map.z0 + (py + 0.5) * mpp;
      const h = map.groundH(x, z);
      const i = (py * W + px) * 4;
      let v;
      if (h < 0) v = 18 + Math.max(0, 10 + h * 2);
      else {
        const n = map.normal(x, z);
        const shade = Z.clamp(0.55 + (n[0] * -0.6 + n[2] * -0.6) * 1.8, 0.2, 1.2);
        const k = map.coverAt(x, z);
        v = (40 + Math.min(40, h * 1.4)) * shade + (k === Z.COVER.wood ? -8 : 0) + (map.roadMask[map.cellIndex(x, z)] === 1 ? 50 : 0);
      }
      d[i] = Math.min(255, v * 1.0); d[i + 1] = Math.min(255, v * 0.68); d[i + 2] = Math.min(255, v * 0.22); d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    map._amber = { cv, mpp, W, H };
    return map._amber;
  };

  U.openPioneer = function (tab, sub) {
    const g = this.game, p = g.player;
    const wrap = document.createElement('div');
    wrap.className = 'zp-pio';
    wrap.innerHTML = '<div class="zp-pio-case"><div class="side"><div class="lamp"></div><div class="brand">ЭЛЕКТРОНИКА</div><div class="knob"></div></div><div class="zp-pio-screen zp-crt"><div class="zp-pio-tabs"></div><div class="zp-pio-sub"></div><div class="zp-pio-body"></div><div class="zp-pio-foot"></div></div><div class="side"><div class="knob"></div><div class="brand">ПИОНЕР-77</div><div class="lamp"></div></div><div class="plate">«ПИОНЕР-77» · ЗАВОД «РАДИОПРИБОР» · ЗАПОРОЖЬЕ</div></div>';
    wrap.addEventListener('mousedown', e => e.stopPropagation());
    wrap.addEventListener('wheel', e => e.stopPropagation());
    const panel = { el: wrap };
    const st = this.pioState = this.pioState || { tab: 'stat', sub: { stat: 'status', items: 'weapon', data: 'map' }, sel: 0, mapZoom: 1, mapPan: null };
    if (tab) st.tab = tab;
    if (sub) st.sub[st.tab] = sub;
    const body = wrap.querySelector('.zp-pio-body');
    const render = () => {
      const T = TABS.find(t => t.id === st.tab);
      wrap.querySelector('.zp-pio-tabs').innerHTML = TABS.map(t => '<span data-t="' + t.id + '" class="' + (t.id === st.tab ? 'on' : '') + '">' + t.name + '</span>').join('') + '<span style="margin-left:auto" class="dim">' + Z.fmtTime(g.time) + ' ' + Z.dateStr(g.time) + '</span>';
      wrap.querySelector('.zp-pio-sub').innerHTML = T.sub.map(([id, nm]) => '<span data-s="' + id + '" class="' + (id === st.sub[st.tab] ? 'on' : '') + '">' + nm + '</span>').join('');
      wrap.querySelectorAll('.zp-pio-tabs span[data-t]').forEach(s => s.addEventListener('click', () => { st.tab = s.dataset.t; st.sel = 0; render(); }));
      wrap.querySelectorAll('.zp-pio-sub span').forEach(s => s.addEventListener('click', () => { st.sub[st.tab] = s.dataset.s; st.sel = 0; render(); }));
      const lvl = p.sheet.level;
      wrap.querySelector('.zp-pio-foot').innerHTML = '<span>ОЗ ' + Math.ceil(p.hp) + '/' + p.hpMax + '</span><span>УР ' + lvl + '</span><span>ОД ' + Math.floor(p.ap) + '/' + p.sheet.maxAP() + '</span><span>ВЕС ' + p.weight() + '/' + p.sheet.carry() + '</span><span>РАД ' + Math.round(p.rads) + '</span><span>ТАЛОНЫ ' + p.count('talon') + '</span>';
      const s = st.sub[st.tab];
      body.innerHTML = '';
      body.className = 'zp-pio-body';
      this['pio_' + s] ? this['pio_' + s](body, st, render) : null;
    };
    panel.key = e => {
      const T = TABS.find(t => t.id === st.tab);
      const subs = T.sub.map(x => x[0]);
      const si = subs.indexOf(st.sub[st.tab]);
      if (e.code === 'Tab' || e.code === 'Escape') { this.closePanel(panel); return true; }
      if (e.code === 'KeyQ' || e.code === 'PageUp') { const i = TABS.indexOf(T); st.tab = TABS[(i + TABS.length - 1) % TABS.length].id; st.sel = 0; render(); return true; }
      if (e.code === 'KeyE' && !st.listKeys || e.code === 'PageDown') { const i = TABS.indexOf(T); st.tab = TABS[(i + 1) % TABS.length].id; st.sel = 0; render(); return true; }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { st.sub[st.tab] = subs[(si + subs.length - 1) % subs.length]; st.sel = 0; render(); return true; }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { st.sub[st.tab] = subs[(si + 1) % subs.length]; st.sel = 0; render(); return true; }
      if (panel.listKey && panel.listKey(e)) return true;
      return false;
    };
    st.render = render;
    this.pioPanel = panel;
    render();
    this.openPanel(panel);
  };

  U.pioList = function (body, st, rows, detail, actions, render) {
    body.innerHTML = '<div class="lst scroll"></div><div class="det"></div>';
    const lst = body.querySelector('.lst'), det = body.querySelector('.det');
    st.sel = Z.clamp(st.sel, 0, Math.max(0, rows.length - 1));
    const draw = () => {
      lst.innerHTML = rows.map((r, i) => '<div class="row' + (i === st.sel ? ' sel' : '') + (r.eq ? ' eq' : '') + '" data-i="' + i + '"><span class="nm' + (r.dim ? ' dim' : '') + '">' + r.html + '</span>' + (r.num !== undefined ? '<span class="num">' + r.num + '</span>' : '') + '</div>').join('') || '<div class="dim" style="padding:6px">Пусто</div>';
      lst.querySelectorAll('.row').forEach(el => {
        el.addEventListener('mouseenter', () => { st.sel = +el.dataset.i; mark(); });
        el.addEventListener('click', () => { st.sel = +el.dataset.i; if (actions && actions.enter) { actions.enter(rows[st.sel]); render(); } });
      });
      mark();
    };
    const mark = () => {
      lst.querySelectorAll('.row').forEach((el, i) => el.classList.toggle('sel', i === st.sel));
      det.innerHTML = rows[st.sel] ? detail(rows[st.sel]) : '';
      const s = lst.querySelector('.row.sel');
      if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest' });
    };
    this.pioPanel.listKey = e => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { st.sel = Math.max(0, st.sel - 1); mark(); return true; }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { st.sel = Math.min(rows.length - 1, st.sel + 1); mark(); return true; }
      if (e.code === 'Enter' && actions && actions.enter && rows[st.sel]) { actions.enter(rows[st.sel]); render(); return true; }
      if (actions && actions.keys && rows[st.sel]) { const r = actions.keys(e, rows[st.sel]); if (r) { render(); return true; } }
      return false;
    };
    draw();
  };

  U.pio_status = function (body, st, render) {
    const g = this.game, p = g.player;
    body.innerHTML = '<div class="lst" style="display:flex;flex-direction:column"><canvas style="width:100%;flex:1"></canvas></div><div class="det"></div>';
    const cv = body.querySelector('canvas');
    requestAnimationFrame(() => {
      const r = cv.getBoundingClientRect();
      cv.width = Math.max(10, Math.round(r.width)); cv.height = Math.max(10, Math.round(r.height));
      Z.drawMascot(cv.getContext('2d'), cv.width, cv.height, p);
    });
    const eff = p.effects.map(e => '<div>' + esc(Z.item(e.src) ? Z.item(e.src).name : e.src.startsWith('mag_') ? 'Журнал: ' + Z.skillName(e.src.slice(4)) : e.src) + ' <span class="dim">' + Math.ceil(e.t) + ' с</span></div>').join('');
    const crip = Object.keys(p.crippled).map(l => Z.LIMB_NAMES[l]).join(', ');
    const radLv = p.rads >= 800 ? 'крайне тяжёлая' : p.rads >= 600 ? 'тяжёлая' : p.rads >= 400 ? 'средняя' : p.rads >= 200 ? 'лёгкая' : 'нет';
    body.querySelector('.det').innerHTML = '<div class="bars"><span>Здоровье</span><span>' + Math.ceil(p.hp) + ' / ' + p.hpMax + '<div class="meter"><i style="width:' + Math.round(p.hp / p.hpMax * 100) + '%"></i></div></span>' +
      '<span>Радиация</span><span>' + Math.round(p.rads) + ' (' + radLv + ')<div class="meter"><i style="width:' + Math.round(p.rads / 10) + '%"></i></div></span>' +
      (g.hardcore && g.needs ? '<span>Жажда</span><span>' + Math.round(g.needs.h2o / 10) + '%</span><span>Голод</span><span>' + Math.round(g.needs.fod / 10) + '%</span><span>Усталость</span><span>' + Math.round(g.needs.slp / 10) + '%</span>' : '') +
      '<span>Порог урона</span><span>' + Math.round(p.dt()) + '</span><span>Сопр. радиации</span><span>' + p.sheet.radRes() + '%</span></div>' +
      '<div style="margin-top:10px">Увечья: ' + (crip ? '<span class="red">' + esc(crip) + '</span>' : 'нет') + '</div>' +
      '<div style="margin-top:10px">Эффекты:</div>' + (eff || '<div class="dim">нет</div>') +
      (p.addict && Object.keys(p.addict).length ? '<div style="margin-top:6px" class="red">Привыкание: ' + Object.keys(p.addict).map(k => esc(Z.item(k).name)).join(', ') + '</div>' : '') +
      '<div style="margin-top:12px" class="dim">Осталось очков навыков: ' + (p.sheet.pendingSkill || 0) + ', перков: ' + (p.sheet.pendingPerk || 0) + '</div>' +
      ((p.sheet.pendingSkill || p.sheet.pendingPerk) ? '<div style="margin-top:6px"><span class="btn" data-k="lvl">Распределить</span></div>' : '');
    const b = body.querySelector('[data-k=lvl]');
    if (b) b.addEventListener('click', () => { if (this.openLevelUp) this.openLevelUp(); });
  };

  U.pio_gto = function (body, st, render) {
    const p = this.game.player;
    this.pioList(body, st, Z.STATS.map(s => ({ html: esc(s.name), num: p.sheet.stat(s.id), s })), r => '<h2>' + esc(r.s.name) + ' ' + p.sheet.stat(r.s.id) + '</h2><div>' + esc(r.s.desc) + '</div>' + (p.sheet.stat(r.s.id) !== p.sheet.stats[r.s.id] ? '<div class="dim" style="margin-top:8px">Базовое значение: ' + p.sheet.stats[r.s.id] + '</div>' : ''), null, render);
  };

  U.pio_skills = function (body, st, render) {
    const p = this.game.player;
    this.pioList(body, st, Z.SKILLS.map(s => ({ html: esc(s.name) + (p.sheet.tags.includes(s.id) ? ' <span class="dim">●</span>' : ''), num: p.sheet.skill(s.id), s })), r => '<h2>' + esc(r.s.name) + ' ' + p.sheet.skill(r.s.id) + '</h2><div>' + esc(r.s.desc) + '</div><div class="dim" style="margin-top:8px">Зависит от: ' + Z.statName(r.s.stat) + (p.sheet.tags.includes(r.s.id) ? '. Отмеченный навык (+15).' : '') + '</div>', null, render);
  };

  U.pio_perks = function (body, st, render) {
    const p = this.game.player;
    const rows = p.sheet.traits.map(t => { const d = Z.TRAITS.find(x => x.id === t); return { html: esc(d.name) + ' <span class="dim">(черта)</span>', d }; })
      .concat(Object.keys(p.sheet.perks).map(k => { const d = Z.perkDef(k) || Z.COMPANION_PERKS && Z.COMPANION_PERKS[k] || { name: k, desc: '' }; return { html: esc(d.name) + (p.sheet.perks[k] > 1 ? ' ' + p.sheet.perks[k] : ''), d }; }));
    this.pioList(body, st, rows, r => '<h2>' + esc(r.d.name) + '</h2><div>' + esc(r.d.desc) + '</div>', null, render);
  };

  U.pio_general = function (body, st, render) {
    const g = this.game, p = g.player;
    const k = Z.karmaTitle(g.karma);
    const reps = Z.FACTIONS.filter(f => { const r = g.rep[f.id]; return r.fame || r.inf || g.flags['met_' + f.id]; });
    body.innerHTML = '<div class="lst scroll"><div class="row"><span class="nm">Уровень</span><span class="num">' + p.sheet.level + '</span></div><div class="row"><span class="nm">Опыт</span><span class="num" style="width:120px">' + p.sheet.xp + ' / ' + Z.xpFor(p.sheet.level + 1) + '</span></div><div class="row"><span class="nm">Карма</span><span class="num" style="width:220px">' + esc(k) + '</span></div><div style="margin-top:10px">Репутация:</div>' + (reps.map(f => '<div class="row"><span class="nm">' + esc(f.name) + '</span><span class="num" style="width:150px">' + esc(g.repLevel(f.id).name) + '</span></div>').join('') || '<div class="dim">Пока вас никто не знает.</div>') + '</div><div class="det"><canvas style="width:100%;height:100%"></canvas></div>';
    const cv = body.querySelector('canvas');
    requestAnimationFrame(() => { const r = cv.getBoundingClientRect(); cv.width = Math.max(10, Math.round(r.width)); cv.height = Math.max(10, Math.round(r.height)); Z.drawMascot(cv.getContext('2d'), cv.width, cv.height, null, { wink: g.karma > 250 }); });
  };

  U.pioItems = function (body, st, render, cat) {
    const g = this.game, p = g.player;
    const list = Z.sortInv(p.inv.filter(e => { const d = Z.item(e.id); return d && (cat === 'misc' ? (d.cat === 'misc' || d.cat === 'book') && !d.currency : d.cat === cat); }));
    const eqd = e => Object.values(p.equip).includes(e);
    const rows = list.map(e => {
      const d = Z.item(e.id);
      const hk = Object.entries(p.hotkeys || {}).find(([k, v]) => v === e.id);
      return { html: Z.iconHTML(e.id, 22) + esc(Z.itemLabel(e)) + (hk ? ' <span class="dim">[' + hk[0] + ']</span>' : ''), num: cat === 'weapon' ? (d.dmg ? Math.round(d.dmg * (d.pellets || 1)) : '') : cat === 'apparel' ? d.dt : d.w || 0, e, eq: eqd(e) };
    });
    const verb = cat === 'weapon' || cat === 'apparel' ? 'надеть или снять' : cat === 'ammo' ? '' : 'использовать';
    body.classList.add('items');
    this.pioList(body, st, rows, r => Z.itemCard(r.e, g, { keys: (verb ? 'Enter — ' + verb + ' · ' : '') + (Z.item(r.e.id).durab || cat === 'apparel' ? 'R — ремонт · ' : '') + 'X — выбросить · 1–8 — быстрый слот' }), {
      enter: r => {
        const d = Z.item(r.e.id);
        if (d.cat === 'weapon') { if (p.equip.weapon === r.e) p.equip.weapon = null; else p.equipEntry(r.e); }
        else if (d.cat === 'apparel') { if (p.equip[d.slot] === r.e) p.unequip(d.slot); else { if (d.power && !g.flags.powerTraining) g.msg('Без курса подготовки «Богатырь» в броне почти невозможно двигаться.', 'warn'); p.equipEntry(r.e); } if (this.onLookChange) this.onLookChange(); }
        else if (d.cat === 'aid' || d.cat === 'book') g.useItem(r.e);
        else if (d.note) g.readNote(d.note);
        if (this.audio) this.audio.uiSound('click');
      },
      keys: (e, r) => {
        if (e.code === 'KeyX') { if (eqd(r.e)) { const d = Z.item(r.e.id); if (d.cat === 'weapon') p.equip.weapon = null; else p.unequip(d.slot); } if (r.e.n > 1) this.askQty('Выбросить', r.e.n, n => { g.dropItem(r.e, n); st.render(); }); else g.dropItem(r.e, 1); return true; }
        if (e.code === 'KeyR') { this.repairWith(r.e); return true; }
        const m = /^Digit([1-8])$/.exec(e.code);
        if (m) { p.hotkeys = p.hotkeys || {}; for (const k in p.hotkeys) if (p.hotkeys[k] === r.e.id) delete p.hotkeys[k]; p.hotkeys[m[1]] = r.e.id; return true; }
        return false;
      }
    }, render);
  };

  U.repairWith = function (e) {
    const g = this.game, p = g.player, d = Z.item(e.id);
    if (!d.durab && d.cat !== 'apparel') return;
    if (e.cond >= 0.999) { g.msg('Вещь в отличном состоянии.', 'info'); return; }
    const same = p.inv.filter(x => x !== e && (x.id === e.id || (p.sheet.has('kulibin') && Z.item(x.id).cat === d.cat && Z.item(x.id).wtype === d.wtype)) && !Object.values(p.equip).includes(x));
    const kit = p.find('repairkit');
    const maxC = Z.clamp(0.3 + p.sheet.skill('repair') / 100 * 0.7, 0.3, 1);
    if (same.length) {
      const o = same.sort((a, b) => (a.cond || 0) - (b.cond || 0))[0];
      e.cond = Math.min(maxC, e.cond + (o.cond || 0.3) * (0.4 + p.sheet.skill('repair') / 200));
      p.removeEntry(o);
      g.msg('Отремонтировано за счёт: ' + Z.item(o.id).name + '. Состояние ' + Math.round(e.cond * 100) + '%.', 'info');
    } else if (kit && d.cat === 'weapon') {
      e.cond = Math.min(1, e.cond + 0.25 + p.sheet.skill('repair') / 400);
      p.take('repairkit', 1);
      g.msg('Использован ремкомплект. Состояние ' + Math.round(e.cond * 100) + '%.', 'info');
    } else g.msg('Нечем ремонтировать: нужна такая же вещь или ремкомплект.', 'warn');
    g.ev.emit('repair', {});
  };

  U.pio_weapon = function (b, s, r) { this.pioItems(b, s, r, 'weapon'); };
  U.pio_apparel = function (b, s, r) { this.pioItems(b, s, r, 'apparel'); };
  U.pio_aid = function (b, s, r) { this.pioItems(b, s, r, 'aid'); };
  U.pio_misc = function (b, s, r) { this.pioItems(b, s, r, 'misc'); };
  U.pio_ammo = function (b, s, r) { this.pioItems(b, s, r, 'ammo'); };

  U.pio_map = function (body, st, render) {
    const g = this.game, map = this.map, p = g.player;
    body.innerHTML = '<div class="det" style="flex:1;position:relative;overflow:hidden"><canvas class="map"></canvas><div class="dim" style="position:absolute;left:6px;bottom:4px;font-size:11px">Колесо — масштаб, перетаскивание — сдвиг, клик по отметке — быстрое перемещение</div></div>';
    const cv = body.querySelector('canvas');
    const img = Z.mapImage(map);
    const locs = (g.locations || []).filter(l => l.found || g.flags['found_' + l.id]);
    if (!st.mapPan) { const px = g.cell.exterior ? p.x : (g.lastExt ? g.lastExt[0] : 0), pz = g.cell.exterior ? p.z : (g.lastExt ? g.lastExt[1] : 0); st.mapPan = [px, pz]; st.mapZoom = 1.6; }
    let hover = null, drag = null;
    const draw = () => {
      const r = cv.getBoundingClientRect();
      cv.width = Math.max(10, Math.round(r.width)); cv.height = Math.max(10, Math.round(r.height));
      const c = cv.getContext('2d'), W = cv.width, H = cv.height;
      const scale = st.mapZoom / img.mpp;
      const toS = (x, z) => [W / 2 + (x - st.mapPan[0]) * scale, H / 2 + (z - st.mapPan[1]) * scale];
      c.fillStyle = '#0d0702'; c.fillRect(0, 0, W, H);
      const [ox, oz] = toS(map.x0, map.z0);
      c.imageSmoothingEnabled = true;
      c.drawImage(img.cv, ox, oz, img.W * img.mpp * scale, img.H * img.mpp * scale);
      c.strokeStyle = 'rgba(255,182,66,0.12)'; c.lineWidth = 1;
      for (let x = Math.ceil(map.x0 / 250) * 250; x < map.x1; x += 250) { const a = toS(x, map.z0), b = toS(x, map.z1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
      for (let z = Math.ceil(map.z0 / 250) * 250; z < map.z1; z += 250) { const a = toS(map.x0, z), b = toS(map.x1, z); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
      c.font = "bold 12px 'Courier New', monospace";
      for (const l of locs) {
        const [sx, sy] = toS(l.x, l.z);
        c.fillStyle = l === hover ? '#ffffff' : '#ffb642';
        c.beginPath(); c.moveTo(sx, sy - 6); c.lineTo(sx + 6, sy); c.lineTo(sx, sy + 6); c.lineTo(sx - 6, sy); c.closePath(); c.fill();
        if (st.mapZoom > 1.2 || l === hover) { c.fillStyle = '#ffb642'; c.fillText(l.name, sx + 9, sy + 4); }
      }
      for (const qm of (g.questMarkers ? g.questMarkers() : [])) {
        if (qm.cell && qm.cell !== 'ext') continue;
        const [sx, sy] = toS(qm.x, qm.z);
        c.fillStyle = '#ff7a3a'; c.beginPath(); c.moveTo(sx, sy + 8); c.lineTo(sx - 6, sy - 4); c.lineTo(sx + 6, sy - 4); c.closePath(); c.fill();
      }
      const px = g.cell.exterior ? p.x : (g.lastExt ? g.lastExt[0] : p.x), pz = g.cell.exterior ? p.z : (g.lastExt ? g.lastExt[1] : p.z);
      const [ax, ay] = toS(px, pz);
      c.save(); c.translate(ax, ay); c.rotate(p.yaw); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(0, -9); c.lineTo(6, 7); c.lineTo(0, 3); c.lineTo(-6, 7); c.closePath(); c.fill(); c.restore();
      cv._toS = toS;
    };
    const pick = (mx, my) => {
      if (!cv._toS) return null;
      let best = null, bd = 12;
      for (const l of locs) { const [sx, sy] = cv._toS(l.x, l.z); const d = Math.hypot(sx - mx, sy - my); if (d < bd) { bd = d; best = l; } }
      return best;
    };
    cv.addEventListener('wheel', e => { st.mapZoom = Z.clamp(st.mapZoom * (e.deltaY > 0 ? 0.85 : 1.18), 0.35, 6); draw(); e.preventDefault(); });
    cv.addEventListener('mousedown', e => { drag = { x: e.clientX, y: e.clientY, pan: st.mapPan.slice(), moved: false }; });
    cv.addEventListener('mousemove', e => {
      const r = cv.getBoundingClientRect();
      if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 3) drag.moved = true; const sc = st.mapZoom / img.mpp; st.mapPan = [drag.pan[0] - dx / sc, drag.pan[1] - dy / sc]; draw(); return; }
      const h = pick(e.clientX - r.left, e.clientY - r.top);
      if (h !== hover) { hover = h; draw(); }
    });
    cv.addEventListener('mouseup', e => {
      const r = cv.getBoundingClientRect();
      const wasDrag = drag && drag.moved;
      drag = null;
      if (wasDrag) return;
      const l = pick(e.clientX - r.left, e.clientY - r.top);
      if (l && this.fastTravel) this.fastTravel(l);
    });
    requestAnimationFrame(draw);
    this.pioPanel.listKey = e => {
      if (e.code === 'Equal' || e.code === 'NumpadAdd') { st.mapZoom = Math.min(6, st.mapZoom * 1.2); draw(); return true; }
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') { st.mapZoom = Math.max(0.35, st.mapZoom / 1.2); draw(); return true; }
      return false;
    };
  };

  U.pio_quests = function (body, st, render) {
    const g = this.game;
    const qs = g.questList ? g.questList() : [];
    this.pioList(body, st, qs.map(q => ({ html: esc(q.title) + (q.tracked ? ' <span class="dim">◄</span>' : ''), dim: q.done, q })), r => {
      const q = r.q;
      return '<h2>' + esc(q.title) + '</h2>' + (q.objectives || []).map(o => '<div class="' + (o.done ? 'dim' : '') + '">' + (o.done ? '☑ ' : '☐ ') + esc(o.text) + '</div>').join('') + '<div style="margin-top:10px" class="dim">' + esc(q.desc || '') + '</div>' + (q.done ? '' : '<div style="margin-top:10px" class="dim">Enter — отслеживать на компасе</div>');
    }, { enter: r => { if (g.trackQuest) g.trackQuest(r.q.id); } }, render);
  };

  U.pio_notes = function (body, st, render) {
    const g = this.game;
    const ns = (g.notes || []).map(id => ({ id, n: Z.NOTES[id] })).filter(x => x.n);
    this.pioList(body, st, ns.map(x => ({ html: esc(x.n.title), x })), r => '<h2>' + esc(r.x.n.title) + '</h2><div style="white-space:pre-wrap">' + esc(r.x.n.text) + '</div>', null, render);
  };

  U.pio_radio = function (body, st, render) {
    const stations = Z.RADIO_STATIONS || [];
    const cur = this.audio ? this.audio.station : null;
    this.pioList(body, st, stations.map(s => ({ html: esc(s.name), eq: cur === s.id, s })).concat([{ html: 'Выключить', off: true }]), r => r.s ? '<h2>' + esc(r.s.name) + '</h2><div>' + esc(r.s.desc || '') + '</div>' : '<div>Радио выключено.</div>', { enter: r => { if (this.audio) this.audio.setStation(r.off ? null : r.s.id); } }, render);
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
