(function (T) {
  'use strict';
  const { RNG, clamp } = T;

  const SCALES = {
    minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phryg: [0, 1, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11],
    penta: [0, 3, 5, 7, 10], hira: [0, 2, 3, 7, 8], harm: [0, 2, 3, 5, 7, 8, 11], mixo: [0, 2, 4, 5, 7, 9, 10], blues: [0, 3, 5, 6, 7, 10]
  };

  const DRUMS = {
    four: { k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '..............x.' },
    break: { k: 'x.....x...x.....', s: '....x.......x..x', h: 'xxxxxxxxxxxxxxxx', o: '' },
    rock: { k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '' },
    shuffle: { k: 'x.....x.x.....x.', s: '....x.......x...', h: 'x..x..x..x..x..x', o: '' },
    taiko: { k: 'x..x..x.x..x..x.', s: '........x.......', h: '', o: '', t: 'x...x.x.x...x.xx' },
    samba: { k: 'x..x..x.x..x..x.', s: '..x...x...x..x..', h: 'xxxxxxxxxxxxxxxx', o: '' },
    half: { k: 'x.........x.....', s: '........x.......', h: 'x...x...x...x...', o: '' },
    march: { k: 'x...x...x...x...', s: '..x...x...x.xxxx', h: '', o: '' },
    none: { k: '', s: '', h: '', o: '' }
  };

  const TRACKS = {
    title: { bpm: 128, root: 45, scale: 'minor', prog: [0, 5, 3, 4], drums: 'four', lead: 'saw', bass: 'octave', pad: true, seed: 11 },
    select: { bpm: 132, root: 47, scale: 'dorian', prog: [0, 3, 0, 4], drums: 'break', lead: 'square', bass: 'walk', arp: true, seed: 12 },
    kenta: { bpm: 140, root: 45, scale: 'minor', prog: [0, 5, 6, 4], drums: 'four', lead: 'saw', bass: 'octave', arp: true, seed: 21 },
    ray: { bpm: 118, root: 40, scale: 'blues', prog: [0, 0, 3, 4], drums: 'rock', lead: 'dist', bass: 'rock', seed: 22 },
    yalan: { bpm: 126, root: 50, scale: 'penta', prog: [0, 3, 4, 0], drums: 'break', lead: 'pluck', bass: 'walk', arp: true, seed: 23 },
    rafael: { bpm: 104, root: 43, scale: 'mixo', prog: [0, 4, 3, 0], drums: 'samba', lead: 'pluck', bass: 'walk', seed: 24 },
    volkov: { bpm: 112, root: 38, scale: 'harm', prog: [0, 3, 4, 0], drums: 'march', lead: 'brass', bass: 'octave', pad: true, seed: 25 },
    minjun: { bpm: 150, root: 48, scale: 'minor', prog: [0, 6, 5, 4], drums: 'break', lead: 'square', bass: 'octave', arp: true, seed: 26 },
    irina: { bpm: 124, root: 44, scale: 'phryg', prog: [0, 1, 0, 6], drums: 'four', lead: 'saw', bass: 'octave', pad: true, seed: 27 },
    kagemaru: { bpm: 96, root: 45, scale: 'hira', prog: [0, 1, 0, 3], drums: 'taiko', lead: 'pluck', bass: 'drone', seed: 28 },
    tony: { bpm: 136, root: 46, scale: 'dorian', prog: [0, 3, 4, 3], drums: 'break', lead: 'square', bass: 'walk', seed: 29 },
    somsak: { bpm: 144, root: 47, scale: 'phryg', prog: [0, 1, 0, 1], drums: 'taiko', lead: 'reed', bass: 'drone', seed: 30 },
    potapych: { bpm: 120, root: 43, scale: 'major', prog: [0, 3, 4, 0], drums: 'march', lead: 'brass', bass: 'oompah', seed: 31 },
    liu: { bpm: 92, root: 50, scale: 'penta', prog: [0, 2, 3, 0], drums: 'shuffle', lead: 'pluck', bass: 'walk', seed: 32 },
    strazh: { bpm: 130, root: 38, scale: 'phryg', prog: [0, 0, 1, 0], drums: 'four', lead: 'square', bass: 'octave', seed: 33 },
    churban: { bpm: 110, root: 45, scale: 'hira', prog: [0, 3, 1, 0], drums: 'taiko', lead: 'pluck', bass: 'drone', seed: 34 },
    genzo: { bpm: 138, root: 41, scale: 'harm', prog: [0, 5, 1, 4], drums: 'rock', lead: 'brass', bass: 'octave', pad: true, seed: 35 },
    colossus: { bpm: 100, root: 36, scale: 'phryg', prog: [0, 1, 5, 1], drums: 'half', lead: 'brass', bass: 'drone', pad: true, seed: 36 },
    colossus2: { bpm: 156, root: 38, scale: 'harm', prog: [0, 1, 5, 4], drums: 'break', lead: 'dist', bass: 'octave', pad: true, seed: 37 },
    practice: { bpm: 110, root: 48, scale: 'dorian', prog: [0, 3], drums: 'half', lead: 'none', bass: 'walk', seed: 38 },
    force: { bpm: 142, root: 43, scale: 'minor', prog: [0, 6, 3, 4], drums: 'rock', lead: 'dist', bass: 'rock', seed: 39 },
    ball: { bpm: 120, root: 48, scale: 'major', prog: [0, 4, 5, 3], drums: 'samba', lead: 'pluck', bass: 'walk', seed: 40 },
    ending: { bpm: 84, root: 48, scale: 'major', prog: [0, 5, 3, 4], drums: 'none', lead: 'pluck', bass: 'drone', pad: true, seed: 41 },
    credits: { bpm: 112, root: 45, scale: 'minor', prog: [0, 5, 3, 4], drums: 'half', lead: 'saw', bass: 'octave', pad: true, seed: 42 },
    theater: { bpm: 90, root: 45, scale: 'dorian', prog: [0, 3, 0, 4], drums: 'none', lead: 'pluck', bass: 'drone', pad: true, seed: 43 }
  };

  const VOW = { a: [800, 1200], o: [500, 850], e: [450, 1900], u: [350, 800], i: [320, 2300], y: [380, 1700] };

  class Audio {
    constructor() {
      this.ctx = null;
      this.vol = { sfx: 0.8, music: 0.45, voice: 0.8 };
      this.track = null; this.nextT = 0; this.step = 0; this.bar = 0;
      this.announcer = true;
      this.speechOk = typeof window !== 'undefined' && 'speechSynthesis' in window;
      this.lastSay = 0;
    }

    init() {
      if (this.ctx) return true;
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return false;
      try { this.ctx = new AC(); } catch (e) { return false; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = 0.9;
      this.comp = c.createDynamicsCompressor(); this.comp.threshold.value = -14; this.comp.ratio.value = 4;
      this.master.connect(this.comp); this.comp.connect(c.destination);
      this.sfx = c.createGain(); this.sfx.gain.value = this.vol.sfx; this.sfx.connect(this.master);
      this.mus = c.createGain(); this.mus.gain.value = this.vol.music; this.mus.connect(this.master);
      this.vox = c.createGain(); this.vox.gain.value = this.vol.voice; this.vox.connect(this.master);
      const len = c.sampleRate * 1.5;
      this.noise = c.createBuffer(1, len, c.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.verb = c.createConvolver();
      const vl = c.sampleRate * 1.6, vb = c.createBuffer(2, vl, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const x = vb.getChannelData(ch); for (let i = 0; i < vl; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / vl, 3); }
      this.verb.buffer = vb;
      this.verbG = c.createGain(); this.verbG.gain.value = 0.25;
      this.verb.connect(this.verbG); this.verbG.connect(this.master);
      return true;
    }

    resume() { if (this.init() && this.ctx.state === 'suspended') this.ctx.resume(); }

    setVolumes(v) {
      Object.assign(this.vol, v);
      if (!this.ctx) return;
      this.sfx.gain.value = this.vol.sfx; this.mus.gain.value = this.vol.music; this.vox.gain.value = this.vol.voice;
    }

    close() {
      this.stopMusic();
      if (this.speechOk) try { window.speechSynthesis.cancel(); } catch (e) { this.speechOk = false; }
      if (this.ctx) { try { this.ctx.close(); } catch (e) { this.ctx = null; } this.ctx = null; }
    }

    env(g, t, a, peak, d, curve) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      if (curve === 'lin') g.gain.linearRampToValueAtTime(0.0001, t + a + d);
      else g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    }

    nz(t, dur, type, freq, q, peak, dest, rate, sweep) {
      const c = this.ctx;
      const s = c.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = rate || 1;
      const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q || 1;
      if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, sweep), t + dur);
      const g = c.createGain(); this.env(g, t, 0.003, peak, dur);
      s.connect(f); f.connect(g); g.connect(dest || this.sfx);
      s.start(t, Math.random()); s.stop(t + dur + 0.05);
      return g;
    }

    osc(t, type, f0, f1, dur, peak, dest, a) {
      const c = this.ctx;
      const o = c.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(f0, t);
      if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      const g = c.createGain(); this.env(g, t, a || 0.004, peak, dur);
      o.connect(g); g.connect(dest || this.sfx);
      o.start(t); o.stop(t + dur + 0.05);
      return g;
    }

    play(id, o) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + 0.005;
      const p = o || {};
      const k = p.k || 1;
      switch (id) {
        case 'hitL': this.nz(t, 0.08, 'bandpass', 1800, 1.2, 0.5 * k); this.osc(t, 'sine', 180, 70, 0.1, 0.5 * k); break;
        case 'hitM': this.nz(t, 0.12, 'bandpass', 1200, 1, 0.65 * k); this.osc(t, 'sine', 140, 50, 0.16, 0.7 * k); this.nz(t, 0.05, 'highpass', 4000, 1, 0.2 * k); break;
        case 'hitH': this.nz(t, 0.22, 'lowpass', 2200, 0.8, 0.8 * k, null, 0.7, 400); this.osc(t, 'sine', 110, 38, 0.3, 0.9 * k); this.osc(t, 'triangle', 60, 30, 0.35, 0.5 * k); { const g = this.nz(t, 0.3, 'lowpass', 900, 1, 0.3 * k); g.connect(this.verb); } break;
        case 'hitCH': this.play('hitH', { k }); this.osc(t, 'square', 1400, 700, 0.12, 0.12 * k); this.nz(t, 0.1, 'highpass', 5000, 1, 0.3 * k); break;
        case 'block': this.nz(t, 0.06, 'bandpass', 2600, 3, 0.45 * k); this.osc(t, 'square', 520, 300, 0.05, 0.12 * k); break;
        case 'whoosh': this.nz(t, p.d || 0.16, 'bandpass', p.f || 900, 2.2, 0.16 * k, null, 1, (p.f || 900) * 2.6); break;
        case 'sword': this.nz(t, 0.14, 'bandpass', 3000, 4, 0.22 * k, null, 1, 7000); this.osc(t + 0.02, 'sine', 2800, 2400, 0.3, 0.05 * k); break;
        case 'grab': this.nz(t, 0.1, 'bandpass', 700, 1.4, 0.35); break;
        case 'slam': this.nz(t, 0.35, 'lowpass', 600, 0.8, 0.9, null, 0.5); this.osc(t, 'sine', 90, 30, 0.45, 0.9); { const g = this.nz(t, 0.4, 'lowpass', 500, 1, 0.4); g.connect(this.verb); } break;
        case 'thud': this.nz(t, 0.2, 'lowpass', 500, 0.8, 0.55 * k, null, 0.6); this.osc(t, 'sine', 80, 40, 0.22, 0.6 * k); break;
        case 'land': this.nz(t, 0.08, 'lowpass', 700, 0.8, 0.25); break;
        case 'step': this.nz(t, 0.04, 'lowpass', 900, 0.8, 0.08); break;
        case 'tech': this.nz(t, 0.12, 'bandpass', 900, 1, 0.3); this.osc(t, 'triangle', 300, 600, 0.1, 0.1); break;
        case 'parry': this.osc(t, 'square', 880, 880, 0.25, 0.14); this.osc(t, 'sine', 1760, 1700, 0.4, 0.12); this.nz(t, 0.08, 'highpass', 4000, 1, 0.3); break;
        case 'ko': this.play('hitH', { k: 1.3 }); { const g = this.osc(t, 'sine', 70, 28, 1.2, 0.6); g.connect(this.verb); } break;
        case 'fire': this.nz(t, 0.25, 'bandpass', 700, 0.7, 0.28 * k, null, 0.8, 1600); break;
        case 'steam': this.nz(t, 0.5, 'highpass', 2500, 0.5, 0.35, null, 1, 5000); break;
        case 'rocket': this.nz(t, 0.35, 'bandpass', 500, 1, 0.45, null, 0.7, 2500); this.osc(t, 'sawtooth', 90, 300, 0.3, 0.12); break;
        case 'quake': this.osc(t, 'sine', 45, 25, 0.9, 0.8); this.nz(t, 0.8, 'lowpass', 300, 0.7, 0.6, null, 0.4); break;
        case 'charge': this.osc(t, 'sawtooth', 110, 880, 0.6, 0.1); this.osc(t, 'sine', 220, 1760, 0.6, 0.08); break;
        case 'heal': [0, 0.08, 0.16].forEach((d, i) => this.osc(t + d, 'sine', 660 * (1 + i * 0.25), 0, 0.3, 0.12)); break;
        case 'buff': this.osc(t, 'square', 220, 440, 0.25, 0.1); this.osc(t + 0.1, 'square', 330, 660, 0.3, 0.1); break;
        case 'tele': this.nz(t, 0.3, 'bandpass', 1500, 6, 0.3, null, 1, 300); this.osc(t, 'sine', 1200, 200, 0.3, 0.08); break;
        case 'break': this.nz(t, 0.1, 'bandpass', 1600, 2, 0.4); this.osc(t, 'square', 700, 350, 0.12, 0.12); break;
        case 'menu': this.osc(t, 'square', 880, 880, 0.04, 0.06); break;
        case 'ok': this.osc(t, 'square', 660, 660, 0.06, 0.07); this.osc(t + 0.06, 'square', 990, 990, 0.1, 0.07); break;
        case 'back': this.osc(t, 'square', 440, 330, 0.1, 0.07); break;
        case 'deny': this.osc(t, 'square', 180, 150, 0.18, 0.08); break;
        case 'gong': { const g = this.osc(t, 'sine', 110, 104, 2.4, 0.5, null, 0.01); g.connect(this.verb); this.osc(t, 'sine', 293, 290, 1.8, 0.18); this.osc(t, 'sine', 523, 520, 1.2, 0.1); this.nz(t, 0.08, 'lowpass', 1500, 1, 0.3); break; }
        case 'coin': this.osc(t, 'square', 988, 988, 0.08, 0.08); this.osc(t + 0.08, 'square', 1319, 1319, 0.25, 0.08); break;
        case 'unlock': [0, 0.12, 0.24, 0.36].forEach((d, i) => this.osc(t + d, 'square', [523, 659, 784, 1047][i], 0, 0.22, 0.08)); break;
        case 'tick': this.osc(t, 'square', 1200, 1200, 0.03, 0.05); break;
      }
    }

    voice(v, kind) {
      if (!this.ctx || !v) return;
      const c = this.ctx;
      const t = c.currentTime + 0.01;
      const vk = v.kind || 'm';
      const base = { m: 125, f: 235, old: 140, bear: 70, robot: 110, boss: 55, wood: 180 }[vk] || 125;
      const f0 = base * (v.pitch || 1) / ({ m: 1, f: 1.6, old: 0.95, bear: 0.55, robot: 0.7, boss: 0.45, wood: 0.6 }[vk] || 1) * (0.94 + Math.random() * 0.12);
      const shapes = {
        atk: { vow: Math.random() < 0.5 ? 'a' : 'e', dur: 0.14, up: 1.25, down: 0.85, amp: 0.5 },
        big: { vow: Math.random() < 0.5 ? 'o' : 'a', dur: 0.26, up: 1.35, down: 0.75, amp: 0.65 },
        hurt: { vow: 'u', dur: 0.18, up: 1.1, down: 0.7, amp: 0.45 },
        ko: { vow: 'a', dur: 0.8, up: 1.2, down: 0.5, amp: 0.6 },
        win: { vow: 'o', dur: 0.45, up: 1.0, down: 1.3, amp: 0.55 },
        throw: { vow: 'o', dur: 0.3, up: 1.3, down: 0.8, amp: 0.6 }
      };
      const sh = shapes[kind] || shapes.atk;
      if (vk === 'wood') { this.nz(t, 0.06, 'bandpass', 1200, 6, 0.4, this.vox); this.nz(t + 0.07, 0.05, 'bandpass', 900, 6, 0.3, this.vox); return; }
      const o = c.createOscillator(); o.type = vk === 'robot' ? 'square' : 'sawtooth';
      o.frequency.setValueAtTime(f0 * sh.up, t);
      o.frequency.exponentialRampToValueAtTime(f0 * sh.down, t + sh.dur);
      if (vk === 'old' || kind === 'ko') { const lfo = c.createOscillator(); lfo.frequency.value = 7; const lg = c.createGain(); lg.gain.value = f0 * 0.05; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + sh.dur + 0.1); }
      const g = c.createGain(); this.env(g, t, 0.012, sh.amp, sh.dur, 'lin');
      const [F1, F2] = VOW[sh.vow];
      const fm = vk === 'f' ? 1.18 : vk === 'bear' || vk === 'boss' ? 0.7 : 1;
      const b1 = c.createBiquadFilter(); b1.type = 'bandpass'; b1.frequency.value = F1 * fm; b1.Q.value = 6;
      const b2 = c.createBiquadFilter(); b2.type = 'bandpass'; b2.frequency.value = F2 * fm; b2.Q.value = 8;
      const g2 = c.createGain(); g2.gain.value = 0.6;
      o.connect(b1); o.connect(b2); b1.connect(g); b2.connect(g2); g2.connect(g);
      if (vk === 'robot') { const rm = c.createGain(); const ro = c.createOscillator(); ro.frequency.value = 55; ro.connect(rm.gain); g.connect(rm); rm.connect(this.vox); ro.start(t); ro.stop(t + sh.dur + 0.1); }
      else g.connect(this.vox);
      if (vk === 'bear' || vk === 'boss') this.nz(t, sh.dur, 'lowpass', 400, 1, sh.amp * 0.5, this.vox, 0.5);
      this.nz(t, 0.05, 'highpass', 3000, 1, 0.08, this.vox);
      o.start(t); o.stop(t + sh.dur + 0.1);
    }

    say(text, rate) {
      if (!this.announcer || !this.speechOk) return;
      try {
        const s = window.speechSynthesis;
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; u.rate = rate || 0.9; u.pitch = 0.6; u.volume = Math.min(1, this.vol.voice * 1.2);
        const vs = s.getVoices ? s.getVoices() : [];
        const en = vs.find(v => /en[-_](US|GB)/i.test(v.lang) && /male|david|mark|george/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang));
        if (en) u.voice = en;
        s.cancel();
        s.speak(u);
      } catch (e) { this.speechOk = false; }
    }

    music(id) {
      if (!this.ctx) return;
      if (this.trackId === id) return;
      this.trackId = id;
      const tr = TRACKS[id];
      if (!tr) { this.track = null; return; }
      this.track = this.buildTrack(tr);
      this.nextT = this.ctx.currentTime + 0.1; this.step = 0; this.bar = 0;
    }

    stopMusic() { this.track = null; this.trackId = null; }

    buildTrack(tr) {
      const rng = new RNG(tr.seed * 7919);
      const scale = SCALES[tr.scale] || SCALES.minor;
      const motif = [];
      for (let i = 0; i < 16; i++) motif.push(rng.chance(0.62) ? rng.int(0, 7) : -1);
      const motif2 = motif.map(v => v < 0 ? (rng.chance(0.3) ? rng.int(0, 7) : -1) : v + (rng.chance(0.3) ? rng.int(-2, 2) : 0));
      const rhythm = []; for (let i = 0; i < 16; i++) rhythm.push(rng.chance(0.25) ? 2 : 1);
      return Object.assign({}, tr, { scaleN: scale, motif, motif2, rhythm, spb: 60 / tr.bpm / 4 });
    }

    note(deg, oct) {
      const tr = this.track;
      const sc = tr.scaleN;
      const n = sc.length;
      const o = Math.floor(deg / n);
      const d = ((deg % n) + n) % n;
      return tr.root + sc[d] + 12 * (o + (oct || 0));
    }

    hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

    tone(t, midi, dur, kind, vol) {
      const c = this.ctx;
      const f = this.hz(midi);
      const g = c.createGain();
      const out = this.mus;
      if (kind === 'pluck') {
        const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
        const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.value = f * 2;
        const g2 = c.createGain(); g2.gain.value = 0.15;
        o2.connect(g2); g2.connect(g); o.connect(g);
        this.env(g, t, 0.003, vol, dur * 1.4);
        g.connect(out);
        o.start(t); o.stop(t + dur * 1.5); o2.start(t); o2.stop(t + dur * 1.5);
        return;
      }
      const o = c.createOscillator();
      o.type = kind === 'square' || kind === 'reed' ? 'square' : kind === 'sine' ? 'sine' : 'sawtooth';
      o.frequency.value = f;
      const flt = c.createBiquadFilter(); flt.type = 'lowpass';
      const base = kind === 'brass' ? 700 : kind === 'dist' ? 2400 : kind === 'bass' ? 500 : kind === 'pad' ? 1100 : kind === 'reed' ? 1500 : 1800;
      flt.frequency.setValueAtTime(base * 2.2, t); flt.frequency.exponentialRampToValueAtTime(base, t + Math.min(0.3, dur));
      flt.Q.value = kind === 'reed' ? 6 : 1.5;
      o.connect(flt);
      if (kind === 'dist') {
        const ws = c.createWaveShaper(); const cv = new Float32Array(256);
        for (let i = 0; i < 256; i++) { const x = i / 128 - 1; cv[i] = Math.tanh(x * 3); }
        ws.curve = cv; flt.connect(ws); ws.connect(g);
      } else flt.connect(g);
      if (kind === 'pad') {
        const o2 = c.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = f * 1.006; o2.connect(flt); o2.start(t); o2.stop(t + dur + 0.2);
        this.env(g, t, dur * 0.3, vol, dur * 0.7, 'lin');
      } else this.env(g, t, 0.006, vol, dur);
      g.connect(out);
      o.start(t); o.stop(t + dur + 0.2);
    }

    drum(t, kind, vol) {
      const c = this.ctx;
      if (kind === 'k') { this.osc(t, 'sine', 150, 42, 0.18, 0.9 * vol, this.mus); this.nz(t, 0.02, 'lowpass', 2000, 1, 0.2 * vol, this.mus); }
      else if (kind === 's') { this.nz(t, 0.14, 'bandpass', 1800, 0.8, 0.45 * vol, this.mus); this.osc(t, 'triangle', 220, 160, 0.08, 0.3 * vol, this.mus); }
      else if (kind === 'h') this.nz(t, 0.03, 'highpass', 7000, 1, 0.18 * vol, this.mus);
      else if (kind === 'o') this.nz(t, 0.18, 'highpass', 6000, 1, 0.16 * vol, this.mus);
      else if (kind === 't') { this.osc(t, 'sine', 90, 55, 0.3, 0.8 * vol, this.mus); this.nz(t, 0.06, 'lowpass', 700, 1, 0.35 * vol, this.mus); }
    }

    tick() {
      if (!this.ctx || !this.track) return;
      const c = this.ctx;
      const tr = this.track;
      while (this.nextT < c.currentTime + 0.18) {
        const t = this.nextT, st = this.step % 16;
        const chord = tr.prog[this.bar % tr.prog.length];
        const dr = DRUMS[tr.drums] || DRUMS.none;
        for (const k of ['k', 's', 'h', 'o', 't']) { const pat = dr[k]; if (pat && pat[st] === 'x') this.drum(t, k, 0.8); }
        const bassPat = { octave: [0, -1, 7, -1, 0, -1, 7, 0, 0, -1, 7, -1, 0, 7, 0, 7], rock: [0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 4, 4, 4, 4], walk: [0, -1, 2, -1, 4, -1, 5, -1, 7, -1, 5, -1, 4, -1, 2, -1], drone: [0, -1, -1, -1, -1, -1, -1, -1, 0, -1, -1, -1, -1, -1, -1, -1], oompah: [0, -1, 11, -1, 4, -1, 11, -1, 0, -1, 11, -1, 4, -1, 11, -1] }[tr.bass] || [];
        const bv = bassPat[st];
        if (bv !== undefined && bv >= 0) {
          const midi = bv === 11 ? this.note(chord + 4, 1) : this.note(chord, 0) + (bv === 7 ? 12 : bv === 3 ? 5 : bv === 4 ? 7 : bv === 5 ? 9 : bv === 2 ? 4 : 0);
          this.tone(t, midi - 12, tr.spb * (tr.bass === 'drone' ? 7 : 1.6), 'bass', 0.32);
        }
        if (tr.pad && st === 0) {
          for (const d of [0, 2, 4]) this.tone(t, this.note(chord + d, 1), tr.spb * 15, 'pad', 0.06);
        }
        if (tr.arp && st % 2 === 0) {
          const d = [0, 2, 4, 7][(st / 2) % 4];
          this.tone(t, this.note(chord + d, 2), tr.spb * 1.2, 'pluck', 0.07);
        }
        if (tr.lead !== 'none') {
          const phrase = (this.bar >> 1) % 2 ? tr.motif2 : tr.motif;
          const v = phrase[st];
          const quiet = this.bar % 8 >= 6 && st > 8;
          if (v >= 0 && !quiet) {
            const midi = this.note(chord + v, 2);
            const kind = tr.lead === 'saw' ? 'saw' : tr.lead === 'square' ? 'square' : tr.lead;
            this.tone(t, midi, tr.spb * tr.rhythm[st] * 1.1, kind, kind === 'pluck' ? 0.14 : 0.075);
          }
        }
        this.nextT += tr.spb;
        this.step++;
        if (this.step % 16 === 0) this.bar++;
      }
    }
  }

  Object.assign(T, { Audio, TRACKS });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
