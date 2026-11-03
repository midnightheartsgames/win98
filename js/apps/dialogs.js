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
      { id: 'intro', title: L('Знакомство с Win 98', 'Introducing Win 98'), topics: ['welcome', 'whatsnew', 'startup', 'clippy', 'about'] },
      { id: 'basics', title: L('Основы работы', 'Exploring Your Computer'), topics: ['desktop', 'startmenu', 'explorer', 'shortcuts'] },
      { id: 'programs', title: L('Программы', 'Using Programs'), topics: ['install', 'apps', 'multimedia', 'internet'] },
      { id: 'settings', title: L('Настройка компьютера', 'Customizing Your Computer'), topics: ['cpanel'] },
      { id: 'maintenance', title: L('Обслуживание и неполадки', 'Maintenance and Troubleshooting'), topics: ['system', 'run', 'troubleshooting'] }
    ];

    const titles = {
      welcome: L('Добро пожаловать', 'Welcome'),
      whatsnew: L('Что нового в системе', 'What’s New in the System'),
      startup: L('Запуск системы и первые минуты', 'Starting the System'),
      clippy: L('Помощник Скрепыш', 'Clippy the Office Assistant'),
      about: L('О системе Win 98 SE', 'About Win 98 SE'),
      desktop: L('Рабочий стол и окна', 'The Desktop and Windows'),
      startmenu: L('Меню «Пуск» и панель задач', 'The Start Menu and Taskbar'),
      explorer: L('Мой компьютер, Проводник и поиск', 'My Computer, Explorer, and Find'),
      shortcuts: L('Сочетания клавиш', 'Keyboard Shortcuts'),
      install: L('Установка программ и игр: Steam, диск, SoftStore', 'Installing Programs and Games'),
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
          <p>${L('Эта справка описывает систему в её текущем состоянии: запуск, BIOS и меню загрузки, рабочий стол и окна, меню «Пуск» и панель задач, Проводник и поиск файлов, установку программ и игр (Steam, SoftStore \'98, компакт-диск «Игромания»), стандартные и прикладные программы, мультимедиа, Интернет, все 21 значок Панели управления, служебные утилиты, команду «Выполнить», сеанс MS-DOS, помощника Скрепыша и устранение неполадок.', 'This Help describes the system in its current state: startup, BIOS and the boot menu, the desktop and windows, the Start menu and taskbar, Explorer and file search, installing programs and games (Steam, SoftStore \'98, the Igromania CD), accessories and applications, multimedia, Internet tools, all 21 Control Panel items, system utilities, the Run command, the MS-DOS Prompt, Clippy the Office Assistant, and troubleshooting.')}</p>
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
            L('Кнопки <b>Назад</b> и <b>Вперед</b> на панели инструментов возвращают к просмотренным разделам, <b>Домой</b> открывает эту страницу, а <b>Печать</b> отправляет текущую страницу на печать.', 'The <b>Back</b> and <b>Forward</b> buttons move through topics you have already viewed, <b>Home</b> returns to this page, and <b>Print</b> prints the current page.'),
            L('Кнопка <b>Скрыть</b> убирает левую панель навигации, чтобы освободить место для текста; кнопка <b>Показать</b> возвращает её.', 'The <b>Hide</b> button removes the left navigation pane to make room for text; <b>Show</b> brings it back.'),
            L('Нажмите ' + key('F1') + ' на рабочем столе (когда нет активного окна): помощник Скрепыш откроет поиск по вопросам на естественном языке. Если помощник скрыт или отключен, ' + key('F1') + ' открывает эту справку. Эту справку открывают также пункт «Справка» в меню «Пуск», меню «Справка» программ и кнопка ' + key('?') + ' в заголовке некоторых окон «Свойства».', 'Press ' + key('F1') + ' on the desktop (when no window is active) and Clippy the Office Assistant opens a natural-language question search. When the assistant is hidden or turned off, ' + key('F1') + ' opens this Help. Help also opens from Start → Help, from the Help menu of programs, and from the ' + key('?') + ' button in the title bar of some Properties windows.')
          ])}
          ${related('whatsnew', 'startup', 'install', 'clippy', 'cpanel', 'desktop')}
        `
      },
      {
        id: 'whatsnew',
        keywords: L('новое, обновление, лаунчер, steam, игромания, быстрый запуск, alt+tab, active desktop, панель каналов, свойства папки, свойства файла, архивация, сообщение об ошибке, f10, панель управления, netscape, emu-land, hearts, bios, язык', 'new, update, launcher, steam, igromania, quick launch, alt+tab, active desktop, channel bar, folder options, file properties, backup, bug report, f10, control panel, netscape, emu-land, hearts, bios, language'),
        content: `
          <h2>${titles.whatsnew}</h2>
          <p>${L('Оболочка, Панель управления и системные службы приведены к виду и поведению Microslop Win 98 Second Edition. Ниже перечислено главное, что есть в системе сейчас.', 'The shell, Control Panel, and system services match the look and behavior of Microslop Win 98 Second Edition. Below is what the system offers today.')}</p>
          <h3>${L('Запуск, установка и обновления', 'Startup, installation, and updates')}</h3>
          <ul>
            <li>${L('Меню загрузки <b>F8</b> с пятью вариантами (обычная, протоколирование, безопасный режим, пошаговое подтверждение, командная строка) и настоящий экран POST с входом в <b>CMOS Setup Utility</b>.', 'The <b>F8</b> startup menu with five choices (normal, logged, safe mode, step-by-step, command prompt) and a full POST screen with entry to the <b>CMOS Setup Utility</b>.')}</li>
            <li>${L('Игры и крупные программы не установлены заранее: их покупают и скачивают в клиенте <b>Steam</b>, берут на компакт-диске «Игромания» (D:) или в каталоге <b>SoftStore \'98</b>. На первом запуске установлены только Сапер и WinAmp.', 'Games and large programs are not preinstalled: you buy and download them in the <b>Steam</b> client, take them from the Igromania CD (D:), or get them from the <b>SoftStore \'98</b> catalog. Only Minesweeper and WinAmp are installed at first start.')}</li>
            <li>${L('Win98.exe открывает <b>лаунчер</b>: он показывает новости и изменения версий и ставит обновления, скачивая только изменённые файлы. Сохранения при обновлении не меняются.', 'Win98.exe opens the <b>launcher</b>: it shows news and version changes and installs updates by downloading only the changed files. Saves never change on update.')}</li>
          </ul>
          <h3>${L('Рабочий стол, Проводник и окна', 'Desktop, Explorer, and windows')}</h3>
          <ul>
            <li>${L('Переключение окон по ' + key('Alt+Tab') + ', быстрые клавиши ' + key('Win+E') + ', ' + key('Win+R') + ', ' + key('Win+D') + ', панель <b>Быстрый запуск</b>, автоскрытие панели задач и расстановка окон каскадом и плиткой.', 'Window switching with ' + key('Alt+Tab') + ', the ' + key('Win+E') + ', ' + key('Win+R') + ', and ' + key('Win+D') + ' shortcuts, the <b>Quick Launch</b> bar, taskbar auto-hide, and cascade or tile window layouts.')}</li>
            <li>${L('<b>Active Desktop</b> с панелью каналов, перетаскивание значков рабочего стола в любое место с запоминанием положения, Корзина с восстановлением файлов.', '<b>Active Desktop</b> with a channel bar, desktop icons you can drag anywhere with the position remembered, and a Recycle Bin that restores files.')}</li>
            <li>${L('Проводник с панелью папок, четырьмя видами, меню «Отправить», окном <b>«Свойства папки»</b>, свойствами файлов и дисков, форматированием дискеты A: и Сетевым окружением.', 'Explorer with a Folders pane, four view modes, the Send To menu, the <b>Folder Options</b> dialog, file and drive properties, floppy formatting for drive A:, and Network Neighborhood.')}</li>
            <li>${L('Системные значки отрисованы попиксельно в палитре Win 98 отдельно для размеров 32×32 и 16×16; выделенный значок покрывается синей сеткой, а ярлыки отмечены стрелкой', 'System icons are drawn pixel by pixel in the Win 98 palette with separate 32×32 and 16×16 versions; selected icons use a blue dither pattern and shortcuts carry the arrow')} ${glyph('shortcut-overlay')}.</li>
          </ul>
          <h3>${L('Панель управления и настройка', 'Control Panel and customization')}</h3>
          <ul>
            <li>${L('В Панели управления <b>21 значок</b>: добавились Звук, Клавиатура, Шрифты, Принтеры, Сеть, Специальные возможности, Игровые устройства, Модемы, Пароли, Пользователи и Назначенные задания.', 'Control Panel now holds <b>21 items</b>: Sounds, Keyboard, Fonts, Printers, Network, Accessibility Options, Game Controllers, Modems, Passwords, Users, and Scheduled Tasks were added.')}</li>
            <li>${L('«Свойства: Экран» получили шесть вкладок (Фон, Заставка, Оформление, Эффекты, Темы Plus!, Настройка) и заставки «Объемный лабиринт» и «Объемный текст».', 'Display Properties has six tabs (Background, Screen Saver, Appearance, Effects, Plus! Themes, Settings) and the 3D Maze and 3D Text screen savers.')}</li>
            <li>${L('Язык интерфейса переключается русский / английский мгновенно, индикатором <span class="win-help-lang">Ru</span> / <span class="win-help-lang">En</span> в трее.', 'The interface language switches between Russian and English instantly with the <span class="win-help-lang">Ru</span> / <span class="win-help-lang">En</span> indicator in the tray.')}</li>
          </ul>
          <h3>${L('Служебные программы', 'System tools')}</h3>
          <ul>
            <li>${L('<b>Архивация данных</b> сохраняет и восстанавливает файлы, настройки, покупки и сохранения игр и возвращает систему к первому запуску.', '<b>Backup</b> saves and restores files, settings, purchases, and game saves, and returns the system to its first start.')}</li>
            <li>${L('<b>Сообщение об ошибке</b> по ' + key('F10') + ' (в любой программе ' + key('Ctrl+F10') + '): снимок экрана, место ошибки и отправка разработчику; «Мои отчёты» показывают, что с ними стало.', '<b>Report a Problem</b> on ' + key('F10') + ' (' + key('Ctrl+F10') + ' in any program): a screenshot, the place of the error, and sending to the developer; My Problem Reports shows what happened to them.')}</li>
            <li>${L('Сведения о системе, Проверка системных файлов, Проверка реестра, Назначенные задания, DriveSpace, Системный монитор, Редактор реестра и окно «Добро пожаловать в Win 98».', 'System Information, System File Checker, Registry Checker, Scheduled Tasks, DriveSpace, System Monitor, Registry Editor, and the Welcome to Win 98 window.')}</li>
          </ul>
          <h3>${L('Программы и связь', 'Programs and communications')}</h3>
          <ul>
            <li>${L('<b>Netscape 6</b> открывает настоящий Интернет, пересобирая страницы под веб 1998 года (нужен локальный сервер проекта; в Win98.exe он встроен).', '<b>Netscape 6</b> opens the real Internet by rebuilding pages as 1998-style Web 1.0 (it needs the project\'s local server, which is built into Win98.exe).')}</li>
            <li>${L('Эмулятор <b>Emu-Land 98</b> (Dendy, Sega, SNES, Game Boy), пасьянс <b>Червы</b> с тремя соперниками, HyperTerminal с четырьмя станциями BBS, mIRC, ICQ и Outlook Express с живыми ответами.', 'The <b>Emu-Land 98</b> emulator (NES, Sega, SNES, Game Boy), the <b>Hearts</b> card game with three opponents, HyperTerminal with four BBS stations, mIRC, ICQ, and Outlook Express with scripted replies.')}</li>
            <li>${L('Помощник <b>Скрепыш</b> отвечает на вопросы, пишет письма, реагирует на программы и сайты и рассказывает историю.', 'Clippy the <b>Office Assistant</b> answers questions, drafts letters, reacts to programs and sites, and tells a story.')}</li>
          </ul>
          ${related('startup', 'install', 'cpanel', 'desktop', 'startmenu', 'explorer')}
        `
      },
      {
        id: 'startup',
        keywords: L('запуск, загрузка, post, bios, cmos, setup, del, f2, f8, меню загрузки, безопасный режим, протоколирование, bootlog, командная строка, первый запуск, значки, трей, по умолчанию, начальное состояние, лаунчер, win98.exe', 'startup, boot, post, bios, cmos, setup, del, f2, f8, startup menu, safe mode, bootlog, command prompt, first start, icons, tray, defaults, initial state, launcher, win98.exe'),
        content: `
          <h2>${titles.startup}</h2>
          <p>${L('После включения и после перезагрузки система проходит три этапа: экран POST BIOS, логотип Win 98 с загрузочным звуком и рабочий стол. Если вы запускаете Win98.exe, сначала открывается лаунчер обновлений, а система стартует после кнопки «Запустить Win 98».', 'After power-on and after every restart the system goes through three stages: the BIOS POST screen, the Win 98 logo with the startup sound, and the desktop. If you start Win98.exe, the update launcher opens first and the system starts after you click Launch Win 98.')}</p>
          <h3>${L('Экран POST и BIOS', 'The POST screen and BIOS')}</h3>
          <ul>
            <li>${L('Award Modular BIOS v4.51PG показывает счётчик памяти, определение дисков IDE и таблицу устройств PCI.', 'Award Modular BIOS v4.51PG shows the memory counter, IDE drive detection, and the PCI device table.')}</li>
            <li>${key('Del')} / ${key('F2')} — ${L('войти в <b>CMOS Setup Utility</b>;', 'enter the <b>CMOS Setup Utility</b>;')} ${key('Esc')} — ${L('пропустить проверку памяти;', 'skip the memory test;')} ${key('Space')} / ${key('Enter')} — ${L('закончить POST и загружаться сразу.', 'finish POST and boot right away.')}</li>
            <li>${L('В BIOS Setup работают стрелки, ' + key('Enter') + ', ' + key('Esc') + ', ' + key('PgUp') + '/' + key('PgDn') + ' или ' + key('+') + '/' + key('-') + ', ' + key('F1') + ' (подсказка к пункту) и ' + key('F10') + ' (сохранить и выйти). Можно менять частоту шины и множитель процессора, объем ОЗУ, порядок загрузки (A:, C:, CD-ROM) и пароль BIOS. Если ни одно устройство не загружается, BIOS пишет «DISK BOOT FAILURE».', 'BIOS Setup uses the arrow keys, ' + key('Enter') + ', ' + key('Esc') + ', ' + key('PgUp') + '/' + key('PgDn') + ' or ' + key('+') + '/' + key('-') + ', ' + key('F1') + ' (item help), and ' + key('F10') + ' (save and exit). You can change the CPU bus clock and multiplier, the RAM size, the boot order (A:, C:, CD-ROM), and the BIOS password. If no device can boot, the BIOS prints DISK BOOT FAILURE.')}</li>
          </ul>
          <h3>${L('Меню загрузки (F8)', 'The startup menu (F8)')}</h3>
          <p>${L('Нажмите ' + key('F8') + ' во время POST или пока показан логотип. Появится «Меню загрузки Microslop Win 98» с отсчётом 30 секунд; выбирайте пункт стрелками или клавишами ' + key('1') + '–' + key('5') + ' и нажимайте ' + key('Enter') + '.', 'Press ' + key('F8') + ' during POST or while the logo is shown. The Microslop Win 98 Startup Menu appears with a 30-second countdown; choose with the arrow keys or ' + key('1') + '–' + key('5') + ' and press ' + key('Enter') + '.')}</p>
          <table class="win-help-table">
            <tr><th>${L('Пункт', 'Choice')}</th><th>${L('Что происходит', 'What happens')}</th></tr>
            <tr><td>1. ${L('Обычная загрузка', 'Normal')}</td><td>${L('Обычный запуск системы.', 'A normal start.')}</td></tr>
            <tr><td>2. ${L('Протоколирование', 'Logged')}</td><td>${L('Обычный запуск, при этом в <code>C:\\BOOTLOG.TXT</code> записывается журнал загрузки.', 'A normal start that also writes the boot log to <code>C:\\BOOTLOG.TXT</code>.')}</td></tr>
            <tr><td>3. ${L('Безопасный режим', 'Safe mode')}</td><td>${L('Чёрный рабочий стол без обоев, надпись «Безопасный режим» в углах экрана, помощник скрыт. Выйти из режима можно перезагрузкой.', 'A black desktop without wallpaper, the words Safe Mode in the screen corners, and the assistant hidden. Restart to leave the mode.')}</td></tr>
            <tr><td>4. ${L('Пошаговое подтверждение', 'Step-by-step confirmation')}</td><td>${L('Загрузка проходит как обычно.', 'The system boots as usual.')}</td></tr>
            <tr><td>5. ${L('Только командная строка', 'Command prompt only')}</td><td>${L('Полноэкранный режим MS-DOS.', 'Full-screen MS-DOS mode.')}</td></tr>
          </table>
          <h3>${L('Что вы увидите при первом запуске', 'What you see at first start')}</h3>
          <ul>
            <li>${L('<b>Рабочий стол</b> (22 значка): Мой компьютер, Мои документы, Сетевое окружение, Корзина, Internet Explorer, Netscape 6, Блокнот, Paint, Калькулятор, Сапер, Пасьянс «Косынка», 3D Pinball, ICQ 98a, Outlook Express, Удаленный доступ к сети, WinRAR 2.x, Солитер (FreeCell), WordPad, Neko 98, Архивация данных, WinAmp 98 и Игромания (D:).', '<b>The desktop</b> (22 icons): My Computer, My Documents, Network Neighborhood, Recycle Bin, Internet Explorer, Netscape 6, Notepad, Paint, Calculator, Minesweeper, Solitaire, 3D Pinball, ICQ 98a, Outlook Express, Dial-Up Networking, WinRAR 2.x, FreeCell, WordPad, Neko 98, Backup, WinAmp 98, and Igromania (D:).')}</li>
            <li>${L('<b>Панель задач</b>: кнопка «Пуск», панель «Быстрый запуск» (Показать рабочий стол, Internet Explorer, Outlook Express) и область уведомлений со значками ICQ, языка, динамика, ЭЛТ-монитора, привода CD-ROM, Скрепыша, модемного соединения и часами.', '<b>The taskbar</b>: the Start button, the Quick Launch bar (Show Desktop, Internet Explorer, Outlook Express), and a notification area with the ICQ, language, speaker, CRT monitor, CD-ROM, Clippy, dial-up connection icons and the clock.')}</li>
            <li>${L('<b>Что установлено</b>: из игр и крупных программ только Сапер, Безмятежность и WinAmp 98 Pro. Всё остальное устанавливается из Steam, с компакт-диска или из SoftStore \'98.', '<b>What is installed</b>: of the games and large programs only Minesweeper, Bliss and WinAmp 98 Pro. Everything else is installed from Steam, from the CD, or from SoftStore \'98.')}</li>
            <li>${L('<b>Компакт-диск</b>: в приводе D: уже вставлен диск «Игромания» за сентябрь 1998 года.', '<b>CD-ROM</b>: the Igromania CD for September 1998 is already inserted in drive D:.')}</li>
            <li>${L('<b>Сеть</b>: модемное соединение «МТУ-Интел» уже установлено, сайты открываются сразу. Отключить его можно в Удаленном доступе к сети или через значок в трее.', '<b>Network</b>: the MTU-Intel dial-up connection is already up and sites open at once. Disconnect it in Dial-Up Networking or from the tray icon.')}</li>
            <li>${L('<b>Настройки по умолчанию</b>: эффект ЭЛТ-монитора включен, заставка «Трубы 3D» запускается через 3 минуты, схема питания «Всегда включен», громкость 80%.', '<b>Default settings</b>: the CRT monitor effect is on, the 3D Pipes screen saver starts after 3 minutes, the power scheme is Always On, and the volume is 80%.')}</li>
            <li>${L('<b>Скрепыш</b> здоровается примерно через 3 секунды после загрузки; при первой встрече он представляется, а «Совет дня» появляется раз в день.', '<b>Clippy</b> greets you about 3 seconds after startup; he introduces himself the first time, and the Tip of the Day appears once a day.')}</li>
          </ul>
          ${note([
            L('Окно «Добро пожаловать в Win 98» само не открывается: его можно вызвать из «Пуск» → «Программы» → «Стандартные» → «Служебные» или командой <code>welcome</code>.', 'The Welcome to Win 98 window does not open by itself: open it from Start → Programs → Accessories → System Tools or with the <code>welcome</code> command.'),
            L('Настройки, файлы, установленные программы и покупки сохраняются между запусками. Резервную копию и возврат к первому запуску делает «Архивация данных».', 'Settings, files, installed programs, and purchases are kept between sessions. Backup makes a backup copy and returns the system to its first start.')
          ])}
          ${shortcut('bios-setup', L('Щелкните здесь, чтобы открыть CMOS Setup Utility (BIOS).', 'Click here to open the CMOS Setup Utility (BIOS).'))}
          ${related('troubleshooting', 'startmenu', 'install', 'system')}
        `
      },
      {
        id: 'clippy',
        keywords: L('скрепыш, помощник, скрепка, clippy, совет, лампочка, вопрос, мастер писем, шеф идет, boss key, викторина, гардероб, параметры помощника, коллекция, f1, история, icq', 'clippy, assistant, paperclip, tip, light bulb, question, letter wizard, boss key, quiz, wardrobe, assistant options, gallery, f1, story, icq'),
        content: `
          <h2>${titles.clippy}</h2>
          <p>${L('Интерактивный помощник <b>Скрепыш</b> (Microslop Agent, <code>clippy.exe</code>) живет в правом нижнем углу экрана и в области уведомлений. Он отвечает на вопросы по системе, дает советы по тому, что вы делаете, помогает составлять письма и реагирует на программы, игры и сайты.', '<b>Clippy</b> the Office Assistant (Microslop Agent, <code>clippy.exe</code>) lives in the bottom-right corner of the screen and in the notification area. He answers questions about the system, gives tips about what you are doing, helps draft letters, and reacts to programs, games, and web sites.')}</p>
          <h3>${L('Возможности Скрепыша', 'What Clippy can do')}</h3>
          <ul>
            <li>${L('<b>Поиск ответов (' + key('F1') + ')</b> — нажмите ' + key('F1') + ' на рабочем столе или выберите «Что вы хотите сделать?» в меню Скрепыша, введите вопрос своими словами (например, «как сменить обои», «где скачанные файлы» или название игры). Ответ содержит кнопку, которая открывает нужную программу, сайт или раздел справки. Те же ответы он дает в ICQ (контакт «Скрепыш», UIN 199898) и в сеансе MS-DOS по команде <code>clippy вопрос</code>.', '<b>Question search (' + key('F1') + ')</b> — press ' + key('F1') + ' on the desktop or choose What would you like to do? in Clippy\'s menu and type a question in plain words (such as how to change wallpaper, where downloads go, or a game title). The answer has a button that opens the right program, site, or Help topic. He gives the same answers in ICQ (the Clippy contact, UIN 199898) and in the MS-DOS Prompt with <code>clippy question</code>.')}</li>
            <li>${L('<b>Советы</b> — если рядом с ним мигает лампочка (и значок скрепки в трее), у него есть совет по вашей работе; щелкните лампочку, когда будет время. В «Параметрах помощника» лампочку можно заменить всплывающим окном. Раз в день он показывает «Совет дня».', '<b>Tips</b> — when a light bulb blinks next to him (and on the paperclip tray icon), he has a tip about your work; click the bulb when you have time. In Assistant Options the bulb can be replaced with a pop-up balloon. Once a day he shows the Tip of the Day.')}</li>
            <li>${L('<b>Мастер писем</b> — появляется, когда текст в Блокноте или WordPad начинается со слов «Уважаемый», «Привет», «Дорогая» и подобных, а также в новом письме Outlook Express. Он задает три вопроса (кому, по какому поводу, в каком тоне) и вставляет готовое письмо. В меню «Помоги мне с одним делом» есть шаблоны: отпуск, любовное письмо, объяснительная, резюме.', '<b>Letter Wizard</b> — appears when text in Notepad or WordPad starts with words like Dear, Hello, or Hi, and in a new Outlook Express message. It asks three questions (recipient, subject, tone) and inserts a finished letter. The Help me with something menu has templates: vacation, love letter, explanatory note, résumé.')}</li>
            <li>${L('<b>«Шеф идёт!» (Boss Key)</b> — пункт меню Скрепыша сворачивает все окна игр и открывает таблицу «Расходы по категориям» в Microslop Excel 97.', '<b>Boss Key</b> — a command in Clippy\'s menu minimizes all game windows and opens the Expense Category sheet in Microslop Excel 97.')}</li>
            <li>${L('<b>Беседы и игры</b> — щелчок по Скрепышу открывает меню «Поговорить»: вопрос, «Как дела», рассказ о себе, сплетни о коллегах, «Камень, ножницы, бумага», загадки и советы. «Ретро-Викторина 1998» из пяти вопросов запускается из его контекстного меню; за безошибочный результат он получает Золотую корону и очки.', '<b>Chat and games</b> — clicking Clippy opens the Talk menu: a question, How are you, about himself, gossip about colleagues, Rock-Paper-Scissors, riddles, and advice. The five-question 1998 Retro Quiz starts from his context menu; a perfect score earns the Golden Crown and sunglasses.')}</li>
            <li>${L('<b>Гардероб</b> — на сайте <code>www.clippy98.com</code> бесплатно скачиваются 43 предмета: шляпы, очки, усы и борода, галстуки, аксессуары. Файлы попадают в папку Downloads, а Скрепыш сразу надевает обновку; кнопка «Примерить» позволяет посмотреть до загрузки.', '<b>Wardrobe</b> — at <code>www.clippy98.com</code> you can download 43 free items: hats, glasses, mustaches and beards, ties, and accessories. The files go to the Downloads folder and Clippy puts the item on right away; the Try On button lets you preview before downloading.')}</li>
            <li>${L('<b>История</b> — в разговорах со временем открываются девять глав про Скрепыша; одна из них создает файл «Письмо от Скрепыша.txt» в «Моих документах».', '<b>Story</b> — over time his conversations unlock nine chapters about Clippy; one of them writes the file Letter from Clippy.txt into My Documents.')}</li>
          </ul>
          <h3>${L('Параметры помощника', 'Assistant Options')}</h3>
          <p>${L('Откройте окно «Помощник Office» через контекстное меню Скрепыша. Вкладка <b>«Коллекция»</b> показывает всех десять персонажей Office (Clippit, Dot, Genius, Hoverbot, Office Logo, Mother Nature, Power Pup, Scribble, Will и Rocky), но сменить героя можно только после установки с диска Office 97. На вкладке <b>«Параметры»</b> настраиваются показ помощника, F1, мастер писем, комментарии к программам и сайтам, звуки, лампочка или всплывающие советы, совет дня и разговорчивость (спокойная, обычная, полный хаос). Настройки видны в реестре: <code>HKEY_CURRENT_USER\\Software\\Microslop\\Office\\8.0\\Common\\Assistant</code>.', 'Open the Office Assistant window from Clippy\'s context menu. The <b>Gallery</b> tab shows all ten Office characters (Clippit, Dot, Genius, Hoverbot, Office Logo, Mother Nature, Power Pup, Scribble, Will, and Rocky), but you can switch characters only after installing from the Office 97 CD. The <b>Options</b> tab sets whether the assistant is shown, F1, the Letter Wizard, comments on programs and sites, sounds, light bulb or balloon tips, the tip of the day, and chattiness (quiet, normal, full chaos). The settings are visible in the Registry: <code>HKEY_CURRENT_USER\\Software\\Microslop\\Office\\8.0\\Common\\Assistant</code>.')}</p>
          ${shortcut('clippy', L('Щелкните здесь, чтобы позвать Скрепыша.', 'Click here to summon Clippy.'))}
          ${note([
            L('Значок скрепки в трее: один щелчок прячет или показывает Скрепыша, двойной щелчок зовёт его, а правая кнопка открывает меню команд. Конверт на значке означает письмо от помощника, лампочка — совет.', 'The paperclip tray icon: a single click hides or shows Clippy, a double-click summons him, and the right button opens the command menu. An envelope on the icon means a letter from the assistant, a bulb means a tip.'),
            L('Скрепыша можно перетаскивать мышью; он прилипает к заголовкам окон и уворачивается, когда вы щелкаете там, где он стоит.', 'You can drag Clippy with the mouse; he snaps to window title bars and steps aside when you click where he stands.'),
            L('Спрятать его можно командой «Спрятать (в трей)», снятием флажка «Показывать помощника» в параметрах, снятием флажка ClippyOffice в «Настройке системы» или завершением <code>clippy.exe</code> в Диспетчере задач. Вернуть: щелчок по значку в трее или команда <code>clippy</code> в окне «Выполнить».', 'To put him away use Hide (to tray), clear Show the Office Assistant in Options, clear ClippyOffice in System Configuration, or end <code>clippy.exe</code> in Task Manager. To bring him back, click the tray icon or type <code>clippy</code> in the Run box.'),
            L('Полностью удалить Скрепыша нельзя: пакет <b>Microslop Office 97</b> в «Установке и удалении программ» предлагает только оставить его, восстановить шаблоны писем или временно спрятать.', 'Clippy cannot be removed completely: the <b>Microslop Office 97</b> package in Add/Remove Programs only offers to keep him, repair the letter templates, or hide him for now.')
          ])}
          ${related('welcome', 'apps', 'shortcuts', 'cpanel')}
        `
      },
      {
        id: 'about',
        keywords: L('о системе, версия, winver, сведения, лицензия, сборка, 4.10.1998, процессор, память, лаунчер', 'about, version, winver, information, license, build, 4.10.1998, processor, memory, launcher'),
        content: `
          <h2>Microslop Win 98 Second Edition</h2>
          <p><b>${L('Версия 4.10.1998 A (Сборка 2222 A)', 'Version 4.10.1998 A (Build 2222 A)')}</b></p>
          <p>${L('Интерактивная среда Microslop Win 98 SE воспроизводит оконный менеджер, виртуальную файловую систему с дисками A:, C: и D:, Панель управления, стандартные и прикладные программы, мультимедийный стек, модемное подключение, локальную сеть сайтов 1998 года, реестр, сеанс MS-DOS, BIOS и меню загрузки.', 'This interactive Microslop Win 98 SE environment reproduces the window manager, the virtual file system with drives A:, C:, and D:, Control Panel, accessories and applications, a multimedia stack, dial-up networking, 1998 web sites, the Registry, the MS-DOS Prompt, BIOS Setup, and the startup menu.')}</p>
          <p>${L('Интерфейс работает на русском и английском языках. Переключить язык можно индикатором в области уведомлений (<span class="win-help-lang">Ru</span> / <span class="win-help-lang">En</span>) или в апплете «Язык и стандарты» Панели управления. Не все сайты и игры переведены: часть из них остаётся только на русском языке.', 'The interface operates in Russian and English. Switch the language at any time with the indicator in the notification area (<span class="win-help-lang">Ru</span> / <span class="win-help-lang">En</span>) or in the Regional Settings applet of Control Panel. Not every site and game is translated: some of them stay in Russian only.')}</p>
          <p>${L('В окне «О программе Win» внизу показана строка «Сборка проекта» с номером версии, которую нужно называть при обращении к разработчику.', 'The About Win window shows a Project build line at the bottom with the version number to quote when you contact the developer.')}</p>
          ${shortcut('winver', L('Щелкните здесь, чтобы открыть окно «О программе Win».', 'Click here to open the About Win dialog.'))}
          ${shortcut('sysdm.cpl', L('Щелкните здесь, чтобы посмотреть сведения о системе и оборудовании.', 'Click here to view system and hardware properties.'))}
          ${related('welcome', 'whatsnew', 'startup', 'cpanel')}
        `
      },
      {
        id: 'desktop',
        keywords: L('рабочий стол, окна, значки, ярлык, свернуть, развернуть, закрыть, системное меню, размер, перемещение, корзина, crt, обои, восстановить, каскад, active desktop, панель каналов, диалог, alt+tab', 'desktop, windows, icons, shortcut, minimize, maximize, close, system menu, resize, move, recycle bin, crt, wallpaper, restore, cascade, active desktop, channel bar, dialog, alt+tab'),
        content: `
          <h2>${titles.desktop}</h2>
          <p>${L('Каждая программа открывается в собственном окне. В строке заголовка расположены значок программы, название окна и кнопки управления. У некоторых окон «Свойства» слева от кнопки закрытия есть кнопка ' + key('?') + ', открывающая справку.', 'Every program runs in its own window. The title bar holds the program icon, the window title, and the control buttons. Some Properties windows also have a ' + key('?') + ' button next to Close that opens Help.')}</p>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph"><span class="win-help-caption">${icon('cap-min')}</span></td><td>${L('<b>Свернуть</b> — убирает окно с экрана. Кнопка программы остается на панели задач.', '<b>Minimize</b> hides the window from the screen while keeping its button on the taskbar.')}</td></tr>
            <tr><td class="win-help-table-glyph"><span class="win-help-caption">${icon('cap-max')}</span></td><td>${L('<b>Развернуть</b> — распахивает окно во весь экран до панели задач.', '<b>Maximize</b> expands the window to fill the screen above the taskbar.')}</td></tr>
            <tr><td class="win-help-table-glyph"><span class="win-help-caption">${icon('cap-restore')}</span></td><td>${L('<b>Восстановить</b> — возвращает развернутому окну прежний размер и положение.', '<b>Restore</b> returns a maximized window to its previous size and position.')}</td></tr>
            <tr><td class="win-help-table-glyph"><span class="win-help-caption">${icon('cap-close')}</span></td><td>${L('<b>Закрыть</b> — завершает работу с окном или программой.', '<b>Close</b> closes the window or quits the program.')}</td></tr>
          </table>
          <h3>${L('Как переместить окно, изменить его размер или переключиться между окнами', 'To move or resize a window, or to switch between windows')}</h3>
          <ol>
            <li>${L('Чтобы переместить окно, перетащите его за строку заголовка. Окно нельзя вытащить за экран целиком: заголовок всегда остается на виду.', 'To move a window, drag its title bar. A window cannot be dragged off the screen completely: its title bar always stays in view.')}</li>
            <li>${L('Чтобы изменить размер, потяните за любую границу или угол окна.', 'To resize a window, drag any border or corner.')}</li>
            <li>${L('Дважды щелкните заголовок, чтобы развернуть окно или вернуть ему прежний размер.', 'Double-click the title bar to maximize the window or restore its previous size.')}</li>
            <li>${L('Нажмите ' + key('Alt+Tab') + ': появится полоса со значками окон, повторные нажатия выбирают следующее окно (с ' + key('Shift') + ' — предыдущее), а отпускание ' + key('Alt') + ' переключает на выбранное.', 'Press ' + key('Alt+Tab') + ': a strip of window icons appears, repeated presses choose the next window (with ' + key('Shift') + ' the previous one), and releasing ' + key('Alt') + ' switches to the chosen window.')}</li>
          </ol>
          <h3>${L('Системное меню окна', 'The window system menu')}</h3>
          <p>${L('Щелкните значок в левом углу заголовка или щелкните заголовок правой кнопкой мыши. В меню есть команды «Восстановить», «Переместить», «Размер», «Свернуть», «Развернуть» и «Закрыть» (' + key('Alt+F4') + '); окно перемещают и растягивают мышью, поэтому «Переместить» и «Размер» недоступны. Двойной щелчок по значку в углу заголовка сразу закрывает окно. Размер и положение Проводника, Internet Explorer и Netscape запоминаются.', 'Click the icon at the far left of the title bar, or right-click the title bar. The menu contains Restore, Move, Size, Minimize, Maximize, and Close (' + key('Alt+F4') + '); windows are moved and resized with the mouse, so Move and Size are unavailable. Double-clicking the title bar icon closes the window immediately. Explorer, Internet Explorer, and Netscape remember their size and position.')}</p>
          <h3>${L('Диалоговые окна', 'Dialog boxes')}</h3>
          <p>${L('Диалоги не имеют кнопок свертывания и развертывания и не попадают на панель задач. ' + key('Enter') + ' нажимает кнопку по умолчанию, ' + key('Esc') + ' отменяет диалог.', 'Dialog boxes have no minimize or maximize buttons and do not appear on the taskbar. ' + key('Enter') + ' presses the default button and ' + key('Esc') + ' cancels the dialog.')}</p>
          <h3>${L('Значки рабочего стола и Корзина', 'Desktop icons and the Recycle Bin')}</h3>
          <ul>
            <li>${L('Щелкните значок один раз, чтобы выделить его; дважды щелкните, чтобы открыть программу или папку. Клавиши ' + key('Enter') + ', ' + key('Delete') + ' и стрелки на значках рабочего стола не действуют: пользуйтесь мышью и контекстным меню.', 'Click an icon once to select it; double-click it to open the program or folder. The ' + key('Enter') + ', ' + key('Delete') + ', and arrow keys do not act on desktop icons: use the mouse and the context menu.')}</li>
            <li>${L('Чтобы выделить несколько значков, растяните вокруг них пунктирную рамку или щелкайте по ним, удерживая ' + key('Ctrl') + '. Выделенные значки перетаскиваются вместе, а их положение запоминается.', 'To select multiple icons, drag a selection rectangle around them or click them while holding ' + key('Ctrl') + '. Selected icons are dragged together and their positions are remembered.')}</li>
            <li>${L('Стрелка в углу значка', 'An arrow in the corner of an icon')} ${glyph('shortcut-overlay')} ${L('означает ярлык: его удаление не затрагивает саму программу.', 'indicates a shortcut; deleting the shortcut does not remove the program itself.')}</li>
            <li>${L('Файлы и папки, созданные на рабочем столе, можно перетащить на Корзину, чтобы удалить, или на папку, чтобы переместить внутрь.', 'Files and folders created on the desktop can be dragged onto the Recycle Bin to delete them or onto a folder to move them inside.')}</li>
            <li>${L('Удаленные файлы помещаются в', 'Deleted files are moved to the')} ${glyph('recycle-bin')} <b>${L('Корзину', 'Recycle Bin')}</b>. ${L('В окне Корзины кнопки «Восстановить», «Восстановить все» и «Очистить корзину»; двойной щелчок по файлу предлагает вернуть его на прежнее место или на рабочий стол. Очистка освобождает место на диске C:.', 'The Recycle Bin window has Restore, Restore All, and Empty Recycle Bin buttons; double-clicking a file offers to return it to its original folder or to the desktop. Emptying frees space on drive C:.')}</li>
          </ul>
          <h3>${L('Меню правой кнопки на рабочем столе', 'The desktop right-click menu')}</h3>
          <ul>
            <li>${L('<b>Active Desktop</b> — включает панель каналов, обновляет рабочий стол и открывает его настройки.', '<b>Active Desktop</b> — shows the channel bar, refreshes the desktop, and opens its settings.')}</li>
            <li>${L('<b>Упорядочить значки</b> возвращает значки на стандартные места, а <b>Выровнять значки</b> ровняет их по ближайшим ячейкам сетки.', '<b>Arrange Icons</b> puts the icons back in their standard places, and <b>Line Up Icons</b> snaps them to the nearest grid cells.')}</li>
            <li>${L('<b>Обновить</b>, <b>Вставить</b> и <b>Вставить ярлык</b> работают с буфером обмена файлов.', '<b>Refresh</b>, <b>Paste</b>, and <b>Paste Shortcut</b> work with the file clipboard.')}</li>
            <li>${L('<b>Создать</b> — папку, ярлык, портфель, точечный рисунок, текстовый документ, документ WordPad и звук Wave.', '<b>New</b> — a folder, shortcut, briefcase, bitmap image, text document, WordPad document, and Wave sound.')}</li>
            <li>${L('<b>Свойства</b> открывают «Свойства: Экран».', '<b>Properties</b> opens Display Properties.')}</li>
          </ul>
          <h3>${L('Панель каналов (Active Desktop)', 'The channel bar (Active Desktop)')}</h3>
          <p>${L('Включите её через «Пуск» → «Настройка» → «Active Desktop» или меню рабочего стола. На панели пять ссылок, которые открываются в Internet Explorer: «Обновление Win», «Путеводитель по каналам», «Новости и технологии», «Игры и спорт» (Steam) и «Развлечения».', 'Turn it on through Start → Settings → Active Desktop or the desktop menu. The bar holds five links that open in Internet Explorer: Win Update, Channel Guide, News and Technology, Games and Sports (Steam), and Entertainment.')}</p>
          ${shortcut('desk.cpl', L('Щелкните здесь, чтобы открыть «Свойства: Экран».', 'Click here to open Display Properties.'))}
          ${note([
            L('Если в «Свойствах экрана» на вкладке «Эффекты» снят флажок «Отображать содержимое окна при перетаскивании», при перемещении и изменении размера рисуется классическая пунктирная рамка.', 'When "Show window contents while dragging" is cleared on the Effects tab of Display Properties, moving or resizing a window draws a dotted outline frame.'),
            L('Если ничего не трогать несколько минут, запускается заставка; любая клавиша или движение мыши её останавливает.', 'If you leave the computer alone for a few minutes the screen saver starts; any key or mouse movement stops it.')
          ])}
          ${related('startmenu', 'explorer', 'cpanel', 'shortcuts')}
        `
      },
      {
        id: 'startmenu',
        keywords: L('пуск, меню, панель задач, быстрый запуск, показать рабочий стол, трей, часы, дата, громкость, язык, компакт-диск, питание, модем, скрепыш, завершение работы, завершение сеанса, обновление win, свойства панели задач, программы, стандартные, служебные', 'start, menu, taskbar, quick launch, show desktop, tray, clock, date, volume, language, cd-rom, power, modem, clippy, shut down, log off, win update, taskbar properties, programs, accessories, system tools'),
        content: `
          <h2>${titles.startmenu}</h2>
          <p>${L('Панель задач расположена вдоль нижнего края экрана. Слева находится кнопка', 'The taskbar runs along the bottom of the screen. On the left is the')} ${glyph('start-logo')} <b>${L('Пуск', 'Start')}</b>${L(', за ней — панель «Быстрый запуск», кнопки всех открытых окон, а справа — область уведомлений (системный трей) и часы.', ' button, followed by the Quick Launch toolbar, buttons for open windows, and on the right the notification area (system tray) and clock.')}</p>
          <h3>${L('Главное меню «Пуск»', 'The Start menu')}</h3>
          <ul>
            <li>${glyph('win-update')} <b>${L('Обновление Win', 'Win Update')}</b> — ${L('верхний пункт открывает в Internet Explorer сайт Win Update (это не лаунчер Win98.exe).', 'the top item opens the Win Update web site in Internet Explorer (it is not the Win98.exe launcher).')}</li>
            <li>${glyph('programs')} <b>${L('Программы', 'Programs')}</b> — ${L('подменю «Стандартные», «Игры» и ярлыки программ; подробности ниже.', 'the Accessories and Games submenus and program shortcuts; details below.')}</li>
            <li>${glyph('my-documents')} <b>${L('Документы', 'Documents')}</b> — ${L('папки «Мои документы», «Мои рисунки», «Моя музыка», «Мои видео», «Загрузки» и список недавно открывавшихся файлов.', 'the My Documents, My Pictures, My Music, My Videos, and Downloads folders and a list of recently opened files.')}</li>
            <li>${glyph('settings')} <b>${L('Настройка', 'Settings')}</b> — ${L('«Панель управления», «Принтеры», «Панель задач и меню "Пуск"...», «Свойства папки...», «Active Desktop», «Обновление Win», «Язык и региональные стандарты» и «Свойства экрана».', 'Control Panel, Printers, Taskbar & Start Menu..., Folder Options..., Active Desktop, Win Update, Regional Settings, and Display Properties.')}</li>
            <li>${glyph('find')} <b>${L('Найти', 'Find')}</b> — ${L('«Файлы и папки...» и «В Интернете...» (открывает поиск WebSeeker 98).', 'Files or Folders... and On the Internet... (opens the WebSeeker 98 search).')}</li>
            <li>${glyph('help')} <b>${L('Справка', 'Help')}</b>, ${glyph('run')} <b>${L('Выполнить...', 'Run...')}</b>, <b>${L('Завершение сеанса Administrator...', 'Log Off Administrator...')}</b> ${L('(закрывает все окна и заново проигрывает приветственный звук) и', '(closes all windows and plays the startup sound again) and')} ${glyph('shut-down')} <b>${L('Завершение работы...', 'Shut Down...')}</b>.</li>
          </ul>
          <h3>${L('Подменю «Программы»', 'The Programs submenu')}</h3>
          <ul>
            <li><b>${L('Стандартные', 'Accessories')}</b> — ${L('подменю «Связь» (Удаленный доступ к сети, HyperTerminal, mIRC 98), «Развлечения» (Лазерный проигрыватель, Звукозапись, Регулятор громкости, CDex, FastTracker 98, Emu-Land 98) и «Служебные» (см. раздел о служебных программах), а также ACDSee 32, Acrobat Reader, Просмотр картинок, Paint, WordPad, Блокнот, QBasic, Калькулятор и Neko.', 'the Communications (Dial-Up Networking, HyperTerminal, mIRC 98), Entertainment (CD Player, Sound Recorder, Volume Control, CDex, FastTracker 98, Emu-Land 98), and System Tools submenus (see the system tools topic), plus ACDSee 32, Acrobat Reader, Imaging, Paint, WordPad, Notepad, QBasic, Calculator, and Neko.')}</li>
            <li><b>${L('Игры', 'Games')}</b> — ${L('Сапер, Косынка, FreeCell, 3D Pinball, Безмятежность, «The Microslop Hearts Network» и все игры, установленные из Steam или с компакт-диска.', 'Minesweeper, Solitaire, FreeCell, 3D Pinball, Bliss, The Microslop Hearts Network, and every game installed from Steam or from the CD.')}</li>
            <li>${L('Отдельные пункты: WinRAR 2.x, WinAmp 98 Pro, ICQ 98a, Outlook Express, Проводник, Сеанс MS-DOS, Редактор реестра, Internet Explorer, Netscape 6 и «Клуб фанатов Di Gi Charat». Установленные позже Steam, eSheep, RetroShop 98, WinCommander 98, ActiveMovie Player, Антивирус Касперского и Blender добавляются сюда сами.', 'Separate items: WinRAR 2.x, WinAmp 98 Pro, ICQ 98a, Outlook Express, Win Explorer, MS-DOS Prompt, Registry Editor, Internet Explorer, Netscape 6, and the Di Gi Charat Fan Club. Steam, eSheep, RetroShop 98, WinCommander 98, ActiveMovie Player, Kaspersky Anti-Virus, and Blender add themselves here once installed.')}</li>
          </ul>
          <h3>${L('Управление меню и его настройка', 'Using and customizing the menu')}</h3>
          <p>${L('Меню можно открыть мышью, клавишами ' + key('Ctrl+Esc') + ' и ' + key('Win') + '. В открытом меню стрелки перемещают выделение, ' + key('→') + ' раскрывает подменю, ' + key('←') + ' и ' + key('Esc') + ' закрывают его, ' + key('Enter') + ' запускает пункт, а подчеркнутая в названии буква выбирает его сразу. Меню «Программы» повторяет папку <code>C:\\WINDOWS\\Start Menu</code>: ярлыки и папки, добавленные в «Свойствах: Панель задач и меню "Пуск"» или в самой папке, появляются в меню.', 'Open the menu with the mouse or with ' + key('Ctrl+Esc') + ' and ' + key('Win') + '. In the open menu the arrow keys move the selection, ' + key('→') + ' opens a submenu, ' + key('←') + ' and ' + key('Esc') + ' close it, ' + key('Enter') + ' launches the item, and the underlined letter in a name selects it at once. The Programs menu mirrors the <code>C:\\WINDOWS\\Start Menu</code> folder: shortcuts and folders added in Taskbar & Start Menu Properties or in the folder itself appear in the menu.')}</p>
          <h3>${L('Панель «Быстрый запуск» и кнопки окон', 'Quick Launch and window buttons')}</h3>
          <p>${glyph('show-desktop')} <b>${L('Показать рабочий стол', 'Show Desktop')}</b> ${L('одним щелчком сворачивает все открытые окна, а повторным возвращает их на место. Рядом расположены кнопки быстрого вызова', 'minimizes all open windows at once; click it again to restore them. Next to it are one-click buttons for')} ${glyph('internet-explorer')} <b>Internet Explorer</b> ${L('и', 'and')} ${glyph('outlook')} <b>Outlook Express</b>.</p>
          <p>${L('Щелчок по кнопке окна на панели задач делает его активным, а щелчок по кнопке уже активного окна сворачивает его. Щелкните свободное место панели задач правой кнопкой мыши, чтобы расположить окна каскадом, сверху вниз или слева направо, свернуть все окна, открыть Диспетчер задач или «Свойства: Панель задач и меню "Пуск"».', 'Click a window button on the taskbar to bring that window to the front; click the active window\'s button to minimize it. Right-click an empty space on the taskbar to cascade windows, tile them horizontally or vertically, minimize all windows, open Task Manager, or open Taskbar & Start Menu Properties.')}</p>
          <h3>${L('Значки в области уведомлений', 'Notification area icons')}</h3>
          <ul>
            <li>${glyph('icq-online')} — ${L('значок ICQ 98a (в сети); щелчок открывает мессенджер.', 'the ICQ 98a icon (online); a click opens the messenger.')}</li>
            <li><span class="win-help-lang">Ru</span> / <span class="win-help-lang">En</span> — ${L('переключение языка интерфейса между русским и английским; правая кнопка открывает выбор языка и «Свойства: Клавиатура».', 'switches the interface language between Russian and English; the right button opens the language choice and Keyboard Properties.')}</li>
            <li>${glyph('speaker')} — ${L('одиночный щелчок открывает ползунок громкости и флажок «Выкл», двойной щелчок — полный микшер «Регулятор громкости», правая кнопка — меню со свойствами звука.', 'a single click opens the volume slider and Mute box, a double-click opens the full Volume Control mixer, and the right button opens a menu with audio properties.')}</li>
            <li>${glyph('monitor')} — ${L('включает и выключает эффект ЭЛТ-монитора (строчная развертка и свечение люминофора).', 'toggles the CRT monitor effect (scanlines and phosphor glow).')}</li>
            <li>${glyph('drive-cd')} — ${L('привод CD-ROM: щелчок запускает вставленный диск, правая кнопка предлагает открыть диск в Проводнике, вставить другой (Игромания, Офисные игры \'98, Офисные игры 2) или извлечь.', 'the CD-ROM drive: a click runs the inserted disc, the right button offers to open the disc in Explorer, insert another one (Igromania, Office Games \'98, Office Games 2), or eject it.')}</li>
            <li>${L('<b>Скрепка</b> — значок помощника Скрепыша (см. раздел о Скрепыше).', '<b>Paperclip</b> — the Clippy icon (see the Clippy topic).')}</li>
            <li>${glyph('dialup')} — ${L('модемное соединение: подсказка показывает провайдера, длительность, скорость и объем данных; двойной щелчок открывает окно состояния, а если соединение разорвано — окно набора номера.', 'the dial-up connection: the tooltip shows the provider, duration, speed, and data volume; double-clicking opens the status window, or the connect dialog when the connection is down.')}</li>
            <li>${glyph('powercfg')} — ${L('индикатор электропитания (появляется, если включен в апплете «Электропитание»): быстро меняет схему питания, гасит монитор или останавливает диски.', 'the power meter (appears when enabled in Power Management): quickly switches power schemes, puts the monitor on standby, or spins down hard disks.')}</li>
            <li>${L('Временные значки: уведомление об исправленной ошибке (после «Сообщения об ошибке») и, в Win98.exe, отложенное обновление.', 'Temporary icons: a notice about a fixed bug report (after Report a Problem) and, in Win98.exe, a postponed update.')}</li>
            <li>${L('<b>Часы</b> — показывают текущее время (24 часа в русском интерфейсе и AM/PM в английском), при наведении выводят полную дату, а по двойному щелчку открывают «Дата и время».', '<b>Clock</b> — displays the current time (24-hour in the Russian interface and AM/PM in English), shows the full date on hover, and opens Date/Time Properties when double-clicked.')}</li>
          </ul>
          ${shortcut('taskbar-props', L('Щелкните здесь, чтобы открыть «Свойства: Панель задач и меню "Пуск"».', 'Click here to open Taskbar & Start Menu Properties.'))}
          ${shortcut('shutdown', L('Щелкните здесь, чтобы открыть окно «Завершение работы Win».', 'Click here to open the Shut Down Win dialog.'))}
          ${related('desktop', 'cpanel', 'shortcuts', 'startup')}
        `
      },
      {
        id: 'explorer',
        keywords: L('мой компьютер, проводник, папка, файл, диск, дискета, форматирование, сидюк, адрес, вырезать, копировать, вставить, удалить, переименовать, свойства, свойства папки, емкость, корзина, найти, поиск файлов, f3, сетевое окружение, отправить, панель папок, вид', 'my computer, explorer, folder, file, drive, floppy, format, cd-rom, address, cut, copy, paste, delete, rename, properties, folder options, capacity, recycle bin, find, search files, f3, network neighborhood, send to, folders pane, view'),
        content: `
          <h2>${titles.explorer}</h2>
          <p>${L('Дважды щелкните значок', 'Double-click the')} ${glyph('my-computer')} <b>${L('Мой компьютер', 'My Computer')}</b>${L(', чтобы получить доступ к дисководу гибких дисков <b>Диск 3,5 (A:)</b>, жесткому диску', ' icon to access the <b>3½ Floppy (A:)</b> drive, hard disk')} ${glyph('drive-c')} <b>C:</b>, ${L('приводу компакт-дисков', 'CD-ROM drive')} ${glyph('drive-cd')} <b>D:</b>${L(', папкам «Принтеры» и «Назначенные задания» и', ', the Printers and Scheduled Tasks folders, and')} ${glyph('control-panel')} <b>${L('Панели управления', 'Control Panel')}</b>. ${L('Проводник один: при открытии другой папки окно переходит в неё, а не открывает второе.', 'There is a single Explorer window: opening another folder moves that window there instead of opening a second one.')}</p>
          <h3>${L('Меню и панель инструментов', 'Menus and the toolbar')}</h3>
          <ul>
            <li>${L('<b>Файл</b> — создать папку, текстовый документ или портфель, удалить, переименовать, свойства. <b>Правка</b> — вырезать, копировать, вставить, вставить ярлык, выделить все. <b>Вид</b> — панель папок, крупные и мелкие значки, список, таблица, упорядочивание, обновление, «Свойства папки...». <b>Переход</b> — назад, вперед, вверх и быстрые переходы (Мой компьютер, Сетевое окружение, Мои документы, Мои рисунки, Загрузки). <b>Избранное</b> — SoftStore \'98, Steam, Мои рисунки и Загрузки.', '<b>File</b> — create a folder, text document, or briefcase, delete, rename, properties. <b>Edit</b> — cut, copy, paste, paste shortcut, select all. <b>View</b> — folders pane, large and small icons, list, details, arrange, refresh, Folder Options.... <b>Go</b> — back, forward, up, and quick jumps (My Computer, Network Neighborhood, My Documents, My Pictures, Downloads). <b>Favorites</b> — SoftStore \'98, Steam, My Pictures, and Downloads.')}</li>
          </ul>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('tb-back')}${glyph('tb-forward')}${glyph('tb-up')}</td><td>${L('<b>Назад</b>, <b>Вперед</b> — возврат к ранее открытым папкам; <b>Вверх</b> — переход в родительскую папку.', '<b>Back</b> and <b>Forward</b> move through previously visited folders; <b>Up</b> opens the parent folder.')}</td></tr>
            <tr><td class="win-help-table-glyph">${glyph('tb-cut')}${glyph('tb-copy')}${glyph('tb-paste')}</td><td>${L('<b>Вырезать</b>, <b>Копировать</b> и <b>Вставить</b> — перемещение или дублирование выбранного файла или папки через буфер обмена.', '<b>Cut</b>, <b>Copy</b>, and <b>Paste</b> move or duplicate the selected file or folder via the clipboard.')}</td></tr>
            <tr><td class="win-help-table-glyph">${glyph('tb-delete')}${glyph('tb-properties')}</td><td>${L('<b>Удалить</b> отправляет выделенный объект в Корзину, <b>Свойства</b> открывают сведения об объекте.', '<b>Delete</b> sends the selected item to the Recycle Bin; <b>Properties</b> shows details about the item.')}</td></tr>
            <tr><td class="win-help-table-glyph">${glyph('folder')}</td><td>${L('<b>Папки</b> показывает или скрывает дерево папок (его же открывают клавиши ' + key('Win+E') + '), <b>Вид</b> по очереди включает крупные значки, мелкие значки, список и таблицу. В таблице щелчок по заголовку столбца сортирует файлы.', '<b>Folders</b> shows or hides the folder tree (' + key('Win+E') + ' opens it too); <b>View</b> cycles through large icons, small icons, list, and details. In the details view a click on a column header sorts the files.')}</td></tr>
          </table>
          <h3>${L('Левая панель описания и диаграмма диска', 'Description pane and disk chart')}</h3>
          <p>${L('В левой части окна Проводника отображаются название текущей папки и описание выделенного объекта (тип, размер файла, описание значков Панели управления). Когда выделен диск <b>A:</b> или <b>C:</b>, панель рисует круговую диаграмму: синим цветом показано занятое пространство, пурпурным — свободное. Адресная строка показывает путь, но не принимает текст: для перехода используйте папки и меню «Переход». Панель описания скрывается, если в «Свойствах папки» выбран «Классический стиль».', 'The left part of the Explorer window shows the current folder name and a description of the selected item (type, file size, descriptions of Control Panel items). When drive <b>A:</b> or <b>C:</b> is selected, the pane draws a pie chart showing used space in blue and free space in magenta. The address bar shows the path but does not accept typing: use the folders and the Go menu to navigate. The description pane is hidden when Classic style is chosen in Folder Options.')}</p>
          <h3>${L('Работа с файлами', 'Working with files')}</h3>
          <ul>
            <li>${L('Правая кнопка на объекте открывает меню: «Открыть», «Проводник» (для папок и дисков), «Отправить», «Вырезать», «Копировать», «Создать ярлык», «Удалить», «Переименовать», «Свойства». В меню «Отправить»: диск A:, рабочий стол (создать ярлык), адресат почты, «Мои документы» и Блокнот. Правая кнопка на свободном месте открывает «Вид», «Упорядочить значки», «Обновить», «Вставить», «Вставить ярлык», «Создать» и «Свойства».', 'The right button on an item opens a menu: Open, Explore (for folders and drives), Send To, Cut, Copy, Create Shortcut, Delete, Rename, Properties. Send To offers drive A:, the desktop (create a shortcut), a mail recipient, My Documents, and Notepad. The right button on empty space opens View, Arrange Icons, Refresh, Paste, Paste Shortcut, New, and Properties.')}</li>
            <li>${L('Любое удаление отправляет файл в Корзину; восстановить его можно в окне Корзины. Переименование и создание новых объектов запрашивают имя в диалоге.', 'Any deletion sends the file to the Recycle Bin, where it can be restored. Renaming and creating new items ask for the name in a dialog.')}</li>
            <li>${L('<b>Свойства файла</b>: вкладка «Общие» (тип, размещение, размер, имя MS-DOS, даты и атрибуты), для ярлыков — «Ярлык», для программ — «Версия».', '<b>File properties</b>: the General tab (type, location, size, MS-DOS name, dates, and attributes), the Shortcut tab for shortcuts, and the Version tab for programs.')}</li>
            <li>${L('<b>Свойства диска</b> (A:, C:, D:): вкладка «Общие» — метка тома, файловая система и объемная круговая диаграмма; вкладка «Сервис» — проверка диска, архивация и дефрагментация. Для диска A: в меню есть «Форматировать...» (быстрое, полное или только системные файлы), для D: — автозапуск, смена диска и «Извлечь».', '<b>Drive properties</b> (A:, C:, D:): the General tab shows the volume label, file system, and a 3D pie chart; the Tools tab offers error checking, backup, and defragmentation. Drive A: has Format... (quick, full, or system files only) in its menu, and D: has AutoPlay, disc swap, and Eject.')}</li>
            <li>${L('<b>Свойства папки</b> («Вид» → «Свойства папки...» или «Пуск» → «Настройка»): стиль «Интернета» или «Классический», показ скрытых и системных файлов, скрытие расширений.', '<b>Folder Options</b> (View → Folder Options... or Start → Settings): Web style or Classic style, showing hidden and system files, and hiding extensions.')}</li>
          </ul>
          <h3>${L('Сетевое окружение', 'Network Neighborhood')}</h3>
          <p>${L('Это настоящая сеть Эфирной связи. В папке ваш компьютер, друзья из Honkai: Star Rail 98, которые сейчас на связи, и открытые столы Рубежа Экспресса. Ярлыки внутри запускают игру. Без подключения здесь только значок «Подключить Эфирную связь»; подключение и отключение идут через «Удалённый доступ к сети».', 'This is the real Ether Link network. The folder holds your computer, your Honkai: Star Rail 98 friends who are online now and the open Express Frontier tables. Shortcuts inside start the game. Without a connection there is only the Connect to Ether Link icon; connecting and disconnecting go through Dial-Up Networking.')}</p>
          <h3>${L('Поиск файлов и папок (' + key('F3') + ')', 'Finding files and folders (' + key('F3') + ')')}</h3>
          <p>${L('Откройте «Пуск» → «Найти» → «Файлы и папки...» (или нажмите ' + key('F3') + ' на рабочем столе). На вкладке <b>«Имя и размещение»</b> введите имя (можно с масками <code>*</code> и <code>?</code> и несколькими шаблонами через <code>;</code>), при необходимости текст внутри файла, выберите, где искать (Мои документы, Рабочий стол, C:, Мой компьютер) и нажмите <b>Найти</b>. Вкладка <b>«Дополнительно»</b> ограничивает поиск типом файла и размером. Результаты показываются таблицей с папкой, размером и типом; двойной щелчок открывает найденный файл или папку.', 'Open Start → Find → Files or Folders... (or press ' + key('F3') + ' on the desktop). On the <b>Name & Location</b> tab type a name (wildcards <code>*</code> and <code>?</code> and several patterns separated by <code>;</code> work), optionally text inside the file, choose where to look (My Documents, Desktop, C:, My Computer), and click <b>Find Now</b>. The <b>Advanced</b> tab limits the search by file type and size. Results appear in a table with folder, size, and type; double-click a result to open the file or folder.')}</p>
          ${shortcut('explorer', L('Щелкните здесь, чтобы открыть «Мой компьютер».', 'Click here to open My Computer.'))}
          ${shortcut('find', L('Щелкните здесь, чтобы открыть поиск «Найти: Файлы и папки».', 'Click here to open Find: All Files.'))}
          ${note([
            L('В Проводнике подсказки «Ctrl+X», «Ctrl+C», «Ctrl+V» и «F5» в меню служат напоминанием: выбирайте команды мышью, кнопками панели инструментов или контекстным меню.', 'In Explorer the Ctrl+X, Ctrl+C, Ctrl+V, and F5 hints in the menus are reminders only: choose the commands with the mouse, the toolbar buttons, or the context menu.')
          ])}
          ${related('desktop', 'apps', 'system', 'install')}
        `
      },
      {
        id: 'shortcuts',
        keywords: L('клавиши, сочетания, клавиатура, горячие клавиши, f1, f3, f5, f8, f10, ctrl, alt, win, esc, enter, alt+tab, alt+f4, printscreen, буфер обмена, диспетчер задач', 'keys, shortcuts, keyboard, hotkeys, f1, f3, f5, f8, f10, ctrl, alt, win, esc, enter, alt+tab, alt+f4, printscreen, clipboard, task manager'),
        content: `
          <h2>${titles.shortcuts}</h2>
          <table class="win-help-table">
            <tr><th>${L('Клавиши', 'Keys')}</th><th>${L('Действие', 'Action')}</th></tr>
            <tr><td>${key('Ctrl+Esc')} / ${key('Win')}</td><td>${L('Открыть или закрыть меню «Пуск».', 'Open or close the Start menu.')}</td></tr>
            <tr><td>${key('↑')} ${key('↓')} ${key('←')} ${key('→')}</td><td>${L('Перемещение по пунктам открытого меню «Пуск» и его подменю.', 'Navigate through the items and submenus of the open Start menu.')}</td></tr>
            <tr><td>${L('Подчеркнутая буква', 'Underlined letter')}</td><td>${L('Быстрый выбор команды в открытом меню «Пуск».', 'Select the matching item in the open Start menu.')}</td></tr>
            <tr><td>${key('Enter')} / ${key('Esc')}</td><td>${L('В диалоговом окне — нажать кнопку по умолчанию или отменить диалог; в меню — запустить пункт или закрыть меню.', 'In a dialog box, press the default button or cancel it; in a menu, launch the item or close the menu.')}</td></tr>
            <tr><td>${key('Alt+Tab')}</td><td>${L('Переключение между окнами (с ' + key('Shift') + ' — в обратном порядке).', 'Switch between windows (with ' + key('Shift') + ' in reverse order).')}</td></tr>
            <tr><td>${key('Alt+F4')}</td><td>${L('Закрыть активное окно; если окон нет — открыть «Завершение работы Win».', 'Close the active window; with no windows open, open Shut Down Win.')}</td></tr>
            <tr><td>${key('Win+E')} / ${key('Ctrl+Alt+E')}</td><td>${L('Открыть Проводник со списком папок.', 'Open Explorer with the Folders pane.')}</td></tr>
            <tr><td>${key('Win+R')} / ${key('Ctrl+Alt+R')}</td><td>${L('Открыть окно «Выполнить».', 'Open the Run dialog.')}</td></tr>
            <tr><td>${key('Win+D')}, ${key('Win+M')}</td><td>${L('Свернуть все окна и показать рабочий стол.', 'Minimize all windows and show the desktop.')}</td></tr>
            <tr><td>${key('F1')}</td><td>${L('На рабочем столе — вопрос Скрепышу (если помощник скрыт или отключен — Справка Win).', 'On the desktop, ask Clippy (or open Win Help if the assistant is hidden or disabled).')}</td></tr>
            <tr><td>${key('F3')}</td><td>${L('На рабочем столе — открыть «Найти: Файлы и папки» (в Блокноте и WordPad — найти следующее совпадение).', 'On the desktop, open Find: All Files (in Notepad and WordPad, find the next match).')}</td></tr>
            <tr><td>${key('F5')}</td><td>${L('На рабочем столе — обновить значки (в Блокноте — вставить время и дату, в QBasic — запустить программу).', 'On the desktop, refresh the icons (in Notepad, insert the time and date; in QBasic, run the program).')}</td></tr>
            <tr><td>${key('Ctrl+Alt+Del')}, ${key('Ctrl+Shift+Esc')}</td><td>${L('Открыть Диспетчер задач Win.', 'Open the Win Task Manager.')}</td></tr>
            <tr><td>${key('Print Screen')} / ${key('Alt+Print Screen')}</td><td>${L('Скопировать снимок экрана или активного окна в «Просмотр буфера обмена».', 'Copy a snapshot of the screen or the active window to the ClipBook Viewer.')}</td></tr>
            <tr><td>${key('F10')} / ${key('Ctrl+F10')}</td><td>${L('Открыть «Сообщение об ошибке» (в Fallout и «Другой войне» — только ' + key('Ctrl+F10') + '). В Honkai: Star Rail 98 для этого служит ' + key('F9') + '.', 'Open Report a Problem (in Fallout and Another War only ' + key('Ctrl+F10') + '). In Honkai: Star Rail 98 the key is ' + key('F9') + '.')}</td></tr>
            <tr><td>${key('Ctrl+S')}, ${key('Ctrl+C')}, ${key('Ctrl+V')}</td><td>${L('В программах с текстом и документами (Блокнот, WordPad): сохранить, скопировать и вставить.', 'In programs with text and documents (Notepad, WordPad): save, copy, and paste.')}</td></tr>
            <tr><td>${key('Shift')} ×5</td><td>${L('Предложить включить залипание клавиш (специальные возможности).', 'Offer to turn on StickyKeys (accessibility).')}</td></tr>
            <tr><td>${key('Ctrl+Alt+Shift+B')}</td><td>${L('Показать синий экран смерти (демонстрация); любая клавиша закрывает его.', 'Show the Blue Screen of Death (a demonstration); any key closes it.')}</td></tr>
            <tr><td>${key('Del')} / ${key('F2')} / ${key('F8')} (${L('при загрузке', 'at boot')})</td><td>${L('Войти в CMOS Setup Utility (BIOS) или открыть меню загрузки во время POST.', 'Enter the CMOS Setup Utility (BIOS) or open the startup menu during POST.')}</td></tr>
          </table>
          ${note([
            L('Системные сочетания вроде ' + key('Ctrl+Esc') + ', ' + key('Alt+Tab') + ' и ' + key('Ctrl+Alt+Del') + ' могут перехватываться браузером или операционной системой вашего компьютера. В этом случае пользуйтесь кнопкой «Пуск», кнопками на панели задач или другими сочетаниями из таблицы (' + key('Win+...') + ', ' + key('Ctrl+Alt+...') + ' и ' + key('Ctrl+Shift+Esc') + ').', 'Host browsers or operating systems may intercept combinations such as ' + key('Ctrl+Esc') + ', ' + key('Alt+Tab') + ', and ' + key('Ctrl+Alt+Del') + '. When that happens, use the Start button, the taskbar buttons, or the other combinations in the table (' + key('Win+...') + ', ' + key('Ctrl+Alt+...') + ', and ' + key('Ctrl+Shift+Esc') + ').'),
            L('На рабочем столе значки не управляются клавишами, а в Проводнике подсказки клавиш в меню не работают; в программах и играх действуют свои клавиши, о которых говорят их меню «Справка» и файлы README.', 'Desktop icons are not controlled by keys, and the key hints in Explorer menus do not work; programs and games have their own keys described in their Help menus and README files.')
          ])}
          ${related('startmenu', 'desktop', 'explorer')}
        `
      },
      {
        id: 'install',
        keywords: L('установка, установить, программы, игры, steam, стим, магазин, купить, скачать, загрузка, softstore, каталог, компакт-диск, игромания, демо, демоверсия, setup, downloads, карта, промокод, win98se, cyber1998, hsr, honkai, star rail, удалить', 'install, installation, programs, games, steam, store, buy, download, softstore, catalog, cd-rom, igromania, demo, setup, downloads, card, promo code, win98se, cyber1998, hsr, honkai, star rail, uninstall'),
        content: `
          <h2>${titles.install}</h2>
          <p>${L('Игры и большие программы не установлены заранее: система стартует с Сапером, WinAmp и стандартными принадлежностями. Всё остальное добывается тремя путями — в клиенте Steam, с компакт-диска «Игромания» или в каталоге SoftStore \'98. Установленная программа появляется в меню «Пуск», а игра — ещё и на рабочем столе и в папке <code>C:\\Games</code>.', 'Games and large programs are not preinstalled: the system starts with Minesweeper, WinAmp, and the standard accessories. Everything else comes from three sources — the Steam client, the Igromania CD, or the SoftStore \'98 catalog. An installed program appears on the Start menu, and a game also appears on the desktop and in the <code>C:\\Games</code> folder.')}</p>
          <h3>${L('Steam: покупка и загрузка игр', 'Steam: buying and downloading games')}</h3>
          <ol>
            <li>${L('Откройте Internet Explorer, перейдите на <code>http://www.steampowered.com</code> и нажмите «Загрузить Steam».', 'Open Internet Explorer, go to <code>http://www.steampowered.com</code>, and click Download Steam.')}</li>
            <li>${L('Запустите <code>SteamInstall.exe</code> из окна загрузки или из «Мои документы\\Downloads» и пройдите мастер установки. После него появляются ярлык на рабочем столе и пункт «Steam» в меню «Пуск» (по флажкам мастера).', 'Run <code>SteamInstall.exe</code> from the download window or from My Documents\\Downloads and follow the setup wizard. Afterwards a desktop shortcut and a Steam item on the Start menu appear (as chosen by the wizard check boxes).')}</li>
            <li>${L('В Steam откройте «Игры»: список «Магазин Steam» — каталог (около тридцати игр проекта), «Мои игры» — ваша библиотека. Кнопка «Подробнее» показывает жанр, метки, описание и два снимка экрана; щелчок по снимку открывает его крупно. Правая кнопка на игре предлагает «Играть», «Загрузить», «Купить», «Удалить локальные файлы» и «Подробнее».', 'In Steam open Games: the Steam Store list is the catalog (about thirty games of the project) and My Games is your library. The Details button shows the genre, tags, description, and two screenshots; clicking a screenshot opens it large. The right button on a game offers Play, Download, Buy, Delete Local Files, and Details.')}</li>
            <li>${L('Платные игры оплачиваются картой: кнопка «Взять данные из «Банковская карта и сайты.txt»» подставляет номер из файла в «Моих документах». Промокоды <b>WIN98SE</b> и <b>CYBER1998</b> дают скидку 20%. Бесплатные игры добавляются кнопкой «Получить».', 'Paid games are bought with a card: the button that takes data from the Bank Card and Sites.txt file fills in the number from the file in My Documents. The promo codes <b>WIN98SE</b> and <b>CYBER1998</b> give 20% off. Free games are added with the Get button.')}</li>
            <li>${L('Steam сам загружает игру, кладёт её в <code>C:\\Games</code> и создаёт ярлыки на рабочем столе и в меню «Пуск». Скорость зависит от типа подключения, выбранного в «Настройках» (от модема 28.8K до локальной сети); окно «Монитор» показывает график скорости и позволяет ограничить её.', 'Steam downloads the game itself, puts it into <code>C:\\Games</code>, and creates shortcuts on the desktop and in the Start menu. The speed depends on the connection type chosen in Settings (from a 28.8K modem to a LAN); the Monitor window shows a speed graph and lets you cap it.')}</li>
          </ol>
          <p>${L('Остальные окна клиента: «Друзья» (29 контактов и переписка), «Серверы» (списки серверов для нескольких игр), «Настройки» (имя учётной записи, подключение) и «Новости». Пока игра не установлена, её ярлыки, команда в «Выполнить» и пункты меню отправляют вас в Steam.', 'The other client windows are Friends (29 contacts and chat), Servers (server lists for several games), Settings (account name, connection), and News. While a game is not installed, its shortcuts, Run command, and menu items send you to Steam.')}</p>
          <h3>${L('Компакт-диск «Игромания» (D:)', 'The Igromania CD (D:)')}</h3>
          <ul>
            <li>${L('В приводе уже вставлен диск «Игромания» за сентябрь 1998 года. Двойной щелчок по <b>Игромания (D:)</b> на рабочем столе или щелчок по значку CD-ROM в трее запускает оболочку диска (<code>igroman.exe</code>): «Содержание», «Играем» (демоверсии, патчи, видеоролики), «Вооружаемся» (программы для Интернета и для всех, WinAmp и обложки) и «Супербонус».', 'The Igromania CD for September 1998 is already in the drive. Double-clicking <b>Igromania (D:)</b> on the desktop or clicking the CD-ROM tray icon runs the disc shell (<code>igroman.exe</code>): Contents, Play (demos, patches, videos), Arm Yourself (Internet and general software, WinAmp and skins), and Super Bonus.')}</li>
            <li>${L('На диске <b>22 демоверсии</b> (в папке <code>D:\\demo</code>): NHL 98, Burnout, World Cup 98 и демо игр проекта, например Fallout 98, Half-Life 98, Minecraft 98, Tekken 98, Medal of Honor 98 и The Sims 3. Страница игры в оболочке диска содержит кнопку «Установить игру»; можно и просто запустить установщик из <code>D:\\demo</code>.', 'The disc holds <b>22 demos</b> (in the <code>D:\\demo</code> folder): NHL 98, Burnout, World Cup 98, and demos of the project\'s games such as Fallout 98, Half-Life 98, Minecraft 98, Tekken 98, Medal of Honor 98, and The Sims 3. A game page in the disc shell has an Install Game button; you can also simply run the installer from <code>D:\\demo</code>.')}</li>
            <li>${L('Остальные папки диска: <code>patch</code>, <code>video</code>, <code>soft_int</code>, <code>soft_u</code> и <code>winamp</code> (там лежит установщик WinAmp на случай переустановки).', 'The other disc folders are <code>patch</code>, <code>video</code>, <code>soft_int</code>, <code>soft_u</code>, and <code>winamp</code> (it holds the WinAmp installer in case you need to reinstall).')}</li>
            <li>${L('Если демоверсия не установлена, её ярлык сообщит путь к установщику на диске. Правая кнопка на значке CD-ROM в трее позволяет вставить другой диск (Офисные игры \'98, Офисные игры 2) или извлечь текущий.', 'If a demo is not installed, its shortcut tells you the installer\'s path on the disc. The right button on the CD-ROM tray icon lets you insert another disc (Office Games \'98, Office Games 2) or eject the current one.')}</li>
          </ul>
          <h3>${L('SoftStore \'98 и сайты разработчиков', 'SoftStore \'98 and developer sites')}</h3>
          <table class="win-help-table">
            <tr><th>${L('Программа', 'Program')}</th><th>${L('Где взять', 'Where to get it')}</th></tr>
            <tr><td>eSheep 98 (${L('Овечка По', 'the Sheep')})</td><td>${L('SoftStore \'98 (<code>www.softstore98.com</code>), бесплатно', 'SoftStore \'98 (<code>www.softstore98.com</code>), free')}</td></tr>
            <tr><td>ActiveMovie Player 98</td><td>${L('SoftStore \'98, $19.99', 'SoftStore \'98, $19.99')}</td></tr>
            <tr><td>RetroShop 98 (Photo Editor Pro)</td><td>${L('SoftStore \'98, $39.99', 'SoftStore \'98, $39.99')}</td></tr>
            <tr><td>WinCommander 98</td><td>${L('SoftStore \'98, $24.99', 'SoftStore \'98, $24.99')}</td></tr>
            <tr><td>${L('Антивирус Касперского AVP', 'Kaspersky Anti-Virus AVP')}</td><td>${L('<code>www.avp.ru</code>, $24.99 (купоны AVP1998, KAMI98, WIN98SE, FERRUM98 — по $5)', '<code>www.avp.ru</code>, $24.99 (coupons AVP1998, KAMI98, WIN98SE, FERRUM98 — $5 each)')}</td></tr>
            <tr><td>Blender 1.60 / 2.04</td><td>${L('<code>www.blender3d.com</code>, бесплатно', '<code>www.blender3d.com</code>, free')}</td></tr>
            <tr><td>${L('Заставки, обои и темы', 'Screen savers, wallpapers, and themes')}</td><td>${L('ThemeWorld \'98 (<code>www.themeworld98.com</code>), бесплатно', 'ThemeWorld \'98 (<code>www.themeworld98.com</code>), free')}</td></tr>
            <tr><td>${L('Одежда для Скрепыша', 'Clippy\'s outfits')}</td><td><code>www.clippy98.com</code></td></tr>
            <tr><td>${L('Обложки WinAmp', 'WinAmp skins')}</td><td><code>skins.winamp.com</code></td></tr>
            <tr><td>${L('Образы игр для Emu-Land 98', 'Game dumps for Emu-Land 98')}</td><td><code>www.emuland98.ru</code></td></tr>
            <tr><td>Honkai: Star Rail 98</td><td>${L('Steam или <code>http://hsr.hoyoverse.com</code>, бесплатно', 'Steam or <code>http://hsr.hoyoverse.com</code>, free')}</td></tr>
          </table>
          <p>${L('Покупки в SoftStore \'98 оплачиваются так же, как в Steam: данные карты лежат в файле «Банковская карта и сайты.txt», а промокоды WIN98SE и CYBER1998 снижают цену. Установщик сохраняется в <code>C:\\My Documents\\Downloads</code>; запустите его, и после мастера установки программа появится в меню «Пуск». Загрузки с сайтов появляются в папке «Загрузки» («Пуск» → «Документы»).', 'Purchases in SoftStore \'98 are paid for the same way as in Steam: the card data is in the Bank Card and Sites.txt file, and the promo codes WIN98SE and CYBER1998 lower the price. The installer is saved to <code>C:\\My Documents\\Downloads</code>; run it and after the setup wizard the program appears on the Start menu. Downloads from sites land in the Downloads folder (Start → Documents).')}</p>
          <h3>${L('Удаление', 'Uninstalling')}</h3>
          <p>${L('Программы и игры удаляются в «Установке и удалении программ» (Панель управления). Игру из Steam можно убрать и командой «Удалить локальные файлы» в клиенте: она остаётся в вашей библиотеке и её можно загрузить снова.', 'Programs and games are removed in Add/Remove Programs (Control Panel). A Steam game can also be removed with Delete Local Files in the client: it stays in your library and can be downloaded again.')}</p>
          ${shortcut('steam', L('Щелкните здесь, чтобы открыть Steam (или страницу его загрузки).', 'Click here to open Steam (or its download page).'))}
          ${shortcut('appwiz.cpl', L('Щелкните здесь, чтобы открыть «Установку и удаление программ».', 'Click here to open Add/Remove Programs.'))}
          ${note([
            L('Honkai: Star Rail 98 бесплатна: её можно скачать и на официальном сайте (установщик <code>StarRail98_Setup.exe</code> сохраняется в Downloads, мастер ставит игру и добавляет её в библиотеку Steam), и взять в Steam кнопкой «Получить». Больше ни одна игра не раздаётся вне Steam.', 'Honkai: Star Rail 98 is free: you can download it from its official site (the <code>StarRail98_Setup.exe</code> installer is saved to Downloads, and its wizard installs the game and adds it to the Steam library) or take it in Steam with the Get button. No other game is distributed outside Steam.'),
            L('Игры из Steam и с диска ищите в «Пуск» → «Программы» → «Игры». Excel 97 в меню «Пуск» нет: его открывает команда <code>excel</code> в «Выполнить», файлы <code>.xls</code> и меню Скрепыша «Шеф идёт!».', 'Games from Steam and from the CD are in Start → Programs → Games. Excel 97 is not on the Start menu: open it with the <code>excel</code> command in Run, with <code>.xls</code> files, or with Clippy\'s Boss Key.')
          ])}
          ${related('startmenu', 'internet', 'apps', 'cpanel')}
        `
      },
      {
        id: 'apps',
        keywords: L('стандартные, программы, блокнот, notepad, wordpad, paint, калькулятор, таблица символов, буфер обмена, clipbrd, просмотр картинок, acdsee, acrobat reader, pdf, excel, retroshop, photoshop, winrar, архиватор, wincommander, qbasic, basic, neko, esheep, овечка, сапер, косынка, freecell, pinball, hearts, червы, игры', 'accessories, programs, notepad, wordpad, paint, calculator, character map, clipbook viewer, clipbrd, imaging, acdsee, acrobat reader, pdf, excel, retroshop, photoshop, winrar, archiver, wincommander, qbasic, basic, neko, esheep, sheep, minesweeper, solitaire, freecell, pinball, hearts, games'),
        content: `
          <h2>${titles.apps}</h2>
          <p>${L('В системе есть стандартные принадлежности Win 98, просмотрщики, архиватор, среда программирования, экранные питомцы и настольные игры. Остальные программы (RetroShop 98, WinCommander 98, ActiveMovie Player, eSheep и другие) устанавливаются отдельно.', 'The system includes the standard Win 98 accessories, viewers, an archiver, a programming IDE, desktop pets, and card and puzzle games. Other programs (RetroShop 98, WinCommander 98, ActiveMovie Player, eSheep, and more) are installed separately.')}</p>
          <h3>${L('Стандартные программы («Пуск» → «Программы» → «Стандартные»)', 'Accessories (Start → Programs → Accessories)')}</h3>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('notepad')}</td><td><b>${L('Блокнот (Notepad)', 'Notepad')}</b> — ${L('текстовый редактор для файлов TXT, INI, BAT и LOG с поиском (' + key('F3') + ' — найти далее) и вставкой времени и даты (' + key('F5') + ').', 'plain-text editor for TXT, INI, BAT, and LOG files with search (' + key('F3') + ' finds next) and time/date stamp insertion (' + key('F5') + ').')}</td><td><button class="win-help-shortcut" data-run="notepad">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('wordpad')}</td><td><b>WordPad</b> — ${L('редактор документов RTF с панелью форматирования (шрифт, полужирный, курсив, подчеркивание, цвет, выравнивание), поиском и вставкой даты; в «Моих документах» лежит «Реферат по истории 1998.rtf».', 'rich-text editor for RTF documents with a format bar (font, bold, italic, underline, color, alignment), search, and date insertion; My Documents holds the sample History Essay 1998.rtf.')}</td><td><button class="win-help-shortcut" data-run="wordpad">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('paint')}</td><td><b>Paint</b> — ${L('растровый редактор с 16 инструментами (свободное и прямоугольное выделение, ластик, заливка, пипетка, лупа, карандаш, кисть, распылитель, текст, линия, кривая, прямоугольник, многоугольник, эллипс, скругленный прямоугольник), палитрой из 28 цветов; открывает и сохраняет BMP, PNG и JPG.', 'bitmap editor with 16 tools (free-form and rectangle select, eraser, fill, color picker, magnifier, pencil, brush, airbrush, text, line, curve, rectangle, polygon, ellipse, rounded rectangle), a 28-color palette; opens and saves BMP, PNG, and JPG.')}</td><td><button class="win-help-shortcut" data-run="paint">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('calculator')}</td><td><b>${L('Калькулятор (Calculator)', 'Calculator')}</b> — ${L('обычный и инженерный режимы (sin, cos, tan, степень, логарифм, факториал, число пи), системы счисления и ячейка памяти MC/MR/MS/M+; числа можно вводить с клавиатуры.', 'standard and scientific modes (sin, cos, tan, powers, logarithm, factorial, pi), number bases, and MC/MR/MS/M+ memory; numbers can be typed on the keyboard.')}</td><td><button class="win-help-shortcut" data-run="calc">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('imaging')}</td><td><b>${L('Просмотр картинок (Imaging)', 'Imaging')}</b> — ${L('просмотр рисунков BMP, JPG, GIF и PNG с масштабом, поворотом (' + key('Ctrl+L') + ' и ' + key('Ctrl+K') + '), показом слайдов и командой «Сделать фоном рабочего стола».', 'views BMP, JPG, GIF, and PNG images with zoom, rotation (' + key('Ctrl+L') + ' and ' + key('Ctrl+K') + '), a slide show, and a Set as Desktop Background command.')}</td><td><button class="win-help-shortcut" data-run="imaging">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('acdsee')}</td><td><b>ACDSee 32 v2.23</b> — ${L('быстрый браузер рисунков с миниатюрами и слайд-шоу; показывает папки «Мои рисунки», ARTWORK_98 с диска и Wallpapers 98.', 'fast image browser with thumbnails and a slide show; shows the My Pictures, ARTWORK_98 (from the CD), and Wallpapers 98 folders.')}</td><td><button class="win-help-shortcut" data-run="acdsee">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('acrobat')}</td><td><b>Adobe Acrobat Reader 3.01</b> — ${L('чтение PDF с масштабированием; в «Моих документах» лежат три руководства (BC3000AD_MANUAL, VOODOO2_SPEC, WIN98SE_RESKIT).', 'reads PDF documents with zoom; My Documents holds three manuals (BC3000AD_MANUAL, VOODOO2_SPEC, WIN98SE_RESKIT).')}</td><td><button class="win-help-shortcut" data-run="acrobat">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('qbasic')}</td><td><b>Microslop QBasic 1.1</b> — ${L('синяя среда разработки BASIC с интерпретатором, окном немедленных команд, графикой SCREEN 12/13, звуком PLAY/SOUND и примерами (HOMEWORK, STARFIELD, MANDEL, SYNTH98, QUIZ98); ' + key('F5') + ' запускает программу.', 'blue-screen BASIC IDE and interpreter with an Immediate window, SCREEN 12/13 graphics, PLAY/SOUND audio, and samples (HOMEWORK, STARFIELD, MANDEL, SYNTH98, QUIZ98); ' + key('F5') + ' runs the program.')}</td><td><button class="win-help-shortcut" data-run="qbasic">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('neko')}</td><td><b>${L('Котик Neko (Neko 98)', 'Neko 98')}</b> — ${L('экранный котенок, который бегает за курсором и засыпает, когда мышь неподвижна; окраску, скорость и звук выбирают в его окне, а запуск повторно выключает питомца.', 'a desktop kitten that chases the pointer and falls asleep when the mouse is still; pick the coat, speed, and sound in its window, and launching it again turns the pet off.')}</td><td><button class="win-help-shortcut" data-run="neko">${icon('shortcut-overlay')}</button></td></tr>
          </table>
          <h3>${L('Архиватор, офис и дополнительные программы', 'Archiver, office, and add-on programs')}</h3>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('winrar')}</td><td><b>WinRAR 2.x</b> — ${L('распаковка и проверка архивов RAR и ZIP; в системе есть учебные архивы (doom2_cheats.zip, matrix_screensaver.rar), а по истечении «пробных 40 дней» появляется напоминание о регистрации.', 'extracts and tests RAR and ZIP archives; the system includes sample archives (doom2_cheats.zip, matrix_screensaver.rar), and a registration reminder shows after the "40-day evaluation".')}</td><td><button class="win-help-shortcut" data-run="winrar">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('excel')}</td><td><b>Microslop Excel 97</b> — ${L('электронные таблицы с формулами, автосуммой Σ и диаграммами; в «Пуск» его нет — откройте кнопкой справа, файлом <code>.xls</code> (например, <code>C:\\Work\\budget_1998.xls</code>) или меню Скрепыша.', 'spreadsheets with formulas, AutoSum Σ, and charts; it is not on the Start menu — open it with the button at right, an <code>.xls</code> file (such as <code>C:\\Work\\budget_1998.xls</code>), or Clippy\'s menu.')}</td><td><button class="win-help-shortcut" data-run="excel">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('photoshop')}</td><td><b>RetroShop 98 (Photo Editor Pro)</b> — ${L('графический редактор со слоями и фильтрами; устанавливается из SoftStore \'98.', 'a layered image editor with filters; installed from SoftStore \'98.')}</td><td></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('wincommander')}</td><td><b>WinCommander 98</b> — ${L('двухпанельный файловый менеджер; устанавливается из SoftStore \'98.', 'a dual-pane file manager; installed from SoftStore \'98.')}</td><td></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('esheep')}</td><td><b>eSheep 98</b> — ${L('бесплатная экранная овечка По: гуляет по заголовкам окон и панели задач; устанавливается из SoftStore \'98.', 'a free desktop sheep that walks on window title bars and the taskbar; installed from SoftStore \'98.')}</td><td></td></tr>
          </table>
          <h3>${L('Игры «Пуск» → «Программы» → «Игры»', 'Games (Start → Programs → Games)')}</h3>
          <ul>
            <li>${glyph('minesweeper')} <b>${L('Сапер', 'Minesweeper')}</b> — ${L('уровни «Новичок», «Любитель», «Профессионал» и «Особый» с лучшими временами.', 'Beginner, Intermediate, Expert, and Custom levels with best times.')}</li>
            <li>${glyph('solitaire')} <b>${L('Косынка', 'Solitaire')}</b> ${L('и', 'and')} ${glyph('freecell')} <b>FreeCell</b> — ${L('карточные пасьянсы (в «Косынке» раздача по одной или по три карты, подсчёт очков, отмена хода; во FreeCell нумерованные расклады и статистика).', 'solitaire card games (Solitaire deals one or three cards with scoring and Undo; FreeCell has numbered deals and statistics).')}</li>
            <li>${glyph('pinball')} <b>3D Pinball: Space Cadet</b> — ${L('флипперы ' + key('Z') + ' и ' + key('/') + ' (или Shift и стрелки), пружина ' + key('Space') + ', ' + key('F2') + ' — новая игра, ' + key('F3') + ' — пауза.', 'flippers ' + key('Z') + ' and ' + key('/') + ' (or Shift and the arrows), plunger ' + key('Space') + ', ' + key('F2') + ' for a new game, ' + key('F3') + ' to pause.')}</li>
            <li>${glyph('bliss')} <b>${L('Безмятежность', 'Bliss')}</b> — ${L('полёт над холмом с обоев: мышь задаёт направление, ' + key('W') + ' ускоряет, ' + key('S') + ' тормозит, ' + key('Esc') + ' открывает альбом. Пять найденных кадров можно сделать обоями.', 'a flight over the wallpaper hill: the mouse steers, ' + key('W') + ' speeds up, ' + key('S') + ' brakes, ' + key('Esc') + ' opens the album. Any of the five frames can become your wallpaper.')}</li>
            <li>${glyph('hearts')} <b>The Microslop Hearts Network</b> — ${L('«Червы» против трёх компьютерных игроков (Полина, Мишель и Бен) с передачей карт и «выстрелом в луну»; ' + key('F2') + ' — новая игра.', 'Hearts against three computer players (Paulina, Michele, and Ben) with card passing and shooting the moon; ' + key('F2') + ' starts a new game.')}</li>
          </ul>
          ${note([
            L('Крупные игры покупаются и скачиваются через клиент <b>Steam</b>, демоверсии находятся на компакт-диске «Игромании» (D:), а бесплатную <b>Honkai: Star Rail 98</b> можно скачать и с <code>hsr.hoyoverse.com</code>; подробности в разделе об установке программ.', 'Full games are purchased and downloaded through the <b>Steam</b> client, game demos are on the Igromania CD (D:), and free-to-play <b>Honkai: Star Rail 98</b> can also be downloaded from <code>hsr.hoyoverse.com</code>; see the installing programs topic for details.')
          ])}
          ${related('install', 'multimedia', 'internet', 'system')}
        `
      },
      {
        id: 'multimedia',
        keywords: L('мультимедиа, звук, музыка, видео, winamp, mp3, cdplayer, лазерный проигрыватель, cdex, fasttracker, трекер, xm, mod, emu-land, эмулятор, денди, sega, snes, game boy, звукозапись, громкость, микшер, sndvol32, sndrec32, mplayer, activemovie, медиаплеер, avi, обложки', 'multimedia, sound, music, video, winamp, mp3, cdplayer, cd player, cdex, fasttracker, tracker, xm, mod, emu-land, emulator, nes, sega, snes, game boy, sound recorder, volume, mixer, sndvol32, sndrec32, mplayer, activemovie, media player, avi, skins'),
        content: `
          <h2>${titles.multimedia}</h2>
          <p>${L('Звуковая подсистема обслуживает воспроизведение MP3, WAV, MIDI и трекерных модулей, чтение звуковых дорожек компакт-дисков, запись звука, просмотр видео и эмуляцию игровых приставок.', 'The multimedia subsystem handles MP3, WAV, MIDI, and tracker module playback, audio tracks from CDs, voice recording, video playback, and game console emulation.')}</p>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('winamp')}</td><td><b>WinAmp 98 Pro</b> — ${L('установлен с самого начала: MP3, WAV и MIDI, 10-полосный эквалайзер с девятью предустановками, список воспроизведения (.M3U), визуализация (столбцы, осциллограф) и восемь сменных обложек (Base, Win98 Native, Matrix Rain, Luxury Gold, Cobalt Hi-Fi, Di Gi Charat, Zone 98, Elektronika PM-98); новые обложки .wsz берут на <code>skins.winamp.com</code>. Клавиши ' + key('Z') + ' ' + key('X') + ' ' + key('C') + ' ' + key('V') + ' ' + key('B') + ' — управление воспроизведением.', 'installed from the start: MP3, WAV, and MIDI, a 10-band equalizer with nine presets, a playlist editor (.M3U), a visualizer (bars, scope), and eight skins (Base, Win98 Native, Matrix Rain, Luxury Gold, Cobalt Hi-Fi, Di Gi Charat, Zone 98, Elektronika PM-98); get more .wsz skins at <code>skins.winamp.com</code>. The ' + key('Z') + ' ' + key('X') + ' ' + key('C') + ' ' + key('V') + ' ' + key('B') + ' keys control playback.')}</td><td><button class="win-help-shortcut" data-run="winamp">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('cdplayer')}</td><td><b>${L('Лазерный проигрыватель (CD Player)', 'CD Player')}</b> — ${L('воспроизводит звуковые дорожки вставленного в D: диска (на «Игромании» четыре дорожки, на дисках «Офисные игры» две или три) с переключением треков и счётчиком времени.', 'plays the audio tracks of the disc in drive D: (four on Igromania, two or three on the Office Games discs) with track skip and elapsed time.')}</td><td><button class="win-help-shortcut" data-run="cdplayer">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('cdex')}</td><td><b>CDex Audio CD Ripper</b> — ${L('считывает звуковые дорожки диска (не информационную) в файлы MP3 или WAV в папку «Моя музыка», подставляя названия треков.', 'rips the audio tracks of the disc (not the data track) into MP3 or WAV files in My Music, filling in track names.')}</td><td><button class="win-help-shortcut" data-run="cdex">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('fasttracker')}</td><td><b>FastTracker 98 (.XM)</b> — ${L('трекерный синтезатор с редактором паттернов, шестью инструментами и тремя готовыми композициями (ENLIGHT98.XM, QUAKE2_CRACKTRO.MOD, FUTURE_CREW.XM); ноты вводятся клавишами Z–M и Q–U, результат экспортируется в WAV в «Мою музыку».', 'a tracker music workstation with a pattern editor, six instruments, and three ready modules (ENLIGHT98.XM, QUAKE2_CRACKTRO.MOD, FUTURE_CREW.XM); notes are entered with the Z–M and Q–U keys and the result is exported as WAV into My Music.')}</td><td><button class="win-help-shortcut" data-run="fasttracker">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('emulator')}</td><td><b>Emu-Land 98</b> — ${L('эмулятор приставок: NESticle (Dendy/NES), Sega Mega Drive, ZSNES (SNES) и Game Boy. Встроено девять картриджей (Battle City, Super Mario Bros, Contra, Chip \'n Dale, Sonic 2, UMK3, Comix Zone, Super Mario World, Tetris); другие образы берут на <code>www.emuland98.ru</code>, а файлы .NES, .BIN, .SMC, .GB открываются из «Загрузок». ' + key('F5') + ' и ' + key('F7') + ' сохраняют и загружают состояние.', 'a console emulator: NESticle (NES), Sega Mega Drive, ZSNES (SNES), and Game Boy. Nine cartridges are built in (Battle City, Super Mario Bros, Contra, Chip \'n Dale, Sonic 2, UMK3, Comix Zone, Super Mario World, Tetris); get other dumps at <code>www.emuland98.ru</code>, and .NES, .BIN, .SMC, and .GB files open from Downloads. ' + key('F5') + ' and ' + key('F7') + ' save and load a state.')}</td><td><button class="win-help-shortcut" data-run="emuland">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('sound-recorder')}</td><td><b>${L('Звукозапись (Sound Recorder)', 'Sound Recorder')}</b> — ${L('записывает звук с микрофона (до 60 секунд), накладывает эффекты (эхо, ускорение, замедление, обратное воспроизведение) и сохраняет WAV.', 'records audio from a microphone (up to 60 seconds), applies effects (echo, speed up, slow down, reverse), and saves WAV files.')}</td><td><button class="win-help-shortcut" data-run="sndrec32">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('volume-mixer')}</td><td><b>${L('Регулятор громкости (Volume Control)', 'Volume Control')}</b> — ${L('раздельные ползунки уровня и баланса для каналов Master, Wave, MIDI и CD Audio.', 'independent volume and balance sliders for Master, Wave, MIDI, and CD Audio channels.')}</td><td><button class="win-help-shortcut" data-run="sndvol32">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('video-player')}</td><td><b>${L('Универсальный проигрыватель (Media Player)', 'Media Player')}</b> — ${L('воспроизводит видеофайлы (AVI, MP4, MOV) из «Моих видео», с диска «Игромания» и из Проводника, с покадровым просмотром и полноэкранным режимом (' + key('Alt+Enter') + '). Отдельный пункт <b>ActiveMovie Player</b> в меню «Пуск» появляется после установки из SoftStore \'98.', 'plays video files (AVI, MP4, MOV) from My Videos, from the Igromania CD, and from Explorer, with frame stepping and full screen (' + key('Alt+Enter') + '). The separate <b>ActiveMovie Player</b> Start menu item appears after installing it from SoftStore \'98.')}</td><td><button class="win-help-shortcut" data-run="mplayer">${icon('shortcut-overlay')}</button></td></tr>
          </table>
          <h3>${L('Как быстро изменить громкость или звуки системы', 'To adjust volume or system sounds quickly')}</h3>
          <ol>
            <li>${L('Щелкните значок динамика', 'Click the speaker icon')} ${glyph('speaker')} ${L('в области уведомлений, чтобы подвинуть общий ползунок или выключить звук флажком «Выкл».', 'in the notification area to move the master slider or select Mute.')}</li>
            <li>${L('Дважды щелкните тот же значок для вызова полного микшера <b>Регулятор громкости</b>.', 'Double-click the speaker icon to open the full <b>Volume Control</b> mixer.')}</li>
            <li>${L('Чтобы послушать звуки запуска системы, ошибок и уведомлений, откройте апплеты <b>Мультимедиа</b> и <b>Звук</b> в Панели управления.', 'To audition the sounds for system startup, errors, and alerts, open the <b>Multimedia</b> and <b>Sounds</b> applets in Control Panel.')}</li>
          </ol>
          ${related('cpanel', 'apps', 'install')}
        `
      },
      {
        id: 'internet',
        keywords: L('интернет, internet explorer, netscape, модем, удаленный доступ, провайдер, icq, аська, почта, outlook express, mirc, irc, чат, hyperterminal, bbs, терминал, сайты, избранное, webseeker, поиск', 'internet, internet explorer, netscape, modem, dial-up, provider, icq, mail, outlook express, mirc, irc, chat, hyperterminal, bbs, terminal, sites, favorites, webseeker, search'),
        content: `
          <h2>${titles.internet}</h2>
          <p>${L('Для выхода в сеть и общения используются модемное соединение, два веб-обозревателя, почтовый клиент, мессенджер ICQ, IRC-клиент и терминал BBS. Система сразу подключена к «МТУ-Интел»: отдельно набирать номер не нужно.', 'Network access and online communication are handled by Dial-Up Networking, two web browsers, an e-mail client, ICQ instant messaging, an IRC client, and a BBS terminal. The system is already connected to MTU-Intel: you do not have to dial first.')}</p>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('dialup')}</td><td><b>${L('Удаленный доступ к сети (Dial-Up Networking)', 'Dial-Up Networking')}</b> — ${L('четыре провайдера (МТУ-Интел, РОЛ, Ситилайн, AOL) с набором номера через модем USRobotics 56K, звуком рукопожатия и счётчиком данных в трее. Если отключиться, Internet Explorer, Netscape и Outlook Express покажут страницу «нет соединения», а письма уйдут в «Исходящие».', 'four providers (MTU-Intel, ROL, Cityline, AOL) dialed through the USRobotics 56K modem with an audible handshake and a data counter in the tray. If you disconnect, Internet Explorer, Netscape, and Outlook Express show an offline page and mail waits in the Outbox.')}</td><td><button class="win-help-shortcut" data-run="dialup">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('internet-explorer')}</td><td><b>Internet Explorer 5</b> — ${L('обозреватель с меню «Файл», «Правка», «Вид», «Избранное» и «Справка», кнопками «Назад», «Вперед», «Остановить», «Обновить», «Домой», «Поиск», «Избранное», «Журнал», «Почта» и «Печать». Избранное и журнал открываются в боковой панели. При запуске открывается поисковая система WebSeeker 98 (<code>www.search98.com</code>).', 'a browser with File, Edit, View, Favorites, and Help menus and Back, Forward, Stop, Refresh, Home, Search, Favorites, History, Mail, and Print buttons. Favorites and History open in a side pane. It starts on the WebSeeker 98 search engine (<code>www.search98.com</code>).')}</td><td><button class="win-help-shortcut" data-run="ie">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('netscape')}</td><td><b>Netscape 6</b> — ${L('обозреватель с закладками, журналом и стартовой страницей <code>about:netscape</code>, который открывает <b>настоящий Интернет</b> через локальный шлюз и пересобирает любую страницу под веб 1998 года (меню «Вид»: выполнять JavaScript, украшения 1998 года, палитра 216 цветов). Адресная строка принимает и поисковые запросы. Нужен локальный сервер проекта (<code>npm start</code>); в Win98.exe он встроен.', 'a browser with bookmarks, history, and the <code>about:netscape</code> start page that opens the <b>real Internet</b> through a local gateway and rebuilds any page as 1998-style Web 1.0 (the View menu: run JavaScript, 1998 decorations, 216-color palette). The address bar also accepts search queries. It needs the project\'s local server (<code>npm start</code>), which is built into Win98.exe.')}</td><td><button class="win-help-shortcut" data-run="netscape">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('outlook')}</td><td><b>Outlook Express</b> — ${L('почтовый клиент с папками «Входящие», «Исходящие», «Отправленные», «Удаленные» и «Черновики», адресной книгой, ответами и пересылкой. В «Входящих» лежат десять писем (от Билла Гейтса, из клуба, рассылки и др.); на письма знакомым приходят живые ответы, а ссылки <code>mailto:</code> и кнопка «Почта» в обозревателях открывают новое сообщение.', 'an e-mail client with Inbox, Outbox, Sent Items, Deleted Items, and Drafts folders, an address book, reply, and forward. The Inbox holds ten messages (from Bill Gates, the club, mailing lists, and more); mail to acquaintances gets scripted replies, and <code>mailto:</code> links and the Mail button in the browsers open a new message.')}</td><td><button class="win-help-shortcut" data-run="outlook">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('icq-online')}</td><td><b>ICQ 98a</b> — ${L('мессенджер: ваш номер UIN 749210, четырнадцать контактов в трёх группах и контакт «Скрепыш» (UIN 199898), статусы «В сети», «Отошёл», «Не беспокоить», «Недоступен» и «Не в сети», мастер поиска и добавления, чат со смайликами и фирменный звук «Uh-oh!».', 'a messenger: your number is UIN 749210, fourteen contacts in three groups plus the Clippy contact (UIN 199898), the statuses Online, Away, Do Not Disturb, N/A, and Offline, a Find/Add wizard, chat with emoticons, and the classic "Uh-oh!" sound.')}</td><td><button class="win-help-shortcut" data-run="icq">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('mirc')}</td><td><b>mIRC 98 (RusNet IRC)</b> — ${L('клиент IRC, подключённый с самого начала под ником User98; серверы <code>irc.rinet.ru</code>, <code>irc.ptt.ru</code>, <code>irc.dal.net</code>, <code>irc.efnet.org</code>, каналы #win98, #igromania, #ru.anekdot и #quake2 и команды <code>/join</code>, <code>/part</code>, <code>/me</code>, <code>/slap</code>, <code>/whois</code>, <code>/nick</code>, <code>/topic</code>, <code>/msg</code>, <code>/clear</code>, <code>/anek</code>.', 'an IRC client connected from the start as User98; the servers <code>irc.rinet.ru</code>, <code>irc.ptt.ru</code>, <code>irc.dal.net</code>, and <code>irc.efnet.org</code>, the channels #win98, #igromania, #ru.anekdot, and #quake2, and the commands <code>/join</code>, <code>/part</code>, <code>/me</code>, <code>/slap</code>, <code>/whois</code>, <code>/nick</code>, <code>/topic</code>, <code>/msg</code>, <code>/clear</code>, and <code>/anek</code>.')}</td><td><button class="win-help-shortcut" data-run="mirc">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('hypertrm')}</td><td><b>HyperTerminal</b> — ${L('терминал ANSI для дозвона на четыре станции BBS (Night Owl BBS, Demos Gate BBS, Red Line Overclockers BBS и TechNet BBS Win 98 SE): эхо-конференции FidoNet, файловый архив с передачей по ZMODEM в «Загрузки», стена однострочных сообщений и дверь-игра.', 'an ANSI terminal for dialing four BBS stations (Night Owl BBS, Demos Gate BBS, Red Line Overclockers BBS, and the Win 98 SE TechNet BBS): FidoNet echoes, a file archive with ZMODEM transfers into Downloads, a one-liner wall, and a door game.')}</td><td><button class="win-help-shortcut" data-run="hypertrm">${icon('shortcut-overlay')}</button></td></tr>
          </table>
          <h3>${L('Сайты 1998 года', 'Web sites of 1998')}</h3>
          <p>${L('Каталог сайтов находится на стартовой странице WebSeeker 98 (<code>http://www.search98.com</code>); в «Избранном» Internet Explorer лежат Интерпедия, Microslop Win 98 Portal и WebSeeker 98.', 'The site directory is on the WebSeeker 98 start page (<code>http://www.search98.com</code>); the Internet Explorer Favorites hold Interpedia, Microslop Win 98 Portal, and WebSeeker 98.')}</p>
          <ul>
            <li>${L('<b>Поиск и порталы</b>: Яndex (<code>www.yandex.ru</code>), Рамблер (<code>www.rambler98.ru</code>), Cyberspace Times, портал Microslop (<code>www.microslop.com</code>), Retro-Web, газета «Сводка 99», Интерпедия, библиотека Мошкова.', '<b>Search and portals</b>: Yandex (<code>www.yandex.ru</code>), Rambler (<code>www.rambler98.ru</code>), Cyberspace Times, the Microslop portal (<code>www.microslop.com</code>), Retro-Web, the Svodka 99 newspaper, Interpedia, and the Moshkow library.')}</li>
            <li>${L('<b>Игры</b>: Steam, Blizzard, Valve, GSC Game World, LucasArts, BioWare, Emu-Land, «Игромания», GamerZone, CheatCC, Ashroad и сайты HSR (<code>hsr.hoyoverse.com</code>, вики AstralWiki).', '<b>Games</b>: Steam, Blizzard, Valve, GSC Game World, LucasArts, BioWare, Emu-Land, Igromania, GamerZone, CheatCC, Ashroad, and the HSR sites (<code>hsr.hoyoverse.com</code>, the Astral wiki).')}</li>
            <li>${L('<b>Программы и железо</b>: SoftStore \'98, 3ADVANCED, «Хакер», Blender, ThemeWorld \'98, Clippy98, Лаборатория Касперского (<code>www.avp.ru</code>), «Железный Цех \'98», 3dfx-Zone.', '<b>Software and hardware</b>: SoftStore \'98, 3ADVANCED, Xakep, Blender, ThemeWorld \'98, Clippy98, Kaspersky Lab (<code>www.avp.ru</code>), Ferrum \'98, and 3dfx-Zone.')}</li>
            <li>${L('<b>Кино и музыка</b>: Киномания (<code>www.kinomania98.ru</code>), WebCinema, YouVid (<code>www.youvid.com</code>), Poligon 3D, MuzZone, Car-Man, Король и Шут, The Prodigy, mp3-архив.', '<b>Film and music</b>: Kinomania, WebCinema, YouVid (<code>www.youvid.com</code>), Poligon 3D, MuzZone, Car-Man, Korol i Shut, The Prodigy, and an MP3 archive.')}</li>
            <li>${L('<b>Общение и развлечения</b>: аукцион «Молоток \'98» (<code>www.molotok98.ru</code>), веб-чат, ICQ, FidoNet, GeoCities, «Анекдоты», «Секретные материалы», Di Gi Charat.', '<b>Chat and fun</b>: the Molotok \'98 auction (<code>www.molotok98.ru</code>), a web chat, ICQ, FidoNet, GeoCities, Anekdot, the X-Files site, and Di Gi Charat.')}</li>
          </ul>
          ${note([
            L('Адрес домашней страницы и очистка журнала находятся в апплете <b>Свойства обозревателя (inetcpl.cpl)</b>; при запуске Internet Explorer всегда открывает WebSeeker 98. Кнопки «Загрузить» на сайтах сохраняют файлы в папку «Загрузки»; отдельного менеджера загрузок нет.', 'The home page address and history cleanup are in the <b>Internet Options (inetcpl.cpl)</b> applet; Internet Explorer itself always starts on WebSeeker 98. Download buttons on sites save files to the Downloads folder; there is no separate download manager.')
          ])}
          ${related('cpanel', 'startmenu', 'install', 'apps')}
        `
      },
      {
        id: 'cpanel',
        keywords: L('панель управления, экран, обои, заставка, тема, оформление, эффекты, настройка, глубина цвета, мышь, кнопки мыши, левша, правша, указатели, курсор, шлейф, система, диспетчер устройств, быстродействие, виртуальная память, электропитание, спящий режим, energy star, установка и удаление программ, компоненты, загрузочный диск, мультимедиа, звуки, звук, аудио, дата и время, часовой пояс, язык и стандарты, свойства обозревателя, панель задач, клавиатура, шрифты, принтеры, сеть, специальные возможности, залипание, высокая контрастность, игровые устройства, джойстик, модемы, пароли, пользователи, назначенные задания, desk.cpl, main.cpl, sysdm.cpl, powercfg.cpl, appwiz.cpl, mmsys.cpl, timedate.cpl, intl.cpl, inetcpl.cpl, sounds.cpl, keyboard.cpl, netcpl.cpl, access.cpl, joy.cpl, modem.cpl, password.cpl, users.cpl', 'control panel, display, wallpaper, screen saver, theme, appearance, effects, settings, color depth, mouse, mouse buttons, left-handed, right-handed, pointers, cursor, trails, system, device manager, performance, virtual memory, power management, standby, energy star, add remove programs, components, startup disk, multimedia, sounds, audio, date time, time zone, regional settings, internet options, taskbar, keyboard, fonts, printers, network, accessibility, stickykeys, high contrast, game controllers, joystick, modems, passwords, users, scheduled tasks, desk.cpl, main.cpl, sysdm.cpl, powercfg.cpl, appwiz.cpl, mmsys.cpl, timedate.cpl, intl.cpl, inetcpl.cpl, sounds.cpl, keyboard.cpl, netcpl.cpl, access.cpl, joy.cpl, modem.cpl, password.cpl, users.cpl'),
        content: `
          <h2>${titles.cpanel}</h2>
          <p>${L('Откройте «Пуск» → «Настройка» → «Панель управления» (или папку «Панель управления» внутри «Моего компьютера»). В Панели управления собраны 21 значок настройки оборудования, экрана, мыши, звука, питания, программ, сети и интерфейса.', 'Open Start → Settings → Control Panel (or the Control Panel folder inside My Computer). Control Panel contains 21 items for configuring hardware, display, mouse, audio, power management, software, network, and the shell interface.')}</p>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('monitor')}</td><td><b>${L('Экран (desk.cpl)', 'Display (desk.cpl)')}</b> — ${L('фоновый рисунок, заставка, цветовая схема, визуальные эффекты, значки рабочего стола, темы Microslop Plus! 98 и глубина цвета.', 'desktop background, screen saver, color scheme, visual effects, desktop icons, Microslop Plus! 98 themes, and color depth.')}</td><td><button class="win-help-shortcut" data-run="desk.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('mouse')}</td><td><b>${L('Мышь (main.cpl)', 'Mouse (main.cpl)')}</b> — ${L('кнопки для правши и левши, скорость двойного щелчка, схемы указателей, скорость движения и след курсора.', 'right/left-handed buttons, double-click speed, pointer schemes, motion speed, and pointer trails.')}</td><td><button class="win-help-shortcut" data-run="main.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('system')}</td><td><b>${L('Система (sysdm.cpl)', 'System (sysdm.cpl)')}</b> — ${L('сведения о компьютере, Диспетчер устройств, быстродействие, ускорение графики и виртуальная память.', 'system summary, Device Manager hardware tree, performance tuning, graphics acceleration, and virtual memory.')}</td><td><button class="win-help-shortcut" data-run="sysdm.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('powercfg')}</td><td><b>${L('Электропитание (powercfg.cpl)', 'Power Management (powercfg.cpl)')}</b> — ${L('схемы управления питанием Energy Star, таймеры отключения монитора и дисков, значок в трее.', 'Energy Star power schemes, monitor standby and disk spin-down timers, and tray power meter.')}</td><td><button class="win-help-shortcut" data-run="powercfg.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('appwiz')}</td><td><b>${L('Установка и удаление программ (appwiz.cpl)', 'Add/Remove Programs (appwiz.cpl)')}</b> — ${L('установка и удаление программ, выбор компонентов Win 98 и создание загрузочной дискеты A:.', 'install or remove applications, toggle Win 98 components, and create a Startup Disk on drive A:.')}</td><td><button class="win-help-shortcut" data-run="appwiz.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('multimedia')}</td><td><b>${L('Мультимедиа (mmsys.cpl)', 'Multimedia (mmsys.cpl)')}</b> — ${L('окно «Звуки и мультимедиа»: события Win 98 со звуками, выбор аудиоустройства и вызов микшера громкости.', 'the Sounds and Multimedia window: Win 98 events with their sounds, playback device selection, and volume mixer access.')}</td><td><button class="win-help-shortcut" data-run="mmsys.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('timedate')}</td><td><b>${L('Дата и время (timedate.cpl)', 'Date/Time (timedate.cpl)')}</b> — ${L('календарь, часы со стрелками, точное время и часовой пояс.', 'calendar, analog clock, current time, and time zone settings.')}</td><td><button class="win-help-shortcut" data-run="timedate.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('regional')}</td><td><b>${L('Язык и стандарты (intl.cpl)', 'Regional Settings (intl.cpl)')}</b> — ${L('переключение языка системы (Русский / English) и образцы форматов времени, даты и валюты.', 'switches the system language (Russian / English) and previews time, date, and currency formats.')}</td><td><button class="win-help-shortcut" data-run="intl.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('inetcpl')}</td><td><b>${L('Свойства обозревателя (inetcpl.cpl)', 'Internet Options (inetcpl.cpl)')}</b> — ${L('домашняя страница Internet Explorer, удаление временных файлов и очистка журнала.', 'Internet Explorer home page, temporary files cleanup, and browsing history reset.')}</td><td><button class="win-help-shortcut" data-run="inetcpl.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('taskbar-props')}</td><td><b>${L('Панель задач и меню «Пуск»', 'Taskbar & Start Menu')}</b> — ${L('автоскрытие панели задач, часы, добавление и удаление ярлыков в меню «Пуск», очистка документов.', 'taskbar auto-hide, clock visibility, adding/removing Start menu shortcuts, and clearing recent documents.')}</td><td><button class="win-help-shortcut" data-run="taskbar-props">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('multimedia')}</td><td><b>${L('Звук (sounds.cpl)', 'Sounds (sounds.cpl)')}</b> — ${L('список системных событий с кнопкой прослушивания звука.', 'the list of system events with a button to play each sound.')}</td><td><button class="win-help-shortcut" data-run="sounds.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('keyboard')}</td><td><b>${L('Клавиатура (keyboard.cpl)', 'Keyboard (keyboard.cpl)')}</b> — ${L('скорость повтора и мигания курсора, раскладки Ru и En.', 'repeat rate and cursor blink rate, and the Ru and En layouts.')}</td><td><button class="win-help-shortcut" data-run="keyboard.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('fonts')}</td><td><b>${L('Шрифты (fonts)', 'Fonts (fonts)')}</b> — ${L('папка <code>C:\\WINDOWS\\Fonts</code> с просмотром начертаний.', 'the <code>C:\\WINDOWS\\Fonts</code> folder with a font viewer.')}</td><td><button class="win-help-shortcut" data-run="fonts">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('printers')}</td><td><b>${L('Принтеры (printers)', 'Printers (printers)')}</b> — ${L('папка принтеров; принтеры в ней пока не установлены.', 'the printers folder; no printers are installed in it yet.')}</td><td><button class="win-help-shortcut" data-run="printers">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('network')}</td><td><b>${L('Сеть (netcpl.cpl)', 'Network (netcpl.cpl)')}</b> — ${L('компоненты сети, имя компьютера и рабочая группа.', 'network components, computer name, and workgroup.')}</td><td><button class="win-help-shortcut" data-run="netcpl.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('accessibility')}</td><td><b>${L('Специальные возможности (access.cpl)', 'Accessibility Options (access.cpl)')}</b> — ${L('вкладки клавиатуры, звука, экрана и мыши; высокая контрастность.', 'keyboard, sound, display, and mouse tabs; high contrast.')}</td><td><button class="win-help-shortcut" data-run="access.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('joystick')}</td><td><b>${L('Игровые устройства (joy.cpl)', 'Game Controllers (joy.cpl)')}</b> — ${L('проверка джойстика и кнопок.', 'joystick and button test.')}</td><td><button class="win-help-shortcut" data-run="joy.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('modem')}</td><td><b>${L('Модемы (modem.cpl)', 'Modems (modem.cpl)')}</b> — ${L('свойства модема и диагностика.', 'modem properties and diagnostics.')}</td><td><button class="win-help-shortcut" data-run="modem.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('passwords')}</td><td><b>${L('Пароли (password.cpl)', 'Passwords (password.cpl)')}</b> — ${L('смена пароля и профили пользователей.', 'password change and user profiles.')}</td><td><button class="win-help-shortcut" data-run="password.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('users')}</td><td><b>${L('Пользователи (users.cpl)', 'Users (users.cpl)')}</b> — ${L('список пользователей.', 'the user list.')}</td><td><button class="win-help-shortcut" data-run="users.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('mstask')}</td><td><b>${L('Назначенные задания (mstask)', 'Scheduled Tasks (mstask)')}</b> — ${L('окно со списком заданий обслуживания.', 'a window with the list of maintenance tasks.')}</td><td><button class="win-help-shortcut" data-run="mstask">${icon('shortcut-overlay')}</button></td></tr>
          </table>

          <h3>${L('1. Экран (desk.cpl)', '1. Display (desk.cpl)')}</h3>
          <ul>
            <li>${L('<b>Фон</b> — «(Нет)», Clouds 98, Win 98 Setup, Space Cadet, 3D Pipes OpenGL и обои, скачанные с ThemeWorld \'98 (Matrix Code, Cyberpunk Neon 1998, Red Alert, Millennium Gold, DiGi Charat Akiba). Кнопка «Обзор...» берёт рисунок из «Моих документов»; режимы размещения — «По центру», «Замостить», «Растянуть».', '<b>Background</b> — (None), Clouds 98, Win 98 Setup, Space Cadet, 3D Pipes OpenGL, and wallpapers downloaded from ThemeWorld \'98 (Matrix Code, Cyberpunk Neon 1998, Red Alert, Millennium Gold, DiGi Charat Akiba). Browse... picks an image from My Documents; the display modes are Center, Tile, and Stretch.')}</li>
            <li>${L('<b>Заставка</b> — «Трубы 3D», «Звёздное поле», «Мистика», «Цветной куб», «Объемный лабиринт», «Объемный текст», «(Нет)» и скачанные с ThemeWorld \'98 «The Matrix Code» и «3D Flying Win». Интервал ожидания от 1 до 60 минут (по умолчанию 3), кнопка «Просмотр» и переход к энергосбережению монитора.', '<b>Screen Saver</b> — 3D Pipes, Starfield, Mystify Your Mind, 3D FlowerBox, 3D Maze, 3D Text, (None), plus The Matrix Code and 3D Flying Win downloaded from ThemeWorld \'98. The wait time is 1 to 60 minutes (3 by default), with a Preview button and a jump to monitor power settings.')}</li>
            <li>${L('<b>Оформление</b> — 8 цветовых схем («Стандартная Win», «Баклажан», «Пустыня», «Морская волна», «Кирпич», «Сирень», «Дождливый день», «Гроза»), которые задают цвет рабочего стола и градиент заголовков окон, и палитра из 20 цветов: щелчок по заголовку образца меняет цвет заголовка, по остальному полю — цвет стола.', '<b>Appearance</b> — 8 color schemes (Win Standard, Eggplant, Desert, Marine, Brick, Lilac, Rainy Day, Storm) that set the desktop color and the title-bar gradient, and a 20-color palette: a click on the sample\'s title bar changes the title color, a click elsewhere changes the desktop color.')}</li>
            <li>${L('<b>Эффекты</b> — замена значков «Мой компьютер», «Мои документы», «Сетевое окружение» и «Корзина» (полная и пустая) через «Сменить значок...», а также флажки: «Крупные значки», «Отображать значки с использованием всех возможных цветов» (снятие включает 16-цветный режим), анимация окон, сглаживание шрифтов, «Отображать содержимое окна при перетаскивании» и «Эффект ЭЛТ-монитора» (включен по умолчанию).', '<b>Effects</b> — change the icons for My Computer, My Documents, Network Neighborhood, and Recycle Bin (full and empty) via Change Icon..., and toggle Large icons, Show icons using all possible colors (clearing switches to 16-color mode), window animation, font smoothing, Show window contents while dragging, and CRT monitor scanlines (on by default).')}</li>
            <li>${L('<b>Темы Plus!</b> — готовые комплекты оформления Microslop Plus! 98 («Win 98 (Классическая)», «Космос», «Опасные твари», «Подводный мир», «Тайна», «Джунгли») и темы, скачанные с ThemeWorld \'98 («Матрица», «Неоновый Киберпанк 1998», «Красная тревога», «Золотой век»).', '<b>Plus! Themes</b> — complete Microslop Plus! 98 desktop themes (Win 98 Classic, Space, Dangerous Creatures, Underwater, Mystery, Jungle) and themes downloaded from ThemeWorld \'98 (The Matrix, Neon Cyberpunk 1998, Red Alert, Millennium Gold).')}</li>
            <li>${L('<b>Настройка</b> — глубина цвета (16 и 256 цветов меняют вид экрана, High Color и True Color оставляют его полноцветным), ползунок области экрана (640×480, 800×600, 1024×768; размер окна системы он не меняет) и кнопка «Дополнительно...» с вкладками сведений об адаптере, мониторе и 3dfx Voodoo2.', '<b>Settings</b> — color depth (16 and 256 colors change the look of the screen, High Color and True Color keep it full color), a screen area slider (640×480, 800×600, 1024×768; it does not resize the system window), and an Advanced... button with tabs about the adapter, the monitor, and the 3dfx Voodoo2.')}</li>
          </ul>

          <h3>${L('2. Мышь (main.cpl)', '2. Mouse (main.cpl)')}</h3>
          <ul>
            <li>${L('<b>Кнопки</b> — переключатель «Для правши» / «Для левши» (меняет местами основную и контекстную кнопки мыши), ползунок скорости двойного щелчка с проверочной шкатулкой (дважды щелкните по ней, чтобы клоун выпрыгнул или спрятался) и флажок «Отключить щелчки кнопок мыши» (если его применить, через 5 секунд Скрепыш придет на помощь и вернет управление).', '<b>Buttons</b> — Right-handed / Left-handed button configuration, a double-click speed slider with an interactive jack-in-the-box test area (double-click to make the clown pop out or hide), and a "Disable mouse button clicks" check box (if applied, Clippy automatically rescues your mouse after 5 seconds).')}</li>
            <li>${L('<b>Указатели</b> — выбор схемы курсоров («Стандартная Win», «Крупная (системная)», «3D-бронза», «Динозаврик (Plus! 98)», «Инверсная»), сохранение и удаление собственных схем и просмотр всех ролей указателя.', '<b>Pointers</b> — cursor schemes (Win Standard, Magnified System, 3D Bronze, Dinosaur Plus! 98, Inverted), saving and deleting custom schemes, and previewing all pointer roles.')}</li>
            <li>${L('<b>Перемещение</b> — ползунок скорости движения указателя и флажок «Отображать след указателя мыши» с настройкой длины шлейфа.', '<b>Motion</b> — a pointer speed slider and the "Show pointer trails" check box with a trail length slider.')}</li>
          </ul>

          <h3>${L('3. Система (sysdm.cpl)', '3. System (sysdm.cpl)')}</h3>
          <ul>
            <li>${L('<b>Общие</b> — версия Microslop Win 98 SE (4.10.1998 A), имя владельца, модель и тактовая частота процессора и объем оперативной памяти согласно текущим настройкам BIOS.', '<b>General</b> — Microslop Win 98 SE version (4.10.1998 A), registered owner, and CPU model, clock speed, and RAM capacity read from current BIOS settings.')}</li>
            <li>${L('<b>Устройства</b> — Диспетчер устройств с переключением вида («По типу» / «По подключению»), видеоадаптеры (3dfx Voodoo2 3D Accelerator, S3 Trio64V2/DX), звуковая плата (Creative Sound Blaster AWE64 Gold), привод CD-ROM (TOSHIBA XM-6202B), контроллеры дисков, порты COM/LPT и кнопка «Свойства» с прерываниями IRQ и состоянием драйвера.', '<b>Device Manager</b> — a hardware tree viewable by type or by connection, listing display adapters (3dfx Voodoo2, S3 Trio64V2/DX), the sound card (Creative Sound Blaster AWE64 Gold), the CD-ROM drive (TOSHIBA XM-6202B), disk controllers, COM/LPT ports, and a Properties dialog showing driver status and IRQ resources.')}</li>
            <li>${L('<b>Быстродействие</b> — сводка ресурсов системы и три диалога тонкой настройки: <b>«Файловая система...»</b> (роль компьютера, упреждающее чтение, кэш CD-ROM), <b>«Графика...»</b> (четыре ступени аппаратного ускорения) и <b>«Вирт. память...»</b> (размер файла подкачки <code>WIN386.SWP</code> на диске C:).', '<b>Performance</b> — a system resource summary plus three tuning dialogs: <b>File System...</b> (computer role, read-ahead optimization, CD-ROM cache), <b>Graphics...</b> (a four-step hardware acceleration slider), and <b>Virtual Memory...</b> (the <code>WIN386.SWP</code> swap file size on drive C:).')}</li>
          </ul>

          <h3>${L('4. Электропитание (powercfg.cpl)', '4. Power Management (powercfg.cpl)')}</h3>
          <ul>
            <li>${L('<b>Схемы управления питанием</b> — «Домашний или офисный настольный», «Портативный (ноутбук)» и «Всегда включен» (по умолчанию: монитор гаснет через 15 минут, диски останавливаются через 60), сохранение своей схемы кнопкой «Сохранить как...» и раздельные таймеры <b>отключения монитора</b> и <b>остановки жестких дисков</b> от 1 минуты до 5 часов или «Никогда». Монитор в режиме ожидания показывает сообщение «No sync signal».', '<b>Power Schemes</b> — Home/Office Desk, Portable/Laptop, and Always On (the default: the monitor turns off after 15 minutes and the disks spin down after 60), Save As... for custom schemes, and separate <b>Turn off monitor</b> and <b>Turn off hard disks</b> timers from 1 minute to 5 hours or Never. A monitor on standby shows a No sync signal message.')}</li>
            <li>${L('<b>Дополнительно</b> — флажок «Всегда отображать значок на панели задач» (выводит в трей значок питания с меню быстрого переключения схем и немедленного гашения монитора).', '<b>Advanced</b> — the "Always show icon on the taskbar" check box, placing a power icon in the tray for switching schemes or putting the monitor on standby on demand.')}</li>
          </ul>

          <h3>${L('5. Установка и удаление программ (appwiz.cpl)', '5. Add/Remove Programs (appwiz.cpl)')}</h3>
          <ul>
            <li>${L('<b>Установка и удаление</b> — кнопка <b>«Установить...»</b> запускает мастер, который ищет установочные пакеты <code>.EXE</code> на компакт-диске D: и в папке <code>C:\\My Documents\\Downloads</code>. В нижнем списке можно удалить установленную программу или игру либо открыть окно обслуживания Microslop Office 97 (оставить Скрепыша, восстановить шаблоны писем или временно спрятать его).', '<b>Install/Uninstall</b> — <b>Install...</b> launches a wizard that scans CD drive D: and <code>C:\\My Documents\\Downloads</code> for <code>.EXE</code> setup packages. The list below uninstalls an installed app or game or opens the Microslop Office 97 maintenance window (keep Clippy, repair the letter templates, or hide him for now).')}</li>
            <li>${L('<b>Установка Win</b> — включение и отключение категорий системных компонентов (Стандартные, Связь, Мультимедиа, Игры, Служебные программы, Темы рабочего стола и др.) с просмотром отдельных модулей по кнопке «Состав...».', '<b>Win Setup</b> — enables or disables categories of system components (Accessories, Communications, Multimedia, Games, System Tools, Desktop Themes, etc.) with a Details... dialog for individual subcomponents.')}</li>
            <li>${L('<b>Загрузочный диск</b> — кнопка <b>«Создать диск...»</b> форматирует виртуальную дискету <b>A:</b> и записывает на неё системные файлы аварийной загрузки MS-DOS (<code>COMMAND.COM</code>, <code>FDISK.EXE</code>, <code>FORMAT.COM</code>, <code>SCANDISK.EXE</code>, <code>HIMEM.SYS</code>, <code>OAKCDROM.SYS</code>, <code>EBD.CAB</code>).', '<b>Startup Disk</b> — <b>Create Disk...</b> formats virtual floppy drive <b>A:</b> and writes the MS-DOS emergency boot utilities (<code>COMMAND.COM</code>, <code>FDISK.EXE</code>, <code>FORMAT.COM</code>, <code>SCANDISK.EXE</code>, <code>HIMEM.SYS</code>, <code>OAKCDROM.SYS</code>, <code>EBD.CAB</code>).')}</li>
          </ul>

          <h3>${L('6. Мультимедиа, Дата и время, Язык, Обозреватель и Панель задач', '6. Multimedia, Date/Time, Regional, Internet, and Taskbar')}</h3>
          <ul>
            <li>${L('<b>Мультимедиа (mmsys.cpl)</b> — на вкладке «Звуки» перечислены семь событий системы (запуск, завершение, сигнал, аккорд, ошибка, вопрос, щелчок) с кнопкой прослушивания; на вкладке «Аудио» выбирается устройство воспроизведения, а кнопка «Громкость...» открывает микшер.', '<b>Multimedia (mmsys.cpl)</b> — the Sounds tab lists seven system events (startup, shutdown, ding, chord, error, question, click) with a play button; the Audio tab selects the playback device, and the Volume... button opens the mixer.')}</li>
            <li>${L('<b>Дата и время (timedate.cpl)</b> — месяц, год, число и время на вкладке «Дата и время» и список часовых поясов на вкладке «Часовой пояс».', '<b>Date/Time (timedate.cpl)</b> — month, year, day, and time on the Date & Time tab and a list of time zones on the Time Zone tab.')}</li>
            <li>${L('<b>Язык и стандарты (intl.cpl)</b> — единственная вкладка «Язык системы»: мгновенно переключает язык всей оболочки между русским и английским и показывает примеры форматирования чисел, валюты, времени и даты.', '<b>Regional Settings (intl.cpl)</b> — a single System Language tab: switches the entire shell between Russian and English at once and previews number, currency, time, and date formatting.')}</li>
            <li>${L('<b>Свойства обозревателя (inetcpl.cpl)</b> — поле домашней страницы (кнопки «С текущей», «По умолчанию» <code>http://www.search98.com</code>, «Пустая» <code>about:blank</code>), удаление временных файлов Интернета и очистка журнала.', '<b>Internet Options (inetcpl.cpl)</b> — the home page field (Use Current, Use Default <code>http://www.search98.com</code>, or Use Blank <code>about:blank</code>), deleting temporary Internet files, and clearing the history list.')}</li>
            <li>${L('<b>Панель задач и меню «Пуск»</b> — на вкладке «Параметры панели задач» переключаются флажки «Располагать поверх других окон», «Автоматически убирать с экрана», «Мелкие значки в главном меню» и «Отображать часы» (с живым образцом); на вкладке «Настройка меню "Пуск"» кнопки «Добавить...», «Удалить...» и «Дополнительно...» управляют ярлыками программ, а кнопка «Очистить» стирает список недавних документов и историю окна «Выполнить».', '<b>Taskbar & Start Menu</b> — the Taskbar Options tab toggles Always on top, Auto hide, Show small icons in Start menu, and Show clock (with a live preview); the Start Menu Programs tab provides Add..., Remove..., and Advanced... to manage program shortcuts, and Clear to wipe recent documents and the Run history.')}</li>
          </ul>

          <h3>${L('7. Остальные значки', '7. The other items')}</h3>
          <ul>
            <li>${L('<b>Звук (sounds.cpl)</b> — девять системных событий и их звуковые файлы, схема («По умолчанию», «Нет звуков» и др.) и кнопка воспроизведения; системные звуки остаются прежними.', '<b>Sounds (sounds.cpl)</b> — nine system events and their sound files, a scheme box (Default, No Sounds, and others), and a play button; the real system sounds stay as they are.')}</li>
            <li>${L('<b>Клавиатура (keyboard.cpl)</b> — вкладка «Скорость» (задержка и скорость повтора, мигание курсора с живым образцом) и вкладка «Язык» со строками En и Ru; кнопка «Использовать по умолчанию» переключает язык оболочки. Эту же вкладку открывает правая кнопка по индикатору языка в трее.', '<b>Keyboard (keyboard.cpl)</b> — the Speed tab (repeat delay and rate, a cursor blink rate with a live sample) and the Language tab with En and Ru rows; Set as Default switches the shell language. The right button on the tray language indicator opens the same tab.')}</li>
            <li>${L('<b>Шрифты (fonts)</b> — открывает папку <code>C:\\WINDOWS\\Fonts</code> (ARIAL, COMIC, COUR, IMPACT, TAHOMA, TIMES, TREBUC, VERDANA, SERIFE, VGASYS). Двойной щелчок по шрифту открывает окно просмотра с алфавитом, кириллической фразой и образцами размером от 12 до 72 пунктов.', '<b>Fonts (fonts)</b> — opens the <code>C:\\WINDOWS\\Fonts</code> folder (ARIAL, COMIC, COUR, IMPACT, TAHOMA, TIMES, TREBUC, VERDANA, SERIFE, VGASYS). Double-clicking a font opens a viewer with the alphabet, a Cyrillic phrase, and samples from 12 to 72 points.')}</li>
            <li>${L('<b>Принтеры</b> — папка принтеров (она также есть в «Моем компьютере» и в «Пуск» → «Настройка»); принтеров в ней пока нет, а сетевой HP LaserJet 4L виден в Сетевом окружении.', '<b>Printers</b> — the printers folder (it is also in My Computer and Start → Settings); it has no printers yet, while a network HP LaserJet 4L is visible in Network Neighborhood.')}</li>
            <li>${L('<b>Сеть (netcpl.cpl)</b> — вкладки «Конфигурация» (список сетевых компонентов и свойства TCP/IP), «Идентификация» (имя компьютера и рабочая группа сохраняются) и «Управление доступом». Правая кнопка на Сетевом окружении → «Свойства» открывает то же окно.', '<b>Network (netcpl.cpl)</b> — the Configuration tab (the list of network components and TCP/IP properties), the Identification tab (the computer name and workgroup are saved), and the Access Control tab. The right button on Network Neighborhood → Properties opens the same window.')}</li>
            <li>${L('<b>Специальные возможности (access.cpl)</b> — вкладки «Клавиатура», «Звук», «Экран» и «Мышь». Работает режим <b>«Высокая контрастность»</b> (чёрный экран с жёлтым текстом); пять нажатий ' + key('Shift') + ' подряд предлагают включить залипание клавиш.', '<b>Accessibility Options (access.cpl)</b> — the Keyboard, Sound, Display, and Mouse tabs. The <b>High Contrast</b> mode works (a black screen with yellow text); pressing ' + key('Shift') + ' five times in a row offers to turn on StickyKeys.')}</li>
            <li>${L('<b>Игровые устройства (joy.cpl)</b> — виртуальный джойстик «Microslop SideWinder 3D Pro»: перекрестие, которое двигают мышью, значения осей X и Y и восемь индикаторов кнопок.', '<b>Game Controllers (joy.cpl)</b> — a virtual Microslop SideWinder 3D Pro joystick: a crosshair pad you move with the mouse, X and Y axis values, and eight button lamps.')}</li>
            <li>${L('<b>Модемы (modem.cpl)</b> — модем Sportster 56K Faxmodem PnP на COM2: вкладка «Общие» и вкладка «Диагностика» с отчётом по командам ATI0–ATI7. Соединение с провайдером настраивается в «Удаленном доступе к сети».', '<b>Modems (modem.cpl)</b> — the Sportster 56K Faxmodem PnP on COM2: the General tab and a Diagnostics tab with a report for the ATI0–ATI7 commands. The provider connection is set up in Dial-Up Networking.')}</li>
            <li>${L('<b>Пароли</b> и <b>Пользователи</b> — вкладки смены пароля и профилей и список «Администратор», «Гость». Вход в систему и «Завершение сеанса» от них не зависят.', '<b>Passwords</b> and <b>Users</b> — tabs for changing a password and profiles and a list with Administrator and Guest. Logging on and Log Off do not depend on them.')}</li>
            <li>${L('<b>Назначенные задания</b> — окно с тремя заданиями обслуживания (очистка диска, дефрагментация, ScanDisk) и кнопкой «Выполнить сейчас».', '<b>Scheduled Tasks</b> — a window with three maintenance tasks (disk cleanup, defragmentation, ScanDisk) and a Run Now button.')}</li>
          </ul>
          ${related('desktop', 'startmenu', 'multimedia', 'system')}
        `
      },
      {
        id: 'system',
        keywords: L('служебные, лаунчер, обновление win, обновить, диспетчер задач, системный монитор, sysmon, msconfig, sysedit, редактор файлов конфигурации, dxdiag, реестр, regedit, scandisk, дефрагментация, архивация, резервная копия, восстановление, сохранения, перенос, сброс, очистка диска, wintune, clibench, тест монитора, nokia, mon_test, антивирус, avp, касперский, сведения о системе, msinfo32, sfc, проверка системных файлов, scanreg, проверка реестра, назначенные задания, drvspace, winipcfg, сообщение об ошибке', 'system tools, launcher, win 98 update, task manager, system monitor, sysmon, msconfig, sysedit, system configuration editor, dxdiag, registry, regedit, scandisk, defrag, backup, restore, saves, transfer, reset, disk cleanup, wintune, clibench, monitor test, nokia, mon_test, antivirus, avp, kaspersky, system information, msinfo32, sfc, system file checker, scanreg, registry checker, scheduled tasks, drvspace, winipcfg, report a problem'),
        content: `
          <h2>${titles.system}</h2>
          <p>${L('Служебные программы расположены в меню «Пуск» → «Программы» → «Стандартные» → «Служебные». Они позволяют следить за ресурсами компьютера, редактировать конфигурационные файлы и реестр, обслуживать диск, делать резервные копии и тестировать оборудование.', 'System tools are located in Start → Programs → Accessories → System Tools. They monitor system resources, edit configuration files and the Registry, maintain disk drives, make backups, and benchmark hardware.')}</p>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('taskmgr')}</td><td><b>${L('Диспетчер задач (Task Manager)', 'Task Manager')}</b> — ${L('вкладки «Приложения», «Процессы», «Быстродействие», «Сеть» и «Службы»: список открытых программ и фоновых процессов (в том числе <code>clippy.exe</code>), графики загрузки и кнопка «Снять задачу». Его же открывают ' + key('Ctrl+Alt+Del') + ' и меню панели задач.', 'tabs Applications, Processes, Performance, Network, and Services: lists running programs and background processes (including <code>clippy.exe</code>), live graphs, and an End Task button. ' + key('Ctrl+Alt+Del') + ' and the taskbar menu open it too.')}</td><td><button class="win-help-shortcut" data-run="taskmgr">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('sysmon')}</td><td><b>${L('Системный монитор (System Monitor)', 'System Monitor')}</b> — ${L('графики в реальном времени: память, кэш и скорость приёма и передачи по модему.', 'real-time charts: memory, cache, and dial-up receive and send speed.')}</td><td><button class="win-help-shortcut" data-run="sysmon">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('msconfig')}</td><td><b>${L('Настройка системы (MSConfig)', 'System Configuration Utility (MSConfig)')}</b> — ${L('вкладки «Общие» (обычный, диагностический и выборочный запуск), SYSTEM.INI, WIN.INI и «Автозагрузка» со списком программ, например ClippyOffice.', 'tabs General (normal, diagnostic, and selective startup), SYSTEM.INI, WIN.INI, and Startup with the program list, for example ClippyOffice.')}</td><td><button class="win-help-shortcut" data-run="msconfig">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('msinfo32')}</td><td><b>${L('Сведения о системе (System Information)', 'System Information')}</b> — ${L('сводка о системе, аппаратные ресурсы и прерывания IRQ.', 'a system summary, hardware resources, and IRQs.')}</td><td><button class="win-help-shortcut" data-run="msinfo32">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('sfc')}</td><td><b>${L('Проверка системных файлов (SFC)', 'System File Checker (SFC)')}</b> — ${L('проверяет системные файлы и позволяет извлечь файл из архива (например, <code>KERNEL32.DLL</code>).', 'scans system files and can extract a file from the archive (for example <code>KERNEL32.DLL</code>).')}</td><td><button class="win-help-shortcut" data-run="sfc">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('regedit')}</td><td><b>${L('Проверка реестра (ScanReg)', 'Registry Checker (ScanReg)')}</b> — ${L('проверка реестра и его резервная копия.', 'scans the Registry and backs it up.')}</td><td><button class="win-help-shortcut" data-run="scanreg">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('regedit')}</td><td><b>${L('Редактор реестра (Registry Editor)', 'Registry Editor')}</b> — ${L('просмотр и изменение разделов реестра, поиск по ключам. Пункт стоит в «Программы», а не в «Служебных».', 'browses and edits Registry keys with key search. The item is on the Programs menu, not in System Tools.')}</td><td><button class="win-help-shortcut" data-run="regedit">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('sysedit')}</td><td><b>${L('Редактор файлов конфигурации (SysEdit)', 'System Configuration Editor (SysEdit)')}</b> — ${L('каскад окон с AUTOEXEC.BAT, CONFIG.SYS, WIN.INI и SYSTEM.INI. Открывается командой <code>sysedit</code>.', 'cascaded windows for AUTOEXEC.BAT, CONFIG.SYS, WIN.INI, and SYSTEM.INI. Open it with the <code>sysedit</code> command.')}</td><td><button class="win-help-shortcut" data-run="sysedit">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('dxdiag')}</td><td><b>${L('Диагностика DirectX (DxDiag)', 'DirectX Diagnostic Tool (DxDiag)')}</b> — ${L('вкладки «Система», «Дисплей» и «Звук» с испытаниями DirectDraw, Direct3D (вращающийся куб) и DirectSound. Открывается командой <code>dxdiag</code>.', 'the System, Display, and Sound tabs with DirectDraw, Direct3D (a spinning cube), and DirectSound tests. Open it with the <code>dxdiag</code> command.')}</td><td><button class="win-help-shortcut" data-run="dxdiag">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('scandisk')}</td><td><b>ScanDisk</b> — ${L('стандартная и полная проверка диска C: с автоматическим исправлением ошибок.', 'standard and thorough checks of drive C: with automatic error fixing.')}</td><td><button class="win-help-shortcut" data-run="scandisk">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('defrag')}</td><td><b>${L('Дефрагментация диска (Disk Defragmenter)', 'Disk Defragmenter')}</b> — ${L('карта кластеров с легендой (занятые, фрагментированные, системные, свободные, чтение, запись) и кнопки «Старт», «Пауза», «Продолжить», «Остановить».', 'a cluster map with a legend (used, fragmented, system, free, reading, writing) and Start, Pause, Resume, and Stop buttons.')}</td><td><button class="win-help-shortcut" data-run="defrag">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('cleanmgr')}</td><td><b>${L('Очистка диска (Disk Cleanup)', 'Disk Cleanup')}</b> — ${L('удаление временных файлов Интернета, временных файлов и содержимого Корзины с показом освобождаемого места.', 'frees disk space by removing temporary Internet files, temporary files, and Recycle Bin contents, showing the space to be reclaimed.')}</td><td><button class="win-help-shortcut" data-run="cleanmgr">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('drvspace')}</td><td><b>DriveSpace</b> — ${L('сжатие диска C: (DriveSpace 3), кнопка «Сжать диск...».', 'compression of drive C: (DriveSpace 3), with the Compress Drive... button.')}</td><td><button class="win-help-shortcut" data-run="drvspace">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('mstask')}</td><td><b>${L('Назначенные задания (Scheduled Tasks)', 'Scheduled Tasks')}</b> — ${L('очистка диска (по пятницам в 20:00), дефрагментация (по средам в 22:00) и ScanDisk (ежедневно в 12:00); кнопка «Выполнить сейчас» запускает выбранную программу.', 'disk cleanup (Fridays 20:00), defragmentation (Wednesdays 22:00), and ScanDisk (daily at 12:00); Run Selected Now launches the chosen tool.')}</td><td><button class="win-help-shortcut" data-run="mstask">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('backup')}</td><td><b>${L('Архивация данных (Backup)', 'Backup')}</b> — ${L('три вкладки. «Архивация» сохраняет выбранные компоненты (файлы, покупки Steam и установленные игры, реестр и настройки, рабочий стол и меню «Пуск», почту, сохранения каждой игры, настройки Скрепыша, Neko и WinAmp) в хранилище на диске C: или в файл <code>.bkf</code> для переноса на другой компьютер. «Восстановление» открывает архивы из хранилища или файла, при желании сначала сохраняет текущие данные и перезапускает Win 98. «Сброс» возвращает Win 98 к первому запуску либо стирает данные выбранных программ; перед сбросом можно сделать копию.', 'three tabs. Backup saves the chosen components (files, Steam purchases and installed games, Registry and settings, desktop and Start menu, mail, each game\'s saves, and Clippy, Neko, and WinAmp settings) to storage on drive C: or to a <code>.bkf</code> file for another computer. Restore opens archives from storage or a file, can first save your current data, and restarts Win 98. Reset returns Win 98 to its first start or deletes the data of selected programs; you can make a copy first.')}</td><td><button class="win-help-shortcut" data-run="msbackup">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('bugreport')}</td><td><b>${L('Сообщение об ошибке', 'Report a Problem')}</b> — ${L('клавиша ' + key('F10') + ' (в любой программе ' + key('Ctrl+F10') + ') снимает экран, запоминает окна и место в игре и отправляет отчёт разработчику. Пункт «Мои отчёты об ошибках» (<code>bugreport /list</code>) показывает, что с отчётом стало; подробности — в разделе об устранении неполадок.', key('F10') + ' (' + key('Ctrl+F10') + ' in any program) takes a screenshot, records open windows and your place in the game, and sends a report to the developer. My Problem Reports (<code>bugreport /list</code>) shows what happened to a report; see the troubleshooting topic for details.')}</td><td><button class="win-help-shortcut" data-run="bugreport">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('win-update')}</td><td><b>${L('Лаунчер Win 98', 'Win 98 Launcher')}</b> — ${L('открывается при запуске Win98.exe: показывает новости и изменения всех версий и ставит обновления, скачивая только изменённые файлы. Если обновление отложено, в области уведомлений появляется значок, а «Обновить сейчас» завершает работу Win 98 и открывает лаунчер. Сохранения при обновлении не меняются. Пункт «Обновление Win» в меню «Пуск» к лаунчеру не относится: он открывает сайт Win Update в Internet Explorer.', 'opens when Win98.exe starts: shows news and changes of every version and installs updates by downloading only the changed files. If you postpone an update, an icon appears in the notification area, and Update now shuts Win 98 down and opens the launcher. Saves never change on update. The Win Update item on the Start menu is not the launcher: it opens the Win Update web site in Internet Explorer.')}</td></tr>
            <tr><td class="win-help-table-glyph">${glyph('welcome')}</td><td><b>${L('Добро пожаловать в Win 98', 'Welcome to Win 98')}</b> — ${L('окно с четырьмя разделами: регистрация, подключение к Интернету, знакомство с Win 98 (открывает эту справку) и обслуживание компьютера.', 'a window with four sections: registration, connecting to the Internet, discovering Win 98 (opens this Help), and maintaining your computer.')}</td><td><button class="win-help-shortcut" data-run="welcome">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('wintune')}</td><td><b>Wintune 97 Benchmark / CLIbench</b> — ${L('замер производительности процессора, видеокарты, памяти и диска и сравнение с эталонными компьютерами 1998 года.', 'hardware benchmarks for the CPU, video card, memory, and disk compared with 1998 reference systems.')}</td><td><button class="win-help-shortcut" data-run="wintune">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('mon-test')}</td><td><b>NOKIA Monitor Test</b> — ${L('полноэкранные настроечные таблицы для проверки геометрии, сведения лучей, муара, контрастности и фокусировки монитора.', 'fullscreen calibration patterns for testing monitor geometry, convergence, moiré, contrast, and focus.')}</td><td><button class="win-help-shortcut" data-run="mon_test">${icon('shortcut-overlay')}</button></td></tr>
          </table>
          <p>${L('В «Служебных» есть также «Просмотр буфера обмена» и «Таблица символов» (см. стандартные программы) и пункт «Настройка BIOS (CMOS Setup)». Команда <code>winipcfg</code> открывает окно с IP-адресом.', 'System Tools also holds the ClipBook Viewer and Character Map (see accessories) and a Setup BIOS (CMOS Setup) item. The <code>winipcfg</code> command opens a window with the IP address.')}</p>
          ${note([
            L('<b>Антивирус Касперского (AVP 3.0)</b> покупается и скачивается на официальном сайте <b>Лаборатории Касперского</b> (<code>http://www.avp.ru</code>) и проверяет папки диска C: на вирусы со звуковым оповещением.', '<b>Kaspersky Anti-Virus (AVP 3.0)</b> can be purchased and downloaded from <b>Kaspersky Lab</b> (<code>http://www.avp.ru</code>) to scan drive C: folders for viruses.')
          ])}
          ${related('cpanel', 'run', 'troubleshooting', 'install')}
        `
      },
      {
        id: 'run',
        keywords: L('выполнить, команда, run, cmd, command, ms-dos, консоль, winver, dir, cd, cls, mem, ver, ping, ipconfig, winipcfg, format, reset, сброс, клиппи, control, адрес, сайт, файл', 'run, command, cmd, ms-dos, console, winver, dir, cd, cls, mem, ver, ping, ipconfig, winipcfg, format, reset, clippy, control, address, site, file'),
        content: `
          <h2>${titles.run}</h2>
          <p>${L('Окно «Пуск» → «Выполнить...» (или ' + key('Win+R') + ') открывает программу, апплет Панели управления, папку, файл или веб-страницу по короткому имени. Список в окне хранит последние 15 команд.', 'The Start → Run... dialog (or ' + key('Win+R') + ') opens a program, a Control Panel applet, a folder, a file, or a web page by its short name. The drop-down list keeps your last 15 commands.')}</p>
          <h3>${L('Основные команды окна «Выполнить»', 'Common Run dialog commands')}</h3>
          <table class="win-help-table">
            <tr><th>${L('Команда', 'Command')}</th><th>${L('Что открывает', 'What it opens')}</th></tr>
            <tr><td><code>control</code></td><td>${L('Панель управления; <code>control desk.cpl</code>, <code>control mouse</code> и т. п. открывают нужный апплет', 'Control Panel; <code>control desk.cpl</code>, <code>control mouse</code>, and so on open that applet')}</td></tr>
            <tr><td><code>desk.cpl</code> / <code>main.cpl</code> / <code>sysdm.cpl</code></td><td>${L('Свойства: Экран / Мышь / Система', 'Display / Mouse / System Properties')}</td></tr>
            <tr><td><code>powercfg.cpl</code> / <code>appwiz.cpl</code> / <code>mmsys.cpl</code></td><td>${L('Электропитание / Установка программ / Мультимедиа', 'Power Management / Add-Remove Programs / Multimedia')}</td></tr>
            <tr><td><code>timedate.cpl</code> / <code>intl.cpl</code> / <code>inetcpl.cpl</code></td><td>${L('Дата и время / Язык и стандарты / Свойства обозревателя', 'Date-Time / Regional Settings / Internet Options')}</td></tr>
            <tr><td><code>sounds.cpl</code> / <code>keyboard.cpl</code> / <code>netcpl.cpl</code> / <code>access.cpl</code></td><td>${L('Звук / Клавиатура / Сеть / Специальные возможности', 'Sounds / Keyboard / Network / Accessibility Options')}</td></tr>
            <tr><td><code>joy.cpl</code> / <code>modem.cpl</code> / <code>password.cpl</code> / <code>users.cpl</code></td><td>${L('Игровые устройства / Модемы / Пароли / Пользователи', 'Game Controllers / Modems / Passwords / Users')}</td></tr>
            <tr><td><code>printers</code> / <code>fonts</code> / <code>mstask</code> / <code>control taskbar</code></td><td>${L('Принтеры / Шрифты / Назначенные задания / Панель задач и меню «Пуск»', 'Printers / Fonts / Scheduled Tasks / Taskbar & Start Menu')}</td></tr>
            <tr><td><code>notepad</code> / <code>wordpad</code> / <code>mspaint</code> / <code>calc</code></td><td>${L('Блокнот / WordPad / Paint / Калькулятор', 'Notepad / WordPad / Paint / Calculator')}</td></tr>
            <tr><td><code>charmap</code> / <code>clipbrd</code> / <code>kodakimg</code> / <code>qbasic</code></td><td>${L('Таблица символов / Буфер обмена / Просмотр картинок / QBasic', 'Character Map / ClipBook Viewer / Imaging / QBasic')}</td></tr>
            <tr><td><code>winmine</code> / <code>sol</code> / <code>freecell</code> / <code>pinball</code> / <code>bliss</code> / <code>hearts</code></td><td>${L('Сапер / Косынка / FreeCell / 3D Pinball / Безмятежность / Червы', 'Minesweeper / Solitaire / FreeCell / 3D Pinball / Bliss / Hearts')}</td></tr>
            <tr><td><code>acdsee</code> / <code>acrobat</code> / <code>winrar</code> / <code>neko</code> / <code>excel</code></td><td>${L('ACDSee / Acrobat Reader / WinRAR / Neko / Excel 97', 'ACDSee / Acrobat Reader / WinRAR / Neko / Excel 97')}</td></tr>
            <tr><td><code>winamp</code> / <code>cdplayer</code> / <code>cdex</code> / <code>ft2</code> / <code>emuland</code> / <code>sndrec32</code> / <code>sndvol32</code> / <code>mplayer</code></td><td>${L('WinAmp / Лазерный проигрыватель / CDex / FastTracker / Emu-Land 98 / Звукозапись / Громкость / Медиаплеер', 'WinAmp / CD Player / CDex / FastTracker / Emu-Land 98 / Sound Recorder / Volume Control / Media Player')}</td></tr>
            <tr><td><code>iexplore</code> / <code>netscape</code> / <code>outlook</code> / <code>icq</code> / <code>mirc</code> / <code>hypertrm</code> / <code>dialup</code></td><td>${L('Internet Explorer / Netscape / Outlook Express / ICQ / mIRC / HyperTerminal / Удаленный доступ к сети', 'Internet Explorer / Netscape / Outlook Express / ICQ / mIRC / HyperTerminal / Dial-Up Networking')}</td></tr>
            <tr><td><code>taskmgr</code> / <code>sysmon</code> / <code>msconfig</code> / <code>sysedit</code> / <code>dxdiag</code> / <code>regedit</code></td><td>${L('Диспетчер задач / Системный монитор / Настройка системы / SysEdit / DirectX / Реестр', 'Task Manager / System Monitor / MSConfig / SysEdit / DirectX Diagnostic / Registry Editor')}</td></tr>
            <tr><td><code>msinfo32</code> / <code>sfc</code> / <code>scanreg</code> / <code>drvspace</code> / <code>winipcfg</code></td><td>${L('Сведения о системе / Проверка системных файлов / Проверка реестра / DriveSpace / IP-конфигурация', 'System Information / System File Checker / Registry Checker / DriveSpace / IP Configuration')}</td></tr>
            <tr><td><code>scandisk</code> / <code>defrag</code> / <code>cleanmgr</code> / <code>wintune</code> / <code>clibench</code> / <code>mon_test</code></td><td>${L('ScanDisk / Дефрагментация / Очистка диска / Wintune 97 / CLIbench / Тест монитора', 'ScanDisk / Disk Defragmenter / Disk Cleanup / Wintune 97 / CLIbench / Monitor Test')}</td></tr>
            <tr><td><code>msbackup</code> / <code>restore</code> / <code>bugreport</code> / <code>bugreport /list</code></td><td>${L('Архивация данных / Восстановление из архива / Сообщение об ошибке / Мои отчёты об ошибках', 'Backup / Restore from a backup / Report a Problem / My Problem Reports')}</td></tr>
            <tr><td><code>command</code> / <code>clippy</code> / <code>winver</code> / <code>welcome</code> / <code>help</code></td><td>${L('Сеанс MS-DOS / Помощник Скрепыш / О программе Win / Добро пожаловать в Win 98 / Справка', 'MS-DOS Prompt / Clippy / About Win / Welcome to Win 98 / Help')}</td></tr>
            <tr><td><code>steam</code> / <code>wupdmgr</code></td><td>${L('Steam (или страница его загрузки) / сайт Win Update', 'Steam (or its download page) / the Win Update site')}</td></tr>
          </table>
          <h3>${L('Адреса, папки, файлы и игры', 'Addresses, folders, files, and games')}</h3>
          <ul>
            <li>${L('Адрес вида <code>www.search98.com</code> или <code>http://...</code> открывается в Internet Explorer.', 'An address such as <code>www.search98.com</code> or <code>http://...</code> opens in Internet Explorer.')}</li>
            <li>${L('<code>c:</code>, <code>d:</code>, <code>windows</code>, <code>program files</code>, <code>my documents</code>, <code>my computer</code> и «Корзина» открывают нужную папку.', '<code>c:</code>, <code>d:</code>, <code>windows</code>, <code>program files</code>, <code>my documents</code>, <code>my computer</code>, and Recycle Bin open that folder.')}</li>
            <li>${L('Файлы <code>.txt</code>, <code>.ini</code>, <code>.log</code>, <code>.bat</code>, <code>.sys</code> открываются в Блокноте, рисунки (<code>.bmp</code>, <code>.png</code>, <code>.jpg</code>, <code>.gif</code>) — в «Просмотре картинок», видео — в Медиаплеере, образы <code>.nes</code>, <code>.smc</code>, <code>.gb</code> — в Emu-Land 98.', '<code>.txt</code>, <code>.ini</code>, <code>.log</code>, <code>.bat</code>, and <code>.sys</code> files open in Notepad, images (<code>.bmp</code>, <code>.png</code>, <code>.jpg</code>, <code>.gif</code>) in Imaging, video in Media Player, and <code>.nes</code>, <code>.smc</code>, <code>.gb</code> dumps in Emu-Land 98.')}</li>
            <li>${L('Игры запускаются по названию (<code>doom</code>, <code>diablo</code>, <code>fallout</code> и др.). Если игра не установлена, система отправит вас в Steam или к демоверсии на диске «Игромания».', 'Games launch by name (<code>doom</code>, <code>diablo</code>, <code>fallout</code>, and others). If the game is not installed, the system sends you to Steam or to the demo on the Igromania CD.')}</li>
            <li>${L('Команды <code>shutdown</code> и <code>restart</code> завершают работу и перезагружают систему, <code>bsod</code> показывает синий экран, а <code>reset</code> (и <code>format c:</code>) предлагает вернуть Win 98 к первому запуску и спрашивает подтверждение.', '<code>shutdown</code> and <code>restart</code> shut down and restart the system, <code>bsod</code> shows a blue screen, and <code>reset</code> (and <code>format c:</code>) offers to return Win 98 to its first start and asks for confirmation.')}</li>
            <li>${L('Неизвестное имя приводит к сообщению о том, что файл не найден.', 'An unknown name produces a not-found message.')}</li>
          </ul>
          <h3>${L('Сеанс MS-DOS (command.com)', 'MS-DOS Prompt (command.com)')}</h3>
          <p>${L('Окно «Сеанс MS-DOS» открывается из «Пуск» → «Программы» или командой <code>command</code>. Кнопка «Во весь экран» переводит его в полноэкранный режим. В окне работают команды: <code>HELP</code>, <code>DIR</code>, <code>CD</code>, <code>TREE</code>, <code>MD</code>, <code>DEL</code>, <code>COPY</code>, <code>REN</code>, <code>ATTRIB</code>, <code>TYPE</code>, <code>EDIT</code>, <code>CLS</code>, <code>VER</code>, <code>DATE</code>, <code>TIME</code>, <code>ECHO</code>, <code>MEM</code>, <code>PING</code>, <code>IPCONFIG</code>, <code>WINIPCFG</code>, <code>FORMAT A:</code>, <code>CALC</code>, <code>NOTEPAD</code>, <code>WINVER</code>, <code>CLIPPY</code>, <code>A:</code>, <code>C:</code> и <code>D:</code> (смена диска) и <code>EXIT</code>. <code>EDIT файл</code> открывает синий текстовый редактор (' + key('Ctrl+S') + ' — сохранить, ' + key('Esc') + ' — выйти), а <code>CLIPPY вопрос</code> задаёт вопрос Скрепышу. Форматировать можно только дискету A:; диск C: система форматировать отказывается.', 'The MS-DOS Prompt window opens from Start → Programs or with the <code>command</code> command. Its Full Screen button switches to full-screen mode. The window supports <code>HELP</code>, <code>DIR</code>, <code>CD</code>, <code>TREE</code>, <code>MD</code>, <code>DEL</code>, <code>COPY</code>, <code>REN</code>, <code>ATTRIB</code>, <code>TYPE</code>, <code>EDIT</code>, <code>CLS</code>, <code>VER</code>, <code>DATE</code>, <code>TIME</code>, <code>ECHO</code>, <code>MEM</code>, <code>PING</code>, <code>IPCONFIG</code>, <code>WINIPCFG</code>, <code>FORMAT A:</code>, <code>CALC</code>, <code>NOTEPAD</code>, <code>WINVER</code>, <code>CLIPPY</code>, <code>A:</code>, <code>C:</code>, and <code>D:</code> (change drive), and <code>EXIT</code>. <code>EDIT file</code> opens a blue text editor (' + key('Ctrl+S') + ' saves, ' + key('Esc') + ' exits), and <code>CLIPPY question</code> asks Clippy a question. Only floppy drive A: can be formatted; the system refuses to format drive C:.')}</p>
          <p>${L('Полноэкранный MS-DOS открывается из «Завершения работы» (пункт «Перезагрузить в режиме MS-DOS»), из меню загрузки F8 (пункт 5) или командой <code>dos</code>. В нём работают <code>DIR</code>, <code>VER</code>, <code>ECHO</code>, <code>CLS</code>, <code>HELP</code>, <code>BIOS</code> (или <code>SETUP</code>) для входа в BIOS Setup, <code>WIN</code> и <code>EXIT</code> для возврата. Команды <code>FORMAT</code> и <code>RESET</code> в этом режиме предлагают вернуть Win 98 к первому запуску.', 'Full-screen MS-DOS opens from Shut Down (Restart in MS-DOS mode), from the F8 startup menu (choice 5), or with the <code>dos</code> command. It supports <code>DIR</code>, <code>VER</code>, <code>ECHO</code>, <code>CLS</code>, <code>HELP</code>, <code>BIOS</code> (or <code>SETUP</code>) to enter BIOS Setup, and <code>WIN</code> and <code>EXIT</code> to return. In this mode <code>FORMAT</code> and <code>RESET</code> offer to return Win 98 to its first start.')}</p>
          ${shortcut('open_run', L('Щелкните здесь, чтобы открыть окно «Выполнить».', 'Click here to open the Run dialog.'))}
          ${shortcut('command', L('Щелкните здесь, чтобы открыть сеанс MS-DOS.', 'Click here to open the MS-DOS Prompt.'))}
          ${related('system', 'cpanel', 'shortcuts', 'troubleshooting')}
        `
      },
      {
        id: 'troubleshooting',
        keywords: L('неполадки, ошибка, зависание, снять задачу, синий экран, bsod, диск, восстановление, мышь не щелкает, экран погас, спящий режим, bios, cmos, разгон, частота, память, сообщение об ошибке, f10, баг, безопасный режим, сброс, первый запуск, архивация, нет сети, игра не установлена', 'troubleshooting, error, hang, end task, blue screen, bsod, disk, recovery, mouse clicks disabled, screen blank, standby, bios, cmos, overclock, frequency, memory, report a problem, f10, bug, safe mode, reset, first start, backup, no network, game not installed'),
        content: `
          <h2>${titles.troubleshooting}</h2>
          <h3>${L('Программа перестала отвечать', 'A program stops responding')}</h3>
          <ol>
            <li>${L('Откройте <b>Диспетчер задач</b>: нажмите ' + key('Ctrl+Alt+Del') + ' или выберите «Пуск» → «Программы» → «Стандартные» → «Служебные» → «Диспетчер задач».', 'Open <b>Task Manager</b>: press ' + key('Ctrl+Alt+Del') + ' or click Start → Programs → Accessories → System Tools → Task Manager.')}</li>
            <li>${L('Выделите зависшую программу на вкладке «Приложения» и нажмите <b>Снять задачу</b>.', 'Select the unresponsive application on the Applications tab and click <b>End Task</b>.')}</li>
          </ol>
          ${shortcut('taskmgr', L('Щелкните здесь, чтобы открыть Диспетчер задач.', 'Click here to open Task Manager.'))}

          <h3>${L('Вы нашли ошибку в системе или игре', 'You found a bug in the system or a game')}</h3>
          <ol>
            <li>${L('Нажмите ' + key('F10') + ' (в любой программе работает ' + key('Ctrl+F10') + '; в Fallout и «Другой войне» ' + key('F10') + ' занята самой игрой, в Honkai: Star Rail 98 используйте ' + key('F9') + '). Откроется окно «Сообщение об ошибке» со снимком экрана и строкой «Где» (окно, адрес в Internet Explorer, папка в Проводнике, место в игре).', 'Press ' + key('F10') + ' (' + key('Ctrl+F10') + ' works in every program; in Fallout and Another War ' + key('F10') + ' belongs to the game itself, and in Honkai: Star Rail 98 use ' + key('F9') + '). The Report a Problem window opens with a screenshot and a Where line (the window, the address in Internet Explorer, the folder in Explorer, the place in the game).')}</li>
            <li>${L('Напишите одну строку в поле «Что случилось?». Кнопка «Пометить» рисует красные рамки на снимке, «Скрыть» закрывает лишнее чёрным прямоугольником, «Показать данные» выводит всё, что будет отправлено; пароли и набранный текст в отчёт не попадают.', 'Write one line in the What happened? box. Mark draws red frames on the screenshot, Hide covers anything extra with a black rectangle, and Show Data lists exactly what will be sent; passwords and typed text never go into a report.')}</li>
            <li>${L('Нажмите «Отправить» (' + key('Ctrl+Enter') + '). Номер отчёта вида <code>BR-ГГММДД-XXXX</code> виден сразу. Без интернета отчёт сохраняется и уходит при следующем запуске, а кнопка «В файл...» сохраняет его для передачи вручную.', 'Click Send (' + key('Ctrl+Enter') + '). The report number, like <code>BR-YYMMDD-XXXX</code>, is shown at once. Without a connection the report is kept and sent at the next start, and Save to File... saves it for sending by hand.')}</li>
            <li>${L('Что стало с отчётом, показывает «Мои отчёты об ошибках» («Служебные» или <code>bugreport /list</code>); когда ошибка исправлена, в трее появляется значок. Если программа «выполнила недопустимую операцию», система сама предложит отправить отчёт.', 'My Problem Reports (System Tools or <code>bugreport /list</code>) shows what happened to a report; when the bug is fixed an icon appears in the tray. If a program performs an illegal operation the system offers to send a report itself.')}</li>
          </ol>
          ${shortcut('bugreport', L('Щелкните здесь, чтобы открыть «Сообщение об ошибке».', 'Click here to open Report a Problem.'))}

          <h3>${L('Игра или программа «не установлена»', 'A game or program is "not installed"')}</h3>
          <p>${L('Это нормально: система стартует почти без игр. Сообщение указывает, где взять программу: в Steam, на компакт-диске «Игромания» (в <code>D:\\demo</code>) или в SoftStore \'98. Установленная программа и её ярлыки появляются сами.', 'This is normal: the system starts with almost no games. The message says where to get the program: in Steam, on the Igromania CD (in <code>D:\\demo</code>), or in SoftStore \'98. An installed program and its shortcuts appear on their own.')}</p>
          ${shortcut('steam', L('Щелкните здесь, чтобы открыть Steam.', 'Click here to open Steam.'))}

          <h3>${L('Страницы не открываются', 'Pages will not open')}</h3>
          <p>${L('Проверьте значок модемного соединения в трее. Если соединение разорвано, откройте «Удаленный доступ к сети» и подключитесь. Netscape 6 для настоящего Интернета требует локального сервера проекта (<code>npm start</code>); в Win98.exe он уже встроен.', 'Check the dial-up icon in the tray. If the connection is down, open Dial-Up Networking and connect. Netscape 6 needs the project\'s local server (<code>npm start</code>) to reach the real Internet; it is already built into Win98.exe.')}</p>
          ${shortcut('dialup', L('Щелкните здесь, чтобы открыть «Удаленный доступ к сети».', 'Click here to open Dial-Up Networking.'))}

          <h3>${L('Перестали работать щелчки мыши', 'Mouse clicks stopped working')}</h3>
          <p>${L('Если в апплете «Мышь» на вкладке «Кнопки» был включен флажок «Отключить щелчки кнопок мыши», подождите 5 секунд: помощник Скрепыш автоматически заметит проблему, снимет блокировку и вернет управление кнопками мыши.', 'If "Disable mouse button clicks" was enabled on the Buttons tab of Mouse Properties, wait 5 seconds: Clippy automatically detects the lockout and restores normal mouse clicking.')}</p>

          <h3>${L('Погас экран (режим энергосбережения Energy Star)', 'The screen went dark (Energy Star standby)')}</h3>
          <p>${L('Когда срабатывает таймер отключения монитора, заданный в апплете «Электропитание», экран переходит в ждущий режим. Пошевелите мышью или нажмите любую клавишу на клавиатуре, чтобы мгновенно разбудить монитор. Так же любая клавиша останавливает заставку.', 'When the monitor standby timer configured in Power Management expires, the display enters sleep mode. Move the mouse or press any key to wake the monitor immediately. Any key also stops the screen saver.')}</p>

          <h3>${L('Окно ушло за пределы экрана', 'A window moved off the screen')}</h3>
          <p>${L('Щелкните кнопку этого окна на панели задач правой кнопкой мыши и выберите «Развернуть», либо щелкните свободное место панели задач правой кнопкой и выберите «Окна каскадом».', 'Right-click the window\'s taskbar button and choose Maximize, or right-click an empty area of the taskbar and choose Cascade Windows.')}</p>

          <h3>${L('Ошибки файловой системы и нехватка места на диске C:', 'Disk errors and low free space on drive C:')}</h3>
          <p>${L('Запустите <b>ScanDisk</b> для проверки кластеров, <b>Дефрагментацию диска</b> для ускорения чтения и <b>Очистку диска</b> (или очистите Корзину) для освобождения мегабайт.', 'Run <b>ScanDisk</b> to check cluster integrity, <b>Disk Defragmenter</b> to optimize file layout, and <b>Disk Cleanup</b> (or Empty Recycle Bin) to reclaim disk space.')}</p>
          ${shortcut('scandisk', L('Щелкните здесь, чтобы запустить ScanDisk.', 'Click here to run ScanDisk.'))}

          <h3>${L('Система не загружается или ведёт себя странно', 'The system will not start or behaves strangely')}</h3>
          <ul>
            <li>${L('Нажмите ' + key('F8') + ' при загрузке и выберите <b>безопасный режим</b> или <b>протоколирование</b> (журнал <code>C:\\BOOTLOG.TXT</code>); пункт 5 даёт чистую командную строку.', 'Press ' + key('F8') + ' at startup and choose <b>Safe mode</b> or <b>Logged</b> (the <code>C:\\BOOTLOG.TXT</code> log); choice 5 gives a bare command prompt.')}</li>
            <li>${L('Если в BIOS изменены параметры (разгон, порядок загрузки) и система нестабильна, откройте CMOS Setup Utility, выберите <b>Load Fail-Safe Defaults</b> и сохраните настройки клавишей ' + key('F10') + '.', 'If BIOS settings were changed (overclocking, boot order) and the system is unstable, open the CMOS Setup Utility, choose <b>Load Fail-Safe Defaults</b>, and press ' + key('F10') + ' to save.')}</li>
            <li>${L('Чтобы начать заново, откройте «Архивацию данных» → «Сброс» и вернитесь к первому запуску (перед этим можно сделать копию), либо введите <code>reset</code> в окне «Выполнить».', 'To start over, open Backup → Reset and return to the first start (you can make a copy first), or type <code>reset</code> in the Run box.')}</li>
          </ul>
          ${shortcut('msbackup', L('Щелкните здесь, чтобы открыть «Архивацию данных».', 'Click here to open Backup.'))}

          <h3>${L('Настройка CMOS BIOS и безопасный сброс оборудования', 'CMOS BIOS Setup and hardware reset')}</h3>
          <p>${L('Чтобы изменить частоту шины и множитель процессора, объем ОЗУ или порядок загрузочных дисков (A:, C:, CD-ROM), откройте «Пуск» → «Завершение работы...» и выберите <b>«Перезагрузить компьютер в режим настройки BIOS»</b>, либо нажмите ' + key('Del') + ' / ' + key('F2') + ' на экране POST, либо выберите «Настройка BIOS (CMOS Setup)» в «Служебных».', 'To change the CPU bus clock and multiplier, RAM amount, or boot device order (A:, C:, CD-ROM), open Start → Shut Down... and choose <b>Restart in BIOS Setup mode</b>, or press ' + key('Del') + ' / ' + key('F2') + ' on the POST screen, or choose Setup BIOS (CMOS Setup) in System Tools.')}</p>
          ${shortcut('bios-setup', L('Щелкните здесь, чтобы открыть CMOS Setup Utility (BIOS).', 'Click here to open the CMOS Setup Utility (BIOS).'))}
          ${related('system', 'cpanel', 'run', 'startup')}
        `
      }
    ];
    helpTopics.forEach(topic => { topic.title = titles[topic.id]; });

    const indexItems = (isRu ? [
      ['Автозагрузка (MSConfig)', 'system'], ['Антивирус Касперского (AVP)', 'system'], ['Архивация данных (Backup)', 'system'],
      ['Архиватор WinRAR 2.x', 'apps'], ['Безопасный режим', 'startup'], ['Блокнот (Notepad)', 'apps'],
      ['Буфер обмена (Clipbrd)', 'apps'], ['Быстродействие системы', 'cpanel'], ['Быстрый запуск', 'startmenu'],
      ['Виртуальная память (WIN386.SWP)', 'cpanel'], ['Восстановление файлов из Корзины', 'desktop'], ['Выделение значков', 'desktop'],
      ['Выполнить (команда Run)', 'run'], ['Вырезать, копировать и вставить', 'explorer'], ['Гардероб Скрепыша', 'clippy'],
      ['Громкость и микшер', 'multimedia'], ['Дата и время (timedate.cpl)', 'cpanel'], ['Двойной щелчок мыши', 'cpanel'],
      ['Дефрагментация диска', 'system'], ['Диагностика DirectX (DxDiag)', 'system'], ['Диаграмма емкости диска C:', 'explorer'],
      ['Диск 3,5 (A:) и загрузочная дискета', 'cpanel'], ['Диспетчер задач', 'system'], ['Диспетчер устройств', 'cpanel'],
      ['Домашняя страница обозревателя', 'cpanel'], ['Завершение работы и перезагрузка', 'startmenu'], ['Завершение сеанса', 'startmenu'],
      ['Заставка (хранитель экрана)', 'cpanel'], ['Звукозапись (Sound Recorder)', 'multimedia'], ['Звуковые схемы событий', 'cpanel'],
      ['Значки рабочего стола и их смена', 'cpanel'], ['Игры (Сапер, Косынка, Червы)', 'apps'], ['Игры и клиент Steam', 'install'],
      ['Интернет и модем (Dial-Up)', 'internet'], ['Калькулятор', 'apps'], ['Клавиатура (keyboard.cpl)', 'cpanel'],
      ['Клавиатурные сочетания', 'shortcuts'], ['Кнопка «Шеф идёт!» (Boss Key)', 'clippy'], ['Компакт-диск «Игромания» (D:)', 'install'],
      ['Компоненты Win 98 (установка)', 'cpanel'], ['Корзина (очистка и восстановление)', 'desktop'], ['Курсоры и указатели мыши', 'cpanel'],
      ['Лазерный проигрыватель (CD Player)', 'multimedia'], ['Лаунчер Win 98 и обновления', 'system'], ['Левша и правша (кнопки мыши)', 'cpanel'],
      ['Мастер писем Скрепыша', 'clippy'], ['Медиаплеер (Media Player)', 'multimedia'], ['Меню «Пуск» и его настройка', 'startmenu'],
      ['Меню загрузки (F8)', 'startup'], ['Мой компьютер и диски', 'explorer'], ['Мультимедиа (mmsys.cpl)', 'cpanel'],
      ['Мышь (main.cpl)', 'cpanel'], ['Найти файлы и папки (F3)', 'explorer'], ['Назначенные задания', 'system'],
      ['Настройка системы (MSConfig)', 'system'], ['Обои рабочего стола', 'cpanel'], ['Область уведомлений (трей)', 'startmenu'],
      ['Овечка eSheep 98 и котенок Neko', 'apps'], ['Окна (перемещение, размер, каскад)', 'desktop'], ['Оформление и цветовые схемы', 'cpanel'],
      ['Очистка диска (cleanmgr)', 'system'], ['Панель задач и меню «Пуск»', 'cpanel'], ['Панель каналов (Active Desktop)', 'desktop'],
      ['Панель управления', 'cpanel'], ['Пароли и пользователи', 'cpanel'], ['Переключение окон (Alt+Tab)', 'desktop'],
      ['Первый запуск и значки по умолчанию', 'startup'], ['Поиск файлов', 'explorer'], ['Показать рабочий стол', 'startmenu'],
      ['Помощник Скрепыш (Clippy)', 'clippy'], ['Принтеры и шрифты', 'cpanel'], ['Проверка реестра (ScanReg)', 'system'],
      ['Проверка системных файлов (SFC)', 'system'], ['Проводник (Explorer)', 'explorer'], ['Просмотр картинок (Imaging и ACDSee)', 'apps'],
      ['Разгон процессора и BIOS Setup', 'troubleshooting'], ['Редактор реестра (RegEdit)', 'system'], ['Редактор файлов конфигурации (SysEdit)', 'system'],
      ['Режим энергосбережения монитора', 'cpanel'], ['Сброс к первому запуску', 'troubleshooting'], ['Сведения о системе (MSInfo32)', 'system'],
      ['Свойства обозревателя (inetcpl.cpl)', 'cpanel'], ['Свойства папки (Folder Options)', 'explorer'], ['Свойства файла и диска', 'explorer'],
      ['Сеанс MS-DOS (command.com)', 'run'], ['Сеть и Сетевое окружение', 'explorer'], ['Эфирная связь и друзья', 'explorer'], ['Синий экран (BSOD)', 'troubleshooting'],
      ['Система (sysdm.cpl)', 'cpanel'], ['Системное меню окна', 'desktop'], ['Системный монитор (SysMon)', 'system'],
      ['Снять задачу', 'troubleshooting'], ['Сообщение об ошибке (F10)', 'troubleshooting'], ['Специальные возможности', 'cpanel'],
      ['Стандартные программы', 'apps'], ['Таблица символов (CharMap)', 'apps'], ['Темы рабочего стола (Plus! 98)', 'cpanel'],
      ['Тест монитора NOKIA', 'system'], ['Удаление и установка программ (appwiz.cpl)', 'cpanel'], ['Установка программ и игр', 'install'],
      ['Устранение неполадок', 'troubleshooting'], ['Форматирование дискеты', 'explorer'], ['Часовой пояс и часы', 'cpanel'],
      ['Что нового в системе', 'whatsnew'], ['Шлейф (след) указателя мыши', 'cpanel'], ['Шрифты', 'cpanel'],
      ['Экран (desk.cpl)', 'cpanel'], ['Электропитание (powercfg.cpl)', 'cpanel'], ['Эмулятор Emu-Land 98', 'multimedia'],
      ['Эффекты (крупные значки, сглаживание, ЭЛТ)', 'cpanel'], ['Язык и стандарты (intl.cpl)', 'cpanel'], ['Ярлыки программ', 'desktop'],
      ['ACDSee 32', 'apps'], ['Acrobat Reader 3.01 (PDF)', 'apps'], ['Active Desktop', 'desktop'],
      ['BIOS (CMOS Setup Utility)', 'startup'], ['CDex (граббер MP3)', 'multimedia'], ['DriveSpace', 'system'],
      ['Emu-Land 98', 'multimedia'], ['FastTracker 98 (трекер)', 'multimedia'], ['HyperTerminal (BBS)', 'internet'],
      ['ICQ 98a', 'internet'], ['Internet Explorer 5', 'internet'], ['Microslop Excel 97', 'apps'],
      ['mIRC 98 (IRC-чат)', 'internet'], ['Netscape 6', 'internet'], ['Outlook Express', 'internet'],
      ['Paint', 'apps'], ['QBasic 1.1', 'apps'], ['RetroShop 98 (SoftStore)', 'install'],
      ['ScanDisk', 'system'], ['SoftStore \'98', 'install'], ['Steam', 'install'],
      ['WinAmp 98 Pro', 'multimedia'], ['WinCommander 98', 'install'], ['Wintune 97 и CLIbench', 'system'],
      ['WordPad', 'apps']
    ] : [
      ['Accessibility Options', 'cpanel'], ['Accessories', 'apps'], ['ACDSee 32', 'apps'],
      ['Acrobat Reader 3.01 (PDF)', 'apps'], ['Active Desktop (channel bar)', 'desktop'], ['Add/Remove Programs (appwiz.cpl)', 'cpanel'],
      ['Alt+Tab (switching windows)', 'desktop'], ['Appearance and color schemes', 'cpanel'], ['Backup', 'system'],
      ['BIOS (CMOS Setup Utility)', 'startup'], ['Blue Screen (BSOD)', 'troubleshooting'], ['Boss Key (Clippy)', 'clippy'],
      ['Calculator', 'apps'], ['CD Player', 'multimedia'], ['CDex MP3 ripper', 'multimedia'],
      ['Character Map', 'apps'], ['ClipBook Viewer (clipbrd)', 'apps'], ['Clippy the Office Assistant', 'clippy'],
      ['Clock and time zone', 'cpanel'], ['Control Panel', 'cpanel'], ['Cut, copy, and paste', 'explorer'],
      ['Date/Time (timedate.cpl)', 'cpanel'], ['Desktop icons and custom icons', 'cpanel'], ['Desktop pets (Neko and eSheep 98)', 'apps'],
      ['Device Manager', 'cpanel'], ['Dial-Up Networking (modem)', 'internet'], ['DirectX Diagnostic Tool (DxDiag)', 'system'],
      ['Disk capacity pie chart', 'explorer'], ['Disk Cleanup (cleanmgr)', 'system'], ['Disk Defragmenter', 'system'],
      ['Display Properties (desk.cpl)', 'cpanel'], ['Double-click speed', 'cpanel'], ['DriveSpace', 'system'],
      ['Effects (large icons, font smoothing, CRT)', 'cpanel'], ['Emu-Land 98 emulator', 'multimedia'], ['End Task', 'troubleshooting'],
      ['Explorer', 'explorer'], ['FastTracker 98', 'multimedia'], ['File and drive properties', 'explorer'],
      ['Find Files or Folders (F3)', 'explorer'], ['First start and default icons', 'startup'], ['Floppy drive A: and Startup Disk', 'cpanel'],
      ['Floppy formatting', 'explorer'], ['Folder Options', 'explorer'], ['Fonts and Printers', 'cpanel'],
      ['Games (Minesweeper, Solitaire, Hearts)', 'apps'], ['Games and Steam client', 'install'], ['Home page (Internet Options)', 'cpanel'],
      ['HyperTerminal (BBS)', 'internet'], ['ICQ 98a', 'internet'], ['Igromania CD (D:)', 'install'],
      ['Imaging', 'apps'], ['Installing programs and games', 'install'], ['Internet Explorer 5', 'internet'],
      ['Internet Options (inetcpl.cpl)', 'cpanel'], ['Kaspersky Anti-Virus (AVP)', 'system'], ['Keyboard (keyboard.cpl)', 'cpanel'],
      ['Keyboard shortcuts', 'shortcuts'], ['Language and Regional Settings (intl.cpl)', 'cpanel'], ['Launcher and updates', 'system'],
      ['Left-handed and right-handed mouse', 'cpanel'], ['Letter Wizard (Clippy)', 'clippy'], ['Log Off', 'startmenu'],
      ['Media Player', 'multimedia'], ['Microslop Excel 97', 'apps'], ['mIRC 98 (IRC client)', 'internet'],
      ['Monitor standby (Energy Star)', 'cpanel'], ['Mouse Properties (main.cpl)', 'cpanel'], ['MS-DOS Prompt (command.com)', 'run'],
      ['MSConfig (System Configuration)', 'system'], ['Multimedia Properties (mmsys.cpl)', 'cpanel'], ['My Computer and drives', 'explorer'],
      ['Netscape 6', 'internet'], ['Network and Network Neighborhood', 'explorer'], ['Ether Link and friends', 'explorer'], ['NOKIA Monitor Test', 'system'],
      ['Notepad', 'apps'], ['Notification area (system tray)', 'startmenu'], ['Outlook Express', 'internet'],
      ['Overclocking and BIOS Setup', 'troubleshooting'], ['Paint', 'apps'], ['Passwords and Users', 'cpanel'],
      ['Performance and Graphics acceleration', 'cpanel'], ['Pointer schemes and trails', 'cpanel'], ['Power Management (powercfg.cpl)', 'cpanel'],
      ['QBasic 1.1', 'apps'], ['Quick Launch toolbar', 'startmenu'], ['Recycle Bin (restore and empty)', 'desktop'],
      ['Registry Checker (ScanReg)', 'system'], ['Registry Editor (RegEdit)', 'system'], ['Report a Problem (F10)', 'troubleshooting'],
      ['Reset to first start', 'troubleshooting'], ['RetroShop 98 (SoftStore)', 'install'], ['Run command', 'run'],
      ['Safe mode', 'startup'], ['ScanDisk', 'system'], ['Scheduled Tasks', 'system'],
      ['Screen saver', 'cpanel'], ['Selecting icons', 'desktop'], ['Shortcuts', 'desktop'],
      ['Show Desktop', 'startmenu'], ['Shut Down and Restart', 'startmenu'], ['Sound Recorder', 'multimedia'],
      ['Sound schemes', 'cpanel'], ['SoftStore \'98', 'install'], ['Start menu customization', 'startmenu'],
      ['Startup menu (F8)', 'startup'], ['Startup programs', 'system'], ['Steam', 'install'],
      ['SysEdit (System Configuration Editor)', 'system'], ['System File Checker (SFC)', 'system'], ['System Information (MSInfo32)', 'system'],
      ['System Monitor (SysMon)', 'system'], ['System Properties (sysdm.cpl)', 'cpanel'], ['System Tools', 'system'],
      ['Task Manager', 'system'], ['Taskbar & Start Menu Properties', 'cpanel'], ['Themes (Microslop Plus! 98)', 'cpanel'],
      ['Troubleshooting', 'troubleshooting'], ['Virtual memory (WIN386.SWP)', 'cpanel'], ['Volume Control mixer', 'multimedia'],
      ['Wallpaper', 'cpanel'], ['What’s new in the system', 'whatsnew'], ['Win components setup', 'cpanel'],
      ['WinAmp 98 Pro', 'multimedia'], ['WinCommander 98', 'install'], ['Window system menu', 'desktop'],
      ['WinRAR 2.x archiver', 'apps'], ['Wintune 97 and CLIbench', 'system'], ['WordPad', 'apps']
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
      'bios-setup': () => window.biosEngine && window.biosEngine.openSetup(),
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
    if (cmd === 'bliss' || cmd === 'bliss.exe' || cmd === 'безмятежность') {
      if (window.appBliss) window.appBliss.open();
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
      if (window.gameManager && !window.gameManager.isInstalled('moh98_demo')) {
        window.gameManager.showOnCd('moh98_demo');
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
    if (cmd === 'kirill98' || cmd === 'kirill98.exe' || cmd === 'kirillthegame' || cmd === 'kirillgame' || val === 'kirill the game') {
      if (window.gameManager && !window.gameManager.isInstalled('kirill98')) {
        window.winManager.openDialog({
          title: 'Kirill The Game',
          icon: 'error',
          message: isRu
            ? 'Игра «Kirill The Game» не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'kirill98\');">Steam</a>'
            : 'Game Kirill The Game is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'kirill98\');">Steam</a>'
        });
      } else if (window.appKirill98) window.appKirill98.open();
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
    if (!(window.gameManager && window.gameManager.isHidden && window.gameManager.isHidden('plov')) && (cmd === 'plov' || cmd === 'plov.exe' || cmd === 'плов' || val === 'где плов' || val === 'где плов?')) {
      if (window.gameManager && !window.gameManager.isInstalled('plov')) {
        window.winManager.openDialog({
          title: 'Где плов?',
          icon: 'error',
          message: isRu
            ? 'Игра «Где плов?» не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'plov\');">Steam</a>'
            : 'Game Where Is the Plov? is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'plov\');">Steam</a>'
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
      if (window.gameManager && !window.gameManager.isInstalled('sims3_demo')) {
        window.gameManager.showOnCd('sims3_demo');
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
