(function (H) {
  'use strict';
  const G = H.Gfx, NET = H.NET;
  const { W, HGT, TS, C } = H.UI_CONST;
  const proto = H.UI.prototype, base = { fieldKey: proto.fieldKey, drawField: proto.drawField, writeSave: proto.writeSave, destroy: proto.destroy };
  const POS_GAP_MS = 125, WALK = 5.5, WALK_SLOW = 3.2, FAR = 3, LOST_S = 15, SAY_S = 3.2, SAY_GAP_MS = 1000, ECHO = [20, 7], ENTRY_ROWS = 7;
  const NO_TEXT = {
    none: 'Такого Первопроходца нет', notFriend: 'В гости ходят только к друзьям', closed: 'Хозяин не принимает гостей', noExpress: 'Экспресс ещё не приехал', full: 'В вагоне уже три гостя'
  };
  const NOT_TOUCHED = new Set(['enemy', 'trigger', 'exit', 'marvel', 'span', 'rbridge', 'gbridge']);
  const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f|{}=#<>]/g, '').trim().slice(0, max);
  const dateOf = at => { const d = new Date(at); return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0'); };

  Object.assign(proto, {
    writeSave(slot) {
      if (this.game && this.game.guest) return false;
      return base.writeSave.call(this, slot);
    },

    destroy() {
      if (this.homeGame) { this.game = this.homeGame; this.homeGame = null; }
      return base.destroy.call(this);
    },

    visitGo(row) {
      const n = globalThis.Net98, g = this.game;
      const why = row.solo ? 'Вход только соло.' : g.guest ? 'Сначала вернитесь на свой Экспресс' : this.mode !== 'field' || g.busy() || g.cg || this.dlg ? 'Сначала закончите бой' : g.state.su ? 'Сначала выйдите из Вселенной' : n.table ? 'Сначала покиньте стол' : n.state !== 'online' ? 'Нет связи' : row.expr === false ? 'Экспресс ещё не приехал' : null;
      if (why) { this.toast(why); this.sfx('deny'); return false; }
      n.send('visitEnter', { uid: row.uid, look: g.netCardRef(g.state.party.find(k => !H.labOnly(k))) });
      this.sfx('select');
      return true;
    },

    visitBegin(m) {
      const home = this.game, first = !home.state.flags.net_visited, lead = home.state.party.find(k => !H.labOnly(k));
      home.state.flags.net_visited = true;
      this.writeSave('auto');
      this.homeGame = home;
      const g = H.visitGame(m, home);
      g.guest.look = G.lookOf(home.kitOf(lead), home);
      g.guest.ref = home.netCardRef(lead);
      this.screens = [];
      this.dlg = null;
      this.game = g;
      this.visitLostT = 0;
      this.visitLostAsked = false;
      this.visitPosKey = null;
      this.enterField();
      this.banner = { text: 'Экспресс Первопроходца ' + g.guest.name, t: 3 };
      if (first) g.say('', 'На двери записка: «Мост держится. Вагон чужой, ничего не ломай. С.В.»');
    },

    visitEnd(why) {
      const n = globalThis.Net98;
      if (!this.homeGame) return;
      n.send('visitLeave');
      this.game = this.homeGame;
      this.homeGame = null;
      n.room = null;
      this.screens = [];
      this.dlg = null;
      this.visitMine = null;
      this.visitPosKey = null;
      this.enterField();
      if (why) this.toast(why);
    },

    netVisitMessage(m) {
      const n = globalThis.Net98, g = this.game;
      if (!g) return;
      switch (m.op) {
        case 'me':
          if (g.guest) n.send('visitEnter', { uid: g.guest.uid, look: g.guest.ref });
          break;
        case 'visit':
          if (g.guest && g.guest.uid === m.uid) { this.visitPosKey = null; break; }
          if (!g.guest && this.mode === 'field' && !g.busy()) this.visitBegin(m);
          else n.send('visitLeave');
          break;
        case 'visitNo':
          if (g.guest) { this.visitEnd(NO_TEXT[m.code] || 'Визит прервался'); break; }
          this.toast(NO_TEXT[m.code] || 'Сервер отказал');
          this.sfx('deny');
          break;
        case 'visitEnd':
          if (g.guest) this.visitEnd(m.why === 'closed' ? 'Хозяин закрыл двери' : 'Этот Экспресс больше не отвечает');
          break;
        case 'visitRecord':
          if (g.guest) {
            g.state.record = H.RECORDS.some(r => r.id === m.record) ? m.record : null;
            this.audio.music(g.mapMusic(g.map.def));
          }
          break;
        case 'peerIn':
          this.visitPosKey = null;
          if (!g.guest && !m.peer.host) { this.toast('Гость в вашем Экспрессе: ' + clean(m.peer.name, 12)); this.sfx('msg_in'); }
          break;
        case 'visitSay': {
          const text = NET.PHRASES[m.id];
          if (!text) break;
          if (m.uid === n.uid()) this.visitMine = { text, t: SAY_S };
          else {
            const peer = n.room && n.room.peers.get(m.uid);
            if (peer) peer.say = { text, t: SAY_S };
          }
          this.sfx('msg_in');
          break;
        }
        default:
      }
    },

    visitNetTick(dt) {
      const n = globalThis.Net98, g = this.game;
      if (!g || this.mode === 'title') return;
      if (this.visitMine && (this.visitMine.t -= dt) <= 0) this.visitMine = null;
      if (n.room) this.visitMoveFigures(dt, n.room);
      if (g.guest) this.visitWatchLink(dt);
      else this.visitHomeNotes();
      if (n.state === 'online' && n.room) this.visitSendPos();
    },

    visitMoveFigures(dt, room) {
      for (const p of room.peers.values()) {
        if (p.say && (p.say.t -= dt) <= 0) p.say = null;
        if (p.x == null) continue;
        if (p.fx == null || p.fm !== p.m) { p.fx = p.x; p.fy = p.y; p.fm = p.m; }
        const dx = p.x - p.fx, dy = p.y - p.fy, d = Math.hypot(dx, dy), step = (p.w ? WALK_SLOW : WALK) * dt;
        p.moving = d > 0;
        if (!d) continue;
        p.walkT = (p.walkT || 0) + dt;
        if (d > FAR || d <= step) { p.fx = p.x; p.fy = p.y; } else { p.fx += dx / d * step; p.fy += dy / d * step; }
      }
    },

    visitWatchLink(dt) {
      if (globalThis.Net98.state === 'online') { this.visitLostT = 0; this.visitLostAsked = false; return; }
      this.visitLostT = (this.visitLostT || 0) + dt;
      if (this.visitLostT >= LOST_S && !this.visitLostAsked && !this.screens.length) { this.visitLostAsked = true; this.openVisitLost(); }
    },

    visitHomeNotes() {
      const n = globalThis.Net98, g = this.game;
      if (this.mode !== 'field' || g.busy()) return;
      if (n.gifts.length) {
        const list = n.gifts;
        n.gifts = [];
        for (const gift of list) {
          const got = g.netGift(gift);
          if (got) this.toast('Гостинец от ' + clean(gift.from, 12) + ': ' + H.fmt(got) + ' кредитов');
        }
        this.writeSave('auto');
        for (const gift of list) n.send('giftAck', { id: gift.id });
      }
      if (n.awayNames) {
        this.toast('Пока вас не было, заходили: ' + n.awayNames.map(x => clean(x, 12)).join(', '));
        n.awayNames = null;
      }
    },

    visitSendPos() {
      const n = globalThis.Net98, g = this.game, p = g.player, inCar = this.mode === 'field' && !!g.map && NET.CARS.includes(g.map.id);
      const key = inCar ? [g.map.id, p.x, p.y, p.dir, this.walk ? 1 : 0].join() : 'out', at = performance.now();
      if (key === this.visitPosKey || at - (this.visitPosAt == null ? -Infinity : this.visitPosAt) < POS_GAP_MS) return;
      if (n.send('pos', inCar ? { m: g.map.id, x: p.x, y: p.y, d: p.dir, w: !!this.walk } : { m: null })) { this.visitPosKey = key; this.visitPosAt = at; }
    },

    visitSay(id) {
      const at = performance.now();
      if (at - (this.visitSayAt == null ? -Infinity : this.visitSayAt) < SAY_GAP_MS) { this.sfx('deny'); return; }
      this.visitSayAt = at;
      globalThis.Net98.send('visitSay', { id });
    },

    visitHostHere() {
      const room = globalThis.Net98.room;
      return !!room && Array.from(room.peers.values()).some(p => p.host && NET.CARS.includes(p.m));
    },

    visitEchoShown() {
      const g = this.game;
      return !!g.guest && g.map.id === 'express' && !this.visitHostHere();
    },

    visitLabel(c, text, x, y, col) {
      const w = this.measure(text, 10, true) + 10, ly = y - 30;
      c.fillStyle = 'rgba(6,10,30,0.8)'; c.fillRect(x + 16 - w / 2, ly, w, 13);
      c.strokeStyle = col; c.strokeRect(x + 16.5 - w / 2, ly + 0.5, w - 1, 12);
      this.text(text, x + 16, ly + 1, { align: 'center', size: 10, bold: true, col });
    },

    visitBubble(c, text, x, y) {
      const w = Math.min(240, this.measure(text, 10) + 12), bx = Math.max(4, Math.min(W - w - 4, x + 16 - w / 2)), by = y - 52;
      c.fillStyle = 'rgba(250,246,236,0.94)'; c.fillRect(bx, by, w, 15);
      c.strokeStyle = 'rgba(60,44,30,0.85)'; c.lineWidth = 1; c.strokeRect(bx + 0.5, by + 0.5, w - 1, 14);
      c.fillStyle = 'rgba(250,246,236,0.94)'; c.beginPath(); c.moveTo(x + 12, by + 15); c.lineTo(x + 20, by + 15); c.lineTo(x + 16, by + 20); c.fill();
      this.text(this.clip(text, w - 8, 10), bx + w / 2, by + 2, { align: 'center', size: 10, col: '#3a2a1e', shadow: false });
    },

    visitDraws(c, draws, cx, cy) {
      const n = globalThis.Net98, g = this.game, room = n && n.room;
      if (!n) return;
      if (this.visitEchoShown()) {
        const [ex, ey] = ECHO;
        draws.push({ y: ey, fn: () => {
          const x = ex * TS - cx, y = ey * TS - cy;
          c.save(); c.globalAlpha = 0.5 + 0.12 * Math.sin(this.t * 3);
          G.drawSprite(c, this.cardLook(g.guest.lead, g.guest.gender), 'down', 0, x, y);
          c.restore();
          this.visitLabel(c, g.guest.name, x, y, C.cyan);
        } });
      }
      if (this.visitMine) { const p = g.player, text = this.visitMine.text; draws.push({ y: p.fy + 0.02, fn: () => this.visitBubble(c, text, p.fx * TS - cx, p.fy * TS - cy) }); }
      if (!room) return;
      for (const p of room.peers.values()) {
        if (p.m !== g.map.id || p.fx == null) continue;
        draws.push({ y: p.fy, fn: () => {
          const x = p.fx * TS - cx, y = p.fy * TS - cy, frame = p.moving ? Math.floor(p.walkT * 8) % 4 : 0, col = p.host ? C.gold : '#8fe08a';
          G.drawSprite(c, this.cardLook(p.look, p.gender), p.d || 'down', frame, x, y);
          this.visitLabel(c, clean(p.name, 12), x, y, col);
          if (p.say) this.visitBubble(c, p.say.text, x, y);
        } });
      }
    },

    visitFront() {
      const n = globalThis.Net98, g = this.game, [fx, fy] = g.front(), room = n && n.room;
      if (g.guest && this.visitEchoShown() && fx === ECHO[0] && fy === ECHO[1]) return { echo: true };
      if (!room) return null;
      for (const p of room.peers.values()) if (p.m === g.map.id && p.x === fx && p.y === fy) return p;
      return null;
    },

    fieldKey(k, code) {
      const g = this.game, n = globalThis.Net98;
      if (g.guest) {
        if (g.pending && g.pending.type === 'say') return base.fieldKey.call(this, k, code);
        if (g.busy()) return undefined;
        if (k === 'ok') {
          const p = this.visitFront();
          if (p && p.echo) g.say('', g.guest.name + ' сейчас не здесь. Подпись: «' + (g.guest.sign || 'нет подписи') + '»');
          else if (p) this.openVisitPeer(p);
          else g.interact({ shift: this.walk });
          return undefined;
        }
        if (k === 'back' || code === 'Tab') { this.openVisitMenu(); return undefined; }
        if (code === 'KeyT') this.openVisitPhrases();
        if (code === 'KeyY' && n.activeInvites()[0]) this.netInviteAccept(n.activeInvites()[0]);
        return undefined;
      }
      if (n && n.room && !g.busy() && NET.CARS.includes(g.map.id)) {
        if (k === 'ok') { const p = this.visitFront(); if (p) { this.openVisitPeer(p); return undefined; } }
        if (code === 'KeyT') { this.openVisitPhrases(); return undefined; }
      }
      return base.fieldKey.call(this, k, code);
    },

    drawField(c) {
      if (!this.game.guest) return base.drawField.call(this, c);
      this.drawWorld(c);
      if (!this.screens.length && !this.dlg) this.drawVisitHud(c);
      return undefined;
    },

    drawVisitHud(c) {
      const g = this.game, n = globalThis.Net98, place = g.map.def.name.split(': ').pop(), title = 'В гостях: ' + g.guest.name, pw = Math.max(this.measure(place, 11, true), this.measure(title, 10)) + 18;
      this.drawMapBanner(c);
      c.fillStyle = 'rgba(4,6,20,0.78)'; c.fillRect(6, 6, pw, 34);
      c.fillStyle = C.brass; c.fillRect(6, 39, pw, 1);
      this.text(place, 14, 9, { size: 11, bold: true, col: C.cream });
      this.text(title, 14, 24, { size: 10, col: C.gold });
      this.drawNetChip(c, 10 + pw, 6);
      this.hints([['T', 'Фраза'], ['Esc', 'Меню']], W - 10, HGT - 18, { align: 'right' });
      if (n.state !== 'online') {
        const text = 'Связь потеряна, пробуем снова', w = this.measure(text, 12, true) + 24;
        c.fillStyle = 'rgba(40,6,6,0.88)'; c.fillRect(W / 2 - w / 2, 46, w, 20);
        this.text(text, W / 2, 49, { align: 'center', size: 12, bold: true, col: '#ff9a8a' });
      }
      if (g.busy()) return;
      const [fx, fy] = g.front(), p = this.visitFront(), e = !p && g.entAt(fx, fy, x => !NOT_TOUCHED.has(x.kind));
      const label = p ? (p.echo ? g.guest.name : clean(p.name, 12)) : e ? (e.kind === 'npc' ? (e.def.ghost ? 'Терминал' : 'Говорить') : 'Осмотреть') : null;
      if (label) this.hints([['Space', label]], W / 2, HGT - 44, { align: 'center' });
    },

    drawBookNet() {
      const n = globalThis.Net98, g = this.game;
      if (!n) return;
      if (g.guest) this.button(W / 2 - 100, 430, 200, 18, 'R: оставить запись', () => this.openVisitSign(), { size: 10, bold: true });
      else if (n.book && n.book.length) this.button(W / 2 - 100, 430, 200, 18, 'R: записи гостей', () => this.openGuestEntries(), { size: 10, bold: true });
    },

    bookNetKey(code) {
      const n = globalThis.Net98, g = this.game;
      if (code !== 'KeyR' || !n) return false;
      if (g.guest) { this.openVisitSign(); return true; }
      if (n.book && n.book.length) { this.openGuestEntries(); return true; }
      return false;
    },

    visitListWindow(o) {
      const ui = this;
      return this.push(Object.assign({
        sel: 0, visitList: true,
        draw(c) {
          const list = this.rows(), x = (W - o.w) / 2, h = 54 + list.length * 24, y = Math.round((HGT - h) / 2);
          if (this.sel >= list.length) this.sel = Math.max(0, list.length - 1);
          c.fillStyle = 'rgba(2,3,14,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, o.w, h, { title: o.title });
          ui.list(x + 12, y + 22, o.w - 24, list.map(r => ({ label: r.label })), this.sel, { rowH: 24, onClick: i => { this.sel = i; this.act(list[i]); } });
          ui.hints(o.hints || [['↑↓', 'Выбор'], ['Enter', 'Нажать'], ['Esc', 'Назад']], W / 2, y + h + 6, { align: 'center' });
        },
        key(k, code) {
          const list = this.rows();
          if (/^Digit[1-8]$/.test(code || '') && list[+code.slice(5) - 1]) { this.sel = +code.slice(5) - 1; this.act(list[this.sel]); return; }
          if (ui.listNav(this, k, list.length)) return;
          if (k === 'back') { ui.pop(); return; }
          if (k === 'ok' && list[this.sel]) this.act(list[this.sel]);
        }
      }, o));
    },

    openVisitMenu() {
      const ui = this, n = globalThis.Net98, g = this.game;
      return this.visitListWindow({
        w: 300, title: 'В гостях', visitMenu: true,
        rows() { return [{ id: 'go', label: 'Продолжить' }, { id: 'say', label: 'Фраза' }, { id: 'host', label: 'Профиль хозяина' }, { id: 'home', label: 'Вернуться на свой Экспресс' }]; },
        act(r) {
          if (r.id === 'go') { ui.pop(); return; }
          if (r.id === 'say') { ui.screens.pop(); ui.openVisitPhrases(); return; }
          if (r.id === 'host') {
            const row = (n.friends && n.friends.list.find(f => f.uid === g.guest.uid)) || { uid: g.guest.uid, name: g.guest.name, gender: n.room ? n.room.gender : 'm', sign: g.guest.sign };
            ui.screens.pop();
            ui.openFriendProfile(row);
            return;
          }
          ui.visitEnd();
        }
      });
    },

    openVisitPhrases() {
      const ui = this;
      return this.visitListWindow({
        w: 260, title: 'Фраза', visitPhrases: true, hints: [['1-8', 'Сказать'], ['Esc', 'Назад']],
        rows() { return NET.PHRASES.map((label, id) => ({ id, label: (id + 1) + '. ' + label })); },
        act(r) { ui.pop(); ui.visitSay(r.id); }
      });
    },

    openVisitPeer(p) {
      const ui = this, n = globalThis.Net98;
      return this.visitListWindow({
        w: 260, title: clean(p.name, 12), visitPeer: true,
        rows() {
          const F = n.friends, friend = F && F.list.find(r => r.uid === p.uid), list = [];
          if (friend) list.push({ id: 'view', label: 'Профиль', row: friend });
          else if (F && !F.out.some(r => r.uid === p.uid)) list.push({ id: 'add', label: 'В друзья' });
          list.push({ id: 'say', label: 'Фраза' });
          if (friend && n.table && n.table.state === 'lobby') list.push({ id: 'invite', label: 'Позвать за стол' });
          return list;
        },
        act(r) {
          ui.screens.pop();
          if (r.id === 'view') ui.openFriendProfile(r.row);
          else if (r.id === 'add') { n.send('req', { uid: p.uid }); ui.toast('Запрос отправлен: ' + clean(p.name, 12)); }
          else if (r.id === 'invite') n.send('invite', { uid: p.uid });
          else ui.openVisitPhrases();
        }
      });
    },

    openVisitSign() {
      const ui = this, n = globalThis.Net98;
      const scr = this.visitListWindow({
        w: 400, title: 'Запись в книге', visitSign: true,
        rows() { return NET.WISHES.map((label, id) => ({ id, label })).concat({ id: 'own', label: 'Свой текст...' }); },
        act(r) {
          if (r.id !== 'own') {
            n.send('bookSign', { id: r.id });
            ui.pop();
            ui.toast('Запись оставлена');
            return;
          }
          ui.openShortText({
            title: 'Запись в книге', value: '',
            hint: 'До 40 знаков. Запись видят хозяин и его гости.',
            hints: [['Буквы', 'Ввод'], ['Backspace', 'Стереть'], ['←↑↓→', 'Сетка'], ['Enter', 'Нажать'], ['Esc', 'Назад']],
            submit(text) {
              const body = clean(text, 40);
              if (!body) return { ok: false, text: 'Пустую запись не оставить.' };
              n.send('bookSign', { text: body });
              ui.screens = ui.screens.filter(s => s !== scr);
              ui.toast('Запись оставлена');
              return { ok: true, text: '' };
            }
          });
        }
      });
      return scr;
    },

    openGuestEntries() {
      const ui = this, n = globalThis.Net98;
      return this.push({
        guestEntries: true, sel: 0, top: 0, confirm: null,
        act(id, e) {
          if (this.confirm !== id) { this.confirm = id; ui.sfx('deny'); return; }
          this.confirm = null;
          n.send('bookDel', { at: e.at, uid: e.uid });
          if (id === 'block') n.send('block', { uid: e.uid });
          ui.sfx('cancel');
        },
        draw(c) {
          const list = n.book || [], x = 60, y = 60, w = W - 120, h = 340;
          if (this.sel >= list.length) this.sel = Math.max(0, list.length - 1);
          if (this.sel < this.top) this.top = this.sel;
          if (this.sel >= this.top + ENTRY_ROWS) this.top = this.sel - ENTRY_ROWS + 1;
          c.fillStyle = 'rgba(2,3,14,0.6)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, w, h, { title: 'Записи гостей' });
          if (!list.length) ui.text('Записей нет.', W / 2, y + 60, { align: 'center', size: 11, col: C.sub });
          list.slice(this.top, this.top + ENTRY_ROWS).forEach((e, k) => {
            const i = this.top + k, yy = y + 24 + k * 42, on = i === this.sel;
            c.fillStyle = on ? 'rgba(242,220,154,0.16)' : 'rgba(10,14,40,0.8)'; c.fillRect(x + 10, yy, w - 20, 38);
            ui.text(clean(e.name, 12) + ' · ' + dateOf(e.at), x + 16, yy + 3, { size: 11, bold: true, col: on ? C.gold : C.cream });
            ui.text(ui.fitText('«' + (e.text != null ? clean(e.text, 40) : NET.WISHES[e.id] || '') + '»', 10, w - 200), x + 16, yy + 20, { size: 10, col: C.sub });
            ui.hit(x + 10, yy, w - 20, 38, () => { this.sel = i; this.confirm = null; ui.sfx('select'); });
            ui.button(x + w - 178, yy + 8, 72, 22, on && this.confirm === 'del' ? 'Точно?' : 'Удалить', () => { this.sel = i; this.act('del', e); }, { size: 10 });
            ui.button(x + w - 102, yy + 8, 84, 22, on && this.confirm === 'block' ? 'Точно?' : 'Ч. список', () => { this.sel = i; this.act('block', e); }, { size: 10 });
          });
          ui.hints([['↑↓', 'Выбор'], ['Del', 'Удалить'], ['B', 'В чёрный список'], ['Esc', 'Назад']], W / 2, y + h + 6, { align: 'center' });
        },
        key(k, code) {
          const list = n.book || [], e = list[this.sel];
          if (k === 'back') { ui.pop(); return; }
          if (code === 'Delete' && e) { this.act('del', e); return; }
          if (code === 'KeyB' && e) { this.act('block', e); return; }
          if (k) this.confirm = null;
          ui.listNav(this, k, list.length);
        }
      });
    },

    openVisitLost() {
      const ui = this;
      return this.visitListWindow({
        w: 320, title: 'Связь не вернулась', visitLost: true,
        rows() { return [{ id: 'home', label: 'Вернуться на свой Экспресс' }, { id: 'wait', label: 'Подождать ещё' }]; },
        act(r) { if (r.id === 'home') ui.visitEnd('Связь потеряна'); else ui.pop(); }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
