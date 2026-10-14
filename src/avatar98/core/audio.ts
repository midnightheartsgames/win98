import type { MusicChannel, MusicTrack, SfxDef } from '../data/types.ts';

const NOTE_BASE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function noteToMidi(tok: string): number | null {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(tok);
  if (!m) return null;
  let n = NOTE_BASE[m[1]];
  if (m[2] === '#') n++;
  if (m[2] === 'b') n--;
  return n + (parseInt(m[3], 10) + 1) * 12;
}

const CHORDS: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  add9: [0, 4, 7, 14],
  m9: [0, 3, 7, 14],
  '5': [0, 7]
};

export function chordNotes(sym: string, octave: number): number[] {
  const m = /^([A-G])([#b]?)(.*)$/.exec(sym);
  if (!m) throw new Error(`bad chord "${sym}"`);
  let root = NOTE_BASE[m[1]];
  if (m[2] === '#') root++;
  if (m[2] === 'b') root--;
  const q = CHORDS[m[3]];
  if (!q) throw new Error(`unknown chord quality "${m[3]}" in "${sym}"`);
  return q.map((i) => root + i + (octave + 1) * 12);
}

export interface NoteEvent {
  step: number;
  dur: number;
  midi: number[];
  drum?: string;
}

function expand(src: string): string[] {
  const out: string[] = [];
  for (const raw of src.split(/\s+/)) {
    if (!raw || raw === '|') continue;
    const m = /^(.+)\*(\d+)$/.exec(raw);
    if (m) {
      const n = parseInt(m[2], 10);
      out.push(m[1]);
      for (let i = 1; i < n; i++) out.push(m[1] === '.' ? '.' : '-');
    } else out.push(raw);
  }
  return out;
}

export function compileChannel(ch: MusicChannel, steps: number): NoteEvent[] {
  const evs: NoteEvent[] = [];
  if (ch.drums) {
    const s = ch.drums.replace(/\s+/g, '');
    for (let i = 0; i < steps; i++) {
      const c = s[i % s.length];
      if (c !== '.') evs.push({ step: i, dur: 1, midi: [], drum: c });
    }
    return evs;
  }
  if (ch.notes) {
    const toks = expand(ch.notes);
    let cur: NoteEvent | null = null;
    for (let i = 0; i < steps; i++) {
      const t = toks[i % toks.length];
      if (t === '-') {
        if (cur) cur.dur++;
        continue;
      }
      cur = null;
      if (t === '.') continue;
      const midi = noteToMidi(t);
      if (midi === null) throw new Error(`bad note "${t}"`);
      cur = { step: i, dur: 1, midi: [midi + (ch.octave ?? 0) * 12] };
      evs.push(cur);
    }
    return evs;
  }
  if (ch.chords) {
    const seq: string[] = [];
    for (const raw of ch.chords.split(/\s+/)) {
      if (!raw || raw === '|') continue;
      const m = /^(.+)\*(\d+)$/.exec(raw);
      const n = m ? parseInt(m[2], 10) : 16;
      for (let i = 0; i < n; i++) seq.push(m ? m[1] : raw);
    }
    const pat = expand(ch.pattern ?? 'a*16');
    let cur: NoteEvent | null = null;
    for (let i = 0; i < steps; i++) {
      const chord = chordNotes(seq[i % seq.length], ch.octave ?? 4);
      const t = pat[i % pat.length];
      if (t === '-') {
        if (cur) cur.dur++;
        continue;
      }
      cur = null;
      if (t === '.') continue;
      let midi: number[];
      if (t === 'a') midi = chord;
      else if (t === 'r') midi = [chord[0] - 12];
      else {
        const k = parseInt(t, 10);
        if (Number.isNaN(k)) throw new Error(`bad pattern token "${t}"`);
        midi = [chord[k % chord.length] + 12 * Math.floor(k / chord.length)];
      }
      cur = { step: i, dur: 1, midi };
      evs.push(cur);
    }
    return evs;
  }
  return evs;
}

const mtof = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);

interface Compiled {
  track: MusicTrack;
  byStep: { ch: number; ev: NoteEvent }[][];
}

export class Audio {
  ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private echo: DelayNode | null = null;
  private echoGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private tracks: Record<string, MusicTrack> = {};
  private sfxDefs: Record<string, SfxDef> = {};
  private compiled = new Map<string, Compiled>();
  private current: Compiled | null = null;
  private step = 0;
  private nextTime = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private pendingTrack: string | null = null;
  private trackGain: GainNode | null = null;
  musicVol = 0.6;
  sfxVol = 0.8;
  currentId: string | null = null;
  enabled = true;

  setData(tracks: Record<string, MusicTrack>, sfx: Record<string, SfxDef>): void {
    this.tracks = tracks;
    this.sfxDefs = sfx;
  }

  compile(id: string): Compiled {
    let c = this.compiled.get(id);
    if (c) return c;
    const track = this.tracks[id];
    if (!track) throw new Error(`unknown music track "${id}"`);
    const byStep: Compiled['byStep'] = Array.from({ length: track.steps }, () => []);
    track.channels.forEach((ch, i) => {
      for (const ev of compileChannel(ch, track.steps)) byStep[ev.step].push({ ch: i, ev });
    });
    c = { track, byStep };
    this.compiled.set(id, c);
    return c;
  }

  unlock(): void {
    if (this.ctx || !this.enabled) return;
    const AC = (globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch {
      this.ctx = null;
      return;
    }
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(ctx.destination);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = this.musicVol * 0.5;
    this.musicBus.connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = this.sfxVol * 0.6;
    this.sfxBus.connect(this.master);
    this.echo = ctx.createDelay(1);
    this.echo.delayTime.value = 0.28;
    this.echoGain = ctx.createGain();
    this.echoGain.gain.value = 0.25;
    this.echo.connect(this.echoGain);
    this.echoGain.connect(this.echo);
    this.echoGain.connect(this.musicBus);
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    let s = 12345;
    for (let i = 0; i < len; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      d[i] = (s / 0x7fffffff) * 2 - 1;
    }
    this.timer = setInterval(() => this.schedule(), 25);
    if (this.pendingTrack) {
      const t = this.pendingTrack;
      this.pendingTrack = null;
      this.play(t);
    }
  }

  applyVolume(): void {
    if (!this.ctx || !this.musicBus || !this.sfxBus) return;
    this.musicBus.gain.setTargetAtTime(this.musicVol * 0.5, this.ctx.currentTime, 0.05);
    this.sfxBus.gain.setTargetAtTime(this.sfxVol * 0.6, this.ctx.currentTime, 0.05);
  }

  play(id: string): void {
    if (id === this.currentId && (this.current || this.pendingTrack === id)) return;
    this.currentId = id;
    if (!this.ctx) {
      this.pendingTrack = id;
      return;
    }
    this.fadeOutCurrent(0.3);
    this.current = this.compile(id);
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.trackGain = this.ctx.createGain();
    this.trackGain.gain.value = 1;
    this.trackGain.connect(this.musicBus as GainNode);
    if (this.echo) {
      const send = this.ctx.createGain();
      send.gain.value = this.current.track.echo ?? 0.3;
      this.trackGain.connect(send);
      send.connect(this.echo);
    }
  }

  private fadeOutCurrent(sec: number): void {
    if (!this.ctx || !this.trackGain) return;
    const g = this.trackGain;
    g.gain.setTargetAtTime(0, this.ctx.currentTime, sec / 3);
    setTimeout(() => g.disconnect(), sec * 1000 + 400);
    this.trackGain = null;
  }

  stop(fade = 0.5): void {
    this.fadeOutCurrent(fade);
    this.current = null;
    this.currentId = null;
    this.pendingTrack = null;
  }

  suspend(): void {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => undefined);
  }

  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => undefined);
      if (this.current) this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.05);
    }
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || !this.current || !this.trackGain || ctx.state !== 'running') return;
    const tr = this.current.track;
    const stepDur = 60 / tr.bpm / 4;
    if (this.nextTime < ctx.currentTime - 0.2) this.nextTime = ctx.currentTime + 0.02;
    while (this.nextTime < ctx.currentTime + 0.12) {
      const swing = tr.swing && this.step % 2 === 1 ? stepDur * tr.swing : 0;
      for (const { ch, ev } of this.current.byStep[this.step]) this.voice(tr.channels[ch], ev, this.nextTime + swing, stepDur);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % tr.steps;
    }
  }

  private voice(ch: MusicChannel, ev: NoteEvent, t: number, stepDur: number): void {
    const ctx = this.ctx as AudioContext;
    let out: AudioNode = this.trackGain as GainNode;
    if (ch.pan) {
      const p = ctx.createStereoPanner();
      p.pan.value = ch.pan;
      p.connect(out);
      out = p;
      setTimeout(() => p.disconnect(), (t - ctx.currentTime + ev.dur * stepDur + 2) * 1000);
    }
    if (ev.drum) {
      this.drum(ev.drum, t, ch.vol, out);
      return;
    }
    const dur = ev.dur * stepDur;
    for (const m of ev.midi) this.inst(ch.inst, mtof(m), t, dur, ch.vol / Math.sqrt(ev.midi.length), out);
  }

  private env(g: GainNode, t: number, a: number, peak: number, d: number, sus: number, dur: number, r: number): number {
    const p = g.gain;
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(peak, t + a);
    p.setTargetAtTime(peak * sus, t + a, d / 3);
    const end = t + Math.max(dur, a + 0.01);
    p.setTargetAtTime(0.0001, end, r / 3);
    return end + r + 0.05;
  }

  private osc(type: OscillatorType, f: number, t: number, stop: number, dest: AudioNode, detune = 0): OscillatorNode {
    const ctx = this.ctx as AudioContext;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.detune.value = detune;
    o.connect(dest);
    o.start(t);
    o.stop(stop);
    return o;
  }

  private pulseWave(duty: number): PeriodicWave {
    const ctx = this.ctx as AudioContext;
    const n = 32;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    for (let k = 1; k < n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return ctx.createPeriodicWave(real, imag);
  }

  private waves: Record<string, PeriodicWave> = {};

  private inst(name: string, f: number, t: number, dur: number, vol: number, dest: AudioNode): void {
    const ctx = this.ctx as AudioContext;
    const g = ctx.createGain();
    g.connect(dest);
    let stop: number;
    switch (name) {
      case 'pulse':
      case 'square': {
        stop = this.env(g, t, 0.005, vol * 0.5, 0.1, 0.6, dur * 0.95, 0.06);
        const o = ctx.createOscillator();
        const key = name === 'pulse' ? 'p25' : 'p50';
        if (!this.waves[key]) this.waves[key] = this.pulseWave(name === 'pulse' ? 0.25 : 0.5);
        o.setPeriodicWave(this.waves[key]);
        o.frequency.value = f;
        o.connect(g);
        o.start(t);
        o.stop(stop);
        break;
      }
      case 'tri':
        stop = this.env(g, t, 0.004, vol, 0.08, 0.8, dur * 0.95, 0.05);
        this.osc('triangle', f, t, stop, g);
        break;
      case 'bass': {
        stop = this.env(g, t, 0.004, vol, 0.12, 0.7, dur * 0.9, 0.05);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 900;
        lp.connect(g);
        this.osc('triangle', f, t, stop, lp);
        this.osc('square', f / 2, t, stop, lp).detune.value = 0;
        break;
      }
      case 'saw':
        stop = this.env(g, t, 0.01, vol * 0.4, 0.2, 0.6, dur, 0.1);
        this.osc('sawtooth', f, t, stop, g);
        break;
      case 'pad': {
        stop = this.env(g, t, Math.min(0.4, dur * 0.4), vol * 0.28, 0.5, 0.8, dur, 0.5);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1400;
        lp.Q.value = 0.5;
        lp.connect(g);
        this.osc('sawtooth', f, t, stop, lp, -7);
        this.osc('sawtooth', f, t, stop, lp, 7);
        break;
      }
      case 'bell': {
        stop = this.env(g, t, 0.002, vol * 0.6, 0.6, 0.0, Math.max(dur, 0.3), 0.6);
        this.osc('sine', f, t, stop, g);
        const g2 = ctx.createGain();
        g2.gain.value = 0.35;
        g2.connect(g);
        this.osc('sine', f * 2.76, t, stop, g2);
        const g3 = ctx.createGain();
        g3.gain.value = 0.15;
        g3.connect(g);
        this.osc('sine', f * 5.4, t, stop, g3);
        break;
      }
      case 'pluck': {
        stop = this.env(g, t, 0.002, vol * 0.7, 0.25, 0.0, Math.max(dur, 0.25), 0.2);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(f * 8, t);
        lp.frequency.exponentialRampToValueAtTime(Math.max(200, f * 1.5), t + 0.3);
        lp.connect(g);
        this.osc('sawtooth', f, t, stop, lp);
        this.osc('square', f * 1.003, t, stop, lp);
        break;
      }
      case 'flute': {
        stop = this.env(g, t, 0.06, vol * 0.7, 0.2, 0.85, dur, 0.12);
        const o = this.osc('triangle', f, t, stop, g);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 5.2;
        const lg = ctx.createGain();
        lg.gain.value = f * 0.012;
        lfo.connect(lg);
        lg.connect(o.frequency);
        lfo.start(t + 0.12);
        lfo.stop(stop);
        const ng = ctx.createGain();
        ng.gain.value = 0.04;
        ng.connect(g);
        this.noiseSrc(t, Math.min(stop, t + 0.08), ng, 'bandpass', f * 2);
        break;
      }
      case 'erhu': {
        stop = this.env(g, t, 0.05, vol * 0.45, 0.2, 0.8, dur, 0.1);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = f * 2.5;
        bp.Q.value = 0.8;
        bp.connect(g);
        const o = this.osc('sawtooth', f, t, stop, bp);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 6;
        const lg = ctx.createGain();
        lg.gain.setValueAtTime(0, t);
        lg.gain.linearRampToValueAtTime(f * 0.018, t + 0.25);
        lfo.connect(lg);
        lg.connect(o.frequency);
        lfo.start(t);
        lfo.stop(stop);
        break;
      }
      case 'organ':
        stop = this.env(g, t, 0.01, vol * 0.35, 0.1, 0.9, dur, 0.08);
        this.osc('sine', f, t, stop, g);
        this.osc('sine', f * 2, t, stop, g);
        this.osc('square', f * 4, t, stop, g).detune.value = 3;
        break;
      case 'koto': {
        stop = this.env(g, t, 0.001, vol * 0.8, 0.4, 0.0, Math.max(dur, 0.4), 0.3);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(f * 6, t);
        lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.2), t + 0.5);
        lp.connect(g);
        this.osc('triangle', f, t, stop, lp);
        this.osc('sawtooth', f * 2, t, stop, lp).detune.value = 4;
        break;
      }
      default:
        stop = this.env(g, t, 0.005, vol * 0.5, 0.1, 0.6, dur, 0.06);
        this.osc('square', f, t, stop, g);
    }
    setTimeout(() => g.disconnect(), (stop - ctx.currentTime + 0.5) * 1000);
  }

  private noiseSrc(t: number, stop: number, dest: AudioNode, filter?: BiquadFilterType, freq?: number): AudioBufferSourceNode {
    const ctx = this.ctx as AudioContext;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    let out: AudioNode = dest;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = filter;
      f.frequency.value = freq ?? 1000;
      f.connect(dest);
      out = f;
    }
    src.connect(out);
    src.start(t, Math.random() * 0.5);
    src.stop(stop);
    return src;
  }

  private drum(c: string, t: number, vol: number, dest: AudioNode): void {
    const ctx = this.ctx as AudioContext;
    const g = ctx.createGain();
    g.connect(dest);
    const hit = (peak: number, decay: number): number => {
      g.gain.setValueAtTime(peak, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      return t + decay + 0.02;
    };
    const sweep = (f0: number, f1: number, time: number, type: OscillatorType, stop: number) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + time);
      o.connect(g);
      o.start(t);
      o.stop(stop);
    };
    let stop = t + 0.3;
    switch (c) {
      case 'k':
        stop = hit(vol * 1.2, 0.22);
        sweep(140, 42, 0.14, 'sine', stop);
        break;
      case 's':
        stop = hit(vol * 0.7, 0.16);
        this.noiseSrc(t, stop, g, 'bandpass', 1800);
        sweep(220, 150, 0.08, 'triangle', stop);
        break;
      case 'x':
        stop = hit(vol * 0.6, 0.15);
        this.noiseSrc(t, stop, g, 'highpass', 2500);
        break;
      case 'h':
        stop = hit(vol * 0.25, 0.04);
        this.noiseSrc(t, stop, g, 'highpass', 7000);
        break;
      case 'o':
        stop = hit(vol * 0.22, 0.22);
        this.noiseSrc(t, stop, g, 'highpass', 6000);
        break;
      case 't':
        stop = hit(vol * 0.9, 0.25);
        sweep(160, 80, 0.2, 'sine', stop);
        break;
      case 'T':
        stop = hit(vol * 0.8, 0.2);
        sweep(260, 140, 0.18, 'sine', stop);
        break;
      case 'c':
        stop = hit(vol * 0.3, 1.2);
        this.noiseSrc(t, stop, g, 'highpass', 4000);
        break;
      case 'g': {
        stop = hit(vol * 0.5, 2.2);
        for (const f of [110, 163, 227, 331]) {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.value = f;
          o.connect(g);
          o.start(t);
          o.stop(stop);
        }
        break;
      }
      case 'w':
        stop = hit(vol * 0.5, 0.06);
        sweep(900, 800, 0.05, 'sine', stop);
        break;
      case 'r':
        stop = hit(vol * 0.35, 0.03);
        sweep(1800, 1600, 0.02, 'square', stop);
        break;
      case 'b':
        stop = hit(vol * 1.1, 0.22);
        sweep(140, 42, 0.14, 'sine', stop);
        this.noiseSrc(t, t + 0.04, g, 'highpass', 7000);
        break;
      default:
        return;
    }
    setTimeout(() => g.disconnect(), (stop - ctx.currentTime + 0.5) * 1000);
  }

  sfx(id: string, when = 0): void {
    const ctx = this.ctx;
    const def = this.sfxDefs[id];
    if (!ctx || !def || !this.sfxBus || ctx.state !== 'running') return;
    const t = ctx.currentTime + (def.delay ?? 0) + when;
    const g = ctx.createGain();
    g.connect(this.sfxBus);
    const a = def.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(def.vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + def.dur);
    const stop = t + def.dur + 0.05;
    if (def.wave === 'noise' || def.noiseMix) {
      const ng = ctx.createGain();
      ng.gain.value = def.wave === 'noise' ? 1 : (def.noiseMix ?? 0);
      ng.connect(g);
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 0.9;
      f.frequency.setValueAtTime(def.f0, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(40, def.f1), t + def.dur);
      src.connect(f);
      f.connect(ng);
      src.start(t);
      src.stop(stop);
    }
    if (def.wave !== 'noise') {
      const o = ctx.createOscillator();
      if (def.wave === 'square' && def.duty && def.duty !== 0.5) {
        const key = `d${def.duty}`;
        if (!this.waves[key]) this.waves[key] = this.pulseWave(def.duty);
        o.setPeriodicWave(this.waves[key]);
      } else o.type = def.wave;
      if (def.steps && def.steps.length) {
        const sd = def.dur / def.steps.length;
        def.steps.forEach((m, i) => o.frequency.setValueAtTime(def.f0 * m, t + i * sd));
      } else {
        o.frequency.setValueAtTime(def.f0, t);
        o.frequency.exponentialRampToValueAtTime(Math.max(20, def.f1), t + def.dur);
      }
      if (def.vib) {
        const l = ctx.createOscillator();
        l.frequency.value = 12;
        const lg = ctx.createGain();
        lg.gain.value = def.vib;
        l.connect(lg);
        lg.connect(o.frequency);
        l.start(t);
        l.stop(stop);
      }
      o.connect(g);
      o.start(t);
      o.stop(stop);
    }
    setTimeout(() => g.disconnect(), (stop - ctx.currentTime + 0.3) * 1000);
    if (def.layer) this.sfx(def.layer, when);
  }

  destroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.ctx?.close().catch(() => undefined);
    this.ctx = null;
  }
}
