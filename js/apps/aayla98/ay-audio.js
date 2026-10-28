(function (A) {
  'use strict';
  A.Audio = class {
    constructor(ui) {
      this.ui = ui;
      this.volume = 0.5;
      this.musicVolume = 0.7;
      this.last = 0;
      this.track = null;
    }

    ctx() {
      const ac = this.ui.ac;
      if (!ac) return null;
      if (ac.state === 'suspended') ac.resume();
      if (!this.out || this.out.context !== ac) {
        this.out = ac.createGain();
        this.out.connect(ac.destination);
      }
      this.out.gain.value = this.volume;
      return ac;
    }

    blip(pitch) {
      const ac = this.ctx();
      if (!ac || ac.state !== 'running') return;
      const t = ac.currentTime;
      if (t - this.last < 0.03) return;
      this.last = t;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'square';
      o.frequency.value = pitch * (0.97 + ((t * 977) % 1) * 0.06);
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
      o.connect(g);
      g.connect(this.out);
      o.start(t);
      o.stop(t + 0.05);
    }

    click() {
      this.blip(1200);
    }

    tone(o) {
      const ac = this.ctx();
      if (!ac || ac.state !== 'running') return;
      const t = ac.currentTime, g = ac.createGain();
      g.gain.setValueAtTime(o.vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + o.dur);
      g.connect(this.out);
      if (o.noise) {
        const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * o.dur), ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource();
        src.buffer = buf;
        src.connect(g);
        src.start(t);
        return;
      }
      const osc = ac.createOscillator();
      osc.type = o.type;
      osc.frequency.setValueAtTime(o.f0, t);
      osc.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
      osc.connect(g);
      osc.start(t);
      osc.stop(t + o.dur + 0.02);
    }

    sfx(name) {
      (SFX[name] || []).forEach(o => this.tone(o));
    }

    noise(ac) {
      if (!this.noiseBuf || this.noiseBuf.ctx !== ac) {
        const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * 0.3), ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = { ctx: ac, buf };
      }
      return this.noiseBuf.buf;
    }

    music(name) {
      if ((this.track ? this.track.name : null) === (name || null)) return;
      this.stopMusic();
      const def = name && A.TRACKS[name];
      if (!def) return;
      this.track = { name, beat: 60 / def.bpm, parts: def.parts.map(pt => ({ pt, notes: A.parseNotes(pt.notes), i: 0, t: 0 })) };
    }

    stopMusic() {
      const g = this.musicOut;
      if (g) {
        try { g.gain.setTargetAtTime(0, g.context.currentTime, 0.12); } catch (e) { }
        setTimeout(() => { try { g.disconnect(); } catch (e) { } }, 900);
      }
      this.musicOut = null;
      this.track = null;
    }

    updateMusic() {
      const tr = this.track, ac = this.ctx();
      if (!tr || !ac || ac.state !== 'running') return;
      if (!this.musicOut || this.musicOut.context !== ac) {
        this.musicOut = ac.createGain();
        this.musicOut.gain.value = this.musicVolume;
        this.musicOut.connect(this.out);
      }
      const now = ac.currentTime;
      for (const p of tr.parts) {
        if (p.t < now - 0.2) p.t = now + 0.05;
        while (p.t < now + 0.3) {
          const [n, len] = p.notes[p.i], dur = len * tr.beat;
          if (n !== 'r') this.note(ac, p.pt, n, p.t, dur);
          p.t += dur;
          p.i = (p.i + 1) % p.notes.length;
        }
      }
    }

    note(ac, pt, n, t, dur) {
      const g = ac.createGain();
      g.connect(this.musicOut);
      if (pt.wave === 'noise') {
        const kick = n === 'k';
        g.gain.setValueAtTime(pt.vol * (kick ? 1.6 : 0.6), t);
        g.gain.exponentialRampToValueAtTime(0.0005, t + (kick ? 0.12 : 0.04));
        if (kick) {
          const o = ac.createOscillator();
          o.type = 'sine';
          o.frequency.setValueAtTime(120, t);
          o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
          o.connect(g);
          o.start(t);
          o.stop(t + 0.13);
        } else {
          const src = ac.createBufferSource();
          src.buffer = this.noise(ac);
          src.connect(g);
          src.start(t);
          src.stop(t + 0.05);
        }
        return;
      }
      const o = ac.createOscillator();
      o.type = pt.wave;
      o.frequency.value = A.noteFreq(n);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(pt.vol, t + 0.012);
      g.gain.setValueAtTime(pt.vol, t + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0005, t + dur * 0.97);
      o.connect(g);
      o.start(t);
      o.stop(t + dur);
    }
  };

  const SFX = {
    blade: [{ type: 'sawtooth', f0: 240, f1: 110, dur: 0.16, vol: 0.04 }, { noise: true, dur: 0.12, vol: 0.035 }],
    clash: [{ type: 'triangle', f0: 1900, f1: 1300, dur: 0.09, vol: 0.05 }, { noise: true, dur: 0.05, vol: 0.04 }],
    ignite: [{ type: 'sawtooth', f0: 70, f1: 150, dur: 0.35, vol: 0.05 }, { type: 'sine', f0: 110, f1: 112, dur: 0.6, vol: 0.05 }],
    shot: [{ type: 'square', f0: 1700, f1: 240, dur: 0.17, vol: 0.035 }, { type: 'sine', f0: 900, f1: 300, dur: 0.12, vol: 0.03 }],
    fade: [{ type: 'triangle', f0: 660, f1: 220, dur: 0.4, vol: 0.03 }],
    deflect: [{ type: 'triangle', f0: 900, f1: 1900, dur: 0.12, vol: 0.05 }, { type: 'sawtooth', f0: 170, f1: 120, dur: 0.15, vol: 0.03 }],
    force: [{ type: 'sine', f0: 110, f1: 40, dur: 0.35, vol: 0.12 }],
    lightning: [{ noise: true, dur: 0.3, vol: 0.04 }, { type: 'sawtooth', f0: 1300, f1: 220, dur: 0.3, vol: 0.025 }],
    hit: [{ noise: true, dur: 0.08, vol: 0.05 }],
    down: [{ type: 'sine', f0: 240, f1: 60, dur: 0.4, vol: 0.06 }],
    heal: [{ type: 'triangle', f0: 520, f1: 960, dur: 0.25, vol: 0.04 }],
    rocks: [{ noise: true, dur: 0.5, vol: 0.06 }, { type: 'sine', f0: 80, f1: 30, dur: 0.5, vol: 0.1 }],
    win: [{ type: 'triangle', f0: 520, f1: 1040, dur: 0.4, vol: 0.05 }],
    lose: [{ type: 'triangle', f0: 400, f1: 120, dur: 0.6, vol: 0.05 }]
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
