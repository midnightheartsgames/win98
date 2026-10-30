window.Og2CableEngine = class Og2CableEngine {
  constructor(options = {}) {
    this.size = options.size || 15;
    this.random = options.random || Math.random;
    this.reset();
  }

  reset() {
    const mid = Math.floor(this.size / 2);
    this.snake = [{ x: mid, z: 5 }, { x: mid, z: 4 }, { x: mid, z: 3 }];
    this.prevSnake = this.snake.map(cell => ({ ...cell }));
    this.dir = 0;
    this.queue = [];
    this.obstacles = [];
    this.letter = null;
    this.coffee = null;
    this.calm = 0;
    this.score = 0;
    this.letters = 0;
    this.alive = true;
    this.lastCause = null;
    for (let i = 0; i < 4; i++) this.placeObstacle();
    this.letter = this.pickFreeCell(0);
  }

  get level() {
    return 1 + Math.floor(this.letters / 5);
  }

  get tickMs() {
    const base = Math.max(95, 210 - (this.level - 1) * 14);
    return this.calm > 0 ? Math.round(base * 1.6) : base;
  }

  static get DIRS() {
    return [{ x: 0, z: 1 }, { x: 1, z: 0 }, { x: 0, z: -1 }, { x: -1, z: 0 }];
  }

  turn(side) {
    if (!this.alive || this.queue.length >= 2) return false;
    this.queue.push(side === 'right' ? 'right' : 'left');
    return true;
  }

  isOccupied(x, z) {
    if (this.snake.some(c => c.x === x && c.z === z)) return true;
    if (this.obstacles.some(c => c.x === x && c.z === z)) return true;
    if (this.letter && this.letter.x === x && this.letter.z === z) return true;
    if (this.coffee && this.coffee.x === x && this.coffee.z === z) return true;
    return false;
  }

  pickFreeCell(minDistanceFromHead) {
    const head = this.snake[0];
    const candidates = [];
    for (let x = 0; x < this.size; x++) {
      for (let z = 0; z < this.size; z++) {
        if (this.isOccupied(x, z)) continue;
        if (Math.abs(x - head.x) + Math.abs(z - head.z) < minDistanceFromHead) continue;
        candidates.push({ x, z });
      }
    }
    if (!candidates.length) return null;
    return candidates[Math.floor(this.random() * candidates.length)];
  }

  placeObstacle() {
    const cell = this.pickFreeCell(5);
    if (cell) this.obstacles.push(cell);
  }

  step() {
    if (!this.alive) return { kind: 'dead', turned: 0 };
    let turned = 0;
    if (this.queue.length) {
      turned = this.queue.shift() === 'right' ? 1 : -1;
      this.dir = (this.dir + turned + 4) % 4;
    }
    const head = this.snake[0];
    const delta = Og2CableEngine.DIRS[this.dir];
    const next = { x: head.x + delta.x, z: head.z + delta.z };
    const eatsLetter = !!this.letter && this.letter.x === next.x && this.letter.z === next.z;
    const eatsCoffee = !!this.coffee && this.coffee.x === next.x && this.coffee.z === next.z;

    const outside = next.x < 0 || next.z < 0 || next.x >= this.size || next.z >= this.size;
    const body = eatsLetter ? this.snake : this.snake.slice(0, this.snake.length - 1);
    let cause = null;
    if (outside) cause = 'wall';
    else if (this.obstacles.some(c => c.x === next.x && c.z === next.z)) cause = 'partition';
    else if (body.some(c => c.x === next.x && c.z === next.z)) cause = 'self';
    if (cause) {
      this.alive = false;
      this.lastCause = cause;
      return { kind: 'crash', cause, turned };
    }

    this.prevSnake = this.snake.map(cell => ({ ...cell }));
    this.snake.unshift(next);
    if (!eatsLetter) this.snake.pop();

    if (this.calm > 0) this.calm--;
    if (this.coffee) {
      this.coffee.ttl--;
      if (this.coffee.ttl <= 0 && !eatsCoffee) this.coffee = null;
    }

    let kind = 'move';
    if (eatsLetter) {
      kind = 'letter';
      this.letters++;
      this.score += 10 * this.level;
      this.letter = this.pickFreeCell(0);
      if (this.letters % 3 === 0) this.placeObstacle();
      if (!this.coffee && this.random() < 0.25) {
        const cell = this.pickFreeCell(3);
        if (cell) this.coffee = { ...cell, ttl: 28 };
      }
    } else if (eatsCoffee) {
      kind = 'coffee';
      this.coffee = null;
      this.score += 50;
      this.calm = 24;
    }
    return { kind, turned };
  }
};
