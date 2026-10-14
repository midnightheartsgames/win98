(function (Z) {
  'use strict';

  const NOTE = n => {
    const m = /^([A-G])(#|b)?(\d)$/.exec(n);
    if (!m) return 0;
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (base + (+m[3] - 4) * 12 - 9) / 12);
  };
  Z.NOTE = NOTE;

  const TUNES = {
    korobeiniki: { bpm: 140, mel: 'E5:1 B4:.5 C5:.5 D5:1 C5:.5 B4:.5 A4:1 A4:.5 C5:.5 E5:1 D5:.5 C5:.5 B4:1.5 C5:.5 D5:1 E5:1 C5:1 A4:1 A4:2 R:.5 D5:1 F5:.5 A5:1 G5:.5 F5:.5 E5:1.5 C5:.5 E5:1 D5:.5 C5:.5 B4:1 B4:.5 C5:.5 D5:1 E5:1 C5:1 A4:1 A4:2', chords: 'Am Am E E Am Am E Am Dm Dm C C Am E Am Am', title: 'Коробейники' },
    estrada1: { bpm: 112, gen: 'major', key: 'F', chords: 'F Dm Gm C F Dm Bb C', title: 'Вальс над Днепром' },
    march1: { bpm: 120, gen: 'march', key: 'Bb', chords: 'Bb F Bb F Eb Bb F Bb', title: 'Марш энергетиков' },
    folk1: { bpm: 96, gen: 'minor', key: 'D', chords: 'Dm Gm A Dm Dm Gm A Dm', title: 'Ой, над Хортицей туман' },
    folk2: { bpm: 104, gen: 'minor', key: 'G', chords: 'Gm Cm D Gm F Bb D Gm', title: 'Чумацкая' },
    estrada2: { bpm: 126, gen: 'major', key: 'C', chords: 'C Am F G C Am Dm G', title: 'Девушка из Соцгорода' },
    swan: { bpm: 108, gen: 'minor', key: 'F#', chords: 'F#m C#7 F#m C#7 F#m Bm C#7 F#m', title: 'Плановая пауза' }
  };
  const CH = {
    C: [0, 4, 7], Cm: [0, 3, 7], D: [2, 6, 9], Dm: [2, 5, 9], E: [4, 8, 11], Em: [4, 7, 11], F: [5, 9, 12], Fm: [5, 8, 12], G: [7, 11, 14], Gm: [7, 10, 14],
    A: [9, 13, 16], Am: [9, 12, 16], Bb: [10, 14, 17], Bm: [11, 14, 18], Eb: [3, 7, 10], 'C#7': [1, 5, 8, 11], 'F#m': [6, 9, 13]
  };

  Z.RADIO_STATIONS = [
    { id: 'mayak', name: 'Маяк-Запорожье', desc: 'Позывные, эстрада, новости района. Ведёт Лёва Эфир из ДК «Орбита».', tunes: ['estrada1', 'korobeiniki', 'estrada2', 'march1'] },
    { id: 'sich', name: 'Сечевое радио', desc: 'Кобзарь Опанас играет и рассказывает про Сечь.', tunes: ['folk1', 'folk2', 'korobeiniki'] },
    { id: 'plan', name: 'Голос Плановика', desc: 'Автоматическое вещание АСУ «Плановик-77»: показатели, призывы, музыкальные паузы.', tunes: ['swan', 'march1'] }
  ];

  class Audio {
    constructor(ui) {
      this.ui = ui;
      this.vol = ui.settings.volume;
      this.station = null;
      this.started = false;
      this.t = 0;
      this.stepT = 0;
      const resume = () => { this.init(); if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); };
      ui.el.addEventListener('mousedown', resume);
      ui.el.addEventListener('keydown', resume);
    }

    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain(); this.master.gain.value = this.vol; this.master.connect(ctx.destination);
      this.sfx = ctx.createGain(); this.sfx.gain.value = 0.9; this.sfx.connect(this.master);
      this.mus = ctx.createGain(); this.mus.gain.value = 0.35; this.mus.connect(this.master);
      this.rad = ctx.createGain(); this.rad.gain.value = 0.42;
      const radF = ctx.createBiquadFilter(); radF.type = 'bandpass'; radF.frequency.value = 1400; radF.Q.value = 0.6;
      this.rad.connect(radF); radF.connect(this.master);
      this.amb = ctx.createGain(); this.amb.gain.value = 0.5; this.amb.connect(this.master);
      const n = ctx.sampleRate * 2;
      this.white = ctx.createBuffer(1, n, ctx.sampleRate);
      this.brown = ctx.createBuffer(1, n, ctx.sampleRate);
      const w = this.white.getChannelData(0), b = this.brown.getChannelData(0);
      let last = 0;
      for (let i = 0; i < n; i++) { const r = Math.random() * 2 - 1; w[i] = r; last = (last + 0.02 * r) / 1.02; b[i] = last * 3.5; }
      this.startAmbience();
      this.started = true;
    }

    setVolume(v) { this.vol = v; if (this.master) this.master.gain.value = v; }

    noise(dur, opts = {}) {
      const ctx = this.ctx, t = ctx.currentTime + (opts.delay || 0);
      const src = ctx.createBufferSource();
      src.buffer = opts.brown ? this.brown : this.white;
      src.playbackRate.value = opts.rate || 1;
      const f = ctx.createBiquadFilter();
      f.type = opts.type || 'lowpass'; f.frequency.value = opts.freq || 2000; f.Q.value = opts.q || 0.7;
      if (opts.sweep) f.frequency.exponentialRampToValueAtTime(opts.sweep, t + dur);
      const g = ctx.createGain();
      const a = opts.attack || 0.003;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(opts.gain || 0.5, t + a); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(f); f.connect(g); g.connect(opts.out || this.sfx);
      src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
      return g;
    }

    tone(freq, dur, opts = {}) {
      const ctx = this.ctx, t = ctx.currentTime + (opts.delay || 0);
      const o = ctx.createOscillator();
      o.type = opts.wave || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (opts.to) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t + dur);
      if (opts.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = opts.vib; lg.gain.value = freq * 0.04; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur); }
      const g = ctx.createGain();
      const a = opts.attack || 0.005;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(opts.gain || 0.3, t + a);
      if (opts.hold) g.gain.setValueAtTime(opts.gain || 0.3, t + a + opts.hold);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      let node = o;
      if (opts.filter) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = opts.filter; o.connect(f); node = f; }
      node.connect(g); g.connect(opts.out || this.sfx);
      o.start(t); o.stop(t + dur + 0.05);
      return g;
    }

    spatial(x, y, z) {
      const ctx = this.ctx, c = this.ui.cam;
      const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz, (y || c.y) - c.y);
      const ang = Z.angDiff(c.yaw, Z.yawOf(dx, dz));
      const pan = ctx.createStereoPanner();
      pan.pan.value = Z.clamp(Math.sin(ang), -0.9, 0.9);
      const g = ctx.createGain();
      g.gain.value = 1 / (1 + d / 12);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = Z.clamp(20000 / (1 + d / 25), 600, 20000);
      g.connect(f); f.connect(pan); pan.connect(this.sfx);
      return { out: g, d };
    }

    shot(kind, x, y, z, player) {
      const s = player ? { out: this.sfx, d: 0 } : this.spatial(x, y, z);
      if (s.d > 400) return;
      const out = s.out;
      const k = kind || 'pistol';
      const P = {
        pistol: [0.18, 2600, 0.7, 140], revolver: [0.26, 2000, 0.85, 110], rifle: [0.42, 1800, 0.95, 90], auto: [0.22, 2200, 0.8, 100], smg: [0.15, 2800, 0.6, 130], shotgun: [0.5, 1400, 1.0, 70], rivet: [0.2, 900, 0.7, 60], mg: [0.2, 2000, 0.8, 95]
      }[k];
      if (k === 'arc') { this.noise(0.25, { out, type: 'bandpass', freq: 3200, q: 4, gain: 0.5 }); this.tone(90, 0.25, { wave: 'sawtooth', out, gain: 0.25, to: 60 }); return; }
      if (k === 'beam' || k === 'ray') { this.tone(k === 'ray' ? 900 : 1400, 0.3, { wave: 'sawtooth', to: 200, out, gain: 0.22, filter: 3000 }); this.noise(0.2, { out, freq: 6000, gain: 0.2, type: 'highpass' }); return; }
      if (!P) return;
      const [dur, freq, gain, thump] = P;
      this.noise(dur, { out, freq, gain: gain * 0.9, sweep: 300 });
      this.noise(dur * 1.8, { out, freq: 600, gain: gain * 0.5, brown: true });
      this.tone(thump, 0.12, { out, gain: gain * 0.6, to: 40 });
      if (s.d > 30) this.noise(dur * 3, { out, freq: 400, gain: gain * 0.25, brown: true, delay: 0.05 });
    }

    boom(x, y, z) {
      const s = this.spatial(x, y, z);
      this.noise(1.8, { out: s.out, freq: 900, gain: 1.4, brown: true, sweep: 120 });
      this.noise(0.4, { out: s.out, freq: 3000, gain: 0.6 });
      this.tone(55, 1.0, { out: s.out, gain: 0.9, to: 25 });
    }

    footstep(surf) {
      const f = surf === 'water' ? 900 : surf === 'concrete' ? 2400 : surf === 'wood' ? 1200 : 700;
      this.noise(surf === 'water' ? 0.18 : 0.07, { freq: f, gain: surf === 'water' ? 0.18 : 0.09, type: surf === 'concrete' ? 'bandpass' : 'lowpass', q: 1.2 });
    }

    uiSound(kind) {
      if (!this.ctx) return;
      switch (kind) {
        case 'open': this.tone(520, 0.06, { wave: 'square', gain: 0.05, filter: 2000 }); this.noise(0.05, { freq: 3000, gain: 0.05 }); break;
        case 'close': this.tone(380, 0.06, { wave: 'square', gain: 0.05, filter: 2000 }); break;
        case 'click': this.tone(900, 0.03, { wave: 'square', gain: 0.04, filter: 3000 }); break;
        case 'level': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, { delay: i * 0.12, wave: 'triangle', gain: 0.15 })); break;
        case 'quest': [784, 988, 1175].forEach((f, i) => this.tone(f, 0.3, { delay: i * 0.1, wave: 'triangle', gain: 0.12 })); break;
        case 'vatsOn': this.tone(200, 0.4, { to: 900, wave: 'sawtooth', gain: 0.08, filter: 1800 }); break;
        case 'vatsGo': this.tone(900, 0.3, { to: 200, wave: 'sawtooth', gain: 0.08, filter: 1800 }); break;
        case 'vatsQ': this.tone(1200, 0.05, { wave: 'square', gain: 0.05 }); break;
        case 'vatsNo': this.tone(200, 0.15, { wave: 'square', gain: 0.06 }); break;
        default: break;
      }
    }

    geiger(rate) {
      if (!this.ctx) return;
      const n = Math.min(12, Math.floor(rate + Math.random()));
      for (let i = 0; i < n; i++) this.noise(0.012, { freq: 5000, type: 'highpass', gain: 0.25, delay: Math.random() * 0.5 });
    }

    creature(a, kind) {
      const s = this.spatial(a.x, a.y + 0.5, a.z);
      if (s.d > 70) return;
      const def = a.def || '';
      if (def.startsWith('kolorad')) { for (let i = 0; i < 5; i++) this.noise(0.02, { out: s.out, freq: 4200, type: 'bandpass', q: 6, gain: 0.3, delay: i * 0.04 }); }
      else if (def === 'medvedka') { for (let i = 0; i < 8; i++) this.tone(3600, 0.03, { out: s.out, wave: 'square', gain: 0.06, delay: i * 0.05 }); }
      else if (def === 'martyn') this.tone(1800, 0.5, { out: s.out, to: 900, vib: 18, wave: 'sawtooth', gain: 0.18, filter: 3500 });
      else if (def.startsWith('som')) this.noise(0.6, { out: s.out, freq: 700, gain: 0.5, brown: true, sweep: 200 });
      else if (def === 'broiler' || def === 'rooster') { this.tone(kind === 'spot' && def === 'rooster' ? 600 : 900, 0.12, { out: s.out, to: 500, wave: 'square', gain: 0.1, filter: 2400 }); this.tone(800, 0.1, { out: s.out, to: 450, wave: 'square', gain: 0.08, filter: 2400, delay: 0.15 }); }
      else if (def === 'baibak') this.tone(2600, 0.35, { out: s.out, to: 2900, gain: 0.2 });
      else if (def === 'dog') { this.tone(420, 0.12, { out: s.out, to: 240, wave: 'sawtooth', gain: 0.2, filter: 1500 }); this.tone(400, 0.1, { out: s.out, to: 230, wave: 'sawtooth', gain: 0.16, filter: 1500, delay: 0.2 }); }
      else if (def.startsWith('udarnik')) this.tone(85, 0.8, { out: s.out, to: 60, wave: 'sawtooth', gain: 0.25, filter: 500, vib: 6 });
      else if (def.startsWith('hobot')) this.noise(0.7, { out: s.out, freq: 900, type: 'bandpass', q: 2, gain: 0.3, attack: 0.2 });
      else if (a.robot) [880, 660, 990].forEach((f, i) => this.tone(f, 0.08, { out: s.out, wave: 'square', gain: 0.06, delay: i * 0.09 }));
    }

    onEvent(ev) {
      if (!this.ctx) return;
      const p = this.ui.game && this.ui.game.player;
      switch (ev.t) {
        case 'fire': { const wd = ev.wd || {}; const a = ev.a; this.shot(wd.sound || (wd.wtype === 'shotgun' ? 'shotgun' : 'pistol'), a.x, a.y + 1.4, a.z, a === p); break; }
        case 'husk': { const s = this.spatial(ev.from[0], ev.from[1], ev.from[2]); this.noise(0.05, { out: s.out, freq: 1800, gain: 0.25 }); break; }
        case 'explosion': this.boom(ev.x, ev.y, ev.z); break;
        case 'reload': if (ev.a === p) { this.tone(300, 0.05, { wave: 'square', gain: 0.06, delay: 0.1 }); this.tone(500, 0.05, { wave: 'square', gain: 0.06, delay: 0.6 }); } break;
        case 'dryfire': if (ev.a === p) this.tone(1800, 0.02, { wave: 'square', gain: 0.08 }); break;
        case 'jam': if (ev.a === p) this.noise(0.15, { freq: 1500, gain: 0.3 }); break;
        case 'swing': if (ev.a === p) this.noise(0.25, { type: 'bandpass', freq: 600, sweep: 2500, q: 1.5, gain: 0.15 }); break;
        case 'meleeHit': case 'bite': { const t = ev.tgt || ev.a; const s = this.spatial(t.x, t.y + 1, t.z); this.noise(0.12, { out: s.out, freq: 700, gain: 0.5, brown: true }); this.tone(90, 0.1, { out: s.out, gain: 0.3, to: 50 }); break; }
        case 'hit': if (ev.a === p) this.tone(200, 0.15, { wave: 'sawtooth', gain: 0.06, to: 120, filter: 800 }); break;
        case 'death': if (ev.a && ev.a.cdef) this.creature(ev.a, 'death'); break;
        case 'combatStart': if (ev.a && ev.a.cdef) this.creature(ev.a, 'spot'); break;
        case 'screech': this.creature(ev.a, 'spot'); break;
        case 'whistle': this.creature(ev.a, 'spot'); break;
        case 'emerge': { const s = this.spatial(ev.a.x, ev.a.y, ev.a.z); this.noise(0.6, { out: s.out, freq: 500, gain: 0.6, brown: true }); break; }
        case 'lunge': { const s = this.spatial(ev.a.x, ev.a.y, ev.a.z); this.noise(0.8, { out: s.out, freq: 1200, gain: 0.6, sweep: 300 }); break; }
        case 'rads': this.geiger(Math.min(12, ev.n * 3)); break;
        case 'take': this.tone(700, 0.05, { wave: 'triangle', gain: 0.08 }); break;
        case 'trade': [880, 1320].forEach((f, i) => this.tone(f, 0.08, { wave: 'triangle', gain: 0.08, delay: i * 0.06 })); break;
        case 'quest': this.uiSound('quest'); break;
        case 'xp': this.tone(1200, 0.08, { wave: 'triangle', gain: 0.05 }); break;
        case 'door': this.noise(0.4, { freq: 500, gain: 0.25, brown: true }); this.tone(220, 0.3, { wave: 'sawtooth', gain: 0.03, to: 180, filter: 600 }); break;
        case 'cell': this.noise(0.5, { freq: 500, gain: 0.25, brown: true }); break;
        case 'pickBreak': this.tone(2400, 0.06, { wave: 'square', gain: 0.1 }); break;
        case 'pickOpen': this.noise(0.1, { freq: 1500, gain: 0.3 }); this.tone(600, 0.1, { wave: 'square', gain: 0.06, delay: 0.05 }); break;
        case 'hackOk': [600, 900, 1200].forEach((f, i) => this.tone(f, 0.08, { wave: 'square', gain: 0.05, delay: i * 0.08 })); break;
        case 'hackFail': this.tone(160, 0.25, { wave: 'square', gain: 0.06 }); break;
        case 'bark': if (this.ui.settings.subtitles && this.ui.hudUI) this.ui.hudUI.notes.push({ text: ev.a.name + ': ' + ev.text, kind: ev.a.hostile ? 'warn' : 'info', t: 2.5 }); break;
        case 'splash': this.noise(0.5, { freq: 900, gain: 0.3, sweep: 300 }); break;
        case 'land': if (ev.v > 4) this.noise(0.12, { freq: 600, gain: 0.25, brown: true }); break;
        case 'robotWarn': this.creature(ev.a, 'spot'); break;
        case 'charge': this.creature(ev.a, 'spot'); break;
        case 'soda': this.noise(0.8, { freq: 4000, type: 'highpass', gain: 0.1 }); break;
        default: break;
      }
    }

    startAmbience() {
      const ctx = this.ctx;
      const mk = (buf, type, freq, q) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 0.7; const g = ctx.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(this.amb); s.start(); return { g, f }; };
      this.wind = mk(this.brown, 'lowpass', 500);
      this.river = mk(this.white, 'lowpass', 900);
      this.hum = mk(this.brown, 'bandpass', 120, 3);
    }

    update(dt) {
      if (!this.ctx) return;
      const ui = this.ui, g = ui.game;
      this.t += dt;
      const now = this.ctx.currentTime;
      if (!g) { this.wind.g.gain.setTargetAtTime(0.15, now, 0.5); this.river.g.gain.setTargetAtTime(0, now, 0.5); this.updateRadio(dt, true); this.updateMusic(dt); return; }
      const p = g.player;
      const ext = g.cell.exterior;
      const windK = ext ? 0.12 + 0.08 * Math.sin(this.t * 0.2) + (g.wx ? g.wx.wind * 0.04 : 0) : 0.02;
      this.wind.g.gain.setTargetAtTime(windK, now, 0.6);
      this.wind.f.frequency.setTargetAtTime(350 + 250 * Math.sin(this.t * 0.13), now, 1);
      let riverK = 0;
      if (ext && g.map) { const dw = g.map.distWater[g.map.cellIndex(p.x, p.z)]; riverK = dw !== undefined ? Z.clamp(1 - dw / 60, 0, 1) * 0.18 : 0; }
      this.river.g.gain.setTargetAtTime(riverK, now, 0.6);
      this.hum.g.gain.setTargetAtTime(ext ? 0 : 0.05, now, 0.6);
      const env = ui.env;
      if (ext && env && env.night > 0.6 && Math.random() < dt * 3) this.tone(4200 + Math.random() * 400, 0.04, { wave: 'square', gain: 0.012, out: this.amb });
      if (ext && env && env.night < 0.4 && Math.random() < dt * 0.4) { const f = 2200 + Math.random() * 1600; for (let i = 0; i < 3; i++) this.tone(f * (1 + i * 0.05), 0.08, { gain: 0.015, out: this.amb, delay: i * 0.1, to: f * 1.2 }); }
      const moving = p && p.onGround && Math.hypot(p.vx, p.vz) > 0.5 && ui.mode === 'play';
      if (moving) {
        this.stepT -= dt * Math.hypot(p.vx, p.vz) / (p.sneak ? 1.2 : 1.6);
        if (this.stepT <= 0) {
          this.stepT = 1;
          let surf = 'dirt';
          if (!ext) surf = 'concrete';
          else if (p.swim || g.map.waterDepth(p.x, p.z) > 0.1) surf = 'water';
          else { const r = g.map.roadMask[g.map.cellIndex(p.x, p.z)]; if (r === 1) surf = 'concrete'; }
          this.footstep(surf);
        }
      }
      if (p && p.rads > 0 && ui.radFlashT > 0) ui.radFlashT -= dt;
      this.updateRadio(dt);
      this.updateMusic(dt);
    }

    music(kind) { this.musicKind = kind; }

    updateMusic(dt) {
      const want = this.musicKind || (this.ui.game && this.ui.stealthState && this.ui.stealthState() && this.ui.stealthState().danger ? 'combat' : this.station ? null : 'explore');
      this.musT = (this.musT || 0) - dt;
      if (this.musT > 0) return;
      if (want === 'combat') {
        this.musT = 0.5;
        const t0 = 0;
        this.tone(55, 0.45, { wave: 'sawtooth', gain: 0.12, filter: 300, out: this.mus, delay: t0 });
        this.noise(0.12, { freq: 180, gain: 0.25, brown: true, out: this.mus, delay: 0.25 });
        if (Math.random() < 0.3) this.tone(220 * [1, 1.2, 1.5][Math.floor(Math.random() * 3)], 0.4, { wave: 'triangle', gain: 0.04, out: this.mus, delay: 0.1 });
      } else if (want === 'explore' || want === 'menu') {
        this.musT = 6 + Math.random() * 6;
        const root = [146.8, 130.8, 174.6, 116.5][Math.floor(Math.random() * 4)];
        for (const r of [1, 1.5, 2.4]) this.tone(root * r, 7, { wave: 'triangle', gain: 0.025, attack: 2.5, hold: 2, out: this.mus, filter: 900 });
        if (Math.random() < 0.6) { const mel = [2, 2.4, 3, 3.6, 4]; for (let i = 0; i < 3; i++) this.tone(root * mel[Math.floor(Math.random() * mel.length)], 1.2, { wave: 'sine', gain: 0.02, delay: 1.5 + i * 1.1, out: this.mus }); }
      }
    }

    setStation(id) {
      this.init();
      this.station = id;
      this.radQ = [];
      this.radT = 0;
      this.tuneI = 0;
      if (id) this.djLine(id, true);
    }

    djLine(id, intro) {
      const g = this.ui.game;
      const lines = Z.radioLines ? Z.radioLines(g, id, intro) : [];
      if (lines.length && this.ui.speak && this.ui.settings.tts) { try { const u = new SpeechSynthesisUtterance(lines.join(' ')); u.lang = 'ru-RU'; u.rate = id === 'plan' ? 0.92 : 1.05; u.pitch = id === 'plan' ? 0.7 : 1; u.volume = this.vol * 0.7; speechSynthesis.speak(u); } catch (e) { this.ttsBroken = true; } }
      return lines;
    }

    updateRadio(dt, menu) {
      if (!this.station || menu) return;
      this.radT -= dt;
      if (this.radT > 0) return;
      const st = Z.RADIO_STATIONS.find(s => s.id === this.station);
      if (!st) return;
      if (this.tuneI > 0 && this.tuneI % 2 === 0 && !this.djDone) { this.djDone = true; this.djLine(this.station, false); this.radT = 9; return; }
      this.djDone = false;
      const tune = TUNES[st.tunes[this.tuneI % st.tunes.length]];
      this.tuneI++;
      this.radT = this.playTune(tune) + 1.5;
    }

    playTune(tune) {
      const beat = 60 / tune.bpm;
      let t = 0.1;
      const out = this.rad;
      const chords = tune.chords.split(' ');
      const R = Z.rng(Z.hashStr(tune.title) + (this.tuneI || 0));
      if (tune.mel) {
        for (const tok of tune.mel.split(' ')) {
          const [n, d] = tok.split(':');
          const dur = parseFloat(d) * beat;
          if (n !== 'R') this.tone(NOTE(n), dur * 0.95, { wave: 'square', gain: 0.05, delay: t, out, filter: 2200 });
          t += dur;
        }
      } else {
        const keyOff = { C: 0, D: 2, F: 5, G: 7, Bb: 10, 'F#': 6 }[tune.key] || 0;
        const scale = tune.gen === 'major' || tune.gen === 'march' ? [0, 2, 4, 5, 7, 9, 11, 12] : [0, 2, 3, 5, 7, 8, 10, 12];
        let deg = 4;
        for (let bar = 0; bar < chords.length * 2; bar++) {
          const pat = tune.gen === 'march' ? [1, 0.5, 0.5, 1, 1] : tune.gen === 'major' ? [1.5, 0.5, 1, 1] : [1, 1, 0.5, 0.5, 1];
          for (const d of pat) {
            deg = Z.clamp(deg + Math.floor(R() * 5) - 2, 0, 7);
            const f = 261.6 * Math.pow(2, (scale[deg] + keyOff) / 12);
            this.tone(f, d * beat * 0.9, { wave: tune.gen === 'minor' ? 'triangle' : 'square', gain: 0.045, delay: t, out, filter: 2400 });
            t += d * beat;
          }
        }
      }
      const total = t;
      const barLen = total / chords.length;
      chords.forEach((c, i) => {
        const iv = CH[c] || CH.C;
        const rootF = 130.8 * Math.pow(2, (iv[0] % 12) / 12);
        this.tone(rootF / 2, barLen * 0.9, { wave: 'triangle', gain: 0.07, delay: 0.1 + i * barLen, out });
        for (let k = 0; k < 2; k++) for (const s of iv.slice(1)) this.tone(130.8 * Math.pow(2, s / 12), barLen * 0.35, { wave: 'triangle', gain: 0.02, delay: 0.1 + i * barLen + barLen * (0.25 + k * 0.5), out });
        if (tune.gen === 'march' || tune.mel) for (let k = 0; k < 4; k++) this.noise(0.06, { freq: k % 2 ? 6000 : 300, type: k % 2 ? 'highpass' : 'lowpass', gain: k % 2 ? 0.03 : 0.08, delay: 0.1 + i * barLen + k * barLen / 4, out, brown: !(k % 2) });
      });
      return total;
    }

    destroy() { try { if (this.ctx) this.ctx.close(); } catch (e) { this.ctx = null; } }
  }
  Z.Audio = Audio;
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
