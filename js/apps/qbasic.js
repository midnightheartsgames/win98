class AppQBasic {
  static WIN_ID = 'app_qbasic';

  static VGA_PALETTE = [
    '#000000', '#0000aa', '#00aa00', '#00aaaa',
    '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa',
    '#555555', '#5555ff', '#55ff55', '#55ffff',
    '#ff5555', '#ff55ff', '#ffff55', '#ffffff'
  ];

  static SAMPLES = {
    'HOMEWORK.BAS': [
      '10 CLS',
      '20 COLOR 14, 0',
      '30 PRINT "================================="',
      '40 PRINT " ПРИВЕТ ИЗ 1998 ГОДА! WIN 98 "',
      '50 PRINT "================================="',
      '60 COLOR 10, 0',
      '70 FOR I = 1 TO 5',
      '80   PRINT "Загрузка процессора Pentium II: "; I * 20; "%"',
      '90   SOUND 300 + I * 110, 2',
      '100 NEXT I',
      '110 COLOR 15, 0',
      '120 PRINT ""',
      '130 PRINT "Алгебра (Задание 1): 3x + 12 = 27  =>  x = "; (27 - 12) / 3',
      '140 PRINT "Алгебра (Задание 2): x^2 - 7x + 10 = 0  =>  x1 = 5, x2 = 2"',
      '150 COLOR 11, 0',
      '160 PRINT "Готово! Запуск Wolfenstein 3D..."',
      '170 END'
    ].join('\n'),
    'STARFIELD.BAS': [
      '10 SCREEN 13',
      '20 CLS',
      '30 FOR I = 1 TO 140',
      '40   X = INT(RND * 320)',
      '50   Y = INT(RND * 200)',
      '60   C = 7 + (I MOD 9)',
      '70   PSET (X, Y), C',
      '80 NEXT I',
      '90 FOR R = 42 TO 2 STEP -2',
      '100  C = 1 + (R MOD 14)',
      '110  CIRCLE (160, 100), R, C',
      '120 NEXT R',
      '130 LINE (20, 175)-(300, 192), 1, BF',
      '140 LINE (20, 175)-(300, 192), 14, B',
      '150 COLOR 14',
      '160 PRINT "   MICROSLOP QBASIC 1.1 * VGA 320x200"',
      '170 BEEP',
      '180 END'
    ].join('\n'),
    'MANDEL.BAS': [
      '10 SCREEN 13',
      '20 CLS',
      '30 COLOR 11',
      '40 PRINT "Рендеринг фрактала Мандельброта (3dfx FPU Test)..."',
      '50 FOR PY = 20 TO 180 STEP 2',
      '60   FOR PX = 40 TO 280 STEP 2',
      '70     CX = (PX - 180) / 65',
      '80     CY = (PY - 100) / 65',
      '90     ZX = 0',
      '100    ZY = 0',
      '110    C = 1',
      '120    FOR K = 1 TO 14',
      '130      NX = ZX * ZX - ZY * ZY + CX',
      '140      NY = 2 * ZX * ZY + CY',
      '150      ZX = NX',
      '160      ZY = NY',
      '170      IF ZX * ZX + ZY * ZY < 4 THEN C = K + 1',
      '180    NEXT K',
      '190    IF C < 15 THEN LINE (PX, PY)-(PX + 1, PY + 1), C, BF',
      '200  NEXT PX',
      '210 NEXT PY',
      '220 SOUND 660, 2',
      '230 SOUND 880, 3',
      '240 END'
    ].join('\n'),
    'SYNTH98.BAS': [
      '10 CLS',
      '20 COLOR 14',
      '30 PRINT "=== PC SPEAKER SYNTHESIZER 1998 ==="',
      '40 COLOR 10',
      '50 PRINT "Воспроизведение мелодии через системный динамик..."',
      '60 PLAY "O4L8CDEFGABO5C"',
      '70 PLAY "O4L8GECGEO5C"',
      '80 FOR F = 220 TO 880 STEP 110',
      '90   PRINT "Частота генератора: "; F; " Гц"',
      '100  SOUND F, 2',
      '110 NEXT F',
      '120 COLOR 15',
      '130 PRINT "Синтез завершен успешно!"',
      '140 END'
    ].join('\n'),
    'QUIZ98.BAS': [
      '10 CLS',
      '20 COLOR 11',
      '30 PRINT "=== ВИКТОРИНА КОМПЬЮТЕРЩИКА 1998 ==="',
      '40 COLOR 15',
      '50 INPUT "Как вас зовут"; NAME$',
      '60 PRINT "Привет, "; NAME$; "! Проверим твои знания железа."',
      '70 INPUT "Сколько мегабайт памяти у видеокарты 3dfx Voodoo2 (8 или 12)"; MB',
      '80 IF MB = 12 THEN PRINT "Верно! Максимальная версия Voodoo2 12MB!" ELSE PRINT "Тоже неплохо! Были версии на 8 и 12 МБ."',
      '90 PLAY "O4L8CEG"',
      '100 COLOR 14',
      '110 PRINT "Оценка по информатике: 5 (Отлично)"',
      '120 END'
    ].join('\n')
  };

  constructor() {
    this.win = null;
    this.currentFileName = 'HOMEWORK.BAS';
    this.currentDir = ['My Computer', 'C:', 'My Documents'];
    this.running = false;
    this.runToken = 0;
    this.inputResolver = null;
    this.fgColor = 7;
    this.bgColor = 0;
    this.screenMode = 0;
  }

  L(ru, en) {
    return (!window.i18n || window.i18n.getLanguage() === 'ru') ? ru : en;
  }

  extractBasicFromText(rawText) {
    const text = String(rawText || '');
    const lines = text.split(/\r?\n/);
    const numbered = lines.filter(line => /^\s*\d+\s+(CLS|PRINT|FOR|NEXT|IF|INPUT|GOTO|GOSUB|RETURN|LET|COLOR|SCREEN|LINE|CIRCLE|PSET|SOUND|PLAY|BEEP|REM|END)\b/i.test(line));
    if (numbered.length >= 3) {
      return numbered.map(l => l.trim()).join('\n');
    }
    return text;
  }

  open(fileName = null, fileContent = null, dirPath = null) {
    let initialCode = AppQBasic.SAMPLES['HOMEWORK.BAS'];
    let targetName = 'HOMEWORK.BAS';

    if (fileName) {
      targetName = String(fileName).toUpperCase();
      if (dirPath && Array.isArray(dirPath)) {
        this.currentDir = [...dirPath];
      }
      if (fileContent !== null && fileContent !== undefined) {
        initialCode = this.extractBasicFromText(fileContent);
      } else if (AppQBasic.SAMPLES[targetName]) {
        initialCode = AppQBasic.SAMPLES[targetName];
      } else if (window.vfs) {
        const item = window.vfs.resolvePath([...this.currentDir, fileName]) || window.vfs.resolvePath(['My Computer', 'C:', 'My Documents', fileName]);
        if (item && item.content) {
          initialCode = this.extractBasicFromText(item.content);
        }
      }
    }

    this.currentFileName = targetName;

    if (window.winManager && window.winManager.windows.has(AppQBasic.WIN_ID)) {
      const existing = window.winManager.windows.get(AppQBasic.WIN_ID);
      if (existing.isMinimized) window.winManager.restoreWindow(AppQBasic.WIN_ID);
      else window.winManager.bringToTop(AppQBasic.WIN_ID);
      this.setEditorCode(targetName, initialCode);
      return existing;
    }

    const win = window.winManager.createWindow({
      id: AppQBasic.WIN_ID,
      title: `Microslop QBasic 1.1 - ${this.currentFileName}`,
      icon: 'qbasic',
      width: 680,
      height: 470,
      minWidth: 520,
      minHeight: 360,
      resizable: true,
      maximizable: true,
      minimizable: true,
      content: this.buildHTML(initialCode),
      onClose: () => {
        this.stopExecution();
        this.win = null;
      }
    });

    this.win = win;
    this.bindEvents(win);
    this.updateTitleAndCursor();
    return win;
  }

  buildHTML(code) {
    const sampleItems = Object.keys(AppQBasic.SAMPLES).map(name => `
      <div class="qb-dd-row" data-qb-sample="${name}">
        <span>${name}</span>
        <span>BAS</span>
      </div>
    `).join('');

    return `
      <div class="qb-root" tabindex="0">
        <div class="qb-menubar">
          <div class="qb-menu-left">
            <div class="qb-menu-item" data-qb-menu="file">
              <span class="qb-hk">F</span>ile
              <div class="qb-dropdown">
                <div class="qb-dd-row" data-qb-act="new"><span>New Program</span><span>Ctrl+N</span></div>
                <div class="qb-dd-row" data-qb-act="open"><span>Open...</span><span>Ctrl+O</span></div>
                <div class="qb-dd-row" data-qb-act="save"><span>Save</span><span>Ctrl+S</span></div>
                <div class="qb-dd-row" data-qb-act="saveas"><span>Save As...</span><span></span></div>
                <div class="qb-dd-sep"></div>
                <div class="qb-dd-row" data-qb-act="homework"><span>Load homework.txt</span><span>F2</span></div>
                <div class="qb-dd-sep"></div>
                <div class="qb-dd-row" data-qb-act="exit"><span>Exit</span><span>Alt+F4</span></div>
              </div>
            </div>
            <div class="qb-menu-item" data-qb-menu="edit">
              <span class="qb-hk">E</span>dit
              <div class="qb-dropdown">
                <div class="qb-dd-row" data-qb-act="clear-editor"><span>Clear Editor</span><span></span></div>
                <div class="qb-dd-row" data-qb-act="renumber"><span>Auto-Renumber (10, 20...)</span><span></span></div>
              </div>
            </div>
            <div class="qb-menu-item" data-qb-menu="run">
              <span class="qb-hk">R</span>un
              <div class="qb-dropdown">
                <div class="qb-dd-row" data-qb-act="run"><span>Start</span><span>Shift+F5 / F5</span></div>
                <div class="qb-dd-row" data-qb-act="OutputScreen"><span>View Output Screen</span><span>F4</span></div>
              </div>
            </div>
            <div class="qb-menu-item" data-qb-menu="samples">
              <span class="qb-hk">S</span>amples
              <div class="qb-dropdown">
                ${sampleItems}
              </div>
            </div>
          </div>
          <div class="qb-menu-right">
            <div class="qb-menu-item" data-qb-menu="help">
              <span class="qb-hk">H</span>elp
              <div class="qb-dropdown">
                <div class="qb-dd-row" data-qb-act="syntax"><span>QBasic Commands Reference</span><span>F1</span></div>
                <div class="qb-dd-sep"></div>
                <div class="qb-dd-row" data-qb-act="about"><span>About Microslop QBasic...</span><span></span></div>
              </div>
            </div>
          </div>
        </div>

        <div class="qb-workspace">
          <div class="qb-pane qb-pane-editor focused" id="qb_editor_pane">
            <div class="qb-pane-title" id="qb_file_badge">${this.currentFileName}</div>
            <textarea class="qb-editor" id="qb_code" spellcheck="false">${code}</textarea>
          </div>

          <div class="qb-pane qb-pane-immediate" id="qb_imm_pane">
            <div class="qb-pane-title">Immediate</div>
            <div class="qb-immediate-wrap">
              <div class="qb-immediate-out" id="qb_imm_out">${this.L('Введите команду BASIC (например: PRINT 2+2*10 или PLAY "CDEFG") и нажмите Enter', 'Type a BASIC command (e.g. PRINT 2+2*10 or PLAY "CDEFG") and press Enter')}</div>
              <div class="qb-immediate-line">
                <span>&gt;</span>
                <input type="text" class="qb-immediate-input" id="qb_imm_input" spellcheck="false" placeholder="PRINT 1998 * 2">
              </div>
            </div>
          </div>
        </div>

        <div class="qb-statusbar">
          <div class="qb-status-keys">
            <span class="qb-status-btn" data-qb-act="syntax">&lt;F1=Help&gt;</span>
            <span class="qb-status-btn" data-qb-act="run">&lt;F5=Run&gt;</span>
            <span class="qb-status-btn" data-qb-act="homework">&lt;F2=Homework&gt;</span>
            <span class="qb-status-btn" data-qb-act="OutputScreen">&lt;F4=Screen&gt;</span>
            <span class="qb-status-btn" data-qb-act="save">&lt;Ctrl+S=Save&gt;</span>
          </div>
          <div class="qb-status-right">
            <span id="qb_status_state">CAPS</span>
            <span id="qb_cursor_pos">00001:001</span>
          </div>
        </div>

        <div class="qb-screen" id="qb_screen">
          <div class="qb-vga-stage">
            <canvas class="qb-vga-canvas" id="qb_vga_canvas" width="320" height="200"></canvas>
            <div class="qb-vga-console" id="qb_vga_console"></div>
          </div>
          <div class="qb-vga-footer" id="qb_vga_footer">
            <span id="qb_vga_status">${this.L('Нажмите любую клавишу или кликните здесь для возврата в редактор QBasic', 'Press any key or click here to return to QBasic editor')}</span>
            <span>[ESC / ENTER]</span>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents(win) {
    const el = win.element;
    const root = el.querySelector('.qb-root');
    const editor = el.querySelector('#qb_code');
    const editorPane = el.querySelector('#qb_editor_pane');
    const immPane = el.querySelector('#qb_imm_pane');
    const immInput = el.querySelector('#qb_imm_input');
    const immOut = el.querySelector('#qb_imm_out');
    const screenEl = el.querySelector('#qb_screen');
    const footerEl = el.querySelector('#qb_vga_footer');

    const closeMenus = () => {
      el.querySelectorAll('.qb-menu-item.open').forEach(m => m.classList.remove('open'));
    };

    el.querySelectorAll('.qb-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.qb-dropdown')) return;
        e.stopPropagation();
        const wasOpen = item.classList.contains('open');
        closeMenus();
        if (!wasOpen) item.classList.add('open');
      });
    });

    el.addEventListener('click', (e) => {
      if (!e.target.closest('.qb-menu-item')) closeMenus();
    });

    el.querySelectorAll('[data-qb-sample]').forEach(row => {
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMenus();
        const name = row.getAttribute('data-qb-sample');
        if (AppQBasic.SAMPLES[name]) {
          this.setEditorCode(name, AppQBasic.SAMPLES[name]);
        }
      });
    });

    el.querySelectorAll('[data-qb-act]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMenus();
        const act = btn.getAttribute('data-qb-act');
        this.handleAction(act);
      });
    });

    editor.addEventListener('focus', () => {
      editorPane.classList.add('focused');
      immPane.classList.remove('focused');
    });

    immInput.addEventListener('focus', () => {
      immPane.classList.add('focused');
      editorPane.classList.remove('focused');
    });

    ['keyup', 'click', 'input'].forEach(ev => {
      editor.addEventListener(ev, () => this.updateTitleAndCursor());
    });

    immInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const line = immInput.value.trim();
        if (!line) return;
        immInput.value = '';
        await this.runImmediateLine(line, immOut);
      }
    });

    footerEl.addEventListener('click', () => {
      if (this.running) {
        this.stopExecution();
      }
      screenEl.classList.remove('active');
      editor.focus();
    });

    root.addEventListener('keydown', (e) => {
      if (screenEl.classList.contains('active')) {
        if (e.target && e.target.classList.contains('qb-vga-prompt-input')) {
          if (e.key === 'Escape') {
            e.preventDefault();
            this.stopExecution();
            screenEl.classList.remove('active');
            editor.focus();
          }
          return;
        }
        if (!this.running || e.key === 'Escape') {
          e.preventDefault();
          this.stopExecution();
          screenEl.classList.remove('active');
          editor.focus();
        }
        return;
      }

      if (e.key === 'F5') {
        e.preventDefault();
        this.runProgram();
      } else if (e.key === 'F4') {
        e.preventDefault();
        screenEl.classList.toggle('active');
      } else if (e.key === 'F2') {
        e.preventDefault();
        this.handleAction('homework');
      } else if (e.key === 'F1') {
        e.preventDefault();
        this.handleAction('syntax');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.handleAction('save');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        this.handleAction('open');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        this.handleAction('new');
      }
    });
  }

  setEditorCode(fileName, code) {
    if (!this.win) return;
    const editor = this.win.element.querySelector('#qb_code');
    if (editor) editor.value = code;
    this.currentFileName = String(fileName || 'UNTITLED.BAS').toUpperCase();
    this.updateTitleAndCursor();
  }

  updateTitleAndCursor() {
    if (!this.win) return;
    const el = this.win.element;
    const editor = el.querySelector('#qb_code');
    const badge = el.querySelector('#qb_file_badge');
    const posEl = el.querySelector('#qb_cursor_pos');
    if (badge) badge.textContent = this.currentFileName;
    if (this.win.titleElement) {
      this.win.titleElement.textContent = `Microslop QBasic 1.1 - ${this.currentFileName}`;
    }
    if (editor && posEl) {
      const upto = editor.value.slice(0, editor.selectionStart || 0);
      const lines = upto.split('\n');
      const row = String(lines.length).padStart(5, '0');
      const col = String((lines[lines.length - 1] || '').length + 1).padStart(3, '0');
      posEl.textContent = `${row}:${col}`;
    }
  }

  handleAction(act) {
    if (!this.win) return;
    const editor = this.win.element.querySelector('#qb_code');
    const screenEl = this.win.element.querySelector('#qb_screen');

    if (act === 'new') {
      this.setEditorCode('UNTITLED.BAS', '10 CLS\n20 PRINT "HELLO, WIN 98!"\n30 END');
    } else if (act === 'clear-editor') {
      if (editor) editor.value = '';
      this.updateTitleAndCursor();
    } else if (act === 'renumber') {
      if (!editor) return;
      const rawLines = editor.value.split(/\r?\n/).filter(l => l.trim().length > 0);
      const renumbered = rawLines.map((line, idx) => {
        const stripped = line.replace(/^\s*\d+\s+/, '');
        return `${(idx + 1) * 10} ${stripped}`;
      });
      editor.value = renumbered.join('\n');
      this.updateTitleAndCursor();
    } else if (act === 'homework') {
      let hwText = null;
      if (window.vfs) {
        const docItem = window.vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'homework.txt']);
        if (docItem && docItem.content) hwText = docItem.content;
        else if (typeof window.vfs.getHomeworkDocContent === 'function') hwText = window.vfs.getHomeworkDocContent();
      }
      const extracted = hwText ? this.extractBasicFromText(hwText) : AppQBasic.SAMPLES['HOMEWORK.BAS'];
      this.setEditorCode('HOMEWORK.BAS', extracted);
    } else if (act === 'run') {
      this.runProgram();
    } else if (act === 'OutputScreen') {
      screenEl.classList.toggle('active');
    } else if (act === 'open') {
      if (window.appFileDialog) {
        window.appFileDialog.open({
          mode: 'open',
          title: this.L('Открыть программу QBasic', 'Open QBasic Program'),
          initialPath: this.currentDir,
          filters: [
            { label: 'QBasic Programs (*.bas; *.txt)', extensions: ['bas', 'txt'] },
            { label: 'All Files (*.*)', extensions: ['*'] }
          ],
          onConfirm: (path, fileName, item) => {
            this.currentDir = [...path];
            const content = (item && item.content) ? this.extractBasicFromText(item.content) : '';
            this.setEditorCode(fileName, content);
          }
        });
      }
    } else if (act === 'save') {
      this.saveFile(false);
    } else if (act === 'saveas') {
      this.saveFile(true);
    } else if (act === 'syntax') {
      window.winManager.openDialog({
        title: 'Microslop QBasic 1.1 Help',
        icon: 'qbasic',
        message: `<b>Справочник команд QBasic 1.1:</b><br><br>` +
          `<code>CLS</code> — очистка экрана<br>` +
          `<code>PRINT "Текст"; X</code> — вывод текста и выражений<br>` +
          `<code>INPUT "Вопрос"; A$</code> — ввод с клавиатуры<br>` +
          `<code>COLOR fg, bg</code> — цвет текста VGA (0..15)<br>` +
          `<code>FOR I = 1 TO 10 ... NEXT I</code> — цикл<br>` +
          `<code>IF X = 5 THEN ... ELSE ...</code> — условие<br>` +
          `<code>GOTO 10</code> / <code>GOSUB 100 ... RETURN</code> — переходы<br>` +
          `<code>SCREEN 13</code> — графический режим VGA 320x200<br>` +
          `<code>PSET (x, y), c</code> — точка на холсте<br>` +
          `<code>LINE (x1, y1)-(x2, y2), c, B|BF</code> — линия / прямоугольник<br>` +
          `<code>CIRCLE (x, y), r, c</code> — окружность<br>` +
          `<code>SOUND freq, dur</code> / <code>PLAY "O4L8CDEFG"</code> — звук PC Speaker`
      });
    } else if (act === 'about') {
      window.winManager.openDialog({
        title: 'About Microslop QBasic',
        icon: 'qbasic',
        message: `<b>Microslop(R) QBasic(TM) Version 1.1</b><br>Copyright (C) Microslop Corp. 1987-1998.<br><br>Интегрированная среда разработки и интерпретатор языка BASIC для Microslop Win 98.`
      });
    } else if (act === 'exit') {
      window.winManager.closeWindow(AppQBasic.WIN_ID);
    }
  }

  saveFile(forceDialog = false) {
    if (!this.win || !window.vfs) return;
    const editor = this.win.element.querySelector('#qb_code');
    const code = editor ? editor.value : '';

    const writeToVfs = (dir, name) => {
      const cleanName = name.endsWith('.bas') || name.endsWith('.BAS') || name.endsWith('.txt') ? name : `${name}.BAS`;
      window.vfs.writeFile(dir, cleanName, code);
      const node = window.vfs.resolvePath([...dir, cleanName]);
      if (node) {
        node.icon = 'file-bas';
        node.app = 'qbasic';
        window.vfs.saveToStorage();
      }
      this.currentDir = [...dir];
      this.currentFileName = cleanName.toUpperCase();
      this.updateTitleAndCursor();
      if (window.soundSys) window.soundSys.playDing();
    };

    if (!forceDialog && this.currentFileName && this.currentFileName !== 'UNTITLED.BAS') {
      writeToVfs(this.currentDir, this.currentFileName);
      return;
    }

    if (window.appFileDialog) {
      window.appFileDialog.open({
        mode: 'save',
        title: this.L('Сохранить программу QBasic', 'Save QBasic Program'),
        initialPath: this.currentDir,
        defaultName: this.currentFileName || 'PROGRAM.BAS',
        filters: [{ label: 'QBasic Program (*.BAS)', extensions: ['bas'] }],
        onConfirm: (path, fileName) => writeToVfs(path, fileName)
      });
    } else {
      writeToVfs(this.currentDir, this.currentFileName || 'PROGRAM.BAS');
    }
  }

  stopExecution() {
    this.running = false;
    this.runToken++;
    if (this.inputResolver) {
      const r = this.inputResolver;
      this.inputResolver = null;
      r(null);
    }
  }

  async runImmediateLine(line, outEl) {
    const env = this.createEnv();
    env.printCallback = (text, newline) => {
      outEl.textContent += text + (newline ? '\n' : '');
      outEl.scrollTop = outEl.scrollHeight;
    };
    env.clsCallback = () => {
      outEl.textContent = '';
    };
    outEl.textContent = `> ${line}\n`;
    try {
      await this.execStatement(line, env, ++this.runToken);
    } catch (err) {
      outEl.textContent += `Syntax error: ${err.message || err}\n`;
    }
  }

  createEnv() {
    const canvas = this.win ? this.win.element.querySelector('#qb_vga_canvas') : null;
    const ctx = canvas ? canvas.getContext('2d') : null;
    const consoleEl = this.win ? this.win.element.querySelector('#qb_vga_console') : null;

    return {
      vars: {},
      forStack: [],
      gosubStack: [],
      pc: 0,
      jumped: false,
      halted: false,
      fg: 7,
      bg: 0,
      canvas,
      ctx,
      consoleEl,
      printCallback: (text, newline) => {
        if (!consoleEl) return;
        const span = document.createElement('span');
        span.style.color = AppQBasic.VGA_PALETTE[this.fgColor % 16] || '#ffffff';
        if (this.bgColor > 0) {
          span.style.backgroundColor = AppQBasic.VGA_PALETTE[this.bgColor % 16];
        }
        span.textContent = text + (newline ? '\n' : '');
        consoleEl.appendChild(span);
        consoleEl.scrollTop = consoleEl.scrollHeight;
      },
      clsCallback: () => {
        if (consoleEl) consoleEl.innerHTML = '';
        if (ctx && canvas) {
          ctx.fillStyle = AppQBasic.VGA_PALETTE[this.bgColor % 16] || '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    };
  }

  parseProgram(source) {
    const rawLines = String(source || '').split(/\r?\n/);
    const statements = [];
    const lineIndexMap = new Map();

    rawLines.forEach(raw => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      const match = /^(\d+)\s+(.*)$/.exec(trimmed);
      if (match) {
        const lineNum = parseInt(match[1], 10);
        const body = match[2].trim();
        if (!lineIndexMap.has(lineNum)) {
          lineIndexMap.set(lineNum, statements.length);
        }
        statements.push({ lineNum, code: body });
      } else {
        statements.push({ lineNum: null, code: trimmed });
      }
    });

    return { statements, lineIndexMap };
  }

  async runProgram() {
    if (!this.win) return;
    this.stopExecution();

    const el = this.win.element;
    const editor = el.querySelector('#qb_code');
    const screenEl = el.querySelector('#qb_screen');
    const statusEl = el.querySelector('#qb_vga_status');
    const code = editor ? editor.value : '';

    this.fgColor = 7;
    this.bgColor = 0;
    this.screenMode = 0;

    screenEl.classList.add('active');
    if (statusEl) {
      statusEl.textContent = this.L('Выполнение программы... (ESC — прервать)', 'Running program... (ESC to break)');
    }

    const token = ++this.runToken;
    this.running = true;
    const env = this.createEnv();
    env.clsCallback();

    const { statements, lineIndexMap } = this.parseProgram(code);
    env.statements = statements;
    env.lineIndexMap = lineIndexMap;

    let steps = 0;
    const maxSteps = 25000;

    try {
      while (this.running && token === this.runToken && !env.halted && env.pc < statements.length) {
        const stmt = statements[env.pc];
        env.jumped = false;
        await this.execStatement(stmt.code, env, token);
        if (!env.jumped) {
          env.pc++;
        }
        steps++;
        if (steps % 250 === 0) {
          await new Promise(r => setTimeout(r, 0));
        }
        if (steps > maxSteps) {
          env.printCallback('\n[Break: Maximum loop iterations reached]', true);
          break;
        }
      }
    } catch (err) {
      env.printCallback(`\nRuntime error: ${err.message || err}`, true);
    }

    if (token === this.runToken) {
      this.running = false;
      if (statusEl) {
        statusEl.textContent = this.L('Нажмите любую клавишу или кликните здесь для продолжения', 'Press any key or click here to continue');
      }
    }
  }

  async execStatement(rawLine, env, token) {
    if (!rawLine || token !== this.runToken) return;
    const line = rawLine.trim();
    if (!line || line.startsWith("'") || /^REM\b/i.test(line)) return;

    const upper = line.toUpperCase();

    if (upper === 'CLS') {
      env.clsCallback();
      return;
    }

    if (upper === 'END' || upper === 'STOP' || upper === 'SYSTEM') {
      env.halted = true;
      return;
    }

    if (upper === 'BEEP') {
      if (window.soundSys) window.soundSys.playSpeakerBeep(800, 0.12, 'square', 0.09);
      return;
    }

    if (/^SCREEN\b/i.test(line)) {
      const arg = line.replace(/^SCREEN\b/i, '').trim();
      this.screenMode = Number(this.evalExpr(arg, env)) || 0;
      return;
    }

    if (/^COLOR\b/i.test(line)) {
      const rest = line.replace(/^COLOR\b/i, '').trim();
      const parts = rest.split(',');
      if (parts[0] && parts[0].trim() !== '') {
        this.fgColor = Math.max(0, Math.floor(Number(this.evalExpr(parts[0], env)) || 0));
      }
      if (parts[1] && parts[1].trim() !== '') {
        this.bgColor = Math.max(0, Math.floor(Number(this.evalExpr(parts[1], env)) || 0));
      }
      return;
    }

    if (/^SOUND\b/i.test(line)) {
      const rest = line.replace(/^SOUND\b/i, '').trim();
      const parts = rest.split(',');
      const freq = Math.max(37, Math.min(8000, Number(this.evalExpr(parts[0] || '440', env)) || 440));
      const ticks = Math.max(0.5, Math.min(36, Number(this.evalExpr(parts[1] || '2', env)) || 2));
      const durSec = Math.min(1.2, ticks / 18.2);
      if (window.soundSys) {
        window.soundSys.playSpeakerBeep(freq, durSec, 'square', 0.08);
      }
      await new Promise(r => setTimeout(r, durSec * 1000));
      return;
    }

    if (/^PLAY\b/i.test(line)) {
      const rest = line.replace(/^PLAY\b/i, '').trim();
      const melody = String(this.evalExpr(rest, env) || '');
      await this.playMmlString(melody, token);
      return;
    }

    if (/^SLEEP\b/i.test(line)) {
      const rest = line.replace(/^SLEEP\b/i, '').trim();
      const secs = Math.min(3, Math.max(0.1, Number(this.evalExpr(rest || '1', env)) || 1));
      await new Promise(r => setTimeout(r, secs * 1000));
      return;
    }

    if (/^PSET\b/i.test(line)) {
      const m = /^PSET\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*(?:,\s*(.+))?$/i.exec(line);
      if (m && env.ctx) {
        const x = Math.round(Number(this.evalExpr(m[1], env)) || 0);
        const y = Math.round(Number(this.evalExpr(m[2], env)) || 0);
        const c = m[3] !== undefined ? Math.floor(Number(this.evalExpr(m[3], env)) || 15) : this.fgColor;
        env.ctx.fillStyle = AppQBasic.VGA_PALETTE[Math.abs(c) % 16];
        env.ctx.fillRect(x, y, 2, 2);
      }
      return;
    }

    if (/^LINE\b/i.test(line)) {
      const m = /^LINE\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*-\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*(?:,\s*([^,]+))?(?:\s*,\s*(BF|B))?$/i.exec(line);
      if (m && env.ctx) {
        const x1 = Math.round(Number(this.evalExpr(m[1], env)) || 0);
        const y1 = Math.round(Number(this.evalExpr(m[2], env)) || 0);
        const x2 = Math.round(Number(this.evalExpr(m[3], env)) || 0);
        const y2 = Math.round(Number(this.evalExpr(m[4], env)) || 0);
        const c = m[5] !== undefined ? Math.floor(Number(this.evalExpr(m[5], env)) || 15) : this.fgColor;
        const mode = (m[6] || '').toUpperCase();
        const colorHex = AppQBasic.VGA_PALETTE[Math.abs(c) % 16];
        env.ctx.fillStyle = colorHex;
        env.ctx.strokeStyle = colorHex;
        env.ctx.lineWidth = 1;
        const rx = Math.min(x1, x2);
        const ry = Math.min(y1, y2);
        const rw = Math.abs(x2 - x1);
        const rh = Math.abs(y2 - y1);
        if (mode === 'BF') {
          env.ctx.fillRect(rx, ry, rw + 1, rh + 1);
        } else if (mode === 'B') {
          env.ctx.strokeRect(rx + 0.5, ry + 0.5, rw, rh);
        } else {
          env.ctx.beginPath();
          env.ctx.moveTo(x1, y1);
          env.ctx.lineTo(x2, y2);
          env.ctx.stroke();
        }
      }
      return;
    }

    if (/^CIRCLE\b/i.test(line)) {
      const m = /^CIRCLE\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*,\s*([^,]+)(?:\s*,\s*(.+))?$/i.exec(line);
      if (m && env.ctx) {
        const cx = Number(this.evalExpr(m[1], env)) || 0;
        const cy = Number(this.evalExpr(m[2], env)) || 0;
        const r = Math.max(1, Number(this.evalExpr(m[3], env)) || 1);
        const c = m[4] !== undefined ? Math.floor(Number(this.evalExpr(m[4], env)) || 15) : this.fgColor;
        env.ctx.strokeStyle = AppQBasic.VGA_PALETTE[Math.abs(c) % 16];
        env.ctx.lineWidth = 1.2;
        env.ctx.beginPath();
        env.ctx.arc(cx, cy, r, 0, Math.PI * 2);
        env.ctx.stroke();
      }
      return;
    }

    if (/^(PRINT|\?)\b/i.test(line) || line.startsWith('?')) {
      const rest = line.replace(/^(PRINT|\?)\s*/i, '');
      this.execPrint(rest, env);
      return;
    }

    if (/^INPUT\b/i.test(line)) {
      await this.execInput(line.replace(/^INPUT\s*/i, ''), env, token);
      return;
    }

    if (/^IF\b/i.test(line)) {
      const m = /^IF\s+(.+?)\s+THEN\s+(.*)$/i.exec(line);
      if (m) {
        const condStr = m[1];
        const rest = m[2];
        let thenBranch = rest;
        let elseBranch = null;
        const elseIdx = this.findTopLevelKeyword(rest, 'ELSE');
        if (elseIdx !== -1) {
          thenBranch = rest.slice(0, elseIdx).trim();
          elseBranch = rest.slice(elseIdx + 4).trim();
        }
        const truthy = this.evalCondition(condStr, env);
        const chosen = truthy ? thenBranch : elseBranch;
        if (chosen) {
          if (/^\d+$/.test(chosen)) {
            this.jumpToLine(parseInt(chosen, 10), env);
          } else {
            await this.execStatement(chosen, env, token);
          }
        }
      }
      return;
    }

    if (/^GOTO\b/i.test(line)) {
      const target = parseInt(line.replace(/^GOTO\s*/i, '').trim(), 10);
      this.jumpToLine(target, env);
      return;
    }

    if (/^GOSUB\b/i.test(line)) {
      const target = parseInt(line.replace(/^GOSUB\s*/i, '').trim(), 10);
      env.gosubStack.push(env.pc + 1);
      this.jumpToLine(target, env);
      return;
    }

    if (upper === 'RETURN') {
      if (env.gosubStack.length > 0) {
        env.pc = env.gosubStack.pop();
        env.jumped = true;
      }
      return;
    }

    if (/^FOR\b/i.test(line)) {
      const m = /^FOR\s+([A-Za-z_]\w*)\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/i.exec(line);
      if (m) {
        const varName = m[1].toUpperCase();
        const startVal = Number(this.evalExpr(m[2], env)) || 0;
        const endVal = Number(this.evalExpr(m[3], env)) || 0;
        const stepVal = m[4] !== undefined ? (Number(this.evalExpr(m[4], env)) || 1) : 1;
        env.vars[varName] = startVal;
        env.forStack = env.forStack.filter(f => f.varName !== varName);
        env.forStack.push({
          varName,
          endVal,
          stepVal,
          loopPc: env.pc + 1
        });
      }
      return;
    }

    if (/^NEXT\b/i.test(line)) {
      const varArg = line.replace(/^NEXT\s*/i, '').trim().toUpperCase();
      let frameIdx = env.forStack.length - 1;
      if (varArg) {
        for (let i = env.forStack.length - 1; i >= 0; i--) {
          if (env.forStack[i].varName === varArg) {
            frameIdx = i;
            break;
          }
        }
      }
      const frame = env.forStack[frameIdx];
      if (frame) {
        env.vars[frame.varName] = (Number(env.vars[frame.varName]) || 0) + frame.stepVal;
        const cur = env.vars[frame.varName];
        const keepGoing = frame.stepVal >= 0 ? cur <= frame.endVal : cur >= frame.endVal;
        if (keepGoing) {
          env.pc = frame.loopPc;
          env.jumped = true;
        } else {
          env.forStack.splice(frameIdx, 1);
        }
      }
      return;
    }

    const assignLine = line.replace(/^LET\s+/i, '');
    const assignMatch = /^([A-Za-z_]\w*\$?)\s*=\s*(.*)$/.exec(assignLine);
    if (assignMatch) {
      const varName = assignMatch[1].toUpperCase();
      const val = this.evalExpr(assignMatch[2], env);
      env.vars[varName] = val;
    }
  }

  jumpToLine(lineNum, env) {
    if (env.lineIndexMap && env.lineIndexMap.has(lineNum)) {
      env.pc = env.lineIndexMap.get(lineNum);
      env.jumped = true;
    }
  }

  findTopLevelKeyword(str, keyword) {
    let inQuotes = false;
    const kwLen = keyword.length;
    for (let i = 0; i <= str.length - kwLen; i++) {
      if (str[i] === '"') inQuotes = !inQuotes;
      if (!inQuotes && str.slice(i, i + kwLen).toUpperCase() === keyword) {
        const before = i === 0 || /\s/.test(str[i - 1]);
        const after = i + kwLen === str.length || /\s/.test(str[i + kwLen]);
        if (before && after) return i;
      }
    }
    return -1;
  }

  execPrint(rest, env) {
    if (!rest.trim()) {
      env.printCallback('', true);
      return;
    }
    const tokens = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < rest.length; i++) {
      const ch = rest[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        current += ch;
      } else if (!inQuotes && (ch === ';' || ch === ',')) {
        if (current.trim()) tokens.push({ type: 'expr', val: current.trim() });
        tokens.push({ type: 'sep', val: ch });
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim()) {
      tokens.push({ type: 'expr', val: current.trim() });
    }

    let out = '';
    let trailingSep = false;
    tokens.forEach((tk, idx) => {
      if (tk.type === 'expr') {
        const v = this.evalExpr(tk.val, env);
        out += String(v !== undefined && v !== null ? v : '');
        trailingSep = false;
      } else if (tk.type === 'sep') {
        if (tk.val === ',') out += '\t';
        if (idx === tokens.length - 1) trailingSep = true;
      }
    });

    env.printCallback(out, !trailingSep);
  }

  async execInput(rest, env, token) {
    let promptText = '? ';
    let varName = 'X$';
    const m = /^(?:"([^"]*)"\s*[;,]?\s*)?([A-Za-z_]\w*\$?)$/i.exec(rest.trim());
    if (m) {
      if (m[1] !== undefined) promptText = `${m[1]}? `;
      varName = m[2].toUpperCase();
    }

    if (!env.consoleEl) {
      env.vars[varName] = varName.endsWith('$') ? 'USER' : 12;
      return;
    }

    const row = document.createElement('div');
    row.className = 'qb-vga-prompt-row';
    const label = document.createElement('span');
    label.style.color = AppQBasic.VGA_PALETTE[this.fgColor % 16] || '#ffffff';
    label.textContent = promptText;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'qb-vga-prompt-input';
    row.appendChild(label);
    row.appendChild(input);
    env.consoleEl.appendChild(row);
    env.consoleEl.scrollTop = env.consoleEl.scrollHeight;
    setTimeout(() => input.focus(), 20);

    const userVal = await new Promise(resolve => {
      this.inputResolver = resolve;
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.inputResolver = null;
          resolve(input.value);
        }
      });
    });

    if (token !== this.runToken || userVal === null) return;
    input.disabled = true;
    const br = document.createElement('span');
    br.textContent = '\n';
    env.consoleEl.appendChild(br);

    if (varName.endsWith('$')) {
      env.vars[varName] = String(userVal);
    } else {
      env.vars[varName] = Number(userVal) || 0;
    }
  }

  evalCondition(condStr, env) {
    const ops = ['<>', '<=', '>=', '=', '<', '>'];
    let inQuotes = false;
    for (const op of ops) {
      for (let i = 0; i <= condStr.length - op.length; i++) {
        if (condStr[i] === '"') inQuotes = !inQuotes;
        if (!inQuotes && condStr.slice(i, i + op.length) === op) {
          const left = this.evalExpr(condStr.slice(0, i), env);
          const right = this.evalExpr(condStr.slice(i + op.length), env);
          if (op === '=') return left == right;
          if (op === '<>') return left != right;
          if (op === '<') return left < right;
          if (op === '>') return left > right;
          if (op === '<=') return left <= right;
          if (op === '>=') return left >= right;
        }
      }
    }
    return Boolean(this.evalExpr(condStr, env));
  }

  evalExpr(expr, env) {
    const trimmed = String(expr || '').trim();
    if (!trimmed) return 0;

    if (/^"[^"]*"$/.test(trimmed)) {
      return trimmed.slice(1, -1);
    }

    if (/^[A-Za-z_]\w*\$$/.test(trimmed)) {
      const k = trimmed.toUpperCase();
      return env.vars[k] !== undefined ? env.vars[k] : '';
    }

    const strings = [];
    let safe = trimmed.replace(/"([^"]*)"/g, (_, s) => {
      strings.push(s);
      return `__STR${strings.length - 1}__`;
    });

    safe = safe
      .replace(/\bMOD\b/gi, '%')
      .replace(/\^/g, '**')
      .replace(/\bRND\b/gi, 'Math.random()')
      .replace(/\bINT\s*\(/gi, 'Math.floor(')
      .replace(/\bABS\s*\(/gi, 'Math.abs(')
      .replace(/\bSQR\s*\(/gi, 'Math.sqrt(')
      .replace(/\bSIN\s*\(/gi, 'Math.sin(')
      .replace(/\bCOS\s*\(/gi, 'Math.cos(');

    safe = safe.replace(/\b([A-Za-z_]\w*\$?)\b/g, (id) => {
      if (id.startsWith('__STR') || id === 'Math' || id === 'random' || id === 'floor' || id === 'abs' || id === 'sqrt' || id === 'sin' || id === 'cos') {
        return id;
      }
      const key = id.toUpperCase();
      const val = env.vars[key];
      if (key.endsWith('$')) {
        return JSON.stringify(val !== undefined ? String(val) : '');
      }
      return val !== undefined ? Number(val) || 0 : 0;
    });

    safe = safe.replace(/__STR(\d+)__/g, (_, idx) => JSON.stringify(strings[Number(idx)] || ''));

    try {
      return Function(`"use strict"; return (${safe});`)();
    } catch (e) {
      return 0;
    }
  }

  async playMmlString(mml, token) {
    const notesFreq = {
      C: 261.63, D: 293.66, E: 329.63, F: 349.23,
      G: 392.00, A: 440.00, B: 493.88
    };
    let octave = 4;
    let length = 8;
    const upper = String(mml || '').toUpperCase();
    for (let i = 0; i < upper.length; i++) {
      if (token !== this.runToken) return;
      const ch = upper[i];
      if (ch === 'O' && /\d/.test(upper[i + 1])) {
        octave = parseInt(upper[++i], 10);
      } else if (ch === 'L' && /\d/.test(upper[i + 1])) {
        let num = '';
        while (/\d/.test(upper[i + 1])) num += upper[++i];
        length = Math.max(1, parseInt(num, 10) || 8);
      } else if (notesFreq[ch]) {
        const base = notesFreq[ch];
        const freq = base * Math.pow(2, octave - 4);
        const dur = Math.max(0.06, 1.4 / length);
        if (window.soundSys) {
          window.soundSys.playSpeakerBeep(freq, dur * 0.85, 'square', 0.08);
        }
        await new Promise(r => setTimeout(r, dur * 1000));
      } else if (ch === 'P') {
        await new Promise(r => setTimeout(r, 120));
      }
    }
  }
}

window.appQBasic = new AppQBasic();
