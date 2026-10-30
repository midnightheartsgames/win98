(function (root) {
  'use strict';
  if (root.Parohod98Report) return;

  const SAVE_LIMIT = 4 * 1048576;
  const SENT_KEY = 'parohod98.bugs.sent';
  const ru = /^ru\b/i.test((root.navigator && root.navigator.language) || 'ru');
  const L = (a, b) => (ru ? a : b);
  const KINDS = [['bug', L('Не работает', 'Does not work')], ['crash', L('Зависло или вылетело', 'Froze or crashed')], ['visual', L('Графика', 'Graphics')], ['text', L('Текст', 'Text')], ['sound', L('Звук', 'Sound')], ['balance', L('Баланс', 'Balance')], ['idea', L('Идея', 'Idea')]];
  const REPEATS = [['always', L('Всегда', 'Always')], ['sometimes', L('Иногда', 'Sometimes')], ['once', L('Один раз', 'Once')], ['unknown', L('Не проверял', 'Not checked')]];
  const PREFIXES = { serioussam: ['ss98-'], forza: ['fh_riga_', 'fh_photo_probe'], gtann: ['gtann_'], launcher: ['parohod98.'] };

  const pad = n => String(n).padStart(2, '0');
  const at = (x, z) => 'x ' + Math.round(x) + ', z ' + Math.round(z);
  const call = (fn, fallback) => {
    try {
      return fn();
    } catch (err) {
      return fallback;
    }
  };

  const capped = new Map();
  const uncap = (obj, key, on) => {
    if (on) {
      capped.set(obj, obj[key]);
      obj[key] = 0;
    } else if (capped.has(obj)) {
      obj[key] = capped.get(obj);
      capped.delete(obj);
    }
  };

  const GAMES = {
    serioussam: {
      where() {
        const u = root.ssui, g = u && u.game;
        if (!g || u.state === 'title') return { summary: 'Serious Sam 98 > ' + L('Главное меню', 'Main menu'), state: u ? u.state : '', menu: u ? u.menu : '' };
        const waves = Object.values(g.waves || {}).filter(w => w.started && !w.done).map(w => w.id);
        const p = g.player || {};
        return {
          summary: 'Serious Sam 98 > ' + L('Уровень', 'Level') + ' ' + (g.levelIndex + 1) + '. ' + call(() => u.L(g.def.name), '') + (waves.length ? ' > ' + L('волна', 'wave') + ' ' + waves.join(', ') : ''),
          state: u.state, menu: u.menu || '', level: g.levelIndex, skill: g.skillIndex, waves, pos: [p.x, p.y, p.z].map(v => Math.round((v || 0) * 10) / 10), hp: Math.round(p.hp || 0)
        };
      },
      pause() {
        const u = root.ssui;
        if (u && u.game && u.state === 'play' && !u.menu) u.openMenu('pause');
      },
      clean(on) {
        const u = root.ssui;
        if (!u || !u.hud) return;
        u.cleanShot = on;
        uncap(u.options, 'fpsCap', on);
        u.drawHud();
      }
    },
    forza: {
      where() {
        const u = root.fzui, g = u && u.game;
        if (!g || u.mode !== 'play') return { summary: 'Forza Horizon: Рига > ' + L('Главное меню', 'Main menu'), mode: u ? u.mode : '' };
        const v = g.veh || {};
        const clock = g.clock || 0;
        const time = pad(Math.floor(clock)) + ':' + pad(Math.floor((clock % 1) * 60));
        const race = g.race && g.race.ev;
        return {
          summary: 'Forza Horizon: Рига > ' + (race ? L('Гонка', 'Race') + ': ' + race.name : L('Свободная езда', 'Free roam')) + ' > ' + at(v.x || 0, v.z || 0) + ', ' + time,
          mode: g.mode, event: race ? race.id : '', pos: [Math.round(v.x || 0), Math.round(v.z || 0)], clock: Math.round(clock * 100) / 100, weather: g.weather, menu: u.menus && u.menus.open
        };
      },
      pause() {
        const u = root.fzui;
        if (u && u.mode === 'play' && u.game && u.menus && !u.menus.open) u.openPause();
      },
      clean(on) {
        const u = root.fzui;
        if (u && u.menuEl) u.menuEl.style.visibility = on ? 'hidden' : '';
        if (u && u.settings) uncap(u.settings(), 'fps', on);
      }
    },
    gtann: {
      where() {
        const u = root.nnui, g = u && u.game;
        if (!g || u.state === 'menu' || u.state === 'loading') return { summary: 'GTA: Нижний Сити > ' + L('Главное меню', 'Main menu'), state: u ? u.state : '' };
        const pl = (g.world && g.world.player) || {};
        const m = g.mission && g.mission.def;
        const clock = (g.world && g.world.clock) || 0;
        return {
          summary: 'GTA: Нижний Сити > ' + (m ? L('Миссия', 'Mission') + ' ' + (m.title || m.name || m.id) : L('Свободная игра', 'Free roam')) + ' > ' + at(pl.x || 0, pl.z || 0) + ', ' + pad(Math.floor(clock / 60) % 24) + ':' + pad(Math.floor(clock % 60)),
          state: u.state, mission: m ? m.id : '', pos: [Math.round(pl.x || 0), Math.round(pl.z || 0)], clock: Math.round(clock), inCar: !!pl.car
        };
      },
      pause() {
        const u = root.nnui;
        if (u && u.state === 'play') u.pause('main');
      },
      clean(on) {
        const u = root.nnui;
        if (u && u.menuEl) u.menuEl.style.visibility = on ? 'hidden' : '';
        if (u && u.settings) uncap(u.settings, 'fps', on);
      }
    }
  };

  const CSS = [
    '.p98r{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:max(6px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));box-sizing:border-box;font:14px/1.3 "DejaVu Sans Condensed",Arimo,Tahoma,sans-serif;color:#d8ded3;touch-action:auto;-webkit-user-select:none;user-select:none}',
    '.p98r *{box-sizing:border-box}',
    '.p98r-box{width:min(900px,100%);max-height:100%;display:flex;gap:10px;background:#4c5844;border:2px solid;border-color:#8c9880 #292c21 #292c21 #8c9880;padding:8px}',
    '.p98r-shot{flex:1 1 52%;min-width:0;display:flex;flex-direction:column;gap:4px}',
    '.p98r-shot canvas{width:100%;flex:1 1 auto;min-height:0;object-fit:contain;background:#292c21;touch-action:none;display:block}',
    '.p98r-form{flex:1 1 48%;min-width:0;display:flex;flex-direction:column;gap:6px;overflow-y:auto}',
    '.p98r h2{margin:0;font-size:14px;color:#c4b550;text-transform:uppercase;letter-spacing:1px}',
    '.p98r small{color:#a0aa95;font-size:13px}',
    '.p98r input[type=text],.p98r textarea,.p98r select{width:100%;font:inherit;color:#d8ded3;background:#3e4637;border:2px solid;border-color:#292c21 #8c9880 #8c9880 #292c21;padding:6px 8px;border-radius:0;-webkit-user-select:text;user-select:text}',
    '.p98r input[type=text],.p98r select{min-height:44px}',
    '.p98r textarea{min-height:64px;flex:1 1 auto;resize:none}',
    '.p98r-row{display:flex;gap:6px}',
    '.p98r-row>*{flex:1 1 0;min-width:0}',
    '.p98r label.p98r-check{display:flex;align-items:center;gap:8px;min-height:44px}',
    '.p98r label.p98r-check input{width:24px;height:24px;accent-color:#c4b550}',
    '.p98r button{min-height:44px;padding:0 12px;font:inherit;font-weight:700;color:#d8ded3;background:#3e4637;border:2px solid;border-color:#8c9880 #292c21 #292c21 #8c9880;border-radius:0;text-transform:uppercase;touch-action:manipulation}',
    '.p98r button:active{border-color:#292c21 #8c9880 #8c9880 #292c21}',
    '.p98r button.main{color:#c4b550}',
    '.p98r button:disabled{color:#6f7a66}',
    '.p98r-note{color:#c4b550;min-height:1.3em}',
    '.p98r-done{flex-direction:column;align-items:stretch;max-width:520px;text-align:left}',
    '.p98r-done p{margin:4px 0 10px;line-height:1.4}'
  ].join('');

  let open = null;
  let installed = null;

  function el(tag, props, children) {
    const e = root.document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e[k] = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of [].concat(children || [])) if (c) e.appendChild(typeof c === 'string' ? root.document.createTextNode(c) : c);
    return e;
  }

  function style() {
    if (root.document.getElementById('p98r-style')) return;
    root.document.head.appendChild(el('style', { id: 'p98r-style', text: CSS }));
  }

  function saveArchive(app) {
    const prefixes = PREFIXES[app] || [];
    const ls = {};
    try {
      for (let i = 0; i < root.localStorage.length; i++) {
        const k = root.localStorage.key(i);
        if (k && prefixes.some(p => k.startsWith(p)) && k !== SENT_KEY) ls[k] = root.localStorage.getItem(k);
      }
    } catch (err) {}
    const size = Object.entries(ls).reduce((s, [k, v]) => s + k.length + String(v).length, 0);
    if (!Object.keys(ls).length) return null;
    return { format: 'Win98Backup', version: 1, id: 'set_' + Date.now().toString(36), label: 'parohod98 ' + app, created: new Date().toISOString(), components: ['parohod98-' + app], sizes: { ['parohod98-' + app]: size }, size, data: { ls, idb: {} } };
  }

  async function gzip(text) {
    if (typeof root.CompressionStream !== 'function') return null;
    return new Response(new Blob([text]).stream().pipeThrough(new root.CompressionStream('gzip'))).blob();
  }

  function sizeText(bytes) {
    return bytes < 1e6 ? Math.max(1, Math.round(bytes / 1e3)) + L(' КБ', ' KB') : (bytes / 1e6).toFixed(1).replace('.', ru ? ',' : '.') + L(' МБ', ' MB');
  }

  function remember(id, status) {
    try {
      const list = JSON.parse(root.localStorage.getItem(SENT_KEY) || '[]');
      list.unshift({ id, status, at: new Date().toISOString() });
      root.localStorage.setItem(SENT_KEY, JSON.stringify(list.slice(0, 50)));
    } catch (err) {}
  }

  function markable(shot) {
    const view = el('canvas');
    const marks = [];
    const src = shot && shot.canvas;
    view.width = src ? src.width : 320;
    view.height = src ? src.height : 180;
    const g = view.getContext('2d');
    let drag = null;
    const draw = () => {
      g.fillStyle = '#292c21';
      g.fillRect(0, 0, view.width, view.height);
      if (src) g.drawImage(src, 0, 0);
      g.strokeStyle = '#ff0000';
      g.lineWidth = Math.max(3, view.width / 300);
      for (const r of marks.concat(drag ? [drag] : [])) g.strokeRect(r.x, r.y, r.w, r.h);
      if (!src) {
        g.fillStyle = '#a0aa95';
        g.font = '16px sans-serif';
        g.fillText(L('Кадр не снялся', 'No screenshot'), 16, 32);
      }
    };
    const point = e => {
      const r = view.getBoundingClientRect();
      const k = Math.min(r.width / view.width, r.height / view.height);
      const ox = (r.width - view.width * k) / 2, oy = (r.height - view.height * k) / 2;
      return { x: Math.max(0, Math.min(view.width, (e.clientX - r.left - ox) / k)), y: Math.max(0, Math.min(view.height, (e.clientY - r.top - oy) / k)) };
    };
    view.onpointerdown = e => {
      if (!src) return;
      view.setPointerCapture(e.pointerId);
      const p = point(e);
      drag = { x0: p.x, y0: p.y, x: p.x, y: p.y, w: 0, h: 0 };
    };
    view.onpointermove = e => {
      if (!drag) return;
      const p = point(e);
      Object.assign(drag, { x: Math.min(drag.x0, p.x), y: Math.min(drag.y0, p.y), w: Math.abs(p.x - drag.x0), h: Math.abs(p.y - drag.y0) });
      draw();
    };
    view.onpointerup = view.onpointercancel = () => {
      if (drag && drag.w > view.width / 40 && drag.h > view.height / 40) marks.push({ x: drag.x, y: drag.y, w: drag.w, h: drag.h });
      drag = null;
      draw();
    };
    draw();
    return { view, marks, clear: () => { marks.length = 0; draw(); } };
  }

  function close() {
    if (!open) return;
    const o = open;
    open = null;
    o.layer.remove();
    root.parohod98Back = o.back;
    if (o.opts.onClose) o.opts.onClose();
  }

  function swallow(layer) {
    for (const type of ['keydown', 'keyup', 'keypress', 'pointerdown', 'pointerup', 'pointermove', 'touchstart', 'touchmove', 'touchend', 'mousedown', 'mouseup', 'mousemove', 'wheel', 'contextmenu']) {
      layer.addEventListener(type, e => {
        e.stopPropagation();
        if (type === 'keydown' && e.key === 'Escape') close();
      });
    }
  }

  function done(box, title, text) {
    box.textContent = '';
    box.className = 'p98r-box p98r-done';
    box.appendChild(el('h2', { text: title }));
    box.appendChild(el('p', { text }));
    const ok = el('button', { type: 'button', class: 'main', text: L('Закрыть', 'Close'), onclick: close });
    box.appendChild(ok);
    ok.focus();
  }

  async function send(state) {
    const { opts, form, picture, box } = state;
    form.send.disabled = true;
    form.note.textContent = L('Отправляем...', 'Sending...');
    const app = opts.app;
    const report = await root.BugReport.build({
      source: 'parohod98',
      user: { title: form.title.value, text: form.text.value, kind: form.kind.value, repeat: form.repeat.value },
      where: Object.assign({ window: '', app }, state.where),
      apps: { [app]: Object.assign({ where: state.where }, opts.state ? call(opts.state, {}) : {}) }
    });
    const files = {};
    if (state.shot && state.shot.canvas) {
      const enc = await root.BugShot.encode(state.shot, { marks: picture.marks });
      Object.assign(files, enc.files);
      Object.assign(report.attach, enc.attach);
    }
    if (state.save && form.save && form.save.checked) {
      const gz = await gzip(JSON.stringify(state.save));
      if (gz && gz.size <= SAVE_LIMIT) {
        files['save.json.gz'] = gz;
        report.attach.save = 'save.json.gz';
        report.attach.saveComponent = 'parohod98-' + app;
      } else report.attach.saveSkipped = gz ? 'too large: ' + gz.size : 'no gzip';
    }
    try {
      const r = await root.BugReport.send(report, files);
      remember(r.id, 'received');
      done(box, L('Отчёт отправлен', 'Report sent'), L('Номер ' + r.id + '. Спасибо! Когда ошибку исправят, это будет в «Что нового».', 'Number ' + r.id + '. Thank you! When the bug is fixed, it shows in What’s new.'));
    } catch (err) {
      if (root.BugReport.shouldQueue(err)) {
        await root.BugReport.queue(report, files);
        remember(report.id, 'queued');
        done(box, L('Отчёт сохранён', 'Report saved'), L('Сейчас нет связи с сервером. Отчёт ' + report.id + ' уйдёт сам, когда связь появится.', 'No connection to the server now. Report ' + report.id + ' goes out by itself when the connection is back.'));
      } else if (err.status === 429) {
        form.note.textContent = L('Слишком много отчётов за час. Попробуйте позже.', 'Too many reports this hour. Try later.');
        form.send.disabled = false;
      } else {
        form.note.textContent = L('Сервер не принял отчёт: ', 'The server refused the report: ') + err.message;
        form.send.disabled = false;
      }
    }
  }

  async function show(options) {
    if (open || !root.BugReport || !root.document) return false;
    const opts = Object.assign({}, installed || {}, options || {});
    const app = opts.app || 'launcher';
    const game = GAMES[app];
    open = { opts, layer: null, back: root.parohod98Back };
    if (game && game.clean) call(() => game.clean(true));
    const shot = root.BugShot ? await call(() => root.BugShot.capture(), null) : null;
    if (game && game.clean) call(() => game.clean(false));
    if (game && opts.pause !== false) call(() => game.pause());
    if (opts.onOpen) call(opts.onOpen);
    const where = opts.where ? call(opts.where, { summary: app }) : game ? call(() => game.where(), { summary: app }) : { summary: app };
    const save = saveArchive(app);
    style();
    const picture = markable(shot);
    const form = {
      title: el('input', { type: 'text', maxlength: 200, placeholder: L('Коротко: что не так', 'In short: what is wrong') }),
      text: el('textarea', { maxlength: 4000, placeholder: L('Что делали и что случилось', 'What you did and what happened') }),
      kind: el('select', { 'aria-label': L('Вид ошибки', 'Kind') }, KINDS.map(([v, t]) => el('option', { value: v, text: t }))),
      repeat: el('select', { 'aria-label': L('Как часто', 'How often') }, REPEATS.map(([v, t]) => el('option', { value: v, text: t }))),
      save: save ? el('input', { type: 'checkbox', checked: true }) : null,
      note: el('div', { class: 'p98r-note' }),
      send: el('button', { type: 'button', class: 'main', text: L('Отправить', 'Send'), disabled: true })
    };
    form.repeat.value = 'unknown';
    const ready = () => { form.send.disabled = !(form.title.value.trim() || form.text.value.trim()); };
    form.title.oninput = form.text.oninput = ready;
    const box = el('div', { class: 'p98r-box', role: 'dialog' }, [
      el('div', { class: 'p98r-shot' }, [
        el('h2', { text: L('Сообщить об ошибке', 'Report a bug') }),
        el('small', { text: shot && shot.canvas ? L('Обведите пальцем, где ошибка', 'Draw a frame around the problem') : '' }),
        picture.view,
        shot && shot.canvas ? el('button', { type: 'button', text: L('Убрать рамки', 'Clear frames'), onclick: picture.clear }) : null
      ]),
      el('div', { class: 'p98r-form' }, [
        form.title,
        form.text,
        el('div', { class: 'p98r-row' }, [form.kind, form.repeat]),
        save ? el('label', { class: 'p98r-check' }, [form.save, L('Приложить сохранение', 'Attach save data') + ' (' + sizeText(save.size) + ')']) : null,
        el('small', { text: L('Где', 'Where') + ': ' + (where.summary || app) }),
        form.note,
        el('div', { class: 'p98r-row' }, [el('button', { type: 'button', text: L('Отмена', 'Cancel'), onclick: close }), form.send])
      ])
    ]);
    const layer = el('div', { class: 'p98r' }, box);
    swallow(layer);
    open.layer = layer;
    root.parohod98Back = () => { close(); return true; };
    const state = { opts, form, picture, box, shot, where, save };
    form.send.onclick = () => send(state).catch(err => {
      form.note.textContent = String(err && err.message || err);
      form.send.disabled = false;
    });
    root.document.body.appendChild(layer);
    return true;
  }

  function install(opts) {
    installed = Object.assign({}, opts);
    root.addEventListener('keydown', e => {
      if (e.key !== 'F10' || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      e.stopPropagation();
      show();
    }, true);
  }

  root.Parohod98Report = { open: show, close, install, isOpen: () => !!open, GAMES, PREFIXES, SENT_KEY };
  const flag = root.Parohod98;
  if (flag && typeof flag === 'object' && GAMES[flag.game]) install({ app: flag.game });
})(typeof window !== 'undefined' ? window : globalThis);
