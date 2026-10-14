(function (N) {
  'use strict';

  N.WEATHER = {
    clear: { name: 'Ясно', cloud: 0.4, dark: 0, rain: 0, fog: 0, haze: 0.1, wind: 2.5, dur: [300, 600] },
    cloudy: { name: 'Пасмурно', cloud: 0.9, dark: 0.42, rain: 0, fog: 0.04, haze: 0.32, wind: 5, dur: [200, 420] },
    rain: { name: 'Дождь', cloud: 1, dark: 0.82, rain: 1, fog: 0.14, haze: 0.45, wind: 7, dur: [150, 360] },
    fog: { name: 'Туман', cloud: 0.55, dark: 0.12, rain: 0, fog: 1, haze: 1, wind: 0.6, dur: [180, 360] }
  };
  N.WEATHER_IDS = Object.keys(N.WEATHER);

  const NEXT = {
    clear: [['clear', 3], ['cloudy', 5], ['fog', 1]],
    cloudy: [['clear', 3.5], ['cloudy', 1.5], ['rain', 4], ['fog', 1]],
    rain: [['cloudy', 5.5], ['clear', 1.5], ['rain', 2.5], ['fog', 0.6]],
    fog: [['clear', 5], ['cloudy', 4], ['fog', 1]]
  };
  const KEYS = ['cloud', 'dark', 'haze', 'fog', 'wind'];
  const NATURAL = 1 / 45;
  const FAST = 1 / 3;

  class Weather {
    constructor(seed, kind, emit) {
      this.rng = N.rng(seed);
      this.emit = emit || (() => { });
      this.kind = N.WEATHER[kind] ? kind : 'clear';
      this.lock = false;
      this.t = 0;
      this.burst = 0.8;
      this.burstT = 40;
      this.windYaw = this.rng() * Math.PI * 2;
      this.gust = 0;
      this.flash = 0;
      this.strike = null;
      this.strikeT = this.rng.range(8, 20);
      this.afterRain = 999;
      this.rainbow = 0;
      this.set(this.kind, 'instant');
    }

    get name() { return N.WEATHER[this.kind].name; }
    get grip() { return 1 - 0.12 * this.wet - 0.08 * this.puddle; }
    get sight() { return 1 - 0.5 * this.fog - 0.22 * this.rain; }
    get crowd() { return 1 - 0.55 * this.rain - 0.2 * this.fog; }

    target(k) {
      const p = N.WEATHER[this.kind];
      if (k === 'rain') return p.rain * (0.35 + 0.65 * this.burst) * N.smooth(0.72, 0.96, this.cloud);
      if (k === 'wind') return p.wind * (0.75 + 0.35 * this.burst);
      return p[k];
    }

    set(kind, mode, lock) {
      if (!N.WEATHER[kind]) return false;
      this.kind = kind;
      if (lock !== undefined) this.lock = !!lock;
      const p = N.WEATHER[kind];
      this.timer = this.rng.range(p.dur[0], p.dur[1]);
      this.rate = mode === 'fast' ? FAST : NATURAL;
      if (mode === 'instant') {
        for (const k of KEYS) this[k] = this.target(k);
        this.rain = p.rain * (0.35 + 0.65 * this.burst);
        this.wet = p.rain ? 1 : 0;
        this.puddle = p.rain ? 0.7 : 0;
        this.afterRain = p.rain ? 0 : 999;
        this.rainbow = 0;
      }
      return true;
    }

    pick(hour) {
      const fogK = hour >= 4 && hour < 9 ? 3 : hour >= 11 && hour < 18 ? 0.25 : hour >= 20 ? 1.3 : 1;
      const list = NEXT[this.kind].map(([k, w]) => [k, k === 'fog' ? w * fogK : w]);
      const next = this.rng.weighted(list);
      const changed = next !== this.kind;
      this.set(next);
      if (changed) this.emit({ t: 'weather', kind: next, natural: true });
    }

    step(dt, hour, day) {
      this.t += dt;
      if (!this.lock) {
        this.timer -= dt;
        if (this.timer <= 0) this.pick(hour);
      }
      this.burstT -= dt;
      if (this.burstT <= 0) { this.burstT = this.rng.range(25, 80); this.burst = this.rng.range(0.45, 1); }
      const sp = this.rate * dt;
      let settled = true;
      for (const k of KEYS) {
        const tg = this.target(k);
        this[k] = N.approach(this[k], tg, sp * (k === 'wind' ? 8 : k === 'fog' ? 0.8 : 1));
        if (Math.abs(this[k] - tg) > 0.01) settled = false;
      }
      this.rain = N.approach(this.rain, this.target('rain'), sp * 1.5);
      if (settled && this.rate > NATURAL) this.rate = NATURAL;
      if (this.rain > 0.02) {
        this.wet = Math.min(1, this.wet + dt * this.rain * 0.12);
        this.puddle = Math.min(1, this.puddle + dt * this.rain * 0.018);
        this.afterRain = 0;
      } else {
        const dry = day ? 1 : 0.45;
        this.wet = Math.max(0, this.wet - dt * 0.0045 * dry);
        this.puddle = Math.max(0, this.puddle - dt * 0.0016 * dry);
        this.afterRain += dt;
      }
      const bow = this.afterRain > 4 && this.afterRain < 160 && this.cloud < 0.93 && this.wet > 0.3 ? 1 : 0;
      this.rainbow = N.approach(this.rainbow, bow, dt / 12);
      this.windYaw += (N.noise2(this.t * 0.01, 3.7) - 0.5) * dt * 0.12;
      this.gust = N.noise2(this.t * 0.35, 9.1) * 2 - 1;
      this.stepStorm(dt);
    }

    stepStorm(dt) {
      if (this.strike) {
        const s = this.strike;
        s.t += dt;
        let f = 0;
        for (const q of s.pulses) { const u = s.t - q[0]; if (u >= 0) f += q[1] * Math.exp(-u * 14); }
        this.flash = Math.min(1.5, f);
        if (s.t > 1.4) { this.strike = null; this.flash = 0; }
      }
      if (!(this.rain > 0.55 && this.dark > 0.6)) { this.strikeT = Math.max(this.strikeT, 6); return; }
      this.strikeT -= dt * (0.5 + this.burst);
      if (this.strikeT <= 0) { this.strikeT = this.rng.range(7, 26); this.lightning(); }
    }

    lightning(dist) {
      const d = dist || this.rng.range(500, 4000);
      const n = 1 + Math.floor(this.rng() * 3);
      const near = Math.min(1, 1500 / d);
      const pulses = [];
      let t = 0;
      for (let i = 0; i < n; i++) { pulses.push([t, (i ? this.rng.range(0.4, 0.9) : 1) * (0.55 + 0.45 * near)]); t += this.rng.range(0.07, 0.24); }
      this.strike = { t: 0, a: this.rng() * Math.PI * 2, d, seed: this.rng() * 100, pulses };
      this.emit({ t: 'thunder', delay: d / 343, d });
      return this.strike;
    }

    get windX() { return Math.cos(this.windYaw) * this.wind * (1 + 0.25 * this.gust); }
    get windZ() { return Math.sin(this.windYaw) * this.wind * (1 + 0.25 * this.gust); }
  }

  N.Weather = Weather;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
