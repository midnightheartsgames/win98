(function () {
  const { clamp, lerp } = window.YouVidKit;
  const Tr = window.DownTrack;
  const RAD = Math.PI / 180;
  const FOV = 67.5;
  const EYE_H = 1.72;

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

  function trackOf(name) {
    const a = Tr[name];
    if (!a) return null;
    const keys = [];
    for (let i = 0; i < a.length; i += 3) keys.push([a[i], [a[i + 1], a[i + 2]]]);
    return lin(keys);
  }

  const SHOTS = [
    { name: 'rating', t0: 0, t1: 2.45, set: 'card' },
    { name: 'bunker', t0: 2.45, t1: 5.24, set: 'bunker', still: { eye: [0, 1.7, 7.4], at: [0, 1.7, 0], fov: 45 } },
    { name: 'ogre', t0: 5.24, t1: 9.55, set: 'bunker', env: 'ogre', still: { eye: [0.75, 1.18, 4.4], at: [0.5, 1.42, 0], fov: 46 } },
    { name: 'black', t0: 9.55, t1: 10.25, set: 'black' },
    { name: 'road', t0: 10.25, t1: 13.81, set: 'road', fp: { track: 'road', pitch: 1.5, path: [[10.25, [0, 0]], [10.8, [0.3, -3.2]], [13.4, [4.3, -18.3]], [13.81, [5.1, -20.6]]], bob: 0.03 } },
    { name: 'army', t0: 13.81, t1: 15.97, set: 'army', fp: { track: 'army', path: [[13.81, [0, 0]]], pitch: -11 } },
    { name: 'wheel', t0: 15.97, t1: 18.62, set: 'wheel', fp: { track: 'wheel', path: [[15.97, [0, 0]]], pitch: 9.8 } },
    { name: 'cellar', t0: 18.62, t1: 24.27, set: 'cellar', fp: { keys: [[18.62, [-62, 2]], [18.95, [-40, 0]], [19.2, [-8, 6]], [19.45, [0, 10]], [19.8, [2, 5]], [20.1, [4, -5]], [21.0, [0, -3]], [22.5, [-6, -2]], [24.27, [-10, -1]]], path: [[18.62, [0.2, -0.9]], [19.2, [0, -2.4]], [19.4, [0, -3.3]], [20.05, [0, -6.6]], [24.27, [-1.5, -16]]], height: [[18.62, -0.88], [19.3, -0.86], [19.6, -0.25], [19.85, 0.75], [20.1, 1.72], [24.27, 1.72]], bob: 0.03 } },
    { name: 'vorig', t0: 24.27, t1: 26.86, set: 'village', fp: { track: 'vorig', pitch: -5.6, path: [[24.27, [0, 0]], [26.86, [0.6, -9.5]]], bob: 0.025 } },
    { name: 'v8k', t0: 26.86, t1: 29.86, set: 'village', fp: { track: 'v8k', yaw: 20, pitch: -4, path: [[26.86, [-1.6, -15.5]], [29.86, [1.2, -25.5]]], bob: 0.03 } },
    { name: 'ctrlIn', t0: 29.86, t1: 33.93, set: 'ctrlIn', fp: { track: 'ctrlIn', yaw: 4, pitch: -2, jumps: [[33.3, -72, 0]], path: [[29.86, [0, 0]], [33.29, [0.2, -1.2]], [33.31, [0.4, -1.6]], [33.93, [0.5, -1.9]]] } },
    { name: 'ctrlOut', t0: 33.93, t1: 36.29, set: 'ctrlOut', fp: { track: 'ctrlOut', yaw: -14, pitch: 2, jumps: [[35.32, 4, -2]], path: [[33.93, [0, 0]], [35.31, [0.1, -0.8]], [35.33, [0.0, 4.5]], [36.29, [0.0, 4.2]]] } },
    { name: 'voice', t0: 36.29, t1: 41.37, set: 'gate', fp: { track: 'voice', yaw: 35, pitch: -41, path: [[36.29, [0, 0.4]], [41.37, [0, 0.4]]] } },
    { name: 'rtxA', t0: 41.37, t1: 43.84, set: 'hill', fp: { track: 'rtxA', path: [[41.37, [0, 0]]], pitch: -12, height: [[41.37, 5.5], [43.84, 5.5]] } },
    { name: 'rtxB', t0: 43.84, t1: 46.55, set: 'hill', fp: { track: 'rtxB', yaw: 40, pitch: -34, path: [[43.84, [0.5, 0.5]], [46.55, [1.5, -1.5]]], height: [[43.84, 5.5], [46.55, 5.5]] } },
    { name: 'bugsA', t0: 46.55, t1: 48.07, set: 'bugs', fp: { track: 'bugs', path: [[46.55, [0, 0]], [48.07, [1.0, -5.0]]], bob: 0.05 } },
    { name: 'bugsB', t0: 48.07, t1: 49.3, set: 'bugs', fp: { keys: [[48.07, [-38, 3]], [48.4, [-36, 4]], [48.7, [-32, 3]], [48.95, [-6, 0]], [49.3, [-3, -1]]], path: [[48.07, [20, 0]], [48.72, [20.1, -0.3]], [49.3, [20.6, -3.8]]], bob: 0.04 } },
    { name: 'inv', t0: 49.3, t1: 50.78, set: 'inv' },
    { name: 'invModel', t0: 50.78, t1: 51.73, set: 'invModel', still: { eye: [-0.42, 1.3, 1.75], at: [-0.42, 1.28, 0], fov: 38 } },
    { name: 'barrel', t0: 51.73, t1: 55.04, set: 'barrel', fp: { track: 'barrel', path: [[51.73, [0, 0]]], pitch: -30 } },
    { name: 'monument', t0: 55.04, t1: 57.72, set: 'monument', fp: { track: 'monument', path: [[55.04, [0, 0]]] } },
    { name: 'signA', t0: 57.72, t1: 61.18, set: 'sign', fp: { track: 'signA', yaw: -38, pitch: -5.4, path: [[57.72, [0, 0]], [58.15, [2.4, -0.9]], [61.18, [3.2, -1.8]]] } },
    { name: 'signB', t0: 61.18, t1: 64.46, set: 'sign', fp: { track: 'signB', yaw: 14.7, pitch: -5.7, path: [[61.18, [-13.2, -7.1]], [63.0, [-11.2, -0.6]], [64.46, [-10.6, 1.0]]], bob: 0.02 } },
    { name: 'plantA', t0: 64.46, t1: 68.33, set: 'plant', fp: { track: 'plantA', pitch: 8, pitchKeys: [[64.46, 0], [66.0, 2.5], [66.8, 4.6], [68.33, 4]], path: [[64.46, [0, 0]], [68.33, [-0.5, -2.5]]], bob: 0.02 } },
    { name: 'plantB', t0: 68.33, t1: 73.31, set: 'factory', fp: { track: 'plantB', pitch: 8, path: [[68.33, [0, 0]], [73.31, [-1.2, -3.5]]], bob: 0.02 } }
  ];

  SHOTS.forEach(s => {
    if (!s.fp) return;
    const f = s.fp;
    f.trackFn = f.track ? trackOf(f.track) : null;
    f.keysFn = f.keys ? smooth(f.keys) : null;
    f.pathFn = smooth(f.path.length > 1 ? f.path : [f.path[0], [s.t1, f.path[0][1]]]);
    f.heightFn = f.height ? smooth(f.height) : null;
    f.pitchKeysFn = f.pitchKeys ? smooth(f.pitchKeys) : null;
  });

  const DURATION = 73.3;
  const CUTS = SHOTS.slice(1).map(s => s.t0);

  function shotAt(t) {
    for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].t0) return SHOTS[i];
    return SHOTS[0];
  }

  function dirOf(yaw, pitch) {
    const y = yaw * RAD, p = pitch * RAD;
    return [Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p)];
  }

  function camera(t, shot) {
    const s = shot || shotAt(t);
    if (s.still) {
      const st = s.still;
      return { set: s.set, env: s.env, eye: st.eye.slice(), at: st.at.slice(), fov: st.fov, yaw: 0, pitch: 0, roll: 0, shot: s.name };
    }
    if (!s.fp) return { set: s.set, eye: [0, EYE_H, 0], at: [0, EYE_H, -1], fov: FOV, yaw: 0, pitch: 0, roll: 0, shot: s.name };
    const f = s.fp;
    const tt = clamp(t, s.t0, s.t1);
    let yaw = f.yaw || 0, pitch = f.pitch || 0;
    if (f.keysFn) { const v = f.keysFn(tt); yaw += v[0]; pitch += v[1]; }
    else if (f.trackFn) { const v = f.trackFn(tt); yaw += v[0]; pitch += f.pitchKeysFn ? f.pitchKeysFn(tt) : v[1]; }
    if (f.jumps) f.jumps.forEach(([tj, dy, dp]) => { if (tt >= tj) { yaw += dy; pitch += dp; } });
    if (f.yawAdd) yaw += f.yawAdd(tt);
    if (f.pitchAdd) pitch += f.pitchAdd(tt);
    const xz = f.pathFn(tt);
    const walk = f.bob || 0;
    const h = (f.heightFn ? f.heightFn(tt) : EYE_H) + Math.sin(tt * 9.4) * walk;
    const eye = [xz[0], h, xz[1]];
    const d = dirOf(yaw, pitch);
    return { set: s.set, eye, at: [eye[0] + d[0], eye[1] + d[1], eye[2] + d[2]], fwd: d, fov: f.fov || FOV, yaw, pitch, roll: 0, shot: s.name };
  }

  function rayAt(cam, u, v, aspect) {
    const a = aspect || 16 / 9;
    const th = Math.tan(cam.fov * RAD / 2);
    const fw = cam.fwd || (() => { const d = [cam.at[0] - cam.eye[0], cam.at[1] - cam.eye[1], cam.at[2] - cam.eye[2]]; const l = Math.hypot(d[0], d[1], d[2]); return d.map(x => x / l); })();
    let right = [-fw[2], 0, fw[0]];
    const rl = Math.hypot(right[0], right[2]) || 1;
    right = [right[0] / rl, 0, right[2] / rl];
    const up = [right[1] * fw[2] - right[2] * fw[1], right[2] * fw[0] - right[0] * fw[2], right[0] * fw[1] - right[1] * fw[0]];
    const x = (u * 2 - 1) * th * a, y = (1 - v * 2) * th;
    const d = [fw[0] + right[0] * x + up[0] * y, fw[1] + right[1] * x + up[1] * y, fw[2] + right[2] * x + up[2] * y];
    const l = Math.hypot(d[0], d[1], d[2]);
    return d.map(c => c / l);
  }

  function at(t, u, v, dist) {
    const cam = camera(t);
    const d = rayAt(cam, u, v);
    return [cam.eye[0] + d[0] * dist, cam.eye[1] + d[1] * dist, cam.eye[2] + d[2] * dist];
  }

  function ground(t, u, v, h) {
    const cam = camera(t);
    const d = rayAt(cam, u, v);
    const k = d[1] < -1e-4 ? (cam.eye[1] - (h || 0)) / -d[1] : 200;
    return [cam.eye[0] + d[0] * k, h || 0, cam.eye[2] + d[2] * k];
  }

  function project(cam, p, aspect) {
    const a = aspect || 16 / 9;
    const fw = cam.fwd || dirOf(cam.yaw, cam.pitch);
    let right = [-fw[2], 0, fw[0]];
    const rl = Math.hypot(right[0], right[2]) || 1;
    right = [right[0] / rl, 0, right[2] / rl];
    const up = [right[1] * fw[2] - right[2] * fw[1], right[2] * fw[0] - right[0] * fw[2], right[0] * fw[1] - right[1] * fw[0]];
    const d = [p[0] - cam.eye[0], p[1] - cam.eye[1], p[2] - cam.eye[2]];
    const z = d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2];
    if (z <= 0.05) return null;
    const th = Math.tan(cam.fov * RAD / 2);
    const x = (d[0] * right[0] + d[1] * right[1] + d[2] * right[2]) / z / (th * a);
    const y = (d[0] * up[0] + d[1] * up[1] + d[2] * up[2]) / z / th;
    return [(x + 1) / 2, (1 - y) / 2, z];
  }

  window.DownCam = { FOV, EYE_H, SHOTS, DURATION, CUTS, shotAt, camera, rayAt, at, ground, project, smooth, lin, dirOf };
})();
