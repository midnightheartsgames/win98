/**
 * Kaspersky AVP 3.0 Antivirus (AntiViral Toolkit Pro)
 * Real-time filesystem scanner, virus signature checks, quarantine,
 * disinfect actions, and the iconic pig squeal sound alert.
 */
class AppAVP {
  constructor() {
    this.winId = 'app_avp';
    this.isScanning = false;
    this.scanProgress = 0;
    this.scannedCount = 0;
    this.infectedCount = 0;
    this.disinfectedCount = 0;
    this.scanInterval = null;

    // Signature database
    this.virusSignatures = [
      { name: 'Trojan.Win98.TotallyNotAVirus', pattern: /totally_not_a_virus/i, severity: 'High' },
      { name: 'Virus.Win95.CIH.1003 (Chernobyl)', pattern: /cih|chernobyl/i, severity: 'Critical' },
      { name: 'Worm.Win32.Happy99', pattern: /happy99|ska\.exe/i, severity: 'Medium' }
    ];
  }

  open() {
    if (window.winManager && window.winManager.windows.has(this.winId)) {
      window.winManager.bringToTop(this.winId);
      return;
    }

    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;

    const content = document.createElement('div');
    content.className = 'avp-window';
    content.innerHTML = `
      <div class="avp-header">
        <div class="avp-header-icon">${window.getIcon ? window.getIcon('avp', 32) : '🛡️'}</div>
        <div class="avp-header-title">
          <h3>${t('avp.title')}</h3>
          <p>${t('avp.subtitle')}</p>
        </div>
      </div>

      <div class="avp-body">
        <fieldset class="bevel-groove" style="padding:6px 10px;">
          <legend>${t('avp.legendTargets')}</legend>
          <div class="avp-targets-box">
            <label><input type="checkbox" id="avp-chk-mem" checked> ${t('avp.chkMem')}</label>
            <label><input type="checkbox" id="avp-chk-boot" checked> ${t('avp.chkBoot')}</label>
            <label><input type="checkbox" id="avp-chk-c" checked> ${t('avp.chkC')}</label>
            <label><input type="checkbox" id="avp-chk-d"> ${t('avp.chkD')}</label>
          </div>
        </fieldset>

        <div style="font-size:10px; color:#333; margin-top:2px;">${t('avp.scanning')}</div>
        <div class="avp-scan-path" id="avp-scan-path">${t('avp.ready')}</div>

        <div class="avp-progress-wrap">
          <div class="avp-progress-fill" id="avp-prog-bar"></div>
        </div>

        <div class="avp-stats-grid">
          <div class="avp-stat-card">
            <div style="font-size:10px;">${t('avp.statChecked').replace(/: ?$/, '')}</div>
            <div class="avp-stat-val" id="avp-stat-scanned">0</div>
          </div>
          <div class="avp-stat-card">
            <div style="font-size:10px;">${t('avp.statInfected').replace(/: ?$/, '')}</div>
            <div class="avp-stat-val danger" id="avp-stat-infected">0</div>
          </div>
          <div class="avp-stat-card">
            <div style="font-size:10px;">${t('avp.statCleaned').replace(/: ?$/, '')}</div>
            <div class="avp-stat-val success" id="avp-stat-disinfected">0</div>
          </div>
        </div>
      </div>

      <div class="avp-footer-buttons">
        <button class="win-btn" id="btn-avp-start" style="font-weight:bold; min-width:85px;">${t('avp.btnStart')}</button>
        <button class="win-btn" id="btn-avp-stop" disabled style="min-width:75px;">${t('avp.btnStop')}</button>
        <button class="win-btn" id="btn-avp-close" style="min-width:75px;">${t('win.close')}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.winId,
      title: t('avp.windowTitle'),
      icon: 'avp',
      width: 440,
      height: 330,
      resizable: false,
      content,
      onClose: () => this.stopScan()
    });

    const btnStart = win.element.querySelector('#btn-avp-start');
    const btnStop = win.element.querySelector('#btn-avp-stop');
    const btnClose = win.element.querySelector('#btn-avp-close');

    btnStart.addEventListener('click', () => this.startScan(win));
    btnStop.addEventListener('click', () => this.stopScan(win));
    btnClose.addEventListener('click', () => { if (win.close) win.close(); });
  }

  collectFilesToScan() {
    const list = [
      'SYSTEM.BIOS [Memory Region 0x000F0000]',
      'C:\\COMMAND.COM',
      'C:\\AUTOEXEC.BAT',
      'C:\\CONFIG.SYS',
      'C:\\WINDOWS\\SYSTEM\\KERNEL32.DLL',
      'C:\\WINDOWS\\SYSTEM\\USER32.DLL',
      'C:\\WINDOWS\\SYSTEM\\GDI32.DLL',
      'C:\\WINDOWS\\SYSTEM\\COMMCTRL.DLL',
      'C:\\WINDOWS\\SYSTEM\\SHELL32.DLL',
      'C:\\WINDOWS\\WIN.INI',
      'C:\\WINDOWS\\SYSTEM.INI',
      'C:\\WINDOWS\\REGISTRY.DAT',
      'C:\\WINDOWS\\EXPLORER.EXE',
      'C:\\WINDOWS\\TASKBAR.EXE',
      'C:\\WINDOWS\\NOTEPAD.EXE',
      'C:\\WINDOWS\\MSCONFIG.EXE',
      'C:\\WINDOWS\\DXDIAG.EXE',
      'C:\\WINDOWS\\SYSTEM\\SNDSYS.EXE',
      'C:\\Program Files\\Internet Explorer\\IEXPLORE.EXE',
      'C:\\Program Files\\Accessories\\MSPAINT.EXE',
      'C:\\Program Files\\Accessories\\CALC.EXE',
      'C:\\My Documents\\homework.txt',
      'C:\\My Documents\\Welcome.txt',
      'C:\\My Documents\\budget_1998.xls',
      'C:\\My Documents\\doom2_cheats.zip',
      'C:\\Recycle Bin\\totally_not_a_virus.exe',
      'C:\\Downloads\\matrix_screensaver.rar'
    ];

    // Read real Desktop files from VFS if available
    if (window.vfs && window.vfs.getDesktopItems) {
      window.vfs.getDesktopItems().forEach(f => {
        list.push(`C:\\Desktop\\${f.name}`);
      });
    }

    return list;
  }

  startScan(win) {
    if (this.isScanning) return;
    this.isScanning = true;
    this.scannedCount = 0;
    this.infectedCount = 0;
    this.disinfectedCount = 0;

    const btnStart = win && win.element ? win.element.querySelector('#btn-avp-start') : null;
    const btnStop = win && win.element ? win.element.querySelector('#btn-avp-stop') : null;
    if (btnStart) btnStart.disabled = true;
    if (btnStop) btnStop.disabled = false;

    const files = this.collectFilesToScan();
    let currentIdx = 0;

    const pathEl = win && win.element ? win.element.querySelector('#avp-scan-path') : null;
    const barEl = win && win.element ? win.element.querySelector('#avp-prog-bar') : null;
    const scannedEl = win && win.element ? win.element.querySelector('#avp-stat-scanned') : null;
    const infectedEl = win && win.element ? win.element.querySelector('#avp-stat-infected') : null;

    this.scanInterval = setInterval(() => {
      if (currentIdx >= files.length) {
        this.finishScan(win);
        return;
      }

      const filePath = files[currentIdx];
      currentIdx++;
      this.scannedCount++;

      const pct = Math.round((currentIdx / files.length) * 100);
      if (pathEl) pathEl.textContent = filePath;
      if (barEl) barEl.style.width = pct + '%';
      if (scannedEl) scannedEl.textContent = this.scannedCount;

      // Virus detection check
      const detected = this.virusSignatures.find(sig => sig.pattern.test(filePath));
      if (detected) {
        this.infectedCount++;
        if (infectedEl) infectedEl.textContent = this.infectedCount;

        // PAUSE SCAN & TRIGGER ICONIC PIG SQUEAL ALERT!
        clearInterval(this.scanInterval);
        this.scanInterval = null;

        if (window.soundSys) {
          window.soundSys.playAvpPigSqueal();
        }

        this.showVirusPrompt(win, detected, filePath, () => {
          // Resume scan after prompt
          this.startScan(win);
        });
      }
    }, 60);
  }

  stopScan(win) {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.isScanning = false;

    if (win && win.element) {
      const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
      const btnStart = win.element.querySelector('#btn-avp-start');
      const btnStop = win.element.querySelector('#btn-avp-stop');
      const pathEl = win.element.querySelector('#avp-scan-path');
      if (btnStart) btnStart.disabled = false;
      if (btnStop) btnStop.disabled = true;
      if (pathEl) pathEl.textContent = t('avp.stopped');
    }
  }

  finishScan(win) {
    this.stopScan(win);
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    if (window.soundSys) window.soundSys.playDing();

    window.winManager.openDialog({
      title: t('avp.doneTitle'),
      icon: 'avp',
      message: t('avp.doneReport', this.scannedCount, this.infectedCount > 0 ? '#c0392b' : '#27ae60', this.infectedCount, this.disinfectedCount)
    });
  }

  showVirusPrompt(parentWin, virus, filePath, onResume) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const modalContent = document.createElement('div');
    modalContent.style.padding = '12px 14px';
    modalContent.style.fontSize = '11px';
    modalContent.style.display = 'flex';
    modalContent.style.flexDirection = 'column';
    modalContent.style.gap = '10px';

    modalContent.innerHTML = `
      <div style="display:flex; gap:12px; align-items:flex-start;">
        <div style="width:36px; height:36px; flex-shrink:0;">${window.getIcon ? window.getIcon('error', 36) : '🚨'}</div>
        <div style="line-height:1.4;">
          <strong style="color:#c0392b; font-size:12px;">${t('avp.alertWarning')}</strong><br><br>
          ${t('avp.alertFile')} <code style="word-break:break-all;">${filePath}</code><br>
          ${t('avp.alertVirus')} <strong style="color:#c0392b;">${virus.name}</strong><br>
          ${t('avp.alertThreat')} <strong>${virus.severity}</strong>
        </div>
      </div>

      <fieldset class="bevel-groove" style="padding:6px 8px;">
        <legend>${t('avp.actionRecommended')}</legend>
        <div style="display:flex; flex-direction:column; gap:4px;">
          <label><input type="radio" name="avp-action" value="disinfect" checked> ${t('avp.actionDisinfect')}</label>
          <label><input type="radio" name="avp-action" value="delete"> ${t('avp.actionDelete')}</label>
          <label><input type="radio" name="avp-action" value="quarantine"> ${t('avp.actionQuarantine')}</label>
          <label><input type="radio" name="avp-action" value="ignore"> ${t('avp.actionIgnore')}</label>
        </div>
      </fieldset>

      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button class="win-btn" id="btn-avp-action-apply" style="font-weight:bold; min-width:85px;">${t('btn.apply')}</button>
      </div>
    `;

    const modalWin = window.winManager.createWindow({
      id: 'app_avp_alert',
      title: t('avp.alertTitle'),
      icon: 'avp',
      width: 420,
      height: 250,
      resizable: false,
      content: modalContent
    });

    const btnApply = modalWin.element.querySelector('#btn-avp-action-apply');
    btnApply.addEventListener('click', () => {
      const selected = modalWin.element.querySelector('input[name="avp-action"]:checked').value;

      if (selected === 'delete' || selected === 'disinfect' || selected === 'quarantine') {
        this.disinfectedCount++;
        const disEl = parentWin.element.querySelector('#avp-stat-disinfected');
        if (disEl) disEl.textContent = this.disinfectedCount;

        // If file was totally_not_a_virus.exe, remove from VFS
        if (window.vfs && filePath.includes('totally_not_a_virus')) {
          try {
            window.vfs.deleteFile(['My Computer', 'C:', 'WINDOWS'], 'totally_not_a_virus.exe');
          } catch (e) {}
        }
      }

      if (modalWin.close) modalWin.close();
      if (onResume) onResume();
    });
  }
}

window.appAVP = new AppAVP();
