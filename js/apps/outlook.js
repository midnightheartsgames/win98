class AppOutlook {
  constructor() {
    this.storageKey = 'win98_outlook_v2';
    this.folders = [
      { id: 'inbox', name: 'Входящие', icon: 'oe-inbox' },
      { id: 'outbox', name: 'Исходящие', icon: 'oe-outbox' },
      { id: 'sent', name: 'Отправленные', icon: 'oe-sent' },
      { id: 'deleted', name: 'Удаленные', icon: 'oe-deleted' },
      { id: 'drafts', name: 'Черновики', icon: 'oe-drafts' }
    ];
    this.currentFolder = 'inbox';
    this.win = null;
    this.content = null;
    this.composeCount = 0;
    this.load();
    const first = this.folderMails('inbox')[0];
    this.selectedEmailId = first ? first.id : null;
    this.state.pending.forEach(p => this.arm(p));
    this.watchPurchases();
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('connectivity-changed', () => this.updateOnlineStatus());
    }
    setTimeout(() => this.updateTray(), 0);
  }

  get data() {
    return window.OutlookMail;
  }

  myFrom() {
    return `${this.data.me.name} <${this.data.me.addr}>`;
  }

  load() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(this.storageKey) || 'null');
    } catch (e) {
      saved = null;
    }
    const fresh = !saved || typeof saved !== 'object';
    this.state = Object.assign({ next: 1, mails: [], people: {}, pending: [], book: [], seeded: [] }, fresh ? {} : saved);
    this.seed();
    if (fresh) {
      this.state.book = [
        { name: 'Мишка', addr: 'misha@school98.ru' },
        { name: 'Dima Sokolov', addr: 'dima@geocities.com' },
        { name: 'Компьютерный клуб «Redmond»', addr: 'admin@club98.net' },
        { name: 'Mail98 Support', addr: 'support@mail98.com' }
      ];
    }
    this.save();
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      return false;
    }
    return true;
  }

  seed() {
    if (!this.data) return;
    this.data.seeds.forEach(s => {
      if (this.state.seeded.includes(s.key)) return;
      this.state.seeded.push(s.key);
      this.state.mails.push({
        id: this.state.next++,
        folder: s.folder,
        from: s.from,
        to: s.to,
        subject: s.subject,
        date: s.date,
        ts: this.parseDate(s.date),
        body: s.body,
        read: s.folder !== 'inbox'
      });
    });
  }

  parseDate(text) {
    const m = /(\d+)\.(\d+)\.(\d+)\s+(\d+):(\d+)/.exec(text || '');
    return m ? new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]).getTime() : 0;
  }

  formatDate(ts) {
    const d = new Date(ts);
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  today() {
    return this.formatDate(Date.now()).split(' ')[0];
  }

  esc(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  addrOf(text) {
    const m = /<([^>]+)>/.exec(text || '');
    return (m ? m[1] : String(text || '')).trim().toLowerCase();
  }

  nameOf(text) {
    const m = /^\s*"?([^"<]*?)"?\s*</.exec(text || '');
    return m && m[1] ? m[1] : this.addrOf(text);
  }

  recipients(to) {
    return String(to || '').split(/[;,]/).map(x => x.trim()).filter(Boolean);
  }

  validAddr(addr) {
    return /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(addr);
  }

  folderMails(folder) {
    return this.state.mails.filter(m => m.folder === folder).sort((a, b) => (b.ts || 0) - (a.ts || 0) || b.id - a.id);
  }

  isOnline() {
    return window.isOnline !== false;
  }

  delay() {
    return 5000 + Math.floor(Math.random() * 5001);
  }

  ticket() {
    return String(10000 + Math.floor(Math.random() * 90000));
  }

  normalize(text) {
    return String(text || '').toLowerCase().replace(/ё/g, 'е');
  }

  ownText(body) {
    const cut = String(body || '').split(/^-{3,}\s*(?:Исходное|Пересылаемое) сообщение\s*-*\s*$/m)[0];
    return cut.split('\n').filter(line => !/^\s*\S{0,3}>/.test(line)).join('\n').trim();
  }

  findUrl(text) {
    const m = /(https?:\/\/[^\s<>"']+|www\.[a-z0-9-]+(?:\.[a-z0-9-]+)+[^\s<>"']*|[a-z0-9-]+\.(?:ru|com|net|org|su)(?:\/[^\s<>"']*)?)/i.exec(text || '');
    return m ? m[1].replace(/[.,!?)»]+$/, '') : '';
  }

  fill(text, vars) {
    return String(text).replace(/\{(\w+)\}/g, (m, k) => (Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : m));
  }

  pick(r, count) {
    return Array.isArray(r) ? r[count % r.length] : r;
  }

  personState(addr) {
    if (!this.state.people[addr]) this.state.people[addr] = { n: 0, used: {}, flags: {} };
    return this.state.people[addr];
  }

  flag(addr, name) {
    const st = this.state.people[addr];
    return !!(st && st.flags[name]);
  }

  findPerson(addr) {
    if (!this.data) return null;
    const people = this.data.people;
    const exact = people.find(p => p.addr === addr);
    if (exact) return exact;
    const [user, domain] = addr.split('@');
    if (!this.data.aliases.includes(user)) return null;
    return this.domainDesk(domain);
  }

  domainDesk(domain) {
    const local = this.data.people.filter(p => p.addr.split('@')[1] === domain);
    return local.find(p => this.data.aliases.includes(p.addr.split('@')[0])) || local[0] || null;
  }

  knownDomain(domain) {
    return this.data.domains.includes(domain) || this.data.people.some(p => p.addr.split('@')[1] === domain) || !!this.icqContactByDomain(domain);
  }

  icqContacts() {
    const icq = window.appICQ;
    return icq && Array.isArray(icq.contacts) ? icq.contacts : [];
  }

  icqContact(addr) {
    return this.icqContacts().find(c => String(c.email || '').toLowerCase() === addr) || null;
  }

  icqContactByDomain(domain) {
    return this.icqContacts().find(c => String(c.email || '').toLowerCase().split('@')[1] === domain) || null;
  }

  ruleFits(rule, ctx, text) {
    if (!rule) return false;
    if (rule.need && !ctx.st.flags[rule.need]) return false;
    if (rule.not && ctx.st.flags[rule.not]) return false;
    if (rule.min && ctx.ownLength < rule.min) return false;
    if (rule.url && !ctx.url) return false;
    if (!rule.k) return true;
    const words = new Set(text.split(/[^a-zа-я0-9]+/));
    return rule.k.some(k => (k[0] === '=' ? words.has(k.slice(1)) : text.includes(k)));
  }

  quote(text, prefix) {
    const lines = String(text || '').split('\n').filter(l => l.trim()).slice(0, 8);
    return lines.length ? '\n\n' + lines.map(l => prefix + l).join('\n') : '';
  }

  replySubject(subject) {
    return 'Re: ' + String(subject || '(без темы)').replace(/^(re|fw|fwd)\s*:\s*/i, '');
  }

  answer(addr, mail) {
    if (!this.data) return [];
    if (addr === this.data.me.addr) {
      return [{ delay: this.delay(), mail: { from: this.myFrom(), to: this.myFrom(), subject: mail.subject, body: mail.body } }];
    }
    const person = this.findPerson(addr);
    if (person) return this.personReply(person, mail);
    const contact = this.icqContact(addr);
    if (contact) return [{ delay: this.delay(), mail: this.icqReply(contact, mail) }];
    return [{ delay: this.delay(), mail: this.bounceMail(addr, mail) }];
  }

  isChain(mail, ownN, fullN) {
    const keys = this.data.chainKeys;
    if (!keys.some(k => fullN.includes(k))) return false;
    return /^\s*fw/i.test(mail.subject || '') || keys.some(k => ownN.includes(k));
  }

  personReply(person, mail) {
    const st = this.personState(person.addr);
    const subject = String(mail.subject || '');
    const subjOwn = /^\s*(re|fw|fwd)\s*:/i.test(subject) ? '' : subject;
    const own = this.ownText(mail.body);
    const ownN = this.normalize(subjOwn + '\n' + own);
    const fullN = this.normalize(subject + '\n' + mail.body);
    const ctx = { st, ownLength: own.trim().length, url: this.findUrl(subjOwn + '\n' + own) || this.findUrl(mail.body) };
    const topics = person.topics || [];
    const isEmpty = !own.trim() && !subjOwn.trim();
    const forwarded = String(mail.body || '').trim().length > 0;

    let topic = topics.find(t => this.ruleFits(t, ctx, ownN));
    if (!topic) topic = topics.find(t => t.fw && this.ruleFits(t, ctx, fullN));
    let text = '';
    if (topic) {
      text = this.pick(topic.r, st.used[topic.id] || 0);
    } else if (this.isChain(mail, ownN, fullN)) {
      text = person.chain || this.data.chain;
    } else if (isEmpty && forwarded) {
      topic = topics.find(t => this.ruleFits(t, ctx, fullN));
      if (topic) text = this.pick(topic.r, st.used[topic.id] || 0);
    } else if (isEmpty && !person.bot) {
      text = person.empty || this.data.empty;
    }
    const setFlags = (rule) => {
      (rule.set || []).forEach(f => { st.flags[f] = true; });
      (rule.clear || []).forEach(f => { delete st.flags[f]; });
    };
    if (topic) setFlags(topic);

    const stages = person.stages || [];
    const idx = Math.min(st.n, stages.length - 1);
    let stage = stages[idx];
    const stageFits = s => s && (!s.need || st.flags[s.need]) && (!s.not || !st.flags[s.not]);
    const firstReach = stage && st.n === idx && stageFits(stage);
    if (!stageFits(stage)) stage = stageFits(stages[stages.length - 1]) ? stages[stages.length - 1] : null;
    let usedStage = false;
    if (!text && stage) {
      text = this.pick(stage.r, Math.max(0, st.n - idx));
      usedStage = true;
    } else if (text && firstReach && stage.ps) {
      text += '\n\nP.S. ' + stage.ps;
    }
    if (!text) text = person.empty || this.data.empty;

    const vars = { ticket: this.ticket(), url: ctx.url || '', date: this.today(), subj: subject || '(без темы)' };
    const subjectOut = this.fill((topic && topic.s) || (usedStage && stage.s) || this.replySubject(subject), vars);
    const prefix = person.bot ? '' : (person.qp === undefined ? '> ' : person.qp);
    const body = this.fill(text, vars) + '\n\n-- \n' + person.sig + (prefix ? this.quote(own, prefix) : '');
    const delay = this.delay();
    const reply = { from: `${person.name} <${person.addr}>`, to: this.myFrom(), subject: subjectOut, body };
    const out = [{ delay, mail: reply }];

    const extras = (rule) => {
      if (rule.act) reply.act = { kind: rule.act, text: own };
      if (rule.later) out.push({ delay: delay + rule.later.after * 1000, mail: this.laterMail(person, rule.later, vars) });
    };
    if (topic) {
      st.used[topic.id] = (st.used[topic.id] || 0) + 1;
      extras(topic);
    }
    if (firstReach) {
      setFlags(stages[idx]);
      extras(stages[idx]);
    }
    st.n++;
    this.save();
    return out;
  }

  laterMail(person, later, vars) {
    if (later.event) {
      const ev = this.data.events[later.event];
      return { from: ev.from, to: this.myFrom(), subject: this.fill(ev.s, vars), body: this.fill(ev.r, vars) };
    }
    return {
      from: later.from || `${person.name} <${person.addr}>`,
      to: this.myFrom(),
      subject: this.fill(later.s, vars),
      body: this.fill(later.r, vars)
    };
  }

  icqReply(contact, mail) {
    const own = this.ownText(mail.body);
    const ownN = this.normalize(own);
    const fullN = this.normalize(mail.subject + '\n' + mail.body);
    const lines = Array.isArray(contact.replies) && contact.replies.length ? contact.replies : ['Получил, спасибо!'];
    let text = lines[Math.floor(Math.random() * lines.length)];
    if (this.isChain(mail, ownN, fullN)) text = this.data.chain;
    else if (!own.trim() && !String(mail.body || '').trim()) text = this.data.empty;
    const uin = contact.uin ? `\n\nP.S. В аське быстрее: мой UIN ${contact.uin}.` : '';
    return {
      from: `${contact.name || contact.nick} <${contact.email}>`,
      to: this.myFrom(),
      subject: this.replySubject(mail.subject),
      body: `Привет!\n\n${text}${uin}\n\n-- \n${contact.nick || contact.name}${this.quote(own, '> ')}`
    };
  }

  bounceMail(addr, mail) {
    const b = this.data.bounce;
    const [user, domain] = addr.split('@');
    const subj = mail.subject || '(без темы)';
    if (!this.knownDomain(domain)) {
      const vars = { addr, domain, subj };
      return { from: b.from, to: this.myFrom(), subject: this.fill(b.host.s, vars), body: this.fill(b.host.r, vars) };
    }
    const local = this.domainDesk(domain);
    const vars = { addr, domain, subj, user, suggest: local ? local.addr : '' };
    vars.hint = local ? this.fill(b.hint, vars) : '';
    return { from: b.from, to: this.myFrom(), subject: this.fill(b.user.s, vars), body: this.fill(b.user.r, vars) };
  }

  schedule(mail, delay) {
    const p = { due: Date.now() + delay, mail };
    this.state.pending.push(p);
    this.arm(p);
  }

  arm(p) {
    setTimeout(() => this.arrive(p), Math.max(1200, p.due - Date.now()));
  }

  arrive(p) {
    const i = this.state.pending.indexOf(p);
    if (i < 0) return;
    this.state.pending.splice(i, 1);
    const now = Date.now();
    const mail = Object.assign({}, p.mail, { id: this.state.next++, folder: 'inbox', read: false, fresh: true, ts: now, date: this.formatDate(now) });
    if (mail.act) {
      this.runAction(mail.act);
      delete mail.act;
    }
    this.state.mails.push(mail);
    this.save();
    this.notify(mail);
  }

  runAction(act) {
    if (act.kind === 'anekdot' && window.appIE && typeof window.appIE.publishAnekdot === 'function') {
      window.appIE.publishAnekdot(act.text, 'Из почты');
    }
  }

  dispatch(mail) {
    this.recipients(mail.to).forEach(r => {
      this.answer(this.addrOf(r), mail).forEach(item => this.schedule(item.mail, item.delay));
    });
  }

  rememberContacts(to) {
    this.recipients(to).forEach(r => {
      const addr = this.addrOf(r);
      if (addr === this.data.me.addr || this.state.book.some(c => c.addr === addr)) return;
      const person = this.findPerson(addr);
      if (!person && !this.icqContact(addr)) return;
      const name = /</.test(r) ? this.nameOf(r) : (person && person.addr === addr ? person.name : addr);
      this.state.book.push({ name, addr });
    });
  }

  send(draft) {
    const list = this.recipients(draft.to);
    if (!list.length) {
      this.alert('У сообщения должен быть хотя бы один получатель. Укажите адрес в поле «Кому».');
      return false;
    }
    const bad = list.map(r => this.addrOf(r)).find(a => !this.validAddr(a));
    if (bad) {
      this.alert(`Адрес «${this.esc(bad)}» указан неверно. Адрес электронной почты выглядит так: имя@сервер.ru`);
      return false;
    }
    if (draft.id) this.state.mails = this.state.mails.filter(m => m.id !== draft.id);
    const online = this.isOnline();
    const now = Date.now();
    const mail = {
      id: this.state.next++,
      folder: online ? 'sent' : 'outbox',
      read: true,
      from: this.myFrom(),
      to: list.join('; '),
      subject: draft.subject || '(без темы)',
      date: this.formatDate(now),
      ts: now,
      body: draft.body || ''
    };
    this.state.mails.push(mail);
    this.rememberContacts(mail.to);
    if (online) this.dispatch(mail);
    this.save();
    this.refresh();
    return mail;
  }

  saveDraft(draft) {
    if (draft.id) this.state.mails = this.state.mails.filter(m => m.id !== draft.id);
    const now = Date.now();
    const mail = {
      id: this.state.next++,
      folder: 'drafts',
      read: true,
      from: this.myFrom(),
      to: draft.to || '',
      subject: draft.subject || '(без темы)',
      date: this.formatDate(now),
      ts: now,
      body: draft.body || ''
    };
    this.state.mails.push(mail);
    this.save();
    this.refresh();
    return mail;
  }

  flushOutbox() {
    const out = this.state.mails.filter(m => m.folder === 'outbox');
    const now = Date.now();
    out.forEach(m => {
      m.folder = 'sent';
      m.ts = now;
      m.date = this.formatDate(now);
      this.dispatch(m);
    });
    this.save();
    this.refresh();
    return out.length;
  }

  sendReceive() {
    if (!this.isOnline()) {
      window.winManager.openDialog({
        title: 'Доставка почты',
        icon: 'warning',
        message: 'Нет подключения к Интернету. Неотправленные письма остаются в папке «Исходящие».<br>Подключитесь к провайдеру и повторите доставку.',
        buttons: [
          { text: 'Подключиться...', primary: true, onClick: () => { if (window.appDialUp) window.appDialUp.open(); } },
          { text: 'Cancel' }
        ]
      });
      return;
    }
    const sent = this.flushOutbox();
    const waiting = this.state.pending.length;
    const lines = ['Соединение с сервером pop3.mail98.com... готово.'];
    lines.push(sent ? `Отправлено сообщений: ${sent}.` : 'Неотправленных сообщений нет.');
    lines.push(waiting ? 'Новых сообщений пока нет. Ответы придут, когда их напишут.' : 'Новых сообщений нет.');
    window.winManager.openDialog({ title: 'Доставка почты', icon: 'outlook', message: lines.join('<br>') });
  }

  alert(message) {
    if (window.winManager) window.winManager.openDialog({ title: 'Outlook Express', icon: 'warning', message });
  }

  steamReceipt(id) {
    const gm = window.gameManager;
    const game = gm && gm.catalog[id];
    if (!game || !game.steam || !this.data) return;
    const ev = this.data.events.steam;
    const vars = { game: game.title, price: game.priceDisplay || (game.price ? `$${game.price}` : 'бесплатно'), ticket: this.ticket(), date: this.today() };
    this.schedule({ from: ev.from, to: this.myFrom(), subject: this.fill(ev.s, vars), body: this.fill(ev.r, vars) }, this.delay());
    this.save();
  }

  watchPurchases() {
    const gm = window.gameManager;
    if (!gm || typeof gm.addListener !== 'function' || !gm.state) return;
    const known = new Set(gm.state.purchased || []);
    gm.addListener(state => {
      (state.purchased || []).forEach(id => {
        if (known.has(id)) return;
        known.add(id);
        this.steamReceipt(id);
      });
    });
  }

  freshCount() {
    return this.state.mails.filter(m => m.folder === 'inbox' && !m.read && m.fresh).length;
  }

  notify(mail) {
    if (window.soundSys && typeof window.soundSys.playNewMail === 'function') window.soundSys.playNewMail();
    this.updateTray();
    if (this.isOpen()) {
      this.refresh();
      const status = this.content.querySelector('.outlook-status');
      if (status) status.textContent = `Получено новое сообщение: ${this.nameOf(mail.from)} — «${mail.subject}»`;
    }
  }

  updateTray() {
    if (typeof document === 'undefined' || !document.getElementById) return;
    const count = this.freshCount();
    let el = document.getElementById('tray-mail-icon');
    if (!count) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      const tray = document.getElementById('taskbar-tray');
      if (!tray) return;
      el = document.createElement('div');
      el.id = 'tray-mail-icon';
      el.className = 'tray-icon';
      el.innerHTML = Icons['mail-unread'];
      el.addEventListener('click', () => this.openInbox());
      tray.insertBefore(el, tray.firstChild);
    }
    el.title = `Новых сообщений: ${count}`;
  }

  openInbox() {
    this.currentFolder = 'inbox';
    const unread = this.folderMails('inbox').find(m => !m.read);
    if (unread) this.selectedEmailId = unread.id;
    if (this.isOpen()) {
      window.winManager.bringToTop('app_outlook');
      this.refresh();
    } else {
      this.open();
    }
  }

  isOpen() {
    return !!(this.content && window.winManager && window.winManager.windows.has('app_outlook'));
  }

  selected() {
    return this.state.mails.find(e => e.id === this.selectedEmailId && e.folder === this.currentFolder) || null;
  }

  open() {
    const winId = 'app_outlook';
    if (window.winManager && window.winManager.windows.has(winId)) {
      window.winManager.bringToTop(winId);
      return;
    }

    const content = document.createElement('div');
    content.className = 'outlook-window';
    content.tabIndex = 0;
    content.innerHTML = `
      <div class="win-menubar outlook-menubar">
        <div class="win-menu-item">Файл
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option opt-mail-new">Создать сообщение <span>Ctrl+N</span></div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option opt-mail-print">Печать... <span>Ctrl+P</span></div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option opt-mail-exit">Выход</div>
          </div>
        </div>
        <div class="win-menu-item">Правка
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option btn-mail-delete">Удалить <span>Del</span></div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option opt-mail-markread">Пометить как прочитанное <span>Ctrl+Q</span></div>
            <div class="win-dropdown-option opt-mail-markall">Пометить все как прочитанные</div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option opt-mail-empty">Очистить папку «Удаленные»</div>
          </div>
        </div>
        <div class="win-menu-item">Сервис
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option btn-mail-send-recv">Доставить почту <span>Ctrl+M</span></div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option btn-mail-book">Адресная книга... <span>Ctrl+Shift+B</span></div>
          </div>
        </div>
        <div class="win-menu-item">Сообщение
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option opt-mail-new">Создать сообщение</div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option btn-mail-reply">Ответить отправителю <span>Ctrl+R</span></div>
            <div class="win-dropdown-option btn-mail-replyall">Ответить всем <span>Ctrl+Shift+R</span></div>
            <div class="win-dropdown-option btn-mail-forward">Переслать <span>Ctrl+F</span></div>
          </div>
        </div>
        <div class="win-menu-item">Справка
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option opt-mail-about">О программе Outlook Express</div>
          </div>
        </div>
      </div>

      <div class="explorer-toolbar outlook-toolbar">
        <button class="explorer-tool-btn opt-mail-new">${Icons['tb-newmail']}<span>Создать</span></button>
        <div class="explorer-tool-sep"></div>
        <button class="explorer-tool-btn btn-mail-reply">${Icons['tb-reply']}<span>Ответить</span></button>
        <button class="explorer-tool-btn btn-mail-replyall">${Icons['tb-replyall']}<span>Ответить всем</span></button>
        <button class="explorer-tool-btn btn-mail-forward">${Icons['tb-forwardmail']}<span>Переслать</span></button>
        <div class="explorer-tool-sep"></div>
        <button class="explorer-tool-btn opt-mail-print">${Icons['tb-print']}<span>Печать</span></button>
        <button class="explorer-tool-btn btn-mail-delete">${Icons['tb-delete']}<span>Удалить</span></button>
        <div class="explorer-tool-sep"></div>
        <button class="explorer-tool-btn btn-mail-send-recv">${Icons['tb-sendrecv']}<span>Доставить почту</span></button>
        <button class="explorer-tool-btn btn-mail-book">${Icons['tb-addressbook']}<span>Адреса</span></button>
      </div>

      <div class="outlook-folder-bar"><span class="outlook-folder-bar-icon icon-small"></span><span class="outlook-folder-bar-title"></span></div>

      <div class="outlook-main-view">
        <div class="outlook-folders-pane">
          <div class="outlook-pane-title">Папки</div>
          <div class="outlook-folder-tree"></div>
        </div>
        <div class="outlook-right-split">
          <div class="outlook-messages-list">
            <div class="outlook-list-head"><span></span><span class="outlook-col-who">От</span><span>Тема</span><span class="outlook-col-date">Получено</span></div>
            <div class="outlook-msg-rows"></div>
          </div>
          <div class="outlook-preview-pane">
            <div class="outlook-preview-headers"></div>
            <div class="outlook-preview-body"></div>
          </div>
        </div>
      </div>
      <div class="win-statusbar"><div class="win-status-pane grow outlook-status"></div><div class="win-status-pane outlook-status-online"></div></div>
    `;

    const win = window.winManager.createWindow({
      id: winId,
      title: 'Outlook Express',
      icon: 'outlook',
      width: 680,
      height: 480,
      resizable: true,
      content
    });

    this.win = win;
    this.content = content;
    this.refresh();
    this.initEvents(content);
  }

  initEvents(content) {
    const on = (selector, fn) => content.querySelectorAll(selector).forEach(node => node.addEventListener('click', fn));
    on('.opt-mail-new', () => this.openCompose());
    on('.btn-mail-send-recv', () => this.sendReceive());
    on('.btn-mail-book', () => this.openAddressBook());
    on('.btn-mail-delete', () => this.deleteSelected());
    on('.opt-mail-markread', () => {
      const email = this.selected();
      if (email) email.read = true;
      this.save();
      this.refresh();
    });
    on('.opt-mail-markall', () => {
      this.folderMails(this.currentFolder).forEach(m => { m.read = true; });
      this.save();
      this.refresh();
    });
    on('.opt-mail-empty', () => this.emptyDeleted());
    on('.btn-mail-reply', () => this.reply(false));
    on('.btn-mail-replyall', () => this.reply(true));
    on('.btn-mail-forward', () => this.forward());
    on('.opt-mail-print', () => {
      const email = this.selected();
      if (!email) return;
      const dlg = window.winManager.openDialog({ title: 'Outlook Express', icon: 'outlook', message: `Печать сообщения «${this.esc(email.subject)}»...`, buttons: [{ text: 'Cancel' }] });
      setTimeout(() => { if (window.winManager.windows.has(dlg.id)) window.winManager.closeWindow(dlg.id); }, 1600);
    });
    on('.opt-mail-about', () => {
      window.winManager.openDialog({
        title: 'О программе Outlook Express',
        icon: 'outlook',
        message: 'Microslop Outlook Express 5.0 (Win 98)<br>Клиент электронной почты и новостей Usenet.<br><br>Учётная запись: alexey@mail98.com'
      });
    });
    on('.opt-mail-exit', () => window.winManager.closeWindow('app_outlook'));

    content.querySelector('.outlook-folder-tree').addEventListener('click', (e) => {
      const item = e.target.closest('[data-folder]');
      if (!item) return;
      this.currentFolder = item.dataset.folder;
      const first = this.folderMails(this.currentFolder)[0];
      this.selectedEmailId = first ? first.id : null;
      this.refresh();
    });

    const rows = content.querySelector('.outlook-msg-rows');
    rows.addEventListener('click', (e) => {
      const row = e.target.closest('.outlook-msg');
      if (row) this.select(Number(row.dataset.id));
    });
    rows.addEventListener('dblclick', (e) => {
      const row = e.target.closest('.outlook-msg');
      if (!row) return;
      const mail = this.state.mails.find(m => m.id === Number(row.dataset.id));
      if (!mail) return;
      if (mail.folder === 'drafts' || mail.folder === 'outbox') this.openCompose({ to: mail.to, subject: mail.subject, body: mail.body, id: mail.id });
      else if (mail.folder === 'inbox') this.reply(false);
    });

    content.querySelector('.outlook-preview-pane').addEventListener('click', (e) => {
      const link = e.target.closest('.outlook-link');
      if (!link) return;
      e.preventDefault();
      if (link.dataset.url && window.appIE) window.appIE.open(link.dataset.url);
      if (link.dataset.mail) this.openCompose({ to: link.dataset.mail });
    });

    content.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea')) return;
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const run = (fn) => { e.preventDefault(); fn(); };
      if (key === 'delete') run(() => this.deleteSelected());
      else if (key === 'arrowdown' || key === 'arrowup') run(() => this.moveSelection(key === 'arrowdown' ? 1 : -1));
      else if (ctrl && key === 'n') run(() => this.openCompose());
      else if (ctrl && e.shiftKey && key === 'r') run(() => this.reply(true));
      else if (ctrl && key === 'r') run(() => this.reply(false));
      else if (ctrl && key === 'f') run(() => this.forward());
      else if (ctrl && key === 'm') run(() => this.sendReceive());
      else if (ctrl && key === 'q') run(() => { const m = this.selected(); if (m) m.read = true; this.save(); this.refresh(); });
      else if (ctrl && e.shiftKey && key === 'b') run(() => this.openAddressBook());
    });
  }

  select(id) {
    this.selectedEmailId = id;
    const email = this.state.mails.find(e => e.id === id);
    if (email && !email.read) {
      email.read = true;
      this.save();
      this.updateTray();
    }
    this.refresh();
  }

  moveSelection(step) {
    const list = this.folderMails(this.currentFolder);
    if (!list.length) return;
    const i = list.findIndex(m => m.id === this.selectedEmailId);
    const next = list[Math.max(0, Math.min(list.length - 1, i + step))];
    if (next) this.select(next.id);
  }

  deleteSelected() {
    const email = this.selected();
    if (!email) return;
    const list = this.folderMails(this.currentFolder);
    const i = list.indexOf(email);
    const after = () => {
      const rest = this.folderMails(this.currentFolder);
      const next = rest[Math.min(i, rest.length - 1)];
      this.selectedEmailId = next ? next.id : null;
      this.save();
      this.refresh();
      this.updateTray();
    };
    if (email.folder === 'deleted') {
      window.winManager.openDialog({
        title: 'Outlook Express',
        icon: 'warning',
        message: `Удалить сообщение «${this.esc(email.subject)}» без возможности восстановления?`,
        buttons: [
          { text: 'Yes', primary: true, onClick: () => { this.state.mails = this.state.mails.filter(m => m !== email); after(); } },
          { text: 'No' }
        ]
      });
      return;
    }
    email.folder = 'deleted';
    email.read = true;
    after();
  }

  emptyDeleted() {
    const count = this.state.mails.filter(m => m.folder === 'deleted').length;
    if (!count) return;
    window.winManager.openDialog({
      title: 'Outlook Express',
      icon: 'warning',
      message: `Удалить все сообщения (${count}) из папки «Удаленные» без возможности восстановления?`,
      buttons: [
        {
          text: 'Yes',
          primary: true,
          onClick: () => {
            this.state.mails = this.state.mails.filter(m => m.folder !== 'deleted');
            if (this.currentFolder === 'deleted') this.selectedEmailId = null;
            this.save();
            this.refresh();
          }
        },
        { text: 'No' }
      ]
    });
  }

  quoteBlock(email, title, quoted) {
    const head = `\n\n----- ${title} -----\nОт: ${email.from}\nОтправлено: ${email.date}\nКому: ${email.to}\nТема: ${email.subject}\n\n`;
    const body = quoted ? email.body.split('\n').map(l => '> ' + l).join('\n') : email.body;
    return head + body;
  }

  reply(all) {
    const email = this.selected();
    if (!email) return;
    const mine = this.addrOf(email.from) === this.data.me.addr;
    let to = mine ? email.to : email.from;
    if (all) {
      const others = this.recipients(email.to).filter(r => this.addrOf(r) !== this.data.me.addr && this.addrOf(r).includes('@'));
      to = [to].concat(others.filter(r => this.addrOf(r) !== this.addrOf(to))).join('; ');
    }
    this.openCompose({ to, subject: this.replySubject(email.subject), body: this.quoteBlock(email, 'Исходное сообщение', true) });
  }

  forward() {
    const email = this.selected();
    if (!email) return;
    const subject = 'Fw: ' + String(email.subject || '').replace(/^(re|fw|fwd)\s*:\s*/i, '');
    this.openCompose({ to: '', subject, body: this.quoteBlock(email, 'Пересылаемое сообщение', false) });
  }

  composeTo(href) {
    const raw = String(href || '').replace(/^mailto:/i, '');
    const [addr, query] = raw.split('?');
    const params = {};
    (query || '').split('&').forEach(pair => {
      const [k, v] = pair.split('=');
      if (!k) return;
      try {
        params[k.toLowerCase()] = decodeURIComponent((v || '').replace(/\+/g, ' '));
      } catch (e) {
        params[k.toLowerCase()] = v || '';
      }
    });
    let to = addr;
    try {
      to = decodeURIComponent(addr);
    } catch (e) {
      to = addr;
    }
    this.openCompose({ to, subject: params.subject || '', body: params.body || '' });
  }

  refresh() {
    if (!this.isOpen()) return;
    this.renderFolders();
    this.renderMessages();
    this.renderPreview();
    this.updateOnlineStatus();
  }

  updateOnlineStatus() {
    if (!this.isOpen()) return;
    const pane = this.content.querySelector('.outlook-status-online');
    if (pane) pane.textContent = this.isOnline() ? 'В сети' : 'Автономно';
  }

  renderFolders() {
    const content = this.content;
    const list = content.querySelector('.outlook-folder-tree');
    const rows = [
      `<div class="outlook-folder-item root"><span class="outlook-folder-icon icon-small">${Icons['outlook']}</span><span class="outlook-folder-name">Outlook Express</span></div>`,
      `<div class="outlook-folder-item level1"><span class="outlook-folder-icon icon-small">${Icons['folder']}</span><span class="outlook-folder-name">Локальные папки</span></div>`
    ];
    this.folders.forEach(f => {
      const mails = this.state.mails.filter(e => e.folder === f.id);
      const count = f.id === 'outbox' || f.id === 'drafts' ? mails.length : mails.filter(e => !e.read).length;
      const label = count ? `<b>${f.name}</b> <span class="outlook-unread">(${count})</span>` : f.name;
      rows.push(`<div class="outlook-folder-item level2${this.currentFolder === f.id ? ' selected' : ''}" data-folder="${f.id}"><span class="outlook-folder-icon icon-small">${Icons[f.icon]}</span><span class="outlook-folder-name">${label}</span></div>`);
    });
    list.innerHTML = rows.join('');
    const folder = this.folders.find(f => f.id === this.currentFolder);
    content.querySelector('.outlook-folder-bar-title').textContent = folder ? folder.name : '';
    content.querySelector('.outlook-folder-bar-icon').innerHTML = folder ? Icons[folder.icon] : '';
    if (this.win && this.win.titleElement) this.win.titleElement.textContent = `${folder ? folder.name : ''} - Outlook Express`;
    const total = this.state.mails.filter(e => e.folder === this.currentFolder).length;
    const unread = this.state.mails.filter(e => e.folder === this.currentFolder && !e.read).length;
    content.querySelector('.outlook-status').textContent = `Сообщений: ${total}, непрочитанных: ${unread}`;
  }

  outgoingFolder() {
    return ['sent', 'outbox', 'drafts'].includes(this.currentFolder);
  }

  renderMessages() {
    const content = this.content;
    const outgoing = this.outgoingFolder();
    content.querySelector('.outlook-col-who').textContent = outgoing ? 'Кому' : 'От';
    content.querySelector('.outlook-col-date').textContent = outgoing ? 'Отправлено' : 'Получено';
    const box = content.querySelector('.outlook-msg-rows');
    const folderEmails = this.folderMails(this.currentFolder);
    if (!folderEmails.length) {
      box.innerHTML = '<div class="outlook-empty">В этом представлении нет элементов.</div>';
      return;
    }
    box.innerHTML = folderEmails.map(email => {
      const who = outgoing ? this.recipients(email.to).map(r => this.nameOf(r)).join('; ') || '(получатель не указан)' : this.nameOf(email.from);
      return `
      <div class="outlook-msg${email.id === this.selectedEmailId ? ' selected' : ''}${email.read ? '' : ' unread'}" data-id="${email.id}">
        <span class="outlook-msg-icon icon-small">${Icons[email.read ? 'mail-read' : 'mail-unread']}</span>
        <span>${this.esc(who)}</span>
        <span>${this.esc(email.subject)}</span>
        <span>${this.esc(email.date)}</span>
      </div>`;
    }).join('');
  }

  linkify(text) {
    return this.esc(text).replace(/(https?:\/\/[^\s<>"&]*[^\s<>"&.,!?;:)»])|([a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi, (m, url, mail) => (
      url ? `<a class="outlook-link" data-url="${url}">${url}</a>` : `<a class="outlook-link" data-mail="${mail}">${mail}</a>`
    ));
  }

  renderPreview() {
    const content = this.content;
    const headerEl = content.querySelector('.outlook-preview-headers');
    const bodyEl = content.querySelector('.outlook-preview-body');
    const email = this.selected();
    if (!email) {
      headerEl.innerHTML = '';
      bodyEl.innerHTML = '';
      return;
    }
    headerEl.innerHTML = `
      <div><b>От:</b> ${this.linkify(email.from)}</div>
      <div><b>Кому:</b> ${this.linkify(email.to || '')}</div>
      <div><b>Тема:</b> ${this.esc(email.subject)}</div>
    `;
    bodyEl.innerHTML = this.linkify(email.body);
    bodyEl.scrollTop = 0;
  }

  openCompose(draft = {}) {
    const winId = window.winManager.windows.has('app_outlook_compose') ? `app_outlook_compose_${++this.composeCount}` : 'app_outlook_compose';
    const content = document.createElement('div');
    content.className = 'outlook-compose';
    content.innerHTML = `
      <div class="explorer-toolbar outlook-toolbar outlook-compose-toolbar">
        <button class="explorer-tool-btn oc-send">${Icons['tb-sendmail']}<span>Отправить</span></button>
        <div class="explorer-tool-sep"></div>
        <button class="explorer-tool-btn oc-save">${Icons['tb-savemail']}<span>Сохранить</span></button>
        <button class="explorer-tool-btn oc-book">${Icons['tb-addressbook']}<span>Адреса</span></button>
      </div>
      <div class="outlook-compose-fields">
        <div class="outlook-compose-row"><span class="outlook-compose-label">От:</span><span class="outlook-compose-from">${this.esc(this.myFrom())}</span></div>
        <div class="outlook-compose-row"><button class="win-btn outlook-compose-to-btn oc-pick" title="Выбрать получателей в адресной книге">Кому:</button><input type="text" class="oc-to" value="${this.esc(draft.to || '')}"></div>
        <div class="outlook-compose-row"><span class="outlook-compose-label">Тема:</span><input type="text" class="oc-subj" value="${this.esc(draft.subject || '')}"></div>
      </div>
      <textarea class="outlook-compose-body oc-body" spellcheck="false"></textarea>
      <div class="win-statusbar"><div class="win-status-pane grow oc-status">${this.isOnline() ? 'Письмо будет отправлено сразу.' : 'Автономная работа: письмо попадёт в папку «Исходящие».'}</div></div>
    `;
    content.querySelector('.oc-body').value = draft.body || '';

    const title = () => `${content.querySelector('.oc-subj').value.trim() || 'Новое сообщение'}`;
    const win = window.winManager.createWindow({
      id: winId,
      title: title(),
      icon: 'outlook',
      width: 500,
      height: 400,
      resizable: true,
      content
    });

    let draftId = draft.id || null;
    const read = () => ({
      id: draftId,
      to: content.querySelector('.oc-to').value.trim(),
      subject: content.querySelector('.oc-subj').value.trim(),
      body: content.querySelector('.oc-body').value
    });
    const sendNow = () => {
      const mail = this.send(read());
      if (!mail) return;
      window.winManager.closeWindow(winId);
      if (mail.folder === 'outbox') {
        window.winManager.openDialog({
          title: 'Отправка сообщения',
          icon: 'outlook',
          message: 'Компьютер работает автономно. Сообщение помещено в папку «Исходящие» и будет отправлено при следующей доставке почты.'
        });
      }
    };
    content.querySelector('.oc-send').addEventListener('click', sendNow);
    content.querySelector('.oc-save').addEventListener('click', () => {
      const saved = this.saveDraft(read());
      draftId = saved.id;
      content.querySelector('.oc-status').textContent = `Сообщение сохранено в папке «Черновики» (${saved.date}).`;
    });
    const pick = () => this.openAddressBook(content.querySelector('.oc-to'));
    content.querySelector('.oc-book').addEventListener('click', pick);
    content.querySelector('.oc-pick').addEventListener('click', pick);
    content.querySelector('.oc-subj').addEventListener('input', () => {
      if (win.titleElement) win.titleElement.textContent = title();
    });
    content.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.key === 'Enter') || (e.altKey && e.key.toLowerCase() === 's')) {
        e.preventDefault();
        sendNow();
      }
    });
    const focusField = draft.to ? (draft.subject ? '.oc-body' : '.oc-subj') : '.oc-to';
    setTimeout(() => {
      const field = content.querySelector(focusField);
      if (!field) return;
      field.focus();
      if (field.setSelectionRange) field.setSelectionRange(0, 0);
    }, 50);
    return win;
  }

  openAddressBook(target = null) {
    const winId = 'app_outlook_book';
    if (window.winManager.windows.has(winId)) window.winManager.closeWindow(winId);
    const content = document.createElement('div');
    content.className = 'outlook-book';
    content.innerHTML = `
      <div class="explorer-toolbar outlook-toolbar">
        <button class="explorer-tool-btn ob-write">${Icons['tb-newmail']}<span>Написать</span></button>
        <button class="explorer-tool-btn ob-delete">${Icons['tb-delete']}<span>Удалить</span></button>
      </div>
      <div class="outlook-book-list">
        <div class="outlook-book-head"><span>Имя</span><span>Адрес эл. почты</span></div>
        <div class="outlook-book-rows"></div>
      </div>
      <div class="outlook-book-add">
        <span>Новый контакт:</span>
        <input type="text" class="ob-name" placeholder="Имя">
        <input type="text" class="ob-addr" placeholder="адрес@сервер.ru">
        <button class="win-btn ob-add">Добавить</button>
      </div>
      ${target ? '<div class="outlook-book-buttons"><button class="win-btn ob-to is-default">Кому: -&gt;</button><button class="win-btn ob-close">Закрыть</button></div>' : ''}
    `;
    window.winManager.createWindow({
      id: winId,
      title: target ? 'Выбор получателей' : 'Адресная книга',
      icon: 'outlook',
      width: 440,
      height: 340,
      resizable: true,
      content
    });

    let chosen = null;
    const rows = content.querySelector('.outlook-book-rows');
    const render = () => {
      const book = this.state.book.slice().sort((a, b) => a.name.localeCompare(b.name, 'ru'));
      rows.innerHTML = book.length ? book.map(c => `
        <div class="outlook-book-row${c.addr === chosen ? ' selected' : ''}" data-addr="${this.esc(c.addr)}">
          <span><span class="outlook-book-icon icon-small">${Icons['oe-contact']}</span>${this.esc(c.name)}</span>
          <span>${this.esc(c.addr)}</span>
        </div>`).join('') : '<div class="outlook-empty">Адресная книга пуста.</div>';
    };
    const entry = () => this.state.book.find(c => c.addr === chosen);
    const formatted = (c) => (c.name && c.name !== c.addr ? `${c.name} <${c.addr}>` : c.addr);
    const addToTarget = (c) => {
      if (!target || !c) return;
      const current = target.value.trim();
      if (this.recipients(current).some(r => this.addrOf(r) === c.addr)) return;
      target.value = current ? `${current.replace(/[;,]\s*$/, '')}; ${formatted(c)}` : formatted(c);
    };
    const write = (c) => {
      if (!c) return;
      if (target) addToTarget(c);
      else this.openCompose({ to: formatted(c) });
    };
    render();
    rows.addEventListener('click', (e) => {
      const row = e.target.closest('.outlook-book-row');
      if (!row) return;
      chosen = row.dataset.addr;
      render();
    });
    rows.addEventListener('dblclick', (e) => {
      const row = e.target.closest('.outlook-book-row');
      if (!row) return;
      chosen = row.dataset.addr;
      write(entry());
    });
    content.querySelector('.ob-write').addEventListener('click', () => this.openCompose(entry() ? { to: formatted(entry()) } : {}));
    content.querySelector('.ob-delete').addEventListener('click', () => {
      if (!chosen) return;
      this.state.book = this.state.book.filter(c => c.addr !== chosen);
      chosen = null;
      this.save();
      render();
    });
    content.querySelector('.ob-add').addEventListener('click', () => {
      const name = content.querySelector('.ob-name').value.trim();
      const addr = content.querySelector('.ob-addr').value.trim().toLowerCase();
      if (!this.validAddr(addr)) {
        this.alert('Введите адрес электронной почты в виде имя@сервер.ru');
        return;
      }
      const existing = this.state.book.find(c => c.addr === addr);
      if (existing) existing.name = name || existing.name;
      else this.state.book.push({ name: name || addr, addr });
      chosen = addr;
      content.querySelector('.ob-name').value = '';
      content.querySelector('.ob-addr').value = '';
      this.save();
      render();
    });
    if (target) {
      content.querySelector('.ob-to').addEventListener('click', () => addToTarget(entry()));
      content.querySelector('.ob-close').addEventListener('click', () => window.winManager.closeWindow(winId));
    }
  }
}

window.appOutlook = new AppOutlook();
