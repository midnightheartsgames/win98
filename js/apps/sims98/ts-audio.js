(function (S) {
  'use strict';
  const RATE = 22050, LOOP_SECONDS = { water: 2, sizzle: 2, tv: 3, music: 8, keys: 2, snore: 4, fire: 3, office: 4, school: 4 };
  const SHOT_SECONDS = { tick: 0.05, door: 0.22, fridge: 0.3, flush: 1.2, kiss: 0.18, slap: 0.12, ring: 0.9, chime: 0.8, alarm: 1, honk: 0.7 };
  const MUSIC = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46, 493.88, 587.33, 783.99, 587.33, 523.25, 659.25, 783.99, 1046.5];

  const ignore = () => {};

  const seeded = () => {
    const state = { rs: 98 };
    return () => S.roll(state) * 2 - 1;
  };

  const shape = (out, fn) => {
    for (let i = 0; i < out.length; i++) out[i] = S.clamp(fn(i / RATE, i), -1, 1);
    return out;
  };

  const GENERATORS = {
    tick: t => Math.sin(2 * Math.PI * (2100 - t * 9000) * t) * Math.exp(-t * 80) * 0.5,
    door(t, i, noise) {
      return noise() * Math.exp(-t * 24) * 0.28 + Math.sin(2 * Math.PI * 92 * t) * Math.exp(-t * 16) * 0.4;
    },
    fridge(t, i, noise) {
      return noise() * Math.exp(-t * 18) * 0.2 + Math.sin(2 * Math.PI * 70 * t) * Math.exp(-((t - 0.16) ** 2) * 800) * 0.4;
    },
    flush(t, i, noise) {
      return noise() * 0.34 * Math.sin(Math.PI * Math.min(t / 1.2, 1)) * (0.7 + 0.3 * Math.sin(2 * Math.PI * (9 - t * 4) * t));
    },
    kiss(t, i, noise) {
      return noise() * Math.exp(-t * 60) * 0.3 + Math.sin(2 * Math.PI * 1400 * t) * Math.exp(-t * 90) * 0.2;
    },
    slap(t, i, noise) {
      return noise() * Math.exp(-t * 45) * 0.45;
    },
    ring(t) {
      const k = t % 0.3;
      return k < 0.15 ? Math.sin(2 * Math.PI * (k < 0.075 ? 1200 : 1600) * t) * 0.16 : 0;
    },
    fire(t, i, noise) {
      const crack = (t * 13) % 1;
      return noise() * (0.1 + 0.06 * Math.sin(2 * Math.PI * 0.7 * t)) + noise() * Math.exp(-crack * 30) * 0.2;
    },
    alarm(t) {
      return Math.sin(2 * Math.PI * (880 + 220 * Math.sign(Math.sin(2 * Math.PI * 4 * t))) * t) * 0.15 * Math.min(1, (1 - t) * 4);
    },
    chime(t) {
      return Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 4) * 0.22 + (t > 0.12 ? Math.sin(2 * Math.PI * 1320 * t) * Math.exp(-(t - 0.12) * 5) * 0.14 : 0);
    },
    water(t, i, noise) {
      return noise() * (0.2 + 0.05 * Math.sin(2 * Math.PI * t));
    },
    sizzle(t, i, noise) {
      return noise() * (i % 2 ? 0.24 : -0.24) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 3 * t));
    },
    tv(t) {
      const syll = Math.floor(t * 7), pitch = 180 + ((syll * 37) % 90);
      return (Math.sin(2 * Math.PI * pitch * t) + 0.5 * Math.sin(4 * Math.PI * pitch * t)) * 0.16 * Math.abs(Math.sin(Math.PI * t * 7));
    },
    music(t) {
      const beat = t * 4, note = Math.floor(beat) % MUSIC.length, k = beat - Math.floor(beat), bass = MUSIC[Math.floor(beat / 4) * 4 % MUSIC.length] / 4;
      return Math.sin(2 * Math.PI * MUSIC[note] * t) * Math.exp(-k * 3) * 0.2 + Math.sin(2 * Math.PI * bass * t) * 0.14;
    },
    honk(t) {
      const on = t < 0.22 || (t > 0.32 && t < 0.62);
      return on ? (Math.sign(Math.sin(2 * Math.PI * 392 * t)) * 0.08 + Math.sign(Math.sin(2 * Math.PI * 494 * t)) * 0.06) * Math.min(1, (0.7 - t) * 8) : 0;
    },
    office(t, i, noise) {
      const k = (t * 7) % 1, phone = t > 2.6 && t < 3.1 && (t * 20) % 1 < 0.5;
      return noise() * (0.05 + 0.02 * Math.sin(2 * Math.PI * 0.5 * t)) + noise() * Math.exp(-k * 50) * 0.12 + (phone ? Math.sin(2 * Math.PI * 1100 * t) * 0.05 : 0);
    },
    school(t, i, noise) {
      const voice = Math.floor(t * 5), pitch = 220 + ((voice * 53) % 140);
      return noise() * 0.05 + Math.sin(2 * Math.PI * pitch * t) * 0.05 * Math.abs(Math.sin(Math.PI * t * 5)) + (t > 3.4 && t < 3.6 ? noise() * 0.1 : 0);
    },
    keys(t, i, noise) {
      const k = (t * 9) % 1;
      return noise() * Math.exp(-k * 40) * 0.26;
    },
    snore(t, i, noise) {
      const k = Math.sin(Math.PI * ((t / 4) % 1));
      return noise() * k * k * 0.12;
    }
  };

  const render = (name, seconds) => {
    const noise = seeded(), fn = GENERATORS[name], out = new Float32Array(Math.round(seconds * RATE));
    return shape(out, (t, i) => fn(t, i, noise));
  };

  class Sound {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.buffers = new Map();
      this.loops = new Map();
    }

    unlock() {
      if (!this.ctx) {
        const Native = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Native) return;
        this.ctx = new Native();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.6;
        this.master.connect(this.ctx.destination);
        S.live.audio++;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(ignore);
    }

    bufferOf(name, seconds) {
      if (!this.buffers.has(name)) {
        const buffer = this.ctx.createBuffer(1, Math.round(seconds * RATE), RATE);
        buffer.copyToChannel(render(name, seconds), 0);
        this.buffers.set(name, buffer);
      }
      return this.buffers.get(name);
    }

    play(name, gain) {
      if (!this.ctx || !SHOT_SECONDS[name]) return;
      const source = this.ctx.createBufferSource(), level = this.ctx.createGain();
      source.buffer = this.bufferOf(name, SHOT_SECONDS[name]);
      level.gain.value = gain === undefined ? 1 : gain;
      source.connect(level);
      level.connect(this.master);
      source.start();
    }

    setLoops(wanted) {
      if (!this.ctx) return;
      for (const [name, loop] of this.loops) {
        if (wanted.has(name)) continue;
        loop.source.stop();
        this.loops.delete(name);
      }
      for (const [name, gain] of wanted) {
        let loop = this.loops.get(name);
        if (!loop) {
          const source = this.ctx.createBufferSource(), level = this.ctx.createGain();
          source.buffer = this.bufferOf(name, LOOP_SECONDS[name]);
          source.loop = true;
          source.connect(level);
          level.connect(this.master);
          source.start();
          loop = { source, level };
          this.loops.set(name, loop);
        }
        loop.level.gain.value = gain;
      }
    }

    pause(paused) {
      if (!this.ctx) return;
      if (paused && this.ctx.state === 'running') this.ctx.suspend().catch(ignore);
      else if (!paused && this.ctx.state === 'suspended') this.ctx.resume().catch(ignore);
    }

    destroy() {
      if (!this.ctx) return;
      this.ctx.close().catch(ignore);
      this.ctx = null;
      this.loops.clear();
      this.buffers.clear();
      S.live.audio--;
    }
  }

  S.Sound = Sound;
  S.SoundData = { RATE, LOOP_SECONDS, SHOT_SECONDS, render };
})(globalThis.Sims98 = globalThis.Sims98 || {});
