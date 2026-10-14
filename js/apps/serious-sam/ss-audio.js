/**
 * Serious Sam 98 — synthesized sound: every effect is generated offline into sample buffers (Node-testable),
 * played positionally through Web Audio; plus a procedural music sequencer with calm and combat layers
 * in an Egyptian (double harmonic) scale.
 */
(function (S) {
  'use strict';
  const SR = 22050, TAU = Math.PI * 2;
  const rnd = S.RNG(9001);
  const noise = () => rnd() * 2 - 1;

  // ---------------------------------------------------------------- DSP helpers (offline)
  const gen = (dur, fn) => { const n = Math.max(1, Math.floor(dur * SR)), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = fn(i / SR, i); return a; };
  const mix = (...arrs) => { const n = Math.max(...arrs.map(a => a.length)), o = new Float32Array(n); for (const a of arrs) for (let i = 0; i < a.length; i++) o[i] += a[i]; return o; };
  const at = (a, t) => { const o = new Float32Array(a.length + Math.floor(t * SR)); o.set(a, Math.floor(t * SR)); return o; };
  const gain = (a, g) => { for (let i = 0; i < a.length; i++) a[i] *= g; return a; };
  function lp(a, fc) { const k = 1 - Math.exp(-TAU * fc / SR); let y = 0; for (let i = 0; i < a.length; i++) { y += k * (a[i] - y); a[i] = y; } return a; }
  function hp(a, fc) { const k = Math.exp(-TAU * fc / SR); let y = 0, px = 0; for (let i = 0; i < a.length; i++) { y = k * (y + a[i] - px); px = a[i]; a[i] = y; } return a; }
  // RBJ band-pass (constant peak gain); fc may be a function of time
  function bp(a, fc, q) {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < a.length; i++) {
      const f = typeof fc === 'function' ? fc(i / SR) : fc, w = TAU * Math.min(f, SR * 0.45) / SR, al = Math.sin(w) / (2 * q), a0 = 1 + al;
      const b0 = al / a0, b2 = -al / a0, a1 = (-2 * Math.cos(w)) / a0, a2 = (1 - al) / a0;
      const x = a[i], y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; a[i] = y;
    }
    return a;
  }
  const norm = (a, peak = 0.9) => { let m = 0; for (const v of a) m = Math.max(m, Math.abs(v)); if (m > 0) gain(a, peak / m); return a; };
  const env = (t, atk, dec) => (t < atk ? t / atk : Math.exp(-(t - atk) * dec));
  const saw = ph => 2 * (ph - Math.floor(ph + 0.5));
  const sq = ph => (ph % 1 < 0.5 ? 1 : -1);
  // oscillator with a frequency function
  function osc(dur, ffn, wave = Math.sin, amp = t => 1) {
    let ph = 0; return gen(dur, t => { ph += ffn(t) / SR; return (wave === Math.sin ? Math.sin(ph * TAU) : wave(ph)) * amp(t); });
  }
  const thump = (dur, f0, f1, dec) => osc(dur, t => f1 + (f0 - f1) * Math.exp(-t * 18), Math.sin, t => Math.exp(-t * dec));
  const burst = (dur, dec, fc) => lp(gen(dur, t => noise() * Math.exp(-t * dec)), fc);
  // vocal: saw source through formants
  function voice(dur, f0fn, formants, ampfn, rough = 0) {
    let ph = 0; const src = gen(dur, t => { ph += f0fn(t) * (1 + (rough ? noise() * rough : 0)) / SR; return saw(ph) * ampfn(t) + noise() * 0.08 * ampfn(t); });
    const outs = formants.map(([f, q, g]) => gain(bp(Float32Array.from(src), f, q), g));
    return mix(...outs);
  }
  const gun = (dur, dec, fc, bass, bdec) => norm(mix(burst(dur, dec, fc), gain(thump(dur, bass * 2, bass, bdec), 0.8)));
  const click = (t0) => at(gen(0.02, t => noise() * Math.exp(-t * 300)), t0);

  const SFX = {
    knife: () => norm(bp(gen(0.22, t => noise() * env(t, 0.03, 18)), t => 900 + t * 6000, 1.2), 0.5),
    stab: () => norm(mix(burst(0.15, 30, 1200), gain(thump(0.15, 220, 90, 30), 0.6)), 0.7),
    colt: () => gun(0.35, 22, 3200, 110, 22),
    reload: () => norm(mix(click(0), click(0.18), click(0.5), click(0.62)), 0.4),
    shotgun: () => norm(mix(gun(0.6, 9, 1800, 70, 10), gain(click(0.38), 0.3), gain(click(0.5), 0.3))),
    dshotgun: () => norm(mix(gun(0.8, 7, 1500, 60, 7), gain(gun(0.5, 12, 1400, 55, 10), 0.6), gain(click(0.75), 0.3), gain(click(0.95), 0.3))),
    tommy: () => gun(0.14, 38, 2600, 120, 40),
    minigun: () => gun(0.1, 55, 3400, 140, 60),
    rocket: () => norm(mix(gain(bp(gen(0.7, t => noise() * env(t, 0.02, 4)), t => 400 + t * 900, 0.9), 1.2), gain(thump(0.3, 160, 60, 14), 0.6))),
    grenade: () => norm(mix(thump(0.3, 220, 80, 16), gain(burst(0.2, 25, 1200), 0.5))),
    laser: () => norm(osc(0.16, t => 1900 - t * 9000, sq, t => Math.exp(-t * 18)), 0.45),
    cannon: () => norm(mix(lp(gen(1.4, t => noise() * env(t, 0.005, 3.2)), 500), gain(thump(1.2, 90, 32, 4), 1.4))),
    boom: () => norm(mix(lp(gen(1.4, t => noise() * env(t, 0.005, 3.5)), 900), gain(thump(1.0, 110, 40, 5), 1.2))),
    bigboom: () => norm(mix(lp(gen(2.4, t => noise() * env(t, 0.01, 1.8)), 600), gain(thump(2, 80, 28, 2.5), 1.4))),
    scream: () => norm(voice(1.7, t => 290 + Math.sin(t * 34) * 12 + t * 30, [[800, 5, 1], [1150, 6, 0.8], [2600, 8, 0.3]], t => Math.min(1, t / 0.06) * (t > 1.45 ? Math.max(0, 1 - (t - 1.45) / 0.25) : 1), 0.02), 0.8),
    grunt: () => norm(voice(0.35, t => 120 - t * 60, [[450, 4, 1], [900, 5, 0.5]], t => env(t, 0.03, 8)), 0.6),
    gnaar: () => norm(voice(0.7, t => 85 + Math.sin(t * 50) * 10, [[380, 3, 1], [800, 4, 0.6]], t => env(t, 0.05, 3.5) * (0.6 + 0.4 * Math.sin(t * 60)), 0.1), 0.7),
    bite: () => norm(mix(burst(0.12, 40, 2500), gain(thump(0.15, 180, 70, 30), 0.7)), 0.6),
    kleer: () => norm(mix(voice(0.9, t => 520 + t * 700 + Math.sin(t * 40) * 40, [[1200, 5, 1], [2400, 6, 0.6]], t => env(t, 0.05, 3), 0.05), gain(mix(...[0, 0.1, 0.2, 0.33, 0.45].map(click)), 0.4)), 0.7),
    claw: () => norm(bp(gen(0.2, t => noise() * env(t, 0.02, 20)), t => 3000 - t * 8000, 1.5), 0.55),
    bull: () => norm(voice(1.3, t => 75 + Math.sin(t * 6) * 15 + t * 20, [[500, 3, 1], [1000, 4, 0.6], [180, 2, 0.8]], t => env(t, 0.1, 2.2), 0.15), 0.85),
    bullhit: () => norm(mix(thump(0.35, 140, 50, 12), gain(burst(0.3, 18, 900), 0.7))),
    harpy: () => norm(voice(0.7, t => 1250 + Math.sin(t * 45) * 160, [[2200, 5, 1], [3200, 6, 0.5]], t => env(t, 0.04, 4)), 0.55),
    hop: () => norm(osc(0.16, t => 280 + t * 2600, Math.sin, t => env(t, 0.01, 18)), 0.4),
    lizard: () => norm(mix(hp(gen(0.6, t => noise() * env(t, 0.05, 5)), 2500), gain(voice(0.6, () => 95, [[400, 3, 1]], t => env(t, 0.05, 5), 0.2), 0.8)), 0.6),
    arach: () => norm(mix(osc(0.9, t => 55 + Math.sin(t * 20) * 8, sq, t => env(t, 0.05, 3) * 0.5), gain(mix(...[0.05, 0.2, 0.35, 0.5, 0.65].map(click)), 0.6)), 0.55),
    robot: () => norm(mix(lp(osc(1.1, t => 110 - t * 30, sq, t => env(t, 0.05, 2.5) * (0.5 + 0.5 * sq(t * 12))), 1600), gain(burst(0.4, 8, 400), 0.5)), 0.6),
    golem: () => norm(mix(lp(gen(1.2, t => noise() * env(t, 0.1, 2.5)), 250), gain(voice(1.2, t => 55 - t * 10, [[250, 2, 1]], t => env(t, 0.1, 2.5), 0.3), 0.8)), 0.8),
    bossroar: () => norm(mix(voice(2.4, t => 48 + Math.sin(t * 5) * 8, [[350, 2.5, 1], [700, 3, 0.6], [140, 2, 1]], t => env(t, 0.2, 1.2), 0.2), gain(lp(gen(2.4, t => noise() * env(t, 0.3, 1.2)), 300), 0.6))),
    pain: () => norm(voice(0.28, t => 180 - t * 200, [[600, 4, 1], [1100, 5, 0.5]], t => env(t, 0.02, 10)), 0.5),
    gibs: () => norm(mix(...[0, 0.05, 0.12, 0.2].map(t0 => at(lp(gen(0.18, t => noise() * Math.exp(-t * 25)), 700), t0)), gain(thump(0.3, 120, 50, 12), 0.6))),
    die_small: () => norm(voice(0.6, t => 160 - t * 140, [[550, 4, 1], [1000, 5, 0.5]], t => env(t, 0.03, 4.5), 0.03), 0.6),
    die_big: () => norm(voice(1.2, t => 90 - t * 50, [[450, 3, 1], [900, 4, 0.5], [160, 2, 0.7]], t => env(t, 0.05, 2.5), 0.12), 0.8),
    die_kleer: () => norm(mix(...[0, 0.06, 0.1, 0.18, 0.25, 0.31, 0.4, 0.52, 0.6].map(click), gain(voice(0.5, t => 700 - t * 800, [[1400, 5, 1]], t => env(t, 0.02, 6)), 0.5)), 0.6),
    bossdie: () => norm(mix(voice(3.2, t => 60 - t * 12, [[380, 2.5, 1], [760, 3, 0.5], [150, 2, 1]], t => env(t, 0.1, 0.9), 0.25), gain(lp(gen(3.2, t => noise() * env(t, 0.5, 0.8)), 250), 0.9))),
    phurt: () => norm(voice(0.25, t => 140 - t * 60, [[500, 4, 1], [950, 5, 0.4]], t => env(t, 0.02, 12)), 0.55),
    pdie: () => norm(voice(1.1, t => 170 - t * 90, [[650, 4, 1], [1100, 5, 0.5]], t => env(t, 0.03, 2.5), 0.05), 0.7),
    gate: () => norm(mix(lp(gen(2.2, t => noise() * (0.6 + 0.4 * Math.sin(t * 17)) * Math.min(1, t * 4) * Math.max(0, 1 - (t - 1.8) * 2.5)), 350), gain(thump(0.4, 90, 40, 6), 0.5)), 0.6),
    secret: () => norm(mix(...[523, 659, 784, 1047].map((f, i) => at(osc(0.6, () => f, Math.sin, t => env(t, 0.01, 5)), i * 0.09))), 0.6),
    erocket: () => norm(bp(gen(0.5, t => noise() * env(t, 0.02, 5)), t => 600 + t * 700, 0.9), 0.55),
    efire: () => norm(bp(gen(0.35, t => noise() * env(t, 0.03, 8)), 900, 0.7), 0.5),
    lava: () => norm(mix(osc(0.4, t => 120 + Math.sin(t * 40) * 40, Math.sin, t => env(t, 0.02, 7)), gain(burst(0.3, 10, 600), 0.5)), 0.6),
    throw: () => norm(bp(gen(0.25, t => noise() * env(t, 0.05, 10)), t => 500 + t * 3000, 1.2), 0.45),
    arachgun: () => gun(0.1, 55, 2200, 100, 50),
    bossfire: () => norm(mix(bp(gen(0.9, t => noise() * env(t, 0.05, 3)), 500, 0.6), gain(thump(0.6, 90, 40, 5), 0.8))),
    stomp: () => norm(mix(thump(1.2, 70, 25, 3), gain(lp(gen(1.2, t => noise() * env(t, 0.01, 3)), 200), 0.8))),
    ballbounce: () => norm(thump(0.3, 90, 50, 14), 0.7),
    bounce: () => norm(mix(osc(0.12, () => 1400, Math.sin, t => Math.exp(-t * 40)), gain(burst(0.05, 80, 3000), 0.3)), 0.35),
    pick_health: () => norm(mix(osc(0.12, () => 660, Math.sin, t => env(t, 0.005, 20)), at(osc(0.2, () => 990, Math.sin, t => env(t, 0.005, 14)), 0.08)), 0.45),
    pick_armor: () => norm(mix(osc(0.35, () => 420, sq, t => env(t, 0.005, 12) * 0.4), at(osc(0.35, () => 630, sq, t => env(t, 0.005, 12) * 0.4), 0.06), gain(burst(0.1, 40, 4000), 0.3)), 0.45),
    pick_ammo: () => norm(mix(click(0), click(0.07), gain(thump(0.1, 300, 150, 30), 0.5)), 0.45),
    pick_weapon: () => norm(mix(click(0), click(0.12), click(0.2), at(osc(0.5, () => 330, saw, t => env(t, 0.01, 6) * 0.3), 0.05), at(osc(0.5, () => 495, saw, t => env(t, 0.01, 6) * 0.3), 0.05)), 0.55),
    pick_power: () => norm(osc(0.8, t => 300 + t * 1500, sq, t => env(t, 0.02, 3) * 0.4), 0.5),
    jump: () => norm(voice(0.18, () => 130, [[500, 4, 1]], t => env(t, 0.02, 14)), 0.25),
    land: () => norm(mix(thump(0.2, 120, 60, 20), gain(burst(0.12, 30, 800), 0.5)), 0.45),
    step: () => norm(lp(gen(0.08, t => noise() * Math.exp(-t * 60)), 1400), 0.18),
    switch: () => norm(mix(click(0), click(0.08)), 0.3),
    charge: () => norm(osc(0.6, t => 120 + t * 300, saw, t => Math.min(1, t * 5) * 0.3), 0.35),
    netricsa: () => norm(mix(osc(0.09, () => 1320, sq, () => 0.3), at(osc(0.12, () => 1760, sq, () => 0.3), 0.12)), 0.35),
    newenemy: () => norm(mix(osc(0.15, () => 880, sq, () => 0.3), at(osc(0.15, () => 660, sq, () => 0.3), 0.16), at(osc(0.2, () => 880, sq, () => 0.3), 0.32)), 0.35)
  };

  // ---------------------------------------------------------------- music (scheduled oscillators)
  // double harmonic major intervals from the root
  const SCALE = [0, 1, 4, 5, 7, 8, 11, 12, 13, 16, 17, 19];
  const TRACKS = [
    { root: 40, bpm: 124, seed: 1 }, { root: 45, bpm: 132, seed: 2 }, { root: 38, bpm: 118, seed: 3 }, { root: 43, bpm: 136, seed: 4 }, { root: 41, bpm: 140, seed: 5 }
  ];
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  class Audio {
    constructor() {
      this.sfxVol = 0.8; this.musicVol = 0.5; this.ctx = null; this.buffers = {}; this.voices = []; this.recent = {}; this.listener = { x: 0, y: 0, z: 0, yaw: 0 };
      this.track = null; this.fight = 0; this.fightTarget = 0; this.step = 0; this.nextT = 0; this.paused = false;
    }
    init() {
      if (this.ctx) return true;
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return false;
      try { this.ctx = new AC(); } catch (_) { return false; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.connect(c.destination);
      this.sfx = c.createGain(); this.sfx.connect(this.master);
      this.music = c.createGain(); this.music.connect(this.master);
      this.calm = c.createGain(); this.calm.connect(this.music); this.combat = c.createGain(); this.combat.gain.value = 0; this.combat.connect(this.music);
      this.noiseBuf = c.createBuffer(1, SR, SR); const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.applyVolume(); return true;
    }
    resume() { if (!this.init()) return; if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); this.warm(); }
    // synthesize every effect in small idle slices so the first shot of a weapon never stalls a frame
    warm() {
      if (this.warming) return; this.warming = true;
      const names = Object.keys(SFX).filter(n => !this.buffers[n]);
      const step = () => { if (!this.ctx) return; const t = Date.now(); while (names.length && Date.now() - t < 8) this.buffer(names.shift()); if (names.length) setTimeout(step, 30); };
      setTimeout(step, 50);
    }
    applyVolume() { if (!this.ctx) return; this.sfx.gain.value = this.sfxVol; this.music.gain.value = this.musicVol * 0.55; }
    buffer(name) {
      if (this.buffers[name]) return this.buffers[name];
      const f = SFX[name]; if (!f) return null;
      const data = f(), b = this.ctx.createBuffer(1, data.length, SR); b.getChannelData(0).set(data);
      return (this.buffers[name] = b);
    }
    setListener(x, y, z, yaw) { this.listener = { x, y, z, yaw }; }
    play(name, x, y, z, vol = 1) {
      if (!this.ctx || this.paused || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime, r = this.recent[name];
      if (r && now - r.t < 0.05) { if (r.n >= 3) return; r.n++; } else this.recent[name] = { t: now, n: 1 };
      const b = this.buffer(name); if (!b) return;
      let g = vol, pan = 0;
      if (x != null) {
        const L = this.listener, dx = x - L.x, dz = z - L.z, dy = (y || 0) - L.y, d = Math.hypot(dx, dy, dz);
        g *= 1 / (1 + Math.pow(d / 14, 1.25)); if (g < 0.015) return;
        const ang = Math.atan2(dx, dz) - L.yaw; pan = -Math.sin(ang) * Math.min(1, d / 3) * 0.85;
      }
      this.voices = this.voices.filter(v => v.end > now);
      if (this.voices.length > 40) { const q = this.voices.sort((a, b2) => a.g - b2.g)[0]; if (q.g > g) return; try { q.src.stop(); } catch (_) {} this.voices.splice(this.voices.indexOf(q), 1); }
      const src = this.ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = name === 'step' || name.startsWith('pick') ? 1 : 0.94 + Math.random() * 0.12;
      const gn = this.ctx.createGain(); gn.gain.value = g;
      let node = gn;
      if (this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = pan; gn.connect(p); node = p; }
      src.connect(gn); node.connect(this.sfx); src.start();
      this.voices.push({ src, g, end: now + b.duration });
    }
    // ---- music
    startMusic(i) { if (!this.init()) return; this.track = TRACKS[i % TRACKS.length]; this.rng = S.RNG(this.track.seed * 131); this.step = 0; this.nextT = this.ctx.currentTime + 0.1; this.buildPatterns(); }
    stopMusic() { this.track = null; }
    buildPatterns() {
      const r = this.rng, pick = () => SCALE[r.int(8)];
      this.melody = Array.from({ length: 32 }, (_, i) => (i % 4 === 0 || r() < 0.35 ? pick() : null));
      this.riff = Array.from({ length: 16 }, (_, i) => (i % 2 === 0 || r() < 0.4 ? [0, 0, 1, 0, 7, 5, 4, 1][r.int(8)] : null));
      this.chords = [0, 5, 4, 1].map(o => o + (r() < 0.3 ? 12 : 0));
    }
    setCombat(k) { this.fightTarget = k; }
    note(dest, t, freq, dur, type, vol, cutoff) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let n = o; if (cutoff) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; o.connect(f); n = f; }
      n.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
    }
    drum(dest, t, kind, vol) {
      const c = this.ctx;
      if (kind === 'kick') { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.32); return; }
      const s = c.createBufferSource(); s.buffer = this.noiseBuf; const f = c.createBiquadFilter(), g = c.createGain();
      f.type = kind === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'hat' ? 7000 : kind === 'tabla' ? 500 : 1800;
      const len = kind === 'hat' ? 0.05 : kind === 'tabla' ? 0.12 : 0.18;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
      s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + len + 0.02);
      if (kind === 'tabla') this.note(dest, t, 180 + Math.random() * 60, 0.15, 'sine', vol * 0.8);
    }
    update() {
      if (!this.ctx || !this.track || this.paused) return;
      const c = this.ctx, now = c.currentTime;
      this.fight += (this.fightTarget - this.fight) * 0.02;
      this.combat.gain.setTargetAtTime(this.fight, now, 0.3); this.calm.gain.setTargetAtTime(1 - this.fight * 0.75, now, 0.3);
      const T = this.track, st = 60 / T.bpm / 4;
      if (this.nextT < now - 0.5) this.nextT = now + 0.05;
      while (this.nextT < now + 0.25) {
        const t = this.nextT, s = this.step, bar = Math.floor(s / 16) % 4, root = T.root + this.chords[bar];
        // calm layer: pad, sparse melody, hand drums
        if (s % 16 === 0) for (const iv of [0, 7, 12]) this.note(this.calm, t, mtof(root + iv), st * 16, 'triangle', 0.035);
        const m = this.melody[s % 32]; if (m != null && s % 2 === 0) this.note(this.calm, t, mtof(T.root + 24 + m), st * 3, 'sine', 0.05);
        if (s % 4 === 2 || (s % 8 === 7)) this.drum(this.calm, t, 'tabla', 0.12);
        // combat layer: drums, bass riff, lead
        if (this.fight > 0.02) {
          if (s % 4 === 0 || s % 16 === 10) this.drum(this.combat, t, 'kick', 0.5);
          if (s % 8 === 4) this.drum(this.combat, t, 'snare', 0.3);
          if (s % 2 === 1) this.drum(this.combat, t, 'hat', 0.08);
          const r = this.riff[s % 16]; if (r != null) this.note(this.combat, t, mtof(root - 12 + r), st * 1.8, 'sawtooth', 0.09, 700);
          if (s % 32 >= 16) { const mm = this.melody[(s * 3) % 32]; if (mm != null && s % 2 === 0) this.note(this.combat, t, mtof(T.root + 12 + mm), st * 1.8, 'square', 0.035, 2400); }
        }
        this.step++; this.nextT += st;
      }
    }
    pause(p) { this.paused = p; if (this.ctx) { if (p) this.ctx.suspend().catch(() => {}); else this.ctx.resume().catch(() => {}); } }
    destroy() { this.track = null; if (this.ctx) { try { this.ctx.close(); } catch (_) {} } this.ctx = null; }
  }

  S.SFX = SFX; S.Audio = Audio; S.MUSIC = TRACKS; S.SR = SR;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.SeriousSam98 = globalThis.SeriousSam98 || {});
