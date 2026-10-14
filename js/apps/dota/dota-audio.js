(function (D) {
  'use strict';
  const SR = 22050;
  function rnd(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647 * 2 - 1; }; }
  const tone = (i, f) => Math.sin(i / SR * 2 * Math.PI * f);
  const R = {
    hit(k = 1) { const n = SR * 0.12 | 0, a = new Float32Array(n), r = rnd(3); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += (r() - lp) * 0.3 * k; a[i] = (lp * 0.9 + tone(i, 110 * k) * 0.5) * (1 - t) ** 2; } return a; },
    slash(k = 1) { const n = SR * 0.2 | 0, a = new Float32Array(n), r = rnd(5); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += (r() - lp) * (0.9 - t * 0.7); a[i] = lp * Math.sin(t * Math.PI) * 0.8 * k; } return a; },
    blade(k = 1) { const n = SR * 0.25 | 0, a = new Float32Array(n), r = rnd(6); for (let i = 0; i < n; i++) { const t = i / n; a[i] = (tone(i, 2400 * k) * 0.25 + tone(i, 3700 * k) * 0.15 + r() * 0.15) * Math.exp(-t * 7); } return a; },
    shot(k = 1) { const n = SR * 0.1 | 0, a = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / n, f = (900 - 500 * t) * k; ph += f / SR; a[i] = (ph % 1 < 0.5 ? 0.35 : -0.35) * (1 - t); } return a; },
    gun(k = 1) { const n = SR * 0.2 | 0, a = new Float32Array(n), r = rnd(9); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += (r() - lp) * 0.5; a[i] = (lp * 0.9 + tone(i, 90 * k) * 0.5) * Math.exp(-t * 12); } return a; },
    boom(k = 1) { const n = SR * 1.0 | 0, a = new Float32Array(n), r = rnd(11); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += (r() - lp) * 0.1; a[i] = (lp * 1.8 + tone(i, (55 - 25 * t) * k) * 0.7) * Math.exp(-t * 4.5); } return a; },
    fuse(k = 1) { const n = SR * 0.5 | 0, a = new Float32Array(n), r = rnd(12); for (let i = 0; i < n; i++) { const t = i / n; a[i] = r() * 0.25 * (1 - t) * (0.6 + 0.4 * Math.sin(i / 90 * k)); } return a; },
    beep(k = 1) { const n = SR * 0.3 | 0, a = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / n, on = (t * 6 | 0) % 2 === 0; a[i] = on ? (tone(i, 1600 * k) > 0 ? 0.22 : -0.22) : 0; } return a; },
    magic(k = 1) { const n = SR * 0.4 | 0, a = new Float32Array(n); const notes = [1, 1.25, 1.5, 2]; for (let i = 0; i < n; i++) { const t = i / n, f = 660 * k * notes[Math.min(3, t * 5 | 0)]; a[i] = tone(i, f) * 0.3 * (1 - t) + tone(i, f * 2.01) * 0.1 * (1 - t); } return a; },
    void(k = 1) { const n = SR * 1.2 | 0, a = new Float32Array(n), r = rnd(21); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += (r() - lp) * 0.02; a[i] = (tone(i, 55 * k + Math.sin(t * 20) * 8) * 0.5 + tone(i, 82 * k) * 0.3 + lp * 2) * Math.sin(t * Math.PI); } return a; },
    zap(k = 1) { const n = SR * 0.35 | 0, a = new Float32Array(n), r = rnd(13); let ph = 0; for (let i = 0; i < n; i++) { const t = i / n, f = (1200 + r() * 500) * k * (1 - t * 0.5); ph += f / SR; a[i] = ((ph % 1) * 2 - 1) * 0.3 * (1 - t); } return a; },
    fire(k = 1) { const n = SR * 0.5 | 0, a = new Float32Array(n), r = rnd(17); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += (r() - lp) * 0.25 * k; a[i] = (lp + (r() > 0.97 ? r() * 0.8 : 0)) * Math.sin(t * Math.PI) * 0.9; } return a; },
    ice(k = 1) { const n = SR * 0.55 | 0, a = new Float32Array(n), r = rnd(18); for (let i = 0; i < n; i++) { const t = i / n, f = (2400 - 1400 * t) * k; a[i] = (tone(i, f) * 0.22 + tone(i, f * 1.5) * 0.1 + r() * 0.08 * (1 - t)) * (1 - t); } return a; },
    heal(k = 1) { const n = SR * 0.6 | 0, a = new Float32Array(n); const notes = [1, 1.26, 1.5, 2, 2.52]; for (let i = 0; i < n; i++) { const t = i / n, f = 440 * k * notes[Math.min(4, t * 6 | 0)]; a[i] = tone(i, f) * 0.28 * (1 - t); } return a; },
    buff(k = 1) { const n = SR * 0.45 | 0, a = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / n, f = (300 + 500 * t) * k; ph += f / SR; a[i] = (ph % 1 < 0.5 ? 0.22 : -0.22) * (1 - t) + Math.sin(ph * 6.28 * 1.5) * 0.14 * (1 - t); } return a; },
    thud(k = 1) { const n = SR * 0.35 | 0, a = new Float32Array(n), r = rnd(19); for (let i = 0; i < n; i++) { const t = i / n; a[i] = (tone(i, (90 - 50 * t) * k) * 0.9 + r() * 0.25 * (1 - t)) * Math.exp(-t * 6); } return a; },
    roar(k = 1) { const n = SR * 0.8 | 0, a = new Float32Array(n), r = rnd(23); let ph = 0; for (let i = 0; i < n; i++) { const t = i / n, f = (110 + Math.sin(t * 40) * 15) * k; ph += f / SR; a[i] = (((ph % 1) * 2 - 1) * 0.45 + r() * 0.2) * Math.sin(t * Math.PI); } return a; },
    coin(k = 1) { const n = SR * 0.22 | 0, a = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / n, f = (t < 0.35 ? 988 : 1319) * k; ph += f / SR; a[i] = (ph % 1 < 0.5 ? 0.2 : -0.2) * (1 - t); } return a; },
    chain(k = 1) { const n = SR * 0.4 | 0, a = new Float32Array(n), r = rnd(29); for (let i = 0; i < n; i++) { const t = i / n, c = ((t * 18) | 0) % 2; a[i] = (c ? r() * 0.4 : tone(i, 1800 * k) * 0.2) * (1 - t); } return a; },
    whoosh(k = 1) { const n = SR * 0.35 | 0, a = new Float32Array(n), r = rnd(31); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += (r() - lp) * (0.05 + t * 0.3) * k; a[i] = lp * 2 * Math.sin(t * Math.PI); } return a; },
    horn() { const n = SR * 2.4 | 0, a = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / n, env = Math.min(1, t * 8) * (1 - t) ** 0.6; a[i] = (tone(i, 110) * 0.3 + tone(i, 220) * 0.2 + tone(i, 330) * 0.12 + tone(i, 165) * 0.1) * env * (0.9 + 0.1 * Math.sin(t * 30)); } return a; },
    bell() { const n = SR * 1.4 | 0, a = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / n; a[i] = (tone(i, 523) * 0.3 + tone(i, 1046 * 1.003) * 0.15 + tone(i, 1567) * 0.08) * Math.exp(-t * 4); } return a; },
    click() { const n = SR * 0.03 | 0, a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = tone(i, 1800) * 0.3 * (1 - i / n); return a; },
    level() { const n = SR * 0.8 | 0, a = new Float32Array(n); const notes = [523, 659, 784, 1047]; for (let i = 0; i < n; i++) { const t = i / n, f = notes[Math.min(3, t * 5 | 0)]; a[i] = (tone(i, f) * 0.3 + tone(i, f * 2) * 0.08) * (1 - t * 0.7); } return a; },
    error() { const n = SR * 0.18 | 0, a = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / n; a[i] = (tone(i, 220) > 0 ? 0.18 : -0.18) * (1 - t); } return a; },
    death() { const n = SR * 0.9 | 0, a = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / n, f = 400 - 300 * t; ph += f / SR; a[i] = ((ph % 1) < 0.5 ? 0.22 : -0.22) * (1 - t); } return a; },
    tower() { const n = SR * 0.3 | 0, a = new Float32Array(n), r = rnd(37); let ph = 0; for (let i = 0; i < n; i++) { const t = i / n, f = 1600 - 1300 * t; ph += f / SR; a[i] = (Math.sin(ph * 6.28) * 0.3 + r() * 0.1) * (1 - t); } return a; },
    tp() { const n = SR * 1.5 | 0, a = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / n, f = 300 + 700 * t; a[i] = (tone(i, f) * 0.14 + tone(i, f * 1.5) * 0.07) * Math.sin(t * Math.PI); } return a; }
  };
  const MAP = {
    shot_techies: ['thud', 1.6, 0.5], shot_crystal_maiden: ['ice', 1.6, 0.35], shot_sniper: ['gun', 1, 0.55], shot_lina: ['fire', 1.5, 0.35], shot_lion: ['zap', 1.4, 0.3],
    shot_small: ['shot', 0.8, 0.18], tower_shot: ['tower', 1, 0.5], hit_small: ['hit', 1.4, 0.3],
    hit_sven: ['blade', 0.8, 0.6], hit_axe: ['slash', 0.8, 0.7], hit_juggernaut: ['blade', 1.1, 0.55], hit_pudge: ['hit', 0.7, 0.8], hit_enigma: ['void', 2.2, 0.4],
    hit_melee: ['hit', 1, 0.6], hit_techies: ['hit', 1.4, 0.4], hit_crystal_maiden: ['hit', 1.3, 0.3], hit_sniper: ['hit', 1.2, 0.4], hit_lina: ['hit', 1.3, 0.3], hit_lion: ['hit', 1.3, 0.3],
    stasis: ['ice', 0.45, 0.9], suicide: ['boom', 0.6, 1], remote_plant: ['beep', 0.7, 0.4], detonate: ['beep', 1.6, 0.6],
    mine_plant: ['thud', 1.5, 0.5], mine_beep: ['beep', 1, 0.7], mine_boom: ['boom', 0.8, 1],
    malefice: ['void', 1.8, 0.6], conversion: ['magic', 0.6, 0.7], pulse: ['void', 1.2, 0.8], black_hole: ['void', 0.8, 1],
    hammer: ['whoosh', 1.2, 0.6], hammer_hit: ['thud', 0.9, 0.9], warcry: ['roar', 1.2, 0.8], gods_strength: ['roar', 0.8, 1],
    nova: ['ice', 1, 0.8], frostbite: ['ice', 0.7, 0.8], freezing_field: ['ice', 0.5, 0.9],
    shrapnel: ['gun', 0.7, 0.8], aim: ['beep', 0.6, 0.5], assassinate: ['gun', 0.6, 1], assassinate_hit: ['thud', 1.2, 0.8],
    berserkers_call: ['roar', 1, 1], battle_hunger: ['roar', 1.6, 0.6], helix: ['slash', 0.6, 0.8], culling: ['slash', 0.5, 0.9], culling_kill: ['thud', 0.6, 1],
    dragon_slave: ['fire', 0.8, 0.9], lsa: ['fire', 0.6, 1], laguna: ['zap', 0.5, 1],
    blade_fury: ['blade', 0.6, 0.8], healing_ward: ['heal', 1, 0.6], omnislash: ['blade', 1.3, 0.8],
    hook: ['chain', 1, 0.8], hook_hit: ['thud', 1, 0.9], rot: ['fire', 0.4, 0.5], rot_off: ['click', 1, 0.3], dismember: ['roar', 0.6, 0.9],
    earth_spike: ['thud', 0.7, 0.9], hex: ['magic', 1.8, 0.7], mana_drain: ['zap', 0.4, 0.6], finger: ['zap', 0.3, 1],
    buy: ['coin', 1, 0.6], sell: ['coin', 0.8, 0.6], gold: ['coin', 1.3, 0.3], potion: ['heal', 1.4, 0.5], eat: ['thud', 1.8, 0.4], wand: ['heal', 1.1, 0.5], soul_ring: ['void', 2, 0.5],
    phase: ['whoosh', 1.6, 0.4], arcane: ['magic', 1, 0.6], heal: ['heal', 1, 0.7], midas: ['coin', 0.7, 0.8], force: ['whoosh', 1, 0.7], glimmer: ['magic', 2, 0.5], euls: ['whoosh', 0.8, 0.8],
    dagon: ['zap', 0.8, 0.9], bash: ['thud', 1.1, 0.8], blink: ['magic', 2.4, 0.6], bkb: ['buff', 0.7, 0.8], blade_mail: ['blade', 0.7, 0.6], invis: ['whoosh', 2, 0.5], madness: ['roar', 1.8, 0.6],
    manta: ['magic', 1.3, 0.7], refresher: ['magic', 0.9, 0.8], dust: ['whoosh', 1.3, 0.5], ward: ['click', 1, 0.6], chop: ['hit', 0.9, 0.6], tp: ['tp', 1, 0.6], tp_end: ['magic', 1.6, 0.6],
    chain: ['chain', 1.5, 0.6], rune: ['bell', 1, 0.6], glyph: ['bell', 0.7, 0.8], respawn: ['heal', 0.8, 0.7], pickup: ['click', 1, 0.6], deliver: ['coin', 1.5, 0.5], slam: ['thud', 0.5, 1],
    hero_die: ['death', 1, 0.8], building_die: ['boom', 0.5, 1], creep_die: ['hit', 1.8, 0.25], levelup: ['level', 1, 0.7], learn: ['click', 1.2, 0.6], horn: ['horn', 1, 1],
    click: ['click', 1, 0.5], error: ['error', 1, 0.5], announce: ['bell', 1.2, 0.5], victory: ['level', 0.7, 1],
    chest_rattle: ['chain', 0.6, 0.55], chest_open: ['bell', 0.8, 0.9], equip: ['blade', 1.4, 0.45]
  };

  class Audio {
    constructor() { this.ctx = null; this.cache = {}; this.sfxVol = 0.8; this.musicVol = 0.5; this.cam = null; this.tune = null; this.voice = true; this.lang = 'ru'; this.speakQ = 0; this.recent = {}; }
    ensure() {
      if (this.ctx) return true;
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return false;
      try { this.ctx = new AC(); } catch (_) { return false; }
      this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain(); this.sfx.connect(this.master);
      this.music = this.ctx.createGain(); this.music.connect(this.master);
      this.applyVolume(); this.volT = setInterval(() => this.applyVolume(), 1000);
      return true;
    }
    resume() { if (this.ensure() && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }
    applyVolume() {
      if (!this.ctx) return;
      this.master.gain.value = 1; this.sfx.gain.value = this.sfxVol; this.music.gain.value = this.musicVol * 0.5;
    }
    buf(name) {
      if (this.cache[name]) return this.cache[name];
      const m = MAP[name] || (name.startsWith('shot_') ? ['shot', 1] : name.startsWith('hit_') ? ['hit', 1] : ['click', 1]);
      const data = R[m[0]](m[1]); const b = this.ctx.createBuffer(1, data.length, SR); b.getChannelData(0).set(data);
      this.cache[name] = { b, vol: m[2] || 0.8 };
      return this.cache[name];
    }
    play(name, x, y, o = {}) {
      if (!this.ctx || this.ctx.state !== 'running' || !this.sfxVol) return;
      const now = this.ctx.currentTime; if (this.recent[name] && now - this.recent[name] < 0.04) return; this.recent[name] = now;
      let vol = 1, pan = 0;
      if (x != null && this.cam && !o.global) {
        const dx = x - this.cam.x, dy = y - this.cam.y, d = Math.hypot(dx, dy);
        if (d > 2800) return;
        vol = Math.max(0, 1 - d / 2800); pan = Math.max(-1, Math.min(1, (dx + dy) / 2400));
      }
      const B = this.buf(name), src = this.ctx.createBufferSource(); src.buffer = B.b;
      src.playbackRate.value = o.rate || (0.94 + Math.random() * 0.12);
      const gn = this.ctx.createGain(); gn.gain.value = vol * B.vol * (o.vol || 1);
      let node = gn;
      if (this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = pan; gn.connect(p); node = p; }
      src.connect(gn); node.connect(this.sfx); src.start();
    }
    speak(text) {
      if (!this.voice || !globalThis.speechSynthesis || !globalThis.SpeechSynthesisUtterance) return false;
      try {
        const s = globalThis.speechSynthesis; if (s.pending || s.speaking) { if (++this.speakQ > 2) { s.cancel(); this.speakQ = 0; } }
        const u = new SpeechSynthesisUtterance(text); u.lang = this.lang === 'ru' ? 'ru-RU' : 'en-US'; u.rate = 0.95; u.pitch = 0.6;
        u.volume = Math.min(1, this.sfxVol * 1.2);
        s.speak(u); return true;
      } catch (_) { return false; }
    }
    playTune(id) {
      if (this.tune === id) return; this.stopTune(); this.tune = id;
      if (!this.ensure()) return;
      const T = TUNES[id]; if (!T) return;
      this.step = 0; this.nextT = this.ctx.currentTime + 0.1;
      this.seq = setInterval(() => {
        if (!this.ctx || this.ctx.state !== 'running') return;
        const spb = 60 / T.bpm / 4;
        while (this.nextT < this.ctx.currentTime + 0.25) { this.playStep(T, this.step, this.nextT, spb); this.step = (this.step + 1) % T.len; if (T.once && this.step === 0) { this.stopTune(); return; } this.nextT += spb; }
      }, 60);
    }
    stopTune() { if (this.seq) clearInterval(this.seq); this.seq = null; this.tune = null; }
    playStep(T, step, t, spb) {
      for (const tr of T.tracks) {
        const note = tr.notes[step % tr.notes.length]; if (note == null || note === '.') continue;
        if (tr.type === 'drum') { this.drum(note, t); continue; }
        const f = 440 * Math.pow(2, (note - 69) / 12), o = this.ctx.createOscillator(), gn = this.ctx.createGain();
        o.type = tr.type; o.frequency.value = f; const dur = spb * (tr.len || 1);
        gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(tr.vol, t + 0.015); gn.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95);
        o.connect(gn); gn.connect(this.music); o.start(t); o.stop(t + dur);
      }
    }
    drum(k, t) {
      const len = k === 'k' ? 0.22 : k === 's' ? 0.15 : 0.05;
      if (!this.noiseB) { const b = this.ctx.createBuffer(1, SR * 0.3 | 0, SR), d = b.getChannelData(0); const r = rnd(41); for (let i = 0; i < d.length; i++) d[i] = r(); this.noiseB = b; }
      const gn = this.ctx.createGain();
      if (k === 'k' || k === 'T') { const o = this.ctx.createOscillator(); o.frequency.setValueAtTime(k === 'T' ? 90 : 120, t); o.frequency.exponentialRampToValueAtTime(k === 'T' ? 50 : 40, t + 0.18); gn.gain.setValueAtTime(k === 'T' ? 0.45 : 0.5, t); gn.gain.exponentialRampToValueAtTime(0.001, t + (k === 'T' ? 0.4 : len)); o.connect(gn); gn.connect(this.music); o.start(t); o.stop(t + 0.45); return; }
      const n = this.ctx.createBufferSource(); n.buffer = this.noiseB; const f = this.ctx.createBiquadFilter(); f.type = k === 's' ? 'bandpass' : 'highpass'; f.frequency.value = k === 's' ? 1800 : 7000;
      gn.gain.setValueAtTime(k === 's' ? 0.28 : 0.1, t); gn.gain.exponentialRampToValueAtTime(0.001, t + len);
      n.connect(f); f.connect(gn); gn.connect(this.music); n.start(t); n.stop(t + len);
    }
    destroy() { this.stopTune(); if (this.volT) clearInterval(this.volT); try { globalThis.speechSynthesis && globalThis.speechSynthesis.cancel(); } catch (_) {} if (this.ctx) this.ctx.close().catch(() => {}); this.ctx = null; }
  }
  const seq = (s) => s.trim().split(/\s+/).map(x => x === '.' ? '.' : isNaN(+x) ? x : +x);
  const TUNES = {
    menu: { bpm: 84, len: 64, tracks: [
      { type: 'sawtooth', vol: 0.045, len: 3, notes: seq('57 . . 60 . . 64 . 62 . . 60 . . 59 . 57 . . 55 . . 57 . 52 . . . . . . . 57 . . 60 . . 64 . 67 . . 65 . . 64 . 62 . . 64 . . 60 . 57 . . . . . . .') },
      { type: 'triangle', vol: 0.16, len: 4, notes: seq('33 . . . 33 . . . 41 . . . 41 . . . 36 . . . 36 . . . 40 . . . 40 . . . 33 . . . 33 . . . 38 . . . 38 . . . 41 . . . 40 . . . 33 . . . 33 . . .') },
      { type: 'square', vol: 0.03, len: 8, notes: seq('69 . . . . . . . 72 . . . . . . . 71 . . . . . . . 68 . . . . . . . 69 . . . . . . . 74 . . . . . . . 72 . . . . . . . 69 . . . . . . .') },
      { type: 'drum', notes: seq('T . . . h . . . s . . . h . T . T . . . h . . . s . . . h . . . T . . . h . . . s . . . h . T . T . T . h . . . s . s . h h h h') }
    ] },
    game: { bpm: 70, len: 64, tracks: [
      { type: 'triangle', vol: 0.11, len: 8, notes: seq('45 . . . . . . . 43 . . . . . . . 41 . . . . . . . 40 . . . . . . . 45 . . . . . . . 48 . . . . . . . 47 . . . . . . . 44 . . . . . . .') },
      { type: 'sine', vol: 0.045, len: 3, notes: seq('69 . . . 72 . . . 76 . . 74 . . 72 . 71 . . . . . . . 69 . . . . . . . . . . . 76 . . . 79 . . 77 . . 76 . 74 . . . 72 . . . 71 . . . . . . .') },
      { type: 'drum', notes: seq('T . . . . . . . h . . . . . . . T . . . . . T . h . . . . . . . T . . . . . . . h . . . . . . . T . . . . . T . h . . . s . . .') }
    ] },
    victory: { bpm: 110, len: 32, once: true, tracks: [
      { type: 'square', vol: 0.07, len: 2, notes: seq('60 . 64 . 67 . 72 . . . 71 . 72 . . . 74 . 72 . 71 . 67 . 72 . . . . . . .') },
      { type: 'triangle', vol: 0.16, len: 4, notes: seq('36 . . . 36 . . . 41 . . . 43 . . . 36 . . . 43 . . . 36 . . . . . . .') },
      { type: 'drum', notes: seq('k . s . k . s . k k s . k . s s k . s . k . s . T . . . T . . .') }
    ] }
  };
  D.Audio = Audio; D.SFX_MAP = MAP; D.SFX_RECIPES = R;
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Dota98 = globalThis.Dota98 || {});
