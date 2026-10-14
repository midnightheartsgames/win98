(function (C) {
  'use strict';
  const SR = 22050;

  function rnd(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296) * 2 - 1; }; }

  function gen(dur, fn) {
    const n = Math.max(1, Math.floor(dur * SR)), out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = fn(i / SR, i);
    return out;
  }
  function lowpass(buf, cut) { const a = Math.exp(-2 * Math.PI * cut / SR); let y = 0; for (let i = 0; i < buf.length; i++) { y = buf[i] * (1 - a) + y * a; buf[i] = y; } return buf; }
  function highpass(buf, cut) { const a = Math.exp(-2 * Math.PI * cut / SR); let y = 0, px = 0; for (let i = 0; i < buf.length; i++) { const x = buf[i]; y = a * (y + x - px); px = x; buf[i] = y; } return buf; }
  function norm(buf, peak = 0.9) { let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v)); if (m > 0) for (let i = 0; i < buf.length; i++) buf[i] *= peak / m; return buf; }
  function mix(...bufs) { const n = Math.max(...bufs.map(b => b.length)), out = new Float32Array(n); for (const b of bufs) for (let i = 0; i < b.length; i++) out[i] += b[i]; return out; }

  function gunshot(seed, body, crack, tail, bass = 0.6) {
    const r = rnd(seed);
    const a = lowpass(gen(tail, t => r() * Math.exp(-t * (10 / tail))), body);
    const b = highpass(gen(0.05, t => r() * Math.exp(-t * 90)), 1500);
    const c = gen(0.18, t => Math.sin(t * 2 * Math.PI * (90 - t * 200)) * Math.exp(-t * 18) * bass);
    for (let i = 0; i < b.length; i++) b[i] *= crack;
    return norm(mix(a, b, c));
  }
  function click(seed, freq, dur = 0.03, amp = 1) { const r = rnd(seed); return norm(highpass(gen(dur, t => (r() * 0.6 + Math.sin(t * freq * 6.28) * 0.6) * Math.exp(-t * 180)), 800), 0.7 * amp); }
  function seq(parts) { const total = Math.max(...parts.map(([t, b]) => t + b.length / SR)); const out = new Float32Array(Math.ceil(total * SR)); for (const [t, b, v = 1] of parts) { const o = Math.floor(t * SR); for (let i = 0; i < b.length && o + i < out.length; i++) out[o + i] += b[i] * v; } return out; }
  function step(seed, cut, dur = 0.12, amp = 0.6) { const r = rnd(seed); return norm(lowpass(gen(dur, t => r() * Math.exp(-t * 40)), cut), amp); }
  function tone(freq, dur, type = 'sin', decay = 8, amp = 0.5) { return gen(dur, t => { const ph = t * freq; const w = type === 'sq' ? (ph % 1 < 0.5 ? 1 : -1) : type === 'saw' ? (ph % 1) * 2 - 1 : Math.sin(ph * 6.2832); return w * Math.exp(-t * decay) * amp; }); }
  function growl(seed, base, dur, rough = 0.6) { const r = rnd(seed); return norm(lowpass(gen(dur, t => { const env = Math.sin(Math.min(1, t / dur) * Math.PI); return (Math.sin(t * 6.28 * (base + Math.sin(t * 23) * base * 0.2)) * (1 - rough) + r() * rough) * env; }), base * 6)); }
  function pluck(freq, dur) {
    const n = Math.floor(SR / freq), buf = new Float32Array(n), r = rnd(Math.floor(freq * 13));
    for (let i = 0; i < n; i++) buf[i] = r();
    let idx = 0;
    return gen(dur, () => { const v = buf[idx], nx = buf[(idx + 1) % n]; buf[idx] = (v + nx) * 0.4985; idx = (idx + 1) % n; return v * 0.6; });
  }

  function buildLibrary() {
    const L = {};
    L.shot_pistol = gunshot(11, 2400, 0.8, 0.35, 0.4);
    L.shot_rifle = gunshot(12, 1900, 1.0, 0.55, 0.6);
    L.shot_ak = gunshot(13, 1600, 1.0, 0.6, 0.7);
    L.shot_shotgun = gunshot(14, 1100, 0.9, 0.8, 1.0);
    L.shot_sniper = gunshot(15, 1400, 1.2, 1.2, 0.9);
    L.shot_silenced = norm(mix(lowpass(gen(0.12, t => rnd(16)() * Math.exp(-t * 50)), 900), click(17, 1200, 0.03, 0.5)), 0.5);
    L.dryfire = click(18, 2000, 0.02, 0.6);
    L.jam = seq([[0, click(19, 900, 0.05)], [0.08, click(20, 600, 0.05)]]);
    L.unjam = seq([[0, click(21, 1000)], [0.25, click(22, 1300)], [0.5, click(23, 800)]]);
    L.reload_pistol = seq([[0, click(24, 1100)], [0.5, click(25, 900)], [1.2, click(26, 1500)]]);
    L.reload_rifle = seq([[0, click(27, 700)], [0.7, step(28, 1200, 0.08, 0.5)], [1.4, click(29, 1100)], [2.0, click(30, 1600)]]);
    L.reload_shotgun = seq([[0, click(31, 600)], [0.5, click(32, 900)], [1.0, click(33, 600)], [1.5, click(34, 900)], [2.2, click(35, 1400)]]);
    L.equip = seq([[0, click(36, 700, 0.05, 0.6)], [0.12, click(37, 1200, 0.04, 0.5)]]);
    L.click = click(38, 1800, 0.02, 0.5);
    L.knife = norm(highpass(gen(0.25, t => rnd(39)() * Math.sin(t * 12) * Math.exp(-t * 10)), 2500), 0.6);
    L.throw = norm(highpass(gen(0.2, t => rnd(40)() * Math.sin(t * 15)), 1500), 0.4);
    L.pin = seq([[0, tone(2600, 0.15, 'sin', 20, 0.4)], [0.1, click(41, 1500)]]);
    L.bolt = seq([[0, tone(1800, 0.2, 'sin', 25, 0.4)], [0.02, click(42, 2400)]]);
    L.grenade_bounce = click(43, 500, 0.06, 0.8);
    L.explosion = norm(mix(lowpass(gen(1.8, t => rnd(44)() * Math.exp(-t * 2.5)), 600), gen(0.8, t => Math.sin(t * 6.28 * (55 - t * 30)) * Math.exp(-t * 4))));
    L.splash = norm(lowpass(highpass(gen(0.4, t => rnd(45)() * Math.exp(-t * 8)), 400), 3000), 0.6);
    L.impact = step(46, 3000, 0.05, 0.4);
    L.ric = norm(gen(0.3, t => Math.sin(t * 6.28 * (3000 - t * 5000)) * Math.exp(-t * 12) * 0.5 + rnd(47)() * Math.exp(-t * 60) * 0.3), 0.5);
    L.step_grass = step(48, 1800, 0.12, 0.4);
    L.step_dirt = step(49, 1200, 0.1, 0.45);
    L.step_concrete = norm(mix(step(50, 3500, 0.06, 0.5), click(51, 400, 0.02, 0.3)), 0.5);
    L.step_gravel = norm(highpass(gen(0.15, t => rnd(52)() * Math.exp(-t * 25) * (rnd(53)() > 0.3 ? 1 : 0.2)), 1200), 0.5);
    L.step_metal = norm(mix(step(54, 2500, 0.05, 0.4), tone(420, 0.2, 'sin', 25, 0.25), tone(640, 0.15, 'sin', 30, 0.15)), 0.5);
    L.step_wood = norm(mix(step(55, 1200, 0.08, 0.5), tone(180, 0.12, 'sin', 30, 0.3)), 0.5);
    L.step_water = norm(lowpass(highpass(gen(0.25, t => rnd(56)() * Math.exp(-t * 12)), 300), 2400), 0.5);
    L.jump = step(57, 900, 0.1, 0.3);
    L.land = step(58, 700, 0.15, 0.6);
    L.hurt = norm(lowpass(gen(0.3, t => (Math.sin(t * 6.28 * (180 - t * 150)) + rnd(59)() * 0.3) * Math.exp(-t * 7)), 1200), 0.7);
    L.hurt_burn = norm(mix(L.hurt, lowpass(gen(0.5, t => rnd(60)() * Math.exp(-t * 4)), 2500)), 0.7);
    L.hurt_shock = norm(mix(L.hurt, gen(0.4, t => (Math.sin(t * 6.28 * 120) > 0 ? 1 : -1) * rnd(61)() * Math.exp(-t * 6) * 0.5)), 0.7);
    L.npc_hurt = norm(lowpass(gen(0.3, t => Math.sin(t * 6.28 * (160 - t * 120)) * Math.exp(-t * 6) + rnd(62)() * 0.2 * Math.exp(-t * 10)), 1500), 0.6);
    L.npc_die = norm(lowpass(gen(0.8, t => Math.sin(t * 6.28 * (190 - t * 120)) * Math.exp(-t * 3) * (1 + Math.sin(t * 30) * 0.3)), 1400), 0.7);
    L.zombie_hurt = growl(63, 90, 0.5, 0.5);
    L.zombie_die = growl(64, 70, 1.0, 0.5);
    L.zombie_idle = growl(65, 80, 1.2, 0.4);
    L.scream = norm(gen(0.9, t => Math.sin(t * 6.28 * (600 + Math.sin(t * 20) * 60)) * Math.sin(Math.min(1, t / 0.9) * Math.PI) * 0.6), 0.6);
    for (const [k, base, rough] of [['dog', 240, 0.5], ['flesh', 110, 0.4], ['boar', 85, 0.6], ['bloodsucker', 70, 0.7], ['chimera', 55, 0.65]]) {
      L[k + '_idle'] = growl(70 + base, base, 0.7, rough);
      L[k + '_attack'] = growl(71 + base, base * 1.3, 0.4, rough);
      L[k + '_hurt'] = growl(72 + base, base * 1.6, 0.3, rough * 0.8);
      L[k + '_die'] = growl(73 + base, base * 0.8, 1.1, rough);
    }
    L.anom_fire = norm(lowpass(gen(1.3, t => rnd(80)() * Math.min(1, t * 10) * Math.exp(-t * 1.5)), 1200));
    L.anom_electro = norm(mix(highpass(gen(0.6, t => rnd(81)() * (Math.sin(t * 6.28 * 50) > 0.5 ? 1 : 0.1) * Math.exp(-t * 4)), 2000), gen(0.5, t => Math.sin(t * 6.28 * 100) * Math.exp(-t * 5) * 0.4)));
    L.anom_vortex = norm(gen(2.2, t => Math.sin(t * 6.28 * (40 + t * 60)) * Math.min(1, t) * 0.5 + rnd(82)() * 0.3 * Math.min(1, t * 2) * Math.exp(-Math.max(0, t - 2) * 20)));
    L.anom_spring = norm(mix(gen(0.5, t => Math.sin(t * 6.28 * (80 - t * 80)) * Math.exp(-t * 6)), lowpass(gen(0.3, t => rnd(83)() * Math.exp(-t * 15)), 800)));
    L.anom_acid = norm(lowpass(gen(0.6, t => rnd(84)() * (rnd(85)() > 0.97 ? 1 : 0.05)), 1800), 0.4);
    L.anom_fuzz = norm(highpass(gen(0.5, t => rnd(86)() * 0.3 * Math.sin(t * 6)), 3000), 0.3);
    L.anom_beep = tone(1400, 0.06, 'sq', 30, 0.25);
    L.det_beep = tone(2200, 0.08, 'sin', 20, 0.4);
    L.medkit = seq([[0, highpass(gen(0.3, t => rnd(87)() * Math.exp(-t * 10)), 3000)], [0.3, click(88, 700)]]);
    L.eat = seq([[0, step(89, 1500, 0.1, 0.5)], [0.25, step(90, 1500, 0.1, 0.5)], [0.5, step(91, 1500, 0.1, 0.5)]]);
    L.drink = seq([[0, tone(300, 0.15, 'sin', 10, 0.3)], [0.2, tone(280, 0.15, 'sin', 10, 0.3)], [0.4, tone(260, 0.15, 'sin', 10, 0.3)]]);
    L.pickup = seq([[0, click(92, 900)], [0.06, click(93, 1300)]]);
    L.pickup_art = norm(mix(tone(880, 0.6, 'sin', 4, 0.4), tone(1320, 0.6, 'sin', 5, 0.3), tone(1760, 0.5, 'sin', 6, 0.2)), 0.5);
    L.drop = step(94, 800, 0.1, 0.5);
    L.stash = seq([[0, step(95, 700, 0.2, 0.6)], [0.2, click(96, 600)]]);
    L.money = seq([[0, tone(2600, 0.1, 'sin', 25, 0.3)], [0.07, tone(3100, 0.12, 'sin', 25, 0.3)]]);
    L.repair = seq([[0, click(97, 900)], [0.2, click(98, 1200)], [0.4, tone(700, 0.2, 'sq', 20, 0.2)]]);
    L.cloth = norm(lowpass(gen(0.4, t => rnd(99)() * Math.sin(t * 8)), 1800), 0.4);
    L.siren = norm(gen(4, t => Math.sin(6.28 * (500 + Math.sin(t * 1.6) * 180) * t) * 0.5 * Math.min(1, t * 2) * Math.min(1, (4 - t) * 2)), 0.5);
    L.emission_blast = norm(mix(lowpass(gen(4, t => rnd(100)() * Math.exp(-t * 0.8)), 300), gen(3, t => Math.sin(t * 6.28 * 32) * Math.exp(-t * 1.2))));
    L.thunder = norm(lowpass(gen(2.5, t => rnd(101)() * Math.exp(-t * 1.6) * (1 + Math.sin(t * 9) * 0.5)), 400));
    L.pda = seq([[0, tone(1600, 0.08, 'sq', 20, 0.2)], [0.1, tone(2100, 0.1, 'sq', 20, 0.2)]]);
    L.geiger = click(102, 3000, 0.01, 0.6);
    L.heartbeat = seq([[0, lowpass(gen(0.12, t => Math.sin(t * 6.28 * 50) * Math.exp(-t * 25)), 200)], [0.2, lowpass(gen(0.12, t => Math.sin(t * 6.28 * 45) * Math.exp(-t * 25)), 200), 0.7]]);
    L.wind = norm(lowpass(gen(6, t => rnd(103)() * (0.6 + Math.sin(t * 0.9) * 0.3 + Math.sin(t * 2.3) * 0.1)), 450), 0.35);
    L.rain = norm(highpass(gen(4, () => rnd(104)()), 1500), 0.25);
    L.crickets = norm(gen(4, t => Math.sin(t * 6.28 * 4200) * (Math.sin(t * 6.28 * 32) > 0.3 ? 1 : 0) * (Math.sin(t * 2.2) > -0.2 ? 1 : 0) * 0.3 + Math.sin(t * 6.28 * 3600) * (Math.sin(t * 6.28 * 27 + 1) > 0.5 ? 0.2 : 0) * (Math.sin(t * 1.7 + 2) > 0 ? 1 : 0)), 0.18);
    L.rumble = norm(lowpass(gen(5, t => rnd(105)() * (0.7 + Math.sin(t * 1.3) * 0.3)), 120), 0.5);
    const chords = [[110, 164.8, 220, 261.6], [98, 146.8, 196, 246.9], [87.3, 130.8, 174.6, 220], [98, 146.8, 196, 293.7]];
    const guitarParts = [];
    let t = 0;
    for (let bar = 0; bar < 8; bar++) {
      const ch = chords[bar % 4];
      const pat = [0, 2, 1, 3, 2, 1, 3, 2];
      for (let k = 0; k < 8; k++) { guitarParts.push([t, pluck(ch[pat[k]] * (k === 0 ? 0.5 : 1), 1.4), k === 0 ? 0.9 : 0.6]); t += 0.28; }
    }
    L.guitar = norm(seq(guitarParts), 0.6);
    const pad = gen(16, t => { const env = Math.sin(Math.min(1, t / 16) * Math.PI); return (Math.sin(t * 6.28 * 55) * 0.4 + Math.sin(t * 6.28 * 82.4 + Math.sin(t * 0.3)) * 0.3 + Math.sin(t * 6.28 * 110.5) * 0.15 + Math.sin(t * 6.28 * 164.8 * (1 + Math.sin(t * 0.2) * 0.003)) * 0.1) * env; });
    L.pad = norm(lowpass(pad, 900), 0.4);
    return L;
  }

  class Audio98 {
    constructor() { this.ctx = null; this.sfx = 0.8; this.music = 0.5; this.loops = {}; this.lib = null; this.last = {}; }
    init() {
      if (this.ctx) return;
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch (_) { this.ctx = null; return; }
      const raw = buildLibrary();
      this.lib = {};
      for (const [k, data] of Object.entries(raw)) { const b = this.ctx.createBuffer(1, data.length, SR); b.getChannelData(0).set(data); this.lib[k] = b; }
      this.master = this.ctx.createGain(); this.master.gain.value = 1; this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = this.sfx; this.sfxGain.connect(this.master);
      this.musGain = this.ctx.createGain(); this.musGain.gain.value = this.music; this.musGain.connect(this.master);
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    setVolumes(sfx, music) { this.sfx = sfx; this.music = music; if (this.sfxGain) { this.sfxGain.gain.value = sfx; this.musGain.gain.value = music; } }
    play(name, opts = {}) {
      if (!this.ctx || !this.lib) return;
      const buf = this.lib[name];
      if (!buf) return;
      const now = this.ctx.currentTime;
      const key = name + (opts.x != null ? '' : 'ui');
      if (this.last[key] && now - this.last[key] < 0.025) return;
      this.last[key] = now;
      let vol = opts.vol == null ? 1 : opts.vol, pan = 0;
      if (opts.x != null && this.listener) {
        const L = this.listener, dx = opts.x - L.x, dy = opts.y - L.y, dz = (opts.z || 0) - L.z, d = Math.hypot(dx, dy, dz);
        const range = opts.range || (name.startsWith('shot') || name === 'explosion' ? 260 : name.startsWith('step') ? 25 : 70);
        if (d > range) return;
        vol *= Math.pow(1 - d / range, 1.6);
        const ang = Math.atan2(dy, dx) - L.yaw;
        pan = -Math.sin(ang) * Math.min(1, d / 3);
        if (L.muffle) vol *= 0.6;
      }
      if (vol < 0.01) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = opts.rate || (0.94 + Math.random() * 0.12);
      const g = this.ctx.createGain(); g.gain.value = vol;
      let node = src;
      node.connect(g); node = g;
      if (this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); node.connect(p); node = p; }
      node.connect(opts.music ? this.musGain : this.sfxGain);
      src.start();
      return src;
    }
    loop(name, vol, bus = 'sfx') {
      if (!this.ctx || !this.lib) return;
      let l = this.loops[name];
      if (!l) {
        if (vol <= 0.001) return;
        const src = this.ctx.createBufferSource(); src.buffer = this.lib[name]; src.loop = true;
        const g = this.ctx.createGain(); g.gain.value = 0;
        src.connect(g); g.connect(bus === 'music' ? this.musGain : this.sfxGain); src.start();
        l = this.loops[name] = { src, g };
      }
      l.g.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.4);
    }
    stopAll() { for (const l of Object.values(this.loops)) { try { l.src.stop(); } catch (_) {} } this.loops = {}; }
    destroy() { this.stopAll(); if (this.ctx) { try { this.ctx.close(); } catch (_) {} } this.ctx = null; }
  }

  C.Audio98 = Audio98;
  C.buildSoundLibrary = buildLibrary;
})(globalThis.Cop98 = globalThis.Cop98 || {});
