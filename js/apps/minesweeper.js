const MinesweeperArt = (() => {
  const colors = {
    k: '#000000', w: '#ffffff', s: '#c0c0c0', g: '#808080', r: '#ff0000', y: '#ffff00',
    1: '#0000ff', 2: '#008000', 3: '#ff0000', 4: '#000080', 5: '#800000', 6: '#008080', 7: '#000000', 8: '#808080'
  };

  const digits = {
    1: ['...###...', '..####...', '.#####...', '...###...', '...###...', '...###...', '...###...', '...###...', '.#######.', '.#######.'],
    2: ['.#######.', '#########', '###...###', '.....####', '...#####.', '.#####...', '####.....', '###......', '#########', '#########'],
    3: ['########.', '#########', '......###', '......###', '..######.', '..######.', '......###', '......###', '#########', '########.'],
    4: ['....####.', '...#####.', '..###.##.', '.###..##.', '###...##.', '#########', '#########', '......##.', '......##.', '......##.'],
    5: ['#########', '#########', '###......', '###......', '########.', '#########', '......###', '......###', '#########', '########.'],
    6: ['.#######.', '########.', '###......', '###......', '########.', '#########', '###...###', '###...###', '#########', '.#######.'],
    7: ['#########', '#########', '......###', '.....###.', '....###..', '...###...', '..###....', '..###....', '..###....', '..###....'],
    8: ['.#######.', '#########', '###...###', '###...###', '.#######.', '.#######.', '###...###', '###...###', '#########', '.#######.']
  };

  const mine = [
    '................',
    '................',
    '........k.......',
    '........k.......',
    '....k.kkkkk.k...',
    '.....kkkkkkk....',
    '....kkwwkkkkk...',
    '....kkwwkkkkk...',
    '..kkkkkkkkkkkkk.',
    '....kkkkkkkkk...',
    '....kkkkkkkkk...',
    '.....kkkkkkk....',
    '....k.kkkkk.k...',
    '........k.......',
    '........k.......',
    '................'
  ];

  const flag = [
    '................',
    '................',
    '................',
    '......rrk.......',
    '....rrrrk.......',
    '...rrrrrk.......',
    '....rrrrk.......',
    '......rrk.......',
    '........k.......',
    '........k.......',
    '......kkkk......',
    '....kkkkkkkk....',
    '....kkkkkkkk....',
    '................',
    '................',
    '................'
  ];

  const question = [
    '................',
    '................',
    '................',
    '.....kkkkk......',
    '....kk...kk.....',
    '....kk...kk.....',
    '.........kk.....',
    '........kk......',
    '.......kk.......',
    '.......kk.......',
    '................',
    '.......kk.......',
    '.......kk.......',
    '................',
    '................',
    '................'
  ];

  const cross = [
    '................',
    '................',
    '..r.........r...',
    '...r.......r....',
    '....r.....r.....',
    '.....r...r......',
    '......r.r.......',
    '.......r........',
    '......r.r.......',
    '.....r...r......',
    '....r.....r.....',
    '...r.......r....',
    '..r.........r...',
    '................',
    '................',
    '................'
  ];

  const faceOutline = [
    '......kkkkk......',
    '....kkyyyyykk....',
    '...kyyyyyyyyyk...',
    '..kyyyyyyyyyyyk..',
    '.kyyyyyyyyyyyyyk.',
    '.kyyyyyyyyyyyyyk.',
    'kyyyyyyyyyyyyyyyk',
    'kyyyyyyyyyyyyyyyk',
    'kyyyyyyyyyyyyyyyk',
    'kyyyyyyyyyyyyyyyk',
    'kyyyyyyyyyyyyyyyk',
    '.kyyyyyyyyyyyyyk.',
    '.kyyyyyyyyyyyyyk.',
    '..kyyyyyyyyyyyk..',
    '...kyyyyyyyyyk...',
    '....kkyyyyykk....',
    '......kkkkk......'
  ];

  const faces = {
    smile: ['5,5', '6,5', '5,6', '6,6', '10,5', '11,5', '10,6', '11,6', '4,10', '12,10', '5,11', '11,11', '6,12', '7,12', '8,12', '9,12', '10,12'],
    oh: ['5,5', '6,5', '5,6', '6,6', '10,5', '11,5', '10,6', '11,6', '7,10', '8,10', '9,10', '6,11', '10,11', '6,12', '10,12', '7,13', '8,13', '9,13'],
    dead: ['4,4', '6,4', '5,5', '4,6', '6,6', '10,4', '12,4', '11,5', '10,6', '12,6', '6,11', '7,11', '8,11', '9,11', '10,11', '5,12', '11,12', '4,13', '12,13'],
    cool: ['1,5', '2,5', '3,5', '4,5', '5,5', '6,5', '7,5', '8,5', '9,5', '10,5', '11,5', '12,5', '13,5', '14,5', '15,5',
      '3,6', '4,6', '5,6', '6,6', '7,6', '9,6', '10,6', '11,6', '12,6', '13,6', '4,7', '5,7', '6,7', '10,7', '11,7', '12,7',
      '4,10', '12,10', '5,11', '11,11', '6,12', '7,12', '8,12', '9,12', '10,12']
  };

  const segments = {
    a: [[1, 2, 10], [2, 3, 9], [3, 4, 8]],
    d: [[21, 2, 10], [20, 3, 9], [19, 4, 8]],
    g: [[10, 3, 9], [11, 2, 10], [12, 3, 9]],
    f: [[1, 3, 9], [2, 4, 9], [3, 5, 8]],
    b: [[11, 3, 9], [10, 4, 9], [9, 5, 8]],
    e: [[1, 13, 19], [2, 13, 18], [3, 14, 17]],
    c: [[11, 13, 19], [10, 13, 18], [9, 14, 17]]
  };

  const ledMap = {
    0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g'
  };

  const canvas = (w, h, draw) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'));
    return c;
  };

  const paintRows = (ctx, rows, ox = 0, oy = 0, palette = colors) => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || !palette[ch]) continue;
        ctx.fillStyle = palette[ch];
        ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    });
  };

  const raised = (ctx, x, y, w, h, size) => {
    ctx.fillStyle = colors.w;
    for (let i = 0; i < size; i++) {
      ctx.fillRect(x, y + i, w - i - 1, 1);
      ctx.fillRect(x + i, y, 1, h - i - 1);
    }
    ctx.fillStyle = colors.g;
    for (let i = 0; i < size; i++) {
      ctx.fillRect(x + i + 1, y + h - 1 - i, w - i - 1, 1);
      ctx.fillRect(x + w - 1 - i, y + i + 1, 1, h - i - 1);
    }
  };

  const sunken = (ctx, x, y, w, h, size) => {
    ctx.fillStyle = colors.g;
    for (let i = 0; i < size; i++) {
      ctx.fillRect(x, y + i, w - i - 1, 1);
      ctx.fillRect(x + i, y, 1, h - i - 1);
    }
    ctx.fillStyle = colors.w;
    for (let i = 0; i < size; i++) {
      ctx.fillRect(x + i + 1, y + h - 1 - i, w - i - 1, 1);
      ctx.fillRect(x + w - 1 - i, y + i + 1, 1, h - i - 1);
    }
  };

  let cache = null;

  const build = () => {
    const tile = (fn) => canvas(16, 16, fn);
    const openBase = (ctx, bg = colors.s) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = colors.g;
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 0, 1, 16);
    };
    const closedBase = (ctx) => {
      ctx.fillStyle = colors.s;
      ctx.fillRect(0, 0, 16, 16);
      raised(ctx, 0, 0, 16, 16, 2);
    };
    const tiles = {
      closed: tile(closedBase),
      open: tile(ctx => openBase(ctx)),
      flag: tile(ctx => { closedBase(ctx); paintRows(ctx, flag); }),
      question: tile(ctx => { closedBase(ctx); paintRows(ctx, question); }),
      questionPressed: tile(ctx => { openBase(ctx); paintRows(ctx, question, 1, 1); }),
      mine: tile(ctx => { openBase(ctx); paintRows(ctx, mine); }),
      exploded: tile(ctx => { openBase(ctx, colors.r); paintRows(ctx, mine); }),
      wrong: tile(ctx => { openBase(ctx); paintRows(ctx, mine); paintRows(ctx, cross); })
    };
    for (let n = 1; n <= 8; n++) {
      tiles['n' + n] = tile(ctx => {
        openBase(ctx);
        paintRows(ctx, digits[n], 4, 3, { '#': colors[n] });
      });
    }
    const led = {};
    Object.keys(ledMap).forEach(ch => {
      led[ch] = canvas(13, 23, ctx => {
        ctx.fillStyle = colors.k;
        ctx.fillRect(0, 0, 13, 23);
        Object.keys(segments).forEach(seg => {
          ctx.fillStyle = ledMap[ch].includes(seg) ? '#ff0000' : '#800000';
          const horizontal = seg === 'a' || seg === 'd' || seg === 'g';
          segments[seg].forEach(([fixed, from, to]) => {
            for (let p = from; p <= to; p++) {
              if (horizontal) ctx.fillRect(p, fixed, 1, 1);
              else ctx.fillRect(fixed, p, 1, 1);
            }
          });
        });
      });
    });
    const face = {};
    const drawFace = (ctx, kind, pressed) => {
      ctx.fillStyle = colors.s;
      ctx.fillRect(0, 0, 26, 26);
      ctx.fillStyle = colors.g;
      ctx.fillRect(0, 0, 26, 1);
      ctx.fillRect(0, 25, 26, 1);
      ctx.fillRect(0, 0, 1, 26);
      ctx.fillRect(25, 0, 1, 26);
      if (pressed) {
        ctx.fillRect(1, 1, 24, 1);
        ctx.fillRect(1, 1, 1, 24);
      } else {
        raised(ctx, 1, 1, 24, 24, 2);
      }
      const o = pressed ? 5 : 4;
      paintRows(ctx, faceOutline, o, o);
      ctx.fillStyle = colors.k;
      faces[kind].forEach(p => {
        const [x, y] = p.split(',').map(Number);
        ctx.fillRect(o + x, o + y, 1, 1);
      });
    };
    Object.keys(faces).forEach(kind => {
      face[kind] = canvas(26, 26, ctx => drawFace(ctx, kind, false));
    });
    face.pressed = canvas(26, 26, ctx => drawFace(ctx, 'smile', true));
    return { tiles, led, face };
  };

  return {
    get() {
      if (!cache) cache = build();
      return cache;
    },
    raised,
    sunken
  };
})();

class AppMinesweeper {
  constructor() {
    this.rows = 9;
    this.cols = 9;
    this.totalMines = 10;
    this.difficulty = 'beginner';
    this.board = [];
    this.gameState = 'ready';
    this.timer = 0;
    this.timerInterval = null;
    this.flagsLeft = 10;
    this.marks = true;
    this.color = true;
    this.sound = false;
    this.custom = { rows: 16, cols: 30, mines: 99 };
    this.win = null;
    this.pressed = null;
    this.buttons = 0;
    this.facePressed = false;
    this.loadPrefs();
  }

  t(key, ...args) {
    return window.i18n ? window.i18n.t(key, ...args) : key;
  }

  loadPrefs() {
    try {
      const raw = localStorage.getItem('win98_minesweeper_prefs');
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p.custom) this.custom = p.custom;
      if (typeof p.marks === 'boolean') this.marks = p.marks;
      if (typeof p.color === 'boolean') this.color = p.color;
      if (typeof p.sound === 'boolean') this.sound = p.sound;
      if (p.difficulty) this.applyDifficulty(p.difficulty);
    } catch (e) {}
  }

  savePrefs() {
    try {
      localStorage.setItem('win98_minesweeper_prefs', JSON.stringify({
        difficulty: this.difficulty, custom: this.custom, marks: this.marks, color: this.color, sound: this.sound
      }));
    } catch (e) {}
  }

  open() {
    if (window.winManager.windows.has('app_minesweeper')) {
      window.winManager.createWindow({ id: 'app_minesweeper' });
      return;
    }
    this.win = window.winManager.createWindow({
      id: 'app_minesweeper',
      title: this.t('mine.title'),
      icon: 'minesweeper',
      width: 180,
      height: 270,
      resizable: false,
      content: `<div class="ms-container">${this.buildMenu()}<canvas class="ms-canvas"></canvas></div>`
    });
    this.canvas = this.win.element.querySelector('.ms-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.attachEvents();
    this.resetGame();
  }

  buildMenu() {
    const check = (on) => on ? ' is-checked' : '';
    const d = this.difficulty;
    return `
      <div class="win-menubar ms-menubar">
        <div class="win-menu-item">${this.t('mine.menuGame')}
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option" data-cmd="new">${this.t('mine.menuNew')} <span>F2</span></div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option${check(d === 'beginner')}" data-cmd="beginner">${this.t('mine.diffBeginner')}</div>
            <div class="win-dropdown-option${check(d === 'intermediate')}" data-cmd="intermediate">${this.t('mine.diffIntermediate')}</div>
            <div class="win-dropdown-option${check(d === 'expert')}" data-cmd="expert">${this.t('mine.diffExpert')}</div>
            <div class="win-dropdown-option${check(d === 'custom')}" data-cmd="custom">${this.t('mine.diffCustom')}</div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option${check(this.marks)}" data-cmd="marks">${this.t('mine.menuMarks')}</div>
            <div class="win-dropdown-option${check(this.color)}" data-cmd="color">${this.t('mine.menuColor')}</div>
            <div class="win-dropdown-option${check(this.sound)}" data-cmd="sound">${this.t('mine.menuSound')}</div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option" data-cmd="best">${this.t('mine.menuBestTimes')}</div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option" data-cmd="exit">${this.t('mine.menuExit')}</div>
          </div>
        </div>
        <div class="win-menu-item">${this.t('mine.menuHelp')}
          <div class="win-menu-dropdown">
            <div class="win-dropdown-option" data-cmd="help">${this.t('mine.menuContents')} <span>F1</span></div>
            <div class="win-menu-separator"></div>
            <div class="win-dropdown-option" data-cmd="about">${this.t('mine.menuAbout')}</div>
          </div>
        </div>
      </div>`;
  }

  refreshMenu() {
    if (!this.win) return;
    const old = this.win.element.querySelector('.ms-menubar');
    const holder = document.createElement('div');
    holder.innerHTML = this.buildMenu();
    const menu = holder.firstElementChild;
    old.replaceWith(menu);
    this.bindMenu(menu);
  }

  bindMenu(root) {
    root.querySelectorAll('[data-cmd]').forEach(opt => {
      opt.addEventListener('click', () => this.command(opt.dataset.cmd));
    });
  }

  command(cmd) {
    if (cmd === 'new') this.resetGame();
    else if (['beginner', 'intermediate', 'expert'].includes(cmd)) this.setDifficulty(this.win, cmd);
    else if (cmd === 'custom') this.showCustomDialog();
    else if (cmd === 'marks' || cmd === 'color' || cmd === 'sound') {
      this[cmd] = !this[cmd];
      this.savePrefs();
      this.refreshMenu();
      this.draw();
    } else if (cmd === 'best') this.showBestTimesModal();
    else if (cmd === 'exit') window.winManager.closeWindow('app_minesweeper');
    else if (cmd === 'help') {
      if (window.appDialogs && window.appDialogs.openHelp) window.appDialogs.openHelp();
    } else if (cmd === 'about') {
      window.winManager.openDialog({ title: this.t('mine.menuAbout'), icon: 'minesweeper', message: this.t('mine.aboutText') });
    }
  }

  get width() {
    return this.cols * 16 + 24;
  }

  get height() {
    return this.rows * 16 + 67;
  }

  layout() {
    const w = this.width;
    return {
      face: { x: Math.floor((w - 26) / 2), y: 15 },
      mines: { x: 16, y: 15 },
      clock: { x: w - 16 - 41, y: 15 },
      boardX: 12,
      boardY: 55
    };
  }

  fitWindow() {
    if (!this.win || !this.canvas) return;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    const root = this.win.element.querySelector('.ms-container');
    const el = this.win.element;
    const w = this.width + 6;
    const h = root.querySelector('.ms-menubar').offsetHeight + this.height + 25;
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.minWidth = w + 'px';
    el.style.minHeight = h + 'px';
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth - 4) el.style.left = Math.max(0, window.innerWidth - w - 4) + 'px';
    if (rect.bottom > window.innerHeight - 32) el.style.top = Math.max(0, window.innerHeight - h - 32) + 'px';
  }

  attachEvents() {
    const el = this.win.element;
    this.bindMenu(el.querySelector('.ms-menubar'));
    const canvas = this.canvas;
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('mousedown', e => this.onDown(e));
    const onMove = e => this.onMove(e);
    const onUp = e => this.onUp(e);
    const onKey = e => {
      if (window.winManager.activeWindowId !== this.win.id) return;
      if (e.key === 'F2') {
        e.preventDefault();
        this.resetGame();
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('keydown', onKey);
    this.win.onClose = () => {
      this.stopTimer();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('keydown', onKey);
      this.win = null;
    };
  }

  point(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / rect.width;
    const sy = this.canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  cellAt(p) {
    const l = this.layout();
    const c = Math.floor((p.x - l.boardX) / 16);
    const r = Math.floor((p.y - l.boardY) / 16);
    if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) return null;
    return { r, c };
  }

  onFace(p) {
    const f = this.layout().face;
    return p.x >= f.x && p.x < f.x + 26 && p.y >= f.y && p.y < f.y + 26;
  }

  finished() {
    return this.gameState === 'won' || this.gameState === 'lost';
  }

  onDown(e) {
    e.preventDefault();
    const p = this.point(e);
    this.buttons = e.buttons || (e.button === 2 ? 2 : 1);
    if (e.button === 0 && this.onFace(p)) {
      this.facePressed = true;
      this.faceInside = true;
      this.draw();
      return;
    }
    if (this.finished()) return;
    const cell = this.cellAt(p);
    if (e.button === 2 && !(this.buttons & 1)) {
      if (cell) this.cycleMark(cell.r, cell.c);
      return;
    }
    this.chord = e.button === 1 || (this.buttons & 3) === 3;
    this.pressed = cell;
    this.tracking = true;
    this.draw();
  }

  onMove(e) {
    if (!this.win) return;
    if (this.facePressed) {
      const inside = this.onFace(this.point(e));
      if (inside !== this.faceInside) {
        this.faceInside = inside;
        this.draw();
      }
      return;
    }
    if (!this.tracking) return;
    const cell = this.cellAt(this.point(e));
    const same = cell && this.pressed && cell.r === this.pressed.r && cell.c === this.pressed.c;
    if (!same && (cell || this.pressed)) {
      this.pressed = cell;
      this.draw();
    }
  }

  onUp(e) {
    if (!this.win) return;
    if (this.facePressed) {
      this.facePressed = false;
      if (this.onFace(this.point(e))) this.resetGame();
      else this.draw();
      return;
    }
    if (!this.tracking) return;
    const cell = this.pressed;
    const chord = this.chord || (e.buttons & 3) !== 0 && e.button !== 1;
    this.tracking = false;
    this.pressed = null;
    this.chord = false;
    if (cell && !this.finished()) {
      if (chord) this.chordCell(cell.r, cell.c);
      else this.handleLeftClick(this.win, cell.r, cell.c);
    }
    this.draw();
  }

  cycleMark(r, c) {
    const cell = this.board[r][c];
    if (cell.isRevealed) return;
    if (cell.state === 'none') {
      cell.state = 'flag';
      this.flagsLeft--;
    } else if (cell.state === 'flag') {
      cell.state = this.marks ? 'question' : 'none';
      this.flagsLeft++;
    } else {
      cell.state = 'none';
    }
    this.draw();
  }

  handleRightClick(win, r, c) {
    if (this.finished()) return;
    this.cycleMark(r, c);
  }

  handleLeftClick(win, r, c) {
    if (this.finished()) return;
    const cell = this.board[r][c];
    if (cell.isRevealed || cell.state === 'flag') return;
    if (this.gameState === 'ready') this.startGame(r, c);
    if (cell.isMine) {
      this.gameOver(cell);
      return;
    }
    this.revealCell(r, c);
    this.checkWin();
  }

  chordCell(r, c) {
    const cell = this.board[r][c];
    if (!cell.isRevealed || !cell.neighborMines) return;
    let flags = 0;
    this.forEachNeighbor(r, c, (nr, nc) => { if (this.board[nr][nc].state === 'flag') flags++; });
    if (flags !== cell.neighborMines) return;
    let exploded = null;
    this.forEachNeighbor(r, c, (nr, nc) => {
      const n = this.board[nr][nc];
      if (n.isRevealed || n.state === 'flag') return;
      if (n.isMine) exploded = exploded || n;
      else this.revealCell(nr, nc);
    });
    if (exploded) this.gameOver(exploded);
    else this.checkWin();
  }

  resetGame() {
    this.stopTimer();
    this.timer = 0;
    this.flagsLeft = this.totalMines;
    this.gameState = 'ready';
    this.pressed = null;
    this.tracking = false;
    this.board = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push({ r, c, isMine: false, isRevealed: false, state: 'none', neighborMines: 0, exploded: false });
      }
      this.board.push(row);
    }
    this.fitWindow();
    this.draw();
  }

  startGame(firstR, firstC) {
    this.gameState = 'playing';
    let placed = 0;
    while (placed < this.totalMines) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      if ((r !== firstR || c !== firstC) && !this.board[r][c].isMine) {
        this.board[r][c].isMine = true;
        placed++;
      }
    }
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        let count = 0;
        this.forEachNeighbor(r, c, (nr, nc) => { if (this.board[nr][nc].isMine) count++; });
        this.board[r][c].neighborMines = count;
      }
    }
    this.startTimer();
  }

  revealCell(r, c) {
    const stack = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop();
      const cell = this.board[cr][cc];
      if (cell.isRevealed || cell.state === 'flag' || cell.isMine) continue;
      cell.isRevealed = true;
      if (cell.state === 'question') cell.state = 'none';
      if (cell.neighborMines === 0) {
        this.forEachNeighbor(cr, cc, (nr, nc) => stack.push([nr, nc]));
      }
    }
  }

  forEachNeighbor(r, c, callback) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) callback(nr, nc);
      }
    }
  }

  gameOver(explodedCell) {
    this.stopTimer();
    this.gameState = 'lost';
    explodedCell.exploded = true;
    if (this.sound && window.soundSys) window.soundSys.playExplosion();
    this.draw();
  }

  checkWin() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.board[r][c];
        if (!cell.isMine && !cell.isRevealed) return;
      }
    }
    this.stopTimer();
    this.gameState = 'won';
    this.flagsLeft = 0;
    this.board.forEach(row => row.forEach(cell => { if (cell.isMine) cell.state = 'flag'; }));
    if (this.sound && window.soundSys) window.soundSys.playDing();
    this.draw();
    if (this.difficulty !== 'custom') {
      const scores = this.getBestTimes();
      if (this.timer < scores[this.difficulty].time) setTimeout(() => this.promptRecord(), 150);
    }
  }

  startTimer() {
    this.stopTimer();
    this.timer = 1;
    this.tick();
    this.timerInterval = setInterval(() => {
      if (this.timer < 999) this.timer++;
      this.tick();
    }, 1000);
  }

  tick() {
    if (this.sound && window.soundSys && window.soundSys.playClick) window.soundSys.playClick();
    this.draw();
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  inPressedArea(r, c) {
    const p = this.pressed;
    if (!p || !this.tracking) return false;
    if (this.chord) return Math.abs(p.r - r) <= 1 && Math.abs(p.c - c) <= 1;
    return p.r === r && p.c === c;
  }

  tileFor(cell) {
    if (this.gameState === 'lost') {
      if (cell.exploded) return 'exploded';
      if (cell.isMine && cell.state !== 'flag') return 'mine';
      if (!cell.isMine && cell.state === 'flag') return 'wrong';
    }
    if (cell.isRevealed) return cell.neighborMines ? 'n' + cell.neighborMines : 'open';
    if (cell.state === 'flag') return 'flag';
    const pressed = this.inPressedArea(cell.r, cell.c);
    if (cell.state === 'question') return pressed ? 'questionPressed' : 'question';
    return pressed ? 'open' : 'closed';
  }

  draw() {
    if (!this.win || !this.ctx) return;
    const ctx = this.ctx;
    const art = MinesweeperArt.get();
    const w = this.width;
    const h = this.height;
    const l = this.layout();
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(0, 0, w, h);
    MinesweeperArt.raised(ctx, 0, 0, w, h, 3);
    MinesweeperArt.sunken(ctx, 9, 9, w - 18, 37, 2);
    MinesweeperArt.sunken(ctx, 9, 52, w - 18, h - 61, 3);
    this.drawLed(l.mines.x, l.mines.y, this.flagsLeft);
    this.drawLed(l.clock.x, l.clock.y, this.timer);
    let face = 'smile';
    if (this.gameState === 'lost') face = 'dead';
    else if (this.gameState === 'won') face = 'cool';
    else if (this.tracking && this.pressed) face = 'oh';
    const faceArt = this.facePressed && this.faceInside !== false ? art.face.pressed : art.face[face];
    ctx.drawImage(faceArt, l.face.x, l.face.y);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        ctx.drawImage(art.tiles[this.tileFor(this.board[r][c])], l.boardX + c * 16, l.boardY + r * 16);
      }
    }
    this.canvas.style.filter = this.color ? '' : 'grayscale(1)';
  }

  drawLed(x, y, value) {
    const art = MinesweeperArt.get();
    const ctx = this.ctx;
    MinesweeperArt.sunken(ctx, x - 1, y - 1, 41, 25, 1);
    let text;
    if (value < 0) text = '-' + String(Math.min(99, -value)).padStart(2, '0');
    else text = String(Math.min(999, value)).padStart(3, '0');
    [...text].forEach((ch, i) => ctx.drawImage(art.led[ch], x + i * 13, y));
  }

  applyDifficulty(diff) {
    this.difficulty = diff || 'beginner';
    if (this.difficulty === 'intermediate') {
      this.rows = 16; this.cols = 16; this.totalMines = 40;
    } else if (this.difficulty === 'expert') {
      this.rows = 16; this.cols = 30; this.totalMines = 99;
    } else if (this.difficulty === 'custom') {
      this.rows = this.custom.rows; this.cols = this.custom.cols; this.totalMines = this.custom.mines;
    } else {
      this.difficulty = 'beginner';
      this.rows = 9; this.cols = 9; this.totalMines = 10;
    }
  }

  setDifficulty(win, diff) {
    if (typeof win === 'string') {
      diff = win;
      win = null;
    }
    this.applyDifficulty(diff);
    this.savePrefs();
    if (this.win) {
      this.refreshMenu();
      this.resetGame();
    }
  }

  showCustomDialog() {
    const id = 'app_ms_custom';
    if (window.winManager.windows.has(id)) return;
    const dlg = window.winManager.createWindow({
      id,
      title: this.t('mine.customTitle'),
      icon: 'minesweeper',
      width: 206,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `
        <div class="ms-custom">
          <div class="ms-custom-fields">
            <label>${this.t('mine.customHeight')}</label><input type="text" class="ms-c-rows" value="${this.custom.rows}">
            <label>${this.t('mine.customWidth')}</label><input type="text" class="ms-c-cols" value="${this.custom.cols}">
            <label>${this.t('mine.customMines')}</label><input type="text" class="ms-c-mines" value="${this.custom.mines}">
          </div>
          <div class="ms-custom-buttons">
            <button class="win-btn is-default ms-c-ok">${this.t('btn.ok')}</button>
            <button class="win-btn ms-c-cancel">${this.t('btn.cancel')}</button>
          </div>
        </div>`
    });
    const q = (s) => dlg.element.querySelector(s);
    const ok = () => {
      const clamp = (v, lo, hi, def) => {
        const n = parseInt(v, 10);
        return isNaN(n) ? def : Math.max(lo, Math.min(hi, n));
      };
      const rows = clamp(q('.ms-c-rows').value, 9, 24, this.custom.rows);
      const cols = clamp(q('.ms-c-cols').value, 9, 30, this.custom.cols);
      const mines = clamp(q('.ms-c-mines').value, 10, (rows - 1) * (cols - 1), this.custom.mines);
      this.custom = { rows, cols, mines };
      window.winManager.closeWindow(id);
      this.setDifficulty(this.win, 'custom');
    };
    q('.ms-c-ok').addEventListener('click', ok);
    q('.ms-c-cancel').addEventListener('click', () => window.winManager.closeWindow(id));
    dlg.element.addEventListener('keydown', e => {
      if (e.key === 'Enter') ok();
      if (e.key === 'Escape') window.winManager.closeWindow(id);
    });
    setTimeout(() => q('.ms-c-rows').select(), 0);
  }

  defaultScores() {
    const name = this.t('mine.anonymous');
    return {
      beginner: { time: 999, name },
      intermediate: { time: 999, name },
      expert: { time: 999, name }
    };
  }

  getBestTimes() {
    try {
      const saved = localStorage.getItem('win98_minesweeper_scores');
      if (saved) return Object.assign(this.defaultScores(), JSON.parse(saved));
    } catch (e) {}
    return this.defaultScores();
  }

  saveBestTimes(scores) {
    try {
      localStorage.setItem('win98_minesweeper_scores', JSON.stringify(scores));
    } catch (e) {}
  }

  levelName(level) {
    return this.t({ beginner: 'mine.diffBeginner', intermediate: 'mine.diffIntermediate', expert: 'mine.diffExpert' }[level]);
  }

  promptRecord() {
    const level = this.difficulty;
    const id = 'app_ms_record';
    const dlg = window.winManager.createWindow({
      id,
      title: this.t('mine.title'),
      icon: 'minesweeper',
      width: 210,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `
        <div class="ms-record">
          <p>${this.t('mine.recordText', this.levelName(level))}</p>
          <input type="text" class="ms-record-name" value="${this.getBestTimes()[level].name}">
          <button class="win-btn is-default ms-record-ok">${this.t('btn.ok')}</button>
        </div>`
    });
    const input = dlg.element.querySelector('.ms-record-name');
    const save = () => {
      const scores = this.getBestTimes();
      scores[level] = { time: this.timer, name: input.value.trim() || this.t('mine.anonymous') };
      this.saveBestTimes(scores);
      window.winManager.closeWindow(id);
      this.showBestTimesModal();
    };
    dlg.element.querySelector('.ms-record-ok').addEventListener('click', save);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
    setTimeout(() => input.select(), 0);
  }

  showBestTimesModal() {
    const id = 'app_ms_scores';
    if (window.winManager.windows.has(id)) window.winManager.closeWindow(id);
    const scores = this.getBestTimes();
    const row = (level) => `<span>${this.levelName(level)}:</span><span>${scores[level].time} ${this.t('mine.lblSec')}</span><span>${scores[level].name}</span>`;
    const dlg = window.winManager.createWindow({
      id,
      title: this.t('mine.bestTimesTitle'),
      icon: 'minesweeper',
      width: 300,
      height: 'auto',
      resizable: false,
      minimizable: false,
      maximizable: false,
      isDialog: true,
      content: `
        <div class="ms-best">
          <div class="ms-best-grid">${row('beginner')}${row('intermediate')}${row('expert')}</div>
          <div class="ms-best-buttons">
            <button class="win-btn ms-best-reset">${this.t('mine.btnResetScores')}</button>
            <button class="win-btn is-default ms-best-ok">${this.t('btn.ok')}</button>
          </div>
        </div>`
    });
    dlg.element.querySelector('.ms-best-reset').addEventListener('click', () => {
      this.saveBestTimes(this.defaultScores());
      this.showBestTimesModal();
    });
    dlg.element.querySelector('.ms-best-ok').addEventListener('click', () => window.winManager.closeWindow(id));
  }
}

window.appMinesweeper = new AppMinesweeper();
