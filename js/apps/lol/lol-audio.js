(function (L) {
  'use strict';
  const SR = 22050;
  function rnd(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647 * 2 - 1; }; }
  const R = {
    hit(k = 1) { const n = SR * 0.12 | 0, a = new Float32Array(n), r = rnd(3); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += (r() - lp) * 0.3 * k; a[i] = (lp * 0.9 + Math.sin(i / SR * 2 * Math.PI * 110 * k) * 0.5) * (1 - t) ** 2; } return a; },
    slash(k = 1) { const n = SR * 0.18 | 0, a = new Float32Array(n), r = rnd(5); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += (r() - lp) * (0.9 - t * 0.7); a[i] = lp * Math.sin(t * Math.PI) * 0.8 * k; } return a; },
    shot(k = 1) { const n = SR * 0.1 | 0, a = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / n, f = (900 - 500 * t) * k; ph += f / SR; a[i] = (ph % 1 < 0.5 ? 0.4 : -0.4) * (1 - t); } return a; },
    gun(k = 1) { const n = SR * 0.07 | 0, a = new Float32Array(n), r = rnd(9); for (let i = 0; i < n; i++) { const t = i / n; a[i] = (r() * 0.7 + Math.sin(i / SR * 6.28 * 180 * k) * 0.4) * (1 - t) ** 3; } return a; },
    boom(k = 1) { const n = SR * 0.9 | 0, a = new Float32Array(n), r = rnd(11); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += (r() - lp) * 0.12; a[i] = (lp * 1.6 + Math.sin(i / SR * 6.28 * (60 - 30 * t) * k) * 0.6) * Math.exp(-t * 5); } return a; },
    magic(k = 1) { const n = SR * 0.4 | 0, a = new Float32Array(n); const notes = [1, 1.25, 1.5, 2]; for (let i = 0; i < n; i++) { const t = i / n, f = 660 * k * notes[Math.min(3, t * 5 | 0)]; a[i] = Math.sin(i / SR * 6.28 * f) * 0.35 * (1 - t) + Math.sin(i / SR * 6.28 * f * 2.01) * 0.1 * (1 - t); } return a; },
    zap(k = 1) { const n = SR * 0.35 | 0, a = new Float32Array(n), r = rnd(13); let ph = 0; for (let i = 0; i < n; i++) { const t = i / n, f = (1200 + r() * 400) * k * (1 - t * 0.5); ph += f / SR; a[i] = ((ph % 1) * 2 - 1) * 0.35 * (1 - t); } return a; },
    fire(k = 1) { const n = SR * 0.45 | 0, a = new Float32Array(n), r = rnd(17); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += (r() - lp) * 0.25 * k; a[i] = (lp + (r() > 0.97 ? r() : 0)) * Math.sin(t * Math.PI) * 0.9; } return a; },
    ice(k = 1) { const n = SR * 0.5 | 0, a = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / n, f = (2400 - 1400 * t) * k; a[i] = (Math.sin(i / SR * 6.28 * f) * 0.25 + Math.sin(i / SR * 6.28 * f * 1.5) * 0.12) * (1 - t); } return a; },
    heal(k = 1) { const n = SR * 0.6 | 0, a = new Float32Array(n); const notes = [1, 1.26, 1.5, 2, 2.52]; for (let i = 0; i < n; i++) { const t = i / n, f = 440 * k * notes[Math.min(4, t * 6 | 0)]; a[i] = Math.sin(i / SR * 6.28 * f) * 0.3 * (1 - t); } return a; },
    buff(k = 1) { const n = SR * 0.4 | 0, a = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / n, f = (300 + 500 * t) * k; ph += f / SR; a[i] = (ph % 1 < 0.5 ? 0.25 : -0.25) * (1 - t) + Math.sin(ph * 6.28 * 1.5) * 0.15 * (1 - t); } return a; },
    thud(k = 1) { const n = SR * 0.35 | 0, a = new Float32Array(n), r = rnd(19); for (let i = 0; i < n; i++) { const t = i / n; a[i] = (Math.sin(i / SR * 6.28 * (90 - 50 * t) * k) * 0.9 + r() * 0.25 * (1 - t)) * Math.exp(-t * 6); } return a; },
    roar(k = 1) { const n = SR * 0.7 | 0, a = new Float32Array(n), r = rnd(23); let ph = 0; for (let i = 0; i < n; i++) { const t = i / n, f = (110 + Math.sin(t * 40) * 15) * k; ph += f / SR; a[i] = (((ph % 1) * 2 - 1) * 0.5 + r() * 0.2) * Math.sin(t * Math.PI); } return a; },
    coin(k = 1) { const n = SR * 0.22 | 0, a = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / n, f = (t < 0.35 ? 988 : 1319) * k; ph += f / SR; a[i] = (ph % 1 < 0.5 ? 0.22 : -0.22) * (1 - t); } return a; },
    click() { const n = SR * 0.03 | 0, a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = Math.sin(i / SR * 6.28 * 1800) * 0.3 * (1 - i / n); return a; },
    level() { const n = SR * 0.7 | 0, a = new Float32Array(n); const notes = [523, 659, 784, 1047]; for (let i = 0; i < n; i++) { const t = i / n, f = notes[Math.min(3, t * 5 | 0)]; a[i] = (Math.sin(i / SR * 6.28 * f) * 0.3 + Math.sin(i / SR * 6.28 * f * 2) * 0.08) * (1 - t * 0.7); } return a; },
    warning() { const n = SR * 0.4 | 0, a = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / n, f = t < 0.5 ? 880 : 660; a[i] = (Math.sin(i / SR * 6.28 * f) > 0 ? 0.2 : -0.2) * (1 - t * 0.5); } return a; },
    recall() { const n = SR * 1.2 | 0, a = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / n, f = 300 + 900 * t; a[i] = Math.sin(i / SR * 6.28 * f) * 0.18 * Math.sin(t * Math.PI) + Math.sin(i / SR * 6.28 * f * 1.5) * 0.08 * Math.sin(t * Math.PI); } return a; },
    death() { const n = SR * 0.8 | 0, a = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / n, f = 400 - 300 * t; ph += f / SR; a[i] = ((ph % 1) < 0.5 ? 0.25 : -0.25) * (1 - t); } return a; },
    tower() { const n = SR * 0.3 | 0, a = new Float32Array(n), r = rnd(29); let ph = 0; for (let i = 0; i < n; i++) { const t = i / n, f = 1600 - 1300 * t; ph += f / SR; a[i] = (Math.sin(ph * 6.28) * 0.35 + r() * 0.1) * (1 - t); } return a; },
    whoosh(k = 1) { const n = SR * 0.3 | 0, a = new Float32Array(n), r = rnd(31); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += (r() - lp) * (0.05 + t * 0.3) * k; a[i] = lp * 2 * Math.sin(t * Math.PI); } return a; }
  };
  const MAP = {
    shot_lulu: ['magic', 1.6, 0.35], shot_jinx: ['gun', 1, 0.5], shot_annie: ['fire', 1.4, 0.35], shot_ashe: ['whoosh', 1.4, 0.5], shot_teemo: ['shot', 1.5, 0.35], shot_ryze: ['magic', 1.1, 0.35],
    hit_melee: ['hit', 1, 0.7], hit_small: ['hit', 1.4, 0.35], shot_small: ['shot', 0.8, 0.2], tower_shot: ['tower', 1, 0.6],
    lulu_q: ['magic', 1.2], lulu_w: ['magic', 1.5], lulu_e: ['magic', 1.8], lulu_r: ['buff', 0.8],
    jinx_q: ['click', 1], jinx_w: ['zap', 1], jinx_e: ['thud', 1.4], jinx_r_charge: ['buff', 0.7], jinx_r: ['whoosh', 0.6], jinx_excited: ['buff', 1.4],
    garen_q: ['buff', 1.2], garen_q_hit: ['hit', 0.8, 1], garen_w: ['buff', 0.8], garen_spin: ['slash', 1, 0.6], garen_r: ['thud', 0.7, 1],
    annie_q: ['fire', 1.2], annie_w: ['fire', 0.8], annie_e: ['fire', 1.6], annie_r: ['roar', 0.8, 1], annie_ready: ['buff', 1.8],
    ashe_q: ['ice', 1.3], ashe_w: ['whoosh', 1.2], ashe_e: ['whoosh', 0.8], ashe_r: ['ice', 0.7], ashe_r_hit: ['ice', 0.5, 1],
    yi_q: ['slash', 1.3], yi_w: ['heal', 0.8], yi_e: ['buff', 1.5], yi_r: ['buff', 1],
    malph_q: ['thud', 1.2], malph_w: ['thud', 1.6], malph_e: ['thud', 0.6, 1], malph_charge: ['roar', 0.6], malph_r: ['boom', 0.8, 1],
    teemo_q: ['shot', 2], teemo_w: ['buff', 1.8], teemo_r: ['click', 1], shroom: ['whoosh', 0.6],
    ryze_q: ['magic', 0.9], ryze_w: ['zap', 0.7], ryze_e: ['magic', 0.7], ryze_r: ['buff', 0.6],
    ali_q: ['thud', 0.8, 1], ali_w: ['hit', 0.6, 1], ali_e: ['roar', 1.2], ali_r: ['roar', 0.8],
    explode: ['boom', 1.3], explode_big: ['boom', 0.8, 1], boom: ['boom', 1],
    spell_flash: ['magic', 2.2], spell_heal: ['heal', 1], spell_ignite: ['fire', 1], spell_ghost: ['whoosh', 1.5], spell_exhaust: ['whoosh', 0.7], spell_barrier: ['buff', 1.1], spell_smite: ['zap', 0.5],
    buy: ['coin', 1, 0.6], sell: ['coin', 0.8, 0.6], gold: ['coin', 1.3, 0.35], potion: ['heal', 1.4, 0.5], ward: ['click', 1], ward_die: ['hit', 1.8, 0.4], recall: ['recall', 1, 0.6],
    minion_die: ['hit', 1.6, 0.3], monster_die: ['roar', 1.4, 0.5], boss_die: ['roar', 0.6, 1], champ_die: ['death', 1, 0.8], tower_die: ['boom', 0.6, 1], nexus_die: ['boom', 0.4, 1],
    buff: ['buff', 1], stasis: ['ice', 1.6], spellshield: ['magic', 2.5], revive: ['heal', 0.8], levelup: ['level', 1, 0.7], warning: ['warning', 1, 0.6], click: ['click', 1, 0.5], announce: ['level', 0.8, 0.5],
    chest_shake: ['thud', 1.9, 0.6], chest_open: ['magic', 0.8, 0.9], skin_reveal: ['level', 1, 0.8]
  };

  class Audio {
    constructor() { this.ctx = null; this.cache = {}; this.sfxVol = 0.8; this.musicVol = 0.5; this.cam = null; this.tune = null; this.voice = true; this.lang = 'ru'; this.speakQ = 0; }
    ensure() {
      if (this.ctx) return true;
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return false;
      try { this.ctx = new AC(); } catch (_) { return false; }
      this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain(); this.sfx.connect(this.master);
      this.music = this.ctx.createGain(); this.music.connect(this.master);
      this.applyVolume();
      this.volT = setInterval(() => this.applyVolume(), 1000);
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
      let vol = 1, pan = 0;
      if (x != null && this.cam && !o.global) {
        const dx = x - this.cam.x, dy = y - this.cam.y, d = Math.hypot(dx, dy);
        if (d > 2600) return;
        vol = Math.max(0, 1 - d / 2600); pan = Math.max(-1, Math.min(1, dx / 1800));
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
        const u = new SpeechSynthesisUtterance(text); u.lang = this.lang === 'ru' ? 'ru-RU' : 'en-US'; u.rate = 1.05; u.pitch = 0.75;
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
        while (this.nextT < this.ctx.currentTime + 0.25) { this.playStep(T, this.step, this.nextT, spb); this.step = (this.step + 1) % T.len; this.nextT += spb; }
      }, 60);
    }
    stopTune() { if (this.seq) clearInterval(this.seq); this.seq = null; this.tune = null; }
    playStep(T, step, t, spb) {
      for (const tr of T.tracks) {
        const note = tr.notes[step % tr.notes.length]; if (note == null || note === '.') continue;
        if (tr.type === 'drum') { this.drum(note, t); continue; }
        const f = 440 * Math.pow(2, (note - 69) / 12), o = this.ctx.createOscillator(), gn = this.ctx.createGain();
        o.type = tr.type; o.frequency.value = f; const dur = spb * (tr.len || 1);
        gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(tr.vol, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95);
        o.connect(gn); gn.connect(this.music); o.start(t); o.stop(t + dur);
      }
    }
    drum(k, t) {
      const n = this.ctx.createBufferSource(), len = k === 'k' ? 0.2 : k === 's' ? 0.15 : 0.05;
      if (!this.noiseB) { const b = this.ctx.createBuffer(1, SR * 0.3 | 0, SR), d = b.getChannelData(0); const r = rnd(41); for (let i = 0; i < d.length; i++) d[i] = r(); this.noiseB = b; }
      const gn = this.ctx.createGain();
      if (k === 'k') { const o = this.ctx.createOscillator(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15); gn.gain.setValueAtTime(0.5, t); gn.gain.exponentialRampToValueAtTime(0.001, t + len); o.connect(gn); gn.connect(this.music); o.start(t); o.stop(t + len); return; }
      n.buffer = this.noiseB; const f = this.ctx.createBiquadFilter(); f.type = k === 's' ? 'bandpass' : 'highpass'; f.frequency.value = k === 's' ? 1800 : 7000;
      gn.gain.setValueAtTime(k === 's' ? 0.3 : 0.12, t); gn.gain.exponentialRampToValueAtTime(0.001, t + len);
      n.connect(f); f.connect(gn); gn.connect(this.music); n.start(t); n.stop(t + len);
    }
    destroy() { this.stopTune(); if (this.volT) clearInterval(this.volT); try { globalThis.speechSynthesis && globalThis.speechSynthesis.cancel(); } catch (_) {} if (this.ctx) this.ctx.close().catch(() => {}); this.ctx = null; }
  }
  const seq = (s) => s.trim().split(/\s+/).map(x => x === '.' ? '.' : isNaN(+x) ? x : +x);
  const TUNES = {
    menu: { bpm: 92, len: 64, tracks: [
      { type: 'square', vol: 0.07, len: 2, notes: seq('62 . 65 . 69 . 67 65 64 . 62 . 60 . 62 . 65 . 69 . 72 . 70 69 67 . 69 . . . 62 . 65 . 69 . 67 65 64 . 67 . 65 . 64 . 62 . 60 . 64 . 67 . 65 64 62 . . . . .') },
      { type: 'triangle', vol: 0.16, len: 4, notes: seq('38 . . . 38 . . . 46 . . . 46 . . . 41 . . . 41 . . . 45 . . . 45 . . . 38 . . . 38 . . . 43 . . . 43 . . . 45 . . . 45 . . . 38 . . . 38 . . .') },
      { type: 'sine', vol: 0.05, len: 8, notes: seq('50 . . . . . . . 53 . . . . . . . 53 . . . . . . . 52 . . . . . . . 50 . . . . . . . 55 . . . . . . . 52 . . . . . . . 50 . . . . . . .') },
      { type: 'drum', notes: seq('k . h . s . h . k . k h s . h . k . h . s . h . k . k h s . h h k . h . s . h . k . k h s . h . k . h . s . h . k k . h s s s s') }
    ] },
    game: { bpm: 76, len: 64, tracks: [
      { type: 'triangle', vol: 0.12, len: 6, notes: seq('45 . . . . . . . 43 . . . . . . . 41 . . . . . . . 40 . . . . . . . 45 . . . . . . . 48 . . . . . . . 43 . . . . . . . 40 . . . . . . .') },
      { type: 'sine', vol: 0.05, len: 3, notes: seq('69 . . 72 . . 76 . 74 . . 72 . . 71 . 69 . . 67 . . 65 . 64 . . . . . . . 69 . . 72 . . 76 . 79 . . 77 . . 76 . 74 . . 72 . . 71 . 69 . . . . . . .') },
      { type: 'drum', notes: seq('k . . . h . . . . . k . h . . . k . . . h . . . . . k . h . h . k . . . h . . . . . k . h . . . k . . . h . . . s . k . h . . .') }
    ] }
  };
  L.Audio = Audio; L.SFX_MAP = MAP; L.SFX_RECIPES = R;
  if (typeof module !== 'undefined') module.exports = L;
})(globalThis.LoL98 = globalThis.LoL98 || {});
