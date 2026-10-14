/**
 * Win 98 System Tools:
 * - MSConfig (System Configuration Utility)
 * - DxDiag (DirectX Diagnostic Tool)
 * - SysEdit (System Configuration Editor - MDI)
 * - CharMap (Character Map)
 * - ScanDisk (Drive Check)
 * - SndVol32 (Volume Control Mixer)
 * - CleanMgr (Disk Cleanup)
 * - Windowed MS-DOS Prompt (COMMAND.COM)
 */

class AppSysTools {
  constructor() {}

  t(k, ...args) {
    return window.i18n ? window.i18n.t(k, ...args) : k;
  }

  openMSConfig() {
    if (window.winManager && window.winManager.windows.has('app_msconfig')) {
      window.winManager.bringToTop('app_msconfig');
      return;
    }

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '420px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';

    const startupItems = [
      { name: 'ScanRegistry', cmd: 'C:\\WINDOWS\\scanregw.exe /autorun', checked: true },
      { name: 'Taskbar', cmd: 'C:\\WINDOWS\\taskbar.exe', checked: true },
      { name: 'SystemAudio', cmd: 'C:\\WINDOWS\\SYSTEM\\sndsys.exe', checked: true },
      { name: 'ClippyOffice', cmd: 'C:\\Program Files\\Microslop Office\\clippy.exe', checked: true },
      { name: 'ICQ98a', cmd: '"C:\\Program Files\\ICQ\\icq.exe" /autostart', checked: true },
      { name: 'WinampAgent', cmd: '"C:\\Program Files\\Winamp\\winampa.exe"', checked: true }
    ];

    content.innerHTML = `
      <div style="display:flex; border-bottom:1px solid #808080; margin-bottom:8px;">
        <button class="win-tab-btn active" data-tab="tab-msc-general" style="padding:3px 10px; font-weight:bold; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:var(--win-bg);">${this.t('msconfig.tabGeneral')}</button>
        <button class="win-tab-btn" data-tab="tab-msc-startup" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${this.t('msconfig.tabStartup')}</button>
      </div>

      <div class="msc-tab-content" id="tab-msc-general" style="display:block;">
        <fieldset class="bevel-groove" style="padding:8px 10px; font-size:11px;">
          <legend>${isRu ? 'Выбор варианта запуска' : 'Startup selection'}</legend>
          <div class="win-label-row" style="margin-bottom:6px;">
            <input type="radio" id="msc-opt-normal" name="msc-mode" value="normal" checked>
            <label for="msc-opt-normal">${this.t('msconfig.normalStartup')}</label>
          </div>
          <div class="win-label-row" style="margin-bottom:6px;">
            <input type="radio" id="msc-opt-diag" name="msc-mode" value="diag">
            <label for="msc-opt-diag">${this.t('msconfig.diagnosticStartup')}</label>
          </div>
          <div class="win-label-row" style="margin-bottom:6px;">
            <input type="radio" id="msc-opt-sel" name="msc-mode" value="selective">
            <label for="msc-opt-sel">${this.t('msconfig.selectiveStartup')}</label>
          </div>
          <div style="margin-left:22px; display:flex; flex-direction:column; gap:4px; font-size:11px; color:#444;">
            <label><input type="checkbox" checked> ${isRu ? 'Обрабатывать файл Config.sys' : 'Process Config.sys file'}</label>
            <label><input type="checkbox" checked> ${isRu ? 'Обрабатывать файл Autoexec.bat' : 'Process Autoexec.bat file'}</label>
            <label><input type="checkbox" checked> ${isRu ? 'Обрабатывать файл System.ini' : 'Process System.ini file'}</label>
            <label><input type="checkbox" checked> ${isRu ? 'Обрабатывать файл Win.ini' : 'Process Win.ini file'}</label>
            <label><input type="checkbox" checked> ${isRu ? 'Загружать элементы автозагрузки' : 'Load startup group items'}</label>
          </div>
        </fieldset>
      </div>

      <div class="msc-tab-content" id="tab-msc-startup" style="display:none;">
        <div style="font-size:11px; margin-bottom:4px;">${isRu ? 'Программы, запускаемые автоматически при старте Win:' : 'Select the check box to enable a startup item:'}</div>
        <div class="msconfig-startup-list">
          ${startupItems.map(item => `
            <div class="msconfig-startup-item" data-name="${item.name}">
              <input type="checkbox" ${item.checked ? 'checked' : ''}>
              <div style="font-weight:bold; min-width:90px;">${item.name}</div>
              <div style="color:#555; font-size:10px;">${item.cmd}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="win-dialog-buttons" style="margin-top:12px; display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn btn-msc-ok" style="font-weight:bold; min-width:70px;">${this.t('btn.ok')}</button>
        <button class="win-btn btn-msc-cancel" style="min-width:70px;">${this.t('btn.cancel')}</button>
        <button class="win-btn btn-msc-apply" style="min-width:70px;">${this.t('btn.apply')}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_msconfig',
      title: this.t('msconfig.title'),
      icon: 'msconfig',
      width: 440,
      height: 350,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = dialog.element;

    el.querySelectorAll('.win-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        el.querySelectorAll('.win-tab-btn').forEach(b => {
          b.style.background = '#d4d0c8';
          b.style.fontWeight = 'normal';
        });
        tabBtn.style.background = 'var(--win-bg)';
        tabBtn.style.fontWeight = 'bold';

        el.querySelectorAll('.msc-tab-content').forEach(tc => tc.style.display = 'none');
        const target = el.querySelector(`#${tabBtn.dataset.tab}`);
        if (target) target.style.display = 'block';
      });
    });

    const saveControls = window.winManager.rememberControls(el, 'msconfig');
    const clippyBox = el.querySelector('.msconfig-startup-item[data-name="ClippyOffice"] input');
    if (clippyBox && window.clippyOptions) clippyBox.checked = window.clippyOptions.get('enabled') !== false;
    const saveClippy = () => {
      if (!clippyBox || !window.clippyOptions || clippyBox.checked === (window.clippyOptions.get('enabled') !== false)) return;
      if (window.appClippy) window.appClippy.setEnabled(clippyBox.checked, 'msconfig');
      else window.clippyOptions.set('enabled', clippyBox.checked);
    };

    const promptRestart = () => {
      saveControls();
      saveClippy();
      window.winManager.closeWindow('app_msconfig');
      window.winManager.openDialog({
        title: isRu ? 'Настройка системы' : 'System Configuration',
        icon: 'warning',
        message: `${isRu ? 'Для того чтобы изменения вступили в силу, необходимо перезагрузить компьютер.<br><br>Перезагрузить компьютер сейчас?' : 'You must restart your computer for the changes to take effect.<br><br>Restart now?'}`,
        buttons: [
          {
            text: isRu ? 'Да' : 'Yes',
            primary: true,
            action: () => {
              if (window.appShutdown) window.appShutdown.triggerRestart();
            }
          },
          {
            text: isRu ? 'Нет' : 'No',
            action: () => {}
          }
        ]
      });
    };

    el.querySelector('.btn-msc-ok').addEventListener('click', promptRestart);
    el.querySelector('.btn-msc-apply').addEventListener('click', () => {
      if (window.soundSys) window.soundSys.playClick();
      saveControls();
      saveClippy();
    });
    el.querySelector('.btn-msc-cancel').addEventListener('click', () => {
      window.winManager.closeWindow('app_msconfig');
    });
  }

  // ==========================================================
  // 2. DirectX Diagnostic Tool (dxdiag)
  // ==========================================================
  openDxDiag() {
    if (window.winManager && window.winManager.windows.has('app_dxdiag')) {
      window.winManager.bringToTop('app_dxdiag');
      return;
    }

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '440px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';

    content.innerHTML = `
      <!-- Property Sheet Tab Strip -->
      <div style="display:flex; border-bottom:1px solid #808080; margin-bottom:8px;">
        <button class="win-tab-btn active" data-tab="tab-dx-sys" style="padding:3px 10px; font-weight:bold; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:var(--win-bg);">${this.t('dxdiag.tabSystem')}</button>
        <button class="win-tab-btn" data-tab="tab-dx-disp" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${this.t('dxdiag.tabDisplay')}</button>
        <button class="win-tab-btn" data-tab="tab-dx-sound" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${this.t('dxdiag.tabSound')}</button>
      </div>

      <!-- Tab 1: System -->
      <div class="dx-tab-content" id="tab-dx-sys" style="display:block;">
        <div style="display:flex; gap:12px; align-items:center; margin-bottom:8px;">
          <div style="width:36px; height:36px; flex-shrink:0;">${Icons['dxdiag']}</div>
          <div style="font-size:11px;">
            ${isRu ? 'Это средство предназначено для проверки компонентов DirectX и драйверов системы.' : 'This tool reports detailed information about the DirectX components and drivers on your system.'}
          </div>
        </div>
        <fieldset class="bevel-groove" style="padding:8px 10px;">
          <legend>${isRu ? 'Сведения о системе' : 'System Information'}</legend>
          <table class="dxdiag-info-table">
            <tr><td class="dxdiag-info-label">${isRu ? 'Дата и время:' : 'Current Date/Time:'}</td><td class="dxdiag-info-val">${new Date().toLocaleString()}</td></tr>
            <tr><td class="dxdiag-info-label">${isRu ? 'Имя компьютера:' : 'Computer Name:'}</td><td class="dxdiag-info-val">CYBERDECK98</td></tr>
            <tr><td class="dxdiag-info-label">${isRu ? 'Операционная система:' : 'Operating System:'}</td><td class="dxdiag-info-val">Win 98 Second Edition (4.10.1998)</td></tr>
            <tr><td class="dxdiag-info-label">${isRu ? 'Процессор:' : 'Processor:'}</td><td class="dxdiag-info-val">Intel Pentium II MMX, ~450MHz</td></tr>
            <tr><td class="dxdiag-info-label">${isRu ? 'Память:' : 'Memory:'}</td><td class="dxdiag-info-val">64MB RAM</td></tr>
            <tr><td class="dxdiag-info-label">DirectX:</td><td class="dxdiag-info-val" style="color:#000080;">DirectX 6.1a (4.06.02.0436)</td></tr>
          </table>
        </fieldset>
      </div>

      <!-- Tab 2: Display -->
      <div class="dx-tab-content" id="tab-dx-disp" style="display:none;">
        <div style="display:flex; gap:10px;">
          <fieldset class="bevel-groove" style="flex:1; padding:6px 8px; font-size:11px;">
            <legend>${isRu ? 'Устройство' : 'Device'}</legend>
            <div style="line-height:1.4;">
              <strong>3dfx Voodoo2 3Dfx Accelerator</strong><br>
              <span style="color:#555;">${isRu ? 'Изготовитель: 3dfx Interactive<br>Память: 12.0 MB<br>Режим: 1024 x 768 (16 bit, 85Hz)' : 'Manufacturer: 3dfx Interactive<br>Memory: 12.0 MB<br>Mode: 1024 x 768 (16 bit, 85Hz)'}</span>
            </div>
          </fieldset>
          <fieldset class="bevel-groove" style="width:170px; padding:6px 8px; font-size:11px;">
            <legend>${isRu ? 'Возможности DirectX' : 'DirectX Features'}</legend>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <button class="win-btn" id="btn-dx-test-draw" style="font-size:10px;">${this.t('dxdiag.testDDraw')}</button>
              <button class="win-btn" id="btn-dx-test-3d" style="font-size:10px; font-weight:bold;">${this.t('dxdiag.testD3D')}</button>
            </div>
          </fieldset>
        </div>

        <!-- 3D Canvas Test Area -->
        <fieldset class="bevel-groove" style="margin-top:8px; padding:6px;">
          <legend>${isRu ? 'Интерактивный тест Direct3D' : 'Direct3D Interactive Test'}</legend>
          <div class="dxdiag-3d-viewport">
            <canvas id="dx-cube-canvas" width="180" height="120"></canvas>
          </div>
          <div style="text-align:center; font-size:10px; color:#555;" id="dx-status-text">
            ${isRu ? 'Нажмите «Проверить Direct3D» для запуска 3D-куба' : 'Click "Test Direct3D" to spin the 3D cube'}
          </div>
        </fieldset>
      </div>

      <!-- Tab 3: Sound -->
      <div class="dx-tab-content" id="tab-dx-sound" style="display:none;">
        <fieldset class="bevel-groove" style="padding:8px 10px; font-size:11px;">
          <legend>${isRu ? 'Звуковое устройство' : 'Device'}</legend>
          <table class="dxdiag-info-table">
            <tr><td class="dxdiag-info-label">${isRu ? 'Устройство:' : 'Device:'}</td><td class="dxdiag-info-val">Creative Sound Blaster AWE64 Gold</td></tr>
            <tr><td class="dxdiag-info-label">${isRu ? 'Драйвер:' : 'Driver:'}</td><td class="dxdiag-info-val">sbawe64.vxd (Version 4.10.1998)</td></tr>
            <tr><td class="dxdiag-info-label">${isRu ? 'Аппаратное ускорение:' : 'Acceleration:'}</td><td class="dxdiag-info-val">${isRu ? 'Полное (Full Acceleration)' : 'Full Acceleration'}</td></tr>
          </table>
          <div style="margin-top:12px; display:flex; justify-content:center;">
            <button class="win-btn" id="btn-dx-test-sound" style="min-width:140px; font-weight:bold;">${this.t('dxdiag.testDSound')}</button>
          </div>
          <div style="text-align:center; font-size:10px; color:#555; margin-top:6px;" id="dx-sound-status">
            ${isRu ? 'Воспроизводит аппаратный тестовый синусоидальный тон' : 'Plays a hardware sine test tone'}
          </div>
        </fieldset>
      </div>

      <!-- Bottom Buttons -->
      <div class="win-dialog-buttons" style="margin-top:12px; display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn btn-dx-exit" style="font-weight:bold; min-width:70px;">${isRu ? 'Выход' : 'Exit'}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_dxdiag',
      title: this.t('dxdiag.title'),
      icon: 'dxdiag',
      width: 470,
      height: 380,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = dialog.element;

    el.querySelectorAll('.win-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        el.querySelectorAll('.win-tab-btn').forEach(b => {
          b.style.background = '#d4d0c8';
          b.style.fontWeight = 'normal';
        });
        tabBtn.style.background = 'var(--win-bg)';
        tabBtn.style.fontWeight = 'bold';

        el.querySelectorAll('.dx-tab-content').forEach(tc => tc.style.display = 'none');
        const target = el.querySelector(`#${tabBtn.dataset.tab}`);
        if (target) target.style.display = 'block';
      });
    });

    // 3D Spinning Cube on Canvas
    const canvas = el.querySelector('#dx-cube-canvas');
    const ctx = canvas.getContext('2d');
    const statusText = el.querySelector('#dx-status-text');

    let is3dRunning = false;
    let animId = null;
    let rotX = 0, rotY = 0;

    const vertices = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1,  1], [1, -1,  1], [1, 1,  1], [-1, 1,  1]
    ];

    const edges = [
      [0,1], [1,2], [2,3], [3,0],
      [4,5], [5,6], [6,7], [7,4],
      [0,4], [1,5], [2,6], [3,7]
    ];

    const drawCube = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 180, 120);

      rotX += 0.03;
      rotY += 0.04;

      const projected = [];
      const fov = 100;
      const cx = 90, cy = 60;

      for (let i = 0; i < vertices.length; i++) {
        const [x, y, z] = vertices[i];

        // Rotate Y
        const x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
        const z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);

        // Rotate X
        const y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        const z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX) + 3.2;

        const px = (x1 / z2) * fov + cx;
        const py = (y2 / z2) * fov + cy;
        projected.push([px, py]);
      }

      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1.5;

      edges.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(projected[i][0], projected[i][1]);
        ctx.lineTo(projected[j][0], projected[j][1]);
        ctx.stroke();
      });

      // Draw DirectX logo in center
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Direct3D 98', cx, cy + 3);

      if (is3dRunning) {
        animId = requestAnimationFrame(drawCube);
      }
    };

    el.querySelector('#btn-dx-test-3d').addEventListener('click', () => {
      is3dRunning = !is3dRunning;
      if (is3dRunning) {
        statusText.textContent = isRu ? 'Тест Direct3D успешно выполняется (60 FPS)' : 'Direct3D test running successfully (60 FPS)';
        statusText.style.color = '#008000';
        drawCube();
      } else {
        cancelAnimationFrame(animId);
        statusText.textContent = isRu ? 'Тест остановлен' : 'Test stopped';
        statusText.style.color = '#555';
      }
    });

    el.querySelector('#btn-dx-test-draw').addEventListener('click', () => {
      window.winManager.openDialog({
        title: 'DirectDraw Test',
        icon: 'info',
        message: isRu ? 'Тест DirectDraw: Все проверки поверхности и блиттинга завершились успешно.' : 'DirectDraw Test: All surface and blitting tests completed with no errors.'
      });
    });

    el.querySelector('#btn-dx-test-sound').addEventListener('click', () => {
      if (window.soundSys) {
        window.soundSys.playTestTone(880, 0.4);
        setTimeout(() => window.soundSys.playTestTone(440, 0.5), 450);
      }
      const soundStatus = el.querySelector('#dx-sound-status');
      soundStatus.textContent = isRu ? 'Тестовый звуковой сигнал успешно воспроизведен!' : 'Test tone played successfully!';
      soundStatus.style.color = '#008000';
    });

    const closeHandler = () => {
      is3dRunning = false;
      if (animId) cancelAnimationFrame(animId);
      window.winManager.closeWindow('app_dxdiag');
    };

    el.querySelector('.btn-dx-exit').addEventListener('click', closeHandler);
  }

  // ==========================================================
  // 3. SysEdit (sysedit)
  // ==========================================================
  openSysEdit() {
    if (window.winManager && window.winManager.windows.has('app_sysedit')) {
      window.winManager.bringToTop('app_sysedit');
      return;
    }

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '520px';
    content.style.height = '420px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.padding = '4px';

    const files = [
      {
        title: 'C:\\WINDOWS\\SYSTEM.INI',
        content: `[boot]\r\nshell=Explorer.exe\r\nsystem.drv=system.drv\r\ndrivers=mmsystem.dll\r\nuser.exe=user.exe\r\ngdi.exe=gdi.exe\r\nsound.drv=mmsound.drv\r\n\r\n[386Enh]\r\nebios=*ebios\r\nmouse=*vmouse\r\ndevice=*dynapage\r\ndevice=*vcd\r\nnetwork=*vnetbios\r\n\r\n[drivers32]\r\nmsacm.msg711=msg711.acm\r\nvidc.cvid=iccvid.dll`,
        top: 20,
        left: 20
      },
      {
        title: 'C:\\WINDOWS\\WIN.INI',
        content: `[windows]\r\nload=\r\nrun=\r\nNullPort=None\r\nDeviceNotSelectedTimeout=15\r\nTransmissionRetryTimeout=45\r\n\r\n[Desktop]\r\nPattern=(None)\r\nWallpaper=(None)\r\nTileWallpaper=0\r\n\r\n[Sounds]\r\nSystemDefault=chord.wav`,
        top: 50,
        left: 60
      },
      {
        title: 'C:\\CONFIG.SYS',
        content: `DEVICE=C:\\WINDOWS\\HIMEM.SYS\r\nDEVICE=C:\\WINDOWS\\EMM386.EXE NOEMS\r\nDOS=HIGH,UMB\r\nFILES=40\r\nBUFFERS=30\r\nDEVICEHIGH=C:\\WINDOWS\\COMMAND\\ANSI.SYS`,
        top: 80,
        left: 100
      },
      {
        title: 'C:\\AUTOEXEC.BAT',
        content: `@ECHO OFF\r\nPROMPT $p$g\r\nPATH C:\\WINDOWS;C:\\WINDOWS\\COMMAND;C:\\PROGRA~1\r\nSET TEMP=C:\\TEMP\r\nSET TMP=C:\\TEMP\r\nSET BLASTER=A220 I5 D1 T4\r\nLH SMARTDRV.EXE /X`,
        top: 110,
        left: 140
      }
    ];

    content.innerHTML = `
      <div style="display:flex; gap:6px; margin-bottom:4px; font-size:11px;">
        <button class="win-btn" id="btn-sysedit-save">${isRu ? 'Файл: Сохранить' : 'File: Save'}</button>
        <button class="win-btn" id="btn-sysedit-cascade">${isRu ? 'Окна: Каскадом' : 'Window: Cascade'}</button>
      </div>
      <div class="sysedit-mdi-container" id="sysedit-container">
        ${files.map((f, idx) => `
          <div class="sysedit-subwindow" id="sysedit-sub-${idx}" style="top:${f.top}px; left:${f.left}px; width:280px; height:180px; z-index:${idx + 1};">
            <div class="sysedit-subwindow-title ${idx === files.length - 1 ? '' : 'inactive'}">
              <span>${f.title}</span>
              <span style="font-size:9px; cursor:pointer;">&#x25A1;</span>
            </div>
            <div class="sysedit-subwindow-body">
              <textarea class="sysedit-textarea" spellcheck="false">${f.content}</textarea>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_sysedit',
      title: this.t('sysedit.title'),
      icon: 'sysedit',
      width: 550,
      height: 470,
      resizable: true,
      content
    });

    const el = dialog.element;
    const subwindows = el.querySelectorAll('.sysedit-subwindow');

    subwindows.forEach(sw => {
      sw.addEventListener('mousedown', () => {
        subwindows.forEach(other => {
          other.querySelector('.sysedit-subwindow-title').classList.add('inactive');
        });
        sw.querySelector('.sysedit-subwindow-title').classList.remove('inactive');
        let maxZ = 0;
        subwindows.forEach(s => {
          const z = parseInt(s.style.zIndex) || 1;
          if (z > maxZ) maxZ = z;
        });
        sw.style.zIndex = maxZ + 1;
      });
    });

    el.querySelector('#btn-sysedit-cascade').addEventListener('click', () => {
      files.forEach((f, idx) => {
        const sw = el.querySelector(`#sysedit-sub-${idx}`);
        if (sw) {
          sw.style.top = `${20 + idx * 30}px`;
          sw.style.left = `${20 + idx * 40}px`;
        }
      });
    });

    el.querySelector('#btn-sysedit-save').addEventListener('click', () => {
      if (window.soundSys) window.soundSys.playDing();
      window.winManager.openDialog({
        title: 'SysEdit',
        icon: 'info',
        message: isRu ? 'Все системные файлы конфигурации успешно сохранены.' : 'All configuration files have been saved.'
      });
    });
  }

  // ==========================================================
  // 4. Character Map (charmap)
  // ==========================================================
  openCharMap() {
    if (window.winManager && window.winManager.windows.has('app_charmap')) {
      window.winManager.bringToTop('app_charmap');
      return;
    }

    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '370px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';

    let selectedChar = 'A';

    content.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-size:11px;">
        <label>${this.t('charmap.font')}</label>
        <select id="charmap-font-select" style="flex:1; height:22px; font-size:11px;">
          <option value="'Arial', sans-serif">Arial</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
          <option value="'Courier New', monospace">Courier New</option>
          <option value="sans-serif">Symbol / ANSI</option>
        </select>
      </div>

      <div style="display:flex; gap:8px;">
        <div class="charmap-grid-container" id="charmap-grid"></div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:8px; width:50px;">
          <div class="charmap-magnifier" id="charmap-lens">A</div>
          <div style="font-size:9px; color:#555;" id="charmap-code">U+0041</div>
        </div>
      </div>

      <div style="display:flex; align-items:center; gap:6px; margin-top:10px;">
        <label style="font-size:11px;">${this.t('charmap.charToCopy')}</label>
        <input type="text" id="charmap-copy-input" style="flex:1; height:22px; font-size:12px;">
        <button class="win-btn" id="btn-charmap-select" style="min-width:65px;">${this.t('charmap.select')}</button>
        <button class="win-btn" id="btn-charmap-copy" style="min-width:65px; font-weight:bold;">${this.t('charmap.copy')}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_charmap',
      title: this.t('charmap.title'),
      icon: 'charmap',
      width: 390,
      height: 310,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = dialog.element;
    const gridEl = el.querySelector('#charmap-grid');
    const lensEl = el.querySelector('#charmap-lens');
    const codeEl = el.querySelector('#charmap-code');
    const copyInput = el.querySelector('#charmap-copy-input');
    const fontSelect = el.querySelector('#charmap-font-select');

    const renderGrid = () => {
      gridEl.innerHTML = '';
      gridEl.style.fontFamily = fontSelect.value;
      lensEl.style.fontFamily = fontSelect.value;

      // Render standard 32..255 characters
      for (let i = 32; i <= 255; i++) {
        const char = String.fromCharCode(i);
        const cell = document.createElement('div');
        cell.className = 'charmap-cell' + (char === selectedChar ? ' selected' : '');
        cell.textContent = char;

        cell.addEventListener('click', () => {
          el.querySelectorAll('.charmap-cell').forEach(c => c.classList.remove('selected'));
          cell.classList.add('selected');
          selectedChar = char;
          lensEl.textContent = char;
          codeEl.textContent = 'U+' + i.toString(16).toUpperCase().padStart(4, '0');
        });

        gridEl.appendChild(cell);
      }
    };

    fontSelect.addEventListener('change', renderGrid);
    renderGrid();

    el.querySelector('#btn-charmap-select').addEventListener('click', () => {
      copyInput.value += selectedChar;
    });

    el.querySelector('#btn-charmap-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(copyInput.value);
      if (window.soundSys) window.soundSys.playClick();
    });
  }

  // ==========================================================
  // 5. ScanDisk (scandisk)
  // ==========================================================
  openScanDisk() {
    if (window.winManager && window.winManager.windows.has('app_scandisk')) {
      window.winManager.bringToTop('app_scandisk');
      return;
    }

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '390px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';

    content.innerHTML = `
      <div style="font-size:11px; margin-bottom:4px;">${this.t('scandisk.selectDrive')}</div>
      <div style="display:flex; gap:8px;">
        <select id="scandisk-drive" style="width:130px; height:24px; font-size:11px;">
          <option value="C:">(C:) [FAT32 12.4GB]</option>
          <option value="D:">(D:) [CD-ROM 650MB]</option>
        </select>
        <div style="flex:1;">
          <fieldset class="bevel-groove" style="padding:6px 8px; font-size:11px;">
            <legend>${isRu ? 'Тип проверки' : 'Type of test'}</legend>
            <div><label><input type="radio" name="sd-type" value="standard" checked> ${this.t('scandisk.typeStandard')}</label></div>
            <div style="margin-top:4px;"><label><input type="radio" name="sd-type" value="thorough"> ${this.t('scandisk.typeThorough')}</label></div>
          </fieldset>
        </div>
      </div>

      <!-- Sector Cluster Map -->
      <div class="scandisk-sector-grid" id="sd-grid"></div>

      <div class="win-label-row">
        <input type="checkbox" id="sd-autofix" checked>
        <label for="sd-autofix" style="font-size:11px;">${this.t('scandisk.autoFix')}</label>
      </div>

      <!-- Progress Bar -->
      <div style="margin-top:8px; border:2px inset #fff; height:18px; background:#fff; position:relative; overflow:hidden;">
        <div id="sd-progress-bar" style="height:100%; width:0%; background:#000080; transition:width 0.1s linear;"></div>
      </div>

      <!-- Bottom Buttons -->
      <div class="win-dialog-buttons" style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:11px; color:#555;" id="sd-status-lbl">${isRu ? 'Готов к проверке' : 'Ready to scan'}</div>
        <div style="display:flex; gap:6px;">
          <button class="win-btn" id="btn-sd-start" style="font-weight:bold; min-width:75px;">${this.t('scandisk.start')}</button>
          <button class="win-btn btn-sd-close" style="min-width:75px;">${isRu ? 'Закрыть' : 'Close'}</button>
        </div>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_scandisk',
      title: this.t('scandisk.title'),
      icon: 'scandisk',
      width: 410,
      height: 350,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = dialog.element;
    const gridEl = el.querySelector('#sd-grid');
    const progressBar = el.querySelector('#sd-progress-bar');
    const statusLbl = el.querySelector('#sd-status-lbl');
    const btnStart = el.querySelector('#btn-sd-start');

    // Create 100 clusters
    const clusters = [];
    for (let i = 0; i < 100; i++) {
      const c = document.createElement('div');
      c.className = 'scandisk-cluster';
      if (i < 5) c.classList.add('system');
      gridEl.appendChild(c);
      clusters.push(c);
    }

    let isScanning = false;
    let scanInterval = null;

    btnStart.addEventListener('click', () => {
      if (isScanning) return;
      isScanning = true;
      btnStart.disabled = true;
      let curr = 0;

      statusLbl.textContent = isRu ? 'Проверка структуры файлов...' : 'Checking file structure...';

      scanInterval = setInterval(() => {
        if (curr >= clusters.length) {
          clearInterval(scanInterval);
          isScanning = false;
          btnStart.disabled = false;
          progressBar.style.width = '100%';
          statusLbl.textContent = isRu ? 'Проверка завершена!' : 'Scan complete!';

          if (window.soundSys) window.soundSys.playDing();

          window.winManager.openDialog({
            title: isRu ? 'Результаты ScanDisk' : 'ScanDisk Results',
            icon: 'info',
            message: `<strong>ScanDisk did not find any errors on drive C:</strong><br><br>
              Total disk space: 13,048,832 KB<br>
              In 3,412 hidden files: 24,576 KB<br>
              In 1,280 directories: 10,240 KB<br>
              In 14,892 user files: 11,489,125 KB<br>
              Available space: 1,524,891 KB`
          });
          return;
        }

        if (curr > 0 && !clusters[curr - 1].classList.contains('system')) {
          clusters[curr - 1].classList.remove('current');
          clusters[curr - 1].classList.add('checked');
        }

        clusters[curr].classList.add('current');
        curr++;
        progressBar.style.width = `${curr}%`;
      }, 35);
    });

    el.querySelector('.btn-sd-close').addEventListener('click', () => {
      if (scanInterval) clearInterval(scanInterval);
      window.winManager.closeWindow('app_scandisk');
    });
  }

  // ==========================================================
  // 6. Volume Control (sndvol32)
  // ==========================================================
  openVolumeControl() {
    if (window.winManager && window.winManager.windows.has('app_sndvol32')) {
      window.winManager.bringToTop('app_sndvol32');
      return;
    }

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.padding = '0';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.height = '100%';
    content.style.overflow = 'hidden';

    const curVol = window.soundSys ? Math.round(window.soundSys.getMasterVolume() * 100) : 80;
    const isMuted = window.soundSys ? window.soundSys.muted : false;

    content.innerHTML = `
      <div style="background:var(--win-bg); border-bottom:1px solid #808080; padding:2px 6px; font-size:11px; user-select:none;">
        <span style="margin-right:12px; cursor:pointer;" id="sndvol-menu-options">${isRu ? 'Параметры' : 'Options'}</span>
        <span style="cursor:pointer;" id="sndvol-menu-help">${isRu ? 'Справка' : 'Help'}</span>
      </div>

      <div class="sndvol-container">
        <!-- Master Volume -->
        <div class="sndvol-channel">
          <div class="sndvol-label">${this.t('sndvol.master')}</div>
          <div style="font-size:9px; color:#555;">${this.t('sndvol.balance')}</div>
          <input type="range" min="0" max="100" value="50" class="sndvol-balance">
          <div class="sndvol-slider-wrap">
            <input type="range" min="0" max="100" value="${curVol}" class="sndvol-slider sndvol-master-slider" id="sndvol-master-slider">
          </div>
          <label style="font-size:10px;"><input type="checkbox" class="sndvol-master-mute" id="sndvol-master-mute"${isMuted ? ' checked' : ''}> ${this.t('sndvol.mute')}</label>
        </div>

        <!-- Wave -->
        <div class="sndvol-channel">
          <div class="sndvol-label">${this.t('sndvol.wave')}</div>
          <div style="font-size:9px; color:#555;">${this.t('sndvol.balance')}</div>
          <input type="range" min="0" max="100" value="50" class="sndvol-balance">
          <div class="sndvol-slider-wrap">
            <input type="range" min="0" max="100" value="85" class="sndvol-slider">
          </div>
          <label style="font-size:10px;"><input type="checkbox"> ${this.t('sndvol.mute')}</label>
        </div>

        <!-- MIDI Synth -->
        <div class="sndvol-channel">
          <div class="sndvol-label">${this.t('sndvol.midi')}</div>
          <div style="font-size:9px; color:#555;">${this.t('sndvol.balance')}</div>
          <input type="range" min="0" max="100" value="50" class="sndvol-balance">
          <div class="sndvol-slider-wrap">
            <input type="range" min="0" max="100" value="75" class="sndvol-slider">
          </div>
          <label style="font-size:10px;"><input type="checkbox"> ${this.t('sndvol.mute')}</label>
        </div>

        <!-- CD Audio -->
        <div class="sndvol-channel">
          <div class="sndvol-label">${this.t('sndvol.cd')}</div>
          <div style="font-size:9px; color:#555;">${this.t('sndvol.balance')}</div>
          <input type="range" min="0" max="100" value="50" class="sndvol-balance">
          <div class="sndvol-slider-wrap">
            <input type="range" min="0" max="100" value="70" class="sndvol-slider">
          </div>
          <label style="font-size:10px;"><input type="checkbox"> ${this.t('sndvol.mute')}</label>
        </div>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_sndvol32',
      title: this.t('sndvol.title'),
      icon: 'volume-mixer',
      width: 350,
      height: 305,
      resizable: false,
      minimizable: true,
      maximizable: false,
      content
    });

    const el = dialog.element;
    const masterSlider = el.querySelector('#sndvol-master-slider');
    const masterMute = el.querySelector('#sndvol-master-mute');

    const saveChannels = window.winManager.rememberControls(el, 'sndvol', '.sndvol-balance, .sndvol-slider:not(.sndvol-master-slider), .sndvol-channel input[type="checkbox"]:not(.sndvol-master-mute)');
    el.querySelector('.sndvol-container').addEventListener('change', saveChannels);

    masterSlider.addEventListener('input', () => {
      const val = parseInt(masterSlider.value) / 100;
      if (window.soundSys) {
        window.soundSys.setMasterVolume(val);
      }
    });

    masterMute.addEventListener('change', () => {
      if (window.soundSys) {
        window.soundSys.setMuted(masterMute.checked);
      }
    });

    const optBtn = el.querySelector('#sndvol-menu-options');
    if (optBtn) {
      optBtn.addEventListener('click', () => {
        if (window.appCPanel) window.appCPanel.openMultimediaProperties();
      });
    }

    const helpBtn = el.querySelector('#sndvol-menu-help');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        if (window.appDialogs) window.appDialogs.openAboutWindows();
      });
    }
  }

  // ==========================================================
  // 7. Disk Cleanup (cleanmgr)
  // ==========================================================
  openCleanMgr() {
    if (window.winManager && window.winManager.windows.has('app_cleanmgr')) {
      window.winManager.bringToTop('app_cleanmgr');
      return;
    }

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '380px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';

    content.innerHTML = `
      <div style="display:flex; gap:12px; align-items:flex-start; margin-bottom:10px;">
        <div style="width:36px; height:36px; flex-shrink:0;">${Icons['cleanmgr']}</div>
        <div style="font-size:11px; line-height:1.4;">
          ${isRu ? 'Программа очистки диска вычисляет объем свободного места, которое можно освободить на диске (C:).' : 'Disk Cleanup is calculating how much space you will be able to free on (C:).'}
        </div>
      </div>

      <fieldset class="bevel-groove" style="padding:8px 10px; font-size:11px;">
        <legend>${isRu ? 'Удалить следующие файлы:' : 'Files to delete:'}</legend>
        <div style="display:flex; flex-direction:column; gap:6px; margin:4px 0;">
          <label><input type="checkbox" checked id="cl-tmp-inet"> Temporary Internet Files (8,412 KB)</label>
          <label><input type="checkbox" checked id="cl-recycle"> ${isRu ? 'Корзина' : 'Recycle Bin'} (6,210 KB)</label>
          <label><input type="checkbox" checked id="cl-tmp"> ${isRu ? 'Временные файлы' : 'Temporary files'} (240 KB)</label>
        </div>
        <div style="margin-top:6px; font-weight:bold;">
          ${isRu ? 'Общий объем освобождаемого места: 14.8 MB' : 'Total amount of disk space you gain: 14.8 MB'}
        </div>
      </fieldset>

      <div class="win-dialog-buttons" style="margin-top:12px; display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn btn-clean-ok" style="font-weight:bold; min-width:70px;">${this.t('btn.ok')}</button>
        <button class="win-btn btn-clean-cancel" style="min-width:70px;">${this.t('btn.cancel')}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_cleanmgr',
      title: isRu ? 'Очистка диска (C:)' : 'Disk Cleanup for (C:)',
      icon: 'cleanmgr',
      width: 400,
      height: 270,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = dialog.element;

    el.querySelector('.btn-clean-ok').addEventListener('click', () => {
      window.winManager.closeWindow('app_cleanmgr');
      if (window.soundSys) window.soundSys.playDing();
      window.winManager.openDialog({
        title: isRu ? 'Очистка диска' : 'Disk Cleanup',
        icon: 'info',
        message: isRu ? 'Очистка диска (C:) успешно завершена. Освобождено 14.8 МБ свободного места.' : 'Disk Cleanup has freed 14.8 MB of disk space on drive (C:).'
      });
    });

    el.querySelector('.btn-clean-cancel').addEventListener('click', () => {
      window.winManager.closeWindow('app_cleanmgr');
    });
  }

  openDosPromptWindow(initialCmd = '') {
    const winId = 'app_dos_prompt_' + Date.now();
    const content = document.createElement('div');
    content.className = 'dosprompt-window-wrap';

    content.innerHTML = `
      <div class="dosprompt-toolbar">
        <button class="dosprompt-tool-btn" id="${winId}_btn_mark" title="${this.t('dosprompt.mark')}"><span>&#x25A2;</span></button>
        <button class="dosprompt-tool-btn" id="${winId}_btn_copy" title="${this.t('dosprompt.copy')}"><span>&#x2398;</span></button>
        <button class="dosprompt-tool-btn" id="${winId}_btn_paste" title="${this.t('dosprompt.paste')}"><span>&#x1F4CB;</span></button>
        <button class="dosprompt-tool-btn" id="${winId}_btn_fullscreen" title="${this.t('dosprompt.fullscreen')}"><span>&#x26F6;</span></button>
        <div style="flex:1;"></div>
        <select style="height:18px; font-size:10px;" id="${winId}_font_select">
          <option value="12px">Auto (8x12)</option>
          <option value="14px">10x14</option>
          <option value="16px">12x16</option>
        </select>
      </div>

      <div class="dosprompt-console-body" id="${winId}_console">
        <div class="dosprompt-line">Microslop(R) Win 98\r\n(C)Copyright Microslop Corp 1981-1998.</div>
        <div class="dosprompt-line" style="margin-bottom:6px;">Type 'help' for commands, 'exit' to close window.</div>
        <div id="${winId}_history"></div>
        <div class="dosprompt-input-row">
          <span>C:\\WINDOWS&gt;</span>
          <input type="text" class="dosprompt-cli-input" id="${winId}_input" autofocus spellcheck="false">
        </div>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: winId,
      title: this.t('dosprompt.title'),
      icon: 'dos-prompt',
      width: 580,
      height: 380,
      resizable: true,
      minimizable: true,
      maximizable: true,
      content
    });

    const el = dialog.element;
    const consoleBody = el.querySelector(`#${winId}_console`);
    const historyBox = el.querySelector(`#${winId}_history`);
    const input = el.querySelector(`#${winId}_input`);
    const fontSelect = el.querySelector(`#${winId}_font_select`);

    consoleBody.addEventListener('click', () => input.focus());
    setTimeout(() => input.focus(), 80);

    fontSelect.addEventListener('change', () => {
      consoleBody.style.fontSize = fontSelect.value;
      input.style.fontSize = fontSelect.value;
    });

    el.querySelector(`#${winId}_btn_fullscreen`).addEventListener('click', () => {
      window.winManager.closeWindow(winId);
      if (window.appShutdown) window.appShutdown.triggerDosMode();
    });

    const execCommand = (rawCmd) => {
      const trimmed = rawCmd.trim();
      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      const promptLine = document.createElement('div');
      promptLine.className = 'dosprompt-line';
      promptLine.textContent = `C:\\WINDOWS> ${trimmed}`;
      historyBox.appendChild(promptLine);

      if (cmd === 'exit') {
        window.winManager.closeWindow(winId);
        return;
      }

      if (cmd === 'cls') {
        historyBox.innerHTML = '';
        return;
      }

      if (cmd === 'ver') {
        const out = document.createElement('div');
        out.className = 'dosprompt-line';
        out.textContent = 'Win 98 [Version 4.10.1998]';
        historyBox.appendChild(out);
      } else if (cmd === 'date') {
        const out = document.createElement('div');
        out.className = 'dosprompt-line';
        out.textContent = `Current date is: ${new Date().toLocaleDateString()}`;
        historyBox.appendChild(out);
      } else if (cmd === 'time') {
        const out = document.createElement('div');
        out.className = 'dosprompt-line';
        out.textContent = `Current time is: ${new Date().toLocaleTimeString()}`;
        historyBox.appendChild(out);
      } else if (cmd === 'echo') {
        const out = document.createElement('div');
        out.className = 'dosprompt-line';
        out.textContent = args.join(' ');
        historyBox.appendChild(out);
      } else if (cmd === 'mem') {
        const out = document.createElement('div');
        out.className = 'dosprompt-line';
        out.textContent = `Memory Type         Total       Used       Free\r\n----------------  --------   --------   --------\r\nConventional          640K        42K       598K\r\nUpper                 155K        24K       131K\r\nReserved              384K       384K         0K\r\nExtended (XMS)     64,512K     8,192K    56,320K\r\n----------------  --------   --------   --------\r\nTotal memory       65,691K     8,642K    57,049K`;
        historyBox.appendChild(out);
      } else if (cmd === 'dir') {
        const out = document.createElement('div');
        out.className = 'dosprompt-line';
        out.textContent = ` Volume in drive C has no label.\r\n Volume Serial Number is 1998-0412\r\n Directory of C:\\WINDOWS\r\n\r\n.              <DIR>        04-12-98  11:11a\r\n..             <DIR>        04-12-98  11:11a\r\nSYSTEM         <DIR>        04-12-98  11:11a\r\nNOTEPAD  EXE         54,272  04-12-98  11:11a\r\nWIN      INI          1,024  04-12-98  11:11a\r\nSYSTEM   INI          2,048  04-12-98  11:11a\r\nREADME   TXT          2,048  04-12-98  11:11a\r\nCOMMAND  COM         93,880  04-12-98  11:11a\r\n         5 file(s)        153,272 bytes\r\n         3 dir(s)   1,524,891,648 bytes free`;
        historyBox.appendChild(out);
      } else if (cmd === 'ping') {
        const host = args[0] || '127.0.0.1';
        const ip = host === 'localhost' || host === '127.0.0.1' ? '127.0.0.1' : '198.133.219.25';
        const out = document.createElement('div');
        out.className = 'dosprompt-line';
        out.innerHTML = `Pinging ${host} [${ip}] with 32 bytes of data:<br>` +
          `Reply from ${ip}: bytes=32 time=14ms TTL=128<br>` +
          `Reply from ${ip}: bytes=32 time=12ms TTL=128<br>` +
          `Reply from ${ip}: bytes=32 time=15ms TTL=128<br>` +
          `Reply from ${ip}: bytes=32 time=11ms TTL=128<br><br>` +
          `Ping statistics for ${ip}:<br>` +
          `    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),<br>` +
          `Approximate round trip times in milli-seconds:<br>` +
          `    Minimum = 11ms, Maximum = 15ms, Average = 13ms`;
        historyBox.appendChild(out);
      } else if (cmd === 'type') {
        const fname = (args[0] || '').toLowerCase();
        const out = document.createElement('div');
        out.className = 'dosprompt-line';
        if (fname.includes('win.ini')) {
          out.textContent = `[windows]\r\nload=\r\nrun=\r\nNullPort=None\r\nDeviceNotSelectedTimeout=15\r\nTransmissionRetryTimeout=45`;
        } else if (fname.includes('readme')) {
          out.textContent = `Welcome to Microslop Win 98 Second Edition!`;
        } else {
          out.textContent = `File not found - ${args[0] || ''}`;
        }
        historyBox.appendChild(out);
      } else if (cmd === 'calc') {
        if (window.appCalculator) window.appCalculator.open();
      } else if (cmd === 'notepad') {
        if (window.appNotepad) window.appNotepad.open(args[0] || null);
      } else if (cmd === 'winver') {
        if (window.appDialogs) window.appDialogs.openAboutWindows();
      } else if (cmd === 'clippy' || cmd === 'clippy.exe') {
        const out = document.createElement('div');
        out.className = 'dosprompt-line';
        out.textContent = (window.appClippy ? window.appClippy.dosCommand(args) : ['Bad command or file name: "clippy"']).join('\r\n');
        historyBox.appendChild(out);
      } else if (cmd === 'help') {
        const out = document.createElement('div');
        out.className = 'dosprompt-line';
        out.textContent = `Supported commands:\r\n  DIR      - Displays directory contents\r\n  VER      - Displays Win version\r\n  DATE     - Displays current date\r\n  TIME     - Displays current time\r\n  MEM      - Displays memory distribution\r\n  PING     - Pings network host (e.g. ping 127.0.0.1)\r\n  TYPE     - Displays contents of a file\r\n  ECHO     - Prints message\r\n  CLS      - Clears screen\r\n  CALC     - Launches Calculator\r\n  NOTEPAD  - Launches Notepad\r\n  WINVER   - Shows Win version dialog\r\n  CLIPPY   - Calls the Office Assistant (CLIPPY /? for options)\r\n  EXIT     - Closes MS-DOS prompt window`;
        historyBox.appendChild(out);
      } else if (cmd !== '') {
        const out = document.createElement('div');
        out.className = 'dosprompt-line';
        out.textContent = `Bad command or file name: "${cmd}"`;
        historyBox.appendChild(out);
      }

      consoleBody.scrollTop = consoleBody.scrollHeight;
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value;
        input.value = '';
        execCommand(val);
      }
    });

    if (initialCmd) {
      setTimeout(() => execCommand(initialCmd), 100);
    }
  }
}

window.appSysTools = new AppSysTools();

