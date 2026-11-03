(function (S) {
  'use strict';
  const STEP = 1 / 60, SNAP = 0.0015, MORNING = 360, UNTIL_DONE = 4, FREE_WILL_DEFAULT = 2;

  class Game {
    constructor(doc, seed) {
      this.seed = seed;
      this.scene = S.Town.create(doc, seed);
      this.world = this.scene.world;
      this.active = this.world.sims[0];
      this.speed = 1;
      this.lastSpeed = 1;
      this.freeWill = FREE_WILL_DEFAULT;
      this.hold = false;
      this.left = 0;
      this.events = [];
    }

    setSpeed(speed) {
      this.speed = speed;
      if (speed) this.lastSpeed = speed;
    }

    togglePause() {
      this.setSpeed(this.speed ? 0 : this.lastSpeed);
    }

    fixed(fx, fz) {
      const world = this.world, before = world.clock;
      const dt = STEP * S.SPEEDS[this.speed];
      S.Town.step(world, dt, fx, fz);
      S.Acts.stepAll(world, dt, this.freeWill);
      S.Social.step(world, dt);
      S.Food.step(world, dt);
      S.Garden.step(world, dt);
      S.Collect.step(world);
      S.Art.royalties(world);
      S.Jobs.step(world, dt);
      S.Upkeep.step(world);
      S.Services.step(world, dt);
      S.Opps.step(world, dt);
      if (before < MORNING && world.clock >= MORNING) this.events.push({ type: 'morning', day: world.day });
      if (world.events.length) this.events.push(...world.events.splice(0));
      if (this.speed === UNTIL_DONE && !S.Acts.busy(this.active)) this.setSpeed(1);
    }

    advance(real, fx, fz) {
      if (!this.speed || this.hold) return 0;
      this.left += Math.abs(real - STEP) < SNAP ? STEP : real;
      let steps = 0;
      while (this.left >= STEP) {
        this.left -= STEP;
        this.fixed(fx, fz);
        steps++;
      }
      return steps;
    }

    hash() {
      return S.hash(S.Save.state(this));
    }
  }

  Game.STEP = STEP;
  Game.UNTIL_DONE = UNTIL_DONE;
  S.Game = Game;
})(globalThis.Sims98 = globalThis.Sims98 || {});
