window.Og2LiftEngine = class Og2LiftEngine {
  constructor(options = {}) {
    this.random = options.random || Math.random;
    this.gravity = 1800;
    this.jumpSpeed = 620;
    this.maxSpeed = 260;
    this.startX = 80;
    this.restart();
  }

  restart() {
    this.score = 0;
    this.startLevel(1);
  }

  nextLevel() {
    this.startLevel(this.level + 1);
  }

  startLevel(level) {
    this.level = level;
    this.length = Math.min(6200, 2400 + (level - 1) * 350);
    const pace = 1.5 - Math.min(0.25, (level - 1) * 0.04);
    this.timeLimit = (this.length - this.startX) / this.maxSpeed * pace + 3;
    this.timeLeft = this.timeLimit;
    this.state = 'playing';
    this.controls = { left: false, right: false, jump: false };
    this.previousJump = false;
    this.player = {
      x: this.startX,
      y: 0,
      vx: 0,
      vy: 0,
      w: 22,
      h: 40,
      onGround: true,
      facing: 1,
      slip: 0,
      invulnerable: 0,
      coyote: 0,
      jumpBuffer: 0,
      jumping: false,
      runPhase: 0
    };
    this.boxes = [];
    this.shelves = [];
    this.puddles = [];
    this.chairs = [];
    this.coffees = [];
    this.coffeesTaken = 0;
    this.generate();
  }

  generate() {
    let cursor = 420;
    const limit = this.length - 320;
    while (cursor < limit) {
      const roll = this.random();
      let width = 40;
      if (roll < 0.3) {
        const w = 32 + Math.floor(this.random() * 16);
        this.boxes.push({ x: cursor, w, h: 26 + Math.floor(this.random() * 28) });
        width = w;
      } else if (roll < 0.42) {
        this.boxes.push({ x: cursor, w: 40, h: 30 });
        this.boxes.push({ x: cursor + 40, w: 40, h: 60 });
        width = 80;
      } else if (roll < 0.62) {
        const w = 70 + Math.floor(this.random() * 40);
        this.puddles.push({ x: cursor, w, hit: false });
        width = w;
      } else if (roll < 0.78 && this.level >= 2) {
        this.chairs.push({ x: cursor + 160, w: 34, h: 30, vx: -110, alive: true });
        width = 40;
      } else if (roll < 0.9) {
        const top = 75 + Math.floor(this.random() * 20);
        this.shelves.push({ x: cursor, w: 100, top });
        this.coffees.push({ x: cursor + 50, y: -top - 16, taken: false });
        width = 100;
      } else {
        this.coffees.push({ x: cursor + 20, y: -18, taken: false });
      }
      cursor += width + 190 + Math.floor(this.random() * 100);
    }
    this.liftX = this.length;
  }

  get remaining() {
    return Math.max(0, this.timeLeft);
  }

  setControls(controls) {
    this.controls = { left: !!controls.left, right: !!controls.right, jump: !!controls.jump };
  }

  update(dt) {
    const events = [];
    if (this.state !== 'playing') return events;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.state = 'lost';
      events.push('timeUp');
      return events;
    }
    const p = this.player;
    this.steer(dt);
    this.handleJump(dt, events);
    p.vy = Math.min(900, p.vy + this.gravity * dt);
    this.moveHorizontally(dt);
    this.moveVertically(dt, events);
    p.x = Math.max(p.w / 2, p.x);
    if (p.slip > 0) p.slip -= dt;
    if (p.invulnerable > 0) p.invulnerable -= dt;
    if (p.onGround) p.runPhase += Math.abs(p.vx) * dt * 0.06;
    this.touchPuddles(events);
    this.moveChairs(dt, events);
    this.collectCoffees(events);
    if (p.x >= this.liftX + 20) this.finishLevel(events);
    return events;
  }

  steer(dt) {
    const p = this.player;
    const direction = (this.controls.right ? 1 : 0) - (this.controls.left ? 1 : 0);
    if (direction) p.facing = direction;
    const limit = this.maxSpeed * (p.slip > 0 ? 0.5 : 1);
    const target = direction * limit;
    let accel = p.onGround ? 2200 : 1300;
    if (p.slip > 0 && p.onGround) accel = 500;
    const diff = target - p.vx;
    const step = accel * dt;
    p.vx += Math.abs(diff) <= step ? diff : Math.sign(diff) * step;
  }

  handleJump(dt, events) {
    const p = this.player;
    const pressed = this.controls.jump && !this.previousJump;
    if (pressed) p.jumpBuffer = 0.1;
    else p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    p.coyote = p.onGround ? 0.08 : Math.max(0, p.coyote - dt);
    if (p.jumpBuffer > 0 && p.coyote > 0) {
      p.vy = -this.jumpSpeed;
      p.onGround = false;
      p.coyote = 0;
      p.jumpBuffer = 0;
      p.jumping = true;
      events.push('jump');
    }
    if (p.jumping && !this.controls.jump && p.vy < -250) p.vy *= 0.55;
    this.previousJump = this.controls.jump;
  }

  moveHorizontally(dt) {
    const p = this.player;
    p.x += p.vx * dt;
    const left = p.x - p.w / 2;
    const right = p.x + p.w / 2;
    const top = p.y - p.h;
    this.boxes.forEach(box => {
      const boxTop = -box.h;
      if (right > box.x && left < box.x + box.w && p.y > boxTop + 0.01 && top < 0) {
        p.x = p.vx > 0 ? box.x - p.w / 2 : box.x + box.w + p.w / 2;
        p.vx = 0;
      }
    });
  }

  moveVertically(dt, events) {
    const p = this.player;
    const previous = p.y;
    const wasGrounded = p.onGround;
    p.y += p.vy * dt;
    p.onGround = false;
    if (p.vy >= 0) {
      const left = p.x - p.w / 2;
      const right = p.x + p.w / 2;
      let landing = p.y >= 0 ? 0 : null;
      this.boxes.forEach(box => {
        const boxTop = -box.h;
        if (right > box.x && left < box.x + box.w && previous <= boxTop + 0.5 && p.y >= boxTop) {
          if (landing === null || boxTop < landing) landing = boxTop;
        }
      });
      this.shelves.forEach(shelf => {
        const shelfTop = -shelf.top;
        if (right > shelf.x && left < shelf.x + shelf.w && previous <= shelfTop + 0.5 && p.y >= shelfTop) {
          if (landing === null || shelfTop < landing) landing = shelfTop;
        }
      });
      if (landing !== null) {
        p.y = landing;
        p.vy = 0;
        p.onGround = true;
        p.jumping = false;
        if (!wasGrounded) events.push('land');
      }
    }
  }

  touchPuddles(events) {
    const p = this.player;
    if (p.y < -3) return;
    this.puddles.forEach(puddle => {
      if (p.x + p.w / 2 > puddle.x && p.x - p.w / 2 < puddle.x + puddle.w) {
        p.slip = 1.2;
        if (!puddle.hit) {
          puddle.hit = true;
          this.timeLeft -= 2;
          events.push('puddle');
        }
      }
    });
  }

  moveChairs(dt, events) {
    const p = this.player;
    this.chairs.forEach(chair => {
      if (!chair.alive) return;
      if (Math.abs(chair.x - p.x) < 520) chair.x += chair.vx * dt;
      const overlapX = Math.abs(chair.x - p.x) < (chair.w + p.w) / 2;
      const overlapY = p.y > -chair.h && p.y - p.h < 0;
      if (!overlapX || !overlapY || p.invulnerable > 0) return;
      if (p.vy > 0 && p.y < -chair.h * 0.5) {
        chair.alive = false;
        p.vy = -420;
        p.onGround = false;
        this.score += 50;
        events.push('stomp');
        return;
      }
      chair.alive = false;
      this.timeLeft -= 3;
      p.vx = (p.x >= chair.x ? 1 : -1) * 240;
      p.vy = -320;
      p.onGround = false;
      p.invulnerable = 1.2;
      events.push('chairHit');
    });
  }

  collectCoffees(events) {
    const p = this.player;
    this.coffees.forEach(coffee => {
      if (coffee.taken) return;
      const dx = Math.abs(coffee.x - p.x);
      const dy = Math.abs(coffee.y - (p.y - p.h / 2));
      if (dx < 20 && dy < 28) {
        coffee.taken = true;
        this.coffeesTaken++;
        this.timeLeft += 1.5;
        this.score += 50;
        events.push('coffee');
      }
    });
  }

  finishLevel(events) {
    this.state = 'won';
    this.score += 200 * this.level + Math.round(this.timeLeft * 100);
    events.push('win');
  }
};
