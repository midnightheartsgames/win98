(function (M) {
  'use strict';
  class Audio {
    constructor() {
      this.ctx = null; this.master = null; this.volume = 0.7; this.musicVolume = 0.35; this.musicTimer = 0; this.musicPlaying = false; this.enabled = true;
      this.lastPlay = {};
    }
    init() {
      if (this.ctx) return;
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = this.volume; this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = this.musicVolume; this.musicGain.connect(this.ctx.destination);
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; }
    setMusicVolume(v) { this.musicVolume = v; if (this.musicGain) this.musicGain.gain.value = v; }
    noiseBuffer(len) {
      const b = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * len), this.ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return b;
    }
    env(gain, t, a, d, peak = 1, sustain = 0) {
      gain.gain.setValueAtTime(0.0001, t); gain.gain.linearRampToValueAtTime(peak, t + a); gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustain), t + a + d);
    }
    noise(t, dur, freq, q, vol, type = 'bandpass') {
      const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuffer(dur + 0.05);
      const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = this.ctx.createGain(); this.env(g, t, 0.005, dur, vol);
      src.connect(f); f.connect(g); g.connect(this.master); src.start(t); src.stop(t + dur + 0.1);
    }
    tone(t, dur, freq, type, vol, slide = 0, a = 0.01) {
      const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
      const g = this.ctx.createGain(); this.env(g, t, a, dur, vol);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.1);
    }
    play(name, dist = 0) {
      if (!this.ctx || !this.enabled) return;
      const now = performance.now();
      if (this.lastPlay[name] && now - this.lastPlay[name] < 40) return;
      this.lastPlay[name] = now;
      const v = M.clamp(1 - dist / 24, 0, 1);
      if (v <= 0) return;
      const t = this.ctx.currentTime, r = Math.random();
      const stepMat = name.startsWith('step_') ? name.slice(5) : name.startsWith('break_') ? name.slice(6) : name.startsWith('place_') ? name.slice(6) : null;
      if (stepMat) {
        const isBreak = name.startsWith('break_'), isPlace = name.startsWith('place_');
        const vol = (isBreak ? 0.5 : isPlace ? 0.4 : 0.18) * v;
        const dur = isBreak ? 0.18 : 0.08;
        switch (stepMat) {
          case 'stone': case 'metal': this.noise(t, dur, 900 + r * 400, 1.5, vol); if (stepMat === 'metal') this.tone(t, 0.1, 1800 + r * 300, 'square', vol * 0.3, -600); break;
          case 'wood': this.noise(t, dur, 500 + r * 200, 2, vol); this.tone(t, 0.06, 180 + r * 60, 'triangle', vol * 0.6, -60); break;
          case 'grass': case 'cloth': this.noise(t, dur * 1.3, 2500 + r * 800, 0.8, vol * 0.8); break;
          case 'gravel': case 'sand': this.noise(t, dur * 1.5, 1600 + r * 600, 0.5, vol * 0.9, 'lowpass'); break;
          case 'glass': this.noise(t, dur, 5000 + r * 2000, 3, vol); this.tone(t, 0.12, 2400 + r * 800, 'sine', vol * 0.4); break;
          case 'snow': this.noise(t, dur * 1.2, 1200, 0.7, vol * 0.7, 'lowpass'); break;
          default: this.noise(t, dur, 800, 1, vol);
        }
        return;
      }
      switch (name) {
        case 'hurt': this.tone(t, 0.18, 300, 'sawtooth', 0.35 * v, -150); this.noise(t, 0.12, 700, 1, 0.2 * v); break;
        case 'death': this.tone(t, 0.6, 320, 'sawtooth', 0.4, -260); this.tone(t + 0.15, 0.5, 200, 'square', 0.25, -150); break;
        case 'fall': this.noise(t, 0.15, 400, 0.8, 0.4 * v, 'lowpass'); break;
        case 'jump': break;
        case 'pop': this.tone(t, 0.08, 800 + r * 400, 'sine', 0.25 * v, 600, 0.005); break;
        case 'eat': for (let i = 0; i < 3; i++) this.noise(t + i * 0.16, 0.08, 1500, 1, 0.25 * v, 'lowpass'); break;
        case 'splash': this.noise(t, 0.35, 1200, 0.6, 0.35 * v, 'lowpass'); break;
        case 'bow': this.noise(t, 0.12, 2200, 2, 0.3 * v); this.tone(t, 0.1, 500, 'triangle', 0.15 * v, 300); break;
        case 'arrow_hit': this.noise(t, 0.06, 3000, 3, 0.3 * v); break;
        case 'explosion': this.noise(t, 0.9, 150, 0.4, 0.9 * v, 'lowpass'); this.tone(t, 0.5, 80, 'sine', 0.6 * v, -50); break;
        case 'fuse': this.noise(t, 0.4, 3500, 1, 0.2 * v); break;
        case 'creeper_hiss': this.noise(t, 1.2, 3000, 0.8, 0.35 * v); break;
        case 'chest_open': this.noise(t, 0.15, 400, 1, 0.3 * v, 'lowpass'); this.tone(t, 0.12, 120, 'triangle', 0.2 * v, 40); break;
        case 'click': this.tone(t, 0.03, 1200, 'square', 0.15, 0, 0.001); break;
        case 'break_tool': this.noise(t, 0.2, 2500, 2, 0.4 * v); this.tone(t, 0.15, 700, 'square', 0.2 * v, -400); break;
        case 'achievement': [523, 659, 784, 1046].forEach((f, i) => this.tone(t + i * 0.09, 0.3, f, 'triangle', 0.25)); break;
        case 'pig': case 'pig_hurt': this.tone(t, 0.18, 260 + r * 60, 'sawtooth', 0.22 * v, 120); this.tone(t + 0.12, 0.12, 220, 'sawtooth', 0.15 * v, -60); break;
        case 'pig_death': this.tone(t, 0.35, 300, 'sawtooth', 0.25 * v, -180); break;
        case 'cow': case 'cow_hurt': this.tone(t, 0.5, 150 + r * 30, 'sawtooth', 0.25 * v, -30, 0.08); this.tone(t, 0.5, 302, 'triangle', 0.12 * v, -60, 0.08); break;
        case 'cow_death': this.tone(t, 0.6, 140, 'sawtooth', 0.25 * v, -70, 0.05); break;
        case 'sheep': case 'sheep_hurt': for (let i = 0; i < 6; i++) this.tone(t + i * 0.07, 0.06, 420 + (i % 2) * 40 + r * 30, 'square', 0.12 * v); break;
        case 'sheep_death': this.tone(t, 0.4, 380, 'square', 0.15 * v, -120); break;
        case 'chicken': case 'chicken_hurt': this.tone(t, 0.08, 900 + r * 200, 'square', 0.12 * v, 300); this.tone(t + 0.12, 0.1, 1100, 'square', 0.1 * v, -400); break;
        case 'chicken_death': this.tone(t, 0.25, 1000, 'square', 0.15 * v, -500); break;
        case 'zombie': case 'zombie_hurt': this.tone(t, 0.5, 110 + r * 30, 'sawtooth', 0.3 * v, -30, 0.1); this.noise(t, 0.4, 300, 0.8, 0.15 * v, 'lowpass'); break;
        case 'zombie_death': this.tone(t, 0.7, 120, 'sawtooth', 0.3 * v, -60, 0.05); break;
        case 'skeleton': case 'skeleton_hurt': for (let i = 0; i < 5; i++) this.noise(t + i * 0.05, 0.03, 2500 + i * 300, 4, 0.25 * v); break;
        case 'skeleton_death': for (let i = 0; i < 8; i++) this.noise(t + i * 0.06, 0.04, 2000 + r * 800, 4, 0.25 * v); break;
        case 'creeper': break;
        case 'creeper_hurt': this.noise(t, 0.2, 2000, 1, 0.3 * v); break;
        case 'creeper_death': this.noise(t, 0.4, 1500, 1, 0.3 * v); break;
        case 'spider': case 'spider_hurt': this.noise(t, 0.2, 1800 + r * 400, 2, 0.25 * v); this.tone(t, 0.15, 700, 'sawtooth', 0.1 * v, -300); break;
        case 'spider_death': this.noise(t, 0.4, 1400, 2, 0.3 * v); break;
        case 'thunder': this.noise(t, 1.5, 120, 0.5, 0.6, 'lowpass'); break;
        case 'cave': this.tone(t, 2.5, 60 + r * 40, 'sine', 0.2, 30, 0.8); this.noise(t + 0.5, 1.5, 300, 0.5, 0.1, 'lowpass'); break;
        default: this.noise(t, 0.08, 1000, 1, 0.2 * v);
      }
    }
    playAt(name, x, y, z, px, py, pz) { this.play(name, x == null ? 0 : Math.hypot(x - px, y - py, z - pz)); }
    tickMusic(dt, calm) {
      if (!this.ctx || !this.enabled || this.musicVolume <= 0) return;
      this.musicTimer -= dt;
      if (this.musicTimer > 0) return;
      this.musicTimer = 90 + Math.random() * 120;
      this.playMusic(calm);
    }
    playMusic(calm) {
      const ctx = this.ctx, t0 = ctx.currentTime + 0.2;
      const scale = calm ? [0, 2, 4, 7, 9, 11, 12, 14, 16] : [0, 2, 3, 7, 8, 10, 12, 14, 15];
      const base = calm ? 261.6 : 220;
      let t = t0, prev = 4;
      const notes = 24 + Math.floor(Math.random() * 16);
      for (let i = 0; i < notes; i++) {
        const step = Math.max(0, Math.min(scale.length - 1, prev + Math.floor(Math.random() * 5) - 2));
        prev = step;
        const f = base * Math.pow(2, scale[step] / 12), dur = 0.9 + Math.random() * 1.6;
        for (const [mul, vol, type] of [[1, 0.16, 'sine'], [2, 0.05, 'triangle'], [0.5, 0.07, 'sine']]) {
          const o = ctx.createOscillator(); o.type = type; o.frequency.value = f * mul;
          const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 2.2);
          o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + dur * 2.3);
        }
        t += dur;
      }
    }
  }
  Object.assign(M, { Audio });
})(globalThis.Mc98 = globalThis.Mc98 || {});
