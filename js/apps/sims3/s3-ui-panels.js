(function (S) {
  'use strict';
  const { esc, iconSVG, NEEDS, SKILLS, SKILL_KEYS, SKILL_XP, CAREERS, PART_TIME, WORK_TONES, REWARDS, LTW, TRAITS, OPPORTUNITIES, COLLECT, PLANTS, FISH, BOOKS, RECIPES, SKILL_CHALLENGES, TODDLER_SKILLS } = S;
  const G = S.UI.prototype;

  const PAINT_STYLES = ['Натюрморт', 'Пейзаж', 'Абстракция', 'Портрет'];
  function barCls(v) { return v >= 30 ? '' : v >= 0 ? ' y' : v >= -50 ? ' o' : ' r'; }
  function pct(v) { return Math.round((v + 100) / 2); }

  G.renderTab = function (sim, force) {
    const el = this.el.tabc;
    const g = this.game;
    const now = performance.now();
    if (this.tab === 'needs') {
      const sig = 'needs' + sim.id;
      if (this.tabSig !== sig) {
        this.tabSig = sig;
        el.innerHTML = '<div class="s3-needs">' + NEEDS.map(n => '<div data-n="' + n.k + '"><div class="nm">' + iconSVG(n.icon, 12) + esc(n.name) + '</div><div class="s3-bar"><i></i></div></div>').join('') + '</div>';
        for (const d of el.querySelectorAll('[data-n]')) this.tipOn(d, () => { const v = sim.needs[d.dataset.n]; return '<b>' + esc(NEEDS.find(n => n.k === d.dataset.n).name) + ': ' + pct(v) + '%</b>' + (v < -30 ? '<div class="neg">Срочно нужно этим заняться!</div>' : v < 20 ? 'Скоро понадобится.' : 'Всё в порядке.'); });
      }
      for (const d of el.querySelectorAll('[data-n]')) { const v = sim.needs[d.dataset.n]; const b = d.querySelector('.s3-bar'); b.className = 's3-bar' + barCls(v); b.firstChild.style.width = pct(v) + '%'; }
      return;
    }
    const sig = this.tab + ':' + sim.id;
    if (!force && this.tabSig === sig && now - (this.tabT || 0) < 1000) return;
    if (this.tabSig === sig && !force && el.matches(':hover') && this.tab !== 'career') return;
    this.tabSig = sig; this.tabT = now;
    const f = this['tab_' + this.tab];
    if (f) f.call(this, el, sim, g);
  };

  G.tab_rel = function (el, sim, g) {
    const list = [];
    for (const [k, r] of g.rels) {
      if (!r.met) continue;
      const ids = k.split(':').map(Number);
      if (!ids.includes(sim.id)) continue;
      const o = g.sims.get(ids[0] === sim.id ? ids[1] : ids[0]);
      if (!o || o.svc) continue;
      list.push({ o, r, fam: g.familyLabel(sim, o) || r.flags.married });
    }
    list.sort((a, b) => (b.fam ? 1 : 0) - (a.fam ? 1 : 0) || b.r.v - a.r.v);
    if (!list.length) { el.innerHTML = '<div class="s3-sub" style="padding:8px">' + esc(sim.first) + ' пока ни с кем не знаком' + S.genderize(sim, '', 'а') + '. Поговорите с соседями!</div>'; return; }
    el.innerHTML = '<div class="s3-list"></div>';
    const box = el.firstChild;
    for (const { o, r } of list.slice(0, 40)) {
      const row = document.createElement('div');
      row.className = 's3-row';
      const v = r.v;
      row.innerHTML = '<div class="mini"><img src="' + this.stage.portrait(o, 64) + '"></div><div class="grow"><div class="nm">' + esc(o.name) + (o.dead ? ' †' : '') + '</div><div class="lb">' + esc(g.relLabel(sim, o)) + '</div></div><div style="width:86px"><div class="s3-bar' + (v < 0 ? ' r' : v < 35 ? ' y' : '') + '"><i style="width:' + Math.abs(v) + '%"></i></div></div>';
      row.onclick = () => { if (!o.hidden) { this.centerOnSim(o); this.follow = false; } };
      this.tipOn(row, () => {
        const known = (r.known && r.known[sim.id]) || [];
        return '<b>' + esc(o.name) + '</b>' + esc(S.AGE_INFO[o.age].name) + ', ' + esc(g.relLabel(sim, o).toLowerCase()) + '<div class="' + (v >= 0 ? 'val' : 'neg') + '">Отношения: ' + Math.round(v) + '</div>' + (known.length ? '<div>Черты: ' + known.map(t => esc(TRAITS[t].name)).join(', ') + '</div>' : '<div>Черты пока неизвестны. Поговорите поближе.</div>') + (o.job ? '<div>Работа: ' + esc(g.jobTitle(o)) + '</div>' : '');
      });
      box.appendChild(row);
    }
  };

  G.tab_career = function (el, sim, g) {
    let html = '';
    if (sim.job) {
      const jd = g.jobDef(sim), L = g.jobLevel(sim);
      const next = g.nextLevelDef(sim);
      const days = jd.days.map((v, i) => v ? S.DAY_SHORT[i] : null).filter(Boolean).join(' ');
      html += '<div style="display:flex;gap:8px;align-items:center">' + iconSVG(jd.icon, 26) + '<div><div class="s3-title">' + esc(L.t) + '</div><div class="s3-sub">' + esc(jd.name) + (jd.branchAt && sim.job.branch ? ' · ' + esc(jd.branches[sim.job.branch].name) : '') + ', уровень ' + sim.job.lvl + '</div></div></div>';
      html += '<div style="margin:4px 0" class="s3-sub">' + S.fmtMoney(L.pay) + ' в час · ' + days + ' · ' + L.start + ':00–' + ((L.start + L.hours) % 24) + ':00</div>';
      html += '<div style="display:grid;grid-template-columns:90px 1fr;gap:3px 6px;align-items:center"><span>Успехи:</span><div class="s3-bar' + (sim.job.perf < 0 ? ' r' : sim.job.perf < 40 ? ' y' : '') + '"><i style="width:' + pct(sim.job.perf) + '%"></i></div><span>Начальник:</span><div class="s3-bar blue"><i style="width:' + pct(sim.job.boss || 0) + '%"></i></div></div>';
      if (next) html += '<div style="margin-top:4px">Для повышения: ' + (Object.keys(next.req).length ? Object.keys(next.req).map(k => '<span style="color:' + (sim.skillLevel(k) >= next.req[k] ? '#2a8a2a' : '#b0302a') + ';font-weight:bold">' + esc(SKILLS[k].name) + ' ' + next.req[k] + '</span>').join(', ') : 'хорошее настроение') + '</div>';
      if (sim.inside && sim.insideWhat === 'Работа') {
        html += '<div style="margin-top:5px;font-weight:bold">Как работать:</div><div class="s3-traits" data-tones>';
        for (const [k, t] of Object.entries(WORK_TONES)) html += '<button class="s3-pill' + ((sim.job.tone || 'normal') === k ? ' on' : '') + '" data-tone="' + k + '">' + esc(k === 'skill' && jd.tone ? jd.tone.name : t.name) + '</button>';
        html += '</div>';
      }
      html += '<div style="margin-top:6px;display:flex;gap:6px"><button class="s3-pill" data-quit>Уволиться</button></div>';
    } else if (sim.school) {
      const gr = g.gradeOf(sim);
      html += '<div style="display:flex;gap:8px;align-items:center">' + iconSVG('m_book', 26) + '<div><div class="s3-title">' + (sim.isTeen ? 'Старшая школа' : 'Начальная школа') + '</div><div class="s3-sub">Уроки по будням с 8:00. Оценка: <b>' + gr + '</b></div></div></div>';
      html += '<div style="display:grid;grid-template-columns:90px 1fr;gap:3px 6px;align-items:center;margin-top:6px"><span>Успеваемость:</span><div class="s3-bar' + (sim.school.perf < -20 ? ' r' : sim.school.perf < 20 ? ' y' : '') + '"><i style="width:' + pct(sim.school.perf) + '%"></i></div></div>';
      const hw = sim.inv.find(i => i.k === 'homework');
      html += '<div style="margin-top:5px">' + (hw ? 'Домашнее задание: сделано ' + Math.round((hw.p || 0) * 100) + '%. Щёлкните по симу и выберите «Сделать уроки».' : 'Домашних заданий нет.') + '</div>';
      if (sim.isTeen && !sim.job) html += '<div style="margin-top:6px"><button class="s3-pill" data-jobs>Найти подработку</button></div>';
      if (sim.isTeen && sim.job) html += '';
    } else {
      html += '<div class="s3-sub" style="padding:6px;line-height:1.4">' + (S.ageIdx(sim.age) >= 3 ? esc(sim.first) + ' сейчас без работы. Работу можно найти в газете, на компьютере или прямо у здания на карте города.' : 'Работа пока рано. Сначала нужно подрасти.') + '</div>';
      if (S.ageIdx(sim.age) >= 3) html += '<button class="s3-pill" data-jobs>Найти работу</button>';
    }
    el.innerHTML = html;
    const q = el.querySelector('[data-quit]');
    if (q) q.onclick = () => this.confirm('Уволиться?', sim.first + ' потеряет текущую должность и всю карьеру. Продолжить?', () => { g.quitJob(sim); this.refreshHud(true); });
    const j = el.querySelector('[data-jobs]');
    if (j) j.onclick = () => this.jobsDialog(sim);
    for (const b of el.querySelectorAll('[data-tone]')) b.onclick = () => { sim.job.tone = b.dataset.tone; this.tabSig = ''; this.refreshHud(true); };
  };

  G.tab_skills = function (el, sim, g) {
    if (sim.isToddler) {
      el.innerHTML = '<div class="s3-list">' + Object.entries(TODDLER_SKILLS).map(([k, t]) => '<div class="s3-skill">' + iconSVG(t.icon, 16) + '<b>' + esc(t.name) + '</b><div class="s3-bar"><i style="width:' + Math.round((sim.tskills[k] || 0) * 100) + '%"></i></div></div>').join('') + '</div><div class="s3-sub" style="margin-top:4px">Взрослые могут учить малыша ходить и говорить.</div>';
      return;
    }
    const known = SKILL_KEYS.filter(k => sim.knowsSkill(k));
    if (!known.length) { el.innerHTML = '<div class="s3-sub" style="padding:6px;line-height:1.4">Навыков пока нет. Читайте книги, тренируйтесь, готовьте, рисуйте: навыки растут от практики.</div>'; return; }
    el.innerHTML = '<div class="s3-list"></div>';
    for (const k of known) {
      const L = sim.skillLevel(k), p = sim.skillProgress(k);
      const row = document.createElement('div');
      row.className = 's3-skill';
      let pips = '';
      for (let i = 0; i < 10; i++) pips += i < L ? '<i class="f"></i>' : i === L ? '<i class="p" style="--p:' + Math.round(p * 100) + '%"></i>' : '<i></i>';
      row.innerHTML = iconSVG(SKILLS[k].icon, 16) + '<b>' + esc(SKILLS[k].name) + '</b><div class="s3-pips">' + pips + '</div>';
      row.onclick = () => this.skillJournal(sim, k);
      this.tipOn(row, '<b>' + esc(SKILLS[k].name) + ': уровень ' + L + '</b>' + esc(SKILLS[k].desc) + '<div>Щёлкните, чтобы открыть журнал навыка.</div>');
      el.firstChild.appendChild(row);
    }
  };

  G.skillJournal = function (sim, k) {
    const sk = SKILLS[k], L = sim.skillLevel(k), ch = SKILL_CHALLENGES[k];
    let html = '<div style="display:flex;gap:10px;align-items:center">' + iconSVG(sk.icon, 34) + '<div><div class="s3-title">' + esc(sk.name) + ': уровень ' + L + ' из 10</div><div class="s3-sub">' + esc(sk.desc) + '</div></div></div>';
    html += '<h4 style="margin:10px 0 4px">Что открывается</h4><div class="s3-list">' + Object.entries(sk.unlock).map(([lv, t]) => '<div class="s3-row"><b style="width:26px;color:' + (L >= +lv ? '#2a8a2a' : '#8aa0b8') + '">' + lv + '</b><span style="color:' + (L >= +lv ? '#173a6b' : '#8aa0b8') + '">' + esc(t) + '</span></div>').join('') + '</div>';
    if (ch) { const v = sim.stats[ch.stat] || 0; html += '<h4 style="margin:10px 0 4px">Испытание: ' + esc(ch.name) + '</h4><div>' + esc(ch.desc) + ' Награда: ' + esc(ch.reward.toLowerCase()) + '.</div><div class="s3-bar" style="margin-top:4px"><i style="width:' + Math.min(100, v / ch.goal * 100) + '%"></i></div><div class="s3-sub">' + Math.min(ch.goal, Math.round(v)) + ' / ' + ch.goal + (sim.flags['ch_' + k] ? ' · выполнено!' : '') + '</div>'; }
    if (k === 'cooking') { const rs = Object.keys(RECIPES).filter(r => !RECIPES[r].hidden); html += '<h4 style="margin:10px 0 4px">Рецепты (' + rs.filter(r => sim.recipes[r]).length + ' из ' + rs.length + ')</h4><div style="columns:2;font-size:10.5px">' + rs.map(r => '<div style="color:' + (sim.recipes[r] ? '#2a7a2a' : RECIPES[r].lvl <= L ? '#173a6b' : '#8aa0b8') + '">' + esc(RECIPES[r].name) + ' (' + RECIPES[r].lvl + ')</div>').join('') + '</div>'; }
    if (k === 'fishing') html += '<h4 style="margin:10px 0 4px">Пойманная рыба (' + Object.keys(sim.fishSeen).length + ' из ' + Object.keys(FISH).length + ')</h4><div style="columns:2;font-size:10.5px">' + Object.keys(FISH).map(f => '<div style="color:' + (sim.fishSeen[f] ? '#2a7a2a' : '#8aa0b8') + '">' + esc(sim.fishSeen[f] ? FISH[f].name : '???') + '</div>').join('') + '</div>';
    this.dialog({ title: 'Журнал навыка', body: '<div style="width:380px">' + html + '</div>' });
  };

  G.tab_opps = function (el, sim, g) {
    const list = sim.opps || [];
    if (!list.length) { el.innerHTML = '<div class="s3-sub" style="padding:6px;line-height:1.4">Активных возможностей нет. Они приходят по работе и когда навыки растут. Следите за уведомлениями!</div>'; return; }
    el.innerHTML = '<div class="s3-list">' + list.map(op => {
      const o = OPPORTUNITIES[op.k];
      const need = o.goal.k === 'visit_set' ? o.goal.lots.length : o.goal.n || 1;
      return '<div class="s3-row" style="align-items:flex-start">' + iconSVG('ui_opp', 18) + '<div class="grow"><div class="nm">' + esc(o.name) + '</div><div class="lb">' + esc(o.desc) + '</div><div class="lb">Прогресс: ' + Math.min(need, Math.round(op.n)) + ' / ' + need + ' · осталось ' + S.fmtDuration(op.until - g.t) + '</div></div></div>';
    }).join('') + '</div>';
  };

  G.tab_rewards = function (el, sim, g) {
    el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><b>Очки счастья: ' + S.fmtNum(sim.lh) + '</b><span class="s3-sub">Всего за жизнь: ' + S.fmtNum(sim.lhTotal) + '</span></div><div class="s3-list"></div>';
    const box = el.lastChild;
    for (const [k, R] of Object.entries(REWARDS)) {
      const owned = sim.rewards.includes(k);
      const row = document.createElement('div');
      row.className = 's3-row';
      row.innerHTML = iconSVG(R.icon, 18) + '<div class="grow"><div class="nm">' + esc(R.name) + '</div><div class="lb">' + S.fmtNum(R.cost) + ' очков</div></div>' + (owned ? '<b style="color:#2a8a2a">Есть</b>' : '<button class="s3-pill"' + (sim.lh < R.cost ? ' disabled' : '') + '>Купить</button>');
      const b = row.querySelector('button');
      if (b) b.onclick = e => { e.stopPropagation(); if (g.buyReward(sim, k)) { if (this.audio) this.audio.ui('reward'); this.tabSig = ''; this.refreshHud(true); } };
      this.tipOn(row, '<b>' + esc(R.name) + '</b>' + esc(R.desc));
      box.appendChild(row);
    }
  };

  function itemInfo(it) {
    switch (it.k) {
      case 'fish': return { name: FISH[it.f].name + ' (' + it.w + ' кг)', color: '#6a98c8', icon: 'm_fish', value: it.value };
      case 'produce': return { name: (PLANTS[it.p] || { name: it.p }).name + ', ' + S.QUALITY[it.q].toLowerCase(), color: (PLANTS[it.p] || { color: '#888' }).color, icon: 'm_leaf', value: it.value };
      case 'seed': return { name: 'Семена: ' + (PLANTS[it.p] ? PLANTS[it.p].name.toLowerCase() : it.p === 'common' ? 'обычные' : 'редкие'), color: '#b89058', icon: 'sk_gardening' };
      case 'collect': return { name: COLLECT[it.c].name, color: COLLECT[it.c].color, icon: 'm_gem', value: COLLECT[it.c].value };
      case 'painting': return { name: it.name.includes('«') ? it.name : 'Картина «' + it.name + '»', color: '#d8b860', icon: 'm_palette', value: it.value };
      case 'book': return { name: BOOKS[it.b].name, color: '#8a3a3a', icon: 'm_book' };
      case 'homework': return { name: 'Домашнее задание', color: '#e8e0cc', icon: 'm_book' };
      case 'obj': return { name: it.t === 'painting_own' && it.st && it.st.title ? 'Картина «' + it.st.title + '»' : S.OBJECTS[it.t].name, color: '#9ac2ea', icon: 'b_misc', value: it.value };
      case 'elixir': return { name: 'Эликсир молодости', color: '#a8e0f0', icon: 'm_potion' };
      case 'food': return { name: (RECIPES[it.recipe] || { name: 'Еда' }).name, color: '#e8a050', icon: 'm_food' };
    }
    return { name: it.k, color: '#888', icon: 'b_misc' };
  }
  G.itemInfo = itemInfo;

  G.itemIcon = function (it, inf) {
    if (it.k === 'obj' && S.OBJECTS[it.t] && this.stage) return '<img src="' + this.stage.thumb(it.t, it.col || S.OBJECTS[it.t].col, 34) + '">';
    return '<div class="dot" style="background:' + inf.color + '"></div>';
  };

  G.invGrid = function (box, list, onPick) {
    const groups = new Map();
    list.forEach((it, i) => { const inf = itemInfo(it); const key = it.k === 'painting' || it.k === 'book' || it.t === 'painting_own' ? 'x' + i : it.k + (it.f || it.p || it.c || it.t || '') + (it.col ? it.col.join('') : '') + (it.broken ? 'b' : ''); if (!groups.has(key)) groups.set(key, { it, inf, idx: [] }); groups.get(key).idx.push(i); });
    const grid = document.createElement('div');
    grid.className = 's3-inv';
    for (const gr of groups.values()) {
      const d = document.createElement('div');
      d.className = 's3-item';
      d.innerHTML = this.itemIcon(gr.it, gr.inf) + (gr.idx.length > 1 ? '<div class="n">' + gr.idx.length + '</div>' : '');
      this.tipOn(d, '<b>' + esc(gr.inf.name) + '</b>' + (gr.inf.value ? '<div class="val">Цена: ' + S.fmtMoney(gr.inf.value) + '</div>' : '') + (gr.it.broken ? '<div class="neg">Сломано</div>' : '') + 'Щёлкните, чтобы выбрать действие.');
      d.onclick = e => onPick(gr.idx[0], e);
      grid.appendChild(d);
    }
    box.appendChild(grid);
  };

  G.tab_inv = function (el, sim, g) {
    const hh = g.hh(sim);
    const fam = hh ? g.famInv(hh) : [];
    const view = this.invView === 'fam' && hh ? 'fam' : 'own';
    el.innerHTML = '<div class="s3-invh"><button class="s3-pill' + (view === 'own' ? ' on' : '') + '" data-v="own">Личные: ' + sim.inv.length + '</button><button class="s3-pill' + (view === 'fam' ? ' on' : '') + '" data-v="fam"' + (hh ? '' : ' disabled') + '>Семья: ' + fam.length + '</button><span class="s3-sub">' + (view === 'fam' ? 'Общие вещи всей семьи' : 'Вещи: ' + esc(sim.first)) + '</span></div>';
    for (const b of el.querySelectorAll('[data-v]')) b.onclick = () => { this.invView = b.dataset.v; this.tabSig = ''; this.refreshHud(true); if (this.audio) this.audio.ui('tab'); };
    const list = view === 'fam' ? fam : sim.inv;
    if (!list.length) {
      el.insertAdjacentHTML('beforeend', '<div class="s3-sub" style="padding:4px 6px;line-height:1.4">' + (view === 'fam' ? 'Общий инвентарь пуст. Мебель сюда убирают в режиме покупки, а личные вещи симы отдают семье из своей вкладки.' : 'Инвентарь пуст. Сюда попадают рыба, урожай, находки, книги и картины.') + '</div>');
      return;
    }
    this.invGrid(el, list, (i, e) => view === 'fam' ? this.famItemMenu(sim, i, e) : this.itemMenu(sim, i, e));
  };

  G.itemMenu = function (sim, idx, e) {
    const g = this.game, it = sim.inv[idx];
    if (!it) return;
    const r = this.root.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top - 60;
    const entries = [];
    const hh = g.hh(sim);
    if (it.k === 'book') entries.push({ label: 'Читать', special: () => g.queue(sim, 'read_inv', sim, { user: true, i: idx }) });
    if (it.k === 'produce') entries.push({ label: 'Съесть', special: () => { sim.inv.splice(idx, 1); sim.addNeed('hunger', 18); this.refreshHud(true); } });
    if (it.k === 'food') entries.push({ label: 'Съесть', special: () => { sim.inv.splice(idx, 1); sim.addNeed('hunger', 45); this.refreshHud(true); } });
    if (it.k === 'elixir') entries.push({ label: 'Выпить', special: () => { sim.inv.splice(idx, 1); if (sim.age === 'elder') { sim.age = 'adult'; sim.ageDays = 0; sim.ageLen = g.stageLength('adult'); sim.look.hairC = sim.look.hairC; } for (const n of S.NEED_KEYS) sim.needs[n] = 100; g.notify(sim.first + ' выпивает эликсир и чувствует себя моложе!', { sim, icon: 'm_potion' }); this.refreshHud(true); } });
    if ((it.k === 'obj' || it.k === 'painting') && hh && sim.lot === hh.lot) entries.push({ label: it.k === 'painting' ? 'Повесить на стену' : 'Поставить', special: () => this.placeFromInv(sim, idx) });
    if (it.k === 'seed') entries.push({ label: 'Посадить', special: () => this.hint('Щёлкните по земле на своём участке и выберите «Посадить».') });
    if (it.k === 'obj' && it.t === 'guitar') entries.push({ label: 'Играть', special: () => g.queue(sim, 'guitar_inv', sim, { user: true }) });
    if (it.k === 'homework') entries.push({ label: 'Сделать уроки', special: () => g.queue(sim, 'do_homework', sim, { user: true }) });
    if (hh && it.k !== 'homework') entries.push({ label: 'Отдать семье', special: () => { if (g.toFamily(sim, idx)) { if (this.audio) this.audio.ui('pick'); this.tabSig = ''; this.refreshHud(true); } } });
    entries.push({ label: 'Выбросить', special: () => this.confirm('Выбросить?', 'Выбросить «' + itemInfo(it).name + '»?', () => { sim.inv.splice(idx, 1); this.tabSig = ''; this.refreshHud(true); }) });
    this.showPie(Math.max(160, x), Math.max(140, y), entries, itemInfo(it).name, sim);
  };

  G.famItemMenu = function (sim, idx, e) {
    const g = this.game, hh = g.hh(sim);
    const inv = hh ? g.famInv(hh) : [];
    const it = inv[idx];
    if (!it) return;
    const r = this.root.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top - 60;
    const name = itemInfo(it).name;
    const entries = [];
    entries.push({ label: 'Взять себе', disabled: sim.isToddler ? 'Малыш не унесёт' : null, special: () => { if (g.fromFamily(sim, idx)) { if (this.audio) this.audio.ui('pick'); this.tabSig = ''; this.refreshHud(true); } } });
    if ((it.k === 'obj' || it.k === 'painting') && hh.lot >= 0) entries.push({ label: it.k === 'painting' || it.t === 'painting_own' ? 'Повесить на стену' : 'Поставить', special: () => this.placeFromFam(it) });
    if (it.k === 'obj') entries.push({ label: 'Продать за ' + S.fmtMoney(g.famItemValue(it)), special: () => this.confirm('Продать?', 'Продать «' + name + '» за ' + S.fmtMoney(g.famItemValue(it)) + '?', () => { const v = g.sellFamilyItem(hh, inv.indexOf(it)); if (v >= 0 && this.audio) this.audio.ui('sell'); this.tabSig = ''; this.refreshHud(true); }) });
    entries.push({ label: 'Выбросить', special: () => this.confirm('Выбросить?', 'Выбросить «' + name + '»?', () => { const i = inv.indexOf(it); if (i >= 0) inv.splice(i, 1); this.tabSig = ''; this.refreshHud(true); }) });
    this.showPie(Math.max(160, x), Math.max(140, y), entries, name, sim);
  };

  G.tab_simology = function (el, sim, g) {
    const L = LTW[sim.ltw];
    const days = Math.max(0, sim.ageLen - sim.ageDays);
    let html = '<div style="display:flex;gap:8px;align-items:center"><div><div class="s3-title">' + esc(sim.name) + '</div><div class="s3-sub">' + esc(S.AGE_INFO[sim.age].name) + (S.AGE_INFO[sim.age].next && g.opts.aging ? ' · до дня рождения ' + days + ' ' + S.plural(days, ['день', 'дня', 'дней']) : '') + ' · ' + esc(S.zodiacOf(sim.traits)) + '</div></div></div>';
    html += '<div class="s3-traits" style="margin:5px 0">' + sim.traits.map(t => '<span class="s3-trait" data-t="' + t + '">' + S.traitIconSVG(t, 14) + esc(TRAITS[t].name) + '</span>').join('') + '</div>';
    html += '<div class="s3-sub">Любимое: ' + esc((RECIPES[sim.fav.food] || { name: 'не выбрано' }).name) + ', ' + esc(sim.fav.music) + ', ' + esc(sim.fav.color.toLowerCase()) + '</div>';
    if (L) html += '<div style="margin-top:4px;display:flex;align-items:center;gap:6px">' + iconSVG(L.icon, 16) + '<b>' + esc(L.name) + '</b>' + (sim.flags.ltwDone ? ' <span style="color:#2a8a2a">исполнено!</span>' : '') + '</div><div class="s3-bar" style="margin-top:2px"><i style="width:' + Math.round(g.ltwProgress(sim) * 100) + '%"></i></div>';
    el.innerHTML = html;
    for (const t of el.querySelectorAll('[data-t]')) this.tipOn(t, '<b>' + esc(TRAITS[t.dataset.t].name) + '</b>' + esc(TRAITS[t.dataset.t].desc));
  };

  G.jobsDialog = function (sim, onClose) {
    const g = this.game;
    const teen = sim.age === 'teen';
    const list = teen || sim.age === 'elder' ? Object.keys(PART_TIME).map(k => [k, PART_TIME[k], true]) : [];
    if (!teen) for (const k of S.CAREER_KEYS) list.push([k, CAREERS[k], false]);
    const box = document.createElement('div');
    box.className = 's3-grid';
    box.style.cssText = 'grid-template-columns:1fr 1fr;width:560px;max-width:100%';
    for (const [k, c, pt] of list) {
      const L = c.levels[0];
      const card = document.createElement('div');
      card.className = 's3-card s3-inset';
      const days = c.days.map((v, i) => v ? S.DAY_SHORT[i] : null).filter(Boolean).join(' ');
      card.innerHTML = iconSVG(c.icon, 26) + '<div><div class="t">' + esc(c.name) + (pt ? ' (подработка)' : '') + '</div><div class="d">' + esc(L.t) + ', ' + S.fmtMoney(L.pay) + ' в час. ' + days + ', с ' + L.start + ':00 на ' + L.hours + ' ч.</div>' + (c.desc ? '<div class="d">' + esc(c.desc) + '</div>' : '') + '</div>';
      card.onclick = () => { g.joinCareer(sim, k); h.close(); this.tab = 'career'; this.tabSig = ''; this.refreshHud(true); if (this.audio) this.audio.ui('reward'); };
      box.appendChild(card);
    }
    const h = this.dialog({ title: 'Вакансии: ' + sim.first, body: box, onClose });
  };

  G.shopDialog = function (sim, kind, onClose) {
    const g = this.game;
    const box = document.createElement('div');
    box.style.cssText = 'width:420px;max-width:100%';
    const items = [];
    if (kind === 'grocery') {
      for (const it of S.GROCERY) {
        const [a, b] = it.k.split(':');
        if (a === 'fish') items.push({ name: 'Рыба: ' + FISH[b].name.toLowerCase(), price: it.price, item: () => ({ k: 'fish', f: b, w: FISH[b].w[0], value: FISH[b].value }) });
        else if (a === 'seed') items.push({ name: b === 'common' ? 'Семена: обычные' : 'Семена: редкие', price: it.price, item: () => ({ k: 'seed', p: b }) });
        else items.push({ name: PLANTS[a].name, price: it.price, item: () => ({ k: 'produce', p: a, q: 2, value: PLANTS[a].value }) });
      }
    } else {
      for (const [k, B] of Object.entries(BOOKS)) items.push({ name: B.name, price: B.price, item: () => ({ k: 'book', b: k, read: 0 }), note: B.skill ? 'Навык до ' + (B.to + 1) : B.genre || '' });
    }
    const hh = g.hh(sim);
    const render = () => {
      box.innerHTML = '<div style="text-align:right;font-weight:bold;margin-bottom:6px">Бюджет: ' + S.fmtMoney(hh.funds) + '</div><div class="s3-list"></div>';
      for (const it of items) {
        const row = document.createElement('div');
        row.className = 's3-row';
        row.innerHTML = '<div class="grow"><div class="nm">' + esc(it.name) + '</div>' + (it.note ? '<div class="lb">' + esc(it.note) + '</div>' : '') + '</div><b>' + S.fmtMoney(it.price) + '</b><button class="s3-pill"' + (hh.funds < it.price ? ' disabled' : '') + '>Купить</button>';
        row.querySelector('button').onclick = () => { if (g.buyItem(sim, it.item(), it.price)) { if (this.audio) this.audio.ui('buy'); render(); } };
        box.lastChild.appendChild(row);
      }
    };
    render();
    this.dialog({ title: kind === 'grocery' ? 'Супермаркет «Корзинка»' : 'Книжный магазин «Страница»', body: box, onClose: () => { this.tabSig = ''; if (onClose) onClose(); } });
  };

  G.traitDialog = function (sim, count, suggest, onDone, onClose) {
    const g = this.game;
    const chosen = sim.traits.slice();
    const need = chosen.length + count;
    const box = document.createElement('div');
    box.style.cssText = 'width:440px;max-width:100%';
    const render = () => {
      const allowed = S.TRAIT_KEYS.filter(k => S.ageIdx(sim.age) >= S.ageIdx(TRAITS[k].age));
      box.innerHTML = '<div class="s3-sub" style="margin-bottom:6px">' + esc(sim.first) + ' подрастает! Выберите ' + count + ' ' + S.plural(count, ['новую черту', 'новые черты', 'новых черт']) + ' характера.</div><div class="s3-traitgrid" style="grid-template-columns:repeat(9,32px)"></div><div class="s3-traits" style="margin-top:8px"></div>';
      const grid = box.children[1];
      for (const k of allowed) {
        const has = chosen.includes(k);
        const locked = sim.traits.includes(k);
        const conflict = !has && chosen.some(c => TRAITS[c].conflicts.includes(k));
        const d = document.createElement('div');
        d.className = 'tb' + (has ? ' on' : '') + (conflict ? ' dis' : '');
        d.innerHTML = S.traitIconSVG(k, 18);
        this.tipOn(d, '<b>' + esc(TRAITS[k].name) + '</b>' + esc(TRAITS[k].desc) + (conflict ? '<div class="neg">Не сочетается с уже выбранными чертами.</div>' : ''));
        d.onclick = () => { if (locked || conflict) return; if (has) chosen.splice(chosen.indexOf(k), 1); else if (chosen.length < need) chosen.push(k); render(); };
        grid.appendChild(d);
      }
      box.lastChild.innerHTML = chosen.map(t => '<span class="s3-trait">' + S.traitIconSVG(t, 14) + esc(TRAITS[t].name) + '</span>').join('');
    };
    render();
    this.dialog({ title: 'Новые черты характера', body: box, x: false, outside: false, esc: false, onClose, buttons: [{ label: 'Готово', fn: () => { if (chosen.length < need) { const rest = S.pickTraits(g.rng, sim.age, need, chosen); chosen.length = 0; chosen.push(...rest); } sim.traits = chosen.slice(0, need); if (onDone) onDone(); } }] });
  };

  G.ltwDialog = function (sim, opts, onClose) {
    opts = sim.traits.length ? S.ltwOptions(sim.traits, this.game.rng, 5) : opts;
    const box = document.createElement('div');
    box.className = 's3-grid';
    box.style.cssText = 'width:420px;max-width:100%';
    let pick = opts[0];
    const render = () => {
      box.innerHTML = '';
      for (const k of opts) {
        const L = LTW[k];
        const c = document.createElement('div');
        c.className = 's3-card s3-inset' + (pick === k ? ' on' : '');
        c.innerHTML = iconSVG(L.icon, 24) + '<div><div class="t">' + esc(L.name) + '</div><div class="d">' + esc(L.desc) + '</div></div>';
        c.onclick = () => { pick = k; render(); };
        box.appendChild(c);
      }
    };
    render();
    this.dialog({ title: 'Мечта всей жизни: ' + sim.first, body: box, x: false, outside: false, esc: false, onClose, buttons: [{ label: 'Выбрать', fn: () => { sim.ltw = pick; this.refreshHud(true); } }] });
  };

  G.nameDialog = function (sim, onClose) {
    const box = document.createElement('div');
    box.style.cssText = 'width:300px';
    box.innerHTML = '<div class="s3-sub" style="margin-bottom:6px">Как назовём ' + (sim.gender === 'f' ? 'девочку' : 'мальчика') + '?</div><input type="text" maxlength="18" value="' + esc(sim.first) + '">';
    const inp = box.querySelector('input');
    setTimeout(() => { inp.focus(); inp.select(); }, 50);
    this.dialog({ title: 'Новый член семьи', body: box, x: false, outside: false, esc: false, onClose, buttons: [{ label: 'Готово', fn: () => { const v = inp.value.trim(); if (v) sim.first = v.slice(0, 18); sim._body = null; this.portSig = ''; this.refreshHud(true); } }] });
  };

  G.midlifeDialog = function (sim, onClose) {
    const box = document.createElement('div');
    box.style.cssText = 'width:420px';
    let drop = null;
    const render = () => {
      box.innerHTML = '<div class="s3-sub">Выберите черту, от которой ' + esc(sim.first) + ' откажется:</div><div class="s3-traits" style="margin:6px 0"></div>';
      for (const t of sim.traits) {
        const b = document.createElement('span');
        b.className = 's3-trait';
        b.style.cursor = 'pointer';
        if (drop === t) b.style.outline = '2px solid #c0302a';
        b.innerHTML = S.traitIconSVG(t, 14) + esc(TRAITS[t].name);
        b.onclick = () => { drop = t; render(); };
        box.lastChild.appendChild(b);
      }
    };
    render();
    this.dialog({ title: 'Кризис среднего возраста', body: box, x: false, outside: false, esc: false, buttons: [{ label: 'Дальше', fn: () => { if (!drop) return false; sim.traits = sim.traits.filter(t => t !== drop); this.traitDialog(sim, 1, [], () => this.refreshHud(true), onClose); } }] });
  };

  G.gameDialog = function (kind, data) {
    if (this.mode !== 'live') {
      if (kind === 'trait') data.sim.traits = S.pickTraits(this.game.rng, data.sim.age, data.sim.traits.length + data.count, data.sim.traits);
      if (kind === 'ltw') data.sim.ltw = data.opts[0];
      return;
    }
    this.gdQueue = this.gdQueue || [];
    this.gdQueue.push([kind, data]);
    if (!this.gdOpen) this.nextGameDialog();
  };

  G.nextGameDialog = function () {
    const next = this.mode === 'live' && this.gdQueue ? this.gdQueue.shift() : null;
    if (!next) { this.gdOpen = false; this.gdQueue = []; return; }
    this.gdOpen = true;
    const [kind, data] = next;
    const done = () => { this.gdOpen = false; this.nextGameDialog(); };
    if (kind === 'jobs') this.jobsDialog(data.sim, done);
    else if (kind === 'shop') this.shopDialog(data.sim, data.kind, done);
    else if (kind === 'trait') this.traitDialog(data.sim, data.count, data.suggest, () => this.refreshHud(true), done);
    else if (kind === 'ltw') this.ltwDialog(data.sim, data.opts, done);
    else if (kind === 'name') this.nameDialog(data.sim, done);
    else if (kind === 'midlife') this.midlifeDialog(data.sim, done);
    else if (kind === 'gameover') this.dialog({ title: 'Семьи больше нет', body: '<div style="width:320px;text-align:center;line-height:1.4">В семье ' + esc(data.hh.name) + ' никого не осталось. Выберите другую семью в главном меню.</div>', x: false, outside: false, esc: false, buttons: [{ label: 'В главное меню', fn: () => this.showMenu() }] });
    else done();
  };

  G.placeExtra = function (it) {
    if (it.k === 'painting') return ['painting_own', { st: { art: Math.max(0, PAINT_STYLES.indexOf(it.style)), seed: it.seed || 0, title: it.name, by: it.by }, art: Math.max(1, Math.min(6, Math.round((it.value || 0) / 250))), value: it.value || 0 }];
    const extra = {};
    if (it.col) extra.col = it.col.slice();
    if (it.st) extra.st = JSON.parse(JSON.stringify(it.st));
    if (it.art) extra.art = it.art;
    if (it.value !== undefined) extra.value = it.value;
    if (it.broken) extra.broken = true;
    return [it.t, extra];
  };

  G.placeFromInv = function (sim, idx) {
    const it = sim.inv[idx];
    if (!it) return;
    this.setSub('buy');
    const [type, extra] = this.placeExtra(it);
    this.startPlacing(type, Object.assign({ fromInv: { sim, idx } }, extra));
  };

  G.placeFromFam = function (it) {
    this.setSub('buy');
    if (!this.bm) return;
    this.bm.buyTool = 'stash';
    const [type, extra] = this.placeExtra(it);
    this.renderCatalog();
    this.startPlacing(type, Object.assign({ fromFam: it }, extra));
    this.renderBuyItems();
    this.updateToolbar();
  };

  G.gameMenu = function () {
    const box = document.createElement('div');
    box.style.cssText = 'display:flex;flex-direction:column;gap:8px;width:240px';
    const h = this.dialog({ title: 'Меню', body: box });
    const add = (label, fn) => { const b = document.createElement('button'); b.className = 's3-pill big'; b.textContent = label; b.onclick = () => { h.close(); fn(); }; box.appendChild(b); };
    add('Сохранить игру', () => this.quickSave(true));
    add('Настройки', () => this.optionsDialog());
    add('Управление', () => this.helpDialog());
    add('Выйти в главное меню', () => this.confirm('Выйти в меню?', 'Несохранённый прогресс будет потерян. Сохранить перед выходом?', () => { this.quickSave(); this.showMenu(); }, 'Сохранить и выйти', 'Отмена'));
    if (this.opts.onExit) add('Выйти из игры', () => this.opts.onExit());
  };

  G.helpDialog = function () {
    const rows = [['Левый щелчок', 'Действия с предметом, симом или землёй'], ['Правый щелчок', 'Отменить текущее действие'], ['Перетаскивание', 'Двигать камеру'], ['Колесо, Z/X', 'Приближение'], ['Q/E, &lt; &gt;', 'Поворот камеры'], ['WASD, стрелки', 'Прокрутка'], ['Пробел, 0', 'Пауза'], ['1, 2, 3', 'Скорость времени'], ['Tab', 'Следующий сим'], ['Home', 'Камера к симу'], ['F1 F2 F3', 'Жизнь, покупка, строительство'], ['M', 'Карта города'], ['Page Up/Down', 'Этаж выше и ниже'], ['V', 'Стены: подняты, в разрезе, опущены'], ['F5', 'Быстрое сохранение'], ['F7', 'Отладка: деньги, очки счастья, погода, время'], ['R, Del', 'Поворот и продажа предмета (покупка)'], ['I', 'Убрать предмет в инвентарь семьи (покупка)']];
    this.dialog({ title: 'Управление', body: '<table style="border-collapse:collapse;width:380px">' + rows.map(r => '<tr><td style="padding:3px 8px;font-weight:bold;white-space:nowrap">' + r[0] + '</td><td style="padding:3px 8px">' + r[1] + '</td></tr>').join('') + '</table>' });
  };

  G.debugDialog = function (msg) {
    const g = this.game;
    const box = document.createElement('div');
    box.className = 's3-dbg';
    const h = this.dialog({ title: 'Отладка (F7)', body: box, onClose: () => { this.dbgDlg = null; } });
    this.dbgDlg = h;
    const note = document.createElement('div');
    note.className = 'note';
    const say = text => { note.textContent = text; };
    const row = (label, sub) => {
      const r = document.createElement('div');
      r.className = 'row';
      r.innerHTML = '<div class="lbl">' + esc(label) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div><div class="opts"></div>';
      box.appendChild(r);
      return r.querySelector('.opts');
    };
    const pill = (opts, label, fn, on, icon) => {
      const b = document.createElement('button');
      b.className = 's3-pill' + (on ? ' on' : '');
      b.innerHTML = (icon ? iconSVG(icon, 13) : '') + esc(label);
      b.onclick = () => { if (this.audio) this.audio.ui('click'); fn(); render(); };
      opts.appendChild(b);
    };
    const render = () => {
      box.innerHTML = '';
      const hh = g.active(), sim = g.selected();
      const money = row('Деньги', hh ? 'Сейчас: ' + S.fmtMoney(hh.funds) : '');
      for (const n of [1000, 10000, 50000, 100000]) pill(money, '+' + S.fmtMoney(n), () => { if (!hh) return; hh.funds += n; say('Семья ' + hh.name + ' получает ' + S.fmtMoney(n) + '.'); this.refreshHud(true); if (this.updateToolbar) this.updateToolbar(); });
      if (sim) {
        const one = row('Очки счастья', sim.first + ': ' + S.fmtNum(sim.lh));
        for (const n of [1000, 10000, 50000]) pill(one, '+' + S.fmtNum(n), () => { sim.lh += n; sim.lhTotal += n; say(sim.first + ' получает ' + S.fmtNum(n) + ' очков счастья.'); this.tabSig = ''; this.refreshHud(true); });
      }
      if (hh) {
        const all = row('Всей семье', 'Очки счастья каждому');
        for (const n of [1000, 10000, 50000]) pill(all, '+' + S.fmtNum(n), () => { for (const s of g.members(hh)) { s.lh += n; s.lhTotal += n; } say('Все в семье получают по ' + S.fmtNum(n) + ' очков счастья.'); this.tabSig = ''; this.refreshHud(true); });
      }
      const W = g.weather || { kind: 'clear' };
      const wx = row('Погода', 'Сейчас: ' + g.weatherName().toLowerCase());
      for (const k of S.WEATHER_KEYS) pill(wx, S.WEATHER[k].name, () => { g.setWeather(k, 4); g.weather.since = g.t - 30; say('Погода: ' + S.WEATHER[k].name.toLowerCase() + ', на ближайшие 4 часа.'); this.refreshHud(true); }, W.kind === k, S.WEATHER[k].icon);
      const tm = row('Время суток', 'Сейчас: ' + S.fmtClock(g.t));
      for (const [hr, label] of [[7, 'Утро, 7:00'], [12, 'Полдень'], [18, 'Вечер, 18:00'], [22, 'Ночь, 22:00']]) pill(tm, label, () => this.skipToHour(hr, say));
      pill(tm, '+1 час', () => this.skipTime(60, say));
      box.appendChild(note);
      if (!note.textContent) say(msg || 'Время перематывается честно: симы проживают эти часы сами, пока игра на паузе.');
    };
    render();
  };

  G.skipToHour = function (hr, say) {
    const g = this.game;
    const day = Math.floor(g.t / 1440) * 1440;
    let to = day + hr * 60;
    if (to <= g.t + 1) to += 1440;
    this.skipTime(to - g.t, say);
  };

  G.skipTime = function (mins, say) {
    const g = this.game;
    this.skip = { to: g.t + mins };
    if (say) say('Перемотка до ' + S.clockOf(this.skip.to) + '...');
  };

  G.skipTick = function () {
    const g = this.game, sk = this.skip;
    const end = Math.min(sk.to, g.t + 120);
    while (g.t < end - 1e-6) g.step(Math.min(0.5, end - g.t));
    if (g.t >= sk.to - 1e-6) {
      this.skip = null;
      this.hint('Время: ' + S.fmtClock(g.t));
      if (this.dbgDlg) { this.dbgDlg.close(); this.debugDialog('Готово: ' + S.fmtClock(g.t) + '.'); }
    }
    this.refreshHud(false);
  };

  Object.assign(S, { itemInfo });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
