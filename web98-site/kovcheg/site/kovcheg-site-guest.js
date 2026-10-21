(() => {
  const site = window.kovchegSite;
  if (!site) return;
  const proto = Object.getPrototypeOf(site);
  const baseAttach = proto.attachEvents;
  const GUESTBOOK_KEY = 'win98_kovcheg_guestbook_v1';

  Object.assign(proto, {
    guestbookKey: GUESTBOOK_KEY,

    guestStorageOk() {
      try {
        if (typeof localStorage === 'undefined') return false;
        localStorage.setItem(GUESTBOOK_KEY + '_probe', '1');
        localStorage.removeItem(GUESTBOOK_KEY + '_probe');
        return true;
      } catch (e) {
        return false;
      }
    },

    readGuestbook() {
      try {
        const data = JSON.parse(this.read(GUESTBOOK_KEY) || 'null');
        return data && Array.isArray(data.entries) ? data.entries : [];
      } catch (e) {
        return [];
      }
    },

    addGuestbookEntry(name, city, text, date, mail) {
      const entry = { name: String(name || '').trim().slice(0, 24), city: String(city || '').trim().slice(0, 24), text: String(text || '').trim().slice(0, 500), date, mail: !!mail };
      if (!entry.name || !entry.text) return null;
      const entries = [entry, ...this.readGuestbook()].slice(0, 50);
      return this.write(GUESTBOOK_KEY, JSON.stringify({ entries })) ? entry : null;
    },

    mailBocman(entry) {
      const outlook = window.appOutlook;
      if (!outlook || typeof outlook.answer !== 'function' || typeof outlook.schedule !== 'function') return false;
      const out = outlook.answer(this.data().mail, { subject: 'Запись в гостевой «Ковчега»', body: entry.text });
      out.forEach(item => outlook.schedule(item.mail, item.delay));
      if (outlook.save) outlook.save();
      return out.length > 0;
    },

    guestStamp(d) {
      const p = n => String(n).padStart(2, '0');
      return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
    },

    renderGuestEntry(e, n) {
      return `
        <tr>
          <td class="kv-log-no" valign="top">${n}</td>
          <td class="kv-log-date" valign="top">${this.esc(e.date)}</td>
          <td valign="top">
            <b>${this.esc(e.name)}</b>${e.city ? `, ${this.esc(e.city)}` : ''}<br>
            ${this.esc(e.text)}
            ${e.reply ? `<p class="kv-gb-reply"><b>Боцман:</b> ${this.esc(e.reply)}</p>` : ''}
            ${e.mail ? '<p class="kv-gb-reply kv-small">Боцман ответил письмом.</p>' : ''}
          </td>
        </tr>`;
    },

    renderGuestbook(error = '') {
      const d = this.data();
      const own = this.readGuestbook();
      const all = own.concat(d.guestbook);
      const ok = this.guestStorageOk();
      return `
        <p class="kv-crumbs">${this.link('', 'Причал')} &gt; Гостевая книга</p>
        <h1 class="kv-h1">Судовой журнал</h1>
        <p>Здесь спорят о тир-листе и задают вопросы. Боцман читает каждую запись. Длинный спор с числами лучше прислать на <a href="mailto:${d.mail}">${d.mail}</a>.</p>
        ${ok ? '' : `<p class="kv-warn">${this.gif('warn')} Браузер не даёт сайту сохранять записи. Журнал можно читать, но новая запись не сохранится.</p>`}
        <table class="kv-gb-form" cellspacing="0" cellpadding="4">
          <tr><td class="kv-team-label"><label for="kv-gb-name">Имя</label></td><td><input id="kv-gb-name" maxlength="24" size="24"></td></tr>
          <tr><td class="kv-team-label"><label for="kv-gb-city">Город</label></td><td><input id="kv-gb-city" maxlength="24" size="24"></td></tr>
          <tr><td class="kv-team-label"><label for="kv-gb-text">Запись</label></td><td><textarea id="kv-gb-text" rows="4" cols="56" maxlength="500"></textarea></td></tr>
          <tr><td></td><td><label><input type="checkbox" id="kv-gb-mail" checked> Ответ Боцмана прислать мне на почту</label></td></tr>
          <tr><td></td><td><button class="win-btn kv-btn" data-kv-sign="1"${ok ? '' : ' disabled'}>Записать в журнал</button> <span class="kv-gb-error" id="kv-gb-error">${this.esc(error)}</span></td></tr>
        </table>
        <h2 class="kv-h2">Записи: ${all.length}</h2>
        <table class="kv-log kv-gb" width="100%" cellspacing="0" cellpadding="4">
          ${all.map((e, i) => this.renderGuestEntry(e, all.length - i)).join('')}
        </table>`;
    },

    signGuestbook(win, container, ie) {
      const val = sel => { const el = container.querySelector(sel); return el ? el.value : ''; };
      const box = container.querySelector('#kv-gb-mail');
      const mail = !!(box && box.checked);
      const entry = this.addGuestbookEntry(val('#kv-gb-name'), val('#kv-gb-city'), val('#kv-gb-text'), this.guestStamp(new Date()), mail);
      if (!entry) {
        const err = container.querySelector('#kv-gb-error');
        if (err) err.textContent = String(val('#kv-gb-name')).trim() && String(val('#kv-gb-text')).trim() ? 'Запись не сохранилась.' : 'Напишите имя и запись.';
        if (window.soundSys) window.soundSys.playError();
        return null;
      }
      if (mail && !this.mailBocman(entry)) {
        entry.mail = false;
        this.write(GUESTBOOK_KEY, JSON.stringify({ entries: [entry, ...this.readGuestbook().slice(1)] }));
      }
      if (window.soundSys) window.soundSys.playDing();
      if (ie && win && ie.renderPage) ie.renderPage(win, ie.currentUrl || this.url('/guestbook'));
      return entry;
    },

    attachEvents(win, container, ieInstance) {
      baseAttach.call(this, win, container, ieInstance);
      const ie = ieInstance || window.appIE;
      container.querySelectorAll('[data-kv-sign]').forEach(el => el.addEventListener('click', e => {
        if (e && e.preventDefault) e.preventDefault();
        this.signGuestbook(win, container, ie);
      }));
    }
  });
})();
