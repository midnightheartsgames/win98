(function (K) {
  'use strict';

  const BELLS = {
    plate: [[520, 0.5], [1180, 0.42], [1850, 0.3], [2660, 0.2]],
    iron: [[330, 0.35], [720, 0.28], [1310, 0.18]],
    steel: [[1250, 0.45], [2380, 0.36], [3570, 0.24], [4400, 0.16]],
    parry: [[1480, 0.7], [2960, 0.55], [4120, 0.4]]
  };

  const THEMES = Object.freeze({
    forest: { bpm: 84, voices: [
      { inst: 'pipe', gain: 0.11, seq: 'D5:2 E5 F5 G5:2 A5:2 G5 F5 E5:2 D5:4 - C5 D5 E5:2 F5 E5 D5 C5 A4:4 -:2 D5:2 F5 G5 A5:3 G5 F5 E5:2 D5:6 -:2' },
      { inst: 'drone', gain: 0.05, seq: 'D3:16 A2:16 D3:16' }
    ] },
    palace: { bpm: 96, voices: [
      { inst: 'brass', gain: 0.1, seq: 'C4:2 C4 G4:3 - G4 C5:2 B4 A4 G4:4 E4:2 F4 G4:2 A4 G4 E4 C4:4 G4:2 C5:6 -:2' },
      { inst: 'brass', gain: 0.06, seq: 'E3:2 E3 C4:3 - C4 E4:2 D4 C4 B3:4 C3:2 D3 E3:2 F3 E3 C3 A2:4 B2:2 E3:6 -:2' },
      { inst: 'drum', gain: 0.14, seq: 'K:4 -:4 K:2 K:2 -:4 K:4 -:4 K:2 K:2 -:4 K:8' }
    ] },
    fort: { bpm: 72, voices: [
      { inst: 'drum', gain: 0.2, seq: 'K - - K T - K - K - - K T - T T K - - K T - K - K - - K T T T T' },
      { inst: 'bass', gain: 0.1, seq: 'A2:4 A2:2 C3:2 G2:4 E2:4 A2:4 A2:2 C3:2 D3:4 E2:4' }
    ] },
    town: { bpm: 112, voices: [
      { inst: 'fiddle', gain: 0.085, seq: 'G4 B4 D5 B4 C5 A4 F#4 A4 G4 B4 D5 G5 F#5:2 D5:2 E5 C5 A4 C5 D5 B4 G4 B4 A4 F#4 D4 F#4 G4:4' },
      { inst: 'pluck', gain: 0.09, seq: 'G3:2 D3:2 G3:2 D3:2 C3:2 G2:2 D3:2 A2:2 C3:2 G2:2 G3:2 D3:2 D3:2 A2:2 G2:4' }
    ] },
    alarm: { bpm: 138, voices: [
      { inst: 'drum', gain: 0.2, seq: 'K T K T K K T - K T K T K K T T K T K T K K T - K T T K T T K K' },
      { inst: 'lead', gain: 0.07, seq: 'A3 C4 E4 C4 A3 C4 F4 E4 A3 C4 E4 C4 G3 B3 D4 B3 A3 C4 E4 C4 A3 C4 F4 E4 D4 F4 A4 F4 E4:4' }
    ] }
  });
  const LEAD = Object.freeze({ elf: 'pipe', guard: 'brass', villain: 'bass', town: 'fiddle' });
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const freqOf = n => { const m = /^([A-G])(#|b)?(\d)$/.exec(n); if (!m) return 0; const midi = 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return 440 * Math.pow(2, (midi - 69) / 12); };
  const parse = seq => seq.split(/\s+/).filter(Boolean).map(tok => { const [n, l] = tok.split(':'); return { n, len: +(l || 1) }; });
  const lengthOf = theme => Math.max(...theme.voices.map(v => parse(v.seq).reduce((s, x) => s + x.len, 0))) * 30 / theme.bpm;

  class Sound {
    constructor() {
      this.ctx = null;
      this.noise = null;
      this.master = null;
      this.volume = 0.8;
      this.musicVolume = 0.6;
      this.beds = {};
      this.song = null;
    }

    wake() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return true;
      }
      const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Ctx) return false;
      try { this.ctx = new Ctx(); } catch (e) { return false; }
      const ctx = this.ctx, len = ctx.sampleRate, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0), r = K.rng(31);
      for (let i = 0; i < len; i++) d[i] = r() * 2 - 1;
      this.noise = buf;
      this.master = ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(ctx.destination);
      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = this.musicVolume;
      this.musicBus.connect(ctx.destination);
      return true;
    }

    bus(at, ear, far) {
      const ctx = this.ctx, g = ctx.createGain(), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      let level = 1, side = 0;
      if (at && ear) {
        const dx = at[0] - ear.eye[0], dy = at[1] - ear.eye[1], dz = at[2] - ear.eye[2], d = Math.hypot(dx, dy, dz);
        level = far ? Math.pow(Math.max(0, 1 - d / far), 1.6) : 1 / (1 + d * d / 30);
        side = d > 0.2 ? K.clamp((dx * ear.right[0] + dz * ear.right[2]) / d, -1, 1) * 0.8 : 0;
      }
      g.gain.value = level;
      if (pan) { pan.pan.value = side; g.connect(pan); pan.connect(this.master); } else g.connect(this.master);
      return g;
    }

    burst(out, t, dur, amp, type, f0, f1, q) {
      const ctx = this.ctx, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = this.noise;
      src.loop = dur > 0.4;
      f.type = type;
      f.frequency.setValueAtTime(f0, t);
      if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      f.Q.value = q || 0.8;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + Math.min(0.012, dur * 0.2));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(out);
      src.start(t, Math.random() * 0.5);
      src.stop(t + dur + 0.05);
    }

    tone(out, t, freq, dur, amp, kind) {
      const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = kind || 'sine';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    }

    glide(out, t, f0, f1, dur, amp, kind, band) {
      const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = kind || 'sine';
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + Math.min(0.05, dur * 0.25));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      if (band) { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = band; f.Q.value = 1.5; g.connect(f); f.connect(out); } else g.connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    }

    play(kind, opts) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const o = opts || {}, out = this.bus(o.at, o.ear, o.far), t = this.ctx.currentTime + 0.005, p = K.clamp(o.power || 1, 0.3, 1.4);
      if (kind === 'whoosh') this.burst(out, t, 0.2 * p, 0.16 * p, 'bandpass', 380, 1500, 1.4);
      else if (kind === 'flesh') { this.burst(out, t, 0.13, 0.55 * p, 'lowpass', 900, 300); this.tone(out, t, 85, 0.16, 0.45 * p); }
      else if (kind === 'mail') { this.burst(out, t, 0.1, 0.3 * p, 'lowpass', 800, 300); for (let i = 0; i < 3; i++) this.burst(out, t + i * 0.035, 0.07, 0.18 * p, 'highpass', 3500, 0, 0.7); }
      else if (kind === 'wood') { this.burst(out, t, 0.09, 0.55 * p, 'bandpass', 720, 0, 3); this.tone(out, t, 180, 0.1, 0.35 * p); }
      else if (kind === 'straw') this.burst(out, t, 0.14, 0.35 * p, 'lowpass', 1800, 600);
      else if (kind === 'kick') { this.tone(out, t, 62, 0.14, 0.6 * p); this.burst(out, t, 0.08, 0.35 * p, 'lowpass', 320, 0); }
      else if (kind === 'growl') { this.burst(out, t, 0.55, 0.3 * p, 'lowpass', 420, 160, 2); this.tone(out, t, 88, 0.5, 0.16 * p, 'sawtooth'); this.tone(out, t + 0.05, 93, 0.42, 0.1 * p, 'sawtooth'); }
      else if (kind === 'bark') { for (const d of [0, 0.19]) { this.burst(out, t + d, 0.09, 0.5 * p, 'bandpass', 900, 500, 2.5); this.tone(out, t + d, 380, 0.08, 0.18 * p, 'square'); } }
      else if (kind === 'cut') { this.burst(out, t, 0.22, 0.5 * p, 'lowpass', 1300, 260); this.burst(out, t + 0.02, 0.16, 0.25 * p, 'bandpass', 420, 0, 4); }
      else if (kind === 'jingle') { for (let i = 0; i < 4; i++) { const d = i * 0.06 + Math.random() * 0.04, f = [2350, 2780, 3130, 2590][i]; this.tone(out, t + d, f, 0.32, 0.07 * p, 'sine'); this.tone(out, t + d, f * 2.7, 0.12, 0.025 * p, 'sine'); } }
      else if (kind === 'bell') { for (const [f, dur, a] of [[196, 4.5, 0.32], [392, 3.2, 0.18], [470, 2.6, 0.12], [588, 2.2, 0.1], [784, 1.4, 0.06]]) this.tone(out, t, f, dur, a * p, 'sine'); }
      else if (kind === 'crack') { this.burst(out, t, 0.5, 0.45 * p, 'bandpass', 900, 200, 1.2); this.burst(out, t + 0.45, 0.8, 0.7 * p, 'lowpass', 500, 80, 0.7); this.tone(out, t + 0.5, 48, 0.6, 0.5 * p); }
      else if (kind === 'horn') { for (const [d, f, dur] of [[0, 147, 1.1], [1.25, 147, 0.5], [1.85, 196, 1.6]]) { this.tone(out, t + d, f, dur, 0.22 * p, 'sawtooth'); this.tone(out, t + d, f * 2, dur * 0.8, 0.07 * p, 'triangle'); } }
      else if (kind === 'fire') { this.burst(out, t, 0.9, 0.18 * p, 'lowpass', 700, 200, 0.8); for (let i = 0; i < 4; i++) this.burst(out, t + Math.random() * 0.8, 0.03, 0.25 * p, 'highpass', 2600, 0); }
      else if (kind === 'splash') { this.burst(out, t, 0.35, 0.4 * p, 'bandpass', 1200, 500, 0.8); this.burst(out, t + 0.05, 0.25, 0.25 * p, 'lowpass', 600, 200); }
      else if (kind === 'thunder') {
        if (o.near) this.burst(out, t, 0.35, 0.8 * p, 'highpass', 1800, 400, 0.6);
        this.burst(out, t + (o.near ? 0.05 : 0), 3.2 * Math.min(1, p), 0.7 * p, 'lowpass', o.near ? 600 : 260, 60, 0.6);
        this.burst(out, t + 0.6, 2.4, 0.45 * p, 'lowpass', 180, 45, 0.8);
        this.tone(out, t + 0.1, 38, 2.2, 0.35 * p);
      }
      else if (kind === 'step') {
        const s = o.surface;
        if (s === 'water') this.burst(out, t, 0.12, 0.22 * p, 'bandpass', 900, 400, 1.2);
        else if (s === 'stone') { this.burst(out, t, 0.04, 0.16 * p, 'bandpass', 2200, 0, 2); this.burst(out, t + 0.01, 0.05, 0.08 * p, 'lowpass', 500, 0); }
        else if (s === 'wood') { this.burst(out, t, 0.05, 0.16 * p, 'bandpass', 700, 0, 3); this.tone(out, t, 160, 0.06, 0.08 * p); }
        else if (s === 'snow') this.burst(out, t, 0.14, 0.12 * p, 'highpass', 2500, 1500, 0.8);
        else this.burst(out, t, 0.07, 0.14 * p, 'lowpass', 520, 240, 0.9);
        if (o.leg === 'peg') { this.tone(out, t, 330, 0.05, 0.12 * p, 'triangle'); this.burst(out, t, 0.03, 0.12 * p, 'bandpass', 1200, 0, 4); }
        if (o.leg === 'iron') { this.tone(out, t, 1850, 0.25, 0.05 * p); this.tone(out, t, 2710, 0.18, 0.035 * p); }
      }
      else if (kind === 'creak') this.glide(out, t, 290, 230, 0.35, 0.05 * p, 'sawtooth', 900);
      else if (kind === 'tap') this.burst(out, t, 0.03, 0.14 * p, 'bandpass', 1500, 0, 3);
      else if (kind === 'caw') { for (let i = 0; i < (o.n || 2); i++) this.glide(out, t + i * 0.32, 720, 520, 0.22, 0.12 * p, 'sawtooth', 1100); }
      else if (kind === 'howl') { this.glide(out, t, 380, 640, 0.8, 0.1 * p); this.glide(out, t + 0.8, 640, 470, 1.6, 0.1 * p); if (o.n > 1) { this.glide(out, t + 0.5, 430, 700, 0.9, 0.07 * p); this.glide(out, t + 1.4, 700, 520, 1.3, 0.07 * p); } }
      else if (kind === 'roar') { this.burst(out, t, 1.2, 0.5 * p, 'lowpass', 420, 160, 1.5); this.glide(out, t, 110, 70, 1.1, 0.22 * p, 'sawtooth'); }
      else if (kind === 'grunt') { for (let i = 0; i < 3; i++) { this.burst(out, t + i * 0.14, 0.09, 0.2 * p, 'lowpass', 300, 0, 2); this.tone(out, t + i * 0.14, 95, 0.08, 0.1 * p, 'sawtooth'); } }
      else if (kind === 'bila') { let d = 0; for (let i = 0; i < (o.n || 6); i++) { this.tone(out, t + d, 610, 0.12, 0.16 * p); this.burst(out, t + d, 0.05, 0.22 * p, 'bandpass', 900, 0, 3); d += 0.34 - i * 0.02; } }
      else if (kind === 'gong') { for (const [f, dur, a] of [[73, 6, 0.32], [118, 5, 0.2], [167, 4.5, 0.14], [229, 3.5, 0.1], [301, 3, 0.07]]) this.tone(out, t, f, dur, a * p); this.burst(out, t, 0.3, 0.3 * p, 'lowpass', 300, 0); }
      else if (kind === 'chirp') { const n = 2 + Math.floor(Math.random() * 3), f = 2800 + Math.random() * 1600; for (let i = 0; i < n; i++) this.glide(out, t + i * 0.09, f, f * 1.3, 0.06, 0.035 * p); }
      else if (kind === 'cricket') { for (let i = 0; i < 6; i++) this.tone(out, t + i * 0.045, 4400, 0.02, 0.02 * p); }
      else if (kind === 'clink') { this.tone(out, t, 2400, 0.12, 0.05 * p); this.tone(out, t + 0.01, 3500, 0.08, 0.03 * p); }
      else if (kind === 'chop') { this.burst(out, t, 0.08, 0.5 * p, 'bandpass', 1300, 0, 4); this.tone(out, t, 220, 0.07, 0.3 * p); }
      else if (BELLS[kind]) {
        for (const [f, dur] of BELLS[kind]) this.tone(out, t, f * (0.98 + Math.random() * 0.04), dur, 0.12 * p, 'sine');
        this.burst(out, t, 0.04, 0.25 * p, 'highpass', 2000, 0);
      }
    }

    bed(name, level, lo, hi) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const ctx = this.ctx, want = K.clamp(level || 0, 0, 1);
      let B = this.beds[name];
      if (!B) {
        if (want < 0.002) return;
        const src = ctx.createBufferSource(), a = ctx.createBiquadFilter(), b = ctx.createBiquadFilter(), g = ctx.createGain();
        src.buffer = this.noise;
        src.loop = true;
        a.type = 'highpass';
        a.frequency.value = lo;
        b.type = 'lowpass';
        b.frequency.value = hi;
        g.gain.value = 0;
        src.connect(a);
        a.connect(b);
        b.connect(g);
        g.connect(this.master);
        src.start(0, Math.random());
        B = this.beds[name] = { g, level: 0 };
      }
      if (Math.abs(B.level - want) < 0.002) return;
      B.level = want;
      B.g.gain.setTargetAtTime(want, ctx.currentTime, 0.8);
    }

    rain(level) {
      this.bed('rain', K.clamp(level || 0, 0, 1) * 0.22, 900, 5200);
    }

    ambience(a) {
      this.bed('wind', a.wind * 0.07, 120, 700);
      this.bed('leaves', a.forest * 0.035, 1800, 6000);
      this.bed('market', a.market * 0.05, 300, 1400);
    }

    note(out, t, inst, f, dur, amp) {
      const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain(), flt = ctx.createBiquadFilter();
      o.type = inst === 'brass' || inst === 'fiddle' || inst === 'bass' ? 'sawtooth' : inst === 'pipe' || inst === 'pluck' ? 'triangle' : inst === 'lead' ? 'square' : 'sine';
      o.frequency.setValueAtTime(f, t);
      if (inst === 'fiddle' || inst === 'pipe') { const lfo = ctx.createOscillator(), depth = ctx.createGain(); lfo.frequency.value = inst === 'fiddle' ? 5.6 : 4.8; depth.gain.value = f * 0.006; lfo.connect(depth); depth.connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.1); }
      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(inst === 'brass' ? 700 : inst === 'bass' ? 500 : inst === 'lead' ? 1400 : 3200, t);
      if (inst === 'brass') flt.frequency.linearRampToValueAtTime(2200, t + 0.08);
      const att = inst === 'pluck' ? 0.005 : inst === 'drone' ? 0.4 : 0.03, rel = inst === 'pluck' ? dur * 0.9 : Math.min(0.15, dur * 0.3);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + att);
      if (inst === 'pluck') g.gain.exponentialRampToValueAtTime(0.0001, t + rel);
      else { g.gain.setValueAtTime(amp, t + Math.max(att, dur - rel)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
      o.connect(flt);
      flt.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    }

    hit(out, t, n, amp) {
      if (n === 'K') this.glide(out, t, 110, 45, 0.25, amp);
      else if (n === 'T') this.glide(out, t, 180, 110, 0.2, amp * 0.7);
      else if (n === 'S') this.burst(out, t, 0.12, amp * 0.5, 'highpass', 1800, 0);
    }

    music(name, side) {
      if (!this.ctx || this.ctx.state !== 'running' || !THEMES[name]) return 0;
      this.stopMusic(0.4);
      const ctx = this.ctx, theme = THEMES[name], out = ctx.createGain(), step = 30 / theme.bpm, t0 = ctx.currentTime + 0.1;
      out.gain.value = 1;
      out.connect(this.musicBus);
      for (const v of theme.voices) {
        const inst = name === 'alarm' && v.inst === 'lead' ? LEAD[side] || 'lead' : v.inst;
        let t = t0;
        for (const x of parse(v.seq)) {
          const dur = x.len * step;
          if (x.n !== '-') { if (inst === 'drum') this.hit(out, t, x.n, v.gain); else { const f = freqOf(x.n); if (f) this.note(out, t, inst, f, dur * 0.95, v.gain); } }
          t += dur;
        }
      }
      const len = lengthOf(theme);
      this.song = { name, out, end: t0 + len };
      return len;
    }

    stopMusic(fade) {
      if (!this.song || !this.ctx) return;
      const S = this.song, f = fade || 0.6;
      S.out.gain.setTargetAtTime(0.0001, this.ctx.currentTime, f);
      setTimeout(() => { try { S.out.disconnect(); } catch (e) { } }, (f * 5 + 0.2) * 1000);
      this.song = null;
    }

    playing() {
      return !!(this.song && this.ctx && this.ctx.currentTime < this.song.end);
    }

    destroy() {
      if (this.ctx) { try { this.ctx.close(); } catch (e) { } }
      this.ctx = null;
      this.beds = {};
      this.song = null;
    }
  }

  K.Sound = Sound;
  Object.assign(K.Sound, { THEMES, LEAD, parse, freqOf, lengthOf });
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
