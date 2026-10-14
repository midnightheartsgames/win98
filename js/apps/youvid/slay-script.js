(function () {
  const { M4 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;

  const DURATION = 8.1;
  const VOICE = K.envelope('00000000000000000000000000000000000000000001ek7rGm0dOZy2fTZIPPj05DXIdlHtmHs0iNYSJQIb2100bBLwfa3004dyPy07dxzhia0015ahkjhemh3202yIzLFi805yXMrMZZLoDEq905opFIml9000000', 20);
  const CUTS = [0, 1.9, 4.21];
  const SPEECH = [
    { who: 'dad', t0: 1.94, t1: 4.38, text: 'Это точно Макс! Макс, это ты?!' },
    { who: 'boy', t0: 4.38, t1: 8.05, text: 'Привет! Я теперь extremely slay, меньше волос.' }
  ];

  function interpolable(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return true;
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every(v => typeof v === 'number');
  }

  function compile(keys) {
    const fields = {};
    keys.forEach(([t, o]) => Object.keys(o).forEach(k => { (fields[k] = fields[k] || []).push([t, o[k]]); }));
    return (t) => {
      const out = {};
      Object.keys(fields).forEach(k => {
        const list = fields[k];
        let i = 0;
        while (i + 1 < list.length && list[i + 1][0] <= t) i++;
        const [t0, v0] = list[i];
        const nx = list[i + 1];
        if (t <= t0 || !nx || !interpolable(v0, nx[1])) {
          out[k] = v0;
          return;
        }
        const e = ease((t - t0) / (nx[0] - t0));
        out[k] = Array.isArray(v0) ? v0.map((v, j) => lerp(v, nx[1][j], e)) : lerp(v0, nx[1], e);
      });
      return out;
    };
  }

  const DOWN = { hR: [-0.2, -0.24, 0.06], hL: [0.2, -0.24, 0.06], eR: [-0.4, -0.1, -0.6], eL: [0.4, -0.1, -0.6] };

  const BOY = compile([
    [0, Object.assign({ pos: [1.05, 0.925, -0.25], yaw: 0, lean: 0, roll: 0, keep: '', gR: 'lolli', gL: 'flat', lolli: 'R', eyes: 'half', mouth: 'smile', hairLift: 0 }, DOWN)],
    [0.75, { mouth: 'wide', eyes: 'squint' }],
    [0.95, { gL: 'open' }],
    [1.45, { eyes: 'open' }],
    [4.21, Object.assign({ pos: [0.75, 0.925, 0.55], keep: 'hLw eLw hRw eRw', gL: 'relax', eyes: 'shut', mouth: 'smile' }, DOWN)],
    [4.8, { eyes: 'squint' }],
    [5.15, { keep: 'hLw eLw' }],
    [5.4, { keep: '', gL: 'open', mouth: 'grin' }],
    [5.6, { gL: 'comb', hairLift: 0.0 }],
    [5.85, { hairLift: 0.75 }],
    [6.1, { gL: 'open', hairLift: 0.35 }],
    [6.4, { keep: 'hLw eLw', gL: 'relax', hairLift: 0, eyes: 'half', mouth: 'shut' }],
    [7.05, { keep: 'hLw eLw hRw eRw' }],
    [7.3, { eyes: 'half' }]
  ]);

  const DAD = compile([
    [1.9, { pos: [-2.6, 1.07, 2.7], yaw: PI / 2 + 0.3, lean: 0.12, roll: 0, sp: [0.05, 0, 0], nk: [-0.15, 0, 0], hR: [-0.32, -0.38, 0.18], hL: [0.32, -0.38, 0.18], gR: 'relax', gL: 'relax', eyes: 'wide', mouth: 'o' }],
    [2.5, { mouth: 'talk', nk: [-0.1, -0.25, 0] }],
    [3.0, { nk: [-0.18, 0.05, 0] }],
    [3.6, { mouth: 'grin', eyes: 'squint', nk: [-0.25, 0.1, 0] }],
    [4.21, { pos: [-3.6, 1.07, 1.75] }]
  ]);

  const GIRL = compile([
    [1.9, { pos: [-2.6, 0.84, 2.1], yaw: PI / 2 + 0.2, lean: 0.03, roll: 0, sp: [0, 0, 0], nk: [-0.12, 0, 0], hR: [-0.19, -0.23, 0.07], hL: [0.19, -0.23, 0.07], eR: [-0.4, -0.1, -0.6], eL: [0.4, -0.1, -0.6], keep: 'hLw eLw hRw eRw', gR: 'relax', gL: 'relax', eyes: 'wide', mouth: 'o' }],
    [2.7, { mouth: 'shut', eyes: 'open' }],
    [3.2, { hR: [-0.2, -0.21, 0.1], hL: [0.2, -0.24, 0.05] }],
    [4.21, { pos: [-3.5, 0.84, 0.95] }]
  ]);

  const WOMAN = compile([
    [4.21, { pos: [-3.1, 0.99, 1.25], yaw: PI / 2 - 0.15, lean: 0.03, roll: 0, sp: [0, 0, 0], nk: [0, 0.35, 0], hR: [-0.17, -0.4, 0.05], hL: [0.17, -0.38, 0.0], gR: 'fist', gL: 'relax', bag: true, mirrorOnly: true, eyes: 'open', mouth: 'smile' }],
    [5.3, { pos: [-2.2, 0.99, 1.3] }]
  ]);

  const ENV1 = { exposure: 1.05, sunDir: [0.35, -0.72, -0.6], sunColor: [0.62, 0.58, 0.5], ambTop: [0.92, 0.96, 1.06], ambBottom: [0.62, 0.6, 0.58], fogColor: [0.62, 0.78, 0.95], fogNear: 90, fogFar: 320 };
  const ENV2 = { exposure: 1.06, sunDir: [-0.55, -0.7, -0.45], sunColor: [0.66, 0.62, 0.54], ambTop: [0.88, 0.94, 1.06], ambBottom: [0.6, 0.6, 0.6], fogColor: [0.62, 0.78, 0.95], fogNear: 90, fogFar: 320 };
  const ENV3 = { exposure: 1.08, sunDir: [0.35, -0.55, -0.76], sunColor: [0.8, 0.72, 0.6], ambTop: [1.02, 1.04, 1.1], ambBottom: [0.7, 0.66, 0.64], fogColor: [0.62, 0.78, 0.95], fogNear: 90, fogFar: 320 };

  const SHOTS = [
    [0, { env: ENV1, cam: { eye: [0.465, 1.05, 2.392], at: [0.615, 1.05, 1.31], fov: 44, whip: [[0, -0.14], [0.12, -0.08], [0.3, 0]] }, props: { flag: [0.25, -0.12, 0.0], door: [[0.5, 0], [0.95, 1.42]], glass: 0.5 }, cast: ['boy'] }],
    [1.9, { env: ENV2, cam: { eye: [-1.35, 1.3, 2.3], at: [-6.6, 1.45, 4.75], fov: 44 }, props: { flag: [0.25, -0.12, 0.0], door: [[0, 0]], glass: 0.5 }, cast: ['dad', 'girl'] }],
    [4.21, { env: ENV3, cam: { eye: [1.21, 1.25, 1.205], at: [0.85, 1.38, 0.5], fov: 44, orbit: { center: [0.75, 0, 0.55], k: 0.6 } }, props: { flag: [-0.85, -0.14, 0.0], door: [[0, 0]], glass: 0.3 }, cast: ['boy', 'woman'] }]
  ];

  const camTrack = window.YouVidRig.motion((window.YouVidMotion || {})['eXtr3meSlay:cam']);

  function shotAt(t) {
    let i = 0;
    while (i + 1 < SHOTS.length && SHOTS[i + 1][0] <= t) i++;
    return { index: i, start: SHOTS[i][0], end: i + 1 < SHOTS.length ? SHOTS[i + 1][0] : DURATION, o: SHOTS[i][1] };
  }

  function keyed(list, t) {
    let i = 0;
    while (i + 1 < list.length && list[i + 1][0] <= t) i++;
    const [t0, a] = list[i];
    const nx = list[i + 1];
    if (!nx || t <= t0) return a;
    const k = ease((t - t0) / (nx[0] - t0));
    return Array.isArray(a) ? a.map((v, j) => lerp(v, nx[1][j], k)) : lerp(a, nx[1], k);
  }

  function norm(v) {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }

  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  function cameraAt(t) {
    const sh = shotAt(clamp(t, 0, DURATION));
    const o = sh.o.cam;
    const tr = camTrack(t);
    const rot = tr ? [tr[0], tr[1], tr[2]] : [o.whip ? keyed(o.whip, t) : 0, 0, 0];
    const z = norm([o.eye[0] - o.at[0], o.eye[1] - o.at[1], o.eye[2] - o.at[2]]);
    const x = norm(cross([0, 1, 0], z));
    const y = cross(z, x);
    const base = new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, 0, 0, 0, 1]);
    const m = M4.chain(base, M4.rotY(rot[0]), M4.rotX(rot[1]), M4.rotZ(rot[2]));
    let eye = o.eye;
    if (o.orbit) {
      const c = o.orbit.center;
      const r0 = [o.eye[0] - c[0], o.eye[2] - c[2]];
      const ph = rot[0] * o.orbit.k;
      eye = [c[0] + r0[0] * C(ph) + r0[1] * S(ph), o.eye[1], c[2] - r0[0] * S(ph) + r0[1] * C(ph)];
    }
    const fwd = [-m[8], -m[9], -m[10]];
    return { eye, at: [eye[0] + fwd[0], eye[1] + fwd[1], eye[2] + fwd[2]], up: [m[4], m[5], m[6]], fov: o.fov, shot: sh };
  }

  function speakerAt(t) {
    return SPEECH.find(s => t >= s.t0 && t < s.t1) || null;
  }

  function mouthFor(who, t, base) {
    const sp = speakerAt(t);
    if (!sp || sp.who !== who) return base;
    const v = VOICE(t);
    if (v < 0.12) return base === 'grin' || base === 'smile' || base === 'wide' ? base : 'shut';
    if (base === 'grin' || base === 'wide') return v > 0.55 ? 'wide' : 'grin';
    if (base === 'o' && v > 0.2) return 'o';
    return v > 0.6 ? 'open' : 'talk';
  }

  function blink(t, seed) {
    return ((t * 0.37 + seed) % 1) < 0.035;
  }

  const Rig = window.YouVidRig;
  const MOTION = {};
  ['boy', 'dad', 'girl'].forEach(w => { MOTION[w] = Rig.motion((window.YouVidMotion || {})['eXtr3meSlay:' + w]); });
  const LEGS = ['fLw', 'kLw', 'fRw', 'kRw'];
  const STRIDE = { boy: 0.5, dad: 0.64, girl: 0.48, woman: 0.6 };
  const gaits = {};

  function motionAt(who, t, sh) {
    const fn = MOTION[who];
    const data = (window.YouVidMotion || {})['eXtr3meSlay:' + who];
    if (!fn || !data) return null;
    const seg = data.segs.find(g => g.t0 < sh.end - 1e-6 && g.t1 > sh.start + 1e-6);
    return seg ? fn(clamp(t, seg.t0 + 0.02, seg.t1 - 0.02)) : null;
  }

  function gaitFor(who, sh) {
    const key = who + sh.index;
    if (gaits[key]) return gaits[key];
    const rows = [];
    let s = 0, prev = null;
    for (let t = sh.start; t <= sh.end + 1e-6; t += 1 / 30) {
      const v = motionAt(who, t, sh);
      if (!v) continue;
      const p = [v[0], v[2]];
      if (prev) s += Math.max(0, Math.hypot(p[0] - prev[0], p[1] - prev[1]) - 0.003);
      prev = p;
      const h = Math.hypot(v[6], v[8]) || 1;
      rows.push({ t, s, p, h: [v[6] / h, v[8] / h] });
    }
    gaits[key] = rows;
    return rows;
  }

  function rowAt(rows, key, val) {
    if (val <= rows[0][key]) return rows[0];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][key] >= val) {
        const a = rows[i - 1], b = rows[i];
        const k = (val - a[key]) / Math.max(1e-6, b[key] - a[key]);
        return { t: lerp(a.t, b.t, k), s: lerp(a.s, b.s, k), p: [lerp(a.p[0], b.p[0], k), lerp(a.p[1], b.p[1], k)], h: [lerp(a.h[0], b.h[0], k), lerp(a.h[1], b.h[1], k)] };
      }
    }
    return rows[rows.length - 1];
  }

  function feet(pose, who, t, sh) {
    const rows = gaitFor(who, sh);
    if (rows.length < 2) return;
    const d = window.SlayCast.D[who];
    const stride = STRIDE[who];
    const now = rowAt(rows, 't', t);
    [['L', 1, 0], ['R', -1, 0.5]].forEach(([side, k, off]) => {
      const cyc = now.s / stride - off;
      const n = Math.floor(cyc);
      const u = cyc - n;
      const plant = (m) => {
        const r = rowAt(rows, 's', Math.max(0, (m + off) * stride + stride * 0.3));
        return [r.p[0] + k * r.h[1] * d.hipX * 1.1, 0.07, r.p[1] - k * r.h[0] * d.hipX * 1.1];
      };
      const a = plant(n), b = plant(n + 1);
      const sw = clamp((u - 0.55) / 0.45, 0, 1);
      const e = ease(sw);
      pose['f' + side + 'w'] = [lerp(a[0], b[0], e), 0.07 + S(sw * PI) * 0.05, lerp(a[2], b[2], e)];
      pose['k' + side + 'w'] = [pose.p[0] + now.h[0] * 0.8 + k * now.h[1] * 0.12, pose.p[1] - 0.2, pose.p[2] + now.h[1] * 0.8 - k * now.h[0] * 0.12];
      pose['a' + side] = sw > 0 ? -0.2 * S(sw * PI) : 0;
    });
  }

  function bodyFromKeys(q) {
    const yaw = q.yaw || 0, lean = q.lean || 0, roll = q.roll || 0;
    const fwd = [S(yaw), 0, C(yaw)];
    const right = [C(yaw), 0, -S(yaw)];
    const up = [fwd[0] * S(lean) + right[0] * S(roll), C(lean) * C(roll), fwd[2] * S(lean) + right[2] * S(roll)];
    return Object.assign({}, q, { p: q.pos, up, fwd });
  }

  function poseFor(who, q, t, sh) {
    const pose = bodyFromKeys(q);
    const v = motionAt(who, t, sh);
    if (v) {
      const keep = (q.keep || '').split(' ');
      Rig.applyMotion(pose, v, key => LEGS.includes(key) || keep.includes(key));
      feet(pose, who, t, sh);
      if (q.nkAdd) pose.nk = pose.nk.map((x, i) => x + q.nkAdd[i]);
    }
    return finish(who, pose, q, t);
  }

  function finish(who, pose, q, t) {
    const v = speakerAt(t) && speakerAt(t).who === who ? VOICE(t) : 0;
    const nk = pose.nk || [0, 0, 0];
    pose.nk = [nk[0] + v * 0.04 * S(t * 11), nk[1] + v * 0.03 * S(t * 6.3), nk[2] + v * 0.02 * S(t * 4.7)];
    pose.mouth = mouthFor(who, t, q.mouth || 'shut');
    pose.eyes = q.eyes === 'shut' || !blink(t, who.length * 0.13) ? q.eyes : 'shut';
    return pose;
  }

  function walkPose(who, q, t, t0, stride, period) {
    const out = Object.assign({}, q);
    const ph = ((t - t0) / period) * PI * 2;
    const d = window.SlayCast.D[who];
    out.pos = [q.pos[0], q.pos[1] + 0.012 * Math.abs(S(ph)) - 0.01, q.pos[2]];
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const a = ph + (k > 0 ? 0 : PI);
      const swing = S(a) * stride * 0.5;
      const lift = Math.max(0, C(a)) * 0.07;
      out['f' + s] = [k * d.hipX, -(q.pos[1] - 0.07) + lift, swing + 0.03];
      out['a' + s] = -S(a) * 0.25;
      out['k' + s] = [k * 0.1, 0, 1];
    });
    return out;
  }

  function doorAt(list, t) {
    let v = list[0][1];
    for (let i = 0; i < list.length; i++) {
      if (t >= list[i][0]) {
        v = list[i][1];
        const nx = list[i + 1];
        if (nx && t < nx[0]) v = lerp(list[i][1], nx[1], ease((t - list[i][0]) / (nx[0] - list[i][0])));
      }
    }
    return v;
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    const camera = cameraAt(tt);
    const sh = camera.shot;
    const o = sh.o;
    const cast = [];
    o.cast.forEach(who => {
      let pose;
      if (who === 'woman') pose = finish(who, bodyFromKeys(walkPose('woman', WOMAN(tt), tt, 4.21, 0.6, 1.05)), WOMAN(tt), tt);
      else pose = poseFor(who, (who === 'boy' ? BOY : who === 'dad' ? DAD : GIRL)(tt), tt, sh);
      cast.push({ who, pose });
    });
    const props = Object.assign({}, o.props, { door: doorAt(o.props.door, tt) });
    return { t: tt, shot: sh, camera, env: o.env, cast, props };
  }

  window.SlayScript = { DURATION, VOICE, CUTS, SPEECH, SHOTS, stage, shotAt, speakerAt, cameraAt, compile };
})();
