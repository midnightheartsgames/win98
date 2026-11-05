(() => {
  const BASE = 'http://www.poligon3d.ru';
  const frame = document.getElementById('pg-frame');
  const note = document.getElementById('pg-host-note');
  const site = window.poligonSite;

  const escHtml = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  window.webGif = (name, scale = 1, title = '') => {
    const svg = (window.webGifs || {})[name] || '';
    const size = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    const w = (size ? +size[1] : 16) * scale;
    const h = (size ? +size[2] : 16) * scale;
    return `<span class="web-gif" style="width:${w}px;height:${h}px"${title ? ` title="${escHtml(title)}"` : ''}>${svg}</span>`;
  };

  const pathOf = url => {
    const raw = String(url || '').replace(/^[a-z]+:\/{2}/i, '');
    const cut = raw.search(/[/?#]/);
    const host = (cut < 0 ? raw : raw.slice(0, cut)).toLowerCase();
    const rest = cut < 0 ? '/' : raw.slice(cut);
    return { host, path: rest.startsWith('/') ? rest : '/' + rest };
  };
  const hashPath = () => {
    const h = location.hash.replace(/^#/, '');
    return h.startsWith('/') ? h : '/';
  };

  const go = url => {
    const p = pathOf(url).path;
    if (p === hashPath()) { render(BASE + p, true); return; }
    location.hash = p;
  };

  const titleOf = url => {
    const id = site.parseUrl(url);
    const clip = /\/clip\//i.test(url) && site.clips().find(c => c.id === id);
    return clip ? `ПОЛИГОН - ${clip.artist} — ${clip.title}` : 'ПОЛИГОН - Музыкальные клипы, собранные заново в 3D';
  };

  function render(url, top) {
    try {
      frame.innerHTML = site.renderSite(url);
      document.title = titleOf(url);
      site.attachEvents(frame, frame);
    } catch (e) {
      console.error(e);
      frame.innerHTML = '<div class="pg-root"><p class="pg-host-loading">Страница не загрузилась. Обновите её.</p></div>';
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
    if (host.includes('poligon3d')) { go(a.dataset.url); return; }
    if (host.includes('youvid')) { location.href = '../youvid/' + (path !== '/' ? '#' + path : ''); return; }
    if (host.includes('hoyoverse')) { location.href = '../sr98/'; return; }
    showNote(`Сайт ${escHtml(host)} есть только в Internet Explorer внутри Win 98. <a href="../">Win 98 Web Edition</a>`);
  });

  window.addEventListener('hashchange', () => render(BASE + hashPath(), true));

  if (!site) {
    frame.innerHTML = '<div class="pg-root"><p class="pg-host-loading">Сайт не загрузился. Обновите страницу.</p></div>';
    return;
  }
  render(BASE + hashPath(), true);
})();
