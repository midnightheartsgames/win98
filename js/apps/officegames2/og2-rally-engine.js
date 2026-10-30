window.Og2RallyEngine = class Og2RallyEngine {
  constructor(options = {}) {
    this.random = options.random || Math.random;
    this.baseMaxSpeed = 30;
    this.turboMaxSpeed = 42;
    this.checkpointEvery = 400;
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
    this.length = 1200 + level * 250;
    this.timeLeft = 32;
    this.state = 'playing';
    this.clock = 0;
    this.z = 0;
    this.x = 0;
    this.speed = 0;
    this.turbo = 0;
    this.slip = 0;
    this.stun = 0;
    this.checkpoints = 0;
    this.coffees = 0;
    this.buildTrack();
    this.buildObjects();
  }

  buildTrack() {
    this.sections = [];
    let z = 120;
    const strength = Math.min(1.3, 1 + this.level * 0.05);
    while (z < this.length + 200) {
      const straight = 100 + Math.floor(this.random() * 140);
      const bend = 120 + Math.floor(this.random() * 100);
      z += straight;
      const sign = this.random() < 0.5 ? -1 : 1;
      this.sections.push({ start: z, end: z + bend, curve: sign * (0.35 + this.random() * 0.55) * strength });
      z += bend;
    }
  }

  curveAt(z) {
    for (const section of this.sections) {
      if (z >= section.start && z <= section.end) {
        const t = (z - section.start) / (section.end - section.start);
        return section.curve * Math.sin(Math.PI * t);
      }
    }
    return 0;
  }

  buildObjects() {
    this.objects = [];
    const spacing = Math.max(11, 24 - this.level * 1.2);
    let z = 90;
    while (z < this.length - 50) {
      const roll = this.random();
      const lane = () => (this.random() * 1.7) - 0.85;
      if (roll < 0.28) {
        this.objects.push({ type: 'cart', z, x: lane(), sway: 0.3 + this.random() * 0.25, phase: this.random() * 6.28, w: 0.3, hit: false });
      } else if (roll < 0.46) {
        this.objects.push({ type: 'puddle', z, x: lane(), sway: 0, phase: 0, w: 0.4, hit: false });
      } else if (roll < 0.64) {
        this.objects.push({ type: 'box', z, x: lane(), sway: 0, phase: 0, w: 0.24, hit: false });
      } else if (roll < 0.74) {
        const gap = -0.6 + this.random() * 1.2;
        this.objects.push({ type: 'box', z, x: gap - 0.62, sway: 0, phase: 0, w: 0.24, hit: false });
        this.objects.push({ type: 'box', z, x: gap + 0.62, sway: 0, phase: 0, w: 0.24, hit: false });
      } else {
        this.objects.push({ type: 'coffee', z, x: lane(), sway: 0, phase: 0, w: 0.22, hit: false });
      }
      z += spacing * (0.7 + this.random() * 0.8);
    }
  }

  objectX(object) {
    return object.x + (object.sway ? Math.sin(this.clock * 1.3 + object.phase) * object.sway : 0);
  }

  get maxSpeed() {
    return this.turbo > 0 ? this.turboMaxSpeed : this.baseMaxSpeed;
  }

  get progress() {
    return Math.min(1, this.z / this.length);
  }

  update(dt, input = {}) {
    if (this.state !== 'playing') return [];
    const events = [];
    this.clock += dt;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.state = 'lost';
      events.push('timeUp');
      return events;
    }
    this.turbo = Math.max(0, this.turbo - dt);
    this.slip = Math.max(0, this.slip - dt);
    this.stun = Math.max(0, this.stun - dt);
    this.accelerate(dt, input);
    this.steer(dt, input);
    const previousZ = this.z;
    this.z += this.speed * dt;
    this.score += (Math.floor(this.z / 10) - Math.floor(previousZ / 10)) * 5;
    this.touchObjects(previousZ, events);
    this.passCheckpoints(events);
    if (this.z >= this.length) {
      this.state = 'won';
      this.score += Math.round(this.timeLeft * 50) + 500 * this.level;
      events.push('win');
    }
    return events;
  }

  accelerate(dt, input) {
    const limit = this.stun > 0 ? 6 : this.maxSpeed;
    if (input.push && this.stun <= 0) {
      const push = 12 + (this.turbo > 0 ? 20 : 0);
      this.speed += push * Math.max(0, 1 - this.speed / limit) * dt;
    }
    this.speed -= 2 * dt;
    if (input.brake) this.speed -= 30 * dt;
    if (this.speed > limit) this.speed = Math.max(limit, this.speed - 25 * dt);
    if (Math.abs(this.x) > 1) this.speed = Math.min(this.speed, 14);
    this.speed = Math.max(0, this.speed);
  }

  steer(dt, input) {
    const ratio = this.speed / this.baseMaxSpeed;
    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const grip = this.slip > 0 ? 0.45 : 1;
    this.x += direction * dt * (0.5 + 1.4 * ratio) * grip * (this.speed > 0.3 ? 1 : 0.3);
    this.x -= this.curveAt(this.z) * dt * ratio * 1.15;
    if (this.slip > 0) this.x += Math.sin(this.clock * 9) * 0.35 * dt;
    if (Math.abs(this.x) > 1.2) {
      this.x = Math.sign(this.x) * 1.2;
      this.speed = Math.max(0, this.speed - 18 * dt);
    }
  }

  touchObjects(previousZ, events) {
    this.objects.forEach(object => {
      if (object.hit) return;
      if (previousZ > object.z + 0.5 || this.z < object.z - 0.5) return;
      if (Math.abs(this.objectX(object) - this.x) >= object.w + 0.16) return;
      object.hit = true;
      if (object.type === 'coffee') {
        this.turbo = 3.5;
        this.coffees++;
        this.score += 50;
        this.timeLeft += 1;
        events.push('coffee');
      } else if (object.type === 'puddle') {
        this.slip = 1.5;
        events.push('puddle');
      } else {
        this.speed *= 0.3;
        this.stun = 0.4;
        this.turbo = 0;
        events.push('crash');
      }
    });
  }

  passCheckpoints(events) {
    while ((this.checkpoints + 1) * this.checkpointEvery <= this.z && (this.checkpoints + 1) * this.checkpointEvery < this.length) {
      this.checkpoints++;
      this.timeLeft += Math.max(10, 16 - this.level);
      this.score += 200;
      events.push('checkpoint');
    }
  }
};
