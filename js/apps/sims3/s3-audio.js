(function (S) {
  'use strict';
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const VOWELS = [[800, 1200], [500, 1900], [320, 2300], [520, 900], [340, 800], [650, 1650]];

  const TRACKS = {
    menu: { bpm: 92, swing: 0.1, chords: [[53, [0, 4, 7, 11]], [50, [0, 3, 7, 10]], [55, [0, 3, 7, 10]], [48, [0, 4, 7, 10]]], bass: 'bossa', comp: 'offbeat', drums: 'bossa', lead: 'ep', leadEvery: 2, seed: 11, inst: 'ep' },
    live: { bpm: 108, swing: 0, chords: [[48, [0, 4, 7, 14]], [45, [0, 3, 7, 10]], [53, [0, 4, 7, 11]], [55, [0, 4, 7, 10]]], bass: 'root', comp: 'arp', drums: 'pop', lead: 'marimba', leadEvery: 2, seed: 23, inst: 'ep' },
    buy: { bpm: 126, swing: 0.28, chords: [[46, [0, 4, 7, 11]], [43, [0, 4, 7, 10]], [48, [0, 3, 7, 10]], [41, [0, 4, 7, 10]]], bass: 'walk', comp: 'stabs', drums: 'swing', lead: 'ep', leadEvery: 2, seed: 37, inst: 'ep' },
    build: { bpm: 116, swing: 0.05, chords: [[52, [0, 3, 7, 10]], [57, [0, 4, 7, 10]], [52, [0, 3, 7, 10]], [50, [0, 4, 7, 10]]], bass: 'synco', comp: 'pluck', drums: 'funk', lead: 'pluck', leadEvery: 4, seed: 41, inst: 'pluck' },
    map: { bpm: 68, swing: 0, chords: [[50, [0, 4, 7, 14]], [55, [0, 4, 7, 11]], [47, [0, 3, 7, 10]], [52, [0, 5, 7, 10]]], bass: 'pad', comp: 'pad', drums: 'none', lead: 'bell', leadEvery: 1, seed: 53, inst: 'pad' },
    cas: { bpm: 104, swing: 0.12, chords: [[55, [0, 4, 7, 14]], [52, [0, 3, 7, 10]], [48, [0, 4, 7, 11]], [50, [0, 4, 7, 10]]], bass: 'pizz', comp: 'arp', drums: 'bossa', lead: 'marimba', leadEvery: 2, seed: 67, inst: 'marimba' }
  };

  class Audio {
    constructor(settings) {
      this.settings = settings;
      this.ctx = null;
      this.dead = false;
      this.mode = null;
      this.pendingMode = null;
      this.track = null;
      this.timer = null;
      this.amb = null;
      this.lastAmb = 0;
      this.birdT = 0;
    }

    ensure() {
      if (this.ctx || this.dead) return this.ctx;
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) { this.dead = true; return null; }
      try { this.ctx = new AC(); } catch (e) { this.dead = true; return null; }
      const ctx = this.ctx;
      this.comp = ctx.createDynamicsCompressor();
      this.comp.threshold.value = -14; this.comp.ratio.value = 4;
      this.comp.connect(ctx.destination);
      this.master = ctx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(this.comp);
      this.bus = {};
      for (const k of ['voices', 'sfx', 'music', 'ambient', 'ui']) { const g = ctx.createGain(); g.connect(this.master); this.bus[k] = g; }
      const len = ctx.sampleRate * 2;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.setVolumes(this.settings);
      return ctx;
    }

    resume() {
      const c = this.ensure();
      if (!c) return;
      const go = () => { if (this.pendingMode) { const m = this.pendingMode; this.pendingMode = null; this.modeMusic(m); } };
      if (c.state === 'suspended') c.resume().then(go, () => { }); else go();
    }

    close() {
      this.stopMusic(true);
      if (this.ctx) { try { this.ctx.close(); } catch (e) { } }
      this.ctx = null;
      this.dead = true;
    }

    setVolumes(st) {
      this.settings = st;
      if (!this.ctx) return;
      const v = (k, m) => st[m] ? 0 : Math.max(0, Math.min(1, st[k]));
      const t = this.ctx.currentTime;
      this.bus.voices.gain.setTargetAtTime(v('voices', 'muteVoices') * 0.9, t, 0.05);
      this.bus.sfx.gain.setTargetAtTime(v('sfx', 'muteSfx') * 0.8, t, 0.05);
      this.bus.ui.gain.setTargetAtTime(v('sfx', 'muteSfx') * 0.55, t, 0.05);
      this.bus.music.gain.setTargetAtTime(v('music', 'muteMusic') * 0.5, t, 0.05);
      this.bus.ambient.gain.setTargetAtTime(v('ambient', 'muteAmbient') * 0.7, t, 0.05);
    }

    ready() { const c = this.ctx; return c && c.state === 'running'; }

    env(g, t, a, peak, hold, rel) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      g.gain.setValueAtTime(peak, t + a + hold);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
    }

    tone(dest, type, f0, f1, t, dur, vol, a) {
      const c = this.ctx;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      this.env(g, t, a || 0.005, vol, dur * 0.25, dur * 0.75);
      o.connect(g); g.connect(dest);
      o.start(t); o.stop(t + dur + 0.05);
      return o;
    }

    hiss(dest, t, dur, vol, type, f0, f1, q) {
      const c = this.ctx;
      const s = c.createBufferSource();
      s.buffer = this.noise;
      s.loop = true;
      const f = c.createBiquadFilter();
      f.type = type || 'bandpass';
      f.frequency.setValueAtTime(f0 || 1200, t);
      if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      f.Q.value = q || 1;
      const g = c.createGain();
      this.env(g, t, Math.min(0.02, dur * 0.2), vol, dur * 0.3, dur * 0.7);
      s.connect(f); f.connect(g); g.connect(dest);
      s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
    }

    notes(dest, list, type, step, vol, t0) {
      const t = t0 || this.ctx.currentTime;
      list.forEach((m, i) => { if (m !== null) this.tone(dest, type || 'sine', mtof(m), 0, t + i * step, step * 1.6, vol); });
    }

    ui(name) {
      this.resume();
      if (!this.ready()) return;
      const b = this.bus.ui, t = this.ctx.currentTime;
      switch (name) {
        case 'click': this.tone(b, 'sine', 1300, 900, t, 0.05, 0.25); break;
        case 'tab': case 'select': this.tone(b, 'sine', 880, 0, t, 0.05, 0.2); this.tone(b, 'sine', 1320, 0, t + 0.05, 0.07, 0.18); break;
        case 'open': this.hiss(b, t, 0.18, 0.12, 'bandpass', 600, 2400, 2); this.tone(b, 'sine', 1046, 0, t + 0.05, 0.12, 0.14); break;
        case 'pie': this.tone(b, 'sine', 380, 920, t, 0.09, 0.25); break;
        case 'queue': this.notes(b, [76, 83], 'sine', 0.06, 0.2); break;
        case 'deny': this.tone(b, 'square', 170, 150, t, 0.16, 0.08); break;
        case 'cancel': this.tone(b, 'sine', 900, 400, t, 0.12, 0.2); break;
        case 'promise': this.notes(b, [72, 76, 79], 'sine', 0.07, 0.18); break;
        case 'wish': this.notes(b, [84, 88, 91, 96], 'sine', 0.06, 0.12); break;
        case 'reward': case 'promo': this.notes(b, [67, 72, 76, 79, 84], 'triangle', 0.08, 0.16); break;
        case 'ltw': this.notes(b, [60, 64, 67, 72, 76, 79, 84], 'triangle', 0.09, 0.18); break;
        case 'skill': this.notes(b, [76, 81, 88], 'sine', 0.07, 0.18); break;
        case 'buy': this.hiss(b, t, 0.05, 0.2, 'highpass', 3000); this.notes(b, [88, 93], 'triangle', 0.07, 0.16, t + 0.03); break;
        case 'sell': this.notes(b, [93, 88, 84], 'triangle', 0.06, 0.14); break;
        case 'place': this.tone(b, 'sine', 180, 70, t, 0.14, 0.35); this.hiss(b, t, 0.06, 0.12, 'lowpass', 900); break;
        case 'pick': this.tone(b, 'sine', 300, 700, t, 0.08, 0.2); break;
        case 'build': this.hiss(b, t, 0.07, 0.35, 'lowpass', 700); this.tone(b, 'sine', 140, 90, t, 0.1, 0.3); this.hiss(b, t + 0.12, 0.06, 0.25, 'lowpass', 800); break;
        case 'demolish': this.hiss(b, t, 0.5, 0.35, 'lowpass', 1600, 200); this.tone(b, 'sine', 90, 40, t, 0.4, 0.3); break;
        case 'paint': this.hiss(b, t, 0.25, 0.18, 'bandpass', 2500, 1200, 3); break;
        case 'floor': case 'terrain': this.hiss(b, t, 0.08, 0.2, 'bandpass', 900, 0, 2); this.tone(b, 'sine', 240, 180, t, 0.06, 0.15); break;
        case 'whoosh': this.hiss(b, t, 0.22, 0.1, 'bandpass', 500, 1800, 1.5); break;
        case 'mode': this.notes(b, [67, 71, 74], 'sine', 0.03, 0.12); break;
        case 'note': this.notes(b, [81, 88], 'sine', 0.09, 0.14); break;
        case 'death': this.notes(b, [57, 53, 50, 45], 'triangle', 0.3, 0.16); break;
        case 'alarm': for (let i = 0; i < 4; i++) this.tone(b, 'square', 1400, 0, t + i * 0.22, 0.12, 0.08); break;
        case 'save': this.notes(b, [72, 79, 84], 'sine', 0.08, 0.16); break;
        default: this.tone(b, 'sine', 1000, 800, t, 0.05, 0.15);
      }
    }

    sfx(name, vol) {
      if (!this.ready() || vol <= 0.01) return;
      const b = this.bus.sfx, t = this.ctx.currentTime, v = Math.min(1, vol);
      switch (name) {
        case 'doorbell': this.tone(b, 'sine', mtof(76), 0, t, 0.5, 0.3 * v); this.tone(b, 'sine', mtof(72), 0, t + 0.45, 0.8, 0.3 * v); break;
        case 'fridge': this.tone(b, 'sine', 120, 90, t, 0.15, 0.3 * v); this.hiss(b, t + 0.1, 0.4, 0.05 * v, 'lowpass', 300); break;
        case 'fire_alarm': for (let i = 0; i < 6; i++) this.tone(b, 'square', 2900, 0, t + i * 0.35, 0.2, 0.1 * v); break;
        case 'burglar_alarm': for (let i = 0; i < 4; i++) this.tone(b, 'sawtooth', 700, 1300, t + i * 0.5, 0.45, 0.08 * v); break;
        case 'zap': this.hiss(b, t, 0.35, 0.3 * v, 'highpass', 2500); this.tone(b, 'square', 60, 50, t, 0.35, 0.12 * v); break;
        case 'thunder': { const d = 0.3 + Math.random() * 1.4; this.hiss(b, t + d, 0.25, 0.22 * v, 'highpass', 1800); this.hiss(b, t + d + 0.05, 2.6, 0.5 * v, 'lowpass', 260, 70); this.hiss(b, t + d + 0.4, 1.8, 0.3 * v, 'lowpass', 160, 60); break; }
        case 'woohoo': this.notes(b, [72, 76, 79, 84, 79, 84], 'triangle', 0.1, 0.16 * v); break;
        case 'wish': this.notes(b, [84, 88, 91, 96], 'sine', 0.06, 0.15 * v); break;
        case 'wedding': this.notes(b, [72, 76, 79, 84, 88], 'sine', 0.18, 0.18 * v); break;
        case 'water': case 'bath': this.hiss(b, t, 1.4, 0.12 * v, 'lowpass', 1400); break;
        case 'shower': this.hiss(b, t, 1.6, 0.1 * v, 'bandpass', 4000, 0, 0.6); break;
        case 'splash': this.hiss(b, t, 0.4, 0.25 * v, 'lowpass', 2500, 400); break;
        case 'flush': this.hiss(b, t, 1.2, 0.2 * v, 'lowpass', 2000, 250); break;
        case 'teleport': this.tone(b, 'sine', 300, 2400, t, 0.8, 0.15 * v); break;
        case 'skillup': this.notes(b, [72, 79, 84], 'sine', 0.08, 0.18 * v); break;
        case 'sizzle': this.hiss(b, t, 1.3, 0.1 * v, 'highpass', 5000); break;
        case 'repair': for (let i = 0; i < 3; i++) { this.hiss(b, t + i * 0.25, 0.05, 0.3 * v, 'bandpass', 3200, 0, 4); this.tone(b, 'square', 900, 700, t + i * 0.25, 0.05, 0.05 * v); } break;
        case 'reaper': this.notes(b, [45, 48, 44], 'sawtooth', 0.5, 0.06 * v); this.hiss(b, t, 1.4, 0.06 * v, 'lowpass', 400); break;
        case 'ltw': this.notes(b, [60, 64, 67, 72, 76, 79, 84], 'triangle', 0.09, 0.18 * v); break;
        case 'horn': this.tone(b, 'square', 392, 0, t, 0.18, 0.08 * v); this.tone(b, 'square', 330, 0, t + 0.22, 0.25, 0.08 * v); break;
        case 'guitar': this.pluck(b, [55, 59, 62, 67], t, 0.12, 0.3 * v); break;
        case 'dial': for (let i = 0; i < 7; i++) this.tone(b, 'sine', 700 + (i * 137) % 600, 0, t + i * 0.12, 0.08, 0.1 * v); break;
        case 'coffee': for (let i = 0; i < 6; i++) this.hiss(b, t + i * 0.15, 0.1, 0.12 * v, 'bandpass', 500 + Math.random() * 400, 0, 6); break;
        case 'chop': for (let i = 0; i < 3; i++) this.hiss(b, t + i * 0.22, 0.04, 0.35 * v, 'bandpass', 1800, 0, 2); break;
        case 'chime': this.notes(b, [84, 91], 'sine', 0.15, 0.15 * v); break;
        case 'birthday': this.tone(b, 'sawtooth', 500, 900, t, 0.4, 0.06 * v); this.notes(b, [72, 76, 79, 84], 'triangle', 0.1, 0.14 * v, t + 0.3); break;
        default: this.tone(b, 'sine', 700, 500, t, 0.08, 0.1 * v);
      }
    }

    pluck(dest, list, t0, step, vol) {
      for (let i = 0; i < list.length; i++) {
        const t = t0 + i * step, f = mtof(list[i]);
        const o = this.ctx.createOscillator(), g = this.ctx.createGain(), lp = this.ctx.createBiquadFilter();
        o.type = 'sawtooth'; o.frequency.value = f;
        lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 8, t); lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + 0.4);
        this.env(g, t, 0.003, vol, 0.02, 0.6);
        o.connect(lp); lp.connect(g); g.connect(dest);
        o.start(t); o.stop(t + 0.7);
      }
    }

    voice(sim, mood, vol) {
      this.resume();
      if (!this.ready() || !sim) return;
      const c = this.ctx, t0 = c.currentTime + 0.02;
      const age = sim.age;
      let base = sim.gender === 'f' ? 205 : 118;
      if (age === 'child' || age === 'toddler') base = 290;
      else if (age === 'teen') base = sim.gender === 'f' ? 225 : 150;
      else if (age === 'elder') base *= 0.9;
      base *= 0.8 + (sim.voice || 0.5) * 0.45;
      const n = mood === 'laugh' ? 4 : 2 + Math.floor(Math.random() * 4);
      let t = t0;
      const out = c.createGain();
      out.gain.value = Math.min(1, vol) * 0.55;
      out.connect(this.bus.voices);
      for (let i = 0; i < n; i++) {
        const len = mood === 'laugh' ? 0.11 : mood === 'angry' ? 0.1 + Math.random() * 0.06 : 0.12 + Math.random() * 0.1;
        const vw = VOWELS[mood === 'laugh' ? 0 : Math.floor(Math.random() * VOWELS.length)];
        const o = c.createOscillator();
        o.type = mood === 'angry' ? 'sawtooth' : 'sawtooth';
        let p0 = base * (1 + (Math.random() - 0.5) * 0.18), p1 = p0;
        if (mood === 'happy' || mood === 'laugh') p1 = p0 * (1.08 + Math.random() * 0.12);
        else if (mood === 'angry') { p0 *= 0.92; p1 = p0 * 0.85; }
        else if (mood === 'love') { p0 *= 1.05; p1 = p0 * 1.2; }
        else if (i === n - 1) p1 = p0 * (Math.random() < 0.5 ? 1.15 : 0.85);
        o.frequency.setValueAtTime(p0, t);
        o.frequency.exponentialRampToValueAtTime(p1, t + len);
        const f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter();
        f1.type = 'bandpass'; f1.frequency.value = vw[0] * (base > 180 ? 1.15 : 1); f1.Q.value = 6;
        f2.type = 'bandpass'; f2.frequency.value = vw[1] * (base > 180 ? 1.12 : 1); f2.Q.value = 8;
        const g = c.createGain();
        this.env(g, t, 0.018, mood === 'angry' ? 1.1 : 0.9, len * 0.5, len * 0.5);
        o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(out);
        o.start(t); o.stop(t + len + 0.1);
        if (Math.random() < 0.45 && mood !== 'laugh') this.hiss(out, t - 0.01, 0.04, 0.25, 'highpass', 3500);
        t += len + (mood === 'laugh' ? 0.05 : 0.02 + Math.random() * 0.06);
      }
    }

    stopMusic(now) {
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
      if (this.track && this.ctx) {
        const g = this.track.gain, t = this.ctx.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(g.gain.value, t);
        g.gain.linearRampToValueAtTime(0.0001, t + (now ? 0.05 : 1.2));
        const old = g;
        setTimeout(() => { try { old.disconnect(); } catch (e) { } }, 1500);
      }
      this.track = null;
    }

    modeMusic(mode) {
      if (mode === 'boot') return;
      if (!this.ready()) { this.pendingMode = mode; return; }
      const allowed = !this.settings.musicModes || this.settings.musicModes[mode] !== false;
      this.ambientActive = mode === 'live' || mode === 'buy' || mode === 'build' || mode === 'map';
      if (!this.ambientActive) this.ambientSilence();
      if (!allowed || !TRACKS[mode]) { this.stopMusic(); this.mode = mode; return; }
      if (this.mode === mode && this.track) return;
      this.mode = mode;
      this.stopMusic();
      const def = TRACKS[mode];
      const g = this.ctx.createGain();
      g.gain.value = 0.0001;
      g.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 1.5);
      g.connect(this.bus.music);
      const tr = { def, gain: g, step: 0, next: this.ctx.currentTime + 0.1, rng: new S.RNG(def.seed), phrase: null };
      tr.phrase = this.makePhrase(tr);
      this.track = tr;
      this.timer = setInterval(() => this.schedule(), 90);
      this.schedule();
    }

    makePhrase(tr) {
      const r = tr.rng, out = [];
      const scale = [0, 2, 4, 7, 9, 12, 14, 16];
      let p = 2 + r.int(0, 3);
      for (let i = 0; i < 16; i++) {
        if (r.next() < 0.38) { out.push(null); continue; }
        p = Math.max(0, Math.min(scale.length - 1, p + r.int(-2, 2)));
        out.push(scale[p]);
      }
      return out;
    }

    schedule() {
      const tr = this.track;
      if (!tr || !this.ready()) return;
      const c = this.ctx;
      const def = tr.def;
      const s16 = 60 / def.bpm / 4;
      if (tr.next < c.currentTime - 0.5) tr.next = c.currentTime + 0.05;
      while (tr.next < c.currentTime + 0.35) {
        const step = tr.step;
        const bar = Math.floor(step / 16), pos = step % 16;
        const swing = pos % 2 === 1 ? def.swing * s16 : 0;
        this.playStep(tr, bar, pos, tr.next + swing, s16);
        tr.step++;
        tr.next += s16;
        if (tr.step % 256 === 0) tr.phrase = this.makePhrase(tr);
      }
    }

    playStep(tr, bar, pos, t, s16) {
      const def = tr.def, out = tr.gain;
      const [root, ivs] = def.chords[bar % def.chords.length];
      const beat = pos % 4 === 0;
      if (def.drums === 'bossa') {
        if (pos === 0 || pos === 6 || pos === 8 || pos === 14) this.kick(out, t, 0.35);
        if (pos % 2 === 0) this.hat(out, t, pos % 4 === 2 ? 0.07 : 0.04);
        if (pos === 3 || pos === 10) this.rim(out, t, 0.12);
      } else if (def.drums === 'pop') {
        if (pos === 0 || pos === 8 || pos === 10) this.kick(out, t, 0.4);
        if (pos === 4 || pos === 12) this.snare(out, t, 0.14);
        if (pos % 2 === 0) this.hat(out, t, 0.05);
      } else if (def.drums === 'swing') {
        if (pos % 4 === 0 || pos % 4 === 3) this.ride(out, t, pos % 4 === 0 ? 0.06 : 0.04);
        if (pos === 4 || pos === 12) this.hat(out, t, 0.06);
        if (pos === 0) this.kick(out, t, 0.2);
      } else if (def.drums === 'funk') {
        if (pos === 0 || pos === 3 || pos === 10) this.kick(out, t, 0.4);
        if (pos === 4 || pos === 12) this.snare(out, t, 0.16);
        this.hat(out, t, pos % 2 ? 0.025 : 0.045);
      }
      const r = tr.rng;
      if (def.bass === 'root' && (pos === 0 || pos === 8 || pos === 14)) this.bass(out, root - 12 + (pos === 8 ? 7 : 0), t, s16 * 3, 0.32);
      else if (def.bass === 'bossa' && (pos === 0 || pos === 6 || pos === 8 || pos === 14)) this.bass(out, root - 12 + (pos === 6 || pos === 14 ? 7 : 0), t, s16 * 2, 0.3);
      else if (def.bass === 'walk' && beat) { const walk = [0, ivs[1], 7, ivs[3] || 10]; this.bass(out, root - 12 + walk[pos / 4], t, s16 * 3.5, 0.3); }
      else if (def.bass === 'synco' && (pos === 0 || pos === 3 || pos === 6 || pos === 10 || pos === 11)) this.bass(out, root - 12 + (pos === 10 ? 7 : pos === 11 ? 10 : 0), t, s16 * 1.4, 0.3);
      else if (def.bass === 'pizz' && (pos === 0 || pos === 8)) this.bass(out, root - 12 + (pos === 8 ? 7 : 0), t, s16 * 1.2, 0.3);
      else if (def.bass === 'pad' && pos === 0) this.bass(out, root - 12, t, s16 * 15, 0.22);
      if (def.comp === 'offbeat' && (pos === 2 || pos === 6 || pos === 10 || pos === 13)) this.chord(out, def.inst, root, ivs, t, s16 * 1.5, 0.06);
      else if (def.comp === 'arp' && pos % 2 === 0) { const iv = ivs[(pos / 2) % ivs.length]; this.inst(out, def.inst, root + 12 + iv, t, s16 * 2.5, 0.07); }
      else if (def.comp === 'stabs' && (pos === 4 || pos === 11)) this.chord(out, def.inst, root, ivs, t, s16 * 2, 0.07);
      else if (def.comp === 'pluck' && (pos === 2 || pos === 7 || pos === 10 || pos === 15)) this.chord(out, 'pluck', root + 12, ivs.slice(0, 3), t, s16, 0.05);
      else if (def.comp === 'pad' && pos === 0) this.chord(out, 'pad', root, ivs, t, s16 * 16, 0.05);
      const phraseOn = Math.floor(bar / 4) % def.leadEvery === 0 || def.leadEvery === 1;
      if (phraseOn && pos % 2 === 0) {
        const n = tr.phrase[(bar % 2) * 8 + pos / 2];
        if (n !== null && n !== undefined && (def.lead !== 'bell' || r.next() < 0.35)) this.inst(out, def.lead, root + 24 + n, t, s16 * (def.lead === 'bell' ? 8 : 2.5), def.lead === 'bell' ? 0.06 : 0.08);
      }
    }

    chord(out, inst, root, ivs, t, dur, vol) { for (const iv of ivs) this.inst(out, inst, root + iv, t, dur, vol); }

    inst(out, kind, midi, t, dur, vol) {
      const c = this.ctx, f = mtof(midi);
      if (kind === 'pluck') { this.pluckNote(out, f, t, vol); return; }
      const g = c.createGain();
      g.connect(out);
      if (kind === 'pad') {
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(g);
        for (const det of [-6, 6]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + 0.6); }
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * 0.6, t + dur * 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.5);
        return;
      }
      if (kind === 'marimba' || kind === 'bell') {
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(g);
        const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * (kind === 'bell' ? 2.76 : 4); const g2 = c.createGain(); g2.gain.value = kind === 'bell' ? 0.3 : 0.12; o2.connect(g2); g2.connect(g);
        this.env(g, t, 0.003, vol * 1.3, 0.01, kind === 'bell' ? 1.6 : 0.35);
        o.start(t); o.stop(t + 2); o2.start(t); o2.stop(t + 2);
        return;
      }
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(g);
      const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2; o2.detune.value = 4; const g2 = c.createGain(); g2.gain.value = 0.18; o2.connect(g2); g2.connect(g);
      this.env(g, t, 0.006, vol, dur * 0.2, Math.max(0.2, dur));
      o.start(t); o.stop(t + dur * 1.3 + 0.3); o2.start(t); o2.stop(t + dur * 1.3 + 0.3);
    }

    pluckNote(out, f, t, vol) {
      const c = this.ctx;
      const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
      o.type = 'square'; o.frequency.value = f;
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 6, t); lp.frequency.exponentialRampToValueAtTime(f * 1.1, t + 0.18);
      this.env(g, t, 0.002, vol, 0.01, 0.2);
      o.connect(lp); lp.connect(g); g.connect(out);
      o.start(t); o.stop(t + 0.3);
    }

    bass(out, midi, t, dur, vol) {
      const c = this.ctx;
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle'; o.frequency.value = mtof(midi);
      this.env(g, t, 0.01, vol, dur * 0.5, dur * 0.5);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + dur + 0.1);
    }

    kick(out, t, vol) { this.tone(out, 'sine', 120, 45, t, 0.16, vol); }
    snare(out, t, vol) { this.hiss(out, t, 0.12, vol, 'bandpass', 2200, 0, 0.8); }
    hat(out, t, vol) { this.hiss(out, t, 0.04, vol, 'highpass', 7000); }
    ride(out, t, vol) { this.hiss(out, t, 0.2, vol, 'bandpass', 6500, 0, 2); }
    rim(out, t, vol) { this.tone(out, 'triangle', 1700, 1500, t, 0.03, vol); }

    ambientSilence() {
      if (!this.amb || !this.ctx) return;
      const t = this.ctx.currentTime;
      for (const k of ['waves', 'hum', 'crickets', 'rain']) this.amb[k].gain.setTargetAtTime(0, t, 0.4);
    }

    ambient(game, cam, sub) {
      if (!this.ready() || !this.ambientActive) return;
      const c = this.ctx, now = c.currentTime;
      if (!this.amb) {
        const mk = (type, f, q) => {
          const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
          const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 0.7;
          const g = c.createGain(); g.gain.value = 0;
          s.connect(fl); fl.connect(g); g.connect(this.bus.ambient);
          s.start();
          return g;
        };
        const waves = mk('lowpass', 520);
        const lfo = c.createOscillator(), lg = c.createGain();
        lfo.frequency.value = 0.11; lg.gain.value = 0.35;
        const wv = c.createGain(); wv.gain.value = 1;
        waves.disconnect(); waves.connect(wv); wv.connect(this.bus.ambient);
        lfo.connect(lg); lg.connect(wv.gain); lfo.start();
        const hum = mk('lowpass', 180);
        const cr = c.createOscillator(); cr.type = 'sine'; cr.frequency.value = 4600;
        const crAm = c.createGain(); crAm.gain.value = 0;
        const am = c.createOscillator(); am.type = 'square'; am.frequency.value = 24;
        const amG = c.createGain(); amG.gain.value = 0.5;
        am.connect(amG); amG.connect(crAm.gain);
        const crickets = c.createGain(); crickets.gain.value = 0;
        cr.connect(crAm); crAm.connect(crickets); crickets.connect(this.bus.ambient);
        cr.start(); am.start();
        const rain = mk('bandpass', 2200, 0.35);
        this.amb = { waves, hum, crickets, rain };
      }
      if (now - this.lastAmb < 0.25) return;
      const dt = now - this.lastAmb;
      this.lastAmb = now;
      const h = S.hourOf(game.t);
      const night = h >= 20.5 || h < 5.5;
      const zoomK = [1, 0.75, 0.45, 0.2][cam.zoom] || 0.2;
      let sea = 0;
      for (let dy = -12; dy <= 12; dy += 4) for (let dx = -12; dx <= 12; dx += 4) if (S.isSea(Math.round(cam.tx) + dx, Math.round(cam.ty) + dy)) sea++;
      const seaK = Math.min(1, sea / 12);
      const speed = game.speed ? 1 : 0.4;
      this.amb.waves.gain.setTargetAtTime((0.05 + seaK * 0.5) * zoomK * speed, now, 0.8);
      this.amb.hum.gain.setTargetAtTime((sub === 'map' ? 0.12 : 0.05) * speed, now, 0.8);
      const wk = game.weather ? game.weather.kind : 'clear';
      const wet = wk === 'storm' ? 1 : wk === 'rain' ? 0.6 : 0;
      this.amb.rain.gain.setTargetAtTime(wet * 0.16 * (0.4 + zoomK * 0.6) * speed, now, 2);
      this.amb.crickets.gain.setTargetAtTime(night && !wet ? 0.012 * zoomK * speed : 0, now, 1.5);
      this.birdT -= dt;
      if (!night && !wet && wk !== 'cloudy' && game.speed && this.birdT <= 0 && h > 6 && h < 20) {
        this.birdT = 0.8 + Math.random() * 3.5;
        const t = now + 0.05, f = 2200 + Math.random() * 1800;
        const n = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) this.tone(this.bus.ambient, 'sine', f, f * (1.2 + Math.random() * 0.4), t + i * 0.13, 0.09, 0.04 * zoomK);
      }
    }
  }

  Object.assign(S, { Audio, AUDIO_TRACKS: TRACKS });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
