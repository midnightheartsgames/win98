(function () {
  'use strict';
  const REPEAT_DELAY = 320, REPEAT_EVERY = 90, TAP_SLOP = 10, WHEEL_STEP = 22;
  const DIRS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  const KEYS = {
    Enter: 'Enter', Escape: 'Escape', Tab: 'Tab', ShiftLeft: 'Shift', Delete: 'Delete', PageUp: 'PageUp', PageDown: 'PageDown', F7: 'F7', F8: 'F8', F9: 'F9',
    ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight'
  };
  const QUICK = {
    field: [['KeyF', 'F', 'Удар'], ['KeyM', 'M', 'Карта'], ['Tab', 'Tab', 'Сцена'], ['ShiftLeft', 'Шаг', 'Шагом', true], ['Digit1', '1', ''], ['Digit2', '2', ''], ['Digit3', '3', ''], ['Digit4', '4', '']],
    field_g: [['KeyF', 'F', 'Удар'], ['KeyM', 'M', 'Карта'], ['Tab', 'Tab', 'Сцена'], ['KeyG', 'G', 'Дитин'], ['Digit1', '1', ''], ['Digit2', '2', ''], ['Digit3', '3', ''], ['Digit4', '4', '']],
    battle: [['KeyT', 'T', 'Контакт'], ['KeyR', 'R', 'Слияние'], ['KeyV', 'V', 'Авто'], ['ShiftLeft', '»', 'Быстрее', true], ['Digit1', '1', ''], ['Digit2', '2', ''], ['Digit3', '3', ''], ['Digit4', '4', '']],
    battle_g: [['KeyT', 'T', 'Контакт'], ['KeyR', 'R', 'Слияние'], ['KeyV', 'V', 'Авто'], ['KeyG', 'G', 'Рёв'], ['Digit1', '1', ''], ['Digit2', '2', ''], ['Digit3', '3', ''], ['Digit4', '4', '']],
    menu: [['Tab', 'Tab', ''], ['KeyF', 'F', ''], ['KeyX', 'X', ''], ['KeyA', 'A', ''], ['KeyV', 'V', ''], ['ShiftLeft', 'Shift', '', true], ['PageUp', 'PgUp', ''], ['PageDown', 'PgDn', '']],
    hd: [['KeyR', 'R', 'Ульта'], ['KeyB', 'B', 'Лавка'], ['KeyF', 'F', 'Возврат'], ['KeyN', 'N', 'Волна'], ['KeyC', 'C', 'Герой'], ['KeyX', 'X', 'Стоять'], ['Tab', 'Tab', 'Карта'], ['ShiftLeft', 'Shift', 'Навыки', true]],
    hd_net: [['KeyR', 'R', 'Ульта'], ['KeyB', 'B', 'Лавка'], ['KeyF', 'F', 'Возврат'], ['KeyN', 'N', 'Волна'], ['KeyC', 'C', 'Герой'], ['KeyG', 'G', 'Метка'], ['KeyV', 'V', 'Фразы'], ['KeyP', 'P', 'Пауза'], ['KeyX', 'X', 'Стоять'], ['Tab', 'Tab', 'Карта'], ['ShiftLeft', 'Shift', 'Навыки', true]],
    hd_draft: [['KeyR', 'R', 'Новый'], ['KeyC', 'C', 'Герой']],
    visit: [['KeyT', 'T', 'Фраза'], ['Tab', 'Tab', 'Меню'], ['ShiftLeft', 'Шаг', 'Шагом', true]],
    title: []
  };
  const PANEL = [
    ['F9', 'F9', 'Сообщить об ошибке'], ['F8', 'F8', 'Меню отладки'], ['F7', 'F7', '+нефрит'], ['Tab', 'Tab', ''], ['ShiftLeft', 'Shift', '', true],
    ['KeyQ', 'Q', ''], ['KeyE', 'E', ''], ['KeyF', 'F', ''], ['KeyM', 'M', ''],
    ['KeyT', 'T', ''], ['KeyR', 'R', ''], ['KeyV', 'V', ''], ['KeyX', 'X', ''],
    ['KeyA', 'A', ''], ['KeyC', 'C', ''], ['KeyL', 'L', ''], ['KeyH', 'H', ''],
    ['Delete', 'Del', ''],
    ['Digit1', '1', ''], ['Digit2', '2', ''], ['Digit3', '3', ''], ['Digit4', '4', ''],
    ['PageUp', 'PgUp', ''], ['PageDown', 'PgDn', ''], ['Backspace', '←', '']
  ];

  const root = () => document.getElementById('game');
  const canvas = () => root() && root().querySelector('canvas');
  const keyName = code => KEYS[code] || (code.startsWith('Key') ? code.slice(3).toLowerCase() : code.startsWith('Digit') ? code.slice(5) : code);
  const send = (type, code, repeat) => {
    const el = root();
    if (el) el.dispatchEvent(new KeyboardEvent(type, { code, key: keyName(code), repeat: !!repeat, bubbles: true, cancelable: true }));
  };
  const latched = new Set();

  function tr(text) {
    const h = window.Hsr98;
    return h && h.isEn && h.isEn() && h.tr && text ? h.tr(text) : text;
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) { e.dataset.ru = text; e.textContent = tr(text); }
    return e;
  }

  function holdButton(btn, code, opts) {
    let timer = null, wait = null;
    const stop = () => { clearTimeout(wait); clearInterval(timer); wait = timer = null; };
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      if (opts.latch) {
        const on = !latched.has(code);
        if (on) { latched.add(code); send('keydown', code); } else { latched.delete(code); send('keyup', code); }
        sync();
        return;
      }
      btn.classList.add('on');
      send('keydown', code);
      if (opts.repeat) wait = setTimeout(() => { timer = setInterval(() => send('keydown', code, true), REPEAT_EVERY); }, REPEAT_DELAY);
    });
    const up = () => { if (opts.latch || !btn.classList.contains('on')) return; btn.classList.remove('on'); stop(); send('keyup', code); };
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.dataset.code = code;
    return btn;
  }

  function key(code, cap, label, latch, cls) {
    const b = el('div', 'tk-key' + (cls ? ' ' + cls : ''));
    b.appendChild(el('b', '', cap));
    if (label) b.appendChild(el('span', '', label));
    return holdButton(b, code, { latch: !!latch });
  }

  function pad() {
    const p = el('div', 'tk-pad');
    ['up', 'left', 'right', 'down'].forEach(d => p.appendChild(el('i', 'tk-arm tk-' + d)));
    let dir = null, wait = null, timer = null;
    const release = () => { clearTimeout(wait); clearInterval(timer); if (dir) send('keyup', DIRS[dir]); dir = null; p.dataset.dir = ''; };
    const aim = e => {
      const r = p.getBoundingClientRect(), dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2;
      const next = Math.hypot(dx, dy) < r.width * 0.12 ? null : Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      if (next === dir) return;
      release();
      dir = next; p.dataset.dir = dir || '';
      if (!dir) return;
      send('keydown', DIRS[dir]);
      wait = setTimeout(() => { timer = setInterval(() => send('keydown', DIRS[dir], true), REPEAT_EVERY); }, REPEAT_DELAY);
    };
    p.addEventListener('pointerdown', e => { e.preventDefault(); p.setPointerCapture(e.pointerId); aim(e); });
    p.addEventListener('pointermove', e => { if (p.hasPointerCapture(e.pointerId)) aim(e); });
    p.addEventListener('pointerup', release);
    p.addEventListener('pointercancel', release);
    return p;
  }

  function bindCanvasTouch() {
    let touch = null;
    const mouse = (target, type, t) => target.dispatchEvent(new MouseEvent(type, { clientX: t.clientX, clientY: t.clientY, button: 0, buttons: type === 'mousedown' ? 1 : 0, bubbles: true, cancelable: true }));
    root().addEventListener('touchstart', e => {
      const cv = canvas();
      if (!cv || e.target !== cv || e.touches.length !== 1) return;
      e.preventDefault();
      const t = e.touches[0];
      touch = { id: t.identifier, x: t.clientX, y: t.clientY, lastY: t.clientY, moved: false };
    }, { passive: false });
    root().addEventListener('touchmove', e => {
      if (!touch) return;
      e.preventDefault();
      const t = [...e.changedTouches].find(c => c.identifier === touch.id);
      if (!t) return;
      if (!touch.moved && Math.hypot(t.clientX - touch.x, t.clientY - touch.y) > TAP_SLOP) touch.moved = true;
      if (!touch.moved) return;
      while (Math.abs(t.clientY - touch.lastY) >= WHEEL_STEP) {
        const up = t.clientY < touch.lastY;
        touch.lastY += up ? -WHEEL_STEP : WHEEL_STEP;
        canvas().dispatchEvent(new WheelEvent('wheel', { deltaY: up ? 100 : -100, clientX: touch.x, clientY: touch.y, bubbles: true, cancelable: true }));
      }
    }, { passive: false });
    const end = e => {
      if (!touch) return;
      const t = [...e.changedTouches].find(c => c.identifier === touch.id);
      if (!t) return;
      e.preventDefault();
      if (!touch.moved && e.type === 'touchend') {
        const g = window.hsrui;
        if (g) g.touchTap = true;
        mouse(canvas(), 'mousedown', t);
        if (g) g.touchTap = false;
        mouse(document, 'mouseup', t);
      }
      touch = null;
    };
    root().addEventListener('touchend', end, { passive: false });
    root().addEventListener('touchcancel', end, { passive: false });
  }

  let ui = null, quick = null, panel = null, quickMode = '', userHid = false;

  function sync() {
    ui.querySelectorAll('.tk-key').forEach(b => b.classList.toggle('latched', latched.has(b.dataset.code)));
  }

  function modeNow() {
    const g = window.hsrui;
    if (!g) return 'title';
    if (g.screens && g.screens.length) {
      const top = g.screens[g.screens.length - 1];
      return top.arena ? (top.net ? 'hd_net' : 'hd') : top.draft ? 'hd_draft' : 'menu';
    }
    const game = g.game;
    if (game && game.guest && g.mode === 'field') return 'visit';
    if (g.mode === 'field' && game && game.map && game.map.def.trails && game.state.flags.lf_diting) return 'field_g';
    if (g.mode === 'battle' && game && game.battle && game.battle.lf && game.battle.lf.assist) return 'battle_g';
    return QUICK[g.mode] ? g.mode : 'menu';
  }

  function fillQuick() {
    const lang = window.Hsr98 && window.Hsr98.getLang ? window.Hsr98.getLang() : 'ru';
    const m = modeNow(), keyMode = m + ':' + lang;
    if (keyMode === quickMode) return;
    quickMode = keyMode;
    quick.textContent = '';
    QUICK[m].forEach(([code, cap, label, latch]) => quick.appendChild(key(code, cap, label, latch)));
    ui.querySelectorAll('[data-ru]').forEach(n => { n.textContent = tr(n.dataset.ru); });
    sync();
  }

  function setShown(on) {
    document.body.classList.toggle('tk-on', on);
    if (!on) { panel.hidden = true; latched.forEach(c => send('keyup', c)); latched.clear(); sync(); }
  }

  function build() {
    ui = el('div', 'tk');
    const top = el('div', 'tk-top');
    const kb = el('div', 'tk-key tk-small', 'Клавиши');
    kb.addEventListener('pointerdown', e => { e.preventDefault(); panel.hidden = !panel.hidden; });
    top.append(kb, key('F9', 'F9', 'Баг', false, 'tk-small'), key('F7', 'F7', '+нефрит', false, 'tk-small'), key('F8', 'F8', 'Отладка', false, 'tk-small tk-debug'));
    const hide = el('div', 'tk-key tk-small', 'Скрыть');
    hide.addEventListener('pointerdown', e => { e.preventDefault(); userHid = true; setShown(false); });
    top.appendChild(hide);
    const restore = el('div', 'tk-key tk-small tk-restore', 'Пульт');
    restore.addEventListener('pointerdown', e => { e.preventDefault(); userHid = false; setShown(true); });
    const left = el('div', 'tk-sl');
    left.appendChild(pad());
    const right = el('div', 'tk-sr');
    quick = el('div', 'tk-quick');
    const face = el('div', 'tk-face');
    face.append(key('KeyQ', 'Q', '', false, 'tk-q'), key('KeyE', 'E', '', false, 'tk-e'), key('Escape', 'B', 'Назад', false, 'tk-b'), key('Enter', 'A', 'OK', false, 'tk-a'));
    right.append(quick, face);
    panel = el('div', 'tk-panel');
    panel.hidden = true;
    const grid = el('div', 'tk-grid');
    PANEL.forEach(([code, cap, label, latch]) => grid.appendChild(key(code, cap, label, latch, code === 'F8' ? 'tk-debug' : '')));
    const close = el('div', 'tk-key tk-close', 'Закрыть');
    close.addEventListener('pointerdown', e => { e.preventDefault(); panel.hidden = true; });
    panel.append(el('div', 'tk-title', 'Клавиши'), grid, close);
    ui.append(top, left, right, panel, restore);
    document.body.appendChild(ui);
    ui.addEventListener('contextmenu', e => e.preventDefault());
    setInterval(fillQuick, 200);
    fillQuick();
  }

  function start() {
    if (!root()) return;
    build();
    bindCanvasTouch();
    const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    setShown(!!coarse);
    window.addEventListener('touchstart', () => { if (!userHid && !document.body.classList.contains('tk-on')) setShown(true); }, { passive: true, capture: true });
    window.addEventListener('keydown', e => { if (e.isTrusted) setShown(false); }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
