(function (H) {
  'use strict';
  const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const freq = name => {
    const m = /^([A-G]#?)(\d)$/.exec(name);
    return m ? 440 * Math.pow(2, (NOTE[m[1]] + (+m[2] + 1) * 12 - 69) / 12) : 0;
  };

  const THEMES = {
    title: {
      name: 'Семь лун', step: 0.34,
      voices: [
        { wave: 'triangle', gain: 0.17, len: 3, notes: 'D3 A3 D4 F4 A4 F4 D4 A3 C3 G3 C4 E4 G4 E4 C4 G3 A#2 F3 A#3 D4 F4 D4 A#3 F3 A2 E3 A3 C#4 E4 C#4 A3 E3' },
        { wave: 'sine', gain: 0.2, len: 7, notes: 'D5 . . F5 . G5 A5 . . . C6 . A5 . . . G5 . . A5 . G5 F5 . . . E5 . F5 . E5 D5' },
        { wave: 'sine', gain: 0.1, len: 16, notes: 'D3 . . . . . . . C3 . . . . . . . A#2 . . . . . . . A2 . . . . . . .' }
      ]
    },
    meadow: {
      name: 'Заливные луга', step: 0.24,
      voices: [
        { wave: 'triangle', gain: 0.15, len: 2, notes: 'G3 . D4 . B3 . D4 . C4 . G4 . E4 . G4 . A3 . E4 . C4 . E4 . D4 . A4 . F#4 . A4 .' },
        { wave: 'square', gain: 0.045, len: 3, notes: 'G4 . B4 D5 . . E5 D5 C5 . E5 G5 . . E5 C5 A4 . C5 E5 . . D5 C5 D5 . F#5 A5 . G5 F#5 D5' },
        { wave: 'sine', gain: 0.14, len: 6, notes: 'G2 . . . . . . . C3 . . . . . . . A2 . . . . . . . D3 . . . . . . .' }
      ]
    },
    steppe: {
      name: 'Степной ветер', step: 0.3,
      voices: [
        { wave: 'sawtooth', gain: 0.035, len: 22, notes: 'A2 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .' },
        { wave: 'triangle', gain: 0.17, len: 3, notes: 'A4 . C5 D5 E5 . . D5 C5 . A4 G4 A4 . . . E5 . G5 A5 G5 E5 D5 . C5 D5 E5 . A4 . . .' },
        { wave: 'square', gain: 0.03, len: 1, notes: 'A3 . E3 . A3 . E3 . G3 . D3 . G3 . D3 . A3 . E3 . A3 . E3 . C4 . G3 . A3 . E3 .' }
      ]
    },
    battle: {
      name: 'Бой', step: 0.16,
      voices: [
        { wave: 'sawtooth', gain: 0.07, len: 1, notes: 'E2 E2 . E2 E3 . E2 . G2 G2 . G2 G3 . D3 . A2 A2 . A2 A3 . A2 . B2 B2 . B2 B3 . B2 .' },
        { wave: 'square', gain: 0.05, len: 3, notes: 'E4 . . G4 A4 . B4 . D5 . . B4 A4 . G4 . A4 . . C5 B4 . A4 . F#4 . G4 . A4 . B4 .' },
        { wave: 'noise', gain: 0.09, len: 1, notes: 'x . . x . . x . x . . x . . x . x . . x . . x . x . . x . x x .' }
      ]
    },
    victory: {
      name: 'Победа', step: 0.2, once: true,
      voices: [
        { wave: 'square', gain: 0.07, len: 3, notes: 'D4 F#4 A4 D5 . A4 D5 F#5 . . . . .' },
        { wave: 'triangle', gain: 0.15, len: 8, notes: 'D3 . . . A3 . . . D3 . . . .' }
      ]
    },
    defeat: {
      name: 'Поражение', step: 0.3, once: true,
      voices: [
        { wave: 'triangle', gain: 0.17, len: 3, notes: 'A4 F4 D4 C#4 . D4 A3 . . .' },
        { wave: 'sine', gain: 0.15, len: 8, notes: 'D3 . . . A2 . . . . .' }
      ]
    }
  };

  const STEP_NOISE = { meadow: 900, steppe: 1100, palegrass: 900, forest: 700, swamp: 420, sand: 1500, saltflat: 1800, highland: 1300, ash: 1000, cave: 1200, fungal: 500 };
  const WEAPON = { melee: 1, retal: 1, support: 0.8, shot: 0.7, saddle: 0.7, bell: 0.9, spell: 0.9, poison: 0.5, fire: 0.6, thorn: 0.5, last: 1 };

  class Sound {
    constructor(ctx, volumes) {
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.comp = ctx.createDynamicsCompressor();
      this.comp.threshold.value = -14;
      this.comp.ratio.value = 3;
      this.musicBus = ctx.createGain();
      this.sfxBus = ctx.createGain();
      this.musicBus.connect(this.comp);
      this.sfxBus.connect(this.comp);
      this.comp.connect(this.master);
      this.master.connect(ctx.destination);
      this.setVolumes(volumes);
      const len = Math.floor(ctx.sampleRate * 0.5), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
      this.theme = null;
      this.at = 0;
      this.pos = 0;
      this.timer = setInterval(() => this.schedule(), 90);
    }

    setVolumes(v) {
      this.musicBus.gain.value = v.music;
      this.sfxBus.gain.value = v.sound;
    }

    play(id) {
      if (this.theme === id) return;
      this.theme = id;
      this.pos = 0;
      this.at = this.ctx.currentTime + 0.08;
      this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
    }

    stop() {
      this.theme = null;
    }

    tone(voice, name, when, dur, bus) {
      const c = this.ctx, g = c.createGain();
      g.connect(bus);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(voice.gain, when + Math.min(0.02, dur / 4));
      g.gain.exponentialRampToValueAtTime(Math.max(0.0005, voice.gain * 0.03), when + dur);
      let src;
      if (voice.wave === 'noise') {
        src = c.createBufferSource();
        src.buffer = this.noise;
        const f = c.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 2400;
        src.connect(f);
        f.connect(g);
      } else {
        src = c.createOscillator();
        src.type = voice.wave;
        src.frequency.value = freq(name);
        src.connect(g);
      }
      src.onended = () => g.disconnect();
      src.start(when);
      src.stop(when + dur + 0.02);
    }

    schedule() {
      if (!this.theme || this.ctx.state !== 'running') return;
      const th = THEMES[this.theme], rows = th.voices.map(v => v.notes.split(' ')), n = Math.max(...rows.map(r => r.length));
      if (this.at < this.ctx.currentTime) this.at = this.ctx.currentTime + 0.05;
      while (this.at < this.ctx.currentTime + 0.3) {
        th.voices.forEach((v, i) => {
          const name = rows[i][this.pos % rows[i].length];
          if (name !== '.') this.tone(v, name, this.at, th.step * v.len, this.musicBus);
        });
        this.at += th.step;
        this.pos++;
        if (this.pos >= n) {
          if (th.once) {
            this.theme = null;
            return;
          }
          this.pos = 0;
        }
      }
    }

    burst(band, gain, dur, q) {
      const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), when = c.currentTime;
      src.buffer = this.noise;
      f.type = 'bandpass';
      f.frequency.value = band;
      f.Q.value = q || 1;
      g.gain.setValueAtTime(gain, when);
      g.gain.exponentialRampToValueAtTime(0.0005, when + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.sfxBus);
      src.onended = () => g.disconnect();
      src.start(when, Math.random() * 0.3);
      src.stop(when + dur + 0.02);
    }

    ping(wave, from, to, gain, dur) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(), when = c.currentTime;
      o.type = wave;
      o.frequency.setValueAtTime(from, when);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, to), when + dur);
      g.gain.setValueAtTime(gain, when);
      g.gain.exponentialRampToValueAtTime(0.0005, when + dur);
      o.connect(g);
      g.connect(this.sfxBus);
      o.onended = () => g.disconnect();
      o.start(when);
      o.stop(when + dur + 0.02);
    }

    click() {
      this.ping('square', 880, 660, 0.05, 0.05);
    }

    pop() {
      this.ping('triangle', 300, 520, 0.09, 0.1);
    }

    coin() {
      this.ping('square', 1300, 1700, 0.04, 0.08);
      this.ping('square', 1900, 2300, 0.03, 0.12);
    }

    step(terrain) {
      this.burst(STEP_NOISE[terrain] || 900, 0.13, 0.09, 1.4);
    }

    hit(kind) {
      const k = WEAPON[kind] || 0.8;
      this.burst(600 + Math.random() * 500, 0.3 * k, 0.14, 0.8);
      this.ping('square', 170, 70, 0.09 * k, 0.12);
    }

    shot() {
      this.burst(2800, 0.11, 0.18, 3);
    }

    death() {
      this.ping('sawtooth', 260, 60, 0.1, 0.32);
      this.burst(320, 0.16, 0.28, 0.7);
    }

    cast() {
      this.ping('sine', 500, 1500, 0.09, 0.32);
      this.ping('triangle', 750, 2200, 0.05, 0.4);
    }

    destroy() {
      clearInterval(this.timer);
      this.theme = null;
      this.master.disconnect();
    }
  }

  H.THEMES = THEMES;
  H.noteFreq = freq;
  H.Sound = Sound;
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
