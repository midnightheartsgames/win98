(function (K) {
  'use strict';
  const U = K.UI.prototype;
  const esc = K.esc;
  const TABS = [['equip', 'Экипировка'], ['inv', 'Инвентарь'], ['char', 'Персонаж'], ['abil', 'Способности'], ['journal', 'Журнал'], ['map', 'Карта'], ['party', 'Отряд'], ['log', 'Сообщения'], ['system', 'Система']];
  const SLOT_NAMES = { r: 'Правая рука', l: 'Левая рука', body: 'Броня', acc: 'Аксессуар' };

  U.togglePanel = function (id) { if (this.panel === id) this.closePanel(); else this.openPanel(id); };

  U.openPanel = function (id, pid) {
    const g = this.game;
    if (g.mode !== 'play' && g.mode !== 'dialog') return;
    if (g.mode === 'dialog') return;
    if (!this.panel) { this.prevPause = g.paused; g.paused = true; }
    this.panel = id;
    if (pid) this.panelPid = pid;
    if (!this.panelPid || !g.roster[this.panelPid]) this.panelPid = g.leaderId;
    this.sfx('click');
    const tabs = TABS.map(([k, n]) => `<button class="kt-tab${k === id ? ' on' : ''}" data-t="${k}">${n}</button>`).join('');
    this.layer.innerHTML = `<div class="kt-panel"><div class="kt-tabs">${tabs}<button class="kt-close" title="Закрыть (Esc)">✕</button></div><div class="kt-pbody"></div></div>`;
    this.layer.querySelectorAll('.kt-tab').forEach(b => { b.onclick = () => this.openPanel(b.dataset.t); });
    this.layer.querySelector('.kt-close').onclick = () => this.closePanel();
    const body = this.layer.querySelector('.kt-pbody');
    const fn = { equip: this.pEquip, inv: this.pInv, char: this.pChar, abil: this.pAbil, journal: this.pJournal, map: this.pMap, party: this.pParty, log: this.pLog, system: this.pSystem }[id];
    fn.call(this, body);
  };

  U.closePanel = function (silent) {
    if (!this.panel) return;
    this.panel = null;
    this.levelChoice = null;
    this.game.paused = this.prevPause || false;
    if (this.game.mode === 'play') this.layer.innerHTML = '';
    if (!silent) this.sfx('click');
    this.partyKey = ''; this.actKey = '';
    this.root.focus({ preventScroll: true });
  };

  U.memberTabs = function (all) {
    const g = this.game;
    const ids = all ? Object.keys(g.roster) : g.active;
    return '<div class="kt-members">' + ids.map(id => `<button class="kt-mem${id === this.panelPid ? ' on' : ''}" data-pid="${id}"><canvas width="40" height="40"></canvas><span>${esc(g.roster[id].name)}</span></button>`).join('') + '</div>';
  };
  U.wireMembers = function (body, redraw) {
    const g = this.game;
    body.querySelectorAll('.kt-mem').forEach(b => {
      K.drawPortrait(b.querySelector('canvas'), g.roster[b.dataset.pid].model, 'party');
      b.onclick = () => { this.panelPid = b.dataset.pid; redraw(); };
    });
  };

  function statsBlock(c) {
    const D = K.describe(c);
    return `<div class="kt-stats">
<div><span>Здоровье</span><b>${Math.max(0, c.hp)}/${c.maxHp}</b></div>${c.maxFp ? `<div><span>Сила</span><b>${c.fp}/${c.maxFp}</b></div>` : ''}
<div><span>Защита</span><b>${D.def}</b></div><div><span>Атака</span><b>${K.fmtSigned(D.ab)}</b></div>
<div><span>Урон</span><b>${D.dmg[0]}–${D.dmg[1]}</b></div><div><span>Оружие</span><b>${esc(D.weapon)}</b></div>
<div><span>Стойкость</span><b>${K.fmtSigned(D.fort)}</b></div><div><span>Реакция</span><b>${K.fmtSigned(D.ref)}</b></div><div><span>Воля</span><b>${K.fmtSigned(D.will)}</b></div></div>`;
  }

  function itemDesc(it) {
    if (!it) return '';
    const p = [];
    if (it.k === 'w') {
      p.push((it.wt === 'ranged' ? 'Дальний бой' : 'Ближний бой') + ', урон ' + it.dmg[0] + 'd' + it.dmg[1] + (it.db ? '+' + it.db : '') + (it.ab ? ', атака +' + it.ab : '') + ', крит ' + ((it.cr || [20, 2])[0] < 20 ? (it.cr[0] + '–20') : '20') + '/×' + (it.cr || [20, 2])[1]);
      p.push({ energy: 'энергетический', kinetic: 'кинетический', ion: 'ионный' }[it.dt] || '');
      if (it.two) p.push('двуручное'); if (it.light) p.push('можно во вторую руку'); if (it.dbl) p.push('двойное');
    } else if (it.k === 'a') { p.push('Защита +' + it.def + ', макс. бонус Ловкости ' + it.maxDex + ', ' + ({ none: 'без навыка', light: 'лёгкая', medium: 'средняя', heavy: 'тяжёлая' }[it.prof])); }
    else if (it.k === 'x') p.push('Аксессуар');
    else if (it.k === 'c') p.push('Карта для колоды пазаака');
    else if (it.k === 'q') p.push('Сюжетный предмет');
    return esc(p.filter(Boolean).join(', ')) + (it.desc ? '<br><i>' + esc(it.desc) + '</i>' : '');
  }
  K.itemDesc = itemDesc;

  U.pEquip = function (body) {
    const g = this.game;
    const c = g.roster[this.panelPid] || g.leader;
    const draw = () => this.pEquip(body);
    const slots = ['r', 'l', 'body', 'acc'].map(s => {
      const id = c.equip[s];
      const it = id && K.ITEMS[id];
      return `<div class="kt-slot${this.eqSlot === s ? ' on' : ''}" data-s="${s}"><div class="sn">${SLOT_NAMES[s]}</div><div class="si">${it ? esc(it.n) : '<span class="dim">— пусто —</span>'}</div></div>`;
    }).join('');
    const slot = this.eqSlot || 'r';
    const cands = g.inv.filter(s => { const it = K.ITEMS[s.id]; return K.canEquip(c, it, slot).ok; });
    const list = cands.map(s => `<div class="kt-row" data-id="${s.id}"><b>${esc(K.ITEMS[s.id].n)}</b>${s.n > 1 ? ' ×' + s.n : ''}<div class="d">${itemDesc(K.ITEMS[s.id])}</div></div>`).join('') || '<div class="dim">Нет подходящих предметов.</div>';
    const cur = c.equip[slot] ? K.ITEMS[c.equip[slot]] : null;
    body.innerHTML = this.memberTabs(false) + `<div class="kt-cols"><div class="kt-col"><div class="kt-slots">${slots}</div>${statsBlock(c)}</div><div class="kt-col wide"><h3>${SLOT_NAMES[slot]}</h3>${cur ? `<div class="kt-cur"><b>${esc(cur.n)}</b><div class="d">${itemDesc(cur)}</div>${cur.nodrop ? '' : '<button class="kt-btn" data-un="1">Снять</button>'}</div>` : ''}<div class="kt-list">${list}</div></div></div>`;
    this.wireMembers(body, draw);
    body.querySelectorAll('.kt-slot').forEach(d => { d.onclick = () => { this.eqSlot = d.dataset.s; draw(); }; });
    body.querySelectorAll('.kt-row').forEach(d => { d.onclick = () => { if (g.equip(c, d.dataset.id, slot)) this.sfx('buy'); for (const e of g.drain()) this.onEvent(e); draw(); }; });
    const un = body.querySelector('[data-un]');
    if (un) un.onclick = () => { g.unequip(c, slot); draw(); };
  };

  U.pInv = function (body) {
    const g = this.game;
    const groups = [['w', 'Оружие'], ['a', 'Броня'], ['x', 'Аксессуары'], ['u', 'Расходуемое'], ['q', 'Сюжетные предметы'], ['c', 'Карты пазаака']];
    let h = `<div class="kt-credits">Кредиты: <b>${g.credits}</b></div><div class="kt-invlist">`;
    for (const [k, n] of groups) {
      const items = g.inv.filter(s => K.ITEMS[s.id].k === k);
      if (!items.length) continue;
      h += `<h3>${n}</h3>` + items.map(s => { const it = K.ITEMS[s.id]; return `<div class="kt-row"><b>${esc(it.n)}</b>${s.n > 1 ? ' ×' + s.n : ''}${it.k === 'u' && !it.use.grenade && !it.use.spike ? ` <button class="kt-btn sm" data-use="${s.id}">Использовать</button>` : ''}<div class="d">${itemDesc(it)}</div></div>`; }).join('');
    }
    body.innerHTML = h + '</div>';
    body.querySelectorAll('[data-use]').forEach(b => { b.onclick = () => { const L = g.leader; const id = b.dataset.use; const t = K.ITEMS[id].use.repair ? g.partyCreatures().find(c => c.droid) || L : L; g.useItemNow(L, id, t); for (const e of g.drain()) this.onEvent(e); this.pInv(body); }; });
  };

  U.pChar = function (body) {
    const g = this.game;
    const c = g.roster[this.panelPid] || g.leader;
    const draw = () => this.pChar(body);
    if (this.levelChoice && this.levelChoice.pid === c.pid) return this.pLevel(body, c);
    const cl = K.CLASSES[c.cls];
    const lvl = K.levelForXp(g.xp);
    const next = K.xpForLevel(Math.min(20, c.level + 1)), prev = K.xpForLevel(c.level);
    const attrs = K.ATTRS.map(([k, n]) => `<div><span>${n}</span><b>${K.attr(c, k)}</b><i>(${K.fmtSigned(K.attrMod(c, k))})</i></div>`).join('');
    const skills = K.SKILLS.map(([k, n]) => `<div><span>${n}</span><b>${K.skill(c, k)}</b></div>`).join('');
    const feats = c.feats.map(f => `<span class="kt-chip" title="${esc(K.FEATS[f].desc)}">${esc(K.FEATS[f].n)}</span>`).join('');
    const al = g.align;
    body.innerHTML = this.memberTabs(false) + `<div class="kt-cols"><div class="kt-col"><h2>${esc(c.name)}</h2><div class="dim">${cl.n}, уровень ${c.level}</div>
<div class="kt-xp"><div class="kt-bar xp"><i style="width:${Math.min(100, 100 * (g.xp - prev) / Math.max(1, next - prev))}%"></i></div><span>Опыт ${g.xp} / ${next}</span></div>
${g.pendingLevels(c) ? '<button class="kt-btn glow" data-lv="1">Повысить уровень ▲</button>' : ''}
${c.pid === 'player' ? `<div class="kt-align"><span>Тёмная сторона</span><div class="kt-bar al"><i style="left:${al}%"></i></div><span>Светлая сторона</span></div>` : ''}
<h3>Характеристики</h3><div class="kt-stats">${attrs}</div>${statsBlock(c)}</div>
<div class="kt-col"><h3>Навыки</h3><div class="kt-stats">${skills}</div><h3>Умения</h3><div>${feats || '<span class="dim">нет</span>'}</div>${c.powers.length ? '<h3>Силы</h3>' + c.powers.map(p => `<span class="kt-chip pow" title="${esc(K.POWERS[p].desc)}">${esc(K.POWERS[p].n)}</span>`).join('') : ''}</div></div>`;
    this.wireMembers(body, draw);
    const lv = body.querySelector('[data-lv]');
    if (lv) lv.onclick = () => { const info = K.levelUpInfo(c); this.levelChoice = { pid: c.pid, info, skills: {}, feats: [], attr: null }; draw(); };
    void lvl;
  };

  U.pLevel = function (body, c) {
    const g = this.game;
    const ch = this.levelChoice;
    const info = ch.info;
    const draw = () => this.pLevel(body, c);
    const spent = Object.entries(ch.skills).reduce((s, [k, n]) => s + n * K.skillCost(c, k), 0);
    const left = info.skillPoints - spent;
    const attrRow = info.attr ? '<h3>Характеристика +1</h3><div class="kt-pick">' + K.ATTRS.map(([k, n]) => `<button class="kt-btn${ch.attr === k ? ' on' : ''}" data-at="${k}">${n} ${c.attrs[k]}</button>`).join('') + '</div>' : '';
    const skills = K.SKILLS.map(([k, n]) => {
      const cur = (c.skills[k] || 0) + (ch.skills[k] || 0);
      const max = K.maxRank(c, k, info.level);
      return `<div class="kt-skl"><span>${n}${K.isClassSkill(c, k) ? '' : ' <i class="dim">(×2)</i>'}</span><button class="kt-btn sm" data-sk="${k}" data-d="-1">−</button><b>${cur}</b><button class="kt-btn sm" data-sk="${k}" data-d="1"${cur >= max || left < K.skillCost(c, k) ? ' disabled' : ''}>+</button><i class="dim">макс ${max}</i></div>`;
    }).join('');
    const avail = K.availableFeats(c);
    const feats = info.feats ? `<h3>Новые умения: ${ch.feats.length}/${info.feats}</h3><div class="kt-pick">` + avail.map(f => `<button class="kt-btn${ch.feats.includes(f) ? ' on' : ''}" data-ft="${f}" title="${esc(K.FEATS[f].desc)}">${esc(K.FEATS[f].n)}</button>`).join('') + '</div>' : '';
    body.innerHTML = `<div class="kt-level"><h2>${esc(c.name)}: уровень ${info.level}</h2>${attrRow}<h3>Очки навыков: ${left}</h3><div class="kt-skills">${skills}</div>${feats}<div class="kt-btnrow"><button class="kt-btn" data-auto="1">Автоматически</button><button class="kt-btn glow" data-ok="1">Готово</button><button class="kt-btn" data-cancel="1">Отмена</button></div></div>`;
    body.querySelectorAll('[data-at]').forEach(b => { b.onclick = () => { ch.attr = b.dataset.at; draw(); }; });
    body.querySelectorAll('[data-sk]').forEach(b => {
      b.onclick = () => {
        const k = b.dataset.sk, d = +b.dataset.d;
        const v = (ch.skills[k] || 0) + d;
        if (v < 0) return;
        if (d > 0 && ((c.skills[k] || 0) + v > K.maxRank(c, k, info.level) || left < K.skillCost(c, k))) return;
        ch.skills[k] = v;
        draw();
      };
    });
    body.querySelectorAll('[data-ft]').forEach(b => {
      b.onclick = () => {
        const f = b.dataset.ft;
        const i = ch.feats.indexOf(f);
        if (i >= 0) ch.feats.splice(i, 1); else if (ch.feats.length < info.feats) ch.feats.push(f);
        draw();
      };
    });
    body.querySelector('[data-auto]').onclick = () => { g.levelUp(c, K.autoLevelChoice(c)); for (const e of g.drain()) this.onEvent(e); this.levelChoice = null; this.partyKey = ''; this.pChar(body); };
    body.querySelector('[data-cancel]').onclick = () => { this.levelChoice = null; this.pChar(body); };
    body.querySelector('[data-ok]').onclick = () => {
      if (info.attr && !ch.attr) { this.toast('Выберите характеристику'); return; }
      g.levelUp(c, { attr: ch.attr, skills: ch.skills, feats: ch.feats });
      for (const e of g.drain()) this.onEvent(e);
      this.levelChoice = null;
      this.partyKey = '';
      this.pChar(body);
    };
  };

  U.pAbil = function (body) {
    const g = this.game;
    const c = g.roster[this.panelPid] || g.leader;
    const feats = c.feats.map(f => `<div class="kt-row"><b>${esc(K.FEATS[f].n)}</b> <span class="dim">${K.FEATS[f].type === 'passive' ? 'пассивное' : K.FEATS[f].type === 'melee' ? 'ближний бой' : 'дальний бой'}</span><div class="d">${esc(K.FEATS[f].desc)}</div></div>`).join('');
    const pows = c.powers.map(p => `<div class="kt-row"><b>${esc(K.POWERS[p].n)}</b> <span class="dim">${K.POWERS[p].fp} ОС</span><div class="d">${esc(K.POWERS[p].desc)}</div></div>`).join('');
    body.innerHTML = this.memberTabs(false) + `<div class="kt-cols"><div class="kt-col wide"><h3>Умения</h3>${feats}</div><div class="kt-col wide">${pows ? '<h3>Силы</h3>' + pows : '<h3>Силы</h3><div class="dim">Этот персонаж не владеет Силой.</div>'}<h3>Подсказки</h3><div class="d">Боевые умения выбираются на нижней панели, когда цель выделена. Каждое действие занимает раунд (${K.ROUND} с). Пауза (Пробел) позволяет отдать приказы всему отряду: выделите портрет, чтобы управлять спутником.</div></div></div>`;
    this.wireMembers(body, () => this.pAbil(body));
  };

  U.pJournal = function (body) {
    const g = this.game;
    const ids = Object.keys(g.quests).filter(id => K.QUESTS[id]);
    const active = ids.filter(id => !g.questDone(id)), done = ids.filter(id => g.questDone(id));
    if (!this.jSel || !g.quests[this.jSel]) this.jSel = active[0] || done[0];
    const li = (id, d) => `<div class="kt-q${id === this.jSel ? ' on' : ''}${d ? ' done' : ''}${K.QUESTS[id].main ? ' main' : ''}" data-q="${id}">${esc(K.QUESTS[id].n)}</div>`;
    const sel = this.jSel;
    const entries = sel ? g.journal.filter(j => j.q === sel).map(j => `<p>${esc(K.QUESTS[sel].s[j.s])}</p>`).reverse().join('') : '';
    body.innerHTML = `<div class="kt-cols"><div class="kt-col"><h3>Активные</h3>${active.map(id => li(id)).join('') || '<div class="dim">нет</div>'}<h3>Выполненные</h3>${done.map(id => li(id, true)).join('') || '<div class="dim">нет</div>'}</div><div class="kt-col wide kt-jtext">${sel ? '<h2>' + esc(K.QUESTS[sel].n) + '</h2>' + entries : ''}</div></div>`;
    body.querySelectorAll('.kt-q').forEach(d => { d.onclick = () => { this.jSel = d.dataset.q; this.pJournal(body); }; });
  };

  U.pMap = function (body) {
    const g = this.game, a = g.area;
    body.innerHTML = `<div class="kt-mapwrap"><canvas class="kt-bigmap"></canvas><div class="kt-legend"><h3>${esc(a.def.n)}</h3><div><i style="background:#ffffff"></i>Вы</div><div><i style="background:#60a0ff"></i>Отряд</div><div><i style="background:#ffe060"></i>Собеседники</div><div><i style="background:#40ffff"></i>Выходы</div><div><i style="background:#80e0ff"></i>Контейнеры</div><div><i style="background:#ff4040"></i>Враги</div><h3>Выходы</h3>${g.objects.filter(o => o.type === 'exit' && a.explored[o.tz * a.w + o.tx]).map(o => '<div>• ' + esc(o.n) + '</div>').join('')}</div></div>`;
    const cv = body.querySelector('canvas');
    const S = Math.floor(Math.min(620 / a.w, 440 / a.h));
    cv.width = a.w * S; cv.height = a.h * S;
    const x = cv.getContext('2d');
    x.fillStyle = '#05101a'; x.fillRect(0, 0, cv.width, cv.height);
    for (let z = 0; z < a.h; z++) for (let tx = 0; tx < a.w; tx++) {
      if (!a.explored[z * a.w + tx]) continue;
      const t = a.tiles[z * a.w + tx];
      if (t === ' ') continue;
      x.fillStyle = t === '#' ? '#3a7a8a' : t === 'x' ? '#40e0ff' : t === '+' ? '#80c0d0' : g.baseWalk(tx, z) ? '#12303c' : '#1e4450';
      x.fillRect(tx * S, z * S, S, S);
    }
    for (const o of g.objects) {
      if (o.type === 'trig' || o.type === 'mine' && !o.found || !a.explored[Math.floor(o.z) * a.w + Math.floor(o.x)]) continue;
      x.fillStyle = o.type === 'exit' ? '#40ffff' : o.type === 'mine' ? '#ff3030' : o.looted ? '#406070' : '#80e0ff';
      x.fillRect(o.x * S - S / 2, o.z * S - S / 2, S, S);
    }
    for (const c of g.creatures) {
      if (c.dead || !a.explored[Math.floor(c.z) * a.w + Math.floor(c.x)]) continue;
      if (c.faction === 'hostile' && !c.aggro) continue;
      x.fillStyle = c === g.leader ? '#ffffff' : c.faction === 'party' ? '#60a0ff' : c.faction === 'hostile' ? '#ff4040' : c.dlg ? '#ffe060' : '#8a8a60';
      x.beginPath(); x.arc(c.x * S, c.z * S, Math.max(2, S * 0.6), 0, Math.PI * 2); x.fill();
    }
  };

  U.pParty = function (body) {
    const g = this.game;
    const forced = (g.area.def.forceParty || []);
    if (!this.partySel) this.partySel = g.active.filter(id => id !== 'player');
    const sel = this.partySel;
    const cards = Object.keys(g.roster).filter(id => id !== 'player').map(id => {
      const c = g.roster[id];
      const on = sel.includes(id);
      return `<div class="kt-pcard${on ? ' on' : ''}${forced.includes(id) ? ' forced' : ''}" data-pid="${id}"><canvas width="72" height="72"></canvas><b>${esc(c.name)}</b><span>${K.CLASSES[c.cls].n}, ур. ${c.level}</span>${forced.includes(id) ? '<em>обязателен здесь</em>' : ''}</div>`;
    }).join('');
    body.innerHTML = `<div class="kt-partysel"><p>Выберите до двух спутников. Остальные ждут в квартире в Верхнем городе.${g.combat ? ' <b class="warn">Во время боя менять отряд нельзя.</b>' : ''}</p><div class="kt-pcards">${cards || '<div class="dim">Пока никто не присоединился.</div>'}</div><div class="kt-btnrow"><button class="kt-btn glow" data-ok="1"${g.combat ? ' disabled' : ''}>Принять</button></div></div>`;
    body.querySelectorAll('.kt-pcard').forEach(d => {
      K.drawPortrait(d.querySelector('canvas'), g.roster[d.dataset.pid].model, 'party');
      d.onclick = () => {
        const id = d.dataset.pid;
        if (forced.includes(id)) return;
        const i = sel.indexOf(id);
        if (i >= 0) sel.splice(i, 1); else { if (sel.length >= 2) sel.shift(); sel.push(id); }
        this.pParty(body);
      };
    });
    body.querySelector('[data-ok]').onclick = () => { if (g.setActive(sel)) { this.partySel = null; this.partyKey = ''; this.closePanel(); } };
  };

  U.pLog = function (body) {
    const g = this.game;
    body.innerHTML = '<div class="kt-fulllog">' + g.log.slice(-150).map(l => `<div style="color:${l.col}">${esc(l.text)}</div>`).join('') + '</div>';
    const el = body.querySelector('.kt-fulllog');
    el.scrollTop = el.scrollHeight;
  };

  U.pSystem = function (body) {
    const g = this.game;
    const saves = this.saves();
    const slots = ['1', '2', '3', '4', '5', 'quick'];
    const rows = slots.map(s => { const v = saves[s]; return `<div class="kt-saverow"><span class="sl">${s === 'quick' ? 'Быстрое' : 'Слот ' + s}</span><span class="sd">${v ? esc(v.label || '') + ' · ур. ' + v.level + ' · ' + new Date(v.t).toLocaleString('ru-RU') : '<i class="dim">пусто</i>'}</span>${s !== 'quick' ? `<button class="kt-btn sm" data-save="${s}">Сохранить</button>` : ''}<button class="kt-btn sm" data-load="${s}"${v ? '' : ' disabled'}>Загрузить</button></div>`; }).join('');
    const st = this.settings;
    body.innerHTML = `<div class="kt-cols"><div class="kt-col wide"><h3>Сохранения</h3>${rows}</div><div class="kt-col"><h3>Настройки</h3>
<label class="kt-chk"><input type="checkbox" data-set="autoPause"${g.settings.autoPause ? ' checked' : ''}> Пауза при появлении врага</label>
<label class="kt-chk"><input type="checkbox" data-set="autoFight"${g.settings.autoFight ? ' checked' : ''}> Лидер сам отвечает на атаки</label>
<label class="kt-chk"><input type="checkbox" data-snd="sound"${st.sound ? ' checked' : ''}> Звуки</label>
<label class="kt-chk"><input type="checkbox" data-snd="music"${st.music ? ' checked' : ''}> Музыка</label>
<div class="kt-diff">Сложность: ${[[0.7, 'Лёгкая'], [1, 'Нормальная'], [1.3, 'Сложная']].map(([v, n]) => `<button class="kt-btn sm${g.settings.difficulty === v ? ' on' : ''}" data-diff="${v}">${n}</button>`).join('')}</div>
<h3>Управление</h3><div class="d kt-help">ЛКМ — идти / атаковать / говорить / использовать<br>WASD — движение, Q/E или ПКМ — поворот камеры, колесо — зум<br>Пробел — пауза, Tab или 1–3 — сменить лидера<br>F — взаимодействие, H — аптечка, G — граната, R — отдых<br>U/I/C/K/J/M/P/L — панели, F5/F9 — быстрое сохранение/загрузка</div>
<div class="kt-btnrow"><button class="kt-btn" data-title="1">Выйти в главное меню</button></div></div></div>`;
    body.querySelectorAll('[data-save]').forEach(b => { b.onclick = () => { if (this.writeSave(b.dataset.save)) this.pSystem(body); }; });
    body.querySelectorAll('[data-load]').forEach(b => { b.onclick = () => this.loadSave(b.dataset.load); });
    body.querySelectorAll('[data-set]').forEach(b => { b.onchange = () => { g.settings[b.dataset.set] = b.checked; this.settings.game = Object.assign({}, g.settings); this.saveSettings(); }; });
    body.querySelectorAll('[data-snd]').forEach(b => { b.onchange = () => { this.settings[b.dataset.snd] = b.checked; this.saveSettings(); if (!this.settings.music) this.audio.musicGain && (this.audio.musicGain.gain.value = 0); else if (this.audio.musicGain) this.audio.musicGain.gain.value = 0.8; }; });
    body.querySelectorAll('[data-diff]').forEach(b => { b.onclick = () => { g.settings.difficulty = +b.dataset.diff; this.settings.game = Object.assign({}, g.settings); this.saveSettings(); this.pSystem(body); }; });
    body.querySelector('[data-title]').onclick = () => { this.closePanel(true); this.layer.innerHTML = ''; this.showTitle(); };
  };

  U.openShop = function () {
    const g = this.game, s = g.shop;
    if (!s) return;
    const render = () => {
      const stock = Object.entries(s.stock).filter(([, n]) => n !== 0).map(([id, n]) => { const it = K.ITEMS[id]; const p = g.buyPrice(id); return `<div class="kt-row" data-buy="${id}"><b>${esc(it.n)}</b> <span class="price${g.credits < p ? ' no' : ''}">${p} кр.</span>${n > 0 ? ' <i class="dim">(' + n + ')</i>' : ''}<div class="d">${K.itemDesc(it)}</div></div>`; }).join('');
      const mine = g.inv.filter(x => { const it = K.ITEMS[x.id]; return it.k !== 'q' && !it.nodrop; }).map(x => { const it = K.ITEMS[x.id]; return `<div class="kt-row" data-sell="${x.id}"><b>${esc(it.n)}</b>${x.n > 1 ? ' ×' + x.n : ''} <span class="price">${g.sellPrice(x.id)} кр.</span></div>`; }).join('');
      this.layer.innerHTML = `<div class="kt-panel kt-shop"><div class="kt-tabs"><span class="kt-ptitle">${esc(s.def.n)}</span><span class="kt-credits">Кредиты: <b>${g.credits}</b></span><button class="kt-close">✕</button></div><div class="kt-pbody"><div class="kt-cols"><div class="kt-col wide"><h3>Купить</h3><div class="kt-list">${stock}</div></div><div class="kt-col wide"><h3>Продать</h3><div class="kt-list">${mine || '<div class="dim">Нечего продать.</div>'}</div></div></div></div></div>`;
      this.layer.querySelector('.kt-close').onclick = () => { g.closeShop(); for (const e of g.drain()) this.onEvent(e); };
      this.layer.querySelectorAll('[data-buy]').forEach(d => { d.onclick = () => { g.buy(d.dataset.buy); for (const e of g.drain()) this.onEvent(e); render(); }; });
      this.layer.querySelectorAll('[data-sell]').forEach(d => { d.onclick = () => { g.sell(d.dataset.sell); for (const e of g.drain()) this.onEvent(e); render(); }; });
    };
    render();
  };

  U.openLoot = function () {
    const g = this.game, o = g.loot;
    if (!o) return;
    const render = () => {
      const items = o.items.map((it, i) => `<div class="kt-row" data-i="${i}"><b>${esc(K.ITEMS[it.id].n)}</b>${it.n > 1 ? ' ×' + it.n : ''}<div class="d">${K.itemDesc(K.ITEMS[it.id])}</div></div>`).join('');
      this.layer.innerHTML = `<div class="kt-panel kt-loot"><div class="kt-tabs"><span class="kt-ptitle">${esc(o.n || 'Контейнер')}</span><button class="kt-close">✕</button></div><div class="kt-pbody">${o.cr ? `<div class="kt-row" data-cr="1"><b>Кредиты: ${o.cr}</b></div>` : ''}${items || (o.cr ? '' : '<div class="dim">Пусто.</div>')}<div class="kt-btnrow"><button class="kt-btn glow" data-all="1">Взять всё (Пробел)</button><button class="kt-btn" data-x="1">Закрыть (Esc)</button></div></div></div>`;
      const close = () => { g.closeLoot(); for (const e of g.drain()) this.onEvent(e); };
      this.layer.querySelector('.kt-close').onclick = close;
      this.layer.querySelector('[data-x]').onclick = close;
      this.layer.querySelector('[data-all]').onclick = () => { g.takeLoot(); this.sfx('buy'); close(); };
      this.layer.querySelectorAll('[data-i]').forEach(d => { d.onclick = () => { g.takeLoot(+d.dataset.i); this.sfx('click'); if (!o.items.length && !o.cr) close(); else render(); }; });
      const cr = this.layer.querySelector('[data-cr]');
      if (cr) cr.onclick = () => { g.takeCredits(); if (!o.items.length) close(); else render(); };
    };
    render();
  };
})(globalThis.Kotor98 = globalThis.Kotor98 || {});
