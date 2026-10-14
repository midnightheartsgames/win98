(function (M) {
  'use strict';
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  class Menu {
    constructor(ui) {
      this.ui = ui;
      this.el = ui.menuEl;
      this.cur = null;
      this.stack = [];
      this.snow = [];
      this.bgT = 0;
    }

    hide() {
      this.el.style.display = 'none';
      this.el.innerHTML = '';
      this.cur = null;
      this.ui.novelCv.style.display = 'none';
    }

    show(name, o) {
      o = o || {};
      if (this.cur && this.cur !== name && !o.noStack && ['main', 'newgame', 'load', 'options', 'save', 'controls'].includes(this.cur)) this.stack.push(this.cur);
      if (name === 'main' || name === 'pause') this.stack = [];
      this.cur = name;
      this.opts = o;
      const ui = this.ui;
      this.el.style.display = 'flex';
      this.el.className = 'mpx-layer mpx-menu mpx-m-' + name;
      const inGame = !!ui.game && (ui.mode === 'paused' || ui.mode === 'dead');
      const bg = !inGame && ['main', 'newgame', 'load', 'options', 'credits', 'glerr', 'controls'].includes(name);
      ui.novelCv.style.display = bg ? 'block' : 'none';
      if (bg) { ui.menuScene = true; if (!ui.audio.musicId) ui.audio.playMusic('theme'); }
      this.el.innerHTML = this['html_' + name] ? this['html_' + name](o) : '';
      this.el.querySelectorAll('[data-act]').forEach(b => {
        b.addEventListener('mouseenter', () => ui.audio.play('hover'));
        b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); ui.audio.init(); ui.audio.resume(); ui.audio.play('menu'); this.act(b.dataset.act, b.dataset.arg, b); });
      });
      this.el.querySelectorAll('input[data-opt], select[data-opt]').forEach(inp => {
        inp.addEventListener('input', () => this.setOpt(inp));
        inp.addEventListener('change', () => this.setOpt(inp));
      });
      if (bg) this.startBg();
    }

    back() {
      const prev = this.stack.pop();
      if (prev) this.show(prev, { noStack: true });
      else if (this.ui.game && this.ui.mode === 'paused') this.show('pause');
      else this.show('main');
    }

    setOpt(inp) {
      const k = inp.dataset.opt;
      const v = inp.type === 'checkbox' ? inp.checked : inp.tagName === 'SELECT' ? Number(inp.value) : Number(inp.value);
      this.ui.opts[k] = v;
      this.ui.applyOpts();
      const out = this.el.querySelector(`[data-val="${k}"]`);
      if (out) out.textContent = typeof v === 'number' ? (Math.round(v * 100) / 100) : '';
    }

    act(a, arg) {
      const ui = this.ui;
      switch (a) {
        case 'continue': { const s = ui.saves.quick && (!ui.saves.auto || ui.saves.quick.at > ui.saves.auto.at) ? ui.saves.quick : ui.saves.auto; if (s) ui.loadSave(s); break; }
        case 'new': this.show('newgame'); break;
        case 'load': this.show('load'); break;
        case 'save': this.show('save'); break;
        case 'options': this.show('options'); break;
        case 'controls': this.show('controls'); break;
        case 'back': this.back(); break;
        case 'exit': if (ui.host.onExit) ui.host.onExit(); break;
        case 'diff': ui.profile.difficulty = Number(arg); ui.saveProfile(); this.show('newgame', { noStack: true }); break;
        case 'chapter': ui.difficulty = ui.profile.difficulty; ui.menuScene = false; this.hide(); ui.startLevel(arg, { difficulty: ui.profile.difficulty }); break;
        case 'loadslot': { const s = ui.saves[arg]; if (s) { ui.menuScene = false; ui.loadSave(s); } break; }
        case 'saveslot': { if (ui.manualSave(arg)) this.show('pause'); else this.flash('Сохранение невозможно'); break; }
        case 'resume': ui.resume(); break;
        case 'restart': this.hide(); ui.restartLevel(); break;
        case 'quick': { const s = ui.saves.quick || ui.saves.auto; this.hide(); if (s) ui.loadSave(s); else ui.restartLevel(); break; }
        case 'menu': ui.quitToMenu(); break;
      }
    }

    flash(t) {
      const f = this.el.querySelector('.mpx-flash');
      if (f) { f.textContent = t; f.style.opacity = 1; setTimeout(() => { f.style.opacity = 0; }, 1600); }
    }

    item(label, act, o) {
      o = o || {};
      return `<button class="mpx-item${o.off ? ' off' : ''}${o.small ? ' small' : ''}" data-act="${act}"${o.arg !== undefined ? ` data-arg="${esc(o.arg)}"` : ''}${o.off ? ' disabled' : ''}>${esc(label)}</button>`;
    }

    html_main() {
      const ui = this.ui;
      const has = ui.saves.auto || ui.saves.quick;
      return `<div class="mpx-title"><div class="mpx-logo">MAX PAYNE</div><div class="mpx-logo-sub">Часть I. Американская мечта</div></div>
      <div class="mpx-mainlist">
        ${has ? this.item('Продолжить', 'continue') : ''}
        ${this.item('Новая игра', 'new')}
        ${this.item('Загрузить игру', 'load')}
        ${this.item('Настройки', 'options')}
        ${this.item('Управление', 'controls')}
        ${ui.host.onExit ? this.item('Выход', 'exit') : ''}
      </div>
      <div class="mpx-foot">Remedy Entertainment · 3D Realms (2001) · Win 98 Edition</div>
      ${ui.glError ? `<div class="mpx-glerr">${esc(ui.glError)}</div>` : ''}`;
    }

    html_glerr() {
      return `<div class="mpx-panel"><div class="mpx-h">Нет 3D-ускорителя</div><p>${esc(this.ui.glError || 'WebGL2 недоступен.')}</p>${this.item('Назад', 'back', { small: true })}</div>`;
    }

    html_newgame() {
      const ui = this.ui;
      const prof = ui.profile;
      const diffs = M.DIFFICULTY.map((d, i) => {
        const locked = d.locked && !prof.doneI;
        return `<button class="mpx-diff${prof.difficulty === i ? ' on' : ''}${locked ? ' off' : ''}" data-act="diff" data-arg="${i}" ${locked ? 'disabled' : ''}><b>${esc(d.name)}</b><span>${esc(d.desc)}</span></button>`;
      }).join('');
      const list = M.levelOrder.map((id) => {
        const def = M.levels[id];
        if (!def) return '';
        const open = !!prof.chapters[id];
        const num = id === 'tutorial' ? '' : id === 'prologue' ? '' : def.chapter;
        return `<button class="mpx-ch${open ? '' : ' off'}" data-act="chapter" data-arg="${id}" ${open ? '' : 'disabled'}><span class="n">${num}</span><span class="t">${esc(M.chapterLabel(def).replace(/^Глава \d+\. /, ''))}</span><span class="e">${esc(def.titleEn || '')}</span></button>`;
      }).join('');
      return `<div class="mpx-panel wide"><div class="mpx-h">Новая игра</div>
        <div class="mpx-cols"><div class="mpx-col"><div class="mpx-sub">Сложность</div>${diffs}</div>
        <div class="mpx-col"><div class="mpx-sub">Часть I. Американская мечта</div><div class="mpx-chlist">${list}</div></div></div>
        <div class="mpx-row">${this.item('Назад', 'back', { small: true })}</div></div>`;
    }

    saveRows(mode) {
      const ui = this.ui;
      const keys = mode === 'save' ? ['slot1', 'slot2', 'slot3', 'slot4', 'slot5', 'slot6'] : ['auto', 'quick', 'slot1', 'slot2', 'slot3', 'slot4', 'slot5', 'slot6'];
      return keys.map(k => {
        const s = ui.saves[k];
        const name = k === 'auto' ? 'Автосохранение' : k === 'quick' ? 'Быстрое (F5)' : 'Ячейка ' + k.slice(4);
        const info = s ? `${esc(s.title)} · ${esc(M.DIFFICULTY[s.difficulty] ? M.DIFFICULTY[s.difficulty].name : '')} · ${new Date(s.at).toLocaleString('ru-RU')}` : 'пусто';
        const can = mode === 'save' ? true : !!s;
        return `<button class="mpx-save${can ? '' : ' off'}" data-act="${mode === 'save' ? 'saveslot' : 'loadslot'}" data-arg="${mode === 'save' ? k.slice(4) : k}" ${can ? '' : 'disabled'}><b>${esc(name)}</b><span>${info}</span></button>`;
      }).join('');
    }

    html_load() {
      return `<div class="mpx-panel"><div class="mpx-h">Загрузить игру</div><div class="mpx-saves">${this.saveRows('load')}</div><div class="mpx-row">${this.item('Назад', 'back', { small: true })}</div></div>`;
    }

    html_save() {
      const ui = this.ui;
      const left = ui.dosSaves >= 0 ? `<div class="mpx-note-s">Осталось сохранений в главе: ${ui.dosSaves}</div>` : '';
      return `<div class="mpx-panel"><div class="mpx-h">Сохранить игру</div>${left}<div class="mpx-saves">${this.saveRows('save')}</div><div class="mpx-flash"></div><div class="mpx-row">${this.item('Назад', 'back', { small: true })}</div></div>`;
    }

    html_options() {
      const o = this.ui.opts;
      const range = (k, label, min, max, step) => `<label class="mpx-opt"><span>${label}</span><input type="range" data-opt="${k}" min="${min}" max="${max}" step="${step}" value="${o[k]}"><em data-val="${k}">${o[k]}</em></label>`;
      const check = (k, label) => `<label class="mpx-opt chk"><input type="checkbox" data-opt="${k}" ${o[k] ? 'checked' : ''}><span>${label}</span></label>`;
      return `<div class="mpx-panel"><div class="mpx-h">Настройки</div>
        ${range('sens', 'Чувствительность мыши', 1, 10, 0.5)}
        ${range('fov', 'Угол обзора', 55, 90, 1)}
        ${range('sfx', 'Громкость звуков', 0, 1, 0.05)}
        ${range('music', 'Громкость музыки', 0, 1, 0.05)}
        ${range('gamma', 'Яркость (гамма)', 0.7, 1.6, 0.05)}
        <label class="mpx-opt"><span>Разрешение рендера</span><select data-opt="scale"><option value="1" ${o.scale === 1 ? 'selected' : ''}>100%</option><option value="0.75" ${o.scale === 0.75 ? 'selected' : ''}>75%</option><option value="0.5" ${o.scale === 0.5 ? 'selected' : ''}>50%</option></select></label>
        ${check('invert', 'Инвертировать мышь')}
        ${check('grain', 'Зерно плёнки')}
        ${check('hud', 'Показывать интерфейс')}
        <div class="mpx-row">${this.item('Назад', 'back', { small: true })}</div></div>`;
    }

    html_controls() {
      const rows = [
        ['W A S D', 'Движение'], ['Мышь', 'Прицел'], ['Левая кнопка', 'Огонь'], ['Правая кнопка', 'Замедление стоя, прыжок-уклонение в движении'],
        ['Shift', 'Замедление времени (вкл/выкл)'], ['Q', 'Прыжок-уклонение'], ['Пробел', 'Прыжок'], ['C / Ctrl', 'Пригнуться'], ['Alt', 'Шагом'], ['X', 'Укрыться за стеной или барьером, ещё раз: выйти'],
        ['В укрытии', 'шаг вдоль стены: двигаться, огонь или шаг к стене: высунуться, шаг от стены: выйти, Q: прыжок'],
        ['E / F', 'Использовать'], ['R', 'Перезарядка'], ['H / Backspace', 'Обезболивающее'], ['1–5, колесо', 'Оружие'], ['G', 'Бросить гранату или бутылку'],
        ['Tab', 'Мысли Макса'], ['Enter', 'Пропустить реплику'], ['F5 / F9', 'Быстрое сохранение и загрузка'], ['Esc', 'Пауза']
      ];
      return `<div class="mpx-panel"><div class="mpx-h">Управление</div><table class="mpx-keys">${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table><div class="mpx-row">${this.item('Назад', 'back', { small: true })}</div></div>`;
    }

    html_pause() {
      const g = this.ui.game;
      const th = g && g.thought ? `<div class="mpx-thought">${esc(g.thought)}</div>` : '';
      return `<div class="mpx-pause"><div class="mpx-ptitle">${esc(g ? M.chapterLabel(g.def) : '')}</div>${th}
        ${this.item('Продолжить', 'resume')}
        ${this.item('Сохранить игру', 'save', { off: !this.ui.canSave() })}
        ${this.item('Загрузить игру', 'load')}
        ${this.item('Настройки', 'options')}
        ${this.item('Начать главу заново', 'restart')}
        ${this.item('Главное меню', 'menu')}</div>`;
    }

    html_dead(o) {
      const lines = ['Пуля не спрашивает, готов ли ты.', 'Снег падал и на меня тоже.', 'Кто-то другой допишет эту историю. Или я попробую ещё раз.', 'В Нью-Йорке умирают быстро. Я не собирался становиться статистикой.'];
      const t = o.text || lines[Math.floor(Math.random() * lines.length)];
      return `<div class="mpx-pause dead"><div class="mpx-ptitle">${esc(t)}</div>
        ${this.item('Загрузить последнее сохранение', 'quick')}
        ${this.item('Начать главу заново', 'restart')}
        ${this.item('Загрузить игру', 'load')}
        ${this.item('Главное меню', 'menu')}</div>`;
    }

    html_credits() {
      const s = this.ui.lastStats || null;
      return `<div class="mpx-panel credits"><div class="mpx-h">Конец первой части</div>
        <p>Лупино мёртв. Где-то выше по лестнице сидит Пунчинелло, и снег ещё не кончился.</p>
        <p class="mpx-cont">Часть II. Холодный день в аду. Продолжение следует.</p>
        <p class="mpx-sm">Открыты уровни сложности «Мёртвый по прибытии» и «Нью-йоркская минута».</p>
        <p class="mpx-sm">Max Payne · Remedy Entertainment, 3D Realms, Gathering of Developers. Win 98 Edition.</p>
        <div class="mpx-row">${this.item('Главное меню', 'menu', { small: true })}</div></div>`;
    }

    startBg() {
      if (this.bgRaf) return;
      const ui = this.ui;
      const loop = () => {
        if (!this.cur || ui.mode !== 'menu' || ui.novelCv.style.display === 'none') { this.bgRaf = 0; return; }
        this.bgRaf = requestAnimationFrame(loop);
        this.drawBg(1 / 60);
      };
      this.bgRaf = requestAnimationFrame(loop);
    }

    drawBg(dt) {
      const ui = this.ui, cv = ui.novelCv;
      const W = cv.clientWidth || 800, H = cv.clientHeight || 600;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); this.sky = null; }
      const c = cv.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!this.sky) {
        const s = document.createElement('canvas');
        s.width = Math.round(W); s.height = Math.round(H);
        M.NOVEL_ART.skyline(s.getContext('2d'), s.width, s.height, { seed: 21, tower: true });
        const x = s.getContext('2d');
        const g = x.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, 'rgba(0,0,0,0.85)'); g.addColorStop(0.55, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        this.sky = s;
      }
      this.bgT += dt;
      c.drawImage(this.sky, 0, 0, W, H);
      while (this.snow.length < 260) this.snow.push([Math.random() * W, Math.random() * H, 0.5 + Math.random() * 2.5, Math.random()]);
      c.fillStyle = 'rgba(235,238,245,0.8)';
      for (const s of this.snow) {
        s[1] += (20 + s[2] * 18) * dt; s[0] += (18 + Math.sin(this.bgT + s[3] * 9) * 12) * dt;
        if (s[1] > H) { s[1] = -4; s[0] = Math.random() * W; }
        if (s[0] > W) s[0] -= W;
        c.globalAlpha = 0.35 + s[3] * 0.6;
        c.beginPath(); c.arc(s[0], s[1], s[2], 0, 6.3); c.fill();
      }
      c.globalAlpha = 1;
    }
  }
  M.Menu = Menu;
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
