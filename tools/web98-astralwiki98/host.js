(() => {
  const BASE = 'http://www.astralwiki98.ru';
  const SR98 = '../sr98/';
  const KOVCHEG = '../kovcheg/';
  const SR98_PATHS = ['/download', '/news', '/characters', '/worlds', '/play', '/gallery', '/support'];
  const frame = document.getElementById('aw-frame');
  const note = document.getElementById('aw-host-note');
  const site = window.hsrWikiSite;

  const escHtml = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  window.hsrSite = {
    paintArt(cv) {
      const H = window.Hsr98;
      if (!H || !H.Gfx) return;
      const G = H.Gfx;
      const [kind, id, arg] = cv.dataset.art.split(':');
      const g = cv.getContext('2d');
      if (!g) return;
      g.imageSmoothingEnabled = false;
      const fit = src => g.drawImage(src, 0, 0, cv.width, cv.height);
      if (kind === 'fig') fit(G.figureCanvas(G.lookOf(id, null), Number(arg) || 1));
      else if (kind === 'figf') fit(G.figureCanvas(G.trailLook('f'), Number(arg) || 1));
      else if (kind === 'bust') fit(G.bustCanvas(G.lookOf(id, null), Number(arg) || 64));
      else if (kind === 'path') G.pathIcon(g, id, 0, 0, cv.width, '#f3dc96');
      else if (kind === 'item') G.itemIcon(g, id, 0, 0, cv.width);
      else if (kind === 'foe') fit(G.foeCanvas(id, Number(arg) || 52, 0));
      else if (kind === 'still') H.Cine.still(g, id, cv.width, cv.height, 0, null);
      else if (kind === 'eid') fit(H.Eidolons.pic(id).colorD);
    }
  };

  window.gameManager = {
    catalog: {},
    isInstalled: () => false,
    showInSteam: () => { location.href = SR98 + 'play/index.html'; }
  };

  window.appNotepad = {
    open(name, text) {
      const url = URL.createObjectURL(new Blob(['﻿' + String(text).replace(/\n/g, '\r\n')], { type: 'text/plain;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = String(name || 'AstralWiki.txt').replace(/[\\/:*?"<>|]/g, '_');
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const pathOf = url => {
    const raw = String(url || '').replace(/^[a-z]+:\/{2}/i, '');
    const cut = raw.indexOf('/');
    return { host: (cut < 0 ? raw : raw.slice(0, cut)).toLowerCase(), path: cut < 0 ? '/' : raw.slice(cut) };
  };
  const hashPath = () => {
    const h = location.hash.replace(/^#/, '');
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
    const keep = frame.scrollTop;
    try {
      frame.innerHTML = site.renderSite(url);
      document.title = site.getPageTitle(url);
      site.attachEvents(frame, frame, ie);
    } catch (e) {
      console.error(e);
      frame.innerHTML = '<div class="hwk-root"><p class="aw-host-loading">Страница не загрузилась. Обновите её.</p></div>';
    }
    frame.scrollTop = top ? 0 : keep;
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
    if (host.includes('astralwiki98')) { ie.navigate(frame, a.dataset.url); return; }
    if (host.includes('hoyoverse') || host.includes('starrail98')) {
      const known = SR98_PATHS.some(p => path === p || path.startsWith(p + '?') || path.startsWith(p + '/'));
      location.href = SR98 + (known ? '#' + path : '');
      return;
    }
    if (host.includes('kovcheg98')) { location.href = KOVCHEG + (path !== '/' ? '#' + path : ''); return; }
    showNote(`Сайт ${escHtml(host)} есть только в Internet Explorer внутри Win 98. <a href="../">Win 98 Web Edition</a>`);
  });

  window.addEventListener('hashchange', () => render(BASE + hashPath(), true));

  if (!site) {
    frame.innerHTML = '<div class="hwk-root"><p class="aw-host-loading">Сайт не загрузился. Обновите страницу.</p></div>';
    return;
  }
  render(BASE + hashPath(), true);
})();
