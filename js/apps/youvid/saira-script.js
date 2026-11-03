(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Track = window.SairaTrack;
  const Sets = window.SairaSets;
  const Hands = window.SairaHands;
  const P3 = window.SairaProps;

  const ID = 'S4iraSuP0sm';
  const DURATION = 607.55;
  const ASPECT = 16 / 9;
  const ENVS = Sets.ENVS;

  function camAt(eye, f, up, fov) {
    return { eye, at: V3.add(eye, f), up, fov };
  }

  function topCam(eye, yaw, pitch, fov) {
    const f = [S(yaw) * C(pitch), S(pitch), -C(yaw) * C(pitch)];
    const upref = pitch < -0.9 ? [S(yaw), 0, -C(yaw)] : [0, 1, 0];
    const z = V3.mul(f, -1);
    const x = V3.norm(V3.cross(upref, z));
    const y = V3.cross(z, x);
    return camAt(eye, f, y, fov);
  }

  function look(eye, at, fov, roll) {
    const f = V3.norm(V3.sub(at, eye));
    const right = V3.norm(V3.cross(f, [0, 1, 0]));
    const up0 = V3.cross(right, f);
    const r = roll || 0;
    return { eye, at, up: V3.add(V3.mul(up0, C(r)), V3.mul(right, S(r))), fov };
  }

  function shake(cam, t, amp, seed) {
    const w = K.wobble(t, amp, seed || 1);
    const f = V3.norm(V3.sub(cam.at, cam.eye));
    const right = V3.norm(V3.cross(f, cam.up));
    const up = V3.cross(right, f);
    const at = V3.add(cam.at, V3.add(V3.mul(right, w[0]), V3.mul(up, w[1])));
    return { eye: V3.add(cam.eye, V3.mul(right, w[0] * 0.2)), at, up: cam.up, fov: cam.fov };
  }

  function ray(cam, sx, sy) {
    const f = V3.norm(V3.sub(cam.at, cam.eye));
    const right = V3.norm(V3.cross(f, cam.up));
    const up = V3.cross(right, f);
    const t = Math.tan((cam.fov * PI) / 360);
    return V3.norm(V3.add(f, V3.add(V3.mul(right, (sx * 2 - 1) * t * ASPECT), V3.mul(up, (1 - sy * 2) * t))));
  }

  function onPlane(cam, sx, sy, y) {
    const d = ray(cam, sx, sy);
    const k = (y - cam.eye[1]) / (Math.abs(d[1]) < 1e-4 ? -1e-4 : d[1]);
    return V3.add(cam.eye, V3.mul(d, k));
  }

  function project(cam, p) {
    const f = V3.norm(V3.sub(cam.at, cam.eye));
    const right = V3.norm(V3.cross(f, cam.up));
    const up = V3.cross(right, f);
    const d = V3.sub(p, cam.eye);
    const z = V3.dot(d, f);
    const t = Math.tan((cam.fov * PI) / 360);
    return [(V3.dot(d, right) / (z * t * ASPECT) + 1) / 2, (1 - V3.dot(d, up) / (z * t)) / 2];
  }

  function keyed(list) {
    return (t) => {
      if (t <= list[0][0]) return Object.assign({}, list[0][1]);
      for (let i = 1; i < list.length; i++) {
        if (t < list[i][0]) {
          const [t0, a] = list[i - 1];
          const [t1, b] = list[i];
          const k = ease((t - t0) / (t1 - t0));
          const out = Object.assign({}, a);
          Object.keys(b).forEach(key => {
            const va = a[key], vb = b[key];
            if (Array.isArray(va) && Array.isArray(vb) && typeof va[0] === 'number') out[key] = va.map((v, j) => lerp(v, vb[j], k));
            else if (typeof va === 'number' && typeof vb === 'number') out[key] = lerp(va, vb, k);
            else out[key] = k < 0.5 && va !== undefined ? va : vb;
          });
          return out;
        }
      }
      return Object.assign({}, list[list.length - 1][1]);
    };
  }

  const GRIP_ROLL = { pinch: 1.1, hold: 0.8, cup: 1.4, flat: 0, open: 0.3, point: 0.5 };
  const ARMS = {
    stove: { R: [0.36, 0.2, 0.6], L: [-0.12, 0.2, 0.6] },
    table: { R: [0.34, 0.16, 0.55], L: [-0.3, 0.16, 0.55] },
    sunny: { R: [0.34, 0.16, 0.55], L: [-0.32, 0.16, 0.5] },
    phone: { R: [0.25, 0.25, 0.5], L: [-0.25, 0.25, 0.5] }
  };
  let arms = ARMS.stove;

  function handFromScreen(cam, side, sp, o) {
    const base = o.y === undefined ? 0.1 : o.y;
    const plane = onPlane(cam, sp.tip[0], sp.tip[1], base);
    const d0 = V3.len(V3.sub(plane, cam.eye));
    const ratio = sp.depth !== undefined ? sp.depth : clamp(sp.thick && sp.ref ? Math.pow(sp.ref / sp.thick, o.depthGain || 0.35) : 1, o.near || 0.75, 1.08);
    const tip = V3.add(cam.eye, V3.mul(ray(cam, sp.tip[0], sp.tip[1]), d0 * ratio));
    const entH = tip[1] + (o.armRise === undefined ? 0.04 : o.armRise);
    const ent = onPlane(cam, sp.ent[0], sp.ent[1], entH);
    let flat = V3.sub(tip, ent);
    flat = [flat[0], 0, flat[2]];
    if (V3.len(flat) < 1e-3) flat = [0, 0, -1];
    flat = V3.norm(flat);
    const pitch = sp.pitch !== undefined ? sp.pitch : (o.pitch === undefined ? 0.35 : o.pitch);
    const yawAdd = sp.yaw || 0;
    const fl = yawAdd ? [flat[0] * C(yawAdd) + flat[2] * S(yawAdd), 0, -flat[0] * S(yawAdd) + flat[2] * C(yawAdd)] : flat;
    const dir = V3.norm([fl[0] * C(pitch), -S(pitch), fl[2] * C(pitch)]);
    const grip = sp.grip || o.grip || 'open';
    const spec = { side, tip, dir, grip, roll: sp.roll !== undefined ? sp.roll : (o.roll !== undefined ? o.roll : GRIP_ROLL[grip] || 0), sleeve: o.sleeve || 'black', back: o.back };
    const wrist = V3.sub(tip, V3.mul(dir, (Hands.GRIPS[spec.grip] || Hands.GRIPS.open).reach));
    const anchor = sp.elbow || o.elbow || (arms && arms[side]);
    spec.arm = V3.norm(V3.sub(anchor || ent, wrist));
    const rig = Hands.solve(spec);
    return { rig, props: (sp.props || o.props || []).map(p => Object.assign({}, p)) };
  }

  function tracked(shot, side, t, cam, o) {
    const h = Track.hand(shot, side, t);
    if (!h) return null;
    if (o.box) {
      const b = o.box;
      if (h.tip[0] < b[0] || h.tip[0] > b[2] || h.tip[1] < b[1] || h.tip[1] > b[3]) return null;
    }
    return handFromScreen(cam, side, Object.assign({}, h, o.sp || {}), o);
  }

  function hand(shot, side, t, cam, o, keys) {
    if (keys) {
      const k = keys(t);
      if (k.off) return null;
      if (!k.track) return handFromScreen(cam, side, k, o);
      const tr = Track.hand(shot, side, t);
      if (!tr) return k.tip ? handFromScreen(cam, side, k, o) : null;
      return handFromScreen(cam, side, Object.assign({}, tr, k, { tip: tr.tip, ent: k.ent || tr.ent }), o);
    }
    return tracked(shot, side, t, cam, o);
  }

  const FRY_PIECES = [];
  (function () {
    const g = window.P3D.rand(5);
    for (let i = 0; i < 13; i++) {
      const a = g() * PI * 2, d = 0.02 + Math.sqrt(g()) * 0.075;
      FRY_PIECES.push({ p: [-0.03 + C(a) * d, P3.FRY.floor, -0.02 + S(a) * d], yaw: g() * PI, i, s: 0.85 + g() * 0.35 });
    }
  })();

  function fryState(t) {
    if (t < 47.4 || t >= 120.37) return { layers: [], chunks: [] };
    const n = Math.min(FRY_PIECES.length, Math.floor((t - 47.4) * 1.35));
    const sauceK = clamp((t - 59.5) / 15, 0, 1);
    const stir = clamp((t - 77.6) / 2.5, 0, 1);
    const mash = clamp((t - 91) / 16, 0, 1);
    const spin = t > 77.4 ? (Math.min(t, 84) - 77.4) * 0.9 + (t > 97 ? (Math.min(t, 104.4) - 97) * 0.7 : 0) : 0;
    const chunks = FRY_PIECES.slice(0, n).map((c, i) => {
      const a = Math.atan2(c.p[2], c.p[0]) + spin * (0.6 + (i % 3) * 0.2);
      const d = Math.hypot(c.p[0], c.p[2]) * (1 - mash * 0.25);
      const s = c.s * (1 - mash * 0.7);
      const red = Math.max(sauceK * 0.85, stir);
      return { p: [C(a) * d, P3.FRY.floor + 0.001 - stir * 0.004, S(a) * d], yaw: c.yaw + spin, i: c.i, s, tint: [lerp(1, 1.18, red), lerp(1, 0.78, red), lerp(1, 0.66, red)] };
    });
    const layers = [];
    const oilK = clamp((t - 48) / 6, 0, 1) * (1 - stir);
    if (oilK > 0) layers.push({ tex: 'oil', y: P3.FRY.floor + 0.001, r: 0.1, alpha: 0.55 * oilK, dx: -0.02 });
    if (sauceK > 0 && stir < 0.6) {
      [[-0.03, -0.04, 0.05], [0.02, 0.0, 0.055], [-0.05, 0.03, 0.045], [0.03, 0.05, 0.04], [-0.01, -0.07, 0.035], [0.05, -0.04, 0.035]].forEach(([x, z, r], i) => {
        const k = clamp(sauceK * 6 - i, 0, 1);
        if (k > 0) layers.push({ tex: 'lumps', y: P3.FRY.floor + 0.004 + i * 0.0006, r: r * (0.5 + 0.5 * k), dx: x, dz: z, alpha: 1 - stir / 0.6 });
      });
    }
    if (stir > 0) layers.push({ tex: 'sauce', y: P3.FRY.floor + 0.003, r: 0.104, alpha: stir, scroll: [spin * 0.02, 0] });
    if (mash > 0) layers.push({ tex: 'mash', y: P3.FRY.floor + 0.0045, r: 0.104, alpha: mash, scroll: [spin * 0.02, 0] });
    return { layers, chunks };
  }

  function sauceState(t, set) {
    if (set === 'stove' && t < 89.1) return { layers: [] };
    const layers = [];
    const boil = (t >= 89.1 && t < 113.5);
    if (boil || t < 115) {
      layers.push({ tex: 'water', y: 0.05, r: 0.094, alpha: 1, scroll: [S(t * 0.7) * 0.02, t * 0.03] });
      layers.push({ tex: 'bubbles', y: 0.0505, r: 0.094, alpha: 0.3, add: true, scroll: [t * 0.11, -t * 0.07] });
    }
    const broth = clamp((t - 113) / 5, 0, 1);
    if (broth > 0) layers.push({ tex: 'broth', y: 0.052, r: 0.095, alpha: broth, scroll: [t * 0.01, 0] });
    return { layers };
  }

  const REFL = [[0.17, 0.075, 0.2, 0.85, 1.0], [-0.03, 0.15, 0.14, 0.45, 0.8]];

  const STOVE_CAM = topCam([0.1328, 0.4911, 0.1462], -0.087, -1.277, 41);

  function stoveBase(t, extra) {
    arms = ARMS.stove;
    const f = fryState(t);
    const s = sauceState(t, 'stove');
    return Object.assign({ set: 'stove', env: ENVS.stove, camera: STOVE_CAM, refl: REFL, fry: { layers: f.layers, chunks: f.chunks }, sauce: { layers: s.layers }, gain: [1.0, 1.0, 1.04], grain: 0.03 }, extra || {});
  }

  function steamOver(center, t, n, k) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const ph = ((t * 0.35 + i / n) % 1);
      out.push({ p: [center[0] + S(i * 2.1 + t * 0.6) * 0.05, center[1] + ph * 0.25, center[2] + C(i * 1.7) * 0.05], k: 0.12 + ph * 0.22, a: (k || 0.25) * 0.22 * S(ph * PI) });
    }
    return out;
  }

  function shotH1(t) {
    const st = stoveBase(t);
    const hands = [];
    if (t >= 27.75 && t < 31.6) {
      const k = ease((t - 27.75) / 0.4) * (1 - ease((t - 31.2) / 0.4));
      const tip = [lerp(1.1, 0.8, k), lerp(0.95, 0.42, k)];
      hands.push(handFromScreen(st.camera, 'R', { tip, ent: [0.98, 1.2], grip: 'cup', depth: 0.36, pitch: 0.15, yaw: -0.25, roll: 3.0, props: [{ kind: 'can', label: 'canNatural', flip: true, local: M4.rotY(-0.6) }] }, { y: 0.1 }));
    }
    st.hands = hands;
    st.overlay = t >= 26.133 ? 'store' : null;
    return st;
  }

  const OPEN_CAN = { kind: 'can', hold: 'base', label: 'canNatural', open: true, lidOpen: 2.4, fill: 0.78, pieces: [[0.0, 0.0, 0.2], [0.016, 0.012, 1.3], [-0.016, 0.008, 2.2], [0.004, -0.018, 0.7]] };

  function shotH2(t) {
    const st = stoveBase(t);
    const k = keyed([
      [37.97, { tip: [0.4, 0.72], ent: [0.2, 1.15], depth: 0.5 }],
      [39.4, { tip: [0.34, 0.62], ent: [0.15, 1.15], depth: 0.56 }],
      [40.6, { tip: [0.3, 0.82], ent: [0.1, 1.15], depth: 0.62 }],
      [41.3, { tip: [0.2, 1.25], ent: [0.1, 1.4], depth: 0.7 }],
      [42.6, { tip: [0.25, 1.25], ent: [0.3, 1.4], depth: 0.7 }],
      [43.3, { tip: [0.42, 0.66], ent: [0.4, 1.15], depth: 0.5 }],
      [44.5, { tip: [0.4, 0.62], ent: [0.4, 1.15], depth: 0.5 }],
      [45.2, { tip: [0.35, 1.3], ent: [0.35, 1.45], depth: 0.7 }]
    ]);
    const sp = k(t);
    st.hands = sp.tip[1] < 1.15 ? [handFromScreen(st.camera, t < 42.6 ? 'L' : 'R', Object.assign(sp, { grip: 'cup', pitch: 0.2, roll: 3.1, props: [OPEN_CAN] }), { y: 0.1 })] : [];
    return st;
  }

  function shotH3(t) {
    const st = stoveBase(t);
    const cam = st.camera;
    const fill = Math.max(0.2, 0.78 - (t - 46.5) * 0.06);
    const L = hand('h3', 'L', t, cam, { y: 0.1, grip: 'cup', pitch: 0.15, roll: 1.9, props: [Object.assign({}, OPEN_CAN, { hold: 'can', fill, pieces: t < 55 ? OPEN_CAN.pieces.slice(0, 2) : [] })] });
    const R = hand('h3', 'R', t, cam, { y: 0.085, grip: 'pinch', pitch: 0.2, props: [{ kind: 'fork' }] });
    st.hands = [L, R].filter(Boolean);
    return st;
  }

  function shotH4(t) {
    const st = stoveBase(t);
    const cam = st.camera;
    const pour = clamp((t - 59) / 1.5, 0, 1) * (1 - clamp((t - 74.3) / 0.8, 0, 1));
    const L = hand('h4', 'L', t, cam, { y: 0.12, grip: 'cup', pitch: 0.1, roll: 1.4 + pour * 0.5, props: [{ kind: 'jar', label: 'jarSauce', lid: false, fill: Math.max(0.15, 1 - (t - 59) / 18), grab: 0.35 }] });
    const R = hand('h4', 'R', t, cam, { y: 0.085, grip: 'pinch', pitch: 0.2, props: [{ kind: 'fork' }] });
    st.hands = [L, R].filter(Boolean);
    return st;
  }

  function stirKeys(center, rad, period, t0) {
    return (t) => {
      const a = ((t - t0) / period) * PI * 2;
      return { tip: [center[0] + C(a) * rad[0], center[1] + S(a) * rad[1]], ent: [center[0] + 0.12, 1.15], grip: 'hold', pitch: 0.15 };
    };
  }

  function shotH5(t) {
    const st = stoveBase(t);
    const tr = Track.hand('h5', 'R', t) || Track.hand('h5', 'L', t);
    const base = stirKeys([0.31, 0.83], [0.05, 0.05], 1.6, 77.1)(t);
    const sp = tr ? Object.assign({}, base, { tip: [lerp(base.tip[0], tr.tip[0], 0.5), lerp(base.tip[1], tr.tip[1], 0.5)] }) : base;
    st.hands = [handFromScreen(st.camera, 'R', Object.assign(sp, { props: [{ kind: 'spatula' }] }), { y: 0.09 })];
    return st;
  }

  function shotSpoonStove(shot, kind, grip) {
    return (t) => {
      const st = stoveBase(t);
      const R = hand(shot, 'R', t, st.camera, { y: 0.095, grip, pitch: 0.12, props: [{ kind }] }) || handFromScreen(st.camera, 'R', { tip: [0.35 + 0.05 * S(t * 3), 0.78 + 0.04 * C(t * 3)], ent: [0.45, 1.15], grip, props: [{ kind }] }, { y: 0.095, pitch: 0.12 });
      st.hands = [R];
      st.steam = steamOver([0.32, 0.12, 0.01], t, 5, 0.18);
      return st;
    };
  }

  function panPose(c, yaw, tilt) {
    return M4.chain(M4.translate(c[0], c[1], c[2]), M4.rotY(yaw), M4.rotX(-tilt));
  }

  function shotH9(t) {
    const st = stoveBase(t);
    const k = keyed([
      [109.1, { c: [0, 0, 0], yaw: 0, tilt: 0 }],
      [110.4, { c: [0, 0, 0], yaw: 0, tilt: 0 }],
      [111.6, { c: [0.12, 0.08, -0.02], yaw: -0.75, tilt: 0.25 }],
      [113.2, { c: [0.17, 0.11, -0.03], yaw: -0.85, tilt: 0.7 }],
      [116.5, { c: [0.18, 0.12, -0.04], yaw: -0.9, tilt: 0.8 }],
      [118.8, { c: [0.19, 0.12, -0.04], yaw: -0.9, tilt: 0.88 }],
      [119.8, { c: [0.1, 0.14, 0.05], yaw: -0.6, tilt: 0.35 }],
      [120.4, { c: [-0.05, 0.18, 0.25], yaw: -0.3, tilt: 0.2 }]
    ])(t);
    const M = panPose(k.c, k.yaw, k.tilt);
    st.fry.M = M;
    if (k.tilt > 0.3) {
      const out = clamp((t - 112.8) / 6, 0, 1);
      st.fry.layers = st.fry.layers.map(L => Object.assign({}, L, { dz: (L.dz || 0) - 0.05 * k.tilt, alpha: L.alpha * (1 - out * 0.85) }));
      st.fry.chunks = st.fry.chunks.slice(0, Math.max(0, Math.round(st.fry.chunks.length * (1 - out))));
    }
    if (t > 110.3) {
      const grip = M4.point(M, [0, 0.056, P3.FRY.rim + 0.12]);
      const dirH = V3.norm(M4.dir(M, [0, 0, -1]));
      st.hands = [handFromScreen(st.camera, 'R', { tip: project(st.camera, grip), ent: [0.4, 1.2], grip: 'hold', depth: 1, pitch: 0.1, roll: 0.4, elbow: [0.0, 0.25, 0.6] }, { y: grip[1] })];
      st.hands[0].rig = Hands.solve({ side: 'R', tip: V3.add(grip, V3.mul(dirH, 0.03)), dir: V3.norm([dirH[0], -0.15, dirH[2]]), grip: 'hold', roll: 0.5, arm: V3.norm(V3.sub([-0.1, 0.22, 0.55], grip)), sleeve: 'navy' });
    } else {
      st.hands = [];
    }
    st.steam = steamOver([0.32, 0.12, 0.01], t, 6, 0.22);
    return st;
  }

  function shotH10(t) {
    const st = stoveBase(t);
    st.fry.hide = true;
    const a = (t - 120.37) * 4.2;
    const sp = { tip: [0.95 + C(a) * 0.02, 0.6 + S(a) * 0.04], ent: [1.12, 0.95], grip: 'hold', pitch: 0.85, roll: 1.2, elbow: [0.85, 0.3, 0.3] };
    const H = handFromScreen(st.camera, 'R', Object.assign(sp, { props: [{ kind: 'spatula' }] }), { y: 0.13 });
    st.hands = [H];
    st.steam = steamOver([0.32, 0.12, 0.01], t, 6, 0.25);
    return st;
  }

  function timeline(list, t) {
    let cur = list[0];
    for (const s of list) if (t >= s.t) cur = s;
    return cur;
  }

  const TABLE_CAMS = [
    { t: 153.1, cam: topCam([0.155, 0.369, 0.014], 0, -1.534, 41) },
    { t: 173.0, cam: topCam([0.04, 0.37, 0.02], 0, -1.52, 41) },
    { t: 178.9, cam: topCam([0.09, 0.376, 0.012], 0, -1.57, 41) },
    { t: 187.0, cam: topCam([0.1, 0.33, 0.2], 0.15, -1.25, 41) },
    { t: 192.3, cam: topCam([0.008, 0.365, 0.014], 0, -1.57, 41) },
    { t: 243.77, cam: topCam([0.013, 0.372, 0.015], 0, -1.57, 41) },
    { t: 293.5, cam: topCam([0.002, 0.371, -0.009], 0, -1.57, 41) },
    { t: 318.93, cam: topCam([0.01, 0.24, 0.05], 0, -1.4, 41) },
    { t: 330.0, cam: topCam([0.002, 0.371, -0.009], 0, -1.57, 41) },
    { t: 405.57, cam: topCam([0.013, 0.315, 0.0], 0, -1.57, 41) },
    { t: 441.43, cam: topCam([0.017, 0.315, -0.019], 0, -1.57, 41) },
    { t: 461.5, cam: topCam([0.017, 0.315, 0.015], 0, -1.57, 41) }
  ];

  const SPILL = [[0.13, -0.04, 0.09, 0.4]];

  function soupIn(t) {
    const layers = [];
    const fill = t < 160.5 ? 0 : t < 173 ? ease((t - 160.5) / 12.5) : 1;
    if (fill <= 0) return { layers };
    const y = 0.004 + fill * 0.044;
    const potato = t >= 405.5 && t < 476.6;
    layers.push({ tex: potato ? 'potatoSoup' : 'soup', y, alpha: 1, scale: 0.95 + fill * 0.05 });
    if (t >= 452.2 && t < 476.6) layers.push({ tex: 'creamy', y: y + 0.0008, alpha: clamp((t - 452.2) / 9, 0, 1) });
    if (t >= 260 && t < 340) layers.push({ tex: 'lumps', y: y + 0.0006, alpha: 1, scale: 0.35, dx: 0.03, dz: 0.0 });
    return { layers, y };
  }

  function tableBase(t, extra) {
    arms = ARMS.table;
    const c = timeline(TABLE_CAMS, t).cam;
    const box = soupIn(t);
    const chunks = [];
    if (t >= 250.5 && t < 262) chunks.push({ kind: 'tomato', p: [0.025, box.y - 0.012, 0.0] });
    if (t >= 262 && t < 293.5) chunks.push({ kind: 'half', p: [0.03, box.y - 0.006, -0.01], yaw: 0.6, s: 0.6 }, { kind: 'half', p: [-0.02, box.y - 0.008, 0.02], yaw: 2.4, s: 0.5 });
    if (t >= 296.8 && t < 340) chunks.push({ kind: 'half', p: [-0.03, box.y - 0.005, 0.0], yaw: 1.0, s: 0.85 }, { kind: 'half', p: [0.04, box.y - 0.007, 0.02], yaw: 2.2, s: 0.55 });
    if (t >= 405.57 && t < 452) [[-0.05, 0.02], [0.06, -0.03], [0.02, 0.04], [-0.07, -0.03], [0.07, 0.03]].forEach(([x, z], i) => chunks.push({ kind: 'wedge', i, p: [x, box.y - 0.004, z], yaw: i * 1.3, s: 1.2 }));
    const st = Object.assign({ set: 'table', env: ENVS.table, camera: c, feltTex: 'felt', box: { M: M4.ident(), layers: box.layers, chunks }, stains: t >= 173 ? SPILL : [], gain: [1.0, 1.0, 1.02] }, extra || {});
    if (t >= 444 && t < 461) st.box.squiggle = { y: box.y, s: clamp((t - 444) / 3, 0.05, 1) * (1 - clamp((t - 452.3) / 8, 0, 0.9)) };
    return st;
  }

  function shotPour(t) {
    const st = tableBase(t);
    const tilt = ease((t - 159.8) / 1.5) * (1 - ease((t - 172.4) / 0.6));
    const M = M4.chain(M4.translate(0.231 - tilt * 0.1, tilt * 0.06, 0.023), M4.rotZ(tilt * 0.62));
    const sl = sauceState(1000, 'table');
    const left = 1 - clamp((t - 160.5) / 12.5, 0, 1);
    st.sauce = { M, layers: sl.layers.map(L => Object.assign({}, L, { tex: 'soup', y: 0.012 + 0.06 * left, alpha: left > 0.02 ? 1 : 0 })) };
    const grip = M4.point(P3.panMatrix(M, P3.SAUCE.handle), [0, 0.085, 0.24]);
    const R = handFromScreen(st.camera, 'R', { tip: project(st.camera, grip), ent: [1.15, 1.05], grip: 'hold', depth: 1, pitch: 0.1, yaw: 0.3 }, { y: grip[1] + 0.02 });
    const L = hand('h11', 'L', t, st.camera, { y: 0.1, grip: 'pinch', pitch: 0.2, props: [{ kind: 'spoon' }], box: [0, 0, 0.6, 1] });
    st.hands = [R, L].filter(Boolean);
    return st;
  }

  function eatShot(shot, kind, o) {
    return (t) => {
      const st = tableBase(t, o && o.extra ? o.extra(t) : null);
      const R = hand(shot, 'R', t, st.camera, { y: 0.08, grip: 'pinch', pitch: 0.2, props: [{ kind }] }, o && o.keys);
      const L = o && o.left ? hand(shot, 'L', t, st.camera, Object.assign({ y: 0.1, grip: 'cup', pitch: 0.2 }, o.left)) : null;
      st.hands = [R, L].filter(Boolean);
      if (o && o.dim) st.gain = o.dim(t);
      return st;
    };
  }

  function dimAt(spans, t) {
    let k = 0;
    spans.forEach(([a, b]) => { k = Math.max(k, clamp((t - a) / 0.3, 0, 1) * (1 - clamp((t - b) / 0.3, 0, 1))); });
    return [1 - 0.42 * k, 1 - 0.45 * k, 1 - 0.4 * k];
  }

  function shotJarTable(t) {
    const st = tableBase(t);
    if (t < 249.7 && t >= 245.1) {
      const u = (t - 245.1) / 4.6;
      const jar = { kind: 'jar', jarKind: 'pickles', lid: u < 0.7 };
      const L = handFromScreen(st.camera, 'L', { tip: [0.6, 0.85], ent: [0.45, 1.2], grip: 'cup', depth: 0.5, pitch: -0.2, yaw: 0.6, props: [jar] }, { y: 0.1 });
      const R = handFromScreen(st.camera, 'R', { tip: [0.8, 0.72 + 0.03 * S(t * 9)], ent: [1.1, 1.0], grip: 'hold', depth: 0.55, pitch: 0.2, yaw: -0.5 }, { y: 0.1 });
      st.hands = [L, R];
      return st;
    }
    return eatShot('h13', 'spoon', { dim: (tt) => dimAt([[278.2, 283.2]], tt) })(t);
  }

  function shotHalf(t) {
    if (t >= 293.5 && t < 296.8) {
      const st = tableBase(t);
      const L = handFromScreen(st.camera, 'R', { tip: [0.72 + 0.02 * S(t * 2), 0.42], ent: [1.15, 0.9], grip: 'cup', depth: 0.85, pitch: 0.0, yaw: -0.3, props: [{ kind: 'half' }] }, { y: 0.1 });
      st.hands = [L];
      return st;
    }
    return eatShot('h14', 'spoon', { dim: (tt) => dimAt([[308.6, 313.6], [330.0, 339.5]], tt), left: t > 327.8 && t < 330.4 ? { box: [0, 0, 0.5, 1] } : null })(t);
  }

  function shotMayo(t) {
    const st = tableBase(t);
    const cam = st.camera;
    if (t < 448.5) {
      const close = t < 442.1;
      let base, spout, face;
      if (close) {
        base = V3.add(cam.eye, V3.mul(ray(cam, 0.86, 0.05), 0.13));
        spout = V3.add(cam.eye, V3.mul(ray(cam, 0.62, 1.05), 0.14));
        face = V3.mul(V3.norm(V3.sub(cam.at, cam.eye)), -1);
      } else {
        const k = clamp((t - 442.1) / 1.0, 0, 1);
        const sq = 0.006 * S(t * 5);
        base = onPlane(cam, lerp(1.05, 0.98, k), lerp(0.02, 0.12, k), 0.2 + sq);
        spout = onPlane(cam, lerp(0.6, 0.44, k), lerp(0.55, 0.62, k), 0.075);
        face = V3.norm([0.25, 1, 0.15]);
      }
      const axis = V3.norm(V3.sub(spout, base));
      const len = V3.len(V3.sub(spout, base));
      const M = M4.chain(frame3(base, axis, face), M4.scale(1.6, len / 0.2, 1.2));
      const grip = V3.add(base, V3.mul(axis, len * 0.42));
      const hand = Hands.solve({ side: 'R', tip: V3.add(V3.add(grip, V3.mul(face, 0.03)), V3.mul(axis, 0.05)), dir: V3.norm(V3.add(axis, V3.mul(face, -0.5))), grip: 'hold', roll: 0.1, back: face, arm: V3.norm([0.5, 0.5, -0.7]), sleeve: 'black' });
      st.props = [{ kind: 'pouch', M }];
      st.hands = [{ rig: hand, props: [] }];
      return st;
    }
    const st2 = eatShot('h17', 'spoon', { left: { box: [0, 0.5, 1, 1.2], grip: 'flat' } })(t);
    if (t > 461.5) {
      st2.hands = st2.hands.filter(h => h.rig.side < 0);
      st2.props = [{ kind: 'spoon', M: M4.chain(M4.translate(0.03, 0.05, 0.02), M4.rotY(0.3), M4.rotX(1.1), M4.translate(0, 0, 0.12)) }];
    }
    return st2;
  }

  function frame3(o, y, z) {
    const zz = V3.norm(V3.sub(z, V3.mul(y, V3.dot(z, y))));
    const x = V3.norm(V3.cross(y, zz));
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, zz[0], zz[1], zz[2], 0, o[0], o[1], o[2], 1]);
  }

  const SUN_CAMS = [
    { t: 476.567, cam: topCam([0.055, 0.44, -0.026], 0, -1.57, 41) },
    { t: 488.4, cam: topCam([-0.011, 0.4, 0.0], 0, -1.57, 41) },
    { t: 494.0, cam: topCam([0.02, 0.4, 0.0], 0, -1.57, 41) },
    { t: 500.3, cam: topCam([0.01, 0.4, -0.008], 0, -1.57, 41) },
    { t: 511.0, cam: topCam([0.047, 0.4, -0.02], 0, -1.57, 41) }
  ];
  const EAT_CAM = keyed([[523.6, { e: [-0.012, 0.4, -0.003] }], [560, { e: [0.0, 0.4, 0.0] }], [585, { e: [0.034, 0.4, 0.0] }], [607, { e: [0.03, 0.4, 0.0] }]]);
  const SUN_COOKIE = window.P3D.cookieMatrix([-0.55, -0.62, 0.56], [0, 0, 0], 0.55);
  const CAN_POS = [-0.125, -0.13], JAR_POS = [-0.065, -0.14], BOX_POS = [0.165, -0.13];

  function sunnyBase(t) {
    arms = ARMS.sunny;
    const bowl = { M: M4.translate(0.02, 0, 0.03), layers: [], chunks: [] };
    if (t >= 488.4) bowl.brick = { yaw: 0.12, seasoning: t < 500 };
    if (t >= 496.5) {
      const n = clamp(Math.floor((t - 496.5) * 3), 0, 11);
      for (let i = 0; i < n; i++) {
        const a = i * 2.39, d = 0.014 + (i % 4) * 0.015;
        bowl.chunks.push({ p: [C(a) * d - 0.008, P3.BOWL.floor + 0.024, S(a) * d + 0.01], yaw: a * 1.7, i, s: 0.9 });
      }
    }
    if (t >= 501.0) {
      const k = clamp((t - 501.0) / 9.5, 0, 1);
      bowl.layers.push({ tex: 'redPaste', y: 0.04, r: 0.02 + 0.06 * k, alpha: 1, dx: 0.01, dz: 0.012 });
    }
    if (t >= 523.6) {
      bowl.layers = [{ tex: 'redPaste', y: 0.042, r: 0.08, alpha: 1 }];
      bowl.brick = null;
      bowl.chunks = bowl.chunks.map(c => Object.assign({}, c, { p: [c.p[0], 0.039, c.p[2]], tint: [1.15, 0.62, 0.46] }));
    }
    const cam = t >= 523.6 ? topCam(EAT_CAM(t).e, 0, -1.57, 41) : timeline(SUN_CAMS, t).cam;
    const st = { set: 'table', env: ENVS.sunny, camera: shake(cam, t, 0.0012, 5), feltTex: 'feltSun', bowl, cookie: SUN_COOKIE, gain: [1.02, 1.0, 1.0] };
    if (t < 488.4) {
      st.cans = [{ M: M4.translate(CAN_POS[0], 0, CAN_POS[1]), label: 'canTomato' }];
      st.noodleBox = M4.chain(M4.translate(BOX_POS[0], 0, BOX_POS[1]), M4.rotY(0.05));
    }
    if (t < 500.3) st.jars = [{ kind: 'jarPaste', M: M4.translate(JAR_POS[0], 0, JAR_POS[1]), label: 'jarPaste' }];
    else if (t >= 511 && t < 523.6) st.jars = [{ kind: 'jarPaste', M: M4.translate(-0.16, 0, -0.12), label: 'jarPaste', lid: false }];
    return st;
  }

  const CAN_KEYS = keyed([
    [494.0, { tip: [0.06, 0.36], ent: [-0.1, 0.3], depth: 0.62, roll: 2.6, pitch: 0.1 }],
    [494.5, { tip: [0.3, 0.46], ent: [-0.05, 0.3], depth: 0.7, roll: 2.8, pitch: 0.1 }],
    [495.5, { tip: [0.38, 0.55], ent: [-0.05, 0.32], depth: 0.78, roll: 3.2, pitch: 0.2 }],
    [496.5, { tip: [0.46, 0.55], ent: [-0.05, 0.35], depth: 0.82, roll: 3.6, pitch: 0.3 }],
    [497.5, { tip: [0.5, 0.56], ent: [-0.05, 0.38], depth: 0.82, roll: 3.8, pitch: 0.3 }],
    [498.5, { tip: [0.37, 0.55], ent: [-0.05, 0.42], depth: 0.82, roll: 3.4, pitch: 0.2 }],
    [499.0, { tip: [0.26, 0.3], ent: [-0.05, 0.2], depth: 0.7, roll: 3.0, pitch: 0.1 }],
    [500.0, { tip: [0.08, 0.15], ent: [-0.1, 0.1], depth: 0.6, roll: 2.8, pitch: 0.1 }]
  ]);
  const JAR_KEYS = keyed([
    [500.3, { tip: [0.42, 0.25], ent: [0.15, -0.1], depth: 0.6, roll: 3.4, pitch: 0.6 }],
    [501.0, { tip: [0.5, 0.32], ent: [0.2, -0.1], depth: 0.65, roll: 3.6, pitch: 0.7 }],
    [504.0, { tip: [0.48, 0.36], ent: [0.15, -0.1], depth: 0.66, roll: 3.6, pitch: 0.7 }],
    [505.5, { tip: [0.45, 0.42], ent: [0.05, -0.05], depth: 0.7, roll: 3.5, pitch: 0.6 }],
    [507.0, { tip: [0.42, 0.25], ent: [0.15, -0.1], depth: 0.62, roll: 3.0, pitch: 0.3 }],
    [510.5, { tip: [0.42, 0.22], ent: [0.15, -0.1], depth: 0.62, roll: 3.0, pitch: 0.3 }],
    [511.0, { tip: [0.3, 0.0], ent: [0.15, -0.2], depth: 0.55, roll: 3.0, pitch: 0.3 }]
  ]);
  const FORK_KEYS = keyed([
    [507.0, { tip: [0.6, 0.62], ent: [0.62, 1.2], depth: 0.75 }],
    [508.5, { tip: [0.56, 0.55], ent: [0.6, 1.2], depth: 0.72 }],
    [510.5, { tip: [0.58, 0.6], ent: [0.62, 1.2], depth: 0.75 }],
    [511.0, { tip: [0.62, 1.1], ent: [0.62, 1.3], depth: 0.8 }]
  ]);

  function shotSunny(t) {
    const st = sunnyBase(t);
    const hands = [];
    if (t >= 478.6 && t < 481.0) {
      const k = ease((t - 478.6) / 0.4) * (1 - ease((t - 480.6) / 0.4));
      hands.push(handFromScreen(st.camera, 'L', { tip: [lerp(-0.12, 0.24, k), 0.32], ent: [-0.25, 0.45], grip: 'cup', depth: 0.75, pitch: 0.1, props: [{ kind: 'soda' }] }, { y: 0.15, elbow: [-0.42, 0.2, 0.1] }));
    }
    if (t >= 494.0 && t < 500.2) {
      const k = CAN_KEYS(t);
      hands.push(handFromScreen(st.camera, 'L', Object.assign(k, { grip: 'cup', roll: 0.25, props: [{ kind: 'can', label: 'canTomato', open: true, lidOpen: 2.8, fill: t < 496.5 ? 0.6 : 0.2, top: true }] }), { y: 0.17, elbow: [-0.35, 0.25, -0.05] }));
    }
    if (t >= 500.3 && t < 511.0) {
      const k = JAR_KEYS(t);
      hands.push(handFromScreen(st.camera, 'L', Object.assign(k, { grip: 'cup', roll: 0.25, props: [{ kind: 'jar', jarKind: 'jarPaste', label: 'jarPaste', lid: false, top: true }] }), { y: 0.2, elbow: [-0.25, 0.32, -0.35] }));
    }
    if (t >= 507.0 && t < 511.0) {
      const k = FORK_KEYS(t);
      hands.push(handFromScreen(st.camera, 'R', Object.assign(k, { grip: 'pinch', pitch: -0.5, props: [{ kind: 'fork' }] }), { y: 0.1, elbow: [0.1, 0.15, 0.4] }));
    }
    st.hands = hands;
    return st;
  }

  function shotEatSunny(t) {
    const st = sunnyBase(t);
    const R = hand('h19', 'R', t, st.camera, { y: 0.085, grip: 'pinch', pitch: 0.2, sleeve: 'navy', props: [{ kind: 'fork' }] });
    st.hands = R ? [R] : [];
    return st;
  }

  function shotMicro(t) {
    const u = t - 516.033;
    const k = keyed([[0, { pitch: -0.34, y: 0.12, z: 0.2, x: 0.0, yaw: 0 }], [2.3, { pitch: -0.3, y: 0.12, z: 0.2, x: 0.01, yaw: 0.05 }], [3.4, { pitch: 0.35, y: 0.13, z: 0.18, x: 0.02, yaw: -0.15 }], [4.6, { pitch: 0.3, y: 0.13, z: 0.18, x: -0.03, yaw: 0.2 }], [5.4, { pitch: -0.4, y: 0.12, z: 0.18, x: -0.02, yaw: 0.1 }], [7.6, { pitch: -0.36, y: 0.12, z: 0.2, x: 0.0, yaw: 0 }]])(u);
    const cam = shake(topCam([k.x, k.y, k.z], k.yaw, k.pitch, 52), t, 0.004, 9);
    const bowl = { layers: [{ tex: 'redPaste', y: 0.042, r: 0.08, alpha: 1 }], chunks: [0, 1, 2, 3, 4, 5].map(i => ({ p: [C(i * 2.39) * (0.015 + (i % 3) * 0.015), 0.039, S(i * 2.39) * (0.015 + (i % 3) * 0.015)], yaw: i * 1.9, i, s: 0.9, tint: [1.15, 0.62, 0.46] })) };
    return { set: 'micro', env: ENVS.micro, camera: cam, bowl, spin: u * 0.9, gain: [1.0, 0.98, 0.96] };
  }

  function shotBoard(t) {
    const cam = shake(topCam([0.03, 0.39, 0.01], 0, -1.57, 41), t, 0.0008, 3);
    const M = M4.translate(0, 0, 0);
    const chunks = [];
    const g = window.P3D.rand(77);
    for (let i = 0; i < 18; i++) chunks.push({ kind: 'wedge', i, p: [-0.085 + (g() - 0.5) * 0.08, 0.019, -0.005 + (g() - 0.5) * 0.15], yaw: 1.2 + (g() - 0.5) * 1.2, s: 1.15 });
    return { set: 'table', env: ENVS.table, camera: cam, feltTex: 'felt', board: { M, chunks, onion: [0.075, 0.0, 0.13] } };
  }

  const STOVE2_CAM = topCam([0.26, 0.38, 0.06], -0.02, -1.45, 41);

  function shotStove2(t) {
    const st = stoveBase(t, { camera: STOVE2_CAM });
    st.fry.hide = true;
    const chunks = [];
    const added = clamp((t - 367.8) / 5.5, 0, 1);
    const n = Math.floor(added * 12);
    for (let i = 0; i < n; i++) {
      const a = i * 2.4 + (t > 374 ? (Math.min(t, 381) - 374) * 1.2 : 0), d = 0.02 + (i % 4) * 0.016;
      chunks.push({ kind: 'wedge', i, p: [C(a) * d, 0.052, S(a) * d], yaw: a, s: t > 381 ? 0.75 : 1 });
    }
    st.sauce.layers = [{ tex: t < 381 ? 'broth' : 'potatoSoup', y: 0.05, r: 0.094, alpha: 1, scroll: [t * 0.004, 0] }];
    if (added > 0 && t < 381) st.sauce.layers.push({ tex: 'onion', y: 0.0515, r: 0.04 + added * 0.03, alpha: 1, dx: 0.01, dz: 0.01 });
    st.sauce.chunks = chunks;
    st.steam = steamOver([0.32, 0.12, 0.01], t, 8, 0.3);
    const hands = [];
    if (t >= 366.6 && t < 374.0) {
      const k = ease((t - 366.6) / 1.2) * (1 - ease((t - 373.4) / 0.6));
      const plateLeft = handFromScreen(st.camera, 'L', { tip: [lerp(1.1, 0.88, k), lerp(0.95, 0.72, k)], ent: [1.15, 1.2], grip: 'flat', depth: 0.9, pitch: 0.1, yaw: 0.2, props: [{ kind: 'plate', hold: 'plate', chunks: added < 1 ? [0, 1, 2, 3].map(i => ({ kind: 'wedge', i, p: [0.02 * i - 0.03, 0.006, 0.02 * (i % 2)], yaw: i })) : [], onion: added < 0.8 }] }, { y: 0.13 });
      hands.push(plateLeft);
    }
    if ((t >= 369.5 && t < 381.5) || (t >= 397 && t < 401.5)) {
      const fork = t >= 397;
      const a = (t - 369.5) * 3.6;
      const sp = fork ? { tip: [0.8 + 0.03 * S(t * 4), 0.34 + 0.05 * S(t * 2)], ent: [1.12, 0.1], grip: 'pinch', pitch: 0.2, yaw: 0 } : { tip: [0.62 + C(a) * 0.06, 0.52 + S(a) * 0.08], ent: [1.15, 0.35], grip: 'hold', pitch: 0.15 };
      hands.push(handFromScreen(st.camera, 'R', Object.assign(sp, { props: [{ kind: fork ? 'fork' : 'spatula', hold: fork ? 'fork' : 'spatula' }] }), { y: 0.14 }));
    }
    st.hands = hands;
    return st;
  }

  const PHONE_CAMS = {
    a: look([0.0, 0.5, 0.42], [0.0, 0.05, -0.02], 52),
    b: look([0.0, 0.42, 0.3], [0.0, 0.05, -0.04], 52),
    c: look([0.0, 0.46, 0.36], [0.0, 0.05, -0.04], 52)
  };

  function phoneBase(t, cam, layers) {
    arms = ARMS.phone;
    const jars = [{ kind: 'jarVlad', M: M4.translate(-0.12, 0, -0.22), label: 'jarSauce' }, { kind: 'jarVlad', M: M4.translate(-0.03, 0, -0.24), label: 'jarSauce' }];
    return { set: 'phone', env: ENVS.phone, portrait: true, camera: shake(cam, t, 0.006, 4), potM: M4.ident(), potLayers: layers, jars, mug: M4.translate(0.07, 0, -0.23), gain: [1.04, 1.0, 0.96] };
  }

  function shotPhoneA(t) {
    const st = phoneBase(t, PHONE_CAMS.a, [{ tex: 'water', y: 0.07, r: 0.095, alpha: 1, scroll: [0, t * 0.02] }]);
    if (t >= 23.3) st.potLayers.push({ tex: 'soup', y: 0.071, r: 0.03 + clamp((t - 23.3) / 1.2, 0, 1) * 0.06, alpha: 0.85 });
    const hands = [];
    if (t >= 17.2 && t < 18.65) {
      const k = ease((t - 17.2) / 0.5);
      hands.push(handFromScreen(st.camera, 'R', { tip: [lerp(0.75, 0.56, k), lerp(0.75, 0.62, k)], ent: [0.75, 1.2], grip: 'cup', depth: 0.42, pitch: -0.3, yaw: 0.9, props: [{ kind: 'can', label: 'canVlad', tall: true }] }, { y: 0.15, sleeve: 'black' }));
    }
    if (t >= 23.25 && t < 24.6) {
      hands.push(handFromScreen(st.camera, 'R', { tip: [0.62, 0.55], ent: [0.8, 1.1], grip: 'cup', depth: 0.75, pitch: 0.2, yaw: 0.8, props: [{ kind: 'can', label: 'canVlad', tall: true, open: true, lidOpen: 2.5, fill: 0.6, fillTex: 'soup' }] }, { y: 0.18 }));
    }
    st.hands = hands;
    return st;
  }

  function shotPhoneB(t) {
    const st = phoneBase(t, PHONE_CAMS.b, [{ tex: 'broth', y: 0.08, r: 0.096, alpha: 1, scroll: [t * 0.01, 0] }]);
    const a = (t - 83.8) * 3.0;
    st.hands = [handFromScreen(st.camera, 'R', { tip: [0.62 + C(a) * 0.05, 0.6 + S(a) * 0.04], ent: [0.9, 1.15], grip: 'pinch', pitch: 0.2, props: [{ kind: 'spoon' }] }, { y: 0.16 })];
    return st;
  }

  function shotPhoneC(t) {
    const st = phoneBase(t, PHONE_CAMS.c, [{ tex: 'broth', y: 0.08, r: 0.096, alpha: 1, scroll: [t * 0.01, 0] }]);
    const hands = [];
    if (t < 341.65) {
      const shakeK = S(t * 18) * 0.03;
      const bottle = t < 339.7 || t > 340.2;
      hands.push(handFromScreen(st.camera, 'R', { tip: [0.6, 0.38 + shakeK], ent: [0.85, 1.1], grip: 'cup', depth: 0.55, pitch: -0.1, yaw: 0.6, props: [bottle ? { kind: 'jar', jarKind: 'pickles', lid: true } : { kind: 'can', label: 'canVlad' }] }, { y: 0.15 }));
    } else if (t > 344.7) {
      const a = (t - 344.7) * 3.2;
      hands.push(handFromScreen(st.camera, 'R', { tip: [0.6 + C(a) * 0.05, 0.62 + S(a) * 0.04], ent: [0.9, 1.15], grip: 'pinch', pitch: 0.2, props: [{ kind: 'spoon' }] }, { y: 0.16 }));
    }
    st.hands = hands;
    return st;
  }

  const SIT = { fL: [0.16, -0.5, 0.42], fR: [-0.16, -0.5, 0.42], kL: [0.2, 0.3, 1], kR: [-0.2, 0.3, 1] };

  function body(k) {
    const yaw = k.yaw || 0;
    const M = M4.chain(M4.rotY(yaw), M4.rotX(k.tilt || 0), M4.rotZ(k.roll || 0));
    const pose = { p: k.p, up: M4.dir(M, [0, 1, 0]), fwd: M4.dir(M, [0, 0, 1]), sp: k.sp || [0, 0, 0], nk: k.nk || [0, 0, 0], eyes: k.eyes || 'open', brows: k.brows || 'flat', mouth: k.mouth || 'shut', gaze: k.gaze || 'c', gL: k.gL || 'open', gR: k.gR || 'open', outfit: k.outfit };
    if (k.sit) Object.assign(pose, SIT);
    ['hL', 'hR', 'eL', 'eR', 'hLw', 'hRw', 'eLw', 'eRw', 'wL', 'wR', 'hat', 'hideL', 'hideR', 'noLegs'].forEach(f => { if (k[f] !== undefined) pose[f] = k[f]; });
    return pose;
  }

  function talking(t, on, rate) {
    if (!on) return 'shut';
    const x = (t * (rate || 5.5)) % 1;
    return x < 0.45 ? 'talk' : x < 0.7 ? 'open' : 'shut';
  }

  function blink(t, seed) {
    return ((t + seed * 0.73) % 3.3) < 0.12;
  }

  function vladTalk(t, spans) {
    return spans.some(([a, b]) => t >= a && t < b);
  }

  const ROOM_CAM = look([0.05, 1.27, 2.7], [0.07, 1.16, 1.8], 38);
  const VSKIN = [0.914, 0.919, 0.939];

  function roomBase(t, extra) {
    return Object.assign({ set: 'room', env: ENVS.room, camera: shake(ROOM_CAM, t, 0.0015, 6), treeM: M4.translate(-1.0, 0, 0.75), chairM: M4.translate(0.1, 0, 1.72), gain: [1.06, 1.0, 0.9], grain: 0.035, vignette: 0.22 }, extra || {});
  }

  function vladPose(t, k) {
    const vt = Track.vlad(t);
    const own = vt > 0.12;
    const mouth = k.mouth || (own ? (vt > 0.45 ? 'open' : vt > 0.2 ? 'talk' : 'shut') : talking(t, k.talk, 5.2));
    return body(Object.assign({ p: [0.1, 0.66, 1.78], sit: true, outfit: 'santa', eyes: blink(t, 3) ? 'shut' : (k.eyes || 'open'), mouth, brows: k.brows || 'flat', gL: 'hold', gR: 'hold' }, k, { mouth }));
  }

  function vladHand(side, tip, dir, grip, o) {
    const x = o || {};
    return Hands.solve({ side, tip, dir: V3.norm(dir), grip, roll: x.roll || 0, arm: V3.norm(x.arm || [side === 'L' ? 0.4 : -0.4, -0.25, -0.6]), sleeve: 'none', tint: VSKIN, tattoo: true, big: true, back: x.back });
  }

  const VD = window.StsCast.DIMS.heavy;

  function vladArm(pose, side, wrist, dir, grip, o) {
    const x = o || {};
    const m = window.StsCast.solve('vlad', pose);
    const sh = m.pts['shoulder' + side];
    const pole = x.pole || [side === 'L' ? 0.5 : -0.5, -0.6, -0.3];
    const arm = window.YouVidRig.ik(sh, wrist, VD.upper * 1.05, VD.fore * 1.08, pole);
    const rig = Hands.solve({ side, wrist: arm.end, tip: V3.add(arm.end, V3.mul(V3.norm(dir), 0.12)), dir: V3.norm(dir), grip, roll: x.roll || 0, arm: V3.norm(V3.sub(arm.mid, arm.end)), sleeve: 'none', tint: VSKIN, tattoo: true, big: true, back: x.back });
    rig.elbow = arm.mid;
    rig.shoulder = sh;
    rig.upper = true;
    return rig;
  }

  function withArms(pose, specs) {
    const p = Object.assign({}, pose, { hideL: true, hideR: true });
    return { pose: p, hands: specs.map(s => vladArm(p, s[0], s[1], s[2], s[3], s[4])) };
  }

  function tubAt(c, tilt, yaw) {
    return { kind: 'tub', M: M4.chain(M4.translate(c[0], c[1] - 0.07, c[2]), M4.rotY(yaw || 0), M4.rotX(tilt || 0)), fill: true };
  }

  function shotVlad1(t) {
    if (t >= 142.45 && t < 149.65) {
      const u = t - 142.45;
      const pan = ease((u - 3.0) / 1.2);
      const cam = shake(look([lerp(0.62, 0.5, pan), 0.92, 1.3], [lerp(0.8, 0.55, pan), 0.62, 0.55], 50), t, 0.004, 8);
      const st = roomBase(t, { camera: cam, chair: false });
      const cx = lerp(1.15, 0.35, clamp(u / 7.2, 0, 1));
      st.cat = { M: M4.chain(M4.translate(cx, 0.5 + bump0(cx), 0.6), M4.rotY(-PI / 2 + 0.2)), phase: u * 7.5, look: 0.25 * S(u * 1.3) };
      st.potOnBed = M4.translate(0.22, 0.52, 0.42);
      const eat = u > 4.9 && u < 7.1;
      const base = vladPose(t, { p: [0.35, 0.66, 1.42], yaw: -0.6, nk: [0.05, 0.3, 0], talk: true });
      const spoonW = eat ? [0.52, 0.95 + 0.06 * S(u * 3), 1.2] : [0.55, 0.8, 1.2];
      const A = withArms(base, [['R', spoonW, [-0.3, 0.6, -0.5], 'pinch', { roll: 1.2 }], ['L', [0.18, 0.8, 1.5], [0, -0.3, 1], 'open']]);
      st.cast = [{ who: 'vlad', pose: A.pose, hands: A.hands }];
      st.handProps = eat ? [{ kind: 'spoon', rig: A.hands[0] }] : [];
      return st;
    }
    const st = roomBase(t);
    const lift = ease((t - 135.3) / 0.6);
    const c = [lerp(0.1, 0.12, lift), lerp(1.12, 1.06, lift), lerp(2.24, 2.18, lift)];
    const eat = t >= 149.65;
    const base = vladPose(t, { nk: [eat ? 0.18 : 0.06, 0.04 * S(t * 0.8), 0], talk: vladTalk(t, [[134.3, 142.4], [150.2, 153.1]]) });
    if (eat) {
      const ph = Math.max(0, S((t - 149.65) * 2.6));
      const tub = [0.2, 0.95, 2.12];
      const A = withArms(base, [['L', [tub[0] + 0.13, tub[1] - 0.02, tub[2] - 0.02], [-0.6, 0.1, 0.8], 'hold', { roll: 1.3 }], ['R', [-0.06, 1.0 + 0.16 * ph, 2.18], [0.3, 0.35 + 0.4 * ph, -0.5], 'pinch', { roll: 1.4 }]]);
      st.cast = [{ who: 'vlad', pose: A.pose, hands: A.hands }];
      st.props = [tubAt(tub, 0.1)];
      st.handProps = [{ kind: 'spoon', rig: A.hands[1] }];
      return st;
    }
    const tilt = t < 135.3 ? 0.55 : 0.28;
    const A = withArms(base, [['L', [c[0] + 0.15, c[1] - 0.05, c[2] - 0.02], [-0.55, 0.15, 0.8], 'hold', { roll: 1.4 }], ['R', [c[0] - 0.15, c[1] - 0.05, c[2] - 0.02], [0.55, 0.15, 0.8], 'hold', { roll: 1.4 }]]);
    st.cast = [{ who: 'vlad', pose: A.pose, hands: A.hands }];
    st.props = [tubAt(c, tilt)];
    return st;
  }

  function bump0(x) {
    return 0.05 * Math.exp(-((x - 0.6) * (x - 0.6)) / 0.08) + 0.04 * Math.exp(-((x - 1.05) * (x - 1.05)) / 0.09);
  }

  const JAR_PATH = keyed([
    [205.43, { j: [0.12, 0.98, 2.12] }],
    [207.5, { j: [0.12, 0.98, 2.12] }],
    [209.9, { j: [0.1, 1.0, 2.1] }],
    [210.3, { j: [0.06, 1.2, 2.02] }],
    [210.8, { j: [0.06, 1.2, 2.02] }],
    [211.3, { j: [0.12, 0.98, 2.12] }]
  ]);

  function shotVlad2(t) {
    if (t >= 231.65) {
      const cam = shake(look([0.2, 1.0, 2.5], [0.16, 0.93, 1.9], 40), t, 0.003, 11);
      const st = roomBase(t, { camera: cam });
      const c = [0.1, 0.97 + 0.01 * S(t * 1.7), 2.16];
      const pose = vladPose(t, { nk: [0.3, 0, 0], hideL: true, hideR: true, mouth: 'shut' });
      const left = vladHand('L', [c[0] + 0.11, c[1] + 0.0, c[2] + 0.09], [-0.15, -0.35, 0.9], 'hold', { roll: 0.2, arm: [0.75, -0.3, -0.45], back: [0.85, 0.3, 0.1] });
      const right = vladHand('R', [c[0] - 0.08, c[1] + 0.07, c[2] + 0.02], [0.35, -0.85, 0.25], 'hold', { roll: 0.1, arm: [-0.55, 0.55, 0.2], back: [-0.2, 0.3, 0.9] });
      st.cast = [{ who: 'vlad', pose, hands: [left, right] }];
      st.props = [tubAt(c, 0.12, 0.05)];
      return st;
    }
    const st = roomBase(t);
    const sniff = t >= 209.9 && t < 210.9;
    const spooning = t >= 212.7;
    const reach = (t >= 216.8 && t < 219.4) || (t >= 221.9 && t < 226.8);
    const ph = spooning ? 0.5 + 0.5 * S((t - 212.7) * 1.7) : 0;
    const base = vladPose(t, {
      nk: sniff ? [0.55, 0, 0] : t < 207.5 ? [0.3, -0.1, 0] : [0.12, 0.05 * S(t * 0.7), 0],
      talk: vladTalk(t, [[208.4, 209.9], [211.0, 212.6], [219.5, 221.9], [226.8, 229.2]]),
      eyes: sniff ? 'shut' : 'open'
    });
    if (!spooning) {
      const j = JAR_PATH(t).j;
      const twist = t >= 206.4 && t < 207.6;
      const rW = t < 206.4 ? [-0.02, 1.32, 1.98] : twist ? [j[0] - 0.02, j[1] + 0.16, j[2]] : [-0.2, 0.86, 2.02];
      const A = withArms(base, [['L', [j[0] + 0.05, j[1] - 0.02, j[2] - 0.02], [-0.7, 0.2, 0.6], 'hold', { roll: 1.4 }], ['R', rW, twist ? [0.2, -0.7, 0.5] : [0.3, 0.4, 0.6], twist ? 'cup' : 'open', { roll: twist ? 0.2 : 1.0 }]]);
      st.cast = [{ who: 'vlad', pose: A.pose, hands: A.hands }];
      st.props = [{ kind: 'jar', jarKind: 'pickles', M: M4.translate(j[0], j[1] - 0.06, j[2]), lid: t < 207.4 }];
      return st;
    }
    const tub = [0.22, 0.92, 2.1];
    const rW = reach ? [-0.45, 0.98, 2.15] : [-0.02 + 0.08 * (1 - ph), 0.98 + ph * 0.16, 2.2];
    const A = withArms(base, [['L', [tub[0] + 0.13, tub[1] - 0.02, tub[2] - 0.02], [-0.6, 0.1, 0.8], 'hold', { roll: 1.3 }], ['R', rW, reach ? [-0.9, 0.0, 0.3] : [0.45, 0.3 + ph * 0.3, -0.3], 'pinch', { roll: 1.4 }]]);
    st.cast = [{ who: 'vlad', pose: A.pose, hands: A.hands }];
    st.props = [tubAt(tub, 0.18)];
    st.handProps = reach ? [] : [{ kind: 'spoon', rig: A.hands[1] }];
    if (!reach && t >= 226.8) st.handProps.push({ kind: 'tomato', rig: A.hands[1], hold: 'spoon', local: M4.chain(M4.translate(0, 0.012, -0.172), M4.scale(0.62, 0.62, 0.62)) });
    return st;
  }

  function shotVlad3(t) {
    const cam = shake(look([0.25, 1.05, 2.4], [0.0, 0.98, 1.6], 44), t, 0.003, 13);
    const st = roomBase(t, { camera: cam, chairM: M4.translate(-0.55, 0, 1.3) });
    const away = clamp((t - 292.2) / 0.7, 0, 1);
    const pose = body({ p: [0.5, 0.98, 1.72], outfit: 'santa', yaw: -1.25, sp: [0.12, 0, 0], nk: [0.4, 0, 0], hideR: true, noLegs: true, hLw: [0.55, 0.88, 1.95] });
    const tip0 = V3.add(cam.eye, V3.mul(ray(cam, 0.52, 0.58), 0.3));
    const tip = V3.lerp(tip0, [0.7, 0.86, 1.95], away);
    const hand = vladHand('R', tip, [-0.75, -0.1, 0.25], 'cup', { roll: 2.7, arm: [0.9, -0.25, -0.2] });
    st.cast = [{ who: 'vlad', pose, hands: [hand] }];
    st.handProps = away < 0.6 ? [{ kind: 'half', rig: hand }] : [];
    return st;
  }

  function shotVlad4(t) {
    const st = roomBase(t, { camera: shake(look([-0.02, 1.2, 2.32], [0.06, 1.24, 1.72], 42), t, 0.002, 15) });
    const up = ease((t - 430.6) / 0.9);
    const aside = ease((t - 431.7) / 0.5) * (1 - ease((t - 440.1) / 0.5));
    const base = vladPose(t, { nk: [lerp(0.7, 0.05, up), -0.8 * aside, 0.06 * aside], eyes: aside > 0.5 ? 'open' : 'half', brows: aside > 0.5 ? 'furrow' : 'flat' });
    const A = withArms(base, [['L', [0.3, 0.84, 2.02], [-0.3, -0.2, 0.9], 'open'], ['R', [-0.1, 0.84, 2.02], [0.3, -0.2, 0.9], 'open']]);
    st.cast = [{ who: 'vlad', pose: A.pose, hands: A.hands }];
    return st;
  }

  const STREAM_CAM = look([0.05, 1.18, 1.05], [0.02, 1.0, 0.0], 50);

  function shotStream(t) {
    const raise = t >= 5.0 && t < 7.4;
    const eat = (t * 0.55) % 1;
    const k = raise ? ease((t - 5.0) / 0.5) * (1 - ease((t - 6.9) / 0.5)) : 0;
    const fork = [lerp(-0.1, -0.02, Math.max(0, S(eat * PI * 2))), lerp(0.98, 1.16, Math.max(0, S(eat * PI * 2))) + k * 0.6, lerp(0.38, 0.32, k)];
    const pose = body({ p: [0.0, 0.68, -0.05], sit: true, outfit: 'grey', nk: [0.25 - 0.2 * Math.max(0, S(eat * PI * 2)), 0.05 * S(t), 0], eyes: blink(t, 1) ? 'shut' : 'half', mouth: ((t * 3.1) % 1) < 0.5 ? 'open' : 'talk', hRw: fork, hLw: [0.2, 0.9, 0.35], gR: 'hold', gL: 'hold', noLegs: true });
    return { set: 'stream', env: ENVS.stream, camera: shake(STREAM_CAM, t, 0.002, 2), cast: [{ who: 'streamer', pose, headset: true, held: [{ kind: 'fork', side: 'R', local: M4.chain(M4.rotX(-1.0), M4.translate(0, -0.04, 0)) }] }], props: [{ kind: 'salad', M: M4.translate(0.08, 0.88, 0.34) }], overlay: 'stream', gain: [1.04, 1.02, 0.98], grain: 0.04 };
  }

  function shotBlack() {
    return { set: 'stove', env: ENVS.stove, camera: STOVE_CAM, black: 1, fry: { hide: true }, sauce: { hide: true } };
  }

  const SHOTS = [
    { t: 0, name: 'stream', fn: shotStream },
    { t: 13.433, name: 'black', fn: shotBlack },
    { t: 13.5, name: 'phoneA', fn: shotPhoneA },
    { t: 24.6, name: 'h1', fn: shotH1 },
    { t: 37.967, name: 'h2', fn: shotH2 },
    { t: 46.5, name: 'h3', fn: shotH3 },
    { t: 58.833, name: 'h4', fn: shotH4 },
    { t: 77.133, name: 'h5', fn: shotH5 },
    { t: 83.833, name: 'phoneB', fn: shotPhoneB },
    { t: 89.133, name: 'h6', fn: shotSpoonStove('h6', 'spoon', 'pinch') },
    { t: 96.5, name: 'h7', fn: shotSpoonStove('h7', 'spatula', 'hold') },
    { t: 104.467, name: 'h8', fn: shotSpoonStove('h8', 'fork', 'pinch') },
    { t: 109.1, name: 'h9', fn: shotH9 },
    { t: 120.367, name: 'h10', fn: shotH10 },
    { t: 133.867, name: 'vlad1', fn: shotVlad1 },
    { t: 153.1, name: 'h11', fn: shotPour },
    { t: 178.9, name: 'h12', fn: eatShot('h12', 'spoon') },
    { t: 205.433, name: 'vlad2', fn: shotVlad2 },
    { t: 243.767, name: 'h13', fn: shotJarTable },
    { t: 290.767, name: 'vlad3', fn: shotVlad3 },
    { t: 293.5, name: 'h14', fn: shotHalf },
    { t: 339.433, name: 'phoneC', fn: shotPhoneC },
    { t: 348.833, name: 'board', fn: shotBoard },
    { t: 360.9, name: 'h15', fn: shotStove2 },
    { t: 405.567, name: 'h16', fn: eatShot('h16', 'fork') },
    { t: 430.4, name: 'vlad4', fn: shotVlad4 },
    { t: 441.433, name: 'h17', fn: shotMayo },
    { t: 476.567, name: 'h18', fn: shotSunny },
    { t: 516.033, name: 'micro', fn: shotMicro },
    { t: 523.633, name: 'h19', fn: shotEatSunny }
  ];

  const CUTS = SHOTS.map(s => s.t);

  function shotIndex(t) {
    let i = 0;
    while (i + 1 < SHOTS.length && SHOTS[i + 1].t <= t) i++;
    return i;
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION - 1e-3);
    const i = shotIndex(tt);
    const sh = SHOTS[i];
    const st = sh.fn(tt, tt - sh.t);
    st.t = tt;
    st.shot = sh.name;
    st.index = i;
    st.hands = (st.hands || []).filter(Boolean);
    return st;
  }

  window.SairaScript = { ID, DURATION, CUTS, SHOTS, stage, voice: Track.voice, vlad: Track.vlad, project, onPlane, ray, topCam, look };
})();
