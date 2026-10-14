(function (M) {
  'use strict';
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);

  class Audio {
    constructor() {
      this.ctx = null;
      this.sfxVol = 0.8;
      this.musicVol = 0.5;
      this.bt = false;
      this.listener = { pos: [0, 0, 0], yaw: 0 };
      this.music = null;
      this.loops = new Map();
      this.noiseBuf = null;
    }
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch (e) { this.ctx = null; return; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = 1; this.master.connect(c.destination);
      this.sfx = c.createGain(); this.sfx.gain.value = this.sfxVol;
      this.lp = c.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 18000;
      this.sfx.connect(this.lp); this.lp.connect(this.master);
      this.mus = c.createGain(); this.mus.gain.value = this.musicVol; this.mus.connect(this.master);
      this.rev = c.createConvolver();
      this.rev.buffer = this.impulse(2.4, 2.2);
      this.revGain = c.createGain(); this.revGain.gain.value = 0.28;
      this.rev.connect(this.revGain); this.revGain.connect(this.master);
      const len = c.sampleRate * 2;
      this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    impulse(sec, decay) {
      const c = this.ctx, n = Math.floor(c.sampleRate * sec);
      const b = c.createBuffer(2, n, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
      return b;
    }
    setVolume(sfx, music) {
      this.sfxVol = sfx; this.musicVol = music;
      if (this.sfx) this.sfx.gain.value = sfx;
      if (this.mus) this.mus.gain.value = music;
    }
    setBT(on) {
      if (!this.ctx || this.bt === on) return;
      this.bt = on;
      const t = this.ctx.currentTime;
      this.lp.frequency.cancelScheduledValues(t);
      this.lp.frequency.setTargetAtTime(on ? 2200 : 18000, t, 0.08);
      if (on) { this.sweep(160, 40, 0.9, 0.5); this.startHeart(); } else { this.sweep(50, 200, 0.5, 0.3); this.stopHeart(); }
    }
    startHeart() {
      if (this.heart) return;
      const beat = () => { this.thump(55, 0.25, 0.5); setTimeout(() => this.thump(48, 0.2, 0.35), 180); };
      beat();
      this.heart = setInterval(beat, 1100);
    }
    stopHeart() { if (this.heart) { clearInterval(this.heart); this.heart = null; } }

    out(pos, vol) {
      const c = this.ctx;
      const g = c.createGain();
      let v = vol === undefined ? 1 : vol;
      let pan = 0;
      if (pos) {
        const L = this.listener;
        const dx = pos[0] - L.pos[0], dz = pos[2] - L.pos[2], dy = pos[1] - L.pos[1];
        const d = Math.hypot(dx, dy, dz);
        v *= 1 / (1 + d * d * 0.012);
        const r = M.rightOf(L.yaw);
        pan = M.clamp((dx * r[0] + dz * r[2]) / Math.max(1, d), -1, 1) * 0.8;
      }
      g.gain.value = v;
      if (c.createStereoPanner && pan) {
        const p = c.createStereoPanner(); p.pan.value = pan;
        g.connect(p); p.connect(this.sfx);
        if (pos && v > 0.05) p.connect(this.rev);
      } else { g.connect(this.sfx); if (v > 0.05) g.connect(this.rev); }
      return g;
    }
    noise(dur, f0, f1, q, vol, pos, type, attack) {
      const c = this.ctx, t = c.currentTime;
      const k = this.bt ? 1.7 : 1;
      const src = c.createBufferSource(); src.buffer = this.noiseBuf;
      src.playbackRate.value = this.bt ? 0.6 : 1;
      const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.Q.value = q || 1;
      f.frequency.setValueAtTime(f0 * (this.bt ? 0.7 : 1), t);
      if (f1) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * (this.bt ? 0.7 : 1)), t + dur * k);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + (attack || 0.004));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * k);
      src.connect(f); f.connect(g); g.connect(this.out(pos, 1));
      src.start(t, Math.random() * 1.5); src.stop(t + dur * k + 0.05);
    }
    tone(freq, dur, vol, pos, type, slide, attack) {
      const c = this.ctx, t = c.currentTime;
      const k = this.bt ? 1.7 : 1;
      const o = c.createOscillator(); o.type = type || 'sine';
      o.frequency.setValueAtTime(freq * (this.bt ? 0.72 : 1), t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide * (this.bt ? 0.72 : 1)), t + dur * k);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + (attack || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * k);
      o.connect(g); g.connect(this.out(pos, 1));
      o.start(t); o.stop(t + dur * k + 0.05);
    }
    thump(f, dur, vol) {
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime;
      const o = c.createOscillator(); o.frequency.setValueAtTime(f * 1.8, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.05);
      const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
    }
    sweep(f0, f1, dur, vol) {
      const c = this.ctx, t = c.currentTime;
      const o = c.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f); f.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
      const s = c.createBufferSource(); s.buffer = this.noiseBuf;
      const nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.setValueAtTime(f0 * 10, t); nf.frequency.exponentialRampToValueAtTime(f1 * 10, t + dur);
      const ng = c.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(vol * 0.6, t + dur * 0.4); ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(nf); nf.connect(ng); ng.connect(this.master); s.start(t); s.stop(t + dur + 0.05);
    }

    play(id, pos, o) {
      if (!this.ctx) return;
      o = o || {};
      const v = o.vol || 1;
      switch (id) {
        case 'beretta': this.noise(0.22, 2400, 300, 0.8, 0.9 * v, pos); this.tone(120, 0.12, 0.5 * v, pos, 'triangle', 50); break;
        case 'deagle': this.noise(0.4, 1500, 150, 0.7, 1.0 * v, pos); this.tone(80, 0.25, 0.7 * v, pos, 'triangle', 35); break;
        case 'pump': this.noise(0.55, 1100, 90, 0.6, 1.0 * v, pos); this.tone(70, 0.3, 0.8 * v, pos, 'triangle', 30); setTimeout(() => this.ctx && (this.noise(0.05, 3000, 0, 4, 0.3, pos), setTimeout(() => this.noise(0.06, 2400, 0, 4, 0.3, pos), 140)), 320); break;
        case 'sawed': this.noise(0.6, 900, 80, 0.6, 1.0 * v, pos); this.tone(60, 0.35, 0.9 * v, pos, 'triangle', 28); break;
        case 'ingram': this.noise(0.1, 2800, 600, 0.9, 0.7 * v, pos); this.tone(150, 0.06, 0.35 * v, pos, 'square', 80); break;
        case 'training': this.noise(0.1, 1200, 600, 2, 0.3 * v, pos); break;
        case 'dry': this.noise(0.03, 4000, 0, 6, 0.35, pos); break;
        case 'reload': this.noise(0.04, 3500, 0, 5, 0.35, pos); setTimeout(() => this.ctx && this.noise(0.05, 2500, 0, 5, 0.4, pos), 380); break;
        case 'shell': this.noise(0.05, 2800, 0, 5, 0.35, pos); break;
        case 'switch': this.noise(0.04, 3000, 0, 4, 0.25, pos); break;
        case 'whiz': this.noise(0.25, 5000, 900, 3, 0.35, pos, 'bandpass', 0.08); break;
        case 'ric': this.tone(2400 + Math.random() * 1500, 0.3, 0.12, pos, 'sine', 900); break;
        case 'impact_stone': this.noise(0.08, 2200, 800, 1.2, 0.35, pos); break;
        case 'impact_metal': this.tone(1800 + Math.random() * 900, 0.18, 0.18, pos, 'triangle'); this.noise(0.05, 4000, 0, 3, 0.2, pos); break;
        case 'impact_wood': this.noise(0.1, 700, 300, 1.5, 0.4, pos); break;
        case 'impact_flesh': this.noise(0.12, 500, 150, 1, 0.45, pos); break;
        case 'impact_snow': this.noise(0.1, 900, 300, 1, 0.25, pos); break;
        case 'explode': this.noise(1.6, 900, 40, 0.5, 1.2 * v, pos, 'lowpass', 0.01); this.tone(55, 1.0, 0.9 * v, pos, 'sine', 25); this.noise(0.5, 3000, 400, 0.8, 0.5, pos); break;
        case 'glass': for (let i = 0; i < 6; i++) setTimeout(() => this.ctx && this.tone(3000 + Math.random() * 4000, 0.15, 0.1, pos, 'sine'), i * 25); this.noise(0.35, 6000, 2500, 1, 0.5, pos, 'highpass'); break;
        case 'door': this.noise(0.35, 400, 700, 6, 0.25, pos, 'bandpass', 0.05); this.noise(0.08, 300, 100, 1, 0.3, pos); break;
        case 'doorclose': this.noise(0.12, 200, 80, 1, 0.5, pos); break;
        case 'slide': this.noise(0.9, 300, 600, 3, 0.25, pos, 'bandpass', 0.1); break;
        case 'locker': this.noise(0.2, 1400, 600, 4, 0.3, pos); break;
        case 'step': this.noise(0.07, o.snow ? 1200 : 500, o.snow ? 600 : 200, 1, o.snow ? 0.12 : 0.1, pos); break;
        case 'land': this.noise(0.12, 300, 100, 1, 0.35, pos); break;
        case 'cover': this.noise(0.16, 900, 260, 1.4, 0.32, pos); this.tone(85, 0.09, 0.28, pos, 'sine', 50); break;
        case 'roll': this.noise(0.42, 380, 110, 1, 0.42, pos); this.tone(70, 0.12, 0.3, pos, 'sine', 40); break;
        case 'jump': this.noise(0.08, 400, 200, 1, 0.12, pos); break;
        case 'thud': this.noise(0.2, 250, 60, 1, 0.6, pos); this.tone(70, 0.15, 0.4, pos, 'sine', 40); break;
        case 'dodge': this.noise(0.5, 400, 1800, 2, 0.35, pos, 'bandpass', 0.1); break;
        case 'pills': for (let i = 0; i < 8; i++) setTimeout(() => this.ctx && this.noise(0.02, 3500 + Math.random() * 1500, 0, 6, 0.2), i * 35); setTimeout(() => this.ctx && this.tone(180, 0.18, 0.3, null, 'sine', 90), 420); break;
        case 'pillsbottle': for (let i = 0; i < 5; i++) setTimeout(() => this.ctx && this.noise(0.02, 4000, 0, 6, 0.18), i * 40); break;
        case 'pickgun': this.noise(0.08, 1500, 700, 3, 0.35); this.tone(600, 0.1, 0.1, null, 'triangle'); break;
        case 'pickammo': this.noise(0.06, 2500, 1500, 4, 0.3); break;
        case 'pickkey': this.tone(2400, 0.12, 0.12, null, 'sine'); setTimeout(() => this.ctx && this.tone(3100, 0.15, 0.1, null, 'sine'), 70); break;
        case 'ring': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].forEach(i => setTimeout(() => this.ctx && (this.tone(440, 0.06, 0.08, pos, 'sine'), this.tone(480, 0.06, 0.08, pos, 'sine')), i * 55)); break;
        case 'pickup_phone': this.noise(0.08, 1200, 400, 2, 0.3, pos); break;
        case 'tvon': this.noise(0.4, 5000, 2000, 1, 0.3, pos, 'highpass'); break;
        case 'tvoff': this.tone(12000, 0.2, 0.05, pos, 'sine', 3000); break;
        case 'hiss': this.noise(0.6, 6000, 4000, 1, 0.4, pos, 'highpass', 0.02); break;
        case 'molotov': this.noise(0.4, 5000, 2000, 1, 0.4, pos, 'highpass'); this.noise(0.9, 500, 200, 0.7, 0.6, pos, 'lowpass', 0.05); break;
        case 'moverstart': this.noise(1.2, 150, 300, 1, 0.4, pos, 'lowpass', 0.3); this.noise(0.5, 3000, 1500, 2, 0.15, pos, 'bandpass', 0.05); break;
        case 'moverstop': this.noise(0.8, 3500, 1500, 4, 0.2, pos); break;
        case 'button': this.tone(900, 0.08, 0.15, pos, 'square'); break;
        case 'keypad': [0, 1, 2, 3].forEach(i => setTimeout(() => this.ctx && this.tone(800 + i * 120, 0.07, 0.12, pos, 'square'), i * 110)); setTimeout(() => this.ctx && this.tone(1400, 0.2, 0.12, pos, 'sine'), 520); break;
        case 'swing': this.noise(0.18, 800, 2500, 2, 0.25, pos, 'bandpass', 0.05); break;
        case 'bash': this.noise(0.12, 400, 100, 1, 0.6, pos); this.tone(120, 0.1, 0.3, pos, 'triangle', 60); break;
        case 'throwprep': this.noise(0.03, 4000, 0, 6, 0.3); break;
        case 'throw': this.noise(0.2, 600, 1500, 2, 0.15, pos, 'bandpass', 0.03); break;
        case 'bounce': this.tone(900 + Math.random() * 300, 0.08, 0.12, pos, 'triangle'); break;
        case 'popup': this.noise(0.1, 600, 300, 2, 0.4, pos); break;
        case 'padlock': this.tone(1500, 0.2, 0.2, pos, 'triangle', 700); this.noise(0.1, 3000, 1000, 3, 0.4, pos); break;
        case 'clink': this.tone(3500 + Math.random() * 1500, 0.1, 0.05, pos, 'sine'); break;
        case 'page': this.noise(0.25, 3000, 1200, 0.8, 0.25, null, 'bandpass', 0.05); break;
        case 'menu': this.tone(420, 0.08, 0.12, null, 'triangle'); break;
        case 'hover': this.tone(620, 0.04, 0.05, null, 'sine'); break;
        case 'death': this.tone(60, 2.5, 0.8, null, 'sine', 30); this.noise(1.5, 300, 60, 0.7, 0.4, null, 'lowpass', 0.05); break;
        case 'locked': this.noise(0.12, 900, 400, 3, 0.35, pos); break;
        case 'thunder': this.noise(3, 300, 40, 0.6, 0.9, null, 'lowpass', 0.3); break;
        case 'scream': this.tone(900, 0.8, 0.12, pos, 'sawtooth', 600, 0.1); break;
        case 'baby': this.tone(700, 0.6, 0.06, pos, 'sine', 500, 0.1); break;
        case 'siren': { const c = this.ctx, t = c.currentTime; const osc = c.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(600, t); for (let i = 0; i < 6; i++) { osc.frequency.linearRampToValueAtTime(1100, t + i * 1.0 + 0.5); osc.frequency.linearRampToValueAtTime(600, t + i * 1.0 + 1.0); } const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08 * v, t + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 6); osc.connect(g); g.connect(this.out(pos, 1)); osc.start(t); osc.stop(t + 6.1); break; }
      }
    }

    loop(key, kind, pos, vol) {
      if (!this.ctx) return;
      let L = this.loops.get(key);
      if (!L) {
        const c = this.ctx;
        const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
        const f = c.createBiquadFilter();
        const g = c.createGain(); g.gain.value = 0;
        if (kind === 'fire') { f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.6; }
        else if (kind === 'train') { f.type = 'lowpass'; f.frequency.value = 220; }
        else if (kind === 'wind') { f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.8; }
        else if (kind === 'rain') { f.type = 'highpass'; f.frequency.value = 2500; }
        else { f.type = 'lowpass'; f.frequency.value = 400; }
        src.connect(f); f.connect(g); g.connect(this.sfx);
        src.start();
        L = { src, f, g, kind, seen: 0 };
        this.loops.set(key, L);
      }
      let v = vol;
      if (pos) { const d = M.dist(pos, this.listener.pos); v *= 1 / (1 + d * d * 0.02); }
      L.g.gain.setTargetAtTime(v, this.ctx.currentTime, 0.2);
      if (kind === 'wind') L.f.frequency.setTargetAtTime(400 + Math.sin(this.ctx.currentTime * 0.3) * 200, this.ctx.currentTime, 0.5);
      L.seen = this.ctx.currentTime;
    }
    sweepLoops() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      for (const [k, L] of this.loops) if (now - L.seen > 0.5) { L.g.gain.setTargetAtTime(0, now, 0.2); if (now - L.seen > 2) { try { L.src.stop(); } catch (e) { } this.loops.delete(k); } }
    }
    stopLoops() {
      for (const L of this.loops.values()) { try { L.src.stop(); } catch (e) { } }
      this.loops.clear();
    }

    playMusic(id) {
      if (!this.ctx || this.musicId === id) return;
      this.stopMusic();
      this.musicId = id;
      if (!id || id === 'none') return;
      const c = this.ctx;
      const bus = c.createGain(); bus.gain.value = 0; bus.connect(this.mus);
      const send = c.createGain(); send.gain.value = 0.6; bus.connect(send); send.connect(this.rev);
      bus.gain.setTargetAtTime(1, c.currentTime, 1.5);
      const st = { bus, timers: [], nodes: [], stopped: false };
      this.music = st;
      const theme = ['theme', 'novel', 'end'].includes(id);
      const club = id === 'club' || id === 'ragna';
      const bpm = club ? 124 : theme ? 58 : 50;
      const beat = 60 / bpm;
      let bar = 0;
      const prog = theme ? [[50, 53, 57], [46, 50, 53], [53, 57, 60], [45, 49, 52]] : id === 'prologue' ? [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]] : [[38, 45, 50], [34, 41, 46], [36, 43, 48], [33, 40, 45]];
      const melody = [[74, 2], [72, 1], [69, 1], [70, 2], [69, 1], [65, 1], [67, 3], [0, 1], [69, 2], [67, 1], [65, 1], [64, 2], [62, 2], [61, 3], [0, 1]];
      const pad = (notes, t, dur, vol) => {
        for (const n of notes) {
          const o = c.createOscillator(); o.type = theme ? 'triangle' : 'sawtooth';
          o.frequency.value = NOTE(n);
          o.detune.value = (Math.random() - 0.5) * 12;
          const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = theme ? 1200 : 420;
          const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
          o.connect(f); f.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.1);
        }
      };
      const cello = (n, t, dur) => {
        const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = NOTE(n - 12);
        const lfo = c.createOscillator(); lfo.frequency.value = 5.2; const lg = c.createGain(); lg.gain.value = 3.5; lfo.connect(lg); lg.connect(o.detune);
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100; f.Q.value = 2;
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.25); g.gain.setValueAtTime(0.07, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
        o.connect(f); f.connect(g); g.connect(bus); o.start(t); lfo.start(t); o.stop(t + dur + 0.3); lfo.stop(t + dur + 0.3);
      };
      const piano = (n, t) => {
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = NOTE(n);
        const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = NOTE(n) * 2;
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
        const g2 = c.createGain(); g2.gain.value = 0.25;
        o.connect(g); o2.connect(g2); g2.connect(g); g.connect(bus); o.start(t); o2.start(t); o.stop(t + 2.6); o2.stop(t + 2.6);
      };
      const kick = t => { const o = c.createOscillator(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12); const g = c.createGain(); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.32); };
      const hat = t => { const s = c.createBufferSource(); s.buffer = this.noiseBuf; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000; const g = c.createGain(); g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); s.connect(f); f.connect(g); g.connect(bus); s.start(t, Math.random()); s.stop(t + 0.06); };
      const bass = (n, t, d) => { const o = c.createOscillator(); o.type = 'square'; o.frequency.value = NOTE(n - 12); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300; const g = c.createGain(); g.gain.setValueAtTime(0.09, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(f); f.connect(g); g.connect(bus); o.start(t); o.stop(t + d + 0.02); };
      let next = c.currentTime + 0.1;
      let mi = 0;
      const schedule = () => {
        if (st.stopped) return;
        while (next < c.currentTime + 1.5) {
          const ch = prog[bar % prog.length];
          const barLen = beat * 4;
          if (club) {
            for (let b = 0; b < 4; b++) { kick(next + b * beat); hat(next + b * beat + beat / 2); bass(ch[0], next + b * beat + beat / 2, beat * 0.4); }
            if (bar % 2 === 0) pad(ch.map(n => n + 12), next, barLen * 2, 0.02);
          } else if (theme) {
            pad(ch, next, barLen * 1.1, 0.035);
            for (let b = 0; b < 4; b++) piano(ch[b % 3] + 12 + (b === 3 ? 12 : 0), next + b * beat);
            let tt = next;
            while (tt < next + barLen - 0.01) {
              const [n, d] = melody[mi % melody.length];
              if (n) cello(n, tt, d * beat * 0.95);
              tt += d * beat;
              mi++;
            }
          } else {
            pad(ch, next, barLen * 1.2, id === 'tension' ? 0.03 : 0.022);
            if (Math.random() < 0.5) piano(ch[Math.floor(Math.random() * 3)] + 24, next + beat * Math.floor(Math.random() * 4));
            if (id === 'tension') for (let b = 0; b < 4; b++) bass(ch[0], next + b * beat, beat * 0.3);
          }
          next += barLen;
          bar++;
        }
        st.timers.push(setTimeout(schedule, 500));
      };
      schedule();
    }
    stopMusic() {
      if (!this.music) return;
      const st = this.music;
      st.stopped = true;
      st.timers.forEach(clearTimeout);
      if (this.ctx) { st.bus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.6); setTimeout(() => { try { st.bus.disconnect(); } catch (e) { } }, 3000); }
      this.music = null;
      this.musicId = null;
    }
    dispose() {
      this.stopMusic();
      this.stopHeart();
      this.stopLoops();
      if (this.ctx) { try { this.ctx.close(); } catch (e) { } }
      this.ctx = null;
    }
  }
  M.Audio = Audio;
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
