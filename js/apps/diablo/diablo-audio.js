/**
 * Diablo 98 — Web Audio synthesizer: plucked 12-string town theme, dungeon drones, all SFX.
 * Honors the Win98 tray volume (window.soundSys) and the in-game sliders.
 */
(function (D) {
  'use strict';
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
  // Town theme: E minor arpeggios in 3/4 (MIDI notes)
  const TOWN = [[40, 52, 55, 59], [36, 52, 55, 60], [38, 50, 54, 57], [35, 50, 54, 59], [40, 52, 55, 59], [33, 52, 57, 60], [35, 51, 54, 57], [40, 52, 55, 59]];
  const PATTERN = [0, 2, 3, 1, 3, 2];

  class Audio {
    constructor() { this.ctx = null; this.musicVol = 0.45; this.sfxVol = 0.8; this.track = null; this.step = 0; this.nextTime = 0; this.timer = null; this.last = {}; }
    ensure() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return this.ctx; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      try { this.ctx = new AC(); } catch (_) { return null; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.connect(c.destination);
      this.music = c.createGain(); this.music.connect(this.master);
      this.sfx = c.createGain(); this.sfx.connect(this.master);
      // shared reverb-ish delay for music
      this.delay = c.createDelay(1); this.delay.delayTime.value = 0.33; this.fb = c.createGain(); this.fb.gain.value = 0.28;
      this.delay.connect(this.fb); this.fb.connect(this.delay); this.delay.connect(this.music);
      const len = c.sampleRate; this.noiseBuf = c.createBuffer(1, len, c.sampleRate); const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.applyVolume();
      this.timer = setInterval(() => this.schedule(), 90);
      return c;
    }
    applyVolume() {
      if (!this.ctx) return;
      this.master.gain.value = 1; this.music.gain.value = this.musicVol * 0.5; this.sfx.gain.value = this.sfxVol;
    }
    setMusic(track) {
      if (track === this.track) return; this.track = track;
      if (!this.ensure()) return;
      if (this.drone) { const g = this.drone.gain; g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5); const nodes = this.drone.nodes; setTimeout(() => nodes.forEach(n => { try { n.stop(); } catch (_) {} }), 2500); this.drone = null; }
      this.step = 0; this.nextTime = this.ctx.currentTime + 0.3;
      if (track === 'dungeon' || track === 'hell' || track === 'menu' || track === 'caves') this.startDrone(track);
    }
    startDrone(track) {
      const c = this.ctx, g = c.createGain(); g.gain.value = 0; g.connect(this.music); g.gain.setTargetAtTime(track === 'menu' ? 0.35 : 0.5, c.currentTime, 1.5);
      const base = track === 'hell' ? 41.2 : track === 'caves' ? 46.25 : track === 'menu' ? 55 : 49;
      const nodes = [];
      for (const [mul, type, v] of [[1, 'sine', 0.5], [1.5, 'sine', 0.18], [2.01, 'triangle', 0.08]]) {
        const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.value = base * mul; og.gain.value = v;
        const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07 + mul * 0.03; lg.gain.value = v * 0.5; lfo.connect(lg); lg.connect(og.gain);
        o.connect(og); og.connect(g); o.start(); lfo.start(); nodes.push(o, lfo);
      }
      const n = c.createBufferSource(); n.buffer = this.noiseBuf; n.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 300; f.Q.value = 0.7;
      const ng = c.createGain(); ng.gain.value = track === 'hell' ? 0.06 : 0.035; n.connect(f); f.connect(ng); ng.connect(g); n.start(); nodes.push(n);
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.05; lg.gain.value = 180; lfo.connect(lg); lg.connect(f.frequency); lfo.start(); nodes.push(lfo);
      this.drone = { gain: g, nodes };
    }
    schedule() {
      if (!this.ctx || !this.track) return;
      this.applyVolume();
      const c = this.ctx, ahead = c.currentTime + 0.35;
      while (this.nextTime < ahead) {
        const t = this.nextTime;
        if (this.track === 'town') {
          const bar = Math.floor(this.step / 6) % TOWN.length, chord = TOWN[bar], idx = PATTERN[this.step % 6];
          this.pluck(NOTE(chord[idx] + (idx === 0 ? 0 : 12)), t, idx === 0 ? 0.16 : 0.1);
          if (this.step % 6 === 0) this.pluck(NOTE(chord[0]), t, 0.12, 2.5);
          if (this.step % 48 === 42 && Math.random() < 0.6) this.pluck(NOTE(chord[3] + 24), t + 0.1, 0.05);
          this.nextTime += 0.24;
        } else {
          // sparse eerie bells
          if (Math.random() < (this.track === 'menu' ? 0.35 : 0.22)) {
            const scale = this.track === 'hell' ? [0, 1, 6, 7, 10] : [0, 3, 5, 7, 8, 10];
            const n = 57 + scale[Math.floor(Math.random() * scale.length)] + (Math.random() < 0.3 ? 12 : 0);
            this.bell(NOTE(n), t, this.track === 'menu' ? 0.06 : 0.04);
          }
          if (this.track === 'hell' && this.step % 4 === 0) this.drum(t, 0.12);
          this.nextTime += 1.6;
        }
        this.step++;
      }
    }
    pluck(freq, t, vol, decay = 1.6) {
      const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 2;
      f.frequency.setValueAtTime(freq * 8, t); f.frequency.exponentialRampToValueAtTime(Math.max(200, freq * 1.5), t + 0.6);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      for (const [m, dt, type] of [[1, 0, 'sawtooth'], [2.003, 0.004, 'triangle']]) { const o = c.createOscillator(); o.type = type; o.frequency.value = freq * m; o.connect(f); o.start(t + dt); o.stop(t + decay + 0.1); }
      f.connect(g); g.connect(this.music); g.connect(this.delay);
    }
    bell(freq, t, vol) {
      const c = this.ctx, g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
      for (const m of [1, 2.76, 5.4]) { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = freq * m; const og = c.createGain(); og.gain.value = 1 / m; o.connect(og); og.connect(g); o.start(t); o.stop(t + 4.1); }
      g.connect(this.music); g.connect(this.delay);
    }
    drum(t, vol) { const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(35, t + 0.3); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); o.connect(g); g.connect(this.music); o.start(t); o.stop(t + 0.45); }
    // ---- sfx primitives
    tone(freq, dur, type = 'square', vol = 0.1, end = null, delay = 0) {
      const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t); if (end) o.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + dur + 0.02);
    }
    noise(dur, vol = 0.2, freq = 1000, type = 'lowpass', end = null, delay = 0, q = 1) {
      const c = this.ctx, t = c.currentTime + delay, n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      n.buffer = this.noiseBuf; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t); if (end) f.frequency.exponentialRampToValueAtTime(Math.max(30, end), t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(f); f.connect(g); g.connect(this.sfx); n.start(t, Math.random() * 0.5); n.stop(t + dur + 0.02);
    }
    voice(pitch, dur, vol = 0.12, vowel = 700) { // growls/grunts: formant-filtered sawtooth
      const c = this.ctx, t = c.currentTime, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(pitch, t); o.frequency.linearRampToValueAtTime(pitch * 0.7, t + dur);
      f.type = 'bandpass'; f.frequency.value = vowel; f.Q.value = 4; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 23; lg.gain.value = pitch * 0.15; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur);
      o.connect(f); f.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + dur + 0.05);
    }
    play(id, e = {}) {
      if (!this.ensure()) return;
      const now = this.ctx.currentTime; if (this.last[id] && now - this.last[id] < 0.03) return; this.last[id] = now;
      switch (id) {
        case 'swing': this.noise(0.14, 0.12, 2400, 'bandpass', 700, 0, 2); break;
        case 'hit': this.noise(0.1, 0.3, 900, 'lowpass', 200); this.tone(120, 0.08, 'square', 0.08, 60); break;
        case 'arrowhit': this.noise(0.06, 0.2, 1500, 'lowpass', 300); break;
        case 'miss': break;
        case 'bow': this.tone(300, 0.08, 'triangle', 0.1, 180); this.noise(0.12, 0.08, 3000, 'highpass'); break;
        case 'block': this.tone(900, 0.12, 'square', 0.06, 700); this.noise(0.1, 0.15, 3000, 'bandpass', 1500, 0, 5); break;
        case 'shieldhit': this.tone(600, 0.2, 'sine', 0.08, 900); break;
        case 'mdeath': {
          const look = e.look; if (e.boss === 'diablo') { this.voice(60, 2.5, 0.25, 400); this.noise(2.5, 0.2, 400, 'lowpass', 60); break; }
          if (look === 'skeleton' || look === 'king') { for (let i = 0; i < 5; i++) this.noise(0.05, 0.18, 2500 - i * 200, 'bandpass', null, i * 0.06, 6); }
          else if (look === 'bat') this.tone(1800, 0.25, 'square', 0.05, 900);
          else this.voice(look === 'fallen' ? 260 : look === 'zombie' ? 90 : 140, 0.5, 0.12, look === 'fallen' ? 1100 : 600);
          break;
        }
        case 'mattack': if (Math.random() < 0.35) this.voice(e.look === 'fallen' ? 300 : 110, 0.2, 0.06, 800); break;
        case 'herohurt': this.voice(e.cls === 'sorcerer' ? 150 : e.cls === 'rogue' ? 330 : 120, 0.25, 0.1, 900); break;
        case 'herodeath': this.voice(e.cls === 'rogue' ? 300 : 110, 1.4, 0.18, 700); break;
        case 'gold': for (let i = 0; i < 3; i++) this.tone(2200 + i * 300, 0.07, 'triangle', 0.05, null, i * 0.04); break;
        case 'golddrop': for (let i = 0; i < 4; i++) this.tone(1800 + Math.random() * 900, 0.06, 'triangle', 0.04, null, i * 0.05); break;
        case 'itemdrop': this.noise(0.1, 0.15, 700, 'lowpass', 150); this.tone(200, 0.1, 'triangle', 0.06, 90); break;
        case 'pickup': case 'place': this.noise(0.05, 0.1, 1800, 'bandpass'); this.tone(500, 0.04, 'triangle', 0.05, 300); break;
        case 'equip': this.noise(0.12, 0.14, 1200, 'bandpass', 600, 0, 3); this.tone(700, 0.06, 'square', 0.03, 400); break;
        case 'cant': this.tone(180, 0.18, 'square', 0.06, 140); break;
        case 'nomana': this.tone(220, 0.25, 'sawtooth', 0.05, 110); break;
        case 'drink': for (let i = 0; i < 4; i++) this.tone(400 + i * 60, 0.08, 'sine', 0.07, 250, i * 0.09); break;
        case 'learn': this.tone(660, 0.3, 'sine', 0.07); this.tone(990, 0.3, 'sine', 0.05, null, 0.1); this.tone(1320, 0.4, 'sine', 0.04, null, 0.2); break;
        case 'repair': for (let i = 0; i < 3; i++) this.tone(1500, 0.08, 'square', 0.05, 900, i * 0.15); break;
        case 'break': this.noise(0.3, 0.25, 3000, 'bandpass', 500, 0, 3); break;
        case 'door': this.tone(90, 0.4, 'sawtooth', 0.05, 70); this.noise(0.4, 0.08, 500, 'lowpass'); break;
        case 'stairs': for (let i = 0; i < 4; i++) this.noise(0.08, 0.12, 400, 'lowpass', 100, i * 0.12); break;
        case 'barrel': this.noise(0.25, 0.3, 900, 'lowpass', 120); this.tone(110, 0.2, 'triangle', 0.1, 50); break;
        case 'chest': this.tone(140, 0.35, 'sawtooth', 0.05, 90); this.noise(0.3, 0.08, 700, 'lowpass'); break;
        case 'stone': this.noise(0.6, 0.18, 400, 'lowpass', 80); break;
        case 'shrine': case 'quest': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.6, 'sine', 0.06, null, i * 0.12)); break;
        case 'portal': this.tone(200, 0.9, 'sine', 0.08, 800); this.noise(0.9, 0.08, 400, 'bandpass', 3000, 0, 4); break;
        case 'cast': this.noise(0.25, 0.08, 600, 'bandpass', 2400, 0, 5); break;
        case 'firecast': this.noise(0.5, 0.2, 400, 'lowpass', 2000); break;
        case 'lightning': this.noise(0.35, 0.25, 4000, 'highpass', 1500); this.tone(80, 0.3, 'sawtooth', 0.06, 40); break;
        case 'heal': [440, 554, 659].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.06, null, i * 0.08)); break;
        case 'flash': case 'nova': this.noise(0.6, 0.25, 3000, 'bandpass', 300, 0, 2); this.tone(1200, 0.5, 'sine', 0.06, 200); break;
        case 'manashield': this.tone(300, 0.6, 'sine', 0.08, 600); break;
        case 'teleport': this.tone(1500, 0.3, 'sine', 0.06, 300); this.tone(300, 0.3, 'sine', 0.06, 1500); break;
        case 'explode': this.noise(0.6, 0.35, 1200, 'lowpass', 80); this.tone(70, 0.4, 'sine', 0.2, 30); break;
        case 'apocalypse': this.noise(1.2, 0.3, 200, 'lowpass', 2000); this.voice(55, 1, 0.15, 300); break;
        case 'bark': if (e.boss === 'butcher') this.voice(90, 1.2, 0.2, 600); else if (e.boss === 'diablo') this.voice(50, 2, 0.25, 350); else this.voice(110, 1.2, 0.15, 500); break;
        case 'summon': this.noise(0.8, 0.15, 200, 'lowpass', 900); break;
        case 'charge': this.voice(80, 0.6, 0.15, 500); break;
        case 'talk': this.tone(700, 0.05, 'triangle', 0.03); break;
        case 'levelup': [392, 494, 587, 784, 988].forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.07, null, i * 0.09)); break;
        case 'click': this.tone(1100, 0.03, 'square', 0.03); break;
        case 'itemgold': break;
      }
    }
    destroy() { clearInterval(this.timer); this.timer = null; try { this.ctx && this.ctx.close(); } catch (_) {} this.ctx = null; }
  }
  D.Audio = Audio;
})(globalThis.Diablo98 = globalThis.Diablo98 || {});
