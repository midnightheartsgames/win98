(function (S) {
  'use strict';
  const SR = 22050, TAU = Math.PI * 2;
  const rnd = S.RNG(4000), noise = () => rnd() * 2 - 1;
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
      const x = a[i], y = (al / a0) * x - (al / a0) * x2 - (-2 * Math.cos(w) / a0) * y1 - ((1 - al) / a0) * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; a[i] = y;
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
  const swish = (dur, f0, f1, q = 1.4) => norm(bp(gen(dur, t => noise() * Math.sin(Math.min(1, t / dur) * Math.PI)), t => f0 + (f1 - f0) * t / dur, q), 0.5);
  const click = (t0, f = 3000) => at(bp(gen(0.03, t => noise() * Math.exp(-t * 260)), f, 1.5), t0);
  function voice(dur, f0fn, formants, ampfn, rough = 0) {
    let ph = 0; const src = gen(dur, t => { ph += f0fn(t) * (1 + (rough ? noise() * rough : 0)) / SR; return saw(ph) * ampfn(t) + noise() * 0.1 * ampfn(t); });
    return mix(...formants.map(([f, q, g]) => gain(bp(Float32Array.from(src), f, q), g)));
  }
  const growl = (dur, f0, f1, form, rough) => norm(voice(dur, t => f0 + (f1 - f0) * t / dur, form, t => env(t, 0.05, 2.5 / dur), rough), 0.8);
  const chime = (freqs, dur, dec) => norm(mix(...freqs.map((f, i) => at(osc(dur, () => f, Math.sin, t => env(t, 0.005, dec)), i * 0.05))), 0.45);
  const gunshot = (dec, fc, bass, tail) => norm(mix(burst(0.35, dec, fc), gain(thump(0.3, bass * 2, bass, 22), 0.9), gain(at(lp(gen(0.5, t => noise() * Math.exp(-t * 6)), 700), 0.03), tail)));

  const SFX = {
    swing: () => swish(0.16, 900, 3200, 1.2), swing2: () => swish(0.2, 700, 2600, 1.1), swing3: () => norm(mix(swish(0.3, 500, 2400, 0.9), gain(burst(0.2, 18, 600), 0.3)), 0.6),
    stab: () => norm(mix(swish(0.08, 2000, 3000, 2), at(swish(0.08, 2000, 3000, 2), 0.1), at(swish(0.08, 2000, 3000, 2), 0.2), at(swish(0.08, 2000, 3000, 2), 0.3)), 0.45),
    swingE: () => swish(0.22, 600, 2000, 1),
    hit: () => norm(mix(burst(0.12, 30, 2400), gain(thump(0.12, 180, 70, 30), 1), gain(bp(gen(0.1, t => noise() * Math.exp(-t * 50)), 4000, 3), 0.4)), 0.7),
    hitgun: () => norm(mix(burst(0.06, 60, 3000), gain(thump(0.06, 200, 120, 60), 0.6)), 0.4),
    gun: () => gunshot(28, 3200, 110, 0.3), gunE: () => gunshot(34, 2800, 130, 0.25),
    charge1: () => norm(mix(gunshot(14, 2400, 70, 0.6), gain(osc(0.4, t => 900 - t * 1500, Math.sin, t => Math.exp(-t * 8)), 0.4)), 0.8),
    charge2: () => norm(mix(gunshot(10, 2200, 60, 0.8), gain(osc(0.6, t => 700 - t * 900, Math.sin, t => Math.exp(-t * 6)), 0.5)), 0.85),
    charge3: () => norm(mix(gunshot(7, 2000, 50, 1), gain(osc(0.8, t => 600 - t * 600, sq, t => Math.exp(-t * 5)), 0.2), gain(burst(0.8, 4, 900), 0.6)), 0.9),
    chargeup: () => norm(osc(0.25, t => 500 + t * 2400, Math.sin, t => env(t, 0.02, 8)), 0.35),
    rev: () => norm(mix(osc(0.35, t => 70 + t * 160 + Math.sin(t * 200) * 20, saw, t => env(t, 0.02, 7)), gain(burst(0.35, 8, 900), 0.4)), 0.6),
    exact: () => norm(mix(osc(0.4, t => 90 + t * 260, saw, t => env(t, 0.01, 6)), gain(burst(0.3, 10, 1600), 0.7), gain(osc(0.2, () => 1800, Math.sin, t => Math.exp(-t * 20)), 0.3)), 0.75),
    maxact: () => norm(mix(SFX.exact(), at(chime([1320, 1760], 0.4, 10), 0.05)), 0.8),
    exfire: () => norm(mix(burst(0.4, 7, 1500), gain(bp(gen(0.4, t => noise() * env(t, 0.02, 7)), 600, 0.8), 0.6)), 0.5),
    grab: () => norm(mix(burst(0.1, 40, 1200), gain(thump(0.15, 140, 70, 20), 0.8)), 0.5),
    buster: () => norm(mix(lp(gen(0.9, t => noise() * env(t, 0.004, 4)), 900), gain(thump(0.7, 120, 35, 5), 1.6), gain(click(0, 1500), 0.5)), 0.95),
    slam: () => norm(mix(lp(gen(0.7, t => noise() * env(t, 0.004, 5)), 700), gain(thump(0.6, 110, 40, 6), 1.4)), 0.85),
    thud: () => norm(mix(lp(gen(0.3, t => noise() * env(t, 0.004, 14)), 500), gain(thump(0.3, 90, 45, 12), 1.2)), 0.6),
    snatch: () => norm(mix(bp(gen(0.3, t => noise() * env(t, 0.02, 8)), t => 800 + t * 5000, 2), gain(osc(0.3, t => 300 + t * 900, Math.sin, t => env(t, 0.02, 9)), 0.4)), 0.5),
    clang: () => norm(mix(osc(0.5, () => 1450, Math.sin, t => Math.exp(-t * 9)), gain(osc(0.5, () => 2170, Math.sin, t => Math.exp(-t * 12)), 0.7), gain(osc(0.5, () => 3350, Math.sin, t => Math.exp(-t * 16)), 0.4), gain(click(0, 4000), 0.7)), 0.55),
    metal: () => norm(mix(osc(0.8, () => 700, Math.sin, t => Math.exp(-t * 5)), gain(osc(0.8, () => 1060, Math.sin, t => Math.exp(-t * 6)), 0.6), click(0, 2500)), 0.5),
    jump: () => norm(bp(gen(0.15, t => noise() * env(t, 0.01, 20)), 1200, 1), 0.25),
    land: () => norm(mix(thump(0.15, 120, 60, 25), gain(burst(0.1, 40, 900), 0.5)), 0.35),
    step: () => norm(mix(lp(gen(0.07, t => noise() * Math.exp(-t * 60)), 2200), gain(thump(0.06, 160, 90, 50), 0.4)), 0.18),
    estep: () => norm(mix(thump(0.12, 200, 90, 30), gain(swish(0.12, 1500, 3000), 0.6)), 0.4),
    hike: () => norm(mix(swish(0.2, 800, 3000), chime([880], 0.2, 12)), 0.4),
    roll: () => norm(swish(0.35, 400, 1200, 0.8), 0.35),
    hurt: () => norm(voice(0.28, t => 170 - t * 140, [[600, 4, 1], [1100, 5, 0.45]], t => env(t, 0.01, 10), 0.05), 0.55),
    death: () => norm(voice(1.4, t => 160 - t * 80, [[600, 4, 1], [1050, 5, 0.5]], t => env(t, 0.03, 2), 0.05), 0.7),
    revive: () => chime([523, 659, 784, 1047, 1319], 1.2, 3),
    heal: () => chime([659, 880, 1319], 0.6, 6), orbw: () => chime([1047, 1568], 0.5, 8),
    orb: () => norm(mix(osc(0.18, () => 1568, Math.sin, t => env(t, 0.002, 18)), gain(osc(0.18, () => 2093, Math.sin, t => env(t, 0.002, 22)), 0.5)), 0.28),
    orbbig: () => chime([784, 1047, 1319, 1568, 2093], 0.8, 5),
    frag: () => chime([523, 784, 1047, 1568], 1.2, 3), keyitem: () => chime([392, 523, 659, 784, 1047], 1.4, 2.5),
    fanfare: () => norm(mix(...[523, 659, 784, 1047].map((f, i) => at(osc(0.5, () => f, saw, t => env(t, 0.02, 4) * 0.6), i * 0.12)), at(osc(0.9, () => 1047, saw, t => env(t, 0.02, 2)), 0.5)), 0.5),
    seal: () => norm(mix(lp(gen(1, t => noise() * env(t, 0.05, 3)), 500), gain(osc(1, t => 90 - t * 30, saw, t => env(t, 0.05, 3)), 0.6), gain(osc(1, () => 180, Math.sin, t => env(t, 0.05, 3)), 0.4)), 0.6),
    unseal: () => norm(mix(bp(gen(0.9, t => noise() * env(t, 0.02, 4)), t => 300 + t * 2000, 1.5), chime([440, 660], 0.8, 4)), 0.5),
    door: () => norm(mix(bp(gen(0.9, t => noise() * env(t, 0.1, 3)), t => 300 + Math.sin(t * 16) * 120, 3), gain(osc(0.9, t => 120 + t * 90, saw, t => env(t, 0.1, 3) * 0.3), 0.5), at(thump(0.3, 90, 50, 12), 0.7)), 0.45),
    whoosh: () => swish(0.5, 300, 1800, 0.8),
    fall: () => norm(swish(0.6, 2000, 300, 0.8), 0.4),
    taunt: () => norm(voice(0.5, t => 140 + Math.sin(t * 10) * 20, [[500, 4, 1], [1500, 6, 0.4]], t => env(t, 0.03, 5), 0.02), 0.4),
    dt: () => norm(mix(lp(gen(1.4, t => noise() * env(t, 0.01, 2.5)), 1200), gain(thump(1, 90, 30, 3), 1.3), gain(osc(1.4, t => 55 + t * 40, saw, t => env(t, 0.05, 2)), 0.5), gain(growl(1.2, 90, 60, [[400, 3, 1], [900, 4, 0.5]], 0.2), 0.6)), 0.9),
    dtoff: () => norm(bp(gen(0.5, t => noise() * env(t, 0.01, 6)), t => 2000 - t * 3000, 1.2), 0.4),
    spawn: () => norm(mix(lp(gen(0.8, t => noise() * env(t, 0.1, 4)), 800), gain(osc(0.8, t => 70 + t * 40, saw, t => env(t, 0.1, 4)), 0.4)), 0.55),
    stinger: () => norm(mix(swish(0.45, 400, 2800, 0.8), gain(burst(0.4, 6, 1200), 0.4)), 0.6),
    dante_hurt: () => norm(voice(0.4, t => 130 - t * 70, [[520, 4, 1], [1000, 5, 0.45]], t => env(t, 0.02, 7), 0.05), 0.55),
    credohurt: () => norm(voice(0.45, t => 120 - t * 60, [[500, 4, 1], [950, 5, 0.45]], t => env(t, 0.02, 6), 0.05), 0.55),
    roarB: () => growl(1.6, 70, 45, [[280, 3, 1], [700, 4, 0.6], [1500, 5, 0.3]], 0.3),
    roarF: () => growl(1.8, 55, 40, [[220, 3, 1], [500, 4, 0.6]], 0.35),
    roarS: () => growl(0.6, 190, 110, [[500, 4, 1], [1300, 5, 0.5]], 0.3),
    baelhurt: () => growl(0.9, 90, 60, [[300, 3, 1], [650, 4, 0.5]], 0.3),
    cast: () => norm(mix(bp(gen(1.2, t => noise() * env(t, 0.3, 2)), t => 400 + t * 900, 3), gain(osc(1.2, t => 110 + t * 110, saw, t => env(t, 0.3, 2) * 0.3), 0.6)), 0.5),
    boom: () => norm(mix(lp(gen(1.4, t => noise() * env(t, 0.004, 3)), 900), gain(thump(0.9, 100, 32, 4), 1.4)), 0.9),
    boomS: () => norm(mix(lp(gen(0.6, t => noise() * env(t, 0.004, 6)), 1600), gain(thump(0.4, 140, 50, 8), 1)), 0.75),
    extinguish: () => norm(mix(hp(gen(1.2, t => noise() * env(t, 0.02, 2.5)), 1500), gain(osc(1.2, t => 300 - t * 200, Math.sin, t => env(t, 0.05, 3)), 0.3)), 0.5),
    breath: () => norm(mix(bp(gen(1.4, t => noise() * env(t, 0.1, 1.5)), 900, 0.5), hp(gen(1.4, t => noise() * env(t, 0.1, 1.5) * 0.4), 3000)), 0.55),
    tongue: () => norm(mix(swish(0.3, 300, 1200, 1), at(thump(0.2, 200, 80, 20), 0.2)), 0.6),
    rumble: () => norm(lp(gen(2, t => noise() * Math.sin(Math.min(1, t / 2) * Math.PI)), 160), 0.8),
    icehit: () => norm(mix(osc(0.3, () => 2600, Math.sin, t => Math.exp(-t * 18)), gain(osc(0.3, () => 3900, Math.sin, t => Math.exp(-t * 22)), 0.6), gain(burst(0.1, 40, 5000), 0.5)), 0.45),
    icebreak: () => norm(mix(...[0, 0.03, 0.07, 0.1, 0.15].map((d, i) => at(osc(0.25, () => 2000 + i * 600, Math.sin, t => Math.exp(-t * 20)), d)), gain(burst(0.3, 12, 6000), 0.6)), 0.55),
    freeze: () => norm(mix(hp(gen(0.9, t => noise() * env(t, 0.1, 3)), 4000), gain(osc(0.9, t => 3000 - t * 1000, Math.sin, t => env(t, 0.1, 3)), 0.3)), 0.45),
    shieldbreak: () => norm(mix(SFX.clang(), gain(burst(0.4, 8, 3000), 0.7)), 0.7),
    cloak: () => norm(bp(gen(1.2, t => noise() * Math.sin(Math.min(1, t / 1.2) * Math.PI)), t => 300 + t * 600, 2), 0.4),
    cloakoff: () => norm(mix(bp(gen(0.6, t => noise() * env(t, 0.01, 5)), t => 2400 - t * 3000, 1.5), gain(voice(0.5, t => 300 - t * 200, [[700, 4, 1]], t => env(t, 0.02, 6), 0.2), 0.5)), 0.5),
    glass: () => norm(mix(...Array.from({ length: 14 }, (_, i) => at(osc(0.3, () => 2200 + rnd() * 3000, Math.sin, t => Math.exp(-t * 14)), rnd() * 0.4)), gain(burst(0.5, 6, 6000), 0.7)), 0.6),
    buzz: () => norm(mix(osc(1.2, () => 110, sq, () => 0.4), gain(osc(1.2, () => 220, saw, () => 0.2), 0.6)), 0.3),
    zap: () => norm(mix(gen(1.4, t => (rnd() < 0.3 ? noise() : 0) * env(t, 0.01, 1.5)), gain(osc(1.4, () => 60, sq, t => env(t, 0.01, 1.5)), 0.4)), 0.5),
    spear: () => norm(mix(swish(0.4, 1200, 3500, 1.4), gain(chime([1760], 0.3, 10), 0.4)), 0.5),
    gyro: () => norm(mix(osc(0.6, t => 400 + t * 300, saw, t => env(t, 0.02, 4)), gain(click(0, 2000), 0.5)), 0.4),
    socket: () => norm(mix(thump(0.3, 150, 70, 12), click(0, 1800), at(chime([659, 988], 0.6, 5), 0.1)), 0.55),
    machine: () => norm(mix(osc(0.8, t => 80 + t * 40, sq, t => env(t, 0.05, 3) * 0.4), gain(bp(gen(0.8, t => noise() * env(t, 0.05, 3)), 900, 2), 0.7), click(0.7, 1400)), 0.45),
    cannon: () => norm(mix(lp(gen(1, t => noise() * env(t, 0.004, 3)), 700), gain(thump(0.8, 90, 30, 4), 1.4)), 0.85),
    dice: () => norm(mix(...[0, 0.12, 0.26, 0.42, 0.6].map((d, i) => at(mix(click(0, 1800 - i * 150), gain(thump(0.08, 300, 150, 40), 0.5)), d))), 0.45),
    breakwood: () => norm(mix(burst(0.3, 14, 1800), ...[0, 0.03, 0.07].map(d => at(bp(gen(0.08, t => noise() * Math.exp(-t * 50)), 900, 2), d))), 0.5),
    breakstone: () => norm(mix(burst(0.4, 10, 2500), gain(thump(0.2, 150, 70, 18), 0.7)), 0.5),
    throw: () => swish(0.3, 600, 3000, 1),
    lure: () => norm(mix(...[0, 0.3, 0.6].map((d, i) => at(osc(0.8, t => 660 + i * 110 + Math.sin(t * 30) * 20, Math.sin, t => env(t, 0.1, 3)), d))), 0.35),
    wind: () => norm(bp(gen(2.5, t => noise() * Math.sin(Math.min(1, t / 2.5) * Math.PI)), 400, 0.5), 0.5),
    heartbeat: () => norm(mix(thump(0.2, 70, 40, 18), at(thump(0.2, 60, 35, 18), 0.25), at(thump(0.2, 70, 40, 18), 1), at(thump(0.2, 60, 35, 18), 1.25)), 0.8),
    holy: () => norm(mix(chime([523, 659, 784, 1047], 1.5, 2), gain(hp(gen(1.5, t => noise() * env(t, 0.05, 2)), 3000), 0.4)), 0.6),
    die_scarecrow: () => norm(mix(voice(0.5, t => 240 - t * 200, [[700, 4, 1], [1400, 5, 0.4]], t => env(t, 0.02, 5), 0.25), gain(burst(0.3, 10, 1500), 0.5)), 0.5),
    die_frost: () => norm(mix(growl(0.6, 200, 100, [[800, 4, 1]], 0.3), SFX.icebreak()), 0.55),
    die_angelo: () => norm(mix(SFX.metal(), gain(osc(0.7, t => 300 - t * 200, saw, t => env(t, 0.02, 4)), 0.3)), 0.5),
    die_mephisto: () => norm(voice(0.9, t => 400 - t * 300, [[800, 4, 1], [1800, 6, 0.4]], t => env(t, 0.02, 3), 0.3), 0.5),
    die_assault: () => growl(0.6, 220, 120, [[600, 4, 1], [1400, 5, 0.4]], 0.35),
    die_gladius: () => norm(mix(SFX.clang(), gain(chime([1760, 2640], 0.4, 8), 0.5)), 0.4),
    ui_click: () => norm(mix(click(0, 3000), gain(osc(0.03, () => 900, sq), 0.2)), 0.25),
    ui_move: () => norm(osc(0.05, () => 1200, sq, t => Math.exp(-t * 60)), 0.12),
    ui_open: () => norm(bp(gen(0.2, t => noise() * env(t, 0.02, 12)), t => 600 + t * 3000, 1.2), 0.25),
    rank: () => norm(mix(chime([880, 1320], 0.3, 10), gain(swish(0.2, 1000, 4000), 0.5)), 0.4),
    rankS: () => norm(mix(chime([659, 988, 1319, 1760], 0.6, 5), gain(burst(0.4, 6, 2000), 0.3)), 0.5)
  };
  const DRUM = {
    kick: () => norm(mix(thump(0.3, 150, 45, 12), gain(click(0, 1200), 0.3)), 0.9),
    snare: () => norm(mix(bp(gen(0.22, t => noise() * Math.exp(-t * 18)), 1800, 0.8), gain(thump(0.12, 240, 170, 30), 0.6)), 0.7),
    hat: () => norm(hp(gen(0.05, t => noise() * Math.exp(-t * 90)), 6000), 0.3),
    crash: () => norm(hp(gen(1.4, t => noise() * Math.exp(-t * 2.5)), 4000), 0.4)
  };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const THEMES = {
    menu: { bpm: 70, kind: 'organ', roots: [38, 34, 31, 33], riff: null, drums: 0 },
    church: { bpm: 60, kind: 'organ', roots: [41, 36, 38, 33], riff: null, drums: 0 },
    explore: { bpm: 80, kind: 'pad', roots: [38, 38, 34, 36], bell: [74, 77, 72, 69, 70, 74, 81, 76], drums: 0 },
    castle: { bpm: 96, kind: 'harp', roots: [38, 34, 36, 33], arp: [0, 3, 7, 12, 7, 3, 0, 7], drums: 0 },
    lab: { bpm: 110, kind: 'pulse', roots: [36, 36, 39, 34], drums: 1 },
    forest: { bpm: 72, kind: 'pad', roots: [40, 36, 38, 35], bell: [76, 71, 72, 67, 69, 74, 71, 64], drums: 0 },
    battle: { bpm: 158, kind: 'rock', roots: [38, 38, 34, 36], riff: [0, 0, 12, 0, 0, 10, 0, 7, 0, 0, 12, 0, 13, 12, 10, 7], drums: 2 },
    boss: { bpm: 168, kind: 'rock', roots: [38, 39, 34, 37], riff: [0, 0, 0, 12, 0, 0, 13, 0, 0, 0, 12, 10, 0, 7, 6, 7], drums: 3, organ: true },
    results: { bpm: 120, kind: 'organ', roots: [38, 41, 43, 45], drums: 0 }
  };

  class Audio {
    constructor() { this.sfxVol = 0.8; this.musicVol = 0.55; this.ctx = null; this.buffers = {}; this.voices = []; this.recent = {}; this.listener = { x: 0, y: 0, z: 0, yaw: 0 }; this.theme = null; this.step = 0; this.next = 0; this.paused = false; }
    init() {
      if (this.ctx) return true;
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return false;
      try { this.ctx = new AC(); } catch (_) { return false; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.connect(c.destination);
      this.sfx = c.createGain(); this.sfx.connect(this.master);
      this.mus = c.createGain(); this.mus.connect(this.master);
      this.dist = c.createWaveShaper(); const curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 6) * 0.8; } this.dist.curve = curve;
      this.gtrLP = c.createBiquadFilter(); this.gtrLP.type = 'lowpass'; this.gtrLP.frequency.value = 2600; this.gtrG = c.createGain(); this.gtrG.gain.value = 0.28;
      this.dist.connect(this.gtrLP); this.gtrLP.connect(this.gtrG); this.gtrG.connect(this.mus);
      this.applyVolume(); return true;
    }
    resume() { if (!this.init()) return; if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); this.warm(); }
    warm() { if (this.warming) return; this.warming = true; const names = Object.keys(SFX).concat(Object.keys(DRUM)); const step = () => { if (!this.ctx) return; const t = Date.now(); while (names.length && Date.now() - t < 8) this.buffer(names.shift()); if (names.length) setTimeout(step, 25); }; setTimeout(step, 30); }
    applyVolume() { if (!this.ctx) return; this.sfx.gain.value = this.sfxVol; this.mus.gain.value = this.musicVol * 0.5; }
    buffer(name) {
      if (this.buffers[name]) return this.buffers[name];
      const f = SFX[name] || DRUM[name]; if (!f) return null;
      const data = f(), b = this.ctx.createBuffer(1, data.length, SR); b.getChannelData(0).set(data);
      return (this.buffers[name] = b);
    }
    setListener(x, y, z, yaw) { this.listener = { x, y, z, yaw }; }
    play(name, x, y, z, vol = 1) {
      if (!this.ctx || this.paused || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime, r = this.recent[name];
      if (r && now - r.t < 0.03) { if (r.n >= 3) return; r.n++; } else this.recent[name] = { t: now, n: 1 };
      const b = this.buffer(name); if (!b) return;
      let g = vol, pan = 0;
      if (x != null) { const L = this.listener, dx = x - L.x, dz = z - L.z, d = Math.hypot(dx, (y || 0) - L.y, dz); g *= 1 / (1 + Math.pow(d / 18, 1.6)); if (g < 0.02) return; pan = -Math.sin(Math.atan2(dx, dz) - L.yaw) * Math.min(1, d / 4) * 0.7; }
      this.voices = this.voices.filter(v => v.end > now);
      if (this.voices.length > 36) return;
      const src = this.ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = /^(ui|orb|step)/.test(name) ? 1 : 0.95 + Math.random() * 0.1;
      const gn = this.ctx.createGain(); gn.gain.value = g; src.connect(gn);
      let out = gn; if (this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = pan; gn.connect(p); out = p; }
      out.connect(this.sfx); src.start();
      this.voices.push({ end: now + b.duration });
    }
    music(theme) {
      if (!this.init()) return;
      if (theme === 'none') { this.theme = null; return; }
      if (this.theme === theme) return;
      this.theme = theme; this.step = 0; this.next = this.ctx.currentTime + 0.1;
    }
    note(t, f, dur, type, vol, cut, dest) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.03, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let n = o; if (cut) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = cut; o.connect(fl); n = fl; }
      n.connect(g); g.connect(dest || this.mus); o.start(t); o.stop(t + dur + 0.05);
    }
    hit(t, name, vol) { const b = this.buffer(name); if (!b) return; const s = this.ctx.createBufferSource(); s.buffer = b; const g = this.ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(this.mus); s.start(t); }
    update() {
      if (!this.ctx || this.paused || !this.theme) return;
      const th = THEMES[this.theme]; if (!th) return;
      const now = this.ctx.currentTime, sd = 60 / th.bpm / 4;
      if (this.next < now - 0.5) this.next = now + 0.05;
      while (this.next < now + 0.3) {
        const t = this.next, s = this.step % 16, bar = Math.floor(this.step / 16), root = th.roots[bar % th.roots.length];
        switch (th.kind) {
          case 'rock': {
            const r = th.riff[s];
            if (r != null && (s % 2 === 0 || th.riff[s] !== th.riff[s - 1])) { for (const iv of [0, 7, 12]) { this.note(t, mtof(root + r + iv) * 1.003, sd * 1.8, 'sawtooth', 0.12, 0, this.dist); this.note(t, mtof(root + r + iv) * 0.997, sd * 1.8, 'sawtooth', 0.12, 0, this.dist); } }
            if (s % 2 === 0) this.note(t, mtof(root - 12 + (r || 0)), sd * 1.6, 'square', 0.05, 500);
            if (th.drums >= 2) { if (s % 4 === 0 || (th.drums === 3 && s % 2 === 0 && bar % 2)) this.hit(t, 'kick', 0.8); if (s % 8 === 4) this.hit(t, 'snare', 0.6); if (s % 2 === 0) this.hit(t, 'hat', 0.35); if (s === 0 && bar % 4 === 0) this.hit(t, 'crash', 0.35); }
            if (th.organ && s === 0) for (const iv of [0, 3, 7]) this.note(t, mtof(root + 24 + iv), sd * 15, 'triangle', 0.025, 2400);
            break;
          }
          case 'organ': if (s === 0) { for (const iv of [0, 7, 12, 15, 19]) { this.note(t, mtof(root + 12 + iv), sd * 16, 'triangle', 0.03, 1800); this.note(t, mtof(root + iv), sd * 16, 'sine', 0.025); } this.note(t, mtof(root - 12), sd * 16, 'sine', 0.05); } if (s === 8 && this.theme === 'menu') this.note(t, mtof(root + 36), sd * 6, 'sine', 0.02); break;
          case 'pad': if (s === 0) for (const iv of [0, 3, 7, 10]) this.note(t, mtof(root + 12 + iv), sd * 16.5, 'triangle', 0.018, 900); if (s % 4 === 0 && th.bell && Math.random() < 0.55) this.note(t, mtof(th.bell[(bar * 4 + s / 4) % th.bell.length]), sd * 6, 'sine', 0.03); if (s === 0) this.note(t, mtof(root - 12), sd * 16, 'sine', 0.04); break;
          case 'harp': { const n = th.arp[s % th.arp.length]; this.note(t, mtof(root + 24 + n), sd * 1.8, 'square', 0.02, 2600); if (s % 8 === 0) this.note(t, mtof(root), sd * 8, 'triangle', 0.05, 800); break; }
          case 'pulse': { this.note(t, mtof(root + (s % 4 === 3 ? 12 : 0)), sd * 0.9, 'square', 0.04, 700 + (s % 8) * 150); if (s % 4 === 0) this.hit(t, 'kick', 0.5); if (s % 8 === 6) this.hit(t, 'hat', 0.3); if (s === 0) for (const iv of [0, 3, 6]) this.note(t, mtof(root + 24 + iv), sd * 16, 'sawtooth', 0.01, 1200); break; }
          default: break;
        }
        this.next += sd; this.step++;
      }
    }
    pause(p) { this.paused = p; if (this.ctx) { if (p) this.ctx.suspend().catch(() => {}); else this.ctx.resume().catch(() => {}); } }
    destroy() { this.theme = null; if (this.ctx) { try { this.ctx.close(); } catch (_) {} } this.ctx = null; }
  }

  S.SFX = SFX; S.THEMES = THEMES; S.Audio = Audio;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Dmc98 = globalThis.Dmc98 || {});
