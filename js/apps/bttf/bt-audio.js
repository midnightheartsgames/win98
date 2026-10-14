(function (S, B) {
  'use strict';
  const SFX = S.SFX;
  const hz = S.midiHz;

  function power(o, t, root, dur, pk) {
    for (const iv of [0, 7, 12]) {
      o('sawtooth', hz(root + iv), t, dur, pk, null, { lp: 2400, det: 7 });
      o('square', hz(root + iv), t, dur, pk * 0.6, null, { lp: 1600, det: -9 });
    }
  }

  SFX.bt_chord = (o, n, t) => { power(o, t, 40, 1.1, 0.07); n(t, 0.05, 0.12, 'highpass', 3000); };
  SFX.bt_blast = (o, n, t) => {
    power(o, t, 40, 1.6, 0.12);
    n(t, 1.8, 0.8, 'lowpass', 1600, null, { to: 160 });
    o('sine', 70, t, 1.2, 0.7, null, { to: 30 });
  };
  SFX.bt_boom = (o, n, t) => {
    n(t, 0.08, 0.6, 'highpass', 2600);
    o('sine', 64, t, 0.9, 0.9, null, { to: 28 });
    n(t + 0.02, 1.4, 0.55, 'lowpass', 900, null, { to: 90 });
  };
  SFX.bt_crack = (o, n, t) => { n(t, 0.06, 0.5, 'highpass', 2400); o('square', 300, t, 0.04, 0.08, null, { to: 160 }); };
  SFX.bt_click = (o, n, t) => { o('square', 1800, t, 0.02, 0.06); o('square', 1200, t + 0.05, 0.02, 0.05); };
  SFX.bt_flux = (o, n, t) => {
    o('sawtooth', 55, t, 1.3, 0.08, null, { lp: 320, a: 0.3, to: 110 });
    o('sine', 220, t, 1.3, 0.04, null, { a: 0.3, to: 440 });
    n(t, 1.3, 0.03, 'bandpass', 800, null, { a: 0.4, to: 2400, q: 4 });
  };
  SFX.bt_gullwing = (o, n, t) => { n(t, 0.5, 0.12, 'bandpass', 600, null, { to: 2600, q: 2, a: 0.05 }); o('square', 180, t + 0.5, 0.05, 0.05); };
  SFX.bt_skate = (o, n, t) => { n(t, 2.8, 0.08, 'lowpass', 420, null, { a: 0.2 }); for (const dt of [0.5, 1.3, 2.1]) n(t + dt, 0.04, 0.1, 'bandpass', 1500); };
  SFX.bt_paper = (o, n, t) => { for (let i = 0; i < 5; i++) n(t + i * 0.06, 0.08, 0.06, 'highpass', 3000 + i * 400); };
  SFX.bt_rewind = (o, n, t) => { o('square', 600, t, 0.6, 0.03, null, { to: 2400, lp: 3000 }); n(t, 0.6, 0.03, 'bandpass', 2000); o('square', 1200, t + 0.65, 0.03, 0.06); };
  SFX.bt_barrels = (o, n, t) => { for (let i = 0; i < 6; i++) o('sine', 70 + i * 3, t + i * 0.22, 0.25, 0.25, null, { to: 45 }); n(t, 1.6, 0.06, 'lowpass', 260, null, { a: 0.2 }); };
  SFX.bt_bellows = (o, n, t) => n(t, 0.35, 0.12, 'bandpass', 500, null, { a: 0.12, to: 900, q: 1.5 });
  SFX.bt_wheel = (o, n, t) => { for (let i = 0; i < 6; i++) n(t + i * 0.05, 0.02, 0.06, 'bandpass', 2600); };
  SFX.bt_plop = (o, n, t) => o('sine', 300, t, 0.12, 0.15, null, { to: 140 });
  SFX.bt_pocket = (o, n, t) => { n(t, 0.12, 0.08, 'bandpass', 900, null, { to: 1800, q: 2 }); };

  const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

  const QUAL = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], dim: [0, 3, 6], dim7: [0, 3, 6, 9], 6: [0, 4, 7, 9], m6: [0, 3, 7, 9], sus4: [0, 5, 7], sus2: [0, 2, 7], '7sus4': [0, 5, 7, 10], add9: [0, 4, 7, 14], aug: [0, 4, 8] };

  function chordOf(sym) {
    const m = sym.match(/^([A-G][b#]?)(.*)$/);
    return { root: NOTE[m[1]], iv: QUAL[m[2]] || QUAL[''] };
  }

  function midi(tok) {
    const m = tok.match(/^([A-G][b#]?)(-?\d)$/);
    return m ? NOTE[m[1]] + (parseInt(m[2], 10) + 1) * 12 : null;
  }

  function parse(str) {
    const ev = [];
    let pos = 0;
    for (const tok of str.split(/[\s|]+/)) {
      if (!tok) continue;
      const k = tok.lastIndexOf(':');
      const len = k < 0 ? 1 : parseFloat(tok.slice(k + 1));
      const v = k < 0 ? tok : tok.slice(0, k);
      if (v !== 'r') ev.push({ at: pos, len, v });
      pos += len;
    }
    return { ev, len: pos };
  }

  function sus(A, b, type, m, t, d, pk, op) {
    A.osc(type, hz(m), t, 0.08 + Math.min(0.5, d * 0.3), pk, b, Object.assign({ hold: Math.max(0, d * 0.75) }, op));
  }

  const PATCH = {
    brass(A, b, m, t, d, v) { sus(A, b, 'sawtooth', m, t, d, 0.045 * v, { lp: 2300, a: 0.035, vib: 5, vibD: 6 }); sus(A, b, 'sawtooth', m, t, d, 0.03 * v, { lp: 1500, a: 0.05, det: 9 }); },
    horn(A, b, m, t, d, v) { sus(A, b, 'sawtooth', m, t, d, 0.04 * v, { lp: 1100, a: 0.07, vib: 4.5, vibD: 5 }); sus(A, b, 'sine', m, t, d, 0.05 * v, { a: 0.06 }); },
    strings(A, b, m, t, d, v) { const a = Math.min(0.18, d * 0.3); for (const det of [-9, 9]) sus(A, b, 'sawtooth', m, t, d, 0.022 * v, { lp: 2400, a, det, vib: 5, vibD: 5 }); },
    lead(A, b, m, t, d, v) { sus(A, b, 'square', m, t, d, 0.055 * v, { lp: 3000, a: 0.012, vib: 5.5, vibD: 10 }); sus(A, b, 'sawtooth', m + 12, t, d, 0.014 * v, { lp: 2400, a: 0.02 }); },
    vox(A, b, m, t, d, v) { sus(A, b, 'square', m, t, d, 0.05 * v, { lp: 2200, a: 0.02, vib: 5.5, vibD: 14 }); sus(A, b, 'triangle', m, t, d, 0.06 * v, { a: 0.02, vib: 5.5, vibD: 14 }); },
    clar(A, b, m, t, d, v) { sus(A, b, 'square', m, t, d, 0.045 * v, { lp: 1500, a: 0.025, vib: 5, vibD: 8 }); },
    mute(A, b, m, t, d, v) { sus(A, b, 'sawtooth', m, t, d, 0.04 * v, { lp: 1200, a: 0.02, vib: 6, vibD: 10 }); sus(A, b, 'square', m, t, d, 0.02 * v, { lp: 900, a: 0.02 }); },
    bass(A, b, m, t, d, v) { sus(A, b, 'triangle', m, t, d * 0.9, 0.26 * v, { lp: 900 }); A.osc('square', hz(m), t, Math.min(d, 0.3), 0.035 * v, b, { lp: 420 }); },
    tuba(A, b, m, t, d, v) { sus(A, b, 'sawtooth', m, t, d * 0.8, 0.06 * v, { lp: 500, a: 0.02 }); sus(A, b, 'sine', m, t, d * 0.8, 0.2 * v, { a: 0.02 }); },
    synbass(A, b, m, t, d, v) { A.osc('sawtooth', hz(m), t, Math.max(0.12, d * 0.9), 0.1 * v, b, { lp: 900, lpTo: 260 }); sus(A, b, 'sine', m, t, d * 0.85, 0.17 * v, {}); },
    pluck(A, b, m, t, d, v) { A.osc('square', hz(m), t, Math.min(0.3, d + 0.05), 0.045 * v, b, { lp: 2600, lpTo: 500 }); },
    gtr(A, b, m, t, d, v) { for (const det of [-12, 12]) sus(A, b, 'sawtooth', m, t, d, 0.022 * v, { lp: 2600, a: 0.006, det }); sus(A, b, 'square', m - 12, t, d, 0.012 * v, { lp: 1200 }); },
    piano(A, b, m, t, d, v) { A.osc('triangle', hz(m), t, Math.min(1.4, 0.25 + d * 1.2), 0.085 * v, b, { a: 0.004 }); A.osc('sine', hz(m + 12), t, Math.min(0.8, 0.2 + d * 0.6), 0.02 * v, b, { a: 0.004 }); },
    bell(A, b, m, t, d, v) { A.osc('sine', hz(m), t, 1.1, 0.06 * v, b, { a: 0.003 }); A.osc('sine', hz(m + 12), t, 0.6, 0.025 * v, b, { a: 0.003 }); A.osc('sine', hz(m + 24), t, 0.3, 0.012 * v, b, { a: 0.003 }); },
    organ(A, b, m, t, d, v) { sus(A, b, 'square', m, t, d, 0.022 * v, { lp: 1400, a: 0.01 }); sus(A, b, 'sine', m, t, d, 0.04 * v, { a: 0.01 }); sus(A, b, 'sine', m + 12, t, d, 0.02 * v, { a: 0.01 }); },
    timp(A, b, m, t, d, v) { A.osc('sine', hz(m), t, 0.7, 0.28 * v, b, { to: hz(m) * 0.9 }); A.nz(t, 0.25, 0.05 * v, 'lowpass', 300, b); }
  };

  const DRUM = {
    k: (A, b, t, v) => A.osc('sine', 54, t, 0.17, 0.36 * v, b, { to: 38 }),
    s: (A, b, t, v) => { A.nz(t, 0.11, 0.13 * v, 'bandpass', 1900, b); A.nz(t, 0.05, 0.05 * v, 'highpass', 5000, b); },
    h: (A, b, t, v, e) => A.nz(t, e * 0.4, 0.022 * v, 'highpass', 8000, b),
    o: (A, b, t, v) => A.nz(t, 0.28, 0.03 * v, 'highpass', 7000, b),
    c: (A, b, t, v) => A.nz(t, 1.2, 0.1 * v, 'highpass', 5200, b),
    t: (A, b, t, v) => A.osc('sine', 150, t, 0.26, 0.26 * v, b, { to: 92 }),
    p: (A, b, t, v) => { for (const dt of [0, 0.012, 0.024]) A.nz(t + dt, 0.07, 0.07 * v, 'bandpass', 1300, b); },
    r: (A, b, t, v) => A.nz(t, 0.04, 0.06 * v, 'bandpass', 2400, b),
    b: (A, b, t, v) => A.nz(t, 0.14, 0.03 * v, 'bandpass', 3200, b, { a: 0.02 })
  };

  function compile(def) {
    const tracks = [];
    let total = 0;
    for (const tr of def.tracks) {
      const p = parse(tr.seq);
      const at = new Map();
      for (const ev of p.ev) { if (!at.has(ev.at)) at.set(ev.at, []); at.get(ev.at).push(ev); }
      tracks.push({ patch: tr.patch, vol: tr.vol || 1, pad: tr.patch === 'pad' || tr.patch === 'chords', at });
      total = Math.max(total, p.len);
    }
    const bar = def.bar || 16;
    const drums = [];
    for (const sec of def.drums || []) for (let i = 0; i < (sec.bars || 1); i++) drums.push(sec);
    total = Math.max(total, drums.length * bar);
    return { tracks, drums, bar, total, loop: def.loop || 0, dvol: def.dvol || 1 };
  }

  function playScore(A, th, step, t, e, bus) {
    const sc = th.bts;
    const s = step < sc.total ? step : sc.loop + (step - sc.loop) % (sc.total - sc.loop);
    for (const tr of sc.tracks) {
      const evs = tr.at.get(s);
      if (!evs) continue;
      for (const ev of evs) {
        const d = ev.len * e;
        if (tr.pad) {
          const ch = chordOf(ev.v);
          const base = tr.patch === 'chords' ? 48 : 60;
          for (const iv of ch.iv) PATCH[tr.patch === 'chords' ? 'piano' : 'strings'](A, bus, base + ch.root + iv, t, d, tr.vol * (tr.patch === 'chords' ? 0.6 : 0.55));
          continue;
        }
        for (const n of ev.v.split('+')) { const m = midi(n); if (m !== null) PATCH[tr.patch](A, bus, m, t, d, tr.vol); }
      }
    }
    const dr = sc.drums[Math.floor(s / sc.bar)];
    if (!dr) return;
    const pos = s % sc.bar;
    for (const k of Object.keys(DRUM)) if (dr[k] && dr[k][pos] === 'x') DRUM[k](A, bus, t, sc.dvol * (dr.v || 1), e);
  }

  S.STYLES.bts = { play: playScore };
  S.STYLES.btsw = { swing: true, play: playScore };

  B.score = function (id, def) {
    S.THEMES[id] = { bpm: def.grid === 8 ? def.bpm : def.bpm * 2, style: def.swing ? 'btsw' : 'bts', bts: compile(def) };
  };
  B.PATCH = PATCH;
  B.sfxId = id => (S.SFX['bt_' + id] ? 'bt_' + id : id);

  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
