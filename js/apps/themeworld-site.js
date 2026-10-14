class ThemeWorldSite {
  constructor() {
    this.currentTab = 'wallpapers';
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.hitCountKey = 'win98_themeworld_hits';
    this.guestbookKey = 'win98_themeworld_guestbook';
    this.previewModalWallpaper = null;

    this.initHitCounter();
  }

  initHitCounter() {
    try {
      if (typeof localStorage !== 'undefined') {
        let count = parseInt(localStorage.getItem(this.hitCountKey), 10);
        if (isNaN(count)) count = 184920;
        count++;
        localStorage.setItem(this.hitCountKey, count.toString());
        this.hitCount = count;
      } else {
        this.hitCount = 184921;
      }
    } catch (e) {
      this.hitCount = 184921;
    }
  }

  getHitCounterDisplay() {
    const s = String(this.hitCount || 184921).padStart(6, '0');
    return s.split('').join(' ');
  }

  getGuestbookEntries() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.guestbookKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {}

    return [
      {
        name: 'Neo_99',
        from: 'Zion / Moscow',
        date: '18 Nov 1999',
        text: 'Скринсейвер матрицы — это просто шедевр! Падающие зеленые буквы на моем 17-дюймовом CRT ViewSonic выглядят прямо как в фильме у Вачовски! Скачал за 4 минуты по модему US Robotics 56K.'
      },
      {
        name: 'Admin_Dima',
        from: 'St. Petersburg, Russia',
        date: '02 Nov 1999',
        text: 'Поставил тему Cyberpunk Neon на рабочий компьютер в НИИ. Начальник сначала ругался на фиолетовые окна, а потом сам попросил поставить ему такие же! ThemeWorld рулит!'
      },
      {
        name: 'Voodoo_Gamer',
        from: 'Novosibirsk',
        date: '24 Oct 1999',
        text: 'Обои 3D Pipes в высоком разрешении 1024x768 просто пушка! Отлично сочетается с разгоном Voodoo 2 SLI. Добавил сайт в Избранное IE!'
      },
      {
        name: 'CyberGirl98',
        from: 'Minsk, Belarus',
        date: '15 Sep 1999',
        text: 'Спасибо за обои с Деджико и тему Plus! Звуки сонара в теме Space просто завораживают. Ждем новых обоев по Half-Life!'
      }
    ];
  }

  saveGuestbookEntry(name, from, text) {
    const entries = this.getGuestbookEntries();
    entries.unshift({
      name: name.trim() || 'Гость Сети',
      from: from.trim() || 'Cyberspace',
      date: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }),
      text: text.trim()
    });
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.guestbookKey, JSON.stringify(entries));
      }
    } catch (e) {
      console.warn('Failed to save guestbook entry:', e);
    }
  }

  getWallpapers() {
    return [
      {
        id: 'matrix',
        title: 'The Matrix Code (Матричный код)',
        category: 'matrix',
        res: '1024x768',
        format: 'BMP 24-bit',
        size: '1.4 МБ',
        badge: 'ХИТ 1999',
        desc: 'Культовый цифровой дождь из зеленых символов японской катаканы и латиницы на глубоком черном фоне.'
      },
      {
        id: 'clouds',
        title: 'Clouds 98 Bliss (Небесные облака)',
        category: 'retro',
        res: '1024x768',
        format: 'BMP 24-bit',
        size: '1.2 МБ',
        badge: 'ОРИГИНАЛ',
        desc: 'Классическое лазурное небо и пышные кучевые облака оригинального дистрибутива Win 98.'
      },
      {
        id: 'cyberpunk',
        title: 'Cyberpunk Neon 1998 (Неоновый закат)',
        category: 'matrix',
        res: '800x600',
        format: 'BMP 24-bit',
        size: '980 КБ',
        badge: 'СИНТВЕЙВ',
        desc: 'Ретровейв и неоновый горизонт 80-х и 90-х: сетка горизонта, пурпурное солнце и футуристическая атмосфера.'
      },
      {
        id: 'setup',
        title: 'Win 98 Setup Billboard (Синий экран)',
        category: 'retro',
        res: '800x600',
        format: 'BMP 24-bit',
        size: '890 КБ',
        badge: 'НОСТАЛЬГИЯ',
        desc: 'Билборд программы установки Win 98: развевающийся флаг Microslop над синим небом и облаками.'
      },
      {
        id: 'spacecadet',
        title: 'Space Cadet Nebula (Туманность Космос)',
        category: 'space',
        res: '1024x768',
        format: 'BMP 24-bit',
        size: '1.5 МБ',
        badge: '3D PINBALL',
        desc: 'Глубины дальнего космоса, звездные скопления и фиолетовая туманность в стиле культовой игры.'
      },
      {
        id: 'pipes',
        title: '3D Pipes OpenGL Maze (Трубопровод 3D)',
        category: 'games',
        res: '800x600',
        format: 'BMP 24-bit',
        size: '1.1 МБ',
        badge: 'OPENGL',
        desc: 'Трехмерный лабиринт труб высокого разрешения с реалистичным освещением и отражениями.'
      },
      {
        id: 'redalert',
        title: 'Red Alert Tactical Radar (Военный радар)',
        category: 'games',
        res: '800x600',
        format: 'BMP 24-bit',
        size: '920 КБ',
        badge: 'C&C',
        desc: 'Тактическая координатная сетка полевого штаба обороны с рубиновым свечением радара.'
      },
      {
        id: 'gold',
        title: 'Millennium 98 Gold (Золотой век)',
        category: 'retro',
        res: '1024x768',
        format: 'BMP 24-bit',
        size: '1.3 МБ',
        badge: 'ПРЕМИУМ',
        desc: 'Роскошный золотисто-янтарный шелк для стильного и престижного оформления рабочего стола.'
      },
      {
        id: 'dejiko',
        title: 'DiGi Charat Akiba 1999 (Акихабара)',
        category: 'retro',
        res: '800x600',
        format: 'BMP 24-bit',
        size: '1.0 МБ',
        badge: 'АНИМЕ',
        desc: 'Аниме-обои с Деджико и Пучико из культового магазина Gamers в районе Акихабара, Токио.'
      }
    ];
  }

  getScreensavers() {
    return [
      {
        id: 'matrix',
        name: 'The Matrix Code (Матрица 1999)',
        file: 'Matrix.scr',
        size: '142 КБ',
        category: 'matrix',
        desc: 'Знаменитый скринсейвер с непрерывно падающими зелеными символами японской катаканы и латиницы, белыми светящимися оголовками и затухающим фосфорным следом из фильма «Матрица».',
        tech: 'Win32 OpenGL / GDI, 60 FPS',
        badge: 'ГЛАВНЫЙ ХИТ 1999'
      },
      {
        id: 'flying_win',
        name: '3D Flying Win (Летающие флаги)',
        file: 'Flying_Win98.scr',
        size: '115 КБ',
        category: 'retro',
        desc: 'Разноцветные трехмерные флаги Win 98, парящие в глубоком звездном пространстве навстречу экрану.',
        tech: 'Direct3D 6.0 / GDI Vector',
        badge: 'КЛАССИКА WIN98'
      },
      {
        id: 'pipes',
        name: '3D Pipes (Трубопровод OpenGL)',
        file: 'Pipes3D.scr',
        size: '210 КБ',
        category: 'retro',
        desc: 'Легендарный скринсейвер с разноцветными самогенерирующимися трубами, шаровыми соединениями и OpenGL-освещением.',
        tech: 'OpenGL 1.1 Hardware Accel',
        badge: 'ОФИЦИАЛЬНЫЙ'
      },
      {
        id: 'starfield',
        name: 'Starfield Simulation (Звездное поле)',
        file: 'Starfield.scr',
        size: '64 КБ',
        category: 'space',
        desc: 'Полет через гиперпространство сквозь тысячи далеких звезд с реалистичным параллаксом и скоростью света.',
        tech: 'Win32 GDI Ultra-fast',
        badge: 'ПОПУЛЯРНЫЙ'
      },
      {
        id: 'mystify',
        name: 'Mystify Your Mind (Мистика)',
        file: 'Mystify.scr',
        size: '82 КБ',
        category: 'retro',
        desc: 'Психоделические неоновые кривые и танцующие цветные многоугольники с эффектом оптических следов.',
        tech: 'Win32 GDI Vector Geometry',
        badge: 'РЕТРО 1998'
      },
      {
        id: 'flowerbox',
        name: '3D FlowerBox (Цветной куб)',
        file: 'FlowerBox.scr',
        size: '130 КБ',
        category: 'retro',
        desc: 'Трехмерный каркасный куб, непрерывно вращающийся вокруг осей и морфирующий грани во внутренние плоскости.',
        tech: 'OpenGL 3D Wireframe',
        badge: 'PLUS! 98'
      }
    ];
  }

  getThemes() {
    return [
      {
        id: 'matrix',
        name: 'The Matrix 1999 (Матрица)',
        file: 'TheMatrix1999.theme',
        size: '2.4 МБ',
        category: 'matrix',
        palette: '#010a03',
        titleGrad: 'linear-gradient(90deg, #002b0e, #00ff41)',
        cursor: 'crosshair',
        sounds: 'Digital Phone Trace / Cyber Glitch',
        badge: 'ХИТ 1999',
        desc: 'Полная трансформация Win 98: зеленые фосфорные заголовки окон, матричный фон, кибер-курсор «прицел» и звуки модемного набора.'
      },
      {
        id: 'cyberpunk',
        name: 'Cyberpunk Neon 1998 (Неоновый закат)',
        file: 'Cyberpunk98.theme',
        size: '1.8 МБ',
        category: 'matrix',
        palette: '#110024',
        titleGrad: 'linear-gradient(90deg, #380062, #ff007f)',
        cursor: 'pointer',
        sounds: 'Analog Synthwave Chorus',
        badge: 'СИНТВЕЙВ',
        desc: 'Атмосфера ночного неонового мегаполиса: пурпурно-розовые градиенты окон, ретровейв-гамма и теплый аналоговый синтезатор.'
      },
      {
        id: 'redalert',
        name: 'Red Alert Tactical (Красная тревога)',
        file: 'RedAlert.theme',
        size: '1.9 МБ',
        category: 'games',
        palette: '#170303',
        titleGrad: 'linear-gradient(90deg, #5e0505, #e62200)',
        cursor: 'crosshair',
        sounds: 'Military Klaxon / Siren Alert',
        badge: 'СТРАТЕГИЯ',
        desc: 'Интерфейс командного пункта: строгие рубиново-красные заголовки окон, тактическая карта и звуки боевой сирены.'
      },
      {
        id: 'gold',
        name: 'Millennium 98 Gold (Золотой век)',
        file: 'Win98Gold.theme',
        size: '1.5 МБ',
        category: 'retro',
        palette: '#1c1607',
        titleGrad: 'linear-gradient(90deg, #6e4e00, #ffcc00)',
        cursor: 'default',
        sounds: 'Royal Chimes & Fanfare',
        badge: 'ПРЕМИУМ',
        desc: 'Роскошный золотой интерфейс с латунными градиентами заголовков для ценителей классического стиля.'
      },
      {
        id: 'space',
        name: 'Space (Космос Plus!)',
        file: 'Space.theme',
        size: '2.1 МБ',
        category: 'space',
        palette: '#060714',
        titleGrad: 'linear-gradient(90deg, #180929, #66107b)',
        cursor: 'crosshair',
        sounds: 'Cosmic Sonar & Lasers',
        badge: 'ОФИЦИАЛЬНАЯ',
        desc: 'Официальная тема Microslop Plus! 98: глубины Вселенной, звездные окна и космические лазерные звуки.'
      },
      {
        id: 'underwater',
        name: 'Underwater (Подводный мир)',
        file: 'Underwater.theme',
        size: '1.7 МБ',
        category: 'retro',
        palette: '#002f3a',
        titleGrad: 'linear-gradient(90deg, #002d42, #066d86)',
        cursor: 'cell',
        sounds: 'Ocean Bubbles & Sonar',
        badge: 'ОФИЦИАЛЬНАЯ',
        desc: 'Официальная тема Plus! 98: коралловые рифы, сине-зеленая лазурь и звуки всплывающих морских пузырей.'
      }
    ];
  }

  getPacks() {
    return [
      {
        id: 'pack_matrix',
        title: 'The Matrix 1999 Ultimate Desktop Suite',
        file: 'Matrix_Suite_Setup.exe',
        size: '3.8 МБ',
        items: 'Обои «Матричный код» + Заставка «The Matrix Code» + Полная тема «The Matrix 1999» + Звуковая схема',
        badge: 'СУПЕР-ПАК 1999',
        desc: 'Полный комплект для погружения в Матрицу. Один инсталлятор установит обои, настроит скринсейвер и применит тему!'
      },
      {
        id: 'pack_plus',
        title: 'Microslop Plus! 98 Themes & Screensavers MegaPack',
        file: 'Plus98_MegaCollection.exe',
        size: '5.2 МБ',
        items: '6 тем Plus! (Space, Underwater, Creatures, Mystery, Jungle, Classic) + 5 скринсейверов OpenGL',
        badge: 'КОЛЛЕКЦИЯ',
        desc: 'Полная коллекция официального дополнения Microslop Plus! 98 с оригинальными звуками и курсорами.'
      }
    ];
  }

  renderSite(activeTab = 'wallpapers', query = '') {
    if (activeTab) this.currentTab = activeTab;
    if (query !== undefined) this.searchQuery = query;

    return `
      <div class="themeworld-root">
        <div class="themeworld-wrapper">

          <div class="themeworld-header">
            <div class="themeworld-title-row">
              <div class="themeworld-logo-group">
                <div class="themeworld-logo-icon">${window.webGif ? window.webGif('palette', 2) : ''}</div>
                <div>
                  <div class="themeworld-title-main">${window.webGif ? window.webGif('star') : ''} THEME WORLD '98 ${window.webGif ? window.webGif('star') : ''}</div>
                  <div class="themeworld-title-sub">The #1 Win 98 Archive for Desktop Themes, Wallpapers & Screensavers</div>
                </div>
              </div>
              <div class="themeworld-badges">
                <div class="themeworld-badge">IE 5.0 <span>OPTIMIZED</span></div>
                <div class="themeworld-badge">56K <span>MODEM READY</span></div>
                <div class="themeworld-badge">WIN 98 <span>CERTIFIED</span></div>
              </div>
            </div>

            <div class="themeworld-marquee-bar">
              <marquee scrollamount="4" behavior="scroll" direction="left">
                *** НОВИНКА НОЯБРЯ 1999: Культовая заставка «The Matrix Code» с падающими зелеными символами катаканы! *** Новые темы Plus! «Матрица» и «Неоновый Киберпанк 98» уже доступны для бесплатного скачивания! *** Скачивайте .BMP обои прямо в папку «Мои рисунки»!
              </marquee>
            </div>
          </div>

          <div class="themeworld-nav-tabs">
            <button class="themeworld-tab-btn ${this.currentTab === 'wallpapers' ? 'active' : ''}" data-tw-tab="wallpapers">Обои (Wallpapers)</button>
            <button class="themeworld-tab-btn ${this.currentTab === 'screensavers' ? 'active' : ''}" data-tw-tab="screensavers">Заставки (Screensavers)</button>
            <button class="themeworld-tab-btn ${this.currentTab === 'themes' ? 'active' : ''}" data-tw-tab="themes">Темы Plus! (Themes)</button>
            <button class="themeworld-tab-btn ${this.currentTab === 'packs' ? 'active' : ''}" data-tw-tab="packs">Сборники (Top Packs)</button>
            <button class="themeworld-tab-btn ${this.currentTab === 'guestbook' ? 'active' : ''}" data-tw-tab="guestbook">Гостевая книга</button>
          </div>

          <div class="themeworld-body">
            ${this.renderActiveTab()}
          </div>

          <div class="themeworld-footer">
            <div>
              &copy; 1998-1999 <strong>ThemeWorld Network Inc.</strong> Все права защищены.<br>
              Лучший просмотр при разрешении 800x600 в Microslop Internet Explorer 5.0.<br>
              Присылайте свои темы и обои: <a href="mailto:admin@themeworld98.com">admin@themeworld98.com</a>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span>Посетителей:</span>
              <div class="themeworld-counter-box">${this.getHitCounterDisplay()}</div>
            </div>
          </div>

        </div>

        ${this.renderWallpaperModal()}
      </div>
    `;
  }

  renderActiveTab() {
    switch (this.currentTab) {
      case 'screensavers':
        return this.renderScreensaversTab();
      case 'themes':
        return this.renderThemesTab();
      case 'packs':
        return this.renderPacksTab();
      case 'guestbook':
        return this.renderGuestbookTab();
      case 'wallpapers':
      default:
        return this.renderWallpapersTab();
    }
  }

  renderWallpapersTab() {
    let list = this.getWallpapers();
    if (this.currentCategory !== 'all') {
      list = list.filter(w => w.category === this.currentCategory);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(w => w.title.toLowerCase().includes(q) || w.desc.toLowerCase().includes(q));
    }

    return `
      <div class="themeworld-filter-bar">
        <div class="themeworld-filter-group">
          <strong>Категория:</strong>
          <select class="tw-filter-category" style="height:22px; font-size:11px;">
            <option value="all" ${this.currentCategory === 'all' ? 'selected' : ''}>Все обои (${this.getWallpapers().length})</option>
            <option value="matrix" ${this.currentCategory === 'matrix' ? 'selected' : ''}>Матрица & Киберпанк</option>
            <option value="retro" ${this.currentCategory === 'retro' ? 'selected' : ''}>Классика Win 98</option>
            <option value="games" ${this.currentCategory === 'games' ? 'selected' : ''}>Игры & 3D Графика</option>
            <option value="space" ${this.currentCategory === 'space' ? 'selected' : ''}>Космос & Звезды</option>
          </select>
        </div>
        <div class="themeworld-filter-group">
          <input type="text" class="tw-filter-search" placeholder="Поиск обоев..." value="${this.escapeHtml(this.searchQuery)}" style="height:20px; font-size:11px; padding:1px 4px; width:150px;">
          <button class="win-btn tw-btn-search" style="padding:2px 8px;">Найти</button>
        </div>
      </div>

      <div class="themeworld-grid">
        ${list.map(w => `
          <div class="themeworld-card">
            <div class="themeworld-card-header">
              <span>${w.title}</span>
              <span class="themeworld-card-badge">${w.badge}</span>
            </div>

            <div class="themeworld-preview-box" ${this.wallpaperStyle(w.id, 320, 240)}>
              <div class="themeworld-preview-overlay">${w.res}</div>
            </div>

            <div class="themeworld-card-desc">${w.desc}</div>

            <div class="themeworld-card-meta">
              <span>Формат: <strong>${w.format}</strong></span>
              <span>Размер: <strong>${w.size}</strong></span>
            </div>

            <div class="themeworld-card-actions">
              <button class="win-btn themeworld-btn tw-btn-preview-wall" data-wall-id="${w.id}">Обзор</button>
              <button class="win-btn themeworld-btn themeworld-btn-primary tw-btn-download-wall" data-wall-id="${w.id}">${window.webGif ? window.webGif('disk') : ''} Скачать .BMP</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderScreensaversTab() {
    const list = this.getScreensavers();

    return `
      <div style="background:#ffffd9; border:1px inset #808080; padding:8px 10px; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
        ${window.webGif ? window.webGif('bulb', 2) : ''}
        <div style="font-size:11px; line-height:1.4;">
          <strong>Экранные заставки (Screensavers)</strong> защищают люминофор вашего CRT-монитора от выгорания и украшают рабочий стол во время простоя. Скачайте заставку и затем выберите её в <b>Свойства: Экран</b>.
        </div>
      </div>

      <div class="themeworld-grid">
        ${list.map(s => `
          <div class="themeworld-card">
            <div class="themeworld-card-header">
              <span>${s.name}</span>
              <span class="themeworld-card-badge" style="background:#00ff66; color:#000;">${s.badge}</span>
            </div>

            <div class="themeworld-preview-box" style="background:#000000; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative;">
              ${s.id === 'matrix' ? `
                <div style="color:#00ff66; font-family:'Courier New', monospace; font-size:11px; font-weight:bold; text-align:center; line-height:1.2;">
                  1 0 ｦ ｱ ｳ ｴ ｵ<br>
                  <span style="color:#fff; ">0 1 ｶ ｷ ｹ ｺ ｻ</span><br>
                  1 1 ﾀ ﾂ ﾃ ﾅ ﾆ<br>
                  0 0 ﾊ ﾋ ﾎ ﾏ ﾐ
                </div>
              ` : s.id === 'flying_win' ? `
                <div style="display:grid; grid-template-columns:14px 14px; gap:2px; transform:rotate(-15deg);">
                  <div style="width:14px; height:14px; background:#ff3333;"></div>
                  <div style="width:14px; height:14px; background:#33cc33;"></div>
                  <div style="width:14px; height:14px; background:#3366ff;"></div>
                  <div style="width:14px; height:14px; background:#ffcc00;"></div>
                </div>
              ` : s.id === 'pipes' ? `
                ${window.webGif ? window.webGif('tools', 2) : ''}
                <div style="color:#00ffff; font-family:monospace; font-size:10px;">3D PIPES OPENGL</div>
              ` : `
                <div style="color:#ffff00; font-family:monospace; font-size:11px;">[ SCREEN SAVER ]</div>
              `}
              <div class="themeworld-preview-overlay">${s.file}</div>
            </div>

            <div class="themeworld-card-desc">${s.desc}</div>

            <div class="themeworld-card-meta">
              <span>Движок: <strong>${s.tech}</strong></span>
              <span>Размер: <strong>${s.size}</strong></span>
            </div>

            <div class="themeworld-card-actions">
              <button class="win-btn themeworld-btn tw-btn-test-ss" data-ss-id="${s.id}">&#9658; Тест заставки</button>
              <button class="win-btn themeworld-btn themeworld-btn-primary tw-btn-download-ss" data-ss-id="${s.id}">${window.webGif ? window.webGif('disk') : ''} Скачать .SCR</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderThemesTab() {
    const list = this.getThemes();

    return `
      <div style="background:#e3f2fd; border:1px inset #808080; padding:8px 10px; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
        ${window.webGif ? window.webGif('palette', 2) : ''}
        <div style="font-size:11px; line-height:1.4;">
          <strong>Темы оформления Microslop Plus!</strong> меняют полностью облик операционной системы: цвета рамок окон, шрифты, градиенты активных заголовков, курсоры мыши, фоны рабочего стола и системные звуковые сигналы. Скачанные темы можно применить в <b>Свойства: Экран</b>.
        </div>
      </div>

      <div class="themeworld-grid">
        ${list.map(th => `
          <div class="themeworld-card">
            <div class="themeworld-card-header">
              <span>${th.name}</span>
              <span class="themeworld-card-badge" style="background:#ff9900; color:#fff;">${th.badge}</span>
            </div>

            <div class="themeworld-theme-swatch" style="background:${th.palette};">
              <div class="themeworld-swatch-titlebar" style="background:${th.titleGrad};">
                <span>${th.name}</span>
                <span style="font-size:8px;">&times;</span>
              </div>
              <div class="themeworld-swatch-client">
                <div style="background:#ffffff; border:1px inset #808080; padding:2px 8px; font-size:9px; color:#000;">
                  Курсор: <strong>${th.cursor}</strong> | Звуки: <strong>${th.sounds}</strong>
                </div>
              </div>
            </div>

            <div class="themeworld-card-desc">${th.desc}</div>

            <div class="themeworld-card-meta">
              <span>Пакет: <strong>${th.file}</strong></span>
              <span>Размер: <strong>${th.size}</strong></span>
            </div>

            <div class="themeworld-card-actions">
              <button class="win-btn themeworld-btn themeworld-btn-primary tw-btn-download-theme" data-theme-id="${th.id}">${window.webGif ? window.webGif('disk') : ''} Скачать тему (${th.size})</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderPacksTab() {
    const packs = this.getPacks();

    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${packs.map(p => `
          <div class="themeworld-card" style="padding:12px;">
            <div class="themeworld-card-header" style="font-size:14px;">
              <span>${window.webGif ? window.webGif('box') : ''} ${p.title}</span>
              <span class="themeworld-card-badge" style="background:#ff3300; color:#fff; font-size:10px;">${p.badge}</span>
            </div>
            <div style="font-size:11px; margin:6px 0; color:#222;">
              ${p.desc}
            </div>
            <div style="background:#f0f0f0; border:1px inset #808080; padding:8px; font-size:11px; margin:6px 0;">
              <strong>Содержимое пакета:</strong><br>
              ${p.items}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
              <span style="font-size:11px; color:#555;">Имя файла: <strong>${p.file}</strong> (${p.size})</span>
              <button class="win-btn themeworld-btn-primary tw-btn-download-pack" data-pack-id="${p.id}" style="padding:4px 16px; font-size:11px;">
                ${window.webGif ? window.webGif('disk') : ''} Скачать полный пакет (${p.size})
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderGuestbookTab() {
    const entries = this.getGuestbookEntries();

    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <fieldset class="bevel-groove" style="padding:10px; background:#e8e8e8;">
          <legend style="font-weight:bold; color:#000080;">Оставить отзыв в Гостевой книге</legend>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
            <div>
              <label style="display:block; font-size:10px; margin-bottom:2px;">Ваше имя или никнейм:</label>
              <input type="text" id="tw-gb-name" style="width:100%; box-sizing:border-box; height:20px; font-size:11px;" placeholder="Neo_1999">
            </div>
            <div>
              <label style="display:block; font-size:10px; margin-bottom:2px;">Город / Страна:</label>
              <input type="text" id="tw-gb-city" style="width:100%; box-sizing:border-box; height:20px; font-size:11px;" placeholder="Москва / Россия">
            </div>
          </div>
          <div style="margin-bottom:8px;">
            <label style="display:block; font-size:10px; margin-bottom:2px;">Сообщение:</label>
            <textarea id="tw-gb-msg" rows="3" style="width:100%; box-sizing:border-box; font-size:11px; font-family:var(--win-font);" placeholder="Напишите пару добрых слов о темах или заставках..."></textarea>
          </div>
          <button class="win-btn" id="tw-btn-gb-submit" style="padding:3px 14px; font-weight:bold;">Отправить в гостевую книгу</button>
        </fieldset>

        <div class="themeworld-gb-list">
          ${entries.map(e => `
            <div class="themeworld-gb-entry">
              <div class="themeworld-gb-header">
                <span>${window.webGif ? window.webGif('user') : ''} <strong>${this.escapeHtml(e.name)}</strong> (${this.escapeHtml(e.from)})</span>
                <span style="font-size:10px; color:#666;">${e.date}</span>
              </div>
              <div class="themeworld-gb-text">${this.escapeHtml(e.text)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderWallpaperModal() {
    if (!this.previewModalWallpaper) return '';
    const w = this.previewModalWallpaper;

    return `
      <div class="themeworld-modal-overlay" id="tw-modal-overlay">
        <div class="themeworld-modal-win">
          <div class="themeworld-modal-titlebar">
            <span>Предпросмотр обоев: ${w.title}</span>
            <button class="themeworld-modal-close" id="tw-modal-close">&times;</button>
          </div>
          <div style="padding:10px; background:#c0c0c0;">
            <div class="themeworld-modal-picture" ${this.wallpaperStyle(w.id, 1024, 768)}>
              <div style="position:absolute; bottom:6px; right:6px; background:#000000; color:#00ff00; font-family:monospace; font-size:10px; padding:2px 6px;">${w.res} • ${w.format}</div>
            </div>
            <div style="margin:10px 0; font-size:11px;">
              <strong>${w.title}</strong> — ${w.desc}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #808080; padding-top:8px;">
              <div style="font-size:11px; color:#444;">
                После загрузки обои можно применить в <b>Свойства: Экран</b>.
              </div>
              <div style="display:flex; gap:6px;">
                <button class="win-btn themeworld-btn-primary" id="tw-modal-btn-dl" data-wall-id="${w.id}">${window.webGif ? window.webGif('disk') : ''} Скачать .BMP</button>
                <button class="win-btn" id="tw-modal-btn-close">Закрыть</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  wallpaperImage(id, width, height) {
    if (id === 'matrix') {
      return window.appDialogs && typeof window.appDialogs.getMatrixWallpaperUrl === 'function'
        ? window.appDialogs.getMatrixWallpaperUrl()
        : '';
    }
    return window.wallpaperArt ? window.wallpaperArt.url(id, width, height) : '';
  }

  wallpaperStyle(id, width, height) {
    const image = this.wallpaperImage(id, width, height);
    const background = image ? `#000 url('${image}') center / cover no-repeat` : '#000';
    return `data-wall-art="${id}" data-wall-w="${width}" data-wall-h="${height}" style="background:${background};"`;
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  attachEvents(win, container) {
    container.querySelectorAll('[data-tw-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.currentTab = btn.dataset.twTab;
        if (win && win.appIE) {
          win.appIE.renderPage(win, win.appIE.currentUrl);
        } else {
          container.innerHTML = this.renderSite(this.currentTab, this.searchQuery);
          this.attachEvents(win, container);
        }
      });
    });

    const catSelect = container.querySelector('.tw-filter-category');
    if (catSelect) {
      catSelect.addEventListener('change', () => {
        this.currentCategory = catSelect.value;
        if (win && win.appIE) {
          win.appIE.renderPage(win, win.appIE.currentUrl);
        } else {
          container.innerHTML = this.renderSite(this.currentTab, this.searchQuery);
          this.attachEvents(win, container);
        }
      });
    }

    const searchInput = container.querySelector('.tw-filter-search');
    const searchBtn = container.querySelector('.tw-btn-search');
    if (searchInput && searchBtn) {
      const doSearch = () => {
        this.searchQuery = searchInput.value.trim();
        if (win && win.appIE) {
          win.appIE.renderPage(win, win.appIE.currentUrl);
        } else {
          container.innerHTML = this.renderSite(this.currentTab, this.searchQuery);
          this.attachEvents(win, container);
        }
      };
      searchBtn.addEventListener('click', doSearch);
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          doSearch();
        }
      });
    }

    container.querySelectorAll('.tw-btn-preview-wall').forEach(btn => {
      btn.addEventListener('click', () => {
        const wallId = btn.dataset.wallId;
        const wall = this.getWallpapers().find(w => w.id === wallId);
        if (wall) {
          this.previewModalWallpaper = wall;
          if (win && win.appIE) {
            win.appIE.renderPage(win, win.appIE.currentUrl);
          } else {
            container.innerHTML = this.renderSite(this.currentTab, this.searchQuery);
            this.attachEvents(win, container);
          }
        }
      });
    });

    const modalClose = container.querySelector('#tw-modal-close');
    const modalBtnClose = container.querySelector('#tw-modal-btn-close');
    const closeModal = () => {
      this.previewModalWallpaper = null;
      if (win && win.appIE) {
        win.appIE.renderPage(win, win.appIE.currentUrl);
      } else {
        container.innerHTML = this.renderSite(this.currentTab, this.searchQuery);
        this.attachEvents(win, container);
      }
    };
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBtnClose) modalBtnClose.addEventListener('click', closeModal);

    container.querySelectorAll('.tw-btn-download-wall').forEach(btn => {
      btn.addEventListener('click', () => {
        const wallId = btn.dataset.wallId;
        const wall = this.getWallpapers().find(w => w.id === wallId);
        if (wall) this.startDownloadSimulation('wallpaper', wall);
      });
    });

    const modalBtnDl = container.querySelector('#tw-modal-btn-dl');
    if (modalBtnDl) {
      modalBtnDl.addEventListener('click', () => {
        const wall = this.getWallpapers().find(w => w.id === modalBtnDl.dataset.wallId);
        if (wall) {
          this.startDownloadSimulation('wallpaper', wall);
          closeModal();
        }
      });
    }

    container.querySelectorAll('.tw-btn-test-ss').forEach(btn => {
      btn.addEventListener('click', () => {
        const ssId = btn.dataset.ssId;
        if (window.appScreensaver) {
          window.appScreensaver.start(ssId);
        }
      });
    });

    container.querySelectorAll('.tw-btn-download-ss').forEach(btn => {
      btn.addEventListener('click', () => {
        const ssId = btn.dataset.ssId;
        const ss = this.getScreensavers().find(s => s.id === ssId);
        if (ss) this.startDownloadSimulation('screensaver', ss);
      });
    });

    container.querySelectorAll('.tw-btn-download-theme').forEach(btn => {
      btn.addEventListener('click', () => {
        const thId = btn.dataset.themeId;
        const th = this.getThemes().find(t => t.id === thId);
        if (th) this.startDownloadSimulation('theme', th);
      });
    });

    container.querySelectorAll('.tw-btn-download-pack').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = btn.dataset.packId;
        const p = this.getPacks().find(x => x.id === pId);
        if (p) this.startDownloadSimulation('pack', p);
      });
    });

    const gbBtn = container.querySelector('#tw-btn-gb-submit');
    if (gbBtn) {
      gbBtn.addEventListener('click', () => {
        const nameInput = container.querySelector('#tw-gb-name');
        const cityInput = container.querySelector('#tw-gb-city');
        const msgInput = container.querySelector('#tw-gb-msg');

        if (!msgInput || !msgInput.value.trim()) {
          window.winManager.openDialog({
            title: 'Гостевая книга',
            icon: 'error',
            message: 'Пожалуйста, введите текст сообщения!'
          });
          return;
        }

        this.saveGuestbookEntry(nameInput.value, cityInput.value, msgInput.value);

        if (window.soundSys) window.soundSys.playDing();

        window.winManager.openDialog({
          title: 'Гостевая книга',
          icon: 'info',
          message: 'Спасибо! Ваша запись успешно опубликована в Гостевой книге ThemeWorld \'98!'
        });

        if (win && win.appIE) {
          win.appIE.renderPage(win, win.appIE.currentUrl);
        } else {
          container.innerHTML = this.renderSite(this.currentTab, this.searchQuery);
          this.attachEvents(win, container);
        }
      });
    }
  }

  generateWallpaperDataUrl(wall) {
    if (typeof document === 'undefined') return '';
    return this.wallpaperImage(wall.id, 640, 480);
  }

  startDownloadSimulation(type, item) {
    let fileName = '';
    let targetFolder = '';
    let vfsPath = [];
    let fileContent = '';

    if (type === 'wallpaper') {
      fileName = `${item.id}_wallpaper.bmp`;
      targetFolder = 'C:\\My Documents\\Мои рисунки';
      vfsPath = ['My Computer', 'C:', 'My Documents', 'Мои рисунки'];
      fileContent = this.generateWallpaperDataUrl(item) || `[Win 98 Bitmap Image Wallpaper: ${item.title}]`;
    } else if (type === 'screensaver') {
      fileName = item.file;
      targetFolder = 'C:\\WINDOWS\\SYSTEM';
      vfsPath = ['My Computer', 'C:', 'My Documents', 'Downloads'];
      fileContent = `[Win32 Screen Saver: ${item.name}]`;
    } else if (type === 'theme') {
      fileName = item.file;
      targetFolder = 'C:\\Program Files\\Plus!\\Themes';
      vfsPath = ['My Computer', 'C:', 'My Documents', 'Downloads'];
      fileContent = `[Microslop Plus! 98 Desktop Theme Package: ${item.name}]`;
    } else {
      fileName = item.file;
      targetFolder = 'C:\\My Documents\\Downloads';
      vfsPath = ['My Computer', 'C:', 'My Documents', 'Downloads'];
      fileContent = `[Setup Installer: ${item.title}]`;
    }

    const winId = `tw_dl_${Date.now()}`;
    const win = window.winManager.createWindow({
      id: winId,
      title: `Сохранение: ${fileName}`,
      icon: 'internet-explorer',
      width: 420,
      height: 250,
      resizable: false,
      content: `
        <div style="padding:14px; font-family:var(--win-font); display:flex; flex-direction:column; gap:10px; height:100%; box-sizing:border-box; justify-content:space-between;">
          <div style="display:flex; gap:12px; align-items:center;">
            ${window.webGif ? window.webGif('disk', 2) : ''}
            <div style="flex:1; font-size:11px; line-height:1.4;">
              <div><strong>Файл:</strong> ${fileName}</div>
              <div style="color:#555;">Узел: http://www.themeworld98.com/dl/</div>
              <div style="color:#555;">Папка: ${targetFolder} (${item.size || '1.2 МБ'})</div>
            </div>
          </div>

          <div>
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
              <span id="${winId}_status">Установка 56K модемного соединения...</span>
              <span id="${winId}_percent">0%</span>
            </div>
            <div style="height:18px; border:2px inset #808080; background:#fff; position:relative; overflow:hidden;">
              <div id="${winId}_bar" style="height:100%; width:0%; background:#000080; transition:width 0.2s linear;"></div>
            </div>
            <div id="${winId}_speed" style="font-size:11px; color:#555; margin-top:4px;">Скорость передачи: 5.4 КБ/сек (осталось: 3 сек)</div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:8px; border-top:1px solid #c0c0c0; padding-top:8px;">
            <button class="win-btn" id="${winId}_btn_open_disp" disabled style="min-width:140px;">Свойства: Экран...</button>
            <button class="win-btn" id="${winId}_btn_cancel" style="min-width:80px; font-weight:bold;">Отмена</button>
          </div>
        </div>
      `
    });

    const el = win.element;
    const bar = el.querySelector(`#${winId}_bar`);
    const status = el.querySelector(`#${winId}_status`);
    const percent = el.querySelector(`#${winId}_percent`);
    const speed = el.querySelector(`#${winId}_speed`);
    const btnOpenDisp = el.querySelector(`#${winId}_btn_open_disp`);
    const btnCancel = el.querySelector(`#${winId}_btn_cancel`);

    let progress = 0;
    let isCancelled = false;

    btnCancel.addEventListener('click', () => {
      isCancelled = true;
      window.winManager.closeWindow(winId);
    });

    btnOpenDisp.addEventListener('click', () => {
      window.winManager.closeWindow(winId);
      if (window.appDialogs && typeof window.appDialogs.openDisplayProperties === 'function') {
        window.appDialogs.openDisplayProperties();
      }
    });

    const interval = setInterval(() => {
      if (isCancelled) {
        clearInterval(interval);
        return;
      }

      progress += 20;
      if (progress > 100) progress = 100;

      bar.style.width = `${progress}%`;
      percent.textContent = `${progress}%`;
      status.textContent = `Загрузка: ${progress}% завершено...`;

      if (progress >= 100) {
        clearInterval(interval);
        status.textContent = 'Загрузка успешно завершена!';
        speed.innerHTML = `Файл сохранен. Вы можете применить его в <b>Свойства: Экран</b>.`;
        btnCancel.textContent = 'Закрыть';
        btnOpenDisp.disabled = false;

        if (window.appDialogs && typeof window.appDialogs.markDownloaded === 'function') {
          window.appDialogs.markDownloaded(type, item.id);
          if (type === 'pack') {
            if (item.id === 'pack_matrix') {
              window.appDialogs.markDownloaded('wallpaper', 'matrix');
              window.appDialogs.markDownloaded('screensaver', 'matrix');
              window.appDialogs.markDownloaded('theme', 'matrix');
            } else if (item.id === 'pack_plus') {
              ['space', 'underwater', 'creatures', 'mystery', 'jungle', 'classic'].forEach(tId => window.appDialogs.markDownloaded('theme', tId));
              ['pipes', 'starfield', 'mystify', 'flowerbox'].forEach(sId => window.appDialogs.markDownloaded('screensaver', sId));
            }
          } else if (type === 'theme') {
            window.appDialogs.markDownloaded('wallpaper', item.id);
          }
        }

        if (window.vfs && typeof window.vfs.writeFile === 'function') {
          window.vfs.writeFile(vfsPath, fileName, fileContent);
        }

        if (window.soundSys) window.soundSys.playDing();
      }
    }, 450);
  }
}

window.themeWorldSite = new ThemeWorldSite();
