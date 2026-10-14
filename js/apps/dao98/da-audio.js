(function (D) {
  'use strict';
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
  const TRACKS = {
    menu: { bpm: 62, root: 50, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 3, 4], pad: 'choir', drums: 'war', mel: 0.5, bass: 1 },
    castle: { bpm: 84, root: 55, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 3, 4, 0, 5, 3, 4, 4], pad: 'strings', drums: null, mel: 0.7, bass: 1, lute: 1 },
    battle: { bpm: 118, root: 45, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 0, 5, 6, 0, 0, 3, 4], pad: 'choir', drums: 'battle', mel: 0.8, bass: 2 },
    dwarf: { bpm: 70, root: 43, scale: [0, 2, 3, 5, 7, 8, 11], prog: [0, 5, 4, 0], pad: 'horn', drums: 'anvil', mel: 0.4, bass: 1 },
    deep: { bpm: 54, root: 40, scale: [0, 1, 3, 5, 6, 8, 10], prog: [0, 1, 0, 6], pad: 'drone', drums: 'deep', mel: 0.2, bass: 1 },
    alienage: { bpm: 90, root: 57, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 3, 6, 4], pad: 'strings', drums: 'hand', mel: 0.7, bass: 1, lute: 1 },
    tension: { bpm: 76, root: 48, scale: [0, 1, 3, 5, 7, 8, 10], prog: [0, 1, 0, 5], pad: 'strings', drums: 'deep', mel: 0.3, bass: 1 },
    forest: { bpm: 72, root: 57, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 6, 3, 4], pad: 'flute', drums: null, mel: 0.8, bass: 0, lute: 1 },
    ruins: { bpm: 56, root: 45, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 1, 4], pad: 'choir', drums: null, mel: 0.3, bass: 1 },
    fade: { bpm: 50, root: 52, scale: [0, 2, 4, 6, 7, 9, 11], prog: [0, 1, 5, 3], pad: 'glass', drums: null, mel: 0.5, bass: 0 },
    circle: { bpm: 64, root: 50, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 3, 5, 4], pad: 'organ', drums: null, mel: 0.5, bass: 1 },
    ostagar: { bpm: 80, root: 50, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 3, 4, 0, 6, 3, 4, 4], pad: 'horn', drums: 'war', mel: 0.6, bass: 1 },
    wilds: { bpm: 66, root: 45, scale: [0, 1, 3, 5, 7, 8, 10], prog: [0, 5, 0, 6], pad: 'drone', drums: 'hand', mel: 0.4, bass: 1 },
    witch: { bpm: 60, root: 53, scale: [0, 1, 4, 5, 7, 8, 10], prog: [0, 1, 0, 4], pad: 'glass', drums: null, mel: 0.5, bass: 1 },
    lothering: { bpm: 78, root: 55, scale: [0, 2, 4, 5, 7, 9, 10], prog: [0, 4, 5, 3], pad: 'strings', drums: null, mel: 0.7, bass: 1, lute: 1 },
    tavern: { bpm: 112, root: 57, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 3, 4, 4, 0, 3, 4, 0], pad: null, drums: 'hand', mel: 0.9, bass: 1, lute: 1 },
    chantry: { bpm: 58, root: 55, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 3, 4, 0], pad: 'choir', drums: null, mel: 0.4, bass: 0 },
    sad: { bpm: 52, root: 50, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 3, 4], pad: 'strings', drums: null, mel: 0.5, bass: 1 }
  };

  const SPEECH = globalThis.speechSynthesis && globalThis.SpeechSynthesisUtterance ? globalThis.speechSynthesis : null;
  const FEMALE_VOICE = /irina|svetlana|dariya|daria|ekaterina|katya|milena|anna|elena|alena|alyona|female|ирина|светлана|дарья|екатерина|катя|милена|анна|елена|алена|алёна|жен/i;
  const MALE_VOICE = /pavel|dmitry|dmitri|yuri|maxim|nikolai|male|павел|дмитрий|юрий|максим|николай|муж/i;
  const RACE_PITCH = { dwarf: -0.15, qunari: -0.3, darkspawn: -0.45, demon: -0.4, undead: -0.35, beast: -0.3, spirit: 0.1, elf: 0.05 };
  const VOICE_SAMPLES = { m: 'Мор близко. Нам нужен каждый, кто способен держать меч.', f: 'Ступай осторожно. Дикие земли не прощают ошибок.', narr: 'Над лагерем Остагара сгущаются сумерки.' };
  const hashKey = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const voiceSex = v => FEMALE_VOICE.test(v.name) ? 'f' : MALE_VOICE.test(v.name) ? 'm' : '';

  class Audio {
    constructor() {
      this.ok = typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);
      this.ctx = null;
      this.vol = { master: 0.8, music: 0.5, sfx: 0.8 };
      this.speech = { on: true, vol: 0.9, rate: 1, m: '', f: '', narr: '' };
      if (SPEECH) SPEECH.getVoices();
      this.track = null;
      this.next = 0;
      this.step = 0;
      this.timer = null;
      this.last = {};
    }
    init() {
      if (!this.ok || this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = this.vol.master; this.master.connect(this.ctx.destination);
      this.mus = this.ctx.createGain(); this.mus.gain.value = this.vol.music; this.mus.connect(this.master);
      this.sfx = this.ctx.createGain(); this.sfx.gain.value = this.vol.sfx; this.sfx.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.rev = this.ctx.createConvolver();
      const rl = this.ctx.sampleRate * 2.2;
      const rb = this.ctx.createBuffer(2, rl, this.ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const x = rb.getChannelData(c); for (let i = 0; i < rl; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 2.6); }
      this.rev.buffer = rb;
      this.revG = this.ctx.createGain(); this.revG.gain.value = 0.32;
      this.rev.connect(this.revG); this.revG.connect(this.mus);
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    setVol(k, v) { this.vol[k] = v; if (!this.ctx) return; if (k === 'master') this.master.gain.value = v; if (k === 'music') this.mus.gain.value = v; if (k === 'sfx') this.sfx.gain.value = v; }
    env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
    osc(type, f, t, dur, peak, dst, o) {
      const c = this.ctx, os = c.createOscillator(), g = c.createGain();
      os.type = type; os.frequency.setValueAtTime(f, t);
      if (o && o.to) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
      if (o && o.det) os.detune.value = o.det;
      this.env(g, t, (o && o.a) || 0.005, peak, dur);
      os.connect(g);
      if (o && o.filt) { const f2 = c.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = o.filt; g.connect(f2); f2.connect(dst); } else g.connect(dst);
      if (o && o.rev) g.connect(this.rev);
      os.start(t); os.stop(t + ((o && o.a) || 0.005) + dur + 0.05);
    }
    nz(t, dur, peak, type, freq, dst, o) {
      const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = this.noise; f.type = type; f.frequency.setValueAtTime(freq, t);
      if (o && o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
      if (o && o.q) f.Q.value = o.q;
      this.env(g, t, (o && o.a) || 0.003, peak, dur);
      s.connect(f); f.connect(g); g.connect(dst);
      s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.1);
    }
    play(id) {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      if (this.last[id] && now - this.last[id] < 0.04) return;
      this.last[id] = now;
      const t = now + 0.01, S = this.sfx;
      switch (id) {
        case 'swing': case 'whoosh': this.nz(t, 0.18, 0.25, 'bandpass', 900, S, { to: 2500, q: 1.2 }); break;
        case 'hit': this.nz(t, 0.12, 0.5, 'lowpass', 900, S); this.osc('sine', 120, t, 0.12, 0.4, S, { to: 60 }); break;
        case 'hit_armor': this.nz(t, 0.08, 0.35, 'highpass', 2500, S); this.osc('square', 1800 + Math.random() * 400, t, 0.18, 0.08, S, { filt: 4000 }); this.osc('sine', 110, t, 0.1, 0.3, S, { to: 60 }); break;
        case 'hit_crit': this.nz(t, 0.2, 0.6, 'lowpass', 1400, S); this.osc('sine', 90, t, 0.2, 0.6, S, { to: 40 }); break;
        case 'arrow_hit': this.nz(t, 0.06, 0.4, 'bandpass', 1500, S); break;
        case 'bow': this.osc('triangle', 180, t, 0.2, 0.3, S, { to: 90 }); this.nz(t, 0.1, 0.1, 'highpass', 3000, S); break;
        case 'staff': case 'ab_bolt': this.osc('sawtooth', 600, t, 0.3, 0.12, S, { to: 1400, filt: 2000 }); this.osc('sine', 900, t, 0.3, 0.12, S, { to: 300 }); break;
        case 'ab_fire': case 'fire': this.nz(t, 0.6, 0.5, 'lowpass', 600, S, { to: 2400, a: 0.05 }); break;
        case 'ab_heal': case 'heal': [0, 4, 7, 12].forEach((n, i) => this.osc('sine', NOTE(72 + n), t + i * 0.06, 0.6, 0.12, S, { rev: 1 })); break;
        case 'ab_cast': case 'cast': case 'sustain': this.osc('sine', 300, t, 0.5, 0.15, S, { to: 900, rev: 1 }); this.osc('triangle', 450, t, 0.4, 0.08, S, { to: 1200 }); break;
        case 'ab_hit': this.nz(t, 0.18, 0.5, 'lowpass', 700, S); this.osc('sine', 80, t, 0.2, 0.5, S, { to: 40 }); break;
        case 'potion': this.osc('sine', 500, t, 0.1, 0.2, S, { to: 300 }); this.osc('sine', 400, t + 0.12, 0.1, 0.2, S, { to: 250 }); break;
        case 'coins': for (let i = 0; i < 4; i++) this.osc('square', 2000 + Math.random() * 1500, t + i * 0.05, 0.08, 0.05, S, { filt: 6000 }); break;
        case 'door': this.osc('sawtooth', 90, t, 0.5, 0.08, S, { to: 140, filt: 600 }); this.nz(t, 0.3, 0.1, 'lowpass', 400, S); break;
        case 'door_close': this.nz(t, 0.15, 0.4, 'lowpass', 300, S); break;
        case 'locked': this.osc('square', 300, t, 0.05, 0.15, S, { filt: 1500 }); this.osc('square', 250, t + 0.08, 0.05, 0.15, S, { filt: 1500 }); break;
        case 'lockpick': for (let i = 0; i < 3; i++) this.osc('square', 1500 + i * 300, t + i * 0.08, 0.03, 0.08, S, { filt: 5000 }); break;
        case 'chest': case 'loot': this.nz(t, 0.2, 0.3, 'lowpass', 500, S); this.osc('triangle', 220, t, 0.15, 0.1, S); break;
        case 'equip': this.nz(t, 0.1, 0.3, 'bandpass', 2200, S, { q: 3 }); break;
        case 'quest': this.osc('triangle', NOTE(67), t, 0.4, 0.15, S, { rev: 1 }); this.osc('triangle', NOTE(74), t + 0.15, 0.6, 0.15, S, { rev: 1 }); break;
        case 'quest_done': [0, 4, 7, 12, 16].forEach((n, i) => this.osc('triangle', NOTE(62 + n), t + i * 0.1, 0.7, 0.13, S, { rev: 1 })); break;
        case 'levelup': [0, 7, 12, 19, 24].forEach((n, i) => this.osc('sawtooth', NOTE(55 + n), t + i * 0.08, 0.9, 0.06, S, { filt: 2500, rev: 1 })); break;
        case 'down': this.osc('sawtooth', 180, t, 0.5, 0.12, S, { to: 70, filt: 900 }); break;
        case 'death_ds': this.osc('sawtooth', 120, t, 0.6, 0.18, S, { to: 50, filt: 700 }); this.nz(t, 0.4, 0.2, 'lowpass', 500, S); break;
        case 'death_beast': this.osc('sawtooth', 500, t, 0.3, 0.12, S, { to: 200, filt: 1800 }); break;
        case 'death_human': this.osc('sawtooth', 220, t, 0.4, 0.1, S, { to: 110, filt: 1200 }); break;
        case 'combat': this.osc('sine', 70, t, 0.6, 0.6, S, { to: 45 }); this.nz(t, 0.3, 0.3, 'lowpass', 300, S); break;
        case 'ogre_roar': this.osc('sawtooth', 90, t, 1.2, 0.3, S, { to: 55, filt: 500, a: 0.1 }); this.nz(t, 1, 0.2, 'lowpass', 400, S, { a: 0.1 }); break;
        case 'trap': case 'trap_snap': this.osc('square', 800, t, 0.05, 0.2, S, { filt: 3000 }); this.nz(t, 0.1, 0.4, 'highpass', 2000, S); break;
        case 'throw': this.nz(t, 0.25, 0.2, 'bandpass', 700, S, { to: 1500 }); break;
        case 'craft': this.osc('sine', 700, t, 0.1, 0.1, S); this.osc('sine', 900, t + 0.1, 0.2, 0.1, S); break;
        case 'click': this.osc('square', 1200, t, 0.03, 0.05, S, { filt: 3000 }); break;
        case 'page': this.nz(t, 0.25, 0.2, 'highpass', 1800, S, { to: 800 }); break;
        case 'approve': this.osc('sine', NOTE(76), t, 0.3, 0.1, S); this.osc('sine', NOTE(81), t + 0.1, 0.4, 0.1, S); break;
        case 'disapprove': this.osc('sine', NOTE(69), t, 0.3, 0.1, S); this.osc('sine', NOTE(64), t + 0.1, 0.4, 0.1, S); break;
        case 'bark': this.osc('sawtooth', 350, t, 0.08, 0.15, S, { to: 250, filt: 1500 }); this.osc('sawtooth', 380, t + 0.12, 0.08, 0.15, S, { to: 260, filt: 1500 }); break;
        default: this.osc('sine', 600, t, 0.08, 0.05, S);
      }
    }
    canSpeak() { return !!SPEECH; }
    voices() { return SPEECH ? SPEECH.getVoices().filter(v => /^ru/i.test(v.lang)) : []; }
    pickVoice(who) {
      const list = this.voices();
      const kind = who.narr ? 'narr' : who.sex === 'f' ? 'f' : 'm';
      const want = list.find(v => v.name === this.speech[kind]);
      if (want) return want;
      const sex = who.narr ? 'm' : kind;
      const same = list.filter(v => voiceSex(v) === sex);
      const pool = same.length ? same : list;
      return pool.length ? pool[hashKey(who.key) % pool.length] : null;
    }
    say(text, who) {
      this.hush();
      const s = this.speech, sys = globalThis.soundSys;
      if (!SPEECH || !s.on || !text || (who.narr && s.narr === 'off') || (sys && sys.muted)) return false;
      const vol = Math.min(1, this.vol.master * s.vol);
      if (vol <= 0) return false;
      const h = hashKey(who.key);
      const pitch = who.narr ? 1 : (who.sex === 'f' ? 1.15 : 0.9) + (RACE_PITCH[who.race] || 0) + ((h % 17) - 8) * 0.01;
      const rate = s.rate * (who.narr ? 0.95 : 1 + (((h >>> 5) % 11) - 5) * 0.01);
      const u = new SpeechSynthesisUtterance(text);
      const v = this.pickVoice(who);
      if (v) u.voice = v;
      u.lang = v ? v.lang : 'ru-RU';
      u.volume = vol;
      u.pitch = D.clamp(pitch, 0.1, 2);
      u.rate = D.clamp(rate, 0.5, 2);
      this.utt = u;
      try { SPEECH.speak(u); } catch (e) { return false; }
      return true;
    }
    sample(kind) { return this.say(VOICE_SAMPLES[kind], kind === 'narr' ? { key: 'narr', narr: true } : { key: 'sample_' + kind, sex: kind, race: 'human' }); }
    watchVoices(fn) {
      if (!SPEECH || !SPEECH.addEventListener) return () => {};
      SPEECH.addEventListener('voiceschanged', fn);
      return () => SPEECH.removeEventListener('voiceschanged', fn);
    }
    hush() { this.utt = null; if (SPEECH && (SPEECH.speaking || SPEECH.pending)) SPEECH.cancel(); }
    music(id) {
      if (!this.ctx) { this.want = id; return; }
      if (this.track === id) return;
      this.track = id;
      this.step = 0;
      this.next = this.ctx.currentTime + 0.2;
      if (!this.timer) this.timer = setInterval(() => this.sched(), 60);
    }
    stop() { this.track = null; if (this.timer) clearInterval(this.timer); this.timer = null; }
    sched() {
      if (!this.ctx || !this.track) return;
      const T = TRACKS[this.track] || TRACKS.castle;
      const beat = 60 / T.bpm / 2;
      while (this.next < this.ctx.currentTime + 0.3) {
        this.note(T, this.step, this.next, beat);
        this.next += beat;
        this.step++;
      }
    }
    note(T, s, t, beat) {
      const M = this.mus;
      const bar = Math.floor(s / 8), pos = s % 8;
      const chordDeg = T.prog[bar % T.prog.length];
      const deg = d => { const o = Math.floor(d / 7); return T.root + T.scale[((d % 7) + 7) % 7] + o * 12; };
      if (pos === 0 && T.pad) {
        const ch = [deg(chordDeg), deg(chordDeg + 2), deg(chordDeg + 4)];
        const type = T.pad === 'organ' ? 'square' : T.pad === 'horn' ? 'sawtooth' : T.pad === 'flute' ? 'sine' : T.pad === 'glass' ? 'sine' : T.pad === 'drone' ? 'sawtooth' : 'triangle';
        const filt = T.pad === 'horn' ? 900 : T.pad === 'choir' ? 1400 : T.pad === 'organ' ? 1200 : T.pad === 'drone' ? 500 : 2200;
        for (const n of ch) {
          this.osc(type, NOTE(n + 12), t, beat * 8.2, T.pad === 'glass' ? 0.035 : 0.03, M, { a: beat * 2, filt, rev: 1, det: -6 });
          this.osc(type, NOTE(n + 12), t, beat * 8.2, 0.02, M, { a: beat * 2, filt, det: 7 });
        }
      }
      if (T.bass && (pos === 0 || (T.bass > 1 && pos % 2 === 0))) this.osc('triangle', NOTE(deg(chordDeg) - 12), t, beat * (T.bass > 1 ? 1.8 : 6), 0.12, M, { filt: 400 });
      if (T.mel && Math.random() < T.mel * (pos % 2 === 0 ? 0.8 : 0.35)) {
        const d = chordDeg + [0, 2, 4, 7, 5, 4, 2, 1][(s * 5 + bar * 3) % 8] + (Math.random() < 0.3 ? 1 : 0);
        const type = T.lute ? 'triangle' : T.pad === 'flute' ? 'sine' : 'sine';
        this.osc(type, NOTE(deg(d) + 12), t, beat * (T.lute ? 1.4 : 2.2), T.lute ? 0.07 : 0.05, M, { rev: 1, filt: 3000 });
        if (T.lute) this.osc('square', NOTE(deg(d) + 24), t, beat * 0.5, 0.012, M, { filt: 2500 });
      }
      if (T.drums) {
        const dr = T.drums;
        if (dr === 'war' && (pos === 0 || pos === 3 || pos === 6)) { this.osc('sine', 60, t, 0.5, 0.4, M, { to: 38 }); this.nz(t, 0.2, 0.15, 'lowpass', 200, M); }
        if (dr === 'battle') { if (pos % 2 === 0) this.osc('sine', 70, t, 0.3, 0.35, M, { to: 40 }); if (pos === 4) this.nz(t, 0.18, 0.25, 'bandpass', 1500, M); if (pos % 2 === 1) this.nz(t, 0.05, 0.06, 'highpass', 6000, M); }
        if (dr === 'anvil' && (pos === 0 || pos === 4)) { this.osc('square', 1200, t, 0.3, 0.03, M, { filt: 3000, rev: 1 }); this.osc('sine', 55, t, 0.6, 0.3, M, { to: 40 }); }
        if (dr === 'deep' && pos === 0) this.osc('sine', 45, t, 1.2, 0.35, M, { to: 32 });
        if (dr === 'hand' && (pos === 0 || pos === 3 || pos === 5 || pos === 6)) this.nz(t, 0.08, pos === 0 ? 0.25 : 0.12, 'bandpass', pos === 0 ? 300 : 800, M, { q: 2 });
      }
    }
  }
  D.Audio = Audio;
  D.TRACKS = TRACKS;
})(globalThis.Dao98 = globalThis.Dao98 || {});
