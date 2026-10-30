(function (B) {
  'use strict';
  const { clamp, lerp, smoothstep, wrapAngle, cameraBasis, makeCamera, TUNING, groundHeight } = B;

  class Input {
    constructor(canvas, { isActive, signal }) {
      const on = (target, type, fn) => target.addEventListener(type, fn, { signal });
      this.keys = new Set();
      this.dx = 0;
      this.dy = 0;
      this.locked = false;
      this.lastDevice = 'mouse';
      this.touch = null;
      this.onLockChange = null;
      on(window, 'keydown', (e) => {
        if (!isActive()) return;
        this.keys.add(e.code);
        if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
      });
      on(window, 'keyup', (e) => this.keys.delete(e.code));
      on(window, 'blur', () => this.keys.clear());
      on(document, 'mousemove', (e) => {
        if (!this.locked) return;
        this.dx += clamp(e.movementX, -150, 150);
        this.dy += clamp(e.movementY, -150, 150);
        this.lastDevice = 'mouse';
      });
      on(document, 'pointerlockchange', () => {
        this.locked = document.pointerLockElement === canvas;
        if (this.onLockChange) this.onLockChange(this.locked);
      });
      on(canvas, 'pointerdown', (e) => {
        if (e.pointerType !== 'mouse') this.touch = { id: e.pointerId, x: e.clientX, y: e.clientY };
      });
      on(canvas, 'pointermove', (e) => {
        if (!this.touch || e.pointerId !== this.touch.id) return;
        this.dx += (e.clientX - this.touch.x) * 1.8;
        this.dy += (e.clientY - this.touch.y) * 1.8;
        this.touch.x = e.clientX;
        this.touch.y = e.clientY;
        this.lastDevice = 'touch';
      });
      const end = (e) => { if (this.touch && e.pointerId === this.touch.id) this.touch = null; };
      on(canvas, 'pointerup', end);
      on(canvas, 'pointercancel', end);
    }
    consume() {
      const d = [this.dx, this.dy];
      this.dx = this.dy = 0;
      return d;
    }
    down(...codes) { return codes.some((c) => this.keys.has(c)); }
  }

  class Flyer {
    constructor(pose) {
      this.invertY = false;
      this.sens = 1;
      this.reset(pose);
    }
    reset(pose) {
      this.pos = pose.pos.slice();
      this.prev = pose.pos.slice();
      this.yaw = this.aimYaw = pose.yaw;
      this.pitch = pose.pitch;
      this.aimPitch = 0.02;
      this.bank = 0;
      this.speed = 14;
      this.lift = 0;
      this.agl = 6;
      this.boundary = 0;
      this.maxSpeed = 0;
      this.boosting = false;
      this.touching = false;
    }

    update(dt, input, thermals) {
      const T = TUNING;
      const [mdx, mdy] = input.consume();
      this.aimYaw -= mdx * T.mouseSens * this.sens;
      this.aimPitch -= mdy * T.mouseSens * this.sens * (this.invertY ? -1 : 1);
      const turn = (input.down('KeyA', 'ArrowLeft') ? 1 : 0) - (input.down('KeyD', 'ArrowRight') ? 1 : 0);
      const pit = (input.down('ArrowUp', 'KeyE') ? 1 : 0) - (input.down('ArrowDown', 'KeyQ') ? 1 : 0);
      if (turn || pit) input.lastDevice = 'keys';
      this.aimYaw += turn * T.keyTurn * dt;
      this.aimPitch += pit * T.keyPitch * dt;
      if (input.lastDevice === 'keys' && !pit) this.aimPitch *= Math.exp(-dt * 0.7);
      this.aimPitch = clamp(this.aimPitch, -1.25, 1.25);

      const dYaw = clamp(wrapAngle(this.aimYaw - this.yaw), -1.2, 1.2);
      this.aimYaw = this.yaw + dYaw;
      const yawRate = clamp(dYaw * T.yawFollow, -T.maxYawRate, T.maxYawRate);
      this.yaw += yawRate * dt;

      const maxClimb = lerp(0.18, T.pitchMax, smoothstep(T.vMin, 26, this.speed));
      const pitchTarget = Math.min(this.aimPitch, maxClimb);
      this.pitch += clamp((pitchTarget - this.pitch) * T.pitchFollow, -T.maxPitchRate, T.maxPitchRate) * dt;

      const bankTarget = clamp(yawRate * T.bankGain * Math.sqrt(this.speed / T.vCruise), -T.bankMax, T.bankMax);
      this.bank += (bankTarget - this.bank) * (1 - Math.exp(-dt * 3.5));

      this.boosting = input.down('KeyW', 'ShiftLeft', 'ShiftRight', 'Space');
      const brake = input.down('KeyS', 'ControlLeft');
      let a = -T.gravity * Math.sin(this.pitch) - T.drag * this.speed * this.speed;
      if (this.pitch > -0.12) a += Math.max(0, T.vCruise - this.speed) * T.cruiseGain;
      if (this.boosting) a += T.boostAccel * Math.max(0, 1 - this.speed / T.vBoost);
      if (brake) a -= T.brakeDecel;
      this.speed = Math.max(T.vMin, this.speed + a * dt);
      this.maxSpeed = Math.max(this.maxSpeed, this.speed);

      let lift = 0;
      for (const t of thermals) {
        const d = Math.hypot(this.pos[0] - t.x, this.pos[2] - t.z);
        if (d < T.thermalRadius) lift = Math.max(lift, T.thermalLift * (1 - (d / T.thermalRadius) ** 2) * smoothstep(t.top + 30, t.top - 60, this.pos[1]));
      }
      this.lift += (lift - this.lift) * (1 - Math.exp(-dt * 1.5));

      const { f } = cameraBasis(this.yaw, this.pitch, 0);
      this.prev = this.pos.slice();
      this.pos[0] += f[0] * this.speed * dt;
      this.pos[1] += (f[1] * this.speed + this.lift) * dt;
      this.pos[2] += f[2] * this.speed * dt;

      const g0 = groundHeight(this.pos[0], this.pos[2]);
      const fh = Math.hypot(f[0], f[2]) || 1, ahead = Math.min(this.speed * 0.5, 25);
      const gA = groundHeight(this.pos[0] + (f[0] / fh) * ahead, this.pos[2] + (f[2] / fh) * ahead);
      if (this.pos[1] < gA + T.minClear) this.pos[1] += (gA + T.minClear - this.pos[1]) * (1 - Math.exp(-dt * 2.5));
      this.touching = false;
      if (this.pos[1] < g0 + T.minClear) {
        this.pos[1] = g0 + T.minClear;
        this.touching = true;
        const slope = Math.atan2(gA - g0, ahead);
        if (this.pitch < slope) this.pitch += (slope - this.pitch) * (1 - Math.exp(-dt * 8));
        this.speed = Math.max(T.vMin, this.speed - this.speed * 0.2 * dt);
      }
      this.agl = this.pos[1] - g0;

      if (this.pos[1] > T.ceiling) {
        this.pos[1] -= (this.pos[1] - T.ceiling) * dt * 0.8;
        this.aimPitch = Math.min(this.aimPitch, 0);
      }
      const r = Math.hypot(this.pos[0], this.pos[2]);
      this.boundary = smoothstep(T.boundary, T.boundary + 350, r);
      if (r > T.boundary) {
        const home = Math.atan2(this.pos[0], this.pos[2]);
        this.aimYaw += wrapAngle(home - this.aimYaw) * Math.min(1, (r - T.boundary) / 300) * dt * 1.2;
      }
    }

    camera(aspect, time) {
      const T = TUNING;
      const fov = T.fovBase + T.fovBoost * smoothstep(16, 60, this.speed);
      const bob = this.boosting ? Math.sin(time * 9) * 0.07 : 0;
      const wobble = Math.sin(time * 1.7) * 0.02 * clamp(this.lift / 6, 0, 1);
      const pos = [this.pos[0], this.pos[1] + bob, this.pos[2]];
      return makeCamera(pos, this.yaw, this.pitch, this.bank * 0.8 + wobble, (fov * Math.PI) / 180, aspect);
    }
  }

  Object.assign(B, { Input, Flyer });
})(globalThis.Bliss = globalThis.Bliss || {});
