class LucasArtsSite {
  constructor() {
    this.baseUrl = 'http://www.lucasarts.com';
    this.data = window.lucasartsData;
    this.storageKeys = {
      poll: 'win98_lucasarts_poll_v2',
      replies: 'win98_lucasarts_replies_v2',
      letters: 'win98_lucasarts_letters_v2',
      hints: 'win98_lucasarts_hints_v2'
    };
    this.activeShot = {};
    this.keyMap = {};
    this.verbs = ['Дать', 'Открыть', 'Закрыть', 'Взять', 'Смотреть', 'Говорить', 'Использовать', 'Толкать', 'Тянуть'];
    this.labObjects = {
      tester: 'Тестер Ларри',
      pc: 'Компьютер с билдом',
      coffee: 'Кофеварка',
      board: 'Доска с ошибками',
      shelf: 'Шкаф с реквизитом',
      poster: 'Плакат',
      door: 'Дверь на улицу'
    };
    this.labItems = {
      chicken: 'Резиновая курица с блоком',
      disk: 'Дискета SAMMAX22',
      mug: 'Пустая кружка',
      java: 'Кружка кофе',
      colander: 'Дуршлаг'
    };
    this.resetLab();
  }

  esc(val) {
    return String(val == null ? '' : val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  gif(name, scale = 1) {
    return window.webGif ? window.webGif(name, scale) : '';
  }

  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  game(id) {
    return this.data.games.find(g => g.id === id) || null;
  }

  gmId(g) {
    return g.demo || g.id;
  }

  catalogEntry(g) {
    const gm = window.gameManager;
    return gm && gm.catalog ? gm.catalog[this.gmId(g)] || null : null;
  }

  priceOf(g) {
    const entry = this.catalogEntry(g);
    return entry && entry.priceDisplay ? entry.priceDisplay : g.price;
  }

  exeOf(g) {
    const entry = this.catalogEntry(g);
    return entry && entry.targetExe ? entry.targetExe : g.exe;
  }

  shotSrc(g, n) {
    return g.demo ? `content/igromania/demos/${g.demo}-${n}.jpg` : `content/steam/${g.id}-${n}.jpg`;
  }

  status(g) {
    const gm = window.gameManager;
    const id = this.gmId(g);
    if (gm && gm.isInstalled && gm.isInstalled(id)) return 'installed';
    if (g.demo) return 'cd';
    if (gm && gm.ownsOnSteam && gm.ownsOnSteam(id)) return 'owned';
    return 'store';
  }

  parseRoute(url) {
    const clean = String(url || this.baseUrl).trim();
    const afterHost = clean.replace(/^https?:\/{2}[^/]+/i, '');
    const hashless = afterHost.split('#')[0];
    const qIdx = hashless.indexOf('?');
    const pathPart = (qIdx >= 0 ? hashless.slice(0, qIdx) : hashless) || '/';
    const queryPart = qIdx >= 0 ? hashless.slice(qIdx + 1) : '';
    const params = {};
    queryPart.split('&').forEach(pair => {
      const [k, v] = pair.split('=');
      if (!k) return;
      try {
        params[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '));
      } catch (e) {
        params[k] = v || '';
      }
    });
    const path = pathPart.toLowerCase().replace(/\/+$/, '') || '/';
    return { path, params };
  }

  logoSvg(w = 40) {
    const h = Math.round(w * 1.1);
    return `<svg width="${w}" height="${h}" viewBox="0 0 40 44" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="40" height="44" fill="#000000"/>
      <rect x="19" y="1" width="2" height="5" fill="#806000"/><rect x="5" y="9" width="5" height="2" fill="#806000"/><rect x="30" y="9" width="5" height="2" fill="#806000"/>
      <rect x="2" y="20" width="5" height="2" fill="#806000"/><rect x="33" y="20" width="5" height="2" fill="#806000"/>
      <rect x="17" y="8" width="6" height="6" fill="#e0a800"/>
      <rect x="18" y="15" width="4" height="12" fill="#e0a800"/>
      <rect x="10" y="7" width="3" height="3" fill="#e0a800"/><rect x="12" y="10" width="3" height="3" fill="#e0a800"/><rect x="14" y="13" width="4" height="3" fill="#e0a800"/>
      <rect x="27" y="7" width="3" height="3" fill="#e0a800"/><rect x="25" y="10" width="3" height="3" fill="#e0a800"/><rect x="22" y="13" width="4" height="3" fill="#e0a800"/>
      <rect x="15" y="27" width="4" height="4" fill="#e0a800"/><rect x="21" y="27" width="4" height="4" fill="#e0a800"/>
      <rect x="13" y="31" width="4" height="5" fill="#e0a800"/><rect x="23" y="31" width="4" height="5" fill="#e0a800"/>
      <rect x="4" y="38" width="32" height="2" fill="#e0a800"/>
    </svg>`;
  }

  header(section) {
    const items = [
      ['home', '/', 'Главная'],
      ['games', '/games', 'Игры'],
      ['news', '/news', 'The Adventurer'],
      ['hints', '/hints', 'Линия подсказок'],
      ['scumm', '/scumm', 'SCUMM-лаборатория'],
      ['letters', '/letters', 'Письма']
    ];
    return `
      <table class="la-top" cellspacing="0" cellpadding="0">
        <tr>
          <td class="la-logo-cell"><a data-url="${this.baseUrl}" title="LucasArts">${this.logoSvg(40)}</a></td>
          <td><a class="la-wordmark" data-url="${this.baseUrl}">LUCASARTS</a><span class="la-wordmark-sub">Entertainment Company</span></td>
          <td class="la-search-cell">
            <input type="text" id="la-search-input" value="" title="Поиск по сайту">
            <button class="la-btn" id="la-search-btn">Найти</button>
          </td>
        </tr>
      </table>
      <div class="la-nav">${items.map(([key, path, label]) => section === key
        ? `<b>${label}</b>`
        : `<a data-url="${this.baseUrl}${path === '/' ? '' : path}">${label}</a>`).join('|')}</div>
    `;
  }

  footer() {
    const ring = window.retroSites && window.retroSites.renderWebRing ? window.retroSites.renderWebRing(this.baseUrl) : '';
    return `
      <div class="la-footer">
        <p>&copy; 1998 LucasArts Entertainment Company LLC. P.O. Box 10307, San Rafael, CA 94912.</p>
        <p>Пишите нам: <a class="web-mail-link" href="mailto:adventurer@lucasarts.com">${this.gif('mail')} adventurer@lucasarts.com</a></p>
        <p>Sam &amp; Max &copy; Steve Purcell. Star Wars &copy; Lucasfilm Ltd. Сайт сделан для Internet Explorer 4.0 и экрана 800x600.</p>
        ${ring}
      </div>
    `;
  }

  streetScene() {
    const r = (x, y, w, h, fill, extra) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
    const t = (x, y, size, fill, text, extra) => `<text x="${x}" y="${y}" text-anchor="middle" fill="${fill}" font-family="Arial, sans-serif" font-weight="bold" font-size="${size}"${extra ? ' ' + extra : ''}>${text}</text>`;
    const hit = (x, y, w, h) => r(x, y, w, h, 'transparent', 'class="la-hit"');
    const p = [];
    p.push(r(0, 0, 320, 34, '#000040'), r(0, 34, 320, 22, '#100858'), r(0, 56, 320, 30, '#28146c'));
    [[12, 6], [33, 19], [58, 9], [77, 27], [214, 8], [236, 24], [262, 5], [300, 31], [181, 4], [118, 6], [140, 3], [8, 40], [310, 48]].forEach(([x, y]) => p.push(r(x, y, 1, 1, '#fcfcfc')));
    p.push('<circle cx="291" cy="15" r="7" fill="#f8e8a8"/><circle cx="295" cy="12" r="6" fill="#000040"/>');
    [[0, 66, 22, 52], [20, 58, 16, 60], [250, 52, 18, 66], [268, 62, 26, 56], [292, 48, 14, 70], [306, 60, 14, 58]].forEach(([x, y, w, h]) => p.push(r(x, y, w, h, '#180c30')));
    [[254, 58], [258, 66], [272, 70], [296, 54], [296, 62], [310, 66], [24, 64], [6, 72]].forEach(([x, y]) => p.push(r(x, y, 2, 2, '#c8a830')));
    p.push(r(40, 30, 210, 88, '#6c2818'));
    for (let y = 34; y < 118; y += 4) p.push(r(40, y, 210, 1, '#4c1810'));
    for (let y = 30, row = 0; y < 118; y += 4, row++) {
      for (let x = 40 + (row % 2) * 6; x < 250; x += 12) p.push(r(x, y, 1, 4, '#4c1810'));
    }
    p.push(r(36, 26, 218, 5, '#2c0c04'), r(36, 25, 218, 1, '#8c4020'));
    p.push(r(92, 8, 106, 17, '#000000'), r(92, 8, 106, 1, '#e0a800'), r(92, 24, 106, 1, '#e0a800'), r(92, 8, 1, 17, '#e0a800'), r(197, 8, 1, 17, '#e0a800'));
    p.push(r(118, 25, 2, 2, '#2c0c04'), r(170, 25, 2, 2, '#2c0c04'));
    p.push(t(145, 20, 11, '#e0a800', 'LUCASARTS', 'letter-spacing="2"'));
    [[52, '#f0c858'], [84, '#1c1c3c'], [116, '#f0c858'], [148, '#1c1c3c'], [180, '#1c1c3c'], [212, '#f0c858']].forEach(([x, glass]) => {
      p.push(r(x - 1, 37, 22, 17, '#2c0c04'), r(x, 38, 20, 15, glass), r(x + 9, 38, 2, 15, '#2c0c04'), r(x, 45, 20, 1, '#2c0c04'));
    });
    p.push(r(213, 41, 5, 4, '#3c2810'), r(214, 45, 3, 7, '#3c2810'), r(222, 47, 7, 3, '#5c5c5c'), r(221, 50, 9, 2, '#3c3c3c'));
    p.push(r(53, 46, 5, 6, '#7c5c28'), r(60, 49, 6, 3, '#e0e0e0'));
    p.push(r(0, 118, 320, 12, '#8c8c8c'));
    for (let x = 0; x < 320; x += 24) p.push(r(x, 118, 1, 12, '#6c6c6c'));
    p.push(r(0, 130, 320, 2, '#c0c0c0'), r(0, 132, 320, 18, '#303038'));
    for (let x = 4; x < 320; x += 28) p.push(r(x, 140, 14, 2, '#e0c000'));
    p.push('<g class="la-hot" data-la-go="/news" data-la-say="Смотреть на газетный киоск">',
      r(6, 72, 32, 4, '#c00000'), r(10, 72, 4, 4, '#f0f0f0'), r(18, 72, 4, 4, '#f0f0f0'), r(26, 72, 4, 4, '#f0f0f0'), r(34, 72, 4, 4, '#f0f0f0'),
      r(4, 76, 36, 3, '#103818'), r(6, 79, 32, 39, '#206030'), r(9, 82, 26, 24, '#103818'),
      r(10, 83, 6, 8, '#e0a800'), r(17, 83, 6, 8, '#f0f0f0'), r(24, 83, 6, 8, '#c00000'), r(10, 93, 6, 8, '#5858f8'), r(17, 93, 6, 8, '#e0a800'), r(24, 93, 6, 8, '#58c858'),
      r(11, 84, 4, 1, '#000000'), r(18, 84, 4, 1, '#c00000'), r(25, 84, 4, 1, '#f0f0f0'),
      r(6, 108, 32, 10, '#103818'), t(22, 115, 6, '#f0f0f0', 'NEWS'),
      hit(4, 72, 36, 46), '</g>');
    p.push('<g class="la-hot" data-la-go="/games" data-la-say="Смотреть на витрину с играми">',
      r(48, 58, 74, 9, '#000000'), t(85, 65, 7, '#e0a800', 'GAMES', 'letter-spacing="1"'),
      r(48, 68, 74, 46, '#1c1008'), r(51, 71, 68, 40, '#283860'), r(51, 104, 68, 7, '#4c3818'),
      r(56, 80, 16, 24, '#185818'), r(58, 82, 12, 9, '#a8c8f8'), r(58, 93, 12, 2, '#f0f0f0'), r(58, 97, 8, 1, '#f0f0f0'),
      r(77, 76, 16, 28, '#a01810'), r(79, 78, 12, 12, '#f0c858'), r(79, 93, 12, 2, '#f0f0f0'), r(79, 97, 9, 1, '#f0f0f0'),
      r(98, 82, 16, 22, '#101010'), r(100, 85, 12, 2, '#e0a800'), r(104, 89, 4, 8, '#e0a800'), r(100, 99, 12, 1, '#e0a800'),
      r(52, 72, 1, 30, '#4c6098'), r(53, 72, 1, 18, '#4c6098'),
      hit(48, 58, 74, 56), '</g>');
    p.push('<g class="la-hot" data-la-go="/scumm" data-la-say="Открыть дверь в SCUMM-лабораторию">',
      r(130, 60, 30, 8, '#000000'), t(145, 66, 5.5, '#55ff55', 'SCUMM LAB'),
      r(131, 69, 28, 49, '#2c0c04'), r(133, 71, 24, 47, '#5c3418'), r(136, 74, 18, 12, '#f0c858'), r(144, 74, 2, 12, '#5c3418'),
      r(136, 90, 18, 10, '#4c2810'), r(136, 103, 18, 10, '#4c2810'), r(152, 96, 2, 3, '#e0a800'),
      hit(130, 60, 30, 58), '</g>');
    p.push('<g class="la-hot" data-la-go="/letters" data-la-say="Открыть почтовый ящик">',
      r(170, 98, 18, 3, '#102c6c'), r(169, 101, 20, 13, '#1c3c8c'), r(172, 104, 14, 2, '#0c1c4c'), r(171, 114, 3, 4, '#102c6c'), r(184, 114, 3, 4, '#102c6c'),
      t(179, 112, 4.5, '#f0f0f0', 'MAIL'),
      hit(166, 96, 26, 22), '</g>');
    p.push('<g class="la-hot" data-la-go="/hints" data-la-say="Позвонить на линию подсказок">',
      r(203, 60, 32, 6, '#1c3c8c'), t(219, 65, 5, '#f0f0f0', 'HINT LINE'),
      r(203, 66, 32, 52, '#8c8c8c'), r(206, 69, 26, 46, '#5c7090'), r(218, 69, 2, 46, '#8c8c8c'),
      r(222, 80, 7, 11, '#202020'), r(223, 82, 5, 4, '#9cb080'), r(223, 87, 5, 3, '#c0c0c0'), r(220, 79, 2, 9, '#101010'),
      r(203, 115, 32, 3, '#5c5c5c'),
      hit(203, 60, 32, 58), '</g>');
    p.push(r(246, 64, 2, 66, '#202020'), r(242, 62, 10, 3, '#202020'), r(243, 65, 8, 3, '#fff0a0'), r(240, 68, 14, 1, '#fff0a0'));
    p.push('<g class="la-hot" data-la-go="/games?series=s1" data-la-say="Смотреть на Де Сото Вольной полиции">',
      r(264, 119, 28, 2, '#f0f0f0'), r(262, 121, 32, 7, '#f0f0f0'), r(265, 122, 11, 5, '#5c7090'), r(279, 122, 12, 5, '#5c7090'), r(277, 121, 1, 7, '#f0f0f0'),
      r(252, 128, 64, 9, '#101010'), r(250, 130, 4, 5, '#101010'), r(254, 130, 26, 4, '#f0f0f0'), r(282, 130, 26, 4, '#f0f0f0'), r(313, 129, 3, 3, '#f0d040'), r(250, 130, 2, 2, '#c00000'),
      r(274, 116, 6, 3, '#e01010'), r(276, 115, 2, 1, '#ff8080'),
      '<circle cx="265" cy="138" r="5" fill="#101010"/><circle cx="265" cy="138" r="2" fill="#8c8c8c"/><circle cx="302" cy="138" r="5" fill="#101010"/><circle cx="302" cy="138" r="2" fill="#8c8c8c"/>',
      hit(250, 114, 68, 30), '</g>');
    return `<svg class="la-scene" viewBox="0 0 320 150" width="640" height="300" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${p.join('')}</svg>`;
  }

  renderHome() {
    const nav = [
      ['/games', 'Игры', 'Смотреть на витрину с играми'],
      ['/news', 'The Adventurer', 'Смотреть на газетный киоск'],
      ['/hints', 'Линия подсказок', 'Позвонить на линию подсказок'],
      ['/scumm', 'SCUMM-лаборатория', 'Открыть дверь в SCUMM-лабораторию'],
      ['/letters', 'Письма', 'Открыть почтовый ящик'],
      ['/search', 'Поиск', 'Искать на сайте']
    ];
    const fresh = ['sammax202', 'sammax201', 'quest', 'kotor98'].map(id => this.game(id)).filter(Boolean);
    return `
      <div class="la-page">
        <div class="la-scene-wrap">${this.streetScene()}</div>
        <div class="la-panel">
          <div class="la-sentence" id="la-sentence">Идти к LucasArts</div>
          <table class="la-panel-table" cellspacing="0">
            <tr>
              <td class="la-verb-cell">
                <table class="la-verbs" cellspacing="0">
                  ${[0, 3].map(start => `<tr>${nav.slice(start, start + 3).map(([path, label, say]) => `
                    <td><a class="la-verb" data-url="${this.baseUrl}${path}" data-la-say="${say}">${label}</a></td>`).join('')}</tr>`).join('')}
                </table>
              </td>
              <td class="la-inv-cell">
                <div class="la-inv-head">Новые игры:</div>
                ${fresh.map(g => `<a class="la-inv" data-url="${this.baseUrl}/game?id=${g.id}" data-la-say="Смотреть на ${this.esc(g.title)}">${this.esc(g.title)}</a>`).join('')}
              </td>
            </tr>
          </table>
        </div>
        <div class="la-textlinks">
          [ ${nav.map(([path, label]) => `<a data-url="${this.baseUrl}${path}">${label}</a>`).join(' | ')} ]
        </div>
        <h2 class="la-h2">Что нового на сайте</h2>
        <table class="la-whatsnew" cellspacing="0">
          ${this.data.whatsNew.map(([date, text, path, isNew]) => `
            <tr>
              <td class="la-date">${date}</td>
              <td>${isNew ? '<span class="la-new">NEW!</span> ' : ''}<a data-url="${this.baseUrl}${path}">${this.esc(text)}</a></td>
            </tr>`).join('')}
        </table>
      </div>
    `;
  }

  buyCell(g) {
    const st = this.status(g);
    if (st === 'installed') {
      return `<span class="la-state la-state-installed">Установлено</span>
        <button class="la-btn la-btn-buy" data-launch-id="${this.gmId(g)}">Запустить</button>`;
    }
    if (st === 'cd') {
      return `<span class="la-state la-state-owned">Демоверсия</span>
        <button class="la-btn la-btn-buy" data-cd-id="${g.demo}">На диске «Игромании»</button>`;
    }
    if (st === 'owned') {
      return `<span class="la-state la-state-owned">Куплено в Steam</span>
        <button class="la-btn" data-steam-id="${g.id}">Скачать в Steam</button>`;
    }
    return `<span class="la-state la-state-price">${this.esc(this.priceOf(g))}</span>
      <button class="la-btn la-btn-buy" data-steam-id="${g.id}">Купить в Steam</button>`;
  }

  renderGames(seriesFilter) {
    const series = this.data.series.filter(s => !seriesFilter || s.id === seriesFilter);
    const list = series.length ? series : this.data.series;
    return `
      <div class="la-page">
        ${this.header('games')}
        <h1 class="la-h1">Игры</h1>
        <p class="la-lede">Эпизоды Sam & Max с 101 по 201 продаются и скачиваются через Steam. Демоверсии Sam & Max 202, LucasQuest 98 и KOTOR 98 записаны на компакт-диск журнала «Игромания», их ставят с диска D:. Если игра уже установлена, её можно запустить прямо отсюда.</p>
        ${seriesFilter ? `<p class="la-lede"><a data-url="${this.baseUrl}/games">Показать весь каталог</a></p>` : ''}
        ${list.map(s => `
          <table class="la-cat" cellspacing="0">
            <tr class="la-cat-series"><td colspan="3">${this.esc(s.title)} <small>${this.esc(s.note)}</small></td></tr>
            ${this.data.games.filter(g => g.series === s.id).map(g => `
              <tr class="la-cat-row">
                <td class="la-cat-thumb"><img src="${this.shotSrc(g, 1)}" alt="${this.esc(g.title)}" data-url="${this.baseUrl}/game?id=${g.id}"></td>
                <td>
                  <div class="la-cat-title"><a data-url="${this.baseUrl}/game?id=${g.id}">${this.esc(g.title)}</a></div>
                  <div class="la-cat-meta">${this.esc(g.ru)} &middot; ${this.esc(this.exeOf(g))}</div>
                  ${this.esc(g.tagline)}
                </td>
                <td class="la-cat-buy">${this.buyCell(g)}</td>
              </tr>`).join('')}
          </table>`).join('')}
      </div>
    `;
  }

  barcode(seed) {
    let n = 7;
    for (const ch of seed) n = (n * 31 + ch.charCodeAt(0)) % 100003;
    const bars = [];
    let digits = '';
    for (let i = 0; i < 34; i++) {
      n = (n * 1103 + 12345) % 100003;
      bars.push(`<span style="width:${1 + (n % 3)}px;margin-right:${1 + ((n >> 3) % 2)}px"></span>`);
      if (i < 12) digits += String(n % 10);
    }
    return `<div class="la-barcode">${bars.join('')}</div><div class="la-barcode-num">0 ${digits.slice(0, 5)} ${digits.slice(5, 10)} ${digits.slice(10)}</div>`;
  }

  renderGame(id) {
    const g = this.game(id) || this.data.games[0];
    const series = this.data.series.find(s => s.id === g.series);
    const shot = Math.min(this.activeShot[g.id] || 0, g.shots.length - 1);
    const hints = this.data.hintBook[g.id];
    const st = this.status(g);
    const entry = this.catalogEntry(g);
    const size = entry && entry.fileSize ? entry.fileSize : g.size;
    return `
      <div class="la-page">
        ${this.header('games')}
        <table class="la-box" cellspacing="0">
          <tr>
            <td class="la-box-front">
              <div class="la-cover">
                <div class="la-cover-band" style="background-color:${g.tint}">
                  <div class="la-cover-series">${this.esc(series ? series.title : '')}</div>
                  <div class="la-cover-title">${this.esc(g.title)}</div>
                </div>
                <img src="${this.shotSrc(g, 1)}" alt="${this.esc(g.title)}">
                <div class="la-cover-foot">LUCASARTS <span>${this.esc(this.exeOf(g))}</span></div>
              </div>
              <div class="la-box-actions">
                ${st === 'installed' ? `<span class="la-state la-state-installed">Установлено в системе</span>
                  <button class="la-btn la-btn-buy" data-launch-id="${this.gmId(g)}">Запустить ${this.esc(this.exeOf(g))}</button>${g.demo ? '' : `<br>
                  <button class="la-btn" data-steam-id="${g.id}">Страница в Steam</button>`}`
                : st === 'cd' ? `<span class="la-state la-state-owned">Демоверсия на компакт-диске журнала «Игромания»: ${this.esc(g.setup)}</span>
                  <button class="la-btn la-btn-buy" data-cd-id="${g.demo}">Демоверсия на диске «Игромании»</button>`
                : st === 'owned' ? `<span class="la-state la-state-owned">Куплено в Steam</span>
                  <button class="la-btn la-btn-buy" data-steam-id="${g.id}">Скачать в Steam</button>`
                : `<span class="la-state la-state-price">${this.esc(this.priceOf(g))}</span>
                  <button class="la-btn la-btn-buy" data-steam-id="${g.id}">Купить в Steam</button>`}
              </div>
              <div class="la-sysreq">
                <b>Системные требования</b>
                ${this.esc(g.req)}<br>Размер: ${this.esc(size)}.
              </div>
              ${this.barcode(g.id)}
            </td>
            <td class="la-box-back">
              <p class="la-tagline">${this.esc(g.tagline)}</p>
              <p>${this.esc(g.summary)}</p>
              <img class="la-shot-big" src="${this.shotSrc(g, shot + 1)}" alt="${this.esc(g.shots[shot])}">
              <table class="la-shots" cellspacing="0"><tr>
                ${g.shots.map((cap, i) => `<td>
                  <img class="${i === shot ? 'on' : ''}" src="${this.shotSrc(g, i + 1)}" alt="${this.esc(cap)}" data-shot-game="${g.id}" data-shot-idx="${i}">
                  <div class="la-shot-cap">${this.esc(cap)}</div>
                </td>`).join('')}
              </tr></table>
              <h2 class="la-h2">Кто здесь есть</h2>
              <ul class="la-box-list">${g.cast.map(c => `<li>${this.esc(c)}</li>`).join('')}</ul>
              <h2 class="la-h2">Что окажется в инвентаре</h2>
              <ul class="la-box-list">${g.items.map(c => `<li>${this.esc(c)}</li>`).join('')}</ul>
              ${hints ? `<p>Застряли? <a data-url="${this.baseUrl}/hints?game=${g.id}">Линия подсказок по этой игре</a>: ${hints.puzzles.length} ${this.plural(hints.puzzles.length, 'вопрос', 'вопроса', 'вопросов')}, у каждого три подсказки.</p>` : ''}
              <p style="color:#808080;font-size:10px;">${this.esc(g.credit)}</p>
            </td>
          </tr>
        </table>
        <p><a data-url="${this.baseUrl}/games">Весь каталог</a></p>
      </div>
    `;
  }

  plural(n, one, few, many) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  pollData() {
    const saved = this.read(this.storageKeys.poll, null);
    if (saved && saved.counts) return saved;
    return { voted: null, counts: Object.assign({}, this.data.poll.seed) };
  }

  votePoll(choice) {
    const poll = this.pollData();
    if (poll.voted || !Object.prototype.hasOwnProperty.call(poll.counts, choice)) return poll;
    poll.counts[choice] += 1;
    poll.voted = choice;
    this.write(this.storageKeys.poll, poll);
    return poll;
  }

  masthead(issueNo) {
    const issue = this.data.issues.find(i => i.no === issueNo) || this.data.issues[0];
    return `
      <div class="la-masthead">
        <a class="la-masthead-name" data-url="${this.baseUrl}/news">The Adventurer</a>
        <table class="la-masthead-line" cellspacing="0"><tr>
          <td>Вестник LucasArts для игроков</td>
          <td align="center">${this.esc(issue.title)}</td>
          <td align="right">${this.esc(issue.date)}</td>
        </tr></table>
      </div>
    `;
  }

  renderNews() {
    const [current, ...past] = this.data.issues;
    const poll = this.pollData();
    const total = Object.values(poll.counts).reduce((a, b) => a + b, 0) || 1;
    const toc = issue => `
      <table class="la-toc" cellspacing="0">
        ${this.data.articles.filter(a => a.issue === issue.no).map(a => `
          <tr>
            <td class="la-toc-page">стр. ${a.page}</td>
            <td><a class="la-toc-title" data-url="${this.baseUrl}/article?id=${a.id}">${this.esc(a.title)}</a><br>
              ${this.esc(a.lead)} <span class="la-toc-by">${this.esc(a.author)}</span></td>
          </tr>`).join('')}
      </table>`;
    return `
      <div class="la-page">
        ${this.header('news')}
        <div class="la-paper">
          ${this.masthead(current.no)}
          <div class="la-issue-head">В этом номере</div>
          ${toc(current)}
          ${past.map(issue => `
            <div class="la-issue-head">${this.esc(issue.title)}, ${this.esc(issue.date.toLowerCase())}</div>
            ${toc(issue)}`).join('')}
          <div class="la-poll">
            <div class="la-poll-q">Опрос читателей: ${this.esc(this.data.poll.question)}</div>
            <table cellspacing="0">
              ${this.data.poll.options.map(([key, label]) => {
                const pct = Math.round(poll.counts[key] / total * 100);
                return `<tr>
                  <td>${poll.voted ? (poll.voted === key ? '<b>&gt;</b>' : '') : `<input type="radio" name="la_poll_choice" value="${key}"${key === 'chicken' ? ' checked' : ''}>`}</td>
                  <td>${this.esc(label)}</td>
                  <td class="la-poll-bar"><div style="width:${pct}%"></div></td>
                  <td class="la-poll-pct">${pct}%</td>
                </tr>`;
              }).join('')}
            </table>
            <div style="margin-top:6px;">${poll.voted
              ? `Спасибо, ваш голос учтён. Всего голосов: ${total}.`
              : `<button class="la-btn" id="la-btn-poll-vote">Голосовать</button> Проголосовали ${total} читателей.`}</div>
          </div>
        </div>
      </div>
    `;
  }

  replies(artId) {
    const saved = this.read(this.storageKeys.replies, {});
    return (this.data.seedReplies[artId] || []).concat(saved[artId] || []);
  }

  addReply(artId, author, text) {
    const cleanText = String(text || '').trim().slice(0, 1000);
    if (!cleanText) return false;
    const saved = this.read(this.storageKeys.replies, {});
    if (!saved[artId]) saved[artId] = [];
    saved[artId].push({
      author: String(author || '').trim().slice(0, 40) || 'Гость',
      date: '14.12.1998',
      text: cleanText
    });
    this.write(this.storageKeys.replies, saved);
    return true;
  }

  renderArticle(id) {
    const art = this.data.articles.find(a => a.id === id) || this.data.articles[0];
    const issue = this.data.issues.find(i => i.no === art.issue) || this.data.issues[0];
    const half = Math.ceil(art.body.length / 2);
    const para = (p, first) => first
      ? `<p><span class="la-dropcap">${this.esc(p.charAt(0))}</span>${this.esc(p.slice(1))}</p>`
      : `<p>${this.esc(p)}</p>`;
    const game = art.game ? this.game(art.game) : null;
    const replies = this.replies(art.id);
    return `
      <div class="la-page">
        ${this.header('news')}
        <div class="la-paper">
          ${this.masthead(art.issue)}
          <div class="la-kicker">${this.esc(art.rubric)}, стр. ${art.page}</div>
          <div class="la-art-title">${this.esc(art.title)}</div>
          <p class="la-art-lead">${this.esc(art.lead)}</p>
          <div class="la-byline">${this.esc(art.author)} &middot; ${this.esc(issue.title)}, ${this.esc(issue.date.toLowerCase())}</div>
          <table class="la-cols" cellspacing="0"><tr>
            <td class="la-col-a">${art.body.slice(0, half).map((p, i) => para(p, i === 0)).join('')}</td>
            <td class="la-col-b">${art.body.slice(half).map(p => para(p, false)).join('')}</td>
          </tr></table>
          <div class="la-art-tools">
            ${game ? `Об игре: <a data-url="${this.baseUrl}/game?id=${game.id}">${this.esc(game.title)}</a><br><br>` : ''}
            <button class="la-btn" id="la-btn-art-notepad" data-art-id="${art.id}">Открыть ${this.esc(art.file)} в Блокноте</button>
            <button class="la-btn" id="la-btn-art-save" data-art-id="${art.id}">Сохранить в «Мои документы»</button>
            <span class="la-saved" id="la-art-save-status"></span>
            <br><a data-url="${this.baseUrl}/news">Все номера The Adventurer</a>
          </div>
          <div class="la-replies">
            <div class="la-issue-head">Отклики читателей (${replies.length})</div>
            ${replies.map(c => `<div class="la-reply"><b>${this.esc(c.author)}</b> <small>${this.esc(c.date)}</small><br>${this.esc(c.text)}</div>`).join('')}
            ${replies.length ? '' : '<div class="la-reply">Откликов пока нет. Ваш будет первым.</div>'}
            <table class="la-form" cellspacing="0">
              <tr><td>Имя:</td><td><input type="text" id="la-reply-author" size="24" value="Гость"></td></tr>
              <tr><td>Отклик:</td><td><textarea id="la-reply-text" rows="3" cols="52"></textarea></td></tr>
              <tr><td></td><td><button class="la-btn" id="la-reply-submit" data-art-id="${art.id}">Отправить отклик</button></td></tr>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  articleText(art) {
    const rule = '='.repeat(64);
    const issue = this.data.issues.find(i => i.no === art.issue) || this.data.issues[0];
    return [
      rule,
      ` THE ADVENTURER. ${issue.title}, ${issue.date}. ${art.rubric}, стр. ${art.page}`,
      rule,
      '',
      art.title,
      '',
      art.lead,
      '',
      art.author,
      '',
      ...art.body.map(p => p + '\n'),
      rule,
      ' LucasArts Entertainment Company. http://www.lucasarts.com'
    ].join('\n');
  }

  unlocked() {
    return this.read(this.storageKeys.hints, {});
  }

  revealHint(puzzleId) {
    const state = this.unlocked();
    state[puzzleId] = Math.min(3, (state[puzzleId] || 0) + 1);
    this.write(this.storageKeys.hints, state);
    return state[puzzleId];
  }

  hintBookText(gameId) {
    const book = this.data.hintBook[gameId];
    const g = this.game(gameId);
    if (!book || !g) return '';
    const rule = '='.repeat(64);
    const lines = [rule, ` ЛИНИЯ ПОДСКАЗОК LUCASARTS 1-900-740-JEDI`, ` ${g.title}`, rule, ''];
    book.puzzles.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.q}`);
      p.tiers.forEach((tier, ti) => lines.push(`   Подсказка ${ti + 1}: ${tier}`));
      lines.push('');
    });
    lines.push(rule, ' Первая подсказка намекает, вторая называет предмет, третья решает.');
    return lines.join('\n');
  }

  hintScreen(params) {
    const url = q => `${this.baseUrl}/hints${q ? '?' + q : ''}`;
    const book = params.game ? this.data.hintBook[params.game] : null;
    const g = params.game ? this.game(params.game) : null;
    if (book && g) {
      const menu = this.data.hintMenus.find(m => m.game === g.id || (m.games || []).includes(g.id));
      const back = menu && menu.games ? url(`menu=${menu.key}`) : url('');
      const qIdx = parseInt(params.q, 10);
      const puzzle = book.puzzles[qIdx - 1];
      if (puzzle) {
        const level = this.unlocked()[puzzle.id] || 0;
        const options = [];
        if (level < 3) options.push({ key: '1', label: level ? 'Следующая подсказка' : 'Первая подсказка', reveal: puzzle.id });
        if (qIdx < book.puzzles.length) options.push({ key: '2', label: 'Следующий вопрос', url: url(`game=${g.id}&q=${qIdx + 1}`) });
        return {
          path: [['Главное меню', url('')], menu && menu.games ? [menu.label, back] : null, [g.short, url(`game=${g.id}`)], [`Вопрос ${qIdx}`, null]].filter(Boolean),
          lcd: `${g.short.slice(0, 13)} В.${qIdx}\nПОДСКАЗКА ${level}/3`,
          speech: puzzle.q,
          puzzle, level, options,
          back: url(`game=${g.id}`),
          game: g.id
        };
      }
      return {
        path: [['Главное меню', url('')], menu && menu.games ? [menu.label, back] : null, [g.short, null]].filter(Boolean),
        lcd: `${g.short.slice(0, 16)}\nВЫБЕРИТЕ ВОПРОС`,
        speech: `${g.title}. Выберите вопрос.`,
        options: book.puzzles.map((p, i) => ({ key: String(i + 1), label: p.q, url: url(`game=${g.id}&q=${i + 1}`) })),
        back,
        game: g.id
      };
    }
    const menu = this.data.hintMenus.find(m => m.key === params.menu && m.games);
    if (menu) {
      return {
        path: [['Главное меню', url('')], [menu.label, null]],
        lcd: `${menu.label.slice(0, 16)}\nВЫБЕРИТЕ ЭПИЗОД`,
        speech: `${menu.label}. Выберите эпизод.`,
        options: menu.games.map((id, i) => {
          const eg = this.game(id);
          return { key: String(i + 1), label: `${eg.short}: ${eg.title.replace('Sam & Max: ', '')}`, url: url(`game=${id}`) };
        }),
        back: url('')
      };
    }
    return {
      path: [['Главное меню', null]],
      lcd: '1-900-740-JEDI\nВЫБЕРИТЕ ИГРУ',
      speech: 'Вы позвонили на линию подсказок LucasArts. Выберите игру.',
      options: this.data.hintMenus.map((m, i) => ({ key: String(i + 1), label: m.label, url: m.games ? url(`menu=${m.key}`) : url(`game=${m.game}`) })),
      back: null
    };
  }

  renderHints(params) {
    const s = this.hintScreen(params);
    const keyMap = {};
    s.options.forEach(o => { keyMap[o.key] = o.reveal ? { reveal: o.reveal } : { url: o.url }; });
    if (s.back) keyMap['0'] = { url: s.back };
    if (s.path.length > 1) keyMap['*'] = { url: `${this.baseUrl}/hints` };
    if (s.game) keyMap['#'] = { notepad: s.game };
    this.keyMap = keyMap;
    const keys = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PRS'], ['8', 'TUV'], ['9', 'WXY'], ['*', 'меню'], ['0', 'назад'], ['#', 'печать']];
    const labels = ['Первая подсказка: где искать', 'Вторая подсказка: что нужно', 'Третья подсказка: решение'];
    return `
      <div class="la-page">
        ${this.header('hints')}
        <table class="la-call" cellspacing="0">
          <tr>
            <td class="la-phone-cell">
              <div class="la-phone">
                <div class="la-phone-plate">ЛИНИЯ ПОДСКАЗОК<span>1-900-740-JEDI</span></div>
                <div class="la-lcd" id="la-lcd">${this.esc(s.lcd)}</div>
                <table class="la-keypad" cellspacing="0">
                  ${[0, 3, 6, 9].map(row => `<tr>${keys.slice(row, row + 3).map(([k, sub]) => `
                    <td><button class="la-key" data-la-key="${k}"${keyMap[k] ? '' : ' disabled'}>${k}<small>${sub || '&nbsp;'}</small></button></td>`).join('')}</tr>`).join('')}
                </table>
                <div class="la-phone-note">Звонок из Win 98 бесплатный.<br>Круглосуточно, без выходных.</div>
              </div>
            </td>
            <td class="la-transcript">
              <div class="la-path">${s.path.map(([label, link]) => link ? `<a data-url="${link}">${this.esc(label)}</a>` : `<b>${this.esc(label)}</b>`).join(' &gt; ')}</div>
              <p class="la-op">${this.esc(s.speech)}</p>
              ${s.puzzle ? s.puzzle.tiers.map((tier, i) => i < s.level
                ? `<div class="la-hint"><i>${labels[i]}</i>${this.esc(tier)}</div>`
                : `<div class="la-hint la-hint-closed"><i>${labels[i]}</i>Закрыта. Нажмите 1, чтобы услышать.</div>`).join('') : ''}
              <ul class="la-menu">
                ${s.options.map(o => `<li><b>${o.key}</b>${o.reveal
                  ? `<a data-la-key-link="${o.key}">${this.esc(o.label)}</a>`
                  : `<a data-url="${o.url}">${this.esc(o.label)}</a>`}</li>`).join('')}
                ${s.back ? `<li><b>0</b><a data-url="${s.back}">Назад</a></li>` : ''}
                ${s.path.length > 1 ? `<li><b>*</b><a data-url="${this.baseUrl}/hints">Главное меню</a></li>` : ''}
              </ul>
              ${s.game ? `<div class="la-hint-tools">
                <button class="la-btn" id="la-btn-hint-notepad" data-hint-file="${s.game}">Все подсказки в Блокноте</button>
                <button class="la-btn" id="la-btn-hint-save" data-hint-file="${s.game}">Сохранить ${this.esc(this.data.hintBook[s.game].file)}</button>
                <span class="la-saved" id="la-hint-save-status"></span>
              </div>` : `<p class="la-path">Подсказки открываются по одной. Первая намекает, где искать, вторая называет нужный предмет, третья даёт решение.</p>`}
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  resetLab() {
    this.lab = {
      verb: '',
      a: '',
      inv: ['chicken', 'disk', 'mug'],
      awake: false,
      rebooted: false,
      shelfOpen: false,
      colanderTaken: false,
      done: false,
      say: 'Тестерская LucasArts. Билд эпизода 202 надо сдать до пятницы.',
      who: 'narr'
    };
  }

  labName(id) {
    return this.labObjects[id] || this.labItems[id] || id;
  }

  labSentence(hoverId) {
    const verb = this.lab.verb || 'Идти к';
    const parts = [verb];
    if (this.lab.a) {
      parts.push(this.labName(this.lab.a));
      parts.push(this.lab.verb === 'Дать' ? 'для' : 'с');
    }
    if (hoverId && hoverId !== this.lab.a) parts.push(this.labName(hoverId));
    return parts.join(' ');
  }

  labSay(text, who = 'me') {
    this.lab.say = text;
    this.lab.who = who;
    return { text, who };
  }

  labGive(item) {
    if (!this.lab.inv.includes(item)) this.lab.inv.push(item);
  }

  labTake(item) {
    this.lab.inv = this.lab.inv.filter(i => i !== item);
  }

  labFallback(verb) {
    const lines = {
      'Дать': 'Это лучше оставить себе.',
      'Открыть': 'Это не открывается.',
      'Закрыть': 'Это не закрывается.',
      'Взять': 'Это не взять.',
      'Смотреть': 'Ничего особенного.',
      'Говорить': 'Разговор не клеится.',
      'Использовать': 'Так не получится.',
      'Толкать': 'Не сдвигается.',
      'Тянуть': 'Не тянется.'
    };
    return this.labSay(lines[verb] || 'Ничего не происходит.');
  }

  labLook(id) {
    const L = this.lab;
    const lines = {
      tester: L.awake ? 'Ларри не спит. Смотрит на компьютер с надеждой.' : 'Тестер Ларри. Спит лицом в клавиатуру. В его отчёте третий час набирается буква «ж».',
      pc: L.done ? 'На экране идёт Sam & Max 202. Ларри уже записал первую ошибку.' : L.rebooted ? 'Компьютер снова жив. Дисковод мигает и ждёт.' : 'Компьютер завис на заставке. Песочные часы не двигаются с обеда.',
      coffee: 'Кофеварка тестерского отдела. Работает круглосуточно, в отличие от тестеров.',
      board: 'Ошибка недели: «202: Педро в каждом разговоре поздравляет себя с днём рождения». Ниже приписка: «Не ошибка. У него каждый день день рождения».',
      shelf: L.shelfOpen ? (L.colanderTaken ? 'Картонная голова Моаи и коробка «КУРИЦЫ, ЗАПАС».' : 'Внутри картонная голова Моаи, дуршлаг и коробка «КУРИЦЫ, ЗАПАС».') : 'Шкаф с реквизитом. На дверце табличка «Не брать без спроса». Спросить некого.',
      poster: 'Плакат «Ice Station Santa». Кто-то подрисовал Маймтрону усы.',
      door: 'Выход на улицу. Там газетный киоск и телефонная будка.',
      chicken: 'Резиновая курица с блоком посередине. Её выдают каждому сотруднику в первый день.',
      disk: 'Дискета с билдом Sam & Max 202. На наклейке: «Срочно в тестирование!»',
      mug: 'Пустая кружка с надписью «Лучший тестер 1997».',
      colander: 'Дуршлаг из реквизита эпизода 101. Защищает от гипноза, если верить Боско.'
    };
    lines.java = 'Кружка горячего кофе. Крепкого, как сроки сдачи.';
    return this.labSay(lines[id] || 'Ничего особенного.');
  }

  labSubmit() {
    const L = this.lab;
    if (!L.rebooted) return this.labSay('Дисковод не отвечает. Компьютер завис.');
    if (!L.awake) return this.labSay('Компьютер готов, но тестер спит. Билд без тестера не считается.');
    this.labTake('disk');
    L.done = true;
    return this.labSay('Ларри: Загружается... Есть! Sam & Max 202 принят в тестирование. Первая ошибка: лапы Макса пахнут ананасом.', 'tester');
  }

  labOne(verb, id) {
    const L = this.lab;
    if (id === 'door' && ['Открыть', 'Использовать', 'Толкать', ''].includes(verb)) return { go: '/' };
    if (verb === 'Смотреть' || verb === '') return this.labLook(id);
    if (id === 'shelf') {
      if (verb === 'Открыть') {
        if (L.shelfOpen) return this.labSay('Уже открыт.');
        L.shelfOpen = true;
        return this.labSay('Дверца скрипит и открывается.');
      }
      if (verb === 'Закрыть') {
        if (!L.shelfOpen) return this.labSay('Уже закрыт.');
        L.shelfOpen = false;
        return this.labSay('Табличка «Не брать без спроса» снова смотрит на меня.');
      }
      if (verb === 'Взять') {
        if (!L.shelfOpen) return this.labSay('Сначала надо открыть шкаф.');
        if (L.colanderTaken) return this.labSay('Голова Моаи не влезет в инвентарь. Я пробовал.');
        L.colanderTaken = true;
        this.labGive('colander');
        return this.labSay('Дуршлаг. Пригодится, если начнётся гипноз.');
      }
    }
    if (id === 'pc') {
      if (verb === 'Толкать') {
        if (L.rebooted) return this.labSay('Он уже перезагрузился. Второй раз может не простить.');
        L.rebooted = true;
        return this.labSay('Компьютер щёлкает, пищит и перезагружается.', 'narr');
      }
      if (verb === 'Использовать') return this.labSay(L.rebooted ? 'Без дискеты тут делать нечего.' : 'Компьютер не реагирует. Песочные часы.');
      if (verb === 'Говорить') return this.labSay('Компьютер молчит. Это хороший знак или очень плохой.');
      if (verb === 'Взять') return this.labSay('Он прикручен к столу. После прошлого года.');
      if (verb === 'Открыть') return this.labSay('Корпус на винтах, а отвёртка у Боско.');
    }
    if (id === 'tester') {
      if (verb === 'Говорить') {
        if (L.done) return this.labSay('Ларри: Не мешай, я записываю. Макс снова ушёл сквозь стену.', 'tester');
        if (!L.awake) return this.labSay('Ларри: Хр-р... Стоп, ещё дубль... хр-р...', 'tester');
        if (!L.rebooted) return this.labSay('Ларри: Компьютер завис ещё с обеда. Я его не трогаю. Вдруг он думает.', 'tester');
        return this.labSay('Ларри: Отвис! Давай билд, пока он опять не задумался.', 'tester');
      }
      if (verb === 'Толкать') return this.labSay(L.awake ? 'Ларри: Эй! Я работаю.' : 'Ларри мычит и отворачивается к стене.', L.awake ? 'tester' : 'narr');
      if (verb === 'Тянуть') return this.labSay('Тянуть Ларри за ухо? Он может проснуться не в духе.');
      if (verb === 'Взять') return this.labSay('Ларри весит как два системных блока.');
    }
    if (id === 'coffee') {
      if (verb === 'Использовать') return this.labSay('Кофеварке нужна кружка.');
      if (verb === 'Открыть') return this.labSay('Внутри фильтр и вчерашняя гуща.');
      if (verb === 'Толкать') return this.labSay('Кофеварка проехала по тумбочке и вернулась.');
      if (verb === 'Взять') return this.labSay('Кофеварка нужна всему отделу.');
      if (verb === 'Говорить') return this.labSay('Кофеварка булькнула в ответ.', 'narr');
    }
    if (id === 'board' && verb === 'Взять') return this.labSay('Доска висит на стене, и ей там хорошо.');
    if (id === 'poster' && verb === 'Взять') return this.labSay('Плакат приклеен намертво.');
    if (id === 'door' && verb === 'Тянуть') return this.labSay('Дверь открывается от себя.');
    return this.labFallback(verb);
  }

  labTwo(verb, a, b) {
    const L = this.lab;
    if (a === 'mug' && b === 'coffee' && verb === 'Использовать') {
      this.labTake('mug');
      this.labGive('java');
      return this.labSay('Кофеварка шипит. Кружка полна.', 'narr');
    }
    if (a === 'java' && b === 'tester') {
      if (L.awake) return this.labSay('Ларри: Спасибо, я уже проснулся.', 'tester');
      this.labTake('java');
      L.awake = true;
      return this.labSay('Ларри: А? Кофе! Я не сплю, я жду, пока отвиснет компьютер.', 'tester');
    }
    if (a === 'mug' && b === 'tester') return this.labSay('Пустую кружку он не оценит.');
    if (a === 'disk' && b === 'pc' && verb === 'Использовать') return this.labSubmit();
    if (a === 'disk' && b === 'tester') {
      if (!L.awake) return this.labSay('Он спит. Дискета упадёт на клавиатуру и наберёт ещё одну «ж».');
      if (!L.rebooted) return this.labSay('Ларри: Куда я её вставлю? Компьютер завис.', 'tester');
      return this.labSubmit();
    }
    if (a === 'chicken' && b === 'tester') return this.labSay('Ларри: У меня своя есть. Всем выдают в первый день.', L.awake ? 'tester' : 'narr');
    if (a === 'chicken') return this.labSay('Курица с блоком хороша на тросах. Тросов тут нет.');
    if (a === 'colander' && b === 'tester') return L.awake
      ? this.labSay('Ларри: Защита от гипноза? Мне бы защиту от сроков.', 'tester')
      : this.labSay('Надеть на спящего дуршлаг смешно, но не поможет.');
    if (a === 'java' && b === 'pc') return this.labSay('Кофе в системный блок? Так компьютеры ломают.');
    if (a === 'mug' && b === 'coffee') return this.labSay('Кружку надо использовать с кофеваркой.');
    return this.labFallback(verb);
  }

  labClick(kind, id) {
    const L = this.lab;
    if (L.done && kind !== 'verb') return this.labSay('Билд сдан. Можно начать заново.', 'narr');
    if (kind === 'verb') {
      L.verb = L.verb === id ? '' : id;
      L.a = '';
      return null;
    }
    if (kind === 'item') {
      if (L.a && L.a !== id && ['Использовать', 'Дать'].includes(L.verb)) {
        const res = this.labTwo(L.verb, L.a, id);
        L.a = '';
        L.verb = '';
        return res;
      }
      if (L.verb === 'Смотреть') {
        L.verb = '';
        return this.labLook(id);
      }
      if (L.verb !== 'Дать') L.verb = 'Использовать';
      L.a = id;
      return null;
    }
    const verb = L.verb;
    const a = L.a;
    L.verb = '';
    L.a = '';
    if (a) return this.labTwo(verb, a, id);
    return this.labOne(verb, id);
  }

  labScene() {
    const L = this.lab;
    const r = (x, y, w, h, fill, extra) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
    const hit = (x, y, w, h) => r(x, y, w, h, 'transparent', 'class="la-hit"');
    const hot = (id, inner) => `<g class="la-hot" data-lab-obj="${id}" data-la-say="${this.esc(this.labObjects[id])}">${inner}</g>`;
    const p = [];
    p.push(r(0, 0, 320, 100, '#2c2c5c'));
    for (let x = 0; x < 320; x += 16) p.push(r(x, 0, 1, 100, '#26264e'));
    p.push(r(0, 96, 320, 4, '#1c1c3c'), r(0, 100, 320, 44, '#5c4428'));
    for (let y = 106; y < 144; y += 8) p.push(r(0, y, 320, 1, '#4c3418'));
    p.push(r(150, 0, 20, 4, '#1c1c3c'), r(156, 4, 8, 3, '#f0f0c0'));
    p.push(hot('poster', [r(14, 18, 30, 40, '#a01810'), r(17, 21, 24, 22, '#f0f0f0'), r(22, 26, 14, 12, '#808080'), r(26, 30, 2, 2, '#202020'), r(31, 30, 2, 2, '#202020'), r(27, 35, 6, 1, '#202020'), r(28, 33, 4, 1, '#202020'), r(17, 47, 24, 3, '#f0c858'), r(17, 52, 18, 2, '#f0f0f0'), hit(14, 18, 30, 40)].join('')));
    p.push(hot('board', [r(56, 14, 66, 44, '#808080'), r(58, 16, 62, 38, '#f0f0f0'), r(61, 19, 22, 2, '#2040c0'), r(61, 24, 52, 1, '#202020'), r(61, 28, 46, 1, '#202020'), r(61, 32, 50, 1, '#c02020'), r(61, 36, 38, 1, '#202020'), r(61, 40, 44, 1, '#202020'), r(61, 44, 30, 1, '#20a020'), r(100, 18, 16, 7, '#f0e060'), r(64, 58, 50, 2, '#606060'), hit(56, 14, 66, 46)].join('')));
    p.push(hot('coffee', [r(14, 84, 34, 22, '#4c3418'), r(16, 88, 30, 1, '#3c2410'), r(20, 62, 22, 22, '#202020'), r(22, 64, 18, 4, '#404040'), r(24, 72, 12, 10, '#7c98a8'), r(25, 76, 10, 6, '#3c2008'), r(36, 66, 3, 2, '#e01010'), hit(14, 60, 34, 46)].join('')));
    p.push(r(128, 76, 88, 6, '#7c5428'), r(132, 82, 6, 24, '#5c3418'), r(206, 82, 6, 24, '#5c3418'), r(128, 76, 88, 1, '#9c7448'));
    const screen = L.done ? r(152, 52, 22, 15, '#1c5c1c') + r(155, 55, 6, 8, '#a8c8f8') + r(163, 57, 8, 6, '#f0f0f0') + r(152, 63, 22, 4, '#5c4428')
      : L.rebooted ? r(152, 52, 22, 15, '#000000') + r(154, 54, 12, 1, '#c0c0c0') + r(154, 57, 16, 1, '#c0c0c0') + r(154, 60, 8, 1, '#c0c0c0') + r(163, 60, 2, 2, '#c0c0c0')
      : r(152, 52, 22, 15, '#008080') + r(160, 55, 6, 2, '#f0f0f0') + r(161, 57, 4, 3, '#f0e060') + r(160, 60, 6, 2, '#f0f0f0');
    p.push(hot('pc', [r(148, 48, 30, 23, '#c8c0a8'), screen, r(158, 71, 10, 3, '#a8a088'), r(146, 74, 34, 3, '#c8c0a8'), r(184, 54, 12, 22, '#c8c0a8'), r(186, 60, 8, 2, '#606060'), r(192, 70, 2, 2, L.rebooted ? '#20e020' : '#606060'), hit(146, 46, 52, 32)].join('')));
    const tester = L.awake
      ? [r(198, 66, 14, 22, '#2050a0'), r(200, 50, 10, 11, '#e0b090'), r(199, 48, 12, 4, '#603010'), r(202, 54, 2, 2, '#202020'), r(207, 54, 2, 2, '#202020'), r(203, 58, 4, 1, '#a04030'), r(192, 70, 8, 3, '#e0b090'), r(198, 88, 5, 16, '#303030'), r(206, 88, 5, 16, '#303030')]
      : [r(198, 68, 14, 20, '#2050a0'), r(186, 66, 12, 9, '#e0b090'), r(186, 64, 12, 3, '#603010'), r(180, 72, 8, 4, '#e0b090'), r(198, 88, 5, 16, '#303030'), r(206, 88, 5, 16, '#303030'), `<text x="186" y="58" fill="#f0f0f0" font-family="Arial, sans-serif" font-weight="bold" font-size="7">Z z</text>`];
    p.push(r(214, 70, 4, 34, '#202020'), r(196, 88, 22, 4, '#303030'));
    p.push(hot('tester', tester.join('') + hit(178, 46, 40, 58)));
    const shelfInner = L.shelfOpen
      ? r(232, 34, 30, 68, '#3c2410') + r(232, 60, 30, 2, '#5c3418') + r(235, 40, 10, 18, '#808080') + r(237, 44, 2, 2, '#202020') + r(241, 44, 2, 2, '#202020') + r(236, 50, 8, 6, '#6c6c6c') + (L.colanderTaken ? '' : r(248, 50, 11, 6, '#c0c0c8') + r(249, 49, 9, 1, '#e0e0e8')) + r(236, 66, 22, 14, '#a07840') + r(238, 70, 18, 2, '#202020') + r(240, 82, 8, 6, '#f0d040') + r(246, 80, 4, 3, '#f0d040') + r(225, 34, 7, 68, '#7c5428')
      : r(232, 34, 15, 68, '#7c5428') + r(247, 34, 15, 68, '#7c5428') + r(246, 34, 2, 68, '#4c2810') + r(243, 64, 2, 6, '#e0a800') + r(249, 64, 2, 6, '#e0a800') + r(234, 44, 11, 6, '#f0f0f0');
    p.push(hot('shelf', r(230, 30, 34, 74, '#5c3418') + shelfInner + hit(224, 30, 40, 74)));
    p.push(hot('door', [r(276, 30, 32, 74, '#2c1c0c'), r(279, 34, 26, 70, '#5c3418'), r(282, 38, 20, 24, '#4c2810'), r(282, 66, 20, 34, '#4c2810'), r(300, 64, 3, 4, '#e0a800'), r(282, 22, 20, 7, '#000000'), `<text x="292" y="28" text-anchor="middle" fill="#55ff55" font-family="Arial, sans-serif" font-weight="bold" font-size="6">EXIT</text>`, hit(276, 20, 32, 84)].join('')));
    return `<svg class="la-scene" viewBox="0 0 320 144" width="640" height="288" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${p.join('')}</svg>`;
  }

  renderScumm() {
    const L = this.lab;
    const sayClass = L.who === 'tester' ? 'la-say la-say-tester' : L.who === 'narr' ? 'la-say la-say-narr' : 'la-say';
    return `
      <div class="la-page">
        ${this.header('scumm')}
        <div class="la-lab">
          <p class="la-task"><b>Задание:</b> сдать билд Sam &amp; Max 202 тестеру до пятницы.</p>
          <div class="la-stage">
            ${this.labScene()}
            <div class="${sayClass}" id="la-scumm-output">${this.esc(L.say)}</div>
          </div>
          <div class="la-panel">
            <div class="la-sentence" id="la-sentence">${this.esc(this.labSentence())}</div>
            <table class="la-panel-table" cellspacing="0">
              <tr>
                <td class="la-verb-cell">
                  <table class="la-verbs" cellspacing="0">
                    ${[0, 3, 6].map(start => `<tr>${this.verbs.slice(start, start + 3).map(v => `
                      <td><button class="la-verb${L.verb === v ? ' on' : ''}" data-lab-verb="${v}">${v}</button></td>`).join('')}</tr>`).join('')}
                  </table>
                </td>
                <td class="la-inv-cell">
                  ${L.inv.map(id => `<button class="la-inv${L.a === id ? ' on' : ''}" data-lab-item="${id}">${this.esc(this.labItems[id])}</button>`).join('')}
                </td>
              </tr>
            </table>
          </div>
          ${L.done ? `<div class="la-lab-done">Билд принят в тестирование. Спасибо, стажёр. <button class="la-btn" id="la-lab-reset">Начать заново</button></div>` : ''}
          <p class="la-lab-help">Выберите глагол, потом предмет в комнате или в инвентаре. «Использовать» и «Дать» соединяют два предмета: сначала из инвентаря, потом в комнате. Без глагола щелчок осматривает предмет, а дверь выводит на улицу.
            ${L.done ? '' : '<br><button class="la-btn" id="la-lab-reset">Начать заново</button>'}</p>
        </div>
      </div>
    `;
  }

  allLetters() {
    return this.read(this.storageKeys.letters, []).concat(this.data.letters);
  }

  submitLetter(to, from, question) {
    const q = String(question || '').trim().slice(0, 1500);
    if (!q) return null;
    const known = this.data.recipients.some(([key]) => key === to);
    const target = known ? to : 'sammax';
    const pool = this.data.autoReplies[target];
    let hash = 0;
    for (const ch of q) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
    const entry = {
      id: 'u' + Date.now(),
      to: target,
      from: String(from || '').trim().slice(0, 60) || 'Читатель',
      date: '14.12.1998',
      q,
      a: pool[hash % pool.length]
    };
    const saved = this.read(this.storageKeys.letters, []);
    saved.unshift(entry);
    this.write(this.storageKeys.letters, saved);
    return entry;
  }

  renderLetters(filter) {
    const recipients = this.data.recipients;
    const active = recipients.some(([k]) => k === filter) ? filter : 'all';
    const list = this.allLetters().filter(l => active === 'all' || l.to === active);
    const label = key => (recipients.find(([k]) => k === key) || ['', ''])[1];
    return `
      <div class="la-page">
        ${this.header('letters')}
        <h1 class="la-h1">Письма</h1>
        <p class="la-lede">Сэм и Макс, Гайбраш, инженеры SCUMM и редакция отвечают читателям. Лучшие письма попадают в The Adventurer.</p>
        <table class="la-mailroom" cellspacing="0">
          <tr>
            <td class="la-letters-col">
              <div class="la-filter">Кому:
                ${active === 'all' ? '<b>всем</b>' : `<a data-letter-filter="all" data-url="${this.baseUrl}/letters">всем</a>`}
                ${recipients.map(([k, l]) => active === k ? `<b>${this.esc(l)}</b>` : `<a data-letter-filter="${k}" data-url="${this.baseUrl}/letters?to=${k}">${this.esc(l)}</a>`).join('')}
              </div>
              ${list.map(l => `
                <div class="la-letter">
                  <div class="la-letter-from"><b>${this.esc(l.from)}</b>, ${this.esc(l.date)}. ${this.esc(label(l.to))}.</div>
                  <p class="la-letter-q">${this.esc(l.q)}</p>
                  <div class="la-letter-a">${(l.a || []).map(([who, text]) => `<p><b>${this.esc(who)}:</b> ${this.esc(text)}</p>`).join('')}</div>
                </div>`).join('')}
              ${list.length ? '' : '<p class="la-empty">Писем этому адресату пока нет.</p>'}
            </td>
            <td style="width:210px">
              <div class="la-writebox">
                <div class="la-writebox-title">Написать письмо</div>
                <label for="la-letter-to">Кому:</label>
                <select id="la-letter-to">${recipients.map(([k, l]) => `<option value="${k}"${active === k ? ' selected' : ''}>${this.esc(l)}</option>`).join('')}</select>
                <label for="la-letter-from">Имя и город:</label>
                <input type="text" id="la-letter-from" value="">
                <label for="la-letter-q">Вопрос:</label>
                <textarea id="la-letter-q" rows="6"></textarea>
                <button class="la-btn" id="la-letter-submit">Отправить</button>
                <div class="la-writebox-note">Ответ появится в списке сразу.</div>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  search(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    const has = list => list.some(s => String(s).toLowerCase().includes(q));
    const hits = [];
    this.data.games.forEach(g => {
      if (has([g.title, g.ru, g.tagline, g.summary, ...g.cast, ...g.items])) hits.push({ title: g.title, text: g.tagline, url: `${this.baseUrl}/game?id=${g.id}` });
    });
    this.data.articles.forEach(a => {
      if (has([a.title, a.lead, ...a.body])) hits.push({ title: `The Adventurer: ${a.title}`, text: a.lead, url: `${this.baseUrl}/article?id=${a.id}` });
    });
    Object.keys(this.data.hintBook).forEach(id => {
      const g = this.game(id);
      this.data.hintBook[id].puzzles.forEach((p, i) => {
        if (has([p.q])) hits.push({ title: `Подсказка: ${p.q}`, text: g ? g.title : '', url: `${this.baseUrl}/hints?game=${id}&q=${i + 1}` });
      });
    });
    return hits;
  }

  renderSearch(query) {
    const hits = this.search(query);
    return `
      <div class="la-page">
        ${this.header('')}
        <h1 class="la-h1">Поиск по сайту</h1>
        <p><input type="text" id="la-search-page-input" size="40" value="${this.esc(query)}"> <button class="la-btn" id="la-search-page-btn">Найти</button></p>
        ${query ? `<p>По запросу «${this.esc(query)}» найдено: ${hits.length}.</p>` : '<p class="la-empty">Введите слово: название игры, имя героя или предмет.</p>'}
        ${hits.length ? `<ol class="la-results">${hits.map(h => `
          <li><a data-url="${h.url}">${this.esc(h.title)}</a><br>${this.esc(h.text)}<br><span class="la-results-url">${this.esc(h.url)}</span></li>`).join('')}</ol>`
          : query ? '<p class="la-empty">Ничего не найдено. Попробуйте другое слово, например «Линкольн» или «курица».</p>' : ''}
      </div>
    `;
  }

  renderSite(url) {
    const route = this.parseRoute(url);
    let page;
    if (route.path === '/games') page = this.renderGames(route.params.series);
    else if (route.path === '/game') page = this.renderGame(route.params.id);
    else if (route.path === '/news') page = this.renderNews();
    else if (route.path === '/article') page = this.renderArticle(route.params.id);
    else if (route.path === '/hints') page = this.renderHints(route.params);
    else if (route.path === '/scumm') page = this.renderScumm();
    else if (route.path === '/letters') page = this.renderLetters(route.params.to);
    else if (route.path === '/search') page = this.renderSearch(route.params.q || '');
    else page = this.renderHome();
    return `<div class="la-site">${page}${this.footer()}</div>`;
  }

  attachEvents(win, container, ieApp) {
    const ie = ieApp || window.appIE;
    const go = target => {
      const next = target ? (target.startsWith('http') ? target : this.baseUrl + (target === '/' ? '' : target)) : (ie && ie.currentUrl) || this.baseUrl;
      if (target && ie && ie.navigate) ie.navigate(win, next);
      else if (ie && ie.renderPage) ie.renderPage(win, next);
    };
    const refresh = () => go(null);
    const click = () => { if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick(); };
    const ding = () => { if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing(); };
    const on = (sel, fn) => { const el = container.querySelector(sel); if (el) el.addEventListener('click', fn); return el; };
    const onAll = (sel, evt, fn) => container.querySelectorAll(sel).forEach(el => el.addEventListener(evt, e => fn(el, e)));

    const runSearch = inputSel => {
      const input = container.querySelector(inputSel);
      go(`/search?q=${encodeURIComponent(input ? input.value.trim() : '')}`);
    };
    on('#la-search-btn', () => runSearch('#la-search-input'));
    on('#la-search-page-btn', () => runSearch('#la-search-page-input'));
    ['#la-search-input', '#la-search-page-input'].forEach(sel => {
      const input = container.querySelector(sel);
      if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(sel); });
    });

    const sentence = container.querySelector('#la-sentence');
    onAll('[data-la-go]', 'click', el => { click(); go(el.dataset.laGo); });
    onAll('[data-la-say]', 'mouseover', el => {
      if (!sentence) return;
      sentence.textContent = el.dataset.labObj ? this.labSentence(el.dataset.labObj) : el.dataset.laSay;
    });
    onAll('[data-la-say]', 'mouseout', () => {
      if (sentence) sentence.textContent = container.querySelector('[data-lab-verb]') ? this.labSentence() : 'Идти к LucasArts';
    });

    onAll('[data-steam-id]', 'click', (el, e) => {
      e.preventDefault();
      click();
      if (window.gameManager && window.gameManager.showInSteam) window.gameManager.showInSteam(el.dataset.steamId);
    });
    onAll('[data-cd-id]', 'click', (el, e) => {
      e.preventDefault();
      click();
      if (window.gameManager && window.gameManager.showOnCd) window.gameManager.showOnCd(el.dataset.cdId);
    });
    onAll('[data-launch-id]', 'click', (el, e) => {
      e.preventDefault();
      const gm = window.gameManager;
      const id = el.dataset.launchId;
      const entry = gm && gm.catalog && gm.catalog[id];
      if (entry && gm.isInstalled && gm.isInstalled(id) && entry.launch) entry.launch();
      else if (gm && gm.isCdDemo && gm.isCdDemo(id) && gm.showOnCd) gm.showOnCd(id);
      else if (gm && gm.showInSteam) gm.showInSteam(id);
    });
    onAll('[data-shot-game]', 'click', (el, e) => {
      e.preventDefault();
      this.activeShot[el.dataset.shotGame] = parseInt(el.dataset.shotIdx, 10) || 0;
      refresh();
    });

    on('#la-btn-poll-vote', () => {
      const checked = container.querySelector('input[name="la_poll_choice"]:checked');
      this.votePoll(checked ? checked.value : 'chicken');
      ding();
      refresh();
    });

    const artOf = el => this.data.articles.find(a => a.id === el.dataset.artId) || this.data.articles[0];
    const notepadBtn = container.querySelector('#la-btn-art-notepad');
    if (notepadBtn) notepadBtn.addEventListener('click', () => {
      const art = artOf(notepadBtn);
      if (window.appNotepad) window.appNotepad.open(art.file, this.articleText(art));
    });
    const saveBtn = container.querySelector('#la-btn-art-save');
    if (saveBtn) saveBtn.addEventListener('click', () => {
      const art = artOf(saveBtn);
      if (window.vfs && window.vfs.writeFile) {
        window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], art.file, this.articleText(art));
        ding();
        const status = container.querySelector('#la-art-save-status');
        if (status) status.textContent = `${art.file} сохранён в «Мои документы».`;
      }
    });
    const replyBtn = container.querySelector('#la-reply-submit');
    if (replyBtn) replyBtn.addEventListener('click', () => {
      const author = container.querySelector('#la-reply-author');
      const text = container.querySelector('#la-reply-text');
      if (this.addReply(replyBtn.dataset.artId, author ? author.value : '', text ? text.value : '')) {
        ding();
        refresh();
      }
    });

    const pressKey = key => {
      const action = this.keyMap[key];
      if (!action) return;
      click();
      if (action.url) go(action.url);
      else if (action.reveal) {
        this.revealHint(action.reveal);
        refresh();
      } else if (action.notepad && window.appNotepad) {
        window.appNotepad.open(this.data.hintBook[action.notepad].file, this.hintBookText(action.notepad));
      }
    };
    onAll('[data-la-key]', 'click', el => pressKey(el.dataset.laKey));
    onAll('[data-la-key-link]', 'click', (el, e) => { e.preventDefault(); pressKey(el.dataset.laKeyLink); });
    const hintNotepad = container.querySelector('#la-btn-hint-notepad');
    if (hintNotepad) hintNotepad.addEventListener('click', () => {
      const id = hintNotepad.dataset.hintFile;
      if (window.appNotepad && this.data.hintBook[id]) window.appNotepad.open(this.data.hintBook[id].file, this.hintBookText(id));
    });
    const hintSave = container.querySelector('#la-btn-hint-save');
    if (hintSave) hintSave.addEventListener('click', () => {
      const id = hintSave.dataset.hintFile;
      const book = this.data.hintBook[id];
      if (book && window.vfs && window.vfs.writeFile) {
        window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], book.file, this.hintBookText(id));
        ding();
        const status = container.querySelector('#la-hint-save-status');
        if (status) status.textContent = `${book.file} сохранён в «Мои документы».`;
      }
    });

    const labAct = (kind, id) => {
      const res = this.labClick(kind, id);
      click();
      if (res && res.go) {
        go(res.go);
        return;
      }
      if (this.lab.done) ding();
      go('/scumm');
    };
    onAll('[data-lab-verb]', 'click', el => labAct('verb', el.dataset.labVerb));
    onAll('[data-lab-item]', 'click', el => labAct('item', el.dataset.labItem));
    onAll('[data-lab-obj]', 'click', el => labAct('obj', el.dataset.labObj));
    container.querySelectorAll('#la-lab-reset').forEach(el => el.addEventListener('click', () => {
      this.resetLab();
      go('/scumm');
    }));

    on('#la-letter-submit', () => {
      const to = container.querySelector('#la-letter-to');
      const from = container.querySelector('#la-letter-from');
      const q = container.querySelector('#la-letter-q');
      const entry = this.submitLetter(to ? to.value : 'sammax', from ? from.value : '', q ? q.value : '');
      if (entry) {
        ding();
        go('/letters');
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.lucasartsSite = new LucasArtsSite();
}
