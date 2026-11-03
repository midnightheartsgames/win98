(function (H) {
  'use strict';
  const G = H.Gfx, HD = H.HD;
  const { W, HGT, C } = H.UI_CONST;
  const SEAT_COL = ['#ffd471', '#56d4ff', '#5aff7a', '#ff8ac0'];
  const CRT = { fg: '#5aff7a', hi: '#b8ffc8', mid: '#3ac85a', dim: '#1e6a30' };
  const ERR = {
    none: 'Стол не найден',
    full: 'За столом нет мест',
    started: 'За этим столом партия уже идёт',
    busy: 'На сервере нет свободных столов',
    ready: 'Нужны два игрока, и все нажали «Готов»',
    host: 'Это может только хозяин стола',
    pause: 'Паузы закончились',
    pauseWait: 'Снять чужую паузу можно через 15 с'
  };
  const PHRASES = ['Сюда!', 'Нужна помощь', 'На базу!', 'Я в лавке', 'Держу север', 'Готов'];
  const PAUSES_OPEN = 3, LIST_EVERY_S = 5, LIST_ROWS = 10;
  const SCREEN = { x: 52, y: 70, w: 536 };
  const PULT = { x: 40, y: 286, w: 134, h: 150, gap: 8 };
  const fmt = n => H.fmt(Math.round(n));
  const cleanName = s => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f|{}=#<>]/g, '').trim().slice(0, 12) || 'Первопроходец';
  const seatsOf = T => T.seats.filter(Boolean);
  const mmss = ms => { const s = Math.ceil(Math.max(0, ms) / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  Object.assign(H.UI.prototype, {
    netAttach() {
      globalThis.Net98.onNet = m => this.netMessage(m);
    },

    netDetach() {
      const n = globalThis.Net98;
      if (!n || !n.onNet) return;
      n.onNet = null;
      if (this.netSession || n.table) n.send('tableLeave', this.netSession ? { keep: true } : {});
      this.netSession = null;
    },

    netMessage(m) {
      const n = globalThis.Net98, s = this.netSession;
      if (s) {
        s.message(m);
        this.netKeepTurn(s, m);
      }
      if (this.netSocialMessage) this.netSocialMessage(m);
      if (this.netVisitMessage) this.netVisitMessage(m);
      switch (m.op) {
        case 'me':
          if (s) n.send('tableBack', { code: s.code, since: s.last });
          else if (n.table) n.send('tableBack', { code: n.table.code, since: 0 });
          break;
        case 'table':
          if (this.netEntry) { this.screens = this.screens.filter(x => x !== this.netEntry); this.netEntry = null; }
          this.netTableChanged(m);
          break;
        case 'tableGone':
          if (m.kicked) this.toast('Хозяин снял вас с места');
          if (s && !m.keep) this.netFinish(true, 'Партия прервана');
          break;
        case 'tableError':
          this.netFail(m);
          break;
        case 'desync':
          this.netDesync();
          break;
        case 'say':
        case 'mark': {
          const arena = s && this.screens.find(x => x.arena && x.net === s);
          if (arena) arena.signal(m);
          break;
        }
        default:
      }
    },

    netTableChanged(m) {
      const s = this.netSession, host = m.seats[m.host];
      if (m.state === 'lobby') {
        if (this.netLeft === m.code) this.netLeft = null;
        if (s && s.code === m.code && (!s.A || s.waitLog)) { this.netFinish(true, 'Партия закончилась без вас'); return; }
        if (this.netResume) { this.netResume = false; if (!this.screens.some(x => x.hdTable)) this.openHdTable(); }
        if (this.netHost && this.netHost.code === m.code && host && this.netHost.uid !== host.uid) this.toast('Теперь хозяин стола: ' + cleanName(host.name));
        this.netHost = { code: m.code, uid: host ? host.uid : null };
        return;
      }
      if (!s && m.state === 'run' && m.code !== this.netLeft) this.netBegin(m);
    },

    netFail(m) {
      const text = m.code === 'sim' ? 'За этим столом другая версия Рубежа' + (m.ver ? ': ' + m.ver : '') + '. У вас ' + H.BUILD_VERSION + '. Обновите игру' : ERR[m.code] || 'Сервер отказал';
      if (this.netSession && m.code === 'none') { this.netFinish(true, 'Партия прервана'); return; }
      if (this.netEntry) { this.netEntry.note = { ok: false, text }; this.sfx('deny'); return; }
      this.toast(text);
      this.sfx('deny');
    },

    netBegin(T) {
      const n = globalThis.Net98;
      this.netSession = new HD.NetSession({
        code: T.code, seed: T.seed, diff: T.diff, seat: n.seat, ticks: T.ticks, turnMs: T.turnMs, names: seatsOf(T).map(x => cleanName(x.name)), clock: () => performance.now(),
        send: c => n.send('cmd', { c }), onHash: (tick, h) => n.send('hash', { n: tick, h })
      });
      this.netSession.waitLog = !!this.netResume;
      this.netResume = false;
      this.netRoute();
    },

    netRoute() {
      const s = this.netSession;
      this.screens = this.screens.filter(x => !x.hdRound);
      if (s.A) this.openHdArena(s);
      else if (s.waitLog) this.openHdCatch();
      else this.openHdDraft(s);
    },

    netDesync() {
      const n = globalThis.Net98, s = this.netSession;
      if (!s) return;
      if (s.resyncs >= 1) { this.netFinish(true, 'Партия разошлась и прервана'); return; }
      s.resyncs++;
      s.restart();
      s.waitLog = true;
      s.onAck = null;
      n.send('tableBack', { code: s.code, since: 0 });
      this.toast('Партия разошлась, пересчитываем');
      this.netRoute();
    },

    netKeepTurn(s, m) {
      const kept = s.kept || (s.kept = new Map());
      if (m.op === 't' && m.c) kept.set(m.n, m.c);
      else if (m.op === 'log') for (const e of m.turns) kept.set(e[0], e.slice(1));
    },

    netJournal() {
      const s = this.netSession;
      const turns = Array.from(s.kept || []).filter(e => e[0] <= s.n).sort((a, b) => a[0] - b[0]).map(e => [e[0]].concat(e[1]));
      return { sim: HD.SIM, code: s.code, seed: s.seed, diff: s.diff, seat: s.seat, count: s.count, ticks: s.ticks, turnMs: s.turnMs, turn: s.n, tick: s.A ? s.A.tick : null, hash: s.A ? s.A.stateHash() : null, turns };
    },

    netReplay(T) {
      const names = Array.from({ length: T.count }, (_, i) => 'Место ' + (i + 1));
      const s = new HD.NetSession({ code: T.code, seed: T.seed, diff: T.diff, seat: T.seat, ticks: T.ticks, turnMs: T.turnMs, names, clock: () => performance.now(), send: () => false, onHash() {} });
      s.feedLog({ turns: T.turns, upto: T.turn });
      while (!s.A && s.n < s.last) s.nextTurn();
      while (s.A && s.A.tick < T.tick && !s.A.over) s.stepOne(true);
      const hash = s.A ? s.A.stateHash() : null;
      this.bugTable = { tick: T.tick, hash, expected: T.hash, match: hash === T.hash, sameArena: T.sim === HD.SIM };
      this.netSession = s;
      this.netRoute();
      this.toast('Партия из отчёта: ' + (this.bugTable.match ? 'хэш совпал' : 'хэш не совпал'));
    },

    netStalled() {
      const n = globalThis.Net98, s = this.netSession;
      return !!(s && s.A && !s.A.over && n.table && n.table.state !== 'run' && s.credit() <= 0);
    },

    netFinish(quit, why) {
      const n = globalThis.Net98, s = this.netSession;
      if (!s) return;
      const T = n.table, uids = T && T.code === s.code ? T.seats.map(x => (x ? x.uid : null)) : [];
      this.netSession = null;
      this.netLeft = s.code;
      n.send(quit ? 'tableLeave' : 'tableOver');
      const sum = this.game.hdFinishNet(s, quit);
      this.screens = this.screens.slice(0, this.screens.findIndex(x => x.hub) + 1);
      if (why) this.toast(why);
      if (sum) this.openHdCrewResult(sum, { uids, code: quit ? null : s.code });
    },

    netPaused() {
      const n = globalThis.Net98;
      return !!(n && n.table && n.table.paused);
    },

    netPauseView() {
      const n = globalThis.Net98, T = n && n.table, P = T && T.paused;
      if (!P) return null;
      const since = performance.now() - T.at, seat = T.seats[P.by];
      return { by: P.by, name: seat ? cleanName(seat.name) : '', left: P.left - since, resume: P.resume == null ? null : P.resume - since, others: P.others - since, mine: P.by === n.seat };
    },

    netPausesLeft() {
      const n = globalThis.Net98, T = n && n.table, seat = T && T.seats[n.seat];
      return T && T.open && seat ? Math.max(0, PAUSES_OPEN - seat.pauses) : null;
    },

    netPauseToggle() {
      globalThis.Net98.send('pause', { on: !this.netPaused() });
      this.sfx('select');
    },

    netSeatCol(p) { return SEAT_COL[p] || SEAT_COL[0]; },

    netPhrase(id) { return PHRASES[id] || null; },

    netOffline(p) {
      const n = globalThis.Net98, seat = n && n.table && n.table.seats[p];
      return !!(seat && !seat.online);
    },

    netOpenTable() {
      const n = globalThis.Net98;
      if (!n.hasConsent()) return this.openNetConsent(() => this.openHdTable());
      return this.openHdTable();
    },

    netRejoin() {
      const n = globalThis.Net98;
      this.netAttach();
      this.netResume = true;
      n.send('tableBack', { code: n.me.table, since: 0 });
      this.sfx('confirm');
    },

    openHdTable() {
      const ui = this, g = this.game, n = globalThis.Net98, D = g.hd();
      this.netAttach();
      if (n.state === 'off') n.connect();
      const diffs = Object.keys(HD.DIFFS).filter(d => g.hdCanDiff(d));
      const pref = () => (diffs.includes(D.opts.diff) ? D.opts.diff : 'normal');
      const rows = () => {
        if (n.state !== 'online') return [{ id: 'retry', label: 'Подключиться' }, { id: 'link', label: 'Настройки связи' }, { id: 'back', label: 'Назад' }];
        const T = n.table;
        if (!T) return [{ id: 'new', label: 'Создать стол' }, { id: 'join', label: 'Войти по коду' }, { id: 'list', label: 'Открытые столы' }, { id: 'back', label: 'Назад' }];
        const call = seatsOf(T).length < T.seats.length ? [{ id: 'call', label: 'Позвать друга' }] : [];
        if (T.host === n.seat) return [{ id: 'start', label: 'Начать партию' }, { id: 'diff', label: 'Сложность: ' + HD.DIFFS[T.diff].name }, { id: 'open', label: 'Открыт для всех: ' + (T.open ? 'да' : 'нет') }].concat(call, { id: 'back', label: 'Покинуть стол' });
        const me = T.seats[n.seat];
        return [{ id: 'ready', label: me && me.ready ? 'Я не готов' : 'Готов' }].concat(call, { id: 'back', label: 'Покинуть стол' });
      };
      const act = id => {
        const T = n.table;
        if (id === 'retry') { n.connect(); ui.sfx('select'); return; }
        if (id === 'link') { ui.openNetLink(); return; }
        if (id === 'new') { n.send('tableNew', { name: g.state.name, diff: pref(), open: false }); ui.sfx('confirm'); return; }
        if (id === 'join') { ui.openHdJoin(); return; }
        if (id === 'list') { ui.openHdTables(); return; }
        if (id === 'call') { ui.openFriends(0); return; }
        if (id === 'start') { n.send('tableStart'); ui.sfx('confirm'); return; }
        if (id === 'ready') { n.send('tableReady', { on: !(T.seats[n.seat] && T.seats[n.seat].ready) }); ui.sfx('select'); return; }
        if (id === 'diff') { n.send('tableSet', { diff: diffs[(diffs.indexOf(T.diff) + 1) % diffs.length] }); ui.sfx('select'); return; }
        if (id === 'open') { n.send('tableSet', { open: !T.open }); ui.sfx('select'); return; }
        if (id === 'back') {
          if (T) { n.send('tableLeave'); ui.sfx('cancel'); return; }
          ui.pop();
        }
      };
      const waitText = T => {
        const taken = T.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0), wait = taken.filter(i => i !== T.host && !T.seats[i].ready);
        if (taken.length < 2) return 'ВСТАВЬТЕ ЖЕТОНЫ: нужен ещё один игрок';
        if (wait.length) return 'Ждём: ' + wait.map(i => cleanName(T.seats[i].name)).join(', ');
        return T.host === n.seat ? 'Все готовы: можно начинать' : 'Все готовы: ждём хозяина';
      };
      return this.push({
        full: true, hd: true, hdNet: true, hdTable: true, kick: -1, rows,
        kickSeat(i) {
          const T = n.table;
          if (!T || T.host !== n.seat || i === n.seat || !T.seats[i]) return;
          if (this.kick !== i) { this.kick = i; ui.sfx('deny'); return; }
          this.kick = -1;
          n.send('tableKick', { seat: i });
          ui.sfx('cancel');
        },
        draw(c) {
          const T = n.table, list = rows(), { x, y, w } = SCREEN, h = 196, mx = x + 16, my = y + 48;
          if (this.sel >= list.length) this.sel = list.length - 1;
          ui.hdCabinet(c, PULT.y - 10);
          ui.hdCrt(c, x, y, w, h);
          if (n.state !== 'online') ui.text(ui.netStateText(), mx, y + 16, { size: 13, bold: true, col: CRT.hi, shadow: false });
          else if (!T) {
            ui.text('СТОЛ НЕ ВЫБРАН', mx, y + 16, { size: 14, bold: true, col: CRT.hi, shadow: false });
            ui.wrap('Создайте стол и передайте код друзьям, введите код их стола или сядьте за открытый. Играть можно вдвоём, втроём и вчетвером.', 250, 11).forEach((l, i) => ui.text(l, x + 262, my + i * 16, { size: 11, col: CRT.fg, shadow: false }));
          } else {
            ui.text('СТОЛ', mx, y + 16, { size: 12, col: CRT.mid, shadow: false });
            ui.text(T.code.split('').join(' '), mx + 46, y + 10, { size: 20, bold: true, col: CRT.hi, shadow: false });
            const host = T.seats[T.host];
            [['СЛОЖНОСТЬ', HD.DIFFS[T.diff].name], ['ОТКРЫТЫЙ', T.open ? 'да' : 'нет'], ['ХОЗЯИН', host ? cleanName(host.name) : ''], ['ВЕРСИЯ', T.ver || H.BUILD_VERSION]].forEach(([a, b], i) => {
              ui.text(a, x + 300, my + i * 20, { size: 11, col: CRT.mid, shadow: false });
              ui.text(b, x + 396, my + i * 20, { size: 11, bold: true, col: CRT.hi, shadow: false });
            });
            ui.text(ui.clip(waitText(T), w - 32, 11), mx, y + h - 22, { size: 11, bold: true, col: CRT.fg, shadow: false });
          }
          list.forEach((r, i) => {
            const yy = my + i * 24, on = i === this.sel;
            if (on) { c.fillStyle = 'rgba(90,255,122,0.16)'; c.fillRect(mx - 4, yy - 3, 230, 22); }
            ui.text((on ? '> ' : '  ') + r.label, mx, yy, { size: 12, bold: on, col: on ? CRT.hi : CRT.fg, shadow: false });
            ui.hit(mx - 4, yy - 3, 230, 22, () => { this.sel = i; act(r.id); });
          });
          (T ? T.seats : [null, null, null, null]).forEach((seat, i) => ui.drawHdPult(c, this, i, seat, T));
          const hostHere = T && T.host === n.seat && seatsOf(T).length > 1;
          ui.hints([['↑↓', 'Выбор'], ['Enter', 'Нажать']].concat(hostHere ? [['1-4', 'Снять с места']] : [], [['Esc', T ? 'Покинуть' : 'Назад']]), W / 2, HGT - 20, { align: 'center' });
        },
        key(k, code) {
          const list = rows();
          if (/^Digit[1-4]$/.test(code || '')) { this.kickSeat(+code.slice(5) - 1); return; }
          if (k) this.kick = -1;
          if (ui.listNav(this, k, list.length)) return;
          if (k === 'ok') { act(list[Math.min(this.sel, list.length - 1)].id); return; }
          if (k === 'back') act('back');
        }
      });
    },

    drawHdPult(c, scr, i, seat, T) {
      const n = globalThis.Net98, { y, w, h, gap } = PULT, x = PULT.x + i * (w + gap), col = SEAT_COL[i], mine = !!T && i === n.seat, lit = !!seat && (seat.ready || i === T.host);
      const gr = c.createLinearGradient(x, y, x, y + h);
      gr.addColorStop(0, '#2a2038'); gr.addColorStop(1, '#140e1e');
      c.fillStyle = gr; c.fillRect(x, y, w, h);
      c.fillStyle = seat ? col : '#3a3050'; c.fillRect(x, y, w, 15);
      c.strokeStyle = mine ? '#ffffff' : seat ? col : '#3a3050'; c.lineWidth = mine ? 2 : 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); c.lineWidth = 1;
      this.text((i + 1) + 'P', x + 6, y + 2, { size: 10, bold: true, col: '#1a1208', shadow: false });
      if (mine) this.text('вы', x + w - 6, y + 2, { align: 'right', size: 10, bold: true, col: '#1a1208', shadow: false });
      const sy = y + h - 20;
      c.fillStyle = '#0a0612'; c.beginPath(); c.arc(x + 20, sy, 9, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#5a5068'; c.fillRect(x + 19, sy - 11, 3, 11);
      c.fillStyle = seat ? col : '#3a3050'; c.beginPath(); c.arc(x + 20.5, sy - 13, 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = lit ? '#ff4a3a' : '#5a1410'; c.beginPath(); c.arc(x + w - 20, sy, 9, 0, Math.PI * 2); c.fill();
      if (lit) { c.fillStyle = 'rgba(255,220,200,0.7)'; c.beginPath(); c.arc(x + w - 23, sy - 3, 3, 0, Math.PI * 2); c.fill(); }
      if (!seat) {
        this.text('ПУСТО', x + w / 2, y + 40, { align: 'center', size: 12, bold: true, col: '#5a5068', shadow: false });
        if (T && Math.floor(this.t * 1.5) % 2) this.text('вставьте жетон', x + w / 2, y + 62, { align: 'center', size: 9, col: '#6a6080', shadow: false });
        return;
      }
      this.circlePortrait(c, this.cardLook(seat.avatar, seat.gender), x + 8, y + 22, 44, col);
      this.text(this.clip(cleanName(seat.name), w - 66, 11, true), x + 58, y + 25, { size: 11, bold: true, col: C.cream });
      this.text('Ур. Освоения ' + (seat.tl || 0), x + 58, y + 41, { size: 9, col: C.sub });
      const state = !seat.online ? 'НЕТ СВЯЗИ' : i === T.host ? 'ХОЗЯИН' : seat.ready ? 'ГОТОВ' : 'ЖДЁМ';
      this.text(state, x + 8, y + 74, { size: 11, bold: true, col: !seat.online ? '#ff9a8a' : lit ? '#8fe08a' : '#ffd471' });
      if (mine) this.netBars(c, x + w - 28, y + 84);
      if (T.host === n.seat && !mine) this.button(x + 36, sy - 11, w - 72, 22, scr.kick === i ? 'Точно?' : 'Снять', () => scr.kickSeat(i), { size: 10, active: scr.kick === i });
    },

    openHdJoin() {
      const ui = this, g = this.game, n = globalThis.Net98;
      const entry = this.netEntry = this.openLatinEntry({
        title: 'Код стола', max: 4, okLabel: 'Войти', closeOnOk: false,
        hint: 'Код из четырёх знаков: его видит хозяин стола.',
        hints: [['A-Z 0-9', 'Ввод'], ['Ctrl+V', 'Вставить'], ['Backspace', 'Стереть'], ['↑↓←→', 'Сетка'], ['Enter', 'Нажать'], ['Esc', 'Назад']],
        paste: text => { const code = text.toUpperCase().replace(/[^0-9A-Z]/g, ''); return code.length === 4 ? code : ''; },
        pasteMiss: 'В буфере обмена нет кода стола.',
        submit: text => {
          if (text.length !== 4) return { ok: false, text: 'В коде четыре знака' };
          n.send('tableJoin', { code: text, name: g.state.name });
          return { wait: true, text: 'Ищем стол…' };
        }
      });
      entry.onClose = () => { if (ui.netEntry === entry) ui.netEntry = null; };
      return entry;
    },

    openHdTables() {
      const ui = this, g = this.game, n = globalThis.Net98;
      n.tables = null;
      n.send('tableList');
      const scr = this.netEntry = this.push({
        full: true, hd: true, hdTables: true, sel: 0, top: 0, age: 0, note: null,
        tick(dt) {
          if ((this.age += dt) < LIST_EVERY_S) return;
          this.age = 0;
          n.send('tableList');
        },
        sit(t) {
          if (!t) return;
          if (t.sim !== HD.SIM) { this.note = { ok: false, text: 'За этим столом другая версия: ' + (t.ver || '') + '. У вас ' + H.BUILD_VERSION }; ui.sfx('deny'); return; }
          this.note = { wait: true, text: 'Садимся за стол…' };
          n.send('tableJoin', { code: t.code, name: g.state.name });
          ui.sfx('confirm');
        },
        draw(c) {
          const list = n.tables || [], { x, y, w } = SCREEN, h = 330;
          if (this.sel >= list.length) this.sel = Math.max(0, list.length - 1);
          if (this.sel < this.top) this.top = this.sel;
          if (this.sel >= this.top + LIST_ROWS) this.top = this.sel - LIST_ROWS + 1;
          ui.hdCabinet(c, y + h + 10);
          ui.hdCrt(c, x, y, w, h);
          ui.text('ОТКРЫТЫЕ СТОЛЫ', x + 16, y + 12, { size: 14, bold: true, col: CRT.hi, shadow: false });
          ui.text('Обновляется само', x + w - 16, y + 16, { align: 'right', size: 10, col: CRT.mid, shadow: false });
          [['Хозяин', 22], ['Сложность', 220], ['Места', 350], ['Версия', 420]].forEach(([t, dx]) => ui.text(t, x + dx, y + 40, { size: 10, col: CRT.dim, shadow: false }));
          c.fillStyle = CRT.dim; c.fillRect(x + 12, y + 54, w - 24, 1);
          if (!n.tables) ui.text('Ищем столы…', x + w / 2, y + 120, { align: 'center', size: 12, col: CRT.fg, shadow: false });
          else if (!list.length) ui.wrap('Открытых столов сейчас нет. Создайте свой и откройте его для всех: тогда его увидят другие.', w - 80, 11).forEach((l, i) => ui.text(l, x + w / 2, y + 110 + i * 16, { align: 'center', size: 11, col: CRT.fg, shadow: false }));
          list.slice(this.top, this.top + LIST_ROWS).forEach((t, k) => {
            const i = this.top + k, yy = y + 60 + k * 25, on = i === this.sel, same = t.sim === HD.SIM, col = !same ? CRT.dim : on ? CRT.hi : CRT.fg;
            if (on) { c.fillStyle = 'rgba(90,255,122,0.16)'; c.fillRect(x + 12, yy - 3, w - 24, 22); }
            ui.text((on ? '> ' : '  ') + ui.clip(cleanName(t.host), 170, 12, on), x + 14, yy, { size: 12, bold: on, col, shadow: false });
            ui.text(HD.DIFFS[t.diff] ? HD.DIFFS[t.diff].name : t.diff, x + 220, yy, { size: 11, col, shadow: false });
            ui.text(t.seats + '/4', x + 350, yy, { size: 11, bold: true, col, shadow: false });
            ui.text(same ? String(t.ver || '') : 'другая', x + 420, yy, { size: 11, col, shadow: false });
            ui.hit(x + 12, yy - 3, w - 24, 22, () => { if (this.sel === i) this.sit(t); else { this.sel = i; ui.sfx('select'); } });
          });
          if (this.note) ui.text(this.note.text, x + w / 2, y + h - 22, { align: 'center', size: 11, bold: true, col: this.note.wait ? CRT.hi : '#ff9a8a', shadow: false });
          ui.hints([['↑↓', 'Выбор'], ['Enter', 'Сесть'], ['Esc', 'Назад']], W / 2, HGT - 20, { align: 'center' });
        },
        key(k) {
          const list = n.tables || [];
          if (ui.listNav(this, k, list.length)) { this.note = null; return; }
          if (k === 'ok') { this.sit(list[this.sel]); return; }
          if (k === 'back') ui.pop();
        }
      });
      scr.onClose = () => { if (ui.netEntry === scr) ui.netEntry = null; };
      return scr;
    },

    openHdCatch() {
      const ui = this, s = this.netSession;
      return this.push({
        full: true, hd: true, hdRound: true,
        tick(dt) {
          if (ui.netSession !== s || !ui.screens.includes(this)) return;
          s.advance(dt);
          if (s.A || !s.waitLog) ui.netRoute();
        },
        draw(c) {
          c.fillStyle = '#07050c'; c.fillRect(0, 0, W, HGT);
          ui.text('Догоняем партию…', W / 2, HGT / 2 - 10, { align: 'center', size: 16, bold: true, serif: true, col: C.gold });
        },
        key() {}
      });
    },

    drawHdDraftSeats(c, net) {
      const y = 420, h = 36, cw = 136, x0 = 66;
      this.text(Math.ceil(net.draftLeft()) + ' с', 14, y + 8, { size: 18, bold: true, serif: true, col: C.gold });
      net.names.forEach((name, p) => {
        const x = x0 + p * (cw + 8), id = net.takes[p], col = SEAT_COL[p], mine = p === net.seat;
        c.fillStyle = 'rgba(6,8,24,0.9)'; c.fillRect(x, y, cw, h);
        c.fillStyle = col; c.fillRect(x, y, 3, h);
        if (mine) { c.strokeStyle = col; c.strokeRect(x + 0.5, y + 0.5, cw - 1, h - 1); }
        c.fillStyle = '#10142e'; c.fillRect(x + 6, y + 3, 30, 30);
        if (id) G.drawPortrait(c, G.lookOf(id, this.game), x + 6, y + 3, 30);
        else this.text('?', x + 21, y + 9, { align: 'center', size: 14, bold: true, col: C.dim });
        this.text(this.clip(name, cw - 46, 10, true), x + 40, y + 5, { size: 10, bold: true, col });
        this.text(id ? this.clip(H.CHARS[id].name, cw - 46, 9) : 'выбирает…', x + 40, y + 20, { size: 9, col: id ? C.cream : C.sub });
      });
    },

    drawHdAllies(c, s) {
      const A = s.arena, x = 4, w = 116, h = 26;
      let y = 24;
      for (const o of A.heroes) {
        if (o.pl === s.me) continue;
        const col = SEAT_COL[o.pl], off = o.away || this.netOffline(o.pl);
        c.fillStyle = 'rgba(6,8,24,0.86)'; c.fillRect(x, y, w, h);
        c.fillStyle = col; c.fillRect(x, y, 3, h);
        if (s.watch === o.pl) { c.strokeStyle = col; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
        G.drawPortrait(c, G.lookOf(o.key, this.game), x + 4, y + 1, 24);
        if (o.dead) {
          c.fillStyle = 'rgba(20,20,30,0.72)'; c.fillRect(x + 4, y + 1, 24, 24);
          this.text(String(Math.ceil(o.respawn)), x + 16, y + 6, { align: 'center', size: 12, bold: true, col: '#ffffff' });
        }
        this.text(this.clip(s.net.names[o.pl], 62, 9, true), x + 31, y + 2, { size: 9, bold: true, col });
        this.text(String(o.lvl), x + w - 5, y + 2, { align: 'right', size: 9, bold: true, col: C.cream });
        c.fillStyle = '#000000'; c.fillRect(x + 31, y + 15, w - 35, 8);
        c.fillStyle = '#86e39a'; c.fillRect(x + 32, y + 16, Math.round((w - 37) * Math.max(0, o.hp) / o.hpMax), 3);
        c.fillStyle = '#f2b632'; c.fillRect(x + 32, y + 20, Math.round((w - 37) * o.en / o.enMax), 2);
        if (off) {
          c.fillStyle = 'rgba(40,6,6,0.85)'; c.fillRect(x + 31, y + 14, w - 35, 10);
          this.text('нет связи', x + 33 + (w - 37) / 2, y + 14, { align: 'center', size: 8, bold: true, col: '#ff9a8a' });
        }
        this.hit(x, y, w, h, () => s.watchAlly(o.pl));
        y += h + 2;
      }
      s.feed.forEach((f, i) => {
        const text = this.clip(s.net.names[f.p] + ': ' + f.text, 180, 10, true), tw = this.measure(text, 10, true) + 8, fy = y + 2 + i * 15;
        c.fillStyle = 'rgba(6,8,24,0.78)'; c.fillRect(x, fy, tw, 14);
        this.text(text, x + 4, fy + 1, { size: 10, bold: true, col: SEAT_COL[f.p] });
      });
    },

    drawHdMarks(c, s, cx, cy) {
      for (const m of s.marks) {
        const u = m.id != null ? s.arena.byId(m.id) : null, x = (u && !u.dead ? u.x : m.x) - cx, y = (u && !u.dead ? u.y : m.y) - cy, col = SEAT_COL[m.p], r = 15 + 4 * Math.sin(this.t * 9);
        c.globalAlpha = Math.min(1, m.t * 2);
        c.strokeStyle = col; c.lineWidth = 2;
        c.beginPath(); c.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2); c.stroke();
        c.fillStyle = col; c.beginPath(); c.moveTo(x - 6, y - 38); c.lineTo(x + 6, y - 38); c.lineTo(x, y - 28); c.closePath(); c.fill();
        this.text(s.net.names[m.p], x, y - 52, { align: 'center', size: 9, bold: true, col });
        c.globalAlpha = 1;
      }
    },

    drawHdMiniMarks(c, s, x, y, kx, ky) {
      if (Math.sin(this.t * 12) < 0) return;
      for (const m of s.marks) {
        c.strokeStyle = SEAT_COL[m.p];
        c.strokeRect(Math.round(x + m.x * kx) - 3.5, Math.round(y + m.y * ky) - 3.5, 7, 7);
      }
    },

    drawHdPhrases(c, s, y) {
      PHRASES.forEach((text, i) => {
        const bw = 102, x = 6 + i * (bw + 3);
        this.button(x, y, bw, 22, (i + 1) + ' ' + text, () => s.sayPhrase(i), { size: 10 });
      });
    },

    drawHdNet(c, s, A) {
      const n = globalThis.Net98, cx = W / 2;
      const plate = (y, text, sub, col) => {
        const w = Math.max(this.measure(text, 13, true), sub ? this.measure(sub, 10) : 0) + 28, h = sub ? 38 : 22;
        c.fillStyle = 'rgba(6,8,24,0.9)'; c.fillRect(cx - w / 2, y, w, h);
        c.strokeStyle = col || C.brassHi; c.strokeRect(cx - w / 2 + 0.5, y + 0.5, w - 1, h - 1);
        this.text(text, cx, y + 4, { align: 'center', size: 13, bold: true, col: col || C.gold });
        if (sub) this.text(sub, cx, y + 22, { align: 'center', size: 10, col: C.cream });
      };
      const v = this.netPauseView();
      if (v) this.drawHdPause(c, v);
      if (s.catching) plate(84, 'Догоняем партию: волна ' + A.wave, 'ход ' + s.n + ' из ' + s.last);
      if (n.state !== 'online') plate(48, n.state === 'offline' || n.state === 'connecting' ? 'Связь потеряна, пробуем снова' : this.netStateText(), null, '#ff9a8a');
    },

    drawHdPause(c, v) {
      const n = globalThis.Net98, T = n.table, ww = 320, x = (W - ww) / 2, y = 108, cx = W / 2;
      c.fillStyle = 'rgba(2,3,14,0.55)'; c.fillRect(0, 20, W, 372);
      if (v.resume != null) {
        this.text(String(Math.max(1, Math.ceil(v.resume / 1000))), cx, y + 10, { align: 'center', size: 56, bold: true, serif: true, col: C.gold });
        this.text('Партия продолжится', cx, y + 76, { align: 'center', size: 13, bold: true, col: C.cream });
        return;
      }
      const h = T.open ? 148 : 124, canLift = v.mine || v.others <= 0;
      this.win(x, y, ww, h, {});
      this.text('ПАУЗА: ' + v.name, cx, y + 20, { align: 'center', size: 14, bold: true, col: SEAT_COL[v.by] || C.gold });
      this.text('осталось ' + mmss(v.left), cx, y + 40, { align: 'center', size: 11, col: C.cream });
      if (T.open) {
        const taken = T.seats.map((seat, i) => (seat ? i : -1)).filter(i => i >= 0), cw = 70, left = cx - taken.length * cw / 2;
        taken.forEach((i, k) => this.text((i + 1) + 'P: ' + T.seats[i].pauses + '/' + PAUSES_OPEN, left + (k + 0.5) * cw, y + 58, { align: 'center', size: 10, bold: true, col: SEAT_COL[i] }));
      }
      this.text('Можно смотреть лавку и карточку, говорить фразами (V)', cx, y + h - 60, { align: 'center', size: 9, col: C.sub });
      if (canLift) this.button(cx - 80, y + h - 42, 160, 28, 'P: снять паузу', () => this.netPauseToggle(), { size: 12, bold: true, active: true });
      else this.text('Снять можно через ' + Math.ceil(v.others / 1000) + ' с', cx, y + h - 36, { align: 'center', size: 11, col: C.cream });
    },

    openHdCrewResult(sum, o = {}) {
      const ui = this, g = this.game, n = globalThis.Net98, view = !!o.view, rows = sum.crewRows || [], uids = o.uids || [], M = sum.meta, { x, y, w } = SCREEN, h = 262;
      if (!view) { this.sfx(sum.win ? 'win' : 'lose'); this.audio.music('sim'); }
      const atTable = () => !!(n && n.table && n.table.code === o.code);
      const friendState = row => {
        const uid = uids[row.seat], F = n && n.friends;
        if (view || row.me || !uid || !F) return null;
        if (F.list.some(r => r.uid === uid)) return 'friend';
        if (F.out.some(r => r.uid === uid)) return 'sent';
        return F.blocks.some(r => r.uid === uid) ? null : 'add';
      };
      const items = () => {
        if (view) return [{ id: 'close', label: 'Назад' }];
        const list = atTable() ? [{ id: 'again', label: 'Ещё партию' }] : [];
        list.push({ id: 'out', label: 'Выйти' });
        for (const row of rows) if (friendState(row) === 'add') list.push({ id: 'friend', row });
        return list;
      };
      const leave = scr => {
        if (atTable()) n.send('tableLeave');
        ui.screens.splice(ui.screens.indexOf(scr), 1);
        ui.sfx('cancel');
      };
      const act = (scr, it) => {
        if (it.id === 'close') { ui.pop(); return; }
        if (it.id === 'out') { leave(scr); return; }
        if (it.id === 'friend') { n.send('req', { uid: uids[it.row.seat] }); ui.toast('Запрос отправлен: ' + cleanName(it.row.name)); ui.sfx('confirm'); return; }
        if (it.id === 'again') {
          n.send('tableAgain');
          ui.screens.splice(ui.screens.indexOf(scr), 1);
          ui.openHdTable();
        }
      };
      return this.push({
        full: true, hd: true, result: true, crewResult: true, sum, view, sel: 0, age: 0, items,
        tick(dt) { this.age += dt; },
        draw(c) {
          const list = items();
          if (this.sel >= list.length) this.sel = list.length - 1;
          ui.hdCabinet(c, y + h + 10);
          ui.hdCrt(c, x, y, w, h);
          const col = sum.win ? CRT.hi : '#ff8a6a';
          ui.text(sum.win ? 'РУБЕЖ УДЕРЖАН' : 'РУБЕЖ ПАЛ', x + 16, y + 8, { size: 18, bold: true, col, shadow: false });
          ui.hdStars(c, x + w - 66, y + 18, sum.stars || 0, 7);
          const th = (sum.threats || []).map(t => HD.THREATS[t].name).join(', затем ');
          ui.text(ui.clip((sum.win ? 'Все ' + sum.waves + ' волн отбиты' : 'Пал на волне ' + sum.wave + ' из ' + sum.waves) + ' · ' + HD.DIFFS[sum.diff].name + (th ? ' · ' + th : ''), w - 32, 10), x + 16, y + 34, { size: 10, col: CRT.fg, shadow: false });
          const cols = [['Ур.', 176], ['Урон', 212], ['Лечение', 268], ['Добито', 326], ['Золото', 374], ['Гиб.', 424]];
          cols.forEach(([t, dx]) => ui.text(t, x + dx, y + 52, { size: 9, col: CRT.dim, shadow: false }));
          c.fillStyle = CRT.dim; c.fillRect(x + 8, y + 64, w - 16, 1);
          rows.forEach((row, i) => this.drawRow(c, row, y + 68 + i * 47, list));
          if (!view && atTable() && n.table.state === 'lobby') ui.text('Стол снова собирается', W / 2, y + h + 14, { align: 'center', size: 11, bold: true, col: '#ffd471' });
          const my = y + h + 30;
          if (view || !M) ui.text('Запись из истории: награды за неё уже получены', W / 2, my + 6, { align: 'center', size: 11, col: C.sub });
          else ui.hdMetaLine(c, M, my, 52);
          const buttons = list.filter(it => it.id !== 'friend'), bw = 170, bx = W / 2 - (buttons.length * bw + (buttons.length - 1) * 12) / 2;
          buttons.forEach((it, i) => ui.button(bx + i * (bw + 12), HGT - 56, bw, 28, it.label, () => { this.sel = list.indexOf(it); act(this, it); }, { bold: true, active: list[this.sel] === it }));
          ui.hints([['↑↓', 'Выбор'], ['Enter', view ? 'Назад' : 'Нажать'], ['Esc', view ? 'Назад' : 'Выйти']], W / 2, HGT - 20, { align: 'center' });
        },
        drawRow(c, row, ry, list) {
          const col = SEAT_COL[row.seat] || CRT.hi, st = friendState(row), it = list.find(e => e.id === 'friend' && e.row === row);
          if (row.me) { c.fillStyle = 'rgba(90,255,122,0.14)'; c.fillRect(x + 6, ry, w - 12, 44); }
          c.fillStyle = col; c.fillRect(x + 6, ry, 3, 44);
          G.drawPortrait(c, G.lookOf(row.hero, g), x + 12, ry + 4, 36);
          ui.text(ui.clip(row.name, 120, 11, true), x + 52, ry + 7, { size: 11, bold: true, col, shadow: false });
          ui.text(ui.clip(H.CHARS[row.hero].name, 120, 9), x + 52, ry + 24, { size: 9, col: CRT.fg, shadow: false });
          [[row.lvl, 176], [fmt(row.dmg), 212], [fmt(row.heal), 268], [fmt(row.kills), 326], [fmt(row.gold), 374], [row.deaths, 424]].forEach(([v, dx]) => ui.text(String(v), x + dx, ry + 15, { size: 10, bold: !!row.me, col: row.me ? CRT.hi : CRT.fg, shadow: false }));
          if (st === 'add') ui.button(x + w - 88, ry + 11, 80, 22, 'В друзья', () => { this.sel = list.indexOf(it); act(this, it); }, { size: 10, active: list[this.sel] === it });
          else if (st) ui.text(st === 'friend' ? 'друг' : 'запрос ушёл', x + w - 48, ry + 16, { align: 'center', size: 9, col: CRT.mid, shadow: false });
        },
        key(k) {
          const list = items();
          if (ui.listNav(this, k, list.length)) return;
          if (k === 'left' || k === 'right') { this.sel = (this.sel + (k === 'left' ? list.length - 1 : 1)) % list.length; ui.sfx('select'); return; }
          if (k === 'ok') { act(this, list[this.sel]); return; }
          if (k === 'back') { if (view) ui.pop(); else leave(this); }
        }
      });
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
