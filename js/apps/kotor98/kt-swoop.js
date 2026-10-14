(function (K) {
  'use strict';
  const GEARS = [0, 16, 26, 36, 46, 56];
  const LENGTH = 1150;

  class Swoop {
    constructor(o) {
      o = o || {};
      this.rng = new K.RNG(o.seed || 7);
      this.rival = o.rival || 26.8;
      this.length = LENGTH;
      this.pos = 0;
      this.x = 0;
      this.speed = 0;
      this.gear = 1;
      this.rpm = 0;
      this.time = 0;
      this.countdown = 3;
      this.finished = false;
      this.stunT = 0;
      this.boostT = 0;
      this.hits = 0;
      this.boosts = 0;
      this.goodShifts = 0;
      this.msg = '';
      this.msgT = 0;
      this.items = [];
      let z = 90;
      while (z < LENGTH - 40) {
        const lane = this.rng.int(-1, 1);
        const kind = this.rng.chance(0.38) ? 'boost' : 'block';
        this.items.push({ z, x: lane * 1.0, kind, hit: false });
        if (kind === 'block' && this.rng.chance(0.35)) {
          let l2 = this.rng.int(-1, 1);
          if (l2 === lane) l2 = lane === 1 ? -1 : lane + 1;
          this.items.push({ z, x: l2, kind: 'block', hit: false });
        }
        z += 38 + this.rng.int(0, 40);
      }
    }

    topSpeed() { return GEARS[this.gear]; }

    shift() {
      if (this.countdown > 0 || this.finished || this.gear >= 5) return 'none';
      let q;
      if (this.rpm >= 0.72 && this.rpm <= 0.93) { q = 'good'; this.speed += 5; this.goodShifts++; this.say('Идеально!'); }
      else if (this.rpm > 0.93) { q = 'late'; this.say('Поздно'); }
      else { q = 'early'; this.speed *= 0.86; this.say('Рано!'); }
      this.gear++;
      this.rpm = Math.max(0, this.rpm - 0.55);
      return q;
    }

    say(t) { this.msg = t; this.msgT = 1.2; }

    update(dt, input) {
      input = input || {};
      if (this.msgT > 0) this.msgT -= dt;
      if (this.finished) return;
      if (this.countdown > 0) { this.countdown -= dt; if (this.countdown <= 0) this.say('Старт!'); return; }
      this.time += dt;
      const steer = K.clamp(input.steer || 0, -1, 1);
      this.x = K.clamp(this.x + steer * dt * 3.2, -1.35, 1.35);
      const top = this.topSpeed() + (this.boostT > 0 ? 14 : 0);
      if (this.stunT > 0) { this.stunT -= dt; this.speed = Math.max(0, this.speed - 30 * dt); }
      else if (this.speed < top) this.speed = Math.min(top, this.speed + (22 - this.gear * 2.2) * dt);
      else this.speed = Math.max(top, this.speed - 18 * dt);
      if (this.boostT > 0) this.boostT -= dt;
      this.rpm = Math.min(1.08, this.rpm + dt * (0.52 - this.gear * 0.05) * (this.speed >= this.topSpeed() - 1 ? 1.4 : 1));
      if (this.rpm >= 1.05 && this.gear < 5) { this.speed = Math.max(0, this.speed - 10 * dt); }
      const prev = this.pos;
      this.pos += this.speed * dt;
      for (const it of this.items) {
        if (it.hit || it.z < prev - 1 || it.z > this.pos + 0.5) continue;
        if (Math.abs(it.x - this.x) < 0.55) {
          it.hit = true;
          if (it.kind === 'block') { this.speed *= 0.45; this.stunT = 0.45; this.hits++; this.say('Удар!'); }
          else { this.boostT = 1.6; this.speed += 10; this.boosts++; this.say('Ускорение!'); }
        }
      }
      if (this.pos >= this.length) { this.finished = true; this.pos = this.length; this.say('Финиш: ' + this.time.toFixed(2) + ' с'); }
    }

    autopilot() {
      const ahead = this.items.filter(it => !it.hit && it.z > this.pos && it.z < this.pos + 45).sort((a, b) => a.z - b.z);
      let want = this.x;
      const blocks = ahead.filter(it => it.kind === 'block');
      const boost = ahead.find(it => it.kind === 'boost');
      const lanes = [-1, 0, 1];
      const firstBlockZ = blocks.length ? blocks[0].z : 1e9;
      const blockedLanes = blocks.filter(b => b.z === firstBlockZ).map(b => b.x);
      if (boost && boost.z < firstBlockZ && !blockedLanes.includes(boost.x)) want = boost.x;
      else if (blockedLanes.length) {
        const free = lanes.filter(l => !blockedLanes.includes(l)).sort((a, b) => Math.abs(a - this.x) - Math.abs(b - this.x));
        if (free.length) want = free[0];
      }
      const steer = Math.abs(want - this.x) < 0.08 ? 0 : Math.sign(want - this.x);
      const shift = this.rpm >= 0.78 && this.rpm <= 0.9 && this.gear < 5;
      return { steer, shift };
    }
  }

  Swoop.GEARS = GEARS;
  K.Swoop = Swoop;
  if (typeof module !== 'undefined' && module.exports) module.exports = K;
})(globalThis.Kotor98 = globalThis.Kotor98 || {});
