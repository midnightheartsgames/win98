(function (P) {
  'use strict';
  const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
  function noteMidi(s) {
    const m = /^([A-G][b#]?)(-?\d)$/.exec(s);
    return m ? NOTE[m[1]] + (parseInt(m[2], 10) + 1) * 12 : null;
  }

  const THEMES = {
    menu: {
      bpm: 92, steps: 6, root: 'D3',
      doira: 'D..t.tD.tt.t',
      mel: 'D4 . F4 . G4 A4 . . Bb4 . A4 G4 . . F4 . Eb4 . D4 . . . . . A4 . C5 . Bb4 A4 . . G4 . F4 G4 . . A4 . . . . . F4 . G4 . A4 . Bb4 . A4 . G4 . F4 . Eb4 . D4 . . . . .'
    },
    day: {
      bpm: 128, steps: 6, root: 'D3',
      doira: 'D.tD.tD.ttt.',
      mel: 'A4 . A4 Bb4 A4 G4 F4 . G4 A4 . . D5 . C5 Bb4 A4 . G4 . F4 . . . A4 . A4 Bb4 C5 D5 C5 Bb4 A4 G4 . . F4 G4 A4 . G4 F4 Eb4 . D4 . . . D4 . F4 . A4 . D5 . C5 . Bb4 . A4 Bb4 A4 G4 F4 . G4 . A4 . . . F4 . Eb4 . D4 . . .'
    },
    rush: {
      bpm: 146, steps: 6, root: 'E3',
      doira: 'D.tD.tDttD.t',
      mel: 'B4 . B4 C5 B4 A4 G4 . A4 B4 . . E5 . D5 C5 B4 . A4 . G4 . . . B4 . C5 D5 E5 . D5 C5 B4 A4 . . G4 A4 B4 . A4 G4 F4 . E4 . . .'
    }
  };

  class Audio {
    constructor() {
      this.ctx = null;
      this.music = 0.5;
      this.sfxVol = 0.8;
      this.theme = null;
      this.step = 0;
      this.nextT = 0;
      this.noiseBuf = null;
      this.chopT = 0;
    }

    init() {
      if (this.ctx) return true;
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return false;
      try { this.ctx = new AC(); } catch (e) { return false; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.connect(c.destination);
      this.mus = c.createGain(); this.mus.connect(this.master);
      this.fx = c.createGain(); this.fx.connect(this.master);
      const len = c.sampleRate;
      this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.applyVolumes();
      return true;
    }

    applyVolumes() {
      if (!this.ctx) return;
      this.master.gain.value = 0.9;
      this.mus.gain.value = this.music * 0.55;
      this.fx.gain.value = this.sfxVol;
    }

    setVolumes(music, sfx) { this.music = music; this.sfxVol = sfx; this.applyVolumes(); }

    resume() {
      if (!this.init()) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    close() {
      if (this.ctx) { try { this.ctx.close(); } catch (e) { } }
      this.ctx = null;
    }

    now() { return this.ctx ? this.ctx.currentTime : 0; }

    tone(freq, t0, dur, type, vol, dest, opts = {}) {
      const c = this.ctx;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t0 + dur);
      if (opts.vib) { const l = c.createOscillator(); const lg = c.createGain(); l.frequency.value = opts.vib; lg.gain.value = freq * 0.03; l.connect(lg); lg.connect(o.frequency); l.start(t0); l.stop(t0 + dur + 0.05); }
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + (opts.attack || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      let node = o;
      if (opts.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(opts.lp, t0); if (opts.lpEnd) f.frequency.exponentialRampToValueAtTime(opts.lpEnd, t0 + dur); o.connect(f); node = f; }
      node.connect(g);
      g.connect(dest || this.fx);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    }

    noise(t0, dur, vol, type, freq, q, dest, opts = {}) {
      const c = this.ctx;
      const s = c.createBufferSource();
      s.buffer = this.noiseBuf;
      s.loop = true;
      const f = c.createBiquadFilter();
      f.type = type || 'bandpass';
      f.frequency.setValueAtTime(freq || 1000, t0);
      if (opts.sweep) f.frequency.exponentialRampToValueAtTime(opts.sweep, t0 + dur);
      f.Q.value = q || 1;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + (opts.attack || 0.004));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(f); f.connect(g); g.connect(dest || this.fx);
      s.start(t0, Math.random() * 0.5);
      s.stop(t0 + dur + 0.02);
    }

    sfx(id, arg) {
      if (!this.ctx || this.sfxVol <= 0) return;
      const t = this.now() + 0.005;
      switch (id) {
        case 'click': this.tone(880, t, 0.05, 'square', 0.05, null, { slide: 1320 }); break;
        case 'hover': this.tone(1320, t, 0.03, 'sine', 0.025); break;
        case 'arrive': this.tone(1320, t, 0.5, 'sine', 0.12); this.tone(1760, t + 0.09, 0.6, 'sine', 0.1); break;
        case 'vip': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, t + i * 0.07, 0.35, 'triangle', 0.12)); break;
        case 'seat': this.noise(t, 0.22, 0.15, 'bandpass', 600, 1.2, null, { sweep: 2200 }); break;
        case 'hand': this.tone(1046, t, 0.25, 'triangle', 0.12); this.tone(1568, t + 0.06, 0.3, 'sine', 0.06); break;
        case 'bill': this.tone(2093, t, 0.5, 'sine', 0.1); this.tone(2637, t + 0.02, 0.4, 'sine', 0.05); break;
        case 'paper': this.noise(t, 0.07, 0.22, 'highpass', 3000, 0.7); this.noise(t + 0.09, 0.08, 0.18, 'highpass', 3600, 0.7); break;
        case 'plate': this.tone(2400, t, 0.18, 'sine', 0.1); this.tone(3150, t + 0.01, 0.14, 'sine', 0.06); break;
        case 'cup': this.tone(2900, t, 0.16, 'sine', 0.09); this.tone(3700, t + 0.03, 0.12, 'sine', 0.05); break;
        case 'serve': this.tone(2200, t, 0.16, 'sine', 0.1); this.noise(t, 0.06, 0.12, 'lowpass', 400, 0.8); break;
        case 'coins': for (let i = 0; i < 6; i++) this.tone(2400 + Math.random() * 1600, t + i * 0.045, 0.2, 'sine', 0.08); break;
        case 'combo': { const n = arg || 2; [0, 4, 7].forEach((s, i) => this.tone(midiHz(72 + n * 2 + s), t + i * 0.05, 0.25, 'triangle', 0.09)); break; }
        case 'chop': this.noise(t, 0.05, 0.3, 'lowpass', 900, 1); this.tone(180, t, 0.05, 'sine', 0.15, null, { slide: 90 }); break;
        case 'sizzle': this.noise(t, 1.1, 0.12, 'highpass', 4000, 0.5, null, { attack: 0.03 }); this.noise(t, 0.8, 0.06, 'bandpass', 7000, 0.6); break;
        case 'rice': for (let i = 0; i < 5; i++) this.noise(t + i * 0.06, 0.08, 0.12, 'highpass', 5000, 0.5); break;
        case 'ding': this.tone(1568, t, 0.6, 'sine', 0.12); break;
        case 'ready': this.tone(1318, t, 0.4, 'sine', 0.13); this.tone(1760, t + 0.14, 0.7, 'sine', 0.13); break;
        case 'burn': for (let i = 0; i < 4; i++) this.tone(i % 2 ? 180 : 220, t + i * 0.16, 0.15, 'square', 0.07); break;
        case 'whoosh': this.noise(t, 0.4, 0.2, 'bandpass', 300, 0.8, null, { sweep: 1800 }); break;
        case 'pour': for (let i = 0; i < 6; i++) this.noise(t + i * 0.05, 0.08, 0.1, 'bandpass', 900 + Math.random() * 600, 4); break;
        case 'scrub': for (let i = 0; i < 6; i++) this.noise(t + i * 0.1, 0.07, 0.15, 'bandpass', 2500, 1); break;
        case 'dishes': this.tone(2600, t, 0.1, 'sine', 0.07); this.tone(2100, t + 0.07, 0.1, 'sine', 0.07); this.tone(2900, t + 0.14, 0.12, 'sine', 0.06); break;
        case 'bin': this.tone(160, t, 0.18, 'sine', 0.2, null, { slide: 70 }); this.noise(t, 0.1, 0.12, 'lowpass', 600, 1); break;
        case 'nope': this.tone(150, t, 0.14, 'square', 0.06); break;
        case 'grumble': this.tone(120, t, 0.45, 'sawtooth', 0.05, null, { vib: 9, lp: 700 }); break;
        case 'angry': this.tone(320, t, 0.45, 'sawtooth', 0.07, null, { slide: 110, lp: 1200 }); break;
        case 'fanfare': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.tone(f, t + i * 0.1, 0.3, 'triangle', 0.13)); break;
        case 'win': [587, 740, 880, 1175, 1480].forEach((f, i) => this.tone(f, t + i * 0.12, 0.5, 'triangle', 0.14)); break;
        case 'fail': [440, 415, 370, 294].forEach((f, i) => this.tone(f, t + i * 0.18, 0.4, 'triangle', 0.12)); break;
        case 'star': this.tone(1760 + (arg || 0) * 220, t, 0.5, 'sine', 0.14); this.tone(2637 + (arg || 0) * 220, t + 0.03, 0.3, 'sine', 0.06); break;
        case 'buy': [1046, 1318, 1568].forEach((f, i) => this.tone(f, t + i * 0.06, 0.3, 'sine', 0.12)); this.sfx('coins'); break;
        case 'tick': this.tone(1200, t, 0.05, 'square', 0.04); break;
        case 'start': [587, 784, 988, 1175].forEach((f, i) => this.tone(f, t + i * 0.09, 0.3, 'triangle', 0.13)); break;
      }
    }

    play(theme) {
      if (this.theme === theme) return;
      this.theme = theme;
      this.step = 0;
      this.nextT = 0;
    }

    update() {
      if (!this.ctx || !this.theme || this.music <= 0) return;
      this.applyVolumes();
      const th = THEMES[this.theme];
      const stepDur = 60 / th.bpm / 2;
      const c = this.ctx;
      if (this.nextT < c.currentTime) this.nextT = c.currentTime + 0.05;
      const mel = th.melArr || (th.melArr = th.mel.split(/\s+/));
      const root = noteMidi(th.root);
      while (this.nextT < c.currentTime + 0.25) {
        const s = this.step;
        const t = this.nextT;
        const dch = th.doira[s % th.doira.length];
        if (dch === 'D') { this.tone(95, t, 0.22, 'sine', 0.22, this.mus, { slide: 55 }); this.noise(t, 0.05, 0.05, 'lowpass', 300, 1, this.mus); }
        else if (dch === 't') { this.noise(t, 0.06, 0.1, 'highpass', 2500, 0.8, this.mus); this.noise(t, 0.12, 0.03, 'bandpass', 8000, 3, this.mus); }
        const n = mel[s % mel.length];
        if (n && n !== '.') {
          const m = noteMidi(n);
          if (m !== null) {
            const f = midiHz(m);
            this.tone(f, t, 0.42, 'triangle', 0.1, this.mus, { lp: 3200, lpEnd: 600 });
            this.tone(f * 2, t, 0.18, 'sawtooth', 0.02, this.mus, { lp: 2400, lpEnd: 400 });
          }
        }
        if (s % (th.steps * 2) === 0) this.tone(midiHz(root), t, stepDur * th.steps * 2, 'sine', 0.06, this.mus, { attack: 0.05 });
        if (s % th.steps === 3) this.tone(midiHz(root + 7), t, stepDur * 2.5, 'triangle', 0.035, this.mus, { lp: 900 });
        this.step++;
        this.nextT += stepDur;
      }
    }
  }

  P.Audio = Audio;
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(globalThis.Plov = globalThis.Plov || {});
