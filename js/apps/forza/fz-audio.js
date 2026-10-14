(function (F) {
  'use strict';

  const ENG = {
    lada: { cyl: 4, wave: 'sawtooth', sub: 0.25, rough: 0.35, cut: 1.0, vol: 0.9 },
    v4: { cyl: 4, wave: 'square', sub: 0.4, rough: 0.5, cut: 0.8, vol: 0.9 },
    van: { cyl: 4, wave: 'sawtooth', sub: 0.5, rough: 0.3, cut: 0.7, vol: 0.9 },
    i4: { cyl: 4, wave: 'sawtooth', sub: 0.15, rough: 0.15, cut: 1.2, vol: 0.85 },
    i4t: { cyl: 4, wave: 'sawtooth', sub: 0.1, rough: 0.1, cut: 1.3, vol: 0.8, turbo: 1 },
    f4: { cyl: 4, wave: 'square', sub: 0.55, rough: 0.3, cut: 0.9, vol: 0.85 },
    f4t: { cyl: 4, wave: 'square', sub: 0.6, rough: 0.35, cut: 1.0, vol: 0.85, turbo: 1 },
    i6: { cyl: 6, wave: 'sawtooth', sub: 0.1, rough: 0.05, cut: 1.5, vol: 0.8 },
    i6t: { cyl: 6, wave: 'sawtooth', sub: 0.1, rough: 0.05, cut: 1.4, vol: 0.8, turbo: 1 },
    v8: { cyl: 8, wave: 'sawtooth', sub: 0.45, rough: 0.2, cut: 1.2, vol: 0.9 },
    v8m: { cyl: 8, wave: 'sawtooth', sub: 0.7, rough: 0.35, cut: 0.9, vol: 1.0 },
    v8f: { cyl: 8, wave: 'sawtooth', sub: 0.1, rough: 0.05, cut: 2.0, vol: 0.85 },
    v10: { cyl: 10, wave: 'sawtooth', sub: 0.4, rough: 0.25, cut: 1.3, vol: 0.95 },
    v12: { cyl: 12, wave: 'sawtooth', sub: 0.1, rough: 0.02, cut: 2.2, vol: 0.85 },
    f6t: { cyl: 6, wave: 'square', sub: 0.35, rough: 0.12, cut: 1.4, vol: 0.85, turbo: 1 }
  };

  const STATIONS = [
    { id: 'pulse', name: 'Horizon Pulse Rīga', dj: 'Ведущий Давис', bpm: 138, style: 'trance',
      tracks: [['Dzintars', 'Baltic Signal'], ['Night over Daugava', 'DJ Lāčplēsis'], ['Rīga 800', 'Neon Kalns'], ['Majori Sunrise', 'Aurora Grid']] },
    { id: 'bass', name: 'Horizon Bass Arena', dj: 'Ведущая Ника', bpm: 172, style: 'dnb',
      tracks: [['Vanšu Cable', 'Subterra LV'], ['Old Town Breaks', 'Kaleidoskops'], ['Pārdaugava Rollers', 'Nordic Amen'], ['Biķernieki Night', 'Circuit 7']] },
    { id: 'rock', name: 'Radio Daugava Rock', dj: 'Ведущий Гунтис', bpm: 124, style: 'rock',
      tracks: [['Asfalts', 'Pērkons Garage'], ['Lada Blues', 'Kombināts'], ['Pa ceļam uz Jūrmalu', 'Sarkanā Zvaigzne'], ['Motor 2105', 'Oranžais Diesel']] }
  ];

  const SCALES = { minor: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11] };

  class Audio {
    constructor() {
      this.ctx = null;
      this.ok = false;
      this.vol = { master: 0.8, engine: 0.9, sfx: 0.8, ambient: 0.8, music: 0.6 };
      this.station = 0;
      this.nowPlaying = null;
      this.onTrack = null;
    }

    unlock() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch (e) { return; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = this.vol.master; this.master.connect(c.destination);
      this.engBus = c.createGain(); this.engBus.gain.value = this.vol.engine; this.engBus.connect(this.master);
      this.sfx = c.createGain(); this.sfx.gain.value = this.vol.sfx; this.sfx.connect(this.master);
      this.amb = c.createGain(); this.amb.gain.value = this.vol.ambient; this.amb.connect(this.master);
      this.music = c.createGain(); this.music.gain.value = this.vol.music * 0.45; this.music.connect(this.master);
      this.noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.buildEngine();
      this.buildLoops();
      this.ok = true;
      this.sched = setInterval(() => this.schedule(), 30);
    }

    setVolumes(v) {
      for (const k in v) if (Number.isFinite(v[k])) this.vol[k] = Math.max(0, v[k]);
      if (!this.ok) return;
      const t = this.ctx.currentTime;
      this.master.gain.setTargetAtTime(this.vol.master, t, 0.05);
      this.engBus.gain.setTargetAtTime(this.vol.engine, t, 0.05);
      this.sfx.gain.setTargetAtTime(this.vol.sfx, t, 0.05);
      this.amb.gain.setTargetAtTime(this.vol.ambient, t, 0.05);
      this.music.gain.setTargetAtTime(this.vol.music * 0.45, t, 0.05);
    }

    sample(bus) {
      if (!this.ok) return false;
      if (bus === 'engine') {
        this.tone(95, 0.4, 0.3, 'sawtooth', 0, 1.6, this.engBus);
        this.tone(190, 0.4, 0.14, 'square', 0, 1.6, this.engBus);
        return true;
      }
      if (bus === 'ambient') {
        if (!this.raining) this.burst(3000, 'highpass', 0.7, 0.12, 0.5, 0, this.amb);
        return true;
      }
      if (bus === 'music') {
        if (!this.station) [0, 7, 12].forEach((s, i) => this.tone(330 * Math.pow(2, s / 12), 0.3, 0.5, 'triangle', i * 0.08, 0, this.music));
        return true;
      }
      return false;
    }

    noise(loop = true) {
      const s = this.ctx.createBufferSource();
      s.buffer = this.noiseBuf; s.loop = loop;
      return s;
    }

    buildEngine() {
      const c = this.ctx;
      this.eOut = c.createGain(); this.eOut.gain.value = 0; this.eOut.connect(this.engBus);
      this.eFilt = c.createBiquadFilter(); this.eFilt.type = 'lowpass'; this.eFilt.frequency.value = 800; this.eFilt.Q.value = 2.5;
      this.eFilt.connect(this.eOut);
      this.osc1 = c.createOscillator(); this.osc2 = c.createOscillator(); this.oscSub = c.createOscillator();
      this.g1 = c.createGain(); this.g2 = c.createGain(); this.gSub = c.createGain();
      this.osc1.connect(this.g1); this.osc2.connect(this.g2); this.oscSub.connect(this.gSub);
      this.g1.connect(this.eFilt); this.g2.connect(this.eFilt); this.gSub.connect(this.eFilt);
      this.g1.gain.value = 0.5; this.g2.gain.value = 0.3; this.gSub.gain.value = 0.2;
      this.osc1.type = 'sawtooth'; this.osc2.type = 'square'; this.oscSub.type = 'triangle';
      this.lfo = c.createOscillator(); this.lfoG = c.createGain(); this.lfo.connect(this.lfoG); this.lfoG.connect(this.g1.gain);
      this.lfo.frequency.value = 12; this.lfoG.gain.value = 0.1;
      this.osc1.start(); this.osc2.start(); this.oscSub.start(); this.lfo.start();
      this.intake = this.noise(); this.inFilt = c.createBiquadFilter(); this.inFilt.type = 'bandpass'; this.inFilt.frequency.value = 900; this.inFilt.Q.value = 0.8;
      this.inG = c.createGain(); this.inG.gain.value = 0;
      this.intake.connect(this.inFilt); this.inFilt.connect(this.inG); this.inG.connect(this.engBus); this.intake.start();
      this.turbo = c.createOscillator(); this.turbo.type = 'sine'; this.turboG = c.createGain(); this.turboG.gain.value = 0;
      this.turbo.connect(this.turboG); this.turboG.connect(this.engBus); this.turbo.start();
    }

    buildLoops() {
      const c = this.ctx;
      const mk = (type, f, q, bus = this.sfx) => {
        const src = this.noise(), fl = c.createBiquadFilter(), g = c.createGain();
        fl.type = type; fl.frequency.value = f; fl.Q.value = q; g.gain.value = 0;
        src.connect(fl); fl.connect(g); g.connect(bus); src.start();
        return { fl, g };
      };
      this.tire = mk('bandpass', 1400, 4);
      this.gravel = mk('lowpass', 500, 0.7);
      this.wind = mk('lowpass', 350, 0.5);
      this.rain = mk('highpass', 3000, 0.5, this.amb);
      this.hiss = mk('bandpass', 1900, 0.9);
      this.crowd = mk('bandpass', 520, 1.1, this.amb);
      this.fireL = mk('bandpass', 700, 0.6);
      this.scrapeL = mk('bandpass', 2600, 2.5);
    }

    thunder(dist) {
      if (!this.ok) return;
      const c = this.ctx, t = c.currentTime + dist / 343, near = F.clamp(1 - dist / 2600, 0, 1);
      if (dist < 900) this.burst(2600, 'highpass', 0.22, 0.25 + 0.4 * near, 0.6, dist / 343, this.amb);
      const src = this.noise(true), fl = c.createBiquadFilter(), g = c.createGain();
      fl.type = 'lowpass'; fl.frequency.value = 110 + near * 260; fl.Q.value = 0.7;
      src.connect(fl); fl.connect(g); g.connect(this.amb);
      const peak = 0.12 + 0.55 * near, len = 3 + (1 - near) * 2.5;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.04 + (1 - near) * 0.5);
      let at = t + 0.3 + (1 - near) * 0.5;
      for (let k = 0; k < 4; k++) {
        at += 0.35 + Math.random() * 0.6;
        g.gain.exponentialRampToValueAtTime(Math.max(0.001, peak * (0.35 + Math.random() * 0.5) * (1 - k * 0.18)), at);
      }
      g.gain.exponentialRampToValueAtTime(0.0001, t + len + 1.5);
      src.start(t); src.stop(t + len + 1.6);
    }

    foghorn(dist) {
      if (!this.ok) return;
      const c = this.ctx, t = c.currentTime + 0.05, k = F.clamp(1 - dist / 3200, 0.15, 1);
      const fl = c.createBiquadFilter(), g = c.createGain();
      fl.type = 'lowpass'; fl.frequency.value = 260 + k * 240; fl.Q.value = 0.9;
      fl.connect(g); g.connect(this.amb);
      const peak = 0.05 + 0.12 * k, len = 2.6;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.45);
      g.gain.setValueAtTime(peak, t + len);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len + 1.8);
      for (const [f, v] of [[92, 1], [138, 0.55], [184, 0.25]]) {
        const o = c.createOscillator(), og = c.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.985, t); o.frequency.linearRampToValueAtTime(f, t + 0.5);
        og.gain.value = v;
        o.connect(og); og.connect(fl);
        o.start(t); o.stop(t + len + 1.9);
      }
    }

    setEngineType(eng) {
      if (!this.ok || this.engType === eng) return;
      this.engType = eng;
      const e = ENG[eng] || ENG.i4;
      this.osc1.type = e.wave;
      this.osc2.type = e.wave === 'square' ? 'sawtooth' : 'square';
      this.gSub.gain.value = e.sub * 0.6;
      this.lfoG.gain.value = e.rough * 0.25;
      this.eprof = e;
    }

    update(st) {
      if (!this.ok) return;
      const t = this.ctx.currentTime;
      const e = this.eprof || ENG.i4;
      const rain = st ? +st.rain || 0 : 0;
      this.raining = rain > 0.05;
      const cover = !!st && (st.inside || st.roof), market = st && !st.silent ? +st.market || 0 : 0;
      this.rain.g.gain.setTargetAtTime(rain * (cover ? 0.17 : 0.12), t, 0.5);
      this.rain.fl.frequency.setTargetAtTime(cover ? 1400 : 3000 - rain * 900, t, 0.5);
      this.crowd.g.gain.setTargetAtTime(market * (0.05 + 0.02 * Math.sin(t * 1.7) + 0.015 * Math.sin(t * 4.3)) * (st && st.inside ? 0.5 : 1), t, 0.3);
      this.crowd.fl.frequency.setTargetAtTime(520 + 160 * Math.sin(t * 0.9), t, 0.3);
      if (!st || st.silent) {
        this.eOut.gain.setTargetAtTime(0, t, 0.08);
        this.inG.gain.setTargetAtTime(0, t, 0.08);
        this.turboG.gain.setTargetAtTime(0, t, 0.08);
        for (const k of ['tire', 'gravel', 'wind', 'hiss', 'fireL', 'scrapeL']) this[k].g.gain.setTargetAtTime(0, t, 0.1);
        return;
      }
      const rpm = Math.max(600, st.rpm);
      const f = rpm / 60 * e.cyl / 2;
      this.osc1.frequency.setTargetAtTime(f, t, 0.02);
      this.osc2.frequency.setTargetAtTime(f * 2.005, t, 0.02);
      this.oscSub.frequency.setTargetAtTime(f * 0.5, t, 0.02);
      this.lfo.frequency.setTargetAtTime(Math.max(4, f / e.cyl * 1.5), t, 0.05);
      const load = st.thr;
      const cut = (300 + rpm * 0.18 * e.cut + load * 1400 * e.cut) * (st.inside ? 0.7 : 1);
      this.eFilt.frequency.setTargetAtTime(Math.min(cut, 8000), t, 0.03);
      const vol = (0.12 + load * 0.2 + rpm / 9000 * 0.18) * e.vol * (st.limiter ? 0.8 : 1) * (st.misfire ? 0.15 : 1) * (st.dead ? 0 : 1);
      this.eOut.gain.setTargetAtTime(vol, t, st.misfire ? 0.01 : 0.04);
      this.lfoG.gain.setTargetAtTime(e.rough * 0.25 + (+st.knock || 0) * 0.3, t, 0.2);
      const fire = +st.fire || 0, scr = +st.scrape || 0;
      this.fireL.g.gain.setTargetAtTime(fire * (0.06 + 0.07 * Math.random()), t, 0.03);
      this.fireL.fl.frequency.setTargetAtTime(450 + Math.random() * 1000, t, 0.02);
      this.scrapeL.g.gain.setTargetAtTime(Math.min(0.3, scr * 0.3) * F.clamp(st.speed / 12, 0.25, 1), t, 0.04);
      this.scrapeL.fl.frequency.setTargetAtTime(1700 + st.speed * 32, t, 0.1);
      this.inG.gain.setTargetAtTime(load * rpm / 8000 * 0.12 * (st.inside ? 0.5 : 1), t, 0.05);
      this.inFilt.frequency.setTargetAtTime(600 + rpm * 0.25, t, 0.05);
      if (e.turbo) {
        this.turbo.frequency.setTargetAtTime(2500 + rpm * 0.6, t, 0.1);
        this.turboG.gain.setTargetAtTime(load * Math.max(0, rpm - 2500) / 6000 * 0.035, t, 0.15);
      } else this.turboG.gain.setTargetAtTime(0, t, 0.1);
      this.tire.g.gain.setTargetAtTime(Math.min(0.35, st.skid * 0.35), t, 0.05);
      this.tire.fl.frequency.setTargetAtTime(1100 + st.speed * 8, t, 0.1);
      this.gravel.g.gain.setTargetAtTime(st.loose ? Math.min(0.4, st.speed / 40 * 0.4) : st.rough * Math.min(0.2, st.speed / 60), t, 0.08);
      this.wind.g.gain.setTargetAtTime(Math.min(0.35, (st.speed / 70) ** 2 * 0.35) * (st.inside ? 0.5 : 1), t, 0.1);
      this.wind.fl.frequency.setTargetAtTime(250 + st.speed * 6, t, 0.2);
      this.hiss.g.gain.setTargetAtTime((+st.wet || 0) * Math.min(1, st.speed / 30) * (st.inside ? 0.05 : 0.1), t, 0.2);
    }

    env(node, t, a, peak, dec) {
      node.gain.setValueAtTime(0.0001, t);
      node.gain.exponentialRampToValueAtTime(peak, t + a);
      node.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
    }

    burst(freq, type, dur, vol, q = 1, when = 0, dest = null) {
      if (!this.ok) return;
      const c = this.ctx, t = c.currentTime + when;
      const src = this.noise(false), fl = c.createBiquadFilter(), g = c.createGain();
      fl.type = type; fl.frequency.value = freq; fl.Q.value = q;
      src.connect(fl); fl.connect(g); g.connect(dest || this.sfx);
      this.env(g, t, 0.005, vol, dur);
      src.start(t); src.stop(t + dur + 0.05);
    }

    tone(freq, dur, vol, type = 'sine', when = 0, slide = 0, dest = null) {
      if (!this.ok) return;
      const c = this.ctx, t = c.currentTime + when;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
      o.connect(g); g.connect(dest || this.sfx);
      this.env(g, t, 0.004, vol, dur);
      o.start(t); o.stop(t + dur + 0.05);
    }

    play(name, k = 1) {
      if (!this.ok) return;
      switch (name) {
        case 'hit': this.burst(180, 'lowpass', 0.25, Math.min(0.9, 0.2 + k * 0.05)); this.tone(70, 0.2, Math.min(0.6, k * 0.05), 'sine', 0, 0.5); break;
        case 'smash': this.burst(900, 'bandpass', 0.35, 0.35, 0.8); this.burst(200, 'lowpass', 0.2, 0.3); break;
        case 'crunch': {
          const v = Math.max(0.15, Math.min(1, k));
          this.burst(240, 'lowpass', 0.32, Math.min(0.9, 0.25 + v * 0.6));
          this.burst(1700, 'bandpass', 0.18, 0.12 + v * 0.3, 2.5);
          this.tone(150, 0.22, 0.12 + v * 0.25, 'square', 0, 0.55);
          this.burst(3400, 'bandpass', 0.12, v * 0.18, 4, 0.03);
          break;
        }
        case 'break':
          if (k === 1) { this.burst(650, 'bandpass', 0.16, 0.38, 1.5); this.burst(260, 'lowpass', 0.12, 0.3); this.burst(1200, 'bandpass', 0.08, 0.2, 3, 0.05); }
          else if (k === 2) this.play('glass', 0.8);
          else if (k === 3) { this.burst(1400, 'bandpass', 0.1, 0.3, 2); this.tone(380, 0.1, 0.12, 'triangle', 0, 0.6); }
          else { this.tone(820, 0.25, 0.14, 'square', 0, 0.7); this.tone(1240, 0.3, 0.08, 'triangle', 0.02, 0.8); }
          break;
        case 'glass':
          this.burst(5200, 'bandpass', 0.45, 0.25 * k + 0.05, 1.2);
          for (let i = 0; i < 6; i++) this.tone(2400 + Math.random() * 4200, 0.06 + Math.random() * 0.08, 0.05 * k + 0.02, 'triangle', 0.03 + Math.random() * 0.45);
          break;
        case 'crack': this.burst(3800, 'highpass', 0.09, 0.22, 1); this.tone(1900, 0.05, 0.06, 'square', 0.01, 0.6); break;
        case 'clunk': this.burst(400, 'lowpass', 0.14, 0.4); this.tone(210, 0.12, 0.18, 'square', 0, 0.7); break;
        case 'clank': this.tone(560, 0.3, 0.16 * k, 'square', 0, 0.82); this.tone(870, 0.35, 0.1 * k, 'triangle', 0.015, 0.9); this.burst(900, 'bandpass', 0.1, 0.2 * k, 2); break;
        case 'pop': this.burst(700, 'lowpass', 0.1, 0.8); this.burst(4500, 'highpass', 0.7, 0.18, 0.6, 0.06); break;
        case 'ignite': this.burst(300, 'lowpass', 0.6, 0.45); this.burst(1200, 'bandpass', 0.8, 0.15, 0.8, 0.1); break;
        case 'misfire': this.burst(160, 'lowpass', 0.09, 0.55); this.burst(900, 'bandpass', 0.05, 0.25, 1.4); break;
        case 'boom': {
          const v = Math.max(0.2, Math.min(1, k));
          this.burst(80, 'lowpass', 2.2, 0.95 * v, 0.7);
          this.burst(420, 'lowpass', 0.9, 0.7 * v);
          this.burst(2600, 'bandpass', 0.35, 0.35 * v, 0.8);
          this.tone(48, 1.6, 0.6 * v, 'sine', 0, 0.5);
          break;
        }
        case 'repair': [0, 5, 9].forEach((s, i) => this.tone(740 * Math.pow(2, s / 12), 0.12, 0.1, 'triangle', i * 0.07)); this.burst(2400, 'bandpass', 0.06, 0.15, 3); break;
        case 'wrench': for (let i = 0; i < 4; i++) { this.tone(1300 + i * 90, 0.05, 0.08, 'square', i * 0.32, 0.9); this.burst(3000, 'bandpass', 0.04, 0.12, 4, i * 0.32); } break;
        case 'thud': {
          const o = k || {}, v = o.k || 0.3;
          if (o.mat === 'metal') { this.tone(o.big ? 300 : 620, 0.18, 0.12 * v + 0.02, 'square', 0, 0.75); this.burst(1100, 'bandpass', 0.07, 0.18 * v, 2); }
          else if (o.mat === 'glass') this.play('glass', v * 0.6);
          else if (o.mat === 'plastic') this.burst(1500, 'bandpass', 0.06, 0.2 * v, 2);
          else if (o.mat === 'water') this.burst(1200, 'lowpass', 0.4, 0.3 * v);
          else this.burst(o.big ? 260 : 520, 'bandpass', 0.1, 0.3 * v, 1.4);
          break;
        }
        case 'shift': this.burst(300, 'lowpass', 0.06, 0.25); break;
        case 'blowoff': this.burst(3500, 'highpass', 0.25, 0.12, 0.5); break;
        case 'land': this.burst(120, 'lowpass', 0.3, Math.min(0.8, k * 0.06)); break;
        case 'splash': this.burst(1200, 'lowpass', 0.8, 0.5); break;
        case 'rustle': for (let i = 0; i < 6; i++) this.burst(2200 + Math.random() * 2600, 'bandpass', 0.05 + Math.random() * 0.07, 0.11 * Math.min(1.4, k), 1.4, i * 0.03 + Math.random() * 0.02); this.burst(420, 'lowpass', 0.28, 0.12 * Math.min(1.4, k)); break;
        case 'beep': this.tone(660, 0.18, 0.25, 'square'); break;
        case 'go': this.tone(1320, 0.5, 0.3, 'square'); break;
        case 'blip': this.tone(880, 0.05, 0.12, 'square'); break;
        case 'select': this.tone(990, 0.07, 0.15, 'square'); this.tone(1480, 0.08, 0.12, 'square', 0.06); break;
        case 'back': this.tone(520, 0.08, 0.12, 'square'); break;
        case 'bank': [0, 4, 7, 12].forEach((s, i) => this.tone(880 * Math.pow(2, s / 12), 0.15, 0.12, 'triangle', i * 0.06)); break;
        case 'lost': this.tone(300, 0.35, 0.18, 'sawtooth', 0, 0.5); break;
        case 'levelup': [0, 4, 7, 12, 16].forEach((s, i) => this.tone(660 * Math.pow(2, s / 12), 0.25, 0.14, 'square', i * 0.09)); break;
        case 'star': this.tone(1760, 0.2, 0.12, 'triangle'); break;
        case 'checkpoint': this.tone(1200, 0.12, 0.15, 'triangle'); this.tone(1600, 0.15, 0.12, 'triangle', 0.08); break;
        case 'horn': this.tone(420, 0.4, 0.25, 'sawtooth'); this.tone(530, 0.4, 0.2, 'sawtooth'); break;
        case 'rewind': this.tone(1200, 0.3, 0.1, 'sine', 0, 0.3); break;
        case 'board': this.burst(1500, 'bandpass', 0.4, 0.3); [0, 7, 12].forEach((s, i) => this.tone(1046 * Math.pow(2, s / 12), 0.2, 0.12, 'triangle', 0.1 + i * 0.07)); break;
        default: break;
      }
    }

    setStation(i) {
      this.station = i;
      this.trackT = 0;
      this.step = 0;
      if (i > 0) this.pickTrack(true);
      else { this.nowPlaying = null; if (this.onTrack) this.onTrack(null); }
    }

    pickTrack(announce) {
      const st = STATIONS[this.station - 1];
      if (!st) return;
      this.trackIdx = ((this.trackIdx || 0) + 1) % st.tracks.length;
      const [title, artist] = st.tracks[this.trackIdx];
      const seed = this.station * 17 + this.trackIdx * 5;
      const r = F.rng(seed);
      const minor = st.style !== 'rock' ? r() < 0.8 : r() < 0.4;
      this.song = {
        root: 45 + Math.floor(r() * 7), scale: minor ? SCALES.minor : SCALES.major,
        prog: [[0, 5, 3, 4], [0, 3, 4, 3], [5, 3, 0, 4], [0, 6, 5, 4]][Math.floor(r() * 4)],
        arp: Array.from({ length: 16 }, () => Math.floor(r() * 5)), seed, bars: 0
      };
      this.songBeat = 0;
      this.nowPlaying = { station: st.name, dj: st.dj, title, artist };
      if (this.onTrack && announce !== false) this.onTrack(this.nowPlaying);
    }

    schedule() {
      if (!this.ok || !this.station || this.ctx.state !== 'running') return;
      const st = STATIONS[this.station - 1];
      const spb = 60 / st.bpm / 4;
      const c = this.ctx;
      if (!this.nextT || this.nextT < c.currentTime - 0.2) this.nextT = c.currentTime + 0.05;
      while (this.nextT < c.currentTime + 0.12) {
        this.playStep(st, this.step, this.nextT);
        this.nextT += spb;
        this.step++;
        if (this.step % 16 === 0) {
          this.song.bars++;
          if (this.song.bars >= 48) this.pickTrack();
        }
      }
    }

    note(n) { return 440 * Math.pow(2, (n - 69) / 12); }

    playStep(st, step, t) {
      const c = this.ctx, s = this.song;
      if (!s) return;
      const beat = step % 16, bar = Math.floor(step / 16);
      const chord = s.prog[bar % 4];
      const deg = i => s.scale[((i % 7) + 7) % 7] + 12 * Math.floor(i / 7);
      const bassNote = s.root + deg(chord) - 12;
      const drum = (kind) => {
        if (kind === 'k') { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); o.connect(g); g.connect(this.music); this.envAt(g, t, 0.9, 0.18); o.start(t); o.stop(t + 0.25); }
        if (kind === 's') { const n = this.noise(false), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'bandpass'; f.frequency.value = 1800; n.connect(f); f.connect(g); g.connect(this.music); this.envAt(g, t, 0.5, 0.14); n.start(t); n.stop(t + 0.2); }
        if (kind === 'h') { const n = this.noise(false), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'highpass'; f.frequency.value = 7000; n.connect(f); f.connect(g); g.connect(this.music); this.envAt(g, t, 0.18, 0.04); n.start(t); n.stop(t + 0.08); }
      };
      const synth = (freq, dur, vol, type, cutoff) => {
        const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
        o.type = type; o.frequency.value = freq; f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = 3;
        o.connect(f); f.connect(g); g.connect(this.music);
        this.envAt(g, t, vol, dur); o.start(t); o.stop(t + dur + 0.05);
      };
      if (st.style === 'trance') {
        if (beat % 4 === 0) drum('k');
        if (beat % 4 === 2) drum('h');
        if (beat === 4 || beat === 12) drum('s');
        if (beat % 2 === 1) synth(this.note(bassNote), 0.1, 0.35, 'sawtooth', 700);
        if (s.bars % 8 >= 2) synth(this.note(s.root + 12 + deg(chord + s.arp[beat])), 0.12, 0.12, 'square', 2500);
        if (beat === 0) for (const k of [0, 2, 4]) synth(this.note(s.root + 12 + deg(chord + k)), 1.6, 0.05, 'sawtooth', 1200);
      } else if (st.style === 'dnb') {
        const kicks = [0, 10], snares = [4, 12], hats = [2, 6, 8, 14];
        if (kicks.includes(beat)) drum('k');
        if (snares.includes(beat)) drum('s');
        if (hats.includes(beat) || beat % 2 === 1) drum('h');
        if (beat % 4 === 0) { synth(this.note(bassNote - 12), 0.3, 0.3, 'sawtooth', 300); synth(this.note(bassNote - 12) * 1.01, 0.3, 0.2, 'sawtooth', 300); }
        if (beat === 0 && bar % 2 === 0) for (const k of [0, 2, 4]) synth(this.note(s.root + 12 + deg(chord + k)), 2.8, 0.035, 'triangle', 1800);
      } else {
        if (beat === 0 || beat === 8 || beat === 10) drum('k');
        if (beat === 4 || beat === 12) drum('s');
        if (beat % 2 === 0) drum('h');
        if (beat % 2 === 0) {
          const f = this.note(bassNote);
          synth(f, 0.12, 0.28, 'sawtooth', 900);
          synth(f * 1.5, 0.12, 0.16, 'sawtooth', 1600);
          synth(f * 2, 0.12, 0.12, 'sawtooth', 2200);
        }
        if (s.bars % 8 >= 4 && beat % 4 === 2) synth(this.note(s.root + 24 + deg(chord + s.arp[beat] % 3)), 0.2, 0.08, 'square', 3000);
      }
    }

    envAt(g, t, vol, dec) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.005 + dec);
    }

    suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

    destroy() {
      if (this.sched) clearInterval(this.sched);
      if (this.ctx) try { this.ctx.close(); } catch (e) { }
      this.ctx = null; this.ok = false;
    }
  }

  F.Audio = Audio;
  F.STATIONS = STATIONS;
  F.ENGINES = ENG;
})(globalThis.Forza = globalThis.Forza || {});
