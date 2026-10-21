(function (H) {
  'use strict';

  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.currentTheme = null;
      this.loopTimer = null;
      this.stepIdx = 0;
    }

    ensureContext() {
      if (this.muted) return null;
      if (!this.ctx && typeof window !== 'undefined') {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          try {
            this.ctx = new AC();
          } catch (e) {
            this.ctx = null;
          }
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    setMuted(flag) {
      this.muted = !!flag;
      if (this.muted) {
        this.stopMusic();
      }
    }

    playTone(freq, duration, type, gainVal, delaySec) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime + (delaySec || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(gainVal || 0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    }

    playSfx(kind) {
      if (this.muted) return;
      switch (kind) {
        case 'step':
          this.playTone(150, 0.06, 'triangle', 0.04, 0);
          break;
        case 'pickup':
          this.playTone(523.25, 0.09, 'triangle', 0.06, 0);
          this.playTone(659.25, 0.11, 'triangle', 0.06, 0.07);
          this.playTone(783.99, 0.16, 'triangle', 0.06, 0.14);
          break;
        case 'build':
          this.playTone(330, 0.12, 'sawtooth', 0.05, 0);
          this.playTone(440, 0.14, 'sawtooth', 0.05, 0.1);
          this.playTone(660, 0.22, 'triangle', 0.06, 0.2);
          break;
        case 'hit':
          this.playTone(110, 0.12, 'sawtooth', 0.07, 0);
          this.playTone(82, 0.15, 'square', 0.05, 0.04);
          break;
        case 'shoot':
          this.playTone(680, 0.08, 'sine', 0.05, 0);
          this.playTone(320, 0.09, 'triangle', 0.05, 0.05);
          break;
        case 'spell':
          this.playTone(587.33, 0.12, 'sine', 0.06, 0);
          this.playTone(880, 0.15, 'sine', 0.06, 0.08);
          this.playTone(1174.66, 0.22, 'triangle', 0.06, 0.16);
          break;
        case 'victory':
          this.playTone(440, 0.14, 'triangle', 0.07, 0);
          this.playTone(554.37, 0.14, 'triangle', 0.07, 0.12);
          this.playTone(659.25, 0.14, 'triangle', 0.07, 0.24);
          this.playTone(880, 0.35, 'triangle', 0.08, 0.36);
          break;
        case 'defeat':
          this.playTone(330, 0.2, 'sawtooth', 0.06, 0);
          this.playTone(293.66, 0.2, 'sawtooth', 0.06, 0.18);
          this.playTone(246.94, 0.35, 'sawtooth', 0.06, 0.36);
          break;
        default:
          this.playTone(440, 0.05, 'triangle', 0.03, 0);
          break;
      }
    }

    startMusic(theme) {
      if (this.muted) return;
      if (this.currentTheme === theme && this.loopTimer) return;
      this.stopMusic();
      this.currentTheme = theme;
      this.stepIdx = 0;

      const melodies = {
        menu: [261.63, 329.63, 392.00, 523.25, 493.88, 392.00, 329.63, 293.66],
        adventure: [293.66, 349.23, 440.00, 587.33, 523.25, 440.00, 349.23, 329.63],
        knight: [261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 392.00, 329.63],
        barbarian: [220.00, 261.63, 329.63, 293.66, 220.00, 196.00, 220.00, 261.63],
        sorceress: [329.63, 392.00, 493.88, 659.25, 587.33, 493.88, 392.00, 329.63],
        warlock: [246.94, 293.66, 369.99, 493.88, 440.00, 369.99, 293.66, 246.94],
        combat: [196.00, 233.08, 293.66, 392.00, 349.23, 293.66, 233.08, 196.00]
      };

      const notes = melodies[theme] || melodies.adventure;
      if (typeof setInterval !== 'undefined') {
        this.loopTimer = setInterval(() => {
          if (this.muted) return;
          const n = notes[this.stepIdx % notes.length];
          this.stepIdx++;
          this.playTone(n, 0.28, 'triangle', 0.025, 0);
        }, 360);
      }
    }

    stopMusic() {
      if (this.loopTimer) {
        clearInterval(this.loopTimer);
        this.loopTimer = null;
      }
      this.currentTheme = null;
    }
  }

  Object.assign(H, {
    AudioEngine
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = H;
})(globalThis.HoMM1 = globalThis.HoMM1 || {});
