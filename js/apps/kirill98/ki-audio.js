(function (K) {
  'use strict';

  const BELLS = {
    plate: [[520, 0.5], [1180, 0.42], [1850, 0.3], [2660, 0.2]],
    iron: [[330, 0.35], [720, 0.28], [1310, 0.18]],
    steel: [[1250, 0.45], [2380, 0.36], [3570, 0.24], [4400, 0.16]],
    parry: [[1480, 0.7], [2960, 0.55], [4120, 0.4]]
  };

  class Sound {
    constructor() {
      this.ctx = null;
      this.noise = null;
      this.master = null;
      this.volume = 0.8;
    }

    wake() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return true;
      }
      const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Ctx) return false;
      try { this.ctx = new Ctx(); } catch (e) { return false; }
      const ctx = this.ctx, len = ctx.sampleRate, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0), r = K.rng(31);
      for (let i = 0; i < len; i++) d[i] = r() * 2 - 1;
      this.noise = buf;
      this.master = ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(ctx.destination);
      return true;
    }

    bus(at, ear, far) {
      const ctx = this.ctx, g = ctx.createGain(), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      let level = 1, side = 0;
      if (at && ear) {
        const dx = at[0] - ear.eye[0], dy = at[1] - ear.eye[1], dz = at[2] - ear.eye[2], d = Math.hypot(dx, dy, dz);
        level = far ? Math.pow(Math.max(0, 1 - d / far), 1.6) : 1 / (1 + d * d / 30);
        side = d > 0.2 ? K.clamp((dx * ear.right[0] + dz * ear.right[2]) / d, -1, 1) * 0.8 : 0;
      }
      g.gain.value = level;
      if (pan) { pan.pan.value = side; g.connect(pan); pan.connect(this.master); } else g.connect(this.master);
      return g;
    }

    burst(out, t, dur, amp, type, f0, f1, q) {
      const ctx = this.ctx, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = this.noise;
      src.loop = dur > 0.4;
      f.type = type;
      f.frequency.setValueAtTime(f0, t);
      if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      f.Q.value = q || 0.8;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + Math.min(0.012, dur * 0.2));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(out);
      src.start(t, Math.random() * 0.5);
      src.stop(t + dur + 0.05);
    }

    tone(out, t, freq, dur, amp, kind) {
      const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = kind || 'sine';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    }

    play(kind, opts) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const o = opts || {}, out = this.bus(o.at, o.ear, o.far), t = this.ctx.currentTime + 0.005, p = K.clamp(o.power || 1, 0.3, 1.4);
      if (kind === 'whoosh') this.burst(out, t, 0.2 * p, 0.16 * p, 'bandpass', 380, 1500, 1.4);
      else if (kind === 'flesh') { this.burst(out, t, 0.13, 0.55 * p, 'lowpass', 900, 300); this.tone(out, t, 85, 0.16, 0.45 * p); }
      else if (kind === 'mail') { this.burst(out, t, 0.1, 0.3 * p, 'lowpass', 800, 300); for (let i = 0; i < 3; i++) this.burst(out, t + i * 0.035, 0.07, 0.18 * p, 'highpass', 3500, 0, 0.7); }
      else if (kind === 'wood') { this.burst(out, t, 0.09, 0.55 * p, 'bandpass', 720, 0, 3); this.tone(out, t, 180, 0.1, 0.35 * p); }
      else if (kind === 'straw') this.burst(out, t, 0.14, 0.35 * p, 'lowpass', 1800, 600);
      else if (kind === 'kick') { this.tone(out, t, 62, 0.14, 0.6 * p); this.burst(out, t, 0.08, 0.35 * p, 'lowpass', 320, 0); }
      else if (kind === 'growl') { this.burst(out, t, 0.55, 0.3 * p, 'lowpass', 420, 160, 2); this.tone(out, t, 88, 0.5, 0.16 * p, 'sawtooth'); this.tone(out, t + 0.05, 93, 0.42, 0.1 * p, 'sawtooth'); }
      else if (kind === 'bark') { for (const d of [0, 0.19]) { this.burst(out, t + d, 0.09, 0.5 * p, 'bandpass', 900, 500, 2.5); this.tone(out, t + d, 380, 0.08, 0.18 * p, 'square'); } }
      else if (kind === 'cut') { this.burst(out, t, 0.22, 0.5 * p, 'lowpass', 1300, 260); this.burst(out, t + 0.02, 0.16, 0.25 * p, 'bandpass', 420, 0, 4); }
      else if (kind === 'jingle') { for (let i = 0; i < 4; i++) { const d = i * 0.06 + Math.random() * 0.04, f = [2350, 2780, 3130, 2590][i]; this.tone(out, t + d, f, 0.32, 0.07 * p, 'sine'); this.tone(out, t + d, f * 2.7, 0.12, 0.025 * p, 'sine'); } }
      else if (kind === 'bell') { for (const [f, dur, a] of [[196, 4.5, 0.32], [392, 3.2, 0.18], [470, 2.6, 0.12], [588, 2.2, 0.1], [784, 1.4, 0.06]]) this.tone(out, t, f, dur, a * p, 'sine'); }
      else if (kind === 'crack') { this.burst(out, t, 0.5, 0.45 * p, 'bandpass', 900, 200, 1.2); this.burst(out, t + 0.45, 0.8, 0.7 * p, 'lowpass', 500, 80, 0.7); this.tone(out, t + 0.5, 48, 0.6, 0.5 * p); }
      else if (kind === 'horn') { for (const [d, f, dur] of [[0, 147, 1.1], [1.25, 147, 0.5], [1.85, 196, 1.6]]) { this.tone(out, t + d, f, dur, 0.22 * p, 'sawtooth'); this.tone(out, t + d, f * 2, dur * 0.8, 0.07 * p, 'triangle'); } }
      else if (kind === 'fire') { this.burst(out, t, 0.9, 0.18 * p, 'lowpass', 700, 200, 0.8); for (let i = 0; i < 4; i++) this.burst(out, t + Math.random() * 0.8, 0.03, 0.25 * p, 'highpass', 2600, 0); }
      else if (kind === 'splash') { this.burst(out, t, 0.35, 0.4 * p, 'bandpass', 1200, 500, 0.8); this.burst(out, t + 0.05, 0.25, 0.25 * p, 'lowpass', 600, 200); }
      else if (kind === 'thunder') {
        if (o.near) this.burst(out, t, 0.35, 0.8 * p, 'highpass', 1800, 400, 0.6);
        this.burst(out, t + (o.near ? 0.05 : 0), 3.2 * Math.min(1, p), 0.7 * p, 'lowpass', o.near ? 600 : 260, 60, 0.6);
        this.burst(out, t + 0.6, 2.4, 0.45 * p, 'lowpass', 180, 45, 0.8);
        this.tone(out, t + 0.1, 38, 2.2, 0.35 * p);
      }
      else if (kind === 'chop') { this.burst(out, t, 0.08, 0.5 * p, 'bandpass', 1300, 0, 4); this.tone(out, t, 220, 0.07, 0.3 * p); }
      else if (BELLS[kind]) {
        for (const [f, dur] of BELLS[kind]) this.tone(out, t, f * (0.98 + Math.random() * 0.04), dur, 0.12 * p, 'sine');
        this.burst(out, t, 0.04, 0.25 * p, 'highpass', 2000, 0);
      }
    }

    rain(level) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const ctx = this.ctx, want = K.clamp(level || 0, 0, 1) * 0.22;
      if (!this.rainBed) {
        if (want < 0.002) return;
        const src = ctx.createBufferSource(), hi = ctx.createBiquadFilter(), lo = ctx.createBiquadFilter(), g = ctx.createGain();
        src.buffer = this.noise;
        src.loop = true;
        hi.type = 'highpass';
        hi.frequency.value = 900;
        lo.type = 'lowpass';
        lo.frequency.value = 5200;
        g.gain.value = 0;
        src.connect(hi);
        hi.connect(lo);
        lo.connect(g);
        g.connect(this.master);
        src.start();
        this.rainBed = { src, g, level: 0 };
      }
      const R = this.rainBed;
      if (Math.abs(R.level - want) < 0.002) return;
      R.level = want;
      R.g.gain.setTargetAtTime(want, ctx.currentTime, 0.6);
    }

    destroy() {
      if (this.ctx) { try { this.ctx.close(); } catch (e) { } }
      this.ctx = null;
      this.rainBed = null;
    }
  }

  K.Sound = Sound;
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
