(function () {
  const Tr = window.ParadTrack;
  const { clamp, lerp } = window.YouVidKit;
  const RAD = Math.PI / 180;
  const ALPHA = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const FOV = 67.5;
  const EYE_H = 1.72;

  function decode(str, lo, step) {
    const out = new Float32Array(str.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = lo + (ALPHA.indexOf(str[i * 2]) * 62 + ALPHA.indexOf(str[i * 2 + 1])) * step;
    return out;
  }

  const YAW = decode(Tr.yaw, Tr.YAW_LO, Tr.YAW_STEP);
  const PRES = decode(Tr.pitch, Tr.PITCH_LO, Tr.PITCH_STEP);

  function sample(arr, t) {
    const x = clamp(t * Tr.RATE, 0, arr.length - 1);
    const i = Math.min(arr.length - 2, Math.floor(x));
    return lerp(arr[i], arr[i + 1], x - i);
  }

  function lin(list) {
    return (t) => {
      if (t <= list[0][0]) return list[0][1];
      for (let i = 1; i < list.length; i++) {
        if (t < list[i][0]) {
          const [t0, v0] = list[i - 1], [t1, v1] = list[i];
          const k = (t - t0) / (t1 - t0);
          return Array.isArray(v0) ? v0.map((v, j) => lerp(v, v1[j], k)) : lerp(v0, v1, k);
        }
      }
      return list[list.length - 1][1];
    };
  }

  function smooth(list) {
    return (t) => {
      if (t <= list[0][0]) return list[0][1];
      for (let i = 1; i < list.length; i++) {
        if (t < list[i][0]) {
          const [t0, v0] = list[i - 1], [t1, v1] = list[i];
          const pa = list[Math.max(0, i - 2)], pb = list[Math.min(list.length - 1, i + 1)];
          const u = (t - t0) / (t1 - t0);
          const h = t1 - t0;
          const u2 = u * u, u3 = u2 * u;
          const one = (a0, a1, b0, b1, ta, tb) => {
            const m0 = (a1 - b0) / Math.max(1e-4, t1 - ta) * h;
            const m1 = (b1 - a0) / Math.max(1e-4, tb - t0) * h;
            return (2 * u3 - 3 * u2 + 1) * a0 + (u3 - 2 * u2 + u) * m0 * 0.5 + (-2 * u3 + 3 * u2) * a1 + (u3 - u2) * m1 * 0.5;
          };
          if (Array.isArray(v0)) return v0.map((v, j) => one(v, v1[j], pa[1][j], pb[1][j], pa[0], pb[0]));
          return one(v0, v1, pa[1], pb[1], pa[0], pb[0]);
        }
      }
      return list[list.length - 1][1];
    };
  }

  const YAW_FIX = lin([[0, 0], [57, 0]]);

  const YAW_MANUAL = smooth([
    [56.6, 18], [57.0, 30], [57.5, 22], [58.0, 28], [58.5, 25], [59.0, 22], [59.5, 30], [60.0, 42], [60.5, 30],
    [61.0, 24], [61.5, -40], [62.0, -36], [62.5, -36], [63.0, -44], [63.5, -30], [64.0, -36], [64.5, -48],
    [65.0, -58], [65.5, -26], [66.0, -30], [66.5, -38], [67.0, -50], [67.5, -28], [68.0, -22], [68.5, -28],
    [69.0, -30], [69.5, -24], [70.0, -2], [70.5, 8], [71.0, 10], [71.5, 4], [72.0, 0], [72.5, 6], [73.0, 6],
    [73.5, 10], [74.0, 10], [74.5, 8], [75.0, 12], [75.5, 18], [76.0, 16], [76.5, 20], [77.0, 24], [77.9, 24]
  ]);

  const YARD_YAW = smooth([
    [78.0, -62], [78.5, -40], [79.0, -8], [79.5, 4], [80.0, 0], [81.0, -2], [82.4, 0], [82.6, 6], [83.2, 22], [86.4, 24],
    [86.8, 10], [87.2, -10], [87.5, -20], [88.5, -18], [89.0, -24], [89.5, -20], [90.5, -22], [92.2, -22], [92.5, -40],
    [92.9, -50], [93.3, -16], [95.0, -14], [95.8, -14], [96.4, -8], [97.5, -8], [98.5, -12], [100.0, -12], [101.5, -24], [102.5, -26], [103.7, -26]
  ]);

  const PITCH_TARGET = [
    [0, -1], [0.5, -2], [3, -6], [4, -3.5], [6, -2.5], [7, -3], [9, -7.6], [11, -9.9], [13, -9], [14.5, -8], [17, -5],
    [21, -7], [23.5, -7.5], [27, -8.4], [29, -7], [31, -3], [32.5, -2], [35, -3], [38, -4], [42, -3], [47, -6],
    [50.5, -3.5], [52.6, -10], [54, -8], [56.6, -6]
  ];
  const PITCH_BASE = smooth(PITCH_TARGET.map(([t, v]) => [t, v - sample(PRES, t)]));

  const PITCH_MANUAL = smooth([
    [56.6, -6], [57.5, -5], [58.5, -9], [59.5, -2], [60.5, -10], [61.0, -8], [61.5, 2], [63.0, 1], [64.0, 0],
    [64.5, -4], [65.5, -2], [66.5, -8], [67.0, -12], [67.5, -4], [68.5, -6], [69.5, -6], [70.0, -2], [71.0, 0],
    [72.0, 0], [73.0, -3], [74.0, -1], [75.0, 0], [76.0, -4], [77.0, -6], [77.9, -6]
  ]);

  const YARD_PITCH = smooth([
    [78.0, -18], [78.5, -12], [79.0, -8], [79.5, -10], [79.75, -20], [80.0, -4], [82.4, -4], [82.6, -25], [83.2, -55],
    [86.4, -55], [86.8, -45], [87.2, -68], [88.4, -68], [88.8, -40], [89.1, -12], [89.4, -18], [89.8, -64], [92.2, -68],
    [92.5, -20], [92.9, -2], [93.3, -32], [95.0, -34], [95.8, -24], [96.4, -28], [99.0, -26], [101.0, -24], [102.5, -26],
    [103.7, -28]
  ]);

  const PATH_VILLAGE = smooth([
    [0, [0, 0]], [2.2, [0, 0]], [4.0, [-0.9, -2.6]], [6.0, [-2.5, -6.9]], [7.0, [-5.1, -9.4]], [9.0, [-6.9, -10.1]],
    [11.0, [-9.5, -11.0]], [13.0, [-10.0, -11.0]], [13.6, [-8.6, -11.4]], [23.5, [-8.6, -11.4]],
    [24.3, [-10.0, -11.0]], [27.5, [-10.4, -11.6]], [33.0, [-10.4, -11.5]], [35.0, [-9.6, -12.0]], [37.0, [-8.4, -12.8]], [39.4, [-8.0, -13.0]], [42.0, [-5.4, -7.2]],
    [47.0, [-2.5, -7.0]], [52.3, [1.0, -2.4]], [53.0, [1.1, -2.5]], [56.6, [8.0, -9.0]]
  ]);

  const PATH_FIELD = smooth([
    [56.6, [0, 0]], [58.0, [0.6, -1.2]], [61.0, [1.0, -2.0]], [67.0, [0.6, -3.0]], [70.0, [1.2, -3.6]], [77.9, [1.6, -4.2]]
  ]);

  const PATH_YARD = smooth([
    [78.0, [0, 0]], [79.4, [0.2, -0.4]], [82.4, [0.25, -0.5]], [83.0, [0.3, -0.6]], [86.6, [0.4, -0.7]], [87.0, [0.4, -0.8]],
    [89.0, [0.3, -3.5]], [91.0, [0.0, -6.0]], [92.2, [-0.3, -7.8]], [93.0, [-0.5, -8.2]], [95.0, [-0.7, -8.6]], [95.6, [-0.8, -9.0]], [96.0, [-0.9, -9.4]], [103.7, [-0.85, -9.35]]
  ]);

  const FIELD_ORIGIN = [40, 0, -60];
  const YARD_ORIGIN = [-160, 0, 120];

  function setOf(t) {
    if (t < 56.6) return 'village';
    if (t < 78.0) return 'field';
    return 'yard';
  }

  function bob(t, amp) {
    return Math.sin(t * 9.4) * amp;
  }

  function camera(t) {
    const set = setOf(t);
    let yaw, pitch, xz, origin = [0, 0, 0];
    if (set === 'village') {
      yaw = sample(YAW, t) + YAW_FIX(t);
      pitch = PITCH_BASE(t) + sample(PRES, t);
      xz = PATH_VILLAGE(t);
    } else if (set === 'field') {
      const k = clamp((t - 56.6) / 0.6, 0, 1);
      yaw = lerp(sample(YAW, Math.min(t, Tr.END)) - 360, YAW_MANUAL(t), k);
      pitch = PITCH_MANUAL(t);
      xz = PATH_FIELD(t);
      origin = FIELD_ORIGIN;
    } else {
      yaw = YARD_YAW(t);
      pitch = YARD_PITCH(t);
      xz = PATH_YARD(t);
      origin = YARD_ORIGIN;
    }
    const walking = set === 'village' ? ((t > 2.2 && t < 13) || (t > 24.3 && t < 27.5) || (t > 39.4 && t < 56.6)) : false;
    const eye = [origin[0] + xz[0], EYE_H + (walking ? bob(t, 0.025) : 0), origin[2] + xz[1]];
    const cy = Math.cos(yaw * RAD), sy = Math.sin(yaw * RAD), cp = Math.cos(pitch * RAD), sp = Math.sin(pitch * RAD);
    const fwd = [sy * cp, sp, -cy * cp];
    return { set, yaw, pitch, eye, fwd, at: [eye[0] + fwd[0], eye[1] + fwd[1], eye[2] + fwd[2]], up: [0, 1, 0], fov: FOV, origin };
  }

  function basis(cam) {
    const RADy = cam.yaw * RAD;
    const right = [Math.cos(RADy), 0, Math.sin(RADy)];
    const f = cam.fwd;
    const up = [right[1] * f[2] - right[2] * f[1], right[2] * f[0] - right[0] * f[2], right[0] * f[1] - right[1] * f[0]];
    return { right, up, fwd: f };
  }

  function ray(cam, u, v, aspect) {
    const a = aspect || 16 / 9;
    const ty = Math.tan(cam.fov * RAD / 2);
    const x = (u * 2 - 1) * ty * a, y = (1 - v * 2) * ty;
    const B = basis(cam);
    const d = [B.fwd[0] + B.right[0] * x + B.up[0] * y, B.fwd[1] + B.right[1] * x + B.up[1] * y, B.fwd[2] + B.right[2] * x + B.up[2] * y];
    const l = Math.hypot(d[0], d[1], d[2]);
    return [d[0] / l, d[1] / l, d[2] / l];
  }

  function ground(t, u, v, h) {
    const cam = camera(t);
    const d = ray(cam, u, v);
    const y = h || 0;
    if (d[1] > -1e-3) return null;
    const k = (y - cam.eye[1]) / d[1];
    return [cam.eye[0] + d[0] * k, y, cam.eye[2] + d[2] * k];
  }

  function at(t, u, v, dist) {
    const cam = camera(t);
    const d = ray(cam, u, v);
    return [cam.eye[0] + d[0] * dist, cam.eye[1] + d[1] * dist, cam.eye[2] + d[2] * dist];
  }

  function project(cam, p, aspect) {
    const a = aspect || 16 / 9;
    const B = basis(cam);
    const q = [p[0] - cam.eye[0], p[1] - cam.eye[1], p[2] - cam.eye[2]];
    const z = q[0] * B.fwd[0] + q[1] * B.fwd[1] + q[2] * B.fwd[2];
    if (z <= 0.01) return null;
    const x = (q[0] * B.right[0] + q[1] * B.right[1] + q[2] * B.right[2]) / z;
    const y = (q[0] * B.up[0] + q[1] * B.up[1] + q[2] * B.up[2]) / z;
    const ty = Math.tan(cam.fov * RAD / 2);
    return [(x / (ty * a) + 1) / 2, (1 - y / ty) / 2, z];
  }

  window.ParadCam = { FOV, EYE_H, FIELD_ORIGIN, YARD_ORIGIN, camera, ray, ground, at, project, setOf, smooth, lin };
})();
