window.Og2FiveEngine = class Og2FiveEngine {
  constructor(options = {}) {
    this.random = options.random || Math.random;
    this.size = 9;
    this.colors = 6;
    this.lineLength = 5;
    this.restart();
  }

  restart() {
    this.board = [];
    for (let r = 0; r < this.size; r++) this.board.push(new Array(this.size).fill(null));
    this.score = 0;
    this.turns = 0;
    this.state = 'playing';
    this.spawnBalls([...this.drawUpcoming(), ...this.drawUpcoming().slice(0, 2)]);
    this.upcoming = this.drawUpcoming();
  }

  randomBall() {
    if (this.random() < 0.04) return { color: -1, wild: true };
    return { color: Math.floor(this.random() * this.colors), wild: false };
  }

  drawUpcoming() {
    return [this.randomBall(), this.randomBall(), this.randomBall()];
  }

  emptyCells() {
    const cells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.board[r][c]) cells.push({ r, c });
      }
    }
    return cells;
  }

  spawnBalls(balls) {
    const placed = [];
    balls.forEach(ball => {
      const empty = this.emptyCells();
      if (!empty.length) return;
      const cell = empty[Math.floor(this.random() * empty.length)];
      this.board[cell.r][cell.c] = { ...ball };
      placed.push({ r: cell.r, c: cell.c, ball: { ...ball } });
    });
    return placed;
  }

  findPath(from, to) {
    if (!this.board[from.r][from.c] || this.board[to.r][to.c]) return null;
    if (from.r === to.r && from.c === to.c) return null;
    const key = (r, c) => r * this.size + c;
    const previous = new Map([[key(from.r, from.c), null]]);
    const queue = [from];
    const steps = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (queue.length) {
      const cell = queue.shift();
      if (cell.r === to.r && cell.c === to.c) {
        const path = [];
        let cursor = cell;
        while (cursor) {
          path.unshift({ r: cursor.r, c: cursor.c });
          cursor = previous.get(key(cursor.r, cursor.c));
        }
        return path;
      }
      steps.forEach(([dr, dc]) => {
        const r = cell.r + dr;
        const c = cell.c + dc;
        if (r < 0 || c < 0 || r >= this.size || c >= this.size) return;
        if (this.board[r][c] || previous.has(key(r, c))) return;
        previous.set(key(r, c), cell);
        queue.push({ r, c });
      });
    }
    return null;
  }

  reachable(from) {
    const result = [];
    if (!this.board[from.r][from.c]) return result;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.board[r][c] && this.findPath(from, { r, c })) result.push({ r, c });
      }
    }
    return result;
  }

  linesThrough(r, c) {
    const ball = this.board[r][c];
    if (!ball) return [];
    const colors = ball.wild ? Array.from({ length: this.colors }, (_, i) => i) : [ball.color];
    const found = new Map();
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    colors.forEach(color => {
      directions.forEach(([dr, dc]) => {
        const run = [{ r, c }];
        [1, -1].forEach(sign => {
          let rr = r + dr * sign;
          let cc = c + dc * sign;
          while (this.inside(rr, cc) && this.board[rr][cc] && (this.board[rr][cc].wild || this.board[rr][cc].color === color)) {
            run.push({ r: rr, c: cc });
            rr += dr * sign;
            cc += dc * sign;
          }
        });
        if (run.length >= this.lineLength) run.forEach(cell => found.set(cell.r + ',' + cell.c, cell));
      });
    });
    return Array.from(found.values());
  }

  inside(r, c) {
    return r >= 0 && c >= 0 && r < this.size && c < this.size;
  }

  lineScore(length) {
    return length * 10 + (length - this.lineLength) * (length - this.lineLength + 1) * 10;
  }

  clearCells(cells) {
    const removed = cells.map(cell => ({ r: cell.r, c: cell.c, ball: { ...this.board[cell.r][cell.c] } }));
    cells.forEach(cell => { this.board[cell.r][cell.c] = null; });
    const gain = this.lineScore(cells.length);
    this.score += gain;
    return { kind: 'clear', cells: removed, gain };
  }

  move(from, to) {
    if (this.state !== 'playing') return { valid: false, phases: [] };
    const path = this.findPath(from, to);
    if (!path) return { valid: false, phases: [] };
    const ball = this.board[from.r][from.c];
    this.board[to.r][to.c] = ball;
    this.board[from.r][from.c] = null;
    this.turns++;
    const phases = [{ kind: 'move', from: { ...from }, to: { ...to }, path, ball: { ...ball } }];
    const line = this.linesThrough(to.r, to.c);
    if (line.length) {
      phases.push(this.clearCells(line));
    } else {
      const placed = this.spawnBalls(this.upcoming);
      phases.push({ kind: 'spawn', balls: placed });
      const merged = new Map();
      placed.forEach(p => {
        if (!this.board[p.r][p.c]) return;
        this.linesThrough(p.r, p.c).forEach(cell => merged.set(cell.r + ',' + cell.c, cell));
      });
      if (merged.size) phases.push(this.clearCells(Array.from(merged.values())));
      this.upcoming = this.drawUpcoming();
    }
    if (this.emptyCells().length === 0) this.state = 'over';
    return { valid: true, phases };
  }
};
