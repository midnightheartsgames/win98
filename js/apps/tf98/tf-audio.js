(function (T) {
  'use strict';
  const AC = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;

  const BURSTS = {
    sawn: [{ type: 'lowpass', f0: 2400, f1: 500, t: 0.18, v: 0.55 }, { tone: 90, f1: 45, t: 0.14, v: 0.5 }],
    shotgun: [{ type: 'lowpass', f0: 1800, f1: 380, t: 0.24, v: 0.6 }, { tone: 80, f1: 40, t: 0.18, v: 0.55 }],
    pistol: [{ type: 'highpass', f0: 1100, f1: 900, t: 0.07, v: 0.35 }, { tone: 220, f1: 110, t: 0.05, v: 0.22 }],
    tube: [{ type: 'bandpass', f0: 900, f1: 2200, t: 0.32, v: 0.4 }, { tone: 140, f1: 60, t: 0.16, v: 0.35 }],
    torch: [{ type: 'bandpass', f0: 700, f1: 1100, t: 0.11, v: 0.2 }],
    airblast: [{ type: 'bandpass', f0: 500, f1: 3000, t: 0.28, v: 0.5 }],
    lobber: [{ tone: 240, f1: 80, t: 0.14, v: 0.5 }, { type: 'lowpass', f0: 1100, f1: 300, t: 0.12, v: 0.35 }],
    plunger: [{ tone: 320, f1: 120, t: 0.12, v: 0.4 }, { type: 'bandpass', f0: 900, f1: 500, t: 0.1, v: 0.25 }],
    carousel: [{ type: 'highpass', f0: 1400, f1: 1000, t: 0.05, v: 0.22 }, { tone: 170, f1: 110, t: 0.05, v: 0.2 }],
    smg: [{ type: 'highpass', f0: 1500, f1: 1100, t: 0.05, v: 0.26 }],
    drench: [{ tone: 900, f1: 500, t: 0.05, v: 0.14 }, { type: 'highpass', f0: 2600, f1: 2000, t: 0.04, v: 0.12 }],
    rifle: [{ type: 'lowpass', f0: 3400, f1: 700, t: 0.3, v: 0.75 }, { tone: 130, f1: 50, t: 0.22, v: 0.6 }],
    eat: [{ type: 'bandpass', f0: 500, f1: 800, t: 0.18, v: 0.2 }],
    uber: [{ tone: 240, f1: 980, t: 0.5, v: 0.32 }, { type: 'highpass', f0: 2000, f1: 5000, t: 0.5, v: 0.14 }],
    pickup: [{ tone: 640, f1: 960, t: 0.1, v: 0.2 }],
    locker: [{ tone: 300, f1: 420, t: 0.09, v: 0.26 }, { type: 'highpass', f0: 3000, f1: 2200, t: 0.3, v: 0.12 }],
    turret: [{ type: 'highpass', f0: 1300, f1: 1000, t: 0.06, v: 0.2 }, { tone: 210, f1: 120, t: 0.05, v: 0.2 }],
    placed: [{ tone: 260, f1: 180, t: 0.1, v: 0.3 }, { tone: 520, f1: 520, t: 0.06, v: 0.14 }],
    levelup: [{ tone: 420, f1: 840, t: 0.26, v: 0.28 }],
    teleport: [{ tone: 300, f1: 1400, t: 0.3, v: 0.25 }, { type: 'bandpass', f0: 900, f1: 3000, t: 0.3, v: 0.18 }],
    revolver: [{ type: 'lowpass', f0: 2600, f1: 600, t: 0.15, v: 0.55 }, { tone: 170, f1: 70, t: 0.1, v: 0.45 }],
    stab: [{ tone: 900, f1: 220, t: 0.16, v: 0.5 }, { type: 'highpass', f0: 3200, f1: 1800, t: 0.14, v: 0.3 }],
    cloak: [{ type: 'bandpass', f0: 2400, f1: 400, t: 0.35, v: 0.2 }],
    decloak: [{ type: 'bandpass', f0: 400, f1: 2400, t: 0.35, v: 0.2 }],
    seal: [{ tone: 1100, f1: 700, t: 0.1, v: 0.25 }, { type: 'highpass', f0: 2600, f1: 1800, t: 0.2, v: 0.14 }],
    charge: [{ type: 'bandpass', f0: 300, f1: 1500, t: 0.45, v: 0.32 }, { tone: 110, f1: 220, t: 0.4, v: 0.3 }],
    ram: [{ tone: 120, f1: 50, t: 0.18, v: 0.7 }, { type: 'lowpass', f0: 1600, f1: 300, t: 0.14, v: 0.45 }],
    notch: [{ tone: 660, f1: 990, t: 0.16, v: 0.26 }, { type: 'highpass', f0: 3000, f1: 4000, t: 0.12, v: 0.12 }],
    swing: [{ type: 'bandpass', f0: 500, f1: 1400, t: 0.14, v: 0.18 }],
    meleeHit: [{ tone: 150, f1: 60, t: 0.1, v: 0.6 }, { type: 'lowpass', f0: 1200, f1: 300, t: 0.08, v: 0.4 }],
    meleeWall: [{ tone: 420, f1: 300, t: 0.06, v: 0.25 }, { type: 'highpass', f0: 2000, f1: 1500, t: 0.05, v: 0.2 }],
    boom: [{ type: 'lowpass', f0: 1500, f1: 110, t: 0.75, v: 0.95 }, { tone: 70, f1: 28, t: 0.5, v: 0.9 }],
    tick: [{ tone: 1250, f1: 1250, t: 0.045, v: 0.24 }],
    crit: [{ tone: 1650, f1: 2400, t: 0.13, v: 0.3 }, { type: 'highpass', f0: 3000, f1: 5000, t: 0.16, v: 0.2 }],
    mini: [{ tone: 1450, f1: 1800, t: 0.08, v: 0.26 }],
    hurt: [{ tone: 170, f1: 90, t: 0.12, v: 0.45 }],
    reload: [{ type: 'highpass', f0: 1600, f1: 1300, t: 0.03, v: 0.18 }],
    shell: [{ tone: 520, f1: 340, t: 0.04, v: 0.16 }],
    dry: [{ tone: 900, f1: 800, t: 0.02, v: 0.14 }],
    siren: [{ tone: 440, f1: 880, t: 0.6, v: 0.3 }, { tone: 880, f1: 440, t: 0.6, v: 0.16 }],
    flagClick: [{ tone: 700, f1: 500, t: 0.08, v: 0.3 }, { type: 'highpass', f0: 2600, f1: 1800, t: 0.06, v: 0.14 }],
    capture: [{ tone: 330, f1: 660, t: 0.5, v: 0.34 }, { tone: 495, f1: 990, t: 0.5, v: 0.22 }],
    win: [{ tone: 392, f1: 784, t: 0.9, v: 0.34 }, { tone: 523, f1: 1046, t: 0.9, v: 0.22 }],
    lose: [{ tone: 330, f1: 110, t: 1, v: 0.34 }]
  };

  class Audio98 {
    constructor() {
      this.ctx = null;
      this.noise = null;
    }

    init() {
      if (this.ctx || !AC) { this.resume(); return; }
      try {
        const c = new AC();
        this.ctx = c;
        const len = Math.floor(c.sampleRate * 0.8);
        this.noise = c.createBuffer(1, len, c.sampleRate);
        const data = this.noise.getChannelData(0);
        const rand = T.rng(98);
        for (let i = 0; i < len; i++) data[i] = rand() * 2 - 1;
        this.master = c.createGain();
        this.master.gain.value = 0.55;
        this.master.connect(c.destination);
      } catch (e) {
        this.ctx = null;
      }
    }

    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

    play(name, vol = 1) {
      const c = this.ctx, list = BURSTS[name];
      if (!c || !list || vol <= 0) return;
      const now = c.currentTime;
      for (const b of list) {
        const g = c.createGain();
        g.gain.setValueAtTime(b.v * vol, now);
        g.gain.exponentialRampToValueAtTime(0.0008, now + b.t);
        g.connect(this.master);
        if (b.tone) {
          const o = c.createOscillator();
          o.frequency.setValueAtTime(b.tone, now);
          o.frequency.exponentialRampToValueAtTime(b.f1, now + b.t);
          o.connect(g);
          o.start(now);
          o.stop(now + b.t + 0.02);
        } else {
          const s = c.createBufferSource();
          s.buffer = this.noise;
          const f = c.createBiquadFilter();
          f.type = b.type;
          f.frequency.setValueAtTime(b.f0, now);
          f.frequency.exponentialRampToValueAtTime(b.f1, now + b.t);
          s.connect(f);
          f.connect(g);
          s.start(now);
          s.stop(now + b.t + 0.02);
        }
      }
    }

    close() {
      if (this.ctx) this.ctx.close().catch(() => { });
      this.ctx = null;
    }
  }

  T.Audio98 = Audio98;
})(globalThis.Tf98 = globalThis.Tf98 || {});
