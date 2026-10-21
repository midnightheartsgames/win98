(function (K) {
  'use strict';

  class Audio {
    constructor() {
      this.ctx = null; this.sfxVol = 0.7; this.musicVol = 0.35; this.listener = { x: 0, z: 0, yaw: 0 };
      this.amb = null; this.lastZone = null; this.musicT = 0;
    }
    ensure() {
      if (this.ctx) return this.ctx;
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return null;
      try { this.ctx = new AC(); } catch (_) { return null; }
      this.master = this.ctx.createGain(); this.master.gain.value = 1; this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain(); this.sfx.gain.value = this.sfxVol; this.sfx.connect(this.master);
      this.mus = this.ctx.createGain(); this.mus.gain.value = this.musicVol; this.mus.connect(this.master);
      const n = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, n, n);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      return this.ctx;
    }
    resume() { const c = this.ensure(); if (c && c.state === 'suspended') c.resume().catch(() => {}); }
    applyVolume() { if (this.sfx) this.sfx.gain.value = this.sfxVol; if (this.mus) this.mus.gain.value = this.musicVol; }
    destroy() { try { if (this.ctx) this.ctx.close(); } catch (_) {} this.ctx = null; }

    spatial(x, z) {
      if (x == null) return { g: 1, pan: 0 };
      const L = this.listener, dx = x - L.x, dz = z - L.z, d = Math.hypot(dx, dz);
      const g = Math.max(0, 1 - d / 60) ** 1.6;
      const rx = Math.cos(L.yaw), rz = Math.sin(L.yaw);
      const pan = d > 0.5 ? Math.max(-1, Math.min(1, (dx * rx + dz * rz) / d)) * 0.7 : 0;
      return { g, pan };
    }
    out(g, pan) {
      const c = this.ctx, gn = c.createGain(); gn.gain.value = g;
      if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; gn.connect(p); p.connect(this.sfx); }
      else gn.connect(this.sfx);
      return gn;
    }
    noise(dest, t0, dur, f0, f1, q, vol, type) {
      const c = this.ctx, src = c.createBufferSource(); src.buffer = this.noiseBuf;
      const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.Q.value = q || 1;
      f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
      const g = c.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
      src.connect(f); f.connect(g); g.connect(dest);
      src.start(t0, Math.random() * 0.5); src.stop(t0 + dur + 0.05);
    }
    tone(dest, t0, dur, f0, f1, vol, type, att) {
      const c = this.ctx, o = c.createOscillator(); o.type = type || 'sine';
      o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + (att || 0.01)); g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
      o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    play(name, x, z) {
      const c = this.ensure(); if (!c || this.sfxVol <= 0) return;
      const { g, pan } = this.spatial(x, z);
      if (g < 0.02) return;
      const d = this.out(g, pan), t = c.currentTime, R = Math.random;
      switch (name) {
        case 'whoosh': this.noise(d, t, 0.22, 600, 2400, 1.2, 0.35); break;
        case 'whoosh_h': this.noise(d, t, 0.38, 300, 1400, 1, 0.45); break;
        case 'whoosh_s': this.noise(d, t, 0.15, 800, 2000, 1, 0.2); break;
        case 'hit': case 'flesh': this.noise(d, t, 0.12, 900, 200, 1.5, 0.6, 'lowpass'); this.tone(d, t, 0.1, 140, 60, 0.4, 'sine'); break;
        case 'clang': this.tone(d, t, 0.5, 1800 + R() * 400, 1700, 0.18, 'square'); this.tone(d, t, 0.6, 2700 + R() * 300, 2600, 0.12, 'triangle'); this.noise(d, t, 0.08, 4000, 2000, 2, 0.3); break;
        case 'shield': this.tone(d, t, 0.18, 220, 140, 0.4, 'triangle'); this.noise(d, t, 0.12, 700, 300, 1, 0.5, 'lowpass'); break;
        case 'wood': this.tone(d, t, 0.15, 260 + R() * 60, 160, 0.35, 'triangle'); this.noise(d, t, 0.1, 1200, 400, 2, 0.35); break;
        case 'sever': this.noise(d, t, 0.25, 1200, 150, 1, 0.8, 'lowpass'); this.tone(d, t, 0.18, 90, 40, 0.5, 'sine'); this.noise(d, t + 0.05, 0.4, 3000, 600, 1, 0.25); break;
        case 'scream': case 'help': { const f = 380 + R() * 120; this.tone(d, t, 0.7, f, f * 0.7, 0.18, 'sawtooth', 0.04); this.tone(d, t, 0.7, f * 1.5, f, 0.08, 'square', 0.05); break; }
        case 'scream_f': { const f = 620 + R() * 150; this.tone(d, t, 0.7, f, f * 0.75, 0.16, 'sawtooth', 0.04); break; }
        case 'die': this.tone(d, t, 0.6, 200, 90, 0.22, 'sawtooth', 0.03); break;
        case 'die_f': this.tone(d, t, 0.6, 360, 180, 0.2, 'sawtooth', 0.03); break;
        case 'moo': case 'moo_die': { const f = name === 'moo' ? 120 : 140; this.tone(d, t, 1.1, f, f * 0.8, 0.3, 'sawtooth', 0.2); this.tone(d, t, 1.1, f * 2, f * 1.6, 0.08, 'sine', 0.2); break; }
        case 'yelp': this.tone(d, t, 0.25, 900, 500, 0.2, 'triangle'); break;
        case 'growl': this.tone(d, t, 0.6, 90, 70, 0.25, 'sawtooth', 0.1); break;
        case 'bow': this.tone(d, t, 0.12, 180, 90, 0.3, 'triangle'); this.noise(d, t, 0.15, 2000, 800, 1, 0.25); break;
        case 'xbow': this.tone(d, t, 0.08, 120, 60, 0.5, 'square'); this.noise(d, t, 0.1, 1500, 500, 1, 0.4); break;
        case 'reload': this.tone(d, t, 0.05, 900, 800, 0.15, 'square'); this.tone(d, t + 0.12, 0.05, 700, 600, 0.15, 'square'); break;
        case 'arrowhit': this.noise(d, t, 0.08, 1500, 300, 1, 0.5, 'lowpass'); break;
        case 'thunk': this.tone(d, t, 0.08, 300, 120, 0.25, 'triangle'); break;
        case 'jump': this.noise(d, t, 0.08, 400, 200, 1, 0.12, 'lowpass'); break;
        case 'step': this.noise(d, t, 0.06, 500 + R() * 200, 200, 1, 0.07, 'lowpass'); break;
        case 'step_wood': this.tone(d, t, 0.05, 220 + R() * 40, 150, 0.06, 'triangle'); break;
        case 'pickup': this.tone(d, t, 0.08, 600, 900, 0.15, 'square'); break;
        case 'coins': for (let k = 0; k < 4; k++) this.tone(d, t + k * 0.05, 0.12, 2400 + R() * 800, 2200, 0.08, 'triangle'); break;
        case 'cloth': this.noise(d, t, 0.5, 2000, 900, 0.6, 0.2); break;
        case 'drink': for (let k = 0; k < 3; k++) this.tone(d, t + k * 0.15, 0.1, 300, 500, 0.12, 'sine'); break;
        case 'draw': this.noise(d, t, 0.25, 3000, 6000, 3, 0.2); this.tone(d, t + 0.15, 0.3, 2500, 2400, 0.05, 'triangle'); break;
        case 'sheathe': this.noise(d, t, 0.2, 5000, 2500, 3, 0.15); break;
        case 'alarm': for (let k = 0; k < 3; k++) this.tone(d, t + k * 0.22, 0.18, 520, 500, 0.16, 'square'); break;
        case 'fire': this.noise(d, t, 0.6, 800, 300, 0.4, 0.15, 'lowpass'); break;
        case 'door': this.tone(d, t, 0.3, 140, 90, 0.2, 'sawtooth'); break;
        case 'ui': this.tone(this.sfx, t, 0.05, 1100, 1000, 0.08, 'square'); break;
        case 'quest': for (let k = 0; k < 3; k++) this.tone(this.sfx, t + k * 0.12, 0.25, [523, 659, 784][k], [523, 659, 784][k], 0.12, 'triangle'); break;
        case 'heart': this.tone(this.sfx, t, 0.12, 60, 40, 0.5, 'sine'); this.tone(this.sfx, t + 0.18, 0.12, 55, 40, 0.4, 'sine'); break;
        default: break;
      }
    }
    ambience(zone, night, inForest) {
      const c = this.ctx; if (!c) return;
      const t = c.currentTime;
      this.ambT = (this.ambT || 0);
      if (t < this.ambT) return;
      this.ambT = t + 0.8 + Math.random() * 2.5;
      const g = this.out(0.5, (Math.random() - 0.5) * 1.2);
      if (night) { if (Math.random() < 0.4) { const f = 4200 + Math.random() * 600; for (let k = 0; k < 6; k++) this.tone(g, t + k * 0.06, 0.03, f, f, 0.02, 'sine'); } if (Math.random() < 0.08) this.tone(g, t, 0.5, 520, 480, 0.04, 'sine', 0.1); return; }
      if (inForest || zone === 'elf') { if (Math.random() < 0.6) { const f = 2200 + Math.random() * 1600; this.tone(g, t, 0.12, f, f * 1.3, 0.04, 'sine'); this.tone(g, t + 0.16, 0.12, f * 1.2, f, 0.04, 'sine'); } }
      else if (zone === 'evil') { this.noise(g, t, 2.5, 300, 200, 0.3, 0.05, 'lowpass'); if (Math.random() < 0.15) this.tone(g, t, 0.6, 1400, 900, 0.03, 'sine', 0.05); }
      else if (zone === 'folk' && Math.random() < 0.08) this.play('moo', this.listener.x + (Math.random() - 0.5) * 60, this.listener.z + (Math.random() - 0.5) * 60);
      else if (Math.random() < 0.3) { const f = 3000 + Math.random() * 1000; this.tone(g, t, 0.08, f, f, 0.025, 'sine'); }
    }
    music(zone, combat) {
      const c = this.ctx; if (!c || this.musicVol <= 0) return;
      const t = c.currentTime;
      if (t < this.musicT) return;
      const scales = { elf: [0, 3, 5, 7, 10], emp: [0, 2, 4, 7, 9], evil: [0, 1, 5, 6, 8], folk: [0, 2, 4, 5, 7, 9] };
      const roots = { elf: 220, emp: 196, evil: 146.8, folk: 261.6 };
      const sc = scales[zone] || scales.folk, root = roots[zone] || 220;
      const bar = combat ? 1.6 : 3.2;
      this.musicT = t + bar;
      const dest = this.mus;
      const note = s => root * Math.pow(2, s / 12);
      const step = bar / 8;
      const type = zone === 'evil' ? 'sawtooth' : zone === 'emp' ? 'square' : 'triangle';
      this.tone(dest, t, bar, note(sc[0]) / 2, note(sc[0]) / 2, combat ? 0.05 : 0.035, 'sine', 0.3);
      for (let k = 0; k < 8; k++) {
        if (Math.random() < (combat ? 0.25 : 0.45)) continue;
        const s = sc[Math.floor(Math.random() * sc.length)] + (Math.random() < 0.3 ? 12 : 0);
        this.tone(dest, t + k * step, step * 1.8, note(s), note(s), combat ? 0.03 : 0.022, type, 0.01);
      }
      if (combat) for (let k = 0; k < 4; k++) this.noise(dest, t + k * bar / 4, 0.12, 200, 80, 1, 0.12, 'lowpass');
    }
  }

  K.Audio = Audio;
})(globalThis.Korovany = globalThis.Korovany || {});
