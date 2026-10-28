const STEAM_CONNECTIONS = [
  { id: 'modem28', label: 'Модем 28.8K', kbps: 26 },
  { id: 'modem56', label: 'Модем 56K', kbps: 48 },
  { id: 'isdn', label: 'ISDN 128K', kbps: 118 },
  { id: 'dsl', label: 'DSL / кабель 512K', kbps: 470 },
  { id: 't1', label: 'Локальная сеть / T1', kbps: 1380 }
];

const STEAM_LIMITS = [16, 32, 50, 100, 250];

const STEAM_CARD = { num: '4276 3800 1998 2024', exp: '12/28', cvv: '777', name: 'RETRO USER' };

const STEAM_PROMO_CODES = ['WIN98SE', 'CYBER1998'];

const STEAM_HOSTS = ['VALVE CONTENT SERVERS', 'ZONA-NET GAME SERVERS', 'CYBERNET 2000 HOSTING', 'МТУ-ИНТЕЛ ИГРОВОЙ УЗЕЛ'];

const STEAM_DEFAULT_FRIENDS = [
  { name: 'Stiffer', status: 'online' },
  { name: 'R2aD2 [MoD]', status: 'game', game: 'dota' },
  { name: 'Gordon_F', status: 'online' },
  { name: 'Vovan_EKB', status: 'game', game: 'gta90' },
  { name: 'FreelanceMax', status: 'game', game: 'sammax' },
  { name: 'MooGooGaiPan', status: 'game', game: 'sammax102' },
  { name: 'Mole_Man', status: 'game', game: 'sammax103' },
  { name: 'PapaBear_04', status: 'game', game: 'sammax104' },
  { name: 'Curt_286', status: 'game', game: 'sammax105' },
  { name: 'Rogatik_Red', status: 'game', game: 'sammax106' },
  { name: 'Elf_Intern', status: 'game', game: 'sammax201' },
  { name: 'Moai_Billy', status: 'online' },
  { name: 'Doc_88mph', status: 'game', game: 'bttf' },
  { name: 'Wirts_Leg', status: 'game', game: 'diablo2' },
  { name: 'Vilks_2105', status: 'game', game: 'forza' },
  { name: 'Tyoma_Avto', status: 'game', game: 'gtann' },
  { name: 'Bella_G', status: 'game', game: 'sims3' },
  { name: 'Rowland_XIII', status: 'online' },
  { name: 'Klesk_NN', status: 'game', game: 'quake3' },
  { name: 'Mona_S', status: 'online' },
  { name: 'Legatus_Iulius', status: 'game', game: 'legion' },
  { name: 'Oshpaz_Rustam', status: 'game', game: 'plov' },
  { name: 'Ryzhik_9', status: 'game', game: 'catniss' },
  { name: 'Kirill_2goda', status: 'online' },
  { name: 'Rokfor_Verdun', status: 'game', game: 'anotherwar' },
  { name: 'Kurier_147', status: 'online' },
  { name: 'Morph', status: 'online' },
  { name: 'LenaCat', status: 'offline' },
  { name: 'Serega_Voodoo2', status: 'offline' }
];

const STEAM_FRIEND_REPLIES = [
  'ок',
  'щас, только катку доиграю',
  'ты {game} уже скачал? у меня на модеме полдня качалось',
  'заходи вечером на сервер, после 23:00 интернет дешевле',
  'ага',
  'Steam опять что-то обновляет...',
  'погоди, мама телефон заняла, сейчас отвалюсь',
  'купи уже нормальный модем, US Robotics 56K рулит',
  'у тебя какой пинг? у меня 300, норм'
];

const STEAM_SERVER_MAPS = {
  doom: ['E1M1', 'E1M3', 'E1M5', 'E1M7'],
  serioussam: ['Hatshepsut', 'Sand Canyon', 'Valley of the Kings'],
  dota: ['DotA Allstars 6.48', 'DotA -ap', 'DotA -sd'],
  lol: ['Ущелье призывателей', 'Ущелье призывателей (боты)'],
  moh98: ['Бревиль', 'Лорьян', 'Рьюкан'],
  quake3: ['q3dm6', 'q3dm1', 'q3tourney2', 'q3dm3', 'q3dm4']
};

const STEAM_SERVER_NAMES = ['[RU] Нижний Новгород #1', 'Klan MoD — только свои', 'Fido 2:5020 Game Zone', 'ZONA-NET Public', 'Chelyabinsk Hardcore', 'Школа №12 после уроков', 'LAN Party 2000', 'Moscow Online 24/7'];

const STEAM_NEWS = [
  { date: '20.11.00', title: 'Покупки в играх', text: 'Игры теперь могут продавать дополнения через Steam. Окно оплаты открывается поверх игры, а товар приходит в игру сразу после списания. Первым это сделал Honkai: Star Rail 98 с «Пропуском снабжения экспресса».' },
  { date: '14.11.00', title: 'Steam открыт для всех', text: 'Сегодня клиент Steam стал доступен каждому. Покупайте игры, загружайте их напрямую с серверов контента и получайте обновления автоматически — без дисков и установщиков.' },
  { date: '02.11.00', title: 'Серверы контента в России', text: 'Подключены новые узлы в Москве и Нижнем Новгороде. Владельцы модемов 56K заметят прирост скорости загрузки в вечерние часы.' },
  { date: '27.10.00', title: 'Покупка по банковской карте', text: 'Теперь игры можно купить прямо в клиенте: выберите игру в окне «Игры» и оплатите картой Visa или MasterCard. Промокоды WIN98SE и CYBER1998 дают скидку 20%.' },
  { date: '19.10.00', title: 'Монитор сети', text: 'Новое окно «Монитор» показывает загрузки и использование канала. Если сеть нужна для ICQ, ограничьте скорость загрузки там же.' },
  { date: '05.10.00', title: 'Друзья и серверы', text: 'Добавляйте друзей, переписывайтесь и заходите на игровые серверы прямо из Steam.' }
];

const STEAM_GAME_SORTS = [
  { id: 'default', label: 'По умолчанию' },
  { id: 'nameAsc', label: 'По имени: А–Я' },
  { id: 'nameDesc', label: 'По имени: Я–А' },
  { id: 'priceAsc', label: 'По цене: сначала дешёвые' },
  { id: 'priceDesc', label: 'По цене: сначала дорогие' }
];

class AppSteam {
  constructor() {
    this.storageKey = 'win98_steam';
    this.settings = this.loadSettings();
    this.downloads = new Map();
    this.usageHistory = [];
    this.pausedAll = false;
    this.tickTimer = null;
    this.lastTick = 0;
    this.selectedGameId = null;
    this.chats = {};
    if (window.gameManager) {
      window.gameManager.addListener(() => this.refreshOpenWindows());
    }
  }

  loadSettings() {
    const defaults = { account: 'retro_user', connection: 'modem56', notify: true, limitEnabled: false, limitKbps: 32, extraFriends: [], gamesSort: 'default' };
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return Object.assign(defaults, JSON.parse(raw));
    } catch (e) {}
    return defaults;
  }

  saveSettings() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (e) {}
  }

  get gm() {
    return window.gameManager;
  }

  escape(text) {
    return String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  hash(text) {
    let h = 2166136261;
    for (const ch of String(text)) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    h ^= h >>> 15;
    h = Math.imul(h, 2246822507);
    h ^= h >>> 13;
    return h >>> 0;
  }

  playClick() {
    if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick();
  }

  getGame(id) {
    return this.gm && this.gm.isSteamGame(id) ? this.gm.catalog[id] : null;
  }

  getGameState(id) {
    if (this.gm.isInstalled(id)) return 'installed';
    if (this.downloads.has(id)) return 'downloading';
    if (this.gm.ownsOnSteam(id)) return 'owned';
    return 'store';
  }

  priceLabel(game) {
    return game.price > 0 ? `$${game.price.toFixed(2)}` : 'Бесплатно';
  }

  sizeInKB(game) {
    const match = /([\d.]+)\s*(GB|MB|KB)/i.exec(game.fileSize || '');
    if (!match) return 10240;
    const units = { GB: 1048576, MB: 1024, KB: 1 };
    return parseFloat(match[1]) * units[match[2].toUpperCase()];
  }

  formatSize(kb) {
    return kb >= 1048576 ? `${(kb / 1048576).toFixed(2)} ГБ` : `${(kb / 1024).toFixed(1)} МБ`;
  }

  lineKbps() {
    const conn = STEAM_CONNECTIONS.find(c => c.id === this.settings.connection) || STEAM_CONNECTIONS[1];
    return this.settings.limitEnabled ? Math.min(conn.kbps, this.settings.limitKbps) : conn.kbps;
  }

  releaseDate(id) {
    const h = this.hash(id);
    return `${String(1 + h % 28).padStart(2, '0')}.${String(1 + (h >>> 5) % 11).padStart(2, '0')}.00`;
  }

  openWindow(opts) {
    const isNew = !window.winManager.windows.has(opts.id);
    const win = window.winManager.createWindow(Object.assign({ icon: 'steam', maximizable: false }, opts));
    if (isNew) win.element.classList.add('steam-window');
    return { win, isNew };
  }

  bindClose(win, root) {
    root.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => window.winManager.closeWindow(win.id)));
  }

  open() {
    const { win, isNew } = this.openWindow({ id: 'steam_main', title: 'Steam', width: 410, height: 330, resizable: false });
    if (!isNew) return win;
    const rows = [
      ['games', 'Игры', 'Купить, загрузить и начать играть!'],
      ['friends', 'Друзья', 'Найти друзей, переписываться, играть вместе'],
      ['servers', 'Серверы', 'Сетевые игры, идущие прямо сейчас'],
      ['monitor', 'Монитор', 'Следить за загрузками и сетью Steam'],
      ['settings', 'Настройки', 'Изменить параметры Steam'],
      ['news', 'Новости', 'Последние новости Steam']
    ];
    win.bodyElement.innerHTML = `
      <div class="stm-body stm-main">
        <div class="stm-main-rows">
          ${rows.map(([key, label, desc]) => `
            <div class="stm-main-row">
              <button class="stm-btn stm-main-btn" data-open="${key}">${label}</button>
              <span>${desc}</span>
            </div>`).join('')}
        </div>
        <div class="stm-main-foot">
          <div class="stm-valve">VALVE</div>
          <button class="stm-btn stm-wide" data-close>Закрыть</button>
        </div>
      </div>`;
    const actions = {
      games: () => this.openGames(),
      friends: () => this.openFriends(),
      servers: () => this.openServers(),
      monitor: () => this.openMonitor(),
      settings: () => this.openSettings(),
      news: () => this.openNews()
    };
    win.bodyElement.querySelectorAll('[data-open]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.playClick();
        actions[btn.dataset.open]();
      });
    });
    this.bindClose(win, win.bodyElement);
    return win;
  }

  openGames(selectId) {
    if (selectId) this.selectedGameId = selectId;
    const { win } = this.openWindow({ id: 'steam_games', title: 'Игры', width: 340, height: 480, minWidth: 300, minHeight: 360, x: 70, y: 60 });
    this.renderGames(win);
    return win;
  }

  renderGames(win) {
    const ids = this.gm.getSteamGameIds();
    const sortKey = STEAM_GAME_SORTS.some(s => s.id === this.settings.gamesSort) ? this.settings.gamesSort : 'default';
    const mine = this.sortGameIds(ids.filter(id => this.getGameState(id) !== 'store'), sortKey);
    const store = this.sortGameIds(ids.filter(id => this.getGameState(id) === 'store'), sortKey);
    if (!this.selectedGameId || !ids.includes(this.selectedGameId)) this.selectedGameId = mine[0] || store[0];
    const list = win.bodyElement.querySelector('.stm-list');
    const scroll = list ? list.scrollTop : 0;
    const row = id => {
      const game = this.gm.catalog[id];
      const state = this.getGameState(id);
      const dl = this.downloads.get(id);
      const note = state === 'downloading' ? `${Math.floor(dl.doneKB / dl.totalKB * 100)}%${dl.paused ? ' пауза' : ''}`
        : state === 'owned' ? 'не установлена'
        : state === 'store' ? this.priceLabel(game) : '';
      const cls = ['stm-game-row', state === 'installed' ? 'is-ready' : 'is-dim', id === this.selectedGameId ? 'is-selected' : ''].join(' ');
      return `<div class="${cls}" data-game="${id}"><span class="stm-game-icon">${Icons[game.icon] || Icons['steam']}</span><span class="stm-game-title">${this.escape(game.title)}</span><span class="stm-game-note">${note}</span></div>`;
    };
    win.bodyElement.innerHTML = `
      <div class="stm-body stm-games">
        <div class="stm-inline stm-sort">
          <label>Сортировка:</label>
          <select class="stm-select" data-sort>${STEAM_GAME_SORTS.map(s => `<option value="${s.id}" ${s.id === sortKey ? 'selected' : ''}>${s.label}</option>`).join('')}</select>
        </div>
        <div class="stm-panel stm-list">
          <div class="stm-heading">Мои игры</div>
          ${mine.length ? mine.map(row).join('') : '<div class="stm-empty">Пока пусто. Выберите игру ниже.</div>'}
          <div class="stm-heading">Магазин Steam</div>
          ${store.length ? store.map(row).join('') : '<div class="stm-empty">Все игры уже в вашей библиотеке.</div>'}
        </div>
        <div class="stm-games-info">${this.renderGameInfo(this.selectedGameId)}</div>
      </div>`;
    win.bodyElement.querySelector('.stm-list').scrollTop = scroll;
    win.bodyElement.querySelector('[data-sort]').addEventListener('change', e => {
      this.settings.gamesSort = e.currentTarget.value;
      this.saveSettings();
      this.renderGames(win);
      win.bodyElement.querySelector('.stm-list').scrollTop = 0;
    });
    win.bodyElement.querySelectorAll('[data-game]').forEach(el => {
      const id = el.dataset.game;
      el.addEventListener('click', () => {
        this.selectedGameId = id;
        this.renderGames(win);
      });
      el.addEventListener('dblclick', () => this.primaryAction(id));
      el.addEventListener('contextmenu', e => {
        e.preventDefault();
        e.stopPropagation();
        this.selectedGameId = id;
        this.renderGames(win);
        this.showGameMenu(id, e.clientX, e.clientY);
      });
    });
    win.bodyElement.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.playClick();
        const id = btn.dataset.id;
        const act = btn.dataset.act;
        if (act === 'primary') this.primaryAction(id);
        if (act === 'uninstall') this.confirmUninstall(id);
        if (act === 'info') this.openDetails(id);
      });
    });
  }

  sortGameIds(ids, sortKey) {
    const title = id => this.gm.catalog[id].title;
    const price = id => this.gm.catalog[id].price || 0;
    const byName = (a, b) => title(a).localeCompare(title(b), 'ru', { sensitivity: 'base', numeric: true });
    const installedFirst = (a, b) => (this.getGameState(a) === 'installed' ? 0 : 1) - (this.getGameState(b) === 'installed' ? 0 : 1);
    const compare = {
      default: installedFirst,
      nameAsc: byName,
      nameDesc: (a, b) => byName(b, a),
      priceAsc: (a, b) => price(a) - price(b) || byName(a, b),
      priceDesc: (a, b) => price(b) - price(a) || byName(a, b)
    }[sortKey];
    return ids.slice().sort(compare);
  }

  primaryLabel(id) {
    const game = this.getGame(id);
    return { installed: 'Играть', downloading: 'Ход загрузки', owned: 'Загрузить', store: game.price > 0 ? 'Купить' : 'Получить' }[this.getGameState(id)];
  }

  statusLabel(id) {
    const game = this.getGame(id);
    const dl = this.downloads.get(id);
    const size = this.formatSize(this.sizeInKB(game));
    return {
      installed: 'Установлена — готова к запуску',
      downloading: dl ? `Загрузка: ${this.formatSize(dl.doneKB)} из ${this.formatSize(dl.totalKB)}` : '',
      owned: `В библиотеке, не установлена (${size})`,
      store: `Цена: ${this.priceLabel(game)} • ${size}`
    }[this.getGameState(id)];
  }

  renderGameInfo(id) {
    const game = this.getGame(id);
    if (!game) return '';
    const uninstall = this.getGameState(id) === 'installed' ? `<button class="stm-btn" data-act="uninstall" data-id="${id}">Удалить</button>` : '';
    return `
      <div class="stm-info-title">${this.escape(game.title)}</div>
      <div class="stm-dim">${this.escape(game.developer)}</div>
      <div class="stm-info-status">${this.statusLabel(id)}</div>
      <div class="stm-info-actions">
        <button class="stm-btn stm-wide" data-act="primary" data-id="${id}">${this.primaryLabel(id)}</button>
        <button class="stm-btn" data-act="info" data-id="${id}">Подробнее</button>
        ${uninstall}
      </div>`;
  }

  primaryAction(id) {
    const state = this.getGameState(id);
    if (state === 'installed') this.launchGame(id);
    else if (state === 'downloading') this.startDownload(id);
    else if (state === 'owned') this.startDownload(id);
    else this.openBuy(id);
  }

  showGameMenu(id, x, y) {
    if (!window.contextMenu) return;
    const state = this.getGameState(id);
    window.contextMenu.show(x, y, [
      { label: 'Играть', bold: state === 'installed', disabled: state !== 'installed', action: () => this.launchGame(id) },
      { label: state === 'downloading' ? 'Ход загрузки' : 'Загрузить', disabled: state === 'store' || state === 'installed', action: () => this.startDownload(id) },
      { label: 'Купить...', disabled: state !== 'store', action: () => this.openBuy(id) },
      { separator: true },
      { label: 'Удалить локальные файлы', disabled: state !== 'installed', action: () => this.confirmUninstall(id) },
      { label: 'Подробнее', action: () => this.openDetails(id) }
    ]);
  }

  launchGame(id) {
    const game = this.getGame(id);
    if (game && this.gm.isInstalled(id)) game.launch();
  }

  confirmUninstall(id) {
    const game = this.getGame(id);
    window.winManager.openDialog({
      title: 'Steam',
      icon: 'warning',
      message: `Удалить локальные файлы игры «${this.escape(game.title)}»?<br>Игра останется в вашей библиотеке, её можно будет загрузить снова.`,
      buttons: [
        { text: 'Удалить', primary: true, action: () => this.gm.uninstallGame(id) },
        { text: 'Отмена' }
      ]
    });
  }

  openBuy(id) {
    const game = this.getGame(id);
    if (!game) return null;
    if (this.getGameState(id) !== 'store') return this.openDetails(id);
    const paid = game.price > 0;
    const { win, isNew } = this.openWindow({ id: `steam_buy_${id}`, title: `Покупка: ${game.title}`, width: 440, height: paid ? 500 : 330, resizable: false, x: 180, y: 70 });
    if (!isNew) return win;
    const body = win.bodyElement;
    body.innerHTML = `
      <div class="stm-body stm-buy">
        <div class="stm-head">
          <div class="stm-head-icon">${Icons[game.icon] || Icons['steam']}</div>
          <div>
            <div class="stm-info-title">${this.escape(game.title)}</div>
            <div class="stm-dim">${this.escape(game.subtitle || '')}</div>
            <div class="stm-dim">${this.escape(game.developer)} • ${this.formatSize(this.sizeInKB(game))}</div>
          </div>
        </div>
        <div class="stm-panel stm-buy-desc">${this.escape(game.desc)}</div>
        <div class="stm-buy-price">Цена: <b data-price>${this.priceLabel(game)}</b></div>
        ${paid ? `
          <div class="stm-form">
            <label>Номер карты</label><input class="stm-input" data-f="num" maxlength="19" placeholder="0000 0000 0000 0000">
            <label>Срок (ММ/ГГ)</label><input class="stm-input stm-short" data-f="exp" maxlength="5">
            <label>CVV</label><input class="stm-input stm-short" data-f="cvv" type="password" maxlength="3">
            <label>Владелец</label><input class="stm-input" data-f="name">
            <label>Промокод</label><span class="stm-promo"><input class="stm-input" data-f="promo"><button class="stm-btn" data-promo>Применить</button></span>
          </div>
          <button class="stm-btn stm-fill" data-fill>Взять данные из «Банковская карта и сайты.txt»</button>` : ''}
        <label class="stm-check"><input type="checkbox" data-dlnow checked> Начать загрузку сразу после покупки</label>
        <div class="stm-status" data-status></div>
        <div class="stm-foot">
          <button class="stm-btn stm-wide" data-buy>${paid ? 'Купить' : 'Добавить в «Мои игры»'}</button>
          <button class="stm-btn stm-wide" data-close>Отмена</button>
        </div>
      </div>`;
    this.bindClose(win, body);
    const field = name => body.querySelector(`[data-f="${name}"]`);
    const status = body.querySelector('[data-status]');
    const setStatus = (text, bad) => {
      status.textContent = text;
      status.classList.toggle('is-bad', !!bad);
    };
    let discount = 0;
    if (paid) {
      body.querySelector('[data-fill]').addEventListener('click', () => {
        this.playClick();
        Object.entries(STEAM_CARD).forEach(([k, v]) => { field(k).value = v; });
        setStatus('Данные карты вставлены из «Моих документов».');
      });
      body.querySelector('[data-promo]').addEventListener('click', () => {
        if (STEAM_PROMO_CODES.includes(field('promo').value.trim().toUpperCase())) {
          discount = 0.2;
          body.querySelector('[data-price]').innerHTML = `<s>${this.priceLabel(game)}</s> $${(game.price * 0.8).toFixed(2)}`;
          setStatus('Промокод принят: скидка 20%.');
          if (window.soundSys) window.soundSys.playDing();
        } else {
          setStatus('Неизвестный промокод.', true);
          if (window.soundSys) window.soundSys.playError();
        }
      });
    }
    const buyBtn = body.querySelector('[data-buy]');
    buyBtn.addEventListener('click', () => {
      if (paid) {
        if (field('num').value.replace(/\s+/g, '').length !== 16) return setStatus('Введите 16-значный номер карты.', true);
        if (!/^\d\d\/\d\d$/.test(field('exp').value.trim())) return setStatus('Введите срок действия в формате ММ/ГГ.', true);
        if (field('cvv').value.trim().length !== 3) return setStatus('Введите 3-значный код CVV.', true);
      }
      const downloadNow = body.querySelector('[data-dlnow]').checked;
      buyBtn.disabled = true;
      setStatus(paid ? 'Соединение с сервером Steam...' : 'Регистрация лицензии...');
      setTimeout(() => {
        if (paid) setStatus(`Авторизация карты... списание $${(game.price * (1 - discount)).toFixed(2)}`);
        setTimeout(() => {
          this.gm.purchaseGame(id);
          if (window.soundSys) window.soundSys.playDing();
          window.winManager.closeWindow(win.id);
          this.selectedGameId = id;
          if (downloadNow) this.startDownload(id);
          else this.openGames(id);
        }, paid ? 900 : 300);
      }, 600);
    });
    return win;
  }

  orders() {
    if (!Array.isArray(this.settings.orders)) this.settings.orders = [];
    return this.settings.orders;
  }

  recordOrder(gameId, offer) {
    const order = { id: 'T' + Date.now().toString(36).toUpperCase() + (this.hash(offer.sku + Math.random()) % 46656).toString(36).toUpperCase(), game: gameId, sku: offer.sku, title: offer.title, price: offer.price, at: Date.now(), taken: 0 };
    this.orders().push(order);
    this.saveSettings();
    return order;
  }

  takeOrders(gameId, skus) {
    const list = this.orders().filter(o => o.game === gameId && !o.taken && (!skus || skus.includes(o.sku)));
    if (!list.length) return [];
    list.forEach(o => { o.taken = Date.now(); });
    this.saveSettings();
    return list.map(o => ({ id: o.id, sku: o.sku }));
  }

  openInGameBuy(gameId, offer, onPaid) {
    const game = this.getGame(gameId);
    if (!game || !offer) return 'none';
    if (!this.gm.isInstalled('steam')) {
      this.gm.showInSteam(gameId);
      return 'nosteam';
    }
    const { win, isNew } = this.openWindow({ id: `steam_txn_${offer.sku}`, title: `Покупка в игре: ${game.title}`, width: 440, height: 470, resizable: false, x: 200, y: 60 });
    if (!isNew) return 'open';
    const body = win.bodyElement;
    body.innerHTML = `
      <div class="stm-body stm-buy">
        <div class="stm-head">
          <div class="stm-head-icon">${Icons[game.icon] || Icons['steam']}</div>
          <div>
            <div class="stm-info-title">${this.escape(offer.title)}</div>
            <div class="stm-dim">Покупка в игре «${this.escape(game.title)}»</div>
            <div class="stm-dim">Учётная запись Steam: ${this.escape(this.settings.account)}</div>
          </div>
        </div>
        <div class="stm-panel stm-buy-desc">${this.escape(offer.text || '')}</div>
        <div class="stm-buy-price">К оплате: <b>$${offer.price.toFixed(2)}</b></div>
        <div class="stm-form">
          <label>Номер карты</label><input class="stm-input" data-f="num" maxlength="19" placeholder="0000 0000 0000 0000">
          <label>Срок (ММ/ГГ)</label><input class="stm-input stm-short" data-f="exp" maxlength="5">
          <label>CVV</label><input class="stm-input stm-short" data-f="cvv" type="password" maxlength="3">
          <label>Владелец</label><input class="stm-input" data-f="name">
        </div>
        <button class="stm-btn stm-fill" data-fill>Взять данные из «Банковская карта и сайты.txt»</button>
        <div class="stm-dim">Промокоды не действуют на покупки в играх. Товар придёт в игру сразу после оплаты.</div>
        <div class="stm-status" data-status></div>
        <div class="stm-foot">
          <button class="stm-btn stm-wide" data-pay>Оплатить</button>
          <button class="stm-btn stm-wide" data-close>Отмена</button>
        </div>
      </div>`;
    this.bindClose(win, body);
    const field = name => body.querySelector(`[data-f="${name}"]`);
    const status = body.querySelector('[data-status]');
    const setStatus = (text, bad) => {
      status.textContent = text;
      status.classList.toggle('is-bad', !!bad);
    };
    body.querySelector('[data-fill]').addEventListener('click', () => {
      this.playClick();
      Object.entries(STEAM_CARD).forEach(([k, v]) => { field(k).value = v; });
      setStatus('Данные карты вставлены из «Моих документов».');
    });
    const payBtn = body.querySelector('[data-pay]');
    payBtn.addEventListener('click', () => {
      if (field('num').value.replace(/\s+/g, '').length !== 16) return setStatus('Введите 16-значный номер карты.', true);
      if (!/^\d\d\/\d\d$/.test(field('exp').value.trim())) return setStatus('Введите срок действия в формате ММ/ГГ.', true);
      if (field('cvv').value.trim().length !== 3) return setStatus('Введите 3-значный код CVV.', true);
      payBtn.disabled = true;
      setStatus('Соединение с сервером Steam...');
      setTimeout(() => {
        setStatus(`Авторизация карты... списание $${offer.price.toFixed(2)}`);
        setTimeout(() => {
          this.recordOrder(gameId, offer);
          if (window.soundSys) window.soundSys.playDing();
          window.winManager.closeWindow(win.id);
          if (onPaid) onPaid();
        }, 900);
      }, 600);
    });
    return 'open';
  }

  screenshots(id) {
    return this.getGame(id).shots.map((caption, i) => ({ src: `content/steam/${id}-${i + 1}.jpg`, caption }));
  }

  openDetails(id) {
    const game = this.getGame(id);
    if (!game) return null;
    const { win, isNew } = this.openWindow({ id: `steam_details_${id}`, title: game.title, width: 440, height: 500, resizable: false, x: 160, y: 50 });
    if (!isNew) return win;
    const body = win.bodyElement;
    body.innerHTML = `
      <div class="stm-body stm-details">
        <div class="stm-head">
          <div class="stm-head-icon">${Icons[game.icon] || Icons['steam']}</div>
          <div>
            <div class="stm-info-title">${this.escape(game.title)}</div>
            <div class="stm-dim">${this.escape(game.subtitle || '')}</div>
            <div class="stm-dim">${this.escape(game.developer)}</div>
          </div>
        </div>
        <div class="stm-shots">
          ${this.screenshots(id).map((shot, i) => `<button class="stm-shot" data-shot="${i}" title="Открыть снимок"><img src="${shot.src}" alt=""><span>${this.escape(shot.caption)}</span></button>`).join('')}
        </div>
        <div class="stm-facts">
          <span class="stm-dim">Жанр</span><span>${this.escape(game.genre)}</span>
          <span class="stm-dim">Метки</span><span class="stm-tags">${game.tags.map(tag => `<span class="stm-tag">${this.escape(tag)}</span>`).join('')}</span>
        </div>
        <div class="stm-panel stm-details-desc">${this.escape(game.desc)}</div>
        <div class="stm-foot">
          <span class="stm-info-status stm-details-status" data-dstatus></span>
          <button class="stm-btn stm-wide" data-dprimary></button>
          <button class="stm-btn stm-wide" data-close>Закрыть</button>
        </div>
      </div>`;
    this.bindClose(win, body);
    body.querySelectorAll('[data-shot]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.playClick();
        this.openScreenshot(id, Number(btn.dataset.shot));
      });
      btn.querySelector('img').addEventListener('error', e => {
        btn.disabled = true;
        btn.removeAttribute('title');
        const note = document.createElement('i');
        note.textContent = 'Снимок недоступен';
        e.currentTarget.replaceWith(note);
      });
    });
    body.querySelector('[data-dprimary]').addEventListener('click', () => {
      this.playClick();
      this.primaryAction(id);
    });
    this.renderDetailsState(id);
    return win;
  }

  renderDetailsState(id) {
    const win = window.winManager.windows.get(`steam_details_${id}`);
    if (!win) return;
    const status = win.bodyElement.querySelector('[data-dstatus]');
    if (!status) return;
    status.textContent = this.statusLabel(id);
    win.bodyElement.querySelector('[data-dprimary]').textContent = this.primaryLabel(id);
  }

  openScreenshot(id, index) {
    const game = this.getGame(id);
    if (!game || !game.shots[index]) return null;
    const width = Math.min(670, window.innerWidth - 20);
    const height = Math.min(558, window.innerHeight - 50);
    const { win, isNew } = this.openWindow({ id: 'steam_shot', title: game.title, width, height, minWidth: 320, minHeight: 280, x: 60, y: 20 });
    this.viewer = { id, index };
    if (isNew) {
      const body = win.bodyElement;
      body.innerHTML = `
        <div class="stm-body stm-viewer" tabindex="-1">
          <div class="stm-panel stm-viewer-frame"><img data-vimg alt=""></div>
          <div class="stm-row">
            <span class="stm-viewer-caption" data-vcaption></span>
            <span class="stm-inline">
              <button class="stm-btn" data-vstep="-1">Назад</button>
              <button class="stm-btn" data-vstep="1">Далее</button>
              <button class="stm-btn stm-wide" data-close>Закрыть</button>
            </span>
          </div>
        </div>`;
      this.bindClose(win, body);
      body.querySelectorAll('[data-vstep]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.playClick();
          this.stepScreenshot(Number(btn.dataset.vstep));
        });
      });
      win.element.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') this.stepScreenshot(-1);
        if (e.key === 'ArrowRight') this.stepScreenshot(1);
        if (e.key === 'Escape') window.winManager.closeWindow(win.id);
      });
    }
    this.renderScreenshot();
    return win;
  }

  stepScreenshot(delta) {
    const last = this.screenshots(this.viewer.id).length - 1;
    this.viewer.index = Math.min(last, Math.max(0, this.viewer.index + delta));
    this.renderScreenshot();
  }

  renderScreenshot() {
    const win = window.winManager.windows.get('steam_shot');
    if (!win) return;
    const { id, index } = this.viewer;
    const shots = this.screenshots(id);
    const body = win.bodyElement;
    const img = body.querySelector('[data-vimg]');
    img.src = shots[index].src;
    img.alt = shots[index].caption;
    body.querySelector('[data-vcaption]').textContent = shots[index].caption;
    body.querySelector('[data-vstep="-1"]').disabled = index === 0;
    body.querySelector('[data-vstep="1"]').disabled = index === shots.length - 1;
    window.winManager.setTitle(win.id, `${this.getGame(id).title} — снимок ${index + 1} из ${shots.length}`);
    const focused = document.activeElement;
    if (!win.element.contains(focused) || focused.disabled) body.querySelector('.stm-viewer').focus();
  }

  startDownload(id) {
    const game = this.getGame(id);
    if (!game || this.gm.isInstalled(id) || !this.gm.ownsOnSteam(id)) return null;
    let dl = this.downloads.get(id);
    if (!dl) {
      dl = { id, doneKB: 0, totalKB: this.sizeInKB(game), paused: false, autoLaunch: false, kbps: 0 };
      this.downloads.set(id, dl);
    }
    dl.paused = false;
    this.ensureTicking();
    this.refreshOpenWindows();
    return this.openUpdate(id);
  }

  openUpdate(id) {
    const game = this.getGame(id);
    const { win, isNew } = this.openWindow({ id: `steam_update_${id}`, title: `Обновление ${game.title}`, width: 380, height: 470, minWidth: 320, minHeight: 380, x: 120, y: 90 });
    if (!isNew) {
      this.renderUpdateProgress(id);
      return win;
    }
    const sentences = game.desc.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 6);
    const host = STEAM_HOSTS[this.hash(id) % STEAM_HOSTS.length];
    win.bodyElement.innerHTML = `
      <div class="stm-body stm-update">
        <div class="stm-update-status" data-ustatus>Подготовка к запуску ${this.escape(game.title)}...</div>
        <div class="stm-progress"><div class="stm-progress-bar" data-ubar></div></div>
        <div class="stm-dim" data-umeta></div>
        <label class="stm-check"><input type="checkbox" data-autolaunch> Запустить игру, как только она будет готова</label>
        <div class="stm-update-actions">
          <button class="stm-btn stm-wide" data-play disabled>Играть</button>
          <button class="stm-btn stm-wide" data-ucancel>Отмена</button>
        </div>
        <div class="stm-panel stm-notes">
          <div class="stm-note-head"><span class="stm-gold">[-] ${this.releaseDate(id)}</span> — текущий выпуск</div>
          <div class="stm-note-sub">СОДЕРЖИМОЕ ВЫПУСКА:</div>
          <ul>${sentences.map(s => `<li>${this.escape(s)}</li>`).join('')}</ul>
          <div class="stm-note-head"><span class="stm-gold">[+]</span> ${this.escape(game.developer)}</div>
        </div>
        <div class="stm-dim">Хостинг контента предоставлен:</div>
        <div class="stm-host">${host}</div>
      </div>`;
    const body = win.bodyElement;
    const auto = body.querySelector('[data-autolaunch]');
    const dl = this.downloads.get(id);
    auto.checked = !!(dl && dl.autoLaunch);
    auto.addEventListener('change', () => {
      const current = this.downloads.get(id);
      if (current) current.autoLaunch = auto.checked;
    });
    body.querySelector('[data-play]').addEventListener('click', () => {
      window.winManager.closeWindow(win.id);
      this.launchGame(id);
    });
    body.querySelector('[data-ucancel]').addEventListener('click', () => {
      const current = this.downloads.get(id);
      if (current) current.paused = true;
      window.winManager.closeWindow(win.id);
      this.refreshOpenWindows();
    });
    this.renderUpdateProgress(id);
    return win;
  }

  renderUpdateProgress(id) {
    const win = window.winManager.windows.get(`steam_update_${id}`);
    if (!win) return;
    const body = win.bodyElement;
    const bar = body.querySelector('[data-ubar]');
    if (!bar) return;
    const game = this.gm.catalog[id];
    const dl = this.downloads.get(id);
    const done = this.gm.isInstalled(id);
    const ratio = done ? 1 : dl ? dl.doneKB / dl.totalKB : 0;
    bar.style.width = `${(ratio * 100).toFixed(1)}%`;
    body.querySelector('[data-play]').disabled = !done;
    body.querySelector('[data-ucancel]').textContent = done ? 'Закрыть' : 'Отмена';
    body.querySelector('[data-ustatus]').textContent = done ? `${game.title} готова к запуску.`
      : dl && (dl.paused || this.pausedAll) ? 'Загрузка приостановлена.'
      : `Подготовка к запуску ${game.title}...`;
    body.querySelector('[data-umeta]').textContent = done ? 'Все файлы загружены и проверены.'
      : dl ? `${this.formatSize(dl.doneKB)} из ${this.formatSize(dl.totalKB)} • ${dl.kbps.toFixed(1)} kb/s` : '';
  }

  downloadDurationSeconds(totalKB, kbps) {
    return Math.min(30, Math.max(5, totalKB * 8 / kbps / 120));
  }

  ensureTicking() {
    if (this.tickTimer) return;
    this.lastTick = Date.now();
    this.tickTimer = setInterval(() => this.tick(), 250);
  }

  tick() {
    const now = Date.now();
    const dt = Math.min(1, (now - this.lastTick) / 1000);
    this.lastTick = now;
    const active = [...this.downloads.values()].filter(dl => !dl.paused && !this.pausedAll);
    const line = this.lineKbps();
    let total = 0;
    for (const dl of this.downloads.values()) dl.kbps = 0;
    for (const dl of active) {
      const share = line / active.length;
      dl.kbps = share * (0.86 + Math.random() * 0.18);
      total += dl.kbps;
      const rate = dl.totalKB / this.downloadDurationSeconds(dl.totalKB, line) / active.length;
      dl.doneKB = Math.min(dl.totalKB, dl.doneKB + rate * dt);
      if (dl.doneKB >= dl.totalKB) this.completeDownload(dl);
    }
    this.usageHistory.push(total);
    if (this.usageHistory.length > 1200) this.usageHistory.shift();
    for (const id of this.downloads.keys()) {
      this.renderUpdateProgress(id);
      this.renderDetailsState(id);
    }
    this.updateGamesProgress();
    this.renderMonitorLive();
    if (!this.downloads.size && !window.winManager.windows.has('steam_monitor')) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  completeDownload(dl) {
    const game = this.gm.catalog[dl.id];
    this.downloads.delete(dl.id);
    this.gm.finishInstallation(dl.id);
    this.renderUpdateProgress(dl.id);
    if (window.soundSys) window.soundSys.playDing();
    if (dl.autoLaunch) {
      window.winManager.closeWindow(`steam_update_${dl.id}`);
      setTimeout(() => this.launchGame(dl.id), 300);
    } else if (this.settings.notify && !window.winManager.windows.has(`steam_update_${dl.id}`)) {
      window.winManager.openDialog({
        title: 'Steam',
        icon: 'info',
        message: `Игра «${this.escape(game.title)}» загружена и готова к запуску.`,
        buttons: [
          { text: 'Играть', primary: true, action: () => this.launchGame(dl.id) },
          { text: 'Позже' }
        ]
      });
    }
  }

  updateGamesProgress() {
    const win = window.winManager.windows.get('steam_games');
    if (!win) return;
    for (const [id, dl] of this.downloads) {
      const note = win.bodyElement.querySelector(`[data-game="${id}"] .stm-game-note`);
      if (note) note.textContent = `${Math.floor(dl.doneKB / dl.totalKB * 100)}%${dl.paused ? ' пауза' : ''}`;
      if (id === this.selectedGameId) {
        const status = win.bodyElement.querySelector('.stm-info-status');
        if (status) status.textContent = this.statusLabel(id);
      }
    }
  }

  refreshOpenWindows() {
    if (!window.winManager) return;
    const games = window.winManager.windows.get('steam_games');
    if (games) this.renderGames(games);
    const monitor = window.winManager.windows.get('steam_monitor');
    if (monitor) this.renderMonitorLive();
    for (const id of this.gm.getSteamGameIds()) this.renderDetailsState(id);
  }

  openMonitor() {
    const { win, isNew } = this.openWindow({ id: 'steam_monitor', title: 'Монитор Steam', width: 500, height: 440, resizable: false, x: 260, y: 30 });
    if (!isNew) return win;
    const body = win.bodyElement;
    body.innerHTML = `
      <div class="stm-body stm-monitor">
        <div class="stm-panel stm-table">
          <div class="stm-table-head"><span>Игра</span><span>Статус</span></div>
          <div data-mrows></div>
        </div>
        <div class="stm-graph">
          <div class="stm-graph-axis"><span data-mmax>64</span><span>kb/s</span><span>0</span></div>
          <canvas width="420" height="120" data-mcanvas></canvas>
        </div>
        <div class="stm-row">
          <span class="stm-usage">${Icons['steam']}<span>Использование сети Steam: <b data-musage>0.0 kb/s</b></span></span>
          <span class="stm-inline">Показывать последние <select class="stm-select" data-mrange><option value="240">1 минуту</option><option value="1200" selected>5 минут</option></select></span>
        </div>
        <div class="stm-row">
          <button class="stm-btn" data-mpause>${this.pausedAll ? 'Продолжить все загрузки' : 'Приостановить все загрузки'}</button>
          <span class="stm-inline"><label class="stm-check"><input type="checkbox" data-mlimit ${this.settings.limitEnabled ? 'checked' : ''}> Ограничить скорость до</label>
          <select class="stm-select" data-mlimitval>${STEAM_LIMITS.map(v => `<option value="${v}" ${v === this.settings.limitKbps ? 'selected' : ''}>${v} kb/s</option>`).join('')}</select></span>
        </div>
        <div class="stm-row">
          <div class="stm-ad"><b>ZONA-NET</b> игровые серверы<br><span>Пинг 40 мс по всей Москве!</span></div>
          <button class="stm-btn stm-wide" data-close>Закрыть</button>
        </div>
      </div>`;
    this.bindClose(win, body);
    body.querySelector('[data-mrange]').addEventListener('change', () => this.renderMonitorLive());
    body.querySelector('[data-mpause]').addEventListener('click', e => {
      this.pausedAll = !this.pausedAll;
      e.currentTarget.textContent = this.pausedAll ? 'Продолжить все загрузки' : 'Приостановить все загрузки';
      this.refreshOpenWindows();
      for (const id of this.downloads.keys()) this.renderUpdateProgress(id);
    });
    body.querySelector('[data-mlimit]').addEventListener('change', e => {
      this.settings.limitEnabled = e.currentTarget.checked;
      this.saveSettings();
    });
    body.querySelector('[data-mlimitval]').addEventListener('change', e => {
      this.settings.limitKbps = Number(e.currentTarget.value);
      this.saveSettings();
    });
    this.ensureTicking();
    this.renderMonitorLive();
    return win;
  }

  renderMonitorLive() {
    const win = window.winManager && window.winManager.windows.get('steam_monitor');
    if (!win) return;
    const body = win.bodyElement;
    const rows = body.querySelector('[data-mrows]');
    if (!rows) return;
    const entries = [...this.downloads.values()];
    rows.innerHTML = entries.length ? entries.map(dl => {
      const status = dl.paused || this.pausedAll ? 'Пауза' : `${dl.kbps.toFixed(1)} kb/s`;
      return `<div class="stm-table-row"><span>${this.escape(this.gm.catalog[dl.id].title)}</span><span>${status} (${Math.floor(dl.doneKB / dl.totalKB * 100)}%)</span></div>`;
    }).join('') : '<div class="stm-table-row stm-dim"><span>Нет активных загрузок</span><span></span></div>';
    const last = this.usageHistory.length ? this.usageHistory[this.usageHistory.length - 1] : 0;
    body.querySelector('[data-musage]').textContent = `${last.toFixed(1)} kb/s`;
    const canvas = body.querySelector('[data-mcanvas]');
    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;
    const range = Number(body.querySelector('[data-mrange]').value);
    const samples = this.usageHistory.slice(-range);
    const peak = Math.max(this.lineKbps(), ...samples, 8);
    const scaleMax = [16, 32, 64, 128, 256, 512, 1024, 2048].find(v => v >= peak) || 2048;
    body.querySelector('[data-mmax]').textContent = scaleMax;
    ctx.fillStyle = '#3e4637';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#4c5844';
    for (let y = 30; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
      ctx.stroke();
    }
    const barCount = 84;
    const bucket = Math.max(1, Math.floor(range / barCount));
    const barW = canvas.width / barCount;
    ctx.fillStyle = '#c4b550';
    for (let i = 0; i < barCount; i++) {
      const end = samples.length - (barCount - 1 - i) * bucket;
      const slice = samples.slice(Math.max(0, end - bucket), Math.max(0, end));
      if (!slice.length) continue;
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      const h = Math.round(avg / scaleMax * (canvas.height - 4));
      if (h > 0) ctx.fillRect(Math.floor(i * barW) + 1, canvas.height - h, Math.max(1, Math.floor(barW) - 2), h);
    }
  }

  allFriends() {
    return STEAM_DEFAULT_FRIENDS.concat(this.settings.extraFriends.map(name => ({ name, status: 'pending' })));
  }

  friendStatus(friend) {
    if (friend.status === 'game') {
      const game = this.gm.catalog[friend.game];
      return `Играет: ${game ? game.title : 'игра'}`;
    }
    return { online: 'В сети', offline: 'Не в сети', pending: 'Ожидает подтверждения' }[friend.status];
  }

  openFriends() {
    const { win } = this.openWindow({ id: 'steam_friends', title: `Друзья — ${this.settings.account}`, width: 290, height: 400, minWidth: 250, minHeight: 300, x: 520, y: 80 });
    this.renderFriends(win);
    return win;
  }

  renderFriends(win) {
    const friends = this.allFriends();
    const online = friends.filter(f => f.status === 'online' || f.status === 'game');
    const offline = friends.filter(f => f.status === 'offline' || f.status === 'pending');
    const row = f => `<div class="stm-friend ${f.status === 'online' || f.status === 'game' ? 'is-ready' : 'is-dim'}" data-friend="${this.escape(f.name)}"><span class="stm-friend-name">${this.escape(f.name)}</span><span class="stm-friend-status">${this.friendStatus(f)}</span></div>`;
    win.bodyElement.innerHTML = `
      <div class="stm-body stm-friends">
        <div class="stm-panel stm-list">
          <div class="stm-heading">В сети (${online.length})</div>
          ${online.map(row).join('')}
          <div class="stm-heading">Не в сети (${offline.length})</div>
          ${offline.map(row).join('')}
        </div>
        <div class="stm-add-friend">
          <input class="stm-input" data-newfriend placeholder="Имя пользователя Steam" maxlength="24">
          <button class="stm-btn" data-addfriend>Добавить</button>
        </div>
        <div class="stm-dim">Дважды щёлкните по другу, чтобы написать ему.</div>
      </div>`;
    win.bodyElement.querySelectorAll('[data-friend]').forEach(el => {
      el.addEventListener('dblclick', () => {
        const friend = friends.find(f => f.name === el.dataset.friend);
        if (friend.status === 'online' || friend.status === 'game') this.openChat(friend);
        else window.winManager.openDialog({ title: 'Steam', icon: 'info', message: `${this.escape(friend.name)} сейчас не в сети.` });
      });
    });
    const input = win.bodyElement.querySelector('[data-newfriend]');
    win.bodyElement.querySelector('[data-addfriend]').addEventListener('click', () => {
      const name = input.value.trim();
      if (!name || friends.some(f => f.name.toLowerCase() === name.toLowerCase())) return;
      this.settings.extraFriends.push(name);
      this.saveSettings();
      this.renderFriends(win);
    });
  }

  openChat(friend) {
    const winId = `steam_im_${this.hash(friend.name)}`;
    const { win, isNew } = this.openWindow({ id: winId, title: `${friend.name} — сообщение`, width: 380, height: 330, minWidth: 300, minHeight: 250, x: 40, y: 40 });
    if (!isNew) return win;
    if (!this.chats[friend.name]) this.chats[friend.name] = { lines: [], replyIndex: this.hash(friend.name) % STEAM_FRIEND_REPLIES.length, last: '' };
    const chat = this.chats[friend.name];
    const body = win.bodyElement;
    body.innerHTML = `
      <div class="stm-body stm-chat">
        <div class="stm-chat-name">${this.escape(friend.name)}</div>
        <div class="stm-panel stm-chat-log" data-log></div>
        <div class="stm-chat-send">
          <textarea class="stm-input" data-msg rows="2"></textarea>
          <button class="stm-btn" data-send>Отправить</button>
        </div>
        <div class="stm-dim" data-last></div>
      </div>`;
    const log = body.querySelector('[data-log]');
    const last = body.querySelector('[data-last]');
    const render = () => {
      log.innerHTML = chat.lines.map(l => `<div class="stm-chat-who">${this.escape(l.who)} пишет:</div><div class="stm-chat-text">${this.escape(l.text)}</div>`).join('');
      log.scrollTop = log.scrollHeight;
      last.textContent = chat.last ? `Последнее сообщение получено: ${chat.last}` : '';
    };
    const msg = body.querySelector('[data-msg]');
    const send = () => {
      const text = msg.value.trim();
      if (!text) return;
      msg.value = '';
      chat.lines.push({ who: this.settings.account, text });
      render();
      setTimeout(() => {
        const game = this.gm.catalog[friend.game || this.gm.getSteamGameIds()[this.hash(friend.name) % this.gm.getSteamGameIds().length]];
        const reply = STEAM_FRIEND_REPLIES[chat.replyIndex % STEAM_FRIEND_REPLIES.length].replace('{game}', game ? game.title : 'игру');
        chat.replyIndex++;
        chat.lines.push({ who: friend.name, text: reply });
        const now = new Date();
        chat.last = `${now.toLocaleDateString('ru-RU')} в ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
        if (window.winManager.windows.has(winId)) render();
        if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick();
      }, 1200 + Math.random() * 1500);
    };
    body.querySelector('[data-send]').addEventListener('click', send);
    msg.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
    render();
    return win;
  }

  serverList(gameId, seed) {
    const maps = STEAM_SERVER_MAPS[gameId];
    const count = 4 + (this.hash(gameId + seed) % 4);
    const list = [];
    for (let i = 0; i < count; i++) {
      const h = this.hash(`${gameId}:${seed}:${i}`);
      const max = [8, 10, 12, 16, 20][h % 5];
      list.push({
        name: STEAM_SERVER_NAMES[(h >>> 3) % STEAM_SERVER_NAMES.length],
        players: `${h % (max + 1)}/${max}`,
        map: maps[(h >>> 7) % maps.length],
        ping: 40 + (h >>> 11) % 360
      });
    }
    return list.sort((a, b) => a.ping - b.ping);
  }

  openServers() {
    const { win, isNew } = this.openWindow({ id: 'steam_servers', title: 'Серверы', width: 580, height: 380, minWidth: 460, minHeight: 280, x: 150, y: 120 });
    if (!isNew) return win;
    const games = Object.keys(STEAM_SERVER_MAPS).filter(id => this.getGame(id));
    let gameId = games.find(id => this.gm.isInstalled(id)) || games[0];
    let seed = 0;
    let selected = 0;
    const body = win.bodyElement;
    const render = () => {
      const servers = this.serverList(gameId, seed);
      body.innerHTML = `
        <div class="stm-body stm-servers">
          <div class="stm-row">
            <span>Игра: <select class="stm-select" data-sgame>${games.map(id => `<option value="${id}" ${id === gameId ? 'selected' : ''}>${this.escape(this.gm.catalog[id].title)}</option>`).join('')}</select></span>
            <span class="stm-dim">Серверов: ${servers.length}</span>
          </div>
          <div class="stm-panel stm-table stm-servers-table">
            <div class="stm-table-head"><span>Сервер</span><span>Игроки</span><span>Карта</span><span>Пинг</span></div>
            ${servers.map((s, i) => `<div class="stm-table-row ${i === selected ? 'is-selected' : ''}" data-server="${i}"><span>${this.escape(s.name)}</span><span>${s.players}</span><span>${this.escape(s.map)}</span><span>${s.ping}</span></div>`).join('')}
          </div>
          <div class="stm-foot">
            <button class="stm-btn stm-wide" data-srefresh>Обновить</button>
            <button class="stm-btn stm-wide" data-sconnect>Подключиться</button>
            <button class="stm-btn stm-wide" data-close>Закрыть</button>
          </div>
        </div>`;
      this.bindClose(win, body);
      body.querySelector('[data-sgame]').addEventListener('change', e => {
        gameId = e.currentTarget.value;
        selected = 0;
        render();
      });
      body.querySelectorAll('[data-server]').forEach(el => {
        el.addEventListener('click', () => {
          selected = Number(el.dataset.server);
          render();
        });
        el.addEventListener('dblclick', () => this.connectToServer(gameId));
      });
      body.querySelector('[data-srefresh]').addEventListener('click', () => {
        seed++;
        render();
      });
      body.querySelector('[data-sconnect]').addEventListener('click', () => this.connectToServer(gameId));
    };
    render();
    return win;
  }

  connectToServer(gameId) {
    const state = this.getGameState(gameId);
    const game = this.gm.catalog[gameId];
    if (state === 'installed') {
      this.launchGame(gameId);
      return;
    }
    window.winManager.openDialog({
      title: 'Steam',
      icon: 'info',
      message: state === 'store'
        ? `Для подключения нужна игра «${this.escape(game.title)}». Её можно получить в Steam.`
        : `Игра «${this.escape(game.title)}» ещё не загружена.`,
      buttons: [
        { text: state === 'store' ? 'Открыть в магазине' : 'Загрузить', primary: true, action: () => (state === 'store' ? this.openDetails(gameId) : this.startDownload(gameId)) },
        { text: 'Отмена' }
      ]
    });
  }

  openSettings() {
    const { win, isNew } = this.openWindow({ id: 'steam_settings', title: 'Настройки Steam', width: 370, height: 270, resizable: false, x: 200, y: 140 });
    if (!isNew) return win;
    const body = win.bodyElement;
    body.innerHTML = `
      <div class="stm-body stm-settings">
        <div class="stm-form">
          <label>Учётная запись</label><input class="stm-input" data-saccount maxlength="24" value="${this.escape(this.settings.account)}">
          <label>Подключение</label><select class="stm-select" data-sconn>${STEAM_CONNECTIONS.map(c => `<option value="${c.id}" ${c.id === this.settings.connection ? 'selected' : ''}>${c.label}</option>`).join('')}</select>
        </div>
        <label class="stm-check"><input type="checkbox" data-snotify ${this.settings.notify ? 'checked' : ''}> Сообщать о завершении загрузки</label>
        <div class="stm-dim">Скорость подключения влияет на время загрузки игр. Ограничение скорости настраивается в окне «Монитор».</div>
        <div class="stm-foot">
          <button class="stm-btn stm-wide" data-sok>ОК</button>
          <button class="stm-btn stm-wide" data-close>Отмена</button>
        </div>
      </div>`;
    this.bindClose(win, body);
    body.querySelector('[data-sok]').addEventListener('click', () => {
      this.settings.account = body.querySelector('[data-saccount]').value.trim() || 'retro_user';
      this.settings.connection = body.querySelector('[data-sconn]').value;
      this.settings.notify = body.querySelector('[data-snotify]').checked;
      this.saveSettings();
      window.winManager.closeWindow(win.id);
    });
    return win;
  }

  openNews() {
    const { win, isNew } = this.openWindow({ id: 'steam_news', title: 'Новости Steam', width: 460, height: 420, minWidth: 340, minHeight: 280, x: 240, y: 50 });
    if (!isNew) return win;
    const ids = this.gm.getSteamGameIds();
    const arrivals = ids.slice(-6).map(id => this.escape(this.gm.catalog[id].title)).join(', ');
    win.bodyElement.innerHTML = `
      <div class="stm-body stm-news">
        <div class="stm-panel stm-news-list">
          ${STEAM_NEWS.map(n => `<div class="stm-news-item"><div><span class="stm-gold">${n.date}</span> — <b>${n.title}</b></div><div>${n.text}</div></div>`).join('')}
          <div class="stm-news-item"><div><span class="stm-gold">В каталоге</span> — <b>${ids.length} игр</b></div><div>Недавно добавлены: ${arrivals}.</div></div>
        </div>
        <div class="stm-foot"><button class="stm-btn stm-wide" data-close>Закрыть</button></div>
      </div>`;
    this.bindClose(win, win.bodyElement);
    return win;
  }
}

window.appSteam = new AppSteam();
