(function (G) {
  'use strict';

  const CHORDS = [[0, 3, 7], [5, 8, 12], [7, 10, 14], [3, 7, 10], [8, 12, 15], [10, 14, 17]];
  const PROG = { disco: [0, 4, 3, 2], rock: [0, 3, 5, 2], mayak: [0, 1, 3, 2] };

  class Audio {
    constructor() {
      this.ctx = null;
      this.sfxVol = 0.7; this.musicVol = 0.5;
      this.station = 0;
      this.engineOn = false;
      this.nextNote = 0; this.step = 0;
      this.noise = null;
    }

    init() {
      if (this.ctx) return true;
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return false;
      try { this.ctx = new AC(); } catch (e) { return false; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = 0.8; this.master.connect(c.destination);
      this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.sfxVol; this.sfxBus.connect(this.master);
      this.musicBus = c.createGain(); this.musicBus.gain.value = this.musicVol; this.musicBus.connect(this.master);
      const len = c.sampleRate;
      this.noise = c.createBuffer(1, len, c.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.eng = c.createOscillator(); this.eng.type = 'sawtooth';
      this.eng2 = c.createOscillator(); this.eng2.type = 'square';
      this.engF = c.createBiquadFilter(); this.engF.type = 'lowpass'; this.engF.frequency.value = 500;
      this.engG = c.createGain(); this.engG.gain.value = 0;
      this.eng.connect(this.engF); this.eng2.connect(this.engF); this.engF.connect(this.engG); this.engG.connect(this.sfxBus);
      this.eng.start(); this.eng2.start();
      this.sir = c.createOscillator(); this.sir.type = 'square';
      this.sirF = c.createBiquadFilter(); this.sirF.type = 'lowpass'; this.sirF.frequency.value = 1800;
      this.sirG = c.createGain(); this.sirG.gain.value = 0;
      this.sir.connect(this.sirF); this.sirF.connect(this.sirG); this.sirG.connect(this.sfxBus);
      this.sir.start();
      return true;
    }

    resume() { if (this.init() && this.ctx.state === 'suspended') this.ctx.resume(); }
    close() { if (this.ctx) { try { this.ctx.close(); } catch (e) { return; } this.ctx = null; } }
    setVolumes(sfx, music) {
      this.sfxVol = sfx; this.musicVol = music;
      if (this.ctx) { this.sfxBus.gain.value = sfx; this.musicBus.gain.value = music; }
    }

    env(node, t, a, peak, dur) {
      node.gain.setValueAtTime(0.0001, t);
      node.gain.linearRampToValueAtTime(peak, t + a);
      node.gain.exponentialRampToValueAtTime(0.0001, t + a + dur);
    }

    noiseHit(t, dur, freq, q, peak, type, dest) {
      const c = this.ctx;
      const s = c.createBufferSource(); s.buffer = this.noise;
      s.playbackRate.value = 0.6 + Math.random() * 0.8;
      const f = c.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq; f.Q.value = q || 1;
      const g = c.createGain();
      this.env(g, t, 0.002, peak, dur);
      s.connect(f); f.connect(g); g.connect(dest || this.sfxBus);
      s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    }

    tone(t, freq, dur, type, peak, dest, slide) {
      const c = this.ctx;
      const o = c.createOscillator(); o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
      const g = c.createGain();
      this.env(g, t, 0.005, peak, dur);
      o.connect(g); g.connect(dest || this.sfxBus);
      o.start(t); o.stop(t + dur + 0.05);
    }

    sfx(id, vol) {
      if (!this.ctx) return;
      const v = vol == null ? 1 : vol;
      if (v < 0.03) return;
      const t = this.ctx.currentTime + 0.01;
      switch (id) {
        case 'pm': this.noiseHit(t, 0.12, 2200, 0.8, 0.5 * v); this.tone(t, 180, 0.08, 'square', 0.2 * v, null, 60); break;
        case 'akm': this.noiseHit(t, 0.09, 2600, 0.8, 0.45 * v); this.tone(t, 140, 0.06, 'square', 0.18 * v, null, 50); break;
        case 'obrez': this.noiseHit(t, 0.28, 1400, 0.7, 0.7 * v); this.tone(t, 90, 0.2, 'sawtooth', 0.3 * v, null, 40); break;
        case 'rpg': case 'cannon': this.noiseHit(t, 0.45, 900, 0.6, 0.6 * v); this.tone(t, 220, 0.4, 'sawtooth', 0.2 * v, null, 60); break;
        case 'whoosh': this.noiseHit(t, 0.6, 700, 0.5, 0.35 * v, 'bandpass'); break;
        case 'boom':
          this.noiseHit(t, 1.2, 420, 0.7, 0.9 * v);
          this.tone(t, 70, 0.9, 'sine', 0.7 * v, null, 30);
          break;
        case 'crash': this.noiseHit(t, 0.22, 1000, 1.2, 0.5 * v, 'bandpass'); this.tone(t, 110, 0.15, 'square', 0.15 * v, null, 50); break;
        case 'thud': this.noiseHit(t, 0.15, 500, 1, 0.5 * v); break;
        case 'punch': this.noiseHit(t, 0.08, 800, 1, 0.4 * v); break;
        case 'splash': this.noiseHit(t, 0.7, 1800, 0.4, 0.45 * v, 'highpass'); break;
        case 'horn': this.tone(t, 392, 0.3, 'square', 0.18 * v); this.tone(t, 466, 0.3, 'square', 0.14 * v); break;
        case 'pickup': this.tone(t, 660, 0.08, 'square', 0.18); this.tone(t + 0.08, 990, 0.12, 'square', 0.18); break;
        case 'cash': [880, 1175, 1568].forEach((f, k) => this.tone(t + k * 0.07, f, 0.12, 'triangle', 0.2)); break;
        case 'phone': for (let k = 0; k < 6; k++) this.tone(t + k * 0.05, k % 2 ? 1400 : 1800, 0.045, 'square', 0.12); break;
        case 'ring': for (let k = 0; k < 10; k++) this.tone(t + k * 0.04, k % 2 ? 1300 : 1700, 0.035, 'square', 0.07 * v); break;
        case 'pass': [523, 659, 784, 1047].forEach((f, k) => this.tone(t + k * 0.12, f, 0.25, 'square', 0.2)); break;
        case 'fail': [392, 330, 262, 196].forEach((f, k) => this.tone(t + k * 0.15, f, 0.3, 'sawtooth', 0.16)); break;
        case 'wasted': this.tone(t, 300, 1.4, 'sawtooth', 0.25, null, 40); this.noiseHit(t, 1, 300, 0.5, 0.3); break;
        case 'busted': for (let k = 0; k < 4; k++) this.tone(t + k * 0.25, k % 2 ? 660 : 880, 0.22, 'square', 0.18); break;
        case 'frenzy': [220, 277, 330, 440].forEach((f, k) => this.tone(t + k * 0.09, f, 0.3, 'sawtooth', 0.22)); break;
        case 'garage': this.noiseHit(t, 0.9, 300, 1.5, 0.35, 'bandpass'); this.tone(t, 60, 0.8, 'sawtooth', 0.12); break;
        case 'crush': this.noiseHit(t, 1.2, 200, 2, 0.6); this.tone(t, 50, 1.2, 'sawtooth', 0.3, null, 25); break;
        case 'checkpoint': this.tone(t, 1047, 0.15, 'square', 0.2); this.tone(t + 0.1, 1319, 0.2, 'square', 0.2); break;
        case 'beep': this.tone(t, 660, 0.2, 'square', 0.22); break;
        case 'go': this.tone(t, 1320, 0.5, 'square', 0.25); break;
        case 'click': this.tone(t, 1200, 0.03, 'square', 0.1); break;
        case 'radio': this.noiseHit(t, 0.25, 3000, 0.3, 0.2, 'bandpass'); break;
        case 'tramBell': [1568, 1568, 1568].forEach((f, k) => { this.tone(t + k * 0.16, f, 0.22, 'triangle', 0.16 * v); this.tone(t + k * 0.16, f * 2.4, 0.08, 'sine', 0.05 * v); }); break;
        case 'trainHorn': this.tone(t, 311, 0.9, 'sawtooth', 0.12 * v); this.tone(t, 370, 0.9, 'sawtooth', 0.1 * v); this.tone(t + 1, 311, 0.5, 'sawtooth', 0.1 * v); break;
        default: break;
      }
    }

    update(st) {
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime;
      const eg = st.engine || 0;
      if (st.inCar) {
        const sp = st.speed || 0;
        const gear = Math.min(4, Math.floor(sp / 95));
        const rpm = (sp - gear * 95) / 95;
        const base = st.boat ? 38 : st.heavy ? 34 : st.tank ? 28 : 48;
        const f = base + rpm * base * 1.6 + gear * 6 + (st.thr > 0 ? 8 : 0);
        this.eng.frequency.setTargetAtTime(f, t, 0.05);
        this.eng2.frequency.setTargetAtTime(f * 0.5 + 1, t, 0.05);
        this.engF.frequency.setTargetAtTime(300 + rpm * 700 + (st.thr > 0 ? 300 : 0), t, 0.08);
        this.engG.gain.setTargetAtTime(0.1 * eg, t, 0.1);
      } else this.engG.gain.setTargetAtTime(0, t, 0.1);
      const sv = st.siren || 0;
      if (sv > 0.01) {
        const ph = (t * (st.kgb ? 1.4 : 0.7)) % 1;
        const f = st.kgb ? (ph < 0.5 ? 950 : 700) : 650 + Math.sin(ph * Math.PI * 2) * 250;
        this.sir.frequency.setTargetAtTime(f, t, 0.02);
      }
      this.sirG.gain.setTargetAtTime(0.07 * sv, t, 0.1);
      this.music(st.station || 0, st.inCar && !st.boat);
    }

    music(stationIdx, on) {
      const c = this.ctx;
      const st = G.RADIO[stationIdx];
      if (!on || !st || st.id === 'off') { this.nextNote = 0; return; }
      if (this.curStation !== stationIdx) { this.curStation = stationIdx; this.step = 0; this.nextNote = 0; this.rng = new G.RNG(st.seed); this.makeSong(st); }
      const spb = 60 / st.bpm / 4;
      if (this.nextNote < c.currentTime) this.nextNote = c.currentTime + 0.05;
      while (this.nextNote < c.currentTime + 0.2) {
        this.playStep(st, this.step, this.nextNote, spb);
        this.nextNote += spb;
        this.step++;
      }
    }

    makeSong(st) {
      const r = this.rng;
      const scale = st.scale;
      this.lead = [];
      for (let bar = 0; bar < 4; bar++) {
        const row = [];
        for (let s = 0; s < 16; s++) row.push(r.chance(st.id === 'rock' ? 0.35 : 0.5) ? scale[r.int(0, scale.length - 1)] + (r.chance(0.3) ? 12 : 0) : null);
        this.lead.push(row);
      }
    }

    playStep(st, step, t, spb) {
      const m = this.musicBus;
      const s = step % 16, bar = Math.floor(step / 16) % 4;
      const prog = PROG[st.id] || PROG.disco;
      const chord = CHORDS[prog[bar]];
      const nf = n => 440 * Math.pow(2, (st.root + n - 57) / 12);
      if (st.id === 'mayak') {
        if (s === 0 && bar === 0) { [0, 7, 12].forEach((k, j) => this.tone(t + j * 0.25, nf(k + 12), 0.6, 'sine', 0.12, m)); }
        if (s % 4 === 0) this.tone(t, nf(chord[0] - 12), spb * 3.5, 'triangle', 0.12, m);
        if (s % 8 === 4) this.tone(t, nf(chord[1]), spb * 6, 'sine', 0.06, m);
        const n = this.lead[bar][s];
        if (n != null && s % 2 === 0) this.tone(t, nf(n + 12), spb * 1.8, 'triangle', 0.07, m);
        return;
      }
      if (s % 4 === 0) this.tone(t, 120, 0.12, 'sine', 0.35, m, 40);
      if (st.id === 'disco') {
        if (s % 4 === 2) this.noiseHit(t, 0.05, 8000, 0.5, 0.08, 'highpass', m);
        const bn = chord[0] - 12 + (s % 2 ? 12 : 0);
        this.tone(t, nf(bn), spb * 0.9, 'sawtooth', 0.07, m);
        if (s % 4 === 0) chord.forEach(k => this.tone(t, nf(k + 12), spb * 3, 'square', 0.018, m));
      } else {
        if (s % 8 === 4) this.noiseHit(t, 0.14, 1800, 0.6, 0.18, 'bandpass', m);
        if (s % 2 === 0) this.noiseHit(t, 0.03, 9000, 0.5, 0.05, 'highpass', m);
        const bn = chord[0] - 12;
        this.tone(t, nf(bn), spb * 0.95, 'sawtooth', 0.08, m);
        if (s % 8 === 0) chord.forEach(k => this.tone(t, nf(k), spb * 7, 'sawtooth', 0.02, m));
      }
      const n = this.lead[bar][s];
      if (n != null) this.tone(t, nf(n + 12), spb * 0.9, st.wave, 0.045, m);
    }
  }

  Object.assign(G, { Audio });
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
