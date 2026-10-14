(function (S) {
  'use strict';
  const SR = 22050, TAU = Math.PI * 2;
  const rnd = S.RNG(1999);
  const noise = () => rnd() * 2 - 1;
  const gen = (dur, fn) => { const n = Math.max(1, Math.floor(dur * SR)), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = fn(i / SR, i); return a; };
  const mix = (...arrs) => { const n = Math.max(...arrs.map(a => a.length)), o = new Float32Array(n); for (const a of arrs) for (let i = 0; i < a.length; i++) o[i] += a[i]; return o; };
  const at = (a, t) => { const o = new Float32Array(a.length + Math.floor(t * SR)); o.set(a, Math.floor(t * SR)); return o; };
  const gain = (a, g) => { for (let i = 0; i < a.length; i++) a[i] *= g; return a; };
  function lp(a, fc) { const k = 1 - Math.exp(-TAU * fc / SR); let y = 0; for (let i = 0; i < a.length; i++) { y += k * (a[i] - y); a[i] = y; } return a; }
  function hp(a, fc) { const k = Math.exp(-TAU * fc / SR); let y = 0, px = 0; for (let i = 0; i < a.length; i++) { y = k * (y + a[i] - px); px = a[i]; a[i] = y; } return a; }
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
  function osc(dur, ffn, wave = Math.sin, amp = () => 1) { let ph = 0; return gen(dur, t => { ph += ffn(t) / SR; return (wave === Math.sin ? Math.sin(ph * TAU) : wave(ph)) * amp(t); }); }
  const thump = (dur, f0, f1, dec) => osc(dur, t => f1 + (f0 - f1) * Math.exp(-t * 18), Math.sin, t => Math.exp(-t * dec));
  const burst = (dur, dec, fc) => lp(gen(dur, t => noise() * Math.exp(-t * dec)), fc);
  function voice(dur, f0fn, formants, ampfn, rough = 0) {
    let ph = 0; const src = gen(dur, t => { ph += f0fn(t) * (1 + (rough ? noise() * rough : 0)) / SR; return saw(ph) * ampfn(t) + noise() * 0.08 * ampfn(t); });
    return mix(...formants.map(([f, q, g]) => gain(bp(Float32Array.from(src), f, q), g)));
  }
  const gun = (dur, dec, fc, bass, bdec, tail = 0.35) => norm(mix(burst(dur, dec, fc), gain(thump(dur, bass * 2, bass, bdec), 0.9), gain(at(lp(gen(dur * 2, t => noise() * Math.exp(-t * 5)), 600), 0.04), tail)));
  const click = (t0, f = 3000) => at(bp(gen(0.03, t => noise() * Math.exp(-t * 260)), f, 1.5), t0);
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function speech(pitch, dur, seed) {
    const r = S.RNG(seed), syl = Math.max(3, Math.floor(dur * 7)), parts = [];
    let t = 0;
    for (let i = 0; i < syl; i++) {
      const d = 0.08 + r() * 0.1, f1 = [320, 480, 650, 750, 560][Math.floor(r() * 5)], f2 = [900, 1200, 1700, 2100, 2400][Math.floor(r() * 5)], p = pitch * (0.9 + r() * 0.25) * (i === syl - 1 ? 0.85 : 1);
      parts.push(at(voice(d, () => p, [[f1, 5, 1], [f2, 7, 0.5]], tt => Math.sin(Math.min(1, tt / d) * Math.PI), 0.02), t));
      if (r() < 0.3) parts.push(at(gain(hp(gen(0.05, tt => noise() * Math.exp(-tt * 40)), 3000), 0.3), t + d));
      t += d + r() * 0.03;
    }
    return norm(mix(...parts), 0.5);
  }

  const SFX = {
    colt: () => gun(0.32, 24, 3400, 120, 22, 0.35),
    silenced: () => norm(mix(bp(gen(0.1, t => noise() * Math.exp(-t * 60)), 1400, 1.2), gain(click(0.01, 4000), 0.6)), 0.4),
    p38: () => gun(0.3, 26, 3600, 140, 24, 0.3),
    thompson: () => gun(0.17, 38, 2800, 110, 36, 0.22),
    mp40: () => gun(0.16, 42, 3000, 130, 40, 0.2),
    stg44: () => gun(0.2, 32, 3600, 100, 28, 0.3),
    garand: () => gun(0.45, 16, 3200, 80, 16, 0.5),
    kar98: () => gun(0.5, 14, 3000, 75, 14, 0.55),
    bar: () => gun(0.3, 24, 3000, 85, 22, 0.4),
    springfield: () => gun(0.55, 13, 3200, 72, 13, 0.6),
    mg42: () => gun(0.12, 50, 3200, 110, 45, 0.15),
    rocket: () => norm(mix(lp(gen(0.9, t => noise() * env(t, 0.01, 4)), 1800), gain(thump(0.4, 140, 50, 8), 0.8), gain(bp(gen(0.9, t => noise() * env(t, 0.05, 3)), 3000, 1), 0.5))),
    cannon: () => norm(mix(lp(gen(2.2, t => noise() * env(t, 0.004, 2.4)), 700), gain(thump(1.3, 90, 30, 3.5), 1.4), gain(at(lp(gen(1.6, t => noise() * Math.exp(-t * 2)), 350), 0.25), 0.5))),
    explosion: () => norm(mix(lp(gen(1.9, t => noise() * env(t, 0.005, 2.7)), 900), gain(thump(1.2, 110, 34, 4), 1.3), gain(at(lp(gen(1.5, t => noise() * Math.exp(-t * 2)), 400), 0.2), 0.4))),
    ping: () => norm(mix(osc(0.9, () => 2650, Math.sin, t => Math.exp(-t * 5)), gain(osc(0.9, () => 3990, Math.sin, t => Math.exp(-t * 7)), 0.5), gain(click(0, 5000), 0.4)), 0.45),
    bolt: () => norm(mix(click(0.08, 1800), click(0.22, 2400), click(0.38, 1600), click(0.5, 2200)), 0.4),
    dry: () => norm(click(0, 2000), 0.35),
    reload_pistol: () => norm(mix(click(0.05), click(0.5), click(0.9, 2200), click(1.2, 1800)), 0.4),
    reload_rifle: () => norm(mix(click(0.1, 1800), click(0.3, 1400), click(1.2, 2000), click(1.5, 2500), click(1.9, 1700)), 0.45),
    reload_heavy: () => norm(mix(click(0.2, 900), gain(bp(gen(0.5, t => noise() * env(t, 0.05, 6)), 700, 1), 0.6), click(1.6, 1500), click(2.3, 1100)), 0.45),
    reload_npc: () => norm(mix(click(0.1, 1800), click(0.6, 2200), click(1.1, 1600)), 0.35),
    switch: () => norm(mix(click(0, 2500), gain(burst(0.12, 30, 1200), 0.3)), 0.3),
    throw: () => norm(bp(gen(0.25, t => noise() * env(t, 0.05, 10)), t => 500 + t * 3000, 1.2), 0.4),
    pin: () => norm(mix(click(0, 4200), gain(osc(0.1, () => 3100, Math.sin, t => Math.exp(-t * 40)), 0.4)), 0.35),
    nadebounce: () => norm(mix(osc(0.12, () => 900, Math.sin, t => Math.exp(-t * 40)), gain(click(0, 2000), 0.5)), 0.4),
    hitflesh: () => norm(mix(burst(0.08, 40, 900), gain(thump(0.08, 160, 80, 40), 0.7)), 0.5),
    whiz: () => norm(bp(gen(0.18, t => noise() * Math.sin(Math.min(1, t / 0.18) * Math.PI)), t => 4000 - t * 12000, 4), 0.35),
    ricochet: () => norm(mix(osc(0.35, t => 3200 - t * 5000, Math.sin, t => Math.exp(-t * 9)), gain(click(0, 4000), 0.6)), 0.4),
    helmet: () => norm(mix(osc(0.4, () => 1800, Math.sin, t => Math.exp(-t * 12)), gain(osc(0.4, () => 2700, Math.sin, t => Math.exp(-t * 16)), 0.6), click(0, 3500)), 0.5),
    tankhit: () => norm(mix(osc(0.5, () => 420, sq, t => Math.exp(-t * 10)), gain(burst(0.3, 12, 2500), 0.8)), 0.6),
    pain: () => norm(voice(0.3, t => 150 - t * 120, [[550, 4, 1], [1000, 5, 0.45]], t => env(t, 0.02, 10), 0.05), 0.5),
    pdeath: () => norm(voice(1.2, t => 150 - t * 80, [[600, 4, 1], [1050, 5, 0.5]], t => env(t, 0.03, 2.4), 0.06), 0.7),
    hurt_de: () => norm(voice(0.3, t => 135 - t * 90, [[520, 4, 1], [980, 5, 0.45]], t => env(t, 0.02, 10), 0.05), 0.55),
    die_de: () => norm(voice(0.9, t => 145 - t * 100, [[560, 4, 1], [1000, 5, 0.5]], t => env(t, 0.03, 3), 0.05), 0.65),
    die_stahl: () => norm(voice(1.6, t => 110 - t * 50, [[500, 4, 1], [900, 5, 0.5]], t => env(t, 0.03, 1.8), 0.05), 0.7),
    step_grass: () => norm(bp(gen(0.12, t => noise() * env(t, 0.01, 30)), 1800, 0.7), 0.16),
    step_dirt: () => norm(lp(gen(0.1, t => noise() * env(t, 0.005, 40)), 1200), 0.2),
    step_hard: () => norm(mix(lp(gen(0.08, t => noise() * Math.exp(-t * 60)), 2500), gain(thump(0.06, 180, 90, 50), 0.4)), 0.2),
    step_snow: () => norm(bp(gen(0.16, t => noise() * env(t, 0.02, 18) * (0.6 + 0.4 * Math.sin(t * 300))), 1100, 0.8), 0.22),
    jump: () => norm(voice(0.18, () => 120, [[500, 4, 1]], t => env(t, 0.02, 14)), 0.2),
    land: () => norm(mix(thump(0.2, 110, 55, 20), gain(burst(0.12, 30, 800), 0.5)), 0.4),
    health: () => norm(mix(...[523, 659, 784].map((f, i) => at(osc(0.18, () => f, Math.sin, t => env(t, 0.01, 10)), i * 0.06))), 0.35),
    pickgun: () => norm(mix(click(0, 1500), click(0.12, 2200), gain(burst(0.15, 20, 1000), 0.4)), 0.4),
    pickup: () => norm(mix(click(0, 1800), gain(bp(gen(0.2, t => noise() * env(t, 0.02, 14)), 1200, 0.8), 0.6)), 0.35),
    objective: () => norm(mix(...[392, 523, 659, 784].map((f, i) => at(osc(0.35, () => f, saw, t => env(t, 0.02, 5)), i * 0.1))), 0.35),
    siren: () => { let ph = 0; return norm(gen(4, t => { ph += (500 + 250 * Math.sin(t * Math.PI * 0.75 - Math.PI / 2)) / SR; return Math.sin(ph * TAU) * Math.min(1, t * 3) * Math.max(0, 1 - (t - 3.3) * 1.5) + 0.3 * Math.sin(ph * TAU * 2); }), 0.5); },
    door: () => norm(mix(bp(gen(0.5, t => noise() * env(t, 0.05, 6)), t => 400 + Math.sin(t * 20) * 150, 3), gain(osc(0.5, t => 180 + t * 120, saw, t => env(t, 0.05, 6) * 0.2), 0.5)), 0.35),
    metaldoor: () => norm(mix(osc(0.6, () => 140, sq, t => env(t, 0.02, 5) * 0.4), gain(bp(gen(0.6, t => noise() * env(t, 0.02, 5)), 900, 2), 0.7), click(0.55, 1200)), 0.4),
    bars: () => norm(mix(osc(0.5, () => 900, Math.sin, t => Math.exp(-t * 8)), gain(osc(0.5, () => 1340, Math.sin, t => Math.exp(-t * 10)), 0.6), click(0, 2500)), 0.35),
    unlock: () => norm(mix(click(0, 2200), click(0.15, 1600), click(0.3, 2800)), 0.4),
    tick: () => norm(click(0, 3200), 0.4),
    planting: () => norm(mix(bp(gen(1.6, t => noise() * (0.5 + 0.5 * Math.sin(t * 22)) * env(t, 0.05, 1)), 1400, 1), click(0.4, 2000), click(1.2, 1600)), 0.35),
    plant: () => norm(mix(click(0, 2600), click(0.08, 3000), gain(osc(0.25, () => 1500, sq, () => 0.3), 0.3)), 0.4),
    ally: () => norm(speech(125, 0.7, 7), 0.5),
    paper: () => norm(bp(gen(0.35, t => noise() * env(t, 0.02, 9) * (0.6 + 0.4 * Math.sin(t * 90))), 3000, 0.8), 0.35),
    dog_bark: () => norm(mix(voice(0.2, t => 520 - t * 300, [[750, 4, 1], [1600, 5, 0.6]], t => env(t, 0.01, 14), 0.08), at(voice(0.2, t => 500 - t * 300, [[750, 4, 1], [1600, 5, 0.6]], t => env(t, 0.01, 14), 0.08), 0.28)), 0.7),
    dog_attack: () => norm(mix(voice(0.3, () => 420, [[800, 3, 1]], t => env(t, 0.01, 10), 0.3), gain(burst(0.1, 40, 2500), 0.5)), 0.7),
    dog_hurt: () => norm(osc(0.3, t => 1200 - t * 1500, Math.sin, t => env(t, 0.01, 8)), 0.5),
    dog_die: () => norm(osc(0.7, t => 900 - t * 900, Math.sin, t => env(t, 0.01, 4)), 0.5),
    bark_0: () => speech(118, 0.9, 11), bark_1: () => speech(102, 0.9, 23), bark_2: () => speech(92, 1.2, 37),
    ui_click: () => norm(mix(click(0, 3000), gain(osc(0.03, () => 900, sq), 0.2)), 0.25),
    ui_open: () => norm(bp(gen(0.18, t => noise() * env(t, 0.02, 14)), t => 600 + t * 3000, 1.2), 0.25),
    amb_artillery: () => norm(mix(lp(gen(3, t => noise() * env(t, 0.02, 1.4)), 300), gain(thump(1.5, 60, 25, 2.5), 1)), 0.5),
    amb_plane: () => norm(mix(osc(6, t => 90 + Math.sin(t * 0.5) * 4, saw, t => Math.sin(Math.min(1, t / 6) * Math.PI) * 0.4), gain(osc(6, t => 180 + Math.sin(t * 0.5) * 8, saw, t => Math.sin(Math.min(1, t / 6) * Math.PI) * 0.2), 0.5)), 0.35),
    amb_shots: () => norm(mix(...[0, 0.12, 0.24, 0.9, 1.02, 1.14, 1.8].map(t0 => at(lp(gun(0.3, 25, 2000, 80, 20), 900), t0))), 0.45)
  };
  const LOOPS = {
    wind: () => { const a = gen(6, t => noise() * (0.55 + 0.45 * Math.sin(t / 6 * TAU))); bp(a, 380, 0.5); return norm(a, 0.5); },
    fire: () => norm(mix(lp(gen(4, () => noise() * 0.25), 600), ...Array.from({ length: 40 }, () => at(hp(gen(0.02, t => noise() * Math.exp(-t * 300)), 2000), rnd() * 3.9))), 0.5),
    water: () => norm(bp(gen(5, t => noise() * (0.6 + 0.4 * Math.sin(t * 1.3))), 500, 0.4), 0.45),
    hum: () => norm(mix(osc(4, () => 100, Math.sin, () => 0.5), gain(osc(4, () => 200, Math.sin, () => 0.25), 0.6), gain(bp(gen(4, () => noise()), 300, 2), 0.2)), 0.35)
  };
  const THEMES = {
    menu: { tempo: 0.5, chords: [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]], melody: [74, 76, 78, 81, 79, 78, 76, 74, 71, 74, 76, 73], snare: true },
    game: { tempo: 1.4, chords: [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 58], [40, 47, 52, 55]], melody: null, snare: false },
    tense: { tempo: 0.8, chords: [[45, 51, 57, 60], [44, 50, 56, 59], [45, 51, 57, 60], [42, 48, 54, 57]], melody: null, snare: true },
    victory: { tempo: 0.45, chords: [[48, 55, 60, 64], [53, 57, 60, 65], [55, 59, 62, 67], [48, 55, 60, 64]], melody: [72, 76, 79, 84, 79, 81, 79, 76, 77, 79, 72, 72], snare: true }
  };

  class Audio {
    constructor() {
      this.sfxVol = 0.8; this.musicVol = 0.5; this.ctx = null; this.buffers = {}; this.voices = []; this.recent = {}; this.listener = { x: 0, y: 0, z: 0, yaw: 0 };
      this.paused = false; this.loops = {}; this.musicOn = false; this.nextNote = 0; this.ambT = 25; this.theme = 'menu';
    }
    init() {
      if (this.ctx) return true;
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return false;
      try { this.ctx = new AC(); } catch (_) { return false; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.connect(c.destination);
      this.sfx = c.createGain(); this.sfx.connect(this.master);
      this.music = c.createGain(); this.music.connect(this.master);
      this.applyVolume(); return true;
    }
    resume() { if (!this.init()) return; if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); this.warm(); }
    warm() {
      if (this.warming) return; this.warming = true;
      const names = Object.keys(SFX).filter(n => !this.buffers[n]);
      const step = () => { if (!this.ctx) return; const t = Date.now(); while (names.length && Date.now() - t < 8) this.buffer(names.shift()); if (names.length) setTimeout(step, 30); };
      setTimeout(step, 50);
    }
    applyVolume() { if (!this.ctx) return; this.sfx.gain.value = this.sfxVol; this.music.gain.value = this.musicVol * 0.6; }
    buffer(name) {
      if (this.buffers[name]) return this.buffers[name];
      const f = SFX[name] || LOOPS[name]; if (!f) return null;
      const data = f(), b = this.ctx.createBuffer(1, data.length, SR); b.getChannelData(0).set(data);
      return (this.buffers[name] = b);
    }
    setListener(x, y, z, yaw) { this.listener = { x, y, z, yaw }; }
    play(name, x, y, z, vol = 1, rate = null) {
      if (!this.ctx || this.paused || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime, r = this.recent[name];
      if (r && now - r.t < 0.04) { if (r.n >= 3) return; r.n++; } else this.recent[name] = { t: now, n: 1 };
      const b = this.buffer(name); if (!b) return;
      let g = vol, pan = 0, dist = 0;
      if (x != null) {
        const L = this.listener, dx = x - L.x, dz = z - L.z, dy = (y || 0) - L.y; dist = Math.hypot(dx, dy, dz);
        const far = /colt|p38|thompson|mp40|stg44|garand|kar98|bar|springfield|mg42|rocket|cannon|explosion|siren|amb_/.test(name) ? 35 : 12;
        g *= 1 / (1 + Math.pow(dist / far, 1.4)); if (g < 0.01) return;
        const ang = Math.atan2(dx, dz) - L.yaw; pan = -Math.sin(ang) * Math.min(1, dist / 3) * 0.85;
      }
      this.voices = this.voices.filter(v => v.end > now);
      if (this.voices.length > 40) { const q = this.voices.sort((a, b2) => a.g - b2.g)[0]; if (q.g > g) return; try { q.src.stop(); } catch (_) {} this.voices.splice(this.voices.indexOf(q), 1); }
      const src = this.ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = rate || (/^(step|ui|tick|objective|health|siren|bark)/.test(name) ? 1 : 0.94 + Math.random() * 0.12);
      let node = src;
      if (dist > 60) { const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = Math.max(500, 4000 - dist * 20); src.connect(f); node = f; }
      const gn = this.ctx.createGain(); gn.gain.value = g; node.connect(gn);
      let out = gn;
      if (this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = pan; gn.connect(p); out = p; }
      out.connect(this.sfx); src.start();
      this.voices.push({ src, g, end: now + b.duration / src.playbackRate.value });
    }
    loop(name, vol) {
      if (!this.ctx) return;
      let L = this.loops[name];
      if (!L) {
        if (vol <= 0.001) return;
        const b = this.buffer(name); if (!b) return;
        const src = this.ctx.createBufferSource(); src.buffer = b; src.loop = true; const g = this.ctx.createGain(); g.gain.value = 0;
        src.connect(g); g.connect(this.sfx); src.start(); L = this.loops[name] = { src, g };
      }
      L.g.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.4);
    }
    stopLoops() { for (const k in this.loops) { try { this.loops[k].src.stop(); } catch (_) {} } this.loops = {}; }
    note(t, freq, dur, type, vol, cutoff, attack = 0.35) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(1.5, dur * attack)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let n = o; if (cutoff) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; o.connect(f); n = f; }
      n.connect(g); g.connect(this.music); o.start(t); o.stop(t + dur + 0.05);
    }
    drum(t, vol) {
      const c = this.ctx, b = this.buffer('tick'); if (!b) return;
      const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = 0.5; const g = c.createGain(); g.gain.value = vol; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.7;
      s.connect(f); f.connect(g); g.connect(this.music); s.start(t);
    }
    startMusic(theme = 'menu') { if (!this.init()) return; this.musicOn = true; this.theme = theme; this.nextNote = this.ctx.currentTime + 0.3; this.bar = 0; }
    stopMusic() { this.musicOn = false; }
    update(env = {}) {
      if (!this.ctx || this.paused) return;
      this.loop('wind', (env.wind == null ? 0.2 : env.wind) * (env.outdoor === false ? 0.3 : 1));
      this.loop('fire', (env.fire || 0) * 0.5);
      this.loop('water', (env.water || 0) * 0.4);
      this.loop('hum', (env.hum || 0) * 0.35);
      if (this.musicOn) {
        const now = this.ctx.currentTime, th = THEMES[this.theme] || THEMES.game, beat = th.tempo;
        if (this.nextNote < now - 1) this.nextNote = now + 0.2;
        while (this.nextNote < now + 0.6) {
          const t = this.nextNote, ch = th.chords[this.bar % th.chords.length], barLen = beat * 4;
          for (const n of ch) { this.note(t, mtof(n), barLen * 1.05, 'sawtooth', 0.018, 900); this.note(t, mtof(n - 12), barLen * 1.05, 'triangle', 0.02); }
          this.note(t, mtof(ch[0] - 24), barLen, 'triangle', 0.05, 300);
          if (th.melody) for (let i = 0; i < 3; i++) { const m = th.melody[(this.bar * 3 + i) % th.melody.length]; this.note(t + i * beat * 4 / 3, mtof(m), beat * 1.4, 'sawtooth', 0.03, 2200, 0.15); this.note(t + i * beat * 4 / 3, mtof(m - 12), beat * 1.4, 'square', 0.008, 1400, 0.15); }
          if (th.snare) for (let i = 0; i < 8; i++) if (i % 2 === 0 || Math.random() < 0.4) this.drum(t + i * beat / 2, i % 4 === 0 ? 0.5 : 0.25);
          this.nextNote += barLen; this.bar++;
        }
      }
      if (env.ambient !== false) {
        this.ambT -= 1 / 60;
        if (this.ambT <= 0) {
          this.ambT = 18 + Math.random() * 30;
          const L = this.listener, a = Math.random() * TAU, d = 120 + Math.random() * 150;
          const list = ['amb_artillery', 'amb_artillery', 'amb_plane', 'amb_shots'];
          this.play(list[Math.floor(Math.random() * list.length)], L.x + Math.sin(a) * d, L.y + 20, L.z + Math.cos(a) * d, 1.3);
        }
      }
    }
    pause(p) { this.paused = p; if (this.ctx) { if (p) this.ctx.suspend().catch(() => {}); else this.ctx.resume().catch(() => {}); } }
    destroy() { this.musicOn = false; this.stopLoops(); if (this.ctx) { try { this.ctx.close(); } catch (_) {} } this.ctx = null; }
  }

  S.SFX = SFX; S.LOOPS = LOOPS; S.THEMES = THEMES; S.Audio = Audio; S.SR = SR;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Moh98 = globalThis.Moh98 || {});
