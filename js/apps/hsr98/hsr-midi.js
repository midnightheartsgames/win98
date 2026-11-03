(function (H) {
  'use strict';
  const LOOKAHEAD = 1.2, TICK_MS = 250, LEVEL = 0.8;
  const songs = new Map();

  function parse(src) {
    const d = src instanceof Uint8Array ? src : new Uint8Array(src);
    let p = 0;
    const u16 = () => (d[p++] << 8) | d[p++];
    const u32 = () => ((d[p++] << 24) | (d[p++] << 16) | (d[p++] << 8) | d[p++]) >>> 0;
    const str = n => { let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(d[p++]); return s; };
    const vlq = () => { let v = 0, b; do { b = d[p++]; v = v * 128 + (b & 127); } while (b & 128 && p < d.length); return v; };
    if (str(4) !== 'MThd') throw new Error('Not a MIDI file');
    const headLen = u32();
    u16();
    const trackCount = u16(), tpb = u16();
    if (tpb & 0x8000) throw new Error('SMPTE time is not supported');
    p = 8 + headLen;
    const raw = [];
    for (let k = 0; k < trackCount && p + 8 <= d.length; k++) {
      const id = str(4), end = u32() + p;
      if (id !== 'MTrk') { p = end; continue; }
      let tick = 0, status = 0;
      while (p < end) {
        tick += vlq();
        let st = d[p];
        if (st & 0x80) p++; else st = status;
        if (st === 0xff) {
          const type = d[p++], len = vlq(), at = p;
          p += len;
          if (type === 0x51) raw.push({ tick, ord: 0, kind: 'tempo', v: (d[at] << 16) | (d[at + 1] << 8) | d[at + 2] });
          else if (type === 0x06) raw.push({ tick, ord: 0, kind: 'marker', text: String.fromCharCode(...d.subarray(at, at + len)) });
          continue;
        }
        if (st === 0xf0 || st === 0xf7) { p += vlq(); continue; }
        status = st;
        const hi = st & 0xf0, ch = st & 15, a = d[p++], b = hi === 0xc0 || hi === 0xd0 ? 0 : d[p++];
        if (hi === 0x90 && b > 0) raw.push({ tick, ord: 3, kind: 'on', ch, key: a, vel: b });
        else if (hi === 0x80 || hi === 0x90) raw.push({ tick, ord: 2, kind: 'off', ch, key: a });
        else if (hi === 0xb0) raw.push({ tick, ord: 1, kind: 'cc', ch, n: a, v: b });
        else if (hi === 0xc0) raw.push({ tick, ord: 1, kind: 'prog', ch, v: a });
      }
      p = end;
    }
    raw.sort((x, y) => x.tick - y.tick || x.ord - y.ord);
    let lastTick = 0, lastSec = 0, uspb = 500000;
    const sec = tick => lastSec + (tick - lastTick) * uspb / tpb / 1e6;
    const open = new Map(), notes = [], ctrl = [];
    let loopStart = null, loopEnd = null, length = 0;
    for (const e of raw) {
      const t = sec(e.tick);
      length = Math.max(length, t);
      if (e.kind === 'tempo') { lastSec = t; lastTick = e.tick; uspb = e.v; }
      else if (e.kind === 'marker') {
        const m = e.text.trim().toLowerCase();
        if (m === 'loopstart') loopStart = t;
        else if (m === 'loopend') loopEnd = t;
      } else if (e.kind === 'on') {
        const n = { t, end: t, ch: e.ch, key: e.key, vel: e.vel };
        const k = e.ch * 128 + e.key;
        if (!open.has(k)) open.set(k, []);
        open.get(k).push(n);
        notes.push(n);
      } else if (e.kind === 'off') {
        const q = open.get(e.ch * 128 + e.key);
        if (q && q.length) q.shift().end = t;
      } else ctrl.push({ t, ch: e.ch, kind: e.kind, n: e.n, v: e.v });
    }
    for (const n of notes) if (n.end <= n.t) n.end = Math.max(n.t + 0.05, length);
    loopStart = loopStart === null ? 0 : loopStart;
    loopEnd = loopEnd === null ? length : loopEnd;
    const events = ctrl.map(c => Object.assign({ note: false }, c)).concat(notes.map(n => Object.assign({ note: true }, n)));
    events.sort((x, y) => x.t - y.t || x.note - y.note);
    const first = Math.max(0, events.findIndex(e => e.t >= loopStart));
    return { tpb, notes, ctrl, events, first, loopStart, loopEnd, length };
  }

  function load(url) {
    if (!songs.has(url)) {
      const pr = fetch(url).then(r => { if (!r.ok) throw new Error(r.status + ' ' + url); return r.arrayBuffer(); }).then(parse);
      pr.catch(() => songs.delete(url));
      songs.set(url, pr);
    }
    return songs.get(url);
  }

  const SPECTRA = {
    piano: [0, 1, 0.5, 0.3, 0.18, 0.12, 0.08, 0.05, 0.035, 0.025, 0.018, 0.012, 0.008],
    horn: [0, 1, 0.78, 0.52, 0.33, 0.2, 0.12, 0.07, 0.04, 0.025],
    string: [0, 1, 0.46, 0.29, 0.21, 0.16, 0.12, 0.09, 0.07, 0.055, 0.044, 0.035, 0.028, 0.022, 0.018, 0.014],
    bass: [0, 0.45, 1, 0.62, 0.42, 0.27, 0.17, 0.11, 0.07, 0.045, 0.03],
    voice: [0, 1, 0.62, 0.36, 0.42, 0.28, 0.12, 0.1, 0.07, 0.04, 0.025],
    brass: [0, 1, 0.86, 0.68, 0.52, 0.4, 0.3, 0.22, 0.16, 0.12, 0.09, 0.065, 0.048, 0.035],
    sub: [0, 1, 0.42, 0.2, 0.09, 0.04],
    pluck: [0, 1, 0.72, 0.5, 0.34, 0.24, 0.16, 0.11, 0.08, 0.055, 0.04, 0.028, 0.02],
    flute: [0, 1, 0.3, 0.11, 0.045, 0.02, 0.008]
  };
  const PATCHES = {
    piano: { wave: 'piano', layers: [[1, -3, 0.62], [1, 4, 0.56]], a: 0.004, sus: 0, rel: 0.3, cut: 520, cutVel: 2700, cutEnv: 2.8, cutT: 0.2, level: 0.36 },
    strings: { wave: 'string', layers: [[1, -9, 0.5], [1, 9, 0.5]], a: 0.2, sus: 1, rel: 0.55, cut: 850, cutVel: 2200, cutKey: 0.3, cutEnv: 1.7, cutT: 0.07, vib: 7, vibDelay: 0.28, level: 0.2 },
    slow: { wave: 'string', layers: [[1, -8, 0.5], [1, 8, 0.5]], a: 0.42, sus: 1, rel: 0.9, cut: 600, cutVel: 1400, cutKey: 0.3, vib: 5, vibDelay: 0.5, level: 0.19 },
    solo: { wave: 'string', layers: [[1, -6, 0.5], [1, 6, 0.5]], a: 0.08, sus: 1, rel: 0.35, cut: 1100, cutVel: 2200, cutKey: 0.3, vib: 14, vibDelay: 0.2, level: 0.24 },
    low: { wave: 'bass', layers: [[1, -7, 0.5], [1, 7, 0.5]], a: 0.07, sus: 1, rel: 0.45, cut: 420, cutVel: 700, cutKey: 0.3, level: 0.36 },
    horn: { wave: 'horn', layers: [[1, -5, 0.55], [1, 5, 0.55]], a: 0.07, sus: 1, rel: 0.4, cut: 520, cutVel: 1250, cutEnv: 1.7, cutT: 0.09, vib: 4, vibDelay: 0.45, level: 0.3 },
    ebass: { wave: 'bass', layers: [[1, -4, 0.55], [1, 4, 0.55]], a: 0.005, sus: 0.6, dec: 0.45, rel: 0.12, cut: 420, cutVel: 900, cutEnv: 2.6, cutT: 0.08, level: 0.42 },
    synbass: { wave: 'sawtooth', layers: [[1, -5, 0.5], [1, 5, 0.5]], a: 0.004, sus: 0.5, dec: 0.22, rel: 0.1, cut: 170, cutVel: 700, cutEnv: 5, cutT: 0.07, level: 0.4 },
    lead: { wave: 'sawtooth', layers: [[1, -7, 0.5], [1, 7, 0.5]], a: 0.008, sus: 0.55, dec: 0.3, rel: 0.12, cut: 700, cutVel: 2200, cutKey: 0.3, cutEnv: 2.4, cutT: 0.09, vib: 6, vibDelay: 0.25, level: 0.16 },
    dist: { wave: 'sawtooth', layers: [[1, -8, 0.5], [1, 8, 0.5], [0.5, 0, 0.3]], a: 0.004, sus: 0.8, dec: 0.9, rel: 0.08, cut: 1800, cutVel: 1600, level: 0.18 },
    voice: { wave: 'voice', layers: [[1, -6, 0.5], [1, 6, 0.5]], a: 0.07, sus: 1, rel: 0.28, cut: 1200, cutVel: 1800, cutKey: 0.2, vib: 16, vibDelay: 0.15, level: 0.3 },
    brass: { wave: 'brass', layers: [[1, -6, 0.5], [1, 6, 0.5]], a: 0.025, sus: 0.8, dec: 0.55, rel: 0.22, cut: 520, cutVel: 2400, cutKey: 0.25, cutEnv: 2.1, cutT: 0.07, vib: 5, vibDelay: 0.4, level: 0.27 },
    sub: { wave: 'sub', layers: [[1, 0, 1]], a: 0.006, sus: 0.85, dec: 0.7, rel: 0.12, cut: 700, cutVel: 500, level: 0.5 },
    drop: { wave: 'sub', layers: [[1, 0, 1]], a: 0.004, sus: 0.7, dec: 0.5, rel: 0.2, cut: 900, cutVel: 600, glide: 0.5, level: 0.55 },
    bell: { wave: 'sine', layers: [[1, 0, 0.55], [1, 7, 0.3], [2.76, 0, 0.2], [5.4, 0, 0.08], [8.93, 0, 0.03]], keep: true, a: 0.002, sus: 0, rel: 1.1, cut: 7000, cutVel: 6000, level: 0.2 },
    mallet: { wave: 'sine', layers: [[1, 0, 0.62], [1, -6, 0.3], [4, 0, 0.14], [10, 0, 0.03]], keep: true, a: 0.002, sus: 0, rel: 0.6, cut: 6000, cutVel: 4000, level: 0.24 },
    pluck: { wave: 'pluck', layers: [[1, -4, 0.55], [1, 4, 0.55]], a: 0.002, sus: 0, dec: 0.5, rel: 0.25, cut: 700, cutVel: 2600, cutKey: 0.3, cutEnv: 4, cutT: 0.06, level: 0.3 },
    flute: { wave: 'flute', layers: [[1, -3, 0.6], [1, 3, 0.5]], a: 0.05, sus: 1, rel: 0.16, cut: 2400, cutVel: 2600, cutKey: 0.4, vib: 6, vibDelay: 0.3, level: 0.26 }
  };
  const patchFor = prog => {
    if (prog < 8 || prog === 45 || prog === 46) return PATCHES.piano;
    if (prog >= 29 && prog <= 31) return PATCHES.dist;
    if (prog >= 32 && prog <= 37) return PATCHES.ebass;
    if (prog === 38) return PATCHES.synbass;
    if (prog === 39) return PATCHES.sub;
    if (prog === 118) return PATCHES.drop;
    if ((prog >= 56 && prog <= 59) || (prog >= 61 && prog <= 63)) return PATCHES.brass;
    if (prog === 40 || prog === 41) return PATCHES.solo;
    if (prog === 42 || prog === 43) return PATCHES.low;
    if (prog >= 52 && prog <= 54) return PATCHES.voice;
    if (prog === 49 || prog === 51 || (prog >= 88 && prog < 96)) return PATCHES.slow;
    if (prog >= 56 && prog < 72) return PATCHES.horn;
    if (prog >= 80 && prog < 88) return PATCHES.lead;
    if (prog >= 8 && prog <= 15) return prog >= 11 && prog <= 13 ? PATCHES.mallet : PATCHES.bell;
    if (prog >= 24 && prog <= 28) return PATCHES.pluck;
    if (prog === 72 || (prog >= 74 && prog <= 79)) return PATCHES.flute;
    return PATCHES.strings;
  };
  const TOMS = { 41: 82, 43: 98, 45: 117, 47: 140, 48: 165, 50: 196 };
  const hz = key => 440 * Math.pow(2, (key - 69) / 12);

  class Player {
    constructor(ctx, out, song) {
      this.ctx = ctx;
      this.song = song;
      this.chans = [];
      this.timer = null;
      this.waves = {};
      this.master = ctx.createGain();
      this.master.gain.value = LEVEL;
      this.comp = ctx.createDynamicsCompressor();
      this.comp.threshold.value = -10; this.comp.knee.value = 8; this.comp.ratio.value = 2.5; this.comp.attack.value = 0.008; this.comp.release.value = 0.3;
      this.bus = ctx.createGain();
      this.hp = ctx.createBiquadFilter();
      this.hp.type = 'highpass'; this.hp.frequency.value = 34; this.hp.Q.value = 0.6;
      this.bus.connect(this.hp); this.hp.connect(this.comp); this.comp.connect(this.master); this.master.connect(out);
      this.verb = ctx.createConvolver();
      this.verb.buffer = this.impulse(2.1);
      this.verbHp = ctx.createBiquadFilter();
      this.verbHp.type = 'highpass'; this.verbHp.frequency.value = 190; this.verbHp.Q.value = 0.6;
      this.verb.connect(this.verbHp); this.verbHp.connect(this.bus);
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const nd = this.noise.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    }

    impulse(secs) {
      const sr = this.ctx.sampleRate, n = Math.floor(sr * secs), b = this.ctx.createBuffer(2, n, sr);
      for (let c = 0; c < 2; c++) {
        const d = b.getChannelData(c);
        let lp = 0;
        for (let i = 0; i < n; i++) {
          const t = i / sr, k = 0.55 - 0.4 * (t / secs);
          lp += k * ((Math.random() * 2 - 1) - lp);
          d[i] = lp * Math.exp(-t / 0.45) * Math.min(1, t / 0.015);
        }
      }
      return b;
    }

    wave(name) {
      if (!SPECTRA[name]) return null;
      if (!this.waves[name]) {
        const re = new Float32Array(SPECTRA[name].length), im = Float32Array.from(SPECTRA[name]);
        this.waves[name] = this.ctx.createPeriodicWave(re, im);
      }
      return this.waves[name];
    }

    chan(n) {
      if (this.chans[n]) return this.chans[n];
      const c = this.ctx, ch = { prog: 0, vol: 100, expr: 127, bright: 1, gain: c.createGain(), pan: c.createStereoPanner(), send: c.createGain(), input: null, shaper: null };
      ch.input = ch.gain;
      ch.gain.gain.value = this.level(ch);
      ch.send.gain.value = 40 / 127;
      ch.gain.connect(ch.pan); ch.pan.connect(this.bus); ch.pan.connect(ch.send); ch.send.connect(this.verb);
      return (this.chans[n] = ch);
    }

    level(ch) { return Math.pow(ch.vol / 127, 2) * Math.pow(ch.expr / 127, 2); }

    drive(ch) {
      if (ch.shaper) return;
      const c = this.ctx, n = 1024, curve = new Float32Array(n), cab = c.createBiquadFilter();
      for (let i = 0; i < n; i++) curve[i] = Math.tanh((i / (n - 1) * 2 - 1) * 7) * 0.32;
      ch.shaper = c.createWaveShaper();
      ch.shaper.curve = curve;
      cab.type = 'lowpass'; cab.frequency.value = 4600; cab.Q.value = 0.8;
      ch.shaper.connect(cab); cab.connect(ch.gain);
      ch.input = ch.shaper;
    }

    control(e, at) {
      const ch = this.chan(e.ch);
      if (e.kind === 'prog') { ch.prog = e.v; if (e.v >= 29 && e.v <= 31) this.drive(ch); return; }
      if (e.n === 7 || e.n === 11) {
        if (e.n === 7) ch.vol = e.v; else ch.expr = e.v;
        ch.gain.gain.setTargetAtTime(this.level(ch), at, 0.03);
      } else if (e.n === 10) ch.pan.pan.setValueAtTime(Math.max(-1, Math.min(1, (e.v - 64) / 63)), at);
      else if (e.n === 91) ch.send.gain.setValueAtTime(e.v / 127, at);
      else if (e.n === 74) ch.bright = Math.pow(2, (e.v - 64) / 32);
    }

    note(e, t, end) {
      const ch = this.chan(e.ch);
      if (e.ch === 9) return this.drum(ch, e.key, e.vel, t);
      if (ch.prog === 119) return this.swell(ch, e.vel, t, end);
      this.voice(ch, patchFor(ch.prog), e.key, e.vel, t, end);
    }

    voice(ch, P, key, vel, t, end) {
      const c = this.ctx, v = vel / 127, f = hz(key);
      const amp = c.createGain(), lp = c.createBiquadFilter();
      const dur = end - t, short = dur < 0.3, a = Math.min(P.a, dur * 0.15), peak = P.level * v * v;
      const cut = Math.min(16000, (P.cut + P.cutVel * v) * ch.bright * Math.pow(2, ((key - 60) / 12) * (P.cutKey || 0)));
      lp.type = 'lowpass'; lp.Q.value = 0.6;
      if (P.cutEnv) {
        lp.frequency.setValueAtTime(Math.min(18000, cut * P.cutEnv), t);
        lp.frequency.setTargetAtTime(cut, t + 0.005, P.cutT);
        lp.frequency.setValueAtTime(cut, t + 0.005 + P.cutT * 5);
      }
      else lp.frequency.setValueAtTime(cut, t);
      amp.gain.setValueAtTime(0, t);
      amp.gain.linearRampToValueAtTime(peak, t + a);
      if (P.sus < 1) amp.gain.setTargetAtTime(peak * P.sus, t + a, P.dec || 0.35 + 3.4 * Math.pow(2, -(key - 48) / 14));
      amp.gain.setTargetAtTime(0, end, P.rel / 3);
      lp.connect(amp); amp.connect(ch.input);
      const stop = end + P.rel * 1.5 + 0.05;
      let depth = null;
      if (P.vib && dur > P.vibDelay + 0.15) {
        const lfo = c.createOscillator();
        depth = c.createGain();
        lfo.frequency.value = 4.8 + Math.random() * 1.1;
        depth.gain.setValueAtTime(0, t);
        depth.gain.setValueAtTime(0, t + P.vibDelay);
        depth.gain.linearRampToValueAtTime(P.vib, t + P.vibDelay + 0.35);
        lfo.connect(depth);
        lfo.start(t); lfo.stop(stop);
      }
      const wave = this.wave(P.wave);
      const layers = short && P.layers.length > 1 && !P.keep ? [[P.layers[0][0], 0, Math.hypot(...P.layers.filter(l => l[0] === P.layers[0][0]).map(l => l[2]))]] : P.layers;
      for (const [ratio, cents, g] of layers) {
        const o = c.createOscillator(), og = c.createGain();
        if (wave) o.setPeriodicWave(wave); else o.type = P.wave;
        o.frequency.setValueAtTime(f * ratio, t);
        if (P.glide) o.frequency.exponentialRampToValueAtTime(f * ratio * P.glide, stop);
        o.detune.value = cents + (Math.random() - 0.5) * 3;
        og.gain.value = g;
        o.connect(og); og.connect(lp);
        if (depth) depth.connect(o.detune);
        o.start(t); o.stop(stop);
      }
    }

    noiseSource(t, dur) {
      const s = this.ctx.createBufferSource();
      s.buffer = this.noise; s.loop = true;
      s.start(t, Math.random() * 1.5); s.stop(t + dur);
      return s;
    }

    swell(ch, vel, t, end) {
      const c = this.ctx, dur = Math.max(0.1, end - t), v = vel / 127;
      const hp = c.createBiquadFilter(), bp = c.createBiquadFilter(), g = c.createGain();
      hp.type = 'highpass'; hp.frequency.value = 2600;
      bp.type = 'bandpass'; bp.Q.value = 0.5; bp.frequency.setValueAtTime(3500, t); bp.frequency.exponentialRampToValueAtTime(9000, end);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16 * v, end); g.gain.setTargetAtTime(0, end, 0.03);
      this.noiseSource(t, dur + 0.2).connect(hp); hp.connect(bp); bp.connect(g); g.connect(ch.input);
    }

    noiseHit(ch, t, type, freq, q, level, tau) {
      const c = this.ctx, f = c.createBiquadFilter(), g = c.createGain();
      f.type = type; f.frequency.value = freq; f.Q.value = q;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + 0.002); g.gain.setTargetAtTime(0, t + 0.004, tau);
      this.noiseSource(t, tau * 7 + 0.02).connect(f); f.connect(g); g.connect(ch.input);
    }

    toneHit(ch, t, type, f0, f1, glide, level, tau) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + glide);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + 0.003); g.gain.setTargetAtTime(0, t + 0.006, tau);
      o.connect(g); g.connect(ch.input); o.start(t); o.stop(t + tau * 7 + 0.02);
    }

    drum(ch, key, vel, t) {
      const c = this.ctx, v = vel / 127;
      if (key === 35) {
        this.toneHit(ch, t, 'sine', 74, 50, 0.25, 0.3 * v, 0.35);
        this.noiseHit(ch, t, 'lowpass', 320, 0.7, 0.3 * v, 0.09);
        return;
      }
      if (key === 36) {
        this.toneHit(ch, t, 'sine', 150, 46, 0.07, 0.4 * v, 0.09);
        this.noiseHit(ch, t, 'highpass', 1600, 0.7, 0.14 * v, 0.006);
        return;
      }
      if (key === 38 || key === 40) {
        this.noiseHit(ch, t, 'bandpass', 2300, 0.6, 0.44 * v, 0.06);
        this.toneHit(ch, t, 'triangle', 190, 160, 0.05, 0.18 * v, 0.04);
        return;
      }
      if (key === 42 || key === 44 || key === 46) {
        this.noiseHit(ch, t, 'highpass', 7000, 0.7, 0.24 * v, key === 46 ? 0.1 : 0.022);
        return;
      }
      if (TOMS[key]) {
        this.toneHit(ch, t, 'sine', TOMS[key], TOMS[key] * 0.72, 0.25, 0.3 * v, 0.13);
        this.noiseHit(ch, t, 'lowpass', 900, 0.7, 0.1 * v, 0.03);
        return;
      }
      if (key === 39) {
        for (let i = 0; i < 3; i++) this.noiseHit(ch, t + i * 0.011, 'bandpass', 1300, 1.1, 0.3 * v, i < 2 ? 0.006 : 0.05);
        return;
      }
      if (key === 54) {
        this.noiseHit(ch, t, 'highpass', 6500, 0.8, 0.2 * v, 0.05);
        this.noiseHit(ch, t + 0.012, 'bandpass', 9000, 3, 0.12 * v, 0.07);
        return;
      }
      if (key === 70) {
        this.noiseHit(ch, t, 'highpass', 5200, 0.9, 0.16 * v, 0.018);
        return;
      }
      const crash = key === 49 || key === 57 || key === 52 || key === 55;
      const hp = c.createBiquadFilter(), lp = c.createBiquadFilter(), g = c.createGain(), dur = crash ? 3.2 : 0.9;
      hp.type = 'highpass'; hp.frequency.value = crash ? 2200 : 4800;
      lp.type = 'lowpass'; lp.frequency.value = key === 57 ? 6500 : 9000; lp.Q.value = 0.5;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.19 * v, t + 0.004); g.gain.setTargetAtTime(0, t + 0.02, dur / 5);
      this.noiseSource(t, dur).connect(hp); hp.connect(lp); lp.connect(g); g.connect(ch.input);
    }

    start(at) {
      this.base = (at === undefined ? this.ctx.currentTime : at) + 0.06;
      this.i = 0;
      this.pump(this.ctx.currentTime + LOOKAHEAD);
      this.timer = setInterval(() => this.pump(this.ctx.currentTime + LOOKAHEAD), TICK_MS);
    }

    pump(until) {
      const S = this.song, span = S.loopEnd - S.loopStart, loops = span > 0.25 && S.first < S.events.length;
      for (let guard = 0; guard < 100000; guard++) {
        const e = S.events[this.i];
        if (!e || e.t >= S.loopEnd) {
          if (!loops) return;
          this.base += span;
          this.i = S.first;
          continue;
        }
        const at = this.base + e.t;
        if (at >= until) return;
        this.i++;
        if (e.note) this.note(e, at, this.base + Math.min(e.end, S.loopEnd));
        else this.control(e, at);
      }
    }

    stop() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(0, t, 0.08);
      setTimeout(() => { try { this.master.disconnect(); } catch (err) { } }, 700);
    }
  }

  H.Midi = { parse, load, Player };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
