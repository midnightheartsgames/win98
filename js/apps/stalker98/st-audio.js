/**
 * S.T.A.L.K.E.R. 98 — synthesized sound. Every effect is rendered offline into sample buffers (Node-testable)
 * and played positionally through Web Audio. Loops: wind, rain, campfire crackle and a Karplus-Strong campfire
 * guitar tune whose volume follows the distance to the fires. Ambient music: slow drones and a sparse guitar motif.
 */
(function (S) {
  'use strict';
  const SR = 22050, TAU = Math.PI * 2;
  const rnd = S.RNG(1986);
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
  // gun: crack + body + tail echo
  const gun = (dur, dec, fc, bass, bdec, tail = 0.35) => norm(mix(burst(dur, dec, fc), gain(thump(dur, bass * 2, bass, bdec), 0.9), gain(at(lp(gen(dur * 2, t => noise() * Math.exp(-t * 5)), 600), 0.04), tail)));
  const click = (t0, f = 3000) => at(bp(gen(0.03, t => noise() * Math.exp(-t * 260)), f, 1.5), t0);
  // Karplus-Strong plucked string
  function pluck(freq, dur, bright = 0.5) {
    const n = Math.floor(dur * SR), out = new Float32Array(n), L = Math.max(2, Math.round(SR / freq)), buf = new Float32Array(L);
    for (let i = 0; i < L; i++) buf[i] = (rnd() * 2 - 1);
    let k = 0, prev = 0;
    for (let i = 0; i < n; i++) { const v = buf[k]; const nv = (v * (0.5 + bright * 0.5) + prev * (0.5 - bright * 0.5)) * 0.996; prev = v; buf[k] = nv; out[i] = v; k = (k + 1) % L; }
    return out;
  }
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  // melancholic campfire guitar: Am - Dm - G - C - E arpeggios
  function guitarLoop() {
    const chords = [[45, 52, 57, 60, 64], [50, 57, 62, 65, 69], [43, 50, 55, 59, 62], [48, 55, 60, 64, 67], [40, 47, 52, 56, 59], [45, 52, 57, 60, 64]];
    const pat = [0, 2, 3, 4, 3, 2, 1, 3], step = 0.26, parts = [];
    let t = 0;
    for (let rep = 0; rep < 2; rep++) for (const ch of chords) { for (const p of pat) { parts.push(at(gain(pluck(mtof(ch[p]), 1.6, 0.4), 0.35), t)); t += step; } }
    const o = mix(...parts); lp(o, 3500); return norm(o, 0.6);
  }
  function dogBark(pitch) { return norm(mix(voice(0.22, t => pitch - t * 300, [[700, 4, 1], [1500, 5, 0.6]], t => env(t, 0.01, 14), 0.08), gain(burst(0.1, 30, 2000), 0.3)), 0.7); }

  const SFX = {
    // weapons
    knife: () => norm(bp(gen(0.22, t => noise() * env(t, 0.03, 18)), t => 900 + t * 6000, 1.2), 0.5),
    knifehit: () => norm(mix(burst(0.12, 35, 1500), gain(thump(0.12, 200, 90, 30), 0.6)), 0.6),
    knifewall: () => norm(mix(click(0, 4500), gain(osc(0.2, () => 2400, Math.sin, t => Math.exp(-t * 30)), 0.3)), 0.5),
    pm: () => gun(0.3, 26, 3600, 140, 24, 0.3),
    shotgun: () => gun(0.6, 10, 2000, 70, 10, 0.5),
    mp5: () => gun(0.16, 42, 3000, 130, 40, 0.2),
    ak: () => gun(0.22, 30, 3800, 95, 26, 0.35),
    dry: () => norm(click(0, 2000), 0.35),
    jam: () => norm(mix(click(0, 1500), click(0.06, 1200), gain(burst(0.1, 30, 800), 0.4)), 0.4),
    reload_pistol: () => norm(mix(click(0.05), click(0.5), click(0.9, 2200), click(1.2, 1800)), 0.4),
    reload_rifle: () => norm(mix(click(0.1, 1800), click(0.3, 1400), click(1.2, 2000), click(1.5, 2500), click(1.9, 1700)), 0.45),
    reload_shotgun: () => norm(mix(click(0.1, 1300), click(0.5, 2200), click(1.0, 2200), click(1.8, 1300)), 0.45),
    reload_npc: () => norm(mix(click(0.1, 1800), click(0.6, 2200), click(1.1, 1600)), 0.35),
    reload1: () => norm(mix(click(0), click(0.1)), 0.3),
    switch: () => norm(mix(click(0, 2500), gain(burst(0.12, 30, 1200), 0.3)), 0.3),
    click: () => norm(click(0, 3500), 0.3),
    throw: () => norm(bp(gen(0.25, t => noise() * env(t, 0.05, 10)), t => 500 + t * 3000, 1.2), 0.4),
    bolt: () => norm(mix(osc(0.15, () => 2600, Math.sin, t => Math.exp(-t * 40)), gain(click(0, 5000), 0.5)), 0.35),
    nadebounce: () => norm(mix(osc(0.12, () => 900, Math.sin, t => Math.exp(-t * 40)), gain(click(0, 2000), 0.5)), 0.4),
    explosion: () => norm(mix(lp(gen(1.8, t => noise() * env(t, 0.005, 2.8)), 900), gain(thump(1.2, 110, 36, 4), 1.3), gain(at(lp(gen(1.5, t => noise() * Math.exp(-t * 2)), 400), 0.2), 0.4))),
    hitflesh: () => norm(mix(burst(0.08, 40, 900), gain(thump(0.08, 160, 80, 40), 0.7)), 0.5),
    // player & ui
    pain: () => norm(voice(0.3, t => 150 - t * 120, [[550, 4, 1], [1000, 5, 0.45]], t => env(t, 0.02, 10), 0.05), 0.5),
    pdeath: () => norm(voice(1.2, t => 150 - t * 80, [[600, 4, 1], [1050, 5, 0.5]], t => env(t, 0.03, 2.4), 0.06), 0.7),
    step_grass: () => norm(bp(gen(0.12, t => noise() * env(t, 0.01, 30)), 1800, 0.7), 0.16),
    step_dirt: () => norm(lp(gen(0.1, t => noise() * env(t, 0.005, 40)), 1200), 0.2),
    step_hard: () => norm(mix(lp(gen(0.08, t => noise() * Math.exp(-t * 60)), 2500), gain(thump(0.06, 180, 90, 50), 0.4)), 0.2),
    jump: () => norm(voice(0.18, () => 120, [[500, 4, 1]], t => env(t, 0.02, 14)), 0.2),
    land: () => norm(mix(thump(0.2, 110, 55, 20), gain(burst(0.12, 30, 800), 0.5)), 0.4),
    breath: () => norm(bp(gen(0.9, t => noise() * Math.sin(Math.min(1, t / 0.9) * Math.PI) * (t < 0.45 ? 1 : 0.7)), 900, 0.6), 0.25),
    heartbeat: () => norm(mix(thump(0.15, 70, 40, 25), at(thump(0.15, 60, 35, 25), 0.18)), 0.5),
    geiger: () => norm(mix(click(0, 4000), gain(osc(0.004, () => 2000, sq), 0.4)), 0.4),
    detector: () => norm(osc(0.07, () => 1760, sq, t => (t < 0.06 ? 0.4 : 0)), 0.3),
    detector_art: () => norm(mix(osc(0.06, () => 2350, Math.sin, () => 0.5), at(osc(0.06, () => 2800, Math.sin, () => 0.5), 0.07)), 0.3),
    pda: () => norm(mix(osc(0.08, () => 1480, sq, () => 0.3), at(osc(0.1, () => 1975, sq, () => 0.3), 0.1)), 0.3),
    task: () => norm(mix(...[660, 880, 1320].map((f, i) => at(osc(0.18, () => f, Math.sin, t => env(t, 0.01, 10)), i * 0.09))), 0.4),
    ui_click: () => norm(mix(click(0, 3000), gain(osc(0.03, () => 900, sq), 0.2)), 0.25),
    ui_open: () => norm(bp(gen(0.18, t => noise() * env(t, 0.02, 14)), t => 600 + t * 3000, 1.2), 0.25),
    cloth: () => norm(bp(gen(0.3, t => noise() * env(t, 0.05, 8)), 1500, 0.6), 0.3),
    pickup: () => norm(mix(click(0, 1800), gain(bp(gen(0.2, t => noise() * env(t, 0.02, 14)), 1200, 0.8), 0.6)), 0.35),
    money: () => norm(mix(...[0, 0.05, 0.1].map(t0 => at(osc(0.1, () => 3000 + t0 * 4000, Math.sin, t => Math.exp(-t * 30)), t0))), 0.3),
    drop: () => norm(mix(thump(0.12, 150, 80, 30), gain(burst(0.1, 30, 900), 0.5)), 0.3),
    eat: () => norm(mix(...[0, 0.25, 0.5, 0.75].map(t0 => at(bp(gen(0.12, t => noise() * env(t, 0.01, 30)), 1400, 1), t0))), 0.35),
    drink: () => norm(mix(...[0, 0.3, 0.6].map(t0 => at(osc(0.2, t => 300 + Math.sin(t * 60) * 60, Math.sin, t => env(t, 0.02, 12)), t0))), 0.35),
    medkit: () => norm(mix(click(0, 2500), at(bp(gen(0.4, t => noise() * env(t, 0.02, 6)), 2000, 1), 0.1)), 0.35),
    bandage: () => norm(bp(gen(0.9, t => noise() * (0.5 + 0.5 * Math.sin(t * 40)) * env(t, 0.05, 2)), 2500, 0.8), 0.3),
    art: () => norm(mix(osc(0.6, t => 440 + t * 300, Math.sin, t => env(t, 0.05, 4)), gain(osc(0.6, t => 660 + t * 400, Math.sin, t => env(t, 0.05, 4)), 0.6)), 0.3),
    stash: () => norm(mix(bp(gen(0.4, t => noise() * env(t, 0.05, 6)), 900, 0.6), click(0.25, 1500)), 0.35),
    thunder: () => norm(mix(lp(gen(4, t => noise() * env(t, 0.05, 0.9) * (0.7 + 0.3 * Math.sin(t * 7))), 250), gain(lp(gen(2, t => noise() * env(t, 0.005, 3)), 1200), 0.5))),
    // anomalies
    an_springboard_charge: () => norm(osc(0.3, t => 60 + t * 80, Math.sin, t => Math.min(1, t * 5)), 0.4),
    an_springboard: () => norm(mix(thump(0.5, 90, 30, 6), gain(lp(gen(0.6, t => noise() * env(t, 0.01, 6)), 400), 0.8))),
    an_whirligig_charge: () => norm(mix(bp(gen(1.2, t => noise() * Math.min(1, t * 2)), t => 200 + t * 600, 2), gain(osc(1.2, t => 40 + t * 60, saw, () => 0.3), 0.5)), 0.6),
    an_whirligig: () => norm(mix(thump(0.7, 120, 30, 5), gain(lp(gen(0.9, t => noise() * env(t, 0.01, 4)), 700), 0.9))),
    an_burner_charge: () => norm(bp(gen(0.2, t => noise() * Math.min(1, t * 10)), 400, 0.8), 0.4),
    an_burner: () => norm(mix(lp(gen(1.3, t => noise() * (t < 1.1 ? 1 : Math.max(0, 1 - (t - 1.1) * 5))), 900), gain(osc(1.3, t => 70 + Math.sin(t * 30) * 10, saw, () => 0.2), 0.4)), 0.7),
    an_electro_charge: () => norm(hp(gen(0.1, t => noise() * Math.min(1, t * 20)), 3000), 0.3),
    an_electro: () => norm(mix(hp(gen(0.5, t => noise() * env(t, 0.005, 7) * (rnd() < 0.3 ? 1 : 0.3)), 1500), gain(osc(0.5, () => 100, sq, t => env(t, 0.005, 6)), 0.5))),
    an_acid: () => norm(mix(...[0, 0.1, 0.25].map(t0 => at(osc(0.08, t => 500 + t * 2000, Math.sin, t => Math.exp(-t * 40)), t0))), 0.3),
    // humans
    hurt_h: () => norm(voice(0.3, t => 140 - t * 100, [[520, 4, 1], [980, 5, 0.45]], t => env(t, 0.02, 10), 0.05), 0.55),
    hurt_b: () => norm(voice(0.3, t => 120 - t * 80, [[480, 4, 1], [900, 5, 0.45]], t => env(t, 0.02, 10), 0.08), 0.55),
    die_h: () => norm(voice(0.9, t => 150 - t * 110, [[560, 4, 1], [1000, 5, 0.5]], t => env(t, 0.03, 3), 0.05), 0.65),
    die_b: () => norm(voice(0.9, t => 125 - t * 80, [[500, 4, 1], [950, 5, 0.5]], t => env(t, 0.03, 3), 0.08), 0.65),
    bark_0: () => norm(voice(0.8, t => 125 + Math.sin(t * 13) * 20, [[600, 5, 1], [1200, 6, 0.5]], t => env(t, 0.03, 3) * (0.6 + 0.4 * Math.abs(Math.sin(t * 17))), 0.03), 0.4),
    bark_1: () => norm(voice(0.7, t => 110 + Math.sin(t * 11) * 25, [[520, 5, 1], [1050, 6, 0.5]], t => env(t, 0.03, 3.5) * (0.6 + 0.4 * Math.abs(Math.sin(t * 19))), 0.05), 0.4),
    bark_2: () => norm(voice(0.7, t => 130 + Math.sin(t * 9) * 15, [[580, 5, 1], [1150, 6, 0.5]], t => env(t, 0.02, 4) * (0.6 + 0.4 * Math.abs(Math.sin(t * 22))), 0.02), 0.4),
    // mutants
    m_idle_dog: () => norm(voice(0.6, t => 250 + Math.sin(t * 30) * 30, [[600, 3, 1]], t => env(t, 0.05, 4) * 0.8, 0.2), 0.45),
    m_alert_dog: () => norm(mix(dogBark(520), at(dogBark(480), 0.3)), 0.7),
    m_attack_dog: () => norm(mix(dogBark(600), gain(burst(0.1, 40, 2500), 0.5)), 0.7),
    m_hurt_dog: () => norm(osc(0.3, t => 1200 - t * 1500, Math.sin, t => env(t, 0.01, 8)), 0.5),
    m_die_dog: () => norm(osc(0.6, t => 900 - t * 900, Math.sin, t => env(t, 0.01, 4)), 0.5),
    m_idle_pseudodog: () => norm(voice(0.9, t => 160 + Math.sin(t * 20) * 20, [[450, 3, 1], [900, 4, 0.5]], t => env(t, 0.05, 2.5), 0.25), 0.5),
    m_alert_pseudodog: () => norm(voice(1.6, t => 300 + Math.sin(t * 3) * 60, [[800, 5, 1], [1600, 6, 0.4]], t => Math.min(1, t * 4) * Math.max(0, 1 - (t - 1.2) * 2.5), 0.02), 0.6),
    m_attack_pseudodog: () => norm(mix(dogBark(380), gain(burst(0.12, 30, 2000), 0.5)), 0.75),
    m_hurt_pseudodog: () => norm(osc(0.35, t => 800 - t * 900, Math.sin, t => env(t, 0.01, 7)), 0.5),
    m_die_pseudodog: () => norm(voice(0.9, t => 200 - t * 150, [[500, 3, 1]], t => env(t, 0.02, 3), 0.2), 0.6),
    m_idle_flesh: () => norm(voice(0.8, t => 70 + Math.sin(t * 8) * 10, [[300, 3, 1], [700, 4, 0.4]], t => env(t, 0.1, 2.5), 0.3), 0.5),
    m_alert_flesh: () => norm(voice(0.9, t => 90 + t * 60, [[350, 3, 1], [800, 4, 0.5]], t => env(t, 0.05, 2.5), 0.3), 0.6),
    m_attack_flesh: () => norm(mix(voice(0.4, () => 100, [[400, 3, 1]], t => env(t, 0.02, 6), 0.3), gain(burst(0.1, 30, 1200), 0.6)), 0.65),
    m_hurt_flesh: () => norm(voice(0.4, t => 160 - t * 100, [[450, 3, 1]], t => env(t, 0.02, 7), 0.3), 0.55),
    m_die_flesh: () => norm(voice(1.1, t => 110 - t * 60, [[350, 3, 1], [700, 4, 0.4]], t => env(t, 0.05, 2.2), 0.3), 0.65),
    m_idle_boar: () => norm(voice(0.5, t => 90 + Math.sin(t * 25) * 20, [[400, 3, 1], [900, 4, 0.4]], t => env(t, 0.03, 5), 0.4), 0.5),
    m_alert_boar: () => norm(voice(0.9, t => 250 + t * 300, [[900, 4, 1], [1800, 5, 0.5]], t => env(t, 0.03, 3), 0.1), 0.6),
    m_attack_boar: () => norm(mix(thump(0.3, 140, 50, 10), gain(voice(0.4, () => 180, [[600, 3, 1]], t => env(t, 0.02, 6), 0.3), 0.7))),
    m_hurt_boar: () => norm(voice(0.4, t => 300 - t * 200, [[800, 4, 1]], t => env(t, 0.02, 7), 0.2), 0.55),
    m_die_boar: () => norm(voice(1.2, t => 220 - t * 150, [[700, 4, 1], [1400, 5, 0.4]], t => env(t, 0.03, 2.2), 0.2), 0.65),
    m_idle_bloodsucker: () => norm(mix(voice(1.2, t => 55 + Math.sin(t * 4) * 5, [[250, 2, 1], [600, 3, 0.5]], t => env(t, 0.2, 1.5), 0.4), gain(bp(gen(1.2, t => noise() * env(t, 0.2, 2)), 500, 1), 0.3)), 0.55),
    m_alert_bloodsucker: () => norm(mix(voice(1.4, t => 70 + t * 40, [[300, 2, 1], [700, 3, 0.6]], t => env(t, 0.1, 1.6), 0.35), gain(hp(gen(1.4, t => noise() * env(t, 0.1, 2)), 2000), 0.3)), 0.7),
    m_attack_bloodsucker: () => norm(mix(voice(0.5, () => 90, [[350, 2, 1]], t => env(t, 0.02, 5), 0.4), gain(burst(0.2, 20, 1500), 0.6)), 0.75),
    m_hurt_bloodsucker: () => norm(voice(0.5, t => 140 - t * 60, [[400, 3, 1]], t => env(t, 0.02, 5), 0.3), 0.6),
    m_die_bloodsucker: () => norm(voice(1.8, t => 90 - t * 40, [[300, 2, 1], [650, 3, 0.5]], t => env(t, 0.05, 1.6), 0.4), 0.7),
    // ambient one-shots
    amb_howl: () => norm(voice(3, t => 330 + Math.sin(t * 1.5) * 90 - t * 30, [[800, 6, 1], [1600, 8, 0.3]], t => Math.min(1, t) * Math.max(0, 1 - (t - 2) * 1), 0.01), 0.5),
    amb_crow: () => norm(mix(voice(0.3, () => 700, [[1400, 4, 1], [2600, 5, 0.5]], t => env(t, 0.02, 8), 0.3), at(voice(0.3, () => 680, [[1400, 4, 1], [2600, 5, 0.5]], t => env(t, 0.02, 8), 0.3), 0.4)), 0.45),
    amb_shots: () => norm(mix(...[0, 0.15, 0.3, 0.9, 1.05].map(t0 => at(lp(gun(0.3, 25, 2000, 80, 20), 900), t0))), 0.5),
    amb_metal: () => norm(mix(osc(2.5, t => 180 + Math.sin(t * 2) * 30, saw, t => env(t, 0.5, 1.5) * 0.3), gain(bp(gen(2.5, t => noise() * env(t, 0.5, 1.5)), 600, 4), 0.5)), 0.4),
    amb_scream: () => norm(voice(1.8, t => 400 - t * 120 + Math.sin(t * 30) * 20, [[900, 5, 1], [1500, 6, 0.4]], t => env(t, 0.05, 1.6), 0.05), 0.4)
  };
  // looping beds
  const LOOPS = {
    wind: () => { const a = gen(6, t => noise() * (0.55 + 0.45 * Math.sin(t / 6 * TAU))); bp(a, 380, 0.5); return norm(a, 0.5); },
    rain: () => norm(hp(gen(4, () => noise()), 1500), 0.4),
    fire: () => norm(mix(lp(gen(4, () => noise() * 0.25), 600), ...Array.from({ length: 40 }, () => at(hp(gen(0.02, t => noise() * Math.exp(-t * 300)), 2000), rnd() * 3.9))), 0.5),
    guitar: guitarLoop
  };

  class Audio {
    constructor() {
      this.sfxVol = 0.8; this.musicVol = 0.5; this.ctx = null; this.buffers = {}; this.voices = []; this.recent = {}; this.listener = { x: 0, y: 0, z: 0, yaw: 0 };
      this.paused = false; this.loops = {}; this.musicOn = false; this.nextNote = 0; this.ambT = 20;
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
    applyVolume() { if (!this.ctx) return; this.sfx.gain.value = this.sfxVol; this.music.gain.value = this.musicVol * 0.5; }
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
        const far = /ak|pm|shotgun|mp5|explosion|an_/.test(name) ? 30 : 12;
        g *= 1 / (1 + Math.pow(dist / far, 1.4)); if (g < 0.01) return;
        const ang = Math.atan2(dx, dz) - L.yaw; pan = -Math.sin(ang) * Math.min(1, dist / 3) * 0.85;
      }
      this.voices = this.voices.filter(v => v.end > now);
      if (this.voices.length > 36) { const q = this.voices.sort((a, b2) => a.g - b2.g)[0]; if (q.g > g) return; try { q.src.stop(); } catch (_) {} this.voices.splice(this.voices.indexOf(q), 1); }
      const src = this.ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = rate || (/^(step|ui|geiger|detector|pda|task)/.test(name) ? 1 : 0.93 + Math.random() * 0.14);
      let node = src;
      if (dist > 60) { const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = Math.max(500, 4000 - dist * 20); src.connect(f); node = f; }
      const gn = this.ctx.createGain(); gn.gain.value = g; node.connect(gn);
      let out = gn;
      if (this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = pan; gn.connect(p); out = p; }
      out.connect(this.sfx); src.start();
      this.voices.push({ src, g, end: now + b.duration / src.playbackRate.value });
    }
    // looping bed with a target gain (0 = silent)
    loop(name, vol, dest) {
      if (!this.ctx) return;
      let L = this.loops[name];
      if (!L) {
        if (vol <= 0.001) return;
        const b = this.buffer(name); if (!b) return;
        const src = this.ctx.createBufferSource(); src.buffer = b; src.loop = true; const g = this.ctx.createGain(); g.gain.value = 0;
        src.connect(g); g.connect(dest || this.sfx); src.start(); L = this.loops[name] = { src, g };
      }
      L.g.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.4);
    }
    stopLoops() { for (const k in this.loops) { try { this.loops[k].src.stop(); } catch (_) {} } this.loops = {}; }
    note(t, freq, dur, type, vol, cutoff) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(1.5, dur * 0.35)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let n = o; if (cutoff) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; o.connect(f); n = f; }
      n.connect(g); g.connect(this.music); o.start(t); o.stop(t + dur + 0.05);
    }
    startMusic(kind = 'game') { if (!this.init()) return; this.musicOn = true; this.musicKind = kind; this.nextNote = this.ctx.currentTime + 0.5; this.bar = 0; }
    stopMusic() { this.musicOn = false; }
    // env: { wind, rain, fire (0..1), guitar (0..1), night, outdoor }
    update(env = {}) {
      if (!this.ctx || this.paused) return;
      this.loop('wind', (env.wind == null ? 0.25 : env.wind) * (env.outdoor === false ? 0.3 : 1));
      this.loop('rain', (env.rain || 0) * 0.45 * (env.outdoor === false ? 0.4 : 1));
      this.loop('fire', (env.fire || 0) * 0.5);
      this.loop('guitar', (env.guitar || 0) * 0.55);
      // sparse ambient score: low drones and a lonely guitar-like motif
      if (this.musicOn) {
        const now = this.ctx.currentTime;
        if (this.nextNote < now - 1) this.nextNote = now + 0.2;
        while (this.nextNote < now + 0.5) {
          const t = this.nextNote, roots = this.musicKind === 'menu' ? [45, 41, 43, 40] : [38, 41, 36, 40], root = roots[this.bar % 4];
          this.note(t, mtof(root - 12), 7.5, 'triangle', 0.05, 400); this.note(t, mtof(root - 5), 7.5, 'sine', 0.03);
          if (this.musicKind === 'menu' || Math.random() < 0.5) { const sc = [0, 3, 5, 7, 10, 12]; for (let i = 0; i < 4; i++) if (Math.random() < 0.7) this.note(t + 1 + i * 1.3 + Math.random() * 0.3, mtof(root + 12 + sc[Math.floor(Math.random() * sc.length)]), 2.2, 'triangle', 0.025, 1800); }
          this.nextNote += 8; this.bar++;
        }
      }
      // random distant sounds of the Zone
      if (env.ambient !== false) {
        this.ambT -= 1 / 60;
        if (this.ambT <= 0) {
          this.ambT = 15 + Math.random() * 30;
          const L = this.listener, a = Math.random() * TAU, d = 60 + Math.random() * 100;
          const list = env.night ? ['amb_howl', 'amb_howl', 'amb_scream', 'amb_metal', 'amb_shots'] : ['amb_crow', 'amb_crow', 'amb_shots', 'amb_metal', 'amb_howl'];
          this.play(list[Math.floor(Math.random() * list.length)], L.x + Math.sin(a) * d, L.y + 5, L.z + Math.cos(a) * d, 1.2);
        }
      }
    }
    pause(p) { this.paused = p; if (this.ctx) { if (p) this.ctx.suspend().catch(() => {}); else this.ctx.resume().catch(() => {}); } }
    destroy() { this.musicOn = false; this.stopLoops(); if (this.ctx) { try { this.ctx.close(); } catch (_) {} } this.ctx = null; }
  }

  S.SFX = SFX; S.LOOPS = LOOPS; S.Audio = Audio; S.SR = SR;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Stalker98 = globalThis.Stalker98 || {});
