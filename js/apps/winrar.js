/**
 * WinRAR 2.x Classic Archiver
 * Archive explorer, compression inspect, extraction into VFS,
 * and the iconic 40-day evaluation trial nag dialog.
 */
class AppWinRAR {
  constructor() {
    this.currentArchiveName = 'doom2_cheats.zip';
    this.selectedFileIndex = 0;

    // Built-in sample archives
    this.sampleArchives = {
      'doom2_cheats.zip': {
        name: 'doom2_cheats.zip',
        path: 'C:\\My Documents\\doom2_cheats.zip',
        comment: 'DOOM II: Hell on Earth — Полная коллекция чит-кодов и секретов (1998)',
        files: [
          { name: 'IDDQD_GodMode.txt', size: 1420, packed: 610, ratio: '57%', date: '10.08.1998', time: '14:20', crc: '3A5B891F', content: 'DOOM II ЧИТ-КОДЫ:\r\nIDDQD - Бессмертие (God Mode)\r\nIDKFA - Все оружие, патроны и ключи\r\nIDCLIP - Прохождение сквозь стены\r\nIDBEHOLDS - Берсерк\r\nIDCHOPPERS - Бензопила' },
          { name: 'SECRET_LEVELS.TXT', size: 3540, packed: 1280, ratio: '63%', date: '12.08.1998', time: '18:45', crc: '8F2C10D4', content: 'Вход на секретный уровень MAP31 (Wolfenstein):\r\nНа уровне 15 (Industrial Zone) найдите скрытый переключатель в лавовом тоннеле!' },
          { name: 'DOOM2_RUN.BAT', size: 128, packed: 95, ratio: '25%', date: '15.08.1998', time: '10:05', crc: '0C881AE2', content: '@ECHO OFF\r\nDOOM2.EXE -warp 1 1 -skill 4 -nomonsters' }
        ]
      },
      'matrix_screensaver.rar': {
        name: 'matrix_screensaver.rar',
        path: 'C:\\Downloads\\matrix_screensaver.rar',
        comment: 'The Matrix (1999) Digital Rain Screen Saver v1.0',
        files: [
          { name: 'MATRIX.SCR', size: 68420, packed: 24100, ratio: '64%', date: '21.09.1998', time: '22:15', crc: '45A19CD2', content: '[Screen Saver Binary File: Matrix Code Green Stream]' },
          { name: 'README_INSTALL.TXT', size: 890, packed: 420, ratio: '52%', date: '21.09.1998', time: '22:18', crc: '7B33491E', content: 'Инструкция по установке Matrix Screensaver:\r\nСкопируйте MATRIX.SCR в папку C:\\WINDOWS\\SYSTEM и выберите его в Свойствах Экрана.' }
        ]
      }
    };
  }

  open(archiveName = 'doom2_cheats.zip') {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const baseName = archiveName.replace(/^.*[\\\/]/, '');
    const archive = this.sampleArchives[baseName] || this.sampleArchives['doom2_cheats.zip'];
    this.currentArchiveName = archive.name;

    const winId = 'app_winrar_' + Date.now();

    const content = document.createElement('div');
    content.className = 'winrar-window';
    content.innerHTML = `
      <!-- Menubar -->
      <div class="win-menubar">
        <div class="win-menu-item">
          ${t('winrar.menuFile')}
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option opt-rar-open">${t('winrar.menuOpen')} <span>Ctrl+O</span></div>
            <div class="win-dropdown-option opt-rar-save">${t('winrar.menuSaveAs')} <span>Ctrl+S</span></div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option opt-rar-exit">${t('winrar.menuExit')} <span>Alt+X</span></div>
          </div>
        </div>
        <div class="win-menu-item">
          ${t('winrar.menuCommands')}
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option opt-rar-extract">${t('winrar.menuExtract')} <span>Alt+E</span></div>
            <div class="win-dropdown-option opt-rar-test">${t('winrar.menuTest')} <span>Alt+T</span></div>
            <div class="win-dropdown-option opt-rar-view">${t('winrar.menuView')} <span>Alt+V</span></div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option opt-rar-delete">${t('winrar.menuDelete')} <span>Del</span></div>
          </div>
        </div>
        <div class="win-menu-item">
          ${t('winrar.menuHelp')}
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option opt-rar-eval">${t('winrar.menuEval')}</div>
            <div class="win-dropdown-option opt-rar-about">${t('winrar.menuAbout')}</div>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="winrar-toolbar">
        <button class="winrar-tool-btn opt-rar-extract" title="${t('winrar.menuExtract')}">
          <div class="winrar-tool-icon">📂</div>
          <span>${t('winrar.btnExtract')}</span>
        </button>
        <button class="winrar-tool-btn opt-rar-test" title="${t('winrar.menuTest')}">
          <div class="winrar-tool-icon">🔍</div>
          <span>${t('winrar.btnTest')}</span>
        </button>
        <button class="winrar-tool-btn opt-rar-view" title="${t('winrar.menuView')}">
          <div class="winrar-tool-icon">📄</div>
          <span>${t('winrar.btnView')}</span>
        </button>
        <button class="winrar-tool-btn opt-rar-delete" title="${t('winrar.menuDelete')}">
          <div class="winrar-tool-icon">❌</div>
          <span>${t('winrar.btnDelete')}</span>
        </button>
        <button class="winrar-tool-btn opt-rar-info" title="${t('winrar.btnInfo')}">
          <div class="winrar-tool-icon">ℹ️</div>
          <span>${t('winrar.btnInfo')}</span>
        </button>
      </div>

      <!-- Path bar -->
      <div class="winrar-path-bar">
        <span>${t('winrar.archiveLabel')}</span>
        <input type="text" class="winrar-path-input" readonly value="${archive.path}">
      </div>

      <!-- File list table -->
      <div class="winrar-file-table-wrap">
        <table class="winrar-table">
          <thead>
            <tr>
              <th>${t('winrar.colName')}</th>
              <th>${t('winrar.colSize')}</th>
              <th>${t('winrar.colPacked')}</th>
              <th>${t('winrar.colRatio')}</th>
              <th>${t('winrar.colDate')}</th>
              <th>${t('winrar.colTime')}</th>
              <th>${t('winrar.colCrc')}</th>
            </tr>
          </thead>
          <tbody id="winrar-tbody">
            ${archive.files.map((f, i) => `
              <tr data-index="${i}" class="${i === 0 ? 'selected' : ''}">
                <td><strong>${f.name}</strong></td>
                <td>${t('winrar.bytes', f.size.toLocaleString())}</td>
                <td>${t('winrar.bytes', f.packed.toLocaleString())}</td>
                <td>${f.ratio}</td>
                <td>${f.date}</td>
                <td>${f.time}</td>
                <td><code>${f.crc}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Status Bar -->
      <div class="winrar-status-bar">
        <div class="winrar-status-cell" style="flex:1;">${t('winrar.statusFiles', archive.files.length)}</div>
        <div class="winrar-status-cell" style="flex:2;">${t('winrar.statusTotal', archive.files.reduce((a, b) => a + b.size, 0).toLocaleString())}</div>
        <div class="winrar-status-cell" style="flex:1;">${t('winrar.statusComp')}</div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: winId,
      title: t('winrar.evaluation', archive.name),
      icon: 'winrar',
      width: 580,
      height: 400,
      content
    });

    // Attach event listeners
    this.attachEvents(win, archive);

    // Show iconic 40-Day Evaluation Nag Screen with 30% chance or on first open
    if (!sessionStorage.getItem('winrar_nag_shown')) {
      sessionStorage.setItem('winrar_nag_shown', 'true');
      setTimeout(() => this.showEvaluationNag(win), 500);
    }
  }

  attachEvents(win, archive) {
    const rows = win.element.querySelectorAll('#winrar-tbody tr');
    rows.forEach(tr => {
      tr.addEventListener('click', () => {
        rows.forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
        this.selectedFileIndex = parseInt(tr.dataset.index, 10);
      });

      tr.addEventListener('dblclick', () => {
        const file = archive.files[this.selectedFileIndex];
        if (file) this.viewFile(file);
      });
    });

    win.element.querySelectorAll('.opt-rar-extract').forEach(el => {
      el.addEventListener('click', () => this.extractFiles(win, archive));
    });

    win.element.querySelectorAll('.opt-rar-test').forEach(el => {
      el.addEventListener('click', () => {
        const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
        if (window.soundSys) window.soundSys.playDing();
        window.winManager.openDialog({
          title: t('winrar.testTitle'),
          icon: 'info',
          message: t('winrar.testSuccess', archive.name)
        });
      });
    });

    win.element.querySelectorAll('.opt-rar-view').forEach(el => {
      el.addEventListener('click', () => {
        const file = archive.files[this.selectedFileIndex];
        if (file) this.viewFile(file);
      });
    });

    win.element.querySelectorAll('.opt-rar-info').forEach(el => {
      el.addEventListener('click', () => {
        const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
        window.winManager.openDialog({
          title: t('winrar.infoTitle', archive.name),
          icon: 'winrar',
          message: t('winrar.infoMsg', archive.name, archive.path, archive.comment)
        });
      });
    });

    win.element.querySelectorAll('.opt-rar-eval').forEach(el => {
      el.addEventListener('click', () => this.showEvaluationNag(win));
    });

    win.element.querySelectorAll('.opt-rar-about').forEach(el => {
      el.addEventListener('click', () => {
        const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
        window.winManager.openDialog({
          title: t('winrar.aboutTitle'),
          icon: 'winrar',
          message: t('winrar.aboutText')
        });
      });
    });

    win.element.querySelectorAll('.opt-rar-exit').forEach(el => {
      el.addEventListener('click', () => { if (win.close) win.close(); });
    });
  }

  viewFile(file) {
    if (window.appNotepad) {
      window.appNotepad.open(file.name, file.content, ['My Computer', 'C:', 'My Documents']);
    } else {
      window.winManager.openDialog({
        title: file.name,
        icon: 'notepad',
        message: `<pre style="font-family:monospace; max-height:200px; overflow:auto;">${file.content}</pre>`
      });
    }
  }

  extractFiles(win, archive) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    // Write files into VFS
    if (window.vfs) {
      archive.files.forEach(f => {
        window.vfs.writeFile(['My Computer', 'C:', 'My Documents'], f.name, f.content, 'notepad');
      });
    }

    if (window.soundSys) window.soundSys.playDing();

    window.winManager.openDialog({
      title: t('winrar.extractTitle'),
      icon: 'winrar',
      message: t('winrar.extractSuccess', archive.files.length, archive.name)
    });
  }

  showEvaluationNag(win) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    if (window.soundSys) window.soundSys.playDing();

    const nagContent = document.createElement('div');
    nagContent.style.padding = '12px 14px';
    nagContent.style.fontSize = '11px';
    nagContent.style.display = 'flex';
    nagContent.style.flexDirection = 'column';
    nagContent.style.gap = '10px';

    nagContent.innerHTML = `
      <div style="display:flex; gap:12px; align-items:flex-start;">
        <div style="width:36px; height:36px; flex-shrink:0;">${window.getIcon ? window.getIcon('winrar', 36) : '📦'}</div>
        <div style="line-height:1.4;">
          ${t('winrar.nagText')}
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:6px;">
        <button class="win-btn" id="btn-rar-buy" style="font-weight:bold; min-width:110px;">${t('winrar.buyOnline')}</button>
        <button class="win-btn" id="btn-rar-close-nag" style="min-width:75px;">${t('win.close')}</button>
      </div>
    `;

    const nagWin = window.winManager.createWindow({
      id: 'app_winrar_nag',
      title: t('winrar.nagTitle'),
      icon: 'winrar',
      width: 420,
      height: 180,
      resizable: false,
      content: nagContent
    });

    const btnBuy = nagWin.element.querySelector('#btn-rar-buy');
    btnBuy.addEventListener('click', () => {
      if (nagWin.close) nagWin.close();
      if (window.appIE) window.appIE.open('http://www.softstore98.com');
    });

    const btnClose = nagWin.element.querySelector('#btn-rar-close-nag');
    btnClose.addEventListener('click', () => {
      if (nagWin.close) nagWin.close();
    });
  }
}

window.appWinRAR = new AppWinRAR();
