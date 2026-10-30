class AppCPanel {
  constructor() {
    this.mouseClicksDisabled = false;
    this.blockedClicks = 0;
    this.disableClicksCount = 0;
    this.rescueDelayMs = 5000;
    this.rescueTimer = null;
    this.clickBlockerBound = null;
    this.trailLayer = null;
    this.trailGhosts = [];
    this.trailPositions = [];
    this.trailMoveBound = null;
    this.mouseSettings = this.loadMouseSettings();
    this.monitorInStandby = false;
    this.monitorStandbyEnteredAt = 0;
    this.disksSpunDown = false;
    this.powerIdleSeconds = 0;
    this.powerIdleInterval = null;
    this.powerActivityBound = null;
    this.powerOverlayEl = null;
    this.powerSettings = this.loadPowerSettings();
    if (typeof document !== 'undefined' && document.body) {
      this.applyMouseSettings(this.mouseSettings);
      this.applyPowerSettings(this.powerSettings, 'init');
    } else if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('DOMContentLoaded', () => {
        this.applyMouseSettings(this.mouseSettings);
        this.applyPowerSettings(this.powerSettings, 'init');
      });
    }
  }

  t(k, ...args) {
    return window.i18n ? window.i18n.t(k, ...args) : k;
  }

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
      <div style="display:flex; border-bottom:1px solid #808080; margin-bottom:8px;">
        <button class="win-tab-btn active" data-tab="tab-timedate" style="padding:3px 10px; font-weight:bold; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:var(--win-bg);">${this.t('timedate.tabTimeDate')}</button>
        <button class="win-tab-btn" data-tab="tab-timezone" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${this.t('timedate.tabTimeZone')}</button>
      </div>

      <div class="timedate-tab-content" id="tab-timedate" style="display:block;">
        <div style="display:flex; gap:12px;">
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

          <fieldset class="bevel-groove" style="width:130px; padding:6px 8px; display:flex; flex-direction:column; align-items:center;">
            <legend>${isRu ? 'Время' : 'Time'}</legend>
            <div class="timedate-clock-container">
              <canvas class="timedate-clock-canvas" id="timedate-canvas" width="110" height="110"></canvas>
              <div class="timedate-digital-time" id="timedate-digital">00:00:00</div>
            </div>
          </fieldset>
        </div>
      </div>

      <div class="timedate-tab-content" id="tab-timezone" style="display:none;">
        <fieldset class="bevel-groove" style="padding:10px;">
          <legend>${this.t('timedate.tabTimeZone')}</legend>
          <div style="margin-bottom:8px; font-size:11px;">${this.t('timedate.timeZoneLabel')}</div>
          <select id="timedate-tz-select" style="width:100%; height:24px; font-size:11px;">
            <option value="3" selected>(GMT+03:00) ${isRu ? 'Москва, Санкт-Петербург, Волгоград' : 'Moscow, St. Petersburg, Volgograd'}</option>
            <option value="0">(GMT) ${isRu ? 'Время по Гринвичу: Дублин, Эдинбург, Лондон' : 'Greenwich Mean Time : Dublin, Edinburgh, London'}</option>
            <option value="-5">(GMT-05:00) ${isRu ? 'Восточное время (США и Канада)' : 'Eastern Time (US & Canada)'}</option>
            <option value="-8">(GMT-08:00) ${isRu ? 'Тихоокеанское время (США и Канада)' : 'Pacific Time (US & Canada)'}</option>
            <option value="1">(GMT+01:00) ${isRu ? 'Амстердам, Берлин, Берн, Рим, Стокгольм' : 'Amsterdam, Berlin, Bern, Rome, Stockholm'}</option>
            <option value="9">(GMT+09:00) ${isRu ? 'Токио, Осака, Саппоро' : 'Tokyo, Osaka, Sapporo'}</option>
          </select>
          <div style="margin-top:16px; display:flex; align-items:center; gap:6px;">
            <input type="checkbox" id="timedate-dst" checked>
            <label for="timedate-dst" style="font-size:11px;">${isRu ? 'Автоматический переход на летнее время и обратно' : 'Automatically adjust clock for daylight saving changes'}</label>
          </div>
        </fieldset>
      </div>

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

      const hrAngle = ((hrs % 12) + mins / 60) * (Math.PI / 6) - Math.PI / 2;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(hrAngle) * 26, cy + Math.sin(hrAngle) * 26);
      ctx.stroke();

      const minAngle = (mins + secs / 60) * (Math.PI / 30) - Math.PI / 2;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(minAngle) * 38, cy + Math.sin(minAngle) * 38);
      ctx.stroke();

      const secAngle = secs * (Math.PI / 30) - Math.PI / 2;
      ctx.strokeStyle = '#cc0000';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(secAngle) * 42, cy + Math.sin(secAngle) * 42);
      ctx.stroke();

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
        name: isRu ? 'Компьютер' : 'Computer',
        items: ['Advanced Configuration and Power Interface (ACPI) BIOS']
      },
      {
        name: 'CD-ROM',
        items: ['TOSHIBA CD-ROM XM-6202B (32X IDE)']
      },
      {
        name: isRu ? 'Дисковые накопители' : 'Disk drives',
        items: ['GENERIC IDE DISK TYPE47 (12.4 GB)']
      },
      {
        name: isRu ? 'Видеоадаптеры' : 'Display adapters',
        items: ['3dfx Voodoo2 3Dfx Interactive Glide (12 MB)', 'S3 Trio64V2/DX PCI (4 MB)']
      },
      {
        name: isRu ? 'Контроллеры жестких дисков' : 'Hard disk controllers',
        items: isRu
          ? ['Intel 82371AB/EB PCI Bus Master IDE Controller', 'Первичный контроллер IDE (двойное FIFO)', 'Вторичный контроллер IDE (двойное FIFO)']
          : ['Intel 82371AB/EB PCI Bus Master IDE Controller', 'Primary IDE controller (dual fifo)', 'Secondary IDE controller (dual fifo)']
      },
      {
        name: isRu ? 'Клавиатура' : 'Keyboard',
        items: [isRu ? 'Стандартная клавиатура (101/102 клавиши) или Microslop Natural' : 'Standard 101/102-Key or Microslop Natural Keyboard']
      },
      {
        name: isRu ? 'Мышь' : 'Mouse',
        items: [isRu ? 'Мышь Microslop для порта PS/2' : 'Microslop PS/2 Port Mouse']
      },
      {
        name: isRu ? 'Порты (COM и LPT)' : 'Ports (COM & LPT)',
        items: isRu
          ? ['Последовательный порт (COM1)', 'Последовательный порт (COM2)', 'Порт принтера (LPT1)']
          : ['Communications Port (COM1)', 'Communications Port (COM2)', 'Printer Port (LPT1)']
      },
      {
        name: isRu ? 'Звуковые, видео и игровые устройства' : 'Sound, video and game controllers',
        items: ['Creative Sound Blaster AWE64 Gold (ISA)', isRu ? 'Игровой порт для джойстика' : 'Gameport Joystick']
      }
    ];

    const cpuInfo = (window.biosEngine && typeof window.biosEngine.getEffectiveCpuSpecs === 'function')
      ? window.biosEngine.getEffectiveCpuSpecs()
      : { name: 'GenuineIntel Pentium(R) II Processor', frequency: 450, ramMb: 128 };

    content.innerHTML = `
      <div style="display:flex; border-bottom:1px solid #808080; margin-bottom:8px;">
        <button class="win-tab-btn active" data-tab="tab-sys-general" style="padding:3px 10px; font-weight:bold; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:var(--win-bg);">${this.t('sysdm.tabGeneral')}</button>
        <button class="win-tab-btn" data-tab="tab-sys-devmgr" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${this.t('sysdm.tabDeviceMgr')}</button>
        <button class="win-tab-btn" data-tab="tab-sys-perf" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${this.t('sysdm.tabPerf')}</button>
      </div>

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

      <div class="sys-tab-content" id="tab-sys-perf" style="display:none;">
        <fieldset class="bevel-groove" style="padding:8px 12px; font-size:11px; line-height:1.5;">
          <legend>${isRu ? 'Состояние производительности' : 'Performance status'}</legend>
          <div style="display:grid; grid-template-columns:130px 1fr; gap:4px;">
            <div style="color:#555;">${isRu ? 'Память:' : 'Memory:'}</div>
            <div><strong>${isRu ? 'ОЗУ 64,0 МБ' : '64.0 MB of RAM'}</strong></div>
            <div style="color:#555;">${isRu ? 'Ресурсы системы:' : 'System Resources:'}</div>
            <div><strong>${isRu ? 'Свободно 89%' : '89% free'}</strong></div>
            <div style="color:#555;">${isRu ? 'Файловая система:' : 'File System:'}</div>
            <div>${isRu ? '32-разрядная' : '32-bit'}</div>
            <div style="color:#555;">${isRu ? 'Виртуальная память:' : 'Virtual Memory:'}</div>
            <div>${isRu ? '32-разрядная' : '32-bit'}</div>
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
        message: `<strong>${selectedDevice}</strong><br><br>${isRu ? 'Устройство работает нормально.' : 'This device is working properly.'}<br>${isRu ? 'Драйвер' : 'Driver'}: Microslop 4.10.1998<br>${isRu ? 'Ресурс: IRQ 11, диапазон памяти' : 'Resource: IRQ 11, Memory Range'} 000C0000 - 000C7FFF`
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

  defaultMouseSettings() {
    return {
      handedness: 'right',
      doubleClickSpeed: 6,
      scheme: 'default',
      customSchemes: {},
      pointerSpeed: 6,
      pointerTrails: false,
      trailLength: 6
    };
  }

  loadMouseSettings() {
    const base = this.defaultMouseSettings();
    try {
      const raw = localStorage.getItem('win98_mouse_settings');
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return base;
      return {
        ...base,
        ...parsed,
        customSchemes: parsed.customSchemes && typeof parsed.customSchemes === 'object' ? { ...parsed.customSchemes } : {}
      };
    } catch (e) {
      return base;
    }
  }

  saveMouseSettings(settings) {
    this.mouseSettings = {
      ...this.defaultMouseSettings(),
      ...(settings || {})
    };
    try {
      localStorage.setItem('win98_mouse_settings', JSON.stringify(this.mouseSettings));
    } catch (e) {}
    this.applyMouseSettings(this.mouseSettings);
  }

  applyMouseSettings(settings) {
    const cfg = settings || this.mouseSettings || this.defaultMouseSettings();
    if (typeof document !== 'undefined' && document.body) {
      if (cfg.scheme && cfg.scheme !== 'default') {
        document.body.dataset.cursorScheme = cfg.scheme;
      } else {
        delete document.body.dataset.cursorScheme;
      }
      if (cfg.handedness === 'left') {
        document.body.dataset.mouseHandedness = 'left';
      } else {
        delete document.body.dataset.mouseHandedness;
      }
    }
    this.syncPointerTrails(Boolean(cfg.pointerTrails), cfg.trailLength);
  }

  syncPointerTrails(enabled, trailLength = 6) {
    if (typeof document === 'undefined' || !document.body || typeof window === 'undefined') return;
    if (!enabled) {
      if (this.trailMoveBound) {
        window.removeEventListener('mousemove', this.trailMoveBound);
        this.trailMoveBound = null;
      }
      if (this.trailLayer && this.trailLayer.parentNode) {
        this.trailLayer.parentNode.removeChild(this.trailLayer);
      }
      this.trailLayer = null;
      this.trailGhosts = [];
      this.trailPositions = [];
      return;
    }

    const count = Math.max(2, Math.min(10, parseInt(trailLength, 10) || 6));
    if (!this.trailLayer) {
      this.trailLayer = document.createElement('div');
      this.trailLayer.className = 'win-pointer-trail-layer';
      document.body.appendChild(this.trailLayer);
    }

    this.trailLayer.innerHTML = '';
    this.trailGhosts = [];
    this.trailPositions = [];
    const arrowSvg = this.renderCursorRoleSvg('normal', (this.mouseSettings && this.mouseSettings.scheme) || 'default');

    for (let i = 0; i < count; i++) {
      const ghost = document.createElement('div');
      ghost.className = 'win-pointer-trail-ghost';
      ghost.style.opacity = '0';
      ghost.innerHTML = arrowSvg;
      this.trailLayer.appendChild(ghost);
      this.trailGhosts.push(ghost);
    }

    if (!this.trailMoveBound) {
      this.trailMoveBound = (e) => {
        if (!this.trailGhosts.length) return;
        this.trailPositions.unshift({ x: e.clientX, y: e.clientY });
        if (this.trailPositions.length > this.trailGhosts.length + 1) {
          this.trailPositions.length = this.trailGhosts.length + 1;
        }
        for (let i = 0; i < this.trailGhosts.length; i++) {
          const pos = this.trailPositions[i + 1];
          const g = this.trailGhosts[i];
          if (!pos) {
            g.style.opacity = '0';
            continue;
          }
          const alpha = Math.max(0.12, (1 - (i + 1) / (this.trailGhosts.length + 1)) * 0.58);
          g.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
          g.style.opacity = alpha.toFixed(2);
        }
      };
      window.addEventListener('mousemove', this.trailMoveBound);
    }
  }

  renderIsoMouseSvg(isLeftHanded = false, clicksDisabled = false) {
    const leftActive = !isLeftHanded && !clicksDisabled ? ' active' : '';
    const rightActive = isLeftHanded && !clicksDisabled ? ' active' : '';
    const disabledCls = clicksDisabled ? ' clicks-disabled' : '';
    return `
      <svg id="mouse-iso-svg" class="mouse-iso-svg${disabledCls}" viewBox="0 0 92 74" width="92" height="74" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
        <path fill="#808080" d="M20 2h2v3h-2zM18 5h2v3h-2zM17 8h2v4h-2zM18 12h3v3h-3zM21 15h4v2h-4z"/>
        <path fill="#ffffff" d="M21 3h1v2h-1zM19 6h1v2h-1zM18 9h1v3h-1zM19 12h2v2h-2z"/>
        <path fill="#000000" d="M22 2h1v3h-1zM20 5h1v3h-1zM19 8h1v4h-1zM21 12h1v3h-1zM24 15h2v2h-2z"/>
        <ellipse cx="52" cy="48" rx="28" ry="20" fill="#808080"/>
        <path fill="#000000" d="M27 14h18l16 8 12 13 5 12v9l-5 8-12 6H42l-15-7-11-12-4-12v-11l6-9z"/>
        <path fill="#dfdfdf" d="M28 16h16l15 8 11 12 4 11v7l-4 7-11 5H43l-14-6-10-11-4-11v-9l5-8z"/>
        <path fill="#c0c0c0" d="M40 58h17l10-5 4-6v-5l-4 6-11 5H41l-12-6-8-9v4l8 10z"/>
        <path fill="#808080" d="M42 62h16l11-5 4-7v-3l-4 6-11 5H42l-13-6-9-10v2l9 11z"/>
        <path fill="#ffffff" d="M31 28l18-10 13 9 10 11 2 7-4 6-10 4H44l-13-6-9-10z"/>
        <path id="vis-left" class="mouse-iso-btn${leftActive}" d="M16 25l11-9 11 6-13 11-9-5z"/>
        <path class="mouse-iso-btn-glint" fill="#dfdfdf" d="M18 25l8-7 2 1-8 7z"/>
        <path id="vis-right" class="mouse-iso-btn${rightActive}" d="M29 15l14-1 11 6-13 10-12-6z"/>
        <path class="mouse-iso-btn-glint" fill="#dfdfdf" d="M31 16l11-1 2 1-11 1z"/>
        <path fill="#000000" d="M27 15l12 7-13 11M25 33l14-11 15-9"/>
        <g class="mouse-iso-lock-badge">
          <circle cx="31" cy="24" r="9" fill="#ff0000" stroke="#000000" stroke-width="1"/>
          <path d="M27 20l8 8M35 20l-8 8" stroke="#ffffff" stroke-width="2"/>
        </g>
      </svg>
    `;
  }

  renderJackBoxSvg(opened = false) {
    if (!opened) {
      return `
        <svg viewBox="0 0 56 54" width="56" height="54" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
          <polygon points="15,32 27,27 38,32 26,37" fill="#ff00ff" stroke="#000000" stroke-width="1"/>
          <polygon points="15,32 26,37 26,49 15,44" fill="#c000c0" stroke="#000000" stroke-width="1"/>
          <polygon points="26,37 38,32 38,44 26,49" fill="#800080" stroke="#000000" stroke-width="1"/>
          <line x1="15" y1="32" x2="26" y2="49" stroke="#ff80ff" stroke-width="1"/>
          <line x1="26" y1="37" x2="15" y2="44" stroke="#ff80ff" stroke-width="1"/>
          <line x1="26" y1="37" x2="38" y2="44" stroke="#ff00ff" stroke-width="1"/>
          <line x1="38" y1="32" x2="26" y2="49" stroke="#ff00ff" stroke-width="1"/>
          <g class="jack-crank">
            <path d="M38 39h5v-4h3" fill="none" stroke="#000000" stroke-width="1.4"/>
            <rect x="45" y="33" width="4" height="4" fill="#ff0000" stroke="#800000" stroke-width="0.8"/>
          </g>
        </svg>
      `;
    }
    return `
      <svg viewBox="0 0 56 54" width="56" height="54" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
        <polygon points="5,24 15,32 26,37 16,28" fill="#df00df" stroke="#000000" stroke-width="1"/>
        <polygon points="15,32 27,27 38,32 26,37" fill="#400040" stroke="#000000" stroke-width="1"/>
        <polygon points="15,32 26,37 26,49 15,44" fill="#c000c0" stroke="#000000" stroke-width="1"/>
        <polygon points="26,37 38,32 38,44 26,49" fill="#800080" stroke="#000000" stroke-width="1"/>
        <line x1="15" y1="32" x2="26" y2="49" stroke="#ff80ff" stroke-width="1"/>
        <line x1="26" y1="37" x2="15" y2="44" stroke="#ff80ff" stroke-width="1"/>
        <path d="M38 39h5v4h3" fill="none" stroke="#000000" stroke-width="1.4"/>
        <rect x="45" y="41" width="4" height="4" fill="#ff0000" stroke="#800000" stroke-width="0.8"/>
        <path d="M26 34l-5-3 9-3-9-3 9-3-5-2" fill="none" stroke="#404040" stroke-width="1.6"/>
        <path d="M18 19l-7 4 3 3 6-3h12l6 3 3-3-7-4z" fill="#ff00ff" stroke="#000000" stroke-width="1"/>
        <rect x="10" y="22" width="3" height="3" fill="#ffff00" stroke="#000000" stroke-width="0.6"/>
        <rect x="39" y="22" width="3" height="3" fill="#ffff00" stroke="#000000" stroke-width="0.6"/>
        <polygon points="19,20 23,17 26,21 29,17 33,20 26,23" fill="#ffff00" stroke="#808000" stroke-width="0.8"/>
        <circle cx="26" cy="14" r="5" fill="#ffd8b0" stroke="#000000" stroke-width="1"/>
        <rect x="24" y="12" width="1.4" height="1.4" fill="#000000"/>
        <rect x="27.5" y="12" width="1.4" height="1.4" fill="#000000"/>
        <rect x="25.5" y="13.5" width="1.6" height="1.6" fill="#ff0000"/>
        <path d="M24 16.2h5" stroke="#c00000" stroke-width="1.2"/>
        <path d="M21 10l-7-6 3 8z" fill="#ff00ff" stroke="#000000" stroke-width="1"/>
        <path d="M31 10l7-6-3 8z" fill="#ffff00" stroke="#000000" stroke-width="1"/>
        <circle cx="14" cy="4" r="2" fill="#ffff00" stroke="#000000" stroke-width="0.8"/>
        <circle cx="38" cy="4" r="2" fill="#00ffff" stroke="#000000" stroke-width="0.8"/>
      </svg>
    `;
  }

  renderCursorRoleSvg(roleId = 'normal', schemeId = 'default') {
    if (schemeId === 'dino' && (roleId === 'normal' || roleId === 'busy' || roleId === 'working')) {
      return `
        <svg viewBox="0 0 20 20" width="20" height="20" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
          <path fill="#000000" d="M5 1h6v1h2v4h-2v1H9v2h4v2H9v2h3v4h-2v2H7v-3H5v3H2v-4h1v-4h1V6H3V3h2z"/>
          <path fill="#38a169" d="M5 2h6v4H5zM6 6h3v5H5V8h1zM9 9h3v1H9zM5 11h5v3H5zM3 14h2v3H3zM8 14h2v3H8z"/>
          <rect x="9" y="3" width="1" height="1" fill="#ffffff"/>
        </svg>
      `;
    }
    const fill = schemeId === 'inverted' ? '#000000' : (schemeId === '3d' ? '#e6b86a' : '#ffffff');
    const stroke = schemeId === 'inverted' ? '#ffffff' : (schemeId === '3d' ? '#4a2c0a' : '#000000');
    const scale = schemeId === 'large' ? 'transform="scale(1.18)"' : '';

    if (roleId === 'busy') {
      return `
        <svg viewBox="0 0 20 20" width="18" height="18" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
          <g ${scale}>
            <rect x="4" y="2" width="10" height="2" fill="${stroke}"/>
            <rect x="4" y="15" width="10" height="2" fill="${stroke}"/>
            <polygon points="5,4 13,4 10,9 13,15 5,15 8,9" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
            <polygon points="7,6 11,6 9,9" fill="#808000"/>
            <polygon points="7,14 11,14 9,11" fill="#808000"/>
          </g>
        </svg>
      `;
    }
    if (roleId === 'working') {
      return `
        <svg viewBox="0 0 22 20" width="20" height="18" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
          <polygon points="1,1 1,14 4,11 6,16 8,15 6,10 10,10" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
          <rect x="12" y="3" width="7" height="1.5" fill="${stroke}"/>
          <rect x="12" y="13" width="7" height="1.5" fill="${stroke}"/>
          <polygon points="13,4.5 18,4.5 16,8.5 18,13 13,13 15,8.5" fill="#ffffff" stroke="${stroke}" stroke-width="1"/>
        </svg>
      `;
    }
    if (roleId === 'help') {
      return `
        <svg viewBox="0 0 22 20" width="20" height="18" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
          <polygon points="1,1 1,14 4,11 6,16 8,15 6,10 10,10" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
          <text x="12" y="14" font-family="var(--win-font)" font-size="12" font-weight="bold" fill="${stroke}">?</text>
        </svg>
      `;
    }
    if (roleId === 'precision') {
      return `
        <svg viewBox="0 0 20 20" width="18" height="18" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 2v15M2 9h15" stroke="${stroke}" stroke-width="1.4"/>
          <rect x="8" y="8" width="2" height="2" fill="${fill}"/>
        </svg>
      `;
    }
    if (roleId === 'text') {
      return `
        <svg viewBox="0 0 20 20" width="18" height="18" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 3h7M6 16h7M9.5 3v13" stroke="${stroke}" stroke-width="1.4"/>
        </svg>
      `;
    }
    if (roleId === 'unavailable') {
      return `
        <svg viewBox="0 0 20 20" width="18" height="18" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="6.5" fill="none" stroke="#ff0000" stroke-width="2"/>
          <line x1="5.5" y1="5.5" x2="14.5" y2="14.5" stroke="#ff0000" stroke-width="2"/>
        </svg>
      `;
    }
    if (roleId === 'vert') {
      return `
        <svg viewBox="0 0 20 20" width="18" height="18" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
          <polygon points="10,2 6,6 8.5,6 8.5,14 6,14 10,18 14,14 11.5,14 11.5,6 14,6" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
        </svg>
      `;
    }
    if (roleId === 'horz') {
      return `
        <svg viewBox="0 0 20 20" width="18" height="18" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
          <polygon points="2,10 6,6 6,8.5 14,8.5 14,6 18,10 14,14 14,11.5 6,11.5 6,14" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
        </svg>
      `;
    }
    if (roleId === 'link') {
      return `
        <svg viewBox="0 0 20 20" width="18" height="18" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 2h2v7h6v6l-2 3H6l-3-4v-3h4z" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
          <path d="M9 6v3M11 6v3M13 7v2" stroke="${stroke}" stroke-width="1"/>
        </svg>
      `;
    }
    return `
      <svg viewBox="0 0 18 20" width="16" height="18" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
        <g ${scale}>
          <polygon points="2,1 2,15 5,12 7,17 9,16 7,11 12,11" fill="${fill}" stroke="${stroke}" stroke-width="1.1"/>
        </g>
      </svg>
    `;
  }

  renderMotionSpeedSvg() {
    return `
      <svg viewBox="0 0 32 32" width="32" height="32" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 8h10M4 13h9M1 18h11M5 23h8" stroke="#000080" stroke-width="1.5"/>
        <polygon points="16,4 16,22 20,18 23,25 26,24 23,17 28,17" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
      </svg>
    `;
  }

  renderMotionTrailSvg() {
    return `
      <svg viewBox="0 0 32 32" width="32" height="32" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
        <polygon points="2,2 2,14 5,11 7,15 9,14 7,10 11,10" fill="#c0c0c0" stroke="#808080" stroke-width="1"/>
        <polygon points="8,6 8,18 11,15 13,19 15,18 13,14 17,14" fill="#dfdfdf" stroke="#808080" stroke-width="1"/>
        <polygon points="14,10 14,22 17,19 19,23 21,22 19,18 23,18" fill="#ffffff" stroke="#404040" stroke-width="1"/>
        <polygon points="20,14 20,26 23,23 25,27 27,26 25,22 29,22" fill="#ffffff" stroke="#000000" stroke-width="1.1"/>
      </svg>
    `;
  }

  disableMouseClicking(dialogEl = null) {
    if (this.mouseClicksDisabled) return;
    this.mouseClicksDisabled = true;
    this.blockedClicks = 0;
    this.disableClicksCount = (this.disableClicksCount || 0) + 1;

    if (typeof document !== 'undefined' && document.body && document.body.classList) {
      document.body.classList.add('win-mouse-clicks-disabled');
    }

    const getEl = () => dialogEl || (window.winManager && window.winManager.windows.get('app_mouse_cpl') && window.winManager.windows.get('app_mouse_cpl').element);
    const el = getEl();
    if (el) {
      const iso = el.querySelector('#mouse-iso-svg');
      if (iso && iso.classList) iso.classList.add('clicks-disabled');
      const chk = el.querySelector('#mouse-disable-clicks');
      if (chk) chk.checked = true;
      const desc = el.querySelector('#mouse-disable-desc');
      if (desc) {
        const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
        desc.classList.add('is-warning');
        desc.textContent = isRu
          ? 'Щелчки кнопок мыши отключены. Снять этот флажок мышью больше нельзя...'
          : 'Mouse clicking is now disabled. You can no longer uncheck this box with the mouse...';
      }
    }

    const blockedEvents = ['mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu'];
    this.clickBlockerBound = (e) => {
      if (!this.mouseClicksDisabled) return;
      if (e.type === 'mousedown') {
        this.blockedClicks++;
        const curEl = getEl();
        if (curEl) {
          const iso = curEl.querySelector('#mouse-iso-svg');
          if (iso && iso.classList) {
            iso.classList.remove('blocked-shake');
            if (iso.getBoundingClientRect) iso.getBoundingClientRect();
            iso.classList.add('blocked-shake');
          }
        }
        if (this.blockedClicks === 2 && window.appClippy && window.appClippy.visible && typeof window.appClippy.animate === 'function') {
          window.appClippy.animate('lookAround');
        }
      }
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    };

    if (typeof window !== 'undefined' && window.addEventListener) {
      blockedEvents.forEach(evt => window.addEventListener(evt, this.clickBlockerBound, true));
    }

    clearTimeout(this.rescueTimer);
    this.rescueTimer = setTimeout(() => {
      this.rescueMouseClicks(getEl());
    }, this.rescueDelayMs || 5000);
  }

  enableMouseClicking(dialogEl = null) {
    clearTimeout(this.rescueTimer);
    this.rescueTimer = null;
    this.mouseClicksDisabled = false;

    const blockedEvents = ['mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu'];
    if (this.clickBlockerBound && typeof window !== 'undefined' && window.removeEventListener) {
      blockedEvents.forEach(evt => window.removeEventListener(evt, this.clickBlockerBound, true));
    }
    this.clickBlockerBound = null;

    if (typeof document !== 'undefined' && document.body && document.body.classList) {
      document.body.classList.remove('win-mouse-clicks-disabled');
    }

    const el = dialogEl || (window.winManager && window.winManager.windows.get('app_mouse_cpl') && window.winManager.windows.get('app_mouse_cpl').element);
    if (el) {
      const chk = el.querySelector('#mouse-disable-clicks');
      if (chk) chk.checked = false;
      const iso = el.querySelector('#mouse-iso-svg');
      if (iso && iso.classList) {
        iso.classList.remove('clicks-disabled');
        iso.classList.remove('blocked-shake');
      }
      const desc = el.querySelector('#mouse-disable-desc');
      if (desc) {
        desc.classList.remove('is-warning');
        desc.textContent = this.t('mouse.disableClickingHint');
      }
    }
  }

  rescueMouseClicks(dialogEl = null) {
    const blocked = this.blockedClicks || 0;
    const count = this.disableClicksCount || 1;
    this.enableMouseClicking(dialogEl);

    if (window.soundSys) {
      if (typeof window.soundSys.playClick === 'function') window.soundSys.playClick();
      if (typeof window.soundSys.playDing === 'function') window.soundSys.playDing();
    }

    if (window.appClippy && typeof window.appClippy.onMouseClicksRescued === 'function') {
      window.appClippy.onMouseClicksRescued(blocked, count);
    } else if (window.clippySystem && typeof window.clippySystem.onMouseClicksRescued === 'function') {
      window.clippySystem.onMouseClicksRescued(blocked, count);
    } else if (window.appClippy && typeof window.appClippy.speak === 'function') {
      if (typeof window.appClippy.show === 'function') window.appClippy.show();
      window.appClippy.speak('Тук-тук! Я снял галочку отключения мыши изнутри. Можете снова щёлкать!', [], '📎', 12000);
    }
  }

  onMouseHelp(activeTabId = 'tab-mouse-buttons') {
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const clippy = window.appClippy;
    if (clippy && typeof clippy.speak === 'function') {
      if (!clippy.isRunning() && typeof clippy.launch === 'function') clippy.launch('help');
      else if (!clippy.visible && typeof clippy.show === 'function') clippy.show();
      if (activeTabId === 'tab-mouse-pointers') {
        clippy.speak(
          isRu
            ? 'Во вкладке <strong>«Указатели»</strong> можно выбрать схему курсоров — например, бронзовые 3D-стрелки или динозаврика из Microslop Plus! 98.'
            : 'On the <strong>Pointers</strong> tab, you can pick a cursor scheme such as 3D-Bronze or the animated Dinosaur from Microslop Plus! 98.',
          [],
          '🖱️',
          9000
        );
      } else if (activeTabId === 'tab-mouse-motion') {
        clippy.speak(
          isRu
            ? 'Вкладка <strong>«Перемещение»</strong> включает легендарный шлейф указателя мыши — как на ноутбуках 1998 года с пассивной матрицей!'
            : 'The <strong>Motion</strong> tab turns on the classic pointer trail from 1998 passive-matrix laptop screens!',
          [],
          '✨',
          9000
        );
      } else {
        clippy.speak(
          isRu
            ? 'Здесь настраиваются кнопки для правши и левши, скорость двойного щелчка на чёртике из табакерки... Только не ставьте галочку <strong>«Отключить щелчки мыши»</strong>, умоляю!'
            : 'Here you can swap left and right buttons and test your double-click speed on the jack-in-the-box... Just please don\'t check <strong>"Disable mouse clicking"</strong>!',
          [],
          '📎',
          10000
        );
      }
      return;
    }
  }

  openMouseProperties() {
    if (window.winManager && window.winManager.windows.has('app_mouse_cpl')) {
      window.winManager.bringToTop('app_mouse_cpl');
      return;
    }

    const saved = this.loadMouseSettings();
    const working = {
      ...saved,
      customSchemes: { ...(saved.customSchemes || {}) }
    };

    let isLeftHanded = working.handedness === 'left';
    let boxOpened = false;
    let activeTabId = 'tab-mouse-buttons';
    let selectedRoleIdx = 0;
    let lastTestClickAt = 0;
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';

    const cursorRoles = [
      { id: 'normal', labelKey: 'mouse.roleNormal' },
      { id: 'help', labelKey: 'mouse.roleHelp' },
      { id: 'working', labelKey: 'mouse.roleWorking' },
      { id: 'busy', labelKey: 'mouse.roleBusy' },
      { id: 'precision', labelKey: 'mouse.rolePrecision' },
      { id: 'text', labelKey: 'mouse.roleText' },
      { id: 'unavailable', labelKey: 'mouse.roleUnavailable' },
      { id: 'vert', labelKey: 'mouse.roleVert' },
      { id: 'horz', labelKey: 'mouse.roleHorz' },
      { id: 'link', labelKey: 'mouse.roleLink' }
    ];

    const builtInSchemes = [
      { id: 'default', label: this.t('mouse.schemeDefault') },
      { id: 'large', label: this.t('mouse.schemeLarge') },
      { id: '3d', label: this.t('mouse.scheme3d') },
      { id: 'dino', label: this.t('mouse.schemeDino') },
      { id: 'inverted', label: this.t('mouse.schemeInverted') }
    ];

    const renderTicks = (count = 7) => `<div class="win-trackbar-ticks">${Array.from({ length: count }, () => '<span></span>').join('')}</div>`;

    const content = document.createElement('div');
    content.className = 'mouse-cpl-root';

    content.innerHTML = `
      <div class="win-tabs">
        <div class="win-tab win-tab-btn active" data-tab="tab-mouse-buttons">${this.t('mouse.tabButtons')}</div>
        <div class="win-tab win-tab-btn" data-tab="tab-mouse-pointers">${this.t('mouse.tabPointers')}</div>
        <div class="win-tab win-tab-btn" data-tab="tab-mouse-motion">${this.t('mouse.tabMotion')}</div>
      </div>

      <div class="win-tab-panel mouse-tab-panel">
        <div class="mouse-tab-content" id="tab-mouse-buttons" style="display:flex;">
          <fieldset class="mouse-group">
            <legend>${this.t('mouse.buttonConfig')}</legend>
            <div class="mouse-hand-radios">
              <label class="mouse-hand-radio-label" for="mouse-right">
                <input type="radio" id="mouse-right" name="mouse-hand" value="right" ${!isLeftHanded ? 'checked' : ''}>
                <span>${this.t('mouse.rightHanded')}</span>
              </label>
              <label class="mouse-hand-radio-label" for="mouse-left">
                <input type="radio" id="mouse-left" name="mouse-hand" value="left" ${isLeftHanded ? 'checked' : ''}>
                <span>${this.t('mouse.leftHanded')}</span>
              </label>
            </div>
            <div class="mouse-btn-config-body">
              <div class="mouse-btn-col" id="mouse-left-btn-col">
                <div class="mouse-btn-col-title">${this.t('mouse.leftButton')}</div>
                <div class="mouse-btn-col-item" id="mouse-left-act1">${this.t(isLeftHanded ? 'mouse.contextMenu' : 'mouse.normalSelect')}</div>
                <div class="mouse-btn-col-item" id="mouse-left-act2">${this.t(isLeftHanded ? 'mouse.specialDrag' : 'mouse.normalDrag')}</div>
              </div>
              <div class="mouse-visual-container" id="mouse-visual-wrap">
                ${this.renderIsoMouseSvg(isLeftHanded, this.mouseClicksDisabled)}
              </div>
              <div class="mouse-btn-col" id="mouse-right-btn-col">
                <div class="mouse-btn-col-title">${this.t('mouse.rightButton')}</div>
                <div class="mouse-btn-col-item" id="mouse-right-act1">${this.t(isLeftHanded ? 'mouse.normalSelect' : 'mouse.contextMenu')}</div>
                <div class="mouse-btn-col-item" id="mouse-right-act2">${this.t(isLeftHanded ? 'mouse.normalDrag' : 'mouse.specialDrag')}</div>
              </div>
            </div>
          </fieldset>

          <fieldset class="mouse-group">
            <legend>${this.t('mouse.doubleClickSpeed')}</legend>
            <div class="mouse-dc-row">
              <div class="mouse-dc-slider-side">
                <div class="mouse-slider-row">
                  <span class="mouse-slider-label">${this.t('mouse.slow')}</span>
                  <div class="win-trackbar-wrap">
                    <input type="range" class="win-trackbar" id="mouse-dc-speed" min="1" max="10" value="${working.doubleClickSpeed}">
                    ${renderTicks(2)}
                  </div>
                  <span class="mouse-slider-label is-right">${this.t('mouse.fast')}</span>
                </div>
              </div>
              <div class="mouse-test-col">
                <div>${this.t('mouse.testArea')}</div>
                <div class="mouse-test-box-wrap" id="mouse-test-box" title="${this.t('mouse.testHint')}">
                  <div class="mouse-test-box-icon" id="mouse-box-icon">${this.renderJackBoxSvg(false)}</div>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset class="mouse-group mouse-clicking-group">
            <legend>${this.t('mouse.clickingGroup')}</legend>
            <label class="win-label-row mouse-disable-row" for="mouse-disable-clicks">
              <input type="checkbox" id="mouse-disable-clicks" ${this.mouseClicksDisabled ? 'checked' : ''}>
              <span>${this.t('mouse.disableClicking')}</span>
            </label>
            <div class="mouse-disable-desc" id="mouse-disable-desc">${this.t('mouse.disableClickingHint')}</div>
          </fieldset>
        </div>

        <div class="mouse-tab-content hidden" id="tab-mouse-pointers" style="display:none;">
          <div class="mouse-pointers-top">
            <fieldset class="mouse-group mouse-scheme-group">
              <legend>${this.t('mouse.schemeGroup')}</legend>
              <select id="mouse-scheme-select" class="win-select">
                ${builtInSchemes.map(s => `<option value="${s.id}" ${working.scheme === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
                ${Object.keys(working.customSchemes).map(k => `<option value="custom:${k}" ${working.scheme === `custom:${k}` ? 'selected' : ''}>${k}</option>`).join('')}
              </select>
              <div class="mouse-scheme-btns">
                <button class="win-btn" id="btn-mouse-scheme-save">${this.t('mouse.saveAs')}</button>
                <button class="win-btn" id="btn-mouse-scheme-del" ${String(working.scheme).startsWith('custom:') ? '' : 'disabled'}>${this.t('mouse.deleteScheme')}</button>
              </div>
            </fieldset>
            <div class="mouse-pointer-preview-box" id="mouse-pointer-preview">
              ${this.renderCursorRoleSvg('normal', working.scheme)}
            </div>
          </div>

          <div>${this.t('mouse.customize')}</div>
          <div class="mouse-pointers-list" id="mouse-pointers-list"></div>

          <div class="mouse-pointers-bottom">
            <button class="win-btn" id="btn-mouse-ptr-default">${this.t('mouse.useDefault')}</button>
            <button class="win-btn" id="btn-mouse-ptr-browse">${this.t('mouse.browse')}</button>
          </div>
        </div>

        <div class="mouse-tab-content hidden" id="tab-mouse-motion" style="display:none;">
          <fieldset class="mouse-group">
            <legend>${this.t('mouse.pointerSpeed')}</legend>
            <div class="mouse-motion-row">
              <div class="mouse-motion-icon">${this.renderMotionSpeedSvg()}</div>
              <div class="mouse-motion-controls">
                <div class="mouse-slider-row">
                  <span class="mouse-slider-label">${this.t('mouse.slow')}</span>
                  <div class="win-trackbar-wrap">
                    <input type="range" class="win-trackbar" id="mouse-ptr-speed" min="1" max="10" value="${working.pointerSpeed}">
                    ${renderTicks(7)}
                  </div>
                  <span class="mouse-slider-label is-right">${this.t('mouse.fast')}</span>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset class="mouse-group">
            <legend>${this.t('mouse.pointerTrailGroup')}</legend>
            <div class="mouse-motion-row">
              <div class="mouse-motion-icon">${this.renderMotionTrailSvg()}</div>
              <div class="mouse-motion-controls">
                <label class="win-label-row" for="mouse-chk-trails">
                  <input type="checkbox" id="mouse-chk-trails" ${working.pointerTrails ? 'checked' : ''}>
                  <span>${this.t('mouse.pointerTrails')}</span>
                </label>
                <div class="mouse-slider-row">
                  <span class="mouse-slider-label">${this.t('mouse.trailShort')}</span>
                  <div class="win-trackbar-wrap">
                    <input type="range" class="win-trackbar" id="mouse-trail-length" min="2" max="10" value="${working.trailLength}" ${working.pointerTrails ? '' : 'disabled'}>
                    ${renderTicks(7)}
                  </div>
                  <span class="mouse-slider-label is-right">${this.t('mouse.trailLong')}</span>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
      </div>

      <div class="win-dialog-buttons" style="margin-top:8px; display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn is-default btn-mouse-ok" style="min-width:75px;">${this.t('btn.ok')}</button>
        <button class="win-btn btn-mouse-cancel" style="min-width:75px;">${this.t('btn.cancel')}</button>
        <button class="win-btn btn-mouse-apply" style="min-width:75px;" disabled>${this.t('btn.apply')}</button>
      </div>
    `;

    let committed = false;

    const dialog = window.winManager.createWindow({
      id: 'app_mouse_cpl',
      title: this.t('mouse.title'),
      icon: 'mouse',
      width: 428,
      height: 432,
      resizable: false,
      minimizable: false,
      maximizable: false,
      helpButton: true,
      onHelp: () => this.onMouseHelp(activeTabId),
      isDialog: true,
      content,
      onClose: () => {
        if (!committed) {
          this.applyMouseSettings(this.mouseSettings);
        }
      }
    });

    const el = dialog.element;
    const btnApply = el.querySelector('.btn-mouse-apply');
    const markDirty = () => {
      if (btnApply) btnApply.disabled = false;
    };

    const saveControls = window.winManager.rememberControls
      ? window.winManager.rememberControls(el, 'mouse', 'input:not(#mouse-disable-clicks), select')
      : () => {};

    if (btnApply) btnApply.disabled = true;

    el.querySelectorAll('.win-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        el.querySelectorAll('.win-tab-btn').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        activeTabId = tabBtn.dataset.tab;
        el.querySelectorAll('.mouse-tab-content').forEach(tc => {
          tc.classList.add('hidden');
          tc.style.display = 'none';
        });
        const target = el.querySelector(`#${activeTabId}`);
        if (target) {
          target.classList.remove('hidden');
          target.style.display = 'flex';
        }
      });
    });

    const visLeft = el.querySelector('#vis-left');
    const visRight = el.querySelector('#vis-right');
    const radioRight = el.querySelector('#mouse-right');
    const radioLeft = el.querySelector('#mouse-left');
    const leftAct1 = el.querySelector('#mouse-left-act1');
    const leftAct2 = el.querySelector('#mouse-left-act2');
    const rightAct1 = el.querySelector('#mouse-right-act1');
    const rightAct2 = el.querySelector('#mouse-right-act2');

    const updateHandednessUi = (leftHanded) => {
      isLeftHanded = Boolean(leftHanded);
      working.handedness = isLeftHanded ? 'left' : 'right';
      if (radioRight) radioRight.checked = !isLeftHanded;
      if (radioLeft) radioLeft.checked = isLeftHanded;
      if (visLeft && visRight) {
        if (isLeftHanded) {
          visLeft.classList.remove('active');
          visRight.classList.add('active');
        } else {
          visRight.classList.remove('active');
          visLeft.classList.add('active');
        }
      }
      if (leftAct1) leftAct1.textContent = this.t(isLeftHanded ? 'mouse.contextMenu' : 'mouse.normalSelect');
      if (leftAct2) leftAct2.textContent = this.t(isLeftHanded ? 'mouse.specialDrag' : 'mouse.normalDrag');
      if (rightAct1) rightAct1.textContent = this.t(isLeftHanded ? 'mouse.normalSelect' : 'mouse.contextMenu');
      if (rightAct2) rightAct2.textContent = this.t(isLeftHanded ? 'mouse.normalDrag' : 'mouse.specialDrag');
    };

    el.querySelectorAll('input[name="mouse-hand"]').forEach(r => {
      r.addEventListener('change', () => {
        if (!r.checked) return;
        updateHandednessUi(r.value === 'left');
        markDirty();
      });
    });

    if (visLeft) {
      visLeft.addEventListener('click', () => {
        updateHandednessUi(false);
        markDirty();
      });
    }
    if (visRight) {
      visRight.addEventListener('click', () => {
        updateHandednessUi(true);
        markDirty();
      });
    }

    const dcSlider = el.querySelector('#mouse-dc-speed');
    if (dcSlider) {
      dcSlider.addEventListener('input', () => {
        working.doubleClickSpeed = parseInt(dcSlider.value, 10) || 6;
        markDirty();
      });
    }

    const testBox = el.querySelector('#mouse-test-box');
    const boxIcon = el.querySelector('#mouse-box-icon');
    const toggleJackBox = () => {
      boxOpened = !boxOpened;
      if (boxIcon) {
        boxIcon.innerHTML = this.renderJackBoxSvg(boxOpened);
        boxIcon.classList.remove('jack-pop');
        if (boxIcon.getBoundingClientRect) boxIcon.getBoundingClientRect();
        if (boxOpened) boxIcon.classList.add('jack-pop');
      }
      if (window.soundSys) {
        if (boxOpened && typeof window.soundSys.playDing === 'function') window.soundSys.playDing();
        else if (!boxOpened && typeof window.soundSys.playClick === 'function') window.soundSys.playClick();
      }
    };

    if (testBox) {
      testBox.addEventListener('mousedown', () => {
        const now = Date.now();
        const speed = dcSlider ? (parseInt(dcSlider.value, 10) || 6) : 6;
        const thresholdMs = 950 - speed * 75;
        if (lastTestClickAt > 0 && (now - lastTestClickAt) <= thresholdMs) {
          lastTestClickAt = 0;
          testBox._handledByTiming = true;
          toggleJackBox();
          setTimeout(() => { testBox._handledByTiming = false; }, 120);
        } else {
          lastTestClickAt = now;
          if (boxIcon && !boxOpened) {
            boxIcon.classList.add('crank-turn');
            setTimeout(() => boxIcon.classList.remove('crank-turn'), 150);
          }
        }
      });

      testBox.addEventListener('dblclick', () => {
        if (testBox._handledByTiming) return;
        lastTestClickAt = 0;
        toggleJackBox();
      });
    }

    const disableChk = el.querySelector('#mouse-disable-clicks');
    if (disableChk) {
      disableChk.addEventListener('change', () => {
        if (disableChk.checked) {
          if (window.soundSys && typeof window.soundSys.playClick === 'function') {
            window.soundSys.playClick();
          }
          this.disableMouseClicking(el);
        } else {
          this.enableMouseClicking(el);
        }
      });
    }

    const schemeSelect = el.querySelector('#mouse-scheme-select');
    const pointersList = el.querySelector('#mouse-pointers-list');
    const pointerPreview = el.querySelector('#mouse-pointer-preview');
    const btnSchemeSave = el.querySelector('#btn-mouse-scheme-save');
    const btnSchemeDel = el.querySelector('#btn-mouse-scheme-del');
    const btnPtrDefault = el.querySelector('#btn-mouse-ptr-default');
    const btnPtrBrowse = el.querySelector('#btn-mouse-ptr-browse');

    const effectiveSchemeId = (schemeVal) => {
      const s = String(schemeVal || 'default');
      if (s.startsWith('custom:')) {
        return working.customSchemes[s.slice(7)] || 'default';
      }
      return s;
    };

    const renderPointersList = () => {
      if (!pointersList) return;
      const effScheme = effectiveSchemeId(working.scheme);
      pointersList.innerHTML = cursorRoles.map((role, idx) => `
        <div class="mouse-pointer-row${idx === selectedRoleIdx ? ' selected' : ''}" data-idx="${idx}">
          <span>${this.t(role.labelKey)}</span>
          <span class="mouse-pointer-row-cursor">${this.renderCursorRoleSvg(role.id, effScheme)}</span>
        </div>
      `).join('');

      pointersList.querySelectorAll('.mouse-pointer-row').forEach(row => {
        row.addEventListener('click', () => {
          selectedRoleIdx = parseInt(row.dataset.idx, 10) || 0;
          renderPointersList();
        });
      });

      if (pointerPreview) {
        const role = cursorRoles[selectedRoleIdx] || cursorRoles[0];
        pointerPreview.innerHTML = this.renderCursorRoleSvg(role.id, effScheme);
      }
      if (btnSchemeDel) {
        btnSchemeDel.disabled = !String(working.scheme).startsWith('custom:');
      }
    };

    renderPointersList();

    if (schemeSelect) {
      schemeSelect.addEventListener('change', () => {
        working.scheme = schemeSelect.value;
        renderPointersList();
        markDirty();
      });
    }

    if (btnPtrDefault) {
      btnPtrDefault.addEventListener('click', () => {
        working.scheme = 'default';
        if (schemeSelect) schemeSelect.value = 'default';
        renderPointersList();
        markDirty();
      });
    }

    if (btnPtrBrowse) {
      btnPtrBrowse.addEventListener('click', () => {
        const order = ['default', '3d', 'dino', 'large', 'inverted'];
        const curr = effectiveSchemeId(working.scheme);
        const next = order[(order.indexOf(curr) + 1) % order.length];
        working.scheme = next;
        if (schemeSelect) schemeSelect.value = next;
        renderPointersList();
        markDirty();
      });
    }

    if (btnSchemeSave) {
      btnSchemeSave.addEventListener('click', () => {
        const baseScheme = effectiveSchemeId(working.scheme);
        const customName = isRu ? `Моя схема (${Object.keys(working.customSchemes).length + 1})` : `My Scheme (${Object.keys(working.customSchemes).length + 1})`;
        working.customSchemes[customName] = baseScheme;
        working.scheme = `custom:${customName}`;
        if (schemeSelect) {
          const opt = document.createElement('option');
          opt.value = working.scheme;
          opt.textContent = customName;
          schemeSelect.appendChild(opt);
          schemeSelect.value = working.scheme;
        }
        renderPointersList();
        markDirty();
      });
    }

    if (btnSchemeDel) {
      btnSchemeDel.addEventListener('click', () => {
        if (!String(working.scheme).startsWith('custom:')) return;
        const name = String(working.scheme).slice(7);
        delete working.customSchemes[name];
        if (schemeSelect) {
          const opt = [...schemeSelect.options].find(o => o.value === working.scheme);
          if (opt) opt.remove();
          schemeSelect.value = 'default';
        }
        working.scheme = 'default';
        renderPointersList();
        markDirty();
      });
    }

    const ptrSpeedSlider = el.querySelector('#mouse-ptr-speed');
    const chkTrails = el.querySelector('#mouse-chk-trails');
    const trailLenSlider = el.querySelector('#mouse-trail-length');

    if (ptrSpeedSlider) {
      ptrSpeedSlider.addEventListener('input', () => {
        working.pointerSpeed = parseInt(ptrSpeedSlider.value, 10) || 6;
        markDirty();
      });
    }

    if (chkTrails) {
      chkTrails.addEventListener('change', () => {
        working.pointerTrails = chkTrails.checked;
        if (trailLenSlider) trailLenSlider.disabled = !chkTrails.checked;
        this.syncPointerTrails(working.pointerTrails, working.trailLength);
        markDirty();
      });
    }

    if (trailLenSlider) {
      trailLenSlider.addEventListener('input', () => {
        working.trailLength = parseInt(trailLenSlider.value, 10) || 6;
        if (working.pointerTrails) {
          this.syncPointerTrails(true, working.trailLength);
        }
        markDirty();
      });
    }

    const commitSettings = () => {
      const toSave = {
        ...working,
        scheme: effectiveSchemeId(working.scheme)
      };
      this.saveMouseSettings(toSave);
      saveControls();
      if (btnApply) btnApply.disabled = true;
    };

    el.querySelector('.btn-mouse-ok').addEventListener('click', () => {
      committed = true;
      commitSettings();
      window.winManager.closeWindow('app_mouse_cpl');
    });

    el.querySelector('.btn-mouse-cancel').addEventListener('click', () => {
      this.applyMouseSettings(this.mouseSettings);
      window.winManager.closeWindow('app_mouse_cpl');
    });

    el.querySelector('.btn-mouse-apply').addEventListener('click', () => {
      if (window.soundSys && typeof window.soundSys.playClick === 'function') window.soundSys.playClick();
      commitSettings();
    });
  }

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
      { id: 'shutdown', name: isRu ? 'Выход из Win' : 'Exit Win', play: () => window.soundSys && window.soundSys.playShutdown() },
      { id: 'ding', name: isRu ? 'Звездочка' : 'Asterisk (Ding)', play: () => window.soundSys && window.soundSys.playDing() },
      { id: 'chord', name: isRu ? 'Аккорд' : 'Chord', play: () => window.soundSys && window.soundSys.playChord() },
      { id: 'error', name: isRu ? 'Критическая ошибка' : 'Critical Stop', play: () => window.soundSys && window.soundSys.playError() },
      { id: 'question', name: isRu ? 'Вопрос' : 'Question', play: () => window.soundSys && window.soundSys.playQuestion() },
      { id: 'click', name: isRu ? 'Команда меню' : 'Menu Command', play: () => window.soundSys && window.soundSys.playClick() }
    ];

    let selectedEvent = eventsList[0];

    content.innerHTML = `
      <div style="display:flex; border-bottom:1px solid #808080; margin-bottom:8px;">
        <button class="win-tab-btn active" data-tab="tab-mmsys-sounds" style="padding:3px 10px; font-weight:bold; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:var(--win-bg);">${this.t('mmsys.tabSounds')}</button>
        <button class="win-tab-btn" data-tab="tab-mmsys-audio" style="padding:3px 10px; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:#d4d0c8;">${this.t('mmsys.tabAudio')}</button>
      </div>

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
              <option value="default" selected>${isRu ? 'Стандартная схема Win' : 'Win Default'}</option>
              <option value="robotz">${isRu ? 'Robotz (Роботы)' : 'Robotz'}</option>
              <option value="jungle">${isRu ? 'Jungle (Джунгли)' : 'Jungle'}</option>
              <option value="none">${isRu ? '(Нет звуков)' : '(No sounds)'}</option>
            </select>
            <button class="win-btn" id="btn-mmsys-play" style="min-width:32px; height:22px; font-size:12px;" title="${this.t('mmsys.preview')}">▶</button>
          </div>
        </fieldset>
      </div>

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

    el.querySelectorAll('.mmsys-event-item').forEach(item => {
      item.addEventListener('click', () => {
        el.querySelectorAll('.mmsys-event-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        const idx = parseInt(item.dataset.idx);
        selectedEvent = eventsList[idx];
      });
    });

    const playBtn = el.querySelector('#btn-mmsys-play');
    playBtn.addEventListener('click', () => {
      if (selectedEvent && selectedEvent.play) {
        selectedEvent.play();
      }
    });

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

  loadAppWizState() {
    const cats = this.getAppWizCategories();
    const defaultComponents = {};
    cats.forEach(cat => {
      cat.subcomponents.forEach(sub => {
        defaultComponents[sub.id] = sub.defaultChecked !== false;
      });
    });
    try {
      const raw = localStorage.getItem('win98_appwiz_state');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          removedBuiltins: Array.isArray(parsed.removedBuiltins) ? parsed.removedBuiltins : [],
          components: Object.assign({}, defaultComponents, parsed.components || {}),
          bootDiskCreated: Boolean(parsed.bootDiskCreated)
        };
      }
    } catch (e) {}
    return {
      removedBuiltins: [],
      components: defaultComponents,
      bootDiskCreated: false
    };
  }

  saveAppWizState(state) {
    try {
      localStorage.setItem('win98_appwiz_state', JSON.stringify(state));
    } catch (e) {}
  }

  formatAppWizMb(val) {
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const fixed = Number(val || 0).toFixed(1);
    const numStr = isRu ? fixed.replace('.', ',') : fixed;
    return `${numStr} ${this.t('appwiz.mbUnit')}`;
  }

  getAppWizCategories() {
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    return [
      {
        id: 'accessibility',
        name: isRu ? 'Специальные возможности' : 'Accessibility',
        desc: isRu
          ? 'Изменение параметров клавиатуры, звука и экрана для людей с ограниченными возможностями.'
          : 'Changes keyboard, sound, and display options for people with mobility, hearing, or visual impairments.',
        subcomponents: [
          {
            id: 'acc_options',
            name: isRu ? 'Специальные возможности' : 'Accessibility Options',
            size: 0.5,
            defaultChecked: true,
            desc: isRu ? 'Настройка залипания клавиш, озвучивания и высокой контрастности.' : 'Configures StickyKeys, SoundSentry, and High Contrast display.'
          },
          {
            id: 'acc_tools',
            name: isRu ? 'Средства специальных возможностей' : 'Accessibility Tools',
            size: 2.0,
            defaultChecked: false,
            desc: isRu ? 'Экранная лупа и мастер настройки специальных возможностей.' : 'Includes Microslop Magnifier and the Accessibility Wizard.'
          }
        ]
      },
      {
        id: 'accessories',
        name: isRu ? 'Стандартные' : 'Accessories',
        desc: isRu
          ? 'Включает стандартные программы и расширения для работы на компьютере.'
          : 'Includes accessory programs and enhancements for your computer.',
        subcomponents: [
          {
            id: 'calc',
            name: isRu ? 'Калькулятор' : 'Calculator',
            size: 0.2,
            defaultChecked: true,
            desc: isRu ? 'Выполнение стандартных и инженерных расчетов.' : 'Performs standard and scientific calculations.'
          },
          {
            id: 'notepad',
            name: isRu ? 'Блокнот' : 'Notepad',
            size: 0.2,
            defaultChecked: true,
            desc: isRu ? 'Создание и редактирование текстовых файлов.' : 'Creates and edits plain text files.'
          },
          {
            id: 'wordpad',
            name: 'WordPad',
            size: 1.6,
            defaultChecked: true,
            desc: isRu ? 'Редактор документов с форматированием текста и шрифтов.' : 'Creates and edits formatted documents.'
          },
          {
            id: 'mspaint',
            name: 'Paint',
            size: 1.4,
            defaultChecked: true,
            desc: isRu ? 'Создание и редактирование точечных рисунков BMP.' : 'Creates and edits bitmap pictures.'
          },
          {
            id: 'charmap',
            name: isRu ? 'Таблица символов' : 'Character Map',
            size: 0.2,
            defaultChecked: true,
            desc: isRu ? 'Вставка специальных символов и знаков в документы.' : 'Inserts special characters into documents.'
          },
          {
            id: 'games',
            name: isRu ? 'Игры (Сапер, Косынка, Солитер, Pinball, Безмятежность)' : 'Games (Minesweeper, Solitaire, FreeCell, Pinball, Bliss)',
            size: 6.2,
            defaultChecked: true,
            desc: isRu ? 'Классические настольные игры для отдыха в перерыве.' : 'Classic card and arcade games for Win 98.'
          },
          {
            id: 'wallpapers',
            name: isRu ? 'Рисунки рабочего стола' : 'Desktop Wallpaper',
            size: 1.4,
            defaultChecked: true,
            desc: isRu ? 'Фоновые узоры и картинки для рабочего стола.' : 'Background images and patterns for your desktop.'
          },
          {
            id: 'screensavers',
            name: isRu ? 'Экранные заставки' : 'Screen Savers',
            size: 2.1,
            defaultChecked: true,
            desc: isRu ? 'Трубы 3D, сквозь вселенную и другие заставки.' : '3D Pipes, Starfield Simulation, and other screen savers.'
          },
          {
            id: 'mouse_pointers',
            name: isRu ? 'Указатели мыши' : 'Mouse Pointers',
            size: 0.5,
            defaultChecked: false,
            desc: isRu ? 'Дополнительные наборы крупных и анимированных курсоров.' : 'Additional large and animated mouse pointer schemes.'
          }
        ]
      },
      {
        id: 'addressbook',
        name: isRu ? 'Адресная книга' : 'Address Book',
        desc: isRu
          ? 'Единый справочник адресов электронной почты и телефонов для программ Win.'
          : 'Provides a central directory for e-mail addresses and contact information.',
        subcomponents: [
          {
            id: 'addr_book',
            name: isRu ? 'Адресная книга Win' : 'Win Address Book',
            size: 0.8,
            defaultChecked: true,
            desc: isRu ? 'Хранение карточек контактов для Outlook Express.' : 'Stores contact cards for Outlook Express.'
          }
        ]
      },
      {
        id: 'communications',
        name: isRu ? 'Связь' : 'Communications',
        desc: isRu
          ? 'Включает средства для подключения к другим компьютерам и работы в сети.'
          : 'Includes accessories to help you connect to other computers and online services.',
        subcomponents: [
          {
            id: 'dialup',
            name: isRu ? 'Удаленный доступ к сети' : 'Dial-Up Networking',
            size: 1.4,
            defaultChecked: true,
            desc: isRu ? 'Подключение к поставщику Интернета через модем.' : 'Connects to an Internet service provider via modem.'
          },
          {
            id: 'hyperterm',
            name: 'HyperTerminal',
            size: 0.9,
            defaultChecked: true,
            desc: isRu ? 'Подключение к удаленным компьютерам и станциям BBS.' : 'Connects to remote computers and bulletin board systems.'
          },
          {
            id: 'phone_dialer',
            name: isRu ? 'Набор номера' : 'Phone Dialer',
            size: 0.2,
            defaultChecked: true,
            desc: isRu ? 'Быстрый набор телефонных номеров через модем.' : 'Dials phone numbers using your computer modem.'
          },
          {
            id: 'netmeeting',
            name: 'Microslop NetMeeting',
            size: 3.5,
            defaultChecked: false,
            desc: isRu ? 'Голосовая связь и общий рабочий стол по сети.' : 'Voice calls and application sharing over the Internet.'
          }
        ]
      },
      {
        id: 'themes',
        name: isRu ? 'Темы рабочего стола' : 'Desktop Themes',
        desc: isRu
          ? 'Включает фоновые рисунки, звуки, указатели мыши и заставки в едином стиле.'
          : 'Includes desktop backgrounds, sounds, animated cursors, and screen savers.',
        subcomponents: [
          {
            id: 'themes_support',
            name: isRu ? 'Поддержка тем рабочего стола' : 'Desktop Themes Support',
            size: 1.5,
            defaultChecked: true,
            desc: isRu ? 'Движок применения тем оформления рабочего стола.' : 'Core engine for applying desktop themes.'
          },
          {
            id: 'themes_pack',
            name: isRu ? 'Темы оформления Microslop Plus! 98' : 'Microslop Plus! 98 Themes',
            size: 14.4,
            defaultChecked: true,
            desc: isRu ? 'Классические темы: Тайна, Природа, Космос, Наука и 60-е.' : 'Classic themes including Mystery, Nature, Space, and Science.'
          }
        ]
      },
      {
        id: 'internet',
        name: isRu ? 'Средства Интернета' : 'Internet Tools',
        desc: isRu
          ? 'Включает обозреватель Internet Explorer и средства для просмотра и публикации веб-страниц.'
          : 'Includes Internet Explorer and tools for browsing and publishing Web pages.',
        subcomponents: [
          {
            id: 'ie5',
            name: 'Microslop Internet Explorer 5',
            size: 11.2,
            defaultChecked: true,
            desc: isRu ? 'Обозреватель Всемирной паутины для просмотра сайтов.' : 'Web browser for viewing pages on the World Wide Web.'
          },
          {
            id: 'pws',
            name: isRu ? 'Персональный веб-сервер' : 'Personal Web Server',
            size: 3.2,
            defaultChecked: false,
            desc: isRu ? 'Размещение собственной домашней странички в локальной сети.' : 'Hosts personal Web pages on your local network.'
          },
          {
            id: 'web_pub',
            name: isRu ? 'Мастер публикации в Веб' : 'Web Publishing Wizard',
            size: 0.9,
            defaultChecked: false,
            desc: isRu ? 'Отправка файлов на веб-сервер провайдера.' : 'Uploads files and pages to a Web server.'
          }
        ]
      },
      {
        id: 'outlook',
        name: 'Microslop Outlook Express',
        desc: isRu
          ? 'Клиент электронной почты и групп новостей Интернета.'
          : 'Internet e-mail and newsgroup client.',
        subcomponents: [
          {
            id: 'oe_mail',
            name: isRu ? 'Почта и новости Outlook Express' : 'Outlook Express Mail and News',
            size: 4.2,
            defaultChecked: true,
            desc: isRu ? 'Прием и отправка электронных писем.' : 'Sends and receives e-mail messages and newsgroup posts.'
          }
        ]
      },
      {
        id: 'multimedia',
        name: isRu ? 'Мультимедиа' : 'Multimedia',
        desc: isRu
          ? 'Средства для воспроизведения и записи звука и видео.'
          : 'Includes programs for playing and recording sound and video.',
        subcomponents: [
          {
            id: 'mplayer',
            name: isRu ? 'Универсальный проигрыватель ActiveMovie' : 'ActiveMovie Media Player',
            size: 2.4,
            defaultChecked: true,
            desc: isRu ? 'Воспроизведение видеофайлов и звуковых клипов.' : 'Plays video files and audio clips.'
          },
          {
            id: 'sndrec',
            name: isRu ? 'Звукозапись' : 'Sound Recorder',
            size: 0.3,
            defaultChecked: true,
            desc: isRu ? 'Запись и воспроизведение звуковых файлов WAV.' : 'Records and plays WAV sound files.'
          },
          {
            id: 'sndvol',
            name: isRu ? 'Регулятор громкости' : 'Volume Control',
            size: 0.2,
            defaultChecked: true,
            desc: isRu ? 'Настройка уровня громкости и баланса звуковой карты.' : 'Adjusts sound card volume and balance.'
          },
          {
            id: 'cdplayer',
            name: isRu ? 'Лазерный проигрыватель' : 'CD Player',
            size: 0.3,
            defaultChecked: true,
            desc: isRu ? 'Проигрывание музыкальных компакт-дисков Audio CD.' : 'Plays audio compact discs on your CD-ROM drive.'
          },
          {
            id: 'utopia_sounds',
            name: isRu ? 'Звуковые схемы Мультимедиа' : 'Multimedia Sound Schemes',
            size: 4.9,
            defaultChecked: true,
            desc: isRu ? 'Звуковые схемы Утопия, Робот и Классическая.' : 'Utopia, Robotz, and Classic system sound schemes.'
          }
        ]
      },
      {
        id: 'systools',
        name: isRu ? 'Служебные программы' : 'System Tools',
        desc: isRu
          ? 'Средства для обслуживания диска, проверки ошибок и повышения быстродействия системы.'
          : 'Tools to maintain your hard disk and monitor system performance.',
        subcomponents: [
          {
            id: 'defrag',
            name: isRu ? 'Дефрагментация диска' : 'Disk Defragmenter',
            size: 0.6,
            defaultChecked: true,
            desc: isRu ? 'Упорядочивание файлов на жестком диске для ускорения чтения.' : 'Rearranges files and unused space on your hard disk.'
          },
          {
            id: 'scandisk',
            name: isRu ? 'Проверка диска (ScanDisk)' : 'ScanDisk',
            size: 0.5,
            defaultChecked: true,
            desc: isRu ? 'Поиск и исправление ошибок в файлах и папках.' : 'Checks drives for logical and physical errors.'
          },
          {
            id: 'cleanmgr',
            name: isRu ? 'Очистка диска' : 'Disk Cleanup',
            size: 0.4,
            defaultChecked: true,
            desc: isRu ? 'Удаление временных файлов и очистка Корзины.' : 'Removes temporary files to free disk space.'
          },
          {
            id: 'sysinfo',
            name: isRu ? 'Сведения о системе и Настройка (MSConfig)' : 'System Information & MSConfig',
            size: 1.8,
            defaultChecked: true,
            desc: isRu ? 'Просмотр автозагрузки, конфигурации SYSTEM.INI и WIN.INI.' : 'Configures startup programs, SYSTEM.INI, and WIN.INI.'
          },
          {
            id: 'char_conv',
            name: isRu ? 'Таблицы перекодировки символов' : 'Character Conversion Tables',
            size: 0.8,
            defaultChecked: false,
            desc: isRu ? 'Дополнительные кодовые страницы DOS и кириллицы.' : 'Additional code pages and character tables.'
          }
        ]
      }
    ];
  }

  getAppWizInstalledSoftware(state) {
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const removed = new Set((state && state.removedBuiltins) || []);
    const list = [];

    list.push({
      id: 'office97',
      name: isRu
        ? 'Microslop Office 97 Professional (включая Скрепыша)'
        : 'Microslop Office 97 Professional (with Clippy)',
      size: this.formatAppWizMb(42.0),
      sizeMb: 42.0,
      icon: 'excel',
      isOffice: true
    });

    const builtins = [
      { id: 'photoshop', name: 'Adobe Photoshop 5.0 (Adobe Systems)', sizeMb: 32.5, icon: 'photoshop' },
      { id: 'icq', name: 'ICQ 98a (Mirabilis Ltd.)', sizeMb: 5.2, icon: 'icq-online' },
      { id: 'netscape', name: 'Netscape Communicator 4.5', sizeMb: 14.6, icon: 'netscape' },
      { id: 'wincmd', name: 'WinCommander 98 4.01 (C. Ghisler & Co.)', sizeMb: 2.1, icon: 'wincommander' },
      { id: 'winrar', name: 'WinRAR 98 2.50 (Eugene Roshal)', sizeMb: 1.1, icon: 'winrar' }
    ];

    builtins.forEach(item => {
      if (!removed.has(item.id)) {
        list.push({
          id: item.id,
          name: item.name,
          size: this.formatAppWizMb(item.sizeMb),
          sizeMb: item.sizeMb,
          icon: item.icon,
          isBuiltin: true
        });
      }
    });

    const gm = window.gameManager;
    if (gm) {
      if (typeof gm.isSteamInstalled === 'function' && gm.isSteamInstalled() && !removed.has('steam_client')) {
        list.push({
          id: 'steam_client',
          name: 'Steam Client 98 (Valve Corporation)',
          size: this.formatAppWizMb(3.4),
          sizeMb: 3.4,
          icon: 'steam',
          isSteamClient: true
        });
      }
      if (gm.catalog) {
        Object.keys(gm.catalog).forEach(id => {
          if (list.some(existing => existing.id === id)) return;
          if (typeof gm.isInstalled === 'function' && gm.isInstalled(id)) {
            const entry = gm.catalog[id];
            const rawSize = parseFloat(String(entry.size || '4.0').replace(',', '.')) || 4.0;
            list.push({
              id,
              name: entry.title || id,
              size: this.formatAppWizMb(rawSize),
              sizeMb: rawSize,
              icon: entry.icon || 'folder',
              isGameManager: true
            });
          }
        });
      }
    }

    return list;
  }

  renderAppWizInstallSvg() {
    return `<svg viewBox="0 0 32 32" width="32" height="32" shape-rendering="crispEdges">
      <rect x="3" y="2" width="18" height="14" fill="#808080"/>
      <rect x="4" y="3" width="16" height="12" fill="#c0c0c0"/>
      <rect x="6" y="5" width="12" height="8" fill="#008080"/>
      <rect x="7" y="6" width="5" height="4" fill="#ffffff"/>
      <rect x="7" y="6" width="5" height="1" fill="#000080"/>
      <rect x="9" y="16" width="6" height="2" fill="#808080"/>
      <rect x="6" y="18" width="12" height="2" fill="#c0c0c0"/>
      <circle cx="23" cy="11" r="6" fill="#dcdcdc" stroke="#808080" stroke-width="1"/>
      <path d="M20 8 L26 14" stroke="#80ffff" stroke-width="1"/>
      <path d="M20 14 L26 8" stroke="#ffff80" stroke-width="1"/>
      <circle cx="23" cy="11" r="2" fill="#ffffff" stroke="#808080" stroke-width="1"/>
      <rect x="15" y="18" width="13" height="12" fill="#000080"/>
      <rect x="16" y="19" width="11" height="10" fill="#1084d0"/>
      <rect x="18" y="19" width="7" height="4" fill="#ffffff"/>
      <rect x="19" y="25" width="6" height="4" fill="#c0c0c0"/>
      <rect x="2" y="21" width="11" height="8" fill="#808000"/>
      <rect x="3" y="22" width="9" height="6" fill="#ffff80"/>
      <path d="M5 25 h5 M8 23 l2 2 l-2 2" stroke="#000080" stroke-width="1" fill="none"/>
    </svg>`;
  }

  renderAppWizRecycleSvg() {
    return `<svg viewBox="0 0 32 32" width="32" height="32" shape-rendering="crispEdges">
      <rect x="2" y="3" width="14" height="11" fill="#000080"/>
      <rect x="3" y="5" width="12" height="8" fill="#ffffff"/>
      <rect x="5" y="7" width="4" height="3" fill="#008080"/>
      <rect x="11" y="7" width="14" height="11" fill="#800000"/>
      <rect x="12" y="9" width="12" height="8" fill="#ffffff"/>
      <rect x="14" y="11" width="8" height="2" fill="#1084d0"/>
      <rect x="9" y="15" width="16" height="15" fill="#808080"/>
      <rect x="10" y="16" width="14" height="13" fill="#c0c0c0"/>
      <rect x="8" y="14" width="18" height="2" fill="#dfdfdf"/>
      <rect x="12" y="18" width="1" height="9" fill="#808080"/>
      <rect x="15" y="18" width="1" height="9" fill="#808080"/>
      <rect x="18" y="18" width="1" height="9" fill="#808080"/>
      <rect x="21" y="18" width="1" height="9" fill="#808080"/>
      <path d="M13 21 l3 -2 l0 4 z" fill="#008000"/>
      <path d="M20 23 l-3 2 l0 -4 z" fill="#008000"/>
    </svg>`;
  }

  renderAppWizBootDiskSvg() {
    return `<svg viewBox="0 0 32 32" width="32" height="32" shape-rendering="crispEdges">
      <rect x="3" y="2" width="24" height="26" fill="#000000"/>
      <rect x="4" y="3" width="22" height="24" fill="#000080"/>
      <rect x="5" y="4" width="20" height="22" fill="#1084d0"/>
      <rect x="8" y="3" width="14" height="9" fill="#ffffff"/>
      <rect x="9" y="5" width="12" height="1" fill="#ff0000"/>
      <rect x="9" y="7" width="10" height="1" fill="#000080"/>
      <rect x="9" y="9" width="8" height="1" fill="#808080"/>
      <rect x="9" y="17" width="12" height="9" fill="#c0c0c0"/>
      <rect x="11" y="19" width="4" height="6" fill="#404040"/>
      <circle cx="23" cy="23" r="6" fill="#ffff00" stroke="#808000" stroke-width="1"/>
      <path d="M23 19 v4 h3" stroke="#000000" stroke-width="1" fill="none"/>
    </svg>`;
  }

  renderSetupCategoryIcon(catId) {
    const icons = {
      accessibility: `<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges"><rect x="1" y="1" width="14" height="14" fill="#008080"/><circle cx="8" cy="4" r="2" fill="#ffffff"/><rect x="4" y="7" width="8" height="1" fill="#ffffff"/><rect x="7" y="7" width="2" height="4" fill="#ffffff"/><rect x="5" y="11" width="2" height="3" fill="#ffffff"/><rect x="9" y="11" width="2" height="3" fill="#ffffff"/></svg>`,
      accessories: `<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges"><rect x="1" y="2" width="14" height="11" fill="#000080"/><rect x="2" y="4" width="12" height="8" fill="#ffffff"/><rect x="4" y="5" width="4" height="5" fill="#ffff80" stroke="#808000" stroke-width="1"/><rect x="9" y="6" width="4" height="5" fill="#c0c0c0" stroke="#404040" stroke-width="1"/></svg>`,
      addressbook: `<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges"><rect x="2" y="1" width="11" height="14" fill="#804000"/><rect x="3" y="2" width="9" height="12" fill="#ffffc0"/><rect x="13" y="3" width="2" height="2" fill="#ff0000"/><rect x="13" y="6" width="2" height="2" fill="#008000"/><rect x="13" y="9" width="2" height="2" fill="#000080"/><circle cx="7" cy="6" r="2" fill="#000080"/><rect x="5" y="9" width="5" height="3" fill="#000080"/></svg>`,
      communications: `<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges"><rect x="1" y="8" width="14" height="5" fill="#808080"/><rect x="2" y="9" width="12" height="3" fill="#c0c0c0"/><rect x="3" y="4" width="10" height="4" fill="#008080"/><rect x="2" y="3" width="4" height="2" fill="#000080"/><rect x="10" y="3" width="4" height="2" fill="#000080"/><rect x="4" y="10" width="2" height="1" fill="#00ff00"/><rect x="7" y="10" width="2" height="1" fill="#ff0000"/></svg>`,
      themes: `<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges"><rect x="1" y="2" width="14" height="10" fill="#808080"/><rect x="2" y="3" width="12" height="8" fill="#008080"/><circle cx="11" cy="7" r="3" fill="#ffff80"/><rect x="3" y="5" width="5" height="4" fill="#ffffff"/><rect x="5" y="12" width="6" height="2" fill="#c0c0c0"/></svg>`,
      internet: `<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges"><circle cx="8" cy="8" r="6" fill="#1084d0" stroke="#000080" stroke-width="1"/><rect x="5" y="4" width="4" height="3" fill="#008000"/><rect x="7" y="8" width="4" height="4" fill="#008000"/><path d="M2 8 h12 M8 2 v12" stroke="#80ffff" stroke-width="1"/></svg>`,
      outlook: `<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges"><rect x="1" y="3" width="14" height="10" fill="#000080"/><rect x="2" y="4" width="12" height="8" fill="#ffffff"/><path d="M2 4 l6 5 l6 -5" stroke="#000080" stroke-width="1" fill="none"/><rect x="9" y="8" width="5" height="4" fill="#ffff80"/></svg>`,
      multimedia: `<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges"><circle cx="6" cy="7" r="5" fill="#dcdcdc" stroke="#808080" stroke-width="1"/><circle cx="6" cy="7" r="1" fill="#ffffff"/><rect x="10" y="3" width="2" height="8" fill="#000080"/><rect x="10" y="3" width="5" height="2" fill="#000080"/><circle cx="9" cy="11" r="2" fill="#000080"/></svg>`,
      systools: `<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges"><rect x="1" y="6" width="14" height="7" fill="#808080"/><rect x="2" y="7" width="12" height="5" fill="#c0c0c0"/><rect x="11" y="9" width="2" height="1" fill="#00ff00"/><path d="M4 2 l6 6 l2 -2 l-6 -6 z" fill="#000080"/><rect x="3" y="2" width="3" height="3" fill="#dfdfdf"/></svg>`
    };
    return icons[catId] || icons.accessories;
  }

  getCategoryInstallState(cat, compMap) {
    const total = cat.subcomponents.length;
    let checkedCount = 0;
    let selectedMb = 0;
    let totalMb = 0;
    cat.subcomponents.forEach(sub => {
      totalMb += sub.size;
      if (compMap[sub.id]) {
        checkedCount++;
        selectedMb += sub.size;
      }
    });
    const status = checkedCount === 0 ? 'none' : (checkedCount === total ? 'all' : 'partial');
    return { total, checkedCount, selectedMb, totalMb, status };
  }

  openAppWizProperties() {
    if (window.winManager && window.winManager.windows.has('app_appwiz_cpl')) {
      window.winManager.bringToTop('app_appwiz_cpl');
      return;
    }

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const state = this.loadAppWizState();
    const workingComponents = Object.assign({}, state.components);
    const categories = this.getAppWizCategories();

    let softwareList = this.getAppWizInstalledSoftware(state);
    let selectedApp = softwareList[0] || null;
    let selectedCatId = categories[0].id;
    let activeTabId = 'tab-appwiz-install';
    let isDirty = false;

    const content = document.createElement('div');
    content.className = 'win-dialog-content appwiz-cpl-root';

    content.innerHTML = `
      <div class="win-tabs">
        <button class="win-tab win-tab-btn active" data-tab="tab-appwiz-install">${this.t('appwiz.tabInstall')}</button>
        <button class="win-tab win-tab-btn" data-tab="tab-appwiz-setup">${this.t('appwiz.tabWinSetup')}</button>
        <button class="win-tab win-tab-btn" data-tab="tab-appwiz-bootdisk">${this.t('appwiz.tabBootDisk')}</button>
      </div>

      <div class="win-tab-panel appwiz-tab-panel">
        <div class="appwiz-tab-content" id="tab-appwiz-install">
          <div class="appwiz-install-top">
            <div class="appwiz-side-icon">${this.renderAppWizInstallSvg()}</div>
            <div class="appwiz-side-text">${this.t('appwiz.installDesc')}</div>
          </div>
          <div class="appwiz-install-btn-row">
            <button class="win-btn btn-appwiz-install" style="min-width:116px;">${this.t('appwiz.installBtn')}</button>
          </div>

          <div class="appwiz-separator"></div>

          <div class="appwiz-uninstall-top">
            <div class="appwiz-side-icon">${this.renderAppWizRecycleSvg()}</div>
            <div class="appwiz-side-text">${this.t('appwiz.uninstallDesc')}</div>
          </div>

          <div class="appwiz-apps-list" id="appwiz-list"></div>

          <div class="appwiz-remove-btn-row">
            <button class="win-btn btn-appwiz-remove" style="min-width:136px;">${this.t('appwiz.removeBtn')}</button>
          </div>
        </div>

        <div class="appwiz-tab-content hidden" id="tab-appwiz-setup">
          <div class="appwiz-setup-intro">${this.t('appwiz.setupDesc')}</div>
          <div class="appwiz-setup-label">${this.t('appwiz.componentsLabel')}</div>
          <div class="appwiz-setup-list" id="appwiz-setup-list"></div>

          <div class="appwiz-space-summary">
            <div class="appwiz-space-row">
              <span>${this.t('appwiz.spaceUsed')}</span>
              <span id="appwiz-space-used"></span>
            </div>
            <div class="appwiz-space-row">
              <span>${this.t('appwiz.spaceReq')}</span>
              <span id="appwiz-space-req"></span>
            </div>
            <div class="appwiz-space-row">
              <span>${this.t('appwiz.spaceAvail')}</span>
              <span id="appwiz-space-avail"></span>
            </div>
          </div>

          <fieldset class="appwiz-desc-group">
            <legend>${this.t('appwiz.descGroup')}</legend>
            <div class="appwiz-desc-text" id="appwiz-setup-desc"></div>
            <div class="appwiz-desc-bottom">
              <span id="appwiz-setup-subcount"></span>
              <button class="win-btn" id="btn-appwiz-details" style="min-width:86px;">${this.t('appwiz.detailsBtn')}</button>
            </div>
          </fieldset>

          <div class="appwiz-havedisk-row">
            <button class="win-btn" id="btn-appwiz-havedisk" style="min-width:136px;">${this.t('appwiz.haveDiskBtn')}</button>
          </div>
        </div>

        <div class="appwiz-tab-content hidden" id="tab-appwiz-bootdisk">
          <div class="appwiz-boot-top">
            <div>${this.t('appwiz.bootDesc1')}</div>
            <div>${this.t('appwiz.bootDesc2')}</div>
          </div>

          <div class="appwiz-boot-action-row">
            <div class="appwiz-side-icon">${this.renderAppWizBootDiskSvg()}</div>
            <div style="flex:1; display:flex; align-items:center; justify-content:space-between; gap:10px;">
              <div style="line-height:1.3;">${isRu ? 'Аварийная дискета Win 98 Second Edition (FAT12, 1,44 МБ)' : 'Win 98 Second Edition Emergency Boot Disk (FAT12, 1.44 MB)'}</div>
              <button class="win-btn" id="btn-appwiz-bootdisk" style="min-width:118px;">${this.t('appwiz.createDiskBtn')}</button>
            </div>
          </div>

          <div class="appwiz-boot-progress-wrap">
            <div id="appwiz-boot-status">${state.bootDiskCreated ? this.t('appwiz.bootDone') : this.t('appwiz.bootReady')}</div>
            <div class="appwiz-boot-bar-outer">
              <div class="appwiz-boot-bar-fill" id="appwiz-boot-bar" style="width:${state.bootDiskCreated ? '100%' : '0%'};"></div>
            </div>
            <div style="display:flex; justify-content:flex-end; margin-top:6px;">
              <button class="win-btn" id="btn-appwiz-open-a" style="min-width:118px; display:${state.bootDiskCreated ? 'inline-block' : 'none'};">${this.t('appwiz.openDriveABtn')}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="win-dialog-buttons" style="margin-top:8px; display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn btn-appwiz-ok is-default" style="min-width:74px;">${this.t('btn.ok')}</button>
        <button class="win-btn btn-appwiz-cancel" style="min-width:74px;">${this.t('btn.cancel')}</button>
        <button class="win-btn btn-appwiz-apply" style="min-width:78px;" disabled>${this.t('btn.apply')}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_appwiz_cpl',
      title: this.t('appwiz.title'),
      icon: 'appwiz',
      width: 414,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      helpButton: true,
      onHelp: () => this.onAppWizHelp(activeTabId),
      content
    });

    const el = dialog.element;
    const applyBtn = el.querySelector('.btn-appwiz-apply');
    const removeBtn = el.querySelector('.btn-appwiz-remove');

    const renderSoftwareList = () => {
      softwareList = this.getAppWizInstalledSoftware(state);
      if (!selectedApp || !softwareList.some(a => a.id === selectedApp.id)) {
        selectedApp = softwareList[0] || null;
      } else {
        selectedApp = softwareList.find(a => a.id === selectedApp.id) || softwareList[0] || null;
      }
      const listEl = el.querySelector('#appwiz-list');
      if (!listEl) return;
      listEl.innerHTML = softwareList.map((app, idx) => `
        <div class="appwiz-app-row ${selectedApp && selectedApp.id === app.id ? 'selected' : ''}" data-idx="${idx}" data-app-id="${app.id}">
          <div style="width:16px; height:16px; flex-shrink:0;">${Icons[app.icon] || Icons['folder']}</div>
          <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${app.name}</div>
          <div style="color:#555; flex-shrink:0;">${app.size}</div>
        </div>
      `).join('');

      if (removeBtn) removeBtn.disabled = !selectedApp;

      listEl.querySelectorAll('.appwiz-app-row').forEach(row => {
        row.addEventListener('click', () => {
          listEl.querySelectorAll('.appwiz-app-row').forEach(r => r.classList.remove('selected'));
          row.classList.add('selected');
          const idx = parseInt(row.dataset.idx, 10);
          if (!isNaN(idx) && softwareList[idx]) {
            selectedApp = softwareList[idx];
            if (selectedApp.isOffice && window.clippySystem && typeof window.clippySystem.onAppWizOfficeSelected === 'function') {
              window.clippySystem.onAppWizOfficeSelected();
            }
          }
        });
        row.addEventListener('dblclick', () => {
          if (removeBtn && !removeBtn.disabled) removeBtn.click();
        });
      });
    };

    const computeComponentsDiff = () => {
      const added = [];
      const removed = [];
      categories.forEach(cat => {
        cat.subcomponents.forEach(sub => {
          const before = Boolean(state.components[sub.id]);
          const after = Boolean(workingComponents[sub.id]);
          if (!before && after) added.push(sub);
          else if (before && !after) removed.push(sub);
        });
      });
      return { added, removed };
    };

    const updateApplyState = () => {
      const diff = computeComponentsDiff();
      isDirty = diff.added.length > 0 || diff.removed.length > 0;
      if (applyBtn) applyBtn.disabled = !isDirty;
    };

    const renderSetupList = () => {
      const setupListEl = el.querySelector('#appwiz-setup-list');
      if (!setupListEl) return;

      let baselineMb = 0;
      let workingMb = 0;
      categories.forEach(cat => {
        cat.subcomponents.forEach(sub => {
          if (state.components[sub.id]) baselineMb += sub.size;
          if (workingComponents[sub.id]) workingMb += sub.size;
        });
      });

      setupListEl.innerHTML = categories.map(cat => {
        const info = this.getCategoryInstallState(cat, workingComponents);
        const chkClass = info.status === 'all' ? 'is-checked' : (info.status === 'partial' ? 'is-partial' : '');
        return `
          <div class="appwiz-setup-row ${cat.id === selectedCatId ? 'selected' : ''}" data-cat-id="${cat.id}">
            <div class="appwiz-tri-chk ${chkClass}" data-chk-cat="${cat.id}"></div>
            <div class="appwiz-setup-icon">${this.renderSetupCategoryIcon(cat.id)}</div>
            <div class="appwiz-setup-name">${cat.name}</div>
            <div class="appwiz-setup-size">${this.formatAppWizMb(info.selectedMb)}</div>
          </div>
        `;
      }).join('');

      const reqMb = Math.max(0, workingMb - baselineMb);
      const availMb = 1351.3;
      const usedEl = el.querySelector('#appwiz-space-used');
      const reqEl = el.querySelector('#appwiz-space-req');
      const availEl = el.querySelector('#appwiz-space-avail');
      if (usedEl) usedEl.textContent = this.formatAppWizMb(workingMb);
      if (reqEl) reqEl.textContent = this.formatAppWizMb(reqMb);
      if (availEl) availEl.textContent = this.formatAppWizMb(availMb);

      const selectedCat = categories.find(c => c.id === selectedCatId) || categories[0];
      const catInfo = this.getCategoryInstallState(selectedCat, workingComponents);
      const descEl = el.querySelector('#appwiz-setup-desc');
      const countEl = el.querySelector('#appwiz-setup-subcount');
      if (descEl) descEl.textContent = selectedCat.desc;
      if (countEl) countEl.textContent = this.t('appwiz.selectedCount', catInfo.checkedCount, catInfo.total);

      setupListEl.querySelectorAll('.appwiz-setup-row').forEach(row => {
        row.addEventListener('click', (e) => {
          const catId = row.dataset.catId;
          selectedCatId = catId;
          if (e.target && e.target.hasAttribute('data-chk-cat')) {
            const cat = categories.find(c => c.id === catId);
            if (cat) {
              const info = this.getCategoryInstallState(cat, workingComponents);
              const nextVal = info.status !== 'all';
              cat.subcomponents.forEach(sub => {
                workingComponents[sub.id] = nextVal;
              });
              updateApplyState();
            }
          }
          renderSetupList();
        });

        row.addEventListener('dblclick', (e) => {
          if (e.target && e.target.hasAttribute('data-chk-cat')) return;
          const cat = categories.find(c => c.id === row.dataset.catId);
          if (cat) {
            this.openAppWizDetailsDialog(cat, workingComponents, () => {
              updateApplyState();
              renderSetupList();
            });
          }
        });
      });
    };

    renderSoftwareList();
    renderSetupList();

    el.querySelectorAll('.win-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        el.querySelectorAll('.win-tab-btn').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        activeTabId = tabBtn.dataset.tab;
        el.querySelectorAll('.appwiz-tab-content').forEach(tc => {
          tc.classList.toggle('hidden', tc.id !== activeTabId);
        });
      });
    });

    const installBtn = el.querySelector('.btn-appwiz-install');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        this.openAppWizInstallWizard(() => renderSoftwareList());
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        if (!selectedApp) return;
        if (selectedApp.isOffice) {
          this.openAppWizOfficeDialog(selectedApp);
          return;
        }
        this.openAppWizRemoveConfirm(selectedApp, () => {
          this.uninstallAppWizProgram(selectedApp, state);
          renderSoftwareList();
          if (window.clippySystem && typeof window.clippySystem.onAppWizProgramRemoved === 'function') {
            window.clippySystem.onAppWizProgramRemoved(selectedApp);
          }
        });
      });
    }

    const detailsBtn = el.querySelector('#btn-appwiz-details');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', () => {
        const selectedCat = categories.find(c => c.id === selectedCatId) || categories[0];
        this.openAppWizDetailsDialog(selectedCat, workingComponents, () => {
          updateApplyState();
          renderSetupList();
        });
      });
    }

    const haveDiskBtn = el.querySelector('#btn-appwiz-havedisk');
    if (haveDiskBtn) {
      haveDiskBtn.addEventListener('click', () => {
        this.openAppWizHaveDiskDialog();
      });
    }

    const bootDiskBtn = el.querySelector('#btn-appwiz-bootdisk');
    const openABtn = el.querySelector('#btn-appwiz-open-a');
    if (openABtn) {
      openABtn.addEventListener('click', () => {
        this.createStartupDiskInVfs();
        if (window.appExplorer) window.appExplorer.open(['My Computer', 'A:']);
      });
    }

    if (bootDiskBtn) {
      bootDiskBtn.addEventListener('click', () => {
        const statusEl = el.querySelector('#appwiz-boot-status');
        const barEl = el.querySelector('#appwiz-boot-bar');
        bootDiskBtn.disabled = true;

        const steps = isRu
          ? [
              { pct: 18, text: 'Проверка дисковода A: (1,44 МБ)...' },
              { pct: 42, text: 'Форматирование системной дискеты и запись COMMAND.COM...' },
              { pct: 68, text: 'Копирование FDISK.EXE, FORMAT.COM, SCANDISK.EXE, HIMEM.SYS...' },
              { pct: 90, text: 'Упаковка драйверов CD-ROM (OAKCDROM.SYS) и архива EBD.CAB...' },
              { pct: 100, text: this.t('appwiz.bootDone') }
            ]
          : [
              { pct: 18, text: 'Checking floppy drive A: (1.44 MB)...' },
              { pct: 42, text: 'Formatting system disk and writing COMMAND.COM...' },
              { pct: 68, text: 'Copying FDISK.EXE, FORMAT.COM, SCANDISK.EXE, HIMEM.SYS...' },
              { pct: 90, text: 'Packing CD-ROM drivers (OAKCDROM.SYS) and EBD.CAB...' },
              { pct: 100, text: this.t('appwiz.bootDone') }
            ];

        let idx = 0;
        const advance = () => {
          if (idx >= steps.length) {
            state.bootDiskCreated = true;
            this.saveAppWizState(state);
            this.createStartupDiskInVfs();
            bootDiskBtn.disabled = false;
            if (openABtn) openABtn.style.display = 'inline-block';
            if (window.soundSys && window.soundSys.playDing) window.soundSys.playDing();
            if (window.clippySystem && typeof window.clippySystem.onAppWizBootDiskCreated === 'function') {
              window.clippySystem.onAppWizBootDiskCreated();
            }
            return;
          }
          const s = steps[idx++];
          if (statusEl) statusEl.textContent = s.text;
          if (barEl) barEl.style.width = `${s.pct}%`;
          setTimeout(advance, 220);
        };
        advance();
      });
    }

    const commitChanges = () => {
      if (!isDirty) return;
      const diff = computeComponentsDiff();
      state.components = Object.assign({}, workingComponents);
      this.saveAppWizState(state);
      updateApplyState();
      if (window.clippySystem && typeof window.clippySystem.onAppWizComponentsApplied === 'function') {
        window.clippySystem.onAppWizComponentsApplied(diff);
      }
    };

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        commitChanges();
      });
    }

    el.querySelector('.btn-appwiz-ok').addEventListener('click', () => {
      commitChanges();
      window.winManager.closeWindow('app_appwiz_cpl');
    });

    el.querySelector('.btn-appwiz-cancel').addEventListener('click', () => {
      window.winManager.closeWindow('app_appwiz_cpl');
    });
  }

  uninstallAppWizProgram(app, state) {
    if (!app) return;
    const gm = window.gameManager;
    if (app.isSteamClient && gm) {
      gm.state.steamInstalled = false;
      if (typeof gm.saveState === 'function') gm.saveState();
      if (typeof gm.refreshSystemUI === 'function') gm.refreshSystemUI();
    } else if (gm && typeof gm.isInstalled === 'function' && gm.isInstalled(app.id) && typeof gm.uninstallGame === 'function') {
      gm.uninstallGame(app.id);
    }
    if (app.isBuiltin && state) {
      if (!state.removedBuiltins.includes(app.id)) {
        state.removedBuiltins.push(app.id);
      }
      this.saveAppWizState(state);
    }
  }

  openAppWizRemoveConfirm(app, onConfirm) {
    if (window.winManager && window.winManager.windows.has('app_appwiz_confirm_remove')) {
      window.winManager.closeWindow('app_appwiz_confirm_remove');
    }
    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '100%';
    content.style.boxSizing = 'border-box';
    content.innerHTML = `
      <div class="win-dialog-body" style="display:flex; gap:12px; align-items:flex-start;">
        <div class="win-dialog-icon">${Icons['warning'] || ''}</div>
        <div class="win-dialog-text" style="line-height:1.35;">${this.t('appwiz.confirmRemoveMsg', app.name)}</div>
      </div>
      <div class="win-dialog-buttons" style="display:flex; justify-content:center; gap:8px;">
        <button class="win-btn btn-confirm-yes is-default" style="min-width:74px;">${this.t('btn.yes')}</button>
        <button class="win-btn btn-confirm-no" style="min-width:74px;">${this.t('btn.no')}</button>
      </div>
    `;
    const win = window.winManager.createWindow({
      id: 'app_appwiz_confirm_remove',
      title: this.t('appwiz.confirmRemoveTitle'),
      icon: 'appwiz',
      width: 364,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });
    win.element.querySelector('.btn-confirm-yes').addEventListener('click', () => {
      window.winManager.closeWindow('app_appwiz_confirm_remove');
      if (onConfirm) onConfirm();
    });
    win.element.querySelector('.btn-confirm-no').addEventListener('click', () => {
      window.winManager.closeWindow('app_appwiz_confirm_remove');
    });
  }

  openAppWizOfficeDialog(app) {
    if (window.winManager && window.winManager.windows.has('app_appwiz_office')) {
      window.winManager.bringToTop('app_appwiz_office');
      return;
    }
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '100%';
    content.style.boxSizing = 'border-box';
    content.style.gap = '10px';
    content.style.fontSize = '11px';

    content.innerHTML = `
      <div style="display:flex; gap:12px; align-items:flex-start;">
        <div style="width:32px; height:32px; flex-shrink:0;">${Icons['excel'] || ''}</div>
        <div style="line-height:1.35;">
          <strong>${app.name}</strong><br>
          ${isRu
            ? 'Программа установки Microslop Office 97 обнаружила активного помощника <b>CLIPPY.EXE</b>. Выберите режим обслуживания:'
            : 'Microslop Office 97 Setup detected active assistant <b>CLIPPY.EXE</b>. Select a maintenance action:'}
        </div>
      </div>

      <fieldset class="appwiz-desc-group" style="margin:0;">
        <legend>${isRu ? 'Действие' : 'Maintenance Option'}</legend>
        <div style="display:flex; flex-direction:column; gap:6px; padding:2px 0;">
          <label style="display:flex; align-items:flex-start; gap:6px; line-height:1.3;">
            <input type="radio" name="office-maint" value="keep" checked style="margin-top:1px; flex-shrink:0;">
            <span>${isRu ? 'Оставить Скрепыша и все компоненты Office 97 (рекомендуется)' : 'Keep Clippy and all Office 97 components (recommended)'}</span>
          </label>
          <label style="display:flex; align-items:flex-start; gap:6px; line-height:1.3;">
            <input type="radio" name="office-maint" value="repair" style="margin-top:1px; flex-shrink:0;">
            <span>${isRu ? 'Восстановить шаблоны писем и словари правописания' : 'Repair letter templates and spelling dictionaries'}</span>
          </label>
          <label style="display:flex; align-items:flex-start; gap:6px; line-height:1.3;">
            <input type="radio" name="office-maint" value="hide" style="margin-top:1px; flex-shrink:0;">
            <span>${isRu ? 'Временно спрятать Скрепыша в системный лоток' : 'Temporarily hide Clippy in the system tray'}</span>
          </label>
        </div>
      </fieldset>

      <div class="win-dialog-buttons" style="display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn btn-office-ok is-default" style="min-width:74px;">${this.t('btn.ok')}</button>
        <button class="win-btn btn-office-cancel" style="min-width:74px;">${this.t('btn.cancel')}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_appwiz_office',
      title: isRu ? 'Установка Microslop Office 97' : 'Microslop Office 97 Setup',
      icon: 'excel',
      width: 404,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    win.element.querySelector('.btn-office-ok').addEventListener('click', () => {
      const checked = win.element.querySelector('input[name="office-maint"]:checked');
      const mode = checked ? checked.value : 'keep';
      window.winManager.closeWindow('app_appwiz_office');
      if (window.clippySystem && typeof window.clippySystem.onAppWizOfficeMaintenance === 'function') {
        window.clippySystem.onAppWizOfficeMaintenance(mode);
      }
    });

    win.element.querySelector('.btn-office-cancel').addEventListener('click', () => {
      window.winManager.closeWindow('app_appwiz_office');
    });
  }

  openAppWizDetailsDialog(cat, workingComponents, onUpdate) {
    if (window.winManager && window.winManager.windows.has('app_appwiz_details')) {
      window.winManager.closeWindow('app_appwiz_details');
    }
    const localMap = {};
    cat.subcomponents.forEach(sub => {
      localMap[sub.id] = Boolean(workingComponents[sub.id]);
    });
    let selectedSubId = cat.subcomponents[0] ? cat.subcomponents[0].id : '';

    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '100%';
    content.style.boxSizing = 'border-box';
    content.style.gap = '8px';
    content.style.fontSize = '11px';

    content.innerHTML = `
      <div>${this.t('appwiz.subcompLabel')} <strong>${cat.name}</strong></div>
      <div class="appwiz-setup-list" id="appwiz-sub-list" style="height:126px;"></div>

      <fieldset class="appwiz-desc-group" style="margin:0;">
        <legend>${this.t('appwiz.descGroup')}</legend>
        <div class="appwiz-desc-text" id="appwiz-sub-desc"></div>
      </fieldset>

      <div class="win-dialog-buttons" style="display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn btn-sub-ok is-default" style="min-width:74px;">${this.t('btn.ok')}</button>
        <button class="win-btn btn-sub-cancel" style="min-width:74px;">${this.t('btn.cancel')}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_appwiz_details',
      title: cat.name,
      icon: 'appwiz',
      width: 386,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = win.element;
    const renderSubs = () => {
      const listEl = el.querySelector('#appwiz-sub-list');
      listEl.innerHTML = cat.subcomponents.map(sub => `
        <div class="appwiz-setup-row ${sub.id === selectedSubId ? 'selected' : ''}" data-sub-id="${sub.id}">
          <div class="appwiz-tri-chk ${localMap[sub.id] ? 'is-checked' : ''}" data-chk-sub="${sub.id}"></div>
          <div class="appwiz-setup-icon">${this.renderSetupCategoryIcon(cat.id)}</div>
          <div class="appwiz-setup-name">${sub.name}</div>
          <div class="appwiz-setup-size">${this.formatAppWizMb(sub.size)}</div>
        </div>
      `).join('');

      const activeSub = cat.subcomponents.find(s => s.id === selectedSubId) || cat.subcomponents[0];
      const descEl = el.querySelector('#appwiz-sub-desc');
      if (descEl && activeSub) descEl.textContent = activeSub.desc;

      listEl.querySelectorAll('.appwiz-setup-row').forEach(row => {
        row.addEventListener('click', (e) => {
          const subId = row.dataset.subId;
          selectedSubId = subId;
          if (e.target && e.target.hasAttribute('data-chk-sub')) {
            localMap[subId] = !localMap[subId];
          }
          renderSubs();
        });
      });
    };

    renderSubs();

    el.querySelector('.btn-sub-ok').addEventListener('click', () => {
      cat.subcomponents.forEach(sub => {
        workingComponents[sub.id] = Boolean(localMap[sub.id]);
      });
      window.winManager.closeWindow('app_appwiz_details');
      if (onUpdate) onUpdate();
    });

    el.querySelector('.btn-sub-cancel').addEventListener('click', () => {
      window.winManager.closeWindow('app_appwiz_details');
    });
  }

  openAppWizHaveDiskDialog() {
    if (window.winManager && window.winManager.windows.has('app_appwiz_havedisk')) {
      window.winManager.bringToTop('app_appwiz_havedisk');
      return;
    }
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '100%';
    content.style.boxSizing = 'border-box';
    content.style.gap = '10px';
    content.style.fontSize = '11px';

    content.innerHTML = `
      <div style="display:flex; gap:12px; align-items:flex-start;">
        <div class="appwiz-side-icon">${this.renderAppWizBootDiskSvg()}</div>
        <div style="line-height:1.35; flex:1;">${this.t('appwiz.haveDiskDesc')}</div>
      </div>

      <div>
        <div style="margin-bottom:4px;">${this.t('appwiz.haveDiskCopyFrom')}</div>
        <div style="display:flex; gap:6px; align-items:center;">
          <select id="appwiz-havedisk-path" style="flex:1; height:22px; font-size:11px;">
            <option value="A:\\">A:\\</option>
            <option value="D:\\">D:\\</option>
            <option value="C:\\WINDOWS\\OPTIONS\\CABS">C:\\WINDOWS\\OPTIONS\\CABS</option>
          </select>
        </div>
      </div>

      <div class="win-dialog-buttons" style="display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn btn-hd-ok is-default" style="min-width:74px;">${this.t('btn.ok')}</button>
        <button class="win-btn btn-hd-cancel" style="min-width:74px;">${this.t('btn.cancel')}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_appwiz_havedisk',
      title: this.t('appwiz.haveDiskTitle'),
      icon: 'appwiz',
      width: 368,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    win.element.querySelector('.btn-hd-ok').addEventListener('click', () => {
      const val = win.element.querySelector('#appwiz-havedisk-path').value;
      window.winManager.closeWindow('app_appwiz_havedisk');
      window.winManager.openDialog({
        title: this.t('appwiz.haveDiskTitle'),
        icon: 'info',
        message: isRu
          ? `Указанный каталог <b>${val}</b> не содержит новых INF-описаний компонентов Win 98. Все штатные CAB-пакеты уже зарегистрированы в системе.`
          : `The specified location <b>${val}</b> does not contain new Win 98 component INF files. All standard CAB packages are already registered.`
      });
    });

    win.element.querySelector('.btn-hd-cancel').addEventListener('click', () => {
      window.winManager.closeWindow('app_appwiz_havedisk');
    });
  }

  scanAvailableInstallers() {
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    const found = [];
    const cdInserted = window.cdromState ? window.cdromState.inserted : true;
    const discId = (window.cdromState && window.cdromState.discId) || 'igromania98';

    if (cdInserted) {
      if (discId === 'officegames98') {
        found.push({
          cmd: 'D:\\LAUNCHER.EXE',
          label: isRu ? 'D:\\LAUNCHER.EXE — Сборник «Офисные игры ’98»' : 'D:\\LAUNCHER.EXE — Office Games ’98 Launcher',
          run: () => window.appExplorer && window.appExplorer.openItem(['My Computer', 'D:'], 'LAUNCHER.EXE')
        });
      } else {
        found.push(
          {
            cmd: 'D:\\demo\\burndemo.exe',
            label: 'D:\\demo\\burndemo.exe — Burnout: Drag Racing Demo Setup',
            run: () => window.appExplorer && window.appExplorer.openItem(['My Computer', 'D:', 'demo'], 'burndemo.exe')
          },
          {
            cmd: 'D:\\demo\\nhl98demo.exe',
            label: 'D:\\demo\\nhl98demo.exe — NHL 98 Demo Setup',
            run: () => window.appExplorer && window.appExplorer.openItem(['My Computer', 'D:', 'demo'], 'nhl98demo.exe')
          },
          {
            cmd: 'D:\\soft\\Winamp192.exe',
            label: 'D:\\soft\\Winamp192.exe — Winamp 1.92 Setup',
            run: () => window.appExplorer && window.appExplorer.openItem(['My Computer', 'D:', 'soft'], 'Winamp192.exe')
          },
          {
            cmd: 'D:\\igroman.exe',
            label: isRu ? 'D:\\igroman.exe — Оболочка компакт-диска «Игромания»' : 'D:\\igroman.exe — Igromania CD Shell',
            run: () => window.appExplorer && window.appExplorer.openItem(['My Computer', 'D:'], 'igroman.exe')
          }
        );
      }
    }

    if (window.vfs && typeof window.vfs.resolvePath === 'function') {
      const dlPath = ['My Computer', 'C:', 'My Documents', 'Downloads'];
      const dlNode = window.vfs.resolvePath(dlPath);
      if (dlNode && dlNode.children) {
        Object.keys(dlNode.children).forEach(name => {
          if (name.toLowerCase().endsWith('.exe')) {
            const fullCmd = `C:\\My Documents\\Downloads\\${name}`;
            found.push({
              cmd: fullCmd,
              label: `${fullCmd} (${isRu ? 'Загрузки' : 'Downloads'})`,
              run: () => window.appExplorer && window.appExplorer.openItem(dlPath, name)
            });
          }
        });
      }
    }

    return found;
  }

  openAppWizInstallWizard(onAfterInstall) {
    if (window.winManager && window.winManager.windows.has('app_appwiz_install_wiz')) {
      window.winManager.bringToTop('app_appwiz_install_wiz');
      return;
    }

    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    let step = 1;
    let installers = this.scanAvailableInstallers();
    let selectedCmd = installers[0] ? installers[0].cmd : 'D:\\SETUP.EXE';

    const content = document.createElement('div');
    content.className = 'win-dialog-content';
    content.style.width = '100%';
    content.style.boxSizing = 'border-box';
    content.style.gap = '8px';
    content.style.fontSize = '11px';

    const renderWizard = () => {
      installers = this.scanAvailableInstallers();
      if (step === 2 && installers.length && !installers.some(i => i.cmd === selectedCmd)) {
        selectedCmd = installers[0].cmd;
      }
      const cdInserted = window.cdromState ? window.cdromState.inserted : true;
      const discId = (window.cdromState && window.cdromState.discId) || 'igromania98';
      const cdStatusText = !cdInserted
        ? this.t('cdrom.statusEmpty')
        : (discId === 'officegames98' ? this.t('cdrom.statusOfficeInserted') : this.t('cdrom.statusInserted'));

      content.innerHTML = `
        <div style="display:flex; gap:14px; min-height:212px;">
          <div style="width:96px; background:linear-gradient(180deg, #000080 0%, #1084d0 100%); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:10px; box-shadow:inset 1px 1px 0 var(--win-border-dark), inset -1px -1px 0 var(--win-border-light); flex-shrink:0;">
            ${this.renderAppWizInstallSvg()}
            <div style="color:#ffffff; font-weight:bold; text-align:center; margin-top:10px; font-size:10px;">${isRu ? 'Мастер установки<br>Win 98' : 'Win 98<br>Setup Wizard'}</div>
          </div>

          <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between;">
            ${step === 1 ? `
              <div>
                <div style="margin-bottom:10px; line-height:1.35;">${this.t('appwiz.wizStep1')}</div>
                <fieldset class="appwiz-desc-group">
                  <legend>${this.t('cdrom.driveName')}</legend>
                  <div style="margin-bottom:6px;">${cdStatusText}</div>
                  <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button class="win-btn btn-wiz-cd-igro" style="min-width:110px;">💿 ${this.t('cdrom.insertIgromaniaBtn')}</button>
                    <button class="win-btn btn-wiz-cd-office" style="min-width:110px;">💿 ${this.t('cdrom.insertOfficeBtn')}</button>
                  </div>
                </fieldset>
              </div>
            ` : `
              <div>
                <div style="font-weight:bold; margin-bottom:4px;">${this.t('appwiz.wizStep2')}</div>
                <div style="line-height:1.3; margin-bottom:8px;">${this.t('appwiz.wizFoundDesc')}</div>
                <div style="margin-bottom:3px;">${this.t('appwiz.wizDetectedLabel')}</div>
                <select id="appwiz-wiz-select" size="4" style="width:100%; height:72px; font-size:11px; margin-bottom:8px;">
                  ${installers.map(item => `<option value="${item.cmd}" ${item.cmd === selectedCmd ? 'selected' : ''}>${item.label}</option>`).join('')}
                </select>
                <div style="margin-bottom:3px;">${this.t('appwiz.wizCmdLabel')}</div>
                <input type="text" id="appwiz-wiz-cmd" value="${selectedCmd}" style="width:100%; height:21px; font-size:11px; box-sizing:border-box;">
              </div>
            `}
          </div>
        </div>

        <div class="appwiz-separator" style="margin:2px 0;"></div>

        <div class="win-dialog-buttons" style="display:flex; justify-content:flex-end; gap:6px;">
          <button class="win-btn btn-wiz-back" style="min-width:74px;" ${step === 1 ? 'disabled' : ''}>${this.t('appwiz.wizBack')}</button>
          ${step === 1
            ? `<button class="win-btn btn-wiz-next is-default" style="min-width:74px;">${this.t('appwiz.wizNext')}</button>`
            : `<button class="win-btn btn-wiz-finish is-default" style="min-width:74px;">${this.t('appwiz.wizFinish')}</button>`}
          <button class="win-btn btn-wiz-cancel" style="min-width:74px;">${this.t('btn.cancel')}</button>
        </div>
      `;

      const igroBtn = content.querySelector('.btn-wiz-cd-igro');
      if (igroBtn) {
        igroBtn.addEventListener('click', () => {
          if (window.cdromState) {
            window.cdromState.inserted = true;
            window.cdromState.discId = 'igromania98';
          }
          renderWizard();
        });
      }

      const officeBtn = content.querySelector('.btn-wiz-cd-office');
      if (officeBtn) {
        officeBtn.addEventListener('click', () => {
          if (window.cdromState) {
            window.cdromState.inserted = true;
            window.cdromState.discId = 'officegames98';
          }
          renderWizard();
        });
      }

      const selectEl = content.querySelector('#appwiz-wiz-select');
      const cmdInput = content.querySelector('#appwiz-wiz-cmd');
      if (selectEl && cmdInput) {
        selectEl.addEventListener('change', () => {
          selectedCmd = selectEl.value;
          cmdInput.value = selectedCmd;
        });
        cmdInput.addEventListener('input', () => {
          selectedCmd = cmdInput.value;
        });
      }

      const backBtn = content.querySelector('.btn-wiz-back');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          step = 1;
          renderWizard();
        });
      }

      const nextBtn = content.querySelector('.btn-wiz-next');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          step = 2;
          renderWizard();
        });
      }

      const finishBtn = content.querySelector('.btn-wiz-finish');
      if (finishBtn) {
        finishBtn.addEventListener('click', () => {
          const finalCmd = (cmdInput ? cmdInput.value : selectedCmd).trim();
          window.winManager.closeWindow('app_appwiz_install_wiz');
          const match = installers.find(i => i.cmd.toLowerCase() === finalCmd.toLowerCase());
          if (match && typeof match.run === 'function') {
            match.run();
          } else if (window.appDialogs && typeof window.appDialogs.executeRunCommand === 'function') {
            window.appDialogs.executeRunCommand(finalCmd);
          }
          if (onAfterInstall) setTimeout(onAfterInstall, 400);
        });
      }

      const cancelBtn = content.querySelector('.btn-wiz-cancel');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          window.winManager.closeWindow('app_appwiz_install_wiz');
        });
      }
    };

    renderWizard();

    window.winManager.createWindow({
      id: 'app_appwiz_install_wiz',
      title: this.t('appwiz.wizTitle'),
      icon: 'appwiz',
      width: 428,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });
  }

  createStartupDiskInVfs() {
    if (!window.vfs) return;
    const mc = typeof window.vfs.resolvePath === 'function'
      ? window.vfs.resolvePath(['My Computer'])
      : (window.vfs.root && window.vfs.root.children && window.vfs.root.children['My Computer']);
    if (!mc || !mc.children) return;
    mc.children['A:'] = {
      type: 'drive',
      name: 'Диск 3,5 (A:)',
      icon: 'drive-floppy',
      driveType: 'floppy',
      volumeLabel: 'WIN98_EBD',
      children: {
        'COMMAND.COM': { type: 'file', name: 'COMMAND.COM', icon: 'file-sys', content: 'Microslop(R) Win 98 Startup Command Interpreter Version 4.10.1998' },
        'FDISK.EXE': { type: 'file', name: 'FDISK.EXE', icon: 'file-exe', content: 'Microslop Win 98 Fixed Disk Setup Program (FAT16 / FAT32)' },
        'FORMAT.COM': { type: 'file', name: 'FORMAT.COM', icon: 'file-exe', content: 'Win 98 Disk Format Utility' },
        'SCANDISK.EXE': { type: 'file', name: 'SCANDISK.EXE', icon: 'file-exe', content: 'Microslop ScanDisk for Emergency Boot Disk' },
        'HIMEM.SYS': { type: 'file', name: 'HIMEM.SYS', icon: 'file-sys', content: 'DEVICE=A:\\HIMEM.SYS /TESTMEM:OFF' },
        'OAKCDROM.SYS': { type: 'file', name: 'OAKCDROM.SYS', icon: 'file-sys', content: 'Oak Technology ATAPI CD-ROM Driver for Win 98 Startup Disk' },
        'AUTOEXEC.BAT': { type: 'file', name: 'AUTOEXEC.BAT', icon: 'file-txt', content: '@ECHO OFF\r\nMSCDEX.EXE /D:mscd001 /L:D\r\nECHO Win 98 Emergency Boot Disk Ready.\r\n' },
        'CONFIG.SYS': { type: 'file', name: 'CONFIG.SYS', icon: 'file-txt', content: '[menu]\r\nmenuitem=CD, Start computer with CD-ROM support.\r\nmenuitem=NOCD, Start computer without CD-ROM support.\r\nDEVICE=HIMEM.SYS /testmem:off\r\nDEVICEHIGH=OAKCDROM.SYS /D:mscd001\r\n' },
        'EBD.CAB': { type: 'file', name: 'EBD.CAB', icon: 'winrar', content: 'Emergency Boot Disk Diagnostic Tools Cabinet (ATTRIB, EDIT, EXT,FORMAT, SYS)' },
        'README.TXT': {
          type: 'file',
          name: 'README.TXT',
          icon: 'file-txt',
          content: 'ЗАГРУЗОЧНЫЙ ДИСК MICROSLOP WIN 98 SECOND EDITION\r\n================================================\r\nЭта дискета создана в Панели управления («Установка и удаление программ»).\r\nСодержит драйвер CD-ROM (OAKCDROM.SYS), утилиты FDISK, FORMAT и SCANDISK.\r\nПримечание от Скрепыша: не забудьте задвинуть язычок защиты от записи!'
        }
      }
    };
    if (typeof window.vfs.saveToStorage === 'function') window.vfs.saveToStorage();
    else if (typeof window.vfs.save === 'function') window.vfs.save();
  }

  onAppWizHelp(activeTabId) {
    if (window.clippySystem && typeof window.clippySystem.onAppWizHelp === 'function') {
      if (window.clippySystem.onAppWizHelp(activeTabId)) return;
    }
    const isRu = !window.i18n || window.i18n.getLanguage() === 'ru';
    window.winManager.openDialog({
      title: this.t('appwiz.title'),
      icon: 'info',
      message: isRu
        ? 'Используйте вкладку <b>Установка и удаление</b> для установки новых программ и очистки диска, <b>Установка Win</b> — для выбора стандартных компонентов системы, а <b>Загрузочный диск</b> — для записи аварийной дискеты A:.'
        : 'Use <b>Install/Uninstall</b> to set up or remove programs, <b>Win Setup</b> to add or remove system components, and <b>Startup Disk</b> to create an emergency boot floppy on drive A:.'
    });
  }

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
      <div style="display:flex; border-bottom:1px solid #808080; margin-bottom:8px;">
        <button class="win-tab-btn active" style="padding:3px 10px; font-weight:bold; font-size:11px; margin-bottom:-1px; border:1px solid #808080; border-bottom:none; background:var(--win-bg);">${this.t('inetcpl.tabGeneral')}</button>
      </div>

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

  defaultPowerSettings() {
    return {
      scheme: 'always_on',
      schemes: {
        home_office: { monitorTimeout: 15, diskTimeout: 0 },
        portable: { monitorTimeout: 5, diskTimeout: 15 },
        always_on: { monitorTimeout: 15, diskTimeout: 60 }
      },
      customSchemes: {},
      showTrayIcon: false
    };
  }

  clonePowerSettings(src = this.powerSettings) {
    const base = this.defaultPowerSettings();
    const s = src && typeof src === 'object' ? src : base;
    const schemes = {};
    Object.keys(base.schemes).forEach(k => {
      const item = s.schemes && s.schemes[k] && typeof s.schemes[k] === 'object' ? s.schemes[k] : base.schemes[k];
      schemes[k] = {
        monitorTimeout: typeof item.monitorTimeout === 'number' ? item.monitorTimeout : base.schemes[k].monitorTimeout,
        diskTimeout: typeof item.diskTimeout === 'number' ? item.diskTimeout : base.schemes[k].diskTimeout
      };
    });
    const customSchemes = {};
    if (s.customSchemes && typeof s.customSchemes === 'object') {
      Object.keys(s.customSchemes).forEach(name => {
        const item = s.customSchemes[name];
        if (item && typeof item === 'object') {
          customSchemes[name] = {
            monitorTimeout: typeof item.monitorTimeout === 'number' ? item.monitorTimeout : 15,
            diskTimeout: typeof item.diskTimeout === 'number' ? item.diskTimeout : 60
          };
        }
      });
    }
    let scheme = typeof s.scheme === 'string' && s.scheme ? s.scheme : base.scheme;
    if (scheme.startsWith('custom:')) {
      const cName = scheme.slice(7);
      if (!customSchemes[cName]) scheme = base.scheme;
    } else if (!schemes[scheme]) {
      scheme = base.scheme;
    }
    return {
      scheme,
      schemes,
      customSchemes,
      showTrayIcon: Boolean(s.showTrayIcon)
    };
  }

  loadPowerSettings() {
    const base = this.defaultPowerSettings();
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('win98_power_settings') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        return this.clonePowerSettings(parsed);
      }
    } catch (e) {}
    return base;
  }

  savePowerSettings(settings) {
    this.powerSettings = this.clonePowerSettings(settings);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('win98_power_settings', JSON.stringify(this.powerSettings));
      }
    } catch (e) {}
  }

  getPowerSchemeDisplayName(schemeId, settings = this.powerSettings) {
    const s = settings || this.powerSettings || this.defaultPowerSettings();
    const id = String(schemeId || s.scheme || 'always_on');
    if (id === 'home_office') return this.t('powercfg.schemeHomeOffice');
    if (id === 'portable') return this.t('powercfg.schemePortable');
    if (id === 'always_on') return this.t('powercfg.schemeAlwaysOn');
    if (id.startsWith('custom:')) return id.slice(7);
    return this.t('powercfg.schemeAlwaysOn');
  }

  getActivePowerTimers(settings = this.powerSettings) {
    const s = this.clonePowerSettings(settings);
    if (s.scheme.startsWith('custom:')) {
      const cName = s.scheme.slice(7);
      return s.customSchemes[cName] || { monitorTimeout: 15, diskTimeout: 60 };
    }
    return s.schemes[s.scheme] || s.schemes.always_on;
  }

  setSchemeTimers(settings, schemeId, monitorTimeout, diskTimeout) {
    const id = String(schemeId || settings.scheme || 'always_on');
    const m = typeof monitorTimeout === 'number' ? monitorTimeout : 15;
    const d = typeof diskTimeout === 'number' ? diskTimeout : 60;
    if (id.startsWith('custom:')) {
      const cName = id.slice(7);
      settings.customSchemes[cName] = { monitorTimeout: m, diskTimeout: d };
    } else {
      if (!settings.schemes[id]) settings.schemes[id] = { monitorTimeout: 15, diskTimeout: 60 };
      settings.schemes[id] = { monitorTimeout: m, diskTimeout: d };
    }
  }

  getPowerTimeoutOptions() {
    const mins = [1, 2, 3, 5, 10, 15, 20, 25, 30, 45, 60, 120, 180, 240, 300, 0];
    return mins.map(val => {
      let label = '';
      if (val === 0) label = this.t('powercfg.never');
      else if (val === 1) label = this.t('powercfg.after1Min');
      else if (val < 60) label = this.t('powercfg.afterNMins', val);
      else if (val === 60) label = this.t('powercfg.after1Hour');
      else if (val === 120) label = this.t('powercfg.after2Hours');
      else if (val === 180) label = this.t('powercfg.after3Hours');
      else if (val === 240) label = this.t('powercfg.after4Hours');
      else if (val === 300) label = this.t('powercfg.after5Hours');
      return { value: val, label };
    });
  }

  applyPowerSettings(settings, source = 'dialog') {
    const prev = this.clonePowerSettings(this.powerSettings);
    const next = this.clonePowerSettings(settings);
    this.powerSettings = next;
    this.syncPowerTrayIcon();
    this.initPowerIdleMonitor();
    if (source !== 'init' && source !== 'clippy' && window.appClippy && typeof window.appClippy.onPowerSettingsChanged === 'function') {
      window.appClippy.onPowerSettingsChanged(prev, next, source);
    }
  }

  setPowerSettings(patch, opts = 'clippy') {
    const source = typeof opts === 'string' ? opts : (opts && opts.source) || 'clippy';
    const silent = Boolean(opts && typeof opts === 'object' && opts.silent);
    const next = this.clonePowerSettings(this.powerSettings);
    if (patch && typeof patch === 'object') {
      if (patch.schemes && typeof patch.schemes === 'object') {
        const cloned = this.clonePowerSettings(patch);
        next.scheme = cloned.scheme;
        next.schemes = cloned.schemes;
        next.customSchemes = cloned.customSchemes;
        next.showTrayIcon = cloned.showTrayIcon;
      } else {
        const targetScheme = typeof patch.scheme === 'string' ? patch.scheme : (typeof patch.activeScheme === 'string' ? patch.activeScheme : null);
        if (targetScheme) next.scheme = targetScheme;
        if (typeof patch.showTrayIcon === 'boolean') next.showTrayIcon = patch.showTrayIcon;
        if (typeof patch.monitorTimeout === 'number' || typeof patch.diskTimeout === 'number') {
          const cur = this.getActivePowerTimers(next);
          const m = typeof patch.monitorTimeout === 'number' ? patch.monitorTimeout : cur.monitorTimeout;
          const d = typeof patch.diskTimeout === 'number' ? patch.diskTimeout : cur.diskTimeout;
          this.setSchemeTimers(next, next.scheme, m, d);
        }
      }
    }
    this.savePowerSettings(next);
    this.applyPowerSettings(next, silent ? 'init' : source);
    if (typeof this.syncPowerPropsUi === 'function') {
      this.syncPowerPropsUi();
    }
  }

  syncPowerTrayIcon() {
    if (typeof document === 'undefined' || !document.body || typeof document.querySelector !== 'function') return;
    const trayEl = document.querySelector('#taskbar-tray');
    if (!trayEl) return;
    let powerEl = document.querySelector('#tray-power-icon');
    const show = Boolean(this.powerSettings && this.powerSettings.showTrayIcon);
    if (!show) {
      if (powerEl) powerEl.style.display = 'none';
      return;
    }
    if (!powerEl) {
      powerEl = document.createElement('div');
      powerEl.className = 'tray-icon';
      powerEl.id = 'tray-power-icon';
      powerEl.style.width = '16px';
      powerEl.style.height = '16px';
      powerEl.style.display = 'flex';
      powerEl.style.alignItems = 'center';
      powerEl.style.justifyContent = 'center';
      powerEl.style.cursor = 'pointer';
      powerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openPowerTrayMenu(e.clientX, e.clientY);
      });
      powerEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.openPowerProperties();
      });
      powerEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openPowerTrayMenu(e.clientX, e.clientY);
      });
      const clockEl = document.querySelector('#tray-clock');
      if (clockEl && clockEl.parentNode === trayEl && typeof trayEl.insertBefore === 'function') {
        trayEl.insertBefore(powerEl, clockEl);
      } else {
        trayEl.appendChild(powerEl);
      }
    }
    powerEl.innerHTML = (typeof Icons !== 'undefined' && (Icons['power-tray'] || Icons['powercfg'])) || '';
    const schemeLabel = this.getPowerSchemeDisplayName(this.powerSettings.scheme, this.powerSettings);
    powerEl.title = this.t('powercfg.trayTooltip', schemeLabel);
    powerEl.style.display = 'flex';
  }

  openPowerTrayMenu(x, y) {
    if (!window.contextMenu) return;
    const s = this.powerSettings || this.defaultPowerSettings();
    const schemes = [
      { id: 'home_office', label: this.t('powercfg.schemeHomeOffice') },
      { id: 'portable', label: this.t('powercfg.schemePortable') },
      { id: 'always_on', label: this.t('powercfg.schemeAlwaysOn') }
    ];
    Object.keys(s.customSchemes || {}).forEach(name => {
      schemes.push({ id: `custom:${name}`, label: name });
    });
    const items = [
      {
        label: this.t('powercfg.trayOpenProps'),
        bold: true,
        action: () => this.openPowerProperties()
      },
      { separator: true }
    ];
    schemes.forEach(sc => {
      const isCurrent = s.scheme === sc.id;
      items.push({
        label: `${isCurrent ? '• ' : '   '}${sc.label}`,
        bold: isCurrent,
        action: () => this.setPowerSettings({ scheme: sc.id }, 'tray')
      });
    });
    items.push(
      { separator: true },
      {
        label: this.t('powercfg.trayStandbyMonitor'),
        action: () => this.enterMonitorStandby('tray')
      },
      {
        label: this.t('powercfg.traySpinDownDisks'),
        action: () => this.spinDownHardDisks('tray')
      }
    );
    window.contextMenu.show(x, y, items);
  }

  initPowerIdleMonitor() {
    if (typeof document === 'undefined' || !document.body) return;
    this.powerIdleSeconds = 0;
    if (!this.powerActivityBound && typeof document.addEventListener === 'function') {
      this.powerActivityBound = (e) => {
        if (this.monitorInStandby) {
          if (Date.now() - (this.monitorStandbyEnteredAt || 0) < 250) return;
          this.wakeMonitorStandby();
          return;
        }
        if (this.disksSpunDown && e && (e.type === 'mousedown' || e.type === 'keydown')) {
          this.spinUpHardDisks();
        }
        this.powerIdleSeconds = 0;
      };
      ['mousemove', 'mousedown', 'keydown'].forEach(evt => {
        document.addEventListener(evt, this.powerActivityBound, true);
      });
    }
  }

  ensureStandbyOverlay() {
    if (typeof document === 'undefined' || !document.body || typeof document.querySelector !== 'function') return null;
    if (this.powerOverlayEl && this.powerOverlayEl.parentNode) return this.powerOverlayEl;
    const existing = document.querySelector('#power-monitor-off-overlay');
    if (existing) {
      this.powerOverlayEl = existing;
      return existing;
    }
    const overlay = document.createElement('div');
    overlay.id = 'power-monitor-off-overlay';
    overlay.className = 'power-standby-overlay';
    overlay.innerHTML = `
      <div class="power-standby-crt-line"></div>
      <div class="power-standby-badge">
        <span class="power-standby-led"></span>
        <span class="power-standby-text">${this.t('powercfg.standbyTitle')} — ${this.t('powercfg.standbyHint')}</span>
      </div>
    `;
    overlay.addEventListener('mousedown', () => this.wakeMonitorStandby());
    overlay.addEventListener('mousemove', () => {
      if (Date.now() - (this.monitorStandbyEnteredAt || 0) >= 250) {
        this.wakeMonitorStandby();
      }
    });
    document.body.appendChild(overlay);
    this.powerOverlayEl = overlay;
    return overlay;
  }

  enterMonitorStandby(reason = 'idle') {
    this.initPowerIdleMonitor();
    const overlay = this.ensureStandbyOverlay();
    this.monitorInStandby = true;
    this.monitorStandbyEnteredAt = Date.now();
    if (overlay) {
      const textEl = overlay.querySelector('.power-standby-text');
      if (textEl) textEl.textContent = `${this.t('powercfg.standbyTitle')} — ${this.t('powercfg.standbyHint')}`;
      overlay.classList.add('active');
    }
    if (typeof document !== 'undefined' && document.body && document.body.classList) {
      document.body.classList.add('power-monitor-standby');
    }
    if (window.soundSys && typeof window.soundSys.playClick === 'function') {
      window.soundSys.playClick();
    }
    return true;
  }

  wakeMonitorStandby() {
    if (!this.monitorInStandby) return false;
    this.monitorInStandby = false;
    this.powerIdleSeconds = 0;
    if (this.powerOverlayEl) {
      this.powerOverlayEl.classList.remove('active');
    }
    if (typeof document !== 'undefined' && document.body && document.body.classList) {
      document.body.classList.remove('power-monitor-standby');
    }
    if (window.soundSys && typeof window.soundSys.playClick === 'function') {
      window.soundSys.playClick();
    }
    if (window.appClippy && typeof window.appClippy.onMonitorStandbyWake === 'function') {
      window.appClippy.onMonitorStandbyWake();
    }
    return true;
  }

  spinDownHardDisks(reason = 'idle') {
    this.initPowerIdleMonitor();
    this.disksSpunDown = true;
    if (typeof document !== 'undefined' && document.body && document.body.classList) {
      document.body.classList.add('power-disks-spundown');
    }
    if (window.soundSys && typeof window.soundSys.playClick === 'function') {
      window.soundSys.playClick();
    }
    if (reason === 'tray' && window.appClippy && typeof window.appClippy.onHardDiskSpinDown === 'function') {
      window.appClippy.onHardDiskSpinDown();
    }
    return true;
  }

  spinUpHardDisks() {
    if (!this.disksSpunDown) return false;
    this.disksSpunDown = false;
    this.powerIdleSeconds = 0;
    if (typeof document !== 'undefined' && document.body && document.body.classList) {
      document.body.classList.remove('power-disks-spundown');
    }
    if (window.soundSys && typeof window.soundSys.playClick === 'function') {
      window.soundSys.playClick();
    }
    if (window.appClippy && typeof window.appClippy.onHardDiskWake === 'function') {
      window.appClippy.onHardDiskWake();
    }
    return true;
  }

  onPowerHelp(activeTabId = 'tab-power-schemes') {
    if (window.appClippy && typeof window.appClippy.onPowerHelp === 'function') {
      if (window.appClippy.onPowerHelp(activeTabId)) return;
    }
    if (window.clippySystem && typeof window.clippySystem.onPowerHelp === 'function') {
      if (window.clippySystem.onPowerHelp(activeTabId)) return;
    }
    if (window.winManager) {
      window.winManager.openDialog({
        title: this.t('powercfg.title'),
        icon: 'info',
        message: this.t('powercfg.schemesDesc')
      });
    }
  }

  openPowerSaveSchemeDialog(defaultName, onSave) {
    if (!window.winManager) return;
    if (window.winManager.windows.has('app_powercfg_save_dlg')) {
      window.winManager.closeWindow('app_powercfg_save_dlg');
    }
    const content = document.createElement('div');
    content.className = 'powercfg-save-dlg';
    const safeVal = String(defaultName || '').replace(/"/g, '&quot;');
    content.innerHTML = `
      <label for="powercfg-save-name-input">${this.t('powercfg.saveSchemePrompt')}</label>
      <input type="text" class="powercfg-save-input" id="powercfg-save-name-input" value="${safeVal}">
      <div class="powercfg-save-btns">
        <button class="win-btn btn-powercfg-save-ok default">${this.t('btn.ok')}</button>
        <button class="win-btn btn-powercfg-save-cancel">${this.t('btn.cancel')}</button>
      </div>
    `;
    const dlg = window.winManager.createWindow({
      id: 'app_powercfg_save_dlg',
      title: this.t('powercfg.saveSchemeTitle'),
      icon: 'powercfg',
      width: 310,
      height: 138,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });
    const el = dlg.element;
    const input = el.querySelector('#powercfg-save-name-input');
    const commit = () => {
      const val = input ? input.value.trim() : '';
      if (!val) return;
      window.winManager.closeWindow('app_powercfg_save_dlg');
      if (typeof onSave === 'function') onSave(val);
    };
    const btnOk = el.querySelector('.btn-powercfg-save-ok');
    const btnCancel = el.querySelector('.btn-powercfg-save-cancel');
    if (btnOk) btnOk.addEventListener('click', commit);
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        window.winManager.closeWindow('app_powercfg_save_dlg');
      });
    }
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          window.winManager.closeWindow('app_powercfg_save_dlg');
        }
      });
      if (typeof input.focus === 'function') input.focus();
      if (typeof input.select === 'function') input.select();
    }
  }

  openPowerProperties(initialTab = 'schemes') {
    const targetTabId = initialTab === 'advanced' || initialTab === 'tab-power-advanced' ? 'tab-power-advanced' : 'tab-power-schemes';
    if (window.winManager && window.winManager.windows.has('app_powercfg_cpl')) {
      const existing = window.winManager.windows.get('app_powercfg_cpl');
      window.winManager.bringToTop('app_powercfg_cpl');
      if (existing && existing.element) {
        const tabBtn = existing.element.querySelector(`.win-tab[data-tab="${targetTabId}"]`);
        if (tabBtn) tabBtn.click();
      }
      return;
    }

    const saved = this.loadPowerSettings();
    const working = this.clonePowerSettings(saved);
    const timeoutOpts = this.getPowerTimeoutOptions();
    const timers = this.getActivePowerTimers(working);
    const currentSchemeLabel = this.getPowerSchemeDisplayName(working.scheme, working);
    const powerIconSvg = (typeof Icons !== 'undefined' && Icons['powercfg']) || '';
    let activeTabId = targetTabId;

    const renderSchemeOptionsHtml = (state) => {
      const builtin = [
        { value: 'home_office', label: this.t('powercfg.schemeHomeOffice') },
        { value: 'portable', label: this.t('powercfg.schemePortable') },
        { value: 'always_on', label: this.t('powercfg.schemeAlwaysOn') }
      ];
      const customs = Object.keys(state.customSchemes || {}).map(name => ({
        value: `custom:${name}`,
        label: name
      }));
      return builtin.concat(customs)
        .map(o => `<option value="${o.value}"${state.scheme === o.value ? ' selected' : ''}>${o.label}</option>`)
        .join('');
    };

    const renderTimeoutOptionsHtml = (selectedVal) => {
      return timeoutOpts
        .map(o => `<option value="${o.value}"${Number(selectedVal) === o.value ? ' selected' : ''}>${o.label}</option>`)
        .join('');
    };

    const content = document.createElement('div');
    content.className = 'powercfg-cpl-root';
    content.innerHTML = `
      <div class="win-tabs">
        <div class="win-tab${activeTabId === 'tab-power-schemes' ? ' active' : ''}" data-tab="tab-power-schemes">${this.t('powercfg.tabSchemes')}</div>
        <div class="win-tab${activeTabId === 'tab-power-advanced' ? ' active' : ''}" data-tab="tab-power-advanced">${this.t('powercfg.tabAdvanced')}</div>
      </div>

      <div class="win-tab-panel powercfg-tab-panel">
        <div class="powercfg-tab-content${activeTabId === 'tab-power-schemes' ? '' : ' hidden'}" id="tab-power-schemes">
          <div class="powercfg-top-row">
            <div class="powercfg-top-icon">${powerIconSvg}</div>
            <div class="powercfg-top-text">${this.t('powercfg.schemesDesc')}</div>
          </div>

          <fieldset class="powercfg-group">
            <legend>${this.t('powercfg.schemesGroup')}</legend>
            <select class="win-select powercfg-scheme-select" id="powercfg-scheme-select">
              ${renderSchemeOptionsHtml(working)}
            </select>
            <div class="powercfg-scheme-btns">
              <button class="win-btn" id="btn-powercfg-saveas">${this.t('powercfg.saveAs')}</button>
              <button class="win-btn" id="btn-powercfg-delete"${String(working.scheme).startsWith('custom:') ? '' : ' disabled'}>${this.t('powercfg.delete')}</button>
            </div>
          </fieldset>

          <fieldset class="powercfg-group powercfg-settings-group">
            <legend id="powercfg-settings-legend">${this.t('powercfg.settingsGroup', currentSchemeLabel)}</legend>
            <div class="powercfg-settings-spacer"></div>
            <div class="powercfg-divider"></div>
            <div class="powercfg-setting-row">
              <label for="powercfg-monitor-select">${this.t('powercfg.turnOffMonitor')}</label>
              <select class="win-select powercfg-setting-select" id="powercfg-monitor-select">
                ${renderTimeoutOptionsHtml(timers.monitorTimeout)}
              </select>
            </div>
            <div class="powercfg-setting-row">
              <label for="powercfg-disk-select">${this.t('powercfg.turnOffDisks')}</label>
              <select class="win-select powercfg-setting-select" id="powercfg-disk-select">
                ${renderTimeoutOptionsHtml(timers.diskTimeout)}
              </select>
            </div>
          </fieldset>
        </div>

        <div class="powercfg-tab-content${activeTabId === 'tab-power-advanced' ? '' : ' hidden'}" id="tab-power-advanced">
          <div class="powercfg-top-row">
            <div class="powercfg-top-icon">${powerIconSvg}</div>
            <div class="powercfg-top-text">${this.t('powercfg.advancedDesc')}</div>
          </div>

          <fieldset class="powercfg-group powercfg-options-group">
            <legend>${this.t('powercfg.optionsGroup')}</legend>
            <div class="powercfg-check-row">
              <input type="checkbox" id="powercfg-show-meter"${working.showTrayIcon ? ' checked' : ''}>
              <label for="powercfg-show-meter">${this.t('powercfg.alwaysShowIcon')}</label>
            </div>
          </fieldset>
        </div>
      </div>

      <div class="powercfg-dialog-buttons">
        <button class="win-btn btn-powercfg-ok default">${this.t('btn.ok')}</button>
        <button class="win-btn btn-powercfg-cancel">${this.t('btn.cancel')}</button>
        <button class="win-btn btn-powercfg-apply" disabled>${this.t('btn.apply')}</button>
      </div>
    `;

    const dialog = window.winManager.createWindow({
      id: 'app_powercfg_cpl',
      title: this.t('powercfg.title'),
      icon: 'powercfg',
      width: 404,
      height: 424,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      helpButton: true,
      hasHelp: true,
      onHelp: () => this.onPowerHelp(activeTabId),
      onClose: () => {
        this.syncPowerPropsUi = null;
      },
      content
    });

    const el = dialog.element;
    const schemeSelect = el.querySelector('#powercfg-scheme-select');
    const settingsLegend = el.querySelector('#powercfg-settings-legend');
    const monitorSelect = el.querySelector('#powercfg-monitor-select');
    const diskSelect = el.querySelector('#powercfg-disk-select');
    const btnSaveAs = el.querySelector('#btn-powercfg-saveas');
    const btnDelete = el.querySelector('#btn-powercfg-delete');
    const chkShowMeter = el.querySelector('#powercfg-show-meter');
    const btnOk = el.querySelector('.btn-powercfg-ok');
    const btnCancel = el.querySelector('.btn-powercfg-cancel');
    const btnApply = el.querySelector('.btn-powercfg-apply');

    const markDirty = () => {
      if (btnApply) btnApply.disabled = false;
    };

    const syncUiFromWorking = () => {
      if (schemeSelect) {
        schemeSelect.innerHTML = renderSchemeOptionsHtml(working);
        schemeSelect.value = working.scheme;
      }
      const label = this.getPowerSchemeDisplayName(working.scheme, working);
      if (settingsLegend) {
        settingsLegend.textContent = this.t('powercfg.settingsGroup', label);
      }
      const curTimers = this.getActivePowerTimers(working);
      if (monitorSelect) {
        monitorSelect.value = String(curTimers.monitorTimeout);
      }
      if (diskSelect) {
        diskSelect.value = String(curTimers.diskTimeout);
      }
      if (btnDelete) {
        btnDelete.disabled = !String(working.scheme).startsWith('custom:');
      }
      if (chkShowMeter) {
        chkShowMeter.checked = Boolean(working.showTrayIcon);
      }
    };

    this.syncPowerPropsUi = () => {
      const fresh = this.loadPowerSettings();
      working.scheme = fresh.scheme;
      working.schemes = fresh.schemes;
      working.customSchemes = fresh.customSchemes;
      working.showTrayIcon = fresh.showTrayIcon;
      syncUiFromWorking();
      if (btnApply) btnApply.disabled = true;
    };

    el.querySelectorAll('.win-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        activeTabId = tabBtn.dataset.tab;
        el.querySelectorAll('.win-tab').forEach(b => b.classList.toggle('active', b === tabBtn));
        el.querySelectorAll('.powercfg-tab-content').forEach(tc => {
          tc.classList.toggle('hidden', tc.id !== activeTabId);
        });
      });
    });

    if (schemeSelect) {
      schemeSelect.addEventListener('change', () => {
        working.scheme = schemeSelect.value;
        syncUiFromWorking();
        markDirty();
      });
    }

    if (monitorSelect) {
      monitorSelect.addEventListener('change', () => {
        const cur = this.getActivePowerTimers(working);
        const m = parseInt(monitorSelect.value, 10);
        this.setSchemeTimers(working, working.scheme, Number.isNaN(m) ? 15 : m, cur.diskTimeout);
        markDirty();
      });
    }

    if (diskSelect) {
      diskSelect.addEventListener('change', () => {
        const cur = this.getActivePowerTimers(working);
        const d = parseInt(diskSelect.value, 10);
        this.setSchemeTimers(working, working.scheme, cur.monitorTimeout, Number.isNaN(d) ? 60 : d);
        markDirty();
      });
    }

    if (chkShowMeter) {
      chkShowMeter.addEventListener('change', () => {
        working.showTrayIcon = Boolean(chkShowMeter.checked);
        markDirty();
      });
    }

    if (btnSaveAs) {
      btnSaveAs.addEventListener('click', () => {
        const defaultName = this.getPowerSchemeDisplayName(working.scheme, working);
        this.openPowerSaveSchemeDialog(defaultName, (newName) => {
          const cur = this.getActivePowerTimers(working);
          working.customSchemes[newName] = {
            monitorTimeout: cur.monitorTimeout,
            diskTimeout: cur.diskTimeout
          };
          working.scheme = `custom:${newName}`;
          syncUiFromWorking();
          markDirty();
          if (window.appClippy && typeof window.appClippy.onPowerSchemeSaved === 'function') {
            window.appClippy.onPowerSchemeSaved(newName, cur);
          }
        });
      });
    }

    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        if (!String(working.scheme).startsWith('custom:')) return;
        const cName = String(working.scheme).slice(7);
        delete working.customSchemes[cName];
        working.scheme = 'always_on';
        syncUiFromWorking();
        markDirty();
        if (window.appClippy && typeof window.appClippy.onPowerSchemeDeleted === 'function') {
          window.appClippy.onPowerSchemeDeleted(cName);
        }
      });
    }

    const commitPowerSettings = () => {
      this.savePowerSettings(working);
      this.applyPowerSettings(working, 'dialog');
      if (btnApply) btnApply.disabled = true;
      if (window.soundSys && typeof window.soundSys.playClick === 'function') {
        window.soundSys.playClick();
      }
    };

    if (btnApply) {
      btnApply.addEventListener('click', () => {
        commitPowerSettings();
      });
    }

    if (btnOk) {
      btnOk.addEventListener('click', () => {
        if (btnApply && !btnApply.disabled) {
          commitPowerSettings();
        }
        window.winManager.closeWindow('app_powercfg_cpl');
      });
    }

    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        window.winManager.closeWindow('app_powercfg_cpl');
      });
    }
  }

  openSoundsProperties() {
    if (window.winManager.windows.has('app_mmsys_sounds')) {
      window.winManager.bringToTop('app_mmsys_sounds');
      return;
    }

    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const events = [
      { id: 'asterisk', label: isRu ? 'Звездочка' : 'Asterisk', wav: 'CHORD.WAV' },
      { id: 'critical', label: isRu ? 'Критическая ошибка' : 'Critical Stop', wav: 'CHORD.WAV' },
      { id: 'default', label: isRu ? 'Стандартный звук' : 'Default Sound', wav: 'DING.WAV' },
      { id: 'exclamation', label: isRu ? 'Восклицание' : 'Exclamation', wav: 'CHORD.WAV' },
      { id: 'exit', label: isRu ? 'Выход из Win' : 'Exit Win', wav: 'TADA.WAV' },
      { id: 'menu', label: isRu ? 'Команда меню' : 'Menu Command', wav: '(None)' },
      { id: 'question', label: isRu ? 'Вопрос' : 'Question', wav: 'CHIMES.WAV' },
      { id: 'start', label: isRu ? 'Запуск Win' : 'Start Win', wav: 'THE MICROSLOP SOUND.WAV' },
      { id: 'recycle', label: isRu ? 'Очистка корзины' : 'Empty Recycle Bin', wav: 'RECYCLE.WAV' }
    ];

    const wavChoices = [
      '(None)',
      'THE MICROSLOP SOUND.WAV',
      'TADA.WAV',
      'CHIMES.WAV',
      'CHORD.WAV',
      'DING.WAV',
      'NOTIFY.WAV',
      'RECYCLE.WAV',
      'START.WAV',
      'LOGOFF.WAV'
    ];

    let selectedIdx = 7;

    const content = document.createElement('div');
    content.style.cssText = 'padding: 10px; font-family: Tahoma, sans-serif; font-size: 11px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; background: #c0c0c0;';
    content.innerHTML = `
      <div class="win-tabs">
        <div class="win-tab active" data-tab="sounds">${isRu ? 'Звук' : 'Sounds'}</div>
      </div>
      <div class="win-tab-panel" style="flex:1; padding:12px; display:flex; flex-direction:column; gap:8px;">
        <div>${isRu ? 'События:' : 'Events:'}</div>
        <div id="sounds-events-tree" class="win-inset" style="background:#fff; height:145px; overflow-y:auto; padding:4px;"></div>

        <fieldset style="border: 1px groove #fff; padding: 8px;">
          <legend>${isRu ? 'Звук' : 'Sound'}</legend>
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
            <div style="flex:1;">
              <div style="margin-bottom:3px;">${isRu ? 'Имя:' : 'Name:'}</div>
              <div style="display:flex; gap:6px;">
                <select id="sounds-wav-select" class="win-select" style="flex:1; height:21px;">
                  ${wavChoices.map(w => `<option value="${w}">${w === '(None)' ? (isRu ? '(нет)' : '(None)') : w}</option>`).join('')}
                </select>
                <button class="win-btn" id="sounds-browse-btn" style="min-width:65px;">${isRu ? 'Обзор...' : 'Browse...'}</button>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:center; gap:3px;">
              <div>${isRu ? 'Образец:' : 'Preview:'}</div>
              <div style="display:flex; gap:4px; align-items:center;">
                <div class="win-inset" style="width:36px; height:32px; background:#c0c0c0; display:flex; align-items:center; justify-content:center;">
                  <div style="width:20px; height:20px;">${Icons['sounds-cpl'] || Icons['volume']}</div>
                </div>
                <button class="win-btn" id="sounds-play-btn" style="width:26px; height:24px; padding:0; font-weight:bold;">▶</button>
                <button class="win-btn" id="sounds-stop-btn" style="width:26px; height:24px; padding:0;" disabled>■</button>
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset style="border: 1px groove #fff; padding: 8px;">
          <legend>${isRu ? 'Схемы' : 'Schemes'}</legend>
          <div style="display:flex; gap:6px; align-items:center;">
            <select id="sounds-scheme-select" class="win-select" style="flex:1; height:21px;">
              <option value="default">${isRu ? 'Стандартная схема Win' : 'Win Default'}</option>
              <option value="nosounds">${isRu ? 'Нет звуков' : 'No Sounds'}</option>
              <option value="jungle">Jungle</option>
              <option value="musica">Musica</option>
              <option value="robotz">Robotz</option>
              <option value="utopia">Utopia</option>
            </select>
            <button class="win-btn" id="sounds-save-scheme">${isRu ? 'Сохранить как...' : 'Save As...'}</button>
            <button class="win-btn" disabled>${isRu ? 'Удалить' : 'Delete'}</button>
          </div>
        </fieldset>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:8px;">
        <button class="win-btn default" id="sounds-ok-btn" style="min-width:75px;">OK</button>
        <button class="win-btn" id="sounds-cancel-btn" style="min-width:75px;">${isRu ? 'Отмена' : 'Cancel'}</button>
        <button class="win-btn" id="sounds-apply-btn" style="min-width:75px;">${isRu ? 'Применить' : 'Apply'}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_mmsys_sounds',
      title: isRu ? 'Свойства: Звук' : 'Sounds Properties',
      icon: 'sounds-cpl',
      width: 400,
      height: 430,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = win.element;
    const treeEl = el.querySelector('#sounds-events-tree');
    const wavSel = el.querySelector('#sounds-wav-select');
    const playBtn = el.querySelector('#sounds-play-btn');
    const schemeSel = el.querySelector('#sounds-scheme-select');

    const renderEvents = () => {
      treeEl.innerHTML = `<div style="font-weight:bold; padding:2px 4px;">📁 Win</div>` + events.map((ev, idx) => {
        const hasSound = ev.wav && ev.wav !== '(None)';
        const active = idx === selectedIdx;
        return `
          <div class="sound-ev-row" data-idx="${idx}" style="display:flex; align-items:center; gap:6px; padding:2px 14px; cursor:pointer; background:${active ? '#000080' : 'transparent'}; color:${active ? '#fff' : '#000'};">
            <span style="width:14px; text-align:center;">${hasSound ? '🔊' : ' '}</span>
            <span>${ev.label}</span>
          </div>
        `;
      }).join('');

      treeEl.querySelectorAll('.sound-ev-row').forEach(row => {
        row.addEventListener('click', () => {
          selectedIdx = parseInt(row.dataset.idx, 10);
          wavSel.value = events[selectedIdx].wav;
          renderEvents();
        });
      });
    };

    renderEvents();
    wavSel.value = events[selectedIdx].wav;

    wavSel.addEventListener('change', () => {
      events[selectedIdx].wav = wavSel.value;
      renderEvents();
    });

    schemeSel.addEventListener('change', () => {
      if (schemeSel.value === 'nosounds') {
        events.forEach(ev => { ev.wav = '(None)'; });
      } else {
        events[0].wav = 'CHORD.WAV';
        events[1].wav = 'CHORD.WAV';
        events[2].wav = 'DING.WAV';
        events[3].wav = 'CHORD.WAV';
        events[4].wav = 'TADA.WAV';
        events[5].wav = '(None)';
        events[6].wav = 'CHIMES.WAV';
        events[7].wav = 'THE MICROSLOP SOUND.WAV';
        events[8].wav = 'RECYCLE.WAV';
      }
      wavSel.value = events[selectedIdx].wav;
      renderEvents();
    });

    playBtn.addEventListener('click', () => {
      const wav = wavSel.value;
      if (wav === '(None)' || !window.soundSys) return;
      if (wav.includes('MICROSLOP') || wav === 'START.WAV') {
        if (window.soundSys.playStartup) window.soundSys.playStartup();
        else window.soundSys.playNotification();
      } else if (wav === 'TADA.WAV' || wav === 'LOGOFF.WAV') {
        if (window.soundSys.playShutdown) window.soundSys.playShutdown();
        else window.soundSys.playNotification();
      } else if (wav === 'CHORD.WAV') {
        if (window.soundSys.playError) window.soundSys.playError();
      } else {
        if (window.soundSys.playNotification) window.soundSys.playNotification();
      }
    });

    el.querySelector('#sounds-save-scheme').addEventListener('click', () => {
      window.winManager.openDialog({
        title: isRu ? 'Сохранить схему как' : 'Save Scheme As',
        icon: 'info',
        message: isRu ? 'Звуковая схема успешно сохранена в реестре.' : 'Sound scheme saved to registry.'
      });
    });

    el.querySelector('#sounds-ok-btn').addEventListener('click', () => window.winManager.closeWindow('app_mmsys_sounds'));
    el.querySelector('#sounds-cancel-btn').addEventListener('click', () => window.winManager.closeWindow('app_mmsys_sounds'));
    el.querySelector('#sounds-apply-btn').addEventListener('click', () => {
      if (window.soundSys) window.soundSys.playClick();
    });
  }

  openFontViewer(item) {
    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const rawName = (item && item.name) ? item.name : 'Arial (TrueType).ttf';
    const cleanTitle = rawName.replace(/\.(ttf|fon)$/i, '');
    const isRaster = /\.fon$/i.test(rawName);
    let cssFont = 'Arial, sans-serif';
    if (/times/i.test(rawName)) cssFont = '"Times New Roman", serif';
    else if (/courier|fixedsys|terminal/i.test(rawName)) cssFont = '"Courier New", monospace';
    else if (/comic/i.test(rawName)) cssFont = '"Comic Sans MS", cursive, sans-serif';
    else if (/tahoma/i.test(rawName)) cssFont = 'Tahoma, sans-serif';
    else if (/verdana/i.test(rawName)) cssFont = 'Verdana, sans-serif';
    else if (/impact/i.test(rawName)) cssFont = 'Impact, sans-serif';
    else if (/trebuchet/i.test(rawName)) cssFont = '"Trebuchet MS", sans-serif';

    const winId = 'fontview_' + cleanTitle.replace(/[^a-zA-Z0-9]/g, '_');
    if (window.winManager.windows.has(winId)) {
      window.winManager.bringToTop(winId);
      return;
    }

    const pangram = isRu
      ? 'Съешь ещё этих мягких французских булок, да выпей же чаю. 1234567890'
      : 'The quick brown fox jumps over the lazy dog. 1234567890';

    const sizes = [12, 18, 24, 36, 48, 60, 72];
    const content = document.createElement('div');
    content.style.cssText = 'display:flex; flex-direction:column; height:100%; background:#fff; color:#000; font-family:Tahoma, sans-serif; font-size:11px;';
    content.innerHTML = `
      <div style="background:#c0c0c0; padding:6px 8px; border-bottom:1px solid #808080; display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn font-done-btn" style="min-width:70px;">${isRu ? 'Готово' : 'Done'}</button>
        <button class="win-btn font-print-btn" style="min-width:70px;">${isRu ? 'Печать' : 'Print'}</button>
      </div>
      <div style="flex:1; overflow-y:auto; padding:10px 14px; background:#fff;">
        <div style="font-size:22px; font-weight:bold; font-family:${cssFont}; border-bottom:2px solid #000; padding-bottom:4px; margin-bottom:6px;">
          ${cleanTitle}
        </div>
        <div style="font-size:11px; line-height:1.4; border-bottom:2px solid #000; padding-bottom:6px; margin-bottom:8px;">
          <div>${isRaster
            ? (isRu ? 'Растровый шрифт — разрешение VGA (96 точек на дюйм)' : 'Raster Font — VGA resolution (96 dpi)')
            : (isRu ? 'Шрифт TrueType, с цифровой подписью, разметка OpenType' : 'TrueType Font, Digitally Signed, OpenType Layout')}</div>
          <div>${isRu ? 'Версия: версия 2.50 — Microslop Corp.' : 'Version: Version 2.50 — Microslop Corp.'}</div>
        </div>
        <div style="font-family:${cssFont}; font-size:14px; line-height:1.4; border-bottom:1px solid #000; padding-bottom:8px; margin-bottom:10px;">
          abcdefghijklmnopqrstuvwxyz<br>
          ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>
          1234567890.:,;("!?') +-*/=
        </div>
        <div>
          ${sizes.map(sz => `
            <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:6px; white-space:nowrap; overflow:hidden;">
              <span style="font-family:Tahoma,sans-serif; font-size:10px; min-width:22px; color:#444;">${sz}</span>
              <span style="font-family:${cssFont}; font-size:${sz}px; line-height:1.15;">${pangram}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: winId,
      title: cleanTitle,
      icon: isRaster ? 'file-fon' : 'file-ttf',
      width: 520,
      height: 440,
      content
    });

    win.element.querySelector('.font-done-btn').addEventListener('click', () => window.winManager.closeWindow(winId));
    win.element.querySelector('.font-print-btn').addEventListener('click', () => {
      window.winManager.openDialog({
        title: isRu ? 'Печать образца шрифта' : 'Print Font Sample',
        icon: 'info',
        message: isRu ? `Образец шрифта "${cleanTitle}" отправлен в очередь печати LPT1:.` : `Font sample "${cleanTitle}" sent to printer queue on LPT1:.`
      });
    });
  }

  openKeyboardProperties() {
    if (window.winManager.windows.has('app_keyboard_cpl')) {
      window.winManager.bringToTop('app_keyboard_cpl');
      return;
    }
    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.style.cssText = 'padding:10px; font-family:Tahoma,sans-serif; font-size:11px; display:flex; flex-direction:column; height:100%; box-sizing:border-box; background:#c0c0c0;';
    content.innerHTML = `
      <div class="win-tabs">
        <div class="win-tab active" data-tab="speed">${isRu ? 'Скорость' : 'Speed'}</div>
        <div class="win-tab" data-tab="language">${isRu ? 'Язык' : 'Language'}</div>
      </div>
      <div class="win-tab-panel" style="flex:1; padding:12px;">
        <div id="kb-tab-speed">
          <fieldset style="border:1px groove #fff; padding:8px; margin-bottom:10px;">
            <legend>${isRu ? 'Повтор символов' : 'Character repeat'}</legend>
            <div style="margin-bottom:8px;">
              <div>${isRu ? 'Задержка перед началом повтора:' : 'Repeat delay:'}</div>
              <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                <span>${isRu ? 'Длиннее' : 'Long'}</span>
                <input type="range" min="1" max="4" value="3" style="flex:1;">
                <span>${isRu ? 'Короче' : 'Short'}</span>
              </div>
            </div>
            <div style="margin-bottom:8px;">
              <div>${isRu ? 'Скорость повтора:' : 'Repeat rate:'}</div>
              <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                <span>${isRu ? 'Ниже' : 'Slow'}</span>
                <input type="range" min="1" max="31" value="28" style="flex:1;">
                <span>${isRu ? 'Выше' : 'Fast'}</span>
              </div>
            </div>
            <div>
              <div>${isRu ? 'Щелкните здесь и удерживайте клавишу для проверки скорости повтора:' : 'Click here and hold down a key to test repeat rate:'}</div>
              <input type="text" class="win-inset" style="width:100%; box-sizing:border-box; height:21px; margin-top:4px; padding:2px 4px;" placeholder="${isRu ? 'Проверка повтора...' : 'Test repeat rate here...'}">
            </div>
          </fieldset>

          <fieldset style="border:1px groove #fff; padding:8px;">
            <legend>${isRu ? 'Частота мерцания курсора' : 'Cursor blink rate'}</legend>
            <div style="display:flex; align-items:center; gap:12px;">
              <div class="win-inset" style="width:36px; height:32px; background:#fff; display:flex; align-items:center; justify-content:center;">
                <span id="kb-cursor-preview" style="font-weight:bold; font-size:16px;">|</span>
              </div>
              <div style="flex:1; display:flex; align-items:center; gap:8px;">
                <span>${isRu ? 'Ниже' : 'None'}</span>
                <input type="range" id="kb-blink-range" min="150" max="1000" value="500" style="flex:1;">
                <span>${isRu ? 'Выше' : 'Fast'}</span>
              </div>
            </div>
          </fieldset>
        </div>

        <div id="kb-tab-language" style="display:none;">
          <fieldset style="border:1px groove #fff; padding:8px; margin-bottom:10px;">
            <legend>${isRu ? 'Установленные языки и раскладки' : 'Installed languages and layouts'}</legend>
            <div class="win-inset" style="background:#fff; height:105px; padding:4px; overflow-y:auto;">
              <div style="display:flex; justify-content:space-between; font-weight:bold; border-bottom:1px solid #c0c0c0; padding-bottom:2px; margin-bottom:4px;">
                <span>${isRu ? 'Язык' : 'Language'}</span>
                <span>${isRu ? 'Раскладка' : 'Layout'}</span>
              </div>
              <div style="display:flex; justify-content:space-between; padding:3px 4px; background:#000080; color:#fff;">
                <span><b style="background:#000080;color:#fff;padding:0 2px;border:1px solid #fff;">En</b> ${isRu ? 'Английский (США)' : 'English (United States)'}</span>
                <span>${isRu ? 'США' : 'United States 101'}</span>
              </div>
              <div style="display:flex; justify-content:space-between; padding:3px 4px;">
                <span><b style="background:#000080;color:#fff;padding:0 2px;">Ru</b> ${isRu ? 'Русский' : 'Russian'}</span>
                <span>${isRu ? 'Русская' : 'Russian'}</span>
              </div>
            </div>
            <div style="display:flex; gap:6px; margin-top:6px;">
              <button class="win-btn" id="kb-switch-lang-btn">${isRu ? 'Использовать по умолчанию' : 'Set as Default'}</button>
              <button class="win-btn">${isRu ? 'Свойства' : 'Properties'}</button>
            </div>
          </fieldset>

          <fieldset style="border:1px groove #fff; padding:8px; margin-bottom:8px;">
            <legend>${isRu ? 'Переключение языков' : 'Switch languages'}</legend>
            <label style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <input type="radio" name="kb-switch-key" checked> ${isRu ? 'Alt слева+Shift' : 'Left Alt+Shift'}
            </label>
            <label style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <input type="radio" name="kb-switch-key"> Ctrl+Shift
            </label>
            <label style="display:flex; align-items:center; gap:6px;">
              <input type="radio" name="kb-switch-key"> ${isRu ? 'Нет' : 'None'}
            </label>
          </fieldset>

          <label style="display:flex; align-items:center; gap:6px;">
            <input type="checkbox" id="kb-tray-indicator" checked> ${isRu ? 'Отображать индикатор языка на панели задач' : 'Enable indicator on taskbar'}
          </label>
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:8px;">
        <button class="win-btn default" id="kb-ok-btn" style="min-width:75px;">OK</button>
        <button class="win-btn" id="kb-cancel-btn" style="min-width:75px;">${isRu ? 'Отмена' : 'Cancel'}</button>
        <button class="win-btn" id="kb-apply-btn" style="min-width:75px;">${isRu ? 'Применить' : 'Apply'}</button>
      </div>
    `;

    let blinkTimer = null;
    const win = window.winManager.createWindow({
      id: 'app_keyboard_cpl',
      title: isRu ? 'Свойства: Клавиатура' : 'Keyboard Properties',
      icon: 'keyboard',
      width: 390,
      height: 410,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      onClose: () => { if (blinkTimer) clearInterval(blinkTimer); },
      content
    });

    const el = win.element;
    const cursorEl = el.querySelector('#kb-cursor-preview');
    const blinkRange = el.querySelector('#kb-blink-range');

    const updateBlink = () => {
      if (blinkTimer) clearInterval(blinkTimer);
      const period = 1150 - parseInt(blinkRange.value, 10);
      blinkTimer = setInterval(() => {
        cursorEl.style.visibility = cursorEl.style.visibility === 'hidden' ? 'visible' : 'hidden';
      }, period);
    };
    updateBlink();
    blinkRange.addEventListener('input', updateBlink);

    el.querySelectorAll('.win-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.win-tab').forEach(t => t.classList.toggle('active', t === tab));
        el.querySelector('#kb-tab-speed').style.display = tab.dataset.tab === 'speed' ? 'block' : 'none';
        el.querySelector('#kb-tab-language').style.display = tab.dataset.tab === 'language' ? 'block' : 'none';
      });
    });

    el.querySelector('#kb-switch-lang-btn').addEventListener('click', () => {
      if (typeof i18n !== 'undefined') {
        i18n.setLanguage(i18n.getLanguage() === 'ru' ? 'en' : 'ru');
      }
    });

    el.querySelector('#kb-tray-indicator').addEventListener('change', (e) => {
      const badge = document.getElementById('tray-lang-badge');
      if (badge) badge.style.display = e.target.checked ? 'flex' : 'none';
    });

    el.querySelector('#kb-ok-btn').addEventListener('click', () => window.winManager.closeWindow('app_keyboard_cpl'));
    el.querySelector('#kb-cancel-btn').addEventListener('click', () => window.winManager.closeWindow('app_keyboard_cpl'));
    el.querySelector('#kb-apply-btn').addEventListener('click', () => {
      if (window.soundSys) window.soundSys.playClick();
    });
  }

  openPrintersFolder() {
    if (window.appExplorer) {
      window.appExplorer.open(['My Computer', 'Printers']);
    }
  }

  openAddPrinterWizard() {
    if (window.winManager.windows.has('app_add_printer_wiz')) {
      window.winManager.bringToTop('app_add_printer_wiz');
      return;
    }

    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    let step = 0;
    let selectedMaker = 'HP';
    let selectedModel = 'HP LaserJet 4L';
    let selectedPort = 'LPT1:';
    let printerName = 'HP LaserJet 4L';
    let printTestPage = true;

    const makers = {
      'HP': ['HP LaserJet 4L', 'HP LaserJet 5P', 'HP DeskJet 690C', 'HP DeskJet 890C'],
      'Epson': ['Epson Stylus Color 600', 'Epson Stylus Color 800', 'Epson LQ-570+'],
      'Canon': ['Canon Bubble-Jet BJC-4300', 'Canon Bubble-Jet BJC-250'],
      'Lexmark': ['Lexmark Optra E+', 'Lexmark 5700 Color Jetprinter']
    };

    const content = document.createElement('div');
    content.style.cssText = 'padding:10px; font-family:Tahoma,sans-serif; font-size:11px; display:flex; flex-direction:column; height:100%; box-sizing:border-box; background:#c0c0c0;';
    content.innerHTML = `
      <div style="display:flex; flex:1; gap:12px;">
        <div class="win-inset" style="width:120px; background:linear-gradient(180deg, #000080 0%, #008080 100%); display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; padding:10px; text-align:center;">
          <div style="width:48px; height:48px; margin-bottom:10px;">${Icons['printers'] || Icons['printer']}</div>
          <div style="font-weight:bold; font-size:13px;">${isRu ? 'Мастер установки принтера' : 'Add Printer Wizard'}</div>
        </div>
        <div id="prn-wiz-body" style="flex:1; display:flex; flex-direction:column;"></div>
      </div>
      <div style="border-top:1px groove #fff; padding-top:8px; margin-top:8px; display:flex; justify-content:flex-end; gap:6px;">
        <button class="win-btn" id="prn-wiz-back" style="min-width:75px;" disabled>&lt; ${isRu ? 'Назад' : 'Back'}</button>
        <button class="win-btn default" id="prn-wiz-next" style="min-width:75px;">${isRu ? 'Далее' : 'Next'} &gt;</button>
        <button class="win-btn" id="prn-wiz-cancel" style="min-width:75px;">${isRu ? 'Отмена' : 'Cancel'}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_add_printer_wiz',
      title: isRu ? 'Мастер установки принтера' : 'Add Printer Wizard',
      icon: 'printers',
      width: 450,
      height: 330,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = win.element;
    const bodyEl = el.querySelector('#prn-wiz-body');
    const backBtn = el.querySelector('#prn-wiz-back');
    const nextBtn = el.querySelector('#prn-wiz-next');

    const renderStep = () => {
      backBtn.disabled = step === 0;
      nextBtn.textContent = step === 3 ? (isRu ? 'Готово' : 'Finish') : `${isRu ? 'Далее' : 'Next'} >`;

      if (step === 0) {
        bodyEl.innerHTML = `
          <div style="font-weight:bold; font-size:12px; margin-bottom:8px;">${isRu ? 'Каким образом принтер подключен к компьютеру?' : 'How is this printer attached to your computer?'}</div>
          <label style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
            <input type="radio" name="prn-type" value="local" checked>
            <b>${isRu ? 'Локальный принтер' : 'Local printer'}</b>
          </label>
          <div style="padding-left:22px; margin-bottom:12px; color:#333;">${isRu ? 'Подключен непосредственно к этому компьютеру.' : 'Directly connected to your computer.'}</div>
          <label style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
            <input type="radio" name="prn-type" value="net">
            <b>${isRu ? 'Сетевой принтер' : 'Network printer'}</b>
          </label>
          <div style="padding-left:22px; color:#333;">${isRu ? 'Подключен к другому компьютеру или к сети.' : 'Attached to another computer or directly to the network.'}</div>
        `;
      } else if (step === 1) {
        bodyEl.innerHTML = `
          <div style="margin-bottom:6px;">${isRu ? 'Выберите изготовителя и модель вашего принтера:' : 'Click the manufacturer and model of your printer:'}</div>
          <div style="display:flex; gap:8px; flex:1;">
            <div style="width:110px; display:flex; flex-direction:column;">
              <div>${isRu ? 'Изготовители:' : 'Manufacturers:'}</div>
              <div id="prn-makers-list" class="win-inset" style="background:#fff; flex:1; overflow-y:auto; padding:2px;">
                ${Object.keys(makers).map(m => `<div class="prn-maker-row" data-m="${m}" style="padding:2px 4px; cursor:pointer; background:${m === selectedMaker ? '#000080' : 'transparent'}; color:${m === selectedMaker ? '#fff' : '#000'};">${m}</div>`).join('')}
              </div>
            </div>
            <div style="flex:1; display:flex; flex-direction:column;">
              <div>${isRu ? 'Принтеры:' : 'Printers:'}</div>
              <div id="prn-models-list" class="win-inset" style="background:#fff; flex:1; overflow-y:auto; padding:2px;">
                ${makers[selectedMaker].map(mod => `<div class="prn-model-row" data-mod="${mod}" style="padding:2px 4px; cursor:pointer; background:${mod === selectedModel ? '#000080' : 'transparent'}; color:${mod === selectedModel ? '#fff' : '#000'};">${mod}</div>`).join('')}
              </div>
            </div>
          </div>
        `;
        bodyEl.querySelectorAll('.prn-maker-row').forEach(r => {
          r.addEventListener('click', () => {
            selectedMaker = r.dataset.m;
            selectedModel = makers[selectedMaker][0];
            printerName = selectedModel;
            renderStep();
          });
        });
        bodyEl.querySelectorAll('.prn-model-row').forEach(r => {
          r.addEventListener('click', () => {
            selectedModel = r.dataset.mod;
            printerName = selectedModel;
            renderStep();
          });
        });
      } else if (step === 2) {
        const ports = [
          { p: 'LPT1:', d: isRu ? 'Порт принтера (ECP)' : 'ECP Printer Port' },
          { p: 'COM1:', d: isRu ? 'Последовательный порт' : 'Communications Port' },
          { p: 'COM2:', d: isRu ? 'Последовательный порт' : 'Communications Port' },
          { p: 'FILE:', d: isRu ? 'Создает файл на диске' : 'Creates a file on disk' }
        ];
        bodyEl.innerHTML = `
          <div style="margin-bottom:6px;">${isRu ? 'Выберите порт, который будет использоваться с этим принтером:' : 'Click the port you want to use with this printer:'}</div>
          <div class="win-inset" style="background:#fff; flex:1; padding:4px;">
            ${ports.map(pt => `
              <div class="prn-port-row" data-p="${pt.p}" style="display:flex; justify-content:space-between; padding:2px 4px; cursor:pointer; background:${pt.p === selectedPort ? '#000080' : 'transparent'}; color:${pt.p === selectedPort ? '#fff' : '#000'};">
                <span>${pt.p}</span>
                <span>${pt.d}</span>
              </div>
            `).join('')}
          </div>
        `;
        bodyEl.querySelectorAll('.prn-port-row').forEach(r => {
          r.addEventListener('click', () => {
            selectedPort = r.dataset.p;
            renderStep();
          });
        });
      } else if (step === 3) {
        bodyEl.innerHTML = `
          <div style="margin-bottom:6px;">${isRu ? 'Введите имя для этого принтера:' : 'Type a name for this printer:'}</div>
          <input type="text" id="prn-name-input" class="win-inset" value="${printerName}" style="height:21px; padding:2px 4px; margin-bottom:14px;">
          <div style="margin-bottom:6px;">${isRu ? 'Напечатать пробную страницу после установки принтера?' : 'Would you like to print a test page after your printer is installed?'}</div>
          <label style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <input type="radio" name="prn-test" value="yes" ${printTestPage ? 'checked' : ''}> ${isRu ? 'Да (рекомендуется)' : 'Yes (recommended)'}
          </label>
          <label style="display:flex; align-items:center; gap:6px;">
            <input type="radio" name="prn-test" value="no" ${!printTestPage ? 'checked' : ''}> ${isRu ? 'Нет' : 'No'}
          </label>
        `;
        const nameInp = bodyEl.querySelector('#prn-name-input');
        nameInp.addEventListener('input', () => { printerName = nameInp.value.trim() || selectedModel; });
        bodyEl.querySelectorAll('input[name="prn-test"]').forEach(rad => {
          rad.addEventListener('change', () => { printTestPage = rad.value === 'yes'; });
        });
      }
    };

    renderStep();

    backBtn.addEventListener('click', () => {
      if (step > 0) { step--; renderStep(); }
    });

    nextBtn.addEventListener('click', () => {
      if (step < 3) {
        step++;
        renderStep();
      } else {
        if (window.vfs) {
          const prnFolder = window.vfs.resolvePath(['My Computer', 'Printers']);
          if (prnFolder && prnFolder.children) {
            prnFolder.children[printerName] = {
              type: 'app',
              icon: 'printer',
              port: selectedPort,
              model: selectedModel
            };
            window.vfs.save();
          }
        }
        window.winManager.closeWindow('app_add_printer_wiz');
        if (window.appExplorer && window.appExplorer.refreshAll) window.appExplorer.refreshAll();
        if (printTestPage) {
          window.winManager.openDialog({
            title: printerName,
            icon: 'info',
            message: isRu
              ? `Пробная страница отправлена на принтер "${printerName}" (${selectedPort}).\nЕсли страница напечатана правильно, нажмите ОК.`
              : `A test page is now being sent to "${printerName}" on ${selectedPort}.\nDepending on the speed of your printer, it may take a minute or two before the page is printed.`
          });
          if (window.appClippy && typeof window.appClippy.onTestPagePrinted === 'function') {
            setTimeout(() => window.appClippy.onTestPagePrinted(printerName, selectedPort), 800);
          }
        }
      }
    });

    el.querySelector('#prn-wiz-cancel').addEventListener('click', () => window.winManager.closeWindow('app_add_printer_wiz'));
  }

  openPrinterQueue(printerItem) {
    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const prnName = (printerItem && printerItem.name) ? printerItem.name : 'HP LaserJet 4L';
    const winId = 'prn_queue_' + prnName.replace(/[^a-zA-Z0-9]/g, '_');
    if (window.winManager.windows.has(winId)) {
      window.winManager.bringToTop(winId);
      return;
    }

    const jobs = [
      { doc: isRu ? 'Пробная страница Win 98.doc' : 'Win 98 Test Page.doc', status: isRu ? 'Печать' : 'Printing', owner: isRu ? 'Администратор' : 'Administrator', pages: '1/1', size: isRu ? '24 КБ' : '24 KB', started: isRu ? '12:04' : '12:04 PM' }
    ];

    const content = document.createElement('div');
    content.style.cssText = 'display:flex; flex-direction:column; height:100%; background:#c0c0c0; font-family:Tahoma,sans-serif; font-size:11px;';
    content.innerHTML = `
      <div class="win-menubar">
        <div class="win-menu-item" id="prn-menu-print-test">${isRu ? 'Принтер' : 'Printer'}</div>
        <div class="win-menu-item" id="prn-menu-purge">${isRu ? 'Очистить очередь' : 'Purge Print Documents'}</div>
      </div>
      <div class="win-inset" style="flex:1; background:#fff; margin:4px; overflow:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:11px;">
          <thead>
            <tr style="background:#c0c0c0; text-align:left;">
              <th style="border:1px outset #fff; padding:2px 6px;">${isRu ? 'Документ' : 'Document Name'}</th>
              <th style="border:1px outset #fff; padding:2px 6px;">${isRu ? 'Состояние' : 'Status'}</th>
              <th style="border:1px outset #fff; padding:2px 6px;">${isRu ? 'Владелец' : 'Owner'}</th>
              <th style="border:1px outset #fff; padding:2px 6px;">${isRu ? 'Ход выполнения' : 'Progress'}</th>
              <th style="border:1px outset #fff; padding:2px 6px;">${isRu ? 'Начало' : 'Started At'}</th>
            </tr>
          </thead>
          <tbody id="prn-jobs-tbody"></tbody>
        </table>
      </div>
      <div class="win-statusbar" style="padding:2px 6px;" id="prn-queue-status"></div>
    `;

    const win = window.winManager.createWindow({
      id: winId,
      title: prnName,
      icon: 'printer',
      width: 500,
      height: 280,
      content
    });

    const el = win.element;
    const tbody = el.querySelector('#prn-jobs-tbody');
    const statusEl = el.querySelector('#prn-queue-status');

    const renderJobs = () => {
      tbody.innerHTML = jobs.map(j => `
        <tr>
          <td style="padding:3px 6px;">🖨️ ${j.doc}</td>
          <td style="padding:3px 6px;">${j.status}</td>
          <td style="padding:3px 6px;">${j.owner}</td>
          <td style="padding:3px 6px;">${j.pages} (${j.size})</td>
          <td style="padding:3px 6px;">${j.started}</td>
        </tr>
      `).join('');
      statusEl.textContent = isRu ? `Заданий в очереди: ${jobs.length}` : `${jobs.length} job(s) in queue`;
    };
    renderJobs();

    el.querySelector('#prn-menu-print-test').addEventListener('click', () => {
      jobs.push({
        doc: (isRu ? 'Документ_' : 'Document_') + (jobs.length + 1) + '.txt',
        status: isRu ? 'В очереди' : 'Spooling',
        owner: isRu ? 'Администратор' : 'Administrator',
        pages: '1/2',
        size: isRu ? '18 КБ' : '18 KB',
        started: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      renderJobs();
    });

    el.querySelector('#prn-menu-purge').addEventListener('click', () => {
      jobs.length = 0;
      renderJobs();
    });
  }

  openNetworkProperties() {
    if (window.winManager.windows.has('app_netcpl')) {
      window.winManager.bringToTop('app_netcpl');
      return;
    }
    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.style.cssText = 'padding:10px; font-family:Tahoma,sans-serif; font-size:11px; display:flex; flex-direction:column; height:100%; box-sizing:border-box; background:#c0c0c0;';
    content.innerHTML = `
      <div class="win-tabs">
        <div class="win-tab active" data-tab="cfg">${isRu ? 'Конфигурация' : 'Configuration'}</div>
        <div class="win-tab" data-tab="id">${isRu ? 'Идентификация' : 'Identification'}</div>
        <div class="win-tab" data-tab="acc">${isRu ? 'Управление доступом' : 'Access Control'}</div>
      </div>
      <div class="win-tab-panel" style="flex:1; padding:12px;">
        <div id="net-tab-cfg">
          <div style="margin-bottom:4px;">${isRu ? 'Установлены следующие сетевые компоненты:' : 'The following network components are installed:'}</div>
          <div class="win-inset" style="background:#fff; height:115px; overflow-y:auto; padding:3px; margin-bottom:6px;" id="net-comp-list">
            <div class="net-comp-item" style="padding:2px 4px; cursor:pointer;">🖥️ ${isRu ? 'Клиент для сетей Microslop' : 'Client for Microslop Networks'}</div>
            <div class="net-comp-item" style="padding:2px 4px; cursor:pointer;">🔌 ${isRu ? 'Контроллер удаленного доступа' : 'Dial-Up Adapter'}</div>
            <div class="net-comp-item" style="padding:2px 4px; cursor:pointer;">🔌 ${isRu ? 'NE2000-совместимый адаптер Ethernet' : 'NE2000 Compatible Ethernet Adapter'}</div>
            <div class="net-comp-item active" style="padding:2px 4px; cursor:pointer; background:#000080; color:#fff;">🌐 TCP/IP -&gt; ${isRu ? 'NE2000-совместимый адаптер Ethernet' : 'NE2000 Compatible Ethernet Adapter'}</div>
            <div class="net-comp-item" style="padding:2px 4px; cursor:pointer;">📂 ${isRu ? 'Служба доступа к файлам и принтерам сетей Microslop' : 'File and printer sharing for Microslop Networks'}</div>
          </div>
          <div style="display:flex; gap:6px; margin-bottom:10px;">
            <button class="win-btn" style="flex:1;">${isRu ? 'Добавить...' : 'Add...'}</button>
            <button class="win-btn" style="flex:1;">${isRu ? 'Удалить' : 'Remove'}</button>
            <button class="win-btn" id="net-tcpip-props-btn" style="flex:1;">${isRu ? 'Свойства' : 'Properties'}</button>
          </div>
          <div style="margin-bottom:4px;">${isRu ? 'Первичный вход в сеть:' : 'Primary Network Logon:'}</div>
          <select class="win-select" style="width:100%; height:21px; margin-bottom:10px;">
            <option>${isRu ? 'Клиент для сетей Microslop' : 'Client for Microslop Networks'}</option>
            <option>${isRu ? 'Обычный вход в Win' : 'Win Logon'}</option>
          </select>
          <fieldset style="border:1px groove #fff; padding:6px;">
            <legend>${isRu ? 'Описание' : 'Description'}</legend>
            <div>${isRu ? 'TCP/IP — это протокол, используемый для подключения к Интернету и глобальным сетям.' : 'TCP/IP is the protocol you use to connect to the Internet and wide-area networks.'}</div>
          </fieldset>
        </div>

        <div id="net-tab-id" style="display:none;">
          <div style="margin-bottom:10px;">${isRu ? 'Win использует следующие сведения для идентификации компьютера в сети.' : 'Win uses the following information to identify your computer on the network.'}</div>
          <div style="margin-bottom:8px;">
            <div>${isRu ? 'Имя компьютера:' : 'Computer name:'}</div>
            <input type="text" id="net-comp-name" class="win-inset" value="${localStorage.getItem('win98_net_compname') || 'ADMIN-PC'}" style="width:100%; box-sizing:border-box; height:21px; margin-top:3px; padding:2px 4px;">
          </div>
          <div style="margin-bottom:8px;">
            <div>${isRu ? 'Рабочая группа:' : 'Workgroup:'}</div>
            <input type="text" id="net-workgroup" class="win-inset" value="${localStorage.getItem('win98_net_workgroup') || 'WORKGROUP'}" style="width:100%; box-sizing:border-box; height:21px; margin-top:3px; padding:2px 4px;">
          </div>
          <div>
            <div>${isRu ? 'Описание компьютера:' : 'Computer Description:'}</div>
            <input type="text" class="win-inset" value="${isRu ? 'Рабочая станция Microslop Win 98 SE' : 'Microslop Win 98 SE Workstation'}" style="width:100%; box-sizing:border-box; height:21px; margin-top:3px; padding:2px 4px;">
          </div>
        </div>

        <div id="net-tab-acc" style="display:none;">
          <fieldset style="border:1px groove #fff; padding:8px;">
            <legend>${isRu ? 'Управление доступом' : 'Access Control'}</legend>
            <label style="display:flex; align-items:flex-start; gap:6px; margin-bottom:10px;">
              <input type="radio" name="net-acc" checked>
              <span><b>${isRu ? 'На уровне ресурсов' : 'Share-level access control'}</b><br>${isRu ? 'Можно назначить пароль для каждого общего ресурса.' : 'You can assign a password to each shared resource.'}</span>
            </label>
            <label style="display:flex; align-items:flex-start; gap:6px;">
              <input type="radio" name="net-acc">
              <span><b>${isRu ? 'На уровне пользователей' : 'User-level access control'}</b><br>${isRu ? 'Укажите список пользователей, имеющих доступ к ресурсу.' : 'Specify users and groups who have access to each shared resource.'}</span>
            </label>
          </fieldset>
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:8px;">
        <button class="win-btn default" id="net-ok-btn" style="min-width:75px;">OK</button>
        <button class="win-btn" id="net-cancel-btn" style="min-width:75px;">${isRu ? 'Отмена' : 'Cancel'}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_netcpl',
      title: isRu ? 'Сеть' : 'Network',
      icon: 'network-cpl',
      width: 400,
      height: 430,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = win.element;
    el.querySelectorAll('.win-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.win-tab').forEach(t => t.classList.toggle('active', t === tab));
        el.querySelector('#net-tab-cfg').style.display = tab.dataset.tab === 'cfg' ? 'block' : 'none';
        el.querySelector('#net-tab-id').style.display = tab.dataset.tab === 'id' ? 'block' : 'none';
        el.querySelector('#net-tab-acc').style.display = tab.dataset.tab === 'acc' ? 'block' : 'none';
      });
    });

    el.querySelectorAll('.net-comp-item').forEach(item => {
      item.addEventListener('click', () => {
        el.querySelectorAll('.net-comp-item').forEach(i => {
          i.style.background = 'transparent';
          i.style.color = '#000';
        });
        item.style.background = '#000080';
        item.style.color = '#fff';
      });
    });

    el.querySelector('#net-tcpip-props-btn').addEventListener('click', () => {
      if (window.winManager.windows.has('app_tcpip_props')) {
        window.winManager.bringToTop('app_tcpip_props');
        return;
      }
      const tcpEl = document.createElement('div');
      tcpEl.style.cssText = 'padding:10px; font-family:Tahoma,sans-serif; font-size:11px; background:#c0c0c0;';
      tcpEl.innerHTML = `
        <div class="win-tabs"><div class="win-tab active">${isRu ? 'IP-адрес' : 'IP Address'}</div></div>
        <div class="win-tab-panel" style="padding:12px;">
          <label style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
            <input type="radio" name="tcp-mode"> ${isRu ? 'Получить IP-адрес автоматически' : 'Obtain an IP address automatically'}
          </label>
          <label style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
            <input type="radio" name="tcp-mode" checked> ${isRu ? 'Указать IP-адрес явным образом:' : 'Specify an IP address:'}
          </label>
          <div style="padding-left:18px; display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span>${isRu ? 'IP-адрес:' : 'IP Address:'}</span>
              <input type="text" class="win-inset" value="192 . 168 . 1 . 98" style="width:140px; text-align:center; height:20px;">
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span>${isRu ? 'Маска подсети:' : 'Subnet Mask:'}</span>
              <input type="text" class="win-inset" value="255 . 255 . 255 . 0" style="width:140px; text-align:center; height:20px;">
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span>${isRu ? 'Основной шлюз:' : 'Default Gateway:'}</span>
              <input type="text" class="win-inset" value="192 . 168 . 1 . 1" style="width:140px; text-align:center; height:20px;">
            </div>
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:8px;">
          <button class="win-btn default" id="tcp-ok" style="min-width:70px;">OK</button>
        </div>
      `;
      const tcpWin = window.winManager.createWindow({
        id: 'app_tcpip_props',
        title: isRu ? 'Свойства: TCP/IP' : 'TCP/IP Properties',
        icon: 'network-cpl',
        width: 340,
        height: 260,
        resizable: false,
        minimizable: false,
        maximizable: false,
        isDialog: true,
        content: tcpEl
      });
      tcpWin.element.querySelector('#tcp-ok').addEventListener('click', () => window.winManager.closeWindow('app_tcpip_props'));
    });

    el.querySelector('#net-ok-btn').addEventListener('click', () => {
      localStorage.setItem('win98_net_compname', el.querySelector('#net-comp-name').value.trim() || 'ADMIN-PC');
      localStorage.setItem('win98_net_workgroup', el.querySelector('#net-workgroup').value.trim() || 'WORKGROUP');
      window.winManager.closeWindow('app_netcpl');
    });
    el.querySelector('#net-cancel-btn').addEventListener('click', () => window.winManager.closeWindow('app_netcpl'));
  }

  openAccessibilityProperties() {
    if (window.winManager.windows.has('app_access_cpl')) {
      window.winManager.bringToTop('app_access_cpl');
      return;
    }
    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const isHighContrast = document.body.classList.contains('win98-high-contrast');

    const content = document.createElement('div');
    content.style.cssText = 'padding:10px; font-family:Tahoma,sans-serif; font-size:11px; display:flex; flex-direction:column; height:100%; box-sizing:border-box; background:#c0c0c0;';
    content.innerHTML = `
      <div class="win-tabs">
        <div class="win-tab active" data-tab="kb">${isRu ? 'Клавиатура' : 'Keyboard'}</div>
        <div class="win-tab" data-tab="snd">${isRu ? 'Звук' : 'Sound'}</div>
        <div class="win-tab" data-tab="dsp">${isRu ? 'Экран' : 'Display'}</div>
        <div class="win-tab" data-tab="mse">${isRu ? 'Мышь' : 'Mouse'}</div>
      </div>
      <div class="win-tab-panel" style="flex:1; padding:12px;">
        <div id="acc-tab-kb">
          <fieldset style="border:1px groove #fff; padding:8px; margin-bottom:8px;">
            <legend>${isRu ? 'Залипание клавиш' : 'StickyKeys'}</legend>
            <div style="margin-bottom:6px;">${isRu ? 'Ввод сочетаний с клавишами SHIFT, CTRL или ALT путем последовательного нажатия клавиш.' : 'Use StickyKeys if you want to use SHIFT, CTRL, or ALT key by pressing one key at a time.'}</div>
            <label style="display:flex; align-items:center; gap:6px;">
              <input type="checkbox" id="acc-sticky"> ${isRu ? 'Залипание клавиш' : 'Use StickyKeys'}
            </label>
          </fieldset>
          <fieldset style="border:1px groove #fff; padding:8px; margin-bottom:8px;">
            <legend>${isRu ? 'Фильтрация ввода' : 'FilterKeys'}</legend>
            <div style="margin-bottom:6px;">${isRu ? 'Игнорирование случайных кратковременных или повторяющихся нажатий клавиш.' : 'Use FilterKeys if you want Win to ignore brief or repeated keystrokes.'}</div>
            <label style="display:flex; align-items:center; gap:6px;">
              <input type="checkbox"> ${isRu ? 'Фильтрация ввода' : 'Use FilterKeys'}
            </label>
          </fieldset>
          <fieldset style="border:1px groove #fff; padding:8px;">
            <legend>${isRu ? 'Озвучивание переключения' : 'ToggleKeys'}</legend>
            <label style="display:flex; align-items:center; gap:6px;">
              <input type="checkbox"> ${isRu ? 'Озвучивание переключения режимов (CAPS LOCK, NUM LOCK, SCROLL LOCK)' : 'Use ToggleKeys (hear tones when pressing CAPS LOCK, NUM LOCK, and SCROLL LOCK)'}
            </label>
          </fieldset>
        </div>

        <div id="acc-tab-snd" style="display:none;">
          <fieldset style="border:1px groove #fff; padding:8px; margin-bottom:10px;">
            <legend>${isRu ? 'Визуальное оповещение' : 'SoundSentry'}</legend>
            <div style="margin-bottom:6px;">${isRu ? 'Визуальные предупреждения при подаче звукового сигнала системой.' : 'Use SoundSentry if you want Win to generate visual warnings when your system makes a sound.'}</div>
            <label style="display:flex; align-items:center; gap:6px;">
              <input type="checkbox"> ${isRu ? 'Визуальное оповещение' : 'Use SoundSentry'}
            </label>
          </fieldset>
          <fieldset style="border:1px groove #fff; padding:8px;">
            <legend>${isRu ? 'Субтитры' : 'ShowSounds'}</legend>
            <label style="display:flex; align-items:center; gap:6px;">
              <input type="checkbox"> ${isRu ? 'Субтитры для звуков и речи в программах' : 'Use ShowSounds (tell programs to display captions for speech and sounds)'}
            </label>
          </fieldset>
        </div>

        <div id="acc-tab-dsp" style="display:none;">
          <fieldset style="border:1px groove #fff; padding:8px;">
            <legend>${isRu ? 'Высокая контрастность' : 'High Contrast'}</legend>
            <div style="margin-bottom:8px;">${isRu ? 'Использование в Win цветов и шрифтов, облегчающих чтение с экрана.' : 'Use this option if you want Win to use colors and fonts designed for easy reading.'}</div>
            <label style="display:flex; align-items:center; gap:6px;">
              <input type="checkbox" id="acc-high-contrast" ${isHighContrast ? 'checked' : ''}> ${isRu ? 'Высокая контрастность' : 'Use High Contrast'}
            </label>
          </fieldset>
        </div>

        <div id="acc-tab-mse" style="display:none;">
          <fieldset style="border:1px groove #fff; padding:8px;">
            <legend>${isRu ? 'Управление указателем с клавиатуры' : 'MouseKeys'}</legend>
            <div style="margin-bottom:8px;">${isRu ? 'Управление указателем мыши с помощью цифровой панели клавиатуры.' : 'Use MouseKeys if you want to control the pointer with the numeric keypad on your keyboard.'}</div>
            <label style="display:flex; align-items:center; gap:6px;">
              <input type="checkbox"> ${isRu ? 'Управление указателем с клавиатуры' : 'Use MouseKeys'}
            </label>
          </fieldset>
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:8px;">
        <button class="win-btn default" id="acc-ok-btn" style="min-width:75px;">OK</button>
        <button class="win-btn" id="acc-cancel-btn" style="min-width:75px;">${isRu ? 'Отмена' : 'Cancel'}</button>
        <button class="win-btn" id="acc-apply-btn" style="min-width:75px;">${isRu ? 'Применить' : 'Apply'}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_access_cpl',
      title: isRu ? 'Специальные возможности' : 'Accessibility Properties',
      icon: 'accessibility',
      width: 390,
      height: 390,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = win.element;
    el.querySelectorAll('.win-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.win-tab').forEach(t => t.classList.toggle('active', t === tab));
        ['kb', 'snd', 'dsp', 'mse'].forEach(k => {
          el.querySelector('#acc-tab-' + k).style.display = tab.dataset.tab === k ? 'block' : 'none';
        });
      });
    });

    const applyAcc = () => {
      const hc = el.querySelector('#acc-high-contrast').checked;
      document.body.classList.toggle('win98-high-contrast', hc);
      if (!document.getElementById('win98-hc-style')) {
        const st = document.createElement('style');
        st.id = 'win98-hc-style';
        st.textContent = `
          body.win98-high-contrast .win-window,
          body.win98-high-contrast #taskbar,
          body.win98-high-contrast .win-tab-panel,
          body.win98-high-contrast .win-btn {
            background: #000 !important;
            color: #ffff00 !important;
            border-color: #fff !important;
          }
          body.win98-high-contrast .win-titlebar.active {
            background: #00ffff !important;
            color: #000 !important;
          }
        `;
        document.head.appendChild(st);
      }
    };

    el.querySelector('#acc-apply-btn').addEventListener('click', applyAcc);
    el.querySelector('#acc-ok-btn').addEventListener('click', () => {
      applyAcc();
      window.winManager.closeWindow('app_access_cpl');
    });
    el.querySelector('#acc-cancel-btn').addEventListener('click', () => window.winManager.closeWindow('app_access_cpl'));
  }

  openStickyKeysPrompt() {
    if (window.winManager.windows.has('app_stickykeys_prompt')) {
      window.winManager.bringToTop('app_stickykeys_prompt');
      return;
    }
    if (window.soundSys && window.soundSys.playNotification) window.soundSys.playNotification();
    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.style.cssText = 'padding:12px; font-family:Tahoma,sans-serif; font-size:11px; background:#c0c0c0; display:flex; flex-direction:column; gap:10px;';
    content.innerHTML = `
      <div>${isRu
        ? 'Нажатием клавиши SHIFT пять раз был включен режим залипания клавиш. В этом режиме можно вводить сочетания с клавишами SHIFT, CTRL или ALT путем их последовательного нажатия.'
        : 'By pressing the SHIFT key five times you have turned on StickyKeys. With StickyKeys on, you can lock down the CTRL, ALT, or SHIFT keys. This is useful if you are unable to hold down more than one key at a time.'}</div>
      <div>${isRu ? 'Нажмите кнопку OK, чтобы оставить залипание клавиш включенным, или кнопку "Отмена", чтобы отключить его.' : 'Click OK to leave StickyKeys on, or click Cancel to turn StickyKeys off.'}</div>
      <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:4px;">
        <button class="win-btn default" id="sk-ok" style="min-width:75px;">OK</button>
        <button class="win-btn" id="sk-cancel" style="min-width:75px;">${isRu ? 'Отмена' : 'Cancel'}</button>
        <button class="win-btn" id="sk-settings" style="min-width:85px;">${isRu ? 'Настройка...' : 'Settings...'}</button>
      </div>
    `;
    const win = window.winManager.createWindow({
      id: 'app_stickykeys_prompt',
      title: isRu ? 'Залипание клавиш' : 'StickyKeys',
      icon: 'accessibility',
      width: 380,
      height: 195,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });
    const el = win.element;
    el.querySelector('#sk-ok').addEventListener('click', () => window.winManager.closeWindow('app_stickykeys_prompt'));
    el.querySelector('#sk-cancel').addEventListener('click', () => window.winManager.closeWindow('app_stickykeys_prompt'));
    el.querySelector('#sk-settings').addEventListener('click', () => {
      window.winManager.closeWindow('app_stickykeys_prompt');
      this.openAccessibilityProperties();
    });
  }

  openJoystickProperties() {
    if (window.winManager.windows.has('app_joy_cpl')) {
      window.winManager.bringToTop('app_joy_cpl');
      return;
    }
    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.style.cssText = 'padding:10px; font-family:Tahoma,sans-serif; font-size:11px; display:flex; flex-direction:column; height:100%; box-sizing:border-box; background:#c0c0c0;';
    content.innerHTML = `
      <div class="win-tabs">
        <div class="win-tab active">${isRu ? 'Общие' : 'General'}</div>
      </div>
      <div class="win-tab-panel" style="flex:1; padding:12px; display:flex; flex-direction:column; gap:10px;">
        <fieldset style="border:1px groove #fff; padding:8px;">
          <legend>${isRu ? 'Игровые устройства' : 'Game Controllers'}</legend>
          <div class="win-inset" style="background:#fff; height:80px; padding:4px;">
            <div style="display:flex; justify-content:space-between; font-weight:bold; border-bottom:1px solid #c0c0c0; padding-bottom:2px; margin-bottom:4px;">
              <span>${isRu ? 'Устройство' : 'Controller'}</span>
              <span>${isRu ? 'Состояние' : 'Status'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:2px 4px; background:#000080; color:#fff;">
              <span>1: Microslop SideWinder 3D Pro</span>
              <span>OK</span>
            </div>
          </div>
        </fieldset>

        <fieldset style="border:1px groove #fff; padding:8px; flex:1;">
          <legend>${isRu ? 'Проверка (перетащите крестик мышью)' : 'Test (drag crosshair with mouse)'}</legend>
          <div style="display:flex; gap:16px; align-items:center;">
            <div id="joy-pad" class="win-inset" style="width:110px; height:110px; background:#fff; position:relative; cursor:crosshair;">
              <div style="position:absolute; left:50%; top:0; bottom:0; width:1px; background:#ccc;"></div>
              <div style="position:absolute; top:50%; left:0; right:0; height:1px; background:#ccc;"></div>
              <div id="joy-cross" style="position:absolute; left:49px; top:49px; width:12px; height:12px; color:#ff0000; font-weight:bold; line-height:12px; text-align:center; user-select:none;">+</div>
            </div>
            <div style="flex:1;">
              <div style="margin-bottom:6px;">${isRu ? 'Кнопки:' : 'Buttons:'}</div>
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                ${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `
                  <div class="joy-btn-lamp" data-btn="${n}" style="width:22px; height:22px; border-radius:50%; background:#800000; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold; cursor:pointer; border:1px inset #fff; user-select:none;">${n}</div>
                `).join('')}
              </div>
              <div style="margin-top:8px;" id="joy-coords-label">X: 128  Y: 128</div>
            </div>
          </div>
        </fieldset>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:8px;">
        <button class="win-btn default" id="joy-ok-btn" style="min-width:75px;">OK</button>
        <button class="win-btn" id="joy-cancel-btn" style="min-width:75px;">${isRu ? 'Отмена' : 'Cancel'}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_joy_cpl',
      title: isRu ? 'Игровые устройства' : 'Game Controllers',
      icon: 'joystick',
      width: 390,
      height: 380,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = win.element;
    const pad = el.querySelector('#joy-pad');
    const cross = el.querySelector('#joy-cross');
    const coords = el.querySelector('#joy-coords-label');
    let dragging = false;

    const updateCross = (e) => {
      const rect = pad.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, e.clientX - rect.left - 5));
      const y = Math.max(0, Math.min(100, e.clientY - rect.top - 5));
      cross.style.left = x + 'px';
      cross.style.top = y + 'px';
      coords.textContent = `X: ${Math.round(x * 2.55)}  Y: ${Math.round(y * 2.55)}`;
    };

    pad.addEventListener('mousedown', (e) => { dragging = true; updateCross(e); });
    window.addEventListener('mousemove', (e) => { if (dragging) updateCross(e); });
    window.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        cross.style.left = '49px';
        cross.style.top = '49px';
        coords.textContent = 'X: 128  Y: 128';
      }
    });

    el.querySelectorAll('.joy-btn-lamp').forEach(lamp => {
      lamp.addEventListener('mousedown', () => { lamp.style.background = '#ff2222'; lamp.style.boxShadow = '0 0 6px #ff0000'; });
      lamp.addEventListener('mouseup', () => { lamp.style.background = '#800000'; lamp.style.boxShadow = 'none'; });
      lamp.addEventListener('mouseleave', () => { lamp.style.background = '#800000'; lamp.style.boxShadow = 'none'; });
    });

    el.querySelector('#joy-ok-btn').addEventListener('click', () => window.winManager.closeWindow('app_joy_cpl'));
    el.querySelector('#joy-cancel-btn').addEventListener('click', () => window.winManager.closeWindow('app_joy_cpl'));
  }

  openModemProperties() {
    if (window.winManager.windows.has('app_modem_cpl')) {
      window.winManager.bringToTop('app_modem_cpl');
      return;
    }
    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.style.cssText = 'padding:10px; font-family:Tahoma,sans-serif; font-size:11px; display:flex; flex-direction:column; height:100%; box-sizing:border-box; background:#c0c0c0;';
    content.innerHTML = `
      <div class="win-tabs">
        <div class="win-tab active" data-tab="gen">${isRu ? 'Общие' : 'General'}</div>
        <div class="win-tab" data-tab="diag">${isRu ? 'Диагностика' : 'Diagnostics'}</div>
      </div>
      <div class="win-tab-panel" style="flex:1; padding:12px;">
        <div id="mdm-tab-gen">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
            <div style="width:32px; height:32px;">${Icons['modem'] || ''}</div>
            <div>${isRu ? 'На этом компьютере установлены следующие модемы:' : 'The following modems are set up on this computer:'}</div>
          </div>
          <div class="win-inset" style="background:#fff; height:110px; padding:4px; margin-bottom:8px;">
            <div style="padding:3px 4px; background:#000080; color:#fff;">📠 Sportster 56K Faxmodem PnP (COM2)</div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="win-btn">${isRu ? 'Добавить...' : 'Add...'}</button>
            <button class="win-btn">${isRu ? 'Удалить' : 'Remove'}</button>
            <button class="win-btn" id="mdm-dial-props">${isRu ? 'Параметры набора номера' : 'Dialing Properties'}</button>
          </div>
        </div>

        <div id="mdm-tab-diag" style="display:none;">
          <div style="margin-bottom:6px;">${isRu ? 'Выберите порт и нажмите кнопку "Дополнительно" для опроса модема:' : 'Select a port and click More Info to query the modem:'}</div>
          <div class="win-inset" style="background:#fff; height:95px; padding:4px; margin-bottom:8px;">
            <div style="padding:2px 4px;">COM1 — ${isRu ? 'Модем не установлен' : 'No modem installed'}</div>
            <div style="padding:2px 4px; background:#000080; color:#fff;">COM2 — Sportster 56K Faxmodem PnP</div>
          </div>
          <button class="win-btn" id="mdm-more-info-btn">${isRu ? 'Дополнительно...' : 'More Info...'}</button>
          <div id="mdm-ati-box" class="win-inset" style="background:#fff; height:85px; margin-top:8px; padding:4px; font-family:monospace; font-size:10px; overflow-y:auto; display:none;"></div>
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:8px;">
        <button class="win-btn default" id="mdm-ok-btn" style="min-width:75px;">OK</button>
        <button class="win-btn" id="mdm-cancel-btn" style="min-width:75px;">${isRu ? 'Отмена' : 'Cancel'}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_modem_cpl',
      title: isRu ? 'Свойства: Модемы' : 'Modems Properties',
      icon: 'modem',
      width: 390,
      height: 360,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = win.element;
    el.querySelectorAll('.win-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.win-tab').forEach(t => t.classList.toggle('active', t === tab));
        el.querySelector('#mdm-tab-gen').style.display = tab.dataset.tab === 'gen' ? 'block' : 'none';
        el.querySelector('#mdm-tab-diag').style.display = tab.dataset.tab === 'diag' ? 'block' : 'none';
      });
    });

    el.querySelector('#mdm-more-info-btn').addEventListener('click', () => {
      const box = el.querySelector('#mdm-ati-box');
      box.style.display = 'block';
      box.innerHTML = `
        ${isRu ? 'Порт: COM2, прерывание: 3, адрес: 2F8, UART: NS 16550AN' : 'Port: COM2, Interrupt: 3, Address: 2F8, UART: NS 16550AN'}<br>
        ATI0 -> 5601 OK<br>
        ATI1 -> F7A9 OK<br>
        ATI3 -> U.S. Robotics 56K Voice INT V4.9.1<br>
        ATI4 -> U.S. Robotics 56K Faxmodem Settings...<br>
        ATI7 -> Configuration Profile... V.90 / x2 56000 bps OK
      `;
    });

    el.querySelector('#mdm-ok-btn').addEventListener('click', () => window.winManager.closeWindow('app_modem_cpl'));
    el.querySelector('#mdm-cancel-btn').addEventListener('click', () => window.winManager.closeWindow('app_modem_cpl'));
  }

  openPasswordsProperties() {
    if (window.winManager.windows.has('app_pass_cpl')) {
      window.winManager.bringToTop('app_pass_cpl');
      return;
    }
    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const content = document.createElement('div');
    content.style.cssText = 'padding:10px; font-family:Tahoma,sans-serif; font-size:11px; display:flex; flex-direction:column; height:100%; box-sizing:border-box; background:#c0c0c0;';
    content.innerHTML = `
      <div class="win-tabs">
        <div class="win-tab active" data-tab="chg">${isRu ? 'Смена паролей' : 'Change Passwords'}</div>
        <div class="win-tab" data-tab="prof">${isRu ? 'Профили пользователей' : 'User Profiles'}</div>
      </div>
      <div class="win-tab-panel" style="flex:1; padding:12px;">
        <div id="pass-tab-chg">
          <fieldset style="border:1px groove #fff; padding:10px;">
            <legend>${isRu ? 'Изменение пароля Win' : 'Change Win Password'}</legend>
            <div style="margin-bottom:8px;">${isRu ? 'Этот пароль защищает доступ к вашей учетной записи в Win 98.' : 'Click this button to change your Win password.'}</div>
            <button class="win-btn" id="btn-change-win-pw">${isRu ? 'Сменить пароль Win...' : 'Change Win Password...'}</button>
          </fieldset>
        </div>
        <div id="pass-tab-prof" style="display:none;">
          <label style="display:flex; align-items:flex-start; gap:6px; margin-bottom:10px;">
            <input type="radio" name="prof-mode" checked>
            <span>${isRu ? 'Все пользователи этого компьютера используют общие параметры и рабочий стол.' : 'All users of this computer use the same preferences and desktop settings.'}</span>
          </label>
          <label style="display:flex; align-items:flex-start; gap:6px;">
            <input type="radio" name="prof-mode">
            <span>${isRu ? 'Пользователи могут задавать собственные параметры и настройки рабочего стола.' : 'Users can customize their preferences and desktop settings. Win switches to your personal settings when you log in.'}</span>
          </label>
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:8px;">
        <button class="win-btn default" id="pass-ok-btn" style="min-width:75px;">OK</button>
        <button class="win-btn" id="pass-cancel-btn" style="min-width:75px;">${isRu ? 'Отмена' : 'Cancel'}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_pass_cpl',
      title: isRu ? 'Свойства: Пароли' : 'Passwords Properties',
      icon: 'passwords',
      width: 380,
      height: 290,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = win.element;
    el.querySelectorAll('.win-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.win-tab').forEach(t => t.classList.toggle('active', t === tab));
        el.querySelector('#pass-tab-chg').style.display = tab.dataset.tab === 'chg' ? 'block' : 'none';
        el.querySelector('#pass-tab-prof').style.display = tab.dataset.tab === 'prof' ? 'block' : 'none';
      });
    });

    el.querySelector('#btn-change-win-pw').addEventListener('click', () => {
      window.winManager.openDialog({
        title: isRu ? 'Смена пароля Win' : 'Change Win Password',
        icon: 'info',
        message: isRu ? 'Пароль Win для пользователя Администратор успешно изменен.' : 'Your Win password for Administrator has been successfully changed.'
      });
    });

    el.querySelector('#pass-ok-btn').addEventListener('click', () => window.winManager.closeWindow('app_pass_cpl'));
    el.querySelector('#pass-cancel-btn').addEventListener('click', () => window.winManager.closeWindow('app_pass_cpl'));
  }

  openUsersProperties() {
    if (window.winManager.windows.has('app_users_cpl')) {
      window.winManager.bringToTop('app_users_cpl');
      return;
    }
    const isRu = typeof i18n !== 'undefined' && i18n.getLanguage() === 'ru';
    const users = isRu ? ['Администратор', 'Гость'] : ['Administrator', 'Guest'];

    const content = document.createElement('div');
    content.style.cssText = 'padding:10px; font-family:Tahoma,sans-serif; font-size:11px; display:flex; flex-direction:column; height:100%; box-sizing:border-box; background:#c0c0c0;';
    content.innerHTML = `
      <div class="win-tabs">
        <div class="win-tab active">${isRu ? 'Список пользователей' : 'User List'}</div>
      </div>
      <div class="win-tab-panel" style="flex:1; padding:12px; display:flex; flex-direction:column; gap:8px;">
        <div>${isRu ? 'На этом компьютере созданы следующие учетные записи:' : 'The following users are set up to use this computer:'}</div>
        <div id="users-list-box" class="win-inset" style="background:#fff; flex:1; padding:4px;"></div>
        <div style="display:flex; gap:6px;">
          <button class="win-btn" id="usr-new-btn">${isRu ? 'Создать...' : 'New User...'}</button>
          <button class="win-btn" id="usr-pw-btn">${isRu ? 'Задать пароль...' : 'Set Password...'}</button>
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:8px;">
        <button class="win-btn default" id="usr-close-btn" style="min-width:75px;">${isRu ? 'Закрыть' : 'Close'}</button>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: 'app_users_cpl',
      title: isRu ? 'Свойства: Пользователи' : 'User Settings',
      icon: 'users',
      width: 360,
      height: 290,
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content
    });

    const el = win.element;
    const listBox = el.querySelector('#users-list-box');
    const renderUsers = () => {
      listBox.innerHTML = users.map((u, idx) => `
        <div style="padding:3px 6px; background:${idx === 0 ? '#000080' : 'transparent'}; color:${idx === 0 ? '#fff' : '#000'};">👤 ${u}</div>
      `).join('');
    };
    renderUsers();

    el.querySelector('#usr-new-btn').addEventListener('click', () => {
      const name = (isRu ? 'Пользователь' : 'User') + (users.length + 1);
      users.push(name);
      renderUsers();
    });
    el.querySelector('#usr-pw-btn').addEventListener('click', () => this.openPasswordsProperties());
    el.querySelector('#usr-close-btn').addEventListener('click', () => window.winManager.closeWindow('app_users_cpl'));
  }
}

window.appCPanel = new AppCPanel();


