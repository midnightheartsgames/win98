(() => {
  const BASE = 'http://www.kovcheg98.ru';
  const SR98 = '../sr98/';
  const BUILD = JSON.parse(document.getElementById('kovcheg-build').textContent);
  const SAVE_DIR = ['My Computer', 'C:', 'Games', 'StarRail98'];
  const SLOTS = [['1', 'SAVE1.SAV', 'Ячейка 1'], ['2', 'SAVE2.SAV', 'Ячейка 2'], ['3', 'SAVE3.SAV', 'Ячейка 3'], ['auto', 'AUTOSAVE.SAV', 'Автосохранение']];
  const SR98_PATHS = ['/download', '/news', '/characters', '/worlds', '/play', '/gallery', '/support'];
  const frame = document.getElementById('kv-frame');
  const note = document.getElementById('kv-host-note');
  const site = window.kovchegSite;
  const picked = {};

  const escHtml = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  window.webGif = (name, scale = 1, title = '') => {
    const svg = (window.kovchegGifs || {})[name] || '';
    const size = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    const w = (size ? +size[1] : 16) * scale;
    const h = (size ? +size[2] : 16) * scale;
    return `<span class="web-gif" style="width:${w}px;height:${h}px"${title ? ` title="${escHtml(title)}"` : ''}>${svg}</span>`;
  };

  const localSave = name => {
    const slot = SLOTS.find(s => s[1] === name);
    if (!slot) return null;
    try { return localStorage.getItem('hsr98.save.' + slot[0]); } catch (e) { return null; }
  };
  const savedSlots = () => SLOTS.filter(s => localSave(s[1]));

  window.vfs = {
    resolvePath: () => (savedSlots().length ? { children: {} } : null),
    readFile: (dir, name) => (picked[name] != null ? picked[name] : localSave(name)),
    writeFile: () => false
  };

  window.gameManager = {
    catalog: BUILD.catalog,
    isInstalled: id => id === 'hsr98' && savedSlots().length > 0,
    showInSteam: () => { location.href = SR98 + 'play/index.html'; }
  };

  const slotLabel = s => {
    let when = '';
    try {
      const d = JSON.parse(localSave(s[1]) || 'null');
      when = d && d.date ? ', ' + d.date : '';
    } catch (e) { when = ''; }
    return s[2] + ' (' + s[1] + when + ')';
  };

  window.fileDialog = {
    show(opts) {
      const shade = document.createElement('div');
      shade.className = 'kv-dlg-shade';
      const slots = savedSlots();
      let sel = slots.length ? 0 : -1;
      shade.innerHTML = `
        <div class="kv-dlg" role="dialog" aria-modal="true" aria-label="Открыть">
          <div class="kv-dlg-title"><span>Открыть</span><button class="win-btn" data-x="close" aria-label="Закрыть">x</button></div>
          <div class="kv-dlg-body">
            Сохранения Star Rail 98 в этом браузере:
            <div class="kv-dlg-list">${slots.length ? slots.map((s, i) => `<button class="kv-dlg-item${i === sel ? ' is-on' : ''}" data-i="${i}">${escHtml(slotLabel(s))}</button>`).join('') : '<div class="kv-dlg-empty">Сохранений нет. Сыграйте в Star Rail 98 на этом сайте или выберите файл с диска.</div>'}</div>
            <div class="kv-dlg-row">
              <button class="win-btn kv-dlg-disk" data-x="disk">С диска...</button>
              <button class="win-btn" data-x="ok"${slots.length ? '' : ' disabled'}>Открыть</button>
              <button class="win-btn" data-x="close">Отмена</button>
            </div>
            <input type="file" accept=".sav,.SAV,.json,application/json,text/plain" hidden>
          </div>
        </div>`;
      const close = () => shade.remove();
      const done = name => { close(); if (opts && opts.onOk) opts.onOk(SAVE_DIR.slice(), name); };
      const input = shade.querySelector('input[type=file]');
      shade.addEventListener('click', e => {
        const item = e.target.closest('[data-i]');
        if (item) {
          sel = +item.dataset.i;
          shade.querySelectorAll('[data-i]').forEach(el => el.classList.toggle('is-on', +el.dataset.i === sel));
          if (e.detail > 1) done(slots[sel][1]);
          return;
        }
        const act = e.target.closest('[data-x]');
        if (!act && e.target === shade) close();
        if (!act) return;
        if (act.dataset.x === 'close') close();
        if (act.dataset.x === 'ok' && sel >= 0) done(slots[sel][1]);
        if (act.dataset.x === 'disk') input.click();
      });
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const name = file.name.slice(0, 40);
          picked[name] = String(reader.result || '');
          done(name);
        };
        reader.readAsText(file);
      });
      document.addEventListener('keydown', function onKey(e) {
        if (!shade.isConnected) { document.removeEventListener('keydown', onKey); return; }
        if (e.key === 'Escape') close();
      });
      document.body.appendChild(shade);
      const first = shade.querySelector('[data-x="ok"]:not([disabled])') || shade.querySelector('[data-x="disk"]');
      if (first) first.focus();
    }
  };

  const pathOf = url => {
    const raw = String(url || '').replace(/^[a-z]+:\/{2}/i, '');
    const cut = raw.indexOf('/');
    return { host: (cut < 0 ? raw : raw.slice(0, cut)).toLowerCase(), path: cut < 0 ? '/' : raw.slice(cut) };
  };
  const hashPath = () => {
    const h = decodeURI(location.hash.replace(/^#/, ''));
    return h.startsWith('/') ? h : '/';
  };

  const ie = {
    currentUrl: BASE,
    navigate(win, url) {
      const p = pathOf(url).path;
      if (p === hashPath()) { render(BASE + p, true); return; }
      location.hash = p;
    },
    renderPage(win, url) { render(url, false); }
  };

  function render(url, top) {
    ie.currentUrl = url;
    try {
      frame.innerHTML = site.renderSite(url);
      document.title = site.getPageTitle(url);
      site.attachEvents(frame, frame, ie);
    } catch (e) {
      console.error(e);
      frame.innerHTML = '<div class="kv-root"><p class="kv-host-loading">Страница не загрузилась. Обновите её.</p></div>';
    }
    if (top) frame.scrollTop = 0;
  }

  let noteTimer = 0;
  const showNote = html => {
    note.innerHTML = html;
    note.hidden = false;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => { note.hidden = true; }, 6000);
  };

  frame.addEventListener('click', e => {
    const a = e.target.closest('a[data-url]');
    if (!a) return;
    e.preventDefault();
    const { host, path } = pathOf(a.dataset.url);
    if (host.includes('kovcheg98')) { ie.navigate(frame, a.dataset.url); return; }
    if (host.includes('hoyoverse') || host.includes('starrail98')) {
      const known = SR98_PATHS.some(p => path === p || path.startsWith(p + '?') || path.startsWith(p + '/'));
      location.href = SR98 + (known ? '#' + path : '');
      return;
    }
    showNote(`Сайт ${escHtml(host)} есть только в Internet Explorer внутри Win 98. <a href="../">Win 98 Web Edition</a>`);
  });

  window.addEventListener('hashchange', () => render(BASE + hashPath(), true));

  if (!site) {
    frame.innerHTML = '<div class="kv-root"><p class="kv-host-loading">Сайт не загрузился. Обновите страницу.</p></div>';
    return;
  }
  render(BASE + hashPath(), true);
})();
