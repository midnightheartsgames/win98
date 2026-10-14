(function (W) {
  'use strict';

  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const freq = n => {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
    if (!m) return 0;
    const semi = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12;
    return 440 * Math.pow(2, (semi - 69) / 12);
  };
  const CHORD = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], dim: [0, 3, 6] };
  const parseChord = c => {
    const m = /^([A-G][#b]?)(m|7|dim)?$/.exec(c);
    const root = freq(m[1] + '2');
    return { root, iv: CHORD[m[2] || ''] };
  };
  const st = (f, s) => f * Math.pow(2, s / 12);

  const TRACKS = {
    title: { bpm: 112, prog: 'Cm G Cm G Eb Fm G Cm', bass: 'march', drums: 'march', lead: 'brass',
      mel: 'G4.4 G4.2 G4.2 C5.6 D5.2 | Eb5.4 D5.2 C5.2 D5.8 | G4.4 G4.2 G4.2 C5.6 D5.2 | Eb5.4 F5.2 Eb5.2 D5.8 | Eb5.4 Eb5.2 F5.2 G5.6 Eb5.2 | F5.4 Eb5.2 D5.2 C5.8 | Bb4.4 C5.2 D5.2 Eb5.4 D5.4 | C5.12 r.4' },
    menu: { bpm: 80, prog: 'Am F C G Am F E E', bass: 'walk', drums: 'none', lead: 'flute',
      mel: 'E5.8 C5.4 A4.4 | F5.8 E5.4 C5.4 | G5.6 E5.2 C5.8 | D5.8 B4.8 | E5.8 A5.4 G5.4 | F5.6 E5.2 D5.8 | E5.4 D5.4 C5.4 B4.4 | G#4.8 B4.8' },
    lev1: { bpm: 132, prog: 'Am G Am E F G Am E', bass: 'octave', drums: 'rock', lead: 'brass',
      mel: 'A4.2 r.2 A4.2 C5.2 E5.4 D5.2 C5.2 | B4.2 r.2 B4.2 D5.2 G5.4 F5.2 D5.2 | A4.2 r.2 A4.2 C5.2 E5.4 A5.4 | G#5.2 F5.2 E5.2 D5.2 E5.8 | F5.4 E5.2 D5.2 C5.4 A4.4 | D5.4 C5.2 B4.2 G4.8 | A4.2 B4.2 C5.2 D5.2 E5.4 C5.4 | B4.4 G#4.4 A4.8' },
    lev2: { bpm: 104, prog: 'Dm Dm Bb A Dm Gm A A', bass: 'pulse', drums: 'half', lead: 'square',
      mel: 'D5.3 r.1 A4.2 D5.2 F5.4 E5.4 | D5.2 E5.2 F5.2 G5.2 A5.6 r.2 | Bb5.4 A5.2 G5.2 F5.4 D5.4 | E5.4 C#5.4 A4.8 | D5.3 r.1 A4.2 D5.2 F5.4 A5.4 | G5.4 F5.2 E5.2 D5.4 Bb4.4 | A4.2 C#5.2 E5.2 G5.2 F5.4 E5.4 | D5.8 r.8' },
    lev3: { bpm: 150, prog: 'Em C D B7 Em C Am B7', bass: 'octave', drums: 'fast', lead: 'brass',
      mel: 'E5.2 E5.2 G5.2 E5.2 B5.4 A5.2 G5.2 | E5.2 E5.2 G5.2 E5.2 C6.4 B5.2 A5.2 | F#5.2 F#5.2 A5.2 F#5.2 D6.4 C6.2 A5.2 | B5.4 A5.2 G5.2 F#5.8 | E5.2 E5.2 G5.2 B5.2 E6.4 D6.2 B5.2 | C6.4 B5.2 A5.2 G5.4 E5.4 | A5.4 G5.2 F#5.2 E5.4 C5.4 | D#5.4 F#5.4 B4.8' },
    lev4: { bpm: 120, prog: 'Gm Eb F D Gm Cm D D', bass: 'march', drums: 'march', lead: 'brass',
      mel: 'G4.4 Bb4.4 D5.6 C5.2 | Bb4.4 G4.4 Eb5.8 | F5.4 Eb5.2 D5.2 C5.4 A4.4 | D5.8 F#4.8 | G4.4 Bb4.4 D5.4 G5.4 | F5.2 Eb5.2 D5.2 C5.2 Eb5.4 G5.4 | F#5.4 E5.2 D5.2 C5.4 A4.4 | G4.12 r.4' },
    lev5: { bpm: 96, prog: 'Fm Fm Db C Fm Bbm C C', bass: 'walk', drums: 'half', lead: 'flute',
      mel: 'C5.6 Ab4.2 F4.4 G4.4 | Ab4.4 C5.4 F5.8 | Eb5.4 Db5.4 C5.4 Bb4.4 | C5.12 r.4 | F5.6 Eb5.2 Db5.4 C5.4 | Db5.4 F5.4 Bb4.8 | G4.4 Bb4.4 E5.4 G5.4 | F5.12 r.4' },
    lev6: { bpm: 140, prog: 'Bm G A F# Bm Em F# F#', bass: 'octave', drums: 'rock', lead: 'square',
      mel: 'B4.2 D5.2 F#5.2 B5.2 A5.4 F#5.4 | G5.2 F#5.2 E5.2 D5.2 B4.8 | C#5.2 E5.2 A5.2 C#6.2 B5.4 A5.4 | F#5.4 F5.4 C#5.8 | B4.2 D5.2 F#5.2 B5.2 D6.4 C#6.4 | B5.4 A5.2 G5.2 E5.8 | F#5.2 G5.2 A5.2 G5.2 F#5.4 E5.4 | C#5.4 A#4.4 B4.8' },
    boss: { bpm: 160, prog: 'Cm Cm Ab Bb Cm Cm Fm G', bass: 'octave', drums: 'fast', lead: 'brass',
      mel: 'C5.2 C5.2 Eb5.2 C5.2 G5.2 C5.2 F#5.2 G5.2 | C5.2 C5.2 Eb5.2 C5.2 Bb5.2 Ab5.2 G5.4 | Ab5.2 G5.2 F5.2 Eb5.2 C5.4 Eb5.4 | D5.2 F5.2 Bb5.2 D6.2 C6.4 Bb5.4 | G5.2 G5.2 Ab5.2 G5.2 F5.2 Eb5.2 D5.2 Eb5.2 | C5.4 G4.4 C5.4 Eb5.4 | F5.2 Ab5.2 C6.2 Ab5.2 F5.4 C5.4 | B4.4 D5.4 G5.8' },
    inter: { bpm: 108, prog: 'C Am F G C Am Dm G', bass: 'walk', drums: 'half', lead: 'square',
      mel: 'E5.4 G5.4 C6.4 G5.4 | A5.4 E5.4 C5.8 | F5.4 A5.4 C6.4 A5.4 | G5.4 F5.4 D5.8 | E5.4 G5.4 C6.4 E6.4 | D6.4 C6.4 A5.8 | F5.4 E5.4 D5.4 F5.4 | G5.4 B5.4 G5.8' },
    victory: { bpm: 120, prog: 'C F G C C F G C', bass: 'march', drums: 'march', lead: 'brass',
      mel: 'C5.2 C5.2 C5.2 E5.2 G5.8 | A5.4 F5.4 C6.8 | B5.4 G5.4 D5.4 B4.4 | C5.16 | G5.2 G5.2 G5.2 A5.2 G5.4 E5.4 | F5.4 A5.4 C6.8 | D6.4 B5.4 G5.4 D6.4 | C6.16' },
    scores: { bpm: 96, prog: 'Eb Cm Ab Bb Eb Cm Ab Bb', bass: 'walk', drums: 'half', lead: 'flute',
      mel: 'G5.4 F5.2 Eb5.2 Bb4.8 | C5.4 Eb5.4 G5.8 | Ab5.4 G5.2 F5.2 Eb5.4 C5.4 | D5.8 F5.8 | G5.4 Bb5.4 Eb6.8 | D6.4 C6.4 G5.8 | Ab5.4 C6.4 Eb5.4 F5.4 | Bb4.8 D5.8' }
  };

  function buildTrack(def) {
    const prog = def.prog.split(/\s+/).map(parseChord), bars = prog.length, ev = [];
    let t = 0;
    for (const tok of def.mel.replace(/\|/g, ' ').trim().split(/\s+/)) {
      const [n, d] = tok.split('.'), dur = +d;
      if (n !== 'r') ev.push({ t, d: dur, f: freq(n), i: def.lead, v: 1 });
      t += dur;
    }
    prog.forEach((ch, b) => {
      const T = b * 16, R = ch.root, fifth = st(R, 7), third = st(R, ch.iv[1]);
      const bass = (tt, d, f) => ev.push({ t: T + tt, d, f, i: 'bass', v: 1 });
      if (def.bass === 'octave') for (let k = 0; k < 8; k++) bass(k * 2, 2, k & 1 ? R * 2 : R);
      else if (def.bass === 'march') { bass(0, 4, R); bass(4, 4, fifth / 2); bass(8, 4, R); bass(12, 4, fifth / 2); }
      else if (def.bass === 'pulse') for (let k = 0; k < 8; k++) bass(k * 2, 1, R);
      else if (def.bass === 'walk') { bass(0, 4, R); bass(4, 4, third); bass(8, 4, fifth); bass(12, 4, st(R, ch.iv[1] === 3 ? 10 : 9)); }
      ev.push({ t: T, d: 16, chord: ch.iv.slice(0, 3).map(s => st(R * 4, s)), i: 'pad', v: 1 });
      const dr = (tt, k) => ev.push({ t: T + tt, d: 1, i: k, v: 1 });
      if (def.drums === 'rock') { [0, 8, 10].forEach(x => dr(x, 'kick')); [4, 12].forEach(x => dr(x, 'snare')); for (let x = 0; x < 16; x += 2) dr(x, 'hat'); }
      else if (def.drums === 'march') { [0, 8].forEach(x => dr(x, 'kick')); [2, 3, 6, 10, 11, 14].forEach(x => dr(x, 'snare')); for (let x = 0; x < 16; x += 4) dr(x, 'hat'); }
      else if (def.drums === 'fast') { [0, 4, 8, 12].forEach(x => dr(x, 'kick')); [4, 12].forEach(x => dr(x, 'snare')); for (let x = 0; x < 16; x++) dr(x, 'hat'); }
      else if (def.drums === 'half') { dr(0, 'kick'); dr(10, 'kick'); dr(8, 'snare'); for (let x = 0; x < 16; x += 4) dr(x + 2, 'hat'); }
    });
    return { bpm: def.bpm, len: bars * 16, ev: ev.sort((a, b) => a.t - b.t) };
  }

  const VOICES = {
    v_halt: ['Halt!', 'Achtung!'], v_spion: ['Spion!'], v_ss: ['Schutzstaffel!'], v_hans: ['Guten Tag!'], v_gretel: ['Kein Durchgang!'],
    v_schabbs: ['Gut, gut!'], v_mecha: ['Stirb, Schweinehund!'], v_hitler: ['Die Schweinehund!'], v_fake: ['Ha ha ha!'], v_otto: ['Achtung, Spion!'], v_fett: ['Erlauben Sie!'],
    v_guard_die1: ['Mein Leben!'], v_guard_die2: ['Aaah!'], v_guard_die3: ['Oh!'], v_officer_die: ['Mein Gott!'], v_ss_die: ['Mein Leben!'],
    v_hans_die: ['Mutti!'], v_gretel_die: ['Mein Bruder!'], v_schabbs_die: ['Mein Leben!'], v_hitler_die: ['Eva, auf Wiedersehen!'], v_fake_die: ['Nein!'],
    v_otto_die: ['Donnerwetter!'], v_fett_die: ['Rosenknospe!']
  };
  const VOICE_PITCH = { v_hans: 0.5, v_hans_die: 0.5, v_mecha: 0.6, v_hitler: 0.8, v_hitler_die: 0.8, v_otto: 0.6, v_otto_die: 0.6, v_fett: 0.5, v_fett_die: 0.5, v_gretel: 1.5, v_gretel_die: 1.5, v_spion: 1.2, v_officer_die: 1.2, v_fake: 1.4, v_fake_die: 1.4 };

  class Audio {
    constructor() {
      this.ctx = null; this.opts = { sfx: 'adlib', digi: true, music: true, volSfx: 0.8, volMusic: 0.55 };
      this.track = null; this.trackName = null; this.timer = null; this.voiceBusy = 0; this.lastPlay = {};
    }

    ensure() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return this.ctx; }
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return null;
      try { this.ctx = new AC(); } catch (_) { return null; }
      const c = this.ctx;
      this.sfxBus = c.createGain(); this.sfxBus.connect(c.destination);
      this.musBus = c.createGain(); this.musBus.connect(c.destination);
      const n = c.sampleRate, buf = c.createBuffer(1, n, n), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
      this.applyVolumes();
      if (this.trackName && this.opts.music) this.startScheduler();
      return c;
    }

    setOptions(o) {
      Object.assign(this.opts, o);
      this.applyVolumes();
      if (!this.opts.music) this.stopMusic(true);
      else if (this.trackName && !this.timer && this.ctx) this.startScheduler();
    }
    applyVolumes() { if (!this.ctx) return; this.sfxBus.gain.value = this.opts.volSfx; this.musBus.gain.value = this.opts.volMusic * 0.8; }

    env(g, t, a, peak, d, sus, hold, r) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      g.gain.linearRampToValueAtTime(peak * sus, t + a + d);
      g.gain.setValueAtTime(peak * sus, t + Math.max(a + d, hold));
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + d, hold) + r);
      return t + Math.max(a + d, hold) + r;
    }

    fm(dest, t, o) {
      const c = this.ctx, car = c.createOscillator(), g = c.createGain();
      car.type = o.wave || 'sine';
      car.frequency.setValueAtTime(o.f, t);
      if (o.to) car.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + (o.slide || o.dur));
      let mod = null;
      if (o.index) {
        mod = c.createOscillator(); const mg = c.createGain();
        mod.frequency.setValueAtTime(o.f * (o.ratio || 1), t);
        if (o.to) mod.frequency.exponentialRampToValueAtTime(Math.max(20, o.to * (o.ratio || 1)), t + (o.slide || o.dur));
        mg.gain.setValueAtTime(o.index * o.f * (o.ratio || 1), t);
        mg.gain.exponentialRampToValueAtTime(Math.max(1, o.index * o.f * (o.ratio || 1) * (o.idecay !== undefined ? o.idecay : 0.3)), t + o.dur + 0.01);
        mod.connect(mg); mg.connect(car.frequency);
      }
      if (o.vib) { const v = c.createOscillator(), vg = c.createGain(); v.frequency.value = 5.5; vg.gain.value = o.f * o.vib; v.connect(vg); vg.connect(car.frequency); v.start(t); v.stop(t + o.dur + 0.4); }
      car.connect(g); g.connect(dest);
      const end = this.env(g, t, o.a || 0.005, o.vol || 0.3, o.d || 0.05, o.s !== undefined ? o.s : 0.7, o.dur, o.r || 0.05);
      car.start(t); car.stop(end + 0.02);
      if (mod) { mod.start(t); mod.stop(end + 0.02); }
      return end;
    }

    nz(dest, t, o) {
      const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = this.noise; s.loop = true;
      f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t); if (o.q) f.Q.value = o.q;
      if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
      s.connect(f); f.connect(g); g.connect(dest);
      const end = this.env(g, t, o.a || 0.002, o.vol || 0.4, o.d || 0.02, o.s !== undefined ? o.s : 0.5, o.dur, o.r || 0.05);
      s.start(t, Math.random()); s.stop(end + 0.02);
      return end;
    }

    pcBeeps(dest, t, seq, vol = 0.06) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = 'square';
      let tt = t;
      for (const [f, ms] of seq) { o.frequency.setValueAtTime(Math.max(20, f), tt); tt += ms / 1000; }
      g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(0, tt);
      o.connect(g); g.connect(dest); o.start(t); o.stop(tt + 0.01);
    }

    play(name, vol = 1, pan = 0) {
      if (!name || this.opts.sfx === 'off' && !(this.opts.digi && (name.startsWith('v_') || name.startsWith('w_')))) return;
      const c = this.ensure();
      if (!c) return;
      const now = c.currentTime;
      if (this.lastPlay[name] && now - this.lastPlay[name] < 0.03) return;
      this.lastPlay[name] = now;
      let dest = this.sfxBus;
      const g = c.createGain(); g.gain.value = Math.max(0, Math.min(1, vol));
      if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); p.connect(dest); }
      else g.connect(dest);
      dest = g;
      setTimeout(() => { try { g.disconnect(); } catch (_) { } }, 4000);
      if (name.startsWith('v_')) { this.voice(name, dest, now, vol); return; }
      if (this.opts.sfx === 'pc' && !(this.opts.digi && name.startsWith('w_'))) { this.pc(name, dest, now); return; }
      this.adlib(name, dest, now);
    }

    voice(name, dest, t, vol) {
      const lines = VOICES[name];
      const synth = globalThis.speechSynthesis, U = globalThis.SpeechSynthesisUtterance;
      const death = /_die/.test(name);
      if (this.opts.digi && synth && U && lines) {
        const now = Date.now();
        if (synth.speaking && !death && now - this.voiceBusy < 1500) { this.shout(dest, t, name); return; }
        if (synth.speaking && death) synth.cancel();
        const u = new U(lines[Math.floor(Math.random() * lines.length)]);
        u.lang = 'de-DE';
        const v = (synth.getVoices ? synth.getVoices() : []).find(x => /^de/i.test(x.lang));
        if (v) u.voice = v;
        u.rate = 1.15; u.pitch = VOICE_PITCH[name] || 0.9; u.volume = Math.min(1, vol * this.opts.volSfx * 1.2);
        this.voiceBusy = now;
        try { synth.speak(u); } catch (_) { this.shout(dest, t, name); }
        return;
      }
      if (this.opts.sfx !== 'off') this.shout(dest, t, name);
    }

    shout(dest, t, name) {
      const death = /_die/.test(name), low = (VOICE_PITCH[name] || 1) < 0.9;
      const f = low ? 140 : 220;
      if (death) { this.fm(dest, t, { f: f * 1.4, to: f * 0.5, dur: 0.5, index: 3, ratio: 1.5, vol: 0.25, wave: 'sawtooth' }); this.nz(dest, t, { f: 900, dur: 0.4, vol: 0.12 }); }
      else { this.fm(dest, t, { f, to: f * 1.3, slide: 0.08, dur: 0.12, index: 4, ratio: 1.5, vol: 0.25, wave: 'sawtooth' }); this.fm(dest, t + 0.16, { f: f * 1.2, to: f * 0.9, dur: 0.14, index: 4, ratio: 1.5, vol: 0.25, wave: 'sawtooth' }); }
    }

    gun(dest, t, k) {
      if (this.opts.digi) {
        this.nz(dest, t, { type: 'lowpass', f: 3500 * k, to: 300, dur: 0.12 / k, vol: 0.9, s: 0.4, r: 0.12 });
        this.fm(dest, t, { f: 120 * k, to: 40, dur: 0.1, vol: 0.6, r: 0.08 });
      } else {
        this.fm(dest, t, { f: 300 * k, to: 60, dur: 0.12, index: 8, ratio: 3.3, vol: 0.35, idecay: 0.05 });
      }
    }

    adlib(name, d, t) {
      const fm = (o, dt = 0) => this.fm(d, t + dt, o), nz = (o, dt = 0) => this.nz(d, t + dt, o);
      const arp = (notes, step, o = {}) => notes.forEach((f, i) => fm(Object.assign({ f, dur: step * 0.9, index: 1.5, ratio: 2, vol: 0.22 }, o), i * step));
      switch (name) {
        case 'w_pistol': this.gun(d, t, 1); break;
        case 'w_mg': this.gun(d, t, 1.25); break;
        case 'w_chain': this.gun(d, t, 1.5); break;
        case 'w_knife': nz({ f: 1500, to: 4000, dur: 0.1, vol: 0.3, q: 2 }); break;
        case 'e_pistol': this.gun(d, t, 0.9); break;
        case 'e_mg': this.gun(d, t, 1.1); break;
        case 'e_boss': this.gun(d, t, 1.3); break;
        case 'e_bite': nz({ f: 600, dur: 0.15, vol: 0.4, q: 3 }); fm({ f: 90, to: 60, dur: 0.15, index: 5, ratio: 1.4, vol: 0.3 }); break;
        case 'e_bark': fm({ f: 420, to: 250, dur: 0.09, index: 3, ratio: 1.5, vol: 0.35, wave: 'sawtooth' }); fm({ f: 380, to: 220, dur: 0.1, index: 3, ratio: 1.5, vol: 0.3, wave: 'sawtooth' }, 0.16); break;
        case 'e_throw': nz({ f: 800, to: 2500, dur: 0.2, vol: 0.3, q: 2 }); break;
        case 'e_rocket': nz({ type: 'lowpass', f: 1200, to: 300, dur: 0.6, vol: 0.5 }); fm({ f: 90, to: 50, dur: 0.5, index: 6, ratio: 0.5, vol: 0.3 }); break;
        case 'e_flame': nz({ type: 'lowpass', f: 2000, to: 500, dur: 0.35, vol: 0.4 }); break;
        case 'e_boom': nz({ type: 'lowpass', f: 1500, to: 80, dur: 0.7, vol: 1, s: 0.6, r: 0.4 }); fm({ f: 70, to: 25, dur: 0.6, vol: 0.7 }); break;
        case 'e_pain': fm({ f: 180, to: 120, dur: 0.12, index: 4, ratio: 1.5, vol: 0.25, wave: 'sawtooth' }); break;
        case 'e_step': fm({ f: 70, to: 50, dur: 0.15, index: 10, ratio: 3.7, vol: 0.4, idecay: 0.05 }); nz({ type: 'lowpass', f: 400, dur: 0.1, vol: 0.3 }); break;
        case 'e_dog_die': fm({ f: 900, to: 300, dur: 0.5, index: 2, ratio: 1, vol: 0.3, vib: 0.03 }); break;
        case 'e_mutant_die': fm({ f: 200, to: 60, dur: 0.6, index: 6, ratio: 0.7, vol: 0.35 }); nz({ f: 400, dur: 0.5, vol: 0.2, q: 4 }); break;
        case 'e_mecha_die': nz({ type: 'lowpass', f: 3000, to: 200, dur: 1.2, vol: 0.8, r: 0.5 }); fm({ f: 150, to: 30, dur: 1.2, index: 12, ratio: 2.7, vol: 0.5 }); break;
        case 'p_ammo': fm({ f: 1200, dur: 0.03, index: 6, ratio: 3, vol: 0.25 }); fm({ f: 900, dur: 0.04, index: 6, ratio: 3, vol: 0.25 }, 0.06); break;
        case 'p_health': arp([523, 659, 784], 0.05); break;
        case 'p_gibs': nz({ f: 300, dur: 0.15, vol: 0.3, q: 5 }); break;
        case 'p_key': arp([1046, 1318, 1046, 1568], 0.04, { ratio: 3.5, index: 3 }); break;
        case 'p_cross': arp([784, 988], 0.06, { ratio: 3, index: 2 }); break;
        case 'p_chalice': arp([784, 988, 1174], 0.06, { ratio: 3, index: 2 }); break;
        case 'p_chest': arp([659, 784, 988, 1318], 0.06, { ratio: 3, index: 2 }); break;
        case 'p_crown': arp([523, 659, 784, 1046, 1318, 1568], 0.06, { ratio: 3, index: 2 }); break;
        case 'p_oneup': arp([392, 523, 659, 784, 659, 784, 1046], 0.08, { wave: 'square', index: 0.5, vol: 0.12 }); break;
        case 'p_mg': case 'p_chain': fm({ f: 200, dur: 0.05, index: 8, ratio: 4.1, vol: 0.3 }); fm({ f: 150, dur: 0.06, index: 8, ratio: 4.1, vol: 0.3 }, 0.1); arp([392, 523, 784], 0.07, { vol: 0.15 }); break;
        case 'p_hurt': fm({ f: 160, to: 110, dur: 0.15, index: 4, ratio: 1.5, vol: 0.3, wave: 'sawtooth' }); break;
        case 'p_die': fm({ f: 300, to: 60, dur: 1.2, index: 3, ratio: 1.5, vol: 0.35, wave: 'sawtooth', vib: 0.04 }); break;
        case 'u_door_open': case 'u_door_close': nz({ type: 'lowpass', f: 500, to: 250, dur: 0.6, vol: 0.4, s: 0.8 }); fm({ f: 55, dur: 0.6, index: 4, ratio: 2.1, vol: 0.2, s: 0.8 }); break;
        case 'u_locked': fm({ f: 110, dur: 0.18, wave: 'square', vol: 0.12, index: 1, ratio: 1.01 }); fm({ f: 104, dur: 0.18, wave: 'square', vol: 0.12 }, 0.2); break;
        case 'u_nothing': fm({ f: 80, to: 50, dur: 0.08, index: 2, ratio: 0.5, vol: 0.35 }); break;
        case 'u_pushwall': nz({ type: 'lowpass', f: 300, dur: 1.8, vol: 0.5, s: 0.9, r: 0.3 }); fm({ f: 45, dur: 1.8, index: 6, ratio: 2.3, vol: 0.25, s: 0.9 }); break;
        case 'u_switch': fm({ f: 220, dur: 0.06, index: 6, ratio: 3, vol: 0.3 }); fm({ f: 110, to: 220, dur: 0.8, index: 1, ratio: 1, vol: 0.12, s: 0.9 }, 0.15); break;
        case 'm_move': fm({ f: 1600, dur: 0.02, index: 2, ratio: 2, vol: 0.12 }); break;
        case 'm_select': arp([880, 1320], 0.04, { vol: 0.15 }); break;
        case 'm_back': arp([1320, 880], 0.04, { vol: 0.15 }); break;
        case 'i_tick': fm({ f: 1800, dur: 0.015, index: 3, ratio: 2, vol: 0.12 }); break;
        case 'i_bonus': arp([1046, 1318, 1568], 0.05, { vol: 0.18 }); break;
        case 'i_perfect': arp([523, 659, 784, 1046, 784, 1046, 1318], 0.07, { vol: 0.18 }); break;
        case 'i_psyched': fm({ f: 220, to: 880, dur: 0.6, index: 2, ratio: 2, vol: 0.12 }); break;
        default: fm({ f: 440, dur: 0.05, vol: 0.1 });
      }
    }

    pc(name, d, t) {
      const sweep = (a, b, n, ms) => Array.from({ length: n }, (_, i) => [a + (b - a) * i / (n - 1), ms]);
      const rnd = (lo, hi, n, ms) => Array.from({ length: n }, () => [lo + Math.random() * (hi - lo), ms]);
      let seq;
      if (/^w_|^e_pistol|^e_mg|^e_boss/.test(name)) seq = rnd(100, 900, 10, 6);
      else if (/^e_boom|^e_rocket|^e_mecha/.test(name)) seq = rnd(40, 300, 30, 12);
      else if (/^p_(cross|chalice|chest|crown|key|oneup|health)/.test(name)) seq = [[880, 40], [1100, 40], [1320, 40], [1760, 60]];
      else if (/^p_ammo|^p_mg|^p_chain/.test(name)) seq = [[1500, 20], [0, 20], [1200, 30]];
      else if (/^u_door|^u_push/.test(name)) seq = rnd(60, 160, name === 'u_pushwall' ? 60 : 24, 20);
      else if (/^p_die/.test(name)) seq = sweep(800, 80, 40, 25);
      else if (/^p_hurt|^e_pain/.test(name)) seq = sweep(400, 150, 8, 12);
      else if (/^e_bark/.test(name)) seq = [[500, 40], [300, 40], [0, 60], [480, 40], [280, 40]];
      else if (/^m_|^i_/.test(name)) seq = [[1400, 15]];
      else seq = sweep(600, 200, 6, 15);
      this.pcBeeps(d, t, seq);
    }

    playMusic(name) {
      if (this.trackName === name) return;
      this.stopMusic(true);
      this.trackName = name;
      this.track = TRACKS[name] ? buildTrack(TRACKS[name]) : null;
      if (this.ctx && this.opts.music) this.startScheduler();
    }

    startScheduler() {
      if (!this.track || this.timer) return;
      const c = this.ctx;
      this.pos = 0; this.nextT = c.currentTime + 0.1; this.evI = 0; this.loopStart = this.nextT;
      this.musicGain = c.createGain(); this.musicGain.gain.value = 1; this.musicGain.connect(this.musBus);
      this.timer = setInterval(() => this.schedule(), 50);
      this.schedule();
    }

    schedule() {
      const c = this.ctx, tr = this.track;
      if (!c || !tr) return;
      const sixteenth = 60 / tr.bpm / 4, horizon = c.currentTime + 0.3;
      while (true) {
        if (this.evI >= tr.ev.length) { this.evI = 0; this.loopStart += tr.len * sixteenth; }
        const e = tr.ev[this.evI], at = this.loopStart + e.t * sixteenth;
        if (at > horizon) break;
        if (at >= c.currentTime - 0.05) this.note(e, at, sixteenth);
        this.evI++;
      }
    }

    note(e, t, s) {
      const d = this.musicGain, dur = e.d * s;
      switch (e.i) {
        case 'brass': this.fm(d, t, { f: e.f, dur: dur * 0.85, a: 0.02, d: 0.15, s: 0.65, r: 0.08, index: 2.4, ratio: 1, idecay: 0.5, vol: 0.13, vib: 0.004 }); break;
        case 'square': this.fm(d, t, { f: e.f, dur: dur * 0.8, a: 0.005, d: 0.1, s: 0.6, r: 0.05, wave: 'square', vol: 0.045 }); break;
        case 'flute': this.fm(d, t, { f: e.f, dur: dur * 0.9, a: 0.06, d: 0.2, s: 0.8, r: 0.15, index: 0.4, ratio: 2, vol: 0.12, vib: 0.006 }); break;
        case 'bass': this.fm(d, t, { f: e.f, dur: dur * 0.8, a: 0.005, d: 0.12, s: 0.5, r: 0.05, index: 1.8, ratio: 1, idecay: 0.2, vol: 0.2 }); break;
        case 'pad': for (const f of e.chord) this.fm(d, t, { f, dur: dur * 0.95, a: 0.25, d: 0.3, s: 0.8, r: 0.3, wave: 'triangle', vol: 0.025 }); break;
        case 'kick': this.fm(d, t, { f: 140, to: 42, slide: 0.12, dur: 0.14, vol: 0.45, r: 0.05 }); break;
        case 'snare': this.nz(d, t, { f: 1800, dur: 0.08, vol: 0.18, q: 0.8, r: 0.06 }); this.fm(d, t, { f: 190, to: 150, dur: 0.05, vol: 0.12 }); break;
        case 'hat': this.nz(d, t, { type: 'highpass', f: 7000, dur: 0.02, vol: 0.06, r: 0.02 }); break;
      }
    }

    stopMusic(keepName) {
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
      if (this.musicGain) { const g = this.musicGain; try { g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05); } catch (_) { } setTimeout(() => { try { g.disconnect(); } catch (_) { } }, 400); this.musicGain = null; }
      if (!keepName) this.trackName = null;
    }

    destroy() {
      this.stopMusic();
      try { if (globalThis.speechSynthesis) globalThis.speechSynthesis.cancel(); } catch (_) { }
      if (this.ctx) { try { this.ctx.close(); } catch (_) { } this.ctx = null; }
    }
  }

  W.Audio = Audio;
  W.MUSIC = TRACKS;
  W.buildTrack = buildTrack;
})(globalThis.Wolf3D = globalThis.Wolf3D || {});
