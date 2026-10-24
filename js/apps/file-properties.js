class AppFileProperties {
  constructor() {
    this.storageKey = 'win98_shortcut_props';
    this.clusterBytes = 8192;
    this.iconProps = this.load();
    this.systemTargets = {
      notepad: 'C:\\WINDOWS\\NOTEPAD.EXE',
      calc: 'C:\\WINDOWS\\CALC.EXE',
      minesweeper: 'C:\\WINDOWS\\WINMINE.EXE',
      solitaire: 'C:\\WINDOWS\\SOL.EXE',
      freecell: 'C:\\WINDOWS\\FREECELL.EXE',
      dialup: 'C:\\WINDOWS\\RNAAPP.EXE',
      paint: 'C:\\Program Files\\Accessories\\MSPAINT.EXE',
      wordpad: 'C:\\Program Files\\Accessories\\WORDPAD.EXE',
      outlook: 'C:\\Program Files\\Outlook Express\\MSIMN.EXE',
      pinball: 'C:\\Program Files\\Plus!\\Pinball\\PINBALL.EXE',
      icq: 'C:\\Program Files\\ICQ\\ICQ.EXE',
      winrar: 'C:\\Program Files\\WinRAR\\WINRAR.EXE',
      netscape: 'C:\\Program Files\\Netscape\\Netscape 6\\NETSCAPE.EXE'
    };
  }

  isEn() {
    return !!(window.i18n && window.i18n.getLanguage && window.i18n.getLanguage() === 'en');
  }

  t(en, ru) {
    return this.isEn() ? en : ru;
  }

  esc(text) {
    return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  load() {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(this.storageKey) : null;
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {
      console.warn('Failed to load shortcut properties:', e);
    }
    return {};
  }

  save() {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(this.storageKey, JSON.stringify(this.iconProps));
    } catch (e) {
      console.warn('Failed to save shortcut properties:', e);
    }
  }

  isHidden(icon) {
    if (icon.isFile) return !!(icon.fileData && icon.fileData.attributes && icon.fileData.attributes.hidden);
    const stored = this.iconProps[icon.id];
    return !!(stored && stored.attributes && stored.attributes.hidden);
  }

  iconFor(id) {
    const stored = this.iconProps[id];
    return stored && stored.icon ? stored.icon : null;
  }

  hashOf(text) {
    let h = 0;
    for (let i = 0; i < text.length; i++) h = ((h << 5) - h + text.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  formatNumber(n) {
    return Math.round(n).toLocaleString(this.isEn() ? 'en-US' : 'ru-RU');
  }

  usedBytes(bytes) {
    return Math.ceil(bytes / this.clusterBytes) * this.clusterBytes;
  }

  humanSize(bytes) {
    if (bytes < 1024) return `${bytes} ${this.t('bytes', 'байт')}`;
    if (bytes < 1048576) return this.t(`${Math.round(bytes / 1024)}KB`, `${Math.round(bytes / 1024)} КБ`);
    const mb = (bytes / 1048576).toFixed(2);
    return this.t(`${mb}MB`, `${mb.replace('.', ',')} МБ`);
  }

  sizeLine(bytes, usedBytes) {
    const exact = `${this.formatNumber(bytes)} ${this.t('bytes', 'байт')}`;
    const used = `${this.formatNumber(usedBytes)} ${this.t('bytes', 'байт')}`;
    return this.t(`${this.humanSize(bytes)} (${exact}), ${used} used`, `${this.humanSize(bytes)} (${exact}), занято ${used}`);
  }

  dosName(name, isFolder) {
    const dot = isFolder ? -1 : name.lastIndexOf('.');
    const rawBase = dot > 0 ? name.slice(0, dot) : name;
    const rawExt = dot > 0 ? name.slice(dot + 1) : '';
    const clean = text => text.toUpperCase().replace(/[^A-Z0-9_$!#%&\-{}()@'^\u0410-\u042F\u0401]/g, '');
    const base = clean(rawBase);
    const ext = clean(rawExt).slice(0, 3);
    const lossy = base !== rawBase.toUpperCase() || base.length > 8 || base.length === 0;
    const shortBase = lossy ? (base.slice(0, 6) || '_') + '~1' : base;
    return ext ? `${shortBase}.${ext}` : shortBase;
  }

  parseDate(text) {
    if (typeof text !== 'string') return null;
    let m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (m) return new Date(+m[3], +m[1] - 1, +m[2], +(m[4] || 0), +(m[5] || 0), 0);
    m = text.match(/^(\d{2})\.(\d{2})\.(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (!m) return null;
    let year = +m[3];
    if (year < 100) year += year < 70 ? 2000 : 1900;
    return new Date(year, +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), 0);
  }

  datesFor(name, item) {
    const h = this.hashOf(name);
    const stored = item ? this.parseDate(item.date) : null;
    const modified = stored || new Date(1998, 5, 25 + (h % 520), 8 + ((h >> 4) % 14), (h >> 8) % 60, (h >> 12) % 60);
    const created = new Date(modified.getTime() - (((h >> 5) % 40) * 86400000) - (((h >> 9) % 600) * 60000));
    return { created, modified, accessed: new Date() };
  }

  formatDate(date, withTime) {
    const en = this.isEn();
    const locale = en ? 'en-US' : 'ru-RU';
    const day = date.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dayText = day.charAt(0).toUpperCase() + day.slice(1);
    if (!withTime) return dayText;
    const time = date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', second: '2-digit' }).replace(/\u202f/g, ' ');
    return `${dayText} ${time}`;
  }

  pathString(parts) {
    if (!Array.isArray(parts) || !parts.length) return '';
    let list = parts.slice();
    if (list[0] === 'My Computer') list = list.slice(1);
    if (list[0] === 'Desktop') list = ['C:', 'WINDOWS', ...list];
    if (!/^[A-Za-z]:$/.test(list[0])) list = ['C:', ...list];
    return list.join('\\');
  }

  locationFor(pathParts) {
    const full = this.pathString(pathParts);
    return /^[A-Za-z]:$/.test(full) ? full + '\\' : full;
  }

  folderStats(node) {
    const stats = { files: 0, folders: 0, bytes: 0, used: 0 };
    const walk = (folder) => {
      Object.values(folder.children || {}).forEach(child => {
        if (child.type === 'folder' || child.children) {
          stats.folders++;
          walk(child);
        } else {
          const size = Math.max(0, window.appExplorer.getItemSizeBytes(child));
          stats.files++;
          stats.bytes += size;
          stats.used += this.usedBytes(size);
        }
      });
    };
    walk(node);
    return stats;
  }

  gameFor(name, appId) {
    const catalog = window.gameManager && window.gameManager.catalog;
    if (!catalog) return null;
    const upper = String(name || '').toUpperCase();
    return Object.values(catalog).find(game => (game.targetExe && game.targetExe.toUpperCase() === upper) || (appId && game.id === appId)) || null;
  }

  versionInfo(name, appId) {
    const game = this.gameFor(name, appId);
    const base = name.replace(/\.[^.]*$/, '');
    const company = game ? String(game.developer || '').split(/[/(]/)[0].trim() || 'Unknown' : 'Microslop Corp.';
    const yearMatch = game && String(game.developer || '').match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : '1998';
    const gameTitle = game ? game.title.replace(/\s*\(.*\)\s*$/, '') : '';
    const product = game ? gameTitle : this.t('Microslop® Win® 98 Operating System', 'Операционная система Microslop® Win® 98');
    const version = game ? '1.0.0.0' : '4.10.1998';
    const description = game ? gameTitle : base;
    const copyright = `Copyright © ${company} ${year}`;
    return {
      version,
      description,
      copyright,
      items: [
        [this.t('Company Name', 'Название компании'), company],
        [this.t('File Version', 'Версия файла'), version],
        [this.t('Internal Name', 'Внутреннее имя'), base],
        [this.t('Language', 'Язык'), this.t('English (United States)', 'Английский (США)')],
        [this.t('Legal Copyright', 'Авторские права'), copyright],
        [this.t('Original Filename', 'Исходное имя файла'), name.toUpperCase()],
        [this.t('Product Name', 'Название продукта'), product],
        [this.t('Product Version', 'Версия продукта'), version]
      ]
    };
  }

  titleFor(name) {
    return this.t(`${name} Properties`, `Свойства: ${name}`);
  }

  quoteTarget(path) {
    return /\s/.test(path) ? `"${path}"` : path;
  }

  normalizeTarget(text) {
    if (!text) return '';
    const parts = String(text).split('\\');
    const isPath = parts[0] === 'My Computer' || parts[0] === 'Desktop' || /^[A-Za-z]:$/.test(parts[0]);
    return isPath ? this.quoteTarget(this.pathString(parts)) : String(text);
  }

  targetFor(iconId, title) {
    if (this.systemTargets[iconId]) return this.quoteTarget(this.systemTargets[iconId]);
    const driveC = window.vfs && window.vfs.resolvePath(['My Computer', 'C:']);
    const find = (node, trail) => {
      for (const key of Object.keys((node && node.children) || {})) {
        const child = node.children[key];
        if (child.children) {
          const inner = find(child, [...trail, key]);
          if (inner) return inner;
        } else if (child.type === 'executable' && child.app === iconId) {
          return [...trail, key].join('\\');
        }
      }
      return null;
    };
    const found = find(driveC, ['C:']);
    if (found) return this.quoteTarget(found);
    const game = this.gameFor('', iconId);
    if (game && game.folder && game.targetExe) return this.quoteTarget(`C:\\Games\\${game.folder}\\${game.targetExe}`);
    const folder = String(title).replace(/[\\/:*?"<>|]/g, '');
    const exe = folder.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase() || 'PROGRAM';
    return this.quoteTarget(`C:\\Program Files\\${folder}\\${exe}.EXE`);
  }

  targetDetails(targetText) {
    const clean = String(targetText || '').trim().replace(/^"(.*)"$/, '$1');
    const parts = clean.split('\\').filter(Boolean);
    const file = parts.pop() || '';
    const dirName = parts.length > 1 ? parts[parts.length - 1] : (parts.length ? parts[0] + '\\' : '');
    const node = window.vfs && parts.length ? window.vfs.resolvePath(['My Computer', ...parts, file]) : null;
    const isFolder = !!(node && (node.type === 'folder' || node.children));
    const type = isFolder
      ? this.t('File Folder', 'Папка с файлами')
      : window.appExplorer.getItemTypeDesc({ name: file });
    return { type, location: dirName };
  }

  findTarget(targetText) {
    const clean = String(targetText || '').trim().replace(/^"(.*)"$/, '$1');
    const parts = clean.split('\\').filter(Boolean);
    const candidates = [['My Computer', ...parts]];
    if (parts[1] === 'WINDOWS' && parts[2] === 'Desktop') candidates.push(['Desktop', ...parts.slice(3)]);
    const hit = candidates.find(path => window.vfs && window.vfs.resolvePath(path));
    if (hit && window.appExplorer) {
      window.appExplorer.open(hit.length > 1 ? hit.slice(0, -1) : hit);
      return;
    }
    window.winManager.openDialog({
      title: this.t('Find Target', 'Найти объект'),
      icon: 'warning',
      message: this.t(`Cannot find ${this.esc(clean)}. Check that the path is correct.`, `Не удаётся найти ${this.esc(clean)}. Проверьте правильность пути.`)
    });
  }

  runLabels() {
    return [
      this.t('Normal window', 'Обычный размер окна'),
      this.t('Minimized', 'Свернутое в значок'),
      this.t('Maximized', 'Развернутое на весь экран')
    ];
  }

  openForItem(item, pathParts = [], win = null) {
    if (!item || !window.winManager || !window.appExplorer) return;
    const explorer = window.appExplorer;
    const key = item.key || item.name || 'Item';
    const name = item.name || key;
    const isFolder = !!(item.type === 'folder' || item.children);
    const isShortcut = !!(item.isShortcut || item.type === 'shortcut' || item.app === 'shortcut' || /\.lnk$/i.test(name));
    const isExecutable = !isShortcut && !isFolder && (item.type === 'executable' || /\.(exe|com)$/i.test(name));
    const parent = window.vfs && window.vfs.resolvePath(pathParts);
    const node = (parent && parent.children && parent.children[key]) || null;
    const attrs = { readonly: false, hidden: false, archive: true, system: false, ...(item.attributes || {}) };
    const initialName = isShortcut ? name.replace(/\.lnk$/i, '') : name;
    let currentKey = key;
    let currentName = initialName;
    const dates = this.datesFor(name, item);
    const hash = this.hashOf(name);

    let stats;
    if (isFolder) stats = this.folderStats(item);
    else {
      const bytes = isShortcut ? 380 + (hash % 300) : Math.max(0, explorer.getItemSizeBytes(item));
      stats = { files: 1, folders: 0, bytes, used: this.usedBytes(bytes) };
    }

    const rows = [
      [this.t('Type:', 'Тип:'), explorer.getItemTypeDesc(item)],
      [this.t('Location:', 'Размещение:'), this.locationFor(pathParts)],
      [this.t('Size:', 'Размер:'), this.sizeLine(stats.bytes, stats.used)]
    ];
    if (isFolder) {
      rows.push([
        this.t('Contains:', 'Содержит:'),
        this.t(`${stats.files} Files, ${stats.folders} Folders`, `Файлов: ${stats.files}, папок: ${stats.folders}`)
      ]);
    }

    let shortcut = null;
    if (isShortcut) {
      const saved = item.shortcut || {};
      const linked = this.normalizeTarget(item.shortcutTarget || this.pathString(item.targetPath));
      const content = typeof item.content === 'string' && /^"?[A-Za-z]:\\/.test(item.content) ? item.content : '';
      shortcut = {
        target: saved.target || linked || content || 'C:\\WINDOWS\\EXPLORER.EXE',
        startIn: saved.startIn || '',
        key: saved.key || '',
        run: saved.run || 0
      };
    }

    this.show({
      id: 'app_props_' + [...pathParts, key].join('/').replace(/[^a-z0-9]/gi, c => c.charCodeAt(0).toString(16)),
      name: initialName,
      icon: explorer.getItemIconKey(item),
      isShortcut,
      nameEditable: !!node && !attrs.readonly,
      rows,
      dosName: this.dosName(name, isFolder),
      dates,
      attrs,
      shortcut,
      version: isExecutable ? this.versionInfo(name, item.app) : null,
      onApply: (values) => {
        if (!node) return;
        node.attributes = { ...values.attrs };
        if (values.shortcut) node.shortcut = { ...values.shortcut };
        if (values.icon && values.icon !== explorer.getItemIconKey(item)) node.icon = values.icon;
        const typed = values.name.trim();
        if (typed && typed !== currentName) {
          const renamed = typed + (isShortcut && !/\.lnk$/i.test(typed) ? '.lnk' : '');
          window.vfs.renameItem(pathParts, currentKey, renamed);
          currentKey = renamed;
          currentName = typed;
        } else {
          window.vfs.saveToStorage();
        }
        if (win) explorer.renderFolder(win);
        if (pathParts[0] === 'Desktop' && window.desktop) window.desktop.renderIcons();
        return currentName;
      }
    });
  }

  openForDesktopIcon(icon) {
    if (!icon || !window.winManager || !window.appExplorer) return;
    const stored = this.iconProps[icon.id] || {};
    const hash = this.hashOf(icon.title);
    const bytes = 380 + (hash % 300);
    const attrs = { readonly: false, hidden: false, archive: true, system: false, ...(stored.attributes || {}) };
    const savedShortcut = stored.shortcut || {};
    const fileName = `${icon.title}.lnk`;

    this.show({
      id: 'app_props_icon_' + icon.id.replace(/[^a-z0-9]/gi, '_'),
      name: icon.title,
      icon: stored.icon || icon.icon,
      isShortcut: true,
      nameEditable: false,
      rows: [
        [this.t('Type:', 'Тип:'), this.t('Shortcut', 'Ярлык')],
        [this.t('Location:', 'Размещение:'), 'C:\\WINDOWS\\Desktop'],
        [this.t('Size:', 'Размер:'), this.sizeLine(bytes, this.usedBytes(bytes))]
      ],
      dosName: this.dosName(fileName, false),
      dates: this.datesFor(fileName, null),
      attrs,
      shortcut: {
        target: savedShortcut.target || this.targetFor(icon.id, icon.title),
        startIn: savedShortcut.startIn || '',
        key: savedShortcut.key || '',
        run: savedShortcut.run || 0
      },
      version: null,
      onApply: (values) => {
        this.iconProps[icon.id] = { attributes: { ...values.attrs }, shortcut: { ...values.shortcut }, icon: values.icon && values.icon !== icon.icon ? values.icon : null };
        this.save();
        if (window.desktop) window.desktop.renderIcons();
        return icon.title;
      }
    });
  }

  iconMarkup(iconKey, isShortcut) {
    const overlay = isShortcut ? `<span class="shortcut-overlay">${Icons['shortcut-overlay'] || ''}</span>` : '';
    return `${Icons[iconKey] || Icons['file-txt']}${overlay}`;
  }

  checkMarkup(cls, label, checked, disabled) {
    return `<label class="fp-check"><input type="checkbox" class="${cls}"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}><span>${label}</span></label>`;
  }

  show(spec) {
    const wm = window.winManager;
    if (wm.windows.has(spec.id)) {
      wm.bringToTop(spec.id);
      return;
    }
    const hasShortcutTab = !!spec.shortcut;
    const hasVersionTab = !!spec.version;
    let currentIcon = spec.icon;
    let currentName = spec.name;

    const nameMarkup = spec.nameEditable
      ? `<input type="text" class="fp-name" value="${this.esc(spec.name)}" spellcheck="false">`
      : `<span class="fp-name-static">${this.esc(spec.name)}</span>`;
    const head = (field) => `<div class="fp-head"><div class="fp-icon">${this.iconMarkup(currentIcon, spec.isShortcut)}</div>${field}</div>`;
    const rowsMarkup = (rows) => rows.map(([label, value]) => `<span>${label}</span><span class="fp-value">${this.esc(value)}</span>`).join('');
    const attrs = spec.attrs;

    const generalPane = `
      <div class="fp-pane" data-pane="general">
        ${head(nameMarkup)}
        <div class="fp-sep"></div>
        <div class="fp-grid">${rowsMarkup(spec.rows)}</div>
        <div class="fp-sep"></div>
        <div class="fp-grid is-wide">
          ${rowsMarkup([
            [this.t('MS-DOS name:', 'Имя MS-DOS:'), spec.dosName],
            [this.t('Created:', 'Создан:'), this.formatDate(spec.dates.created, true)],
            [this.t('Modified:', 'Изменен:'), this.formatDate(spec.dates.modified, true)],
            [this.t('Accessed:', 'Открыт:'), this.formatDate(spec.dates.accessed, false)]
          ])}
        </div>
        <div class="fp-sep"></div>
        <div class="fp-attrs">
          <span class="fp-attrs-label">${this.t('Attributes:', 'Атрибуты:')}</span>
          ${this.checkMarkup('fp-attr-ro', this.t('<u>R</u>ead-only', 'Только чтение'), attrs.readonly)}
          ${this.checkMarkup('fp-attr-hi', this.t('Hi<u>d</u>den', 'Скрытый'), attrs.hidden)}
          <span></span>
          ${this.checkMarkup('fp-attr-ar', this.t('Ar<u>c</u>hive', 'Архивный'), attrs.archive)}
          ${this.checkMarkup('fp-attr-sy', this.t('S<u>y</u>stem', 'Системный'), attrs.system, !attrs.system)}
        </div>
      </div>`;

    let shortcutPane = '';
    if (hasShortcutTab) {
      const details = this.targetDetails(spec.shortcut.target);
      const runOptions = this.runLabels().map((label, i) => `<option value="${i}"${i === spec.shortcut.run ? ' selected' : ''}>${label}</option>`).join('');
      shortcutPane = `
      <div class="fp-pane" data-pane="shortcut" hidden>
        ${head(`<span class="fp-name-static">${this.esc(spec.name)}</span>`)}
        <div class="fp-sep"></div>
        <div class="fp-grid is-fields">
          <span>${this.t('Target type:', 'Тип объекта:')}</span><span class="fp-value fp-target-type">${this.esc(details.type)}</span>
          <span>${this.t('Target location:', 'Размещение:')}</span><span class="fp-value fp-target-location">${this.esc(details.location)}</span>
          <label>${this.t('<u>T</u>arget:', 'Объект:')}</label><input type="text" class="fp-target" value="${this.esc(spec.shortcut.target)}" spellcheck="false">
        </div>
        <div class="fp-sep"></div>
        <div class="fp-grid is-fields">
          <label>${this.t('<u>S</u>tart in:', 'Рабочая папка:')}</label><input type="text" class="fp-start-in" value="${this.esc(spec.shortcut.startIn)}" spellcheck="false">
          <label>${this.t('Shortcut <u>k</u>ey:', 'Быстрый вызов:')}</label><input type="text" class="fp-hotkey" value="${this.esc(spec.shortcut.key || this.t('None', 'Нет'))}" spellcheck="false">
          <label>${this.t('<u>R</u>un:', 'Окно:')}</label><select class="fp-run">${runOptions}</select>
        </div>
        <div class="fp-shortcut-buttons">
          <button class="win-btn fp-find-target">${this.t('<u>F</u>ind Target...', 'Найти объект...')}</button>
          <button class="win-btn fp-change-icon">${this.t('<u>C</u>hange Icon...', 'Сменить значок...')}</button>
        </div>
      </div>`;
    }

    let versionPane = '';
    if (hasVersionTab) {
      const v = spec.version;
      versionPane = `
      <div class="fp-pane" data-pane="version" hidden>
        <div class="fp-grid is-wide fp-version-top">
          <span>${this.t('File version:', 'Версия файла:')}</span><span class="fp-value">${this.esc(v.version)}</span>
          <span>${this.t('Description:', 'Описание:')}</span><span class="fp-value">${this.esc(v.description)}</span>
          <span>${this.t('Copyright:', 'Авторские права:')}</span><span class="fp-value">${this.esc(v.copyright)}</span>
        </div>
        <fieldset class="fp-version-group">
          <legend>${this.t('Other version information', 'Прочие сведения о версии')}</legend>
          <div class="fp-version-cols">
            <div class="fp-version-col">
              <span>${this.t('Item <u>n</u>ame:', 'Название:')}</span>
              <div class="fp-version-list" tabindex="0">
                ${v.items.map(([label], i) => `<div class="fp-version-item${i === 0 ? ' selected' : ''}" data-index="${i}">${this.esc(label)}</div>`).join('')}
              </div>
            </div>
            <div class="fp-version-col">
              <span>${this.t('<u>V</u>alue:', 'Значение:')}</span>
              <div class="fp-version-value">${this.esc(v.items[0][1])}</div>
            </div>
          </div>
        </fieldset>
      </div>`;
    }

    const tabs = [
      ['general', this.t('General', 'Общие')],
      ...(hasShortcutTab ? [['shortcut', this.t('Shortcut', 'Ярлык')]] : []),
      ...(hasVersionTab ? [['version', this.t('Version', 'Версия')]] : [])
    ];

    const content = document.createElement('div');
    content.className = 'fp-root';
    content.innerHTML = `
      <div class="win-tabs">
        ${tabs.map(([id, label], i) => `<div class="win-tab fp-tab${i === 0 ? ' active' : ''}" data-tab="${id}">${label}</div>`).join('')}
      </div>
      <div class="win-tab-panel fp-panel">
        ${generalPane}${shortcutPane}${versionPane}
      </div>
      <div class="fp-buttons">
        <button class="win-btn is-default fp-ok">OK</button>
        <button class="win-btn fp-cancel">${this.t('Cancel', 'Отмена')}</button>
        <button class="win-btn fp-apply" disabled>${this.t('<u>A</u>pply', 'Применить')}</button>
      </div>`;

    const dialog = wm.createWindow({
      id: spec.id,
      title: this.titleFor(spec.name),
      icon: currentIcon,
      width: 378,
      height: 436,
      x: Math.max(0, Math.round((window.innerWidth - 378) / 2)),
      y: Math.max(0, Math.round((window.innerHeight - 436) / 3)),
      resizable: false,
      minimizable: false,
      maximizable: false,
      helpButton: true,
      onHelp: () => this.help(),
      isDialog: true,
      content
    });

    const el = dialog.element;
    const applyBtn = el.querySelector('.fp-apply');
    const markDirty = () => { applyBtn.disabled = false; };

    const selectTab = (id) => {
      el.querySelectorAll('.fp-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === id));
      el.querySelectorAll('.fp-pane').forEach(pane => { pane.hidden = pane.dataset.pane !== id; });
      if (id === 'shortcut') {
        const target = el.querySelector('.fp-target');
        target.focus();
        target.select();
      }
    };
    el.querySelectorAll('.fp-tab').forEach(tab => tab.addEventListener('click', () => selectTab(tab.dataset.tab)));

    el.addEventListener('input', markDirty);
    el.addEventListener('change', markDirty);

    const collect = () => {
      const nameField = el.querySelector('.fp-name');
      const values = {
        name: nameField ? nameField.value : currentName,
        icon: currentIcon,
        attrs: {
          readonly: el.querySelector('.fp-attr-ro').checked,
          hidden: el.querySelector('.fp-attr-hi').checked,
          archive: el.querySelector('.fp-attr-ar').checked,
          system: el.querySelector('.fp-attr-sy').checked
        },
        shortcut: null
      };
      if (hasShortcutTab) {
        const hotkey = el.querySelector('.fp-hotkey').value;
        values.shortcut = {
          target: el.querySelector('.fp-target').value,
          startIn: el.querySelector('.fp-start-in').value,
          key: hotkey === this.t('None', 'Нет') ? '' : hotkey,
          run: Number(el.querySelector('.fp-run').value)
        };
      }
      return values;
    };

    const commit = () => {
      const finalName = spec.onApply(collect());
      applyBtn.disabled = true;
      if (finalName) {
        currentName = finalName;
        const titleEl = el.querySelector('.win-titlebar-title');
        if (titleEl) titleEl.textContent = this.titleFor(finalName);
      }
    };

    el.querySelector('.fp-ok').addEventListener('click', () => {
      commit();
      wm.closeWindow(spec.id);
    });
    el.querySelector('.fp-cancel').addEventListener('click', () => wm.closeWindow(spec.id));
    applyBtn.addEventListener('click', commit);

    if (hasShortcutTab) {
      const target = el.querySelector('.fp-target');
      target.addEventListener('input', () => {
        const details = this.targetDetails(target.value);
        el.querySelector('.fp-target-type').textContent = details.type;
        el.querySelector('.fp-target-location').textContent = details.location;
      });
      el.querySelector('.fp-find-target').addEventListener('click', () => this.findTarget(target.value));
      el.querySelector('.fp-change-icon').addEventListener('click', () => {
        if (!window.appDialogs || !window.appDialogs.openIconPicker) return;
        window.appDialogs.openIconPicker(currentIcon, (picked) => {
          currentIcon = picked;
          el.querySelectorAll('.fp-icon').forEach(box => { box.innerHTML = this.iconMarkup(currentIcon, spec.isShortcut); });
          markDirty();
        });
      });

      const hotkey = el.querySelector('.fp-hotkey');
      hotkey.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' || e.key === 'Escape' || e.key === 'Enter') return;
        e.preventDefault();
        if (e.key === 'Backspace' || e.key === 'Delete') {
          hotkey.value = this.t('None', 'Нет');
        } else if (/^[a-z0-9]$/i.test(e.key) || /^F([1-9]|1[0-2])$/.test(e.key)) {
          hotkey.value = `Ctrl + Alt + ${e.key.length === 1 ? e.key.toUpperCase() : e.key}`;
        } else {
          return;
        }
        markDirty();
      });
    }

    if (hasVersionTab) {
      const list = el.querySelector('.fp-version-list');
      const valueBox = el.querySelector('.fp-version-value');
      list.addEventListener('click', (e) => {
        const row = e.target.closest('.fp-version-item');
        if (!row) return;
        list.querySelectorAll('.fp-version-item').forEach(r => r.classList.toggle('selected', r === row));
        valueBox.textContent = spec.version.items[Number(row.dataset.index)][1];
      });
    }

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        wm.closeWindow(spec.id);
      } else if (e.key === 'Enter' && !e.target.closest('.win-btn') && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        el.querySelector('.fp-ok').click();
      }
    });

    const first = el.querySelector('.fp-name') || el.querySelector('.fp-attr-ro');
    if (first) first.focus();
  }

  help() {
    const clippy = window.appClippy;
    const enabled = !window.clippyOptions || window.clippyOptions.get('enabled') !== false;
    if (!clippy || !enabled) {
      if (window.appDialogs && window.appDialogs.openHelp) window.appDialogs.openHelp();
      return;
    }
    if (!clippy.isRunning()) clippy.launch('help');
    else if (!clippy.visible) clippy.show();
    clippy.speak(
      this.t(
        'Attributes mark a file as read-only, hidden or ready for backup. On the Shortcut tab you can change the target, the start folder and the icon of a shortcut.',
        'Атрибуты помечают файл как «только чтение», скрытый или готовый к архивации. На вкладке «Ярлык» можно изменить объект, рабочую папку и значок ярлыка.'
      ),
      [],
      '📎',
      10000
    );
  }
}

window.appFileProperties = new AppFileProperties();
