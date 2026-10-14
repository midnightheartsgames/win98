(function (O) {
  'use strict';
  const esc = O.esc;
  const urlCache = new Map();

  function purl(ui, heroId, skin, big, pose) {
    const key = (big ? 'B' : 'S') + heroId + ':' + (skin || 'classic') + ':' + (pose || '');
    if (urlCache.has(key)) return urlCache.get(key);
    const c = big ? ui.bigPortrait(heroId, skin, pose, 512) : ui.portrait(heroId, skin);
    const u = c ? c.toDataURL() : '';
    urlCache.set(key, u);
    return u;
  }
  function roleName(r) { return O.ROLES[r].ru; }
  function heroesByRole() { return O.ROLE_ORDER.map(r => ({ role: r, heroes: O.HERO_ORDER.filter(id => O.HEROES[id].role === r) })); }
  function click(ui) { ui.audio.init(); ui.audio.play('ui', { vol: 0.5 }); }
  function bindAll(root, sel, fn) { root.querySelectorAll(sel).forEach(el => el.addEventListener('click', e => fn(el, e))); }
  function backBtn() { return '<div class="ow-back" data-back><span class="ow-key">ESC</span> НАЗАД</div>'; }
  function badge(ui) {
    const p = ui.profile;
    return `<div class="ow-badge"><div class="ow-badge-soc" data-go="social" title="Друзья">${iconImg('support', 22, '#fff')}</div><div class="ow-badge-card"><img class="ow-badge-ico" src="${O.playerIconURL(p.icon || 0, 64)}" alt=""><div class="ow-badge-name">${esc(p.name.toUpperCase())}<small>#${p.tag}</small></div><div class="ow-badge-lvl">${p.level}</div></div></div>`;
  }
  function iconImg(id, size, col) { return `<img class="ow-ico" src="${O.iconURL(id, size * 2, col || '#fff')}" width="${size}" height="${size}" alt="">`; }
  function credits(ui) { return `<div class="ow-credits" title="Кредиты">${iconImg('coin', 18, '#ffd070')}<span data-credits>${ui.profile.credits}</span></div>`; }
  function botPose(h) { const l = O.Clips.list(h.heroId, 'pose'); return l.length ? 'pose:' + l[(h.id * 5 + 3) % l.length][0] : 'pose:heroic'; }
  function heroImg(ui, hero, skin, pose) { return `<img class="ow-stage-still" src="${purl(ui, hero, skin, true, pose || 'pose:heroic')}" alt="">`; }

  const S = {
    cur: null,
    show(ui, name, arg) {
      S.cur = name; S.arg = arg;
      S.stageCfg = null;
      ui.el.classList.toggle('menu', ['boot', 'title', 'main', 'play', 'custom', 'arcade', 'training', 'gallery', 'hero', 'boxes', 'social', 'career', 'options', 'cards', 'progress'].includes(name));
      ui.el.classList.toggle('in-match', name === 'hud');
      const f = S['s_' + name];
      if (f) f(ui, arg);
      else ui.layer.innerHTML = '';
      if (['main', 'play', 'gallery', 'boxes', 'social', 'career', 'options', 'training', 'custom', 'arcade', 'hero'].includes(name)) { ui.mode = 'menu'; if (!ui.menuMapId) ui.setMenuMap(S.menuMap(ui)); ui.audio.music('menu'); }
    },
    clear(ui) { ui.layer.innerHTML = ''; },
    menuMap(ui) {
      const avail = O.MAP_LIST.filter(m => O.MAPS[m.id]).map(m => m.id);
      const pref = ['volskaya', 'kingsrow', 'hanamura', 'ilios', 'dorado'].find(id => avail.includes(id));
      return pref || avail[0];
    },
    key(ui, e) {
      if (ui.overlay === 'heroes' || ui.overlay === 'pause') {
        if (e.code === 'Escape') { if (ui.overlay === 'heroes' && ui.game && !ui.game.player.heroId) return true; ui.closeOverlay(); return true; }
        if (ui.overlay === 'heroes' && (e.code === 'Enter' || e.code === 'Space')) { if (ui.game.player.heroId) ui.closeOverlay(); return true; }
        return ui.overlay === 'pause';
      }
      if (S.cur === 'title' || S.cur === 'boot') { S.show(ui, 'main'); return true; }
      if (ui.mode === 'menu' && e.code === 'Escape') {
        const modal = ui.layer.querySelector('.ow-modal');
        if (modal) { modal.remove(); return true; }
        const back = ui.layer.querySelector('[data-back]');
        if (back) { back.click(); return true; }
      }
      if (ui.mode === 'menu' && S.cur === 'hero' && S.heroKey && S.heroKey(ui, e)) return true;
      if (ui.mode === 'potg' && (e.code === 'Space' || e.code === 'Escape')) { ui.endReplay(); return true; }
      if (S.cur === 'cards' && (e.code === 'Space' || e.code === 'Enter')) { const n = ui.layer.querySelector('[data-next]'); if (n) n.click(); return true; }
      return false;
    },
    tick(ui, dt) {
      if (S.drawStage) S.drawStage(ui, dt);
      if (ui.overlay === 'heroes' && ui.game) {
        const el = ui.over.querySelector('[data-timer]');
        const g = ui.game;
        if (el) el.textContent = g.phase === 'assemble' ? O.fmtClock(g.phaseT) : g.phase === 'setup' ? O.fmtClock(g.phaseT) : '';
        if (S.hsDirty) { S.hsDirty = false; S.heroSelect(ui, S.hsInitial, true); }
        if (g.phase !== 'assemble' && S.hsInitial && g.player.heroId && S.hsAuto) { S.hsAuto = false; ui.closeOverlay(); }
      }
      if (S.cur === 'search' && S.searchT !== undefined) {
        S.searchT += dt;
        const el = ui.layer.querySelector('[data-stime]');
        if (el) el.textContent = O.fmtClock(S.searchT);
        if (S.searchT > S.searchDur) { const cfg = S.searchCfg; S.searchT = undefined; ui.startMatch(cfg); }
      }
      if (S.cur === 'title') { S.titleT = (S.titleT || 0) + dt; }
      if (S.cur === 'boot') { S.bootT = (S.bootT || 0) + dt; if (S.bootT > 2.2) S.show(ui, 'title'); }
    },

    s_error(ui) {
      ui.layer.innerHTML = `<div class="ow-error"><div class="ow-logo">OVERWATCH</div><p>Не удалось запустить 3D-ускоритель.</p><p class="ow-dim">${esc(ui.glError || '')}</p><p>Для игры нужен видеоадаптер с поддержкой OpenGL (WebGL).</p></div>`;
    },
    s_boot(ui) {
      S.bootT = 0;
      ui.layer.innerHTML = `<div class="ow-boot"><div class="ow-bliz"><div class="ow-bliz-word">BLIZZARD</div><div class="ow-bliz-sub">ENTERTAINMENT</div></div></div>`;
      ui.layer.querySelector('.ow-boot').addEventListener('click', () => S.show(ui, 'main'));
      setTimeout(() => { if (!ui.dead && !ui.menuMapId) ui.setMenuMap(S.menuMap(ui)); }, 80);
    },
    s_title(ui) {
      S.titleT = 0;
      ui.layer.innerHTML = `<div class="ow-titlescr"><div class="ow-logo big">OVERWATCH<sup>™</sup></div><div class="ow-press">НАЖМИТЕ ЛЮБУЮ КЛАВИШУ</div><div class="ow-copy">© 2000 Blizzard Entertainment. Версия 1.0.0.2 для Win 95/98.<br>Рекомендуется 3D-ускоритель: 3dfx Voodoo3, NVIDIA RIVA TNT2 или ATI Rage 128.</div></div>`;
      ui.layer.querySelector('.ow-titlescr').addEventListener('click', () => { click(ui); S.show(ui, 'main'); });
    },

    s_main(ui) {
      const p = ui.profile;
      const hero = p.lastHero || 'tracer';
      const skin = O.Profile.equipped(p, hero, 'skin');
      const [have, total] = O.Profile.unlockCount(p, hero);
      const fresh = Object.keys(p.fresh || {}).length > 0;
      ui.layer.innerHTML = `
        <div class="ow-main">
          <div class="ow-main-left">
            <div class="ow-logo sm">OVERWATCH<sup>™</sup></div>
            <div class="ow-ver">1.0.0.2 - 20001</div>
            <nav class="ow-nav">
              <a class="big" data-go="play">ИГРАТЬ</a>
              <a class="big" data-go="training">ТРЕНИРОВКА</a>
              <a class="big" data-go="gallery">ГАЛЕРЕЯ ГЕРОЕВ ${fresh ? '<span class="ow-new">NEW!</span>' : ''}</a>
              <a class="big" data-go="boxes">КОНТЕЙНЕРЫ ${p.boxes ? `<span class="ow-count">${p.boxes}</span>` : ''}</a>
              <a data-go="social">СОЦИАЛЬНОЕ</a>
              <a data-go="career">ПРОФИЛЬ</a>
              <a data-go="options">НАСТРОЙКИ</a>
              <a data-go="exit">ВЫЙТИ ИЗ ИГРЫ</a>
            </nav>
          </div>
          <div class="ow-main-hero ow-stage-slot" data-stage></div>
          <div class="ow-main-heroname"><div class="n">${esc(O.HEROES[hero].name)}</div><div class="c">${have}/${total} ПРЕДМЕТОВ</div></div>
          ${badge(ui)}
          <div class="ow-chathint">НАЖМИТЕ ENTER ДЛЯ ЧАТА</div>
          ${p.party.length ? `<div class="ow-partymini">ГРУППА: ${p.party.map(f => esc(f.name)).join(', ')}</div>` : ''}
        </div>`;
      bindAll(ui.layer, '[data-go]', el => {
        click(ui);
        const go = el.dataset.go;
        if (go === 'exit') { if (ui.opts0.onExit) ui.opts0.onExit(); else S.show(ui, 'title'); return; }
        S.show(ui, go);
      });
      S.mountStage(ui, ui.layer.querySelector('[data-stage]'), { key: 'main:' + hero + ':' + skin, hero, skin, yaw: -0.4, still: () => heroImg(ui, hero, skin) });
    },

    s_play(ui) {
      const p = ui.profile;
      const compOk = p.level >= 5;
      ui.layer.innerHTML = `
        <div class="ow-page">
          <div class="ow-h1">ИГРАТЬ</div>
          <div class="ow-modes">
            <div class="ow-mode" data-m="quick"><div class="t">БЫСТРАЯ ИГРА</div><div class="d">Матч 6×6 на случайной карте. Защита, атака, контроль — всё как обычно. Опыт и контейнеры.</div></div>
            <div class="ow-mode ${compOk ? '' : 'locked'}" data-m="comp"><div class="t">СОРЕВНОВАТЕЛЬНАЯ ИГРА</div><div class="d">${compOk ? (p.comp.placed ? 'Рейтинг: ' + p.comp.sr + ' (' + O.Profile.tier(p.comp.sr).name + ')' : 'Квалификация: ' + Math.min(5, p.comp.games) + '/5 матчей') : 'Доступна с 5 уровня'}</div></div>
            <div class="ow-mode" data-m="ai"><div class="t">ИГРА ПРОТИВ ИИ</div><div class="d">Вы и союзники против команды ботов.</div>
              <div class="ow-seg" data-seg="diff"><span data-v="0">ЛЕГКО</span><span data-v="1" class="on">СРЕДНЕ</span><span data-v="2">СЛОЖНО</span></div></div>
            <div class="ow-mode" data-m="arcade"><div class="t">АРКАДА</div><div class="d">Загадочные герои, полный хаос и бои без ограничений.</div></div>
            <div class="ow-mode" data-m="custom"><div class="t">ПОЛЬЗОВАТЕЛЬСКИЙ МАТЧ</div><div class="d">Выберите карту, сторону, сложность ботов и правила.</div></div>
          </div>
          ${backBtn()}
          ${badge(ui)}
        </div>`;
      let diff = 1;
      bindAll(ui.layer, '[data-seg] span', (el, e) => { e.stopPropagation(); click(ui); diff = +el.dataset.v; el.parentNode.querySelectorAll('span').forEach(s => s.classList.toggle('on', s === el)); });
      bindAll(ui.layer, '[data-m]', el => {
        click(ui);
        const m = el.dataset.m;
        if (m === 'quick') S.search(ui, { kind: 'quick', party: ui.profile.party });
        else if (m === 'comp') { if (compOk) S.search(ui, { kind: 'comp', party: ui.profile.party }); }
        else if (m === 'ai') S.search(ui, { kind: 'ai', diff, party: ui.profile.party });
        else S.show(ui, m);
      });
      S.bindBack(ui, 'main');
    },

    search(ui, cfg) {
      S.cur = 'search';
      S.searchT = 0; S.searchDur = 1.5 + Math.random() * 2.5; S.searchCfg = cfg;
      const box = document.createElement('div');
      box.className = 'ow-search';
      box.innerHTML = `<div class="ow-spin"></div><div><div class="t">ПОИСК ИГРЫ</div><div class="d">${{ quick: 'Быстрая игра', comp: 'Соревновательная игра', ai: 'Игра против ИИ' }[cfg.kind] || ''} · Прошло <span data-stime>0:00</span> · Примерно 0:05</div></div><div class="x" data-cancel>ОТМЕНА</div>`;
      ui.layer.appendChild(box);
      box.querySelector('[data-cancel]').addEventListener('click', () => { S.searchT = undefined; S.show(ui, 'play'); });
    },

    bindBack(ui, to) { const b = ui.layer.querySelector('[data-back]'); if (b) b.addEventListener('click', () => { click(ui); S.show(ui, to); }); const soc = ui.layer.querySelector('.ow-badge [data-go]'); if (soc) soc.addEventListener('click', () => { click(ui); S.show(ui, 'social'); }); },

    s_arcade(ui) {
      ui.layer.innerHTML = `
        <div class="ow-page">
          <div class="ow-h1">АРКАДА</div>
          <div class="ow-modes">
            <div class="ow-mode" data-a="mystery"><div class="t">ЗАГАДОЧНЫЕ ГЕРОИ</div><div class="d">После каждой гибели вы возрождаетесь случайным героем.</div></div>
            <div class="ow-mode" data-a="mayhem"><div class="t">ПОЛНЫЙ ХАОС</div><div class="d">Способности перезаряжаются в четыре раза быстрее, а здоровья вдвое больше.</div></div>
            <div class="ow-mode" data-a="nolimits"><div class="t">БЕЗ ОГРАНИЧЕНИЙ</div><div class="d">Любой состав команды. Шесть Райнхардтов? Почему бы и нет.</div></div>
          </div>
          ${backBtn()}${badge(ui)}
        </div>`;
      bindAll(ui.layer, '[data-a]', el => {
        click(ui);
        const a = el.dataset.a;
        const rules = a === 'mystery' ? { mystery: true } : a === 'mayhem' ? { cdMul: 0.25, hpMul: 2 } : { noLimits: true };
        S.search(ui, { kind: 'quick', rules, arcade: a, party: ui.profile.party });
      });
      S.bindBack(ui, 'play');
    },

    s_custom(ui) {
      const maps = [];
      for (const m of O.MAP_LIST) {
        if (!O.MAPS[m.id]) continue;
        if (m.stages) m.stages.forEach((s, i) => maps.push({ v: m.id + ':' + i, n: m.name + ' — ' + s }));
        else maps.push({ v: m.id + ':0', n: m.name + ' (' + O.MODE_INFO[m.mode].ru.toLowerCase() + ')' });
      }
      const sel = (name, opts, v) => `<select data-f="${name}">${opts.map(o => `<option value="${o.v}" ${String(o.v) === String(v) ? 'selected' : ''}>${esc(o.n)}</option>`).join('')}</select>`;
      const dif = [{ v: 0.2, n: 'Легко' }, { v: 0.75, n: 'Средне' }, { v: 1.35, n: 'Сложно' }, { v: 1.9, n: 'Эксперт' }];
      ui.layer.innerHTML = `
        <div class="ow-page">
          <div class="ow-h1">ПОЛЬЗОВАТЕЛЬСКИЙ МАТЧ</div>
          <div class="ow-form">
            <label>КАРТА ${sel('map', maps, maps[0].v)}</label>
            <label>ВАША СТОРОНА ${sel('side', [{ v: 'random', n: 'Случайно' }, { v: 0, n: 'Атака' }, { v: 1, n: 'Оборона' }], 'random')}</label>
            <label>СОЮЗНЫЕ БОТЫ ${sel('ally', dif, 0.75)}</label>
            <label>ВРАЖЕСКИЕ БОТЫ ${sel('enemy', dif, 0.75)}</label>
            <label>ИГРОКОВ В КОМАНДЕ ${sel('size', [2, 3, 4, 5, 6].map(v => ({ v, n: v + ' × ' + v })), 6)}</label>
            <label class="chk"><input type="checkbox" data-f="nolimits"> БЕЗ ОГРАНИЧЕНИЯ ГЕРОЕВ</label>
            <label class="chk"><input type="checkbox" data-f="mystery"> ЗАГАДОЧНЫЕ ГЕРОИ</label>
            <label class="chk"><input type="checkbox" data-f="mayhem"> ПОЛНЫЙ ХАОС</label>
            <label class="chk"><input type="checkbox" data-f="fast"> БЫСТРОЕ НАЧАЛО (без подготовки)</label>
            <div class="ow-btn big" data-start>НАЧАТЬ</div>
          </div>
          ${backBtn()}${badge(ui)}
        </div>`;
      const f = n => ui.layer.querySelector(`[data-f="${n}"]`);
      ui.layer.querySelector('[data-start]').addEventListener('click', () => {
        click(ui);
        const [map, st] = f('map').value.split(':');
        const side = f('side').value;
        const rules = {};
        if (f('nolimits').checked) rules.noLimits = true;
        if (f('mystery').checked) rules.mystery = true;
        if (f('mayhem').checked) { rules.cdMul = 0.25; rules.hpMul = 2; }
        ui.startMatch({ kind: 'custom', map, stage: +st, attack: side === 'random' ? 'random' : +side, allySkill: +f('ally').value, enemySkill: +f('enemy').value, size: +f('size').value, rules, setup: f('fast').checked ? 3 : 25, assemble: f('fast').checked ? 12 : 20 });
      });
      S.bindBack(ui, 'play');
    },

    s_training(ui) {
      ui.layer.innerHTML = `
        <div class="ow-page">
          <div class="ow-h1">ТРЕНИРОВКА</div>
          <div class="ow-modes">
            <div class="ow-mode" data-t="tutorial"><div class="t">ОБУЧЕНИЕ</div><div class="d">Основы боя на примере Солдата-76: движение, стрельба, способности и суперспособность.</div></div>
            <div class="ow-mode" data-t="range"><div class="t">ТРЕНИРОВОЧНЫЙ ПОЛИГОН</div><div class="d">Опробуйте любого героя на тренировочных роботах. Героя можно менять в любой момент клавишей H.</div></div>
            <div class="ow-mode" data-t="vsai"><div class="t">ТРЕНИРОВКА ПРОТИВ ИИ</div><div class="d">Короткий бой против лёгких ботов без влияния на статистику.</div></div>
          </div>
          ${backBtn()}${badge(ui)}
        </div>`;
      bindAll(ui.layer, '[data-t]', el => {
        click(ui);
        const t = el.dataset.t;
        if (!O.MAPS.range) { S.search(ui, { kind: 'ai', diff: 0 }); return; }
        if (t === 'tutorial') ui.startMatch({ kind: 'tutorial', map: 'range', mode: 'practice', hero: 'soldier', rules: { practice: true, tutorial: true, respawn: 3 }, assemble: 0, setup: 0, teams: O.RANGE_TEAMS ? O.RANGE_TEAMS(ui, true) : undefined });
        else if (t === 'range') ui.startMatch({ kind: 'practice', map: 'range', mode: 'practice', rules: { practice: true, respawn: 3 }, assemble: 60, setup: 0, teams: O.RANGE_TEAMS ? O.RANGE_TEAMS(ui, false) : undefined });
        else ui.startMatch({ kind: 'practice', diff: 0, allySkill: 0.8, enemySkill: 0.2, attack: 'random' });
      });
      S.bindBack(ui, 'main');
    },

    s_boxes(ui, arg) {
      const p = ui.profile;
      const items = arg && arg.items;
      const card = (r, i) => {
        const it = r.item;
        const t = it ? O.COSMETIC_TYPES.find(x => x.id === it.type) : null;
        const kind = t ? O.RARITY[r.rar].g[t.g] + ' ' + t.one : 'КРЕДИТЫ';
        const who = it ? (it.hero ? O.HEROES[it.hero].name : 'ВСЕ ГЕРОИ') : 'НА ПОКУПКУ ПРЕДМЕТОВ';
        const name = it && it.type === 'voice' ? '«' + r.name + '»' : r.name;
        return `<div class="ow-loot ${r.rar}" style="--rar:${O.RARITY[r.rar].col};--i:${i}"><div class="pic ${it ? it.type : 'credits'}">${S.itemPic(ui, it, 88)}</div><div class="rr">${kind}</div><div class="nm">${esc(name)}</div><div class="tp">${esc(who)}</div>${r.dup ? `<div class="dup">ПОВТОР · +${r.credits} ${iconImg('coin', 12, '#ffd070')}</div>` : ''}</div>`;
      };
      ui.layer.innerHTML = `
        <div class="ow-page ow-boxes">
          <div class="ow-h1">КОНТЕЙНЕРЫ</div>
          <div class="ow-boxstage">${items ? `<div class="ow-lootrow">${items.map(card).join('')}</div>` : `<div class="ow-box3d ${p.boxes ? '' : 'empty'}"><div class="lid"></div><div class="body"><div class="logo"></div></div></div>`}</div>
          <div class="ow-boxbar" data-boxbar></div>
          ${badge(ui)}${credits(ui)}
          ${backBtn()}
        </div>`;
      S.boxBar(ui);
      ui.layer.querySelector('[data-boxbar]').addEventListener('click', e => {
        if (!e.target.closest('[data-open]') || !p.boxes) return;
        click(ui);
        const box = ui.layer.querySelector('.ow-box3d');
        if (box) box.classList.add('opening');
        ui.audio.play('boxOpen', { vol: 0.8 });
        setTimeout(() => {
          if (S.cur !== 'boxes') return;
          const res = O.Profile.openBox(p);
          O.Profile.save(p);
          if (res && res.some(r => r.rar === 'legendary')) ui.audio.play('legendary', { vol: 0.7 });
          S.show(ui, 'boxes', { items: res });
        }, box ? 1100 : 10);
      });
      S.bindBack(ui, 'main');
    },

    boxBar(ui) {
      const bar = ui.layer.querySelector('[data-boxbar]');
      if (!bar) return;
      const p = ui.profile;
      bar.innerHTML = `<div class="ow-boxcount">${p.boxes}<small>ДОСТУПНО</small></div>${p.boxes ? `<div class="ow-btn big" data-open>ОТКРЫТЬ</div>` : `<div class="ow-dim">Новые контейнеры выдаются за каждый новый уровень.</div>`}`;
      const cr = ui.layer.querySelector('[data-credits]');
      if (cr) cr.textContent = p.credits;
    },

    onBoxes(ui) {
      if (S.cur === 'boxes') { S.boxBar(ui); const b = ui.layer.querySelector('.ow-box3d.empty'); if (b && ui.profile.boxes) b.classList.remove('empty'); }
      else if (S.cur === 'main') S.show(ui, 'main');
    },

    toast(ui, title, text) {
      const old = ui.el.querySelector('.ow-toast');
      if (old) old.remove();
      const el = document.createElement('div');
      el.className = 'ow-toast';
      el.innerHTML = `${iconImg('lootbox', 26, '#f99e1a')}<div><b>${esc(title)}</b><span>${esc(text || '')}</span></div>`;
      ui.el.appendChild(el);
      setTimeout(() => el.remove(), 2600);
    },

    s_social(ui) {
      const p = ui.profile;
      const st = { online: ['В СЕТИ', '#6f6'], game: ['В ИГРЕ', '#fc4'], away: ['ОТОШЁЛ', '#fa6'], offline: ['НЕ В СЕТИ', '#999'] };
      const inParty = f => p.party.some(x => x.name === f.name);
      ui.layer.innerHTML = `
        <div class="ow-page ow-social">
          <div class="ow-h1">СОЦИАЛЬНОЕ</div>
          <div class="ow-soc-cols">
            <div class="ow-panel">
              <div class="ow-h2">ДРУЗЬЯ BATTLE.NET</div>
              ${p.friends.map((f, i) => `<div class="ow-friend ${f.status}"><img src="${purl(ui, f.hero, 'classic')}"><div class="nm">${esc(f.name)}<small>#${f.tag} · уровень ${f.level}</small></div><div class="st" style="color:${st[f.status][1]}">${st[f.status][0]}${f.status === 'game' ? ' · ' + esc(O.MAP_LIST[i % O.MAP_LIST.length].name) : ''}</div>${f.status !== 'offline' && !inParty(f) && p.party.length < 5 ? `<div class="ow-btn sm" data-inv="${i}">ПРИГЛАСИТЬ</div>` : inParty(f) ? '<span class="ow-dim">В ГРУППЕ</span>' : ''}</div>`).join('')}
              <div class="ow-addf"><input type="text" maxlength="16" placeholder="ИмяИгрока" data-addname><div class="ow-btn sm" data-add>ДОБАВИТЬ</div></div>
            </div>
            <div class="ow-panel">
              <div class="ow-h2">ГРУППА (${p.party.length + 1}/6)</div>
              <div class="ow-friend lead"><div class="nm">${esc(p.name)} <small>(вы)</small></div></div>
              ${p.party.map((f, i) => `<div class="ow-friend"><img src="${purl(ui, f.hero, 'classic')}"><div class="nm">${esc(f.name)}<small>предпочитает ${esc(O.HEROES[f.hero].name)}</small></div><div class="ow-btn sm" data-kick="${i}">ИСКЛЮЧИТЬ</div></div>`).join('')}
              <div class="ow-dim">Участники группы играют в вашей команде в быстрой, соревновательной игре и против ИИ.</div>
              <div class="ow-h2" style="margin-top:18px">ВАШЕ ИМЯ</div>
              <div class="ow-addf"><input type="text" maxlength="14" value="${esc(p.name)}" data-myname><div class="ow-btn sm" data-rename>СОХРАНИТЬ</div></div>
            </div>
          </div>
          ${backBtn()}
        </div>`;
      bindAll(ui.layer, '[data-inv]', el => { click(ui); const f = p.friends[+el.dataset.inv]; p.party.push({ name: f.name, hero: f.hero }); O.Profile.save(p); ui.audio.say(f.name + ' присоединяется к группе'); S.show(ui, 'social'); });
      bindAll(ui.layer, '[data-kick]', el => { click(ui); p.party.splice(+el.dataset.kick, 1); O.Profile.save(p); S.show(ui, 'social'); });
      ui.layer.querySelector('[data-add]').addEventListener('click', () => {
        const v = ui.layer.querySelector('[data-addname]').value.trim().replace(/[^\wА-Яа-яЁё]/g, '').slice(0, 16);
        if (!v || p.friends.some(f => f.name === v)) return;
        click(ui);
        p.friends.push({ name: v, tag: 1000 + (Math.random() * 8999 | 0), level: 1 + (Math.random() * 40 | 0), status: Math.random() < 0.6 ? 'online' : 'offline', hero: O.pick(Math.random, O.HERO_ORDER) });
        O.Profile.save(p); S.show(ui, 'social');
      });
      ui.layer.querySelector('[data-rename]').addEventListener('click', () => {
        const v = ui.layer.querySelector('[data-myname]').value.trim().replace(/[^\wА-Яа-яЁё]/g, '').slice(0, 14);
        if (!v) return;
        click(ui); p.name = v; O.Profile.save(p); S.show(ui, 'social');
      });
      S.bindBack(ui, 'main');
    },

    s_career(ui, arg) {
      const p = ui.profile, s = p.stats;
      const tab = (arg && arg.tab) || 'stats';
      const heroes = Object.entries(s.hero).sort((a, b) => b[1].time - a[1].time);
      const maxT = heroes.length ? heroes[0][1].time : 1;
      const sel = (arg && arg.hero) || (heroes[0] && heroes[0][0]);
      const hs = sel ? s.hero[sel] : null;
      const hrs = t => (t / 3600 >= 1 ? (t / 3600).toFixed(1) + ' ч' : Math.round(t / 60) + ' мин');
      const tier = p.comp.placed ? O.Profile.tier(p.comp.sr) : null;
      let body = '';
      if (tab === 'icons') {
        const icons = O.iconCatalog();
        const cur = String(p.icon || 0);
        const it = icons.find(i => i.key === String(arg && arg.sel !== undefined ? arg.sel : cur)) || icons[0];
        const own = O.Profile.owns(p, it), on = it.key === cur, price = O.RARITY[it.rar].price;
        const act = own ? (on ? '<div class="ow-btn big done">ВЫБРАНО</div>' : '<div class="ow-btn big primary" data-iact>ВЫБРАТЬ</div>') : p.credits >= price ? `<div class="ow-btn big primary" data-iact>КУПИТЬ · ${price} ${iconImg('coin', 18, '#fff')}</div>` : `<div class="ow-btn big off">НУЖНО ${price} КРЕДИТОВ</div>`;
        body = `
          <div class="ow-iconpage">
            <div class="ow-panel ow-icongrid">${icons.map(x => `<div class="ow-picon ${O.Profile.owns(p, x) ? '' : 'locked'} ${x.key === cur ? 'on' : ''} ${x === it ? 'sel' : ''}" data-ic="${x.key}" style="--rar:${O.RARITY[x.rar].col}" title="${esc(x.name)}"><img src="${O.playerIconURL(+x.key, 64)}" alt="">${O.Profile.owns(p, x) ? (x.key === cur ? `<span class="st">${iconImg('check', 14, '#7dff5a')}</span>` : '') : `<span class="st">${iconImg('lock', 12, '#fff')}</span>`}</div>`).join('')}</div>
            <div class="ow-panel ow-iconinfo" style="--rar:${O.RARITY[it.rar].col}">
              <img class="big" src="${O.playerIconURL(+it.key, 128)}" alt="">
              <div class="nm">${esc(it.name.toUpperCase())}</div>
              <div class="ow-rarplate">${O.RARITY[it.rar].g.f} ИКОНКА ИГРОКА</div>
              <div class="ow-dim">${own ? 'Иконка видна рядом с вашим именем в меню и в профиле.' : 'Выпадает из контейнеров. Можно купить за кредиты.'}</div>
              ${act}
            </div>
          </div>`;
      } else body = `
          <div class="ow-soc-cols">
            <div class="ow-panel">
              <div class="ow-h2">ОБЩАЯ СТАТИСТИКА</div>
              <div class="ow-statgrid">
                ${[['Матчей', s.games], ['Побед', s.wins], ['Поражений', s.losses], ['Время в игре', hrs(s.time)], ['Убийств', s.elims], ['Смертей', s.deaths], ['Урон', Math.round(s.dmg)], ['Лечение', Math.round(s.heal)], ['Время у цели', hrs(s.objTime)], ['Золотые медали', s.medals.gold], ['Серебряные', s.medals.silver], ['Бронзовые', s.medals.bronze], ['Лучший момент', s.potg]].map(([n, v]) => `<div><small>${n}</small><b>${v}</b></div>`).join('')}
              </div>
            </div>
            <div class="ow-panel">
              <div class="ow-h2">ЛУЧШИЕ ГЕРОИ</div>
              ${heroes.length ? heroes.map(([id, h]) => `<div class="ow-tophero ${id === sel ? 'on' : ''}" data-h="${id}"><img src="${purl(ui, id, 'classic')}"><div class="nm">${esc(O.HEROES[id].name)}</div><div class="bar"><div style="width:${Math.round(h.time / maxT * 100)}%"></div></div><div class="v">${hrs(h.time)}</div></div>`).join('') : '<div class="ow-dim">Сыграйте матч, чтобы здесь появилась статистика.</div>'}
              ${hs ? `<div class="ow-h2" style="margin-top:14px">${esc(O.HEROES[sel].name)}</div><div class="ow-statgrid">${[['Матчей', hs.games], ['Побед', hs.wins], ['Убийств', hs.elims], ['Смертей', hs.deaths], ['Урон', Math.round(hs.dmg)], ['Лечение', Math.round(hs.heal)], ['Рекорд убийств', hs.best], ['Рекорд урона', Math.round(hs.bestDmg)]].map(([n, v]) => `<div><small>${n}</small><b>${v}</b></div>`).join('')}</div>` : ''}
            </div>
          </div>`;
      ui.layer.innerHTML = `
        <div class="ow-page ow-career">
          <div class="ow-career-head">
            <img class="ow-career-ico" src="${O.playerIconURL(p.icon || 0, 128)}" alt="">
            <div class="ow-lvlring"><span>${p.level}</span></div>
            <div><div class="ow-h1" style="margin:0">${esc(p.name.toUpperCase())}<small> #${p.tag}</small></div>
            <div class="ow-dim">Опыт: ${p.xp} / ${O.Profile.xpNeed(p.level)} · Контейнеры: ${p.boxes} · Кредиты: ${p.credits}</div>
            ${tier ? `<div class="ow-sr" style="color:${tier.col}">РЕЙТИНГ ${p.comp.sr} · ${tier.name.toUpperCase()} (лучший ${p.comp.best})</div>` : `<div class="ow-dim">Соревновательная игра: квалификация ${Math.min(5, p.comp.games)}/5</div>`}</div>
          </div>
          <div class="ow-tabs">${[['stats', 'СТАТИСТИКА'], ['icons', 'ИКОНКИ ИГРОКА']].map(([k, n]) => `<span data-tab="${k}" class="${k === tab ? 'on' : ''}">${n}</span>`).join('')}</div>
          ${body}
          ${backBtn()}
        </div>`;
      bindAll(ui.layer, '[data-tab]', el => { click(ui); S.show(ui, 'career', { tab: el.dataset.tab }); });
      bindAll(ui.layer, '[data-h]', el => { click(ui); S.show(ui, 'career', { hero: el.dataset.h }); });
      bindAll(ui.layer, '[data-ic]', el => { click(ui); S.show(ui, 'career', { tab: 'icons', sel: el.dataset.ic }); });
      const ia = ui.layer.querySelector('[data-iact]');
      if (ia) ia.addEventListener('click', () => {
        const it = O.iconCatalog().find(x => x.key === String(arg && arg.sel !== undefined ? arg.sel : p.icon || 0));
        if (!it) return;
        if (!O.Profile.owns(p, it)) {
          if (!ia.classList.contains('confirm')) { click(ui); ia.classList.add('confirm'); ia.innerHTML = `ПОДТВЕРДИТЬ · ${O.RARITY[it.rar].price} ${iconImg('coin', 18, '#fff')}`; return; }
          if (!O.Profile.buy(p, it)) return;
          ui.audio.play('armorUp');
        } else click(ui);
        p.icon = +it.key;
        O.Profile.save(p);
        S.show(ui, 'career', { tab: 'icons', sel: it.key });
      });
      S.bindBack(ui, 'main');
    },

    s_options(ui, arg) {
      const o = ui.opts;
      const tab = (arg && arg.tab) || 'video';
      const sel = (k, opts) => `<select data-o="${k}">${opts.map(([v, n]) => `<option value="${v}" ${String(o[k]) === String(v) ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
      const rng = (k, min, max, step) => `<input type="range" data-o="${k}" min="${min}" max="${max}" step="${step}" value="${o[k]}"><span class="v">${o[k]}</span>`;
      const chk = k => `<input type="checkbox" data-o="${k}" ${o[k] !== false ? 'checked' : ''}>`;
      const tabs = { video: 'ВИДЕО', sound: 'ЗВУК', controls: 'УПРАВЛЕНИЕ', game: 'ИГРОВОЙ ПРОЦЕСС' };
      let body = '';
      if (tab === 'video') body = `
        <label>РАЗРЕШЕНИЕ ${sel('res', [['240', '320×240 (программный)'], ['360', '512×384'], ['480', '640×480'], ['600', '800×600'], ['768', '1024×768'], ['native', 'Как у окна']])}</label>
        <label>ФИЛЬТРАЦИЯ ТЕКСТУР ${sel('filter', [['linear', 'Билинейная (Voodoo)'], ['nearest', 'Без фильтрации (Software)']])}</label>
        <label>ТЕНИ НА КАРТЕ ${chk('shadows')} <span class="ow-dim">применяется при загрузке карты</span></label>
        <label>СВЕЧЕНИЕ И ВИНЬЕТКА ${chk('post')} <span class="ow-dim">блум вокруг вспышек, неона и солнца</span></label>
        <label>ПОЛЕ ЗРЕНИЯ ${rng('fov', 70, 103, 1)}</label>
        <label>ПОКАЗЫВАТЬ FPS ${chk('fps')}</label>`;
      else if (tab === 'sound') body = `
        <label>ОБЩАЯ ГРОМКОСТЬ ${rng('vol', 0, 1, 0.05)}</label>
        <label>МУЗЫКА ${rng('music', 0, 1, 0.05)}</label>
        <label>ГОЛОСОВЫЕ РЕПЛИКИ И ДИКТОР ${chk('voice')}</label>`;
      else if (tab === 'controls') body = `
        <label>ЧУВСТВИТЕЛЬНОСТЬ МЫШИ ${rng('sens', 1, 15, 0.5)}</label>
        <label>ИНВЕРСИЯ ОСИ Y ${chk('invert')}</label>
        <div class="ow-keys">${[['W A S D', 'Движение'], ['ПРОБЕЛ', 'Прыжок'], ['CTRL', 'Присесть'], ['ЛКМ / ПКМ', 'Основной / доп. огонь'], ['SHIFT', 'Способность 1'], ['E', 'Способность 2'], ['Q', 'Суперспособность'], ['R', 'Перезарядка'], ['V', 'Ближний бой'], ['1 / 2, колесо', 'Смена оружия'], ['H', 'Сменить героя (на базе)'], ['TAB', 'Статистика'], ['T', 'Граффити'], ['B', 'Эмоция'], ['X / Z / C', 'Лечение / Сбор / Статус ульты'], ['F7', 'Отладка: +5 контейнеров']].map(([k, n]) => `<div><span class="ow-key">${k}</span> ${n}</div>`).join('')}</div>`;
      else body = `
        <label>ИМЕНА СОЮЗНИКОВ НАД ГОЛОВОЙ ${chk('names')}</label>
        <label>ПОВТОР УБИЙСТВА ${chk('killcam')}</label>
        <label>ЦВЕТ ПРИЦЕЛА ${sel('xcol', [['#6fff6f', 'Зелёный'], ['#ffffff', 'Белый'], ['#ff5a5a', 'Красный'], ['#5ad4ff', 'Голубой'], ['#ffe040', 'Жёлтый']])}</label>
        <div class="ow-btn sm" data-reset>СБРОСИТЬ ПРОФИЛЬ</div>`;
      ui.layer.innerHTML = `
        <div class="ow-page ow-options">
          <div class="ow-h1">НАСТРОЙКИ</div>
          <div class="ow-tabs">${Object.entries(tabs).map(([k, n]) => `<span data-tab="${k}" class="${k === tab ? 'on' : ''}">${n}</span>`).join('')}</div>
          <div class="ow-form">${body}</div>
          ${backBtn()}
        </div>`;
      bindAll(ui.layer, '[data-tab]', el => { click(ui); S.show(ui, 'options', { tab: el.dataset.tab }); });
      ui.layer.querySelectorAll('[data-o]').forEach(el => {
        el.addEventListener(el.type === 'range' ? 'input' : 'change', () => {
          const k = el.dataset.o;
          let v = el.type === 'checkbox' ? el.checked : el.type === 'range' ? +el.value : el.value;
          o[k] = v;
          if (el.nextElementSibling && el.nextElementSibling.classList.contains('v')) el.nextElementSibling.textContent = v;
          ui.saveOpts();
        });
      });
      const rs = ui.layer.querySelector('[data-reset]');
      if (rs) rs.addEventListener('click', () => {
        if (!rs.classList.contains('confirm')) { rs.classList.add('confirm'); rs.textContent = 'ТОЧНО СБРОСИТЬ? НАЖМИТЕ ЕЩЁ РАЗ'; return; }
        const keep = ui.profile.opts;
        ui.profile = O.Profile.defaults(); ui.profile.opts = keep; ui.profile.friends = O.Profile.makeFriends(ui.profile);
        O.Profile.save(ui.profile); S.show(ui, 'main');
      });
      S.bindBack(ui, 'main');
    },

    s_loading(ui, a) {
      const m = O.MAP_LIST.find(x => x.id === a.map) || { name: a.map === 'range' ? 'ТРЕНИРОВОЧНЫЙ ПОЛИГОН' : a.map, loc: '', blurb: '' };
      const mode = a.mode === 'practice' ? 'ТРЕНИРОВКА' : O.MODE_INFO[a.mode] ? O.MODE_INFO[a.mode].ru : '';
      const side = a.mode === 'control' || a.mode === 'practice' ? '' : a.attack === 0 ? 'АТАКА' : 'ОБОРОНА';
      const tips = ['Ангел может воскресить сразу нескольких союзников.', 'Щит Райнхардта не останавливает Огненный удар.', 'Трейсер восстанавливает здоровье Возвратом.', 'Турбосвин притягивает цель крюком — держитесь за укрытиями.', 'Дзенъятта: сфера раздора усиливает урон по цели всей команды.', 'Капкан Крысавчика хорошо ставить за углом.', 'Торбьорн чинит турель ударами молота.', 'Уинстон бьёт тесла-пушкой нескольких врагов сразу.', 'Лусио ускоряет союзников — пригодится при атаке.', 'Роковая вдова наносит больше урона заряженным выстрелом в голову.'];
      ui.layer.innerHTML = `
        <div class="ow-loading" style="--mc:${{ hanamura: '#f7c5d4', volskaya: '#a89ad8', dorado: '#f0a050', gibraltar: '#8ac4f0', hollywood: '#f0d090', kingsrow: '#6a80b8', ilios: '#70c8f0', lijiang: '#f06050', range: '#9ab' }[a.map] || '#9ab'}">
          <div class="ow-load-art"></div>
          <div class="ow-load-info">
            <div class="ow-load-name">${esc(m.name)}${m.stages && a.stage !== undefined ? `<small>${esc(m.stages[a.stage])}</small>` : ''}</div>
            <div class="ow-load-mode">${mode}${m.loc ? ' · ' + esc(m.loc) : ''}</div>
            ${side ? `<div class="ow-load-side ${side === 'АТАКА' ? 'att' : 'def'}">${side}</div>` : ''}
            <div class="ow-load-blurb">${esc(m.blurb || '')}</div>
            ${O.MODE_INFO[a.mode] ? `<div class="ow-load-rule">${esc(O.MODE_INFO[a.mode].rule)}</div>` : ''}
            <div class="ow-load-tip">СОВЕТ: ${esc(O.pick(Math.random, tips))}</div>
            <div class="ow-load-bar"><div></div></div>
          </div>
        </div>`;
    },

    s_hud(ui) {
      ui.layer.innerHTML = '';
    },

    heroSelect(ui, initial, redraw) {
      const g = ui.game, p = g.player;
      if (!redraw) { S.hsInitial = !!initial; S.hsAuto = !!initial; S.hsPick = p.heroId || p.pendingHero || null; }
      const team = g.heroes.filter(h => h.team === p.team);
      const taken = new Map();
      for (const h of team) if (h !== p && (h.heroId || h.pendingHero)) taken.set(h.heroId || h.pendingHero, h);
      const pick = S.hsPick;
      const comp = team.map(h => (h === p ? pick : (h.heroId || h.pendingHero))).filter(Boolean).map(id => O.HEROES[id].role);
      const warn = [];
      if (!comp.includes('support')) warn.push('НЕТ ГЕРОЯ ПОДДЕРЖКИ');
      if (!comp.includes('tank')) warn.push('НЕТ ТАНКА');
      if (team.filter(h => (h === p ? pick : h.heroId) === 'widowmaker').length && comp.filter(r => r === 'defense').length > 2) warn.push('МНОГО ГЕРОЕВ ЗАЩИТЫ');
      const map = O.MAP_LIST.find(m => m.id === g.mapId) || { name: 'ПОЛИГОН' };
      const att = g.mode === 'control' || g.mode === 'practice' ? '' : g.roleOf(p.team) === 'att' ? 'АТАКА' : 'ОБОРОНА';
      const def = pick ? O.HEROES[pick] : null;
      ui.over.className = 'ow-over on hs';
      ui.over.innerHTML = `
        <div class="ow-hs">
          <div class="ow-hs-top"><div class="ow-hs-title">ВЫБЕРИТЕ ГЕРОЯ</div><div class="ow-hs-timer" data-timer></div><div class="ow-hs-map">${esc(map.name)}${att ? ' · <b class="' + (att === 'АТАКА' ? 'att' : 'def') + '">' + att + '</b>' : ''}</div></div>
          <div class="ow-hs-team">${team.map(h => { const id = h === p ? pick : (h.heroId || h.pendingHero); return `<div class="ow-hs-mate ${h === p ? 'me' : ''}">${id ? `<img src="${purl(ui, id, h === p ? O.Profile.equipped(ui.profile, id, 'skin') : 'classic')}">` : '<div class="q">?</div>'}<span>${esc(h.name)}</span></div>`; }).join('')}
            ${warn.length ? `<div class="ow-hs-warn">${warn.map(w => '<div>⚠ ' + w + '</div>').join('')}</div>` : ''}</div>
          ${def ? `<div class="ow-hs-center"><div class="ow-hs-stage ow-stage-slot" data-stage></div><div class="ow-hs-name">${esc(def.name)}<small>${roleName(def.role)}</small></div><div class="ow-hs-kit">${def.kit.map(k => `<div title="${esc(k.desc)}">${iconImg(k.icon, 30)}<span>${esc(k.name)}</span><em>${esc(k.key)}</em></div>`).join('')}</div></div>` : '<div class="ow-hs-center empty">Выберите героя внизу</div>'}
          <div class="ow-hs-strip">${heroesByRole().map(r => `<div class="ow-hs-role"><div class="rt" style="color:${O.ROLES[r.role].color}">${iconImg(r.role, 16, O.ROLES[r.role].color)} ${O.ROLES[r.role].ru}</div><div class="rh">${r.heroes.map(id => { const tk = !g.rules.noLimits && taken.get(id); return `<div class="ow-hs-card ${pick === id ? 'on' : ''} ${tk ? 'taken' : ''}" data-hero="${id}" title="${esc(O.HEROES[id].name)}"><img src="${purl(ui, id, O.Profile.equipped(ui.profile, id, 'skin'))}">${tk ? `<span class="tk">${esc(tk.name)}</span>` : ''}</div>`; }).join('')}</div></div>`).join('')}</div>
          <div class="ow-hs-go ${p.heroId ? '' : 'off'}" data-go>${initial && g.phase === 'assemble' ? 'ГОТОВО' : 'ПОДТВЕРДИТЬ'}</div>
        </div>`;
      bindAll(ui.over, '[data-hero]', el => {
        const id = el.dataset.hero;
        if (el.classList.contains('taken')) { ui.audio.play('alarm', { vol: 0.3 }); return; }
        click(ui);
        if (g.requestHero(p, id)) { S.hsPick = id; ui.audio.say(O.HEROES[id].name.replace(':', ''), { rate: 1.1 }); }
        S.heroSelect(ui, S.hsInitial, true);
      });
      ui.over.querySelector('[data-go]').addEventListener('click', () => { if (!p.heroId && !p.pendingHero) return; click(ui); S.hsAuto = false; ui.closeOverlay(); });
      if (def) { const skin = O.Profile.equipped(ui.profile, pick, 'skin'); S.mountStage(ui, ui.over.querySelector('[data-stage]'), { key: 'hs:' + pick + ':' + skin, hero: pick, skin, yaw: 0.35, still: () => heroImg(ui, pick, skin) }); }
    },

    pause(ui) {
      const g = ui.game, p = g.player;
      const canSwap = g.phase === 'assemble' || g.phase === 'setup' || !p.alive || p.inSpawn || g.rules.practice;
      ui.over.className = 'ow-over on pause';
      ui.over.innerHTML = `
        <div class="ow-pause">
          <div class="ow-logo sm">OVERWATCH</div>
          <div class="ow-btn" data-p="resume">ПРОДОЛЖИТЬ</div>
          <div class="ow-btn ${canSwap ? '' : 'off'}" data-p="hero">СМЕНИТЬ ГЕРОЯ</div>
          <div class="ow-btn" data-p="opts">НАСТРОЙКИ</div>
          <div class="ow-btn" data-p="leave">ПОКИНУТЬ МАТЧ</div>
          <div class="ow-dim">Штраф за выход не начисляется: это же 2000 год.</div>
        </div>`;
      bindAll(ui.over, '[data-p]', el => {
        click(ui);
        const a = el.dataset.p;
        if (a === 'resume') ui.closeOverlay();
        else if (a === 'hero') { if (canSwap) { ui.overlay = null; ui.heroSelect(); } }
        else if (a === 'leave') ui.leaveMatch();
        else if (a === 'opts') S.pauseOptions(ui);
      });
    },

    pauseOptions(ui) {
      const o = ui.opts;
      ui.over.innerHTML = `<div class="ow-pause"><div class="ow-h2">НАСТРОЙКИ</div>
        <label>ЧУВСТВИТЕЛЬНОСТЬ <input type="range" min="1" max="15" step="0.5" value="${o.sens}" data-o="sens"></label>
        <label>ГРОМКОСТЬ <input type="range" min="0" max="1" step="0.05" value="${o.vol}" data-o="vol"></label>
        <label>ПОЛЕ ЗРЕНИЯ <input type="range" min="70" max="103" step="1" value="${o.fov}" data-o="fov"></label>
        <label>РАЗРЕШЕНИЕ <select data-o="res">${[['240', '320×240'], ['360', '512×384'], ['480', '640×480'], ['600', '800×600'], ['768', '1024×768'], ['native', 'Как у окна']].map(([v, n]) => `<option value="${v}" ${o.res === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <div class="ow-btn" data-back2>НАЗАД</div></div>`;
      ui.over.querySelectorAll('[data-o]').forEach(el => el.addEventListener(el.type === 'range' ? 'input' : 'change', () => { o[el.dataset.o] = el.type === 'range' ? +el.value : el.value; ui.saveOpts(); }));
      ui.over.querySelector('[data-back2]').addEventListener('click', () => { click(ui); S.pause(ui); });
    },

    banner(ui, res) {
      ui.over.className = 'ow-over on banner';
      ui.over.innerHTML = `<div class="ow-banner ${res}"><div>${res === 'win' ? 'ПОБЕДА' : res === 'draw' ? 'НИЧЬЯ' : 'ПОРАЖЕНИЕ'}</div></div>`;
      setTimeout(() => { if (ui.over.querySelector('.ow-banner')) { ui.over.innerHTML = ''; ui.over.className = 'ow-over'; } }, 4000);
    },

    s_cards(ui, a) {
      const g = a.g, p = g.player;
      const med = O.Profile.medals(g, p.team);
      const all = g.heroes.filter(h => h.heroId);
      const cats = [['finals', 'смертельных ударов'], ['elims', 'убийств'], ['dmg', 'урона нанесено'], ['heal', 'исцелено'], ['objTime', 'секунд у цели'], ['blocked', 'урона заблокировано'], ['bestStreak', 'убийств подряд']];
      const cards = [];
      const used = new Set();
      for (const [k, n] of cats) {
        const best = all.filter(h => !used.has(h.id)).sort((x, y) => y.stats[k] - x.stats[k])[0];
        if (best && best.stats[k] > 0 && cards.length < 4) { used.add(best.id); cards.push({ h: best, v: Math.round(best.stats[k]), n }); }
      }
      const res = g.winner === null || g.winner === -1 ? 'draw' : g.winner === p.team ? 'win' : 'lose';
      const myMed = med[p.id] || [];
      ui.layer.innerHTML = `
        <div class="ow-page ow-cards">
          <div class="ow-h1">${res === 'win' ? 'ПОБЕДА' : res === 'draw' ? 'НИЧЬЯ' : 'ПОРАЖЕНИЕ'}<small> · ${esc((O.MAP_LIST.find(m => m.id === g.mapId) || { name: '' }).name)} · ${O.fmtClock(g.t)}</small></div>
          <div class="ow-cardrow">${cards.map(c => `<div class="ow-card ${c.h.team === p.team ? 'ally' : 'enemy'}"><img src="${purl(ui, c.h.heroId, c.h.skin, true, c.h === p ? 'pose:' + O.Profile.equipped(ui.profile, c.h.heroId, 'pose') : botPose(c.h))}"><div class="nm">${esc(c.h.name.toUpperCase())}</div><div class="hn">${esc(O.HEROES[c.h.heroId].name)}</div><div class="v">${c.v}</div><div class="n">${c.n}</div></div>`).join('')}</div>
          <div class="ow-medals">${myMed.length ? myMed.map(m => `<div class="ow-medal ${m.medal}"><span></span>${m.name}: <b>${Math.round(m.val)}</b></div>`).join('') : '<div class="ow-dim">В этот раз без медалей.</div>'}</div>
          <div class="ow-btn big" data-next>ДАЛЕЕ</div>
        </div>`;
      ui.layer.querySelector('[data-next]').addEventListener('click', () => { click(ui); if (a.res) S.show(ui, 'progress', a); else { ui.game = null; S.show(ui, 'main'); } });
    },

    s_progress(ui, a) {
      const r = a.res, p = ui.profile;
      ui.audio.music('menu');
      ui.layer.innerHTML = `
        <div class="ow-page ow-progress">
          <div class="ow-h1">ОПЫТ</div>
          <div class="ow-xplines">${r.lines.map(([n, v]) => `<div><span>${n}</span><b>+${v}</b></div>`).join('')}<div class="tot"><span>ВСЕГО</span><b>+${r.xp}</b></div></div>
          <div class="ow-lvl"><div class="ow-lvlring"><span>${p.level}</span></div><div class="ow-xpbar"><div style="width:${Math.round(p.xp / O.Profile.xpNeed(p.level) * 100)}%"></div></div><div class="ow-dim">${p.xp} / ${O.Profile.xpNeed(p.level)}</div></div>
          ${r.ups ? `<div class="ow-levelup">УРОВЕНЬ ПОВЫШЕН! +${r.ups} ${r.ups > 1 ? 'КОНТЕЙНЕРА' : 'КОНТЕЙНЕР'}</div>` : ''}
          ${a.g && ui.match && ui.match.cfg.kind === 'comp' && p.comp.placed ? `<div class="ow-sr" style="color:${O.Profile.tier(p.comp.sr).col}">РЕЙТИНГ: ${p.comp.sr} · ${O.Profile.tier(p.comp.sr).name.toUpperCase()}</div>` : ''}
          <div class="ow-row">
            <div class="ow-btn big" data-again>ИСКАТЬ НОВУЮ ИГРУ</div>
            ${p.boxes ? '<div class="ow-btn big" data-boxes>ОТКРЫТЬ КОНТЕЙНЕР</div>' : ''}
            <div class="ow-btn big" data-menu>ГЛАВНОЕ МЕНЮ</div>
          </div>
        </div>`;
      if (r.ups) ui.audio.play('legendary', { vol: 0.5 });
      const cfg = ui.lastCfg;
      ui.layer.querySelector('[data-again]').addEventListener('click', () => { click(ui); ui.game = null; S.search(ui, Object.assign({}, cfg, { map: cfg && cfg.kind === 'custom' ? cfg.map : undefined })); });
      ui.layer.querySelector('[data-menu]').addEventListener('click', () => { click(ui); ui.game = null; S.show(ui, 'main'); });
      const b = ui.layer.querySelector('[data-boxes]');
      if (b) b.addEventListener('click', () => { click(ui); ui.game = null; S.show(ui, 'boxes'); });
    }
  };
  Object.assign(S, { purl, iconImg, badge, backBtn, credits, heroImg, click, bindAll, roleName });
  O.Screens = S;
})(globalThis.Ow98 = globalThis.Ow98 || {});
