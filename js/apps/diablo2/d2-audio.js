(function (D) {
  'use strict';

  const midi = m => 440 * Math.pow(2, (m - 69) / 12);

  const THEMES = {
    menu: { bpm: 60, root: 50, scale: [0, 2, 3, 5, 7, 8, 10], pad: true, choir: true, pluck: false, drum: 0 },
    town: { bpm: 76, root: 50, scale: [0, 2, 3, 5, 7, 8, 10], pad: true, pluck: true, prog: [0, 5, 3, 4], drum: 0 },
    tristram: { bpm: 64, root: 52, scale: [0, 2, 3, 5, 7, 8, 11], pad: true, pluck: true, prog: [0, 3, 4, 0], drum: 0, melody: [0, 3, 7, 12, 10, 7, 8, 7, 3, 5, 3, 2] },
    wild: { bpm: 52, root: 45, scale: [0, 1, 3, 5, 7, 8, 10], pad: true, pluck: false, wind: true, drum: 0.15 },
    cave: { bpm: 48, root: 40, scale: [0, 1, 3, 6, 7, 8, 11], pad: true, drip: true, drum: 0.1 },
    dungeon: { bpm: 50, root: 41, scale: [0, 1, 3, 5, 6, 8, 10], pad: true, drip: true, metal: true, drum: 0.2 },
    boss: { bpm: 96, root: 38, scale: [0, 1, 3, 5, 6, 8, 10], pad: true, drum: 1, brass: true }
  };

  class Audio {
    constructor() {
      this.ctx = null;
      this.musicVol = 0.45; this.sfxVol = 0.7;
      this.theme = null; this.want = null;
      this.step = 0; this.nextT = 0;
      this.timer = null;
      this.lastSfx = {};
    }

    init() {
      if (this.ctx) return true;
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return false;
      try { this.ctx = new AC(); } catch (e) { return false; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = 0.9; this.master.connect(c.destination);
      this.mus = c.createGain(); this.mus.gain.value = this.musicVol; this.mus.connect(this.master);
      this.fx = c.createGain(); this.fx.gain.value = this.sfxVol; this.fx.connect(this.master);
      const len = c.sampleRate * 2;
      this.noise = c.createBuffer(1, len, c.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.verb = c.createConvolver();
      const ir = c.createBuffer(2, c.sampleRate * 2.2, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const x = ir.getChannelData(ch); for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / x.length, 3); }
      this.verb.buffer = ir;
      this.verbGain = c.createGain(); this.verbGain.gain.value = 0.35;
      this.verb.connect(this.verbGain); this.verbGain.connect(this.master);
      this.timer = setInterval(() => this.tick(), 60);
      return true;
    }

    resume() { if (!this.init()) return; if (this.ctx.state === 'suspended') this.ctx.resume(); }

    setVolumes(m, s) {
      this.musicVol = m; this.sfxVol = s;
      if (this.ctx) { this.mus.gain.value = m; this.fx.gain.value = s; }
    }

    close() { if (this.timer) clearInterval(this.timer); if (this.ctx) try { this.ctx.close(); } catch (e) { } this.ctx = null; }

    env(g, t, a, d, peak) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }

    osc(type, f, t, dur, peak, dest, f2) {
      const c = this.ctx;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
      this.env(g, t, Math.min(0.01, dur * 0.2), dur, peak);
      o.connect(g); g.connect(dest || this.fx);
      o.start(t); o.stop(t + dur + 0.05);
      return o;
    }

    nz(t, dur, peak, type, f, f2, q, dest) {
      const c = this.ctx;
      const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
      const fl = c.createBiquadFilter(); fl.type = type || 'lowpass'; fl.frequency.setValueAtTime(f || 1000, t); fl.Q.value = q || 1;
      if (f2) fl.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + dur);
      const g = c.createGain();
      this.env(g, t, Math.min(0.02, dur * 0.2), dur, peak);
      s.connect(fl); fl.connect(g); g.connect(dest || this.fx);
      s.start(t, Math.random()); s.stop(t + dur + 0.05);
    }

    sfx(name, vol) {
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime + 0.005;
      if (this.lastSfx[name] && t - this.lastSfx[name] < 0.04) return;
      this.lastSfx[name] = t;
      const v = vol === undefined ? 1 : vol;
      if (v < 0.03) return;
      const k = v;
      switch (name) {
        case 'swing': case 'mswing': this.nz(t, 0.16, 0.25 * k, 'bandpass', name === 'swing' ? 1400 : 700, 300, 1.5); break;
        case 'hit': this.osc('sine', 140, t, 0.12, 0.45 * k, null, 55); this.nz(t, 0.09, 0.3 * k, 'lowpass', 1800, 400); break;
        case 'crit': this.osc('sine', 160, t, 0.15, 0.5 * k, null, 50); this.nz(t, 0.12, 0.35 * k, 'bandpass', 2500, 800, 2); break;
        case 'hit_fire': this.nz(t, 0.25, 0.3 * k, 'bandpass', 900, 400, 0.8); break;
        case 'hit_cold': this.osc('triangle', 2400, t, 0.12, 0.15 * k, null, 1800); this.nz(t, 0.12, 0.15 * k, 'highpass', 4000); break;
        case 'hit_light': this.osc('square', 900, t, 0.1, 0.12 * k, null, 120); this.nz(t, 0.08, 0.2 * k, 'highpass', 3000); break;
        case 'hit_poison': this.nz(t, 0.3, 0.12 * k, 'bandpass', 1600, 1200, 3); break;
        case 'hit_magic': this.osc('sine', 700, t, 0.18, 0.18 * k, null, 1400); break;
        case 'block': this.osc('triangle', 820, t, 0.12, 0.25 * k, null, 700); this.osc('triangle', 1240, t, 0.1, 0.15 * k); this.nz(t, 0.05, 0.2 * k, 'highpass', 2500); break;
        case 'bow': this.osc('sawtooth', 220, t, 0.12, 0.12 * k, null, 180); this.nz(t, 0.14, 0.14 * k, 'bandpass', 2000, 600, 2); break;
        case 'throw': case 'quill': this.nz(t, 0.18, 0.2 * k, 'bandpass', 1200, 400, 1.5); break;
        case 'magic_arrow': this.osc('sine', 900, t, 0.2, 0.15 * k, null, 1600); this.nz(t, 0.14, 0.1 * k, 'bandpass', 2000, 600, 2); break;
        case 'cast_firebolt': case 'cast_fireball': case 'meteor_cast': case 'inferno': case 'firewall': case 'cast_fire': case 'cast_firestorm': case 'cast_boulder':
          this.nz(t, name === 'meteor_cast' ? 0.9 : 0.35, 0.3 * k, 'lowpass', 1400, 300, 0.8); this.osc('sawtooth', 90, t, 0.3, 0.08 * k, null, 60); break;
        case 'cast_icebolt': case 'cast_cold': case 'arctic': this.osc('sine', 1800, t, 0.25, 0.12 * k, null, 2600); this.osc('sine', 2700, t + 0.04, 0.2, 0.08 * k); this.nz(t, 0.25, 0.1 * k, 'highpass', 5000); break;
        case 'cast_cbolt': case 'chain': case 'static': case 'nova_light': case 'cast_light': case 'cast_lfury':
          for (let i = 0; i < 4; i++) this.osc('square', 300 + Math.random() * 1200, t + i * 0.03, 0.05, 0.08 * k, null, 100); this.nz(t, 0.3, 0.18 * k, 'highpass', 2500); break;
        case 'nova_cold': case 'blizzard': case 'orb_burst': case 'cast_frozenorb': this.nz(t, 0.6, 0.25 * k, 'highpass', 3000, 6000); this.osc('sine', 2200, t, 0.3, 0.06 * k, null, 3000); break;
        case 'nova_poison': case 'andariel_spray': case 'cast_poison': this.nz(t, 0.7, 0.2 * k, 'bandpass', 900, 1800, 2); break;
        case 'nova_fire': case 'explode_fire': case 'explode_corpse': case 'volcano': this.nz(t, 0.7, 0.55 * k, 'lowpass', 900, 80); this.osc('sine', 80, t, 0.5, 0.4 * k, null, 35); break;
        case 'explode_cold': this.nz(t, 0.4, 0.3 * k, 'highpass', 2000, 5000); this.osc('triangle', 3000, t, 0.2, 0.1 * k, null, 1500); break;
        case 'cast_tooth': case 'cast_bonespear': case 'cast_magic': case 'cast_holybolt': case 'cast_hammer': this.osc('sine', 500, t, 0.25, 0.14 * k, null, 1100); this.nz(t, 0.2, 0.08 * k, 'bandpass', 1500, 3000, 3); break;
        case 'cast_bomb': case 'cast_web': case 'cast_sentinel': case 'cast_tornado': this.nz(t, 0.25, 0.18 * k, 'bandpass', 800, 1600, 1); break;
        case 'teleport': this.osc('sine', 300, t, 0.3, 0.2 * k, null, 1600); this.nz(t, 0.3, 0.12 * k, 'bandpass', 1000, 4000, 2); break;
        case 'warcry': this.osc('sawtooth', 110, t, 0.45, 0.25 * k, null, 80); this.nz(t, 0.45, 0.2 * k, 'bandpass', 500, 300, 2); break;
        case 'curse': this.osc('sawtooth', 110, t, 0.5, 0.12 * k, null, 100); this.osc('sawtooth', 117, t, 0.5, 0.12 * k, null, 106); break;
        case 'die_undead': for (let i = 0; i < 6; i++) this.osc('square', 1400 + Math.random() * 800, t + i * 0.05, 0.03, 0.12 * k); break;
        case 'die_demon': this.osc('sawtooth', 600, t, 0.4, 0.2 * k, null, 120); this.nz(t, 0.3, 0.12 * k, 'bandpass', 900, 300, 2); break;
        case 'die_beast': this.osc('sawtooth', 180, t, 0.35, 0.22 * k, null, 60); break;
        case 'boss_die': this.osc('sawtooth', 160, t, 2.2, 0.35 * k, null, 30); this.nz(t, 2.0, 0.35 * k, 'lowpass', 800, 60); break;
        case 'hero_die': this.osc('sine', 220, t, 1.4, 0.3 * k, null, 70); this.osc('sine', 330, t, 1.4, 0.15 * k, null, 100); break;
        case 'gold': for (let i = 0; i < 3; i++) this.osc('triangle', 2200 + Math.random() * 900, t + i * 0.05, 0.08, 0.12 * k); break;
        case 'pickup': case 'item_up': this.nz(t, 0.08, 0.2 * k, 'bandpass', 700, 400, 1); break;
        case 'item_down': case 'drop': case 'equip_armor': this.osc('sine', 180, t, 0.08, 0.25 * k, null, 90); this.nz(t, 0.06, 0.15 * k, 'lowpass', 900); break;
        case 'equip_weapon': this.osc('triangle', 1100, t, 0.12, 0.12 * k, null, 900); this.nz(t, 0.08, 0.1 * k, 'highpass', 3000); break;
        case 'equip_jewel': this.osc('sine', 2600, t, 0.12, 0.1 * k); break;
        case 'drop_potion': this.osc('triangle', 1800, t, 0.06, 0.12 * k); this.osc('triangle', 2400, t + 0.04, 0.06, 0.1 * k); break;
        case 'drop_special': [0, 4, 7, 12].forEach((n, i) => this.osc('sine', midi(76 + n), t + i * 0.06, 0.4, 0.12 * k)); break;
        case 'potion': for (let i = 0; i < 3; i++) this.osc('sine', 300 + i * 40, t + i * 0.12, 0.08, 0.2 * k, null, 180); break;
        case 'lvlup': [0, 4, 7, 12, 16].forEach((n, i) => this.osc('triangle', midi(60 + n), t + i * 0.09, 0.8, 0.14 * k, this.verb)); [0, 4, 7].forEach(n => this.osc('sine', midi(48 + n), t, 1.2, 0.1 * k)); break;
        case 'quest': [0, 7, 12, 7, 12, 16].forEach((n, i) => this.osc('triangle', midi(62 + n), t + i * 0.12, 0.5, 0.12 * k, this.verb)); break;
        case 'wp': case 'portal': this.osc('sine', 400, t, 0.8, 0.12 * k, this.verb, 1200); this.nz(t, 0.8, 0.1 * k, 'bandpass', 800, 2400, 4, this.verb); break;
        case 'chest': case 'barrel': case 'urn': case 'body': this.nz(t, 0.18, 0.3 * k, 'lowpass', 600, 200); this.osc('sawtooth', 90, t, 0.15, 0.08 * k, null, 70); break;
        case 'locked': case 'cant': case 'noroom': case 'nomana': case 'fail': this.osc('sine', 110, t, 0.2, 0.25 * k, null, 90); break;
        case 'shrine': case 'cairn': case 'identify': case 'imbue': case 'runeword': [0, 7, 12].forEach((n, i) => this.osc('sine', midi(72 + n), t + i * 0.05, 1.0, 0.1 * k, this.verb)); break;
        case 'heal': [0, 4, 7].forEach((n, i) => this.osc('sine', midi(67 + n), t + i * 0.04, 0.6, 0.08 * k, this.verb)); break;
        case 'buy': case 'sell': case 'repair': this.osc('triangle', 2000, t, 0.06, 0.1 * k); this.osc('triangle', 2600, t + 0.05, 0.06, 0.1 * k); break;
        case 'learn': case 'select': case 'swap': case 'ui_click': case 'book': this.osc('triangle', 900, t, 0.05, 0.1 * k, null, 700); break;
        case 'charge': this.osc('sine', 600, t, 0.2, 0.1 * k, null, 1200); break;
        case 'release': this.nz(t, 0.3, 0.3 * k, 'bandpass', 1500, 400, 1); break;
        case 'whirl': this.nz(t, 0.18, 0.18 * k, 'bandpass', 900, 1400, 2); break;
        case 'kick': this.osc('sine', 110, t, 0.1, 0.3 * k, null, 60); break;
        case 'form': this.osc('sawtooth', 90, t, 0.6, 0.2 * k, null, 180); this.nz(t, 0.5, 0.15 * k, 'bandpass', 400, 900, 2); break;
        case 'raise': case 'revive': this.osc('sawtooth', 70, t, 0.8, 0.15 * k, null, 140); break;
        case 'raven': this.osc('square', 1200, t, 0.08, 0.06 * k, null, 900); break;
        default:
          if (name.startsWith('summon_')) { this.osc('sine', 120, t, 0.7, 0.18 * k, this.verb, 360); this.nz(t, 0.6, 0.1 * k, 'bandpass', 500, 1500, 2); }
          else if (name.startsWith('buff_')) { [0, 5, 9].forEach((n, i) => this.osc('sine', midi(74 + n), t + i * 0.05, 0.6, 0.08 * k, this.verb)); }
          else if (name.startsWith('boss_alert')) { this.osc('sawtooth', 70, t, 1.2, 0.25 * k, null, 45); }
          else if (name.startsWith('select_')) { this.osc('sine', 220, t, 0.5, 0.12 * k, this.verb, 440); }
      }
    }

    music(name) {
      this.want = name;
      if (!this.ctx) return;
      if (this.theme === name) return;
      this.theme = name;
      this.step = 0;
      this.nextT = this.ctx.currentTime + 0.3;
    }

    tick() {
      if (!this.ctx || !this.theme) return;
      const c = this.ctx;
      const th = THEMES[this.theme];
      if (!th) return;
      const beat = 60 / th.bpm / 2;
      while (this.nextT < c.currentTime + 0.25) {
        this.playStep(th, this.step, this.nextT, beat);
        this.step++;
        this.nextT += beat;
      }
    }

    playStep(th, s, t, beat) {
      const bar = Math.floor(s / 8), pos = s % 8;
      const prog = th.prog || [0, 0, 5, 3];
      const deg = prog[bar % prog.length];
      const note = d => th.root + th.scale[((d % 7) + 7) % 7] + Math.floor(d / 7) * 12;
      if (th.pad && pos === 0) {
        for (const d of [deg, deg + 2, deg + 4]) {
          const f = midi(note(d) + 12);
          for (const det of [-4, 4]) {
            const o = this.ctx.createOscillator(), g = this.ctx.createGain(), fl = this.ctx.createBiquadFilter();
            o.type = th.choir ? 'triangle' : 'sawtooth'; o.frequency.value = f; o.detune.value = det;
            fl.type = 'lowpass'; fl.frequency.value = th.choir ? 1400 : 600;
            g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.025, t + beat * 3); g.gain.linearRampToValueAtTime(0.0001, t + beat * 8.5);
            o.connect(fl); fl.connect(g); g.connect(this.mus); g.connect(this.verb);
            o.start(t); o.stop(t + beat * 9);
          }
        }
        const b = this.ctx.createOscillator(), bg = this.ctx.createGain();
        b.type = 'sine'; b.frequency.value = midi(note(deg) - 12);
        bg.gain.setValueAtTime(0.0001, t); bg.gain.linearRampToValueAtTime(0.06, t + beat); bg.gain.linearRampToValueAtTime(0.0001, t + beat * 8);
        b.connect(bg); bg.connect(this.mus); b.start(t); b.stop(t + beat * 8.2);
      }
      if (th.pluck) {
        const pat = [0, 2, 4, 7, 4, 2, 4, 2];
        if (Math.random() < 0.85) this.pluck(midi(note(deg + pat[pos]) + 12), t, 0.09);
        if (th.melody && pos % 2 === 0) { const m = th.melody[(Math.floor(s / 2)) % th.melody.length]; if (Math.random() < 0.7) this.pluck(midi(th.root + m + 24), t + 0.01, 0.07); }
      }
      if (th.wind && pos === 0 && Math.random() < 0.5) this.nz(t, beat * 7, 0.03, 'bandpass', 400 + Math.random() * 400, 800, 3, this.mus);
      if (th.drip && Math.random() < 0.08) this.osc('sine', 1400 + Math.random() * 900, t, 0.12, 0.03, this.verb, 900);
      if (th.metal && Math.random() < 0.03) this.osc('triangle', 180 + Math.random() * 60, t, 1.5, 0.03, this.verb, 170);
      if (th.drum && (pos === 0 || (th.drum > 0.5 && pos === 4) || (th.drum > 0.9 && pos % 2 === 1 && Math.random() < 0.4))) {
        if (Math.random() < th.drum + 0.2) { this.osc('sine', 90, t, 0.35, 0.18 * Math.min(1, th.drum + 0.4), this.mus, 40); this.nz(t, 0.15, 0.05, 'lowpass', 400, 100, 1, this.mus); }
      }
      if (th.brass && pos === 0 && bar % 2 === 0) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain(), fl = this.ctx.createBiquadFilter();
        o.type = 'sawtooth'; o.frequency.value = midi(note(deg));
        fl.type = 'lowpass'; fl.frequency.setValueAtTime(300, t); fl.frequency.linearRampToValueAtTime(1200, t + beat * 2); fl.frequency.linearRampToValueAtTime(300, t + beat * 6);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + beat); g.gain.linearRampToValueAtTime(0.0001, t + beat * 7);
        o.connect(fl); fl.connect(g); g.connect(this.mus); o.start(t); o.stop(t + beat * 7.2);
      }
    }

    pluck(f, t, vol) {
      const c = this.ctx;
      const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = f; o2.type = 'triangle'; o2.frequency.value = f * 2.001;
      fl.type = 'lowpass'; fl.frequency.setValueAtTime(f * 8, t); fl.frequency.exponentialRampToValueAtTime(f * 1.2, t + 0.5);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(this.mus); g.connect(this.verb);
      o.start(t); o2.start(t); o.stop(t + 1.5); o2.stop(t + 1.5);
    }
  }

  D.Audio = Audio;
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
