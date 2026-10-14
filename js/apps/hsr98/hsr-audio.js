(function (H) {
  'use strict';
  const TRACKS = {
    title: { bpm: 84, wave: 'triangle', bass: [45, 45, 41, 41, 43, 43, 40, 40], mel: [69, 0, 72, 0, 76, 74, 72, 0, 71, 0, 67, 0, 69, 0, 0, 0, 65, 0, 69, 0, 72, 71, 69, 0, 67, 0, 64, 0, 67, 0, 0, 0] },
    station: { bpm: 100, wave: 'square', bass: [38, 38, 45, 45, 41, 41, 43, 43], mel: [62, 0, 65, 69, 0, 67, 65, 0, 64, 0, 62, 0, 60, 62, 0, 0, 62, 0, 65, 69, 0, 72, 70, 0, 69, 0, 67, 0, 65, 0, 0, 0] },
    crises: { bpm: 70, wave: 'sawtooth', bass: [33, 33, 29, 29, 36, 36, 31, 31], mel: [69, 0, 0, 72, 0, 71, 69, 0, 64, 0, 0, 0, 65, 0, 64, 0, 62, 0, 0, 65, 0, 64, 62, 0, 60, 0, 59, 0, 57, 0, 0, 0] },
    express: { bpm: 76, wave: 'triangle', bass: [48, 48, 45, 45, 41, 41, 43, 43], mel: [72, 0, 76, 0, 79, 0, 76, 74, 72, 0, 69, 0, 71, 0, 0, 0, 72, 0, 76, 0, 81, 0, 79, 77, 76, 0, 74, 0, 72, 0, 0, 0] },
    snow: { bpm: 88, wave: 'triangle', bass: [40, 40, 36, 36, 38, 38, 35, 35], mel: [64, 0, 67, 0, 71, 0, 72, 71, 69, 0, 67, 0, 64, 0, 0, 0, 62, 0, 64, 0, 67, 0, 69, 67, 64, 0, 62, 0, 59, 0, 0, 0] },
    city: { bpm: 96, wave: 'square', bass: [43, 43, 47, 47, 45, 45, 38, 38], mel: [67, 0, 71, 74, 0, 72, 71, 0, 69, 0, 71, 0, 67, 0, 0, 0, 67, 0, 71, 74, 0, 76, 74, 0, 72, 0, 71, 0, 69, 0, 0, 0] },
    under: { bpm: 92, wave: 'sawtooth', bass: [36, 0, 36, 43, 34, 0, 34, 41], mel: [60, 0, 63, 0, 65, 0, 67, 0, 70, 0, 67, 65, 63, 0, 0, 0, 60, 0, 63, 0, 65, 0, 63, 0, 60, 0, 58, 0, 60, 0, 0, 0] },
    dungeon: { bpm: 84, wave: 'square', bass: [33, 33, 33, 36, 31, 31, 31, 34], mel: [57, 0, 0, 60, 0, 0, 64, 0, 63, 0, 0, 0, 57, 0, 0, 0, 57, 0, 0, 60, 0, 0, 65, 0, 64, 0, 60, 0, 0, 0, 0, 0] },
    sim: { bpm: 108, wave: 'square', bass: [40, 0, 52, 40, 36, 0, 48, 36, 33, 0, 45, 33, 35, 0, 47, 35], mel: [64, 71, 76, 71, 78, 0, 76, 74, 60, 67, 72, 76, 79, 0, 76, 71, 57, 64, 69, 72, 76, 74, 72, 69, 59, 64, 71, 76, 75, 0, 71, 0] },
    final: { bpm: 100, wave: 'sawtooth', bass: [38, 38, 34, 34, 36, 36, 33, 33], mel: [74, 0, 72, 70, 69, 0, 70, 72, 74, 0, 77, 0, 76, 0, 0, 0, 74, 0, 72, 70, 69, 0, 65, 0, 67, 0, 69, 0, 70, 0, 0, 0] },
    battle: { midi: 'content/music/Battle Theme.mid', bpm: 150, wave: 'square', bass: [40, 40, 52, 40, 43, 43, 55, 43, 38, 38, 50, 38, 45, 45, 57, 45], mel: [76, 0, 76, 79, 0, 76, 74, 0, 72, 0, 74, 0, 76, 0, 71, 0, 72, 0, 72, 76, 0, 72, 71, 0, 69, 0, 71, 72, 74, 0, 0, 0] },
    boss: { midi: 'content/music/Battle Theme.mid', bpm: 160, wave: 'sawtooth', bass: [38, 50, 38, 50, 37, 49, 37, 49, 36, 48, 36, 48, 41, 53, 43, 55], mel: [74, 0, 73, 74, 0, 77, 0, 74, 72, 0, 70, 0, 69, 0, 70, 72, 74, 0, 73, 74, 0, 81, 0, 79, 77, 0, 76, 0, 74, 0, 0, 0] },
    menu: { midi: 'content/music/Main Theme.mid', fallback: 'title' },
    cocolia: { midi: 'content/music/Cocolia Boss Theme.mid', fallback: 'final' },
    order: { midi: 'content/music/Order.mid', fallback: 'battle' },
    svarog: { midi: 'content/music/Godfather.mid', fallback: 'boss' },
    doomsday: { midi: 'content/music/Dawn of Disaster.mid', fallback: 'boss' },
    gepard: { midi: 'content/music/Braving the Cold.mid', fallback: 'boss' }
  };
  const FIGHT_TRACKS = new Set(['battle', 'boss', 'final']);
  const SONGS = {
    signal: {
      parts: { inst: 'content/music/golden-sign-instrum.mp3', m: 'content/music/golden-sign-m.vocals.mp3', f: 'content/music/golden-sign-f.vocals.mp3' },
      loop: [7.118, 60.451], tail: 1.0
    },
    aria: {
      parts: { inst: 'content/music/AriaOfTheSoul.mp3' },
      loop: [12, 181.102]
    }
  };

  class Audio {
    constructor() { this.ctx = null; this.sfxVol = 0.6; this.musicVol = 0.35; this.track = null; this.timer = null; this.midi = null; this.step = 0; this.next = 0; }
    init() {
      if (this.ctx) return;
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = this.sfxVol; this.master.connect(this.ctx.destination);
      this.mus = this.ctx.createGain(); this.mus.gain.value = this.musicVol; this.mus.connect(this.ctx.destination);
      if (this.wanted) this.music(this.wanted);
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    setVolumes(sfx, mus) {
      this.sfxVol = sfx; this.musicVol = mus;
      if (this.master) this.master.gain.value = sfx;
      if (this.mus) this.ramp(this.mus.gain, this.layers ? 0 : mus, 0);
      if (this.layers) this.ramp(this.layers.out.gain, mus, 0);
    }
    ramp(param, v, dur) {
      const t = this.ctx.currentTime;
      param.cancelScheduledValues(t);
      if (dur > 0) { param.setValueAtTime(param.value, t); param.linearRampToValueAtTime(v, t + dur); }
      else param.setValueAtTime(v, t);
    }
    tone(t, dur, f, type, vol, out, slide) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(out || this.master); o.start(t); o.stop(t + dur + 0.05);
    }
    noise(t, dur, vol, freq, to, swell) {
      const len = Math.floor(this.ctx.sampleRate * dur), b = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const s = this.ctx.createBufferSource(); s.buffer = b;
      const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(freq || 1200, t);
      if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
      const g = this.ctx.createGain();
      if (swell) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * swell); }
      else g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(this.master); s.start(t);
    }
    sfx(id) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime, n = (m) => 440 * Math.pow(2, (m - 69) / 12);
      switch (id) {
        case 'select': this.tone(t, 0.05, 1200, 'square', 0.08); break;
        case 'msg_in': this.tone(t, 0.07, n(84), 'triangle', 0.12); this.tone(t + 0.08, 0.1, n(91), 'triangle', 0.1); break;
        case 'msg_out': this.tone(t, 0.05, n(79), 'triangle', 0.1, null, 400); break;
        case 'confirm': this.tone(t, 0.06, 880, 'square', 0.1); this.tone(t + 0.06, 0.08, 1320, 'square', 0.1); break;
        case 'cancel': this.tone(t, 0.08, 600, 'square', 0.1, null, -300); break;
        case 'deny': this.tone(t, 0.15, 180, 'square', 0.12); break;
        case 'hit': this.noise(t, 0.12, 0.35, 900); this.tone(t, 0.08, 220, 'square', 0.12, null, -120); break;
        case 'crit': this.noise(t, 0.18, 0.45, 1500); this.tone(t, 0.12, 440, 'sawtooth', 0.15, null, -300); break;
        case 'break': this.noise(t, 0.4, 0.5, 2400); for (let i = 0; i < 4; i++) this.tone(t + i * 0.04, 0.1, 1800 - i * 300, 'square', 0.1); break;
        case 'heal': [72, 76, 79, 84].forEach((m, i) => this.tone(t + i * 0.06, 0.2, n(m), 'triangle', 0.12)); break;
        case 'shield': this.tone(t, 0.3, 300, 'triangle', 0.15, null, 500); break;
        case 'ult': this.tone(t, 0.5, 200, 'sawtooth', 0.12, null, 800); this.noise(t + 0.2, 0.4, 0.3, 600); break;
        case 'buff': this.tone(t, 0.12, 660, 'triangle', 0.12); this.tone(t + 0.1, 0.16, 990, 'triangle', 0.12); break;
        case 'debuff': this.tone(t, 0.2, 400, 'square', 0.08, null, -250); break;
        case 'door': this.noise(t, 0.2, 0.2, 400); break;
        case 'chest': [67, 71, 74, 79].forEach((m, i) => this.tone(t + i * 0.07, 0.15, n(m), 'square', 0.08)); break;
        case 'anchor': [60, 67, 72].forEach((m, i) => this.tone(t + i * 0.1, 0.4, n(m), 'triangle', 0.12)); break;
        case 'lever': this.noise(t, 0.15, 0.3, 300); this.tone(t + 0.1, 0.3, 110, 'sawtooth', 0.12, null, 60); break;
        case 'swing': this.noise(t, 0.12, 0.2, 3000); break;
        case 'tech': this.tone(t, 0.3, 500, 'triangle', 0.12, null, 700); break;
        case 'warp': this.tone(t, 0.6, 200, 'sine', 0.2, null, 1600); break;
        case 'break_obj': this.noise(t, 0.25, 0.4, 800); break;
        case 'levelup': [72, 76, 79, 84, 88].forEach((m, i) => this.tone(t + i * 0.08, 0.2, n(m), 'square', 0.08)); break;
        case 'win': [72, 72, 72, 72, 68, 70, 72, 70, 72].forEach((m, i) => this.tone(t + i * 0.11, i === 8 ? 0.6 : 0.1, n(m), 'square', 0.09)); break;
        case 'lose': [67, 63, 60, 55].forEach((m, i) => this.tone(t + i * 0.2, 0.3, n(m), 'triangle', 0.12)); break;
        case 'star5': [72, 76, 79, 84, 88, 91].forEach((m, i) => this.tone(t + i * 0.09, 0.5, n(m), 'triangle', 0.12)); break;
        case 'star4': [72, 76, 81].forEach((m, i) => this.tone(t + i * 0.09, 0.3, n(m), 'triangle', 0.12)); break;
        case 'ticket': [84, 88, 91].forEach((m, i) => this.tone(t + i * 0.05, 0.25, n(m), 'triangle', 0.1)); this.noise(t, 0.12, 0.15, 3000); break;
        case 'whoosh': this.noise(t, 1.4, 0.35, 300, 2600, 0.35); this.tone(t, 1.2, 90, 'sine', 0.12, null, 260); break;
        case 'rumble': this.noise(t, 1.6, 0.4, 180, 420, 0.3); this.tone(t, 1.4, 55, 'sawtooth', 0.08, null, 30); this.tone(t + 0.35, 0.5, n(79), 'triangle', 0.06); this.tone(t + 0.35, 0.5, n(83), 'triangle', 0.05); break;
        case 'brake': this.noise(t, 1.2, 0.22, 3400, 1800); this.tone(t, 1.1, 2100, 'sawtooth', 0.025, null, -700); break;
        case 'splash': this.noise(t, 0.8, 0.45, 900, 180); this.noise(t, 0.3, 0.3, 3200, 1200); this.tone(t, 0.35, 320, 'sine', 0.1, null, -220); break;
        case 'steam': this.noise(t, 0.9, 0.3, 1600, 700, 0.1); break;
        case 'glint': [91, 96].forEach((m, i) => this.tone(t + i * 0.06, 0.35, n(m), 'triangle', 0.08)); break;
        case 'text': this.tone(t, 0.02, 1600 + Math.random() * 200, 'square', 0.025); break;
        case 'step': this.noise(t, 0.04, 0.06, 1500); break;
        case 'shutter': this.noise(t, 0.04, 0.4, 4200); this.tone(t + 0.035, 0.03, 2600, 'square', 0.05); this.noise(t + 0.08, 0.05, 0.3, 2800); break;
        case 'strum': [52, 59, 64, 67, 71].forEach((m, i) => this.tone(t + i * 0.018, 0.9, n(m), 'sawtooth', 0.045)); this.noise(t, 0.08, 0.2, 2600); break;
        default: this.tone(t, 0.05, 800, 'square', 0.06);
      }
    }
    music(id) {
      this.wanted = id;
      if (!this.ctx) return;
      if (this.track === id) return;
      this.stopMusic();
      const tr = TRACKS[id];
      if (!tr) return;
      this.track = id;
      if (tr.midi) this.playMidi(id, tr);
      else this.sequence(id, tr);
    }
    playMidi(id, tr) {
      const ctx = this.ctx;
      H.Midi.load(tr.midi).then(song => {
        if (this.ctx !== ctx || this.track !== id) return;
        this.midi = new H.Midi.Player(ctx, this.mus, song);
        this.midi.start();
      }).catch(() => {
        if (this.ctx === ctx && this.track === id) this.sequence(id, tr.mel ? tr : TRACKS[tr.fallback]);
      });
    }
    sequence(id, tr) {
      this.step = 0; this.next = this.ctx.currentTime + 0.05;
      const spb = 60 / tr.bpm / 2;
      const tick = () => {
        if (!this.ctx || this.track !== id) return;
        while (this.next < this.ctx.currentTime + 0.25) {
          const i = this.step;
          const m = tr.mel[i % tr.mel.length];
          if (m) this.tone(this.next, spb * 1.6, 440 * Math.pow(2, (m - 69) / 12), tr.wave, 0.07, this.mus);
          if (i % 2 === 0) { const b = tr.bass[(i / 2) % tr.bass.length]; if (b) this.tone(this.next, spb * 1.8, 440 * Math.pow(2, (b - 69) / 12), 'triangle', 0.12, this.mus); }
          if (FIGHT_TRACKS.has(TRACKS[id].fallback || id) && i % 4 === 0) this.noiseMus(this.next);
          this.step++; this.next += spb;
        }
      };
      tick();
      this.timer = setInterval(tick, 60);
    }
    noiseMus(t) {
      const len = Math.floor(this.ctx.sampleRate * 0.05), b = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const s = this.ctx.createBufferSource(); s.buffer = b;
      const g = this.ctx.createGain(); g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      s.connect(g); g.connect(this.mus); s.start(t);
    }
    stopMusic() {
      if (this.timer) clearInterval(this.timer);
      if (this.midi) this.midi.stop();
      this.timer = null; this.midi = null; this.track = null;
    }
    stem(url) {
      if (this.stemCtx !== this.ctx) { this.stemCtx = this.ctx; this.stemBufs = {}; }
      const ctx = this.ctx;
      if (!this.stemBufs[url]) this.stemBufs[url] = fetch(url).then(r => { if (!r.ok) throw new Error(r.status + ' ' + url); return r.arrayBuffer(); }).then(b => ctx.decodeAudioData(b));
      return this.stemBufs[url];
    }
    preloadSong(id) {
      const song = SONGS[id];
      if (!this.ctx || !song || (this.stemCtx === this.ctx && this.stemBufs[song.parts.inst])) return;
      Object.values(song.parts).forEach(url => this.stem(url).catch(() => { }));
    }
    song(id, from = 0) {
      if (this.layers && this.layers.id === id) return;
      this.stopSong(0);
      this.wantedSong = id;
      const song = SONGS[id];
      if (!this.ctx || !song) return;
      const ctx = this.ctx, out = ctx.createGain(), parts = Object.keys(song.parts);
      out.gain.value = this.musicVol; out.connect(ctx.destination);
      const L = this.layers = { id, out, t0: ctx.currentTime - from, gains: {}, passes: [], voice: null, timer: null };
      this.ramp(this.mus.gain, 0, 0.4);
      for (const part of parts) {
        const g = ctx.createGain();
        g.gain.value = part === 'inst' ? 1 : 0; g.connect(out); L.gains[part] = g;
      }
      Promise.all(parts.map(part => this.stem(song.parts[part]))).then(bufs => {
        if (this.layers !== L) return;
        const [a, b] = song.loop || [0, bufs[0].duration];
        let at = ctx.currentTime + 0.05, from = at - L.t0;
        if (from >= b) from = a + (from - b) % (b - a);
        const pass = () => {
          if (this.layers !== L) return;
          const end = at + b - from;
          L.passes = L.passes.slice(-1).concat([parts.map((part, i) => {
            const s = ctx.createBufferSource(), g = ctx.createGain(), stop = end + (part === 'inst' ? 0.03 : song.tail || 0);
            s.buffer = bufs[i]; s.connect(g); g.connect(L.gains[part]);
            g.gain.setValueAtTime(1, stop - 0.04); g.gain.linearRampToValueAtTime(0, stop);
            s.start(at, from); s.stop(stop + 0.02);
            return s;
          })]);
          at = end; from = a;
          L.timer = setTimeout(pass, Math.max(0, (end - ctx.currentTime - 1.5) * 1000));
        };
        pass();
      }).catch(() => { });
    }
    songVoice(part) {
      const L = this.layers;
      if (!L || L.voice === part || !L.gains[part]) return;
      L.voice = part;
      for (const p of Object.keys(L.gains)) if (p !== 'inst') this.ramp(L.gains[p].gain, p === part ? 1 : 0, 0.6);
    }
    stopSong(fade = 0.8) {
      this.wantedSong = null;
      const L = this.layers;
      if (!L) return;
      this.layers = null;
      clearTimeout(L.timer);
      const end = this.ctx.currentTime + fade;
      this.ramp(L.out.gain, 0, fade);
      L.passes.forEach(pass => pass.forEach(s => { try { s.stop(end + 0.05); } catch (e) { } }));
      setTimeout(() => { try { L.out.disconnect(); } catch (e) { } }, (fade + 0.2) * 1000);
      this.ramp(this.mus.gain, this.musicVol, fade + 0.6);
    }
    destroy() { this.stopSong(0); this.stopMusic(); if (this.ctx) { try { this.ctx.close(); } catch (e) { } } this.ctx = null; }
  }

  Object.assign(H, { Audio, TRACKS, SONGS });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
