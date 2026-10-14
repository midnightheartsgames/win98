(function (K) {
  'use strict';

  const MUSIC = {
    title: { root: 110, chords: [[0, 7, 12, 16], [5, 12, 17, 21], [3, 10, 15, 19], [7, 14, 19, 23]], tempo: 3.2, wave: 'sawtooth', vol: 0.05, lead: true },
    calm: { root: 98, chords: [[0, 7, 12, 15], [8, 15, 20, 24], [5, 12, 17, 20], [7, 14, 19, 22]], tempo: 4, wave: 'triangle', vol: 0.05 },
    upper: { root: 110, chords: [[0, 7, 12, 16], [9, 16, 21, 24], [5, 12, 17, 21], [7, 14, 19, 23]], tempo: 4, wave: 'triangle', vol: 0.05 },
    lower: { root: 87, chords: [[0, 7, 10, 15], [5, 12, 15, 20], [3, 10, 15, 19], [8, 15, 19, 22]], tempo: 3.4, wave: 'sawtooth', vol: 0.035 },
    cantina: { root: 131, chords: [[0, 4, 7, 10], [5, 9, 12, 15], [7, 11, 14, 17], [0, 4, 7, 10]], tempo: 1.2, wave: 'square', vol: 0.03, bass: true },
    under: { root: 73, chords: [[0, 7, 13, 15], [1, 8, 13, 16], [0, 6, 12, 15], [-2, 5, 10, 13]], tempo: 5, wave: 'triangle', vol: 0.05 },
    tense: { root: 82, chords: [[0, 6, 12, 15], [1, 7, 13, 16], [0, 6, 12, 15], [-1, 5, 11, 14]], tempo: 2.6, wave: 'sawtooth', vol: 0.035, pulse: true },
    battle: { root: 98, chords: [[0, 7, 12, 15], [-2, 5, 10, 14], [-4, 3, 8, 12], [-5, 2, 7, 10]], tempo: 1.6, wave: 'sawtooth', vol: 0.04, pulse: true, bass: true },
    ending: { root: 110, chords: [[0, 7, 12, 16], [5, 12, 17, 21], [7, 14, 19, 23], [0, 7, 12, 19]], tempo: 3, wave: 'sawtooth', vol: 0.05, lead: true }
  };

  class Audio {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.musicOn = true;
      this.track = null;
      this.nextT = 0;
      this.step = 0;
      this.last = {};
    }
    ensure() {
      if (this.ctx || !this.enabled) return;
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) { this.enabled = false; return; }
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.6;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.8;
      this.musicGain.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    resume() { this.ensure(); if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    tone(f, dur, type, vol, slide, dest, when) {
      const c = this.ctx, t = when || c.currentTime;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest || this.master);
      o.start(t); o.stop(t + dur + 0.05);
    }
    noiseBurst(dur, vol, freq, q) {
      const c = this.ctx, t = c.currentTime;
      const s = c.createBufferSource(); s.buffer = this.noise;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1000; f.Q.value = q || 1;
      const g = c.createGain();
      g.gain.setValueAtTime(vol || 0.3, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(this.master);
      s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    }
    sfx(id) {
      if (!this.enabled) return;
      this.ensure();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      if (this.last[id] && now - this.last[id] < 0.04) return;
      this.last[id] = now;
      switch (id) {
        case 'blaster': this.tone(1400 + Math.random() * 300, 0.18, 'sawtooth', 0.12, 180); this.tone(700, 0.12, 'square', 0.05, 120); break;
        case 'heavy': this.tone(900, 0.22, 'sawtooth', 0.14, 90); this.noiseBurst(0.12, 0.1, 600); break;
        case 'swing': case 'whoosh': this.noiseBurst(0.15, 0.12, 1800, 2); break;
        case 'saber': this.tone(110, 0.35, 'sawtooth', 0.08, 160); this.noiseBurst(0.2, 0.06, 2500, 3); break;
        case 'saberhit': case 'saberclash': this.tone(1800, 0.12, 'square', 0.08, 900); this.noiseBurst(0.15, 0.1, 3000, 4); break;
        case 'deflect': this.tone(2200, 0.1, 'square', 0.07, 1500); break;
        case 'hit': this.noiseBurst(0.08, 0.15, 400); break;
        case 'hitmelee': this.noiseBurst(0.1, 0.2, 250); this.tone(90, 0.1, 'sine', 0.15, 60); break;
        case 'die': this.tone(220, 0.4, 'sawtooth', 0.06, 70); break;
        case 'droiddie': this.tone(800, 0.5, 'square', 0.06, 60); this.noiseBurst(0.3, 0.1, 1200); break;
        case 'roar': this.tone(90, 1.0, 'sawtooth', 0.2, 50); this.noiseBurst(0.8, 0.2, 300); break;
        case 'explode': this.noiseBurst(0.9, 0.5, 180, 0.6); this.tone(70, 0.6, 'sine', 0.3, 30); break;
        case 'heal': this.tone(600, 0.2, 'sine', 0.08, 900); this.tone(900, 0.3, 'sine', 0.06, 1200); break;
        case 'force': this.tone(200, 0.6, 'sine', 0.12, 600); this.tone(300, 0.6, 'triangle', 0.06, 900); break;
        case 'shield': this.tone(400, 0.4, 'triangle', 0.08, 800); break;
        case 'door': this.noiseBurst(0.35, 0.08, 500, 0.8); this.tone(160, 0.3, 'sine', 0.05, 120); break;
        case 'locked': this.tone(180, 0.15, 'square', 0.06); this.tone(140, 0.15, 'square', 0.06); break;
        case 'unlock': this.tone(900, 0.08, 'square', 0.05); this.tone(1300, 0.12, 'square', 0.05); break;
        case 'open': this.noiseBurst(0.12, 0.08, 900); break;
        case 'buy': this.tone(1200, 0.08, 'triangle', 0.06); this.tone(1600, 0.12, 'triangle', 0.06); break;
        case 'click': this.tone(1000, 0.04, 'square', 0.03); break;
        case 'hover': this.tone(1500, 0.02, 'square', 0.015); break;
        case 'journal': this.tone(660, 0.15, 'triangle', 0.06); this.tone(880, 0.25, 'triangle', 0.06); break;
        case 'join': case 'levelup': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.07, null, null, this.ctx.currentTime + i * 0.09)); break;
        case 'alert': this.tone(440, 0.15, 'square', 0.05); this.tone(330, 0.2, 'square', 0.05); break;
        case 'gong': this.tone(140, 1.2, 'sine', 0.2, 110); this.tone(280, 0.8, 'triangle', 0.06); break;
        case 'rest': [392, 494, 587].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.06, null, null, this.ctx.currentTime + i * 0.12)); break;
        case 'gameover': [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.08, null, null, this.ctx.currentTime + i * 0.25)); break;
        case 'cage': this.tone(600, 0.6, 'sawtooth', 0.1, 60); this.noiseBurst(0.5, 0.2, 2000); break;
        case 'card': this.noiseBurst(0.06, 0.08, 3000, 2); break;
        case 'engine': this.tone(60, 0.3, 'sawtooth', 0.03, 70); break;
        case 'shift': this.tone(300, 0.1, 'square', 0.05, 500); break;
        case 'crash': this.noiseBurst(0.4, 0.3, 300); break;
        case 'boost': this.tone(300, 0.5, 'sawtooth', 0.07, 900); break;
        default: this.tone(800, 0.05, 'square', 0.03);
      }
    }
    music(name) {
      if (this.trackName === name) return;
      this.trackName = name;
      this.track = MUSIC[name] || null;
      this.step = 0;
      if (this.ctx) this.nextT = this.ctx.currentTime + 0.1;
    }
    update() {
      if (!this.ctx || !this.track || !this.musicOn) return;
      const c = this.ctx, tr = this.track;
      while (this.nextT < c.currentTime + 0.5) {
        const ch = tr.chords[this.step % tr.chords.length];
        const t = this.nextT;
        const dur = tr.tempo;
        for (const n of ch) {
          const f = tr.root * Math.pow(2, n / 12);
          const o = c.createOscillator(), g = c.createGain(), flt = c.createBiquadFilter();
          o.type = tr.wave;
          o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.004);
          flt.type = 'lowpass'; flt.frequency.value = tr.wave === 'sawtooth' ? 900 : 2000;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(tr.vol, t + dur * 0.3);
          g.gain.linearRampToValueAtTime(0.0001, t + dur * 1.05);
          o.connect(flt); flt.connect(g); g.connect(this.musicGain);
          o.start(t); o.stop(t + dur * 1.1);
        }
        if (tr.bass) for (let i = 0; i < 4; i++) this.tone(tr.root / 2 * Math.pow(2, ch[0] / 12), dur / 4 * 0.9, 'triangle', tr.vol * 2.2, null, this.musicGain, t + i * dur / 4);
        if (tr.pulse) for (let i = 0; i < 8; i++) this.tone(tr.root / 2 * Math.pow(2, ch[0] / 12), 0.08, 'square', tr.vol * 0.8, null, this.musicGain, t + i * dur / 8);
        if (tr.lead && this.step % 2 === 0) { const f = tr.root * 2 * Math.pow(2, ch[2] / 12); this.tone(f, dur * 0.9, 'triangle', tr.vol * 1.2, null, this.musicGain, t + dur * 0.1); }
        this.nextT += dur;
        this.step++;
      }
    }
    stop() { this.track = null; this.trackName = null; }
    close() { if (this.ctx) { try { this.ctx.close(); } catch (e) { this.ctx = null; } } this.ctx = null; }
  }

  K.Audio = Audio;
})(globalThis.Kotor98 = globalThis.Kotor98 || {});
