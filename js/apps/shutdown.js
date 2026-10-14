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

  triggerRestart(toBios = false) {
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

  triggerDosMode() {
    this.dosScreen.innerHTML = `
      <div class="dos-output">Microslop(R) Win 98
(C)Copyright Microslop Corp 1981-1998.

Type 'help' for a list of available commands.
Type 'win' or 'exit' to return to Win 98 desktop.
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
      return 'Win 98 [Version 4.10.1998]';
    }

    if (main === 'echo') {
      return parts.slice(1).join(' ') || '';
    }

    if (main === 'dir') {
      return ` Volume in drive C has no label.
 Volume Serial Number is 1998-0412
 Directory of C:\\WINDOWS

.              &lt;DIR&gt;        04-12-98  11:11a
..             &lt;DIR&gt;        04-12-98  11:11a
SYSTEM         &lt;DIR&gt;        04-12-98  11:11a
NOTEPAD  EXE         54,272  04-12-98  11:11a
WIN      INI          1,024  04-12-98  11:11a
README   TXT          2,048  04-12-98  11:11a
         3 file(s)         57,344 bytes
         3 dir(s)   1,524,891,648 bytes free`;
    }

    if (main === 'format' || main === 'reset') {
      setTimeout(() => {
        this.dosScreen.classList.remove('active');
        if (window.appDialogs) {
          window.appDialogs.confirmFactoryReset();
        }
      }, 700);
      return 'WARNING: ALL DATA ON FIXED DISK DRIVE C: WILL BE LOST!<br>Formatting drive C:... Initializing Win 98 system restore...';
    }

    if (main === 'bios' || main === 'setup') {
      this.dosScreen.classList.remove('active');
      if (window.biosEngine) {
        window.biosEngine.openSetup();
      }
      return null;
    }

    if (main === 'help') {
      return `Supported MS-DOS Commands:
  DIR     - Displays a list of files and subdirectories
  VER     - Displays the Win version
  ECHO    - Displays messages
  CLS     - Clears the screen
  BIOS    - Launches Award Modular BIOS CMOS Setup
  FORMAT  - Restores Win 98 to first launch defaults
  RESET   - Restores Win 98 to first launch defaults
  WIN     - Starts Win 98 GUI (returns to desktop)
  EXIT    - Exits MS-DOS mode and returns to Win`;
    }

    if (main === '') return null;

    return `Bad command or file name: "${main}"`;
  }
}

window.appShutdown = new AppShutdown();
