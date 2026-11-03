(function () {
  const { V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, wobble } = K;
  const Rig = window.YouVidRig;
  const W = window.StairsWorld;

  const ID = 'St41rsD4nc3';
  const DURATION = 91.718;
  const CUTS = [0, 0.167, 9.676, 11.053, 23.482, 28.403, 31.49, 33.617, 36.578, 40.082, 41.375, 43.794, 48.423, 50.759, 52.761, 55.097, 56.515, 67.234, 69.403, 78.328, 82.958, 87.963];

  const RAW = (window.YouVidMotion || {})[ID + ':joker'];
  const CAMS = (window.YouVidMotion || {})[ID + ':cams'] || {};
  const MOTION = Rig.motion(RAW);
  const POS_CH = [0, 1, 2].concat(Array.from({ length: 24 }, (_, i) => 15 + i));

  function motionAt(t) {
    const v = MOTION(t);
    if (!v) return null;
    const seg = RAW.segs.find(g => t >= g.t0 && t < g.t1);
    if (seg && seg.o) POS_CH.forEach(i => { v[i] += seg.o[i % 3]; });
    return v;
  }

  function mcam(name, fallback) {
    return (t, a) => {
      const c = CAMS[name];
      if (!c) return fallback(t, a);
      const u = clamp((t - c.t0) / (c.t1 - c.t0), 0, 1);
      const eye = c.eye1 ? c.eye0.map((v, i) => lerp(v, c.eye1[i], u)) : c.eye0;
      const at = c.at1 ? c.at0.map((v, i) => lerp(v, c.at1[i], u)) : c.at0;
      return { eye, at, fov: c.fov, up: c.up };
    };
  }

  const ENV = {
    stairs: { sunDir: [-0.25, -1, 0.35], sunColor: [0.34, 0.35, 0.34], ambTop: [0.74, 0.8, 0.8], ambBottom: [0.3, 0.32, 0.32], fogColor: [0.86, 0.92, 0.9], fogNear: 30, fogFar: 170 },
    shade: { sunDir: [-0.25, -1, 0.35], sunColor: [0.22, 0.23, 0.22], ambTop: [0.56, 0.62, 0.63], ambBottom: [0.22, 0.24, 0.25], fogColor: [0.86, 0.92, 0.9], fogNear: 30, fogFar: 170 },
    hall: { sunDir: [0, -1, 0], sunColor: [0.1, 0.16, 0.17], ambTop: [0.3, 0.46, 0.48], ambBottom: [0.08, 0.11, 0.11], fogColor: [0.03, 0.05, 0.05], fogNear: 4, fogFar: 30, points: [{ pos: [0, 2.5, -2.0], color: [0.5, 0.8, 0.84] }, { pos: [0, 2.5, -5.4], color: [0.55, 0.9, 0.95] }] },
    door: { sunDir: [0.3, -0.6, -0.6], sunColor: [0.22, 0.2, 0.16], ambTop: [0.3, 0.3, 0.26], ambBottom: [0.1, 0.1, 0.08], fogColor: [0, 0, 0], fogNear: 10, fogFar: 40 },
    lift: { sunDir: [0, -1, -0.35], sunColor: [0.34, 0.27, 0.18], ambTop: [0.16, 0.12, 0.08], ambBottom: [0.04, 0.03, 0.02], fogColor: [0.01, 0.01, 0.01], fogNear: 6, fogFar: 30, points: [{ pos: [0, 2.3, -1.2], color: [1.3, 1.0, 0.62] }, { pos: [0.1, 1.75, 0.6], color: [0.7, 0.66, 0.58] }] },
    avenue: { sunDir: [-0.3, -1, -0.3], sunColor: [0.3, 0.31, 0.3], ambTop: [0.7, 0.74, 0.72], ambBottom: [0.3, 0.31, 0.3], fogColor: [0.74, 0.8, 0.8], fogNear: 18, fogFar: 120 }
  };

  const GRADE = {
    stairs: { grade: [0.98, 1.02, 1.02, 0.28], add: [-0.02, 0.0, 0.012] },
    hall: { grade: [0.92, 1.05, 1.06, 0.2], add: [0.0, 0.01, 0.015] },
    lift: { grade: [1.08, 0.98, 0.86, 0.12], add: [0.0, 0.0, 0.0] },
    door: { grade: [1.0, 1.0, 0.94, 0.2], add: [0.0, 0.0, 0.0] },
    avenue: { grade: [1.0, 1.02, 0.98, 0.22], add: [-0.01, 0.0, 0.01] }
  };

  const HANG = (k) => [k * 0.2, -0.3, 0.03];

  function walkPose(t, o) {
    const u = clamp((t - o.t0) / (o.t1 - o.t0), 0, 1);
    const x = lerp(o.from[0], o.to[0], u), z = lerp(o.from[1], o.to[1], u);
    const moving = u > 0 && u < 1 ? 1 : 0;
    const ph = (t - o.t0) * (o.cadence || 0.9) * 2 * PI;
    const stride = (o.stride || 0.26) * moving;
    const lift = (k) => Math.max(0, S(ph + (k > 0 ? 0 : PI))) * 0.07 * moving;
    const y = (o.y || 0) + 0.985 + 0.012 * C(ph * 2) * moving;
    const sw = S(ph) * moving;
    return {
      pos: [x, y, z],
      yaw: o.yaw,
      fL: [0.1, -0.93 + lift(1), stride * sw + 0.03],
      fR: [-0.1, -0.93 + lift(-1), -stride * sw + 0.03],
      hL: [0.19, -0.3, 0.03 - 0.1 * sw * (o.arms === undefined ? 1 : o.arms)],
      hR: [-0.19, -0.3, 0.03 + 0.1 * sw * (o.arms === undefined ? 1 : o.arms)],
      sp: [0.04, 0.05 * sw, 0],
      nk: o.nk || [0.05, 0, 0]
    };
  }

  function keyed(list) {
    return (t) => {
      if (t <= list[0][0]) return list[0][1];
      for (let i = 1; i < list.length; i++) {
        if (t < list[i][0]) {
          const [t0, a] = list[i - 1];
          const [t1, b] = list[i];
          const k = ease((t - t0) / (t1 - t0));
          const out = {};
          Object.keys(b).forEach(key => {
            const va = a[key], vb = b[key];
            if (Array.isArray(vb) && Array.isArray(va)) out[key] = vb.map((v, j) => lerp(va[j], v, k));
            else if (typeof vb === 'number' && typeof va === 'number') out[key] = lerp(va, vb, k);
            else out[key] = k < 0.5 && va !== undefined ? va : vb;
          });
          Object.keys(a).forEach(key => { if (!(key in out)) out[key] = a[key]; });
          return out;
        }
      }
      return list[list.length - 1][1];
    };
  }

  function footOn(t, plan, x) {
    for (let i = 0; i < plan.length; i++) {
      const [a, b, s] = plan[i];
      if (t <= b || i === plan.length - 1) {
        if (t >= a || i === 0) return [x, W.stepY(s) + 0.09, -s];
        const [, pb, ps] = plan[i - 1];
        const k = ease((t - pb) / (a - pb));
        const sm = lerp(ps, s, k);
        const lift = S(k * PI) * 0.16;
        return [x, Math.max(W.stepY(ps), W.stepY(s)) + 0.09 + lift, -sm];
      }
    }
    return [x, W.stepY(plan[0][2]) + 0.09, -plan[0][2]];
  }

  function stepsDown(t, o) {
    const u = clamp((t - o.t0) / (o.t1 - o.t0), 0, 1);
    const s = lerp(o.s0, o.s1, u);
    const fL = footOn(t, o.left, o.x + 0.11);
    const fR = footOn(t, o.right, o.x - 0.11);
    const low = Math.min(fL[1], fR[1]);
    return {
      pos: [o.x, low - 0.09 + 0.97 + 0.03 * S(u * PI * 4), -s],
      yaw: o.yaw,
      sp: [0.06, 0.08 * S(u * PI * 3), 0],
      fLw: fL,
      fRw: fR,
      kLw: [fL[0] + 0.05, fL[1] + 0.5, fL[2] + 0.4],
      kRw: [fR[0] - 0.05, fR[1] + 0.5, fR[2] + 0.4],
      hL: [0.28, -0.1, 0.12],
      hR: [-0.28, -0.12, 0.12]
    };
  }

  function stairPos(x, s, h) {
    return [x, W.stepY(s) + (h === undefined ? 0.985 : h), -s];
  }

  const DANCE_DEFAULT = (t, at, yaw) => {
    const b = S(t * PI * 2.1);
    return {
      pos: at,
      yaw: yaw + 0.3 * S(t * 1.3),
      lean: 0.05,
      hL: [0.32 + 0.1 * b, 0.05 + 0.2 * S(t * 4.1), 0.18],
      hR: [-0.32 - 0.1 * b, 0.0 + 0.2 * S(t * 3.7 + 1), 0.16],
      eL: [0.6, 0.0, -0.4],
      eR: [-0.6, 0.0, -0.4],
      fL: [0.12, -0.92 + 0.06 * Math.max(0, b), 0.08],
      fR: [-0.12, -0.92 + 0.06 * Math.max(0, -b), -0.04],
      sp: [0.05, 0.15 * b, 0],
      nk: [0.0, -0.1 * b, 0.05 * b]
    };
  };

  const LIFT_POSE = keyed([
    [11.05, { pos: [-0.12, 0.985, 0.55], yaw: PI, sp: [0.05, 0, 0], nk: [0.12, 0, 0], hL: HANG(1), hR: HANG(-1), fL: [0.1, -0.93, 0.03], fR: [-0.1, -0.93, 0.03] }],
    [12.4, { pos: [-0.05, 0.985, -0.35], yaw: PI, sp: [0.04, 0, 0], nk: [0.08, 0, 0], hL: HANG(1), hR: HANG(-1), fL: [0.1, -0.93, 0.03], fR: [-0.1, -0.93, 0.03] }],
    [13.6, { pos: [0.08, 0.985, -0.7], yaw: PI + 0.15, sp: [0.04, 0, 0], nk: [0.06, 0, 0], hL: HANG(1), hR: HANG(-1), fL: [0.1, -0.93, 0.03], fR: [-0.1, -0.93, 0.03] }],
    [15.3, { pos: [0.02, 0.985, -0.78], yaw: PI + 0.1, sp: [0.04, 0, 0], nk: [0.08, 0, 0], hL: HANG(1), hR: HANG(-1), fL: [0.1, -0.93, 0.03], fR: [-0.1, -0.93, 0.03] }],
    [16.2, { pos: [0.0, 0.985, -0.8], yaw: PI * 1.5, sp: [0.03, 0.2, 0], nk: [0.04, 0.25, 0], hL: HANG(1), hR: HANG(-1), fL: [0.1, -0.93, 0.0], fR: [-0.1, -0.93, 0.06] }],
    [17.0, { pos: [0.0, 0.985, -0.82], yaw: PI * 2, sp: [0.02, 0, 0], nk: [0.02, 0, 0], hL: HANG(1), hR: HANG(-1), fL: [0.11, -0.93, 0.03], fR: [-0.11, -0.93, 0.03] }],
    [23.4, { pos: [0.0, 0.985, -0.82], yaw: PI * 2, sp: [0.02, 0, 0], nk: [0.05, 0, 0], hL: HANG(1), hR: HANG(-1), fL: [0.11, -0.93, 0.03], fR: [-0.11, -0.93, 0.03] }]
  ]);

  const SMOKE_PAN = K.keys([[69.4, 0.15], [70.1, 0.02], [70.8, -0.14], [71.5, -0.13], [72.1, -0.03], [74.4, 0.0], [75.4, 0.06], [78.4, 0.06]]);

  const SMOKE_POSE = keyed([
    [69.4, { pos: [0.02, 1.0, 0], yaw: -0.42, lean: 0.03, sp: [0.05, -0.05, 0], nk: [0.06, -0.08, 0.08], hR: [0.06, 0.16, 0.2], eR: [-0.5, -0.4, -0.2], gR: 'pinch', hL: HANG(1) }],
    [72.4, { pos: [0.02, 1.0, 0], yaw: -0.4, lean: 0.03, sp: [0.05, -0.05, 0], nk: [0.1, -0.05, 0.08], hR: [0.04, 0.17, 0.2], eR: [-0.5, -0.4, -0.2], gR: 'pinch', hL: HANG(1) }],
    [73.7, { pos: [0.02, 1.0, 0], yaw: -0.38, lean: 0.02, sp: [0.03, -0.05, 0], nk: [0.02, -0.02, 0.06], hR: [0.02, 0.15, 0.2], eR: [-0.5, -0.4, -0.2], gR: 'pinch', hL: HANG(1) }],
    [74.6, { pos: [0.02, 1.0, 0], yaw: -0.36, lean: -0.06, sp: [-0.18, 0.0, 0], nk: [-0.8, 0.0, 0.05], hR: [-0.22, -0.1, 0.16], eR: [-0.6, -0.3, -0.2], gR: 'relax', hL: [0.3, 0.05, 0.12] }],
    [78.4, { pos: [0.02, 1.0, 0], yaw: -0.35, lean: -0.08, sp: [-0.2, 0.0, 0], nk: [-0.88, 0.0, 0.04], hR: [-0.22, -0.1, 0.16], eR: [-0.6, -0.3, -0.2], gR: 'relax', hL: [0.32, 0.1, 0.12] }]
  ]);

  const SHOTS = [
    { t0: 0, t1: 0.167, set: 'black' },
    {
      t0: 0.167, t1: 9.676, set: 'hall', env: 'hall', grade: 'hall', fade: [[3.05, 1], [3.4, 0]], blur: 2.2,
      actor: (t) => Object.assign(walkPose(t, { t0: 0.0, t1: 9.7, from: [0, -0.3], to: [0, -4.4], yaw: PI, cadence: 0.62, stride: 0.2, arms: 0.4 }), { mess: 0.2, hairGravity: 0.6 }),
      cam: (t, a) => {
        const h = a.head;
        const w = wobble(t * 0.7, 0.012, 3);
        return { eye: [h[0] + 0.05 + w[0], h[1] + 0.02 + w[1], h[2] + 0.46], at: [h[0] - 0.02, h[1] - 0.16, h[2] - 3], fov: 42 };
      },
      bgBlur: 2.4
    },
    {
      t0: 9.676, t1: 11.053, set: 'door', env: 'door', grade: 'door',
      actor: (t) => {
        const u = ease((t - 9.68) / 1.2);
        return { pos: [-0.78, 0.985, 0.22], yaw: PI - 0.25, sp: [0.08, -0.15, 0], hRw: [-0.3 + 0.1 * u, 1.0 + 0.01 * u, 0.06], eRw: [-0.45, 0.85, 0.35], gR: 'flat', wR: [0.0, 0.0, -0.6], hL: HANG(1), fL: [0.1, -0.93, 0.03], fR: [-0.1, -0.93, 0.03] };
      },
      cam: (t) => ({ eye: [0.03, 1.15, 0.5], at: [0.03 + 0.01 * (t - 10), 1.12, 0], fov: 38 })
    },
    {
      t0: 11.053, t1: 23.482, set: 'lift', env: 'lift', grade: 'lift',
      setOpts: (t) => ({ door: clamp(ease((t - 21.3) / 1.9) * 1.04, 0, 1) }),
      actor: (t) => Object.assign(LIFT_POSE(t), { mess: 0.1, hairGravity: 0.5 }),
      cam: (t, a) => {
        const k = ease((t - 11.05) / 2.4);
        const push = ease((t - 17.5) / 5.5);
        const w = wobble(t * 0.5, 0.008, 9);
        return { eye: [0.04 + w[0], 1.64 + w[1], lerp(1.45, 0.42, k) - 0.32 * push], at: [0.02, lerp(1.3, 1.52, k), -1.6], fov: 34 };
      },
      fadeOut: [[22.6, 0], [23.25, 1]]
    },
    {
      t0: 23.482, t1: 28.403, set: 'stairs', env: 'stairs', grade: 'stairs', flare: true, mocap: 'street', extra: () => ({ mess: 1 }),
      actor: (t) => DANCE_DEFAULT(t, stairPos(0.2, lerp(26.4, 22.5, (t - 23.5) / 4.9)), 0),
      cam: mcam('street', (t) => {
        const k = ease((t - 23.5) / 4.6);
        return { eye: [0.3, 1.55, 7.5], at: [0.0, lerp(14, 9.0, k), -20], fov: 46 };
      })
    },
    {
      t0: 28.403, t1: 31.49, set: 'stairs', env: 'stairs', grade: 'stairs', bgBlur: 3.0, smoke: 'mcu', mocap: 'mcu', extra: () => ({ mess: 1, cig: [-0.55, -0.6, 0.15] }),
      actor: (t) => Object.assign(DANCE_DEFAULT(t, stairPos(0.3, 21.0), -0.35), { cig: [-0.55, -0.6, 0.15], gR: 'pinch' }),
      cam: mcam('mcu', () => ({ eye: stairPos(0.55, 19.4, 1.25), at: stairPos(0.2, 21.0, 1.45), fov: 40 }))
    },
    {
      t0: 31.49, t1: 33.617, set: 'stairs', env: 'stairs', grade: 'stairs', mocap: 'side', extra: () => ({ mess: 1 }),
      actor: (t) => DANCE_DEFAULT(t, stairPos(-1.0, 13.5), PI / 2),
      cam: mcam('side', () => ({ eye: [-1.6, W.stepY(9.5) + 1.2, -9.5], at: [-0.9, W.stepY(13.5) + 1.4, -13.5], fov: 40 }))
    },
    {
      t0: 33.617, t1: 36.578, set: 'stairs', env: 'stairs', grade: 'stairs', mocap: 'high', extra: () => ({ mess: 1 }),
      actor: (t) => DANCE_DEFAULT(t, stairPos(-0.5, 5.3), PI),
      cam: mcam('high', () => ({ eye: [0.3, W.stepY(9.6) + 1.7, -9.6], at: [-0.2, 0.5, 4], fov: 46 }))
    },
    {
      t0: 36.578, t1: 40.082, set: 'stairs', env: 'stairs', grade: 'stairs', mocap: 'wide1', extra: () => ({ mess: 1 }),
      actor: (t) => DANCE_DEFAULT(t, stairPos(0.1, 20.2), 0),
      cam: mcam('wide1', () => ({ eye: [0.1, W.stepY(16.5) + 0.75, -16.5], at: [0.0, W.stepY(22) + 1.6, -22], fov: 44 }))
    },
    {
      t0: 40.082, t1: 41.375, set: 'stairs', env: 'stairs', grade: 'stairs', bgBlur: 1.2,
      actor: (t) => Object.assign(stepsDown(t, { t0: 40.08, t1: 41.38, s0: 19.45, s1: 18.45, x: 0.05, yaw: 0.12, left: [[40.0, 40.3, 19.35], [40.62, 40.95, 18.73]], right: [[40.0, 40.55, 19.04], [40.88, 41.4, 18.42]] }), { mess: 1 }),
      cam: (t) => {
        const k = ease((t - 40.1) / 1.2);
        return { eye: [0.3, W.stepY(17.85) + 0.3, -17.85], at: [0.0, W.stepY(18.9) + lerp(0.62, 0.1, k), -18.9], fov: 46 };
      }
    },
    {
      t0: 41.375, t1: 43.794, set: 'stairs', env: 'stairs', grade: 'stairs', mocap: 'wide2', extra: () => ({ mess: 1 }),
      actor: (t) => DANCE_DEFAULT(t, stairPos(0.0, 19.0), 0),
      cam: mcam('wide2', () => ({ eye: [0.1, W.stepY(15.0) + 0.8, -15.0], at: [0.0, W.stepY(21) + 1.6, -21], fov: 44 }))
    },
    {
      t0: 43.794, t1: 48.423, set: 'stairs', env: 'shade', grade: 'stairs', bgBlur: 1.2, mocap: 'graffiti', extra: () => ({ mess: 1 }),
      actor: (t) => DANCE_DEFAULT(t, stairPos(-1.2, 11.0), -PI * 0.3),
      cam: mcam('graffiti', () => ({ eye: [0.6, W.stepY(9.0) + 0.9, -9.0], at: [-2.0, W.stepY(11.2) + 2.0, -11.6], fov: 44 }))
    },
    {
      t0: 48.423, t1: 50.759, set: 'stairs', env: 'stairs', grade: 'stairs', mocap: 'wide3', extra: () => ({ mess: 1 }),
      actor: (t) => DANCE_DEFAULT(t, stairPos(0.8, 12.0), 0.2),
      cam: mcam('wide3', () => ({ eye: [-0.6, W.stepY(8.0) + 1.0, -8.0], at: [0.2, W.stepY(14) + 1.5, -14], fov: 46 }))
    },
    {
      t0: 50.759, t1: 52.761, set: 'stairs', env: 'stairs', grade: 'stairs', mocap: 'top1', extra: () => ({ mess: 1 }),
      actor: (t) => DANCE_DEFAULT(t, stairPos(-1.0, 10.0), PI * 0.8),
      cam: mcam('top1', () => ({ eye: [-1.0, W.stepY(10) + 7.5, -10.0], at: [-1.0, W.stepY(10), -10.01], fov: 40, up: [0, 0, -1] }))
    },
    {
      t0: 52.761, t1: 55.097, set: 'stairs', env: 'shade', grade: 'stairs', bgBlur: 3.0, mocap: 'laugh', extra: () => ({ mess: 1, smile: 1, jaw: 0.6 }),
      actor: (t) => Object.assign(DANCE_DEFAULT(t, stairPos(-1.2, 12.0), -0.3), { smile: 1, jaw: 0.5 }),
      cam: mcam('laugh', () => ({ eye: stairPos(-0.2, 10.5, 1.1), at: stairPos(-1.0, 12.0, 1.9), fov: 40 }))
    },
    {
      t0: 55.097, t1: 56.515, set: 'stairs', env: 'stairs', grade: 'stairs',
      actor: (t) => {
        const u = (t - 55.1) / 1.42;
        const kick = Math.max(0, S(u * PI * 3));
        return { pos: stairPos(-1.15, 10.45, 0.98 - 0.08 * kick), yaw: 1.4 + u * PI * 2.6, lean: 0.18, roll: -0.12, sp: [0.12, 0.25, 0.1], nk: [0.35, 0.2, 0.1], hL: [0.72, 0.18, 0.12], eL: [0.9, 0.3, -0.2], hR: [-0.7, 0.28, 0.1], eR: [-0.9, 0.3, -0.2], gL: 'spread', gR: 'spread', fL: [0.16, -0.9, 0.08], fR: [-0.22, -0.6 + 0.2 * kick, 0.35 * kick], mess: 1, flare: 0.8 };
      },
      cam: () => ({ eye: [-1.0, W.stepY(10.5) + 3.3, -10.5], at: [-1.0, W.stepY(10.5), -10.51], fov: 44, up: [0.42, 0, -0.9] })
    },
    {
      t0: 56.515, t1: 67.234, set: 'stairs', env: 'stairs', grade: 'stairs', mocap: 'front', extra: () => ({ mess: 1 }),
      actor: (t) => DANCE_DEFAULT(t, stairPos(0.0, lerp(10.5, 7.8, (t - 56.5) / 10.7)), 0),
      cam: mcam('front', () => ({ eye: [0.0, W.stepY(5.8) + 0.9, -5.8], at: [0.0, W.stepY(10) + 1.4, -10], fov: 48 })),
      cops: (t) => t > 61.0
    },
    {
      t0: 67.234, t1: 69.403, set: 'stairs', env: 'stairs', grade: 'stairs', bgBlur: 3.0, mocap: 'spin', extra: () => ({ mess: 1, flare: 0.9 }),
      actor: (t) => Object.assign(DANCE_DEFAULT(t, stairPos(0.2, 8.4), (t - 67.2) * 4.2), { mess: 1, flare: 0.9 }),
      cam: mcam('spin', () => ({ eye: stairPos(0.4, 7.0, 1.2), at: stairPos(0.2, 8.4, 1.5), fov: 42 }))
    },
    {
      t0: 69.403, t1: 78.328, set: 'stairs', env: 'shade', grade: 'stairs', bgBlur: 4.0, smoke: 'cu',
      actor: (t) => Object.assign(SMOKE_POSE(t), { cig: [-0.62, -0.75, 0.22], mess: 1, eyes: 'closed' }),
      cam: (t) => {
        const x = SMOKE_PAN(t);
        const w = wobble(t * 0.6, 0.006, 13);
        return { eye: [0.06 + x * 0.3 + w[0], 1.6 + w[1], 0.58], at: [x, 1.6, 0.0], fov: 40 };
      }
    },
    {
      t0: 78.328, t1: 82.958, set: 'stairs', env: 'stairs', grade: 'stairs', bgBlur: 2.0, cops: true, copsClose: true,
      cam: (t) => ({ eye: [-0.02 + 0.03 * S(t * 0.6), W.stepY(W.TOP_S - 1.3) + 1.1, -(W.TOP_S - 1.3)], at: [0.0, W.TOP_Y + 1.42, -(W.TOP_S + 0.6)], fov: 34 })
    },
    {
      t0: 82.958, t1: 87.963, set: 'stairs', env: 'stairs', grade: 'stairs', cops: true, mocap: 'escape', extra: () => ({ mess: 1 }),
      actor: (t) => DANCE_DEFAULT(t, stairPos(-0.6, lerp(9.0, 5.0, (t - 83) / 4.9)), PI * 0.2),
      cam: mcam('escape', () => ({ eye: [0.4, W.stepY(4.6) + 1.2, -4.6], at: [0.0, W.stepY(14) + 2.0, -14], fov: 46 }))
    },
    {
      t0: 87.963, t1: DURATION, set: 'avenue', env: 'avenue', grade: 'avenue', walkers: true,
      cam: (t) => ({ eye: [0.7, 0.72, 2.6], at: [0.3, 1.25, -20], fov: 40 })
    }
  ];

  const COPS = [
    { look: 'burke', at: [-0.55, 0.985], yaw: 0.15 },
    { look: 'garrity', at: [0.45, 0.985], yaw: -0.25 }
  ];

  function copsAt(t, close) {
    return COPS.map((c, i) => {
      const down = close ? 0 : Math.max(0, t - (85.9 + i * 0.25)) * 0.95;
      const s = W.TOP_S + (close ? 0.5 + i * 0.1 : 0.4 + i * 0.15) - down;
      const look = close ? (i ? -0.55 + 0.12 * S(t * 0.7) : 0.15 + 0.1 * S(t * 0.5)) : 0;
      const x = close ? (i ? 0.48 : -0.55) : c.at[0];
      const ph = down > 0 ? S(down * 6.5) : 0;
      return {
        look: c.look,
        pose: { pos: [x, W.stepY(s) + c.at[1] + 0.02 * Math.abs(ph), -s], yaw: close ? (i ? -0.55 : 0.25) : c.yaw, sp: [0.02, 0, 0], nk: [close ? 0.3 : 0.12, look, 0], hL: [0.27, -0.28, 0.07 + 0.08 * ph], hR: [-0.27, -0.28, 0.07 - 0.08 * ph], fL: [0.11, -0.93 + 0.08 * Math.max(0, ph), 0.03 + 0.12 * ph], fR: [-0.11, -0.93 + 0.08 * Math.max(0, -ph), 0.03 - 0.12 * ph] }
      };
    });
  }

  const WALKERS = [
    { look: 'walkerKhaki', from: [-1.62, -2.2], to: [-1.55, -2.8], cad: 0.4 },
    { look: 'walkerCoat', from: [-0.6, -8.0], to: [-0.4, -12.5], cad: 0.85 },
    { look: 'walkerGrey', from: [0.2, -9.0], to: [0.3, -13.5], cad: 0.9 },
    { look: 'walkerCoat', from: [-1.2, -16.0], to: [-1.0, -20.0], cad: 0.85 },
    { look: 'walkerGrey', from: [0.9, -24.0], to: [0.7, -20.0], cad: 0.8, back: true },
    { look: 'walkerKhaki', from: [1.6, -15.0], to: [1.5, -18.5], cad: 0.8 }
  ];

  function shotAt(t) {
    let i = 0;
    while (i < SHOTS.length - 1 && t >= SHOTS[i + 1].t0) i++;
    return i;
  }

  function jokerPose(t, sh) {
    const v = sh.mocap ? motionAt(t) : null;
    if (v) {
      const pose = Rig.applyMotion({}, v);
      ['fLw', 'fRw'].forEach(k => {
        const f = pose[k];
        f[1] = Math.max(f[1], W.groundAt(f[0], f[2]) + 0.085);
      });
      return Object.assign(pose, sh.extra ? sh.extra(t) : {});
    }
    return sh.actor ? sh.actor(t) : null;
  }

  function headingOf(pose) {
    const f = pose.fwd || [S(pose.yaw || 0), 0, C(pose.yaw || 0)];
    const l = Math.hypot(f[0], f[2]) || 1;
    return [f[0] / l, 0, f[2] / l];
  }

  function headOf(pose) {
    const m = window.StairsCast.solve('joker', pose);
    return [m.head[12], m.head[13], m.head[14]];
  }

  function cameraAt(t) {
    const tt = clamp(t, 0, DURATION);
    const sh = SHOTS[shotAt(tt)];
    if (!sh.cam) return { eye: [0, 1, 1], at: [0, 1, 0], fov: 40, up: [0, 1, 0] };
    const pose = sh.actor ? jokerPose(tt, sh) : null;
    const a = pose ? { head: headOf(pose) } : {};
    const c = sh.cam(tt, a);
    return Object.assign({ up: [0, 1, 0] }, c);
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    const index = shotAt(tt);
    const sh = SHOTS[index];
    const out = { t: tt, shot: index, set: sh.set, env: ENV[sh.env] || ENV.stairs, gradeKey: sh.grade || 'stairs', actors: [], fx: {} };
    if (sh.set === 'black') return out;
    const pose = sh.actor ? jokerPose(tt, sh) : null;
    if (pose) {
      const prev = jokerPose(Math.max(sh.t0, tt - 0.08), sh) || pose;
      const h1 = headOf(pose), h0 = headOf(prev);
      const dt = Math.max(0.02, tt - Math.max(sh.t0, tt - 0.08));
      const vel = V3.mul(V3.sub(h1, h0), 1 / dt);
      const sw = V3.mul(vel, -0.09);
      const mag = V3.len(sw);
      pose.hairSwing = mag > 0.6 ? V3.mul(sw, 0.6 / mag) : sw;
      const f1 = headingOf(pose), f0 = headingOf(prev);
      pose.spin = clamp(Math.atan2(f0[0] * f1[2] - f0[2] * f1[0], f0[0] * f1[0] + f0[2] * f1[2]) / dt, -12, 12);
      if (pose.flare === undefined) pose.flare = clamp(V3.len([vel[0], 0, vel[2]]) * 0.25 + Math.abs(pose.spin) * 0.06, 0, 0.9);
      out.actors.push({ look: 'joker', pose, head: h1 });
    }
    if (sh.cops) {
      const on = typeof sh.cops === 'function' ? sh.cops(tt) : true;
      if (on) copsAt(tt, sh.copsClose).forEach(c => out.actors.push(c));
    }
    if (sh.walkers) {
      WALKERS.forEach((w, i) => {
        const p = walkPose(tt, { t0: 87.9, t1: 92, from: w.from, to: w.to, yaw: w.back ? 0 : PI, cadence: w.cad, stride: 0.3 });
        out.actors.push({ look: w.look, pose: p });
      });
    }
    out.camera = sh.cam(tt, { head: out.actors[0] ? out.actors[0].head : [0, 1.6, 0] });
    out.setOpts = sh.setOpts ? sh.setOpts(tt) : {};
    if (sh.set === 'stairs') out.setOpts.street = true;
    if (sh.set === 'avenue') out.setOpts.busX = tt > 90.9 ? 10.9 - 25 * (tt - 90.95) : undefined;
    out.fx.bgBlur = sh.bgBlur || 0;
    out.fx.flare = sh.flare ? clamp(1 - Math.abs(tt - 24.6) / 1.4, 0, 1) : 0;
    out.fx.smoke = sh.smoke || null;
    out.fx.title = tt < 6.4 ? clamp((6.35 - tt) / 1.0, 0, 1) : 0;
    let black = 0;
    if (sh.fade) black = Math.max(black, K.keys(sh.fade)(tt));
    if (sh.fadeOut) black = Math.max(black, K.keys(sh.fadeOut)(tt));
    if (tt < 3.05) black = 1;
    out.fx.black = black;
    return out;
  }

  window.StairsScript = { ID, DURATION, CUTS, SHOTS, ENV, GRADE, stage, shotAt, cameraAt, walkPose, stairPos };
})();
