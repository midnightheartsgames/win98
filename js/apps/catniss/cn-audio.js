(function (C) {
  'use strict';

  const TRACKS = { level: 'Background music/1.mp3', menu: 'Background music/2.mp3' };

  class Audio {
    constructor() {
      this.music = 0.7;
      this.sfx = 0.8;
      this.ctx = null;
      this.el = null;
      this.track = null;
      this.rate = 1;
      this.last = {};
    }

    ensure() {
      if (this.ctx || typeof window === 'undefined') return this.ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.out = this.ctx.createGain();
      this.out.gain.value = this.sfx * 0.5;
      this.out.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.5;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return this.ctx;
    }

    resume() {
      const c = this.ensure();
      if (c && c.state === 'suspended') c.resume();
      if (this.el && this.el.paused && this.track && this.music > 0) this.el.play().catch(() => { });
    }

    setVolumes(music, sfx) {
      this.music = music; this.sfx = sfx;
      if (this.el) this.el.volume = Math.min(1, music * 0.8);
      if (this.out) this.out.gain.value = sfx * 0.5;
    }

    play(track, rate) {
      if (typeof document === 'undefined') return;
      rate = rate || 1;
      if (this.track === track && this.el) { if (this.rate !== rate) { this.el.playbackRate = rate; this.rate = rate; } return; }
      this.stopMusic();
      if (!track) return;
      this.track = track;
      this.rate = rate;
      const el = document.createElement('audio');
      el.src = C.ASSET + TRACKS[track];
      el.loop = true;
      el.volume = Math.min(1, this.music * 0.8);
      el.playbackRate = rate;
      this.el = el;
      if (this.music > 0) el.play().catch(() => { });
    }

    stopMusic() {
      if (this.el) { this.el.pause(); this.el.removeAttribute('src'); try { this.el.load(); } catch (e) { } }
      this.el = null;
      this.track = null;
    }

    pauseMusic(on) {
      if (!this.el) return;
      if (on) this.el.pause(); else if (this.music > 0) this.el.play().catch(() => { });
    }

    close() {
      this.stopMusic();
      if (this.ctx) { try { this.ctx.close(); } catch (e) { } }
      this.ctx = null;
    }

    tone(type, f0, f1, dur, vol, when, opts = {}) {
      const c = this.ctx;
      const t = c.currentTime + (when || 0);
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + (opts.attack || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let node = o;
      if (opts.filter) {
        const f = c.createBiquadFilter();
        f.type = opts.filter.type || 'bandpass';
        f.frequency.setValueAtTime(opts.filter.f0, t);
        if (opts.filter.f1) f.frequency.linearRampToValueAtTime(opts.filter.f1, t + dur * 0.5);
        if (opts.filter.f2) f.frequency.linearRampToValueAtTime(opts.filter.f2, t + dur);
        f.Q.value = opts.filter.q || 4;
        o.connect(f); node = f;
      }
      if (opts.vib) {
        const l = c.createOscillator(), lg = c.createGain();
        l.frequency.value = opts.vib[0]; lg.gain.value = opts.vib[1];
        l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05);
      }
      node.connect(g); g.connect(this.out);
      o.start(t); o.stop(t + dur + 0.05);
    }

    hiss(dur, vol, f0, f1, when, q) {
      const c = this.ctx;
      const t = c.currentTime + (when || 0);
      const s = c.createBufferSource();
      s.buffer = this.noise;
      const f = c.createBiquadFilter();
      f.type = 'bandpass'; f.Q.value = q || 1.2;
      f.frequency.setValueAtTime(f0, t);
      if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(this.out);
      s.start(t); s.stop(t + dur + 0.02);
    }

    sfxPlay(name) {
      if (!this.ensure() || this.sfx <= 0) return;
      const now = this.ctx.currentTime;
      if (this.last[name] && now - this.last[name] < 0.04) return;
      this.last[name] = now;
      switch (name) {
        case 'jump': this.tone('square', 330, 660, 0.12, 0.12); break;
        case 'walljump': this.tone('square', 400, 820, 0.1, 0.11); this.hiss(0.06, 0.15, 3000, 1500); break;
        case 'dash': this.hiss(0.18, 0.3, 900, 3500, 0, 0.8); this.tone('square', 220, 440, 0.08, 0.06); break;
        case 'land': this.hiss(0.07, 0.18, 400, 200); break;
        case 'cling': this.hiss(0.08, 0.12, 4000, 2500, 0, 2); break;
        case 'coin': this.tone('square', 988, 988, 0.06, 0.1); this.tone('square', 1319, 1319, 0.18, 0.1, 0.06); break;
        case 'butterfly': [784, 988, 1175].forEach((f, i) => this.tone('triangle', f, f, 0.1, 0.12, i * 0.05)); break;
        case 'life': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone('square', f, f, 0.08, 0.09, i * 0.07)); break;
        case 'fish': [659, 784, 988, 1319, 1175, 1568].forEach((f, i) => this.tone('square', f, f, 0.12, 0.1, i * 0.09)); this.tone('triangle', 330, 330, 0.6, 0.12, 0); break;
        case 'stomp': this.tone('square', 600, 140, 0.12, 0.13); this.hiss(0.08, 0.2, 1200, 300); break;
        case 'kill': this.tone('square', 900, 1800, 0.06, 0.07); break;
        case 'hurt': this.tone('sawtooth', 520, 160, 0.3, 0.12); this.meow(0.02, 0.9); break;
        case 'die': this.tone('square', 660, 110, 0.6, 0.12); break;
        case 'drown': this.hiss(0.4, 0.3, 600, 150, 0, 0.6); this.tone('sine', 300, 900, 0.25, 0.1); this.meow(0.15, 1.1); break;
        case 'check': this.meow(0, 1); [523, 784].forEach((f, i) => this.tone('triangle', f, f, 0.15, 0.1, 0.18 + i * 0.1)); break;
        case 'bounce': this.tone('square', 196, 784, 0.2, 0.11); this.tone('sawtooth', 300, 280, 0.25, 0.06, 0.02, { vib: [28, 40] }); break;
        case 'bark': this.hiss(0.09, 0.4, 700, 300, 0, 1.5); this.tone('square', 260, 160, 0.09, 0.12); this.hiss(0.09, 0.3, 700, 300, 0.14, 1.5); this.tone('square', 250, 150, 0.09, 0.1, 0.14); break;
        case 'growl': this.tone('sawtooth', 90, 70, 0.4, 0.1, 0, { vib: [22, 12] }); break;
        case 'howl': this.tone('sawtooth', 300, 520, 0.35, 0.05, 0, { filter: { f0: 800, f1: 1400, q: 3 } }); break;
        case 'screech': this.tone('sawtooth', 1800, 2400, 0.18, 0.06, 0, { filter: { f0: 2500, q: 2 } }); break;
        case 'crumble': this.hiss(0.35, 0.35, 500, 120, 0, 0.7); break;
        case 'shake': this.hiss(0.15, 0.08, 800, 600, 0, 3); break;
        case 'brickfall': this.tone('triangle', 900, 300, 0.4, 0.04); break;
        case 'brick': this.hiss(0.2, 0.35, 900, 200); break;
        case 'car': this.tone('sawtooth', 70, 110, 0.6, 0.06, 0, { filter: { type: 'lowpass', f0: 400, q: 1 } }); break;
        case 'honk': this.tone('square', 330, 330, 0.18, 0.1); this.tone('square', 415, 415, 0.18, 0.08); this.tone('square', 330, 330, 0.25, 0.1, 0.22); this.tone('square', 415, 415, 0.25, 0.08, 0.22); break;
        case 'doors': this.hiss(0.25, 0.2, 300, 900, 0, 2); this.tone('square', 120, 90, 0.2, 0.08); break;
        case 'expose': [880, 1109, 880, 1109].forEach((f, i) => this.tone('square', f, f, 0.06, 0.07, i * 0.08)); break;
        case 'clank': this.tone('square', 1400, 1300, 0.08, 0.08); this.tone('triangle', 2100, 2000, 0.12, 0.05); break;
        case 'bosshit': this.tone('square', 220, 55, 0.4, 0.14); this.hiss(0.3, 0.4, 2000, 200); break;
        case 'vanbreak': this.hiss(0.8, 0.5, 1500, 100, 0, 0.6); this.tone('square', 330, 40, 0.8, 0.12); break;
        case 'meow': this.meow(0, 1.2); break;
        case 'rescue': this.meow(0, 1.3); this.meow(0.35, 1); [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone('square', f, f, 0.14, 0.09, 0.6 + i * 0.1)); break;
        case 'clear': [784, 659, 784, 1047, 988, 1047, 1319].forEach((f, i) => this.tone('square', f, f, 0.12, 0.09, i * 0.1)); break;
        case 'over': [392, 370, 349, 330, 262].forEach((f, i) => this.tone('square', f, f, 0.22, 0.09, i * 0.2)); break;
        case 'select': this.tone('square', 880, 880, 0.04, 0.06); break;
        case 'confirm': this.tone('square', 660, 660, 0.05, 0.08); this.tone('square', 990, 990, 0.1, 0.08, 0.05); break;
        case 'back': this.tone('square', 660, 440, 0.08, 0.07); break;
        case 'pause': this.tone('square', 523, 523, 0.06, 0.07); this.tone('square', 392, 392, 0.08, 0.07, 0.07); break;
        case 'bonk': this.tone('square', 180, 120, 0.06, 0.08); break;
        case 'steam': this.hiss(0.5, 0.15, 3000, 2000, 0, 0.5); break;
      }
    }

    meow(when, pitch) {
      pitch = pitch || 1;
      this.tone('sawtooth', 520 * pitch, 420 * pitch, 0.36, 0.09, when, { attack: 0.03, filter: { f0: 700, f1: 1700, f2: 800, q: 6 }, vib: [6, 8] });
      this.tone('triangle', 1040 * pitch, 840 * pitch, 0.3, 0.03, when, { attack: 0.03 });
    }
  }

  C.Audio = Audio;
})(globalThis.Catniss = globalThis.Catniss || {});
