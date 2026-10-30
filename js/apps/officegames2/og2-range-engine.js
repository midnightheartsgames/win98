window.Og2RangeEngine = class Og2RangeEngine {
  constructor(options = {}) {
    this.random = options.random || Math.random;
    this.width = 640;
    this.height = 400;
    this.magazine = 6;
    this.reloadTime = 0.9;
    this.roundTime = 60;
    this.reset();
  }

  static get LAYER_SCALE() {
    return [1.4, 1, 0.7];
  }

  static get LAYER_FLOOR() {
    return [362, 326, 296];
  }

  static get BASE_POINTS() {
    return { plane: 10, pigeon: 20, clock: 30, boss: 0 };
  }

  reset() {
    this.state = 'playing';
    this.score = 0;
    this.timeLeft = this.roundTime;
    this.elapsed = 0;
    this.ammo = this.magazine;
    this.reloading = 0;
    this.streak = 0;
    this.shots = 0;
    this.hits = 0;
    this.entities = [];
    this.spawnTimer = 0.4;
    this.nextId = 1;
    this.lastHit = null;
  }

  get multiplier() {
    return Math.min(4, 1 + Math.floor(this.streak / 3));
  }

  get accuracy() {
    return this.shots ? Math.round(this.hits * 100 / this.shots) : 0;
  }

  reload() {
    if (this.state !== 'playing' || this.reloading > 0 || this.ammo === this.magazine) return false;
    this.reloading = this.reloadTime;
    return true;
  }

  shoot(x, y) {
    if (this.state !== 'playing') return [];
    if (this.reloading > 0) return ['locked'];
    if (this.ammo <= 0) {
      this.reload();
      return ['empty'];
    }
    this.ammo--;
    this.shots++;
    const target = this.findTarget(x, y);
    if (!target) {
      this.streak = 0;
      return ['miss'];
    }
    return [this.hitTarget(target)];
  }

  findTarget(x, y) {
    const scale = Og2RangeEngine.LAYER_SCALE;
    const candidates = this.entities
      .filter(e => e.alive && (e.x - x) ** 2 + (e.y - y) ** 2 <= (e.r * scale[e.layer]) ** 2)
      .sort((a, b) => a.layer - b.layer || b.id - a.id);
    return candidates[0] || null;
  }

  hitTarget(target) {
    target.alive = false;
    target.fade = 0;
    if (target.type === 'boss') {
      this.score = Math.max(0, this.score - 50);
      this.timeLeft -= 3;
      this.streak = 0;
      this.lastHit = { x: target.x, y: target.y, points: -50 };
      return 'bossHit';
    }
    const points = Og2RangeEngine.BASE_POINTS[target.type] * (target.layer + 1) * this.multiplier;
    this.score += points;
    this.streak++;
    this.hits++;
    this.lastHit = { x: target.x, y: target.y, points };
    if (target.type === 'clock') {
      this.timeLeft += 4;
      return 'clock';
    }
    return 'hit';
  }

  update(dt) {
    const events = [];
    if (this.state !== 'playing') return events;
    this.elapsed += dt;
    this.timeLeft -= dt;
    if (this.reloading > 0) {
      this.reloading -= dt;
      if (this.reloading <= 0) {
        this.reloading = 0;
        this.ammo = this.magazine;
        events.push('reloaded');
      }
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = Math.max(0.45, 1.3 - this.elapsed / 70) * (0.7 + this.random() * 0.6);
    }
    this.entities.forEach(e => this.move(e, dt));
    this.entities = this.entities.filter(e => (e.alive ? e.x > -70 && e.x < this.width + 70 : e.fade < 0.8));
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.state = 'over';
      events.push('timeUp');
    }
    return events;
  }

  pickType() {
    const hasBoss = this.entities.some(e => e.alive && e.type === 'boss');
    const roll = this.random() * 100;
    if (roll < 45) return 'plane';
    if (roll < 75) return 'pigeon';
    if (roll < 88) return 'clock';
    return hasBoss ? 'plane' : 'boss';
  }

  spawn() {
    const type = this.pickType();
    const layerRoll = this.random();
    const layer = type === 'boss' ? 0 : layerRoll < 0.35 ? 0 : layerRoll < 0.7 ? 1 : 2;
    const scale = Og2RangeEngine.LAYER_SCALE[layer];
    const floor = Og2RangeEngine.LAYER_FLOOR[layer];
    const dir = this.random() < 0.5 ? 1 : -1;
    const entity = {
      id: this.nextId++,
      type,
      layer,
      alive: true,
      fade: 0,
      age: 0,
      dir,
      x: dir > 0 ? -40 : this.width + 40,
      y: 0,
      vx: 0,
      vy: 0,
      baseY: 0,
      phase: this.random() * 6.28,
      r: 16
    };
    if (type === 'plane') {
      entity.vx = dir * (200 + this.random() * 80) * scale;
      entity.baseY = 50 + this.random() * 190;
      entity.y = entity.baseY;
      entity.r = 15;
    } else if (type === 'pigeon') {
      entity.vx = dir * (120 + this.random() * 60) * scale;
      entity.baseY = 60 + this.random() * 200;
      entity.y = entity.baseY;
      entity.r = 17;
    } else if (type === 'clock') {
      entity.vx = dir * (110 + this.random() * 40) * scale;
      entity.vy = -(260 + this.random() * 80) * scale;
      entity.r = 16;
      entity.y = floor - entity.r * scale;
    } else {
      entity.vx = dir * 55;
      entity.r = 26;
      entity.y = floor - 50;
    }
    this.entities.push(entity);
  }

  move(entity, dt) {
    if (!entity.alive) {
      entity.fade += dt;
      return;
    }
    entity.age += dt;
    entity.x += entity.vx * dt;
    if (entity.type === 'plane') {
      entity.y = entity.baseY + Math.sin(entity.age * 3 + entity.phase) * 18;
    } else if (entity.type === 'pigeon') {
      entity.y = entity.baseY + Math.sin(entity.age * 2 + entity.phase) * 10;
    } else if (entity.type === 'clock') {
      const scale = Og2RangeEngine.LAYER_SCALE[entity.layer];
      const floor = Og2RangeEngine.LAYER_FLOOR[entity.layer] - entity.r * scale;
      entity.vy += 700 * scale * dt;
      entity.y += entity.vy * dt;
      if (entity.y >= floor) {
        entity.y = floor;
        entity.vy = -(260 + 80 * this.random()) * scale;
      }
    }
  }
};
