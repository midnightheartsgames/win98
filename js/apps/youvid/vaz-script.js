(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, envelope } = K;
  const Cast = window.VazCast;

  const ID = 'Vaz3l1nD4dy';
  const DURATION = 47.81;
  const CUTS = [0];
  const VOICE = envelope(
    '000000QZKUMbfTNz4000000BYJbgwEbmZI00000000000008KTg0cwn90Jg74Uz06JoxZUF12IMGC4it00000000b400000ol6004100000130003BZEGZXp' +
    'SZtrDzi09d0f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' +
    '000000000000000000000000000000000000000000000000000000000000000000000000000000000000010297cahghe8310000t911dMZH60xQZUngj' +
    'fhdlHsi8k6ca76lzKHv0cvie2mf834362000ZZZsPxe000TZGa89AvmfhkkecbDvGn4cj2003HZG90UZZDD0002imBkd23gPJtFgd5iaa80000YZWKp80007' +
    'ZUTDl3bd47dzkc00AHQve64877abda00ske820Qy600PZZWk21240pQHnj8dcda9dyulegfeb6DVHc009f900lPk875d758tHe7706uwvpdigc7lXOk24l89' +
    'dcehmC209qAujda210ZZMNBFr600mxmb79ef700KZZf2044009DZzjfue00aUZR000000000000576410tg1509xMrf0uTvb575300iZZK10sZZTEh10147c' +
    '800nDYZvei5000IZAvJkg300fZZO005yqjchhoqkbuxe40w52000yVujeGYHAna000tZZ9d06pDuqpa6dba84000zROLp90065BZZRk07uv66rrl035zZXQA' +
    '87nd367520kn8716Ib000LUyAza7200eRXmz004962bqnrhngff90ispg160000tuk71143126pn7206668654344476500000000000000000000000',
    20
  );

  function hermite(p0, p1, p2, p3, t0, t1, t2, t3, t) {
    const h = t2 - t1;
    const u = clamp((t - t1) / h, 0, 1);
    const m1 = ((p2 - p0) / Math.max(1e-4, t2 - t0)) * h;
    const m2 = ((p3 - p1) / Math.max(1e-4, t3 - t1)) * h;
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
  }

  function track(list) {
    const full = [];
    let cur = {};
    list.forEach(([t, v]) => {
      cur = Object.assign({}, cur, v);
      full.push([t, cur]);
    });
    const num = (x) => typeof x === 'number';
    return (t) => {
      const n = full.length;
      if (t <= full[0][0]) return Object.assign({}, full[0][1]);
      if (t >= full[n - 1][0]) return Object.assign({}, full[n - 1][1]);
      let i = 1;
      while (i < n && t >= full[i][0]) i++;
      const [t1, a] = full[i - 1], [t2, b] = full[i];
      const [t0, z] = full[Math.max(0, i - 2)], [t3, c] = full[Math.min(n - 1, i + 1)];
      const tz = i - 2 >= 0 ? t0 : t1 - 1, tc = i + 1 < n ? t3 : t2 + 1;
      const out = {};
      Object.keys(a).forEach(key => {
        const va = a[key], vb = b[key];
        if (num(va) && num(vb)) {
          out[key] = hermite(num(z[key]) ? z[key] : va, va, vb, num(c[key]) ? c[key] : vb, tz, t1, t2, tc, t);
        } else if (Array.isArray(va) && Array.isArray(vb) && va.length === vb.length && num(va[0])) {
          const za = Array.isArray(z[key]) && z[key].length === va.length ? z[key] : va;
          const cb = Array.isArray(c[key]) && c[key].length === vb.length ? c[key] : vb;
          out[key] = va.map((x, j) => hermite(za[j], x, vb[j], cb[j], tz, t1, t2, tc, t));
        } else {
          out[key] = va;
        }
      });
      Object.keys(b).forEach(key => { if (!(key in out)) out[key] = b[key]; });
      return out;
    };
  }

  function standH(who) {
    const D = Cast.LOOKS[who].D;
    return 0.07 + D.thigh + D.shin - D.hipY - 0.012;
  }

  function body(who, k) {
    const yaw = k.yaw || 0;
    const fwd = [S(yaw), 0, C(yaw)];
    const left = [C(yaw), 0, -S(yaw)];
    const W = (v) => [k.x + v[0] * left[0] + v[2] * fwd[0], v[1], k.z + v[0] * left[2] + v[2] * fwd[2]];
    const D = Cast.LOOKS[who].D;
    const lean = k.lean || [0, 0];
    const up = [fwd[0] * S(lean[0]) + left[0] * S(lean[1]), C(lean[0]) * C(lean[1]), fwd[2] * S(lean[0]) + left[2] * S(lean[1])];
    const hgt = (k.h === undefined ? standH(who) : k.h) + (k.bob || 0);
    const off = k.off || [0, 0];
    const pose = {
      p: W([off[0], hgt, off[1]]),
      up,
      fwd,
      sp: k.sp || [0, 0, 0],
      nk: k.nk || [0, 0, 0],
      hL: k.hL || [D.shX + 0.04, D.shY - D.upper - D.fore + 0.05, 0.04],
      hR: k.hR || [-D.shX - 0.04, D.shY - D.upper - D.fore + 0.05, 0.04],
      eL: k.eL || [0.5, -0.1, -0.7],
      eR: k.eR || [-0.5, -0.1, -0.7],
      fLw: W(k.fL || [D.hipX, 0.07, 0.02]),
      fRw: W(k.fR || [-D.hipX, 0.07, 0.02]),
      kLw: W(k.kL || [D.hipX + 0.05, 0.5, 1]),
      kRw: W(k.kR || [-D.hipX - 0.05, 0.5, 1]),
      wL: k.wL || [0, 0, 0],
      wR: k.wR || [0, 0, 0],
      aL: k.aL || 0,
      aR: k.aR || 0,
      hands: { L: k.handL || 'relax', R: k.handR || 'relax' },
      eyes: k.eyes || 'open',
      mouth: k.mouth || 'closed',
      open: k.open || 0,
      glasses: k.glasses || 'clear',
      prop: k.prop || null,
      hideL: k.hideL,
      hideR: k.hideR,
      hideLegs: k.hideLegs
    };
    if (k.hLw) pose.hLw = k.hLw;
    if (k.hRw) pose.hRw = k.hRw;
    if (k.eLw) pose.eLw = k.eLw;
    if (k.eRw) pose.eRw = k.eRw;
    return pose;
  }

  function pathOf(list) {
    const f = track(list.map(([t, x, z]) => [t, { x, z }]));
    return (t) => {
      const a = f(t);
      return [a.x, a.z];
    };
  }

  function headingAt(P, t, fallback) {
    const a = P(t - 0.08), b = P(t + 0.08);
    const dx = b[0] - a[0], dz = b[1] - a[1];
    return Math.hypot(dx, dz) < 0.01 ? fallback : Math.atan2(dx, dz);
  }

  function stepFoot(P, t, g, side) {
    const T = g.T, t0 = g.t0;
    const off = side === 'L' ? 0 : 0.5;
    const u = (t - t0) / (2 * T) + off;
    const k = Math.floor(u), f = u - k;
    const plant = (kk) => t0 + (kk - off + 0.25) * 2 * T;
    const at = (kk) => {
      const tt = plant(kk);
      const p = P(tt);
      const yaw = g.yaw === undefined ? headingAt(P, tt, g.yaw0 || 0) : g.yaw;
      const s = side === 'L' ? 1 : -1;
      return [p[0] + C(yaw) * g.width * s, p[1] - S(yaw) * g.width * s, yaw];
    };
    if (f < 0.5) {
      const a = at(k);
      return { p: [a[0], 0.07, a[1]], lift: 0, yaw: a[2] };
    }
    const a = at(k), b = at(k + 1);
    const s = ease((f - 0.5) / 0.5);
    return { p: [lerp(a[0], b[0], s), 0.07 + S(s * PI) * g.lift, lerp(a[1], b[1], s)], lift: S(s * PI), yaw: lerp(a[2], b[2], s) };
  }

  function strut(who, P, t, g, extra) {
    const p = P(t);
    const yaw = g.yaw === undefined ? headingAt(P, t, g.yaw0 || 0) : g.yaw;
    const fl = stepFoot(P, t, g, 'L'), fr = stepFoot(P, t, g, 'R');
    const ph = ((t - g.t0) / g.T) * PI;
    const k = Object.assign({
      x: p[0],
      z: p[1],
      yaw,
      h: standH(who) - g.dip - Math.abs(S(ph)) * g.bob,
      fLw: fl.p,
      fRw: fr.p,
      sp: [g.lean || 0.04, S(ph) * g.twist, S(ph) * 0.04],
      aL: -fl.lift * 0.5,
      aR: -fr.lift * 0.5
    }, extra || {});
    const pose = body(who, k);
    pose.fLw = fl.p;
    pose.fRw = fr.p;
    const fwd = [S(yaw), 0, C(yaw)];
    pose.kLw = [fl.p[0] + fwd[0], 0.6, fl.p[2] + fwd[2]];
    pose.kRw = [fr.p[0] + fwd[0], 0.6, fr.p[2] + fwd[2]];
    return pose;
  }

  const BEAT = 0.5285, BEAT0 = 9.68;

  function beatPh(t) {
    return ((t - BEAT0) / BEAT) * PI;
  }

  const HUGH_STOOL = [0.25, -2.1];
  const SAM_SPOT = [1.5, -3.45];
  const JUKE = [-2.7, 0, -5.12];
  const SLOT = [-2.57, 0.84, -4.9];
  const TALK = [[0, 1.75, 'hugh'], [2.0, 4.05, 'sam'], [4.35, 6.7, 'hugh'], [16.2, 46.7, 'hugh']];
  const RAD = PI / 180;

  function talker(t) {
    const seg = TALK.find(([a, b]) => t >= a && t < b);
    return seg ? seg[2] : null;
  }

  function mouthOf(who, t, base) {
    return talker(t) === who ? clamp(VOICE(t) * 1.15, 0, 1) : (base || 0);
  }

  function talk(k, who, t) {
    k.open = mouthOf(who, t);
    if (k.open > 0.12 && (k.mouth === 'closed' || k.mouth === 'smirk' || k.mouth === 'smile' || k.mouth === 'frown')) k.mouth = 'open';
    return k;
  }

  function camKeys(list) {
    const f = track(list.map(([t, eye, at, fov, roll]) => [t, { eye, at, fov, roll: roll || 0 }]));
    return (t) => {
      const k = f(t);
      k.roll = (k.roll || 0) * RAD;
      return k;
    };
  }

  function orbit(target, az, el, dist) {
    const d = [S(az * RAD), 0, -C(az * RAD)];
    const h = dist * C(el * RAD);
    return { eye: [target[0] - d[0] * h, target[1] + dist * S(el * RAD), target[2] - d[2] * h], at: target };
  }

  function blink(t, seed) {
    return ((t * 0.37 + seed * 0.61) % 1) < 0.035;
  }

  function yawTo(from, to) {
    return Math.atan2(to[0] - from[0], to[1] - from[1]);
  }

  const SAM_IDLE = { x: SAM_SPOT[0], z: SAM_SPOT[1], yaw: -0.3, sp: [0.22, 0, 0], nk: [-0.08, -0.15, 0], hLw: [1.78, 1.04, -3.0], hRw: [1.22, 1.04, -2.92], eL: [0.8, -0.4, -0.4], eR: [-0.8, -0.4, -0.4], handL: 'flat', handR: 'flat', eyes: 'open', mouth: 'smile' };

  const HUGH_SIT = { x: HUGH_STOOL[0], z: HUGH_STOOL[1], yaw: 0.05, h: 0.83, lean: [-0.24, 0.02], sp: [-0.06, 0, 0], glasses: 'shades', eyes: 'cool', mouth: 'smirk', hLw: [0.7, 1.03, -2.56], hRw: [-0.22, 1.03, -2.56], eL: [0.5, -0.9, -0.6], eR: [-0.5, -0.9, -0.6], handL: 'flat', handR: 'flat', fL: [0.3, 0.07, 0.36], fR: [-0.33, 0.07, 0.44], kL: [0.7, 0.55, 1.0], kR: [-0.7, 0.55, 1.0] };

  const S1_HUGH = track([
    [0.0, Object.assign({}, HUGH_SIT, { nk: [-0.26, 0.0, 0.0] })],
    [0.42, { nk: [-0.24, 0.0, 0.0] }],
    [0.55, { nk: [-0.25, 0.62, -0.05] }],
    [0.8, { nk: [-0.22, 0.6, -0.05] }],
    [1.0, { nk: [-0.2, 0.0, 0.0] }],
    [1.19, { nk: [-0.2, 0.05, 0.0] }],
    [1.3, { nk: [-0.25, -1.25, 0.05] }],
    [2.05, { nk: [-0.28, -1.3, 0.06] }]
  ]);

  const S1_CAM = camKeys([[0, [1.043, 1.732, 1.759], [-0.296, 1.083, -4.619], 42.5], [2.1, [1.043, 1.732, 1.759], [-0.296, 1.083, -4.619], 42.5]]);

  function shotWide(t) {
    const hk = talk(S1_HUGH(t), 'hugh', t);
    if (t > 1.9) hk.mouth = 'smile';
    return {
      camera: S1_CAM(t),
      light: { base: 'day' },
      cast: [
        { who: 'hugh', pose: body('hugh', hk) },
        { who: 'sam', pose: body('sam', Object.assign({}, SAM_IDLE, { nk: [-0.05, -0.35, 0], eyes: blink(t, 1) ? 'closed' : 'left' })) }
      ]
    };
  }

  const SAM_CLOSE = Object.assign({}, SAM_IDLE, { yaw: 0, h: standH('sam') - 0.14, sp: [0.38, 0, 0], nk: [-0.25, 0, 0], hLw: [1.86, 1.02, -2.86], hRw: [1.16, 1.02, -2.86], eyes: 'open', mouth: 'grin' });

  const S2_SAM = track([
    [2.033, Object.assign({}, SAM_CLOSE, { sp: [0.55, 0, 0], hR: [-0.32, -0.25, 0.3], eR: [-0.8, -0.4, -0.4] })],
    [2.13, { sp: [0.42, 0.1, 0], hR: [-0.45, 0.05, 0.25], handR: 'gun', eyes: 'open' }],
    [2.27, { sp: [0.36, 0.25, 0.02], nk: [-0.18, -0.1, 0], hRw: [0.9, 1.18, -2.85], eRw: [1.1, 0.9, -3.3], handR: 'gun', eyes: 'right', mouth: 'open' }],
    [2.77, { hRw: [0.92, 1.19, -2.83], eyes: 'right', mouth: 'grin' }],
    [2.9, { sp: [0.42, 0.05, 0.05], nk: [-0.2, 0, 0.2], hRw: null, eRw: null, hR: [-0.3, -0.15, 0.3], handR: 'fist', eyes: 'happy' }],
    [3.05, { nk: [-0.12, 0, 0.05], hR: [-0.34, 0.45, 0.25], eR: [-0.5, -0.9, 0.1], handR: 'fist', eyes: 'wide', mouth: 'open' }],
    [3.15, { hR: [-0.34, 0.6, 0.22], prop: { kind: 'tube', side: 'R', off: [0.0, -0.06, 0.035], rx: -1.4 } }],
    [3.42, { hR: [-0.3, 0.68, 0.2], nk: [-0.1, 0.0, -0.18] }],
    [3.5, { nk: [-0.2, 0.05, 0.5], hR: [-0.32, 0.1, 0.3], prop: null }],
    [3.64, { lean: [0, -0.06], sp: [0.4, 0.05, -0.05], nk: [-0.14, 0.08, 0.44], hR: [-0.36, 0.3, 0.38], eR: [-0.6, -0.9, 0.0], wR: [0, 0, 0], handR: 'thumb', eyes: 'wink', mouth: 'grin' }],
    [4.0, { nk: [-0.12, 0.08, 0.42], hR: [-0.36, 0.32, 0.38] }],
    [4.47, { nk: [-0.13, 0.06, 0.46], hR: [-0.36, 0.3, 0.39] }]
  ]);

  const S2_CAM = camKeys([[2.033, [1.48, 1.4, -1.85], [1.5, 1.33, -3.3], 42], [4.5, [1.48, 1.4, -1.85], [1.5, 1.33, -3.3], 42]]);

  function shotSam(t) {
    const k = talk(S2_SAM(t), 'sam', t);
    if (k.mouth === 'grin' && k.open > 0.35) k.mouth = 'open';
    return {
      camera: S2_CAM(t),
      light: { base: 'day', points: [{ pos: [1.4, 2.0, -2.0], color: [0.35, 0.32, 0.3] }] },
      smear: t < 2.17 ? [0.02, 0.05, 0.85 * (1 - (t - 2.033) / 0.14)] : (t > 2.867 && t < 3.0) || (t > 3.467 && t < 3.54) ? [0.04, 0.02, 0.5] : null,
      cast: [{ who: 'sam', pose: body('sam', k) }]
    };
  }

  const S3_HUGH = track([
    [4.467, Object.assign({}, HUGH_SIT, { yaw: -0.05, lean: [-0.2, 0.12], nk: [-0.5, -0.45, 0.1], hRw: undefined, hR: [-0.5, 0.0, 0.2], eR: [-0.9, 0.2, -0.3], handR: 'open' })],
    [4.6, { hR: [-0.14, 0.05, 0.3], eR: [-0.9, 0, -0.3] }],
    [4.73, { hR: [-0.03, 0.32, 0.17], eR: [-1, 0, 0], handR: 'flat', wR: [0, 0, 0.6] }],
    [4.87, { hR: [-0.03, 0.26, 0.17] }],
    [5.0, { hR: [-0.05, 0.12, 0.2], nk: [-0.45, -0.5, 0.05] }],
    [5.25, { hR: [-0.62, -0.05, 0.25], eR: [-0.6, -0.8, -0.3], handR: 'flat', wR: [0, 0, 0] }],
    [5.47, { hR: [-0.6, -0.04, 0.27] }],
    [5.6, { nk: [-0.42, -1.25, 0.05], hR: [-0.3, -0.12, 0.35], handR: 'fist' }],
    [5.75, { hR: [-0.22, -0.28, 0.42], eR: [-1, 0, -0.2], nk: [-0.4, -1.3, 0.06] }],
    [6.55, { hR: [-0.22, -0.27, 0.43] }],
    [6.64, { hR: [-0.2, 0.1, 0.42], handR: 'fist', prop: { kind: 'coin', side: 'R', off: [0.0, -0.05, 0.05] } }],
    [6.7, { hR: [-0.22, 0.2, 0.42], handR: 'thumb', prop: null, nk: [-0.55, -1.0, 0.05] }],
    [6.75, { hR: [-0.22, 0.22, 0.42], nk: [-0.6, -0.9, 0.05] }],
    [7.0, { hR: [-0.22, 0.23, 0.42] }]
  ]);

  const S3_CAM = camKeys([[4.467, [1.1, 0.82, -0.3], [0.32, 1.18, -2.6], 46], [7.0, [1.1, 0.82, -0.3], [0.32, 1.18, -2.6], 46]]);

  function shotStool(t) {
    const hk = talk(S3_HUGH(t), 'hugh', t);
    delete hk.hRw;
    const glows = [];
    if (t > 6.64 && t < 6.74) glows.push({ p: [0.0 - (t - 6.64) * 4, 1.45 + (t - 6.64) * 9, -1.75], s: 0.16, a: 0.9, col: [1, 1, 1] });
    return {
      camera: S3_CAM(t),
      light: { base: 'day' },
      glows,
      cast: [
        { who: 'hugh', pose: body('hugh', hk) },
        { who: 'sam', pose: body('sam', Object.assign({}, SAM_IDLE, { x: 1.15, yaw: -0.5, nk: [-0.05, -0.3, 0.05], eyes: blink(t, 2) ? 'closed' : 'left', mouth: 'grin' }, t < 5.0 ? { hRw: undefined, hR: [-0.36, 0.28, 0.36], eR: [-0.6, -0.9, 0], handR: 'thumb' } : {})) }
      ]
    };
  }

  const COIN_FLIP = (t) => PI / 2 + ((t - 7.1) / 0.47) * PI;

  const S4_CAM = camKeys([
    [7.0, [-1.25, 0.78, -2.3], [-2.7, 0.86, -5.1], 50, 0],
    [7.4, [-1.45, 0.82, -2.75], [-2.7, 0.95, -5.1], 50, 10],
    [7.63, [-1.7, 0.88, -3.25], [-2.7, 1.02, -5.1], 50, 17],
    [8.0, [-2.3, 1.05, -4.05], [-2.72, 1.12, -5.1], 50, 22],
    [8.3, [-2.48, 1.1, -4.42], [-2.72, 1.1, -5.1], 48, 25],
    [8.47, [-2.56, 0.92, -4.7], [-2.57, 0.84, -4.92], 46, 28],
    [8.5, [-2.56, 0.92, -4.7], [-2.57, 0.84, -4.92], 46, 28],
    [8.833, [-2.56, 0.92, -4.71], [-2.57, 0.835, -4.92], 46, 28],
    [8.86, [-2.56, 0.92, -4.71], [-2.57, 0.835, -4.92], 46, 28],
    [8.95, [-3.6, 1.1, -2.5], [-2.7, 0.85, -5.1], 56, 10],
    [9.067, [-5.3, 1.42, 0.45], [-2.62, 0.78, -5.1], 44, 0],
    [9.1, [-5.3, 1.42, 0.45], [-2.62, 0.78, -5.1], 44, 0],
    [10.533, [-5.3, 1.42, 0.45], [-2.62, 0.78, -5.1], 44, 0]
  ]);

  function coinAt(t) {
    if (t < 8.33) {
      const cam = S4_CAM(t);
      const f = V3.norm(V3.sub(cam.at, cam.eye));
      const r = V3.norm(V3.cross(f, [0, 1, 0]));
      const u = V3.cross(r, f);
      const drift = clamp((t - 7.0) / 1.2, 0, 1);
      const sx = lerp(0.42, 0.12, drift), sy = lerp(0.32, 0.36, drift);
      const d = 0.55;
      return V3.add(cam.eye, V3.add(V3.mul(f, d), V3.add(V3.mul(r, sx * d), V3.mul(u, sy * d))));
    }
    if (t < 8.47) {
      const k = (t - 8.33) / 0.14;
      return [lerp(-2.6, SLOT[0], k), lerp(0.98, SLOT[1] + 0.04, k), lerp(-4.76, SLOT[2] + 0.02, k)];
    }
    const k = clamp((t - 8.47) / 0.13, 0, 1);
    return [SLOT[0], SLOT[1] + 0.04 - k * 0.05, SLOT[2] + 0.02 - k * 0.04];
  }

  function coinM(t) {
    const p = coinAt(t);
    const big = t < 8.33 ? 3.2 : t < 8.47 ? 2.2 : 1.6;
    const flip = t < 8.33 ? COIN_FLIP(t) : PI / 2;
    const yaw = t < 8.33 ? 0.6 : 0;
    const roll = t < 8.33 ? 0 : -0.48;
    return M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(yaw), M4.rotZ(roll), M4.rotY(flip), M4.scale(big, big, big));
  }

  function shotCoin(t) {
    const lit = clamp((t - 8.93) / 0.12, 0, 1);
    const dark = clamp((t - 8.9) / 0.08, 0, 1);
    const props = [];
    if (t < 8.6) props.push({ kind: 'coin', m: coinM(t) });
    const glows = [];
    const p = coinAt(Math.min(t, 8.6));
    if ((t > 7.73 && t < 7.8) || (t > 8.23 && t < 8.3)) glows.push({ p, s: 0.14, a: 1, col: [1, 1, 1] });
    if (t > 8.58 && t < 8.62) glows.push({ p: [SLOT[0], SLOT[1] + 0.02, SLOT[2] + 0.03], s: 0.06, a: 0.8, col: [1, 1, 1] });
    if (lit > 0) {
      glows.push({ p: [JUKE[0], 1.15, JUKE[2] + 0.35], s: 1.6, a: 0.45 * lit, col: [1, 0.55, 0.45] });
      glows.push({ p: [JUKE[0], 0.32, JUKE[2] + 0.4], s: 0.7, a: 0.5 * lit, col: [1, 0.7, 0.5] });
    }
    const smear = t > 8.33 && t < 8.47 ? [0, -0.05, 0.6] : t > 8.85 && t < 9.04 ? [0.0, 0.0, 0.0] : null;
    return {
      camera: S4_CAM(t),
      light: dark > 0 ? { base: 'day', to: 'dim', k: dark, points: lit > 0 ? [{ pos: [JUKE[0], 1.0, JUKE[2] + 0.9], color: [1.6 * lit, 0.75 * lit, 0.5 * lit] }] : [] } : { base: 'day' },
      roomTint: dark > 0 ? [1 - 0.45 * dark, 1 - 0.45 * dark, 1 - 0.35 * dark] : null,
      windowTint: dark > 0 ? [1 + 0.2 * dark, 1 + 0.25 * dark, 1 + 0.3 * dark] : null,
      jukeLit: lit,
      pools: lit > 0 ? [{ x: JUKE[0], z: JUKE[2] + 1.4, r: 1.3, a: 0.55 * lit, col: [1, 0.85, 0.45] }] : [],
      zoomBlur: t > 8.85 && t < 9.04 ? 0.9 * (1 - (t - 8.85) / 0.19) : 0,
      smear,
      props,
      glows,
      soft: t < 8.33 ? 0.35 : 0,
      cast: t < 8.4 ? [] : []
    };
  }

  const GIRL_T = [-4.35, -2.55];

  const S5_LIBBY = track([
    [10.533, { x: GIRL_T[0] - 0.62, z: GIRL_T[1] + 0.2, yaw: 1.2, h: 0.5, sp: [0.05, 0, 0], nk: [-0.25, 0.1, 0.05], hL: [0.04, 0.12, 0.18], hR: [-0.04, 0.12, 0.18], eL: [0.6, -0.6, -0.2], eR: [-0.6, -0.6, -0.2], handL: 'fist', handR: 'fist', fL: [0.07, 0.07, 0.38], fR: [-0.07, 0.07, 0.38], kL: [0.1, 0.6, 1], kR: [-0.1, 0.6, 1], eyes: 'happy', mouth: 'grin' }],
    [11.75, { nk: [-0.3, 0.2, 0.05] }],
    [12.6, { yaw: 0.55, lean: [-0.12, 0], nk: [-0.42, -0.45, 0.05], eyes: 'upleft', mouth: 'o', open: 0.6 }],
    [13.6, { nk: [-0.44, -0.48, 0.05] }]
  ]);

  const S5_CINDY = track([
    [10.533, { x: GIRL_T[0] + 0.62, z: GIRL_T[1] + 0.2, yaw: -1.05, h: 0.5, lean: [-0.12, 0], sp: [-0.05, 0, 0], nk: [-0.4, 0.1, 0.05], hL: [0.12, 0.05, 0.3], hR: [-0.12, 0.05, 0.3], handL: 'relax', handR: 'relax', fL: [0.05, 0.07, 0.5], fR: [-0.08, 0.07, 0.48], kL: [0.1, 0.6, 1], kR: [-0.1, 0.6, 1], eyes: 'happy', mouth: 'grin' }],
    [11.7, { nk: [-0.42, 0.15, 0.05], eyes: 'half', mouth: 'smirk' }],
    [12.0, { yaw: -0.65, nk: [-0.42, 0.42, 0.12], eyes: 'upright', mouth: 'smile' }],
    [13.6, { nk: [-0.44, 0.44, 0.12] }]
  ]);

  const S5_PATH = pathOf([[10.4, -3.25, -0.95], [12.8, -5.9, -1.02]]);
  const S5_GAIT = { t0: 10.4, T: 0.5, width: 0.1, lift: 0.14, dip: 0.04, bob: 0.03, twist: 0.12, lean: 0.06 };

  function shotGirls(t) {
    const swing = S(((t - 10.4) / 0.5) * PI);
    const hugh = strut('hugh', S5_PATH, t, S5_GAIT, {
      glasses: 'shades', eyes: 'cool', hL: [0.2, 0.05, 0.12 - swing * 0.28], hR: [-0.2, 0.05, 0.12 + swing * 0.28], eL: [0.7, -0.2, -0.6], eR: [-0.7, -0.2, -0.6], handL: 'open', handR: 'open'
    });
    const cast = [
      { who: 'libby', pose: body('libby', S5_LIBBY(t)) },
      { who: 'cindy', pose: body('cindy', S5_CINDY(t)) }
    ];
    if (t < 12.9) cast.push({ who: 'hugh', pose: hugh });
    return {
      camera: { eye: [-4.32, 0.86, -0.42], at: [-4.36, 0.86, -2.5], fov: 44 },
      light: { base: 'dim', points: [{ pos: [-4.0, 1.6, -4.6], color: [0.3, 0.6, 0.8] }, { pos: [-4.4, 2.6, -1.2], color: [0.35, 0.28, 0.2] }] },
      roomTint: [0.6, 0.58, 0.62],
      windowTint: [1.15, 1.2, 1.25],
      jukeLit: 1,
      smear: t > 10.5 && t < 12.7 ? [0.05, 0, 0.35] : null,
      cast
    };
  }

  const S6_PATH = pathOf([
    [13.3, 0.15, 0.35], [13.6, -0.1, 0.42], [14.25, -0.72, 0.68], [15.0, -1.12, 1.35], [15.8, -1.25, 2.05], [16.8, -1.3, 2.15],
    [17.8, -1.38, 2.15], [19.3, -1.5, 2.2], [20.5, -1.7, 2.25], [23.2, -1.8, 2.3]
  ]);
  const S6_GAIT = { t0: 13.3, T: 0.4, width: 0.1, lift: 0.13, dip: 0.04, bob: 0.035, twist: 0.1, lean: 0.06 };

  const S6_CAM = track([
    [13.6, { az: 248, el: 50, dist: 3.1, ty: 0.95, fov: 50 }],
    [14.25, { az: 258, el: 45, dist: 3.0, ty: 0.95 }],
    [15.0, { az: 272, el: 38, dist: 2.9, ty: 0.95 }],
    [16.0, { az: 287, el: 30, dist: 2.7, ty: 0.8 }],
    [16.7, { az: 297, el: 25, dist: 2.5, ty: 0.75 }],
    [17.4, { az: 308, el: 4, dist: 2.7, ty: 1.05 }],
    [18.2, { az: 318, el: 3, dist: 2.3, ty: 1.05 }],
    [19.0, { az: 326, el: 2, dist: 1.2, ty: 1.55, fov: 46 }],
    [19.8, { az: 336, el: 9, dist: 1.15, ty: 1.35 }],
    [20.4, { az: 343, el: 0, dist: 1.1, ty: 1.55 }],
    [20.9, { az: 348, el: -9, dist: 1.0, ty: 1.6 }],
    [21.6, { az: 354, el: -14, dist: 0.95, ty: 1.65 }],
    [22.2, { az: 359, el: -19, dist: 0.9, ty: 1.68 }],
    [23.2, { az: 360, el: -20, dist: 0.9, ty: 1.68 }]
  ]);

  const S6_HUGH = track([
    [15.75, { yaw: PI, h: standH('hugh') - 0.04, lean: [0.1, 0], sp: [0.1, 0, 0], nk: [0.25, 0, 0], hL: [0.2, -0.05, 0.25], hR: [-0.2, -0.05, 0.05], handL: 'open', handR: 'open', fL: [0.14, 0.07, 0.15], fR: [-0.14, 0.07, -0.15] }],
    [16.0, { h: standH('hugh') - 0.12, lean: [0.45, 0], sp: [0.25, 0, 0], nk: [0.2, 0, 0], hL: [0.05, 0.3, 0.3], hR: [-0.05, 0.28, 0.3], handL: 'fist', handR: 'fist', fL: [0.2, 0.07, 0.25], fR: [-0.2, 0.07, -0.2] }],
    [16.25, { h: standH('hugh') - 0.22, lean: [0.55, 0], sp: [0.3, 0, 0] }],
    [16.38, { hL: [0.18, 0.2, 0.62], eL: [0.6, -0.6, -0.2], handL: 'point', hR: [-0.2, 0.0, 0.2], handR: 'relax' }],
    [16.62, { h: standH('hugh') - 0.28, lean: [0.68, 0], hL: [0.2, 0.15, 0.66] }],
    [16.8, { h: standH('hugh') - 0.28, lean: [0.68, 0] }],
    [16.97, { yaw: PI * 0.12, h: standH('hugh') - 0.02, lean: [-0.05, 0], sp: [-0.1, 0, 0], nk: [-0.7, 0.3, -0.1], hL: [0.42, 0.05, 0.25], hR: [-0.42, 0.05, 0.25], eL: [0.8, -0.6, 0], eR: [-0.8, -0.6, 0], handL: 'flat', handR: 'flat', wL: [0, 0, -2.6], wR: [0, 0, -2.6], fL: [0.09, 0.07, 0.02], fR: [-0.09, 0.07, 0.02] }],
    [17.75, { nk: [-0.72, 0.38, -0.12], lean: [-0.06, -0.06] }],
    [17.87, { yaw: PI * 0.2, h: standH('hugh') - 0.12, lean: [0.12, 0], sp: [0.1, 0, 0], nk: [0.05, 0, 0], hR: [-0.55, -0.15, 0.35], eR: [-0.5, -0.8, -0.3], handR: 'point', wR: [0, 0, 0], hL: [0.05, 0.2, 0.2], handL: 'flat', wL: [0, 0, 0], fL: [0.2, 0.07, 0.05], fR: [-0.22, 0.07, 0.0] }],
    [18.0, { lean: [0.3, -0.25], hR: [-0.45, 0.2, 0.45] }],
    [18.25, { lean: [0.55, -0.35], sp: [0.25, 0, 0], nk: [0.4, -0.3, 0], hR: [-0.35, -0.3, 0.55], h: standH('hugh') - 0.2 }],
    [18.5, { lean: [0.58, -0.38], nk: [0.45, -0.4, 0] }],
    [18.75, { yaw: PI * 0.25, h: standH('hugh') - 0.02, lean: [-0.12, 0], sp: [-0.05, 0, 0], nk: [-0.55, 0, 0], hR: [-0.32, -0.25, 0.12], handR: 'spread', hL: [0.03, 0.2, 0.32], eL: [1, -0.4, -0.2], handL: 'thumb', fL: [0.12, 0.07, 0.02], fR: [-0.12, 0.07, 0.02] }],
    [19.3, { nk: [-0.55, 0.05, 0.08], lean: [-0.1, -0.08] }],
    [19.45, { yaw: -PI * 0.42, h: standH('hugh') - 0.2, lean: [0.48, 0], sp: [0.2, 0, 0], nk: [0.35, 0, 0], hR: [-0.15, -0.35, 0.62], eR: [-0.5, -0.6, -0.4], handR: 'point', hL: [0.25, -0.25, -0.2], handL: 'relax', fL: [0.18, 0.07, -0.2], fR: [-0.18, 0.07, 0.3] }],
    [20.0, { hR: [-0.18, -0.1, 0.6] }],
    [20.2, { yaw: PI * 0.08, h: standH('hugh') - 0.05, lean: [0.12, 0], sp: [0.05, 0, 0], nk: [0.25, 0, 0], hR: [-0.25, 0.38, 0.32], eR: [-0.6, -0.8, 0], handR: 'point', hL: [0.22, -0.2, 0.05], handL: 'relax', fL: [0.12, 0.07, 0.02], fR: [-0.12, 0.07, 0.02] }],
    [20.45, { nk: [0.28, 0.05, 0] }],
    [20.6, { yaw: -PI * 0.25, h: standH('hugh') - 0.02, lean: [-0.05, 0], nk: [-0.35, -0.3, 0], hR: [-0.22, -0.2, 0.05], handR: 'relax', hL: [-0.12, 0.38, 0.32], eL: [0.9, -0.3, -0.2], handL: 'flat' }],
    [21.05, { hL: [0.35, 0.68, 0.25], eL: [0.9, -0.6, 0], handL: 'open', wL: [0, 0, 0] }],
    [21.3, { yaw: 0.0, nk: [0.2, -0.3, 0], hL: [0.2, -0.15, 0.1], handL: 'relax' }],
    [21.5, { yaw: 0.05, nk: [0.05, 0.1, 0], hR: [-0.45, -0.32, 0.4], handR: 'grip', mouth: 'grin' }],
    [21.68, { yaw: 0.25, nk: [-0.3, 0.2, 0], hR: [-0.35, 0.28, 0.5], eR: [-0.8, -0.6, 0], prop: { kind: 'history', side: 'R', off: [-0.03, -0.12, 0.05], rx: 0.3, ry: -1.6, rz: 0 } }],
    [22.2, { hR: [-0.36, 0.3, 0.52] }],
    [22.33, { hR: [-0.1, -0.2, 0.45], prop: null, handR: 'open' }],
    [22.5, { yaw: 0.35, lean: [-0.15, 0], nk: [-0.4, 0.2, 0], hL: [0.1, 0.25, 0.25], handL: 'open', hR: [-0.25, -0.2, 0.1], handR: 'relax' }],
    [22.7, { hR: [-0.62, 0.62, 0.25], eR: [-0.8, -0.5, -0.2], handR: 'open', wR: [0, 0, 0] }],
    [23.0, { hR: [-0.7, 0.35, 0.25] }],
    [23.17, { hR: [-0.66, 0.55, 0.22] }]
  ]);

  function shotTake(t) {
    const c = S6_CAM(t);
    const p = S6_PATH(Math.min(t, 23.1));
    let hugh;
    if (t < 15.75) {
      const sw = S(((t - S6_GAIT.t0) / S6_GAIT.T) * PI);
      hugh = strut('hugh', S6_PATH, t, S6_GAIT, { glasses: 'clear', eyes: 'cool', nk: [0.22, 0, 0], hL: [0.2, -0.12, 0.05 + sw * 0.18], hR: [-0.2, -0.12, 0.05 - sw * 0.18], eL: [0.7, -0.2, -0.6], eR: [-0.7, -0.2, -0.6], handL: 'open', handR: 'open', mouth: 'smirk' });
    } else {
      const k = S6_HUGH(t);
      const pp = S6_PATH(Math.min(t, 23.1));
      k.x = pp[0];
      k.z = pp[1];
      k.glasses = t > 17.85 && t < 19.4 ? 'shades' : 'clear';
      k.eyes = 'cool';
      if (!k.mouth || k.mouth === 'closed') k.mouth = 'smirk';
      talk(k, 'hugh', t);
      if (k.mouth === 'grin' && k.open > 0.35) k.mouth = 'open';
      hugh = body('hugh', k);
    }
    const target = [p[0], c.ty, p[1]];
    const cam = orbit(target, c.az, c.el, c.dist);
    cam.fov = c.fov || 50;
    const sunny = clamp(1 - (t - 16.8) / 1.5, 0, 1);
    const pools = [{ x: p[0] + 0.1, z: p[1] + 0.1, r: 0.9, a: 0.55 * sunny + 0.2, col: [1, 0.9, 0.65] }, { x: JUKE[0], z: JUKE[2] + 1.4, r: 1.3, a: 0.5, col: [1, 0.85, 0.45] }];
    if (sunny > 0) pools.push({ x: p[0] - 1.2, z: p[1] + 0.6, r: 0.8, a: 0.5 * sunny, col: [1, 0.92, 0.7] }, { x: p[0] + 1.0, z: p[1] - 0.8, r: 0.7, a: 0.45 * sunny, col: [1, 0.92, 0.7] });
    const shafts = sunny > 0 ? [{ from: [p[0] - 2.5, 3.3, p[1] + 3.5], to: [p[0] - 0.3, 0, p[1] + 0.4], w: 1.2, a: 0.22 * sunny }, { from: [p[0] - 1.5, 3.3, p[1] + 4.0], to: [p[0] + 0.8, 0, p[1] + 0.2], w: 0.9, a: 0.16 * sunny }] : [];
    return {
      camera: cam,
      light: { base: 'dance', points: [{ pos: [p[0] + 0.6, 2.6, p[1] + 1.2], color: [0.6, 0.5, 0.35] }, { pos: [JUKE[0], 1.0, JUKE[2] + 0.9], color: [1.2, 0.6, 0.4] }] },
      roomTint: [0.72, 0.68, 0.7],
      windowTint: [1.1, 1.15, 1.2],
      jukeLit: 1,
      pools,
      shafts,
      dust: { a: 0.35, depth: 2.5 },
      soft: t > 18.6 ? 0.45 : 0,
      cast: [{ who: 'hugh', pose: hugh, shadow: [0.32, 0.22, 0.35] }]
    };
  }

  const S7_PATH = pathOf([[22.0, -0.1, -1.62], [26.8, 2.78, -1.62]]);
  const S7_GAIT = { t0: 21.9, T: 0.85, width: 0.11, lift: 0.1, dip: 0.05, bob: 0.03, twist: 0.1, lean: 0.03, yaw: PI / 2 };

  function shotFeet(t) {
    const hugh = strut('hugh', S7_PATH, t, S7_GAIT, { glasses: 'shades', eyes: 'cool', hL: [0.2, -0.12, 0.05], hR: [-0.2, -0.12, 0.05] });
    if (t > 23.7 && t < 24.45) {
      const k = S(clamp((t - 23.7) / 0.75, 0, 1) * PI);
      const key = hugh.fLw[1] > hugh.fRw[1] ? 'fLw' : 'fRw';
      hugh[key] = [hugh[key][0] - 0.05 * k, hugh[key][1] + 0.22 * k, hugh[key][2]];
    }
    const p = S7_PATH(t);
    const camX = p[0] - 0.12 + S(((t - 23.17) / 0.85) * PI) * 0.04;
    const tilt = clamp((t - 26.6) / 0.13, 0, 1);
    return {
      camera: { eye: [camX, 0.08 + tilt * 0.5, -1.02], at: [camX, 0.14 + tilt * 2.2, -2.3], fov: 46 },
      light: { base: 'dance', points: [{ pos: [p[0] + 0.3, 0.5, -1.15], color: [1.1, 0.85, 0.4] }] },
      roomTint: [0.55, 0.52, 0.56],
      jukeLit: 1,
      pools: [{ x: p[0] + 0.15, z: -1.55, r: 0.9, a: 0.6, col: [1, 0.9, 0.55] }],
      smear: tilt > 0 ? [0, 0.12 * tilt, 0.9] : null,
      cast: [
        { who: 'hugh', pose: hugh },
        { who: 'nick', pose: body('nick', { x: 2.6, z: -2.38, yaw: -0.4, hL: [0.16, -0.25, 0.02], hR: [-0.16, -0.25, 0.02] }) },
        { who: 'libby', pose: body('libby', { x: 3.25, z: -2.35, yaw: -0.6, hL: [0.15, -0.22, 0.03], hR: [-0.15, -0.22, 0.03] }) }
      ]
    };
  }

  const NICK_SEAT = [-0.95, -2.2];
  const CARL_SEAT = [1.07, -2.05];

  const S8_HUGH = track([
    [26.767, { x: 0.75, z: -1.38, yaw: -0.25, lean: [0.26, 0], sp: [0.18, 0, 0], h: standH('hugh') - 0.22, fL: [0.2, 0.07, 0.12], fR: [-0.2, 0.07, -0.08], nk: [0.12, 0.0, 0], glasses: 'shades', eyes: 'cool', mouth: 'frown', hL: [0.22, -0.2, 0.05], hR: [-0.2, -0.2, 0.05], fL: [0.12, 0.07, 0.05], fR: [-0.12, 0.07, -0.05] }],
    [27.12, { hR: [-0.12, 0.2, 0.35], handR: 'open' }],
    [27.27, { hR: [-0.05, 0.62, 0.32], nk: [-0.2, 0.05, 0], handR: 'open' }],
    [27.4, { nk: [-0.4, 0.1, 0], lean: [0.2, 0], mouth: 'grin', hR: [-0.15, 0.2, 0.3] }],
    [27.5, { hR: [-0.12, 0.25, 0.5], eR: [-0.8, -0.6, -0.2], handR: 'gun', hL: [0.12, 0.05, 0.45], eL: [0.8, -0.6, -0.2], handL: 'gun', wR: [0, 0, 0], wL: [0, 0, 0] }],
    [27.75, { hR: [-0.12, 0.29, 0.52], hL: [0.12, 0.09, 0.47], bob: 0.02 }],
    [28.0, { hR: [-0.12, 0.25, 0.5], hL: [0.12, 0.05, 0.45], bob: 0, mouth: 'smirk' }],
    [28.25, { mouth: 'smile' }],
    [28.5, { nk: [-0.38, 0.1, 0] }],
    [28.8, { yaw: 0.6, lean: [0.18, 0], sp: [0.12, 0, 0], nk: [-0.05, -0.1, 0], hR: [-0.2, -0.15, 0.2], handR: 'relax', hL: [0.12, 0.42, 0.3], eL: [0.6, -0.9, 0], handL: 'thumb', mouth: 'open' }],
    [29.0, { nk: [-0.05, -0.12, 0], hL: [0.08, 0.5, 0.3] }],
    [29.62, { hL: [0.06, 0.56, 0.28] }],
    [29.75, { nk: [0.05, -0.12, 0] }],
    [29.9, { nk: [0.55, -0.1, -0.15], lean: [0.38, 0], sp: [0.3, 0, 0], hL: [0.18, -0.1, 0.2], handL: 'relax' }],
    [30.233, { nk: [0.62, -0.12, -0.18], lean: [0.45, 0], sp: [0.35, 0, 0] }]
  ]);

  const S8_CAM = camKeys([
    [26.767, [0.98, 1.72, -0.42], [-0.35, 1.28, -2.4], 50],
    [28.4, [0.98, 1.72, -0.42], [-0.35, 1.28, -2.4], 50],
    [28.93, [0.98, 1.72, -0.42], [1.3, 1.25, -2.3], 50],
    [29.85, [0.98, 1.72, -0.42], [1.3, 1.25, -2.3], 50],
    [30.233, [0.95, 1.72, -0.5], [1.2, 1.3, -2.3], 50]
  ]);

  function shotNick(t) {
    const hk = talk(S8_HUGH(t), 'hugh', t);
    if (hk.mouth === 'grin' && hk.open > 0.35) hk.mouth = 'open';
    const nickFace = t < 27.9 ? { eyes: 'half', mouth: 'closed' } : t < 28.15 ? { eyes: 'half', mouth: 'o', open: 0.2 } : t < 28.45 ? { eyes: 'half', mouth: 'smile' } : { eyes: 'happy', mouth: 'grin' };
    const carlFace = t < 29.6 ? { eyes: 'upleft', mouth: 'open', open: 0.5 } : { eyes: 'upleft', mouth: 'grin' };
    return {
      camera: S8_CAM(t),
      light: { base: 'dance', points: [{ pos: [0.2, 2.4, -0.6], color: [0.6, 0.5, 0.35] }, { pos: [-2.0, 1.6, -4.5], color: [0.25, 0.5, 0.7] }] },
      roomTint: [0.7, 0.66, 0.66],
      jukeLit: 1,
      smear: t > 28.45 && t < 28.95 ? [-0.08 * S(((t - 28.45) / 0.5) * PI), 0, 0.85] : t > 29.85 && t < 30.1 ? [0, 0.04, 0.5] : null,
      soft: 0.4,
      dust: { a: 0.25, depth: 2.0 },
      cast: [
        { who: 'hugh', pose: body('hugh', hk) },
        { who: 'nick', pose: body('nick', Object.assign({ x: -0.3, z: -1.85, yaw: 0.55, sp: [0.02, 0, 0], nk: [-0.2, 0.6, 0.1], hL: [0.15, -0.24, 0.02], hR: [-0.15, -0.24, 0.02] }, nickFace)) },
        { who: 'carl', pose: body('carl', Object.assign({ x: 1.89, z: -2.05, yaw: -1.15, h: 0.82, lean: [0.15, -0.12], sp: [0.15, 0, 0], nk: [-0.35, 0.1, 0], hRw: [1.72, 1.01, -2.52], eR: [-0.6, -0.8, -0.3], handR: 'flat', hL: t > 29.6 ? [0.18, 0.32, 0.25] : [0.12, 0.0, 0.3], handL: t > 29.6 ? 'point' : 'relax', fL: [0.1, 0.36, 0.25], fR: [-0.1, 0.36, 0.25], kL: [0.2, 0.9, 1], kR: [-0.2, 0.9, 1] }, carlFace)) }
      ]
    };
  }

  const S9_HUGH = track([
    [30.233, { x: 0.25, z: -1.25, yaw: -0.65, lean: [0, -0.18], sp: [0.05, 0, -0.05], nk: [0.2, 0.05, 0.05], glasses: 'clear', eyes: 'cool', mouth: 'closed', hR: [-0.35, -0.25, 0.25], eR: [-0.7, -0.4, -0.5], handR: 'point', hL: [0.42, 0.05, 0.3], eL: [0.8, -0.4, -0.4], handL: 'open', fL: [0.08, 0.07, 0.03], fR: [-0.08, 0.07, -0.02] }],
    [30.5, { lean: [0, -0.26] }],
    [30.75, { lean: [-0.06, -0.05], nk: [-0.35, 0.05, 0], hR: [-0.42, -0.38, 0.2], handR: 'open', hL: [0.32, -0.08, 0.25], handL: 'fist' }],
    [31.0, { lean: [-0.04, 0], hL: [0.42, -0.12, 0.35], handL: 'point', mouth: 'smirk' }],
    [31.25, { nk: [-0.42, 0.05, 0], hL: [0.36, -0.1, 0.38] }],
    [31.5, { hL: [0.4, -0.3, 0.32] }],
    [31.75, { hR: [-0.15, 0.25, 0.35], handR: 'open', hL: [0.3, -0.35, 0.25], handL: 'fist' }],
    [32.0, { nk: [-0.5, 0.0, 0], hR: [-0.6, -0.15, 0.2], eR: [-0.4, -0.8, -0.4], handR: 'point' }],
    [32.25, { hR: [-0.58, -0.12, 0.22] }],
    [32.5, { nk: [-0.4, 0, 0], hR: [-0.4, 0.15, 0.3] }],
    [32.75, { nk: [-0.65, 0, 0], hR: [-0.65, 0.35, 0.15], hL: [0.25, 0.3, 0.55], handL: 'open', mouth: 'o' }],
    [33.0, { lean: [-0.12, 0], nk: [-0.68, 0, 0], hR: [-0.66, 0.38, 0.12], handR: 'open', hL: [0.38, 0.42, 0.42], eL: [0.9, -0.5, 0], handL: 'point', wL: [0, 0, 0] }],
    [33.25, { hL: [0.4, 0.45, 0.42] }],
    [33.5, { hR: [-0.5, 0.15, 0.2], hL: [0.2, 0.62, 0.3] }],
    [33.75, { nk: [-0.75, 0, 0], hL: [0.22, 0.75, 0.22], eL: [0.6, -0.8, 0], hR: [-0.45, -0.3, 0.1], handR: 'relax', mouth: 'closed' }],
    [34.0, { hL: [0.18, 0.95, 0.12] }],
    [34.25, { hL: [0.15, 1.05, 0.05] }],
    [34.5, { hL: [0.12, 1.12, 0.02] }],
    [34.8, { x: 0.25, z: -1.25 }],
    [35.1, { x: -0.25, z: -0.75, yaw: -1.2 }]
  ]);

  const S9_CAM = camKeys([
    [30.233, [0.3, 0.95, 0.35], [0.25, 1.15, -1.3], 46],
    [31.0, [0.3, 0.9, 0.3], [0.25, 1.15, -1.3], 46],
    [32.0, [0.28, 0.72, -0.05], [0.25, 1.55, -1.3], 46],
    [33.0, [0.26, 0.6, -0.4], [0.25, 1.85, -1.2], 46],
    [34.4, [0.24, 0.52, -0.72], [0.22, 2.1, -1.15], 46],
    [35.2, [0.24, 0.52, -0.72], [0.22, 2.1, -1.15], 46]
  ]);

  function shotLow(t) {
    const hk = talk(S9_HUGH(t), 'hugh', t);
    const haze = clamp((t - 31.6) / 1.2, 0, 1);
    return {
      camera: S9_CAM(t),
      light: { base: 'dance', to: 'haze', k: haze, points: [{ pos: [0.6, 2.5, -0.6], color: [0.7, 0.6, 0.4] }] },
      roomTint: [0.66, 0.64, 0.6],
      jukeLit: 1,
      soft: 0.35 + haze * 0.35,
      dust: { a: 0.3 + haze * 0.45, depth: 2.2 },
      glows: haze > 0 ? [{ p: [0.6, 2.9, -1.6], s: 3.2, a: 0.25 * haze, col: [0.9, 0.8, 0.45] }] : [],
      cast: [
        { who: 'hugh', pose: body('hugh', hk), shadow: [0.3, 0.22, 0.3] },
        { who: 'nick', pose: body('nick', { x: -0.42, z: -1.78, yaw: 0.55, nk: [-0.15, 0.3, 0], hL: [0.14, -0.24, 0.03], hR: [-0.14, -0.24, 0.03], eyes: 'half', mouth: 'closed' }) },
        { who: 'carl', pose: body('carl', { x: 1.02, z: -1.72, yaw: -0.65, lean: [0.06, 0], nk: [-0.2, 0, 0], hR: [-0.1, 0.18, 0.32], eR: [-0.7, -0.6, -0.2], handR: 'point', eyes: 'happy', mouth: 'grin' }) }
      ]
    };
  }

  const BETTY_T = [-5.9, 0.55];
  const BETTY_SEAT = [-5.9, 0.0];

  const S10_HUGH = track([
    [35.167, { x: -5.32, z: 0.08, yaw: -1.3, sp: [0.25, 0, 0], lean: [0.15, 0], nk: [0.3, 0.1, 0], glasses: 'shades', eyes: 'cool', mouth: 'smirk', hR: [-0.25, 0.25, 0.42], handR: 'open', hL: [0.2, -0.2, 0.05] }],
    [35.25, { hRw: [-5.62, 1.15, 0.2] }],
    [35.45, { hRw: [-5.95, 0.95, 0.35] }],
    [35.62, { hRw: [-5.98, 0.9, 0.48], handR: 'grip' }],
    [35.75, { hRw: [-5.95, 1.0, 0.75] }],
    [38.97, { x: -5.2, z: -0.15, yaw: 0.9, sp: [0, 0, 0], lean: [0, 0.32], nk: [0.4, 0.55, 0.15], hRw: null, hR: [-0.5, 0.65, 0.1], eR: [-0.9, -0.3, -0.2], handR: 'spread', hL: [0.38, -0.2, 0.2], eL: [0.8, -0.3, -0.4], handL: 'spread', wL: [0, 0, 0], fL: [0.42, 0.07, 0.12], fR: [-0.42, 0.07, -0.05], kL: [0.8, 0.6, 0.6], kR: [-0.8, 0.6, 0.6], h: standH('hugh') - 0.2, mouth: 'closed' }],
    [39.25, { bob: 0.02, mouth: 'grin' }],
    [39.5, { bob: 0, mouth: 'grin' }],
    [39.75, { bob: 0.015, mouth: 'smile' }],
    [39.95, { bob: 0, mouth: 'smile' }],
    [40.1, { yaw: 0.35, lean: [-0.05, 0], nk: [-0.1, 0.2, 0], hR: [-0.15, 0.2, 0.35], handR: 'spread', h: standH('hugh') - 0.06, fL: [0.15, 0.07, 0.05], fR: [-0.25, 0.07, -0.2], kL: [0.2, 0.5, 1], kR: [-0.2, 0.5, 1] }],
    [40.25, { yaw: 0.75, lean: [-0.17, 0], nk: [-0.3, 0.15, 0], hR: [0.0, 0.18, 0.28], eR: [-0.9, -0.4, -0.2], handR: 'spread', hL: [0.2, -0.28, 0.0], handL: 'relax' }],
    [41.43, { nk: [-0.32, 0.18, 0], bob: 0.01 }]
  ]);

  const S10_BETTY = track([
    [35.167, { x: BETTY_SEAT[0], z: BETTY_SEAT[1], yaw: 0, h: 0.52, sp: [0.12, 0, 0], nk: [0.3, 0, 0], hL: [0.1, -0.02, 0.32], hR: [-0.1, -0.02, 0.32], eL: [0.8, -0.4, -0.2], eR: [-0.8, -0.4, -0.2], handL: 'relax', handR: 'relax', fL: [0.07, 0.07, 0.3], fR: [-0.07, 0.07, 0.3], kL: [0.1, 0.6, 1], kR: [-0.1, 0.6, 1], eyes: 'down', mouth: 'smile' }],
    [35.25, { nk: [-0.1, 0.1, 0], eyes: 'upright' }],
    [35.6, { eyes: 'closed', mouth: 'smile', hL: [0.04, 0.12, 0.2], hR: [-0.04, 0.12, 0.2] }],
    [38.97, { yaw: 0.6, nk: [-0.35, 0.45, 0], eyes: 'upright', mouth: 'frown' }],
    [39.25, { eyes: 'wide', mouth: 'o', open: 0.3 }],
    [39.7, { eyes: 'half', mouth: 'frown', nk: [-0.3, 0.45, 0.15] }],
    [39.87, { eyes: 'closed', mouth: 'grin' }],
    [40.0, { hL: [0.08, 0.32, 0.18], hR: [-0.08, 0.32, 0.18] }],
    [40.13, { nk: [-0.3, 0.45, 0], hL: [0.1, 0.42, 0.13], hR: [-0.1, 0.42, 0.13], eL: [0.9, -0.5, 0], eR: [-0.9, -0.5, 0], handL: 'spread', handR: 'spread', eyes: 'shock', mouth: 'scream' }],
    [41.43, { nk: [-0.31, 0.46, 0.02] }]
  ]);

  const S10_CAM = camKeys([
    [35.167, [-5.95, 0.96, 1.12], [-5.98, 0.86, -0.05], 40],
    [35.8, [-5.95, 0.96, 1.12], [-5.98, 0.86, -0.05], 40],
    [38.5, [-5.95, 0.96, 1.12], [-5.98, 0.86, -0.05], 40],
    [38.6, [-5.6, 0.98, 1.95], [-5.6, 1.0, -0.2], 42],
    [38.93, [-5.2, 0.95, 2.75], [-5.35, 1.45, -0.3], 40],
    [41.433, [-5.2, 0.95, 2.75], [-5.35, 1.45, -0.3], 40]
  ]);

  function dictM(t) {
    const base = [BETTY_T[0] - 0.24, 0.83, BETTY_T[1] - 0.02];
    if (t < 35.62) return M4.chain(M4.translate(base[0], base[1], base[2]), M4.rotY(0.25), M4.rotX(-0.35));
    const k = clamp((t - 35.62) / 0.2, 0, 1);
    return M4.chain(M4.translate(base[0] - 0.05 * k, base[1] + 0.35 * k, base[2] + 0.7 * k), M4.rotY(0.25 * (1 - k)), M4.rotX(-0.35 - 1.0 * k));
  }

  function shotBetty(t) {
    const hk = talk(S10_HUGH(t), 'hugh', t);
    const bk = S10_BETTY(t);
    const st = {
      camera: S10_CAM(t),
      light: { base: 'dance', points: [{ pos: [-5.6, 2.2, 1.2], color: [0.6, 0.5, 0.35] }, { pos: [-5.8, 1.6, -4.8], color: [0.35, 0.65, 0.85] }] },
      roomTint: [0.66, 0.64, 0.62],
      windowTint: [1.25, 1.3, 1.35],
      jukeLit: 1,
      soft: 0.35,
      dust: { a: 0.2, depth: 2.0 },
      props: t < 35.833 ? [{ kind: 'dict', m: dictM(t) }] : [],
      smear: t > 35.2 && t < 35.5 ? [0.04, 0.06, 0.5] : t > 35.7 && t < 35.84 ? [-0.06, 0.08, 0.85] : t > 38.5 && t < 38.95 ? [0.1, -0.04, 0.85] : null,
      cast: [
        { who: 'betty', pose: body('betty', bk) },
        { who: 'hugh', pose: body('hugh', hk), shadow: [0.3, 0.22, 0.3] }
      ]
    };
    if (t >= 35.833 && t < 38.6) {
      const up = clamp((t - 38.13) / 0.34, 0, 1);
      const settle = clamp((t - 35.833) / 0.27, 0, 1);
      const eye = [-5.83, 1.0, 1.62];
      st.camera = { eye, at: [-5.83, 1.0, 1.0], fov: 40 };
      st.page = { m: M4.chain(M4.translate(-5.825, 0.985 + up * 0.12 - (1 - settle) * 0.05, 1.355), M4.rotZ((1 - settle) * 0.35), M4.rotY(-0.05)), fy: -up * 0.08, out: t > 38.5 ? (t - 38.5) * 6 : 0 };
      st.smear = t < 36.1 ? [0.03, -0.05, 0.8 * (1 - settle)] : t > 38.3 ? [0.04, 0.05, 0.6] : null;
    }
    return st;
  }

  const S11_HUGH = track([
    [41.433, { x: 1.65, z: -1.3, yaw: 0.05, lean: [-0.08, 0], nk: [-0.3, 0, 0], glasses: 'shades', eyes: 'cool', mouth: 'open', hL: [0.2, -0.22, 0.05], hR: [-0.2, -0.22, 0.05], fL: [0.1, 0.07, 0.02], fR: [-0.1, 0.07, 0.02] }],
    [41.62, { nk: [-0.2, 0.1, -0.2], sp: [0, 0.3, 0] }],
    [41.8, { sp: [0, -0.4, 0], nk: [-0.1, -0.3, 0], hR: [-0.3, -0.1, 0.2], hL: [0.25, 0.1, 0.1] }],
    [42.0, { yaw: -1.1, lean: [0.1, -0.22], sp: [0.05, 0, 0], nk: [0.05, 0, 0], hL: [0.05, 0.28, 0.25], handL: 'flat', hR: [-0.25, -0.25, 0.1], mouth: 'closed' }],
    [42.25, { lean: [0.35, -0.2], nk: [0.25, 0, 0], hR: [-0.15, -0.45, 0.35], handR: 'relax', h: standH('hugh') - 0.06 }],
    [42.5, { yaw: -0.6, lean: [0.2, -0.15], nk: [0.25, -0.1, 0.1], hR: [-0.2, -0.4, 0.25], handR: 'point', hL: [0.25, 0.15, 0.3], handL: 'open', mouth: 'smile' }],
    [42.75, { yaw: 0.0, lean: [0, 0.05], h: standH('hugh'), nk: [-0.05, 0, 0.2], hL: [0.24, 0.72, 0.12], eL: [0.9, -0.6, 0], handL: 'point', hR: [0.05, 0.25, 0.25], handR: 'flat' }],
    [43.0, { lean: [0, -0.08], nk: [-0.1, 0, 0.15], hL: [0.22, -0.2, 0.05], handL: 'relax', hR: [-0.22, -0.22, 0.08], handR: 'relax', mouth: 'o', open: 0.25 }],
    [43.25, { yaw: -0.9, lean: [0.25, -0.1], nk: [0.2, 0, 0], hL: [0.05, 0.55, 0.3], handL: 'open', hR: [-0.2, -0.35, 0.2] }],
    [43.5, { yaw: -0.2, lean: [-0.12, 0], nk: [-0.75, 0.1, 0], hL: [0.05, 0.25, 0.25], handL: 'fist', hR: [-0.2, -0.2, 0.05], mouth: 'closed', open: 0 }],
    [43.85, { yaw: 0.2 }],
    [44.05, { yaw: PI * 0.9, nk: [-0.2, 0, 0], hR: [-0.5, -0.3, 0.1], handR: 'open' }],
    [44.3, { yaw: PI * 2, lean: [-0.05, 0], nk: [-0.45, 0, 0.1], hL: [0.5, -0.3, 0.15], eL: [0.8, -0.6, 0], handL: 'flat', hR: [-0.5, -0.3, 0.15], eR: [-0.8, -0.6, 0], handR: 'flat' }],
    [45.0, { nk: [-0.5, 0.15, 0.15], mouth: 'o', open: 0.2 }],
    [45.13, { yaw: PI * 2 - 0.6 }],
    [45.47, { x: 1.2, z: -1.55, yaw: PI * 2 - 2.3, nk: [0.2, 0, 0], hL: [0.22, -0.2, 0.1], hR: [-0.22, -0.2, 0.1], handL: 'relax', handR: 'relax' }]
  ]);

  function shotCrowd(t) {
    const hk = talk(S11_HUGH(t), 'hugh', t);
    const drift = (t - 41.433) * 0.06;
    const kidFace = { eyes: 'up', mouth: 'o', open: 0.15 };
    return {
      camera: { eye: [1.78 - drift, 1.32, 2.6], at: [1.62 - drift * 0.4, 1.36, -1.3], fov: 30 },
      light: { base: 'dance', points: [{ pos: [1.6, 2.6, -0.6], color: [0.8, 0.65, 0.4] }, { pos: [0.6, 1.9, -4.6], color: [0.6, 0.45, 0.25] }] },
      roomTint: [0.66, 0.62, 0.58],
      jukeLit: 1,
      soft: 0.45,
      dust: { a: 0.3, depth: 3.0 },
      cast: [
        { who: 'hugh', pose: body('hugh', hk), shadow: [0.3, 0.22, 0.3] },
        { who: 'sam', pose: body('sam', Object.assign({}, SAM_IDLE, { x: 0.65, yaw: 0.45, sp: [0.35, 0, 0], h: standH('sam') - 0.1, nk: [-0.15, 0.3, 0], hLw: [0.85, 1.02, -2.9], hRw: [0.4, 1.02, -2.9], eyes: 'right', mouth: t > 44.4 && t < 45.1 ? 'o' : 'closed', open: t > 44.4 && t < 45.1 ? 0.3 : 0 })) },
        { who: 'kidB', pose: body('kidB', Object.assign({ x: 2.62, z: -0.75, yaw: -0.9, nk: [-0.3, 0, 0] }, kidFace)) },
        { who: 'cindy', pose: body('cindy', Object.assign({ x: 2.95, z: -0.4, yaw: -1.0, nk: [-0.32, 0, 0] }, kidFace)) },
        { who: 'kidA', pose: body('kidA', { x: 1.75 - drift * 0.5, z: 1.45, yaw: PI, nk: [-0.25, 0, 0] }) },
        { who: 'kidC', pose: body('kidC', { x: 2.25 - drift * 0.5, z: 1.5, yaw: PI - 0.2, nk: [-0.25, 0, 0] }) },
        { who: 'carl', pose: body('carl', { x: 1.15 - drift * 0.5, z: 1.55, yaw: PI + 0.3, nk: [-0.25, 0, 0] }) }
      ]
    };
  }

  const S12_STOOL = [2.71, -2.05];
  const S12_HUGH = track([
    [45.5, { x: 3.25, z: -1.7, yaw: -1.4, h: standH('hugh'), glasses: 'shades', eyes: 'cool', mouth: 'smirk', fLw: [3.3, 0.07, -1.62], fRw: [3.2, 0.07, -1.82], hL: [0.25, -0.1, 0.1], hR: [-0.25, -0.1, 0.1] }],
    [45.63, { x: 3.05, z: -1.8, h: standH('hugh') + 0.12, fLw: [3.25, 0.07, -1.65], fRw: [2.8, 0.82, -2.05] }],
    [45.9, { x: 2.95, z: -1.95, h: standH('hugh') + 0.35, fLw: [3.1, 0.12, -1.75], fRw: [2.78, 0.82, -2.05] }],
    [46.3, { x: 2.75, z: -2.35, h: standH('hugh') + 0.72, fLw: [2.65, 1.06, -2.8], fRw: [2.75, 0.84, -2.08] }],
    [46.55, { x: 2.55, z: -2.75, h: standH('hugh') + 1.0, fLw: [2.6, 1.06, -2.85], fRw: [2.5, 1.2, -2.6] }],
    [46.75, { x: 2.3, z: -2.85, h: standH('hugh') + 1.02, fLw: [2.15, 1.06, -2.82], fRw: [2.45, 1.1, -2.9] }],
    [47.0, { x: 2.1, z: -2.85, fLw: [2.1, 1.06, -2.82], fRw: [2.05, 1.06, -2.92] }],
    [47.37, { x: 2.05, z: -2.85, hRw: undefined, hR: [-0.5, 0.25, 0.4], handR: 'open' }]
  ]);

  function guitarM(t) {
    const up = clamp((t - 46.8) / 0.15, 0, 1);
    const base = [2.62, 1.25 + up * 0.18, -3.12];
    return M4.chain(M4.translate(base[0], base[1], base[2]), M4.rotY(0.25), M4.rotZ(lerp(-1.6, 0.55, up)));
  }

  function shotStep(t) {
    const k = S12_HUGH(t);
    const pose = body('hugh', Object.assign({}, k, { fL: undefined, fR: undefined }));
    pose.fLw = k.fLw;
    pose.fRw = k.fRw;
    const fwd = pose.fwd;
    pose.kLw = [k.fLw[0] + fwd[0], k.fLw[1] + 0.55, k.fLw[2] + fwd[2]];
    pose.kRw = [k.fRw[0] + fwd[0], k.fRw[1] + 0.55, k.fRw[2] + fwd[2]];
    const rise = clamp((t - 45.95) / 0.75, 0, 1);
    const sr = ease(rise);
    const duck = t < 45.93 ? 0 : t < 46.2 ? (t - 45.93) / 0.27 : t < 46.57 ? 1 : Math.max(0, 1 - (t - 46.57) / 0.12);
    const sam = Object.assign({}, SAM_IDLE, { x: 2.5, z: -3.45, yaw: 0.2, h: standH('sam') - duck * 0.42, sp: [0.2 + duck * 0.55, 0, 0], nk: [-0.25, 0.4, 0], hLw: [2.75, 1.25 - duck * 0.5, -3.05], hRw: [2.35, 1.2 - duck * 0.5, -3.05], eyes: t > 46.6 ? 'upleft' : 'right', mouth: t > 46.6 ? 'open' : 'closed', open: t > 46.6 ? 0.5 : 0 });
    return {
      camera: { eye: [2.42, 0.64 + sr * 0.5, -1.0], at: [2.42, 0.72 + sr * 0.55, -2.6], fov: 44 },
      light: { base: 'dance', points: [{ pos: [2.6, 2.3, -1.4], color: [0.8, 0.65, 0.4] }, { pos: [2.5, 1.8, -4.6], color: [0.6, 0.45, 0.25] }] },
      roomTint: [0.68, 0.64, 0.6],
      jukeLit: 1,
      soft: 0.3,
      props: t > 46.75 ? [{ kind: 'guitar', m: guitarM(t) }] : [],
      cast: [
        { who: 'hugh', pose },
        { who: 'sam', pose: body('sam', sam) }
      ]
    };
  }

  const S13_HUGH = track([
    [47.367, { x: 2.05, z: -2.85, h: standH('hugh') + 0.98, yaw: 0.45, lean: [-0.05, 0.12], nk: [-0.45, 0.1, 0], glasses: 'shades', eyes: 'cool', mouth: 'closed', hR: [-0.02, 0.38, 0.25], eR: [-0.9, -0.5, 0], handR: 'thumb', wR: [0, 0, 0], hL: [0.42, 0.18, 0.32], eL: [0.8, -0.6, -0.2], handL: 'relax', fL: [0.09, 1.04, 0.02], fR: [-0.09, 1.04, 0.02] }],
    [47.55, { hR: [-0.04, 0.4, 0.26] }],
    [47.68, { hR: [-0.55, 0.15, 0.3], handR: 'open', mouth: 'open', open: 0.5 }],
    [47.81, { hR: [-0.65, 0.05, 0.3] }]
  ]);

  function shotGuitar(t) {
    const k = S13_HUGH(t);
    const pose = body('hugh', k);
    pose.fLw = [k.x + 0.08, 1.04, k.z + 0.02];
    pose.fRw = [k.x - 0.1, 1.04, k.z - 0.02];
    pose.kLw = [k.x + 0.2, 1.6, k.z + 1];
    pose.kRw = [k.x - 0.2, 1.6, k.z + 1];
    return {
      camera: { eye: [2.32, 1.08, -2.2], at: [2.02, 2.25, -2.95], fov: 52, roll: -0.1 },
      light: { base: 'haze', points: [{ pos: [2.4, 2.8, -1.8], color: [0.8, 0.7, 0.45] }] },
      roomTint: [0.6, 0.58, 0.5],
      jukeLit: 1,
      soft: 0.5,
      dust: { a: 0.55, depth: 2.0 },
      glows: [{ p: [1.4, 2.9, -2.4], s: 2.5, a: 0.2, col: [0.95, 0.85, 0.5] }],
      props: [{ kind: 'guitar', m: M4.chain(M4.translate(2.62, 1.48, -3.1), M4.rotY(0.6), M4.rotZ(0.62)) }],
      cast: [{ who: 'hugh', pose }]
    };
  }

  const SHOTS = [
    [0, 'wide', shotWide],
    [2.033, 'sam', shotSam],
    [4.467, 'stool', shotStool],
    [7.0, 'coin', shotCoin],
    [10.533, 'girls', shotGirls],
    [13.6, 'take', shotTake],
    [23.167, 'feet', shotFeet],
    [26.767, 'nick', shotNick],
    [30.233, 'low', shotLow],
    [35.167, 'betty', shotBetty],
    [41.433, 'crowd', shotCrowd],
    [45.5, 'step', shotStep],
    [47.367, 'guitar', shotGuitar]
  ];
  CUTS.length = 0;
  SHOTS.forEach(([t0]) => CUTS.push(t0));

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    let i = 0;
    while (i + 1 < SHOTS.length && tt >= SHOTS[i + 1][0]) i++;
    const st = SHOTS[i][2](tt);
    st.shot = i;
    st.name = SHOTS[i][1];
    return st;
  }

  window.VazScript = { ID, DURATION, CUTS, VOICE, SHOTS, stage, track, body, standH, talker };
})();
