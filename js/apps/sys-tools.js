

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
      
      <div style="display:flex; border-bottom:1px solid #808080; margin-bottom:8px;">
        <button class="win-tab-btn active" data-tab="tab-dx-sys" style="padding:3px 10px; font-weight:bold; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:var(--win-bg);">${this.t('dxdiag.tabSystem')}</button>
        <button class="win-tab-btn" data-tab="tab-dx-disp" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${this.t('dxdiag.tabDisplay')}</button>
        <button class="win-tab-btn" data-tab="tab-dx-sound" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${this.t('dxdiag.tabSound')}</button>
      </div>

      
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

      
      <div class="dx-tab-content" id="tab-dx-sound" style="display:none;">
        <fieldset class="bevel-groove" style="padding:8px 10px; font-size:11px;">
          <legend>${isRu ? 'Звуковое устройство' : 'Device'}</legend>
          <table class="dxdiag-info-table">
            <tr><td class="dxdiag-info-label">${isRu ? 'Устройство:' : 'Device:'}</td><td class="dxdiag-info-val">Creative Sound Blaster AWE64 Gold</td></tr>
            <tr><td class="dxdiag-info-label">${isRu ? 'Драйвер:' : 'Driver:'}</td><td class="dxdiag-info-val">sbawe64.vxd (Version 4.10.1998)</td></tr>
            <tr><td class="dxdiag-info-label">${isRu ? 'Аппаратное ускорение:' : 'Acceleration:'}</td><td class="dxdiag-info-val">${isRu ? 'Полное' : 'Full Acceleration'}</td></tr>
          </table>
          <div style="margin-top:12px; display:flex; justify-content:center;">
            <button class="win-btn" id="btn-dx-test-sound" style="min-width:140px; font-weight:bold;">${this.t('dxdiag.testDSound')}</button>
          </div>
          <div style="text-align:center; font-size:10px; color:#555; margin-top:6px;" id="dx-sound-status">
            ${isRu ? 'Воспроизводит аппаратный тестовый синусоидальный тон' : 'Plays a hardware sine test tone'}
          </div>
        </fieldset>
      </div>

      
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

        const x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
        const z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);

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
        title: isRu ? 'Тест DirectDraw' : 'DirectDraw Test',
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

      
      <div class="scandisk-sector-grid" id="sd-grid"></div>

      <div class="win-label-row">
        <input type="checkbox" id="sd-autofix" checked>
        <label for="sd-autofix" style="font-size:11px;">${this.t('scandisk.autoFix')}</label>
      </div>

      
      <div style="margin-top:8px; border:2px inset #fff; height:18px; background:#fff; position:relative; overflow:hidden;">
        <div id="sd-progress-bar" style="height:100%; width:0%; background:#000080; transition:width 0.1s linear;"></div>
      </div>

      
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
            message: isRu
              ? `<strong>ScanDisk не обнаружил ошибок на диске C:</strong><br><br>
              Всего на диске: 13,048,832 КБ<br>
              В 3,412 скрытых файлах: 24,576 КБ<br>
              В 1,280 папках: 10,240 КБ<br>
              В 14,892 файлах пользователя: 11,489,125 КБ<br>
              Доступно на диске: 1,524,891 КБ`
              : `<strong>ScanDisk did not find any errors on drive C:</strong><br><br>
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
        
        <div class="sndvol-channel">
          <div class="sndvol-label">${this.t('sndvol.master')}</div>
          <div style="font-size:9px; color:#555;">${this.t('sndvol.balance')}</div>
          <input type="range" min="0" max="100" value="50" class="sndvol-balance">
          <div class="sndvol-slider-wrap">
            <input type="range" min="0" max="100" value="${curVol}" class="sndvol-slider sndvol-master-slider" id="sndvol-master-slider">
          </div>
          <label style="font-size:10px;"><input type="checkbox" class="sndvol-master-mute" id="sndvol-master-mute"${isMuted ? ' checked' : ''}> ${this.t('sndvol.mute')}</label>
        </div>

        
        <div class="sndvol-channel">
          <div class="sndvol-label">${this.t('sndvol.wave')}</div>
          <div style="font-size:9px; color:#555;">${this.t('sndvol.balance')}</div>
          <input type="range" min="0" max="100" value="50" class="sndvol-balance">
          <div class="sndvol-slider-wrap">
            <input type="range" min="0" max="100" value="85" class="sndvol-slider">
          </div>
          <label style="font-size:10px;"><input type="checkbox"> ${this.t('sndvol.mute')}</label>
        </div>

        
        <div class="sndvol-channel">
          <div class="sndvol-label">${this.t('sndvol.midi')}</div>
          <div style="font-size:9px; color:#555;">${this.t('sndvol.balance')}</div>
          <input type="range" min="0" max="100" value="50" class="sndvol-balance">
          <div class="sndvol-slider-wrap">
            <input type="range" min="0" max="100" value="75" class="sndvol-slider">
          </div>
          <label style="font-size:10px;"><input type="checkbox"> ${this.t('sndvol.mute')}</label>
        </div>

        
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
          <label><input type="checkbox" checked id="cl-tmp-inet"> ${isRu ? 'Временные файлы Интернета' : 'Temporary Internet Files'} (8,412 KB)</label>
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
    const isRu = () => typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const tr = (ru, en) => (isRu() ? ru : en);

    let currentPath = ['My Computer', 'C:', 'WINDOWS'];
    const formatPromptPath = () => {
      const parts = currentPath.slice(1);
      if (parts.length === 1) return parts[0] + '\\>';
      return parts[0] + '\\' + parts.slice(1).join('\\').toUpperCase() + '>';
    };

    content.innerHTML = `
      <div class="dosprompt-toolbar">
        <button class="dosprompt-tool-btn" id="${winId}_btn_mark" title="${this.t('dosprompt.mark')}"><span>&#x25A2;</span></button>
        <button class="dosprompt-tool-btn" id="${winId}_btn_copy" title="${this.t('dosprompt.copy')}"><span>&#x2398;</span></button>
        <button class="dosprompt-tool-btn" id="${winId}_btn_paste" title="${this.t('dosprompt.paste')}"><span>&#x1F4CB;</span></button>
        <button class="dosprompt-tool-btn" id="${winId}_btn_fullscreen" title="${this.t('dosprompt.fullscreen')}"><span>&#x26F6;</span></button>
        <div style="flex:1;"></div>
        <select style="height:18px; font-size:10px;" id="${winId}_font_select">
          <option value="12px">${tr('Авто', 'Auto')} (8x12)</option>
          <option value="14px">10x14</option>
          <option value="16px">12x16</option>
        </select>
      </div>

      <div class="dosprompt-console-body" id="${winId}_console" style="position:relative;">
        <div class="dosprompt-line">Microslop(R) Win 98\r\n   ${tr('(C)Корпорация Microslop 1981-1998.', '(C)Copyright Microslop Corp 1981-1998.')}</div>
        <div class="dosprompt-line" style="margin-bottom:6px;">${tr('Введите help для списка команд, edit &lt;файл&gt; для редактора MS-DOS, exit для выхода.', 'Type \'help\' for commands, \'edit &lt;file&gt;\' for MS-DOS Editor, \'exit\' to close.')}</div>
        <div id="${winId}_history"></div>
        <div class="dosprompt-input-row">
          <span id="${winId}_prompt_lbl">C:\\WINDOWS&gt;</span>
          <input type="text" class="dosprompt-cli-input" id="${winId}_input" autofocus spellcheck="false">
        </div>
        <div id="${winId}_edit_overlay" style="display:none; position:absolute; inset:0; background:#0000aa; color:#ffffff; font-family:'Courier New',monospace; font-size:12px; flex-direction:column; z-index:20;">
          <div style="background:#c0c0c0; color:#000; padding:2px 8px; display:flex; gap:14px; font-weight:bold;">
            <span id="${winId}_ed_save" style="cursor:pointer;"></span>
            <span id="${winId}_ed_exit" style="cursor:pointer;"></span>
            <span style="margin-left:auto;" id="${winId}_ed_title">UNTITLED.TXT</span>
          </div>
          <textarea id="${winId}_ed_area" spellcheck="false" style="flex:1; background:#0000aa; color:#ffff55; border:2px double #ffffff; margin:4px; padding:6px; font-family:'Courier New',monospace; font-size:13px; resize:none; outline:none;"></textarea>
          <div style="background:#00aaaa; color:#000; padding:2px 8px; display:flex; justify-content:space-between; font-weight:bold;">
            <span id="${winId}_ed_keys"></span>
            <span id="${winId}_ed_ver"></span>
          </div>
        </div>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: winId,
      title: this.t('dosprompt.title'),
      icon: 'dos-prompt',
      width: 600,
      height: 400,
      resizable: true,
      minimizable: true,
      maximizable: true,
      content
    });

    const el = dialog.element;
    const consoleBody = el.querySelector(`#${winId}_console`);
    const historyBox = el.querySelector(`#${winId}_history`);
    const promptLbl = el.querySelector(`#${winId}_prompt_lbl`);
    const input = el.querySelector(`#${winId}_input`);
    const fontSelect = el.querySelector(`#${winId}_font_select`);
    const editOverlay = el.querySelector(`#${winId}_edit_overlay`);
    const editArea = el.querySelector(`#${winId}_ed_area`);
    const editTitle = el.querySelector(`#${winId}_ed_title`);
    let editingFileName = 'UNTITLED.TXT';

    const renderEditorChrome = () => {
      el.querySelector(`#${winId}_ed_save`).innerHTML = tr('<u>Ф</u>айл (Сохранить)', '<u>F</u>ile (Save)');
      el.querySelector(`#${winId}_ed_exit`).innerHTML = tr('<u>В</u>ыход (Esc)', 'E<u>x</u>it (Esc)');
      el.querySelector(`#${winId}_ed_keys`).textContent = tr('F1=Справка  Ctrl+S=Сохранить  Esc=Выход из редактора MS-DOS', 'F1=Help  Ctrl+S=Save  Esc=Exit MS-DOS Editor');
      el.querySelector(`#${winId}_ed_ver`).textContent = tr('Редактор MS-DOS, версия 2.0.026', 'MS-DOS Editor Version 2.0.026');
    };
    renderEditorChrome();

    consoleBody.addEventListener('click', () => {
      if (editOverlay.style.display === 'none') input.focus();
    });
    setTimeout(() => input.focus(), 80);

    fontSelect.addEventListener('change', () => {
      consoleBody.style.fontSize = fontSelect.value;
      input.style.fontSize = fontSelect.value;
    });

    el.querySelector(`#${winId}_btn_fullscreen`).addEventListener('click', () => {
      window.winManager.closeWindow(winId);
      if (window.appShutdown) window.appShutdown.triggerDosMode();
    });

    const printLine = (txt) => {
      const out = document.createElement('div');
      out.className = 'dosprompt-line';
      out.textContent = txt;
      historyBox.appendChild(out);
    };

    const toDos83 = (name, isDir) => {
      const upper = name.toUpperCase().replace(/\s+/g, '');
      if (isDir) return upper.slice(0, 8).padEnd(8, ' ') + '     <DIR>     ';
      const dot = upper.lastIndexOf('.');
      const base = (dot > 0 ? upper.slice(0, dot) : upper).slice(0, 8).padEnd(8, ' ');
      const ext = (dot > 0 ? upper.slice(dot + 1) : '').slice(0, 3).padEnd(3, ' ');
      return `${base} ${ext} `;
    };

    const openDosEditor = (fname) => {
      renderEditorChrome();
      editingFileName = fname || 'UNTITLED.TXT';
      editTitle.textContent = editingFileName.toUpperCase();
      let existingContent = '';
      if (window.vfs) {
        const folder = window.vfs.resolvePath(currentPath);
        if (folder && folder.children) {
          const matchKey = Object.keys(folder.children).find(k => k.toLowerCase() === editingFileName.toLowerCase());
          if (matchKey && folder.children[matchKey].content !== undefined) {
            existingContent = folder.children[matchKey].content;
            editingFileName = matchKey;
          }
        }
      }
      editArea.value = existingContent;
      editOverlay.style.display = 'flex';
      setTimeout(() => editArea.focus(), 40);
      if (window.appClippy && typeof window.appClippy.onDosEditor === 'function') {
        window.appClippy.onDosEditor(editingFileName);
      }
    };

    const saveDosEditor = () => {
      if (window.vfs) {
        window.vfs.writeFile(currentPath, editingFileName, editArea.value);
        if (window.appExplorer && window.appExplorer.refreshAll) window.appExplorer.refreshAll();
      }
    };

    const closeDosEditor = () => {
      editOverlay.style.display = 'none';
      input.focus();
    };

    el.querySelector(`#${winId}_ed_save`).addEventListener('click', () => {
      saveDosEditor();
      closeDosEditor();
      printLine(tr(`Файл ${editingFileName} сохранен.`, `Saved ${editingFileName}.`));
    });
    el.querySelector(`#${winId}_ed_exit`).addEventListener('click', closeDosEditor);
    editArea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDosEditor();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveDosEditor();
      }
    });

    const memTable = () => {
      const row = (label, total, used, free) => `${label.padEnd(21, ' ')}${total.padStart(8, ' ')}   ${used.padStart(8, ' ')}   ${free.padStart(8, ' ')}`;
      const rule = `${'-'.repeat(19)}  --------   --------   --------`;
      return [
        row(tr('Тип памяти', 'Memory Type'), tr('Всего', 'Total'), tr('Занято', 'Used'), tr('Свободно', 'Free')),
        rule,
        row(tr('Обычная', 'Conventional'), '640K', '42K', '598K'),
        row(tr('Верхняя', 'Upper'), '155K', '24K', '131K'),
        row(tr('Зарезервировано', 'Reserved'), '384K', '384K', '0K'),
        row(tr('Дополнительная (XMS)', 'Extended (XMS)'), '64,512K', '8,192K', '56,320K'),
        rule,
        row(tr('Всего памяти', 'Total memory'), '65,691K', '8,642K', '57,049K')
      ].join('\r\n');
    };

    const execCommand = (rawCmd) => {
      const trimmed = rawCmd.trim();
      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      printLine(`${formatPromptPath()}${trimmed}`);

      if (cmd === 'exit') {
        window.winManager.closeWindow(winId);
        return;
      }
      if (cmd === 'cls') {
        historyBox.innerHTML = '';
        return;
      }

      if (/^[acd]:$/i.test(cmd)) {
        const drv = cmd.toUpperCase();
        currentPath = ['My Computer', drv];
        promptLbl.textContent = formatPromptPath();
        return;
      }

      if (cmd === 'cd' || cmd === 'chdir') {
        const target = args.join(' ').trim();
        if (!target) {
          printLine(formatPromptPath().slice(0, -1));
        } else if (target === '\\' || target === '/') {
          currentPath = currentPath.slice(0, 2);
        } else if (target === '..') {
          if (currentPath.length > 2) currentPath.pop();
        } else if (window.vfs) {
          const folder = window.vfs.resolvePath(currentPath);
          const match = folder && folder.children
            ? Object.keys(folder.children).find(k => k.toLowerCase() === target.toLowerCase())
            : null;
          if (match && (folder.children[match].type === 'folder' || folder.children[match].type === 'drive')) {
            currentPath.push(match);
          } else {
            printLine(tr('Недопустимая папка', 'Invalid directory'));
          }
        }
        promptLbl.textContent = formatPromptPath();
      } else if (cmd === 'dir') {
        const folder = window.vfs ? window.vfs.resolvePath(currentPath) : null;
        const children = (folder && folder.children) ? folder.children : {};
        const keys = Object.keys(children);
        let filesCount = 0;
        let dirsCount = 2;
        let totalBytes = 0;
        const drvLetter = currentPath[1][0];
        const lines = [
          tr(` Том в устройстве ${drvLetter} имеет метку WIN98_SE`, ` Volume in drive ${drvLetter} is WIN98_SE`),
          tr(` Серийный номер тома: 1998-0412`, ` Volume Serial Number is 1998-0412`),
          tr(` Содержимое папки ${formatPromptPath().slice(0, -1)}`, ` Directory of ${formatPromptPath().slice(0, -1)}`),
          ``,
          `.              <DIR>        04-23-99  10:22a`,
          `..             <DIR>        04-23-99  10:22a`
        ];
        keys.forEach(k => {
          const item = children[k];
          const isDir = item.type === 'folder';
          if (isDir) {
            dirsCount++;
            lines.push(`${toDos83(k, true)}   04-23-99  10:22a  ${k}`);
          } else {
            filesCount++;
            const sz = item.content ? item.content.length : 4096;
            totalBytes += sz;
            lines.push(`${toDos83(k, false)}${String(sz).padStart(9, ' ')}  04-23-99  10:22a  ${k}`);
          }
        });
        lines.push(tr(`         ${filesCount} файл(ов)     ${totalBytes.toLocaleString()} байт`, `         ${filesCount} file(s)     ${totalBytes.toLocaleString()} bytes`));
        lines.push(tr(`         ${dirsCount} папок   1,524,891,648 байт свободно`, `         ${dirsCount} dir(s)   1,524,891,648 bytes free`));
        printLine(lines.join('\r\n'));
      } else if (cmd === 'tree') {
        const folder = window.vfs ? window.vfs.resolvePath(currentPath) : null;
        const lines = [tr('Структура папок тома WIN98_SE', 'Folder PATH listing for volume WIN98_SE'), `${formatPromptPath().slice(0, -1)}`];
        const walk = (node, prefix) => {
          if (!node || !node.children) return;
          const dirs = Object.keys(node.children).filter(k => node.children[k].type === 'folder');
          dirs.forEach((d, idx) => {
            const last = idx === dirs.length - 1;
            lines.push(`${prefix}${last ? '└───' : '├───'}${d}`);
            walk(node.children[d], prefix + (last ? '    ' : '│   '));
          });
        };
        walk(folder, '');
        printLine(lines.join('\r\n'));
      } else if (cmd === 'md' || cmd === 'mkdir') {
        const name = args.join(' ').trim();
        if (!name) {
          printLine(tr('Отсутствует обязательный параметр', 'Required parameter missing'));
        } else if (window.vfs && window.vfs.createFolder(currentPath, name)) {
          if (window.appExplorer && window.appExplorer.refreshAll) window.appExplorer.refreshAll();
        } else {
          printLine(tr('Невозможно создать папку', 'Unable to create directory'));
        }
      } else if (cmd === 'del' || cmd === 'erase') {
        const name = args.join(' ').trim();
        const folder = window.vfs ? window.vfs.resolvePath(currentPath) : null;
        const match = folder && folder.children
          ? Object.keys(folder.children).find(k => k.toLowerCase() === name.toLowerCase())
          : null;
        if (match && window.vfs.deleteItem(currentPath, match)) {
          if (window.appExplorer && window.appExplorer.refreshAll) window.appExplorer.refreshAll();
        } else {
          printLine(tr(`Файл не найден - ${name}`, `File not found - ${name}`));
        }
      } else if (cmd === 'copy') {
        const src = args[0];
        const dst = args[1];
        const folder = window.vfs ? window.vfs.resolvePath(currentPath) : null;
        const match = (src && folder && folder.children)
          ? Object.keys(folder.children).find(k => k.toLowerCase() === src.toLowerCase())
          : null;
        if (match && dst) {
          folder.children[dst] = JSON.parse(JSON.stringify(folder.children[match]));
          window.vfs.save();
          printLine(tr('        1 файл(ов) скопировано', '        1 file(s) copied'));
        } else {
          printLine(tr('Файл не найден или не может быть скопирован сам в себя', 'File cannot be copied onto itself or not found'));
        }
      } else if (cmd === 'ren' || cmd === 'rename') {
        const oldName = args[0];
        const newName = args[1];
        const folder = window.vfs ? window.vfs.resolvePath(currentPath) : null;
        const match = (oldName && folder && folder.children)
          ? Object.keys(folder.children).find(k => k.toLowerCase() === oldName.toLowerCase())
          : null;
        if (match && newName && window.vfs.renameItem(currentPath, match, newName)) {
          if (window.appExplorer && window.appExplorer.refreshAll) window.appExplorer.refreshAll();
        } else {
          printLine(tr('Файл с таким именем уже существует или файл не найден', 'Duplicate file name or file not found'));
        }
      } else if (cmd === 'attrib') {
        const folder = window.vfs ? window.vfs.resolvePath(currentPath) : null;
        if (folder && folder.children) {
          const lines = Object.keys(folder.children).map(k => {
            const it = folder.children[k];
            const a = it.attrib || {};
            return `${a.archive !== false ? 'A' : ' '}  ${a.system ? 'S' : ' '}${a.hidden ? 'H' : ' '}${a.readOnly ? 'R' : ' '}     ${formatPromptPath().slice(0, -1)}\\${k}`;
          });
          printLine(lines.join('\r\n') || tr('Подходящие файлы не найдены', 'No matching files'));
        }
      } else if (cmd === 'format') {
        const drv = (args[0] || '').toUpperCase();
        if (drv === 'A:') {
          printLine(tr(
            'Проверка текущего формата диска...\r\nФорматирование 1.44M\r\nФорматирование завершено.\r\n    1,457,664 байт всего на диске\r\n    1,457,664 байт доступно на диске',
            'Checking existing disk format...\r\nFormatting 1.44M\r\nFormat complete.\r\n    1,457,664 bytes total disk space\r\n    1,457,664 bytes available on disk'
          ));
        } else {
          printLine(tr('Невозможно отформатировать системный жесткий диск C:', 'Cannot format fixed system drive C:'));
        }
      } else if (cmd === 'edit') {
        openDosEditor(args[0] || 'UNTITLED.TXT');
      } else if (cmd === 'ver') {
        printLine(tr('Win 98 [Версия 4.10.2222 A]', 'Win 98 [Version 4.10.2222 A]'));
      } else if (cmd === 'date') {
        printLine(tr(`Текущая дата: ${new Date().toLocaleDateString()}`, `Current date is: ${new Date().toLocaleDateString()}`));
      } else if (cmd === 'time') {
        printLine(tr(`Текущее время: ${new Date().toLocaleTimeString()}`, `Current time is: ${new Date().toLocaleTimeString()}`));
      } else if (cmd === 'echo') {
        printLine(args.join(' '));
      } else if (cmd === 'mem') {
        printLine(memTable());
      } else if (cmd === 'ping') {
        const host = args[0] || '127.0.0.1';
        const ip = host === 'localhost' || host === '127.0.0.1' ? '127.0.0.1' : '198.133.219.25';
        const reply = (ms) => tr(`Ответ от ${ip}: число байт=32 время=${ms}мс TTL=128`, `Reply from ${ip}: bytes=32 time=${ms}ms TTL=128`);
        printLine([
          tr(`Обмен пакетами с ${host} [${ip}] по 32 байт:`, `Pinging ${host} [${ip}] with 32 bytes of data:`),
          reply(14),
          reply(12),
          reply(15),
          reply(11),
          '',
          tr(`Статистика Ping для ${ip}:`, `Ping statistics for ${ip}:`),
          tr('    Пакетов: отправлено = 4, получено = 4, потеряно = 0 (0% потерь)', '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)')
        ].join('\r\n'));
      } else if (cmd === 'ipconfig' || cmd === 'winipcfg') {
        this.openWinIpCfg();
      } else if (cmd === 'type') {
        const fname = args.join(' ').trim();
        const folder = window.vfs ? window.vfs.resolvePath(currentPath) : null;
        const match = (fname && folder && folder.children)
          ? Object.keys(folder.children).find(k => k.toLowerCase() === fname.toLowerCase())
          : null;
        if (match && folder.children[match].content !== undefined) {
          printLine(folder.children[match].content);
        } else if (fname.toLowerCase().includes('win.ini')) {
          printLine(`[windows]\r\nload=\r\nrun=\r\nNullPort=None`);
        } else {
          printLine(tr(`Файл не найден - ${fname}`, `File not found - ${fname}`));
        }
      } else if (cmd === 'calc') {
        if (window.appCalculator) window.appCalculator.open();
      } else if (cmd === 'notepad') {
        if (window.appNotepad) window.appNotepad.open(args[0] || null);
      } else if (cmd === 'winver') {
        if (window.appDialogs) window.appDialogs.openAboutWindows();
      } else if (cmd === 'clippy' || cmd === 'clippy.exe') {
        printLine((window.appClippy ? window.appClippy.dosCommand(args) : [tr('Недопустимая команда или имя файла: "clippy"', 'Bad command or file name: "clippy"')]).join('\r\n'));
      } else if (cmd === 'help') {
        printLine(tr(
          `Поддерживаемые команды MS-DOS 7.10:\r\n` +
          `  DIR / TREE / CD  - Просмотр папок и переход между ними\r\n` +
          `  MD / DEL / COPY  - Создание папок, удаление и копирование файлов\r\n` +
          `  REN / ATTRIB     - Переименование файлов и просмотр атрибутов\r\n` +
          `  TYPE / EDIT      - Вывод файла или синий редактор MS-DOS\r\n` +
          `  FORMAT A:        - Форматирование дискеты 3,5"\r\n` +
          `  MEM / VER        - Сведения о памяти и версии системы\r\n` +
          `  PING / WINIPCFG  - Сетевые программы\r\n` +
          `  CLS / EXIT       - Очистка экрана или закрытие сеанса MS-DOS`,
          `Supported MS-DOS 7.10 commands:\r\n` +
          `  DIR / TREE / CD  - Navigate and list VFS directories\r\n` +
          `  MD / DEL / COPY  - Create folders, delete or copy files\r\n` +
          `  REN / ATTRIB     - Rename files or inspect file attributes\r\n` +
          `  TYPE / EDIT      - View file or open blue-screen MS-DOS Editor\r\n` +
          `  FORMAT A:        - Format 3.5" Floppy Disk\r\n` +
          `  MEM / VER        - Display conventional/XMS memory and OS version\r\n` +
          `  PING / WINIPCFG  - Network utilities\r\n` +
          `  CLS / EXIT       - Clear screen or close MS-DOS Prompt`
        ));
      } else if (cmd !== '') {
        printLine(tr(`Недопустимая команда или имя файла: "${cmd}"`, `Bad command or file name: "${cmd}"`));
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

  openWinIpCfg() {
    if (window.winManager && window.winManager.windows.has('app_winipcfg')) {
      window.winManager.bringToTop('app_winipcfg');
      return;
    }

    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    let ipAddr = '192.168.1.98';
    let subnet = '255.255.255.0';
    let gateway = '192.168.1.1';
    let expanded = false;

    const content = document.createElement('div');
    content.style.cssText = 'padding:10px; font-family:Tahoma,sans-serif; font-size:11px; background:#c0c0c0; display:flex; flex-direction:column; gap:8px;';
    content.innerHTML = `
      <div id="ipcfg-extra" style="display:none;">
        <fieldset style="border:1px groove #fff; padding:6px; margin-bottom:6px;">
          <legend>${isRu ? 'Сведения об узле' : 'Host Information'}</legend>
          <div style="display:grid; grid-template-columns:130px 1fr; gap:4px; align-items:center;">
            <span>${isRu ? 'Имя узла:' : 'Host Name:'}</span>
            <input type="text" class="win-inset" value="admin-pc.workgroup" readonly style="height:19px; padding:1px 4px;">
            <span>${isRu ? 'DNS-серверы:' : 'DNS Servers:'}</span>
            <input type="text" class="win-inset" value="194.87.0.50" readonly style="height:19px; padding:1px 4px;">
            <span>${isRu ? 'Тип узла:' : 'Node Type:'}</span>
            <input type="text" class="win-inset" value="${isRu ? 'Широковещательный' : 'Broadcast'}" readonly style="height:19px; padding:1px 4px;">
          </div>
        </fieldset>
      </div>

      <fieldset style="border:1px groove #fff; padding:8px;">
        <legend>${isRu ? 'Сведения об адаптере Ethernet' : 'Ethernet Adapter Information'}</legend>
        <select id="ipcfg-adapter-sel" class="win-select" style="width:100%; height:21px; margin-bottom:8px;">
          <option value="eth">${isRu ? 'NE2000-совместимый адаптер Ethernet' : 'NE2000 Compatible Ethernet Adapter'}</option>
          <option value="ppp">${isRu ? 'Адаптер PPP (удаленный доступ к сети)' : 'PPP Adapter (Dial-Up Networking)'}</option>
        </select>
        <div style="display:grid; grid-template-columns:130px 1fr; gap:5px; align-items:center;">
          <span>${isRu ? 'Адрес адаптера:' : 'Adapter Address:'}</span>
          <input type="text" id="ipcfg-mac" class="win-inset" value="00-A0-C9-1E-98-SE" readonly style="height:19px; padding:1px 4px; text-align:center;">
          <span>${isRu ? 'IP-адрес:' : 'IP Address:'}</span>
          <input type="text" id="ipcfg-ip" class="win-inset" value="${ipAddr}" readonly style="height:19px; padding:1px 4px; text-align:center;">
          <span>${isRu ? 'Маска подсети:' : 'Subnet Mask:'}</span>
          <input type="text" id="ipcfg-mask" class="win-inset" value="${subnet}" readonly style="height:19px; padding:1px 4px; text-align:center;">
          <span>${isRu ? 'Основной шлюз:' : 'Default Gateway:'}</span>
          <input type="text" id="ipcfg-gw" class="win-inset" value="${gateway}" readonly style="height:19px; padding:1px 4px; text-align:center;">
        </div>
      </fieldset>

      <div style="display:flex; gap:4px; justify-content:space-between; margin-top:4px;">
        <button class="win-btn default" id="ipcfg-ok" style="flex:1;">OK</button>
        <button class="win-btn" id="ipcfg-release" style="flex:1;">${isRu ? 'Освободить' : 'Release'}</button>
        <button class="win-btn" id="ipcfg-renew" style="flex:1;">${isRu ? 'Обновить' : 'Renew'}</button>
        <button class="win-btn" id="ipcfg-more" style="flex:1;">${isRu ? 'Подробности >>' : 'More Info >>'}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_winipcfg',
      title: isRu ? 'Настройка IP' : 'IP Configuration',
      icon: 'network-cpl',
      width: 390,
      height: 255,
      resizable: false,
      minimizable: true,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = win.element;
    const ipEl = el.querySelector('#ipcfg-ip');
    const maskEl = el.querySelector('#ipcfg-mask');
    const gwEl = el.querySelector('#ipcfg-gw');
    const macEl = el.querySelector('#ipcfg-mac');
    const extraEl = el.querySelector('#ipcfg-extra');
    const moreBtn = el.querySelector('#ipcfg-more');

    el.querySelector('#ipcfg-adapter-sel').addEventListener('change', (e) => {
      if (e.target.value === 'ppp') {
        macEl.value = '44-45-53-54-00-00';
        ipEl.value = '195.34.32.118';
        maskEl.value = '255.255.255.255';
        gwEl.value = '195.34.32.1';
      } else {
        macEl.value = '00-A0-C9-1E-98-SE';
        ipEl.value = '192.168.1.98';
        maskEl.value = '255.255.255.0';
        gwEl.value = '192.168.1.1';
      }
    });

    el.querySelector('#ipcfg-release').addEventListener('click', () => {
      ipEl.value = '0.0.0.0';
      maskEl.value = '0.0.0.0';
      gwEl.value = '0.0.0.0';
    });

    el.querySelector('#ipcfg-renew').addEventListener('click', () => {
      ipEl.value = '192.168.1.98';
      maskEl.value = '255.255.255.0';
      gwEl.value = '192.168.1.1';
      if (window.soundSys && window.soundSys.playNotification) window.soundSys.playNotification();
    });

    moreBtn.addEventListener('click', () => {
      expanded = !expanded;
      extraEl.style.display = expanded ? 'block' : 'none';
      win.element.style.height = expanded ? '365px' : '255px';
      moreBtn.textContent = expanded ? (isRu ? '<< Кратко' : '<< Less Info') : (isRu ? 'Подробности >>' : 'More Info >>');
    });

    el.querySelector('#ipcfg-ok').addEventListener('click', () => window.winManager.closeWindow('app_winipcfg'));
  }

  openMsInfo32() {
    if (window.winManager && window.winManager.windows.has('app_msinfo32')) {
      window.winManager.bringToTop('app_msinfo32');
      return;
    }

    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const tr = (ru, en) => (isRu ? ru : en);
    const sections = {
      summary: {
        title: tr('Сведения о системе', 'System Summary'),
        rows: [
          [tr('Имя ОС', 'OS Name'), 'Microslop Win 98 Second Edition'],
          [tr('Версия', 'Version'), '4.10.2222 A'],
          [tr('Изготовитель ОС', 'OS Manufacturer'), tr('Корпорация Microslop', 'Microslop Corporation')],
          [tr('Имя системы', 'System Name'), 'ADMIN-PC'],
          [tr('Процессор', 'Processor'), 'Intel Pentium II MMX GenuineIntel ~450 MHz'],
          [tr('Версия BIOS', 'BIOS Version'), 'Award Modular BIOS v4.51PG, 04/23/99'],
          [tr('Папка Win', 'Win Directory'), 'C:\\WINDOWS'],
          [tr('Всего физической памяти', 'Total Physical Memory'), tr('64.00 МБ', '64.00 MB')],
          [tr('Доступно физической памяти', 'Available Physical Memory'), tr('46.50 МБ', '46.50 MB')],
          [tr('Виртуальная память', 'Virtual Memory'), tr('128.00 МБ (C:\\WIN386.SWP)', '128.00 MB (C:\\WIN386.SWP)')],
          [tr('Свободные системные ресурсы', 'Free System Resources'), tr('88% (Система: 88%, GDI: 90%, Пользователь: 88%)', '88% (System: 88%, GDI: 90%, User: 88%)')]
        ]
      },
      irq: {
        title: tr('Аппаратные ресурсы — IRQ', 'Hardware Resources — IRQs'),
        rows: [
          ['IRQ 0', tr('Системный таймер', 'System timer')],
          ['IRQ 1', tr('Стандартная клавиатура 101/102 или Microslop Natural Keyboard', 'Standard 101/102-Key or Microslop Natural Keyboard')],
          ['IRQ 3', 'Sportster 56K Faxmodem PnP (COM2)'],
          ['IRQ 4', tr('Последовательный порт (COM1)', 'Communications Port (COM1)')],
          ['IRQ 5', 'Creative Sound Blaster AWE64 Gold'],
          ['IRQ 6', tr('Стандартный контроллер гибких дисков', 'Standard Floppy Disk Controller')],
          ['IRQ 8', tr('Системные CMOS/часы реального времени', 'System CMOS/real time clock')],
          ['IRQ 10', tr('NE2000-совместимый адаптер Ethernet', 'NE2000 Compatible Ethernet Adapter')],
          ['IRQ 11', tr('3D-ускоритель 3dfx Voodoo2', '3dfx Voodoo2 3D Accelerator')],
          ['IRQ 12', tr('Порт PS/2-совместимой мыши', 'PS/2 Compatible Mouse Port')],
          ['IRQ 14', tr('Первичный контроллер IDE (dual fifo)', 'Primary IDE controller (dual fifo)')],
          ['IRQ 15', tr('Вторичный контроллер IDE (dual fifo)', 'Secondary IDE controller (dual fifo)')]
        ]
      },
      dma: {
        title: tr('Аппаратные ресурсы — DMA и ввод-вывод', 'Hardware Resources — DMA & I/O'),
        rows: [
          ['DMA 01', tr('Creative Sound Blaster AWE64, 8-битный DMA', 'Creative Sound Blaster AWE64 8-bit DMA')],
          ['DMA 02', tr('Стандартный контроллер гибких дисков', 'Standard Floppy Disk Controller')],
          ['DMA 04', tr('Контроллер прямого доступа к памяти', 'Direct memory access controller')],
          ['DMA 05', tr('Creative Sound Blaster AWE64, 16-битный звук', 'Creative Sound Blaster AWE64 16-bit Audio')],
          ['I/O 0000-000F', tr('Контроллер прямого доступа к памяти', 'Direct memory access controller')],
          ['I/O 01F0-01F7', tr('Первичный контроллер IDE', 'Primary IDE controller')],
          ['I/O 0220-022F', 'Sound Blaster AWE64 Gold'],
          ['I/O 02F8-02FF', 'Sportster 56K Faxmodem (COM2)'],
          ['I/O 0378-037F', tr('Порт принтера ECP (LPT1)', 'ECP Printer Port (LPT1)')]
        ]
      },
      components: {
        title: tr('Компоненты', 'Components'),
        rows: [
          [tr('Видеоадаптер', 'Display Adapter'), '3dfx Voodoo2 PCI 12MB (voodoo2.drv 4.10.01.0218)'],
          [tr('Звуковое устройство', 'Sound Device'), 'Creative Sound Blaster AWE64 Gold (sbawe64.vxd)'],
          [tr('Сетевой адаптер', 'Network Adapter'), tr('NE2000-совместимый Ethernet (ne2000.sys)', 'NE2000 Compatible Ethernet (ne2000.sys)')],
          [tr('Дисковод CD-ROM', 'CD-ROM Drive'), tr('Дисковод ATAPI 32X CD-ROM (D:)', 'ATAPI 32X CD-ROM Drive (D:)')],
          [tr('Модем', 'Modem'), 'U.S. Robotics 56K Voice INT V4.9.1 (COM2)'],
          [tr('Версия DirectX', 'DirectX Version'), 'Microslop DirectX 6.1a (4.06.02.0436)']
        ]
      },
      software: {
        title: tr('Программная среда', 'Software Environment'),
        rows: [
          ['KERNEL32.DLL', tr('4.10.2222 — основной компонент ядра Win32', '4.10.2222 — Win32 Kernel core component')],
          ['GDI32.DLL', tr('4.10.1998 — клиентская библиотека GDI', '4.10.1998 — GDI Client DLL')],
          ['USER32.DLL', tr('4.10.2222 — клиент Win32 USER API', '4.10.2222 — Win32 USER API Client')],
          ['SHELL32.DLL', tr('4.72.3612.1700 — общая библиотека оболочки Win', '4.72.3612.1700 — Win Shell Common Dll')],
          ['EXPLORER.EXE', tr('4.72.3110.1 — оболочка Win 98', '4.72.3110.1 — Win 98 Shell')],
          ['SYSTRAY.EXE', tr('4.10.2222 — службы области уведомлений', '4.10.2222 — System Tray Services')],
          ['WINAMP.EXE', tr('2.10 — MP3-проигрыватель Nullsoft Winamp', '2.10 — Nullsoft Winamp MP3 Player')]
        ]
      }
    };

    const content = document.createElement('div');
    content.style.cssText = 'display:flex; flex-direction:column; height:100%; background:#c0c0c0; font-family:Tahoma,sans-serif; font-size:11px;';
    content.innerHTML = `
      <div class="win-menubar">
        <div class="win-menu-item">${tr('Файл', 'File')}
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option" data-cmd="exit">${tr('Выход', 'Exit')}</div>
          </div>
        </div>
        <div class="win-menu-item">${tr('Сервис', 'Tools')}
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option" data-cmd="sfc">${tr('Проверка системных файлов', 'System File Checker')}</div>
            <div class="win-dropdown-option" data-cmd="scanreg">${tr('Проверка реестра', 'Registry Checker')}</div>
            <div class="win-dropdown-option" data-cmd="msconfig">${tr('Настройка системы (MSConfig)', 'System Configuration Utility')}</div>
            <div class="win-dropdown-option" data-cmd="dxdiag">${tr('Средство диагностики DirectX', 'DirectX Diagnostic Tool')}</div>
            <div class="win-dropdown-option" data-cmd="drwatson">Dr. Watson</div>
          </div>
        </div>
      </div>
      <div style="flex:1; display:flex; gap:4px; padding:4px; overflow:hidden;">
        <div class="win-inset" style="width:195px; background:#fff; padding:4px; overflow-y:auto;" id="msinfo-tree">
          <div class="msinfo-node active" data-sec="summary" style="padding:3px 6px; cursor:pointer; background:#000080; color:#fff; font-weight:bold;">🖥️ ${sections.summary.title}</div>
          <div class="msinfo-node" data-sec="irq" style="padding:3px 6px 3px 16px; cursor:pointer;">⚙️ ${tr('Ресурсы — IRQ', 'Hardware — IRQs')}</div>
          <div class="msinfo-node" data-sec="dma" style="padding:3px 6px 3px 16px; cursor:pointer;">⚙️ ${tr('Ресурсы — DMA и ввод-вывод', 'Hardware — DMA &amp; I/O')}</div>
          <div class="msinfo-node" data-sec="components" style="padding:3px 6px 3px 16px; cursor:pointer;">🔌 ${sections.components.title}</div>
          <div class="msinfo-node" data-sec="software" style="padding:3px 6px 3px 16px; cursor:pointer;">📦 ${sections.software.title}</div>
        </div>
        <div class="win-inset" style="flex:1; background:#fff; overflow:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:11px;">
            <thead>
              <tr style="background:#c0c0c0; text-align:left;">
                <th style="border:1px outset #fff; padding:2px 6px; width:38%;">${tr('Параметр', 'Item')}</th>
                <th style="border:1px outset #fff; padding:2px 6px;">${tr('Значение', 'Value')}</th>
              </tr>
            </thead>
            <tbody id="msinfo-tbody"></tbody>
          </table>
        </div>
      </div>
      <div class="win-statusbar" style="padding:2px 6px;">${tr('Сведения о системе Microslop 4.10 — Готово', 'Microslop System Information 4.10 — Ready')}</div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_msinfo32',
      title: tr('Сведения о системе Microslop', 'Microslop System Information'),
      icon: 'msinfo32',
      width: 600,
      height: 410,
      content
    });

    const el = win.element;
    const tbody = el.querySelector('#msinfo-tbody');

    const renderSec = (key) => {
      const sec = sections[key] || sections.summary;
      tbody.innerHTML = sec.rows.map((r, i) => `
        <tr style="background:${i % 2 === 1 ? '#f8fafc' : '#fff'};">
          <td style="padding:3px 6px; font-weight:bold; border-bottom:1px solid #eee;">${r[0]}</td>
          <td style="padding:3px 6px; border-bottom:1px solid #eee;">${r[1]}</td>
        </tr>
      `).join('');
    };
    renderSec('summary');

    el.querySelectorAll('.msinfo-node').forEach(n => {
      n.addEventListener('click', () => {
        el.querySelectorAll('.msinfo-node').forEach(x => {
          x.style.background = 'transparent';
          x.style.color = '#000';
        });
        n.style.background = '#000080';
        n.style.color = '#fff';
        renderSec(n.dataset.sec);
      });
    });

    el.querySelectorAll('.win-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const was = item.classList.contains('open');
        el.querySelectorAll('.win-menu-item.open').forEach(i => i.classList.remove('open'));
        if (!was) item.classList.add('open');
      });
    });
    el.addEventListener('click', () => el.querySelectorAll('.win-menu-item.open').forEach(i => i.classList.remove('open')));

    el.querySelectorAll('.win-dropdown-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        el.querySelectorAll('.win-menu-item.open').forEach(i => i.classList.remove('open'));
        const cmd = opt.dataset.cmd;
        if (cmd === 'exit') window.winManager.closeWindow('app_msinfo32');
        else if (cmd === 'sfc') this.openSfc();
        else if (cmd === 'scanreg') this.openScanReg();
        else if (cmd === 'msconfig') this.openMSConfig();
        else if (cmd === 'dxdiag') this.openDxDiag();
        else if (cmd === 'drwatson') {
          window.winManager.openDialog({
            title: tr('Dr. Watson для Win 98', 'Dr. Watson for Win 98'),
            icon: 'info',
            message: tr('Dr. Watson не обнаружил системных сбоев в текущем сеансе.', 'Dr. Watson detected no system faults in current user session.')
          });
        }
      });
    });
  }

  openSfc() {
    if (window.winManager && window.winManager.windows.has('app_sfc')) {
      window.winManager.bringToTop('app_sfc');
      return;
    }
    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const scanningLabel = isRu ? 'Проверка: ' : 'Scanning: ';
    const content = document.createElement('div');
    content.style.cssText = 'padding:12px; font-family:Tahoma,sans-serif; font-size:11px; background:#c0c0c0; display:flex; flex-direction:column; gap:10px;';
    content.innerHTML = `
      <div style="display:flex; gap:10px; align-items:center;">
        <div style="width:32px; height:32px;">${Icons['sfc'] || Icons['msinfo32']}</div>
        <div>${isRu ? 'Программа проверки системных файлов проверяет целостность системных файлов Win 98 и восстанавливает поврежденные файлы.' : 'System File Checker scans the integrity of your operating system files and restores them if they are corrupted.'}</div>
      </div>

      <fieldset style="border:1px groove #fff; padding:10px;">
        <legend>${isRu ? 'Выберите операцию' : 'Select an option'}</legend>
        <label style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
          <input type="radio" name="sfc-mode" value="scan" checked>
          <span>${isRu ? 'Проверить файлы на наличие ошибок' : 'Scan for altered files'}</span>
        </label>
        <label style="display:flex; align-items:center; gap:6px; margin-bottom:6px;">
          <input type="radio" name="sfc-mode" value="extract">
          <span>${isRu ? 'Извлечь файл с установочного диска:' : 'Extract one file from installation disk:'}</span>
        </label>
        <div style="padding-left:22px; display:flex; gap:6px;">
          <input type="text" id="sfc-extract-name" class="win-inset" value="KERNEL32.DLL" style="flex:1; height:20px; padding:1px 4px;">
        </div>
      </fieldset>

      <div id="sfc-scan-box" style="display:none;">
        <div id="sfc-file-lbl" style="margin-bottom:4px;">${scanningLabel}C:\\WINDOWS\\SYSTEM\\KERNEL32.DLL</div>
        <div class="win-inset" style="height:18px; background:#fff; padding:2px;">
          <div id="sfc-bar" style="width:0%; height:100%; background:#000080;"></div>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:4px;">
        <button class="win-btn default" id="sfc-start-btn" style="min-width:75px;">${isRu ? 'Начать' : 'Start'}</button>
        <button class="win-btn" id="sfc-close-btn" style="min-width:75px;">${isRu ? 'Закрыть' : 'Close'}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_sfc',
      title: isRu ? 'Проверка системных файлов' : 'System File Checker',
      icon: 'sfc',
      width: 410,
      height: 295,
      resizable: false,
      minimizable: true,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = win.element;
    const scanBox = el.querySelector('#sfc-scan-box');
    const fileLbl = el.querySelector('#sfc-file-lbl');
    const bar = el.querySelector('#sfc-bar');
    const startBtn = el.querySelector('#sfc-start-btn');

    const files = [
      'C:\\WINDOWS\\SYSTEM\\KERNEL32.DLL',
      'C:\\WINDOWS\\SYSTEM\\GDI32.DLL',
      'C:\\WINDOWS\\SYSTEM\\USER32.DLL',
      'C:\\WINDOWS\\SYSTEM\\SHELL32.DLL',
      'C:\\WINDOWS\\SYSTEM\\ADVAPI32.DLL',
      'C:\\WINDOWS\\SYSTEM\\VOODOO2.DRV',
      'C:\\WINDOWS\\SYSTEM\\VMM32.VXD',
      'C:\\WINDOWS\\EXPLORER.EXE'
    ];

    startBtn.addEventListener('click', () => {
      const mode = el.querySelector('input[name="sfc-mode"]:checked').value;
      if (mode === 'extract') {
        const fname = el.querySelector('#sfc-extract-name').value.trim() || 'KERNEL32.DLL';
        if (window.vfs) {
          window.vfs.writeFile(['My Computer', 'C:', 'WINDOWS', 'SYSTEM'], fname, 'MZ_CAB_EXTRACTED_WIN98_SE');
        }
        window.winManager.openDialog({
          title: isRu ? 'Извлечение файла' : 'Extract File',
          icon: 'info',
          message: isRu
            ? `Файл "${fname}" успешно извлечен из D:\\WIN98\\WIN98_22.CAB в папку C:\\WINDOWS\\SYSTEM.`
            : `The file "${fname}" has been successfully extracted from D:\\WIN98\\WIN98_22.CAB to C:\\WINDOWS\\SYSTEM.`
        });
        return;
      }

      scanBox.style.display = 'block';
      startBtn.disabled = true;
      let step = 0;
      const timer = setInterval(() => {
        step++;
        const pct = Math.min(100, step * 12.5);
        bar.style.width = pct + '%';
        fileLbl.textContent = scanningLabel + files[(step - 1) % files.length];
        if (pct >= 100) {
          clearInterval(timer);
          startBtn.disabled = false;
          if (window.soundSys && window.soundSys.playNotification) window.soundSys.playNotification();
          window.winManager.openDialog({
            title: isRu ? 'Проверка системных файлов' : 'System File Checker',
            icon: 'info',
            message: isRu
              ? 'Проверка системных файлов завершена.\nИзмененных или поврежденных системных файлов не обнаружено.'
              : 'System File Checker has finished scanning your computer.\nNo corrupted or modified system files were detected.'
          });
        }
      }, 150);
    });

    el.querySelector('#sfc-close-btn').addEventListener('click', () => window.winManager.closeWindow('app_sfc'));
  }

  openScanReg() {
    if (window.winManager && window.winManager.windows.has('app_scanreg')) {
      window.winManager.bringToTop('app_scanreg');
      return;
    }
    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const checkerTitle = isRu ? 'Проверка реестра Win' : 'Win Registry Checker';
    const content = document.createElement('div');
    content.style.cssText = 'padding:12px; font-family:Tahoma,sans-serif; font-size:11px; background:#c0c0c0; display:flex; flex-direction:column; gap:10px;';
    content.innerHTML = `
      <div style="display:flex; gap:10px; align-items:center;">
        <div style="width:32px; height:32px;">${Icons['regedit'] || ''}</div>
        <div>
          <div style="font-weight:bold;">${checkerTitle}</div>
          <div id="scanreg-status">${isRu ? 'Проверка системного реестра (SYSTEM.DAT, USER.DAT)...' : 'Scanning the System Registry (SYSTEM.DAT, USER.DAT)...'}</div>
        </div>
      </div>
      <div class="win-inset" style="height:18px; background:#fff; padding:2px;">
        <div id="scanreg-bar" style="width:0%; height:100%; background:#000080;"></div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_scanreg',
      title: checkerTitle,
      icon: 'regedit',
      width: 350,
      height: 140,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const bar = win.element.querySelector('#scanreg-bar');
    let pct = 0;
    const timer = setInterval(() => {
      pct += 20;
      bar.style.width = pct + '%';
      if (pct >= 100) {
        clearInterval(timer);
        window.winManager.closeWindow('app_scanreg');
        window.winManager.openDialog({
          title: checkerTitle,
          icon: 'question',
          message: isRu
            ? 'Проверка системного реестра завершена без ошибок.\nСоздать резервную копию системного реестра (RB001.CAB) сейчас?'
            : 'Win Registry Checker has scanned the system registry and found no errors.\nDo you want to back up the registry (RB001.CAB) again now?',
          buttons: [
            {
              text: isRu ? 'Да' : 'Yes',
              primary: true,
              action: () => {
                if (window.vfs) {
                  window.vfs.writeFile(['My Computer', 'C:', 'WINDOWS'], 'RB001.CAB', 'MSCF_REGISTRY_BACKUP_SYSTEM_DAT_USER_DAT');
                }
                if (window.appClippy && typeof window.appClippy.onRegistryBackup === 'function') {
                  setTimeout(() => window.appClippy.onRegistryBackup(), 600);
                }
                window.winManager.openDialog({
                  title: checkerTitle,
                  icon: 'info',
                  message: isRu ? 'Резервная копия реестра сохранена в C:\\WINDOWS\\RB001.CAB.' : 'Registry backup completed (C:\\WINDOWS\\RB001.CAB).'
                });
              }
            },
            { text: isRu ? 'Нет' : 'No', action: () => {} }
          ]
        });
      }
    }, 140);
  }

  openScheduledTasks() {
    if (window.winManager && window.winManager.windows.has('app_mstask')) {
      window.winManager.bringToTop('app_mstask');
      return;
    }
    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const tr = (ru, en) => (isRu ? ru : en);
    const readyStatus = tr('Готово', 'Ready');
    const tasks = [
      { name: tr('Очистка диска (C:)', 'Disk Cleanup (C:)'), schedule: tr('Еженедельно — по пятницам в 20:00', 'Weekly — Every Friday at 8:00 PM'), nextRun: tr('Пятница 20:00', 'Friday 8:00 PM'), status: readyStatus, cmd: 'cleanmgr' },
      { name: tr('Дефрагментация диска (C:)', 'Disk Defragmenter (C:)'), schedule: tr('Еженедельно — по средам в 22:00', 'Weekly — Every Wednesday at 10:00 PM'), nextRun: tr('Среда 22:00', 'Wednesday 10:00 PM'), status: readyStatus, cmd: 'defrag' },
      { name: tr('ScanDisk, стандартная проверка (C:)', 'ScanDisk Standard (C:)'), schedule: tr('Ежедневно в 12:00', 'Daily at 12:00 PM'), nextRun: tr('Завтра 12:00', 'Tomorrow 12:00 PM'), status: readyStatus, cmd: 'scandisk' }
    ];

    const content = document.createElement('div');
    content.style.cssText = 'display:flex; flex-direction:column; height:100%; background:#c0c0c0; font-family:Tahoma,sans-serif; font-size:11px;';
    content.innerHTML = `
      <div style="padding:6px; display:flex; gap:6px; border-bottom:1px solid #808080;">
        <button class="win-btn" id="mstask-add-btn">➕ ${tr('Добавить задание...', 'Add Scheduled Task...')}</button>
        <button class="win-btn" id="mstask-run-btn">▶ ${tr('Выполнить сейчас', 'Run Selected Now')}</button>
      </div>
      <div class="win-inset" style="flex:1; background:#fff; margin:4px; overflow:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:11px;">
          <thead>
            <tr style="background:#c0c0c0; text-align:left;">
              <th style="border:1px outset #fff; padding:3px 6px;">${tr('Имя', 'Name')}</th>
              <th style="border:1px outset #fff; padding:3px 6px;">${tr('Расписание', 'Schedule')}</th>
              <th style="border:1px outset #fff; padding:3px 6px;">${tr('Следующий запуск', 'Next Run Time')}</th>
              <th style="border:1px outset #fff; padding:3px 6px;">${tr('Состояние', 'Status')}</th>
            </tr>
          </thead>
          <tbody id="mstask-tbody"></tbody>
        </table>
      </div>
      <div class="win-statusbar" style="padding:2px 6px;">${tr('Планировщик заданий работает', 'Task Scheduler is active')}</div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_mstask',
      title: tr('Назначенные задания', 'Scheduled Tasks'),
      icon: 'mstask',
      width: 560,
      height: 310,
      content
    });

    const el = win.element;
    const tbody = el.querySelector('#mstask-tbody');
    let selectedIdx = 0;

    const renderTasks = () => {
      tbody.innerHTML = tasks.map((t, idx) => `
        <tr class="mstask-row" data-idx="${idx}" style="cursor:pointer; background:${idx === selectedIdx ? '#000080' : 'transparent'}; color:${idx === selectedIdx ? '#fff' : '#000'};">
          <td style="padding:3px 6px;">⏰ ${t.name}</td>
          <td style="padding:3px 6px;">${t.schedule}</td>
          <td style="padding:3px 6px;">${t.nextRun}</td>
          <td style="padding:3px 6px;">${t.status}</td>
        </tr>
      `).join('');
      tbody.querySelectorAll('.mstask-row').forEach(r => {
        r.addEventListener('click', () => {
          selectedIdx = parseInt(r.dataset.idx, 10);
          renderTasks();
        });
      });
    };
    renderTasks();

    el.querySelector('#mstask-add-btn').addEventListener('click', () => {
      tasks.push({
        name: tr('Резервное копирование реестра Win', 'Win Registry Backup'),
        schedule: tr('При загрузке системы', 'At System Startup'),
        nextRun: tr('При следующей загрузке', 'Next Boot'),
        status: readyStatus,
        cmd: 'scanreg'
      });
      selectedIdx = tasks.length - 1;
      renderTasks();
    });

    el.querySelector('#mstask-run-btn').addEventListener('click', () => {
      const task = tasks[selectedIdx];
      if (!task) return;
      if (task.cmd === 'cleanmgr') this.openCleanMgr();
      else if (task.cmd === 'defrag' && window.appDefrag) window.appDefrag.open();
      else if (task.cmd === 'scandisk') this.openScanDisk();
      else if (task.cmd === 'scanreg') this.openScanReg();
    });
  }

  openDriveSpace() {
    if (window.winManager && window.winManager.windows.has('app_drvspace')) {
      window.winManager.bringToTop('app_drvspace');
      return;
    }
    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const tr = (ru, en) => (isRu ? ru : en);
    let compressed = false;
    const plainRow = tr('💿 C:  WIN98_SE  (FAT32 без сжатия — свободно 1,454 МБ)', '💿 C:  WIN98_SE  (Uncompressed FAT32 — 1,454 MB Free)');
    const compressBtnLabel = tr('Сжать диск...', 'Compress Drive...');

    const content = document.createElement('div');
    content.style.cssText = 'padding:10px; font-family:Tahoma,sans-serif; font-size:11px; background:#c0c0c0; display:flex; flex-direction:column; gap:10px;';
    content.innerHTML = `
      <div>${tr('Диски на этом компьютере:', 'Drives on this computer:')}</div>
      <div class="win-inset" style="background:#fff; height:85px; padding:4px;">
        <div style="padding:3px 6px; background:#000080; color:#fff;" id="drv-row-c">${plainRow}</div>
        <div style="padding:3px 6px;">${tr('💾 A:  Дискета 3½ (1.44 МБ, съемный диск)', '💾 A:  3½ Floppy (1.44 MB Removable)')}</div>
      </div>

      <fieldset style="border:1px groove #fff; padding:8px;">
        <legend>${tr('Состояние DriveSpace 3', 'DriveSpace 3 Status')}</legend>
        <div id="drv-status-text">${tr('Диск C не сжат. Нажмите "Сжать диск...", чтобы увеличить свободное место с помощью DriveSpace 3.', 'Drive C is not compressed. Click Compress Drive to increase free space using DriveSpace 3.')}</div>
      </fieldset>

      <div style="display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn default" id="drv-compress-btn">${compressBtnLabel}</button>
        <button class="win-btn" id="drv-close-btn">${tr('Закрыть', 'Close')}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_drvspace',
      title: 'DriveSpace 3',
      icon: 'drvspace',
      width: 390,
      height: 265,
      resizable: false,
      minimizable: true,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = win.element;
    el.querySelector('#drv-compress-btn').addEventListener('click', () => {
      compressed = !compressed;
      el.querySelector('#drv-row-c').textContent = compressed
        ? tr('💿 C:  WIN98_SE  (Сжат DriveSpace 3 — коэффициент 1.9:1 — свободно 2,610 МБ)', '💿 C:  WIN98_SE  (Compressed DriveSpace 3 — Ratio 1.9:1 — 2,610 MB Free)')
        : plainRow;
      el.querySelector('#drv-status-text').textContent = compressed
        ? tr('Диск C сжат с помощью DriveSpace 3 (расчетный коэффициент сжатия: 1.9 к 1.0, основной диск H:).', 'Drive C is compressed with DriveSpace 3 (Estimated compression ratio: 1.9 to 1.0, Host drive H:).')
        : tr('Диск C не сжат.', 'Drive C is not compressed.');
      el.querySelector('#drv-compress-btn').textContent = compressed
        ? tr('Распаковать', 'Uncompress')
        : compressBtnLabel;
      if (window.soundSys && window.soundSys.playNotification) window.soundSys.playNotification();
    });
    el.querySelector('#drv-close-btn').addEventListener('click', () => window.winManager.closeWindow('app_drvspace'));
  }
}

window.appSysTools = new AppSysTools();

