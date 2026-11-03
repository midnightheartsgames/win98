(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;

  const osc = (t, f, a, ph) => a * S(2 * PI * f * t + (ph || 0));
  const env = (sunDir, sunColor, ambTop, ambBottom, extra) => Object.assign({ sunDir, sunColor, ambTop, ambBottom, fogColor: [0, 0, 0], fogNear: 80, fogFar: 160 }, extra || {});
  const hand = (t, f, base, amp, ph) => [base[0] + osc(t, f, amp[0], ph), base[1] + osc(t, f * 0.7, amp[1], ph + 1), base[2] + osc(t, f * 1.3, amp[2], ph + 2)];
  const keys = (list) => K.keys(list);
  const shake = (t, a, seed) => K.wobble(t, a, seed);

  const ENV = {
    drive: env([0.55, -0.6, -0.55], [1.0, 0.9, 0.78], [0.5, 0.56, 0.62], [0.32, 0.28, 0.22]),
    rub: env([0.7, -0.3, -0.4], [0.95, 0.78, 0.6], [0.42, 0.36, 0.3], [0.22, 0.18, 0.14]),
    car: env([-0.8, -0.4, -0.3], [1.0, 0.88, 0.72], [0.45, 0.45, 0.46], [0.24, 0.22, 0.2]),
    office: env([-0.6, -0.5, 0.6], [0.55, 0.45, 0.32], [0.3, 0.26, 0.22], [0.16, 0.13, 0.1], { points: [{ pos: [-1.6, 2.2, -0.4], color: [0.9, 0.7, 0.45] }, { pos: [1.8, 1.6, -2.4], color: [0.7, 0.65, 0.55] }] }),
    ad: env([0.3, -0.5, -0.8], [0.95, 0.85, 0.7], [0.55, 0.48, 0.4], [0.3, 0.24, 0.18]),
    lab: env([0.2, -1, -0.3], [0.45, 0.42, 0.4], [0.62, 0.6, 0.6], [0.42, 0.24, 0.22]),
    house: env([0, -0.3, 1], [0.95, 0.85, 0.6], [0.45, 0.4, 0.34], [0.28, 0.22, 0.16]),
    rv: env([0.8, -0.3, -0.4], [0.75, 0.55, 0.35], [0.22, 0.18, 0.14], [0.12, 0.09, 0.07]),
    rvDark: env([0.9, -0.2, -0.3], [0.5, 0.35, 0.22], [0.1, 0.08, 0.07], [0.05, 0.04, 0.03]),
    warm: env([-0.6, -0.3, -0.7], [0.9, 0.72, 0.55], [0.42, 0.34, 0.28], [0.25, 0.2, 0.16]),
    labCeil: env([0, -0.2, -1], [0.55, 0.55, 0.6], [0.3, 0.3, 0.32], [0.14, 0.13, 0.13]),
    tent: env([0.6, -0.4, -0.6], [0.8, 0.62, 0.42], [0.26, 0.22, 0.18], [0.14, 0.11, 0.09]),
    profile: env([-0.9, -0.1, 0.3], [0.85, 0.75, 0.6], [0.08, 0.08, 0.08], [0.04, 0.04, 0.04]),
    roundRoom: env([0.4, -0.4, 0.8], [0.7, 0.55, 0.38], [0.22, 0.18, 0.14], [0.1, 0.08, 0.06]),
    overcast: env([0.2, -0.8, -0.5], [0.55, 0.52, 0.52], [0.75, 0.72, 0.74], [0.35, 0.32, 0.3]),
    darkWalt: env([-0.7, -0.3, -0.6], [0.5, 0.42, 0.34], [0.12, 0.12, 0.13], [0.06, 0.06, 0.06]),
    window: env([0.6, -0.2, -0.8], [0.7, 0.72, 0.75], [0.6, 0.62, 0.66], [0.3, 0.28, 0.27]),
    knock: env([-0.65, -0.3, -0.7], [1.05, 0.86, 0.68], [0.3, 0.27, 0.24], [0.14, 0.12, 0.1]),
    leather: env([0.6, -0.5, -0.4], [0.75, 0.5, 0.3], [0.18, 0.12, 0.08], [0.06, 0.04, 0.03]),
    blinds: env([0, -0.3, 1], [0.4, 0.4, 0.42], [0.35, 0.35, 0.37], [0.18, 0.18, 0.2]),
    gun: env([0.3, -0.4, -0.8], [0.6, 0.55, 0.48], [0.38, 0.35, 0.3], [0.2, 0.18, 0.15]),
    cards: env([0.4, -0.7, 0.6], [1.0, 0.95, 0.85], [0.6, 0.58, 0.56], [0.35, 0.3, 0.28]),
    hospital: env([0.4, -0.6, -0.6], [0.7, 0.7, 0.66], [0.5, 0.5, 0.48], [0.3, 0.3, 0.28]),
    desert: env([-0.4, -0.65, -0.65], [1.0, 0.86, 0.66], [0.45, 0.5, 0.58], [0.42, 0.32, 0.22]),
    kitchen: env([-0.5, -0.4, -0.7], [0.7, 0.6, 0.45], [0.32, 0.3, 0.28], [0.16, 0.14, 0.12]),
    lowSky: env([0.35, 0.15, -0.9], [1.15, 0.84, 0.6], [0.3, 0.33, 0.42], [0.36, 0.26, 0.2]),
    blueSky: env([-0.5, -0.5, -0.7], [1.0, 0.9, 0.75], [0.4, 0.45, 0.6], [0.35, 0.3, 0.25]),
    night: env([0.75, -0.25, -0.6], [0.55, 0.62, 0.95], [0.1, 0.12, 0.22], [0.05, 0.06, 0.12]),
    sweater: env([-0.5, -0.3, -0.8], [0.65, 0.6, 0.52], [0.2, 0.2, 0.2], [0.1, 0.1, 0.1]),
    sand: env([0.5, -0.5, -0.7], [1.0, 0.82, 0.6], [0.45, 0.4, 0.34], [0.35, 0.26, 0.18]),
    books: env([-0.5, -0.4, -0.7], [0.75, 0.7, 0.62], [0.4, 0.38, 0.36], [0.2, 0.18, 0.16]),
    fence: env([0.3, -0.7, -0.6], [1.0, 0.95, 0.85], [0.55, 0.58, 0.62], [0.4, 0.36, 0.3]),
    trees: env([-0.45, -0.75, -0.5], [1.15, 1.0, 0.8], [0.34, 0.36, 0.34], [0.24, 0.22, 0.18]),
    hankWall: env([0.55, -0.45, -0.7], [1.1, 0.88, 0.66], [0.3, 0.26, 0.22], [0.18, 0.14, 0.11]),
    basket: env([0, -0.6, -0.8], [0.3, 0.42, 0.75], [0.12, 0.16, 0.3], [0.05, 0.06, 0.12]),
    hall: env([-0.4, -0.4, -0.8], [0.55, 0.46, 0.36], [0.14, 0.12, 0.1], [0.06, 0.05, 0.04]),
    bar: env([0, -0.4, -0.9], [0.9, 0.4, 0.3], [0.25, 0.1, 0.08], [0.1, 0.04, 0.03]),
    yellow: env([0.5, -0.3, -0.8], [0.8, 0.7, 0.25], [0.18, 0.15, 0.05], [0.06, 0.05, 0.02]),
    blueRoom: env([0.5, -0.4, -0.7], [0.3, 0.36, 0.55], [0.12, 0.14, 0.22], [0.05, 0.06, 0.1]),
    white: env([0.3, -0.4, -0.85], [0.75, 0.72, 0.7], [0.62, 0.62, 0.64], [0.4, 0.4, 0.42]),
    eladio: env([-0.5, -0.5, -0.7], [1.0, 0.9, 0.75], [0.45, 0.45, 0.45], [0.3, 0.26, 0.2]),
    granite: env([0.2, -1, -0.3], [0.7, 0.66, 0.55], [0.4, 0.4, 0.4], [0.2, 0.2, 0.2]),
    mikeCar: env([-0.8, -0.3, 0.4], [0.9, 0.85, 0.75], [0.35, 0.33, 0.33], [0.2, 0.12, 0.1]),
    gus: env([0.5, -0.3, -0.8], [0.75, 0.6, 0.45], [0.28, 0.22, 0.18], [0.14, 0.1, 0.08]),
    warehouse: env([0.3, -0.6, -0.6], [0.55, 0.55, 0.6], [0.28, 0.28, 0.3], [0.12, 0.12, 0.13]),
    aztek: env([0.5, -0.7, -0.5], [1.0, 0.95, 0.85], [0.6, 0.65, 0.75], [0.35, 0.33, 0.3]),
    garlic: env([0.3, -0.8, -0.4], [0.9, 0.8, 0.6], [0.5, 0.45, 0.4], [0.25, 0.2, 0.15]),
    oldMan: env([0.5, -0.4, -0.7], [0.7, 0.7, 0.68], [0.5, 0.5, 0.5], [0.3, 0.3, 0.3])
  };

  const G = {
    teal: [0.95, 1.0, 1.04, 0.06],
    warm: [1.03, 1.0, 0.94, 0.05],
    mexico: [1.08, 1.01, 0.82, 0.08],
    cold: [0.92, 0.98, 1.08, 0.1]
  };

  function lookAt(eye, at, fov, roll) {
    return { eye, at, fov: fov || 32, roll: roll || 0 };
  }

  function frame(head, o, t) {
    const fov = o.fov || 32;
    const tv = Math.tan(fov * PI / 360), th = tv * 16 / 9;
    const d = 0.24 / (o.f * 2 * tv);
    const el = o.el || 0, az = o.az || 0;
    const dir = [S(az) * C(el), S(el), C(az) * C(el)];
    const eye = V3.add(head, V3.mul(dir, d));
    const fwd = V3.mul(dir, -1);
    const right = V3.norm(V3.cross(fwd, [0, 1, 0]));
    const up = V3.cross(right, fwd);
    const nx = (o.x === undefined ? 0.5 : o.x) * 2 - 1, ny = 1 - (o.y === undefined ? 0.5 : o.y) * 2;
    const at = V3.add(head, V3.add(V3.mul(right, -nx * d * th), V3.mul(up, -ny * d * tv)));
    const cam = { eye, at, fov, roll: o.roll || 0 };
    return o.shake && t !== undefined ? handheld(cam, t, o.shake, o.seed) : cam;
  }

  function handheld(cam, t, a, seed) {
    const w = shake(t, a, seed || 0);
    return Object.assign({}, cam, { eye: V3.add(cam.eye, [w[0], w[1], w[2] * 0.5]), at: V3.add(cam.at, [w[0] * 0.6, w[1] * 0.6, 0]) });
  }

  const SHOTS = {
    drive: {
      set: 'drive', env: ENV.drive, grade: G.warm, crop: { L: [0.33, 0.5] },
      cam: (t, H) => frame(H[0], { x: 0.31, y: 0.19, f: 0.33, az: 0.0, el: 0.02, fov: 34, shake: 0.006, seed: 1 }, t),
      actors: (t) => [
        { look: 'hankPolo', pose: { pos: [0, 1.0, 0], yaw: 0.42 + osc(t, 0.13, 0.12), nk: [0.06 + osc(t, 0.5, 0.05), -0.05 + osc(t, 0.21, 0.25), osc(t, 0.3, 0.05)], sp: [0.05, osc(t, 0.4, 0.06), 0], hL: hand(t, 0.9, [0.22, 0.0, 0.32], [0.12, 0.08, 0.06], 0), hR: hand(t, 0.8, [-0.18, 0.02, 0.36], [0.1, 0.1, 0.06], 1.5), gL: 'open', gR: 'flat', eL: [0.6, -0.3, -0.4], eR: [-0.6, -0.3, -0.4] } },
        { look: 'waltDrive', pose: { pos: [0.5, 1.0, 0.6], yaw: PI + 0.75, nk: [0.05, osc(t, 0.2, 0.06), 0], hL: [0.25, -0.3, 0.05], hR: [-0.25, -0.3, 0.08] } }
      ]
    },
    rub: {
      set: 'rub', env: ENV.rub, grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.5, y: 0.52, f: 1.25, az: 0.72, el: -0.2, fov: 34 }),
      actors: (t) => [
        { look: 'waltRub', pose: { pos: [0, 1.0, 0], yaw: 0, nk: [0.12, 0.2 + osc(t, 0.3, 0.05), 0], hLw: [0.062 + osc(t, 1.4, 0.008), 1.585 + osc(t, 1.1, 0.018), 0.118], eLw: [0.3, 1.3, 0.2], gL: 'claw', wL: [0.2, -1.3, 0.2], ringL: true, hR: [-0.25, -0.3, 0.06] } }
      ]
    },
    carPhone: {
      set: 'car', env: ENV.car, grade: G.warm,
      cam: (t) => handheld(lookAt([-1.75, 1.36, 1.75], [0.06, 1.24, 0.0], 10), t, 0.003, 2),
      actors: (t) => [
        { look: 'gomez', pose: { pos: [-0.38, 0.55, -0.05], yaw: 0, nk: [0.0, 1.0, 0], noLegs: true, hLw: [-0.3, 1.2, 0.08], gL: 'pinch', hR: [-0.2, -0.25, 0.2] }, prop: 'phone' },
        { look: 'hankCamo', pose: { pos: [0.38, 0.55, -0.05], yaw: -0.2, nk: [-0.18, -0.75 + osc(t, 0.6, 0.06), 0.08], noLegs: true, sp: [-0.08, -0.2, 0], hL: [0.25, -0.2, 0.2], hR: [-0.2, -0.2, 0.25], smile: 1 } }
      ]
    },
    carLaugh: {
      set: 'car', env: ENV.car, grade: G.warm,
      cam: (t) => handheld(lookAt([-1.7, 1.34, 1.85], [0.1, 1.22, -0.02], 10), t, 0.004, 3),
      actors: (t) => [
        { look: 'gomez', pose: { pos: [-0.38, 0.55, -0.05], yaw: 0, nk: [0.05, 0.95, 0], noLegs: true, hL: [0.2, -0.25, 0.25], hR: [-0.2, -0.25, 0.2] } },
        { look: 'hankCamo', pose: { pos: [0.38, 0.55, -0.05], yaw: -0.25, nk: [-0.32 + osc(t, 2.2, 0.06), -0.7, 0.1], noLegs: true, sp: [-0.15, -0.2, 0], hL: [0.25, -0.2, 0.2], hR: [-0.2, -0.2, 0.25], smile: 1 } }
      ]
    },
    hankCar: {
      set: 'car', env: env([0.9, -0.3, -0.5], [1.05, 0.88, 0.66], [0.3, 0.3, 0.32], [0.16, 0.14, 0.12]), grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.52, y: 0.45, f: 0.72, az: -0.75, el: 0.02, fov: 34 }),
      actors: (t) => [
        { look: 'hankCamo', pose: { pos: [0.38, 0.55, -0.05], yaw: -0.2, nk: [0.06, 0.05, 0], noLegs: true, hL: [0.25, -0.2, 0.2], hR: [-0.2, -0.2, 0.25] } }
      ]
    },
    saulOffice: {
      set: 'saulOffice', env: ENV.office, grade: G.warm,
      cam: (t, H) => frame([0.22, 1.6, -0.4], { x: 0.44, y: 0.18, f: 0.2, az: 0.0, el: 0.06, fov: 40 }),
      actors: (t) => {
        const beat = t * 1.97;
        const up = S(beat * PI) > 0;
        return [{ look: 'saulSuit', pose: { pos: [0.22, 1.0 + Math.abs(osc(t, 0.98, 0.03)), -0.4], yaw: 0.15 + osc(t, 0.49, 0.25), lean: osc(t, 0.98, 0.06), roll: osc(t, 0.49, 0.08), nk: [0.05, osc(t, 0.49, 0.25), osc(t, 0.98, 0.12)], sp: [0, osc(t, 0.49, 0.15), osc(t, 0.98, 0.1)],
          hR: up ? [-0.1, 0.25 + osc(t, 1.97, 0.04), 0.3] : [-0.28, -0.05, 0.25], hL: up ? [0.3, -0.18, 0.2] : [0.15, 0.22, 0.32], gR: 'open', gL: 'open', eR: [-0.6, -0.3, -0.3], eL: [0.6, -0.3, -0.3], fL: [0.14, -0.86, 0.04 + osc(t, 0.98, 0.05)], fR: [-0.14, -0.86, 0.04 - osc(t, 0.98, 0.05)] } }];
      }
    },
    saulAd: {
      set: 'saulAd', env: ENV.ad, grade: G.warm,
      cam: (t, H) => frame([0, 1.6, 0.04], { x: 0.42, y: 0.3, f: 0.3, az: 0.05, el: 0.0, fov: 34 }),
      actors: (t) => [{ look: 'saulAd', pose: { pos: [0, 1.0, 0], yaw: 0.05, nk: [0.02, osc(t, 0.4, 0.1), osc(t, 0.6, 0.05)], hL: [0.24 + osc(t, 1.97, 0.03), -0.2, 0.3], hR: [-0.24, -0.22 + osc(t, 1.97, 0.03), 0.28], gL: 'open', gR: 'open', eL: [0.7, -0.5, -0.2], eR: [-0.7, -0.5, -0.2], smile: 1 } }]
    },
    labWide: {
      set: 'lab', env: ENV.lab, grade: G.teal,
      cam: (t, H) => lookAt([-2.6, 2.6, 3.6], [0.4, 0.9, -0.6], 50),
      actors: (t) => [{ look: 'jesseLab', pose: { pos: [0.55, 1.0, -0.15 + (t - 21.03) * 0.12], yaw: -2.6, nk: [-0.2, 0.3, 0], fL: [0.14, -0.86, 0.12], fR: [-0.14, -0.86, -0.1], hL: [0.3, -0.25, 0.05], hR: [-0.3, -0.25, 0.05] } }]
    },
    lab: {
      set: 'lab', env: ENV.lab, grade: G.teal,
      cam: (t, H) => frame([-0.12, 1.6, -0.05], { x: 0.46, y: 0.42, f: 0.14, az: 0.45, el: 0.85, fov: 40 }),
      actors: (t) => [{ look: 'jesseLab', pose: { pos: [-0.12, 1.0, -0.05], yaw: -2.15, nk: [-0.55 + osc(t, 0.3, 0.06), osc(t, 0.25, 0.2), 0], hLw: [-0.42 + osc(t, 0.7, 0.02), 1.45 + osc(t, 0.5, 0.05), -0.32], hRw: [-0.36, 1.18 + osc(t, 0.6, 0.04), -0.2], gL: 'flat', gR: 'flat' } }]
    },
    jesseHouse: {
      set: 'house', env: ENV.house, grade: G.warm,
      cam: (t) => lookAt([0.4, 1.25, 3.1], [0.0, 1.1, -1.5], 48),
      actors: (t) => [
        { look: 'pete', pose: { pos: [-1.75, 0.58, -0.55], yaw: 0.6, lean: -0.15, nk: [0, 0.3, 0], fL: [0.14, -0.5, 0.45], fR: [-0.14, -0.5, 0.45], hL: [0.2, -0.25, 0.25], hR: [-0.2, -0.25, 0.25] } },
        { look: 'badger', pose: { pos: [-0.15 + (t - 24.83) * 0.5, 1.0, -1.7], yaw: 0.8, nk: [0.15, -0.2, 0], fL: [0.14, -0.8, 0.2], fR: [-0.14, -0.86, -0.15], hL: [0.3, -0.2, -0.05], hR: [-0.3, -0.25, 0.15] } },
        { look: 'jesseHouse', pose: { pos: [1.4, 0.72, 0.85], yaw: PI - 0.3, lean: -0.2, nk: [0, -0.3, 0], fL: [0.14, -0.4, 0.5], fR: [-0.14, -0.4, 0.5], hL: [0.25, -0.2, 0.2], hR: [-0.25, -0.2, 0.2] } }
      ]
    },
    jesseRV: {
      set: 'rv', env: ENV.rv, grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.3, y: 0.4, f: 0.45, az: 0.25, el: 0.0, fov: 34 }),
      actors: (t) => [
        { look: 'jesseHood', pose: { pos: [-0.42, 1.0, 0.3], yaw: 0.9, nk: [-0.1, 0.1, 0], hL: [0.25, -0.25, 0.15], hR: [-0.25, -0.25, 0.15] } },
        { look: 'waltNavy', pose: { pos: [0.5, 1.0, -1.4], yaw: -0.6, nk: [0.1, -0.1, 0], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }
      ]
    },
    jesseDark: {
      set: 'rv', env: ENV.rvDark, grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.42, y: 0.3, f: 0.5, az: 0.0, el: 0.0, fov: 34 }),
      actors: (t) => [{ look: 'jesseHood', pose: { pos: [-0.15, 1.0, 0.1], yaw: -1.1, nk: [0.05, -0.2, 0], hL: [0.25, -0.25, 0.15], hR: [-0.25, -0.25, 0.15] } }]
    },
    jesseClose: {
      set: 'warm', env: ENV.warm, grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.62, y: 0.45, f: 0.9, az: 0.45, el: -0.05, fov: 32 }),
      actors: (t) => [
        { look: 'jesseHood', pose: { pos: [0, 1.0, 0], yaw: 0, nk: [0.04, 0.05 + osc(t, 0.8, 0.06), osc(t, 0.5, 0.05)], hL: [0.25, -0.25, 0.1], hR: [-0.25, -0.25, 0.1] } },
        { look: 'waltDark', sing: false, pose: { pos: [-0.12, 0.98, 0.42], yaw: 2.6, nk: [0.1, 0.2, 0], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }
      ]
    },
    jessePoint: {
      set: 'labCeiling', env: ENV.labCeil, grade: G.teal,
      cam: (t, H) => frame(H[0], { x: 0.5, y: 0.24, f: 0.32, az: 0.0, el: -0.1, fov: 36 }),
      actors: (t) => [{ look: 'jesseJacket', pose: { pos: [0, 1.0, 0], yaw: 0.05, lean: 0.12, nk: [-0.45, 0.05 + osc(t, 0.7, 0.08), 0], hR: [-0.3, 0.3 + osc(t, 1.97, 0.04), 0.34], gR: 'point', eR: [-0.8, -0.5, -0.1], hL: [0.25, -0.25, 0.1] } }]
    },
    waltApron: {
      set: 'tent', env: ENV.tent, grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.3, y: 0.2, f: 0.2, az: 0.5, el: 0.05, fov: 36 }),
      actors: (t) => [
        { look: 'waltApron', pose: { pos: [-0.35, 1.0, -0.3], yaw: 0.6, nk: [0.25, 0.2, 0], hL: [0.25, -0.15, 0.35], hR: [-0.15, -0.15, 0.38], gL: 'grip', gR: 'grip' } },
        { look: 'jesseHood', pose: { pos: [0.75, 1.0, 0.6], yaw: PI - 0.4, nk: [0, 0, 0], hL: [0.25, -0.3, 0.1], hR: [-0.25, -0.3, 0.1] } }
      ]
    },
    jesseProfile: {
      set: 'profile', env: env([-0.9, -0.1, 0.4], [0.95, 0.85, 0.7], [0.12, 0.12, 0.12], [0.05, 0.05, 0.05]), grade: G.teal,
      cam: (t, H) => frame(H[0], { x: 0.27, y: 0.34, f: 0.55, az: 0.45, el: 0.0, fov: 34 }),
      actors: (t) => [{ look: 'jesseHood', pose: { pos: [0, 1.0, 0], yaw: 1.45, nk: [-0.08, 0.05, 0], hL: [0.25, -0.25, 0.1], hR: [-0.25, -0.25, 0.1] } }]
    },
    roundRoom: {
      set: 'roundRoom', env: ENV.roundRoom, grade: G.warm,
      cam: (t, H) => frame(H[1], { x: 0.5, y: 0.38, f: 0.3, az: -0.3, el: 0.02, fov: 36 }),
      actors: (t) => [
        { look: 'waltDark', pose: { pos: [-0.5, 1.0, 0.35], yaw: 1.2, nk: [0.05, 0.1, 0], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } },
        { look: 'jesseGreen', pose: { pos: [0.18, 1.0, 0.1], yaw: -1.0, nk: [-0.05, -0.2, 0], hL: [0.25, -0.25, 0.15], hR: [-0.25, -0.25, 0.15] } },
        { look: 'saulSuit', pose: { pos: [1.0, 1.0, -0.9], yaw: -0.6, nk: [0.05, 0, 0], hL: [0.2, -0.2, 0.25], hR: [-0.2, -0.2, 0.25] } }
      ]
    },
    jesseJump: {
      set: 'junk', env: ENV.overcast, grade: G.cold,
      cam: (t, H) => frame([0, 1.78, 0.05], { x: 0.53, y: 0.32, f: 0.26, az: 0.1, el: -0.22, fov: 40 }),
      actors: (t) => {
        const k = clamp((t - 32.6) / 0.9, 0, 1);
        const lift = S(k * PI) * 0.35;
        return [{ look: 'jesseJump', pose: { pos: [0, 1.0 + lift, 0], yaw: 0.15, nk: [-0.25, 0, osc(t, 2, 0.06)], hL: [0.24, 0.62 - 0.2 * (1 - k), 0.0], hR: [-0.26, 0.62, 0.0], gL: 'fist', gR: 'fist', eL: [0.9, 0.2, -0.2], eR: [-0.9, 0.2, -0.2], fL: [0.16, -0.7 + lift * 0.4, 0.15], fR: [-0.14, -0.8 + lift * 0.3, -0.1] } }];
      }
    },
    waltDark: {
      set: 'dark', env: ENV.darkWalt, grade: G.teal,
      cam: (t, H) => frame(H[0], { x: 0.5, y: 0.45, f: 0.75, az: -0.5, el: 0.0, fov: 32 }),
      actors: (t) => [{ look: 'waltDark', pose: { pos: [0, 1.0, 0], yaw: 0, nk: [0.08, -0.45, 0.04], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }]
    },
    jesseBruise: {
      set: 'window', env: ENV.window, grade: G.cold,
      cam: (t, H) => frame(H[0], { x: 0.5, y: 0.42, f: 0.8, az: 0.45, el: 0.0, fov: 32 }),
      actors: (t) => [{ look: 'jesseBruise', pose: { pos: [0, 1.0, 0], yaw: 0, nk: [-0.25, -0.2, -0.05], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }]
    },
    knock: {
      set: 'bedroom', env: ENV.knock, grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.42, y: 0.47, f: 0.92, az: -0.18, el: -0.04, fov: 32 }),
      actors: (t) => [{ look: 'waltKnock', pose: { pos: [0.02, 1.0, 0], yaw: 0.1, lean: 0.12, nk: [0.12 + osc(t, 0.3, 0.04), -0.08 + osc(t, 0.22, 0.08), osc(t, 0.4, 0.04)], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }]
    },
    hand: {
      set: 'leather', env: ENV.leather, grade: G.warm,
      cam: (t, H) => lookAt([0.22, 0.32, 0.3], [0.04, 0.12, 0.02], 38),
      arms: (t) => [{ look: 'hankCamo', side: 'R', elbow: [0.42 + osc(t, 0.7, 0.05), 0.22, 0.28], wrist: [0.12 + osc(t, 0.7, 0.06), 0.15, 0.08], grip: 'flat', front: [0.2, 0.0, 1] }]
    },
    blinds: {
      set: 'blinds', env: ENV.blinds, grade: G.cold,
      cam: (t) => lookAt([0.05, 0.1, 1.55], [0.05, 0.08, 0], 34),
      actors: (t) => [{ look: 'lady', pose: { pos: [0.38, -0.5, -0.5], yaw: 0.2, nk: [0, 0.1, 0], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }]
    },
    gun: {
      set: 'gunRoom', env: ENV.gun, grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.42, y: 0.25, f: 0.3, az: 0.03, el: 0.02, fov: 36 }),
      actors: (t) => [{ look: 'waltGun', pose: { pos: [0, 1.0, -1.5], yaw: 0, nk: [0.02, 0, 0], hRw: [-0.04 + osc(t, 0.4, 0.01), 1.38, -0.85], eRw: [-0.17, 0.7, -1.15], gR: 'gun', hLw: [0.0, 1.32, -0.92], gL: 'grip' }, prop: 'bigGun' }]
    },
    cards: {
      set: 'cards', env: ENV.cards, grade: G.warm,
      cam: (t, H) => lookAt([0.08, 1.35, 0.6], [0.0, 0.76, -0.05], 38),
      arms: (t) => [
        { look: 'hankBed', side: 'R', upper: [-0.55, 1.05, -0.6], elbow: [-0.35, 0.8, -0.35], wrist: [-0.12 + osc(t, 0.6, 0.02), 0.8, -0.12], grip: 'pinch', front: [0, 0, 1] },
        { look: 'hankBed', side: 'L', upper: [-0.1, 1.05, -0.75], elbow: [0.0, 0.82, -0.45], wrist: [0.05, 0.79, -0.25], grip: 'relax', front: [-1, 0, 0] },
        { look: 'marie', side: 'R', upper: [0.7, 1.0, 0.0], elbow: [0.45, 0.8, 0.05], wrist: [0.22 + osc(t, 0.5, 0.02), 0.79, -0.02], grip: 'relax', front: [0, 0, -1], ring: true }
      ]
    },
    hankBed: {
      set: 'hospital', env: ENV.hospital, grade: G.cold,
      cam: (t, H) => frame(H[0], { x: 0.55, y: 0.25, f: 0.34, az: 0.15, el: 0.08, fov: 38 }),
      actors: (t) => [{ look: 'hankBed', pose: { pos: [0, 0.78, -0.45], yaw: 0, lean: -0.25, nk: [0.3, 0.2, 0], fL: [0.14, -0.1, 0.8], fR: [-0.14, -0.1, 0.8], hRw: [-0.05 + osc(t, 0.5, 0.05), 0.98, 0.55], gR: 'open', hL: [0.25, -0.25, 0.15] } }]
    },
    sayName: {
      set: 'desert', env: ENV.desert, grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.55, y: 0.28, f: 0.55, az: 0.2, el: 0.02, fov: 32 }),
      actors: (t) => [{ look: 'waltDesert', pose: { pos: [0, 1.0, 0], yaw: -0.15, nk: [0.06 + osc(t, 0.4, 0.03), -0.12 + osc(t, 0.25, 0.05), 0.04], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }]
    },
    jesseCam: {
      set: 'kitchen', env: ENV.kitchen, grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.62, y: 0.38, f: 0.32, az: -0.45, el: 0.08, fov: 38 }),
      actors: (t) => [{ look: 'jesseCam', pose: { pos: [0.25, 0.56, -0.42], yaw: -0.2, lean: 0.2, nk: [-0.25, 0.3, 0], fL: [0.14, -0.5, 0.4], fR: [-0.14, -0.5, 0.4], hL: [0.18, -0.12, 0.38], hR: [-0.2, -0.1, 0.4], gR: 'point' } }]
    },
    waltLow: {
      set: 'sky', env: ENV.lowSky, grade: G.warm, setOpt: { tex: 'skyGrey' },
      cam: (t, H) => frame(H[0], { x: 0.55, y: 0.32, f: 1.0, az: 0.05, el: -0.38, fov: 34 }),
      actors: (t) => [{ look: 'waltDesert', pose: { pos: [0, 1.0, 0], yaw: 0, nk: [0.12 + osc(t, 0.3, 0.03), 0.12 + osc(t, 0.2, 0.06), 0], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }]
    },
    waltSky: {
      set: 'sky', env: ENV.blueSky, grade: G.warm, setOpt: { tex: 'skyBlue' }, crop: { L: [0.5, 0.5] },
      cam: (t, H) => frame(H[0], { x: 0.5, y: 0.38, f: 0.52, az: 0.5, el: 0.02, fov: 32 }),
      actors: (t) => [{ look: 'waltSky', pose: { pos: [0, 1.0, 0], yaw: 0.1, nk: [-0.05 + osc(t, 0.3, 0.03), 0.05 + osc(t, 0.2, 0.08), 0], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }]
    },
    hankNight: {
      set: 'night', env: ENV.night, grade: G.cold,
      cam: (t, H) => frame(H[0], { x: 0.6, y: 0.32, f: 0.5, az: 0.6, el: 0.02, fov: 34 }),
      actors: (t) => [{ look: 'hankNight', pose: { pos: [0, 0.56, 0], yaw: -0.2, nk: [0.1, 0.55, 0], noLegs: true, hL: [0.25, -0.2, 0.2], hR: [-0.25, -0.2, 0.2] } }]
    },
    waltSweater: {
      set: 'dark', env: ENV.sweater, grade: G.teal,
      cam: (t, H) => frame(H[0], { x: 0.5, y: 0.4, f: 0.7, az: 0.0, el: 0.02, fov: 32 }),
      actors: (t) => [{ look: 'waltSweater', pose: { pos: [0, 1.0, 0], yaw: 0, nk: [0.12, 0.05 + osc(t, 0.3, 0.05), 0], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }]
    },
    hankSand: {
      set: 'sand', env: ENV.sand, grade: G.mexico,
      cam: (t, H) => frame(H[0], { x: 0.525, y: 0.42, f: 0.85, az: 0.5, el: 0.1, fov: 32 }),
      actors: (t) => [{ look: 'hankWall', pose: { pos: [0, 1.0, 0], yaw: 0, nk: [0.05, 0.25 + osc(t, 0.4, 0.05), 0], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }]
    },
    hankBooks: {
      set: 'books', env: ENV.books, grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.52, y: 0.42, f: 0.78, az: 1.2, el: -0.05, fov: 32 }),
      actors: (t) => [{ look: 'hankTie', pose: { pos: [0, 1.0, 0], yaw: 0.1, lean: -0.2, nk: [-0.3, 0.42, 0.05], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }]
    },
    waltWhite: {
      set: 'fence', env: ENV.fence, grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.47, y: 0.2, f: 0.25, az: 0.0, el: 0.0, fov: 34 }),
      actors: (t) => [{ look: 'waltWhite', pose: { pos: [0, 1.0, 0], yaw: 0.15, nk: [0.05, 0.25, 0], hLw: [0.55, 1.42 + osc(t, 1.97, 0.04), 0.25], eLw: [0.5, 1.0, -0.2], gL: 'point', hR: [-0.25, -0.3, 0.06] } }]
    },
    waltTrees: {
      set: 'trees', env: ENV.trees, grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.5, y: 0.36, f: 0.75, az: -0.15, el: 0.02, fov: 32 }),
      actors: (t) => [{ look: 'waltTan', pose: { pos: [0, 1.0, 0], yaw: 0.05, nk: [0.1, 0.18 + osc(t, 0.4, 0.05), 0], smile: 1, hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }]
    },
    waltTurn: {
      set: 'trees', env: ENV.trees, grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.45, y: 0.36, f: 0.75, az: -1.85, el: 0.05, fov: 32 }),
      actors: (t) => [{ look: 'waltTan', pose: { pos: [0, 1.0, 0], yaw: 0.6, nk: [0.12, 0.75, 0.05], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }]
    },
    hankWall: {
      set: 'brown', env: ENV.hankWall, grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.5, y: 0.42, f: 0.85, az: 0.3, el: 0.04, fov: 32 }),
      actors: (t) => [{ look: 'hankWall', pose: { pos: [0, 1.0, 0], yaw: 0, nk: [0.12, -0.15 + osc(t, 0.5, 0.04), 0.06], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }]
    },
    basket: {
      set: 'basket', env: ENV.basket, grade: G.cold,
      cam: (t) => lookAt([0.05, 0.42, 0.62], [0.0, 0.16, -0.1], 34),
      actors: () => []
    },
    waltHall: {
      set: 'hall', env: ENV.hall, grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.52, y: 0.32, f: 0.32, az: -0.4, el: 0.05, fov: 36 }),
      actors: (t) => [{ look: 'waltTan', pose: { pos: [-0.2, 1.0, -0.3], yaw: 0.5, nk: [0.1, 0.1, 0], hL: [0.18, 0.05 + osc(t, 1.5, 0.05), 0.32], hR: [-0.15, 0.02, 0.34], gL: 'claw', gR: 'claw' } }]
    },
    bar: {
      set: 'bar', env: ENV.bar, grade: G.warm,
      cam: (t) => lookAt([0.0, 1.5, 2.2], [0.1, 1.4, -1.0], 36),
      actors: (t) => [{ look: 'waltTan', pose: { pos: [0.2, 1.0, -1.0], yaw: -0.3, nk: [0, 0.2, 0], hRw: [-0.1, 1.42, -0.55], gR: 'gun', hL: [0.25, -0.3, 0.06] }, prop: 'gun' }]
    },
    yellow: {
      set: 'yellow', env: ENV.yellow, grade: G.mexico,
      cam: (t) => lookAt([0.0, 1.6, 0.85], [0.0, 1.57, 0], 34),
      actors: (t) => [
        { look: 'waltDark', pose: { pos: [-0.22, 1.0, 0], yaw: 1.1, nk: [0.1, 0.1, 0], hRw: [-0.05, 1.62, 0.12], gR: 'point', hL: [0.25, -0.3, 0.06] } },
        { look: 'jesseHood', pose: { pos: [0.25, 1.0, -0.05], yaw: -1.2, nk: [0.05, -0.2, 0], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }
      ]
    },
    blueRoom: {
      set: 'blueRoom', env: ENV.blueRoom, grade: G.cold,
      cam: (t) => lookAt([0.0, 1.62, 1.7], [0.0, 1.05, -1.0], 40),
      actors: (t) => [
        { look: 'mikeDark', pose: { pos: [-0.62, 1.0, 0.5], yaw: PI - 0.3, nk: [0.25, 0.1, 0], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } },
        { look: 'waltTan', pose: { pos: [0.7, 1.0, 0.3], yaw: PI + 0.5, nk: [0.3, -0.1, 0], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } },
        { look: 'jesseHood', pose: { pos: [0, 0.75, -1.25], yaw: 0, lean: -0.25, nk: [0.1, 0, 0], fL: [0.14, -0.35, 0.5], fR: [-0.14, -0.35, 0.5], hL: [0.25, -0.2, 0.2], hR: [-0.25, -0.2, 0.2] } }
      ]
    },
    doctor: {
      set: 'white', env: ENV.white, grade: G.cold, crop: { T3L: [0.45, 0.5] },
      cam: (t, H) => frame(H[0], { x: 0.42, y: 0.22, f: 0.33, az: -0.2, el: 0.02, fov: 34 }),
      actors: (t) => {
        const think = Math.floor(t / 1.95) % 2 === 0;
        return [{ look: 'doctor', pose: { pos: [0, 1.0, 0], yaw: 0.12, nk: [0.04, 0.25 + osc(t, 0.5, 0.15), 0.06], hRw: think ? [0.0, 1.43, 0.13] : [-0.18, 1.25, 0.2], eRw: [-0.25, 1.15, 0.1], gR: think ? 'claw' : 'open', hL: [0.25, -0.3, 0.06] } }];
      }
    },
    eladio: {
      set: 'terrace', env: ENV.eladio, grade: G.warm,
      cam: (t, H) => frame(H[0], { x: 0.5, y: 0.3, f: 0.28, az: 0.3, el: 0.06, fov: 34 }),
      actors: (t) => [{ look: 'eladio', pose: { pos: [0, 1.0, 0], yaw: 0.2, lean: osc(t, 1.97, 0.04), nk: [0.3 + osc(t, 3.9, 0.05), -0.2, 0.05], hRw: [-0.02, 1.3 + osc(t, 0.5, 0.03), 0.3], gR: 'grip', hLw: [0.14, 1.36, 0.3], gL: 'open', smile: 1 }, prop: 'bottle' }]
    },
    granite: {
      set: 'granite', env: ENV.granite, grade: G.warm,
      cam: (t, H) => lookAt([0.0, 0.9, 0.2], [0.0, 0.0, 0.0], 40),
      arms: (t) => [{ look: 'eladio', side: 'R', elbow: [0.62, 0.12, 0.25], wrist: [0.36 + osc(t, 0.4, 0.02), 0.04, 0.08], grip: 'relax', front: [0, 0, -1] }]
    },
    carMike: {
      set: 'mikeCar', env: ENV.mikeCar, grade: G.teal, setOpt: { noSeat: true },
      cam: (t, H) => frame(H[0], { x: 0.68, y: 0.42, f: 0.33, az: 2.07, el: 0.1, fov: 40 }),
      actors: (t) => [
        { look: 'mikeCar', pose: { pos: [-0.4, 0.56, -0.05], yaw: 0, nk: [0.05, 1.05 + osc(t, 0.3, 0.06), 0.03], sp: [0, 0.25, 0], noLegs: true, hL: [0.15, -0.05, 0.4], hR: [-0.2, -0.05, 0.42], gL: 'grip', gR: 'grip' } },
        { look: 'jesseHood', pose: { pos: [0.4, 0.56, -0.05], yaw: 0, nk: [0.02, -1.0, 0], noLegs: true, hL: [0.2, -0.25, 0.25], hR: [-0.2, -0.25, 0.25] } }
      ]
    },
    gus: {
      set: 'gusRoom', env: env([0.5, -0.3, -0.8], [1.0, 0.82, 0.62], [0.36, 0.3, 0.26], [0.18, 0.14, 0.11]), grade: G.warm,
      cam: (t, H) => frame([0, 1.6, 0.05], { x: 0.5, y: 0.36, f: 0.7, az: -0.1, el: 0.02, fov: 32 }),
      actors: (t) => {
        const lunge = t > 125.65 && t < 126 ? K.ease((t - 125.65) / 0.25) : t > 111.75 && t < 112.1 ? K.ease((t - 111.75) / 0.3) : 0;
        return [{ look: 'gusSuit', pose: { pos: [lunge * -0.5, 1.0 - lunge * 0.1, lunge * 0.5], yaw: 0.1 - lunge * 0.8, lean: lunge * 0.6, nk: [0.0, 0.4, 0.02], hL: [0.25, -0.3, 0.06], hR: [-0.25, -0.3, 0.06] } }];
      }
    },
    mikeSide: {
      set: 'mikeCar', env: ENV.mikeCar, grade: G.teal,
      cam: (t, H) => frame(H[0], { x: 0.56, y: 0.45, f: 0.5, az: 1.5, el: 0.02, fov: 34 }),
      actors: (t) => [{ look: 'mikeCar', pose: { pos: [-0.4, 0.56, -0.05], yaw: 0, nk: [0.05, 0.72, 0.03], noLegs: true, hL: [0.15, -0.05, 0.4], hR: [-0.2, -0.05, 0.42], gL: 'grip', gR: 'grip' } }]
    },
    mikeClose: {
      set: 'mikeCar', env: ENV.mikeCar, grade: G.teal,
      cam: (t, H) => frame(H[0], { x: 0.53, y: 0.4, f: 0.6, az: 1.1, el: 0.02, fov: 32 }),
      actors: (t) => [{ look: 'mikeCar', pose: { pos: [-0.4, 0.56, -0.05], yaw: 0, nk: [0.04, 0.9, 0.03], sp: [0, 0.2, 0], noLegs: true, hL: [0.15, -0.05, 0.4], hR: [-0.2, -0.05, 0.42], gL: 'grip', gR: 'grip' } }]
    },
    waltRead: {
      set: 'readDark', env: env([0.5, -0.3, -0.8], [0.95, 0.85, 0.7], [0.24, 0.24, 0.26], [0.12, 0.12, 0.13]), grade: G.teal,
      cam: (t, H) => frame(H[0], { x: 0.6, y: 0.4, f: 0.7, az: 0.0, el: 0.0, fov: 32 }),
      actors: (t) => [{ look: 'waltNavy', pose: { pos: [0, 1.0, 0], yaw: 0, nk: [0.15, -0.25, 0], hRw: [-0.2, 1.42, 0.28], gR: 'pinch', hL: [0.25, -0.3, 0.06] }, prop: 'paper' }]
    },
    ring: {
      set: 'ringTable', env: ENV.cards, grade: G.warm,
      cam: (t, H) => lookAt([0.04, 0.3, 0.2], [0.02, 0.0, 0.0], 40),
      arms: (t) => [{ look: 'waltNavy', side: 'L', elbow: [-0.3, 0.06, 0.15], wrist: [-0.08 + osc(t, 0.6, 0.004), 0.03, 0.02], grip: 'flat', front: [0, 0, 1], ring: true }]
    },
    warehouse: {
      set: 'shelves', env: ENV.warehouse, grade: G.teal,
      cam: (t) => lookAt([1.2, 0.55, 2.0], [0.4, 2.2, -2.0], 46, 0.08),
      actors: () => []
    },
    aztek: {
      set: 'aztek', env: ENV.aztek, grade: G.warm,
      cam: (t, H) => lookAt([-1.9, 0.55, 5.0], [0.0, 0.95, 2.1], 40),
      actors: () => []
    },
    clip: {
      set: 'drums', env: ENV.warehouse, grade: G.teal,
      cam: (t, H) => frame(H[0], { x: 0.5, y: 0.25, f: 0.25, az: 0.15, el: 0.3, fov: 36 }),
      actors: (t) => {
        const k = ((t - 113.97) % 1.3 + 1.3) % 1.3;
        const up = k < 0.35;
        return [{ look: 'waltNavy', pose: { pos: [0.05, 0.98, -0.25], yaw: 0, lean: 0.5, nk: [0.45, -0.1, 0], hRw: up ? [-0.12, 1.45, 0.25] : [-0.2, 0.95, 0.2], gR: 'pinch', hLw: [0.16, 1.0, 0.16], gL: 'flat' }, prop: 'clipboard' }];
      }
    },
    green: {
      set: 'greenMachine', env: ENV.warehouse, grade: G.teal,
      cam: (t) => lookAt([0.0, 1.2, 0.9], [0.0, 1.2, -0.8], 40),
      actors: () => []
    },
    garlic: {
      set: 'garlic', env: ENV.garlic, grade: G.warm,
      cam: (t, H) => lookAt([0.03, 0.1, 0.13], [0.0, 0.02, 0.0], 44),
      actors: () => []
    },
    oldMan: {
      set: 'oldMan', env: ENV.oldMan, grade: G.cold,
      cam: (t, H) => frame(H[0], { x: 0.6, y: 0.35, f: 0.35, az: -0.6, el: 0.0, fov: 34 }),
      actors: (t) => [{ look: 'old', pose: { pos: [0.35, 1.0, 0], yaw: -1.0, nk: [-0.15, 0, 0], hRw: [0.1, 1.75 + osc(t, 0.5, 0.03), -0.05], gR: 'grip', hL: [0.25, -0.3, 0.06] }, prop: 'cane' }]
    }
  };

  window.BreakShots = { SHOTS, ENV, G, osc, keys, frame };
})();
