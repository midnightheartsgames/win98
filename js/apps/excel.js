/**
 * Win 98 Microslop Excel 97 Application
 * Interactive spreadsheet viewer/editor with formulas and budget data.
 */
class AppExcel {
  constructor() {
    this.currentFileName = 'budget_1998.xls';
    this.currentPath = ['My Computer', 'C:', 'Work'];
    this.activeCell = { row: 3, col: 'B' };
    this.cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    this.numRows = 16;
    this.data = {};
  }

  getDefaultBudgetData() {
    const isEn = window.i18n && window.i18n.currentLang === 'en';
    if (isEn) {
      return {
        'A1': 'EXPENSE AND SAVINGS BUDGET FOR 1998 (USD)',
        'A2': 'Expense Category', 'B2': 'Q1', 'C2': 'Q2', 'D2': 'Q3', 'E2': 'Q4', 'F2': 'TOTAL (Year)',
        'A3': 'Dial-up Internet (33.6k modem)', 'B3': 120, 'C3': 135, 'D3': 140, 'E3': 160, 'F3': 555,
        'A4': '3.5" Verbatim Floppies (10 pack)', 'B4': 25, 'C4': 30, 'D4': 15, 'E4': 20, 'F4': 90,
        'A5': 'CD-R Blank Discs 650MB (25 pack)', 'B5': 45, 'C5': 55, 'D5': 40, 'E5': 50, 'F5': 190,
        'A6': 'Upgrade: Intel Pentium II 300MHz', 'B6': 0, 'C6': 420, 'D6': 0, 'E6': 0, 'F6': 420,
        'A7': '3D Accelerator 3dfx Voodoo2 12MB', 'B7': 0, 'C7': 299, 'D7': 0, 'E7': 0, 'F7': 299,
        'A8': 'Pizza & Cola for LAN Party', 'B8': 70, 'C8': 85, 'D8': 95, 'E8': 120, 'F8': 370,
        'A9': 'Games: Wolf3D, SCUMM, STALKER', 'B9': 45, 'C9': 50, 'D9': 45, 'E9': 60, 'F9': 200,
        'A10': 'TOTAL EXPENSES:', 'B10': 305, 'C10': 1074, 'D10': 335, 'E10': 410, 'F10': 2124,
        'A11': 'INCOME & SAVINGS:', 'B11': 600, 'C11': 1200, 'D11': 450, 'E11': 500, 'F11': 2750,
        'A12': 'BUDGET SURPLUS:', 'B12': 295, 'C12': 126, 'D12': 115, 'E12': 90, 'F12': 626
      };
    }
    return {
      'A1': 'БЮДЖЕТ РАСХОДОВ И СБЕРЕЖЕНИЙ НА 1998 ГОД (USD)',
      'A2': 'Статья расходов', 'B2': 'I Квартал', 'C2': 'II Квартал', 'D2': 'III Квартал', 'E2': 'IV Квартал', 'F2': 'ИТОГО (Год)',
      'A3': 'Модемный интернет (Dial-up 33.6k)', 'B3': 120, 'C3': 135, 'D3': 140, 'E3': 160, 'F3': 555,
      'A4': 'Дискеты 3.5" Verbatim (10 шт)', 'B4': 25, 'C4': 30, 'D4': 15, 'E4': 20, 'F4': 90,
      'A5': 'Чистые диски CD-R 650MB (25 шт)', 'B5': 45, 'C5': 55, 'D5': 40, 'E5': 50, 'F5': 190,
      'A6': 'Апгрейд: Intel Pentium II 300MHz', 'B6': 0, 'C6': 420, 'D6': 0, 'E6': 0, 'F6': 420,
      'A7': '3D-ускоритель 3dfx Voodoo2 12MB', 'B7': 0, 'C7': 299, 'D7': 0, 'E7': 0, 'F7': 299,
      'A8': 'Пицца и кола для LAN-пати', 'B8': 70, 'C8': 85, 'D8': 95, 'E8': 120, 'F8': 370,
      'A9': 'Игры: Wolf3D, SCUMM, STALKER', 'B9': 45, 'C9': 50, 'D9': 45, 'E9': 60, 'F9': 200,
      'A10': 'ИТОГО РАСХОДЫ:', 'B10': 305, 'C10': 1074, 'D10': 335, 'E10': 410, 'F10': 2124,
      'A11': 'ДОХОДЫ И НАКОПЛЕНИЯ:', 'B11': 600, 'C11': 1200, 'D11': 450, 'E11': 500, 'F11': 2750,
      'A12': 'ОСТАТОК БЮДЖЕТА (ПРОФИЦИТ):', 'B12': 295, 'C12': 126, 'D12': 115, 'E12': 90, 'F12': 626
    };
  }

  open(fileName = 'budget_1998.xls', content = null, filePath = null) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    this.currentFileName = fileName;
    if (filePath) this.currentPath = filePath;

    if (content && typeof content === 'object') {
      this.data = JSON.parse(JSON.stringify(content));
    } else if (content && typeof content === 'string' && content.startsWith('{')) {
      try {
        this.data = JSON.parse(content);
      } catch (e) {
        this.data = this.getDefaultBudgetData();
      }
    } else {
      this.data = this.getDefaultBudgetData();
    }

    const winId = 'app_excel_' + Date.now();
    const win = window.winManager.createWindow({
      id: winId,
      title: `${this.currentFileName} - ${t('excel.title')}`,
      icon: 'excel',
      width: 640,
      height: 440,
      content: this.buildHTML()
    });

    this.attachEvents(win, winId);
    this.recalculate();
    this.renderGrid(win);
  }

  buildHTML() {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const isRu = (window.i18n ? window.i18n.currentLang : 'ru') === 'ru';
    return `
      <div class="excel-container">
        <!-- Menubar -->
        <div class="win-menubar">
          <div class="win-menu-item">
            ${t('excel.menuFile')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option opt-new">${t('excel.menuNew')} <span>Ctrl+N</span></div>
              <div class="win-dropdown-option opt-open">${t('excel.menuOpen')} <span>Ctrl+O</span></div>
              <div class="win-dropdown-option opt-save">${t('excel.menuSave')} <span>Ctrl+S</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option opt-exit">${t('excel.menuExit')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('excel.menuEdit')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option opt-undo">${t('excel.menuUndo')} <span>Ctrl+Z</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option opt-cut">${t('excel.menuCut')} <span>Ctrl+X</span></div>
              <div class="win-dropdown-option opt-copy">${t('excel.menuCopy')} <span>Ctrl+C</span></div>
              <div class="win-dropdown-option opt-paste">${t('excel.menuPaste')} <span>Ctrl+V</span></div>
              <div class="win-dropdown-option opt-clear">${t('excel.menuClear')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('excel.menuInsert')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option opt-insert-row">${t('excel.menuInsertRow')}</div>
              <div class="win-dropdown-option opt-insert-col">${t('excel.menuInsertCol')}</div>
              <div class="win-dropdown-option opt-autosum">${t('excel.menuAutoSum')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('excel.menuHelp')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option opt-about">${t('excel.menuAbout')}</div>
            </div>
          </div>
        </div>

        <!-- Excel Toolbar -->
        <div class="excel-toolbar">
          <button class="excel-tool-btn btn-save" title="${t('excel.tipSave')}">
            <svg width="14" height="14" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="#000080"/><rect x="4" y="2" width="8" height="5" fill="#fff"/><rect x="4" y="9" width="8" height="5" fill="#c0c0c0"/></svg>
          </button>
          <button class="excel-tool-btn btn-print" title="${t('excel.tipPrint')}">
            <svg width="14" height="14" viewBox="0 0 16 16"><rect x="3" y="1" width="10" height="4" fill="#808080"/><rect x="2" y="5" width="12" height="6" fill="#000"/><rect x="4" y="8" width="8" height="7" fill="#fff"/></svg>
          </button>
          <div class="excel-divider"></div>
          <button class="excel-tool-btn btn-cut" title="${t('excel.tipCut')}">✂</button>
          <button class="excel-tool-btn btn-copy" title="${t('excel.tipCopy')}">📋</button>
          <button class="excel-tool-btn btn-paste" title="${t('excel.tipPaste')}">📄</button>
          <div class="excel-divider"></div>
          <button class="excel-tool-btn btn-autosum" title="${t('excel.tipAutoSum')}" style="font-weight:bold; font-size:13px;">∑</button>
          <button class="excel-tool-btn btn-currency" title="${t('excel.tipCurrency')}" style="font-weight:bold;">$</button>
          <button class="excel-tool-btn btn-percent" title="${t('excel.tipPercent')}" style="font-weight:bold;">%</button>
          <div class="excel-divider"></div>
          <button class="excel-tool-btn btn-bold" title="${t('excel.tipBold')}"><b>${isRu ? 'Ж' : 'B'}</b></button>
          <button class="excel-tool-btn btn-italic" title="${t('excel.tipItalic')}"><i>${isRu ? 'К' : 'I'}</i></button>
        </div>

        <!-- Formula Bar -->
        <div class="excel-formula-bar">
          <div class="excel-name-box">B3</div>
          <div class="excel-fx-label">fx</div>
          <input type="text" class="excel-formula-input" spellcheck="false">
        </div>

        <!-- Grid Viewport -->
        <div class="excel-viewport">
          <table class="excel-table">
            <thead>
              <tr>
                <th class="excel-corner"></th>
                ${this.cols.map(col => `<th class="excel-col-hdr" data-col="${col}">${col}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="excel-tbody"></tbody>
          </table>
        </div>

        <!-- Sheets Tabs Bar -->
        <div class="excel-tabs-bar">
          <div class="excel-tab active">${t('excel.tabSheet1')}</div>
          <div class="excel-tab">${t('excel.tabSheet2')}</div>
          <div class="excel-tab">${t('excel.tabSheet3')}</div>
        </div>

        <!-- Statusbar -->
        <div class="win-statusbar">
          <div class="win-status-pane grow excel-status-main">${t('excel.statusReady')}</div>
          <div class="win-status-pane excel-status-sum" style="width:140px;">${t('excel.statusSum', '0.00')}</div>
          <div class="win-status-pane" style="width:50px; text-align:center;">NUM</div>
        </div>
      </div>
    `;
  }

  attachEvents(win, winId) {
    const el = win.element;
    const formulaInput = el.querySelector('.excel-formula-input');
    const nameBox = el.querySelector('.excel-name-box');
    const statusSum = el.querySelector('.excel-status-sum');
    const btnSave = el.querySelector('.btn-save');
    const btnAutoSum = el.querySelector('.btn-autosum');
    const btnBold = el.querySelector('.btn-bold');

    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;

    // Save action
    const saveFile = () => {
      if (window.vfs) {
        window.vfs.writeFile(this.currentPath, this.currentFileName, JSON.stringify(this.data));
      }
      if (window.soundSys) window.soundSys.playClick();
      window.winManager.openDialog({
        title: t('excel.title'),
        icon: 'excel',
        message: t('excel.saveSuccess', this.currentFileName)
      });
    };

    btnSave.addEventListener('click', saveFile);
    el.querySelector('.opt-save').addEventListener('click', saveFile);

    el.querySelector('.opt-exit').addEventListener('click', () => {
      window.winManager.closeWindow(winId);
    });

    el.querySelector('.opt-about').addEventListener('click', () => {
      window.winManager.openDialog({
        title: t('excel.aboutTitle'),
        icon: 'excel',
        message: t('excel.aboutMsg')
      });
    });

    btnAutoSum.addEventListener('click', () => {
      this.calculateAutoSum(win);
    });

    // Formula bar edits
    formulaInput.addEventListener('input', () => {
      const coord = `${this.activeCell.col}${this.activeCell.row}`;
      const val = formulaInput.value;
      const num = Number(val);
      this.data[coord] = (!isNaN(num) && val.trim() !== '') ? num : val;
      this.recalculate();
      this.updateCellDOM(win, coord);
      this.updateStatusBar(win);
    });

    formulaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        formulaInput.blur();
        this.selectCell(win, this.activeCell.row + 1, this.activeCell.col);
      }
    });

    // Delegated click & edit on grid table
    const tbody = el.querySelector('.excel-tbody');
    tbody.addEventListener('click', (e) => {
      const cell = e.target.closest('.excel-cell');
      if (cell) {
        const row = parseInt(cell.dataset.row);
        const col = cell.dataset.col;
        this.selectCell(win, row, col);
      }
    });

    tbody.addEventListener('dblclick', (e) => {
      const cell = e.target.closest('.excel-cell');
      if (cell) {
        cell.contentEditable = 'true';
        cell.focus();
      }
    });

    tbody.addEventListener('blur', (e) => {
      const cell = e.target.closest('.excel-cell');
      if (cell && cell.contentEditable === 'true') {
        cell.contentEditable = 'false';
        const row = parseInt(cell.dataset.row);
        const col = cell.dataset.col;
        const coord = `${col}${row}`;
        const text = cell.innerText.trim();
        const num = Number(text.replace(/[$,]/g, ''));
        this.data[coord] = (!isNaN(num) && text !== '') ? num : text;
        this.recalculate();
        this.renderGrid(win);
      }
    }, true);
  }

  recalculate() {
    // Recalculate column F (total row by row for 3 to 9)
    for (let r = 3; r <= 9; r++) {
      const sum = (Number(this.data[`B${r}`]) || 0) +
                  (Number(this.data[`C${r}`]) || 0) +
                  (Number(this.data[`D${r}`]) || 0) +
                  (Number(this.data[`E${r}`]) || 0);
      this.data[`F${r}`] = sum;
    }

    // Recalculate row 10 (Total Expenses per quarter B to F)
    this.cols.slice(1, 6).forEach(col => {
      let sum = 0;
      for (let r = 3; r <= 9; r++) {
        sum += (Number(this.data[`${col}${r}`]) || 0);
      }
      this.data[`${col}10`] = sum;
    });

    // Row 11 total F11
    this.data['F11'] = (Number(this.data['B11']) || 0) +
                       (Number(this.data['C11']) || 0) +
                       (Number(this.data['D11']) || 0) +
                       (Number(this.data['E11']) || 0);

    // Row 12 (Surplus = Row 11 - Row 10)
    this.cols.slice(1, 6).forEach(col => {
      const inc = Number(this.data[`${col}11`]) || 0;
      const exp = Number(this.data[`${col}10`]) || 0;
      this.data[`${col}12`] = inc - exp;
    });
  }

  calculateAutoSum(win) {
    const col = this.activeCell.col;
    let sum = 0;
    for (let r = 1; r < this.activeCell.row; r++) {
      const v = Number(this.data[`${col}${r}`]);
      if (!isNaN(v)) sum += v;
    }
    const coord = `${col}${this.activeCell.row}`;
    this.data[coord] = sum;
    this.recalculate();
    this.renderGrid(win);
    this.updateStatusBar(win);
  }

  selectCell(win, row, col) {
    if (row < 1 || row > this.numRows) return;
    if (!this.cols.includes(col)) return;

    this.activeCell = { row, col };
    const el = win.element;
    const coord = `${col}${row}`;

    el.querySelectorAll('.excel-cell').forEach(c => c.classList.remove('selected'));
    const targetCell = el.querySelector(`.excel-cell[data-row="${row}"][data-col="${col}"]`);
    if (targetCell) targetCell.classList.add('selected');

    const nameBox = el.querySelector('.excel-name-box');
    const formulaInput = el.querySelector('.excel-formula-input');

    nameBox.textContent = coord;
    const val = this.data[coord] !== undefined ? this.data[coord] : '';
    formulaInput.value = val;

    this.updateStatusBar(win);
  }

  updateStatusBar(win) {
    const t = (k, ...a) => window.i18n ? window.i18n.t(k, ...a) : k;
    const el = win.element;
    const statusSum = el.querySelector('.excel-status-sum');
    const coord = `${this.activeCell.col}${this.activeCell.row}`;
    const val = Number(this.data[coord]);
    if (!isNaN(val) && val !== 0) {
      statusSum.textContent = t('excel.statusSum', val.toFixed(2));
    } else {
      statusSum.textContent = t('excel.statusCell', coord);
    }
  }

  updateCellDOM(win, coord) {
    const cell = win.element.querySelector(`.excel-cell[data-coord="${coord}"]`);
    if (cell) {
      const val = this.data[coord] !== undefined ? this.data[coord] : '';
      cell.textContent = typeof val === 'number' ? (coord.startsWith('A') ? val : `$${val}`) : val;
    }
  }

  renderGrid(win) {
    const el = win.element;
    const tbody = el.querySelector('.excel-tbody');
    tbody.innerHTML = '';

    for (let r = 1; r <= this.numRows; r++) {
      const tr = document.createElement('tr');

      // Row Header
      const rowHdr = document.createElement('td');
      rowHdr.className = 'excel-row-hdr';
      rowHdr.textContent = r;
      tr.appendChild(rowHdr);

      // Columns
      this.cols.forEach(col => {
        const td = document.createElement('td');
        const coord = `${col}${r}`;
        td.className = 'excel-cell';
        td.dataset.row = r;
        td.dataset.col = col;
        td.dataset.coord = coord;

        if (r === this.activeCell.row && col === this.activeCell.col) {
          td.classList.add('selected');
        }

        const rawVal = this.data[coord] !== undefined ? this.data[coord] : '';

        // Styling by row type
        if (r === 1) {
          td.classList.add('bold');
          if (col === 'A') {
            td.style.color = '#000080';
            td.style.fontSize = '12px';
          }
        } else if (r === 2) {
          td.classList.add('bold', 'align-center');
          td.style.background = '#f0ede5';
        } else if (r === 10) {
          td.classList.add('highlight-total');
        } else if (r === 12) {
          td.classList.add('highlight-surplus');
        }

        if (typeof rawVal === 'number') {
          td.classList.add('align-right');
          td.textContent = (r >= 3 && col !== 'A') ? `$${rawVal.toLocaleString('en-US')}` : rawVal;
        } else {
          td.textContent = rawVal;
        }

        // Specific width column A
        if (col === 'A') {
          td.style.minWidth = '210px';
          td.style.maxWidth = '260px';
        } else {
          td.style.minWidth = '75px';
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    }

    this.selectCell(win, this.activeCell.row, this.activeCell.col);
  }
}

window.appExcel = new AppExcel();

