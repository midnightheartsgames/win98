window.Og2StackEngine = class Og2StackEngine {
  constructor(options = {}) {
    this.random = options.random || Math.random;
    this.cols = 10;
    this.rows = 20;
    this.lockDelay = 0.5;
    this.maxLockResets = 15;
    this.restart();
  }

  static get SHAPES() {
    return [
      [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      [[1, 1], [1, 1]],
      [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
      [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
      [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
      [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
      [[0, 0, 1], [1, 1, 1], [0, 0, 0]]
    ];
  }

  static get KICKS() {
    return [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1]];
  }

  static rotateMatrix(matrix) {
    const n = matrix.length;
    return matrix.map((row, r) => row.map((_, c) => matrix[n - 1 - c][r]));
  }

  static matrixFor(type, rotation) {
    let matrix = Og2StackEngine.SHAPES[type];
    for (let i = 0; i < ((rotation % 4) + 4) % 4; i++) matrix = Og2StackEngine.rotateMatrix(matrix);
    return matrix;
  }

  restart() {
    this.board = [];
    for (let r = 0; r < this.rows; r++) this.board.push(new Array(this.cols).fill(0));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.state = 'playing';
    this.bag = [];
    this.queue = [];
    this.hold = null;
    this.holdUsed = false;
    this.gravityClock = 0;
    this.lockClock = 0;
    this.lockResets = 0;
    this.clearInfo = null;
    this.fillQueue();
    this.spawn();
  }

  fillQueue() {
    while (this.queue.length < 5) {
      if (!this.bag.length) {
        this.bag = [0, 1, 2, 3, 4, 5, 6];
        for (let i = this.bag.length - 1; i > 0; i--) {
          const j = Math.floor(this.random() * (i + 1));
          [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
        }
      }
      this.queue.push(this.bag.pop());
    }
  }

  upcoming(count = 3) {
    return this.queue.slice(0, count);
  }

  get dropInterval() {
    return Math.max(0.05, 0.8 * Math.pow(0.85, this.level - 1));
  }

  spawn(type = null) {
    const next = type === null ? this.queue.shift() : type;
    if (type === null) this.fillQueue();
    const size = Og2StackEngine.SHAPES[next].length;
    this.piece = { type: next, rotation: 0, x: Math.floor((this.cols - size) / 2), y: next === 0 ? -1 : 0 };
    this.gravityClock = 0;
    this.lockClock = 0;
    this.lockResets = 0;
    if (this.collides(this.piece)) {
      this.state = 'over';
      return false;
    }
    return true;
  }

  cellsOf(piece) {
    const matrix = Og2StackEngine.matrixFor(piece.type, piece.rotation);
    const cells = [];
    matrix.forEach((row, r) => row.forEach((value, c) => {
      if (value) cells.push({ r: piece.y + r, c: piece.x + c });
    }));
    return cells;
  }

  collides(piece) {
    return this.cellsOf(piece).some(cell => cell.c < 0 || cell.c >= this.cols || cell.r >= this.rows || (cell.r >= 0 && this.board[cell.r][cell.c]));
  }

  get grounded() {
    return this.collides({ ...this.piece, y: this.piece.y + 1 });
  }

  ghostY() {
    let y = this.piece.y;
    while (!this.collides({ ...this.piece, y: y + 1 })) y++;
    return y;
  }

  touchLock() {
    if (this.grounded && this.lockResets < this.maxLockResets) {
      this.lockClock = 0;
      this.lockResets++;
    }
  }

  move(dx) {
    if (this.state !== 'playing') return false;
    const candidate = { ...this.piece, x: this.piece.x + dx };
    if (this.collides(candidate)) return false;
    this.piece = candidate;
    this.touchLock();
    return true;
  }

  rotate(direction = 1) {
    if (this.state !== 'playing') return false;
    const rotation = (this.piece.rotation + direction + 4) % 4;
    for (const [dx, dy] of Og2StackEngine.KICKS) {
      const candidate = { ...this.piece, rotation, x: this.piece.x + dx, y: this.piece.y + dy };
      if (!this.collides(candidate)) {
        this.piece = candidate;
        this.touchLock();
        return true;
      }
    }
    return false;
  }

  softDrop() {
    if (this.state !== 'playing') return false;
    const candidate = { ...this.piece, y: this.piece.y + 1 };
    if (this.collides(candidate)) return false;
    this.piece = candidate;
    this.score += 1;
    this.gravityClock = 0;
    return true;
  }

  hardDrop() {
    if (this.state !== 'playing') return [];
    const distance = this.ghostY() - this.piece.y;
    this.piece = { ...this.piece, y: this.piece.y + distance };
    this.score += distance * 2;
    const events = this.lockPiece();
    events.unshift('hardDrop');
    return events;
  }

  swapHold() {
    if (this.state !== 'playing' || this.holdUsed) return false;
    const current = this.piece.type;
    if (this.hold === null) {
      this.hold = current;
      this.spawn();
    } else {
      const stored = this.hold;
      this.hold = current;
      this.spawn(stored);
    }
    this.holdUsed = true;
    return true;
  }

  update(dt) {
    if (this.state !== 'playing') return [];
    const events = [];
    if (this.grounded) {
      this.lockClock += dt;
      if (this.lockClock >= this.lockDelay) return this.lockPiece();
      return events;
    }
    this.lockClock = 0;
    this.gravityClock += dt;
    while (this.gravityClock >= this.dropInterval && !this.grounded) {
      this.gravityClock -= this.dropInterval;
      this.piece = { ...this.piece, y: this.piece.y + 1 };
    }
    if (this.grounded) this.gravityClock = 0;
    return events;
  }

  lockPiece() {
    const events = ['lock'];
    this.cellsOf(this.piece).forEach(cell => {
      if (cell.r >= 0) this.board[cell.r][cell.c] = this.piece.type + 1;
    });
    const topOut = this.cellsOf(this.piece).every(cell => cell.r < 0);
    const full = [];
    this.board.forEach((row, r) => { if (row.every(Boolean)) full.push(r); });
    if (full.length) {
      this.clearInfo = { rows: full.slice(), snapshot: this.board.map(row => row.slice()) };
      this.board = this.board.filter((_, r) => !full.includes(r));
      while (this.board.length < this.rows) this.board.unshift(new Array(this.cols).fill(0));
      this.combo++;
      const base = [0, 100, 300, 500, 800][full.length];
      this.score += base * this.level + (this.combo > 0 ? 50 * this.combo * this.level : 0);
      this.lines += full.length;
      events.push('clear');
      const level = 1 + Math.floor(this.lines / 10);
      if (level > this.level) {
        this.level = level;
        events.push('levelUp');
      }
    } else {
      this.combo = -1;
      this.clearInfo = null;
    }
    this.holdUsed = false;
    if (topOut) {
      this.state = 'over';
      events.push('over');
      return events;
    }
    if (!this.spawn()) events.push('over');
    return events;
  }
};
