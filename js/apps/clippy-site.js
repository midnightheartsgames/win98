class ClippySite {
  constructor() {
    this.baseUrl = 'http://www.clippy98.com';
    this.guestbookKey = 'win98_clippy98_guestbook';
    this.counterKey = 'win98_clippy98_counter';
    this.filter = 'all';
    this.tryOn = null;
    this.downloads = new Map();
    this.win = null;
    this.container = null;

    this.sections = [
      { id: 'home', label: 'Главная', icon: 'home' },
      { id: 'wardrobe', label: 'Гардероб', icon: 'box' },
      { id: 'colleagues', label: 'Коллеги', icon: 'user' },
      { id: 'faq', label: 'Вопросы', icon: 'question' },
      { id: 'guestbook', label: 'Гостевая', icon: 'pencil' }
    ];

    this.news = [
      { date: '01.12.1998', text: 'Большое пополнение шкафа! Открыт раздел <b>«Аксессуары»</b>: деловой дипломат, сотовый с антенной, тамагочи, попугай и стопка дискет, а также новые шляпы, очки и бороды.' },
      { date: '30.11.1998', text: 'Скрепыша теперь можно спросить своими словами! Нажмите <b>F1</b> на рабочем столе или выберите «Что вы хотите сделать?» в его меню.' },
      { date: '28.11.1998', text: 'У Скрепыша появилась <b>лампочка</b>. Если у него есть совет, она мигает рядом с ним и ждёт, пока вы щёлкнете.' },
      { date: '26.11.1998', text: 'Скрепыш теперь в ICQ! Его номер — <b>199898</b>. Отвечает быстрее, чем модем соединяется.' },
      { date: '22.11.1998', text: 'В гардероб завезли <b>ушанку «Зима 98»</b> и <b>шарф болельщика</b>. Готовимся к холодам!' },
      { date: '09.11.1998', text: 'Новинка: <b>кепка с пропеллером</b>. Пропеллер настоящий — крутится без перерыва на обед.' },
      { date: '27.10.1998', text: 'Для победителей Ретро-Викторины открыта <b>Золотая корона</b> (VIP). Всего 3 вопроса!' },
      { date: '14.10.1998', text: 'Пиксельные очки <b>«Deal With It»</b> теперь можно скачать, даже если вы ни разу не выиграли в «Сапёра».' },
      { date: '01.09.1998', text: 'Сайт открыт! Все образы бесплатны (Freeware). Скачивайте на здоровье, модем выдержит.' }
    ];

    this.colleagues = [
      { icon: 'dog', name: 'Power Pup (Щенок)', from: 'Office 97', text: 'Супергерой в плаще. Скрепыш считает его главным соперником за внимание пользователя.' },
      { icon: 'bulb', name: 'The Genius (Эйнштейн)', from: 'Office 97', text: 'Объясняет формулы Excel через теорию относительности. Иногда помогает.' },
      { icon: 'robot', name: 'Hoverbot', from: 'Office 97', text: 'Летающий робот-помощник. Одолжил Скрепышу пропеллер — теперь просит вернуть.' },
      { icon: 'ball-red', name: 'The Dot (Точка)', from: 'Office 97', text: 'Весёлый прыгающий мячик. Не умеет носить шляпы — они с него скатываются.' },
      { icon: 'cat', name: 'Scribble (Кот)', from: 'Office 97', text: 'Бумажный котёнок. Спит на клавиатуре и нажимает Caps Lock.' },
      { icon: 'globe', name: 'Mother Nature', from: 'Office 97', text: 'Помощница-планета. Напоминает выключать монитор на ночь.' },
      { icon: 'book', name: 'Will (Шекспир)', from: 'Office 97', text: '«Сохранить или не сохранить — вот в чём вопрос». Советует писать сонеты в Word.' },
      { icon: 'star', name: 'Merlin (Мерлин)', from: 'Microslop Agent', text: 'Волшебник, подаривший Скрепышу звёздную шляпу из гардероба.' },
      { icon: 'dog', name: 'Rocky (Пёс)', from: 'Office 2000', text: 'Новенький. Говорят, заменит Скрепыша в следующей версии Office. Скрепыш не волнуется. Совсем.' }
    ];

    this.faq = [
      { q: 'Как отключить Скрепыша?', a: 'Никак! Шучу: щёлкните по нему правой кнопкой мыши и выберите «Спрятать Скрепыша». Но он всё равно будет скучать в системном лотке.' },
      { q: 'Что за файлы .ACS я скачиваю?', a: 'ACS — формат персонажей Microslop Agent. В каждом файле лежат анимации и новый наряд. Он весит 7–32 КБ, при модеме 33.6K скачивается за несколько секунд.' },
      { q: 'Куда сохраняются образы?', a: 'В папку <b>C:\\My Documents\\Downloads</b>. Скрепыш надевает их сразу, переустанавливать Office не нужно.' },
      { q: 'Можно носить несколько вещей сразу?', a: 'Да! Одновременно можно носить по одной вещи из каждой категории: головной убор, очки, усы или бороду, что-нибудь на шею и аксессуар справа от Скрепыша. Цилиндр + монокль + усы + деловой дипломат = настоящий джентльмен.' },
      { q: 'Как получить Золотую корону?', a: 'Щёлкните по Скрепышу правой кнопкой, выберите «Ретро-Викторина 1998» и ответьте правильно на все вопросы. После этого корона станет доступна в гардеробе.' },
      { q: 'Почему Скрепыш спрашивает, не пишу ли я письмо?', a: 'Потому что вы, скорее всего, пишете письмо. Статистика Office 97 неумолима. Если надоело, нажмите в его выноске «Больше не показывать этот совет».' },
      { q: 'Как вернуть Скрепыша, если я его выключил?', a: 'Щёлкните по скрепке в трее или наберите <b>clippy</b> в окне «Пуск → Выполнить». Чтобы он снова появлялся при запуске, поставьте галочку «Показывать помощника» в «Параметрах помощника». В «Настройке системы» он записан как ClippyOffice.' },
      { q: 'Что за лампочка рядом со Скрепышом?', a: 'У Скрепыша есть совет. Он больше не выскакивает с ним сам: лампочка мигает и ждёт, пока вы щёлкнете.' },
      { q: 'Можно ли выбрать другого помощника?', a: 'Откройте «Параметры помощника» → «Коллекция». Посмотреть можно на всех, но для установки нужен компакт-диск Microslop Office 97.' },
      { q: 'Где живут помощники?', a: 'В папке <b>C:\\Program Files\\Microslop Office\\Office\\Actors</b>. Не удаляйте их файлы: Скрепыш расстроится.' }
    ];

    this.defaultGuestbook = [
      { name: 'Вася_Пупкин', date: '20.11.1998', text: 'Надел Скрепышу ушанку и усы — теперь он вылитый мой дед! Сайт супер, 5 звёзд!' },
      { name: 'Lena98', date: '15.11.1998', text: 'Бабочка + цилиндр = самый стильный помощник в офисе. Начальник думает, что я работаю :)' },
      { name: 'CoolHacker', date: '02.11.1998', text: 'Кепка с пропеллером рулит! Жду пиратскую повязку и попугая.' }
    ];
  }

  wardrobe() {
    return window.clippyWardrobe;
  }

  gif(name, scale) {
    return window.webGif ? window.webGif(name, scale) : '';
  }

  esc(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  parseUrl(url) {
    const clean = (url || '').toLowerCase();
    for (const s of this.sections) {
      if (s.id !== 'home' && clean.includes('/' + s.id)) return s.id;
    }
    if (clean.includes('/download') || clean.includes('/outfit')) return 'wardrobe';
    return 'home';
  }

  bumpCounter() {
    let n = 19980;
    try {
      n = parseInt(localStorage.getItem(this.counterKey) || '19980', 10) + 1;
      localStorage.setItem(this.counterKey, String(n));
    } catch (e) {}
    return n;
  }

  getGuestbook() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.guestbookKey));
      if (Array.isArray(saved)) return saved.concat(this.defaultGuestbook);
    } catch (e) {}
    return this.defaultGuestbook.slice();
  }

  addGuestbookEntry(name, text) {
    name = String(name || '').trim().slice(0, 30);
    text = String(text || '').trim().slice(0, 300);
    if (!name || !text) return false;
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(this.guestbookKey)) || []; } catch (e) {}
    const d = new Date();
    saved.unshift({ name, text, date: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.1998` });
    try { localStorage.setItem(this.guestbookKey, JSON.stringify(saved.slice(0, 50))); } catch (e) {}
    return true;
  }

  modemSeconds(sizeKb) {
    return Math.max(1, Math.round(sizeKb / 3.4));
  }

  renderSite(url, countVisit = true) {
    this.section = this.parseUrl(url);
    const w = this.wardrobe();
    const visitors = countVisit ? this.bumpCounter() : this.visitors;
    this.visitors = visitors;
    const body = {
      home: () => this.renderHome(),
      wardrobe: () => this.renderWardrobe(),
      colleagues: () => this.renderColleagues(),
      faq: () => this.renderFaq(),
      guestbook: () => this.renderGuestbook()
    }[this.section]();

    return `
      <div class="cc-root">
        <div class="cc-header">
          <div class="cc-logo-clippy">${w ? w.previewSvg(w.getOutfit(), 58) : this.gif('clip', 3)}</div>
          <div class="cc-title-block">
            <div class="cc-title">СКРЕПЫШ<span class="cc-title-98">'98</span></div>
            <div class="cc-subtitle">Официальный сайт Помощника Office · Гардероб · Фан-клуб</div>
          </div>
          <div class="cc-header-note">Похоже, вы<br>зашли на сайт<br>о Скрепыше!</div>
        </div>
        <marquee class="cc-marquee" scrollamount="4">*** Добро пожаловать в гардероб Скрепыша! Новая категория «Аксессуары»: деловой дипломат, сотовый с антенной, тамагочи, попугай и стопка дискет! Все образы бесплатны! ***</marquee>
        <div class="cc-nav">
          ${this.sections.map(s => `<a class="cc-nav-link${this.section === s.id ? ' active' : ''}" data-url="${this.baseUrl}${s.id === 'home' ? '' : '/' + s.id}">${this.gif(s.icon)} ${s.label}</a>`).join('')}
        </div>
        <div class="cc-body">${body}</div>
        <div class="cc-footer">
          <div class="cc-counter">Вы посетитель № <span class="cc-counter-digits">${String(visitors).padStart(6, '0')}</span></div>
          <div>© 1998 Clippy Fan Club · Сайт оптимизирован для Internet Explorer 4.0 и разрешения 800×600 ·
            <a data-url="http://www.microslop.com">Microslop Office</a> · <a data-url="http://www.geocities.com">GeoCities</a> · <a href="mailto:clippy@clippy98.com">Напишите Скрепышу</a></div>
        </div>
      </div>`;
  }

  renderHome() {
    const w = this.wardrobe();
    const owned = w ? w.ownedCount() : 0;
    const total = w ? w.items.length : 0;
    return `
      <div class="cc-two-col">
        <div class="cc-col-main">
          <div class="cc-panel">
            <div class="cc-panel-title">${this.gif('clip')} Досье помощника</div>
            <table class="cc-dossier">
              <tr><td>Имя:</td><td><b>Скрепыш</b> (Clippit, в народе Clippy)</td></tr>
              <tr><td>Должность:</td><td>Помощник Office, старший советник по письмам</td></tr>
              <tr><td>Дата рождения:</td><td>19 ноября 1996 года (вместе с Office 97)</td></tr>
              <tr><td>Художник:</td><td>Кеван Аттебери (Kevan J. Atteberry)</td></tr>
              <tr><td>Рост / вес:</td><td>3 см / 1 грамм нержавеющей стали</td></tr>
              <tr><td>Любимая фраза:</td><td>«Похоже, вы пишете письмо. Помочь?»</td></tr>
              <tr><td>Хобби:</td><td>Стучать по стеклу монитора, пить кофе, давать советы без спроса</td></tr>
              <tr><td>Любимые игры:</td><td>«Сапёр», «Косынка», DOOM 98 (тайно)</td></tr>
              <tr><td>ICQ:</td><td>199898</td></tr>
              <tr><td>Гардероб:</td><td><b>${owned}</b> из ${total} образов</td></tr>
            </table>
          </div>

          <div class="cc-panel">
            <div class="cc-panel-title">${this.gif('book')} Биография</div>
            <p>Скрепыш появился в Microslop Office 97 как один из анимированных Помощников. Среди десятка персонажей пользователи
              чаще всего видели именно его: он стоял по умолчанию и первым встречал каждого, кто открывал Word.</p>
            <p>Он умеет моргать, следить глазами за курсором, засыпать от скуки и превращаться в велосипед. Ещё он знает всё о
              письмах, таблицах и о том, как не потерять несохранённый документ.</p>
            <p>Теперь Скрепыш живёт и в Win 98. Он следит за вашими программами, реагирует на сайты и даже прикрывает игры,
              когда в кабинет входит начальник (кнопка «Шеф идет!»).</p>
          </div>

          <div class="cc-panel">
            <div class="cc-panel-title">${this.gif('bulb')} Что умеет Скрепыш</div>
            <ul class="cc-list">
              <li>Щёлкните по нему, чтобы получить совет, или правой кнопкой, чтобы открыть меню.</li>
              <li>Перетащите его мышкой в любое место экрана — он забавно раскачивается.</li>
              <li>Запустите Winamp — и он наденет наушники.</li>
              <li>Выиграйте в «Сапёра» — и получите крутые очки.</li>
              <li>Нажмите <b>F1</b> на рабочем столе и спросите своими словами: «сменить обои», «где игры».</li>
              <li>Начните письмо с «Уважаемый» или «Привет» — и Скрепыш предложит Мастер писем.</li>
              <li>Загорелась лампочка? Значит, у Скрепыша есть совет. Щёлкните, когда будет время.</li>
              <li>В «Параметрах помощника» можно выбрать, о чём ему молчать, и полистать «Коллекцию» коллег.</li>
              <li>В сеансе MS-DOS наберите <b>clippy /?</b>.</li>
              <li>Скачайте новые образы и аксессуары в <a data-url="${this.baseUrl}/wardrobe">Гардеробе</a> и соберите свой стиль!</li>
            </ul>
          </div>
        </div>

        <div class="cc-col-side">
          <div class="cc-sticky">
            <div class="cc-sticky-title"><span class="web-new">NEW!</span> Новое в гардеробе!</div>
            <div class="cc-sticky-preview">${w ? w.previewSvg({ head: 'propeller', neck: 'bowtie', accessory: 'briefcase' }, 84) : ''}</div>
            <p>Шляпы, галстуки, очки, усы и аксессуары для вашего помощника. Бесплатно!</p>
            <a class="cc-btn cc-btn-primary" data-url="${this.baseUrl}/wardrobe">Открыть гардероб »</a>
          </div>
          <div class="cc-panel">
            <div class="cc-panel-title">${this.gif('news')} Новости сайта</div>
            ${this.news.map(n => `<div class="cc-news"><span class="cc-news-date">${n.date}</span> ${n.text}</div>`).join('')}
          </div>
          <div class="cc-panel cc-award">
            <div class="cc-award-badge">${this.gif('cup', 2)}</div>
            <div><b>Помощник года 1998</b><br><span class="cc-muted">по версии журнала «Офисный планктон»</span></div>
          </div>
        </div>
      </div>`;
  }

  renderFittingRoom() {
    const w = this.wardrobe();
    const outfit = this.tryOn || w.getOutfit();
    const worn = w.slots.map(s => {
      const id = w.getEquippedId(s.id);
      const item = id ? w.getItem(id) : null;
      const tryId = this.tryOn && this.tryOn[s.id];
      const tryItem = tryId && tryId !== id ? w.getItem(tryId) : null;
      const tryNote = tryItem ? ` <span class="cc-tryon-note">(примерка: ${this.esc(tryItem.name)})</span>` : '';
      return `<div class="cc-worn-row"><span class="cc-worn-slot">${s.icon} ${s.name}:</span>
        ${item ? `<b>${this.esc(item.name)}</b> <a class="cc-link cc-unequip" data-slot="${s.id}">[снять]</a>` : '<span class="cc-muted">—</span>'}${tryNote}</div>`;
    }).join('');
    return `
      <div class="cc-fitting">
        <div class="cc-fitting-mirror">
          <div class="cc-fitting-label">${this.tryOn ? 'ПРИМЕРКА' : 'СЕЙЧАС НА СКРЕПЫШЕ'}</div>
          <div class="cc-fitting-clippy">${w.previewSvg(outfit, 110)}</div>
          ${this.tryOn ? '<a class="cc-btn cc-btn-small cc-tryon-reset">Сбросить примерку</a>' : ''}
        </div>
        <div class="cc-fitting-info">
          <div class="cc-panel-title">${this.gif('user')} Примерочная</div>
          ${worn}
          <div class="cc-fitting-stats">В гардеробе: <b>${w.ownedCount()}</b> из ${w.items.length} образов</div>
          <div class="cc-fitting-actions">
            <a class="cc-btn cc-btn-small cc-random">${this.gif('dice')} Случайный образ</a>
            <a class="cc-btn cc-btn-small cc-undress">Снять всё</a>
            <a class="cc-btn cc-btn-small cc-download-all">${this.gif('disk')} Скачать всё</a>
          </div>
          <div class="cc-muted cc-hint">Нажмите «Примерить» на любой вещи, чтобы посмотреть в зеркале, как она сочетается с остальным нарядом, ещё до скачивания.</div>
        </div>
      </div>`;
  }

  renderItemCard(item) {
    const w = this.wardrobe();
    const owned = w.isOwned(item.id);
    const locked = w.isLocked(item.id);
    const equipped = w.isEquipped(item.id);
    const trying = Boolean(this.tryOn && this.tryOn[item.slot] === item.id && !equipped);
    const dl = this.downloads.get(item.id);
    let actions;
    if (locked) {
      actions = `<div class="cc-locked">${this.gif('lock')} Только для знатоков: ответьте на все вопросы Ретро-Викторины</div>
        <a class="cc-btn cc-btn-small cc-quiz">Пройти викторину</a>`;
    } else if (dl !== undefined) {
      const pct = Math.min(100, Math.round(dl / item.sizeKb * 100));
      actions = `<div class="cc-progress"><div class="cc-progress-bar" data-dl-bar="${item.id}" style="width:${pct}%"></div></div>
        <div class="cc-progress-text" data-dl-text="${item.id}">Получено ${Math.floor(dl)} из ${item.sizeKb} КБ (3.4 КБ/с)</div>`;
    } else if (!owned) {
      actions = `<a class="cc-btn cc-btn-primary cc-download" data-id="${item.id}">${this.gif('disk')} Скачать</a>`;
    } else if (equipped) {
      actions = `<span class="cc-worn-tag">${this.gif('check')} Надето</span> <a class="cc-btn cc-btn-small cc-unequip" data-slot="${item.slot}">Снять</a>`;
    } else {
      actions = `<a class="cc-btn cc-btn-primary cc-equip" data-id="${item.id}">Надеть</a>`;
    }
    return `
      <div class="cc-card${equipped ? ' equipped' : ''}${trying ? ' trying' : ''}${locked ? ' locked' : ''}" data-item="${item.id}">
        ${item.badge ? `<div class="cc-badge cc-badge-${item.badge.toLowerCase()}">${item.badge}</div>` : ''}
        <div class="cc-card-preview">${w.previewSvg({ [item.slot]: item.id }, 64)}</div>
        <div class="cc-card-name">${this.esc(item.name)}</div>
        <div class="cc-card-desc">${this.esc(item.desc)}</div>
        <div class="cc-card-file">${item.file} · ${item.sizeKb} КБ · ~${this.modemSeconds(item.sizeKb)} сек на 33.6K</div>
        <div class="cc-card-actions">
          ${actions}
          <a class="cc-link cc-tryon" data-id="${item.id}">${trying ? 'В зеркале' : 'Примерить'}</a>
        </div>
      </div>`;
  }

  renderWardrobe() {
    const w = this.wardrobe();
    if (!w) return '<div class="cc-panel">Гардероб временно недоступен. Попробуйте переподключиться к Интернету.</div>';
    const filters = [{ id: 'all', name: 'Все', icon: '' }].concat(w.slots);
    return `
      ${this.renderFittingRoom()}
      <div class="cc-filters">
        ${filters.map(f => `<a class="cc-filter${this.filter === f.id ? ' active' : ''}" data-filter="${f.id}">${f.icon ? f.icon + ' ' : ''}${f.name} (${w.getItems(f.id).length})</a>`).join('')}
      </div>
      <div class="cc-grid">${w.getItems(this.filter).map(i => this.renderItemCard(i)).join('')}</div>`;
  }

  renderColleagues() {
    return `
      <div class="cc-panel">
        <div class="cc-panel-title">${this.gif('user')} Коллеги по Office</div>
        <p>Скрепыш работает не один! Помощника можно сменить через меню «Справка → Показать помощника → Выбрать помощника».
          Правда, Скрепыш уверен, что вы этого никогда не сделаете.</p>
      </div>
      <div class="cc-colleagues">
        ${this.colleagues.map(c => `
          <div class="cc-colleague">
            <div class="cc-colleague-icon">${this.gif(c.icon, 2)}</div>
            <div><div class="cc-colleague-name">${c.name} <span class="cc-muted">· ${c.from}</span></div>
            <div class="cc-colleague-text">${c.text}</div></div>
          </div>`).join('')}
      </div>`;
  }

  renderFaq() {
    return `
      <div class="cc-panel">
        <div class="cc-panel-title">${this.gif('question')} Часто задаваемые вопросы</div>
        ${this.faq.map((f, i) => `
          <div class="cc-faq-item">
            <div class="cc-faq-q">${i + 1}. ${f.q}</div>
            <div class="cc-faq-a">${f.a}</div>
          </div>`).join('')}
      </div>`;
  }

  renderGuestbook() {
    return `
      <div class="cc-panel">
        <div class="cc-panel-title">${this.gif('pencil')} Гостевая книга фан-клуба</div>
        <div class="cc-gb-form">
          <label>Ваше имя: <input type="text" class="cc-gb-name" maxlength="30" placeholder="Вася_Пупкин"></label>
          <label>Сообщение:<textarea class="cc-gb-text" maxlength="300" rows="3" placeholder="Скрепыш, ты лучший!"></textarea></label>
          <a class="cc-btn cc-btn-primary cc-gb-submit">Отправить запись</a>
        </div>
      </div>
      <div class="cc-gb-list">
        ${this.getGuestbook().map(e => `
          <div class="cc-gb-entry">
            <div class="cc-gb-head"><b>${this.esc(e.name)}</b> <span class="cc-muted">${this.esc(e.date)}</span></div>
            <div>${this.esc(e.text)}</div>
          </div>`).join('')}
      </div>`;
  }

  refresh() {
    const container = this.container;
    if (!container || !container.isConnected) return;
    const scroll = container.scrollTop;
    const url = (window.appIE && window.appIE.currentUrl) || `${this.baseUrl}/${this.section}`;
    container.innerHTML = this.renderSite(url, false);
    this.attachEvents(this.win, container);
    container.querySelectorAll('a[data-url]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.appIE) window.appIE.navigate(this.win, link.dataset.url);
      });
    });
    container.scrollTop = scroll;
  }

  startDownload(id) {
    const w = this.wardrobe();
    const item = w && w.getItem(id);
    if (!item || w.isOwned(id) || w.isLocked(id) || this.downloads.has(id)) return false;
    this.downloads.set(id, 0);
    if (window.soundSys && window.soundSys.playClick) window.soundSys.playClick();
    const step = item.sizeKb / 18;
    const timer = setInterval(() => {
      const received = Math.min(item.sizeKb, this.downloads.get(id) + step * (0.6 + Math.random() * 0.8));
      this.downloads.set(id, received);
      const bar = this.container && this.container.querySelector(`[data-dl-bar="${id}"]`);
      const text = this.container && this.container.querySelector(`[data-dl-text="${id}"]`);
      if (bar) bar.style.width = `${Math.round(received / item.sizeKb * 100)}%`;
      if (text) text.textContent = `Получено ${Math.floor(received)} из ${item.sizeKb} КБ (${(2.8 + Math.random() * 1.2).toFixed(1)} КБ/с)`;
      if (received >= item.sizeKb) {
        clearInterval(timer);
        this.finishDownload(item);
      }
    }, 110);
    return true;
  }

  finishDownload(item) {
    const w = this.wardrobe();
    this.downloads.delete(item.id);
    w.markOwned(item.id);
    if (window.vfs && window.vfs.writeFile) {
      try {
        window.vfs.writeFile(['My Computer', 'C:', 'My Documents', 'Downloads'], item.file, `[Microslop Agent Character Outfit: ${item.name}]`);
      } catch (e) {}
    }
    if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
    const clippy = window.appClippy;
    if (clippy && clippy.visible) {
      clippy.speak(`Загрузка завершена: <strong>${this.esc(item.name)}</strong> (${item.file}) теперь в моём гардеробе! Примерим?`, [
        { text: '• Надеть сейчас!', action: () => this.equip(item.id) },
        { text: '• Потом', action: () => {} }
      ], '📦');
    }
    this.refresh();
  }

  equip(id) {
    const w = this.wardrobe();
    if (!w || !w.equip(id)) return false;
    const item = w.getItem(id);
    this.tryOn = null;
    const clippy = window.appClippy;
    if (clippy && clippy.visible) clippy.speak(`<strong>${this.esc(item.name)}</strong>: ${item.quip}`, [], '✨');
    this.refresh();
    return true;
  }

  attachEvents(win, container) {
    this.win = win;
    this.container = container;
    const w = this.wardrobe();
    const on = (sel, fn) => container.querySelectorAll(sel).forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); fn(el); }));

    on('.cc-filter', el => { this.filter = el.dataset.filter; this.refresh(); });
    on('.cc-download', el => this.startDownload(el.dataset.id));
    on('.cc-equip', el => this.equip(el.dataset.id));
    on('.cc-unequip', el => { w.unequip(el.dataset.slot); this.tryOn = null; this.refresh(); });
    on('.cc-tryon', el => {
      const item = w.getItem(el.dataset.id);
      this.tryOn = Object.assign({}, this.tryOn || w.getOutfit(), { [item.slot]: item.id });
      this.refresh();
    });
    on('.cc-tryon-reset', () => { this.tryOn = null; this.refresh(); });
    on('.cc-undress', () => { w.unequipAll(); this.tryOn = null; this.refresh(); });
    on('.cc-random', () => {
      if (window.appClippy) window.appClippy.wearRandomOutfit();
      this.tryOn = null;
      this.refresh();
    });
    on('.cc-download-all', () => {
      w.items.forEach(i => this.startDownload(i.id));
      this.refresh();
    });
    on('.cc-quiz', () => { if (window.appClippy) window.appClippy.startQuiz(); });
    on('.cc-gb-submit', () => {
      const name = container.querySelector('.cc-gb-name');
      const text = container.querySelector('.cc-gb-text');
      if (this.addGuestbookEntry(name && name.value, text && text.value)) {
        if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
        this.refresh();
      } else if (window.appClippy) {
        window.appClippy.speak('Похоже, вы забыли указать имя или текст записи! Хотите, я помогу?', [], '✍️');
      }
    });
  }
}

window.clippySite = new ClippySite();
