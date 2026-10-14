(function (AW) {
  'use strict';

  const el = (t, c, p, s) => AW.el(t, c, p, s);
  const T = k => (AW.TEXT && AW.TEXT[k]) || '';
  const R = AW.Rules;

  function txt(parent, cls, x, y, s, center) {
    const d = el('div', cls + (center ? ' aw-center' : ''), parent, { left: x + 'px', top: y + 'px' });
    d.textContent = s;
    return d;
  }

  function screen(ui, kind, onKey) {
    ui.clearLayer();
    const scr = { kind, ui, el: el('div', 'aw-screen', ui.layer) };
    scr.el.addEventListener('mousedown', ev => ev.stopPropagation());
    scr.el.addEventListener('contextmenu', ev => ev.preventDefault());
    scr.onKey = onKey || (() => true);
    ui.screen = scr;
    ui.screenPause = true;
    ui.tip('');
    ui.setCursor('CURSOR');
    return scr;
  }

  function closeScreen(ui) {
    if (!ui.screen) return;
    ui.screen.el.remove();
    ui.screen = null;
    ui.screenPause = false;
  }

  AW.MenuUI = {
    showMain(ui) {
      ui.hideLoading();
      if (ui.game.hud) ui.game.hud.setVisible(false);
      const scr = screen(ui, 'menu', ev => {
        if (ev.code === 'Escape') return true;
        return true;
      });
      scr.close = () => {};
      ui.audio.music('menu');
      AW.spr('gui/menu/panelglowny', 0, 0, scr.el, 0, 0);
      const dinks = AW.spr('gui/menu/dinks', 0, 0, scr.el, 260, -200, { cls: 'aw-hit' });
      let dy = -200, v = 27, t = 0;
      const tick = () => {
        if (!dinks.isConnected) return;
        t++;
        if (dy < -20) { dy = Math.min(-20, dy + v); v = Math.max(4, v * 0.93); dinks.style.top = dy + 'px'; }
        else if (t % 20 === 0) AW.setSpr(dinks, 'gui/menu/dinks', 0, (t / 20) % 2);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      ui.audio.play('locations/wajcha_metal_krok4', undefined, undefined, 70);
      dinks.addEventListener('mousedown', () => AW.MenuUI.credits(ui));
      const items = [
        ['NewGame', () => AW.MenuUI.createHero(ui)],
        ['LoadGame', () => AW.MenuUI.saveLoad(ui, true, true)],
        ['Options', () => AW.MenuUI.options(ui, true)],
        ['Exit', () => { if (ui.opts.onExit) ui.opts.onExit(); }]
      ];
      items.forEach(([key, fn], i) => {
        const y = 188 + i * 83;
        const b = AW.spr('gui/menu/buttonzgaszony', 0, 0, scr.el, 240, y, { cls: 'aw-hit' });
        const l = txt(scr.el, 'aw-menubtn', 400, y + 30, T(key) || key, true);
        l.style.pointerEvents = 'none';
        b.addEventListener('mouseenter', () => { AW.setSpr(b, 'gui/menu/buttonzapalony', 0, 0); l.classList.add('on'); ui.audio.play('menu/click7', undefined, undefined, 50); });
        b.addEventListener('mouseleave', () => { AW.setSpr(b, 'gui/menu/buttonzgaszony', 0, 0); l.classList.remove('on'); });
        b.addEventListener('mousedown', ev => { if (ev.button !== 0) return; ui.audio.play('menu/click1'); fn(); });
      });
      const ver = txt(scr.el, 'aw-ver', 790, 580, 'Another War 98 · Акт I', false);
      ver.style.left = 'auto';
      ver.style.right = '10px';
    },

    credits(ui) {
      const scr = screen(ui, 'credits', ev => { if (ev.code === 'Escape' || ev.code === 'Space' || ev.code === 'Enter') AW.MenuUI.showMain(ui); return true; });
      AW.spr('gui/menu/panelglowny', 0, 0, scr.el, 0, 0);
      AW.spr('gui/menu/credits', 0, 0, scr.el, 0, 0);
      const roll = el('div', 'aw-credits', scr.el);
      const lines = [
        ['h', 'ALIEN ARTEFACT'], ['', 'Mirage Interactive, 2002'], ['', ''],
        ['h', 'Руководитель проекта'], ['', 'Paweł Smyła'], ['h', 'Сценарий, тексты, скрипты'], ['', 'Michał Sadowski'],
        ['h', 'Анимация и персонажи'], ['', 'Łukasz Górny-Zając'], ['h', 'Графика'], ['', 'Bartłomiej Gabryś'], ['', 'Michał Nowak'], ['', 'Paweł Siomek'],
        ['h', 'Программирование'], ['', 'Bartek Sokołowski'], ['', 'Maciej Walaszek'], ['h', 'Музыка и звук'], ['', 'Leszek Brzdęk'],
        ['h', 'Запись речи'], ['', 'Janusz Borysiak'], ['h', 'Кастинг и режиссура озвучания'], ['', 'Artur Kruczek'], ['', ''],
        ['h', 'Win 98 Edition'], ['', 'Перенос в браузер, тексты первого акта заново'], ['', ''], ['', 'Щелкните, чтобы вернуться']
      ];
      for (const [c, s] of lines) el('div', c === 'h' ? 'aw-cred-h' : 'aw-cred', roll).textContent = s;
      scr.el.addEventListener('mousedown', () => AW.MenuUI.showMain(ui));
    },

    createHero(ui) {
      let clsIdx = 0;
      const st = { name: '', add: {}, left: 4 };
      const scr = screen(ui, 'create', ev => {
        if (ev.code === 'Escape') { AW.MenuUI.showMain(ui); return true; }
        if (ev.code === 'Enter') { go(); return true; }
        return false;
      });
      const cls = () => R.CLASS_ORDER[clsIdx];
      const go = () => {
        if (st.left > 0) { ui.audio.play('menu/accept3'); return; }
        const base = Object.assign({}, R.CLASSES[cls()].base);
        for (const k of Object.keys(st.add)) base[k] += st.add[k];
        closeScreen(ui);
        ui.audio.play('menu/accept4');
        ui.game.newGame({ cls: cls(), name: st.name.trim() || 'Зигмунт', stats: base });
      };
      const render = () => {
        const E = scr.el;
        E.innerHTML = '';
        AW.spr('gui/select/karta', 0, 0, E, 0, 0);
        AW.spr('gui/select/pasek', 0, 0, E, 450, 95);
        AW.spr('gui/select/' + { strongman: 'strongman', thief: 'thief', intel: 'inteligent' }[cls()], 0, 0, E, 533, 116);
        txt(E, 'aw-sel', 592, 60, R.CLASSES[cls()].name, true);
        AW.spr('gui/select/pasek', 0, 0, E, 40, 95);
        txt(E, 'aw-sel', 182, 60, 'Характеристики', true);
        const base = R.CLASSES[cls()].base;
        const rows = R.STATS;
        let y = 130;
        rows.forEach((s, n) => {
          AW.spr('gui/select/pasek', 0, 0, E, 40, y + 34);
          const lab = txt(E, 'aw-sel', 70, y, R.STAT_NAMES[s] + ':');
          lab.classList.add('aw-hit');
          lab.addEventListener('mouseenter', () => { ui.tip(R.STAT_DESC[s]); });
          lab.addEventListener('mouseleave', () => ui.tip(''));
          txt(E, 'aw-sel', 240, y, String(base[s] + (st.add[s] || 0)));
          const p = AW.spr('gui/select/plus1', 0, 0, E, 290, y + 2, { cls: 'aw-hit' });
          const m = AW.spr('gui/select/minus1', 0, 0, E, 330, y + 2, { cls: 'aw-hit' });
          p.addEventListener('mousedown', () => { if (st.left <= 0) { ui.audio.play('menu/choose'); return; } st.add[s] = (st.add[s] || 0) + 1; st.left--; ui.audio.play('menu/click2'); render(); });
          m.addEventListener('mousedown', () => { if (!(st.add[s] > 0)) { ui.audio.play('menu/choose'); return; } st.add[s]--; st.left++; ui.audio.play('menu/click2'); render(); });
          y += 40;
        });
        y += 20;
        const b = Object.assign({}, base);
        for (const k of Object.keys(st.add)) b[k] += st.add[k];
        AW.spr('gui/select/pasek', 0, 0, E, 40, y + 34);
        txt(E, 'aw-sel', 70, y, R.STAT_NAMES.ac + ':');
        txt(E, 'aw-sel', 240, y, String(R.acBase(b.agi, 1)));
        y += 40;
        AW.spr('gui/select/pasek', 0, 0, E, 40, y + 34);
        txt(E, 'aw-sel', 70, y, R.STAT_NAMES.hp + ':');
        txt(E, 'aw-sel', 240, y, String(R.hpBase(b.end, b.lck)));
        y += 60;
        txt(E, 'aw-sel', 70, y, (T('Left') || 'Осталось') + ':');
        txt(E, 'aw-sel', 240, y, String(st.left));
        AW.spr('gui/select/pasek', 0, 0, E, 450, 300);
        const nameBox = el('input', 'aw-namein', E, { left: '460px', top: '262px', width: '264px' });
        nameBox.value = st.name;
        nameBox.maxLength = 16;
        nameBox.placeholder = 'Зигмунт';
        nameBox.addEventListener('input', () => { st.name = nameBox.value; });
        nameBox.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.code === 'Enter') go(); if (ev.code === 'Escape') AW.MenuUI.showMain(ui); });
        const desc = el('div', 'aw-seldesc', E, { left: '486px', top: '318px', width: '270px' });
        desc.textContent = R.CLASSES[cls()].desc;
        const sk = el('div', 'aw-seldesc aw-small2', E, { left: '486px', top: '462px', width: '205px' });
        sk.textContent = 'Начальный навык: ' + R.SKILLS[R.CLASSES[cls()].skill].name + '. Особый навык: ' + R.special(cls(), R.spRow(cls(), 1)[0]).name + '.';
        const ch = AW.spr('gui/select/rog1', 0, 0, E, 700, 500, { cls: 'aw-hit' });
        ch.title = '';
        ch.addEventListener('mouseenter', () => { AW.setSpr(ch, 'gui/select/rog2', 0, 0); ui.tip('Другой класс'); });
        ch.addEventListener('mouseleave', () => { AW.setSpr(ch, 'gui/select/rog1', 0, 0); ui.tip(''); });
        ch.addEventListener('mousedown', () => { clsIdx = (clsIdx + 1) % 3; st.add = {}; st.left = 4; ui.audio.play('menu/page-turnover2'); render(); });
        const ok = AW.spr('gui/select/ok1', 0, 0, E, 715, 0, { cls: 'aw-hit' });
        ok.addEventListener('mouseenter', () => { AW.setSpr(ok, 'gui/select/ok2', 0, 0); ui.tip(st.left > 0 ? 'Сначала распределите очки' : 'Начать игру'); });
        ok.addEventListener('mouseleave', () => { AW.setSpr(ok, 'gui/select/ok1', 0, 0); ui.tip(''); });
        ok.addEventListener('mousedown', () => go());
        requestAnimationFrame(() => nameBox.focus({ preventScroll: true }));
      };
      render();
    },

    options(ui, fromMenu) {
      const prev = ui.screen;
      if (prev && prev.kind === 'inv') AW.InvUI.close(ui);
      const scr = screen(ui, 'options', ev => { if (ev.code === 'Escape' || ev.code === 'KeyO') { done(); return true; } return true; });
      const S = ui.settings;
      const done = () => {
        ui.saveSettings();
        closeScreen(ui);
        if (fromMenu) AW.MenuUI.showMain(ui);
      };
      AW.spr('gui/options/options-sk1', 0, 0, scr.el, 0, 0);
      txt(scr.el, 'aw-title', 400, 34, T('Opcje') || 'НАСТРОЙКИ ИГРЫ', true);
      const slider = (y, label, get, set) => {
        txt(scr.el, 'aw-opt', 120, y + 12, label);
        const s = AW.spr('gui/options/suwak', 0, 0, scr.el, 470, y, { cls: 'aw-hit' });
        const knob = AW.spr('gui/options/suwak', 0, 2, scr.el, 0, y + 13);
        const x0 = 470 + 12, x1 = 470 + 145;
        const place = () => { knob.style.left = (x0 + (x1 - x0) * get() - 3) + 'px'; };
        place();
        const setFrom = cx => { set(Math.max(0, Math.min(1, (cx - x0) / (x1 - x0)))); place(); };
        s.addEventListener('mousedown', ev => {
          setFrom(ui.toStage(ev).x);
          ui.drag = { move: p => setFrom(p.x), drop: () => { ui.audio.play('menu/click2'); } };
        });
      };
      const check = (y, label, get, set) => {
        txt(scr.el, 'aw-opt', 120, y + 3, label);
        const c = AW.spr('gui/options/checkbox', 0, get() ? 1 : 0, scr.el, 470, y, { cls: 'aw-hit' });
        c.addEventListener('mousedown', () => { set(!get()); AW.setSpr(c, 'gui/options/checkbox', 0, get() ? 1 : 0); ui.audio.play('menu/click2'); });
      };
      slider(120, T('OPT_muzyka') || 'Громкость музыки', () => S.music, v => { S.music = v; ui.audio.setVolume('music', v); });
      slider(175, T('OPT_dzwieki') || 'Громкость эффектов', () => S.sound, v => { S.sound = v; ui.audio.setVolume('sound', v); });
      slider(230, T('OPT_dialogi') || 'Громкость речи', () => S.speech, v => { S.speech = v; ui.audio.setVolume('speech', v); });
      check(300, T('OPT_krew') || 'Кровь', () => S.blood, v => { S.blood = v; });
      check(340, 'Субтитры к озвученным репликам', () => S.subtitles, v => { S.subtitles = v; });
      check(380, T('OPT_cache') || 'Прозрачность', () => S.ztrans, v => { S.ztrans = v; });
      check(420, 'Пауза при потере фокуса окна', () => S.autopause !== false, v => { S.autopause = v; });
      const ex = AW.spr('gui/options/exit', 0, 0, scr.el, 587, 545, { cls: 'aw-hit' });
      const lx = txt(scr.el, 'aw-btnlabel', 655, 559, T('Exit') || 'ВЫХОД', true);
      lx.style.pointerEvents = 'none';
      ex.addEventListener('mousedown', () => { ui.audio.play('menu/click1'); done(); });
    },

    async saveLoad(ui, loading, fromMenu) {
      const prev = ui.screen;
      if (prev && prev.kind === 'inv') AW.InvUI.close(ui);
      const game = ui.game;
      if (!loading && (!game.W || game.W.controlState !== 1 || game.W.dialog)) { if (game.hud) game.hud.addMessage('Сейчас сохраниться нельзя', 'red'); return; }
      const scr = screen(ui, 'saveload', ev => { if (ev.code === 'Escape') { back(); return true; } return true; });
      const back = () => { closeScreen(ui); if (fromMenu) AW.MenuUI.showMain(ui); };
      AW.spr('gui/loadsave/loadsave-sk1', 0, 0, scr.el, 0, 0);
      txt(scr.el, 'aw-title', 400, 30, loading ? (T('PanelLadowania') || 'ЗАГРУЗИТЬ') : (T('PanelNagrywania') || 'СОХРАНИТЬ'), true);
      const info = el('div', 'aw-slotinfo', scr.el, { left: '20px', top: '72px', width: '190px' });
      const info2 = el('div', 'aw-slotinfo', scr.el, { left: '590px', top: '72px', width: '190px' });
      info2.innerHTML = '';
      el('div', 'aw-slot-h', info2).textContent = loading ? 'Загрузка' : 'Сохранение';
      el('div', '', info2).textContent = loading ? 'Выберите запись.' : 'Выберите ячейку. Занятая ячейка будет перезаписана.';
      el('div', '', info2).textContent = 'F11: быстрое сохранение, F12: быстрая загрузка.';
      const slots = [];
      for (let i = 0; i < 8; i++) slots.push(String(i + 1));
      if (loading) slots.push('quick');
      const pos = i => i < 8 ? [230 + (i % 2) * 180, 88 + Math.floor(i / 2) * 116] : [583, 420];
      const datas = await Promise.all(slots.map(s => AW.SaveStore.get('slot' + s)));
      if (ui.screen !== scr) return;
      slots.forEach((slot, i) => {
        const [x, y] = pos(i);
        const d = datas[i];
        const w = i < 8 ? 160 : 204, h = i < 8 ? 74 : 112;
        const box = el('div', 'aw-slot aw-hit' + (d ? '' : ' empty'), scr.el, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
        const m = d && d.meta;
        const title = el('div', 'aw-slot-h', box);
        title.textContent = slot === 'quick' ? 'Быстрое сохранение' : 'Ячейка ' + slot;
        const body = el('div', 'aw-slot-b', box);
        body.textContent = m ? (m.name + ', ' + (R.CLASSES[m.cls] ? R.CLASSES[m.cls].name.toLowerCase() : '') + ', ур. ' + m.level + '\n' + m.place + '\n' + new Date(m.date).toLocaleString('ru-RU')) : (T('PustySlot') || 'Пусто');
        box.addEventListener('mouseenter', () => {
          info.innerHTML = '';
          el('div', 'aw-slot-h', info).textContent = title.textContent;
          if (m) {
            el('div', '', info).textContent = m.name;
            el('div', '', info).textContent = (R.CLASSES[m.cls] ? R.CLASSES[m.cls].name : '') + ', уровень ' + m.level;
            el('div', '', info).textContent = m.place;
            el('div', '', info).textContent = 'В игре: ' + Math.floor(m.play / 3600) + ' ч ' + Math.floor(m.play / 60) % 60 + ' мин';
            el('div', '', info).textContent = new Date(m.date).toLocaleString('ru-RU');
          } else el('div', '', info).textContent = T('PustySlot') || 'Пусто';
        });
        box.addEventListener('mousedown', ev => {
          if (ev.button !== 0) return;
          ui.audio.play('menu/click1');
          if (loading) {
            if (!d) return;
            const doLoad = () => { closeScreen(ui); game.load(slot); };
            if (game.W && game.running) ui.confirm([T('Load1') || 'Вы уверены, что хотите покинуть', T('Load2') || 'текущую игру и загрузить другую?'], doLoad, () => {});
            else doLoad();
          } else {
            const doSave = () => { game.save(slot, '').then(() => back()); };
            if (d) ui.confirm([T('Save1') || 'Вы уверены, что хотите перезаписать', T('Save2') || 'эту игру?'], doSave, () => {});
            else doSave();
          }
        });
      });
      const ex = AW.spr('gui/loadsave/exit', 0, 0, scr.el, 616, 543, { cls: 'aw-hit' });
      const lx = txt(scr.el, 'aw-btnlabel', 684, 557, T('Exit') || 'ВЫХОД', true);
      lx.style.pointerEvents = 'none';
      ex.addEventListener('mousedown', () => { ui.audio.play('menu/click1'); back(); });
    },

    gameMenu(ui) {
      if (ui.screen) return;
      const game = ui.game;
      const scr = screen(ui, 'gamemenu', ev => { if (ev.code === 'Escape') { closeScreen(ui); return true; } return true; });
      const w = 300, h = 250;
      const box = el('div', 'aw-gm', scr.el, { left: (400 - w / 2) + 'px', top: (300 - h / 2) + 'px', width: w + 'px', height: h + 'px' });
      box.appendChild(AW.windowCanvas(w, h));
      const list = el('div', 'aw-gm-list', box);
      const add = (label, fn) => {
        const b = el('button', 'aw-btn aw-btn-wide', list);
        b.textContent = label;
        b.addEventListener('click', ev => { ev.stopPropagation(); ui.audio.play('menu/click1'); fn(); });
      };
      add('Продолжить', () => closeScreen(ui));
      add('Сохранить игру', () => { closeScreen(ui); AW.MenuUI.saveLoad(ui, false); });
      add('Загрузить игру', () => { closeScreen(ui); AW.MenuUI.saveLoad(ui, true); });
      add('Настройки', () => { closeScreen(ui); AW.MenuUI.options(ui); });
      add('Помощь', () => { closeScreen(ui); AW.MenuUI.help(ui); });
      add('Выйти в главное меню', () => ui.confirm([T('Quit11') || 'Вы уверены, что хотите покинуть', T('Quit12') || 'текущую игру?'], () => { closeScreen(ui); game.endGame(); }, () => {}));
    },

    help(ui) {
      const scr = screen(ui, 'help', () => { closeScreen(ui); return true; });
      scr.el.classList.add('aw-help');
      AW.spr('gui/options/options-sk1', 0, 0, scr.el, 0, 0);
      txt(scr.el, 'aw-title', 400, 34, T('Pomoc') || 'ПОМОЩЬ', true);
      const rows = [
        ['Левая кнопка мыши', 'идти; щелчок по предмету или человеку: осмотреть'], ['Правая кнопка мыши', 'использовать, говорить'],
        ['Shift (удерживать)', 'бежать'], ['W', 'переключить шаг и бег'], ['D', 'достать или убрать оружие'],
        ['Ctrl + левая кнопка', 'стрелять или бить в точку'], ['Левая кнопка по врагу', 'атаковать (в боевом режиме)'],
        ['Enter', 'атаковать ближайшего врага'], ['R', 'перезарядить'], ['E', 'починить оружие инструментом'],
        ['1-7', 'предмет с пояса'], ['I, S, N, M', 'снаряжение, параметры, дневник, карта'], ['F1-F8, Пробел', 'выбрать и применить особый навык'],
        ['P', 'пауза'], ['Ctrl+S, Ctrl+L', 'сохранить, загрузить'], ['F11, F12', 'быстрое сохранение и загрузка'], ['Esc', 'меню игры'],
        ['H', 'этот экран']
      ];
      const t = el('div', 'aw-helptab', scr.el);
      for (const [k, v] of rows) {
        const r = el('div', 'aw-helprow', t);
        el('span', 'aw-helpk', r).textContent = k;
        el('span', 'aw-helpv', r).textContent = v;
      }
      txt(scr.el, 'aw-opt', 400, 500, 'Нажмите любую клавишу или щелкните', true);
      scr.el.addEventListener('mousedown', () => closeScreen(ui));
    },

    popup(ui, name, sec, cb) {
      const lines = {
        maja: [T('ActMaja1'), T('ActMaja2') || 'Пятое мая 1947 года', T('ActMaja3') || '20:52'],
        gdzies: [T('ActGdzies1'), T('ActGdzies2'), T('ActGdzies3') || 'Где-то на юге Франции'],
        kilka: [T('ActKilka1'), T('ActKilka2') || 'Несколько лет назад...', T('ActKilka3')],
        act1: [T('Act1txt1') || 'В поисках', T('Act1txt2') || 'никто не знает', T('Act1txt3') || 'чего...'],
        act2: [T('Act2txt1') || 'Двойной', T('Act2txt2'), T('Act2txt3') || 'Риббентроп']
      }[name] || [name];
      const box = el('div', 'aw-popup', ui.modalEl);
      if (name === 'act1' || name === 'act2') {
        AW.spr('gui/popup/' + name, 0, 0, box, 0, 0);
        const t = el('div', 'aw-popup-act', box);
        el('div', 'aw-popup-actn', t).textContent = name === 'act1' ? 'Акт I' : 'Акт II';
        for (const l of lines) if (l) el('div', '', t).textContent = l;
      } else {
        const t = el('div', 'aw-popup-text', box);
        for (const l of lines) if (l) el('div', '', t).textContent = l;
      }
      if (name === 'act1') ui.audio.music('act1');
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        box.classList.add('out');
        setTimeout(() => box.remove(), 400);
        ui.onKeyOverride = null;
        if (cb) cb();
      };
      box.addEventListener('mousedown', ev => { ev.stopPropagation(); finish(); });
      ui.onKeyOverride = ev => { if (ev.code === 'Space' || ev.code === 'Enter' || ev.code === 'Escape') finish(); return true; };
      setTimeout(finish, (sec || 3) * 1000);
    },

    departure(ui) {
      ui.game.W.requestLevel('B00_Part');
    },

    actEnd(ui) {
      const game = ui.game;
      game.running = false;
      ui.audio.stopLoops();
      ui.audio.stopAllVoices();
      if (game.hud) game.hud.setVisible(false);
      ui.overlay.innerHTML = '';
      game.sayEls = null;
      game.fadeEl = null;
      game.pauseEl = null;
      AW.SaveStore.put('act1done', { date: Date.now(), name: game.W && game.W.hero ? game.W.hero.name : '' });
      const scr = screen(ui, 'actend', () => true);
      ui.audio.music('france-fin');
      AW.spr('gui/popup/act2', 0, 0, scr.el, 0, 0);
      const t = el('div', 'aw-popup-act', scr.el);
      el('div', 'aw-popup-actn', t).textContent = 'Акт II';
      el('div', '', t).textContent = 'Югославия';
      el('div', 'aw-small2', t).textContent = T('Congratulations2') || 'Продолжение следует...';
      const end = el('div', 'aw-actend-text', scr.el);
      end.textContent = 'Починенный грузовик увозит вас и Иоганна из Аннет. С собой у вас карта, которую Пьер Доль спрятал под церковью, и приказ о его переводе в Югославию. Первый акт пройден.';
      const b = el('button', 'aw-btn aw-actend-btn', scr.el);
      b.textContent = 'В главное меню';
      b.addEventListener('click', () => { closeScreen(ui); game.endGame(); });
    }
  };
})(globalThis.AW = globalThis.AW || {});
