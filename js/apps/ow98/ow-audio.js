(function (O) {
  'use strict';
  const AC = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;

  class Audio98 {
    constructor() {
      this.ctx = null;
      this.vol = { master: 0.8, sfx: 1, music: 0.5 };
      this.voiceOn = true;
      this.lastPlay = {};
      this.loops = {};
      this.musicNode = null;
      this.listener = { x: 0, y: 0, z: 0, yaw: 0 };
    }

    init() {
      if (this.ctx || !AC) return;
      try {
        this.ctx = new AC();
        const c = this.ctx;
        this.comp = c.createDynamicsCompressor();
        this.comp.connect(c.destination);
        this.master = c.createGain(); this.master.gain.value = this.vol.master; this.master.connect(this.comp);
        this.sfx = c.createGain(); this.sfx.gain.value = this.vol.sfx; this.sfx.connect(this.master);
        this.mus = c.createGain(); this.mus.gain.value = this.vol.music; this.mus.connect(this.master);
        const n = c.sampleRate * 1.5;
        this.noise = c.createBuffer(1, n, c.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        this.echo = c.createDelay(1); this.echo.delayTime.value = 0.18;
        this.echoG = c.createGain(); this.echoG.gain.value = 0.28;
        this.echo.connect(this.echoG); this.echoG.connect(this.echo); this.echoG.connect(this.sfx);
      } catch (e) { this.ctx = null; }
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    setVol(v) {
      Object.assign(this.vol, v);
      if (!this.ctx) return;
      this.master.gain.value = this.vol.master; this.sfx.gain.value = this.vol.sfx; this.mus.gain.value = this.vol.music;
    }
    close() {
      this.stopMusic();
      try { if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); } catch (e) { }
      if (this.ctx) this.ctx.close().catch(() => { });
      this.ctx = null;
    }

    out(pan, vol, echo) {
      const c = this.ctx;
      const g = c.createGain(); g.gain.value = vol;
      let node = g;
      if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan || 0)); g.connect(p); node = p; }
      node.connect(this.sfx);
      if (echo) node.connect(this.echo);
      return g;
    }

    tone(dst, type, f0, f1, t0, dur, v0, v1) {
      const c = this.ctx;
      const o = c.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(f0, t0);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(v0, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, v1 || 0.0001), t0 + dur);
      o.connect(g); g.connect(dst);
      o.start(t0); o.stop(t0 + dur + 0.02);
    }

    noiseHit(dst, t0, dur, v, type, freq, q, f1) {
      const c = this.ctx;
      const s = c.createBufferSource(); s.buffer = this.noise;
      const f = c.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.setValueAtTime(freq || 2000, t0); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur); f.Q.value = q || 1;
      const g = c.createGain();
      g.gain.setValueAtTime(v, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(f); f.connect(g); g.connect(dst);
      s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
    }

    play(id, o = {}) {
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime;
      const key = id + (o.key || '');
      if (this.lastPlay[key] && t - this.lastPlay[key] < (o.gap || 0.02)) return;
      this.lastPlay[key] = t;
      const v = o.vol === undefined ? 1 : o.vol;
      if (v < 0.01) return;
      const d = this.out(o.pan || 0, v, o.echo);
      const p = o.pitch || 1;
      const R = RECIPES[id];
      if (R) R(this, d, t, p, o);
      else this.noiseHit(d, t, 0.08, 0.3, 'bandpass', 1500, 2);
    }

    at(id, pos, o = {}) {
      if (!this.ctx) return;
      const L = this.listener;
      const dx = pos.x - L.x, dy = pos.y - L.y, dz = pos.z - L.z;
      const dist = Math.hypot(dx, dy, dz);
      const range = o.range || 45;
      if (dist > range * 1.6) return;
      const vol = (o.vol === undefined ? 1 : o.vol) * Math.max(0, Math.min(1, 1 - dist / (range * 1.6))) ** 1.4;
      const rx = -Math.cos(L.yaw), rz = Math.sin(L.yaw);
      const pan = dist > 0.5 ? (dx * rx + dz * rz) / dist * 0.8 : 0;
      this.play(id, Object.assign({}, o, { vol, pan, echo: dist > 20 }));
    }

    say(text, o = {}) {
      if (!this.voiceOn || typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') return;
      try {
        const s = speechSynthesis;
        if (o.priority) s.cancel(); else if (s.speaking || s.pending) { if ((this.sayQ = (this.sayQ || 0) + 1) > 2) { s.cancel(); this.sayQ = 0; } }
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ru-RU';
        const vs = s.getVoices().filter(v => /ru/i.test(v.lang));
        if (vs.length) u.voice = o.male ? (vs.find(v => /male|Pavel|Dmitr|Maxim/i.test(v.name)) || vs[0]) : (vs.find(v => /female|Irina|Svetlana|Anna|Elena/i.test(v.name)) || vs[0]);
        u.rate = o.rate || 1.05; u.pitch = o.pitch || 1; u.volume = Math.min(1, this.vol.master * (o.vol || 1));
        s.speak(u);
      } catch (e) { }
    }

    stopMusic() {
      if (this.musicTimer) clearInterval(this.musicTimer);
      this.musicTimer = null;
      this.musicName = null;
    }

    music(name) {
      if (!this.ctx) return;
      if (this.musicName === name) return;
      this.stopMusic();
      this.musicName = name;
      const song = SONGS[name];
      if (!song) return;
      let step = 0;
      const beat = 60 / song.bpm / 2;
      let next = this.ctx.currentTime + 0.1;
      const tick = () => {
        if (!this.ctx) return;
        while (next < this.ctx.currentTime + 0.4) {
          song.play(this, this.mus, next, step, beat);
          next += beat; step++;
          if (song.len && step >= song.len) { if (song.once) { this.stopMusic(); return; } step = 0; }
        }
      };
      tick();
      this.musicTimer = setInterval(tick, 150);
    }
  }

  const note = n => 440 * Math.pow(2, (n - 69) / 12);
  const MEL = [67, 0, 72, 74, 76, 0, 74, 72, 74, 0, 67, 0, 69, 71, 72, 0, 67, 0, 72, 74, 76, 0, 79, 77, 76, 0, 74, 0, 72, 0, 0, 0];
  const BASS = [48, 48, 43, 43, 45, 45, 41, 43];
  const SONGS = {
    menu: {
      bpm: 92, len: 64,
      play(a, dst, t, step, beat) {
        const m = MEL[step % 32];
        if (m) a.tone(dst, 'square', note(m), note(m), t, beat * 1.8, 0.05, 0.001);
        if (m && step >= 32) a.tone(dst, 'triangle', note(m + 12), note(m + 12), t, beat * 1.2, 0.03, 0.001);
        if (step % 4 === 0) { const b = BASS[(step / 8 | 0) % 8]; a.tone(dst, 'sawtooth', note(b - 12), note(b - 12), t, beat * 3.6, 0.07, 0.001); a.tone(dst, 'triangle', note(b), note(b), t, beat * 3.8, 0.04, 0.001); }
        if (step % 8 === 0) a.tone(dst, 'sine', 90, 45, t, 0.25, 0.25, 0.001);
        if (step % 8 === 4) a.noiseHit(dst, t, 0.12, 0.08, 'highpass', 2000);
        if (step % 2 === 1) a.noiseHit(dst, t, 0.03, 0.025, 'highpass', 7000);
      }
    },
    victory: {
      bpm: 140, len: 24, once: true,
      play(a, dst, t, step, beat) {
        const seq = [60, 64, 67, 72, 0, 72, 76, 79, 84, 0, 0, 0, 79, 0, 84, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const n = seq[step];
        if (n) { a.tone(dst, 'square', note(n), note(n), t, beat * 3, 0.07, 0.001); a.tone(dst, 'triangle', note(n - 12), note(n - 12), t, beat * 3, 0.05, 0.001); }
        if (step % 4 === 0 && step < 16) a.tone(dst, 'sine', 100, 50, t, 0.3, 0.3, 0.001);
      }
    },
    defeat: {
      bpm: 90, len: 16, once: true,
      play(a, dst, t, step, beat) {
        const seq = [67, 0, 63, 0, 62, 0, 60, 0, 0, 0, 55, 0, 0, 0, 0, 0];
        const n = seq[step];
        if (n) { a.tone(dst, 'triangle', note(n), note(n), t, beat * 3.5, 0.08, 0.001); a.tone(dst, 'sawtooth', note(n - 24), note(n - 24), t, beat * 3.5, 0.03, 0.001); }
      }
    },
    potg: {
      bpm: 120, len: 16, once: true,
      play(a, dst, t, step, beat) {
        const seq = [72, 76, 79, 84, 0, 0, 83, 0, 84, 0, 0, 0, 0, 0, 0, 0];
        const n = seq[step];
        if (n) a.tone(dst, 'square', note(n), note(n), t, beat * 2.5, 0.06, 0.001);
        if (step === 0) a.noiseHit(dst, t, 1.2, 0.15, 'highpass', 3000, 1, 9000);
      }
    }
  };

  const R = {};
  const shot = (a, d, t, f, dur, v, nf) => { a.noiseHit(d, t, dur, v, 'lowpass', nf || 3000, 1, 300); a.tone(d, 'square', f, f * 0.5, t, dur * 0.6, v * 0.35); };
  R.pistol = (a, d, t, p) => { a.tone(d, 'square', 1300 * p, 500 * p, t, 0.05, 0.18); a.noiseHit(d, t, 0.04, 0.15, 'highpass', 3000); };
  R.pulseRifle = (a, d, t, p) => { a.noiseHit(d, t, 0.09, 0.35, 'bandpass', 1400 * p, 1.2); a.tone(d, 'sawtooth', 260 * p, 90, t, 0.08, 0.2); };
  R.revolver = (a, d, t, p, o) => { a.noiseHit(d, t, o.fan ? 0.18 : 0.35, 0.6, 'lowpass', 4000, 1, 200); a.tone(d, 'sine', 160 * p, 50, t, 0.2, 0.5); };
  R.deadeyeFire = (a, d, t) => { for (let i = 0; i < 3; i++) { a.noiseHit(d, t + i * 0.05, 0.4, 0.5, 'lowpass', 5000, 1, 150); a.tone(d, 'sine', 140, 40, t + i * 0.05, 0.3, 0.4); } };
  R.frag = (a, d, t) => { a.tone(d, 'sine', 180, 70, t, 0.14, 0.45); a.noiseHit(d, t, 0.08, 0.2, 'lowpass', 800); };
  R.rivet = (a, d, t) => { a.tone(d, 'square', 700, 350, t, 0.08, 0.2); a.tone(d, 'square', 1400, 900, t, 0.05, 0.1); a.noiseHit(d, t, 0.05, 0.1, 'highpass', 2500); };
  R.rivetAlt = (a, d, t) => shot(a, d, t, 200, 0.3, 0.6, 2500);
  R.sniper = (a, d, t) => { a.noiseHit(d, t, 0.5, 0.8, 'lowpass', 6000, 1, 120); a.tone(d, 'sine', 220, 40, t, 0.35, 0.5); a.tone(d, 'square', 3000, 1500, t, 0.03, 0.2); };
  R.widowAuto = (a, d, t) => { a.noiseHit(d, t, 0.06, 0.25, 'bandpass', 1800, 2); a.tone(d, 'square', 600, 300, t, 0.04, 0.1); };
  R.scrapgun = (a, d, t, p, o) => shot(a, d, t, o.alt ? 160 : 120, 0.45, 0.8, 2200);
  R.hogShot = (a, d, t) => shot(a, d, t, 140, 0.18, 0.5, 2400);
  R.tesla = (a, d, t) => { a.tone(d, 'sawtooth', 70, 90, t, 0.26, 0.12, 0.08); a.noiseHit(d, t, 0.26, 0.12, 'bandpass', 3500, 3); };
  R.sonic = (a, d, t) => { a.tone(d, 'sine', 280, 900, t, 0.09, 0.2); a.tone(d, 'square', 140, 450, t, 0.06, 0.05); };
  R.blaster = (a, d, t) => { a.tone(d, 'square', 1600, 700, t, 0.07, 0.12); };
  R.orb = (a, d, t) => { a.tone(d, 'sine', 520, 380, t, 0.18, 0.2); a.tone(d, 'triangle', 1040, 760, t, 0.12, 0.06); };
  R.volley = (a, d, t, p, o) => { for (let i = 0; i < (o.n || 3); i++) a.tone(d, 'sine', 520 + i * 40, 380, t + i * 0.04, 0.2, 0.18); };
  R.helix = (a, d, t) => { a.noiseHit(d, t, 0.3, 0.25, 'bandpass', 900, 1, 3000); a.tone(d, 'sawtooth', 200, 600, t, 0.2, 0.06); };
  R.turretShot = (a, d, t) => { a.tone(d, 'square', 900, 400, t, 0.04, 0.1); a.noiseHit(d, t, 0.04, 0.1, 'highpass', 2000); };
  R.explode = (a, d, t, p, o) => { const big = o.big; a.noiseHit(d, t, big ? 1.2 : 0.7, big ? 0.9 : 0.7, 'lowpass', big ? 1500 : 2200, 1, 80); a.tone(d, 'sine', big ? 90 : 120, 30, t, big ? 0.9 : 0.5, 0.8); };
  R.pulseBoom = (a, d, t) => { R.explode(a, d, t, 1, { big: true }); a.tone(d, 'sine', 700, 120, t, 0.5, 0.2); };
  R.thunder = (a, d, t) => { a.noiseHit(d, t, 0.35, 0.45, 'lowpass', 2600, 1, 250); a.noiseHit(d, t + 0.08, 3.2, 0.6, 'lowpass', 700, 1, 45); a.tone(d, 'sine', 55, 28, t + 0.1, 2.4, 0.35); };
  R.tireBoom = (a, d, t) => { R.explode(a, d, t, 1, { big: true }); a.noiseHit(d, t + 0.1, 1.5, 0.5, 'lowpass', 600, 1, 60); };
  R.melee = (a, d, t) => { a.noiseHit(d, t, 0.12, 0.25, 'bandpass', 900, 1, 300); a.tone(d, 'sine', 140, 60, t + 0.05, 0.1, 0.3); };
  R.swing = (a, d, t) => a.noiseHit(d, t, 0.2, 0.2, 'bandpass', 700, 1, 2000);
  R.swingBig = (a, d, t) => a.noiseHit(d, t, 0.35, 0.35, 'bandpass', 400, 1, 1600);
  R.hammerHit = (a, d, t) => { a.tone(d, 'square', 300, 120, t, 0.25, 0.4); a.tone(d, 'triangle', 1800, 1500, t, 0.3, 0.15); a.noiseHit(d, t, 0.15, 0.4, 'lowpass', 2000); };
  R.punch = (a, d, t) => { a.tone(d, 'sine', 110, 50, t, 0.25, 0.7); a.noiseHit(d, t, 0.12, 0.4, 'lowpass', 1200); };
  R.jump = (a, d, t) => a.noiseHit(d, t, 0.06, 0.08, 'lowpass', 800);
  R.land = (a, d, t) => { a.tone(d, 'sine', 90, 50, t, 0.1, 0.25); a.noiseHit(d, t, 0.08, 0.12, 'lowpass', 600); };
  R.step = (a, d, t, p) => a.noiseHit(d, t, 0.05, 0.12, 'bandpass', 500 * p, 2);
  R.reload = (a, d, t) => { a.tone(d, 'square', 1200, 1000, t, 0.03, 0.08); a.tone(d, 'square', 900, 800, t + 0.25, 0.03, 0.08); };
  R.throw = (a, d, t) => a.noiseHit(d, t, 0.2, 0.15, 'bandpass', 600, 1, 1500);
  R.blink = (a, d, t) => { a.tone(d, 'sine', 400, 1800, t, 0.1, 0.2); a.noiseHit(d, t, 0.1, 0.15, 'highpass', 3000); };
  R.recall = (a, d, t) => { a.tone(d, 'sine', 1600, 200, t, 1.1, 0.15, 0.02); a.tone(d, 'triangle', 800, 100, t, 1.1, 0.1, 0.02); };
  R.roll = (a, d, t) => a.noiseHit(d, t, 0.3, 0.2, 'lowpass', 900);
  R.flashbang = (a, d, t) => { a.noiseHit(d, t, 0.3, 0.7, 'highpass', 1500); a.tone(d, 'sine', 3500, 3400, t, 1.0, 0.08, 0.01); };
  R.grapple = (a, d, t) => { a.tone(d, 'sawtooth', 600, 1500, t, 0.25, 0.1); a.noiseHit(d, t, 0.25, 0.1, 'bandpass', 2000); };
  R.venom = (a, d, t) => a.noiseHit(d, t, 1.2, 0.3, 'highpass', 3000);
  R.barrierUp = (a, d, t) => { a.tone(d, 'sine', 180, 260, t, 0.3, 0.15); };
  R.barrierBreak = (a, d, t) => { a.noiseHit(d, t, 0.6, 0.6, 'highpass', 2500); a.tone(d, 'triangle', 1200, 300, t, 0.5, 0.2); };
  R.charge = (a, d, t) => { a.tone(d, 'sawtooth', 70, 120, t, 1.2, 0.2, 0.05); a.noiseHit(d, t, 1.2, 0.2, 'lowpass', 500); };
  R.chargeWall = (a, d, t) => { a.tone(d, 'sine', 80, 30, t, 0.5, 0.9); a.noiseHit(d, t, 0.5, 0.8, 'lowpass', 1500, 1, 100); };
  R.pin = (a, d, t) => a.tone(d, 'sine', 120, 60, t, 0.2, 0.5);
  R.fireStrike = (a, d, t) => { a.noiseHit(d, t, 0.6, 0.5, 'bandpass', 700, 1, 2000); a.tone(d, 'sawtooth', 150, 300, t, 0.4, 0.1); };
  R.shatter = (a, d, t) => { a.tone(d, 'sine', 60, 25, t, 1.5, 1); a.noiseHit(d, t, 1.8, 0.9, 'lowpass', 900, 1, 50); };
  R.hookThrow = (a, d, t) => { for (let i = 0; i < 5; i++) a.tone(d, 'square', 2200 + i * 100, 2000, t + i * 0.03, 0.02, 0.06); };
  R.hookHit = (a, d, t) => { a.tone(d, 'square', 400, 150, t, 0.2, 0.3); a.noiseHit(d, t, 0.2, 0.3, 'bandpass', 1500); };
  R.hookMiss = (a, d, t) => a.tone(d, 'square', 900, 700, t, 0.05, 0.1);
  R.breather = (a, d, t) => a.noiseHit(d, t, 1.0, 0.35, 'bandpass', 1200, 1, 400);
  R.jumpPack = (a, d, t) => { a.noiseHit(d, t, 0.6, 0.4, 'lowpass', 1200, 1, 300); a.tone(d, 'sawtooth', 90, 200, t, 0.5, 0.15); };
  R.winstonLand = (a, d, t) => { a.tone(d, 'sine', 80, 30, t, 0.4, 0.8); a.noiseHit(d, t, 0.4, 0.6, 'lowpass', 700); };
  R.bubble = (a, d, t) => { a.tone(d, 'sine', 300, 900, t, 0.5, 0.15); a.tone(d, 'triangle', 600, 1800, t, 0.5, 0.06); };
  R.crossfade = (a, d, t, p, o) => { a.tone(d, 'sawtooth', o.song === 'heal' ? 300 : 500, o.song === 'heal' ? 200 : 900, t, 0.25, 0.12); };
  R.ampItUp = (a, d, t) => { a.tone(d, 'square', 200, 1200, t, 0.6, 0.12); };
  R.soundwave = (a, d, t) => { a.tone(d, 'sine', 90, 45, t, 0.4, 0.8); a.tone(d, 'sawtooth', 180, 60, t, 0.3, 0.2); };
  R.guardian = (a, d, t) => { a.tone(d, 'sine', 700, 1400, t, 0.4, 0.12); a.noiseHit(d, t, 0.4, 0.12, 'highpass', 4000); };
  R.beamOn = (a, d, t) => a.tone(d, 'sine', 900, 1200, t, 0.15, 0.1);
  R.orbCast = (a, d, t, p, o) => a.tone(d, 'sine', o.good ? 660 : 330, o.good ? 990 : 220, t, 0.3, 0.15);
  R.turretBuild = (a, d, t) => { for (let i = 0; i < 4; i++) a.tone(d, 'square', 500 + i * 150, 500 + i * 150, t + i * 0.12, 0.05, 0.1); };
  R.turretUp = (a, d, t) => { a.tone(d, 'square', 600, 1200, t, 0.3, 0.15); };
  R.armorUp = (a, d, t) => { a.tone(d, 'square', 800, 1200, t, 0.15, 0.12); a.tone(d, 'triangle', 1600, 1600, t + 0.1, 0.2, 0.08); };
  R.scrap = (a, d, t) => a.tone(d, 'square', 1500, 1800, t, 0.06, 0.08);
  R.pickup = (a, d, t) => { a.tone(d, 'sine', 660, 880, t, 0.15, 0.2); a.tone(d, 'sine', 990, 1320, t + 0.08, 0.2, 0.15); };
  R.mineStick = (a, d, t) => a.tone(d, 'square', 900, 700, t, 0.05, 0.12);
  R.trapSet = (a, d, t) => { a.tone(d, 'square', 400, 300, t, 0.08, 0.15); };
  R.trapSnap = (a, d, t) => { a.tone(d, 'square', 1500, 300, t, 0.15, 0.4); a.noiseHit(d, t, 0.1, 0.5, 'highpass', 2000); };
  R.bombStick = (a, d, t) => { a.tone(d, 'square', 1800, 1800, t, 0.05, 0.12); a.tone(d, 'square', 1800, 1800, t + 0.3, 0.05, 0.12); a.tone(d, 'square', 1800, 1800, t + 0.6, 0.05, 0.12); };
  R.deployDie = (a, d, t) => { a.noiseHit(d, t, 0.3, 0.4, 'lowpass', 2000); a.tone(d, 'square', 600, 100, t, 0.3, 0.1); };
  R.bounce = (a, d, t) => a.tone(d, 'square', 500, 400, t, 0.03, 0.06);
  R.death = (a, d, t) => { a.tone(d, 'sawtooth', 220, 90, t, 0.4, 0.15); a.noiseHit(d, t, 0.3, 0.15, 'lowpass', 900); };
  R.ult = (a, d, t) => { a.tone(d, 'sawtooth', 110, 220, t, 0.8, 0.12); a.tone(d, 'square', 220, 440, t, 0.8, 0.06); };
  R.hit = (a, d, t) => { a.tone(d, 'square', 1600, 1500, t, 0.03, 0.1); };
  R.headshot = (a, d, t) => { a.tone(d, 'sine', 2600, 2600, t, 0.2, 0.2); a.tone(d, 'sine', 3900, 3900, t, 0.15, 0.08); };
  R.kill = (a, d, t) => { a.tone(d, 'square', 880, 880, t, 0.08, 0.12); a.tone(d, 'square', 1320, 1320, t + 0.07, 0.12, 0.12); };
  R.hurt = (a, d, t) => { a.tone(d, 'sine', 180, 90, t, 0.12, 0.3); a.noiseHit(d, t, 0.08, 0.15, 'lowpass', 700); };
  R.ultready = (a, d, t) => { a.tone(d, 'sine', 523, 523, t, 0.12, 0.15); a.tone(d, 'sine', 784, 784, t + 0.1, 0.25, 0.15); };
  R.ui = (a, d, t) => a.tone(d, 'square', 900, 1100, t, 0.03, 0.08);
  R.hover = (a, d, t) => a.tone(d, 'sine', 1400, 1400, t, 0.02, 0.04);
  R.capture = (a, d, t) => { for (let i = 0; i < 3; i++) a.tone(d, 'square', 523 * Math.pow(1.26, i), 523 * Math.pow(1.26, i), t + i * 0.12, 0.2, 0.12); };
  R.alarm = (a, d, t) => { for (let i = 0; i < 2; i++) a.tone(d, 'square', 440, 330, t + i * 0.25, 0.2, 0.12); };
  R.boxOpen = (a, d, t) => { a.noiseHit(d, t, 0.6, 0.3, 'highpass', 1500, 1, 6000); for (let i = 0; i < 4; i++) a.tone(d, 'sine', 600 + i * 200, 900 + i * 200, t + 0.3 + i * 0.15, 0.3, 0.12); };
  R.legendary = (a, d, t) => { for (let i = 0; i < 6; i++) a.tone(d, 'triangle', 523 * Math.pow(1.122, i * 2), 523 * Math.pow(1.122, i * 2), t + i * 0.08, 0.5, 0.1); };
  R.countdown = (a, d, t) => a.tone(d, 'square', 660, 660, t, 0.1, 0.12);
  const RECIPES = R;
  O.Audio98 = Audio98;
})(globalThis.Ow98 = globalThis.Ow98 || {});
