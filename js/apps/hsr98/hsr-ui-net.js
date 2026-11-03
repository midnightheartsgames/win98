(function (H) {
  'use strict';
  const { W, HGT, C } = H.UI_CONST;
  const STATE_TEXT = {
    off: 'Связь выключена',
    connecting: 'Подключаемся…',
    offline: 'Нет связи. Пробуем снова',
    modem: 'Модем отключён',
    outdated: 'Обновите игру: версия связи устарела',
    replaced: 'Аккаунт подключился в другом месте',
    denied: 'Сервер не принял этот аккаунт',
    banned: 'Аккаунт закрыт автором игры'
  };
  const CONSENT = [
    'Эфирная связь работает через сервер автора игры на pennygachi.men.',
    'Друзья увидят ваше имя, уровень Освоения, аватар, подпись, витрину героев и заслуги, а также то, чем вы заняты в игре. Друзья могут зайти в копию вашего Экспресса: экипаж, наряды и пластинка там будут ваши. Тот, кто знает ваш UID, увидит имя, уровень и аватар. Записи в чужой гостевой книге видят её хозяин и его гости.',
    'Сохранения, почта и день рождения не отправляются. Адрес IP сервер держит только в памяти и не записывает. Удалить все данные можно в настройках связи.'
  ];
  const HINTS = {
    auto: 'Связь включается при запуске игры. Без связи игра работает как обычно.',
    link: 'Включить или выключить связь сейчас.',
    code: 'Код переносит аккаунт на другое устройство и возвращает его после переустановки.',
    enter: 'Наберите код с другого устройства, чтобы играть под тем же UID.',
    wipe: 'Сервер сотрёт ваши данные, а UID сменится. Сохранения игры останутся.',
    reqs: 'Кто может прислать вам запрос в друзья.',
    guests: 'Кто может зайти к вам в Экспресс, когда появятся визиты.',
    bday: 'Показывать день рождения друзьям в карточке профиля. Обычно он остаётся при вас.'
  };
  const net = () => globalThis.Net98;
  const linked = n => n.state === 'online' || n.state === 'connecting';
  const groupedCode = n => {
    const parts = n.code().split('-');
    return { uid: parts[0], secret: parts.slice(1).join(' - ') };
  };

  Object.assign(H.UI.prototype, {
    netStateText() {
      const n = net();
      if (!n) return STATE_TEXT.off;
      if (n.state === 'online') return n.rtt == null ? 'На связи' : 'На связи, ' + Math.round(n.rtt) + ' мс';
      return STATE_TEXT[n.state];
    },

    guardCodeScreen(screen) {
      const ui = this, n = net();
      n.codeScreen = () => {
        const i = ui.screens.indexOf(screen);
        if (i >= 0) ui.screens.splice(i, 1);
        n.codeScreen = null;
        ui.render();
      };
      screen.onClose = () => { n.codeScreen = null; };
      return screen;
    },

    openNetLink() {
      return net().hasConsent() ? this.openNetSettings() : this.openNetConsent(() => this.openNetSettings());
    },

    openNetConsent(after) {
      const ui = this, n = net();
      const accept = () => { ui.screens.pop(); n.setConsent(true); if (after) after(); else ui.sfx('confirm'); };
      const refuse = () => ui.pop();
      return this.push({
        netConsent: true, sel: 1,
        draw(c) {
          const x = 110, w = 420, tx = x + 22, tw = w - 44, paras = CONSENT.map(p => ui.wrap(p, tw, 12));
          const h = 106 + paras.reduce((sum, lines) => sum + lines.length * 16 + 8, 0), y = Math.round((HGT - h) / 2);
          c.fillStyle = 'rgba(2,3,14,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Эфирная связь' });
          let ty = y + 38;
          for (const lines of paras) {
            for (const line of lines) { ui.text(line, tx, ty, { size: 12, col: C.cream }); ty += 16; }
            ty += 8;
          }
          const by = y + h - 50;
          ui.button(tx, by, 200, 28, 'Подключиться', () => { this.sel = 0; accept(); }, { bold: true, active: this.sel === 0 });
          ui.button(x + w - 22 - 150, by, 150, 28, 'Не сейчас', () => { this.sel = 1; refuse(); }, { active: this.sel === 1 });
          ui.hints([['←→', 'Выбор'], ['Enter', 'Нажать'], ['Esc', 'Не сейчас']], W / 2, y + h - 18, { align: 'center' });
        },
        key(k) {
          if (k === 'back') { refuse(); return; }
          if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); return; }
          if (k === 'ok') { if (this.sel === 0) accept(); else refuse(); }
        }
      });
    },

    openNetSettings() {
      const ui = this, n = net();
      const rows = () => [
        { id: 'auto', label: 'Подключаться при запуске', value: n.auto() ? 'Вкл.' : 'Выкл.', act: () => { n.setAuto(!n.auto()); ui.sfx('select'); } },
        { id: 'link', label: linked(n) ? 'Отключиться' : 'Подключиться', act: () => { if (linked(n)) n.disconnect('off'); else n.connect(); ui.sfx('select'); } },
        ...(n.friends ? [
          { id: 'reqs', label: 'Запросы в друзья', value: n.friends.settings.reqs === 'all' ? 'От всех' : 'Ни от кого', act: () => { n.send('settings', { reqs: n.friends.settings.reqs === 'all' ? 'none' : 'all' }); ui.sfx('select'); } },
          { id: 'guests', label: 'Гости в Экспрессе', value: n.friends.settings.guests === 'friends' ? 'Друзья' : 'Никто', act: () => { n.send('settings', { guests: n.friends.settings.guests === 'friends' ? 'none' : 'friends' }); ui.sfx('select'); } }
        ] : []),
        ...(ui.game && ui.game.profile ? [{ id: 'bday', label: 'День рождения в карточке', value: ui.game.profile().showBday ? 'Да' : 'Нет', act: () => { const p = ui.game.profile(); p.showBday = !p.showBday; if (ui.netCardDue) ui.netCardDue(); ui.sfx('select'); } }] : []),
        { id: 'code', label: 'Показать код аккаунта', act: () => ui.openNetCode() },
        { id: 'enter', label: 'Ввести код аккаунта', act: () => ui.openNetCodeEntry() },
        { id: 'wipe', label: 'Удалить аккаунт', act: () => ui.openNetWipe() }
      ];
      return this.push({
        netSettings: true, rows,
        draw(c) {
          const list = rows(), x = 120, w = 400, h = 118 + list.length * 30 + 44, y = Math.round((HGT - h) / 2);
          c.fillStyle = 'rgba(2,3,14,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Эфирная связь' });
          ui.closeBtn(x + w - 30, y + 8, () => this.key('back'));
          ui.text('UID', x + 22, y + 44, { size: 11, col: C.sub });
          ui.text(n.uid(), x + 50, y + 38, { size: 18, bold: true, serif: true, col: C.gold });
          ui.netBars(c, x + w - 48, y + 54);
          ui.text(ui.netStateText(), x + 22, y + 66, { size: 12, bold: true, col: n.state === 'online' ? '#8fe08a' : C.cream });
          c.fillStyle = 'rgba(242,220,154,0.25)'; c.fillRect(x + 16, y + 88, w - 32, 1);
          list.forEach((r, i) => {
            const ry = y + 98 + i * 30, on = i === this.sel;
            if (on) { c.fillStyle = 'rgba(242,220,154,0.15)'; c.fillRect(x + 16, ry - 4, w - 32, 26); ui.cursor(x + 20, ry + 8); }
            ui.text(r.label, x + 36, ry, { bold: on, col: on ? C.gold : r.id === 'wipe' ? '#ff9a8a' : C.cream });
            if (r.value) ui.text(r.value, x + w - 28, ry, { align: 'right', size: 12, bold: true, col: C.sub });
            ui.hit(x + 16, ry - 4, w - 32, 26, () => { this.sel = i; r.act(); });
          });
          ui.wrap(HINTS[list[this.sel].id], w - 44, 11).slice(0, 2).forEach((line, i) => ui.text(line, x + 22, y + h - 52 + i * 14, { size: 11, col: C.sub }));
          ui.hints([['↑↓', 'Выбор'], ['Enter', 'Нажать'], ['Esc', 'Назад']], W / 2, y + h - 20, { align: 'center' });
        },
        key(k) {
          const list = rows();
          if (ui.listNav(this, k, list.length)) return;
          if (k === 'back') { ui.pop(); return; }
          if (k === 'ok' || ((k === 'left' || k === 'right') && list[this.sel].value)) list[this.sel].act();
        }
      });
    },

    netBars(c, x, y) {
      const n = net(), lit = n ? n.bars() : 0;
      for (let i = 0; i < 4; i++) {
        c.fillStyle = i < lit ? C.cream : C.dim;
        c.fillRect(x + i * 5, y - 3 - i * 2, 3, 3 + i * 2);
      }
    },

    netPingText() {
      const n = net();
      if (!n || !n.hasConsent() || n.state === 'off') return null;
      if (n.state === 'online') return n.rtt == null ? '…' : Math.round(n.rtt) + ' мс';
      return n.state === 'connecting' ? '…' : 'нет связи';
    },

    drawNetChip(c, x, y) {
      const text = this.netPingText();
      if (!text) return;
      const w = this.measure(text, 11, true) + 38;
      c.fillStyle = 'rgba(4,6,20,0.78)'; c.fillRect(x, y, w, 20);
      c.fillStyle = C.brass; c.fillRect(x, y + 19, w, 1);
      this.netBars(c, x + 8, y + 15);
      this.text(text, x + 32, y + 4, { size: 11, bold: true, col: net().state === 'online' ? C.cream : '#ff9a8a' });
    },

    openNetCode() {
      const ui = this, n = net();
      let note = '';
      const copy = () => {
        ui.copyText(n.code().replace(/-/g, '')).then(() => { note = 'Код скопирован'; ui.sfx('select'); }, () => { note = 'Не вышло. Перепишите код вручную'; ui.sfx('deny'); });
      };
      return this.guardCodeScreen(this.push({
        netCode: true,
        draw(c) {
          const code = groupedCode(n), x = 130, y = 130, w = 380, h = 216;
          c.fillStyle = 'rgba(2,3,14,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Код аккаунта' });
          c.fillStyle = '#04061a'; c.fillRect(x + 20, y + 36, w - 40, 62);
          c.strokeStyle = C.brassHi; c.strokeRect(x + 20.5, y + 36.5, w - 41, 61);
          ui.text(code.uid, x + w / 2, y + 44, { size: 14, bold: true, align: 'center', col: C.gold });
          ui.text(code.secret, x + w / 2, y + 68, { size: 15, bold: true, align: 'center', col: C.gold });
          ui.wrap('Кто знает этот код, тот входит под вашим UID. Не показывайте его другим. Буквы и цифры набираются без пробелов и дефисов.', w - 44, 11).slice(0, 3).forEach((line, i) => ui.text(line, x + 22, y + 108 + i * 14, { size: 11, col: C.cream }));
          ui.text(note, x + w / 2, y + 152, { size: 11, bold: true, align: 'center', col: '#8fe08a' });
          ui.button(x + 22, y + 170, 160, 28, 'Скопировать', () => { this.sel = 0; copy(); }, { active: this.sel === 0 });
          ui.button(x + w - 182, y + 170, 160, 28, 'Закрыть', () => ui.pop(), { active: this.sel === 1 });
        },
        key(k) {
          if (k === 'back') { ui.pop(); return; }
          if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); return; }
          if (k === 'ok') { if (this.sel === 0) copy(); else ui.pop(); }
        }
      }));
    },

    openNetCodeEntry() {
      const ui = this, n = net();
      const entry = this.openLatinEntry({
        title: 'Код аккаунта', max: 25, okLabel: 'Подтвердить', closeOnOk: false,
        hint: 'Латиница и цифры, без пробелов и дефисов.',
        hints: [['A-Z 0-9', 'Ввод'], ['Ctrl+V', 'Вставить'], ['Backspace', 'Стереть'], ['↑↓←→', 'Сетка'], ['Enter', 'Нажать'], ['Esc', 'Назад']],
        paste: text => { const code = text.toUpperCase().replace(/[^0-9A-Z]/g, ''); return code.length === 25 ? code : ''; },
        pasteMiss: 'В буфере обмена нет кода аккаунта.',
        submit: text => {
          let answered = null, waiting = false;
          n.useCode(text, res => {
            if (!waiting) { answered = res; return; }
            if (!res.ok) { entry.note = res; ui.sfx('deny'); return; }
            if (ui.screens.includes(entry)) ui.screens.splice(ui.screens.indexOf(entry), 1);
            n.codeScreen = null;
            ui.toast(res.text);
            ui.sfx('chest');
          });
          waiting = true;
          return answered || { wait: true, text: 'Проверяем код…' };
        }
      });
      return this.guardCodeScreen(entry);
    },

    openNetWipe() {
      const ui = this, n = net();
      let note = '', busy = false;
      const wipe = () => {
        if (busy) return;
        busy = true;
        n.deleteAccount(res => {
          busy = false;
          if (!res.ok) { note = res.text; ui.sfx('deny'); return; }
          ui.screens = ui.screens.filter(s => !s.netWipe && !s.netSettings);
          ui.toast('Аккаунт удалён. Сохранения игры на месте');
          ui.sfx('confirm');
        });
      };
      return this.push({
        netWipe: true, sel: 1,
        draw(c) {
          const x = 140, y = 150, w = 360, h = 168;
          c.fillStyle = 'rgba(2,3,14,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Удалить аккаунт' });
          ui.wrap('Сервер сотрёт запись UID ' + n.uid() + '. Друзья потеряют вас из списка. В следующий раз у вас будет новый UID. Сохранения игры останутся.', w - 44, 12).slice(0, 4).forEach((line, i) => ui.text(line, x + 22, y + 38 + i * 16, { size: 12, col: C.cream }));
          ui.text(busy ? 'Удаляем…' : note, x + w / 2, y + 106, { size: 11, bold: true, align: 'center', col: '#ff9a8a' });
          ui.button(x + 22, y + 124, 150, 28, 'Удалить', () => { this.sel = 0; wipe(); }, { active: this.sel === 0 });
          ui.button(x + w - 172, y + 124, 150, 28, 'Отмена', () => ui.pop(), { active: this.sel === 1 });
        },
        key(k) {
          if (k === 'back') { ui.pop(); return; }
          if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); return; }
          if (k === 'ok') { if (this.sel === 0) wipe(); else ui.pop(); }
        }
      });
    }
  });
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
