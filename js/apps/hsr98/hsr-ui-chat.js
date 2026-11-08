(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;
  const LX = 12, LY = 40, LW = 196, LH = 412, ROW = 50, ROWS = 8;
  const CX = 216, CY = 40, CW = 412, CH = 412, BUB = 236, AV = 26;
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const BUBBLE = { them: ['#26307a', '#161c52'], themLine: '#4c5cb0', me: ['#f4e2a8', '#c8a45c'], meLine: '#fff4cc', meText: '#20140c' };
  const NOTE = { x: 236, w: 264, h: 40, hold: 4.5, slide: 0.25 };
  const dateText = ms => { const d = new Date(ms); return d.getDate() + ' ' + MONTHS[d.getMonth()]; };
  const masked = (who, g) => { const c = H.CHAT.CONTACTS[who]; return !!(c && c.mask && g && !g.cond(c.mask)); };
  const nameOf = (who, g) => (masked(who, g) ? '???' : H.SPEAKERS[who] ? H.SPEAKERS[who].name : who);
  const signOf = (who, g) => (masked(who, g) ? H.CHAT.CONTACTS[who].maskSign : H.CHAT.CONTACTS[who].sign);

  const looks = new Map();
  function lookOf(who, v, game) {
    const fem = game && game.state.gender === 'f';
    const key = who + '|' + (who === '@' ? (fem ? 'f' : 'm') : '') + '|' + (v ? JSON.stringify(v) : '');
    if (!looks.has(key)) looks.set(key, v ? Object.assign({}, G.lookOf(who, game), v) : G.lookOf(who, game));
    return looks.get(key);
  }

  const photos = new Map();
  function photoCanvas(id, game) {
    const key = id + '|' + game.state.gender;
    if (photos.has(key)) return photos.get(key);
    const p = H.CHAT.PHOTOS[id], cv = G.mkCanvas(320, 240), g = cv.getContext('2d');
    if (!H.Cine || !H.Cine.still(g, p.bg, 320, 240, 0, game)) { g.fillStyle = '#20284a'; g.fillRect(0, 0, 320, 240); }
    for (const [who, x] of p.figs) G.drawFigure(g, lookOf(who, null, game), x, 236, 1);
    photos.set(key, cv);
    return cv;
  }

  function delayOf(line, speed) {
    const k = 2 / (speed || 2);
    if (!line) return 0;
    if (line.who === '@') return 0.22 * k;
    if (line.text) return (0.5 + Math.min(1.4, line.text.length * 0.022)) * k;
    return 0.7 * k;
  }

  Object.assign(H.UI.prototype, {
    chatBox() {
      const wide = this.wide(), lx = this.left + 12, rx = this.right, lw = wide ? 248 : LW;
      const cx = lx + lw + 8, cw = rx - 12 - cx, bub = wide ? 348 : BUB;
      return { wide, lx, ly: LY, lw, lh: LH, cx, cy: CY, cw, ch: CH, bub, rx };
    },

    openChats(who) {
      const ui = this, g = this.game;
      g.chatSync();
      const list = () => g.chatContacts();
      const start = Math.max(0, list().findIndex(x => x.who === who));
      const s = this.push({
        full: true, sel: start, who: list()[start] ? list()[start].who : null, focus: list()[start] && list()[start].open ? 'chat' : 'list', rsel: 0, scroll: 0, wait: 0.45, top: 0,
        cur() {
          const L = list(), i = L.findIndex(x => x.who === this.who);
          this.sel = i >= 0 ? i : Math.max(0, Math.min(this.sel, L.length - 1));
          this.who = L[this.sel] ? L[this.sel].who : null;
          return L[this.sel] || null;
        },
        thread() { const c = this.cur(); return c ? g.chatCurrent(c.who) : null; },
        pickContact(i) {
          const n = list().length;
          if (!n) return;
          const v = Math.max(0, Math.min(n - 1, i));
          if (v !== this.sel) { this.sel = v; this.who = list()[v].who; this.scroll = 0; this.rsel = 0; this.wait = 0.45; ui.sfx('select'); }
        },
        enter() { if (!this.cur()) { ui.sfx('deny'); return; } if (this.focus !== 'chat') { this.focus = 'chat'; this.wait = Math.min(this.wait, 0.45); ui.sfx('select'); } },
        reply(i) {
          const id = this.thread(), v = id && g.chatView(id);
          if (!v || !v.wait || !g.chatPick(id, i)) return;
          ui.sfx('msg_out');
          this.rsel = 0; this.scroll = 0; this.wait = 0.12;
        },
        reveal() {
          const id = this.thread(), line = id && g.chatNext(id);
          if (!line) return;
          this.scroll = 0;
          if (line.who && line.who !== '@') ui.sfx('msg_in');
          if (g.chatThread(id).done) g.chatSync();
          const v = g.chatView(id);
          this.wait = v && v.next ? delayOf(v.next, ui.options.textSpeed) : 0;
        },
        tick(dt) {
          if (ui.top() !== this || this.focus !== 'chat') return;
          const id = this.thread(), v = id && g.chatView(id);
          if (!v || !v.next) return;
          this.wait -= dt;
          if (this.wait <= 0) this.reveal();
        },
        draw(c) {
          const b = ui.chatBox();
          ui.fullBg(c, false);
          ui.plate(b.lx, 10, 'Сообщения');
          const L = list();
          ui.text('Контактов: ' + L.length, b.lx + 106, 13, { size: 11, col: C.sub });
          ui.closeBtn(b.rx - 32, 10, () => this.key('back'));
          ui.chatList(c, this, L, b);
          ui.chatPane(c, this, b);
          const v = this.thread() && g.chatView(this.thread());
          const keys = this.focus === 'list' ? [['↑↓', 'Контакт'], ['Enter', 'Открыть'], ['Esc', 'Назад']]
            : v && v.wait ? [['↑↓', 'Ответ'], ['Enter', 'Отправить'], ['PgUp', 'История'], ['←', 'Контакты']]
              : [['Enter', 'Дальше'], ['↑↓', 'Прокрутка'], ['←', 'Контакты'], ['Esc', 'Назад']];
          ui.hints(keys, b.lx, HGT - 18);
        },
        key(k, code) {
          if (code === 'PageUp' || code === 'PageDown') { this.scroll += code === 'PageUp' ? 120 : -120; return; }
          if (this.focus === 'list') {
            if (k === 'back') { ui.pop(); return; }
            if (k === 'up' || k === 'down') { this.cur(); this.pickContact(this.sel + (k === 'up' ? -1 : 1)); }
            if (k === 'ok' || k === 'right') this.enter();
            return;
          }
          const id = this.thread(), v = id && g.chatView(id);
          if (k === 'back' || k === 'left' || code === 'Tab') { this.focus = 'list'; ui.sfx('cancel'); return; }
          if (v && v.wait) {
            if (k === 'up' || k === 'down') { this.rsel = (this.rsel + (k === 'up' ? v.wait.length - 1 : 1)) % v.wait.length; ui.sfx('select'); }
            if (k === 'ok') this.reply(this.rsel);
            return;
          }
          if (k === 'up' || k === 'down') { this.scroll += k === 'up' ? 40 : -40; return; }
          if (k === 'ok' && v && v.next) this.reveal();
        }
      });
      return s;
    },

    chatList(c, s, L, b = this.chatBox()) {
      const { lx, ly, lw, lh } = b;
      this.win(lx, ly, lw, lh, { top: '#121848', bottom: '#060924' });
      if (!L.length) {
        G.menuIcon(c, 'chat', lx + lw / 2 - 20, ly + 140, 40, C.dim);
        this.wrap('Пока никто не написал. Сообщения приходят после важных событий и раз в день.', lw - 40, 11).forEach((l, i) => this.text(l, lx + lw / 2, ly + 192 + i * 14, { align: 'center', size: 11, col: C.sub }));
        return;
      }
      s.cur();
      s.top = Math.max(0, Math.min(s.top, s.sel, L.length - ROWS));
      if (s.sel >= s.top + ROWS) s.top = s.sel - ROWS + 1;
      L.slice(s.top, s.top + ROWS).forEach((ct, j) => {
        const i = s.top + j, y = ly + 8 + j * ROW, on = i === s.sel, x = lx + 8, w = lw - 16;
        c.fillStyle = on ? (s.focus === 'list' ? 'rgba(242,220,154,0.24)' : 'rgba(242,220,154,0.12)') : j % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.15)';
        c.fillRect(x, y, w, ROW - 4);
        if (on) { c.fillStyle = C.brassHi; c.fillRect(x, y, 2, ROW - 4); }
        this.circlePortrait(c, lookOf(ct.who, null, this.game), x + 6, y + 5, 36, on ? C.brassHi : '#5a64a0');
        this.text(nameOf(ct.who, this.game), x + 50, y + 7, { size: 12, bold: true, col: on ? C.gold : C.cream });
        this.text(this.chatFit(signOf(ct.who, this.game), w - 60, 9), x + 50, y + 25, { size: 9, col: C.dim });
        if (ct.open) this.badge(x + w - 9, y + 12);
        this.hit(x, y, w, ROW - 4, () => { s.pickContact(i); s.enter(); });
      });
      if (s.top > 0) this.diamond(lx + lw / 2, ly + 5, 3, C.brassHi);
      if (s.top + ROWS < L.length) this.diamond(lx + lw / 2, ly + lh - 6, 3, C.brassHi);
      this.wheelZone(lx, ly, lw, lh, d => s.pickContact(s.sel + (d > 0 ? 1 : -1)));
    },

    chatFit(str, w, size) {
      if (this.measure(str, size) <= w) return str;
      let t = str;
      while (t.length > 1 && this.measure(t + '...', size) > w) t = t.slice(0, -1);
      return t.trimEnd() + '...';
    },

    chatItems(ct, s, b = this.chatBox()) {
      const g = this.game, items = [], bub = b.bub;
      let last = null;
      ct.threads.forEach(id => {
        const v = g.chatView(id);
        items.push({ kind: 'date', h: 22, text: dateText(v.st.at) });
        last = null;
        v.lines.slice(0, v.n).forEach(line => {
          if (line.flag) return;
          if (line.quest || line.give) { items.push({ kind: 'sys', h: 24, line }); last = null; return; }
          const me = line.who === '@', first = last !== line.who;
          let w, h, rows = null;
          if (line.text) { rows = this.wrap(line.text, bub - 16, 11); w = Math.max(...rows.map(r => this.measure(r, 11))) + 16; h = rows.length * 14 + 10; }
          else if (line.sticker) { w = 68; h = 68; }
          else { w = 156; h = 132; }
          const lift = first && !me ? 10 : 0;
          items.push({ kind: 'msg', me, who: line.who, first, line, rows, w: Math.round(w), bh: h, h: h + lift, gap: first ? 8 : 3 });
          last = line.who;
        });
        const live = s.focus === 'chat' && id === g.chatCurrent(ct.who) && v.next && v.next.who && v.next.who !== '@';
        if (live) { items.push({ kind: 'typing', me: false, who: v.next.who, first: last !== v.next.who, w: 46, h: 22, gap: last !== v.next.who ? 8 : 3 }); }
      });
      return items;
    },

    chatPane(c, s, b = this.chatBox()) {
      const g = this.game, ct = s.cur(), { cx, cy, cw, ch } = b;
      this.win(cx, cy, cw, ch, { top: '#141a4c', bottom: '#070a26' });
      if (!ct) {
        G.menuIcon(c, 'chat', cx + cw / 2 - 24, 190, 48, C.dim);
        this.text('Сообщений нет', cx + cw / 2, 250, { align: 'center', size: 14, bold: true, serif: true, col: C.cream });
        return;
      }
      this.text(nameOf(ct.who, this.game), cx + 16, cy + 12, { size: 15, bold: true, serif: true, col: C.gold });
      this.text(this.chatFit(signOf(ct.who, this.game), cw - 40, 10), cx + 16, cy + 32, { size: 10, col: C.sub });
      c.fillStyle = 'rgba(201,164,92,0.45)'; c.fillRect(cx + 10, cy + 48, cw - 20, 1);
      const id = g.chatCurrent(ct.who), v = g.chatView(id);
      const opts = v.wait || [], foot = opts.length ? 26 + opts.length * 28 : 26;
      const top = cy + 54, bottom = cy + ch - 8 - foot, area = bottom - top;
      const items = this.chatItems(ct, s, b);
      const total = items.reduce((a, it) => a + it.h + (it.gap || 4), 0) + 6;
      const maxScroll = Math.max(0, total - area);
      s.scroll = Math.max(0, Math.min(s.scroll, maxScroll));
      let y = total <= area ? top + 4 : top - maxScroll + s.scroll + 4;
      c.save();
      c.beginPath(); c.rect(cx + 4, top, cw - 8, area); c.clip();
      for (const it of items) {
        y += it.gap || 4;
        if (y + it.h >= top - 4 && y <= bottom + 4) this.chatItem(c, it, y, b);
        y += it.h;
      }
      c.restore();
      if (maxScroll > 0) {
        if (s.scroll < maxScroll) { this.diamond(cx + cw - 14, top + 6, 4, C.brassHi); this.hit(cx + cw - 24, top, 20, 16, () => { s.scroll += 120; }); }
        if (s.scroll > 0) { this.diamond(cx + cw - 14, bottom - 6, 4, C.brassHi); this.hit(cx + cw - 24, bottom - 16, 20, 16, () => { s.scroll = 0; }); }
      }
      this.hit(cx + 4, top, cw - 30, area, () => { if (s.focus !== 'chat') s.enter(); else if (v.next) s.reveal(); });
      this.wheelZone(cx, top, cw, area, d => { s.scroll = Math.max(0, Math.min(maxScroll, s.scroll + (d > 0 ? -40 : 40))); });
      const fy = bottom + 6;
      c.fillStyle = 'rgba(201,164,92,0.3)'; c.fillRect(cx + 10, fy - 2, cw - 20, 1);
      if (opts.length) {
        this.text('Ответ', cx + 16, fy + 4, { size: 10, bold: true, col: C.sub });
        opts.forEach((o, i) => this.button(cx + 14, fy + 20 + i * 28, cw - 28, 24, this.chatFit(o, cw - 48, 11), () => { s.focus = 'chat'; s.reply(i); }, { active: s.focus === 'chat' && i === s.rsel, size: 11 }));
      } else {
        const msg = v.next ? (s.focus === 'chat' ? 'печатает...' : 'Новое сообщение. Enter, чтобы открыть') : 'Новых сообщений нет';
        this.text(msg, cx + cw / 2, fy + 6, { align: 'center', size: 10, col: v.next ? C.cream : C.dim });
      }
    },

    chatItem(c, it, y, b = this.chatBox()) {
      const { cx, cw } = b;
      if (it.kind === 'date') {
        const w = this.measure(it.text, 9, true) + 18, x = Math.round(cx + cw / 2 - w / 2);
        c.fillStyle = 'rgba(4,6,20,0.7)'; c.fillRect(x, y + 3, w, 15);
        c.fillStyle = 'rgba(154,166,208,0.35)'; c.fillRect(x, y + 3, w, 1);
        this.text(it.text, cx + cw / 2, y + 5, { align: 'center', size: 9, bold: true, col: C.sub });
        return;
      }
      if (it.kind === 'sys') { this.chatSys(c, it.line, y, b); return; }
      const ax = it.me ? cx + cw - 14 - AV : cx + 12;
      const bx = it.me ? ax - 8 - it.w : ax + AV + 8;
      if (it.first) {
        this.circlePortrait(c, lookOf(it.who, null, this.game), ax, y, AV, it.me ? C.brassHi : '#5a64a0');
        if (!it.me && it.kind === 'msg') this.text(nameOf(it.who, this.game), bx, y - 1, { size: 8, col: C.dim });
      }
      const by = it.first && !it.me && it.kind === 'msg' ? y + 10 : y;
      if (it.kind === 'typing') { this.chatBubble(c, bx, y + 2, it.w, it.h, false, it.first); for (let i = 0; i < 3; i++) { const up = Math.max(0, Math.sin(this.t * 8 - i * 0.9)) * 2; c.fillStyle = C.cream; c.fillRect(bx + 12 + i * 9, y + 11 - up, 4, 4); } return; }
      const line = it.line;
      if (line.text) {
        this.chatBubble(c, bx, by, it.w, it.bh, it.me, it.first);
        it.rows.forEach((r, i) => this.text(r, bx + 8, by + 5 + i * 14, { size: 11, col: it.me ? BUBBLE.meText : C.cream, shadow: !it.me }));
      } else if (line.sticker) this.chatSticker(c, line.sticker, bx, by);
      else if (line.photo) this.chatPhoto(c, line.photo, bx, by);
    },

    chatBubble(c, x, y, w, h, me, tail) {
      x = Math.round(x); y = Math.round(y);
      const gr = c.createLinearGradient(0, y, 0, y + h), col = me ? BUBBLE.me : BUBBLE.them;
      gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
      c.fillStyle = '#02030c'; c.fillRect(x + 1, y - 1, w - 2, h + 2); c.fillRect(x - 1, y + 1, w + 2, h - 2);
      c.fillStyle = gr; c.fillRect(x + 1, y, w - 2, h); c.fillRect(x, y + 1, w, h - 2);
      c.fillStyle = me ? BUBBLE.meLine : BUBBLE.themLine; c.fillRect(x + 2, y + 1, w - 4, 1);
      if (!tail) return;
      c.fillStyle = col[0];
      if (me) { c.fillRect(x + w, y + 5, 2, 4); c.fillRect(x + w + 2, y + 6, 2, 2); }
      else { c.fillRect(x - 2, y + 5, 2, 4); c.fillRect(x - 4, y + 6, 2, 2); }
    },

    chatSys(c, line, y, b = this.chatBox()) {
      const quest = line.quest && H.QUESTS[line.quest];
      const text = quest ? 'Принято поручение: «' + quest.name + '»' : 'Получено: звёздный нефрит ×' + line.give.jade;
      const w = this.measure(text, 10, true) + 36, x = Math.round(b.cx + b.cw / 2 - w / 2);
      c.fillStyle = quest ? 'rgba(40,16,60,0.85)' : 'rgba(40,32,12,0.85)'; c.fillRect(x, y + 2, w, 20);
      c.fillStyle = quest ? '#b07af0' : C.brass; c.fillRect(x, y + 2, w, 1); c.fillRect(x, y + 21, w, 1);
      if (quest) G.menuIcon(c, 'mission', x + 6, y + 4, 16, '#e0c8ff');
      else G.itemIcon(c, 'jade', x + 5, y + 3, 18);
      this.text(text, x + 26, y + 6, { size: 10, bold: true, col: quest ? '#e0c8ff' : C.gold });
    },

    chatSticker(c, id, x, y) {
      const st = H.CHAT.STICKERS[id];
      if (!st) return;
      const g = this.game, el = H.CHARS[st.who] ? H.ELEMENTS[H.CHARS[st.who].elem].col : '#c9a45c';
      c.fillStyle = '#02030c'; c.fillRect(x, y, 68, 68);
      const gr = c.createRadialGradient(x + 34, y + 30, 4, x + 34, y + 34, 44);
      gr.addColorStop(0, G.light(el, 0.35)); gr.addColorStop(1, G.dark(el, 0.55));
      c.fillStyle = gr; c.fillRect(x + 1, y + 1, 66, 66);
      c.save(); c.beginPath(); c.rect(x + 1, y + 1, 66, 66); c.clip();
      G.drawPortrait(c, lookOf(st.who, st.v, g), x + 6, y + 4, 56);
      c.restore();
      this.chatFx(c, st.fx, x + 52, y + 12);
      const w = this.measure(st.cap, 9, true) + 10;
      c.fillStyle = '#fff6dc'; c.fillRect(x + 34 - w / 2, y + 52, w, 13);
      c.fillStyle = '#20140c'; c.fillRect(x + 34 - w / 2, y + 64, w, 1);
      this.text(st.cap, x + 34, y + 53, { align: 'center', size: 9, bold: true, col: '#20140c', shadow: false });
    },

    chatFx(c, fx, x, y) {
      const px = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x + a), Math.round(y + b), w, h); };
      const t = Math.floor(this.t * 3) % 2;
      if (fx === 'star') { px(-1, -5 - t, 3, 11, '#fff2a0'); px(-5, -1 - t, 11, 3, '#fff2a0'); px(0, -1 - t, 1, 1, '#ffffff'); }
      if (fx === 'heart') { px(-5, -3 - t, 4, 3, '#ff5a8a'); px(1, -3 - t, 4, 3, '#ff5a8a'); px(-5, 0 - t, 10, 2, '#ff5a8a'); px(-3, 2 - t, 6, 2, '#ff5a8a'); px(-1, 4 - t, 2, 1, '#ff5a8a'); px(-4, -2 - t, 1, 1, '#ffd0e0'); }
      if (fx === 'q') { px(-3, -6, 7, 2, '#ffffff'); px(3, -4, 2, 4, '#ffffff'); px(0, 0, 3, 2, '#ffffff'); px(0, 2, 2, 2, '#ffffff'); px(0, 5 + t, 2, 2, '#ffffff'); }
    },

    chatPhoto(c, id, x, y) {
      const p = H.CHAT.PHOTOS[id];
      if (!p) return;
      c.fillStyle = '#02030c'; c.fillRect(x - 1, y - 1, 158, 134);
      c.fillStyle = '#f6f0e0'; c.fillRect(x, y, 156, 132);
      c.fillStyle = '#d8ccb0'; c.fillRect(x, y + 131, 156, 1);
      const was = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      c.drawImage(photoCanvas(id, this.game), x + 6, y + 6, 144, 108);
      c.imageSmoothingEnabled = was;
      this.text(p.cap, x + 78, y + 117, { align: 'center', size: 9, bold: true, col: '#3a2c18', shadow: false });
    },

    chatEvent(e) {
      const n = (this.chatNote && this.chatNote.t > 0 ? this.chatNote.n : 0) + e.ids.length;
      this.chatNote = { who: e.who, id: e.ids[e.ids.length - 1], n, t: NOTE.hold, age: 0 };
    },

    updateChat(dt) {
      const g = this.game, idle = this.mode === 'field' && !this.screens.length && !this.dlg && !g.busy() && !g.cg;
      if (!idle) return;
      this.chatPoll = (this.chatPoll || 0) - dt;
      if (this.chatPoll <= 0) { this.chatPoll = 0.5; g.chatSync(); }
      const nt = this.chatNote;
      if (nt) { if (!nt.age) this.sfx('msg_in'); nt.age += dt; nt.t -= dt; if (nt.t <= 0) this.chatNote = null; }
    },

    drawChatNotice(c) {
      const nt = this.chatNote, g = this.game;
      if (!nt || this.screens.length || this.dlg || g.busy() || g.cg) return;
      const v = g.chatView(nt.id);
      if (!v) { this.chatNote = null; return; }
      const k = Math.min(1, nt.age / NOTE.slide, nt.t / NOTE.slide), x = NOTE.x, y = Math.round(6 - (1 - k) * (NOTE.h + 8));
      c.fillStyle = 'rgba(4,6,20,0.9)'; c.fillRect(x, y, NOTE.w, NOTE.h);
      c.fillStyle = C.brass; c.fillRect(x, y + NOTE.h - 1, NOTE.w, 1);
      c.fillStyle = C.brassHi; c.fillRect(x, y, 2, NOTE.h);
      this.circlePortrait(c, lookOf(nt.who, null, g), x + 7, y + 5, 30, C.brassHi);
      G.menuIcon(c, 'chat', x + 44, y + 4, 12, C.brassHi);
      this.text(nt.n > 1 ? 'Новых сообщений: ' + nt.n : 'Новое сообщение', x + 60, y + 4, { size: 9, col: C.sub });
      const first = v.lines[0];
      const preview = nameOf(nt.who, this.game) + ': ' + (first && first.text ? first.text : 'стикер');
      this.text(this.chatFit(preview, NOTE.w - 52, 11), x + 44, y + 19, { size: 11, bold: true, col: C.cream });
      this.hit(x, y, NOTE.w, NOTE.h, () => { this.chatNote = null; this.openChats(nt.who); });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
