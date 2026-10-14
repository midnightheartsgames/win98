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
      screensaverMode: 'pipes',
      screensaverTimeout: 3
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

    if (window.appScreensaver) {
      if (typeof window.appScreensaver.applyConfig === 'function') {
        window.appScreensaver.applyConfig(s.screensaverMode, s.screensaverTimeout);
      } else {
        window.appScreensaver.currentMode = s.screensaverMode;
        window.appScreensaver.timeoutSeconds = Math.max(1, s.screensaverTimeout) * 60;
      }
    }
  }

  applySavedDisplaySettings() {
    const settings = this.getDisplaySettings();
    this.applyDisplaySettings(settings);
    return settings;
  }

  toggleCrt() {
    const current = this.getDisplaySettings();
    const nextVal = !current.crtEnabled;
    const updated = this.saveDisplaySettings({ crtEnabled: nextVal });
    this.applyDisplaySettings(updated);
    return nextVal;
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
      height: 250,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    dialog.element.querySelector('.btn-about-ok').addEventListener('click', () => {
      window.winManager.closeWindow('app_about_windows');
    });
  }

  openHelp(startTopic = 'welcome') {
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const L = (ru, en) => (isRu ? ru : en);
    const icon = (name) => Icons[name] || '';

    const books = [
      { id: 'intro', title: L('Знакомство с Win 98', 'Introducing Win 98'), topics: ['welcome', 'whatsnew', 'about'] },
      { id: 'basics', title: L('Основы работы', 'Exploring Your Computer'), topics: ['desktop', 'startmenu', 'explorer', 'shortcuts'] },
      { id: 'programs', title: L('Программы', 'Using Programs'), topics: ['apps', 'multimedia', 'internet'] },
      { id: 'settings', title: L('Настройка компьютера', 'Customizing Your Computer'), topics: ['cpanel'] },
      { id: 'maintenance', title: L('Обслуживание и неполадки', 'Maintenance and Troubleshooting'), topics: ['system', 'run', 'troubleshooting'] }
    ];

    const titles = {
      welcome: L('Добро пожаловать', 'Welcome'),
      whatsnew: L('Что нового в интерфейсе', 'What’s New in the Interface'),
      about: L('О системе Win 98 SE', 'About Win 98 SE'),
      desktop: L('Рабочий стол и окна', 'The Desktop and Windows'),
      startmenu: L('Меню «Пуск» и панель задач', 'The Start Menu and Taskbar'),
      explorer: L('Мой компьютер и Проводник', 'My Computer and Explorer'),
      shortcuts: L('Сочетания клавиш', 'Keyboard Shortcuts'),
      apps: L('Стандартные программы', 'Accessories'),
      multimedia: L('Мультимедиа и звук', 'Multimedia and Sound'),
      internet: L('Интернет и связь', 'Internet and Communications'),
      cpanel: L('Панель управления', 'Control Panel'),
      system: L('Служебные программы', 'System Tools'),
      run: L('Команда «Выполнить» и MS-DOS', 'The Run Command and MS-DOS'),
      troubleshooting: L('Устранение неполадок', 'Troubleshooting')
    };

    const shortcut = (target, text) => `<p class="win-help-shortcut-row"><button class="win-help-shortcut" data-run="${target}" title="${L('Открыть', 'Open')}">${icon('shortcut-overlay')}</button><span>${text}</span></p>`;
    const related = (...ids) => `<div class="win-help-related"><div class="win-help-related-title">${L('Связанные разделы', 'Related Topics')}</div>${ids.map(id => `<a href="javascript:void(0)" class="win-help-link" data-topic="${id}">${titles[id]}</a>`).join('')}</div>`;
    const note = (items) => `<h3>${L('Примечания', 'Notes')}</h3><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
    const glyph = (name) => `<span class="win-help-glyph">${icon(name)}</span>`;
    const key = (k) => `<span class="win-help-key">${k}</span>`;

    const helpTopics = [
      {
        id: 'welcome',
        keywords: L('добро пожаловать, обзор, начало, справка, книга', 'welcome, overview, start, help, book'),
        content: `
          <h2>${L('Добро пожаловать в Win 98 Second Edition', 'Welcome to Win 98 Second Edition')}</h2>
          <p>${L('Эта справка описывает работу с рабочим столом, окнами, меню «Пуск», Проводником, стандартными программами и настройками системы.', 'This Help describes how to use the desktop, windows, the Start menu, Explorer, the accessories, and system settings.')}</p>
          <h3>${L('Как пользоваться справкой', 'How to use Help')}</h3>
          <ol>
            <li>${L('На вкладке <b>Содержание</b> щелкните книгу, чтобы открыть список разделов.', 'On the <b>Contents</b> tab, click a book to see its topics.')}</li>
            <li>${L('Щелкните раздел со значком', 'Click a topic marked with')} ${glyph('help-page')}${L(', чтобы прочитать его.', ' to read it.')}</li>
            <li>${L('На вкладке <b>Указатель</b> введите первые буквы слова, на вкладке <b>Поиск</b> — любое слово из текста.', 'On the <b>Index</b> tab, type the first letters of a word. On the <b>Search</b> tab, type any word from the text.')}</li>
          </ol>
          ${shortcut('winver', L('Щелкните здесь, чтобы узнать версию системы.', 'Click here to see the system version.'))}
          ${note([
            L('Кнопки <b>Назад</b> и <b>Вперед</b> на панели инструментов возвращают к просмотренным разделам.', 'The <b>Back</b> and <b>Forward</b> buttons return to topics you have already viewed.'),
            L('Кнопка <b>Скрыть</b> убирает левую панель, чтобы освободить место для текста.', 'The <b>Hide</b> button removes the left pane to make room for the text.'),
            L('Нажмите ' + key('F1') + ' на рабочем столе: помощник Скрепыш спросит, что вы хотите сделать. Если помощник выключен, ' + key('F1') + ' открывает эту справку.', 'Press ' + key('F1') + ' on the desktop and the Office Assistant asks what you would like to do. When the assistant is turned off, ' + key('F1') + ' opens this Help.')
          ])}
          ${related('whatsnew', 'desktop', 'startmenu')}
        `
      },
      {
        id: 'whatsnew',
        keywords: L('новое, обновление, значки, быстрый запуск, подсказки, клавиатура, выделение, ярлык, часы', 'new, update, icons, quick launch, tooltips, keyboard, selection, shortcut, clock'),
        content: `
          <h2>${titles.whatsnew}</h2>
          <p>${L('Оформление оболочки приведено к виду оригинальной Win 98.', 'The shell now follows the look of the original Win 98.')}</p>
          <h3>${L('Значки и оформление', 'Icons and appearance')}</h3>
          <ul>
            <li>${L('Системные значки нарисованы попиксельно в палитре Win 98 и имеют отдельные варианты 32×32 и 16×16.', 'System icons are drawn pixel by pixel in the Win 98 palette, with separate 32×32 and 16×16 versions.')}</li>
            <li>${L('Ярлыки программ на рабочем столе отмечены стрелкой', 'Program shortcuts on the desktop carry the arrow')} ${glyph('shortcut-overlay')}.</li>
            <li>${L('Выделенный значок закрашивается синей сеткой, как в оригинале.', 'A selected icon is covered with a blue dither pattern, as in the original.')}</li>
            <li>${L('Кнопки заголовка, флажки, переключатели, списки и полосы прокрутки получили оригинальную форму.', 'Title bar buttons, check boxes, option buttons, lists, and scroll bars have their original shapes.')}</li>
            <li>${L('Всплывающие подсказки показываются на светло-желтом фоне.', 'Tooltips appear on a pale yellow background.')}</li>
          </ul>
          <h3>${L('Панель задач и меню «Пуск»', 'Taskbar and Start menu')}</h3>
          <ul>
            <li>${L('Панель <b>Быстрый запуск</b>: «Показать рабочий стол», Internet Explorer и Outlook Express.', 'The <b>Quick Launch</b> toolbar: Show Desktop, Internet Explorer, and Outlook Express.')}</li>
            <li>${L('Меню «Пуск» показывает крупные значки и управляется с клавиатуры: стрелки, ' + key('Enter') + ', ' + key('Esc') + ' и подчеркнутые буквы.', 'The Start menu shows large icons and works from the keyboard: arrows, ' + key('Enter') + ', ' + key('Esc') + ', and underlined letters.')}</li>
            <li>${L('Длинные подменю не уходят за край экрана и делятся на столбцы.', 'Long submenus stay on screen and split into columns.')}</li>
            <li>${L('Часы показывают время в формате страны, а при наведении — полную дату.', 'The clock uses your language’s time format and shows the full date when you point to it.')}</li>
          </ul>
          <h3>${L('Окна и Проводник', 'Windows and Explorer')}</h3>
          <ul>
            <li>${L('Двойной щелчок по заголовку разворачивает окно, щелчок по значку окна открывает системное меню.', 'Double-click a title bar to maximize the window. Click the window icon to open the system menu.')}</li>
            <li>${L('В окнах сообщений работают ' + key('Enter') + ' (кнопка по умолчанию) и ' + key('Esc') + ' (отмена).', 'Message boxes respond to ' + key('Enter') + ' (default button) and ' + key('Esc') + ' (cancel).')}</li>
            <li>${L('У Проводника появились крупные кнопки с подписями, адресная строка со значком папки и панель описания с диаграммой диска.', 'Explorer has large labeled buttons, an address bar with a folder icon, and a description pane with a disk chart.')}</li>
          </ul>
          ${related('desktop', 'startmenu', 'explorer')}
        `
      },
      {
        id: 'about',
        keywords: L('о системе, версия, winver, сведения, лицензия', 'about, version, winver, information, license'),
        content: `
          <h2>Microslop Win 98 Second Edition</h2>
          <p><b>${L('Версия 4.10.1998 A', 'Version 4.10.1998 A')}</b></p>
          <p>${L('Интерактивная реконструкция Win 98 SE: оконный менеджер, оболочка, звуки, стандартные и служебные программы.', 'An interactive reconstruction of Win 98 SE: the window manager, the shell, the sounds, the accessories, and the system tools.')}</p>
          <p>${L('Интерфейс переводится на русский и английский язык. Переключите язык индикатором в области уведомлений.', 'The interface is available in Russian and English. Switch the language with the indicator in the notification area.')}</p>
          ${shortcut('winver', L('Щелкните здесь, чтобы открыть окно «О программе».', 'Click here to open the About dialog.'))}
          ${related('welcome', 'whatsnew')}
        `
      },
      {
        id: 'desktop',
        keywords: L('рабочий стол, окна, значки, ярлык, свернуть, развернуть, закрыть, системное меню, размер, перемещение, корзина, crt, обои', 'desktop, windows, icons, shortcut, minimize, maximize, close, system menu, resize, move, recycle bin, crt, wallpaper'),
        content: `
          <h2>${titles.desktop}</h2>
          <p>${L('Каждая программа открывается в отдельном окне. В строке заголовка находятся значок окна, его название и кнопки управления.', 'Every program opens in its own window. The title bar holds the window icon, its name, and the control buttons.')}</p>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph"><span class="win-help-caption">${icon('cap-min')}</span></td><td>${L('<b>Свернуть</b> — скрывает окно. Кнопка программы остается на панели задач.', '<b>Minimize</b> hides the window. Its button stays on the taskbar.')}</td></tr>
            <tr><td class="win-help-table-glyph"><span class="win-help-caption">${icon('cap-max')}</span></td><td>${L('<b>Развернуть</b> — растягивает окно на весь экран.', '<b>Maximize</b> fills the screen with the window.')}</td></tr>
            <tr><td class="win-help-table-glyph"><span class="win-help-caption">${icon('cap-restore')}</span></td><td>${L('<b>Восстановить</b> — возвращает прежний размер развернутого окна.', '<b>Restore</b> returns a maximized window to its previous size.')}</td></tr>
            <tr><td class="win-help-table-glyph"><span class="win-help-caption">${icon('cap-close')}</span></td><td>${L('<b>Закрыть</b> — завершает программу.', '<b>Close</b> quits the program.')}</td></tr>
          </table>
          <h3>${L('Как переместить окно или изменить его размер', 'To move or resize a window')}</h3>
          <ol>
            <li>${L('Чтобы переместить окно, перетащите его за строку заголовка.', 'To move a window, drag its title bar.')}</li>
            <li>${L('Чтобы изменить размер, перетащите рамку или угол окна.', 'To resize it, drag a border or a corner.')}</li>
            <li>${L('Дважды щелкните заголовок, чтобы развернуть окно или восстановить его размер.', 'Double-click the title bar to maximize the window or restore its size.')}</li>
          </ol>
          <h3>${L('Системное меню окна', 'The window system menu')}</h3>
          <p>${L('Щелкните значок в левом углу заголовка или щелкните заголовок правой кнопкой мыши. Меню содержит команды «Восстановить», «Свернуть», «Развернуть» и «Закрыть». Двойной щелчок по значку закрывает окно.', 'Click the icon at the left of the title bar, or right-click the title bar. The menu holds Restore, Minimize, Maximize, and Close. Double-clicking the icon closes the window.')}</p>
          <h3>${L('Значки рабочего стола', 'Desktop icons')}</h3>
          <ul>
            <li>${L('Щелкните значок, чтобы выделить его, и дважды щелкните, чтобы открыть.', 'Click an icon to select it. Double-click it to open it.')}</li>
            <li>${L('Чтобы выделить несколько значков, обведите их рамкой или щелкайте, удерживая ' + key('Ctrl') + '.', 'To select several icons, drag a box around them or click them while holding ' + key('Ctrl') + '.')}</li>
            <li>${L('Стрелка', 'The arrow')} ${glyph('shortcut-overlay')} ${L('означает ярлык: он запускает программу, но не является ею.', 'marks a shortcut. It starts a program but is not the program itself.')}</li>
            <li>${L('Щелкните рабочий стол правой кнопкой, чтобы упорядочить значки, создать папку или открыть свойства экрана.', 'Right-click the desktop to arrange icons, create a folder, or open the display properties.')}</li>
            <li>${L('Удаленные файлы попадают в', 'Deleted files go to the')} ${glyph('recycle-bin')} <b>${L('Корзину', 'Recycle Bin')}</b>. ${L('Чтобы очистить ее, щелкните значок корзины правой кнопкой.', 'To empty it, right-click the Recycle Bin icon.')}</li>
          </ul>
          ${note([
            L('В окнах сообщений клавиша ' + key('Enter') + ' нажимает кнопку по умолчанию (с толстой черной рамкой), а ' + key('Esc') + ' отменяет действие.', 'In message boxes ' + key('Enter') + ' presses the default button (the one with a thick black border), and ' + key('Esc') + ' cancels.'),
            L('Значок монитора в области уведомлений включает эффект ЭЛТ-монитора.', 'The monitor icon in the notification area turns the CRT monitor effect on or off.')
          ])}
          ${related('startmenu', 'shortcuts', 'cpanel')}
        `
      },
      {
        id: 'startmenu',
        keywords: L('пуск, меню, панель задач, быстрый запуск, показать рабочий стол, трей, часы, дата, громкость, язык, компакт-диск, завершение работы', 'start, menu, taskbar, quick launch, show desktop, tray, clock, date, volume, language, cd-rom, shut down'),
        content: `
          <h2>${titles.startmenu}</h2>
          <p>${L('Панель задач находится внизу экрана. Слева расположена кнопка', 'The taskbar runs along the bottom of the screen. At its left is the')} ${glyph('start-logo')} <b>${L('Пуск', 'Start')}</b>${L(', рядом — панель «Быстрый запуск», в середине — кнопки открытых окон, справа — область уведомлений и часы.', ' button, then the Quick Launch toolbar, the buttons of open windows, and at the right the notification area and the clock.')}</p>
          <h3>${L('Меню «Пуск»', 'The Start menu')}</h3>
          <ul>
            <li>${glyph('programs')} <b>${L('Программы', 'Programs')}</b> — ${L('стандартные программы, игры и установленные приложения.', 'accessories, games, and installed programs.')}</li>
            <li>${glyph('my-documents')} <b>${L('Документы', 'Documents')}</b> — ${L('папки «Мои документы», «Мои рисунки», «Моя музыка», «Мои видео» и «Загрузки».', 'the My Documents, My Pictures, My Music, My Videos, and Downloads folders.')}</li>
            <li>${glyph('settings')} <b>${L('Настройка', 'Settings')}</b> — ${L('Панель управления, язык и свойства экрана.', 'Control Panel, language, and display properties.')}</li>
            <li>${glyph('find')} <b>${L('Найти', 'Find')}</b>, ${glyph('help')} <b>${L('Справка', 'Help')}</b>, ${glyph('run')} <b>${L('Выполнить', 'Run')}</b> ${L('и', 'and')} ${glyph('shut-down')} <b>${L('Завершение работы', 'Shut Down')}</b>.</li>
          </ul>
          <h3>${L('Как открыть программу с клавиатуры', 'To open a program from the keyboard')}</h3>
          <ol>
            <li>${L('Нажмите ' + key('Ctrl+Esc') + ' или щелкните кнопку «Пуск».', 'Press ' + key('Ctrl+Esc') + ' or click Start.')}</li>
            <li>${L('Выберите пункт клавишами ' + key('↑') + ' и ' + key('↓') + ' или нажмите его подчеркнутую букву.', 'Choose an item with ' + key('↑') + ' and ' + key('↓') + ', or press its underlined letter.')}</li>
            <li>${L('Клавиша ' + key('→') + ' открывает подменю, ' + key('←') + ' возвращает назад, ' + key('Enter') + ' запускает программу, ' + key('Esc') + ' закрывает меню.', key('→') + ' opens a submenu, ' + key('←') + ' goes back, ' + key('Enter') + ' starts the program, and ' + key('Esc') + ' closes the menu.')}</li>
          </ol>
          <h3>${L('Быстрый запуск', 'Quick Launch')}</h3>
          <p>${glyph('show-desktop')} <b>${L('Показать рабочий стол', 'Show Desktop')}</b> ${L('сворачивает все окна, повторный щелчок возвращает их. Кнопки', 'minimizes every window; click it again to bring them back. The')} ${glyph('internet-explorer')} ${L('и', 'and')} ${glyph('outlook')} ${L('запускают Internet Explorer и Outlook Express.', 'buttons start Internet Explorer and Outlook Express.')}</p>
          <h3>${L('Кнопки окон', 'Window buttons')}</h3>
          <p>${L('Щелчок по кнопке переключает окно, щелчок по кнопке активного окна сворачивает его. Щелкните кнопку правой кнопкой мыши, чтобы открыть системное меню окна. Щелкните свободное место панели правой кнопкой, чтобы расположить окна каскадом или свернуть все окна.', 'Click a button to switch to its window; click the active window’s button to minimize it. Right-click a button for the window’s system menu. Right-click an empty part of the taskbar to cascade, tile, or minimize all windows.')}</p>
          <h3>${L('Область уведомлений', 'The notification area')}</h3>
          <ul>
            <li><span class="win-help-lang">Ru</span> — ${L('язык системы: щелчок переключает русский и английский.', 'system language: click to switch between Russian and English.')}</li>
            <li>${glyph('speaker')} — ${L('громкость: щелчок открывает регулятор, двойной щелчок — микшер.', 'volume: click for the slider, double-click for the mixer.')}</li>
            <li>${glyph('monitor')} — ${L('эффект ЭЛТ-монитора.', 'the CRT monitor effect.')}</li>
            <li>${glyph('drive-cd')} — ${L('дисковод компакт-дисков: вставить или извлечь диск «Игромании».', 'the CD-ROM drive: insert or eject the Igromania disc.')}</li>
            <li>${L('Часы: наведите указатель, чтобы увидеть дату; дважды щелкните, чтобы настроить дату и время.', 'The clock: point to it to see the date; double-click it to set the date and time.')}</li>
          </ul>
          ${shortcut('timedate.cpl', L('Щелкните здесь, чтобы настроить дату и время.', 'Click here to set the date and time.'))}
          ${related('desktop', 'shortcuts', 'run')}
        `
      },
      {
        id: 'explorer',
        keywords: L('мой компьютер, проводник, папка, файл, диск, адрес, вырезать, копировать, вставить, удалить, свойства, емкость, корзина', 'my computer, explorer, folder, file, drive, address, cut, copy, paste, delete, properties, capacity, recycle bin'),
        content: `
          <h2>${titles.explorer}</h2>
          <p>${L('Дважды щелкните значок', 'Double-click the')} ${glyph('my-computer')} <b>${L('Мой компьютер', 'My Computer')}</b>${L(', чтобы увидеть диски', ' icon to see the')} ${glyph('drive-c')} C:, ${glyph('drive-cd')} D: ${L('и', 'drives and the')} ${glyph('control-panel')} ${L('Панель управления.', 'Control Panel.')}</p>
          <h3>${L('Панель инструментов', 'The toolbar')}</h3>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('tb-back')}${glyph('tb-forward')}</td><td>${L('<b>Назад</b> и <b>Вперед</b> — переход между просмотренными папками.', '<b>Back</b> and <b>Forward</b> move between folders you have viewed.')}</td></tr>
            <tr><td class="win-help-table-glyph">${glyph('tb-up')}</td><td>${L('<b>Вверх</b> — открывает папку уровнем выше.', '<b>Up</b> opens the folder one level higher.')}</td></tr>
            <tr><td class="win-help-table-glyph">${glyph('tb-cut')}${glyph('tb-copy')}${glyph('tb-paste')}</td><td>${L('<b>Вырезать</b>, <b>Копировать</b> и <b>Вставить</b> — перенос выделенного файла в другую папку.', '<b>Cut</b>, <b>Copy</b>, and <b>Paste</b> move the selected file to another folder.')}</td></tr>
            <tr><td class="win-help-table-glyph">${glyph('tb-delete')}${glyph('tb-properties')}</td><td>${L('<b>Удалить</b> отправляет файл в Корзину, <b>Свойства</b> показывают сведения о папке.', '<b>Delete</b> sends the file to the Recycle Bin, and <b>Properties</b> shows folder details.')}</td></tr>
          </table>
          <p>${L('Значки кнопок становятся цветными при наведении указателя. Недоступные кнопки отображаются серыми.', 'Button icons turn to color when you point to them. Unavailable buttons are gray.')}</p>
          <h3>${L('Как скопировать файл', 'To copy a file')}</h3>
          <ol>
            <li>${L('Щелкните файл, чтобы выделить его.', 'Click the file to select it.')}</li>
            <li>${L('Нажмите кнопку <b>Копировать</b>.', 'Click <b>Copy</b>.')}</li>
            <li>${L('Откройте папку назначения и нажмите <b>Вставить</b>.', 'Open the destination folder and click <b>Paste</b>.')}</li>
          </ol>
          <h3>${L('Панель описания', 'The description pane')}</h3>
          <p>${L('Слева показаны название папки и сведения о выделенном объекте. Для диска C: выводится емкость и диаграмма: синим — занятое место, лиловым — свободное. В узком окне панель скрывается.', 'The left pane shows the folder name and details about the selected item. For drive C: it shows the capacity and a chart: blue for used space, magenta for free space. The pane hides when the window is narrow.')}</p>
          ${shortcut('explorer', L('Щелкните здесь, чтобы открыть «Мой компьютер».', 'Click here to open My Computer.'))}
          ${related('desktop', 'system')}
        `
      },
      {
        id: 'shortcuts',
        keywords: L('клавиши, сочетания, клавиатура, горячие клавиши, f1, f5, ctrl, esc, enter, стрелки', 'keys, shortcuts, keyboard, hotkeys, f1, f5, ctrl, esc, enter, arrows'),
        content: `
          <h2>${titles.shortcuts}</h2>
          <table class="win-help-table">
            <tr><th>${L('Клавиши', 'Keys')}</th><th>${L('Действие', 'Action')}</th></tr>
            <tr><td>${key('Ctrl+Esc')}</td><td>${L('Открыть или закрыть меню «Пуск».', 'Open or close the Start menu.')}</td></tr>
            <tr><td>${key('↑')} ${key('↓')} ${key('←')} ${key('→')}</td><td>${L('Перемещение по меню «Пуск» и его подменю.', 'Move through the Start menu and its submenus.')}</td></tr>
            <tr><td>${L('Подчеркнутая буква', 'Underlined letter')}</td><td>${L('Выбрать пункт открытого меню «Пуск».', 'Choose an item in the open Start menu.')}</td></tr>
            <tr><td>${key('Enter')}</td><td>${L('Нажать кнопку по умолчанию в окне сообщения или запустить выбранный пункт меню.', 'Press the default button in a message box, or start the selected menu item.')}</td></tr>
            <tr><td>${key('Esc')}</td><td>${L('Закрыть меню или отменить окно сообщения.', 'Close a menu or cancel a message box.')}</td></tr>
            <tr><td>${key('F1')}</td><td>${L('Спросить помощника Скрепыша, когда активен рабочий стол. Если помощник выключен — открыть справку.', 'Ask the Office Assistant while the desktop is active. When the assistant is off, open Help.')}</td></tr>
            <tr><td>${key('F5')}</td><td>${L('Обновить значки рабочего стола.', 'Refresh the desktop icons.')}</td></tr>
            <tr><td>${key('Ctrl+Alt+Del')}</td><td>${L('Открыть Диспетчер задач.', 'Open Task Manager.')}</td></tr>
          </table>
          ${note([
            L('Некоторые сочетания, например ' + key('Ctrl+Esc') + ' и ' + key('Ctrl+Alt+Del') + ', может перехватить основная операционная система компьютера. В этом случае используйте мышь: кнопку «Пуск» и пункт «Диспетчер задач» в меню «Программы» → «Стандартные» → «Служебные».', 'The host computer’s own operating system may intercept some keys, such as ' + key('Ctrl+Esc') + ' and ' + key('Ctrl+Alt+Del') + '. In that case use the mouse: the Start button, and Task Manager under Programs → Accessories → System Tools.')
          ])}
          ${related('startmenu', 'desktop')}
        `
      },
      {
        id: 'apps',
        keywords: L('стандартные, блокнот, notepad, wordpad, paint, калькулятор, таблица символов, просмотр картинок, звукозапись', 'accessories, notepad, wordpad, paint, calculator, character map, imaging, sound recorder'),
        content: `
          <h2>${titles.apps}</h2>
          <p>${L('Стандартные программы находятся в меню «Пуск» → «Программы» → «Стандартные». Удаленный доступ к сети — в подменю «Связь», звукозапись и регулятор громкости — в «Развлечения», дефрагментация и проверка диска — в «Служебные».', 'The accessories are in Start → Programs → Accessories. Dial-Up Networking is under Communications, Sound Recorder and Volume Control are under Entertainment, and Disk Defragmenter and ScanDisk are under System Tools.')}</p>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('notepad')}</td><td><b>${L('Блокнот', 'Notepad')}</b> — ${L('простой текстовый редактор для файлов TXT, INI и BAT.', 'a plain text editor for TXT, INI, and BAT files.')}</td><td><button class="win-help-shortcut" data-run="notepad">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('wordpad')}</td><td><b>WordPad</b> — ${L('редактор документов с форматированием и поддержкой RTF.', 'a document editor with formatting and RTF support.')}</td><td><button class="win-help-shortcut" data-run="wordpad">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('paint')}</td><td><b>Paint</b> — ${L('графический редактор: карандаш, кисть, заливка, распылитель и палитра.', 'a graphics editor with pencil, brush, fill, airbrush, and palette.')}</td><td><button class="win-help-shortcut" data-run="paint">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('calculator')}</td><td><b>${L('Калькулятор', 'Calculator')}</b> — ${L('обычный и инженерный режимы.', 'standard and scientific modes.')}</td><td><button class="win-help-shortcut" data-run="calc">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('charmap')}</td><td><b>${L('Таблица символов', 'Character Map')}</b> — ${L('копирование специальных символов.', 'copies special characters.')}</td><td><button class="win-help-shortcut" data-run="charmap">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('imaging')}</td><td><b>${L('Просмотр картинок', 'Imaging')}</b> — ${L('просмотр рисунков BMP, JPG и PNG.', 'views BMP, JPG, and PNG pictures.')}</td><td><button class="win-help-shortcut" data-run="imaging">${icon('shortcut-overlay')}</button></td></tr>
          </table>
          ${related('multimedia', 'system')}
        `
      },
      {
        id: 'multimedia',
        keywords: L('мультимедиа, звук, музыка, winamp, mp3, звукозапись, громкость, микшер, sndvol32, sndrec32', 'multimedia, sound, music, winamp, mp3, sound recorder, volume, mixer, sndvol32, sndrec32'),
        content: `
          <h2>${titles.multimedia}</h2>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('winamp')}</td><td><b>WinAmp 98</b> — ${L('проигрыватель MP3, WAV и MIDI с эквалайзером, списком воспроизведения и сменными обложками.', 'an MP3, WAV, and MIDI player with an equalizer, a playlist, and skins.')}</td><td><button class="win-help-shortcut" data-run="winamp">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('sound-recorder')}</td><td><b>${L('Звукозапись', 'Sound Recorder')}</b> — ${L('запись с микрофона, эффекты (эхо, обратный порядок, скорость) и сохранение в WAV.', 'records from the microphone, applies effects (echo, reverse, speed), and saves WAV files.')}</td><td><button class="win-help-shortcut" data-run="sndrec32">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('volume-mixer')}</td><td><b>${L('Регулятор громкости', 'Volume Control')}</b> — ${L('общая громкость, MIDI и Wave.', 'master, MIDI, and Wave volume.')}</td><td><button class="win-help-shortcut" data-run="sndvol32">${icon('shortcut-overlay')}</button></td></tr>
          </table>
          <h3>${L('Как быстро изменить громкость', 'To change the volume quickly')}</h3>
          <ol>
            <li>${L('Щелкните значок', 'Click the')} ${glyph('speaker')} ${L('в области уведомлений.', 'icon in the notification area.')}</li>
            <li>${L('Перетащите ползунок вверх или вниз.', 'Drag the slider up or down.')}</li>
            <li>${L('Установите флажок «Выкл», чтобы отключить звук.', 'Select the Mute check box to turn the sound off.')}</li>
          </ol>
          ${related('cpanel', 'apps')}
        `
      },
      {
        id: 'internet',
        keywords: L('интернет, internet explorer, netscape, модем, удаленный доступ, icq, почта, outlook express', 'internet, internet explorer, netscape, modem, dial-up, icq, mail, outlook express'),
        content: `
          <h2>${titles.internet}</h2>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('internet-explorer')}</td><td><b>Internet Explorer 5</b> — ${L('обозреватель с адресной строкой, журналом и избранным.', 'a browser with an address bar, history, and favorites.')}</td><td><button class="win-help-shortcut" data-run="ie">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('netscape')}</td><td><b>Netscape 6</b> — ${L('второй обозреватель.', 'a second browser.')}</td><td><button class="win-help-shortcut" data-run="netscape">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('dialup')}</td><td><b>${L('Удаленный доступ к сети', 'Dial-Up Networking')}</b> — ${L('подключение через модем.', 'connects through the modem.')}</td><td><button class="win-help-shortcut" data-run="dialup">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('outlook')}</td><td><b>Outlook Express</b> — ${L('электронная почта.', 'e-mail.')}</td><td><button class="win-help-shortcut" data-run="outlook">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('icq-online')}</td><td><b>ICQ 98a</b> — ${L('обмен сообщениями.', 'instant messaging.')}</td><td><button class="win-help-shortcut" data-run="icq">${icon('shortcut-overlay')}</button></td></tr>
          </table>
          ${note([
            L('Internet Explorer и Outlook Express также запускаются с панели «Быстрый запуск».', 'Internet Explorer and Outlook Express also start from the Quick Launch toolbar.')
          ])}
          ${related('startmenu', 'welcome')}
        `
      },
      {
        id: 'cpanel',
        keywords: L('панель управления, экран, обои, заставка, тема, дата, время, язык, звуки, мышь, установка программ, desk.cpl', 'control panel, display, wallpaper, screen saver, theme, date, time, language, sounds, mouse, add remove programs, desk.cpl'),
        content: `
          <h2>${titles.cpanel}</h2>
          <p>${L('Откройте «Пуск» → «Настройка» → «Панель управления». Дважды щелкните значок, чтобы изменить параметр.', 'Open Start → Settings → Control Panel. Double-click an icon to change a setting.')}</p>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('monitor')}</td><td><b>${L('Экран', 'Display')}</b> — ${L('обои, заставка, цветовая схема и темы.', 'wallpaper, screen saver, color scheme, and themes.')}</td><td><button class="win-help-shortcut" data-run="desk.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('timedate')}</td><td><b>${L('Дата и время', 'Date/Time')}</b> — ${L('часы, календарь и часовой пояс.', 'clock, calendar, and time zone.')}</td><td><button class="win-help-shortcut" data-run="timedate.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('multimedia')}</td><td><b>${L('Мультимедиа', 'Multimedia')}</b> — ${L('звуковые схемы и события.', 'sound schemes and events.')}</td><td><button class="win-help-shortcut" data-run="mmsys.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('regional')}</td><td><b>${L('Язык и стандарты', 'Regional Settings')}</b> — ${L('язык интерфейса и форматы.', 'interface language and formats.')}</td><td><button class="win-help-shortcut" data-run="intl.cpl">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('appwiz')}</td><td><b>${L('Установка и удаление программ', 'Add/Remove Programs')}</b> — ${L('список установленных программ.', 'the list of installed programs.')}</td><td><button class="win-help-shortcut" data-run="appwiz.cpl">${icon('shortcut-overlay')}</button></td></tr>
          </table>
          <h3>${L('Как сменить обои', 'To change the wallpaper')}</h3>
          <ol>
            <li>${L('Щелкните рабочий стол правой кнопкой и выберите «Свойства».', 'Right-click the desktop and click Properties.')}</li>
            <li>${L('На вкладке «Фон» выберите рисунок и способ размещения.', 'On the Background tab, choose a picture and how to display it.')}</li>
            <li>${L('Нажмите «OK».', 'Click OK.')}</li>
          </ol>
          ${note([L('Если выбран фоновый рисунок, подписи значков выводятся на фоне цвета рабочего стола, как в Win 98.', 'With a wallpaper, icon labels are drawn on the desktop color, as in Win 98.')])}
          ${related('desktop', 'multimedia')}
        `
      },
      {
        id: 'system',
        keywords: L('служебные, диспетчер задач, msconfig, dxdiag, реестр, regedit, scandisk, дефрагментация, очистка диска, антивирус, avp', 'system tools, task manager, msconfig, dxdiag, registry, regedit, scandisk, defrag, disk cleanup, antivirus, avp'),
        content: `
          <h2>${titles.system}</h2>
          <table class="win-help-table">
            <tr><td class="win-help-table-glyph">${glyph('taskmgr')}</td><td><b>${L('Диспетчер задач', 'Task Manager')}</b> — ${L('открытые программы и загрузка процессора.', 'running programs and processor load.')}</td><td><button class="win-help-shortcut" data-run="taskmgr">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('msconfig')}</td><td><b>${L('Настройка системы', 'System Configuration')}</b> — ${L('автозагрузка, WIN.INI и SYSTEM.INI.', 'startup, WIN.INI, and SYSTEM.INI.')}</td><td><button class="win-help-shortcut" data-run="msconfig">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('dxdiag')}</td><td><b>${L('Диагностика DirectX', 'DirectX Diagnostic Tool')}</b> — ${L('видео- и звуковые устройства.', 'display and sound devices.')}</td><td><button class="win-help-shortcut" data-run="dxdiag">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('regedit')}</td><td><b>${L('Редактор реестра', 'Registry Editor')}</b> — ${L('разделы HKEY_LOCAL_MACHINE и HKEY_CURRENT_USER.', 'the HKEY_LOCAL_MACHINE and HKEY_CURRENT_USER keys.')}</td><td><button class="win-help-shortcut" data-run="regedit">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('scandisk')}</td><td><b>ScanDisk</b> — ${L('проверка диска на ошибки.', 'checks the disk for errors.')}</td><td><button class="win-help-shortcut" data-run="scandisk">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('defrag')}</td><td><b>${L('Дефрагментация диска', 'Disk Defragmenter')}</b> — ${L('ускоряет чтение файлов.', 'speeds up reading files.')}</td><td><button class="win-help-shortcut" data-run="defrag">${icon('shortcut-overlay')}</button></td></tr>
            <tr><td class="win-help-table-glyph">${glyph('cleanmgr')}</td><td><b>${L('Очистка диска', 'Disk Cleanup')}</b> — ${L('удаляет временные файлы.', 'removes temporary files.')}</td><td><button class="win-help-shortcut" data-run="cleanmgr">${icon('shortcut-overlay')}</button></td></tr>
          </table>
          ${related('troubleshooting', 'run')}
        `
      },
      {
        id: 'run',
        keywords: L('выполнить, команда, run, cmd, command, ms-dos, консоль, winver', 'run, command, cmd, ms-dos, console, winver'),
        content: `
          <h2>${titles.run}</h2>
          <p>${L('Команда «Выполнить» запускает программу по ее имени.', 'The Run command starts a program by its name.')}</p>
          <h3>${L('Как запустить программу по имени', 'To start a program by name')}</h3>
          <ol>
            <li>${L('Нажмите «Пуск» и выберите «Выполнить».', 'Click Start, and then click Run.')}</li>
            <li>${L('Введите имя программы, например <code>notepad</code>.', 'Type the program name, for example <code>notepad</code>.')}</li>
            <li>${L('Нажмите «OK».', 'Click OK.')}</li>
          </ol>
          <table class="win-help-table">
            <tr><th>${L('Команда', 'Command')}</th><th>${L('Программа', 'Program')}</th></tr>
            <tr><td><code>notepad</code></td><td>${L('Блокнот', 'Notepad')}</td></tr>
            <tr><td><code>calc</code></td><td>${L('Калькулятор', 'Calculator')}</td></tr>
            <tr><td><code>pbrush</code></td><td>Paint</td></tr>
            <tr><td><code>control</code></td><td>${L('Панель управления', 'Control Panel')}</td></tr>
            <tr><td><code>desk.cpl</code></td><td>${L('Свойства экрана', 'Display Properties')}</td></tr>
            <tr><td><code>msconfig</code></td><td>${L('Настройка системы', 'System Configuration')}</td></tr>
            <tr><td><code>regedit</code></td><td>${L('Редактор реестра', 'Registry Editor')}</td></tr>
            <tr><td><code>command</code></td><td>${L('Сеанс MS-DOS', 'MS-DOS Prompt')}</td></tr>
            <tr><td><code>winver</code></td><td>${L('Версия системы', 'System version')}</td></tr>
          </table>
          ${shortcut('open_run', L('Щелкните здесь, чтобы открыть окно «Выполнить».', 'Click here to open the Run dialog.'))}
          ${related('system', 'shortcuts')}
        `
      },
      {
        id: 'troubleshooting',
        keywords: L('неполадки, ошибка, зависание, снять задачу, синий экран, диск, восстановление', 'troubleshooting, error, hang, end task, blue screen, disk, recovery'),
        content: `
          <h2>${titles.troubleshooting}</h2>
          <h3>${L('Программа не отвечает', 'A program stops responding')}</h3>
          <ol>
            <li>${L('Откройте Диспетчер задач: «Пуск» → «Программы» → «Стандартные» → «Служебные» → «Диспетчер задач».', 'Open Task Manager: Start → Programs → Accessories → System Tools → Task Manager.')}</li>
            <li>${L('Выберите программу в списке.', 'Select the program in the list.')}</li>
            <li>${L('Нажмите «Снять задачу».', 'Click End Task.')}</li>
          </ol>
          ${shortcut('taskmgr', L('Щелкните здесь, чтобы открыть Диспетчер задач.', 'Click here to open Task Manager.'))}
          <h3>${L('Ошибки файлов и диска', 'File and disk errors')}</h3>
          <p>${L('Запустите ScanDisk, чтобы проверить диск, и программу дефрагментации, чтобы упорядочить файлы.', 'Run ScanDisk to check the disk, and Disk Defragmenter to reorganize the files.')}</p>
          ${shortcut('scandisk', L('Щелкните здесь, чтобы запустить ScanDisk.', 'Click here to run ScanDisk.'))}
          <h3>${L('Окно ушло за край экрана', 'A window is off the screen')}</h3>
          <p>${L('Щелкните кнопку окна на панели задач правой кнопкой мыши и выберите «Развернуть», или щелкните панель задач правой кнопкой и выберите «Окна каскадом».', 'Right-click the window’s taskbar button and click Maximize, or right-click the taskbar and click Cascade Windows.')}</p>
          ${related('system', 'shortcuts')}
        `
      }
    ];
    helpTopics.forEach(topic => { topic.title = titles[topic.id]; });

    const indexItems = (isRu ? [
      ['Блокнот', 'apps'], ['Быстрый запуск', 'startmenu'], ['Вырезать и вставить', 'explorer'], ['Выполнить', 'run'],
      ['Выделение значков', 'desktop'], ['Громкость', 'multimedia'], ['Дата и время', 'cpanel'], ['Дефрагментация диска', 'system'],
      ['Диаграмма диска', 'explorer'], ['Диспетчер задач', 'system'], ['Емкость диска', 'explorer'], ['Завершение работы', 'startmenu'],
      ['Заставка', 'cpanel'], ['Значки рабочего стола', 'desktop'], ['Интернет', 'internet'], ['Калькулятор', 'apps'],
      ['Клавиатура', 'shortcuts'], ['Корзина', 'desktop'], ['Мой компьютер', 'explorer'], ['Меню «Пуск»', 'startmenu'],
      ['Мультимедиа', 'multimedia'], ['Обои', 'cpanel'], ['Окна сообщений', 'desktop'], ['Панель задач', 'startmenu'],
      ['Панель управления', 'cpanel'], ['Подсказки', 'whatsnew'], ['Показать рабочий стол', 'startmenu'], ['Проводник', 'explorer'],
      ['Реестр', 'system'], ['Сеанс MS-DOS', 'run'], ['Системное меню', 'desktop'], ['Снять задачу', 'troubleshooting'],
      ['Стандартные программы', 'apps'], ['Таблица символов', 'apps'], ['Часы', 'startmenu'], ['Что нового', 'whatsnew'],
      ['Ярлыки', 'desktop'], ['Язык системы', 'startmenu'], ['ICQ', 'internet'], ['Internet Explorer', 'internet'],
      ['Outlook Express', 'internet'], ['Paint', 'apps'], ['ScanDisk', 'system'], ['WinAmp', 'multimedia'], ['WordPad', 'apps']
    ] : [
      ['Accessories', 'apps'], ['Calculator', 'apps'], ['Character Map', 'apps'], ['Clock', 'startmenu'],
      ['Control Panel', 'cpanel'], ['Cut and paste', 'explorer'], ['Date and time', 'cpanel'], ['Desktop icons', 'desktop'],
      ['Disk capacity', 'explorer'], ['Disk chart', 'explorer'], ['Disk Defragmenter', 'system'], ['End Task', 'troubleshooting'],
      ['Explorer', 'explorer'], ['ICQ', 'internet'], ['Internet', 'internet'], ['Internet Explorer', 'internet'],
      ['Keyboard', 'shortcuts'], ['Language', 'startmenu'], ['Message boxes', 'desktop'], ['MS-DOS Prompt', 'run'],
      ['Multimedia', 'multimedia'], ['My Computer', 'explorer'], ['Notepad', 'apps'], ['Outlook Express', 'internet'],
      ['Paint', 'apps'], ['Quick Launch', 'startmenu'], ['Recycle Bin', 'desktop'], ['Registry', 'system'],
      ['Run', 'run'], ['ScanDisk', 'system'], ['Screen saver', 'cpanel'], ['Selecting icons', 'desktop'],
      ['Shortcuts', 'desktop'], ['Show Desktop', 'startmenu'], ['Shut Down', 'startmenu'], ['Start menu', 'startmenu'],
      ['System menu', 'desktop'], ['Task Manager', 'system'], ['Taskbar', 'startmenu'], ['Tooltips', 'whatsnew'],
      ['Volume', 'multimedia'], ['Wallpaper', 'cpanel'], ['What’s new', 'whatsnew'], ['WinAmp', 'multimedia'], ['WordPad', 'apps']
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
      imaging: () => window.appImageViewer && window.appImageViewer.open()
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
    content.style.width = '380px';

    let mru = [];
    try {
      mru = JSON.parse(localStorage.getItem('win98_run_mru') || '[]');
    } catch (e) {
      mru = [];
    }
    if (!Array.isArray(mru) || mru.length === 0) {
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
            ${mru.map(item => `<div class="win-combobox-item" data-val="${item}"><span style="width:14px; height:14px; display:inline-block;">${Icons['programs']}</span><span>${item}</span></div>`).join('')}
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
      comboList.classList.toggle('open');
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
      if (window.gameManager && !window.gameManager.isInstalled('quest')) {
        window.winManager.openDialog({
          title: 'LucasQuest 98',
          icon: 'error',
          message: isRu
            ? 'Игра LucasQuest 98 не установлена.<br>Вы можете получить её в <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game LucasQuest 98 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
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
      if (window.gameManager && !window.gameManager.isInstalled('fallout2')) {
        window.winManager.openDialog({
          title: 'Fallout 2 Demo',
          icon: 'error',
          message: isRu
            ? 'Игра Fallout 2 Demo не установлена.<br>Вы можете получить её в <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game Fallout 2 Demo is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
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
      if (window.gameManager && !window.gameManager.isInstalled('tekken3')) {
        window.winManager.openDialog({
          title: 'Tekken 3 98',
          icon: 'error',
          message: isRu
            ? 'Игра Tekken 3 98 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'tekken3\');">Steam</a>'
            : 'Game Tekken 3 98 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'tekken3\');">Steam</a>'
        });
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
      if (window.gameManager && !window.gameManager.isInstalled('sammax202')) {
        window.winManager.openDialog({
          title: 'Sam & Max: Moai Better Blues',
          icon: 'error',
          message: isRu
            ? 'Игра Sam &amp; Max: Moai Better Blues не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sammax202\');">Steam</a>'
            : 'Game Sam &amp; Max: Moai Better Blues is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'sammax202\');">Steam</a>'
        });
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
      if (window.gameManager && !window.gameManager.isInstalled('xiii')) {
        window.winManager.openDialog({
          title: 'XIII',
          icon: 'error',
          message: isRu
            ? 'Игра XIII не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'xiii\');">Steam</a>'
            : 'Game XIII is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'xiii\');">Steam</a>'
        });
      } else if (window.appXiii) window.appXiii.open();
      return;
    }
    if (cmd === 'maxpayne' || cmd === 'maxpayne.exe' || cmd === 'max payne' || cmd === 'макс пейн' || cmd === 'max') {
      if (window.gameManager && !window.gameManager.isInstalled('maxpayne')) {
        window.winManager.openDialog({
          title: 'Max Payne',
          icon: 'error',
          message: isRu
            ? 'Игра Max Payne не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'maxpayne\');">Steam</a>'
            : 'Game Max Payne is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'maxpayne\');">Steam</a>'
        });
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
      if (window.gameManager && !window.gameManager.isInstalled('falloutzp')) {
        window.winManager.openDialog({
          title: 'Fallout: Запорожье',
          icon: 'error',
          message: isRu
            ? 'Игра Fallout: Запорожье не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'falloutzp\');">Steam</a>'
            : 'Game Fallout: Zaporozhye is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'falloutzp\');">Steam</a>'
        });
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
      if (window.gameManager && !window.gameManager.isInstalled('dmc98')) {
        window.winManager.openDialog({
          title: 'Devil May Cry 4 98',
          icon: 'error',
          message: isRu
            ? 'Игра Devil May Cry 4 98 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game Devil May Cry 4 98 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
      } else if (window.appDmc98) window.appDmc98.open();
      return;
    }
    if (cmd === 'dao' || cmd === 'dao98' || cmd === 'daorigins' || cmd === 'daorigins.exe' || cmd === 'dragonage' || cmd === 'dragon age' || cmd === 'драгон эйдж' || cmd === 'эпоха драконов') {
      if (window.gameManager && !window.gameManager.isInstalled('dao98')) {
        window.winManager.openDialog({
          title: 'Dragon Age: Origins 98',
          icon: 'error',
          message: isRu
            ? 'Игра Dragon Age: Origins 98 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game Dragon Age: Origins 98 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
      } else if (window.appDao98) window.appDao98.open();
      return;
    }
    if (cmd === 'hl2' || cmd === 'hl2.exe' || cmd === 'half-life 2' || cmd === 'halflife2' || cmd === 'халф-лайф 2' || cmd === 'гордон') {
      if (window.gameManager && !window.gameManager.isInstalled('hl2')) {
        window.winManager.openDialog({
          title: 'Half-Life 2',
          icon: 'error',
          message: isRu
            ? 'Игра Half-Life 2 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'hl2\');">Steam</a>'
            : 'Game Half-Life 2 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam(\'hl2\');">Steam</a>'
        });
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
      if (window.gameManager && !window.gameManager.isInstalled('kotor98')) {
        window.winManager.openDialog({
          title: 'Star Wars: KOTOR 98',
          icon: 'error',
          message: isRu
            ? 'Игра Star Wars: Knights of the Old Republic 98 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game Star Wars: Knights of the Old Republic 98 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
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
      if (window.gameManager && !window.gameManager.isInstalled('mc98')) {
        window.winManager.openDialog({
          title: 'Minecraft 98',
          icon: 'error',
          message: isRu
            ? 'Игра Minecraft 98 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game Minecraft 98 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
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
      if (window.gameManager && !window.gameManager.isInstalled('stalker98')) {
        window.winManager.openDialog({
          title: 'S.T.A.L.K.E.R. 98',
          icon: 'error',
          message: isRu
            ? 'Игра S.T.A.L.K.E.R. 98 не установлена.<br>Вы можете загрузить её через <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game S.T.A.L.K.E.R. 98 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
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
      if (window.gameManager && !window.gameManager.isInstalled('half-life')) {
        window.winManager.openDialog({
          title: 'Half-Life 98',
          icon: 'error',
          message: isRu
            ? 'Игра Half-Life 98 не установлена.<br>Вы можете получить её в <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game Half-Life 98 is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
      } else if (window.appHalfLife) window.appHalfLife.open();
      return;
    }
    if (cmd === 'glide' || cmd === 'neon-racer' || cmd === 'midnight' || cmd === 'midnight-glide' || cmd === 'glide.exe') {
      if (window.gameManager && !window.gameManager.isInstalled('neon-racer')) {
        window.winManager.openDialog({
          title: 'Midnight Glide',
          icon: 'error',
          message: isRu
            ? 'Игра Midnight Glide не установлена.<br>Вы можете получить её в <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
            : 'Game Midnight Glide is not installed.<br>You can get it on <a href="#" onclick="window.gameManager&&window.gameManager.showInSteam();">Steam</a>'
        });
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
    if (cmd === 'avp' || cmd === 'kaspersky' || cmd === 'avp.exe' || cmd === 'antivirus') {
      if (window.gameManager && !window.gameManager.isInstalled('avp')) {
        window.winManager.openDialog({
          title: 'Антивирус Касперского AVP',
          icon: 'error',
          message: isRu
            ? 'Программа «Антивирус Касперского AVP» не установлена.<br>Вы можете приобрести её в магазине <a href="#" onclick="window.appIE&&window.appIE.open(\'http://www.softstore98.com\');">http://www.softstore98.com</a>'
            : 'Kaspersky Anti-Virus AVP is not installed.<br>You can purchase it at <a href="#" onclick="window.appIE&&window.appIE.open(\'http://www.softstore98.com\');">http://www.softstore98.com</a>'
        });
      } else if (window.appAVP) window.appAVP.open();
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
      val === 'factory-reset' || val === 'reinstall' || val === 'restore' ||
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

    try {
      localStorage.clear();
    } catch (e) {
      console.warn('Failed to clear localStorage during factory reset:', e);
    }

    setTimeout(() => {
      window.location.reload();
    }, 1200);
  }

  openDisplayProperties() {
    if (window.winManager && window.winManager.windows.has('app_display_props')) {
      window.winManager.bringToTop('app_display_props');
      return;
    }

    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const desktopEl = document.getElementById('desktop');
    const crtOverlay = document.getElementById('crt-overlay');

    let savedSettings = this.getDisplaySettings();
    let working = { ...savedSettings };

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

    const builtInSaverIds = ['pipes', 'starfield', 'mystify', 'flowerbox', 'none'];
    const allSavers = [
      { id: 'pipes', name: t('disp.ssPipes') },
      { id: 'starfield', name: t('disp.ssStarfield') },
      { id: 'mystify', name: t('disp.ssMystify') },
      { id: 'flowerbox', name: t('disp.ssFlowerbox') },
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
        ${tab('tab-bg', t('disp.tabBg'), true)}${tab('tab-screensaver', t('disp.tabScreensaver'))}${tab('tab-appearance', t('disp.tabAppearance'))}${tab('tab-effects', t('disp.tabEffects'))}${tab('tab-themes', t('disp.tabThemes'))}
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
            <legend>${t('disp.effectsTitle')}</legend>
            <label class="disp-check"><input type="checkbox" id="chk-crt" ${working.crtEnabled ? 'checked' : ''}> ${t('disp.crtLabel')}</label>
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
      height: 485,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = dialog.element;
    const chkCrt = el.querySelector('#chk-crt');
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

    const checkDirty = () => {
      btnApply.disabled = !(
        working.bgColor !== savedSettings.bgColor ||
        working.wallpaper !== savedSettings.wallpaper ||
        working.wallpaperMode !== savedSettings.wallpaperMode ||
        working.themeId !== savedSettings.themeId ||
        working.themeGrad !== savedSettings.themeGrad ||
        working.crtEnabled !== savedSettings.crtEnabled ||
        working.screensaverMode !== savedSettings.screensaverMode ||
        working.screensaverTimeout !== savedSettings.screensaverTimeout
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

    const picker = el.querySelector('.disp-color-picker');
    el.querySelector('.disp-color-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      picker.classList.toggle('open');
    });
    el.querySelectorAll('.disp-color-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        working.bgColor = cell.dataset.color;
        picker.classList.remove('open');
        updateMonitorPreview();
      });
    });
    el.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.disp-color-picker')) picker.classList.remove('open');
    });

    el.querySelectorAll('.disp-theme-item').forEach(item => {
      item.addEventListener('click', () => {
        working.themeId = item.dataset.theme;
        working.bgColor = item.dataset.bg;
        working.themeGrad = item.dataset.grad;
        if (item.dataset.wallpaper && item.dataset.wallpaper !== 'none') working.wallpaper = item.dataset.wallpaper;
        updateMonitorPreview();
      });
    });

    chkCrt.addEventListener('change', () => {
      working.crtEnabled = chkCrt.checked;
      if (crtOverlay) crtOverlay.classList.toggle('active', working.crtEnabled);
      document.body.classList.toggle('crt-enabled', working.crtEnabled);
      checkDirty();
    });

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

    const commitChanges = () => {
      savedSettings = this.saveDisplaySettings(working);
      this.applyDisplaySettings(savedSettings);
      checkDirty();
      if (window.soundSys) window.soundSys.playClick();
    };

    btnApply.addEventListener('click', commitChanges);

    el.querySelector('.btn-disp-ok').addEventListener('click', () => {
      commitChanges();
      window.winManager.closeWindow('app_display_props');
    });

    el.querySelector('.btn-disp-cancel').addEventListener('click', () => {
      if (working.crtEnabled !== savedSettings.crtEnabled) {
        this.applyDisplaySettings(savedSettings);
      }
      window.winManager.closeWindow('app_display_props');
    });
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
}

window.appDialogs = new AppDialogs();
window.AppDialogs = AppDialogs;

window.appRunDialog = {
  open: () => window.appDialogs && window.appDialogs.openRunDialog(),
  executeCommand: (cmd) => window.appDialogs && window.appDialogs.executeRunCommand(cmd)
};
