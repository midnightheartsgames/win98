(function (N) {
  'use strict';

  const NOTE = m => 440 * Math.pow(2, (m - 69) / 12);

  class Audio {
    constructor() {
      this.ac = null;
      this.on = false;
      this.station = 0;
      this.radioOn = false;
      this.feeds = {};
      this.hissN = null;
      this.engine = null;
      this.skid = null;
      this.sirenNode = null;
      this.vol = { sfx: 0.8, radio: 0.6 };
      this.noiseBuf = null;
    }

    init() {
      if (this.ac) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ac = new AC();
      const ac = this.ac;
      this.master = ac.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(ac.destination);
      this.sfx = ac.createGain();
      this.sfx.gain.value = this.vol.sfx;
      this.sfx.connect(this.master);
      this.radio = ac.createGain();
      this.radio.gain.value = 0;
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 11000;
      this.radioLp = lp;
      this.radio.connect(lp);
      lp.connect(this.master);
      const len = ac.sampleRate * 1.5;
      this.noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.on = true;
    }

    resume() { if (this.ac && this.ac.state === 'suspended') this.ac.resume(); }

    setVolumes(sfx, radio) {
      this.vol.sfx = sfx;
      this.vol.radio = radio;
      if (this.sfx && !this.hushed) this.sfx.gain.value = sfx;
    }

    hush(on) {
      this.hushed = !!on;
      if (!this.sfx) return;
      const g = this.sfx.gain, t = this.ac.currentTime;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(on ? 0 : this.vol.sfx, t + 0.25);
    }

    noise(t, dur, gain, freq, q, type, dest, pan) {
      const ac = this.ac;
      const src = ac.createBufferSource();
      src.buffer = this.noiseBuf;
      src.playbackRate.value = 0.8 + Math.random() * 0.4;
      const f = ac.createBiquadFilter();
      f.type = type || 'lowpass';
      f.frequency.value = freq || 2000;
      f.Q.value = q || 0.7;
      const g = ac.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      src.connect(f);
      f.connect(g);
      let out = g;
      if (pan !== undefined && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
      out.connect(dest || this.sfx);
      src.start(t, Math.random() * 0.5);
      src.stop(t + dur + 0.05);
      return f;
    }

    tone(t, f0, f1, dur, gain, type, dest, pan) {
      const ac = this.ac;
      const o = ac.createOscillator();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g);
      let out = g;
      if (pan !== undefined && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
      out.connect(dest || this.sfx);
      o.start(t);
      o.stop(t + dur + 0.05);
    }

    spatial(x, z, listener) {
      if (!listener) return { g: 1, pan: 0 };
      const dx = x - listener.x, dz = z - listener.z;
      const d = Math.hypot(dx, dz);
      const g = 1 / (1 + d * d * 0.004);
      const rx = Math.cos(listener.yaw), rz = Math.sin(listener.yaw);
      const pan = d > 0.5 ? N.clamp((dx * rx + dz * rz) / d, -1, 1) * 0.8 : 0;
      return { g, pan, d };
    }

    play(kind, x, z, listener, extra) {
      if (!this.on) return;
      const ac = this.ac;
      const t = ac.currentTime + 0.005;
      const sp = x !== undefined ? this.spatial(x, z, listener) : { g: 1, pan: 0, d: 0 };
      if (sp.g < 0.01) return;
      const G = sp.g, P = sp.pan;
      switch (kind) {
        case 'pistol': this.noise(t, 0.18, 0.9 * G, 2600, 0.8, 'lowpass', null, P); this.tone(t, 180, 60, 0.12, 0.6 * G, 'triangle', null, P); break;
        case 'airgun': this.noise(t, 0.07, 0.42 * G, 1500, 1.2, 'bandpass', null, P); this.tone(t, 420, 160, 0.06, 0.28 * G, 'triangle', null, P); this.noise(t + 0.03, 0.05, 0.18 * G, 3800, 2, 'bandpass', null, P); break;
        case 'airbreak': this.noise(t, 0.05, 0.3 * G, 2200, 2, 'bandpass', null, P); this.tone(t + 0.04, 300, 180, 0.22, 0.14 * G, 'sawtooth', null, P); break;
        case 'airclick': this.tone(t, 1500, 1300, 0.03, 0.2 * G, 'square', null, P); this.noise(t, 0.04, 0.2 * G, 3000, 2, 'bandpass', null, P); break;
        case 'pellet': this.tone(t, 2400, 2200, 0.02, 0.1 * G, 'triangle', null, P); break;
        case 'airclose': this.noise(t, 0.05, 0.36 * G, 1700, 1.4, 'bandpass', null, P); this.tone(t, 520, 420, 0.04, 0.22 * G, 'square', null, P); break;
        case 'tirhit': { const f = 900 + Math.random() * 500; this.tone(t, f, f * 0.96, 0.22, 0.26 * G, 'triangle', null, P); this.tone(t, f * 2.4, f * 2.3, 0.12, 0.08 * G, 'sine', null, P); this.noise(t + 0.06, 0.08, 0.18 * G, 1200, 1, 'bandpass', null, P); break; }
        case 'tirbell': [0, 0.002].forEach(d => { this.tone(t + d, 1320, 1310, 1.4, 0.24 * G, 'sine', null, P); this.tone(t + d, 2640, 2600, 0.9, 0.08 * G, 'sine', null, P); this.tone(t + d, 3960, 3900, 0.5, 0.04 * G, 'sine', null, P); }); break;
        case 'tirmiss': this.noise(t, 0.04, 0.22 * G, 800, 1.2, 'bandpass', null, P); this.tone(t, 260, 200, 0.05, 0.12 * G, 'triangle', null, P); break;
        case 'chew': for (let i = 0; i < 3; i++) this.noise(t + i * 0.12, 0.07, 0.12 * G, 600 + Math.random() * 300, 1.5, 'bandpass', null, P); break;
        case 'gulp2': this.tone(t, 280, 160, 0.16, 0.18 * G, 'sine', null, P); this.tone(t + 0.22, 260, 150, 0.14, 0.14 * G, 'sine', null, P); break;
        case 'burp': this.tone(t, 110, 78, 0.42, 0.35 * G, 'sawtooth', null, P); this.noise(t, 0.4, 0.16 * G, 380, 0.8, 'lowpass', null, P); break;
        case 'creak': this.tone(t, 160 + Math.random() * 40, 140, 0.5, 0.06 * G, 'sawtooth', null, P); break;
        case 'ticket': this.tone(t, 1900, 1900, 0.05, 0.14, 'square'); this.tone(t + 0.08, 1500, 1500, 0.05, 0.12, 'square'); break;
        case 'shotgun': this.noise(t, 0.35, 1.2 * G, 1800, 0.7, 'lowpass', null, P); this.tone(t, 120, 40, 0.25, 0.8 * G, 'triangle', null, P); break;
        case 'rifle': this.noise(t, 0.12, 0.8 * G, 3200, 0.9, 'lowpass', null, P); this.tone(t, 160, 70, 0.08, 0.5 * G, 'square', null, P); break;
        case 'sniper': this.noise(t, 0.5, 1.3 * G, 2200, 0.7, 'lowpass', null, P); this.tone(t, 110, 35, 0.4, 0.8 * G, 'triangle', null, P); this.noise(t + 0.08, 0.9, 0.25 * G, 900, 0.5, 'lowpass', null, P); break;
        case 'explosion': this.noise(t, 1.8, 1.6 * G, 900, 0.6, 'lowpass', null, P); this.tone(t, 90, 25, 1.2, 1.2 * G, 'sine', null, P); this.noise(t, 0.3, 0.8 * G, 4000, 0.5, 'highpass', null, P); break;
        case 'crash': this.noise(t, 0.35, Math.min(1.2, 0.3 + (extra || 5) * 0.05) * G, 1500, 0.6, 'lowpass', null, P); this.tone(t, 100, 40, 0.2, 0.5 * G, 'triangle', null, P); break;
        case 'scrape': this.noise(t, 0.16, Math.min(0.5, 0.12 + (extra || 5) * 0.015) * G, 2600, 1.4, 'bandpass', null, P); this.tone(t, 1100 + Math.random() * 500, 800, 0.1, 0.05 * G, 'sawtooth', null, P); break;
        case 'punch': this.noise(t, 0.09, 0.8 * G, 700, 1, 'lowpass', null, P); this.tone(t, 150, 70, 0.08, 0.4 * G, 'sine', null, P); break;
        case 'swing': this.noise(t, 0.12, 0.25 * G, 1800, 1.5, 'bandpass', null, P); break;
        case 'stab': this.noise(t, 0.1, 0.6 * G, 2500, 2, 'bandpass', null, P); break;
        case 'hit': this.noise(t, 0.05, 0.4 * G, 3000, 1, 'highpass', null, P); break;
        case 'ric': this.tone(t, 2200 + Math.random() * 800, 900, 0.15, 0.12 * G, 'sine', null, P); break;
        case 'click': this.tone(t, 1800, 1800, 0.03, 0.2, 'square'); break;
        case 'reload': this.tone(t, 600, 600, 0.04, 0.2, 'square'); this.tone(t + 0.25, 900, 900, 0.04, 0.2, 'square'); break;
        case 'horn': this.tone(t, 415, 415, 0.35, 0.35 * G, 'square', null, P); this.tone(t, 523, 523, 0.35, 0.3 * G, 'square', null, P); break;
        case 'pickup': [0, 4, 7, 12].forEach((n, i) => this.tone(t + i * 0.06, NOTE(72 + n), NOTE(72 + n), 0.12, 0.25, 'square')); break;
        case 'money': [0, 7, 12].forEach((n, i) => this.tone(t + i * 0.05, NOTE(79 + n), NOTE(79 + n), 0.1, 0.2, 'triangle')); break;
        case 'pager': for (let i = 0; i < 3; i++) this.tone(t + i * 0.16, 2600, 2600, 0.1, 0.18, 'square'); break;
        case 'pass': [[0, 0], [4, 0.16], [7, 0.32], [12, 0.48], [16, 0.64], [19, 0.8]].forEach(([n, d]) => { this.tone(t + d, NOTE(64 + n), NOTE(64 + n), 0.5, 0.25, 'square'); this.tone(t + d, NOTE(52 + n), NOTE(52 + n), 0.5, 0.2, 'triangle'); }); break;
        case 'fail': [[7, 0], [6, 0.3], [5, 0.6], [4, 0.9]].forEach(([n, d]) => this.tone(t + d, NOTE(60 + n), NOTE(60 + n), 0.4, 0.25, 'sawtooth')); break;
        case 'wasted': this.tone(t, 300, 60, 2.5, 0.4, 'sawtooth'); this.noise(t, 2.5, 0.3, 400, 0.5); break;
        case 'busted': [0, 0.35, 0.7].forEach(d => this.tone(t + d, 700, 500, 0.3, 0.3, 'square')); break;
        case 'menu': this.tone(t, 900, 900, 0.05, 0.15, 'square'); break;
        case 'pclick': this.tone(t, 1250, 1150, 0.025, 0.09 * this.vol.sfx, 'square', this.master); break;
        case 'pdeny': this.tone(t, 220, 160, 0.18, 0.2 * this.vol.sfx, 'square', this.master); break;
        case 'shutter': {
          const V = Math.max(0.25, this.vol.sfx), M = this.master;
          this.noise(t, 0.025, 0.55 * V, 5200, 1.1, 'highpass', M);
          this.tone(t, 2400, 1600, 0.02, 0.18 * V, 'square', M);
          this.noise(t + 0.075, 0.03, 0.45 * V, 3600, 1.3, 'bandpass', M);
          this.tone(t + 0.075, 1500, 1100, 0.025, 0.14 * V, 'triangle', M);
          for (let i = 0; i < 9; i++) this.noise(t + 0.18 + i * 0.045, 0.035, 0.08 * V, 2200 + i * 60, 3, 'bandpass', M);
          this.tone(t + 0.17, 170, 230, 0.42, 0.05 * V, 'sawtooth', M);
          break;
        }
        case 'cameraon': { const V = Math.max(0.25, this.vol.sfx); this.tone(t, 300, 520, 0.28, 0.045 * V, 'sawtooth', this.master); this.noise(t + 0.27, 0.03, 0.2 * V, 3000, 1.5, 'bandpass', this.master); break; }
        case 'deny': this.tone(t, 200, 150, 0.2, 0.3, 'square'); break;
        case 'door': this.noise(t, 0.25, 0.5 * G, 900, 1, 'lowpass', null, P); break;
        case 'glass': this.noise(t, 0.4, 0.5 * G, 5000, 1, 'highpass', null, P); break;
        case 'wood': { const k = Math.min(1.3, 0.55 + (extra || 1) * 0.12); this.noise(t, 0.05, 0.75 * G * k, 1900, 1.4, 'bandpass', null, P); this.noise(t + 0.03, 0.22, 0.45 * G * k, 900, 0.9, 'bandpass', null, P); this.tone(t, 190, 95, 0.14, 0.4 * G * k, 'triangle', null, P); for (let i = 0; i < 3; i++) this.noise(t + 0.06 + Math.random() * 0.18, 0.03, 0.22 * G * k, 2600, 2, 'bandpass', null, P); break; }
        case 'clang': { const k = Math.min(1.3, 0.55 + (extra || 1) * 0.12), f = 380 + Math.random() * 260; this.tone(t, f, f * 0.94, 0.45, 0.32 * G * k, 'triangle', null, P); this.tone(t, f * 2.71, f * 2.6, 0.3, 0.14 * G * k, 'sine', null, P); this.noise(t, 0.09, 0.6 * G * k, 2400, 1.2, 'bandpass', null, P); this.tone(t, 120, 60, 0.12, 0.4 * G * k, 'sine', null, P); break; }
        case 'crunch': { const k = Math.min(1.3, 0.55 + (extra || 1) * 0.12); this.noise(t, 0.35, 0.9 * G * k, 650, 0.7, 'lowpass', null, P); this.tone(t, 85, 40, 0.25, 0.55 * G * k, 'sine', null, P); for (let i = 0; i < 4; i++) this.noise(t + Math.random() * 0.25, 0.04, 0.25 * G * k, 1500, 1.2, 'bandpass', null, P); break; }
        case 'rattle': { const k = Math.min(1.3, 0.55 + (extra || 1) * 0.12); for (let i = 0; i < 6; i++) this.noise(t + i * 0.035 + Math.random() * 0.02, 0.05, 0.3 * G * k, 2900 + Math.random() * 900, 2.2, 'bandpass', null, P); this.tone(t, 260, 210, 0.3, 0.16 * G * k, 'square', null, P); break; }
        case 'knock': this.tone(t, 260 + Math.random() * 90, 170, 0.07, 0.3 * G * Math.min(1.4, extra || 1), 'triangle', null, P); this.noise(t, 0.05, 0.25 * G * Math.min(1.4, extra || 1), 1100, 1, 'lowpass', null, P); break;
        case 'clank': { const f = 700 + Math.random() * 500; this.tone(t, f, f * 0.9, 0.14, 0.14 * G * Math.min(1.4, extra || 1), 'triangle', null, P); this.noise(t, 0.04, 0.22 * G * Math.min(1.4, extra || 1), 2600, 1.4, 'bandpass', null, P); break; }
        case 'splash': this.noise(t, 1.0, 0.9 * G, 700, 0.5, 'lowpass', null, P); break;
        case 'wanted': this.tone(t, 900, 1300, 0.25, 0.2, 'triangle'); break;
        case 'thud': this.tone(t, 90, 40, 0.2, 0.6 * G, 'sine', null, P); break;
        case 'bounce': this.tone(t, 800, 500, 0.06, 0.15 * G, 'triangle', null, P); break;
        case 'step': this.noise(t, 0.06, 0.13 * G * (extra || 1), 520, 1.2, 'lowpass', null, P); break;
        case 'rustle': { const k = Math.min(1.4, extra || 1); for (let i = 0; i < 5; i++) this.noise(t + i * 0.05 + Math.random() * 0.04, 0.09 + Math.random() * 0.06, 0.16 * G * k, 3200 + Math.random() * 2400, 0.9, 'bandpass', null, P); this.noise(t, 0.28, 0.12 * G * k, 1300, 0.6, 'bandpass', null, P); if (k > 1) for (let i = 0; i < 3; i++) this.noise(t + 0.04 + Math.random() * 0.2, 0.03, 0.2 * G, 1800, 2, 'bandpass', null, P); break; }
        case 'stone': this.tone(t, 1400 + Math.random() * 700, 900, 0.05, 0.12 * G, 'triangle', null, P); this.noise(t, 0.08, 0.3 * G, 2400, 1.2, 'bandpass', null, P); break;
        case 'wade': this.noise(t, 0.3, 0.32 * G * (extra || 1), 900, 0.8, 'bandpass', null, P); this.noise(t + 0.05, 0.2, 0.12 * G, 2600, 1, 'bandpass', null, P); break;
        case 'flail': this.noise(t, 0.24, 0.42 * G, 1100, 0.7, 'bandpass', null, P); break;
        case 'gulp': this.tone(t, 320, 140, 0.25, 0.3 * G, 'sine', null, P); this.tone(t + 0.3, 260, 120, 0.2, 0.22 * G, 'sine', null, P); this.noise(t + 0.1, 0.7, 0.3 * G, 600, 0.6, 'lowpass', null, P); break;
        case 'magout': this.tone(t, 900, 700, 0.03, 0.18 * G, 'square', null, P); this.noise(t + 0.02, 0.05, 0.22 * G, 2500, 1.5, 'bandpass', null, P); break;
        case 'magin': this.tone(t, 520, 450, 0.04, 0.22 * G, 'square', null, P); this.noise(t, 0.05, 0.32 * G, 1800, 1.5, 'bandpass', null, P); break;
        case 'rack': this.noise(t, 0.05, 0.3 * G, 3000, 1.2, 'bandpass', null, P); this.noise(t + 0.12, 0.06, 0.36 * G, 2200, 1.2, 'bandpass', null, P); this.tone(t + 0.12, 700, 600, 0.03, 0.15 * G, 'square', null, P); break;
        case 'slide': this.noise(t, 0.04, 0.3 * G, 3200, 1.5, 'bandpass', null, P); this.tone(t + 0.08, 1100, 900, 0.03, 0.15 * G, 'square', null, P); break;
        case 'pump': this.noise(t, 0.07, 0.36 * G, 1400, 1, 'bandpass', null, P); this.noise(t + 0.16, 0.07, 0.42 * G, 1100, 1, 'bandpass', null, P); break;
        case 'shell': this.noise(t, 0.04, 0.22 * G, 2600, 2, 'bandpass', null, P); this.tone(t, 1300, 1200, 0.02, 0.1 * G, 'triangle', null, P); break;
        case 'magnum': this.noise(t, 0.3, 1.25 * G, 2000, 0.7, 'lowpass', null, P); this.tone(t, 150, 45, 0.22, 0.85 * G, 'triangle', null, P); this.noise(t + 0.05, 0.6, 0.2 * G, 800, 0.5, 'lowpass', null, P); break;
        case 'toz': this.noise(t, 0.42, 1.3 * G, 1600, 0.7, 'lowpass', null, P); this.tone(t, 110, 36, 0.3, 0.9 * G, 'triangle', null, P); this.noise(t + 0.1, 0.8, 0.25 * G, 700, 0.5, 'lowpass', null, P); break;
        case 'smg': this.noise(t, 0.08, 0.6 * G, 3600, 0.9, 'lowpass', null, P); this.tone(t, 210, 90, 0.05, 0.35 * G, 'square', null, P); break;
        case 'sks': this.noise(t, 0.2, 0.95 * G, 2800, 0.8, 'lowpass', null, P); this.tone(t, 140, 55, 0.14, 0.6 * G, 'triangle', null, P); this.noise(t + 0.06, 0.5, 0.18 * G, 1000, 0.5, 'lowpass', null, P); break;
        case 'vss': this.noise(t, 0.07, 0.3 * G, 900, 0.9, 'lowpass', null, P); this.noise(t + 0.01, 0.04, 0.14 * G, 3800, 1.4, 'bandpass', null, P); this.tone(t + 0.02, 1200, 900, 0.03, 0.06 * G, 'square', null, P); break;
        case 'mg': this.noise(t, 0.14, 1.0 * G, 2600, 0.8, 'lowpass', null, P); this.tone(t, 130, 50, 0.1, 0.7 * G, 'square', null, P); break;
        case 'kpvt': this.noise(t, 0.2, 1.2 * G, 2000, 0.7, 'lowpass', null, P); this.tone(t, 95, 40, 0.14, 0.9 * G, 'square', null, P); break;
        case 'cannon': this.noise(t, 0.5, 1.8 * G, 1400, 0.6, 'lowpass', null, P); this.tone(t, 70, 20, 1.1, 1.4 * G, 'sine', null, P); this.noise(t, 0.12, 1.0 * G, 3800, 0.6, 'highpass', null, P); this.noise(t + 0.1, 2.4, 0.5 * G, 320, 0.5, 'lowpass', null, P); break;
        case 'rpg': this.noise(t, 0.25, 1.2 * G, 1200, 0.6, 'lowpass', null, P); this.tone(t, 80, 30, 0.3, 1.0 * G, 'sine', null, P); this.noise(t + 0.05, 1.4, 0.55 * G, 2400, 0.6, 'bandpass', null, P); break;
        case 'molotov': this.noise(t, 0.9, 0.8 * G, 500, 0.6, 'lowpass', null, P); this.tone(t, 70, 140, 0.6, 0.35 * G, 'sine', null, P); break;
        case 'ignite': this.noise(t, 0.6, 0.6 * G, 700, 0.6, 'lowpass', null, P); break;
        case 'crackle': for (let i = 0; i < 4; i++) this.noise(t + Math.random() * 0.25, 0.02, (0.12 + Math.random() * 0.12) * G, 2500 + Math.random() * 2500, 2, 'bandpass', null, P); break;
        case 'steam': this.noise(t, 0.9, 0.35 * G, 4200, 0.8, 'highpass', null, P); break;
        case 'open': this.tone(t, 640, 520, 0.04, 0.2 * G, 'square', null, P); this.noise(t + 0.03, 0.08, 0.3 * G, 1600, 1.2, 'bandpass', null, P); break;
        case 'close': this.noise(t, 0.06, 0.45 * G, 1300, 1, 'bandpass', null, P); this.tone(t, 420, 360, 0.04, 0.25 * G, 'square', null, P); break;
        case 'eject': this.noise(t, 0.05, 0.2 * G, 2400, 1.5, 'bandpass', null, P); for (let i = 0; i < 3; i++) this.tone(t + 0.1 + i * 0.07, 1500 - i * 150, 1300 - i * 150, 0.04, 0.1 * G, 'triangle', null, P); break;
        case 'cover': this.noise(t, 0.05, 0.36 * G, 1700, 1.2, 'bandpass', null, P); this.tone(t, 380, 300, 0.05, 0.24 * G, 'square', null, P); break;
        case 'belt': for (let i = 0; i < 5; i++) this.noise(t + i * 0.03, 0.025, 0.16 * G, 3400, 2, 'bandpass', null, P); break;
        case 'clip': this.noise(t, 0.04, 0.26 * G, 2800, 1.6, 'bandpass', null, P); this.tone(t, 980, 900, 0.03, 0.12 * G, 'square', null, P); break;
        case 'clip2': for (let i = 0; i < 5; i++) this.noise(t + i * 0.035, 0.02, 0.18 * G, 2200, 2, 'bandpass', null, P); break;
        case 'grab': this.noise(t, 0.12, 0.2 * G, 900, 1, 'bandpass', null, P); break;
        case 'rpgload': this.noise(t, 0.15, 0.3 * G, 800, 1, 'bandpass', null, P); this.tone(t + 0.12, 300, 240, 0.06, 0.3 * G, 'square', null, P); break;
        case 'dooropen': this.noise(t, 0.08, 0.3 * G, 1200, 1.5, 'bandpass', null, P); this.tone(t, 220, 200, 0.06, 0.15 * G, 'triangle', null, P); break;
        case 'mdooropen': this.noise(t, 0.55, 0.42 * G, 3200, 0.7, 'highpass', null, P); this.noise(t + 0.45, 0.12, 0.5 * G, 600, 0.9, 'lowpass', null, P); this.tone(t + 0.45, 120, 70, 0.1, 0.4 * G, 'sine', null, P); break;
        case 'mdoorclose': this.noise(t, 0.4, 0.38 * G, 3000, 0.7, 'highpass', null, P); this.noise(t + 0.38, 0.18, 0.9 * G, 450, 0.8, 'lowpass', null, P); this.tone(t + 0.38, 95, 45, 0.16, 0.8 * G, 'sine', null, P); break;
        case 'mbrake': this.tone(t, 2650, 2250, 1.4, 0.07 * G, 'sine', null, P); this.tone(t + 0.3, 3100, 2900, 1.0, 0.04 * G, 'sine', null, P); this.noise(t, 1.6, 0.18 * G, 3600, 2.2, 'bandpass', null, P); break;
        case 'mhorn': this.tone(t, 680, 680, 0.75, 0.32 * G, 'sawtooth', null, P); this.tone(t, 856, 856, 0.75, 0.24 * G, 'sawtooth', null, P); break;
        case 'mtoken': this.tone(t, 2300, 2100, 0.06, 0.16 * G, 'triangle', null, P); this.tone(t + 0.07, 1700, 1600, 0.05, 0.12 * G, 'triangle', null, P); this.noise(t + 0.18, 0.06, 0.25 * G, 1500, 1.4, 'bandpass', null, P); break;
        case 'mslam': this.noise(t, 0.12, 0.8 * G, 1300, 1.1, 'bandpass', null, P); this.tone(t, 320, 120, 0.12, 0.45 * G, 'square', null, P); this.noise(t + 0.1, 0.1, 0.5 * G, 2400, 1.5, 'bandpass', null, P); break;
        case 'mwhistle': for (let i = 0; i < 6; i++) this.tone(t + i * 0.07, 2900, 3100, 0.06, 0.14 * G, 'sine', null, P); break;
        case 'doorclose': this.noise(t, 0.16, 0.6 * G, 500, 0.8, 'lowpass', null, P); this.tone(t, 110, 70, 0.12, 0.42 * G, 'sine', null, P); break;
      }
    }

    updateEngine(v, speedFrac, thr, slip, sirenD, onFoot) {
      if (!this.on) return;
      const ac = this.ac;
      const t = ac.currentTime;
      if (!this.engine) {
        const o1 = ac.createOscillator(), o2 = ac.createOscillator();
        o1.type = 'sawtooth'; o2.type = 'square';
        const f = ac.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 600;
        const g = ac.createGain();
        g.gain.value = 0;
        o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.sfx);
        o1.start(); o2.start();
        const s = ac.createBufferSource();
        s.buffer = this.noiseBuf; s.loop = true;
        const sf = ac.createBiquadFilter(); sf.type = 'bandpass'; sf.frequency.value = 1100; sf.Q.value = 1.2;
        const sg = ac.createGain(); sg.gain.value = 0;
        s.connect(sf); sf.connect(sg); sg.connect(this.sfx); s.start();
        const so = ac.createOscillator(); so.type = 'triangle';
        const lfo = ac.createOscillator(); lfo.frequency.value = 0.55;
        const lg = ac.createGain(); lg.gain.value = 320;
        lfo.connect(lg); lg.connect(so.frequency);
        so.frequency.value = 950;
        const sgain = ac.createGain(); sgain.gain.value = 0;
        so.connect(sgain); sgain.connect(this.sfx);
        so.start(); lfo.start();
        this.engine = { o1, o2, f, g, sg, sgain };
      }
      const e = this.engine;
      if (v && !onFoot) {
        const sf = N.clamp(speedFrac, 0, 1.1), gear = Math.min(4, Math.floor(sf * 5));
        const rpm = v.rpm !== undefined ? v.rpm : 0.25 + (sf * 5 - gear) * 0.75 + (thr > 0 && sf < 0.02 ? 0.2 : 0);
        const ty = v.spec.type, base = ty === 'bike' ? 70 : ty === 'tank' ? 22 : ty === 'apc' ? 28 : ty === 'truck' || ty === 'bus' ? 32 : 46;
        const fq = base + rpm * base * 2.2;
        e.o1.frequency.setTargetAtTime(fq, t, 0.05);
        e.o2.frequency.setTargetAtTime(fq * 0.5, t, 0.05);
        e.f.frequency.setTargetAtTime(300 + rpm * 900 + Math.abs(thr) * 400, t, 0.05);
        e.g.gain.setTargetAtTime(v.dead ? 0 : 0.07 + Math.abs(thr) * 0.07, t, 0.08);
        e.sg.gain.setTargetAtTime(N.clamp((slip - 0.15) * 0.6, 0, 0.35), t, 0.05);
      } else {
        e.g.gain.setTargetAtTime(0, t, 0.1);
        e.sg.gain.setTargetAtTime(0, t, 0.1);
      }
      e.sgain.gain.setTargetAtTime(sirenD !== null && sirenD < 150 ? 0.12 * (1 - sirenD / 150) : 0, t, 0.1);
    }

    loop(type, freq, q, gain) {
      const ac = this.ac;
      const src = ac.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const f = ac.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ac.createGain();
      g.gain.value = gain;
      src.connect(f);
      f.connect(g);
      g.connect(this.sfx);
      src.start();
      return { src, f, g };
    }

    pulse(type, freq, q, rate, depth) {
      const ac = this.ac, n = this.loop(type, freq, q, 0), m = ac.createGain(), lfo = ac.createOscillator(), la = ac.createGain();
      n.g.disconnect();
      m.gain.value = 1 - depth;
      lfo.type = 'square';
      lfo.frequency.value = rate;
      la.gain.value = depth;
      lfo.connect(la);
      la.connect(m.gain);
      lfo.start();
      n.g.connect(m);
      m.connect(this.sfx);
      return { f: n.f, g: n.g, lfo };
    }

    updateMachines(armor, heli) {
      if (!this.on) return;
      const t = this.ac.currentTime;
      if (!this.mach) this.mach = { diesel: this.pulse('lowpass', 160, 0.9, 22, 0.35), tracks: this.pulse('bandpass', 1900, 1.6, 6, 0.5), rotor: this.pulse('lowpass', 260, 0.8, 9, 0.45) };
      const M = this.mach, near = d => 1 / (1 + d * d * 0.0012), a = armor ? near(armor.d) : 0;
      M.diesel.g.gain.setTargetAtTime(armor ? a * (0.1 + armor.thr * 0.08) : 0, t, 0.15);
      M.diesel.lfo.frequency.setTargetAtTime(armor ? 16 + armor.spd * 1.6 : 16, t, 0.2);
      M.tracks.g.gain.setTargetAtTime(armor && armor.track ? a * Math.min(0.22, armor.spd * 0.03) : 0, t, 0.1);
      M.tracks.lfo.frequency.setTargetAtTime(armor ? 2 + armor.spd * 1.8 : 2, t, 0.1);
      M.rotor.g.gain.setTargetAtTime(heli ? 0.35 * near(heli.d * 0.5) : 0, t, 0.3);
      M.rotor.lfo.frequency.setTargetAtTime(heli ? heli.rate : 9, t, 0.3);
    }

    updateMetro(s) {
      if (!this.on) return;
      const t = this.ac.currentTime;
      if (!this.metroN) this.metroN = { rumble: this.loop('lowpass', 150, 0.8, 0), wheels: this.pulse('bandpass', 950, 1.4, 4, 0.7), hiss: this.loop('bandpass', 1800, 0.5, 0) };
      const M = this.metroN;
      const ride = s && s.ride >= 0 ? s.ride : 0, nr = s && s.near ? s.near : null;
      const near = nr ? Math.max(0, 1 - nr.d / 140) * Math.min(1, nr.v / 10) : 0;
      const k = s ? Math.min(1, ride / 18) : 0;
      M.rumble.g.gain.setTargetAtTime(s ? Math.min(0.55, k * 0.4 + near * 0.6 + (s.ride >= 0 ? 0.04 : 0)) : 0, t, 0.25);
      M.rumble.f.frequency.setTargetAtTime(110 + ride * 6 + near * 120, t, 0.3);
      M.wheels.g.gain.setTargetAtTime(s ? Math.min(0.3, k * 0.22 + near * 0.3) : 0, t, 0.2);
      M.wheels.lfo.frequency.setTargetAtTime(Math.max(0.5, (ride || (nr ? nr.v : 0)) / 6.25), t, 0.2);
      M.hiss.g.gain.setTargetAtTime(s ? Math.min(0.12, k * 0.08 + near * 0.12) * (s.tunnel ? 1.4 : 1) : 0, t, 0.4);
    }

    updateWeather(rain, inCar, inside) {
      if (!this.on) return;
      const t = this.ac.currentTime;
      if (!this.rainNodes) this.rainNodes = { hiss: this.loop('bandpass', 2600, 0.45, 0), drum: this.loop('lowpass', 420, 0.8, 0) };
      const k = inside ? 0 : N.clamp(rain, 0, 1);
      const R = this.rainNodes;
      R.hiss.g.gain.setTargetAtTime(k * (inCar ? 0.05 : 0.2), t, 0.6);
      R.hiss.f.frequency.setTargetAtTime(inCar ? 1300 : 2600, t, 0.3);
      R.drum.g.gain.setTargetAtTime(k * (inCar ? 0.32 : 0.08), t, 0.6);
    }

    thunder(delay, dist) {
      if (!this.on) return;
      const ac = this.ac;
      const t = ac.currentTime + Math.min(12, delay);
      const near = N.clamp(1400 / dist, 0, 1);
      const burst = (at, dur, gain, type, freq, q) => {
        const n = this.loop(type, freq, q, 0);
        n.g.gain.setValueAtTime(0.0001, at);
        n.g.gain.exponentialRampToValueAtTime(gain, at + 0.04 + (1 - near) * 0.5);
        n.g.gain.exponentialRampToValueAtTime(0.0005, at + dur);
        n.src.stop(at + dur + 0.1);
      };
      if (near > 0.6) burst(t, 0.45, 0.5 * near, 'highpass', 2800, 0.6);
      burst(t + 0.03, 2.4 + 3.2 * (1 - near), 0.6 * (0.35 + 0.65 * near), 'lowpass', 140 + 260 * near, 0.7);
      burst(t + 0.35 + Math.random() * 0.4, 3.5 + 2 * (1 - near), 0.35 * (0.4 + 0.6 * near), 'lowpass', 85, 1.1);
    }

    setRadio(station, on, duck) {
      if (!this.on) return;
      on = !!on && !!N.RADIO[station];
      const changed = station !== this.station || on !== this.radioOn;
      const t = this.ac.currentTime;
      if (changed) {
        if (this.radioOn) this.dropFeed(this.station);
        this.station = station;
        this.radioOn = on;
        if (on) {
          this.noise(t, 0.35, 0.25 * this.vol.radio, 3000, 0.4, 'bandpass', this.master);
          this.tune(station);
        } else this.hiss(false);
      }
      if (changed || !!duck !== this.ducked || this.radioVol !== this.vol.radio) this.radio.gain.setTargetAtTime(on ? this.vol.radio * (duck ? 0.22 : 0.8) : 0, t, 0.2);
      this.ducked = !!duck;
      this.radioVol = this.vol.radio;
    }

    feed(i) {
      if (this.feeds[i]) return this.feeds[i];
      const el = document.createElement('audio');
      el.preload = 'auto';
      el.loop = true;
      el.src = N.RADIO_DIR + N.RADIO[i].file + '.mp3';
      const g = this.ac.createGain();
      g.gain.value = 0;
      this.ac.createMediaElementSource(el).connect(g);
      g.connect(this.radio);
      const f = { el, g, stop: 0 };
      el.addEventListener('playing', () => this.tuned(i));
      el.addEventListener('waiting', () => { if (this.radioOn && this.station === i) this.hiss(true); });
      return (this.feeds[i] = f);
    }

    tune(i) {
      const f = this.feed(i), el = f.el;
      clearTimeout(f.stop);
      this.hiss(true);
      const go = () => {
        if (!this.radioOn || this.station !== i) return;
        const at = N.radioPos(i, Date.now() / 1000, isFinite(el.duration) && el.duration > 0 ? el.duration : 0);
        if (Math.abs(el.currentTime - at) > 1.5) el.currentTime = at;
        const p = el.play();
        if (p && p.catch) p.catch(() => {});
        if (!el.paused && el.readyState >= 3) this.tuned(i);
      };
      if (el.readyState >= 1) go();
      else el.addEventListener('loadedmetadata', go, { once: true });
    }

    tuned(i) {
      if (!this.radioOn || this.station !== i) return;
      const t = this.ac.currentTime, g = this.feeds[i].g.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(1, t + 0.35);
      this.hiss(false);
    }

    dropFeed(i) {
      const f = this.feeds[i];
      if (!f) return;
      const t = this.ac.currentTime, g = f.g.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(0, t + 0.15);
      clearTimeout(f.stop);
      f.stop = setTimeout(() => { if (!(this.radioOn && this.station === i)) f.el.pause(); }, 400);
    }

    hiss(on) {
      if (!this.hissN) {
        if (!on) return;
        this.hissN = this.loop('bandpass', 2400, 0.5, 0);
        this.hissN.g.disconnect();
        this.hissN.g.connect(this.radio);
      }
      this.hissN.g.gain.setTargetAtTime(on ? 0.12 : 0, this.ac.currentTime, on ? 0.05 : 0.15);
    }

    destroy() {
      for (const f of Object.values(this.feeds)) { clearTimeout(f.stop); f.el.pause(); f.el.removeAttribute('src'); f.el.load(); }
      this.feeds = {};
      if (this.ac) this.ac.close();
      this.on = false;
      this.ac = null;
    }
  }

  N.Audio = Audio;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
