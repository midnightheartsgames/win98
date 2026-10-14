(function (X) {
  'use strict';
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);

  class Audio {
    constructor() {
      this.ctx = null;
      this.sfxVol = 0.8; this.musVol = 0.45;
      this.mode = null;
      this.listener = { pos: [0, 0, 0], yaw: 0 };
      this.amb = null;
      this.step = 0;
      this.nextT = 0;
      this.timer = null;
      this.loops = {};
    }
    init() {
      if (this.ctx) return;
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch (e) { this.ctx = null; return; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = 1; this.master.connect(c.destination);
      this.comp = c.createDynamicsCompressor(); this.comp.threshold.value = -14; this.comp.ratio.value = 4; this.comp.connect(this.master);
      this.sfx = c.createGain(); this.sfx.gain.value = this.sfxVol; this.sfx.connect(this.comp);
      this.mus = c.createGain(); this.mus.gain.value = this.musVol; this.mus.connect(this.comp);
      this.ambG = c.createGain(); this.ambG.gain.value = 0.5; this.ambG.connect(this.sfx);
      const len = c.sampleRate * 2;
      this.noise = c.createBuffer(1, len, c.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.verb = c.createConvolver();
      const ir = c.createBuffer(2, c.sampleRate * 1.6, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const a = ir.getChannelData(ch); for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / a.length, 3); }
      this.verb.buffer = ir;
      this.verbG = c.createGain(); this.verbG.gain.value = 0.22;
      this.verb.connect(this.verbG); this.verbG.connect(this.sfx);
      this.timer = setInterval(() => this.schedule(), 90);
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => { }); }
    setVolume(s, m) {
      this.sfxVol = s; this.musVol = m;
      if (this.sfx) this.sfx.gain.value = s;
      if (this.mus) this.mus.gain.value = m;
    }
    destroy() {
      if (this.timer) clearInterval(this.timer);
      this.stopAmb();
      if (this.ctx) this.ctx.close().catch(() => { });
      this.ctx = null;
    }
    out(pos, vol) {
      const c = this.ctx;
      const g = c.createGain();
      let v = vol === undefined ? 1 : vol;
      let pan = 0;
      if (pos) {
        const L = this.listener;
        const dx = pos[0] - L.pos[0], dz = pos[2] - L.pos[2], dy = pos[1] - L.pos[1];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        v *= 1 / (1 + d * d * 0.004 + d * 0.03);
        const r = X.right(L.yaw);
        pan = X.clamp((dx * r[0] + dz * r[2]) / Math.max(1, d), -1, 1) * 0.8;
      }
      g.gain.value = v;
      if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(this.sfx); }
      else g.connect(this.sfx);
      return g;
    }
    nz(dest, t, dur, type, f, q, vol, f2) {
      const c = this.ctx;
      const s = c.createBufferSource(); s.buffer = this.noise;
      s.playbackRate.value = 0.8 + Math.random() * 0.4;
      const fl = c.createBiquadFilter(); fl.type = type || 'bandpass'; fl.frequency.setValueAtTime(f || 1000, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
      fl.Q.value = q || 1;
      const g = c.createGain(); g.gain.setValueAtTime(vol || 1, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(fl); fl.connect(g); g.connect(dest);
      s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
      return g;
    }
    osc(dest, t, dur, type, f0, f1, vol, attack) {
      const c = this.ctx;
      const o = c.createOscillator(); o.type = type || 'sine';
      o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol || 0.5, t + (attack || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest);
      o.start(t); o.stop(t + dur + 0.05);
      return g;
    }
    play(name, o) {
      if (!this.ctx) return;
      o = o || {};
      const c = this.ctx, t = c.currentTime + 0.005;
      const dst = this.out(o.pos, o.vol);
      const wet = () => { const g = c.createGain(); g.gain.value = 0.5; dst.connect(g); g.connect(this.verb); };
      switch (name) {
        case 'beretta': this.nz(dst, t, 0.14, 'bandpass', 1400, 0.8, 1.2, 500); this.osc(dst, t, 0.12, 'sine', 160, 50, 0.9); wet(); break;
        case 'silenced': this.nz(dst, t, 0.06, 'highpass', 2200, 0.7, 0.5); this.osc(dst, t, 0.05, 'sine', 300, 120, 0.2); break;
        case 'magnum': this.nz(dst, t, 0.3, 'lowpass', 2400, 0.6, 1.5, 300); this.osc(dst, t, 0.25, 'sine', 110, 40, 1.2); wet(); break;
        case 'shotgun': this.nz(dst, t, 0.4, 'lowpass', 1800, 0.7, 1.6, 200); this.osc(dst, t, 0.3, 'sine', 90, 35, 1.3); wet(); break;
        case 'm16': case 'kalash': this.nz(dst, t, 0.09, 'bandpass', name === 'm16' ? 1100 : 850, 0.9, 1.1, 400); this.osc(dst, t, 0.07, 'sine', 140, 60, 0.7); break;
        case 'm60': this.nz(dst, t, 0.12, 'bandpass', 700, 0.8, 1.3, 250); this.osc(dst, t, 0.1, 'sine', 100, 45, 0.9); break;
        case 'sniper': this.nz(dst, t, 0.05, 'highpass', 3000, 0.7, 1.4); this.nz(dst, t, 1.2, 'lowpass', 600, 0.5, 0.8, 100); this.osc(dst, t, 0.3, 'sine', 80, 30, 1.2); wet(); break;
        case 'crossbow': this.osc(dst, t, 0.18, 'sawtooth', 420, 110, 0.35); this.nz(dst, t, 0.08, 'highpass', 3000, 1, 0.3); break;
        case 'harpoon': this.osc(dst, t, 0.2, 'square', 200, 60, 0.25); this.nz(dst, t, 0.15, 'bandpass', 800, 1, 0.4); break;
        case 'bazooka': this.nz(dst, t, 0.6, 'lowpass', 1200, 0.5, 1.2, 150); this.osc(dst, t, 0.4, 'sawtooth', 160, 60, 0.4); break;
        case 'throw': case 'knife': this.nz(dst, t, 0.2, 'bandpass', 900, 2, 0.5, 2600); break;
        case 'punch': this.osc(dst, t, 0.12, 'sine', 140, 55, 1.1); this.nz(dst, t, 0.05, 'lowpass', 900, 0.8, 0.7); break;
        case 'bonk': this.osc(dst, t, 0.2, 'triangle', 320, 160, 0.8); this.nz(dst, t, 0.12, 'bandpass', 1400, 2, 0.8); break;
        case 'swing': this.nz(dst, t, 0.15, 'bandpass', 600, 1.5, 0.35, 1600); break;
        case 'explosion': this.nz(dst, t, 1.6, 'lowpass', 1400, 0.4, 2.2, 60); this.osc(dst, t, 1.0, 'sine', 70, 25, 1.6); this.nz(dst, t + 0.05, 0.4, 'bandpass', 3000, 0.5, 0.6); wet(); break;
        case 'glass': for (let i = 0; i < 6; i++) this.osc(dst, t + i * 0.03, 0.25, 'sine', 2400 + Math.random() * 2400, 0, 0.12); this.nz(dst, t, 0.3, 'highpass', 4000, 0.5, 0.6); break;
        case 'impact': this.nz(dst, t, 0.06, 'bandpass', o.metal ? 3200 : 1600, 3, o.metal ? 0.4 : 0.25); if (o.metal) this.osc(dst, t, 0.15, 'triangle', 1800 + Math.random() * 800, 0, 0.12); break;
        case 'whiz': this.nz(dst, t, 0.18, 'bandpass', 2400, 6, 0.35, 900); break;
        case 'reload': this.nz(dst, t, 0.04, 'bandpass', 2600, 4, 0.5); this.nz(dst, t + 0.25, 0.05, 'bandpass', 1800, 4, 0.6); this.nz(dst, t + 0.55, 0.04, 'bandpass', 3000, 5, 0.5); break;
        case 'shell': this.nz(dst, t, 0.05, 'bandpass', 2000, 4, 0.5); this.osc(dst, t + 0.05, 0.05, 'triangle', 900, 0, 0.1); break;
        case 'dry': this.nz(dst, t, 0.02, 'highpass', 4000, 2, 0.5); break;
        case 'switch': this.nz(dst, t, 0.05, 'bandpass', 1500, 3, 0.4); this.nz(dst, t + 0.1, 0.04, 'bandpass', 2400, 3, 0.35); break;
        case 'pickup': this.osc(dst, t, 0.1, 'triangle', 880, 0, 0.3); this.osc(dst, t + 0.08, 0.18, 'triangle', 1320, 0, 0.3); break;
        case 'doc': [660, 830, 990, 1320].forEach((f, i) => this.osc(dst, t + i * 0.07, 0.25, 'triangle', f, 0, 0.25)); break;
        case 'door': this.osc(dst, t, 0.5, 'sawtooth', 110, 70, 0.08, 0.05); this.nz(dst, t, 0.4, 'bandpass', 500, 4, 0.3); break;
        case 'bars': this.osc(dst, t, 0.4, 'square', 180, 120, 0.1); this.nz(dst, t, 0.3, 'bandpass', 2400, 5, 0.3); break;
        case 'locked': this.nz(dst, t, 0.05, 'bandpass', 1200, 5, 0.5); this.nz(dst, t + 0.09, 0.05, 'bandpass', 1000, 5, 0.5); break;
        case 'unlock': this.nz(dst, t, 0.05, 'bandpass', 2500, 5, 0.6); this.osc(dst, t + 0.06, 0.1, 'triangle', 1400, 0, 0.2); break;
        case 'lock': this.nz(dst, t, 0.03, 'bandpass', 3500, 8, 0.25); break;
        case 'hurt': this.nz(dst, t, 0.18, 'lowpass', 700, 1, 0.9, 200); this.osc(dst, t, 0.15, 'sawtooth', 160, 90, 0.18); break;
        case 'pain': this.osc(dst, t, 0.3, 'sawtooth', 240 + Math.random() * 80, 140, 0.16); this.nz(dst, t, 0.25, 'bandpass', 900, 2, 0.4); break;
        case 'thud': this.osc(dst, t, 0.18, 'sine', 90, 40, 0.8); this.nz(dst, t, 0.1, 'lowpass', 500, 1, 0.6); break;
        case 'land': this.osc(dst, t, 0.12, 'sine', 100, 50, 0.6); this.nz(dst, t, 0.08, 'lowpass', 700, 1, 0.5); break;
        case 'jump': this.nz(dst, t, 0.08, 'lowpass', 900, 1, 0.3); break;
        case 'splash': this.nz(dst, t, 0.6, 'lowpass', 1800, 0.6, 1.0, 300); this.nz(dst, t, 0.3, 'highpass', 3500, 0.6, 0.3); break;
        case 'swim': this.nz(dst, t, 0.35, 'lowpass', 900, 0.6, 0.35, 300); break;
        case 'step': {
          const m = o.mat || 'concrete';
          const v = o.run ? 0.5 : 0.25;
          if (/plank|wood|siding|stair/.test(m)) { this.osc(dst, t, 0.07, 'triangle', 180 + Math.random() * 40, 90, v * 0.9); this.nz(dst, t, 0.05, 'bandpass', 800, 2, v * 0.6); }
          else if (/sand|dirt|forest|autumn|grass/.test(m)) this.nz(dst, t, 0.12, 'lowpass', 900, 0.8, v * 0.8, 300);
          else if (/snow/.test(m)) { this.nz(dst, t, 0.14, 'bandpass', 1400, 1.2, v, 600); this.nz(dst, t + 0.03, 0.08, 'highpass', 3000, 1, v * 0.4); }
          else if (/metal|container|ladder|grate|bars/.test(m)) { this.osc(dst, t, 0.1, 'triangle', 600 + Math.random() * 300, 0, v * 0.35); this.nz(dst, t, 0.05, 'bandpass', 2400, 3, v * 0.5); }
          else if (/water/.test(m)) this.nz(dst, t, 0.2, 'lowpass', 1400, 0.6, v, 400);
          else if (/carpet/.test(m)) this.nz(dst, t, 0.06, 'lowpass', 600, 1, v * 0.5);
          else { this.nz(dst, t, 0.05, 'bandpass', 1800, 2, v * 0.7); this.osc(dst, t, 0.04, 'sine', 140, 80, v * 0.4); }
          break;
        }
        case 'panel': [0, 4, 7].forEach(k => this.osc(dst, t, 0.3, 'sawtooth', NOTE(62 + k), 0, 0.07, 0.01)); this.nz(dst, t, 0.12, 'highpass', 5000, 0.6, 0.2); break;
        case 'headshot': [0, 3, 6, 10].forEach((k, i) => this.osc(dst, t + i * 0.02, 0.5, 'sawtooth', NOTE(58 + k), 0, 0.06, 0.01)); break;
        case 'alarm': for (let i = 0; i < 6; i++) this.osc(dst, t + i * 0.45, 0.42, 'square', i % 2 ? 660 : 880, 0, 0.09, 0.02); break;
        case 'memory': this.osc(dst, t, 1.6, 'sine', 220, 440, 0.25, 0.8); this.osc(dst, t + 0.8, 1.2, 'triangle', 1320, 0, 0.12, 0.05); this.nz(dst, t, 1.4, 'bandpass', 700, 2, 0.12, 2400); break;
        case 'checkpoint': this.osc(dst, t, 0.2, 'triangle', 660, 0, 0.2); this.osc(dst, t + 0.12, 0.3, 'triangle', 990, 0, 0.2); break;
        case 'spotted': this.osc(dst, t, 0.35, 'sawtooth', NOTE(70), NOTE(76), 0.08, 0.01); this.osc(dst, t, 0.35, 'sawtooth', NOTE(74), NOTE(80), 0.06, 0.01); break;
        case 'ui': this.osc(dst, t, 0.06, 'square', 900, 0, 0.08); break;
        case 'uiok': this.osc(dst, t, 0.08, 'square', 700, 0, 0.08); this.osc(dst, t + 0.06, 0.12, 'square', 1050, 0, 0.08); break;
        case 'page': this.nz(dst, t, 0.25, 'bandpass', 3000, 0.8, 0.3, 1200); break;
        case 'heart': this.osc(dst, t, 0.12, 'sine', 70, 40, 0.8); this.osc(dst, t + 0.18, 0.1, 'sine', 65, 40, 0.6); break;
        case 'heli': this.nz(dst, t, 0.1, 'lowpass', 300, 1, 1); break;
        case 'thunder': this.nz(dst, t, 3, 'lowpass', 500, 0.4, 1.6, 60); this.osc(dst, t, 2, 'sine', 50, 25, 0.8); break;
        case 'cable': this.nz(dst, t, 0.4, 'bandpass', 300, 4, 0.2); break;
        case 'grapple': this.nz(dst, t, 0.3, 'bandpass', 1200, 2, 0.4, 3000); this.osc(dst, t + 0.28, 0.1, 'triangle', 1400, 0, 0.3); break;
      }
    }
    ambience(kind) {
      if (!this.ctx || this.ambKind === kind) return;
      this.stopAmb();
      this.ambKind = kind;
      if (!kind) return;
      const c = this.ctx;
      const src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
      const f = c.createBiquadFilter();
      const g = c.createGain(); g.gain.value = 0;
      const lfo = c.createOscillator(); const lg = c.createGain();
      lfo.connect(lg); lg.connect(g.gain);
      const S = { surf: ['lowpass', 700, 0.18, 0.12, 0.09], wind: ['bandpass', 500, 0.12, 0.08, 0.15], rain: ['highpass', 2500, 0.2, 0.03, 0.4], hum: ['lowpass', 180, 0.1, 0.01, 0.1], forest: ['bandpass', 3000, 0.03, 0.02, 0.2], city: ['lowpass', 400, 0.1, 0.03, 0.05], cave: ['lowpass', 250, 0.08, 0.03, 0.07] }[kind] || ['lowpass', 500, 0.1, 0.05, 0.1];
      f.type = S[0]; f.frequency.value = S[1];
      g.gain.value = S[2]; lg.gain.value = S[3]; lfo.frequency.value = S[4];
      src.connect(f); f.connect(g); g.connect(this.ambG);
      src.start(); lfo.start();
      this.amb = { src, lfo, g };
      if (kind === 'forest' || kind === 'surf') this.birdT = 0;
    }
    stopAmb() {
      if (this.amb) { try { this.amb.src.stop(); this.amb.lfo.stop(); } catch (e) { } this.amb = null; }
      this.ambKind = null;
    }
    music(mode) {
      if (mode === this.mode) return;
      this.mode = mode;
      if (!this.ctx) return;
      this.step = 0;
      this.nextT = this.ctx.currentTime + 0.1;
    }
    schedule() {
      const c = this.ctx;
      if (!c || c.state !== 'running') return;
      if (this.ambKind && (this.ambKind === 'forest' || this.ambKind === 'surf') && Math.random() < 0.05) {
        const t = c.currentTime;
        const d = this.out(null, 0.08);
        if (this.ambKind === 'forest') for (let i = 0; i < 3; i++) this.osc(d, t + i * 0.11, 0.08, 'sine', 2600 + Math.random() * 1400, 3400, 0.4);
        else this.osc(d, t, 0.35, 'triangle', 1200, 700, 0.25);
      }
      if (!this.mode || this.mode === 'none') return;
      const bpm = { combat: 124, stealth: 88, calm: 96, menu: 92, sad: 72, boss: 136 }[this.mode] || 96;
      const st = 60 / bpm / 2;
      while (this.nextT < c.currentTime + 0.3) {
        this.note(this.step, this.nextT, st);
        this.step++;
        this.nextT += st * (this.step % 2 ? 1.18 : 0.82);
      }
    }
    note(i, t, st) {
      const m = this.mode, M = this.mus;
      const bar = Math.floor(i / 8) % 4, beat = i % 8;
      const prog = m === 'sad' ? [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 56, 59, 62]] : [[50, 53, 57, 60], [55, 59, 62, 65], [48, 51, 55, 58], [53, 57, 60, 63]];
      const ch = prog[bar];
      const bassLine = [0, 0, 7, 0, 10, 0, 7, 5];
      if (beat % 2 === 0 || m === 'combat' || m === 'boss') {
        const n = ch[0] - 12 + (m === 'stealth' ? (beat === 0 ? 0 : 7 * (beat % 4 === 0 ? 1 : 0)) : bassLine[beat]);
        const g = this.ctx.createGain(); g.gain.value = 0.5; g.connect(M);
        const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600; f.connect(g);
        this.osc(f, t, st * 1.6, 'triangle', NOTE(n), 0, 0.55, 0.004);
      }
      const drums = m === 'combat' || m === 'boss' || m === 'calm' || m === 'menu';
      if (drums) {
        const dg = this.ctx.createGain(); dg.gain.value = m === 'calm' ? 0.35 : 0.55; dg.connect(M);
        if (beat === 0 || (m !== 'calm' && beat === 5)) this.osc(dg, t, 0.18, 'sine', 120, 40, 0.9);
        if (beat === 2 || beat === 6) this.nz(dg, t, m === 'calm' ? 0.18 : 0.12, 'bandpass', m === 'calm' ? 2000 : 1500, 0.8, m === 'calm' ? 0.35 : 0.6);
        this.nz(dg, t, 0.04, 'highpass', 7000, 0.7, beat % 2 ? 0.12 : 0.22);
      }
      if (m === 'stealth' && beat === 0) {
        const pg = this.ctx.createGain(); pg.gain.value = 0.12; pg.connect(M);
        ch.forEach(n => this.osc(pg, t, st * 7.5, 'sine', NOTE(n), 0, 0.3, 0.6));
      }
      if ((m === 'calm' || m === 'menu' || m === 'sad') && (beat === 1 || beat === 5)) {
        const kg = this.ctx.createGain(); kg.gain.value = 0.14; kg.connect(M);
        ch.forEach(n => { this.osc(kg, t, st * 2.5, 'sine', NOTE(n + 12), 0, 0.25, 0.01); this.osc(kg, t, st * 1.2, 'triangle', NOTE(n + 24), 0, 0.05, 0.01); });
      }
      if ((m === 'combat' || m === 'boss') && (beat === 0 || beat === 3) && bar % 2 === 0) {
        const bg = this.ctx.createGain(); bg.gain.value = 0.1; bg.connect(M);
        const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(2800, t); f.frequency.exponentialRampToValueAtTime(600, t + 0.25); f.connect(bg);
        ch.forEach(n => this.osc(f, t, 0.28, 'sawtooth', NOTE(n + 12), 0, 0.35, 0.01));
      }
      if ((m === 'menu' || m === 'sad') && beat % 4 === 0 && Math.random() < 0.7) {
        const vg = this.ctx.createGain(); vg.gain.value = 0.12; vg.connect(M);
        const mel = ch[Math.floor(Math.random() * 4)] + 24;
        this.osc(vg, t, st * 3, 'sine', NOTE(mel), 0, 0.5, 0.01);
      }
    }
  }
  X.Audio = Audio;
})(globalThis.XIII = globalThis.XIII || {});
