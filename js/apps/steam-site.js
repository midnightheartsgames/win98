class SteamSite {
  constructor() {
    this.baseUrl = 'http://www.steampowered.com';
  }

  get gm() {
    return typeof window !== 'undefined' ? window.gameManager : null;
  }

  sectionFromUrl(url) {
    const clean = (url || '').toLowerCase();
    if (clean.includes('/games')) return 'games';
    if (clean.includes('/faq')) return 'faq';
    return 'home';
  }

  clientState() {
    const gm = this.gm;
    if (!gm) return 'none';
    if (gm.isInstalled('steam')) return 'installed';
    if (gm.isDownloaded('steam')) return 'downloaded';
    return 'none';
  }

  renderSite(url) {
    const section = this.sectionFromUrl(url);
    const body = { home: () => this.renderHome(), games: () => this.renderGames(), faq: () => this.renderFaq() }[section]();
    const nav = [['home', '', 'Главная'], ['games', '/games', 'Игры'], ['faq', '/faq', 'Вопросы и ответы']];
    return `
      <div class="sps-page">
        <table class="sps-frame" cellspacing="0">
          <tr>
            <td colspan="2" class="sps-top">
              <div class="sps-logo">${window.Icons ? window.Icons['steam'] : ''}<span>STEAM</span></div>
            </td>
          </tr>
          <tr>
            <td class="sps-side">
              <div class="sps-nav">
                ${nav.map(([key, path, label]) => `<a data-url="${this.baseUrl}${path}" class="${key === section ? 'is-current' : ''}">${label}</a>`).join('')}
              </div>
              <div class="sps-side-box">
                <b>Steam</b><br>версия 1.0 beta<br>для Win 98<br><br>
                <a data-url="http://www.valvesoftware.com">Официальный узел Valve Software &raquo;</a>
              </div>
            </td>
            <td class="sps-main">${body}</td>
          </tr>
          <tr>
            <td colspan="2" class="sps-bottom">&copy; 2000 <a data-url="http://www.valvesoftware.com">Valve Software</a>. Все права защищены. Steam и логотип Steam &mdash; товарные знаки Valve.<br>Служба поддержки: <a href="mailto:support@steampowered.com">support@steampowered.com</a></td>
          </tr>
        </table>
      </div>`;
  }

  renderDownloadBox() {
    const state = this.clientState();
    const action = {
      none: '<button class="sps-dl" data-sps="download">Загрузить Steam</button><div class="sps-dl-note">SteamInstall.exe &middot; 1.3 МБ &middot; около 4 минут на модеме 56K</div>',
      downloaded: '<button class="sps-dl" data-sps="setup">Запустить SteamInstall.exe</button><div class="sps-dl-note">Установщик уже лежит в &laquo;Мои документы\\Downloads&raquo;.</div>',
      installed: '<button class="sps-dl" data-sps="launch">Открыть Steam</button><div class="sps-dl-note">Steam уже установлен на этом компьютере.</div>'
    }[state];
    return `<div class="sps-dl-box">${action}</div>`;
  }

  renderHome() {
    const ids = this.gm ? this.gm.getSteamGameIds() : [];
    const news = [
      ['12.11.2000', 'Каталог растёт', `В Steam уже <b>${ids.length}</b> игр. Смотрите <a data-url="${this.baseUrl}/games">полный список</a>.`],
      ['01.11.2000', 'Игры, которые приходят сами', 'Steam покупает, загружает и обновляет игры. Без коробок, дисков и поиска установщиков.'],
      ['20.10.2000', 'RetroGame Store закрыт', 'Все игры магазина переехали в Steam. Купленные лицензии ждут вас в разделе &laquo;Мои игры&raquo;.']
    ];
    return `
      <div class="sps-hero">
        <h1>Загрузите Steam</h1>
        <p>Steam &mdash; программа, через которую вы покупаете, загружаете и запускаете игры. Обновления ставятся сами, пока вы спите.</p>
        ${this.renderDownloadBox()}
      </div>
      <h2 class="sps-h2">Новости</h2>
      ${news.map(([date, title, text]) => `
      <div class="sps-news">
        <div class="sps-news-head"><span>${date}</span> ${title}</div>
        <p>${text}</p>
      </div>`).join('')}
      <h2 class="sps-h2">Как это работает</h2>
      <ol class="sps-steps">
        <li>Загрузите и установите клиент Steam.</li>
        <li>Откройте окно &laquo;Игры&raquo; и выберите игру из каталога.</li>
        <li>Оплатите картой или получите бесплатную игру.</li>
        <li>Steam сам загрузит игру и создаст ярлык на Рабочем столе.</li>
      </ol>
      <div class="sps-req">
        <b>Системные требования:</b> Win 98, Pentium 166, 32 МБ ОЗУ, модем 28.8K или быстрее, Internet Explorer 5.0.
      </div>`;
  }

  renderGames() {
    const gm = this.gm;
    const ids = gm ? gm.getSteamGameIds() : [];
    const rows = ids.map(id => {
      const g = gm.catalog[id];
      const price = g.price > 0 ? `$${g.price.toFixed(2)}` : 'бесплатно';
      return `<tr><td class="sps-game-title">${g.title}</td><td>${g.developer}</td><td class="sps-price">${price}</td></tr>`;
    }).join('');
    return `
      <div class="sps-inner">
        <h1>Игры в Steam</h1>
        <p>Покупка и загрузка — только в клиенте Steam: окно «Игры», раздел «Магазин Steam».</p>
        <table class="sps-table">
          <tr><th>Игра</th><th>Разработчик</th><th>Цена</th></tr>
          ${rows}
        </table>
        ${this.renderDownloadBox()}
      </div>`;
  }

  renderFaq() {
    const faq = [
      ['Нужен ли диск, чтобы играть?', 'Нет. Игра загружается целиком через Steam и запускается с Рабочего стола или из окна «Игры».'],
      ['Что будет, если связь оборвётся?', 'Загрузка встанет на паузу. Откройте игру в окне «Игры» снова — загрузка продолжится с того же места.'],
      ['У меня модем 28.8K. Это надолго?', 'Укажите тип подключения в «Настройках» Steam. Там же, в «Мониторе», можно ограничить скорость, чтобы не мешать ICQ.'],
      ['Как оплатить?', 'Картой Visa или MasterCard прямо в клиенте. Промокоды WIN98SE и CYBER1998 дают скидку 20%.'],
      ['Где мои старые игры с RetroGame Store?', 'Магазин закрыт, все его игры переехали в Steam. Купленные лицензии уже ждут вас в разделе «Мои игры».']
    ];
    return `
      <div class="sps-inner">
        <h1>Вопросы и ответы</h1>
        ${faq.map(([q, a]) => `<div class="sps-faq"><b>${q}</b><p>${a}</p></div>`).join('')}
        ${this.renderDownloadBox()}
      </div>`;
  }

  attachEvents(win, container) {
    const gm = this.gm;
    container.querySelectorAll('[data-sps]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick();
        const act = btn.dataset.sps;
        if (act === 'download' && gm) gm.startDownload('steam');
        if (act === 'setup' && gm) gm.openSetupWizard('steam');
        if (act === 'launch' && window.appSteam) window.appSteam.open();
      });
    });
  }
}

window.steamSite = new SteamSite();
