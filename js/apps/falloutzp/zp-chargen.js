(function (Z) {
  'use strict';

  const U = Z.UI.prototype;
  const esc = s => Z.esc(s);

  U.paperPanel = function (title, form) {
    const wrap = document.createElement('div');
    wrap.className = 'zp-panel';
    wrap.innerHTML = '<div class="zp-paper"><div class="hdr"><b>' + esc(title) + '</b><span>' + esc(form) + '</span></div><div class="form"><div class="left"></div><div class="right"></div></div><div class="ftr"><span class="info"></span><span><span class="pbtn" data-k="back">Назад</span> <span class="pbtn" data-k="next">Далее</span></span></div></div>';
    wrap.addEventListener('mousedown', e => e.stopPropagation());
    return wrap;
  };

  U.openChargen = function (done, opts = {}) {
    const g = this.game, p = g.player;
    const st = {
      step: opts.step || 0,
      name: p.name === 'Курьер' ? '' : p.name,
      sex: p.sex || 'm',
      stats: Object.assign({}, p.sheet.stats),
      traits: p.sheet.traits.slice(),
      tags: p.sheet.tags.slice(),
      look: Object.assign({}, p.look || Z.randomLook(Z.rng(3), { sex: 'm' })),
      sel: 0
    };
    const steps = ['card', 'gto', 'traits', 'tags', 'final'];
    const wrap = this.paperPanel('МЕДИЦИНСКАЯ КОМИССИЯ', '');
    const panel = { el: wrap, escClose: false };
    const left = wrap.querySelector('.left'), right = wrap.querySelector('.right'), info = wrap.querySelector('.info');
    const statSum = () => Object.values(st.stats).reduce((a, b) => a + b, 0);
    const render = () => {
      const s = steps[st.step];
      const hdr = wrap.querySelector('.hdr');
      wrap.querySelector('.stamp') && wrap.querySelector('.stamp').remove();
      if (s === 'card') {
        hdr.innerHTML = '<b>МЕДИЦИНСКАЯ КАРТА</b><span>Вознесенский медпункт · ' + Z.dateStr(g.time) + '</span>';
        const L = st.look;
        const sw = (arr, key) => arr.map((c, i) => '<span class="sw' + (JSON.stringify(L[key]) === JSON.stringify(c) ? ' on' : '') + '" data-sw="' + key + ':' + i + '" style="background:rgb(' + c.join(',') + ')"></span>').join('');
        const opt = (key, list) => list.map(([v, nm]) => '<span class="opt' + (L[key] === v ? ' on' : '') + '" data-opt="' + key + ':' + v + '">' + nm + '</span>').join('');
        left.innerHTML = '<div>Фамилия, имя:</div><input type="text" maxlength="24" value="' + esc(st.name) + '" placeholder="Курьер">' +
          '<div style="margin-top:12px">Пол: <span class="opt' + (st.sex === 'm' ? ' on' : '') + '" data-sex="m">мужской</span><span class="opt' + (st.sex === 'f' ? ' on' : '') + '" data-sex="f">женский</span></div>' +
          '<div style="margin-top:12px">Цвет кожи:<br>' + sw(Z.LOOK_POOL.SKINS, 'skin') + '</div>' +
          '<div style="margin-top:8px">Волосы:<br>' + sw(Z.LOOK_POOL.HAIRS, 'hairCol') + '</div>' +
          '<div style="margin-top:8px">Причёска: ' + opt('hair', st.sex === 'm' ? [['short', 'короткая'], ['bald', 'лысина'], ['long', 'длинная'], ['chub', 'чуб']] : [['bun', 'пучок'], ['long', 'длинная'], ['short', 'короткая']]) + '</div>' +
          (st.sex === 'm' ? '<div style="margin-top:8px">Лицо: ' + opt('beard', [['none', 'гладко выбрит'], ['stubble', 'щетина'], ['mustache', 'усы'], ['cossack', 'вислые усы'], ['full', 'борода']]) + '</div>' : '') +
          '<div style="margin-top:8px">Глаза: ' + [[60, 90, 140], [80, 110, 70], [90, 60, 40], [100, 110, 120]].map((c, i) => '<span class="sw' + (JSON.stringify(L.eyes) === JSON.stringify(c) ? ' on' : '') + '" data-eye="' + i + '" style="background:rgb(' + c.join(',') + ')"></span>').join('') + '</div>';
        right.innerHTML = '<p>«Пуля прошла по касательной, голубчик. Шрам будет, а мозги, вроде, на месте. Давай-ка оформим тебя как положено: карта, обходной лист, анкета. Порядок есть порядок.»</p><p style="opacity:.8">— д-р В. П. Ласточкина</p><canvas width="220" height="220" style="width:220px;height:220px;border:1px solid #2b2418;background:#d8cdb2"></canvas>';
        const inp = left.querySelector('input');
        inp.addEventListener('input', () => { st.name = inp.value; });
        left.querySelectorAll('[data-sex]').forEach(e => e.addEventListener('click', () => { st.sex = e.dataset.sex; L.sex = st.sex; if (st.sex === 'f') { L.beard = 'none'; if (!['bun', 'long', 'short'].includes(L.hair)) L.hair = 'bun'; } render(); }));
        left.querySelectorAll('[data-sw]').forEach(e => e.addEventListener('click', () => { const [k, i] = e.dataset.sw.split(':'); L[k] = (k === 'skin' ? Z.LOOK_POOL.SKINS : Z.LOOK_POOL.HAIRS)[+i]; render(); }));
        left.querySelectorAll('[data-opt]').forEach(e => e.addEventListener('click', () => { const [k, v] = e.dataset.opt.split(':'); L[k] = v; render(); }));
        left.querySelectorAll('[data-eye]').forEach(e => e.addEventListener('click', () => { L.eyes = [[60, 90, 140], [80, 110, 70], [90, 60, 40], [100, 110, 120]][+e.dataset.eye]; render(); }));
        const cv = right.querySelector('canvas');
        cv.getContext('2d').drawImage(Z.facePortrait(Object.assign({}, L, { faceSeed: L.faceSeed || 7 }), 220), 0, 0);
        info.textContent = 'Шаг 1 из 5';
      } else if (s === 'gto') {
        hdr.innerHTML = '<b>ФОРМА 086/у · НОРМЫ ГТО</b><span>Распределено: ' + statSum() + ' / 40</span>';
        left.innerHTML = Z.STATS.map((d, i) => '<div class="ln' + (i === st.sel ? ' sel' : '') + '" data-i="' + i + '"><span class="nm">' + esc(d.name) + '</span><span class="pm" data-m="' + i + '">−</span><span class="v">' + st.stats[d.id] + '</span><span class="pm" data-p="' + i + '">+</span></div>').join('') + '<div style="margin-top:10px">Свободно очков: <b>' + (40 - statSum()) + '</b></div>';
        const d = Z.STATS[st.sel];
        right.innerHTML = '<b>' + esc(d.name) + '</b><p>' + esc(d.desc) + '</p><p style="opacity:.75">Обследование провели: хирург, окулист, терапевт, психиатр, ЛОР и физрук.</p>';
        left.querySelectorAll('.ln').forEach(e => e.addEventListener('mouseenter', () => { if (st.sel === +e.dataset.i) return; st.sel = +e.dataset.i; render(); }));
        left.querySelectorAll('[data-m]').forEach(e => e.addEventListener('click', ev => { ev.stopPropagation(); bump(+e.dataset.m, -1); }));
        left.querySelectorAll('[data-p]').forEach(e => e.addEventListener('click', ev => { ev.stopPropagation(); bump(+e.dataset.p, 1); }));
        info.textContent = 'Шаг 2 из 5';
      } else if (s === 'traits') {
        hdr.innerHTML = '<b>АНКЕТА · ОСОБЕННОСТИ ХАРАКТЕРА</b><span>Выбрано: ' + st.traits.length + ' / 2 (необязательно)</span>';
        left.innerHTML = Z.TRAITS.map((d, i) => '<div class="ln' + (i === st.sel ? ' sel' : '') + '" data-i="' + i + '"><span class="chk">' + (st.traits.includes(d.id) ? '✓' : '') + '</span><span class="nm">' + esc(d.name) + '</span></div>').join('');
        const d = Z.TRAITS[Z.clamp(st.sel, 0, Z.TRAITS.length - 1)];
        right.innerHTML = '<b>' + esc(d.name) + '</b><p>' + esc(d.desc) + '</p>';
        left.querySelectorAll('.ln').forEach(e => { e.addEventListener('mouseenter', () => { if (st.sel === +e.dataset.i) return; st.sel = +e.dataset.i; render(); }); e.addEventListener('click', () => toggleTrait(+e.dataset.i)); });
        info.textContent = 'Шаг 3 из 5';
      } else if (s === 'tags') {
        hdr.innerHTML = '<b>ПРОФОРИЕНТАЦИЯ</b><span>Отмечено навыков: ' + st.tags.length + ' / 3</span>';
        const sheet = new Z.Sheet({ stats: st.stats, tags: st.tags, traits: st.traits });
        left.innerHTML = Z.SKILLS.map((d, i) => '<div class="ln' + (i === st.sel ? ' sel' : '') + '" data-i="' + i + '"><span class="chk">' + (st.tags.includes(d.id) ? '✓' : '') + '</span><span class="nm">' + esc(d.name) + '</span><span class="v">' + sheet.skill(d.id) + '</span></div>').join('');
        const d = Z.SKILLS[Z.clamp(st.sel, 0, Z.SKILLS.length - 1)];
        right.innerHTML = '<b>' + esc(d.name) + '</b><p>' + esc(d.desc) + '</p><p style="opacity:.75">Отмеченный навык сразу получает +15. Зависит от: ' + Z.statName(d.stat) + '.</p>';
        left.querySelectorAll('.ln').forEach(e => { e.addEventListener('mouseenter', () => { if (st.sel === +e.dataset.i) return; st.sel = +e.dataset.i; render(); }); e.addEventListener('click', () => toggleTag(+e.dataset.i)); });
        info.textContent = 'Шаг 4 из 5';
      } else {
        hdr.innerHTML = '<b>ЗАКЛЮЧЕНИЕ КОМИССИИ</b><span>' + esc(st.name || 'Курьер') + '</span>';
        const sheet = new Z.Sheet({ stats: st.stats, tags: st.tags, traits: st.traits });
        left.innerHTML = '<div>' + Z.STATS.map(d => d.short + ' ' + st.stats[d.id]).join(' · ') + '</div><div style="margin-top:8px">Здоровье ' + sheet.maxHP() + ', ОД ' + sheet.maxAP() + ', грузоподъёмность ' + sheet.carry() + '</div><div style="margin-top:8px">Черты: ' + (st.traits.map(t => Z.TRAITS.find(x => x.id === t).name).join(', ') || 'нет') + '</div><div style="margin-top:8px">Отмечены: ' + st.tags.map(t => Z.skillName(t)).join(', ') + '</div>';
        right.innerHTML = '<p>«Годен. Без ограничений. С таким здоровьем — хоть в космонавты. Ну, почти.»</p><p>Можно вернуться назад и поправить карту.</p>';
        const stp = document.createElement('div');
        stp.className = 'stamp';
        stp.textContent = 'ГОДЕН';
        wrap.querySelector('.zp-paper').appendChild(stp);
        info.textContent = 'Шаг 5 из 5';
      }
      wrap.querySelector('[data-k=next]').textContent = st.step === steps.length - 1 ? 'Подписать' : 'Далее';
      wrap.querySelector('[data-k=back]').style.visibility = st.step ? 'visible' : 'hidden';
    };
    const bump = (i, d) => {
      const k = Z.STATS[i].id, v = st.stats[k] + d;
      if (v < 1 || v > 10) return;
      if (d > 0 && statSum() >= 40) return;
      st.stats[k] = v;
      st.sel = i;
      render();
    };
    const toggleTrait = i => {
      const id = Z.TRAITS[i].id;
      st.sel = i;
      if (st.traits.includes(id)) st.traits = st.traits.filter(t => t !== id);
      else if (st.traits.length < 2) st.traits.push(id);
      render();
    };
    const toggleTag = i => {
      const id = Z.SKILLS[i].id;
      st.sel = i;
      if (st.tags.includes(id)) st.tags = st.tags.filter(t => t !== id);
      else if (st.tags.length < 3) st.tags.push(id);
      render();
    };
    const next = () => {
      const s = steps[st.step];
      if (s === 'gto' && statSum() !== 40) { this.message('Комиссия', 'Распределите все очки ГТО: их должно быть ровно 40.'); return; }
      if (s === 'tags' && st.tags.length !== 3) { this.message('Комиссия', 'Отметьте ровно три навыка.'); return; }
      if (st.step < steps.length - 1) { st.step++; st.sel = 0; render(); return; }
      p.name = (st.name || '').trim() || 'Курьер';
      p.sex = st.sex;
      p.sheet.stats = Object.assign({}, st.stats);
      p.sheet.traits = st.traits.slice();
      p.sheet.tags = st.tags.slice();
      p.look = Object.assign({}, st.look, { sex: st.sex });
      p.refreshMax();
      p.hp = p.hpMax;
      p.ap = p.sheet.maxAP();
      for (const l of Z.LIMBS) p.limbs[l] = p.limbMax(l);
      this.closePanel(panel);
      if (done) done();
    };
    wrap.querySelector('[data-k=next]').addEventListener('click', next);
    wrap.querySelector('[data-k=back]').addEventListener('click', () => { if (st.step > 0) { st.step--; st.sel = 0; render(); } });
    panel.key = e => {
      if (e.target && e.target.tagName === 'INPUT') { if (e.code === 'Enter') next(); return e.code === 'Enter'; }
      const s = steps[st.step];
      const n = s === 'gto' ? 7 : s === 'traits' ? Z.TRAITS.length : s === 'tags' ? Z.SKILLS.length : 0;
      if (e.code === 'ArrowUp' && n) { st.sel = (st.sel + n - 1) % n; render(); return true; }
      if (e.code === 'ArrowDown' && n) { st.sel = (st.sel + 1) % n; render(); return true; }
      if (s === 'gto' && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) { bump(st.sel, e.code === 'ArrowRight' ? 1 : -1); return true; }
      if ((e.code === 'Space') && s === 'traits') { toggleTrait(st.sel); return true; }
      if ((e.code === 'Space') && s === 'tags') { toggleTag(st.sel); return true; }
      if (e.code === 'Enter') { next(); return true; }
      return false;
    };
    render();
    this.openPanel(panel);
  };

  U.openLevelUp = function () {
    const g = this.game, p = g.player, sh = p.sheet;
    if (!sh.pendingSkill && !sh.pendingPerk) return;
    const add = {};
    let left0 = sh.pendingSkill || 0;
    let phase = left0 > 0 ? 'skills' : 'perks';
    let sel = 0;
    const wrap = document.createElement('div');
    wrap.className = 'zp-panel';
    wrap.innerHTML = '<div class="zp-crt zp-xfer"><h2></h2><div class="cols"><div class="col active"><div class="list scroll"></div></div><div class="col"><div class="det"></div></div></div><div class="foot"><span class="dim"></span><span><span class="btn" data-k="ok">Готово</span></span></div></div>';
    wrap.addEventListener('mousedown', e => e.stopPropagation());
    const panel = { el: wrap, escClose: false };
    const spent = () => Object.values(add).reduce((a, b) => a + b, 0);
    const perks = () => Z.PERKS.filter(pk => sh.perkAvailable(pk));
    const render = () => {
      const h = wrap.querySelector('h2'), lst = wrap.querySelector('.list'), det = wrap.querySelector('.det'), foot = wrap.querySelector('.foot .dim');
      if (phase === 'skills') {
        h.textContent = 'УРОВЕНЬ ' + sh.level + ' · НАВЫКИ: осталось ' + (left0 - spent());
        lst.innerHTML = Z.SKILLS.map((s, i) => '<div class="row' + (i === sel ? ' sel' : '') + '" data-i="' + i + '"><span class="nm">' + esc(s.name) + '</span><span class="num">' + (sh.skillRaw(s.id) + (add[s.id] || 0)) + (add[s.id] ? ' <span class="grn">+' + add[s.id] + '</span>' : '') + '</span></div>').join('');
        det.innerHTML = '<b>' + esc(Z.SKILLS[sel].name) + '</b><div>' + esc(Z.SKILLS[sel].desc) + '</div>';
        foot.textContent = '←/→ — убавить/прибавить, ↑↓ — выбор, Enter — дальше';
      } else {
        const list = perks();
        h.textContent = 'УРОВЕНЬ ' + sh.level + ' · ВЫБЕРИТЕ ПЕРК';
        sel = Z.clamp(sel, 0, Math.max(0, list.length - 1));
        lst.innerHTML = list.map((pk, i) => '<div class="row' + (i === sel ? ' sel' : '') + '" data-i="' + i + '"><span class="nm">' + esc(pk.name) + (pk.ranks > 1 ? ' ' + ((sh.perks[pk.id] || 0) + 1) + '/' + pk.ranks : '') + '</span></div>').join('') || '<div class="dim">Нет доступных перков.</div>';
        const pk = list[sel];
        det.innerHTML = pk ? '<b>' + esc(pk.name) + '</b><div>' + esc(pk.desc) + '</div><div class="dim" style="margin-top:8px">Требуется: уровень ' + pk.lvl + Object.entries(pk.req).map(([k, v]) => ', ' + (Z.STAT_IDS.includes(k) ? Z.statName(k) : Z.skillName(k)) + ' ' + v).join('') + '</div>' : '';
        foot.textContent = '↑↓ — выбор, Enter — взять перк';
      }
      wrap.querySelectorAll('.row').forEach(r => { r.addEventListener('mouseenter', () => { if (sel === +r.dataset.i) return; sel = +r.dataset.i; render(); }); r.addEventListener('click', () => { sel = +r.dataset.i; if (phase === 'perks') take(); else inc(1); }); });
    };
    const inc = d => {
      const id = Z.SKILLS[sel].id;
      const cur = add[id] || 0;
      if (d > 0 && (spent() >= left0 || sh.skillRaw(id) + cur >= 100)) return;
      if (d < 0 && cur <= 0) return;
      add[id] = cur + d;
      render();
    };
    const take = () => {
      const list = perks();
      const pk = list[sel];
      if (pk) {
        sh.perks[pk.id] = (sh.perks[pk.id] || 0) + 1;
        sh.pendingPerk--;
        if (pk.id === 'gto') { this.pickGtoStat(); }
        if (pk.id === 'vocation') this.pickExtraTag();
        p.refreshMax();
        g.msg('Новый перк: ' + pk.name, 'level');
      } else sh.pendingPerk = 0;
      finish();
    };
    const finish = () => { this.closePanel(panel); if ((sh.pendingSkill || 0) > 0 || (sh.pendingPerk || 0) > 0) this.openLevelUp(); };
    const next = () => {
      if (phase === 'skills') {
        for (const id in add) sh.points[id] = (sh.points[id] || 0) + add[id];
        sh.pendingSkill = Math.max(0, left0 - spent());
        if (sh.pendingSkill > 0) { left0 = sh.pendingSkill; for (const k in add) delete add[k]; render(); return; }
        if (sh.pendingPerk > 0 && perks().length) { phase = 'perks'; sel = 0; render(); return; }
        sh.pendingPerk = 0;
        finish();
      } else take();
    };
    wrap.querySelector('[data-k=ok]').addEventListener('click', next);
    panel.key = e => {
      const n = phase === 'skills' ? Z.SKILLS.length : Math.max(1, perks().length);
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { sel = (sel + n - 1) % n; render(); return true; }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { sel = (sel + 1) % n; render(); return true; }
      if (phase === 'skills' && (e.code === 'ArrowRight' || e.code === 'KeyD')) { inc(1); return true; }
      if (phase === 'skills' && (e.code === 'ArrowLeft' || e.code === 'KeyA')) { inc(-1); return true; }
      if (e.code === 'Enter') { next(); return true; }
      return false;
    };
    render();
    this.openPanel(panel);
  };

  U.pickGtoStat = function () {
    const p = this.game.player;
    const opts = Z.STATS.filter(s => p.sheet.stats[s.id] < 10).map(s => ({ label: s.short + ' ' + p.sheet.stats[s.id], fn: () => { p.sheet.stats[s.id]++; p.refreshMax(); } }));
    if (opts.length) this.message('Сдал нормы ГТО', 'Какую характеристику повысить?', opts, { modal: true });
  };

  U.pickExtraTag = function () {
    const p = this.game.player;
    const opts = Z.SKILLS.filter(s => !p.sheet.tags.includes(s.id)).map(s => ({ label: s.name, fn: () => { p.sheet.tags.push(s.id); } }));
    this.message('Призвание', 'Отметьте ещё один навык (+15):', opts, { modal: true });
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
