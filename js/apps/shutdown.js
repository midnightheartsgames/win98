class AppShutdown {
  constructor() {
    this.shutdownScreen = document.getElementById('shutdown-screen');
    this.dosScreen = document.getElementById('dos-screen');
  }

  openDialog() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '320px';

    content.innerHTML = `
      <div class="win-dialog-message-row" style="align-items:flex-start;">
        <div class="win-dialog-icon">${Icons['shut-down']}</div>
        <div style="flex:1;">
          <p style="font-weight:bold; margin-bottom:8px;">${t('shutdown.question')}</p>
          <div class="win-label-row">
            <input type="radio" id="sd-opt-shutdown" name="shutdown-opt" value="shutdown" checked>
            <label for="sd-opt-shutdown">${t('shutdown.optShutdown')}</label>
          </div>
          <div class="win-label-row">
            <input type="radio" id="sd-opt-restart" name="shutdown-opt" value="restart">
            <label for="sd-opt-restart">${t('shutdown.optRestart')}</label>
          </div>
          <div class="win-label-row">
            <input type="radio" id="sd-opt-dos" name="shutdown-opt" value="dos">
            <label for="sd-opt-dos">${t('shutdown.optDos')}</label>
          </div>
          <div class="win-label-row">
            <input type="radio" id="sd-opt-bios" name="shutdown-opt" value="bios">
            <label for="sd-opt-bios">${t('shutdown.optBios') || 'Перезагрузить в режим настройки BIOS'}</label>
          </div>
        </div>
      </div>

      <div class="win-dialog-buttons" style="margin-top:12px;">
        <button class="win-btn btn-sd-ok" style="font-weight:bold;">${t('btn.ok')}</button>
        <button class="win-btn btn-sd-cancel">${t('btn.cancel')}</button>
        <button class="win-btn btn-sd-help">${t('btn.help')}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_shutdown_dialog',
      title: t('shutdown.title'),
      icon: 'shut-down',
      width: 350,
      height: 200,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content,
      onClose: () => {
        if (!this.proceeding) this.hideDimOverlay();
      }
    });

    this.proceeding = false;
    this.showDimOverlay();
    const el = dialog.element;
    el.classList.add('shutdown-modal');
    if (window.appClippy && window.appClippy.onShutdownDialog) window.appClippy.onShutdownDialog();
    const btnOk = el.querySelector('.btn-sd-ok');
    const btnCancel = el.querySelector('.btn-sd-cancel');
    const btnHelp = el.querySelector('.btn-sd-help');

    btnCancel.addEventListener('click', () => {
      window.winManager.closeWindow('app_shutdown_dialog');
    });

    btnHelp.addEventListener('click', () => {
      const helpDialog = window.winManager.openDialog({
        title: t('start.help'),
        icon: 'help',
        message: t('shutdown.helpText')
      });
      if (helpDialog && helpDialog.element) helpDialog.element.classList.add('shutdown-modal');
    });

    btnOk.addEventListener('click', () => {
      const selected = el.querySelector('input[name="shutdown-opt"]:checked').value;
      this.proceeding = true;
      window.winManager.closeWindow('app_shutdown_dialog');
      this.proceeding = false;
      this.executeAction(selected);
    });
  }

  executeAction(action) {
    this.runShutdownSequence(() => {
      if (action === 'shutdown') {
        this.triggerSafeToTurnOff();
      } else if (action === 'restart') {
        this.triggerRestart(false);
      } else if (action === 'bios') {
        this.triggerRestart(true);
      } else if (action === 'dos') {
        this.triggerDosMode();
      }
    });
  }

  showDimOverlay() {
    if (!this.dimOverlay) {
      this.dimOverlay = document.createElement('div');
      this.dimOverlay.id = 'shutdown-dim';
      document.body.appendChild(this.dimOverlay);
    }
    this.dimOverlay.classList.add('active');
  }

  hideDimOverlay() {
    if (this.dimOverlay) this.dimOverlay.classList.remove('active');
  }

  ensureWaitScreen() {
    if (this.waitScreen) return this.waitScreen;
    const screen = document.createElement('div');
    screen.id = 'shutdown-wait-screen';
    screen.innerHTML = `
      <canvas class="boot-sky" width="320" height="240"></canvas>
      <div class="boot-logo">
        <svg class="boot-flag" viewBox="0 -6 120 100" aria-hidden="true"></svg>
        <div class="boot-wordmark">
          <div class="boot-ms">Microslop<sup>&reg;</sup></div>
          <div class="boot-win">Win<span class="boot-98">98</span></div>
          <div class="boot-se">Second Edition</div>
        </div>
      </div>
      <div class="shutdown-wait-text"></div>
    `;
    document.body.appendChild(screen);
    if (typeof drawBootSky === 'function') drawBootSky(screen.querySelector('.boot-sky'));
    if (typeof drawBootFlag === 'function') drawBootFlag(screen.querySelector('.boot-flag'));
    this.waitScreen = screen;
    return screen;
  }

  runShutdownSequence(onDone) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    this.showDimOverlay();
    document.body.classList.add('win-shutting-down');

    setTimeout(() => {
      if (window.soundSys) window.soundSys.playShutdown();
    }, 350);

    setTimeout(() => {
      const screen = this.ensureWaitScreen();
      screen.querySelector('.shutdown-wait-text').textContent = t('shutdown.waitText');
      screen.classList.add('active');
      this.hideDimOverlay();
      this.resetSession();
    }, 1600);

    setTimeout(() => {
      this.waitScreen.classList.remove('active');
      document.body.classList.remove('win-shutting-down');
      onDone();
    }, 4800);
  }

  renderSafeToTurnOff(canvas, text) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const orange = [255, 138, 0];
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.font = 'bold 19px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = [];
    let line = '';
    text.split(/\s+/).forEach(word => {
      const candidate = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(candidate).width > w - 50) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });
    if (line) lines.push(line);

    const lineHeight = 26;
    const top = h / 2 - ((lines.length - 1) * lineHeight) / 2;
    ctx.fillStyle = '#fff';
    lines.forEach((l, i) => ctx.fillText(l, w / 2, top + i * lineHeight));

    const img = ctx.getImageData(0, 0, w, h);
    const px = img.data;
    for (let i = 0; i < px.length; i += 4) {
      const on = px[i] > 110;
      px[i] = on ? orange[0] : 0;
      px[i + 1] = on ? orange[1] : 0;
      px[i + 2] = on ? orange[2] : 0;
      px[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  triggerSafeToTurnOff() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const text = t('shutdown.safeText');

    this.shutdownScreen.innerHTML = `<canvas class="shutdown-safe-canvas" width="320" height="240"></canvas>`;
    const canvas = this.shutdownScreen.querySelector('canvas');
    canvas.setAttribute('aria-label', text);
    canvas.setAttribute('role', 'img');
    this.renderSafeToTurnOff(canvas, text);
    this.shutdownScreen.classList.add('active');

    const powerOn = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.shutdownScreen.removeEventListener('click', powerOn);
      window.removeEventListener('keydown', powerOn, true);
      this.shutdownScreen.classList.remove('active');
      this.shutdownScreen.innerHTML = '';
      setTimeout(() => this.triggerRestart(false), 400);
    };

    setTimeout(() => {
      this.shutdownScreen.addEventListener('click', powerOn);
      window.addEventListener('keydown', powerOn, true);
    }, 600);
  }

  resetSession() {
    if (window.winManager && typeof window.winManager.closeAllWindows === 'function') window.winManager.closeAllWindows();
    if (window.taskbar && typeof window.taskbar.closeStartMenu === 'function') window.taskbar.closeStartMenu();
    if (window.contextMenu) window.contextMenu.hide();
    if (window.appScreensaver && window.appScreensaver.isActive) window.appScreensaver.stop();
    if (window.appClippy && typeof window.appClippy.hideBalloon === 'function') window.appClippy.hideBalloon();
    if (this.dosScreen) this.dosScreen.classList.remove('active');
    if (typeof window.leaveWin98SafeMode === 'function') window.leaveWin98SafeMode();
  }

  triggerRestart(toBios = false) {
    this.resetSession();
    if (toBios && window.biosEngine) {
      window.biosEngine.openSetup();
      return;
    }

    if (window.biosEngine && typeof window.biosEngine.startPost === 'function') {
      window.biosEngine.startPost(() => {
        if (typeof window.launchWindowsBootSequence === 'function') {
          window.launchWindowsBootSequence();
        }
      });
      return;
    }

    const bootScreen = document.getElementById('boot-screen');
    if (bootScreen) {
      bootScreen.style.display = 'flex';
      bootScreen.classList.remove('fade-out');
      setTimeout(() => {
        if (window.soundSys) window.soundSys.playStartup();
        bootScreen.classList.add('fade-out');
        setTimeout(() => {
          bootScreen.style.display = 'none';
        }, 600);
      }, 2000);
    }
  }

  dosText(ruText, enText) {
    return window.i18n && window.i18n.getLanguage() === 'ru' ? ruText : enText;
  }

  triggerDosMode() {
    const tr = (r, e) => this.dosText(r, e);
    this.dosScreen.innerHTML = `
      <div class="dos-output">Microslop(R) Win 98
${tr('(C)Корпорация Microslop 1981-1998.', '(C)Copyright Microslop Corp 1981-1998.')}

${tr("Введите 'help' для получения списка команд.", "Type 'help' for a list of available commands.")}
${tr("Введите 'win' или 'exit' для возврата на рабочий стол Win 98.", "Type 'win' or 'exit' to return to Win 98 desktop.")}
</div>
      <div class="dos-history"></div>
      <div class="dos-input-line">
        <span class="dos-prompt">C:\\WINDOWS&gt;</span>
        <input type="text" class="dos-input" autofocus spellcheck="false">
      </div>
    `;

    this.dosScreen.classList.add('active');

    const input = this.dosScreen.querySelector('.dos-input');
    const history = this.dosScreen.querySelector('.dos-history');

    this.dosScreen.addEventListener('click', () => input.focus());
    input.focus();

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = input.value.trim();
        input.value = '';

        const line = document.createElement('div');
        line.className = 'dos-output';
        line.textContent = `C:\\WINDOWS> ${cmd}`;
        history.appendChild(line);

        const response = this.handleDosCommand(cmd);
        if (response !== null) {
          const respLine = document.createElement('div');
          respLine.className = 'dos-output';
          respLine.innerHTML = response;
          history.appendChild(respLine);
        }

        this.dosScreen.scrollTop = this.dosScreen.scrollHeight;
      }
    });
  }

  handleDosCommand(rawCmd) {
    const tr = (r, e) => this.dosText(r, e);
    const cmd = rawCmd.trim().toLowerCase();
    const parts = rawCmd.trim().split(/\s+/);
    const main = parts[0].toLowerCase();

    if (main === 'win' || main === 'exit') {
      this.dosScreen.classList.remove('active');
      return null;
    }

    if (main === 'cls') {
      const history = this.dosScreen.querySelector('.dos-history');
      if (history) history.innerHTML = '';
      return null;
    }

    if (main === 'ver') {
      return tr('Win 98 [Версия 4.10.1998]', 'Win 98 [Version 4.10.1998]');
    }

    if (main === 'echo') {
      return parts.slice(1).join(' ') || '';
    }

    if (main === 'dir') {
      return `${tr(' Том в устройстве C не имеет метки', ' Volume in drive C has no label.')}
${tr(' Серийный номер тома: 1998-0412', ' Volume Serial Number is 1998-0412')}
${tr(' Содержимое папки C:\\WINDOWS', ' Directory of C:\\WINDOWS')}

.              &lt;DIR&gt;        04-12-98  11:11a
..             &lt;DIR&gt;        04-12-98  11:11a
SYSTEM         &lt;DIR&gt;        04-12-98  11:11a
NOTEPAD  EXE         54,272  04-12-98  11:11a
WIN      INI          1,024  04-12-98  11:11a
README   TXT          2,048  04-12-98  11:11a
${tr('         3 файл(ов)         57,344 байт', '         3 file(s)         57,344 bytes')}
${tr('         3 папок   1,524,891,648 байт свободно', '         3 dir(s)   1,524,891,648 bytes free')}`;
    }

    if (main === 'format' || main === 'reset') {
      setTimeout(() => {
        this.dosScreen.classList.remove('active');
        if (window.appDialogs) {
          window.appDialogs.confirmFactoryReset();
        }
      }, 700);
      return tr('ВНИМАНИЕ! ВСЕ ДАННЫЕ НА ЖЕСТКОМ ДИСКЕ C: БУДУТ УНИЧТОЖЕНЫ!<br>Форматирование диска C:... Запуск восстановления Win 98...', 'WARNING: ALL DATA ON FIXED DISK DRIVE C: WILL BE LOST!<br>Formatting drive C:... Initializing Win 98 system restore...');
    }

    if (main === 'bios' || main === 'setup') {
      this.dosScreen.classList.remove('active');
      if (window.biosEngine) {
        window.biosEngine.openSetup();
      }
      return null;
    }

    if (main === 'help') {
      return tr(`Доступные команды MS-DOS:
  DIR     - Вывод списка файлов и подпапок
  VER     - Вывод версии Win
  ECHO    - Вывод сообщений
  CLS     - Очистка экрана
  BIOS    - Запуск программы настройки Award Modular BIOS
  FORMAT  - Возврат Win 98 к состоянию первого запуска
  RESET   - Возврат Win 98 к состоянию первого запуска
  WIN     - Запуск графической оболочки Win 98 (возврат на рабочий стол)
  EXIT    - Выход из режима MS-DOS и возврат в Win`, `Supported MS-DOS Commands:
  DIR     - Displays a list of files and subdirectories
  VER     - Displays the Win version
  ECHO    - Displays messages
  CLS     - Clears the screen
  BIOS    - Launches Award Modular BIOS CMOS Setup
  FORMAT  - Restores Win 98 to first launch defaults
  RESET   - Restores Win 98 to first launch defaults
  WIN     - Starts Win 98 GUI (returns to desktop)
  EXIT    - Exits MS-DOS mode and returns to Win`);
    }

    if (main === '') return null;

    return tr(`Недопустимая команда или имя файла: "${main}"`, `Bad command or file name: "${main}"`);
  }
}

window.appShutdown = new AppShutdown();
