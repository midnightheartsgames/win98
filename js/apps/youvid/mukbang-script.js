(function () {
  const { V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Rig = window.YouVidRig;
  const Cast = window.MukbangCast;

  const ID = 'Str4nnInTr0';
  const DURATION = 58.58;
  const VOICE = K.envelope('000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ZZZMb0vEMRMKervszFAHCaFSHgdc0900R9LZQlao0Ba0j06i0YSyCxEaSua0hwbYLbRo00EWq0007ZWIypEHLKBd0iwFRDCUyjla0000001340030000000AZZUo1VPZGwln0000000000000000000000000000000ZZZZZQHHxo870000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000FZZUrxJFKxmbDvwEBILc0TXJxi5b0060lL0UZOCjc860n0lj0TWuzjQq8dBUKqLp0gp50abVNABoIILCjbwKPVHr60000000ZZZ0uHA94PXZTIo8200000qRXZZZYFt60000RZZXPMHAFm3hYKf4', 20);
  const motionAt = Rig.motion((window.YouVidMotion || {})[ID]);

  const CAM = { eye: [0, 1.379, 0], pitch: 0.4451, fov: 44.5 };
  const MOCAP = [[7.0, 27.7], [44.9, 58.58]];
  const BLEND = 0.35;
  const HIP = 0.97;
  const FEET_SEATED = { fLw: [0.18, 0.08, -0.9], fRw: [-0.24, 0.08, -0.9], kLw: [0.22, 0.6, -0.72], kRw: [-0.28, 0.6, -0.72] };

  const WALKS = [
    { t0: 0, t1: 4.85, endYaw: [4.2, -2.3], keys: [[0.0, -0.8, -1.12], [0.4, -0.95, -1.28], [0.8, -1.1, -1.53], [1.3, -1.1, -2.0], [1.7, -1.04, -2.42], [2.0, -0.66, -2.72], [2.3, -0.06, -2.82], [2.65, 0.48, -2.56], [3.05, 0.74, -2.12], [3.5, 0.82, -1.7], [3.95, 0.82, -1.32], [4.45, 0.66, -1.02], [4.85, 0.46, -0.94]] },
    { t0: 29.3, t1: 33.6, startYaw: [1.0, 29.9], keys: [[29.3, 0.42, -0.98], [29.9, 0.62, -1.02], [30.4, 0.74, -1.12], [30.8, 1.0, -1.45], [31.2, 1.2, -1.64], [31.6, 1.38, -2.05], [32.0, 1.55, -2.55], [32.4, 1.7, -2.95], [32.8, 1.96, -3.35], [33.25, 2.16, -3.55], [33.6, 2.28, -3.6]] },
    { t0: 38.8, t1: 42.45, endYaw: [41.9, -1.7], keys: [[38.8, 2.24, -3.62], [39.2, 1.88, -3.62], [39.6, 1.64, -3.45], [40.0, 1.5, -3.05], [40.4, 1.38, -2.6], [40.8, 1.13, -2.16], [41.2, 0.98, -1.85], [41.6, 0.82, -1.42], [42.0, 0.66, -1.1], [42.45, 0.5, -0.97]] }
  ];

  const KEYED = [
    { t: 4.85, p: [0.46, 0.96, -0.94], yaw: -2.3, sp: [0.12, 0, 0], nk: [0.25, 0, 0], hL: [0.26, -0.33, 0.06], hR: [-0.26, -0.33, 0.06], fLw: [0.5, 0.08, -0.84], fRw: [0.42, 0.08, -1.04] },
    { t: 5.2, p: [0.32, 0.95, -0.98], yaw: -1.25, sp: [0.3, 0.12, 0], nk: [0.3, -0.2, 0], hL: [0.3, -0.28, 0.12], hR: [-0.22, -0.28, 0.25], fLw: [0.42, 0.08, -0.84], fRw: [0.2, 0.08, -0.98] },
    { t: 5.55, p: [0.18, 0.88, -1.03], yaw: -0.45, sp: [0.48, 0.1, 0.05], nk: [0.05, -0.15, 0], hL: [0.4, -0.16, 0.2], hR: [-0.36, -0.2, 0.28], fLw: [0.36, 0.08, -0.82], fRw: [0.0, 0.08, -0.9] },
    { t: 5.9, p: [0.08, 0.78, -1.18], yaw: -0.12, sp: [0.42, 0.05, 0.04], nk: [0.0, -0.05, 0], hLw: [0.41, 0.77, -1.2], hRw: [-0.45, 0.77, -1.12], fLw: [0.3, 0.08, -0.82], fRw: [-0.12, 0.08, -0.86] },
    { t: 6.3, p: [0.02, 0.68, -1.27], yaw: 0.0, sp: [0.26, 0, 0], nk: [0.25, 0, 0], hLw: [0.41, 0.76, -1.23], hRw: [-0.45, 0.76, -1.15], fLw: [0.2, 0.08, -0.84], fRw: [-0.22, 0.08, -0.84] },
    { t: 6.9, p: [0.0, 0.7, -1.3], yaw: 0.0, sp: [0.18, 0, 0], nk: [0.6, -0.1, 0], hLw: [0.41, 0.76, -1.23], hRw: [-0.45, 0.76, -1.15], fLw: [0.18, 0.08, -0.9], fRw: [-0.24, 0.08, -0.9] },
    { t: 27.7, p: [-0.04, 0.65, -1.32], yaw: 0.05, sp: [0.2, 0.1, 0.06], nk: [0.4, 0.3, 0.0], hLw: [0.34, 0.78, -1.12], hRw: [-0.46, 0.66, -1.28], fLw: [0.18, 0.08, -0.9], fRw: [-0.24, 0.08, -0.9] },
    { t: 28.05, p: [0.0, 0.7, -1.24], yaw: 0.05, sp: [0.5, 0.05, 0], nk: [-0.25, 0.15, 0], hLw: [0.41, 0.76, -1.22], hRw: [-0.45, 0.76, -1.14], fLw: [0.2, 0.08, -0.86], fRw: [-0.2, 0.08, -0.88] },
    { t: 28.5, p: [0.06, 0.86, -1.14], yaw: 0.2, sp: [0.55, 0.1, -0.05], nk: [-0.3, 0.2, 0], hLw: [0.41, 0.77, -1.2], hRw: [-0.45, 0.77, -1.12], fLw: [0.24, 0.08, -0.86], fRw: [-0.14, 0.08, -0.9] },
    { t: 28.9, p: [0.16, 0.96, -1.02], yaw: 0.45, sp: [0.32, 0.12, 0], nk: [0.25, 0.1, 0], hL: [0.3, -0.28, 0.15], hR: [-0.3, -0.26, 0.2], fLw: [0.34, 0.08, -0.88], fRw: [0.02, 0.08, -0.92] },
    { t: 29.3, p: [0.42, 0.98, -0.98], yaw: 1.0, sp: [0.12, 0, 0], nk: [0.15, 0, 0], hL: [0.26, -0.33, 0.06], hR: [-0.26, -0.33, 0.06], fLw: [0.4, 0.08, -1.09], fRw: [0.44, 0.08, -0.87] },
    { t: 42.45, p: [0.5, 0.96, -0.97], yaw: -1.7, sp: [0.12, 0, 0], nk: [0.2, 0, 0], hL: [0.26, -0.33, 0.06], hR: [-0.26, -0.33, 0.06], fLw: [0.54, 0.08, -0.87], fRw: [0.47, 0.08, -1.08] },
    { t: 42.8, p: [0.36, 0.95, -0.99], yaw: -2.4, sp: [0.3, 0, 0], nk: [0.35, 0, 0], hL: [0.3, -0.23, 0.2], hR: [-0.3, -0.23, 0.22], fLw: [0.46, 0.08, -0.84], fRw: [0.26, 0.08, -0.96] },
    { t: 43.2, p: [0.26, 0.92, -1.0], yaw: -3.0, sp: [0.45, 0, 0], nk: [0.35, 0, 0], hL: [0.32, -0.2, 0.25], hR: [-0.3, -0.2, 0.25], fLw: [0.4, 0.08, -0.86], fRw: [0.12, 0.08, -0.9] },
    { t: 43.6, p: [0.16, 0.9, -1.04], yaw: -4.3, sp: [0.4, 0, 0], nk: [0.2, 0, 0], hL: [0.36, -0.18, 0.25], hR: [-0.34, -0.2, 0.25], fLw: [0.32, 0.08, -0.84], fRw: [0.0, 0.08, -0.88] },
    { t: 43.95, p: [0.07, 0.78, -1.18], yaw: -5.95, sp: [0.45, 0, 0.04], nk: [0.1, 0, 0], hLw: [0.41, 0.77, -1.2], hRw: [-0.45, 0.77, -1.12], fLw: [0.26, 0.08, -0.84], fRw: [-0.14, 0.08, -0.86] },
    { t: 44.35, p: [0.0, 0.7, -1.26], yaw: -6.28, sp: [0.3, 0, 0], nk: [0.4, 0, 0], hLw: [0.41, 0.76, -1.23], hRw: [-0.45, 0.76, -1.15], fLw: [0.18, 0.08, -0.84], fRw: [-0.22, 0.08, -0.84] },
    { t: 44.9, p: [-0.01, 0.76, -1.3], yaw: -6.28, sp: [0.05, 0, 0], nk: [0.4, 0, 0], hLw: [0.2, 0.98, -0.86], hRw: [-0.2, 1.02, -0.74], fLw: [0.18, 0.08, -0.9], fRw: [-0.24, 0.08, -0.9] }
  ];

  const WAIT = { t0: 33.6, t1: 38.8, p: [2.28, 0.97, -3.6], yaw: 1.97, turn: [38.1, 4.71] };

  const HANDS = {
    rest: { L: [0.41, 0.76, -1.23], R: [-0.45, 0.76, -1.15], eL: [0.62, 0.9, -1.38], eR: [-0.66, 0.9, -1.32] },
    low: { L: [0.4, 0.56, -1.12], R: [-0.46, 0.56, -1.08], eL: [0.5, 0.95, -1.3], eR: [-0.56, 0.95, -1.26] },
    spans: {
      L: [['rest', 6.1, 14.6], ['low', 14.6, 18.9], ['low', 25.7, 27.7], ['rest', 43.95, 48.3], ['low', 48.3, 51.5]],
      R: [['rest', 6.1, 14.6], ['low', 14.6, 17.8], ['low', 25.7, 27.7], ['rest', 43.95, 48.3], ['low', 48.3, 50.3]]
    }
  };
  const RAMP = 0.3;
  const NOD = [[26.0, 0], [26.6, 0.3], [27.5, 0.34], [27.9, 0]];
  const REACH = { R: [[50.5, 0], [50.85, 1], [51.5, 1], [51.9, 0]], at: [-0.3, 0.92, -0.98], pole: [-0.62, 0.85, -1.2] };

  const FACE = [
    [0, 'open', 'flat', 'shut', 'c'], [6.9, 'down', 'flat', 'shut', 'd'], [7.5, 'down', 'flat', 'shut', 'dl'], [8.5, 'down', 'flat', 'shut', 'dl'],
    [9.0, 'down', 'flat', 'shut', 'dr'], [11.0, 'down', 'flat', 'shut', 'd'], [11.5, 'open', 'flat', 'shut', 'c'], [12.5, 'open', 'furrow', 'shut', 'c'],
    [13.0, 'open', 'up', 'shut', 'c'], [13.8, 'open', 'flat', 'shut', 'c'], [14.4, 'half', 'flat', 'shut', 'c'], [15.0, 'open', 'flat', 'shut', 'c'],
    [17.6, 'open', 'up', 'smile', 'c'], [18.6, 'open', 'up', 'shut', 'c'], [19.0, 'open', 'up', 'talk', 'c'], [20.0, 'open', 'flat', 'talk', 'c'],
    [21.4, 'open', 'up', 'talk', 'c'], [22.0, 'wide', 'up', 'talk', 'c'], [23.4, 'open', 'flat', 'talk', 'c'], [24.4, 'open', 'up', 'talk', 'c'],
    [25.3, 'half', 'flat', 'shut', 'c'], [25.9, 'open', 'flat', 'shut', 'c'], [26.3, 'down', 'flat', 'shut', 'd'], [27.0, 'down', 'furrow', 'round', 'd'],
    [27.6, 'down', 'flat', 'shut', 'd'], [29.3, 'open', 'flat', 'shut', 'c'], [44.9, 'down', 'flat', 'shut', 'd'], [45.8, 'open', 'flat', 'shut', 'c'],
    [47.4, 'half', 'flat', 'shut', 'c'], [48.4, 'open', 'flat', 'shut', 'c'], [50.0, 'open', 'up', 'shut', 'c'], [50.9, 'open', 'up', 'talk', 'c'],
    [52.0, 'open', 'flat', 'talk', 'c'], [53.0, 'open', 'up', 'talk', 'c'], [54.4, 'open', 'tilt', 'talk', 'c'], [55.2, 'open', 'up', 'talk', 'c'],
    [56.8, 'wide', 'up', 'talk', 'c'], [57.9, 'open', 'up', 'smile', 'c']
  ];

  const GRIPS = [
    [0, 'open', 'open'], [5.85, 'rest', 'rest'], [17.8, 'rest', 'open'], [18.2, 'rest', 'spread'], [18.9, 'open', 'open'], [21.8, 'spread', 'spread'],
    [23.6, 'open', 'open'], [27.75, 'rest', 'rest'], [28.9, 'open', 'open'], [43.95, 'rest', 'rest'], [45.2, 'open', 'open'], [48.6, 'rest', 'rest'],
    [50.4, 'rest', 'open'], [51.6, 'open', 'open'], [54.0, 'rest', 'rest'], [54.35, 'spread', 'spread'], [56.2, 'open', 'open']
  ];

  function camera() {
    const a = CAM.pitch;
    return { eye: CAM.eye.slice(), at: [CAM.eye[0], CAM.eye[1] - Math.sin(a), CAM.eye[2] - Math.cos(a)], fov: CAM.fov };
  }

  function fwdOf(yaw) {
    return [Math.sin(yaw), 0, Math.cos(yaw)];
  }

  function spline(keys, t) {
    if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
    const n = keys.length;
    if (t >= keys[n - 1][0]) return [keys[n - 1][1], keys[n - 1][2]];
    let i = 0;
    while (i < n - 2 && keys[i + 1][0] <= t) i++;
    const a = keys[i], b = keys[i + 1];
    const pa = keys[Math.max(0, i - 1)], pb = keys[Math.min(n - 1, i + 2)];
    const h = b[0] - a[0], u = (t - a[0]) / h;
    const u2 = u * u, u3 = u2 * u;
    const out = [];
    for (let c = 1; c <= 2; c++) {
      const m0 = (b[c] - pa[c]) / (b[0] - pa[0]) * h * (i === 0 ? 0.5 : 1);
      const m1 = (pb[c] - a[c]) / (pb[0] - a[0]) * h * (i === n - 2 ? 0.5 : 1);
      out.push((2 * u3 - 3 * u2 + 1) * a[c] + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * b[c] + (u3 - u2) * m1);
    }
    return out;
  }

  function buildWalk(w) {
    const n = Math.ceil((w.t1 - w.t0) * 60);
    const ts = [], pts = [], ss = [], yaws = [];
    let s = 0;
    for (let i = 0; i <= n; i++) {
      const t = w.t0 + (w.t1 - w.t0) * i / n;
      const q = spline(w.keys, t);
      if (i) s += Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]);
      ts.push(t);
      pts.push(q);
      ss.push(s);
    }
    for (let i = 0; i <= n; i++) {
      const a = pts[Math.max(0, i - 3)], b = pts[Math.min(n, i + 3)];
      const dx = b[0] - a[0], dz = b[1] - a[1];
      yaws.push(Math.hypot(dx, dz) > 1e-4 ? Math.atan2(dx, dz) : (yaws[i - 1] || 0));
    }
    for (let i = 1; i <= n; i++) {
      while (yaws[i] - yaws[i - 1] > PI) yaws[i] -= 2 * PI;
      while (yaws[i] - yaws[i - 1] < -PI) yaws[i] += 2 * PI;
    }
    const steps = Math.max(2, Math.round(s / 0.62));
    const stepLen = s / steps;
    const at = (dist) => {
      const d = clamp(dist, 0, s);
      let lo = 0, hi = n;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (ss[mid] <= d) lo = mid; else hi = mid;
      }
      const k = ss[hi] > ss[lo] ? (d - ss[lo]) / (ss[hi] - ss[lo]) : 0;
      return { p: [lerp(pts[lo][0], pts[hi][0], k), lerp(pts[lo][1], pts[hi][1], k)], yaw: lerp(yaws[lo], yaws[hi], k) };
    };
    const falls = [];
    for (let j = -1; j <= steps + 1; j++) {
      const d = clamp(j * stepLen, 0, s);
      const q = at(d);
      const side = j % 2 === 0 ? 1 : -1;
      const lat = [Math.cos(q.yaw) * 0.11 * side, -Math.sin(q.yaw) * 0.11 * side];
      falls.push({ d: j * stepLen, side, x: q.p[0] + lat[0], z: q.p[1] + lat[1], yaw: q.yaw });
    }
    return { w, ts, ss, total: s, stepLen, at, falls, n };
  }

  const TRACKS = WALKS.map(buildWalk);

  function distAt(tr, t) {
    const { ts, ss, n } = tr;
    if (t <= ts[0]) return 0;
    if (t >= ts[n]) return tr.total;
    const f = (t - ts[0]) / (ts[n] - ts[0]) * n;
    const i = Math.floor(f);
    return lerp(ss[i], ss[Math.min(n, i + 1)], f - i);
  }

  function footOf(tr, dist, side) {
    const own = tr.falls.filter(f => f.side === side);
    const sl = tr.stepLen;
    let cur = own[0], next = own[0];
    for (let i = 0; i < own.length; i++) {
      if (own[i].d <= dist + sl * 0.6) cur = own[i];
    }
    const idx = own.indexOf(cur);
    next = own[Math.min(own.length - 1, idx + 1)];
    const swing0 = cur.d + sl * 0.6;
    const swing1 = next.d - sl * 0.6;
    if (next === cur || dist <= swing0 || swing1 <= swing0) return { x: cur.x, z: cur.z, y: 0.08, yaw: cur.yaw };
    const u = clamp((dist - swing0) / (swing1 - swing0), 0, 1);
    const e = ease(u);
    return { x: lerp(cur.x, next.x, e), z: lerp(cur.z, next.z, e), y: 0.08 + 0.09 * S(PI * u), yaw: lerp(cur.yaw, next.yaw, e) };
  }

  function walkPose(tr, t) {
    const dist = distAt(tr, t);
    const q = tr.at(dist);
    const ph = dist / tr.stepLen;
    const speed = clamp((distAt(tr, t + 0.1) - distAt(tr, t - 0.1)) / 0.2, 0, 1.6);
    const bob = 0.022 * (0.5 + 0.5 * C(2 * PI * ph)) * clamp(speed / 0.8, 0, 1);
    let yaw = q.yaw;
    if (tr.w.startYaw) {
      const [from, tb] = tr.w.startYaw;
      let start = from;
      while (start - yaw > PI) start -= 2 * PI;
      while (start - yaw < -PI) start += 2 * PI;
      yaw = lerp(start, yaw, ease((t - tr.w.t0) / (tb - tr.w.t0)));
    }
    if (tr.w.endYaw) {
      const [ta, target] = tr.w.endYaw;
      let goal = target;
      while (goal - yaw > PI) goal -= 2 * PI;
      while (goal - yaw < -PI) goal += 2 * PI;
      yaw = lerp(yaw, goal, ease((t - ta) / (tr.w.t1 - ta)));
    }
    const fwd = fwdOf(yaw);
    const right = [-fwd[2], 0, fwd[0]];
    const swing = S(PI * ph) * clamp(speed / 0.9, 0, 1);
    const pose = {
      p: [q.p[0], HIP - bob, q.p[1]],
      up: [right[0] * 0.03 * swing, 1, right[2] * 0.03 * swing],
      fwd,
      sp: [0.08 + 0.04 * speed, -0.1 * swing, 0],
      nk: [0.18, 0.08 * swing, 0],
      hL: [0.27, -0.33, 0.04 - 0.14 * swing],
      hR: [-0.27, -0.33, 0.04 + 0.14 * swing],
      eL: [0.6, -0.2, -0.6],
      eR: [-0.6, -0.2, -0.6]
    };
    [['L', 1], ['R', -1]].forEach(([s, side]) => {
      const f = footOf(tr, dist, side);
      pose['f' + s + 'w'] = [f.x, f.y, f.z];
      const ff = fwdOf(f.yaw);
      pose['k' + s + 'w'] = [f.x + ff[0] * 0.6, 0.55, f.z + ff[2] * 0.6];
      pose['a' + s] = f.y > 0.1 ? -0.25 : 0;
    });
    return pose;
  }

  function worldify(pose) {
    const m = Cast.solve(pose);
    const out = Object.assign({}, pose);
    out.hLw = m.pts.wristL;
    out.hRw = m.pts.wristR;
    out.eLw = m.pts.elbowL;
    out.eRw = m.pts.elbowR;
    out.fLw = m.pts.ankleL;
    out.fRw = m.pts.ankleR;
    out.kLw = m.pts.kneeL;
    out.kRw = m.pts.kneeR;
    delete out.hL;
    delete out.hR;
    delete out.eL;
    delete out.eR;
    return out;
  }

  function keyedPose(k) {
    const fwd = fwdOf(k.yaw);
    const pose = { p: k.p.slice(), up: [0, 1, 0], fwd, sp: k.sp.slice(), nk: k.nk.slice(), fLw: k.fLw.slice(), fRw: k.fRw.slice() };
    ['L', 'R'].forEach(s => {
      if (k['h' + s + 'w']) pose['h' + s + 'w'] = k['h' + s + 'w'].slice();
      else pose['h' + s] = k['h' + s].slice();
      const f = pose['f' + s + 'w'];
      pose['k' + s + 'w'] = [f[0] + fwd[0] * 0.6, 0.55, f[2] + fwd[2] * 0.6];
    });
    pose.eL = [0.6, -0.2, -0.6];
    pose.eR = [-0.6, -0.2, -0.6];
    return worldify(pose);
  }

  const KEY_POSES = KEYED.map(k => ({ t: k.t, yaw: k.yaw, pose: keyedPose(k) }));

  function blendPose(a, b, k) {
    const out = {};
    ['p', 'up', 'sp', 'nk', 'hLw', 'hRw', 'eLw', 'eRw', 'fLw', 'fRw', 'kLw', 'kRw'].forEach(f => {
      out[f] = a[f].map((v, i) => lerp(v, b[f][i], k));
    });
    out.fwd = V3.norm(a.fwd.map((v, i) => lerp(v, b.fwd[i], k)));
    out.aL = lerp(a.aL || 0, b.aL || 0, k);
    out.aR = lerp(a.aR || 0, b.aR || 0, k);
    return out;
  }

  function keyedAt(t) {
    let i = 0;
    while (i < KEY_POSES.length - 1 && KEY_POSES[i + 1].t <= t) i++;
    const a = KEY_POSES[i], b = KEY_POSES[Math.min(KEY_POSES.length - 1, i + 1)];
    if (b === a || t <= a.t) return a.pose;
    const k = ease((t - a.t) / (b.t - a.t));
    const out = blendPose(a.pose, b.pose, k);
    out.fwd = fwdOf(lerp(a.yaw, b.yaw, k));
    return out;
  }

  function mocapPose(t) {
    const mv = motionAt(Math.min(t, DURATION - 0.02));
    if (!mv) return null;
    const pose = { up: [0, 1, 0], fwd: [0, 0, 1], sp: [0, 0, 0], nk: [0, 0, 0] };
    Rig.applyMotion(pose, mv);
    Object.assign(pose, JSON.parse(JSON.stringify(FEET_SEATED)));
    return pose;
  }

  function waitPose(t) {
    const sway = S((t - WAIT.t0) * 1.3) * 0.015;
    const fwd = fwdOf(lerp(WAIT.yaw, WAIT.turn[1], ease((t - WAIT.turn[0]) / (WAIT.t1 - WAIT.turn[0]))));
    const right = [-fwd[2], 0, fwd[0]];
    const pose = {
      p: [WAIT.p[0] + right[0] * sway, WAIT.p[1], WAIT.p[2] + right[2] * sway],
      up: [0, 1, 0],
      fwd,
      sp: [0.05, 0, 0],
      nk: [0.1, 0.25 * S((t - WAIT.t0) * 0.5), 0],
      hL: [0.27, -0.34, 0.04],
      hR: [-0.27, -0.34, 0.04],
      eL: [0.6, -0.2, -0.6],
      eR: [-0.6, -0.2, -0.6],
      fLw: [WAIT.p[0] - right[0] * 0.11, 0.08, WAIT.p[2] - right[2] * 0.11],
      fRw: [WAIT.p[0] + right[0] * 0.11, 0.08, WAIT.p[2] + right[2] * 0.11]
    };
    pose.kLw = [pose.fLw[0] + fwd[0] * 0.6, 0.55, pose.fLw[2] + fwd[2] * 0.6];
    pose.kRw = [pose.fRw[0] + fwd[0] * 0.6, 0.55, pose.fRw[2] + fwd[2] * 0.6];
    return worldify(pose);
  }

  function basePose(t) {
    const tr = TRACKS.find(x => t >= x.w.t0 && t < x.w.t1);
    if (tr) return worldify(walkPose(tr, t));
    if (t >= WAIT.t0 && t < WAIT.t1) return waitPose(t);
    for (const [a, b] of MOCAP) {
      if (t >= a && t < b) {
        const mp = mocapPose(t);
        if (!mp) break;
        const kin = clamp((t - a) / BLEND, 0, 1), kout = b >= DURATION ? 1 : clamp((b - t) / BLEND, 0, 1);
        const k = ease(Math.min(kin, kout));
        return k >= 1 ? mp : blendPose(keyedAt(t), mp, k);
      }
    }
    return keyedAt(t);
  }

  function pick(list, t) {
    let v = list[0];
    for (let i = 0; i < list.length && list[i][0] <= t; i++) v = list[i];
    return v;
  }

  function blinkAt(t) {
    const k = (t * 0.27 + S(t * 0.61) * 0.35) % 1;
    return k > 0.968;
  }

  function mouthOf(base, v) {
    if (base === 'smile' || base === 'grin') return v > 0.35 ? 'open' : base;
    if (base === 'round') return 'round';
    if (base === 'shut' && v < 0.08) return 'shut';
    if (v < 0.12) return 'shut';
    if (v < 0.42) return 'talk';
    return v > 0.88 ? 'wide' : 'open';
  }

  function faceAt(t) {
    const f = pick(FACE, t);
    let eyes = f[1];
    if ((eyes === 'open' || eyes === 'wide') && blinkAt(t)) eyes = 'shut';
    return { eyes, brows: f[2], mouth: mouthOf(f[3], VOICE(t)), gaze: f[4] };
  }

  function handWeights(side, t) {
    const out = { rest: 0, low: 0 };
    HANDS.spans[side].forEach(([kind, a, b]) => {
      const k = Math.min(clamp((t - a + RAMP) / RAMP, 0, 1), clamp((b - t + RAMP) / RAMP, 0, 1));
      out[kind] = Math.max(out[kind], ease(k));
    });
    return out;
  }

  function placeHands(pose, t) {
    ['L', 'R'].forEach(s => {
      const w = handWeights(s, t);
      ['rest', 'low'].forEach(kind => {
        if (!w[kind]) return;
        const h = HANDS[kind];
        pose['h' + s + 'w'] = pose['h' + s + 'w'].map((v, i) => lerp(v, h[s][i], w[kind]));
        pose['e' + s + 'w'] = pose['e' + s + 'w'].map((v, i) => lerp(v, h['e' + s][i], w[kind]));
      });
    });
  }

  function track(list, t) {
    if (t <= list[0][0]) return list[0][1];
    for (let i = 1; i < list.length; i++) {
      if (t < list[i][0]) return lerp(list[i - 1][1], list[i][1], ease((t - list[i - 1][0]) / (list[i][0] - list[i - 1][0])));
    }
    return list[list.length - 1][1];
  }

  function poseAt(t) {
    const pose = basePose(t);
    placeHands(pose, t);
    pose.nk = [pose.nk[0] + track(NOD, t), pose.nk[1], pose.nk[2]];
    const reach = track(REACH.R, t);
    if (reach > 0) {
      pose.hRw = pose.hRw.map((v, i) => lerp(v, REACH.at[i], reach));
      pose.eRw = pose.eRw.map((v, i) => lerp(v, REACH.pole[i], reach));
    }
    const g = pick(GRIPS, t);
    pose.gL = g[1];
    pose.gR = g[2];
    Object.assign(pose, faceAt(t));
    return pose;
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    return { t: tt, camera: camera(), pose: poseAt(tt) };
  }

  window.MukbangScript = { ID, DURATION, VOICE, CAM, MOCAP, WALKS, KEYED, WAIT, FACE, GRIPS, stage, faceAt, poseAt };
})();
