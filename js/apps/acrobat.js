class AppAcrobat {
  constructor() {
    this.windowId = 'win-acrobat';
    this.currentDocKey = 'BC3000AD_MANUAL.PDF';
    this.currentPage = 0;
    this.sidebarMode = 'bookmarks';
    this.zoom = 100;
    this.searchQuery = '';

    this.documents = {
      'BC3000AD_MANUAL.PDF': {
        filename: 'BC3000AD_MANUAL.PDF',
        title: 'Battlecruiser 3000AD v2.0 — Flight & Tactical Command Manual',
        author: 'Derek Smart / 3000AD Inc. (Igromania CD №9 Edition)',
        pages: [
          {
            bookmark: '1. Обзор крейсера класса GALAXY (TCV)',
            heading: 'ГЛАВА 1: ТАКТИЧЕСКИЙ КОМАНДНЫЙ КРЕЙСЕР GALAXY',
            subhead: 'DOCUMENT ID: 3000AD-GALCOM-1998 | REV 2.09',
            bodyHtml: `
              <p>Добро пожаловать на борт боевого крейсера класса <strong>Supreme</strong> Галактического Командования (GALCOM). Настоящее руководство в формате Adobe PDF поставляется на компакт-диске журнала «Игромания» №9 (1998) вместе с патчем <em>Battlecruiser 3000AD v2.09</em> для <strong>Microslop Win 98</strong>.</p>
              <div class="acrobat-diagram-box">
                <strong>[СХЕМА ПАЛУБ КРЕЙСЕРА TCV-GALAXY]</strong><br/>
                +-------------------------------------------------------+<br/>
                | [BRIDGE / TACTICAL C&amp;C]  ===&gt;  [QUANTUM DRIVE CORE]   |<br/>
                |       ||                              ||              |<br/>
                | [SHUTTLE BAY: 4x INTERCEPTORS] [SHIELD GEN: 1200 GW]  |<br/>
                +-------------------------------------------------------+
              </div>
              <p>Крейсер оснащен четырьмя палубными перехватчиками, двумя планетарными вездеходами ATV и квантовым гипердвигателем для межзвездных прыжков между 120 звездными системами.</p>
              <table class="acrobat-spec-table">
                <tr><th>Система</th><th>Номинал</th><th>Горячая клавиша</th></tr>
                <tr><td>Навигационный радар</td><td>Дальность 450 а.е.</td><td><strong>F1 / N</strong></td></tr>
                <tr><td>Квантовый прыжок (Jump)</td><td>Заряд 18 секунд</td><td><strong>Shift + J</strong></td></tr>
                <tr><td>Тактический экран C&amp;C</td><td>Управление экипажем</td><td><strong>F4 / TAB</strong></td></tr>
              </table>
            `
          },
          {
            bookmark: '2. Навигация и квантовый гиперпрыжок',
            heading: 'ГЛАВА 2: ПРОТОКОЛЫ НАВИГАЦИИ И ПЕРЕХВАТА',
            subhead: 'SECTION 2.4 — QUANTUM VORTEX & WAYPOINT LOGISTICS',
            bodyHtml: `
              <p>Перед активацией вихревого генератора убедитесь, что энергетический баланс реактора перераспределен в пользу двигателей (<strong>ENG &gt;= 45%</strong>). При перегрузке щитов во время боя с флотом Gammulan прыжок блокируется автоматикой безопасности.</p>
              <div class="acrobat-diagram-box">
                <strong>[РАСПРЕДЕЛЕНИЕ ЭНЕРГИИ РЕАКТОРА]</strong><br/>
                WEAPONS (Оружие)  : [##########......] 62%<br/>
                SHIELDS (Щиты)    : [########........] 50%<br/>
                ENGINES (Тяга)    : [############....] 75%
              </div>
              <p>Для выпуска звена перехватчиков откройте консоль ангара (клавиша <strong>L</strong>), выберите пилотов со статусом <em>Ready</em> и назначьте цель через радар наведения.</p>
            `
          },
          {
            bookmark: '3. Установка патча v2.09 под Microslop Win 98',
            heading: 'ГЛАВА 3: НАСТРОЙКА DIRECT3D И УСТАНОВКА С CD',
            subhead: 'APPENDIX A — IGROMANIA CD-ROM TECHNICAL NOTES',
            bodyHtml: `
              <p>Версия 2.09 включает нативную поддержку DirectX 5.2 и аппаратного ускорения под <strong>Microslop Win 98 SE</strong>. Минимальные системные требования:</p>
              <table class="acrobat-spec-table">
                <tr><th>Компонент</th><th>Минимум</th><th>Рекомендуется</th></tr>
                <tr><td>Процессор</td><td>Pentium 133 MHz</td><td>Pentium II 300 MHz</td></tr>
                <tr><td>ОЗУ</td><td>32 MB RAM</td><td>64 MB SDRAM</td></tr>
                <tr><td>Видеокарта</td><td>SVGA 2 MB DirectDraw</td><td>3Dfx Voodoo2 12 MB</td></tr>
              </table>
              <p>Если во время гиперпрыжка наблюдается просадка частоты кадров, отключите полноэкранное сглаживание облаков туманности в файле <code>BC3K.CFG</code>.</p>
            `
          }
        ]
      },
      'VOODOO2_SPEC.PDF': {
        filename: 'VOODOO2_SPEC.PDF',
        title: '3Dfx Voodoo² 1000 PCI — SLI Architecture & Glide 2.5x Reference',
        author: '3Dfx Interactive Inc. — San Jose, CA (1998)',
        pages: [
          {
            bookmark: '1. Архитектура 3Dfx Voodoo2 (3 чипа)',
            heading: '3DFX VOODOO² HIGH-PERFORMANCE 3D ARCHITECTURE',
            subhead: 'WHITEPAPER WP-V2-1998 | 90 MHz TRIPLE-CHIPSET PIPELINE',
            bodyHtml: `
              <p>Ускоритель <strong>3Dfx Voodoo²</strong> построен на базе одного процессора кадрового буфера (<em>Frame Buffer Interface — FBI</em>) и двух независимых текстурных процессоров (<em>Texture Mapping Unit — TMU0 &amp; TMU1</em>), работающих на тактовой частоте 90 МГц.</p>
              <div class="acrobat-diagram-box">
                <strong>[КОНВЕЙЕР РЕНДЕРИНГА VOODOO² (SINGLE-PASS MULTITEXTURING)]</strong><br/>
                PCI Bus 33MHz ==&gt; [FBI Chip + 4MB EDO FrameBuffer]<br/>
                                     |--&gt; [TMU 0 + 4MB TexRAM] (Base Texture)<br/>
                                     +--&gt; [TMU 1 + 4MB TexRAM] (Lightmap Pass)
              </div>
              <p>Благодаря двум блокам TMU в играх <strong>Quake II</strong> и <strong>Unreal</strong> базовая текстура и карта освещения (Lightmap) накладываются за один такт без падения скорости!</p>
            `
          },
          {
            bookmark: '2. Режим Scan-Line Interleave (SLI 1024x768)',
            heading: 'SCAN-LINE INTERLEAVE (SLI) PARALLEL RENDERING',
            subhead: 'DUAL-BOARD INTERCONNECT RIBBON SPECIFICATION',
            bodyHtml: `
              <p>Соединение двух карт Voodoo² 12 MB внутренним шлейфом <strong>SLI</strong> удваивает пиковую скорость закраски до <strong>180 млн текселей/сек</strong> и открывает разрешение <strong>1024×768 @ 60 Hz</strong> с Z-буфером 16 бит.</p>
              <table class="acrobat-spec-table">
                <tr><th>Конфигурация</th><th>Fillrate (Texels/s)</th><th>Макс. 3D разрешение</th></tr>
                <tr><td>3Dfx Voodoo Graphics (1996)</td><td>45 MTexels/s</td><td>640×480</td></tr>
                <tr><td>3Dfx Voodoo² 12 MB (1 плата)</td><td>90 MTexels/s</td><td>800×600</td></tr>
                <tr><td>3Dfx Voodoo² SLI (2 платы)</td><td>180 MTexels/s</td><td>1024×768</td></tr>
              </table>
            `
          }
        ]
      },
      'WIN98SE_RESKIT.PDF': {
        filename: 'WIN98SE_RESKIT.PDF',
        title: 'Microslop Win 98 Second Edition — Technical Resource Kit',
        author: 'Microslop Press — Redmond, WA (Build 4.10.2222A)',
        pages: [
          {
            bookmark: '1. Файловая система FAT32 и конвертер CVT1',
            heading: 'MICROSLOP WIN 98 SE: FAT32 & WDM ARCHITECTURE',
            subhead: 'RESOURCE KIT CHAPTER 4 — STORAGE & KERNEL 4.10.2222A',
            bodyHtml: `
              <p>Файловая система <strong>FAT32</strong> в <strong>Microslop Win 98 SE</strong> снижает размер кластера до 4 КБ на жестких дисках объемом до 8 ГБ, экономя до 25–30% дискового пространства по сравнению с классической FAT16.</p>
              <div class="acrobat-diagram-box">
                <strong>[СРАВНЕНИЕ РАЗМЕРА КЛАСТЕРА: FAT16 vs FAT32]</strong><br/>
                Диск 2.0 ГБ (FAT16) : Кластер 32 КБ  (Потери на мелких файлах: ~28%)<br/>
                Диск 4.3 ГБ (FAT32) : Кластер  4 КБ  (Потери на мелких файлах: &lt; 3%)
              </div>
              <p>Внимание: после конвертации системного раздела <code>C:</code> в FAT32 загрузка старых версий MS-DOS 6.22 невозможна — используйте системную дискету Microslop Win 98 Startup Disk.</p>
            `
          },
          {
            bookmark: '2. Реестр SYSTEM.DAT и профили оборудования',
            heading: 'КОНФИГУРАЦИЯ РЕЕСТРА И VXD/WDM ДРАЙВЕРОВ',
            subhead: 'SECTION 9.2 — REGISTRY BACKUP WITH SCANREG.EXE',
            bodyHtml: `
              <p>Системный реестр Microslop Win 98 хранится в двух бинарных файлах: <code>C:\\WINDOWS\\SYSTEM.DAT</code> и <code>C:\\WINDOWS\\USER.DAT</code>. При каждом успешном старте утилита <strong>Registry Checker (SCANREGW.EXE)</strong> создает резервную копию в архиве <code>RB00x.CAB</code>.</p>
              <table class="acrobat-spec-table">
                <tr><th>Утилита</th><th>Назначение</th><th>Команда Вызова</th></tr>
                <tr><td>System Monitor</td><td>Графики загрузки ядра и кэша</td><td><code>sysmon.exe</code></td></tr>
                <tr><td>Clipboard Viewer</td><td>Инспектор буфера обмена</td><td><code>clipbrd.exe</code></td></tr>
                <tr><td>Wintune 98</td><td>Эталонный тест ПК</td><td><code>wintune.exe</code></td></tr>
              </table>
            `
          }
        ]
      }
    };
  }

  open(initialDocKey) {
    this.winId = this.windowId;
    if (initialDocKey) {
      const upper = String(initialDocKey).split(/[\\/]/).pop().toUpperCase();
      if (this.documents[upper]) {
        this.currentDocKey = upper;
        this.currentPage = 0;
      } else if (upper.includes('VOODOO')) {
        this.currentDocKey = 'VOODOO2_SPEC.PDF';
        this.currentPage = 0;
      } else if (upper.includes('RESKIT') || upper.includes('WIN98')) {
        this.currentDocKey = 'WIN98SE_RESKIT.PDF';
        this.currentPage = 0;
      } else if (upper.includes('BC3') || upper.includes('MANUAL')) {
        this.currentDocKey = 'BC3000AD_MANUAL.PDF';
        this.currentPage = 0;
      }
    }

    if (window.winManager && window.winManager.windows.has(this.windowId)) {
      const existing = window.winManager.windows.get(this.windowId);
      if (existing.isMinimized) window.winManager.restoreWindow(this.windowId);
      else window.winManager.bringToTop(this.windowId);
      this.renderAll();
      return existing;
    }

    const content = `
      <div class="acrobat-shell" id="${this.windowId}-shell">
        <div class="win-menubar">
          <div class="win-menu-item" onclick="window.appAcrobat.cycleDocument()"><u>F</u>ile</div>
          <div class="win-menu-item" onclick="window.appAcrobat.setSidebarMode('bookmarks')"><u>V</u>iew</div>
          <div class="win-menu-item" onclick="window.appAcrobat.nextPage()"><u>D</u>ocument</div>
          <div class="win-menu-item" onclick="window.appAcrobat.showAbout()"><u>H</u>elp</div>
        </div>

        <div class="acrobat-toolbar">
          <select id="acrobat-doc-select" style="height:22px;font-size:11px;" onchange="window.appAcrobat.selectDocument(this.value)">
            <option value="BC3000AD_MANUAL.PDF">BC3000AD_MANUAL.PDF (Igromania CD)</option>
            <option value="VOODOO2_SPEC.PDF">VOODOO2_SPEC.PDF (3Dfx SLI Spec)</option>
            <option value="WIN98SE_RESKIT.PDF">WIN98SE_RESKIT.PDF (Win 98 SE Kit)</option>
          </select>
          <div class="acrobat-tb-sep"></div>
          <button class="acrobat-tb-btn" id="acrobat-mode-page" onclick="window.appAcrobat.setSidebarMode('none')">📄 Только стр.</button>
          <button class="acrobat-tb-btn active" id="acrobat-mode-bookmarks" onclick="window.appAcrobat.setSidebarMode('bookmarks')">🔖 Закладки</button>
          <button class="acrobat-tb-btn" id="acrobat-mode-thumbs" onclick="window.appAcrobat.setSidebarMode('thumbs')">🖼️ Миниатюры</button>
          <div class="acrobat-tb-sep"></div>
          <button class="acrobat-tb-btn" id="acrobat-btn-prev" onclick="window.appAcrobat.prevPage()">◀ Пред.</button>
          <span id="acrobat-page-counter" style="padding:0 5px;font-weight:bold;">Стр. 1 из 3</span>
          <button class="acrobat-tb-btn" id="acrobat-btn-next" onclick="window.appAcrobat.nextPage()">След. ▶</button>
          <div class="acrobat-tb-sep"></div>
          <button class="acrobat-tb-btn" id="acrobat-btn-zoomout" onclick="window.appAcrobat.changeZoom(-15)">🔍-</button>
          <span id="acrobat-zoom-label" style="min-width:38px;text-align:center;font-weight:bold;">100%</span>
          <button class="acrobat-tb-btn" id="acrobat-btn-zoomin" onclick="window.appAcrobat.changeZoom(15)">🔍+</button>
          <input type="text" id="acrobat-find-input" placeholder="Найти в PDF..." style="width:95px;height:18px;font-size:11px;padding:1px 4px;" oninput="window.appAcrobat.setSearchQuery(this.value)" />
        </div>

        <div class="acrobat-workspace" id="acrobat-workspace">
          <div class="acrobat-side-pane" id="acrobat-side-pane">
            <div class="acrobat-side-header" id="acrobat-side-header">Закладки документа (Bookmarks)</div>
            <div class="acrobat-side-content" id="acrobat-side-content"></div>
          </div>
          <div class="acrobat-easel" id="acrobat-easel">
            <div class="acrobat-page-sheet" id="acrobat-page-sheet"></div>
          </div>
        </div>

        <div class="status-bar">
          <div class="status-bar-field" id="acrobat-status-left">Adobe Acrobat Reader 3.01 for Microslop Win 98</div>
          <div class="status-bar-field" id="acrobat-status-right" style="flex:0 0 185px;">Page Size: 210 × 297 mm (A4)</div>
        </div>
      </div>
    `;

    const win = window.winManager.createWindow({
      id: this.windowId,
      title: `Adobe Acrobat Reader 3.01 - [${this.currentDocKey}]`,
      icon: 'acrobat',
      width: 710,
      height: 495,
      minWidth: 560,
      minHeight: 380,
      content
    });

    this.renderAll();
    return win;
  }

  getCurrentDoc() {
    return this.documents[this.currentDocKey] || this.documents['BC3000AD_MANUAL.PDF'];
  }

  selectDocument(docKey) {
    if (!this.documents[docKey]) return;
    this.currentDocKey = docKey;
    this.currentPage = 0;
    this.renderAll();
  }

  cycleDocument() {
    const keys = Object.keys(this.documents);
    const nextIdx = (keys.indexOf(this.currentDocKey) + 1) % keys.length;
    this.selectDocument(keys[nextIdx]);
  }

  setSidebarMode(mode) {
    this.sidebarMode = mode;
    this.renderAll();
  }

  goToPage(pageIndex) {
    const doc = this.getCurrentDoc();
    if (!doc) return;
    this.currentPage = Math.max(0, Math.min(doc.pages.length - 1, pageIndex));
    this.renderAll();
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  changeZoom(delta) {
    this.zoom = Math.max(70, Math.min(145, this.zoom + delta));
    this.renderAll();
  }

  setSearchQuery(q) {
    this.searchQuery = String(q || '').trim();
    this.renderPageSheet();
  }

  highlightSearch(htmlStr) {
    if (!this.searchQuery || this.searchQuery.length < 2) return htmlStr;
    const escaped = this.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})(?![^<]*>)`, 'gi');
    return htmlStr.replace(regex, '<span class="acrobat-highlight">$1</span>');
  }

  renderAll() {
    const doc = this.getCurrentDoc();
    if (!doc) return;

    if (window.winManager && typeof window.winManager.setTitle === 'function') {
      window.winManager.setTitle(this.windowId, `Adobe Acrobat Reader 3.01 - [${doc.filename}]`);
    }

    const selEl = document.getElementById('acrobat-doc-select');
    if (selEl) selEl.value = this.currentDocKey;

    const ws = document.getElementById('acrobat-workspace');
    if (ws) {
      ws.classList.toggle('page-only', this.sidebarMode === 'none');
    }

    const btnPage = document.getElementById('acrobat-mode-page');
    const btnBm = document.getElementById('acrobat-mode-bookmarks');
    const btnTh = document.getElementById('acrobat-mode-thumbs');
    if (btnPage) btnPage.classList.toggle('active', this.sidebarMode === 'none');
    if (btnBm) btnBm.classList.toggle('active', this.sidebarMode === 'bookmarks');
    if (btnTh) btnTh.classList.toggle('active', this.sidebarMode === 'thumbs');

    const counterEl = document.getElementById('acrobat-page-counter');
    if (counterEl) {
      counterEl.textContent = `Стр. ${this.currentPage + 1} из ${doc.pages.length}`;
    }

    const zoomEl = document.getElementById('acrobat-zoom-label');
    if (zoomEl) zoomEl.textContent = `${this.zoom}%`;

    const statusLeft = document.getElementById('acrobat-status-left');
    if (statusLeft) {
      statusLeft.textContent = `${doc.title} — ${doc.author}`;
    }

    this.renderSidebar();
    this.renderPageSheet();
  }

  renderSidebar() {
    const doc = this.getCurrentDoc();
    const header = document.getElementById('acrobat-side-header');
    const content = document.getElementById('acrobat-side-content');
    if (!doc || !header || !content) return;

    if (this.sidebarMode === 'thumbs') {
      header.textContent = 'Миниатюры страниц (Thumbnails)';
      content.innerHTML = doc.pages.map((p, idx) => `
        <div class="acrobat-thumb-card ${idx === this.currentPage ? 'active' : ''}"
             onclick="window.appAcrobat.goToPage(${idx})">
          <div class="acrobat-thumb-sheet">
            <strong style="color:#8b0000;display:block;margin-bottom:3px;">${p.heading.slice(0, 26)}</strong>
            <div>${p.subhead}</div>
            <div style="margin-top:6px;border-top:1px solid #808080;padding-top:3px;">PDF Page ${idx + 1}</div>
          </div>
          <div style="font-weight:bold;">Стр. ${idx + 1}</div>
        </div>
      `).join('');
      return;
    }

    header.textContent = 'Закладки документа (Bookmarks)';
    content.innerHTML = doc.pages.map((p, idx) => `
      <div class="acrobat-bookmark-item ${idx === this.currentPage ? 'active' : ''}"
           onclick="window.appAcrobat.goToPage(${idx})">
        <span>📑</span>
        <span>${p.bookmark}</span>
      </div>
    `).join('');
  }

  renderPageSheet() {
    const doc = this.getCurrentDoc();
    const sheet = document.getElementById('acrobat-page-sheet');
    if (!doc || !sheet) return;

    const page = doc.pages[this.currentPage] || doc.pages[0];
    sheet.style.transform = `scale(${this.zoom / 100})`;
    const bodyRendered = this.highlightSearch(page.bodyHtml);

    sheet.innerHTML = `
      <div>
        <div class="acrobat-page-header">
          <span>${doc.title}</span>
          <span>${page.subhead}</span>
        </div>
        <h2 class="acrobat-page-title">${page.heading}</h2>
        <div>${bodyRendered}</div>
      </div>
      <div class="acrobat-page-footer">
        <span>${doc.author}</span>
        <span>Страница ${this.currentPage + 1} / ${doc.pages.length}</span>
      </div>
    `;
  }

  showAbout() {
    if (window.dialogs && typeof window.dialogs.alert === 'function') {
      window.dialogs.alert(
        'Adobe Acrobat Reader 3.01 (32-Bit) for Microslop Win 98.\nПоставляется на компакт-диске журнала «Игромания» №9 (1998) — D:\\bc3k\\ar32e301.exe.',
        'About Adobe Acrobat Reader 3.01'
      );
    }
  }

  close() {
    if (window.winManager) window.winManager.closeWindow(this.windowId);
  }
}

window.appAcrobat = new AppAcrobat();
