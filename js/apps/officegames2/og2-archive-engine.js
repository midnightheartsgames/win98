window.Og2ArchiveEngine = class Og2ArchiveEngine {
  constructor(options = {}) {
    this.random = options.random || Math.random;
    this.width = 480;
    this.height = 420;
    this.ballRadius = 5;
    this.baseWidth = 76;
    this.wideWidth = 124;
    this.brickWidth = 44;
    this.brickHeight = 18;
    this.reset();
  }

  static get LAYOUTS() {
    return [
      ['1111111111', '1111111111', '1111111111', '1111111111'],
      ['2222222222', '1010101010', '0101010101', '1010101010', '2222222222'],
      ['0000110000', '0001111000', '0011221100', '0111111110', '1111111111'],
      ['2222222222', '2000000002', '2011111102', '2000000002', '1111111111']
    ];
  }

  static get BONUS_POOL() {
    return ['wide', 'wide', 'wide', 'multi', 'multi', 'multi', 'slow', 'slow', 'life'];
  }

  reset() {
    this.lives = 3;
    this.score = 0;
    this.level = 1;
    this.buildLevel();
  }

  nextLevel() {
    this.level++;
    this.buildLevel();
  }

  buildLevel() {
    const rows = Og2ArchiveEngine.LAYOUTS[(this.level - 1) % Og2ArchiveEngine.LAYOUTS.length];
    const originX = (this.width - 10 * (this.brickWidth + 2)) / 2 + 1;
    this.bricks = [];
    rows.forEach((row, r) => {
      row.split('').forEach((cell, c) => {
        if (cell === '0') return;
        let hp = Number(cell);
        if (this.level > 4 && r < 2) hp = 2;
        this.bricks.push({
          x: originX + c * (this.brickWidth + 2),
          y: 52 + r * (this.brickHeight + 2),
          row: r,
          hp,
          maxHp: hp,
          alive: true
        });
      });
    });
    this.paddle = { x: this.width / 2, y: this.height - 24, w: this.baseWidth, h: 12 };
    this.bonuses = [];
    this.wideTimer = 0;
    this.slowTimer = 0;
    this.hits = 0;
    this.state = 'playing';
    this.attachBall();
  }

  attachBall() {
    this.balls = [{ x: this.paddle.x, y: this.paddle.y - this.ballRadius - 1, dx: 0, dy: -1, stuck: true }];
  }

  get speed() {
    const base = Math.min(470, 250 + (this.level - 1) * 20 + this.hits * 1.2);
    return this.slowTimer > 0 ? base * 0.7 : base;
  }

  get bricksLeft() {
    return this.bricks.filter(b => b.alive).length;
  }

  get hasStuckBall() {
    return this.balls.some(b => b.stuck);
  }

  setPaddleX(x) {
    const half = this.paddle.w / 2;
    this.paddle.x = Math.max(half, Math.min(this.width - half, x));
    this.balls.forEach(ball => {
      if (ball.stuck) ball.x = this.paddle.x;
    });
  }

  launch() {
    if (this.state !== 'playing') return false;
    let launched = false;
    this.balls.forEach(ball => {
      if (!ball.stuck) return;
      const angle = (this.random() - 0.5) * 0.5;
      ball.dx = Math.sin(angle);
      ball.dy = -Math.cos(angle);
      ball.stuck = false;
      launched = true;
    });
    return launched;
  }

  update(dt) {
    const events = [];
    if (this.state !== 'playing') return events;
    this.tickTimers(dt);
    this.setPaddleX(this.paddle.x);
    this.balls.forEach(ball => {
      if (!ball.stuck) this.moveBall(ball, dt, events);
    });
    this.balls = this.balls.filter(ball => !ball.lost);
    this.moveBonuses(dt, events);
    if (this.balls.length === 0) {
      this.loseLife(events);
    } else if (this.bricksLeft === 0) {
      this.state = 'cleared';
      this.score += 100 * this.level;
      events.push('levelClear');
    }
    return events;
  }

  tickTimers(dt) {
    if (this.wideTimer > 0) {
      this.wideTimer -= dt;
      if (this.wideTimer <= 0) this.paddle.w = this.baseWidth;
    }
    if (this.slowTimer > 0) this.slowTimer -= dt;
  }

  loseLife(events) {
    this.lives--;
    this.hits = 0;
    this.bonuses = [];
    this.paddle.w = this.baseWidth;
    this.wideTimer = 0;
    this.slowTimer = 0;
    if (this.lives <= 0) {
      this.state = 'over';
      events.push('gameOver');
      return;
    }
    events.push('lifeLost');
    this.attachBall();
  }

  moveBall(ball, dt, events) {
    const distance = this.speed * dt;
    const steps = Math.max(1, Math.ceil(distance / 3));
    const stepLength = distance / steps;
    for (let i = 0; i < steps && !ball.lost; i++) {
      ball.x += ball.dx * stepLength;
      ball.y += ball.dy * stepLength;
      this.bounceWalls(ball, events);
      if (ball.y - this.ballRadius > this.height) {
        ball.lost = true;
        return;
      }
      this.bouncePaddle(ball, events);
      this.bounceBricks(ball, events);
    }
  }

  bounceWalls(ball, events) {
    const r = this.ballRadius;
    if (ball.x < r) {
      ball.x = r;
      ball.dx = Math.abs(ball.dx);
      events.push('wall');
    } else if (ball.x > this.width - r) {
      ball.x = this.width - r;
      ball.dx = -Math.abs(ball.dx);
      events.push('wall');
    }
    if (ball.y < r) {
      ball.y = r;
      ball.dy = Math.abs(ball.dy);
      events.push('wall');
    }
  }

  bouncePaddle(ball, events) {
    const p = this.paddle;
    const r = this.ballRadius;
    if (ball.dy <= 0) return;
    if (ball.y + r < p.y || ball.y > p.y + p.h / 2) return;
    if (ball.x < p.x - p.w / 2 - r || ball.x > p.x + p.w / 2 + r) return;
    const offset = Math.max(-1, Math.min(1, (ball.x - p.x) / (p.w / 2)));
    const angle = offset * 1.05;
    ball.dx = Math.sin(angle);
    ball.dy = -Math.cos(angle);
    ball.y = p.y - r;
    events.push('paddle');
  }

  bounceBricks(ball, events) {
    const r = this.ballRadius;
    const bw = this.brickWidth;
    const bh = this.brickHeight;
    const brick = this.bricks.find(b => {
      if (!b.alive) return false;
      const cx = Math.max(b.x, Math.min(ball.x, b.x + bw));
      const cy = Math.max(b.y, Math.min(ball.y, b.y + bh));
      return (ball.x - cx) ** 2 + (ball.y - cy) ** 2 < r * r;
    });
    if (!brick) return;
    const overlaps = [
      { side: 'left', value: ball.x + r - brick.x },
      { side: 'right', value: brick.x + bw - (ball.x - r) },
      { side: 'top', value: ball.y + r - brick.y },
      { side: 'bottom', value: brick.y + bh - (ball.y - r) }
    ];
    const hit = overlaps.reduce((a, b) => (b.value < a.value ? b : a));
    if (hit.side === 'left') {
      ball.x = brick.x - r;
      ball.dx = -Math.abs(ball.dx);
    } else if (hit.side === 'right') {
      ball.x = brick.x + bw + r;
      ball.dx = Math.abs(ball.dx);
    } else if (hit.side === 'top') {
      ball.y = brick.y - r;
      ball.dy = -Math.abs(ball.dy);
    } else {
      ball.y = brick.y + bh + r;
      ball.dy = Math.abs(ball.dy);
    }
    this.hits++;
    brick.hp--;
    if (brick.hp > 0) {
      events.push('brick');
      return;
    }
    brick.alive = false;
    this.lastBroken = brick;
    this.score += 10 * this.level * brick.maxHp;
    events.push('break');
    this.maybeDropBonus(brick);
  }

  maybeDropBonus(brick) {
    if (this.random() >= 0.2) return;
    const pool = Og2ArchiveEngine.BONUS_POOL;
    const type = pool[Math.floor(this.random() * pool.length)];
    this.bonuses.push({ x: brick.x + this.brickWidth / 2, y: brick.y + this.brickHeight / 2, type });
  }

  moveBonuses(dt, events) {
    const p = this.paddle;
    this.bonuses = this.bonuses.filter(bonus => {
      bonus.y += 130 * dt;
      const caught = bonus.y + 9 >= p.y && bonus.y - 9 <= p.y + p.h && Math.abs(bonus.x - p.x) <= p.w / 2 + 12;
      if (caught) {
        this.applyBonus(bonus.type);
        events.push('bonus');
        return false;
      }
      return bonus.y < this.height + 20;
    });
  }

  applyBonus(type) {
    this.score += 25;
    if (type === 'wide') {
      this.paddle.w = this.wideWidth;
      this.wideTimer = 14;
      this.setPaddleX(this.paddle.x);
    } else if (type === 'slow') {
      this.slowTimer = 10;
    } else if (type === 'life') {
      this.lives = Math.min(5, this.lives + 1);
    } else if (type === 'multi') {
      const source = this.balls.find(b => !b.stuck) || this.balls[0];
      [-0.4, 0.4].forEach(turn => {
        const angle = Math.atan2(source.dx, -source.dy) + turn;
        this.balls.push({ x: source.x, y: source.y, dx: Math.sin(angle), dy: -Math.cos(angle), stuck: source.stuck });
      });
    }
  }
};
