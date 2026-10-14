/**
 * Win 98 Control Panel Applets:
 * - timedate.cpl (Date/Time Properties)
 * - sysdm.cpl (System Properties)
 * - main.cpl (Mouse Properties)
 * - mmsys.cpl (Multimedia & Sounds)
 * - appwiz.cpl (Add/Remove Programs)
 * - inetcpl.cpl (Internet Properties)
 */

class AppCPanel {
  constructor() {}

  t(k, ...args) {
    return window.i18n ? window.i18n.t(k, ...args) : k;
  }

  // ==========================================================
  // 1. Date and Time (timedate.cpl)
  // ==========================================================
  openTimeDateProperties() {
    if (window.winManager && window.winManager.windows.has('app_timedate_cpl')) {
      window.winManager.bringToTop('app_timedate_cpl');
      return;
    }

    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '390px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDay = currentDate.getDate();

    const monthsRu = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const daysRu = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const daysEn = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const monthNames = isRu ? monthsRu : monthsEn;
    const dayHeaders = isRu ? daysRu : daysEn;

    content.innerHTML = `
      <!-- Property Sheet Tab Strip -->
      <div style="display:flex; border-bottom:1px solid #808080; margin-bottom:8px;">
        <button class="win-tab-btn active" data-tab="tab-timedate" style="padding:3px 10px; font-weight:bold; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:var(--win-bg);">${this.t('timedate.tabTimeDate')}</button>
        <button class="win-tab-btn" data-tab="tab-timezone" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${this.t('timedate.tabTimeZone')}</button>
      </div>

      <!-- Tab 1: Date & Time -->
      <div class="timedate-tab-content" id="tab-timedate" style="display:block;">
        <div style="display:flex; gap:12px;">
          <!-- Left: Date Calendar -->
          <fieldset class="bevel-groove" style="flex:1; padding:6px 8px;">
            <legend>${isRu ? 'Дата' : 'Date'}</legend>
            <div style="display:flex; gap:4px; margin-bottom:6px;">
              <select id="timedate-month-select" style="flex:1; height:22px; font-size:11px;">
                ${monthNames.map((m, idx) => `<option value="${idx}" ${idx === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
              <input type="number" id="timedate-year-input" min="1980" max="2099" value="${currentYear}" style="width:55px; height:22px; font-size:11px;">
            </div>
            <div class="timedate-calendar">
              <div class="timedate-calendar-grid" id="timedate-cal-grid"></div>
            </div>
          </fieldset>

          <!-- Right: Analog Clock & Digital Display -->
          <fieldset class="bevel-groove" style="width:130px; padding:6px 8px; display:flex; flex-direction:column; align-items:center;">
            <legend>${isRu ? 'Время' : 'Time'}</legend>
            <div class="timedate-clock-container">
              <canvas class="timedate-clock-canvas" id="timedate-canvas" width="110" height="110"></canvas>
              <div class="timedate-digital-time" id="timedate-digital">00:00:00</div>
            </div>
          </fieldset>
        </div>
      </div>

      <!-- Tab 2: Time Zone -->
      <div class="timedate-tab-content" id="tab-timezone" style="display:none;">
        <fieldset class="bevel-groove" style="padding:10px;">
          <legend>${this.t('timedate.tabTimeZone')}</legend>
          <div style="margin-bottom:8px; font-size:11px;">${this.t('timedate.timeZoneLabel')}</div>
          <select id="timedate-tz-select" style="width:100%; height:24px; font-size:11px;">
            <option value="3" selected>(GMT+03:00) ${isRu ? 'Москва, Санкт-Петербург, Волгоград' : 'Moscow, St. Petersburg, Volgograd'}</option>
            <option value="0">(GMT) Greenwich Mean Time : Dublin, Edinburgh, London</option>
            <option value="-5">(GMT-05:00) Eastern Time (US & Canada)</option>
            <option value="-8">(GMT-08:00) Pacific Time (US & Canada)</option>
            <option value="1">(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm</option>
            <option value="9">(GMT+09:00) Tokyo, Osaka, Sapporo</option>
          </select>
          <div style="margin-top:16px; display:flex; align-items:center; gap:6px;">
            <input type="checkbox" id="timedate-dst" checked>
            <label for="timedate-dst" style="font-size:11px;">${isRu ? 'Автоматический переход на летнее время и обратно' : 'Automatically adjust clock for daylight saving changes'}</label>
          </div>
        </fieldset>
      </div>

      <!-- Bottom Dialog Buttons -->
      <div class="win-dialog-buttons" style="margin-top:12px; display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn btn-td-ok" style="font-weight:bold; min-width:70px;">${this.t('btn.ok')}</button>
        <button class="win-btn btn-td-cancel" style="min-width:70px;">${this.t('btn.cancel')}</button>
        <button class="win-btn btn-td-apply" style="min-width:70px;">${this.t('btn.apply')}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_timedate_cpl',
      title: this.t('timedate.title'),
      icon: 'timedate',
      width: 420,
      height: 310,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = dialog.element;

    // Tab switching
    el.querySelectorAll('.win-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        el.querySelectorAll('.win-tab-btn').forEach(b => {
          b.style.background = '#d4d0c8';
          b.style.fontWeight = 'normal';
        });
        tabBtn.style.background = 'var(--win-bg)';
        tabBtn.style.fontWeight = 'bold';

        el.querySelectorAll('.timedate-tab-content').forEach(tc => tc.style.display = 'none');
        const target = el.querySelector(`#${tabBtn.dataset.tab}`);
        if (target) target.style.display = 'block';
      });
    });

    // Render calendar
    const monthSelect = el.querySelector('#timedate-month-select');
    const yearInput = el.querySelector('#timedate-year-input');
    const calGrid = el.querySelector('#timedate-cal-grid');

    const renderCalendar = () => {
      calGrid.innerHTML = '';
      dayHeaders.forEach(dh => {
        const dEl = document.createElement('div');
        dEl.className = 'timedate-calendar-header';
        dEl.textContent = dh;
        calGrid.appendChild(dEl);
      });

      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      // Adjust Sunday (0) to 6 for Russian Mon-Sun convention, or keep
      const offset = isRu ? (firstDay === 0 ? 6 : firstDay - 1) : firstDay;
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      for (let i = 0; i < offset; i++) {
        const blank = document.createElement('div');
        blank.className = 'timedate-calendar-day';
        calGrid.appendChild(blank);
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dEl = document.createElement('div');
        dEl.className = 'timedate-calendar-day' + (d === selectedDay ? ' selected' : '');
        dEl.textContent = d;
        dEl.addEventListener('click', () => {
          el.querySelectorAll('.timedate-calendar-day').forEach(cd => cd.classList.remove('selected'));
          dEl.classList.add('selected');
          selectedDay = d;
          if (window.soundSys) window.soundSys.playClick();
        });
        calGrid.appendChild(dEl);
      }
    };

    monthSelect.addEventListener('change', () => {
      currentMonth = parseInt(monthSelect.value);
      renderCalendar();
    });

    yearInput.addEventListener('input', () => {
      currentYear = parseInt(yearInput.value) || 1998;
      renderCalendar();
    });

    renderCalendar();

    // Canvas Analog Clock
    const canvas = el.querySelector('#timedate-canvas');
    const digitalEl = el.querySelector('#timedate-digital');
    const ctx = canvas.getContext('2d');

    const drawClock = () => {
      const now = new Date();
      const hrs = now.getHours();
      const mins = now.getMinutes();
      const secs = now.getSeconds();

      digitalEl.textContent = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      ctx.clearRect(0, 0, 110, 110);
      const cx = 55, cy = 55, r = 48;

      // Clock face ticks
      ctx.strokeStyle = '#808080';
      ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        const x1 = cx + Math.cos(angle) * (r - 4);
        const y1 = cy + Math.sin(angle) * (r - 4);
        const x2 = cx + Math.cos(angle) * (r - 1);
        const y2 = cy + Math.sin(angle) * (r - 1);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Hour hand
      const hrAngle = ((hrs % 12) + mins / 60) * (Math.PI / 6) - Math.PI / 2;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(hrAngle) * 26, cy + Math.sin(hrAngle) * 26);
      ctx.stroke();

      // Minute hand
      const minAngle = (mins + secs / 60) * (Math.PI / 30) - Math.PI / 2;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(minAngle) * 38, cy + Math.sin(minAngle) * 38);
      ctx.stroke();

      // Second hand
      const secAngle = secs * (Math.PI / 30) - Math.PI / 2;
      ctx.strokeStyle = '#cc0000';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(secAngle) * 42, cy + Math.sin(secAngle) * 42);
      ctx.stroke();

      // Center pin
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    };

    drawClock();
    const clockInterval = setInterval(drawClock, 1000);

    const cleanup = () => {
      clearInterval(clockInterval);
      window.winManager.closeWindow('app_timedate_cpl');
    };

    el.querySelector('.btn-td-ok').addEventListener('click', () => {
      if (window.soundSys) window.soundSys.playClick();
      cleanup();
    });

    el.querySelector('.btn-td-cancel').addEventListener('click', cleanup);

    el.querySelector('.btn-td-apply').addEventListener('click', () => {
      if (window.soundSys) window.soundSys.playClick();
    });
  }

  // ==========================================================
  // 2. System Properties (sysdm.cpl)
  // ==========================================================
  openSystemProperties() {
    if (window.winManager && window.winManager.windows.has('app_system_cpl')) {
      window.winManager.bringToTop('app_system_cpl');
      return;
    }

    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '410px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';

    const devicesData = [
      {
        name: 'Computer',
        items: ['Advanced Configuration and Power Interface (ACPI) BIOS']
      },
      {
        name: 'CD-ROM',
        items: ['TOSHIBA CD-ROM XM-6202B (32X IDE)']
      },
      {
        name: 'Disk drives',
        items: ['GENERIC IDE DISK TYPE47 (12.4 GB)']
      },
      {
        name: 'Display adapters',
        items: ['3dfx Voodoo2 3Dfx Interactive Glide (12 MB)', 'S3 Trio64V2/DX PCI (4 MB)']
      },
      {
        name: 'Hard disk controllers',
        items: ['Intel 82371AB/EB PCI Bus Master IDE Controller', 'Primary IDE controller (dual fifo)', 'Secondary IDE controller (dual fifo)']
      },
      {
        name: 'Keyboard',
        items: ['Standard 101/102-Key or Microslop Natural Keyboard']
      },
      {
        name: 'Mouse',
        items: ['Microslop PS/2 Port Mouse']
      },
      {
        name: 'Ports (COM & LPT)',
        items: ['Communications Port (COM1)', 'Communications Port (COM2)', 'Printer Port (LPT1)']
      },
      {
        name: 'Sound, video and game controllers',
        items: ['Creative Sound Blaster AWE64 Gold (ISA)', 'Gameport Joystick']
      }
    ];

    const cpuInfo = (window.biosEngine && typeof window.biosEngine.getEffectiveCpuSpecs === 'function')
      ? window.biosEngine.getEffectiveCpuSpecs()
      : { name: 'GenuineIntel Pentium(R) II Processor', frequency: 450, ramMb: 128 };

    content.innerHTML = `
      <!-- Property Sheet Tab Strip -->
      <div style="display:flex; border-bottom:1px solid #808080; margin-bottom:8px;">
        <button class="win-tab-btn active" data-tab="tab-sys-general" style="padding:3px 10px; font-weight:bold; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:var(--win-bg);">${this.t('sysdm.tabGeneral')}</button>
        <button class="win-tab-btn" data-tab="tab-sys-devmgr" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${this.t('sysdm.tabDeviceMgr')}</button>
        <button class="win-tab-btn" data-tab="tab-sys-perf" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${this.t('sysdm.tabPerf')}</button>
      </div>

      <!-- Tab 1: General -->
      <div class="sys-tab-content" id="tab-sys-general" style="display:block;">
        <div style="display:flex; gap:16px; align-items:flex-start; margin-bottom:12px;">
          <div style="width:48px; height:48px; flex-shrink:0;">${Icons['start-logo']}</div>
          <div style="font-size:11px; line-height:1.4;">
            <p><strong>${this.t('sysdm.systemHeading')}</strong></p>
            <p style="margin-left:12px;">Microslop Win 98<br>Second Edition<br>4.10.1998 A</p>
            
            <p style="margin-top:10px;"><strong>${this.t('sysdm.registeredTo')}</strong></p>
            <p style="margin-left:12px;">Retro Enthusiast<br>Cyber Deck 98<br>OEM-0012984-58932</p>

            <p style="margin-top:10px;"><strong>${this.t('sysdm.computer')}</strong></p>
            <p style="margin-left:12px;">${cpuInfo.name}<br>Intel MMX(TM) Technology ${cpuInfo.frequency}MHz<br>${cpuInfo.ramMb}.0MB RAM</p>
          </div>
        </div>
      </div>

      <!-- Tab 2: Device Manager -->
      <div class="sys-tab-content" id="tab-sys-devmgr" style="display:none;">
        <div style="display:flex; gap:10px; margin-bottom:6px; font-size:11px;">
          <label><input type="radio" name="dm-view" value="type" checked> ${isRu ? 'По типам устройств' : 'View devices by type'}</label>
          <label><input type="radio" name="dm-view" value="conn"> ${isRu ? 'По подключению' : 'View devices by connection'}</label>
        </div>
        <div class="device-manager-tree" id="dm-tree"></div>
        <div style="margin-top:8px; display:flex; justify-content:flex-end; gap:6px;">
          <button class="win-btn" id="btn-dm-prop" style="min-width:85px;" disabled>${this.t('sysdm.propBtn')}</button>
          <button class="win-btn" id="btn-dm-refresh" style="min-width:85px;">${isRu ? 'Обновить' : 'Refresh'}</button>
        </div>
      </div>

      <!-- Tab 3: Performance -->
      <div class="sys-tab-content" id="tab-sys-perf" style="display:none;">
        <fieldset class="bevel-groove" style="padding:8px 12px; font-size:11px; line-height:1.5;">
          <legend>${isRu ? 'Состояние производительности' : 'Performance status'}</legend>
          <div style="display:grid; grid-template-columns:130px 1fr; gap:4px;">
            <div style="color:#555;">${isRu ? 'Память:' : 'Memory:'}</div>
            <div><strong>64.0 MB of RAM</strong></div>
            <div style="color:#555;">${isRu ? 'Ресурсы системы:' : 'System Resources:'}</div>
            <div><strong>89% free</strong></div>
            <div style="color:#555;">${isRu ? 'Файловая система:' : 'File System:'}</div>
            <div>32-bit</div>
            <div style="color:#555;">${isRu ? 'Виртуальная память:' : 'Virtual Memory:'}</div>
            <div>32-bit</div>
            <div style="color:#555;">${isRu ? 'Сжатие диска:' : 'Disk Compression:'}</div>
            <div>${isRu ? 'Не установлено' : 'Not installed'}</div>
          </div>
        </fieldset>
        <fieldset class="bevel-groove" style="margin-top:8px; padding:8px 12px; font-size:11px;">
          <legend>${isRu ? 'Дополнительные параметры' : 'Advanced settings'}</legend>
          <div style="display:flex; gap:8px;">
            <button class="win-btn" id="btn-perf-fs" style="flex:1;">${isRu ? 'Файловая система...' : 'File System...'}</button>
            <button class="win-btn" id="btn-perf-gfx" style="flex:1;">${isRu ? 'Графика...' : 'Graphics...'}</button>
            <button class="win-btn" id="btn-perf-vmem" style="flex:1;">${isRu ? 'Вирт. память...' : 'Virtual Memory...'}</button>
          </div>
        </fieldset>
      </div>

      <!-- Bottom Buttons -->
      <div class="win-dialog-buttons" style="margin-top:12px; display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn btn-sys-ok" style="font-weight:bold; min-width:70px;">${this.t('btn.ok')}</button>
        <button class="win-btn btn-sys-cancel" style="min-width:70px;">${this.t('btn.cancel')}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_system_cpl',
      title: this.t('sysdm.title'),
      icon: 'system',
      width: 440,
      height: 380,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = dialog.element;

    // Tab switching
    el.querySelectorAll('.win-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        el.querySelectorAll('.win-tab-btn').forEach(b => {
          b.style.background = '#d4d0c8';
          b.style.fontWeight = 'normal';
        });
        tabBtn.style.background = 'var(--win-bg)';
        tabBtn.style.fontWeight = 'bold';

        el.querySelectorAll('.sys-tab-content').forEach(tc => tc.style.display = 'none');
        const target = el.querySelector(`#${tabBtn.dataset.tab}`);
        if (target) target.style.display = 'block';
      });
    });

    // Build Device Manager tree
    const treeEl = el.querySelector('#dm-tree');
    const btnProp = el.querySelector('#btn-dm-prop');
    let selectedDevice = null;

    const renderTree = () => {
      treeEl.innerHTML = '';
      devicesData.forEach(cat => {
        const catRow = document.createElement('div');
        catRow.className = 'dm-tree-node';
        catRow.innerHTML = `<span class="dm-tree-expander">+</span> <strong>${cat.name}</strong>`;
        
        const childrenBox = document.createElement('div');
        childrenBox.className = 'dm-tree-children';
        childrenBox.style.display = 'none';

        cat.items.forEach(item => {
          const itemRow = document.createElement('div');
          itemRow.className = 'dm-tree-node';
          itemRow.innerHTML = `<span style="width:12px; height:12px; display:inline-block;">${Icons['folder']}</span> <span>${item}</span>`;
          itemRow.addEventListener('click', (e) => {
            e.stopPropagation();
            el.querySelectorAll('.dm-tree-node').forEach(n => n.classList.remove('selected'));
            itemRow.classList.add('selected');
            selectedDevice = item;
            btnProp.disabled = false;
          });
          childrenBox.appendChild(itemRow);
        });

        const expander = catRow.querySelector('.dm-tree-expander');
        catRow.addEventListener('click', () => {
          const isOpen = childrenBox.style.display === 'block';
          childrenBox.style.display = isOpen ? 'none' : 'block';
          expander.textContent = isOpen ? '+' : '-';
        });

        treeEl.appendChild(catRow);
        treeEl.appendChild(childrenBox);
      });
    };

    renderTree();

    btnProp.addEventListener('click', () => {
      if (!selectedDevice) return;
      window.winManager.openDialog({
        title: selectedDevice,
        icon: 'info',
        message: `<strong>${selectedDevice}</strong><br><br>${isRu ? 'Устройство работает нормально.' : 'This device is working properly.'}<br>Driver: Microslop 4.10.1998<br>Resource: IRQ 11, Memory Range 000C0000 - 000C7FFF`
      });
    });

    el.querySelector('#btn-dm-refresh').addEventListener('click', () => {
      if (window.soundSys) window.soundSys.playClick();
      renderTree();
    });

    const btnFs = el.querySelector('#btn-perf-fs');
    if (btnFs) {
      btnFs.addEventListener('click', () => this.openFileSystemProperties());
    }

    const btnGfx = el.querySelector('#btn-perf-gfx');
    if (btnGfx) {
      btnGfx.addEventListener('click', () => this.openGraphicsProperties());
    }

    const btnVmem = el.querySelector('#btn-perf-vmem');
    if (btnVmem) {
      btnVmem.addEventListener('click', () => this.openVirtualMemoryProperties());
    }

    el.querySelector('.btn-sys-ok').addEventListener('click', () => {
      window.winManager.closeWindow('app_system_cpl');
    });

    el.querySelector('.btn-sys-cancel').addEventListener('click', () => {
      window.winManager.closeWindow('app_system_cpl');
    });
  }

  // ==========================================================
  // System Properties - Performance sub-dialogs
  // ==========================================================
  openFileSystemProperties() {
    if (window.winManager && window.winManager.windows.has('app_perf_fs')) {
      window.winManager.bringToTop('app_perf_fs');
      return;
    }

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '380px';

    content.innerHTML = `
      <div style="display:flex; border-bottom:1px solid #808080; margin-bottom:8px;">
        <button class="win-tab-btn active" data-tab="tab-fs-hd" style="padding:3px 10px; font-weight:bold; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:var(--win-bg);">${isRu ? 'Жесткий диск' : 'Hard Disk'}</button>
        <button class="win-tab-btn" data-tab="tab-fs-cd" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${isRu ? 'Компакт-диски' : 'CD-ROM'}</button>
        <button class="win-tab-btn" data-tab="tab-fs-trouble" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${isRu ? 'Устранение неполадок' : 'Troubleshooting'}</button>
      </div>

      <!-- Tab 1: Hard Disk -->
      <div class="fs-tab-content" id="tab-fs-hd" style="display:block; font-size:11px;">
        <p style="margin-bottom:8px; line-height:1.4;">
          ${isRu ? 'Win использует эти параметры для оптимизации производительности файловой системы на жестких дисках.' : 'Win uses these settings to optimize performance of the 32-bit file system on hard drives.'}
        </p>
        <fieldset class="bevel-groove" style="padding:8px 10px; margin-bottom:8px;">
          <legend>${isRu ? 'Параметры' : 'Settings'}</legend>
          <div style="margin-bottom:8px;">
            <label for="fs-role-select" style="display:block; margin-bottom:4px;">${isRu ? 'Типичная роль этого компьютера:' : 'Typical role of this computer:'}</label>
            <select id="fs-role-select" class="win-select" style="width:100%; font-size:11px; font-family:var(--win-font, Tahoma, sans-serif);">
              <option value="desktop" selected>${isRu ? 'Настольный компьютер' : 'Desktop computer'}</option>
              <option value="mobile">${isRu ? 'Мобильный или переносной компьютер' : 'Mobile or docking system'}</option>
              <option value="server">${isRu ? 'Сетевой сервер' : 'Network server'}</option>
            </select>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
              <span>${isRu ? 'Опережающее чтение:' : 'Read-ahead optimization:'}</span>
              <span id="lbl-readahead" style="font-weight:bold;">${isRu ? 'Полное' : 'Full'}</span>
            </div>
            <input type="range" id="fs-readahead-slider" min="0" max="3" value="3" style="width:100%;">
            <div style="display:flex; justify-content:space-between; font-size:10px; color:#555;">
              <span>${isRu ? 'Нет' : 'None'}</span>
              <span>${isRu ? 'Полное' : 'Full'}</span>
            </div>
          </div>
        </fieldset>
      </div>

      <!-- Tab 2: CD-ROM -->
      <div class="fs-tab-content" id="tab-fs-cd" style="display:none; font-size:11px;">
        <p style="margin-bottom:8px; line-height:1.4;">
          ${isRu ? 'Win оптимизирует параметры производительности для всех приводов CD-ROM.' : 'Win uses these settings to optimize caching for CD-ROM drives.'}
        </p>
        <fieldset class="bevel-groove" style="padding:8px 10px; margin-bottom:8px;">
          <legend>${isRu ? 'Параметры' : 'Settings'}</legend>
          <div style="margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
              <span>${isRu ? 'Дополнительный размер кэша:' : 'Supplemental cache size:'}</span>
              <span id="lbl-cd-cache" style="font-weight:bold;">${isRu ? 'Большой (1238 КБ)' : 'Large (1238 KB)'}</span>
            </div>
            <input type="range" id="fs-cd-slider" min="0" max="2" value="2" style="width:100%;">
            <div style="display:flex; justify-content:space-between; font-size:10px; color:#555;">
              <span>${isRu ? 'Малый' : 'Small'}</span>
              <span>${isRu ? 'Большой' : 'Large'}</span>
            </div>
          </div>
          <div>
            <label for="fs-cd-speed" style="display:block; margin-bottom:4px;">${isRu ? 'Оптимизировать доступ для:' : 'Optimize access pattern for:'}</label>
            <select id="fs-cd-speed" class="win-select" style="width:100%; font-size:11px; font-family:var(--win-font, Tahoma, sans-serif);">
              <option value="4x" selected>${isRu ? 'Четырехскоростной или более быстрый (32X)' : 'Quad-speed or higher (32X)'}</option>
              <option value="3x">${isRu ? 'Трехскоростной' : 'Triple-speed'}</option>
              <option value="2x">${isRu ? 'Двухскоростной' : 'Double-speed'}</option>
              <option value="1x">${isRu ? 'Односкоростной' : 'Single-speed'}</option>
              <option value="0">${isRu ? 'Без оптимизации' : 'No read-ahead'}</option>
            </select>
          </div>
        </fieldset>
      </div>

      <!-- Tab 3: Troubleshooting -->
      <div class="fs-tab-content" id="tab-fs-trouble" style="display:none; font-size:11px;">
        <p style="margin-bottom:8px; line-height:1.4;">
          ${isRu ? 'Не отключайте эти параметры без крайней необходимости.' : 'It is recommended that only advanced users and system administrators use these settings.'}
        </p>
        <fieldset class="bevel-groove" style="padding:8px 10px; margin-bottom:8px; display:flex; flex-direction:column; gap:6px;">
          <legend>${isRu ? 'Параметры' : 'Settings'}</legend>
          <label style="display:flex; gap:6px; align-items:center;">
            <input type="checkbox"> ${isRu ? 'Отключить файловую систему FAT32' : 'Disable FAT32 file system'}
          </label>
          <label style="display:flex; gap:6px; align-items:center;">
            <input type="checkbox"> ${isRu ? 'Отключить защиту отложенной записи для всех дисков' : 'Disable write-behind caching for all drives'}
          </label>
          <label style="display:flex; gap:6px; align-items:center;">
            <input type="checkbox"> ${isRu ? 'Отключить 32-разрядные драйверы режима Protect-mode' : 'Disable protect-mode disk drivers'}
          </label>
        </fieldset>
      </div>

      <div class="win-dialog-buttons" style="margin-top:10px; display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn btn-fs-ok" style="font-weight:bold; min-width:70px;">${this.t('btn.ok')}</button>
        <button class="win-btn btn-fs-cancel" style="min-width:70px;">${this.t('btn.cancel')}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_perf_fs',
      title: isRu ? 'Свойства: Файловая система' : 'File System Properties',
      icon: 'drive-c',
      width: 410,
      height: 330,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = win.element;

    el.querySelectorAll('.win-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        el.querySelectorAll('.win-tab-btn').forEach(b => {
          b.style.background = '#d4d0c8';
          b.style.fontWeight = 'normal';
        });
        btn.style.background = 'var(--win-bg)';
        btn.style.fontWeight = 'bold';

        el.querySelectorAll('.fs-tab-content').forEach(c => c.style.display = 'none');
        const target = el.querySelector(`#${btn.dataset.tab}`);
        if (target) target.style.display = 'block';
      });
    });

    const sliderHd = el.querySelector('#fs-readahead-slider');
    const lblHd = el.querySelector('#lbl-readahead');
    if (sliderHd && lblHd) {
      sliderHd.addEventListener('input', () => {
        const val = parseInt(sliderHd.value, 10);
        lblHd.textContent = val === 3 ? (isRu ? 'Полное' : 'Full') : (val === 2 ? (isRu ? 'Большое' : 'High') : (val === 1 ? (isRu ? 'Низкое' : 'Low') : (isRu ? 'Нет' : 'None')));
      });
    }

    const sliderCd = el.querySelector('#fs-cd-slider');
    const lblCd = el.querySelector('#lbl-cd-cache');
    if (sliderCd && lblCd) {
      sliderCd.addEventListener('input', () => {
        const val = parseInt(sliderCd.value, 10);
        lblCd.textContent = val === 2 ? (isRu ? 'Большой (1238 КБ)' : 'Large (1238 KB)') : (val === 1 ? (isRu ? 'Средний (619 КБ)' : 'Medium (619 KB)') : (isRu ? 'Малый (0 КБ)' : 'Small (0 KB)'));
      });
    }

    const saveControls = window.winManager.rememberControls(el, 'perf_fs');

    el.querySelector('.btn-fs-ok').addEventListener('click', () => {
      if (window.soundSys) window.soundSys.playClick();
      saveControls();
      window.winManager.closeWindow('app_perf_fs');
    });

    el.querySelector('.btn-fs-cancel').addEventListener('click', () => {
      window.winManager.closeWindow('app_perf_fs');
    });
  }

  openGraphicsProperties() {
    if (window.winManager && window.winManager.windows.has('app_perf_gfx')) {
      window.winManager.bringToTop('app_perf_gfx');
      return;
    }

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '370px';
    content.style.fontSize = '11px';

    const descriptions = [
      isRu ? 'Все функции ускорения отключены. Используйте этот параметр только при регулярных критических сбоях видеокарты.' : 'All accelerator functions disabled. Use only if computer frequently halts completely.',
      isRu ? 'Базовые функции ускорения. Подходит при возникновении артефактов и ошибок в графических приложениях.' : 'Basic accelerator functions enabled. Use if you experience display problems.',
      isRu ? 'Большинство функций ускорения включено. Исправляет проблемы с курсором мыши и отрисовкой окон.' : 'Most accelerator functions enabled. Resolves cursor mouse issues and drawing bugs.',
      isRu ? 'Все функции аппаратного ускорения включены (DirectX, Direct3D, Glide). Рекомендуется для большинства ПК.' : 'All accelerator functions are active. Recommended for all systems with 3D accelerators.'
    ];

    content.innerHTML = `
      <p style="margin-bottom:10px; line-height:1.4;">
        ${isRu ? 'Эти параметры определяют степень использования возможностей видеоадаптера операционной системой Win.' : 'These settings control the way Win uses your display hardware.'}
      </p>

      <fieldset class="bevel-groove" style="padding:10px 12px; margin-bottom:12px;">
        <legend>${isRu ? 'Аппаратное ускорение' : 'Hardware acceleration'}</legend>
        <div style="margin-bottom:8px;">
          <input type="range" id="gfx-accel-slider" min="0" max="3" value="3" style="width:100%;">
          <div style="display:flex; justify-content:space-between; font-size:10px; color:#555; margin-top:2px;">
            <span>${isRu ? 'Нет' : 'None'}</span>
            <span>${isRu ? 'Базовое' : 'Basic'}</span>
            <span>${isRu ? 'Большинство' : 'Most'}</span>
            <span>${isRu ? 'Полное' : 'Full'}</span>
          </div>
        </div>
        <div id="gfx-accel-desc" style="padding:6px 8px; background:#ffffea; border:1px inset #808080; min-height:45px; line-height:1.4;">
          ${descriptions[3]}
        </div>
      </fieldset>

      <div class="win-dialog-buttons" style="display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn btn-gfx-ok" style="font-weight:bold; min-width:70px;">${this.t('btn.ok')}</button>
        <button class="win-btn btn-gfx-cancel" style="min-width:70px;">${this.t('btn.cancel')}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_perf_gfx',
      title: isRu ? 'Дополнительные параметры графики' : 'Advanced Graphics Settings',
      icon: 'monitor',
      width: 400,
      height: 250,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = win.element;
    const slider = el.querySelector('#gfx-accel-slider');
    const descEl = el.querySelector('#gfx-accel-desc');

    if (slider && descEl) {
      slider.addEventListener('input', () => {
        const val = parseInt(slider.value, 10);
        descEl.textContent = descriptions[val] || descriptions[3];
      });
    }

    const saveControls = window.winManager.rememberControls(el, 'perf_gfx');

    el.querySelector('.btn-gfx-ok').addEventListener('click', () => {
      if (window.soundSys) window.soundSys.playClick();
      saveControls();
      window.winManager.closeWindow('app_perf_gfx');
    });

    el.querySelector('.btn-gfx-cancel').addEventListener('click', () => {
      window.winManager.closeWindow('app_perf_gfx');
    });
  }

  openVirtualMemoryProperties() {
    if (window.winManager && window.winManager.windows.has('app_perf_vmem')) {
      window.winManager.bringToTop('app_perf_vmem');
      return;
    }

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '370px';
    content.style.fontSize = '11px';

    content.innerHTML = `
      <p style="margin-bottom:10px; line-height:1.4;">
        ${isRu ? 'Эти параметры позволяют задать размер виртуальной памяти (файла подкачки WIN386.SWP), используемой Win.' : 'These settings allow you to specify the amount of hard disk space Win uses for virtual memory.'}
      </p>

      <fieldset class="bevel-groove" style="padding:10px 12px; margin-bottom:10px; display:flex; flex-direction:column; gap:8px;">
        <label style="display:flex; gap:6px; align-items:flex-start;">
          <input type="radio" name="vmem-mode" id="vmem-auto" value="auto" checked>
          <span>${isRu ? 'По выбору системы (рекомендуется)' : 'Let Win manage my virtual memory settings (recommended)'}</span>
        </label>

        <label style="display:flex; gap:6px; align-items:flex-start;">
          <input type="radio" name="vmem-mode" id="vmem-custom" value="custom">
          <span>${isRu ? 'Параметры задаются вручную' : 'Let me specify my own virtual memory settings'}</span>
        </label>

        <div id="vmem-custom-box" style="margin-left:22px; opacity:0.5; pointer-events:none; display:flex; flex-direction:column; gap:6px;">
          <div style="display:grid; grid-template-columns:100px 1fr; gap:6px; align-items:center;">
            <span>${isRu ? 'Жесткий диск:' : 'Hard disk:'}</span>
            <span><strong>C: (10240 MB ${isRu ? 'свободно' : 'free'})</strong></span>

            <label for="vmem-min">${isRu ? 'Минимум (МБ):' : 'Minimum (MB):'}</label>
            <input type="number" id="vmem-min" class="win-input" value="128" style="width:80px; padding:2px 4px; font-size:11px;">

            <label for="vmem-max">${isRu ? 'Максимум (МБ):' : 'Maximum (MB):'}</label>
            <input type="number" id="vmem-max" class="win-input" value="384" style="width:80px; padding:2px 4px; font-size:11px;">
          </div>
        </div>

        <div class="win-menu-separator" style="margin:4px 0;"></div>

        <label style="display:flex; gap:6px; align-items:center; color:#a00;">
          <input type="checkbox" id="vmem-disable">
          <span>${isRu ? 'Отключить виртуальную память (не рекомендуется)' : 'Disable virtual memory (not recommended)'}</span>
        </label>
      </fieldset>

      <div class="win-dialog-buttons" style="display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn btn-vmem-ok" style="font-weight:bold; min-width:70px;">${this.t('btn.ok')}</button>
        <button class="win-btn btn-vmem-cancel" style="min-width:70px;">${this.t('btn.cancel')}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_perf_vmem',
      title: isRu ? 'Виртуальная память' : 'Virtual Memory',
      icon: 'system',
      width: 400,
      height: 290,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = win.element;
    const radioAuto = el.querySelector('#vmem-auto');
    const radioCustom = el.querySelector('#vmem-custom');
    const customBox = el.querySelector('#vmem-custom-box');

    const updateMode = () => {
      const isCustom = radioCustom.checked;
      customBox.style.opacity = isCustom ? '1' : '0.5';
      customBox.style.pointerEvents = isCustom ? 'auto' : 'none';
    };

    radioAuto.addEventListener('change', updateMode);
    radioCustom.addEventListener('change', updateMode);

    const saveControls = window.winManager.rememberControls(el, 'perf_vmem');

    el.querySelector('.btn-vmem-ok').addEventListener('click', () => {
      if (window.soundSys) window.soundSys.playClick();
      saveControls();
      window.winManager.closeWindow('app_perf_vmem');
    });

    el.querySelector('.btn-vmem-cancel').addEventListener('click', () => {
      window.winManager.closeWindow('app_perf_vmem');
    });
  }

  // ==========================================================
  // 3. Mouse Properties (main.cpl)
  // ==========================================================
  openMouseProperties() {
    if (window.winManager && window.winManager.windows.has('app_mouse_cpl')) {
      window.winManager.bringToTop('app_mouse_cpl');
      return;
    }

    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '380px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';

    let isLeftHanded = false;
    let boxOpened = false;
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';

    content.innerHTML = `
      <!-- Property Sheet Tab Strip -->
      <div style="display:flex; border-bottom:1px solid #808080; margin-bottom:8px;">
        <button class="win-tab-btn active" data-tab="tab-mouse-buttons" style="padding:3px 10px; font-weight:bold; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:var(--win-bg);">${this.t('mouse.tabButtons')}</button>
        <button class="win-tab-btn" data-tab="tab-mouse-pointers" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${this.t('mouse.tabPointers')}</button>
        <button class="win-tab-btn" data-tab="tab-mouse-motion" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${this.t('mouse.tabMotion')}</button>
      </div>

      <!-- Tab 1: Buttons -->
      <div class="mouse-tab-content" id="tab-mouse-buttons" style="display:block;">
        <fieldset class="bevel-groove" style="padding:8px;">
          <legend>${this.t('mouse.buttonConfig')}</legend>
          <div style="display:flex; gap:14px; align-items:center;">
            <div style="flex:1;">
              <div class="win-label-row">
                <input type="radio" id="mouse-right" name="mouse-hand" value="right" checked>
                <label for="mouse-right">${this.t('mouse.rightHanded')}</label>
              </div>
              <div class="win-label-row" style="margin-top:6px;">
                <input type="radio" id="mouse-left" name="mouse-hand" value="left">
                <label for="mouse-left">${this.t('mouse.leftHanded')}</label>
              </div>
            </div>
            <div class="mouse-visual-container">
              <div class="mouse-visual-box">
                <div class="mouse-visual-btn-left active" id="vis-left">L</div>
                <div class="mouse-visual-btn-right" id="vis-right">R</div>
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset class="bevel-groove" style="margin-top:8px; padding:8px;">
          <legend>${this.t('mouse.doubleClickSpeed')}</legend>
          <div style="display:flex; gap:12px; align-items:center;">
            <div style="flex:1;">
              <div style="display:flex; justify-content:space-between; font-size:10px; color:#555;">
                <span>${isRu ? 'Низкая' : 'Slow'}</span>
                <span>${isRu ? 'Высокая' : 'Fast'}</span>
              </div>
              <input type="range" id="mouse-dc-speed" min="1" max="10" value="6" style="width:100%;">
            </div>
            <div class="mouse-test-box-wrap" id="mouse-test-box" title="${isRu ? 'Дважды щелкните по коробке' : 'Double-click to test'}">
              <div class="mouse-test-box-icon" id="mouse-box-icon">${Icons['programs']}</div>
              <div style="font-size:9px; margin-top:2px;">${isRu ? 'Тест' : 'Test'}</div>
            </div>
          </div>
        </fieldset>
      </div>

      <!-- Tab 2: Pointers -->
      <div class="mouse-tab-content" id="tab-mouse-pointers" style="display:none;">
        <fieldset class="bevel-groove" style="padding:8px;">
          <legend>${isRu ? 'Схема указателей' : 'Scheme'}</legend>
          <select id="mouse-scheme-select" style="width:100%; height:24px; font-size:11px; margin-bottom:8px;">
            <option value="default" selected>${isRu ? 'Win 98 (Стандартная)' : 'Win Default (system scheme)'}</option>
            <option value="3d">${isRu ? '3D-указатели (Бронза)' : '3D Pointers (bronze)'}</option>
            <option value="dino">${isRu ? 'Динозавры (Анимация Plus!)' : 'Dinosaur (animated Plus!)'}</option>
          </select>
          <div style="border:2px inset #fff; background:#fff; height:110px; padding:6px; display:flex; flex-direction:column; gap:6px; font-size:11px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="width:16px;">⇖</span> <span>${isRu ? 'Основной режим (стрелка)' : 'Normal Select'}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="width:16px;">⏳</span> <span>${isRu ? 'Песочные часы (занято)' : 'Busy'}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="width:16px;">🔍</span> <span>${isRu ? 'Выбор справки (?)' : 'Help Select'}</span>
            </div>
          </div>
        </fieldset>
      </div>

      <!-- Tab 3: Motion -->
      <div class="mouse-tab-content" id="tab-mouse-motion" style="display:none;">
        <fieldset class="bevel-groove" style="padding:8px;">
          <legend>${this.t('mouse.pointerSpeed')}</legend>
          <div style="display:flex; justify-content:space-between; font-size:10px; color:#555;">
            <span>${isRu ? 'Низкая' : 'Slow'}</span>
            <span>${isRu ? 'Высокая' : 'Fast'}</span>
          </div>
          <input type="range" id="mouse-ptr-speed" min="1" max="10" value="5" style="width:100%;">
          <div class="win-label-row" style="margin-top:10px;">
            <input type="checkbox" id="mouse-chk-trails">
            <label for="mouse-chk-trails">${this.t('mouse.pointerTrails')}</label>
          </div>
        </fieldset>
      </div>

      <!-- Bottom Buttons -->
      <div class="win-dialog-buttons" style="margin-top:12px; display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn btn-mouse-ok" style="font-weight:bold; min-width:70px;">${this.t('btn.ok')}</button>
        <button class="win-btn btn-mouse-cancel" style="min-width:70px;">${this.t('btn.cancel')}</button>
        <button class="win-btn btn-mouse-apply" style="min-width:70px;">${this.t('btn.apply')}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_mouse_cpl',
      title: this.t('mouse.title'),
      icon: 'mouse',
      width: 400,
      height: 330,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = dialog.element;

    // Tabs
    el.querySelectorAll('.win-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        el.querySelectorAll('.win-tab-btn').forEach(b => {
          b.style.background = '#d4d0c8';
          b.style.fontWeight = 'normal';
        });
        tabBtn.style.background = 'var(--win-bg)';
        tabBtn.style.fontWeight = 'bold';

        el.querySelectorAll('.mouse-tab-content').forEach(tc => tc.style.display = 'none');
        const target = el.querySelector(`#${tabBtn.dataset.tab}`);
        if (target) target.style.display = 'block';
      });
    });

    // Orientation toggle
    const visLeft = el.querySelector('#vis-left');
    const visRight = el.querySelector('#vis-right');
    el.querySelectorAll('input[name="mouse-hand"]').forEach(r => {
      r.addEventListener('change', () => {
        isLeftHanded = r.value === 'left';
        if (isLeftHanded) {
          visLeft.classList.remove('active');
          visRight.classList.add('active');
        } else {
          visRight.classList.remove('active');
          visLeft.classList.add('active');
        }
      });
    });

    // Double-click test box
    const testBox = el.querySelector('#mouse-test-box');
    const boxIcon = el.querySelector('#mouse-box-icon');
    testBox.addEventListener('dblclick', () => {
      boxOpened = !boxOpened;
      if (boxOpened) {
        boxIcon.innerHTML = Icons['smiley-cool'];
        if (window.soundSys) window.soundSys.playDing();
      } else {
        boxIcon.innerHTML = Icons['programs'];
        if (window.soundSys) window.soundSys.playClick();
      }
    });

    const saveControls = window.winManager.rememberControls(el, 'mouse');

    el.querySelector('.btn-mouse-ok').addEventListener('click', () => {
      saveControls();
      window.winManager.closeWindow('app_mouse_cpl');
    });

    el.querySelector('.btn-mouse-cancel').addEventListener('click', () => {
      window.winManager.closeWindow('app_mouse_cpl');
    });

    el.querySelector('.btn-mouse-apply').addEventListener('click', () => {
      if (window.soundSys) window.soundSys.playClick();
      saveControls();
    });
  }

  // ==========================================================
  // 4. Multimedia & Sounds (mmsys.cpl)
  // ==========================================================
  openMultimediaProperties() {
    if (window.winManager && window.winManager.windows.has('app_mmsys_cpl')) {
      window.winManager.bringToTop('app_mmsys_cpl');
      return;
    }

    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '390px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';

    const eventsList = [
      { id: 'startup', name: isRu ? 'Запуск Win' : 'Start Win', play: () => window.soundSys && window.soundSys.playStartup() },
      { id: 'shutdown', name: isRu ? 'Завершение работы Win' : 'Exit Win', play: () => window.soundSys && window.soundSys.playShutdown() },
      { id: 'ding', name: isRu ? 'Звездочка (Ding)' : 'Asterisk (Ding)', play: () => window.soundSys && window.soundSys.playDing() },
      { id: 'chord', name: isRu ? 'Аккорд (Chord)' : 'Chord', play: () => window.soundSys && window.soundSys.playChord() },
      { id: 'error', name: isRu ? 'Критическая ошибка' : 'Critical Stop', play: () => window.soundSys && window.soundSys.playError() },
      { id: 'question', name: isRu ? 'Вопрос (Question)' : 'Question', play: () => window.soundSys && window.soundSys.playQuestion() },
      { id: 'click', name: isRu ? 'Щелчок меню' : 'Menu Command', play: () => window.soundSys && window.soundSys.playClick() }
    ];

    let selectedEvent = eventsList[0];

    content.innerHTML = `
      <!-- Property Sheet Tab Strip -->
      <div style="display:flex; border-bottom:1px solid #808080; margin-bottom:8px;">
        <button class="win-tab-btn active" data-tab="tab-mmsys-sounds" style="padding:3px 10px; font-weight:bold; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:var(--win-bg);">${this.t('mmsys.tabSounds')}</button>
        <button class="win-tab-btn" data-tab="tab-mmsys-audio" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${this.t('mmsys.tabAudio')}</button>
      </div>

      <!-- Tab 1: Sounds -->
      <div class="mmsys-tab-content" id="tab-mmsys-sounds" style="display:block;">
        <div style="font-size:11px; margin-bottom:4px;">${this.t('mmsys.events')}</div>
        <div class="mmsys-events-list" id="mmsys-events">
          ${eventsList.map((ev, idx) => `
            <div class="mmsys-event-item ${idx === 0 ? 'selected' : ''}" data-idx="${idx}">
              <span style="width:14px; height:14px; display:inline-block;">${Icons['speaker']}</span>
              <span>${ev.name}</span>
            </div>
          `).join('')}
        </div>

        <fieldset class="bevel-groove" style="margin-top:8px; padding:6px 8px;">
          <legend>${this.t('mmsys.soundScheme')}</legend>
          <div style="display:flex; gap:6px; align-items:center;">
            <select id="mmsys-scheme-select" style="flex:1; height:22px; font-size:11px;">
              <option value="default" selected>${isRu ? 'Win Default (Стандартная)' : 'Win Default'}</option>
              <option value="robotz">${isRu ? 'Robotz (Роботы)' : 'Robotz'}</option>
              <option value="jungle">${isRu ? 'Jungle (Джунгли)' : 'Jungle'}</option>
              <option value="none">${isRu ? '(Без звука)' : '(No sounds)'}</option>
            </select>
            <button class="win-btn" id="btn-mmsys-play" style="min-width:32px; height:22px; font-size:12px;" title="${this.t('mmsys.preview')}">▶</button>
          </div>
        </fieldset>
      </div>

      <!-- Tab 2: Audio -->
      <div class="mmsys-tab-content" id="tab-mmsys-audio" style="display:none;">
        <fieldset class="bevel-groove" style="padding:8px 10px; font-size:11px;">
          <legend>${isRu ? 'Воспроизведение звука' : 'Playback'}</legend>
          <div style="margin-bottom:4px;">${isRu ? 'Предпочитаемое устройство:' : 'Preferred device:'}</div>
          <select style="width:100%; height:24px; font-size:11px; margin-bottom:8px;">
            <option selected>Creative Sound Blaster AWE64 Gold (WDM)</option>
            <option>DirectSound: Creative Sound Blaster</option>
          </select>
          <div style="display:flex; justify-content:flex-end;">
            <button class="win-btn" id="btn-open-sndvol" style="min-width:110px;">${isRu ? 'Громкость...' : 'Volume...'}</button>
          </div>
        </fieldset>
      </div>

      <!-- Bottom Buttons -->
      <div class="win-dialog-buttons" style="margin-top:12px; display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn btn-mmsys-ok" style="font-weight:bold; min-width:70px;">${this.t('btn.ok')}</button>
        <button class="win-btn btn-mmsys-cancel" style="min-width:70px;">${this.t('btn.cancel')}</button>
        <button class="win-btn btn-mmsys-apply" style="min-width:70px;">${this.t('btn.apply')}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_mmsys_cpl',
      title: this.t('mmsys.title'),
      icon: 'multimedia',
      width: 410,
      height: 330,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = dialog.element;

    // Tabs
    el.querySelectorAll('.win-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        el.querySelectorAll('.win-tab-btn').forEach(b => {
          b.style.background = '#d4d0c8';
          b.style.fontWeight = 'normal';
        });
        tabBtn.style.background = 'var(--win-bg)';
        tabBtn.style.fontWeight = 'bold';

        el.querySelectorAll('.mmsys-tab-content').forEach(tc => tc.style.display = 'none');
        const target = el.querySelector(`#${tabBtn.dataset.tab}`);
        if (target) target.style.display = 'block';
      });
    });

    // Event selection
    el.querySelectorAll('.mmsys-event-item').forEach(item => {
      item.addEventListener('click', () => {
        el.querySelectorAll('.mmsys-event-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        const idx = parseInt(item.dataset.idx);
        selectedEvent = eventsList[idx];
      });
    });

    // Play preview
    const playBtn = el.querySelector('#btn-mmsys-play');
    playBtn.addEventListener('click', () => {
      if (selectedEvent && selectedEvent.play) {
        selectedEvent.play();
      }
    });

    // Launch Volume Control
    const btnSndVol = el.querySelector('#btn-open-sndvol');
    if (btnSndVol) {
      btnSndVol.addEventListener('click', () => {
        if (window.appSysTools && window.appSysTools.openVolumeControl) {
          window.appSysTools.openVolumeControl();
        }
      });
    }

    const saveControls = window.winManager.rememberControls(el, 'mmsys');

    el.querySelector('.btn-mmsys-ok').addEventListener('click', () => {
      saveControls();
      window.winManager.closeWindow('app_mmsys_cpl');
    });

    el.querySelector('.btn-mmsys-cancel').addEventListener('click', () => {
      window.winManager.closeWindow('app_mmsys_cpl');
    });

    el.querySelector('.btn-mmsys-apply').addEventListener('click', () => {
      if (window.soundSys) window.soundSys.playClick();
      saveControls();
    });
  }

  // ==========================================================
  // 5. Add/Remove Programs (appwiz.cpl)
  // ==========================================================
  openAppWizProperties() {
    if (window.winManager && window.winManager.windows.has('app_appwiz_cpl')) {
      window.winManager.bringToTop('app_appwiz_cpl');
      return;
    }

    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '420px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';

    const softwareList = [
      { id: 'wolf3d', name: 'Wolfenstein 3D (id Software)', size: '3.2 MB', icon: 'wolf3d' },
      { id: 'quest', name: 'LucasQuest 98 (LucasArts SCUMM)', size: '8.4 MB', icon: 'lucas-quest' },
      { id: 'stalker', name: 'S.T.A.L.K.E.R. Retro 98 (GSC Game World)', size: '14.1 MB', icon: 'stalker' },
      { id: 'fallout2', name: 'Fallout 2 Demo: Temple of Trials (Black Isle / Interplay)', size: '8.4 MB', icon: 'fallout2' },
      { id: 'excel', name: 'Microslop Office 97 Excel (Microslop Corp.)', size: '24.0 MB', icon: 'file-xls' },
      { id: 'photoshop', name: 'Adobe Photoshop 5.0 (Adobe Systems)', size: '32.5 MB', icon: 'photoshop' },
      { id: 'wincmd', name: 'WinCommander 98 (Ghisler & Co.)', size: '2.1 MB', icon: 'wincommander' },
      { id: 'winamp', name: 'Winamp 98 Pro (Nullsoft)', size: '4.8 MB', icon: 'winamp' },
      { id: 'icq', name: 'ICQ 98a (Mirabilis)', size: '5.2 MB', icon: 'icq-online' }
    ];

    if (window.gameManager && window.gameManager.isInstalled('blender')) {
      softwareList.push({ id: 'blender', name: 'Blender 1.60 3D Creation Suite (Not a Number)', size: '1.8 MB', icon: 'blender' });
    }
    if (window.gameManager && window.gameManager.isInstalled('blender204')) {
      softwareList.push({ id: 'blender204', name: 'Blender 2.04 (Not a Number)', size: '2.9 MB', icon: 'blender204' });
    }

    let selectedApp = softwareList[0];

    content.innerHTML = `
      <!-- Property Sheet Tab Strip -->
      <div style="display:flex; border-bottom:1px solid #808080; margin-bottom:8px;">
        <button class="win-tab-btn active" data-tab="tab-appwiz-install" style="padding:3px 10px; font-weight:bold; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:var(--win-bg);">${this.t('appwiz.tabInstall')}</button>
        <button class="win-tab-btn" data-tab="tab-appwiz-setup" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${this.t('appwiz.tabWinSetup')}</button>
      </div>

      <!-- Tab 1: Install/Uninstall -->
      <div class="appwiz-tab-content" id="tab-appwiz-install" style="display:block;">
        <div style="font-size:11px; margin-bottom:4px;">${this.t('appwiz.installedApps')}</div>
        <div class="appwiz-apps-list" id="appwiz-list">
          ${softwareList.map((app, idx) => `
            <div class="appwiz-app-row ${idx === 0 ? 'selected' : ''}" data-idx="${idx}">
              <div style="width:16px; height:16px; flex-shrink:0;">${Icons[app.icon] || Icons['folder']}</div>
              <div style="flex:1;">${app.name}</div>
              <div style="color:#555;">${app.size}</div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:8px; display:flex; justify-content:flex-end;">
          <button class="win-btn btn-appwiz-remove" style="min-width:140px; font-weight:bold;">${this.t('appwiz.removeBtn')}</button>
        </div>
      </div>

      <!-- Tab 2: Win Setup -->
      <div class="appwiz-tab-content" id="tab-appwiz-setup" style="display:none;">
        <div style="font-size:11px; margin-bottom:6px;">${isRu ? 'Компоненты операционной системы Win 98:' : 'Components of Microslop Win 98:'}</div>
        <div class="appwiz-apps-list" style="height:140px;">
          <div class="appwiz-app-row"><input type="checkbox" checked> <span>${isRu ? 'Стандартные (Блокнот, Paint, Калькулятор)' : 'Accessories (Notepad, Paint, Calculator)'} (12.1 MB)</span></div>
          <div class="appwiz-app-row"><input type="checkbox" checked> <span>${isRu ? 'Игры (Сапер, Косынка, Pinball)' : 'Games (Minesweeper, Solitaire, Pinball)'} (14.5 MB)</span></div>
          <div class="appwiz-app-row"><input type="checkbox" checked> <span>${isRu ? 'Мультимедиа (Звукозапись, ActiveMovie)' : 'Multimedia (Sound Recorder, ActiveMovie)'} (9.8 MB)</span></div>
          <div class="appwiz-app-row"><input type="checkbox" checked> <span>${isRu ? 'Связь (Outlook Express, ICQ)' : 'Communications (Outlook Express, ICQ)'} (16.2 MB)</span></div>
          <div class="appwiz-app-row"><input type="checkbox" checked> <span>Internet Explorer 5.0 (45.0 MB)</span></div>
        </div>
      </div>

      <!-- Bottom Buttons -->
      <div class="win-dialog-buttons" style="margin-top:12px; display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn btn-appwiz-ok" style="font-weight:bold; min-width:70px;">${this.t('btn.ok')}</button>
        <button class="win-btn btn-appwiz-cancel" style="min-width:70px;">${this.t('btn.cancel')}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_appwiz_cpl',
      title: this.t('appwiz.title'),
      icon: 'appwiz',
      width: 440,
      height: 340,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = dialog.element;

    // Tabs
    el.querySelectorAll('.win-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        el.querySelectorAll('.win-tab-btn').forEach(b => {
          b.style.background = '#d4d0c8';
          b.style.fontWeight = 'normal';
        });
        tabBtn.style.background = 'var(--win-bg)';
        tabBtn.style.fontWeight = 'bold';

        el.querySelectorAll('.appwiz-tab-content').forEach(tc => tc.style.display = 'none');
        const target = el.querySelector(`#${tabBtn.dataset.tab}`);
        if (target) target.style.display = 'block';
      });
    });

    // Row selection
    el.querySelectorAll('.appwiz-app-row').forEach(row => {
      row.addEventListener('click', () => {
        el.querySelectorAll('.appwiz-app-row').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
        const idx = parseInt(row.dataset.idx);
        if (!isNaN(idx)) selectedApp = softwareList[idx];
      });
    });

    el.querySelector('.btn-appwiz-remove').addEventListener('click', () => {
      if (!selectedApp) return;
      window.winManager.openDialog({
        title: selectedApp.name,
        icon: 'warning',
        message: `${isRu ? 'Вы уверены, что хотите удалить программу' : 'Are you sure you want to remove'} <strong>${selectedApp.name}</strong>?`
      });
    });

    el.querySelector('.btn-appwiz-ok').addEventListener('click', () => {
      window.winManager.closeWindow('app_appwiz_cpl');
    });

    el.querySelector('.btn-appwiz-cancel').addEventListener('click', () => {
      window.winManager.closeWindow('app_appwiz_cpl');
    });
  }

  // ==========================================================
  // 6. Internet Properties (inetcpl.cpl)
  // ==========================================================
  openInternetProperties() {
    if (window.winManager && window.winManager.windows.has('app_inetcpl_cpl')) {
      window.winManager.bringToTop('app_inetcpl_cpl');
      return;
    }

    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '380px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    let currentHomePage = localStorage.getItem('win98_ie_home') || 'http://www.search98.com';

    content.innerHTML = `
      <!-- Property Sheet Tab Strip -->
      <div style="display:flex; border-bottom:1px solid #808080; margin-bottom:8px;">
        <button class="win-tab-btn active" style="padding:3px 10px; font-weight:bold; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:var(--win-bg);">${this.t('inetcpl.tabGeneral')}</button>
      </div>

      <!-- Tab 1: General -->
      <div>
        <fieldset class="bevel-groove" style="padding:8px 10px;">
          <legend>${this.t('inetcpl.homePage')}</legend>
          <div style="font-size:11px; margin-bottom:4px;">${isRu ? 'Адрес начальной страницы:' : 'Address:'}</div>
          <input type="text" id="inet-home-input" value="${currentHomePage}" style="width:100%; height:22px; font-size:11px; margin-bottom:6px;">
          <div style="display:flex; justify-content:flex-end; gap:4px;">
            <button class="win-btn" id="btn-home-default" style="min-width:90px;">${isRu ? 'По умолчанию' : 'Use Default'}</button>
            <button class="win-btn" id="btn-home-blank" style="min-width:90px;">${isRu ? 'Пустая' : 'Use Blank'}</button>
          </div>
        </fieldset>

        <fieldset class="bevel-groove" style="margin-top:8px; padding:8px 10px;">
          <legend>${this.t('inetcpl.tempFiles')}</legend>
          <div style="font-size:11px; margin-bottom:6px;">${isRu ? 'Страницы, хранящиеся на диске для быстрого просмотра.' : 'Pages stored on your hard disk for quick viewing.'}</div>
          <div style="display:flex; justify-content:flex-end; gap:4px;">
            <button class="win-btn" id="btn-del-temp" style="min-width:110px;">${this.t('inetcpl.deleteFiles')}</button>
          </div>
        </fieldset>

        <fieldset class="bevel-groove" style="margin-top:8px; padding:8px 10px;">
          <legend>${this.t('inetcpl.history')}</legend>
          <div style="font-size:11px; margin-bottom:6px;">${isRu ? 'Папка «Журнал» содержит ссылки на недавно посещенные узлы.' : 'The History folder contains links to pages you visited recently.'}</div>
          <div style="display:flex; justify-content:flex-end; gap:4px;">
            <button class="win-btn" id="btn-clear-hist" style="min-width:110px;">${this.t('inetcpl.clearHistory')}</button>
          </div>
        </fieldset>
      </div>

      <!-- Bottom Buttons -->
      <div class="win-dialog-buttons" style="margin-top:12px; display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn btn-inet-ok" style="font-weight:bold; min-width:70px;">${this.t('btn.ok')}</button>
        <button class="win-btn btn-inet-cancel" style="min-width:70px;">${this.t('btn.cancel')}</button>
        <button class="win-btn btn-inet-apply" style="min-width:70px;">${this.t('btn.apply')}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_inetcpl_cpl',
      title: this.t('inetcpl.title'),
      icon: 'inetcpl',
      width: 400,
      height: 380,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = dialog.element;
    const inputHome = el.querySelector('#inet-home-input');

    el.querySelector('#btn-home-default').addEventListener('click', () => {
      inputHome.value = 'http://www.search98.com';
    });

    el.querySelector('#btn-home-blank').addEventListener('click', () => {
      inputHome.value = 'about:blank';
    });

    el.querySelector('#btn-del-temp').addEventListener('click', () => {
      window.winManager.openDialog({
        title: isRu ? 'Удаление файлов' : 'Delete Files',
        icon: 'info',
        message: isRu ? 'Все временные файлы Интернета были успешно удалены.' : 'All Temporary Internet Files have been deleted.'
      });
    });

    el.querySelector('#btn-clear-hist').addEventListener('click', () => {
      window.winManager.openDialog({
        title: isRu ? 'Журнал' : 'History',
        icon: 'info',
        message: isRu ? 'Журнал посещенных страниц очищен.' : 'History list has been cleared.'
      });
    });

    const saveHome = () => {
      localStorage.setItem('win98_ie_home', inputHome.value.trim());
      if (window.soundSys) window.soundSys.playClick();
    };

    el.querySelector('.btn-inet-ok').addEventListener('click', () => {
      saveHome();
      window.winManager.closeWindow('app_inetcpl_cpl');
    });

    el.querySelector('.btn-inet-cancel').addEventListener('click', () => {
      window.winManager.closeWindow('app_inetcpl_cpl');
    });

    el.querySelector('.btn-inet-apply').addEventListener('click', saveHome);
  }
}

window.appCPanel = new AppCPanel();

