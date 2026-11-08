(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const ROWS = 5, ROW_H = 62, LIST_X = 12, LIST_Y = 50, LIST_W = W - 24;
  const CARD_GAP_MS = 60000, CARD_SOON_MS = 25000, BEAT_S = 2, NOTE_S = 8;
  const SORTS = [{ id: 'on', label: 'в сети' }, { id: 'lvl', label: 'уровень' }, { id: 'name', label: 'имя' }];
  const STATUS = { title: 'В главном меню', express: 'На Экспрессе', battle: 'В бою', su: 'Во Вселенной', desk: 'На рабочем столе Win 98', solo: 'Соло-заход.', visit: 'В гостях' };
  const SOCIAL_ERR = {
    bookDay: 'Сегодня вы уже писали в этой книге', bookEmpty: 'Пустую запись не оставить', noExpress: 'Ваш Экспресс ещё не приехал',
    none: 'Такого Первопроходца нет', self: 'Это ваш собственный UID', friend: 'Вы уже друзья', closed: 'Этот Первопроходец не принимает запросы', blocked: 'Сначала снимите блокировку',
    myFull: 'В вашем списке нет мест', theirFull: 'В его списке нет мест', favFull: 'Избранных не больше трёх', blockFull: 'Чёрный список полон', notFriend: 'Это не ваш друг', noTable: 'Сначала сядьте за стол Рубежа', offline: 'Друг сейчас не в сети', soon: 'Чуть позже', big: 'Карточка слишком большая'
  };
  const LINK_TEXT = {
    off: 'Связь выключена', connecting: 'Настройка эфира...', offline: 'Нет связи с Экспрессом', modem: 'Модем отключён', outdated: 'Обновите игру, чтобы вернуться в эфир',
    replaced: 'Аккаунт подключился в другом месте', denied: 'Сервер не принял этот аккаунт', banned: 'Доступ закрыт'
  };
  const SOLO = {
    uid: 'solo', solo: true, name: 'Leveling_Solo', gender: 'f', tl: 70, on: true, status: { c: 'solo' }, ago: 0, fav: false, sign: 'Вход только соло.',
    avatar: { k: 'silverwolf', o: null, lvl: 80, eid: 6 }, show: [{ k: 'silverwolf', o: null, lvl: 80, eid: 6 }, { k: 'kafka', o: null, lvl: 80, eid: 2 }, { k: 'blade', o: null, lvl: 80, eid: 1 }],
    merits: [{ id: 'hd', open: true, value: 'Волна 20' }]
  };
  const SOLO_CARD = {
    name: SOLO.name, gender: SOLO.gender, tl: SOLO.tl, avatar: SOLO.avatar, stage: SOLO.avatar, sign: SOLO.sign, bday: null, show: SOLO.show, comp: [], coll: [],
    merits: [{ id: 'fh', open: false, value: 'Не интересно' }, { id: 'su', open: false, value: 'Не интересно' }, { id: 'cw', open: false, value: 'Не интересно' }, { id: 'hd', open: true, value: 'Волна 20' }],
    log: [{ at: 0, text: 'В таблице Рубежа пока одно имя.' }]
  };
  const own = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
  const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f|{}=#<>]/g, '').trim().slice(0, max);
  const digitOfKey = code => (/^Digit[0-9]$/.test(code) ? code[5] : /^Numpad[0-9]$/.test(code) ? code[6] : /^Key[A-Z]$/.test(code) || code === 'Space' || code === 'Minus' ? '' : null);

  function agoText(ms) {
    const min = Math.floor(ms / 60000);
    if (min < 1) return 'только что';
    if (min < 60) return min + ' мин. назад';
    const h = Math.floor(min / 60);
    return h < 24 ? h + ' ч. назад' : Math.floor(h / 24) + ' д. назад';
  }

  function statusText(st) {
    if (!st || typeof st !== 'object') return 'В сети';
    if (st.c === 'hd') return 'Рубеж Экспресса' + (Number.isInteger(st.w) && st.w > 0 && st.w < 100 ? ', волна ' + st.w : '');
    if (st.c === 'map') return own(H.MAPS, st.m) && H.MAPS[st.m].name ? clean(H.MAPS[st.m].name, 40) : 'В сети';
    return own(STATUS, st.c) ? STATUS[st.c] : 'В сети';
  }

  function chipsOf(row) {
    const out = [];
    for (const m of row.merits || []) {
      if (!m.open) continue;
      const v = clean(m.value, 24);
      if (m.id === 'fh') out.push('Зал ' + v.split('/')[0].trim() + '★');
      else if (m.id === 'hd') out.push('Рубеж ' + v.replace('Волна ', 'В'));
      else if (m.id === 'cw') out.push(v);
    }
    return out.slice(0, 3);
  }

  function sortRows(list, sort) {
    const by = {
      on: (a, b) => (b.on ? 1 : 0) - (a.on ? 1 : 0) || (a.ago || 0) - (b.ago || 0),
      lvl: (a, b) => (b.tl || 0) - (a.tl || 0),
      name: (a, b) => String(a.name).localeCompare(String(b.name), 'ru')
    }[SORTS[sort].id];
    const fav = list.filter(r => r.fav).sort(by), rest = list.filter(r => !r.fav).sort(by);
    return fav.concat(rest);
  }

  Object.assign(H.UI.prototype, {
    netTick(dt) {
      const n = globalThis.Net98;
      if (!n) return;
      if (!this.netWired) { this.netWired = true; this.netAttach(); }
      if (this.netNote) { this.netNote.age += dt; if (this.mode === 'field' && !this.screens.length && (this.netNote.t -= dt) <= 0) this.netNote = null; }
      if (this.visitNetTick) this.visitNetTick(dt);
      if (n.state !== 'online') { this.netStatusSent = null; return; }
      if ((this.netBeat = (this.netBeat || 0) - dt) > 0) return;
      this.netBeat = BEAT_S;
      const status = JSON.stringify(this.netStatusNow());
      if (status !== this.netStatusSent && n.send('status', { s: JSON.parse(status) })) this.netStatusSent = status;
      const now = performance.now(), ready = this.game && !this.game.guest && this.mode !== 'title', due = now - (this.netCardAt == null ? -Infinity : this.netCardAt) >= CARD_GAP_MS;
      if (ready && this.game.state.flags.express_intro && (due || this.game.state.record !== this.netRecordSent)) {
        const express = JSON.stringify(this.game.netExpress());
        if (express !== this.netExpressText && n.send('express', { express: JSON.parse(express) })) { this.netExpressText = express; this.netRecordSent = this.game.state.record; }
      }
      if (!ready || !due) return;
      this.netCardAt = now;
      const card = JSON.stringify(this.game.netCard());
      if (card !== this.netCardText && n.send('card', { card: JSON.parse(card) })) this.netCardText = card;
    },

    netCardDue() {
      if (this.netCardAt != null) this.netCardAt = Math.min(this.netCardAt, performance.now() - (CARD_GAP_MS - CARD_SOON_MS));
    },

    netStatusNow() {
      const g = this.game;
      if (!g || this.mode === 'title') return { c: 'title' };
      if (g.guest) return { c: 'visit' };
      const arena = this.screens.find(s => s.arena);
      if (arena) return { c: 'hd', w: arena.arena.wave };
      if (this.mode === 'battle') return { c: 'battle' };
      if (g.state.su) return { c: 'su' };
      const id = g.map ? g.map.id : g.state.map;
      return String(id).startsWith('express') ? { c: 'express' } : { c: 'map', m: id };
    },

    netSocialMessage(m) {
      switch (m.op) {
        case 'me':
          this.netStatusSent = null;
          this.netCardText = null;
          this.netExpressText = null;
          this.netCardAt = null;
          this.netBeat = 0;
          break;
        case 'socialError':
          if (m.code === 'soon') { this.netCardText = null; this.netExpressText = null; }
          if (m.code === 'soon' || m.code === 'big') break;
          this.toast(SOCIAL_ERR[m.code] || 'Сервер отказал');
          this.sfx('deny');
          break;
        case 'invited':
          this.toast('Приглашение отправлено');
          this.sfx('select');
          break;
        case 'invite':
          this.netNote = { inv: m, age: 0, t: NOTE_S };
          break;
        default:
      }
    },

    cardLook(ref, gender) {
      const k = ref && ref.k;
      if (ref && own(H.OUTFITS, ref.o)) { const look = H.outfitLook(ref.o, gender); if (look) return look; }
      if (typeof k === 'string' && k.startsWith('trail')) return G.trailLook(gender === 'f' ? 'f' : 'm');
      return own(H.CHARS, k) ? H.CHARS[k].look : H.SPEAKERS.townsman.look;
    },

    cardSlot(ref, gender, name) {
      if (!ref) return null;
      const kit = own(H.CHARS, ref.k) ? H.CHARS[ref.k] : null;
      return { look: this.cardLook(ref, gender), rarity: kit ? kit.rarity : 4, elem: kit ? kit.elem : 'phys', path: kit ? kit.path : null, title: String(ref.k).startsWith('trail') ? clean(name, 12) : kit ? kit.short || kit.name : 'Неизвестный герой', lvl: ref.lvl || 0, eid: ref.eid || 0 };
    },

    cardSource(card, row) {
      const ui = this, c = card || {}, gender = c.gender || row.gender, name = clean(c.name || row.name, 16), n = globalThis.Net98;
      const stage = ui.cardSlot(c.stage || c.avatar || row.avatar, gender, name), slots = { show: c.show || row.show || [], comp: c.comp || [] };
      return {
        name, tl: c.tl || row.tl || 0, bday: c.bday || null, uid: row.solo ? 'нет' : row.uid, sign: clean(c.sign != null ? c.sign : row.sign, 40), own: false,
        presence: ui.friendPresence(row),
        avatarLook: ui.cardLook(c.avatar || row.avatar, gender), stageLook: stage ? stage.look : H.SPEAKERS.townsman.look, stageTitle: stage ? stage.title : name,
        log: (c.log || []).map(e => (e.at ? ui.profileAgo(e.at) + ' ' : '') + clean(e.text, 70)),
        merits: () => ui.friendRows(c.merits || [], 'merit'), coll: () => ui.friendRows(c.coll || [], 'coll'),
        slot: (id, i) => ui.cardSlot((slots[id] || [])[i], gender, name),
        waiting: !card && !!n
      };
    },

    friendPresence(row) {
      if (row.on) return 'В сети: ' + statusText(row.status);
      return 'Не в сети, ' + agoText((row.ago || 0) + (performance.now() - (row.seenAt || performance.now())));
    },

    friendBox() {
      const wide = this.wide();
      return {
        wide,
        lx: wide ? this.left + 12 : LIST_X,
        rx: wide ? this.right - 12 : W - 12,
        lw: wide ? this.vw - 24 : LIST_W
      };
    },

    friendList() {
      const n = globalThis.Net98, F = n.friends;
      return [SOLO].concat(F ? sortRows(F.list, this.friendSort || 0) : []);
    },

    drawFriendRow(c, row, x, y, w, on, o = {}) {
      const ui = this, wide = ui.wide(), h = ROW_H - 3, elem = row.avatar && own(H.CHARS, row.avatar.k) ? H.CHARS[row.avatar.k].elem : 'phys', tint = (H.ELEMENTS[elem] || H.ELEMENTS.phys).col;
      c.fillStyle = row.on ? '#1a2048' : '#10132c'; c.fillRect(x, y, w, h);
      const wash = c.createLinearGradient(x, 0, x + w * 0.7, 0);
      wash.addColorStop(0, tint); wash.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = row.on ? 0.34 : 0.16; c.fillStyle = wash; c.fillRect(x, y, w * 0.7, h); c.globalAlpha = 1;
      c.fillStyle = ui.dither(); c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x, y, w, 1); c.fillRect(x, y, 1, h);
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(x, y + h - 1, w, 1); c.fillRect(x + w - 1, y, 1, h);
      if (row.fav || row.solo) { c.strokeStyle = row.solo ? '#7a8ad8' : '#e8c060'; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
      if (on) { c.strokeStyle = C.brassHi; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, h - 2); c.lineWidth = 1; }
      ui.circlePortrait(c, ui.cardLook(row.avatar, row.gender), x + 8, y + 4, 40, row.on ? '#8fe08a' : C.brass);
      c.fillStyle = 'rgba(4,6,20,0.85)'; c.fillRect(x + 12, y + 42, 32, 12);
      ui.text(String(row.tl || 0), x + 28, y + 42, { size: 10, bold: true, align: 'center', col: C.gold });
      if (row.fav) ui.text('★', x + 6, y + 40, { size: 12, bold: true, col: '#ffd471' });
      const defRight = wide ? 140 : 196, tx = x + 56, right = o.right == null ? defRight : o.right, maxW = w - right - 60, name = clean(row.name, 16);
      ui.text(name, tx, y + 4, { size: 13, bold: true, serif: true, col: C.gold });
      let cx = tx + ui.measure(name, 13, true, true) + 8;
      const chips = chipsOf(row);
      if (wide && !row.solo && row.uid) chips.push('UID ' + row.uid);
      for (const chip of chips) {
        const cw = ui.measure(chip, 9, true) + 8;
        if (cx + cw > tx + maxW) break;
        c.fillStyle = '#2a2458'; c.fillRect(cx, y + 5, cw, 13);
        c.strokeStyle = '#6a5a9a'; c.strokeRect(cx + 0.5, y + 5.5, cw - 1, 12);
        ui.text(chip, cx + 4, y + 7, { size: 9, bold: true, col: '#d8d0ff', shadow: false });
        cx += cw + 4;
      }
      const sign = clean(row.sign, 40);
      ui.text(ui.fitText(sign || 'Подписи ещё нет.', 10, maxW), tx, y + 22, { size: 10, col: sign ? C.cream : C.dim });
      if (row.on) {
        const tag = 'В сети', tw = ui.measure(tag, 9, true) + 8;
        c.fillStyle = '#1e6a30'; c.fillRect(tx, y + 38, tw, 13);
        ui.text(tag, tx + 4, y + 40, { size: 9, bold: true, col: '#d8ffd8', shadow: false });
        ui.text(ui.fitText(statusText(row.status), 10, maxW - tw - 6), tx + tw + 6, y + 39, { size: 10, col: '#a8f0b0' });
      } else ui.text(agoText((row.ago || 0) + (performance.now() - (row.seenAt || performance.now()))), tx, y + 39, { size: 10, col: C.dim });
      if (o.heroes !== false) {
        const hOff = wide ? 132 : 188, hStep = wide ? 43 : 42;
        (row.show || []).slice(0, 3).forEach((ref, i) => {
          const hx = x + w - hOff + i * hStep, slot = ui.cardSlot(ref, row.gender, row.name);
          c.fillStyle = 'rgba(4,6,20,0.6)'; c.fillRect(hx, y + 4, 38, 50);
          if (!slot) return;
          G.rarityCell(c, hx, y + 4, 38, 50, slot.rarity);
          G.drawPortrait(c, slot.look, hx + 3, y + 6, 32);
          c.fillStyle = 'rgba(4,6,20,0.8)'; c.fillRect(hx, y + 42, 38, 12);
          ui.text(String(slot.lvl), hx + 19, y + 42, { size: 9, bold: true, align: 'center', col: C.gold });
        });
      }
    },

    openFriends(tab) {
      const ui = this, n = globalThis.Net98;
      if (!n) { ui.sfx('deny'); return null; }
      if (!n.hasConsent()) return ui.openNetConsent(() => ui.openFriends(tab));
      this.netAttach();
      if (n.state === 'off') n.connect();
      const invites = () => n.activeInvites();
      const linkAct = () => {
        if (n.state === 'outdated' && ui.openUpdate && globalThis.Hsr98Standalone === 'apk') { ui.openUpdate(); return; }
        if (n.state === 'modem' && globalThis.appDialUp) { globalThis.appDialUp.selectEther(); globalThis.appDialUp.open(); ui.sfx('select'); return; }
        if (n.state === 'modem' || n.state === 'banned' || n.state === 'connecting') { ui.sfx('deny'); return; }
        n.connect();
        ui.sfx('select');
      };
      const addItems = () => {
        const list = [{ id: 'copy' }, { id: 'enter' }], f = n.found;
        if (f && f.ok && f.rel === 'none' && f.open) list.push({ id: 'send', uid: f.uid });
        if (f && f.ok && f.rel === 'in') list.push({ id: 'send', uid: f.uid });
        for (const r of n.friends ? n.friends.recent : []) list.push({ id: 'recent', row: r });
        return list;
      };
      return this.push({
        full: true, friends: true, tab: tab || 0, sel: 0, top: 0, addSel: 0, addTop: 0, note: '',
        rows() { return ui.friendList(); },
        setTab(i) { if (this.tab !== i) { this.tab = i; ui.sfx('select'); } },
        current() { return this.rows()[this.sel] || null; },
        favToggle() {
          const row = this.current();
          if (!row || row.solo || !n.friends) { ui.sfx('deny'); return; }
          n.send('fav', { uid: row.uid, on: !row.fav });
          ui.sfx('select');
        },
        addAct(it) {
          if (!it) return;
          if (it.id === 'copy') {
            ui.copyText(n.uid()).then(() => { this.note = 'UID скопирован'; ui.sfx('select'); }, () => { this.note = 'Не вышло. Перепишите UID вручную'; ui.sfx('deny'); });
          } else if (it.id === 'enter') ui.openFriendFind();
          else if (it.id === 'send') { n.send('req', { uid: it.uid }); n.found = null; ui.toast('Запрос отправлен'); ui.sfx('confirm'); }
          else if (it.id === 'recent') { n.send('req', { uid: it.row.uid }); ui.toast('Запрос отправлен: ' + clean(it.row.name, 12)); ui.sfx('confirm'); }
        },
        draw(c) {
          const F = n.friends, { wide, lx, rx } = ui.friendBox();
          c.fillStyle = '#07060f'; c.fillRect(ui.left, 0, ui.vw, HGT);
          c.fillStyle = ui.dither(); c.fillRect(ui.left, 0, ui.vw, HGT);
          G.menuIcon(c, 'friends', lx, 6, 24, C.brassHi);
          ui.plate(lx + 28, 8, 'Друзья');
          const tabX = wide ? lx + 128 : 150, tabW = wide ? 104 : 92, tabStep = wide ? 110 : 96;
          ['Мои друзья', 'Добавить'].forEach((t, i) => ui.button(tabX + i * tabStep, 8, tabW, 22, t, () => this.setTab(i), { size: 10, active: i === this.tab }));
          ui.text('Мои друзья: ' + (F ? F.list.length : 0) + '/' + (F ? F.max : 100), rx - 32, 12, { size: 11, align: 'right', col: C.cream });
          ui.closeBtn(rx - 20, 8, () => this.key('back'));
          if (this.tab === 0) this.drawMine(c, F); else this.drawAdd(c, F);
          ui.text('UID ' + n.uid(), lx + 2, HGT - 42, { size: 11, bold: true, col: C.gold });
          ui.netBars(c, lx + 108, HGT - 32);
          if (n.state === 'online') ui.text(n.rtt == null ? 'На связи' : Math.round(n.rtt) + ' мс', lx + 134, HGT - 42, { size: 10, col: C.sub });
          ui.hints(this.tab === 0 ? [['↑↓', 'Выбор'], ['Enter', 'Действия'], ['G', 'В гости'], ['F', 'Избранное'], ['V', 'Профиль'], ['Q E', 'Вкладка'], ['Esc', 'Назад']] : [['↑↓', 'Выбор'], ['Enter', 'Нажать'], ['Q E', 'Вкладка'], ['Esc', 'Назад']], lx + 2, HGT - 18);
        },
        drawMine(c, F) {
          const { wide, lx, rx, lw } = ui.friendBox(), rw = lw - 8, list = this.rows(), inv = invites()[0];
          if (this.sel >= list.length) this.sel = list.length - 1;
          if (this.sel < this.top) this.top = this.sel;
          if (this.sel >= this.top + ROWS) this.top = this.sel - ROWS + 1;
          if (inv) this.drawInvite(c, inv);
          else ui.text('★ Избранные ' + (F ? F.list.filter(r => r.fav).length : 0) + '/' + (F ? F.favMax : 3) + ' (F отметить)', lx + 2, 34, { size: 10, col: '#e8c060' });
          const visitOff = wide ? 210 : 262, rightPad = wide ? 216 : 266;
          list.slice(this.top, this.top + ROWS).forEach((row, k) => {
            const i = this.top + k, y = LIST_Y + k * ROW_H;
            ui.drawFriendRow(c, row, lx, y, rw, i === this.sel, row.solo ? {} : { right: rightPad });
            ui.hit(lx, y, rw, ROW_H - 3, () => { if (this.sel === i) ui.openFriendMenu(row); else { this.sel = i; ui.sfx('select'); } });
            if (!row.solo) ui.button(lx + rw - visitOff, y + 33, 68, 20, 'В гости', () => { this.sel = i; ui.visitGo(row); }, { size: 10 });
          });
          if (list.length > ROWS) {
            const th = Math.max(20, ROWS * ROW_H * ROWS / list.length), ty = LIST_Y + (ROWS * ROW_H - th) * this.top / Math.max(1, list.length - ROWS);
            c.fillStyle = '#1a1c34'; c.fillRect(rx - 4, LIST_Y, 4, ROWS * ROW_H - 3);
            c.fillStyle = C.brass; c.fillRect(rx - 4, ty, 4, th);
          }
          ui.wheelZone(lx, LIST_Y, lw, ROWS * ROW_H, d => { this.sel = Math.max(0, Math.min(list.length - 1, this.sel + d)); });
          if (n.state !== 'online') this.drawLink(c);
          else if (F && !F.list.length) {
            ui.text('Поделитесь своим UID: вкладка «Добавить».', W / 2, LIST_Y + ROW_H + 18, { align: 'center', size: 12, col: C.sub });
          }
          const by = LIST_Y + ROWS * ROW_H + 4, reqs = F ? F.in.length : 0, sort = ui.friendSort || 0;
          if (wide) {
            ui.button(lx, by, 232, 24, 'O: сортировка: ' + SORTS[sort].label, () => this.cycleSort(), { size: 10 });
            ui.button(lx + 240, by, 148, 24, 'C: связь', () => this.key(null, 'KeyC'), { size: 10 });
            ui.button(lx + 396, by, 214, 24, 'B: чёрный список', () => this.key(null, 'KeyB'), { size: 10 });
            ui.button(lx + 618, by, 204, 24, 'R: запросы' + (reqs ? ' ' + reqs : ''), () => this.key(null, 'KeyR'), { size: 10, active: reqs > 0 });
            if (reqs) ui.badge(lx + 816, by + 4);
          } else {
            ui.button(12, by, 176, 24, 'O: сортировка: ' + SORTS[sort].label, () => this.cycleSort(), { size: 10 });
            ui.button(194, by, 92, 24, 'C: связь', () => this.key(null, 'KeyC'), { size: 10 });
            ui.button(292, by, 158, 24, 'B: чёрный список', () => this.key(null, 'KeyB'), { size: 10 });
            ui.button(456, by, 160, 24, 'R: запросы' + (reqs ? ' ' + reqs : ''), () => this.key(null, 'KeyR'), { size: 10, active: reqs > 0 });
            if (reqs) ui.badge(610, by + 4);
          }
        },
        drawInvite(c, inv) {
          const { lx, rx, lw } = ui.friendBox();
          const text = clean(inv.name, 12) + (inv.kind === 'visit' ? ' зовёт в гости' : ' зовёт: Рубеж Экспресса');
          c.fillStyle = 'rgba(30,106,48,0.5)'; c.fillRect(lx, 30, lw, 18);
          ui.text(text, lx + 6, 33, { size: 11, bold: true, col: '#d8ffd8' });
          ui.button(rx - 184, 30, 88, 18, 'Y: Принять', () => this.key(null, 'KeyY'), { size: 9, bold: true });
          ui.button(rx - 92, 30, 88, 18, 'N: Отказать', () => this.key(null, 'KeyN'), { size: 9 });
        },
        drawLink(c) {
          const y = LIST_Y + ROW_H + 10, text = LINK_TEXT[n.state] || 'Нет связи с Экспрессом', bw = ui.wide() ? 460 : LIST_W - 188;
          ui.win(W / 2 - bw / 2, y, bw, 120, {});
          ui.text(text, W / 2, y + 24, { align: 'center', size: 13, bold: true, col: C.cream });
          if (n.state === 'connecting' || n.state === 'banned') return;
          if (n.state === 'modem') {
            ui.text('Подключите модем в Win 98.', W / 2, y + 44, { align: 'center', size: 11, col: C.sub });
            if (globalThis.appDialUp) ui.button(W / 2 - 110, y + 62, 220, 28, 'Удалённый доступ к сети', linkAct, { bold: true, active: true });
            return;
          }
          const label = n.state === 'outdated' ? (globalThis.Hsr98Standalone === 'apk' && ui.openUpdate ? 'Обновления' : '') : n.state === 'replaced' ? 'Подключиться здесь' : n.state === 'off' ? 'Подключиться' : 'Повторить';
          if (label) ui.button(W / 2 - 90, y + 62, 180, 28, label, linkAct, { bold: true, active: true });
        },
        drawAdd(c) {
          const { wide, lx } = ui.friendBox(), items = addItems(), f = n.found;
          if (this.addSel >= items.length) this.addSel = items.length - 1;
          const onItem = id => items[this.addSel] && items[this.addSel].id === id;
          const recent = items.filter(it => it.id === 'recent'), base = items.length - recent.length;
          if (wide) {
            const lw = 396, rx0 = 313, rw = 422;
            ui.win(lx, 36, lw, 130, { title: 'Ваш UID' });
            ui.text(n.uid(), lx + 20, 62, { size: 26, bold: true, serif: true, col: C.gold });
            ui.button(lx + 248, 62, 128, 28, 'Копировать', () => { this.addSel = 0; this.addAct(items[0]); }, { size: 11, active: onItem('copy') });
            ui.text(this.note || 'Передайте его другу: так он пришлёт запрос.', lx + 20, 108, { size: 10, col: this.note ? '#8fe08a' : C.sub });
            ui.text('Совместный режим Рубежа и визиты на Экспресс.', lx + 20, 126, { size: 10, col: C.dim });
            ui.win(lx, 176, lw, 238, { title: 'Найти по UID' });
            ui.button(lx + 20, 206, 132, 28, 'Ввести UID', () => { this.addSel = 1; ui.openFriendFind(); }, { size: 11, active: onItem('enter') });
            if (!f) ui.text('Девять цифр, первая 7.', lx + 166, 213, { size: 11, col: C.sub });
            else if (!f.ok) ui.text('Такого Первопроходца нет.', lx + 166, 213, { size: 11, bold: true, col: '#ff9a8a' });
            else {
              c.fillStyle = 'rgba(255,255,255,0.03)'; c.fillRect(lx + 18, 248, lw - 36, 146);
              ui.circlePortrait(c, ui.cardLook(f.stub.avatar, f.stub.gender), lx + 32, 264, 48, C.brass);
              ui.text(clean(f.stub.name, 12), lx + 92, 266, { size: 14, bold: true, serif: true, col: C.gold });
              ui.text('Ур. Освоения ' + (f.stub.tl || 0) + ' · UID ' + f.uid, lx + 92, 286, { size: 10, col: C.sub });
              const say = { self: 'Это вы.', friend: 'Уже в друзьях.', out: 'Запрос уже отправлен.', blocked: 'В вашем чёрном списке.' }[f.rel] || (!f.open && f.rel === 'none' ? 'Не принимает запросы.' : '');
              if (say) ui.text(say, lx + 92, 314, { size: 11, col: C.cream });
              else ui.button(lx + 92, 312, 188, 26, f.rel === 'in' ? 'Принять запрос' : 'Отправить запрос', () => { this.addSel = items.findIndex(it => it.id === 'send'); this.addAct(items[this.addSel]); }, { size: 11, bold: true, active: onItem('send') });
            }
            ui.win(rx0, 36, rw, 378, { title: 'Недавно вместе' });
            if (!recent.length) ui.text('Здесь появятся те, с кем вы сидели за столом Рубежа.', rx0 + rw / 2, 210, { align: 'center', size: 11, col: C.dim });
            recent.slice(0, 8).forEach((it, k) => {
              const r = it.row, y = 66 + k * 38, i = base + k, on = this.addSel === i;
              c.fillStyle = on ? 'rgba(242,220,154,0.15)' : 'rgba(255,255,255,0.03)'; c.fillRect(rx0 + 12, y, rw - 24, 34);
              ui.circlePortrait(c, ui.cardLook(r.avatar, r.gender), rx0 + 18, y + 4, 26, C.brass);
              ui.text(clean(r.name, 12), rx0 + 52, y + 9, { size: 12, bold: on, col: on ? C.gold : C.cream });
              ui.text('Ур. ' + (r.tl || 0), rx0 + 190, y + 10, { size: 10, col: C.sub });
              ui.button(rx0 + rw - 134, y + 5, 116, 24, 'В друзья', () => { this.addSel = i; this.addAct(it); }, { size: 10, active: on });
            });
            return;
          }
          ui.win(12, 36, W - 24, 78, { title: 'Ваш UID' });
          ui.text(n.uid(), 34, 58, { size: 24, bold: true, serif: true, col: C.gold });
          ui.button(216, 60, 110, 26, 'Копировать', () => { this.addSel = 0; this.addAct(items[0]); }, { size: 11, active: onItem('copy') });
          ui.text(this.note || 'Передайте его другу: так он пришлёт запрос.', 338, 66, { size: 10, col: this.note ? '#8fe08a' : C.sub });
          ui.win(12, 122, W - 24, 92, { title: 'Найти по UID' });
          ui.button(30, 150, 120, 26, 'Ввести UID', () => { this.addSel = 1; ui.openFriendFind(); }, { size: 11, active: onItem('enter') });
          if (!f) ui.text('Девять цифр, первая 7.', 164, 156, { size: 11, col: C.sub });
          else if (!f.ok) ui.text('Такого Первопроходца нет.', 164, 156, { size: 11, bold: true, col: '#ff9a8a' });
          else {
            ui.circlePortrait(c, ui.cardLook(f.stub.avatar, f.stub.gender), 164, 142, 44, C.brass);
            ui.text(clean(f.stub.name, 12), 216, 146, { size: 13, bold: true, serif: true, col: C.gold });
            ui.text('Ур. Освоения ' + (f.stub.tl || 0) + ' · UID ' + f.uid, 216, 164, { size: 10, col: C.sub });
            const say = { self: 'Это вы.', friend: 'Уже в друзьях.', out: 'Запрос уже отправлен.', blocked: 'В вашем чёрном списке.' }[f.rel] || (!f.open && f.rel === 'none' ? 'Не принимает запросы.' : '');
            if (say) ui.text(say, 216, 182, { size: 11, col: C.cream });
            else ui.button(216, 180, 176, 24, f.rel === 'in' ? 'Принять запрос' : 'Отправить запрос', () => { this.addSel = items.findIndex(it => it.id === 'send'); this.addAct(items[this.addSel]); }, { size: 11, bold: true, active: onItem('send') });
          }
          ui.win(12, 222, W - 24, 192, { title: 'Недавно вместе' });
          if (!recent.length) ui.text('Здесь появятся те, с кем вы сидели за столом Рубежа.', W / 2, 300, { align: 'center', size: 11, col: C.dim });
          recent.slice(0, 5).forEach((it, k) => {
            const r = it.row, y = 246 + k * 32, i = base + k, on = this.addSel === i;
            c.fillStyle = on ? 'rgba(242,220,154,0.15)' : 'rgba(255,255,255,0.03)'; c.fillRect(24, y, W - 48, 29);
            ui.circlePortrait(c, ui.cardLook(r.avatar, r.gender), 30, y + 2, 25, C.brass);
            ui.text(clean(r.name, 12), 62, y + 7, { size: 12, bold: on, col: on ? C.gold : C.cream });
            ui.text('Ур. ' + (r.tl || 0), 200, y + 8, { size: 10, col: C.sub });
            ui.button(W - 150, y + 3, 116, 23, 'В друзья', () => { this.addSel = i; this.addAct(it); }, { size: 10, active: on });
          });
        },
        cycleSort() {
          ui.friendSort = ((ui.friendSort || 0) + 1) % SORTS.length;
          this.top = 0;
          ui.sfx('select');
        },
        key(k, code) {
          if (code === 'KeyQ' || code === 'KeyE') { this.setTab(1 - this.tab); return; }
          if (k === 'back') { ui.pop(); return; }
          if (this.tab === 1) {
            const items = addItems();
            if (k === 'up' || k === 'down') { this.addSel = Math.max(0, Math.min(items.length - 1, this.addSel + (k === 'up' ? -1 : 1))); ui.sfx('select'); return; }
            if (k === 'ok') this.addAct(items[this.addSel]);
            return;
          }
          const list = this.rows(), inv = invites()[0];
          if (code === 'KeyO') { this.cycleSort(); return; }
          if (code === 'KeyG') { const row = this.current(); if (row && !row.solo) ui.visitGo(row); else ui.sfx('deny'); return; }
          if (code === 'KeyC') { ui.openNetSettings(); return; }
          if (code === 'KeyB') { ui.openFriendBlocks(); return; }
          if (code === 'KeyR') { ui.openFriendRequests(); return; }
          if (code === 'KeyF') { this.favToggle(); return; }
          if (code === 'KeyV') { const row = this.current(); if (row) ui.openFriendProfile(row); return; }
          if (code === 'KeyY' && inv) { ui.netInviteAccept(inv); return; }
          if (code === 'KeyN' && inv) { n.dropInvite(inv); ui.sfx('cancel'); return; }
          if (k === 'up' || k === 'down') { const to = Math.max(0, Math.min(list.length - 1, this.sel + (k === 'up' ? -1 : 1))); if (to !== this.sel) { this.sel = to; ui.sfx('select'); } return; }
          if (k === 'ok') {
            if (n.state !== 'online' && n.state !== 'connecting' && this.sel === 0) { linkAct(); return; }
            const row = this.current();
            if (row) ui.openFriendMenu(row);
          }
        }
      });
    },

    openFriendFind() {
      const n = globalThis.Net98;
      return this.openTextEntry({
        title: 'UID друга', max: 9, grid: '1234567890'.split(''), cols: 5, read: digitOfKey, okLabel: 'Найти', closeOnOk: true, okSfx: 'confirm',
        hint: 'Девять цифр, первая 7.',
        hints: [['0-9', 'Ввод'], ['Ctrl+V', 'Вставить'], ['Backspace', 'Стереть'], ['↑↓←→', 'Сетка'], ['Enter', 'Нажать'], ['Esc', 'Назад']],
        paste: text => { const uid = /(?:^|\D)(7\d{8})(?!\d)/.exec(text); return uid ? uid[1] : ''; },
        pasteMiss: 'В буфере обмена нет UID.',
        submit: text => {
          if (!/^7\d{8}$/.test(text)) return { ok: false, text: 'UID: девять цифр, первая 7.' };
          n.found = null;
          n.send('find', { uid: text });
          return { ok: true, text: '' };
        }
      });
    },

    openFriendMenu(row) {
      const ui = this, n = globalThis.Net98;
      const items = () => {
        if (row.solo) return [{ id: 'view', label: 'Профиль' }];
        const list = [{ id: 'view', label: 'Профиль' }, { id: 'visit', label: 'В гости' }, { id: 'home', label: 'Позвать к себе' }];
        if (n.table && n.table.state === 'lobby') list.push({ id: 'invite', label: 'Позвать за стол' });
        list.push({ id: 'fav', label: row.fav ? 'Убрать из избранного' : 'В избранное' }, { id: 'del', label: 'Удалить из друзей' }, { id: 'block', label: 'В чёрный список' });
        return list;
      };
      const X = 200, WID = 240;
      const act = (s, id) => {
        if (id === 'view') { ui.screens.pop(); ui.openFriendProfile(row); return; }
        if (id === 'visit') { ui.screens.pop(); ui.visitGo(row); return; }
        if (id === 'home') { n.send('invite', { uid: row.uid, kind: 'visit' }); ui.pop(); return; }
        if (id === 'invite') { n.send('invite', { uid: row.uid }); ui.pop(); return; }
        if (id === 'fav') { n.send('fav', { uid: row.uid, on: !row.fav }); ui.pop(); return; }
        if (s.confirm !== id) { s.confirm = id; ui.sfx('deny'); return; }
        n.send(id === 'del' ? 'unfriend' : 'block', { uid: row.uid });
        ui.pop();
      };
      return this.push({
        friendMenu: true, confirm: null, items,
        draw(c) {
          const list = items(), h = 62 + list.length * 28, y = Math.round((HGT - h) / 2);
          c.fillStyle = 'rgba(2,3,14,0.6)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.win(X, y, WID, h, { title: clean(row.name, 12) });
          list.forEach((it, i) => {
            const yy = y + 28 + i * 28, on = i === this.sel, bad = it.id === 'del' || it.id === 'block';
            if (on) { c.fillStyle = 'rgba(242,220,154,0.18)'; c.fillRect(X + 10, yy - 3, WID - 20, 24); ui.cursor(X + 14, yy + 9); }
            ui.text(it.label, X + 30, yy + 2, { size: 12, bold: on, col: on ? C.gold : bad ? '#ff9a8a' : C.cream });
            ui.hit(X + 10, yy - 3, WID - 20, 24, () => { this.sel = i; act(this, it.id); });
          });
          ui.text(this.confirm ? 'Ещё раз Enter: подтвердить' : '', X + WID / 2, y + h - 28, { align: 'center', size: 10, bold: true, col: '#ff9a8a' });
          ui.hints([['↑↓', 'Выбор'], ['Enter', 'Нажать'], ['Esc', 'Назад']], X + WID / 2, y + h + 8, { align: 'center' });
        },
        key(k) {
          const list = items();
          if (k !== 'ok') this.confirm = null;
          if (ui.listNav(this, k, list.length)) return;
          if (k === 'back') { ui.pop(); return; }
          if (k === 'ok') act(this, list[this.sel].id);
        }
      });
    },

    openFriendRequests() {
      const ui = this, n = globalThis.Net98;
      return this.push({
        full: true, friendRequests: true, col: 0, sel: 0,
        lists() { const F = n.friends; return F ? [F.in, F.out] : [[], []]; },
        act(second) {
          const it = this.lists()[this.col][this.sel];
          if (!it) { ui.sfx('deny'); return; }
          if (this.col === 0) n.send('answer', { uid: it.uid, yes: !second });
          else n.send('cancelReq', { uid: it.uid });
          ui.sfx(second || this.col ? 'cancel' : 'confirm');
        },
        draw(c) {
          const { wide, lx, rx } = ui.friendBox(), L = this.lists();
          if (this.sel >= L[this.col].length) this.sel = Math.max(0, L[this.col].length - 1);
          c.fillStyle = '#07060f'; c.fillRect(ui.left, 0, ui.vw, HGT);
          c.fillStyle = ui.dither(); c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.plate(lx + 2, 8, 'Запросы');
          ui.closeBtn(rx - 20, 8, () => ui.pop());
          ['Входящие', 'Исходящие'].forEach((title, col) => {
            const x = lx + col * (wide ? 420 : 312), w = wide ? 410 : 304;
            ui.win(x, 38, w, 396, { title: title + ' ' + L[col].length });
            if (!L[col].length) ui.text(col ? 'Вы никого не звали.' : 'Запросов нет.', x + w / 2, 80, { align: 'center', size: 11, col: C.dim });
            L[col].slice(0, 8).forEach((it, i) => {
              const y = 62 + i * 45, on = this.col === col && this.sel === i;
              c.fillStyle = on ? 'rgba(242,220,154,0.15)' : 'rgba(255,255,255,0.03)'; c.fillRect(x + 8, y, w - 16, 42);
              ui.circlePortrait(c, ui.cardLook(it.avatar, it.gender), x + 12, y + 4, 34, C.brass);
              ui.text(clean(it.name, 12), x + 52, y + 5, { size: 12, bold: true, col: on ? C.gold : C.cream });
              ui.text(wide && it.uid ? 'Ур. ' + (it.tl || 0) + ' · UID ' + it.uid : 'Ур. ' + (it.tl || 0), x + 52, y + 22, { size: 10, col: C.sub });
              if (col === 0) {
                ui.button(x + w - 158, y + 8, 72, 26, 'Принять', () => { this.col = 0; this.sel = i; this.act(false); }, { size: 10, bold: true, active: on });
                ui.button(x + w - 82, y + 8, 68, 26, 'Отказать', () => { this.col = 0; this.sel = i; this.act(true); }, { size: 10 });
              } else ui.button(x + w - 90, y + 8, 76, 26, 'Отменить', () => { this.col = 1; this.sel = i; this.act(false); }, { size: 10, active: on });
            });
          });
          ui.hints([['←→', 'Столбец'], ['↑↓', 'Выбор'], ['Enter', 'Принять или отменить'], ['X', 'Отказать'], ['Esc', 'Назад']], lx + 2, HGT - 18);
        },
        key(k, code) {
          const L = this.lists();
          if (k === 'back') { ui.pop(); return; }
          if (k === 'left' || k === 'right') { this.col = 1 - this.col; this.sel = 0; ui.sfx('select'); return; }
          if (ui.listNav(this, k, Math.min(8, L[this.col].length))) return;
          if (code === 'KeyX' && this.col === 0) { this.act(true); return; }
          if (k === 'ok') this.act(false);
        }
      });
    },

    openFriendBlocks() {
      const ui = this, n = globalThis.Net98;
      return this.push({
        friendBlocks: true,
        list() { return n.friends ? n.friends.blocks : []; },
        draw(c) {
          const list = this.list(), wide = ui.wide(), w = wide ? 440 : 340, x = W / 2 - w / 2, h = 360, y = 60;
          if (this.sel >= list.length) this.sel = Math.max(0, list.length - 1);
          c.fillStyle = 'rgba(2,3,14,0.7)'; c.fillRect(ui.left, 0, ui.vw, HGT);
          ui.win(x, y, w, h, { title: 'Чёрный список ' + list.length });
          ui.wrap('Заблокированный не видит вас в сети, не шлёт запросы и приглашения и не заходит в гости.', w - 40, 10).slice(0, 2).forEach((line, i) => ui.text(line, x + 20, y + 26 + i * 13, { size: 10, col: C.sub }));
          if (!list.length) ui.text('Список пуст.', x + w / 2, y + 90, { align: 'center', size: 11, col: C.dim });
          list.slice(0, 8).forEach((it, i) => {
            const yy = y + 60 + i * 34, on = this.sel === i;
            c.fillStyle = on ? 'rgba(242,220,154,0.15)' : 'rgba(255,255,255,0.03)'; c.fillRect(x + 12, yy, w - 24, 31);
            ui.text(clean(it.name, 12) + ' · ' + it.uid, x + 22, yy + 8, { size: 11, bold: on, col: on ? C.gold : C.cream });
            ui.button(x + w - 92, yy + 3, 72, 25, 'Снять', () => { this.sel = i; n.send('unblock', { uid: it.uid }); ui.sfx('select'); }, { size: 10, active: on });
          });
          ui.hints([['↑↓', 'Выбор'], ['Enter', 'Снять'], ['Esc', 'Назад']], x + w / 2, y + h - 22, { align: 'center' });
        },
        key(k) {
          const list = this.list();
          if (k === 'back') { ui.pop(); return; }
          if (ui.listNav(this, k, Math.min(8, list.length))) return;
          if (k === 'ok' && list[this.sel]) { n.send('unblock', { uid: list[this.sel].uid }); ui.sfx('select'); }
        }
      });
    },

    netInviteAccept(inv) {
      const n = globalThis.Net98;
      if (this.mode !== 'field' || this.game.busy() || this.game.cg || this.dlg) { this.toast('Сначала закончите бой'); this.sfx('deny'); return; }
      n.dropInvite(inv);
      this.netNote = null;
      if (this.game.guest) this.visitEnd();
      if (inv.kind === 'visit') { this.screens = []; this.visitGo({ uid: inv.from, name: inv.name, expr: true }); return; }
      if (n.table) n.send('tableLeave');
      this.screens = [];
      this.openHdHub();
      this.openHdTable();
      n.send('tableJoin', { code: inv.code, name: this.game.state.name });
    },

    drawNetNotice(c) {
      const nt = this.netNote, g = this.game;
      if (!nt || this.screens.length || this.dlg || g.busy() || g.cg) return;
      const n = globalThis.Net98, x = 236, w = 264, h = 40, k = Math.min(1, nt.age / 0.25, nt.t / 0.25), y = Math.round((this.chatNote ? 50 : 6) - (1 - k) * (h + 8));
      if (!nt.rang) { nt.rang = true; this.sfx('msg_in'); }
      c.fillStyle = 'rgba(4,6,20,0.9)'; c.fillRect(x, y, w, h);
      c.fillStyle = C.brass; c.fillRect(x, y + h - 1, w, 1);
      c.fillStyle = C.brassHi; c.fillRect(x, y, 2, h);
      this.circlePortrait(c, this.cardLook(nt.inv.avatar, nt.inv.gender), x + 7, y + 5, 30, C.brassHi);
      this.text(clean(nt.inv.name, 12) + (nt.inv.kind === 'visit' ? ' зовёт в гости' : ' зовёт: Рубеж Экспресса'), x + 44, y + 5, { size: 11, bold: true, col: C.cream });
      this.text('Телефон → Друзья', x + 44, y + 21, { size: 9, col: C.sub });
      this.hit(x, y, w, h, () => { this.netNote = null; if (n) this.netInviteAccept(nt.inv); });
    }
  });

  H.FRIEND_TEXT = { statusText, agoText, SOLO, SOLO_CARD, chipsOf, sortRows };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
