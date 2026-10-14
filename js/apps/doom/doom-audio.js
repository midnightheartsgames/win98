/**
 * Doom 98 — Web Audio. Every sound effect is synthesised once into an 11 kHz 8-bit style buffer
 * (noise, filters, formant "voices" for monster growls); music is an original metal sequencer with
 * distorted power-chord guitar, bass and drums. Honors the Win98 tray volume (window.soundSys).
 */
(function (D) {
  'use strict';
  const SR = 22050;
  const rnd = (() => { let s = 12345; return () => { s = (s * 1103515245 + 12345) >>> 0; return (s >>> 8) / 8388608 - 1; }; })();

  // ---------------------------------------------------------------- offline DSP helpers
  const buf = sec => new Float32Array(Math.max(1, Math.floor(sec * SR)));
  function biquad(a, type, f, q = 1) {
    const w = 2 * Math.PI * f / SR, cs = Math.cos(w), al = Math.sin(w) / (2 * q);
    let b0, b1, b2, a0 = 1 + al, a1 = -2 * cs, a2 = 1 - al;
    if (type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; } else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; } else { b0 = al; b1 = 0; b2 = -al; }
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < a.length; i++) { const x = a[i], y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x; y2 = y1; y1 = y; a[i] = y; }
    return a;
  }
  function sweepFilter(a, type, f0, f1, q = 1) { // time-varying via chunks
    const out = new Float32Array(a.length), N = 256;
    let st = { x1: 0, x2: 0, y1: 0, y2: 0 };
    for (let s = 0; s < a.length; s += N) {
      const f = f0 + (f1 - f0) * (s / a.length), w = 2 * Math.PI * Math.min(f, SR * 0.45) / SR, cs = Math.cos(w), al = Math.sin(w) / (2 * q);
      let b0, b1, b2; const a0 = 1 + al, a1 = -2 * cs, a2 = 1 - al;
      if (type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; } else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; } else { b0 = al; b1 = 0; b2 = -al; }
      for (let i = s; i < Math.min(a.length, s + N); i++) { const x = a[i], y = (b0 * x + b1 * st.x1 + b2 * st.x2 - a1 * st.y1 - a2 * st.y2) / a0; st.x2 = st.x1; st.x1 = x; st.y2 = st.y1; st.y1 = y; out[i] = y; }
    }
    return out;
  }
  const noise = sec => { const a = buf(sec); for (let i = 0; i < a.length; i++) a[i] = rnd(); return a; };
  const envExp = (a, k, att = 0.002) => { for (let i = 0; i < a.length; i++) { const t = i / SR; a[i] *= (t < att ? t / att : 1) * Math.exp(-k * t); } return a; };
  const envLin = (a, att, rel) => { const n = a.length; for (let i = 0; i < n; i++) { const t = i / SR, T = n / SR; a[i] *= Math.min(1, t / att, (T - t) / rel); } return a; };
  const mix = (...parts) => { const n = Math.max(...parts.map(([a, off = 0]) => a.length + Math.floor(off * SR))), o = new Float32Array(n); for (const [a, off = 0, g = 1] of parts) { const s = Math.floor(off * SR); for (let i = 0; i < a.length; i++) o[s + i] += a[i] * g; } return o; };
  const tone = (sec, f0, f1, wave = 'sin') => { const a = buf(sec); let ph = 0; for (let i = 0; i < a.length; i++) { const f = f0 * Math.pow(f1 / f0, i / a.length); ph += f / SR; const x = ph % 1; a[i] = wave === 'sin' ? Math.sin(ph * 2 * Math.PI) : wave === 'sq' ? (x < 0.5 ? 1 : -1) : wave === 'saw' ? 2 * x - 1 : 1 - 4 * Math.abs(x - 0.5); } return a; };
  const gain = (a, g) => { for (let i = 0; i < a.length; i++) a[i] *= g; return a; };
  const crush = a => { let peak = 0; for (const v of a) peak = Math.max(peak, Math.abs(v)); const k = peak > 0 ? 0.9 / peak : 1; for (let i = 0; i < a.length; i++) a[i] = Math.round(a[i] * k * 127) / 127; return a; };
  // formant voice: pitched buzz + noise through resonances
  function voice(sec, f0, f1, formants, opts = {}) {
    const a = buf(sec); let ph = 0;
    for (let i = 0; i < a.length; i++) {
      const t = i / a.length, f = f0 * Math.pow(f1 / f0, t) * (1 + (opts.vib || 0) * Math.sin(i / SR * 2 * Math.PI * 7)) * (1 + (opts.jitter || 0.02) * rnd());
      ph += f / SR; a[i] = (2 * (ph % 1) - 1) * (1 - (opts.noise || 0.3)) + rnd() * (opts.noise || 0.3);
    }
    let out = new Float32Array(a.length);
    for (const [ff, q, g] of formants) { const b = biquad(a.slice(), 'bp', ff, q); for (let i = 0; i < a.length; i++) out[i] += b[i] * g; }
    return envLin(out, opts.att || 0.02, opts.rel || sec * 0.5);
  }
  const boom = (sec, k, cut = 800, sub = 55) => mix([envExp(biquad(noise(sec), 'lp', cut, 0.7), k)], [envExp(tone(sec, sub * 1.6, sub * 0.7), k * 1.2), 0, 0.9]);
  const click = (f = 2500, k = 80, sec = 0.06) => envExp(biquad(noise(sec), 'bp', f, 3), k);

  const RECIPES = {
    pistol: () => mix([envExp(biquad(noise(0.35), 'lp', 3000), 16)], [envExp(tone(0.2, 180, 60), 20), 0, 0.8]),
    shotgn: () => mix([envExp(biquad(noise(0.7), 'lp', 2200), 7)], [envExp(tone(0.35, 120, 45), 10), 0, 1], [click(1800, 60), 0.42, 0.6], [click(1200, 50), 0.55, 0.7]),
    dshtgn: () => mix([envExp(biquad(noise(0.9), 'lp', 1800), 5)], [envExp(tone(0.45, 100, 35), 7), 0, 1.2]),
    dbopn: () => mix([click(1500, 50, 0.1)], [click(900, 40, 0.1), 0.05]),
    dbload: () => mix([click(2200, 70)], [click(1400, 60), 0.08]),
    dbcls: () => mix([click(1100, 40, 0.12), 0, 1.2]),
    plasma: () => mix([envExp(tone(0.3, 1400, 280, 'sq'), 9), 0, 0.6], [envExp(biquad(noise(0.3), 'hp', 2000), 14), 0, 0.5]),
    bfg: () => { const w = tone(1.0, 150, 1800, 'saw'); envLin(w, 0.05, 0.1); return mix([gain(w, 0.5)], [envExp(biquad(noise(0.8), 'lp', 1200), 4), 0.75, 0.9]); },
    rlaunc: () => mix([envLin(sweepFilter(noise(0.6), 'lp', 400, 2400, 1), 0.02, 0.4)], [envExp(tone(0.4, 90, 40), 8), 0, 0.8]),
    barexp: () => boom(1.3, 3.2, 900, 50), rxplod: () => boom(1.6, 2.5, 700, 40),
    firsht: () => envLin(sweepFilter(noise(0.45), 'bp', 300, 1400, 2), 0.03, 0.3),
    firxpl: () => boom(0.6, 6, 1400, 80),
    sawup: () => mix([envLin(tone(0.7, 40, 95, 'saw'), 0.05, 0.1), 0, 0.7], [envLin(biquad(noise(0.7), 'bp', 800, 2), 0.05, 0.1), 0, 0.4]),
    sawidl: () => { const a = tone(0.12, 62, 62, 'saw'); for (let i = 0; i < a.length; i++) a[i] *= 0.6 + 0.4 * Math.sin(i / SR * 2 * Math.PI * 30); return envLin(a, 0.005, 0.02); },
    sawful: () => { const a = tone(0.14, 110, 110, 'saw'); for (let i = 0; i < a.length; i++) a[i] = a[i] * 0.7 + rnd() * 0.3; return envLin(a, 0.005, 0.03); },
    sawhit: () => { const a = tone(0.14, 95, 80, 'saw'); for (let i = 0; i < a.length; i++) a[i] = a[i] * 0.6 + rnd() * 0.5; return envLin(biquad(a, 'lp', 1600), 0.005, 0.03); },
    punch: () => mix([envExp(tone(0.15, 140, 50), 25)], [envExp(biquad(noise(0.1), 'lp', 900), 40), 0, 0.6]),
    doropn: () => mix([envLin(sweepFilter(noise(1.0), 'lp', 300, 900, 1.5), 0.05, 0.3), 0, 0.8], [envLin(tone(1.0, 55, 70, 'saw'), 0.05, 0.3), 0, 0.35]),
    dorcls: () => mix([envLin(sweepFilter(noise(0.9), 'lp', 900, 300, 1.5), 0.05, 0.2), 0, 0.8], [envLin(tone(0.9, 70, 55, 'saw'), 0.05, 0.2), 0, 0.35], [click(500, 30, 0.2), 0.85, 1.2]),
    bdopn: () => envLin(sweepFilter(noise(0.4), 'lp', 400, 2000, 2), 0.01, 0.2), bdcls: () => mix([envLin(sweepFilter(noise(0.4), 'lp', 2000, 400, 2), 0.01, 0.1)], [click(500, 30, 0.2), 0.35, 1.2]),
    pstart: () => mix([envLin(tone(0.5, 45, 60, 'saw'), 0.05, 0.1), 0, 0.5], [envLin(biquad(noise(0.5), 'lp', 500), 0.05, 0.1), 0, 0.7]),
    pstop: () => mix([click(400, 25, 0.25), 0, 1.4], [envExp(tone(0.2, 70, 40), 15), 0, 0.8]),
    stnmov: () => envLin(biquad(noise(0.25), 'lp', 350), 0.02, 0.1),
    swtchn: () => mix([click(3000, 90)], [click(1800, 70), 0.04]), swtchx: () => mix([click(3000, 90)], [click(1800, 70), 0.04], [envExp(tone(0.4, 880, 440, 'sq'), 6), 0.05, 0.25]),
    itemup: () => mix([envExp(tone(0.08, 900, 900, 'sq'), 25), 0, 0.4], [envExp(tone(0.1, 1350, 1350, 'sq'), 20), 0.06, 0.4]),
    wpnup: () => mix([click(1400, 40, 0.12), 0, 1.2], [click(900, 40, 0.12), 0.14, 1.2], [envExp(tone(0.1, 600, 600, 'sq'), 20), 0, 0.2]),
    getpow: () => mix(...[523, 659, 784, 1046].map((f, i) => [envExp(tone(0.25, f, f, 'tri'), 8), i * 0.07, 0.5])),
    telept: () => { const a = tone(1.0, 200, 1200, 'sq'); for (let i = 0; i < a.length; i++) a[i] *= Math.sin(i / SR * 2 * Math.PI * 12) * 0.5 + 0.5; return mix([envLin(biquad(a, 'lp', 2500), 0.02, 0.4), 0, 0.5], [envLin(noise(1.0), 0.02, 0.5), 0, 0.2]); },
    oof: () => voice(0.22, 120, 90, [[500, 5, 1], [1000, 6, 0.6]], { noise: 0.2 }),
    noway: () => voice(0.22, 120, 90, [[500, 5, 1], [1000, 6, 0.6]], { noise: 0.2 }),
    plpain: () => voice(0.35, 170, 120, [[700, 4, 1], [1200, 5, 0.6]], { noise: 0.3 }),
    pldeth: () => voice(1.1, 220, 80, [[750, 4, 1], [1150, 5, 0.7], [2600, 8, 0.3]], { noise: 0.25, vib: 0.03 }),
    pdiehi: () => voice(1.2, 320, 90, [[800, 4, 1], [1300, 5, 0.7], [2800, 8, 0.4]], { noise: 0.25, vib: 0.05 }),
    posit: () => voice(0.7, 85, 70, [[400, 4, 1], [900, 5, 0.6]], { noise: 0.45, jitter: 0.08 }),
    posact: () => voice(0.5, 75, 65, [[350, 4, 1], [850, 5, 0.5]], { noise: 0.5, jitter: 0.1 }),
    popain: () => voice(0.35, 110, 80, [[500, 4, 1], [1100, 5, 0.6]], { noise: 0.4 }),
    podth: () => voice(0.9, 110, 55, [[450, 4, 1], [900, 5, 0.6]], { noise: 0.5, jitter: 0.12 }),
    bgsit: () => voice(0.8, 260, 180, [[900, 6, 1], [2200, 8, 0.8]], { noise: 0.55, jitter: 0.15, vib: 0.06 }),
    bgact: () => voice(0.5, 160, 140, [[600, 5, 1], [1500, 7, 0.6]], { noise: 0.6, jitter: 0.12 }),
    bgdth: () => voice(1.0, 240, 90, [[800, 5, 1], [2000, 7, 0.7]], { noise: 0.55, jitter: 0.15 }),
    claw: () => envLin(sweepFilter(noise(0.25), 'bp', 3000, 800, 2), 0.01, 0.15),
    sgtsit: () => voice(0.9, 70, 55, [[300, 4, 1], [700, 5, 0.8]], { noise: 0.5, jitter: 0.2 }),
    sgtatk: () => mix([voice(0.4, 90, 60, [[350, 4, 1], [800, 5, 0.6]], { noise: 0.5 })], [click(900, 30, 0.15), 0.25, 1.5]),
    dmact: () => voice(0.6, 60, 55, [[280, 4, 1], [650, 5, 0.5]], { noise: 0.55, jitter: 0.2 }),
    dmpain: () => voice(0.4, 90, 70, [[380, 4, 1], [900, 5, 0.6]], { noise: 0.5 }),
    sgtdth: () => voice(1.0, 90, 40, [[320, 4, 1], [750, 5, 0.6]], { noise: 0.55, jitter: 0.2 }),
    cacsit: () => voice(1.0, 55, 45, [[250, 3, 1], [600, 5, 0.6]], { noise: 0.4, jitter: 0.25, vib: 0.08 }),
    cacdth: () => voice(1.2, 70, 30, [[260, 3, 1], [620, 5, 0.6]], { noise: 0.5, jitter: 0.25 }),
    brssit: () => voice(1.2, 50, 42, [[220, 3, 1], [520, 4, 0.8], [1200, 6, 0.3]], { noise: 0.35, jitter: 0.2, vib: 0.05 }),
    brsdth: () => voice(1.5, 60, 28, [[220, 3, 1], [520, 4, 0.8]], { noise: 0.4, jitter: 0.25 }),
    cybsit: () => mix([voice(1.6, 40, 35, [[180, 3, 1], [450, 4, 0.9], [1100, 6, 0.3]], { noise: 0.3, jitter: 0.25 })], [envExp(tone(1.2, 45, 30), 2), 0, 0.6]),
    cybdth: () => mix([voice(2.0, 50, 20, [[180, 3, 1], [450, 4, 0.9]], { noise: 0.4, jitter: 0.3 })], [boom(1.5, 2, 600, 40), 0.3, 0.8]),
    sklatk: () => envLin(sweepFilter(noise(0.5), 'bp', 500, 2500, 3), 0.02, 0.2),
    hoof: () => mix([envExp(tone(0.25, 90, 45), 14), 0, 1], [click(300, 25, 0.2), 0, 1]),
    metal: () => mix([envExp(tone(0.3, 420, 400, 'sq'), 12), 0, 0.4], [envExp(tone(0.3, 633, 610, 'sq'), 12), 0, 0.3], [click(2000, 30, 0.2), 0, 1]),
    slop: () => mix([envExp(biquad(noise(0.5), 'lp', 700), 8)], [envExp(tone(0.3, 200, 60), 10), 0.03, 0.5]),
    tink: () => envExp(tone(0.1, 3000, 3000, 'tri'), 40)
  };

  // ---------------------------------------------------------------- music
  const N = name => { const m = /^([a-g])(b|#)?(-?\d)$/.exec(name); if (!m) return null; const base = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[m[1]]; return 12 * (+m[3] + 1) + base + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
  // riff notation: "e2 e2 x x g2:2 -" tokens per 16th; x = palm-muted root of the last note; n:k = hold k steps
  function parseRiff(str) {
    const out = []; let last = N('e2');
    for (const tk of str.trim().split(/\s+/)) {
      const [nm, len] = tk.split(':'), L = +(len || 1);
      if (nm === '-') { out.push(null); for (let i = 1; i < L; i++) out.push(null); continue; }
      if (nm === 'x') { out.push({ n: last, len: 1, mute: true }); for (let i = 1; i < L; i++) out.push(undefined); continue; }
      const n = N(nm); last = n; out.push({ n, len: L }); for (let i = 1; i < L; i++) out.push(undefined);
    }
    return out;
  }
  const TRACKS = {
    title: { bpm: 84, parts: [
      { gtr: 'e2:8 - - - - - - - - f2:6 - - - - - e2:2', drum: 'c...............', lead: '' },
      { gtr: 'e2:8 - - - - - - - - bb1:6 - - - - - b1:2', drum: 'k.......k.......' }], order: [0, 1, 0, 1] },
    e1m1: { bpm: 152, parts: [
      { gtr: 'e2 x x e2 x x g2 x e2 x x e2 x bb2 a2 x', drum: 'k.s.kks.k.s.kks.' },
      { gtr: 'e2 x x e2 x x g2 x e2 x x e2 d3:2 c3 b2', drum: 'k.s.kks.k.s.k.sc' },
      { gtr: 'a2 x x a2 x x c3 x a2 x x a2 x eb3 d3 x', drum: 'k.s.kks.k.s.kks.' },
      { gtr: 'b2:4 - - - bb2:4 - - - a2:4 - - - g2 x f#2 x', drum: 'k.s.k.s.k.s.ksss' }],
      order: [0, 0, 1, 0, 0, 1, 2, 3], lead: [null, null, 'b4:4 - - - a4:2 - g4:2 - e4:6 - - - - -', null, null, 'e5:2 - d5 e5 g5:4 - - - f#5:2 - e5:4 - - -', null, null] },
    e1m2: { bpm: 104, parts: [
      { gtr: 'd2:3 - - x x d2 f2:2 - x x d2 e2:2 - x', drum: 'k...s...k.k.s...' },
      { gtr: 'd2:3 - - x x d2 f2:2 - x x ab2:2 - g2:2 -', drum: 'k...s...k.k.s..s' },
      { gtr: 'bb1:4 - - - x x bb1 c2:4 - - - x c2 x', drum: 'k...s...k.k.s...' }],
      order: [0, 1, 0, 1, 2, 2, 0, 1], lead: [null, null, 'a4:6 - - - - - f4:2 - e4:8 - - - - - - -', 'd4:4 - - - f4:4 - - - a4:4 - - - ab4:4 - - -', null, null, null, null] },
    e1m3: { bpm: 128, parts: [
      { gtr: 'a1 x a2 x x a1 x c3 x a1 x d3 x c3 a2 x', drum: 'k.h.s.h.kkh.s.h.' },
      { gtr: 'f1 x f2 x x f1 x a2 x f1 x bb2 x a2 f2 x', drum: 'k.h.s.h.kkh.s.hs' },
      { gtr: 'g1:4 - - - x x g1 x a1:4 - - - x a1 x', drum: 'k.h.s.h.k.h.s.sc' }],
      order: [0, 0, 1, 1, 0, 0, 2, 2], lead: [null, 'e4:2 - a4:2 - c5:4 - - - b4:2 - a4:2 - e4:4', null, null, null, null, 'd5:8 - - - - - - - e5:8 - - - - - - -', null] },
    e1m4: { bpm: 176, parts: [
      { gtr: 'e2 x e2 x f2 x e2 x g2 x e2 x f2 x e2 x', drum: 'kskskskskskskskc' },
      { gtr: 'e2 x e2 x f2 x e2 x bb2 x a2 x g2 x f2 x', drum: 'kskskskskskskkss' },
      { gtr: 'c3:2 - x x b2:2 - x x bb2:2 - x x a2:2 - x x', drum: 'k.s.k.s.k.s.k.ss' }],
      order: [0, 1, 0, 1, 2, 2, 0, 1] },
    e1m5: { bpm: 92, parts: [
      { gtr: 'c2:4 - - - x x c#2:4 - - - x x c2 x', drum: 'k.....s.k.k...s.' },
      { gtr: 'c2:4 - - - x x f#2:4 - - - x x g2 x', drum: 'k.....s.k.k...sc' },
      { gtr: 'ab1:8 - - - - - - - g1:8 - - - - - - -', drum: 'k...s...k...s.ss' }],
      order: [0, 0, 1, 0, 0, 1, 2, 2], lead: [null, 'c4:3 - - eb4:3 - - f#4:4 - - - g4:6 - - - - -', null, null, 'c5:2 - b4:2 - bb4:2 - a4:2 - ab4:8 - - - - - - -', null, null, null] },
    e1m9: { bpm: 140, parts: [
      { gtr: 'g2 x g2 x bb2 x g2 x c3 x g2 x db3 c3 bb2 x', drum: 'k.s.k.s.k.s.kkss' },
      { gtr: 'eb2 x eb2 x g2 x eb2 x ab2 x eb2 x a2 ab2 g2 x', drum: 'k.s.k.s.k.s.kkss' }],
      order: [0, 0, 1, 0] },
    inter: { bpm: 120, parts: [
      { gtr: 'e2:2 - x x e2:2 - x x g2:2 - x x a2:2 - b2:2 -', drum: 'k.h.s.h.k.h.s.h.' },
      { gtr: 'c3:2 - x x c3:2 - x x b2:2 - x x a2:2 - g2:2 -', drum: 'k.h.s.h.k.h.s.hs' }],
      order: [0, 1] },
    finale: { bpm: 72, parts: [
      { gtr: 'e2:8 - - - - - - - c2:8 - - - - - - -', drum: 'c...............' },
      { gtr: 'a1:8 - - - - - - - b1:8 - - - - - - -', drum: 'k.......k.......' }],
      order: [0, 1], lead: ['e4:4 - - - g4:4 - - - b4:8 - - - - - - -', 'a4:8 - - - - - - - f#4:8 - - - - - - -'] }
  };
  for (const k in TRACKS) { const t = TRACKS[k]; t.parts.forEach(p => { p.g = parseRiff(p.gtr); }); t.leads = (t.lead || []).map(l => l ? parseRiff(l) : null); }

  class Audio {
    constructor() { this.ctx = null; this.sfxVol = 0.8; this.musicVol = 0.5; this.buffers = {}; this.playing = new Map(); this.track = null; }
    ensure() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return this.ctx; }
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return null;
      try { this.ctx = new AC(); } catch (_) { return null; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.connect(c.destination);
      this.sfx = c.createGain(); this.sfx.connect(this.master);
      this.music = c.createGain(); this.music.connect(this.master);
      // guitar bus: drive -> waveshaper -> cabinet lowpass
      this.gtr = c.createGain(); this.gtr.gain.value = 3.2;
      const ws = c.createWaveShaper(), curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 4) * 0.8; } ws.curve = curve; ws.oversample = '2x';
      const cab = c.createBiquadFilter(); cab.type = 'lowpass'; cab.frequency.value = 3200; cab.Q.value = 0.8;
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 90;
      this.gtr.connect(ws); ws.connect(cab); cab.connect(hp); const gOut = c.createGain(); gOut.gain.value = 0.32; hp.connect(gOut); gOut.connect(this.music);
      this.noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const nd = this.noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      this.applyVolume();
      this.timer = setInterval(() => this.schedule(), 60);
      return c;
    }
    applyVolume() {
      if (!this.ctx) return;
      this.master.gain.value = 1; this.sfx.gain.value = this.sfxVol; this.music.gain.value = this.musicVol * 0.6;
    }
    buffer(name) {
      if (this.buffers[name]) return this.buffers[name];
      const r = RECIPES[name]; if (!r || !this.ctx) return null;
      const data = crush(r()), b = this.ctx.createBuffer(1, data.length, SR); b.getChannelData(0).set(data);
      return (this.buffers[name] = b);
    }
    // vol 0..1, pan -1..1; origin: one sound per origin like Doom
    play(name, vol = 1, pan = 0, origin = null, pitch = 1) {
      if (!this.ensure() || vol <= 0.01) return;
      const b = this.buffer(name); if (!b) return;
      const c = this.ctx;
      if (origin != null) { const old = this.playing.get(origin); if (old) { try { old.stop(); } catch (_) {} } }
      if (this.playing.size > 16) { const [k, v] = this.playing.entries().next().value; try { v.stop(); } catch (_) {} this.playing.delete(k); }
      const src = c.createBufferSource(); src.buffer = b; src.playbackRate.value = pitch;
      const g = c.createGain(); g.gain.value = vol;
      let node = g;
      if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); node = p; }
      src.connect(g); node.connect(this.sfx);
      const key = origin != null ? origin : Symbol();
      this.playing.set(key, src);
      src.onended = () => { if (this.playing.get(key) === src) this.playing.delete(key); };
      src.start();
    }
    prewarm() { if (!this.ctx) return; for (const k of Object.keys(RECIPES)) this.buffer(k); }
    // ---------------------------------------------------------------- music
    setMusic(name) {
      if (name === this.track) return; this.track = name;
      if (!this.ensure()) return;
      this.step = 0; this.bar = 0; this.nextTime = this.ctx.currentTime + 0.15;
      if (this.musicNodes) for (const n of this.musicNodes) { try { n.stop(this.ctx.currentTime + 0.05); } catch (_) {} }
      this.musicNodes = [];
    }
    schedule() {
      if (!this.ctx || !this.track) return;
      const T = TRACKS[this.track]; if (!T) return;
      const c = this.ctx, spb = 60 / T.bpm / 4;
      if (this.nextTime < c.currentTime - 0.5) this.nextTime = c.currentTime + 0.05;
      while (this.nextTime < c.currentTime + 0.25) {
        const pi = T.order[this.bar % T.order.length], part = T.parts[pi], t = this.nextTime, s = this.step;
        const g = part.g[s];
        if (g) this.power(g.n, t, (g.mute ? 1 : g.len) * spb, g.mute);
        const dr = (part.drum || '')[s];
        if (dr && dr !== '.') this.drum(dr, t);
        const lead = T.leads[this.bar % T.order.length]; if (lead && lead[s]) this.lead(lead[s].n, t, lead[s].len * spb);
        this.step++; if (this.step >= 16) { this.step = 0; this.bar++; }
        this.nextTime += spb;
      }
      this.musicNodes = (this.musicNodes || []).filter(n => n._end > c.currentTime);
    }
    osc(type, f, t, dur, dest, vol, detune = 0) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = f; o.detune.value = detune;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.setValueAtTime(vol, t + Math.max(0.01, dur - 0.04)); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02); o._end = t + dur + 0.05; this.musicNodes.push(o);
    }
    power(n, t, dur, mute) {
      const f = 440 * Math.pow(2, (n - 69) / 12), d = mute ? dur * 0.8 : dur;
      const c = this.ctx, lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = mute ? 900 : 4000; lp.connect(this.gtr);
      this.osc('sawtooth', f, t, d, lp, 0.22, -6); this.osc('sawtooth', f, t, d, lp, 0.22, 7); this.osc('sawtooth', f * 1.4983, t, d, lp, 0.16); this.osc('sawtooth', f * 2, t, d, lp, 0.1);
      this.osc('square', f / 2, t, d, this.music, 0.12); // bass
    }
    lead(n, t, dur) { const f = 440 * Math.pow(2, (n - 69) / 12); this.osc('square', f, t, dur, this.music, 0.07, 0); this.osc('sawtooth', f, t, dur, this.music, 0.05, 8); }
    drum(k, t) {
      const c = this.ctx;
      const hit = (type, f, dur, vol, fq) => { const s = c.createBufferSource(); s.buffer = this.noiseBuf; const bf = c.createBiquadFilter(); bf.type = type; bf.frequency.value = f; if (fq) bf.Q.value = fq; const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(bf); bf.connect(g); g.connect(this.music); s.start(t); s.stop(t + dur); s._end = t + dur; this.musicNodes.push(s); };
      if (k === 'k' || k === 'o') { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); o.connect(g); g.connect(this.music); o.start(t); o.stop(t + 0.2); o._end = t + 0.2; this.musicNodes.push(o); }
      if (k === 's' || k === 'x') { hit('bandpass', 1800, 0.16, 0.7, 0.8); this.osc('triangle', 190, t, 0.07, this.music, 0.25); }
      if (k === 'h' || k === 'o' || k === 'x') hit('highpass', 7000, 0.05, 0.25);
      if (k === 'c') hit('highpass', 4000, 1.0, 0.35);
    }
    stopMusic() { this.setMusic(null); }
    destroy() { clearInterval(this.timer); for (const v of this.playing.values()) { try { v.stop(); } catch (_) {} } if (this.ctx) this.ctx.close().catch(() => {}); this.ctx = null; }
  }
  D.Audio = Audio; D.SFX = RECIPES; D.TRACKS = TRACKS;
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Doom98 = globalThis.Doom98 || {});
