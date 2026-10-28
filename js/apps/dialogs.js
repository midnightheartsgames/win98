class AppDialogs {
  constructor() {
    this.displayStorageKey = 'win98_display_settings';
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.applySavedDisplaySettings();
        });
      } else {
        this.applySavedDisplaySettings();
      }
    }
  }

  getDefaultDisplaySettings() {
    return {
      bgColor: '#008080',
      wallpaper: 'none',
      wallpaperMode: 'stretch',
      themeId: 'classic',
      themeGrad: 'linear-gradient(90deg, #000080, #1084d0)',
      crtEnabled: true,
      largeIcons: false,
      iconColors: true,
      animateUi: true,
      fontSmoothing: true,
      fullDrag: true,
      desktopIcons: {},
      screensaverMode: 'pipes',
      screensaverTimeout: 3,
      colorDepth: '32bit',
      resolution: '1024x768'
    };
  }

  getDisplaySettings() {
    const defaults = this.getDefaultDisplaySettings();
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.displayStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          const hasExplicit = localStorage.getItem('win98_custom_screensaver_timeout');
          let timeout = Math.max(1, parseInt(parsed.screensaverTimeout, 10) || 3);
          if (!hasExplicit) timeout = 3;

          return {
            ...defaults,
            ...parsed,
            screensaverTimeout: timeout
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse display settings from localStorage:', e);
    }
    return defaults;
  }

  saveDisplaySettings(settings) {
    const current = this.getDisplaySettings();
    const merged = { ...current, ...settings };
    try {
      if (typeof localStorage !== 'undefined') {
        if (settings && settings.screensaverTimeout !== undefined) {
          localStorage.setItem('win98_custom_screensaver_timeout', '1');
        }
        localStorage.setItem(this.displayStorageKey, JSON.stringify(merged));
      }
    } catch (e) {
      console.warn('Failed to save display settings to localStorage:', e);
    }
    return merged;
  }

  getMatrixWallpaperUrl() {
    if (this._matrixWallpaperUrl) return this._matrixWallpaperUrl;
    if (typeof document === 'undefined') return 'radial-gradient(circle at 50% 50%, #002b0c 0%, #000401 100%)';

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 768;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1024, 768);

      const chars = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜﾝ0123456789ABCDEFZ$+-*=%<>~#:';
      const fontSize = 16;
      const cols = Math.floor(1024 / fontSize);
      const totalRows = Math.ceil(768 / fontSize);

      ctx.font = 'bold 15px "Courier New", monospace';
      ctx.textAlign = 'center';

      for (let col = 0; col < cols; col++) {
        const x = col * fontSize + fontSize / 2;

        const streamHeads = [
          Math.floor(Math.random() * (totalRows * 0.38)),
          Math.floor(totalRows * 0.32 + Math.random() * (totalRows * 0.38)),
          Math.floor(totalRows * 0.65 + Math.random() * (totalRows * 0.45))
        ];

        streamHeads.forEach(headY => {
          const streamLen = 14 + Math.floor(Math.random() * 22);
          for (let j = 0; j < streamLen; j++) {
            const cy = headY - j;
            if (cy < 0 || cy >= totalRows) continue;
            const py = (cy + 1) * fontSize;
            const char = chars.charAt(Math.floor(Math.random() * chars.length));

            if (j === 0) {
              ctx.fillStyle = '#ffffff';
              ctx.shadowColor = '#00ff66';
              ctx.shadowBlur = 8;
              ctx.fillText(char, x, py);
              ctx.shadowBlur = 0;
            } else if (j === 1) {
              ctx.fillStyle = '#99ffb8';
              ctx.shadowColor = '#00ff41';
              ctx.shadowBlur = 4;
              ctx.fillText(char, x, py);
              ctx.shadowBlur = 0;
            } else {
              const factor = Math.pow(1 - (j / streamLen), 1.25);
              const green = Math.floor(35 + 220 * factor);
              ctx.fillStyle = `rgb(0, ${green}, ${Math.floor(25 * factor)})`;
              ctx.fillText(char, x, py);
            }
          }
        });
      }

      this._matrixWallpaperUrl = canvas.toDataURL('image/png');
      return this._matrixWallpaperUrl;
    } catch (e) {
      return 'radial-gradient(circle at 50% 50%, #002b0c 0%, #000401 100%)';
    }
  }

  getDownloadedWallpapers() {
    try {
      const raw = localStorage.getItem('win98_downloaded_wallpapers');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  getDownloadedScreensavers() {
    try {
      const raw = localStorage.getItem('win98_downloaded_screensavers');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  getDownloadedThemes() {
    try {
      const raw = localStorage.getItem('win98_downloaded_themes');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  markDownloaded(type, id) {
    if (!id || typeof localStorage === 'undefined') return;
    try {
      let key = '';
      if (type === 'wallpaper') key = 'win98_downloaded_wallpapers';
      else if (type === 'screensaver') key = 'win98_downloaded_screensavers';
      else if (type === 'theme') key = 'win98_downloaded_themes';
      if (!key) return;

      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Failed to save downloaded item:', e);
    }
  }

  getWallpaperCss(wallpaperId) {
    if (!wallpaperId || wallpaperId === 'none') return 'none';
    if (wallpaperId.startsWith('url(') || wallpaperId.startsWith('linear-gradient') || wallpaperId.startsWith('radial-gradient')) {
      return wallpaperId;
    }
    if (wallpaperId.startsWith('data:image')) {
      return `url("${wallpaperId}")`;
    }
    if (wallpaperId === 'matrix') return `url("${this.getMatrixWallpaperUrl()}")`;
    const art = window.wallpaperArt && window.wallpaperArt.url(wallpaperId);
    return art ? `url("${art}")` : 'none';
  }

  applyWallpaperMode(el, mode, wallpaperId) {
    if (!el) return;
    const hasWallpaper = !!wallpaperId && wallpaperId !== 'none';
    if (el.id === 'desktop' && el.classList) el.classList.toggle('has-wallpaper', hasWallpaper);
    if (!hasWallpaper) {
      el.style.backgroundImage = 'none';
      return;
    }
    el.style.backgroundImage = this.getWallpaperCss(wallpaperId);
    if (mode === 'center') {
      el.style.backgroundSize = 'auto';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
    } else if (mode === 'tile') {
      el.style.backgroundSize = 'auto';
      el.style.backgroundRepeat = 'repeat';
      el.style.backgroundPosition = 'top left';
    } else {
      el.style.backgroundSize = 'cover';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
    }
  }

  applyDisplaySettings(settings) {
    const s = { ...this.getDefaultDisplaySettings(), ...settings };
    if (typeof document === 'undefined') return;

    const desktopEl = document.getElementById('desktop');
    const crtOverlay = document.getElementById('crt-overlay');

    if (desktopEl) {
      desktopEl.style.backgroundColor = s.bgColor;
      this.applyWallpaperMode(desktopEl, s.wallpaperMode, s.wallpaper);
    }
    document.documentElement.style.setProperty('--win-desktop-bg', s.bgColor);

    if (s.themeGrad) {
      document.documentElement.style.setProperty('--win-active-title', s.themeGrad);
    }

    if (crtOverlay) {
      if (s.crtEnabled) {
        crtOverlay.classList.add('active');
        document.body.classList.add('crt-enabled');
      } else {
        crtOverlay.classList.remove('active');
        document.body.classList.remove('crt-enabled');
      }
    }

    this.setBodyFlag('fx-low-color', !s.iconColors);
    this.setBodyFlag('fx-animate', s.animateUi);
    this.setBodyFlag('fx-aliased-text', !s.fontSmoothing);
    this.setBodyFlag('fx-outline-drag', !s.fullDrag);
    this.setBodyFlag('display-16color', s.colorDepth === '16color');
    this.setBodyFlag('display-256color', s.colorDepth === '256color');
    if (window.desktop && typeof window.desktop.applyIconSettings === 'function') {
      window.desktop.applyIconSettings(s.largeIcons, s.desktopIcons);
    } else {
      this.setBodyFlag('fx-large-icons', s.largeIcons);
    }

    if (window.appScreensaver) {
      if (typeof window.appScreensaver.applyConfig === 'function') {
        window.appScreensaver.applyConfig(s.screensaverMode, s.screensaverTimeout);
      } else {
        window.appScreensaver.currentMode = s.screensaverMode;
        window.appScreensaver.timeoutSeconds = Math.max(1, s.screensaverTimeout) * 60;
      }
    }
  }

  setBodyFlag(className, on) {
    if (!document.body || !document.body.classList) return;
    if (on) document.body.classList.add(className);
    else document.body.classList.remove(className);
  }

  applySavedDisplaySettings() {
    const settings = this.getDisplaySettings();
    this.applyDisplaySettings(settings);
    return settings;
  }

  toggleCrt() {
    const nextVal = !this.getDisplaySettings().crtEnabled;
    this.setDisplayEffects({ crtEnabled: nextVal }, 'tray');
    return nextVal;
  }

  setDisplayEffects(patch, source) {
    const before = this.getDisplaySettings();
    const updated = this.saveDisplaySettings(patch);
    this.applyDisplaySettings(updated);
    if (typeof this.syncDisplayProps === 'function') this.syncDisplayProps(patch);
    if (source !== 'clippy') this.notifyDisplayEffects(before, updated, source);
    return updated;
  }

  changedDisplayEffects(before, after) {
    const flags = {};
    ['largeIcons', 'iconColors', 'animateUi', 'fontSmoothing', 'fullDrag', 'crtEnabled'].forEach(key => {
      if (Boolean(before[key]) !== Boolean(after[key])) flags[key] = Boolean(after[key]);
    });
    const oldIcons = before.desktopIcons || {};
    const newIcons = after.desktopIcons || {};
    const icons = Array.from(new Set(Object.keys(oldIcons).concat(Object.keys(newIcons))))
      .filter(slot => oldIcons[slot] !== newIcons[slot])
      .map(slot => ({ slot, icon: newIcons[slot] || null, previous: oldIcons[slot] || null }));
    const values = {};
    if ((before.colorDepth || '32bit') !== (after.colorDepth || '32bit')) {
      values.colorDepth = { from: before.colorDepth || '32bit', to: after.colorDepth || '32bit' };
    }
    return { flags, icons, values };
  }

  notifyDisplayEffects(before, after, source) {
    const changes = this.changedDisplayEffects(before, after);
    if (!Object.keys(changes.flags).length && !changes.icons.length && !Object.keys(changes.values).length) return;
    if (window.appClippy && typeof window.appClippy.onDisplayEffectsChanged === 'function') {
      window.appClippy.onDisplayEffectsChanged(changes, source);
    }
  }

  openAboutWindows() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '380px';

    content.innerHTML = `
      <div style="display:flex; gap:16px; align-items:flex-start;">
        <div style="width:48px; height:48px; flex-shrink:0;">${Icons['start-logo']}</div>
        <div style="line-height:1.4; font-size:11px;">
          <p style="font-weight:bold; font-size:13px; color:#000080;">${t('about.winTitle')}</p>
          <p style="color:#555; margin-bottom:8px;">${t('about.edition')}</p>
          <p>${t('about.copyright')}</p>
          <p style="margin-top:8px;">${t('about.licensedTo')}</p>
          <p style="margin-left:10px;"><strong>${t('about.user')}</strong><br>${t('about.org')}</p>
          <div class="win-menu-separator" style="margin:10px 0;"></div>
          <p>${t('about.memory')}</p>
          <p>${t('about.resources')}</p>
          <p class="about-project-build" hidden></p>
        </div>
      </div>

      <div class="win-dialog-buttons" style="margin-top:10px;">
        <button class="win-btn btn-about-ok" style="font-weight:bold;">${t('btn.ok')}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_about_windows',
      title: t('about.title'),
      icon: 'help',
      width: 410,
      height: 266,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const buildLine = dialog.element.querySelector('.about-project-build');
    if (window.BugReport && buildLine) {
      window.BugReport.buildInfo().then(info => {
        const label = info.version && info.version !== 'dev' ? info.version + (info.build ? ' (' + info.build + ')' : '') : info.commit ? 'dev, ' + info.commit : '';
        if (!label) return;
        buildLine.textContent = t('about.projectBuild', label);
        buildLine.hidden = false;
      }).catch(() => {});
    }

    dialog.element.querySelector('.btn-about-ok').addEventListener('click', () => {
      window.winManager.closeWindow('app_about_windows');
    });
  }

  openHelp(startTopic = 'welcome') {
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const L = (ru, en) => (isRu ? ru : en);
    const icon = (name) => Icons[name] || '';

    const books = [
      { id: 'intro', title: L('Знакомство с Win 98', 'Introducing Win 98'), topics: ['welcome', 'whatsnew', 'clippy', 'about'] },
      { id: 'basics', title: L('Основы работы', 'Exploring Your Computer'), topics: ['desktop', 'startmenu', 'explorer', 'shortcuts'] },
      { id: 'programs', title: L('Программы', 'Using Programs'), topics: ['apps', 'multimedia', 'internet'] },
      { id: 'settings', title: L('Настройка компьютера', 'Customizing Your Computer'), topics: ['cpanel'] },
      { id: 'maintenance', title: L('Обслуживание и неполадки', 'Maintenance and Troubleshooting'), topics: ['system', 'run', 'troubleshooting'] }
    ];

    const titles = {
      welcome: L('Добро пожаловать', 'Welcome'),
      whatsnew: L('Что нового в системе', 'What’s New in the System'),
      clippy: L('Помощник Скрепыш', 'Clippy the Office Assistant'),
      about: L('О системе Win 98 SE', 'About Win 98 SE'),
      desktop: L('Рабочий стол и окна', 'The Desktop and Windows'),
      startmenu: L('Меню «Пуск» и панель задач', 'The Start Menu and Taskbar'),
      explorer: L('Мой компьютер, Проводник и поиск', 'My Computer, Explorer, and Find'),
      shortcuts: L('Сочетания клавиш', 'Keyboard Shortcuts'),
      apps: L('Стандартные и прикладные программы', 'Accessories and Applications'),
      multimedia: L('Мультимедиа, звук и видео', 'Multimedia, Sound, and Video'),
      internet: L('Интернет, почта и связь', 'Internet, Mail, and Communications'),
      cpanel: L('Панель управления', 'Control Panel'),
      system: L('Служебные программы и диагностика', 'System Tools and Diagnostics'),
      run: L('Команда «Выполнить» и сеанс MS-DOS', 'The Run Command and MS-DOS Prompt'),
      troubleshooting: L('Устранение неполадок и BIOS', 'Troubleshooting and BIOS')
    };

    const shortcut = (target, text) => `<p class="win-help-shortcut-row"><button class="win-help-shortcut" data-run="${target}" title="${L('Открыть', 'Open')}">${icon('shortcut-overlay')}</button><span>${text}</span></p>`;
    const related = (...ids) => `<div class="win-help-related"><div class="win-help-related-title">${L('Связанные разделы', 'Related Topics')}</div>${ids.map(id => `<a href="javascript:void(0)" class="win-help-link" data-topic="${id}">${titles[id]}</a>`).join('')}</div>`;
    const note = (items) => `<h3>${L('Примечания', 'Notes')}</h3><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
    const glyph = (name) => `<span class="win-help-glyph">${icon(name)}</span>`;
    const key = (k) => `<span class="win-help-key">${k}</span>`;

    const helpTopics = [
      {
        id: 'welcome',
        keywords: L('добро пожаловать, обзор, начало, справка, книга, путеводитель, содержание, указатель, поиск', 'welcome, overview, start, help, book, guide, contents, index, search'),
        content: `
          <h2>${L('Добро пожаловать в Microslop Win 98 Second Edition', 'Welcome to Microslop Win 98 Second Edition')}</h2>
          <p>${L('Эта справка описывает устройство системы в её текущем состоянии: рабочий стол и окна, меню «Пуск» и панель задач, Проводник и поиск файлов, все десять значков Панели управления, стандартные и прикладные программы, мультимедиа, Интернет, служебные утилиты, сеанс MS-DOS, помощника Скрепыша и настройку BIOS.', 'This Help describes the system in its current state: the desktop and windows, the Start menu and taskbar, Explorer and file search, all ten Control Panel applets, accessories and applications, multimedia, Internet tools, system utilities, the MS-DOS Prompt, Clippy the Office Assistant, and BIOS Setup.')}</p>
          <h3>${L('Как пользоваться справкой', 'How to use Help')}</h3>
          <ol>
            <li>${L('На вкладке <b>Содержание</b> щелкните книгу, чтобы раскрыть список её разделов.', 'On the <b>Contents</b> tab, click a book to expand its list of topics.')}</li>
            <li>${L('Щелкните раздел со значком', 'Click a topic marked with')} ${glyph('help-page')}${L(', чтобы открыть статью справа.', ' to read the article in the right pane.')}</li>
            <li>${L('На вкладке <b>Указатель</b> введите первые буквы термина или названия программы и нажмите <b>Показать</b> (или дважды щелкните строку в списке).', 'On the <b>Index</b> tab, type the first letters of a term or program name and click <b>Display</b> (or double-click an entry).')}</li>
            <li>${L('На вкладке <b>Поиск</b> введите любое слово и нажмите <b>Разделы</b> — справка найдет все статьи, где встречается этот запрос.', 'On the <b>Search</b> tab, type any word and click <b>List Topics</b> to find every article containing that term.')}</li>
            <li>${L('Кнопки со стрелкой', 'Buttons marked with')} ${glyph('shortcut-overlay')} ${L('внутри статей сразу запускают нужную программу или окно настроек.', 'inside articles open the corresponding program or settings dialog right away.')}</li>
          </ol>
          ${shortcut('winver', L('Щелкните здесь, чтобы открыть сведения о версии системы.', 'Click here to open the system version dialog.'))}
          ${shortcut('control', L('Щелкните здесь, чтобы открыть Панель управления.', 'Click here to open Control Panel.'))}
          ${note([
            L('Кнопки <b>Назад</b> и <b>Вперед</b> на панели инструментов возвращают к просмотренным разделам, а кнопка <b>Домой</b> открывает эту страницу.', 'The <b>Back</b> and <b>Forward</b> buttons move through topics you have already viewed, and <b>Home</b> returns to this page.'),
            L('Кнопка <b>Скрыть</b> убирает левую панель навигации, чтобы освободить место для текста; кнопка <b>Показать</b> возвращает её.', 'The <b>Hide</b> button removes the left navigation pane to make room for text; <b>Show</b> brings it back.'),
            L('Нажмите ' + key('F1') + ' на рабочем столе: помощник Скрепыш откроет поиск по вопросам на естественном языке. Если помощник скрыт или отключен, ' + key('F1') + ' открывает эту справку.', 'Press ' + key('F1') + ' on the desktop and Clippy the Office Assistant opens a natural-language question search. When the assistant is hidden or turned off, ' + key('F1') + ' opens this Help.')
          ])}
          ${related('whatsnew', 'clippy', 'cpanel', 'desktop')}
        `
      },
      {
        id: 'whatsnew',
        keywords: L('новое, обновление, значки, быстрый запуск, подсказки, клавиатура, выделение, ярлык, часы, мышь, электропитание, темы, эффекты, панель задач, bios, игры, steam', 'new, update, icons, quick launch, tooltips, keyboard, selection, shortcut, clock, mouse, power, themes, effects, taskbar, bios, games, steam'),
        content: `
          <h2>${titles.whatsnew}</h2>
          <p>${L('Оболочка, Панель управления и системные службы приведены к виду и поведению Microslop Win 98 Second Edition.', 'The shell, Control Panel, and system services match the look and behavior of Microslop Win 98 Second Edition.')}</p>
          <h3>${L('Панель управления и настройка системы', 'Control Panel and system customization')}</h3>
          <ul>
            <li>${L('<b>Мышь (main.cpl)</b> — переключение кнопок для правши и левши, настройка скорости двойного щелчка с проверкой на шкатулке с клоуном, отключение щелчков мыши (со спасением от Скрепыша), выбор схем указателей (включая «3D-бронза», «Динозаврик» и «Инверсная»), скорость движения и шлейф за курсором.', '<b>Mouse (main.cpl)</b> — right-handed and left-handed button swap, double-click speed slider with a jack-in-the-box test area, click-disabling checkbox (with automatic rescue by Clippy), pointer schemes (including 3D Bronze, Dinosaur, and Inverted), pointer speed, and pointer trails.')}</li>
            <li>${L('<b>Экран (desk.cpl)</b> — пять вкладок: «Фон» (обои и загрузка своей картинки), «Заставка» (3D-трубы, звездное небо, причуды, геометрический вальс и скачанные хранители), «Оформление» (8 цветовых схем и палитра рабочего стола), «Эффекты» (смена значков рабочего стола, крупные и 16-цветные значки, анимация окон, сглаживание шрифтов, перетаскивание рамкой, ЭЛТ-полосы) и «Темы» (Microslop Plus! 98).', '<b>Display (desk.cpl)</b> — five tabs: Background (wallpapers and custom images), Screen Saver (3D Pipes, Starfield, Mystify, Beziers, and downloaded savers), Appearance (8 color schemes and desktop color picker), Effects (custom desktop icons, large and 16-color icons, window animation, font smoothing, outline dragging, CRT scanlines), and Themes (Microslop Plus! 98).')}</li>
            <li>${L('<b>Система (sysdm.cpl)</b> — сведения о процессоре и ОЗУ из BIOS, Диспетчер устройств с деревом оборудования (3dfx Voodoo2, S3 Trio64V2/DX, Sound Blaster AWE64 Gold, CD-ROM Toshiba) и вкладка «Быстродействие» с настройками файловой системы, аппаратного ускорения графики и виртуальной памяти (WIN386.SWP).', '<b>System (sysdm.cpl)</b> — CPU and RAM data from BIOS, Device Manager hardware tree (3dfx Voodoo2, S3 Trio64V2/DX, Sound Blaster AWE64 Gold, Toshiba CD-ROM), and Performance tab with File System, Graphics hardware acceleration, and Virtual Memory (WIN386.SWP) settings.')}</li>
            <li>${L('<b>Электропитание (powercfg.cpl)</b> — схемы энергосбережения Energy Star, таймеры отключения монитора и остановки жестких дисков, сохранение своих схем и значок питания в области уведомлений.', '<b>Power Management (powercfg.cpl)</b> — Energy Star power schemes, monitor standby and hard disk spin-down timers, custom scheme saving, and a notification area power icon.')}</li>
            <li>${L('<b>Установка и удаление программ (appwiz.cpl)</b> — удаление программ и игр, мастер установки с компакт-диска D: и папки Downloads, выбор компонентов Win 98 и запись загрузочной дискеты A:.', '<b>Add/Remove Programs (appwiz.cpl)</b> — program and game uninstallation, installation wizard scanning CD drive D: and Downloads, Win 98 component selection, and Startup Disk creation on drive A:.')}</li>
            <li>${L('<b>Панель задач и меню «Пуск»</b> — автоскрытие панели задач, мелкие значки в меню «Пуск», показ часов, мастер добавления и удаления ярлыков программ и очистка журнала документов.', '<b>Taskbar & Start Menu</b> — taskbar auto-hide, small Start menu icons, clock toggle, wizard for adding or removing program shortcuts, and recent documents cleanup.')}</li>
          </ul>
          <h3>${L('Рабочий стол, Проводник и аппаратная часть', 'Desktop, Explorer, and hardware simulation')}</h3>
          <ul>
            <li>${L('Системные значки отрисованы попиксельно в палитре Win 98 отдельно для размеров 32×32 и 16×16; выделенный значок покрывается синей сеткой, а ярлыки отмечены стрелкой', 'System icons are drawn pixel by pixel in the Win 98 palette with separate 32×32 and 16×16 versions; selected icons use a blue dither pattern and shortcuts carry the arrow')} ${glyph('shortcut-overlay')}.</li>
            <li>${L('Проводник снабжен крупными кнопками с подписями, адресной строкой и левой панелью с круговой диаграммой занятого и свободного места на диске C:.', 'Explorer has large labeled toolbar buttons, an address bar, and a left description pane with a pie chart of used and free space on drive C:.')}</li>
            <li>${L('При загрузке и перезагрузке доступен <b>CMOS Setup Utility (BIOS)</b>: настройка частоты шины и множителя CPU, объема памяти, порядка загрузки (A:, C:, CD-ROM) и проверка POST.', 'During startup or restart you can enter the <b>CMOS Setup Utility (BIOS)</b> to configure CPU bus clock and multiplier, RAM size, boot sequence (A:, C:, CD-ROM), and POST checks.')}</li>
            <li>${L('Игры распространяются через каталог <b>Steam</b> (скачивается с <code>www.steampowered.com</code> в Internet Explorer), демоверсии доступны на компакт-диске «Игромании» (D:), а бесплатную <b>Honkai: Star Rail 98</b> можно скачать также с официального сайта <code>hsr.hoyoverse.com</code>.', 'Games are distributed through the <b>Steam</b> client (downloaded from <code>www.steampowered.com</code> in Internet Explorer), playable demos reside on the Igromania CD (D:), and free-to-play <b>Honkai: Star Rail 98</b> can also be downloaded from its official site <code>hsr.hoyoverse.com</code>.')}</li>
          </ul>
          ${related('cpanel', 'desktop', 'startmenu', 'explorer')}
        `
      },
      {
        id: 'clippy',
        keywords: L('скрепыш, помощник, скрепка, clippy, совет, вопрос, мастер писем, шеф идет, викторина, гардероб, параметры помощника, f1', 'clippy, assistant, paperclip, tip, question, letter wizard, boss key, quiz, wardrobe, assistant options, f1'),
        content: `
          <h2>${titles.clippy}</h2>
          <p>${L('Интерактивный помощник <b>Скрепыш</b> (Microslop Agent, <code>clippy.exe</code>) живет в правом нижнем углу экрана и в области уведомлений. Он отвечает на вопросы по системе, дает контекстные советы по активному окну и помогает составлять документы.', '<b>Clippy</b> the Office Assistant (Microslop Agent, <code>clippy.exe</code>) lives in the bottom-right corner of the screen and in the notification area. He answers questions about the system, gives context-sensitive tips for the active window, and helps draft documents.')}</p>
          <h3>${L('Возможности Скрепыша', 'What Clippy can do')}</h3>
          <ul>
            <li>${L('<b>Поиск ответов (' + key('F1') + ')</b> — введите вопрос своими словами (например, «как сменить обои», «где скачанные файлы» или название игры), и Скрепыш покажет ответ с кнопкой быстрого запуска нужного окна.', '<b>Question search (' + key('F1') + ')</b> — type a question in plain words (such as how to change wallpaper, where downloads go, or a game title) and Clippy displays an answer with a one-click button to open the right tool.')}</li>
            <li>${L('<b>Мастер писем</b> — задает три вопроса (кому, по какому поводу и в каком тоне) и автоматически печатает готовое заявление, объяснительную или письмо в Блокноте, WordPad или Outlook Express.', '<b>Letter Wizard</b> — asks three questions (recipient, subject, and tone) and drafts a ready-made letter or memo directly into Notepad, WordPad, or Outlook Express.')}</li>
            <li>${L('<b>Кнопка «Шеф идёт!» (Boss Key)</b> — мгновенно сворачивает все запущенные игры и открывает строгий квартальный отчёт в Microslop Excel 97.', '<b>Boss Key</b> — immediately minimizes all running games and opens a quarterly financial spreadsheet in Microslop Excel 97.')}</li>
            <li>${L('<b>Беседы, загадки и игры</b> — в меню «Поговорить» доступны компьютерные загадки, офисные байки, игра «Камень, ножницы, бумага» и «Ретро-Викторина 1998» из пяти вопросов с наградой в гардероб.', '<b>Chat, riddles, and mini-games</b> — the Talk menu offers computer riddles, office stories, Rock-Paper-Scissors, and the five-question 1998 Retro Quiz that unlocks a crown in his wardrobe.')}</li>
            <li>${L('<b>Гардероб и Параметры</b> — на сайте <code>www.clippy98.com</code> скачиваются шляпы, очки, усы и галстуки; в «Параметрах помощника» настраиваются категории подсказок, режим тихой лампочки и коллекция персонажей.', '<b>Wardrobe and Options</b> — download hats, glasses, mustaches, and ties from <code>www.clippy98.com</code>; open Assistant Options to filter tip categories, switch to quiet lightbulb notifications, or browse the character gallery.')}</li>
          </ul>
          ${shortcut('clippy', L('Щелкните здесь, чтобы позвать Скрепыша.', 'Click here to summon Clippy.'))}
          ${note([
            L('Щелкните по Скрепышу правой кнопкой мыши или по значку скрепки в трее, чтобы открыть меню команд, параметров или спрятать помощника.', 'Right-click Clippy or click the paperclip icon in the notification area to open his command menu, change options, or hide him.'),
            L('Полностью удалить или переустановить Скрепыша можно через «Установку и удаление программ» (пакет <b>Microslop Office 97 (Скрепыш)</b>).', 'You can remove or repair Clippy through Add/Remove Programs under <b>Microslop Office 97 (Clippy)</b>.')
          ])}
          ${related('welcome', 'apps', 'cpanel')}
        `
      },
      {
        id: 'about',
        keywords: L('о системе, версия, winver, сведения, лицензия, сборка, 4.10.1998, процессор, память', 'about, version, winver, information, license, build, 4.10.1998, processor, memory'),
        content: `
          <h2>Microslop Win 98 Second Edition</h2>
          <p><b>${L('Версия 4.10.1998 A (Сборка 2222 A)', 'Version 4.10.1998 A (Build 2222 A)')}</b></p>
          <p>${L('Интерактивная среда Microslop Win 98 SE воспроизводит оконный менеджер, файловую систему с дисками A:, C: и D:, Панель управления, стандартные и офисные программы, мультимедийный стек, модемное подключение, локальную сеть сайтов 1998 года, реестр, сеанс MS-DOS и настройку BIOS.', 'This interactive Microslop Win 98 SE environment reproduces the window manager, the virtual file system with drives A:, C:, and D:, Control Panel, accessories and office software, multimedia tools, dial-up networking, 1998 web sites, the Registry, the MS-DOS Prompt, and BIOS Setup.')}</p>
          <p>${L('Интерфейс работает на русском и английском языках. Переключить язык можно индикатором в области уведомлений (<span class="win-help-lang">Ru</span> / <span class="win-help-lang">En</span>) или в апплете «Язык и стандарты» Панели управления.', 'The interface operates in Russian and English. Switch the language at any time with the indicator in the notification area (<span class="win-help-lang">Ru</span> / <span class="win-help-lang">En</span>) or in the Regional Settings applet of Control Panel.')}</p>
          ${shortcut('winver', L('Щелкните здесь, чтобы открыть окно «О программе Win».', 'Click here to open the About Win dialog.'))}
          ${shortcut('sysdm.cpl', L('Щелкните здесь, чтобы посмотреть сведения о системе и оборудовании.', 'Click here to view system and hardware properties.'))}
          ${related('welcome', 'whatsnew', 'cpanel')}
        `
      },
      {
        id: 'desktop',
        keywords: L('рабочий стол, окна, значки, ярлык, свернуть, развернуть, закрыть, системное меню, размер, перемещение, корзина, crt, обои, восстановить, каскад', 'desktop, windows, icons, shortcut, minimize, maximize, close, system menu, resize, move, recycle bin, crt, wallpaper, restore, cascade'),
        content: `
          <h2>${titles.desktop}</h2>
          <p>${L('Каждая программа открывается в собственном окне. В строке заголовка расположены значок программы, название окна и три кнопки управления.', 'Every program runs in its own window. The title bar holds the program icon, the window title, and three control buttons.')}</p>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph"><span class="win-help-caption">${icon('cap-min')}</span></td><td>${L('<b>Свернуть</b> — убирает окно с экрана. Кнопка программы остается на панели задач.', '<b>Minimize</b> hides the window from the screen while keeping its button on the taskbar.')}</td></tr>
            <tr><td class="win-help-table-glyph"><span class="win-help-caption">${icon('cap-max')}</span></td><td>${L('<b>Развернуть</b> — распахивает окно во весь экран до панели задач.', '<b>Maximize</b> expands the window to fill the screen above the taskbar.')}</td></tr>
            <tr><td class="win-help-table-glyph"><span class="win-help-caption">${icon('cap-restore')}</span></td><td>${L('<b>Восстановить</b> — возвращает развернутому окну прежний размер и положение.', '<b>Restore</b> returns a maximized window to its previous size and position.')}</td></tr>
            <tr><td class="win-help-table-glyph"><span class="win-help-caption">${icon('cap-close')}</span></td><td>${L('<b>Закрыть</b> — завершает работу с окном или программой.', '<b>Close</b> closes the window or quits the program.')}</td></tr>
          </table>
          <h3>${L('Как переместить окно или изменить его размер', 'To move or resize a window')}</h3>
          <ol>
            <li>${L('Чтобы переместить окно, перетащите его за строку заголовка.', 'To move a window, drag its title bar.')}</li>
            <li>${L('Чтобы изменить размер, потяните за любую границу или угол окна.', 'To resize a window, drag any border or corner.')}</li>
            <li>${L('Дважды щелкните заголовок, чтобы развернуть окно или вернуть ему прежний размер.', 'Double-click the title bar to maximize the window or restore its previous size.')}</li>
          </ol>
          <h3>${L('Системное меню окна', 'The window system menu')}</h3>
          <p>${L('Щелкните значок в левом углу заголовка или щелкните заголовок правой кнопкой мыши. В меню доступны команды «Восстановить», «Переместить», «Размер», «Свернуть», «Развернуть» и «Закрыть». Двойной щелчок по значку в углу заголовка сразу закрывает окно.', 'Click the icon at the far left of the title bar, or right-click the title bar. The menu contains Restore, Move, Size, Minimize, Maximize, and Close. Double-clicking the title bar icon closes the window immediately.')}</p>
          <h3>${L('Значки рабочего стола и Корзина', 'Desktop icons and the Recycle Bin')}</h3>
          <ul>
            <li>${L('Щелкните значок один раз, чтобы выделить его; дважды щелкните, чтобы открыть программу или папку.', 'Click an icon once to select it; double-click it to open the program or folder.')}</li>
            <li>${L('Чтобы выделить несколько значков, растяните вокруг них пунктирную рамку мышью или щелкайте по ним, удерживая ' + key('Ctrl') + '.', 'To select multiple icons, drag a selection rectangle around them or click them while holding ' + key('Ctrl') + '.')}</li>
            <li>${L('Стрелка в углу значка', 'An arrow in the corner of an icon')} ${glyph('shortcut-overlay')} ${L('означает ярлык: его удаление не затрагивает саму программу.', 'indicates a shortcut; deleting the shortcut does not remove the program itself.')}</li>
            <li>${L('Щелкните свободное место рабочего стола правой кнопкой мыши, чтобы упорядочить значки по имени или типу, обновить экран, создать папку или текстовый документ, вставить объект из буфера обмена или открыть «Свойства: Экран».', 'Right-click an empty area of the desktop to arrange icons by name or type, refresh the desktop, create a new folder or text document, paste from the clipboard, or open Display Properties.')}</li>
            <li>${L('Удаленные файлы помещаются в', 'Deleted files are moved to the')} ${glyph('recycle-bin')} <b>${L('Корзину', 'Recycle Bin')}</b>. ${L('Откройте Корзину, чтобы восстановить нужный файл на прежнее место, или щелкните её значок правой кнопкой и выберите «Очистить корзину», чтобы освободить место на диске C:.', 'Open the Recycle Bin to restore individual files to their original folders, or right-click the Recycle Bin icon and choose Empty Recycle Bin to free space on drive C:.')}</li>
          </ul>
          ${shortcut('desk.cpl', L('Щелкните здесь, чтобы открыть «Свойства: Экран».', 'Click here to open Display Properties.'))}
          ${note([
            L('В диалоговых окнах клавиша ' + key('Enter') + ' нажимает выделенную кнопку по умолчанию, а ' + key('Esc') + ' закрывает окно без сохранения.', 'In dialog boxes, ' + key('Enter') + ' activates the default outlined button, and ' + key('Esc') + ' cancels and closes the dialog.'),
            L('Если в «Свойствах экрана» на вкладке «Эффекты» снят флажок «Отображать содержимое окна при перетаскивании», при перемещении и изменении размера рисуется классическая пунктирная рамка.', 'When "Show window contents while dragging" is cleared on the Effects tab of Display Properties, moving or resizing a window draws a dotted outline frame.')
          ])}
          ${related('startmenu', 'explorer', 'cpanel')}
        `
      },
      {
        id: 'startmenu',
        keywords: L('пуск, меню, панель задач, быстрый запуск, показать рабочий стол, трей, часы, дата, громкость, язык, компакт-диск, питание, скрепыш, овечка, завершение работы, свойства панели задач', 'start, menu, taskbar, quick launch, show desktop, tray, clock, date, volume, language, cd-rom, power, clippy, esheep, shut down, taskbar properties'),
        content: `
          <h2>${titles.startmenu}</h2>
          <p>${L('Панель задач расположена вдоль нижнего края экрана. Слева находится кнопка', 'The taskbar runs along the bottom of the screen. On the left is the')} ${glyph('start-logo')} <b>${L('Пуск', 'Start')}</b>${L(', за ней — панель «Быстрый запуск», кнопки всех открытых окон, а справа — область уведомлений (системный трей) и часы.', ' button, followed by the Quick Launch toolbar, buttons for open windows, and on the right the notification area (system tray) and clock.')}</p>
          <h3>${L('Разделы меню «Пуск»', 'Start menu sections')}</h3>
          <ul>
            <li>${glyph('programs')} <b>${L('Программы', 'Programs')}</b> — ${L('подменю «Стандартные» (включая «Развлечения», «Связь» и «Служебные»), «Игры», «Офис», «Интернет» и ярлыки установленных приложений.', 'submenus for Accessories (including Entertainment, Communications, and System Tools), Games, Office, Internet, and installed applications.')}</li>
            <li>${glyph('my-documents')} <b>${L('Документы', 'Documents')}</b> — ${L('быстрый переход к папкам «Мои документы», «Мои рисунки», «Моя музыка», «Мои видео», «Загрузки» и списку недавно открывавшихся файлов.', 'quick access to My Documents, My Pictures, My Music, My Videos, Downloads, and recently opened files.')}</li>
            <li>${glyph('settings')} <b>${L('Настройка', 'Settings')}</b> — ${L('«Панель управления» и «Панель задач и меню "Пуск"».', 'Control Panel and Taskbar & Start Menu properties.')}</li>
            <li>${glyph('find')} <b>${L('Найти', 'Find')}</b> — ${L('поиск файлов и папок на диске C: по имени или части имени.', 'searches drive C: for files and folders by name.')}</li>
            <li>${glyph('help')} <b>${L('Справка', 'Help')}</b>, ${glyph('run')} <b>${L('Выполнить...', 'Run...')}</b> ${L('и', 'and')} ${glyph('shut-down')} <b>${L('Завершение работы...', 'Shut Down...')}</b>.</li>
          </ul>
          <h3>${L('Панель «Быстрый запуск» и кнопки окон', 'Quick Launch and window buttons')}</h3>
          <p>${glyph('show-desktop')} <b>${L('Показать рабочий стол', 'Show Desktop')}</b> ${L('одним щелчком сворачивает все открытые окна, а повторным возвращает их на место. Рядом расположены кнопки быстрого вызова', 'minimizes all open windows at once; click it again to restore them. Next to it are one-click buttons for')} ${glyph('internet-explorer')} <b>Internet Explorer</b> ${L('и', 'and')} ${glyph('outlook')} <b>Outlook Express</b>.</p>
          <p>${L('Щелчок по кнопке окна на панели задач делает его активным, а щелчок по кнопке уже активного окна сворачивает его. Щелкните свободное место панели задач правой кнопкой мыши, чтобы расположить окна каскадом, сверху вниз, слева направо, свернуть все окна или открыть «Свойства: Панель задач и меню "Пуск"».', 'Click a window button on the taskbar to bring that window to the front; click the active window’s button to minimize it. Right-click an empty space on the taskbar to cascade windows, tile them horizontally or vertically, minimize all windows, or open Taskbar & Start Menu Properties.')}</p>
          <h3>${L('Значки в области уведомлений', 'Notification area icons')}</h3>
          <ul>
            <li><span class="win-help-lang">Ru</span> / <span class="win-help-lang">En</span> — ${L('переключение языка интерфейса между русским и английским.', 'switches the system language between Russian and English.')}</li>
            <li>${glyph('speaker')} — ${L('одиночный щелчок открывает ползунок громкости и флажок «Выкл», двойной щелчок — полный микшер «Регулятор громкости».', 'single-click opens the volume popup slider and Mute box; double-click opens the full Volume Control mixer.')}</li>
            <li>${glyph('monitor')} — ${L('включает и выключает эффект ЭЛТ-монитора (строчная развертка и свечение люминофора).', 'toggles the CRT monitor scanline and phosphor effect.')}</li>
            <li>${glyph('drive-cd')} — ${L('управление приводом CD-ROM: вставить или извлечь компакт-диск журнала «Игромания» (диск D:).', 'inserts or ejects the Igromania magazine CD-ROM in drive D:.')}</li>
            <li>${glyph('powercfg')} — ${L('индикатор электропитания (появляется, если включен в апплете «Электропитание»): позволяет быстро сменить схему питания, погасить монитор или остановить диски.', 'power meter icon (enabled in Power Management): switches power schemes, puts the monitor on standby, or spins down hard disks.')}</li>
            <li>${L('<b>Скрепка</b> и <b>овечка</b> — значки помощника Скрепыша и установленного питомца eSheep 98 для вызова их меню.', '<b>Paperclip</b> and <b>sheep</b> — tray icons for Clippy and the eSheep 98 desktop pet.')}</li>
            <li>${L('<b>Часы</b> — показывают текущее время, при наведении выводят полную дату, а по двойному щелчку открывают настройки «Дата и время».', '<b>Clock</b> — displays the current time, shows the full date on hover, and opens Date/Time Properties when double-clicked.')}</li>
          </ul>
          ${shortcut('taskbar-props', L('Щелкните здесь, чтобы открыть «Свойства: Панель задач и меню "Пуск"».', 'Click here to open Taskbar & Start Menu Properties.'))}
          ${shortcut('shutdown', L('Щелкните здесь, чтобы открыть окно «Завершение работы Win».', 'Click here to open the Shut Down Win dialog.'))}
          ${related('desktop', 'cpanel', 'shortcuts')}
        `
      },
      {
        id: 'explorer',
        keywords: L('мой компьютер, проводник, папка, файл, диск, дискета, сидюк, адрес, вырезать, копировать, вставить, удалить, свойства, емкость, корзина, найти, поиск файлов, f3', 'my computer, explorer, folder, file, drive, floppy, cd-rom, address, cut, copy, paste, delete, properties, capacity, recycle bin, find, search files, f3'),
        content: `
          <h2>${titles.explorer}</h2>
          <p>${L('Дважды щелкните значок', 'Double-click the')} ${glyph('my-computer')} <b>${L('Мой компьютер', 'My Computer')}</b>${L(', чтобы получить доступ к дисководу гибких дисков <b>Диск 3,5 (A:)</b>, жесткому диску', ' icon to access the <b>3½ Floppy (A:)</b> drive, hard disk')} ${glyph('drive-c')} <b>C:</b>, ${L('приводу компакт-дисков', 'CD-ROM drive')} ${glyph('drive-cd')} <b>D:</b> ${L('и папке', 'and the')} ${glyph('control-panel')} <b>${L('Панель управления', 'Control Panel')}</b>.</p>
          <h3>${L('Панель инструментов Проводника', 'The Explorer toolbar')}</h3>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('tb-back')}${glyph('tb-forward')}</td><td>${L('<b>Назад</b> и <b>Вперед</b> — возврат к ранее открытым папкам.', '<b>Back</b> and <b>Forward</b> move through previously visited folders.')}</td></tr>
            <tr><td class="win-help-table-glyph">${glyph('tb-up')}</td><td>${L('<b>Вверх</b> — переход в родительскую папку.', '<b>Up</b> opens the parent folder.')}</td></tr>
            <tr><td class="win-help-table-glyph">${glyph('tb-cut')}${glyph('tb-copy')}${glyph('tb-paste')}</td><td>${L('<b>Вырезать</b>, <b>Копировать</b> и <b>Вставить</b> — перемещение или дублирование выбранного файла или папки через буфер обмена.', '<b>Cut</b>, <b>Copy</b>, and <b>Paste</b> move or duplicate the selected file or folder via the clipboard.')}</td></tr>
            <tr><td class="win-help-table-glyph">${glyph('tb-delete')}${glyph('tb-properties')}</td><td>${L('<b>Удалить</b> отправляет выделенный объект в Корзину, <b>Свойства</b> открывают сведения о текущей папке или диске.', '<b>Delete</b> sends the selected item to the Recycle Bin; <b>Properties</b> shows details about the current folder or drive.')}</td></tr>
          </table>
          <h3>${L('Левая панель описания и диаграмма диска', 'Description pane and disk chart')}</h3>
          <p>${L('В левой части окна Проводника отображаются название текущей папки и свойства выделенного файла (размер, тип, дата изменения). Когда открыт корневой раздел <b>C:</b> или выделен диск в «Моем компьютере», панель рисует круговую диаграмму: синим цветом показано занятое пространство, пурпурным — свободное.', 'The left pane of Explorer displays the current folder name and details about the selected item (size, type, modified date). When viewing drive <b>C:</b> or selecting it in My Computer, the pane renders a pie chart showing used space in blue and free space in magenta.')}</p>
          <h3>${L('Поиск файлов и папок (' + key('F3') + ')', 'Finding files and folders (' + key('F3') + ')')}</h3>
          <p>${L('Если вы не помните, в какой папке лежит документ или установщик, откройте «Пуск» → «Найти» → «Файлы и папки...» (или нажмите ' + key('F3') + ' на рабочем столе). Введите часть имени в поле «Имя» и нажмите <b>Найти</b> — система просканирует виртуальную файловую систему и выведет список совпадений с полными путями. Двойной щелчок по найденной строке сразу открывает файл или папку.', 'If you do not remember where a document or installer is stored, open Start → Find → Files or Folders... (or press ' + key('F3') + ' on the desktop). Type part of the filename in the Named box and click <b>Find Now</b> to scan the virtual file system. Double-click any result in the list to open the file or folder directly.')}</p>
          ${shortcut('explorer', L('Щелкните здесь, чтобы открыть «Мой компьютер».', 'Click here to open My Computer.'))}
          ${shortcut('find', L('Щелкните здесь, чтобы открыть поиск «Найти: Файлы и папки».', 'Click here to open Find: All Files.'))}
          ${related('desktop', 'apps', 'system')}
        `
      },
      {
        id: 'shortcuts',
        keywords: L('клавиши, сочетания, клавиатура, горячие клавиши, f1, f3, f5, del, delete, ctrl, esc, enter, стрелки, буфер обмена', 'keys, shortcuts, keyboard, hotkeys, f1, f3, f5, del, delete, ctrl, esc, enter, arrows, clipboard'),
        content: `
          <h2>${titles.shortcuts}</h2>
          <table class="win-help-table">
            <tr><th>${L('Клавиши', 'Keys')}</th><th>${L('Действие', 'Action')}</th></tr>
            <tr><td>${key('Ctrl+Esc')}</td><td>${L('Открыть или закрыть меню «Пуск».', 'Open or close the Start menu.')}</td></tr>
            <tr><td>${key('↑')} ${key('↓')} ${key('←')} ${key('→')}</td><td>${L('Перемещение по пунктам меню «Пуск», его подменю и значкам.', 'Navigate through Start menu items, submenus, and icons.')}</td></tr>
            <tr><td>${L('Подчеркнутая буква', 'Underlined letter')}</td><td>${L('Быстрый выбор команды в открытом меню «Пуск».', 'Select the matching item in the open Start menu.')}</td></tr>
            <tr><td>${key('Enter')}</td><td>${L('Открыть выделенный значок, запустить пункт меню или нажать кнопку по умолчанию в диалоговом окне.', 'Open the selected icon, launch the highlighted menu item, or press the default button in a dialog box.')}</td></tr>
            <tr><td>${key('Esc')}</td><td>${L('Закрыть открытое меню или отменить диалоговое окно.', 'Close an open menu or cancel a dialog box.')}</td></tr>
            <tr><td>${key('F1')}</td><td>${L('Открыть поиск вопросов помощника Скрепыша (если помощник скрыт или отключен — открыть Справку Win).', 'Ask Clippy the Office Assistant (or open Win Help if the assistant is hidden or disabled).')}</td></tr>
            <tr><td>${key('F3')}</td><td>${L('Открыть окно «Найти: Файлы и папки» (в Блокноте — найти следующее совпадение текста).', 'Open Find: All Files (in Notepad, find the next text match).')}</td></tr>
            <tr><td>${key('F5')}</td><td>${L('Обновить значки рабочего стола или содержимое папки Проводника (в QBasic — запустить программу).', 'Refresh desktop icons or the active Explorer folder (in QBasic, run the current program).')}</td></tr>
            <tr><td>${key('Delete')}</td><td>${L('Отправить выделенный на рабочем столе или в Проводнике файл в Корзину.', 'Move the selected desktop or Explorer file to the Recycle Bin.')}</td></tr>
            <tr><td>${key('Ctrl+S')}</td><td>${L('Сохранить текущий документ в Блокноте, WordPad или Excel.', 'Save the active document in Notepad, WordPad, or Excel.')}</td></tr>
            <tr><td>${key('Ctrl+C')} / ${key('Ctrl+V')}</td><td>${L('Скопировать и вставить текст или файлы через буфер обмена.', 'Copy and paste text or files through the clipboard.')}</td></tr>
            <tr><td>${key('Ctrl+Alt+Del')}</td><td>${L('Открыть Диспетчер задач Win.', 'Open the Win Task Manager.')}</td></tr>
            <tr><td>${key('Del')} / ${key('F2')} (${L('при загрузке', 'at boot')})</td><td>${L('Войти в CMOS Setup Utility (BIOS) во время проверки памяти POST.', 'Enter CMOS Setup Utility (BIOS) during the POST memory check.')}</td></tr>
          </table>
          ${note([
            L('Системные сочетания вроде ' + key('Ctrl+Esc') + ' и ' + key('Ctrl+Alt+Del') + ' могут перехватываться основным браузером или операционной системой вашего компьютера. В этом случае используйте кнопку «Пуск» и пункт «Диспетчер задач» в меню «Программы» → «Стандартные» → «Служебные».', 'Host browsers or operating systems may intercept combinations such as ' + key('Ctrl+Esc') + ' and ' + key('Ctrl+Alt+Del') + '. When that happens, use the Start button and open Task Manager from Programs → Accessories → System Tools.')
          ])}
          ${related('startmenu', 'desktop', 'explorer')}
        `
      },
      {
        id: 'apps',
        keywords: L('стандартные, программы, блокнот, notepad, wordpad, paint, калькулятор, таблица символов, буфер обмена, clipbrd, просмотр картинок, acdsee, acrobat reader, pdf, excel, photoshop, winrar, архиватор, win commander, qbasic, basic, neko, esheep, овечка', 'accessories, programs, notepad, wordpad, paint, calculator, character map, clipbook viewer, clipbrd, imaging, acdsee, acrobat reader, pdf, excel, photoshop, winrar, archiver, win commander, qbasic, basic, neko, esheep, sheep'),
        content: `
          <h2>${titles.apps}</h2>
          <p>${L('В системе установлены стандартные принадлежности Win 98, офисные и графические пакеты, файловые менеджеры, среда программирования и экранные питомцы.', 'The system includes standard Win 98 accessories along with office suites, graphics editors, file managers, a programming IDE, and desktop pets.')}</p>
          <h3>${L('Стандартные программы («Пуск» → «Программы» → «Стандартные»)', 'Accessories (Start → Programs → Accessories)')}</h3>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('notepad')}</td><td><b>${L('Блокнот (Notepad)', 'Notepad')}</b> — ${L('текстовый редактор для файлов TXT, INI, BAT и LOG с поиском по тексту и вставкой времени и даты (F5).', 'plain-text editor for TXT, INI, BAT, and LOG files with text search and time/date stamp insertion (F5).')}</td><td><button class="win-help-shortcut" data-run="notepad">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('wordpad')}</td><td><b>WordPad</b> — ${L('редактор документов RTF и DOC с панелью шрифтов, начертанием (полужирный, курсив, подчеркнутый), цветом текста и выравниванием абзацев.', 'rich-text document editor supporting RTF and DOC files with font selection, bold/italic/underline formatting, text color, and paragraph alignment.')}</td><td><button class="win-help-shortcut" data-run="wordpad">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('paint')}</td><td><b>Paint</b> — ${L('растровый редактор с 16 инструментами (карандаш, кисть, ластик, заливка, пипетка, распылитель, текст, линии и фигуры), палитрой и сохранением в BMP.', 'bitmap graphics editor with 16 tools (pencil, brush, eraser, fill bucket, eyedropper, airbrush, text, lines, and shapes), color palette, and BMP saving.')}</td><td><button class="win-help-shortcut" data-run="paint">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('calculator')}</td><td><b>${L('Калькулятор (Calculator)', 'Calculator')}</b> — ${L('арифметический и инженерный режимы с ячейками памяти и тригонометрическими функциями.', 'standard and scientific calculation modes with memory registers and trigonometric functions.')}</td><td><button class="win-help-shortcut" data-run="calc">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('charmap')}</td><td><b>${L('Таблица символов (Character Map)', 'Character Map')}</b> — ${L('просмотр наборов шрифтов и копирование специальных знаков в буфер обмена.', 'inspects font character sets and copies special symbols to the clipboard.')}</td><td><button class="win-help-shortcut" data-run="charmap">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('clipbrd')}</td><td><b>${L('Просмотр буфера обмена (ClipBook Viewer)', 'ClipBook Viewer')}</b> — ${L('показывает текущее текстовое, графическое или файловое содержимое системного буфера обмена и сохраняет файлы .CLP.', 'displays current text, image, or file data stored in the system clipboard and saves .CLP files.')}</td><td><button class="win-help-shortcut" data-run="clipbrd">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('imaging')}</td><td><b>${L('Просмотр картинок (Imaging)', 'Imaging')}</b> — ${L('просмотр рисунков BMP, JPG, GIF и PNG с масштабированием и поворотом.', 'views BMP, JPG, GIF, and PNG images with zoom and rotation controls.')}</td><td><button class="win-help-shortcut" data-run="imaging">${icon('shortcut-overlay')}</button></td></tr>
          </table>
          <h3>${L('Офис, графика, архивы и разработка', 'Office, graphics, archives, and development')}</h3>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('excel')}</td><td><b>Microslop Excel 97</b> — ${L('электронные таблицы с формулами (SUM, AVERAGE, IF), автосуммой Σ и построением диаграмм.', 'spreadsheet application with formulas (SUM, AVERAGE, IF), AutoSum Σ, and chart generation.')}</td><td><button class="win-help-shortcut" data-run="excel">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('photoshop')}</td><td><b>Adobe Photoshop 5.0</b> — ${L('работа со слоями, фильтрами (размытие, резкость, шум, тиснение), уровнями яркости и историей действий.', 'layered image editor with filters (blur, sharpen, noise, emboss), brightness levels, and action history.')}</td><td><button class="win-help-shortcut" data-run="photoshop">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('acdsee')}</td><td><b>ACDSee 32 v2.3</b> — ${L('быстрый браузер графических папок с миниатюрами, слайд-шоу и установкой рисунка фоном рабочего стола.', 'fast image browser with folder thumbnails, slideshow mode, and one-click desktop wallpaper setting.')}</td><td><button class="win-help-shortcut" data-run="acdsee">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('acrobat')}</td><td><b>Adobe Acrobat Reader 3.0</b> — ${L('чтение документов и руководств в формате PDF с оглавлением и масштабированием страниц.', 'reads PDF documents and manuals with bookmarks and page zoom.')}</td><td><button class="win-help-shortcut" data-run="acrobat">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('winrar')}</td><td><b>WinRAR 98</b> — ${L('создание и распаковка архивов .RAR и .ZIP, проверка целостности и мастер самораспаковывающихся архивов SFX.', 'creates and extracts .RAR and .ZIP archives, tests archive integrity, and builds self-extracting SFX packages.')}</td><td><button class="win-help-shortcut" data-run="winrar">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('wincmd')}</td><td><b>Win Commander 3.5</b> — ${L('двухпанельный файловый менеджер с функциональными клавишами F3–F8 для просмотра, правки, копирования, переноса и удаления файлов.', 'dual-pane file manager with F3–F8 function keys for viewing, editing, copying, moving, and deleting files.')}</td><td><button class="win-help-shortcut" data-run="wincmd">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('qbasic')}</td><td><b>Microslop QBasic 1.1</b> — ${L('классическая синяя среда разработки BASIC с интерпретатором, графикой SCREEN 12/13, звуком PLAY/SOUND и готовыми примерами (GORILLAS.BAS, NIBBLES.BAS).', 'classic blue-screen BASIC IDE and interpreter supporting SCREEN 12/13 graphics, PLAY/SOUND audio, and built-in sample programs (GORILLAS.BAS, NIBBLES.BAS).')}</td><td><button class="win-help-shortcut" data-run="qbasic">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('neko')}</td><td><b>Neko 98</b> — ${L('экранный котенок, который бегает за курсором мыши по рабочему столу и сворачивается калачиком, когда мышь неподвижна.', 'desktop kitten that chases the mouse pointer across the screen and curls up to sleep when the cursor stops.')}</td><td><button class="win-help-shortcut" data-run="neko">${icon('shortcut-overlay')}</button></td></tr>
          </table>
          ${note([
            L('Стандартные настольные игры (<b>Сапёр</b> — <code>winmine</code>, <b>Косынка</b> — <code>sol</code>, <b>Свободная ячейка</b> — <code>freecell</code>, <b>3D Pinball: Space Cadet</b> — <code>pinball</code>) доступны в меню «Пуск» → «Программы» → «Игры».', 'Built-in desktop games (<b>Minesweeper</b> — <code>winmine</code>, <b>Solitaire</b> — <code>sol</code>, <b>FreeCell</b> — <code>freecell</code>, and <b>3D Pinball: Space Cadet</b> — <code>pinball</code>) are located in Start → Programs → Games.'),
            L('Крупные игры покупаются и скачиваются через клиент <b>Steam</b> (загружается с <code>www.steampowered.com</code>), демоверсии находятся на компакт-диске «Игромании» (D:), а бесплатную <b>Honkai: Star Rail 98</b> можно скачать также с <code>hsr.hoyoverse.com</code>.', 'Full games are purchased and downloaded through the <b>Steam</b> client (available at <code>www.steampowered.com</code>), game demos are on the Igromania CD (D:), and free-to-play <b>Honkai: Star Rail 98</b> can also be downloaded from <code>hsr.hoyoverse.com</code>.')
          ])}
          ${related('multimedia', 'internet', 'system')}
        `
      },
      {
        id: 'multimedia',
        keywords: L('мультимедиа, звук, музыка, видео, winamp, mp3, cdplayer, лазерный проигрыватель, cdex, fasttracker, трекер, xm, mod, звукозапись, громкость, микшер, sndvol32, sndrec32, mplayer, медиаплеер, avi', 'multimedia, sound, music, video, winamp, mp3, cdplayer, cd player, cdex, fasttracker, tracker, xm, mod, sound recorder, volume, mixer, sndvol32, sndrec32, mplayer, media player, avi'),
        content: `
          <h2>${titles.multimedia}</h2>
          <p>${L('Звуковая подсистема обслуживает воспроизведение MP3, WAV, MIDI и трекерных модулей, чтение аудиодисков CD-DA, запись звука и просмотр видеофайлов.', 'The multimedia subsystem handles MP3, WAV, MIDI, and tracker module playback, CD-DA audio discs, voice recording, and video playback.')}</p>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('winamp')}</td><td><b>WinAmp 98</b> — ${L('проигрыватель MP3, WAV и MIDI с графическим анализатором спектра, 10-полосным эквалайзером, редактором списков воспроизведения (.M3U) и сменными обложками.', 'MP3, WAV, and MIDI player featuring a spectrum analyzer, 10-band equalizer, playlist editor (.M3U), and interchangeable skins.')}</td><td><button class="win-help-shortcut" data-run="winamp">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('cdplayer')}</td><td><b>${L('Лазерный проигрыватель (CD Player)', 'CD Player')}</b> — ${L('воспроизведение звуковых дорожек компакт-диска в приводе D: с переключением треков и отсчетом времени.', 'plays audio tracks from the disc in CD-ROM drive D: with track skip and elapsed time display.')}</td><td><button class="win-help-shortcut" data-run="cdplayer">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('cdex')}</td><td><b>CDex 0.14</b> — ${L('граббер аудиодисков, преобразующий дорожки CD-DA в файлы WAV или MP3 с выбором битрейта (128–320 кбит/с) в папку «Моя музыка».', 'CD-DA ripper that extracts audio tracks to WAV or MP3 files at selectable bitrates (128–320 kbps) into My Music.')}</td><td><button class="win-help-shortcut" data-run="cdex">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('fasttracker')}</td><td><b>FastTracker II</b> — ${L('4-канальный трекерный синтезатор с редактором паттернов, огибающих инструментов, осциллографом и экспортом композиций в .WAV.', '4-channel tracker music workstation with a pattern editor, instrument envelopes, real-time oscilloscopes, and .WAV export.')}</td><td><button class="win-help-shortcut" data-run="fasttracker">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('sound-recorder')}</td><td><b>${L('Звукозапись (Sound Recorder)', 'Sound Recorder')}</b> — ${L('запись звука, наложение эффектов (эхо, ускорение, замедление, обратное воспроизведение) и сохранение в формат WAV.', 'records audio, applies effects (echo, speed up, slow down, reverse), and saves WAV files.')}</td><td><button class="win-help-shortcut" data-run="sndrec32">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('volume-mixer')}</td><td><b>${L('Регулятор громкости (Volume Control)', 'Volume Control')}</b> — ${L('раздельные ползунки уровня и баланса для каналов Master, Wave, MIDI и CD Audio.', 'independent volume and balance sliders for Master, Wave, MIDI, and CD Audio channels.')}</td><td><button class="win-help-shortcut" data-run="sndvol32">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('mplayer')}</td><td><b>${L('Универсальный проигрыватель (Media Player)', 'Media Player')}</b> — ${L('воспроизведение видеороликов AVI и MPG из папки «Мои видео» и с компакт-диска «Игромании».', 'plays AVI and MPG video clips from My Videos and from the Igromania CD-ROM.')}</td><td><button class="win-help-shortcut" data-run="mplayer">${icon('shortcut-overlay')}</button></td></tr>
          </table>
          <h3>${L('Как быстро изменить громкость или звуковую схему', 'To adjust volume or sound schemes quickly')}</h3>
          <ol>
            <li>${L('Щелкните значок динамика', 'Click the speaker icon')} ${glyph('speaker')} ${L('в области уведомлений, чтобы подвинуть общий ползунок или выключить звук флажком «Выкл».', 'in the notification area to move the master slider or select Mute.')}</li>
            <li>${L('Дважды щелкните тот же значок для вызова полного микшера <b>Регулятор громкости</b>.', 'Double-click the speaker icon to open the full <b>Volume Control</b> mixer.')}</li>
            <li>${L('Чтобы сменить мелодии запуска системы, ошибок и уведомлений, откройте апплет <b>Мультимедиа</b> в Панели управления.', 'To change the sounds played for system startup, errors, and alerts, open the <b>Multimedia</b> applet in Control Panel.')}</li>
          </ol>
          ${related('cpanel', 'apps')}
        `
      },
      {
        id: 'internet',
        keywords: L('интернет, internet explorer, netscape, модем, удаленный доступ, icq, аська, почта, outlook express, mirc, irc, чат, hyperterminal, bbs, терминал, сайты, steam', 'internet, internet explorer, netscape, modem, dial-up, icq, mail, outlook express, mirc, irc, chat, hyperterminal, bbs, terminal, sites, steam'),
        content: `
          <h2>${titles.internet}</h2>
          <p>${L('Для выхода в сеть и общения используются модемное соединение, два веб-обозревателя, почтовый клиент, мессенджер ICQ, IRC-клиент и терминал BBS.', 'Network access and online communication are handled by Dial-Up Networking, two web browsers, an e-mail client, ICQ instant messaging, an IRC client, and a BBS terminal.')}</p>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('dialup')}</td><td><b>${L('Удаленный доступ к сети (Dial-Up Networking)', 'Dial-Up Networking')}</b> — ${L('дозвон через модем USRobotics 56K Faxmodem со звуком рукопожатия и счетчиком переданных байт в трее.', 'connects via the USRobotics 56K Faxmodem with audible handshake tones and a live byte counter in the tray.')}</td><td><button class="win-help-shortcut" data-run="dialup">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('internet-explorer')}</td><td><b>Internet Explorer 5</b> — ${L('веб-обозреватель с адресной строкой, журналом посещений, избранным и загрузкой файлов в папку Downloads.', 'web browser with an address bar, browsing history, Favorites menu, and file downloads into the Downloads folder.')}</td><td><button class="win-help-shortcut" data-run="ie">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('netscape')}</td><td><b>Netscape Communicator 6</b> — ${L('альтернативный обозреватель с закладками и собственной строкой навигации.', 'alternative web browser with bookmarks and its own navigation bar.')}</td><td><button class="win-help-shortcut" data-run="netscape">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('outlook')}</td><td><b>Outlook Express</b> — ${L('почтовый клиент с папками «Входящие», «Отправленные», «Черновики» и «Удаленные», адресной книгой и отправкой писем.', 'e-mail client with Inbox, Sent Items, Drafts, and Deleted Items folders, an address book, and message composition.')}</td><td><button class="win-help-shortcut" data-run="outlook">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('icq-online')}</td><td><b>ICQ 98a</b> — ${L('мгновенный обмен сообщениями по номеру UIN, статусы «В сети» / «Не беспокоить» и фирменный звук «Uh-oh!».', 'instant messaging by UIN with Online / Away statuses and the classic "Uh-oh!" incoming message sound.')}</td><td><button class="win-help-shortcut" data-run="icq">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('mirc')}</td><td><b>mIRC 32</b> — ${L('клиент сетей IRC (каналы #win98, #rusnet, #gamedev, #warez) с командами /nick, /join, /me, /slap и передачей файлов DCC.', 'IRC chat client (#win98, #rusnet, #gamedev, #warez channels) supporting /nick, /join, /me, /slap commands and DCC file transfers.')}</td><td><button class="win-help-shortcut" data-run="mirc">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('hypertrm')}</td><td><b>HyperTerminal</b> — ${L('терминал с поддержкой графики ANSI для дозвона на текстовые станции BBS (NightOwl BBS, Demoscene HQ, FidoNet Node 2:5020) с досками объявлений, файловыми архивами и дверьми-играми.', 'ANSI terminal emulator for dialing text BBS stations (NightOwl BBS, Demoscene HQ, FidoNet Node 2:5020) with message boards, file areas, and door games.')}</td><td><button class="win-help-shortcut" data-run="hypertrm">${icon('shortcut-overlay')}</button></td></tr>
          </table>
          ${note([
            L('Поисковая система <b>WebSeeker 98</b> (<code>http://www.search98.com</code>), порталы <b>Яndex</b> и <b>Рамблер</b>, каталог программ <b>SoftStore \'98</b> (<code>http://www.softstore98.com</code>), магазин игр <b>Steam</b> (<code>http://www.steampowered.com</code>), сайт тем <b>ThemeWorld \'98</b> (<code>http://www.themeworld98.com</code>), видеопортал <b>YouVid</b> (<code>http://www.youvid.com</code>), аукцион <b>Молоток \'98</b> (<code>http://www.molotok98.ru</code>), лаборатория <b>Железный Цех \'98</b> (<code>http://www.ferrum98.ru</code>) и другие узлы 1998 года доступны из меню «Избранное» в Internet Explorer.', 'Search engine <b>WebSeeker 98</b> (<code>http://www.search98.com</code>), portals <b>Yandex</b> and <b>Rambler</b>, software catalog <b>SoftStore \'98</b> (<code>http://www.softstore98.com</code>), game store <b>Steam</b> (<code>http://www.steampowered.com</code>), theme repository <b>ThemeWorld \'98</b> (<code>http://www.themeworld98.com</code>), video site <b>YouVid</b> (<code>http://www.youvid.com</code>), auction site <b>Molotok \'98</b> (<code>http://www.molotok98.ru</code>), hardware lab <b>Ferrum \'98</b> (<code>http://www.ferrum98.ru</code>), and other 1998 web sites are listed in the Favorites menu of Internet Explorer.'),
            L('Домашнюю страницу Internet Explorer, кэш временных файлов и журнал посещений настраивают в апплете <b>Свойства обозревателя (inetcpl.cpl)</b> Панели управления.', 'The Internet Explorer home page, temporary file cache, and browsing history are configured in the <b>Internet Options (inetcpl.cpl)</b> applet in Control Panel.')
          ])}
          ${related('cpanel', 'startmenu', 'apps')}
        `
      },
      {
        id: 'cpanel',
        keywords: L('панель управления, экран, обои, заставка, тема, оформление, эффекты, мышь, кнопки мыши, левша, правша, указатели, курсор, шлейф, система, диспетчер устройств, быстродействие, виртуальная память, электропитание, спящий режим, energy star, установка и удаление программ, компоненты, загрузочный диск, мультимедиа, звуки, аудио, дата и время, часовой пояс, язык и стандарты, свойства обозревателя, панель задач, desk.cpl, main.cpl, sysdm.cpl, powercfg.cpl, appwiz.cpl, mmsys.cpl, timedate.cpl, intl.cpl, inetcpl.cpl', 'control panel, display, wallpaper, screen saver, theme, appearance, effects, mouse, mouse buttons, left-handed, right-handed, pointers, cursor, trails, system, device manager, performance, virtual memory, power management, standby, energy star, add remove programs, components, startup disk, multimedia, sounds, audio, date time, time zone, regional settings, internet options, taskbar, desk.cpl, main.cpl, sysdm.cpl, powercfg.cpl, appwiz.cpl, mmsys.cpl, timedate.cpl, intl.cpl, inetcpl.cpl'),
        content: `
          <h2>${titles.cpanel}</h2>
          <p>${L('Откройте «Пуск» → «Настройка» → «Панель управления» (или папку «Панель управления» внутри «Моего компьютера»). В Панели управления собраны десять апплетов настройки оборудования, экрана, мыши, звука, питания, программ и интерфейса.', 'Open Start → Settings → Control Panel (or the Control Panel folder inside My Computer). Control Panel contains ten applets for configuring hardware, display, mouse, audio, power management, software, and the shell interface.')}</p>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('monitor')}</td><td><b>${L('Экран (desk.cpl)', 'Display (desk.cpl)')}</b> — ${L('фоновый рисунок, заставка, цветовая схема, визуальные эффекты, значки рабочего стола и темы Microslop Plus! 98.', 'desktop background, screen saver, color scheme, visual effects, desktop icons, and Microslop Plus! 98 themes.')}</td><td><button class="win-help-shortcut" data-run="desk.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('mouse')}</td><td><b>${L('Мышь (main.cpl)', 'Mouse (main.cpl)')}</b> — ${L('кнопки для правши и левши, скорость двойного щелчка, схемы указателей, скорость движения и след курсора.', 'right/left-handed buttons, double-click speed, pointer schemes, motion speed, and pointer trails.')}</td><td><button class="win-help-shortcut" data-run="main.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('system')}</td><td><b>${L('Система (sysdm.cpl)', 'System (sysdm.cpl)')}</b> — ${L('сведения о компьютере, Диспетчер устройств, быстродействие, ускорение графики и виртуальная память.', 'system summary, Device Manager hardware tree, performance tuning, graphics acceleration, and virtual memory.')}</td><td><button class="win-help-shortcut" data-run="sysdm.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('powercfg')}</td><td><b>${L('Электропитание (powercfg.cpl)', 'Power Management (powercfg.cpl)')}</b> — ${L('схемы управления питанием Energy Star, таймеры отключения монитора и дисков, значок в трее.', 'Energy Star power schemes, monitor standby and disk spin-down timers, and tray power meter.')}</td><td><button class="win-help-shortcut" data-run="powercfg.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('appwiz')}</td><td><b>${L('Установка и удаление программ (appwiz.cpl)', 'Add/Remove Programs (appwiz.cpl)')}</b> — ${L('установка и удаление программ, выбор компонентов Win 98 и создание загрузочной дискеты A:.', 'install or remove applications, toggle Win 98 components, and create a Startup Disk on drive A:.')}</td><td><button class="win-help-shortcut" data-run="appwiz.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('multimedia')}</td><td><b>${L('Мультимедиа (mmsys.cpl)', 'Multimedia (mmsys.cpl)')}</b> — ${L('звуковые схемы событий Win 98, выбор аудиоустройства и вызов микшера громкости.', 'Win 98 event sound schemes, playback device selection, and volume mixer access.')}</td><td><button class="win-help-shortcut" data-run="mmsys.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('timedate')}</td><td><b>${L('Дата и время (timedate.cpl)', 'Date/Time (timedate.cpl)')}</b> — ${L('календарь, часы со стрелками, точное время и часовой пояс.', 'calendar, analog clock, current time, and time zone settings.')}</td><td><button class="win-help-shortcut" data-run="timedate.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('regional')}</td><td><b>${L('Язык и стандарты (intl.cpl)', 'Regional Settings (intl.cpl)')}</b> — ${L('переключение языка системы (Русский / English) и образцы форматов времени, даты и валюты.', 'switches the system language (Russian / English) and previews time, date, and currency formats.')}</td><td><button class="win-help-shortcut" data-run="intl.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('inetcpl')}</td><td><b>${L('Свойства обозревателя (inetcpl.cpl)', 'Internet Options (inetcpl.cpl)')}</b> — ${L('домашняя страница Internet Explorer, удаление временных файлов и очистка журнала.', 'Internet Explorer home page, temporary files cleanup, and browsing history reset.')}</td><td><button class="win-help-shortcut" data-run="inetcpl.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('taskbar-props')}</td><td><b>${L('Панель задач и меню «Пуск»', 'Taskbar & Start Menu')}</b> — ${L('автоскрытие панели задач, часы, добавление и удаление ярлыков в меню «Пуск», очистка документов.', 'taskbar auto-hide, clock visibility, adding/removing Start menu shortcuts, and clearing recent documents.')}</td><td><button class="win-help-shortcut" data-run="taskbar-props">${icon('shortcut-overlay')}</button></td></tr>
          </table>

          <h3>${L('1. Экран (desk.cpl)', '1. Display (desk.cpl)')}</h3>
          <ul>
            <li>${L('<b>Фон</b> — выбор встроенного узора или обоев, загрузка собственного файла с компьютера кнопкой «Обзор...» и режим размещения («По центру», «Замостить», «Растянуть»).', '<b>Background</b> — choose a built-in wallpaper, load a custom image from your computer with Browse..., and set the display mode (Center, Tile, or Stretch).')}</li>
            <li>${L('<b>Заставка</b> — хранители экрана «Трубы 3D», «Сквозь вселенную», «Причуды», «Геометрический вальс», «Черный экран» и заставки, скачанные с <code>www.themeworld98.com</code>; настройка интервала ожидания, кнопка «Просмотр» и переход к энергосбережению монитора («Питание...»).', '<b>Screen Saver</b> — 3D Pipes, Starfield Simulation, Mystify Your Mind, Béziers, Blank Screen, plus savers downloaded from <code>www.themeworld98.com</code>; wait timer, Preview button, and Energy Star monitor power button (Settings...).')}</li>
            <li>${L('<b>Оформление</b> — 8 цветовых схем окон («Стандартная Win», «Классическая темная», «Морская волна», «Пустыня», «Баклажан», «Сирень», «Роза», «Контрастная черная») и выбор цвета фона рабочего стола.', '<b>Appearance</b> — 8 window color schemes (Win Standard, Classic Dark, Marine, Desert, Eggplant, Lilac, Rose, High Contrast Black) and a desktop background color picker.')}</li>
            <li>${L('<b>Эффекты</b> — замена значков «Мой компьютер», «Мои документы», «Сетевое окружение» и «Корзина» (полная и пустая) через кнопку «Сменить значок...», а также флажки: «Крупные значки» (48×48), «Отображать значки с использованием всех возможных цветов» (снятие включает 16-цветный режим), «Отображать окна с использованием эффектов анимации», «Сглаживать неровности экранных шрифтов», «Отображать содержимое окна при перетаскивании» и «Эффект ЭЛТ-монитора (полосы развертки)».', '<b>Effects</b> — change the icons for My Computer, My Documents, Network Neighborhood, and Recycle Bin (full and empty) via Change Icon..., and toggle Large icons (48×48), Show icons using all possible colors (clearing switches to 16-color mode), Animate windows, menus and lists, Smooth edges of screen fonts, Show window contents while dragging, and CRT monitor scanlines.')}</li>
            <li>${L('<b>Темы</b> — готовые комплекты оформления Microslop Plus! 98 («Win 98 по умолчанию», «Загадка», «Космос», «Природа», «Золотая эра», «Высокая контрастность» и темы, скачанные с ThemeWorld \'98).', '<b>Themes</b> — complete Microslop Plus! 98 desktop themes (Win 98 Default, Mystery, Space, Nature, The Golden Era, High Contrast, and themes downloaded from ThemeWorld \'98).')}</li>
          </ul>

          <h3>${L('2. Мышь (main.cpl)', '2. Mouse (main.cpl)')}</h3>
          <ul>
            <li>${L('<b>Кнопки</b> — переключатель «Для правши» / «Для левши» (меняет местами основную и контекстную кнопки мыши), ползунок скорости двойного щелчка с проверочной шкатулкой (дважды щелкните по ней, чтобы клоун выпрыгнул или спрятался) и экспериментальный флажок «Отключить щелчки кнопок мыши» (если его применить, через 5 секунд Скрепыш придет на помощь и вернет управление).', '<b>Buttons</b> — Right-handed / Left-handed button configuration, Double-click speed slider with an interactive jack-in-the-box test area (double-click to make the clown pop out or hide), and a "Disable mouse button clicks" check box (if applied, Clippy automatically rescues your mouse after 5 seconds).')}</li>
            <li>${L('<b>Указатели</b> — выбор схемы курсоров («Стандартная Win», «Крупная (системная)», «3D-бронза», «Динозаврик (Plus! 98)», «Инверсная»), сохранение и удаление собственных схем и просмотр всех 10 ролей указателя.', '<b>Pointers</b> — cursor schemes (Win Standard, Magnified System, 3D Bronze, Dinosaur Plus! 98, Inverted), saving and deleting custom schemes, and previewing all 10 cursor roles.')}</li>
            <li>${L('<b>Перемещение</b> — ползунок скорости движения указателя и флажок «Отображать след указателя мыши» с настройкой длины шлейфа от короткого до длинного.', '<b>Motion</b> — pointer speed slider and the "Show pointer trails" check box with a trail length slider from short to long.')}</li>
          </ul>

          <h3>${L('3. Система (sysdm.cpl)', '3. System (sysdm.cpl)')}</h3>
          <ul>
            <li>${L('<b>Общие</b> — версия Microslop Win 98 SE (4.10.1998 A), имя владельца, модель и тактовая частота процессора, а также объем оперативной памяти согласно текущим настройкам BIOS.', '<b>General</b> — Microslop Win 98 SE version (4.10.1998 A), registered owner, and CPU model, clock speed, and RAM capacity read from current BIOS settings.')}</li>
            <li>${L('<b>Устройства</b> — Диспетчер устройств с переключением вида («По типу» / «По подключению»), списком видеоадаптеров (3dfx Voodoo2 3D Accelerator, S3 Trio64V2/DX), звуковых плат (Creative Sound Blaster AWE64 Gold), привода CD-ROM (TOSHIBA XM-6202B), контроллеров жестких дисков, портов COM/LPT и кнопкой «Свойства» для просмотра прерываний IRQ и состояния драйвера.', '<b>Device Manager</b> — hardware tree viewable by type or by connection, listing display adapters (3dfx Voodoo2, S3 Trio64V2/DX), sound cards (Creative Sound Blaster AWE64 Gold), CD-ROM drive (TOSHIBA XM-6202B), disk controllers, COM/LPT ports, and a Properties dialog showing driver status and IRQ resources.')}</li>
            <li>${L('<b>Быстродействие</b> — сводка свободных ресурсов системы, режима файловой системы и памяти, а также три кнопки тонкой настройки: <b>«Файловая система...»</b> (роль компьютера, упреждающее чтение, размер кэша CD-ROM, отладка FAT32), <b>«Графика...»</b> (4 ступени аппаратного ускорения видеокарты) и <b>«Вирт. память...»</b> (автоматический или ручной размер файла подкачки <code>WIN386.SWP</code> на диске C:).', '<b>Performance</b> — system resource and memory summary plus three tuning dialogs: <b>File System...</b> (computer role, read-ahead optimization, CD-ROM cache size, FAT32 troubleshooting), <b>Graphics...</b> (4-step hardware acceleration slider), and <b>Virtual Memory...</b> (automatic or manual swap file <code>WIN386.SWP</code> size on drive C:).')}</li>
          </ul>

          <h3>${L('4. Электропитание (powercfg.cpl)', '4. Power Management (powercfg.cpl)')}</h3>
          <ul>
            <li>${L('<b>Схемы управления питанием</b> — выбор готовой схемы («Домашний или офисный настольный», «Портативный (ноутбук)», «Всегда включен»), сохранение своей схемы кнопкой «Сохранить как...» и раздельная настройка времени бездействия до <b>отключения монитора</b> и <b>остановки жестких дисков</b>.', '<b>Power Schemes</b> — built-in profiles (Home/Office Desk, Portable/Laptop, Always On), Save As... for custom schemes, and separate idle timers for <b>Turn off monitor</b> and <b>Turn off hard disks</b>.')}</li>
            <li>${L('<b>Дополнительно</b> — флажок «Всегда отображать значок на панели задач» (выводит в трей значок питания с меню быстрого переключения схем и немедленного гашения монитора).', '<b>Advanced</b> — "Always show icon on the taskbar" check box, placing a power icon in the tray for switching schemes or triggering monitor standby on demand.')}</li>
          </ul>

          <h3>${L('5. Установка и удаление программ (appwiz.cpl)', '5. Add/Remove Programs (appwiz.cpl)')}</h3>
          <ul>
            <li>${L('<b>Установка и удаление</b> — кнопка <b>«Установить...»</b> запускает мастер, который ищет установочные пакеты <code>.EXE</code> на компакт-диске D: и в папке <code>C:\\My Documents\\Downloads</code>. В нижнем списке можно удалить установленную программу или игру либо вызвать окно обслуживания Microslop Office 97 (восстановление или удаление Скрепыша).', '<b>Install/Uninstall</b> — <b>Install...</b> launches a wizard that scans CD drive D: and <code>C:\\My Documents\\Downloads</code> for <code>.EXE</code> setup packages. The list below uninstalls installed apps/games or opens Microslop Office 97 maintenance to repair or remove Clippy.')}</li>
            <li>${L('<b>Установка Win</b> — включение и отключение 9 категорий системных компонентов (Стандартные, Связь, Средства мультимедиа, Игры, Служебные программы, Темы рабочего стола и др.) с просмотром отдельных модулей по кнопке «Состав...».', '<b>Win Setup</b> — enables or disables 9 categories of system components (Accessories, Communications, Multimedia, Games, System Tools, Desktop Themes, etc.) with a Details... dialog for individual subcomponents.')}</li>
            <li>${L('<b>Загрузочный диск</b> — кнопка <b>«Создать диск...»</b> форматирует виртуальную дискету <b>A:</b> и записывает на неё системные файлы аварийной загрузки MS-DOS (<code>COMMAND.COM</code>, <code>FDISK.EXE</code>, <code>FORMAT.COM</code>, <code>SCANDISK.EXE</code>, <code>HIMEM.SYS</code>, <code>OAKCDROM.SYS</code>, <code>EBD.CAB</code>).', '<b>Startup Disk</b> — <b>Create Disk...</b> formats virtual floppy drive <b>A:</b> and writes the MS-DOS emergency boot utilities (<code>COMMAND.COM</code>, <code>FDISK.EXE</code>, <code>FORMAT.COM</code>, <code>SCANDISK.EXE</code>, <code>HIMEM.SYS</code>, <code>OAKCDROM.SYS</code>, <code>EBD.CAB</code>).')}</li>
          </ul>

          <h3>${L('6. Мультимедиа, Дата и время, Язык, Обозреватель и Панель задач', '6. Multimedia, Date/Time, Regional, Internet, and Taskbar')}</h3>
          <ul>
            <li>${L('<b>Мультимедиа (mmsys.cpl)</b> — на вкладке «Звуки» назначаются звуковые сигналы для событий системы и выбираются схемы («Win Default», «Robotz», «Jungle», «Без звука») с кнопкой прослушивания «▶»; на вкладке «Аудио» выбирается устройство воспроизведения и включается значок громкости на панели задач.', '<b>Multimedia (mmsys.cpl)</b> — the Sounds tab assigns audio clips to system events and switches sound schemes (Win Default, Robotz, Jungle, No Sounds) with a "▶" preview button; the Audio tab selects the playback device and toggles the taskbar volume icon.')}</li>
            <li>${L('<b>Дата и время (timedate.cpl)</b> — установка месяца, года, числа и точного времени на вкладке «Дата и время» и выбор часового пояса с переходом на летнее время на вкладке «Часовой пояс».', '<b>Date/Time (timedate.cpl)</b> — sets the month, year, day, and clock time on the Date & Time tab, and configures the GMT offset and daylight saving time on the Time Zone tab.')}</li>
            <li>${L('<b>Язык и стандарты (intl.cpl)</b> — мгновенно переключает язык всей оболочки между русским и английским и показывает примеры форматирования чисел, валюты, времени и даты.', '<b>Regional Settings (intl.cpl)</b> — switches the entire shell between Russian and English and previews number, currency, time, and date formatting.')}</li>
            <li>${L('<b>Свойства обозревателя (inetcpl.cpl)</b> — задает домашнюю страницу Internet Explorer (кнопки «С текущей», «По умолчанию» <code>http://www.search98.com</code>, «Пустая» <code>about:blank</code>), удаляет временные файлы Интернета и очищает журнал посещенных адресов.', '<b>Internet Options (inetcpl.cpl)</b> — sets the Internet Explorer home page (Use Current, Use Default <code>http://www.search98.com</code>, or Use Blank <code>about:blank</code>), deletes temporary Internet files, and clears the history list.')}</li>
            <li>${L('<b>Панель задач и меню «Пуск»</b> — на вкладке «Параметры панели задач» переключаются флажки «Располагать поверх других окон», «Автоматически убирать с экрана», «Мелкие значки в главном меню» и «Отображать часы»; на вкладке «Настройка меню "Пуск"» кнопки «Добавить...», «Удалить...» и «Дополнительно...» управляют ярлыками программ, а кнопка «Очистить» стирает список недавних документов, историю окна «Выполнить» и журнал Netscape.', '<b>Taskbar & Start Menu</b> — the Taskbar Options tab toggles Always on top, Auto hide, Show small icons in Start menu, and Show clock; the Start Menu Programs tab provides Add..., Remove..., and Advanced... to manage program shortcuts, and Clear to wipe recent documents, Run history, and Netscape history.')}</li>
          </ul>
          ${related('desktop', 'startmenu', 'multimedia', 'system')}
        `
      },
      {
        id: 'system',
        keywords: L('служебные, лаунчер, обновление win 98, обновить, диспетчер задач, системный монитор, sysmon, msconfig, sysedit, редактор файлов конфигурации, dxdiag, реестр, regedit, scandisk, дефрагментация, архивация, резервная копия, восстановление, сохранения, перенос, сброс, очистка диска, wintune, clibench, тест монитора, nokia, mon_test, антивирус, avp, касперский', 'system tools, launcher, win 98 update, task manager, system monitor, sysmon, msconfig, sysedit, system configuration editor, dxdiag, registry, regedit, scandisk, defrag, backup, restore, saves, transfer, reset, disk cleanup, wintune, clibench, monitor test, nokia, mon_test, antivirus, avp, kaspersky'),
        content: `
          <h2>${titles.system}</h2>
          <p>${L('Служебные программы расположены в меню «Пуск» → «Программы» → «Стандартные» → «Служебные». Они позволяют следить за ресурсами компьютера, редактировать конфигурационные файлы и реестр, обслуживать диск и тестировать оборудование.', 'System tools are located in Start → Programs → Accessories → System Tools. They monitor system resources, edit configuration files and the Registry, maintain disk drives, and benchmark hardware.')}</p>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('taskmgr')}</td><td><b>${L('Диспетчер задач (Task Manager)', 'Task Manager')}</b> — ${L('список открытых приложений и фоновых процессов с графиками загрузки ЦП и памяти и кнопкой «Снять задачу».', 'lists running applications and background processes with live CPU and memory graphs and an End Task button.')}</td><td><button class="win-help-shortcut" data-run="taskmgr">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('sysmon')}</td><td><b>${L('Системный монитор (System Monitor)', 'System Monitor')}</b> — ${L('графики в реальном времени (линейные, гистограммы, числовые) для загрузки ядра ЦП, свободной памяти, файла подкачки, чтения диска и сетевого трафика.', 'real-time line, bar, and numeric charts tracking CPU kernel usage, free memory, swap file size, disk throughput, and network traffic.')}</td><td><button class="win-help-shortcut" data-run="sysmon">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('msconfig')}</td><td><b>${L('Настройка системы (MSConfig)', 'System Configuration Utility (MSConfig)')}</b> — ${L('управление вариантами загрузки, файлами CONFIG.SYS, AUTOEXEC.BAT, SYSTEM.INI, WIN.INI и списком программ автозагрузки.', 'manages startup modes, CONFIG.SYS, AUTOEXEC.BAT, SYSTEM.INI, WIN.INI, and the Startup programs list.')}</td><td><button class="win-help-shortcut" data-run="msconfig">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('sysedit')}</td><td><b>${L('Редактор файлов конфигурации (SysEdit)', 'System Configuration Editor (SysEdit)')}</b> — ${L('каскадное окно одновременного редактирования системных файлов AUTOEXEC.BAT, CONFIG.SYS, WIN.INI и SYSTEM.INI.', 'MDI editor that opens AUTOEXEC.BAT, CONFIG.SYS, WIN.INI, and SYSTEM.INI in cascaded child windows.')}</td><td><button class="win-help-shortcut" data-run="sysedit">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('dxdiag')}</td><td><b>${L('Диагностика DirectX (DxDiag)', 'DirectX Diagnostic Tool (DxDiag)')}</b> — ${L('проверка DirectX 6.1, тестирование 2D-оверлея DirectDraw, вращающегося 3D-куба Direct3D и звуковых каналов DirectSound.', 'inspects DirectX 6.1 drivers and runs interactive DirectDraw 2D, spinning Direct3D cube, and DirectSound tests.')}</td><td><button class="win-help-shortcut" data-run="dxdiag">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('regedit')}</td><td><b>${L('Редактор реестра (Registry Editor)', 'Registry Editor')}</b> — ${L('просмотр и изменение разделов HKEY_CLASSES_ROOT, HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE, поиск по ключам и экспорт/импорт файлов .REG.', 'browses and edits HKEY_CLASSES_ROOT, HKEY_CURRENT_USER, and HKEY_LOCAL_MACHINE keys with search and .REG export/import.')}</td><td><button class="win-help-shortcut" data-run="regedit">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('scandisk')}</td><td><b>ScanDisk</b> — ${L('стандартная и полная проверка поверхности диска C: на сбойные сектора и потерянные кластеры.', 'runs standard or thorough surface scans on drive C: to repair bad sectors and lost clusters.')}</td><td><button class="win-help-shortcut" data-run="scandisk">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('defrag')}</td><td><b>${L('Дефрагментация диска (Disk Defragmenter)', 'Disk Defragmenter')}</b> — ${L('визуальная укладка кластеров диска C: с подробной картой занятых, фрагментированных и системных блоков.', 'defragments clusters on drive C: with a live block map legend.')}</td><td><button class="win-help-shortcut" data-run="defrag">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('backup')}</td><td><b>${L('Архивация данных (Backup)', 'Backup')}</b> — ${L('архивы файлов, настроек и сохранений игр в хранилище на диске C: или в файл .bkf для переноса на другой компьютер; восстановление всей системы или отдельных программ; сброс Win 98 к первому запуску.', 'backs up files, settings and game saves to storage on drive C: or to a .bkf file for another computer; restores the whole system or single programs; resets Win 98 to its first start.')}</td><td><button class="win-help-shortcut" data-run="msbackup">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('bugreport')}</td><td><b>${L('Сообщение об ошибке', 'Report a Problem')}</b> — ${L('клавиша F10 (в любой программе Ctrl+F10) снимает экран, запоминает открытые окна и место в игре и отправляет отчёт разработчику. «Мои отчёты об ошибках» показывают, что с отчётом стало.', 'F10 (Ctrl+F10 in any program) takes a screenshot, records open windows and your place in the game and sends a report to the developer. "My Problem Reports" shows what happened to it.')}</td></tr>
            <tr><td class="win-help-table-glyph">${glyph('win-update')}</td><td><b>${L('Лаунчер Win 98', 'Win 98 Launcher')}</b> — ${L('открывается при запуске Win98.exe: показывает новости и изменения всех версий и ставит обновления, скачивая только изменённые файлы. Если обновление отложено, в области уведомлений появляется значок, а «Обновить сейчас» завершает работу Win 98 и открывает лаунчер. Сохранения при обновлении не меняются.', 'opens when Win98.exe starts: shows news and changes of every version and installs updates by downloading only the changed files. If you postpone an update, an icon appears in the notification area, and Update now shuts Win 98 down and opens the launcher. Saves never change on update.')}</td></tr>
            <tr><td class="win-help-table-glyph">${glyph('cleanmgr')}</td><td><b>${L('Очистка диска (Disk Cleanup)', 'Disk Cleanup')}</b> — ${L('удаление временных файлов Интернета, старых файлов установки и очистка Корзины.', 'frees disk space by removing temporary Internet files, setup logs, and Recycle Bin contents.')}</td><td><button class="win-help-shortcut" data-run="cleanmgr">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('wintune')}</td><td><b>Wintune 98 / CLIbench</b> — ${L('испытательный пакет для замера производительности процессора (MIPS/MFLOPS), видеокарты 2D/3D, памяти и диска и сравнения с эталонными ПК 1998 года.', 'hardware benchmark suite measuring CPU (MIPS/MFLOPS), 2D/3D video, RAM, and disk speed against 1998 reference systems.')}</td><td><button class="win-help-shortcut" data-run="wintune">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('mon-test')}</td><td><b>NOKIA Monitor Test</b> — ${L('набор полноэкранных настроечных таблиц для проверки геометрии, сведения лучей, муара, контрастности и фокусировки монитора.', 'fullscreen calibration patterns for testing monitor geometry, convergence, moiré, contrast, and focus.')}</td><td><button class="win-help-shortcut" data-run="mon_test">${icon('shortcut-overlay')}</button></td></tr>
          </table>
          ${note([
            L('<b>Антивирус Касперского (AVP 3.0)</b> покупается и скачивается на официальном сайте <b>Лаборатории Касперского</b> (<code>http://www.avp.ru</code>) и проверяет папки диска C: на вирусы со звуковым оповещением.', '<b>Kaspersky Anti-Virus (AVP 3.0)</b> can be purchased and downloaded from <b>Kaspersky Lab</b> (<code>http://www.avp.ru</code>) to scan drive C: folders for viruses.')
          ])}
          ${related('cpanel', 'run', 'troubleshooting')}
        `
      },
      {
        id: 'run',
        keywords: L('выполнить, команда, run, cmd, command, ms-dos, консоль, winver, dir, cd, cls, mem, ver, ping, ipconfig, fdisk, format, matrix, cow, starwars', 'run, command, cmd, ms-dos, console, winver, dir, cd, cls, mem, ver, ping, ipconfig, fdisk, format, matrix, cow, starwars'),
        content: `
          <h2>${titles.run}</h2>
          <p>${L('Окно «Пуск» → «Выполнить...» открывает любую программу, апплет Панели управления, папку или веб-страницу по её короткому имени.', 'The Start → Run... dialog opens any program, Control Panel applet, folder, or web address by its command name.')}</p>
          <h3>${L('Основные команды окна «Выполнить»', 'Common Run dialog commands')}</h3>
          <table class="win-help-table">
            <tr><th>${L('Команда', 'Command')}</th><th>${L('Что открывает', 'What it opens')}</th></tr>
            <tr><td><code>control</code></td><td>${L('Панель управления', 'Control Panel')}</td></tr>
            <tr><td><code>desk.cpl</code> / <code>main.cpl</code> / <code>sysdm.cpl</code></td><td>${L('Свойства: Экран / Мышь / Система', 'Display / Mouse / System Properties')}</td></tr>
            <tr><td><code>powercfg.cpl</code> / <code>appwiz.cpl</code> / <code>mmsys.cpl</code></td><td>${L('Электропитание / Установка программ / Мультимедиа', 'Power Management / Add-Remove Programs / Multimedia')}</td></tr>
            <tr><td><code>timedate.cpl</code> / <code>intl.cpl</code> / <code>inetcpl.cpl</code></td><td>${L('Дата и время / Язык и стандарты / Свойства обозревателя', 'Date-Time / Regional Settings / Internet Options')}</td></tr>
            <tr><td><code>notepad</code> / <code>wordpad</code> / <code>mspaint</code> / <code>calc</code></td><td>${L('Блокнот / WordPad / Paint / Калькулятор', 'Notepad / WordPad / Paint / Calculator')}</td></tr>
            <tr><td><code>charmap</code> / <code>clipbrd</code> / <code>kodakimg</code></td><td>${L('Таблица символов / Буфер обмена / Просмотр картинок', 'Character Map / ClipBook Viewer / Imaging')}</td></tr>
            <tr><td><code>excel</code> / <code>photoshop</code> / <code>acdsee</code> / <code>acrobat</code> / <code>winrar</code> / <code>wincmd</code></td><td>${L('Excel 97 / Photoshop 5.0 / ACDSee / Acrobat Reader / WinRAR / Win Commander', 'Excel 97 / Photoshop 5.0 / ACDSee / Acrobat Reader / WinRAR / Win Commander')}</td></tr>
            <tr><td><code>winamp</code> / <code>cdplayer</code> / <code>cdex</code> / <code>ft2</code> / <code>sndrec32</code> / <code>sndvol32</code> / <code>mplayer</code></td><td>${L('WinAmp / Лазерный проигрыватель / CDex / FastTracker II / Звукозапись / Громкость / Медиаплеер', 'WinAmp / CD Player / CDex / FastTracker II / Sound Recorder / Volume Control / Media Player')}</td></tr>
            <tr><td><code>iexplore</code> / <code>netscape</code> / <code>outlook</code> / <code>icq</code> / <code>mirc</code> / <code>hypertrm</code></td><td>${L('Internet Explorer / Netscape / Outlook Express / ICQ / mIRC / HyperTerminal', 'Internet Explorer / Netscape / Outlook Express / ICQ / mIRC / HyperTerminal')}</td></tr>
            <tr><td><code>taskmgr</code> / <code>sysmon</code> / <code>msconfig</code> / <code>sysedit</code> / <code>dxdiag</code> / <code>regedit</code></td><td>${L('Диспетчер задач / Системный монитор / Настройка системы / SysEdit / DirectX / Реестр', 'Task Manager / System Monitor / MSConfig / SysEdit / DirectX Diagnostic / Registry Editor')}</td></tr>
            <tr><td><code>msbackup</code> / <code>restore</code></td><td>${L('Архивация данных / Восстановление из архива', 'Backup / Restore from a backup')}</td></tr>
            <tr><td><code>bugreport</code> / <code>bugreport /list</code></td><td>${L('Сообщение об ошибке / Мои отчёты об ошибках', 'Report a Problem / My Problem Reports')}</td></tr>
            <tr><td><code>scandisk</code> / <code>defrag</code> / <code>cleanmgr</code> / <code>wintune</code> / <code>clibench</code> / <code>mon_test</code></td><td>${L('ScanDisk / Дефрагментация / Очистка диска / Wintune 98 / CLIbench / Тест монитора', 'ScanDisk / Disk Defragmenter / Disk Cleanup / Wintune 98 / CLIbench / Monitor Test')}</td></tr>
            <tr><td><code>qbasic</code> / <code>command</code> / <code>clippy</code> / <code>winver</code></td><td>${L('QBasic 1.1 / Сеанс MS-DOS / Помощник Скрепыш / О программе Win', 'QBasic 1.1 / MS-DOS Prompt / Clippy / About Win')}</td></tr>
          </table>
          <h3>${L('Сеанс MS-DOS (command.com)', 'MS-DOS Prompt (command.com)')}</h3>
          <p>${L('В окне сеанса MS-DOS работают команды навигации по виртуальному диску и сетевые утилиты: <code>HELP</code>, <code>DIR</code>, <code>CD</code>, <code>TYPE</code>, <code>CLS</code>, <code>VER</code>, <code>MEM</code>, <code>DATE</code>, <code>TIME</code>, <code>TREE</code>, <code>ECHO</code>, <code>COLOR</code>, <code>PING</code>, <code>IPCONFIG</code>, <code>NETSTAT</code>, <code>TRACERT</code>, <code>FDISK</code>, <code>FORMAT</code>, <code>CLIPPY /?</code>, а также пасхальные команды <code>MATRIX</code>, <code>COW</code> и <code>STARWARS</code>. Полноэкранный режим MS-DOS вызывается через «Пуск» → «Завершение работы...» → «Перезагрузить в режиме эмуляции MS-DOS».', 'The MS-DOS Prompt window supports virtual disk navigation and network commands: <code>HELP</code>, <code>DIR</code>, <code>CD</code>, <code>TYPE</code>, <code>CLS</code>, <code>VER</code>, <code>MEM</code>, <code>DATE</code>, <code>TIME</code>, <code>TREE</code>, <code>ECHO</code>, <code>COLOR</code>, <code>PING</code>, <code>IPCONFIG</code>, <code>NETSTAT</code>, <code>TRACERT</code>, <code>FDISK</code>, <code>FORMAT</code>, <code>CLIPPY /?</code>, plus easter eggs <code>MATRIX</code>, <code>COW</code>, and <code>STARWARS</code>. Full-screen MS-DOS mode is available via Start → Shut Down... → Restart in MS-DOS mode.')}</p>
          ${shortcut('open_run', L('Щелкните здесь, чтобы открыть окно «Выполнить».', 'Click here to open the Run dialog.'))}
          ${shortcut('command', L('Щелкните здесь, чтобы открыть сеанс MS-DOS.', 'Click here to open the MS-DOS Prompt.'))}
          ${related('system', 'cpanel', 'shortcuts')}
        `
      },
      {
        id: 'troubleshooting',
        keywords: L('неполадки, ошибка, зависание, снять задачу, синий экран, bsod, диск, восстановление, мышь не щелкает, экран погас, спящий режим, bios, cmos, разгон, частота, память', 'troubleshooting, error, hang, end task, blue screen, bsod, disk, recovery, mouse clicks disabled, screen blank, standby, bios, cmos, overclock, frequency, memory'),
        content: `
          <h2>${titles.troubleshooting}</h2>
          <h3>${L('Программа перестала отвечать', 'A program stops responding')}</h3>
          <ol>
            <li>${L('Откройте <b>Диспетчер задач</b>: нажмите ' + key('Ctrl+Alt+Del') + ' или выберите «Пуск» → «Программы» → «Стандартные» → «Служебные» → «Диспетчер задач».', 'Open <b>Task Manager</b>: press ' + key('Ctrl+Alt+Del') + ' or click Start → Programs → Accessories → System Tools → Task Manager.')}</li>
            <li>${L('Выделите зависшую программу на вкладке «Приложения» и нажмите <b>Снять задачу</b>.', 'Select the unresponsive application on the Applications tab and click <b>End Task</b>.')}</li>
          </ol>
          ${shortcut('taskmgr', L('Щелкните здесь, чтобы открыть Диспетчер задач.', 'Click here to open Task Manager.'))}

          <h3>${L('Перестали работать щелчки мыши', 'Mouse clicks stopped working')}</h3>
          <p>${L('Если в апплете «Мышь» на вкладке «Кнопки» был включен флажок «Отключить щелчки кнопок мыши», подождите 5 секунд: помощник Скрепыш автоматически заметит проблему, снимет блокировку и вернет управление кнопками мыши.', 'If "Disable mouse button clicks" was enabled on the Buttons tab of Mouse Properties, wait 5 seconds: Clippy automatically detects the lockout and restores normal mouse clicking.')}</p>

          <h3>${L('Погас экран (режим энергосбережения Energy Star)', 'The screen went dark (Energy Star standby)')}</h3>
          <p>${L('Когда срабатывает таймер отключения монитора, заданный в апплете «Электропитание», экран переходит в ждущий режим. Пошевелите мышью или нажмите любую клавишу на клавиатуре, чтобы мгновенно разбудить монитор.', 'When the monitor standby timer configured in Power Management expires, the display enters sleep mode. Move the mouse or press any key to wake the monitor immediately.')}</p>

          <h3>${L('Окно ушло за пределы экрана', 'A window moved off the screen')}</h3>
          <p>${L('Щелкните кнопку этого окна на панели задач правой кнопкой мыши и выберите «Развернуть», либо щелкните свободное место панели задач правой кнопкой и выберите «Окна каскадом».', 'Right-click the window’s taskbar button and choose Maximize, or right-click an empty area of the taskbar and choose Cascade Windows.')}</p>

          <h3>${L('Ошибки файловой системы и нехватка места на диске C:', 'Disk errors and low free space on drive C:')}</h3>
          <p>${L('Запустите <b>ScanDisk</b> для проверки кластеров, <b>Дефрагментацию диска</b> для ускорения чтения и <b>Очистку диска</b> (или очистите Корзину) для освобождения мегабайт.', 'Run <b>ScanDisk</b> to check cluster integrity, <b>Disk Defragmenter</b> to optimize file layout, and <b>Disk Cleanup</b> (or Empty Recycle Bin) to reclaim disk space.')}</p>
          ${shortcut('scandisk', L('Щелкните здесь, чтобы запустить ScanDisk.', 'Click here to run ScanDisk.'))}

          <h3>${L('Настройка CMOS BIOS и безопасный сброс оборудования', 'CMOS BIOS Setup and hardware reset')}</h3>
          <p>${L('Чтобы изменить частоту шины и множитель процессора, объем ОЗУ или порядок загрузочных дисков (A:, C:, CD-ROM), откройте «Пуск» → «Завершение работы...» и выберите <b>«Перезагрузить в режиме настройки BIOS»</b> (либо нажмите ' + key('Del') + ' / ' + key('F2') + ' во время экрана загрузки POST). Если после разгона система работает нестабильно, выберите в BIOS пункт <b>Load Fail-Safe Defaults</b> и сохраните настройки клавишей ' + key('F10') + '.', 'To change the CPU bus clock and multiplier, RAM amount, or boot device order (A:, C:, CD-ROM), open Start → Shut Down... and choose <b>Restart in BIOS Setup mode</b> (or press ' + key('Del') + ' / ' + key('F2') + ' during the POST boot screen). If overclocking causes instability, select <b>Load Fail-Safe Defaults</b> in BIOS and press ' + key('F10') + ' to save.')}</p>
          ${shortcut('bios-setup', L('Щелкните здесь, чтобы перезагрузить компьютер в CMOS Setup Utility (BIOS).', 'Click here to restart into CMOS Setup Utility (BIOS).'))}
          ${related('system', 'cpanel', 'run')}
        `
      }
    ];
    helpTopics.forEach(topic => { topic.title = titles[topic.id]; });

    const indexItems = (isRu ? [
      ['Автозагрузка (MSConfig)', 'system'], ['Антивирус Касперского (AVP)', 'system'], ['Архиватор WinRAR 98', 'apps'],
      ['Блокнот (Notepad)', 'apps'], ['Буфер обмена (Clipbrd)', 'apps'], ['Быстродействие системы', 'cpanel'],
      ['Быстрый запуск', 'startmenu'], ['Виртуальная память (WIN386.SWP)', 'cpanel'], ['Восстановление файлов из Корзины', 'desktop'],
      ['Выделение значков', 'desktop'], ['Выполнить (команда Run)', 'run'], ['Вырезать, копировать и вставить', 'explorer'],
      ['Гардероб Скрепыша', 'clippy'], ['Громкость и микшер', 'multimedia'], ['Дата и время (timedate.cpl)', 'cpanel'],
      ['Двойной щелчок мыши', 'cpanel'], ['Дефрагментация диска', 'system'], ['Диагностика DirectX (DxDiag)', 'system'],
      ['Диаграмма емкости диска C:', 'explorer'], ['Диск 3,5 (A:) и загрузочная дискета', 'cpanel'], ['Диспетчер задач', 'system'],
      ['Диспетчер устройств', 'cpanel'], ['Домашняя страница обозревателя', 'cpanel'], ['Завершение работы и перезагрузка', 'startmenu'],
      ['Заставка (хранитель экрана)', 'cpanel'], ['Звукозапись (Sound Recorder)', 'multimedia'], ['Звуковые схемы событий', 'cpanel'],
      ['Значки рабочего стола и их смена', 'cpanel'], ['Игры и клиент Steam', 'apps'], ['Интернет и модем (Dial-Up)', 'internet'],
      ['Калькулятор', 'apps'], ['Клавиатурные сочетания', 'shortcuts'], ['Кнопка «Шеф идёт!» (Boss Key)', 'clippy'],
      ['Компоненты Win 98 (установка)', 'cpanel'], ['Корзина (очистка и восстановление)', 'desktop'], ['Курсоры и указатели мыши', 'cpanel'],
      ['Лазерный проигрыватель (CD Player)', 'multimedia'], ['Левша и правша (кнопки мыши)', 'cpanel'], ['Мастер писем Скрепыша', 'clippy'],
      ['Медиаплеер (Media Player)', 'multimedia'], ['Меню «Пуск» и его настройка', 'startmenu'], ['Мой компьютер и диски', 'explorer'],
      ['Мультимедиа (mmsys.cpl)', 'cpanel'], ['Мышь (main.cpl)', 'cpanel'], ['Найти файлы и папки (F3)', 'explorer'],
      ['Настройка системы (MSConfig)', 'system'], ['Обои рабочего стола', 'cpanel'], ['Область уведомлений (трей)', 'startmenu'],
      ['Овечка eSheep 98 и котенок Neko', 'apps'], ['Окна (перемещение, размер, каскад)', 'desktop'], ['Оформление и цветовые схемы', 'cpanel'],
      ['Очистка диска (cleanmgr)', 'system'], ['Панель задач и меню «Пуск»', 'cpanel'], ['Панель управления', 'cpanel'],
      ['Поиск файлов', 'explorer'], ['Показать рабочий стол', 'startmenu'], ['Помощник Скрепыш (Clippy)', 'clippy'],
      ['Проводник (Explorer)', 'explorer'], ['Просмотр картинок (Imaging и ACDSee)', 'apps'], ['Разгон процессора и BIOS Setup', 'troubleshooting'],
      ['Редактор реестра (RegEdit)', 'system'], ['Редактор файлов конфигурации (SysEdit)', 'system'], ['Режим энергосбережения монитора', 'cpanel'],
      ['Свойства обозревателя (inetcpl.cpl)', 'cpanel'], ['Сеанс MS-DOS (command.com)', 'run'], ['Синий экран (BSOD)', 'troubleshooting'],
      ['Система (sysdm.cpl)', 'cpanel'], ['Системное меню окна', 'desktop'], ['Системный монитор (SysMon)', 'system'],
      ['Снять задачу', 'troubleshooting'], ['Стандартные программы', 'apps'], ['Таблица символов (CharMap)', 'apps'],
      ['Темы рабочего стола (Plus! 98)', 'cpanel'], ['Тест монитора NOKIA', 'system'], ['Удаление и установка программ (appwiz.cpl)', 'cpanel'],
      ['Устранение неполадок', 'troubleshooting'], ['Часовой пояс и часы', 'cpanel'], ['Что нового в системе', 'whatsnew'],
      ['Шлейф (след) указателя мыши', 'cpanel'], ['Экран (desk.cpl)', 'cpanel'], ['Электропитание (powercfg.cpl)', 'cpanel'],
      ['Эффекты (крупные значки, сглаживание, ЭЛТ)', 'cpanel'], ['Язык и стандарты (intl.cpl)', 'cpanel'], ['Ярлыки программ', 'desktop'],
      ['ACDSee 32', 'apps'], ['Acrobat Reader 3.0 (PDF)', 'apps'], ['Adobe Photoshop 5.0', 'apps'],
      ['BIOS (CMOS Setup Utility)', 'troubleshooting'], ['CDex (граббер MP3)', 'multimedia'], ['FastTracker II (трекер)', 'multimedia'],
      ['HyperTerminal (BBS)', 'internet'], ['ICQ 98a', 'internet'], ['Internet Explorer 5', 'internet'],
      ['Microslop Excel 97', 'apps'], ['mIRC 32 (IRC-чат)', 'internet'], ['Netscape Communicator 6', 'internet'],
      ['Outlook Express', 'internet'], ['Paint', 'apps'], ['QBasic 1.1', 'apps'],
      ['ScanDisk', 'system'], ['Win Commander 3.5', 'apps'], ['WinAmp 98', 'multimedia'],
      ['Wintune 98 и CLIbench', 'system'], ['WordPad', 'apps']
    ] : [
      ['Accessories', 'apps'], ['ACDSee 32', 'apps'], ['Acrobat Reader 3.0 (PDF)', 'apps'],
      ['Add/Remove Programs (appwiz.cpl)', 'cpanel'], ['Adobe Photoshop 5.0', 'apps'], ['Appearance and color schemes', 'cpanel'],
      ['BIOS (CMOS Setup Utility)', 'troubleshooting'], ['Blue Screen (BSOD)', 'troubleshooting'], ['Boss Key (Clippy)', 'clippy'],
      ['Calculator', 'apps'], ['CD Player', 'multimedia'], ['CDex MP3 ripper', 'multimedia'],
      ['Character Map', 'apps'], ['ClipBook Viewer (clipbrd)', 'apps'], ['Clippy the Office Assistant', 'clippy'],
      ['Clock and time zone', 'cpanel'], ['Control Panel', 'cpanel'], ['Cut, copy, and paste', 'explorer'],
      ['Date/Time (timedate.cpl)', 'cpanel'], ['Desktop icons and custom icons', 'cpanel'], ['Desktop pets (Neko and eSheep 98)', 'apps'],
      ['Device Manager', 'cpanel'], ['Dial-Up Networking (modem)', 'internet'], ['DirectX Diagnostic Tool (DxDiag)', 'system'],
      ['Disk capacity pie chart', 'explorer'], ['Disk Cleanup (cleanmgr)', 'system'], ['Disk Defragmenter', 'system'],
      ['Display Properties (desk.cpl)', 'cpanel'], ['Double-click speed', 'cpanel'], ['Effects (large icons, font smoothing, CRT)', 'cpanel'],
      ['End Task', 'troubleshooting'], ['Explorer', 'explorer'], ['FastTracker II', 'multimedia'],
      ['Find Files or Folders (F3)', 'explorer'], ['Floppy drive A: and Startup Disk', 'cpanel'], ['Games and Steam client', 'apps'],
      ['Home page (Internet Options)', 'cpanel'], ['HyperTerminal (BBS)', 'internet'], ['ICQ 98a', 'internet'],
      ['Imaging', 'apps'], ['Internet Explorer 5', 'internet'], ['Internet Options (inetcpl.cpl)', 'cpanel'],
      ['Kaspersky Anti-Virus (AVP)', 'system'], ['Keyboard shortcuts', 'shortcuts'], ['Language and Regional Settings (intl.cpl)', 'cpanel'],
      ['Left-handed and right-handed mouse', 'cpanel'], ['Letter Wizard (Clippy)', 'clippy'], ['Media Player', 'multimedia'],
      ['Microslop Excel 97', 'apps'], ['mIRC 32 (IRC client)', 'internet'], ['Monitor standby (Energy Star)', 'cpanel'],
      ['Mouse Properties (main.cpl)', 'cpanel'], ['MS-DOS Prompt (command.com)', 'run'], ['MSConfig (System Configuration)', 'system'],
      ['Multimedia Properties (mmsys.cpl)', 'cpanel'], ['My Computer and drives', 'explorer'], ['Netscape Communicator 6', 'internet'],
      ['NOKIA Monitor Test', 'system'], ['Notepad', 'apps'], ['Notification area (system tray)', 'startmenu'],
      ['Outlook Express', 'internet'], ['Overclocking and BIOS Setup', 'troubleshooting'], ['Paint', 'apps'],
      ['Performance and Graphics acceleration', 'cpanel'], ['Pointer schemes and trails', 'cpanel'], ['Power Management (powercfg.cpl)', 'cpanel'],
      ['QBasic 1.1', 'apps'], ['Quick Launch toolbar', 'startmenu'], ['Recycle Bin (restore and empty)', 'desktop'],
      ['Registry Editor (RegEdit)', 'system'], ['Run command', 'run'], ['ScanDisk', 'system'],
      ['Screen saver', 'cpanel'], ['Selecting icons', 'desktop'], ['Shortcuts', 'desktop'],
      ['Show Desktop', 'startmenu'], ['Shut Down and Restart', 'startmenu'], ['Sound Recorder', 'multimedia'],
      ['Sound schemes', 'cpanel'], ['Start menu customization', 'startmenu'], ['Startup programs', 'system'],
      ['SysEdit (System Configuration Editor)', 'system'], ['System Monitor (SysMon)', 'system'], ['System Properties (sysdm.cpl)', 'cpanel'],
      ['System Tools', 'system'], ['Task Manager', 'system'], ['Taskbar & Start Menu Properties', 'cpanel'],
      ['Themes (Microslop Plus! 98)', 'cpanel'], ['Troubleshooting', 'troubleshooting'], ['Virtual memory (WIN386.SWP)', 'cpanel'],
      ['Volume Control mixer', 'multimedia'], ['Wallpaper', 'cpanel'], ['What’s new in the system', 'whatsnew'],
      ['Win Commander 3.5', 'apps'], ['Win components setup', 'cpanel'], ['WinAmp 98', 'multimedia'],
      ['Window system menu', 'desktop'], ['WinRAR 98 archiver', 'apps'], ['Wintune 98 and CLIbench', 'system'],
      ['WordPad', 'apps']
    ]).map(([term, topicId]) => ({ term, topicId }));

    const content = document.createElement('div');
    content.className = 'win-help-container';
    const startBook = books.find(b => b.topics.includes(startTopic)) || books[0];

    content.innerHTML = `
      <div class="win-help-toolbar">
        <button class="win-help-btn" data-action="toggle-nav"><span class="win-help-btn-icon">${icon('tb-hide')}</span><span class="win-help-nav-label">${L('Скрыть', 'Hide')}</span></button>
        <button class="win-help-btn" data-action="back"><span class="win-help-btn-icon">${icon('tb-back')}</span><span>${L('Назад', 'Back')}</span></button>
        <button class="win-help-btn" data-action="forward"><span class="win-help-btn-icon">${icon('tb-forward')}</span><span>${L('Вперед', 'Forward')}</span></button>
        <button class="win-help-btn" data-action="home"><span class="win-help-btn-icon">${icon('tb-home')}</span><span>${L('Домой', 'Home')}</span></button>
        <button class="win-help-btn" data-action="print"><span class="win-help-btn-icon">${icon('tb-print')}</span><span>${L('Печать', 'Print')}</span></button>
      </div>
      <div class="win-help-body">
        <div class="win-help-sidebar">
          <div class="win-help-tabs">
            <div class="win-help-tab active" data-tab="contents">${L('Содержание', 'Contents')}</div>
            <div class="win-help-tab" data-tab="index">${L('Указатель', 'Index')}</div>
            <div class="win-help-tab" data-tab="search">${L('Поиск', 'Search')}</div>
          </div>
          <div class="win-help-panel active" data-panel="contents">
            <div class="win-help-list win-help-tree help-topics-list">
              ${books.map(book => `
                <div class="win-help-book${book === startBook ? ' is-open' : ''}" data-book="${book.id}">
                  <div class="win-help-book-title"><span class="win-help-item-icon">${icon(book === startBook ? 'help-book-open' : 'help-book')}</span><span class="win-help-item-text">${book.title}</span></div>
                  <div class="win-help-book-pages">
                    ${book.topics.map(id => `<div class="win-help-topic-item" data-id="${id}"><span class="win-help-item-icon">${icon('help-page')}</span><span class="win-help-item-text">${titles[id]}</span></div>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="win-help-panel" data-panel="index">
            <label class="win-help-filter-label">${L('Введите ключевое слово для поиска:', 'Type in the keyword to find:')}</label>
            <input type="text" class="win-help-filter-input help-index-input">
            <div class="win-help-list help-index-list">
              ${indexItems.map(item => `<div class="win-help-topic-item" data-id="${item.topicId}" data-term="${item.term.toLowerCase()}"><span class="win-help-item-text">${item.term}</span></div>`).join('')}
            </div>
            <div class="win-help-panel-buttons"><button class="win-btn help-index-show">${L('Показать', 'Display')}</button></div>
          </div>
          <div class="win-help-panel" data-panel="search">
            <label class="win-help-filter-label">${L('Введите слово для поиска:', 'Type in the word(s) to search for:')}</label>
            <div class="win-help-search-row">
              <input type="text" class="win-help-filter-input help-search-input">
              <button class="win-btn help-search-btn">${L('Разделы', 'List Topics')}</button>
            </div>
            <label class="win-help-filter-label">${L('Выберите раздел:', 'Select topic to display:')}</label>
            <div class="win-help-list help-search-list"></div>
            <div class="win-help-panel-buttons"><button class="win-btn help-search-show">${L('Показать', 'Display')}</button></div>
          </div>
        </div>
        <div class="win-help-viewer help-content-pane"></div>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_help_dialog',
      title: L('Справка Win', 'Win Help'),
      icon: 'help',
      width: 660,
      height: 480,
      minWidth: 440,
      minHeight: 300,
      resizable: true,
      minimizable: true,
      maximizable: true,
      isDialog: false,
      content
    });

    const el = dialog.element;
    const contentPane = el.querySelector('.help-content-pane');
    const sidebar = el.querySelector('.win-help-sidebar');
    const navLabel = el.querySelector('.win-help-nav-label');
    const btnBack = el.querySelector('[data-action="back"]');
    const btnForward = el.querySelector('[data-action="forward"]');
    const btnToggleNav = el.querySelector('[data-action="toggle-nav"]');

    const launchers = {
      open_run: () => this.openRunDialog(),
      winver: () => this.openAboutWindows(),
      explorer: () => window.appExplorer && window.appExplorer.open(['My Computer']),
      wordpad: () => window.appWordPad && window.appWordPad.open(),
      netscape: () => window.appNetscape && window.appNetscape.open(),
      dialup: () => window.appDialUp && window.appDialUp.open(),
      ie: () => window.appIE && window.appIE.open(),
      imaging: () => window.appImageViewer && window.appImageViewer.open(),
      'taskbar-props': () => window.appTaskbarProps && window.appTaskbarProps.open(),
      find: () => window.appFind && window.appFind.open(),
      shutdown: () => window.appShutdown && window.appShutdown.openDialog(),
      'bios-setup': () => window.appBIOS && window.appBIOS.rebootToSetup(),
      winrar: () => window.appWinRAR && window.appWinRAR.open(),
      neko: () => window.appNeko && window.appNeko.toggle(),
      fasttracker: () => window.appFastTracker && window.appFastTracker.open()
    };

    let history = [];
    let historyIdx = -1;

    const updateNavButtons = () => {
      if (btnBack) btnBack.disabled = historyIdx <= 0;
      if (btnForward) btnForward.disabled = historyIdx >= history.length - 1;
    };

    const setBookOpen = (bookEl, open) => {
      bookEl.classList.toggle('is-open', open);
      const iconEl = bookEl.querySelector('.win-help-book-title .win-help-item-icon');
      if (iconEl) iconEl.innerHTML = icon(open ? 'help-book-open' : 'help-book');
    };

    const showTopic = (id, addHistory = true) => {
      const topic = helpTopics.find(tp => tp.id === id) || helpTopics[0];
      el.querySelectorAll('.win-help-topic-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === topic.id);
      });
      const book = books.find(b => b.topics.includes(topic.id));
      const bookEl = book ? el.querySelector(`.win-help-book[data-book="${book.id}"]`) : null;
      if (bookEl && !bookEl.classList.contains('is-open')) setBookOpen(bookEl, true);

      contentPane.innerHTML = topic.content;
      contentPane.scrollTop = 0;

      if (addHistory && history[historyIdx] !== topic.id) {
        history = history.slice(0, historyIdx + 1);
        history.push(topic.id);
        historyIdx = history.length - 1;
      }
      updateNavButtons();

      contentPane.querySelectorAll('.win-help-shortcut').forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.run;
          if (launchers[target]) launchers[target]();
          else this.executeRunCommand(target);
        });
      });
      contentPane.querySelectorAll('.win-help-link[data-topic]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          showTopic(link.dataset.topic);
        });
      });
    };

    const tabs = el.querySelectorAll('.win-help-tab');
    const panels = el.querySelectorAll('.win-help-panel');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(tb => tb.classList.toggle('active', tb === tab));
        panels.forEach(p => p.classList.toggle('active', p.dataset.panel === tab.dataset.tab));
      });
    });

    el.querySelector('.help-topics-list').addEventListener('click', (e) => {
      const title = e.target.closest('.win-help-book-title');
      if (title) {
        const bookEl = title.parentElement;
        setBookOpen(bookEl, !bookEl.classList.contains('is-open'));
        return;
      }
      const item = e.target.closest('.win-help-topic-item');
      if (item && item.dataset.id) showTopic(item.dataset.id);
    });

    const selectInList = (list, item) => {
      list.querySelectorAll('.win-help-topic-item').forEach(i => i.classList.toggle('picked', i === item));
    };
    const showPicked = (list) => {
      const picked = list.querySelector('.win-help-topic-item.picked');
      if (picked) showTopic(picked.dataset.id);
    };

    const indexInput = el.querySelector('.help-index-input');
    const indexList = el.querySelector('.help-index-list');
    if (indexInput && indexList) {
      indexInput.addEventListener('input', () => {
        const q = indexInput.value.trim().toLowerCase();
        let first = null;
        indexList.querySelectorAll('.win-help-topic-item').forEach(item => {
          const match = !q || (item.dataset.term || '').startsWith(q) || (item.dataset.term || '').includes(q);
          item.style.display = match ? 'flex' : 'none';
          if (match && !first) first = item;
        });
        selectInList(indexList, q ? first : null);
      });
      indexInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') showPicked(indexList);
      });
      indexList.addEventListener('click', (e) => {
        const item = e.target.closest('.win-help-topic-item');
        if (item) selectInList(indexList, item);
      });
      indexList.addEventListener('dblclick', (e) => {
        const item = e.target.closest('.win-help-topic-item');
        if (item) showTopic(item.dataset.id);
      });
      el.querySelector('.help-index-show').addEventListener('click', () => showPicked(indexList));
    }

    const searchInput = el.querySelector('.help-search-input');
    const searchList = el.querySelector('.help-search-list');
    const performSearch = () => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) {
        searchList.innerHTML = '';
        return;
      }
      const results = helpTopics.filter(tp => tp.title.toLowerCase().includes(q) || tp.keywords.toLowerCase().includes(q) || tp.content.replace(/<[^>]*>/g, ' ').toLowerCase().includes(q));
      searchList.innerHTML = results.length
        ? results.map(tp => `<div class="win-help-topic-item" data-id="${tp.id}"><span class="win-help-item-icon">${icon('help-page')}</span><span class="win-help-item-text">${tp.title}</span></div>`).join('')
        : `<div class="win-help-empty">${L('Разделы не найдены.', 'No topics found.')}</div>`;
    };
    el.querySelector('.help-search-btn').addEventListener('click', performSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch();
    });
    searchList.addEventListener('click', (e) => {
      const item = e.target.closest('.win-help-topic-item');
      if (item) selectInList(searchList, item);
    });
    searchList.addEventListener('dblclick', (e) => {
      const item = e.target.closest('.win-help-topic-item');
      if (item) showTopic(item.dataset.id);
    });
    el.querySelector('.help-search-show').addEventListener('click', () => showPicked(searchList));

    btnToggleNav.addEventListener('click', () => {
      const hidden = sidebar.classList.toggle('is-hidden');
      navLabel.textContent = hidden ? L('Показать', 'Show') : L('Скрыть', 'Hide');
      btnToggleNav.querySelector('.win-help-btn-icon').innerHTML = icon(hidden ? 'tb-show' : 'tb-hide');
    });
    btnBack.addEventListener('click', () => {
      if (historyIdx > 0) {
        historyIdx--;
        showTopic(history[historyIdx], false);
      }
    });
    btnForward.addEventListener('click', () => {
      if (historyIdx < history.length - 1) {
        historyIdx++;
        showTopic(history[historyIdx], false);
      }
    });
    el.querySelector('[data-action="home"]').addEventListener('click', () => showTopic('welcome'));
    el.querySelector('[data-action="print"]').addEventListener('click', () => window.print());

    showTopic(startTopic);
    return dialog;
  }

  openRunDialog() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '100%';

    let mru = null;
    try {
      mru = JSON.parse(localStorage.getItem('win98_run_mru') || 'null');
    } catch (e) {
      mru = null;
    }
    if (!Array.isArray(mru)) {
      mru = ['notepad', 'calc', 'msconfig', 'dxdiag', 'control', 'command', 'sndvol32', 'sysedit', 'charmap', 'scandisk'];
    }

    content.innerHTML = `
      <div class="win-dialog-message-row" style="align-items:flex-start;">
        <div class="win-dialog-icon">${Icons['run']}</div>
        <div style="font-size:11px; line-height:1.35;">
          ${t('run.desc')}
        </div>
      </div>

      <div class="win-label-row" style="margin-top:10px; align-items:center;">
        <label style="width:45px;">${t('run.openLabel')}</label>
        <div class="win-combobox" style="flex:1;">
          <input type="text" class="win-combobox-input run-input" value="${mru[0] || ''}">
          <button class="win-combobox-btn" id="run-combo-arrow"></button>
          <div class="win-combobox-dropdown" id="run-combo-list">
            ${mru.map(item => `<div class="win-combobox-item" data-val="${item}"><span class="icon-small" style="width:16px; height:16px; display:inline-flex; flex-shrink:0;">${Icons['programs']}</span><span>${item}</span></div>`).join('')}
          </div>
        </div>
      </div>

      <div class="win-dialog-buttons" style="margin-top:14px;">
        <button class="win-btn btn-run-ok" style="font-weight:bold;">${t('btn.ok')}</button>
        <button class="win-btn btn-run-cancel">${t('btn.cancel')}</button>
        <button class="win-btn btn-run-browse">${t('btn.browse')}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_run_dialog',
      title: t('run.title'),
      icon: 'run',
      width: 410,
      height: 180,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = dialog.element;
    const input = el.querySelector('.run-input');
    const comboArrow = el.querySelector('#run-combo-arrow');
    const comboList = el.querySelector('#run-combo-list');
    const btnOk = el.querySelector('.btn-run-ok');
    const btnCancel = el.querySelector('.btn-run-cancel');
    const btnBrowse = el.querySelector('.btn-run-browse');

    setTimeout(() => {
      input.focus();
      input.select();
    }, 50);

    comboArrow.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !comboList.classList.contains('open');
      comboList.classList.remove('drop-up');
      comboList.classList.toggle('open', willOpen);
      if (willOpen) {
        const comboBox = comboArrow.closest('.win-combobox');
        const desktop = document.getElementById('desktop');
        if (comboBox && comboBox.getBoundingClientRect) {
          const rect = comboBox.getBoundingClientRect();
          const limit = desktop && desktop.getBoundingClientRect ? desktop.getBoundingClientRect().bottom : (window.innerHeight || 768) - 28;
          if (rect.bottom + 142 > limit && rect.top > 142) {
            comboList.classList.add('drop-up');
          }
        }
      }
    });

    comboList.querySelectorAll('.win-combobox-item').forEach(item => {
      item.addEventListener('click', () => {
        input.value = item.dataset.val;
        comboList.classList.remove('open');
        input.focus();
      });
    });

    document.addEventListener('click', (e) => {
      if (!el.contains(e.target)) {
        comboList.classList.remove('open');
      }
    });

    const saveToMRU = (cmdStr) => {
      try {
        const clean = cmdStr.trim();
        if (!clean) return;
        mru = mru.filter(x => x.toLowerCase() !== clean.toLowerCase());
        mru.unshift(clean);
        if (mru.length > 15) mru = mru.slice(0, 15);
        localStorage.setItem('win98_run_mru', JSON.stringify(mru));
      } catch (e) {
        console.warn('saveToMRU error:', e);
      }
    };

    const execute = () => {
      const fullVal = input.value.trim();
      if (!fullVal) {
        window.winManager.closeWindow('app_run_dialog');
        return;
      }
      window.winManager.closeWindow('app_run_dialog');
      saveToMRU(fullVal);
      this.executeRunCommand(fullVal);
    };

    btnOk.addEventListener('click', execute);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') execute();
      if (e.key === 'Escape') comboList.classList.remove('open');
    });

    btnCancel.addEventListener('click', () => {
      window.winManager.closeWindow('app_run_dialog');
    });

    btnBrowse.addEventListener('click', () => {
      if (window.appExplorer) window.appExplorer.open(['My Computer', 'C:', 'Program Files']);
      window.winManager.closeWindow('app_run_dialog');
    });
  }

  executeRunCommand(fullVal) {
    if (!fullVal || !fullVal.trim()) return;
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const parts = fullVal.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const val = fullVal.trim().toLowerCase();
    const args = parts.slice(1);

    if (cmd === 'control') {
      const target = args[0] ? args[0].toLowerCase() : '';
      if (target === 'desk.cpl' || target === 'desktop' || target === 'display') {
        this.openDisplayProperties();
      } else if (target === 'intl.cpl' || target === 'regional') {
        this.openRegionalSettings();
      } else if (target === 'timedate.cpl' || target === 'time' || target === 'date') {
        if (window.appCPanel) window.appCPanel.openTimeDateProperties();
      } else if (target === 'sysdm.cpl' || target === 'system') {
        if (window.appCPanel) window.appCPanel.openSystemProperties();
      } else if (target === 'main.cpl' || target === 'mouse') {
        if (window.appCPanel) window.appCPanel.openMouseProperties();
      } else if (target === 'mmsys.cpl' || target === 'mmsys' || target === 'sounds') {
        if (window.appCPanel) window.appCPanel.openMultimediaProperties();
      } else if (target === 'appwiz.cpl' || target === 'appwiz') {
        if (window.appCPanel) window.appCPanel.openAppWizProperties();
      } else if (target === 'inetcpl.cpl' || target === 'internet') {
        if (window.appCPanel) window.appCPanel.openInternetProperties();
      } else if (target === 'powercfg.cpl' || target === 'powercfg' || target === 'power') {
        if (window.appCPanel) window.appCPanel.openPowerProperties();
      } else if (target === 'taskbar' || target === 'startmenu') {
        if (window.appTaskbarProps) window.appTaskbarProps.open();
      } else {
        if (window.appExplorer) window.appExplorer.open(['My Computer', 'Control Panel']);
      }
      return;
    }

    if (cmd === 'desk.cpl' || cmd === 'desk') {
      this.openDisplayProperties();
      return;
    }
    if (cmd === 'intl.cpl' || cmd === 'intl') {
      this.openRegionalSettings();
      return;
    }
    if (cmd === 'timedate.cpl' || cmd === 'timedate' || cmd === 'time' || cmd === 'date') {
      if (window.appCPanel) window.appCPanel.openTimeDateProperties();
      return;
    }
    if (cmd === 'sysdm.cpl' || cmd === 'sysdm') {
      if (window.appCPanel) window.appCPanel.openSystemProperties();
      return;
    }
    if (cmd === 'main.cpl' || cmd === 'mouse') {
      if (window.appCPanel) window.appCPanel.openMouseProperties();
      return;
    }
    if (cmd === 'mmsys.cpl' || cmd === 'mmsys' || cmd === 'sounds') {
      if (window.appCPanel) window.appCPanel.openMultimediaProperties();
      return;
    }
    if (cmd === 'appwiz.cpl' || cmd === 'appwiz') {
      if (window.appCPanel) window.appCPanel.openAppWizProperties();
      return;
    }
    if (cmd === 'inetcpl.cpl' || cmd === 'inetcpl') {
      if (window.appCPanel) window.appCPanel.openInternetProperties();
      return;
    }
    if (cmd === 'powercfg.cpl' || cmd === 'powercfg') {
      if (window.appCPanel) window.appCPanel.openPowerProperties();
      return;
    }
    if (cmd === 'sounds' || cmd === 'sounds.cpl') {
      if (window.appCPanel && window.appCPanel.openSoundsProperties) window.appCPanel.openSoundsProperties();
      return;
    }
    if (cmd === 'keyboard' || cmd === 'keyboard.cpl') {
      if (window.appCPanel && window.appCPanel.openKeyboardProperties) window.appCPanel.openKeyboardProperties();
      return;
    }
    if (cmd === 'netcpl.cpl' || cmd === 'network') {
      if (window.appCPanel && window.appCPanel.openNetworkProperties) window.appCPanel.openNetworkProperties();
      return;
    }
    if (cmd === 'access.cpl' || cmd === 'accessibility') {
      if (window.appCPanel && window.appCPanel.openAccessibilityProperties) window.appCPanel.openAccessibilityProperties();
      return;
    }
    if (cmd === 'joy.cpl' || cmd === 'joystick') {
      if (window.appCPanel && window.appCPanel.openJoystickProperties) window.appCPanel.openJoystickProperties();
      return;
    }
    if (cmd === 'modem.cpl' || cmd === 'modems' || cmd === 'modem') {
      if (window.appCPanel && window.appCPanel.openModemProperties) window.appCPanel.openModemProperties();
      return;
    }
    if (cmd === 'password.cpl' || cmd === 'passwords') {
      if (window.appCPanel && window.appCPanel.openPasswordsProperties) window.appCPanel.openPasswordsProperties();
      return;
    }
    if (cmd === 'users' || cmd === 'users.cpl') {
      if (window.appCPanel && window.appCPanel.openUsersProperties) window.appCPanel.openUsersProperties();
      return;
    }
    if (cmd === 'printers') {
      if (window.appExplorer) window.appExplorer.open(['My Computer', 'Printers']);
      return;
    }
    if (cmd === 'fonts' || cmd === 'fontview' || cmd === 'fontview.exe') {
      if (window.appExplorer) window.appExplorer.open(['My Computer', 'C:', 'WINDOWS', 'Fonts']);
      return;
    }
    if (cmd === 'welcome' || cmd === 'welcome.exe') {
      this.openWelcomeApp();
      return;
    }
    if (cmd === 'wupdmgr' || cmd === 'wupdmgr.exe' || cmd === 'windowsupdate' || cmd === 'winupdate') {
      if (window.appIE) window.appIE.open('http://windowsupdate.microslop.com');
      return;
    }
    if (cmd === 'winipcfg' || cmd === 'winipcfg.exe' || cmd === 'ipconfig') {
      if (window.appSysTools && window.appSysTools.openWinIpCfg) window.appSysTools.openWinIpCfg();
      return;
    }
    if (cmd === 'msinfo32' || cmd === 'msinfo32.exe' || cmd === 'msinfo') {
      if (window.appSysTools && window.appSysTools.openMsInfo32) window.appSysTools.openMsInfo32();
      return;
    }
    if (cmd === 'sfc' || cmd === 'sfc.exe') {
      if (window.appSysTools && window.appSysTools.openSfc) window.appSysTools.openSfc();
      return;
    }
    if (cmd === 'scanreg' || cmd === 'scanregw' || cmd === 'scanregw.exe' || cmd === 'scanreg.exe') {
      if (window.appSysTools && window.appSysTools.openScanReg) window.appSysTools.openScanReg();
      return;
    }
    if (cmd === 'drvspace' || cmd === 'drvspace.exe') {
      if (window.appSysTools && window.appSysTools.openDriveSpace) window.appSysTools.openDriveSpace();
      return;
    }
    if (cmd === 'mstask' || cmd === 'mstask.exe' || cmd === 'tasks') {
      if (window.appSysTools && window.appSysTools.openScheduledTasks) window.appSysTools.openScheduledTasks();
      return;
    }
    if (cmd === 'mshearts' || cmd === 'mshearts.exe' || cmd === 'hearts') {
      if (window.appHearts && window.appHearts.open) window.appHearts.open();
      return;
    }

    if (cmd === 'msconfig' || cmd === 'msconfig.exe') {
      if (window.appSysTools) window.appSysTools.openMSConfig();
      return;
    }
    if (cmd === 'dxdiag' || cmd === 'dxdiag.exe') {
      if (window.appSysTools) window.appSysTools.openDxDiag();
      return;
    }
    if (cmd === 'sysedit' || cmd === 'sysedit.exe') {
      if (window.appSysTools) window.appSysTools.openSysEdit();
      return;
    }
    if (cmd === 'charmap' || cmd === 'charmap.exe') {
      if (window.appSysTools) window.appSysTools.openCharMap();
      return;
    }
    if (cmd === 'scandisk' || cmd === 'scandisk.exe') {
      if (window.appSysTools) window.appSysTools.openScanDisk();
      return;
    }
    if (cmd === 'sndvol32' || cmd === 'sndvol32.exe' || cmd === 'sndvol' || cmd === 'volume' || cmd === 'mixer') {
      if (window.appSysTools) window.appSysTools.openVolumeControl();
      return;
    }
    if (cmd === 'cleanmgr' || cmd === 'cleanmgr.exe') {
      if (window.appSysTools) window.appSysTools.openCleanMgr();
      return;
    }

    if (cmd === 'cmd' || cmd === 'command' || cmd === 'command.com') {
      if (window.appSysTools) {
        window.appSysTools.openDosPromptWindow(args.join(' '));
      } else if (window.appShutdown) {
        window.appShutdown.triggerDosMode();
      }
      return;
    }
    if (cmd === 'dos') {
      if (window.appShutdown) window.appShutdown.triggerDosMode();
      return;
    }
    if (cmd === 'ping') {
      if (window.appSysTools) window.appSysTools.openDosPromptWindow(fullVal);
      return;
    }
    if (cmd === 'telnet') {
      if (window.appSysTools) window.appSysTools.openDosPromptWindow(fullVal);
      return;
    }

    if (cmd === 'calc' || cmd === 'calculator' || cmd === 'calc.exe') {
      if (window.appCalculator) window.appCalculator.open();
      return;
    }
    if (cmd === 'notepad' || cmd === 'notepad.exe') {
      if (window.appNotepad) window.appNotepad.open(args[0] || null);
      return;
    }
    if (cmd === 'paint' || cmd === 'mspaint' || cmd === 'pbrush' || cmd === 'mspaint.exe') {
      if (window.appPaint) window.appPaint.open(args[0] || null);
      return;
    }
    if (cmd === 'mine' || cmd === 'minesweeper' || cmd === 'winmine' || cmd === 'winmine.exe') {
      if (window.appMinesweeper) window.appMinesweeper.open();
      return;
    }
    if (cmd === 'sol' || cmd === 'solitaire' || cmd === 'sol.exe') {
      if (window.appSolitaire) window.appSolitaire.open();
      return;
    }
    if (cmd === 'pinball' || cmd === 'pinball.exe') {
      if (window.appPinball) window.appPinball.open();
      return;
    }
    if (cmd === 'steam' || cmd === 'steam.exe') {
      if (window.gameManager) window.gameManager.showInSteam();
      return;
    }
    if (cmd === 'winamp' || cmd === 'winamp.exe') {
      if (window.appWinamp) window.appWinamp.open();
      return;
    }
    if (cmd === 'excel' || cmd === 'excel.exe') {
      if (window.appExcel) window.appExcel.open();
      return;
    }
    if (cmd === 'photoshop' || cmd === 'ps' || cmd === 'photoshop.exe') {
      if (window.appPhotoshop) window.appPhotoshop.open();
      return;
    }
    if (cmd === 'wincmd' || cmd === 'totalcmd' || cmd === 'wincmd.exe' || cmd === 'nc') {
      if (window.appWinCommander) window.appWinCommander.open();
      return;
    }
    if (cmd === 'kodakimg' || cmd === 'imaging' || cmd === 'kodakimg.exe') {
      if (window.appImageViewer) window.appImageViewer.open();
      return;
    }
    if (cmd === 'mplayer' || cmd === 'mplayer.exe' || cmd === 'videoplayer' || cmd === 'demo_clip' || cmd === 'demo_clip.avi') {
      if (window.appVideoPlayer) window.appVideoPlayer.open('DEMO_CLIP.AVI', null, true);
      return;
    }
    if (cmd === 'sndrec32' || cmd === 'sndrec32.exe' || cmd === 'sound' || cmd === 'recorder') {
      if (window.appSoundRecorder) window.appSoundRecorder.open();
      return;
    }
    if (cmd === 'defrag' || cmd === 'defrag.exe') {
      if (window.appDefrag) window.appDefrag.open();
      return;
    }
    if (cmd === 'msbackup' || cmd === 'msbackup.exe' || cmd === 'backup' || cmd === 'архивация') {
      if (window.appBackup) window.appBackup.open('backup');
      return;
    }
    if (cmd === 'bugreport' || cmd === 'bugreport.exe') {
      if (window.appBugReport) {
        if (args[0] && args[0].toLowerCase() === '/list') window.appBugReport.openList();
        else window.appBugReport.open();
      }
      return;
    }
    if (cmd === 'restore' || cmd === 'восстановление') {
      if (window.appBackup) window.appBackup.open('restore');
      return;
    }
    if (cmd === 'icq' || cmd === 'icq.exe') {
      if (window.appICQ) window.appICQ.open();
      return;
    }
    if (cmd === 'outlook' || cmd === 'mail' || cmd === 'msimn.exe') {
      if (window.appOutlook) window.appOutlook.open();
      return;
    }
    if (cmd === 'regedit' || cmd === 'regedit.exe' || cmd === 'regedt32') {
      if (window.appRegEdit) window.appRegEdit.open();
      return;
    }
    if (cmd === 'taskmgr' || cmd === 'taskman' || cmd === 'taskman.exe') {
      if (window.appTaskManager) window.appTaskManager.open();
      return;
    }
    if (cmd === 'qbasic' || cmd === 'qbasic.exe') {
      if (window.appQBasic) window.appQBasic.open(args[0] || null);
      return;
    }
    if (cmd === 'mon_test' || cmd === 'mon_test.exe' || cmd === 'montest' || cmd === 'nokia') {
      if (window.appMonTest) window.appMonTest.open();
      return;
    }
    if (cmd === 'cdex' || cmd === 'cdex014' || cmd === 'cdex014.exe' || cmd === 'cdex.exe') {
      if (window.appCDex) window.appCDex.open();
      return;
    }
    if (cmd === 'wintune' || cmd === 'wintune.exe' || cmd === 'wintn975_616' || cmd === 'wintn975_616.exe') {
      if (window.appWintune) window.appWintune.open('wintune');
      return;
    }
    if (cmd === 'clibench' || cmd === 'clibench.exe') {
      if (window.appWintune) window.appWintune.open('clibench');
      return;
    }
    if (cmd === 'cdplayer' || cmd === 'cdplayer.exe') {
      if (window.appCDPlayer) window.appCDPlayer.open();
      return;
    }
    if (cmd === 'sysmon' || cmd === 'sysmon.exe') {
      if (window.appSysMon) window.appSysMon.open();
      return;
    }
    if (cmd === 'hypertrm' || cmd === 'hypertrm.exe' || cmd === 'hyperterminal' || cmd === 'bbs') {
      if (window.appHyperTerminal) window.appHyperTerminal.open(args[0] || null);
      return;
    }
    if (cmd === 'clipbrd' || cmd === 'clipbrd.exe' || cmd === 'clipbook' || cmd === 'clipboard') {
      if (window.appClipboardViewer) window.appClipboardViewer.open(args[0] || null);
      return;
    }
    if (cmd === 'mirc' || cmd === 'mirc32' || cmd === 'mirc32.exe' || cmd === 'irc') {
      if (window.appMIRC) window.appMIRC.open();
      return;
    }
    if (cmd === 'ft2' || cmd === 'ft2.exe' || cmd === 'fasttracker' || cmd === 'tracker') {
      if (window.appFastTracker) window.appFastTracker.open(args[0] || null);
      return;
    }
    if (cmd === 'acrobat' || cmd === 'acrobat.exe' || cmd === 'acrord32' || cmd === 'ar32e301' || cmd === 'ar32e301.exe') {
      if (window.appAcrobat) window.appAcrobat.open(args[0] || null);
      return;
    }
    if (cmd === 'acdsee' || cmd === 'acdsee.exe' || cmd === 'acdc3223' || cmd === 'acdc3223.exe') {
      if (window.appACDSee) window.appACDSee.open(args[0] || null);
      return;
    }
    if (cmd === 'emuland' || cmd === 'emuland98' || cmd === 'emuland98.exe' || cmd === 'emulator' || cmd === 'nesticle' || cmd === 'nesticle.exe' || cmd === 'genecyst' || cmd === 'genecyst.exe' || cmd === 'zsnes' || cmd === 'zsnesw' || cmd === 'zsnesw.exe' || cmd === 'vgb' || cmd === 'vgb98' || cmd === 'vgb98.exe') {
      if (window.appEmulator) {
        const coreMap = { 'nesticle': 'nes', 'nesticle.exe': 'nes', 'genecyst': 'sega', 'genecyst.exe': 'sega', 'zsnes': 'snes', 'zsnesw': 'snes', 'zsnesw.exe': 'snes', 'vgb': 'gb', 'vgb98': 'gb', 'vgb98.exe': 'gb' };
        window.appEmulator.open(args[0] || coreMap[cmd] || null);
      }
      return;
    }
    if (cmd === 'wordpad' || cmd === 'wordpad.exe' || cmd === 'write' || cmd === 'write.exe') {
      if (window.appWordPad) window.appWordPad.open(args[0] || null);
      return;
    }
    if (cmd === 'winrar' || cmd === 'winrar.exe' || cmd === 'rar') {
      if (window.appWinRAR) window.appWinRAR.open(args[0] || null);
      return;
    }
    if (cmd === 'neko' || cmd === 'neko.exe' || cmd === 'neko98') {
      if (window.appNeko) window.appNeko.toggle();
      return;
    }
    if (cmd === 'freecell' || cmd === 'freecell.exe') {
      if (window.appFreeCell) window.appFreeCell.open();
      return;
    }
    if (cmd === 'netscape' || cmd === 'netscape.exe') {
      if (window.appNetscape) window.appNetscape.open(args[0] || null);
      return;
    }
    if (cmd === 'dialup' || cmd === 'rnaapp' || cmd === 'rnaapp.exe') {
      if (window.appDialUp) window.appDialUp.open();
      return;
    }
    if (cmd === 'find') {
      if (window.appFind) window.appFind.open();
      return;
    }
    if (cmd === 'clippy' || cmd === 'clippy.exe' || cmd === 'clippit' || cmd === 'скрепыш') {
      if (window.appClippy) window.appClippy.launch('run');
      return;
    }
    if (cmd === 'bsod') {
      if (window.appBSOD) window.appBSOD.trigger();
      return;
    }
    if (cmd === 'winver' || cmd === 'winver.exe' || cmd === 'about') {
      this.openAboutWindows();
      return;
    }
    if (cmd === 'help' || cmd === 'winhelp' || cmd === 'hh' || cmd === 'hh.exe') {
      this.openHelp();
      return;
    }

    const isRu = (window.i18n ? window.i18n.currentLang : 'ru') === 'ru';
    if (cmd === 'wolf' || cmd === 'wolf3d' || cmd === 'wolfenstein') {
      if (window.gameManager && !window.gameManager.isInstalled('wolf3d')) {
        window.winManager.openDialog({
          title: 'Wolfenstein 3D',
          icon: 'error',
          message: isRu
            ? 'Игра Wolfenstein 3D не установлена.<br>Вы можете получить её в <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game Wolfenstein 3D is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
      } else if (window.appWolf3D) window.appWolf3D.open();
      return;
    }
    if (cmd === 'quest' || cmd === 'scumm' || cmd === 'monkey' || cmd === 'lucas') {
      if (window.gameManager && !window.gameManager.isInstalled('quest_demo')) {
        window.gameManager.showOnCd('quest_demo');
      } else if (window.appScummQuest) window.appScummQuest.open();
      return;
    }
    if (cmd === 'stalker' || cmd === 'zone' || cmd === 'chernobyl') {
      if (window.gameManager && !window.gameManager.isInstalled('stalker')) {
        window.winManager.openDialog({
          title: 'S.T.A.L.K.E.R.',
          icon: 'error',
          message: isRu
            ? 'Игра S.T.A.L.K.E.R. не установлена.<br>Вы можете получить её в <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game S.T.A.L.K.E.R. is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
      } else if (window.appStalker) window.appStalker.open();
      return;
    }
    if (cmd === 'fallout' || cmd === 'fallout.exe' || cmd === 'falloutw' || cmd === 'falloutw.exe' || cmd === 'fallout1' || val === 'fallout 1' || cmd === 'фоллаут') {
      if (window.gameManager && !window.gameManager.isInstalled('fallout')) {
        window.winManager.openDialog({
          title: 'Fallout',
          icon: 'error',
          message: isRu
            ? 'Игра Fallout не установлена.<br>Вы можете купить её в <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'fallout\');">Steam</a>'
            : 'Game Fallout is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'fallout\');">Steam</a>'
        });
      } else if (window.appFallout) window.appFallout.open();
      return;
    }
    if (cmd === 'fallout2' || val === 'fallout 2' || cmd === 'fallout2.exe') {
      if (window.gameManager && !window.gameManager.isInstalled('fallout98_demo')) {
        window.gameManager.showOnCd('fallout98_demo');
      } else if (window.appFallout2) window.appFallout2.open();
      return;
    }
    if (cmd === 'burnout' || cmd === 'burnout.exe') {
      if (window.appBurnout) window.appBurnout.open();
      return;
    }
    if (cmd === 'doom' || cmd === 'doom.exe' || cmd === 'doom98') {
      if (window.gameManager && !window.gameManager.isInstalled('doom')) {
        window.winManager.openDialog({
          title: 'DOOM 98',
          icon: 'error',
          message: isRu
            ? 'Игра DOOM 98 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game DOOM 98 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
      } else if (window.appDoom) window.appDoom.open();
      return;
    }
    if (cmd === 'avatar' || cmd === 'avatar98' || cmd === 'silent' || cmd === 'silent.exe' || cmd === 'аватар') {
      if (window.gameManager && !window.gameManager.isInstalled('avatar98')) {
        window.winManager.openDialog({
          title: 'Аватар: Тихий цикл',
          icon: 'error',
          message: isRu ? 'Игра «Аватар: Тихий цикл» не установлена.' : 'Avatar: Silent Cycle is not installed.'
        });
      } else if (window.appAvatar98) window.appAvatar98.open();
      return;
    }
    if (cmd === 'dota' || cmd === 'dota.exe' || cmd === 'dota98' || cmd === 'dota 98' || cmd === 'dota2') {
      if (window.gameManager && !window.gameManager.isInstalled('dota')) {
        window.winManager.openDialog({
          title: 'Dota 98',
          icon: 'error',
          message: isRu
            ? 'Игра Dota 98 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game Dota 98 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
      } else if (window.appDota) window.appDota.open();
      return;
    }
    if (cmd === 'lol' || cmd === 'lol.exe' || cmd === 'league' || cmd === 'league of legends') {
      if (window.gameManager && !window.gameManager.isInstalled('lol')) {
        window.winManager.openDialog({
          title: 'League of Legends 98',
          icon: 'error',
          message: isRu
            ? 'Игра League of Legends 98 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game League of Legends 98 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
      } else if (window.appLoL) window.appLoL.open();
      return;
    }
    if (cmd === 'moh' || cmd === 'moh.exe' || cmd === 'moh98' || cmd === 'medal of honor' || cmd === 'medal of honor 98') {
      if (window.gameManager && !window.gameManager.isInstalled('moh98')) {
        window.winManager.openDialog({
          title: 'Medal of Honor 98',
          icon: 'error',
          message: isRu
            ? 'Игра Medal of Honor 98 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game Medal of Honor 98 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
      } else if (window.appMoh98) window.appMoh98.open();
      return;
    }
    if (cmd === 'tekken' || cmd === 'tekken3' || cmd === 'tekken3.exe' || cmd === 'tekken 3' || cmd === 'теккен' || cmd === 'теккен 3' || cmd === 'tk3') {
      if (window.gameManager && !window.gameManager.isInstalled('tekken98_demo')) {
        window.gameManager.showOnCd('tekken98_demo');
      } else if (window.appTekken3) window.appTekken3.open();
      return;
    }
    if (cmd === 'overwatch' || cmd === 'overwatch.exe' || cmd === 'ow' || cmd === 'ow98' || cmd === 'overwatch 98' || cmd === 'овервотч' || cmd === 'овервоч') {
      if (window.gameManager && !window.gameManager.isInstalled('ow98')) {
        window.winManager.openDialog({
          title: 'Overwatch 98',
          icon: 'error',
          message: isRu
            ? 'Игра Overwatch 98 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'ow98\');">Steam</a>'
            : 'Game Overwatch 98 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'ow98\');">Steam</a>'
        });
      } else if (window.appOw98) window.appOw98.open();
      return;
    }
    if (cmd === 'sammax106' || cmd === 'sammax6' || cmd === 'sammax6.exe' || cmd === 'sam & max 106' || cmd === 'sam and max 106' || cmd === 'bright side of the moon' || cmd === 'сэм и макс 106' || cmd === 'светлая сторона луны') {
      if (window.gameManager && !window.gameManager.isInstalled('sammax106')) {
        window.winManager.openDialog({
          title: 'Sam & Max: Bright Side of the Moon',
          icon: 'error',
          message: isRu
            ? 'Игра Sam &amp; Max: Bright Side of the Moon не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sammax106\');">Steam</a>'
            : 'Game Sam &amp; Max: Bright Side of the Moon is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sammax106\');">Steam</a>'
        });
      } else if (window.appSamMax106) window.appSamMax106.open();
      return;
    }
    if (cmd === 'bttf' || cmd === 'bttf.exe' || cmd === 'back to the future' || cmd === 'назад в будущее' || cmd === 'самое время') {
      if (window.gameManager && !window.gameManager.isInstalled('bttf')) {
        window.winManager.openDialog({
          title: 'Back to the Future: The Game',
          icon: 'error',
          message: isRu
            ? 'Игра Back to the Future: The Game не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'bttf\');">Steam</a>'
            : 'Game Back to the Future: The Game is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'bttf\');">Steam</a>'
        });
      } else if (window.appBTTF) window.appBTTF.open();
      return;
    }
    if (cmd === 'sammax202' || cmd === 'sammax22' || cmd === 'sammax22.exe' || cmd === 'sam & max 202' || cmd === 'sam and max 202' || cmd === 'moai better blues' || cmd === 'сэм и макс 202' || cmd === 'блюз истуканов') {
      if (window.gameManager && !window.gameManager.isInstalled('sammax202_demo')) {
        window.gameManager.showOnCd('sammax202_demo');
      } else if (window.appSamMax202) window.appSamMax202.open();
      return;
    }
    if (cmd === 'sammax201' || cmd === 'sammax21' || cmd === 'sammax21.exe' || cmd === 'sam & max 201' || cmd === 'sam and max 201' || cmd === 'ice station santa' || cmd === 'сэм и макс 201' || cmd === 'полярная станция санта') {
      if (window.gameManager && !window.gameManager.isInstalled('sammax201')) {
        window.winManager.openDialog({
          title: 'Sam & Max: Ice Station Santa',
          icon: 'error',
          message: isRu
            ? 'Игра Sam &amp; Max: Ice Station Santa не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sammax201\');">Steam</a>'
            : 'Game Sam &amp; Max: Ice Station Santa is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sammax201\');">Steam</a>'
        });
      } else if (window.appSamMax201) window.appSamMax201.open();
      return;
    }
    if (cmd === 'sammax105' || cmd === 'sammax5' || cmd === 'sammax5.exe' || cmd === 'sam & max 105' || cmd === 'sam and max 105' || cmd === 'reality 2.0' || cmd === 'сэм и макс 105' || cmd === 'реальность 2.0') {
      if (window.gameManager && !window.gameManager.isInstalled('sammax105')) {
        window.winManager.openDialog({
          title: 'Sam & Max: Reality 2.0',
          icon: 'error',
          message: isRu
            ? 'Игра Sam &amp; Max: Reality 2.0 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sammax105\');">Steam</a>'
            : 'Game Sam &amp; Max: Reality 2.0 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sammax105\');">Steam</a>'
        });
      } else if (window.appSamMax105) window.appSamMax105.open();
      return;
    }
    if (cmd === 'sammax104' || cmd === 'sammax4' || cmd === 'sammax4.exe' || cmd === 'sam & max 104' || cmd === 'sam and max 104' || cmd === 'abe lincoln must die' || cmd === 'abe lincoln must die!' || cmd === 'сэм и макс 104' || cmd === 'эйб линкольн должен умереть' || cmd === 'эйб линкольн должен умереть!') {
      if (window.gameManager && !window.gameManager.isInstalled('sammax104')) {
        window.winManager.openDialog({
          title: 'Sam & Max: Abe Lincoln Must Die!',
          icon: 'error',
          message: isRu
            ? 'Игра Sam &amp; Max: Abe Lincoln Must Die! не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sammax104\');">Steam</a>'
            : 'Game Sam &amp; Max: Abe Lincoln Must Die! is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sammax104\');">Steam</a>'
        });
      } else if (window.appSamMax104) window.appSamMax104.open();
      return;
    }
    if (cmd === 'sammax103' || cmd === 'sammax3' || cmd === 'sammax3.exe' || cmd === 'sam & max 103' || cmd === 'sam and max 103' || cmd === 'the mole the mob and the meatball' || cmd === 'mole mob meatball' || cmd === 'сэм и макс 103' || cmd === 'крот мафия и фрикаделька' || cmd === 'крот, мафия и фрикаделька') {
      if (window.gameManager && !window.gameManager.isInstalled('sammax103')) {
        window.winManager.openDialog({
          title: 'Sam & Max: The Mole, the Mob and the Meatball',
          icon: 'error',
          message: isRu
            ? 'Игра Sam &amp; Max: The Mole, the Mob and the Meatball не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sammax103\');">Steam</a>'
            : 'Game Sam &amp; Max: The Mole, the Mob and the Meatball is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sammax103\');">Steam</a>'
        });
      } else if (window.appSamMax103) window.appSamMax103.open();
      return;
    }
    if (cmd === 'sammax102' || cmd === 'sammax2' || cmd === 'sammax2.exe' || cmd === 'sam & max 102' || cmd === 'sam and max 102' || cmd === 'situation comedy' || cmd === 'situation: comedy' || cmd === 'сэм и макс 102' || cmd === 'ситуация комедия' || cmd === 'ситуация: комедия') {
      if (window.gameManager && !window.gameManager.isInstalled('sammax102')) {
        window.winManager.openDialog({
          title: 'Sam & Max: Situation: Comedy',
          icon: 'error',
          message: isRu
            ? 'Игра Sam &amp; Max: Situation: Comedy не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sammax102\');">Steam</a>'
            : 'Game Sam &amp; Max: Situation: Comedy is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sammax102\');">Steam</a>'
        });
      } else if (window.appSamMax102) window.appSamMax102.open();
      return;
    }
    if (cmd === 'sammax' || cmd === 'sammax.exe' || cmd === 'sam & max' || cmd === 'sam and max' || cmd === 'sam&max' || cmd === 'culture shock' || cmd === 'сэм и макс' || cmd === 'культурный шок') {
      if (window.gameManager && !window.gameManager.isInstalled('sammax')) {
        window.winManager.openDialog({
          title: 'Sam & Max: Culture Shock',
          icon: 'error',
          message: isRu
            ? 'Игра Sam &amp; Max: Culture Shock не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sammax\');">Steam</a>'
            : 'Game Sam &amp; Max: Culture Shock is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sammax\');">Steam</a>'
        });
      } else if (window.appSamMax) window.appSamMax.open();
      return;
    }
    if (cmd === 'quake3' || cmd === 'quake3.exe' || cmd === 'q3' || cmd === 'q3a' || cmd === 'quake 3' || cmd === 'quake iii' || cmd === 'quake iii arena' || cmd === 'квейк' || cmd === 'квейк 3') {
      if (window.gameManager && !window.gameManager.isInstalled('quake3')) {
        window.winManager.openDialog({
          title: 'Quake III Arena',
          icon: 'error',
          message: isRu
            ? 'Игра Quake III Arena не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'quake3\');">Steam</a>'
            : 'Game Quake III Arena is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'quake3\');">Steam</a>'
        });
      } else if (window.appQuake3) window.appQuake3.open();
      return;
    }
    if (cmd === 'diablo2' || cmd === 'diablo2.exe' || cmd === 'diablo ii' || cmd === 'diablo 2' || cmd === 'd2' || cmd === 'диабло 2' || cmd === 'диабло ii' || cmd === 'дьябло 2') {
      if (window.gameManager && !window.gameManager.isInstalled('diablo2')) {
        window.winManager.openDialog({
          title: 'Diablo II',
          icon: 'error',
          message: isRu
            ? 'Игра Diablo II не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'diablo2\');">Steam</a>'
            : 'Game Diablo II is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'diablo2\');">Steam</a>'
        });
      } else if (window.appDiablo2) window.appDiablo2.open();
      return;
    }
    if (cmd === 'xiii' || cmd === 'xiii.exe' || cmd === '13' || cmd === 'тринадцать' || cmd === 'тринадцатый') {
      if (window.gameManager && !window.gameManager.isInstalled('xiii_demo')) {
        window.gameManager.showOnCd('xiii_demo');
      } else if (window.appXiii) window.appXiii.open();
      return;
    }
    if (cmd === 'maxpayne' || cmd === 'maxpayne.exe' || cmd === 'max payne' || cmd === 'макс пейн' || cmd === 'max') {
      if (window.gameManager && !window.gameManager.isInstalled('maxpayne_demo')) {
        window.gameManager.showOnCd('maxpayne_demo');
      } else if (window.appMaxPayne) window.appMaxPayne.open();
      return;
    }
    if (cmd === 'legion' || cmd === 'arena' || cmd === 'arena.exe' || cmd === 'legion arena' || cmd === 'legionarena' || cmd === 'легионы рима' || cmd === 'легион' || cmd === 'арена') {
      if (window.gameManager && !window.gameManager.isInstalled('legion')) {
        window.winManager.openDialog({
          title: 'Legion Arena',
          icon: 'error',
          message: isRu
            ? 'Игра Legion Arena не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'legion\');">Steam</a>'
            : 'Game Legion Arena is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'legion\');">Steam</a>'
        });
      } else if (window.appLegion) window.appLegion.open();
      return;
    }
    if (cmd === 'falloutzp' || cmd === 'falloutzp.exe' || cmd === 'fallout zp' || cmd === 'запорожье' || cmd === 'new vegas' || val === 'fallout: запорожье' || val === 'fallout запорожье') {
      if (window.gameManager && !window.gameManager.isInstalled('falloutzp_demo')) {
        window.gameManager.showOnCd('falloutzp_demo');
      } else if (window.appFalloutZP) window.appFalloutZP.open();
      return;
    }
    if (cmd === 'anotherwar' || cmd === 'another war' || cmd === 'anotherwar.exe' || cmd === 'aw' || cmd === 'aw.exe' || cmd === 'другая война') {
      if (window.gameManager && !window.gameManager.isInstalled('anotherwar')) {
        window.winManager.openDialog({
          title: 'Another War',
          icon: 'error',
          message: isRu
            ? 'Игра Another War не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'anotherwar\');">Steam</a>'
            : 'Game Another War is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'anotherwar\');">Steam</a>'
        });
      } else if (window.appAnotherWar) window.appAnotherWar.open();
      return;
    }
    if (cmd === 'korovany' || cmd === 'korovany.exe' || cmd === 'корованы' || cmd === 'kirill') {
      if (window.gameManager && !window.gameManager.isInstalled('korovany_demo')) {
        window.gameManager.showOnCd('korovany_demo');
      } else if (window.appKorovany) window.appKorovany.open();
      return;
    }
    if (cmd === 'catniss' || cmd === 'catniss.exe' || cmd === 'кэтнисс' || cmd === 'кетнисс') {
      if (window.gameManager && !window.gameManager.isInstalled('catniss')) {
        window.winManager.openDialog({
          title: 'Catniss',
          icon: 'error',
          message: isRu
            ? 'Игра «Catniss» не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'catniss\');">Steam</a>'
            : 'Game Catniss is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'catniss\');">Steam</a>'
        });
      } else if (window.appCatniss) window.appCatniss.open();
      return;
    }
    if (cmd === 'plov' || cmd === 'plov.exe' || cmd === 'плов' || cmd === 'hayato' || cmd === 'хаято' || cmd === 'хаято,' || val === 'где плов' || val === 'где плов?' || val === 'хаято, где плов?' || val === 'хаято где плов') {
      if (window.gameManager && !window.gameManager.isInstalled('plov')) {
        window.winManager.openDialog({
          title: 'Хаято, Где плов?',
          icon: 'error',
          message: isRu
            ? 'Игра «Хаято, Где плов?» не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'plov\');">Steam</a>'
            : 'Game Hayato, Where is the plov? is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'plov\');">Steam</a>'
        });
      } else if (window.appPlov) window.appPlov.open();
      return;
    }
    if (cmd === 'gtann' || cmd === 'gtann.exe' || cmd === 'gta nn' || cmd === 'gta vc' || cmd === 'gtavc' || cmd === 'vice city' || cmd === 'вайс сити' || cmd === 'нижний сити' || cmd === 'gta 3d') {
      if (window.gameManager && !window.gameManager.isInstalled('gtann')) {
        window.winManager.openDialog({
          title: 'Grand Theft Auto: Нижний Сити',
          icon: 'error',
          message: isRu
            ? 'Игра GTA: Нижний Сити не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'gtann\');">Steam</a>'
            : 'Game GTA: Nizhny City is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'gtann\');">Steam</a>'
        });
      } else if (window.appGtaNN) window.appGtaNN.open();
      return;
    }
    if (cmd === 'sims' || cmd === 'sims3' || cmd === 'sims3.exe' || cmd === 'sims 3' || cmd === 'the sims 3' || cmd === 'симс' || cmd === 'симс 3' || cmd === 'симы') {
      if (window.gameManager && !window.gameManager.isInstalled('sims3')) {
        window.winManager.openDialog({
          title: 'The Sims 3',
          icon: 'error',
          message: isRu
            ? 'Игра The Sims 3 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sims3\');">Steam</a>'
            : 'Game The Sims 3 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sims3\');">Steam</a>'
        });
      } else if (window.appSims3) window.appSims3.open();
      return;
    }
    if (cmd === 'forza' || cmd === 'forza.exe' || cmd === 'fh' || cmd === 'horizon' || cmd === 'форза' || cmd === 'рига') {
      if (window.gameManager && !window.gameManager.isInstalled('forza')) {
        window.winManager.openDialog({
          title: 'Forza Horizon: Рига',
          icon: 'error',
          message: isRu
            ? 'Игра Forza Horizon: Рига не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'forza\');">Steam</a>'
            : 'Game Forza Horizon: Riga is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'forza\');">Steam</a>'
        });
      } else if (window.appForza) window.appForza.open();
      return;
    }
    if (cmd === 'dmc' || cmd === 'dmc4' || cmd === 'dmc98' || cmd === 'dmc4.exe' || cmd === 'devil may cry' || cmd === 'devil may cry 4' || cmd === 'девил май край') {
      if (window.gameManager && !window.gameManager.isInstalled('dmc98_demo')) {
        window.gameManager.showOnCd('dmc98_demo');
      } else if (window.appDmc98) window.appDmc98.open();
      return;
    }
    if (cmd === 'dao' || cmd === 'dao98' || cmd === 'daorigins' || cmd === 'daorigins.exe' || cmd === 'dragonage' || cmd === 'dragon age' || cmd === 'драгон эйдж' || cmd === 'эпоха драконов') {
      if (window.gameManager && !window.gameManager.isInstalled('dao98_demo')) {
        window.gameManager.showOnCd('dao98_demo');
      } else if (window.appDao98) window.appDao98.open();
      return;
    }
    if (cmd === 'hl2' || cmd === 'hl2.exe' || cmd === 'half-life 2' || cmd === 'halflife2' || cmd === 'халф-лайф 2' || cmd === 'гордон') {
      if (window.gameManager && !window.gameManager.isInstalled('hl2_demo')) {
        window.gameManager.showOnCd('hl2_demo');
      } else if (window.appHl2) window.appHl2.open();
      return;
    }
    if (cmd === 'gta' || cmd === 'gta90' || cmd === 'gta90.exe' || cmd === 'gta1' || cmd === 'гта' || cmd === 'екатеринбург' || cmd === 'екб' || cmd === 'свердловск' || cmd === 'grand theft auto') {
      if (window.gameManager && !window.gameManager.isInstalled('gta90')) {
        window.winManager.openDialog({
          title: "Grand Theft Auto: Екатеринбург '90",
          icon: 'error',
          message: isRu
            ? 'Игра Grand Theft Auto: Нижний \'90 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game Grand Theft Auto: Nizhny \'90 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
      } else if (window.appGta90) window.appGta90.open();
      return;
    }
    if (cmd === 'kotor' || cmd === 'kotor.exe' || cmd === 'kotor98' || cmd === 'swkotor' || cmd === 'котор' || cmd === 'star wars') {
      if (window.gameManager && !window.gameManager.isInstalled('kotor98_demo')) {
        window.gameManager.showOnCd('kotor98_demo');
      } else if (window.appKotor98) window.appKotor98.open();
      return;
    }
    if (cmd === 'starrail' || cmd === 'starrail.exe' || cmd === 'hsr' || cmd === 'hsr98' || cmd === 'honkai' || cmd === 'star rail' || cmd === 'хср' || cmd === 'хонкай') {
      if (window.gameManager && !window.gameManager.isInstalled('hsr98')) {
        window.winManager.openDialog({
          title: 'Honkai: Star Rail 98',
          icon: 'error',
          message: isRu
            ? 'Игра Honkai: Star Rail 98 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game Honkai: Star Rail 98 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
      } else if (window.appHsr98) window.appHsr98.open();
      return;
    }
    if (cmd === 'minecraft' || cmd === 'mc98' || cmd === 'minecraft98' || cmd === 'minecraft.exe' || cmd === 'майнкрафт') {
      if (window.gameManager && !window.gameManager.isInstalled('mc98_demo')) {
        window.gameManager.showOnCd('mc98_demo');
      } else if (window.appMc98) window.appMc98.open();
      return;
    }
    if (cmd === 'cop' || cmd === 'cop98' || cmd === 'zaton' || cmd === 'zaton.exe' || cmd === 'call of pripyat' || cmd === 'зов припяти') {
      if (window.gameManager && !window.gameManager.isInstalled('cop98')) {
        window.winManager.openDialog({
          title: 'S.T.A.L.K.E.R.: Зов Припяти 98',
          icon: 'error',
          message: isRu
            ? 'Игра S.T.A.L.K.E.R.: Зов Припяти 98 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game S.T.A.L.K.E.R.: Call of Pripyat 98 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
      } else if (window.appCop98) window.appCop98.open();
      return;
    }
    if (cmd === 'xr98' || cmd === 'xr98.exe' || cmd === 'stalker98' || cmd === 'stalker 98' || cmd === 'soc' || cmd === 'shadow of chernobyl') {
      if (window.gameManager && !window.gameManager.isInstalled('stalker98_demo')) {
        window.gameManager.showOnCd('stalker98_demo');
      } else if (window.appStalker98) window.appStalker98.open();
      return;
    }
    if (cmd === 'sam' || cmd === 'sam.exe' || cmd === 'serioussam' || cmd === 'serious sam') {
      if (window.gameManager && !window.gameManager.isInstalled('serioussam')) {
        window.winManager.openDialog({
          title: 'Serious Sam 98',
          icon: 'error',
          message: isRu
            ? 'Игра Serious Sam 98 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game Serious Sam 98 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
      } else if (window.appSeriousSam) window.appSeriousSam.open();
      return;
    }
    if (cmd === 'diablo' || cmd === 'diablo.exe' || cmd === 'diablo98') {
      if (window.gameManager && !window.gameManager.isInstalled('diablo')) {
        window.winManager.openDialog({
          title: 'Diablo',
          icon: 'error',
          message: isRu
            ? 'Игра Diablo не установлена.<br>Вы можете получить её в <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game Diablo is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
      } else if (window.appDiablo) window.appDiablo.open();
      return;
    }
    if (cmd === 'hl' || cmd === 'half-life' || cmd === 'halflife' || cmd === 'hl.exe') {
      if (window.gameManager && !window.gameManager.isInstalled('half-life_demo')) {
        window.gameManager.showOnCd('half-life_demo');
      } else if (window.appHalfLife) window.appHalfLife.open();
      return;
    }
    if (cmd === 'glide' || cmd === 'neon-racer' || cmd === 'midnight' || cmd === 'midnight-glide' || cmd === 'glide.exe') {
      if (window.gameManager && !window.gameManager.isInstalled('neon-racer_demo')) {
        window.gameManager.showOnCd('neon-racer_demo');
      } else if (window.appNeonRacer) window.appNeonRacer.open();
      return;
    }
    if (cmd === 'hockey' || cmd === 'nhl' || cmd === 'nhl98' || cmd === 'nhl98.exe' || cmd === 'hockey98.exe') {
      if (window.gameManager && !window.gameManager.isInstalled('hockey')) {
        window.winManager.openDialog({
          title: 'NHL 98',
          icon: 'error',
          message: isRu
            ? 'Игра NHL 98 не установлена.<br>Вы можете установить её с компакт-диска «Игромания» (D:\\demo\\nhl98demo.exe).'
            : 'Game NHL 98 is not installed.<br>You can install it from the Igromania disc (D:\\demo\\nhl98demo.exe).'
        });
      } else if (window.appHockey) window.appHockey.open();
      return;
    }
    if (cmd === 'worldcup' || cmd === 'worldcup98' || cmd === 'worldcup98.exe' || cmd === 'fifa98' || cmd === 'fifa' || val === 'world cup 98' || val === 'world cup' || val === 'france 98') {
      if (window.gameManager && !window.gameManager.isInstalled('worldcup98')) {
        window.winManager.openDialog({
          title: 'World Cup 98',
          icon: 'error',
          message: isRu
            ? 'Игра World Cup 98 не установлена.<br>Вы можете установить её с компакт-диска «Игромания» (D:\\demo\\worldcup98.exe).'
            : 'Game World Cup 98 is not installed.<br>You can install it from the Igromania disc (D:\\demo\\worldcup98.exe).'
        });
      } else if (window.appWorldCup98) window.appWorldCup98.open();
      return;
    }
    if (cmd === 'avp' || cmd === 'kaspersky' || cmd === 'avp.exe' || cmd === 'antivirus') {
      if (window.gameManager && !window.gameManager.isInstalled('avp')) {
        window.winManager.openDialog({
          title: 'Антивирус Касперского AVP',
          icon: 'error',
          message: isRu
            ? 'Программа «Антивирус Касперского AVP» не установлена.<br>Вы можете приобрести и скачать её на официальном сайте Лаборатории Касперского <a href="#" onclick="window.appIE&&window.appIE.open(\'http://www.avp.ru/store\');">http://www.avp.ru</a>'
            : 'Kaspersky Anti-Virus AVP is not installed.<br>You can purchase and download it at <a href="#" onclick="window.appIE&&window.appIE.open(\'http://www.avp.ru/store\');">http://www.avp.ru</a>'
        });
      } else if (window.appAVP) window.appAVP.open();
      return;
    }
    if (cmd === 'esheep' || cmd === 'sheep' || cmd === 'sheep.exe' || cmd === 'esheep.exe' || cmd === 'straysheep' || cmd === 'овечка') {
      if (window.gameManager && !window.gameManager.isInstalled('esheep')) {
        window.winManager.openDialog({
          title: 'eSheep 98 (Sheep.exe)',
          icon: 'error',
          message: isRu
            ? 'Программа «eSheep 98 (Sheep.exe)» не установлена.<br>Вы можете бесплатно скачать её в каталоге <a href="#" onclick="window.appIE&&window.appIE.open(\'http://www.softstore98.com\');">http://www.softstore98.com</a>'
            : 'Program "eSheep 98 (Sheep.exe)" is not installed.<br>You can download it for free at <a href="#" onclick="window.appIE&&window.appIE.open(\'http://www.softstore98.com\');">http://www.softstore98.com</a>'
        });
      } else if (window.appESheep) window.appESheep.open();
      return;
    }
    if (cmd === 'virus' || cmd === 'totally_not_a_virus.exe') {
      if (window.appVirus) window.appVirus.open();
      return;
    }

    if (cmd === 'shutdown') {
      if (window.appShutdown) window.appShutdown.openDialog();
      return;
    }
    if (cmd === 'restart' || cmd === 'reboot') {
      if (window.appShutdown) window.appShutdown.triggerRestart();
      return;
    }
    if (cmd === 'screensaver' || cmd === 'ss' || cmd === 'pipes' || cmd === 'starfield') {
      if (window.appScreensaver) {
        window.appScreensaver.start(cmd === 'pipes' ? 'pipes' : (cmd === 'starfield' ? 'starfield' : undefined));
      }
      return;
    }

    if (
      val === 'reset' || val === 'sysreset' || val === 'factoryreset' ||
      val === 'factory-reset' || val === 'reinstall' ||
      val === 'firstrun' || val === 'first-run' || val === 'cleardata' ||
      val === 'format' || val.startsWith('format ') || val === 'format c:' ||
      val === 'сброс' || val === 'переустановка' || val === 'формат' || val.startsWith('формат ')
    ) {
      this.confirmFactoryReset();
      return;
    }

    if (cmd === 'explorer' || cmd === 'explorer.exe') {
      if (args.length > 0) {
        const argPath = args.join(' ').toLowerCase();
        if (argPath.includes('c:') && argPath.includes('windows')) {
          if (window.appExplorer) window.appExplorer.open(['My Computer', 'C:', 'WINDOWS']);
        } else if (argPath.includes('c:')) {
          if (window.appExplorer) window.appExplorer.open(['My Computer', 'C:']);
        } else {
          if (window.appExplorer) window.appExplorer.open(['My Computer']);
        }
      } else {
        if (window.appExplorer) window.appExplorer.open(['My Computer']);
      }
      return;
    }
    if (cmd === 'c:' || cmd === 'c:\\' || cmd === 'c:/') {
      if (window.appExplorer) window.appExplorer.open(['My Computer', 'C:']);
      return;
    }
    if (cmd === 'd:' || cmd === 'd:\\' || cmd === 'd:/') {
      if (window.appExplorer) window.appExplorer.open(['My Computer', '(D:)']);
      return;
    }
    if (cmd === 'c:\\windows' || cmd === 'windows') {
      if (window.appExplorer) window.appExplorer.open(['My Computer', 'C:', 'WINDOWS']);
      return;
    }
    if (cmd === 'c:\\program files' || cmd === 'program files') {
      if (window.appExplorer) window.appExplorer.open(['My Computer', 'C:', 'Program Files']);
      return;
    }
    if (val === 'my computer' || val === 'компьютер' || val === 'мой компьютер') {
      if (window.appExplorer) window.appExplorer.open(['My Computer']);
      return;
    }
    if (val === 'my documents' || val === 'documents' || val === 'документы' || val === 'мои документы') {
      if (window.appExplorer) window.appExplorer.open(['My Computer', 'C:', 'My Documents']);
      return;
    }
    if (val === 'recycle bin' || val === 'trash' || val === 'корзина') {
      if (window.appRecycleBin) window.appRecycleBin.open();
      return;
    }

    if (
      cmd === 'iexplore' || cmd === 'ie' ||
      val.startsWith('http://') || val.startsWith('https://') ||
      val.startsWith('www.') || val.endsWith('.com') || val.endsWith('.org') ||
      val.endsWith('.net') || val.endsWith('.ru')
    ) {
      let url = fullVal;
      if (cmd === 'iexplore' || cmd === 'ie') {
        url = args.join(' ') || 'http://www.search98.com';
      }
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:')) {
        url = 'http://' + url;
      }
      if (window.appIE) window.appIE.open(url);
      return;
    }

    if (val.endsWith('.txt') || val.endsWith('.ini') || val.endsWith('.log') || val.endsWith('.bat') || val.endsWith('.sys')) {
      if (window.appNotepad) window.appNotepad.open(fullVal);
      return;
    }
    if (val.endsWith('.bmp') || val.endsWith('.png') || val.endsWith('.jpg') || val.endsWith('.gif')) {
      if (window.appImageViewer) window.appImageViewer.open(fullVal);
      return;
    }
    if (val.endsWith('.avi') || val.endsWith('.mp4') || val.endsWith('.mov')) {
      if (window.appVideoPlayer) window.appVideoPlayer.open(fullVal, null, true);
      return;
    }
    if (/\.(nes|bin|smd|gen|smc|sfc|gb|gbc|sta)$/.test(val)) {
      if (window.appEmulator) window.appEmulator.open(fullVal);
      return;
    }

    if (window.soundSys) window.soundSys.playError();
    window.winManager.openDialog({
      title: fullVal,
      icon: 'error',
      message: t('run.notFound', fullVal)
    });
  }

  confirmFactoryReset() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;

    window.winManager.openDialog({
      title: t('run.resetTitle'),
      icon: 'warning',
      message: t('run.resetConfirm'),
      buttons: [
        {
          text: 'Yes',
          primary: true,
          onClick: () => {
            this.performFactoryReset();
          }
        },
        {
          text: 'Cancel',
          onClick: null
        }
      ]
    });
  }

  performFactoryReset() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;

    if (window.soundSys) {
      window.soundSys.playShutdown();
    }

    if (window.winManager && window.winManager.windows) {
      const winIds = Array.from(window.winManager.windows.keys());
      winIds.forEach(id => window.winManager.closeWindow(id));
    }

    const bootScreen = document.getElementById('boot-screen');
    const bootFooter = document.querySelector('.boot-footer');
    if (bootFooter) {
      bootFooter.textContent = t('run.resetting');
    }
    if (bootScreen) {
      bootScreen.style.display = 'flex';
      bootScreen.classList.remove('fade-out');
    }

    const clearAll = () => { try { localStorage.clear(); } catch (e) {} };
    const wiped = window.BackupStore ? window.BackupStore.wipe(null, { dropArchives: false }).catch(clearAll) : Promise.resolve().then(clearAll);

    wiped.then(() => {
      if (window.BackupStore) window.BackupStore.freezeStorage();
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    });
  }

  openDisplayProperties(initialTab) {
    const tabNames = ['bg', 'screensaver', 'appearance', 'effects', 'themes', 'settings'];
    const startTab = 'tab-' + (tabNames.includes(initialTab) ? initialTab : 'bg');
    if (window.winManager && window.winManager.windows.has('app_display_props')) {
      window.winManager.bringToTop('app_display_props');
      if (tabNames.includes(initialTab)) {
        const openTab = window.winManager.windows.get('app_display_props').element.querySelector(`.win-tab[data-tab="${startTab}"]`);
        if (openTab) openTab.click();
      }
      return;
    }

    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';

    let savedSettings = this.getDisplaySettings();
    let working = { ...savedSettings, desktopIcons: { ...savedSettings.desktopIcons } };

    const downloadedWalls = this.getDownloadedWallpapers();
    const downloadedSavers = this.getDownloadedScreensavers();
    const downloadedThemes = this.getDownloadedThemes();

    const schemes = [
      { id: 'standard', name: t('disp.schemeStandard'), bg: '#008080', grad: 'linear-gradient(90deg, #000080, #1084d0)' },
      { id: 'eggplant', name: t('disp.schemeEggplant'), bg: '#404040', grad: 'linear-gradient(90deg, #5a4e7c, #a898c8)' },
      { id: 'desert', name: t('disp.schemeDesert'), bg: '#a28d68', grad: 'linear-gradient(90deg, #008080, #8cc8c8)' },
      { id: 'marine', name: t('disp.schemeMarine'), bg: '#004040', grad: 'linear-gradient(90deg, #008080, #40c0c0)' },
      { id: 'brick', name: t('disp.schemeBrick'), bg: '#400000', grad: 'linear-gradient(90deg, #800000, #c08080)' },
      { id: 'lilac', name: t('disp.schemeLilac'), bg: '#8080c0', grad: 'linear-gradient(90deg, #5a4e9c, #b0a8e0)' },
      { id: 'rainy', name: t('disp.schemeRainy'), bg: '#808080', grad: 'linear-gradient(90deg, #4f657d, #94b0d6)' },
      { id: 'storm', name: t('disp.schemeStorm'), bg: '#000000', grad: 'linear-gradient(90deg, #000080, #800080)' }
    ];
    const palette = ['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#c0c0c0', '#ffffff', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#004040', '#4b0082', '#d2b48c', '#408080'];

    const builtInThemeIds = ['classic', 'space', 'creatures', 'underwater', 'mystery', 'jungle'];
    const rawThemes = window.appThemes && window.appThemes.themes ? Object.values(window.appThemes.themes) : [
      { id: 'classic', name: t('theme.classic.name'), bg: '#008080', wallpaper: 'none', titleGrad: 'linear-gradient(90deg, #000080, #1084d0)' },
      { id: 'space', name: t('theme.space.name'), bg: '#0b0d1b', wallpaper: 'space', titleGrad: 'linear-gradient(90deg, #1a0826, #6b117b)' },
      { id: 'creatures', name: t('theme.creatures.name'), bg: '#2b1b11', wallpaper: 'creatures', titleGrad: 'linear-gradient(90deg, #42210b, #935116)' },
      { id: 'underwater', name: t('theme.underwater.name'), bg: '#004f6c', wallpaper: 'underwater', titleGrad: 'linear-gradient(90deg, #00334e, #0881a3)' },
      { id: 'mystery', name: t('theme.mystery.name'), bg: '#23192d', wallpaper: 'mystery', titleGrad: 'linear-gradient(90deg, #3d1b4f, #79288a)' },
      { id: 'jungle', name: t('theme.jungle.name'), bg: '#103014', wallpaper: 'jungle', titleGrad: 'linear-gradient(90deg, #19431d, #3e7a2b)' }
    ];

    const themes = rawThemes
      .filter(th => builtInThemeIds.includes(th.id) || downloadedThemes.includes(th.id) || working.themeId === th.id || savedSettings.themeId === th.id)
      .map(th => ({
        id: th.id,
        name: th.name,
        bg: th.bg,
        titleGrad: th.titleGrad,
        wallpaper: th.wallpaper || 'none'
      }));

    const builtInWallIds = ['none', 'clouds', 'setup', 'spacecadet', 'pipes'];
    const allWallpapers = [
      { id: 'none', name: t('disp.wallpaperNone') },
      { id: 'clouds', name: 'Clouds 98 (Облака)' },
      { id: 'setup', name: 'Win 98 Setup' },
      { id: 'spacecadet', name: 'Space Cadet (Космос)' },
      { id: 'pipes', name: '3D Pipes OpenGL' },
      { id: 'matrix', name: 'The Matrix Code (Матрица)' },
      { id: 'cyberpunk', name: 'Cyberpunk Neon 1998' },
      { id: 'redalert', name: 'Red Alert (Радар)' },
      { id: 'gold', name: 'Millennium Gold' },
      { id: 'dejiko', name: 'DiGi Charat Akiba' }
    ];
    const wallpapers = allWallpapers.filter(w =>
      builtInWallIds.includes(w.id) ||
      downloadedWalls.includes(w.id) ||
      working.wallpaper === w.id ||
      savedSettings.wallpaper === w.id
    );

    const builtInSaverIds = ['pipes', 'starfield', 'mystify', 'flowerbox', 'maze', 'text3d', 'none'];
    const allSavers = [
      { id: 'pipes', name: t('disp.ssPipes') },
      { id: 'starfield', name: t('disp.ssStarfield') },
      { id: 'mystify', name: t('disp.ssMystify') },
      { id: 'flowerbox', name: t('disp.ssFlowerbox') },
      { id: 'maze', name: isRu ? 'Объемный лабиринт (OpenGL)' : '3D Maze (OpenGL)' },
      { id: 'text3d', name: isRu ? 'Объемный текст (OpenGL)' : '3D Text (OpenGL)' },
      { id: 'matrix', name: t('disp.ssMatrix') || 'The Matrix Code (Матрица 1999)' },
      { id: 'flying_win', name: t('disp.ssFlyingWin') || '3D Flying Win (Летающие окна)' },
      { id: 'none', name: t('disp.ssNone') }
    ];
    const screensavers = allSavers.filter(s =>
      builtInSaverIds.includes(s.id) ||
      downloadedSavers.includes(s.id) ||
      working.screensaverMode === s.id ||
      savedSettings.screensaverMode === s.id
    );

    const fxIconSlots = [
      { id: 'my-computer', name: t('app.myComputer') },
      { id: 'my-documents', name: t('app.myDocs') },
      { id: 'network', name: t('app.network') },
      { id: 'recycle-bin', name: t('disp.fxBinFull') },
      { id: 'recycle-bin-empty', name: t('disp.fxBinEmpty') }
    ];
    const fxIconFor = slot => (Icons[working.desktopIcons[slot]] ? working.desktopIcons[slot] : slot);
    const fxChecks = [
      { key: 'largeIcons', label: t('disp.fxLargeIcons') },
      { key: 'iconColors', label: t('disp.fxIconColors') },
      { key: 'animateUi', label: t('disp.fxAnimate') },
      { key: 'fontSmoothing', label: t('disp.fxSmoothFonts') },
      { key: 'fullDrag', label: t('disp.fxFullDrag') },
      { key: 'crtEnabled', label: t('disp.crtLabel') }
    ];

    const screenAreaSizes = [[640, 480], [800, 600], [1024, 768]];
    const screenAreaLabel = (idx) => {
      const [w, h] = screenAreaSizes[idx] || screenAreaSizes[2];
      return isRu ? `${w} на ${h} точек` : `${w} by ${h} pixels`;
    };

    const content = document.createElement('div');
    content.className = 'disp-props';
    const tab = (id, label, active) => `<div class="win-tab${active ? ' active' : ''}" data-tab="${id}">${label}</div>`;
    const monitor = `
      <div class="disp-monitor">
        <div class="disp-monitor-screen"><div class="disp-mini-desktop"><div class="disp-mini-win"><div class="disp-mini-titlebar"></div><div class="disp-mini-body"></div></div></div></div>
        <div class="disp-monitor-base"></div>
      </div>`;
    content.innerHTML = `
      <div class="win-tabs">
        ${tab('tab-bg', t('disp.tabBg'), true)}${tab('tab-screensaver', t('disp.tabScreensaver'))}${tab('tab-appearance', t('disp.tabAppearance'))}${tab('tab-effects', t('disp.tabEffects'))}${tab('tab-themes', t('disp.tabThemes'))}${tab('tab-settings', isRu ? 'Настройка' : 'Settings')}
      </div>
      <div class="win-tab-panel">
        <div class="disp-tab-content" id="tab-bg">
          ${monitor}
          <div class="disp-bg-row">
            <div class="disp-bg-list-wrap">
              <label>${t('disp.wallpaperList')}</label>
              <div class="disp-wall-list" tabindex="0">
                ${wallpapers.map(w => `<div class="disp-wall-item${working.wallpaper === w.id ? ' selected' : ''}" data-id="${w.id}"><span class="disp-wall-icon icon-small">${w.id === 'none' ? '' : Icons['file-bmp'] || ''}</span><span class="disp-wall-name">${w.name}</span></div>`).join('')}
              </div>
            </div>
            <div class="disp-bg-side">
              <button class="win-btn disp-browse">${t('btn.browse')}</button>
              <label>${t('disp.displayMode')}</label>
              <select class="win-select" id="disp-mode-select">
                <option value="center" ${working.wallpaperMode === 'center' ? 'selected' : ''}>${t('disp.modeCenter')}</option>
                <option value="tile" ${working.wallpaperMode === 'tile' ? 'selected' : ''}>${t('disp.modeTile')}</option>
                <option value="stretch" ${working.wallpaperMode === 'stretch' ? 'selected' : ''}>${t('disp.modeStretch')}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="disp-tab-content hidden" id="tab-screensaver">
          ${monitor}
          <fieldset class="disp-group">
            <legend>${t('disp.saverTitle')}</legend>
            <div class="disp-saver-row">
              <select class="win-select" id="disp-saver-select">
                ${screensavers.map(sv => `<option value="${sv.id}" ${working.screensaverMode === sv.id ? 'selected' : ''}>${sv.name}</option>`).join('')}
              </select>
              <button class="win-btn" id="btn-saver-preview">${t('disp.saverPreview')}</button>
            </div>
            <div class="disp-saver-row">
              <label>${t('disp.saverWait')}</label>
              <input type="number" id="disp-saver-timeout" min="1" max="60" value="${working.screensaverTimeout}">
              <span>${t('disp.saverMin')}</span>
            </div>
          </fieldset>
          <fieldset class="disp-group disp-energy-group">
            <legend>${t('disp.energyTitle')}</legend>
            <div class="disp-energy-row">
              <div class="disp-energy-logo">ENERGY<br>STAR</div>
              <div class="disp-energy-desc">${t('disp.energyDesc')}</div>
              <button class="win-btn" id="btn-saver-power">${t('disp.energySettingsBtn')}</button>
            </div>
          </fieldset>
        </div>
        <div class="disp-tab-content hidden" id="tab-appearance">
          ${monitor}
          <div class="disp-app-row">
            <label>${t('disp.scheme')}</label>
            <select class="win-select" id="disp-scheme-select">
              <option value="">${t('disp.schemeCustom')}</option>
              ${schemes.map(sc => `<option value="${sc.id}">${sc.name}</option>`).join('')}
            </select>
          </div>
          <div class="disp-app-row">
            <label>${t('disp.item')}</label>
            <span class="disp-item-name">${t('disp.itemDesktop')}</span>
            <label>${t('disp.color')}</label>
            <div class="disp-color-picker">
              <button class="disp-color-btn"><span class="disp-color-swatch"></span></button>
              <div class="disp-color-grid">${palette.map(c => `<div class="disp-color-cell" data-color="${c}" style="background:${c}"></div>`).join('')}</div>
            </div>
          </div>
        </div>
        <div class="disp-tab-content hidden" id="tab-effects">
          <fieldset class="disp-group">
            <legend>${t('disp.fxDesktopIcons')}</legend>
            <div class="disp-fx-icons" tabindex="0">
              ${fxIconSlots.map((slot, i) => `<div class="disp-fx-icon${i === 0 ? ' selected' : ''}" data-slot="${slot.id}"><span class="disp-fx-icon-img">${Icons[fxIconFor(slot.id)]}</span><span class="disp-fx-icon-name">${slot.name}</span></div>`).join('')}
            </div>
            <div class="disp-fx-icon-buttons">
              <button class="win-btn" id="btn-fx-change-icon">${t('disp.fxChangeIcon')}</button>
              <button class="win-btn" id="btn-fx-default-icon">${t('disp.fxDefaultIcon')}</button>
            </div>
          </fieldset>
          <fieldset class="disp-group is-checks">
            <legend>${t('disp.effectsTitle')}</legend>
            ${fxChecks.map(fx => `<label class="disp-check"><input type="checkbox" data-fx="${fx.key}" ${working[fx.key] ? 'checked' : ''}> ${fx.label}</label>`).join('')}
          </fieldset>
        </div>
        <div class="disp-tab-content hidden" id="tab-themes">
          <fieldset class="disp-group">
            <legend>${t('disp.themesTitle')}</legend>
            <div class="disp-themes-list">
              ${themes.map(th => `<div class="disp-theme-item${working.themeId === th.id ? ' selected' : ''}" data-theme="${th.id}" data-bg="${th.bg}" data-grad="${th.titleGrad}" data-wallpaper="${th.wallpaper}"><span class="disp-theme-swatch" style="background:${th.bg}"></span><span>${th.name}</span></div>`).join('')}
            </div>
            <p class="disp-themes-note">${t('disp.themesNote')}</p>
          </fieldset>
        </div>
        <div class="disp-tab-content hidden" id="tab-settings">
          ${monitor}
          <div style="font-size:11px;margin-bottom:6px;">
            <div>${isRu ? 'Экран:' : 'Display:'}</div>
            <div style="font-weight:bold;">${isRu ? 'Монитор Plug and Play на 3dfx Voodoo2 / S3 Trio64V2/DX' : 'Plug and Play Monitor on 3dfx Voodoo2 / S3 Trio64V2/DX'}</div>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:8px;">
            <fieldset class="disp-group" style="flex:1;padding:6px;">
              <legend>${isRu ? 'Цветовая палитра' : 'Colors'}</legend>
              <select class="win-select" id="disp-color-depth" style="width:100%;margin-bottom:6px;">
                <option value="16color" ${working.colorDepth === '16color' ? 'selected' : ''}>${isRu ? '16 цветов' : '16 Colors'}</option>
                <option value="256color" ${working.colorDepth === '256color' ? 'selected' : ''}>${isRu ? '256 цветов' : '256 Colors'}</option>
                <option value="16bit" ${working.colorDepth === '16bit' ? 'selected' : ''}>${isRu ? 'High Color (16 бит)' : 'High Color (16 bit)'}</option>
                <option value="32bit" ${(!working.colorDepth || working.colorDepth === '32bit') ? 'selected' : ''}>${isRu ? 'True Color (32 бита)' : 'True Color (32 bit)'}</option>
              </select>
              <div style="height:14px;border:1px inset #fff;background:linear-gradient(90deg,#000,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#fff);"></div>
            </fieldset>
            <fieldset class="disp-group" style="flex:1;padding:6px;">
              <legend>${isRu ? 'Область экрана' : 'Screen area'}</legend>
              <div style="display:flex;align-items:center;gap:4px;font-size:10px;">
                <span>${isRu ? 'Меньше' : 'Less'}</span>
                <input type="range" id="disp-res-slider" min="0" max="2" step="1" value="${working.resolution === '640x480' ? 0 : (working.resolution === '800x600' ? 1 : 2)}" style="flex:1;">
                <span>${isRu ? 'Больше' : 'More'}</span>
              </div>
              <div id="disp-res-label" style="text-align:center;font-size:11px;margin-top:4px;">${screenAreaLabel(working.resolution === '640x480' ? 0 : (working.resolution === '800x600' ? 1 : 2))}</div>
            </fieldset>
          </div>
          <div style="display:flex;justify-content:flex-end;">
            <button class="win-btn" id="btn-disp-advanced">${isRu ? 'Дополнительно...' : 'Advanced...'}</button>
          </div>
        </div>
      </div>
      <div class="disp-buttons">
        <button class="win-btn is-default btn-disp-ok">${t('btn.ok')}</button>
        <button class="win-btn btn-disp-cancel">${t('btn.cancel')}</button>
        <button class="win-btn btn-disp-apply" disabled>${t('btn.apply')}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_display_props',
      title: t('disp.title'),
      icon: 'monitor',
      width: 404,
      height: 430,
      resizable: false,
      minimizable: false,
      maximizable: false,
      helpButton: true,
      onHelp: () => this.openHelp('desktop'),
      isDialog: true,
      content,
      onClose: () => {
        this.syncDisplayProps = null;
        if (window.winManager.windows.has('app_change_icon')) window.winManager.closeWindow('app_change_icon');
      }
    });

    const el = dialog.element;
    const modeSelect = el.querySelector('#disp-mode-select');
    const saverSelect = el.querySelector('#disp-saver-select');
    const saverTimeout = el.querySelector('#disp-saver-timeout');
    const schemeSelect = el.querySelector('#disp-scheme-select');
    const btnApply = el.querySelector('.btn-disp-apply');

    el.querySelectorAll('.win-tab').forEach(tabEl => {
      tabEl.addEventListener('click', () => {
        el.querySelectorAll('.win-tab').forEach(x => x.classList.toggle('active', x === tabEl));
        el.querySelectorAll('.disp-tab-content').forEach(tc => tc.classList.toggle('hidden', tc.id !== tabEl.dataset.tab));
      });
    });

    const fxKeys = fxChecks.map(fx => fx.key);
    const sameIcons = (a, b) => Array.from(new Set(Object.keys(a || {}).concat(Object.keys(b || {})))).every(slot => (a || {})[slot] === (b || {})[slot]);
    const checkDirty = () => {
      btnApply.disabled = !(
        working.bgColor !== savedSettings.bgColor ||
        working.wallpaper !== savedSettings.wallpaper ||
        working.wallpaperMode !== savedSettings.wallpaperMode ||
        working.themeId !== savedSettings.themeId ||
        working.themeGrad !== savedSettings.themeGrad ||
        fxKeys.some(key => Boolean(working[key]) !== Boolean(savedSettings[key])) ||
        !sameIcons(working.desktopIcons, savedSettings.desktopIcons) ||
        working.screensaverMode !== savedSettings.screensaverMode ||
        working.screensaverTimeout !== savedSettings.screensaverTimeout ||
        working.colorDepth !== savedSettings.colorDepth ||
        working.resolution !== savedSettings.resolution
      );
    };

    const updateMonitorPreview = () => {
      el.querySelectorAll('.disp-mini-desktop').forEach(mini => {
        mini.style.backgroundColor = working.bgColor;
        this.applyWallpaperMode(mini, working.wallpaperMode, working.wallpaper);
      });
      el.querySelectorAll('.disp-mini-titlebar').forEach(bar => { bar.style.background = working.themeGrad; });
      el.querySelectorAll('.disp-wall-item').forEach(item => item.classList.toggle('selected', item.dataset.id === working.wallpaper));
      el.querySelectorAll('.disp-theme-item').forEach(item => item.classList.toggle('selected', item.dataset.theme === working.themeId));
      el.querySelector('.disp-color-swatch').style.background = working.bgColor;
      const scheme = schemes.find(sc => sc.bg.toLowerCase() === String(working.bgColor).toLowerCase() && sc.grad === working.themeGrad);
      schemeSelect.value = scheme ? scheme.id : '';
      checkDirty();
    };

    updateMonitorPreview();

    el.querySelectorAll('.disp-wall-item').forEach(item => {
      item.addEventListener('click', () => {
        working.wallpaper = item.dataset.id;
        updateMonitorPreview();
      });
    });

    el.querySelector('.disp-browse').addEventListener('click', () => {
      if (!window.fileDialog) return;
      window.fileDialog.show({
        mode: 'open',
        path: ['My Computer', 'C:', 'My Documents'],
        filters: [{ label: t('disp.filterImages'), exts: ['bmp', 'png', 'jpg', 'jpeg', 'gif'] }],
        onOk: (path, name) => {
          const data = window.vfs.readFile(path, name);
          if (typeof data === 'string' && data.startsWith('data:image')) {
            working.wallpaper = data;
            updateMonitorPreview();
          }
        }
      });
    });

    modeSelect.addEventListener('change', () => {
      working.wallpaperMode = modeSelect.value;
      updateMonitorPreview();
    });

    schemeSelect.addEventListener('change', () => {
      const scheme = schemes.find(sc => sc.id === schemeSelect.value);
      if (!scheme) return;
      working.bgColor = scheme.bg;
      working.themeGrad = scheme.grad;
      updateMonitorPreview();
    });

    let appearanceItem = 'desktop';
    const itemNameEl = el.querySelector('.disp-item-name');
    const appMonitor = el.querySelector('#tab-appearance .disp-mini-desktop');
    if (appMonitor && itemNameEl) {
      appMonitor.style.cursor = 'pointer';
      appMonitor.addEventListener('click', (e) => {
        if (e.target.closest('.disp-mini-titlebar')) {
          appearanceItem = 'titlebar';
          itemNameEl.textContent = isRu ? 'Заголовок активного окна' : 'Active Title Bar';
        } else if (e.target.closest('.disp-mini-body')) {
          appearanceItem = 'window';
          itemNameEl.textContent = isRu ? 'Окно' : 'Window';
        } else {
          appearanceItem = 'desktop';
          itemNameEl.textContent = t('disp.itemDesktop');
        }
      });
    }

    const picker = el.querySelector('.disp-color-picker');
    el.querySelector('.disp-color-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      picker.classList.toggle('open');
    });
    el.querySelectorAll('.disp-color-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        if (appearanceItem === 'titlebar') {
          working.themeGrad = `linear-gradient(90deg, ${cell.dataset.color}, #1084d0)`;
        } else {
          working.bgColor = cell.dataset.color;
        }
        picker.classList.remove('open');
        updateMonitorPreview();
      });
    });
    el.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.disp-color-picker')) picker.classList.remove('open');
    });

    const colorDepthSelect = el.querySelector('#disp-color-depth');
    const resSlider = el.querySelector('#disp-res-slider');
    const resLabel = el.querySelector('#disp-res-label');
    const btnDispAdv = el.querySelector('#btn-disp-advanced');
    if (colorDepthSelect) {
      colorDepthSelect.addEventListener('change', () => {
        working.colorDepth = colorDepthSelect.value;
        checkDirty();
      });
    }
    if (resSlider && resLabel) {
      resSlider.addEventListener('input', () => {
        const idx = parseInt(resSlider.value, 10) || 0;
        const map = ['640x480', '800x600', '1024x768'];
        working.resolution = map[idx] || '1024x768';
        resLabel.textContent = screenAreaLabel(idx);
        checkDirty();
      });
    }
    if (btnDispAdv) {
      btnDispAdv.addEventListener('click', () => this.openDisplayAdvancedDialog());
    }

    el.querySelectorAll('.disp-theme-item').forEach(item => {
      item.addEventListener('click', () => {
        working.themeId = item.dataset.theme;
        working.bgColor = item.dataset.bg;
        working.themeGrad = item.dataset.grad;
        if (item.dataset.wallpaper && item.dataset.wallpaper !== 'none') working.wallpaper = item.dataset.wallpaper;
        updateMonitorPreview();
      });
    });

    const fxBoxes = Array.from(el.querySelectorAll('input[data-fx]'));
    fxBoxes.forEach(box => {
      box.addEventListener('change', () => {
        working[box.dataset.fx] = box.checked;
        checkDirty();
      });
    });

    const fxStrip = el.querySelector('.disp-fx-icons');
    const btnChangeIcon = el.querySelector('#btn-fx-change-icon');
    const btnDefaultIcon = el.querySelector('#btn-fx-default-icon');
    let fxSlot = fxIconSlots[0].id;
    const renderFxIcons = () => {
      el.querySelectorAll('.disp-fx-icon').forEach(item => {
        item.classList.toggle('selected', item.dataset.slot === fxSlot);
        item.querySelector('.disp-fx-icon-img').innerHTML = Icons[fxIconFor(item.dataset.slot)];
      });
      btnDefaultIcon.disabled = !working.desktopIcons[fxSlot];
    };
    const setSlotIcon = (slot, iconKey) => {
      const next = { ...working.desktopIcons };
      if (!iconKey || iconKey === slot) delete next[slot];
      else next[slot] = iconKey;
      working.desktopIcons = next;
      renderFxIcons();
      checkDirty();
    };
    const changeSlotIcon = () => {
      const slot = fxSlot;
      this.openIconPicker(fxIconFor(slot), iconKey => setSlotIcon(slot, iconKey));
    };
    el.querySelectorAll('.disp-fx-icon').forEach(item => {
      item.addEventListener('mousedown', () => {
        fxSlot = item.dataset.slot;
        renderFxIcons();
      });
      item.addEventListener('dblclick', changeSlotIcon);
    });
    fxStrip.addEventListener('keydown', (e) => {
      const index = fxIconSlots.findIndex(slot => slot.id === fxSlot);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = fxIconSlots[Math.max(0, Math.min(fxIconSlots.length - 1, index + (e.key === 'ArrowRight' ? 1 : -1)))];
        fxSlot = next.id;
        renderFxIcons();
        const item = el.querySelector(`.disp-fx-icon[data-slot="${fxSlot}"]`);
        if (item && item.scrollIntoView) item.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        changeSlotIcon();
      }
    });
    btnChangeIcon.addEventListener('click', changeSlotIcon);
    btnDefaultIcon.addEventListener('click', () => setSlotIcon(fxSlot, null));
    renderFxIcons();

    this.syncDisplayProps = (patch) => {
      const fresh = this.getDisplaySettings();
      Object.keys(patch).forEach(key => {
        savedSettings[key] = fresh[key];
        working[key] = key === 'desktopIcons' ? { ...fresh.desktopIcons } : fresh[key];
      });
      fxBoxes.forEach(box => { box.checked = Boolean(working[box.dataset.fx]); });
      renderFxIcons();
      checkDirty();
    };

    saverSelect.addEventListener('change', () => {
      working.screensaverMode = saverSelect.value;
      checkDirty();
    });

    saverTimeout.addEventListener('input', () => {
      working.screensaverTimeout = Math.max(1, Math.min(60, parseInt(saverTimeout.value, 10) || 1));
      checkDirty();
    });

    el.querySelector('#btn-saver-preview').addEventListener('click', () => {
      if (window.appScreensaver) window.appScreensaver.start(working.screensaverMode);
    });

    const btnSaverPower = el.querySelector('#btn-saver-power');
    if (btnSaverPower) {
      btnSaverPower.addEventListener('click', () => {
        if (window.appCPanel) window.appCPanel.openPowerProperties();
      });
    }

    const commitChanges = () => {
      const before = savedSettings;
      savedSettings = this.saveDisplaySettings(working);
      this.applyDisplaySettings(savedSettings);
      checkDirty();
      if (window.soundSys) window.soundSys.playClick();
      this.notifyDisplayEffects(before, savedSettings, 'dialog');
    };

    btnApply.addEventListener('click', commitChanges);

    el.querySelector('.btn-disp-ok').addEventListener('click', () => {
      commitChanges();
      window.winManager.closeWindow('app_display_props');
    });

    el.querySelector('.btn-disp-cancel').addEventListener('click', () => {
      window.winManager.closeWindow('app_display_props');
    });

    if (startTab !== 'tab-bg') {
      const firstTab = el.querySelector(`.win-tab[data-tab="${startTab}"]`);
      if (firstTab) firstTab.click();
    }
  }

  openIconPicker(currentIcon, onPick) {
    const wm = window.winManager;
    if (wm.windows.has('app_change_icon')) wm.closeWindow('app_change_icon');
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const iconKeys = [
      'my-computer', 'my-documents', 'network', 'recycle-bin', 'recycle-bin-empty', 'folder',
      'folder-pictures', 'folder-music', 'folder-videos', 'folder-downloads', 'drive-c', 'drive-d',
      'drive-cd', 'control-panel', 'monitor', 'hardware', 'system', 'internet-explorer',
      'outlook', 'favorites', 'help-book', 'find', 'run', 'programs',
      'settings', 'shut-down', 'dos-prompt', 'timedate', 'speaker', 'mouse',
      'multimedia', 'regional', 'screensaver', 'info', 'question', 'warning',
      'error', 'start-logo', 'file-txt', 'file-exe', 'setup-installer', 'clippy'
    ].filter(key => Icons[key]);
    let picked = iconKeys.includes(currentIcon) ? currentIcon : iconKeys[0];

    const content = document.createElement('div');
    content.className = 'disp-iconpick';
    content.innerHTML = `
      <label>${t('disp.pickFile')}</label>
      <div class="disp-iconpick-file">C:\\WINDOWS\\SYSTEM\\shell32.dll</div>
      <label>${t('disp.pickCurrent')}</label>
      <div class="disp-iconpick-grid" tabindex="0">
        ${iconKeys.map(key => `<div class="disp-iconpick-cell${key === picked ? ' selected' : ''}" data-icon="${key}">${Icons[key]}</div>`).join('')}
      </div>
      <div class="disp-buttons">
        <button class="win-btn is-default btn-pick-ok">${t('btn.ok')}</button>
        <button class="win-btn btn-pick-cancel">${t('btn.cancel')}</button>
      </div>
    `;

    const pickerWin = wm.createWindow({
      id: 'app_change_icon',
      title: t('disp.pickTitle'),
      icon: 'monitor',
      width: 340,
      height: 290,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });
    const root = pickerWin.element;
    const grid = root.querySelector('.disp-iconpick-grid');
    const select = (key) => {
      picked = key;
      root.querySelectorAll('.disp-iconpick-cell').forEach(cell => cell.classList.toggle('selected', cell.dataset.icon === key));
    };
    const confirm = () => {
      wm.closeWindow('app_change_icon');
      if (typeof onPick === 'function') onPick(picked);
    };
    root.querySelectorAll('.disp-iconpick-cell').forEach(cell => {
      cell.addEventListener('mousedown', () => select(cell.dataset.icon));
      cell.addEventListener('dblclick', confirm);
    });
    grid.addEventListener('keydown', (e) => {
      const steps = { ArrowDown: 1, ArrowUp: -1, ArrowRight: 3, ArrowLeft: -3 };
      if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
      } else if (e.key === 'Escape') {
        wm.closeWindow('app_change_icon');
      } else if (steps[e.key]) {
        e.preventDefault();
        const index = Math.max(0, Math.min(iconKeys.length - 1, iconKeys.indexOf(picked) + steps[e.key]));
        select(iconKeys[index]);
        const cell = root.querySelector(`.disp-iconpick-cell[data-icon="${iconKeys[index]}"]`);
        if (cell && cell.scrollIntoView) cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    });
    root.querySelector('.btn-pick-ok').addEventListener('click', confirm);
    root.querySelector('.btn-pick-cancel').addEventListener('click', () => wm.closeWindow('app_change_icon'));
    const current = root.querySelector('.disp-iconpick-cell.selected');
    if (current && current.scrollIntoView) current.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    grid.focus();
  }

  openRegionalSettings() {
    if (window.winManager && window.winManager.windows.has('app_regional_settings')) {
      window.winManager.bringToTop('app_regional_settings');
      return;
    }

    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const currentLang = window.i18n ? window.i18n.getLanguage() : 'ru';
    let selectedLang = currentLang;

    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.padding = '8px 12px';
    content.style.boxSizing = 'border-box';
    content.style.height = '100%';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';

    const getPreviewData = (lang) => {
      const now = new Date();
      const timeStr = lang === 'ru'
        ? now.toLocaleTimeString('ru-RU')
        : now.toLocaleTimeString('en-US');
      const dateStr = lang === 'ru'
        ? now.toLocaleDateString('ru-RU')
        : now.toLocaleDateString('en-US');
      const currStr = lang === 'ru' ? '1 234,50 руб.' : '$1,234.50';
      return { timeStr, dateStr, currStr };
    };

    const initialPreview = getPreviewData(selectedLang);

    content.innerHTML = `
      <div style="display:flex; border-bottom:1px solid #808080; margin-bottom:8px;">
        <div class="regional-tab-title" style="background:var(--win-bg); border:1px solid #808080; border-bottom:none; border-top-left-radius:3px; border-top-right-radius:3px; padding:3px 12px; font-weight:bold; font-size:11px; margin-bottom:-1px; border-top:2px solid #fff; border-left:2px solid #fff; border-right:2px solid #404040;">
          ${t('regional.tabRegional')}
        </div>
      </div>

      <div style="display:flex; gap:10px; align-items:center; margin-bottom:8px;">
        <div style="width:36px; height:36px; flex-shrink:0;">${Icons['regional']}</div>
        <div style="font-size:11px; line-height:1.4;">
          <span class="regional-header-desc" style="color:#222;">${t('cpanel.regionalDesc')}</span>
        </div>
      </div>

      <fieldset class="bevel-groove" style="padding:8px 10px; margin-bottom:8px;">
        <legend class="regional-fset-choose">${t('regional.chooseLang')}</legend>
        <div style="margin:4px 0;">
          <select class="regional-lang-select" style="width:100%; height:24px; font-family:var(--win-font); font-size:11px; background:#fff; border:2px inset #fff;">
            <option value="ru" ${selectedLang === 'ru' ? 'selected' : ''}>${t('regional.langRu')}</option>
            <option value="en" ${selectedLang === 'en' ? 'selected' : ''}>${t('regional.langEn')}</option>
          </select>
        </div>
        <div class="regional-note" style="font-size:10px; color:#555; margin-top:3px; line-height:1.3;">
          ${t('regional.note')}
        </div>
      </fieldset>

      <fieldset class="bevel-groove" style="padding:8px 10px; margin-bottom:8px;">
        <legend class="regional-fset-preview">${t('regional.previewTitle')}</legend>
        <div style="display:grid; grid-template-columns:120px 1fr; gap:4px; font-size:11px; align-items:center;">
          <div class="regional-lbl-time" style="color:#555;">${t('regional.previewTime')}</div>
          <div class="regional-prev-time" style="font-weight:bold;">${initialPreview.timeStr}</div>
          <div class="regional-lbl-date" style="color:#555;">${t('regional.previewShortDate')}</div>
          <div class="regional-prev-date" style="font-weight:bold;">${initialPreview.dateStr}</div>
          <div class="regional-lbl-curr" style="color:#555;">${t('regional.previewCurrency')}</div>
          <div class="regional-prev-curr" style="font-weight:bold;">${initialPreview.currStr}</div>
        </div>
      </fieldset>

      <div class="win-dialog-buttons" style="display:flex; justify-content:flex-end; gap:6px; margin-top:auto; padding-top:6px;">
        <button class="win-btn btn-regional-ok" style="font-weight:bold; min-width:75px;">${t('btn.ok')}</button>
        <button class="win-btn btn-regional-cancel" style="min-width:75px;">${t('btn.cancel')}</button>
        <button class="win-btn btn-regional-apply" style="min-width:75px;" disabled>${t('btn.apply')}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_regional_settings',
      title: t('regional.title'),
      icon: 'regional',
      width: 430,
      height: 420,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = dialog.element;
    const select = el.querySelector('.regional-lang-select');
    const prevTime = el.querySelector('.regional-prev-time');
    const prevDate = el.querySelector('.regional-prev-date');
    const prevCurr = el.querySelector('.regional-prev-curr');
    const btnOk = el.querySelector('.btn-regional-ok');
    const btnCancel = el.querySelector('.btn-regional-cancel');
    const btnApply = el.querySelector('.btn-regional-apply');

    const updateContentTexts = () => {
      const curT = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
      if (dialog && dialog.titleElement) {
        dialog.titleElement.textContent = curT('regional.title');
      }
      const tabTitle = el.querySelector('.regional-tab-title');
      if (tabTitle) tabTitle.textContent = curT('regional.tabRegional');
      const desc = el.querySelector('.regional-header-desc');
      if (desc) desc.textContent = curT('cpanel.regionalDesc');
      const fset1 = el.querySelector('.regional-fset-choose');
      if (fset1) fset1.textContent = curT('regional.chooseLang');
      const note = el.querySelector('.regional-note');
      if (note) note.textContent = curT('regional.note');
      const fset2 = el.querySelector('.regional-fset-preview');
      if (fset2) fset2.textContent = curT('regional.previewTitle');
      const lblTime = el.querySelector('.regional-lbl-time');
      if (lblTime) lblTime.textContent = curT('regional.previewTime');
      const lblDate = el.querySelector('.regional-lbl-date');
      if (lblDate) lblDate.textContent = curT('regional.previewShortDate');
      const lblCurr = el.querySelector('.regional-lbl-curr');
      if (lblCurr) lblCurr.textContent = curT('regional.previewCurrency');
      const optRu = select.querySelector('option[value="ru"]');
      if (optRu) optRu.textContent = curT('regional.langRu');
      const optEn = select.querySelector('option[value="en"]');
      if (optEn) optEn.textContent = curT('regional.langEn');
      btnOk.textContent = curT('btn.ok');
      btnCancel.textContent = curT('btn.cancel');
      btnApply.textContent = curT('btn.apply');
    };

    select.addEventListener('change', () => {
      selectedLang = select.value;
      const prev = getPreviewData(selectedLang);
      prevTime.textContent = prev.timeStr;
      prevDate.textContent = prev.dateStr;
      prevCurr.textContent = prev.currStr;
      const activeLang = window.i18n ? window.i18n.getLanguage() : 'ru';
      btnApply.disabled = (selectedLang === activeLang);
    });

    const apply = () => {
      if (window.i18n) {
        window.i18n.setLanguage(selectedLang);
      }
      updateContentTexts();
    };

    btnApply.addEventListener('click', () => {
      if (window.soundSys) window.soundSys.playClick();
      apply();
      btnApply.disabled = true;
    });

    btnOk.addEventListener('click', () => {
      const activeLang = window.i18n ? window.i18n.getLanguage() : 'ru';
      if (selectedLang !== activeLang) {
        apply();
      }
      window.winManager.closeWindow('app_regional_settings');
    });

    btnCancel.addEventListener('click', () => {
      window.winManager.closeWindow('app_regional_settings');
    });
  }

  openDisplayAdvancedDialog() {
    if (window.winManager && window.winManager.windows.has('app_disp_advanced')) {
      window.winManager.bringToTop('app_disp_advanced');
      return;
    }
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const html = `
      <div class="win-dialog-body" style="padding:10px;display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
        <div class="win-tabs">
          <div class="win-tab active" data-atab="gen">${isRu ? 'Общие' : 'General'}</div>
          <div class="win-tab" data-atab="adapter">${isRu ? 'Адаптер' : 'Adapter'}</div>
          <div class="win-tab" data-atab="monitor">${isRu ? 'Монитор' : 'Monitor'}</div>
          <div class="win-tab" data-atab="voodoo">3dfx Voodoo2</div>
        </div>
        <div class="win-tab-panel" style="flex:1;padding:12px;font-size:11px;">
          <div data-apane="gen">
            <fieldset style="border:1px groove #fff;padding:8px;margin-bottom:10px;">
              <legend>${isRu ? 'Экран' : 'Display'}</legend>
              <div>${isRu ? 'Размер шрифта:' : 'Font size:'}</div>
              <select class="win-select" style="width:100%;margin-top:4px;">
                <option selected>${isRu ? 'Мелкий шрифт (96 точек/дюйм)' : 'Small Fonts (96 dpi)'}</option>
                <option>${isRu ? 'Крупный шрифт (120 точек/дюйм)' : 'Large Fonts (120 dpi)'}</option>
              </select>
            </fieldset>
            <fieldset style="border:1px groove #fff;padding:8px;">
              <legend>${isRu ? 'Совместимость' : 'Compatibility'}</legend>
              <label style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><input type="radio" name="adv_compat" checked> ${isRu ? 'Применять новые параметры без перезагрузки' : 'Apply the new display settings without restarting'}</label>
              <label style="display:flex;align-items:center;gap:6px;"><input type="radio" name="adv_compat"> ${isRu ? 'Запрашивать перед применением новых параметров' : 'Ask me before applying the new display settings'}</label>
            </fieldset>
          </div>
          <div data-apane="adapter" style="display:none;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <div style="width:32px;height:32px;">${Icons['monitor']}</div>
              <div><b>S3 Trio64V2/DX + 3dfx Voodoo2 PCI</b></div>
            </div>
            <fieldset style="border:1px groove #fff;padding:8px;margin-bottom:10px;">
              <legend>${isRu ? 'Сведения об адаптере' : 'Adapter Information'}</legend>
              <div>${isRu ? 'Тип микросхемы' : 'Chip Type'}: S3 Trio64V2/DX (86C775) + 3dfx Voodoo2 (TMU×2)</div>
              <div>${isRu ? 'Тип ЦАП: S3 SDAC 24 бита' : 'DAC Type: S3 SDAC 24-bit'}</div>
              <div>${isRu ? 'Объем памяти: 4 МБ SGRAM + 12 МБ EDO (Voodoo2)' : 'Memory Size: 4 MB SGRAM + 12 MB EDO (Voodoo2)'}</div>
              <div>${isRu ? 'Частота обновления: 85 Гц (оптимальная)' : 'Refresh Rate: 85 Hz (Optimal)'}</div>
            </fieldset>
          </div>
          <div data-apane="monitor" style="display:none;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <div style="width:32px;height:32px;">${Icons['monitor']}</div>
              <div><b>SONY Trinitron Multiscan 17sfII (PnP)</b></div>
            </div>
            <label style="display:flex;align-items:center;gap:6px;margin-bottom:6px;"><input type="checkbox" checked> ${isRu ? 'Монитор соответствует стандарту Energy Star' : 'Monitor is Energy Star compliant'}</label>
            <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" checked> ${isRu ? 'Автоматически определять мониторы Plug and Play' : 'Automatically detect Plug & Play monitors'}</label>
          </div>
          <div data-apane="voodoo" style="display:none;">
            <div style="font-weight:bold;color:#000080;margin-bottom:8px;">${isRu ? 'Управление Glide и Direct3D для 3dfx Voodoo2' : '3dfx Voodoo2 Glide &amp; Direct3D Control'}</div>
            <label style="display:flex;align-items:center;gap:6px;margin-bottom:6px;"><input type="checkbox" checked> ${isRu ? 'Ждать вертикальной синхронизации (VSync)' : 'Wait for Vertical Sync (VSync)'}</label>
            <label style="display:flex;align-items:center;gap:6px;margin-bottom:6px;"><input type="checkbox" checked> ${isRu ? 'Билинейная фильтрация текстур' : 'Enable Bilinear Texture Filtering'}</label>
            <label style="display:flex;align-items:center;gap:6px;margin-bottom:6px;"><input type="checkbox" checked> ${isRu ? 'Мультитекстурирование за один проход (два TMU)' : 'Dual TMU Single-Pass Multitexturing'}</label>
            <div style="margin-top:8px;">${isRu ? 'Коррекция гаммы' : 'Gamma Correction'}: <b>1.30</b> (${isRu ? '85 Гц' : '85 Hz'})</div>
          </div>
        </div>
        <div class="win-dialog-footer" style="margin-top:8px;">
          <button class="win-btn default" id="adv-disp-ok">OK</button>
          <button class="win-btn" id="adv-disp-cancel">${isRu ? 'Отмена' : 'Cancel'}</button>
        </div>
      </div>
    `;
    const win = window.winManager.createWindow({
      id: 'app_disp_advanced',
      title: isRu ? 'Свойства: Монитор Plug and Play и 3dfx Voodoo2' : 'Plug and Play Monitor and 3dfx Voodoo2 Properties',
      icon: 'monitor',
      width: 380,
      height: 330,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: html
    });
    const el = win.element;
    el.querySelectorAll('.win-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.win-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        el.querySelectorAll('[data-apane]').forEach(p => {
          p.style.display = p.dataset.apane === tab.dataset.atab ? 'block' : 'none';
        });
      });
    });
    el.querySelector('#adv-disp-ok').addEventListener('click', () => window.winManager.closeWindow('app_disp_advanced'));
    el.querySelector('#adv-disp-cancel').addEventListener('click', () => window.winManager.closeWindow('app_disp_advanced'));
  }

  openWelcomeApp() {
    if (window.winManager && window.winManager.windows.has('app_welcome_win98')) {
      window.winManager.bringToTop('app_welcome_win98');
      return;
    }
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const items = [
      {
        id: 'register',
        label: isRu ? 'Регистрация' : 'Register Now',
        title: isRu ? 'Электронная регистрация Microslop Win 98' : 'Register Your Copy of Microslop Win 98',
        desc: isRu
          ? 'Зарегистрируйте вашу копию Microslop Win 98 Second Edition через модем и получайте уведомления об обновлениях драйверов и безопасности.'
          : 'Register your copy of Microslop Win 98 Second Edition online to receive product update notifications and technical support.',
        action: () => window.appIE && window.appIE.open('http://windowsupdate.microslop.com')
      },
      {
        id: 'internet',
        label: isRu ? 'Подключение к Интернету' : 'Connect to the Internet',
        title: isRu ? 'Выход во Всемирную паутину' : 'Get Connected to the Internet',
        desc: isRu
          ? 'Настройте модем USRobotics 56K Faxmodem в Удалённом доступе к сети или откройте обозреватель Internet Explorer.'
          : 'Set up your USRobotics 56K Faxmodem in Dial-Up Networking or launch Internet Explorer to browse the World Wide Web.',
        action: () => window.appDialUp && window.appDialUp.open()
      },
      {
        id: 'discover',
        label: isRu ? 'Знакомство с Win 98' : 'Discover Win 98',
        title: isRu ? 'Интерактивный обзор возможностей Win 98 SE' : 'Explore What Is New in Win 98 SE',
        desc: isRu
          ? 'Узнайте о новых возможностях рабочего стола Active Desktop, быстром запуске, поддержке USB, ускорении 3dfx Glide и мультимедиа.'
          : 'Take an interactive tour of Active Desktop, Quick Launch, USB support, 3dfx Glide acceleration, and built-in multimedia tools.',
        action: () => this.openHelp('whatsnew')
      },
      {
        id: 'maintain',
        label: isRu ? 'Обслуживание компьютера' : 'Maintain Your Computer',
        title: isRu ? 'Ускорение работы и проверка диска' : 'Keep Your Computer Running Smoothly',
        desc: isRu
          ? 'Настройте регулярную проверку диска ScanDisk, дефрагментацию и очистку диска с помощью Планировщика заданий.'
          : 'Use Disk Cleanup, ScanDisk, Disk Defragmenter, and Scheduled Tasks to keep your hard disk in top condition.',
        action: () => window.appSysTools && window.appSysTools.openCleanMgr()
      }
    ];

    let showOnStartup = false;
    try {
      showOnStartup = localStorage.getItem('win98_show_welcome') === '1';
    } catch (e) {}

    const html = `
      <div style="display:flex;flex-direction:column;height:100%;background:#ffffff;font-family:Tahoma,sans-serif;user-select:none;">
        <div style="height:68px;background:linear-gradient(90deg,#000080 0%,#1084d0 65%,#7ec0ee 100%);color:#ffffff;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:3px solid #ffb23a;">
          <div>
            <div style="font-size:11px;letter-spacing:1px;opacity:0.9;">Microslop</div>
            <div style="font-size:24px;font-weight:900;letter-spacing:-0.5px;">Win <span style="color:#ffb23a;font-size:18px;">98</span> <span style="font-size:11px;font-weight:normal;">Second Edition</span></div>
          </div>
          <div style="width:42px;height:42px;">${Icons['start-logo']}</div>
        </div>
        <div style="flex:1;display:flex;background:linear-gradient(180deg,#eef6ff 0%,#ffffff 100%);">
          <div style="width:185px;background:#d6e6f8;border-right:1px solid #9ab6d8;padding:12px 0;display:flex;flex-direction:column;gap:4px;">
            <div style="padding:0 14px 8px;font-size:11px;font-weight:bold;color:#000080;border-bottom:1px solid #b5cce8;">${isRu ? 'СОДЕРЖАНИЕ' : 'CONTENTS'}</div>
            ${items.map((it, i) => `
              <div class="welcome-nav-item" data-idx="${i}" style="padding:8px 14px;font-size:12px;font-weight:bold;color:${i === 0 ? '#ffffff' : '#000080'};background:${i === 0 ? '#000080' : 'transparent'};cursor:pointer;display:flex;align-items:center;justify-content:space-between;">
                <span>${it.label}</span>
                <span>▸</span>
              </div>
            `).join('')}
          </div>
          <div style="flex:1;padding:20px 24px;display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <div id="welcome-topic-title" style="font-size:16px;font-weight:bold;color:#000080;margin-bottom:10px;">${items[0].title}</div>
              <div id="welcome-topic-desc" style="font-size:12px;line-height:1.5;color:#222222;margin-bottom:18px;">${items[0].desc}</div>
              <button class="win-btn default" id="welcome-topic-run" style="padding:4px 16px;font-weight:bold;">${isRu ? 'Запустить ▸' : 'Launch ▸'}</button>
            </div>
            <div style="padding:10px;background:#f4f8fd;border:1px solid #c5d8ee;font-size:11px;color:#335;">
              <b>${isRu ? 'Совет дня:' : 'Tip of the Day:'}</b> ${isRu ? 'Нажмите Alt+Tab для быстрого переключения между открытыми программами или Win+E для запуска Проводника со списком папок.' : 'Press Alt+Tab to quickly switch between open programs, or Win+E to open Win Explorer with the Folders pane.'}
            </div>
          </div>
        </div>
        <div style="height:36px;background:#c0c0c0;border-top:1px solid #808080;display:flex;align-items:center;justify-content:space-between;padding:0 12px;font-size:11px;">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="checkbox" id="welcome-startup-chk" ${showOnStartup ? 'checked' : ''}>
            <span>${isRu ? 'Показывать это окно при каждой загрузке Win 98' : 'Show this screen each time Win 98 starts'}</span>
          </label>
          <button class="win-btn" id="welcome-close-btn" style="min-width:75px;">${isRu ? 'Закрыть' : 'Close'}</button>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_welcome_win98',
      title: isRu ? 'Добро пожаловать в Win 98' : 'Welcome to Win 98',
      icon: 'welcome',
      width: 520,
      height: 360,
      resizable: false,
      maximizable: false,
      content: html
    });
    const el = win.element;
    let activeIdx = 0;
    const titleEl = el.querySelector('#welcome-topic-title');
    const descEl = el.querySelector('#welcome-topic-desc');
    const navEls = el.querySelectorAll('.welcome-nav-item');

    const selectTopic = (idx) => {
      activeIdx = idx;
      navEls.forEach((n, i) => {
        n.style.background = i === idx ? '#000080' : 'transparent';
        n.style.color = i === idx ? '#ffffff' : '#000080';
      });
      titleEl.textContent = items[idx].title;
      descEl.textContent = items[idx].desc;
    };

    navEls.forEach((n, idx) => {
      n.addEventListener('mouseenter', () => selectTopic(idx));
      n.addEventListener('click', () => {
        selectTopic(idx);
        items[idx].action();
      });
    });

    el.querySelector('#welcome-topic-run').addEventListener('click', () => {
      if (items[activeIdx]) items[activeIdx].action();
    });

    const chk = el.querySelector('#welcome-startup-chk');
    if (chk) {
      chk.addEventListener('change', () => {
        try {
          localStorage.setItem('win98_show_welcome', chk.checked ? '1' : '0');
        } catch (e) {}
      });
    }

    el.querySelector('#welcome-close-btn').addEventListener('click', () => {
      window.winManager.closeWindow('app_welcome_win98');
    });
  }
}

window.appDialogs = new AppDialogs();
window.AppDialogs = AppDialogs;

window.appRunDialog = {
  open: () => window.appDialogs && window.appDialogs.openRunDialog(),
  executeCommand: (cmd) => window.appDialogs && window.appDialogs.executeRunCommand(cmd)
};
