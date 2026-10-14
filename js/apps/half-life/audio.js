(function (H) {
  'use strict';
  class AudioManager {
    constructor() { this.volume = .45; this.music = .25; }
    start() {
      try {
        if (!this.ctx) {
          const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext; if (!Ctx) return;
          this.ctx = new Ctx(); this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
          this.droneGain = this.ctx.createGain(); this.droneGain.connect(this.master);
          this.drone = this.ctx.createOscillator(); this.drone.type = 'sine'; this.drone.frequency.value = 54; this.drone.connect(this.droneGain); this.drone.start();
        }
        this.master.gain.value = this.volume; this.droneGain.gain.value = this.music * .065; this.ctx.resume().catch(() => {});
      } catch (_) { /* Audio is optional; gameplay remains available. */ }
    }
    play(type) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const pitches = { shot: 95, swing: 180, hit: 75, reload: 400, empty: 180, pickup: 820, door: 80, hurt: 130, crab: 450, charge: 650, electric: 1100, break: 140, explosion: 45, alarm: 550, step: 65, jump: 180, land: 70 };
      const duration = { shot: .14, reload: .4, door: .65, charge: .85, electric: .25, explosion: .7, alarm: .7, pickup: .15 }[type] || .11;
      const ctx = this.ctx, gain = ctx.createGain(), osc = ctx.createOscillator(), now = ctx.currentTime;
      osc.type = ['pickup','alarm','charge'].includes(type) ? 'sine' : 'sawtooth'; osc.frequency.setValueAtTime(pitches[type] || 90, now); osc.frequency.exponentialRampToValueAtTime(Math.max(25, (pitches[type] || 90) * (type === 'charge' ? 1.8 : .35)), now + duration);
      gain.gain.setValueAtTime(type === 'step' ? .025 : .075, now); gain.gain.exponentialRampToValueAtTime(.001, now + duration); osc.connect(gain); gain.connect(this.master); osc.start(); osc.stop(now + duration); osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    }
    pause() { this.ctx?.suspend().catch(() => {}); }
    destroy() { if (this.ctx) { this.drone.stop(); this.ctx.close().catch(() => {}); } }
  }
  H.AudioManager = AudioManager;
})(globalThis.HL98 = globalThis.HL98 || {});
