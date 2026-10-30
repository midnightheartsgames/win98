(function (B) {
  'use strict';
  const { clamp, lerp, smoothstep } = B;

  class Ambience {
    constructor() {
      this.ctx = null;
      this.vol = 0.8;
      this.muted = false;
    }

    start() {
      if (this.ctx) { this.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const c = (this.ctx = new AC());
      this.master = c.createGain();
      this.master.gain.value = this.muted ? 0 : this.vol;
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 3;
      this.master.connect(comp).connect(c.destination);
      this.noise = this.makeNoise(4);
      this.muffle = c.createBiquadFilter();
      this.muffle.type = 'lowpass';
      this.muffle.frequency.value = 18000;
      this.muffle.connect(this.master);
      this.amb = this.layer('lowpass', 380, 0.5, this.muffle);
      this.fly = this.layer('bandpass', 500, 0.7, null);
      this.flyPan = c.createStereoPanner();
      this.fly.g.connect(this.flyPan).connect(this.muffle);
      this.whistle = this.layer('bandpass', 900, 9, this.muffle);
      this.grass = this.layer('highpass', 2600, 0.5, this.master);
      this.therm = this.layer('bandpass', 210, 1.2, this.muffle);
      this.birdBus = c.createGain();
      this.birdBus.connect(this.muffle);
      this.gust = 0.5;
      this.nextBird = c.currentTime + 1.2;
    }

    makeNoise(sec) {
      const c = this.ctx, len = Math.floor(c.sampleRate * sec), buf = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
          b6 = w * 0.115926;
        }
      }
      return buf;
    }

    layer(type, freq, q, dest) {
      const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = this.noise;
      src.loop = true;
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      g.gain.value = 0;
      src.connect(f).connect(g);
      if (dest) g.connect(dest);
      src.start(0, Math.random() * 3.5);
      return { src, f, g };
    }

    to(param, v, tc = 0.1) { param.setTargetAtTime(v, this.ctx.currentTime, tc); }

    update(dt, s) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      this.gust = clamp(this.gust + (Math.random() - 0.5) * dt * 0.9, 0.15, 1);
      const sp = clamp((s.speed - 8) / 55, 0, 1);
      this.to(this.amb.g.gain, 0.09 + 0.1 * this.gust, 0.6);
      this.to(this.amb.f.frequency, 280 + 260 * this.gust, 0.6);
      this.to(this.fly.g.gain, 0.03 + 0.5 * sp ** 1.5, 0.15);
      this.to(this.fly.f.frequency, 350 + 2200 * sp, 0.2);
      this.to(this.flyPan.pan, clamp(-s.bank * 0.6, -0.8, 0.8), 0.2);
      this.to(this.whistle.g.gain, 0.05 * smoothstep(0.45, 0.9, sp), 0.2);
      this.to(this.whistle.f.frequency, 700 + 1400 * sp, 0.2);
      const near = smoothstep(7, 2, s.agl);
      this.to(this.grass.g.gain, near * (0.03 + 0.2 * sp) * (0.6 + 0.4 * Math.random()), 0.05);
      this.to(this.therm.g.gain, clamp(s.lift / 6.5, 0, 1) * 0.2, 0.4);
      this.to(this.muffle.frequency, lerp(18000, 650, s.inCloud), 0.15);
      this.to(this.birdBus.gain, (1 - smoothstep(40, 240, s.agl) * 0.85) * (1 - s.inCloud), 0.5);
      if (this.ctx.currentTime > this.nextBird) {
        this.bird(s);
        this.nextBird = this.ctx.currentTime + 1.2 + Math.random() * 3.8;
      }
    }

    tone(t, dur, f0, f1, out, type = 'sine', vol = 1) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + Math.min(0.012, dur * 0.3));
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + dur + 0.02);
      return o;
    }

    bird(s) {
      const c = this.ctx, t = c.currentTime + 0.05;
      const pan = c.createStereoPanner(), out = c.createGain();
      pan.pan.value = Math.random() * 1.6 - 0.8;
      out.gain.value = 0.2 + Math.random() * 0.3;
      out.connect(pan).connect(this.birdBus);
      const r = Math.random();
      if (s.nearThermal && r < 0.35) this.hawk(t, out);
      else if (r < 0.45) this.chirps(t, out);
      else if (r < 0.78) this.song(t, out);
      else this.trill(t, out);
      setTimeout(() => pan.disconnect(), 4000);
    }
    chirps(t, out) {
      const n = 2 + Math.floor(Math.random() * 4), f = 2800 + Math.random() * 1400;
      for (let i = 0; i < n; i++) this.tone(t + i * (0.09 + Math.random() * 0.06), 0.06, f, f * 1.35, out, 'sine', 0.6);
    }
    song(t, out) {
      let f = 1700 + Math.random() * 900;
      for (let i = 0, n = 2 + Math.floor(Math.random() * 3); i < n; i++) {
        const d = 0.14 + Math.random() * 0.16, f2 = f * (0.85 + Math.random() * 0.35);
        const o = this.tone(t, d, f, f2, out, 'sine', 0.5);
        const lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
        lfo.frequency.value = 7;
        lg.gain.value = 35;
        lfo.connect(lg).connect(o.frequency);
        lfo.start(t);
        lfo.stop(t + d);
        t += d + 0.05 + Math.random() * 0.1;
        f = f2 * (0.9 + Math.random() * 0.3);
      }
    }
    trill(t, out) {
      const c = this.ctx, d = 0.8 + Math.random(), o = c.createOscillator(), m = c.createOscillator();
      const mg = c.createGain(), g = c.createGain(), am = c.createOscillator(), ag = c.createGain();
      o.frequency.value = 3600 + Math.random() * 900;
      m.frequency.value = 24 + Math.random() * 14;
      mg.gain.value = 500;
      m.connect(mg).connect(o.frequency);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.08);
      g.gain.setValueAtTime(0.2, t + d - 0.1);
      g.gain.linearRampToValueAtTime(0, t + d);
      am.frequency.value = 11;
      ag.gain.value = 0.1;
      am.connect(ag).connect(g.gain);
      o.connect(g).connect(out);
      for (const x of [o, m, am]) { x.start(t); x.stop(t + d + 0.05); }
    }
    hawk(t, out) {
      const c = this.ctx, d = 0.9, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(2300, t);
      o.frequency.exponentialRampToValueAtTime(1500, t + d);
      f.type = 'bandpass';
      f.frequency.value = 2200;
      f.Q.value = 2.5;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(f).connect(g).connect(out);
      o.start(t);
      o.stop(t + d + 0.05);
    }

    noiseBurst(t, dur, vol, type, freq, dest) {
      const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = this.noise;
      f.type = type;
      f.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(f).connect(g).connect(dest || this.master);
      s.start(t, Math.random() * 2, dur + 0.05);
      return f;
    }
    shutter() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.noiseBurst(t, 0.045, 0.6, 'highpass', 1800);
      this.noiseBurst(t + 0.075, 0.06, 0.4, 'highpass', 1400);
    }
    whoosh() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime, f = this.noiseBurst(t, 1.2, 0.35, 'lowpass', 300);
      f.frequency.setValueAtTime(300, t);
      f.frequency.exponentialRampToValueAtTime(1800, t + 0.4);
    }
    chime(notes = [0, 4, 7, 12]) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      notes.forEach((n, i) => {
        const f = 660 * 2 ** (n / 12);
        [1, 2.76, 5.4].forEach((h, k) => this.tone(t + i * 0.16, 1.6 / (k + 1), f * h, f * h, this.master, 'sine', 0.1 / (k + 1)));
      });
    }

    setVolume(v) {
      this.vol = v;
      if (this.master) this.to(this.master.gain, this.muted ? 0 : v, 0.05);
    }
    toggleMute() {
      this.muted = !this.muted;
      this.setVolume(this.vol);
      return this.muted;
    }
    resume() { this.ctx.resume().catch(() => {}); }
    pause(p) {
      if (!this.ctx) return;
      if (p) this.ctx.suspend().catch(() => {}); else this.resume();
    }
  }

  Object.assign(B, { Ambience });
})(globalThis.Bliss = globalThis.Bliss || {});
