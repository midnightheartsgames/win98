(function (X) {
  'use strict';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function paintTitle(cv, W, H, seed) {
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const r = X.rng(seed || 13);
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#f2c24a'); g.addColorStop(0.55, '#e0782a'); g.addColorStop(1, '#8a2414');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const step = Math.max(8, Math.round(W / 90));
    for (let y = 0; y < H + step; y += step) {
      for (let x = 0; x < W + step; x += step) {
        const ox = (Math.floor(y / step) % 2) * step / 2;
        const t = (x / W) * 0.6 + (y / H) * 0.6;
        const rad = step * 0.48 * Math.max(0, Math.min(1, t - 0.25));
        if (rad < 0.5) continue;
        c.fillStyle = 'rgba(60,14,6,0.55)';
        c.beginPath(); c.arc(x + ox, y, rad, 0, 7); c.fill();
      }
    }
    c.save();
    c.strokeStyle = 'rgba(255,240,200,0.35)'; c.lineWidth = 2;
    const cx = W * 0.3, cy = H * 0.55;
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2, r0 = Math.min(W, H) * (0.45 + r() * 0.2), r1 = r0 + 60 + r() * 200;
      c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.stroke();
    }
    c.restore();
    const s = Math.min(W, H) / 700;
    c.save();
    c.translate(W * 0.3, H * 1.02);
    c.scale(s, s);
    c.fillStyle = '#1a0c06';
    c.beginPath();
    c.moveTo(-330, 0); c.quadraticCurveTo(-300, -260, -120, -300); c.quadraticCurveTo(-60, -320, -70, -360);
    c.quadraticCurveTo(-120, -420, -110, -520); c.quadraticCurveTo(-90, -650, 20, -660); c.quadraticCurveTo(140, -650, 150, -520);
    c.quadraticCurveTo(160, -420, 90, -360); c.quadraticCurveTo(80, -320, 140, -300); c.quadraticCurveTo(320, -260, 350, 0); c.closePath(); c.fill();
    c.fillStyle = '#e8c090';
    c.beginPath(); c.moveTo(-60, -330); c.quadraticCurveTo(0, -300, 70, -330); c.quadraticCurveTo(110, -300, 150, -290); c.quadraticCurveTo(40, -250, -40, -250); c.quadraticCurveTo(-120, -270, -140, -292); c.closePath(); c.fill();
    c.fillStyle = '#16264a'; c.font = 'bold 44px Georgia, serif'; c.textAlign = 'center';
    c.save(); c.translate(-70, -272); c.rotate(-0.08); c.fillText('XIII', 0, 0); c.restore();
    c.strokeStyle = '#f0d8a8'; c.lineWidth = 3; c.globalAlpha = 0.5;
    for (let i = 0; i < 18; i++) { c.beginPath(); c.moveTo(-100 + i * 12, -640 + (i % 3) * 8); c.lineTo(-110 + i * 13, -560); c.stroke(); }
    c.restore();
    c.save();
    c.translate(W * 0.64, H * 0.3);
    c.rotate(-0.04);
    const fs = Math.min(W * 0.2, H * 0.34);
    c.font = `bold ${fs}px Georgia, "Times New Roman", serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.lineWidth = fs * 0.12; c.strokeStyle = '#1a0806'; c.strokeText('XIII', 0, 0);
    c.fillStyle = '#d82a18'; c.fillText('XIII', 0, 0);
    c.lineWidth = fs * 0.025; c.strokeStyle = '#ffe8b0'; c.strokeText('XIII', -fs * 0.02, -fs * 0.02);
    c.font = `bold ${fs * 0.13}px Impact, "Arial Black", sans-serif`;
    c.fillStyle = '#1a0806'; c.fillText('ТАЙНА ТРИНАДЦАТОГО', 0, fs * 0.6);
    c.restore();
    c.fillStyle = 'rgba(26,8,4,0.8)'; c.font = `${Math.round(12 * s + 4)}px "Comic Sans MS", cursive`; c.textAlign = 'right';
    c.fillText('По мотивам комикса Ж. Ван Гамма и У. Ванса · Win 98 Edition', W - 14, H - 12);
  }
  X.paintTitle = paintTitle;

  class Menu {
    constructor(ui) {
      this.ui = ui;
      this.el = ui.menuEl;
      this.stack = [];
      this.cur = null;
      this.el.addEventListener('click', e => this.onClick(e));
      this.el.addEventListener('input', e => this.onInput(e));
      this.el.addEventListener('change', e => this.onInput(e));
    }
    show(name, arg) {
      this.cur = name;
      this.arg = arg;
      this.el.style.display = 'flex';
      this.el.className = 'x13-layer x13-menu x13-m-' + name;
      this.el.innerHTML = this.render(name, arg);
      if (name === 'main') {
        const cv = this.el.querySelector('.x13-title-art');
        if (cv) paintTitle(cv, Math.max(320, this.el.clientWidth), Math.max(240, this.el.clientHeight), 13);
      }
      if (name === 'chapters') this.ui.fillShots && this.ui.fillShots(this.el);
    }
    push(name, arg) { if (this.cur) this.stack.push([this.cur, this.arg]); this.show(name, arg); }
    back() {
      const prev = this.stack.pop();
      if (prev) this.show(prev[0], prev[1]);
      else if (this.ui.mode === 'paused') this.ui.resume();
    }
    hide() { this.el.style.display = 'none'; this.el.innerHTML = ''; this.cur = null; this.stack = []; }
    item(act, label, o) {
      o = o || {};
      return `<div class="x13-item${o.off ? ' off' : ''}${o.cls ? ' ' + o.cls : ''}" data-act="${act}"${o.arg !== undefined ? ` data-arg="${esc(o.arg)}"` : ''}>${esc(label)}</div>`;
    }
    render(name, arg) {
      const ui = this.ui, P = ui.profile;
      switch (name) {
        case 'main': {
          const cont = P.campaign && P.campaign.level;
          return `<canvas class="x13-title-art"></canvas>
            <div class="x13-main-items">
              ${cont ? this.item('continue', 'Продолжить') : ''}
              ${this.item('new', 'Новая игра')}
              ${this.item('chapters', 'Главы')}
              ${this.item('dossier', 'Досье XX')}
              ${this.item('options', 'Настройки')}
              ${this.item('credits', 'Об игре')}
              ${ui.opts.onExit ? this.item('exit', 'Выход') : ''}
            </div>
            ${ui.glError ? `<div class="x13-glerr">Ошибка 3D-ускорителя: ${esc(ui.glError)}</div>` : ''}`;
        }
        case 'difficulty':
          return `<div class="x13-page"><div class="x13-head">Сложность</div>
            <div class="x13-cap">Кто-то стёр мне память. Кто-то хочет стереть и меня.</div>
            <div class="x13-col">${X.DIFFICULTY.map((d, i) => this.item('diff', d.name + (i === 0 ? ' — для знакомства с сюжетом' : i === 1 ? ' — как задумано' : ' — враги метки и зорки'), { arg: i })).join('')}</div>
            <div class="x13-foot">${this.item('back', 'Назад', { cls: 'small' })}</div></div>`;
        case 'chapters': {
          const cards = X.LEVELS.map((l, i) => {
            const open = i === 0 || (P.unlocked || 1) > i;
            const best = P.best && P.best[l.id];
            return `<div class="x13-card${open ? '' : ' locked'}" data-act="${open ? 'chapter' : ''}" data-arg="${l.id}">
              <div class="x13-shot" data-shot="${l.id}"><div class="x13-num">${toRoman(l.n)}</div></div>
              <div class="x13-cname">${esc(l.name)}</div>
              <div class="x13-csub">${open ? esc(l.sub || '') : 'Глава закрыта'}</div>
              ${best ? `<div class="x13-best">★ ${X.fmtTime(best.time)} · документы ${best.secrets}/${best.secretsTotal}</div>` : ''}
            </div>`;
          }).join('');
          return `<div class="x13-page wide"><div class="x13-head">Главы</div>
            <div class="x13-grid">${cards}</div>
            <div class="x13-foot">${this.item('back', 'Назад', { cls: 'small' })}<span class="x13-note">Сложность: ${esc(X.DIFFICULTY[P.difficulty || 1].name)}</span>${this.item('cyclediff', 'Сменить сложность', { cls: 'small' })}</div></div>`;
        }
        case 'dossier': {
          let got = 0, known = 0;
          const blocks = X.LEVELS.map(l => {
            const L = P.docs && P.docs[l.id];
            const found = L ? Object.values(L.found || {}) : [];
            const total = L ? Math.max(L.total || 0, found.length) : null;
            got += found.length; known += total || 0;
            const missing = total === null ? 0 : total - found.length;
            const cards = found.map(d => `<div class="x13-doc"><b>${esc(d.title)}</b><div>${esc(d.text)}</div></div>`).join('') +
              Array.from({ length: missing }, () => '<div class="x13-doc locked"><b>???</b><div>Документ не найден.</div></div>').join('');
            return `<div class="x13-doc-level"><b>${l.n}. ${esc(l.name)}</b> <span>${total === null ? 'глава не пройдена' : found.length + ' / ' + total}</span></div>${cards}`;
          }).join('');
          return `<div class="x13-page wide"><div class="x13-head">Досье XX</div>
            <div class="x13-cap">Найдено документов: ${got}${known ? ' из ' + known : ''}. Двадцать заговорщиков. Тринадцатый — это вы.</div>
            <div class="x13-docs">${blocks}</div>
            <div class="x13-foot">${this.item('back', 'Назад', { cls: 'small' })}</div></div>`;
        }
        case 'options': {
          const o = ui.opts;
          const sl = (k, label, min, max, step) => `<label class="x13-opt"><span>${label}</span><input type="range" data-opt="${k}" min="${min}" max="${max}" step="${step}" value="${o[k]}"><em>${o[k]}</em></label>`;
          const tg = (k, label) => `<label class="x13-opt"><span>${label}</span><input type="checkbox" data-opt="${k}" ${o[k] ? 'checked' : ''}></label>`;
          return `<div class="x13-page"><div class="x13-head">Настройки</div>
            <div class="x13-opts">
              ${sl('sens', 'Чувствительность мыши', 1, 10, 0.5)}
              ${tg('invert', 'Инверсия мыши')}
              ${sl('fov', 'Поле зрения', 60, 100, 1)}
              ${sl('sfx', 'Громкость звуков', 0, 1, 0.05)}
              ${sl('music', 'Громкость музыки', 0, 1, 0.05)}
              ${sl('scale', 'Разрешение 3D (доля)', 0.5, 1, 0.25)}
              ${sl('lineW', 'Толщина контуров', 0.5, 2, 0.25)}
              ${sl('gamma', 'Яркость', 0.7, 1.5, 0.05)}
              ${tg('hatch', 'Штриховка теней')}
              ${tg('panels', 'Комиксовые вставки')}
              ${tg('sense', 'Шестое чувство (ТАП ТАП)')}
              ${tg('blood', 'Кровь')}
            </div>
            <div class="x13-foot">${this.item('back', 'Готово', { cls: 'small' })}</div></div>`;
        }
        case 'credits':
          return `<div class="x13-page"><div class="x13-head">XIII</div>
            <div class="x13-text">
              <p><b>XIII: Тайна Тринадцатого</b> — шутер от первого лица в стиле комикса. Win 98 Edition.</p>
              <p>По мотивам комикса Жана Ван Гамма и Уильяма Ванса и игры Ubisoft Paris. Сюжет, уровни, реплики, графика и музыка этой версии созданы заново.</p>
              <p>Графика: процедурные чернильные текстуры, cel-shading, контуры по глубине и нормалям, вставки-панели, рисуемые камерой в реальном времени.</p>
              <p><b>Управление:</b> WASD — движение, мышь — обзор, ЛКМ — огонь, ПКМ — прицел, R — перезарядка, E — действие / заложник / дверь, C — присесть, Shift — шагом, Пробел — прыжок, 1–9 — оружие, Q — прошлое оружие, G — граната, H — аптечка, Tab — цели, F5/F9 — быстрое сохранение/загрузка, Esc — пауза.</p>
            </div>
            <div class="x13-foot">${this.item('back', 'Назад', { cls: 'small' })}</div></div>`;
        case 'pause': {
          return `<div class="x13-page narrow"><div class="x13-head">Пауза</div>
            <div class="x13-cap">${esc(ui.game ? ui.game.def.name + ' — ' + (ui.game.def.sub || '') : '')}</div>
            <div class="x13-col">
              ${this.item('resume', 'Продолжить')}
              ${this.item('objectives', 'Цели задания')}
              ${this.item('checkpoint', 'С контрольной точки')}
              ${this.item('restart', 'Начать главу заново')}
              ${this.item('options', 'Настройки')}
              ${this.item('quit', 'Выйти в меню')}
            </div></div>`;
        }
        case 'objectives': {
          const g = ui.game;
          const list = g ? g.objectives.map(o => `<div class="x13-obj${o.done ? ' done' : o.failed ? ' failed' : ''}">${o.done ? '✔' : o.failed ? '✘' : '□'} ${esc(o.text)}${o.optional ? ' <i>(доп.)</i>' : ''}</div>`).join('') : '';
          return `<div class="x13-page narrow"><div class="x13-head">Цели</div><div class="x13-objs">${list}</div>
            <div class="x13-cap">Документы: ${g ? g.stats.secrets : 0} / ${g ? g.stats.secretsTotal : 0}</div>
            <div class="x13-foot">${this.item('back', 'Назад', { cls: 'small' })}</div></div>`;
        }
        case 'dead':
        case 'failed': {
          const title = name === 'dead' ? 'Вы убиты' : 'Задание провалено';
          const why = name === 'failed' ? (arg || '') : 'Тринадцатый падает. Но это ещё не конец истории...';
          return `<div class="x13-page narrow ${name}"><div class="x13-head red">${title}</div>
            <div class="x13-cap">${esc(why)}</div>
            <div class="x13-col">
              ${this.item('checkpoint', 'С контрольной точки')}
              ${this.item('restart', 'Начать главу заново')}
              ${this.item('quit', 'Выйти в меню')}
            </div></div>`;
        }
        case 'complete': {
          const g = ui.game, st = g.stats;
          const acc = st.shots ? Math.round(100 * Math.min(st.hits, st.shots) / st.shots) : 0;
          const rows = [
            ['Время', X.fmtTime(st.time)], ['Убито врагов', st.kills], ['Выстрелов в голову', st.headshots], ['Оглушено', st.ko],
            ['Точность', acc + '%'], ['Тревог поднято', st.alarms], ['Документы', st.secrets + ' / ' + st.secretsTotal], ['Смертей', st.deaths], ['Сложность', g.diff.name]
          ];
          return `<div class="x13-page narrow"><div class="x13-head">Глава пройдена</div>
            <div class="x13-cap">${esc(g.def.name)} — ${esc(g.def.sub || '')}</div>
            <table class="x13-stats">${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>
            <div class="x13-col">${this.item('next', 'Дальше')}</div></div>`;
        }
        case 'end':
          return `<div class="x13-page"><div class="x13-head red">Продолжение следует...</div>
            <div class="x13-text"><p>Мангуст повержен, но Номер Один по-прежнему в тени. Двадцать заговорщиков. Тринадцатый — жив.</p>
            <p>Вы прошли все главы. Спасибо, что играли в XIII — Win 98 Edition.</p></div>
            <div class="x13-foot">${this.item('quit', 'В главное меню', { cls: 'small' })}</div></div>`;
        case 'loading':
          return `<div class="x13-loading"><div class="x13-lnum">${toRoman(arg && arg.n || 1)}</div><div class="x13-lname">${esc(arg && arg.name || '')}</div><div class="x13-lsub">${esc(arg && arg.sub || '')}</div><div class="x13-lbar">ЗАГРУЗКА...</div></div>`;
      }
      return '';
    }
    onInput(e) {
      const t = e.target;
      const k = t.dataset && t.dataset.opt;
      if (!k) return;
      const o = this.ui.opts;
      o[k] = t.type === 'checkbox' ? t.checked : Number(t.value);
      const em = t.parentElement && t.parentElement.querySelector('em');
      if (em) em.textContent = o[k];
      this.ui.applyOpts();
    }
    onClick(e) {
      const it = e.target.closest('[data-act]');
      if (!it || it.classList.contains('off')) return;
      const act = it.dataset.act, arg = it.dataset.arg;
      if (!act) return;
      const ui = this.ui;
      ui.audio.init(); ui.audio.resume(); ui.audio.play('ui');
      switch (act) {
        case 'new': this.push('difficulty'); break;
        case 'diff': ui.profile.difficulty = Number(arg); ui.saveProfile(); ui.newCampaign(); break;
        case 'continue': ui.continueCampaign(); break;
        case 'chapters': this.push('chapters'); break;
        case 'chapter': ui.startChapter(arg); break;
        case 'cyclediff': ui.profile.difficulty = ((ui.profile.difficulty || 1) + 1) % 3; ui.saveProfile(); this.show('chapters'); break;
        case 'dossier': this.push('dossier'); break;
        case 'options': this.push('options'); break;
        case 'credits': this.push('credits'); break;
        case 'exit': ui.opts.onExit && ui.opts.onExit(); break;
        case 'back': this.back(); break;
        case 'resume': ui.resume(); break;
        case 'objectives': this.push('objectives'); break;
        case 'checkpoint': ui.loadCheckpoint(); break;
        case 'restart': ui.restartLevel(); break;
        case 'quit': ui.quitToMenu(); break;
        case 'next': ui.afterStats(); break;
      }
    }
  }
  function toRoman(n) {
    const t = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let s = '';
    for (const [v, r] of t) while (n >= v) { s += r; n -= v; }
    return s;
  }
  X.toRoman = toRoman;
  X.Menu = Menu;
})(globalThis.XIII = globalThis.XIII || {});
